/**
 * marquee.js — Infinite bidirectional marquee with pause-on-hover
 *
 * Pure CSS animation — this JS helper auto-duplicates items so the loop
 * is seamless regardless of item count, and respects prefers-reduced-motion.
 *
 * Dependencies: none
 *
 * HTML structure expected:
 *   <div class="marquee-row">
 *     <div class="marquee-track marquee-left" id="my-marquee">
 *       <div class="marquee-item">…</div>
 *       <div class="marquee-item">…</div>
 *       <!-- JS duplicates the items so CSS translateX(-50%) loops cleanly -->
 *     </div>
 *   </div>
 *
 * Add class marquee-left (→ left) or marquee-right (→ right) to the track.
 *
 * Usage:
 *   initMarquee();                     // targets all .marquee-track elements
 *   initMarquee({ selector: '#my-marquee', speed: '30s' });
 */
function initMarquee(opts = {}) {
  'use strict';

  const o = {
    selector: '.marquee-track',
    speed: '40s',
    pauseOnHover: true,
    ...opts,
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll(o.selector).forEach((track) => {
    /* Duplicate children so CSS -50% translateX loops seamlessly */
    const items = Array.from(track.children);
    if (!items.length) return;
    items.forEach((item) => track.appendChild(item.cloneNode(true)));

    track.style.animationDuration = o.speed;

    if (o.pauseOnHover) {
      track.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
      track.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
    }
  });
}
