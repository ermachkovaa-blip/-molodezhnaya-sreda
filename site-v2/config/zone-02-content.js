// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) — declarative hotspot data. URLs are NOT
// stored here — they live centrally in config/links.js
// (LINKS.RESEARCH_MATERIAL_URLS, keyed by these same ids), per the
// project-wide "все destinations только в config/links.js" rule.
//
// UNIFIED SPATIAL ANNOTATION SYSTEM (customer spec: "ONE SITE = ONE
// ANNOTATION LANGUAGE") — Zone 02 now uses the exact same annotation
// component as Zone 03 (core/spatial-annotations.js, wired up by
// core/zone-02-workshop.js). This rewrite:
//   - drops the earlier six-hotspot set down to EXACTLY FIVE, per the
//     spec's explicit content list — 'plans-work' and 'site-visit' (which
//     had no approved copy — "Скоро появится" placeholders) are retired
//     as separate annotations; RESEARCH_MATERIAL_URLS keeps their old
//     keys untouched in config/links.js in case that content resurfaces
//     later, but nothing here renders them anymore.
//   - adds a new fifth id, 'research-materials' ("05 ИССЛЕДОВАТЕЛЬСКИЕ
//     МАТЕРИАЛЫ"), targeting the stack of books baked into the BASE
//     ("МЕТОДИКИ ИССЛЕДОВАНИЙ / АНАЛИЗ ТЕРРИТОРИЙ / ..." on the table,
//     right side) — a real object already visible in the artwork that
//     just never had its own hotspot before. desktopCoords/mobileCoords
//     below were measured directly off that object's on-screen position
//     via the scene stage's own transform math (not eyeballed), same
//     rigor as every other calibrated coordinate in this project.
//   - label/text for the first four (interview/territory-research/
//     observation/photo-fixation) and the new fifth are the APPROVED
//     wording carried over unchanged from the earlier pass — nothing
//     reworded.
//
// desktopCalloutCoords — recalibrated to sit tightly next to each item's
// own object (see core/spatial-annotations.js for how they're used: a
// short connector runs from here to desktopCoords/mobileCoords),
// replacing the earlier "spread across the whole scene" positions — the
// same object-centric recompose already applied to Zone 03.
//
// mobileCalloutCoords — REDONE (customer decision, this pass): mobile
// used to ALSO show the full description here (unlike Zone 03's
// mobile, which is title-only) per an earlier explicit instruction ("Do
// NOT hide the description simply because it is mobile"). That stopped
// being possible once cards render at their real, correct size (see the
// resolution-independence bug fixed in core/spatial-annotations.js) —
// five full-description cards don't fit a phone screen without overlap,
// a real fit problem, not a coordinate mistake (same one Zone 03 hit
// first). Asked the customer; she chose titles-only, matching Zone 03,
// over a single tall scrolling column or leaving the overlap. Now
// title-only on mobile (core/zone-02-workshop.js passes the
// titles-only modifier class), single vertical column like Zone 03's,
// coordinates computed from the real camera matrix at 375px (scale
// 0.25, translate -82.5/-60.8 — see core/scene-engine.js), re-verified
// via Playwright (no overlap, no overflow, clears header/nav) at
// 360/375/390/430px.
//
// Visual Integration (после Этапа 3): координаты откалиброваны заново под
// независимый production BASE, НЕ перенесены со старого общего
// scene-02-03.webp. desktopCoords и mobileCoords — самостоятельные
// калибровки под каждую композицию (mobile — отдельная вертикальная
// раскладка, а не crop desktop), проценты каждый относительно СВОЕЙ
// картинки.
//
// Физические привязки v2 (см. отчёт, ?debug=1 скриншоты):
//   territory-research  — стенд с цветной картой территории (парки/водоём)
//   interview           — текстовый блок-отчёт (материалы интервью) на стенде с графиками
//   observation         — тот же стенд: столбчатая + круговая диаграмма (аналитика/наблюдения)
//   photo-fixation      — кластер фотографий улиц/застройки на правом стенде
//   research-materials  — стопка книг/материалов на столе справа

(function (YHApp) {
  'use strict';

  // Currently unused by core/zone-02-workshop.js — same status as Zone
  // 03's ZONE_03_PRESENTATION.emptyMessage (see that file): the shared
  // annotation component omits "+" entirely when there's no material,
  // rather than showing an inactive button with this caption. Kept for a
  // possible future subtle "material coming" state.
  YHApp.ZONE_02_PRESENTATION = {
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ'
  };

  YHApp.ZONE_02_HOTSPOTS = [
    {
      id: 'interview', title: 'Интервью', order: 1,
      label: 'ИНТЕРВЬЮ',
      text: 'Разговоры с молодыми людьми, экспертами и локальными сообществами.',
      desktopCoords: { x: 50, y: 33 }, mobileCoords: { x: 60, y: 40 },
      // customer follow-up: "интервью закрывает текст на стене" — still
      // grazing the "ПРОСТРАНСТВО?" line above; nudged down+right off it
      // (measured at 1500x760/scale 0.449).
      desktopCalloutCoords: { x: 43, y: 29 }, mobileCalloutCoords: { x: 20.83, y: 17.24 }
    },
    {
      id: 'territory-research', title: 'Исследование территории', order: 2,
      label: 'КАРТА ТЕРРИТОРИИ',
      text: 'Анализируем контекст: город, окружение, доступность, ключевые точки.',
      desktopCoords: { x: 45, y: 40 }, mobileCoords: { x: 49, y: 44 },
      // customer follow-up: "карта территории на парне" — card was
      // grazing the seated man's head at the table; moved up+left off it.
      desktopCalloutCoords: { x: 38, y: 47 }, mobileCalloutCoords: { x: 20.83, y: 26.67 }
    },
    {
      id: 'observation', title: 'Наблюдение', order: 3,
      label: 'НАБЛЮДЕНИЯ И ЗАПРОСЫ',
      text: 'Фиксируем, что видим на месте и какие есть потребности у молодежи.',
      desktopCoords: { x: 54, y: 40 }, mobileCoords: { x: 66, y: 45 },
      // customer follow-up: "все карточки находятся в левом блоке, правый
      // пустой — перераспредели" — pushed further right into the gap
      // between the "ЛЮДИ/ИДЕИ/ГОРОДА/БУДУЩЕЕ" text and card 04's own
      // corner position, clear of both.
      // customer: "зона 2 мобильная — карточки хаотично, что-то вылезает
      // за экран" — this card's mobile x (70) ran its right edge 18.5px
      // past the real 375px-viewport edge; pulled left with margin
      // (measured at scale 0.317).
      desktopCalloutCoords: { x: 65, y: 34 }, mobileCalloutCoords: { x: 20.83, y: 37.29 }
    },
    {
      id: 'photo-fixation', title: 'Фотофиксация', order: 4,
      label: 'ФОТОФИКСАЦИЯ',
      text: 'Смотрим на территорию глазами исследователя: фото, детали, атмосфера.',
      desktopCoords: { x: 63, y: 34 }, mobileCoords: { x: 80, y: 42 },
      // customer follow-up: "04 поднять еще выше и правее, ближе к
      // верхнему правому углу, но не заходить на вертикальный текст
      // «ЛЮДИ / ИДЕИ / ГОРОДА / БУДУЩЕЕ»" — pushed toward the corner,
      // kept short of that text block's own left edge.
      // Mobile follow-up: this one was the worst offender — 73px past
      // the real viewport's right edge at 375px — pulled well back on
      // screen (measured at scale 0.317).
      desktopCalloutCoords: { x: 74, y: 13 }, mobileCalloutCoords: { x: 20.83, y: 46.73 }
    },
    {
      id: 'research-materials', title: 'Стопка материалов', order: 5,
      label: 'ИССЛЕДОВАТЕЛЬСКИЕ МАТЕРИАЛЫ',
      text: 'Методики, шаблоны, чек-листы и полезные инструменты для проведения исследований.',
      desktopCoords: { x: 66.5, y: 66 }, mobileCoords: { x: 72.5, y: 59 },
      // customer: "исследовательские материалы... нужно поднимать выше,
      // перекрывается нижней навигацией" — moved up well clear of the
      // bottom nav bar. Follow-up: "оставить примерно в текущем секторе,
      // но сдвинуть немного вниз и вправо, чтобы она меньше перекрывала
      // стеллаж и не выглядела зажатой" — small down+right nudge within
      // that same sector, off the bookshelf.
      desktopCalloutCoords: { x: 75, y: 65 }, mobileCalloutCoords: { x: 20.83, y: 58.52 }
    }
  ];
})(window.YHApp = window.YHApp || {});
