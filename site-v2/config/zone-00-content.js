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

  // RECALIBRATED (customer report: "на карте смещены кружочки с карты,
  // поправь чтобы они находились на самой карте") — the values below were
  // measured directly off each platform's own BASE pixels (percentage
  // grid overlay + crop verification against the actual room cells of the
  // isometric diagram, not eyeballed), confirmed with a rendered
  // marker-on-image check before adopting. Each id sits on its own
  // distinct room, ordered bottom (00) to the topmost peak room (07) —
  // same non-literal "readable but decorative" mapping as before, just
  // actually landing on the artwork this time.
  YHApp.ZONE_00_NAV_HOTSPOTS = [
    { id: '00', desktopCoords: { x: 57.27, y: 70.65 }, mobileCoords: { x: 62.6, y: 62.8 } },
    { id: '01', desktopCoords: { x: 54.14, y: 67.18 }, mobileCoords: { x: 59.5, y: 63.5 } },
    { id: '02', desktopCoords: { x: 65.21, y: 63.47 }, mobileCoords: { x: 60.5, y: 62.3 } },
    { id: '03', desktopCoords: { x: 53.75, y: 62.31 }, mobileCoords: { x: 68.3, y: 60.0 } },
    { id: '04', desktopCoords: { x: 62.21, y: 61.16 }, mobileCoords: { x: 64.3, y: 61.6 } },
    { id: '05', desktopCoords: { x: 55.05, y: 57.69 }, mobileCoords: { x: 63.1, y: 61.0 } },
    { id: '06', desktopCoords: { x: 58.57, y: 53.19 }, mobileCoords: { x: 65.75, y: 58.7 } },
    { id: '07', desktopCoords: { x: 60.78, y: 47.04 }, mobileCoords: { x: 67.52, y: 56.47 } }
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
