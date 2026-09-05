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
// desktopCoords — calibrated against the isometric building diagram baked
// into zone-00-base-clean-map-4k-sharp-v3.png (percentage grid + ?debug=1
// verification, see report). Each of the 8 numbers was placed on a
// distinct visible "room" cell of that diagram, ordered roughly nearest
// (00, bottom) to farthest/highest (07, the top peak) — a readable but
// non-literal mapping, since the diagram is decorative isometric art, not
// a literal floor plan cross-referenced against real room content.
//
// mobileCoords — zone-00-mobile-base-clean-4k.png contains NO map stand
// at all (verified: clean architecture + banners + people only, see
// report "known limitation"). There is therefore no physical object to
// calibrate against on mobile; these coordinates are an independent
// free-floating wayfinding arrangement along the scene's open
// pavement/sky areas (bottom-left "00, you are here" ascending toward
// the skyline near the top-right), avoiding the pedestrian crowd on the
// entrance stairs. Not derived from desktopCoords, not a formula.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_00_NAV_HOTSPOTS = [
    { id: '00', desktopCoords: { x: 58, y: 74 }, mobileCoords: { x: 18, y: 88 } },
    { id: '01', desktopCoords: { x: 50, y: 67 }, mobileCoords: { x: 35, y: 82 } },
    { id: '02', desktopCoords: { x: 56, y: 60 }, mobileCoords: { x: 55, y: 78 } },
    { id: '03', desktopCoords: { x: 64, y: 55 }, mobileCoords: { x: 68, y: 80 } },
    { id: '04', desktopCoords: { x: 68, y: 65 }, mobileCoords: { x: 75, y: 55 } },
    { id: '05', desktopCoords: { x: 74, y: 61 }, mobileCoords: { x: 70, y: 40 } },
    { id: '06', desktopCoords: { x: 64, y: 73 }, mobileCoords: { x: 60, y: 25 } },
    { id: '07', desktopCoords: { x: 70, y: 48 }, mobileCoords: { x: 68, y: 10 } }
  ];

  // Desktop-only: a real, transparent hotspot placed exactly over the
  // "ПОДАТЬ ЗАЯВКУ →" pill graphic baked into the desktop BASE (see
  // preflight decision №3 — the baked pill is spatial signage art and is
  // not redrawn; only the click target is made real/accessible). The
  // mobile BASE has no such baked graphic anywhere in frame, so there is
  // no mobileCoords here — mobile relies on the persistent GlobalNav CTA.
  YHApp.ZONE_00_CTA = { id: 'cta', desktopCoords: { x: 23.3, y: 65 } };
})(window.YHApp = window.YHApp || {});
