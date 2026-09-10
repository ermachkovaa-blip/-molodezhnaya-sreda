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
    'zone-00-mobile': { src: ASSETS_BASE + 'zone-00-mobile-base-expanded-centered-v2-2160x3840.png', w: 2160, h: 3840 },

    // Zone 04 (АРХИВ / КАРТОТЕКА): СОБСТВЕННЫЙ независимый BASE — больше не
    // делит scene-04-05 с Zone 05 (та запись ниже не трогалась, Zone 05 вне
    // скоупа). "closed" — это состояние ВСЕХ 5 ящиков закрыты; открытые
    // per-town foreground'ы — отдельные full-canvas RGBA-оверлеи того же
    // размера, регистрируются в config/zone-04-content.js, не здесь (эта
    // секция только про сами SCENE_IMAGES/BASE зоны).
    'zone-04-desktop': { src: ASSETS_BASE + 'zone-04-desktop-base-closed-4k.png', w: 3840, h: 2160 },
    'zone-04-mobile': { src: ASSETS_BASE + 'zone-04-mobile-base-closed-2160x3840.png', w: 2160, h: 3840 },

    // Zone 05 (ГАЛЕРЕЯ / БИБЛИОТЕКА): СОБСТВЕННЫЙ независимый BASE —
    // больше не делит scene-04-05 с Zone 04 (та запись выше не трогалась,
    // Zone 04 уже реализована отдельно). Комната пустая — сам стеллаж,
    // полотно и летающие страницы — отдельные PNG-оверлеи поверх этого
    // BASE, регистрируются в config/zone-05-content.js.
    'zone-05-desktop': { src: ASSETS_BASE + 'zone-05-desktop-base-4k.png', w: 3840, h: 2161 },
    'zone-05-mobile': { src: ASSETS_BASE + 'zone-05-mobile-base-2160x3840.png', w: 2160, h: 3840 },

    // Zone 01 (ХОЛЛ) FAST MODE production pass: СОБСТВЕННЫЙ независимый
    // BASE — больше не делит scene-00-01 с Zone 00. Redesign vs. the old
    // shared placeholder: bakes in all 5 program stages (was a known 4-vs-5
    // mismatch), a "принципы хакатона" block, and the 5 objects as physical
    // standing cards on a table, plus the passage-to-02 door.
    'zone-01-desktop': { src: ASSETS_BASE + 'zone-01-desktop-3840x2160.png', w: 3840, h: 2160 },
    'zone-01-mobile': { src: ASSETS_BASE + 'zone-01-mobile-2160x3840.png', w: 2160, h: 3840 },

    // Zone 06 (КОМАНДА) FAST MODE production pass: own dedicated BASE,
    // no longer sharing scene-06-07 with Zone 07 (that entry below is left
    // untouched — Zone 07 gets its own dedicated entry too). This is the
    // "clean" variant (no chair baked in) — the empty chair + "+твоё
    // место" jacket is a separate foreground overlay, see
    // config/zone-06-content.js. Below the project's usual 4K convention
    // (delivered at ~1671x941 / 941x1672) — usable, flagged in preflight.
    // FAST QA replacement (customer-provided high-resolution re-render,
    // 05.09 upload): same approved composition, confirmed by direct visual
    // comparison against the previous file before swapping — camera/
    // hotspots/annotations untouched, only src+w/h updated.
    'zone-06-desktop': { src: ASSETS_BASE + 'zone-06-desktop-base.png', w: 3840, h: 2162 },
    'zone-06-mobile': { src: ASSETS_BASE + 'zone-06-mobile-base.png', w: 2161, h: 3840 },

    // Zone 07 (АМФИТЕАТР) FAST MODE production pass: own dedicated BASE.
    // Desktop delivered at an unusual ~2.45:1 aspect (1964x801, not the
    // usual 16:9) and below the 4K convention — SceneEngine's cover-scale
    // math is aspect-agnostic so this isn't a hard blocker, just flagged.
    // FAST QA replacement (customer-provided high-resolution re-render,
    // 05.09 upload): same approved composition, confirmed by direct visual
    // comparison against the previous file before swapping — camera/
    // hotspots/CTA/banner untouched, only src+w/h updated.
    'zone-07-desktop': { src: ASSETS_BASE + 'zone-07-desktop-base.png', w: 4096, h: 1671 },
    'zone-07-mobile': { src: ASSETS_BASE + 'zone-07-mobile-base.png', w: 2305, h: 4096 }
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
      shared: { id: '00', title: 'УЛИЦА / ВХОД', color: '#e0483e', behavior: 'zone-00-map', navDescription: 'Вход и карта хакатона' },
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
      // FAST MODE production pass: own dedicated BASE (was sharing
      // scene-00-01 with Zone 00 as a placeholder — see SCENE_IMAGES
      // above). cameraPreset framed to show the objects table + passage
      // door together at rest.
      shared: { id: '01', title: 'ХОЛЛ', color: '#f07a1f', behavior: 'object-links', navDescription: 'Пять объектов хакатона' },
      map: { x: 22.4, y: 34.1 },
      mapMobile: { x: 28.31, y: 45.26 },
      desktop: { asset: sceneAsset('zone-01-desktop'), cameraPreset: { x: 55, y: 60, scale: 1.05 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-01-mobile'), cameraPreset: { x: 55, y: 62, scale: 1.15 }, hotspots: [] }
    },
    '02': {
      shared: { id: '02', title: 'ИССЛЕДОВАТЕЛЬСКАЯ', color: '#e8b923', behavior: 'zone-02-annotations', navDescription: 'С чего начинается пространство' },
      map: { x: 33.4, y: 69.2 },
      mapMobile: { x: 34.8, y: 64.33 },
      // Visual Integration (Этап 3+): независимый production BASE, своя
      // калибровка camera под новую композицию (см. отчёт) — не перенос
      // чисел со старого общего scene-02-03.
      desktop: { asset: sceneAsset('zone-02-desktop'), cameraPreset: { x: 45, y: 42, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-02-mobile'), cameraPreset: { x: 50, y: 48, scale: 1.2 }, hotspots: [] }
    },
    '03': {
      shared: { id: '03', title: 'ПРОЕКТНАЯ МАСТЕРСКАЯ', color: '#3f6fd1', behavior: 'zone-03-annotations', navDescription: 'От идей к реальным пространствам' },
      map: { x: 43.8, y: 35.9 },
      mapMobile: { x: 51.74, y: 45.65 },
      // customer: "нужно подвинуть фон вниз, иначе при открытии не видно
      // название зоны" — y lowered (reveals more of the top of the image,
      // where the "03 ПРОЕКТНАЯ МАСТЕРСКАЯ" title lives) and zoomed out a
      // touch so the 6 annotation cards have more room to spread out
      // without overlapping each other or the people at the table.
      desktop: { asset: sceneAsset('zone-03-desktop'), cameraPreset: { x: 55, y: 52, scale: 1.05 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-03-mobile'), cameraPreset: { x: 50, y: 65, scale: 1.2 }, hotspots: [] }
    },
    '04': {
      // Zone 04 Visual Integration: собственный production BASE (шкаф
      // "АРХИВ И КАРТОТЕКА", 5 подписанных ящиков), своя калибровка
      // камеры под новую композицию — не перенос чисел со старого общего
      // scene-04-05 (тот был V1-заглушкой без реального шкафа).
      shared: { id: '04', title: 'АРХИВ / КАРТОТЕКА', color: '#1f8f5f', behavior: 'archive-drawers', navDescription: 'Архив объектов по городам' },
      map: { x: 55.7, y: 69.0 },
      mapMobile: { x: 59.3, y: 64.16 },
      desktop: { asset: sceneAsset('zone-04-desktop'), cameraPreset: { x: 44, y: 46, scale: 1.35 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-04-mobile'), cameraPreset: { x: 50.9, y: 47, scale: 1.32 }, hotspots: [] }
    },
    '05': {
      // Zone 05 Visual Integration: собственный production BASE (двухэтажная
      // библиотека, пустой центр пола под стеллаж), своя калибровка камеры —
      // не перенос чисел со старого общего scene-04-05 (та была V1-заглушкой).
      shared: { id: '05', title: 'ГАЛЕРЕЯ / БИБЛИОТЕКА', color: '#d63e8a', behavior: 'gallery-complex', navDescription: 'Стандарт и материалы проекта' },
      map: { x: 59.2, y: 34.5 },
      mapMobile: { x: 70.01, y: 45.87 },
      desktop: { asset: sceneAsset('zone-05-desktop'), cameraPreset: { x: 45, y: 55, scale: 1.15 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-05-mobile'), cameraPreset: { x: 45, y: 60, scale: 1.15 }, hotspots: [] }
    },
    '06': {
      // FAST MODE production pass: own dedicated BASE (was sharing the
      // scene-06-07 placeholder with Zone 07 — see SCENE_IMAGES above).
      shared: { id: '06', title: 'КОМАНДА', color: '#7a4fc9', behavior: 'team-roles-chair', navDescription: 'Кто создаёт этот хакатон' },
      map: { x: 75.4, y: 68.9 },
      mapMobile: { x: 81.53, y: 64.79 },
      desktop: { asset: sceneAsset('zone-06-desktop'), cameraPreset: { x: 48, y: 55, scale: 1.05 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-06-mobile'), cameraPreset: { x: 50, y: 55, scale: 1.1 }, hotspots: [] }
    },
    '07': {
      // FAST MODE production pass: own dedicated BASE (was sharing
      // scene-06-07 with Zone 06 — see SCENE_IMAGES above).
      shared: { id: '07', title: 'АМФИТЕАТР', color: '#e0692a', behavior: 'apply-cta', navDescription: 'Подать заявку на участие' },
      map: { x: 91.8, y: 37.5 },
      mapMobile: { x: 91.17, y: 46.38 },
      // Zone 07 recalibration pass: slight zoom-out on both platforms — the
      // right information wall was partially cut off at 1.05/1.1.
      // IMPORTANT: SceneEngine clamps focus.scale to [coverScale, 2.6x
      // coverScale] (minScale = base cover scale, i.e. "just barely fills
      // the viewport, no empty margins") — any value below 1.0 collapses
      // to the SAME effective scale as exactly 1.0, since 1.0 already IS
      // that floor. So the requested "5-8% less zoom" from 1.05 can only
      // really reach 1.0 (~4.8% less, the architectural floor) without
      // changing SceneEngine itself (out of scope for this pass) — using
      // a value like 0.97 here would silently do nothing different from
      // 1.0, so this is written as exactly 1.0. Mobile's target (~4-7%
      // less than 1.1) stays above that floor, so 1.03 is fully honored.
      // customer: "зона 7 сильно сдвинула" — shifting the camera enough
      // to keep the (far-left) application banner on-screen at narrow
      // desktop windows visibly moved the whole composition at normal/
      // wide windows too, which she didn't want. Split instead of
      // compromising: the original x:51 framing stays whenever it
      // actually keeps the banner (left edge 15.5%) on screen; only
      // switches to the recentered x:35 preset when it wouldn't.
      // IMPORTANT: a first attempt gated this purely on container WIDTH
      // (≤1300px), which is wrong — clipping is driven by the real
      // cover-scale (max(vw/iw, vh/ih)), and this scene's BASE is an
      // unusually wide 2.45:1 image, so on a viewport that's wide but
      // also tall (e.g. 1512x980, a common MacBook size) the HEIGHT ratio
      // dominates the cover scale and clips the banner even though the
      // window is well past 1300px wide — this is exactly what the
      // customer's next screenshot showed ("зона 7 снова улетела").
      // safeLeftPct (the banner's own left edge, minus a small margin)
      // lets mount.js's resolveCameraPreset() compute the ACTUAL visible
      // left edge from real viewport+image dimensions and switch presets
      // based on that, not a width guess.
      desktop: { asset: sceneAsset('zone-07-desktop'), cameraPreset: { x: 49.5, y: 50, scale: 1.0 }, hotspots: [], safeLeftPct: 17, narrowCameraPreset: { x: 35, y: 50, scale: 1.0 } },
      mobile: { asset: sceneAsset('zone-07-mobile'), cameraPreset: { x: 46, y: 48, scale: 1.03 }, hotspots: [] }
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
