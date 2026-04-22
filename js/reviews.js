/* reviews.js — Stacking card deck animation with always-visible title */

function initReviews() {
  'use strict';

  const section  = document.getElementById('reviews');
  const header   = section?.querySelector('.reviews-header');
  const stack    = document.getElementById('reviews-stack');
  if (!section || !stack) return;

  const cards = Array.from(stack.querySelectorAll('.review-card'));
  if (!cards.length) return;

  const rotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 0.9];
  const yOffsets  = [0, -6, -12, -18, -24, -28];

  /* Cards start below viewport */
  gsap.set(cards, { y: '100vh', rotation: 0, transformOrigin: 'center bottom' });
  cards.forEach((card, i) => { card.style.zIndex = i + 1; });

  /* Pin the WHOLE section so header stays visible */
  const scrollLen = cards.length * 450;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${scrollLen}`,
      pin: true,
      scrub: 0.8,
      invalidateOnRefresh: true,
    },
  });

  cards.forEach((card, i) => {
    const rot  = rotations[i % rotations.length];
    const yOff = yOffsets[i] || 0;

    tl.to(card, { y: yOff, rotation: rot, duration: 1, ease: 'power2.out' }, i * 0.9);

    if (i > 0) {
      tl.to(cards[i - 1], { scale: 0.95, duration: 0.5, ease: 'power2.inOut' }, i * 0.9);
    }
  });
}
