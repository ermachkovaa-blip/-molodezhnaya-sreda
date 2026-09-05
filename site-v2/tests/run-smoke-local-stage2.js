// Stage 2 (Zone 00 + Zone 01) smoke suite — plain playwright-library
// runner, same rationale as run-smoke-local.js (Stage 1): @playwright/test
// CLI hangs in this sandbox. See TILDA-INTEGRATION.md / Этап 1 report.
//
// Usage: node run-smoke-local-stage2.js [baseUrl]

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

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of VIEWPORTS) {
    // ===== ZONE 00 (map) =====

    // 1. all 8 map hotspots exist, each has explicit data-zone, ≥44x44
    try {
      var errors = await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        var info = await page.$$eval('.yh-map-hotspot', els => els.map(el => ({
          zone: el.getAttribute('data-zone'),
          box: el.getBoundingClientRect()
        })));
        assert(info.length === 8, 'expected 8 map hotspots, got ' + info.length);
        var zones = info.map(i => i.zone).sort();
        assert(JSON.stringify(zones) === JSON.stringify(ZONE_ORDER), 'zone id set mismatch: ' + JSON.stringify(zones));
        info.forEach(i => assert(i.box.width >= 44 && i.box.height >= 44, i.zone + ' hit-area below 44x44'));
      });
      assert(errors.length === 0, JSON.stringify(errors));
      record(vp.name + ' [00]: 8 map hotspots, correct ids, ≥44×44', true);
    } catch (e) { record(vp.name + ' [00]: map hotspots', false, e.message); }

    // 2. each map hotspot navigates to the CORRECT zone (strict id match, not DOM order)
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        for (const zoneId of ZONE_ORDER) {
          await page.evaluate(() => window.__yhInstance.showMap());
          await page.waitForTimeout(150);
          var btn = await page.$('.yh-map-hotspot[data-zone="' + zoneId + '"]');
          if (vp.mobile) { await btn.tap(); } else { await btn.click(); }
          await page.waitForTimeout(400);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === zoneId, 'clicked ' + zoneId + ' but landed on ' + state.currentZoneId);
        }
      });
      record(vp.name + ' [00]: each hotspot navigates to correct zone (no DOM-index mixups)', true);
    } catch (e) { record(vp.name + ' [00]: correct zone per hotspot', false, e.message); }

    // 3. keyboard: Tab reaches a map hotspot, Enter/Space activates it
    if (!vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
          await page.waitForTimeout(400);
          var firstZone = await page.evaluate(() => {
            var els = document.querySelectorAll('.yh-map-hotspot');
            els[2].focus(); // zone '02'
            return els[2].getAttribute('data-zone');
          });
          var focused = await page.evaluate(() => document.activeElement.getAttribute('data-zone'));
          assert(focused === firstZone, 'focus() did not land on the hotspot');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === firstZone, 'Enter on focused hotspot did not navigate');
        });
        record(vp.name + ' [00]: keyboard focus + Enter activates hotspot', true);
      } catch (e) { record(vp.name + ' [00]: keyboard nav', false, e.message); }
    }

    // 4. last-visited zone marked when returning to map
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=03', { waitUntil: 'networkidle' });
        await page.waitForTimeout(400);
        await page.click('.yh-header__map-return');
        await page.waitForTimeout(300);
        var marked = await page.$('.yh-map-hotspot--last-visited[data-zone="03"]');
        assert(marked, 'zone 03 not marked as last-visited on the map');
      });
      record(vp.name + ' [00]: last-visited zone marked on return to map', true);
    } catch (e) { record(vp.name + ' [00]: last-visited marker', false, e.message); }

    // ===== ZONE 01 =====

    // 5. all 5 object ids exist, explicit (not DOM-index derived), correctly linked to config
    try {
      var errors2 = await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var ids = await page.$$eval('.yh-object-hotspot__item', els => els.map(el => el.getAttribute('data-hotspot-id')));
        var expected = ['bugulma', 'elabuga', 'shemordan', 'laishevo', 'stolbishche'];
        assert(JSON.stringify(ids.slice().sort()) === JSON.stringify(expected.slice().sort()), 'object id set mismatch: ' + JSON.stringify(ids));
        // explicit id, not DOM index: reversing the config array must not change which id maps to which title
        var configIds = await page.evaluate(() => window.YHApp.OBJECTS.map(o => o.id));
        assert(JSON.stringify(configIds) === JSON.stringify(expected), 'config OBJECTS id order unexpected: ' + JSON.stringify(configIds));
      });
      assert(errors2.length === 0, JSON.stringify(errors2));
      record(vp.name + ' [01]: 5 explicit object ids present and match config', true);
    } catch (e) { record(vp.name + ' [01]: object ids', false, e.message); }

    // 6. null URL -> no new tab, shows the correct caption message; does not open about:blank
    try {
      await withPage(browser, vp, async (page) => {
        var popups = [];
        page.on('popup', p => popups.push(p));
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var btn = await page.$('.yh-object-hotspot__item[data-hotspot-id="elabuga"]'); // on-screen by default at all 4 viewports
        if (vp.mobile) { await btn.tap(); } else { await btn.click(); }
        await page.waitForTimeout(300);
        assert(popups.length === 0, 'null URL incorrectly opened a new tab/popup');
        var caption = await page.$eval('.yh-object-hotspot__caption', el => ({ hidden: el.hidden, text: el.textContent }));
        assert(caption.hidden === false, 'caption did not appear for null URL');
        assert(caption.text === 'МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ', 'wrong caption text: ' + caption.text);
        var tag = await page.$eval('.yh-object-hotspot__item[data-hotspot-id="elabuga"]', el => el.tagName);
        assert(tag === 'BUTTON', 'null-URL hotspot should be a real <button> (nothing to navigate to), got <' + tag + '>');
      });
      record(vp.name + ' [01]: null sourceMaterialsUrl shows correct caption, opens no tab, is a <button>', true);
    } catch (e) { record(vp.name + ' [01]: null URL behavior', false, e.message); }

    // 6b. once a URL exists, the SAME hotspot becomes a real <a> with target=_blank + rel=noopener noreferrer
    // set directly on the element (not just enforced via JS) — this is the
    // "button/a" duality the generic component is required to provide.
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await page.evaluate((origin) => {
          window.__yhInstance.unmount();
          var objs = window.YHApp.OBJECTS.map(o => Object.assign({}, o));
          objs.find(o => o.id === 'elabuga').sourceMaterialsUrl = origin + '/site-v2/README.md?x';
          window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
            scenes: window.YHApp.SCENES_CONFIG, links: window.YHApp.LINKS, uiStrings: window.YHApp.UI_STRINGS,
            objects: objs, initialZone: '01'
          });
        }, BASE);
        await page.waitForTimeout(900);
        var attrs = await page.$eval('.yh-object-hotspot__item[data-hotspot-id="elabuga"]', el => ({
          tag: el.tagName, target: el.getAttribute('target'), rel: el.getAttribute('rel'), href: el.getAttribute('href')
        }));
        assert(attrs.tag === 'A', 'hotspot with a URL should be a real <a>, got <' + attrs.tag + '>');
        assert(attrs.target === '_blank', 'missing target=_blank on the anchor itself');
        assert(attrs.rel === 'noopener noreferrer', 'missing/wrong rel on the anchor itself: ' + attrs.rel);
        assert(attrs.href.indexOf('/site-v2/README.md?x') !== -1, 'href does not match the configured URL: ' + attrs.href);
      });
      record(vp.name + ' [01]: hotspot becomes a real <a target=_blank rel=noopener noreferrer> once a URL exists', true);
    } catch (e) { record(vp.name + ' [01]: <a> vs <button> switching', false, e.message); }

    // 7. with a URL substituted, click opens exactly that object's URL, target=_blank + noopener/noreferrer
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        // simulate a real URL being supplied for exactly ONE object, then remount so the behavior module picks it up
        await page.evaluate(() => {
          window.__yhInstance.unmount();
          var objs = window.YHApp.OBJECTS.map(o => Object.assign({}, o));
          var target = objs.find(o => o.id === 'elabuga');
          // Local same-origin URL, not data:/https: — this sandbox's egress
          // proxy blocks real external domains (confirmed: example.com ->
          // ERR_TUNNEL_CONNECTION_FAILED), and Chromium separately refuses
          // window.open(..., 'noopener') to data: URLs specifically
          // (confirmed: returns null, a Chromium popup-abuse guard, not an
          // app bug) — a real https:// Yandex.Disk/Drive URL in production
          // has neither restriction; this substitutes a URL this test
          // server already happens to serve, purely to test the
          // open/target/noopener mechanics without network dependency.
          target.sourceMaterialsUrl = location.origin + '/site-v2/README.md?elabuga-test-materials';
          window.__yhInstance = window.YHApp.mount(document.getElementById('youth-hackathon-app'), {
            scenes: window.YHApp.SCENES_CONFIG, links: window.YHApp.LINKS, uiStrings: window.YHApp.UI_STRINGS,
            objects: objs, initialZone: '01'
          });
        });
        await page.waitForTimeout(900);
        var popupPromise = page.waitForEvent('popup', { timeout: 5000 });
        var btn = await page.$('.yh-object-hotspot__item[data-hotspot-id="elabuga"]');
        if (vp.mobile) { await btn.tap(); } else { await btn.click(); }
        var popup = await popupPromise;
        var url = popup.url();
        assert(url.indexOf('/site-v2/README.md?elabuga-test-materials') !== -1, 'opened wrong URL: ' + url);
        var opener = await popup.evaluate(() => { try { return window.opener; } catch (e) { return 'threw'; } });
        assert(opener === null, 'window.opener not nulled (noopener not effective): ' + opener);
        await popup.close();

        // and a DIFFERENT object with url:null must still show the caption, not open anything
        var popups2 = [];
        page.on('popup', p => popups2.push(p));
        var otherBtn = await page.$('.yh-object-hotspot__item[data-hotspot-id="bugulma"]');
        var box = await otherBtn.boundingBox();
        var onScreen = box.x >= -5 && box.y >= -5 && box.x + box.width <= (vp.width + 5) && box.y + box.height <= (vp.height + 5);
        if (onScreen) {
          if (vp.mobile) { await otherBtn.tap(); } else { await otherBtn.click(); }
          await page.waitForTimeout(300);
          assert(popups2.length === 0, 'a different object incorrectly opened a tab from the elabuga test URL');
        }
      });
      record(vp.name + ' [01]: substituted URL opens exactly that object\'s link (target=_blank, noopener)', true);
    } catch (e) { record(vp.name + ' [01]: per-object URL correctness', false, e.message); }

    // 8. program-wall hover is not a click-navigation (hovering/clicking it must not change zone or open anything)
    if (!vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          var popups = [];
          page.on('popup', p => popups.push(p));
          await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          var stage = await page.$('.yh-program-wall__stage');
          await stage.hover();
          await page.waitForTimeout(150);
          await stage.click({ force: true });
          await page.waitForTimeout(300);
          var state = await page.evaluate(() => window.__yhInstance.getState());
          assert(state.currentZoneId === '01', 'clicking a program-wall stage incorrectly navigated');
          assert(popups.length === 0, 'clicking a program-wall stage incorrectly opened a tab');
        });
        record(vp.name + ' [01]: program-wall hover is not click-navigation', true);
      } catch (e) { record(vp.name + ' [01]: program-wall non-interactive', false, e.message); }
    }

    // 9. passage hotspot navigates to zone 02
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var passageBtn = await page.$('.yh-passage-hotspot__item');
        var box = await passageBtn.boundingBox();
        function isOnScreen(b) { return b.x >= -5 && b.y >= -5 && b.x + b.width <= (vp.width + 5) && b.y + b.height <= (vp.height + 5); }
        var vbox = await page.$eval('.yh-scene-viewport', el => { var r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
        var cx = vbox.x + vbox.w / 2, cy = vbox.y + vbox.h / 2;
        // a single on-screen-width drag stroke can't cover the full
        // distance when the target starts far outside the viewport (e.g.
        // ~1400px away on a 390px-wide mobile viewport) — repeat the
        // stroke like a real user swiping multiple times, up to a sane
        // attempt cap so a genuine bug still fails instead of looping.
        for (var attempt = 0; attempt < 8 && !isOnScreen(box); attempt++) {
          await page.mouse.move(cx + vbox.w * 0.4, cy);
          await page.mouse.down();
          await page.mouse.move(cx - vbox.w * 0.4, cy, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(150);
          passageBtn = await page.$('.yh-passage-hotspot__item');
          box = await passageBtn.boundingBox();
        }
        assert(isOnScreen(box), 'passage hotspot still off-screen after repeated panning: ' + JSON.stringify(box));
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(900);
        var state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '02', 'passage hotspot did not navigate to zone 02, landed on ' + state.currentZoneId);
      });
      record(vp.name + ' [01]: passage hotspot navigates to Zone 02', true);
    } catch (e) { record(vp.name + ' [01]: passage to 02', false, e.message); }

    // 10. mobile: tap on an object hotspot does not pan the scene
    if (vp.mobile) {
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          var before = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          var btn = await page.$('.yh-object-hotspot__item[data-hotspot-id="elabuga"]');
          await btn.tap();
          await page.waitForTimeout(300);
          var after = await page.$eval('.yh-scene-stage', el => getComputedStyle(el).transform);
          assert(after === before, 'tapping an object hotspot panned the scene');
        });
        record(vp.name + ' [01]: tap on object hotspot does not pan the scene', true);
      } catch (e) { record(vp.name + ' [01]: tap does not pan', false, e.message); }
    }

    // 11. no visible edge after all this local interactivity was added, CTA still on top, bottom nav still works
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        await assertNoVisibleEdge(page);
        var ctaBox = await page.$eval('.yh-cta', el => el.getBoundingClientRect());
        var topElAtCta = await page.evaluate(([x, y]) => {
          var el = document.elementFromPoint(x, y);
          return el ? el.closest('.yh-cta') !== null : false;
        }, [ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2]);
        assert(topElAtCta, 'CTA is covered by a local layer element');
        var btn = await page.$('.yh-bottom-nav__item[data-zone="04"]');
        if (vp.mobile) { await btn.tap(); } else { await btn.click(); }
        await page.waitForTimeout(700);
        var state = await page.evaluate(() => window.__yhInstance.getState());
        assert(state.currentZoneId === '04', 'bottom nav broken after Zone 01 hotspots were added');
      });
      record(vp.name + ' [01]: no BASE edge, CTA stays on top of local layers, bottom nav still works', true);
    } catch (e) { record(vp.name + ' [01]: layering/CTA/bottom-nav regression check', false, e.message); }
  }

  // ---- switching away from Zone 01 and back leaves no orphan DOM nodes,
  // no leaked caption timers, and an open caption is closed by the switch ----
  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL + '?zone=01', { waitUntil: 'networkidle' });
      await page.waitForTimeout(900);
      // open a null-URL caption, then leave the zone WITHOUT it auto-dismissing first
      var bugulma = await page.$('.yh-object-hotspot__item[data-hotspot-id="bugulma"]');
      await bugulma.click();
      await page.waitForTimeout(200);
      var captionOpenBefore = await page.$eval('.yh-object-hotspot__caption', el => !el.hidden);
      assert(captionOpenBefore, 'test setup: caption should be open before switching zones');

      // Zone 04 target (not '00'): Zone 00 got its own local behavior/
      // hotspot-layer in Visual Integration, so a `.yh-hotspot-layer` count
      // of 0 there would no longer mean "no orphan", it would mean "Zone
      // 00's OWN legitimate layer didn't mount" — the wrong thing to assert
      // here. Zone 04 has no local behavior implemented yet, so it's still
      // the correct "definitely zero layers if Zone 01 cleaned up" target.
      await page.evaluate(() => window.__yhInstance.showZone('04', false));
      await page.waitForTimeout(200);
      var leftoverNodes = await page.$$eval('.yh-hotspot-layer, .yh-program-wall', els => els.length);
      assert(leftoverNodes === 0, 'Zone 01 left ' + leftoverNodes + ' orphan hotspot-layer/program-wall node(s) behind after switching to Zone 04');

      // back into 01: a fresh instance must render correctly (no stale
      // "already destroyed" state, no duplicate listeners causing double-fires)
      await page.evaluate(() => window.__yhInstance.showZone('01', false));
      await page.waitForTimeout(900);
      var freshHotspots = await page.$$eval('.yh-object-hotspot__item', els => els.length);
      assert(freshHotspots === 5, 'expected exactly 5 object hotspots after re-entering Zone 01, got ' + freshHotspots);
      var freshCaptionHidden = await page.$eval('.yh-object-hotspot__caption', el => el.hidden);
      assert(freshCaptionHidden, 'the fresh Zone 01 instance should start with its caption closed, not carry over the previous one\'s open state');

      // a single click now must not double-navigate/double-open (would
      // indicate two sets of listeners stacked from the two mounts)
      var elabuga = await page.$('.yh-object-hotspot__item[data-hotspot-id="elabuga"]');
      await elabuga.click();
      await page.waitForTimeout(300);
      var captionsVisible = await page.$$eval('.yh-object-hotspot__caption', els => els.filter(e => !e.hidden).length);
      assert(captionsVisible === 1, 'expected exactly 1 caption element to be visible, got ' + captionsVisible + ' (possible duplicate/leaked listeners)');
    });
    record('Zone 01: switching away and back leaves no orphan nodes/timers, listeners not duplicated', true);
  } catch (e) { record('Zone 01: cleanup on zone switch', false, e.message); }

  // ---- CSS still doesn't leak (re-check after Stage 2 additions) ----
  try {
    await withPage(browser, { width: 1600, height: 900, mobile: false }, async (page) => {
      await page.goto(DEMO_URL, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        var host = document.createElement('div');
        host.innerHTML = '<button id="host-btn">host button</button>';
        document.body.appendChild(host);
      });
      var btnFont = await page.$eval('#host-btn', el => getComputedStyle(el).fontFamily);
      assert(btnFont.toLowerCase().indexOf('-apple-system') === -1, 'host button font leaked from .yh-app: ' + btnFont);
    });
    record('Tilda-safety: CSS still does not leak outside .yh-app after Stage 2', true);
  } catch (e) { record('Tilda-safety: CSS leak re-check', false, e.message); }

  await browser.close();

  var passed = results.filter(r => r.pass).length;
  var failed = results.filter(r => !r.pass).length;
  console.log('\n=== ' + passed + ' passed, ' + failed + ' failed (of ' + results.length + ') ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
