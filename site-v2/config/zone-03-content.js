// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) — one real hotspot.
//
// Customer decision (2026-09-10): "не делать карточки текстом, а просто
// картинками, завтра нарисую" — every label/card (ФУНКЦИОНАЛЬНОЕ
// ЗОНИРОВАНИЕ, СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ, etc.) is now drawn directly into
// the BASE image (config/scenes.js zone-03-desktop/mobile) instead of
// rendered as HTML annotation cards — see core/zone-03-workshop.js. The
// only thing that still needs a real DOM hotspot is the "AI-ИНСТРУМЕНТЫ"
// item's document link (LINKS.PROJECT_MATERIAL_URLS.laptop) — "+" only
// ever means "there is something to open", and this is the one card
// that has real material behind it. Every other former hotspot
// (plan/tracing-paper/model/schemes/materials) had no URL and is now
// just part of the picture.
//
// Coordinates measured directly against the new BASE images (the laptop
// object's own on-screen position, not the old card position) — see
// core/zone-03-workshop.js for how this is used.

(function (YHApp) {
  'use strict';

  // SECOND background replacement (2026-09-14): customer sent new zone-03
  // artwork and asked to reposition the "+" per the new layout. Re-measured
  // from scratch directly against the new images (pixel-scanned the card's
  // white background + the title text's own dark pixels, not eyeballed):
  // desktop title "AI-ИНСТРУМЕНТЫ" text spans x 842-1117px / y 1328-1354px
  // of the raw (unpadded) 3840x2160 art, card's own right border at
  // x~1220px; mobile title spans x 190-464px / y 2376-2402px of the raw
  // (unpadded) 2161x3840 art, card's right border at x~567px. Button
  // placed between the title's right edge and the card's own border,
  // vertically centered on the title, then converted to percent and
  // shifted down for each image's own top-padding added in
  // config/scenes.js (desktop +160px into a 2480-tall image, mobile
  // +564px into a 4968-tall image) — x untouched since only height was
  // padded.
  YHApp.ZONE_03_AI_LINK = {
    id: 'ai-tools',
    desktopCoords: { x: 30.2, y: 60.52 },
    mobileCoords: { x: 23.1, y: 59.44 }
  };
})(window.YHApp = window.YHApp || {});
