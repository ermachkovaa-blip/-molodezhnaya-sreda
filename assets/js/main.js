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

  /* ------------------------------------------------------------------ */
  /* "Что будет происходить здесь" — ловилка слов                       */
  /* Desktop: слова разбегаются от курсора, клик — "ловит" слово.       */
  /* Mobile: тап ловит слово напрямую (без физики разбегания).          */
  /* ------------------------------------------------------------------ */
  (function wordGame() {
    var field = document.querySelector('[data-game-field]');
    if (!field) return;
    var words = Array.prototype.slice.call(field.querySelectorAll('.game__word'));
    var glow = field.querySelector('[data-game-glow]');
    var countEl = document.querySelector('[data-game-count]');
    var totalEl = document.querySelector('[data-game-total]');
    var doneEl = document.querySelector('[data-game-done]');
    var total = words.length;
    var caught = 0;
    var motionOn = hoverFineMQ.matches && !reduced();

    if (totalEl) totalEl.textContent = String(total);
    words.forEach(function (w) { w._cur = { x: 0, y: 0 }; w._target = { x: 0, y: 0 }; });

    var raf = null;
    var pointerActive = false;
    var pointerX = 0, pointerY = 0;

    function baseCenter(w) {
      var fr = field.getBoundingClientRect();
      var r = w.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - fr.left - w._cur.x,
        y: r.top + r.height / 2 - fr.top - w._cur.y
      };
    }

    function applyTransform(w) {
      w.style.transform = 'translate3d(-50%,-50%,0) translate(' + w._cur.x.toFixed(1) + 'px,' + w._cur.y.toFixed(1) + 'px)';
    }

    function loop() {
      var moving = false;
      words.forEach(function (w) {
        if (w.classList.contains('is-caught')) return;
        if (pointerActive) {
          var base = baseCenter(w);
          var dx = base.x - pointerX, dy = base.y - pointerY;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var radius = 130;
          if (dist < radius) {
            var force = (radius - dist) / radius;
            w._target.x = (dx / dist) * force * 50;
            w._target.y = (dy / dist) * force * 50;
          } else {
            w._target.x = 0; w._target.y = 0;
          }
        } else {
          w._target.x = 0; w._target.y = 0;
        }
        w._cur.x += (w._target.x - w._cur.x) * 0.15;
        w._cur.y += (w._target.y - w._cur.y) * 0.15;
        applyTransform(w);
        if (Math.abs(w._target.x - w._cur.x) > 0.3 || Math.abs(w._cur.x) > 0.3 || Math.abs(w._cur.y) > 0.3) moving = true;
      });
      if (moving || pointerActive) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function ensureLoop() { if (!raf) raf = requestAnimationFrame(loop); }

    if (motionOn) {
      field.addEventListener('pointermove', function (e) {
        var fr = field.getBoundingClientRect();
        pointerX = e.clientX - fr.left;
        pointerY = e.clientY - fr.top;
        pointerActive = true;
        if (glow) {
          glow.style.setProperty('--gx', pointerX + 'px');
          glow.style.setProperty('--gy', pointerY + 'px');
        }
        ensureLoop();
      });
      field.addEventListener('pointerleave', function () {
        pointerActive = false;
        ensureLoop();
      });
    }

    function burst(x, y, hue) {
      var palette = {
        '1': ['#3B5FE2', '#E14FC4'],
        '2': ['#E14FC4', '#F0632F'],
        '3': ['#F0632F', '#2E8E52'],
        '4': ['#2E8E52', '#3B5FE2']
      };
      var pair = palette[hue] || palette['1'];
      for (var i = 0; i < 8; i++) {
        var p = document.createElement('span');
        p.className = 'game-particle';
        var angle = (Math.PI * 2 * i) / 8;
        var dist = 40 + Math.random() * 30;
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        p.style.background = pair[i % 2];
        p.style.setProperty('--px', (Math.cos(angle) * dist).toFixed(0) + 'px');
        p.style.setProperty('--py', (Math.sin(angle) * dist).toFixed(0) + 'px');
        field.appendChild(p);
        (function (el) { setTimeout(function () { el.remove(); }, 650); })(p);
      }
    }

    words.forEach(function (w) {
      var btn = w.querySelector('button');
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (w.classList.contains('is-caught')) return;
        w.classList.add('is-caught');
        caught++;
        if (countEl) countEl.textContent = String(caught);
        if (!reduced()) {
          var fr = field.getBoundingClientRect();
          var r = btn.getBoundingClientRect();
          burst(r.left + r.width / 2 - fr.left, r.top + r.height / 2 - fr.top, w.getAttribute('data-hue'));
        }
        if (caught >= total && doneEl) {
          setTimeout(function () { doneEl.hidden = false; }, 400);
        }
      });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Magnetic buttons (desktop, fine pointer, motion allowed)            */
  /* ------------------------------------------------------------------ */
  (function magneticButtons() {
    if (!hoverFineMQ.matches || reduced()) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      var strength = 14;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var relX = (e.clientX - r.left) / r.width - 0.5;
        var relY = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translate(' + (relX * strength).toFixed(1) + 'px,' + (relY * strength).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Tilt cards (desktop, fine pointer, motion allowed)                  */
  /* ------------------------------------------------------------------ */
  (function tiltCards() {
    if (!hoverFineMQ.matches || reduced()) return;
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var relX = (e.clientX - r.left) / r.width - 0.5;
        var relY = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateX(' + (relY * -7).toFixed(2) + 'deg) rotateY(' + (relX * 7).toFixed(2) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();
})();
