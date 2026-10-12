/* scroll-video.js — Vertical walkthrough scrubbed by scroll, with captions per room */

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
    video.loop = true;
    video.play().catch(() => {});
    video.addEventListener('timeupdate', () => {
      if (video.duration) setStep(video.currentTime / video.duration);
    });
    return;
  }

  let targetTime  = 0;
  let currentTime = 0;
  let lastSet     = 0;     /* the time we last asked the video to show */
  let seekStart   = 0;
  let ticking     = false;

  /* One seek at a time: a new seek cancels the one still decoding, so
     seeking every frame on a phone left the picture frozen on an old
     frame (the first or the last scene) for the whole scroll. */
  function seekTo(t) {
    lastSet = t;
    seekStart = performance.now();
    try { video.currentTime = t; } catch (e) {}
  }

  /* Jump straight to the frame that matches the scroll position */
  function forceSeek() {
    currentTime = targetTime;
    seekTo(targetTime);
  }

  function tick() {
    currentTime += (targetTime - currentTime) * 0.12;
    const busy = video.seeking && performance.now() - seekStart < 1200;
    if (!busy && video.readyState >= 1) {
      /* If the browser reset or unloaded the video while we were away
         (it then shows frame 0), resync to the scroll position */
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

  /* Phones (iOS especially) don't decode a video until it has been
     played once, and may drop it again after a reload or a long scroll
     away. Prime it with a muted play/pause whenever it isn't ready —
     on approach, on entering, and on any tap (for browsers that need
     a gesture, e.g. iOS Low Power Mode). */
  video.muted = true;
  video.setAttribute('muted', '');
  video.playsInline = true;
  let primed = false;
  let priming = false;
  let lastTry = 0;
  function prime() {
    if (priming || (primed && video.readyState >= 2)) return;
    priming = true;
    lastTry = performance.now();
    if (video.readyState === 0 && video.networkState === 3) video.load(); /* NETWORK_NO_SOURCE */
    const done = (ok) => {
      priming = false;
      primed = ok;
      if (ok) { video.pause(); startScrub(); forceSeek(); }
    };
    let p;
    try { p = video.play(); } catch (e) { done(false); return; }
    if (p && p.then) p.then(() => done(true), () => done(false));
    else done(true);
  }
  video.addEventListener('emptied', () => { primed = false; });

  /* Captions always follow scroll; the video joins in once it has loaded */
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle(self) {
      if (!self.isActive) return;
      prime();
      if (video.readyState >= 1) forceSeek();
    },
  });
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      setStep(self.progress);
      if (video.duration) targetTime = self.progress * (video.duration - 0.05);
      /* Still not decoding? try again (at most once a second) */
      if (video.readyState < 2 && performance.now() - lastTry > 1000) prime();
    },
  });

  video.addEventListener('loadedmetadata', startScrub);
  video.addEventListener('loadeddata', forceSeek);
  if (video.readyState >= 1) startScrub();

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) prime();
    }, { rootMargin: '600px 0px' });
    io.observe(section);
  } else {
    prime();
  }
  ['touchend', 'click'].forEach((ev) =>
    window.addEventListener(ev, () => { if (video.readyState < 2) { primed = false; prime(); } }, { passive: true })
  );

  /* Back/forward cache or returning to the tab: show the right frame again */
  window.addEventListener('pageshow', (e) => { if (e.persisted) { primed = false; prime(); forceSeek(); } });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && video.readyState >= 1) forceSeek();
  });
}
