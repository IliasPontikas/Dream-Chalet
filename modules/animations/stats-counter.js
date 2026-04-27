/**
 * stats-counter.js — Animated number counter driven by scroll
 *
 * Add data-target="42" to any element. When it enters the viewport the
 * number counts up from 0. Integers are rounded; decimals keep 1 decimal place.
 *
 * Dependencies: GSAP core + ScrollTrigger plugin
 *
 * HTML:
 *   <span class="stat-number" data-target="4.9">0</span>
 *   <span class="stat-number" data-target="120">0</span>
 *
 * Usage:
 *   initStatsCounter();
 *   initStatsCounter({ selector: '.stat-number', duration: 2, start: 'top 85%' });
 */
function initStatsCounter(opts = {}) {
  'use strict';

  const o = {
    selector: '.stat-number[data-target]',
    duration: 1.8,
    ease:     'power2.out',
    start:    'top 85%',
    ...opts,
  };

  document.querySelectorAll(o.selector).forEach((el) => {
    const target = parseFloat(el.dataset.target);
    const obj    = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: o.duration,
      ease: o.ease,
      onUpdate() {
        el.textContent = Number.isInteger(target)
          ? Math.round(obj.val)
          : obj.val.toFixed(1);
      },
      scrollTrigger: { trigger: el, start: o.start, once: true },
    });
  });
}
