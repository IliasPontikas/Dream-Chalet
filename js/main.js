/* main.js — Bootstrap: GSAP plugins, Lenis, preloader, init */

(function () {
  'use strict';

  /* ── Register GSAP plugins ─────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip, Draggable);
  if (typeof InertiaPlugin !== 'undefined') gsap.registerPlugin(InertiaPlugin);

  /* ── Prefers-reduced-motion ────────────────────────────── */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Lenis smooth scroll ───────────────────────────────── */
  let lenis;

  function initLenis() {
    if (prefersReduced) return;

    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    /* Smooth anchor links */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.4 });
      });
    });
  }

  /* ── Preloader ─────────────────────────────────────────── */
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const progressBar = preloader?.querySelector('.preloader-progress');
    if (!preloader) return;

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      if (progressBar) progressBar.style.width = progress + '%';
    }, 120);

    const finish = () => {
      clearInterval(interval);
      if (progressBar) progressBar.style.width = '100%';

      if (prefersReduced) {
        preloader.style.display = 'none';
        onReady();
        return;
      }

      gsap.to(preloader, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power3.inOut',
        delay: 0.3,
        onComplete: () => {
          preloader.style.display = 'none';
          onReady();
        },
      });
    };

    if (document.readyState === 'complete') {
      setTimeout(finish, 600);
    } else {
      window.addEventListener('load', () => setTimeout(finish, 400));
    }
  }

  /* ── After preloader: kick off all modules ─────────────── */
  function onReady() {
    if (typeof initAnimations === 'function') initAnimations();
    if (typeof initCursor === 'function') initCursor();
    if (typeof initScrollVideo === 'function') initScrollVideo();
    if (typeof initGallery === 'function') initGallery();
    if (typeof initReviews === 'function') initReviews();
    if (typeof initThreeJS === 'function') initThreeJS();
    if (typeof initMap === 'function') initMap();
    if (typeof initCalendar === 'function') initCalendar();
    if (typeof initWeather === 'function') initWeather();
    if (typeof initAvailability === 'function') initAvailability();
    if (typeof initI18n === 'function') initI18n();
    if (typeof initCookieConsent === 'function') initCookieConsent();
  }

  /* ── Service Worker ────────────────────────────────────── */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }

  /* ── Start ─────────────────────────────────────────────── */
  initLenis();
  initPreloader();
  registerSW();

  /* Expose lenis globally so other modules can pause/resume */
  window.__lenis = lenis;
})();