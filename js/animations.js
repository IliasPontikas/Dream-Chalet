/* animations.js — nav, hero, section entrances, stats, sticky btn, attractions tilt */

function initAnimations() {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { initStickyBookBtn(); initThemeToggle(); return; }

  initNav();
  initHero();
  initSectionEntrances();
  initStats();
  initScrollProgress();
  /* initCursorGallery(); — uncomment to re-enable hover image preview on .room-list-item */
  initStickyBookBtn();
  initThemeToggle();
  initAttractionsTilt();
}

/* ── Navigation ──────────────────────────────────────────── */
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('.mobile-nav-link, .mobile-nav-cta');
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

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileMenu.setAttribute('aria-hidden', !isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    /* Always show navbar when menu is open */
    if (isOpen) navbar.classList.remove('hidden');

    if (isOpen) {
      gsap.to(mobileLinks, {
        opacity: 1,
        y: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: 'power3.out',
        delay: 0.2,
      });
    } else {
      gsap.set(mobileLinks, { opacity: 0, y: 20 });
    }
  });

  mobileLinks?.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', false);
      mobileMenu.setAttribute('aria-hidden', true);
      document.body.style.overflow = '';
      gsap.set(mobileLinks, { opacity: 0, y: 20 });
    });
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
    duration: 1.2,
    stagger: 0.11,
    ease: 'expo.out',
  }, eyebrow ? '-=0.4' : 0)
    .to(subtitle, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
    .to(ctas, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4');
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
    gsap.to(amenities, {
      opacity: 1,
      y: 0,
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
    btn.setAttribute('aria-expanded', open);
    panel.setAttribute('aria-hidden', !open);
  });

  /* Close panel on outside click */
  document.addEventListener('click', (e) => {
    if (!stickyBook.contains(e.target)) {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    }
  });
}

/* ── Theme Toggle ────────────────────────────────────────── */
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;

  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggle.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#0e0b08' : '#faf8f5');
  }

  applyTheme(isDark);

  toggle.addEventListener('click', () => {
    const currentDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!currentDark);
  });
}

/* ── Attractions 3D mouse tilt ────────────────────────────── */
function initAttractionsTilt() {
  document.querySelectorAll('.attraction-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const mx = ((e.clientX - left) / width - 0.5) * 2;
      const my = ((e.clientY - top) / height - 0.5) * 2;
      gsap.to(card, {
        rotateY: mx * 10,
        rotateX: -my * 8,
        duration: 0.4,
        ease: 'power2.out',
        transformPerspective: 1200,
        transformOrigin: 'center center',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
    });
  });
}

/* Attractions: simple reveal + 3D hover handled by initAttractionsTilt */
(function initAttractionsReveal() {
  const cards = document.querySelectorAll('.attraction-card');
  if (!cards.length || typeof gsap === 'undefined') return;
  gsap.from(cards, {
    y: 60,
    opacity: 0,
    duration: 0.9,
    stagger: 0.15,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.attractions-grid', start: 'top 80%' },
  });
})();