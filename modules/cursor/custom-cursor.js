/**
 * custom-cursor.js — Custom dual-ring cursor with 4 interaction states
 *
 * States: default | hover | drag | view
 * Automatically disabled on touch devices.
 *
 * Dependencies: GSAP core (quickTo for smooth lag-behind ring)
 *
 * HTML structure expected:
 *   <div id="cursor-dot"   class="cursor-dot"></div>
 *   <div id="cursor-ring"  class="cursor-ring"></div>
 *   <div id="cursor-label" class="cursor-label"></div>
 *
 * Usage:
 *   initCustomCursor();
 *   initCustomCursor({
 *     hoverTargets: 'a, button, .my-card',
 *     dragTargets:  '.slider',
 *     viewTargets:  '.gallery-slide',
 *     hoverScale:   1.8,
 *     dragScale:    2.5,
 *     viewScale:    2.2,
 *     viewLabel:    'View',
 *     dragLabel:    'Drag',
 *   });
 */
function initCustomCursor(opts = {}) {
  'use strict';

  if (window.matchMedia('(hover: none)').matches) return;

  const o = {
    dotId:        'cursor-dot',
    ringId:       'cursor-ring',
    labelId:      'cursor-label',
    hoverTargets: 'a, button, [role="button"]',
    dragTargets:  '[data-cursor="drag"]',
    viewTargets:  '[data-cursor="view"]',
    hoverScale:   1.8,
    dragScale:    2.5,
    viewScale:    2.2,
    viewLabel:    'View',
    dragLabel:    'Drag',
    dotDuration:  0.15,
    ringDuration: 0.35,
    ...opts,
  };

  const dot   = document.getElementById(o.dotId);
  const ring  = document.getElementById(o.ringId);
  const label = document.getElementById(o.labelId);
  if (!dot || !ring) return;

  const dotX  = gsap.quickTo(dot,  'x', { duration: o.dotDuration,  ease: 'power3.out' });
  const dotY  = gsap.quickTo(dot,  'y', { duration: o.dotDuration,  ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: o.ringDuration, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: o.ringDuration, ease: 'power3.out' });
  const labX  = label ? gsap.quickTo(label, 'x', { duration: o.ringDuration, ease: 'power3.out' }) : null;
  const labY  = label ? gsap.quickTo(label, 'y', { duration: o.ringDuration, ease: 'power3.out' }) : null;

  window.addEventListener('mousemove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    if (labX) { labX(e.clientX); labY(e.clientY + 28); }
  });

  function setState(state, text = '') {
    if (label) label.textContent = text;
    switch (state) {
      case 'hover':
        gsap.to(ring,  { scale: o.hoverScale, opacity: 1, duration: 0.25 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
        break;
      case 'drag':
        gsap.to(ring,  { scale: o.dragScale, opacity: 0.8, duration: 0.25 });
        gsap.to(label, { opacity: 1, duration: 0.2 });
        break;
      case 'view':
        gsap.to(ring,  { scale: o.viewScale, opacity: 0.8, duration: 0.25 });
        gsap.to(label, { opacity: 1, duration: 0.2 });
        break;
      default:
        gsap.to(ring,  { scale: 1, opacity: 1, duration: 0.25 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
    }
  }

  document.addEventListener('mouseover', (e) => {
    const el = e.target;
    if (el.closest(o.viewTargets))  { setState('view',  o.viewLabel); return; }
    if (el.closest(o.dragTargets))  { setState('drag',  o.dragLabel); return; }
    if (el.closest(o.hoverTargets)) { setState('hover', '');          return; }
    setState('default');
  });

  document.addEventListener('mouseleave', () => {
    gsap.to([dot, ring, label].filter(Boolean), { opacity: 0, duration: 0.2 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([dot, ring].filter(Boolean), { opacity: 1, duration: 0.2 });
  });
}
