// Zone 06 (КОМАНДА) behavior — registered under shared.behavior:
// 'team-roles-chair'.
//
// One real interactive layer inside .yh-scene-stage: the chair — a real
// foreground PNG (transparent, keyed from the delivered checkerboard-
// background cutout — see config/zone-06-content.js) placed over the
// BASE's empty seat, with a real <a> hotspot -> APPLICATION_URL. "твоё
// место в команде" is the one real call-to-action here (a pull-out hover
// + labeled link).
//
// The role cards (УРБАНИСТ/ДИЗАЙНЕР/etc.) that used to render here via
// core/spatial-annotations.js are gone as of the customer's 2026-09-10
// decision ("не делать карточки текстом, а просто картинками") — they're
// drawn directly into the BASE image now (config/scenes.js
// zone-06-desktop/mobile), same as Zone 02/03.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone06Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var links = config.links || YHApp.LINKS;
    var chair = YHApp.ZONE_06_CHAIR;
    var presentation = YHApp.ZONE_06_PRESENTATION;

    // ==== chair (static foreground image, always visible) — unchanged ====
    var chairImg = el('img', 'yh-team-chair-image', { src: chair.asset.src, alt: '', draggable: 'false' });
    var chairBox = mobile ? chair.mobile : chair.desktop;
    chairImg.style.left = chairBox.left + '%';
    chairImg.style.top = chairBox.top + '%';
    chairImg.style.width = chairBox.width + '%';
    chairImg.style.height = chairBox.height + '%';
    sceneStage.appendChild(chairImg);

    var hotspotLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-team-hotspot',
      items: [{
        id: 'chair',
        ariaLabel: 'Твоё место в команде — подать заявку',
        hoverLabel: presentation.chairHoverLabel,
        url: links.APPLICATION_URL
      }],
      isMobile: isMobile,
      // customer (2026-09-14): same "shrinks with the scene's own camera
      // zoom" bug as Zone 00/01's labels — see core/hotspot-layer.js.
      counterScaleLabel: true,
      getCoords: function () {
        return mobile ? chair.hotspotMobileCoords : chair.hotspotDesktopCoords;
      }
    });
    hotspotLayer.layout();

    // size the chair hotspot to its real footprint (default is a small
    // 44x44 dot — same override pattern used across every other zone)
    var chairHotspotSize = mobile ? chair.hotspotMobileSize : chair.hotspotDesktopSize;
    if (hotspotLayer.elements.chair) {
      hotspotLayer.elements.chair.style.width = chairHotspotSize.w + '%';
      hotspotLayer.elements.chair.style.height = chairHotspotSize.h + '%';
    }

    // desktop-only "pulled out toward you" hover animation on the chair
    // itself (CSS transition on .yh-team-chair-image, see app.css) — same
    // hover/focus-triggered, code-only approach as Zone 04's drawer glow,
    // no new asset needed.
    var chairHotspotNode = hotspotLayer.elements.chair;
    if (chairHotspotNode && !mobile) {
      chairHotspotNode.addEventListener('mouseenter', function () { chairImg.classList.add('is-pulled'); });
      chairHotspotNode.addEventListener('mouseleave', function () { chairImg.classList.remove('is-pulled'); });
      chairHotspotNode.addEventListener('focus', function () { chairImg.classList.add('is-pulled'); });
      chairHotspotNode.addEventListener('blur', function () { chairImg.classList.remove('is-pulled'); });
    }

    // Role cards (УРБАНИСТ/ДИЗАЙНЕР/etc.) used to render here via the
    // shared spatial-annotations component. Customer decision
    // (2026-09-10): "не делать карточки текстом, а просто картинками" —
    // every role card is now drawn directly into the BASE image itself
    // (config/scenes.js zone-06-desktop/mobile), so there is nothing left
    // for this behavior to render there (config/zone-06-content.js's
    // ZONE_06_PEOPLE is unused now; kept for its role/roleText copy).

    function destroy() {
      hotspotLayer.destroy();
      chairImg.remove();
    }

    function closeAllCaptions() {
      hotspotLayer.hideCaption();
    }

    return {
      destroy: destroy,
      layout: hotspotLayer.layout,
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['team-roles-chair'] = createZone06Behavior;
})(window.YHApp = window.YHApp || {});
