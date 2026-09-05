// SCENES / ZONES CONFIG (V2)
// --------------------------
// Один объект на зону. desktop/mobile — разные asset/cameraPreset/hotspots.
// shared — то, что одинаково независимо от viewport (id, behavior, urls,
// titles). Это прямая реализация решения от 05.09: "desktop и mobile — не
// два приложения, а один config с разными presets".
//
// ЭТАП 1 (V2 shell): hotspots всегда [] — локальные интерактивы зон
// 01/02/03/04/05/06/07 реализуются на следующих этапах поверх этого же
// scene-навигационного каркаса, без изменения SceneEngine/GestureController.
//
// asset пока указывает на РЕАЛЬНЫЕ существующие иллюстрации V1
// (../assets/scenes/...) — это то же самое утверждённое изображение,
// используемое как read-only reference asset для V2 (файлы не копируются
// и не изменяются). Раздельный mobile BASE — целевая схема; там, где его
// ещё нет, mobile.asset временно совпадает с desktop.asset и различается
// только mobile.cameraPreset — переключение на отдельный mobile-файл
// потом не потребует менять компонент (см. решение п.6 от 05.09).

(function (YHApp) {
  'use strict';

  // ВНИМАНИЕ (known issue Этапа 1, см. отчёт): путь относителен местоположению
  // HTML-документа, который грузит эти скрипты (сейчас — /site-v2/embed/demo.html),
  // а не самого scenes.js. Для настоящей Tilda-портативности это поле должно
  // стать настраиваемым параметром mount()/конфига, а не хардкод-константой —
  // отложено до этапа явной Tilda-интеграции, чтобы не усложнять shell раньше времени.
  var ASSETS_BASE = '../../assets/scenes/';

  // канонические пиксельные размеры BASE-иллюстраций (те же исходники,
  // что в V1 js/config.js — числа не придуманы, взяты из реального проекта)
  var SCENE_IMAGES = {
    'scene-00-01': { src: ASSETS_BASE + 'scene-00-01.webp', w: 1536, h: 1024 },
    'scene-02-03': { src: ASSETS_BASE + 'scene-02-03.webp', w: 1716, h: 916 },
    'scene-04-05': { src: ASSETS_BASE + 'scene-04-05.webp', w: 1689, h: 931 },
    'scene-06-07': { src: ASSETS_BASE + 'scene-06-07.webp', w: 1672, h: 941 }
  };

  var MAP_IMAGE_DESKTOP = { src: ASSETS_BASE + 'scene-map.webp', w: 1689, h: 931 };
  var MAP_IMAGE_MOBILE = { src: ASSETS_BASE + 'scene-map-mobile.webp', w: 1024, h: 1536 };

  function sceneAsset(sceneId) {
    var s = SCENE_IMAGES[sceneId];
    return { src: s.src, w: s.w, h: s.h, sceneId: sceneId };
  }

  // camera/map-координаты перенесены из проверенной V1-калибровки
  // (js/config.js ZONES) — это REUSE утверждённых чисел, не новые данные.
  var ZONES = {
    '00': {
      shared: { id: '00', title: 'УЛИЦА / ВХОД', color: '#e0483e', behavior: 'scene-only' },
      map: { x: 7.4, y: 69.2 },
      mapMobile: { x: 8.3, y: 64.9 },
      desktop: { asset: sceneAsset('scene-00-01'), cameraPreset: { x: 50, y: 23, scale: 1.3 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-00-01'), cameraPreset: { x: 50, y: 18, scale: 1.9 }, hotspots: [] }
    },
    '01': {
      shared: { id: '01', title: 'ХОЛЛ', color: '#f07a1f', behavior: 'object-links' },
      map: { x: 22.4, y: 34.1 },
      mapMobile: { x: 28.31, y: 45.26 },
      desktop: { asset: sceneAsset('scene-00-01'), cameraPreset: { x: 40, y: 75, scale: 1.05 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-00-01'), cameraPreset: { x: 35, y: 78, scale: 1.7 }, hotspots: [] }
    },
    '02': {
      shared: { id: '02', title: 'ИССЛЕДОВАТЕЛЬСКАЯ', color: '#e8b923', behavior: 'hotspot-scene' },
      map: { x: 33.4, y: 69.2 },
      mapMobile: { x: 34.8, y: 64.33 },
      desktop: { asset: sceneAsset('scene-02-03'), cameraPreset: { x: 24, y: 40, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-02-03'), cameraPreset: { x: 24, y: 35, scale: 1.5 }, hotspots: [] }
    },
    '03': {
      shared: { id: '03', title: 'ПРОЕКТНАЯ МАСТЕРСКАЯ', color: '#3f6fd1', behavior: 'hotspot-scene' },
      map: { x: 43.8, y: 35.9 },
      mapMobile: { x: 51.74, y: 45.65 },
      desktop: { asset: sceneAsset('scene-02-03'), cameraPreset: { x: 76, y: 45, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-02-03'), cameraPreset: { x: 74, y: 42, scale: 1.5 }, hotspots: [] }
    },
    '04': {
      shared: { id: '04', title: 'АРХИВ / КАРТОТЕКА', color: '#1f8f5f', behavior: 'archive-drawers' },
      map: { x: 55.7, y: 69.0 },
      mapMobile: { x: 59.3, y: 64.16 },
      desktop: { asset: sceneAsset('scene-04-05'), cameraPreset: { x: 24, y: 52, scale: 1.2 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-04-05'), cameraPreset: { x: 22, y: 52, scale: 1.55 }, hotspots: [] }
    },
    '05': {
      shared: { id: '05', title: 'ГАЛЕРЕЯ / БИБЛИОТЕКА', color: '#d63e8a', behavior: 'gallery-complex' },
      map: { x: 59.2, y: 34.5 },
      mapMobile: { x: 70.01, y: 45.87 },
      desktop: { asset: sceneAsset('scene-04-05'), cameraPreset: { x: 78, y: 50, scale: 1.2 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-04-05'), cameraPreset: { x: 80, y: 48, scale: 1.55 }, hotspots: [] }
    },
    '06': {
      shared: { id: '06', title: 'КОМАНДА', color: '#7a4fc9', behavior: 'team-roles-chair' },
      map: { x: 75.4, y: 68.9 },
      mapMobile: { x: 81.53, y: 64.79 },
      desktop: { asset: sceneAsset('scene-06-07'), cameraPreset: { x: 22, y: 48, scale: 1.2 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-06-07'), cameraPreset: { x: 18, y: 48, scale: 1.55 }, hotspots: [] }
    },
    '07': {
      shared: { id: '07', title: 'АМФИТЕАТР', color: '#e0692a', behavior: 'apply-cta' },
      map: { x: 91.8, y: 37.5 },
      mapMobile: { x: 91.17, y: 46.38 },
      desktop: { asset: sceneAsset('scene-06-07'), cameraPreset: { x: 78, y: 48, scale: 1.2 }, hotspots: [] },
      mobile: { asset: sceneAsset('scene-06-07'), cameraPreset: { x: 80, y: 48, scale: 1.55 }, hotspots: [] }
    }
  };

  var ZONE_ORDER = ['00', '01', '02', '03', '04', '05', '06', '07'];

  YHApp.SCENES_CONFIG = {
    zones: ZONES,
    zoneOrder: ZONE_ORDER,
    mapImage: { desktop: MAP_IMAGE_DESKTOP, mobile: MAP_IMAGE_MOBILE },
    mobileBreakpoint: 767
  };
})(window.YHApp = window.YHApp || {});
