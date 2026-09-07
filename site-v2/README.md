# Молодёжная среда — V2 (в разработке)

Изолированная переработка проекта под явное архитектурное требование
Tilda-совместимости (Production-ТЗ от 05.09.2026). Существующая V1
(`/index.html`, `/apply.html`, `/css`, `/js`, `/assets` в корне репозитория)
**остаётся полностью нетронутой** — reference и working backup, пока V2 не
принята.

**Текущий статус: Этап 1 — V2 SHELL.** Реализован каркас навигации
(камера, карта, глобальный CTA, нижний route, ResizeObserver, Pointer
Events, debug-режим). Локальные интерактивы внутри зон (hotspots 01/02/03,
ящики 04, галерея 05, роли/стул 06, CTA 07) и новая форма заявки —
на следующих этапах, по одному через явное подтверждение.

## Быстрый старт (локально)

Модуль — чистый vanilla JS/CSS без сборки. Для теста нужен любой статический
HTTP-сервер, запущенный **из корня репозитория** (относительные пути к
`../../assets/...` рассчитаны на это):

```bash
cd /path/to/-molodezhnaya-sreda
python3 -m http.server 8970
# затем открыть:
# http://localhost:8970/site-v2/embed/demo.html
# http://localhost:8970/site-v2/embed/demo.html?zone=03
# http://localhost:8970/site-v2/embed/demo.html?debug=1
```

## Структура

```
/site-v2
  /core      — SceneEngine, GestureController, GlobalNav, MapNavigation,
               DebugOverlay, mount.js (публичный API)
  /config    — scenes.js (zones+camera+assets), links.js (destinations),
               ui-strings.js
  /css       — app.css, всё scoped под .yh-app
  /embed     — demo.html (standalone-запуск для разработки/демонстрации)
  /tests     — Playwright smoke-тесты + свой package.json (dev-only)
```

## Публичный API

```html
<div id="youth-hackathon-app"></div>
<script src="config/links.js"></script>
<script src="config/scenes.js"></script>
<script src="config/ui-strings.js"></script>
<script src="core/scene-engine.js"></script>
<script src="core/gesture-controller.js"></script>
<script src="core/global-nav.js"></script>
<script src="core/map-navigation.js"></script>
<script src="core/debug-overlay.js"></script>
<script src="core/mount.js"></script>
<script>
  var instance = YHApp.mount(document.getElementById('youth-hackathon-app'), {
    scenes: YHApp.SCENES_CONFIG,
    links: YHApp.LINKS,
    uiStrings: YHApp.UI_STRINGS,
    debug: false,        // необязательно
    initialZone: null    // необязательно, например '03'
  });

  instance.showZone('05');
  instance.showMap();
  instance.unmount();
</script>
```

Подробности embed-режима, ограничений и требований к контейнеру —
`TILDA-INTEGRATION.md` рядом с этим файлом.

## Как обновлять документы и ссылки после публикации

Все внешние destinations (заявка, PDF программы, папки материалов и т.д.)
живут в ОДНОМ файле — `config/links.js`. Ни одна зона, hotspot или
анимация не хранит URL внутри себя — это единственное место, которое
нужно редактировать после публикации в Tilda, без прикосновения к
SceneEngine, hotspot-логике или коду сцен.

Каждое поле — либо строка-URL, либо `null`. Пока поле `null`, интерактив
остаётся полностью рабочим (hotspot/CTA кликабелен), но вместо перехода
показывает соответствующий текст-заглушку ("...БУДЕТ ДОБАВЛЕН(-А/-О)") —
ничего не выдумывается и не ломается, если ссылки ещё нет.

| Поле в `config/links.js` | Что открывает | Где используется |
|---|---|---|
| `APPLICATION_URL` | Форма подачи заявки | Глобальный CTA "ПОДАТЬ ЗАЯВКУ ↗" (шапка, все зоны), кресло в Zone 06, финальный CTA в Zone 07 |
| `PROGRAM_URL` | PDF/документ полной программы хакатона | Top-nav "ПРОГРАММА" → вторичный CTA "ПОЛНАЯ ПРОГРАММА ↓" (открывается в новой вкладке, target=_blank/rel=noopener) |
| `STANDARD_URL` | Стандарт деятельности молодёжных центров | Zone 05, шкаф |
| `RENOVATION_ARCHIVE_URL` | Раздел программы реновации на сайте молодёжных центров РТ | Zone 05, тканевый баннер |
| `OBJECT_MATERIAL_URLS.<id>` | Папка исходных материалов по объекту (bugulma/elabuga/shemordan/laishevo/stolbishche) | Zone 01, 5 hotspot'ов объектов |
| `RESEARCH_MATERIAL_URLS.<key>` | Материалы исследования по типу (site-visit, interview, observation, photo-fixation, territory-research, plans-work) | Zone 02 |
| `PROJECT_MATERIAL_URLS.<key>` | Материалы проектирования по типу (plan, tracing-paper, model, laptop, schemes, materials) | Zone 03 |

Чтобы добавить или заменить ссылку: открыть `config/links.js`, заменить
`null` (или существующую строку) на новый URL в кавычках, сохранить. Файл
загружается раньше всех остальных скриптов модуля (см. "Публичный API"
выше) — никакой пересборки или изменения другого кода не требуется.

## Тесты

```bash
cd site-v2/tests
YH_BASE_URL=http://localhost:8970 npx playwright test
```

См. `tests/shell.spec.js` — обязательные 4 viewport (1600×900, 1440×900,
390×844, 430×932), проверки карты/навигации/CTA/ResizeObserver/CSS-изоляции.
