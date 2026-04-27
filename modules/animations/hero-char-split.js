/**
 * hero-char-split.js — Character-by-character stagger title animation
 *
 * If the title already has <span class="char"> children (hardcoded in HTML),
 * it uses them directly. Otherwise it auto-splits the text content.
 *
 * Dependencies: GSAP core
 *
 * CSS needed (add to your stylesheet):
 *   .hero-title .char { display: inline-block; opacity: 0; transform: translateY(40px) rotateX(-25deg); }
 *
 * Usage:
 *   initHeroCharSplit();
 *   initHeroCharSplit({
 *     titleSel:    '.hero-title',
 *     eyebrowSel:  '.hero-eyebrow',
 *     subtitleSel: '.hero-subtitle',
 *     ctasSel:     '.hero-ctas',
 *     stagger:     0.11,
 *     duration:    1.2,
 *   });
 */
function initHeroCharSplit(opts = {}) {
  'use strict';

  const o = {
    titleSel:    '.hero-title',
    eyebrowSel:  '.hero-eyebrow',
    subtitleSel: '.hero-subtitle',
    ctasSel:     '.hero-ctas',
    stagger:     0.11,
    duration:    1.2,
    ease:        'expo.out',
    ...opts,
  };

  const titleEl  = document.querySelector(o.titleSel);
  const eyebrow  = document.querySelector(o.eyebrowSel);
  const subtitle = document.querySelector(o.subtitleSel);
  const ctas     = document.querySelector(o.ctasSel);
  if (!titleEl) return;

  /* Reuse pre-built spans; fall back to auto-split */
  if (!titleEl.querySelectorAll('.char').length) {
    const text = titleEl.textContent;
    titleEl.innerHTML = text
      .split('')
      .map((c) => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`)
      .join('');
  }

  const chars = titleEl.querySelectorAll('.char');
  const tl    = gsap.timeline({ defaults: { ease: o.ease } });

  if (eyebrow)  tl.to(eyebrow,  { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
  tl.to(chars, { opacity: 1, y: 0, rotateX: 0, duration: o.duration, stagger: o.stagger }, eyebrow ? '-=0.4' : 0);
  if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6');
  if (ctas)     tl.to(ctas,     { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4');
}
