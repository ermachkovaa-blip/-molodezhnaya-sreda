// @ts-check
const { defineConfig } = require('@playwright/test');

// Тесты сами задают viewport per-describe (см. shell.spec.js) — 4
// обязательных viewport из Production-ТЗ (1600×900, 1440×900, 390×844,
// 430×932) реализованы как test.use() внутри спеков, а не как projects
// здесь, чтобы один и тот же файл явно перечислял оба requirements рядом.
//
// YH_BASE_URL по умолчанию рассчитывает на локальный статический сервер
// из корня репозитория (см. README рядом): python3 -m http.server 8970
module.exports = defineConfig({
  testDir: '.',
  timeout: 30000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || '/opt/pw-browsers/chromium'
    },
    trace: 'off',
    screenshot: 'only-on-failure'
  }
});
