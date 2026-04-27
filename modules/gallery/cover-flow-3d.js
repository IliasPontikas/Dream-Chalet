/**
 * cover-flow-3d.js — Apple-style 3D Cover Flow carousel + fullscreen overlay
 *
 * Dependencies: GSAP core + Draggable plugin (optional Lenis for scroll lock)
 *
 * HTML structure expected:
 *   <div class="coverflow-stage">
 *     <div id="coverflow-track" class="coverflow-track">
 *       <div class="gallery-slide"><img src="..." alt="..."></div>
 *       ...
 *     </div>
 *     <div class="coverflow-controls">
 *       <button id="coverflow-prev">‹</button>
 *       <button id="coverflow-next">›</button>
 *     </div>
 *   </div>
 *   <div id="coverflow-dots" class="coverflow-dots"></div>
 *   <div id="gallery-overlay" class="gallery-overlay">
 *     <img id="gallery-overlay-img">
 *     <button id="gallery-close">✕</button>
 *     <button id="gallery-prev">‹</button>
 *     <button id="gallery-next">›</button>
 *   </div>
 *
 * Usage:
 *   initCoverFlow();                     // all defaults
 *   initCoverFlow({ swipeThreshold: 40, dragResistance: 0.3 });
 */
function initCoverFlow(opts = {}) {
  'use strict';

  const o = {
    trackId:        'coverflow-track',
    dotsId:         'coverflow-dots',
    prevId:         'coverflow-prev',
    nextId:         'coverflow-next',
    overlayId:      'gallery-overlay',
    overlayImgId:   'gallery-overlay-img',
    closeId:        'gallery-close',
    arrowPrevId:    'gallery-prev',
    arrowNextId:    'gallery-next',
    swipeCooldown:  400,   // ms between swipes
    swipeThreshold: 50,    // px drag distance to trigger slide change
    dragResistance: 0.25,  // 0 = no resistance, 1 = no movement
    dotCount:       5,     // always odd so active dot stays centered
    dotScales:      [1.5, 0.75, 0.45], // scale for center, ±1, ±2
    ...opts,
  };

  const track      = document.getElementById(o.trackId);
  const dotsEl     = document.getElementById(o.dotsId);
  const prevBtn    = document.getElementById(o.prevId);
  const nextBtn    = document.getElementById(o.nextId);
  const overlay    = document.getElementById(o.overlayId);
  const overlayImg = document.getElementById(o.overlayImgId);
  const closeBtn   = document.getElementById(o.closeId);
  const arrowPrev  = document.getElementById(o.arrowPrevId);
  const arrowNext  = document.getElementById(o.arrowNextId);

  if (!track) return;

  const slides  = Array.from(track.querySelectorAll('.gallery-slide'));
  const total   = slides.length;
  let current   = 0;
  const DOT_HALF = Math.floor(o.dotCount / 2);

  /* ── Dot indicator strip ─────────────────────────────── */
  if (dotsEl) {
    for (let d = 0; d < o.dotCount; d++) {
      const dot = document.createElement('button');
      dot.className = 'coverflow-dot' + (d === DOT_HALF ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dotsEl.appendChild(dot);
      dot.addEventListener('click', () => {
        const delta = d - DOT_HALF;
        goTo(current + delta, delta > 0 ? 1 : -1);
      });
    }
  }

  function updateDots() {
    dotsEl?.querySelectorAll('.coverflow-dot').forEach((dot, d) => {
      const dist     = Math.abs(d - DOT_HALF);
      const slideIdx = ((current + d - DOT_HALF) % total + total) % total;
      dot.classList.toggle('active', d === DOT_HALF);
      dot.setAttribute('aria-label', `Image ${slideIdx + 1} of ${total}`);
      dot.style.setProperty('--dot-s', o.dotScales[Math.min(dist, 2)]);
    });
  }

  function animateDots(dir) {
    if (!dotsEl || dir === 0) return;
    gsap.fromTo(dotsEl,
      { x: dir * -10 },
      { x: 0, duration: 0.55, ease: 'elastic.out(1, 0.65)' }
    );
    const activeDot = dotsEl.querySelectorAll('.coverflow-dot')[DOT_HALF];
    if (activeDot) {
      activeDot.classList.remove('bounce');
      void activeDot.offsetWidth; // reflow to restart animation
      activeDot.classList.add('bounce');
    }
  }

  /* ── Slide positioning via data-pos attribute ────────── */
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

  function goTo(idx, dir) {
    current = ((idx % total) + total) % total;
    layout();
    animateDots(dir || 0);
  }

  prevBtn?.addEventListener('click', () => goTo(current - 1, -1));
  nextBtn?.addEventListener('click', () => goTo(current + 1,  1));

  document.addEventListener('keydown', (e) => {
    if (overlay?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  goTo(current - 1, -1);
    if (e.key === 'ArrowRight') goTo(current + 1,  1);
  });

  /* ── GSAP Draggable swipe ────────────────────────────── */
  let dragStartX  = 0;
  let isDragging  = false;
  let lastSwipeAt = 0;

  if (typeof Draggable !== 'undefined') {
    Draggable.create(track, {
      type: 'x',
      inertia: false,
      dragResistance: o.dragResistance,
      cursor: 'grab',
      activeCursor: 'grabbing',
      onDragStart() { isDragging = true; dragStartX = this.x; },
      onDragEnd() {
        const dx  = this.x - dragStartX;
        const now = performance.now();
        gsap.set(track, { x: 0 });
        if (Math.abs(dx) > o.swipeThreshold && now - lastSwipeAt > o.swipeCooldown) {
          const dir = dx > 0 ? -1 : 1;
          goTo(current + dir, dir);
          lastSwipeAt = now;
        }
        setTimeout(() => { isDragging = false; }, 150);
      },
    });
  }

  /* Click center slide → open overlay; click side slide → navigate */
  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => {
      if (isDragging) return;
      if (slide.dataset.pos === '0') {
        openOverlay(i);
      } else {
        goTo(i, parseInt(slide.dataset.pos) > 0 ? 1 : -1);
      }
    });
  });

  /* ── Fullscreen overlay ──────────────────────────────── */
  let overlayIndex = 0;

  function openOverlay(idx) {
    if (!overlay || !overlayImg) return;
    overlayIndex = idx;
    const img = slides[idx].querySelector('img');
    overlayImg.src = img?.src || '';
    overlayImg.alt = img?.alt || '';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    closeBtn?.focus();
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.__lenis) window.__lenis.start();
  }

  function overlayNav(dir) {
    if (!overlay || !overlayImg) return;
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
  arrowNext?.addEventListener('click', () => overlayNav(1));

  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });

  document.addEventListener('keydown', (e) => {
    if (!overlay?.classList.contains('open')) return;
    if (e.key === 'Escape')     closeOverlay();
    if (e.key === 'ArrowLeft')  overlayNav(-1);
    if (e.key === 'ArrowRight') overlayNav(1);
  });

  /* Touch swipe on overlay */
  let overlayTouchStartX = 0;
  overlay?.addEventListener('touchstart', (e) => { overlayTouchStartX = e.touches[0].clientX; }, { passive: true });
  overlay?.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - overlayTouchStartX;
    if (Math.abs(dx) > 50) overlayNav(dx > 0 ? -1 : 1);
  }, { passive: true });

  /* Mouse drag on overlay image */
  let overlayDragStartX = null;
  overlayImg?.addEventListener('mousedown', (e) => {
    overlayDragStartX = e.clientX;
    overlayImg.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (overlayDragStartX === null) return;
    const dx = e.clientX - overlayDragStartX;
    overlayDragStartX = null;
    if (overlayImg) overlayImg.style.cursor = '';
    if (Math.abs(dx) > 50 && overlay?.classList.contains('open')) overlayNav(dx > 0 ? -1 : 1);
  });

  layout();
}
