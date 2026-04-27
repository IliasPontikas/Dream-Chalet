/**
 * scroll-progress-bar.js — Thin horizontal progress bar fixed at top of page
 *
 * Dependencies: GSAP ScrollTrigger
 *
 * HTML:
 *   <div id="scroll-progress" class="scroll-progress"></div>
 *
 * CSS needed:
 *   .scroll-progress {
 *     position: fixed; top: 0; left: 0;
 *     height: 2px; width: 0%;
 *     background: #c9a96e;
 *     z-index: 9000;
 *     transform-origin: left;
 *   }
 *
 * Usage:
 *   initScrollProgressBar();
 *   initScrollProgressBar({ barId: 'my-bar' });
 */
function initScrollProgressBar(opts = {}) {
  'use strict';

  const o = { barId: 'scroll-progress', ...opts };
  const bar = document.getElementById(o.barId);
  if (!bar) return;

  ScrollTrigger.create({
    start: 'top top',
    end:   'bottom bottom',
    onUpdate(self) {
      bar.style.width = (self.progress * 100).toFixed(2) + '%';
    },
  });
}
