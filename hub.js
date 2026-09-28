// Loop videos: load and play only while on screen; never under reduced motion; Save-Data waits for a click.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const screens = [...document.querySelectorAll('.screen')];
  if (!screens.length || !('IntersectionObserver' in window)) return;

  const state = new Map();

  function label(s) {
    const playing = !s.video.paused;
    s.btn.textContent = playing ? 'Pause' : 'Play';
    s.btn.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' the recording of ' + s.name);
  }

  function load(s) {
    if (s.loaded) return;
    s.loaded = true;
    s.video.src = s.video.dataset.src;
  }

  function play(s) {
    if (reduce.matches || s.failed) return;
    load(s);
    const p = s.video.play();
    if (p && p.catch) p.catch(() => { /* blocked or interrupted: the poster stays */ });
  }

  screens.forEach((fig) => {
    const video = fig.querySelector('.screen__loop');
    const btn = fig.querySelector('.loop-btn');
    if (!video || !btn) return;
    video.muted = true;
    const s = { fig, video, btn, name: fig.dataset.name || 'this site', loaded: false, failed: false, userPaused: false, visible: false };
    state.set(fig, s);

    video.addEventListener('playing', () => { fig.classList.add('is-live'); btn.hidden = false; label(s); });
    video.addEventListener('pause', () => label(s));
    video.addEventListener('error', () => {
      s.failed = true;
      fig.classList.remove('is-live');
      btn.hidden = true;
    });
    btn.addEventListener('click', () => {
      if (video.paused) { s.userPaused = false; play(s); }
      else { s.userPaused = true; video.pause(); }
    });

    if (saveData && !reduce.matches) { btn.hidden = false; btn.textContent = 'Play'; btn.setAttribute('aria-label', 'Play the recording of ' + s.name); s.userPaused = true; }
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const s = state.get(e.target);
      if (!s) return;
      s.visible = e.isIntersecting && e.intersectionRatio >= 0.35;
      if (s.visible && !s.userPaused) play(s);
      else if (!s.visible && !s.video.paused) s.video.pause();
    });
  }, { threshold: [0, 0.35, 0.6] });

  function start() { state.forEach((s) => io.observe(s.fig)); }
  function stop() {
    io.disconnect();
    state.forEach((s) => { s.video.pause(); s.fig.classList.remove('is-live'); s.btn.hidden = true; });
  }

  if (!reduce.matches) start();
  reduce.addEventListener('change', () => (reduce.matches ? stop() : start()));
})();
