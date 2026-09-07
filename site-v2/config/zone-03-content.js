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
// long connectors; that read as scattered, not attached). Every card
// below sits within roughly 8-13% of image-space from its own object —
// as close as the object cluster's own tightness allows without two
// neighboring cards overlapping (several of these six physical objects
// are themselves only a few percent apart on the table, e.g. plan/
// tracing-paper/model) — verified via screenshot, direction (above/
// below/left/right) chosen per item specifically to dodge its nearest
// neighbors rather than defaulting to "up" for everyone.
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
      desktopCalloutCoords: { x: 54, y: 66 }, mobileCalloutCoords: { x: 49, y: 60 }
    },
    {
      id: 'tracing-paper', title: 'Калька', order: 2,
      label: 'СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ',
      text: 'Придумываем, как пространство будет работать в жизни: события, форматы, аудитории.',
      desktopCoords: { x: 45, y: 69 }, mobileCoords: { x: 50, y: 66 },
      desktopCalloutCoords: { x: 36, y: 62 }, mobileCalloutCoords: { x: 38, y: 64 }
    },
    {
      id: 'model', title: 'Макет', order: 3,
      label: 'АРХИТЕКТУРНАЯ КОНЦЕПЦИЯ',
      text: 'Создаём объёмные и пространственные решения.',
      desktopCoords: { x: 51, y: 65 }, mobileCoords: { x: 62, y: 63 },
      desktopCalloutCoords: { x: 51, y: 56 }, mobileCalloutCoords: { x: 70, y: 55 }
    },
    {
      id: 'laptop', title: 'Ноутбук', order: 4,
      label: 'AI-ИНСТРУМЕНТЫ',
      text: 'Используем современные технологии для поиска идей, анализа и визуализации.',
      desktopCoords: { x: 36, y: 70 }, mobileCoords: { x: 25, y: 67 },
      desktopCalloutCoords: { x: 28, y: 78 }, mobileCalloutCoords: { x: 25, y: 56 }
    },
    {
      id: 'schemes', title: 'Схемы', order: 5,
      label: 'ПЛАНИРОВОЧНЫЕ РЕШЕНИЯ',
      text: 'Прорабатываем планы, связи и логику перемещений в пространстве.',
      desktopCoords: { x: 46, y: 46.5 }, mobileCoords: { x: 51, y: 46.5 },
      desktopCalloutCoords: { x: 46, y: 38 }, mobileCalloutCoords: { x: 51, y: 36 }
    },
    {
      id: 'materials', title: 'Материалы', order: 6,
      label: 'ПОЛЕЗНЫЕ МАТЕРИАЛЫ',
      text: 'Навигация смыслов и Стандарт деятельности молодёжных центров.',
      desktopCoords: { x: 58.5, y: 78 }, mobileCoords: { x: 78, y: 72.5 },
      desktopCalloutCoords: { x: 70, y: 72 }, mobileCalloutCoords: { x: 60, y: 68 }
    }
  ];
})(window.YHApp = window.YHApp || {});
