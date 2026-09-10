// Zone 04 (АРХИВ / КАРТОТЕКА) behavior — registered under
// shared.behavior:'archive-drawers'.
//
// Reuses createHotspotLayer for the 5 clickable regions over the closed
// drawers (positioning, tap-vs-drag, aria, lifecycle) — every item uses
// onActivate (never url), so the layer's own built-in text caption is
// never shown; Zone 04's own lightbox is bespoke because it needs a REAL
// <a> for archiveFolderUrl, which the generic layer's caption (plain text
// only) cannot render.
//
// LIGHTBOX REDESIGN (customer decision, supersedes the original per-scene
// full-canvas overlay): clicking a drawer no longer swaps in a full-canvas
// foreground positioned at scene coordinates. Instead the whole scene gets
// darkened + blurred (CSS only, both platforms share this via
// core/mount.js's viewport-fixed overlayRoot, which sits outside the
// pan/zoom-transformed sceneStage so it never inherits that transform),
// and ONE reference photo per town — not per platform — is shown large,
// centered, scaled to fit. Same source image, same file, desktop and
// mobile: "картинки которые будут накладываться будут одними и теми же,
// просто будут масштабироваться" (customer instruction). This also means
// the earlier "close via opening another drawer" trigger no longer
// applies as a direct click-through — the backdrop now visually covers
// the closed drawers, so there is nothing to click through to; close
// first (×/Escape/backdrop), then open a different one.
//
// DESKTOP HOVER — CODE-ONLY GLOW (customer decision: the simulated
// "physical pull-out" — first as separate peek/mask PNGs, then as a CSS
// background-crop of the BASE nudged forward — never read as realistic
// ("получается не совсем реалистично"). Simplified to a plain glow: one
// reused box sized to that drawer's own row (config peekBoxCoords/
// peekBoxSize), faded in on hover/focus. Lives INSIDE sceneStage (not the
// overlayRoot the lightbox uses), so it inherits the same pan/zoom
// transform as the BASE and never screen-centers. Desktop only: mobile has
// no hover, tap still goes straight to the lightbox untouched.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone04Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var objects = config.objects || YHApp.OBJECTS;
    var drawers = YHApp.ZONE_04_DRAWERS;
    var presentation = YHApp.ZONE_04_PRESENTATION;

    function objectFor(id) { return objects.filter(function (o) { return o.id === id; })[0]; }
    function drawerFor(id) { return drawers.filter(function (d) { return d.id === id; })[0]; }

    // ---- lightbox DOM, built once inside the viewport-fixed overlayRoot
    // (a sibling of the scene, NOT a descendant of sceneStage — see
    // mount.js's overlayRoot comment for why that matters) ----
    var lightbox = el('div', 'yh-archive-lightbox');
    lightbox.hidden = true;
    var backdrop = el('div', 'yh-archive-lightbox__backdrop', { 'aria-hidden': 'true' });
    var content = el('div', 'yh-archive-lightbox__content', { role: 'dialog', 'aria-modal': 'true' });
    var closeBtn = el('button', 'yh-archive-lightbox__close', { type: 'button', 'aria-label': presentation.closeLabel });
    closeBtn.textContent = '×';
    var img = el('img', 'yh-archive-lightbox__image', { alt: '', draggable: 'false' });
    var panel = el('div', 'yh-archive-lightbox__panel');
    var panelTitle = el('div', 'yh-archive-lightbox__title');
    var panelBody = el('div', 'yh-archive-lightbox__body');
    panel.appendChild(panelTitle);
    panel.appendChild(panelBody);
    content.appendChild(closeBtn);
    content.appendChild(img);
    content.appendChild(panel);
    lightbox.appendChild(backdrop);
    lightbox.appendChild(content);
    callbacks.overlayRoot.appendChild(lightbox);

    var openId = null;

    // ---- desktop-only hover glow, lives INSIDE sceneStage (unlike the
    // lightbox) so it pans/zooms with the BASE. One reused box sized to
    // that drawer's own row (config peekBoxCoords/peekBoxSize), faded in
    // on hover/focus. ----
    var peekGlow = el('div', 'yh-archive-peek-glow');
    sceneStage.appendChild(peekGlow);
    var peekId = null;

    // ---- cursor-following "ОТКРОЙ" hint — lives in the viewport-fixed
    // overlayRoot (not sceneStage), same reason as the lightbox: text needs
    // to stay a fixed CSS size and follow the real cursor position,
    // unaffected by the scene's own pan/zoom transform. Mouse-only (no
    // cursor position on keyboard focus — positioned at the hotspot itself
    // instead in that case). ----
    var hoverHint = el('div', 'yh-archive-hover-hint', { 'aria-hidden': 'true' });
    hoverHint.textContent = presentation.hoverHint;
    hoverHint.hidden = true;
    callbacks.overlayRoot.appendChild(hoverHint);

    function moveHoverHint(x, y) {
      hoverHint.style.left = x + 'px';
      hoverHint.style.top = y + 'px';
    }

    function hidePeek() {
      if (!peekId) return;
      peekId = null;
      peekGlow.classList.remove('is-active');
      hoverHint.hidden = true;
    }

    function showPeek(id) {
      var drawer = drawerFor(id);
      if (!drawer || openId) return; // no glow while the lightbox is open
      peekId = id;

      // inflate beyond the row's own box so the soft glow spills outward
      // past the drawer's edges instead of being clipped to its rectangle
      var box = drawer.peekBoxCoords, size = drawer.peekBoxSize;
      var padX = size.w * 0.35, padY = size.h * 0.35;
      peekGlow.style.left = (box.left - padX) + '%';
      peekGlow.style.top = (box.top - padY) + '%';
      peekGlow.style.width = (size.w + padX * 2) + '%';
      peekGlow.style.height = (size.h + padY * 2) + '%';

      // rAF so the opacity transitions from rest instead of snapping
      window.requestAnimationFrame(function () {
        peekGlow.classList.add('is-active');
      });
    }

    function renderPanelBody(obj) {
      panelBody.innerHTML = '';
      if (obj.archiveFolderUrl) {
        var link = el('a', 'yh-archive-lightbox__link', {
          href: obj.archiveFolderUrl,
          target: '_blank',
          rel: 'noopener noreferrer'
        });
        link.textContent = presentation.linkLabel;
        panelBody.appendChild(link);
      } else {
        var msg = el('div', 'yh-archive-lightbox__empty');
        msg.textContent = presentation.emptyMessage;
        panelBody.appendChild(msg);
      }
    }

    function closeDrawer() {
      if (!openId) return;
      openId = null;
      lightbox.classList.remove('is-open');
      window.setTimeout(function () {
        // only hide after the closing transition finishes, and only if
        // nothing re-opened in the meantime
        if (!openId) lightbox.hidden = true;
      }, 220);
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
    }

    function openDrawer(id) {
      var drawer = drawerFor(id);
      var obj = objectFor(id);
      if (!drawer || !obj) return;

      hidePeek();
      openId = id;
      if (drawer.openAsset) {
        img.src = drawer.openAsset.src;
        img.hidden = false;
      } else {
        // graceful degradation for a town missing its open-state artwork —
        // never fabricated, never substituted: caption-only, same spirit
        // as a null archiveFolderUrl.
        img.hidden = true;
      }

      panelTitle.textContent = obj.number + ' ' + obj.title.toUpperCase();
      renderPanelBody(obj);
      lightbox.hidden = false;

      // rAF so the just-unhidden lightbox transitions FROM its CSS resting
      // (closed) state instead of snapping straight to is-open
      window.requestAnimationFrame(function () {
        lightbox.classList.add('is-open');
      });

      if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
      closeBtn.focus();
    }

    closeBtn.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);

    function onKeydown(e) {
      if (e.key === 'Escape' && openId) closeDrawer();
    }
    lightbox.addEventListener('keydown', onKeydown);

    // ---- 5 clickable hotspots over the closed drawers ----
    // no hoverLabel: the plate's number+name is already baked into the
    // BASE artwork itself, a redundant text label would just overlap it —
    // "subtle desktop hover" here is the CSS-only tint on
    // .yh-archive-hotspot__item (see app.css), not a second text layer.
    var items = drawers.map(function (d) {
      var obj = objectFor(d.id);
      return {
        id: d.id,
        ariaLabel: obj.number + ' ' + obj.title + ' — открыть ящик',
        onActivate: function () { openDrawer(d.id); }
      };
    });

    var layer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-archive-hotspot',
      items: items,
      isMobile: isMobile,
      getCoords: function (item, mobile) {
        var d = drawerFor(item.id);
        return mobile ? d.mobileCoords : d.desktopCoords;
      }
    });
    layer.layout();

    // mobile-only, PERMANENT "here's where to tap" glow on each drawer's
    // own number badge (customer: "изначально подсветим номера ящиков...
    // Хочется чтобы свечение было всегда, натуральное полупрозрачное" —
    // a first timed-intro version was tried and rejected: it used the
    // desktop-only peekBoxCoords/peekBoxSize, which are calibrated
    // against the DESKTOP base image and don't line up with the same
    // badges on the mobile base's own different composition — hence
    // "не совпадают с цифрами". mobileBadgeCoords below is measured
    // directly off the real mobile render instead (color-sampled badge
    // centers converted through the camera transform), and unlike the
    // desktop hover peekGlow (one shared, reused element) this needs 5
    // independent, permanently-visible glows at once, so each gets its
    // own dedicated element.
    var badgeGlows = [];
    if (isMobile()) {
      drawers.forEach(function (d) {
        var coords = d.mobileBadgeCoords;
        if (!coords) return;
        var glow = el('div', 'yh-archive-badge-glow is-active');
        glow.style.left = (coords.x - coords.w / 2) + '%';
        glow.style.top = (coords.y - coords.h / 2) + '%';
        glow.style.width = coords.w + '%';
        glow.style.height = coords.h + '%';
        sceneStage.appendChild(glow);
        badgeGlows.push(glow);
      });
    }

    // desktop-only: hover/focus fades in that drawer's own glow box.
    // Snapshot isMobile() once at creation — same convention already used
    // elsewhere (e.g. Zone 00's CTA sizing) — a real breakpoint cross
    // remounts this whole behavior anyway (see mount.js ResizeObserver).
    if (!isMobile()) {
      drawers.forEach(function (d) {
        var node = layer.elements[d.id];
        if (!node) return;
        node.addEventListener('mouseenter', function (e) {
          showPeek(d.id);
          moveHoverHint(e.clientX + 18, e.clientY + 18);
          hoverHint.hidden = false;
        });
        node.addEventListener('mousemove', function (e) {
          moveHoverHint(e.clientX + 18, e.clientY + 18);
        });
        node.addEventListener('mouseleave', hidePeek);
        node.addEventListener('focus', function () {
          showPeek(d.id);
          // no cursor position on keyboard focus — anchor to the hotspot itself
          var r = node.getBoundingClientRect();
          moveHoverHint(r.left + r.width / 2 + 18, r.top + r.height / 2 + 18);
          hoverHint.hidden = false;
        });
        node.addEventListener('blur', hidePeek);
      });
    }

    function destroy() {
      badgeGlows.forEach(function (g) { g.remove(); });
      closeDrawer();
      hidePeek();
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
      layer.destroy();
      lightbox.remove();
      peekGlow.remove();
      hoverHint.remove();
    }

    function closeAllCaptions() {
      layer.hideCaption();
      closeDrawer();
    }

    return {
      destroy: destroy,
      layout: layer.layout,
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['archive-drawers'] = createZone04Behavior;
})(window.YHApp = window.YHApp || {});
