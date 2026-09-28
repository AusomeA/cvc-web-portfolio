(function () {
  "use strict";

  var form = document.getElementById("quote-form");
  if (!form) return;

  var successMsg = document.getElementById("form-success");

  var fields = [
    {
      id: "name",
      rowId: "row-name",
      validate: function (value) {
        return value.trim().length > 1;
      }
    },
    {
      id: "phone",
      rowId: "row-phone",
      validate: function (value) {
        var digits = value.replace(/\D/g, "");
        return digits.length >= 10;
      }
    },
    {
      id: "service",
      rowId: "row-service",
      validate: function (value) {
        return value.trim().length > 0;
      }
    }
  ];

  function setFieldState(field, valid) {
    var row = document.getElementById(field.rowId);
    if (!row) return;
    if (valid) {
      row.classList.remove("has-error");
    } else {
      row.classList.add("has-error");
    }
  }

  fields.forEach(function (field) {
    var el = document.getElementById(field.id);
    if (!el) return;
    el.addEventListener("blur", function () {
      setFieldState(field, field.validate(el.value));
    });
    el.addEventListener("input", function () {
      var row = document.getElementById(field.rowId);
      if (row && row.classList.contains("has-error") && field.validate(el.value)) {
        row.classList.remove("has-error");
      }
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (successMsg) {
      successMsg.classList.remove("visible");
    }

    var allValid = true;
    var firstInvalidEl = null;

    fields.forEach(function (field) {
      var el = document.getElementById(field.id);
      if (!el) return;
      var valid = field.validate(el.value);
      setFieldState(field, valid);
      if (!valid) {
        allValid = false;
        if (!firstInvalidEl) firstInvalidEl = el;
      }
    });

    if (!allValid) {
      if (firstInvalidEl) firstInvalidEl.focus();
      return;
    }

    if (successMsg) {
      successMsg.classList.add("visible");
      successMsg.setAttribute("tabindex", "-1");
      successMsg.focus();
    }
    form.reset();
  });
})();
