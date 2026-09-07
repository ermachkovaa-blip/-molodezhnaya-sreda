// Zone 01 (ХОЛЛ) behavior — registered under shared.behavior:'object-links'
// in config/scenes.js, instantiated/torn down by mount.js on zone switch.
//
// Builds two independent layers inside .yh-scene-stage:
//   1. object hotspots (5 объектов, via the shared createHotspotLayer)
//   2. passage-to-02 spatial hotspot
//
// FAST MODE production pass (01+06+07): the old third layer (a decorative
// hover-only "program wall" highlight, 4 regions) is retired — see
// config/zone-01-content.js header for why. The new dedicated BASE bakes
// the full 5-stage program in as legible text; no HTML layer duplicates it.
//
// Explicitly NOT the V1 content-card interaction — see Production-ТЗ
// decision 05.09 п.1: старые раскрывающиеся карточки не переносятся.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone01Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var objects = config.objects || YHApp.OBJECTS;
    var passage = YHApp.ZONE_01_PASSAGE;
    var presentation = YHApp.ZONE_01_OBJECT_PRESENTATION;
    var hotspotSize = mobile ? YHApp.ZONE_01_HOTSPOT_SIZE.mobile : YHApp.ZONE_01_HOTSPOT_SIZE.desktop;

    // ---- 1. object hotspots (explicit object id — never DOM index).
    // Text (hoverLabel/emptyMessage) comes entirely from config/
    // zone-01-content.js — this file only wires objects.js data to the
    // generic hotspot-layer, it never invents presentation strings. ----
    var objectItems = objects.map(function (obj) {
      return {
        id: obj.id,
        ariaLabel: obj.number + ' ' + obj.title + ' — открыть материалы',
        hoverLabel: presentation.hoverLabel,
        url: obj.sourceMaterialsUrl,
        emptyMessage: presentation.emptyMessage
      };
    });

    var objectHotspots = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-object-hotspot',
      items: objectItems,
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        var obj = objects.filter(function (o) { return o.id === item.id; })[0];
        return mobile ? obj.mobileCoords : obj.desktopCoords;
      }
    });
    objectHotspots.layout();

    // size overrides — see config/zone-01-content.js (ZONE_01_HOTSPOT_SIZE)
    // for why the generic 44px default isn't enough on this BASE.
    objects.forEach(function (obj) {
      var node = objectHotspots.elements[obj.id];
      if (node) {
        node.style.width = hotspotSize.w + '%';
        node.style.height = hotspotSize.h + '%';
      }
    });

    // ---- 1b. FAST PASS material-link action-markers — a separate,
    // always-visible circle->pill button next to each card, additional to
    // the invisible whole-card hotspot above. Real <a> when
    // config.links[<per-object key>] exists, real disabled <button>
    // otherwise (never a fake "#" — hotspot-layer.js already guarantees
    // that split). Strict per-object mapping, no Zone 04 crossover. ----
    var materialLinksText = YHApp.ZONE_01_MATERIAL_LINKS;
    var materialButtonSize = mobile ? YHApp.ZONE_01_MATERIAL_BUTTON_SIZE.mobile : YHApp.ZONE_01_MATERIAL_BUTTON_SIZE.desktop;
    var materialButtonCoords = YHApp.ZONE_01_MATERIAL_BUTTON_COORDS;
    var materialLinkKeys = YHApp.ZONE_01_MATERIAL_LINK_KEYS;
    var linksCfg = config.links || YHApp.LINKS;

    var materialItems = objects.map(function (obj) {
      var url = linksCfg[materialLinkKeys[obj.id]] || null;
      return {
        id: obj.id,
        ariaLabel: (url ? materialLinksText.desktopLabel : materialLinksText.emptyLabelDesktop) + ' — ' + obj.number + ' ' + obj.title,
        hoverLabel: mobile
          ? (url ? materialLinksText.mobileLabel : materialLinksText.emptyLabelMobile)
          : (url ? materialLinksText.desktopLabel : materialLinksText.emptyLabelDesktop),
        url: url,
        // only reachable for the disabled (no-url) case — hotspot-layer.js
        // skips this entirely for real <a> links. Same text as hoverLabel,
        // so a click/tap echoes exactly what hover/focus already show.
        emptyMessage: mobile ? materialLinksText.emptyLabelMobile : materialLinksText.emptyLabelDesktop
      };
    });

    var materialLinks = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-material-link',
      items: materialItems,
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        var coords = materialButtonCoords[item.id];
        return mobile ? coords.mobileCoords : coords.desktopCoords;
      }
    });
    materialLinks.layout();
    objects.forEach(function (obj) {
      var node = materialLinks.elements[obj.id];
      if (node) {
        node.style.width = materialButtonSize.w + '%';
        node.style.height = materialButtonSize.h + '%';
        if (!linksCfg[materialLinkKeys[obj.id]]) {
          node.classList.add('yh-material-link__item--disabled');
        }
      }
    });

    // ---- 2. passage to 02 — spatial navigation, not a content hotspot ----
    var passageLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-passage-hotspot',
      items: [{
        id: passage.id,
        ariaLabel: passage.ariaLabel,
        hoverLabel: passage.hoverLabel,
        onActivate: function () { callbacks.onNavigateZone(passage.targetZoneId); }
      }],
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        return mobile ? passage.mobileCoords : passage.desktopCoords;
      }
    });
    passageLayer.layout();
    if (passageLayer.elements[passage.id]) {
      passageLayer.elements[passage.id].style.width = hotspotSize.w + '%';
      passageLayer.elements[passage.id].style.height = hotspotSize.h + '%';
    }

    function destroy() {
      objectHotspots.destroy();
      materialLinks.destroy();
      passageLayer.destroy();
    }

    // click/tap on empty scene background closes any open caption — same
    // mechanism used across every other zone.
    function closeAllCaptions() {
      objectHotspots.hideCaption();
      materialLinks.hideCaption();
      passageLayer.hideCaption();
    }

    return {
      destroy: destroy,
      layout: function () { objectHotspots.layout(); materialLinks.layout(); passageLayer.layout(); },
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['object-links'] = createZone01Behavior;
})(window.YHApp = window.YHApp || {});
