/* Ironwood Strength Co. - concept site. Demo only: nothing on this page sends data anywhere. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap || null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var debounce = function (fn, ms) {
    var t;
    var d = function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); };
    d.cancel = function () { clearTimeout(t); };
    return d;
  };

  /* ================= Mobile navigation ================= */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setNav(false); toggle.focus(); }
  });

  /* ================= Time helpers (Mountain Time) ================= */
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function mountainNow() {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', hourCycle: 'h23'
      }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (err) {
      var d = new Date();
      parts = { weekday: DAY_SHORT[d.getDay()], year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours(), minute: d.getMinutes() };
    }
    var h = Number(parts.hour) % 24;
    return {
      dow: DAY_SHORT.indexOf(parts.weekday),
      mins: h * 60 + Number(parts.minute),
      y: Number(parts.year), m: Number(parts.month), d: Number(parts.day)
    };
  }
  function toMins(hhmm) { var p = hhmm.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function fmtClock(mins) {
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    var ap = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  }
  function fmtWait(diff) {
    if (diff < 60) return diff + ' min';
    var h = Math.floor(diff / 60), m = diff % 60;
    return h + ' h' + (m ? ' ' + m + ' min' : '');
  }
  function dayWord(offset, dow) {
    if (offset === 0) return 'today';
    if (offset === 1) return 'tomorrow';
    return DAY_NAMES[dow];
  }

  /* ================= Class data ================= */
  var CLASSES = {
    fund: { name: 'Strength Fundamentals', chip: 'Fundamentals', mins: 60, beginner: true, book: true },
    pl: { name: 'Powerlifting Prep', chip: 'Powerlifting', mins: 75, beginner: false, book: true },
    oly: { name: 'Olympic Lifting Club', chip: 'Olympic lifting', mins: 75, beginner: false, book: true },
    cond: { name: 'Conditioning', chip: 'Conditioning', mins: 45, beginner: true, book: true },
    mob: { name: 'Mobility and Recovery', chip: 'Mobility', mins: 45, beginner: true, book: true },
    youth: { name: 'Youth Athletics', chip: 'Youth, 12 to 17', mins: 60, beginner: false, book: true },
    open: { name: 'Open gym', chip: 'Open gym', mins: 120, beginner: false, book: false }
  };
  var COLORS = { fund: '#277D43', pl: '#D0262D', oly: '#1F5BB0', cond: '#F1C232', mob: '#F2F2EF', youth: '#333B3E', open: '#A7AFB3' };
  // Index 0 = Sunday. [start, class, coach]
  var WEEK = [
    [['09:00', 'open', 'Miles']],
    [['05:30', 'fund', 'Dana'], ['06:30', 'cond', 'Miles'], ['09:00', 'mob', 'Sarah'], ['12:00', 'fund', 'Miles'], ['16:30', 'youth', 'Dana'], ['17:30', 'oly', 'Dana'], ['18:30', 'cond', 'Miles']],
    [['05:30', 'pl', 'Dana'], ['06:30', 'fund', 'Miles'], ['09:00', 'cond', 'Sarah'], ['12:00', 'cond', 'Miles'], ['17:30', 'fund', 'Dana'], ['18:30', 'mob', 'Sarah']],
    [['05:30', 'fund', 'Dana'], ['06:30', 'cond', 'Miles'], ['09:00', 'mob', 'Sarah'], ['12:00', 'fund', 'Miles'], ['16:30', 'youth', 'Dana'], ['17:30', 'oly', 'Dana'], ['18:30', 'pl', 'Miles']],
    [['05:30', 'pl', 'Dana'], ['06:30', 'fund', 'Miles'], ['09:00', 'cond', 'Sarah'], ['12:00', 'cond', 'Miles'], ['17:30', 'fund', 'Dana'], ['18:30', 'mob', 'Sarah']],
    [['05:30', 'fund', 'Dana'], ['06:30', 'cond', 'Miles'], ['09:00', 'mob', 'Sarah'], ['16:30', 'open', 'Miles'], ['17:30', 'cond', 'Dana']],
    [['08:00', 'fund', 'Dana'], ['09:00', 'cond', 'Miles'], ['10:00', 'oly', 'Dana']]
  ];
  var SESSIONS = [];
  WEEK.forEach(function (day, dow) {
    day.forEach(function (s) {
      SESSIONS.push({ dow: dow, time: s[0], start: toMins(s[0]), cls: s[1], coach: s[2], id: dow + '-' + s[0] });
    });
  });

  /* Next session from now, optionally filtered. Returns {s, offset, diff, live} or null. */
  function nextSession(filter) {
    var now = mountainNow();
    var live = null;
    for (var off = 0; off < 8; off++) {
      var dow = (now.dow + off) % 7;
      var list = SESSIONS.filter(function (s) { return s.dow === dow && (!filter || filter(s)); });
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        var diff = off * 1440 + s.start - now.mins;
        if (off === 0 && diff <= 0 && diff > -CLASSES[s.cls].mins && !live) live = s;
        if (diff > 0) return { s: s, offset: off, diff: diff, live: live };
      }
    }
    return null;
  }
  function describeNext(n) {
    var c = CLASSES[n.s.cls];
    return {
      html: '<strong>' + c.name + '</strong> with ' + n.s.coach + ', ' + dayWord(n.offset, n.s.dow) + ' at ' + fmtClock(n.s.start) +
        '. ' + (n.diff <= 24 * 60 ? '<span class="nowrap">Starts in <strong>' + fmtWait(n.diff) + '</strong>.</span>' : ''),
      color: COLORS[n.s.cls]
    };
  }

  /* ================= Hero: next class line ================= */
  var heroNext = $('#hero-next');
  function updateHeroNext() {
    var n = nextSession(function (s) { return CLASSES[s.cls].book; });
    if (!n) return;
    var d = describeNext(n);
    heroNext.innerHTML = '<span class="plate-sw" style="--c:' + d.color + '" aria-hidden="true"></span><span>Next class: ' + d.html + '</span>';
  }

  /* ================= Plate loader ================= */
  var NS = 'http://www.w3.org/2000/svg';
  var PLATES = {
    kg: [
      { w: 25, c: '#D0262D', d: 450, t: 46, ink: '#FFFFFF' },
      { w: 20, c: '#1F5BB0', d: 450, t: 40, ink: '#FFFFFF' },
      { w: 15, c: '#F1C232', d: 450, t: 34, ink: '#1C2325' },
      { w: 10, c: '#277D43', d: 450, t: 28, ink: '#FFFFFF' },
      { w: 5, c: '#F2F2EF', d: 230, t: 22, ink: '#1C2325' },
      { w: 2.5, c: '#D0262D', d: 190, t: 19, ink: '#FFFFFF' },
      { w: 2, c: '#1F5BB0', d: 175, t: 18, ink: '#FFFFFF' },
      { w: 1.5, c: '#F1C232', d: 160, t: 17, ink: '#1C2325' },
      { w: 1.25, c: '#A7AFB3', d: 160, t: 13, ink: '#1C2325' },
      { w: 1, c: '#277D43', d: 150, t: 14, ink: '#FFFFFF' },
      { w: 0.5, c: '#F2F2EF', d: 135, t: 12, ink: '#1C2325' }
    ],
    lb: [
      { w: 55, c: '#D0262D', d: 450, t: 46, ink: '#FFFFFF' },
      { w: 45, c: '#1F5BB0', d: 450, t: 42, ink: '#FFFFFF' },
      { w: 35, c: '#F1C232', d: 450, t: 34, ink: '#1C2325' },
      { w: 25, c: '#277D43', d: 450, t: 28, ink: '#FFFFFF' },
      { w: 10, c: '#F2F2EF', d: 450, t: 18, ink: '#1C2325' },
      { w: 5, c: '#A7AFB3', d: 230, t: 18, ink: '#1C2325' },
      { w: 2.5, c: '#A7AFB3', d: 190, t: 14, ink: '#1C2325' }
    ]
  };
  var BARS = { kg: { heavy: 20, light: 15 }, lb: { heavy: 45, light: 35 } };
  var SLEEVE = { heavy: 415, light: 320 };
  var COLLARS = {
    comp: { kg: 2.5, lb: 5.5, w: 46, d: 112 },
    clip: { kg: 0, lb: 0, w: 14, d: 76 }
  };
  var INNER_R = 1825, INNER_L = 455, FLOOR = 500;
  function entryR() { return INNER_R + SLEEVE[S.bar] + 50; }
  function entryL(t) { return INNER_L - SLEEVE[S.bar] - 50 - t; }
  var LIMITS = { kg: { max: 500, rangeMax: 300, step: 2.5, round: 5 }, lb: { max: 1100, rangeMax: 660, step: 5, round: 10 } };

  var svg = $('#bar-svg');
  var barG = $('#bar');
  var gR = $('#plates-r'), gL = $('#plates-l');
  var input = $('#target'), range = $('#target-range');
  // Size the readout to its value so "142.5" isn't clipped; the setter hook covers every place that sets .value.
  var valueProp = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  function fitInput() { input.style.width = (Math.max(3, input.value.length) + 0.4) + 'ch'; }
  Object.defineProperty(input, 'value', {
    get: function () { return valueProp.get.call(this); },
    set: function (v) { valueProp.set.call(this, v); fitInput(); }
  });
  input.addEventListener('input', fitInput);
  fitInput();
  var stepDown = $('#step-down'), stepUp = $('#step-up');
  var unitLabel = $('#unit-label'), targetLabel = $('#target-label'), readoutAlt = $('#readout-alt');
  var perSideList = $('#per-side-list'), loadNote = $('#load-note');
  var warmList = $('#warmup-list'), warmTitle = $('#warmup-title'), barStatus = $('#bar-status');

  var S = { unit: 'kg', bar: 'heavy', collar: 'comp', work: 100, total: null, started: false };
  var onBar = [];          // [{spec, r, l}] inner to outer
  var collarEls = null;    // {type, r, l}
  var tl = null;
  var readTween = { v: 100 };

  function el(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }
  function setX(node, x) { if (gsap) gsap.set(node, { x: x }); else node.setAttribute('transform', 'translate(' + x + ' 0)'); }
  function setY(node, y) { if (gsap) gsap.set(node, { y: y }); else node.setAttribute('transform', 'translate(0 ' + y + ')'); }
  function fmt(n) { return String(Math.round(n * 100) / 100); }
  function unitName() { return S.unit; }
  function collarWeight() { return COLLARS[S.collar][S.unit]; }
  function minLoad() { return BARS[S.unit][S.bar] + 2 * collarWeight(); }
  function stepSize() { return LIMITS[S.unit].step; }

  function makePlate(spec) {
    var g = el('g', { 'class': 'plate' });
    var h = spec.d, t = spec.t;
    g.appendChild(el('rect', { x: 0, y: -h / 2, width: t, height: h, rx: Math.min(6, t / 3), fill: spec.c }));
    g.appendChild(el('rect', { x: 0, y: -h / 2 + 3, width: 3, height: h - 6, fill: '#000', opacity: 0.16 }));
    g.appendChild(el('rect', { x: t - 3, y: -h / 2 + 3, width: 3, height: h - 6, fill: '#000', opacity: 0.16 }));
    g.appendChild(el('rect', { x: 4, y: -h / 2 + 10, width: Math.max(2, t - 8), height: h * 0.3, rx: 2, fill: '#FFFFFF', opacity: 0.13 }));
    g.appendChild(el('rect', { x: 0, y: -21, width: t, height: 42, fill: '#000', opacity: 0.12 }));
    if (t >= 20 && h >= 400) {
      var label = el('text', {
        x: t / 2, y: 0, fill: spec.ink, 'font-size': Math.min(26, t * 0.78),
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        transform: 'rotate(-90 ' + t / 2 + ' 0)'
      });
      label.textContent = fmt(spec.w);
      label.setAttribute('x', t / 2 + (h / 2 - 62));
      g.appendChild(label);
    }
    return g;
  }
  function makeCollar(type) {
    var c = COLLARS[type];
    var g = el('g', { 'class': 'collar' });
    if (type === 'comp') {
      g.appendChild(el('rect', { x: 0, y: -c.d / 2, width: c.w, height: c.d, rx: 7, fill: 'url(#steel)' }));
      g.appendChild(el('rect', { x: 8, y: -c.d / 2, width: 3, height: c.d, fill: '#000', opacity: 0.18 }));
      g.appendChild(el('rect', { x: c.w - 11, y: -c.d / 2, width: 3, height: c.d, fill: '#000', opacity: 0.18 }));
      g.appendChild(el('rect', { x: c.w / 2 - 6, y: -c.d / 2 - 44, width: 12, height: 48, rx: 5, fill: '#2B3437' }));
    } else {
      g.appendChild(el('rect', { x: 0, y: -c.d / 2, width: c.w, height: c.d, rx: 4, fill: '#9AA4A8' }));
      g.appendChild(el('path', { d: 'M3 ' + (-c.d / 2) + ' L-10 ' + (-c.d / 2 - 58) + ' M11 ' + (-c.d / 2) + ' L24 ' + (-c.d / 2 - 58), stroke: '#9AA4A8', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }));
    }
    return g;
  }

  /* Fewest plates that make the per-side weight exactly; otherwise the closest load below. */
  function solve(target) {
    var set = PLATES[S.unit], q = 4;
    var fixed = minLoad();
    var per = (target - fixed) / 2;
    if (per <= 0) return { plates: [], total: fixed, capped: false };
    var N = Math.floor(per * q + 1e-6);
    var wts = set.map(function (p) { return Math.round(p.w * q); });
    var dp = new Array(N + 1), from = new Array(N + 1);
    for (var i = 0; i <= N; i++) { dp[i] = Infinity; from[i] = -1; }
    dp[0] = 0;
    for (var v = 1; v <= N; v++) {
      for (var j = 0; j < wts.length; j++) {
        var w = wts[j];
        if (w <= v && dp[v - w] + 1 < dp[v]) { dp[v] = dp[v - w] + 1; from[v] = j; }
      }
    }
    var cap = SLEEVE[S.bar] - COLLARS[S.collar].w;
    var capped = false;
    for (var x = N; x >= 0; x--) {
      if (!isFinite(dp[x])) continue;
      var plates = [], r = x;
      while (r > 0) { plates.push(set[from[r]]); r -= wts[from[r]]; }
      plates.sort(function (a, b) { return b.w - a.w; });
      var thick = plates.reduce(function (s, p) { return s + p.t; }, 0);
      if (thick <= cap) return { plates: plates, total: fixed + 2 * x / q, capped: capped };
      capped = true;
    }
    return { plates: [], total: fixed, capped: true };
  }

  function restY(plates) {
    var r = Math.max(38, COLLARS[S.collar].d / 2);
    plates.forEach(function (p) { r = Math.max(r, p.d / 2); });
    return FLOOR - r;
  }

  function setSleeves() {
    var len = SLEEVE[S.bar];
    $('#sleeve-r').setAttribute('width', len);
    $('#sleeve-l').setAttribute('x', INNER_L - len);
    $('#sleeve-l').setAttribute('width', len);
    $('#center-knurl').style.display = S.bar === 'heavy' ? '' : 'none';
    var mid = len / 2 + 20;
    $('#shadow-r').setAttribute('cx', INNER_R + mid);
    $('#shadow-l').setAttribute('cx', INNER_L - mid);
  }

  /* Put the new plate list on the bar. Plates that stay don't move. */
  function render(plates, opts) {
    opts = opts || {};
    var animate = !!gsap && !reduceMotion && !opts.instant;
    if (tl) { var prev = tl; tl = null; prev.progress(1); prev.kill(); }

    var k = 0;
    if (!opts.full) {
      while (k < onBar.length && k < plates.length && onBar[k].spec === plates[k]) k++;
    }
    var removing = onBar.slice(k), keep = onBar.slice(0, k), adding = plates.slice(k);
    var collarChanges = !collarEls || collarEls.type !== S.collar || removing.length || adding.length || opts.full;
    var oldCollar = collarChanges ? collarEls : null;
    var newCollar = collarChanges ? { type: S.collar, r: makeCollar(S.collar), l: makeCollar(S.collar) } : collarEls;
    var addEls = adding.map(function (spec) { return { spec: spec, r: makePlate(spec), l: makePlate(spec) }; });
    var all = keep.concat(addEls);
    var posR = [], posL = [], acc = 0;
    all.forEach(function (e) { posR.push(INNER_R + acc); acc += e.spec.t; posL.push(INNER_L - acc); });
    var cw = COLLARS[S.collar].w;
    var colR = INNER_R + acc, colL = INNER_L - acc - cw;
    var y = restY(plates);
    var big = plates.some(function (p) { return p.d >= 400; });
    var shadows = [$('#shadow-l'), $('#shadow-r')];

    onBar = all;
    collarEls = newCollar;

    if (!animate) {
      removing.forEach(function (e) { e.r.remove(); e.l.remove(); });
      if (oldCollar) { oldCollar.r.remove(); oldCollar.l.remove(); }
      if (opts.beforeAdd) opts.beforeAdd();
      addEls.forEach(function (e, i) {
        gR.appendChild(e.r); gL.appendChild(e.l);
        setX(e.r, posR[k + i]); setX(e.l, posL[k + i]);
      });
      if (collarChanges) {
        gR.appendChild(newCollar.r); gL.appendChild(newCollar.l);
        setX(newCollar.r, colR); setX(newCollar.l, colL);
      }
      setY(barG, y);
      shadows.forEach(function (s) { s.setAttribute('opacity', big ? 0.55 : 0); });
      return;
    }

    tl = gsap.timeline({ onComplete: function () { tl = null; } });
    var t = 0;
    if (oldCollar) {
      var ocw = COLLARS[oldCollar.type].w;
      tl.to(oldCollar.r, { x: entryR(), duration: 0.2, ease: 'power2.in' }, 0);
      tl.to(oldCollar.l, { x: entryL(ocw), duration: 0.2, ease: 'power2.in' }, 0);
      tl.to([oldCollar.r, oldCollar.l], { opacity: 0, duration: 0.08 }, 0.12);
      tl.add(function () { oldCollar.r.remove(); oldCollar.l.remove(); }, 0.2);
      t = 0.14;
    }
    // Outermost plate comes off first.
    removing.slice().reverse().forEach(function (e, j) {
      var at = t + j * 0.06;
      tl.to(e.r, { x: entryR(), duration: 0.26, ease: 'power2.in' }, at);
      tl.to(e.l, { x: entryL(e.spec.t), duration: 0.26, ease: 'power2.in' }, at);
      tl.to([e.r, e.l], { opacity: 0, duration: 0.1 }, at + 0.16);
    });
    if (removing.length) {
      t += (removing.length - 1) * 0.06 + 0.26;
      tl.add(function () { removing.forEach(function (e) { e.r.remove(); e.l.remove(); }); }, t);
    }
    if (opts.beforeAdd) tl.add(opts.beforeAdd, t);
    // The bar rests on its largest disc: it rises or drops before the new plates go on.
    if (Math.abs(Number(gsap.getProperty(barG, 'y')) - y) > 0.5) {
      tl.to(barG, { y: y, duration: 0.34, ease: 'power2.inOut' }, t);
      tl.to(shadows, { attr: { opacity: big ? 0.55 : 0 }, duration: 0.25 }, t);
      t += 0.3;
    }
    // Heaviest plate goes on first, mirrored on both sleeves.
    var lastStart = t;
    addEls.forEach(function (e, i) {
      gsap.set(e.r, { x: entryR(), opacity: 0 });
      gsap.set(e.l, { x: entryL(e.spec.t), opacity: 0 });
      gR.appendChild(e.r); gL.appendChild(e.l);
      var at = t + i * 0.1;
      lastStart = at;
      tl.to(e.r, { x: posR[k + i], duration: 0.48, ease: 'power3.out' }, at);
      tl.to(e.l, { x: posL[k + i], duration: 0.48, ease: 'power3.out' }, at);
      tl.to([e.r, e.l], { opacity: 1, duration: 0.12, ease: 'none' }, at);
    });
    if (collarChanges) {
      var cAt = addEls.length ? lastStart + 0.26 : t;
      gsap.set(newCollar.r, { x: entryR(), opacity: 0 });
      gsap.set(newCollar.l, { x: entryL(cw), opacity: 0 });
      gR.appendChild(newCollar.r); gL.appendChild(newCollar.l);
      tl.to(newCollar.r, { x: colR, duration: 0.34, ease: 'power3.out' }, cAt);
      tl.to(newCollar.l, { x: colL, duration: 0.34, ease: 'power3.out' }, cAt);
      tl.to([newCollar.r, newCollar.l], { opacity: 1, duration: 0.1, ease: 'none' }, cAt);
    }
  }

  function groupPlates(plates) {
    var groups = [];
    plates.forEach(function (p) {
      var last = groups[groups.length - 1];
      if (last && last.spec === p) last.n++; else groups.push({ spec: p, n: 1 });
    });
    return groups;
  }
  function collarText() {
    return S.collar === 'comp' ? 'collar, ' + fmt(collarWeight()) + ' ' + S.unit : 'spring clip';
  }
  function renderList(res) {
    var groups = groupPlates(res.plates);
    var html = groups.map(function (g) {
      return '<li><span class="plate-sw" style="--c:' + g.spec.c + '" aria-hidden="true"></span>' + fmt(g.spec.w) + ' ' + S.unit +
        (g.n > 1 ? ' <span class="times">&times; ' + g.n + '</span>' : '') + '</li>';
    }).join('');
    if (!groups.length) html = '<li>No plates, just the bar</li>';
    html += '<li class="collar-item">Then the ' + collarText() + '</li>';
    perSideList.innerHTML = html;
  }
  function renderNote(res, target) {
    var msg = '';
    var u = S.unit;
    if (target < minLoad() - 0.001) {
      msg = 'The lightest load is the empty bar' + (S.collar === 'comp' ? ' with collars' : '') + ': ' + fmt(res.total) + ' ' + u + '.';
    } else if (target > LIMITS[u].max) {
      msg = 'This tool stops at ' + LIMITS[u].max + ' ' + u + '.' + (res.capped ? ' The sleeves are full at ' + fmt(res.total) + ' ' + u + '.' : '');
    } else if (res.capped) {
      msg = 'That is all that fits on these sleeves: ' + fmt(res.total) + ' ' + u + '.';
    } else if (Math.abs(res.total - target) > 0.001) {
      msg = fmt(target) + ' ' + u + " can't be made with these plates. Closest below: " + fmt(res.total) + ' ' + u + '.';
    }
    loadNote.textContent = msg;
  }
  function warmupSteps(work) {
    var lim = LIMITS[S.unit];
    var base = minLoad();
    var steps = [base];
    [0.4, 0.6, 0.75, 0.85].forEach(function (p) {
      var v = Math.round((work * p) / lim.round) * lim.round;
      if (v >= steps[steps.length - 1] + lim.round && v <= work - lim.round) steps.push(v);
    });
    if (work > base + 0.001) steps.push(work);
    return steps;
  }
  function renderWarmups() {
    var work = solve(S.work).total;
    warmTitle.textContent = 'Warm-up jumps to ' + fmt(work) + ' ' + S.unit;
    var steps = warmupSteps(work);
    warmList.innerHTML = '';
    steps.forEach(function (v, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.value = v;
      var isWork = i === steps.length - 1 && steps.length > 1;
      b.className = isWork ? 'work' : '';
      b.textContent = i === 0 ? 'Bar' : fmt(v);
      b.setAttribute('aria-label', (i === 0 ? 'Empty bar, ' : '') + fmt(v) + ' ' + S.unit + (isWork ? ', work set' : ''));
      b.setAttribute('aria-pressed', String(Math.abs(v - S.total) < 0.001));
      warmList.appendChild(b);
    });
  }
  function syncWarmPressed() {
    $$('button', warmList).forEach(function (b) {
      b.setAttribute('aria-pressed', String(Math.abs(Number(b.dataset.value) - S.total) < 0.001));
    });
  }
  var announce = debounce(function (res) {
    var groups = groupPlates(res.plates).map(function (g) { return fmt(g.spec.w) + (g.n > 1 ? ' times ' + g.n : ''); });
    barStatus.textContent = fmt(res.total) + ' ' + S.unit + ' on the bar. Each side: ' +
      (groups.length ? groups.join(', ') : 'no plates') + ', then the ' + collarText() + '.';
  }, 600);

  function showReadout(total, source) {
    var lim = LIMITS[S.unit];
    range.value = Math.min(total, lim.rangeMax);
    readoutAlt.textContent = S.unit === 'kg'
      ? 'About ' + Math.round(total * 2.20462) + ' lb'
      : 'About ' + (Math.round((total / 2.20462) * 2) / 2) + ' kg';
    if (source === 'type') return;
    if (gsap && !reduceMotion && source !== 'range') {
      gsap.killTweensOf(readTween);
      readTween.v = Number(input.value) || total;
      gsap.to(readTween, {
        v: total, duration: 0.6, ease: 'power2.out',
        onUpdate: function () { input.value = Math.abs(readTween.v - total) < 0.3 ? fmt(total) : String(Math.round(readTween.v)); },
        onComplete: function () { input.value = fmt(total); }
      });
    } else {
      input.value = fmt(total);
    }
  }

  function load(target, opts) {
    opts = opts || {};
    var lim = LIMITS[S.unit];
    var clamped = Math.min(Math.max(target, 0), lim.max);
    var res = solve(clamped);
    S.total = res.total;
    render(res.plates, opts);
    showReadout(res.total, opts.source);
    renderList(res);
    renderNote(res, target);
    if (opts.source === 'warm') syncWarmPressed(); else renderWarmups();
    announce(res);
  }

  function updateUnitLabels() {
    var u = S.unit, lim = LIMITS[u];
    unitLabel.textContent = u;
    targetLabel.textContent = 'Target weight in ' + (u === 'kg' ? 'kilograms' : 'pounds');
    stepDown.setAttribute('aria-label', 'Take off ' + lim.step + ' ' + u);
    stepUp.setAttribute('aria-label', 'Add ' + lim.step + ' ' + u);
    input.step = lim.step; input.max = lim.max; input.min = minLoad();
    range.step = lim.step; range.max = lim.rangeMax; range.min = minLoad();
    $('#bar-heavy-label').textContent = BARS[u].heavy + ' ' + u;
    $('#bar-light-label').textContent = BARS[u].light + ' ' + u;
    $('#collar-comp-label').textContent = 'Competition, ' + fmt(COLLARS.comp[u]) + ' ' + u + ' each';
  }

  function initLoader() {
    setSleeves();
    updateUnitLabels();
    render([], { instant: true });
    var intro = function () {
      if (S.started) return;
      S.started = true;
      if (gsap && !reduceMotion) { input.value = fmt(minLoad()); readTween.v = minLoad(); }
      setTimeout(function () { load(S.work, { source: 'intro' }); }, reduceMotion ? 0 : 300);
    };
    // Show the resulting text right away, even before the bar animates.
    var res = solve(S.work);
    S.total = res.total;
    renderList(res); renderWarmups(); showReadout(res.total, 'type');
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { intro(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe($('.bar-stage'));
    } else {
      intro();
    }

    stepDown.addEventListener('click', function () { stepBy(-1); });
    stepUp.addEventListener('click', function () { stepBy(1); });
    function stepBy(dir) {
      var st = stepSize();
      var cur = Number(input.value);
      if (!isFinite(cur)) cur = S.total;
      var next = Math.round((cur + dir * st) / st) * st;
      if (dir < 0 && next >= cur) next = cur - st;
      next = Math.max(minLoad(), Math.min(LIMITS[S.unit].max, next));
      S.work = next;
      load(next, { source: 'step' });
    }
    var typed = debounce(function () {
      var v = parseFloat(input.value);
      if (!isFinite(v) || v <= 0) return;
      S.work = v;
      load(v, { source: 'type' });
    }, 450);
    input.addEventListener('input', function () { gsap && gsap.killTweensOf(readTween); typed(); });
    input.addEventListener('change', function () {
      typed.cancel();
      var v = parseFloat(input.value);
      if (!isFinite(v) || v <= 0) { input.value = fmt(S.total); return; }
      S.work = v;
      load(v, { source: 'commit' });
    });
    input.addEventListener('focus', function () {
      if (gsap) { gsap.killTweensOf(readTween); input.value = fmt(S.total); }
      input.select();
    });

    var ranged = debounce(function () {
      var v = Number(range.value);
      S.work = v;
      load(v, { source: 'range' });
    }, 140);
    range.addEventListener('input', function () { input.value = range.value; ranged(); });
    range.addEventListener('change', function () { ranged.cancel(); S.work = Number(range.value); load(S.work, { source: 'range' }); });

    warmList.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      load(Number(b.dataset.value), { source: 'warm' });
    });

    $$('input[name="unit"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var to = r.value;
        if (to === S.unit) return;
        var lim = LIMITS[to];
        S.work = to === 'lb'
          ? Math.round((S.work * 2.20462) / lim.step) * lim.step
          : Math.round((S.work / 2.20462) / lim.step) * lim.step;
        S.unit = to;
        if (to === 'lb' && S.collar === 'comp') {
          S.collar = 'clip';
          $('#collar-clip').checked = true;
        }
        updateUnitLabels();
        load(S.work, { source: 'unit', full: true });
      });
    });
    $$('input[name="bar"]').forEach(function (r) {
      r.addEventListener('change', function () {
        S.bar = r.value;
        updateUnitLabels();
        load(S.work, { source: 'bar', full: true, beforeAdd: setSleeves });
      });
    });
    $$('input[name="collar"]').forEach(function (r) {
      r.addEventListener('change', function () {
        S.collar = r.value;
        updateUnitLabels();
        load(S.work, { source: 'collar' });
      });
    });

    fitStage();
    var fitQueued = false;
    window.addEventListener('resize', function () {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(function () { fitQueued = false; fitStage(); });
    });
  }

  /* Desktop: the whole bar at a fixed size, floor running edge to edge. Narrow screens: zoom to one sleeve. */
  function fitStage() {
    var w = svg.clientWidth || svg.parentNode.clientWidth;
    var Y0 = 30, H = 530, vbX, vbW;
    var zoomed = w < 720;
    if (zoomed) {
      vbW = 700; vbX = 1590;
    } else {
      var gutter = Math.min(40, Math.max(16, w * 0.04));
      var barPx = Math.min(1200, w - 2 * gutter);
      var scale = barPx / 2280;
      vbW = w / scale;
      vbX = 1140 - vbW / 2;
    }
    svg.setAttribute('viewBox', vbX.toFixed(1) + ' ' + Y0 + ' ' + vbW.toFixed(1) + ' ' + H);
    svg.classList.toggle('is-zoomed', zoomed);
    $$('.floor-fill', svg).forEach(function (r) { r.setAttribute('x', vbX.toFixed(1)); r.setAttribute('width', vbW.toFixed(1)); });
    var wx = Math.max(640, vbX), ww = 1640 - wx;
    $('#wood').setAttribute('x', wx); $('#wood').setAttribute('width', Math.max(0, ww));
    $('#wood-grain').setAttribute('d', ww > 0 ? 'M' + wx + ' 514h' + ww + 'M' + wx + ' 529h' + ww + 'M' + wx + ' 544h' + ww : '');
  }

  /* ================= Schedule ================= */
  var F = { classes: [], tod: 'all', beginner: false };
  var chipsWrap = $('#class-chips');
  var weekEl = $('#week');
  var tabsEl = $('#day-tabs');
  var filterCount = $('#filter-count');
  var scheduleNext = $('#schedule-next');
  var ORDER = [1, 2, 3, 4, 5, 6, 0];
  var activeDay = mountainNow().dow;

  function todOf(s) { return s.start < 9 * 60 ? 'early' : (s.start < 16 * 60 ? 'mid' : 'late'); }
  function matches(s) {
    if (F.classes.length && F.classes.indexOf(s.cls) === -1) return false;
    if (F.tod !== 'all' && todOf(s) !== F.tod) return false;
    if (F.beginner && !CLASSES[s.cls].beginner) return false;
    return true;
  }
  function filtersActive() { return F.classes.length || F.tod !== 'all' || F.beginner; }

  function buildChips() {
    Object.keys(CLASSES).forEach(function (key) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.cls = key;
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="plate-sw" aria-hidden="true"></span>' + CLASSES[key].chip;
      chipsWrap.appendChild(b);
    });
    chipsWrap.addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var key = b.dataset.cls, i = F.classes.indexOf(key);
      if (i === -1) F.classes.push(key); else F.classes.splice(i, 1);
      b.setAttribute('aria-pressed', String(i === -1));
      renderWeek();
    });
    $$('input[name="tod"]').forEach(function (r) {
      r.addEventListener('change', function () { F.tod = r.value; renderWeek(); });
    });
    $('#beginner-only').addEventListener('change', function (e) { F.beginner = e.target.checked; renderWeek(); });
  }
  function clearFilters() {
    F.classes = []; F.tod = 'all'; F.beginner = false;
    $$('.chip', chipsWrap).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
    $('input[name="tod"][value="all"]').checked = true;
    $('#beginner-only').checked = false;
    renderWeek();
  }

  function weekDates() {
    var now = mountainNow();
    var base = Date.UTC(now.y, now.m - 1, now.d);
    var monOffset = (now.dow + 6) % 7;
    var out = {};
    ORDER.forEach(function (dow, i) {
      var dt = new Date(base + (i - monOffset) * 86400000);
      out[dow] = dt.getUTCDate();
    });
    return out;
  }

  function renderTabs() {
    var dates = weekDates();
    var now = mountainNow();
    tabsEl.innerHTML = '';
    ORDER.forEach(function (dow) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.dow = dow;
      b.setAttribute('aria-pressed', String(dow === activeDay));
      b.setAttribute('aria-controls', 'day-' + dow);
      b.setAttribute('aria-label', DAY_NAMES[dow] + (dow === now.dow ? ', today' : ''));
      b.innerHTML = DAY_SHORT[dow] + '<small>' + (dow === now.dow ? 'Today' : dates[dow]) + '</small>';
      tabsEl.appendChild(b);
    });
  }
  tabsEl.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    activeDay = Number(b.dataset.dow);
    $$('button', tabsEl).forEach(function (t) { t.setAttribute('aria-pressed', String(t === b)); });
    $$('.day', weekEl).forEach(function (d) { d.classList.toggle('is-active', Number(d.dataset.dow) === activeDay); });
  });

  function renderWeek() {
    var now = mountainNow();
    var dates = weekDates();
    var shown = 0, total = 0;
    var html = ORDER.map(function (dow) {
      var list = SESSIONS.filter(function (s) { return s.dow === dow; });
      total += list.length;
      var visible = list.filter(matches);
      shown += visible.length;
      var isToday = dow === now.dow;
      var items = visible.map(function (s) {
        var c = CLASSES[s.cls];
        var done = isToday && s.start + c.mins <= now.mins;
        var live = isToday && s.start <= now.mins && s.start + c.mins > now.mins;
        var flag = live ? '<span class="s-flag is-live">On now</span>' : (done ? '<span class="s-flag">Finished</span>' : '');
        var inner = '<span class="s-time">' + fmtClock(s.start) + flag + '</span><span class="s-name">' + c.name + '</span>' +
          '<span class="s-coach">' + (c.book ? 'with ' + s.coach : 'All-access members') + '</span>';
        if (!c.book) return '<div class="session is-members" data-cls="' + s.cls + '">' + inner + '</div>';
        return '<button type="button" class="session' + (done ? ' is-done' : '') + '" data-cls="' + s.cls + '" data-id="' + s.id + '"' +
          ' aria-label="' + DAY_NAMES[dow] + ' ' + fmtClock(s.start) + ', ' + c.name + ' with ' + s.coach + (done ? ', finished' : '') + '. Book as your free class.">' +
          inner + '</button>';
      }).join('');
      if (!items) items = '<p class="empty-day">' + (list.length ? 'Nothing matches your filters.' : 'No classes.') + '</p>';
      return '<div class="day' + (isToday ? ' today' : '') + (dow === activeDay ? ' is-active' : '') + '" id="day-' + dow + '" data-dow="' + dow + '">' +
        '<div class="day-head"><h3>' + DAY_SHORT[dow] + '</h3><span class="day-date">' + (isToday ? 'Today' : dates[dow]) + '</span></div>' +
        '<div class="sessions">' + items + '</div></div>';
    }).join('');
    weekEl.innerHTML = html;
    filterCount.innerHTML = filtersActive()
      ? 'Showing ' + shown + ' of ' + total + ' classes this week.<button type="button" id="clear-filters">Clear filters</button>'
      : total + ' classes this week.';
    var clear = $('#clear-filters');
    if (clear) clear.addEventListener('click', clearFilters);
    updateScheduleNext();
  }
  weekEl.addEventListener('click', function (e) {
    var b = e.target.closest('button.session');
    if (!b) return;
    var s = SESSIONS.filter(function (x) { return x.id === b.dataset.id; })[0];
    if (s) prefillForm(s);
  });

  function updateScheduleNext() {
    var n = nextSession(function (s) { return matches(s) && CLASSES[s.cls].book; });
    if (!n) {
      scheduleNext.innerHTML = '<span>No upcoming classes match these filters.</span>';
      return;
    }
    var d = describeNext(n);
    scheduleNext.innerHTML = '<span class="plate-sw" style="--c:' + d.color + '" aria-hidden="true"></span><span>Next up: ' + d.html + '</span>';
  }

  /* ================= Free class form ================= */
  var form = $('#trial-form');
  var fClass = $('#f-class'), fSession = $('#f-session');
  var summary = $('#error-summary'), errList = $('#error-list'), done = $('#form-done');
  var attempted = false;

  function upcomingFor(cls) {
    var now = mountainNow();
    var out = [];
    for (var off = 0; off < 8 && out.length < 8; off++) {
      var dow = (now.dow + off) % 7;
      SESSIONS.forEach(function (s) {
        if (s.dow !== dow || s.cls !== cls) return;
        if (off === 0 && s.start - now.mins < 30) return;
        out.push({ s: s, off: off, label: capital(dayWord(off, dow)) + ', ' + fmtClock(s.start) + ' with ' + s.coach });
      });
    }
    return out;
  }
  function capital(w) { return w.charAt(0).toUpperCase() + w.slice(1); }
  function fillClassOptions() {
    fClass.innerHTML = Object.keys(CLASSES).filter(function (k) { return CLASSES[k].book; }).map(function (k) {
      return '<option value="' + k + '">' + CLASSES[k].name + '</option>';
    }).join('');
  }
  function fillSessions(selectId) {
    var list = upcomingFor(fClass.value);
    fSession.innerHTML = '<option value="">Choose a time</option>' + list.map(function (o) {
      return '<option value="' + o.s.id + '|' + o.off + '">' + o.label + '</option>';
    }).join('');
    if (selectId) {
      var match = list.filter(function (o) { return o.s.id === selectId; })[0];
      if (match) fSession.value = match.s.id + '|' + match.off;
    } else if (list.length) {
      fSession.selectedIndex = 1;
    }
  }
  fClass.addEventListener('change', function () { fillSessions(); if (attempted) validate(); });

  function prefillForm(s) {
    fClass.value = s.cls;
    fillSessions(s.id);
    var note = $('.prefill-note', form);
    if (!note) {
      note = document.createElement('p');
      note.className = 'prefill-note';
      form.querySelector('h3').insertAdjacentElement('afterend', note);
    }
    note.textContent = 'Picked from the schedule: ' + CLASSES[s.cls].name + ', ' + DAY_NAMES[s.dow] + ' at ' + fmtClock(s.start) + '.';
    $('#free-class').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { $('#f-name').focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
  }

  var CHECKS = [
    { id: 'f-name', test: function (v) { return v.trim().length >= 2; }, msg: 'Enter your name.' },
    { id: 'f-email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Enter an email address like name@example.com.' },
    { id: 'f-phone', test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Enter a phone number with area code, like 970 555 0100.' },
    { id: 'f-session', test: function (v) { return !!v; }, msg: 'Choose a day and time for your class.' }
  ];
  function setFieldError(c, bad) {
    var field = $('#' + c.id);
    var err = $('#' + c.id + '-err');
    field.setAttribute('aria-invalid', String(bad));
    err.textContent = bad ? c.msg : '';
  }
  function validate() {
    var bad = [];
    CHECKS.forEach(function (c) {
      var isBad = !c.test($('#' + c.id).value);
      setFieldError(c, isBad);
      if (isBad) bad.push(c);
    });
    return bad;
  }
  var submitBtn = form.querySelector('button[type="submit"]');
  CHECKS.forEach(function (c) {
    var field = $('#' + c.id);
    // Clear an error as soon as the entry is fixed (while typing, so nothing jumps under the pointer).
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', function () {
      if (field.getAttribute('aria-invalid') === 'true' && c.test(field.value)) setFieldError(c, false);
    });
    // Point out a problem when leaving a field, unless the visitor is heading for the submit button.
    field.addEventListener('blur', function (e) {
      if (e.relatedTarget === submitBtn) return;
      var v = field.value;
      if ((attempted || v) && !c.test(v)) setFieldError(c, true);
    });
  });
  errList.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    $(a.getAttribute('href')).focus();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    attempted = true;
    var bad = validate();
    if (bad.length) {
      errList.innerHTML = bad.map(function (c) { return '<li><a href="#' + c.id + '">' + c.msg + '</a></li>'; }).join('');
      summary.hidden = false;
      done.hidden = true;
      summary.focus();
      return;
    }
    summary.hidden = true;
    var opt = fSession.options[fSession.selectedIndex];
    var first = $('#f-name').value.trim().split(/\s+/)[0];
    done.innerHTML = '<strong>Free class booked (demo)</strong>' +
      'Thanks, ' + escapeHtml(first) + '. ' + CLASSES[fClass.value].name + ', ' + escapeHtml(opt.textContent) + '. ' +
      'This is a demo site, so nothing was sent and no spot was held.';
    done.hidden = false;
    done.focus();
    ['f-name', 'f-email', 'f-phone'].forEach(function (id) { $('#' + id).value = ''; $('#' + id).setAttribute('aria-invalid', 'false'); });
    attempted = false;
  });
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }

  /* ================= Visit: open now ================= */
  var HOURS = { 0: [9 * 60, 11 * 60], 1: [300, 1200], 2: [300, 1200], 3: [300, 1200], 4: [300, 1200], 5: [300, 1200], 6: [420, 780] };
  function updateOpenStatus() {
    var el2 = $('#open-status');
    var now = mountainNow();
    var today = HOURS[now.dow];
    var text, open = false;
    if (now.mins >= today[0] && now.mins < today[1]) {
      open = true;
      text = 'Open now until ' + fmtClock(today[1]) + (now.dow === 0 ? ' (open gym)' : '') + '.';
    } else {
      for (var off = 0; off < 8; off++) {
        var dow = (now.dow + off) % 7;
        var h = HOURS[dow];
        if (off === 0 && now.mins >= h[0]) continue;
        text = 'Closed now. Opens ' + dayWord(off, dow) + ' at ' + fmtClock(h[0]) + '.';
        break;
      }
    }
    el2.className = 'open-status ' + (open ? 'is-open' : 'is-closed');
    el2.innerHTML = '<span class="dot" aria-hidden="true"></span>' + text;
    var rows = $$('.hours tbody tr');
    rows.forEach(function (r) { r.classList.remove('is-today'); });
    var idx = now.dow === 0 ? 2 : (now.dow === 6 ? 1 : 0);
    if (rows[idx]) rows[idx].classList.add('is-today');
  }

  /* ================= Boot ================= */
  initLoader();
  buildChips();
  renderTabs();
  renderWeek();
  fillClassOptions();
  fillSessions();
  updateHeroNext();
  updateOpenStatus();
  setInterval(function () {
    updateHeroNext();
    if (!weekEl.contains(document.activeElement)) renderWeek(); else updateScheduleNext();
    updateOpenStatus();
  }, 60000);
})();
