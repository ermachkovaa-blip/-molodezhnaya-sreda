// HotspotScene behavior — factory for Zone 02 (registered under
// shared.behavior:'hotspot-scene' in config/scenes.js).
//
// Zone 03 USED to share this exact file/behavior with Zone 02 (per the
// original Production-ТЗ "one shared HotspotScene" requirement), but was
// forked out into its own dedicated core/zone-03-workshop.js — see that
// file's header for why (a customer spec required a materially different
// visual system + a different mobile interaction model for Zone 03
// specifically, which no longer fits "one shared mechanism, two data
// sources"). Zone 02 keeps this file/behavior exactly as before.
//
// This file is itself still just wiring — it contains no hotspot text,
// no URLs, no coordinates. It reads config/zone-02-content.js and
// config/links.js RESEARCH_MATERIAL_URLS, then hands everything to the
// generic core/hotspot-layer.js.
//
// WORKSHOP CALLOUTS (customer request): an always-visible numbered badge +
// title/description card per hotspot, connected to the hotspot's own
// coordinate by a thin line — "давай сразу же кодом наложим кнопки как на
// референте с названием и описанием". Deliberately built as a SEPARATE,
// purely decorative, pointer-events:none overlay (buildCallouts below)
// rather than folded into hotspot-layer.js itself: the real click target
// stays exactly where it already was (on the physical object, per Zone
// 02's own established desktopCoords/mobileCoords calibration — nothing
// about the click mechanism changes), and the callout is free to sit
// somewhere else entirely (desktopCalloutCoords/mobileCalloutCoords) to
// avoid crowding. Mobile shows the title only (no description line) per
// explicit instruction — a CSS rule (.yh-workshop-callouts__desc under the
// existing 767px breakpoint), not a second code path.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  // hotspots — the same array createHotspotSceneBehavior already has
  // (each item's own desktopCoords/mobileCoords is the REAL click target,
  // unchanged); items missing `order` are skipped (a zone that hasn't
  // opted into callouts yet keeps behaving exactly as before).
  function buildCallouts(sceneStage, hotspots, zoneColor) {
    var callouted = hotspots.filter(function (h) { return h.order != null; });
    if (!callouted.length) return { layout: function () {}, destroy: function () {} };

    var wrap = el('div', 'yh-workshop-callouts');
    wrap.style.setProperty('--yh-callout-color', zoneColor || '');

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'yh-workshop-callouts__lines');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    wrap.appendChild(svg);

    var refs = {};
    callouted.forEach(function (h) {
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('class', 'yh-workshop-callouts__line');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(line);

      var badge = el('div', 'yh-workshop-callouts__badge');
      badge.textContent = (h.order < 10 ? '0' : '') + h.order;
      wrap.appendChild(badge);

      var card = el('div', 'yh-workshop-callouts__card');
      var title = el('div', 'yh-workshop-callouts__title');
      title.textContent = h.label;
      card.appendChild(title);
      if (h.text) {
        var desc = el('div', 'yh-workshop-callouts__desc');
        desc.textContent = h.text;
        card.appendChild(desc);
      }
      wrap.appendChild(card);

      refs[h.id] = { line: line, badge: badge, card: card };
    });
    sceneStage.appendChild(wrap);

    function layout(mobile) {
      callouted.forEach(function (h) {
        var r = refs[h.id];
        var dot = mobile ? h.mobileCoords : h.desktopCoords;
        var anchor = (mobile ? h.mobileCalloutCoords : h.desktopCalloutCoords) || dot;
        r.badge.style.left = dot.x + '%';
        r.badge.style.top = dot.y + '%';
        r.card.style.left = anchor.x + '%';
        r.card.style.top = anchor.y + '%';
        r.line.setAttribute('x1', dot.x);
        r.line.setAttribute('y1', dot.y);
        r.line.setAttribute('x2', anchor.x);
        r.line.setAttribute('y2', anchor.y);
      });
    }

    function destroy() { wrap.remove(); }

    return { layout: layout, destroy: destroy };
  }

  var ZONE_DATA_SOURCES = {
    '02': function () {
      return { hotspots: YHApp.ZONE_02_HOTSPOTS, presentation: YHApp.ZONE_02_PRESENTATION, urlMapKey: 'RESEARCH_MATERIAL_URLS' };
    }
  };

  function createHotspotSceneBehavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var zoneId = zone.shared.id;
    var source = ZONE_DATA_SOURCES[zoneId];
    if (!source) return { destroy: function () {}, closeAllCaptions: function () {} };
    var data = source();
    var urlMap = (config.links && config.links[data.urlMapKey]) || {};
    var hotspots = data.hotspots;
    var presentation = data.presentation;

    var items = hotspots.map(function (h) {
      return {
        id: h.id,
        ariaLabel: h.title + (h.label ? ' — ' + h.label : ''),
        hoverLabel: presentation.hoverLabel,
        url: urlMap[h.id] || null,
        emptyMessage: presentation.emptyMessage
      };
    });

    var layer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-material-hotspot',
      items: items,
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        var h = hotspots.filter(function (x) { return x.id === item.id; })[0];
        return mobile ? h.mobileCoords : h.desktopCoords;
      }
    });
    layer.layout();

    var callouts = buildCallouts(sceneStage, hotspots, zone.shared.color);
    callouts.layout(isMobile());

    function destroy() { layer.destroy(); callouts.destroy(); }
    function closeAllCaptions() { layer.hideCaption(); }
    function layoutAll() { layer.layout(); callouts.layout(isMobile()); }

    return { destroy: destroy, layout: layoutAll, closeAllCaptions: closeAllCaptions };
  }

  YHApp.ZONE_BEHAVIORS['hotspot-scene'] = createHotspotSceneBehavior;
})(window.YHApp = window.YHApp || {});
