// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) — declarative hotspot data. URLs live
// centrally in config/links.js (LINKS.PROJECT_MATERIAL_URLS), same
// pattern as Zone 02.
//
// description — семантическая подпись категории (title → description,
// например "ПЛАН → ФУНКЦИОНАЛЬНОЕ ЗОНИРОВАНИЕ" из Production-ТЗ),
// используется в aria-label.
//
// ВАЖНО (известное ограничение, см. отчёт по Этапу 3): в отличие от
// Zone 02, здесь визуальные якоря видны отчётливее — макет здания и
// ноутбук чётко различимы на столе; калька/схемы/материалы — первое
// приближение по разложенным на столе бумагам и рулонам, требуют
// финальной калибровки через ?debug=1.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_03_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ +',
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nВ ПРОЦЕССЕ ПРОЕКТИРОВАНИЯ'
  };

  YHApp.ZONE_03_HOTSPOTS = [
    { id: 'plan', title: 'План', description: 'Функциональное зонирование', desktopCoords: { x: 51, y: 69 }, mobileCoords: { x: 51, y: 69 } },
    { id: 'tracing-paper', title: 'Калька', description: 'Сценарии использования', desktopCoords: { x: 70, y: 79 }, mobileCoords: { x: 70, y: 79 } },
    { id: 'model', title: 'Макет', description: 'Архитектурная концепция', desktopCoords: { x: 68.6, y: 61 }, mobileCoords: { x: 68.6, y: 61 } },
    { id: 'laptop', title: 'Ноутбук', description: 'AI-инструменты', desktopCoords: { x: 78, y: 70 }, mobileCoords: { x: 78, y: 70 } },
    { id: 'schemes', title: 'Схемы', description: 'Планировочные решения', desktopCoords: { x: 60, y: 60 }, mobileCoords: { x: 60, y: 60 } },
    { id: 'materials', title: 'Материалы', description: 'Образ и атмосфера пространства', desktopCoords: { x: 94, y: 50 }, mobileCoords: { x: 94, y: 50 } }
  ];
})(window.YHApp = window.YHApp || {});
