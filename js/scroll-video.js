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
  let lastSeek    = 0;
  let ticking     = false;
  let lastSet     = 0;     /* the time we last asked the video to show */

  /* Jump straight to the frame that matches the scroll position */
  function forceSeek() {
    currentTime = targetTime;
    lastSet = targetTime;
    try { video.currentTime = targetTime; } catch (e) {}
  }

  /* Lerp toward the scroll position, rate-limit seeks so decoding keeps up */
  function tick() {
    /* If the browser reset or unloaded the video while we were away
       (it then shows frame 0 — the exterior), resync from its real time */
    if (!video.seeking && video.readyState >= 1 && Math.abs(video.currentTime - lastSet) > 0.25) {
      forceSeek();
    }
    const diff = targetTime - currentTime;
    if (Math.abs(diff) > 0.001) {
      currentTime += diff * 0.12;
      const now = performance.now();
      if (now - lastSeek > 40) {
        const t = Math.max(0, currentTime);
        try { video.currentTime = t; } catch (e) {}
        lastSet = t;
        lastSeek = now;
      }
    }
    requestAnimationFrame(tick);
  }

  function startScrub() {
    if (ticking || !video.duration) return;
    ticking = true;
    video.pause();
    tick();
  }

  /* Captions always follow scroll; the video joins in once it has loaded */
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      setStep(self.progress);
      if (video.duration) targetTime = self.progress * (video.duration - 0.05);
    },
  });

  video.addEventListener('loadedmetadata', startScrub);
  if (video.readyState >= 1) startScrub();

  /* Phones (iOS especially) don't load a video until it has been played
     once. Prime it with a muted play/pause as the section approaches —
     and again on the first touch, for browsers that need a gesture. */
  video.muted = true;
  video.setAttribute('muted', '');
  video.playsInline = true;
  let primed = false;
  function prime() {
    if (primed) return;
    primed = true;
    const p = video.play();
    if (p && p.then) {
      p.then(() => { video.pause(); startScrub(); }).catch(() => { primed = false; });
    } else {
      video.pause();
    }
  }
  /* Media can be dropped when far off-screen; prime again on return */
  video.addEventListener('emptied', () => { primed = false; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      if (video.readyState < 2) primed = false;
      prime();
      /* Show the frame for where the scroll is now */
      if (video.readyState >= 1) forceSeek();
    }, { rootMargin: '600px 0px' });
    io.observe(section);
  } else {
    prime();
  }
  window.addEventListener('touchstart', prime, { once: true, passive: true });
}
