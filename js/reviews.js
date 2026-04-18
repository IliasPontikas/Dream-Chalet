/* reviews.js — Stacking card deck animation (all cards start below viewport) */

function initReviews() {
  'use strict';

  const container = document.querySelector('.reviews-stack-container');
  const cards = gsap.utils.toArray('.reviews-stack .review-card');
  if (!container || !cards.length) return;

  /* Setup initial state for cards: stacked, scaled down, lowered opacity */
  gsap.set(cards, {
    y: (i) => i * 15,
    scale: (i) => 1 - (cards.length - 1 - i) * 0.05,
    opacity: (i) => 0.5 + (i * 0.15),
    zIndex: (i) => i,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: '+=150%',
      pin: true,
      scrub: 1,
      anticipatePin: 1
    }
  });

  /* As we scroll, bring cards up from bottom (y: 100vh -> 0) */
  cards.forEach((card, i) => {
    tl.fromTo(card,
      { y: '100vh', opacity: 0 },
      {
        y: i * 15,
        opacity: 0.5 + (i * 0.15),
        duration: 1,
        ease: 'power2.out'
      },
      i * 0.4
    );
  });
}