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

    // ---- top content nav — a SECOND, independent nav system (content
    // sections, not the spatial zone route). Reuses the exact same
    // onZoneSelect callback the bottom nav calls: each item just jumps to
    // the zone that owns that content, no new navigation mechanism, no
    // second camera/state model. Desktop: inline row. Mobile: collapses
    // behind a toggle so it doesn't crowd the CTA/КАРТА ↑, which always
    // stay visible per spec. ----
    var topNavItems = YHApp.TOP_NAV_ITEMS || [];
    var contentNav = el('nav', 'yh-header__content-nav', { 'aria-label': 'Разделы проекта' });
    var contentNavToggle = el('button', 'yh-header__content-nav-toggle', { type: 'button', 'aria-expanded': 'false' });
    contentNavToggle.textContent = strings.topNavMenuLabel;
    var contentNavList = el('ul', 'yh-header__content-nav-list');
    topNavItems.forEach(function (item) {
      var li = el('li');
      var link = el('a', 'yh-header__content-nav-link', { href: '#' });
      link.textContent = item.label;
      link.addEventListener('click', function (e) {
        e.preventDefault();
        closeContentNav();
        onZoneSelect(item.zoneId);
      });
      li.appendChild(link);
      contentNavList.appendChild(li);
    });
    function closeContentNav() {
      contentNav.classList.remove('is-open');
      contentNavToggle.setAttribute('aria-expanded', 'false');
    }
    contentNavToggle.addEventListener('click', function () {
      var open = contentNav.classList.toggle('is-open');
      contentNavToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    contentNav.appendChild(contentNavToggle);
    contentNav.appendChild(contentNavList);
    header.appendChild(contentNav);

    function onDocumentPointerDown(e) {
      if (!contentNav.contains(e.target)) closeContentNav();
    }
    document.addEventListener('pointerdown', onDocumentPointerDown);

    var actions = el('div', 'yh-header__actions');
    // customer (2026-09-21): "чтобы я могла отдельно отправлять ссылку
    // только на форму" — apply.html was always its own standalone page,
    // but opening it from inside the embedded scene navigated the SAME
    // iframe, so it read as "just a form glued to the site" rather than
    // a separate page. target=_blank makes that separateness visible.
    var ctaLink = el('a', 'yh-cta', { href: links.APPLICATION_URL || '#', target: '_blank', rel: 'noopener' });
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
    var hereLabels = {};
    zoneOrder.forEach(function (zoneId) {
      var zone = zones[zoneId];
      var btn = el('button', 'yh-bottom-nav__item', { type: 'button', 'data-zone': zoneId });
      btn.style.setProperty('--yh-zone-color', zone.shared.color);
      var num = el('span', 'yh-bottom-nav__num');
      num.textContent = zoneId;
      var title = el('span', 'yh-bottom-nav__title');
      title.textContent = zone.shared.title;
      btn.appendChild(num);
      btn.appendChild(title);
      // per-zone description text lives only in the Zone 00 map's own
      // hover callout now (core/zone-00-map.js labelText) — the customer
      // asked for it there instead, not duplicated onto every bottom-nav
      // button (see her follow-up message removing it from here).
      // "ТЫ ЗДЕСЬ" — shown only on the active zone's own button (see
      // setActiveZone below), not baked into every button's aria-label to
      // avoid a stale "ты здесь" being read out on zones the user isn't on.
      var here = el('span', 'yh-bottom-nav__here');
      here.textContent = strings.bottomNavHereLabel;
      here.hidden = true;
      btn.appendChild(here);
      hereLabels[zoneId] = here;
      btn.addEventListener('click', function () { onZoneSelect(zoneId); });
      rail.appendChild(btn);
      itemButtons[zoneId] = btn;
    });

    bottomNav.appendChild(rail);
    root.appendChild(bottomNav);

    function setActiveZone(zoneId) {
      zoneOrder.forEach(function (id) {
        var isActive = id === zoneId;
        itemButtons[id].classList.toggle('is-active', isActive);
        itemButtons[id].setAttribute('aria-current', isActive ? 'true' : 'false');
        hereLabels[id].hidden = !isActive;
      });
    }

    function setBottomNavVisible(visible) {
      bottomNav.hidden = !visible;
    }

    // Defensive belt-and-suspenders for the mobile nav collapse: the CSS
    // @media(max-width:767px) rule alone kept reportedly failing to
    // collapse the top nav for the customer even though it verified
    // correct here every time it was tested — the most plausible
    // explanation is a divergence between window.innerWidth (what the
    // media query sees) and the ROOT CONTAINER's own contentRect width
    // (what mount.js's isMobile() actually measures, via ResizeObserver
    // — see that file's header comment on why it's container-based, not
    // window-based). Driving the collapse from that SAME isMobile() truth
    // — the one that already decides which scene image (mobile/desktop)
    // renders — guarantees the nav agrees with the scene no matter what
    // the viewport-vs-container relationship is in a given host page.
    function setMobile(mobile) {
      contentNav.classList.toggle('yh-header__content-nav--mobile', mobile);
      header.classList.toggle('yh-header--mobile', mobile);
    }

    function destroy() {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
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
      setMobile: setMobile,
      destroy: destroy
    };
  }

  YHApp.createGlobalNav = createGlobalNav;
})(window.YHApp = window.YHApp || {});
