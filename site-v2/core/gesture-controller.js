// GestureController — унифицированный Pointer Events drag/tap/pinch
// controller.
//
// Заменяет V1-паттерн "раздельные mousedown/touchstart + implicit click".
// Единственный источник истины о том, был ли жест тапом или драгом —
// explicit threshold (TAP_THRESHOLD_PX), а не то, что "браузер сам как-то
// разберётся" между click и touch-событиями.
//
// Контракт:
//   var gesture = YHApp.createGestureController(target, {
//     onDragStart(x, y), onDragMove(dx, dy, x, y), onDragEnd(wasDrag),
//     onTap(x, y, originalEvent),
//     onPinchStart(midX, midY), onPinchMove(distanceRatio, midX, midY),
//     onPinchEnd()
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
//
// PINCH-ZOOM (customer, 2026-09-15: "не увеличивается пальцами" — no way
// to zoom in with fingers on a real phone, only pan): a second pointer
// landing while the first is already down switches the whole gesture from
// single-pointer drag/tap into two-pointer pinch tracking — the first
// pointer's drag (if one had already started) is cleanly ended first (see
// onDragEnd + swallowNextClick below, same mechanism a real drag-end
// already uses) so nothing is left half-finished. Distance-ratio + live
// midpoint are handed to the caller (SceneEngine owns the actual
// scale/pan math — see pinchStart/pinchTo there) rather than computed
// here, keeping this file's own job strictly mechanical, same separation
// already used for onDragMove's dx/dy.
//
// pinchPointers/pinchPointerIds track "which pointer(s) are currently
// down" independently of the active/moved/pointerId trio below (which is
// single-pointer tap/drag state only) — endPointer() is the ONE place
// that removes a pointer from that bookkeeping, called from both
// onPointerUp and onPointerCancel, whether or not a pinch was ever
// entered, so a lifted finger can never linger in the map and be
// mistaken for a live second finger by the NEXT gesture.

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
    var onPinchStart = handlers.onPinchStart || function () {};
    var onPinchMove = handlers.onPinchMove || function () {};
    var onPinchEnd = handlers.onPinchEnd || function () {};

    var active = false;
    var captured = false;
    var pointerId = null;
    var startX = 0, startY = 0, startTime = 0;
    var moved = false;

    // pointerId -> {x, y} for every currently-down pointer, up to 2 (a
    // real third finger is never added — see onPointerDown).
    var pinchPointers = {};
    var pinchPointerIds = []; // insertion order, always length 0-2
    var pinching = false;
    var pinchStartDistance = 0;

    function suppressClickCapture(e) {
      // fires on the CAPTURE phase, before it reaches any hotspot <button>
      // inside target — stops the click from ever registering as a "tap"
      // on that button when the pointer gesture was actually a drag.
      e.stopPropagation();
      target.removeEventListener('click', suppressClickCapture, true);
    }

    function swallowNextClick() {
      target.addEventListener('click', suppressClickCapture, true);
      window.setTimeout(function () {
        target.removeEventListener('click', suppressClickCapture, true);
      }, 0);
    }

    function distanceBetween(a, b) {
      return Math.hypot(b.x - a.x, b.y - a.y);
    }
    function midpointBetween(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function startPinch() {
      pinching = true;
      var a = pinchPointers[pinchPointerIds[0]];
      var b = pinchPointers[pinchPointerIds[1]];
      pinchStartDistance = distanceBetween(a, b) || 1; // avoid div-by-zero on a same-point start
      var mid = midpointBetween(a, b);
      onPinchStart(mid.x, mid.y);
    }

    function updatePinch() {
      var a = pinchPointers[pinchPointerIds[0]];
      var b = pinchPointers[pinchPointerIds[1]];
      if (!a || !b) return;
      var ratio = distanceBetween(a, b) / pinchStartDistance;
      var mid = midpointBetween(a, b);
      onPinchMove(ratio, mid.x, mid.y);
    }

    // removes a pointer from the down-pointers bookkeeping regardless of
    // whether a pinch was ever entered — the one place this happens, so
    // a lifted finger can never be mistaken for a live one afterward.
    function endPointer(pid) {
      if (pinchPointers[pid] === undefined) return;
      delete pinchPointers[pid];
      var idx = pinchPointerIds.indexOf(pid);
      if (idx !== -1) pinchPointerIds.splice(idx, 1);
      if (pinching && pinchPointerIds.length < 2) {
        pinching = false;
        onPinchEnd();
        // deliberately do NOT resume single-pointer drag/tap tracking on
        // whichever finger (if any) is still down — a fresh pointerdown
        // is required to start a new gesture, matching how most native
        // pinch-then-pan interactions expect a clean regrip.
      }
    }

    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return; // primary button/touch only
      if (pinchPointerIds.length >= 2) return; // third+ finger — ignore entirely

      pinchPointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      pinchPointerIds.push(e.pointerId);

      if (pinchPointerIds.length === 2) {
        // a genuine second finger — switch into pinch mode. A single-
        // pointer drag may already be underway on the FIRST finger — end
        // it cleanly (same signal a real pointerup-as-drag would send)
        // before switching, so the caller's drag state (e.g. mount.js's
        // isDragging) never gets left stuck on.
        if (active && moved) {
          if (captured && target.releasePointerCapture) {
            try { target.releasePointerCapture(pointerId); } catch (err) { /* noop */ }
          }
          onDragEnd(true);
          swallowNextClick();
        }
        active = false;
        captured = false;
        moved = false;
        startPinch();
        return;
      }

      // first finger of a fresh gesture.
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
      if (pinching) {
        if (!pinchPointers[e.pointerId]) return;
        pinchPointers[e.pointerId] = { x: e.clientX, y: e.clientY };
        updatePinch();
        return;
      }

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
      endPointer(e.pointerId);

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
        swallowNextClick();
      }
    }

    function onPointerCancel(e) {
      endPointer(e.pointerId);

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
