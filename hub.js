// Portfolio hub v4: the live sample-site viewer (hero) and the "what would your site do?" picker.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const $ = (sel, root = document) => root.querySelector(sel);

  /* =====================================================================
     1. Sample-site viewer: live iframes in a laptop or phone frame
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
    ss: {
      slug: 'skip-stop-pictures', name: 'Skip Stop Pictures', q: '“Where’s the trailer?”',
      about: 'A film and TV production company in New York. Fictional business, finished working site.',
      try: 'Pick a film in the black bar under the title: the still, the title card and the featured poster below all change. Play the trailer, then add a tee or a poster to the cart.',
      alt: 'The Skip Stop Pictures home page: a letterboxed still of a subway platform at night, the title The Last Local, a Play trailer button and a reel of four films.',
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
    let phoneSource = $('#poster-phone');
    const frames = {};      // site -> iframe
    const active = {};      // site -> user switched it on
    let site = 'jr';
    let mode = window.innerWidth < 760 ? 'phone' : 'laptop';
    let live = false;       // the live site may load (after the hub itself has loaded)
    let ready = false;      // no swap animation for the starting state

    function layout() {
      const narrow = window.innerWidth < 1100;
      const cs = getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = stage.clientWidth - padX;
      const availH = stage.clientHeight - padY; // fixed stage height on wide screens
      const v = VIEW[mode];
      let bz, dw, dh, scale;
      if (mode === 'laptop') {
        bz = availW < 500 ? 6 : 12;
        dw = Math.min(availW, 1000);
        scale = (dw - 2 * bz) / v.w;
        dh = v.h * scale + 2 * bz;
        const maxH = narrow ? Infinity : availH - 14; // room for the hinge lip
        if (dh > maxH) { dh = maxH; scale = (dh - 2 * bz) / v.h; dw = v.w * scale + 2 * bz; }
      } else {
        bz = 10;
        const maxH = narrow ? Math.min(640, window.innerHeight * 0.78) : availH;
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
      if (phoneSource) { phoneSource.remove(); phoneSource = null; } // JS picks the still from here on
      poster.src = posterSrc();
      poster.width = mode === 'phone' ? 390 : 1440;
      poster.height = mode === 'phone' ? 844 : 900;
      poster.alt = SITES[site].alt;
      if (live) ensureFrame(site);
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
      if (ready && !reduce.matches) {
        panel.classList.remove('is-swapping'); void panel.offsetWidth; panel.classList.add('is-swapping');
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

    // The still shows at once; the live site swaps in after the hub itself has loaded.
    const goLive = () => { live = true; showSite(); };
    const whenIdle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));
    if (document.readyState === 'complete') whenIdle(goLive);
    else window.addEventListener('load', () => whenIdle(goLive), { once: true });

    if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(stage);
    else window.addEventListener('resize', layout);

    // Links elsewhere on the page that point at one sample ("See one working").
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-site]');
      if (a) selectSite(a.dataset.site);
    });

    setMode(mode);
    selectSite('jr');
    ready = true;
  }

  /* =====================================================================
     2. "What would your site do?" picker
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
    { k: 'film', label: 'Film or video studio', who: 'A film studio’s audience asks first:', q: '“Where can I watch the trailer?”',
      tool: 'a trailer-first homepage', how: 'the newest trailer one tap from the top, a reel that switches between your films, and where to watch each one.',
      sample: { site: 'ss', text: 'See one working: the Skip Stop Pictures film reel' } },
    { k: 'shop', label: 'Shop or merch', who: 'A shop’s customers ask first:', q: '“Do you have it in my size?”',
      tool: 'a shop with a working cart', how: 'sizes on every product, a cart that keeps their picks from page to page, quantities and a subtotal, then checkout through Stripe.',
      sample: { site: 'ss', text: 'See one working: the Skip Stop Pictures merch shop' } },
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
