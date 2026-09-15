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
      // customer (2026-09-14): "ОТКРЫТЬ МАТЕРИАЛЫ" was shrinking along
      // with the BASE image's own camera zoom, unreadable at real
      // viewport sizes — keep the label a constant legible size
      // regardless of zoom.
      counterScaleLabel: true,
      // customer follow-up (2026-09-15): "в зоне 01 тоже следует
      // увеличить в мобильной версии размеры кружочков чтобы было
      // понятно куда тыкать" — measured the dot at ~2.5px on a real
      // phone (~4.8px on desktop too), same shrink-with-zoom bug as the
      // label above. Reverses the earlier "dot scales WITH the scene"
      // decision recorded here — that convention didn't survive contact
      // with a real device. The invisible tap AREA (percent-of-card
      // sized, see ZONE_01_HOTSPOT_SIZE) is untouched and already a
      // reasonable size — only the visible dot graphic itself needed
      // this.
      counterScaleDot: true,
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

    // customer (2026-09-10): "на одной из кнопок напиши прям текстом
    // ОТКРЫТЬ МАТЕРИАЛЫ, чтобы было понятно что на них можно нажать" — the
    // label is hover/focus-revealed for all 5 (see app.css
    // .yh-object-hotspot__label), which on a touchscreen never shows at
    // all, giving no hint any of the 5 boards are tappable. Only the
    // first one is made permanently visible, as that hint — not all 5,
    // exactly as asked.
    var firstHotspotNode = objects[0] && objectHotspots.elements[objects[0].id];
    if (firstHotspotNode) firstHotspotNode.classList.add('yh-object-hotspot__item--always-visible');

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
      passageLayer.destroy();
    }

    // click/tap on empty scene background closes any open caption — same
    // mechanism used across every other zone.
    function closeAllCaptions() {
      objectHotspots.hideCaption();
      passageLayer.hideCaption();
    }

    return {
      destroy: destroy,
      layout: function () { objectHotspots.layout(); passageLayer.layout(); },
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['object-links'] = createZone01Behavior;
})(window.YHApp = window.YHApp || {});
