/* main.js — Bootstrap: GSAP plugins, Lenis, preloader, init */

(function () {
  'use strict';

  /* ── Scroll restoration: manual only on the very first visit so the
        preloader plays cleanly. Once seen, hand back to the browser so
        Back/Forward navigation restores position correctly. ── */
  if ('scrollRestoration' in history) {
    const seen = sessionStorage.getItem('dc:visited') === '1';
    history.scrollRestoration = seen ? 'auto' : 'manual';
    if (!seen) window.scrollTo(0, 0);
  } else {
    window.scrollTo(0, 0);
  }

  /* ── Hero video: portrait cut on tall screens, landscape otherwise ── */
  (function pickHeroVideo() {
    const v = document.getElementById('hero-video');
    if (!v) return;
    const mq = window.matchMedia('(max-aspect-ratio: 1/1)');
    const apply = () => {
      const k = mq.matches ? 'portrait' : 'landscape';
      const src = v.dataset['src' + k[0].toUpperCase() + k.slice(1)];
      if (!src || v.currentSrc.endsWith(src)) return;
      v.poster = v.dataset['poster' + k[0].toUpperCase() + k.slice(1)];
      v.src = src;
      v.play?.().catch(() => {});
    };
    apply();
    mq.addEventListener?.('change', apply);
  })();

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

    /* Keep Lenis scroll limits in sync whenever ScrollTrigger adds pin spacers */
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());

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
    const ringArc   = preloader?.querySelector('.preloader-ring-arc');
    if (!preloader) return;

    /* Skip preloader entirely on repeat visits within this tab session.
       NOTE: main.js is itself a deferred script, so when this runs the
       *other* deferred modules (animations.js, cursor.js, gallery.js…)
       may not have been parsed yet — initAnimations, initCursor etc.
       are still undefined. DOMContentLoaded fires only after every
       defer script has executed, so we wait for it. */
    if (sessionStorage.getItem('dc:visited') === '1') {
      preloader.style.display = 'none';
      if (document.readyState === 'complete') {
        Promise.resolve().then(onReady);
      } else {
        document.addEventListener('DOMContentLoaded', onReady, { once: true });
      }
      return;
    }
    sessionStorage.setItem('dc:visited', '1');

    const circumference = 2 * Math.PI * 122; /* r=122, matches SVG */

    let target    = 0;
    let displayed = 0;
    let rafId     = 0;

    const tick = () => {
      displayed += (target - displayed) * 0.07;
      if (ringArc) {
        ringArc.style.strokeDashoffset = circumference * (1 - displayed / 100);
      }
      rafId = requestAnimationFrame(tick);
    };
    tick();

    const interval = setInterval(() => {
      target += Math.random() * 12;
      if (target > 90) target = 90;
    }, 140);

    const finish = () => {
      clearInterval(interval);
      target = 100;

      /* Let the ring visually complete before sliding away */
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        if (ringArc) ringArc.style.strokeDashoffset = '0';

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
      }, 650);
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
    if (typeof initMap === 'function') initMap();
    if (typeof initCalendar === 'function') initCalendar();
    if (typeof initWeather === 'function') initWeather();
    if (typeof initI18n === 'function') initI18n();
    if (typeof initCookieConsent === 'function') initCookieConsent();
    /* Refresh after all ScrollTriggers are registered so Lenis spacers are correct */
    ScrollTrigger.refresh();
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