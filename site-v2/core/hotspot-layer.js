// createHotspotLayer — generic "url | null -> open tab / inline caption"
// hotspot renderer. Built for Zone 01 objects now; Production-ТЗ requires
// Zone 02/03 to use the SAME mechanism unchanged once they're in scope
// ("02 и 03 реализовать одним HotspotScene") — this is that shared piece.
//
// Must be appended inside the SAME element the scene <img> lives in
// (.yh-scene-stage), so left/top percentages resolve against the image's
// own native pixel box, not the (scaled/panned) viewport — exactly the
// coordinate space item.desktopCoords/mobileCoords are authored in.
//
// Click handling deliberately uses the hotspot <button>'s native `click`
// event, not a custom pointer/tap handler: GestureController (see
// gesture-controller.js) already swallows the synthetic click that would
// otherwise follow a real scene-drag (capture-phase stopPropagation on
// the ancestor scene-viewport), so a plain click listener here already
// only fires for genuine taps/clicks AND real keyboard activation
// (Enter/Space) — no duplicate tap-vs-drag logic needed at this layer.

(function (YHApp) {
  'use strict';

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  // config:
  //   layerClass      - CSS class for the wrapping layer + each button (BEM-ish)
  //   items           - [{ id, ariaLabel, hoverLabel, url, emptyMessage, onActivate? }]
  //   getCoords(item, isMobile) -> { x, y } (percent of the scene image)
  //   isMobile()      -> bool
  //   defaultEmptyMessage
  //   captionDurationMs
  function createHotspotLayer(sceneStage, config) {
    var layer = el('div', 'yh-hotspot-layer ' + (config.layerClass || ''));
    sceneStage.appendChild(layer);

    var caption = el('div', 'yh-hotspot-caption');
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

    var buttons = {};
    config.items.forEach(function (item) {
      var btn = el('button', (config.layerClass || 'yh-hotspot') + '__item', {
        type: 'button',
        'data-hotspot-id': item.id,
        'aria-label': item.ariaLabel
      });
      var dot = el('span', (config.layerClass || 'yh-hotspot') + '__dot');
      btn.appendChild(dot);
      if (item.hoverLabel) {
        var label = el('span', (config.layerClass || 'yh-hotspot') + '__label');
        label.textContent = item.hoverLabel;
        btn.appendChild(label);
      }

      btn.addEventListener('click', function () {
        hideCaption();
        if (typeof item.onActivate === 'function') {
          item.onActivate(item);
          return;
        }
        if (item.url) {
          // rel="noopener noreferrer" equivalent for window.open: pass it
          // in the features string AND null the opener directly as a
          // belt-and-suspenders (some engines only honour rel on <a>).
          var w = window.open(item.url, '_blank', 'noopener,noreferrer');
          if (w) { try { w.opener = null; } catch (e) { /* noop */ } }
        } else {
          showCaption(item.emptyMessage || config.defaultEmptyMessage || 'Материалы будут добавлены', config.getCoords(item, config.isMobile()));
        }
      });

      layer.appendChild(btn);
      buttons[item.id] = btn;
    });

    function layout() {
      var mobile = config.isMobile();
      config.items.forEach(function (item) {
        var coords = config.getCoords(item, mobile);
        buttons[item.id].style.left = coords.x + '%';
        buttons[item.id].style.top = coords.y + '%';
      });
    }

    function destroy() {
      hideCaption();
      layer.remove();
    }

    return { layout: layout, destroy: destroy, buttons: buttons, hideCaption: hideCaption, layer: layer };
  }

  YHApp.createHotspotLayer = createHotspotLayer;
})(window.YHApp = window.YHApp || {});
