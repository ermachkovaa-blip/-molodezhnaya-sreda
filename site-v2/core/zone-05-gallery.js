// Zone 05 (ГАЛЕРЕЯ / БИБЛИОТЕКА) behavior — registered under
// shared.behavior:'gallery-complex'. Three independent physical
// interactives, per FAST MODE / STAGE 5 spec — not a dashboard/card-grid.
//
// 1. SHELF — a real HTML hotspot (createHotspotLayer, same generic
//    mechanism every other zone uses) over a static shelf PNG placed on
//    the BASE's floor medallion. Click/tap → STANDARD_URL or fallback.
//
// 2. FLYING PAGES — 10 approved pages (config/zone-05-content.js —
//    numbering independently verified against the actual scans this
//    session, see that file's header). Each page is a real <button>
//    (native click/tap semantics, so the SAME tap-vs-drag arbitration
//    gesture-controller.js already gives every other hotspot in this app
//    applies here for free — a scene drag never fires a page's click).
//
//    LIFECYCLE (customer revision — "в базовом состоянии нет листов, они
//    вылетают когда мы наводим курсор на книгу и постепенно падают вниз и
//    исчезают", replacing the earlier ambient-proximity-drift version):
//    dormant (fully invisible, no exceptions) -> hovering the book/shelf
//    hotspot releases a staggered group -> rising (page flies up from the
//    shelf to its own anchor point) -> falling (accelerating downward
//    drift + gentle sway/tumble while fading out) -> back to dormant,
//    ready for a later hover to release it again. Hovering an individual
//    already-released page (desktop) freezes+straightens+enlarges it via
//    a CSS class so it can be read, independent of its fall progress.
//    Click opens the reader lightbox.
//
// 3. READER — reuses the exact lightbox pattern Zone 04 established:
//    darken+blur the scene (CSS backdrop-filter, viewport-fixed
//    overlayRoot so it never inherits the scene's pan/zoom), image shown
//    large with object-fit:contain (original proportions, never
//    stretched), close via ×/Escape/backdrop, camera pause via
//    callbacks.setPanDisabled — same contract as Zone 04's lightbox.
//
// 4. FABRIC — a second real HTML hotspot, same mechanism as the shelf,
//    over the static banner PNG. Click/tap → RENOVATION_ARCHIVE_URL or
//    fallback. No HTML text duplicating the banner's own baked graphic —
//    the hotspot is purely a transparent click target. A CSS-only
//    "колыхание" (wind-sway) keyframe animation runs on the banner image
//    itself at all times (app.css yh-fabric-wave) — code-only, no new
//    asset, same spirit as the shelf glow / chair pull-out elsewhere.
//
// Camera pause priority (spec p.7): reader open, a page hover-selected,
// or the user actively dragging a page all pause/damp the global pan via
// the same callbacks.setPanDisabled hook Zone 04 introduced in mount.js —
// no new hook needed.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone05Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var links = config.links || YHApp.LINKS;
    var shelf = YHApp.ZONE_05_SHELF;
    var fabric = YHApp.ZONE_05_FABRIC;
    var pages = YHApp.ZONE_05_PAGES;
    var presentation = YHApp.ZONE_05_PRESENTATION;

    // ==== static placed objects (shelf + fabric images, always visible) ====
    var shelfImg = el('img', 'yh-gallery-shelf-image', { src: shelf.asset.src, alt: '', draggable: 'false' });
    var shelfBox = mobile ? shelf.mobile : shelf.desktop;
    shelfImg.style.left = shelfBox.left + '%';
    shelfImg.style.top = shelfBox.top + '%';
    shelfImg.style.width = shelfBox.width + '%';
    shelfImg.style.height = shelfBox.height + '%';
    sceneStage.appendChild(shelfImg);

    var fabricImg = el('img', 'yh-gallery-fabric-image', { src: fabric.asset.src, alt: '', draggable: 'false' });
    var fabricBox = mobile ? fabric.mobile : fabric.desktop;
    fabricImg.style.left = fabricBox.left + '%';
    fabricImg.style.top = fabricBox.top + '%';
    fabricImg.style.width = fabricBox.width + '%';
    fabricImg.style.height = fabricBox.height + '%';
    sceneStage.appendChild(fabricImg);

    // ==== shelf + fabric hotspots (generic hotspot-layer, same mechanism
    // as every other zone) ====
    var hotspotItems = [
      {
        id: 'shelf',
        ariaLabel: 'Стандарт деятельности молодёжных центров',
        hoverLabel: presentation.shelfHoverLabel,
        url: links.STANDARD_URL,
        emptyMessage: presentation.shelfEmptyMessage
      },
      {
        id: 'fabric',
        ariaLabel: 'Архив реализованных объектов реновации',
        hoverLabel: presentation.fabricHoverLabel,
        url: links.RENOVATION_ARCHIVE_URL,
        emptyMessage: presentation.fabricEmptyMessage
      }
    ];

    var hotspotLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-gallery-hotspot',
      items: hotspotItems,
      isMobile: isMobile,
      getCoords: function (item, mob) {
        if (item.id === 'shelf') return mob ? shelf.hotspotMobileCoords : shelf.hotspotDesktopCoords;
        return mob ? fabric.hotspotMobileCoords : fabric.hotspotDesktopCoords;
      }
    });
    hotspotLayer.layout();

    // size each hotspot to its real object footprint (default is a small
    // 44x44 dot — same override pattern Zone 00's CTA already established)
    var shelfHotspotSize = mobile ? shelf.hotspotMobileSize : shelf.hotspotDesktopSize;
    if (hotspotLayer.elements.shelf) {
      hotspotLayer.elements.shelf.style.width = shelfHotspotSize.w + '%';
      hotspotLayer.elements.shelf.style.height = shelfHotspotSize.h + '%';
    }
    var fabricHotspotSize = mobile ? fabric.hotspotMobileSize : fabric.hotspotDesktopSize;
    if (hotspotLayer.elements.fabric) {
      hotspotLayer.elements.fabric.style.width = fabricHotspotSize.w + '%';
      hotspotLayer.elements.fabric.style.height = fabricHotspotSize.h + '%';
    }

    // ==== reader lightbox (same contract as Zone 04's lightbox) ====
    var reader = el('div', 'yh-gallery-reader');
    reader.hidden = true;
    var readerBackdrop = el('div', 'yh-gallery-reader__backdrop', { 'aria-hidden': 'true' });
    var readerContent = el('div', 'yh-gallery-reader__content', { role: 'dialog', 'aria-modal': 'true' });
    var readerClose = el('button', 'yh-gallery-reader__close', { type: 'button', 'aria-label': presentation.readerCloseLabel });
    readerClose.textContent = '×';
    var readerImg = el('img', 'yh-gallery-reader__image', { alt: '', draggable: 'false' });
    readerContent.appendChild(readerClose);
    readerContent.appendChild(readerImg);
    reader.appendChild(readerBackdrop);
    reader.appendChild(readerContent);
    callbacks.overlayRoot.appendChild(reader);

    var openPageId = null;

    function closeReader() {
      if (!openPageId) return;
      openPageId = null;
      reader.classList.remove('is-open');
      window.setTimeout(function () {
        if (!openPageId) reader.hidden = true;
      }, 220);
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
    }

    function openReader(page) {
      openPageId = page.id;
      readerImg.src = page.src;
      readerImg.alt = page.alt;
      reader.hidden = false;
      window.requestAnimationFrame(function () {
        reader.classList.add('is-open');
      });
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
      readerClose.focus();
    }

    readerClose.addEventListener('click', closeReader);
    readerBackdrop.addEventListener('click', closeReader);

    function onReaderKeydown(e) {
      if (e.key === 'Escape' && openPageId) closeReader();
    }
    reader.addEventListener('keydown', onReaderKeydown);

    // ==== flying pages — hover-released, fall-and-fade lifecycle ====
    // Customer revision (supersedes the earlier "ambient proximity
    // drift" version — see the message that replaced it): rest state has
    // ZERO pages visible at all (no "peek" pages either). Hovering the
    // book/shelf ("при наведении курсора на книгу") releases a staggered
    // group; each page rises up briefly, then gradually falls downward
    // while fading out ("постепенно падают вниз и исчезают"), then
    // returns to dormant so it can be released again on a later hover.
    // Hover (or a mobile tap-to-select) on an individual page still
    // freezes/straightens/enlarges it immediately and keeps it that way
    // ~1.2s after the cursor leaves, so it never "runs away" mid-reach.
    var shelfHotspotCoords = mobile ? shelf.hotspotMobileCoords : shelf.hotspotDesktopCoords;

    var RISE_MS = 600;
    var FALL_MS = 2600;
    var FALL_DISTANCE = 26; // percent of scene the page falls before fully gone
    var STAGGER_MIN_MS = 250, STAGGER_MAX_MS = 450;
    var GROUP_MIN = 4, GROUP_MAX = 6;
    var COOLDOWN_MS = 2000;
    var HOVER_RELEASE_INTERVAL_MS = 1500; // keep releasing new groups while the book stays hovered
    var HOVER_RESUME_GRACE_MS = 1300; // "1-1.5s" before resuming after cursor leaves

    function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }
    function easeInCubic(p) { return p * p * p; }
    function depthFactor(depth) { return 1 - depth * 0.32; } // 1, 0.68, 0.36
    function baseOpacityForDepth(depth) { return depth === 0 ? 0.7 : (depth === 1 ? 0.85 : 1); }

    var pageNodes = pages.map(function (p) {
      var btn = el('button', 'yh-gallery-page yh-gallery-page--depth' + p.depth, {
        type: 'button',
        'aria-label': p.alt
      });
      var img = el('img', 'yh-gallery-page__img', { src: p.src, alt: '', draggable: 'false' });
      btn.appendChild(img);
      // mobile scene is a different (portrait) image/composition than
      // desktop, so a shared x/y would put several pages off-screen or
      // under the fixed header/CTA (real bug found via elementFromPoint
      // scan: 6 of 10 pages were unreachable at the mobile camera preset
      // using the desktop-tuned x/y) — mobileX/mobileY are optional
      // per-page overrides, falling back to the shared x/y when absent.
      var px = mobile && p.mobileX != null ? p.mobileX : p.x;
      var py = mobile && p.mobileY != null ? p.mobileY : p.y;
      btn.style.left = px + '%';
      btn.style.top = py + '%';
      btn.dataset.pageId = p.id;
      sceneStage.appendChild(btn);
      return {
        data: p,
        node: btn,
        jitterPhase: Math.random() * Math.PI * 2,
        popPeak: 3 + Math.random() * 3, // percent, the "rise up a little first" hump
        // lifecycle: 'dormant' | 'rising' | 'falling'
        lifePhase: 'dormant',
        phaseElapsed: 0,
        frozen: false, // hover (desktop) or tap-selected (mobile)
        resumeAt: null,
        // percent-space offset from this page's own anchor (x/y) back to
        // the shelf's hotspot origin — its own individual "flight path"
        // (spec: pages should differ in trajectory, not just size/tilt).
        originOffsetX: shelfHotspotCoords.x - px,
        originOffsetY: shelfHotspotCoords.y - py
      };
    });

    var hoveredPageId = null; // desktop hover
    var mobileSelectedId = null; // mobile tap-to-select

    function unfreezePage(pn) {
      pn.frozen = false;
      pn.resumeAt = null;
      pn.lifePhase = 'falling';
      pn.phaseElapsed = 0;
    }

    function freezePage(pn) {
      pn.frozen = true;
      pn.resumeAt = null;
      pn.node.classList.add('is-hovered');
    }

    pageNodes.forEach(function (pn) {
      if (!mobile) {
        pn.node.addEventListener('mouseenter', function () {
          hoveredPageId = pn.data.id;
          freezePage(pn);
          if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
        });
        pn.node.addEventListener('mouseleave', function () {
          if (hoveredPageId === pn.data.id) hoveredPageId = null;
          pn.node.classList.remove('is-hovered');
          pn.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
          if (!openPageId && callbacks.setPanDisabled) callbacks.setPanDisabled(false);
        });
        pn.node.addEventListener('focus', function () {
          hoveredPageId = pn.data.id;
          freezePage(pn);
        });
        pn.node.addEventListener('blur', function () {
          if (hoveredPageId === pn.data.id) hoveredPageId = null;
          pn.node.classList.remove('is-hovered');
          pn.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
        });
        pn.node.addEventListener('click', function () { openReader(pn.data); });
      } else {
        // mobile: no hover — first tap selects (freeze+approach), a
        // second tap on the ALREADY-selected page opens it; tapping a
        // different page switches the selection.
        pn.node.addEventListener('click', function () {
          if (mobileSelectedId === pn.data.id) {
            openReader(pn.data);
            return;
          }
          if (mobileSelectedId) {
            var prev = pageNodesById[mobileSelectedId];
            if (prev) {
              prev.node.classList.remove('is-hovered');
              prev.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
            }
          }
          mobileSelectedId = pn.data.id;
          freezePage(pn);
          if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
        });
      }
    });

    var pageNodesById = {};
    pageNodes.forEach(function (pn) { pageNodesById[pn.data.id] = pn; });

    // ---- release scheduling (staggered group, cooldown-gated) ----
    var lastReleaseAt = -Infinity;
    var pendingReleaseTimers = [];

    function tryReleaseGroup(now) {
      if (now - lastReleaseAt < COOLDOWN_MS) return;
      var dormant = pageNodes.filter(function (pn) { return pn.lifePhase === 'dormant' && !pn.releasePending; });
      if (!dormant.length) return;
      lastReleaseAt = now;
      // shuffle
      for (var i = dormant.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = dormant[i]; dormant[i] = dormant[j]; dormant[j] = tmp;
      }
      var groupSize = Math.min(dormant.length, GROUP_MIN + Math.floor(Math.random() * (GROUP_MAX - GROUP_MIN + 1)));
      var delay = 0;
      for (var k = 0; k < groupSize; k++) {
        (function (pn, d) {
          pn.releasePending = true;
          var timer = window.setTimeout(function () {
            pn.releasePending = false;
            if (pn.lifePhase === 'dormant') {
              pn.lifePhase = 'rising';
              pn.phaseElapsed = 0;
            }
          }, d);
          pendingReleaseTimers.push(timer);
        })(dormant[k], delay);
        delay += STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS);
      }
      // delicate shelf affordance — brief glow pulse on every successful
      // release trigger (mobile has no hover-proximity glow otherwise)
      pulseShelfGlow();
    }

    // ---- shelf glow / proximity affordance ("небольшим свечением") ----
    var shelfGlow = el('div', 'yh-gallery-shelf-glow');
    shelfGlow.style.left = shelfBox.left + '%';
    shelfGlow.style.top = shelfBox.top + '%';
    shelfGlow.style.width = shelfBox.width + '%';
    shelfGlow.style.height = shelfBox.height + '%';
    sceneStage.appendChild(shelfGlow);
    var shelfGlowPulseTimer = null;
    var shelfHovered = false; // desktop only — mirrors the mouseenter/mouseleave state below
    function pulseShelfGlow() {
      // mobile-only flash (desktop already drives the glow directly via
      // hover/focus below, and must not have this timer fight that).
      if (!mobile) return;
      shelfGlow.classList.add('is-active');
      if (shelfGlowPulseTimer) window.clearTimeout(shelfGlowPulseTimer);
      shelfGlowPulseTimer = window.setTimeout(function () {
        if (!shelfHovered) shelfGlow.classList.remove('is-active');
      }, 900);
    }

    // mobile: tap the book/shelf releases a group directly (no hover there)
    hotspotLayer.elements.shelf.addEventListener('click', function () {
      tryReleaseGroup(performance.now());
    });

    // ---- desktop: hover the book/shelf itself releases pages, and keeps
    // releasing fresh groups (cooldown-gated) for as long as the cursor
    // stays over it — "при наведении курсора на книгу она подсвечивает...
    // и вылетают [страницы]". Base state (cursor elsewhere): zero pages,
    // no glow. ----
    var hoverReleaseTimer = null;
    if (!mobile) {
      hotspotLayer.elements.shelf.addEventListener('mouseenter', function () {
        shelfHovered = true;
        shelfGlow.classList.add('is-active');
        tryReleaseGroup(performance.now());
        if (hoverReleaseTimer) window.clearInterval(hoverReleaseTimer);
        hoverReleaseTimer = window.setInterval(function () {
          tryReleaseGroup(performance.now());
        }, HOVER_RELEASE_INTERVAL_MS);
      });
      hotspotLayer.elements.shelf.addEventListener('mouseleave', function () {
        shelfHovered = false;
        shelfGlow.classList.remove('is-active');
        if (hoverReleaseTimer) { window.clearInterval(hoverReleaseTimer); hoverReleaseTimer = null; }
      });
      hotspotLayer.elements.shelf.addEventListener('focus', function () {
        shelfHovered = true;
        shelfGlow.classList.add('is-active');
        tryReleaseGroup(performance.now());
      });
      hotspotLayer.elements.shelf.addEventListener('blur', function () {
        shelfHovered = false;
        shelfGlow.classList.remove('is-active');
      });
    }

    // ---- main rAF loop ----
    var rafId = null;
    var lastTickTime = null;

    function tick(now) {
      if (lastTickTime === null) lastTickTime = now;
      var dt = now - lastTickTime;
      lastTickTime = now;

      pageNodes.forEach(function (pn) {
        if (pn.data.id === openPageId) return; // reader owns this page's transform while open

        if (pn.frozen) {
          // hover/tap-selected: snap to its resting anchor, straightened,
          // enlarged, sharp — "останавливается... выпрямляется...
          // приближается... становится резче" — and stay there.
          pn.node.style.transform = 'translate(0%, 0%) rotate(0deg) scale(1.18)';
          pn.node.style.opacity = 1;
          pn.node.style.zIndex = 50;
          return;
        }
        if (pn.resumeAt !== null) {
          if (now < pn.resumeAt) {
            // grace period after the cursor left — stay exactly in place
            pn.node.style.transform = 'translate(0%, 0%) rotate(0deg) scale(1.18)';
            pn.node.style.opacity = 1;
            pn.node.style.zIndex = 50;
            return;
          }
          unfreezePage(pn);
        }

        if (pn.lifePhase === 'dormant') {
          // rest state: completely gone, not even a faint "peek" — per
          // explicit instruction ("в базовом состоянии - нет листов").
          pn.node.style.opacity = 0;
          pn.node.style.pointerEvents = 'none';
          return;
        }

        pn.node.style.pointerEvents = 'auto';
        pn.phaseElapsed += dt;

        if (pn.lifePhase === 'rising') {
          var rp = Math.min(pn.phaseElapsed / RISE_MS, 1);
          var re = easeOutCubic(rp);
          var tx = pn.originOffsetX * (1 - re);
          var ty = pn.originOffsetY * (1 - re) - Math.sin(rp * Math.PI) * pn.popPeak;
          var rScale = 0.6 + 0.4 * re;
          pn.node.style.transform = 'translate(' + tx + '%, ' + ty + '%) rotate(' + pn.data.rotation + 'deg) scale(' + rScale + ')';
          pn.node.style.opacity = baseOpacityForDepth(pn.data.depth) * re;
          pn.node.style.zIndex = 15 - pn.data.depth;
          if (rp >= 1) { pn.lifePhase = 'falling'; pn.phaseElapsed = 0; }
          return;
        }

        // falling — "постепенно падают вниз и исчезают": accelerating
        // downward drift (easeInCubic — slow at first so the page is still
        // readable right after rising, then picks up speed) plus a gentle
        // side-to-side sway and a slow tumble, opacity ramping to 0; then
        // back to dormant so a later hover can release it again.
        var fp = Math.min(pn.phaseElapsed / FALL_MS, 1);
        var fe = easeInCubic(fp);
        var f = depthFactor(pn.data.depth);
        var fallY = fe * FALL_DISTANCE * f;
        var swayX = Math.sin(now * 0.0016 + pn.jitterPhase) * 1.4 * f;
        var fallRotation = pn.data.rotation + fe * 14 * (pn.jitterPhase > Math.PI ? 1 : -1);
        pn.node.style.transform = 'translate(' + swayX + '%, ' + fallY + '%) rotate(' + fallRotation + 'deg) scale(1)';
        pn.node.style.opacity = baseOpacityForDepth(pn.data.depth) * (1 - fe);
        pn.node.style.zIndex = 15 - pn.data.depth;
        if (fp >= 1) { pn.lifePhase = 'dormant'; pn.phaseElapsed = 0; }
      });
      rafId = window.requestAnimationFrame(tick);
    }
    rafId = window.requestAnimationFrame(tick);

    var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    function onReducedMotionChange() {
      if (reduceMotionMQ.matches) {
        // no game mechanic under reduced motion — every page fully
        // visible at its anchor, statically, so nothing is ever
        // unreachable just because the user can't rely on motion/hover.
        if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
        pendingReleaseTimers.forEach(function (t) { window.clearTimeout(t); });
        pendingReleaseTimers = [];
        pageNodes.forEach(function (pn) {
          pn.node.style.transform = 'rotate(' + pn.data.rotation + 'deg)';
          pn.node.style.opacity = baseOpacityForDepth(pn.data.depth);
          pn.node.style.pointerEvents = 'auto';
          pn.node.style.zIndex = 15 - pn.data.depth;
        });
      } else if (rafId === null) {
        lastTickTime = null;
        rafId = window.requestAnimationFrame(tick);
      }
    }
    onReducedMotionChange();
    if (reduceMotionMQ.addEventListener) reduceMotionMQ.addEventListener('change', onReducedMotionChange);

    function destroy() {
      closeReader();
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      pendingReleaseTimers.forEach(function (t) { window.clearTimeout(t); });
      if (shelfGlowPulseTimer) window.clearTimeout(shelfGlowPulseTimer);
      if (hoverReleaseTimer) window.clearInterval(hoverReleaseTimer);
      if (reduceMotionMQ.removeEventListener) reduceMotionMQ.removeEventListener('change', onReducedMotionChange);
      // shelf/fabric hover+click listeners live on nodes hotspotLayer.destroy()
      // removes outright, so no separate removeEventListener needed for them.
      hotspotLayer.destroy();
      reader.remove();
      shelfImg.remove();
      fabricImg.remove();
      shelfGlow.remove();
      pageNodes.forEach(function (pn) { pn.node.remove(); });
    }

    function closeAllCaptions() {
      hotspotLayer.hideCaption();
      closeReader();
    }

    return {
      destroy: destroy,
      layout: hotspotLayer.layout,
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['gallery-complex'] = createZone05Behavior;
})(window.YHApp = window.YHApp || {});
