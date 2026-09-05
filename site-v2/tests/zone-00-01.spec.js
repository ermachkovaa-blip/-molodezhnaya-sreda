// Zone 00 (map) + Zone 01 (Холл) — Playwright suite (Этап 2).
// Committed @playwright/test source of truth; run-smoke-local-stage2.js is
// the equivalent runnable-in-this-sandbox dual (see shell.spec.js header
// for why @playwright/test's CLI hangs here).

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
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errors.push('console: ' + m.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) errors.push('http ' + res.status() + ': ' + res.url());
  });
  return errors;
}

function isOnScreen(box, vp) {
  return box.x >= -5 && box.y >= -5 && box.x + box.width <= vp.width + 5 && box.y + box.height <= vp.height + 5;
}

for (const vp of VIEWPORTS) {
  test.describe(`Zone 00/01 @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.mobile, isMobile: vp.mobile });

    test('Zone 00: 8 map hotspots, correct ids, ≥44×44, each navigates correctly', async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);

      const info = await page.$$eval('.yh-map-hotspot', (els) => els.map((el) => {
        const r = el.getBoundingClientRect();
        return { zone: el.getAttribute('data-zone'), w: r.width, h: r.height };
      }));
      expect(info).toHaveLength(8);
      info.forEach((i) => {
        expect(i.w).toBeGreaterThanOrEqual(44);
        expect(i.h).toBeGreaterThanOrEqual(44);
      });
      expect(info.map((i) => i.zone).sort()).toEqual([...ZONE_ORDER].sort());

      for (const zoneId of ZONE_ORDER) {
        await page.evaluate(() => window.__yhInstance.showMap());
        await page.waitForTimeout(150);
        const btn = page.locator(`.yh-map-hotspot[data-zone="${zoneId}"]`);
        if (vp.mobile) await btn.tap(); else await btn.click();
        await page.waitForTimeout(400);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe(zoneId);
      }
      expect(errors).toEqual([]);
    });

    test('Zone 00: last-visited zone is marked on return to map', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await page.click('.yh-header__map-return');
      await page.waitForTimeout(300);
      await expect(page.locator('.yh-map-hotspot--last-visited[data-zone="03"]')).toHaveCount(1);
    });

    if (!vp.mobile) {
      test('Zone 00: keyboard Tab + Enter activates a hotspot', async ({ page }) => {
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        await page.evaluate(() => document.querySelectorAll('.yh-map-hotspot')[2].focus());
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe('02');
      });
    }

    test('Zone 01: 5 explicit object ids, matching config (not DOM index)', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const ids = await page.$$eval('.yh-object-hotspot__item', (els) => els.map((el) => el.getAttribute('data-hotspot-id')));
      expect(ids.slice().sort()).toEqual(['bugulma', 'elabuga', 'laishevo', 'shemordan', 'stolbishche'].sort());
      const configIds = await page.evaluate(() => window.YHApp.OBJECTS.map((o) => o.id));
      expect(configIds).toEqual(['bugulma', 'elabuga', 'shemordan', 'laishevo', 'stolbishche']);
    });

    test('Zone 01: null sourceMaterialsUrl shows the correct caption and opens no tab', async ({ page }) => {
      const popups = [];
      page.on('popup', (p) => popups.push(p));
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const btn = page.locator('.yh-object-hotspot__item[data-hotspot-id="elabuga"]'); // on-screen by default at all 4 viewports
      if (vp.mobile) await btn.tap(); else await btn.click();
      await page.waitForTimeout(300);
      expect(popups).toHaveLength(0);
      const caption = page.locator('.yh-hotspot-caption');
      await expect(caption).toBeVisible();
      await expect(caption).toHaveText('МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ');
    });

    test('Zone 01: a substituted URL opens exactly that object\'s link (target=_blank, noopener), others unaffected', async ({ page, context }) => {
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      await page.evaluate((origin) => {
        window.__yhInstance.unmount();
        const objs = window.YHApp.OBJECTS.map((o) => Object.assign({}, o));
        objs.find((o) => o.id === 'elabuga').sourceMaterialsUrl = origin + '/site-v2/README.md?elabuga-test-materials';
        window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
          scenes: window.YHApp.SCENES_CONFIG, links: window.YHApp.LINKS, uiStrings: window.YHApp.UI_STRINGS,
          objects: objs, initialZone: '01'
        });
      }, BASE);
      await page.waitForTimeout(900);

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        vp.mobile ? page.locator('.yh-object-hotspot__item[data-hotspot-id="elabuga"]').tap()
                  : page.locator('.yh-object-hotspot__item[data-hotspot-id="elabuga"]').click()
      ]);
      await popup.waitForLoadState();
      expect(popup.url()).toContain('/site-v2/README.md?elabuga-test-materials');
      const opener = await popup.evaluate(() => window.opener);
      expect(opener).toBeNull();
      await popup.close();

      const popups2 = [];
      page.on('popup', (p) => popups2.push(p));
      const otherBtn = page.locator('.yh-object-hotspot__item[data-hotspot-id="bugulma"]');
      const box = await otherBtn.boundingBox();
      if (isOnScreen(box, vp)) {
        if (vp.mobile) await otherBtn.tap(); else await otherBtn.click();
        await page.waitForTimeout(300);
        expect(popups2).toHaveLength(0);
      }
    });

    if (!vp.mobile) {
      test('Zone 01: program-wall hover is not click-navigation', async ({ page }) => {
        const popups = [];
        page.on('popup', (p) => popups.push(p));
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const stage = page.locator('.yh-program-wall__stage').first();
        await stage.hover();
        await page.waitForTimeout(150);
        await stage.click({ force: true });
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe('01');
        expect(popups).toHaveLength(0);
      });
    }

    test('Zone 01: passage hotspot navigates to Zone 02', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const vbox = await page.locator('.yh-scene-viewport').boundingBox();
      const cx = vbox.x + vbox.width / 2, cy = vbox.y + vbox.height / 2;
      let box = await page.locator('.yh-passage-hotspot__item').boundingBox();
      for (let attempt = 0; attempt < 8 && !isOnScreen(box, vp); attempt++) {
        await page.mouse.move(cx + vbox.width * 0.4, cy);
        await page.mouse.down();
        await page.mouse.move(cx - vbox.width * 0.4, cy, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(150);
        box = await page.locator('.yh-passage-hotspot__item').boundingBox();
      }
      expect(isOnScreen(box, vp)).toBe(true);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(900);
      const state = await page.evaluate(() => window.__yhInstance.getState());
      expect(state.currentZoneId).toBe('02');
    });

    if (vp.mobile) {
      test('Zone 01: tap on an object hotspot does not pan the scene', async ({ page }) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const before = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
        await page.locator('.yh-object-hotspot__item[data-hotspot-id="elabuga"]').tap();
        await page.waitForTimeout(300);
        const after = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
        expect(after).toBe(before);
      });
    }
  });
}
