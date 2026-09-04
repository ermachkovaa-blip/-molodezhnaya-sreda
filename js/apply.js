(function () {
  'use strict';

  var STORAGE_KEY = 'mly_apply_form';
  var TOTAL_STEPS = 7;
  var ARRAY_FIELDS = ['competencies', 'software', 'aiTools', 'goals'];
  var BOOLEAN_FIELDS = ['attendanceConfirmed', 'personalDataConsent'];
  var SCALE_FIELDS = ['selfTerritory', 'selfUsers', 'selfProgram', 'selfScenarios', 'selfZoning', 'selfIdentity', 'selfTeamwork'];

  var form = document.getElementById('apply-form');
  var stepsEl = document.getElementById('sheet-progress');
  var backBtn = document.getElementById('apply-back');
  var nextBtn = document.getElementById('apply-next');
  var navEl = document.getElementById('sheet-nav');
  var errorNote = document.getElementById('sheet-error-note');
  var toastEl = document.getElementById('toast');
  var siteNav = document.getElementById('site-nav');
  var mobileMenu = document.getElementById('mobile-menu');
  var burgerBtn = document.getElementById('burger-btn');

  var current = 1;
  var submitting = false;

  var STEP_LABELS = ['О тебе', 'Профиль', 'Инструменты', 'Команда', 'Мотивация', 'Портфолио', 'Где ты сейчас'];

  // ---------------- branding (shared with index.html via js/config.js) ----------------

  var pageTitleEl = document.getElementById('page-title');
  if (pageTitleEl) pageTitleEl.textContent = SITE.pageTitleApply;

  var logoImg = document.getElementById('logo-image');
  var logoCaption = document.getElementById('logo-caption');
  if (logoImg) { logoImg.src = SITE.logo; logoImg.alt = SITE.shortName; }
  if (logoCaption) logoCaption.innerHTML = SITE.subtitle.toUpperCase().split(' ').join('<br>');

  var backLink = document.querySelector('.sheet-back');
  if (backLink) backLink.textContent = UI_STRINGS.applyBackLink;

  HEADER_NAV.forEach(function (item) {
    var a = document.createElement('a');
    a.href = 'index.html?zone=' + item.zone;
    a.textContent = item.label;
    siteNav.appendChild(a.cloneNode(true));
    mobileMenu.appendChild(a);
  });

  burgerBtn.addEventListener('click', function () {
    var expanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    burgerBtn.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.hidden = expanded;
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      mobileMenu.hidden = true;
      burgerBtn.setAttribute('aria-expanded', 'false');
    }
  });

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2600);
  }

  // ---------------- progress rail (same visual principle as bottom-nav) ----------------

  STEP_LABELS.forEach(function (label, i) {
    var n = i + 1;
    if (i > 0) {
      var connector = document.createElement('div');
      connector.className = 'sheet-progress__connector';
      stepsEl.appendChild(connector);
    }
    var item = document.createElement('div');
    item.className = 'sheet-progress__item';
    item.dataset.step = n;
    item.innerHTML = '<span class="sheet-progress__num">' + String(n).padStart(2, '0') + '</span>' +
      '<span class="sheet-progress__label">' + label + '</span>';
    stepsEl.appendChild(item);
  });

  function refreshProgress() {
    stepsEl.querySelectorAll('.sheet-progress__item').forEach(function (item) {
      var n = parseInt(item.dataset.step, 10);
      item.classList.toggle('is-current', n === current);
      item.classList.toggle('is-done', n < current);
    });
  }

  // ---------------- custom controls: tags / marks / 1-5 scale ----------------

  // group checkboxes/radios under one field name from the container's data-name
  document.querySelectorAll('.sheet-tags[data-name], .sheet-marks[data-name]').forEach(function (container) {
    var name = container.dataset.name;
    container.querySelectorAll('input').forEach(function (input) { input.name = name; });
  });

  // build the 1-5 graphical scales
  document.querySelectorAll('.sheet-scale[data-name]').forEach(function (container) {
    var name = container.dataset.name;
    for (var n = 1; n <= 5; n++) {
      var label = document.createElement('label');
      label.className = 'sheet-scale__item';
      label.innerHTML = '<input type="radio" name="' + name + '" value="' + n + '"><span>' + n + '</span>';
      container.appendChild(label);
    }
  });

  function syncControlState(name) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (input) {
      var label = input.closest('label');
      if (label) label.classList.toggle('is-selected', input.checked);
    });
  }

  function enforceTagLimit(container) {
    var max = parseInt(container.dataset.max, 10);
    if (!max) return;
    var boxes = container.querySelectorAll('input[type="checkbox"]');
    var checkedCount = Array.prototype.filter.call(boxes, function (b) { return b.checked; }).length;
    boxes.forEach(function (b) {
      var label = b.closest('label');
      var disable = !b.checked && checkedCount >= max;
      b.disabled = disable;
      if (label) label.classList.toggle('is-disabled', disable);
    });
  }

  form.addEventListener('change', function (e) {
    var el = e.target;
    if (!el.name) return;
    if (el.type === 'checkbox' || el.type === 'radio') {
      if (el.type === 'radio') syncControlState(el.name);
      else { var lbl = el.closest('label'); if (lbl) lbl.classList.toggle('is-selected', el.checked); }
      var tagContainer = el.closest('.sheet-tags[data-max]');
      if (tagContainer) enforceTagLimit(tagContainer);
    }
    persist();
  });
  form.addEventListener('input', persist);

  // ---------------- persistence ----------------

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function collectFormData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (BOOLEAN_FIELDS.indexOf(el.name) !== -1) {
          data[el.name] = el.checked;
        } else {
          data[el.name] = data[el.name] || [];
          if (el.checked) data[el.name].push(el.value);
        }
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
        if (BOOLEAN_FIELDS.indexOf(el.name) !== -1) el.checked = !!data[el.name];
        else el.checked = Array.isArray(data[el.name]) && data[el.name].indexOf(el.value) !== -1;
      } else if (el.type === 'radio') {
        el.checked = data[el.name] === el.value;
      } else {
        el.value = data[el.name];
      }
    });
    ARRAY_FIELDS.concat(['teamStatus'], SCALE_FIELDS).forEach(syncControlState);
    document.querySelectorAll('.sheet-tags[data-max]').forEach(enforceTagLimit);
  }

  function persist() { saveState(collectFormData()); }

  // ---------------- validation ----------------

  function setError(fieldName, hasError) {
    var field = form.querySelector('[data-field="' + fieldName + '"]');
    if (field) field.classList.toggle('has-error', hasError);
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var URL_RE = /^https?:\/\/[^\s]+\.[^\s]+/i;

  function val(name) { return (form.elements[name] && form.elements[name].value || '').trim(); }
  function checkedVal(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }

  function validateStep(n) {
    var ok = true;
    function req(name, condition) { setError(name, !condition); if (!condition) ok = false; }

    if (n === 1) {
      req('fullName', !!val('fullName'));
      req('age', !!val('age'));
      req('cityRegion', !!val('cityRegion'));
      req('email', EMAIL_RE.test(val('email')));
    } else if (n === 2) {
      req('status', !!val('status'));
      req('teamRole', !!val('teamRole'));
    } else if (n === 4) {
      req('teamStatus', !!checkedVal('teamStatus'));
    } else if (n === 5) {
      var goals = form.querySelectorAll('input[name="goals"]:checked');
      req('goals', goals.length > 0);
      req('motivation', !!val('motivation'));
    } else if (n === 6) {
      req('portfolioUrl', URL_RE.test(val('portfolioUrl')));
    } else if (n === 7) {
      SCALE_FIELDS.forEach(function (f) { req(f, !!checkedVal(f)); });
      req('attendanceConfirmed', form.elements['attendanceConfirmed'].checked);
      req('personalDataConsent', form.elements['personalDataConsent'].checked);
    }
    return ok;
  }

  // ---------------- navigation ----------------

  function showStep(n) {
    form.querySelectorAll('.sheet-layout').forEach(function (s) {
      s.hidden = parseInt(s.dataset.step, 10) !== n;
    });
    var isSuccess = n === TOTAL_STEPS + 1;
    navEl.hidden = isSuccess;
    stepsEl.hidden = isSuccess;
    backBtn.hidden = n === 1 || isSuccess;
    nextBtn.textContent = n === TOTAL_STEPS ? 'Отправить заявку →' : 'Далее →';
    errorNote.hidden = true;
    refreshProgress();
    window.scrollTo(0, 0);
  }

  function goToStep(n, skipValidation) {
    if (!skipValidation && n > current && !validateStep(current)) {
      showToast('Проверь поля, отмеченные красным');
      return;
    }
    current = Math.max(1, Math.min(TOTAL_STEPS, n));
    showStep(current);
  }

  nextBtn.addEventListener('click', function () {
    if (submitting) return;
    if (!validateStep(current)) { showToast('Проверь поля, отмеченные красным'); return; }
    if (current === TOTAL_STEPS) { submitApplication(); }
    else { goToStep(current + 1); }
  });

  backBtn.addEventListener('click', function () { goToStep(current - 1, true); });

  stepsEl.addEventListener('click', function (e) {
    var item = e.target.closest('.sheet-progress__item');
    if (!item) return;
    var n = parseInt(item.dataset.step, 10);
    if (n <= current) goToStep(n, true);
  });

  // ---------------- submit ----------------

  function genApplicationId() {
    var rand = Math.random().toString(36).slice(2, 10).toUpperCase();
    return 'MS-2026-' + rand;
  }

  function collectUtm() {
    var params = new URLSearchParams(location.search);
    var utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      if (params.get(k)) utm[k] = params.get(k);
    });
    return utm;
  }

  function buildPayload() {
    var data = collectFormData();
    data.applicationId = genApplicationId();
    data.timestamp = new Date().toISOString();
    data.utm = collectUtm();
    data.source = document.referrer || 'direct';
    return data;
  }

  function submitApplication() {
    submitting = true;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Отправляем...';
    errorNote.hidden = true;

    var payload = buildPayload();
    saveState(payload);

    if (!CONFIG.googleSheetsEndpoint) {
      // Прототип: интеграция с Google Sheets ещё не подключена (по плану —
      // отдельный этап после утверждения визуального дизайна анкеты).
      // Данные сохранены только локально в этом браузере.
      finishSuccess(payload);
      return;
    }

    fetch(CONFIG.googleSheetsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json && json.ok) {
          if (json.applicationId) payload.applicationId = json.applicationId;
          finishSuccess(payload);
        } else {
          throw new Error((json && json.error) || 'unknown error');
        }
      })
      .catch(function () {
        submitting = false;
        nextBtn.disabled = false;
        nextBtn.textContent = 'Повторить отправку →';
        errorNote.hidden = false;
        errorNote.textContent = 'НЕ УДАЛОСЬ ОТПРАВИТЬ ЗАЯВКУ. ПРОВЕРЬТЕ СОЕДИНЕНИЕ И ПОПРОБУЙТЕ ЕЩЁ РАЗ.';
      });
  }

  function finishSuccess(payload) {
    submitting = false;
    document.getElementById('success-id').textContent = 'Заявка № ' + payload.applicationId;
    document.getElementById('success-results-date').textContent = CONFIG.dates.results;
    current = TOTAL_STEPS + 1;
    showStep(current);
  }

  // ---------------- init ----------------

  applyStateToForm(loadState());
  showStep(current);
})();
