// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) — declarative hotspot data. URLs live
// centrally in config/links.js (LINKS.PROJECT_MATERIAL_URLS), same
// pattern as Zone 02.
//
// ZONE 03 — REBUILD HOTSPOT PRESENTATION TO MATCH PROVIDED REFERENCE
// (customer spec): label/text below are the APPROVED wording from that
// spec (matches her original reference image text verbatim) — replacing
// the earlier interim copy this file had (a generic "Скоро появится" for
// 4 of 6 items, and a self-written AI-tools paragraph for 'laptop') now
// that real approved wording exists for all six. Nothing here is invented
// — every string is copied from the spec's own numbered list.
//
// desktopCoords/mobileCoords — the real "+" button position, i.e. exactly
// on the physical object (unchanged from the earlier calibration, still
// valid): this is the actual click target, never moved just to make room
// for a label.
//
// desktopCalloutCoords/mobileCalloutCoords — the white annotation card's
// own anchor point per platform (badge attached to its left edge,
// connected to the "+"/object by a thin line — see
// core/zone-03-workshop.js). CARDS ARE ALWAYS VISIBLE ON BOTH PLATFORMS
// (customer follow-up: "Stop using expand/collapse as the default
// interaction model... cards visible immediately").
//
// RECOMPOSED (customer follow-up: "RECOMPOSE ANNOTATIONS CLOSER TO
// OBJECTS" — the first pass spread cards out across the whole scene with
// long connectors; that read as scattered, not attached). Every
// desktopCalloutCoords below sits within roughly 8-13% of image-space
// from its own object — as close as the object cluster's own tightness
// allows without two neighboring cards overlapping (several of these six
// physical objects are themselves only a few percent apart on the table,
// e.g. plan/tracing-paper/model) — verified via screenshot, direction
// (above/below/left/right) chosen per item specifically to dodge its
// nearest neighbors rather than defaulting to "up" for everyone.
//
// mobileCalloutCoords — REDONE (this pass): the earlier object-proximity
// mobile positions were tuned while every card was silently rendering
// ~2x too small (see the resolution-independence bug fixed in
// core/spatial-annotations.js — card on-screen size used to be coupled to
// the shipped image's raw pixel resolution, not just the viewport). Once
// cards render at their real, correct size (six titles-only cards, ~96-
// 119px tall each, ~50vw wide), there simply isn't enough distinct 2D
// space around six closely-clustered table objects on a ~375px-wide
// phone screen to keep every card both near its object AND clear of the
// other five — this is a real fit problem, not a coordinate mistake.
// Chose a single vertical column (all six cards at the same x, stacked
// top-to-bottom in the object's own numbered order with a small gap) —
// deterministically overlap-free and everything still fits above the
// bottom nav — over a 2D scatter that could only ever be a partial fix.
// The tradeoff: connector lines run further and no longer track "closest
// side of the object" the way desktop's do. Coordinates computed from
// the real camera matrix at 375px (scale 0.25, translate -82.5/-160 —
// see core/scene-engine.js), not eyeballed; re-verified via Playwright
// (no overlap, no overflow) at 360/375/390/430px.
//
// Физические привязки (см. отчёт Visual Integration, ?debug=1 скриншоты):
//   laptop         — ноутбук на столе (экран с фото здания)
//   plan           — плоский расчерченный лист (site plan) на столе
//   tracing-paper  — рулон(ы) полупрозрачной бумаги рядом с макетом
//   model          — белый архитектурный макет
//   materials      — сетка образцов материалов/фактур на столе
//   schemes        — приколотая на стену схема-диаграмма (узлы/связи)

(function (YHApp) {
  'use strict';

  // Currently unused by core/zone-03-workshop.js: per the customer's
  // explicit interaction rule ("+' must only ever mean "there is
  // something to open" — no material means no "+" at all, not an
  // inactive one that pops up this text on click). Kept here, not
  // deleted, in case a future direction wants the optional subtle
  // "material coming" state the spec allows for (it explicitly warned
  // against showing it on every card at once, which is what all six
  // being null right now would mean).
  YHApp.ZONE_03_PRESENTATION = {
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nВ ПРОЦЕССЕ ПРОЕКТИРОВАНИЯ'
  };

  YHApp.ZONE_03_HOTSPOTS = [
    {
      id: 'plan', title: 'План', order: 1,
      label: 'ФУНКЦИОНАЛЬНОЕ ЗОНИРОВАНИЕ',
      text: 'Изучаем территорию и определяем, какие пространства нужны молодёжи.',
      desktopCoords: { x: 47.5, y: 74 }, mobileCoords: { x: 49, y: 71 },
      desktopCalloutCoords: { x: 58, y: 70 }, mobileCalloutCoords: { x: 20.83, y: 29.51 }
    },
    {
      id: 'tracing-paper', title: 'Калька', order: 2,
      label: 'СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ',
      text: 'Придумываем, как пространство будет работать в жизни: события, форматы, аудитории.',
      desktopCoords: { x: 45, y: 69 }, mobileCoords: { x: 50, y: 66 },
      desktopCalloutCoords: { x: 30, y: 59 }, mobileCalloutCoords: { x: 20.83, y: 40.79 }
    },
    {
      id: 'model', title: 'Макет', order: 3,
      label: 'АРХИТЕКТУРНАЯ КОНЦЕПЦИЯ',
      text: 'Создаём объёмные и пространственные решения.',
      desktopCoords: { x: 51, y: 65 }, mobileCoords: { x: 62, y: 63 },
      // customer: "сдвинуть карточку вправо примерно на 80-120px и вверх
      // на 25-40px, чтобы она оказалась в более свободном светлом поле
      // между центральной колонной и правой группой людей" — shifted
      // ~100px right / ~32px up at the measured real render scale
      // (0.41 at 1500x818, converted through the camera transform to
      // image-percent: +6.35 x / -3.61 y). The "03" badge is a child of
      // this card (CSS left:-Npx, own vertical centering) so it moves
      // with it automatically — no separate coordinate for it.
      // customer: "зона 2-3 карточки хаотично, что-то вылезает за экран"
      // — mobile x (70) ran 9px past the real 375px viewport's right
      // edge; pulled back on screen (measured at scale 0.317).
      desktopCalloutCoords: { x: 57.35, y: 47.4 }, mobileCalloutCoords: { x: 20.83, y: 52.06 }
    },
    {
      id: 'laptop', title: 'Ноутбук', order: 4,
      label: 'AI-ИНСТРУМЕНТЫ',
      text: 'Используем современные технологии для поиска идей, анализа и визуализации.',
      desktopCoords: { x: 36, y: 70 }, mobileCoords: { x: 25, y: 67 },
      desktopCalloutCoords: { x: 28, y: 78 }, mobileCalloutCoords: { x: 20.83, y: 63.34 }
    },
    {
      id: 'schemes', title: 'Схемы', order: 5,
      label: 'ПЛАНИРОВОЧНЫЕ РЕШЕНИЯ',
      text: 'Прорабатываем планы, связи и логику перемещений в пространстве.',
      desktopCoords: { x: 46, y: 46.5 }, mobileCoords: { x: 51, y: 46.5 },
      desktopCalloutCoords: { x: 46, y: 38 }, mobileCalloutCoords: { x: 20.83, y: 73.43 }
    },
    {
      id: 'materials', title: 'Материалы', order: 6,
      label: 'ПОЛЕЗНЫЕ МАТЕРИАЛЫ',
      text: 'Навигация смыслов и Стандарт деятельности молодёжных центров.',
      desktopCoords: { x: 58.5, y: 78 }, mobileCoords: { x: 78, y: 72.5 },
      desktopCalloutCoords: { x: 70, y: 72 }, mobileCalloutCoords: { x: 20.83, y: 84.71 }
    }
  ];
})(window.YHApp = window.YHApp || {});
