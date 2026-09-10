// Zone 06 (КОМАНДА) behavior — registered under shared.behavior:
// 'team-roles-chair'.
//
// Two independent layers inside .yh-scene-stage:
//   1. the chair — a real foreground PNG (transparent, keyed from the
//      delivered checkerboard-background cutout — see config/
//      zone-06-content.js) placed over the BASE's empty seat, with a real
//      <a> hotspot -> APPLICATION_URL. UNCHANGED by the role-cards pass
//      below — "твоё место в команде" stays the one real call-to-action
//      here, visually stronger (a real pull-out hover + labeled link)
//      than the purely-informational role cards.
//   2. role cards — always-visible annotations reusing the shared Zone
//      02/03 system (core/spatial-annotations.js): "ONE SITE = ONE
//      ANNOTATION LANGUAGE" extended to people instead of objects. No
//      hover/click needed to read a role, and no "+" (a role has no
//      additional material/URL — per the site-wide rule, "+" only ever
//      means "there is something more to open"). This REPLACES the
//      earlier click-to-reveal person hotspots (generic
//      createHotspotLayer, hover hint + fallback caption) entirely.
//
// PERSON -> ROLE mapping: the one already approved and delivered by the
// customer ("давай сразу же присвоим каждому человеку роль" — see
// config/zone-06-content.js ZONE_06_PEOPLE) — not re-derived or guessed
// here. Five people in the BASE, six roles supplied; 'Исследователь'
// stays unassigned (YHApp.ZONE_06_UNASSIGNED_ROLE) since there is no
// sixth person to attach it to.

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
    var people = YHApp.ZONE_06_PEOPLE;
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

    // ==== role cards — always visible, no "+" (no material/URL exists
    // for a role), reusing the shared spatial-annotations component.
    // Each person entry's role/roleText map to label/text; no `order` is
    // passed since people aren't a numbered sequence, so the card renders
    // without the numbered badge. ====
    var roleHotspots = people.map(function (p) {
      return {
        id: p.id,
        label: p.role,
        text: p.roleText,
        desktopCoords: p.desktopCoords,
        mobileCoords: p.mobileCoords,
        desktopCalloutCoords: p.desktopCalloutCoords,
        mobileCalloutCoords: p.mobileCalloutCoords
      };
    });
    // customer spec ("ZONE 06 — MOBILE ONLY"): a scoped modifier class so
    // the mobile card-width reduction below (css) only ever applies here,
    // never to Zone 02/03's own mobile cards which share this same
    // component — "desktop layout не менять вообще" extends to "don't
    // touch other zones either" by the same logic.
    // Mobile also opts into titles-only (originally a Zone 03-only rule):
    // with 5 people's card sizes now correct (see the resolution-
    // independence fix in core/spatial-annotations.js), the FULL role
    // description simply doesn't leave enough vertical room to fit 3
    // cards in one column above the bottom nav on the narrowest real
    // phones — the same content-doesn't-fit problem Zone 03 hit first.
    // The role NAME alone (already the headline of each card) still
    // reads fine without its one-sentence blurb underneath.
    var roleAnnotations = YHApp.createSpatialAnnotations(sceneStage, roleHotspots, {}, mobile, mobile ? 'yh-workshop-annotation-layer--zone06-mobile yh-workshop-annotation-layer--titles-only' : null);

    function destroy() {
      hotspotLayer.destroy();
      roleAnnotations.destroy();
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
