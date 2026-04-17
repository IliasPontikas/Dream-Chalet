/* reviews.js — Stacking card deck animation (all cards start below viewport) */

function initReviews() {
  'use strict';

  const section = document.getElementById('reviews');
  const stack   = document.getElementById('reviews-stack');
  if (!section || !stack) return;

  const cards = Array.from(stack.querySelectorAll('.review-card'));
  if (!cards.length) return;

  /* Slight rotation offsets for organic deck feel */
  const rotations = [-2.5, 1.8, -1.2, 2.2, -1.8, 0.9];
  /* Slight vertical stagger so deck looks layered */
  const yOffsets  = [0, -6, -12, -18, -24, -28];

  /* All cards start below the viewport */
  gsap.set(cards, {
    y: '100vh',
    rotation: 0,
    transformOrigin: 'center bottom',
  });

  /* Give each card its final z-index */
  cards.forEach((card, i) => {
    card.style.zIndex = i + 1;
  });

  /* Pin the section and animate each card into the stack */
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${cards.length * 450}`,
      pin: '.reviews-stack-container',
      scrub: 1.2,
      anticipatePin: 1,
    },
  });

  cards.forEach((card, i) => {
    const rot = rotations[i % rotations.length];
    const yOff = yOffsets[i] || 0;

    /* Card slides up from below */
    tl.to(
      card,
      {
        y: yOff,
        rotation: rot,
        duration: 1,
        ease: 'power2.out',
      },
      i * 0.9          /* stagger in timeline */
    );

    /* Previous cards recede slightly as new one arrives */
    if (i > 0) {
      tl.to(
        cards[i - 1],
        {
          scale: 0.95,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        i * 0.9
      );
    }
  });
}