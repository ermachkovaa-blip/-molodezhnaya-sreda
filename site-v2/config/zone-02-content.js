// Zone 02 (ИССЛЕДОВАТЕЛЬСКАЯ) — declarative hotspot data. URLs are NOT
// stored here — they live centrally in config/links.js
// (LINKS.RESEARCH_MATERIAL_URLS, keyed by these same ids), per the
// project-wide "все destinations только в config/links.js" rule.
//
// Visual Integration (после Этапа 3): координаты откалиброваны заново под
// независимый production BASE, НЕ перенесены со старого общего
// scene-02-03.webp. desktopCoords и mobileCoords — самостоятельные
// калибровки под каждую композицию (mobile — отдельная вертикальная
// раскладка, а не crop desktop), проценты каждый относительно СВОЕЙ
// картинки.
//
// BASE UPDATE (см. отчёт "UPDATE ZONE 02 BASE"): первая версия артворка
// (фотогалерея интервью + карта) заменена заказчиком версией v2 —
// исследовательская стена перерисована: теперь на ней карты, схемы,
// текстовые материалы интервью и отчёты вместо фотогалереи. Координаты
// ниже — калибровка v2, полностью заново по новому BASE (не перенос
// прежних чисел).
//
// Физические привязки v2 (см. отчёт, ?debug=1 скриншоты):
//   plans-work         — стенд с цветными радиальными/сетевыми схемами зонирования
//   territory-research — стенд с цветной картой территории (парки/водоём)
//   interview          — текстовый блок-отчёт (материалы интервью) на стенде с графиками
//   observation        — тот же стенд: столбчатая + круговая диаграмма (аналитика/наблюдения)
//   photo-fixation     — кластер фотографий улиц/застройки на правом стенде
//   site-visit         — фигура человека с рюкзаком у стеллажа (готов к выезду)
//
// Известное ограничение: на новом артворке нет отдельного явного
// изображения-иконки именно для "материалов интервью" (в отличие от
// карты/схем/фото, которые узнаются однозначно) — интервью привязано к
// текстовому блоку-отчёту рядом с диаграммами, финальное подтверждение —
// на усмотрение заказчика.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_02_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ +',
    emptyMessage: 'МАТЕРИАЛЫ ПОЯВЯТСЯ\nПОСЛЕ ПРОВЕДЕНИЯ ИССЛЕДОВАНИЯ'
  };

  YHApp.ZONE_02_HOTSPOTS = [
    { id: 'interview', title: 'Интервью', desktopCoords: { x: 50, y: 33 }, mobileCoords: { x: 60, y: 40 } },
    { id: 'photo-fixation', title: 'Фотофиксация', desktopCoords: { x: 63, y: 34 }, mobileCoords: { x: 80, y: 42 } },
    { id: 'territory-research', title: 'Исследование территории', desktopCoords: { x: 45, y: 40 }, mobileCoords: { x: 49, y: 44 } },
    { id: 'plans-work', title: 'Работа с планами', desktopCoords: { x: 32, y: 38 }, mobileCoords: { x: 35, y: 45 } },
    { id: 'observation', title: 'Наблюдение', desktopCoords: { x: 54, y: 40 }, mobileCoords: { x: 66, y: 45 } },
    { id: 'site-visit', title: 'Выезд на объект', desktopCoords: { x: 66, y: 50 }, mobileCoords: { x: 81, y: 54 } }
  ];
})(window.YHApp = window.YHApp || {});
