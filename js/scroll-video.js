/* scroll-video.js — Smooth scroll-scrubbed video with throttled seeks + lerp */

function initScrollVideo() {
  'use strict';

  const section  = document.getElementById('scroll-video');
  const video    = document.getElementById('scroll-vid');
  const overlay1 = section?.querySelector('.scroll-overlay-1');
  const overlay2 = section?.querySelector('.scroll-overlay-2');
  if (!section || !video) return;

  let targetTime  = 0;
  let currentTime = 0;
  let lastSeek    = 0;
  let rafId       = null;

  /* Smooth lerp with rate-limited seek (16 fps) */
  function tick() {
    const diff = targetTime - currentTime;
    if (Math.abs(diff) > 0.001) {
      currentTime += diff * 0.1;          /* lerp 10% per frame */
      const now = performance.now();
      if (now - lastSeek > 60) {          /* throttle to ~16 fps seeks */
        try {
          if (video.fastSeek) video.fastSeek(currentTime);
          else video.currentTime = currentTime;
        } catch (e) {}
        lastSeek = now;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function setupScrub() {
    if (!video.duration) return;
    video.preload = 'auto';
    video.pause();

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: false,
      pin: '.scroll-video-inner',
      anticipatePin: 1,
      onUpdate(self) {
        const p = self.progress;
        targetTime = p * video.duration;
        if (overlay1) {
          const inP  = gsap.utils.clamp(0, 1, (p - 0.15) / 0.2);
          const outP = gsap.utils.clamp(0, 1, (0.45 - p) / 0.1);
          overlay1.style.opacity = Math.min(inP, outP);
        }
        if (overlay2) {
          const inP  = gsap.utils.clamp(0, 1, (p - 0.6) / 0.2);
          const outP = gsap.utils.clamp(0, 1, (0.88 - p) / 0.1);
          overlay2.style.opacity = Math.min(inP, outP);
        }
      },
    });

    tick();
  }

  video.addEventListener('loadedmetadata', setupScrub);
  if (video.readyState >= 1) setupScrub();

  video.addEventListener('error', () => {
    if (rafId) cancelAnimationFrame(rafId);
    video.style.display = 'none';
    const inner = section.querySelector('.scroll-video-inner');
    if (inner) inner.style.background = `url('${video.poster}') center/cover no-repeat`;
  });
}
