// SceneEngine — camera/transform/RAF/resize.
// Перенос проверенной camera-математики V1 (js/main.js: computeCameraScale,
// clampTranslate, setCameraTo, applyStageTransform, parallax drift) в
// изолированный модуль без обращений к document.body/window как
// обязательной зависимости — только к переданным elements.
//
// Ключевое отличие от V1: пересчёт "cover scale" привязан к
// ResizeObserver на самом viewport-контейнере, а не к window resize —
// так модуль корректно реагирует на изменение размера контейнера внутри
// Tilda-колонки, даже если окно браузера не меняется.

(function (YHApp) {
  'use strict';

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // stage: element, который реально двигается transform'ом (содержит <img>)
  // viewport: element-контейнер (overflow:hidden), от размеров которого
  //           считается cover-scale
  function createSceneEngine(viewport, stage, opts) {
    opts = opts || {};
    var reducedMotion = typeof opts.reducedMotion === 'function' ? opts.reducedMotion : function () { return false; };
    var onDebugUpdate = opts.onDebugUpdate || function () {};

    var state = {
      sceneW: 0,
      sceneH: 0,
      tx: 0,
      ty: 0,
      scale: 1,
      presetScale: 1,
      zoomFactor: 1,
      minScale: 1,
      maxScale: 1,
      parallaxX: 0,
      parallaxY: 0,
      parallaxTargetX: 0,
      parallaxTargetY: 0,
      currentFocus: { x: 50, y: 50, scale: 1 }
    };

    var rafId = null;

    function setSceneSize(w, h) {
      state.sceneW = w;
      state.sceneH = h;
    }

    function getCoverScale() {
      var vw = viewport.clientWidth;
      var vh = viewport.clientHeight;
      var iw = state.sceneW;
      var ih = state.sceneH;
      if (!iw || !ih || !vw || !vh) return 1;
      return Math.max(vw / iw, vh / ih);
    }

    function computeCameraScale(focus) {
      var base = getCoverScale();
      state.minScale = base;
      state.maxScale = base * 2.6;
      return clamp(base * (focus.scale || 1), state.minScale, state.maxScale);
    }

    function clampTranslate() {
      var vw = viewport.clientWidth;
      var vh = viewport.clientHeight;
      var iw = state.sceneW * state.scale;
      var ih = state.sceneH * state.scale;
      var minTx = Math.min(0, vw - iw);
      var minTy = Math.min(0, vh - ih);
      state.tx = clamp(state.tx, minTx, 0);
      state.ty = clamp(state.ty, minTy, 0);
    }

    function applyTransform() {
      var px = reducedMotion() ? 0 : state.parallaxX;
      var py = reducedMotion() ? 0 : state.parallaxY;

      // The parallax drift is a decorative offset ON TOP of the clamped
      // base tx/ty — clampTranslate() only guarantees state.tx/state.ty
      // keep the image covering the viewport, it says nothing about
      // tx+px. Near the edge of the pan range, an unclamped px/py can
      // nudge the image a few px past the viewport edge (found by the
      // Этап 1 smoke suite at 1600×900 on zones 03/05/07). Clamp the
      // FINAL rendered position to the same bounds so the visible edge
      // requirement holds even while parallax is live.
      var vw = viewport.clientWidth;
      var vh = viewport.clientHeight;
      var iw = state.sceneW * state.scale;
      var ih = state.sceneH * state.scale;
      var minRenderTx = Math.min(0, vw - iw);
      var minRenderTy = Math.min(0, vh - ih);
      var renderTx = clamp(state.tx + px, minRenderTx, 0);
      var renderTy = clamp(state.ty + py, minRenderTy, 0);

      stage.style.transform = 'translate(' + renderTx + 'px,' + renderTy + 'px) scale(' + state.scale + ')';
      onDebugUpdate(state);
    }

    // discrete jump to a camera preset (zone switch / initial load)
    function setCameraTo(focus, animated) {
      state.currentFocus = focus;
      var presetScale = computeCameraScale(focus);
      state.presetScale = presetScale;
      state.zoomFactor = 1;
      state.scale = presetScale;

      var vw = viewport.clientWidth;
      var vh = viewport.clientHeight;
      var focusX = (focus.x / 100) * state.sceneW * presetScale;
      var focusY = (focus.y / 100) * state.sceneH * presetScale;

      state.tx = vw / 2 - focusX;
      state.ty = vh / 2 - focusY;
      clampTranslate();

      if (animated && !reducedMotion()) {
        stage.style.transition = 'transform 800ms cubic-bezier(0.22, 1, 0.36, 1)';
        window.setTimeout(function () { stage.style.transition = ''; }, 850);
      } else {
        stage.style.transition = '';
      }
      applyTransform();
    }

    // re-center on the current focus after a container resize, without
    // the decorative 800ms transition (this is a geometry correction, not
    // a navigation event)
    function recomputeForResize() {
      if (!state.sceneW || !state.sceneH) return;
      setCameraTo(state.currentFocus, false);
    }

    // ---- gentle desktop mouse-parallax drift (rAF loop) ----
    function setParallaxTarget(nx, ny, amplitude) {
      state.parallaxTargetX = -nx * amplitude;
      state.parallaxTargetY = -ny * amplitude;
    }
    function resetParallaxTarget() {
      state.parallaxTargetX = 0;
      state.parallaxTargetY = 0;
    }

    function tick() {
      if (!reducedMotion()) {
        state.parallaxX = lerp(state.parallaxX, state.parallaxTargetX, 0.08);
        state.parallaxY = lerp(state.parallaxY, state.parallaxTargetY, 0.08);
        applyTransform();
      }
      rafId = window.requestAnimationFrame(tick);
    }

    function start() {
      if (rafId === null) rafId = window.requestAnimationFrame(tick);
    }
    function stop() {
      if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
    }

    // ---- manual pan (used by GestureController during drag) ----
    function panBy(dx, dy, baseTx, baseTy) {
      state.tx = baseTx + dx;
      state.ty = baseTy + dy;
      clampTranslate();
      applyTransform();
    }

    // ---- ResizeObserver on the viewport container itself ----
    var resizeObserver = null;
    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new window.ResizeObserver(function () {
        recomputeForResize();
      });
      resizeObserver.observe(viewport);
    } else {
      // fallback only if ResizeObserver truly unavailable in the runtime
      window.addEventListener('resize', recomputeForResize);
    }

    function destroy() {
      stop();
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', recomputeForResize);
    }

    return {
      state: state,
      setSceneSize: setSceneSize,
      setCameraTo: setCameraTo,
      recomputeForResize: recomputeForResize,
      setParallaxTarget: setParallaxTarget,
      resetParallaxTarget: resetParallaxTarget,
      panBy: panBy,
      clampTranslate: clampTranslate,
      applyTransform: applyTransform,
      start: start,
      stop: stop,
      destroy: destroy
    };
  }

  YHApp.createSceneEngine = createSceneEngine;
})(window.YHApp = window.YHApp || {});
