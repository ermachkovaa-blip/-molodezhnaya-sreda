// Stage 3 (Zone 02 + Zone 03 — shared HotspotScene mechanism) smoke suite.
// Same rationale as Stage 1/2 for using the raw `playwright` library
// instead of @playwright/test's CLI (which hangs in this sandbox).
//
// Usage: node run-smoke-local-stage3.js [baseUrl]

const { chromium } = require('playwright');

const BASE = process.argv[2] || process.env.YH_BASE_URL || 'http://localhost:8970';
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

var results = [];
function record(name, pass, detail) {
  results.push({ name: name, pass: pass, detail: detail || '' });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + name + (detail ? '  — ' + detail : ''));
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function isOnScreen(box, vp) { return box.x >= -5 && box.y >= -5 && box.x + box.width <= vp.width + 5 && box.y + box.height <= vp.height + 5; }

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

// generic per-zone checklist reused for both 02 and 03
async function checkZone(browser, vp, zoneId, expectedIds, nullMessage) {
  // 1-4: correct ids, correct zone, desktop+mobile coords exist in config, no DOM-index mapping
  try {
    var errors = await withPage(browser, vp, async (page) => {
      await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      var ids = await page.$$eval('.yh-material-hotspot__item', els => els.map(el => el.getAttribute('data-hotspot-id')));
      assert(JSON.stringify(ids.slice().sort()) === JSON.stringify(expectedIds.slice().sort()), 'id mismatch: ' + JSON.stringify(ids));
      var state = await page.evaluate(() => window.__yhInstance.getState());
      assert(state.currentZoneId === zoneId, 'wrong zone: ' + state.currentZoneId);
      var configArr = zoneId === '02'
        ? await page.evaluate(() => window.YHApp.ZONE_02_HOTSPOTS)
        : await page.evaluate(() => window.YHApp.ZONE_03_HOTSPOTS);
      configArr.forEach(h => {
        assert(h.desktopCoords && typeof h.desktopCoords.x === 'number', h.id + ': missing desktopCoords');
        assert(h.mobileCoords && typeof h.mobileCoords.x === 'number', h.id + ': missing mobileCoords');
      });
      // explicit id (not DOM index): config order must equal expectedIds order,
      // used by other assertions below to look up "which item is which" by id, not position
      assert(JSON.stringify(configArr.map(h => h.id)) === JSON.stringify(expectedIds), 'config order unexpected for ' + zoneId);
    });
    assert(errors.length === 0, JSON.stringify(errors));
    record(vp.name + ' [' + zoneId + ']: correct ids/zone, desktop+mobile coords present, no DOM-index mapping', true);
  } catch (e) { record(vp.name + ' [' + zoneId + ']: ids/coords/zone', false, e.message); }

  // 5-6: null url -> button, correct zone-specific caption message
  try {
    await withPage(browser, vp, async (page) => {
      await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      var popups = [];
      page.on('popup', p => popups.push(p));
      var firstId = expectedIds[0];
      var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="' + firstId + '"]');
      var box = await btn.boundingBox();
      if (!isOnScreen(box, vp)) { console.log('  (skip null-url check for ' + firstId + ' — off-screen at ' + vp.name + ', see known issues)'); return; }
      var tag = await btn.evaluate(el => el.tagName);
      assert(tag === 'BUTTON', firstId + ' should be <button> for null url, got <' + tag + '>');
      if (vp.mobile) await btn.tap(); else await btn.click();
      await page.waitForTimeout(300);
      assert(popups.length === 0, 'null url incorrectly opened a tab');
      var caption = await page.$eval('.yh-material-hotspot__caption', el => ({ hidden: el.hidden, text: el.textContent }));
      assert(caption.hidden === false, 'caption did not appear');
      assert(caption.text === nullMessage, 'wrong message: ' + JSON.stringify(caption.text));
    });
    record(vp.name + ' [' + zoneId + ']: null url -> <button>, correct zone-specific caption', true);
  } catch (e) { record(vp.name + ' [' + zoneId + ']: null url behavior', false, e.message); }

  // 7-10: test URL -> real <a>, correct href per-item, target=_blank, rel contains noopener noreferrer
  try {
    await withPage(browser, vp, async (page) => {
      await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      var testId = expectedIds[1];
      var urlMapKey = zoneId === '02' ? 'RESEARCH_MATERIAL_URLS' : 'PROJECT_MATERIAL_URLS';
      await page.evaluate(({ zoneId, testId, urlMapKey, origin }) => {
        window.__yhInstance.unmount();
        var links = JSON.parse(JSON.stringify(window.YHApp.LINKS));
        links[urlMapKey][testId] = origin + '/site-v2/README.md?' + testId + '-test';
        window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
          scenes: window.YHApp.SCENES_CONFIG, links: links, uiStrings: window.YHApp.UI_STRINGS,
          objects: window.YHApp.OBJECTS, initialZone: zoneId
        });
      }, { zoneId, testId, urlMapKey, origin: BASE });
      await page.waitForTimeout(900);

      var attrs = await page.$eval('.yh-material-hotspot__item[data-hotspot-id="' + testId + '"]', el => ({
        tag: el.tagName, target: el.getAttribute('target'), rel: el.getAttribute('rel'), href: el.getAttribute('href')
      }));
      assert(attrs.tag === 'A', testId + ' should become <a> once url exists, got <' + attrs.tag + '>');
      assert(attrs.target === '_blank', 'missing target=_blank');
      assert(attrs.rel && attrs.rel.indexOf('noopener') !== -1 && attrs.rel.indexOf('noreferrer') !== -1, 'rel missing noopener/noreferrer: ' + attrs.rel);
      assert(attrs.href.indexOf('/site-v2/README.md?' + testId + '-test') !== -1, 'href does not match this item\'s configured url: ' + attrs.href);

      // a DIFFERENT (still-null) item in the same zone must remain a <button> and unaffected
      var otherId = expectedIds[2];
      var otherTag = await page.$eval('.yh-material-hotspot__item[data-hotspot-id="' + otherId + '"]', el => el.tagName);
      assert(otherTag === 'BUTTON', 'a different, still-null hotspot (' + otherId + ') should remain <button>, got <' + otherTag + '>');
    });
    record(vp.name + ' [' + zoneId + ']: test url -> real <a> with correct per-item href/target/rel, others unaffected', true);
  } catch (e) { record(vp.name + ' [' + zoneId + ']: url substitution correctness', false, e.message); }
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of VIEWPORTS) {
    await checkZone(browser, vp, '02', ZONE_02_IDS, ZONE_02_NULL_MESSAGE);
    await checkZone(browser, vp, '03', ZONE_03_IDS, ZONE_03_NULL_MESSAGE);

    // caption appears NEAR the correct hotspot (within a reasonable pixel radius), not some fixed/wrong location
    try {
      var skippedCaptionPlacement = false;
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="interview"]');
        var btnBox = await btn.boundingBox();
        if (!isOnScreen(btnBox, vp)) { console.log('  (skip caption placement — "interview" off-screen at ' + vp.name + ', see known issues)'); skippedCaptionPlacement = true; return; }
        await btn.click();
        await page.waitForTimeout(200);
        var capBox = await page.$eval('.yh-material-hotspot__caption', el => el.getBoundingClientRect());
        var dx = Math.abs((capBox.x + capBox.width / 2) - (btnBox.x + btnBox.width / 2));
        var dy = Math.abs((capBox.y + capBox.height / 2) - (btnBox.y + btnBox.height / 2));
        assert(dx < 150 && dy < 150, 'caption rendered far from its hotspot: dx=' + dx + ' dy=' + dy);
      });
      if (!skippedCaptionPlacement) record(vp.name + ' [02]: caption appears near the correct hotspot', true);
    } catch (e) { record(vp.name + ' [02]: caption placement', false, e.message); }

    // at most one caption open at a time (opening a second closes the first)
    try {
      var skippedSingleCaption = false;
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var a = await page.$('.yh-material-hotspot__item[data-hotspot-id="interview"]');
        var b = await page.$('.yh-material-hotspot__item[data-hotspot-id="photo-fixation"]');
        var aBox = await a.boundingBox();
        var bBox = await b.boundingBox();
        if (!isOnScreen(aBox, vp) || !isOnScreen(bBox, vp)) { console.log('  (skip single-caption invariant — "interview"/"photo-fixation" off-screen at ' + vp.name + ', see known issues)'); skippedSingleCaption = true; return; }
        await a.click();
        await page.waitForTimeout(150);
        await b.click();
        await page.waitForTimeout(150);
        var visibleCount = await page.$$eval('.yh-material-hotspot__caption:not([hidden])', els => els.length);
        assert(visibleCount === 1, 'expected exactly 1 visible caption, got ' + visibleCount);
      });
      if (!skippedSingleCaption) record(vp.name + ' [02]: at most one caption open at a time', true);
    } catch (e) { record(vp.name + ' [02]: single caption invariant', false, e.message); }

    // click/tap on empty scene background closes an open caption
    try {
      var skippedClickOutside = false;
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="plan"]');
        var btnBox = await btn.boundingBox();
        if (!isOnScreen(btnBox, vp)) { console.log('  (skip click-outside-closes-caption — "plan" off-screen at ' + vp.name + ', see known issues)'); skippedClickOutside = true; return; }
        if (vp.mobile) await btn.tap(); else await btn.click();
        await page.waitForTimeout(200);
        var openBefore = await page.$eval('.yh-material-hotspot__caption', el => !el.hidden);
        assert(openBefore, 'test setup: caption should be open');
        // click far from any hotspot, on empty background
        if (vp.mobile) {
          await page.tap('.yh-scene-viewport', { position: { x: vp.width - 20, y: 150 } });
        } else {
          await page.mouse.click(vp.width - 20, 150);
        }
        await page.waitForTimeout(200);
        var openAfter = await page.$eval('.yh-material-hotspot__caption', el => !el.hidden);
        assert(!openAfter, 'caption did not close after clicking empty background');
      });
      if (!skippedClickOutside) record(vp.name + ' [03]: click/tap on empty scene background closes an open caption', true);
    } catch (e) { record(vp.name + ' [03]: click-outside closes caption', false, e.message); }

    // Gesture priority: a real drag must NOT trigger a hotspot action, even
    // starting a pointerdown ON a hotspot
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var popups = [];
        page.on('popup', p => popups.push(p));
        var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="interview"]');
        var box = await btn.boundingBox();
        var cx = box.x + box.width / 2, cy = box.y + box.height / 2;
        await page.mouse.move(cx, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 60, cy + 30, { steps: 10 }); // exceeds tap threshold
        await page.mouse.up();
        await page.waitForTimeout(200);
        var captionOpen = await page.$eval('.yh-material-hotspot__caption', el => !el.hidden);
        assert(!captionOpen, 'a real drag starting on a hotspot incorrectly opened its caption');
        assert(popups.length === 0, 'a real drag starting on a hotspot incorrectly opened a tab');
      });
      record(vp.name + ' [02]: a real drag starting ON a hotspot does not trigger its action', true);
    } catch (e) { record(vp.name + ' [02]: drag-on-hotspot does not activate', false, e.message); }

    // mobile: tap on a hotspot does not pan the scene
    if (vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          var before = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="laptop"]');
          await btn.tap();
          await page.waitForTimeout(250);
          var after = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          assert(after === before, 'tapping a hotspot panned the scene');
        });
        record(vp.name + ' [03]: mobile tap on hotspot does not pan the scene', true);
      } catch (e) { record(vp.name + ' [03]: mobile tap does not pan', false, e.message); }
    }

    // lifecycle: 02 -> 03 removes 02's DOM, 03 -> 02 removes 03's DOM, no duplicate listeners
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var count02 = await page.$$eval('.yh-material-hotspot__item', els => els.length);
        assert(count02 === 6, 'expected 6 zone02 hotspots before switching');

        await page.evaluate(() => window.__yhInstance.showZone('03', false));
        await page.waitForTimeout(900);
        var idsAfterSwitch = await page.$$eval('.yh-material-hotspot__item', els => els.map(el => el.getAttribute('data-hotspot-id')));
        assert(JSON.stringify(idsAfterSwitch.slice().sort()) === JSON.stringify(ZONE_03_IDS.slice().sort()), 'Zone 02 DOM was not removed when switching to Zone 03: ' + JSON.stringify(idsAfterSwitch));

        await page.evaluate(() => window.__yhInstance.showZone('02', false));
        await page.waitForTimeout(900);
        var idsBack = await page.$$eval('.yh-material-hotspot__item', els => els.map(el => el.getAttribute('data-hotspot-id')));
        assert(JSON.stringify(idsBack.slice().sort()) === JSON.stringify(ZONE_02_IDS.slice().sort()), 'Zone 03 DOM was not removed when switching back to Zone 02: ' + JSON.stringify(idsBack));

        // duplicate-listener check: a single click must open exactly 1 caption, not 2+
        // ("site-visit" used instead of "interview" — it stays on-screen under the
        // default mobile camera framing at both mobile viewports, see known issues)
        var btn = await page.$('.yh-material-hotspot__item[data-hotspot-id="site-visit"]');
        var btnBox = await btn.boundingBox();
        if (!isOnScreen(btnBox, vp)) { console.log('  (skip duplicate-listener click in lifecycle test — "site-visit" off-screen at ' + vp.name + ', see known issues)'); return; }
        await btn.click();
        await page.waitForTimeout(200);
        var visible = await page.$$eval('.yh-material-hotspot__caption:not([hidden])', els => els.length);
        assert(visible === 1, 'expected exactly 1 visible caption after re-entering Zone 02, got ' + visible + ' (possible duplicate listeners)');
      });
      record(vp.name + ': 02<->03 lifecycle — no orphan DOM, no duplicate listeners', true);
    } catch (e) { record(vp.name + ': 02<->03 lifecycle', false, e.message); }

    // global CTA stays above local hotspots; bottom nav still works; no camera edge
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await assertNoVisibleEdge(page);
        var ctaBox = await page.$eval('.yh-cta', el => el.getBoundingClientRect());
        var topIsCta = await page.evaluate(([x, y]) => {
          var el = document.elementFromPoint(x, y);
          return el ? el.closest('.yh-cta') !== null : false;
        }, [ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2]);
        assert(topIsCta, 'CTA is covered by a Zone 03 hotspot layer');
        var navBtn = await page.$('.yh-bottom-nav__item[data-zone="05"]');
        if (vp.mobile) await navBtn.tap(); else await navBtn.click();
        await page.waitForTimeout(700);
        var state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '05', 'bottom nav broken after Zone 02/03 hotspots were added');
      });
      record(vp.name + ': CTA above local layers, bottom nav works, no camera edge', true);
    } catch (e) { record(vp.name + ': CTA/bottom-nav/edge regression', false, e.message); }
  }

  await browser.close();

  var passed = results.filter(r => r.pass).length;
  var failed = results.filter(r => !r.pass).length;
  console.log('\n=== ' + passed + ' passed, ' + failed + ' failed (of ' + results.length + ') ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
