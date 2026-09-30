// Portfolio hub v3: a pocket Trigonix board, the live sample-site viewer and the "what would your site do?" picker.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const $ = (sel, root = document) => root.querySelector(sel);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* =====================================================================
     1. Trigonix board
     4 x 2 cells, each cut into 4 triangles (top, right, bottom, left).
     Every pin turns the triangles touching it a quarter turn clockwise:
     a pin in a cell turns that cell's 4, a pin on a corner turns the 8 around it.
     The board is two 2 x 2 squares; it's solved when each square is one color.
     ===================================================================== */
  const board = $('#board');
  if (board) {
    const SVGNS = 'http://www.w3.org/2000/svg';
    const W = 4, H = 2, S = 100, PAD = 8;
    const T = 0, R = 1, B = 2, L = 3;
    const COLORS = { red: '#E5392C', blue: '#3452E4', green: '#1FA64E', yellow: '#FFCC3D', magenta: '#D43A9B', cyan: '#1CB4D4' };
    const LEVELS = [
      { colors: ['red', 'blue'], scramble: ['k21'] },
      { colors: ['green', 'red'], scramble: ['k21', 'c10'] },
      { colors: ['blue', 'yellow'], scramble: ['k21', 'k31', 'c21'] },
    ];
    const idx = (c, r, k) => (r * W + c) * 4 + k;

    const pins = [];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        pins.push({ id: `c${c}${r}`, x: c + 0.5, y: r + 0.5, size: 4,
          label: `Pin in the middle of the ${ordinal(c)} cell of the ${r ? 'bottom' : 'top'} row`,
          cycles: [[idx(c, r, T), idx(c, r, R), idx(c, r, B), idx(c, r, L)]] });
      }
    }
    for (let j = 1; j < H; j++) {
      for (let i = 1; i < W; i++) {
        const UL = [i - 1, j - 1], UR = [i, j - 1], LR = [i, j], LL = [i - 1, j];
        pins.push({ id: `k${i}${j}`, x: i, y: j, size: 8,
          label: `Pin on the corner between cells ${i} and ${i + 1}`,
          cycles: [
            [idx(...UL, B), idx(...UR, L), idx(...LR, T), idx(...LL, R)],
            [idx(...UL, R), idx(...UR, B), idx(...LR, L), idx(...LL, T)],
          ] });
      }
    }
    const byId = Object.fromEntries(pins.map((p) => [p.id, p]));
    function ordinal(n) { return ['first', 'second', 'third', 'fourth'][n]; }

    // ---- state ----
    let state = [];
    let startState = [];
    let level = 0;
    let taps = 0;
    let par = 0;
    let colors = [];
    let undo = [];       // stack of [pinId, clockwise taps needed] that leads back to solved
    let solved = false;
    let running = null;  // the rotation in progress
    let introPlaying = false;
    let lastRandom = []; // the extra board's scramble, so "Start over" can rebuild the hint path

    function solvedState(cols) {
      const s = [];
      for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) for (let k = 0; k < 4; k++) s.push(cols[Math.floor(c / 2)]);
      return s;
    }
    function apply(s, pin, dir) {
      const n = s.slice();
      for (const cy of pin.cycles) {
        for (let q = 0; q < 4; q++) {
          if (dir > 0) n[cy[(q + 1) % 4]] = s[cy[q]];
          else n[cy[q]] = s[cy[(q + 1) % 4]];
        }
      }
      return n;
    }
    function blockDone(s, b) {
      let first = null;
      for (let r = 0; r < H; r++) for (let c = b * 2; c < b * 2 + 2; c++) for (let k = 0; k < 4; k++) {
        const v = s[idx(c, r, k)];
        if (first === null) first = v; else if (v !== first) return false;
      }
      return true;
    }
    const isSolved = (s) => blockDone(s, 0) && blockDone(s, 1);

    // ---- build the SVG ----
    const svg = $('.board__svg', board);
    const el = (name, attrs) => { const e = document.createElementNS(SVGNS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
    svg.appendChild(el('rect', { class: 'board__plate', x: -PAD, y: -PAD, width: W * S + 2 * PAD, height: H * S + 2 * PAD, rx: 12 }));
    const triLayer = el('g', { class: 'board__tris' });
    svg.appendChild(triLayer);
    const polys = [];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const x0 = c * S, y0 = r * S, cx = x0 + S / 2, cy = y0 + S / 2;
        const pts = [
          [[x0, y0], [x0 + S, y0]], [[x0 + S, y0], [x0 + S, y0 + S]],
          [[x0 + S, y0 + S], [x0, y0 + S]], [[x0, y0 + S], [x0, y0]],
        ];
        pts.forEach((edge, k) => {
          const p = el('polygon', { points: `${edge[0].join(',')} ${edge[1].join(',')} ${cx},${cy}` });
          triLayer.appendChild(p);
          polys[idx(c, r, k)] = p;
        });
      }
    }
    // Fixed light from above, like the bevelled tiles in the game: tops lighter, bottoms darker.
    const shade = el('g', { class: 'board__shade', 'aria-hidden': 'true' });
    const SHADE = [['#FFFFFF', 0.16], ['#000000', 0.06], ['#000000', 0.16], ['#FFFFFF', 0.05]];
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        for (let k = 0; k < 4; k++) {
          const src = polys[idx(c, r, k)];
          shade.appendChild(el('polygon', { points: src.getAttribute('points'), fill: SHADE[k][0], 'fill-opacity': SHADE[k][1] }));
        }
      }
    }
    svg.appendChild(shade);
    svg.appendChild(el('line', { class: 'board__divide', x1: 200, y1: -2, x2: 200, y2: 202 }));
    const blocks = [0, 1].map((b) => {
      const rect = el('rect', { class: 'board__block', x: b * 200 + 2, y: 2, width: 196, height: 196, rx: 3 });
      svg.appendChild(rect);
      return rect;
    });

    // ---- pins (real buttons over the SVG) ----
    const pinLayer = $('.board__pins', board);
    pins.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pin';
      b.dataset.pin = p.id;
      b.style.left = ((p.x * S + PAD) / (W * S + 2 * PAD) * 100) + '%';
      b.style.top = ((p.y * S + PAD) / (H * S + 2 * PAD) * 100) + '%';
      b.setAttribute('aria-label', `${p.label}: turns ${p.size} triangles`);
      b.tabIndex = i === 0 ? 0 : -1;
      pinLayer.appendChild(b);
      p.btn = b;
    });

    const ui = {
      level: $('#play-level'), msg: $('#play-msg'), taps: $('#play-taps'), live: $('#play-live'),
      hint: $('#play-hint'), reset: $('#play-reset'), next: $('#play-next'),
    };

    function paint() {
      state.forEach((v, i) => polys[i].setAttribute('fill', COLORS[v]));
      blocks.forEach((rect, b) => rect.classList.toggle('is-done', blockDone(state, b)));
    }
    function setTaps() { ui.taps.textContent = taps === 1 ? '1 tap' : `${taps} taps`; }
    function clearHint() { pins.forEach((p) => p.btn.classList.remove('is-hint')); }
    function showHint() {
      clearHint();
      const top = undo[undo.length - 1];
      if (!top) return;
      const b = byId[top[0]].btn;
      void b.offsetWidth; // restart the ring animation
      b.classList.add('is-hint');
    }

    // Turn a pin with a short rotation of the affected triangles, then commit the new colors.
    function turn(pin, dir, duration) {
      if (running) running.finish();
      const tris = [...new Set(pin.cycles.flat())];
      const g = el('g', {});
      triLayer.appendChild(g);
      tris.forEach((i) => g.appendChild(polys[i]));
      const cx = pin.x * S, cy = pin.y * S;
      let raf = 0;
      return new Promise((resolve) => {
        const finish = () => {
          cancelAnimationFrame(raf);
          state = apply(state, pin, dir);
          tris.forEach((i) => triLayer.insertBefore(polys[i], g));
          g.remove();
          paint();
          running = null;
          resolve();
        };
        running = { finish };
        if (reduce.matches || !duration) { finish(); return; }
        const t0 = performance.now();
        const step = (now) => {
          const t = Math.min(1, (now - t0) / duration);
          const e = 1 - Math.pow(1 - t, 3);
          g.setAttribute('transform', `rotate(${dir * 90 * e} ${cx} ${cy})`);
          if (t < 1) raf = requestAnimationFrame(step); else finish();
        };
        raf = requestAnimationFrame(step);
      });
    }

    function status(msg, liveExtra) {
      ui.msg.textContent = msg;
      ui.live.textContent = liveExtra ? `${msg} ${liveExtra}` : msg;
    }
    function progressText() {
      const done = [0, 1].filter((b) => blockDone(state, b)).length;
      return `${done} of 2 squares are one color.`;
    }

    async function startLevel(n, animate) {
      if (running) running.finish();
      level = n;
      const spec = n < LEVELS.length ? LEVELS[n] : randomLevel();
      colors = spec.colors;
      state = solvedState(colors);
      taps = 0; solved = false; undo = [];
      par = spec.scramble.length;
      board.classList.remove('is-solved');
      ui.next.hidden = true; ui.hint.hidden = false;
      ui.level.textContent = n < LEVELS.length ? `Board ${n + 1} of ${LEVELS.length}` : 'Extra board';
      setTaps(); clearHint(); paint();

      const moves = spec.scramble.map((id) => byId[id]);
      if (animate && !reduce.matches) {
        introPlaying = true;
        board.classList.add('is-busy');
        status(n === 0 ? 'Watch the first move.' : 'Watch it scramble.');
        await wait(n === 0 ? 450 : 250);
        for (const p of moves) await turn(p, -1, n === 0 ? 620 : 380);
        board.classList.remove('is-busy');
        introPlaying = false;
      } else {
        moves.forEach((p) => { state = apply(state, p, -1); });
        paint();
      }
      moves.forEach((p) => undo.push([p.id, 1]));
      startState = state.slice();
      if (n === 0) {
        status('Tap the glowing pin.');
        showHint();
      } else {
        status(par === 1 ? 'One tap solves this one.' : `${par} taps solve this one.`);
      }
    }

    function randomLevel() {
      const names = Object.keys(COLORS);
      const a = names[Math.floor(Math.random() * names.length)];
      let b = a;
      while (b === a) b = names[Math.floor(Math.random() * names.length)];
      const cols = [a, b];
      let s = solvedState(cols);
      const seq = [];
      let guard = 0;
      while (seq.length < 3 && guard++ < 200) {
        const p = pins[Math.floor(Math.random() * pins.length)];
        const n = apply(s, p, -1);
        if (n.join() === s.join()) continue;           // no visible change
        if (seq.length === 2 && isSolved(n)) continue; // don't finish solved
        seq.push(p.id); s = n;
      }
      lastRandom = seq;
      return { colors: cols, scramble: seq };
    }

    async function tapPin(pin) {
      if (introPlaying || solved) return;
      clearHint();
      const top = undo[undo.length - 1];
      if (top && top[0] === pin.id) { top[1] -= 1; if (top[1] === 0) undo.pop(); }
      else undo.push([pin.id, 3]);
      taps += 1; setTaps();
      await turn(pin, 1, 240);
      if (isSolved(state)) {
        solved = true; undo = [];
        board.classList.add('is-solved');
        ui.hint.hidden = true;
        ui.next.hidden = false;
        const tapWord = taps === 1 ? '1 tap' : `${taps} taps`;
        if (level === LEVELS.length - 1) {
          ui.next.textContent = 'Another board';
          status(`Solved in ${tapWord}. That’s all three. The real game goes up to 12 colors.`);
        } else {
          ui.next.textContent = level >= LEVELS.length ? 'Another board' : 'Next board';
          status(`Solved in ${tapWord}.`);
        }
      } else {
        status(taps >= par + 4 && undo.length ? 'Stuck? Hint shows the next pin.' : 'Keep going.', progressText());
      }
    }

    pinLayer.addEventListener('click', (e) => {
      const b = e.target.closest('.pin');
      if (b) tapPin(byId[b.dataset.pin]);
    });
    // Arrow keys move between pins (one tab stop for the whole board).
    pinLayer.addEventListener('keydown', (e) => {
      const b = e.target.closest('.pin');
      if (!b) return;
      const dirs = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
      const d = dirs[e.key];
      if (!d) return;
      e.preventDefault();
      const from = byId[b.dataset.pin];
      let best = null, bestScore = Infinity;
      for (const p of pins) {
        if (p === from) continue;
        const dx = p.x - from.x, dy = p.y - from.y;
        const along = dx * d[0] + dy * d[1];
        if (along <= 0.01) continue;
        const across = Math.abs(dx * d[1]) + Math.abs(dy * d[0]);
        const score = along + across * 2;
        if (score < bestScore) { bestScore = score; best = p; }
      }
      if (best) {
        pins.forEach((p) => { p.btn.tabIndex = -1; });
        best.btn.tabIndex = 0;
        best.btn.focus();
      }
    });

    ui.hint.addEventListener('click', () => {
      if (solved || introPlaying) return;
      const top = undo[undo.length - 1];
      if (!top) return;
      showHint();
      const need = top[1];
      status(need === 1 ? 'Tap the glowing pin once.' : `Tap the glowing pin ${need} times.`);
    });
    ui.reset.addEventListener('click', () => {
      if (running) running.finish();
      if (introPlaying) return;
      const spec = level < LEVELS.length ? LEVELS[level] : null;
      state = startState.slice();
      taps = 0; solved = false; setTaps(); clearHint();
      board.classList.remove('is-solved');
      ui.next.hidden = true; ui.hint.hidden = false;
      // Rebuild the path back to solved from the scramble.
      undo = [];
      (spec ? spec.scramble : lastRandom).forEach((id) => undo.push([id, 1]));
      paint();
      status('Back to the start.');
    });
    ui.next.addEventListener('click', () => startLevel(level + 1, true));

    startLevel(0, true);
  }

  /* =====================================================================
     2. Sample-site viewer: live iframes in a laptop or phone frame
     ===================================================================== */
  const SITES = {
    jr: {
      slug: 'juniper-rye-bakehouse', name: 'Juniper & Rye Bakehouse', q: '“When should I come in?”',
      about: 'A sourdough bakery in Fort Collins, Colorado. Fictional business, finished working site.',
      try: 'Drag the time marker on the oven schedule to see what will be out of the oven when you arrive. Further down, build a cake and watch the price change.',
      alt: 'The Juniper & Rye Bakehouse home page: the shop sign over a steel-grey panel listing today’s bakes by the time they come out of the oven.',
    },
    sr: {
      slug: 'summit-ridge-plumbing', name: 'Summit Ridge Plumbing & Heating', q: '“What’s wrong, and how much?”',
      about: 'A plumbing and heating company in northern Colorado. Fictional business, finished working site.',
      try: 'Scroll to “What’s going on?”, pick a fixture and what it’s doing, and a service ticket fills in with the likely cause, the usual price and how urgent it is.',
      alt: 'The Summit Ridge Plumbing & Heating home page: a spruce-green panel with the headline and a red call button next to a photo of a pipe being fitted.',
    },
    iw: {
      slug: 'ironwood-strength', name: 'Ironwood Strength Co.', q: '“Which plates go on the bar?”',
      about: 'A barbell gym in Greeley, Colorado. Fictional business, finished working site.',
      try: 'Type a weight into the plate loader and the right competition plates slide onto the bar. Below it, the class schedule counts down to the next class.',
      alt: 'The Ironwood Strength Co. home page: a condensed headline and a booking button next to a loaded barbell, with the plate loader below.',
    },
  };
  const VIEW = { laptop: { w: 1280, h: 800 }, phone: { w: 390, h: 844 } };

  const panel = $('#viewer-panel');
  const stage = $('#stage');
  if (panel && stage) {
    const device = $('#device');
    const screen = $('#screen');
    const poster = $('#poster');
    const useBtn = $('#use-live');
    const tabs = [...document.querySelectorAll('.tab')];
    const modeBtns = [...document.querySelectorAll('.seg button')];
    const info = $('.viewer__info', panel);
    const more = $('.viewer__more', panel);
    const frames = {};      // site -> iframe
    const active = {};      // site -> user switched it on
    let site = 'jr';
    let mode = window.innerWidth < 760 ? 'phone' : 'laptop';
    let nearView = false;

    function layout() {
      const narrow = window.innerWidth < 1100;
      const cs = getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const availW = stage.clientWidth - padX;
      const v = VIEW[mode];
      let bz, dw, dh, scale;
      if (mode === 'laptop') {
        bz = availW < 500 ? 6 : 12;
        dw = Math.min(availW, 1000);
        scale = (dw - 2 * bz) / v.w;
        dh = v.h * scale + 2 * bz;
        const maxH = narrow ? Infinity : 640 - 2 * 28 - 14;
        if (dh > maxH) { dh = maxH; scale = (dh - 2 * bz) / v.h; dw = v.w * scale + 2 * bz; }
      } else {
        bz = 10;
        const maxH = narrow ? Math.min(640, window.innerHeight * 0.78) : 640 - 2 * 28;
        dh = maxH;
        scale = (dh - 2 * bz) / v.h;
        dw = v.w * scale + 2 * bz;
        if (dw > Math.min(availW, 340)) { dw = Math.min(availW, 340); scale = (dw - 2 * bz) / v.w; dh = v.h * scale + 2 * bz; }
      }
      device.style.setProperty('--bz', bz + 'px');
      device.style.setProperty('--dw', Math.round(dw) + 'px');
      device.style.setProperty('--dh', Math.round(dh) + 'px');
      device.style.setProperty('--dr', (mode === 'phone' ? 30 : 14) + 'px');
      device.style.setProperty('--sr', (mode === 'phone' ? 21 : 4) + 'px');
      Object.values(frames).forEach((f) => {
        f.style.width = v.w + 'px';
        f.style.height = v.h + 'px';
        f.style.setProperty('--s', scale.toFixed(4));
      });
    }

    function posterSrc() { return `hub-assets/${SITES[site].slug}-${mode === 'phone' ? 'phone' : 'desktop'}.webp`; }

    function ensureFrame(s) {
      if (frames[s] || saveData) return frames[s];
      const f = document.createElement('iframe');
      f.className = 'device__frame';
      f.src = `${SITES[s].slug}/index.html`;
      f.title = `Live sample site: ${SITES[s].name} (fictional business)`;
      f.setAttribute('inert', '');
      f.tabIndex = -1;
      f.addEventListener('load', () => f.classList.add('is-ready'));
      screen.insertBefore(f, useBtn);
      frames[s] = f;
      layout();
      return f;
    }

    function showSite() {
      Object.entries(frames).forEach(([k, f]) => { f.hidden = k !== site; });
      poster.src = posterSrc();
      poster.width = mode === 'phone' ? 390 : 1440;
      poster.height = mode === 'phone' ? 844 : 900;
      poster.alt = SITES[site].alt;
      if (nearView) ensureFrame(site);
      useBtn.hidden = !!active[site];
      const f = frames[site];
      if (f) {
        f.toggleAttribute('inert', !active[site]);
        f.tabIndex = active[site] ? 0 : -1;
      }
    }

    function selectSite(s, focusTab) {
      if (!SITES[s]) return;
      site = s;
      tabs.forEach((t) => {
        const on = t.dataset.site === s;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on) { panel.setAttribute('aria-labelledby', t.id); if (focusTab) t.focus(); }
      });
      panel.dataset.site = s;
      const d = SITES[s];
      $('#viewer-q').textContent = d.q;
      $('#viewer-name').textContent = d.name;
      $('#viewer-about').textContent = d.about;
      $('#viewer-try').textContent = d.try;
      $('#viewer-open').href = `${d.slug}/index.html`;
      if (!reduce.matches) {
        [info, more].forEach((n) => { n.classList.remove('is-swapping'); void n.offsetWidth; n.classList.add('is-swapping'); });
      }
      showSite();
    }

    function setMode(m) {
      mode = m;
      stage.dataset.mode = m;
      modeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
      layout();
      showSite();
    }

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => selectSite(t.dataset.site));
      t.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        selectSite(tabs[n].dataset.site, true);
      });
    });
    modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

    useBtn.addEventListener('click', () => {
      const f = ensureFrame(site) || null;
      if (!f) { window.location.href = `${SITES[site].slug}/index.html`; return; }
      active[site] = true;
      showSite();
      f.focus();
    });

    // Load the live site only when the viewer comes near the screen.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { nearView = true; ensureFrame(site); showSite(); io.disconnect(); }
      }, { rootMargin: '400px 0px' });
      io.observe(stage);
    } else {
      nearView = true;
    }

    if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(stage);
    else window.addEventListener('resize', layout);

    // Links elsewhere on the page that point at one sample ("See one working").
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-site]');
      if (a) selectSite(a.dataset.site);
    });

    setMode(mode);
    selectSite('jr');
  }

  /* =====================================================================
     3. "What would your site do?" picker
     ===================================================================== */
  const PICKS = [
    { k: 'bakery', label: 'Bakery or café', who: 'A bakery’s customers ask first:', q: '“What’s fresh right now?”',
      tool: 'a live bake board', how: 'what comes out of the oven today and when, set by each visitor’s own clock, with the things that usually sell out marked.',
      sample: { site: 'jr', text: 'See one working: the Juniper & Rye oven schedule' } },
    { k: 'plumber', label: 'Plumbing or HVAC', who: 'A plumber’s customers ask first:', q: '“Is this an emergency, and what will it cost?”',
      tool: 'a problem-to-price guide', how: 'customers pick what’s acting up and see the likely cause, the usual price range and whether to call now or book online.',
      sample: { site: 'sr', text: 'See one working: the Summit Ridge diagnosis tool' } },
    { k: 'gym', label: 'Gym or studio', who: 'A gym’s customers ask first:', q: '“When can I try a class?”',
      tool: 'a class schedule with a live countdown', how: 'it filters by class type, shows how long until the next one starts, and books a free first class.',
      sample: { site: 'iw', text: 'See one working: the Ironwood schedule and plate loader' } },
    { k: 'restaurant', label: 'Restaurant', who: 'A restaurant’s customers ask first:', q: '“What can I eat here?”',
      tool: 'a menu filter', how: 'diners tick gluten-free, vegetarian or nut-free and the menu narrows to what they can order, with today’s hours on top.' },
    { k: 'truck', label: 'Food truck', who: 'A food truck’s customers ask first:', q: '“Where are you parked today?”',
      tool: 'a this-week stop schedule', how: 'today’s spot and hours up top, the rest of the week below, and a map link for every stop.' },
    { k: 'salon', label: 'Salon or barber', who: 'A salon’s customers ask first:', q: '“How much, and how long will it take?”',
      tool: 'a service menu that adds up', how: 'pick a cut, color or add-on and see the total price and chair time, then send a booking request.' },
    { k: 'lawn', label: 'Landscaping', who: 'A landscaper’s customers ask first:', q: '“What would my yard cost?”',
      tool: 'a quote estimator', how: 'customers choose their yard size and the services they want, see a price range, and send you the details.' },
    { k: 'auto', label: 'Auto repair', who: 'A repair shop’s customers ask first:', q: '“How long will my car be in the shop?”',
      tool: 'a repair lookup', how: 'pick the job, like brakes or a timing belt, and see the usual time in the shop and price range before calling.' },
    { k: 'cleaning', label: 'Cleaning service', who: 'A cleaning service’s customers ask first:', q: '“How much to clean my place?”',
      tool: 'an instant estimate', how: 'bedrooms, bathrooms and extras in; a price and your next open days out.' },
    { k: 'photo', label: 'Photographer', who: 'A photographer’s clients ask first:', q: '“Are you free on my date?”',
      tool: 'an availability calendar with packages', how: 'open dates at a glance, then a package picker that totals the price and starts an inquiry.' },
    { k: 'other', label: 'Something else', who: 'Every business has one question customers ask first.', q: 'What’s yours?',
      pre: '', tool: 'Put it in your Upwork message', how: ' and I’ll sketch the tool that answers it.' },
  ];
  const picks = $('#picks');
  if (picks) {
    const swap = $('#answer-swap');
    const who = $('#answer-who'), q = $('#answer-q'), tool = $('#answer-tool'), sample = $('#answer-sample');
    const btns = PICKS.map((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      b.tabIndex = i === 0 ? 0 : -1;
      b.textContent = p.label;
      b.dataset.k = p.k;
      picks.appendChild(b);
      return b;
    });
    function choose(i, focus) {
      const p = PICKS[i];
      btns.forEach((b, j) => { b.setAttribute('aria-checked', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
      if (focus) btns[i].focus();
      who.textContent = p.who;
      q.textContent = p.q;
      tool.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = p.tool;
      if (p.pre === '') tool.append(strong, p.how);
      else tool.append('I’d answer it with ', strong, ': ' + p.how);
      if (p.sample) {
        sample.hidden = false;
        const a = sample.querySelector('a');
        a.dataset.site = p.sample.site;
        a.textContent = p.sample.text;
      } else {
        sample.hidden = true;
      }
      if (!reduce.matches) { swap.classList.remove('is-swapping'); void swap.offsetWidth; swap.classList.add('is-swapping'); }
    }
    btns.forEach((b, i) => {
      b.addEventListener('click', () => choose(i));
      b.addEventListener('keydown', (e) => {
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % btns.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + btns.length) % btns.length;
        if (n === null) return;
        e.preventDefault();
        choose(n, true);
      });
    });
  }
})();
