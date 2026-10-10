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

  /* ── Footer year stays current ── */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  /* ── No animation library? Show the plain page instead of a stuck preloader ── */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    document.documentElement.classList.add('no-anim');
    const pre = document.getElementById('preloader');
    if (pre) pre.style.display = 'none';
    document.documentElement.classList.remove('is-loading');
    return;
  }

  /* ── Register GSAP plugins ─────────────────────────────── */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip, Draggable);

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
       *other* deferred modules (animations.js, gallery.js…)
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
    }, 90);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearInterval(interval);
      target = 100;

      /* Let the ring visually complete before sliding away */
      setTimeout(() => {
        cancelAnimationFrame(rafId);
        if (ringArc) ringArc.style.strokeDashoffset = '0';

        const done = () => {
          preloader.style.display = 'none';
          document.documentElement.classList.remove('is-loading');
          onReady();
        };

        if (prefersReduced) { done(); return; }

        /* Signature exit: the logo glides up into its place in the header
           while the black fades away to reveal the hero video */
        const logo     = preloader.querySelector('.preloader-logo-img');
        const sheen    = preloader.querySelector('.preloader-sheen');
        const ring     = preloader.querySelector('.preloader-ring');
        const navLogo  = document.querySelector('.navbar .logo-img');
        const from     = logo?.getBoundingClientRect();
        const to       = navLogo?.getBoundingClientRect();

        document.documentElement.classList.remove('is-loading');
        const tl = gsap.timeline({ onComplete: () => {
          if (navLogo) navLogo.style.opacity = '';
          done();
        } });
        tl.to([ring, sheen], { autoAlpha: 0, duration: 0.35, ease: 'power1.out' }, 0);

        if (logo && navLogo && from && to && to.width > 0) {
          logo.style.animation = 'none';          /* hand transforms over to GSAP */
          navLogo.style.opacity = '0';             /* the flying logo stands in for it */
          const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
          const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
          tl.to(logo, {
            x: dx, y: dy, scale: to.width / from.width,
            duration: 1.05, ease: 'power3.inOut',
          }, 0.15)
            .to(preloader, { backgroundColor: 'rgba(10, 10, 10, 0)', duration: 0.9, ease: 'power2.inOut' }, 0.3);
        } else {
          tl.to(preloader, { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, 0.1);
        }
      }, 350);
    };

    /* Lift the curtain once the page has loaded AND the hero video has a
       frame to show (so it opens onto moving footage), but never before the
       logo's light sweep has played and never later than ~3s */
    const started = performance.now();
    const pageLoaded = new Promise((res) => {
      if (document.readyState === 'complete') res();
      else window.addEventListener('load', res, { once: true });
    });
    const heroReady = new Promise((res) => {
      const v = document.getElementById('hero-video');
      if (!v || v.readyState >= 2) return res();
      v.addEventListener('loadeddata', res, { once: true });
      v.addEventListener('error', res, { once: true });
    });
    Promise.all([pageLoaded, heroReady]).then(() => {
      const wait = Math.max(0, 1700 - (performance.now() - started));
      setTimeout(finish, wait);
    });
    setTimeout(finish, 3000);
  }

  /* ── After preloader: kick off all modules ─────────────── */
  function onReady() {
    if (typeof initAnimations === 'function') initAnimations();
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