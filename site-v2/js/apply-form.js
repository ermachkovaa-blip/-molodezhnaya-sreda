// Молодёжная среда — заявка на хакатон (site-v2/apply.html).
// Same generic multi-step mechanic as V1's js/apply.js (read-only
// reference, V1 itself untouched): one generic collectFormData() walks
// every named form element, no per-field hardcoding to add a field.
// Re-implemented here as its own V2-owned file with the NEW question set
// from the customer's document, grouped into her own 6 blocks (V1 had 7).

(function () {
  'use strict';

  var STORAGE_KEY = 'mly_apply_form_v2';
  var TOTAL_STEPS = 6;
  var ARRAY_FIELDS = ['statusMulti', 'competencies', 'software', 'aiToolsUsed', 'aiLearningLevel', 'goals'];
  var BOOLEAN_FIELDS = ['attendanceConfirmed', 'personalDataConsent'];
  var SCALE_FIELDS = ['selfTerritory', 'selfUsers', 'selfProgram', 'selfScenarios', 'selfZoning', 'selfIdentity', 'selfTeamwork'];
  var STEP_LABELS = ['Основная информация', 'Образование и профиль', 'Мотивация', 'Портфолио', 'Оценка эффективности', 'Дополнительно'];

  var form = document.getElementById('apply-form');
  var stepsEl = document.getElementById('sheet-progress');
  var backBtn = document.getElementById('apply-back');
  var nextBtn = document.getElementById('apply-next');
  var navEl = document.getElementById('sheet-nav');
  var errorNote = document.getElementById('sheet-error-note');
  var toastEl = document.getElementById('toast');
  var portfolioFileInput = document.getElementById('f-portfolioFile');
  var PORTFOLIO_FILE_MAX_BYTES = 15 * 1024 * 1024;

  var current = 1;
  var submitting = false;

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    setTimeout(function () {
      toastEl.classList.remove('is-visible');
      setTimeout(function () { toastEl.hidden = true; }, 220);
    }, 2600);
  }

  // ---------------- progress rail ----------------

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

  document.querySelectorAll('.sheet-tags[data-name], .sheet-marks[data-name]').forEach(function (container) {
    var name = container.dataset.name;
    container.querySelectorAll('input').forEach(function (input) { input.name = name; });
  });

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

  // "Специалист другой сферы" reveals a free-text field — not in V1, new
  // per this document's own "(какой укажите)" instruction.
  var statusOtherCheck = document.getElementById('statusOther-check');
  var statusOtherReveal = document.getElementById('statusOther-reveal');
  function syncStatusOtherReveal() {
    if (!statusOtherCheck || !statusOtherReveal) return;
    statusOtherReveal.classList.toggle('is-open', statusOtherCheck.checked);
  }
  if (statusOtherCheck) statusOtherCheck.addEventListener('change', syncStatusOtherReveal);

  // customer (2026-09-22): "на вопрос какими программами владеете можно
  // было в ответ другое дописать текстом" — same reveal pattern as
  // statusOther above, just for the software question's "Другие".
  var softwareOtherCheck = document.getElementById('softwareOther-check');
  var softwareOtherReveal = document.getElementById('softwareOther-reveal');
  function syncSoftwareOtherReveal() {
    if (!softwareOtherCheck || !softwareOtherReveal) return;
    softwareOtherReveal.classList.toggle('is-open', softwareOtherCheck.checked);
  }
  if (softwareOtherCheck) softwareOtherCheck.addEventListener('change', syncSoftwareOtherReveal);

  // customer (2026-09-22): file upload alternative to the portfolio link
  // — reject an oversized file right away instead of only finding out
  // after "Отправить заявку" fails against the endpoint's own limit.
  var portfolioFileHint = document.getElementById('portfolioFile-hint');
  var PORTFOLIO_FILE_HINT_DEFAULT = portfolioFileHint ? portfolioFileHint.textContent : '';
  if (portfolioFileInput) {
    portfolioFileInput.addEventListener('change', function () {
      var file = portfolioFileInput.files[0];
      if (file && file.size > PORTFOLIO_FILE_MAX_BYTES) {
        portfolioFileInput.value = '';
        if (portfolioFileHint) {
          portfolioFileHint.textContent = 'Файл больше 15 МБ — выбери файл поменьше или укажи ссылку выше.';
        }
        setError('portfolioFile', true);
      } else if (portfolioFileHint) {
        portfolioFileHint.textContent = PORTFOLIO_FILE_HINT_DEFAULT;
      }
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
      // file inputs: .value is just a fake path, not useful/persistable —
      // the real content is read separately (see submitApplication).
      if (el.type === 'file') return;
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
    ARRAY_FIELDS.concat(['age', 'messenger', 'teamRole'], SCALE_FIELDS).forEach(syncControlState);
    document.querySelectorAll('.sheet-tags[data-max]').forEach(enforceTagLimit);
    syncStatusOtherReveal();
    syncSoftwareOtherReveal();
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
  function anyChecked(name) { return form.querySelectorAll('input[name="' + name + '"]:checked').length > 0; }

  function validateStep(n) {
    var ok = true;
    function req(name, condition) { setError(name, !condition); if (!condition) ok = false; }

    if (n === 1) {
      req('fullName', !!val('fullName'));
      req('age', !!checkedVal('age'));
      req('cityRegion', !!val('cityRegion'));
      req('contact', EMAIL_RE.test(val('email')));
      req('messenger', !!checkedVal('messenger'));
    } else if (n === 2) {
      req('statusMulti', anyChecked('statusMulti'));
      req('studyWork', !!val('studyWork'));
      req('competencies', anyChecked('competencies'));
    } else if (n === 3) {
      req('motivationText', !!val('motivationText'));
    } else if (n === 4) {
      // customer (2026-09-22): "не только прикрепить ссылку но и сам
      // документ" — either one satisfies this step now.
      var hasUrl = URL_RE.test(val('portfolioUrl'));
      var hasFile = portfolioFileInput && portfolioFileInput.files && portfolioFileInput.files.length > 0;
      req('portfolioUrl', hasUrl || hasFile);
      setError('portfolioFile', !(hasUrl || hasFile));
    } else if (n === 5) {
      SCALE_FIELDS.forEach(function (f) { req(f, !!checkedVal(f)); });
    } else if (n === 6) {
      req('attendanceConfirmed', form.elements['attendanceConfirmed'].checked);
      req('personalDataConsent', form.elements['personalDataConsent'].checked);
    }
    return ok;
  }

  // ---------------- navigation ----------------

  var stepAnchor = document.getElementById('apply-step-anchor');

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
    // customer (2026-09-22): opening the link cold should still show the
    // title page + first question together (scroll to the very top) —
    // but every step change after that used to ALSO jump to (0,0), which
    // on a phone put the new question below the fold with no visual cue
    // it was there. Past step 1, scroll to the compact marquee anchor
    // right above the question card instead.
    if (n === 1 || isSuccess || !stepAnchor) {
      window.scrollTo(0, 0);
    } else {
      stepAnchor.scrollIntoView({ block: 'start' });
    }
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

  // customer (2026-09-22): a chosen portfolio FILE (not just a link) is
  // read client-side as base64 and sent inline in the same JSON POST —
  // her Apps Script endpoint (APPLICATION_FORM_ENDPOINT) is the one that
  // actually decodes it and saves it into her Drive; see the code sample
  // handed to her separately, since this repo has no access to that
  // script. Returns a Promise so submitApplication can wait on it
  // without making every submission async for no reason.
  function readPortfolioFileAsBase64() {
    var file = portfolioFileInput && portfolioFileInput.files && portfolioFileInput.files[0];
    if (!file) return Promise.resolve(null);
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = reader.result || '';
        var commaIndex = result.indexOf(',');
        resolve({
          portfolioFileName: file.name,
          portfolioFileMimeType: file.type || 'application/octet-stream',
          portfolioFileBase64: commaIndex === -1 ? result : result.slice(commaIndex + 1)
        });
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
  }

  function buildPayload() {
    var data = collectFormData();
    data.applicationId = genApplicationId();
    data.timestamp = new Date().toISOString();
    return readPortfolioFileAsBase64().then(function (fileFields) {
      if (fileFields) {
        data.portfolioFileName = fileFields.portfolioFileName;
        data.portfolioFileMimeType = fileFields.portfolioFileMimeType;
        data.portfolioFileBase64 = fileFields.portfolioFileBase64;
      }
      return data;
    });
  }

  function submitApplication() {
    submitting = true;
    nextBtn.disabled = true;
    nextBtn.textContent = 'Отправляем...';
    errorNote.hidden = true;

    buildPayload().then(function (payload) {
      // не сохраняем base64 файла в localStorage — только реальные поля
      // ответа, чтобы не забить лимит хранилища браузера крупным файлом.
      var toPersist = {};
      Object.keys(payload).forEach(function (k) { if (k !== 'portfolioFileBase64') toPersist[k] = payload[k]; });
      saveState(toPersist);

      var endpoint = window.YHApp && YHApp.LINKS && YHApp.LINKS.APPLICATION_FORM_ENDPOINT;
      if (!endpoint) {
        // Реальный адрес приёма заявок ещё не подключён — не изображаем
        // фальшивую отправку, честно показываем экран "готово" только
        // локально и предупреждаем в консоли для разработки/QA.
        console.warn('APPLICATION_FORM_ENDPOINT не задан — заявка сохранена только локально.');
        finishSuccess(payload);
        return;
      }

      submitToEndpoint(endpoint, payload);
    }).catch(function () {
      submitting = false;
      nextBtn.disabled = false;
      nextBtn.textContent = 'Повторить отправку →';
      errorNote.hidden = false;
      errorNote.textContent = 'НЕ УДАЛОСЬ ПРОЧИТАТЬ ФАЙЛ ПОРТФОЛИО. ПОПРОБУЙТЕ ЕЩЁ РАЗ ИЛИ УКАЖИТЕ ССЫЛКУ.';
    });
  }

  function submitToEndpoint(endpoint, payload) {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json && json.ok) {
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
    current = TOTAL_STEPS + 1;
    showStep(current);
  }

  // ---------------- init ----------------

  applyStateToForm(loadState());
  showStep(current);
})();
