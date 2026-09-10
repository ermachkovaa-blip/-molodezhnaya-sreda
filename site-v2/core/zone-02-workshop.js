// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) behavior — registered under
// shared.behavior:'zone-02-annotations'.
//
// Rebuilt to reuse the exact same annotation system Zone 03 uses
// (core/spatial-annotations.js) — same blue accent, badge, card, "+",
// connector, typography, interaction rules — per the customer spec "ONE
// SITE = ONE ANNOTATION LANGUAGE". This REPLACES Zone 02's earlier
// behavior ('hotspot-scene', core/zone-hotspot-scene.js — now unused by
// any zone, left in place rather than deleted since removing it wasn't
// asked for) which rendered a differently-themed (pink/gold-tinted)
// callout system inherited from Zone 02's own older reference mockup.
// That old pink treatment is explicitly retired here — "не копировать
// розовый цвет из старого Zone 02 reference. Розовый НЕ является
// обязательным."
//
// This file is just wiring, same as Zone 03's: reads Zone 02's own data
// (config/zone-02-content.js + LINKS.RESEARCH_MATERIAL_URLS) and hands it
// to the shared component. See core/spatial-annotations.js for the
// interaction rule and rendering details.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone02Behavior(sceneStage, zone, config, callbacks) {
    var mobile = callbacks.isMobile();
    var hotspots = YHApp.ZONE_02_HOTSPOTS;
    var urlMap = (config.links && config.links.RESEARCH_MATERIAL_URLS) || {};

    // Mobile now also opts into titles-only (originally a Zone 03-only
    // rule; customer's earlier instruction for Zone 02 was the opposite —
    // "do not hide the description on mobile" — but with 5 cards' sizes
    // now correct (see the resolution-independence fix in
    // core/spatial-annotations.js), full descriptions on 5 simultaneous
    // cards simply don't fit a phone screen without overlap. Customer
    // chose "titles only, like Zone 03" over a single tall scrolling
    // column or leaving the overlap as-is.
    var annotations = YHApp.createSpatialAnnotations(sceneStage, hotspots, urlMap, mobile, mobile ? 'yh-workshop-annotation-layer--titles-only' : null);

    function destroy() { annotations.destroy(); }
    function closeAllCaptions() {}

    return { destroy: destroy, layout: function () {}, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['zone-02-annotations'] = createZone02Behavior;
})(window.YHApp = window.YHApp || {});
