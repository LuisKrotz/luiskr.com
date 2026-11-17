/**
 * @file cardstack-parity.spec.ts
 * @description Dev-server vs production-build parity contract — "every
 * subpixel needs to behave the same, and look the same" between `vite dev`
 * and `vite preview` on the same device profile. Covers the homepage deck,
 * one project-internals page, and one legal page on BOTH servers in the
 * same test. The homepage check waits for the deck's fully settled end state,
 * then compares (a) every card's computed transform + subpixel bounding
 * rect EXACTLY (geometry must be bit-identical — the flicker contract), and
 * (b) a pixelmatch diff of the deck screenshot under an AA/dither threshold
 * with a small diff budget. Byte-identical pixels are NOT achievable across
 * delivery modes: dev modules vs bundled+adopted stylesheets produce
 * identical geometry/styles/content (proven: same-env pairs diff 0) but
 * Chromium's tile/layer raster history differs, shifting gradient dither
 * phases by ±1-2/255 inside soft gradient regions (floor pool, card-edge
 * AA). Real regressions produce coherent diffs an order of magnitude past
 * the budget. Run with the dev server up:
 * `DEV_URL=http://localhost:5199 yarn playwright test cardstack-parity`.
 */
import { test, expect, type Page, type Browser } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Card-stack selectors — mirror CARD_STACK_CLASSES / CARD_STACK_SELECTORS. */
const CARD = '.card-stack-card'
const DECK = '.card-stack-deck'
const PENDING = 'card-stack-deck--pending'
const SECTION = 'card-stack'

/** Non-deck view selectors — mirror the widget/media class tokens. */
const CUSTOM_CAROUSEL = 'custom-carousel'
const MEDIA_FIGURE = 'media-figure'
const HIGH_LAYER = 'img.render-media--high'
const MEDIA_MOSAIC = 'media-mosaic'

/** Dev server origin — the comparison baseline against the preview build. */
const DEV_URL = process.env.DEV_URL || 'http://localhost:5199'

/**
 * Shadow-piercing DOM helpers, serialized into page.evaluate calls. The
 * whole app lives under <app-root>'s shadow tree, so plain querySelector
 * sees nothing.
 */
const DEEP_JS = `
  globalThis.__lkDeepAll = (root, sel, out = []) => {
    root.querySelectorAll(sel).forEach((el) => out.push(el))
    root.querySelectorAll('*').forEach((el) => { if (el.shadowRoot) globalThis.__lkDeepAll(el.shadowRoot, sel, out) })
    return out
  }
  globalThis.__lkDeepOne = (root, sel) => globalThis.__lkDeepAll(root, sel)[0] || null
`

/**
 * Animation freeze helper — collects every animation targeting the subtree
 * (pseudo-elements and nested shadow trees included) and pins each at a
 * deterministic phase: infinite loops at t=0 paused, finite runs finished.
 * Idempotent — safe to re-run before every sample/screenshot.
 */
const FREEZE_JS = `
  globalThis.__lkFreeze = (root) => {
    const anims = new Set()
    globalThis.__lkDeepAll(root, '*').forEach((el) => {
      ;(el.getAnimations ? el.getAnimations({ subtree: true }) : []).forEach((a) => anims.add(a))
    })

    // Cover-ladder convergence — mirrors load.ts retire(): each confirmed
    // rung mounts a successor --high img over the painted layer and the
    // layers beneath it leave on a silent 750ms fuse after its own load.
    // That fuse can always land AFTER any fixed quiet window (a probe
    // resolving mid-window pushes retire past capture), and the extra
    // layer is a real sibling that shifts every child index after it.
    // Terminal ladder state is exactly one --high layer — a failed
    // successor removes itself — so removing every layer below the top
    // one reproduces the application's own steady state, deterministically.
    globalThis.__lkDeepAll(root, '${MEDIA_FIGURE}').forEach((fig) => {
      const highs = (fig.shadowRoot || fig).querySelectorAll('${HIGH_LAYER}')

      highs.forEach((el, i) => {
        if (i < highs.length - 1) el.remove()
      })
    })

    // Mosaic repack drain — the host ResizeObserver coalesces repacks
    // into one rAF via scheduleLayout; a queued pass can land between the
    // geometry sample and the capture and shift every tile. Cancelling
    // the pending rAF then running relayout() is idempotent (the pack is
    // width-keyed) and writes the terminal tile styles deterministically.
    globalThis.__lkDeepAll(root, '${MEDIA_MOSAIC}').forEach((m) => {
      if (m._rafId) {
        cancelAnimationFrame(m._rafId)
        m._rafId = null
      }

      m.relayout?.()
    })
    anims.forEach((a) => {
      try {
        if (a.effect && a.effect.getTiming && a.effect.getTiming().iterations === Infinity) {
          a.currentTime = 0
          a.pause()
        } else {
          a.finish()
        }
      } catch {
        a.pause()
      }
    })
  }
`

/**
 * Per-card geometry snapshot: the computed transform string plus the
 * subpixel bounding box, taken after all animations have drained.
 */
interface CardGeom {
  t: string
  x: number
  y: number
  w: number
  h: number
}

/** Full deck snapshot: card geometries, deck box, pending flag. */
interface DeckSnapshot {
  cards: CardGeom[]
  deck: { x: number; y: number; w: number; h: number; pending: boolean }
}

/**
 * Waits for the deck's settled end state: at least one card mounted, the
 * --pending gate lifted, webfonts resolved, every card image decoded, and
 * zero running CSS/JS animations — then a self-stability check (two geometry
 * samples 300ms apart must be identical) so the snapshot can't land
 * mid-transition.
 * @param page Playwright page on the loaded homepage.
 */
const settle = async (page: Page): Promise<void> => {
  await page.locator(CARD).first().waitFor({ state: 'attached', timeout: 30000 })
  await expect(page.locator(DECK), 'deck lifts --pending').not.toHaveClass(new RegExp(PENDING), {
    timeout: 30000,
  })

  await page.waitForFunction(() => document.fonts.status === 'loaded', null, {
    timeout: 30000,
  })

  await page.waitForFunction(
    (arg) => {
      eval(arg.js)

      return globalThis
        .__lkDeepAll(document, `${arg.sel} img`)
        .every(
          (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0
        )
    },
    { sel: SECTION, js: DEEP_JS },
    { timeout: 30000 }
  )

  // Settle-scoped animation drain — ambient page effects (skeletons, sheens)
  // animate forever, so wait only inside the card-stack subtree. A timeout
  // here is tolerated: the two-sample stability check below is the real
  // guarantee that the snapshot can't land mid-transition.
  await page
    .waitForFunction(
      (arg) => {
        eval(arg.js)

        return (
          globalThis.__lkDeepOne(document, arg.sel)?.getAnimations({ subtree: true }).length === 0
        )
      },
      { sel: SECTION, js: DEEP_JS },
      { timeout: 15000 }
    )
    .catch(() => {})

  // Poll until two consecutive 300ms-apart samples are identical — the
  // snapshot can't land mid-transition even if an engine skipped the
  // animations registry. The iteration count IS the metric: post-reveal
  // churn (the load flicker) shows up as a long settle tail.
  const sample = () =>
    page.locator(CARD).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))

  let a = await sample()
  let stable = false

  for (let i = 0; i < 40 && !stable; i++) {
    await page.waitForTimeout(300)

    const b = await sample()

    stable = JSON.stringify(b) === JSON.stringify(a)
    a = b
  }

  expect(stable, 'deck never reached a stable pose — geometry still churns').toBe(true)

  // Stability alone can converge on a pre-layout frame (absolute, JS-sized
  // cards read 0×0 before the first pose pass) — the settled reference
  // must be real geometry, or both envs could "match" on emptiness.
  expect(
    a.every((r) => r.width > 0 && r.height > 0),
    'settled deck contains boxless cards — the sample predates layout'
  ).toBe(true)

  // Composite stability — two byte-identical deck screenshots 400ms apart.
  // A fading veil (loading overlay), sheen sweep, or canvas repaint lands a
  // uniform ±2/255 shift across every pixel; geometry alone can't see it.
  let s1 = await page.locator(DECK).screenshot()
  let pixelStable = false

  for (let i = 0; i < 40 && !pixelStable; i++) {
    await page.waitForTimeout(400)

    const s2 = await page.locator(DECK).screenshot()

    pixelStable = s1.equals(s2)
    s1 = s2
  }

  expect(pixelStable, 'deck pixels never went still — an overlay/effect is still compositing').toBe(
    true
  )
}

/**
 * Captures the settled deck geometry + a section screenshot on one server.
 * @param browser Shared browser.
 * @param baseURL Server origin to load.
 * @param contextOpts Device emulation for the fresh context.
 * @returns Deck snapshot and PNG bytes of the card-stack section.
 */
const capture = async (
  browser: Browser,
  baseURL: string,
  contextOpts: Parameters<Browser['newContext']>[0]
): Promise<{ geom: DeckSnapshot; shot: Buffer }> => {
  const context = await browser.newContext(contextOpts)
  const page = await context.newPage()

  try {
    await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => window.scrollTo(0, 0))
    await settle(page)

    const geom = await page.evaluate(
      ({ CARD: cardSel, DECK: deckSel, PENDING: pendingCls, js }) => {
        eval(js)

        const cards = globalThis.__lkDeepAll(document, cardSel).map((el) => {
          const r = el.getBoundingClientRect()

          return { t: getComputedStyle(el).transform, x: r.x, y: r.y, w: r.width, h: r.height }
        })
        const deckEl = globalThis.__lkDeepOne(document, deckSel)!
        const dr = deckEl.getBoundingClientRect()

        return {
          cards,
          deck: {
            x: dr.x,
            y: dr.y,
            w: dr.width,
            h: dr.height,
            pending: deckEl.classList.contains(pendingCls),
          },
        }
      },
      { CARD, DECK, PENDING, js: DEEP_JS }
    )

    // Deck-only pixels — the section box is 100dvh and sweeps in fixed
    // overlays (animated logo, theme icon, cookie banner) whose animation
    // phase legitimately differs between captures. The flicker contract
    // lives on the card pile itself.
    const shot = await page.locator(DECK).screenshot()

    return { geom, shot }
  } finally {
    await context.close()
  }
}

/**
 * Non-deck routes under the same parity contract — mirrors ROUTE_PATHS and
 * the VIEW_TAGS the router mounts: one project-internals page (coza — a real
 * EN slug carrying carousels + long copy) and one legal page (privacy-policy,
 * the densest legal doc). Region screenshots mask canvas/video surfaces so
 * ambient engine paint can't rephase between the two captures.
 */
const ROUTES = [
  { name: 'project-internals', path: '/portfolio/coza/', view: 'view-project' },
  { name: 'legal', path: '/privacy-policy/', view: 'view-legal' },
] as const

/**
 * Waits for a non-deck view's settled end state: view host attached, webfonts
 * resolved, every in-view image decoded, in-view animations drained (tolerated
 * timeout — ambient surfaces may loop), then identical two-sample DOM-geometry
 * probes and a pixel-stable masked region screenshot — the same guarantee the
 * deck settle gives, generalized to any view subtree.
 * @param page Playwright page on the loaded route.
 * @param viewSel View host selector (e.g. `view-legal`).
 */
const settleView = async (page: Page, viewSel: string): Promise<void> => {
  await page.locator(viewSel).first().waitFor({ state: 'attached', timeout: 30000 })

  // Autoplay latch — armed BEFORE the scroll passes below. A carousel's
  // 5s dwell advances its track scrollLeft whenever it sits fully
  // visible, and scrollLeft is pure geometry the MutationObserver never
  // sees: each env parks at a dwell-count-dependent index (timing is
  // delivery-mode sensitive — dev's module waterfall vs prod's bundle).
  // Latching _autoplayPermanentlyStopped up front keeps the parked index
  // at the deterministic mount state on both envs. No synthetic
  // _jumpToSlide — a programmatic scroll computed against a mid-layout
  // track lands differently per env and its teleport recovery diverges.
  await page.evaluate(
    (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)

      if (!view) return

      globalThis.__lkDeepAll(view.shadowRoot || view, arg.sel).forEach((cc) => {
        ;(cc as unknown as { _stopAutoplay?: (permanently?: boolean) => void })._stopAutoplay?.(
          true
        )
      })
    },
    { view: viewSel, sel: CUSTOM_CAROUSEL, js: DEEP_JS }
  )

  await page.waitForFunction(() => document.fonts.status === 'loaded', null, {
    timeout: 30000,
  })

  // DOM-quiescence observer — armed FIRST so every progressive-pipeline
  // mutation counts toward the quiet window: cover-ladder rung swaps
  // add/remove <source> children, draw-text writers insert per-char spans
  // (JS timers, not WebAnimations), media-figure--loaded stamps flip
  // classes, and lazy-img fetches fire load→stamp churn. A mutation-free
  // 500ms window inside the view means every pipeline has fully committed —
  // capturing earlier lets one env land mid-upgrade while the other is done.
  await page.evaluate(
    (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)
      const w = window as unknown as { __lkMutLast?: number; __lkMutArmed?: boolean }

      if (view && !w.__lkMutArmed) {
        w.__lkMutArmed = true
        w.__lkMutLast = Date.now()

        // Sweep — latches any carousel that mounted between the up-front
        // latch and this observer arm (the fonts wait can take seconds).
        globalThis.__lkDeepAll(view.shadowRoot || view, arg.sel).forEach((cc) => {
          ;(cc as unknown as { _stopAutoplay?: (permanently?: boolean) => void })._stopAutoplay?.(
            true
          )
        })

        new MutationObserver((records) => {
          w.__lkMutLast = Date.now()

          // Late-mounting carousels (e.g. portfolio-related arriving with
          // its translations fetch) join after the up-front latch — pin
          // their autoplay flag as they connect or they'd start dwelling.
          const latch = (cc: Element) => {
            ;(cc as unknown as { _stopAutoplay?: (permanently?: boolean) => void })._stopAutoplay?.(
              true
            )
          }

          for (const rec of records) {
            rec.addedNodes.forEach((n) => {
              if (n.nodeType !== 1) return

              const el = n as Element

              if (el.tagName === 'CUSTOM-CAROUSEL') latch(el)

              globalThis.__lkDeepAll(el, 'custom-carousel').forEach(latch)
            })
          }
        }).observe(view.shadowRoot || view, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        })
      }
    },
    { view: viewSel, sel: CUSTOM_CAROUSEL, js: DEEP_JS }
  )

  // Deferred-media commit — below-fold imgs are `loading="lazy"` (and some
  // figure imgs carry no src until their rung resolves on intersection), so
  // a top-of-page load leaves them mid-stream or untouched — the region
  // screenshot spans the full element height and would capture two different
  // paint states across envs. Step through the page so every img intersects
  // and every srcset-deferred figure commits. Internal blocks also carry
  // `content-visibility:auto` + `contain-intrinsic-size:auto` — an
  // off-screen block KEEPS the height it last rendered at, so a block that
  // painted while its fonts/media were still settling freezes at a stale
  // height and the whole page's geometry shifts below it. The slow pass
  // (half-viewport steps, ~2 frame gaps) puts every block on-screen once;
  // the SECOND pass after media+quiescence re-renders each block at its
  // final content size — the remembered size then holds deterministically.
  const scrollPass = async () => {
    const { height, vh } = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      vh: window.innerHeight,
    }))

    for (let y = 0; y < height; y += Math.max(1, Math.floor(vh / 2))) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y)
      await page.waitForTimeout(80)
    }

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(200)
  }

  await scrollPass()

  await page.waitForFunction(
    (arg) => {
      const w = window as unknown as { __lkMutLast?: number }

      return Date.now() - (w.__lkMutLast || 0) > 500
    },
    { view: viewSel, js: DEEP_JS },
    { timeout: 90000, polling: 200 }
  )

  // Network-idle — DOM quiescence alone fires mid-flight: a cover-ladder
  // probe in flight produces no mutations until its src swap lands, so a
  // >500ms fetch gap masquerades as done. networkidle only holds once every
  // probe/img/font request has drained — the true end of the climb.
  await page.waitForLoadState('networkidle', { timeout: 60000 })

  // Every resolved-source img fully decoded — sampled AFTER quiescence so
  // the ladder has stopped swapping src and `complete` reads the terminal
  // state, not a mid-climb frame.
  await page.waitForFunction(
    (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)

      return (
        !!view &&
        globalThis.__lkDeepAll(view.shadowRoot || view, 'img').every((img) => {
          const el = img as HTMLImageElement

          // An img with no resolved source has nothing to decode — a
          // terminal placeholder state, identical on both envs.
          if (!el.currentSrc && !el.src) return true

          // Not in the render tree (closed/inert rows, cv:hidden subtrees)
          // — the browser never dispatches the fetch, terminal by design.
          if (el.getClientRects().length === 0) return true

          return el.complete && el.naturalWidth > 0
        })
      )
    },
    { view: viewSel, js: DEEP_JS },
    { timeout: 30000 }
  )

  // Horizontal wake — carousel slides are cv:auto children of the
  // TRACK's own scroll context: a slide that never intersects the track
  // viewport keeps a zero/stale intrinsic size at capture (the sliver
  // collapse), independent of the page-level passes. The dwell latch
  // prevents autoplay from ever bringing those slides on-screen, so the
  // harness steps each track through its range while the carousel is in
  // view — every slide renders once and keeps its remembered size — then
  // restores the recorded scrollLeft (parked state is identical across
  // envs, so the restore re-parks identically too).
  await page.evaluate(
    async (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)

      if (!view) return

      for (const cc of globalThis.__lkDeepAll(view.shadowRoot || view, arg.sel)) {
        cc.scrollIntoView({ block: 'center' })

        const track = (cc as HTMLElement).shadowRoot?.querySelector('.carousel-track')

        if (!track) continue

        const orig = track.scrollLeft

        for (let x = 0; x < track.scrollWidth; x += Math.max(1, track.clientWidth)) {
          track.scrollLeft = x

          await new Promise((r) => requestAnimationFrame(r))
        }

        track.scrollLeft = orig
      }
    },
    { view: viewSel, sel: CUSTOM_CAROUSEL, js: DEEP_JS }
  )

  // Post-sweep drain — the track sweep flags every slide loadable and
  // fires a fresh wave of media fetches, so the networkidle + decode
  // gates must hold again before the final-size pass.
  await page.waitForLoadState('networkidle', { timeout: 60000 })

  await page.waitForFunction(
    (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)

      return (
        !!view &&
        globalThis.__lkDeepAll(view.shadowRoot || view, 'img').every((img) => {
          const el = img as HTMLImageElement

          if (!el.currentSrc && !el.src) return true

          if (el.getClientRects().length === 0) return true

          return el.complete && el.naturalWidth > 0
        })
      )
    },
    { view: viewSel, js: DEEP_JS },
    { timeout: 30000 }
  )

  // Final-size re-render pass — every content-visibility:auto block lays
  // out once more with all media/fonts committed AND every slide already
  // rendered by the sweep, so its remembered intrinsic size is the
  // terminal one on both envs.
  await scrollPass()

  await page.waitForFunction(
    (arg) => {
      const w = window as unknown as { __lkMutLast?: number }

      return Date.now() - (w.__lkMutLast || 0) > 500
    },
    { view: viewSel, js: DEEP_JS },
    { timeout: 60000, polling: 200 }
  )

  await page.evaluate(() => window.scrollTo(0, 0))

  // draw-text writers terminal — the scroll-back re-enters every
  // viewport-triggered writer still pending, and each one types char
  // spans for ~1-2s. Sampling mid-type diffs span counts, so wait until
  // no writer is visible-without-done (un-triggered/pending writers are
  // terminal by definition — they emit no char spans).
  await page
    .waitForFunction(
      (arg) => {
        eval(arg.js)

        const view = globalThis.__lkDeepOne(document, arg.view)

        return (
          !!view &&
          globalThis.__lkDeepAll(view.shadowRoot || view, 'draw-text').every((el) => {
            const cls = el.classList

            return !cls.contains('draw-text--visible') || cls.contains('draw-text--done')
          })
        )
      },
      { view: viewSel, js: DEEP_JS },
      { timeout: 30000, polling: 100 }
    )
    .catch(() => {})

  // Cover-ladder convergence — each published rung mounts a successor
  // --high img that retires the layers beneath it on a silent 750ms
  // setTimeout fuse (MEDIA_LAYER_RETIRE). A figure mid-climb holds two
  // --high layers, which shifts its sibling indices by one — and the
  // fuse outlives the 500ms quiet window, so mutation-quiet alone can
  // capture it mid-retire. Terminal ladder state is exactly one --high
  // layer per figure; a failed successor removes itself, so ≤1 is
  // reached on every path (timeout tolerated — the geometry-stable loop
  // below still guards).
  await page
    .waitForFunction(
      (arg) => {
        eval(arg.js)

        const view = globalThis.__lkDeepOne(document, arg.view)

        return (
          !!view &&
          globalThis.__lkDeepAll(view.shadowRoot || view, arg.fig).every((fig) => {
            const root = (fig as HTMLElement).shadowRoot || fig

            return root.querySelectorAll(arg.layer).length <= 1
          })
        )
      },
      { view: viewSel, fig: MEDIA_FIGURE, layer: HIGH_LAYER, js: DEEP_JS },
      { timeout: 30000, polling: 200 }
    )
    .catch(() => {})

  // Canonical re-park — every progressive path (fit observer, visibility
  // applications, manifest rebuilds) re-calls _jumpToSlide(currentIndex)
  // and the LAST write wins; one computed against a mid-layout track
  // (26px slivers before media sizes resolve) leaves a stale scrollLeft
  // behind. With layout final, goTo(0) walks the public path — jump,
  // clone teleport, currentIndex/active-class sync — and lands the same
  // parked state on both envs. The spring tail is absorbed by the
  // mutation-quiet window and the geometry-stability loop below.
  await page.evaluate(
    (arg) => {
      eval(arg.js)

      const view = globalThis.__lkDeepOne(document, arg.view)

      if (!view) return

      globalThis.__lkDeepAll(view.shadowRoot || view, arg.sel).forEach((cc) => {
        ;(cc as unknown as { goTo?: (idx: number) => void }).goTo?.(0)
      })
    },
    { view: viewSel, sel: CUSTOM_CAROUSEL, js: DEEP_JS }
  )

  // One last mutation-quiet window — the writers' done-state unmounts
  // (char spans → word nodes), the carousel pin's debounced class sync,
  // and any late layer retirements are the final DOM writes before
  // capture. 1000ms outlives the 750ms retire fuse and the 150ms
  // scroll-teleport debounce so no silent-fuse writer lands mid-capture.
  await page.waitForFunction(
    (arg) => {
      const w = window as unknown as { __lkMutLast?: number }

      return Date.now() - (w.__lkMutLast || 0) > 1000
    },
    { view: viewSel, js: DEEP_JS },
    { timeout: 60000, polling: 200 }
  )

  await page
    .waitForFunction(
      (arg) => {
        eval(arg.js)

        const view = globalThis.__lkDeepOne(document, arg.view)

        return !!view && (view.shadowRoot || view).getAnimations().length === 0
      },
      { view: viewSel, js: DEEP_JS },
      { timeout: 15000 }
    )
    .catch(() => {})

  // Freeze every in-view animation at a deterministic phase — views carry
  // perpetual loops (internal-title-marquee on view-project, sheens) that
  // never drain and sample at a different phase per load. Infinite
  // iterations pause at t=0; finite transitions finish() to their natural
  // end state. Both envs then capture the same still frame — a real
  // divergence still diffs, a phase offset can't. Re-frozen inside each
  // sample so animations spawned late can't resume the churn.
  await page.evaluate(
    (arg) => {
      eval(arg.js)
      eval(arg.freeze)

      const view = globalThis.__lkDeepOne(document, arg.view)

      if (view) globalThis.__lkFreeze(view.shadowRoot || view)
    },
    { view: viewSel, js: DEEP_JS, freeze: FREEZE_JS }
  )

  // Two identical samples 300ms apart — the same mid-transition guard the
  // deck uses, over the whole view subtree's geometry.
  const sample = () =>
    page.evaluate(
      ({ view, js, freeze }) => {
        eval(js)
        eval(freeze)

        const host = globalThis.__lkDeepOne(document, view)!

        globalThis.__lkFreeze(host.shadowRoot || host)

        return globalThis
          .__lkDeepAll(host.shadowRoot || host, '*')
          .map((el) => el.getBoundingClientRect().toJSON())
      },
      { view: viewSel, js: DEEP_JS, freeze: FREEZE_JS }
    )

  let a = await sample()
  let stable = false

  for (let i = 0; i < 40 && !stable; i++) {
    await page.waitForTimeout(300)

    const b = await sample()

    stable = JSON.stringify(b) === JSON.stringify(a)
    a = b
  }

  expect(stable, `${viewSel} never reached a stable layout — geometry still churns`).toBe(true)

  const region = page.locator(viewSel)
  const mask = [page.locator(`${viewSel} canvas`), page.locator(`${viewSel} video`)]

  await page.evaluate(
    (arg) => {
      eval(arg.js)
      eval(arg.freeze)

      const view = globalThis.__lkDeepOne(document, arg.view)

      if (view) globalThis.__lkFreeze(view.shadowRoot || view)
    },
    { view: viewSel, js: DEEP_JS, freeze: FREEZE_JS }
  )

  let s1 = await region.screenshot({ mask })
  let pixelStable = false

  for (let i = 0; i < 40 && !pixelStable; i++) {
    await page.waitForTimeout(400)

    const s2 = await region.screenshot({ mask })

    pixelStable = s1.equals(s2)
    s1 = s2
  }

  expect(
    pixelStable,
    `${viewSel} pixels never went still — an overlay/effect is still compositing`
  ).toBe(true)
}

/**
 * Captures a view's settled geometry + masked region screenshot on one
 * server. Geometry is the full descendant rect map — every subpixel of
 * layout, not a sampled subset.
 * @param browser Shared browser.
 * @param baseURL Server origin to load.
 * @param route Route path + view selector under test.
 * @param contextOpts Device emulation for the fresh context.
 * @returns View snapshot and PNG bytes of the masked region.
 */
const captureView = async (
  browser: Browser,
  baseURL: string,
  route: (typeof ROUTES)[number],
  contextOpts: Parameters<Browser['newContext']>[0]
): Promise<{ geom: unknown; shot: Buffer }> => {
  const context = await browser.newContext(contextOpts)
  const page = await context.newPage()

  try {
    await page.goto(`${baseURL}${route.path}`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => window.scrollTo(0, 0))
    await settleView(page, route.view)

    const geom = await page.evaluate(
      ({ view, js, freeze }) => {
        eval(js)
        eval(freeze)

        const host = globalThis.__lkDeepOne(document, view)!

        globalThis.__lkFreeze(host.shadowRoot || host)

        // Path-keyed rect map — each element's key is its child-index path
        // under the view host (`#` marks a shadow-root boundary), so an
        // extra or missing node diffs as ONE key instead of misaligning
        // every sibling that follows it. Non-rendering metadata children
        // (SOURCE/TRACK/PARAM — always 0×0, never painted, void elements)
        // are skipped AND don't consume an index: their presence is
        // ladder/delivery markup state, not geometry — a <source> that one
        // env emits and the other doesn't can't shift the <img> beside it.
        const SKIP = { SOURCE: 1, TRACK: 1, PARAM: 1 } as Record<string, number>
        const map: Record<string, unknown> = {}

        const walkChildren = (root: ParentNode, path: string, mark: string) => {
          let idx = 0

          Array.from(root.children).forEach((k) => {
            if (k.tagName in SKIP) return

            const p = `${path}${mark}${idx++}`

            map[`${k.tagName}@${p}`] = k.getBoundingClientRect().toJSON()
            walk(k, p)
          })
        }

        const walk = (el: Element, path: string) => {
          walkChildren(el, path, '/')

          if (el.shadowRoot) walkChildren(el.shadowRoot, path, '/#')
        }

        walk(host, '')

        return { host: host.getBoundingClientRect().toJSON(), map }
      },
      { view: route.view, js: DEEP_JS, freeze: FREEZE_JS }
    )

    const shot = await page.locator(route.view).screenshot({
      mask: [page.locator(`${route.view} canvas`), page.locator(`${route.view} video`)],
    })

    return { geom, shot }
  } finally {
    await context.close()
  }
}

test.describe('Dev/prod pixel parity', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()

    try {
      const page = await context.newPage()
      const res = await page.goto(DEV_URL, { timeout: 10000 }).catch(() => null)

      test.skip(
        !res || !res.ok(),
        `dev server unreachable at ${DEV_URL} — start it and set DEV_URL`
      )
    } finally {
      await context.close()
    }
  })

  test('dev and prod paint identical geometry and pixels', async ({
    browser,
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    deviceScaleFactor,
    userAgent,
    defaultBrowserType,
  }, testInfo) => {
    test.setTimeout(120000)

    const contextOpts = {
      viewport,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      userAgent,
    }

    const prod = await capture(browser, baseURL || 'http://localhost:4173', contextOpts)
    const dev = await capture(browser, DEV_URL, contextOpts)

    // Every subpixel identical — computed transforms and float bounding
    // rects must match exactly across the two environments.
    expect(dev.geom, `${defaultBrowserType}: geometry dev≠prod`).toEqual(prod.geom)

    // Deck pixels — byte-equality is impossible across delivery modes
    // (dev modules vs bundled+adopted sheets shift Chromium's raster state
    // and rephase ordered dithering inside soft gradients: same-env pairs
    // diff 0, cross-env pairs diff ±1-2/255 along gradient interiors and
    // rotated-edge AA). The contract therefore asserts LOOK-IDENTICAL:
    // pixelmatch at the standard AA threshold with includeAA off, capped at
    // a small fraction of the clip. Any real divergence — wrong cover,
    // missing copy, a mid-fade veil, a shifted pose — lands coherent diffs
    // far past the budget and fails.
    const devImg = PNG.sync.read(dev.shot)
    const prodImg = PNG.sync.read(prod.shot)

    expect(
      { w: devImg.width, h: devImg.height },
      `${defaultBrowserType}: screenshot dimensions dev≠prod`
    ).toEqual({ w: prodImg.width, h: prodImg.height })

    const diff = new PNG({ width: devImg.width, height: devImg.height })
    const diffPixels = pixelmatch(
      devImg.data,
      prodImg.data,
      diff.data,
      devImg.width,
      devImg.height,
      { threshold: 0.05, includeAA: false }
    )
    const diffBudget = Math.ceil(devImg.width * devImg.height * 0.005)

    if (diffPixels > 0) {
      mkdirSync(testInfo.outputDir, { recursive: true })
      writeFileSync(join(testInfo.outputDir, 'dev.png'), dev.shot)
      writeFileSync(join(testInfo.outputDir, 'prod.png'), prod.shot)
      writeFileSync(join(testInfo.outputDir, 'diff.png'), PNG.sync.write(diff))
    }

    expect(
      diffPixels <= diffBudget,
      `${defaultBrowserType}: ${diffPixels} pixels differ dev≠prod (budget ${diffBudget}, see ${testInfo.outputDir})`
    ).toBe(true)
  })

  test('dev and prod paint identical internals + legal pages', async ({
    browser,
    baseURL,
    viewport,
    isMobile,
    hasTouch,
    deviceScaleFactor,
    userAgent,
    defaultBrowserType,
  }, testInfo) => {
    test.setTimeout(240000)

    const contextOpts = {
      viewport,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      userAgent,
    }

    for (const route of ROUTES) {
      const prod = await captureView(
        browser,
        baseURL || 'http://localhost:4173',
        route,
        contextOpts
      )
      const dev = await captureView(browser, DEV_URL, route, contextOpts)

      // Every subpixel identical — DOM shape (path keys) and per-key rects
      // must match exactly across the two environments.
      const devMap = (dev.geom as { map: Record<string, unknown>; host: unknown }).map
      const prodMap = (prod.geom as { map: Record<string, unknown>; host: unknown }).map

      expect(
        Object.keys(devMap).sort(),
        `${defaultBrowserType} ${route.name}: DOM shape dev≠prod`
      ).toEqual(Object.keys(prodMap).sort())

      expect(devMap, `${defaultBrowserType} ${route.name}: geometry dev≠prod`).toEqual(prodMap)

      expect(
        (dev.geom as { host: unknown }).host,
        `${defaultBrowserType} ${route.name}: view host box dev≠prod`
      ).toEqual((prod.geom as { host: unknown }).host)

      const devImg = PNG.sync.read(dev.shot)
      const prodImg = PNG.sync.read(prod.shot)

      expect(
        { w: devImg.width, h: devImg.height },
        `${defaultBrowserType} ${route.name}: screenshot dimensions dev≠prod`
      ).toEqual({ w: prodImg.width, h: prodImg.height })

      const diff = new PNG({ width: devImg.width, height: devImg.height })
      const diffPixels = pixelmatch(
        devImg.data,
        prodImg.data,
        diff.data,
        devImg.width,
        devImg.height,
        { threshold: 0.05, includeAA: false }
      )
      const diffBudget = Math.ceil(devImg.width * devImg.height * 0.005)

      if (diffPixels > 0) {
        mkdirSync(testInfo.outputDir, { recursive: true })
        writeFileSync(join(testInfo.outputDir, `${route.name}-dev.png`), dev.shot)
        writeFileSync(join(testInfo.outputDir, `${route.name}-prod.png`), prod.shot)
        writeFileSync(join(testInfo.outputDir, `${route.name}-diff.png`), PNG.sync.write(diff))
      }

      expect(
        diffPixels <= diffBudget,
        `${defaultBrowserType} ${route.name}: ${diffPixels} pixels differ dev≠prod (budget ${diffBudget}, see ${testInfo.outputDir})`
      ).toBe(true)
    }
  })
})
