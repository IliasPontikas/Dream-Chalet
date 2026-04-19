/* scroll-video.js — Smooth scroll-scrubbed video using RAF + seek throttle */

function initScrollVideo() {
  'use strict';

  const section  = document.getElementById('scroll-video');
  const video    = document.getElementById('scroll-vid');
  const overlay1 = section?.querySelector('.scroll-overlay-1');
  const overlay2 = section?.querySelector('.scroll-overlay-2');

  if (!section || !video) return;

  let targetTime = 0;
  let rafId = null;

  /* Smooth seek: lerp currentTime toward targetTime each frame */
  function smoothSeek() {
    const diff = targetTime - video.currentTime;
    if (Math.abs(diff) > 0.01) {
      try { video.currentTime += diff * 0.12; } catch(e) {}
    }
    rafId = requestAnimationFrame(smoothSeek);
  }

  function setupScrub() {
    if (!video.duration) return;

    /* Force preload */
    video.preload = 'auto';

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

        /* Fade text overlays */
        if (overlay1) {
          const p1    = gsap.utils.clamp(0, 1, (p - 0.15) / 0.2);
          const p1out = gsap.utils.clamp(0, 1, (0.45 - p) / 0.1);
          overlay1.style.opacity = Math.min(p1, p1out);
        }
        if (overlay2) {
          const p2    = gsap.utils.clamp(0, 1, (p - 0.6) / 0.2);
          const p2out = gsap.utils.clamp(0, 1, (0.88 - p) / 0.1);
          overlay2.style.opacity = Math.min(p2, p2out);
        }
      },
    });

    /* Start smooth seek loop */
    smoothSeek();
  }

  video.addEventListener('loadedmetadata', setupScrub);
  if (video.readyState >= 1) setupScrub();

  /* Poster fallback */
  video.addEventListener('error', () => {
    if (rafId) cancelAnimationFrame(rafId);
    video.style.display = 'none';
    const inner = section.querySelector('.scroll-video-inner');
    if (inner) {
      inner.style.background = `url('${video.poster}') center/cover no-repeat`;
    }
  });
}
