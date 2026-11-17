/**
 * @file cardstack-content.spec.ts
 * @description Mobile card-stack content contract — the regression the user
 * reported as "the card goes from a distorted image to having the right image
 * plus title and description": every card must mount WITH its own
 * title/description copy (never a lonely image), the front card's copy must
 * stay visible through nav and swipe, and the deck must not emit
 * `ResizeObserver loop` errors under rapid navigation. Runs on every device
 * in the e2e matrix (iOS WebKit + Android Chromium).
 */
import { test, expect, type Page, type Locator } from '@playwright/test'

/** Card-stack deck selectors — mirror CARD_STACK_CLASSES / CARD_STACK_SELECTORS. */
const CARD = '.card-stack-card'
const CARD_ACTIVE = '.card-stack-card--active'
const CARD_INFO = '.card-stack-card-info'
const CARD_TITLE = '.card-stack-card-info-title'
const CARD_DESC = '.card-stack-card-info-desc'
const NEXT = '.card-stack-next'
const PREV = '.card-stack-prev'
const DECK = '.card-stack-deck'
/** In-card description writers render through <draw-text text="…">. */
const DESC_WRITER = `${CARD_DESC} draw-text`

/**
 * Attaches pageerror/console collectors and returns the shared bag — every
 * test asserts on it so a console error mid-flow can't slip by silently.
 * @param page Playwright page under test.
 * @returns Mutable error list populated until the test ends.
 */
const collectErrs = (page: Page): string[] => {
  const errs: string[] = []

  page.on('pageerror', (e) => errs.push(e.stack || String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push(m.text())
  })

  return errs
}

/**
 * Loads the homepage and waits until the deck has mounted at least one card.
 * The home hero can spend a moment behind the loading overlay on cold caches.
 * @param page Playwright page under test.
 */
const gotoDeck = async (page: Page): Promise<void> => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator(CARD).first().waitFor({ state: 'attached', timeout: 30000 })
}

/**
 * Per-card copy snapshot: title text, the desc writer's `text` attribute, and
 * whether the info column is actually visible (stacked tiers render it; fan
 * tiers hide it by authored design). Read in one evaluate to keep the frame
 * consistent.
 * @param card Card locator.
 * @returns Title/desc copy plus visibility flags.
 */
const cardCopy = (card: Locator) =>
  card.evaluate((el) => {
    const info = el.querySelector('.card-stack-card-info')
    const title = el.querySelector('.card-stack-card-info-title')
    const writer = el.querySelector('.card-stack-card-info-desc draw-text')
    const infoStyle = info ? getComputedStyle(info) : null

    return {
      title: title?.textContent?.trim() ?? '',
      desc: writer?.getAttribute('text')?.trim() ?? '',
      infoVisible:
        !!infoStyle &&
        infoStyle.display !== 'none' &&
        infoStyle.visibility !== 'hidden' &&
        infoStyle.opacity !== '0' &&
        (info as HTMLElement).offsetHeight > 0,
    }
  })

test.describe('Card-stack mobile content contract', () => {
  test('every card mounts with title + description — never a lonely image', async ({ page }) => {
    collectErrs(page)
    await gotoDeck(page)

    const cards = page.locator(CARD)
    const count = await cards.count()

    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const copy = await cardCopy(cards.nth(i))

      // The regression: cards mounted empty writers and behind cards were
      // actively emptied — a card crossed the pile as image-only, then copy
      // popped in and relaid it out. Copy must be present from first paint.
      expect(copy.title, `card ${i} title`).not.toBe('')
      expect(copy.desc, `card ${i} description`).not.toBe('')
    }
  })

  test('front card keeps visible copy — and still has it after each nav', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'in-card copy column only renders on stacked (touch) tiers')

    collectErrs(page)
    await gotoDeck(page)

    // On stacked tiers the front card's info column must be painted — the
    // reported bug was the whole pile showing media with zero copy. The
    // in-card writer enters through a light fade (draw animations are
    // desktop-only), so visibility is polled rather than sampled once.
    const assertFrontCopy = async (step: string) => {
      const front = page.locator(CARD_ACTIVE).first()

      await expect(front, `${step}: an active card exists`).toHaveCount(1)
      await expect(front.locator(CARD_INFO), `${step}: front info column painted`).toBeVisible()

      const copy = await cardCopy(front)

      expect(copy.title, `${step}: front title`).not.toBe('')
      expect(copy.desc, `${step}: front description`).not.toBe('')
    }

    await assertFrontCopy('mount')

    // Walk the deck forward — each new front must already own its copy,
    // not grow it after activation.
    for (let i = 0; i < 3; i++) {
      await page.locator(NEXT).click()
      await page.waitForTimeout(450)
      await assertFrontCopy(`after next #${i + 1}`)
    }

    await page.locator(PREV).click()
    await page.waitForTimeout(450)
    await assertFrontCopy('after prev')
  })

  test('no ResizeObserver loop errors during rapid navigation', async ({ page }) => {
    const errs = collectErrs(page)

    await gotoDeck(page)

    // The telemetry signature: RO notifications -> synchronous deck-height
    // writes -> another RO delivery. Rapid nav used to trip the browser's
    // loop detector continuously.
    for (let i = 0; i < 6; i++) {
      await page.locator(NEXT).click()
    }

    await page.waitForTimeout(800)

    const roLoops = errs.filter((e) => /ResizeObserver loop/i.test(e))

    expect(roLoops).toEqual([])
  })

  test('deck drag does not strip copy mid-swipe', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'drag contract applies to the stacked touch tiers')

    collectErrs(page)
    await gotoDeck(page)

    const deck = page.locator(DECK)
    const box = await deck.boundingBox()

    test.skip(!box, 'deck has no box — cannot drag')

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2

    // Hold a partial drag — the worst case for the old behavior (no card
    // inside the active epsilon → every info column unlit).
    await page.touchscreen.tap(cx, cy)
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - box.width * 0.3, cy, { steps: 6 })
    await page.waitForTimeout(120)

    // Mid-drag every card must still carry its copy in DOM.
    const cards = page.locator(CARD)

    for (let i = 0, n = await cards.count(); i < n; i++) {
      const copy = await cardCopy(cards.nth(i))

      expect(copy.title, `card ${i} title mid-drag`).not.toBe('')
      expect(copy.desc, `card ${i} description mid-drag`).not.toBe('')
    }

    await page.mouse.up()
    await page.waitForTimeout(450)

    // Settled: a front card exists and still shows its copy.
    const front = page.locator(CARD_ACTIVE).first()

    if (await front.count()) {
      const copy = await cardCopy(front)

      expect(copy.title).not.toBe('')
      expect(copy.desc).not.toBe('')
    }
  })
})
