// GestureController — унифицированный Pointer Events drag/tap controller.
//
// Заменяет V1-паттерн "раздельные mousedown/touchstart + implicit click".
// Единственный источник истины о том, был ли жест тапом или драгом —
// explicit threshold (TAP_THRESHOLD_PX), а не то, что "браузер сам как-то
// разберётся" между click и touch-событиями.
//
// Контракт:
//   var gesture = YHApp.createGestureController(target, {
//     onDragStart(x, y), onDragMove(dx, dy, x, y), onDragEnd(wasDrag),
//     onTap(x, y, originalEvent)
//   });
// target получает pointerdown/move/up/cancel через setPointerCapture —
// работает одинаково для мыши, touch и pen без отдельных веток кода.
//
// Второе назначение: подавление "призрачного" click на дочернем hotspot,
// если жест на самом деле был drag'ом сцены (см. suppressNextClick) —
// в V1 это не было явно реализовано (см. аудит, п.8/10).

(function (YHApp) {
  'use strict';

  var TAP_THRESHOLD_PX = 6;
  var TAP_MAX_DURATION_MS = 600;

  function createGestureController(target, handlers) {
    handlers = handlers || {};
    var onDragStart = handlers.onDragStart || function () {};
    var onDragMove = handlers.onDragMove || function () {};
    var onDragEnd = handlers.onDragEnd || function () {};
    var onTap = handlers.onTap || function () {};

    var active = false;
    var pointerId = null;
    var startX = 0, startY = 0, startTime = 0;
    var moved = false;

    function suppressClickCapture(e) {
      // fires on the CAPTURE phase, before it reaches any hotspot <button>
      // inside target — stops the click from ever registering as a "tap"
      // on that button when the pointer gesture was actually a drag.
      e.stopPropagation();
      target.removeEventListener('click', suppressClickCapture, true);
    }

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return; // primary button/touch only
      active = true;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      if (target.setPointerCapture) {
        try { target.setPointerCapture(pointerId); } catch (err) { /* noop */ }
      }
      onDragStart(startX, startY);
    }

    function onPointerMove(e) {
      if (!active || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!moved && (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX)) {
        moved = true;
      }
      onDragMove(dx, dy, e.clientX, e.clientY);
    }

    function onPointerUp(e) {
      if (!active || e.pointerId !== pointerId) return;
      active = false;
      if (target.releasePointerCapture) {
        try { target.releasePointerCapture(pointerId); } catch (err) { /* noop */ }
      }
      var duration = Date.now() - startTime;
      var wasTap = !moved && duration < TAP_MAX_DURATION_MS;
      onDragEnd(!wasTap);
      if (wasTap) {
        onTap(e.clientX, e.clientY, e);
      } else {
        // this pointer gesture was a drag: the browser will still fire a
        // synthetic click on whatever element is under the pointer right
        // after pointerup — swallow exactly that one click so a hotspot
        // button underneath doesn't get accidentally "activated" by a pan.
        target.addEventListener('click', suppressClickCapture, true);
        window.setTimeout(function () {
          target.removeEventListener('click', suppressClickCapture, true);
        }, 0);
      }
    }

    function onPointerCancel(e) {
      if (!active || e.pointerId !== pointerId) return;
      active = false;
      onDragEnd(true);
    }

    target.addEventListener('pointerdown', onPointerDown);
    // move/up listen on the target itself (pointer capture redirects all
    // subsequent events to it regardless of where the pointer physically is)
    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
    target.addEventListener('pointercancel', onPointerCancel);

    function destroy() {
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
      target.removeEventListener('pointercancel', onPointerCancel);
      target.removeEventListener('click', suppressClickCapture, true);
    }

    return { destroy: destroy, TAP_THRESHOLD_PX: TAP_THRESHOLD_PX };
  }

  YHApp.createGestureController = createGestureController;
})(window.YHApp = window.YHApp || {});
