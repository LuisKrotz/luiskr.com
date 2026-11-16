import { test, expect, type Page } from '@playwright/test'

interface Watch {
  errs: string[]
  bad: string[]
  failed: string[]
}

const watch = (page: Page): Watch => {
  const w: Watch = { errs: [], bad: [], failed: [] }

  page.on('pageerror', (e) => w.errs.push(e.stack || String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') w.errs.push('console.error: ' + m.text())
  })
  page.on('response', (r) => {
    if (r.status() >= 400) w.bad.push(`${r.status()} ${r.url()}`)
  })
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText ?? ''

    // Navigation teardown aborts in-flight fetches — a reload-cancelled
    // request is not a failed request.
    if (/cancel|abort/i.test(err)) return

    w.failed.push(`${r.url()} ${err}`)
  })

  return w
}

const overlayRetired = (page: Page) =>
  page.waitForFunction(
    () => {
      const el = document.querySelector('.intro-loader, intro-loader') as HTMLElement | null

      return (
        !el || getComputedStyle(el).opacity === '0' || getComputedStyle(el).visibility === 'hidden'
      )
    },
    undefined,
    { timeout: 3500 }
  )

const gridHitTest = (page: Page) =>
  page.evaluate(() => {
    const blocked: string[] = []

    for (let gx = 1; gx <= 5; gx++) {
      for (let gy = 1; gy <= 5; gy++) {
        const x = (innerWidth * gx) / 6
        const y = (innerHeight * gy) / 6
        const el = document.elementFromPoint(x, y) as HTMLElement | null

        if (!el || el.closest('.intro-loader, intro-loader')) {
          blocked.push(
            `(${Math.round(x)},${Math.round(y)}) -> ${el ? el.tagName + '.' + el.className : 'null'}`
          )
        }
      }
    }

    return blocked
  })

const upgradeAudit = (page: Page) =>
  page.evaluate(() => {
    const offenders: string[] = []
    const seen = new Set<string>()

    const walk = (root: Document | ShadowRoot): void => {
      for (const el of Array.from(root.querySelectorAll('*'))) {
        const tag = el.tagName.toLowerCase()

        if (tag.includes('-') && !seen.has(tag)) {
          seen.add(tag)
          const ctor = customElements.get(tag)

          if (!ctor) {
            // Lazy-registered modals/heads-up surfaces define on first open —
            // an unupgraded shell is legal only while it carries no content.
            if (el.childElementCount > 0) offenders.push(`${tag}: unupgraded with children`)
          } else {
            const r = el.getBoundingClientRect()
            const cs = getComputedStyle(el)

            // Fixed-position hosts (app-nav, cookie-banner) are legitimately
            // 0×0 — the visible box lives on a fixed descendant, so the audit
            // checks the deepest rendered box, not the host's own rect.
            const deepSize = (root: Element | ShadowRoot): number => {
              let best = 0

              for (const kid of Array.from(root.children ?? [])) {
                const kr = kid.getBoundingClientRect()

                best = Math.max(best, kr.width * kr.height)
                const ks = kid as Element & { shadowRoot?: ShadowRoot | null }

                if (ks.shadowRoot) best = Math.max(best, deepSize(ks.shadowRoot))
                best = Math.max(best, deepSize(kid))
              }

              return best
            }

            if (
              cs.display !== 'none' &&
              cs.visibility !== 'hidden' &&
              r.width * r.height <= 0 &&
              deepSize(el.shadowRoot ?? el) <= 0
            ) {
              offenders.push(`${tag}: zero-size ${Math.round(r.width)}x${Math.round(r.height)}`)
            }
          }
        }

        const el2 = el as HTMLElement & { shadowRoot?: ShadowRoot | null }

        if (el2.shadowRoot) walk(el2.shadowRoot)
      }
    }

    walk(document)

    return { offenders, tags: [...seen] }
  })

test.describe('Layer 4 — iOS WebKit matrix', () => {
  test('cold boot + hard reload: zero errors, zero failed requests', async ({ page }) => {
    const w = watch(page)

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await overlayRetired(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await overlayRetired(page)
    expect(w.errs).toEqual([])
    expect(w.bad).toEqual([])
    expect(w.failed).toEqual([])
  })

  test('boot overlay dismissed ≤3.5s and 5x5 hit-test grid is unblocked', async ({ page }) => {
    watch(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await overlayRetired(page)
    expect(await gridHitTest(page)).toEqual([])
  })

  test('every custom element is defined, upgraded, and non-zero-size', async ({ page }) => {
    watch(page)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await overlayRetired(page)
    const { offenders, tags } = await upgradeAudit(page)

    expect(tags.length).toBeGreaterThan(0)
    expect(offenders).toEqual([])
  })

  test('hostile WebKit env: no navigator.gpu / SAB / streaming / OffscreenCanvas-WebGL2', async ({
    page,
  }) => {
    const w = watch(page)

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'gpu', { value: undefined })
      ;(window as unknown as { SharedArrayBuffer?: unknown }).SharedArrayBuffer = undefined
      if (window.WebAssembly) {
        window.WebAssembly.instantiateStreaming = () => Promise.reject(new TypeError('bad MIME'))
      }

      ;(window as unknown as { OffscreenCanvas?: unknown }).OffscreenCanvas = class {
        getContext() {
          return null
        }
      }
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await overlayRetired(page)
    const kids = await page.evaluate(
      () => document.querySelector('#app, app-root')?.childElementCount ?? 0
    )

    expect(kids).toBeGreaterThan(0)
    expect(await gridHitTest(page)).toEqual([])
    expect(w.errs).toEqual([])
  })

  test('slow network: boot still unlocks without deadlock', async ({ page }) => {
    const w = watch(page)

    await page.route('**/*', async (route) => {
      await new Promise((r) => setTimeout(r, 250))
      await route.continue()
    })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(
      () => (document.querySelector('#app, app-root')?.childElementCount ?? 0) > 0,
      undefined,
      {
        timeout: 30000,
      }
    )
    expect(w.errs).toEqual([])
  })
})
