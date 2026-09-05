// MapNavigation — карта с 8 hotspot'ами 00-07. Реализация из V1
// (map/mapMobile проценты, click -> переход в зону) перенесена как
// проверенный паттерн; DOM/CSS собраны заново под scoped-разметку V2.

(function (YHApp) {
  'use strict';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createMapNavigation(root, config, callbacks) {
    callbacks = callbacks || {};
    var onZoneSelect = callbacks.onZoneSelect || function () {};
    var isMobile = callbacks.isMobile || function () { return false; };

    var zones = config.scenes.zones;
    var zoneOrder = config.scenes.zoneOrder;
    var mapImage = config.scenes.mapImage;

    var view = el('section', 'yh-map-view', { 'aria-label': 'Карта пространства' });
    var stage = el('div', 'yh-map-stage');
    var img = el('img', 'yh-map-image', { alt: 'Карта пространства «Молодёжная среда»', draggable: 'false' });
    stage.appendChild(img);

    var hotspotsLayer = el('div', 'yh-map-hotspots');
    stage.appendChild(hotspotsLayer);
    view.appendChild(stage);
    root.appendChild(view);

    var dots = {};
    zoneOrder.forEach(function (zoneId) {
      var zone = zones[zoneId];
      var dot = el('button', 'yh-map-hotspot', {
        type: 'button',
        'data-zone': zoneId,
        'aria-label': zoneId + ' — ' + zone.shared.title
      });
      dot.style.setProperty('--yh-zone-color', zone.shared.color);
      var label = el('span', 'yh-map-hotspot__label');
      label.textContent = zoneId + ' ' + zone.shared.title;
      dot.appendChild(label);
      // single tap/click -> navigate directly, no separate "select" step —
      // an intermediate select-then-navigate step was considered and
      // rejected (Production-ТЗ Этап 2: "если ухудшает UX на mobile,
      // используй прямой single tap → navigate").
      dot.addEventListener('click', function () { onZoneSelect(zoneId); });
      hotspotsLayer.appendChild(dot);
      dots[zoneId] = dot;
    });

    function layout() {
      var mobile = isMobile();
      var asset = mobile ? mapImage.mobile : mapImage.desktop;
      if (img.dataset.currentSrc !== asset.src) {
        img.src = asset.src;
        img.dataset.currentSrc = asset.src;
      }
      zoneOrder.forEach(function (zoneId) {
        var zone = zones[zoneId];
        var pos = (mobile && zone.mapMobile) ? zone.mapMobile : zone.map;
        dots[zoneId].style.left = pos.x + '%';
        dots[zoneId].style.top = pos.y + '%';
      });
    }

    function show() { view.hidden = false; layout(); }
    function hide() { view.hidden = true; }

    function setLastVisited(zoneId) {
      zoneOrder.forEach(function (id) {
        dots[id].classList.toggle('yh-map-hotspot--last-visited', id === zoneId);
      });
    }

    function destroy() { view.remove(); }

    return { view: view, show: show, hide: hide, layout: layout, setLastVisited: setLastVisited, destroy: destroy };
  }

  YHApp.createMapNavigation = createMapNavigation;
})(window.YHApp = window.YHApp || {});
