/* Juniper & Rye Bakehouse: today's oven board, custom cake builder, demo form.
   Demo-safe: nothing is sent anywhere. For screenshots: ?time=09:40&day=2 (0 = Sunday). */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap || null;
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function mins(s) { var p = s.split(':'); return +p[0] * 60 + +p[1]; }
  function clock(t) { var h = Math.floor(t / 60) % 24, m = Math.round(t % 60); if (m === 60) { h += 1; m = 0; } var h12 = h % 12 || 12; return h12 + ':' + (m < 10 ? '0' : '') + m; }
  function clockAmPm(t) { var h = Math.floor(t / 60) % 24; return clock(t) + (h < 12 ? ' am' : ' pm'); }
  function span(d) {
    d = Math.round(d);
    if (d < 60) return d + (d === 1 ? ' minute' : ' minutes');
    var h = Math.floor(d / 60), m = d % 60;
    return h + (h === 1 ? ' hour' : ' hours') + (m ? ' ' + m + ' min' : '');
  }
  function list(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function listMore(a, max) { return a.length > max ? a.slice(0, max).join(', ') + ' and more' : list(a); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- Bake schedule ----------
     [out of the oven, board name, sentence subject, short name, minutes in the oven, usually gone by] */
  var WEEK = [
    ['06:30', 'Country loaf', 'Country loaves come', 'country loaves', 45, '11:00'],
    ['06:50', 'Baguettes', 'Baguettes come', 'baguettes', 25, '10:30'],
    ['07:15', 'Brown butter croissants', 'Croissants come', 'croissants', 20, '10:00'],
    ['07:40', 'Cardamom morning buns', 'Morning buns come', 'morning buns', 25, '09:30'],
    ['08:30', 'Rye bâtard', 'Rye bâtards come', 'rye bâtards', 50, '14:00'],
    ['09:00', 'Focaccia of the day', 'Focaccia comes', 'focaccia', 25, '13:00'],
    ['10:15', 'Croissants, second bake', 'More croissants come', 'croissants', 20, '12:30'],
    ['11:00', 'Country loaf, second bake', 'More country loaves come', 'country loaves', 45, null],
    ['12:30', 'Ginger molasses cookies', 'Ginger cookies come', 'ginger cookies', 14, null]
  ];
  var SAT = [
    ['06:30', 'Country loaf', 'Country loaves come', 'country loaves', 45, '10:30'],
    ['06:50', 'Baguettes', 'Baguettes come', 'baguettes', 25, '10:00'],
    ['07:15', 'Brown butter croissants', 'Croissants come', 'croissants', 20, '09:30'],
    ['07:40', 'Cardamom morning buns', 'Morning buns come', 'morning buns', 25, '09:00'],
    ['08:00', 'Honey lavender sourdough', 'Honey lavender loaves come', 'honey lavender loaves', 45, '11:30'],
    ['08:30', 'Rye bâtard', 'Rye bâtards come', 'rye bâtards', 50, '13:30'],
    ['09:00', 'Focaccia of the day', 'Focaccia comes', 'focaccia', 25, '12:00'],
    ['10:15', 'Croissants, second bake', 'More croissants come', 'croissants', 20, '12:00'],
    ['11:00', 'Country loaf, second bake', 'More country loaves come', 'country loaves', 45, '14:00'],
    ['12:30', 'Ginger molasses cookies', 'Ginger cookies come', 'ginger cookies', 14, null]
  ];
  var SUN = [
    ['07:30', 'Country loaf', 'Country loaves come', 'country loaves', 45, '11:30'],
    ['07:50', 'Baguettes', 'Baguettes come', 'baguettes', 25, '11:00'],
    ['08:15', 'Brown butter croissants', 'Croissants come', 'croissants', 20, '11:00'],
    ['08:40', 'Cardamom morning buns', 'Morning buns come', 'morning buns', 25, '10:15'],
    ['09:30', 'Rye bâtard', 'Rye bâtards come', 'rye bâtards', 50, null],
    ['10:00', 'Focaccia of the day', 'Focaccia comes', 'focaccia', 25, '12:30'],
    ['11:30', 'Ginger molasses cookies', 'Ginger cookies come', 'ginger cookies', 14, null]
  ];
  function scheduleFor(day) {
    if (day === 1) return null; // closed Mondays
    if (day === 0) return { open: mins('08:00'), close: mins('13:00'), bakes: SUN };
    if (day === 6) return { open: mins('07:00'), close: mins('15:00'), bakes: SAT };
    return { open: mins('07:00'), close: mins('15:00'), bakes: WEEK };
  }

  /* ---------- "Now", with an optional ?time=HH:MM&day=N override ---------- */
  var params = new URLSearchParams(location.search);
  function now() {
    var d = new Date();
    var qd = params.get('day'), qt = params.get('time');
    if (qd !== null && /^[0-6]$/.test(qd)) d.setDate(d.getDate() + ((+qd - d.getDay() + 7) % 7));
    if (qt && /^\d{1,2}:\d{2}$/.test(qt)) { var p = qt.split(':'); d.setHours(+p[0], +p[1], 0, 0); }
    return d;
  }

  /* ---------- Oven board ---------- */
  var board = document.getElementById('board');
  var rail = document.getElementById('rail');
  var listEl = document.getElementById('bakes');
  var needle = document.getElementById('needle');
  var handle = document.getElementById('needle-handle');
  var tag = document.getElementById('needle-tag');
  var titleEl = document.getElementById('board-title');
  var clockEl = document.getElementById('board-clock');
  var sayEl = document.getElementById('board-say');
  var moreEl = document.getElementById('board-more');
  var resetBtn = document.getElementById('board-reset');
  var liveEl = document.getElementById('board-live');

  var state = { day: null, offset: 0, sched: null, rows: [], nowT: 0, t: 0, planning: false, tMin: 0, tMax: 0 };

  function findDay(date) {
    var d = date.getDay(), t = date.getHours() * 60 + date.getMinutes();
    var s = scheduleFor(d);
    if (s && t < s.close) return { day: d, offset: 0, sched: s, t: t };
    for (var i = 1; i <= 7; i++) {
      var dd = (d + i) % 7, ss = scheduleFor(dd);
      if (ss) return { day: dd, offset: i, sched: ss, t: null };
    }
  }

  function buildRows() {
    var s = state.sched, rows = [];
    s.bakes.forEach(function (b) {
      var out = mins(b[0]);
      rows.push({ t: out, name: b[1], say: b[2], short: b[3], inAt: out - b[4], gone: b[5] ? mins(b[5]) : null });
    });
    rows.push({ t: s.open, name: 'Doors open', event: 'open' });
    rows.push({ t: s.close, name: 'We close', event: 'close' });
    rows.sort(function (a, b) { return a.t - b.t || (a.event ? 1 : -1); });
    state.rows = rows;
    state.tMin = rows[0].t - 60;
    state.tMax = s.close;

    listEl.innerHTML = '';
    rows.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'bake' + (r.event ? ' is-event' : '');
      li.innerHTML = '<span class="bake__t">' + clock(r.t) + '</span><span class="bake__n"></span><span class="bake__s"></span>';
      li.querySelector('.bake__n').textContent = r.name;
      li.addEventListener('click', function () { setPlan(r.t, true); });
      r.el = li; r.sEl = li.querySelector('.bake__s');
      listEl.appendChild(li);
    });
    handle.setAttribute('aria-valuemin', state.tMin);
    handle.setAttribute('aria-valuemax', state.tMax);
  }

  function bakes() { return state.rows.filter(function (r) { return !r.event; }); }

  function statusOf(r, t, next) {
    if (r.event) return '';
    if (r.gone !== null && t >= r.gone) return 'gone';
    if (t >= r.t) return (r.gone !== null && t >= r.gone - 45) ? 'fast' : 'shelf';
    if (t >= r.inAt) return 'oven';
    if (r === next) return 'next';
    return '';
  }
  var LABEL = { gone: 'usually gone', fast: 'going fast', shelf: 'on the shelf', oven: 'in the oven', next: 'next' };

  function renderRows(t) {
    var next = bakes().filter(function (r) { return r.t > t; })[0];
    state.rows.forEach(function (r) {
      var st = statusOf(r, t, next);
      if (r.st !== st) {
        r.el.classList.remove('is-gone', 'is-fast', 'is-shelf', 'is-oven', 'is-next');
        if (st) r.el.classList.add('is-' + st);
        r.sEl.innerHTML = st ? (st === 'oven' ? '<span class="bar" aria-hidden="true"><i></i></span>' : '') + '<span>' + LABEL[st] + '</span>' : '';
        r.st = st;
      }
      if (st === 'oven') {
        var i = r.sEl.querySelector('.bar i');
        if (i) i.style.setProperty('--p', Math.max(0, Math.min(1, (t - r.inAt) / (r.t - r.inAt))).toFixed(3));
      }
    });
  }

  /* Time <-> rail position. The needle only travels in the gaps between rows: during the
     interval after row i it moves across the boundary below row i, and it jumps past a row
     exactly at that row's time, so it never crosses the text. */
  var GAP = 14;
  function geom() {
    var top = listEl.offsetTop;
    return state.rows.map(function (r) { return { top: top + r.el.offsetTop, bottom: top + r.el.offsetTop + r.el.offsetHeight }; });
  }
  function tToY(t) {
    var g = geom(), R = state.rows, n = R.length;
    if (t < R[0].t) {
      var f0 = Math.max(0, Math.min(1, (t - state.tMin) / (R[0].t - state.tMin)));
      return g[0].top - 10 + f0 * 14;
    }
    for (var i = 0; i < n - 1; i++) {
      if (t < R[i + 1].t) return g[i].bottom + ((t - R[i].t) / (R[i + 1].t - R[i].t) - 0.5) * GAP;
    }
    return g[n - 1].bottom - GAP / 2;
  }
  function yToT(y) {
    var g = geom(), R = state.rows, n = R.length;
    if (y < g[0].top + 4) return state.tMin + Math.max(0, Math.min(1, (y - (g[0].top - 10)) / 14)) * (R[0].t - state.tMin);
    for (var i = 0; i < n; i++) {
      if (y < g[i].bottom - GAP / 2) return R[i].t;             // over row i: snap to its time
      if (i === n - 1) return R[i].t;
      if (y <= g[i].bottom + GAP / 2) return R[i].t + ((y - g[i].bottom) / GAP + 0.5) * (R[i + 1].t - R[i].t);
    }
    return state.tMax;
  }

  function placeNeedle(t) {
    var clamped = Math.max(state.tMin, Math.min(state.tMax, t));
    needle.style.transform = 'translateY(' + tToY(clamped).toFixed(1) + 'px)';
    tag.textContent = clock(t);
  }

  function dayWord() {
    if (state.offset === 0) return 'today';
    if (state.offset === 1) return 'tomorrow';
    return 'on ' + DAYS[state.day];
  }

  function renderText(t) {
    var s = state.sched, all = bakes();
    var next = all.filter(function (r) { return r.t > t; })[0];
    var seen = {}, shelf = [], gone = [];
    all.forEach(function (r) {
      if (r.t <= t && (r.gone === null || t < r.gone) && !seen[r.short]) { seen[r.short] = 1; shelf.push(r.short); }
    });
    all.forEach(function (r) { if (r.gone !== null && t >= r.gone && !seen[r.short] && gone.indexOf(r.short) < 0) gone.push(r.short); });

    var title, clk, say, more = [];
    var dayName = DAYS[state.day];
    title = state.offset === 0 ? "Today's oven" : state.offset === 1 ? "Tomorrow's oven" : dayName + "'s oven";

    if (!state.planning && state.offset > 0) {
      // closed now: show the next open day's first bake, needle parked at opening time
      var first = all[0];
      var nextAtOpen = all.filter(function (r) { return r.t > s.open; })[0];
      clk = now().getDay() === 1 ? 'Closed Mondays' : 'Closed now';
      say = first.say + ' out at ' + clock(first.t) + ' ' + dayWord() + '.';
      more.push('Doors open at ' + clock(s.open) + (shelf.length ? ' with ' + listMore(shelf, 3) + ' on the shelf' : '') +
        (nextAtOpen ? ', and ' + nextAtOpen.short + ' at ' + clock(nextAtOpen.t) + '.' : '.'));
    } else {
      clk = state.planning
        ? (state.offset === 0 ? 'If you arrive at ' + clockAmPm(t) : 'Arriving ' + dayName + ', ' + clockAmPm(t))
        : dayName + ', ' + clockAmPm(t);
      if (t >= s.close) {
        say = "We're closed by then.";
        more.push('We close at ' + clock(s.close) + ' on ' + dayName + '.');
      } else if (next) {
        say = next.say + ' out at ' + clock(next.t) + '.';
        var wait = next.t - t;
        more.push(state.planning ? "That's " + span(wait) + ' after you arrive.' : "That's in " + span(wait) + '.');
        if (t < s.open) more.push('Doors open at ' + clock(s.open) + '.');
        if (shelf.length) more.push((t < s.open ? 'Already cooling: ' : 'On the shelf: ') + listMore(shelf, 3) + '.');
        if (t >= s.open && gone.length) more.push('Usually gone by then: ' + list(gone.slice(0, 2)) + '.');
      } else {
        say = "That's the last bake of the day.";
        if (shelf.length) more.push('Still on the shelf until ' + clock(s.close) + ': ' + listMore(shelf, 3) + '.');
        if (gone.length) more.push((state.planning ? 'Usually gone by then: ' : 'Usually gone by now: ') + list(gone.slice(0, 2)) + '.');
      }
    }
    titleEl.textContent = title;
    clockEl.textContent = clk;
    sayEl.textContent = say;
    moreEl.textContent = more.join(' ');
    handle.setAttribute('aria-valuenow', Math.round(Math.max(state.tMin, Math.min(state.tMax, t))));
    handle.setAttribute('aria-valuetext', state.planning ? 'Arriving at ' + clockAmPm(t) + (state.offset ? ' on ' + dayName : '') : state.offset ? 'Opening time, ' + clockAmPm(t) + ' on ' + dayName : 'Now, ' + clockAmPm(t));
  }

  function renderAll(t) { renderRows(t); placeNeedle(t); renderText(t); }

  function syncToClock(animate) {
    var d = now();
    var f = findDay(d);
    var dayChanged = f.day !== state.day || f.offset !== state.offset;
    state.day = f.day; state.offset = f.offset; state.sched = f.sched;
    if (dayChanged || !state.rows.length) { buildRows(); }
    state.nowT = f.t === null ? f.sched.open : f.t;
    if (state.planning) return;
    state.t = state.nowT;
    board.classList.remove('is-planning');
    resetBtn.hidden = true;
    if (animate && G && !reduce) sweep(state.t); else renderAll(state.t);
  }

  function sweep(target) {
    renderText(target);
    var proxy = { t: state.tMin };
    renderRows(proxy.t); placeNeedle(proxy.t);
    var dist = Math.max(0, Math.min(target, state.tMax) - state.tMin);
    G.to(proxy, {
      t: target, delay: 0.35, duration: Math.min(1.7, 0.7 + dist / 500), ease: 'power2.inOut',
      onUpdate: function () { renderRows(proxy.t); placeNeedle(proxy.t); tag.textContent = clock(proxy.t); },
      onComplete: function () { renderAll(target); }
    });
    G.from(needle.querySelector('.needle__handle'), { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2)', delay: 0.15 });
  }

  var announceTimer;
  function setPlan(t, announce) {
    t = Math.round(Math.max(state.tMin, Math.min(state.tMax, t)) / 5) * 5;
    state.planning = !(state.offset === 0 && Math.abs(t - state.nowT) < 3);
    if (state.planning) state.t = t; else state.t = state.nowT;
    board.classList.toggle('is-planning', state.planning);
    resetBtn.hidden = !state.planning;
    renderAll(state.t);
    if (announce) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () { liveEl.textContent = clockEl.textContent + '. ' + sayEl.textContent + ' ' + moreEl.textContent; }, 700);
    }
  }

  function initBoard() {
    if (!board) return;
    needle.hidden = false;
    syncToClock(true);

    // drag
    var dragging = false;
    function fromPointer(e) {
      var r = rail.getBoundingClientRect();
      setPlan(yToT(e.clientY - r.top), true);
    }
    handle.addEventListener('pointerdown', function (e) {
      dragging = true; handle.setPointerCapture(e.pointerId); e.preventDefault(); handle.focus({ preventScroll: true });
    });
    handle.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    function stop(e) { if (dragging) { dragging = false; try { handle.releasePointerCapture(e.pointerId); } catch (x) { /* ignore */ } } }
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);

    // keyboard
    handle.addEventListener('keydown', function (e) {
      var t = state.t, step = { ArrowDown: 5, ArrowRight: 5, ArrowUp: -5, ArrowLeft: -5, PageDown: 30, PageUp: -30 }[e.key];
      if (step) { setPlan(t + step, true); e.preventDefault(); }
      else if (e.key === 'Home') { setPlan(state.sched.open, true); e.preventDefault(); }
      else if (e.key === 'End') { setPlan(state.sched.close, true); e.preventDefault(); }
    });

    resetBtn.addEventListener('click', function () {
      state.planning = false; syncToClock(false); handle.focus(); liveEl.textContent = 'Back to the current time. ' + sayEl.textContent;
    });

    setInterval(function () { syncToClock(false); }, 20000);
    window.addEventListener('resize', function () { placeNeedle(state.t); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { placeNeedle(state.t); });
  }

  /* ---------- Hours: mark today ---------- */
  function markToday() {
    var d = String(now().getDay());
    document.querySelectorAll('.hours tr').forEach(function (tr) {
      if ((tr.getAttribute('data-days') || '').split(' ').indexOf(d) > -1) tr.classList.add('is-today');
    });
  }

  /* ---------- Custom cake builder ---------- */
  var SPONGE = { vanilla: ['Vanilla bean', '#EAD7A4'], chocolate: ['Chocolate rye', '#5B3A29'], carrot: ['Carrot cardamom', '#C58B4E'], lemon: ['Lemon poppyseed', '#EEDC8A'], honey: ['Honey spice', '#CFA064'] };
  var FILL = { raspberry: ['raspberry jam', '#A3354A'], lemon: ['lemon curd', '#E3BC34'], cream: ['cream cheese', '#F6F1E4'], caramel: ['salted caramel', '#B7722E'], ganache: ['dark chocolate ganache', '#3B2419'] };
  var FINISH = { naked: 'naked with seasonal fruit', buttercream: 'smooth buttercream', drip: 'chocolate drip', juniper: 'sugared juniper and rosemary' };
  var FINISH_LABEL = { naked: 'naked, fruit on top', buttercream: 'buttercream coat', drip: 'chocolate drip', juniper: 'sugared juniper' };
  var SIZE = { '6': ['6 in', 'serves 8 to 10', [280]], '8': ['8 in', 'serves 14 to 18', [360]], '10': ['10 in', 'serves 24 to 30', [440]], tier: ['6 and 9 in', 'serves 40 to 50', [400, 270]] };
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 250;

  function svgEl(name, attrs, parent) {
    var el = document.createElementNS(NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function initCake() {
    var form = document.getElementById('cake-form');
    if (!form) return;
    var layersG = document.getElementById('cake-layers');
    var decoG = document.getElementById('cake-deco');
    var labelsG = document.getElementById('cake-labels');
    var priceEl = document.getElementById('cake-price');
    var readyEl = document.getElementById('cake-ready');
    var sumEl = document.getElementById('cake-sum');
    var dateIn = document.getElementById('f-date');

    // element pool: two tiers, each = coat + 5 layers (sponge, filling, sponge, filling, sponge)
    var tiers = [0, 1].map(function () {
      var g = svgEl('g', {}, layersG);
      var coat = svgEl('rect', { x: CX, y: 346, width: 0, height: 0, rx: 3 }, g);
      var ls = [0, 1, 2, 3, 4].map(function () { return svgEl('rect', { x: CX, y: 346, width: 0, height: 0 }, g); });
      return { g: g, coat: coat, layers: ls };
    });
    var boardRect = svgEl('rect', { x: CX - 200, y: 346, width: 400, height: 6, fill: '#33241C' }, layersG);

    function read() {
      var v = {};
      ['size', 'sponge', 'filling', 'finish'].forEach(function (n) { var i = form.querySelector('input[name="' + n + '"]:checked'); v[n] = i; });
      return v;
    }

    var prevPrice = null;
    function update(animate) {
      var v = read();
      var size = v.size.value, sp = v.sponge.value, fi = v.filling.value, fn = v.finish.value;
      var widths = SIZE[size][2];
      var two = widths.length === 2;
      var c = fn === 'naked' ? 3 : 10;
      var sh = two ? 32 : 46, fh = two ? 9 : 12;
      var dur = animate && G && !reduce ? 0.45 : 0;
      var base = 346, labelTargets = [];

      tiers.forEach(function (tier, idx) {
        var on = idx < widths.length;
        var W = on ? widths[idx] : widths[0] * 0.6;
        var x = CX - W / 2;
        var y = base;
        var heights = [sh, fh, sh, fh, sh];
        var yTop = base - heights.reduce(function (a, b) { return a + b; }, 0);
        heights.forEach(function (h, li) {
          y -= h;
          var fill = li % 2 ? FILL[fi][1] : SPONGE[sp][1];
          var attrs = { x: x, y: on ? y : base, width: W, height: on ? h : 0 };
          if (dur) G.to(tier.layers[li], { attr: attrs, fill: fill, duration: dur, ease: 'power2.out' });
          else { for (var k in attrs) tier.layers[li].setAttribute(k, attrs[k]); tier.layers[li].style.fill = fill; }
          if (on && idx === widths.length - 1 && (li === 0 || li === 3)) labelTargets.push({ y: y + h / 2, x: x + W, kind: li % 2 ? 'fill' : 'sponge' });
        });
        var coatAttrs = { x: x - c, y: on ? yTop - c : base, width: W + 2 * c, height: on ? base - yTop + c : 0 };
        if (dur) G.to(tier.coat, { attr: coatAttrs, duration: dur, ease: 'power2.out' });
        else for (var k2 in coatAttrs) tier.coat.setAttribute(k2, coatAttrs[k2]);
        tier.coat.style.fill = '#F5F0E3';
        tier.coat.style.stroke = fn === 'naked' ? 'none' : 'rgba(51,36,28,.35)';
        tier.top = yTop - c; tier.x = x - c; tier.w = W + 2 * c; tier.on = on;
        if (on) base = yTop - c;
      });
      var bw = widths[0] + 2 * c + 24;
      if (dur) G.to(boardRect, { attr: { x: CX - bw / 2, width: bw }, duration: dur, ease: 'power2.out' });
      else { boardRect.setAttribute('x', CX - bw / 2); boardRect.setAttribute('width', bw); }

      drawDeco(fn, tiers, dur);
      drawLabels(labelTargets, sp, fi, fn, tiers[widths.length - 1]);
      drawDim(widths[0] + 2 * c, SIZE[size][0], dur);

      // price and dates
      var price = +v.size.dataset.price + (+(v.filling.dataset.price || 0)) + (+(v.finish.dataset.price || 0));
      if (prevPrice !== null && dur) {
        var o = { p: prevPrice };
        G.to(o, { p: price, duration: 0.4, ease: 'power1.out', onUpdate: function () { priceEl.textContent = '$' + Math.round(o.p); } });
      } else priceEl.textContent = '$' + price;
      prevPrice = price;

      var lead = two ? 14 : 3;
      var d = now(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + lead);
      if (d.getDay() === 1) d.setDate(d.getDate() + 1); // closed Mondays
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      dateIn.min = iso;
      readyEl.textContent = 'Earliest pickup: ' + DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '.';
      readyEl.dataset.min = iso;
      readyEl.dataset.minText = DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate();

      sumEl.textContent = cap(SIZE[size][0]) + ', ' + SIZE[size][1] + '. ' + SPONGE[sp][0] + ' sponge, ' + FILL[fi][0] + ', ' + FINISH[fn] + '.';
      form.dataset.summary = SIZE[size][0] + ' ' + SPONGE[sp][0].toLowerCase() + ' cake with ' + FILL[fi][0] + ', ' + FINISH[fn] + ' ($' + price + ')';
    }

    function drawDeco(fn, tiers, dur) {
      decoG.innerHTML = '';
      var top = tiers[1].on ? tiers[1] : tiers[0];
      if (fn === 'drip') {
        tiers.forEach(function (t) {
          if (!t.on) return;
          svgEl('rect', { x: t.x - 1, y: t.top - 4, width: t.w + 2, height: 12, rx: 4, fill: '#3B2419' }, decoG);
          [[0.03, 26], [0.15, 13], [0.29, 34], [0.44, 17], [0.58, 29], [0.73, 11], [0.86, 23], [0.97, 15]].forEach(function (d) {
            svgEl('rect', { x: t.x + d[0] * t.w - 5.5, y: t.top + 2, width: 11, height: d[1], rx: 5.5, fill: '#3B2419' }, decoG);
          });
        });
      } else if (fn === 'juniper') {
        var cx = top.x + top.w / 2, y = top.top;
        [[-70, 0], [-48, -4], [-30, 1], [26, -2], [44, 2], [62, -3], [0, -6]].forEach(function (p, i) {
          svgEl('circle', { cx: cx + p[0], cy: y - 8 + p[1], r: 7.5, fill: '#3D4A6E' }, decoG);
          svgEl('circle', { cx: cx + p[0] - 2.4, cy: y - 10.5 + p[1], r: 2.4, fill: '#A9B5D3' }, decoG);
        });
        [[-20, 1], [14, -1]].forEach(function (p) {
          var bx = cx + p[0];
          svgEl('path', { d: 'M' + (bx - 26) + ' ' + (y - 4) + ' Q ' + bx + ' ' + (y - 22) + ' ' + (bx + 26) + ' ' + (y - 8), stroke: '#4F6B4A', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, decoG);
          for (var k = -18; k <= 18; k += 9) svgEl('path', { d: 'M' + (bx + k) + ' ' + (y - 13 + Math.abs(k) / 3) + ' l -4 -8 M' + (bx + k) + ' ' + (y - 13 + Math.abs(k) / 3) + ' l 5 -7', stroke: '#4F6B4A', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, decoG);
        });
      } else if (fn === 'naked') {
        var cx2 = top.x + top.w / 2, y2 = top.top;
        [[-56, 0, 11], [-30, -3, 13], [-4, 0, 10], [22, -4, 13], [48, 0, 11]].forEach(function (p, i) {
          svgEl('path', { d: 'M' + (cx2 + p[0] - p[2]) + ' ' + (y2 + p[1]) + ' a ' + p[2] + ' ' + p[2] + ' 0 0 1 ' + (2 * p[2]) + ' 0 z', fill: i % 2 ? '#B3363F' : '#6B3552' }, decoG);
        });
        svgEl('path', { d: 'M' + (cx2 - 14) + ' ' + (y2 - 12) + ' q 8 -12 18 -6', stroke: '#4F6B4A', 'stroke-width': 2.5, fill: 'none', 'stroke-linecap': 'round' }, decoG);
      }
      if (dur && decoG.childNodes.length) G.from(decoG.childNodes, { opacity: 0, y: -8, duration: 0.3, stagger: 0.02, ease: 'power2.out' });
    }

    function drawLabels(targets, sp, fi, fn, topTier) {
      labelsG.innerHTML = '';
      var lx = 520;
      var items = [];
      targets.forEach(function (t) { items.push({ y: t.y, x: t.x, text: t.kind === 'fill' ? FILL[fi][0] : SPONGE[sp][0].toLowerCase() + ' sponge' }); });
      items.push({ y: topTier.top + 4, x: topTier.x + topTier.w - 2, text: FINISH_LABEL[fn] });
      items.sort(function (a, b) { return a.y - b.y; });
      // keep labels at least 26 units apart
      var ys = items.map(function (i) { return i.y; });
      for (var i = 1; i < ys.length; i++) if (ys[i] - ys[i - 1] < 30) ys[i] = ys[i - 1] + 30;
      items.forEach(function (it, i) {
        var ty = ys[i];
        svgEl('path', { d: 'M' + (it.x + 4) + ' ' + it.y + ' L ' + (lx - 20) + ' ' + ty + ' H ' + lx, stroke: '#33241C', 'stroke-width': 1.2, fill: 'none' }, labelsG);
        svgEl('circle', { cx: it.x + 4, cy: it.y, r: 2.5, fill: '#33241C' }, labelsG);
        var tx = svgEl('text', { x: lx + 8, y: ty + 5 }, labelsG);
        tx.textContent = it.text;
      });
    }

    function drawDim(w, label, dur) {
      var x1 = CX - w / 2, x2 = CX + w / 2;
      var set = function (id, a) { var el = document.getElementById(id); if (dur) G.to(el, { attr: a, duration: dur, ease: 'power2.out' }); else for (var k in a) el.setAttribute(k, a[k]); };
      set('dim-line', { x1: x1, x2: x2 });
      set('dim-l', { x1: x1, x2: x1 });
      set('dim-r', { x1: x2, x2: x2 });
      var text = document.getElementById('dim-text');
      text.textContent = label;
      var bgw = label.length * 11 + 24;
      var bg = document.getElementById('dim-bg');
      bg.setAttribute('x', CX - bgw / 2); bg.setAttribute('width', bgw);
    }

    var svg = document.getElementById('cake-svg');
    var narrow = window.matchMedia('(max-width: 600px)');
    function fitSvg() { svg.setAttribute('viewBox', narrow.matches ? '0 70 500 352' : '0 95 760 327'); labelsG.style.display = narrow.matches ? 'none' : ''; }
    fitSvg();
    if (narrow.addEventListener) narrow.addEventListener('change', fitSvg);

    form.addEventListener('change', function (e) { if (e.target.type === 'radio') update(true); });
    update(false);

    /* request form validation (demo only) */
    var fields = {
      name: { el: document.getElementById('f-name'), err: document.getElementById('e-name'), check: function (v) { return v.trim().length >= 2 ? '' : 'Enter your name.'; } },
      email: { el: document.getElementById('f-email'), err: document.getElementById('e-email'), check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Enter an email address, like name@example.com.'; } },
      date: { el: dateIn, err: document.getElementById('e-date'), check: function (v) {
        if (!v) return 'Pick a pickup date.';
        if (v < readyEl.dataset.min) return 'Pick ' + readyEl.dataset.minText + ' or later. This cake needs that much notice.';
        return new Date(v + 'T12:00:00').getDay() === 1 ? "We're closed on Mondays. Pick another day." : '';
      } }
    };
    function validate(key) {
      var f = fields[key], msg = f.check(f.el.value);
      f.err.textContent = msg;
      if (msg) f.el.setAttribute('aria-invalid', 'true'); else f.el.removeAttribute('aria-invalid');
      return !msg;
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('blur', function () { if (fields[k].el.value) validate(k); });
      fields[k].el.addEventListener('input', function () { if (fields[k].el.getAttribute('aria-invalid')) validate(k); });
    });
    var done = document.getElementById('cake-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      Object.keys(fields).forEach(function (k) { if (!validate(k) && !firstBad) firstBad = fields[k].el; });
      if (firstBad) { done.hidden = true; firstBad.focus(); return; }
      var d = new Date(dateIn.value + 'T12:00:00');
      done.textContent = 'Thanks, ' + fields.name.el.value.trim().split(' ')[0] + '. Your request for a ' + form.dataset.summary + ', to pick up ' + DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', is ready. This is a demo site, so nothing was sent and nobody will contact you.';
      done.hidden = false;
      done.focus();
    });
  }

  initBoard();
  markToday();
  initCake();
})();
