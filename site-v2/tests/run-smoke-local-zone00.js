// Zone 00 (УЛИЦА / ВХОД) Visual Integration smoke suite — first-ever local
// interactivity for this zone (in-scene "КАРТА ХАКАТОНА" map, 8 nav
// hotspots + desktop CTA hotspot). Same raw-`playwright` rationale as
// every previous stage (see shell.spec.js header).
//
// Usage: node run-smoke-local-zone00.js [baseUrl]

const { chromium } = require('playwright');

const BASE = process.argv[2] || process.env.YH_BASE_URL || 'http://localhost:8970';
const DEMO_URL = BASE + '/site-v2/embed/demo.html';

const ZONE_TITLES = {
  '00': 'УЛИЦА / ВХОД', '01': 'ХОЛЛ', '02': 'ИССЛЕДОВАТЕЛЬСКАЯ', '03': 'ПРОЕКТНАЯ МАСТЕРСКАЯ',
  '04': 'АРХИВ / КАРТОТЕКА', '05': 'ГАЛЕРЕЯ / БИБЛИОТЕКА', '06': 'КОМАНДА', '07': 'АМФИТЕАТР'
};
const ALL_IDS = Object.keys(ZONE_TITLES);

const VIEWPORTS = [
  { name: '1600x900', width: 1600, height: 900, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true }
];

var results = [];
function record(name, pass, detail) {
  results.push({ name: name, pass: pass, detail: detail || '' });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function isOnScreen(box, vp) { return !!box && box.x >= -5 && box.y >= -5 && box.x + box.width <= vp.width + 5 && box.y + box.height <= vp.height + 5; }

async function withPage(browser, vp, fn) {
  var page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, hasTouch: vp.mobile, isMobile: vp.mobile });
  var errors = [];
  page.on('pageerror', function (e) { errors.push('pageerror: ' + e.message); });
  page.on('console', function (m) {
    if (m.type() === 'error' && m.text().indexOf('Failed to load resource') === -1) errors.push('console: ' + m.text());
  });
  page.on('response', function (res) {
    if (res.status() >= 400 && res.url().indexOf('favicon.ico') === -1) errors.push('http ' + res.status() + ': ' + res.url());
  });
  try {
    await fn(page, errors);
  } finally {
    await page.close();
  }
  return errors;
}

async function assertNoVisibleEdge(page) {
  var covers = await page.evaluate(function () {
    var viewport = document.querySelector('.yh-scene-viewport');
    var img = document.querySelector('.yh-scene-image');
    var stage = document.querySelector('.yh-scene-stage');
    var vr = viewport.getBoundingClientRect();
    var m = getComputedStyle(stage).transform.match(/matrix\(([^)]+)\)/);
    if (!m) return null;
    var parts = m[1].split(',').map(Number);
    var scale = parts[0], tx = parts[4], ty = parts[5];
    return { tx: tx, ty: ty, iw: img.naturalWidth * scale, ih: img.naturalHeight * scale, vw: vr.width, vh: vr.height };
  });
  assert(covers, 'no transform matrix found');
  assert(covers.tx <= 0.5, 'left edge visible, tx=' + covers.tx);
  assert(covers.ty <= 0.5, 'top edge visible, ty=' + covers.ty);
  assert(covers.tx + covers.iw >= covers.vw - 0.5, 'right edge visible');
  assert(covers.ty + covers.ih >= covers.vh - 0.5, 'bottom edge visible');
}

async function panUntilOnScreen(page, vp, targetSelector, maxAttempts) {
  var vbox = await page.locator('.yh-scene-viewport').boundingBox();
  var cx = vbox.x + vbox.width / 2, cy = vbox.y + vbox.height / 2;
  var box = await page.locator(targetSelector).boundingBox();
  var attempts = 0;
  while (!isOnScreen(box, vp) && attempts < maxAttempts) {
    var dirX = attempts % 4 < 2 ? -1 : 1;
    var dirY = attempts % 2 === 0 ? -1 : 1;
    await page.mouse.move(cx - dirX * vbox.width * 0.35, cy - dirY * vbox.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(cx + dirX * vbox.width * 0.35, cy + dirY * vbox.height * 0.35, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    box = await page.locator(targetSelector).boundingBox();
    attempts++;
  }
  return box;
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of VIEWPORTS) {
    // 1: all 8 nav hotspots exist, correct ids, config coords present
    try {
      const errors = await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const domIds = await page.$$eval('.yh-zone00-hotspot__item', (els) => els.map((el) => el.getAttribute('data-hotspot-id')));
        const expectedIds = ALL_IDS.concat(['cta']); // CTA hotspot renders on both platforms since the final mobile BASE also bakes it in
        assert(domIds.slice().sort().join(',') === expectedIds.slice().sort().join(','), 'id mismatch: ' + JSON.stringify(domIds));
        const config = await page.evaluate(() => window.YHApp.ZONE_00_NAV_HOTSPOTS);
        assert(config.length === 8, 'expected 8 nav hotspots in config, got ' + config.length);
        config.forEach((h) => {
          assert(h.desktopCoords && typeof h.desktopCoords.x === 'number', h.id + ': missing desktopCoords');
          assert(h.mobileCoords && typeof h.mobileCoords.x === 'number', h.id + ': missing mobileCoords');
        });
      });
      assert(errors.length === 0, JSON.stringify(errors));
      record(vp.name + ': all 8 nav hotspots present (+ CTA on desktop), config coords complete', true);
    } catch (e) { record(vp.name + ': hotspot presence/config', false, e.message); }

    // 2: 01-07 each navigate to the correct zone (explicit id, not DOM index)
    for (const targetId of ['01', '02', '03', '04', '05', '06', '07']) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          const sel = `.yh-zone00-hotspot__item[data-hotspot-id="${targetId}"]`;
          const box = await panUntilOnScreen(page, vp, sel, 8);
          assert(isOnScreen(box, vp), targetId + ' never reachable via pan at ' + vp.name);
          if (vp.mobile) await page.locator(sel).tap(); else await page.locator(sel).click();
          await page.waitForTimeout(700);
          const state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === targetId, 'expected zone ' + targetId + ', got ' + state.currentZoneId);
        });
        record(vp.name + ': hotspot "' + targetId + '" navigates to Zone ' + targetId, true);
      } catch (e) { record(vp.name + ': navigate to ' + targetId, false, e.message); }
    }

    // 3: "00" reflects current location — no navigation, shows "ВЫ ЗДЕСЬ" caption
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const sel = '.yh-zone00-hotspot__item[data-hotspot-id="00"]';
        const box = await panUntilOnScreen(page, vp, sel, 8);
        assert(isOnScreen(box, vp), '"00" never reachable via pan at ' + vp.name);
        const tag = await page.locator(sel).evaluate((el) => el.tagName);
        assert(tag === 'BUTTON', '"00" should be a <button> (no navigation), got <' + tag + '>');
        if (vp.mobile) await page.locator(sel).tap(); else await page.locator(sel).click();
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '00', 'clicking "00" should not navigate away, got ' + state.currentZoneId);
        const caption = await page.$eval('.yh-zone00-hotspot__caption', (el) => ({ hidden: el.hidden, text: el.textContent }));
        assert(caption.hidden === false && caption.text === 'ВЫ ЗДЕСЬ', 'expected "ВЫ ЗДЕСЬ" caption, got ' + JSON.stringify(caption));
      });
      record(vp.name + ': "00" is current-location marker (no nav, "ВЫ ЗДЕСЬ" caption)', true);
    } catch (e) { record(vp.name + ': current-location "00"', false, e.message); }

    // 4: global MapNavigation ("КАРТА ↑") still works, unaffected by Zone 00's own map
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await page.click('.yh-header__map-return');
        await page.waitForTimeout(300);
        const mapHotspots = await page.$$eval('.yh-map-hotspot', (els) => els.length);
        assert(mapHotspots === 8, 'global Map view should still show 8 hotspots, got ' + mapHotspots);
        const state1 = await page.evaluate(() => window.__yhInstance.getState());
        assert(state1.showingMap === true, 'КАРТА ↑ should open the global map view');
        // navigate from the global map to confirm it still drives zone switches correctly
        const btn = page.locator('.yh-map-hotspot[data-zone="03"]');
        if (vp.mobile) await btn.tap(); else await btn.click();
        await page.waitForTimeout(700);
        const state2 = await page.evaluate(() => window.__yhInstance.getState());
        assert(state2.currentZoneId === '03', 'global map navigation broken after Zone 00 integration');
      });
      record(vp.name + ': global MapNavigation ("КАРТА ↑") unaffected, still 8 hotspots, still navigates', true);
    } catch (e) { record(vp.name + ': global MapNavigation regression', false, e.message); }

    // 5: CTA hotspot (both platforms — final mobile BASE also bakes in the
    // CTA graphic) -> real <a href=APPLICATION_URL target=_blank rel=noopener noreferrer>
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const sel = '.yh-zone00-hotspot__item[data-hotspot-id="cta"]';
        const box = await panUntilOnScreen(page, vp, sel, 8);
        assert(isOnScreen(box, vp), 'CTA hotspot never reachable via pan at ' + vp.name);
        const attrs = await page.locator(sel).evaluate((el) => ({
          tag: el.tagName, href: el.getAttribute('href'), target: el.getAttribute('target'), rel: el.getAttribute('rel')
        }));
        assert(attrs.tag === 'A', 'CTA hotspot should be a real <a>, got <' + attrs.tag + '>');
        const appUrl = await page.evaluate(() => window.YHApp.LINKS.APPLICATION_URL);
        assert(attrs.href && attrs.href.indexOf(appUrl.replace(/^\.\.\//, '')) !== -1 || attrs.href === appUrl, 'CTA href does not match APPLICATION_URL: ' + attrs.href + ' vs ' + appUrl);
        assert(attrs.target === '_blank', 'CTA missing target=_blank');
        assert(attrs.rel && attrs.rel.indexOf('noopener') !== -1 && attrs.rel.indexOf('noreferrer') !== -1, 'CTA rel missing noopener/noreferrer');
      });
      record(vp.name + ': CTA hotspot is a real <a> -> APPLICATION_URL, target=_blank, noopener noreferrer', true);
    } catch (e) { record(vp.name + ': CTA hotspot', false, e.message); }

    // 6: a real drag does not trigger navigation, even starting on a hotspot
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const sel = '.yh-zone00-hotspot__item[data-hotspot-id="01"]';
        const box = await panUntilOnScreen(page, vp, sel, 8);
        assert(isOnScreen(box, vp), '"01" never reachable via pan for drag test');
        const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 60, cy + 30, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
        const state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '00', 'a real drag starting on a hotspot incorrectly navigated to ' + state.currentZoneId);
      });
      record(vp.name + ': a real drag starting on a hotspot does not navigate (drag ≠ tap)', true);
    } catch (e) { record(vp.name + ': drag-does-not-navigate', false, e.message); }

    if (vp.mobile) {
      // 7: mobile tap on a hotspot does not pan the scene
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          const sel = '.yh-zone00-hotspot__item[data-hotspot-id="00"]';
          const box = await panUntilOnScreen(page, vp, sel, 8);
          assert(isOnScreen(box, vp), '"00" never reachable via pan for tap-does-not-pan test');
          const before = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
          await page.locator(sel).tap();
          await page.waitForTimeout(250);
          const after = await page.locator('.yh-scene-stage').evaluate((el) => getComputedStyle(el).transform);
          assert(after === before, 'tapping a Zone 00 hotspot panned the scene');
        });
        record(vp.name + ': mobile tap on hotspot does not pan the scene', true);
      } catch (e) { record(vp.name + ': mobile tap does not pan', false, e.message); }
    }

    // 8: no BASE edge visible after hard panning across the full hotspot spread
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const vbox = await page.locator('.yh-scene-viewport').boundingBox();
        const cx = vbox.x + vbox.width / 2, cy = vbox.y + vbox.height / 2;
        for (const dir of [1, -1, 1, -1]) {
          await page.mouse.move(cx - dir * vbox.width * 0.4, cy - dir * vbox.height * 0.4);
          await page.mouse.down();
          await page.mouse.move(cx + dir * vbox.width * 0.4, cy + dir * vbox.height * 0.4, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(120);
        }
        await assertNoVisibleEdge(page);
      });
      record(vp.name + ': no BASE edge visible after repeated hard panning (Zone 00)', true);
    } catch (e) { record(vp.name + ': pan edge-safety', false, e.message); }

    // 9: lifecycle — 00 -> 01 removes Zone 00's DOM, 01 -> 00 recreates cleanly, no duplicate listeners
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        const count0 = await page.$$eval('.yh-zone00-hotspot__item', (els) => els.length);
        assert(count0 === 9, 'expected 9 Zone 00 hotspots (8 nav + CTA) before switching, got ' + count0);

        await page.evaluate(() => window.__yhInstance.showZone('01', false));
        await page.waitForTimeout(900);
        const orphan = await page.$$eval('.yh-zone00-hotspot__item', (els) => els.length);
        assert(orphan === 0, 'Zone 00 DOM was not removed when switching to Zone 01: ' + orphan + ' nodes left');

        await page.evaluate(() => window.__yhInstance.showZone('00', false));
        await page.waitForTimeout(900);
        const count0b = await page.$$eval('.yh-zone00-hotspot__item', (els) => els.length);
        assert(count0b === 9, 'Zone 00 did not recreate cleanly on return, got ' + count0b);

        const sel = '.yh-zone00-hotspot__item[data-hotspot-id="00"]';
        const box = await panUntilOnScreen(page, vp, sel, 8);
        assert(isOnScreen(box, vp), '"00" never reachable via pan for duplicate-listener check');
        if (vp.mobile) await page.locator(sel).tap(); else await page.locator(sel).click();
        await page.waitForTimeout(200);
        const visible = await page.$$eval('.yh-zone00-hotspot__caption:not([hidden])', (els) => els.length);
        assert(visible === 1, 'expected exactly 1 visible caption after re-entering Zone 00, got ' + visible + ' (possible duplicate listeners)');
      });
      record(vp.name + ': 00<->01 lifecycle — no orphan DOM, clean recreation, no duplicate listeners', true);
    } catch (e) { record(vp.name + ': lifecycle', false, e.message); }
  }

  await browser.close();

  var passed = results.filter(r => r.pass === true).length;
  var failed = results.filter(r => r.pass === false).length;
  var skipped = results.filter(r => r.pass === null).length;
  console.log('\n=== ' + passed + ' passed, ' + skipped + ' skipped, ' + failed + ' failed (of ' + results.length + ') ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
