// Visual Integration (Zone 02/03 — new independent production BASE)
// smoke suite. Checks specific to the asset swap itself; the shared
// HotspotScene mechanism (ids, url|null, caption, lifecycle, gestures) is
// already covered by run-smoke-local-stage3.js, re-run unmodified against
// the new assets/coords as part of this same integration's regression.
//
// Usage: node run-smoke-local-visual-integration.js [baseUrl]

const { chromium } = require('playwright');

const BASE = process.argv[2] || process.env.YH_BASE_URL || 'http://localhost:8970';
const DEMO_URL = BASE + '/site-v2/embed/demo.html';

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

// pan the scene viewport horizontally by a fraction of its width, several
// times if needed, until targetSelector is on-screen; then returns its box
async function panUntilOnScreen(page, vp, targetSelector, maxAttempts) {
  var vbox = await page.locator('.yh-scene-viewport').boundingBox();
  var cx = vbox.x + vbox.width / 2, cy = vbox.y + vbox.height / 2;
  var box = await page.locator(targetSelector).boundingBox();
  var attempts = 0;
  while (!isOnScreen(box, vp) && attempts < maxAttempts) {
    // drag from one side toward the other repeatedly; try both directions
    var dir = attempts % 2 === 0 ? -1 : 1;
    await page.mouse.move(cx - dir * vbox.width * 0.35, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dir * vbox.width * 0.35, cy, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(150);
    box = await page.locator(targetSelector).boundingBox();
    attempts++;
  }
  return box;
}

var ZONE_ASSET_EXPECT = {
  '02': { desktop: 'zone-02-desktop-base-research-wall-v2-4k.png', mobile: 'zone-02-mobile-base-research-wall-v2-2160x3840.png', w: 3840, h: 2160, mw: 2160, mh: 3840 },
  '03': { desktop: 'zone-03-project-workshop-realistic-expanded-4k.png', mobile: 'zone-03-mobile-base-clean-realistic-4k.png', w: 3840, h: 2160, mw: 2160, mh: 3840 }
};

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const vp of VIEWPORTS) {
    for (const zoneId of ['02', '03']) {
      var expect = ZONE_ASSET_EXPECT[zoneId];
      var expectedSrc = vp.mobile ? expect.mobile : expect.desktop;
      var expectedW = vp.mobile ? expect.mw : expect.w;
      var expectedH = vp.mobile ? expect.mh : expect.h;

      // 1/2/3: correct new asset loaded per platform, old shared scene-02-03 never loaded
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          var img = await page.$eval('.yh-scene-image', (el) => ({ src: el.getAttribute('src'), naturalWidth: el.naturalWidth, naturalHeight: el.naturalHeight }));
          assert(img.src.indexOf(expectedSrc) !== -1, 'wrong asset loaded for zone ' + zoneId + ' (' + (vp.mobile ? 'mobile' : 'desktop') + '): ' + img.src);
          assert(img.src.indexOf('scene-02-03') === -1, 'old shared scene-02-03 asset still referenced: ' + img.src);
          // 15: not distorted/stretched — natural pixel aspect ratio matches configured w/h
          var expectedRatio = expectedW / expectedH;
          var actualRatio = img.naturalWidth / img.naturalHeight;
          assert(Math.abs(expectedRatio - actualRatio) < 0.01, 'aspect ratio mismatch (possible distortion): expected ' + expectedRatio.toFixed(3) + ', got ' + actualRatio.toFixed(3));
        });
        record(vp.name + ' [' + zoneId + ']: correct independent asset loaded (' + expectedSrc + '), no distortion, old shared BASE absent', true);
      } catch (e) { record(vp.name + ' [' + zoneId + ']: asset/dimensions check', false, e.message); }

      // 5/6: desktopCoords/mobileCoords within [0,100] BASE bounds
      try {
        await withPage(browser, vp, async (page) => {
          await page.goto(DEMO_URL + '?zone=' + zoneId, { waitUntil: 'networkidle' });
          await page.waitForTimeout(900);
          var arr = await page.evaluate((zid) => (zid === '02' ? window.YHApp.ZONE_02_HOTSPOTS : window.YHApp.ZONE_03_HOTSPOTS), zoneId);
          arr.forEach((h) => {
            assert(h.desktopCoords.x >= 0 && h.desktopCoords.x <= 100 && h.desktopCoords.y >= 0 && h.desktopCoords.y <= 100, h.id + ': desktopCoords out of BASE bounds');
            assert(h.mobileCoords.x >= 0 && h.mobileCoords.x <= 100 && h.mobileCoords.y >= 0 && h.mobileCoords.y <= 100, h.id + ': mobileCoords out of BASE bounds');
          });
        });
        record(vp.name + ' [' + zoneId + ']: all 6 hotspot desktopCoords/mobileCoords within BASE bounds', true);
      } catch (e) { record(vp.name + ' [' + zoneId + ']: coords-in-bounds', false, e.message); }
    }

    // 7/8: an off-screen hotspot (by default camera) is reachable via pan, and tap-after-pan activates it correctly
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var sel = '.yh-material-hotspot__item[data-hotspot-id="plans-work"]';
        var box = await panUntilOnScreen(page, vp, sel, 6);
        assert(isOnScreen(box, vp), '"plans-work" never became reachable via pan at ' + vp.name);
        if (vp.mobile) await page.locator(sel).tap(); else await page.locator(sel).click();
        await page.waitForTimeout(250);
        var caption = await page.$eval('.yh-material-hotspot__caption', (el) => ({ hidden: el.hidden, text: el.textContent }));
        assert(caption.hidden === false, 'caption did not open after pan+tap');
        assert(caption.text === 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ', 'wrong caption after pan+tap: ' + JSON.stringify(caption.text));
      });
      record(vp.name + ': off-screen hotspot ("plans-work") reachable via pan, tap-after-pan activates it', true);
    } catch (e) { record(vp.name + ': pan-then-tap reachability', false, e.message); }

    // no camera edge ever visible while panned to either extreme of the hotspot spread (Zone 02)
    try {
      await withPage(browser, vp, async (page) => {
        await page.goto(DEMO_URL + '?zone=02', { waitUntil: 'networkidle' });
        await page.waitForTimeout(900);
        var vbox = await page.locator('.yh-scene-viewport').boundingBox();
        var cx = vbox.x + vbox.width / 2, cy = vbox.y + vbox.height / 2;
        // pan hard left, then hard right, checking edges at each extreme
        for (const dir of [1, -1, 1, -1]) {
          await page.mouse.move(cx - dir * vbox.width * 0.4, cy);
          await page.mouse.down();
          await page.mouse.move(cx + dir * vbox.width * 0.4, cy, { steps: 10 });
          await page.mouse.up();
          await page.waitForTimeout(120);
        }
        await assertNoVisibleEdge(page);
      });
      record(vp.name + ': no BASE edge visible after repeated hard panning (Zone 02)', true);
    } catch (e) { record(vp.name + ': pan edge-safety', false, e.message); }
  }

  await browser.close();

  var passed = results.filter(r => r.pass).length;
  var failed = results.filter(r => !r.pass).length;
  console.log('\n=== ' + passed + ' passed, ' + failed + ' failed (of ' + results.length + ') ===');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
