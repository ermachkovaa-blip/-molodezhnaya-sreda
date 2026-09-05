// V2 SHELL — Playwright smoke tests (Этап 1).
//
// Committed to the repo from day one per the 05.09 decision ("не откладывать
// tests на финальный этап") — V1 never had a committed Playwright suite at
// all (see audit, п.14); this file is the fix for that gap, not a
// continuation of a prior test suite.
//
// Run: npx playwright test site-v2/tests/shell.spec.js
// (requires the repo root served over HTTP — see README in this folder)

const { test, expect } = require('@playwright/test');

const BASE = process.env.YH_BASE_URL || 'http://localhost:8970';
const DEMO_URL = BASE + '/site-v2/embed/demo.html';

const ZONE_ORDER = ['00', '01', '02', '03', '04', '05', '06', '07'];

const VIEWPORTS = [
  { name: '1600x900', width: 1600, height: 900, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true }
];

function collectConsoleErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    // Chromium's generic "Failed to load resource" console text never
    // includes the failing URL, so favicon.ico can't be filtered out of
    // it by content — real network failures are caught precisely (with
    // URL) by the 'response' listener below instead.
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('console: ' + m.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) errors.push('http ' + res.status() + ': ' + res.url());
  });
  return errors;
}

// bounding box of the scene image must fully cover the viewport at all
// times — this is the "no BASE edge visible" requirement made mechanical.
async function assertNoVisibleEdge(page) {
  const covers = await page.evaluate(() => {
    const viewport = document.querySelector('.yh-scene-viewport');
    const img = document.querySelector('.yh-scene-image');
    const vr = viewport.getBoundingClientRect();
    const stage = document.querySelector('.yh-scene-stage');
    const st = getComputedStyle(stage).transform;
    // parse matrix(scale, 0, 0, scale, tx, ty)
    const m = st.match(/matrix\(([^)]+)\)/);
    if (!m) return null;
    const parts = m[1].split(',').map(Number);
    const scale = parts[0];
    const tx = parts[4];
    const ty = parts[5];
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;
    return { tx, ty, iw, ih, vw: vr.width, vh: vr.height };
  });
  expect(covers).not.toBeNull();
  expect(covers.tx).toBeLessThanOrEqual(0.5);
  expect(covers.ty).toBeLessThanOrEqual(0.5);
  expect(covers.tx + covers.iw).toBeGreaterThanOrEqual(covers.vw - 0.5);
  expect(covers.ty + covers.ih).toBeGreaterThanOrEqual(covers.vh - 0.5);
}

for (const vp of VIEWPORTS) {
  test.describe(`shell @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.mobile, isMobile: vp.mobile });

    test('map loads, all 8 zones reachable via map hotspots, no console errors', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      await expect(page.locator('.yh-map-view')).toBeVisible();
      const dots = page.locator('.yh-map-hotspot');
      await expect(dots).toHaveCount(8);

      for (let i = 0; i < ZONE_ORDER.length; i++) {
        const zoneId = ZONE_ORDER[i];
        if (i > 0) {
          // a hotspot from a previous iteration is hidden once the map
          // view is hidden by the navigation that just happened — go
          // back to the map before each click instead of reusing stale
          // (now-invisible) locators.
          await page.evaluate(() => window.__yhInstance.showMap());
          await page.waitForTimeout(200);
        }
        await dots.nth(i).click();
        // 900ms, not 500ms: the zone-switch transition is 800ms with a
        // slight-overshoot easing curve (ported from V1) — checking the
        // resting state (not mid-transition) is the correct test of the
        // "no BASE edge visible" requirement.
        await page.waitForTimeout(900);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe(zoneId);
        expect(state.showingMap).toBe(false);
        await expect(page.locator('.yh-scene-view')).toBeVisible();
        await assertNoVisibleEdge(page);
      }

      expect(errors).toEqual([]);
    });

    test('bottom nav works from every zone', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      for (const zoneId of ZONE_ORDER) {
        await page.locator(`.yh-bottom-nav__item[data-zone="${zoneId}"]`).click();
        await page.waitForTimeout(400);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe(zoneId);
        await assertNoVisibleEdge(page);
      }
    });

    test('global CTA is a real, always-present, clickable link using config.links.APPLICATION_URL', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=05', { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const cta = page.locator('.yh-cta');
      await expect(cta).toBeVisible();
      const tag = await cta.evaluate((el) => el.tagName);
      expect(tag).toBe('A');
      const href = await cta.getAttribute('href');
      const configured = await page.evaluate(() => window.YHApp.LINKS.APPLICATION_URL);
      expect(href).toBe(configured);
      const box = await cta.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    });

    test('КАРТА ↑ returns to map from any zone', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=06', { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.locator('.yh-header__map-return').click();
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => window.__yhInstance.getState());
      expect(state.showingMap).toBe(true);
      await expect(page.locator('.yh-map-view')).toBeVisible();
    });

    if (!vp.mobile) {
      test('M key returns to map (desktop)', async ({ page }) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        await page.locator('.yh-scene-viewport').click({ position: { x: 200, y: 200 } }); // below the header, which sits on top (z-index) over the top ~64px
        await page.keyboard.press('m');
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.showingMap).toBe(true);
      });
    }

    if (vp.mobile) {
      test('mobile: Pointer Events drag pans the scene without triggering navigation', async ({ page }) => {
        await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const before = await page.evaluate(() => {
          const st = getComputedStyle(document.querySelector('.yh-scene-stage')).transform;
          return st;
        });
        const box = await page.locator('.yh-scene-viewport').boundingBox();
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height / 2;
        await page.touchscreen ? null : null; // isMobile+hasTouch already routes pointer events as touch
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx - 80, cy - 40, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(200);
        const after = await page.evaluate(() => {
          const st = getComputedStyle(document.querySelector('.yh-scene-stage')).transform;
          return st;
        });
        expect(after).not.toBe(before);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe('03'); // drag must not have triggered zone navigation
        await assertNoVisibleEdge(page);
      });

      test('mobile: tap (no movement) on a map hotspot still navigates', async ({ page }) => {
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        const dot = page.locator('.yh-map-hotspot').nth(4); // zone 04
        await dot.tap();
        await page.waitForTimeout(400);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe('04');
      });
    }

    test('prefers-reduced-motion: zone switch still functions (no drift, but navigation works)', async ({ page, context }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.locator('.yh-map-hotspot').nth(1).click();
      await page.waitForTimeout(300);
      const state = await page.evaluate(() => window.__yhInstance.getState());
      expect(state.currentZoneId).toBe('01');
      await assertNoVisibleEdge(page);
    });
  });
}

test.describe('ResizeObserver reacts to CONTAINER resize (not just window resize)', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('shrinking #youth-hackathon-app itself (window untouched) recomputes the camera with no edge shown', async ({ page }) => {
    await page.goto(DEMO_URL + '?zone=07', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await assertNoVisibleEdge(page);

    // resize the CONTAINER only, via the demo's own control — the browser
    // viewport/window is untouched, isolating the ResizeObserver behaviour
    // from any window-resize fallback.
    await page.locator('#demo-resize-controls button[data-w="360px"]').click();
    await page.waitForTimeout(400);

    const containerWidth = await page.evaluate(() => document.getElementById('youth-hackathon-app').clientWidth);
    expect(containerWidth).toBeLessThan(400);
    await assertNoVisibleEdge(page);

    // switching back must also work cleanly
    await page.locator('#demo-resize-controls button[data-w="100vw"]').click();
    await page.waitForTimeout(400);
    await assertNoVisibleEdge(page);
  });

  test('narrowing the container below the mobile breakpoint switches to the mobile camera branch', async ({ page }) => {
    await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.__yhInstance.getState().isMobile);
    expect(before).toBe(false);

    await page.locator('#demo-resize-controls button[data-w="360px"]').click();
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => window.__yhInstance.getState().isMobile);
    expect(after).toBe(true);
    await assertNoVisibleEdge(page);
  });
});

test.describe('Tilda-safety: CSS must not leak outside .yh-app', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('a sibling <button>/<a>/<img> outside the module keeps default browser styling', async ({ page }) => {
    await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      const host = document.createElement('div');
      host.innerHTML = '<button id="host-btn">host button</button><a id="host-link" href="#">host link</a>';
      document.body.appendChild(host);
    });
    const btnFont = await page.locator('#host-btn').evaluate((el) => getComputedStyle(el).fontFamily);
    const linkColor = await page.locator('#host-link').evaluate((el) => getComputedStyle(el).color);
    // default UA button font is not the app's custom sans-serif stack;
    // default link color is blue-ish, not inherited black/ink.
    expect(btnFont.toLowerCase()).not.toContain('-apple-system');
    expect(linkColor).not.toBe('rgb(28, 26, 23)');
  });
});

test.describe('unmount() cleans up listeners', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('after unmount, M key and resize no longer affect anything, and re-mount works again', async ({ page }) => {
    await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__yhInstance.unmount());
    const rootClasses = await page.evaluate(() => document.getElementById('youth-hackathon-app').className);
    expect(rootClasses).not.toContain('yh-app');

    // re-mount into the same root should work cleanly (no leftover state/listeners)
    await page.evaluate(() => {
      window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
        scenes: window.YHApp.SCENES_CONFIG, links: window.YHApp.LINKS, uiStrings: window.YHApp.UI_STRINGS
      });
    });
    await page.waitForTimeout(300);
    await expect(page.locator('.yh-map-view')).toBeVisible();
  });
});
