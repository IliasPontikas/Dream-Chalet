/* gallery.js — Cover Flow 3D carousel + fullscreen overlay */

function initGallery() {
  'use strict';

  const track   = document.getElementById('coverflow-track');
  const dotsEl  = document.getElementById('coverflow-dots');
  const prevBtn = document.getElementById('coverflow-prev');
  const nextBtn = document.getElementById('coverflow-next');
  const overlay = document.getElementById('gallery-overlay');
  const overlayImg = document.getElementById('gallery-overlay-img');
  const closeBtn   = document.getElementById('gallery-close');
  const arrowPrev  = document.getElementById('gallery-prev');
  const arrowNext  = document.getElementById('gallery-next');

  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.gallery-slide'));
  const total  = slides.length;
  let current  = Math.floor(total / 2); /* Start centered */

  /* ── Build dot indicators ────────────────────────────── */
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'coverflow-dot' + (i === current ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Image ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl?.appendChild(dot);
  });

  /* ── Layout: assign data-pos to each slide (shortest-path) ─── */
  function layout() {
    slides.forEach((slide, i) => {
      let pos = i - current;
      /* Wrap to shortest path: range -total/2 .. +total/2 */
      if (pos >  total / 2) pos -= total;
      if (pos < -total / 2) pos += total;
      slide.dataset.pos = pos;
    });
    dotsEl?.querySelectorAll('.coverflow-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  /* ── Navigate ────────────────────────────────────────── */
  function goTo(idx) {
    current = ((idx % total) + total) % total;
    layout();
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));

  /* ── Keyboard nav ────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  /* ── Drag + swipe via GSAP Draggable (handles both mouse & touch) ── */
  let dragStartX = 0;
  let isDragging = false;
  let lastSwipeAt = 0;
  const SWIPE_COOLDOWN = 450; /* ms — matches slide transition so we don't skip */
  const THRESHOLD = 80;       /* px — minimum drag distance to count as swipe */

  if (typeof Draggable !== 'undefined') {
    Draggable.create(track, {
      type: 'x',
      inertia: false,
      dragResistance: 0.6,
      cursor: 'grab',
      activeCursor: 'grabbing',
      onDragStart() {
        isDragging = true;
        dragStartX = this.x;
      },
      onDragEnd() {
        const dx  = this.x - dragStartX;
        const now = performance.now();
        gsap.to(track, { x: 0, duration: 0.3, ease: 'power2.out' });

        if (Math.abs(dx) > THRESHOLD && now - lastSwipeAt > SWIPE_COOLDOWN) {
          goTo(current + (dx > 0 ? -1 : 1));
          lastSwipeAt = now;
        }
        setTimeout(() => { isDragging = false; }, 150);
      },
    });
  }

  /* ── Click slide to open fullscreen ─────────────────── */
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (isDragging) return;
      if (slide.dataset.pos === '0') {
        openOverlay(i);
      } else {
        goTo(i);
      }
    });
  });

  /* ── Fullscreen overlay ──────────────────────────────── */
  let overlayIndex = 0;

  function openOverlay(idx) {
    overlayIndex = idx;
    const src = slides[idx].querySelector('img')?.src || '';
    const alt = slides[idx].querySelector('img')?.alt || '';
    overlayImg.src = src;
    overlayImg.alt = alt;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', false);
    document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    closeBtn?.focus();
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', true);
    document.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
  }

  function overlayNav(dir) {
    overlayIndex = ((overlayIndex + dir + total) % total);
    const img = slides[overlayIndex].querySelector('img');
    if (!img) return;
    gsap.to(overlayImg, {
      opacity: 0, x: dir * -30, duration: 0.15,
      onComplete() {
        overlayImg.src = img.src;
        overlayImg.alt = img.alt;
        gsap.fromTo(overlayImg, { opacity: 0, x: dir * 30 }, { opacity: 1, x: 0, duration: 0.2 });
      },
    });
  }

  closeBtn?.addEventListener('click', closeOverlay);
  arrowPrev?.addEventListener('click', () => overlayNav(-1));
  arrowNext?.addEventListener('click', () => overlayNav(1));

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')      closeOverlay();
    if (e.key === 'ArrowLeft')   overlayNav(-1);
    if (e.key === 'ArrowRight')  overlayNav(1);
  });

  /* Close on backdrop click */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  /* ── Init ────────────────────────────────────────────── */
  layout();
}