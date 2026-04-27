/**
 * scroll-hide-nav.js — Navbar auto-hide on scroll-down, reveal on scroll-up
 *
 * Transparent at top → solid on scroll. Hides when scrolling down past the
 * hero, reappears immediately on scroll-up. Dead-zone of ±threshold px
 * prevents flickering on tiny scroll jitter.
 *
 * Dependencies: GSAP ScrollTrigger
 *
 * CSS needed on your navbar:
 *   .navbar { transition: transform 0.4s cubic-bezier(.4,0,.2,1), background ...; }
 *   .navbar.hidden  { transform: translateY(-100%); }
 *   .navbar.scrolled { background: rgba(0,0,0,0.9); backdrop-filter: blur(16px); }
 *
 * Usage:
 *   initScrollHideNav();
 *   initScrollHideNav({ navId: 'my-nav', threshold: 12, heroRatio: 0.3 });
 */
function initScrollHideNav(opts = {}) {
  'use strict';

  const o = {
    navId:      'navbar',
    threshold:  8,       // px dead-zone to prevent flicker
    heroRatio:  0.4,     // how far into the hero (fraction of vh) before hide kicks in
    scrolledAt: 60,      // px scrolled before navbar gets .scrolled class
    ...opts,
  };

  const navbar = document.getElementById(o.navId);
  if (!navbar) return;

  /* Transparent → solid */
  ScrollTrigger.create({
    start: `top -${o.scrolledAt}`,
    onUpdate(self) {
      navbar.classList.toggle('scrolled', self.progress > 0);
    },
  });

  /* Hide on scroll-down, reveal on scroll-up */
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate() {
      const y = window.scrollY;
      const pastHero = y > window.innerHeight * o.heroRatio;
      if (!pastHero) { navbar.classList.remove('hidden'); lastY = y; return; }
      if (y > lastY + o.threshold) { navbar.classList.add('hidden');    lastY = y; }
      if (y < lastY - o.threshold) { navbar.classList.remove('hidden'); lastY = y; }
    },
  });
}
