// Zone 01 — контент, специфичный только для этой зоны (не переиспользуется
// другими зонами, в отличие от OBJECTS). Passage-hotspot to Zone 02.
//
// FAST MODE production pass (01+06+07) — AUDIT of the previous
// implementation, not a rebuild from scratch:
//
// The old ZONE_01_PROGRAM_STAGES (4 hover-only regions: "Слушать /
// Исследовать / Проектировать / Создавать") existed specifically to work
// around a mismatch between the old shared BASE (which only drew 4 words)
// and the Production-ТЗ's 5-stage list. The new dedicated Zone 01 BASE
// resolves that natively — it bakes in the full 5-stage program
// ("01 ПОГРУЖЕНИЕ" … "05 ЗАЩИТА") with dates, fully legible on its own.
// Recalibrating 5 fresh invisible hover boxes against the new, denser
// composition for a purely decorative highlight effect isn't asked for by
// this pass's spec and conflicts with its own "no decorative overlays,
// don't duplicate baked text" rule — so the feature is retired here rather
// than re-tuned. YHApp.ZONE_01_PROGRAM_STAGES no longer exists;
// core/zone-01-hall.js no longer references it.

(function (YHApp) {
  'use strict';

  // Presentation for the 5 objects (config/objects.js holds the objects
  // THEMSELVES — id/title/urls, shared with Zone 04; this is Zone-01-only
  // text, so it lives here, not there). hotspot-layer.js is generic and
  // has no built-in text of its own — every string a hotspot shows comes
  // from a config file like this one.
  YHApp.ZONE_01_OBJECT_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ МАТЕРИАЛЫ +',
    emptyMessage: 'МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ'
  };

  // REAL BUG found via FAST QA's mobile touch-target check (not a
  // pre-existing regression in another zone — specific to this pass): the
  // generic hotspot-layer's default 44x44 CSS px item is a FIXED pixel
  // size on an element that lives inside sceneStage, which carries the
  // camera's own CSS scale transform — so its on-screen size shrinks with
  // that transform. The new 4K Zone 01 BASE needs a much heavier
  // zoom-out than the old low-res shared placeholder did (measured stage
  // scale: ~0.4375 desktop, ~0.2528 mobile), which pushed the on-screen
  // hotspot down to ~19px desktop / ~11px mobile — both under the
  // required 44px. Fix: size hotspots as a PERCENT of the scene image
  // instead (same override pattern already used by Zone 04/05/06's own
  // hotspots), sized generously enough to stay >=44px screen-space at
  // these calibrated camera scales, with margin.
  YHApp.ZONE_01_HOTSPOT_SIZE = {
    desktop: { w: 3.2, h: 5.5 },
    mobile: { w: 9, h: 5.5 }
  };

  // Spatial-переход в 02, а не content-hotspot. Coordinates recalibrated
  // against the new dedicated Zone 01 BASE (the "02 ИССЛЕДОВАТЬ ГЛУБЖЕ →"
  // door, top-right) — separate desktop/mobile since the two renders are
  // not pixel-identical crops of the same composition.
  YHApp.ZONE_01_PASSAGE = {
    id: 'passage-01-02',
    ariaLabel: 'Перейти в исследовательскую',
    hoverLabel: 'ИДТИ →',
    targetZoneId: '02',
    desktopCoords: { x: 91, y: 65 },
    mobileCoords: { x: 84, y: 62 }
  };

  // FAST PASS — ZONE 01 / MATERIAL LINKS. A separate, always-visible
  // circle→pill action-marker next to each of the 5 object cards (real
  // <a> when a folder URL exists, disabled <button> otherwise — never a
  // fake "#" link) — additional to, not a replacement of, the existing
  // invisible whole-card hover hotspot above (ZONE_01_OBJECT_PRESENTATION).
  // One verb ("ОТКРЫТЬ"), matching the site's existing convention for
  // this exact action, used identically for all 5 objects per the pass's
  // own "strict mapping" instruction.
  YHApp.ZONE_01_MATERIAL_LINKS = {
    desktopLabel: 'ОТКРЫТЬ ИСХОДНЫЕ МАТЕРИАЛЫ ↗',
    mobileLabel: 'МАТЕРИАЛЫ',
    emptyLabelDesktop: 'МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ',
    // two lines on mobile, per this pass's own compact spec — rendered via
    // white-space:pre-line in CSS, same convention as every other
    // multi-line hotspot caption in this codebase.
    emptyLabelMobile: 'МАТЕРИАЛЫ\nБУДУТ ДОБАВЛЕНЫ'
  };

  // Same fixed-px-shrinks-with-camera-scale issue already found and fixed
  // for the object hotspots themselves (see ZONE_01_HOTSPOT_SIZE above) —
  // measured against THIS zone's actual stage rects (desktop 1680x945,
  // mobile ~546x971) so the round marker lands at a real ~52px circle on
  // desktop (inside the 48-56px brief).
  //
  // Mobile is a KNOWN, FLAGGED trade-off (see FAST QA report): once the
  // marker moved onto the card itself, the 5 cards on this BASE sit only
  // ~38px apart at rest — narrower than the 44px minimum touch target
  // this same file used for the desktop marker (and for
  // ZONE_01_HOTSPOT_SIZE above). Both can't be satisfied at once on this
  // BASE, so "don't overlap the neighbouring card/marker" (an explicit
  // FAST PASS QA item) won this specific conflict — mobile markers are
  // ~32px, sized to clear each other (confirmed against the real render),
  // under the 44px guideline. Flagged for the customer to weigh in on,
  // not silently shipped either way.
  YHApp.ZONE_01_MATERIAL_BUTTON_SIZE = {
    desktop: { w: 3.1, h: 5.5 },
    mobile: { w: 4.6, h: 2.6 }
  };

  // Follow-up ("маркеры на самих стендах, под названием города") moved
  // the anchor from the shared wall band down onto each card itself —
  // same x as the object's own card, y placed in the real blank gap
  // between the city-name title and the thin rule under it (measured
  // against the actual render: desktop ~53px tall, mobile a few px —
  // mobile's card is tiny at rest, so the marker is sized down there,
  // see ZONE_01_MATERIAL_BUTTON_SIZE).
  YHApp.ZONE_01_MATERIAL_BUTTON_COORDS = {
    bugulma: { desktopCoords: { x: 47, y: 64 }, mobileCoords: { x: 40, y: 60 } },
    elabuga: { desktopCoords: { x: 54, y: 64 }, mobileCoords: { x: 47, y: 60 } },
    shemordan: { desktopCoords: { x: 61, y: 64 }, mobileCoords: { x: 54, y: 60 } },
    laishevo: { desktopCoords: { x: 68, y: 64 }, mobileCoords: { x: 61, y: 60 } },
    stolbishche: { desktopCoords: { x: 75, y: 64 }, mobileCoords: { x: 68, y: 60 } }
  };

  // Strict per-object -> config.links key mapping (FAST PASS spec п.7) —
  // never inferred from array index, never auto-linked to Zone 04's own
  // archiveFolderUrl.
  YHApp.ZONE_01_MATERIAL_LINK_KEYS = {
    bugulma: 'OBJECT_BUGULMA_URL',
    elabuga: 'OBJECT_ELABUGA_URL',
    shemordan: 'OBJECT_SHEMORDAN_URL',
    laishevo: 'OBJECT_LAISHEVO_URL',
    stolbishche: 'OBJECT_STOLBISCHE_URL'
  };
})(window.YHApp = window.YHApp || {});
