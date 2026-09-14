// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) — no declarative hotspot data anymore.
//
// Customer decision (2026-09-10): "не делать карточки текстом, а просто
// картинками, завтра нарисую" — every label/card (ИНТЕРВЬЮ, КАРТА
// ТЕРРИТОРИИ, НАБЛЮДЕНИЯ И ЗАПРОСЫ, ФОТОФИКСАЦИЯ, etc.) is now drawn
// directly into the BASE image (config/scenes.js zone-02-desktop/mobile)
// instead of rendered as HTML annotation cards — see
// core/zone-02-workshop.js, now a no-op. Zone 02 never had any real
// material URLs (LINKS.RESEARCH_MATERIAL_URLS is all null), so there is
// no hotspot left to keep — unlike Zone 03, which kept its one real
// AI-tools document link (config/zone-03-content.js ZONE_03_AI_LINK).

(function (YHApp) {
  'use strict';
})(window.YHApp = window.YHApp || {});
