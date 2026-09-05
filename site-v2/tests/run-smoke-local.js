// Plain-Node runner for THIS sandboxed dev environment, using the raw
// `playwright` library directly (proven reliable throughout this session)
// instead of the `@playwright/test` CLI runner, which hangs here — its
// browser-resolution step appears to make network calls the sandbox's
// egress proxy blocks/stalls on (accounts.google.com / component-updater
// style hosts), even with launchOptions.executablePath pinned to the
// pre-installed Chromium. See report: "known issues".
//
// shell.spec.js remains the real, CI-grade Playwright test source of
// truth (standard `@playwright/test` format, meant to run in a normal CI
// runner with unrestricted network). This script re-implements the same
// assertions in a runnable form so Этап 1 can actually be verified now.
//
// Usage: node run-smoke-local.js [baseUrl]

const { chromium } = require('playwright');

const BASE = process.argv[2] || process.env.YH_BASE_URL || 'http://localhost:8970';
const DEMO_URL = BASE + '/site-v2/embed/demo.html';
const ZONE_ORDER = ['00', '01', '02', '03', '04', '05', '06', '07'];
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
    // Chromium's generic "Failed to load resource" console text never
    // includes the failing URL, so it can't be filtered by content here —
    // real network failures are caught precisely (with URL) by the
    // 'response' listener below instead; this listener is left to catch
    // genuine JS errors, which have real, specific messages.
    if (m.type() === 'error' && m.text().indexOf('Failed to load resource') === -1) errors.push('console: ' + m.text());
  });
  page.on('response', function (res) {
    if (res.status() >= 400 && res.url().indexOf('favicon.ico') === -1) {
      errors.push('http ' + res.status() + ': ' + res.url());
    }
  });
  try {
    await fn(page, errors);
  } finally {
    await page.close();
  }
  return errors;
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of VIEWPORTS) {
    // 1. map + all 8 zones reachable, no console errors, no visible edge
    try {
      var errors = await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        var mapVisible = await page.$eval('.yh-map-view', el => !el.hidden);
        assert(mapVisible, 'map not visible on load');
        var dotCount = (await page.$$('.yh-map-hotspot')).length;
        assert(dotCount === 8, 'expected 8 map hotspots, got ' + dotCount);
        for (var i = 0; i < ZONE_ORDER.length; i++) {
          // return to the map before each click — a hotspot from a
          // PREVIOUS iteration is hidden once .yh-map-view[hidden] is set
          // by the navigation that just happened, so re-querying it fresh
          // each time (rather than reusing stale handles) is required.
          if (i > 0) {
            await page.evaluate(() => window.__yhInstance.showMap());
            await page.waitForTimeout(200);
          }
          var dots = await page.$$('.yh-map-hotspot');
          await dots[i].click();
          // 900ms, not 450ms: the zone-switch transition is 800ms with a
          // slight-overshoot easing curve (ported from V1, cubic-bezier
          // (0.22,1,0.36,1)) — checking mid-transition can catch a
          // transient few-px overshoot that settles by the time the
          // transition actually finishes. Checking only the resting state
          // is the correct test of the "no BASE edge visible" requirement.
          await page.waitForTimeout(900);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === ZONE_ORDER[i], 'zone mismatch: expected ' + ZONE_ORDER[i] + ' got ' + state.currentZoneId);
          assert(state.showingMap === false, 'showingMap should be false');
          await assertNoVisibleEdge(page);
        }
      });
      assert(errors.length === 0, 'console errors: ' + JSON.stringify(errors));
      record(vp.name + ': map + all 8 zones reachable, no edge, no console errors', true);
    } catch (e) { record(vp.name + ': map + all 8 zones reachable', false, e.message); }

    // 2. bottom nav from every zone
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=00', { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        for (var zoneId of ZONE_ORDER) {
          var btn = await page.$('.yh-bottom-nav__item[data-zone="' + zoneId + '"]');
          await btn.click();
          await page.waitForTimeout(350);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === zoneId, 'bottom-nav zone mismatch: ' + zoneId + ' vs ' + state.currentZoneId);
          await assertNoVisibleEdge(page);
        }
      });
      record(vp.name + ': bottom nav works from every zone', true);
    } catch (e) { record(vp.name + ': bottom nav works from every zone', false, e.message); }

    // 3. global CTA
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=05', { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        var info = await page.$eval('.yh-cta', el => ({ tag: el.tagName, href: el.getAttribute('href'), box: el.getBoundingClientRect() }));
        assert(info.tag === 'A', 'CTA is not a real <a>, got ' + info.tag);
        var configured = await page.evaluate(() => window.YHApp.LINKS.APPLICATION_URL);
        assert(info.href === configured, 'CTA href does not match config.links.APPLICATION_URL');
        assert(info.box.width >= 44 && info.box.height >= 44, 'CTA hit-area below 44x44: ' + JSON.stringify(info.box));
      });
      record(vp.name + ': global CTA is a real link using APPLICATION_URL, ≥44×44', true);
    } catch (e) { record(vp.name + ': global CTA', false, e.message); }

    // 4. КАРТА ↑ return
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=06', { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        var btn = await page.$('.yh-header__map-return');
        await btn.click();
        await page.waitForTimeout(300);
        var state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.showingMap === true, 'КАРТА ↑ did not return to map');
      });
      record(vp.name + ': КАРТА ↑ returns to map', true);
    } catch (e) { record(vp.name + ': КАРТА ↑ returns to map', false, e.message); }

    // 5. desktop-only: M key
    if (!vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
          await page.waitForTimeout(300);
          await page.click('.yh-scene-viewport', { position: { x: 200, y: 200 } }); // below the header, which sits on top (z-index) over the top ~64px
          await page.keyboard.press('m');
          await page.waitForTimeout(300);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.showingMap === true, 'M key did not return to map');
        });
        record(vp.name + ': M key returns to map', true);
      } catch (e) { record(vp.name + ': M key returns to map', false, e.message); }
    }

    // 6. mobile-only: pointer drag pans without navigating; tap on map hotspot navigates
    if (vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
          await page.waitForTimeout(400);
          var before = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          var box = await page.$eval('.yh-scene-viewport', el => { var r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
          var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
          await page.mouse.move(cx, cy);
          await page.mouse.down();
          await page.mouse.move(cx - 80, cy - 40, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(200);
          var after = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          assert(after !== before, 'drag did not change camera transform');
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === '03', 'drag incorrectly triggered zone navigation');
          await assertNoVisibleEdge(page);
        });
        record(vp.name + ': Pointer Events drag pans without triggering navigation', true);
      } catch (e) { record(vp.name + ': Pointer Events drag pan', false, e.message); }

      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
          await page.waitForTimeout(400);
          var dots = await page.$$('.yh-map-hotspot');
          await dots[4].tap();
          await page.waitForTimeout(400);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === '04', 'tap on map hotspot did not navigate');
        });
        record(vp.name + ': tap (no movement) on map hotspot navigates', true);
      } catch (e) { record(vp.name + ': tap on map hotspot', false, e.message); }
    }

    // 7. prefers-reduced-motion
    try {
      await withPage(browser, vp, async (page) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        var dots = await page.$$('.yh-map-hotspot');
        await dots[1].click();
        await page.waitForTimeout(300);
        var state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '01', 'navigation broken under reduced motion');
        await assertNoVisibleEdge(page);
      });
      record(vp.name + ': prefers-reduced-motion keeps navigation functional', true);
    } catch (e) { record(vp.name + ': prefers-reduced-motion', false, e.message); }
  }

  // ---- ResizeObserver on the CONTAINER (not window) ----
  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL + '?zone=07', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await assertNoVisibleEdge(page);
      await page.click('#demo-resize-controls button[data-w="360px"]');
      await page.waitForTimeout(400);
      var w = await page.$eval('#youth-hackathon-app', el => el.clientWidth);
      assert(w < 400, 'container did not actually shrink, w=' + w);
      await assertNoVisibleEdge(page);
      await page.click('#demo-resize-controls button[data-w="100vw"]');
      await page.waitForTimeout(400);
      await assertNoVisibleEdge(page);
    });
    record('ResizeObserver: container resize (window untouched) recomputes camera, no edge', true);
  } catch (e) { record('ResizeObserver: container resize', false, e.message); }

  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      var before = await page.evaluate(() => window.__yhInstance.getState().isMobile);
      assert(before === false, 'expected desktop branch initially');
      await page.click('#demo-resize-controls button[data-w="360px"]');
      await page.waitForTimeout(400);
      var after = await page.evaluate(() => window.__yhInstance.getState().isMobile);
      assert(after === true, 'container narrower than breakpoint did not switch to mobile branch');
      await assertNoVisibleEdge(page);
    });
    record('ResizeObserver: narrowing container switches desktop/mobile config branch', true);
  } catch (e) { record('ResizeObserver: branch switch', false, e.message); }

  // ---- Tilda-safety: CSS must not leak outside .yh-app ----
  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        var host = document.createElement('div');
        host.innerHTML = '<button id="host-btn">host button</button><a id="host-link" href="#">host link</a>';
        document.body.appendChild(host);
      });
      var btnFont = await page.$eval('#host-btn', el => getComputedStyle(el).fontFamily);
      var linkColor = await page.$eval('#host-link', el => getComputedStyle(el).color);
      assert(btnFont.toLowerCase().indexOf('-apple-system') === -1, 'host button font leaked from .yh-app: ' + btnFont);
      assert(linkColor !== 'rgb(28, 26, 23)', 'host link color leaked from .yh-app: ' + linkColor);
    });
    record('Tilda-safety: sibling <button>/<a> outside .yh-app keep default styling', true);
  } catch (e) { record('Tilda-safety: CSS leak check', false, e.message); }

  // ---- unmount() cleans up ----
  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__yhInstance.unmount());
      var cls = await page.$eval('#youth-hackathon-app', el => el.className);
      assert(cls.indexOf('yh-app') === -1, 'unmount left .yh-app class behind');
      await page.evaluate(() => {
        window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
          scenes: window.YHApp.SCENES_CONFIG, links: window.YHApp.LINKS, uiStrings: window.YHApp.UI_STRINGS
        });
      });
      await page.waitForTimeout(300);
      var mapVisible = await page.$eval('.yh-map-view', el => !el.hidden);
      assert(mapVisible, 're-mount after unmount did not work');
    });
    record('unmount() cleans up, re-mount into same root works', true);
  } catch (e) { record('unmount()/re-mount', false, e.message); }

  await browser.close();

  var passed = results.filter(r => r.pass).length;
  var failed = results.filter(r => !r.pass).length;
  console.log('\n=== ' + passed + ' passed, ' + failed + ' failed (of ' + results.length + ') ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
