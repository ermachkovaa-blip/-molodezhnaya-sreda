// Zone 06 (КОМАНДА) — declarative data for behavior 'team-roles-chair'
// (see core/zone-06-team.js). FAST MODE production pass (01+06+07).
//
// ASSET NOTE: the delivered package included two near-identical desktop
// renders of this room — one with an empty chair + "+твоё место" jacket
// already baked in, one without — plus a separate isolated cutout of that
// exact chair+jacket (transparent background). Pixel-compared both: the
// "without" pair (this file's zone-06-desktop/zone-06-mobile BASE) is the
// one meant to receive the cutout as a real foreground object per this
// pass's own spec ("используй foreground asset кресла... внутри
// .yh-scene-stage") — the chair-baked-in variant is an unused draft,
// superseded by this separation. The chair cutout itself was delivered as
// a flattened RGB PNG with a baked-in checkerboard "transparency preview"
// background (no real alpha) — keyed out via chroma+brightness scoring
// (background is desaturated AND bright; jacket/wood/leather are either
// dark or clearly saturated) to produce a real alpha PNG before use.
//
// PEOPLE / ROLES: заказчик передала 6 ролей с hover-текстом (сообщение
// "давай сразу же присвоим каждому человеку роль"). На сцене — 5
// адресуемых hotspot'ов (person-1..5, слева направо); ролей — 6. Назначены
// первые 5 из переданного списка в том же порядке, слева направо —
// 'Исследователь' (6-я) пока не привязан ни к одному hotspot'у за
// неимением шестого человека в кадре (см. ZONE_06_UNASSIGNED_ROLE ниже).

(function (YHApp) {
  'use strict';

  var ASSETS_BASE = '../../assets/scenes/';

  YHApp.ZONE_06_CHAIR = {
    asset: { src: ASSETS_BASE + 'zone-06-chair-foreground.png', w: 1312, h: 1199 },
    // percent box (object-fit:contain, object-position:center bottom —
    // rests on the floor/rug, doesn't hang) the chair PNG is placed in,
    // over the empty gap at the front-center of the table.
    desktop: { left: 45, top: 48, width: 16, height: 40 },
    // mobile Y-axis percentages (top/height/hotspot y/hotspot size h)
    // rescaled by 3839/4968 — see config/scenes.js zone-06-mobile comment
    // (bottom-padded both to keep the nav off the logo strip AND to fix
    // the same width-crop-on-real-phones issue as Zone 02/03's mobile);
    // X-axis values are untouched since only height was padded.
    mobile: { left: 53, top: 23.2, width: 25, height: 27.8 },
    hotspotDesktopCoords: { x: 52, y: 72 },
    hotspotDesktopSize: { w: 14, h: 34 },
    hotspotMobileCoords: { x: 65, y: 40.2 },
    hotspotMobileSize: { w: 22, h: 20.1 }
  };

  // desktopCoords/mobileCoords are first-pass percentage-grid estimates
  // against the actual BASE (see preflight), covering the 5 people
  // gathered directly at the main table — not the 3 blurred/peripheral
  // figures near the easels, which are harder to hotspot precisely and
  // less central to "team" focus.
  // desktopCalloutCoords/mobileCalloutCoords — the role card's own anchor
  // (see core/spatial-annotations.js), staggered up/down per person so
  // five cards fit around a tightly-packed table cluster without
  // overlapping, connected by a short line back to desktopCoords/
  // mobileCoords (the person's own chest/shoulder point, unchanged) —
  // same object-centric recompose approach already used for Zone 03/02,
  // chosen to clear each person's face (cards sit above the head, not
  // over it) rather than defaulting to "straight up" for everyone.
  // customer revision: "на десктоп версии можно еще немного разнести
  // карточки от людей" — each card pushed ~20% further along its own
  // existing direction from its person (not re-aimed, just farther).
  // "на мобильной версии нужно тоже разнести и раскидать, например
  // архитектора разместить под человеком а на его место поставить
  // урбаниста" — mobile callouts for person-1/person-3 swapped (architect
  // now sits below its own person; urbanist takes architect's old spot),
  // the rest spread further apart so none overlap each other, a person,
  // or the wall text.
  // MOBILE re-layout (this pass): the previous mobileCalloutCoords were
  // tuned while every card was silently rendering ~2x too small (see the
  // resolution-independence bug fixed in core/spatial-annotations.js —
  // card on-screen size used to be coupled to the shipped image's raw
  // pixel resolution, not just the viewport). Once cards render at their
  // real, correct size, those old positions overlapped badly ("зона 6...
  // стало плохо"). Recomputed as two fixed columns (left: урбанист above
  // архитектор; right: визуализатор above проектировщик above дизайнер,
  // matching the customer's original left/right + top/bottom-band spec)
  // using the actual measured card heights at 375px so no two cards
  // overlap, converted through the real camera matrix at that width
  // (scale 0.229, translate -60.1/-80 — see core/scene-engine.js) rather
  // than eyeballed. Re-verified via Playwright at 360/375/390/430px.
  YHApp.ZONE_06_PEOPLE = [
    { id: 'person-1', role: 'АРХИТЕКТОР', roleText: 'Собирает исследование и сценарии в пространственное решение.', desktopCoords: { x: 33, y: 62 }, mobileCoords: { x: 35, y: 60 }, desktopCalloutCoords: { x: 11.4, y: 56 }, mobileCalloutCoords: { x: 16, y: 47.27 } },
    { id: 'person-2', role: 'ДИЗАЙНЕР', roleText: 'Формирует визуальный язык и атмосферу пространства.', desktopCoords: { x: 40, y: 58 }, mobileCoords: { x: 43, y: 57 }, desktopCalloutCoords: { x: 28, y: 67.6 }, mobileCalloutCoords: { x: 49, y: 59.98 } },
    { id: 'person-3', role: 'УРБАНИСТ', roleText: 'Связывает объект с территорией и городскими сценариями.', desktopCoords: { x: 47, y: 56 }, mobileCoords: { x: 50, y: 55 }, desktopCalloutCoords: { x: 43.4, y: 41.6 }, mobileCalloutCoords: { x: 16, y: 37.12 } },
    { id: 'person-4', role: 'ПРОЕКТИРОВЩИК', roleText: 'Превращает концепцию в логичное и реализуемое решение.', desktopCoords: { x: 54, y: 53 }, mobileCoords: { x: 57, y: 52 }, desktopCalloutCoords: { x: 61.2, y: 42.2 }, mobileCalloutCoords: { x: 49, y: 48.55 } },
    { id: 'person-5', role: 'ВИЗУАЛИЗАТОР', roleText: 'Помогает увидеть проект до его реализации.', desktopCoords: { x: 60, y: 57 }, mobileCoords: { x: 64, y: 57 }, desktopCalloutCoords: { x: 64.8, y: 57 }, mobileCalloutCoords: { x: 49, y: 37.12 } }
  ];

  // переданная, но пока не привязанная 6-я роль — оставлена здесь, чтобы не
  // потерять текст, если появится 6-й человек в кадре или произойдёт замена.
  YHApp.ZONE_06_UNASSIGNED_ROLE = { role: 'ИССЛЕДОВАТЕЛЬ', roleText: 'Помогает понять территорию, людей и реальные запросы.' };

  // Same fixed-px-shrinks-with-camera-scale bug found and fixed for Zone
  // 01 (see that content file's ZONE_01_HOTSPOT_SIZE comment) — measured
  // here too: person hotspots were 44.2px desktop (fine, scale~1.005) but
  // only ~24.4px mobile (scale~0.555, fails the required 44px). Sized as
  // percent of the scene image instead, with margin.
  YHApp.ZONE_06_PERSON_HOTSPOT_SIZE = {
    desktop: { w: 3, h: 5 },
    mobile: { w: 9, h: 5 }
  };

  YHApp.ZONE_06_PRESENTATION = {
    chairHoverLabel: 'ПОДАТЬ ЗАЯВКУ →',
    // short hover/focus hint (desktop) + tap target (mobile) — same
    // "hoverLabel always visible, click/tap reveals the honest fallback"
    // pattern already used for Zone 01's object hotspots.
    personHoverLabel: 'РОЛЬ +',
    roleFallback: 'РОЛЬ БУДЕТ ДОБАВЛЕНА'
  };
})(window.YHApp = window.YHApp || {});
