// GlobalNav — верхняя системная полоса (CTA + КАРТА ↑) и нижний route
// 00–07. Всегда видны поверх любой сцены, никогда не блокируются
// локальными интерактивами зон (реализуется через z-index-токены в
// app.css, см. --yh-z-global-nav).
//
// CTA использует ТОЛЬКО config.links.APPLICATION_URL — компонент не
// содержит ни одного захардкоженного пути.

(function (YHApp) {
  'use strict';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    }
    return e;
  }

  function createGlobalNav(root, config, callbacks) {
    callbacks = callbacks || {};
    var onZoneSelect = callbacks.onZoneSelect || function () {};
    var onMapReturn = callbacks.onMapReturn || function () {};

    var strings = config.uiStrings;
    var links = config.links;
    var zoneOrder = config.scenes.zoneOrder;
    var zones = config.scenes.zones;

    // ---- header ----
    var header = el('header', 'yh-header');

    var mapReturnBtn = el('button', 'yh-header__map-return', { type: 'button' });
    mapReturnBtn.textContent = strings.mapReturn;
    mapReturnBtn.addEventListener('click', onMapReturn);
    header.appendChild(mapReturnBtn);

    var actions = el('div', 'yh-header__actions');
    var ctaLink = el('a', 'yh-cta', { href: links.APPLICATION_URL || '#' });
    ctaLink.textContent = strings.applyCta;
    if (!links.APPLICATION_URL) {
      ctaLink.setAttribute('aria-disabled', 'true');
      ctaLink.addEventListener('click', function (e) { e.preventDefault(); });
    }
    actions.appendChild(ctaLink);
    header.appendChild(actions);

    root.appendChild(header);

    // ---- bottom route 00-07 ----
    var bottomNav = el('nav', 'yh-bottom-nav', { 'aria-label': 'Маршрут по зонам' });
    var rail = el('div', 'yh-bottom-nav__rail');

    var itemButtons = {};
    zoneOrder.forEach(function (zoneId) {
      var zone = zones[zoneId];
      var btn = el('button', 'yh-bottom-nav__item', { type: 'button', 'data-zone': zoneId });
      var num = el('span', 'yh-bottom-nav__num');
      num.textContent = zoneId;
      var title = el('span', 'yh-bottom-nav__title');
      title.textContent = zone.shared.title;
      btn.appendChild(num);
      btn.appendChild(title);
      btn.addEventListener('click', function () { onZoneSelect(zoneId); });
      rail.appendChild(btn);
      itemButtons[zoneId] = btn;
    });

    bottomNav.appendChild(rail);
    root.appendChild(bottomNav);

    function setActiveZone(zoneId) {
      zoneOrder.forEach(function (id) {
        itemButtons[id].classList.toggle('is-active', id === zoneId);
        itemButtons[id].setAttribute('aria-current', id === zoneId ? 'true' : 'false');
      });
    }

    function setBottomNavVisible(visible) {
      bottomNav.hidden = !visible;
    }

    function destroy() {
      header.remove();
      bottomNav.remove();
    }

    return {
      header: header,
      bottomNav: bottomNav,
      ctaLink: ctaLink,
      mapReturnBtn: mapReturnBtn,
      setActiveZone: setActiveZone,
      setBottomNavVisible: setBottomNavVisible,
      destroy: destroy
    };
  }

  YHApp.createGlobalNav = createGlobalNav;
})(window.YHApp = window.YHApp || {});
