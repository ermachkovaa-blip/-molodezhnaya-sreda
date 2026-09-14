// Zone 00 (УЛИЦА / ВХОД) — declarative hotspot data for its first-ever
// local interactivity (behavior 'zone-00-map', see core/zone-00-map.js).
//
// Physical concept: a "КАРТА ХАКАТОНА" signage stand inside the Zone 00
// scene itself, distinct from the separate full-screen Map view
// (core/map-navigation.js, opened via "КАРТА ↑" / on load) — that
// existing component is NOT touched or replaced by this.
//
// number/title are NOT duplicated here — core/zone-00-map.js reads them
// directly from config/scenes.js ZONES[id].shared.title at creation time,
// so there is exactly one source of truth for zone naming (the ZIP
// package's own routes[].label used an older/different nomenclature —
// deliberately not reused, per the confirmed preflight decision).
//
// desktopCoords/mobileCoords — RECALIBRATED (customer report: "на карте
// смещены кружочки с карты, поправь чтобы они находились на самой
// карте" — the previous numbers floated to the right of the actual
// isometric diagram instead of sitting on it). Re-measured per platform
// directly off that platform's own BASE pixels: crop the diagram region,
// overlay a fine pixel grid, read off each distinct room cell's center,
// convert back to percent-of-image, then render the candidate markers
// onto the real image and visually confirm each one lands on its room
// before adopting (not eyeballed against the full scene at a glance,
// which is what produced the offset in the first place). Ordered roughly
// nearest (00, bottom) to farthest/highest (07, the top peak) — a
// readable but non-literal mapping, since the diagram is decorative
// isometric art, not a literal floor plan cross-referenced against real
// room content. Desktop against zone-00-base-clean-map-4k-sharp-v3.png,
// mobile against zone-00-mobile-base-expanded-centered-v2-2160x3840.png —
// two independent compositions, two independent calibrations, neither
// derived from the other.

(function (YHApp) {
  'use strict';

  // customer replaced the zone-00 DESKTOP background (2026-09-14, "давай
  // заменим фон на зоне 00, перепроверь только размещение кнопок на
  // карте") with a new isometric "КАРТА ХАКАТОНА" render — different room
  // shapes/positions than the old BASE, so desktopCoords below are a
  // fresh measurement against the NEW image only (mobile BASE/coords are
  // untouched — she sent one image, landscape, i.e. desktop only). Same
  // method as before: cropped the diagram, overlaid a pixel grid, read
  // off each of the 8 distinct room cells' centers, ordered nearest (00,
  // bottom of the diagram) to farthest/topmost peak room (07) — a
  // readable but non-literal mapping, the diagram is decorative isometric
  // art, not a real cross-referenced floor plan.
  YHApp.ZONE_00_NAV_HOTSPOTS = [
    { id: '00', desktopCoords: { x: 58.07, y: 74.07 }, mobileCoords: { x: 62.6, y: 62.8 } },
    { id: '01', desktopCoords: { x: 60.16, y: 68.98 }, mobileCoords: { x: 59.5, y: 63.5 } },
    { id: '02', desktopCoords: { x: 54.56, y: 67.82 }, mobileCoords: { x: 60.5, y: 62.3 } },
    { id: '03', desktopCoords: { x: 64.84, y: 62.27 }, mobileCoords: { x: 68.3, y: 60.0 } },
    { id: '04', desktopCoords: { x: 55.47, y: 59.95 }, mobileCoords: { x: 64.3, y: 61.6 } },
    { id: '05', desktopCoords: { x: 62.37, y: 59.95 }, mobileCoords: { x: 63.1, y: 61.0 } },
    { id: '06', desktopCoords: { x: 59.11, y: 55.09 }, mobileCoords: { x: 65.75, y: 58.7 } },
    { id: '07', desktopCoords: { x: 60.68, y: 48.15 }, mobileCoords: { x: 67.52, y: 56.47 } }
  ];

  // A real, transparent hotspot placed exactly over the "ПОДАТЬ ЗАЯВКУ →"
  // pill graphic baked into each platform's BASE (see preflight decision
  // №3 — the baked pill is spatial signage art and is not redrawn; only
  // the click target is made real/accessible). The earlier provisional
  // mobile BASE had no such graphic in frame at all; the new mobile BASE
  // does, so mobileCoords is now calibrated too.
  // size — the baked pill's own width/height as percent of its BASE (not
  // the generic 44x44 hotspot default): the two platforms' pill graphics
  // are proportioned differently on their own images, so one fixed
  // percentage would fit neither correctly.
  // desktopCoords/desktopSize re-measured against the NEW zone-00 desktop
  // BASE (2026-09-14 background replacement) — pixel-scanned the baked
  // green pill's own bounding box directly, not eyeballed; came out
  // almost identical to the old BASE's pill position/size by coincidence
  // (both compositions put the CTA in roughly the same spot on the left
  // panel), but measured fresh regardless rather than assumed. mobile
  // untouched (background unchanged there).
  YHApp.ZONE_00_CTA = {
    id: 'cta',
    desktopCoords: { x: 24.48, y: 65.51 },
    mobileCoords: { x: 32, y: 62.7 },
    desktopSize: { w: 10.94, h: 3.7 },
    mobileSize: { w: 14, h: 2.6 }
  };

  // FAST PASS — ZONE 00 / CODE-GENERATED SOAP BUBBLES (core/zone-00-bubbles.js).
  // Ambient, code-drawn (no raster assets) foreground/midground layer —
  // see that file for the actual DOM/animation. Every value here is a
  // *range*, randomized per instance at spawn time, not a fixed constant.
  YHApp.ZONE_00_BUBBLES = {
    count: { desktop: { min: 7, max: 10 }, mobile: { min: 4, max: 6 } },
    // px, BEFORE the scene stage's own camera-scale transform (same
    // "lives inside the scene, scales with it" treatment as every other
    // in-scene hotspot in this codebase).
    sizePx: {
      small: { min: 30, max: 55 },
      medium: { min: 60, max: 100 },
      large: { min: 110, max: 160 }
    },
    maxLargeAtOnce: 2,
    lifetimeMs: { min: 12000, max: 25000 },
    respawnDelayMs: { min: 1000, max: 4000 },
    // 3 depth levels (see spec п.7) — background bubbles are smaller,
    // drift slower/less, and are slightly lower-contrast; foreground is
    // the opposite. Expressed as multipliers/deltas applied on top of the
    // base random ranges above, not separate absolute ranges.
    depth: {
      background: { sizeMul: 0.72, driftMul: 0.7, opacityMul: 0.75, weight: 0.4 },
      midground: { sizeMul: 1, driftMul: 1, opacityMul: 1, weight: 0.45 },
      foreground: { sizeMul: 1.15, driftMul: 1.25, opacityMul: 1.15, weight: 0.15 }
    },
    // very soft, gently-varying wind: a slow rightward bias, never a
    // constant/identical push (see zone-00-bubbles.js's per-bubble drift
    // keyframe generation for the actual irregular accel/pause/veer).
    windBiasPx: { min: 10, max: 34 },
    // desktop-only air-disturbance-from-cursor (spec п.8) tuning.
    cursorInfluenceRadiusPx: 110,
    cursorPushPx: 22,
    // reduced-motion: keep this many nearly-still bubbles (still poppable).
    reducedMotionCount: 4
  };
})(window.YHApp = window.YHApp || {});
