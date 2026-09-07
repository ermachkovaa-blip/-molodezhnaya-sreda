// ЦЕНТРАЛИЗОВАННЫЕ DESTINATIONS (V2 / Tilda-ready)
// -------------------------------------------------
// Единственное место в модуле, где живут внешние адреса. Компоненты зон
// НИКОГДА не хардкодят URL — только читают их отсюда через config,
// переданный в YHApp.mount(root, config).
//
// APPLICATION_URL сейчас указывает на существующую прототипную форму V1
// (../apply.html) — это сознательный, временный prototype-destination:
// он реально работает и переиспользуется до появления собственной формы
// V2 / Tilda-страницы. Замена этого одного поля не требует переписывать
// ни одну зону 00–07 — таков и есть весь смысл централизации.
//
// Остальные поля — null, пока заказчик не передал точные ссылки. Ничего
// не выдумываем (см. Production-ТЗ п.21 и решения по аудиту от 05.09).

(function (YHApp) {
  'use strict';

  YHApp.LINKS = {
    APPLICATION_URL: '../apply.html',

    // Стандарт деятельности молодёжных центров (зона 05, шкаф).
    STANDARD_URL: null,

    // Сайт молодёжных центров РТ, раздел программы реновации (зона 05,
    // тканевый баннер). НЕ путать с V1-полем externalLibraryUrl — это
    // разные destinations до явного подтверждения обратного.
    RENOVATION_ARCHIVE_URL: null,

    // Полная программа хакатона (PDF/документ) — top-nav "ПРОГРАММА" пункт,
    // вторичный CTA "ПОЛНАЯ ПРОГРАММА ↓". Открывается в новом табе
    // (target=_blank, rel=noopener noreferrer), никогда не встраивается в
    // сцену. null, пока заказчик не передал ссылку — ничего не выдумано.
    PROGRAM_URL: null,

    // Zone 07 contact/application banner (core/zone-07-cta.js). Submission
    // priority: CONTACT_FORM_ENDPOINT (real POST) > CONTACT_EMAIL (mailto
    // fallback — opens the visitor's own mail client, never claimed as a
    // confirmed "sent") > both null (no fake submission — shows "КОНТАКТ
    // ДЛЯ ОБРАТНОЙ СВЯЗИ БУДЕТ ДОБАВЛЕН"). Neither invented — null until
    // the заказчик provides one.
    CONTACT_EMAIL: null,
    CONTACT_FORM_ENDPOINT: null,

    // Зона 01 — прямые ссылки на папки материалов по объекту (Яндекс.Диск
    // и т.п.). Зона 04 — ссылки на папку архива по объекту. Поля намеренно
    // раздельные (sourceMaterialsUrl / archiveFolderUrl) — не предполагаем,
    // что это одна и та же ссылка, пока не подтверждено.
    OBJECT_MATERIAL_URLS: {
      bugulma: { sourceMaterialsUrl: null, archiveFolderUrl: null },
      elabuga: { sourceMaterialsUrl: null, archiveFolderUrl: null },
      shemordan: { sourceMaterialsUrl: null, archiveFolderUrl: null },
      laishevo: { sourceMaterialsUrl: null, archiveFolderUrl: null },
      stolbishche: { sourceMaterialsUrl: null, archiveFolderUrl: null }
    },

    // Зона 02 — материалы исследования, по типу материала. Ключи — id
    // hotspot'ов из config/zone-02-content.js (ZONE_02_HOTSPOTS), значения —
    // url|null. Заполняется по мере передачи ссылок — сейчас все null,
    // ничего не выдумано. 'research-materials' — новый 5-й annotation
    // (стопка методических материалов на столе), добавлен вместе с
    // остальными при переходе Zone 02 на единую annotation-систему.
    // 'site-visit' / 'plans-work' больше не рендерятся как отдельные
    // annotations (см. zone-02-content.js), но ключи оставлены на случай,
    // если этот контент понадобится позже — не удалены, не потеряны.
    RESEARCH_MATERIAL_URLS: {
      'site-visit': null,
      'interview': null,
      'observation': null,
      'photo-fixation': null,
      'territory-research': null,
      'plans-work': null,
      'research-materials': null
    },

    // Зона 03 — материалы проектирования, по типу материала. Ключи — id
    // hotspot'ов из config/zone-03-content.js (ZONE_03_HOTSPOTS).
    PROJECT_MATERIAL_URLS: {
      'plan': null,
      'tracing-paper': null,
      'model': null,
      'laptop': null,
      'schemes': null,
      'materials': null
    }
  };
})(window.YHApp = window.YHApp || {});
