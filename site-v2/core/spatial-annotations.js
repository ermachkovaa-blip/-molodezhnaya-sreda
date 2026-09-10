// SpatialAnnotations — the shared "architectural exhibition label" system
// (blue number badge + white card + blue "+" + blue connector), factored
// out of core/zone-03-workshop.js so Zone 02 can reuse the exact same
// component rather than a second implementation ("ONE SITE = ONE
// ANNOTATION LANGUAGE" — customer spec for Zone 02's rebuild). Visual
// tokens (blue, badge geometry, card styling, plus styling, connector
// styling, typography) all live in css/app.css under .yh-workshop-
// annotation* and are shared automatically since every zone using this
// file uses the same class names — nothing zone-specific is hardcoded
// here.
//
// Scene-specific per caller: the hotspots array (id/order/label/text/
// desktopCoords/mobileCoords/desktopCalloutCoords/mobileCalloutCoords)
// and the urlMap. Everything else — rendering, the "+"-only-when-there-
// is-material rule, the debug-only target dot when there isn't — is
// identical for every zone that calls this.
//
// ANNOTATION = always-visible information (number+title+description,
// no hover/click/tap gate, per the interaction rule established for Zone
// 03 and explicitly required to carry over to Zone 02 unchanged).
// "+"        = optional deeper material, rendered ONLY when
//              urlMap[hotspot.id] is set — never a fake clickable card.
//
// Real <a> when a URL exists (never a synthetic window.open — same
// anchor-vs-button principle documented in core/hotspot-layer.js).
//
// No requestAnimationFrame loop: every element is positioned once via
// CSS left/top percent (resolved against the scene image, same
// coordinate space every other zone's hotspots already use) and moves
// with the camera exactly like they do — nothing here needs per-frame
// recalculation.

(function (YHApp) {
  'use strict';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // hotspots      — [{ id, order?, label, text, desktopCoords, mobileCoords,
  //                    desktopCalloutCoords?, mobileCalloutCoords?, cardImage? }]
  //                 order is optional: omit it for a person/entity that
  //                 isn't part of a numbered sequence (e.g. Zone 06's role
  //                 cards) — the card then renders without the numbered
  //                 badge (title+description only), via the
  //                 yh-workshop-annotation__card--no-badge CSS modifier.
  //                 cardImage is optional (customer decision for Zone 02/03,
  //                 2026-09-09: "не делать их текстом, а просто картинками" —
  //                 a designed, finished card image, text/frame already
  //                 baked in, replaces the badge+title+desc block entirely
  //                 for that one hotspot): either a single URL string (same
  //                 image both platforms) or { desktop, mobile } — omitted
  //                 (as it is for every hotspot right now, until those
  //                 images exist) falls straight through to the original
  //                 text card, unchanged.
  // urlMap        — { [hotspot.id]: url|null }
  // mobile        — bool, snapshotted once by the caller
  // mobileVariant — optional modifier class on the layer root, purely for
  //                 CSS to hook a per-zone mobile difference off of (e.g.
  //                 Zone 03's mobile is title-only, Zone 02's keeps the
  //                 description — same shared component, one CSS-level
  //                 knob, not a behavior fork here).
  // BUG FOUND while re-verifying the customer's "зона 2-3 все еще плохо" /
  // "зона 6... стало плохо" report against the actual shipped ZIP package
  // (not the raw dev source — the two turned out to render differently,
  // see below): every element here lives inside sceneStage, which
  // SceneEngine scales via `transform: scale(presetScale)`
  // (core/scene-engine.js) — and presetScale is computed from the
  // scene's REAL, NATIVE PIXEL dimensions (max(viewportW/imageW,
  // viewportH/imageH)), not from anything viewport-relative alone. A
  // card sized in plain px/rem therefore renders at DIFFERENT on-screen
  // sizes depending on the raw pixel resolution of whatever image file
  // is actually loaded — even at the IDENTICAL viewport size and the
  // IDENTICAL aspect ratio. This project's preview-package build step
  // re-encodes/downsizes the production PNGs for file size (see
  // rebuild-testsite-v2.py) — e.g. Zone 02/03's images ship at half the
  // native resolution used during dev testing — which silently doubled
  // presetScale, and with it every card's on-screen size, in exactly the
  // package the customer was testing, while this exact same code verified
  // clean against the un-repacked dev assets. Same class of bug as
  // Zone 05's book/fabric CTA labels (core/zone-05-gallery.js), fixed the
  // same way there: counter-scale by the ACTUAL measured ratio between
  // sceneStage's rendered size and its own layout size, so the card's
  // on-screen size is invariant to presetScale — whatever caused it to
  // change (asset resolution, window size, camera preset).
  function createSpatialAnnotations(sceneStage, hotspots, urlMap, mobile, mobileVariant) {
    var scaledEls = []; // [{ el: HTMLElement, transformBase: string }]
    // JS-driven mobile flag, always added regardless of mobileVariant —
    // css keys its mobile card sizing (see app.css) off this class as an
    // unconditional twin of the @media(max-width:767px) rules, since
    // that query depends on window width while `mobile` here is the
    // CONTAINER-width truth (mount.js isMobile()) that decides which
    // scene image actually renders. Same divergence already found/fixed
    // for the header nav — whenever it happens here instead, full-size
    // desktop cards render on the (visually) mobile scene and overlap
    // each other badly, which is what the customer kept reporting.
    var wrap = el('div', 'yh-workshop-annotation-layer' + (mobile ? ' yh-workshop-annotation-layer--mobile' : '') + (mobileVariant ? ' ' + mobileVariant : ''));
    sceneStage.appendChild(wrap);

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'yh-workshop-annotation__lines');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    wrap.appendChild(svg);

    hotspots.forEach(function (h) {
      var dot = mobile ? h.mobileCoords : h.desktopCoords;
      var anchor = (mobile ? h.mobileCalloutCoords : h.desktopCalloutCoords) || dot;
      var url = urlMap[h.id] || null;

      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'yh-workshop-annotation__line');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      line.setAttribute('x1', anchor.x); line.setAttribute('y1', anchor.y);
      line.setAttribute('x2', dot.x); line.setAttribute('y2', dot.y);
      svg.appendChild(line);

      // the card — always visible, never gated behind hover/click/tap
      var hasBadge = h.order != null;
      var card = el('div', 'yh-workshop-annotation__card' + (hasBadge ? '' : ' yh-workshop-annotation__card--no-badge'));
      card.style.left = anchor.x + '%';
      card.style.top = anchor.y + '%';
      // scale() in a combined transform composes around the SAME
      // transform-origin as the rest of the list (default 50% 50%, the
      // card's own center) — but this card's anchor point is its LEFT
      // edge (translateY(-50%) only, no translateX), not its center, so
      // the default origin would visibly drag the anchor sideways by an
      // amount that depends on k (found by comparing dev-source vs.
      // packaged-build renders: same k formula, but this card's on-
      // screen LEFT EDGE position differed between them even though
      // anchor.x/the underlying camera math is identical — the
      // resolution-dependent k was quietly relocating the anchor, not
      // just resizing the card). Anchoring the scale itself at the left-
      // center edge keeps that point fixed for any k.
      card.style.transformOrigin = '0% 50%';
      if (hasBadge) {
        var badge = el('div', 'yh-workshop-annotation__badge');
        badge.textContent = pad(h.order);
        card.appendChild(badge);
      }
      var title = el('div', 'yh-workshop-annotation__title');
      title.textContent = h.label;
      var desc = el('div', 'yh-workshop-annotation__desc');
      desc.textContent = h.text;
      card.appendChild(title);
      card.appendChild(desc);
      wrap.appendChild(card);
      // base transform from CSS (see app.css) — the counter-scale below
      // is appended to this, not a replacement, so the card keeps
      // anchoring by its left-center edge exactly like before.
      scaledEls.push({ el: card, base: 'translateY(-50%)' });

      // the "+" — only when there is real material to open
      if (url) {
        var plus = el('a', 'yh-workshop-annotation__plus', {
          href: url, target: '_blank', rel: 'noopener noreferrer',
          'aria-label': h.title + ' — открыть материал'
        });
        plus.textContent = '+';
        plus.style.left = dot.x + '%';
        plus.style.top = dot.y + '%';
        wrap.appendChild(plus);
        scaledEls.push({ el: plus, base: 'translate(-50%, -50%)' });

        plus.addEventListener('mouseenter', function () { line.classList.add('is-emphasized'); });
        plus.addEventListener('mouseleave', function () { line.classList.remove('is-emphasized'); });
        plus.addEventListener('focus', function () { line.classList.add('is-emphasized'); });
        plus.addEventListener('blur', function () { line.classList.remove('is-emphasized'); });
      } else {
        // debug-only target dot (see css .yh-app--debug) — lets QA
        // screenshots show where each annotation actually points even
        // when there's no material yet, so nothing to click there.
        var targetDebug = el('div', 'yh-workshop-annotation__target-debug');
        targetDebug.style.left = dot.x + '%';
        targetDebug.style.top = dot.y + '%';
        wrap.appendChild(targetDebug);
      }
    });

    // see the BUG FOUND note above createSpatialAnnotations — this keeps
    // every card/"+" at a constant on-screen size regardless of
    // presetScale, the same counter-scale technique already used for
    // Zone 05's book/fabric CTA labels.
    function layout() {
      var stageRect = sceneStage.getBoundingClientRect();
      var liveScale = sceneStage.offsetWidth ? (stageRect.width / sceneStage.offsetWidth) : 1;
      var k = liveScale ? 1 / liveScale : 1;
      scaledEls.forEach(function (item) {
        item.el.style.transform = item.base + ' scale(' + k + ')';
      });
    }

    layout();
    window.requestAnimationFrame(layout);

    // Two DIFFERENT things need to be observed here, both required —
    // dropping either one reproduces the bug (found the hard way: the
    // very first version of this fix only had the second observer, and
    // still measured a stale liveScale=1 well after the real one had
    // settled):
    //   1. sceneStage's own LAYOUT size starts at 0×0 and only becomes
    //      real once its <img> child finishes loading and its intrinsic
    //      size is known (sceneStage has no explicit width/height — see
    //      app.css .yh-scene-stage — it's purely content-sized) — the
    //      three eager calls above (sync/rAF) all fire before that, on a
    //      local file:// image that hasn't decoded yet. A CSS transform
    //      never triggers ResizeObserver, but this 0→real LAYOUT size
    //      jump genuinely does.
    //   2. presetScale itself can also change on ANY later resize
    //      (SceneEngine recomputes cover-scale continuously, not only at
    //      mobile/desktop bucket boundaries — see core/scene-engine.js
    //      recomputeForResize) — that changes the ambient transform only,
    //      which (1) can no longer catch once the image has already
    //      loaded, so the real VIEWPORT (sceneStage's own parent) is
    //      observed too, the same box SceneEngine itself observes for
    //      the same reason.
    var resizeObserver = null;
    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new window.ResizeObserver(layout);
      resizeObserver.observe(sceneStage);
      if (sceneStage.parentElement) resizeObserver.observe(sceneStage.parentElement);
    }

    function destroy() {
      if (resizeObserver) resizeObserver.disconnect();
      wrap.remove();
    }

    return { destroy: destroy, layout: layout };
  }

  YHApp.createSpatialAnnotations = createSpatialAnnotations;
})(window.YHApp = window.YHApp || {});
