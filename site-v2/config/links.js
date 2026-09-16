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

    // Стандарт деятельности молодёжных центров (зона 05, розовая книга на шкафу).
    STANDARD_URL: 'https://mctatarstan.ru/standart',

    // Сайт молодёжных центров РТ, раздел программы реновации (зона 05,
    // тканевый баннер/полотно).
    RENOVATION_ARCHIVE_URL: 'https://mctatarstan.ru/renovation_program',

    // Полная программа хакатона (PDF/документ) — top-nav "ПРОГРАММА" пункт,
    // вторичный CTA "ПОЛНАЯ ПРОГРАММА ↓". Открывается в новом табе
    // (target=_blank, rel=noopener noreferrer), никогда не встраивается в
    // сцену. null, пока заказчик не передал ссылку — ничего не выдумано.
    PROGRAM_URL: null,

    // Zone 07 contact/application banner (core/zone-07-cta.js). Submission
    // priority: CONTACT_FORM_ENDPOINT (real POST) > CONTACT_EMAIL (mailto
    // fallback — opens the visitor's own mail client, never claimed as a
    // confirmed "sent") > both null (no fake submission — shows "КОНТАКТ
    // ДЛЯ ОБРАТНОЙ СВЯЗИ БУДЕТ ДОБАВЛЕН").
    // customer (2026-09-16): "нужно чтобы сообщения приходили мне на
    // почту" — deployed her own Google Apps Script Web App (doPost calls
    // MailApp.sendEmail to her address, same JSON shape this form already
    // posts) and sent the real /exec URL below, so CONTACT_FORM_ENDPOINT
    // now wins the branch in core/zone-07-cta.js and every submission
    // sends automatically — no visitor action needed. CONTACT_EMAIL is
    // kept filled in too, but NOTE it is NOT a live runtime fallback: the
    // branch below picks ONE path when the form is built (endpoint if
    // set, else mailto, else neither) — a failed fetch to the endpoint at
    // submit time just shows the error message, it does not fall through
    // to mailto. CONTACT_EMAIL only matters again if CONTACT_FORM_ENDPOINT
    // is ever cleared back to null.
    CONTACT_EMAIL: 'ermachkova.a@gmail.com',
    CONTACT_FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbzpEcuF_hgh4j7jtIGwTPPkpAOBCKb8z_ZB_Wg4RKdt1wMzsKi3xZlRdMNIzZ92H0xk0A/exec',

    // site-v2/apply.html — the full multi-step hackathon APPLICATION form
    // (distinct from CONTACT_FORM_ENDPOINT above, which is Zone 07's small
    // "написать нам" question form). Google Apps Script Web App URL,
    // ending in /exec — customer is setting this up on her own Google
    // account (never share account access, only the resulting URL).
    // null until she sends it — no fake "отправлено" without a real
    // endpoint, same principle as every other submission path here.
    APPLICATION_FORM_ENDPOINT: 'https://script.google.com/macros/s/AKfycbyOg80ZMZFkv4aKdAAOG3gcp0tkSDo5r2SuxtvN8dlMwm7MIv-9UuopgDqNEkWxGTy8Lg/exec',

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
    // Zone 01 — FAST PASS "action-marker" button per object card (a
    // separate, always-visible circle→pill link next to each of the 5
    // object stands, additional to the existing invisible whole-card
    // hotspot above). Deliberately flat, per-object keys — NOT the same
    // as OBJECT_MATERIAL_URLS above (predates this pass, not read by any
    // zone yet) and NOT shared with Zone 04's archiveFolderUrl (objects.js)
    // — Zone 01 links to the object's own source-materials folder, Zone 04
    // is its own archive; never assumed identical (see zone-01-content.js).
    OBJECT_BUGULMA_URL: 'https://drive.google.com/drive/folders/1-D3LoAqeLEJUKXy1d55Pngv7w33BWyYM?usp=share_link',
    OBJECT_ELABUGA_URL: 'https://drive.google.com/drive/folders/19pXmMm9erFi8ebbvxLCCi5e02betYnij?usp=share_link',
    OBJECT_SHEMORDAN_URL: 'https://drive.google.com/drive/folders/1zom-j6g0QGn7fHlMFdWYPwVneTqv0CC3?usp=share_link',
    OBJECT_LAISHEVO_URL: 'https://drive.google.com/drive/folders/1MZcr9SejoT3bsmuoehkb1cyOyTU4dNaB?usp=share_link',
    OBJECT_STOLBISCHE_URL: 'https://drive.google.com/drive/folders/1046aKyz9-tZ50MZHQ1uOpCHgRN6ml4iA?usp=share_link',

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
      // Zone 03 'laptop' card ("AI-ИНСТРУМЕНТЫ") — the AI/neural-network
      // tools document built for this block, approved by the customer
      // ("AI-инструменты согласованы") including the later-added city/
      // resident/territory-analysis category. Customer asked (2026-09-10)
      // for this to open as a standalone document instead of a claude.ai
      // page — content was turned into a PDF (slide-deck format, her
      // request) and she uploaded it herself to her own Google Drive;
      // this is that real link (2026-09-14), replacing the old
      // claude.ai/code/artifact/... link.
      'laptop': 'https://drive.google.com/file/d/16g9KkSeP0ZgUuz5w3gqEM4mw_woY38A7/view?usp=sharing',
      'schemes': null,
      'materials': null
    }
  };
})(window.YHApp = window.YHApp || {});
