// Zone 07 (АМФИТЕАТР) — declarative data for behavior 'apply-cta' (see
// core/zone-07-cta.js). FAST MODE production pass (01+06+07).
//
// The BASE bakes in a "Подай заявку" prompt + arrow (not the literal
// "ПОДАТЬ ЗАЯВКУ ↗" string, but unambiguously the same CTA) — per spec,
// a real transparent hotspot goes over that baked text, no HTML text is
// duplicated on top of it. Coordinates are first-pass percentage-grid
// estimates against the actual BASE (see preflight), not yet a pixel-
// exact ?debug=1 calibration.
//
// Desktop BASE note: delivered at an unusual ~2.45:1 aspect (1964x801),
// below the project's usual 4K/16:9 convention — flagged in preflight,
// not a blocker (SceneEngine's cover-scale math is aspect-agnostic).

(function (YHApp) {
  'use strict';

  YHApp.ZONE_07_CTA = {
    desktopCoords: { x: 18.5, y: 36 },
    desktopSize: { w: 9, h: 12 },
    mobileCoords: { x: 29, y: 39 },
    mobileSize: { w: 14, h: 8 }
  };

  // ---- application / contact banner (camera recalibration pass) ----
  // Scene-relative percent box, lives inside .yh-scene-stage, moves with
  // the camera transform (not viewport-fixed) — see core/zone-07-cta.js.
  //
  // Desktop placement: SECOND customer revision — "center it on screen."
  // Centered within the safe zone that still keeps the right Zone 07 wall/
  // presentation board/speaker clear (board's own left edge measured at
  // image-x ~57% at the calibrated cameraPreset x:51,y:50,scale:1 — a
  // literal full-viewport center would push the banner's right edge past
  // that and onto the board, which the spec explicitly forbids covering).
  // Centered both axes within image-x [15,54] / image-y [8,90].
  // FOURTH customer revision: both banners marked up too large on a
  // screenshot with a red rectangle — top edge kept the same, box shrunk
  // down to roughly that marked footprint (~39% of the previous width,
  // ~59% of the previous height, computed from the annotated screenshot's
  // own pixel proportions vs. the banner's previous on-screen size).
  // FIFTH customer revision: "increase the application form on desktop by
  // about 1.5x" — box scaled 1.5x around its previous center (12.5/18/21/42
  // vs the old 16/25/14/28), still comfortably inside the safe zone
  // (right edge 33.5% vs the board's ~57% left edge; bottom 60% vs 90%).
  // Internal typography/spacing scaled 1.5x too, desktop-only (see
  // app.css's `@media (min-width:768px)` block for .yh-apply-banner__*)
  // — mobile keeps its own separate sizing/centering per that same
  // revision's mobile ask.
  // SIXTH customer revision: "просила увеличить шрифт... но это супер
  // огромный, это плохо" — fonts brought down to a comfortable reading
  // size (app.css .yh-apply-banner__* base + its desktop media query),
  // box shrunk to match so it hugs the now much smaller content instead
  // of leaving dead space, same top-left anchor as before.
  // SEVENTH revision (2026-09-14, found while fixing the banner's
  // camera-zoom counter-scale — see core/zone-07-cta.js): now that the
  // banner stays a constant real size instead of shrinking further on
  // narrower windows, its left edge clips off-screen (~27px) on real
  // ~1280px-wide laptop windows — pre-existing, just barely inside the
  // viewport before at that width's smaller natural size. Nudged right
  // by the minimum needed to clear it with a small margin (verified at
  // 1280/1512/1920px: no left-clip, right edge still clear of the
  // presentation board).
  YHApp.ZONE_07_BANNER_DESKTOP = { left: 17, top: 12, width: 24, height: 46 };

  // Mobile placement: SECOND customer revision — same centering, same
  // proportions/styling as desktop (only this box's own position/size is
  // breakpoint-specific, per spec's "separate compositions" rule).
  // THIRD customer revision: mobile moved back to the LOWER part of the
  // screen (not centered like desktop) — bottom edge just above the
  // measured bottom-nav top (~87.6-89% across 360-430px viewports).
  // FOURTH customer revision: same red-rectangle size-down as desktop —
  // bottom edge kept the same, height reduced (~38% of previous).
  // EIGHTH revision (2026-09-15): "текст крупнее и карточка не пустая" —
  // the ~1.7x mobile text bump above (app.css .yh-apply-banner__*) grew
  // the content, but even so, measured against a real render at 390x844
  // the content's natural height (131.7px) was still only ~63% of this
  // box's old height (24% of stage height = 208.6px) — a genuine ~77px
  // dead gap, not a guess. Shrunk to 17% (≈148px, still ~16px of comfy
  // slack over the measured content) so the vertically-centered content
  // actually fills the card instead of floating in it. Bottom edge
  // shifts up slightly as a result — re-verified clear of the bottom nav
  // at 390x844.
  YHApp.ZONE_07_BANNER_MOBILE = { left: 11, top: 62, width: 70, height: 17 };

  YHApp.ZONE_07_BANNER_CONTENT = {
    primaryEyebrow: '07 АМФИТЕАТР',
    primaryHeading: 'ПОДАТЬ ЗАЯВКУ',
    primaryLead: 'Хочешь стать участником хакатона?',
    primaryCta: 'ПОДАТЬ ЗАЯВКУ ↗',
    secondaryEyebrow: 'ЕСТЬ ВОПРОС?',
    secondaryHeading: 'НАПИШИ НАМ',
    fieldNameLabel: 'ИМЯ',
    fieldEmailLabel: 'EMAIL',
    fieldMessageLabel: 'ВОПРОС',
    submitLabel: 'ОТПРАВИТЬ →',
    validationMessage: 'Заполните имя, email и вопрос корректно.',
    successMessage: 'СПАСИБО. СООБЩЕНИЕ ОТПРАВЛЕНО.',
    mailtoFallbackMessage: 'Открывается ваш почтовый клиент — отправьте письмо вручную.',
    sendErrorMessage: 'Не удалось отправить. Попробуйте ещё раз позже.',
    // shown on submit attempt when both CONTACT_FORM_ENDPOINT and
    // CONTACT_EMAIL are null — same "field not yet provided" fallback
    // pattern as every other null URL in this project, never a fake send.
    contactMissingMessage: 'КОНТАКТ ДЛЯ ОБРАТНОЙ СВЯЗИ БУДЕТ ДОБАВЛЕН'
  };
})(window.YHApp = window.YHApp || {});
