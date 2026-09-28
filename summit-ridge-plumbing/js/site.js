/* Summit Ridge Plumbing & Heating: concept site interactions.
   Diagnosis ticket, rate-sheet toggle, service-area check, office status, booking form.
   Demo only: nothing here sends data anywhere. */
(function () {
  "use strict";

  var PHONE_HREF = "tel:+19705550142";
  var PHONE_TEXT = "(970) 555-0142";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var phoneIcon = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>';

  /* ------------------------------------------------------------------
     Menu (below 1080px)
  ------------------------------------------------------------------ */
  var menuBtn = $(".menu-btn");
  var nav = $("#main-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menuBtn.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        menuBtn.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        menuBtn.focus();
      }
    });
  }

  /* ------------------------------------------------------------------
     Phone call bar: stays out of the way while the hero's own buttons are on screen
  ------------------------------------------------------------------ */
  var callbar = $(".callbar");
  var heroActions = $(".hero__actions");
  if (callbar && heroActions && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      callbar.classList.toggle("is-tucked", entries[0].isIntersecting);
    }).observe(heroActions);
  }

  /* ------------------------------------------------------------------
     Office status from the visitor's clock
  ------------------------------------------------------------------ */
  (function officeStatus() {
    var el = $("#office-status-text");
    if (!el) return;
    var now = new Date();
    var day = now.getDay();              // 0 Sun .. 6 Sat
    var mins = now.getHours() * 60 + now.getMinutes();
    var hours = { 1: [420, 1140], 2: [420, 1140], 3: [420, 1140], 4: [420, 1140], 5: [420, 1140], 6: [480, 960] };
    function fmt(m) {
      var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return h + (mm ? ":" + String(mm).padStart(2, "0") : "") + " " + ap;
    }
    var today = hours[day];
    var msg;
    if (today && mins >= today[0] && mins < today[1]) {
      msg = "<strong>The office is open until " + fmt(today[1]) + ".</strong> After that, the emergency line still gets a person.";
    } else {
      // find the next opening
      var next = null, label = "";
      for (var i = 0; i < 8 && !next; i++) {
        var d = (day + i) % 7, h = hours[d];
        if (!h) continue;
        if (i === 0 && mins >= h[0]) continue;
        next = h;
        label = i === 0 ? "today" : i === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
      }
      msg = "<strong>The office is closed right now.</strong> The on-call plumber answers the emergency line. Booking opens again " +
        label + " at " + fmt(next[0]) + ".";
    }
    el.innerHTML = msg;
  })();

  /* ------------------------------------------------------------------
     Diagnosis data
     level: 1 can wait, 2 today or tomorrow, 3 call now, 4 gas (leave first)
  ------------------------------------------------------------------ */
  var FIXTURES = {
    heater: { name: "Water heater", symptoms: [
      { id: "nohot", label: "No hot water", hint: "Cold at every tap", level: 2,
        cause: "On a gas tank, the pilot is out or the thermocouple has failed. On an electric tank, a tripped reset button or a burned-out heating element.",
        price: "$150–$450", note: "Most are a part swap: thermocouple $189, element $229.",
        step: "Gas: look through the little window at the bottom for a flame. Electric: check the breaker. If you smell gas, don't relight anything." },
      { id: "leak", label: "Leaking around the tank", hint: "Puddle or drip at the base", level: 3,
        cause: "If water is coming from the tank itself, the lining has rusted through and the tank has to be replaced. If it's a fitting or the relief valve on the side, it's a small repair.",
        price: "$180–$350", note: "To fix a fitting or valve. A new 50-gallon gas tank is from $2,150 installed.",
        step: "Close the cold-water valve on the pipe above the tank. Then turn the gas knob to pilot, or switch off the breaker for an electric tank." },
      { id: "noise", label: "Popping or rumbling", hint: "Loud while it heats", level: 1,
        cause: "Sediment on the bottom of the tank. Front Range water is hard, so this is common after four or five years; water boils under the layer and pops.",
        price: "$159", note: "Flush and inspect, flat.",
        step: "Nothing urgent. Turning the thermostat down a notch quiets it until we flush it." },
      { id: "rusty", label: "Rusty or smelly hot water", hint: "Brown water or a rotten-egg smell", level: 1,
        cause: "The anode rod inside the tank is used up. The smell is bacteria reacting with it; rust means the tank itself has started to corrode.",
        price: "$200–$350", note: "New anode rod and a flush. If the tank is rusting inside, we'll price a replacement instead.",
        step: "Run a cold tap. If the cold water is clear, it's the heater and not your water supply." }
    ] },
    drain: { name: "Drain or sewer", symptoms: [
      { id: "slow", label: "Draining slowly", hint: "One sink, tub or shower", level: 1,
        cause: "Hair and soap buildup in the trap or the first few feet of pipe.",
        price: "$149", note: "To clear a sink, tub or shower drain, flat.",
        step: "Skip the chemical drain cleaner. It rarely clears hair, and it's hard on older pipe." },
      { id: "stopped", label: "Not draining at all", hint: "Water sits in one fixture", level: 2,
        cause: "A clog further down the branch line. In kitchens it's usually grease.",
        price: "$149–$289", note: "Branch line clearing up to a main-line clearing.",
        step: "Stop using that fixture. If other drains are slow too, pick “Sewage coming up” instead." },
      { id: "sewage", label: "Sewage coming up", hint: "Floor drain, tub, or several fixtures at once", level: 3,
        cause: "The main sewer line is blocked. In older Loveland and Fort Collins neighborhoods it's usually tree roots in clay pipe.",
        price: "$289", note: "To clear the main line, with a camera look to find the cause.",
        step: "Stop all water use in the house now: no flushing, showers, dishwasher or laundry." },
      { id: "gurgle", label: "Gurgling or sewer smell", hint: "Bubbling toilet, smell in the basement", level: 1,
        cause: "A partial clog, a blocked roof vent, or a dry trap in a drain nobody uses.",
        price: "$125–$300", note: "Depends on whether it's the vent, the trap or the line.",
        step: "Pour a gallon of water into any floor drain or unused sink. If the smell goes away, it was a dry trap." }
    ] },
    toilet: { name: "Toilet", symptoms: [
      { id: "running", label: "Keeps running", hint: "Refills on its own", level: 1,
        cause: "A worn flapper or fill valve. It can waste 200 gallons a day.",
        price: "$159", note: "To rebuild the tank: flapper, fill valve and supply line.",
        step: "Turn the valve on the wall behind the toilet clockwise until the water stops." },
      { id: "clog", label: "Clogged or overflowing", hint: "Water rising in the bowl", level: 2,
        cause: "A blockage in the toilet itself or in the line just past it.",
        price: "$139", note: "To clear a toilet, flat.",
        step: "Take the tank lid off and push the rubber flapper down to stop the water. Then close the valve behind the toilet." },
      { id: "base", label: "Leaking at the base", hint: "Water on the floor after a flush", level: 2,
        cause: "The wax seal under the toilet has failed. Left alone, it rots the subfloor.",
        price: "$209", note: "To reset the toilet with a new seal and bolts.",
        step: "Use another toilet until it's fixed, and keep a towel down." },
      { id: "wobble", label: "Rocks or wobbles", hint: "Moves when you sit", level: 1,
        cause: "Loose floor bolts or a cracked flange. A wobble breaks the seal next.",
        price: "$150–$325", note: "Bolts and shims, up to a new flange.",
        step: "Don't crank the bolts down. The porcelain cracks before they get tight." }
    ] },
    pipes: { name: "Pipes", symptoms: [
      { id: "burst", label: "Burst or spraying", hint: "Water coming out fast", level: 3,
        cause: "A split pipe or a failed fitting, usually from freezing.",
        price: "$350–$900", note: "Depends on where it is and what's in the way.",
        step: "Shut the main water valve where the line comes into the house, usually in the basement or crawlspace near the front wall. Then switch off the water heater." },
      { id: "frozen", label: "Frozen, no water at a tap", hint: "After a cold night", level: 3,
        cause: "A pipe in an outside wall, the garage or the crawlspace has frozen. It can split as it thaws.",
        price: "$199", note: "To thaw the line. If it split, we price the repair before starting.",
        step: "Leave the faucet open. Warm the area with a hair dryer or space heater, never an open flame." },
      { id: "drip", label: "Small leak or drip", hint: "A stain, a drip, a damp spot", level: 2,
        cause: "A pinhole leak in copper pipe or a loose fitting.",
        price: "From $225", note: "To repair a pipe or fitting.",
        step: "Put a bucket under it and close the nearest shutoff valve, if there is one." },
      { id: "pressure", label: "Low pressure everywhere", hint: "Weak flow at every tap", level: 1,
        cause: "A failing pressure regulator where the water comes in, or old galvanized pipe closing up inside.",
        price: "$489", note: "To replace the pressure regulator, set and tested.",
        step: "Ask a neighbor. If their pressure is low too, call the city water department first." },
      { id: "bang", label: "Banging when a tap shuts", hint: "A thud in the walls", level: 1,
        cause: "Water hammer: loose pipe straps, or no shock arrestors on the washer and dishwasher lines.",
        price: "$150–$400", note: "Straps, arrestors, or both.",
        step: "Nothing urgent. Note which fixture sets it off; it saves time on the visit." }
    ] },
    heat: { name: "Furnace or boiler", symptoms: [
      { id: "noheat", label: "No heat", hint: "Nothing from the vents or radiators", level: 3,
        cause: "Usually a failed igniter, a dirty flame sensor or a tripped safety switch.",
        price: "$150–$500", note: "Most no-heat repairs come in under $300.",
        step: "Check the thermostat batteries and the furnace switch, which looks like a light switch. If it's below freezing, open the cabinet doors under sinks on outside walls." },
      { id: "cold", label: "Runs, but the air is cold", hint: "Fan on, no warmth", level: 2,
        cause: "A dirty flame sensor or a clogged filter makes the burners shut off early.",
        price: "$119–$300", note: "Often fixed during a tune-up.",
        step: "Swap the filter if it's grey. That fixes this more often than you'd think." },
      { id: "boiler", label: "Boiler leaking or pressure high", hint: "Gauge in the red, drip from a valve", level: 2,
        cause: "A failed relief valve or a waterlogged expansion tank.",
        price: "$250–$600", note: "Relief valve up to a new expansion tank.",
        step: "Turn the boiler off at its switch and let it cool. Never cap or plug the relief valve." },
      { id: "gas", label: "Smells like gas", hint: "Rotten-egg smell near it", level: 4,
        cause: "Possibly a gas leak at the appliance or the line. That's a safety call before it's a repair.",
        price: "Priced once it's safe", note: "We quote the repair after the gas company clears the house.",
        step: "Get everyone out of the house now. Don't flip switches or start a car in the garage. From outside, call 911 or your gas company." }
    ] },
    faucet: { name: "Faucet or fixture", symptoms: [
      { id: "dripfaucet", label: "Dripping faucet", hint: "Won't shut off all the way", level: 1,
        cause: "A worn cartridge or washer inside the handle.",
        price: "$125–$250", note: "Cartridge or washer, parts included.",
        step: "Nothing urgent. If you can see a brand name on the faucet, note it and we'll bring the right cartridge." },
      { id: "spigot", label: "Outdoor spigot leaking", hint: "Drips outside, or a wet wall inside", level: 2,
        cause: "A freeze-cracked spigot, usually from a hose left on over winter. The crack is often inside the wall.",
        price: "$219", note: "To replace it with a frost-free spigot.",
        step: "Find that spigot's shutoff inside, in the basement ceiling or crawlspace, and close it. Take the hose off." },
      { id: "disposal", label: "Disposal hums or jams", hint: "Hums but won't spin", level: 1,
        cause: "Something wedged in the grinder, or the motor has worn out.",
        price: "$125–$429", note: "$125 to free it. $429 for a new disposal, installed.",
        step: "Switch it off and press the red reset button underneath. Never put a hand inside." }
    ] }
  };

  var LEVEL = {
    1: { tag: "Can wait", say: "It can wait for a booked visit." },
    2: { tag: "Today or tomorrow", say: "Get it looked at today or tomorrow." },
    3: { tag: "Call now", say: "Call now." },
    4: { tag: "Leave the house first", say: "Leave the house first, then call." }
  };

  /* ------------------------------------------------------------------
     Diagnosis behaviour
  ------------------------------------------------------------------ */
  var form = $("#diag-form");
  var list = $("#symptom-list");
  var ticket = $("#ticket");
  var live = $("#diag-live");
  var lastPointer = "mouse";
  var current = null;

  document.addEventListener("pointerdown", function (e) { lastPointer = e.pointerType || "mouse"; }, true);
  document.addEventListener("keydown", function () { lastPointer = "keyboard"; }, true);

  function field(name) { return ticket.querySelector('[data-f="' + name + '"]'); }

  function write(name, text, delay, still) {
    var el = field(name);
    if (!el) return;
    el.textContent = text || "";
    el.classList.remove("is-writing");
    if (!text || still) return;
    void el.offsetWidth; // restart the animation
    el.style.animationDelay = (delay || 0) + "ms";
    el.classList.add("is-writing");
  }

  function setUrgency(level) {
    var shown = level === 4 ? 3 : level;
    $$("#urgency li").forEach(function (li) {
      if (Number(li.getAttribute("data-l")) === shown) li.setAttribute("aria-current", "true");
      else li.removeAttribute("aria-current");
    });
  }

  function renderSymptoms(key, still) {
    var fx = FIXTURES[key];
    var html = fx.symptoms.map(function (s) {
      var urgent = s.level >= 3 ? '<span class="sym__flag">Urgent</span>' : "";
      return '<label class="sym"><input type="radio" name="symptom" value="' + s.id + '">' +
        '<span class="sym__dot" aria-hidden="true"></span>' +
        '<span class="sym__text"><span class="sym__label">' + esc(s.label) + "</span>" + urgent +
        '<span class="sym__hint">' + esc(s.hint) + "</span></span></label>";
    }).join("");
    list.innerHTML = html;
    list.classList.remove("is-new");
    if (still) return;
    void list.offsetWidth;
    list.classList.add("is-new");
  }

  function resetTicket(fixtureName) {
    ticket.setAttribute("data-level", "0");
    $("#ticket-tag").textContent = "Estimate, not a bill";
    write("fixture", fixtureName, 0);
    ["symptom", "cause", "price", "note", "step"].forEach(function (n) { write(n, ""); });
    setUrgency(0);
    $("#ticket-action").innerHTML = '<p class="ticket__hint">Now pick what it’s doing.</p>';
  }

  function fillTicket(fxKey, s, example) {
    var fx = FIXTURES[fxKey];
    current = { fixture: fx.name, symptom: s.label, price: s.price, level: s.level };
    ticket.setAttribute("data-level", String(s.level));
    $("#ticket-tag").textContent = example ? "Example. Pick yours." : s.level >= 3 ? LEVEL[s.level].tag : "Estimate, not a bill";

    write("fixture", fx.name, 0, example);
    write("symptom", s.label, 60, example);
    write("cause", s.cause, 140, example);
    write("price", s.price, 240, example);
    field("price").classList.toggle("is-long", s.price.length > 12);
    write("note", s.note, 300, example);
    write("step", s.step, 380, example);
    setUrgency(s.level);

    var action = $("#ticket-action");
    if (s.level >= 3) {
      var lead = s.level === 4
        ? '<p class="ticket__warn">Get outside first. Then call us for the repair.</p>'
        : "";
      action.innerHTML = lead +
        '<div class="ticket__call"><a class="btn btn--hot" href="' + PHONE_HREF + '">' + phoneIcon + " Call " + PHONE_TEXT + "</a>" +
        '<p class="ticket__sub">A dispatcher answers 24/7. In our area a truck is usually there in 60 to 90 minutes.</p></div>' +
        (s.level === 3 ? '<a class="ticket__alt" href="#book" data-book>Or book online instead</a>' : "");
    } else {
      var label = s.level === 2 ? "Book the first available visit" : "Book a visit for this";
      action.innerHTML = '<a class="btn btn--spruce" href="#book" data-book>' + label + "</a>" +
        '<p class="ticket__sub">Or call ' + '<a class="ticket__alt" href="' + PHONE_HREF + '">' + PHONE_TEXT + "</a>.</p>";
    }

    if (example) return;
    live.textContent = s.level === 4
      ? fx.name + ", " + s.label + ". " + s.step
      : fx.name + ", " + s.label + ". Likely cause: " + s.cause + " Usually costs " + s.price + ". " + LEVEL[s.level].say;

    // On phones the ticket sits below the list: bring it into view after a tap, not on arrow-key browsing.
    if (lastPointer !== "keyboard" && window.matchMedia("(max-width: 960px)").matches) {
      var r = ticket.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.55 || r.bottom < 0) {
        ticket.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      }
    }
  }

  if (form && list && ticket) {
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "fixture") {
        renderSymptoms(t.value);
        resetTicket(FIXTURES[t.value].name);
        current = null;
        live.textContent = FIXTURES[t.value].name + " selected. " + FIXTURES[t.value].symptoms.length + " common problems listed below.";
      } else if (t.name === "symptom") {
        var fxInput = form.querySelector('input[name="fixture"]:checked');
        if (!fxInput) return;
        var s = FIXTURES[fxInput.value].symptoms.filter(function (x) { return x.id === t.value; })[0];
        if (s) fillTicket(fxInput.value, s);
      }
    });

    // Open on a worked example so the ticket shows what it does before anyone picks.
    var exFixture = form.querySelector('input[name="fixture"][value="heater"]');
    if (exFixture) {
      exFixture.checked = true;
      renderSymptoms("heater", true);
      var exSym = list.querySelector('input[value="nohot"]');
      if (exSym) exSym.checked = true;
      fillTicket("heater", FIXTURES.heater.symptoms[0], true);
    }
  }

  /* ------------------------------------------------------------------
     Rate sheet: weekday vs after-hours
  ------------------------------------------------------------------ */
  var AFTER = 95;
  function money(n) { return "$" + n.toLocaleString("en-US"); }
  function renderRates(mode, animate) {
    $$(".rate__price").forEach(function (el) {
      var p = Number(el.getAttribute("data-p"));
      var to = el.getAttribute("data-to");
      var from = el.hasAttribute("data-from");
      var weekday = el.hasAttribute("data-weekday");
      var html;
      el.classList.remove("is-off");
      if (mode === "after" && weekday) {
        html = "Weekdays only";
        el.classList.add("is-off");
      } else {
        var add = mode === "after" ? AFTER : 0;
        html = (from ? "<small>from</small>" : "") + money(p + add) + (to ? "–" + money(Number(to) + add) : "");
      }
      if (el.innerHTML !== html) {
        el.innerHTML = html;
        if (animate) {
          el.classList.remove("is-changed");
          void el.offsetWidth;
          el.classList.add("is-changed");
        }
      }
    });
  }
  renderRates("day", false);
  $$('input[name="when"]').forEach(function (r) {
    r.addEventListener("change", function () { if (r.checked) renderRates(r.value, true); });
  });

  /* ------------------------------------------------------------------
     Service-area check
  ------------------------------------------------------------------ */
  var TOWNS = {
    "loveland":     { name: "Loveland", zips: ["80537", "80538", "80539"], state: "yes", eta: "45 to 60 minutes", extra: "It's where the shop is." },
    "berthoud":     { name: "Berthoud", zips: ["80513"], state: "yes", eta: "45 to 75 minutes" },
    "fort collins": { name: "Fort Collins", zips: ["80521", "80522", "80523", "80524", "80525", "80526", "80527", "80528"], state: "yes", eta: "60 to 90 minutes" },
    "windsor":      { name: "Windsor", zips: ["80550", "80551"], state: "yes", eta: "60 to 90 minutes" },
    "timnath":      { name: "Timnath", zips: ["80547"], state: "yes", eta: "60 to 90 minutes" },
    "johnstown":    { name: "Johnstown", zips: ["80534"], state: "yes", eta: "60 to 90 minutes" },
    "wellington":   { name: "Wellington", zips: ["80549"], state: "edge", eta: "90 to 120 minutes" },
    "greeley":      { name: "Greeley", zips: ["80631", "80632", "80634", "80639"], state: "no" },
    "longmont":     { name: "Longmont", zips: ["80501", "80503", "80504"], state: "no" },
    "estes park":   { name: "Estes Park", zips: ["80517"], state: "no" }
  };
  var ICONS = {
    yes: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12.5l5 5L20 6.5"/></svg>',
    edge: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    no: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>',
    unknown: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/></svg>'
  };

  function findTown(q) {
    var s = q.trim().toLowerCase().replace(/,?\s*(co|colorado)$/, "").replace(/\s+/g, " ");
    if (!s) return null;
    var zip = s.match(/^\d{5}$/);
    for (var k in TOWNS) {
      if (zip ? TOWNS[k].zips.indexOf(s) !== -1 : (k === s || k.replace(" ", "") === s.replace(" ", ""))) return TOWNS[k];
    }
    if (s === "ft collins" || s === "ft. collins" || s === "foco") return TOWNS["fort collins"];
    return undefined;
  }

  var areaForm = $("#area-form");
  var areaInput = $("#area-q");
  var areaOut = $("#area-result");
  var map = $(".area__map");

  function checkArea(q) {
    var t = findTown(q);
    var html, cls;
    $$(".town", map).forEach(function (g) { g.classList.remove("is-pick"); });
    map.classList.remove("has-pick");
    if (t === null) {
      cls = "unknown";
      html = "<div><strong>Type a town or a ZIP code.</strong><p>For example Windsor, or 80537.</p></div>";
    } else if (t === undefined) {
      cls = "unknown";
      html = "<div><strong>We don't have “" + esc(q.trim()) + "” on our list.</strong><p>Try the town name, like Timnath, or a 5-digit ZIP like 80550. Near us but not listed? Call and ask; we often say yes.</p></div>";
    } else {
      var g = map.querySelector('.town[data-town="' + t.name + '"]');
      if (g) { g.classList.add("is-pick"); map.classList.add("has-pick"); }
      if (t.state === "yes") {
        cls = "yes";
        html = "<div><strong>Yes, we cover " + t.name + ".</strong><p>For an emergency, a truck usually gets there in " + t.eta + ". " +
          (t.extra ? t.extra + " " : "") + "Booked visits come with a two-hour window.</p></div>";
      } else if (t.state === "edge") {
        cls = "edge";
        html = "<div><strong>" + t.name + " is at the edge of our area.</strong><p>We come out for emergencies and booked visits. Plan on " + t.eta + " for an emergency.</p></div>";
      } else {
        cls = "no";
        html = "<div><strong>" + t.name + " is outside our area.</strong><p>For an emergency, <a href=\"" + PHONE_HREF + "\">call anyway</a>. If a truck is close we'll come, and if not we'll give you the name of someone good.</p></div>";
      }
    }
    areaOut.innerHTML = '<div class="result result--' + cls + '">' + ICONS[cls] + html + "</div>";
  }

  if (areaForm) {
    areaForm.addEventListener("submit", function (e) {
      e.preventDefault();
      checkArea(areaInput.value);
    });
    $$(".area__towns button").forEach(function (b) {
      b.addEventListener("click", function () {
        areaInput.value = b.getAttribute("data-town");
        checkArea(areaInput.value);
      });
    });
  }

  /* ------------------------------------------------------------------
     Booking form (demo)
  ------------------------------------------------------------------ */
  var book = $("#book-form");
  var carry = $("#carry");
  var carryText = $("#carry-text");
  var issue = $("#b-issue");

  function prefill(text, note, first) {
    if (!book) return;
    issue.value = text;
    if (note) {
      carryText.textContent = note;
      carry.hidden = false;
    } else {
      carry.hidden = true;
    }
    if (first) {
      var r = book.querySelector('input[name="window"][value="first"]');
      if (r) r.checked = true;
    }
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-book]");
    if (a && current) {
      prefill(current.fixture + ": " + current.symptom.toLowerCase() + ".",
        current.fixture + ", " + current.symptom.toLowerCase() + ". Usually " + current.price + ".",
        current.level >= 2);
      focusAfterJump($("#b-name"));
      return;
    }
    var w = e.target.closest("[data-prefill]");
    if (w) {
      prefill(w.getAttribute("data-prefill"), "Winterizing visit, $149.", false);
      focusAfterJump($("#b-name"));
    }
  });

  function focusAfterJump(el) {
    if (!el) return;
    window.setTimeout(function () { el.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 450);
  }

  var rules = {
    "b-name": function (v) { return v.trim().length >= 2 ? "" : "Enter your name so the plumber knows who to ask for."; },
    "b-phone": function (v) { return v.replace(/\D/g, "").length >= 10 ? "" : "Enter a 10-digit phone number. We text to confirm."; },
    "b-address": function (v) { return v.trim().length >= 6 ? "" : "Enter the street address and town."; },
    "b-issue": function (v) { return v.trim().length >= 4 ? "" : "Say a few words about what's going on."; }
  };

  function validate(id) {
    var input = document.getElementById(id);
    var msg = rules[id](input.value);
    var wrap = input.closest(".field");
    document.getElementById(id + "-err").textContent = msg;
    wrap.classList.toggle("has-error", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  if (book) {
    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      input.addEventListener("blur", function () { if (input.value) validate(id); });
      input.addEventListener("input", function () {
        if (input.closest(".field").classList.contains("has-error")) validate(id);
      });
    });
    book.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (!validate(id) && !firstBad) firstBad = document.getElementById(id);
      });
      var done = $("#book-done");
      if (firstBad) {
        done.hidden = true;
        firstBad.focus();
        return;
      }
      var win = book.querySelector('input[name="window"]:checked');
      var winText = { first: "the first available window", morning: "a morning window", afternoon: "an afternoon window" }[win ? win.value : "first"];
      var name = $("#b-name").value.trim().split(/\s+/)[0];
      done.innerHTML = "<strong>Request ready, " + esc(name) + ".</strong>" +
        "<p>On the real site, the office would text you to confirm " + winText + ". This is a demo, so nothing was sent and nothing was saved.</p>";
      done.hidden = false;
      done.focus();
    });
  }
})();
