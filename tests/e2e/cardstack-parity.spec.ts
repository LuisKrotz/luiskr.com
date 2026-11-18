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
const CARD_STACK_TAG = 'card-stack'
const TIMER_P = '--card-stack-timer-p'

/** Non-deck view selectors — mirror the widget/media class tokens. */
const CUSTOM_CAROUSEL = 'custom-carousel'
const CAROUSEL_SHELL = '.carousel'
const CAROUSEL_IN_VIEW = 'carousel--in-view'
const MEDIA_FIGURE = 'media-figure'
const HIGH_LAYER = 'img.render-media--high'
const MEDIA_MOSAIC = 'media-mosaic'
const RELATED_MEDIA = '.related-list-media'
const RELATED_HIGH = 'related-list-img--high'

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

    // Related-card ladder convergence — coverLadderStep mounts each
    // confirmed rung as a BARE successor img beside the ladder <picture>
    // and removes the picture on the successor's own load, but a
    // post-climb _updateDom re-wraps the registry's reached rung in a
    // fresh picture instead. Which shape a card ends in depends on
    // store-update ordering — a genuine delivery-mode divergence, not
    // paint. The canonical terminal form is the thumb <picture> beside
    // exactly one bare --high img: unwrap any picture whose img carries
    // --high, then drop every bare high img but the last (the newest
    // confirmed rung — same painted box and bitmap either way).
    globalThis.__lkDeepAll(root, '${RELATED_MEDIA}').forEach((media) => {
      media.querySelectorAll('picture').forEach((p) => {
        const img = p.querySelector('img')

        if (img && img.className.includes('${RELATED_HIGH}')) p.replaceWith(img)
      })

      const highs = Array.from(media.children).filter(
        (k) => k.tagName === 'IMG' && k.className.includes('${RELATED_HIGH}')
      )

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

    // WebGPU-widget placeholder convergence — mountCornerBrackets /
    // mountDividerSheen / mountRingSheen / mountRingFill append an
    // is-fallback canvas synchronously, then defer mountWebGpuWidget
    // behind an IntersectionObserver entry. With the widget layer off
    // (no ?debug=webgpuWidgets:active) the mount always resolves null
    // and the helper removes its canvas — but only AFTER the IO entry
    // delivers, a delivery that can outlive every quiescence window
    // (the button sat inside a cv:auto-skipped subtree during its
    // viewport transit, or frame production stalled under load). Which
    // placeholders still stand at capture is IO-delivery timing noise,
    // not paint — the canvas is an empty transparent stub either way
    // (the :has(> canvas:not(.is-fallback)) gate leaves the CSS
    // brackets/rings authoritative). Terminal contract: a mountable
    // placeholder has already failed — drop every is-fallback canvas
    // still at its unsized placeholder state (default 300x150 backing,
    // no inline dims; every real widget init — WebGL or 2D fallback —
    // sizes its canvas's backing + inline box on mount).
    globalThis.__lkDeepAll(root, 'canvas.is-fallback').forEach((cv) => {
      if (cv.width === 300 && cv.height === 150 && !cv.style.width && !cv.style.height) {
        cv.remove()
      }
    })

    // In-view reveal convergence — .carousel paints translateY(space-xl)
    // + opacity:0 until the IntersectionObserver adds --in-view, and the
    // class only lands when an applyVisibility run finds the strip
    // intersecting. During the sweeps every IO apply defers to
    // scroll-stop, so which strips carry the class at capture is
    // debounce-vs-delivery ordering — one env can hold the offset while
    // the other released it (a ±space-xl whole-strip shift). The settle
    // did bring every host through the viewport, so the terminal
    // contract is "entered": pin the class + flag on each carousel — the
    // in-view rule sets transition:none so the release applies
    // instantly, and the WebGL arrows converge destroyed either way (no
    // strip is in view under the canonical top scroll).
    // Observer quiesce — the capture itself scrolls the page (tile
    // passes), and every crossing re-arms applyVisibility: arrow
    // mount/destroy churn, index re-jumps, smooth track scrolls and
    // autoplay flips — all landing BETWEEN freeze and screenshot. The
    // class+flag pin above already writes the terminal reveal state, so
    // disconnecting the IO after it is the application's own end state:
    // no deferred apply can move a slide during capture.
    globalThis.__lkDeepAll(root, '${CUSTOM_CAROUSEL}').forEach((cc) => {
      cc.observer?.disconnect()

      // Side-effect stubs — a scroll-settle apply queued before the
      // disconnect still fires applyVisibility afterwards, and track
      // scroll listeners debounce into _checkInfiniteLoop; either can
      // write scrollLeft (index jump, clone teleport, spring start) or
      // mount/destroy the arrow canvases between freeze and capture.
      // Parking is already canonical (goTo(0) ran during settle), so
      // every remaining writer is a no-op by contract.
      cc._stopAutoplay?.(true)
      cc._jumpToSlide = () => {}
      cc._checkInfiniteLoop = () => {}
      cc._mountWebGLArrows = () => {}
      cc._destroyWebGLArrows = () => {}
      cc._startAutoplay = () => {}
      cc._stopAutoplay = () => {}

      cc.isEnteredViewport = true
      cc.shadowRoot?.querySelector('${CAROUSEL_SHELL}')?.classList.add('${CAROUSEL_IN_VIEW}')
    })
    // Animation neuter via adopted stylesheet — governs the document plus
    // every shadow root under the view (recursive: carousel/mosaic roots
    // carry their own animated surfaces). An inline animation-play-state
    // dies with its node: a late re-render REPLACES the title-marquee
    // strip (c._titleRepeat feeds the template), and the fresh element's
    // CSS animation starts RUNNING — drifting ~90px/s through any
    // freeze→capture gap. A root-level sheet instead pins every element
    // that root ever produces — existing, recreated, or late-mounted — to
    // its natural end state, so re-arms and re-renders can never resume
    // motion. Flagged per root so repeat freezes don't re-append.
    const neuter = (r) => {
      r.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) neuter(el.shadowRoot)
      })

      if (r.__lkNeutered) return
      r.__lkNeutered = true

      try {
        const sheet = new CSSStyleSheet()

        sheet.replaceSync(
          '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'
        )

        r.adoptedStyleSheets = [...r.adoptedStyleSheets, sheet]
      } catch {
        const st = document.createElement('style')

        st.textContent =
          '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'

        r.appendChild(st)
      }
    }

    neuter(document)

    if (root instanceof ShadowRoot || root instanceof Document) neuter(root)
    else if (root && root.getRootNode) neuter(root.getRootNode())

    // WAAPI surface — element.animate() effects outlive the CSS sheet;
    // pin them the same way (infinite at phase 0, finite at their end).
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
 * Stillness screenshot equality — Chromium's PNG encoder emits
 * nondeterministic byte streams on some platforms (identical pixels,
 * different chunk layout/lengths), and the rasterizer shifts ±1-2/255
 * dither phases at tile clip edges, so raw byte equality can never
 * converge for the stillness checks. Three passes: exact byte equality
 * (fast path), exact decoded-pixel equality, then the parity threshold
 * (pixelmatch 0.05 — real churn always produces above-threshold diffs
 * while sub-threshold raster noise reads as still).
 * @param a First PNG bytes.
 * @param b Second PNG bytes.
 * @returns True when both decode to the same dimensions and no
 *   above-threshold pixel differs.
 */
const shotsEqual = (a: Buffer, b: Buffer): boolean => {
  if (a.equals(b)) return true

  const pa = PNG.sync.read(a)
  const pb = PNG.sync.read(b)

  if (pa.width !== pb.width || pa.height !== pb.height) return false
  if (pa.data.equals(pb.data)) return true

  return (
    pixelmatch(pa.data, pb.data, null, pa.width, pa.height, {
      threshold: 0.05,
      includeAA: false,
    }) === 0
  )
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

  // Autoplay disarm — mirrors the carousel _autoplayPermanentlyStopped
  // latch in settleView. The desktop fan tier arms a 10s countdown on
  // mount that repaints a conic border light every rAF and goTo()s the
  // pile on expiry: the ring alone keeps the stillness loop from ever
  // converging, and a tick mid-capture can advance the front card so
  // dev/prod park on different indices. _autoOn=false parks every
  // writer at its mount state; _autoArmed=true blocks the one-shot arm
  // in onUpdated if this eval beats the items render; the IO
  // disconnect stops off-screen hold/resume flips. applyAutoChrome
  // re-reads _autoOn on the next render and clears the ring — the
  // application's own manual-deck end state, identical on both envs.
  await page.evaluate(
    (arg) => {
      eval(arg.js)

      const host = globalThis.__lkDeepOne(document, arg.tag) as any

      if (!host) return

      host._autoArmed = true
      host._autoOn = false
      host._autoPaused = false
      host._autoHeld = false
      host._autoBank = 0

      if (host._autoTimer) {
        clearTimeout(host._autoTimer)

        host._autoTimer = null
      }

      if (host._autoRaf) {
        cancelAnimationFrame(host._autoRaf)

        host._autoRaf = 0
      }

      host._autoIO?.disconnect()
      host.style?.removeProperty(arg.prop)
    },
    { tag: CARD_STACK_TAG, prop: TIMER_P, js: DEEP_JS }
  )

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

    pixelStable = shotsEqual(s1, s2)
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
 * the VIEW_TAGS the router mounts: the project's heaviest internals pages
 * (carousels, mosaics, long copy — each named by slug so diff artifacts stay
 * attributable) plus the densest legal doc. Region screenshots mask
 * canvas/video surfaces so ambient engine paint can't rephase between the
 * two captures.
 */
const ROUTES = [
  { name: 'project-coza', path: '/portfolio/coza/', view: 'view-project' },
  { name: 'project-metcha', path: '/portfolio/metcha/', view: 'view-project' },
  {
    name: 'project-brazilian-leather',
    path: '/portfolio/brazilian-leather/',
    view: 'view-project',
  },
  {
    name: 'project-dell-design-system',
    path: '/portfolio/dell-design-system/',
    view: 'view-project',
  },
  { name: 'project-melissa', path: '/portfolio/melissa/', view: 'view-project' },
  {
    name: 'project-minimelissa',
    path: '/portfolio/minimelissa/',
    view: 'view-project',
  },
  { name: 'project-mor', path: '/portfolio/mor/', view: 'view-project' },
  { name: 'project-cecerele', path: '/portfolio/cecerele/', view: 'view-project' },
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

        // Resource-timing drain pool — the ladder-terminal wait below
        // counts resource entries to catch silent async work (probe
        // Images, late fetches) between DOM mutations. The default
        // buffer caps at 250 entries, which a media-dense page overflows
        // mid-settle and freezes the count; enlarge it and start clean
        // so only settle-phase traffic is tracked.
        try {
          performance.setResourceTimingBufferSize(10000)
          performance.clearResourceTimings()
        } catch {
          // Older engines without the buffer API fall back to the
          // mutation+img signature — still a superset of the old check.
        }

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
  // >500ms fetch gap masquerades as done. Tolerated timeout: on the
  // media-dense routes dev's module waterfall + ~550 image requests keep
  // the connection queue nonempty well past 60s under load, so the
  // img-decode wait below (plus the later quiescence/stillness loops) is
  // the authoritative drain — a genuinely stuck source still fails there.
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {})

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

  // Second horizontal wake — a slide swept before its media committed
  // renders at the pre-final intrinsic size and content-visibility:auto
  // REMEMBERS it (width 0 figures on tablet-landscape tracks): nothing
  // re-renders a skipped slide until it intersects the track viewport
  // again. With every img now decoded, a repeat sweep re-renders each
  // slide at its terminal size, so the remembered size both envs keep is
  // the real one. Same restore contract as the first sweep.
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

  // Ladder-terminal drain — the cover ladders (related cards, figure
  // --high rungs) climb through silent async hops: a detached probe
  // Image fetch produces no DOM mutations, and its gap can outlive the
  // 1000ms quiet window, so either env can capture a mid-chain frame
  // (PICTURE still wrapped vs the bare successor img that replaces it).
  // The chain can only be advancing while (a) resources keep landing,
  // (b) the DOM mutates, or (c) an img's decode/src state changes — so
  // require all three signatures to sit unchanged for a full 1.5s
  // polling window. Late async mounts (e.g. a GPU-probe canvas) reset
  // through the same mutation stamp, covering those races too.
  await page.evaluate(
    (arg) => {
      eval(arg.js)

      const w = window as unknown as {
        __lkLadderPrev?: string
        __lkLadderStill?: number
      }

      w.__lkLadderPrev = ''
      w.__lkLadderStill = 0
    },
    { js: DEEP_JS }
  )

  await page.waitForFunction(
    (arg) => {
      eval(arg.js)

      const w = window as unknown as {
        __lkMutLast?: number
        __lkLadderPrev?: string
        __lkLadderStill?: number
      }
      const view = globalThis.__lkDeepOne(document, arg.view)

      if (!view) return false

      const imgSig = globalThis
        .__lkDeepAll(view.shadowRoot || view, 'img')
        .map(
          (img) =>
            `${(img as HTMLImageElement).currentSrc || img.getAttribute('src') || ''}=${(img as HTMLImageElement).complete ? 1 : 0}`
        )
        .join('|')

      // Videos join the signature too — a <video> resolving its metadata
      // late publishes intrinsic dimensions that re-size its box (and any
      // slide/centering math built on it) without a DOM mutation.
      const vidSig = globalThis
        .__lkDeepAll(view.shadowRoot || view, 'video')
        .map(
          (v) =>
            `${(v as HTMLVideoElement).currentSrc || v.getAttribute('src') || ''}=${(v as HTMLVideoElement).readyState}`
        )
        .join('|')

      const resCount = performance.getEntriesByType('resource').length
      const key = `${resCount}#${w.__lkMutLast || 0}#${imgSig}#${vidSig}`

      w.__lkLadderStill = key === w.__lkLadderPrev ? (w.__lkLadderStill || 0) + 1 : 0
      w.__lkLadderPrev = key

      return (w.__lkLadderStill || 0) >= arg.stillPolls
    },
    { view: viewSel, stillPolls: 6, js: DEEP_JS },
    { timeout: 120000, polling: 250 }
  )

  // Terminal-size sweep — anything that re-sized a slide after the
  // earlier sweeps (late video metadata, a rung swap landing past the
  // quiet window, a fit pass firing on the drain's last poll) leaves a
  // stale content-visibility remembered size behind. With the ladder
  // drained and every medium committed, one last sweep re-renders each
  // slide at its true terminal geometry — the remembered size then
  // holds the same final values on both envs.
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

  // scrollIntoView moved the page — every rect sampled below is
  // viewport-relative, so restore the canonical top scroll the
  // geometry map was captured under on both envs.
  await page.evaluate(() => window.scrollTo(0, 0))

  // The sweep can itself fire deferred writes (fit observers, class
  // stamps) — a short mutation-quiet window before sampling.
  await page.waitForFunction(
    (arg) => {
      const w = window as unknown as { __lkMutLast?: number }

      return Date.now() - (w.__lkMutLast || 0) > 800
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

  const freeze = () =>
    page.evaluate(
      (arg) => {
        eval(arg.js)
        eval(arg.freeze)

        const view = globalThis.__lkDeepOne(document, arg.view)

        if (view) globalThis.__lkFreeze(view.shadowRoot || view)
      },
      { view: viewSel, js: DEEP_JS, freeze: FREEZE_JS }
    )

  await freeze()

  let s1 = await regionShots(page, viewSel)
  let pixelStable = false
  let prevShots: Buffer[] | null = null

  for (let i = 0; i < 40 && !pixelStable; i++) {
    await page.waitForTimeout(400)

    // Re-freeze per iteration — a late-triggered writer, a re-armed CSS
    // animation (marquee duration re-sync), or a freshly mounted surface
    // can start compositing between captures; pinning at each sample
    // keeps the compared frames at the same terminal phase.
    await freeze()

    const s2 = await regionShots(page, viewSel)

    pixelStable = s1.length === s2.length && s1.every((tile, t) => shotsEqual(tile, s2[t]))

    if (!pixelStable) prevShots = s1
    s1 = s2
  }

  // On exhaustion, dump the last differing tile pair — the moving
  // region is identifiable at a glance instead of being abstracted to a
  // count.
  if (!pixelStable && prevShots) {
    const dir = test.info().outputPath('still')

    mkdirSync(dir, { recursive: true })
    prevShots.forEach((tile, t) => writeFileSync(join(dir, `prev-${t}.png`), tile))
    s1.forEach((tile, t) => writeFileSync(join(dir, `next-${t}.png`), tile))
  }

  expect(
    pixelStable,
    `${viewSel} pixels never went still — an overlay/effect is still compositing`
  ).toBe(true)
}

/**
 * Device-pixel headroom under the 32767px canvas surface cap — views
 * taller than ~16k CSS px at 2× DSF exceed it in one shot, so tall
 * regions capture as viewport-sized tiles instead.
 */
const SHOT_TILE_MAX_DEV_PX = 30000

/**
 * Captures a view region as one or more vertically stacked PNG tiles:
 * the host is translateY-ed up by (box.y + tile top) per step so each
 * slice paints at the viewport top with the page scroll parked at 0 —
 * deterministic across clip semantics (viewport-relative on isMobile,
 * document-relative on desktop coincide at scrollY=0) and free of every
 * scroll-induced side effect (IO re-arms, toolbar collapse, cv renders,
 * short scroll landings). Canvas/video masks apply per tile.
 * @param page Playwright page on the settled route.
 * @param viewSel View host selector to clip.
 * @returns Ordered tile PNGs covering the full view box.
 */
const regionShots = async (page: Page, viewSel: string): Promise<Buffer[]> => {
  const box = await page.evaluate(
    (arg) => {
      eval(arg.js)

      const host = globalThis.__lkDeepOne(document, arg.view)!
      const r = host.getBoundingClientRect()

      return {
        x: r.x + window.scrollX,
        y: r.y + window.scrollY,
        w: r.width,
        h: r.height,
        dsf: window.devicePixelRatio,
      }
    },
    { view: viewSel, js: DEEP_JS }
  )

  const mask = [page.locator(`${viewSel} canvas`), page.locator(`${viewSel} video`)]
  const vh = await page.evaluate(() => window.innerHeight)
  const tileCssH = Math.max(1, Math.min(Math.floor(SHOT_TILE_MAX_DEV_PX / box.dsf), vh))
  const shots: Buffer[] = []

  // Tiles come to the viewport — the host is translated up by
  // (box.y + top) so each slice paints at document y=0 while the page
  // scroll stays parked at 0. Page scrolling was the last nondeterminism
  // in this path: every tile scroll re-fired IntersectionObserver
  // applies (index jumps, arrow mounts, autoplay flips), collapsed the
  // emulated mobile toolbar (dvh re-layouts mid-capture), re-rendered
  // content-visibility blocks, and could land short of its target when
  // the document floor moved — all inside the compared frame. A static
  // translate has none of those surfaces: no scroll events, no toolbar,
  // and viewport-relative (mobile) vs document-relative (desktop) clip
  // semantics collapse to the same coordinates at scrollY=0.
  try {
    for (let top = 0; top < box.h; top += tileCssH) {
      await page.evaluate(
        (arg) => {
          eval(arg.js)

          const host = globalThis.__lkDeepOne(document, arg.view)

          if (host) host.style.transform = `translateY(${-(arg.y + arg.t)}px)`
        },
        { y: box.y, t: top, view: viewSel, js: DEEP_JS }
      )

      // Two frames for content-visibility blocks the translate just
      // carried into view to render before the shot.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      )

      shots.push(
        await page.screenshot({
          clip: {
            x: box.x,
            y: 0,
            width: box.w,
            height: Math.min(tileCssH, box.h - top),
          },
          mask,
        })
      )
    }
  } finally {
    await page.evaluate(
      (arg) => {
        eval(arg.js)

        const host = globalThis.__lkDeepOne(document, arg.view)

        if (host) host.style.transform = ''
      },
      { view: viewSel, js: DEEP_JS }
    )
  }

  return shots
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
): Promise<{ geom: unknown; shots: Buffer[] }> => {
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

    const shots = await regionShots(page, route.view)

    return { geom, shots }
  } finally {
    await context.close()
  }
}

test.describe('Dev/prod pixel parity', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()

    try {
      const page = await context.newPage()

      // Generous probe — the check re-runs on every worker restart (a
      // test timeout kills the worker), and a dev server busy streaming
      // ~500 modules for a sibling capture can answer slowly without
      // being down; a 10s miss would silently skip the whole file.
      const res = await page.goto(DEV_URL, { timeout: 30000 }).catch(() => null)

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
      // Reduced-motion context — the deck's autoplay countdown is a
      // per-frame conic border light + a 10s goTo clock, and the
      // arm lives behind CardStack's own reduced-motion gate
      // (STATE_CLASSES.REDUCED_MOTION seeds from this media query at
      // store init). Per-element disarms can't hold: the host
      // re-mounts while lazy translations/data stream in, and every
      // fresh instance re-arms. Emulating the user preference parks
      // every mount at the manual-deck state — the application's own
      // contract — identically on both envs. Scoped to the deck
      // capture; the project routes keep the normal motion tier.
      reducedMotion: 'reduce' as const,
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

  for (const route of ROUTES) {
    test(`dev and prod paint identical ${route.name}`, async ({
      browser,
      baseURL,
      viewport,
      isMobile,
      hasTouch,
      deviceScaleFactor,
      userAgent,
      defaultBrowserType,
    }, testInfo) => {
      // Per-route budget — media-dense pages (metcha's ~550 imgs) run
      // the full settle pipeline (two scroll passes, two track sweeps,
      // three quiescence windows, ladder drain, stability loops) serially
      // per env, and webkit inflates every eval/screenshot on top.
      test.setTimeout(360000)

      const contextOpts = {
        viewport,
        isMobile,
        hasTouch,
        deviceScaleFactor,
        userAgent,
      }

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

      // Tile count + per-tile dimensions must match — a height mismatch
      // surfaces here even before geometry diff wording.
      expect(
        dev.shots.length,
        `${defaultBrowserType} ${route.name}: screenshot tile count dev≠prod`
      ).toBe(prod.shots.length)

      let diffPixels = 0
      let totalPixels = 0
      const diffs: { dev: Buffer; prod: Buffer; diff: Buffer; tile: number }[] = []

      dev.shots.forEach((devShot, t) => {
        const prodShot = prod.shots[t]
        const devImg = PNG.sync.read(devShot)
        const prodImg = PNG.sync.read(prodShot)

        expect(
          { w: devImg.width, h: devImg.height },
          `${defaultBrowserType} ${route.name} tile ${t}: screenshot dimensions dev≠prod`
        ).toEqual({ w: prodImg.width, h: prodImg.height })

        const diff = new PNG({ width: devImg.width, height: devImg.height })
        const n = pixelmatch(devImg.data, prodImg.data, diff.data, devImg.width, devImg.height, {
          threshold: 0.05,
          includeAA: false,
        })

        diffPixels += n
        totalPixels += devImg.width * devImg.height

        if (n > 0) {
          diffs.push({ dev: devShot, prod: prodShot, diff: PNG.sync.write(diff), tile: t })
        }
      })

      const diffBudget = Math.ceil(totalPixels * 0.005)

      if (diffs.length > 0) {
        mkdirSync(testInfo.outputDir, { recursive: true })

        for (const d of diffs) {
          writeFileSync(join(testInfo.outputDir, `${route.name}-dev-t${d.tile}.png`), d.dev)
          writeFileSync(join(testInfo.outputDir, `${route.name}-prod-t${d.tile}.png`), d.prod)
          writeFileSync(join(testInfo.outputDir, `${route.name}-diff-t${d.tile}.png`), d.diff)
        }
      }

      expect(
        diffPixels <= diffBudget,
        `${defaultBrowserType} ${route.name}: ${diffPixels} pixels differ dev≠prod (budget ${diffBudget}, see ${testInfo.outputDir})`
      ).toBe(true)
    })
  }
})
