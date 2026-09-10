// UI-строки шелла V2. Только то, что реально используется на Этапе 1
// (глобальная навигация, карта, debug HUD) — тексты локальных интерактивов
// зон добавляются вместе с самими зонами на следующих этапах.

(function (YHApp) {
  'use strict';

  YHApp.UI_STRINGS = {
    applyCta: 'ПОДАТЬ ЗАЯВКУ ↗',
    mapReturn: 'КАРТА ↑',
    sceneNextPrefix: 'Далее:',
    mapTitle: 'МОЛОДЁЖНАЯ СРЕДА',
    // customer: "давай на мобильной версии верхнюю навигацию спрячем в 3
    // точки" — icon-style toggle instead of a text "МЕНЮ" label.
    topNavMenuLabel: '⋯',
    bottomNavHereLabel: 'ТЫ ЗДЕСЬ'
  };

  // TOP NAVIGATION — a second, independent nav system layered over the
  // header (see core/global-nav.js): content-level links, NOT the spatial
  // zone route (that's the bottom nav, untouched). Each item jumps to the
  // zone that owns that content — the simplest option (reuses the exact
  // same onZoneSelect the bottom nav already calls), not an in-zone
  // scroll/focus anchor to a sub-section.
  //
  // ASSUMPTION FLAGGED (unconfirmed): "О ПРОЕКТЕ" and "УЧАСТИЕ" don't
  // map 1:1 onto an existing zone the way "КОМАНДА"->06 obviously does.
  // Picked: О ПРОЕКТЕ -> 01 (the intro/"молодые проектируют для молодых"
  // space), ОБЪЕКТЫ -> 04 (the dedicated per-object archive, not 01's
  // object-table glimpse), ПРОГРАММА -> 01 (bakes the program timeline),
  // УЧАСТИЕ -> 07 (the final application/conversion zone). Easy to
  // repoint any single entry's zoneId below if any of these guesses are
  // wrong — nothing else depends on this exact mapping.
  YHApp.TOP_NAV_ITEMS = [
    { id: 'about', label: 'О ПРОЕКТЕ', zoneId: '01' },
    { id: 'objects', label: 'ОБЪЕКТЫ', zoneId: '04' },
    { id: 'program', label: 'ПРОГРАММА', zoneId: '01' },
    { id: 'team', label: 'КОМАНДА', zoneId: '06' },
    { id: 'participation', label: 'УЧАСТИЕ', zoneId: '07' }
  ];
})(window.YHApp = window.YHApp || {});
