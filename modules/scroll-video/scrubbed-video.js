/**
 * scrubbed-video.js — Scroll-driven video scrubbing with lerp smoothing
 *
 * Maps scroll progress to video.currentTime using linear interpolation and
 * a throttled seek (max ~16 fps) to avoid UI jank.
 * Supports up to 2 text overlays that fade in/out at configurable scroll positions.
 *
 * Dependencies: GSAP core + ScrollTrigger plugin
 *
 * HTML structure expected:
 *   <section id="scroll-video" style="height: 300vh;">
 *     <div class="scroll-video-inner">   <!-- this gets pinned -->
 *       <video id="scroll-vid" preload="auto" muted playsinline poster="...">
 *         <source src="video.mp4" type="video/mp4">
 *       </video>
 *       <div class="scroll-overlay-1">First message</div>
 *       <div class="scroll-overlay-2">Second message</div>
 *     </div>
 *   </section>
 *
 * Usage:
 *   initScrubbedVideo();
 *   initScrubbedVideo({
 *     sectionId: 'scroll-video',
 *     videoId:   'scroll-vid',
 *     lerpRate:  0.1,
 *     overlay1: { inStart: 0.15, inEnd: 0.35, outStart: 0.35, outEnd: 0.45 },
 *     overlay2: { inStart: 0.60, inEnd: 0.80, outStart: 0.80, outEnd: 0.88 },
 *   });
 */
function initScrubbedVideo(opts = {}) {
  'use strict';

  const o = {
    sectionId:   'scroll-video',
    videoId:     'scroll-vid',
    pinnedSel:   '.scroll-video-inner',
    overlay1Sel: '.scroll-overlay-1',
    overlay2Sel: '.scroll-overlay-2',
    lerpRate:    0.1,   // 0–1: higher = snappier
    seekThrottle: 60,   // ms between video.currentTime updates (~16 fps)
    overlay1: { inStart: 0.15, inEnd: 0.35, outStart: 0.35, outEnd: 0.45 },
    overlay2: { inStart: 0.60, inEnd: 0.80, outStart: 0.80, outEnd: 0.88 },
    ...opts,
  };

  const section  = document.getElementById(o.sectionId);
  const video    = document.getElementById(o.videoId);
  if (!section || !video) return;

  const overlay1 = section.querySelector(o.overlay1Sel);
  const overlay2 = section.querySelector(o.overlay2Sel);

  let targetTime  = 0;
  let currentTime = 0;
  let lastSeek    = 0;
  let rafId       = null;

  function tick() {
    const diff = targetTime - currentTime;
    if (Math.abs(diff) > 0.001) {
      currentTime += diff * o.lerpRate;
      const now = performance.now();
      if (now - lastSeek > o.seekThrottle) {
        try {
          if (video.fastSeek) video.fastSeek(currentTime);
          else video.currentTime = currentTime;
        } catch (_) {}
        lastSeek = now;
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  function overlayOpacity(p, cfg) {
    const inP  = gsap.utils.clamp(0, 1, (p - cfg.inStart)  / (cfg.inEnd  - cfg.inStart));
    const outP = gsap.utils.clamp(0, 1, (cfg.outEnd - p)   / (cfg.outEnd - cfg.outStart));
    return Math.min(inP, outP);
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
      pin: o.pinnedSel,
      anticipatePin: 1,
      onUpdate(self) {
        const p = self.progress;
        targetTime = p * video.duration;
        if (overlay1) overlay1.style.opacity = overlayOpacity(p, o.overlay1);
        if (overlay2) overlay2.style.opacity = overlayOpacity(p, o.overlay2);
      },
    });

    tick();
  }

  video.addEventListener('loadedmetadata', setupScrub);
  if (video.readyState >= 1) setupScrub();

  video.addEventListener('error', () => {
    if (rafId) cancelAnimationFrame(rafId);
    video.style.display = 'none';
    const inner = section.querySelector(o.pinnedSel);
    if (inner) inner.style.background = `url('${video.poster}') center/cover no-repeat`;
  });
}
