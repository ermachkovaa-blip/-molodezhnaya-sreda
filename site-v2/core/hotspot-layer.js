// createHotspotLayer — GENERIC MECHANICS ONLY for "url | null -> external
// link / inline architectural caption" hotspots. Zone 01 objects are the
// first caller; Production-ТЗ requires Zone 02/03 to reuse this same
// mechanism unchanged once they're in scope ("02 и 03 реализовать одним
// HotspotScene") — this file is that shared piece.
//
// STRICT SEPARATION (see Этап 2 clarification, 05.09): this file owns only
//   - absolute positioning from config (desktop/mobile coords resolved by
//     the caller's getCoords(), this file just applies the result);
//   - real <a> (when item.url) or <button> (when null / onActivate) —
//     never a generic <div> with a synthetic click;
//   - external link security (target=_blank, rel=noopener noreferrer);
//   - the tap-vs-drag distinction — achieved by REUSE, not reimplementation:
//     a plain `click` listener already only fires for genuine taps/real
//     keyboard activation, because GestureController (gesture-controller.js)
//     swallows the synthetic click that follows a real scene-drag before it
//     reaches any descendant button/a — see that file's header for why;
//   - aria-label passthrough;
//   - the caption's scene-relative positioning + show/hide/auto-dismiss
//     timing mechanics (not its appearance — see below);
//   - lifecycle: destroy() removes every node this layer created and
//     clears the caption's pending timer, so a zone switch (mount.js
//     tears down the previous zone's behavior module before creating the
//     next one) leaves no orphan nodes, timers, or listeners behind.
//
// It deliberately holds NO hardcoded text, NO fallback null-message, NO
// "+" glyph, and NO opinion on caption/dot/label appearance beyond
// structural CSS (position/transform) — all of that is supplied by the
// caller via `items` (per-hotspot ariaLabel/hoverLabel/emptyMessage/url)
// and via CSS keyed off `config.layerClass` (e.g. Zone 01 gives its dot a
// visible resting state in app.css; a future Zone 02/03 layerClass would
// style its dot fully transparent, since the "+" is already baked into
// BASE there — this file never decides that, CSS does, per zone).
//
// Must be appended inside the SAME element the scene <img> lives in
// (.yh-scene-stage), so left/top percentages resolve against the image's
// own native pixel box, not the (scaled/panned) viewport — exactly the
// coordinate space item coordinates are authored in. This is also why the
// caption moves WITH the BASE image rather than being viewport-fixed: it
// is a child of the same transformed stage, not of some fixed overlay.

(function (YHApp) {
  'use strict';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  // config:
  //   layerClass        - CSS class prefix (BEM-ish); ALSO used to derive
  //                        the caption's class, so a zone can restyle its
  //                        own caption in its own CSS without touching
  //                        this generic file.
  //   items             - [{ id, ariaLabel, hoverLabel?, labelText?, url?, emptyMessage?, onActivate? }]
  //                        — hoverLabel/labelText/emptyMessage text is
  //                        100% caller-supplied; this file never defaults
  //                        or invents it. labelText is optional: when
  //                        present it renders as a second (description)
  //                        line under hoverLabel's title line; omitted
  //                        entirely, hoverLabel renders as plain single-
  //                        line text exactly as before (Zone 00's map is
  //                        the only current user of labelText).
  //   getCoords(item, isMobile) -> { x, y } (percent of the scene image)
  //   isMobile()        -> bool
  //   captionOffsetY    - vertical nudge (percent) for the caption relative
  //                        to the hotspot it belongs to (mechanical, not visual)
  //   captionDurationMs - auto-dismiss timing (mechanical, not visual)
  function createHotspotLayer(sceneStage, config) {
    var layerClass = config.layerClass || 'yh-hotspot';
    var layer = el('div', 'yh-hotspot-layer ' + layerClass);
    sceneStage.appendChild(layer);

    // caption class is layer-derived, not a single shared generic class —
    // a future zone can give its own caption a different look in its own
    // CSS block without this file (or any other zone's CSS) changing.
    var caption = el('div', layerClass + '__caption');
    caption.hidden = true;
    layer.appendChild(caption);
    var captionTimer = null;

    function hideCaption() {
      caption.hidden = true;
      if (captionTimer) { clearTimeout(captionTimer); captionTimer = null; }
    }

    function showCaption(text, coords) {
      caption.textContent = text;
      caption.style.left = coords.x + '%';
      caption.style.top = (coords.y + (config.captionOffsetY || 5)) + '%';
      caption.hidden = false;
      if (captionTimer) clearTimeout(captionTimer);
      captionTimer = setTimeout(hideCaption, config.captionDurationMs || 2600);
    }

    var elements = {};
    var labels = {};
    config.items.forEach(function (item) {
      // Real <a> when there's somewhere to navigate (native target=_blank
      // + rel=noopener/noreferrer — the browser handles the new tab and
      // opener-severing itself; no window.open() needed, and no engine-
      // specific edge cases to work around). Real <button> otherwise (null
      // URL -> caption, or an in-page action via onActivate, e.g. the
      // Zone 01 -> 02 passage) — there is nowhere an <a> could point.
      var isLink = !!item.url;
      var node = isLink
        ? el('a', layerClass + '__item', { href: item.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': item.ariaLabel })
        : el('button', layerClass + '__item', { type: 'button', 'aria-label': item.ariaLabel });
      node.setAttribute('data-hotspot-id', item.id);

      var dot = el('span', layerClass + '__dot');
      node.appendChild(dot);
      var label = null;
      if (item.hoverLabel) {
        label = el('span', layerClass + '__label');
        // optional second line (e.g. Zone 00's map callout: title +
        // description) — plain single-line text when absent, exactly as
        // before, so every other caller is unaffected.
        if (item.labelText) {
          var labelTitle = el('span', layerClass + '__label-title');
          labelTitle.textContent = item.hoverLabel;
          var labelDesc = el('span', layerClass + '__label-desc');
          labelDesc.textContent = item.labelText;
          label.appendChild(labelTitle);
          label.appendChild(labelDesc);
        } else {
          label.textContent = item.hoverLabel;
        }
        node.appendChild(label);
      }
      if (label) labels[item.id] = label;

      node.addEventListener('click', function (e) {
        hideCaption();
        if (isLink) return; // native <a> handles the navigation itself
        if (typeof item.onActivate === 'function') {
          item.onActivate(item);
          return;
        }
        // null URL, no onActivate: this hotspot's only job is the inline
        // architectural caption — text supplied entirely by the caller.
        showCaption(item.emptyMessage, config.getCoords(item, config.isMobile()));
      });

      layer.appendChild(node);
      elements[item.id] = node;
    });

    function layout() {
      var mobile = config.isMobile();
      config.items.forEach(function (item) {
        var coords = config.getCoords(item, mobile);
        elements[item.id].style.left = coords.x + '%';
        elements[item.id].style.top = coords.y + '%';
      });
      // customer (2026-09-14): map/object labels living inside the scaled
      // .yh-scene-stage were shrinking along with the BASE image's own
      // cover-fit zoom, becoming unreadably small at real viewport sizes
      // — same "fixed CSS px shrinks with the stage's camera-scale
      // transform" class of bug already found/fixed for Zone 05's shelf/
      // fabric labels (see core/zone-05-gallery.js layoutBookLink). Opt-in
      // via config.counterScaleLabel so callers that want the dot/label
      // to genuinely scale WITH the scene (e.g. Zone 03's baked-in AI-
      // link "+", which has no separate label anyway) are unaffected.
      if (config.counterScaleLabel) {
        var stageRect = sceneStage.getBoundingClientRect();
        var liveScale = sceneStage.offsetWidth ? (stageRect.width / sceneStage.offsetWidth) : 1;
        var inverse = liveScale ? 1 / liveScale : 1;
        Object.keys(labels).forEach(function (id) {
          labels[id].style.transform = 'translateX(-50%) scale(' + inverse + ')';
        });
      }
    }

    function destroy() {
      hideCaption();
      layer.remove(); // removes every child node (buttons/links/dots/labels/caption) and their listeners in one step
    }

    return { layout: layout, destroy: destroy, elements: elements, hideCaption: hideCaption, layer: layer };
  }

  YHApp.createHotspotLayer = createHotspotLayer;
})(window.YHApp = window.YHApp || {});
