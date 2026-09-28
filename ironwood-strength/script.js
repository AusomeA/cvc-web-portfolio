(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("main-nav");
  var toggleIcon = document.getElementById("nav-toggle-icon");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (toggleIcon) toggleIcon.setAttribute("href", open ? "#icon-close" : "#icon-menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        if (toggleIcon) toggleIcon.setAttribute("href", "#icon-menu");
      });
    });
  }

  /* Weekly schedule day switcher */
  var tabs = document.querySelectorAll(".day-tabs button[data-day]");
  var panels = document.querySelectorAll(".schedule-panel[data-day]");
  function showDay(day) {
    tabs.forEach(function (t) {
      var active = t.getAttribute("data-day") === day;
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach(function (p) {
      p.hidden = p.getAttribute("data-day") !== day;
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      showDay(t.getAttribute("data-day"));
    });
  });

  /* Free trial form: client-side validation only, never submits anywhere */
  var form = document.getElementById("trial-form");
  if (form) {
    var successMsg = document.getElementById("form-success");

    function setError(fieldId, message) {
      var errorEl = document.getElementById("err-" + fieldId);
      var input = document.getElementById(fieldId);
      if (errorEl) errorEl.textContent = message || "";
      if (input) {
        var row = input.closest(".form-row");
        if (row) row.classList.toggle("has-error", !!message);
        input.setAttribute("aria-invalid", message ? "true" : "false");
      }
    }

    function validate() {
      var ok = true;
      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var phone = document.getElementById("phone");

      if (!name.value.trim() || name.value.trim().length < 2) {
        setError("name", "Please enter your full name.");
        ok = false;
      } else {
        setError("name", "");
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) {
        setError("email", "Please enter a valid email address.");
        ok = false;
      } else {
        setError("email", "");
      }

      var digits = phone.value.replace(/\D/g, "");
      if (digits.length < 7) {
        setError("phone", "Please enter a valid phone number.");
        ok = false;
      } else {
        setError("phone", "");
      }

      return ok;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validate()) {
        if (successMsg) successMsg.hidden = true;
        return;
      }
      if (successMsg) {
        successMsg.hidden = false;
      }
      form.reset();
    });
  }
})();
