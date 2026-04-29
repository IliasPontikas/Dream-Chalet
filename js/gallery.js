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
  let current  = 0;

  /* ── Condensed dot indicators (always 5, active always center) ─ */
  const DOT_COUNT  = 5;
  const DOT_HALF   = Math.floor(DOT_COUNT / 2);
  const DOT_SCALES = [1.5, 0.75, 0.45]; /* center, ±1, ±2 */

  if (dotsEl) {
    for (let d = 0; d < DOT_COUNT; d++) {
      const dot = document.createElement('button');
      dot.className = 'coverflow-dot' + (d === DOT_HALF ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dotsEl.appendChild(dot);
      dot.addEventListener('click', () => goTo(current + (d - DOT_HALF), d - DOT_HALF > 0 ? 1 : -1));
    }
  }

  function updateDots() {
    dotsEl?.querySelectorAll('.coverflow-dot').forEach((dot, d) => {
      const dist     = Math.abs(d - DOT_HALF);
      const slideIdx = ((current + d - DOT_HALF) % total + total) % total;
      dot.classList.toggle('active', d === DOT_HALF);
      dot.setAttribute('aria-label', `Image ${slideIdx + 1} of ${total}`);
      dot.style.setProperty('--dot-s', DOT_SCALES[Math.min(dist, 2)]);
    });
  }

  /* Shift dot strip in nav direction + bounce the active center dot */
  function animateDots(dir) {
    if (!dotsEl || dir === 0) return;

    gsap.fromTo(dotsEl,
      { x: dir * -10 },
      { x: 0, duration: 0.55, ease: 'elastic.out(1, 0.65)' }
    );

    const activeDot = dotsEl.querySelectorAll('.coverflow-dot')[DOT_HALF];
    if (activeDot) {
      activeDot.classList.remove('bounce');
      void activeDot.offsetWidth; /* reflow to restart animation */
      activeDot.classList.add('bounce');
    }
  }

  /* ── Layout: assign data-pos to each slide (shortest-path) ─── */
  function layout() {
    slides.forEach((slide, i) => {
      let pos = i - current;
      if (pos >  total / 2) pos -= total;
      if (pos < -total / 2) pos += total;
      pos = Math.max(-5, Math.min(5, pos));
      slide.dataset.pos = pos;
    });
    updateDots();
  }

  /* ── Navigate ────────────────────────────────────────── */
  function goTo(idx, dir) {
    current = ((idx % total) + total) % total;
    layout();
    animateDots(dir || 0);
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1, -1));
  nextBtn?.addEventListener('click', () => goTo(current + 1,  1));

  /* ── Keyboard nav ────────────────────────────────────── */
  document.addEventListener('keydown', (e) => {
    if (overlay.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  goTo(current - 1, -1);
    if (e.key === 'ArrowRight') goTo(current + 1,  1);
  });

  /* ── Drag + swipe via GSAP Draggable ──────────────────── */
  let dragStartX  = 0;
  let isDragging  = false;
  let lastSwipeAt = 0;
  const SWIPE_COOLDOWN = 400;
  const THRESHOLD      = 50; /* px — lower = easier to swipe */

  if (typeof Draggable !== 'undefined') {
    Draggable.create(track, {
      type: 'x',
      inertia: false,
      dragResistance: 0.25,
      cursor: 'grab',
      activeCursor: 'grabbing',
      onDragStart() {
        isDragging = true;
        dragStartX = this.x;
      },
      onDragEnd() {
        const dx  = this.x - dragStartX;
        const now = performance.now();
        gsap.set(track, { x: 0 });

        if (Math.abs(dx) > THRESHOLD && now - lastSwipeAt > SWIPE_COOLDOWN) {
          const dir = dx > 0 ? -1 : 1;
          goTo(current + dir, dir);
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
        const dir = parseInt(slide.dataset.pos) > 0 ? 1 : -1;
        goTo(i, dir);
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
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    closeBtn?.focus();
  }

  function closeOverlay() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
  }

  function overlayNav(dir) {
    overlayIndex = ((overlayIndex + dir + total) % total);
    const img = slides[overlayIndex].querySelector('img');
    if (!img) return;
    gsap.to(overlayImg, {
      opacity: 0, x: dir * -40, duration: 0.18,
      onComplete() {
        overlayImg.src = img.src;
        overlayImg.alt = img.alt;
        gsap.fromTo(overlayImg,
          { opacity: 0, x: dir * 40 },
          { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' }
        );
      },
    });
  }

  closeBtn?.addEventListener('click', closeOverlay);
  arrowPrev?.addEventListener('click', () => overlayNav(-1));
  arrowNext?.addEventListener('click', () => overlayNav( 1));

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')     closeOverlay();
    if (e.key === 'ArrowLeft')  overlayNav(-1);
    if (e.key === 'ArrowRight') overlayNav( 1);
  });

  /* Close on backdrop click */
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  /* ── Overlay swipe (touch) ───────────────────────────── */
  let overlayTouchStartX = 0;
  overlay.addEventListener('touchstart', (e) => {
    overlayTouchStartX = e.touches[0].clientX;
  }, { passive: true });
  overlay.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - overlayTouchStartX;
    if (Math.abs(dx) > 50) overlayNav(dx > 0 ? -1 : 1);
  }, { passive: true });

  /* ── Overlay drag (mouse) ────────────────────────────── */
  let overlayDragStartX = null;
  overlayImg.addEventListener('mousedown', (e) => {
    overlayDragStartX = e.clientX;
    overlayImg.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (overlayDragStartX === null) return;
    const dx = e.clientX - overlayDragStartX;
    overlayDragStartX = null;
    overlayImg.style.cursor = '';
    if (Math.abs(dx) > 50 && overlay.classList.contains('open')) {
      overlayNav(dx > 0 ? -1 : 1);
    }
  });

  /* ── Init ────────────────────────────────────────────── */
  layout();
}
