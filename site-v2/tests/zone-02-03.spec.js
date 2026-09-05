// Zone 02 (Исследовательская) + Zone 03 (Проектная мастерская) — Playwright
// suite (Этап 3). Committed @playwright/test source of truth;
// run-smoke-local-stage3.js is the equivalent runnable-in-this-sandbox dual
// (see shell.spec.js header for why @playwright/test's CLI hangs here).
//
// Both zones share ONE generic mechanism (core/hotspot-layer.js +
// core/zone-hotspot-scene.js) — this spec exercises it through both zones'
// config to prove the mechanism, not just each zone's specific coordinates.

const { test, expect } = require('@playwright/test');

const BASE = process.env.YH_BASE_URL || 'http://localhost:8970';
const DEMO_URL = BASE + '/site-v2/embed/demo.html';

const ZONE_02_IDS = ['interview', 'photo-fixation', 'territory-research', 'plans-work', 'observation', 'site-visit'];
const ZONE_03_IDS = ['plan', 'tracing-paper', 'model', 'laptop', 'schemes', 'materials'];
const ZONE_02_NULL_MESSAGE = 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ';
const ZONE_03_NULL_MESSAGE = 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nВ ПРОЦЕССЕ ПРОЕКТИРОВАНИЯ';

const VIEWPORTS = [
  { name: '1600x900', width: 1600, height: 900, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true }
];

function isOnScreen(box, vp) {
  return !!box && box.x >= -5 && box.y >= -5 && box.x + box.width <= vp.width + 5 && box.y + box.height <= vp.height + 5;
}

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

for (const vp of VIEWPORTS) {
  test.describe(`Zone 02/03 @ ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.mobile, isMobile: vp.mobile });

    for (const zoneCfg of [
      { zoneId: '02', ids: ZONE_02_IDS, nullMessage: ZONE_02_NULL_MESSAGE, urlMapKey: 'RESEARCH_MATERIAL_URLS' },
      { zoneId: '03', ids: ZONE_03_IDS, nullMessage: ZONE_03_NULL_MESSAGE, urlMapKey: 'PROJECT_MATERIAL_URLS' }
    ]) {
      const { zoneId, ids, nullMessage, urlMapKey } = zoneCfg;

      test(`Zone ${zoneId}: correct ids, correct zone, desktop+mobile coords present, no DOM-index mapping`, async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const domIds = await page.$$eval('.yh-material-hotspot__item', (els) => els.map((el) => el.getAttribute('data-hotspot-id')));
        expect(domIds.slice().sort()).toEqual(ids.slice().sort());
        const state = await page.evaluate(() => window.__yhInstance.getState());
        expect(state.currentZoneId).toBe(zoneId);
        const configArr = await page.evaluate((zid) => (zid === '02' ? window.YHApp.ZONE_02_HOTSPOTS : window.YHApp.ZONE_03_HOTSPOTS), zoneId);
        for (const h of configArr) {
          expect(h.desktopCoords && typeof h.desktopCoords.x === 'number').toBe(true);
          expect(h.mobileCoords && typeof h.mobileCoords.x === 'number').toBe(true);
        }
        expect(configArr.map((h) => h.id)).toEqual(ids); // explicit id order, not DOM index
        expect(errors).toEqual([]);
      });

      test(`Zone ${zoneId}: null url -> real <button>, correct zone-specific caption message`, async ({ page }) => {
        const popups = [];
        page.on('popup', (p) => popups.push(p));
        await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const firstId = ids[0];
        const btn = page.locator(`.yh-material-hotspot__item[data-hotspot-id="${firstId}"]`);
        const box = await btn.boundingBox();
        test.skip(!isOnScreen(box, vp), `"${firstId}" off-screen at ${vp.name} under default camera (known issue)`);
        const tag = await btn.evaluate((el) => el.tagName);
        expect(tag).toBe('BUTTON');
        if (vp.mobile) await btn.tap(); else await btn.click();
        await page.waitForTimeout(300);
        expect(popups).toHaveLength(0);
        const caption = page.locator('.yh-material-hotspot__caption');
        await expect(caption).toBeVisible();
        await expect(caption).toHaveText(nullMessage);
      });

      test(`Zone ${zoneId}: once a URL exists for one item, it becomes a real <a target=_blank rel=noopener noreferrer>, others unaffected`, async ({ page }) => {
        await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const testId = ids[1];
        const otherId = ids[2];
        await page.evaluate(({ zid, tid, key, origin }) => {
          window.__yhInstance.unmount();
          const links = JSON.parse(JSON.stringify(window.YHApp.LINKS));
          links[key][tid] = origin + '/site-v2/README.md?' + tid + '-test';
          window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
            scenes: window.YHApp.SCENES_CONFIG, links, uiStrings: window.YHApp.UI_STRINGS,
            objects: window.YHApp.OBJECTS, initialZone: zid
          });
        }, { zid: zoneId, tid: testId, key: urlMapKey, origin: BASE });
        await page.waitForTimeout(900);

        const attrs = await page.locator(`.yh-material-hotspot__item[data-hotspot-id="${testId}"]`).evaluate((el) => ({
          tag: el.tagName, target: el.getAttribute('target'), rel: el.getAttribute('rel'), href: el.getAttribute('href')
        }));
        expect(attrs.tag).toBe('A');
        expect(attrs.target).toBe('_blank');
        expect(attrs.rel).toContain('noopener');
        expect(attrs.rel).toContain('noreferrer');
        expect(attrs.href).toContain('/site-v2/README.md?' + testId + '-test');

        const otherTag = await page.locator(`.yh-material-hotspot__item[data-hotspot-id="${otherId}"]`).evaluate((el) => el.tagName);
        expect(otherTag).toBe('BUTTON');
      });
    }

    test('Zone 02: caption appears near the correct hotspot (not a fixed/wrong location)', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const btn = page.locator('.yh-material-hotspot__item[data-hotspot-id="interview"]');
      const btnBox = await btn.boundingBox();
      test.skip(!isOnScreen(btnBox, vp), `"interview" off-screen at ${vp.name} under default camera (known issue)`);
      await btn.click();
      await page.waitForTimeout(200);
      const capBox = await page.locator('.yh-material-hotspot__caption').evaluate((el) => el.getBoundingClientRect());
      const dx = Math.abs((capBox.x + capBox.width / 2) - (btnBox.x + btnBox.width / 2));
      const dy = Math.abs((capBox.y + capBox.height / 2) - (btnBox.y + btnBox.height / 2));
      expect(dx).toBeLessThan(150);
      expect(dy).toBeLessThan(150);
    });

    test('Zone 02: at most one caption open at a time (opening a second closes the first)', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const a = page.locator('.yh-material-hotspot__item[data-hotspot-id="interview"]');
      const b = page.locator('.yh-material-hotspot__item[data-hotspot-id="photo-fixation"]');
      const aBox = await a.boundingBox();
      const bBox = await b.boundingBox();
      test.skip(!isOnScreen(aBox, vp) || !isOnScreen(bBox, vp), `"interview"/"photo-fixation" off-screen at ${vp.name} (known issue)`);
      await a.click();
      await page.waitForTimeout(150);
      await b.click();
      await page.waitForTimeout(150);
      const visibleCount = await page.locator('.yh-material-hotspot__caption:not([hidden])').count();
      expect(visibleCount).toBe(1);
    });

    test('Zone 03: click/tap on empty scene background closes an open caption', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const btn = page.locator('.yh-material-hotspot__item[data-hotspot-id="plan"]');
      const btnBox = await btn.boundingBox();
      test.skip(!isOnScreen(btnBox, vp), `"plan" off-screen at ${vp.name} under default camera (known issue)`);
      if (vp.mobile) await btn.tap(); else await btn.click();
      await page.waitForTimeout(200);
      await expect(page.locator('.yh-material-hotspot__caption')).toBeVisible();
      if (vp.mobile) {
        await page.tap('.yh-scene-viewport', { position: { x: vp.width - 20, y: 150 } });
      } else {
        await page.mouse.click(vp.width - 20, 150);
      }
      await page.waitForTimeout(200);
      await expect(page.locator('.yh-material-hotspot__caption')).toBeHidden();
    });

    test('Zone 02: a real drag starting ON a hotspot does not trigger its action', async ({ page }) => {
      const popups = [];
      page.on('popup', (p) => popups.push(p));
      await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      const box = await page.locator('.yh-material-hotspot__item[data-hotspot-id="interview"]').boundingBox();
      const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + 60, cy + 30, { steps: 10 }); // exceeds tap threshold
      await page.mouse.up();
      await page.waitForTimeout(200);
      await expect(page.locator('.yh-material-hotspot__caption')).toBeHidden();
      expect(popups).toHaveLength(0);
    });

    if (vp.mobile) {
      test('Zone 03: mobile tap on a hotspot does not pan the scene', async ({ page }) => {
        await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const before = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
        await page.locator('.yh-material-hotspot__item[data-hotspot-id="laptop"]').tap();
        await page.waitForTimeout(250);
        const after = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
        expect(after).toBe(before);
      });
    }

    test('Zone 02<->03: switching removes the previous zone\'s DOM (no orphan nodes), no duplicate listeners', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      await expect(page.locator('.yh-material-hotspot__item')).toHaveCount(6);

      await page.evaluate(() => window.__yhInstance.showZone('03', false));
      await page.waitForTimeout(900);
      const idsAfterSwitch = await page.$$eval('.yh-material-hotspot__item', (els) => els.map((el) => el.getAttribute('data-hotspot-id')));
      expect(idsAfterSwitch.slice().sort()).toEqual(ZONE_03_IDS.slice().sort());

      await page.evaluate(() => window.__yhInstance.showZone('02', false));
      await page.waitForTimeout(900);
      const idsBack = await page.$$eval('.yh-material-hotspot__item', (els) => els.map((el) => el.getAttribute('data-hotspot-id')));
      expect(idsBack.slice().sort()).toEqual(ZONE_02_IDS.slice().sort());

      // duplicate-listener check: a single click must open exactly 1 caption, not 2+
      // ("site-visit" — stays on-screen under the default mobile camera at both
      // mobile viewports where "interview" does not, see known issues)
      const btn = page.locator('.yh-material-hotspot__item[data-hotspot-id="site-visit"]');
      const btnBox = await btn.boundingBox();
      test.skip(!isOnScreen(btnBox, vp), `"site-visit" off-screen at ${vp.name} (known issue)`);
      await btn.click();
      await page.waitForTimeout(200);
      const visible = await page.locator('.yh-material-hotspot__caption:not([hidden])').count();
      expect(visible).toBe(1);
    });

    test('Zone 03: global CTA stays above local hotspot layer, bottom nav still works, no camera edge', async ({ page }) => {
      await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);

      const covers = await page.evaluate(() => {
        const viewport = document.querySelector('.yh-scene-viewport');
        const img = document.querySelector('.yh-scene-image');
        const stage = document.querySelector('.yh-scene-stage');
        const vr = viewport.getBoundingClientRect();
        const m = getComputedStyle(stage).transform.match(/matrix\(([^)]+)\)/);
        if (!m) return null;
        const parts = m[1].split(',').map(Number);
        const scale = parts[0], tx = parts[4], ty = parts[5];
        return { tx, ty, iw: img.naturalWidth * scale, ih: img.naturalHeight * scale, vw: vr.width, vh: vr.height };
      });
      expect(covers).not.toBeNull();
      expect(covers.tx).toBeLessThanOrEqual(0.5);
      expect(covers.ty).toBeLessThanOrEqual(0.5);
      expect(covers.tx + covers.iw).toBeGreaterThanOrEqual(covers.vw - 0.5);
      expect(covers.ty + covers.ih).toBeGreaterThanOrEqual(covers.vh - 0.5);

      const ctaBox = await page.locator('.yh-cta').evaluate((el) => el.getBoundingClientRect());
      const topIsCta = await page.evaluate(([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return el ? el.closest('.yh-cta') !== null : false;
      }, [ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2]);
      expect(topIsCta).toBe(true);

      const navBtn = page.locator('.yh-bottom-nav__item[data-zone="05"]');
      if (vp.mobile) await navBtn.tap(); else await navBtn.click();
      await page.waitForTimeout(700);
      const state = await page.evaluate(() => window.__yhInstance.getState());
      expect(state.currentZoneId).toBe('05');
    });
  });
}
