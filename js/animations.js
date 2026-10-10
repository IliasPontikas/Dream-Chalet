/* animations.js — nav, hero, section entrances, stats, sticky btn */

function initAnimations() {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    /* No motion: still wire up navbar (scroll-triggered class toggling
       isn't motion), still init all interactive controls, and force
       elements that were hidden in CSS for animation entry to their
       final visible state so the page is usable. */
    document.querySelectorAll(
      '.hero-subtitle, .hero-ctas, .amenity-item'
    ).forEach((el) => { el.style.opacity = '1'; });

    document.querySelectorAll('.hero-title .char').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.filter = 'none';
    });

    /* Stats: snap counters straight to their target value */
    document.querySelectorAll('.stat-number[data-target]').forEach((el) => {
      el.textContent = formatStat(parseFloat(el.dataset.target), el);
    });

    initNav();
    initScrollProgress();
    initStickyBookBtn();
    initAreaCarousel();
    return;
  }

  initNav();
  initHero();
  initSectionEntrances();
  initStats();
  initScrollProgress();
  initStickyBookBtn();
  initAreaCarousel();
}

/* ── Navigation ──────────────────────────────────────────── */
function initNav() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('.mobile-nav-link, .mobile-menu-cta');
  if (!navbar) return;

  /* Transparent while the hero video is behind it; solid once past the hero */
  const hero = document.getElementById('hero');
  const syncSolid = () => {
    const limit = hero ? hero.offsetTop + hero.offsetHeight - navbar.offsetHeight : 60;
    navbar.classList.toggle('scrolled', window.scrollY > limit);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: syncSolid });
  window.addEventListener('resize', syncSolid);
  syncSolid();

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
  /* Letter by letter: each one rises, sharpens and fades in */
  tl.to(chars, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: 1.4,
    stagger: 0.14,
    ease: 'power3.out',
  }, eyebrow ? '-=0.4' : 0.15)
    .to(subtitle, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
    .to(ctas, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.5');

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
  const accent  = document.querySelector('.about-image-accent');
  if (imgWrap) {
    gsap.matchMedia()
      /* Desktop: wipe-in reveal */
      .add('(min-width: 769px)', () => {
        gsap.to(imgWrap, {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: imgWrap, start: 'top 75%' },
        });
        /* Front photo: swings in to its tilt, then floats against the scroll */
        if (accent) {
          gsap.fromTo(accent,
            { opacity: 0, y: 80, rotate: 14, scale: 0.92 },
            { opacity: 1, y: 0, rotate: 4, scale: 1, duration: 1.4, ease: 'power3.out',
              scrollTrigger: { trigger: imgWrap, start: 'top 65%' } });
          gsap.to(accent, {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: { trigger: imgWrap, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          });
        }
      })
      /* Phones: scroll-linked — the photo opens from a framed window to
         full width while it settles from a slow zoom; the small photo
         drifts up over it. Scrubbed with easing for a smooth feel. */
      .add('(max-width: 768px)', () => {
        const img = imgWrap.querySelector('img');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: imgWrap, start: 'top 95%', end: 'center 45%', scrub: 1.2 },
        });
        tl.fromTo(imgWrap,
          { clipPath: 'inset(10% 8% 10% 8% round 18px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.out' }, 0)
          .fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'power2.out' }, 0);
        if (accent) {
          gsap.fromTo(accent,
            { y: 110, opacity: 0, rotate: 14 },
            {
              y: -10, opacity: 1, rotate: 4, ease: 'power2.out',
              scrollTrigger: { trigger: imgWrap, start: 'top 70%', end: 'bottom 85%', scrub: 1.2 },
            });
        }
      });
  }

  /* Amenities (phones): stacking cards — each one tilts up into place,
     the card it covers settles back (smaller, dimmer). All scroll-linked,
     nothing pinned, so it stays quick to scroll through. */
  gsap.matchMedia().add('(max-width: 768px)', () => {
    const cards = gsap.utils.toArray('.astack-card');
    const navH = document.getElementById('navbar')?.offsetHeight || 92;
    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { rotateX: -18, y: 40, opacity: 0.5, transformPerspective: 900 },
        { rotateX: 0, y: 0, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 62%', scrub: 0.5 } });
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.9,
        '--covered': 1,
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top 80%',
          end: () => `top ${navH + 16 + (i + 1) * 12}px`,
          scrub: 0.4,
        },
      });
    });
  });

  /* Amenities stagger */
  const amenities = gsap.utils.toArray('.amenity-item');
  if (amenities.length) {
    /* Fade only — a vertical offset would be clipped by the marquee rows */
    gsap.from(amenities, {
      opacity: 0,
      stagger: 0.05,
      duration: 0.6,
      ease: 'power2.out',
      clearProps: 'opacity',
      scrollTrigger: { trigger: '.amenities-grid', start: 'top 85%', once: true },
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
      scrollTrigger: { trigger: '.contact-primary', start: 'top 85%' },
    });
  });


}

/* ── Stats counters ───────────────────────────────────────── */
/* Decimals from data-decimals; Greek uses a decimal comma (4,97) */
function formatStat(val, el) {
  const d = parseInt(el.dataset.decimals || '0', 10);
  const txt = d ? val.toFixed(d) : String(Math.round(val));
  return document.documentElement.lang === 'el' ? txt.replace('.', ',') : txt;
}

function initStats() {
  document.querySelectorAll('.stat-number[data-target]').forEach((el) => {
    const target = parseFloat(el.dataset.target);
    const obj = { val: 0 };

    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate() {
        el.textContent = formatStat(obj.val, el);
      },
      onComplete() { el.dataset.done = '1'; },
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  /* Keep the decimal separator in sync with the language */
  document.addEventListener('lang:change', () => {
    document.querySelectorAll('.stat-number[data-done]').forEach((el) => {
      el.textContent = formatStat(parseFloat(el.dataset.target), el);
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

/* ── Area (phones): places as a full-width swipe carousel with dots ── */
function initAreaCarousel() {
  const list = document.querySelector('.attractions-list');
  const dotsEl = document.getElementById('area-dots');
  if (!list || !dotsEl) return;
  const cards = Array.from(list.querySelectorAll('.attraction-card'));
  dotsEl.innerHTML = cards.map(() => '<span class="area-dot"></span>').join('');
  const dots = Array.from(dotsEl.children);
  const sync = () => {
    const i = Math.round(list.scrollLeft / (list.clientWidth || 1));
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
  };
  let raf = 0;
  list.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
  sync();
}
