// Zone 03 (ПРОЕКТНАЯ МАСТЕРСКАЯ) — declarative hotspot data. URLs live
// centrally in config/links.js (LINKS.PROJECT_MATERIAL_URLS), same
// pattern as Zone 02.
//
// description — семантическая подпись категории (title → description,
// например "ПЛАН → ФУНКЦИОНАЛЬНОЕ ЗОНИРОВАНИЕ" из Production-ТЗ),
// используется в aria-label.
//
// Visual Integration (после Этапа 3): координаты откалиброваны заново под
// независимый production BASE (zone-03-project-workshop-realistic-expanded-4k.png
// / mobile zone-03-mobile-base-clean-realistic-4k.png — см.
// config/scenes.js), НЕ перенесены со старого общего scene-02-03.webp.
// desktopCoords и mobileCoords — самостоятельные калибровки, mobile — не
// crop desktop, а собственная вертикальная композиция того же стола.
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

  YHApp.ZONE_03_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ +',
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nВ ПРОЦЕССЕ ПРОЕКТИРОВАНИЯ'
  };

  YHApp.ZONE_03_HOTSPOTS = [
    { id: 'plan', title: 'План', description: 'Функциональное зонирование', desktopCoords: { x: 47.5, y: 74 }, mobileCoords: { x: 49, y: 71 } },
    { id: 'tracing-paper', title: 'Калька', description: 'Сценарии использования', desktopCoords: { x: 45, y: 69 }, mobileCoords: { x: 50, y: 66 } },
    { id: 'model', title: 'Макет', description: 'Архитектурная концепция', desktopCoords: { x: 51, y: 65 }, mobileCoords: { x: 62, y: 63 } },
    { id: 'laptop', title: 'Ноутбук', description: 'AI-инструменты', desktopCoords: { x: 36, y: 70 }, mobileCoords: { x: 25, y: 67 } },
    { id: 'schemes', title: 'Схемы', description: 'Планировочные решения', desktopCoords: { x: 46, y: 46.5 }, mobileCoords: { x: 51, y: 46.5 } },
    { id: 'materials', title: 'Материалы', description: 'Образ и атмосфера пространства', desktopCoords: { x: 58.5, y: 78 }, mobileCoords: { x: 78, y: 72.5 } }
  ];
})(window.YHApp = window.YHApp || {});
