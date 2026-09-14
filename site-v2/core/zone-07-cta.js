// Zone 07 (АМФИТЕАТР) behavior — registered under shared.behavior:
// 'apply-cta'. FAST MODE production pass (01+06+07) + camera
// recalibration/banner pass.
//
// Two independent pieces inside .yh-scene-stage:
//   1. the existing minimal CTA hotspot over the BASE's own baked "Подай
//      заявку" prompt, linking to APPLICATION_URL — unchanged, kept.
//   2. a large application/contact banner — a real HTML block living IN
//      the scene (not a viewport-fixed overlay), positioned via percent
//      coordinates so it transforms together with the camera exactly like
//      any other scene content. Two sections: a primary CTA (same
//      APPLICATION_URL) and a secondary contact form (see
//      config/links.js CONTACT_EMAIL/CONTACT_FORM_ENDPOINT for the
//      submission-priority contract — never a fabricated "sent"
//      confirmation).
//
// FONT NOTE: the visual spec calls for "Druk Cond Cy Super" (headings)
// and "Apercu Pro" (body/UI) — neither exists anywhere in this repo (V1
// or V2), and both are commercial fonts with no license/font files
// delivered. Introducing them would mean either fabricating a font-face
// pointing at a file that doesn't exist, or silently substituting a
// lookalike and calling it by that name — both are the kind of invented
// asset this project has consistently avoided. Used the existing system
// font stack instead (already the only stack in app.css), leaning on
// weight/size/letter-spacing/uppercase to approximate the same "large
// condensed heading vs. plain body" hierarchy the spec describes.

(function (YHApp) {
  'use strict';

  YHApp.ZONE_BEHAVIORS = YHApp.ZONE_BEHAVIORS || {};

  function el(tag, className, attrs) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function createZone07Behavior(sceneStage, zone, config, callbacks) {
    var isMobile = callbacks.isMobile;
    var mobile = isMobile();
    var links = config.links || YHApp.LINKS;
    var cta = YHApp.ZONE_07_CTA;
    var bannerBox = mobile ? YHApp.ZONE_07_BANNER_MOBILE : YHApp.ZONE_07_BANNER_DESKTOP;
    var content = YHApp.ZONE_07_BANNER_CONTENT;

    // ==== 1. existing minimal CTA hotspot over the baked prompt ====
    var hotspotLayer = YHApp.createHotspotLayer(sceneStage, {
      layerClass: 'yh-apply-hotspot',
      items: [{
        id: 'apply',
        ariaLabel: 'Подать заявку на хакатон',
        url: links.APPLICATION_URL
      }],
      isMobile: isMobile,
      getCoords: function (item, mob) {
        return mob ? cta.mobileCoords : cta.desktopCoords;
      }
    });
    hotspotLayer.layout();

    var size = mobile ? cta.mobileSize : cta.desktopSize;
    if (hotspotLayer.elements.apply) {
      hotspotLayer.elements.apply.style.width = size.w + '%';
      hotspotLayer.elements.apply.style.height = size.h + '%';
    }

    // ==== 2. application / contact banner ====
    var banner = el('div', 'yh-apply-banner');
    banner.style.left = bannerBox.left + '%';
    banner.style.top = bannerBox.top + '%';
    banner.style.width = bannerBox.width + '%';
    banner.style.height = bannerBox.height + '%';
    banner.style.transformOrigin = 'top left';

    var primary = el('div', 'yh-apply-banner__section yh-apply-banner__section--primary');
    var eyebrow1 = el('div', 'yh-apply-banner__eyebrow');
    eyebrow1.textContent = content.primaryEyebrow;
    var heading = el('h3', 'yh-apply-banner__heading');
    heading.textContent = content.primaryHeading;
    var lead = el('p', 'yh-apply-banner__lead');
    lead.textContent = content.primaryLead;
    var ctaLink = el('a', 'yh-apply-banner__cta', { href: links.APPLICATION_URL || '#' });
    ctaLink.textContent = content.primaryCta;
    if (!links.APPLICATION_URL) {
      ctaLink.setAttribute('aria-disabled', 'true');
      ctaLink.addEventListener('click', function (e) { e.preventDefault(); });
    }
    primary.appendChild(eyebrow1);
    primary.appendChild(heading);
    primary.appendChild(lead);
    primary.appendChild(ctaLink);

    var rule = el('div', 'yh-apply-banner__rule');

    var secondary = el('div', 'yh-apply-banner__section yh-apply-banner__section--secondary');
    var subheadingRow = el('div', 'yh-apply-banner__subheading-row');
    var eyebrow2 = el('span', 'yh-apply-banner__eyebrow');
    eyebrow2.textContent = content.secondaryEyebrow;
    var subheading = el('h4', 'yh-apply-banner__subheading');
    subheading.textContent = content.secondaryHeading;
    subheadingRow.appendChild(eyebrow2);
    subheadingRow.appendChild(subheading);

    var form = el('form', 'yh-apply-banner__form', { novalidate: 'novalidate' });

    function field(tag, labelText, inputAttrs) {
      var label = el('label', 'yh-apply-banner__field');
      var span = el('span', 'yh-apply-banner__field-label');
      span.textContent = labelText;
      var input = el(tag, 'yh-apply-banner__field-input', inputAttrs);
      label.appendChild(span);
      label.appendChild(input);
      return { label: label, input: input };
    }

    var nameField = field('input', content.fieldNameLabel, { type: 'text', name: 'name', required: 'required', autocomplete: 'name' });
    var emailField = field('input', content.fieldEmailLabel, { type: 'email', name: 'email', required: 'required', autocomplete: 'email' });
    var messageField = field('textarea', content.fieldMessageLabel, { name: 'message', required: 'required', rows: '2' });

    var nameEmailRow = el('div', 'yh-apply-banner__form-row');
    nameEmailRow.appendChild(nameField.label);
    nameEmailRow.appendChild(emailField.label);

    var submitBtn = el('button', 'yh-apply-banner__submit', { type: 'submit' });
    submitBtn.textContent = content.submitLabel;

    // message + submit share a row (textarea grows, button sits beside
    // it) — saves a full row's height vs. stacking the button below.
    var messageRow = el('div', 'yh-apply-banner__form-row yh-apply-banner__form-row--message');
    messageRow.appendChild(messageField.label);
    messageRow.appendChild(submitBtn);

    var status = el('div', 'yh-apply-banner__status', { role: 'status', 'aria-live': 'polite' });

    form.appendChild(nameEmailRow);
    form.appendChild(messageRow);
    form.appendChild(status);

    secondary.appendChild(subheadingRow);
    secondary.appendChild(form);

    banner.appendChild(primary);
    banner.appendChild(rule);
    banner.appendChild(secondary);
    sceneStage.appendChild(banner);

    // customer (2026-09-14): the banner (heading/lead/form) was shrinking
    // along with the BASE image's own camera zoom, becoming genuinely
    // hard to read/use on real desktop windows — same class of bug as
    // Zone 00/01's labels (see core/hotspot-layer.js), but here the whole
    // panel (not just a text label) needs to stay a constant real size,
    // not just its font. Rather than re-guess a "correct" absolute size
    // from scratch — this box's own percent footprint already went
    // through six rounds of customer size revisions (see config/
    // zone-07-content.js) — counter-scale RELATIVE TO the liveScale this
    // was actually tuned/approved against (the 1512x982 desktop / 390x844
    // mobile viewports used throughout this project's testing), so at
    // that reference width nothing changes (scale factor 1), and at any
    // OTHER real window/phone width the banner simply stops shrinking
    // further instead of drifting to some newly-invented size.
    var REFERENCE_LIVE_SCALE = mobile ? 0.212236 : 0.587672;
    function layoutBanner() {
      var stageRect = sceneStage.getBoundingClientRect();
      if (!stageRect.width || !sceneStage.offsetWidth) return;
      var liveScale = stageRect.width / sceneStage.offsetWidth;
      var k = liveScale ? REFERENCE_LIVE_SCALE / liveScale : 1;
      banner.style.transform = 'scale(' + k + ')';
    }
    layoutBanner();
    // the synchronous call above almost always bails (sceneStage's size
    // depends on the scene <img>, which has usually not finished loading
    // over the network yet at this exact point in mount()) — same race
    // already found/fixed for Zone 05's shelf/fabric labels (see
    // layoutBookLink there): retry on the next frame AND once the scene
    // image actually finishes loading, not just one or the other.
    window.requestAnimationFrame(layoutBanner);
    var sceneImgEl = sceneStage.querySelector('img');
    if (sceneImgEl) sceneImgEl.addEventListener('load', layoutBanner);

    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'yh-apply-banner__status yh-apply-banner__status--' + kind;
    }

    function isValidEmail(value) {
      // basic, deliberately not exhaustive — matches type="email"'s own
      // intent, this is a second check since novalidate skips the
      // browser's built-in bubble UI (we render errors inline instead).
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameField.input.value.trim();
      var emailVal = emailField.input.value.trim();
      var message = messageField.input.value.trim();

      if (!name || !emailVal || !message || !isValidEmail(emailVal)) {
        setStatus(content.validationMessage, 'error');
        form.reportValidity();
        return;
      }

      if (links.CONTACT_FORM_ENDPOINT) {
        submitBtn.disabled = true;
        setStatus('', 'pending');
        window.fetch(links.CONTACT_FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, email: emailVal, message: message })
        }).then(function (res) {
          if (!res.ok) throw new Error('bad status');
          setStatus(content.successMessage, 'success');
          form.reset();
        }).catch(function () {
          setStatus(content.sendErrorMessage, 'error');
        }).finally(function () {
          submitBtn.disabled = false;
        });
      } else if (links.CONTACT_EMAIL) {
        // mailto is a real action (opens the visitor's own mail client)
        // but this code has no way to confirm the visitor actually hits
        // send there — so it deliberately does NOT show the "СПАСИБО"
        // success text, only that the mail client is opening.
        var subject = encodeURIComponent('Вопрос с сайта хакатона от ' + name);
        var body = encodeURIComponent(message + '\n\n' + emailVal);
        window.location.href = 'mailto:' + links.CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
        setStatus(content.mailtoFallbackMessage, 'info');
      } else {
        setStatus(content.contactMissingMessage, 'info');
      }
    });

    // ---- scene-gesture suppression while interacting with the banner
    // (spec: "camera must NOT pan/drag/trigger camera gesture" while
    // using input/textarea/button/link controls — the gesture controller
    // listens on sceneViewport, an ANCESTOR of this banner; stopping
    // propagation here at pointerdown means it never reaches that
    // listener, so no drag-start is ever armed for gestures that begin
    // inside the banner. Native click/focus/typing on the real form
    // elements is completely unaffected — only bubbling up and out is
    // blocked. ----
    function stopBubble(e) { e.stopPropagation(); }
    banner.addEventListener('pointerdown', stopBubble);

    // additionally pause the ambient hover-parallax while a control is
    // focused, so nothing drifts under the user's cursor mid-typing.
    function onFocusIn() { if (callbacks.setPanDisabled) callbacks.setPanDisabled(true); }
    function onFocusOut() { if (callbacks.setPanDisabled) callbacks.setPanDisabled(false); }
    banner.addEventListener('focusin', onFocusIn);
    banner.addEventListener('focusout', onFocusOut);

    function destroy() {
      if (callbacks.setPanDisabled) callbacks.setPanDisabled(false);
      banner.removeEventListener('pointerdown', stopBubble);
      banner.removeEventListener('focusin', onFocusIn);
      banner.removeEventListener('focusout', onFocusOut);
      if (sceneImgEl) sceneImgEl.removeEventListener('load', layoutBanner);
      hotspotLayer.destroy();
      banner.remove();
    }

    function closeAllCaptions() {
      hotspotLayer.hideCaption();
    }

    return {
      destroy: destroy,
      layout: function () { hotspotLayer.layout(); layoutBanner(); },
      closeAllCaptions: closeAllCaptions
    };
  }

  YHApp.ZONE_BEHAVIORS['apply-cta'] = createZone07Behavior;
})(window.YHApp = window.YHApp || {});
