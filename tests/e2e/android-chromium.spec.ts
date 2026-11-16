import { test, expect, type Page } from '@playwright/test'

const BANNED_PROPS = [
  'backgroundPosition',
  'backgroundSize',
  'filter',
  'boxShadow',
  'top',
  'left',
  'width',
  'height',
]

const collectErrs = (page: Page) => {
  const errs: string[] = []

  page.on('pageerror', (e) => errs.push(e.stack || String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text())
  })

  return errs
}

test.describe('Layer 5 — Android Chromium flicker & thrash matrix', () => {
  test('zero paint-triggering keyframe animations (incl. shadow roots)', async ({ page }) => {
    collectErrs(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
    const offenders = await page.evaluate((banned) => {
      const out: string[] = []

      for (const a of document.getAnimations({ subtree: true })) {
        if (a.playState !== 'running') continue

        const props = new Set<string>()

        for (const kf of (a.effect as KeyframeEffect)?.getKeyframes?.() ?? []) {
          for (const k of Object.keys(kf))
            if (!['offset', 'easing', 'composite', 'computedOffset'].includes(k)) props.add(k)
        }

        for (const p of props) if (banned.includes(p)) out.push(`${a.animationName}: ${p}`)
      }

      return out
    }, BANNED_PROPS)

    expect(offenders).toEqual([])
  })

  test('zero backdrop-filter + transform compositor conflicts', async ({ page }) => {
    collectErrs(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)
    const offenders = await page.evaluate(() => {
      const out: string[] = []
      const walk = (root: Document | ShadowRoot): void => {
        for (const el of Array.from(root.querySelectorAll('*'))) {
          const cs = getComputedStyle(el)

          if (
            cs.backdropFilter !== 'none' &&
            (cs.transform !== 'none' || cs.willChange.includes('transform'))
          ) {
            out.push(`${el.tagName}.${el.className}`)
          }

          const shadowed = el as HTMLElement & { shadowRoot?: ShadowRoot | null }

          if (shadowed.shadowRoot) walk(shadowed.shadowRoot)
        }
      }

      walk(document)

      return out
    })

    expect(offenders).toEqual([])
  })

  test('RO/rAF feedback-loop detector during idle + scroll', async ({ page }) => {
    collectErrs(page)
    await page.addInitScript(() => {
      const w = window as unknown as { __roBursts: number[] }
      const Native = window.ResizeObserver

      w.__roBursts = []
      window.ResizeObserver = class extends Native {
        constructor(cb: ResizeObserverCallback) {
          super((e, o) => {
            w.__roBursts.push(Date.now())
            cb(e, o)
          })
        }
      }
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    await page.mouse.wheel(0, 600)
    // A real RO→write→RO loop NEVER settles; a legitimate burst (lazy media
    // decoding, body growth) does. Assert on the trailing 500ms idle window
    // after the scroll burst — the spec's cascading-feedback signature is
    // sustained activity without a viewport-width change, not one-off
    // settling callbacks spread across many distinct observers.
    await page.waitForTimeout(2000)
    const ro = await page.evaluate(() => {
      const w = window as unknown as { __roBursts: number[] }
      const now = Date.now()

      return w.__roBursts.filter((t) => now - t < 500).length
    })
    const vw = await page.evaluate(() => innerWidth)

    expect(ro).toBeLessThanOrEqual(5)
    expect(vw).toBeGreaterThan(0)
  })

  test('URL-bar oscillation ×10 + scroll: CLS < 0.02, stable fixed elements, zero errors', async ({
    page,
  }) => {
    const errs = collectErrs(page)

    await page.addInitScript(() => {
      ;(window as unknown as { __cls: number }).__cls = 0
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as (PerformanceEntry & {
          hadRecentInput?: boolean
          value?: number
        })[]) {
          if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value ?? 0
        }
      }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const navBox0 = await page.locator('nav.nav, app-nav, .nav').first().boundingBox()

    for (let i = 0; i < 10; i++) {
      await page.setViewportSize({ width: 412, height: i % 2 ? 843 : 915 })
      await page.mouse.wheel(0, 40)
      await page.waitForTimeout(60)
    }

    await page.setViewportSize({ width: 412, height: 915 })
    await page.waitForTimeout(800)
    const navBox1 = await page.locator('nav.nav, app-nav, .nav').first().boundingBox()
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)

    expect(cls).toBeLessThan(0.02)
    if (navBox0 && navBox1) {
      expect(Math.abs(navBox0.x - navBox1.x)).toBeLessThanOrEqual(2)
      expect(Math.abs(navBox0.y - navBox1.y)).toBeLessThanOrEqual(2)
    }

    expect(errs).toEqual([])
  })

  test('visual frame stability: no blank-frame flashes across scroll', async ({ page }) => {
    collectErrs(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    const lumas: number[] = []

    for (let i = 0; i < 4; i++) {
      const buf = await page.screenshot()

      lumas.push(
        await page.evaluate(
          (b64) =>
            new Promise<number>((res) => {
              const img = new Image()

              img.onload = () => {
                const cv = document.createElement('canvas')

                cv.width = 32
                cv.height = 32
                const ctx = cv.getContext('2d')!

                ctx.drawImage(img, 0, 0, 32, 32)
                const d = ctx.getImageData(0, 0, 32, 32).data
                let sum = 0

                for (let p = 0; p < d.length; p += 4)
                  sum += 0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2]
                res(sum / (d.length / 4))
              }
              img.src = 'data:image/png;base64,' + b64
            }),
          buf.toString('base64')
        )
      )
      await page.mouse.wheel(0, 300)
      await page.waitForTimeout(150)
    }

    for (const l of lumas) {
      expect(l).toBeGreaterThan(5)
      expect(l).toBeLessThan(250)
    }
  })

  /**
   * Composited-layer census — the GPU-memory failure class behind the 5.3.x
   * mobile reports (iOS Safari jetsam kills, Android missing-tile flicker and
   * all-black frames). LayerTree is enabled only after the page settles (an
   * agent enabled before navigation never delivers a tree) and a 1px wheel
   * nudge forces a commit. Chrome rasters only tiles near the viewport, so
   * each drawing layer counts at most 1.5 viewport widths × 2 viewport
   * heights; the sum is normalised to viewport-equivalents (DPR cancels out)
   * so one budget holds across every phone/tablet profile. Pre-fix 5.3.7
   * measured 51 layers / ~33 VE on home and ~490 layers / ~107 VE on a
   * project page; post-fix the matrix sits at 24–33 layers / 15–20 VE.
   */
  test.describe('composited-layer budget', () => {
    const LAYER_BUDGET = { MAX_DRAWING_LAYERS: 45, MAX_VIEWPORT_EQUIVALENTS: 26 }
    const LAYER_BUDGET_ROUTES = ['/', '/portfolio/dell-design-system']

    type CensusLayer = { drawsContent: boolean; width: number; height: number }

    const layerCensus = async (page: Page) => {
      const vp = page.viewportSize() ?? { width: 1, height: 1 }
      const cdp = await page.context().newCDPSession(page)
      let layers: CensusLayer[] = []

      cdp.on('LayerTree.layerTreeDidChange', (e) => {
        if (e.layers) layers = e.layers as CensusLayer[]
      })
      await cdp.send('LayerTree.enable')
      await page.mouse.wheel(0, 1)
      await page.waitForTimeout(1500)
      await cdp.detach()

      const drawing = layers.filter((l) => l.drawsContent)
      const px = drawing.reduce(
        (sum, l) => sum + Math.min(l.width, vp.width * 1.5) * Math.min(l.height, vp.height * 2),
        0
      )

      return { drawingLayers: drawing.length, viewportEquivalents: px / (vp.width * vp.height) }
    }

    for (const route of LAYER_BUDGET_ROUTES) {
      test(`stays inside the mobile GPU budget on ${route}`, async ({ page }) => {
        collectErrs(page)
        await page.goto(route, { waitUntil: 'load' })
        await page.waitForTimeout(6000)
        const census = await layerCensus(page)

        test.info().annotations.push({ type: 'layer-census', description: JSON.stringify(census) })
        expect(
          census.drawingLayers,
          'LayerTree delivered no layers — census is blind'
        ).toBeGreaterThan(0)
        expect(census.drawingLayers, JSON.stringify(census)).toBeLessThanOrEqual(
          LAYER_BUDGET.MAX_DRAWING_LAYERS
        )
        expect(census.viewportEquivalents, JSON.stringify(census)).toBeLessThanOrEqual(
          LAYER_BUDGET.MAX_VIEWPORT_EQUIVALENTS
        )
      })
    }
  })
})
