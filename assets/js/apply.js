(function () {
  'use strict';

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

  /* ---------- Application form submit ---------- */
  var form = document.getElementById('applyForm');
  var formError = document.getElementById('formError');
  var thankYou = document.getElementById('thankYou');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var valid = form.checkValidity();

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
