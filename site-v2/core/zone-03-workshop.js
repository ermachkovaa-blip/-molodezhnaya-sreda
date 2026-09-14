// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) behavior — registered under
// shared.behavior:'zone-03-annotations'.
//
// Customer decision (2026-09-10): "не делать карточки текстом, а просто
// картинками, завтра нарисую" — every label/card is now drawn directly
// into the BASE image (config/scenes.js zone-03-desktop/mobile). This
// used to hand all six hotspots to core/spatial-annotations.js; now only
// the one item with a real document behind it (AI-ИНСТРУМЕНТЫ) gets a
// hotspot at all — reusing the generic createHotspotLayer mechanism, not
// spatial-annotations.js's heavier badge/card/connector machinery, since
// this is a lone "+".
// customer follow-up: "кнопку открыть материалы сделать физической (прям
// плюсик), разместить её на карточке справа от заголовка, сделать
// постоянно видимой" — a real always-visible blue "+" circle (own
// yh-ai-link-hotspot__* CSS, same visual language as the annotation
// cards' own "+" — see app.css), sitting ON the baked-in card itself,
// right of its title, not a subtle hover-only dot on the laptop anymore.
// "+" still only ever means "there is something to open".

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone03Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var link = YHApp.ZONE_03_AI_LINK;
    var url = (config.links && config.links.PROJECT_MATERIAL_URLS && config.links.PROJECT_MATERIAL_URLS.laptop) || null;

    var hotspotLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-ai-link-hotspot',
      items: [{
        id: link.id,
        ariaLabel: 'AI-инструменты — открыть материал',
        url: url
      }],
      isMobile: isMobile,
      getCoords: function (item, mob) {
        return mob ? link.mobileCoords : link.desktopCoords;
      }
    });
    hotspotLayer.layout();

    function destroy() { hotspotLayer.destroy(); }
    function closeAllCaptions() { hotspotLayer.hideCaption(); }

    return { destroy: destroy, layout: hotspotLayer.layout, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['zone-03-annotations'] = createZone03Behavior;
})(window.YHApp = window.YHApp || {});
