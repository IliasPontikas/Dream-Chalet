/* animations.js — nav, hero, section entrances, stats, sticky btn, attractions tilt */

function initAnimations() {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    /* No motion: still wire up navbar (scroll-triggered class toggling
       isn't motion), still init all interactive controls, and force
       elements that were hidden in CSS for animation entry to their
       final visible state so the page is usable. */
    document.querySelectorAll(
      '.hero-eyebrow, .hero-subtitle, .hero-ctas, .amenity-item'
    ).forEach((el) => { el.style.opacity = '1'; });

    document.querySelectorAll('.hero-title .char').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });

    /* Stats: snap counters straight to their target value */
    document.querySelectorAll('.stat-number[data-target]').forEach((el) => {
      const t = parseFloat(el.dataset.target);
      el.textContent = Number.isInteger(t) ? String(t) : t.toFixed(1);
    });

    initNav();
    initScrollProgress();
    initStickyBookBtn();
    return;
  }

  initNav();
  initHero();
  initSectionEntrances();
  initStats();
  initScrollProgress();
  initStickyBookBtn();
  initAttractionsTilt();
}

/* ── Navigation ──────────────────────────────────────────── */
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('.mobile-nav-link, .mobile-menu-cta');
  if (!navbar) return;

  /* Transparent → solid on scroll */
  ScrollTrigger.create({
    start: 'top -60',
    onUpdate(self) {
      navbar.classList.toggle('scrolled', self.progress > 0);
    },
  });

  /* Hide navbar on scroll down, reveal on scroll up */
  let lastY = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate() {
      const y = window.scrollY;
      const pastHero = y > window.innerHeight * 0.4;
      if (!pastHero) {
        navbar.classList.remove('hidden');
        lastY = y;
        return;
      }
      if (y > lastY + 8)  { navbar.classList.add('hidden');    lastY = y; }
      if (y < lastY - 8)  { navbar.classList.remove('hidden'); lastY = y; }
    },
  });

  /* Hamburger open/close */
  if (!hamburger || !mobileMenu) return;

  /* Initial hidden state for stagger reveal */
  if (mobileLinks?.length) gsap.set(mobileLinks, { opacity: 0, y: 24 });

  function openMenu() {
    mobileMenu.classList.add('open');
    navbar.classList.add('menu-open');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    navbar.classList.remove('hidden');
    gsap.to(mobileLinks, {
      opacity: 1,
      y: 0,
      stagger: 0.07,
      duration: 0.5,
      ease: 'power3.out',
      delay: 0.2,
    });
  }

  function closeMenu() {
    mobileMenu.classList.remove('open');
    navbar.classList.remove('menu-open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    gsap.set(mobileLinks, { opacity: 0, y: 20 });
  }

  hamburger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) closeMenu();
    else openMenu();
  });

  mobileLinks?.forEach((link) => link.addEventListener('click', closeMenu));

  /* ESC closes the menu */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });
}

/* ── Hero Title (manual char split) ─────────────────────── */
function initHero() {
  const titleEl = document.querySelector('.hero-title');
  const eyebrow = document.querySelector('.hero-eyebrow');
  const subtitle = document.querySelector('.hero-subtitle');
  const ctas = document.querySelector('.hero-ctas');
  if (!titleEl) return;

  /* Use pre-built .char spans from HTML; fall back to auto-split if absent */
  if (!titleEl.querySelectorAll('.char').length) {
    const text = titleEl.textContent;
    titleEl.innerHTML = text
      .split('')
      .map((c) => `<span class="char">${c === ' ' ? '&nbsp;' : c}</span>`)
      .join('');
  }

  const chars = titleEl.querySelectorAll('.char');

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
  tl.to(chars, {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 1,
    stagger: 0.05,
    ease: 'expo.out',
  }, eyebrow ? '-=0.4' : 0)
    .to(subtitle, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
    .to(['.hero-facts', ctas, '.hero-rating'], { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, '-=0.5');

  /* Fade out the scroll indicator once the user has scrolled past ~25% of the hero */
  const hint = document.querySelector('.hero-scroll-hint');
  if (hint) {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.25;
      hint.classList.toggle('faded', past);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}

/* ── Generic section entrances ───────────────────────────── */
function initSectionEntrances() {
  /* Headings */
  gsap.utils.toArray('.section-heading').forEach((el) => {
    gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  /* Section labels */
  gsap.utils.toArray('.section-label').forEach((el) => {
    gsap.from(el, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* About text and image */
  const aboutText = document.querySelector('.about-text');
  if (aboutText) {
    gsap.from(aboutText, {
      x: -60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: aboutText, start: 'top 80%' },
    });
  }

  const imgWrap = document.querySelector('.about-image-wrap');
  if (imgWrap) {
    gsap.to(imgWrap, {
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      duration: 1.2,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: imgWrap, start: 'top 75%' },
    });
  }

  /* Amenities stagger */
  const amenities = gsap.utils.toArray('.amenity-item');
  if (amenities.length) {
    gsap.from(amenities, {
      opacity: 0,
      y: 20,
      stagger: 0.05,
      duration: 0.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.amenities-grid', start: 'top 80%' },
    });
  }

  /* Contact buttons */
  gsap.utils.toArray('.btn-contact').forEach((btn, i) => {
    gsap.from(btn, {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      delay: i * 0.08,
      ease: 'back.out(1.7)',
      scrollTrigger: { trigger: '.contact-btns', start: 'top 85%' },
    });
  });

  /* Price card border draw */
  const priceCard = document.querySelector('.price-card');
  if (priceCard) {
    gsap.from(priceCard, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: priceCard, start: 'top 80%' },
    });
  }
}

/* ── Stats counters ───────────────────────────────────────── */
function initStats() {
  document.querySelectorAll('.stat-number[data-target]').forEach((el) => {
    const target = parseFloat(el.dataset.target);
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate() {
        el.textContent = Number.isInteger(target)
          ? Math.round(obj.val)
          : obj.val.toFixed(1);
      },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ── Scroll progress bar ─────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  ScrollTrigger.create({
    start: 'top top',
    end: 'bottom bottom',
    onUpdate(self) {
      bar.style.width = (self.progress * 100).toFixed(2) + '%';
    },
  });
}

/* ── Cursor gallery (room list hover) ────────────────────── */
function initCursorGallery() {
  const img = document.getElementById('cursor-gallery-img');
  if (!img) return;

  const xTo = gsap.quickTo(img, 'x', { duration: 0.3, ease: 'power3.out' });
  const yTo = gsap.quickTo(img, 'y', { duration: 0.3, ease: 'power3.out' });

  document.querySelectorAll('.room-list-item').forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const src = item.dataset.image || '';
      if (!src) return;
      img.src = src;
      img.style.display = 'block';
      gsap.killTweensOf(img);
      gsap.to(img, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(img, { opacity: 0, duration: 0.3, onComplete: () => { img.style.display = 'none'; } });
    });
  });

  window.addEventListener('mousemove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
  });
}

/* ── Sticky Book Button ───────────────────────────────────── */
function initStickyBookBtn() {
  const stickyBook = document.getElementById('sticky-book');
  const btn = document.getElementById('sticky-book-btn');
  const panel = document.getElementById('sticky-book-panel');
  if (!stickyBook || !btn) return;

  /* Show after hero */
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'bottom 80%',
    onEnter: () => stickyBook.classList.add('visible'),
    onLeaveBack: () => stickyBook.classList.remove('visible'),
  });

  /* Toggle panel */
  btn.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
  });

  /* Close panel on outside click */
  document.addEventListener('click', (e) => {
    if (!stickyBook.contains(e.target)) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ── Attractions: subtle desktop tilt (no touch), scroll parallax ─ */
function initAttractionsTilt() {
  const isTouch = window.matchMedia('(hover: none)').matches;
  const reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.attraction-card').forEach((card) => {
    const bg = card.querySelector('.attraction-bg');

    /* Scroll-driven parallax via background-position (no transform conflict) */
    if (bg && typeof ScrollTrigger !== 'undefined' && !reduce) {
      gsap.fromTo(
        bg,
        { backgroundPositionY: '40%' },
        {
          backgroundPositionY: '60%',
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        }
      );
    }

    /* Desktop-only mouse tilt — much subtler than before */
    if (isTouch || reduce) return;
    card.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const mx = ((e.clientX - left) / width - 0.5) * 2;
      const my = ((e.clientY - top) / height - 0.5) * 2;
      gsap.to(card, {
        rotateY: mx * 3,
        rotateX: -my * 2.5,
        duration: 0.5,
        ease: 'power2.out',
        transformPerspective: 1400,
        transformOrigin: 'center center',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power3.out' });
    });
  });
}

/* Attractions: cinematic reveal — hero fades up, satellites stagger in */
(function initAttractionsReveal() {
  const grid  = document.querySelector('.attractions-grid');
  const hero  = document.querySelector('.attraction-card--hero');
  const cards = document.querySelectorAll('.attraction-card:not(.attraction-card--hero)');
  if (!grid || typeof gsap === 'undefined') return;

  if (hero) {
    gsap.from(hero, {
      y: 40,
      scale: 0.98,
      opacity: 0,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: grid, start: 'top 85%' },
    });
  }
  if (cards.length) {
    gsap.from(cards, {
      y: 50,
      opacity: 0,
      duration: 0.85,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: grid, start: 'top 75%' },
    });
  }
})();