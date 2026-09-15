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
    // Zone 02/03 BASE v3 (customer, 2026-09-10): "не делать карточки
    // текстом, а просто картинками" — the customer now draws every
    // label/card directly into the BASE herself; core/zone-02-workshop.js
    // and core/zone-03-workshop.js no longer render any HTML annotation
    // cards over these (see those files). Zone 03 keeps exactly one real
    // hotspot (the AI-tools document link — config/zone-03-content.js
    // ZONE_03_AI_LINK); Zone 02 has none (no material URLs ever existed
    // for it — see LINKS.RESEARCH_MATERIAL_URLS, all null).
    'zone-02-desktop': { src: ASSETS_BASE + 'zone-02-desktop-base-cards-baked-v3-4k.png', w: 3840, h: 2160 },
    // customer: "02-03-06 уменьшить масштаб чтобы весь текст был виден" —
    // this image's own aspect (2160x3840, 1.778 h/w — a 16:9 photo just
    // rotated to portrait) is SHORTER-relative-to-width than a real phone
    // screen (~2.16+ h/w), so SceneEngine's cover-fit was always
    // width-bound on an actual phone, cropping some width even at the
    // already-minimum camera scale — a real geometry mismatch, not a
    // camera setting mistake. Padded top+bottom with a blurred stretch of
    // the image's own edge (invisible seam, no hard-edged bar) to reach
    // 2.3 h/w — now wide-open enough that a real phone's cover-fit is
    // height-bound instead, showing the FULL width (all baked-in text)
    // with no crop, at the cost of a bit of decorative
    // ceiling/floor being replaced by soft blur. h updated (3840 -> 4968).
    'zone-02-mobile': { src: ASSETS_BASE + 'zone-02-mobile-base-cards-baked-v3-2160x3840.png', w: 2160, h: 4968 },
    // customer sent a SECOND replacement background for zone 03 (2026-09-14,
    // "замени пожалуйста базу для зоны 3 ... поправить размещение кнопки
    // плюс") — new artwork, same baked-in card layout convention as before.
    // Same architectural crop risk as the FIRST zone-03 background (see the
    // old comment this replaces): raw art was 3840x2160 desktop / 2161x3840
    // mobile — both 1.778 w/h, height-bound at the camera's scale floor on
    // any real desktop window or phone narrower than that ratio, cropping
    // the baked-in card text at the sides. Applied the SAME preventive fix
    // right away this time (blurred top+bottom stretch of the image's own
    // edge, invisible seam) rather than waiting for her to hit it again:
    // desktop padded to 2480 (matches the old file's target), mobile to
    // 4968 (matches the old file's target) — see
    // config/zone-03-content.js for the AI-link coordinates, re-measured
    // against these new images directly (not rescaled from the old ones).
    'zone-03-desktop': { src: ASSETS_BASE + 'zone-03-desktop-cards-v2-4k.png', w: 3840, h: 2480 },
    'zone-03-mobile': { src: ASSETS_BASE + 'zone-03-mobile-cards-v2-2161x4968.png', w: 2161, h: 4968 },

    // Zone 00 Visual Integration: Zone 00 получает СОБСТВЕННЫЙ независимый
    // BASE (больше не делит scene-00-01 с Zone 01 — см. отчёт). Zone 01
    // продолжает использовать 'scene-00-01' без изменений (запись ниже не
    // трогалась). Desktop BASE содержит запечённые intro/CTA/карту —
    // сознательное решение (см. отчёт п.3), не перерисовывается.
    // customer replaced this DESKTOP background again (2026-09-14, "давай
    // заменим фон на зоне 00, перепроверь только размещение кнопок на
    // карте") — new isometric map render, same 3840x2160, no crop-padding
    // needed (checked against the same real-viewport sweep used for
    // zone 02/03/06 — height-bound at the camera's floor scale same as
    // before, no width overflow at any tested width). ZONE_00_NAV_HOTSPOTS
    // and ZONE_00_CTA in config/zone-00-content.js re-measured fresh
    // against this new image.
    'zone-00-desktop': { src: ASSETS_BASE + 'zone-00-base-hackathon-5x5-v4-4k.png', w: 3840, h: 2160 },
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
    // BASE v2 (customer, 2026-09-10): role cards + sponsor/partner logo
    // strip now baked directly into the image (same "не делать карточки
    // текстом" direction as Zone 02/03) — core/zone-06-team.js no longer
    // renders the role annotation cards. The chair/"твоё место" hotspot
    // is untouched (unrelated — that's a real CTA, not a text label).
    'zone-06-desktop': { src: ASSETS_BASE + 'zone-06-desktop-base-cards-baked-v2.png', w: 3840, h: 2161 },
    // customer: "нужно чтоб нижняя навигация не перекрывала логотипы" —
    // the floating bottom nav is fixed-position, always covering roughly
    // the bottom 10% of the viewport, and (proven empirically — a
    // full-bleed "cover" image's bottom edge always lands exactly at the
    // viewport's bottom edge, at any camera scale/position, since
    // SceneEngine's clampTranslate forbids a gap there) NO camera setting
    // can lift real bottom-edge content above that. Padded solid
    // matching near-black onto the bottom of the real photo (the logo
    // strip's own background is already this same near-black, so the
    // seam is invisible) — that's fake "phantom" space the nav sits over
    // instead, pushing the real logos above the danger zone. Padded
    // enough (3839 -> 4968, h/w 2.3) to ALSO fix the same width-crop-on-
    // real-phones issue as Zone 02/03's mobile below (a taller-than-16:9
    // aspect makes a real phone's cover-fit width-bound instead of
    // height-bound, so it shows full width with no crop). ZONE_06_CHAIR's
    // mobile percentages rescaled by the same factor (3839/4968) since
    // they're percent of this same image height.
    'zone-06-mobile': { src: ASSETS_BASE + 'zone-06-mobile-base-cards-baked-v2.png', w: 2160, h: 4968 },

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
      // customer (2026-09-15): "картинка мелко" on a real phone — bumped
      // scale 1.9 -> 2.1 for a visibly bigger starting composition
      // (verified the intro panel's own heading still isn't clipped at
      // this scale — 2.5 already was). See config/zone-00-content.js
      // ZONE_00_NAV_HOTSPOTS for the counterScaleItem fix that keeps the
      // map's 8 dots a real, constant tap size regardless of this zoom.
      mobile: { asset: sceneAsset('zone-00-mobile'), cameraPreset: { x: 48, y: 62, scale: 2.1 }, hotspots: [] }
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
      // BASE v3 recalibration: new image has all labels baked in already
      // spread across most of the frame — scale kept at the floor (1.0,
      // SceneEngine's own minimum) so as little as possible is cropped on
      // any realistic window shape; centered since content doesn't lean
      // hard to one edge like Zone 06/03's did.
      desktop: { asset: sceneAsset('zone-02-desktop'), cameraPreset: { x: 50, y: 50, scale: 1.0 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-02-mobile'), cameraPreset: { x: 50, y: 50, scale: 1.0 }, hotspots: [] }
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
      // BASE "final" recalibration (customer, 2026-09-10): cards/labels
      // now baked directly into the image (see core/zone-03-workshop.js)
      // and already spread across nearly the full frame — scale at the
      // floor (1.0, SceneEngine's own minimum) so as little as possible
      // is cropped; centered.
      desktop: { asset: sceneAsset('zone-03-desktop'), cameraPreset: { x: 50, y: 50, scale: 1.0 }, hotspots: [] },
      mobile: { asset: sceneAsset('zone-03-mobile'), cameraPreset: { x: 50, y: 50, scale: 1.0 }, hotspots: [] }
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
      // BASE v2 recalibration (customer, 2026-09-10): role cards + the new
      // sponsor/partner logo strip are baked into the image now — the
      // logo strip sits hard against the desktop image's RIGHT edge and
      // the mobile image's BOTTOM edge, so scale is kept at the floor
      // (1.0) and desktop x nudged right (48 -> 59, halfway between the
      // leftmost card at ~18% and the logos at ~100%) so both the
      // leftmost card and the logos stay on screen together on realistic
      // window shapes — same reasoning as Zone 07's banner-vs-info-panel
      // fix (see core/mount.js resolveCameraPreset's comment).
      desktop: { asset: sceneAsset('zone-06-desktop'), cameraPreset: { x: 59, y: 50, scale: 1.0 }, hotspots: [] },
      // customer report (2026-09-14, "на телефоне зона 06 немного
      // задрана"): at real phone ratios the bottom black padding (added
      // above to keep the nav off the logos, see zone-06-mobile comment)
      // was only PARTLY cropped away by cover-fit's pan range at scale
      // 1.0 — the sponsor logos ended up sitting well above the nav with
      // a large dead-black gap between them, reading as if the whole
      // scene had been "hiked up". First fix (scale 1.15, y 45) closed
      // that gap to ~4-21px, but follow-up real-device testing
      // (2026-09-15) found it went too far the other way — cropping the
      // "06 ТЕБЕ СЮДА, ЕСЛИ ТЫ..." wall header off the TOP. Covering the
      // full width forces a fixed real-content display height shorter
      // than any real phone viewport, so *something* always has to give
      // (top content, or the bottom gap) — customer's explicit priority
      // this time: "уменьшить зум, чтобы текст на картинке был виден и
      // логотип" (both ends of the content visible matters more than
      // fully closing the gap). Backed off to scale 1.02/y 46.5 — top
      // header now fully visible (only ~3px crop, imperceptible), gap
      // reopens to ~55px (down from the original ~90-113px, just not
      // all the way to ~0) — the best balance found for this image's
      // real content height vs. a real phone viewport.
      mobile: { asset: sceneAsset('zone-06-mobile'), cameraPreset: { x: 50, y: 46.5, scale: 1.02 }, hotspots: [] }
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
