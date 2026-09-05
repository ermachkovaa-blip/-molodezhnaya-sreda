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
//
// setPointerCapture is called LAZILY — only once real movement crosses
// the tap/drag threshold, not on pointerdown. Found during Этап 2 testing:
// capturing immediately on pointerdown retargets the resulting synthetic
// `click` event to the CAPTURING element (target, e.g. the scene
// viewport) instead of the real hit-tested element (a hotspot <button>
// underneath the pointer) — even for a plain, zero-movement click. That
// silently broke every hotspot living inside a gesture-controlled area
// (Zone 01 objects, passage) for real mouse/touch input, while appearing
// to work under `element.click()`-style test helpers that bypass actual
// pointer dispatch. Deferring capture to "only once a real drag begins"
// fixes this: a plain tap never captures, so the button receives its own
// native click exactly as if no gesture layer existed; only a confirmed
// drag captures the pointer (so it keeps tracking correctly even if the
// pointer moves off the original element), and it's on THAT branch that
// the phantom post-drag click still needs swallowing (see
// suppressClickCapture below).

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
    var captured = false;
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
      captured = false;
      moved = false;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      // deliberately NOT calling setPointerCapture here — see file header.
    }

    function onPointerMove(e) {
      if (!active || e.pointerId !== pointerId) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!moved && (Math.abs(dx) > TAP_THRESHOLD_PX || Math.abs(dy) > TAP_THRESHOLD_PX)) {
        moved = true;
        // NOW it's a real drag: capture so tracking continues correctly
        // even if the pointer moves off target's descendants, and fire
        // the deferred drag-start signal.
        if (target.setPointerCapture) {
          try { target.setPointerCapture(pointerId); captured = true; } catch (err) { /* noop */ }
        }
        onDragStart(startX, startY);
      }
      if (moved) onDragMove(dx, dy, e.clientX, e.clientY);
    }

    function onPointerUp(e) {
      if (!active || e.pointerId !== pointerId) return;
      active = false;
      if (captured && target.releasePointerCapture) {
        try { target.releasePointerCapture(pointerId); } catch (err) { /* noop */ }
      }
      captured = false;
      var duration = Date.now() - startTime;
      var wasTap = !moved && duration < TAP_MAX_DURATION_MS;
      if (wasTap) {
        // no capture was ever engaged for a plain tap, so the native click
        // about to follow this pointerup already targets the real element
        // (e.g. a hotspot <button>) untouched — nothing to do here.
        onTap(e.clientX, e.clientY, e);
      } else {
        onDragEnd(true);
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
      if (moved) onDragEnd(true);
      captured = false;
    }

    target.addEventListener('pointerdown', onPointerDown);
    // move/up listen on the target itself — once a real drag captures the
    // pointer, subsequent events are redirected to it regardless of where
    // the pointer physically is; before that (plain hover/tap), they still
    // reach target normally via bubbling since target covers the area.
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
