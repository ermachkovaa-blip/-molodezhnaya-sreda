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
    'scene-04-05': { src: ASSETS_BASE + 'scene-04-05.webp', w: 1689, h: 931 },
    'scene-06-07': { src: ASSETS_BASE + 'scene-06-07.webp', w: 1672, h: 941 },

    // Zone 02/03 Visual Integration (после Этапа 3): старый общий widescreen
    // scene-02-03.webp (одна картинка на обе зоны, разные cameraPreset)
    // БОЛЬШЕ НЕ source of truth для 02/03 — заменён независимыми
    // production-BASE (см. отчёт Visual Integration). Сам файл
    // scene-02-03.webp не удалён (это существующий V1-asset, V1 его
    // по-прежнему использует) — здесь просто больше нет на него ссылки.
    // Имена файлов — фактические, переданные заказчиком, не переименованы
    // "для единообразия".
    //
    // Zone 02 BASE UPDATE (после Visual Integration): первая версия
    // (zone-02-base-clean-4k.png / zone-02-mobile-base-2160x3840.png)
    // заменена заказчиком версией v2 (изменено содержимое исследовательской
    // стены — карты/схемы/материалы интервью/отчёты вместо фотогалереи).
    // Старые файлы удалены из репозитория (это V2-специфичные assets, не
    // общие с V1, в отличие от scene-02-03.webp — удалять их безопасно).
    'zone-02-desktop': { src: ASSETS_BASE + 'zone-02-desktop-base-research-wall-v2-4k.png', w: 3840, h: 2160 },
    'zone-02-mobile': { src: ASSETS_BASE + 'zone-02-mobile-base-research-wall-v2-2160x3840.png', w: 2160, h: 3840 },
    'zone-03-desktop': { src: ASSETS_BASE + 'zone-03-project-workshop-realistic-expanded-4k.png', w: 3840, h: 2160 },
    'zone-03-mobile': { src: ASSETS_BASE + 'zone-03-mobile-base-clean-realistic-4k.png', w: 2160, h: 3840 },

    // Zone 00 Visual Integration: Zone 00 получает СОБСТВЕННЫЙ независимый
    // BASE (больше не делит scene-00-01 с Zone 01 — см. отчёт). Zone 01
    // продолжает использовать 'scene-00-01' без изменений (запись ниже не
    // трогалась). Desktop BASE содержит запечённые intro/CTA/карту —
    // сознательное решение (см. отчёт п.3), не перерисовывается.
    'zone-00-desktop': { src: ASSETS_BASE + 'zone-00-base-clean-map-4k-sharp-v3.png', w: 3840, h: 2160 },
    // Zone 00 mobile FINAL RECALIBRATION: заменяет provisional
    // zone-00-mobile-base-clean-4k.png (удалён из репозитория — тот BASE
    // не содержал ни intro-стенда, ни стенда "КАРТА ХАКАТОНА"). Новый
    // BASE показывает оба физических стенда сразу, с запасом для pan.
    'zone-00-mobile': { src: ASSETS_BASE + 'zone-00-mobile-base-expanded-centered-v2-2160x3840.png', w: 2160, h: 3840 }
  };

  var MAP_IMAGE_DESKTOP = { src: ASSETS_BASE + 'scene-map.webp', w: 1689, h: 931 };
  var MAP_IMAGE_MOBILE = { src: ASSETS_BASE + 'scene-map-mobile.webp', w: 1024, h: 1536 };

  // ВАЖНО (уточнение от 05.09, до реализации 02/03): sceneAsset() возвращает
  // НОВЫЙ объект при каждом вызове — zone.desktop.asset и zone.mobile.asset
  // для 00 и 01 (или любой другой пары) СЕГОДНЯ ссылаются на один и тот же
  // файл только потому, что оба вызова передают один sceneId; это факт
  // ДАННЫХ (ниже, в ZONES), а не архитектурное ограничение. SceneEngine и
  // mount.js сравнивают только asset.src (строку) при решении, перезагружать
  // ли <img> — ничего в рантайме не предполагает, что у двух зон общий файл.
  // Если позже 00.desktop.asset / 00.mobile.asset / 01.desktop.asset /
  // 01.mobile.asset понадобятся как четыре независимых изображения — это
  // правится только здесь, в ZONES ниже (например, добавлением новой записи
  // в SCENE_IMAGES и вызовом sceneAsset('новый-id') для нужной ветки) без
  // единой правки SceneEngine/mount.js/hotspot-layer.js. Аналогично для
  // будущих 02/03.
  function sceneAsset(sceneId) {
    var s = SCENE_IMAGES[sceneId];
    return { src: s.src, w: s.w, h: s.h, sceneId: sceneId };
  }

  // camera/map-координаты перенесены из проверенной V1-калибровки
  // (js/config.js ZONES) — это REUSE утверждённых чисел, не новые данные.
  var ZONES = {
    '00': {
      // Zone 00 Visual Integration: первый локальный интерактив у Zone 00
      // (было 'scene-only' — вообще без поведения). Собственный BASE,
      // собственная калибровка камеры — не перенос чисел от старого
      // scene-00-01.
      shared: { id: '00', title: 'УЛИЦА / ВХОД', color: '#e0483e', behavior: 'zone-00-map' },
      map: { x: 7.4, y: 69.2 },
      mapMobile: { x: 8.3, y: 64.9 },
      desktop: { asset: sceneAsset('zone-00-desktop'), cameraPreset: { x: 45, y: 55, scale: 1.2 }, hotspots: [] },
      // mobile FINAL RECALIBRATION: centered so the initial composition
      // shows BOTH physical stands (intro ~x:26-45,y:52-72 and
      // "КАРТА ХАКАТОНА" ~x:48-70,y:50-73) at once, with headroom for pan
      // in every direction — not a perimeter-tight crop.
      mobile: { asset: sceneAsset('zone-00-mobile'), cameraPreset: { x: 48, y: 62, scale: 1.3 }, hotspots: [] }
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
      // Visual Integration (Этап 3+): независимый production BASE, своя
      // калибровка camera под новую композицию (см. отчёт) — не перенос
      // чисел со старого общего scene-02-03.
      desktop: { asset: sceneAsset('zone-02-desktop'), cameraPreset: { x: 45, y: 42, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-02-mobile'), cameraPreset: { x: 50, y: 48, scale: 1.5 }, hotspots: [] }
    },
    '03': {
      shared: { id: '03', title: 'ПРОЕКТНАЯ МАСТЕРСКАЯ', color: '#3f6fd1', behavior: 'hotspot-scene' },
      map: { x: 43.8, y: 35.9 },
      mapMobile: { x: 51.74, y: 45.65 },
      desktop: { asset: sceneAsset('zone-03-desktop'), cameraPreset: { x: 55, y: 63, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-03-mobile'), cameraPreset: { x: 50, y: 65, scale: 1.5 }, hotspots: [] }
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
