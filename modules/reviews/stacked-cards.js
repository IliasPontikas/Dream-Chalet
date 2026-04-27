/**
 * stacked-cards.js — Scroll-scrubbed stacking card deck
 *
 * Cards rise up from below and stack on top of each other as the user scrolls.
 * Uses CSS sticky positioning (no GSAP pin) — add the stacking section to a
 * tall container and let CSS sticky handle the viewport lock.
 *
 * Dependencies: GSAP core + ScrollTrigger plugin
 *
 * HTML structure expected:
 *   <section id="reviews" style="position: relative;">
 *     <div id="reviews-sticky-wrapper" style="position: sticky; top: 0; height: 100vh;">
 *       <div id="reviews-stack">
 *         <div class="review-card">…</div>
 *         <div class="review-card">…</div>
 *         …
 *       </div>
 *     </div>
 *   </section>
 *
 * Usage:
 *   initStackedCards();
 *   initStackedCards({
 *     sectionId:    'reviews',
 *     stackId:      'reviews-stack',
 *     cardSelector: '.review-card',
 *     scrollPerCard: 450,   // px of scroll space per card
 *     rotations:    [-2.5, 1.8, -1.2, 2.2],  // rotation pattern (repeats)
 *     yOffsets:     [0, -6, -12, -18],         // final Y offset per card
 *   });
 */
function initStackedCards(opts = {}) {
  'use strict';

  const o = {
    sectionId:    'reviews',
    stackId:      'reviews-stack',
    cardSelector: '.review-card',
    scrollPerCard: 450,
    rotations:    [-2.5, 1.8, -1.2, 2.2, -1.8, 0.9],
    yOffsets:     [0, -6, -12, -18, -24, -28],
    ...opts,
  };

  const section = document.getElementById(o.sectionId);
  const stack   = document.getElementById(o.stackId);
  if (!section || !stack) return;

  const cards = Array.from(stack.querySelectorAll(o.cardSelector));
  if (!cards.length) return;

  section.style.height = `calc(100vh + ${cards.length * o.scrollPerCard}px)`;

  gsap.set(cards, { y: '100vh', rotation: 0, transformOrigin: 'center bottom' });
  cards.forEach((card, i) => { card.style.zIndex = i + 1; });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  cards.forEach((card, i) => {
    const rot  = o.rotations[i % o.rotations.length];
    const yOff = o.yOffsets[i] ?? 0;
    tl.to(card, { y: yOff, rotation: rot, duration: 1, ease: 'power2.out' }, i * 0.9);
    if (i > 0) {
      tl.to(cards[i - 1], { scale: 0.95, duration: 0.5, ease: 'power2.inOut' }, i * 0.9);
    }
  });
}
