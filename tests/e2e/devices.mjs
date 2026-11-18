/**
 * @file devices.mjs
 * @description Full mobile E2E device matrix. Playwright's built-in registry
 * covers iPhones 15→17, Galaxy S24/Tab S9, iPad gen 5/6/7/11 — the rest are
 * hand-authored descriptors (viewport/DPR/UA from published spec sheets).
 */
import { devices } from '@playwright/test'

const CHROME_UA = (model) =>
  `Mozilla/5.0 (Linux; Android 15; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36`
const SAFARI_IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

const galaxy = (model, w, h, dpr = 3) => ({
  userAgent: CHROME_UA(model),
  viewport: { width: w, height: h },
  deviceScaleFactor: dpr,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: 'chromium',
})

const ipad = (w, h) => ({
  userAgent: SAFARI_IPAD_UA,
  viewport: { width: w, height: h },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  defaultBrowserType: 'webkit',
})

/** WebKit projects — iPhone 15 through the 17 duo + iPad 5th gen and up. */
export const WEBKIT_DEVICES = {
  'iphone-15': devices['iPhone 15'],
  'iphone-15-plus': devices['iPhone 15 Plus'],
  'iphone-15-pro': devices['iPhone 15 Pro'],
  'iphone-15-pro-max': devices['iPhone 15 Pro Max'],
  'iphone-16': devices['iPhone 16'],
  'iphone-16e': devices['iPhone 16e'],
  'iphone-16-pro': devices['iPhone 16 Pro'],
  'iphone-16-pro-max': devices['iPhone 16 Pro Max'],
  'iphone-17': devices['iPhone 17'],
  'iphone-17-pro': devices['iPhone 17 Pro'],
  'iphone-17-pro-max': devices['iPhone 17 Pro Max'],
  'ipad-gen5': devices['iPad (gen 5)'],
  'ipad-gen6': devices['iPad (gen 6)'],
  'ipad-gen7': devices['iPad (gen 7)'],
  'ipad-gen8': ipad(810, 1080),
  'ipad-gen9': ipad(810, 1080),
  'ipad-gen10': ipad(820, 1180),
  'ipad-gen11': devices['iPad (gen 11)'],
  'ipad-pro-11': devices['iPad Pro 11'],
  'ipad-mini': devices['iPad Mini'],
  'ipad-gen5-landscape': devices['iPad (gen 5) landscape'],
  'ipad-gen6-landscape': devices['iPad (gen 6) landscape'],
  'ipad-gen7-landscape': devices['iPad (gen 7) landscape'],
  'ipad-gen8-landscape': ipad(1080, 810),
  'ipad-gen9-landscape': ipad(1080, 810),
  'ipad-gen10-landscape': ipad(1180, 820),
  'ipad-gen11-landscape': devices['iPad (gen 11) landscape'],
  'ipad-pro-11-landscape': devices['iPad Pro 11 landscape'],
  'ipad-mini-landscape': devices['iPad Mini landscape'],
}

/** Chromium projects — Galaxy S21→S26 (base + Ultra), Tab S9/S10/Lite, Pixels. */
export const CHROMIUM_DEVICES = {
  'galaxy-s21': galaxy('SM-G991B', 360, 800),
  'galaxy-s21-ultra': galaxy('SM-G998B', 412, 915, 3.5),
  'galaxy-s22': galaxy('SM-S901B', 360, 780),
  'galaxy-s22-ultra': galaxy('SM-S908B', 412, 915, 3.5),
  'galaxy-s23': galaxy('SM-S911B', 360, 772),
  'galaxy-s23-ultra': galaxy('SM-S918B', 412, 882, 3.5),
  'galaxy-s24': devices['Galaxy S24'],
  'galaxy-s24-ultra': galaxy('SM-S928B', 412, 919, 3.5),
  'galaxy-s25': galaxy('SM-S931B', 360, 780),
  'galaxy-s25-ultra': galaxy('SM-S938B', 412, 919, 3.5),
  'galaxy-s26': galaxy('SM-S941B', 360, 780),
  'galaxy-s26-ultra': galaxy('SM-S948B', 412, 919, 3.5),
  'galaxy-tab-s9': devices['Galaxy Tab S9'],
  'galaxy-tab-s10': galaxy('SM-X826B', 800, 1280, 2),
  'galaxy-tab-s10-lite': galaxy('SM-X400', 800, 1280, 2),
  'galaxy-tab-s9-landscape': devices['Galaxy Tab S9 landscape'],
  'galaxy-tab-s10-landscape': galaxy('SM-X826B', 1280, 800, 2),
  'galaxy-tab-s10-lite-landscape': galaxy('SM-X400', 1280, 800, 2),
  'pixel-7': devices['Pixel 7'],
  'pixel-5': devices['Pixel 5'],
}

/**
 * Touch-computer projects — a Windows-class touch laptop: desktop viewport,
 * `hasTouch` on, `isMobile` off so the site resolves its desktop tier with
 * touch input available. Chromium only — Safari ships no touch-laptop.
 */
export const TOUCH_DESKTOP_DEVICES = {
  'touch-desktop': {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  },
}
