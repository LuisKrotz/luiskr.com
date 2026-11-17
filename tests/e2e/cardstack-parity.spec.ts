/**
 * @file cardstack-parity.spec.ts
 * @description Dev-server vs production-build parity contract — "every
 * subpixel needs to behave the same, and look the same" between `vite dev`
 * and `vite preview` on the same device profile. Loads the homepage on BOTH
 * servers in the same test, waits for the deck's fully settled end state,
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

test.describe('Card-stack dev/prod pixel parity', () => {
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
})
