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
// mobileCoords — FINAL RECALIBRATION against
// zone-00-mobile-base-expanded-centered-v2-2160x3840.png, which replaces
// the earlier provisional mobile BASE (that one had neither physical
// stand in frame at all — see the Zone 00 Visual Integration report's
// "important caveat"). This BASE shows the SAME "КАРТА ХАКАТОНА"
// isometric diagram as desktop, but its own independent composition/
// framing — coordinates below are a fresh calibration against this
// image's own pixels (percentage grid + ?debug=1 verification), not
// derived from desktopCoords and not the old placeholder free-floating
// values.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_00_NAV_HOTSPOTS = [
    { id: '00', desktopCoords: { x: 58, y: 74 }, mobileCoords: { x: 64, y: 63.8 } },
    { id: '01', desktopCoords: { x: 50, y: 67 }, mobileCoords: { x: 60, y: 63 } },
    { id: '02', desktopCoords: { x: 56, y: 60 }, mobileCoords: { x: 56, y: 61.5 } },
    { id: '03', desktopCoords: { x: 64, y: 55 }, mobileCoords: { x: 60, y: 59 } },
    { id: '04', desktopCoords: { x: 68, y: 65 }, mobileCoords: { x: 66, y: 56.5 } },
    { id: '05', desktopCoords: { x: 74, y: 61 }, mobileCoords: { x: 71, y: 59 } },
    { id: '06', desktopCoords: { x: 64, y: 73 }, mobileCoords: { x: 72, y: 62 } },
    { id: '07', desktopCoords: { x: 70, y: 48 }, mobileCoords: { x: 68, y: 63 } }
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
  YHApp.ZONE_00_CTA = {
    id: 'cta',
    desktopCoords: { x: 23.3, y: 65 },
    mobileCoords: { x: 32, y: 62.7 },
    desktopSize: { w: 10, h: 3.8 },
    mobileSize: { w: 14, h: 2.6 }
  };
})(window.YHApp = window.YHApp || {});
