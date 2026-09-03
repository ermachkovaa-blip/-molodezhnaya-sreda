(function () {
  'use strict';

  var STORAGE_KEY = 'mly_apply_form';
  var TOTAL_STEPS = 7;
  var MAX_GOALS = 3;

  var form = document.getElementById('apply-form');
  var stepsEl = document.getElementById('apply-steps');
  var backBtn = document.getElementById('apply-back');
  var nextBtn = document.getElementById('apply-next');
  var toastEl = document.getElementById('toast');
  var siteNav = document.getElementById('site-nav');
  var mobileMenu = document.getElementById('mobile-menu');
  var burgerBtn = document.getElementById('burger-btn');

  var current = 1;

  // ---------------- header (shared minimal copy for this standalone page) ----------------

  HEADER_NAV.forEach(function (item) {
    var a = document.createElement('a');
    a.href = 'index.html' + item.href;
    a.textContent = item.label;
    siteNav.appendChild(a.cloneNode(true));
    mobileMenu.appendChild(a);
  });

  burgerBtn.addEventListener('click', function () {
    var expanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    burgerBtn.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2400);
  }

  // ---------------- step indicator ----------------

  for (var i = 1; i <= TOTAL_STEPS; i++) {
    (function (n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'apply-steps__item';
      b.textContent = String(n).padStart(2, '0');
      b.addEventListener('click', function () {
        if (n <= current) goToStep(n, true);
      });
      stepsEl.appendChild(b);
    })(i);
  }

  function refreshStepIndicator() {
    var items = stepsEl.querySelectorAll('.apply-steps__item');
    items.forEach(function (b, idx) {
      var n = idx + 1;
      b.classList.toggle('is-active', n === current);
      b.classList.toggle('is-done', n < current);
    });
  }

  // ---------------- persistence ----------------

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function collectFormData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        data[el.name] = data[el.name] || [];
        if (el.checked) data[el.name].push(el.value);
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function applyStateToForm(data) {
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !(el.name in data)) return;
      if (el.type === 'checkbox') {
        el.checked = Array.isArray(data[el.name]) && data[el.name].indexOf(el.value) !== -1;
      } else if (el.type === 'radio') {
        el.checked = data[el.name] === el.value;
      } else {
        el.value = data[el.name];
      }
    });
  }

  function persist() { saveState(collectFormData()); enforceGoalsLimit(); }

  form.addEventListener('input', persist);
  form.addEventListener('change', persist);

  // goals: max 3 selectable
  function enforceGoalsLimit() {
    var boxes = document.querySelectorAll('#goals-group input[type="checkbox"]');
    var checkedCount = Array.prototype.filter.call(boxes, function (b) { return b.checked; }).length;
    boxes.forEach(function (b) {
      var label = b.closest('label');
      if (!b.checked && checkedCount >= MAX_GOALS) {
        b.disabled = true;
        label.classList.add('is-disabled');
      } else {
        b.disabled = false;
        label.classList.remove('is-disabled');
      }
    });
  }

  // ---------------- validation ----------------

  function setError(fieldName, hasError) {
    var field = form.querySelector('.apply-field[data-field="' + fieldName + '"]');
    if (field) field.classList.toggle('has-error', hasError);
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var URL_RE = /^https?:\/\/[^\s]+\.[^\s]+/i;

  function validateStep(n) {
    var ok = true;
    if (n === 1) {
      var name = form.elements['name'].value.trim();
      var email = form.elements['email'].value.trim();
      var age = form.elements['age'].value.trim();
      setError('name', !name); if (!name) ok = false;
      setError('email', !EMAIL_RE.test(email)); if (!EMAIL_RE.test(email)) ok = false;
      setError('age', !age); if (!age) ok = false;
    } else if (n === 2) {
      var role = form.elements['role'].value;
      setError('role', !role); if (!role) ok = false;
    } else if (n === 4) {
      var teamStatus = form.querySelector('input[name="teamStatus"]:checked');
      setError('teamStatus', !teamStatus); if (!teamStatus) ok = false;
    } else if (n === 5) {
      var goals = document.querySelectorAll('#goals-group input:checked');
      var motivation = form.elements['motivation'].value.trim();
      setError('goals', goals.length === 0); if (goals.length === 0) ok = false;
      setError('motivation', !motivation); if (!motivation) ok = false;
    } else if (n === 6) {
      var portfolio = form.elements['portfolio'].value.trim();
      setError('portfolio', !URL_RE.test(portfolio)); if (!URL_RE.test(portfolio)) ok = false;
    } else if (n === 7) {
      var city = form.elements['city'].value.trim();
      var agree = form.querySelector('input[name="agree"]:checked');
      setError('city', !city); if (!city) ok = false;
      setError('agree', !agree); if (!agree) ok = false;
    }
    return ok;
  }

  // ---------------- navigation ----------------

  function showStep(n) {
    form.querySelectorAll('.apply-step').forEach(function (s) {
      s.hidden = parseInt(s.dataset.step, 10) !== n;
    });
    backBtn.hidden = n === 1;
    if (n === TOTAL_STEPS + 1) {
      nextBtn.hidden = true;
      backBtn.textContent = 'Изменить ответы';
      renderSummary();
    } else {
      nextBtn.hidden = false;
      nextBtn.textContent = n === TOTAL_STEPS ? 'Отправить' : 'Далее';
      backBtn.textContent = 'Назад';
    }
    refreshStepIndicator();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function goToStep(n, skipValidation) {
    if (!skipValidation && n > current && !validateStep(current)) {
      showToast('Проверь поля, отмеченные красным');
      return;
    }
    current = Math.max(1, Math.min(TOTAL_STEPS + 1, n));
    showStep(current);
  }

  nextBtn.addEventListener('click', function () {
    if (!validateStep(current)) {
      showToast('Проверь поля, отмеченные красным');
      return;
    }
    if (current === TOTAL_STEPS) {
      var data = collectFormData();
      data.submittedAt = new Date().toISOString();
      saveState(data);
      current = TOTAL_STEPS + 1;
      showStep(current);
    } else {
      goToStep(current + 1);
    }
  });

  backBtn.addEventListener('click', function () {
    if (current === TOTAL_STEPS + 1) { current = TOTAL_STEPS; showStep(current); return; }
    goToStep(current - 1, true);
  });

  var SUMMARY_FIELDS = [
    ['name', 'Имя'], ['email', 'Email'], ['phone', 'Телефон'], ['age', 'Возраст'],
    ['role', 'Роль'], ['place', 'Место учёбы/работы'],
    ['tools', 'Инструменты'],
    ['teamStatus', 'Команда'], ['teamNames', 'Участники команды'],
    ['goals', 'Цели'], ['motivation', 'Мотивация'],
    ['portfolio', 'Портфолио'],
    ['city', 'Город']
  ];

  var TEAM_STATUS_LABELS = { have: 'У меня есть команда', need: 'Ищу команду / участников', solo: 'Иду соло' };

  function renderSummary() {
    var data = collectFormData();
    var el = document.getElementById('apply-summary');
    el.innerHTML = '';
    SUMMARY_FIELDS.forEach(function (pair) {
      var key = pair[0], label = pair[1];
      var val = data[key];
      if (key === 'teamStatus') val = TEAM_STATUS_LABELS[val] || val;
      if (Array.isArray(val)) val = val.join(', ');
      if (!val) return;
      var dt = document.createElement('dt'); dt.textContent = label;
      var dd = document.createElement('dd'); dd.textContent = val;
      el.appendChild(dt); el.appendChild(dd);
    });
  }

  // ---------------- init ----------------

  applyStateToForm(loadState());
  enforceGoalsLimit();
  showStep(current);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      mobileMenu.hidden = true;
      burgerBtn.setAttribute('aria-expanded', 'false');
    }
  });
})();
