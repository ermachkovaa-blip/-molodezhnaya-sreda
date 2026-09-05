// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) — declarative hotspot data. URLs are NOT
// stored here — they live centrally in config/links.js
// (LINKS.RESEARCH_MATERIAL_URLS, keyed by these same ids), per the
// project-wide "все destinations только в config/links.js" rule.
//
// desktopCoords/mobileCoords — проценты от картинки scene-02-03 (та же
// картинка, что и Zone 03 сегодня; см. config/scenes.js про то, что это
// факт данных, а не архитектурное требование).
//
// ВАЖНО (известное ограничение, см. отчёт по Этапу 3): approved-артворк
// не содержит явно обособленных зон для всех 6 категорий Production-ТЗ —
// явно различимы стенд "ИНТЕРВЬЮ" (фото с людьми) и цветная карта
// территории; "выезд на объект"/"наблюдение" не имеют собственного
// визуального якоря в этой сцене. Координаты — первое приближение по
// наиболее правдоподобным объектам сцены, требуют финальной калибровки
// через ?debug=1 совместно с заказчиком — как и Zone 01.
//
// mobileCoords сейчас явно ПРОДУБЛИРОВАНЫ из desktopCoords (config
// fallback, а не автоматический пересчёт — см. решение от 05.09) и будут
// откалиброваны отдельно, если конкретный hotspot окажется вне
// mobile-камеры по умолчанию.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_02_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ +',
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ'
  };

  YHApp.ZONE_02_HOTSPOTS = [
    { id: 'interview', title: 'Интервью', desktopCoords: { x: 9, y: 30 }, mobileCoords: { x: 9, y: 30 } },
    { id: 'photo-fixation', title: 'Фотофиксация', desktopCoords: { x: 20, y: 27 }, mobileCoords: { x: 20, y: 27 } },
    { id: 'territory-research', title: 'Исследование территории', desktopCoords: { x: 33, y: 24 }, mobileCoords: { x: 33, y: 24 } },
    { id: 'plans-work', title: 'Работа с планами', desktopCoords: { x: 3, y: 42 }, mobileCoords: { x: 3, y: 42 } },
    { id: 'observation', title: 'Наблюдение', desktopCoords: { x: 15, y: 55 }, mobileCoords: { x: 15, y: 55 } },
    { id: 'site-visit', title: 'Выезд на объект', desktopCoords: { x: 40, y: 47 }, mobileCoords: { x: 40, y: 47 } }
  ];
})(window.YHApp = window.YHApp || {});
