// Zone 00 (УЛИЦА / ВХОД) behavior — registered under shared.behavior:
// 'zone-00-map'. Zone 00's first-ever local interactivity in V2 (it was
// 'scene-only' before — zero interaction, see config/scenes.js history).
//
// Reuses the SAME generic createHotspotLayer as every other zone's
// hotspots (Zone 01/02/03) for BOTH the 8 navigation hotspots and the
// desktop CTA hotspot — no parallel navigation/coordinate/gesture system,
// per the confirmed Visual Integration decision. Title/number for each
// nav hotspot come from config.scenes.zones[id].shared.title, never
// duplicated in config/zone-00-content.js, so zone naming has exactly one
// source of truth (the delivered ZIP's own routes[].label used a
// different, unapproved nomenclature — not reused).
//
// '00' itself has no onActivate (it IS the current zone) — clicking it
// falls through to the layer's existing null-url branch and shows a
// small "ВЫ ЗДЕСЬ" caption, the same mechanism every other empty-url
// hotspot in the app already uses; no special-casing needed in
// hotspot-layer.js.
//
// The CTA hotspot (desktop only) sits over the BASE's baked "ПОДАТЬ
// ЗАЯВКУ" graphic — a real <a href=APPLICATION_URL> via the layer's
// existing url-branch. Not rendered on mobile: that BASE has no baked CTA
// graphic to make clickable, and the persistent GlobalNav CTA already
// covers mobile end-to-end.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone00Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var zones = config.scenes.zones;
    var navHotspots = YHApp.ZONE_00_NAV_HOTSPOTS;
    var cta = YHApp.ZONE_00_CTA;

    var navItems = navHotspots.map(function (h) {
      var zoneMeta = zones[h.id];
      var isCurrent = h.id === zone.shared.id;
      return {
        id: h.id,
        ariaLabel: h.id + ' — ' + zoneMeta.shared.title + (isCurrent ? ' (текущая зона)' : ''),
        hoverLabel: h.id + ' ' + zoneMeta.shared.title,
        onActivate: isCurrent ? null : function () { callbacks.onNavigateZone(h.id); },
        emptyMessage: isCurrent ? 'ВЫ ЗДЕСЬ' : null
      };
    });

    var items = navItems.slice();
    if (!mobile) {
      items.push({
        id: cta.id,
        ariaLabel: 'Подать заявку на хакатон',
        url: config.links.APPLICATION_URL
      });
    }

    var layer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-zone00-hotspot',
      items: items,
      isMobile: isMobile,
      getCoords: function (item, isMobileNow) {
        if (item.id === cta.id) return cta.desktopCoords;
        var h = navHotspots.filter(function (x) { return x.id === item.id; })[0];
        return isMobileNow ? h.mobileCoords : h.desktopCoords;
      }
    });
    layer.layout();

    // per-zone marker color, same --yh-zone-color custom property already
    // used by the global Map view (core/map-navigation.js) — visual
    // consistency, not a new convention.
    navHotspots.forEach(function (h) {
      var node = layer.elements[h.id];
      if (node) node.style.setProperty('--yh-zone-color', zones[h.id].shared.color);
    });
    if (layer.elements['00']) {
      layer.elements['00'].classList.add('yh-zone00-hotspot--current');
    }

    function destroy() { layer.destroy(); }
    function closeAllCaptions() { layer.hideCaption(); }

    return { destroy: destroy, layout: layer.layout, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['zone-00-map'] = createZone00Behavior;
})(window.YHApp = window.YHApp || {});
