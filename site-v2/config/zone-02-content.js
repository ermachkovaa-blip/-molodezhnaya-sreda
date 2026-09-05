// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) — declarative hotspot data. URLs are NOT
// stored here — they live centrally in config/links.js
// (LINKS.RESEARCH_MATERIAL_URLS, keyed by these same ids), per the
// project-wide "все destinations только в config/links.js" rule.
//
// Visual Integration (после Этапа 3): координаты откалиброваны заново под
// независимый production BASE (zone-02-base-clean-4k.png / mobile
// 2160x3840 — см. config/scenes.js), НЕ перенесены со старого общего
// scene-02-03.webp. desktopCoords и mobileCoords — самостоятельные
// калибровки под каждую композицию (mobile — отдельная вертикальная
// раскладка, а не crop desktop), проценты каждый относительно СВОЕЙ
// картинки.
//
// Физические привязки (см. отчёт Visual Integration, ?debug=1 скриншоты):
//   plans-work         — доска-флипчарт со схемой города/сетевой диаграммой
//   interview          — стенд с 9 портретными фото (интервью)
//   territory-research — стенд с цветной картой территории и легендой
//   observation        — стенд с цветными стикерами-заметками + 2 фото
//   photo-fixation     — стенд с фотофиксацией улиц/застройки
//   site-visit         — фигура человека с рюкзаком у стеллажа (готов к выезду)
//
// Известное ограничение: "наблюдение" и "выезд на объект" не имеют
// однозначного текстового ярлыка на самом артворке (в отличие от
// "ИНТЕРВЬЮ") — привязка сделана по смысловому прочтению сцены, финальное
// подтверждение — на усмотрение заказчика.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_02_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ +',
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ'
  };

  YHApp.ZONE_02_HOTSPOTS = [
    { id: 'interview', title: 'Интервью', desktopCoords: { x: 35, y: 43 }, mobileCoords: { x: 35.5, y: 47 } },
    { id: 'photo-fixation', title: 'Фотофиксация', desktopCoords: { x: 71, y: 43 }, mobileCoords: { x: 77, y: 47 } },
    { id: 'territory-research', title: 'Исследование территории', desktopCoords: { x: 47, y: 42 }, mobileCoords: { x: 51, y: 47 } },
    { id: 'plans-work', title: 'Работа с планами', desktopCoords: { x: 13.5, y: 51 }, mobileCoords: { x: 11, y: 57 } },
    { id: 'observation', title: 'Наблюдение', desktopCoords: { x: 57, y: 44 }, mobileCoords: { x: 64.5, y: 47 } },
    { id: 'site-visit', title: 'Выезд на объект', desktopCoords: { x: 72, y: 53 }, mobileCoords: { x: 84, y: 55 } }
  ];
})(window.YHApp = window.YHApp || {});
