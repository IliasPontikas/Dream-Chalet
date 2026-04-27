/**
 * card-tilt-3d.js — 3D perspective tilt on mouse move
 *
 * Tracks mouse position relative to the card centre and applies
 * rotateX / rotateY transforms. Resets on mouse leave.
 *
 * Dependencies: GSAP core
 *
 * Usage:
 *   initCardTilt3d();
 *   initCardTilt3d({ selector: '.my-card', maxX: 8, maxY: 10, perspective: 1200 });
 */
function initCardTilt3d(opts = {}) {
  'use strict';

  const o = {
    selector:    '.attraction-card',
    maxX:        8,     // max rotateX degrees
    maxY:        10,    // max rotateY degrees
    perspective: 1200,
    duration:    0.4,
    resetEase:   'power3.out',
    ...opts,
  };

  document.querySelectorAll(o.selector).forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const mx = ((e.clientX - left) / width  - 0.5) * 2;
      const my = ((e.clientY - top)  / height - 0.5) * 2;
      gsap.to(card, {
        rotateY: mx * o.maxY,
        rotateX: -my * o.maxX,
        duration: o.duration,
        ease: 'power2.out',
        transformPerspective: o.perspective,
        transformOrigin: 'center center',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: o.resetEase });
    });
  });
}
