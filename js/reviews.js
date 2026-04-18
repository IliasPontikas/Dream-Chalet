/* reviews.js — Stacking card deck animation (all cards start below viewport) */

function initReviews() {
  'use strict';

  const cards = gsap.utils.toArray('.reviews-list .review-card');
  if (!cards.length) return;

  cards.forEach((card, i) => {
    gsap.from(card, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
      }
    });
  });
}