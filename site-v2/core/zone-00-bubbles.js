// Zone 00 (УЛИЦА) — FAST PASS code-generated soap bubbles. Purely
// DOM + CSS + Web Animations API — no canvas, no image assets, no
// external library, no second rAF-driven "engine": drift/pop/expiry are
// each a single element.animate() call the browser composites on its
// own; the only continuous JS work is the desktop cursor-repulsion
// listener, which just nudges a CSS-transitioned transform (no per-frame
// polling either).
//
// Lives entirely inside .yh-scene-stage (like every other in-scene
// hotspot layer in this codebase) so bubbles pan/zoom WITH the BASE
// image rather than floating as a fixed UI overlay — see config/
// zone-00-content.js ZONE_00_BUBBLES for every randomized range used
// below, and app.css's ".yh-bubble*" rules for the actual look (thin
// transparent membrane, rotated conic-gradient rim masked to just the
// edge band, soft internal reflection, 2 specular dots).
//
// Interaction priority (spec п.12): the layer itself is
// pointer-events:none (see app.css); only .yh-bubble__body (the real
// visual circle) opts back into pointer-events:auto, and the whole
// layer's z-index sits BELOW --yh-z-local (every hotspot layer) so a
// hotspot always wins a visual/interactive overlap, never the reverse.

(function (YHApp) {
  'use strict';

  var PALETTE = [
    'rgba(125,211,252,0.55)', // cyan
    'rgba(96,165,250,0.5)',   // soft blue
    'rgba(244,158,209,0.5)',  // pink
    'rgba(196,167,231,0.5)',  // lilac
    'rgba(250,224,150,0.45)'  // very pale warm yellow
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickDepth(depthCfg) {
    var r = Math.random();
    var acc = 0;
    var keys = ['background', 'midground', 'foreground'];
    for (var i = 0; i < keys.length; i++) {
      acc += depthCfg[keys[i]].weight;
      if (r <= acc) return keys[i];
    }
    return 'midground';
  }
  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  // Fixed (not randomized) time offsets for the drift keyframes —
  // deliberately UNEVEN spacing (not 0/20/40/60/80/100) so the motion
  // reads as organic even before the per-instance transform values are
  // randomized on top. What varies per bubble is entirely the VALUES at
  // each of these points (see buildDriftFrames), which is what actually
  // produces "sometimes accelerates, almost hovers, veers, resumes" —
  // two consecutive points with nearly-equal values read as a hover/
  // pause, a big jump reads as a gust.
  var DRIFT_OFFSETS = [0, 0.16, 0.33, 0.52, 0.7, 0.86, 1];

  function buildDriftFrames(totalUpPx, windBiasPx) {
    var frames = [{ transform: 'translate(0px,0px) rotate(0deg) scale(1)', offset: 0 }];
    var n = DRIFT_OFFSETS.length - 1;
    var x = 0, y = 0;
    // occasionally flatten one interior segment (near-hover) and
    // occasionally exaggerate another (a small gust) — never the same
    // pair twice, never every bubble.
    var hoverAt = Math.random() < 0.6 ? randInt(2, n - 2) : -1;
    var gustAt = Math.random() < 0.5 ? randInt(2, n - 1) : -1;
    for (var i = 1; i <= n; i++) {
      var t = DRIFT_OFFSETS[i];
      var prevX = x, prevY = y;
      y = -totalUpPx * t + rand(-10, 10);
      x = windBiasPx * t + Math.sin(t * Math.PI * rand(1.3, 2.4) + rand(0, 6)) * rand(8, 24);
      if (i === hoverAt) { x = prevX + rand(-3, 3); y = prevY + rand(-3, 3); }
      if (i === gustAt) { x += rand(14, 30) * (Math.random() < 0.5 ? -1 : 1); y -= rand(10, 26); }
      var rot = Math.sin(t * Math.PI * 2 + rand(0, 6)) * rand(2, 6);
      var scale = 1 + Math.sin(t * Math.PI * rand(1, 2)) * rand(0.01, 0.03);
      frames.push({
        transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')',
        offset: DRIFT_OFFSETS[i]
      });
    }
    return frames;
  }

  function createZone00Bubbles(sceneStage, cfg, isMobile) {
    var reducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    var fineHoverMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
    var mobile = isMobile();
    var destroyed = false;

    var layer = el('div', 'yh-bubbles-layer');
    sceneStage.appendChild(layer);

    var active = [];
    var pendingTimers = [];
    var largeCount = 0;

    // Same fixed-px-shrinks-with-camera-scale issue already found and
    // fixed for other in-scene hotspots (see e.g. ZONE_01_HOTSPOT_SIZE) —
    // .yh-scene-stage carries the camera's own CSS scale transform, so a
    // plain px width/height (or px translate distance) on a child of it
    // renders far smaller on screen than the number itself says. Read the
    // stage's live scale straight off its computed transform matrix and
    // divide every "real on-screen px" value by it before use — this is
    // exactly the "адаптировать к scene scale" the spec itself asks for.
    function getStageScale() {
      var t = window.getComputedStyle(sceneStage).transform;
      if (!t || t === 'none') return 1;
      var m = t.match(/matrix\(([^,]+),/);
      var s = m && parseFloat(m[1]);
      return s && isFinite(s) && s > 0 ? s : 1;
    }

    function setTimer(fn, ms) {
      var id = window.setTimeout(function () {
        pendingTimers.splice(pendingTimers.indexOf(id), 1);
        if (!destroyed) fn();
      }, ms);
      pendingTimers.push(id);
      return id;
    }

    function sizeFor(bucket, depthName) {
      var range = cfg.sizePx[bucket];
      var mul = cfg.depth[depthName].sizeMul;
      return Math.round(rand(range.min, range.max) * mul);
    }

    function pickBucket() {
      if (largeCount >= cfg.maxLargeAtOnce) return Math.random() < 0.55 ? 'small' : 'medium';
      var r = Math.random();
      if (r < 0.4) return 'small';
      if (r < 0.85) return 'medium';
      return 'large';
    }

    function spawnAt(xPct, yPct) {
      if (destroyed) return;
      var reduced = reducedMotionMQ.matches;
      var depthName = pickDepth(cfg.depth);
      var depthCfg = cfg.depth[depthName];
      var bucket = pickBucket();
      var scale = getStageScale();
      var sizePx = Math.round(sizeFor(bucket, depthName) / scale);

      var bubble = el('div', 'yh-bubble yh-bubble--' + depthName);
      bubble.style.left = xPct + '%';
      bubble.style.top = yPct + '%';

      var drift = el('div', 'yh-bubble__drift');
      var body = el('div', 'yh-bubble__body');
      body.style.width = sizePx + 'px';
      body.style.height = sizePx + 'px';

      var iri = el('div', 'yh-bubble__iridescence');
      iri.style.setProperty('--rim-angle', rand(0, 360).toFixed(0) + 'deg');
      iri.style.setProperty('--iri-opacity', (rand(0.78, 1) * depthCfg.opacityMul).toFixed(2));
      // shuffle which two palette colours anchor the conic gradient by
      // rebuilding it inline per-instance (angle alone isn't enough
      // variety — this avoids every bubble reading as the same rainbow).
      var stops = [pick(PALETTE), pick(PALETTE), pick(PALETTE), pick(PALETTE)];
      iri.style.background = 'conic-gradient(from var(--rim-angle), ' + stops[0] + ', ' + stops[1] + ', ' + stops[2] + ', ' + stops[3] + ', ' + stops[0] + ')';

      var refl = el('div', 'yh-bubble__reflection');
      refl.style.setProperty('--refl-angle', rand(-35, 35).toFixed(0) + 'deg');
      refl.style.opacity = (rand(0.75, 0.98) * depthCfg.opacityMul).toFixed(2);
      refl.style.left = rand(6, 22) + '%';
      refl.style.top = rand(6, 18) + '%';

      var spec1 = el('span', 'yh-bubble__specular yh-bubble__specular--1');
      spec1.style.left = rand(18, 38) + '%';
      spec1.style.top = rand(14, 32) + '%';
      var spec2 = el('span', 'yh-bubble__specular yh-bubble__specular--2');
      spec2.style.left = rand(56, 74) + '%';
      spec2.style.top = rand(58, 76) + '%';
      spec2.style.opacity = rand(0.6, 0.85).toFixed(2);

      body.appendChild(iri);
      body.appendChild(refl);
      body.appendChild(spec1);
      body.appendChild(spec2);
      drift.appendChild(body);
      bubble.appendChild(drift);
      layer.appendChild(bubble);

      var b = {
        el: bubble, drift: drift, body: body,
        depth: depthName, bucket: bucket, sizePx: sizePx,
        popped: false, repelling: false,
        driftAnim: null, expireTimer: null
      };
      if (bucket === 'large') largeCount++;

      var lifetimeMs = rand(cfg.lifetimeMs.min, cfg.lifetimeMs.max);
      if (!reduced) {
        var totalUp = rand(160, 380) * depthCfg.driftMul * (sizePx / 70);
        var windBias = (rand(cfg.windBiasPx.min, cfg.windBiasPx.max) / scale) * depthCfg.driftMul;
        var frames = buildDriftFrames(totalUp, windBias);
        b.driftAnim = drift.animate(frames, {
          duration: lifetimeMs,
          easing: 'cubic-bezier(.37,.04,.4,1)',
          fill: 'forwards'
        });
        b.driftAnim.onfinish = function () { if (!b.popped) naturalExpire(b); };
      } else {
        // reduced motion: near-still — a single, very slow, tiny settle
        // so it doesn't look like a dead screenshot, but reads as calm.
        b.driftAnim = drift.animate(
          [{ transform: 'translate(0,0)' }, { transform: 'translate(' + rand(-4, 4).toFixed(1) + 'px,' + rand(-6, 0).toFixed(1) + 'px)' }],
          { duration: lifetimeMs, easing: 'ease-in-out', fill: 'forwards' }
        );
        b.driftAnim.onfinish = function () { if (!b.popped) naturalExpire(b); };
      }

      body.addEventListener('click', function (e) {
        e.stopPropagation();
        popBubble(b);
      });

      active.push(b);
      return b;
    }

    function removeFromActive(b) {
      var i = active.indexOf(b);
      if (i !== -1) active.splice(i, 1);
      if (b.bucket === 'large') largeCount--;
    }

    function scheduleRespawn(depthWeightHint) {
      var delay = rand(cfg.respawnDelayMs.min, cfg.respawnDelayMs.max);
      setTimer(function () {
        var edge = pick(['bottom', 'left', 'right']);
        var x, y;
        if (edge === 'bottom') { x = rand(4, 96); y = rand(94, 104); }
        else if (edge === 'left') { x = rand(-4, 6); y = rand(35, 96); }
        else { x = rand(94, 104); y = rand(35, 96); }
        spawnAt(x, y);
      }, delay);
    }

    function cleanupBubble(b) {
      b.el.remove();
      removeFromActive(b);
      scheduleRespawn(b.depth);
    }

    function naturalExpire(b) {
      if (destroyed) return;
      var currentOpacity = window.getComputedStyle(b.body).opacity;
      var fade = b.body.animate(
        [{ opacity: currentOpacity }, { opacity: 0 }],
        { duration: 900, easing: 'ease-in', fill: 'forwards' }
      );
      fade.onfinish = function () { cleanupBubble(b); };
    }

    function popBubble(b) {
      if (b.popped || destroyed) return;
      b.popped = true;
      b.el.classList.add('yh-bubble--popped');
      if (b.driftAnim) b.driftAnim.cancel();

      var expand = b.body.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(' + rand(1.04, 1.08).toFixed(3) + ')' }],
        { duration: randInt(50, 80), easing: 'ease-out', fill: 'forwards' }
      );
      expand.onfinish = function () {
        if (destroyed) return;
        var collapse = b.body.animate(
          [{ transform: 'scale(1.06)', opacity: 1 }, { transform: 'scale(0.7)', opacity: 0 }],
          { duration: randInt(90, 130), easing: 'ease-in', fill: 'forwards' }
        );
        spawnDroplets(b);
        collapse.onfinish = function () { cleanupBubble(b); };
      };
    }

    function spawnDroplets(b) {
      var n = randInt(5, 9);
      for (var i = 0; i < n; i++) {
        var d = el('span', 'yh-bubble__droplet');
        var ang = rand(0, Math.PI * 2);
        var dist = rand(6, Math.max(14, b.sizePx * 0.35));
        var size = rand(2, Math.max(4, b.sizePx * 0.07));
        d.style.width = size + 'px';
        d.style.height = size + 'px';
        d.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
        d.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
        b.el.appendChild(d);
        (function (node) {
          var anim = node.animate(
            [
              { transform: 'translate(-50%,-50%) translate(0,0)', opacity: 0.85 },
              { transform: 'translate(-50%,-50%) translate(var(--dx),var(--dy))', opacity: 0 }
            ],
            { duration: randInt(140, 210), easing: 'ease-out', fill: 'forwards' }
          );
          anim.onfinish = function () { node.remove(); };
        })(d);
      }
    }

    // ---- desktop-only cursor "air disturbance" (spec п.8) — no rAF: a
    // mousemove just updates a CSS-transitioned transform, the browser
    // interpolates the push and the smooth return on its own. ----
    function onPointerMove(e) {
      if (mobile || !fineHoverMQ.matches || reducedMotionMQ.matches) return;
      for (var i = 0; i < active.length; i++) {
        var b = active[i];
        if (b.popped) continue;
        var r = b.body.getBoundingClientRect();
        if (!r.width) continue;
        var bx = r.left + r.width / 2, by = r.top + r.height / 2;
        var dx = bx - e.clientX, dy = by - e.clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = Math.max(cfg.cursorInfluenceRadiusPx, r.width * 1.3);
        if (dist < radius) {
          var strength = 1 - dist / radius;
          var d = dist || 1;
          var pushX = (dx / d) * strength * cfg.cursorPushPx;
          var pushY = (dy / d) * strength * cfg.cursorPushPx;
          b.el.style.transform = 'translate(' + pushX.toFixed(1) + 'px,' + pushY.toFixed(1) + 'px)';
          b.repelling = true;
        } else if (b.repelling) {
          b.el.style.transform = 'translate(0,0)';
          b.repelling = false;
        }
      }
    }
    var viewportEl = sceneStage.parentElement; // .yh-scene-viewport — real hover surface
    if (viewportEl) viewportEl.addEventListener('pointermove', onPointerMove);

    // ---- initial population, scattered across the scene (not a
    // "respawn", so not edge-anchored) ----
    var count = mobile ? cfg.count.mobile : cfg.count.desktop;
    var initialN = reducedMotionMQ.matches ? cfg.reducedMotionCount : randInt(count.min, count.max);
    for (var i = 0; i < initialN; i++) {
      spawnAt(rand(4, 96), rand(45, 100));
    }

    // ---- one-time "you can pop these" demo (customer request: a
    // first-time visitor should understand bubbles are poppable without
    // any added text/UI) — teach it the same way the site itself would:
    // pop one bubble automatically, once, shortly after the scene settles.
    // Reuses the exact real pop mechanic (no separate demo animation), so
    // it reads as "oh, that's what happens" rather than a foreign hint
    // element. Skipped under reduced-motion (an unprompted pop is motion
    // the user asked to avoid; click/tap-to-pop still works either way). ----
    if (!reducedMotionMQ.matches) {
      setTimer(function () {
        var candidates = active.filter(function (b) { return !b.popped; });
        if (candidates.length) popBubble(pick(candidates));
      }, 1800);
    }

    function destroy() {
      destroyed = true;
      pendingTimers.forEach(function (id) { window.clearTimeout(id); });
      pendingTimers.length = 0;
      active.forEach(function (b) {
        if (b.driftAnim) b.driftAnim.cancel();
      });
      active.length = 0;
      if (viewportEl) viewportEl.removeEventListener('pointermove', onPointerMove);
      layer.remove();
    }

    return { destroy: destroy };
  }

  YHApp.createZone00Bubbles = createZone00Bubbles;
})(window.YHApp = window.YHApp || {});
