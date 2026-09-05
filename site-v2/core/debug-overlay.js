// DebugOverlay — ?debug=1 / config.debug. Переключается классом на
// root-контейнере модуля (.yh-app--debug), НЕ на document.body — важное
// отличие от V1 (см. аудит, п.17), нужное для embed-режима, где модуль
// не должен трогать body хоста.

(function (YHApp) {
  'use strict';

  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function createDebugOverlay(root) {
    var hud = el('div', 'yh-debug-hud');
    hud.hidden = true;
    root.appendChild(hud);

    var enabled = false;

    function setEnabled(v) {
      enabled = !!v;
      root.classList.toggle('yh-app--debug', enabled);
      hud.hidden = !enabled;
    }

    function update(info) {
      if (!enabled) return;
      hud.textContent =
        'zone: ' + info.zoneId + '\n' +
        'mode: ' + (info.isMobile ? 'mobile' : 'desktop') + '\n' +
        'camera x/y: ' + info.focus.x + ' / ' + info.focus.y + '\n' +
        'scale: ' + info.scale.toFixed(3) + '\n' +
        'viewport: ' + info.viewportW + '×' + info.viewportH + '\n' +
        'DPR: ' + window.devicePixelRatio;
    }

    function isEnabled() { return enabled; }

    function destroy() { hud.remove(); }

    return { setEnabled: setEnabled, isEnabled: isEnabled, update: update, destroy: destroy };
  }

  YHApp.createDebugOverlay = createDebugOverlay;
})(window.YHApp = window.YHApp || {});
