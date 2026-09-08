// Zone 05 (ГАЛЕРЕЯ / БИБЛИОТЕКА) — declarative data for behavior
// 'gallery-complex' (see core/zone-05-gallery.js). Three independent
// physical interactives per FAST MODE / STAGE 5 spec:
//   1. shelf (книжная полка / стеллаж) — real HTML hotspot → STANDARD_URL
//   2. flying pages — 10 approved pages, floating in the scene
//   3. fabric (тканевое полотно) — real HTML hotspot → RENOVATION_ARCHIVE_URL
//
// PAGE NUMBERING (preflight finding, customer-confirmed): the source
// package's own pages.json claimed page order "...79, 87" but the
// customer's task text asked for "...79, 27". Every page image was opened
// and its own printed page number read directly off the scan — "27" does
// not exist in the delivered set; the tenth page is genuinely printed
// "87" ("РАБОТА С АУДИТОРИЕЙ"). Customer confirmed by message: "допускаю
// что в документе по страницам есть ошибка в нумерации. прими те что
// прикреплены" — so this file uses 87, the verified number, not a
// fabricated 27. All 10 numbers below were independently visually
// confirmed against the actual scans, not taken from any package's own
// metadata on trust.
//
// SHELF ASSET NOTE: the delivered "шкаф" package is 8 rotation frames of
// a round 9-section bookshelf carousel. Customer follow-up ("давай
// вернемся к зоне библиотеки... хочу чтобы базовой была картинка где
// розовая книга смотрит на меня фронтально, при наведении курсора шкаф
// немного поворачивается туда сюда... и можно было повернуть его по
// часовой стрелке вокруг своей оси на 180 градусов") now wires up all 8
// frames as a real rotation:
//   - rot-0 (frontal, "СТАНДАРТ ДЕЯТЕЛЬНОСТИ" pink book centered) is the
//     resting/base frame.
//   - rot-1..rot-4 show the book rotating away (progressively less of its
//     cover visible — verified by directly measuring the pink-cover pixel
//     area in each source frame, not eyeballed) — used for the hover
//     wobble (rot-0<->rot-1, a small nudge) and as the first half of the
//     click-triggered 180° turn.
//   - rot-5..rot-7: the book is fully hidden (rotated to the far side).
//     The customer's own source PNGs don't carry an angle label, and she
//     confirmed by message these are "для тебя, чтобы выстроить плавный
//     поворот" (for you, to build a smooth rotation) — i.e. exact degree
//     mapping is delegated. rot-5..7 order was chosen by image-similarity
//     chaining from rot-4 (nearest-neighbour on pixel diff), landing on
//     rot-7 as the "180°/back" resting frame — a reasonable, smooth
//     sequence, not a verified physical measurement.

(function (YHApp) {
  'use strict';

  var ASSETS_BASE = '../../assets/scenes/';

  // ---- 1. shelf ----
  // desktop/mobile: {left,top,width,height} percent box the shelf PNG is
  // placed in (object-fit:contain, so the image's own aspect ratio is
  // preserved — never stretched) — centered over the floor medallion
  // visible in the BASE where the physical object stands. hotspotCoords —
  // center point of the real clickable region (a generous box covering the
  // shelf's own footprint, not just its exact silhouette).
  YHApp.ZONE_05_SHELF = {
    asset: { src: ASSETS_BASE + 'zone-05-shelf-rot-0.png', w: 1672, h: 941 },
    desktop: { left: 26, top: -2, width: 40, height: 84 },
    mobile: { left: -14.5, top: 38, width: 119, height: 41 },
    hotspotDesktopCoords: { x: 46, y: 50 },
    hotspotDesktopSize: { w: 20, h: 55 },
    hotspotMobileCoords: { x: 45, y: 60.6 },
    hotspotMobileSize: { w: 28, h: 36 }
  };

  // 8-frame rotation set (see header note above for provenance/ordering).
  // index 0 = resting/frontal frame (must match ZONE_05_SHELF.asset
  // above), index 7 = the 180°/"back" resting frame reached by a full
  // click-rotate. All 8 share the same 1672x941 canvas/crop, so swapping
  // between them never shifts the object's on-screen position.
  YHApp.ZONE_05_SHELF_ROTATION = {
    frames: [
      { src: ASSETS_BASE + 'zone-05-shelf-rot-0.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-1.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-2.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-3.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-4.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-5.png', w: 1671, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-6.png', w: 1672, h: 941 },
      { src: ASSETS_BASE + 'zone-05-shelf-rot-7.png', w: 1672, h: 941 }
    ],
    hoverWobbleFrame: 1, // small "туда-сюда" nudge on hover, desktop only
    hoverWobbleIntervalMs: 420,
    turnFrameIntervalMs: 90, // per-frame timing for the full click-rotate
    tooltipText: 'ПОКРУТИ ШКАФ'
  };

  // ---- 2. flying pages ----
  // Order + x/y/depth/rotation reused from the source package's own
  // pages.json choreography (not re-invented) — only the 10th entry's
  // number/alt was corrected from the package's own "87" claim... which,
  // after verification, turned out to be the CORRECT one (see header:
  // the task text's "27" was the actual typo, not this file).
  // depth: 0 = nearest/largest, 2 = farthest/smallest (3 levels per spec).
  // y-values shifted well clear of both the fixed header (~7% of
  // viewport, maps to roughly image-y 11.5-17.7% at the default
  // cameraPreset) and the bottom nav bar — found as a REAL bug: a page
  // placed at pages.json's own y:6-15 rendered underneath the header at
  // the default camera, silently eating its own hover/click (Playwright
  // caught this directly: elementFromPoint returned .yh-header, not the
  // page button, and this is exactly what a real cursor would hit too).
  //
  // mobileX/mobileY: the mobile scene is a DIFFERENT (portrait) image and
  // composition than desktop, at its own cameraPreset (see scenes.js) — a
  // shared x/y is not safe to assume across both. Verified via an
  // elementFromPoint scan at 390x844: with the desktop x/y reused as-is,
  // 6 of 10 pages landed fully off-screen and a 7th sat under the fixed
  // header/CTA — all real, all confirmed by the scan, none guessed. These
  // mobile-only coordinates were computed from the actual measured safe
  // window at this breakpoint (image-x 15.7-74.3%, image-y 24.3-95.7%,
  // header bottom at image-y ~29.7%, bottom-nav top at image-y ~89.1%),
  // with margin, and keep each page's original depth/rotation.
  YHApp.ZONE_05_PAGES = [
    { id: 'page-16', number: 16, src: ASSETS_BASE + 'zone-05-page-16.jpg', w: 978, h: 1428, alt: 'Страница 16 — «Третье место» для молодежи', depth: 0, x: 8, y: 26, mobileX: 25, mobileY: 38, rotation: -4 },
    { id: 'page-36', number: 36, src: ASSETS_BASE + 'zone-05-page-36.jpg', w: 1068, h: 1651, alt: 'Страница 36 — Целевая аудитория молодежного центра', depth: 1, x: 30, y: 21, mobileX: 55, mobileY: 35, rotation: 3 },
    { id: 'page-28', number: 28, src: ASSETS_BASE + 'zone-05-page-28.jpg', w: 1135, h: 1690, alt: 'Страница 28 — Карта социальной инфраструктуры', depth: 2, x: 56, y: 27, mobileX: 40, mobileY: 44, rotation: -2 },
    { id: 'page-44', number: 44, src: ASSETS_BASE + 'zone-05-page-44.jpg', w: 1082, h: 1618, alt: 'Страница 44 — Портрет целевой аудитории', depth: 0, x: 74, y: 22, mobileX: 62, mobileY: 48, rotation: 5 },
    { id: 'page-49', number: 49, src: ASSETS_BASE + 'zone-05-page-49.jpg', w: 1048, h: 1535, alt: 'Страница 49 — Проведение общественных обсуждений', depth: 1, x: 14, y: 46, mobileX: 22, mobileY: 55, rotation: 2 },
    { id: 'page-62', number: 62, src: ASSETS_BASE + 'zone-05-page-62.jpg', w: 1026, h: 1498, alt: 'Страница 62 — Гипотеза и программирование', depth: 2, x: 38, y: 42, mobileX: 48, mobileY: 58, rotation: -5 },
    { id: 'page-74', number: 74, src: ASSETS_BASE + 'zone-05-page-74.jpg', w: 1010, h: 1532, alt: 'Страница 74 — Инкубатор социальных проектов', depth: 0, x: 62, y: 55, mobileX: 30, mobileY: 66, rotation: 4 },
    { id: 'page-88', number: 88, src: ASSETS_BASE + 'zone-05-page-88.jpg', w: 889, h: 1358, alt: 'Страница 88 — Кейсы программной работы', depth: 1, x: 80, y: 48, mobileX: 58, mobileY: 70, rotation: -3 },
    { id: 'page-79', number: 79, src: ASSETS_BASE + 'zone-05-page-79.jpg', w: 1020, h: 1448, alt: 'Страница 79 — Центр психолого-педагогической службы', depth: 2, x: 26, y: 74, mobileX: 42, mobileY: 78, rotation: 5 },
    { id: 'page-87', number: 87, src: ASSETS_BASE + 'zone-05-page-87.jpg', w: 995, h: 1450, alt: 'Страница 87 — Работа с аудиторией', depth: 1, x: 59, y: 76, mobileX: 65, mobileY: 82, rotation: -4 }
  ];

  // ---- 3. fabric banner ----
  YHApp.ZONE_05_FABRIC = {
    // -cropped variant: the delivered asset included a visible hanging rod
    // + dark end-caps at its top edge (real, confirmed by pixel-scanning
    // the alpha channel — dark endcap pixels present through y=140/2172
    // ≈6.45%, clean cloth from ~148px on) which read as a stray floating
    // stick once positioned top-anchored in-scene with no matching rod
    // asset elsewhere. Cropped the rod/cables off entirely rather than
    // trying to hide it with CSS clipping (which would need re-deriving
    // per breakpoint since object-fit:contain leftover space differs by
    // box aspect) — new native size 724x2024.
    asset: { src: ASSETS_BASE + 'zone-05-fabric-banner-cropped.png', w: 724, h: 2024 },
    desktop: { left: 58, top: 3, width: 17, height: 70 },
    mobile: { left: 60, top: 20, width: 20, height: 44 },
    hotspotDesktopCoords: { x: 66.5, y: 34 },
    hotspotDesktopSize: { w: 17, h: 64 },
    hotspotMobileCoords: { x: 70, y: 40 },
    hotspotMobileSize: { w: 20, h: 40 }
  };

  // presentation strings — same "no fallback text invented inside the
  // generic layer" principle used throughout (see Zone 01/04 content
  // files). Both fallback strings match the format already established
  // for Zone 04's null archiveFolderUrl.
  YHApp.ZONE_05_PRESENTATION = {
    // shelfHoverLabel/shelfEmptyMessage: currently unused — the shelf's
    // click now rotates it (ZONE_05_SHELF_ROTATION, wired in
    // zone-05-gallery.js) instead of opening STANDARD_URL through the
    // generic hotspot-layer caption. Kept, not deleted, in case a
    // separate "open Стандарт" affordance comes back once a real URL
    // exists (see that file's header note on this trade-off).
    shelfHoverLabel: 'ОТКРЫТЬ СТАНДАРТ →',
    shelfEmptyMessage: 'МАТЕРИАЛ БУДЕТ ДОБАВЛЕН',
    fabricHoverLabel: 'ПЕРЕЙТИ ↗',
    fabricEmptyMessage: 'АРХИВ БУДЕТ ДОБАВЛЕН',
    readerCloseLabel: 'Закрыть'
  };
})(window.YHApp = window.YHApp || {});
