/* scroll-video.js — Walkthrough scrubbed by scroll, with captions per room.
   Computers scrub the <video>. Phones and tablets draw still frames on a
   canvas instead: mobile browsers (iOS especially) often stop painting a
   seeked video after a reload or when it has been off-screen, leaving the
   first or last scene frozen. */

/* Decide early (this runs while the page parses) so phones never download
   the video file and computers start buffering it straight away */
const WALK_USE_FRAMES = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
(function () {
  const v = document.getElementById('scroll-vid');
  if (!v || WALK_USE_FRAMES) return;
  /* After the page (hero film, photos) has loaded, so it doesn't compete */
  const start = () => { v.preload = 'auto'; v.load(); };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();

function initScrollVideo() {
  'use strict';

  const section = document.getElementById('scroll-video');
  const video   = document.getElementById('scroll-vid');
  const bar     = document.getElementById('walk-bar');
  if (!section || !video) return;

  const steps  = Array.from(section.querySelectorAll('.walk-step'));
  const starts = steps.map((s) => parseFloat(s.dataset.start) || 0);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setStep(p) {
    let idx = 0;
    starts.forEach((st, i) => { if (p >= st) idx = i; });
    steps.forEach((s, i) => s.classList.toggle('active', i === idx));
    if (bar) bar.style.transform = `scaleY(${p})`;
  }

  /* Reduced motion: just loop the video, captions follow playback */
  if (reduce) {
    video.preload = 'auto';
    video.loop = true;
    video.muted = true;
    video.play().catch(() => {});
    video.addEventListener('timeupdate', () => {
      if (video.duration) setStep(video.currentTime / video.duration);
    });
    return;
  }

  if (WALK_USE_FRAMES && video.dataset.frames) initFrames();
  else initVideo();

  /* ── Phones / tablets: image sequence on a canvas ─────────── */
  function initFrames() {
    const count   = parseInt(video.dataset.frameCount, 10) || 1;
    const pattern = video.dataset.frames;
    const src     = (i) => pattern.replace('###', String(i + 1).padStart(3, '0'));
    const frames  = new Array(count);   /* decoded Image per index, once loaded */

    const canvas = document.createElement('canvas');
    canvas.className = 'walk-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.backgroundImage = `url("${video.getAttribute('poster')}")`;
    video.replaceWith(canvas);
    const ctx = canvas.getContext('2d');

    let target = 0;      /* frame index the scroll asks for */
    let current = 0;     /* eased frame index */
    let drawn = -1;      /* index currently on the canvas */

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
        drawn = -1;
      }
    }

    /* Nearest frame that has loaded (coarse frames arrive first) */
    function nearest(i) {
      if (frames[i]) return i;
      for (let d = 1; d < count; d++) {
        if (i - d >= 0 && frames[i - d]) return i - d;
        if (i + d < count && frames[i + d]) return i + d;
      }
      return -1;
    }

    function draw(i) {
      const img = frames[i];
      const cw = canvas.width, ch = canvas.height;
      if (!img || !cw || !ch) return;
      /* object-fit: cover */
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      drawn = i;
      canvas.style.backgroundImage = 'none';
    }

    function tick() {
      current += (target - current) * 0.2;
      if (Math.abs(target - current) < 0.01) current = target;
      const i = nearest(Math.round(current));
      if (i >= 0 && i !== drawn) draw(i);
      requestAnimationFrame(tick);
    }

    /* Load order: every 16th frame, then fill the gaps (8, 4, 2, 1), so
       scrubbing works early and gets smoother as the rest arrives */
    const order = [];
    const seen = new Set();
    [16, 8, 4, 2, 1].forEach((step) => {
      for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    });
    if (!seen.has(count - 1)) order.splice(1, 0, count - 1);

    let started = false;
    function load() {
      if (started) return;
      started = true;
      let next = 0;
      const pump = () => {
        if (next >= order.length) return;
        const i = order[next++];
        const img = new Image();
        img.decoding = 'async';
        const ok = () => { frames[i] = img; pump(); };
        img.onload = () => (img.decode ? img.decode().then(ok, ok) : ok());
        img.onerror = pump;
        img.src = src(i);
      };
      for (let k = 0; k < 6; k++) pump();
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect(); }
      }, { rootMargin: '1500px 0px' });
      io.observe(section);
    }
    else load();

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        setStep(self.progress);
        target = self.progress * (count - 1);
      },
      onRefresh(self) {
        size();
        target = current = self.progress * (count - 1);
        setStep(self.progress);
      },
    });
    window.addEventListener('resize', size);
    size();
    tick();
  }

  /* ── Computers: scrub the <video> ─────────────────────────── */
  function initVideo() {
    let targetTime  = 0;
    let currentTime = 0;
    let lastSet     = 0;     /* the time we last asked the video to show */
    let seekStart   = 0;
    let ticking     = false;

    /* One seek at a time: a new seek cancels the one still decoding */
    function seekTo(t) {
      lastSet = t;
      seekStart = performance.now();
      try { video.currentTime = t; } catch (e) {}
    }

    function forceSeek() {
      currentTime = targetTime;
      seekTo(targetTime);
    }

    function tick() {
      currentTime += (targetTime - currentTime) * 0.12;
      const busy = video.seeking && performance.now() - seekStart < 1200;
      if (!busy && video.readyState >= 1) {
        /* If the browser reset the video while we were away, resync */
        if (Math.abs(video.currentTime - lastSet) > 0.25) forceSeek();
        else if (Math.abs(currentTime - lastSet) > 0.02) seekTo(Math.max(0, currentTime));
      }
      requestAnimationFrame(tick);
    }

    function startScrub() {
      if (!video.duration) return;
      if (!video.paused) video.pause();
      if (ticking) return;
      ticking = true;
      tick();
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        setStep(self.progress);
        if (video.duration) targetTime = self.progress * (video.duration - 0.05);
      },
    });

    video.muted = true;
    video.addEventListener('loadedmetadata', startScrub);
    video.addEventListener('loadeddata', forceSeek);
    if (video.readyState >= 1) startScrub();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && video.readyState >= 1) forceSeek();
    });
  }
}
