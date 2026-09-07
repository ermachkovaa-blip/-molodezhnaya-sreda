// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) behavior — registered under
// shared.behavior:'zone-03-annotations'.
//
// This file is now just wiring: it reads Zone 03's own data
// (config/zone-03-content.js + LINKS.PROJECT_MATERIAL_URLS) and hands it
// to the shared core/spatial-annotations.js component — the same one
// Zone 02 uses (core/zone-02-workshop.js), per "ONE SITE = ONE ANNOTATION
// LANGUAGE". See that file's header for the interaction rule (card =
// always-visible information, "+" = optional material, rendered only
// when a real URL exists) and rendering details — nothing zone-specific
// happens here beyond picking which config to read.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone03Behavior(sceneStage, zone, config, callbacks) {
    var mobile = callbacks.isMobile();
    var hotspots = YHApp.ZONE_03_HOTSPOTS;
    var urlMap = (config.links && config.links.PROJECT_MATERIAL_URLS) || {};

    var annotations = YHApp.createSpatialAnnotations(sceneStage, hotspots, urlMap, mobile, 'yh-workshop-annotation-layer--titles-only');

    function destroy() { annotations.destroy(); }
    function closeAllCaptions() {}

    return { destroy: destroy, layout: function () {}, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['zone-03-annotations'] = createZone03Behavior;
})(window.YHApp = window.YHApp || {});
