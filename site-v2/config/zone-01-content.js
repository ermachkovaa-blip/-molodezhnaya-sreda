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
})(window.YHApp = window.YHApp || {});
