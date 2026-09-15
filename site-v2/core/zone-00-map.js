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
// The CTA hotspot sits over each platform's BASE's baked "ПОДАТЬ ЗАЯВКУ"
// graphic — a real <a href=APPLICATION_URL> via the layer's existing
// url-branch. Rendered on both platforms since the final mobile BASE
// (post-recalibration) bakes in the same CTA graphic as desktop.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone00Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
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
        // название + описание прямо на карте при наведении на кружочек
        // (customer: "прям на карте при наведении на кружочек высвечивается
        // название и описание") — same navDescription already used
        // elsewhere (previously also shown in the bottom nav; removed
        // there per her follow-up, this is now its only surface).
        labelText: zoneMeta.shared.navDescription || null,
        onActivate: isCurrent ? null : function () { callbacks.onNavigateZone(h.id); },
        emptyMessage: isCurrent ? 'ВЫ ЗДЕСЬ' : null
      };
    });

    var items = navItems.concat([{
      id: cta.id,
      ariaLabel: 'Подать заявку на хакатон',
      url: config.links.APPLICATION_URL
    }]);

    var layer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-zone00-hotspot',
      items: items,
      isMobile: isMobile,
      // customer (2026-09-14, follow-up 2026-09-15): the title+description
      // label was shrinking along with the map illustration's own camera
      // zoom, unreadable at real viewport sizes. First pass only
      // counter-scaled the label; the dot/touch-target itself had the
      // exact same problem ("на карте... невозможно выбрать точку") — on
      // mobile the 44px CSS touch target was rendering at ~13px. Now
      // counter-scales the WHOLE item (dot + label together) — see
      // core/hotspot-layer.js for why counterScaleLabel is NOT also set
      // here (would double-scale the label).
      counterScaleItem: true,
      getCoords: function (item, isMobileNow) {
        if (item.id === cta.id) return isMobileNow ? cta.mobileCoords : cta.desktopCoords;
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

    // the baked CTA pill has different proportions on each platform's own
    // BASE — sized here from config rather than a single fixed CSS
    // percentage (see config/zone-00-content.js ZONE_00_CTA comment).
    var ctaNode = layer.elements[cta.id];
    if (ctaNode) {
      var ctaSize = isMobile() ? cta.mobileSize : cta.desktopSize;
      ctaNode.style.width = ctaSize.w + '%';
      ctaNode.style.height = ctaSize.h + '%';
    }

    // FAST PASS — code-generated ambient soap bubbles (see core/
    // zone-00-bubbles.js). Appended AFTER the hotspot layer so it sits
    // later in DOM order, but its own z-index still keeps it below
    // --yh-z-local regardless — belt and suspenders, hotspots must never
    // be visually or interactively blocked by a bubble.
    var bubbles = YHApp.createZone00Bubbles(sceneStage, YHApp.ZONE_00_BUBBLES, isMobile);

    function destroy() { layer.destroy(); bubbles.destroy(); }
    function closeAllCaptions() { layer.hideCaption(); }

    return { destroy: destroy, layout: layer.layout, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['zone-00-map'] = createZone00Behavior;
})(window.YHApp = window.YHApp || {});
