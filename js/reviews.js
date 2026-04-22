/* reviews.js — Stacking card deck animation with CSS sticky (no GSAP pin) */

function initReviews() {
  'use strict';

  const section = document.getElementById('reviews');
  const stack   = document.getElementById('reviews-stack');
  if (!section || !stack) return;

  const cards = Array.from(stack.querySelectorAll('.review-card'));
  if (!cards.length) return;

  const rotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 0.9];
  const yOffsets  = [0, -6, -12, -18, -24, -28];

  /* Section height = viewport + scroll space for all cards */
  const scrollLen = cards.length * 450;
  section.style.height = `calc(100vh + ${scrollLen}px)`;

  /* Cards start below viewport */
  gsap.set(cards, { y: '100vh', rotation: 0, transformOrigin: 'center bottom' });
  cards.forEach((card, i) => { card.style.zIndex = i + 1; });

  /* Scrub-driven timeline tied to section scroll — no GSAP pin needed */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
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
