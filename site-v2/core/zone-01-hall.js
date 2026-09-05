// Zone 01 (ХОЛЛ) behavior — registered under shared.behavior:'object-links'
// in config/scenes.js, instantiated/torn down by mount.js on zone switch.
//
// Builds three independent layers inside .yh-scene-stage:
//   1. object hotspots (5 объектов, via the shared createHotspotLayer)
//   2. program wall hover-only highlights (4 пункта, см. config/zone-01-content.js)
//   3. passage-to-02 spatial hotspot
//
// Explicitly NOT the V1 content-card interaction — see Production-ТЗ
// decision 05.09 п.1: старые раскрывающиеся карточки не переносятся.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone01Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var objects = config.objects || YHApp.OBJECTS;
    var programStages = YHApp.ZONE_01_PROGRAM_STAGES;
    var passage = YHApp.ZONE_01_PASSAGE;
    var presentation = YHApp.ZONE_01_OBJECT_PRESENTATION;

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

    // ---- 2. program wall — hover-only, no click, no keyboard focus
    // (a focusable element with no action is a known a11y anti-pattern —
    // see Этап 2 report "known issues" for the reasoning) ----
    var programLayer = el('div', 'yh-program-wall');
    sceneStage.appendChild(programLayer);
    programStages.forEach(function (stage) {
      var region = el('div', 'yh-program-wall__stage', { 'aria-hidden': 'true' });
      region.style.left = stage.coords.x + '%';
      region.style.top = stage.coords.y + '%';
      programLayer.appendChild(region);
    });

    // ---- 3. passage to 02 — spatial navigation, not a content hotspot ----
    var passageLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-passage-hotspot',
      items: [{
        id: passage.id,
        ariaLabel: passage.ariaLabel,
        hoverLabel: passage.hoverLabel,
        onActivate: function () { callbacks.onNavigateZone(passage.targetZoneId); }
      }],
      isMobile: isMobile,
      getCoords: function () { return passage.coords; }
    });
    passageLayer.layout();

    function destroy() {
      objectHotspots.destroy();
      passageLayer.destroy();
      programLayer.remove();
    }

    // retrofitted alongside Zone 02/03 (Этап 3): click/tap on empty scene
    // background closes any open caption — same mechanism, applied here
    // too for consistency rather than only in the newer zones.
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
