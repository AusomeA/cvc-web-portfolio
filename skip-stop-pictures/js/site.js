// Homepage behaviour: film switcher (hero reel + poster wall + featured block), trailer lightbox with an
// Academy-leader count, mobile menu and the demo contact form. Nothing is sent anywhere.
// Skip Stop Pictures is a fictional business (portfolio sample by Barbed Wire Glove Games LLC).
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var FILMS = {
    'last-local': {
      title: 'The Last Local', len: '2:14', color: '#0D2A31', accent: '#F2C230',
      heroKind: 'Feature film, drama, 2026', kind: 'Feature film, drama. 1 h 48 min. 2026',
      alt: 'A subway train blurs past an empty bench on the Chambers Street platform at night',
      log: 'One conductor, one last run, every stop to the end of the line.',
      syn: 'The night the line is cut, a conductor works the last local out of Chambers Street. Between midnight and dawn, eleven stops and a handful of regulars change what she thinks she is leaving behind.',
      watch: 'In theaters from November 13',
      credits: [['Written and directed by', 'Marisol Treadwell'], ['Starring', 'Odile Brannagan, Kwame Hollis'], ['Director of photography', 'Jun Halvorsen'], ['Produced by', 'Nell Pruitt']]
    },
    'delancey': {
      title: 'Delancey After Midnight', len: '1:52', color: '#1C1430', accent: '#FF9E4A',
      heroKind: 'Limited series, crime drama, 2025', kind: 'Limited series, crime drama. Six episodes. 2025',
      alt: 'A yellow cab waits at a quiet downtown intersection at night, an orange traffic barrel on the corner',
      log: 'Two night workers, one neighborhood, the same case from opposite ends.',
      syn: 'A tow-truck driver and a night-court clerk keep crossing paths on the Lower East Side, until one of her overnight calls turns up on his docket. Six episodes, all of them after dark.',
      watch: 'All six episodes streaming now',
      credits: [['Created by', 'Theo Abara'], ['Starring', 'Rosa Kettering, Danny Oyelaran'], ['Directed by', 'Marisol Treadwell'], ['Executive producer', 'Nell Pruitt']]
    },
    'fire-escape': {
      title: 'Fire Escape Summer', len: '2:01', color: '#4A1D14', accent: '#FFE2A0',
      heroKind: 'Feature film, coming of age, 2024', kind: 'Feature film, coming of age. 1 h 36 min. 2024',
      alt: 'Late sun on a brownstone facade, someone reading on the fire escape',
      log: 'Four kids, one block and the hottest August on record.',
      syn: 'The fire escape outside 4B is the only place on the block where anyone can breathe, and the only place anyone tells the truth. One August, four kids and the building that raised them.',
      watch: 'Streaming, and to rent or buy',
      credits: [['Written and directed by', 'Celia Ostrowski'], ['Starring', 'Junie Ferreira, Malik Odum'], ['Music by', 'Arlo Benedek'], ['Produced by', 'Nell Pruitt']]
    },
    'water-towers': {
      title: 'Water Towers', len: '1:38', color: '#2B373D', accent: '#D8C3A0',
      heroKind: 'Documentary, 2023', kind: 'Documentary. 1 h 22 min. 2023',
      alt: 'A wooden water tower on a Manhattan rooftop, framed by leaves against a bright sky',
      log: 'Who builds the wooden tanks on New York’s roofs, and who still climbs up to fix them.',
      syn: 'A year on the rooftops with the crews who build and repair the city’s wooden water tanks by hand, from the cooper’s yard to the top of the ladder.',
      watch: 'Streaming, with free screenings for schools and libraries',
      credits: [['A film by', 'Hana Lindqvist'], ['Cinematography', 'Jun Halvorsen'], ['Editor', 'Priya Castellane'], ['Produced by', 'Nell Pruitt']]
    }
  };
  var current = 'last-local';

  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  function applyFilm(key) {
    var f = FILMS[key]; if (!f) return;
    current = key;
    // hero
    var img = $('#heroImg'), srcM = $('#heroSrcM');
    if (img) { img.src = 'img/still-' + key + '.webp'; img.alt = f.alt; }
    if (srcM) srcM.srcset = 'img/still-' + key + '-m.webp';
    setText('heroTitle', f.title); setText('heroLen', f.len); setText('heroKind', f.heroKind); setText('heroLog', f.log);
    $$('.reel [data-film]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.film === key)); });
    // featured block
    var feat = $('#film');
    if (feat) { feat.style.setProperty('--film', f.color); feat.style.setProperty('--film-accent', f.accent); }
    var poster = $('#featPoster'); if (poster) { poster.src = 'img/poster-' + key + '.webp'; poster.alt = 'Poster for ' + f.title; }
    setText('featTitle', f.title); setText('featKind', f.kind); setText('featLog', f.log); setText('featSyn', f.syn); setText('featLen', f.len); setText('featWatch', f.watch);
    var dl = $('#featCredits');
    if (dl) dl.innerHTML = f.credits.map(function (c) { return '<div><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></div>'; }).join('');
  }

  // The opening titles play once per page view: drop the class when they finish, so the sequence does not
  // replay if the page is hidden and shown again (for example inside the portfolio's device frame).
  var heroIntro = $('.hero.intro');
  if (heroIntro) {
    var endIntro = function () { heroIntro.classList.remove('intro'); };
    var introBar = $('.bar', heroIntro);
    if (introBar && !reduce) introBar.addEventListener('animationend', endIntro, { once: true });
    setTimeout(endIntro, reduce ? 0 : 2500);
  }

  // Reel: cut to black, swap, cut back in (like an edit)
  var cut = $('.cut');
  $$('.reel [data-film]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.film; if (key === current) return;
      if (reduce || !cut) { applyFilm(key); return; }
      cut.classList.add('on');
      var next = new Image(); next.src = 'img/still-' + key + (window.innerWidth <= 720 ? '-m' : '') + '.webp';
      var done = false;
      var swap = function () { if (done) return; done = true; applyFilm(key); requestAnimationFrame(function () { setTimeout(function () { cut.classList.remove('on'); }, 60); }); };
      setTimeout(function () { if (next.complete) swap(); else { next.onload = swap; next.onerror = swap; setTimeout(swap, 700); } }, 150);
    });
  });

  // Poster wall: load the film into the featured block, then the link scrolls to it
  $$('.wall [data-film]').forEach(function (a) {
    a.addEventListener('click', function () { applyFilm(a.dataset.film); });
  });

  // Trailer lightbox
  var lb = $('#lightbox'), opener = null, raf = 0;
  var leader = lb && $('.leader', lb), num = leader && $('b', leader), sweep = leader && $('.sweep', leader);
  function runLeader() {
    if (!leader || reduce) return;
    leader.hidden = false;
    var start = performance.now(), per = 420;
    cancelAnimationFrame(raf);
    (function frame(t) {
      var e = t - start, i = Math.floor(e / per);
      if (i >= 3) { leader.hidden = true; return; }
      num.textContent = String(3 - i);
      sweep.style.setProperty('--a', ((e % per) / per * 360).toFixed(1) + 'deg');
      raf = requestAnimationFrame(frame);
    })(start);
  }
  function openTrailer(e) {
    if (!lb || !lb.showModal) return;
    opener = e.currentTarget;
    var f = FILMS[current];
    setText('lbTitle', f.title); setText('lbMeta', 'Official trailer, ' + f.len);
    var li = $('#lbImg'); if (li) li.src = 'img/still-' + current + '.webp';
    lb.showModal();
    runLeader();
  }
  function closeTrailer() { if (lb && lb.open) lb.close(); }
  $$('[data-trailer]').forEach(function (b) { b.addEventListener('click', openTrailer); });
  if (lb) {
    $('[data-close]', lb).addEventListener('click', closeTrailer);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeTrailer(); });
    lb.addEventListener('close', function () { cancelAnimationFrame(raf); if (leader) leader.hidden = true; if (opener) opener.focus(); });
  }

  // Mobile menu
  var menuBtn = $('.menu-btn'), links = $('#navLinks');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
  }

  // Demo contact form: validates, then says plainly that nothing was sent
  var form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['cName', 'Please add your name.'], ['cEmail', 'Please add an email we can reply to.'], ['cMsg', 'Please write a short message.']].forEach(function (p) {
        var el = document.getElementById(p[0]), err = el.parentNode.querySelector('.err');
        var bad = !el.value.trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
        err.textContent = bad ? p[1] : '';
        el.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var name = document.getElementById('cName').value.trim().split(' ')[0];
      var done = form.querySelector('.form-done') || document.createElement('p');
      done.className = 'form-done'; done.setAttribute('role', 'status');
      done.textContent = 'Thanks, ' + name + '. This is a demo site, so nothing was sent and nobody will reply.';
      form.appendChild(done);
      form.reset();
    });
  }
})();
