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
  //                    desktopCalloutCoords?, mobileCalloutCoords? }]
  //                 order is optional: omit it for a person/entity that
  //                 isn't part of a numbered sequence (e.g. Zone 06's role
  //                 cards) — the card then renders without the numbered
  //                 badge (title+description only), via the
  //                 yh-workshop-annotation__card--no-badge CSS modifier.
  // urlMap        — { [hotspot.id]: url|null }
  // mobile        — bool, snapshotted once by the caller
  // mobileVariant — optional modifier class on the layer root, purely for
  //                 CSS to hook a per-zone mobile difference off of (e.g.
  //                 Zone 03's mobile is title-only, Zone 02's keeps the
  //                 description — same shared component, one CSS-level
  //                 knob, not a behavior fork here).
  function createSpatialAnnotations(sceneStage, hotspots, urlMap, mobile, mobileVariant) {
    var wrap = el('div', 'yh-workshop-annotation-layer' + (mobileVariant ? ' ' + mobileVariant : ''));
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

    function destroy() { wrap.remove(); }

    return { destroy: destroy };
  }

  YHApp.createSpatialAnnotations = createSpatialAnnotations;
})(window.YHApp = window.YHApp || {});
