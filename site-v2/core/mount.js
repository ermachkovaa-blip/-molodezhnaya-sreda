// mount(root, config) — единственная публичная точка входа модуля.
//
// Контракт (см. Production-ТЗ п.18A и решения от 05.09):
//   var instance = YHApp.mount(rootEl, config);
//   instance.showZone('03');
//   instance.showMap();
//   instance.unmount();     // отписывает все listeners, ничего не оставляет
//
// root — ЛЮБОЙ элемент, переданный вызывающей стороной (в demo.html это
// #youth-hackathon-app; при embed в Tilda — контейнер, который подготовит
// интегратор). Модуль не создаёт собственных <html>/<head>/<body> и не
// обращается к document.body как к обязательной зависимости.

(function (YHApp) {
  'use strict';

  var STORAGE_KEY = 'yh_v2_last_zone';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function mount(root, config) {
    if (!root) throw new Error('YHApp.mount: root element is required');
    config = config || {};
    var scenesConfig = config.scenes || YHApp.SCENES_CONFIG;
    var links = config.links || YHApp.LINKS;
    var uiStrings = config.uiStrings || YHApp.UI_STRINGS;
    var objects = config.objects || YHApp.OBJECTS || [];
    var debugFlag = !!config.debug;

    var fullConfig = { scenes: scenesConfig, links: links, uiStrings: uiStrings, objects: objects };

    root.classList.add('yh-app');
    root.setAttribute('tabindex', '-1');

    // ---- reduced motion (checked once per mount; matchMedia keeps it live) ----
    var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    function reducedMotion() { return reduceMotionMQ.matches; }

    // ---- mobile detection driven by the ROOT CONTAINER's own width, not
    // window width — this is what actually matters inside a Tilda column
    // that may be narrower than the browser viewport. ----
    var containerWidth = root.clientWidth || window.innerWidth;
    function isMobile() { return containerWidth <= scenesConfig.mobileBreakpoint; }

    // ---- scene view DOM ----
    var sceneView = el('section', 'yh-scene-view', { 'aria-label': 'Сцена пространства' });
    sceneView.hidden = true;
    var sceneViewport = el('div', 'yh-scene-viewport');
    var sceneStage = el('div', 'yh-scene-stage');
    var sceneImg = el('img', 'yh-scene-image', { alt: '', draggable: 'false' });
    sceneStage.appendChild(sceneImg);
    sceneViewport.appendChild(sceneStage);
    sceneView.appendChild(sceneViewport);
    root.appendChild(sceneView);

    // ---- viewport-fixed overlay layer — for zone UI that must NOT pan/
    // zoom with the scene (a lightbox-style "open" image, e.g. Zone 04's
    // archive drawers). sceneStage carries a live CSS transform, so a
    // fixed-position child of IT would resolve against that transform, not
    // the real viewport (per spec, a transformed ancestor creates a new
    // containing block) — this sits outside sceneStage instead, as a
    // sibling of sceneView, so position:fixed inside it behaves normally.
    // Empty/inert until a zone behavior uses it (see callbacks.overlayRoot).
    var overlayRoot = el('div', 'yh-overlay-root');
    root.appendChild(overlayRoot);

    var sceneEngine = YHApp.createSceneEngine(sceneViewport, sceneStage, {
      reducedMotion: reducedMotion,
      onDebugUpdate: function (state) {
        if (!debugOverlay.isEnabled()) return;
        debugOverlay.update({
          zoneId: currentZoneId,
          isMobile: isMobile(),
          focus: state.currentFocus,
          scale: state.scale,
          viewportW: sceneViewport.clientWidth,
          viewportH: sceneViewport.clientHeight
        });
      }
    });

    // ---- map ----
    var mapNav = YHApp.createMapNavigation(root, fullConfig, {
      isMobile: isMobile,
      onZoneSelect: function (zoneId) { showZone(zoneId, true); }
    });

    // ---- global nav ----
    var globalNav = YHApp.createGlobalNav(root, fullConfig, {
      onZoneSelect: function (zoneId) { showZone(zoneId, true); },
      // КАРТА ↑ used to open a separate hand-drawn overview map screen —
      // removed from the reachable UI per customer instruction: Zone 00
      // now covers what that screen was for, so КАРТА ↑ goes straight to
      // it instead. showMap()/mapNav are left in place (not deleted) in
      // case this needs to be reverted, they're just no longer wired to
      // any control.
      onMapReturn: function () { showZone('00', true); }
    });
    globalNav.setMobile(isMobile());

    // ---- debug overlay ----
    var debugOverlay = YHApp.createDebugOverlay(root);
    debugOverlay.setEnabled(debugFlag);

    // ---- state ----
    var currentZoneId = null;
    var currentSceneSrc = null;
    var showingMap = true;
    var lastVisitedZoneId = null;
    try { lastVisitedZoneId = window.localStorage.getItem(STORAGE_KEY); } catch (err) { /* storage unavailable — non-critical */ }

    function resolveBranch(zone) {
      return isMobile() ? zone.mobile : zone.desktop;
    }

    // Customer request (Zone 07): the desktop bucket alone spans
    // 768px-and-up, too wide a range for one fixed cameraPreset — a focus
    // point tuned for a normal-width window pushed the far-left banner
    // off-screen on a narrower desktop window, but shifting that focus
    // enough to fix it visibly moved the whole composition on wide
    // windows too ("сильно сдвинула"). Rather than compromise on one
    // preset for both, a branch may opt into a SECOND preset via
    // `safeLeftPct`/`narrowCameraPreset` — most zones don't set these and
    // are completely unaffected. Purely a desktop-internal split; mobile
    // vs desktop selection above is unchanged.
    //
    // IMPORTANT: this used to switch on containerWidth alone (e.g.
    // "≤1300px"), which is wrong — whether the banner is actually clipped
    // depends on the real cover-scale (max(vw/iw, vh/ih)), and a scene
    // whose BASE has an unusual aspect ratio can end up scale-limited by
    // VIEWPORT HEIGHT even in a very wide window (a wide-but-not-tall
    // window vs. a wide-and-tall one differ here even at the identical
    // width) — exactly what happened on the customer's own Mac. So this
    // computes the actual visible-left edge (in image-percent) from real
    // viewport + image dimensions and compares that to the branch's own
    // `safeLeftPct` (the left-most content, e.g. a banner's left edge,
    // that must stay on screen), instead of guessing from width.
    function visibleLeftPct(focus, iw, ih, vw, vh) {
      var coverScale = Math.max(vw / iw, vh / ih);
      var totalScale = coverScale * (focus.scale || 1);
      var halfWidthPct = (vw / (2 * totalScale)) / iw * 100;
      return focus.x - halfWidthPct;
    }

    function resolveCameraPreset(branch) {
      if (branch.safeLeftPct == null || !branch.narrowCameraPreset) return branch.cameraPreset;
      var vw = sceneViewport.clientWidth;
      var vh = sceneViewport.clientHeight;
      var iw = branch.asset.w;
      var ih = branch.asset.h;
      if (!vw || !vh || !iw || !ih) return branch.cameraPreset;
      var clipped = visibleLeftPct(branch.cameraPreset, iw, ih, vw, vh) > branch.safeLeftPct;
      return clipped ? branch.narrowCameraPreset : branch.cameraPreset;
    }

    // ---- per-zone local interactivity (Zone 01 objects/program/passage,
    // and later 02/03/04/05/06/07) — one behavior module instantiated at a
    // time, torn down before the next one mounts so listeners never pile
    // up across zone switches. Keyed by zone.shared.behavior, registered
    // into YHApp.ZONE_BEHAVIORS by each zone's own file (see zone-01-hall.js). ----
    var activeZoneBehavior = null;
    function teardownZoneBehavior() {
      if (activeZoneBehavior) { activeZoneBehavior.destroy(); activeZoneBehavior = null; }
      panDisabled = false;
    }

    // ---- pan/parallax pause — first consumer is Zone 04's open drawer
    // (camera must hold still while a full-canvas foreground overlay is
    // shown, per FAST MODE spec), exposed generically so any future zone
    // behavior can request the same without a new one-off hook. ----
    var panDisabled = false;

    function showZone(zoneId, animated) {
      var zone = scenesConfig.zones[zoneId];
      if (!zone) return;

      teardownZoneBehavior();

      if (currentZoneId && currentZoneId !== zoneId) {
        lastVisitedZoneId = currentZoneId;
      }
      currentZoneId = zoneId;
      showingMap = false;

      mapNav.hide();
      sceneView.hidden = false;
      globalNav.setBottomNavVisible(true);
      globalNav.setActiveZone(zoneId);

      var branch = resolveBranch(zone);
      var asset = branch.asset;

      if (currentSceneSrc !== asset.src) {
        sceneImg.src = asset.src;
        currentSceneSrc = asset.src;
      }
      sceneEngine.setSceneSize(asset.w, asset.h);
      sceneEngine.setCameraTo(resolveCameraPreset(branch), animated);

      var behaviorFactory = YHApp.ZONE_BEHAVIORS && YHApp.ZONE_BEHAVIORS[zone.shared.behavior];
      if (behaviorFactory) {
        activeZoneBehavior = behaviorFactory(sceneStage, zone, fullConfig, {
          isMobile: isMobile,
          onNavigateZone: function (id) { showZone(id, true); },
          setPanDisabled: function (v) { panDisabled = !!v; if (panDisabled) sceneEngine.resetParallaxTarget(); },
          overlayRoot: overlayRoot
        });
      }

      try { window.localStorage.setItem(STORAGE_KEY, zoneId); } catch (err) { /* storage unavailable — non-critical */ }
    }

    function showMap() {
      teardownZoneBehavior();
      if (currentZoneId) lastVisitedZoneId = currentZoneId;
      showingMap = true;
      sceneView.hidden = true;
      globalNav.setBottomNavVisible(isMobile()); // на mobile нижний route виден и на карте (см. V1-паттерн)
      mapNav.show();
      mapNav.setLastVisited(lastVisitedZoneId);
    }

    // ---- gesture: pan the scene (Pointer Events, replaces V1's separate
    // mouse/touch listeners — see core/gesture-controller.js) ----
    var dragBaseTx = 0, dragBaseTy = 0;
    var isDragging = false;

    var gesture = YHApp.createGestureController(sceneViewport, {
      onDragStart: function () {
        if (panDisabled) return;
        isDragging = true;
        dragBaseTx = sceneEngine.state.tx;
        dragBaseTy = sceneEngine.state.ty;
        sceneViewport.classList.add('is-dragging');
      },
      onDragMove: function (dx, dy) {
        if (!isDragging) return; // panDisabled suppressed the matching onDragStart — ignore its moves too
        sceneEngine.panBy(dx, dy, dragBaseTx, dragBaseTy);
      },
      onDragEnd: function () {
        if (!isDragging) return;
        isDragging = false;
        sceneViewport.classList.remove('is-dragging');
      },
      onTap: function (x, y, e) {
        // Fires for EVERY tap inside sceneViewport, including ones that
        // land on a hotspot — it does not know or care what's under the
        // pointer. Close-open-captions-on-outside-tap therefore needs an
        // explicit guard here: only close when the tap did NOT hit a
        // hotspot. When it DID hit one, that hotspot's own click handler
        // (native, fires right after this synchronously-run onTap — see
        // gesture-controller.js) manages that item's own caption; this
        // handler must not undo it a moment later.
        var hitHotspot = e && e.target && typeof e.target.closest === 'function' && e.target.closest('[data-hotspot-id]');
        if (!hitHotspot && activeZoneBehavior && typeof activeZoneBehavior.closeAllCaptions === 'function') {
          activeZoneBehavior.closeAllCaptions();
        }
      }
    });

    // ---- desktop-only gentle parallax drift on hover (rAF-driven, see
    // SceneEngine.tick) — gated to fine-pointer devices and not while
    // actively dragging or zoomed. ----
    var hoverFineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
    sceneViewport.addEventListener('pointermove', function (e) {
      if (isDragging || panDisabled || !hoverFineMQ.matches || reducedMotion()) return;
      var rect = sceneViewport.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      var ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      sceneEngine.setParallaxTarget(nx, ny, 9);
    });
    sceneViewport.addEventListener('pointerleave', function () {
      sceneEngine.resetParallaxTarget();
    });

    // ---- native-scroll guard: panning here is 100% CSS-transform driven
    // (see gesture onDragMove above) — sceneViewport's scrollLeft/scrollTop
    // must always stay 0. Chromium/WebKit auto-scroll the nearest
    // overflow:hidden ancestor to "reveal" any element that receives focus
    // (e.g. a hotspot <button>/<a> after a click) using its untransformed
    // layout box, which is wrong here since sceneStage is scaled/translated
    // — a real, reproducible bug found via Zone 05's flying pages: clicking
    // a hotspot silently set scrollLeft/scrollTop to non-zero, visibly
    // yanking the whole scene sideways. Any non-zero scroll is illegitimate
    // by construction, so just snap it back every time.
    sceneViewport.addEventListener('scroll', function () {
      sceneViewport.scrollLeft = 0;
      sceneViewport.scrollTop = 0;
    });

    // ---- keyboard: M returns to Zone 00 (was the separate map screen —
    // see onMapReturn above for why). Scoped to the ROOT container (not
    // document) so the module never hijacks keystrokes on the rest of a
    // Tilda page — only fires while focus is within this module. ----
    function onKeydown(e) {
      if (e.key === 'm' || e.key === 'M') {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        showZone('00', true);
      }
    }
    root.addEventListener('keydown', onKeydown);

    // ---- ResizeObserver on root: keeps containerWidth (mobile/desktop
    // branch selection) in sync with the CONTAINER's real size, not the
    // window's. SceneEngine has its own observer on sceneViewport for the
    // camera-scale math; this one is specifically for the mobile/desktop
    // config-branch switch. ----
    var rootResizeObserver = null;
    if (typeof window.ResizeObserver === 'function') {
      rootResizeObserver = new window.ResizeObserver(function (entries) {
        var newWidth = entries[0].contentRect.width;
        var wasMobile = isMobile();
        containerWidth = newWidth;
        var isNowMobile = isMobile();
        if (wasMobile !== isNowMobile) {
          globalNav.setMobile(isNowMobile);
          mapNav.layout();
          if (!showingMap && currentZoneId) showZone(currentZoneId, false);
        } else if (!showingMap && currentZoneId) {
          // same mobile/desktop bucket — but the current zone's branch
          // may still opt into a second camera preset (see
          // resolveCameraPreset above), and whether that applies can
          // depend on viewport HEIGHT too (not just width — see that
          // function's comment), so this recomputes on every resize
          // rather than trying to detect a width-only threshold crossing.
          // Reference-compare against the currently applied focus so this
          // is a no-op (no camera jump) on zones/sizes where nothing
          // actually changed.
          var branch = resolveBranch(scenesConfig.zones[currentZoneId]);
          var resolved = resolveCameraPreset(branch);
          if (resolved !== sceneEngine.state.currentFocus) sceneEngine.setCameraTo(resolved, false);
        }
      });
      rootResizeObserver.observe(root);
    }

    sceneEngine.start();

    // ---- initial view: deep-link via ?zone= is a DEMO/standalone concern
    // (see embed/demo.html) — mount() itself only accepts config.initialZone
    // so it stays agnostic of how the host page structures its URL.
    // Default (no ?zone=) lands on Zone 00 — was the separate map screen,
    // see onMapReturn above for why that's no longer used. ----
    if (config.initialZone && scenesConfig.zones[config.initialZone]) {
      showZone(config.initialZone, false);
    } else {
      showZone('00', false);
    }

    function unmount() {
      teardownZoneBehavior();
      sceneEngine.destroy();
      gesture.destroy();
      mapNav.destroy();
      globalNav.destroy();
      debugOverlay.destroy();
      root.removeEventListener('keydown', onKeydown);
      if (rootResizeObserver) rootResizeObserver.disconnect();
      sceneView.remove();
      overlayRoot.remove();
      root.classList.remove('yh-app', 'yh-app--debug');
      root.removeAttribute('tabindex');
    }

    return {
      showZone: showZone,
      showMap: showMap,
      unmount: unmount,
      setDebug: function (v) { debugOverlay.setEnabled(v); },
      getState: function () {
        return { currentZoneId: currentZoneId, showingMap: showingMap, isMobile: isMobile(), lastVisitedZoneId: lastVisitedZoneId };
      }
    };
  }

  YHApp.mount = mount;
})(window.YHApp = window.YHApp || {});
