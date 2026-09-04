(function () {
  'use strict';

  var STORAGE_KEY = 'mly_last_zone';
  var params = new URLSearchParams(location.search);
  var DEBUG = params.get('debug') === '1';
  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hoverFineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var mobileViewportMQ = window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT + 'px)');
  function reducedMotion() { return reduceMotionMQ.matches; }
  function isMobileViewport() { return mobileViewportMQ.matches; }
  // desktop-only affordances (parallax, custom cursor) require BOTH a fine
  // pointer with real hover AND a viewport above the mobile breakpoint —
  // a touch laptop in a narrow window must still behave like mobile.
  function isDesktopPointer() { return hoverFineMQ.matches && !isMobileViewport(); }
  function getCameraPreset(zone) {
    return (isMobileViewport() && zone.cameraMobile) ? zone.cameraMobile : zone.camera;
  }

  // ---------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------

  var mapView = document.getElementById('map-view');
  var sceneView = document.getElementById('scene-view');
  var mapHotspotsEl = document.getElementById('map-hotspots');
  var mapZoomVeil = document.getElementById('map-zoom-veil');
  var mapStage = document.querySelector('.map-stage');
  var mapImageEl = document.querySelector('.map-image');
  var fadeVeil = document.getElementById('fade-veil');

  var sceneViewport = document.getElementById('scene-viewport');
  var sceneStage = document.getElementById('scene-stage');
  var sceneImage = document.getElementById('scene-image');
  var sceneSourceWebp = document.getElementById('scene-source-webp');
  var mapSourceWebp = document.getElementById('map-source-webp');
  var sceneHotspotsEl = document.getElementById('scene-hotspots');
  var contentHotspotsEl = document.getElementById('scene-content-hotspots');
  var mapReturnBtn = document.getElementById('map-return');

  var siteNav = document.getElementById('site-nav');
  var mobileMenu = document.getElementById('mobile-menu');
  var burgerBtn = document.getElementById('burger-btn');

  var bottomNavRail = document.getElementById('bottom-nav-rail');
  var bottomNavPrev = document.getElementById('bottom-nav-prev');
  var bottomNavNext = document.getElementById('bottom-nav-next');

  var ctaCard = document.getElementById('cta-card-07');

  var paperOverlay = document.getElementById('paper-overlay');
  var paperTitle = document.getElementById('paper-note-title');
  var paperSubtitle = document.getElementById('paper-note-subtitle');
  var paperBody = document.getElementById('paper-note-body');
  var paperClose = document.getElementById('paper-note-close');

  var dossierOverlay = document.getElementById('dossier-overlay');
  var dossierNum = document.getElementById('dossier-num');
  var dossierTitle = document.getElementById('dossier-title');
  var dossierChecklist = document.getElementById('dossier-checklist');
  var dossierClose = document.getElementById('dossier-close');

  var rolePopover = document.getElementById('role-popover');
  var rolePopoverTitle = document.getElementById('role-popover-title');
  var rolePopoverDesc = document.getElementById('role-popover-desc');

  var toastEl = document.getElementById('toast');
  var cursorBadge = document.getElementById('cursor-badge');
  var cursorBadgeText = document.getElementById('cursor-badge-text');
  var debugHud = document.getElementById('debug-hud');

  var state = {
    currentZoneId: null,
    currentScene: null,
    sceneW: 0,
    sceneH: 0,
    presetScale: 1,
    zoomFactor: 1,
    scale: 1,
    minScale: 1,
    maxScale: 3,
    tx: 0,
    ty: 0,
    dragging: false,
    dragMoved: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTx: 0,
    dragStartTy: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    parallaxX: 0,
    parallaxY: 0,
    parallaxTargetX: 0,
    parallaxTargetY: 0,
    lastFocusedEl: null
  };

  // ---------------------------------------------------------------
  // small utils
  // ---------------------------------------------------------------

  function whenImageReady(img, cb) {
    if (img.complete && img.naturalWidth) { cb(); return; }
    img.onload = cb;
  }

  function logHotspot(id) {
    // eslint-disable-next-line no-console
    console.log('HOTSPOT CLICKED:', id);
  }

  var toastTimer = null;
  function showToast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, ms || 2600);
  }

  function showCursorBadge(text, evt) {
    if (!isDesktopPointer()) return;
    cursorBadgeText.textContent = text;
    cursorBadge.hidden = false;
    if (evt) {
      cursorBadge.style.left = evt.clientX + 'px';
      cursorBadge.style.top = evt.clientY + 'px';
    }
  }
  function moveCursorBadge(evt) {
    if (cursorBadge.hidden) return;
    cursorBadge.style.left = evt.clientX + 'px';
    cursorBadge.style.top = evt.clientY + 'px';
  }
  function hideCursorBadge() { cursorBadge.hidden = true; }

  function attachCursorHint(el, text) {
    el.addEventListener('mouseenter', function (e) { showCursorBadge(text, e); });
    el.addEventListener('mousemove', moveCursorBadge);
    el.addEventListener('mouseleave', hideCursorBadge);
  }

  function openExternalLibrary() {
    if (CONFIG.externalLibraryUrl) {
      window.open(CONFIG.externalLibraryUrl, '_blank', 'noopener');
    } else {
      showToast(UI_STRINGS.libraryToast);
    }
  }

  // focus trap + open/close helpers for modal overlays
  function focusablesIn(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function openModal(overlayEl, focusEl) {
    state.lastFocusedEl = document.activeElement;
    overlayEl.hidden = false;
    requestAnimationFrame(function () {
      (focusEl || overlayEl.querySelector('button, [tabindex]')).focus();
    });
  }

  function closeModal(overlayEl) {
    if (overlayEl.hidden) return;
    overlayEl.hidden = true;
    if (state.lastFocusedEl && document.body.contains(state.lastFocusedEl)) {
      state.lastFocusedEl.focus();
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var openOverlay = [paperOverlay, dossierOverlay].filter(function (o) { return !o.hidden; })[0];
    if (!openOverlay) return;
    var focusables = focusablesIn(openOverlay);
    if (!focusables.length) return;
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---------------------------------------------------------------
  // BRANDING / STATIC UI TEXT — everything editable via js/config.js
  // ---------------------------------------------------------------

  function renderBranding() {
    var pageTitleEl = document.getElementById('page-title');
    if (pageTitleEl) pageTitleEl.textContent = SITE.pageTitleMap;

    var logoImg = document.getElementById('logo-image');
    var logoCaption = document.getElementById('logo-caption');
    if (logoImg) { logoImg.src = SITE.logo; logoImg.alt = SITE.shortName; }
    if (logoCaption) logoCaption.innerHTML = SITE.subtitle.toUpperCase().split(' ').join('<br>');

    var mapImg = document.getElementById('map-image');
    if (mapImg) {
      mapImg.alt = 'Карта пространства «' + SITE.name + '»';
      mapImg.srcset = MAP_IMAGE.srcsetPng;
      mapImg.src = MAP_IMAGE.src;
    }
    if (mapSourceWebp) mapSourceWebp.srcset = MAP_IMAGE.srcsetWebp;

    var headerCta = document.getElementById('cta-apply-header');
    if (headerCta) {
      headerCta.href = CONFIG.applicationUrl;
      headerCta.innerHTML = UI_STRINGS.ctaApply + ' <span aria-hidden="true">↗</span>';
    }

    var sceneCta = document.getElementById('cta-apply-scene');
    if (sceneCta) {
      sceneCta.href = CONFIG.applicationUrl;
      sceneCta.innerHTML = UI_STRINGS.ctaCard.button + ' <span aria-hidden="true">→</span>';
    }

    var mapReturnLabel = document.getElementById('map-return-label');
    if (mapReturnLabel) mapReturnLabel.textContent = UI_STRINGS.mapButton;

    var eyebrow = document.getElementById('cta-card-eyebrow');
    var title = document.getElementById('cta-card-title');
    var note = document.getElementById('cta-card-note');
    if (eyebrow) eyebrow.textContent = UI_STRINGS.ctaCard.eyebrow;
    if (title) title.textContent = UI_STRINGS.ctaCard.title;
    if (note) note.innerHTML = UI_STRINGS.ctaCard.note.split('\n').join('<br>');
    setText('cta-date-event-label', UI_STRINGS.ctaCard.dateEventLabel);
    setText('cta-date-apply-label', UI_STRINGS.ctaCard.dateApplyLabel);
    setText('cta-date-results-label', UI_STRINGS.ctaCard.dateResultsLabel);
    setText('cta-date-event', CONFIG.dates.event);
    setText('cta-date-apply', CONFIG.dates.apply);
    setText('cta-date-results', CONFIG.dates.results);

    setText('dossier-placeholder', UI_STRINGS.dossierPlaceholder);
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ---------------------------------------------------------------
  // HEADER navigation
  // ---------------------------------------------------------------

  function renderHeader() {
    HEADER_NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      siteNav.appendChild(a.cloneNode(true));
      mobileMenu.appendChild(a);
    });
    var applyLink = document.createElement('a');
    applyLink.href = CONFIG.applicationUrl;
    applyLink.className = 'cta-apply';
    applyLink.innerHTML = UI_STRINGS.ctaApply + ' <span aria-hidden="true">↗</span>';
    mobileMenu.appendChild(applyLink);
  }

  burgerBtn.addEventListener('click', function () {
    var expanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    burgerBtn.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });

  // ---------------------------------------------------------------
  // MAP: layout + hotspots
  // ---------------------------------------------------------------

  function layoutMapFrame() {
    var stageRect = mapStage.getBoundingClientRect();
    var iw = mapImageEl.naturalWidth;
    var ih = mapImageEl.naturalHeight;
    if (!iw || !ih || !stageRect.width || !stageRect.height) return;

    var elAspect = stageRect.width / stageRect.height;
    var imgAspect = iw / ih;
    var contentW, contentH, offsetX, offsetY;

    if (imgAspect > elAspect) {
      contentW = stageRect.width;
      contentH = contentW / imgAspect;
      offsetX = 0;
      offsetY = (stageRect.height - contentH) / 2;
    } else {
      contentH = stageRect.height;
      contentW = contentH * imgAspect;
      offsetY = 0;
      offsetX = (stageRect.width - contentW) / 2;
    }

    mapHotspotsEl.style.left = offsetX + 'px';
    mapHotspotsEl.style.top = offsetY + 'px';
    mapHotspotsEl.style.width = contentW + 'px';
    mapHotspotsEl.style.height = contentH + 'px';
  }

  whenImageReady(mapImageEl, layoutMapFrame);
  window.addEventListener('resize', layoutMapFrame);

  function buildMapHotspots() {
    ZONE_ORDER.forEach(function (zoneId) {
      var zone = ZONES[zoneId];
      var dot = document.createElement('button');
      dot.className = 'map-hotspot';
      dot.type = 'button';
      dot.dataset.zone = zoneId;
      dot.dataset.num = zoneId;
      dot.style.left = zone.map.x + '%';
      dot.style.top = zone.map.y + '%';
      dot.style.setProperty('--dot', zone.color);
      dot.setAttribute('aria-label', zoneId + ' ' + zone.title + ' — идти');

      attachCursorHint(dot, zoneId + ' ' + zone.title + ' · ' + UI_STRINGS.cursorGo);
      dot.addEventListener('click', function () {
        logHotspot('map:' + zoneId);
        goToZoneFromMap(zoneId);
      });

      mapHotspotsEl.appendChild(dot);
    });
    restoreSelectedZone();
  }

  function restoreSelectedZone() {
    var last = localStorage.getItem(STORAGE_KEY);
    if (!last || !ZONES[last]) return;
    highlightMapZone(last);
  }

  function highlightMapZone(zoneId) {
    var dots = mapHotspotsEl.querySelectorAll('.map-hotspot');
    dots.forEach(function (d) { d.classList.toggle('is-selected', d.dataset.zone === zoneId); });
  }

  // ---------------------------------------------------------------
  // MAP -> SCENE transition
  // ---------------------------------------------------------------

  function goToZoneFromMap(zoneId) {
    var zone = ZONES[zoneId];
    localStorage.setItem(STORAGE_KEY, zoneId);
    highlightMapZone(zoneId);
    hideCursorBadge();

    var frameLeft = parseFloat(mapHotspotsEl.style.left) || 0;
    var frameTop = parseFloat(mapHotspotsEl.style.top) || 0;
    var frameW = parseFloat(mapHotspotsEl.style.width) || mapStage.clientWidth;
    var frameH = parseFloat(mapHotspotsEl.style.height) || mapStage.clientHeight;
    var originX = (frameLeft + (zone.map.x / 100) * frameW) + 'px';
    var originY = (frameTop + (zone.map.y / 100) * frameH) + 'px';
    mapStage.style.transformOrigin = originX + ' ' + originY;

    if (reducedMotion()) {
      openScene(zoneId, true);
      return;
    }

    mapStage.style.transform = 'scale(1.35)';
    mapZoomVeil.classList.add('is-visible');

    setTimeout(function () {
      openScene(zoneId, true);
      setTimeout(function () {
        mapStage.style.transform = 'scale(1)';
        mapZoomVeil.classList.remove('is-visible');
      }, 50);
    }, 380);
  }

  // ---------------------------------------------------------------
  // Unified zone navigation entry point
  // (used by bottom nav, in-scene neighbour hotspots, swipe)
  // ---------------------------------------------------------------

  function goToZone(zoneId) {
    if (zoneId === state.currentZoneId && sceneView.classList.contains('view--active')) return;
    if (mapView.classList.contains('view--active')) { goToZoneFromMap(zoneId); return; }

    var zone = ZONES[zoneId];
    var sameScene = state.currentScene === zone.scene;
    localStorage.setItem(STORAGE_KEY, zoneId);

    if (sameScene) {
      switchZoneWithinScene(zoneId);
    } else {
      openScene(zoneId, true);
    }
  }

  function switchZoneWithinScene(zoneId) {
    var zone = ZONES[zoneId];
    state.currentZoneId = zoneId;
    localStorage.setItem(STORAGE_KEY, zoneId);
    state.zoomFactor = 1;
    setCameraTo(getCameraPreset(zone), !reducedMotion());
    updateSceneChrome(zoneId);
  }

  // ---------------------------------------------------------------
  // SCENE VIEW: open / camera / pan / zoom
  // ---------------------------------------------------------------

  function openScene(zoneId, animated) {
    var zone = ZONES[zoneId];
    var sceneId = zone.scene;
    var sceneDef = SCENES[sceneId];
    var isNewImage = sceneImage.getAttribute('src') !== sceneDef.src;

    state.currentZoneId = zoneId;
    state.currentScene = sceneId;
    state.zoomFactor = 1;

    function activate() {
      if (isNewImage) {
        sceneSourceWebp.srcset = sceneDef.srcsetWebp;
        sceneImage.srcset = sceneDef.srcsetPng;
        sceneImage.src = sceneDef.src;
        // Force the rendered CSS box to the canonical pixel size regardless
        // of which srcset tier the browser actually fetches — with
        // sizes+srcset, naturalWidth/Height (and the img's intrinsic
        // display size) become density-adjusted, not the file's raw
        // pixels, which would silently break the pan/zoom transform math
        // below. The retina tier then just supplies more real pixels to
        // resample from when our own scale() zooms in — sharper, same box.
        sceneImage.style.width = sceneDef.w + 'px';
        sceneImage.style.height = sceneDef.h + 'px';
        state.sceneW = sceneDef.w;
        state.sceneH = sceneDef.h;
      }
      sceneImage.alt = 'Панорама: ' + sceneDef.zones.map(function (z) { return ZONES[z].id + ' ' + ZONES[z].title; }).join(' / ');

      buildSceneSwitchHotspots(sceneDef);
      buildContentHotspots(sceneId);

      mapView.classList.remove('view--active');
      sceneView.classList.add('view--active');
      closeAllOverlays();

      whenImageReady(sceneImage, function () { setCameraTo(getCameraPreset(zone), false); });

      updateSceneChrome(zoneId);
      fadeVeil.classList.remove('is-visible');
    }

    if (animated && !reducedMotion()) {
      fadeVeil.classList.add('is-visible');
      setTimeout(activate, 260);
    } else {
      activate();
    }
  }

  function updateSceneChrome(zoneId) {
    var zone = ZONES[zoneId];
    renderBottomNav(zoneId);
    highlightSwitchHotspot(zoneId);
    ctaCard.hidden = zoneId !== '07';
    document.documentElement.style.setProperty('--zone-color', zone.color);
    updateDebugHud();
  }

  function buildSceneSwitchHotspots(sceneDef) {
    sceneHotspotsEl.innerHTML = '';
    sceneDef.zones.forEach(function (zoneId) {
      var zone = ZONES[zoneId];
      var dot = document.createElement('button');
      dot.className = 'map-hotspot';
      dot.type = 'button';
      dot.dataset.num = zone.id;
      dot.dataset.zone = zoneId;
      dot.style.left = zone.camera.x + '%';
      dot.style.top = zone.camera.y + '%';
      dot.style.setProperty('--dot', zone.color);
      dot.setAttribute('aria-label', zone.id + ' ' + zone.title);
      attachCursorHint(dot, zone.id + ' ' + zone.title);
      dot.addEventListener('click', function () {
        logHotspot('scene-switch:' + zoneId);
        switchZoneWithinScene(zoneId);
      });
      sceneHotspotsEl.appendChild(dot);
    });
    highlightSwitchHotspot(state.currentZoneId);
  }

  function highlightSwitchHotspot(zoneId) {
    var siblings = sceneHotspotsEl.querySelectorAll('.map-hotspot');
    siblings.forEach(function (s) { s.classList.toggle('is-selected', s.dataset.zone === zoneId); });
  }

  function getCoverScale() {
    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var iw = state.sceneW;
    var ih = state.sceneH;
    if (!iw || !ih) return 1;
    return Math.max(vw / iw, vh / ih);
  }

  function applyStageTransform() {
    var px = reducedMotion() ? 0 : state.parallaxX;
    var py = reducedMotion() ? 0 : state.parallaxY;
    sceneStage.style.transform = 'translate(' + (state.tx + px) + 'px,' + (state.ty + py) + 'px) scale(' + state.scale + ')';
  }

  function clampTranslate() {
    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var iw = state.sceneW * state.scale;
    var ih = state.sceneH * state.scale;
    var minTx = Math.min(0, vw - iw);
    var minTy = Math.min(0, vh - ih);
    state.tx = Math.max(minTx, Math.min(0, state.tx));
    state.ty = Math.max(minTy, Math.min(0, state.ty));
  }

  function setCameraTo(focus, animated) {
    var base = getCoverScale();
    state.minScale = base;
    state.maxScale = base * 2.6;
    var presetScale = Math.min(state.maxScale, Math.max(state.minScale, base * (focus.scale || 1)));
    state.presetScale = presetScale;
    state.zoomFactor = 1;
    state.scale = presetScale;

    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var focusX = (focus.x / 100) * state.sceneW * presetScale;
    var focusY = (focus.y / 100) * state.sceneH * presetScale;

    state.tx = vw / 2 - focusX;
    state.ty = vh / 2 - focusY;
    clampTranslate();

    if (animated) {
      sceneStage.style.transition = 'transform 700ms cubic-bezier(.65,0,.35,1)';
      setTimeout(function () { sceneStage.style.transition = ''; }, 750);
    }
    applyStageTransform();
    updateDebugHud();
  }

  // ---- drag to pan (desktop mouse + touch) ----

  function onDragStart(clientX, clientY) {
    state.dragging = true;
    state.dragMoved = false;
    state.dragStartX = clientX;
    state.dragStartY = clientY;
    state.dragStartTx = state.tx;
    state.dragStartTy = state.ty;
    sceneViewport.classList.add('is-dragging');
  }

  function onDragMove(clientX, clientY) {
    if (!state.dragging) return;
    var dx = clientX - state.dragStartX;
    var dy = clientY - state.dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) state.dragMoved = true;
    state.tx = state.dragStartTx + dx;
    state.ty = state.dragStartTy + dy;
    clampTranslate();
    applyStageTransform();
  }

  function onDragEnd() {
    state.dragging = false;
    sceneViewport.classList.remove('is-dragging');
  }

  sceneViewport.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    onDragStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', function (e) {
    onDragMove(e.clientX, e.clientY);
    if (!sceneView.classList.contains('view--active')) return;
    if (!isDesktopPointer() || reducedMotion() || state.dragging) return;
    var rect = sceneViewport.getBoundingClientRect();
    if (!rect.width) return;
    var nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    var ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    var AMP = 9;
    state.parallaxTargetX = -nx * AMP;
    state.parallaxTargetY = -ny * AMP;
  });
  window.addEventListener('mouseup', onDragEnd);
  sceneViewport.addEventListener('mouseleave', function () {
    state.parallaxTargetX = 0;
    state.parallaxTargetY = 0;
  });

  // touch: pan + swipe-to-neighbour
  sceneViewport.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
    state.touchStartX = t.clientX;
    state.touchStartY = t.clientY;
    state.touchStartTime = Date.now();
  }, { passive: true });

  sceneViewport.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  }, { passive: true });

  sceneViewport.addEventListener('touchend', function (e) {
    onDragEnd();
    var touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    var totalDx = touch.clientX - state.touchStartX;
    var totalDy = touch.clientY - state.touchStartY;
    var dt = Date.now() - state.touchStartTime;
    if (Math.abs(totalDx) > 60 && Math.abs(totalDx) > Math.abs(totalDy) * 1.4 && dt < 700) {
      var sceneDef = SCENES[state.currentScene];
      if (sceneDef && sceneDef.zones.length === 2) {
        var idx = sceneDef.zones.indexOf(state.currentZoneId);
        var targetIdx = totalDx < 0 ? idx + 1 : idx - 1;
        var targetZone = sceneDef.zones[targetIdx];
        if (targetZone) {
          logHotspot('swipe:' + targetZone);
          switchZoneWithinScene(targetZone);
        }
      }
    }
  });

  // ---- wheel: subtle zoom on top of the camera preset (1.00–1.08) ----

  var MAX_ZOOM_FACTOR = 1.08;

  sceneViewport.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = sceneViewport.getBoundingClientRect();
    var cx = e.clientX - rect.left;
    var cy = e.clientY - rect.top;

    var imgX = (cx - state.tx) / state.scale;
    var imgY = (cy - state.ty) / state.scale;

    var delta = -e.deltaY * 0.0012;
    var newZoomFactor = Math.min(MAX_ZOOM_FACTOR, Math.max(1, state.zoomFactor * (1 + delta)));
    var newScale = state.presetScale * newZoomFactor;

    state.tx = cx - imgX * newScale;
    state.ty = cy - imgY * newScale;
    state.zoomFactor = newZoomFactor;
    state.scale = newScale;

    clampTranslate();
    applyStageTransform();
    updateDebugHud();
  }, { passive: false });

  // ---- gentle parallax ticker ----

  function parallaxTick() {
    if (sceneView.classList.contains('view--active') && !reducedMotion()) {
      state.parallaxX += (state.parallaxTargetX - state.parallaxX) * 0.08;
      state.parallaxY += (state.parallaxTargetY - state.parallaxY) * 0.08;
      applyStageTransform();
    }
    requestAnimationFrame(parallaxTick);
  }
  requestAnimationFrame(parallaxTick);

  // generic "ПЕРЕТАЩИТЬ ↔" cursor hint for the pannable area itself
  // (hotspots set their own more specific hint; this only fills the gaps)
  var HOTSPOT_SELECTOR = '.map-hotspot, .content-hotspot, .archive-drawer, .team-role, .gallery-hotspot';
  sceneViewport.addEventListener('mousemove', function (e) {
    if (!isDesktopPointer() || state.dragging) return;
    if (e.target.closest(HOTSPOT_SELECTOR)) return;
    showCursorBadge(UI_STRINGS.cursorDrag, e);
  });
  sceneViewport.addEventListener('mouseleave', hideCursorBadge);

  window.addEventListener('resize', function () {
    layoutMapFrame();
    if (state.currentZoneId && sceneView.classList.contains('view--active')) {
      // re-apply the correct preset (desktop/mobile may have flipped)
      setCameraTo(getCameraPreset(ZONES[state.currentZoneId]), false);
    }
  });

  // ---- alt+click: copy % coordinates (debug helper) ----

  sceneViewport.addEventListener('click', function (e) {
    if (!e.altKey) return;
    var iw = state.sceneW, ih = state.sceneH;
    var imgX = (e.clientX - sceneViewport.getBoundingClientRect().left - state.tx) / state.scale;
    var imgY = (e.clientY - sceneViewport.getBoundingClientRect().top - state.ty) / state.scale;
    var pctX = (imgX / iw * 100).toFixed(1);
    var pctY = (imgY / ih * 100).toFixed(1);
    var coord = 'x: ' + pctX + '%, y: ' + pctY + '%';
    // eslint-disable-next-line no-console
    console.log('COORD:', coord);
    if (navigator.clipboard) navigator.clipboard.writeText(coord).catch(function () {});
    showToast(UI_STRINGS.coordCopyToast + ': ' + coord, 1800);
  });

  // ---------------------------------------------------------------
  // CONTENT HOTSPOTS per scene
  // ---------------------------------------------------------------

  function pctBox(item) {
    return {
      left: item.left + '%',
      top: item.top + '%',
      width: (item.right - item.left) + '%',
      height: (item.bottom - item.top) + '%'
    };
  }

  function buildContentHotspots(sceneId) {
    contentHotspotsEl.innerHTML = '';
    if (sceneId === 'scene-02-03') {
      HOTSPOTS_02.concat(HOTSPOTS_03).forEach(buildPaperHotspot);
    } else if (sceneId === 'scene-04-05') {
      ARCHIVE_ITEMS.forEach(buildArchiveDrawer);
      GALLERY_HOTSPOTS.forEach(buildGalleryHotspot);
    } else if (sceneId === 'scene-06-07') {
      TEAM_ROLES.forEach(buildTeamRole);
    }
  }

  function buildPaperHotspot(item) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'content-hotspot';
    btn.style.left = item.x + '%';
    btn.style.top = item.y + '%';
    btn.setAttribute('aria-label', item.title + (item.subtitle ? ' — ' + item.subtitle : ''));
    btn.innerHTML = '<span class="content-hotspot__dot">+</span>';
    attachCursorHint(btn, UI_STRINGS.cursorOpen);
    btn.addEventListener('click', function () {
      logHotspot(item.id);
      paperSubtitle.textContent = item.subtitle || '';
      paperTitle.textContent = item.title;
      paperBody.textContent = item.body;
      openModal(paperOverlay, paperClose);
    });
    contentHotspotsEl.appendChild(btn);
  }

  function buildArchiveDrawer(item) {
    var box = pctBox(item);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'archive-drawer';
    btn.style.left = box.left; btn.style.top = box.top;
    btn.style.width = box.width; btn.style.height = box.height;
    btn.setAttribute('aria-label', 'Ящик ' + item.num + ' — ' + item.city);
    attachCursorHint(btn, UI_STRINGS.cursorOpen);
    btn.addEventListener('click', function () {
      logHotspot('archive:' + item.num);
      btn.classList.add('is-open');
      setTimeout(function () {
        dossierNum.textContent = item.num;
        dossierTitle.textContent = item.city;
        dossierChecklist.innerHTML = '';
        ARCHIVE_DOSSIER_CHECKLIST.forEach(function (c) {
          var li = document.createElement('li');
          li.textContent = c;
          dossierChecklist.appendChild(li);
        });
        openModal(dossierOverlay, dossierClose);
        btn.classList.remove('is-open');
      }, reducedMotion() ? 0 : 260);
    });
    contentHotspotsEl.appendChild(btn);
  }

  function buildGalleryHotspot(item) {
    var box = pctBox(item);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-hotspot';
    btn.style.left = box.left; btn.style.top = box.top;
    btn.style.width = box.width; btn.style.height = box.height;
    btn.setAttribute('aria-label', item.label);
    attachCursorHint(btn, UI_STRINGS.cursorExternal);
    btn.addEventListener('click', function () {
      logHotspot(item.id);
      openExternalLibrary();
    });
    contentHotspotsEl.appendChild(btn);
  }

  function buildTeamRole(role) {
    var box = pctBox(role);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'team-role';
    btn.style.left = box.left; btn.style.top = box.top;
    btn.style.width = box.width; btn.style.height = box.height;
    btn.setAttribute('aria-label', role.title + ' — ' + role.desc);

    function show() {
      rolePopoverTitle.textContent = role.title;
      rolePopoverDesc.textContent = role.desc;
      rolePopover.hidden = false;
      var r = btn.getBoundingClientRect();
      var top = Math.max(70, r.top - 10);
      var left = Math.min(window.innerWidth - 300, r.right + 12);
      if (left < 10) left = 10;
      rolePopover.style.top = top + 'px';
      rolePopover.style.left = left + 'px';
      btn.classList.add('is-active');
    }
    function hide() {
      rolePopover.hidden = true;
      btn.classList.remove('is-active');
    }

    if (isDesktopPointer()) {
      btn.addEventListener('mouseenter', show);
      btn.addEventListener('mouseleave', hide);
      btn.addEventListener('focus', show);
      btn.addEventListener('blur', hide);
    }
    btn.addEventListener('click', function () {
      logHotspot('team:' + role.id);
      if (rolePopover.hidden) show(); else hide();
    });
    contentHotspotsEl.appendChild(btn);
  }

  document.addEventListener('click', function (e) {
    if (rolePopover.hidden) return;
    if (e.target.closest('.team-role') || e.target.closest('.role-popover')) return;
    rolePopover.hidden = true;
    document.querySelectorAll('.team-role.is-active').forEach(function (b) { b.classList.remove('is-active'); });
  });

  // ---------------------------------------------------------------
  // Overlays: close handlers
  // ---------------------------------------------------------------

  paperClose.addEventListener('click', function () { closeModal(paperOverlay); });
  dossierClose.addEventListener('click', function () { closeModal(dossierOverlay); });
  paperOverlay.addEventListener('click', function (e) { if (e.target === paperOverlay) closeModal(paperOverlay); });
  dossierOverlay.addEventListener('click', function (e) { if (e.target === dossierOverlay) closeModal(dossierOverlay); });

  function closeAllOverlays() {
    closeModal(paperOverlay);
    closeModal(dossierOverlay);
    rolePopover.hidden = true;
  }

  // ---------------------------------------------------------------
  // BOTTOM NAVIGATION 00–07
  // ---------------------------------------------------------------

  function renderBottomNav(activeZoneId) {
    if (bottomNavRail.childElementCount === 0) {
      ZONE_ORDER.forEach(function (zoneId) {
        var zone = ZONES[zoneId];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bottom-nav__item';
        btn.dataset.zone = zoneId;
        btn.style.setProperty('--zone-color', zone.color);
        btn.innerHTML = '<span>' + zoneId + '</span><span>' + zone.title.split(' / ')[0] + '</span>';
        btn.setAttribute('aria-label', zoneId + ' ' + zone.title);
        btn.addEventListener('click', function () {
          logHotspot('bottom-nav:' + zoneId);
          goToZone(zoneId);
        });
        bottomNavRail.appendChild(btn);
      });
    }
    var items = bottomNavRail.querySelectorAll('.bottom-nav__item');
    items.forEach(function (b) {
      var active = b.dataset.zone === activeZoneId;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-current', active ? 'true' : 'false');
    });
    var idx = ZONE_ORDER.indexOf(activeZoneId);
    bottomNavPrev.disabled = idx <= 0;
    bottomNavNext.disabled = idx >= ZONE_ORDER.length - 1;
    scrollActiveIntoView(activeZoneId);
  }

  function scrollActiveIntoView(zoneId) {
    var el = bottomNavRail.querySelector('[data-zone="' + zoneId + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  bottomNavPrev.addEventListener('click', function () {
    var idx = ZONE_ORDER.indexOf(state.currentZoneId);
    if (idx > 0) goToZone(ZONE_ORDER[idx - 1]);
  });
  bottomNavNext.addEventListener('click', function () {
    var idx = ZONE_ORDER.indexOf(state.currentZoneId);
    if (idx < ZONE_ORDER.length - 1) goToZone(ZONE_ORDER[idx + 1]);
  });

  // ---------------------------------------------------------------
  // SCENE -> MAP return
  // ---------------------------------------------------------------

  function returnToMap() {
    closeAllOverlays();
    if (!mapView.classList.contains('view--active')) {
      if (reducedMotion()) {
        sceneView.classList.remove('view--active');
        mapView.classList.add('view--active');
        if (state.currentZoneId) highlightMapZone(state.currentZoneId);
        return;
      }
      fadeVeil.classList.add('is-visible');
      setTimeout(function () {
        sceneView.classList.remove('view--active');
        mapView.classList.add('view--active');
        if (state.currentZoneId) highlightMapZone(state.currentZoneId);
        fadeVeil.classList.remove('is-visible');
      }, 260);
    }
  }

  mapReturnBtn.addEventListener('click', returnToMap);
  document.getElementById('bottom-nav-map').addEventListener('click', returnToMap);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!paperOverlay.hidden) { closeModal(paperOverlay); return; }
      if (!dossierOverlay.hidden) { closeModal(dossierOverlay); return; }
      if (!rolePopover.hidden) { rolePopover.hidden = true; return; }
      if (!mobileMenu.hidden) { mobileMenu.hidden = true; burgerBtn.setAttribute('aria-expanded', 'false'); return; }
      return;
    }
    if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
      returnToMap();
    }
  });

  // ---------------------------------------------------------------
  // DEBUG HUD (?debug=1)
  // ---------------------------------------------------------------

  if (DEBUG) {
    document.body.classList.add('debug-mode');
    debugHud.hidden = false;
  }

  function updateDebugHud() {
    if (!DEBUG) return;
    var activeZone = ZONES[state.currentZoneId];
    var activePreset = activeZone ? getCameraPreset(activeZone) : null;
    var lines = [
      'scene: ' + (state.currentScene || '—'),
      'zone: ' + (state.currentZoneId || '—'),
      'mode: ' + (isMobileViewport() ? 'mobile' : 'desktop'),
      'camera x/y: ' + (activePreset ? activePreset.x + ' / ' + activePreset.y : '—'),
      'scale: ' + state.scale.toFixed(3) + ' (zoomFactor ' + state.zoomFactor.toFixed(3) + ')',
      'bbox: ' + state.sceneW + '×' + state.sceneH + ' (canvas)',
      'viewport: ' + sceneViewport.clientWidth + '×' + sceneViewport.clientHeight,
      'DPR: ' + window.devicePixelRatio
    ];
    debugHud.textContent = lines.join('\n');
  }
  window.addEventListener('resize', updateDebugHud);
  setInterval(updateDebugHud, 400);

  // ---------------------------------------------------------------
  // init
  // ---------------------------------------------------------------

  renderBranding();
  renderHeader();
  buildMapHotspots();
})();
