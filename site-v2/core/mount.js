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
    var debugFlag = !!config.debug;

    var fullConfig = { scenes: scenesConfig, links: links, uiStrings: uiStrings };

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
      onMapReturn: function () { showMap(); }
    });

    // ---- debug overlay ----
    var debugOverlay = YHApp.createDebugOverlay(root);
    debugOverlay.setEnabled(debugFlag);

    // ---- state ----
    var currentZoneId = null;
    var currentSceneSrc = null;
    var showingMap = true;

    function resolveBranch(zone) {
      return isMobile() ? zone.mobile : zone.desktop;
    }

    function showZone(zoneId, animated) {
      var zone = scenesConfig.zones[zoneId];
      if (!zone) return;
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
      sceneEngine.setCameraTo(branch.cameraPreset, animated);

      try { window.localStorage.setItem(STORAGE_KEY, zoneId); } catch (err) { /* storage unavailable — non-critical */ }
    }

    function showMap() {
      showingMap = true;
      sceneView.hidden = true;
      globalNav.setBottomNavVisible(isMobile()); // на mobile нижний route виден и на карте (см. V1-паттерн)
      mapNav.show();
    }

    // ---- gesture: pan the scene (Pointer Events, replaces V1's separate
    // mouse/touch listeners — see core/gesture-controller.js) ----
    var dragBaseTx = 0, dragBaseTy = 0;
    var isDragging = false;

    var gesture = YHApp.createGestureController(sceneViewport, {
      onDragStart: function () {
        isDragging = true;
        dragBaseTx = sceneEngine.state.tx;
        dragBaseTy = sceneEngine.state.ty;
        sceneViewport.classList.add('is-dragging');
      },
      onDragMove: function (dx, dy) {
        sceneEngine.panBy(dx, dy, dragBaseTx, dragBaseTy);
      },
      onDragEnd: function () {
        isDragging = false;
        sceneViewport.classList.remove('is-dragging');
      },
      onTap: function () {
        // Reserved for Этап 3+ (hotspot taps go through their own buttons,
        // which receive the pointer event directly — this onTap fires only
        // for taps on empty scene background).
      }
    });

    // ---- desktop-only gentle parallax drift on hover (rAF-driven, see
    // SceneEngine.tick) — gated to fine-pointer devices and not while
    // actively dragging or zoomed. ----
    var hoverFineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
    sceneViewport.addEventListener('pointermove', function (e) {
      if (isDragging || !hoverFineMQ.matches || reducedMotion()) return;
      var rect = sceneViewport.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      var ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      sceneEngine.setParallaxTarget(nx, ny, 9);
    });
    sceneViewport.addEventListener('pointerleave', function () {
      sceneEngine.resetParallaxTarget();
    });

    // ---- keyboard: M returns to map. Scoped to the ROOT container (not
    // document) so the module never hijacks keystrokes on the rest of a
    // Tilda page — only fires while focus is within this module. ----
    function onKeydown(e) {
      if (e.key === 'm' || e.key === 'M') {
        var tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        showMap();
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
          mapNav.layout();
          if (!showingMap && currentZoneId) showZone(currentZoneId, false);
        }
      });
      rootResizeObserver.observe(root);
    }

    sceneEngine.start();

    // ---- initial view: deep-link via ?zone= is a DEMO/standalone concern
    // (see embed/demo.html) — mount() itself only accepts config.initialZone
    // so it stays agnostic of how the host page structures its URL. ----
    if (config.initialZone && scenesConfig.zones[config.initialZone]) {
      showZone(config.initialZone, false);
    } else {
      showMap();
    }

    function unmount() {
      sceneEngine.destroy();
      gesture.destroy();
      mapNav.destroy();
      globalNav.destroy();
      debugOverlay.destroy();
      root.removeEventListener('keydown', onKeydown);
      if (rootResizeObserver) rootResizeObserver.disconnect();
      sceneView.remove();
      root.classList.remove('yh-app', 'yh-app--debug');
      root.removeAttribute('tabindex');
    }

    return {
      showZone: showZone,
      showMap: showMap,
      unmount: unmount,
      setDebug: function (v) { debugOverlay.setEnabled(v); },
      getState: function () {
        return { currentZoneId: currentZoneId, showingMap: showingMap, isMobile: isMobile() };
      }
    };
  }

  YHApp.mount = mount;
})(window.YHApp = window.YHApp || {});
