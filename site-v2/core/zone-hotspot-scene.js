// HotspotScene behavior — ONE factory shared by Zone 02 and Zone 03
// (registered under shared.behavior:'hotspot-scene' in config/scenes.js),
// exactly as Production-ТЗ requires ("02 и 03 должны использовать ОДИН
// общий config-driven HotspotScene / hotspot-layer mechanism").
//
// This file is itself still just wiring — it contains no hotspot text,
// no URLs, no coordinates. It reads zone.shared.id to pick which zone's
// data to load (config/zone-02-content.js or zone-03-content.js) and
// which of the two centralized URL maps in config/links.js applies, then
// hands everything to the generic core/hotspot-layer.js. The only thing
// that differs structurally between 02 and 03 is which config file gets
// read — the mechanism is identical, per the "one shared component"
// requirement.
//
// layerClass is the SAME ('yh-material-hotspot') for both zones: both
// need the identical visual treatment (existing "+" already baked into
// BASE, so the hotspot itself must render invisible at rest — see
// app.css) — sharing one class here is a deliberate data/CSS choice, not
// a rule enforced by hotspot-layer.js itself (which would happily accept
// two different layerClass values if a future zone needed a different look).

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  var ZONE_DATA_SOURCES = {
    '02': function () {
      return { hotspots: YHApp.ZONE_02_HOTSPOTS, presentation: YHApp.ZONE_02_PRESENTATION, urlMapKey: 'RESEARCH_MATERIAL_URLS' };
    },
    '03': function () {
      return { hotspots: YHApp.ZONE_03_HOTSPOTS, presentation: YHApp.ZONE_03_PRESENTATION, urlMapKey: 'PROJECT_MATERIAL_URLS' };
    }
  };

  function createHotspotSceneBehavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var zoneId = zone.shared.id;
    var source = ZONE_DATA_SOURCES[zoneId];
    if (!source) return { destroy: function () {}, closeAllCaptions: function () {} };
    var data = source();
    var urlMap = (config.links && config.links[data.urlMapKey]) || {};
    var hotspots = data.hotspots;
    var presentation = data.presentation;

    var items = hotspots.map(function (h) {
      return {
        id: h.id,
        ariaLabel: h.title + (h.description ? ' — ' + h.description : ''),
        hoverLabel: presentation.hoverLabel,
        url: urlMap[h.id] || null,
        emptyMessage: presentation.emptyMessage
      };
    });

    var layer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-material-hotspot',
      items: items,
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        var h = hotspots.filter(function (x) { return x.id === item.id; })[0];
        return mobile ? h.mobileCoords : h.desktopCoords;
      }
    });
    layer.layout();

    function destroy() { layer.destroy(); }
    function closeAllCaptions() { layer.hideCaption(); }

    return { destroy: destroy, layout: layer.layout, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['hotspot-scene'] = createHotspotSceneBehavior;
})(window.YHApp = window.YHApp || {});
