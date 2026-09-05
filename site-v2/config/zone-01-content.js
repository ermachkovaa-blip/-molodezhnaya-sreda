// Zone 01 — контент, специфичный только для этой зоны (не переиспользуется
// другими зонами, в отличие от OBJECTS). Program wall и passage-hotspot.
//
// PROGRAM_STAGES: подписи взяты ДОСЛОВНО из уже нарисованного в BASE
// списка ("СЛУШАТЬ / ИССЛЕДОВАТЬ / ПРОЕКТИРОВАТЬ / СОЗДАВАТЬ" —
// см. assets/scenes/scene-00-01.*). Production-ТЗ описывает другой,
// 5-этапный список ("01 ПОГРУЖЕНИЕ...05 ЗАЩИТА") — этого текста в
// approved-иллюстрации нет. Подсвечивать наведением можно только то, что
// реально нарисовано (иначе hover не будет совпадать с содержимым сцены),
// поэтому здесь — 4 пункта по факту артворка, а не 5 из текста ТЗ. См.
// отчёт по Этапу 2, known issues — требуется решение заказчика: либо
// обновить артворк под 5-этапный список, либо принять текущие 4 пункта.

(function (YHApp) {
  'use strict';

  // Presentation for the 5 objects (config/objects.js holds the objects
  // THEMSELVES — id/title/urls, shared with the future Zone 04; this is
  // Zone-01-only text, so it lives here, not there). hotspot-layer.js is
  // generic and has no built-in text of its own — every string a hotspot
  // shows comes from a config file like this one.
  YHApp.ZONE_01_OBJECT_PRESENTATION = {
    hoverLabel: 'ОТКРЫТЬ МАТЕРИАЛЫ +',
    emptyMessage: 'МАТЕРИАЛЫ БУДУТ ДОБАВЛЕНЫ'
  };

  YHApp.ZONE_01_PROGRAM_STAGES = [
    { id: 'listen', label: 'Слушать', coords: { x: 70, y: 56.5 } },
    { id: 'research', label: 'Исследовать', coords: { x: 70, y: 59.5 } },
    { id: 'design', label: 'Проектировать', coords: { x: 70, y: 62.5 } },
    { id: 'create', label: 'Создавать', coords: { x: 70, y: 65.5 } }
  ];

  // Spatial-переход в 02, а не content-hotspot — координата ближе к
  // правому краю кадра zone 01 (см. известные ограничения по калибровке
  // выше — тоже первое приближение).
  YHApp.ZONE_01_PASSAGE = {
    id: 'passage-01-02',
    ariaLabel: 'Перейти в исследовательскую',
    hoverLabel: 'ИДТИ →',
    targetZoneId: '02',
    coords: { x: 94, y: 75 } // было 97 — на 1600×900 desktop оказывалось за пределами кадра
  };
})(window.YHApp = window.YHApp || {});
