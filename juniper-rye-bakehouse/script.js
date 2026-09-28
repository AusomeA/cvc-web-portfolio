(function () {
  "use strict";

  /* Mobile nav toggle */
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Custom cake form: validate, prevent submission, show demo confirmation */
  var form = document.getElementById("cake-form");
  if (!form) return;

  var successMsg = document.getElementById("form-success");
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(fieldId, errorId, message) {
    var field = document.getElementById(fieldId);
    var error = document.getElementById(errorId);
    if (!field || !error) return true;
    if (message) {
      field.setAttribute("aria-invalid", "true");
      error.textContent = message;
      return false;
    }
    field.removeAttribute("aria-invalid");
    error.textContent = "";
    return true;
  }

  function todayISO() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    successMsg.hidden = true;

    var name = document.getElementById("cf-name").value.trim();
    var email = document.getElementById("cf-email").value.trim();
    var date = document.getElementById("cf-date").value;
    var flavor = document.getElementById("cf-flavor").value;
    var size = document.getElementById("cf-size").value;

    var ok = true;
    ok = setError("cf-name", "err-name", name ? "" : "Please enter your name.") && ok;
    ok = setError("cf-email", "err-email", emailPattern.test(email) ? "" : "Please enter a valid email address.") && ok;
    ok = setError("cf-date", "err-date", date && date >= todayISO() ? "" : "Please choose today or a future date.") && ok;
    ok = setError("cf-flavor", "err-flavor", flavor ? "" : "Please pick a flavor.") && ok;
    ok = setError("cf-size", "err-size", size ? "" : "Please pick a size.") && ok;

    if (!ok) {
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    successMsg.hidden = false;
    successMsg.textContent = "Thanks! (Demo site: nothing was sent.)";
    form.reset();
    successMsg.focus && successMsg.setAttribute("tabindex", "-1");
  });
})();
