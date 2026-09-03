(function () {
  'use strict';

  var STORAGE_KEY = 'mly_last_zone';

  var mapView = document.getElementById('map-view');
  var sceneView = document.getElementById('scene-view');
  var mapHotspotsEl = document.getElementById('map-hotspots');
  var mapTooltip = document.getElementById('map-tooltip');
  var mapTooltipNum = document.getElementById('map-tooltip-num');
  var mapTooltipTitle = document.getElementById('map-tooltip-title');
  var mapZoomVeil = document.getElementById('map-zoom-veil');
  var mapStage = document.querySelector('.map-stage');
  var fadeVeil = document.getElementById('fade-veil');

  var sceneViewport = document.getElementById('scene-viewport');
  var sceneStage = document.getElementById('scene-stage');
  var sceneImage = document.getElementById('scene-image');
  var sceneHotspotsEl = document.getElementById('scene-hotspots');
  var mapReturnBtn = document.getElementById('map-return');

  var state = {
    currentZoneId: null,
    currentScene: null,
    scale: 1,
    minScale: 1,
    maxScale: 3,
    tx: 0,
    ty: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTx: 0,
    dragStartTy: 0
  };

  // ---------------------------------------------------------------
  // MAP: build hotspots
  // ---------------------------------------------------------------

  var mapImageEl = document.querySelector('.map-image');

  // .map-image uses object-fit:contain, so it can be letterboxed inside
  // .map-stage (especially on narrow mobile screens). Hotspots are
  // positioned in % of the *visible image content box*, not the element
  // box, so we compute and apply that box on load/resize.
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

      dot.addEventListener('mouseenter', function (e) { showTooltip(zone, e); });
      dot.addEventListener('mousemove', function (e) { positionTooltip(e); });
      dot.addEventListener('mouseleave', hideTooltip);
      dot.addEventListener('focus', function () { showTooltip(zone, null, dot); });
      dot.addEventListener('blur', hideTooltip);
      dot.addEventListener('click', function () { goToZoneFromMap(zoneId); });

      mapHotspotsEl.appendChild(dot);
    });
    restoreSelectedZone();
  }

  function showTooltip(zone, evt, el) {
    mapTooltipNum.textContent = zone.id;
    mapTooltipTitle.textContent = zone.title;
    mapTooltip.hidden = false;
    if (evt) {
      positionTooltip(evt);
    } else if (el) {
      var r = el.getBoundingClientRect();
      mapTooltip.style.left = (r.left + r.width / 2) + 'px';
      mapTooltip.style.top = r.top + 'px';
    }
  }

  function positionTooltip(evt) {
    mapTooltip.style.left = evt.clientX + 'px';
    mapTooltip.style.top = evt.clientY + 'px';
  }

  function hideTooltip() {
    mapTooltip.hidden = true;
  }

  function restoreSelectedZone() {
    var last = localStorage.getItem(STORAGE_KEY);
    if (!last || !ZONES[last]) return;
    highlightMapZone(last);
  }

  function highlightMapZone(zoneId) {
    var dots = mapHotspotsEl.querySelectorAll('.map-hotspot');
    dots.forEach(function (d) {
      d.classList.toggle('is-selected', d.dataset.zone === zoneId);
    });
  }

  // ---------------------------------------------------------------
  // MAP -> SCENE transition
  // ---------------------------------------------------------------

  function goToZoneFromMap(zoneId) {
    var zone = ZONES[zoneId];
    localStorage.setItem(STORAGE_KEY, zoneId);
    highlightMapZone(zoneId);
    hideTooltip();

    // 1. slight zoom into the clicked area of the map
    var frameLeft = parseFloat(mapHotspotsEl.style.left) || 0;
    var frameTop = parseFloat(mapHotspotsEl.style.top) || 0;
    var frameW = parseFloat(mapHotspotsEl.style.width) || mapStage.clientWidth;
    var frameH = parseFloat(mapHotspotsEl.style.height) || mapStage.clientHeight;
    var originX = (frameLeft + (zone.map.x / 100) * frameW) + 'px';
    var originY = (frameTop + (zone.map.y / 100) * frameH) + 'px';
    mapStage.style.transformOrigin = originX + ' ' + originY;
    mapStage.style.transform = 'scale(1.35)';
    mapZoomVeil.classList.add('is-visible');

    // 2. after the zoom-in settles, fade to the scene
    setTimeout(function () {
      openScene(zoneId, true);
      // reset map transform for next time (invisible, view is hidden already)
      setTimeout(function () {
        mapStage.style.transform = 'scale(1)';
        mapZoomVeil.classList.remove('is-visible');
      }, 50);
    }, 380);
  }

  // ---------------------------------------------------------------
  // SCENE VIEW: open / camera / pan / zoom
  // ---------------------------------------------------------------

  function openScene(zoneId, animated) {
    var zone = ZONES[zoneId];
    var sceneId = zone.scene;
    var sceneDef = SCENES[sceneId];

    state.currentZoneId = zoneId;
    state.currentScene = sceneId;

    function activate() {
      if (sceneImage.getAttribute('src') !== sceneDef.file) {
        sceneImage.src = sceneDef.file;
      }
      sceneImage.alt = 'Панорама: ' + sceneDef.zones.map(function (z) { return ZONES[z].id + ' ' + ZONES[z].title; }).join(' / ');

      buildSceneHotspots(sceneDef);

      mapView.classList.remove('view--active');
      sceneView.classList.add('view--active');

      // camera positioning happens once image metrics are known
      whenImageReady(sceneImage, function () {
        setCameraTo(zone.camera, false);
      });

      fadeVeil.classList.remove('is-visible');
    }

    if (animated) {
      fadeVeil.classList.add('is-visible');
      setTimeout(activate, 320);
    } else {
      activate();
    }
  }

  function whenImageReady(img, cb) {
    if (img.complete && img.naturalWidth) { cb(); return; }
    img.onload = cb;
  }

  function buildSceneHotspots(sceneDef) {
    sceneHotspotsEl.innerHTML = '';
    sceneDef.zones.forEach(function (zoneId) {
      var zone = ZONES[zoneId];
      var dot = document.createElement('button');
      dot.className = 'map-hotspot';
      dot.type = 'button';
      dot.dataset.num = zone.id;
      dot.style.left = zone.camera.x + '%';
      dot.style.top = zone.camera.y + '%';
      dot.style.setProperty('--dot', zone.color);
      dot.setAttribute('aria-label', zone.id + ' ' + zone.title);
      if (zoneId === state.currentZoneId) dot.classList.add('is-selected');
      dot.addEventListener('click', function () {
        state.currentZoneId = zoneId;
        localStorage.setItem(STORAGE_KEY, zoneId);
        setCameraTo(zone.camera, true);
        var siblings = sceneHotspotsEl.querySelectorAll('.map-hotspot');
        siblings.forEach(function (s) { s.classList.remove('is-selected'); });
        dot.classList.add('is-selected');
      });
      sceneHotspotsEl.appendChild(dot);
    });
  }

  function getCoverScale() {
    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var iw = sceneImage.naturalWidth;
    var ih = sceneImage.naturalHeight;
    if (!iw || !ih) return 1;
    return Math.max(vw / iw, vh / ih);
  }

  function applyStageTransform() {
    sceneStage.style.transform = 'translate(' + state.tx + 'px,' + state.ty + 'px) scale(' + state.scale + ')';
  }

  function clampTranslate() {
    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var iw = sceneImage.naturalWidth * state.scale;
    var ih = sceneImage.naturalHeight * state.scale;

    var minTx = Math.min(0, vw - iw);
    var minTy = Math.min(0, vh - ih);

    state.tx = Math.max(minTx, Math.min(0, state.tx));
    state.ty = Math.max(minTy, Math.min(0, state.ty));
  }

  function setCameraTo(focus, animated) {
    var base = getCoverScale();
    state.minScale = base;
    state.maxScale = base * 2.6;
    var targetScale = Math.min(state.maxScale, Math.max(state.minScale, base * (focus.scale || 1)));

    state.scale = targetScale;

    var vw = sceneViewport.clientWidth;
    var vh = sceneViewport.clientHeight;
    var focusX = (focus.x / 100) * sceneImage.naturalWidth * targetScale;
    var focusY = (focus.y / 100) * sceneImage.naturalHeight * targetScale;

    state.tx = vw / 2 - focusX;
    state.ty = vh / 2 - focusY;
    clampTranslate();

    if (animated) {
      sceneStage.style.transition = 'transform 650ms cubic-bezier(.65,0,.35,1)';
      setTimeout(function () { sceneStage.style.transition = ''; }, 700);
    }
    applyStageTransform();
  }

  // ---- drag to pan ----

  function onDragStart(clientX, clientY) {
    state.dragging = true;
    state.dragStartX = clientX;
    state.dragStartY = clientY;
    state.dragStartTx = state.tx;
    state.dragStartTy = state.ty;
    sceneViewport.classList.add('is-dragging');
  }

  function onDragMove(clientX, clientY) {
    if (!state.dragging) return;
    state.tx = state.dragStartTx + (clientX - state.dragStartX);
    state.ty = state.dragStartTy + (clientY - state.dragStartY);
    clampTranslate();
    applyStageTransform();
  }

  function onDragEnd() {
    state.dragging = false;
    sceneViewport.classList.remove('is-dragging');
  }

  sceneViewport.addEventListener('mousedown', function (e) {
    onDragStart(e.clientX, e.clientY);
    e.preventDefault();
  });
  window.addEventListener('mousemove', function (e) { onDragMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', onDragEnd);

  sceneViewport.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    onDragStart(t.clientX, t.clientY);
  }, { passive: true });
  sceneViewport.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    onDragMove(t.clientX, t.clientY);
  }, { passive: true });
  sceneViewport.addEventListener('touchend', onDragEnd);

  // ---- wheel to zoom, centered on cursor ----

  sceneViewport.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = sceneViewport.getBoundingClientRect();
    var cx = e.clientX - rect.left;
    var cy = e.clientY - rect.top;

    var imgX = (cx - state.tx) / state.scale;
    var imgY = (cy - state.ty) / state.scale;

    var delta = -e.deltaY * 0.0015;
    var newScale = Math.min(state.maxScale, Math.max(state.minScale, state.scale * (1 + delta)));

    state.tx = cx - imgX * newScale;
    state.ty = cy - imgY * newScale;
    state.scale = newScale;

    clampTranslate();
    applyStageTransform();
  }, { passive: false });

  window.addEventListener('resize', function () {
    if (state.currentZoneId && sceneView.classList.contains('view--active')) {
      setCameraTo(ZONES[state.currentZoneId].camera, false);
    }
  });

  // ---------------------------------------------------------------
  // SCENE -> MAP return
  // ---------------------------------------------------------------

  function returnToMap() {
    if (!mapView.classList.contains('view--active')) {
      fadeVeil.classList.add('is-visible');
      setTimeout(function () {
        sceneView.classList.remove('view--active');
        mapView.classList.add('view--active');
        if (state.currentZoneId) highlightMapZone(state.currentZoneId);
        fadeVeil.classList.remove('is-visible');
      }, 320);
    }
  }

  mapReturnBtn.addEventListener('click', returnToMap);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
      returnToMap();
    }
  });

  // ---------------------------------------------------------------
  // init
  // ---------------------------------------------------------------

  buildMapHotspots();
})();
