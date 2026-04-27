/**
 * section-entrances.js — Generic scroll-triggered fade/slide-in for sections
 *
 * Dependencies: GSAP core + ScrollTrigger plugin
 *
 * Usage:
 *   initSectionEntrances();
 *
 *   // Or pick individual helpers:
 *   entranceFadeUp('.my-heading',   { duration: 0.9, start: 'top 85%' });
 *   entranceFadeLeft('.about-text', { duration: 1.0 });
 *   entranceClipReveal('.img-wrap', { duration: 1.2 });
 *   entranceStagger('.grid-item',   { stagger: 0.08 });
 */

function entranceFadeUp(selector, opts = {}) {
  'use strict';
  const o = { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', start: 'top 85%', ...opts };
  gsap.utils.toArray(selector).forEach((el) => {
    gsap.from(el, { y: o.y, opacity: o.opacity, duration: o.duration, ease: o.ease,
      scrollTrigger: { trigger: el, start: o.start } });
  });
}

function entranceFadeLeft(selector, opts = {}) {
  'use strict';
  const o = { x: -60, opacity: 0, duration: 1, ease: 'power3.out', start: 'top 80%', ...opts };
  gsap.utils.toArray(selector).forEach((el) => {
    gsap.from(el, { x: o.x, opacity: o.opacity, duration: o.duration, ease: o.ease,
      scrollTrigger: { trigger: el, start: o.start } });
  });
}

function entranceClipReveal(selector, opts = {}) {
  'use strict';
  const o = { duration: 1.2, ease: 'power3.inOut', start: 'top 75%', ...opts };
  gsap.utils.toArray(selector).forEach((el) => {
    gsap.to(el, {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      duration: o.duration, ease: o.ease,
      scrollTrigger: { trigger: el, start: o.start },
    });
  });
}

function entranceStagger(selector, opts = {}) {
  'use strict';
  const o = { stagger: 0.05, duration: 0.6, ease: 'power3.out', y: 0, opacity: 1, start: 'top 80%', ...opts };
  const items = gsap.utils.toArray(selector);
  if (!items.length) return;
  gsap.to(items, { opacity: o.opacity, y: o.y, stagger: o.stagger, duration: o.duration, ease: o.ease,
    scrollTrigger: { trigger: items[0].parentElement, start: o.start } });
}

function entranceScale(selector, opts = {}) {
  'use strict';
  const o = { scale: 0.9, opacity: 0, duration: 0.5, ease: 'back.out(1.7)', start: 'top 85%', stagger: 0.08, ...opts };
  gsap.utils.toArray(selector).forEach((el, i) => {
    gsap.from(el, { scale: o.scale, opacity: o.opacity, duration: o.duration, delay: i * o.stagger, ease: o.ease,
      scrollTrigger: { trigger: el.parentElement, start: o.start } });
  });
}

/* Convenience: run all common patterns at once */
function initSectionEntrances() {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  entranceFadeUp('.section-heading', { start: 'top 85%' });
  entranceFadeUp('.section-label',   { y: 20, duration: 0.6, start: 'top 88%' });
  entranceFadeLeft('.about-text');
  entranceClipReveal('.about-image-wrap');
  entranceStagger('.amenity-item');
  entranceScale('.btn-contact');

  const priceCard = document.querySelector('.price-card');
  if (priceCard) {
    gsap.from(priceCard, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: priceCard, start: 'top 80%' } });
  }
}
