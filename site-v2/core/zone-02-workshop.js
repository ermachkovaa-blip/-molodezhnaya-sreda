// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) behavior — registered under
// shared.behavior:'zone-02-annotations'.
//
// Customer decision (2026-09-10): "не делать карточки текстом, а просто
// картинками, завтра нарисую" — every label/card is now drawn directly
// into the BASE image itself (config/scenes.js zone-02-desktop/mobile).
// Zone 02 never had any real material URLs (LINKS.RESEARCH_MATERIAL_URLS
// is all null), so there is nothing left for this behavior to render —
// it's a pure no-op, kept only so mount.js's ZONE_BEHAVIORS lookup for
// shared.behavior:'zone-02-annotations' still resolves to something.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function createZone02Behavior() {
    return { destroy: function () {}, layout: function () {}, closeAllCaptions: function () {} };
  }

  YHApp.ZONE_BEHAVIORS['zone-02-annotations'] = createZone02Behavior;
})(window.YHApp = window.YHApp || {});
