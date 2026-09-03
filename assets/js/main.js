(function () {
  'use strict';

  var reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hoverFineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = function () { return reduceMotionMQ.matches; };

  /* ------------------------------------------------------------------ */
  /* Mobile nav                                                          */
  /* ------------------------------------------------------------------ */
  var burger = document.getElementById('burgerBtn');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                    */
  /* ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Marquee: hover slow-down                                            */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('.marquee').forEach(function (m) {
    m.addEventListener('mouseenter', function () { m.classList.add('is-slow'); });
    m.addEventListener('mouseleave', function () { m.classList.remove('is-slow'); });
  });

  /* ------------------------------------------------------------------ */
  /* Hero mouse-follow parallax (desktop, fine pointer, motion allowed)  */
  /* ------------------------------------------------------------------ */
  (function heroParallax() {
    var hero = document.querySelector('.hero');
    var photo = document.querySelector('.hero__plate-photo');
    var blueprint = document.querySelector('.hero__plate-blueprint');
    if (!hero || !photo || !blueprint) return;

    var enabled = hoverFineMQ.matches && !reduced();
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var raf = null;

    function loop() {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      photo.style.transform = 'translate3d(' + (current.x * 10).toFixed(2) + 'px,' + (current.y * 10).toFixed(2) + 'px,0)';
      blueprint.style.transform = 'translate3d(' + (current.x * -16).toFixed(2) + 'px,' + (current.y * -16).toFixed(2) + 'px,0)';
      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function onMove(e) {
      var rect = hero.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - 0.5;
      var relY = (e.clientY - rect.top) / rect.height - 0.5;
      target.x = relX * 2;
      target.y = relY * 2;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function onLeave() {
      target.x = 0; target.y = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    if (enabled) {
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
    }
  })();

  /* ------------------------------------------------------------------ */
  /* Generic scroll-progress pinned scene engine                         */
  /* Used by: "Что ты получишь" (4 stages) and "От объекта до концепции" */
  /* (5 stages). Active only above a given viewport width and when      */
  /* motion is allowed; otherwise the CSS shows every stage stacked.    */
  /* ------------------------------------------------------------------ */
  function initPinnedScene(opts) {
    var wrap = document.querySelector(opts.wrapSelector);
    if (!wrap) return;
    var stages = Array.prototype.slice.call(wrap.querySelectorAll(opts.stageSelector));
    var ticks = opts.tickSelector ? Array.prototype.slice.call(wrap.querySelectorAll(opts.tickSelector)) : [];
    var progressFill = opts.progressSelector ? wrap.querySelector(opts.progressSelector) : null;
    var mq = window.matchMedia('(min-width: ' + opts.minWidth + 'px)');
    var ticking = false;
    var active = -1;

    function setActive(idx) {
      if (idx === active) return;
      active = idx;
      stages.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      ticks.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
    }

    function update() {
      ticking = false;
      if (!mq.matches || reduced()) return;
      var rect = wrap.getBoundingClientRect();
      var total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) { setActive(0); return; }
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var progress = scrolled / total;
      var idx = Math.min(stages.length - 1, Math.floor(progress * stages.length));
      setActive(idx);
      if (progressFill) progressFill.style.width = (progress * 100).toFixed(1) + '%';
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mq.addEventListener ? mq.addEventListener('change', onScroll) : mq.addListener(onScroll);

    // initial state
    setActive(0);
    update();
  }

  initPinnedScene({
    wrapSelector: '[data-scene="benefits"]',
    stageSelector: '.benefits__stage',
    tickSelector: '.benefits__tick',
    minWidth: 900
  });

  initPinnedScene({
    wrapSelector: '[data-scene="story"]',
    stageSelector: '.story__stage',
    tickSelector: '.story__step',
    progressSelector: '.story__progress-fill',
    minWidth: 980
  });

  /* ------------------------------------------------------------------ */
  /* Five objects — interactive list / map / detail sync                */
  /* ------------------------------------------------------------------ */
  (function objectsApp() {
    var app = document.querySelector('[data-objects-app]');
    if (!app) return;
    var items = Array.prototype.slice.call(app.querySelectorAll('[data-object-index]'));
    var points = Array.prototype.slice.call(app.querySelectorAll('[data-map-point]'));
    var panels = Array.prototype.slice.call(app.querySelectorAll('[data-detail-index]'));

    function setActive(idx) {
      items.forEach(function (el) {
        var i = Number(el.getAttribute('data-object-index'));
        el.classList.toggle('is-active', i === idx);
        el.setAttribute('aria-selected', String(i === idx));
      });
      points.forEach(function (el) {
        var i = Number(el.getAttribute('data-map-point'));
        el.classList.toggle('is-active', i === idx);
      });
      panels.forEach(function (el) {
        var i = Number(el.getAttribute('data-detail-index'));
        el.classList.toggle('is-active', i === idx);
      });
    }

    items.forEach(function (el) {
      var idx = Number(el.getAttribute('data-object-index'));
      el.addEventListener('click', function () { setActive(idx); });
      if (hoverFineMQ.matches) {
        el.addEventListener('mouseenter', function () { setActive(idx); });
      }
    });
    points.forEach(function (el) {
      var idx = Number(el.getAttribute('data-map-point'));
      el.addEventListener('click', function () { setActive(idx); });
    });

    setActive(0);
  })();

  /* ------------------------------------------------------------------ */
  /* Object detail modal (shared with any "Подробнее" trigger)          */
  /* ------------------------------------------------------------------ */
  var modal = document.getElementById('objectModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalLoc = document.getElementById('modalLoc');
  var lastFocused = null;

  function openModal(title, loc) {
    if (!modal) return;
    modalTitle.textContent = title;
    modalLoc.textContent = loc || '';
    modal.hidden = false;
    lastFocused = document.activeElement;
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('.link-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-object'), btn.getAttribute('data-loc'));
    });
  });

  if (modal) {
    modal.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }
})();
