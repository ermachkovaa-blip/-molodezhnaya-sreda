// Zone 05 (ГАЛЕРЕЯ / БИБЛИОТЕКА) behavior — registered under
// shared.behavior:'gallery-complex'. Three independent physical
// interactives, per FAST MODE / STAGE 5 spec — not a dashboard/card-grid.
//
// 1. SHELF — a real HTML hotspot (createHotspotLayer, same generic
//    mechanism every other zone uses) over a static shelf PNG placed on
//    the BASE's floor medallion. Click/tap → STANDARD_URL or fallback.
//
// 2. FLYING PAGES — 10 approved pages (config/zone-05-content.js —
//    numbering independently verified against the actual scans this
//    session, see that file's header). Each page is a real <button>
//    (native click/tap semantics, so the SAME tap-vs-drag arbitration
//    gesture-controller.js already gives every other hotspot in this app
//    applies here for free — a scene drag never fires a page's click).
//
//    LIFECYCLE (customer revision — "в базовом состоянии нет листов, они
//    вылетают когда мы наводим курсор на книгу и постепенно падают вниз и
//    исчезают", replacing the earlier ambient-proximity-drift version):
//    dormant (fully invisible, no exceptions) -> hovering the book/shelf
//    hotspot releases a staggered group -> rising (page flies up from the
//    shelf to its own anchor point) -> falling (accelerating downward
//    drift + gentle sway/tumble while fading out) -> back to dormant,
//    ready for a later hover to release it again. Hovering an individual
//    already-released page (desktop) freezes+straightens+enlarges it via
//    a CSS class so it can be read, independent of its fall progress.
//    Click opens the reader lightbox.
//
// 3. READER — reuses the exact lightbox pattern Zone 04 established:
//    darken+blur the scene (CSS backdrop-filter, viewport-fixed
//    overlayRoot so it never inherits the scene's pan/zoom), image shown
//    large with object-fit:contain (original proportions, never
//    stretched), close via ×/Escape/backdrop, camera pause via
//    callbacks.setPanDisabled — same contract as Zone 04's lightbox.
//
// 4. FABRIC — a second real HTML hotspot, same mechanism as the shelf,
//    over the static banner PNG. Click/tap → RENOVATION_ARCHIVE_URL or
//    fallback. No HTML text duplicating the banner's own baked graphic —
//    the hotspot is purely a transparent click target. A CSS-only
//    "колыхание" (wind-sway) keyframe animation runs on the banner image
//    itself at all times (app.css yh-fabric-wave) — code-only, no new
//    asset, same spirit as the shelf glow / chair pull-out elsewhere.
//
// Camera pause priority (spec p.7): reader open, a page hover-selected,
// or the user actively dragging a page all pause/damp the global pan via
// the same callbacks.setPanDisabled hook Zone 04 introduced in mount.js —
// no new hook needed.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone05Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var links = config.links || YHApp.LINKS;
    var shelf = YHApp.ZONE_05_SHELF;
    var fabric = YHApp.ZONE_05_FABRIC;
    var pages = YHApp.ZONE_05_PAGES;
    var presentation = YHApp.ZONE_05_PRESENTATION;
    var rotation = YHApp.ZONE_05_SHELF_ROTATION;

    // ==== static placed objects (shelf + fabric images, always visible) ====
    // shelf image now swaps between rotation.frames[N] (see below) instead
    // of a single fixed src — customer request: base = frontal frame
    // (pink "СТАНДАРТ ДЕЯТЕЛЬНОСТИ" cover centered), hover = a small
    // "туда-сюда" nudge, click = a full 180° turn to the back frame.
    // customer spec ("ZONE 05 — SHELF ROTATION"): frame changes must never
    // be an instant src/display swap — two stacked <img> layers crossfade
    // (350-500ms, old 1->0 / new 0->1) plus a very light settle transform,
    // so consecutive frames read as continuous motion rather than a
    // slideshow cut. Both layers share the exact same box (percent
    // left/top/width/height), one is always ".. --front" (opaque, resting)
    // and the other "--back" (transparent, holds whichever frame is about
    // to come forward) — setShelfFrame just swaps which modifier each
    // layer has; the crossfade itself is a plain CSS transition, no JS
    // animation loop needed.
    var shelfImgA = el('img', 'yh-gallery-shelf-image yh-gallery-shelf-image--front', { src: shelf.asset.src, alt: '', draggable: 'false' });
    var shelfImgB = el('img', 'yh-gallery-shelf-image yh-gallery-shelf-image--back', { src: shelf.asset.src, alt: '', draggable: 'false' });
    var shelfBox = mobile ? shelf.mobile : shelf.desktop;
    [shelfImgA, shelfImgB].forEach(function (img) {
      img.style.left = shelfBox.left + '%';
      img.style.top = shelfBox.top + '%';
      img.style.width = shelfBox.width + '%';
      img.style.height = shelfBox.height + '%';
      img.dataset.frameIdx = '0';
      sceneStage.appendChild(img);
    });
    // preload every rotation frame up front — otherwise the first time a
    // given frame is reached, assigning its src to the (until-then-blank)
    // back layer could show a brief blank/loading gap instead of a clean
    // crossfade, on anything slower than a local file.
    rotation.frames.forEach(function (f) { var pre = new Image(); pre.src = f.src; });

    // shelfImg — the current front-facing layer, used by layoutBookLink()
    // for its own on-screen box measurement (both layers share one box,
    // so either would do).
    var shelfImg = shelfImgA;
    var frontLayer = shelfImgA, backLayer = shelfImgB;

    // ---- rotation state machine ----
    var REST_FRONT = 0;
    var REST_BACK = rotation.frames.length - 1; // 7
    var restingFrame = REST_FRONT;
    var wobbling = false;
    var wobbleShowingAlt = false;
    var wobbleTimer = null;
    var turning = false; // a full click-rotate animation is in progress
    var turnTimer = null;

    function setShelfFrame(idx) {
      if (frontLayer.dataset.frameIdx === String(idx)) return; // already showing it
      backLayer.src = rotation.frames[idx].src;
      backLayer.dataset.frameIdx = String(idx);
      frontLayer.classList.remove('yh-gallery-shelf-image--front');
      frontLayer.classList.add('yh-gallery-shelf-image--back');
      backLayer.classList.remove('yh-gallery-shelf-image--back');
      backLayer.classList.add('yh-gallery-shelf-image--front');
      var swap = frontLayer; frontLayer = backLayer; backLayer = swap;
      shelfImg = frontLayer;
    }

    function wobbleTargetFrame() {
      // one step "toward the side" from whichever resting pose is current
      return restingFrame === REST_FRONT ? 1 : REST_BACK - 1;
    }

    function startWobble() {
      if (mobile || turning || wobbling) return;
      wobbling = true;
      wobbleShowingAlt = false;
      wobbleTimer = window.setInterval(function () {
        wobbleShowingAlt = !wobbleShowingAlt;
        setShelfFrame(wobbleShowingAlt ? wobbleTargetFrame() : restingFrame);
      }, rotation.hoverWobbleIntervalMs);
    }

    function stopWobble() {
      if (wobbleTimer) { window.clearInterval(wobbleTimer); wobbleTimer = null; }
      wobbling = false;
      wobbleShowingAlt = false;
      if (!turning) setShelfFrame(restingFrame);
    }

    function rotateShelf() {
      if (turning) return; // debounce — ignore clicks mid-animation
      stopWobble();
      turning = true;
      updateBookLink();
      var forward = restingFrame === REST_FRONT;
      var step = forward ? 1 : -1;
      var i = restingFrame;
      turnTimer = window.setInterval(function () {
        i += step;
        setShelfFrame(i);
        if ((forward && i >= REST_BACK) || (!forward && i <= REST_FRONT)) {
          window.clearInterval(turnTimer);
          turnTimer = null;
          restingFrame = forward ? REST_BACK : REST_FRONT;
          turning = false;
          if (shelfHovered && !mobile) startWobble();
          updateBookLink();
        }
      }, rotation.turnFrameIntervalMs);
    }

    // ---- "СТАНДАРТ ДЕЯТЕЛЬНОСТИ" book link (customer: "на розовую книгу:
    // https://mctatarstan.ru/standart") — the whole-shelf area now turns
    // the shelf on click (see rotateShelf above), so the book itself needs
    // its own smaller, higher-priority real link layered on top of it —
    // otherwise clicking the book would just rotate it, never open the
    // document. Only meaningful/clickable while the book is actually
    // facing the viewer (restingFrame === REST_FRONT, not mid-turn);
    // pointer-events:none the rest of the time so clicks fall through to
    // the rotate button beneath it instead of hitting a dead link.
    // Position/size computed from the book's real pixel bounding box in
    // the rot-0 source PNG (measured directly off the asset, not
    // guessed) mapped onto the shelf image's actual on-screen rendered
    // rect — object-fit:contain math, same rigor as every other
    // calibrated coordinate in this project — so it stays correctly
    // aligned across breakpoints/resizes without separate desktop/mobile
    // constants.
    var BOOK_FRAC = { left: 750 / 1672, right: 910 / 1672, top: 322 / 941, bottom: 540 / 941 };

    var bookLink = el('a', 'yh-gallery-book-link', {
      target: '_blank', rel: 'noopener noreferrer',
      'aria-label': 'Открыть Стандарт деятельности молодёжных центров'
    });
    if (links.STANDARD_URL) {
      bookLink.href = links.STANDARD_URL;
    } else {
      bookLink.href = '#';
      bookLink.setAttribute('aria-disabled', 'true');
      bookLink.addEventListener('click', function (e) { e.preventDefault(); });
    }
    var bookLinkLabel = el('span', 'yh-gallery-book-link__label');
    bookLinkLabel.textContent = presentation.shelfHoverLabel;
    bookLink.appendChild(bookLinkLabel);
    sceneStage.appendChild(bookLink);

    function layoutBookLink() {
      var stageRect = sceneStage.getBoundingClientRect();
      var imgRect = shelfImg.getBoundingClientRect();
      if (!stageRect.width || !imgRect.width) return;
      // counter-scale the label back to a true, legible on-screen size —
      // the classic "fixed CSS px shrinks with the stage's own camera-
      // scale transform" bug already found/fixed elsewhere in this
      // project (see e.g. Zone 01's ZONE_01_HOTSPOT_SIZE comment), except
      // here it's TEXT, which can't be sized as percent-of-image the way
      // a hotspot box can — so instead the label is scaled by the
      // inverse of the stage's live transform scale (offsetWidth is the
      // stage's UNSCALED layout width; the ratio to its actual rendered
      // width IS that live scale), keeping it a constant real size
      // (~intended font-size/padding) at any zoom level, mobile's small
      // camera scale included.
      var liveScale = sceneStage.offsetWidth ? (stageRect.width / sceneStage.offsetWidth) : 1;
      bookLinkLabel.style.transform = 'scale(' + (liveScale ? 1 / liveScale : 1) + ')';
      // layoutFabricLabel (defined below) has its own bookkeeping but no
      // reliable trigger of its own that's guaranteed to fire AFTER the
      // stage is actually laid out (unlike this function, whose early
      // calls bail via the guard above and only succeed once one of its
      // several retries lands post-layout) — piggyback on this proven-
      // reliable moment instead of duplicating that retry chain.
      if (typeof layoutFabricLabel === 'function') layoutFabricLabel();
      var natAR = shelf.asset.w / shelf.asset.h;
      var boxAR = imgRect.width / imgRect.height;
      var content;
      if (boxAR > natAR) {
        var rh = imgRect.height, rw = rh * natAR;
        content = { left: imgRect.left + (imgRect.width - rw) / 2, top: imgRect.top, width: rw, height: rh };
      } else {
        var rw2 = imgRect.width, rh2 = rw2 / natAR;
        content = { left: imgRect.left, top: imgRect.top + (imgRect.height - rh2), width: rw2, height: rh2 };
      }
      var bookLeft = content.left + BOOK_FRAC.left * content.width;
      var bookRight = content.left + BOOK_FRAC.right * content.width;
      var bookTop = content.top + BOOK_FRAC.top * content.height;
      var bookBottom = content.top + BOOK_FRAC.bottom * content.height;
      bookLink.style.left = ((bookLeft - stageRect.left) / stageRect.width * 100) + '%';
      bookLink.style.top = ((bookTop - stageRect.top) / stageRect.height * 100) + '%';
      bookLink.style.width = ((bookRight - bookLeft) / stageRect.width * 100) + '%';
      bookLink.style.height = ((bookBottom - bookTop) / stageRect.height * 100) + '%';
    }

    function updateBookLink() {
      var active = !turning && restingFrame === REST_FRONT;
      bookLink.classList.toggle('is-active', active);
      layoutBookLink();
    }
    updateBookLink();
    // layoutBookLink() bails out (leaving left/top unset -> the link sits
    // wherever position:absolute defaults with no offset) whenever the
    // shelf image hasn't finished laying out yet, which the very first
    // call above can easily race — a real bug, not just an initial-frame
    // nicety: it's WHY the plaque could end up parked in a corner instead
    // of on the book. requestAnimationFrame retries once the browser has
    // actually painted; the image's own load event covers the case where
    // its natural size wasn't even known yet at mount time.
    window.requestAnimationFrame(layoutBookLink);
    shelfImgA.addEventListener('load', layoutBookLink);

    var fabricImg = el('img', 'yh-gallery-fabric-image', { src: fabric.asset.src, alt: '', draggable: 'false' });
    var fabricBox = mobile ? fabric.mobile : fabric.desktop;
    fabricImg.style.left = fabricBox.left + '%';
    fabricImg.style.top = fabricBox.top + '%';
    fabricImg.style.width = fabricBox.width + '%';
    fabricImg.style.height = fabricBox.height + '%';
    sceneStage.appendChild(fabricImg);

    // ==== fabric hotspot (generic hotspot-layer, same mechanism as every
    // other zone) — the shelf used to share this generic click-opens-url
    // hotspot too, but the customer's rotate request repurposes its click
    // for the turn animation instead (see shelfRotateBtn below). STANDARD_URL
    // is currently null anyway (no live link broken by this), but flagged
    // to the customer: once a real "Стандарт" document link exists, it
    // needs a different trigger than this click (which now always turns
    // the shelf). ====
    var hotspotItems = [
      {
        id: 'fabric',
        ariaLabel: 'Архив реализованных объектов реновации',
        hoverLabel: presentation.fabricHoverLabel,
        url: links.RENOVATION_ARCHIVE_URL,
        emptyMessage: presentation.fabricEmptyMessage
      }
    ];

    var hotspotLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-gallery-hotspot',
      items: hotspotItems,
      isMobile: isMobile,
      getCoords: function (item, mob) {
        return mob ? fabric.hotspotMobileCoords : fabric.hotspotDesktopCoords;
      }
    });
    hotspotLayer.layout();

    var fabricHotspotSize = mobile ? fabric.hotspotMobileSize : fabric.hotspotDesktopSize;
    var fabricLabel = null;
    if (hotspotLayer.elements.fabric) {
      hotspotLayer.elements.fabric.style.width = fabricHotspotSize.w + '%';
      hotspotLayer.elements.fabric.style.height = fabricHotspotSize.h + '%';
      fabricLabel = hotspotLayer.elements.fabric.querySelector('.yh-gallery-hotspot__label');
    }

    // customer: "кнопка прочитать стандарт больше чем кнопка перейти на
    // полотне" — ПЕРЕЙТИ's label is the GENERIC hotspot-layer one, which
    // (unlike the book link's, see layoutBookLink below) was never
    // counter-scaled against the stage's camera zoom, so on mobile's
    // heavy zoom-out it rendered visibly smaller than the book's CTA.
    // Same fix, scoped to this one label (layerClass 'yh-gallery-hotspot'
    // is only ever used here, not shared with another zone).
    function layoutFabricLabel() {
      if (!fabricLabel) return;
      var stageRect = sceneStage.getBoundingClientRect();
      var liveScale = sceneStage.offsetWidth ? (stageRect.width / sceneStage.offsetWidth) : 1;
      fabricLabel.style.transform = 'translate(-50%, -50%) scale(' + (liveScale ? 1 / liveScale : 1) + ')';
    }
    layoutFabricLabel();
    window.requestAnimationFrame(layoutFabricLabel);
    shelfImgA.addEventListener('load', layoutFabricLabel);

    // ==== shelf rotate hotspot — dedicated button (not the generic
    // hotspot-layer, since its click semantics here are "turn the shelf",
    // not "open a url") over the same real footprint as before. ====
    var shelfHotspotSize = mobile ? shelf.hotspotMobileSize : shelf.hotspotDesktopSize;
    var shelfHotspotCoordsForBtn = mobile ? shelf.hotspotMobileCoords : shelf.hotspotDesktopCoords;
    var shelfRotateBtn = el('button', 'yh-gallery-shelf-rotate-btn', {
      type: 'button',
      'aria-label': 'Повернуть шкаф'
    });
    shelfRotateBtn.style.left = shelfHotspotCoordsForBtn.x + '%';
    shelfRotateBtn.style.top = shelfHotspotCoordsForBtn.y + '%';
    shelfRotateBtn.style.width = shelfHotspotSize.w + '%';
    shelfRotateBtn.style.height = shelfHotspotSize.h + '%';
    sceneStage.appendChild(shelfRotateBtn);

    // cursor-following tooltip ("покрути шкаф") — viewport-fixed (lives in
    // overlayRoot, same as the reader lightbox) so it just tracks raw
    // clientX/clientY, no scene pan/zoom math needed. Desktop only.
    var shelfTooltip = el('div', 'yh-gallery-shelf-tooltip', { 'aria-hidden': 'true' });
    shelfTooltip.textContent = rotation.tooltipText;
    shelfTooltip.hidden = true;
    callbacks.overlayRoot.appendChild(shelfTooltip);

    function showTooltipAt(clientX, clientY) {
      shelfTooltip.style.left = clientX + 'px';
      shelfTooltip.style.top = clientY + 'px';
      shelfTooltip.hidden = false;
    }
    function hideTooltip() { shelfTooltip.hidden = true; }

    if (!mobile) {
      shelfRotateBtn.addEventListener('pointermove', function (e) {
        showTooltipAt(e.clientX, e.clientY);
      });
      shelfRotateBtn.addEventListener('mouseleave', hideTooltip);
      shelfRotateBtn.addEventListener('blur', hideTooltip);
    }
    shelfRotateBtn.addEventListener('click', rotateShelf);

    // ==== reader lightbox (same contract as Zone 04's lightbox) ====
    var reader = el('div', 'yh-gallery-reader');
    reader.hidden = true;
    var readerBackdrop = el('div', 'yh-gallery-reader__backdrop', { 'aria-hidden': 'true' });
    var readerContent = el('div', 'yh-gallery-reader__content', { role: 'dialog', 'aria-modal': 'true' });
    var readerClose = el('button', 'yh-gallery-reader__close', { type: 'button', 'aria-label': presentation.readerCloseLabel });
    readerClose.textContent = '×';
    var readerImg = el('img', 'yh-gallery-reader__image', { alt: '', draggable: 'false' });
    readerContent.appendChild(readerClose);
    readerContent.appendChild(readerImg);
    reader.appendChild(readerBackdrop);
    reader.appendChild(readerContent);
    callbacks.overlayRoot.appendChild(reader);

    var openPageId = null;

    function closeReader() {
      if (!openPageId) return;
      openPageId = null;
      reader.classList.remove('is-open');
      window.setTimeout(function () {
        if (!openPageId) reader.hidden = true;
      }, 220);
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
    }

    function openReader(page) {
      openPageId = page.id;
      readerImg.src = page.src;
      readerImg.alt = page.alt;
      reader.hidden = false;
      window.requestAnimationFrame(function () {
        reader.classList.add('is-open');
      });
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
      readerClose.focus();
    }

    readerClose.addEventListener('click', closeReader);
    readerBackdrop.addEventListener('click', closeReader);

    function onReaderKeydown(e) {
      if (e.key === 'Escape' && openPageId) closeReader();
    }
    reader.addEventListener('keydown', onReaderKeydown);

    // ==== flying pages — hover-released, fall-and-fade lifecycle ====
    // Customer revision (supersedes the earlier "ambient proximity
    // drift" version — see the message that replaced it): rest state has
    // ZERO pages visible at all (no "peek" pages either). Hovering the
    // book/shelf ("при наведении курсора на книгу") releases a staggered
    // group; each page rises up briefly, then gradually falls downward
    // while fading out ("постепенно падают вниз и исчезают"), then
    // returns to dormant so it can be released again on a later hover.
    // Hover (or a mobile tap-to-select) on an individual page still
    // freezes/straightens/enlarges it immediately and keeps it that way
    // ~1.2s after the cursor leaves, so it never "runs away" mid-reach.
    var shelfHotspotCoords = mobile ? shelf.hotspotMobileCoords : shelf.hotspotDesktopCoords;

    var RISE_MS = 600;
    var FALL_MS = 2600;
    var FALL_DISTANCE = 26; // percent of scene the page falls before fully gone
    var STAGGER_MIN_MS = 250, STAGGER_MAX_MS = 450;
    var GROUP_MIN = 4, GROUP_MAX = 6;
    var COOLDOWN_MS = 2000;
    var HOVER_RELEASE_INTERVAL_MS = 1500; // keep releasing new groups while the book stays hovered
    var HOVER_RESUME_GRACE_MS = 1300; // "1-1.5s" before resuming after cursor leaves

    function easeOutCubic(p) { return 1 - Math.pow(1 - p, 3); }
    function easeInCubic(p) { return p * p * p; }
    function depthFactor(depth) { return 1 - depth * 0.32; } // 1, 0.68, 0.36
    function baseOpacityForDepth(depth) { return depth === 0 ? 0.7 : (depth === 1 ? 0.85 : 1); }

    var pageNodes = pages.map(function (p) {
      var btn = el('button', 'yh-gallery-page yh-gallery-page--depth' + p.depth, {
        type: 'button',
        'aria-label': p.alt
      });
      var img = el('img', 'yh-gallery-page__img', { src: p.src, alt: '', draggable: 'false' });
      btn.appendChild(img);
      // mobile scene is a different (portrait) image/composition than
      // desktop, so a shared x/y would put several pages off-screen or
      // under the fixed header/CTA (real bug found via elementFromPoint
      // scan: 6 of 10 pages were unreachable at the mobile camera preset
      // using the desktop-tuned x/y) — mobileX/mobileY are optional
      // per-page overrides, falling back to the shared x/y when absent.
      var px = mobile && p.mobileX != null ? p.mobileX : p.x;
      var py = mobile && p.mobileY != null ? p.mobileY : p.y;
      btn.style.left = px + '%';
      btn.style.top = py + '%';
      btn.dataset.pageId = p.id;
      sceneStage.appendChild(btn);
      return {
        data: p,
        node: btn,
        jitterPhase: Math.random() * Math.PI * 2,
        popPeak: 3 + Math.random() * 3, // percent, the "rise up a little first" hump
        // lifecycle: 'dormant' | 'rising' | 'falling'
        lifePhase: 'dormant',
        phaseElapsed: 0,
        frozen: false, // hover (desktop) or tap-selected (mobile)
        resumeAt: null,
        // percent-space offset from this page's own anchor (x/y) back to
        // the shelf's hotspot origin — its own individual "flight path"
        // (spec: pages should differ in trajectory, not just size/tilt).
        originOffsetX: shelfHotspotCoords.x - px,
        originOffsetY: shelfHotspotCoords.y - py
      };
    });

    var hoveredPageId = null; // desktop hover
    var mobileSelectedId = null; // mobile tap-to-select

    function unfreezePage(pn) {
      pn.frozen = false;
      pn.resumeAt = null;
      pn.lifePhase = 'falling';
      pn.phaseElapsed = 0;
    }

    function freezePage(pn) {
      pn.frozen = true;
      pn.resumeAt = null;
      pn.node.classList.add('is-hovered');
    }

    pageNodes.forEach(function (pn) {
      if (!mobile) {
        pn.node.addEventListener('mouseenter', function () {
          hoveredPageId = pn.data.id;
          freezePage(pn);
          if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
        });
        pn.node.addEventListener('mouseleave', function () {
          if (hoveredPageId === pn.data.id) hoveredPageId = null;
          pn.node.classList.remove('is-hovered');
          pn.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
          if (!openPageId && callbacks.setPanDisabled) callbacks.setPanDisabled(false);
        });
        pn.node.addEventListener('focus', function () {
          hoveredPageId = pn.data.id;
          freezePage(pn);
        });
        pn.node.addEventListener('blur', function () {
          if (hoveredPageId === pn.data.id) hoveredPageId = null;
          pn.node.classList.remove('is-hovered');
          pn.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
        });
        pn.node.addEventListener('click', function () { openReader(pn.data); });
      } else {
        // mobile: no hover — first tap selects (freeze+approach), a
        // second tap on the ALREADY-selected page opens it; tapping a
        // different page switches the selection.
        pn.node.addEventListener('click', function () {
          if (mobileSelectedId === pn.data.id) {
            openReader(pn.data);
            return;
          }
          if (mobileSelectedId) {
            var prev = pageNodesById[mobileSelectedId];
            if (prev) {
              prev.node.classList.remove('is-hovered');
              prev.resumeAt = performance.now() + HOVER_RESUME_GRACE_MS;
            }
          }
          mobileSelectedId = pn.data.id;
          freezePage(pn);
          if (callbacks.setPanDisabled) callbacks.setPanDisabled(true);
        });
      }
    });

    var pageNodesById = {};
    pageNodes.forEach(function (pn) { pageNodesById[pn.data.id] = pn; });

    // ---- release scheduling (staggered group, cooldown-gated) ----
    var lastReleaseAt = -Infinity;
    var pendingReleaseTimers = [];

    function tryReleaseGroup(now) {
      if (now - lastReleaseAt < COOLDOWN_MS) return;
      var dormant = pageNodes.filter(function (pn) { return pn.lifePhase === 'dormant' && !pn.releasePending; });
      if (!dormant.length) return;
      lastReleaseAt = now;
      // shuffle
      for (var i = dormant.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = dormant[i]; dormant[i] = dormant[j]; dormant[j] = tmp;
      }
      var groupSize = Math.min(dormant.length, GROUP_MIN + Math.floor(Math.random() * (GROUP_MAX - GROUP_MIN + 1)));
      var delay = 0;
      for (var k = 0; k < groupSize; k++) {
        (function (pn, d) {
          pn.releasePending = true;
          var timer = window.setTimeout(function () {
            pn.releasePending = false;
            if (pn.lifePhase === 'dormant') {
              pn.lifePhase = 'rising';
              pn.phaseElapsed = 0;
            }
          }, d);
          pendingReleaseTimers.push(timer);
        })(dormant[k], delay);
        delay += STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS);
      }
      // delicate shelf affordance — brief glow pulse on every successful
      // release trigger (mobile has no hover-proximity glow otherwise)
      pulseShelfGlow();
    }

    // ---- shelf glow / proximity affordance ("небольшим свечением") ----
    var shelfGlow = el('div', 'yh-gallery-shelf-glow');
    shelfGlow.style.left = shelfBox.left + '%';
    shelfGlow.style.top = shelfBox.top + '%';
    shelfGlow.style.width = shelfBox.width + '%';
    shelfGlow.style.height = shelfBox.height + '%';
    sceneStage.appendChild(shelfGlow);
    var shelfGlowPulseTimer = null;
    var shelfHovered = false; // desktop only — mirrors the mouseenter/mouseleave state below
    function pulseShelfGlow() {
      // mobile-only flash (desktop already drives the glow directly via
      // hover/focus below, and must not have this timer fight that).
      if (!mobile) return;
      shelfGlow.classList.add('is-active');
      if (shelfGlowPulseTimer) window.clearTimeout(shelfGlowPulseTimer);
      shelfGlowPulseTimer = window.setTimeout(function () {
        if (!shelfHovered) shelfGlow.classList.remove('is-active');
      }, 900);
    }

    // mobile: tap the book/shelf releases a group directly (no hover there)
    // AND turns the shelf (see shelfRotateBtn's own click listener above) —
    // both fire together on a tap, there being no separate hover channel
    // on touch to split them across.
    shelfRotateBtn.addEventListener('click', function () {
      tryReleaseGroup(performance.now());
    });

    // ---- desktop: hover the book/shelf itself releases pages, wobbles the
    // shelf a little ("туда-сюда") and shows the "ПОКРУТИ ШКАФ" tooltip,
    // and keeps releasing fresh page groups (cooldown-gated) for as long as
    // the cursor stays over it. Base state (cursor elsewhere): zero pages,
    // no glow, resting frame. ----
    var hoverReleaseTimer = null;
    if (!mobile) {
      shelfRotateBtn.addEventListener('mouseenter', function () {
        shelfHovered = true;
        shelfGlow.classList.add('is-active');
        tryReleaseGroup(performance.now());
        startWobble();
        if (hoverReleaseTimer) window.clearInterval(hoverReleaseTimer);
        hoverReleaseTimer = window.setInterval(function () {
          tryReleaseGroup(performance.now());
        }, HOVER_RELEASE_INTERVAL_MS);
      });
      shelfRotateBtn.addEventListener('mouseleave', function () {
        shelfHovered = false;
        shelfGlow.classList.remove('is-active');
        stopWobble();
        if (hoverReleaseTimer) { window.clearInterval(hoverReleaseTimer); hoverReleaseTimer = null; }
      });
      shelfRotateBtn.addEventListener('focus', function () {
        shelfHovered = true;
        shelfGlow.classList.add('is-active');
        tryReleaseGroup(performance.now());
        startWobble();
      });
      shelfRotateBtn.addEventListener('blur', function () {
        shelfHovered = false;
        shelfGlow.classList.remove('is-active');
        stopWobble();
      });
    }

    // ---- main rAF loop ----
    var rafId = null;
    var lastTickTime = null;

    function tick(now) {
      if (lastTickTime === null) lastTickTime = now;
      var dt = now - lastTickTime;
      lastTickTime = now;

      pageNodes.forEach(function (pn) {
        if (pn.data.id === openPageId) return; // reader owns this page's transform while open

        if (pn.frozen) {
          // hover/tap-selected: snap to its resting anchor, straightened,
          // enlarged, sharp — "останавливается... выпрямляется...
          // приближается... становится резче" — and stay there.
          pn.node.style.transform = 'translate(0%, 0%) rotate(0deg) scale(1.18)';
          pn.node.style.opacity = 1;
          pn.node.style.zIndex = 50;
          return;
        }
        if (pn.resumeAt !== null) {
          if (now < pn.resumeAt) {
            // grace period after the cursor left — stay exactly in place
            pn.node.style.transform = 'translate(0%, 0%) rotate(0deg) scale(1.18)';
            pn.node.style.opacity = 1;
            pn.node.style.zIndex = 50;
            return;
          }
          unfreezePage(pn);
        }

        if (pn.lifePhase === 'dormant') {
          // rest state: completely gone, not even a faint "peek" — per
          // explicit instruction ("в базовом состоянии - нет листов").
          pn.node.style.opacity = 0;
          pn.node.style.pointerEvents = 'none';
          return;
        }

        pn.node.style.pointerEvents = 'auto';
        pn.phaseElapsed += dt;

        if (pn.lifePhase === 'rising') {
          var rp = Math.min(pn.phaseElapsed / RISE_MS, 1);
          var re = easeOutCubic(rp);
          var tx = pn.originOffsetX * (1 - re);
          var ty = pn.originOffsetY * (1 - re) - Math.sin(rp * Math.PI) * pn.popPeak;
          var rScale = 0.6 + 0.4 * re;
          pn.node.style.transform = 'translate(' + tx + '%, ' + ty + '%) rotate(' + pn.data.rotation + 'deg) scale(' + rScale + ')';
          pn.node.style.opacity = baseOpacityForDepth(pn.data.depth) * re;
          pn.node.style.zIndex = 15 - pn.data.depth;
          if (rp >= 1) { pn.lifePhase = 'falling'; pn.phaseElapsed = 0; }
          return;
        }

        // falling — "постепенно падают вниз и исчезают": accelerating
        // downward drift (easeInCubic — slow at first so the page is still
        // readable right after rising, then picks up speed) plus a gentle
        // side-to-side sway and a slow tumble, opacity ramping to 0; then
        // back to dormant so a later hover can release it again.
        var fp = Math.min(pn.phaseElapsed / FALL_MS, 1);
        var fe = easeInCubic(fp);
        var f = depthFactor(pn.data.depth);
        var fallY = fe * FALL_DISTANCE * f;
        var swayX = Math.sin(now * 0.0016 + pn.jitterPhase) * 1.4 * f;
        var fallRotation = pn.data.rotation + fe * 14 * (pn.jitterPhase > Math.PI ? 1 : -1);
        pn.node.style.transform = 'translate(' + swayX + '%, ' + fallY + '%) rotate(' + fallRotation + 'deg) scale(1)';
        pn.node.style.opacity = baseOpacityForDepth(pn.data.depth) * (1 - fe);
        pn.node.style.zIndex = 15 - pn.data.depth;
        if (fp >= 1) { pn.lifePhase = 'dormant'; pn.phaseElapsed = 0; }
      });
      rafId = window.requestAnimationFrame(tick);
    }
    rafId = window.requestAnimationFrame(tick);

    var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    function onReducedMotionChange() {
      if (reduceMotionMQ.matches) {
        // no game mechanic under reduced motion — every page fully
        // visible at its anchor, statically, so nothing is ever
        // unreachable just because the user can't rely on motion/hover.
        if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
        pendingReleaseTimers.forEach(function (t) { window.clearTimeout(t); });
        pendingReleaseTimers = [];
        pageNodes.forEach(function (pn) {
          pn.node.style.transform = 'rotate(' + pn.data.rotation + 'deg)';
          pn.node.style.opacity = baseOpacityForDepth(pn.data.depth);
          pn.node.style.pointerEvents = 'auto';
          pn.node.style.zIndex = 15 - pn.data.depth;
        });
      } else if (rafId === null) {
        lastTickTime = null;
        rafId = window.requestAnimationFrame(tick);
      }
    }
    onReducedMotionChange();
    if (reduceMotionMQ.addEventListener) reduceMotionMQ.addEventListener('change', onReducedMotionChange);

    function destroy() {
      closeReader();
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      pendingReleaseTimers.forEach(function (t) { window.clearTimeout(t); });
      if (shelfGlowPulseTimer) window.clearTimeout(shelfGlowPulseTimer);
      if (hoverReleaseTimer) window.clearInterval(hoverReleaseTimer);
      if (wobbleTimer) window.clearInterval(wobbleTimer);
      if (turnTimer) window.clearInterval(turnTimer);
      if (reduceMotionMQ.removeEventListener) reduceMotionMQ.removeEventListener('change', onReducedMotionChange);
      // fabric hover+click listeners live on nodes hotspotLayer.destroy()
      // removes outright, so no separate removeEventListener needed for it.
      // shelfRotateBtn/shelfTooltip are removed outright below instead
      // (they're plain nodes, not hotspotLayer's).
      hotspotLayer.destroy();
      reader.remove();
      shelfImgA.remove();
      shelfImgB.remove();
      bookLink.remove();
      fabricImg.remove();
      shelfGlow.remove();
      shelfRotateBtn.remove();
      shelfTooltip.remove();
      pageNodes.forEach(function (pn) { pn.node.remove(); });
    }

    function closeAllCaptions() {
      hotspotLayer.hideCaption();
      hideTooltip();
      closeReader();
    }

    return {
      destroy: destroy,
      layout: function () { hotspotLayer.layout(); layoutBookLink(); layoutFabricLabel(); },
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['gallery-complex'] = createZone05Behavior;
})(window.YHApp = window.YHApp || {});
