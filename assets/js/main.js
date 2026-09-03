(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
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

  /* ---------- "Другое" text inputs ---------- */
  document.querySelectorAll('[data-other-toggle]').forEach(function (checkbox) {
    var target = document.getElementById(checkbox.getAttribute('data-other-toggle'));
    if (!target) return;
    checkbox.addEventListener('change', function () {
      target.disabled = !checkbox.checked;
      if (!checkbox.checked) target.value = '';
    });
  });

  /* ---------- Motivation: max 3 ---------- */
  var motivationGroup = document.getElementById('motivationGroup');
  var motivationCount = document.getElementById('motivationCount');
  if (motivationGroup && motivationCount) {
    var motivationBoxes = motivationGroup.querySelectorAll('input[type="checkbox"]');
    var updateMotivation = function () {
      var checked = motivationGroup.querySelectorAll('input[type="checkbox"]:checked').length;
      motivationCount.textContent = checked + ' / 3';
      motivationBoxes.forEach(function (box) {
        box.disabled = !box.checked && checked >= 3;
      });
    };
    motivationBoxes.forEach(function (box) {
      box.addEventListener('change', updateMotivation);
    });
  }

  /* ---------- Object "Подробнее" modal ---------- */
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

  /* ---------- Application form ---------- */
  var form = document.getElementById('applyForm');
  var formError = document.getElementById('formError');
  var thankYou = document.getElementById('thankYou');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = form.checkValidity();

      // require at least one checked box in required checkbox groups
      var requiredGroups = ['status', 'competencies', 'motivation'];
      requiredGroups.forEach(function (name) {
        var boxes = form.querySelectorAll('input[name="' + name + '"]');
        if (boxes.length) {
          var anyChecked = Array.prototype.some.call(boxes, function (b) { return b.checked; });
          if (!anyChecked) valid = false;
        }
      });

      if (!valid) {
        form.reportValidity();
        formError.hidden = false;
        return;
      }

      formError.hidden = true;
      form.hidden = true;
      thankYou.hidden = false;
      thankYou.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
