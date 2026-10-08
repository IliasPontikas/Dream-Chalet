/* gallery.js — Bento grid with room filters, live video tiles, and a lightbox */

function initGallery() {
  'use strict';

  const grid = document.getElementById('bento');
  if (!grid) return;

  const items    = Array.from(grid.querySelectorAll('.bento-item'));
  const tabs     = Array.from(document.querySelectorAll('.gallery-tab'));
  const box      = document.getElementById('lightbox');
  const media    = document.getElementById('lightbox-media');
  const caption  = document.getElementById('lightbox-caption');
  const count    = document.getElementById('lightbox-count');
  const btnClose = document.getElementById('lightbox-close');
  const btnPrev  = document.getElementById('lightbox-prev');
  const btnNext  = document.getElementById('lightbox-next');
  const reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const altOf = (el) => {
    const m = el.querySelector('img, video');
    if (!m) return '';
    return document.documentElement.lang === 'en'
      ? (m.dataset.altEn || m.alt || m.getAttribute('aria-label') || '')
      : (m.alt || m.getAttribute('aria-label') || '');
  };

  /* ── Video tiles play only while visible ─────────────────── */
  const tileVideos = grid.querySelectorAll('video');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          if (target.preload === 'none') target.preload = 'auto';
          target.play().catch(() => {});
        } else {
          target.pause();
        }
      });
    }, { threshold: 0.35 });
    tileVideos.forEach((v) => io.observe(v));
  }

  /* ── Filters ─────────────────────────────────────────────── */
  function applyFilter(filter) {
    const state = typeof Flip !== 'undefined' && !reduce ? Flip.getState(items) : null;

    items.forEach((el) => {
      el.hidden = !(filter === 'all' || el.dataset.cat === filter);
    });
    grid.classList.toggle('is-filtered', filter !== 'all');

    if (state) {
      Flip.from(state, {
        duration: 0.6,
        ease: 'power3.inOut',
        absolute: true,
        scale: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      applyFilter(tab.dataset.filter);
    });
  });

  /* ── Lightbox ────────────────────────────────────────────── */
  if (!box || !media) return;

  let list = [];
  let index = 0;
  let lastFocus = null;

  function render() {
    const el = list[index];
    if (!el) return;
    media.innerHTML = '';
    let node;
    if (el.dataset.kind === 'vid') {
      node = document.createElement('video');
      node.src = el.dataset.full;
      node.muted = true;
      node.loop = true;
      node.playsInline = true;
      node.autoplay = true;
      node.controls = false;
    } else {
      node = document.createElement('img');
      node.src = el.dataset.full;
      node.decoding = 'async';
    }
    node.alt = altOf(el);
    media.appendChild(node);
    if (node.play) node.play().catch(() => {});
    caption.textContent = altOf(el);
    count.textContent = `${index + 1} / ${list.length}`;
    if (!reduce && typeof gsap !== 'undefined') {
      gsap.fromTo(node, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
    }
  }

  function open(el) {
    list = items.filter((i) => !i.hidden);
    index = Math.max(0, list.indexOf(el));
    lastFocus = document.activeElement;
    render();
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();
    btnClose?.focus();
    if (typeof gtag === 'function') gtag('event', 'gallery_open');
  }

  function close() {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.__lenis?.start();
    media.innerHTML = '';
    lastFocus?.focus?.();
  }

  const step = (d) => { index = (index + d + list.length) % list.length; render(); };

  items.forEach((el) => el.addEventListener('click', () => open(el)));
  btnClose?.addEventListener('click', close);
  btnPrev?.addEventListener('click', () => step(-1));
  btnNext?.addEventListener('click', () => step(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });

  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* Swipe on touch screens */
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });
}
