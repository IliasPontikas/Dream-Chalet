/* cursor.js — Custom cursor with 4 states */

function initCursor() {
  'use strict';

  /* Disable on touch devices */
  if (window.matchMedia('(hover: none)').matches) return;

  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const label = document.getElementById('cursor-label');
  if (!dot || !ring) return;

  /* quickTo instances for smooth following */
  const dotX  = gsap.quickTo(dot,  'x', { duration: 0.15, ease: 'power3.out' });
  const dotY  = gsap.quickTo(dot,  'y', { duration: 0.15, ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
  const labX  = gsap.quickTo(label,'x', { duration: 0.35, ease: 'power3.out' });
  const labY  = gsap.quickTo(label,'y', { duration: 0.35, ease: 'power3.out' });

  window.addEventListener('mousemove', (e) => {
    dotX(e.clientX); dotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
    labX(e.clientX); labY(e.clientY + 28);
  });

  /* State helpers */
  function setState(state, text = '') {
    label.textContent = text;

    switch (state) {
      case 'hover':
        gsap.to(ring, { scale: 1.8, opacity: 1, duration: 0.25 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
        break;
      case 'drag':
        gsap.to(ring, { scale: 2.5, opacity: 0.8, duration: 0.25 });
        gsap.to(label, { opacity: 1, duration: 0.2 });
        break;
      case 'view':
        gsap.to(ring, { scale: 2.2, opacity: 0.8, duration: 0.25 });
        gsap.to(label, { opacity: 1, duration: 0.2 });
        break;
      default:
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25 });
        gsap.to(label, { opacity: 0, duration: 0.2 });
    }
  }

  /* Apply states based on target element */
  const hoverTargets  = 'a, button, .nav-link, .mobile-nav-link, .btn-cta, .btn-contact, .attraction-dot, .coverflow-btn, .lang-toggle';
  const dragTargets   = '[data-cursor="drag"]';
  const viewTargets   = '.bento-item';

  document.addEventListener('mouseover', (e) => {
    const el = e.target;
    if (el.closest(viewTargets))  { setState('view',  'View');  return; }
    if (el.closest(dragTargets))  { setState('drag',  'Drag');  return; }
    if (el.closest(hoverTargets)) { setState('hover', '');      return; }
    setState('default');
  });

  /* Hide on mouse leave window */
  document.addEventListener('mouseleave', () => {
    gsap.to([dot, ring, label], { opacity: 0, duration: 0.2 });
  });
  document.addEventListener('mouseenter', () => {
    gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
  });
}