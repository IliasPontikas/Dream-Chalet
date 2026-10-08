/* reviews.js — Clamp long reviews with a "Read more" toggle */

function initReviews() {
  'use strict';

  const grid = document.getElementById('reviews-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.review-card'));

  /* Only show the toggle when the text is actually cut off */
  function syncButtons() {
    cards.forEach((card) => {
      const body = card.querySelector('.review-body');
      const btn  = card.querySelector('.review-more');
      if (!body || !btn || card.classList.contains('expanded')) return;
      btn.hidden = body.scrollHeight <= body.clientHeight + 2;
    });
  }

  cards.forEach((card) => {
    const btn = card.querySelector('.review-more');
    btn?.addEventListener('click', () => {
      const open = card.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    });
  });

  syncButtons();
  window.addEventListener('resize', syncButtons);
  document.fonts?.ready.then(syncButtons);

  /* Gentle staggered entrance */
  if (typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from(cards, {
      y: 30,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: grid, start: 'top 85%' },
    });
  }
}
