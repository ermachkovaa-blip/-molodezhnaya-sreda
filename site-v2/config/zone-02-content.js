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
// desktopCalloutCoords/mobileCalloutCoords — recalibrated to sit tightly
// next to each item's own object (see core/spatial-annotations.js for how
// they're used: a short connector runs from here to desktopCoords/
// mobileCoords), replacing the earlier "spread across the whole scene"
// positions — the same object-centric recompose already applied to Zone
// 03. Mobile ALSO shows the full description here (unlike Zone 03's
// mobile, which is title-only) — explicit, distinct instruction for Zone
// 02 ("Do NOT hide the description simply because it is mobile").
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
      desktopCalloutCoords: { x: 46, y: 22 }, mobileCalloutCoords: { x: 48, y: 32 }
    },
    {
      id: 'territory-research', title: 'Исследование территории', order: 2,
      label: 'КАРТА ТЕРРИТОРИИ',
      text: 'Анализируем контекст: город, окружение, доступность, ключевые точки.',
      desktopCoords: { x: 45, y: 40 }, mobileCoords: { x: 49, y: 44 },
      desktopCalloutCoords: { x: 40, y: 50 }, mobileCalloutCoords: { x: 36, y: 50 }
    },
    {
      id: 'observation', title: 'Наблюдение', order: 3,
      label: 'НАБЛЮДЕНИЯ И ЗАПРОСЫ',
      text: 'Фиксируем, что видим на месте и какие есть потребности у молодежи.',
      desktopCoords: { x: 54, y: 40 }, mobileCoords: { x: 66, y: 45 },
      desktopCalloutCoords: { x: 58, y: 50 }, mobileCalloutCoords: { x: 70, y: 52 }
    },
    {
      id: 'photo-fixation', title: 'Фотофиксация', order: 4,
      label: 'ФОТОФИКСАЦИЯ',
      text: 'Смотрим на территорию глазами исследователя: фото, детали, атмосфера.',
      desktopCoords: { x: 63, y: 34 }, mobileCoords: { x: 80, y: 42 },
      desktopCalloutCoords: { x: 66, y: 22 }, mobileCalloutCoords: { x: 78, y: 28 }
    },
    {
      id: 'research-materials', title: 'Стопка материалов', order: 5,
      label: 'ИССЛЕДОВАТЕЛЬСКИЕ МАТЕРИАЛЫ',
      text: 'Методики, шаблоны, чек-листы и полезные инструменты для проведения исследований.',
      desktopCoords: { x: 66.5, y: 66 }, mobileCoords: { x: 72.5, y: 59 },
      desktopCalloutCoords: { x: 58, y: 60 }, mobileCalloutCoords: { x: 58, y: 66 }
    }
  ];
})(window.YHApp = window.YHApp || {});
