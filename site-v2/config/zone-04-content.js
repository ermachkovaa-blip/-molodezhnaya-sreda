// Zone 04 (АРХИВ / КАРТОТЕКА) — declarative data for behavior
// 'archive-drawers' (see core/zone-04-archive.js). 5 explicit-id drawers,
// one per real object — number/title/archiveFolderUrl are NOT duplicated
// here, they come from YHApp.OBJECTS at open-time (same "one entity, two
// url fields" decision already recorded in config/objects.js: Zone 01 uses
// sourceMaterialsUrl, Zone 04 uses archiveFolderUrl, both on the same
// object record).
//
// desktopCoords/mobileCoords position the CLICKABLE hotspot over each
// closed drawer's own front plate on the BASE (assets/scenes/
// zone-04-desktop-base-closed-4k.png / zone-04-mobile-base-closed-*.png) —
// starting values only, per the accepted preflight numbers; subject to
// ?debug=1 visual verification, not re-derived from scratch.
//
// openAsset — ONE image per drawer, shared by BOTH platforms (customer
// decision, see Zone 04 lightbox redesign): the "open" state is no longer
// a full-canvas overlay composited into the scene per platform — it's a
// single reference photo shown large in a darkened/blurred lightbox
// (core/zone-04-archive.js), scaled to fit whichever viewport. Same source
// image, same file, both platforms — that's WHY there's only one field
// here now, not desktop/mobile. null where no usable asset exists yet
// (degrades to caption-only, same fallback spirit as a null
// archiveFolderUrl — see 'bugulma' below, still pending a corrected asset).
//
// IMPORTANT — asset identity: the open drawer's OWN number+name plate is
// the one still mounted on its own tilted-forward front panel (same plane
// as the visible drawer interior), not a plate on a neighboring
// still-closed drawer — confirmed against every file this session,
// including two the customer corrected.
//
// 'stolbishche' still carries a raster typo ("СТОЛБИЩИ" baked into the
// image instead of "СТОЛБИЩЕ") — known, not fixed here (never touch the
// raster, never cover it with HTML per customer instruction), pending a
// corrected replacement asset. This is about the LIGHTBOX (openAsset)
// only — the code-only hover/peek below never touches that raster at all.
//
// peekBoxCoords/peekBoxSize — desktop hover/peek geometry (see
// core/zone-04-archive.js). CODE-ONLY per customer instruction ("давай
// попробуем сделать не этими png а с помощью кода этот эффект" — the
// separate peek/mask PNGs kept fighting: wrong scale, one row too high,
// duplicated labels). No image asset here at all any more: the hover
// fragment is a CSS background-crop of that SAME row's own patch of
// zone-04-desktop-base-closed-4k.png, nudged forward — since it's
// pixel-identical to what's already there, there is no separate asset to
// mis-scale or misalign, and nothing to duplicate. Coordinates are the
// row's own drawer-face box (left/top/w/h, percent of the 3840x2160 BASE),
// measured directly off that file's pixels — same boxes already verified
// for the (now removed) occlusion-mask crops.

(function (YHApp) {
  'use strict';

  var ASSETS_BASE = '../../assets/scenes/';

  YHApp.ZONE_04_DRAWERS = [
    {
      id: 'bugulma',
      desktopCoords: { x: 45.5, y: 39.5 },
      mobileCoords: { x: 48.5, y: 40 },
      // NOTE: this source render's own physically-open drawer (per the
      // "-" knob tell used for every other file this session) is actually
      // 02/ЕЛАБУГА, not 01 — the "01 БУГУЛЬМА" plate is visible on the
      // closed drawer above it. Flagged twice; customer reviewed and
      // explicitly chose to use it for 'bugulma' anyway.
      openAsset: { src: ASSETS_BASE + 'zone-04-open-bugulma-4k.png', w: 3840, h: 2160 },
      peekBoxCoords: { left: 39.505, top: 36.019 },
      peekBoxSize: { w: 12.5, h: 6.25 }
    },
    {
      id: 'elabuga',
      desktopCoords: { x: 45.5, y: 47 },
      mobileCoords: { x: 48.5, y: 44.5 },
      openAsset: { src: ASSETS_BASE + 'zone-04-open-elabuga-4k.png', w: 3840, h: 2160 },
      peekBoxCoords: { left: 39.505, top: 43.009 },
      peekBoxSize: { w: 12.5, h: 6.343 }
    },
    {
      id: 'shemordan',
      desktopCoords: { x: 45.5, y: 54 },
      mobileCoords: { x: 48.5, y: 48.5 },
      openAsset: { src: ASSETS_BASE + 'zone-04-open-shemordan-4k.png', w: 3840, h: 2160 },
      peekBoxCoords: { left: 39.505, top: 49.491 },
      peekBoxSize: { w: 12.5, h: 6.528 }
    },
    {
      id: 'laishevo',
      desktopCoords: { x: 45.5, y: 61.5 },
      mobileCoords: { x: 48.5, y: 52.5 },
      openAsset: { src: ASSETS_BASE + 'zone-04-open-laishevo-4k.png', w: 3840, h: 2160 },
      peekBoxCoords: { left: 39.505, top: 56.481 },
      peekBoxSize: { w: 12.5, h: 6.620 }
    },
    {
      id: 'stolbishche',
      desktopCoords: { x: 45.5, y: 69.5 },
      mobileCoords: { x: 48.5, y: 56.5 },
      openAsset: { src: ASSETS_BASE + 'zone-04-open-stolbishche-4k.png', w: 3840, h: 2160 },
      peekBoxCoords: { left: 39.505, top: 63.935 },
      peekBoxSize: { w: 12.5, h: 6.713 }
    }
  ];

  // the BASE this drawer-face fragment crops from — same file already used
  // as the desktop closed scene image (config/scenes.js 'zone-04-desktop').
  YHApp.ZONE_04_PEEK_BASE = { src: ASSETS_BASE + 'zone-04-desktop-base-closed-4k.png', w: 3840, h: 2160 };

  // presentation strings — same "no fallback text invented inside the
  // generic layer" principle as Zone 01 (config/zone-01-content.js
  // ZONE_01_OBJECT_PRESENTATION): callers of createHotspotLayer always
  // supply their own copy, this file is that copy for Zone 04.
  YHApp.ZONE_04_PRESENTATION = {
    linkLabel: 'ОТКРЫТЬ ПАПКУ АРХИВА →',
    emptyMessage: 'МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ',
    closeLabel: 'Закрыть',
    // cursor-following hover hint (desktop only, see core/zone-04-archive.js)
    hoverHint: 'ОТКРОЙ'
  };
})(window.YHApp = window.YHApp || {});
