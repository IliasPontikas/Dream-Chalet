/* scroll-video.js — Scrubbed video section (pine-gr.com style) */

function initScrollVideo() {
  'use strict';

  const section  = document.getElementById('scroll-video');
  const video    = document.getElementById('scroll-vid');
  const overlay1 = section?.querySelector('.scroll-overlay-1');
  const overlay2 = section?.querySelector('.scroll-overlay-2');

  if (!section || !video) return;

  /* Use a simple scroll-based image fallback if video can't load */
  function setupScrub() {
    if (!video.duration) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5, // increase smoothing
      pin: '.scroll-video-inner',
      anticipatePin: 1,
      onUpdate(self) {
        if (video.duration) {
          /* Use try-catch as some browsers throw when scrubbing rapidly */
          try {
            video.currentTime = self.progress * video.duration;
          } catch (e) {}
        }
        
        /* Fade overlays based on progress */
        if (overlay1) {
          const p1 = gsap.utils.clamp(0, 1, (self.progress - 0.2) / 0.25);
          const p1out = gsap.utils.clamp(0, 1, (0.5 - self.progress) / 0.1);
          overlay1.style.opacity = Math.min(p1, p1out);
        }
        if (overlay2) {
          const p2 = gsap.utils.clamp(0, 1, (self.progress - 0.6) / 0.2);
          const p2out = gsap.utils.clamp(0, 1, (0.9 - self.progress) / 0.1);
          overlay2.style.opacity = Math.min(p2, p2out);
        }
      },
    });
  }

  video.addEventListener('loadedmetadata', setupScrub);

  /* If already loaded */
  if (video.readyState >= 1) setupScrub();

  /* Poster fallback: if video fails show poster with parallax */
  video.addEventListener('error', () => {
    video.style.display = 'none';
    const inner = section.querySelector('.scroll-video-inner');
    if (inner) {
      inner.style.backgroundImage = `url('${video.poster}')`;
      inner.style.backgroundSize = 'cover';
      inner.style.backgroundPosition = 'center';
    }
  });
}