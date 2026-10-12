/* gallery.js — Cover flow on desktop, bento grid on tablets/phones (CSS decides which is visible) */

function initGallery() {
  initRoomTags();
  initCoverflow();
  initBento();
}

/* "Υπνοδωμάτιο 1 / 2 / 3" on bedroom photos (data-room), in the current language */
const ROOM_WORD = { el: 'Υπνοδωμάτιο', en: 'Bedroom' };
function roomLabel(el) {
  const n = el?.dataset.room;
  return n ? `${ROOM_WORD[document.documentElement.lang === 'en' ? 'en' : 'el']} ${n}` : '';
}
function initRoomTags() {
  const els = Array.from(document.querySelectorAll('.gallery-slide[data-room], .bento-item[data-room]'));
  els.forEach((el) => {
    const tag = document.createElement('span');
    tag.className = 'room-tag';
    tag.setAttribute('aria-hidden', 'true');
    el.appendChild(tag);
  });
  const update = () => els.forEach((el) => { el.querySelector('.room-tag').textContent = roomLabel(el); });
  update();
  document.addEventListener('lang:change', update);
}

/* Desktop: 3D cover flow + fullscreen overlay */
function initCoverflow() {
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
    const img0 = slides[idx].querySelector('img');
    const src = img0?.dataset.full || img0?.src || '';
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
        overlayImg.src = img.dataset.full || img.src;
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

/* Tablet & phone: one room at a time as a full-width swipe slider.
   All sizes: "All photos" opens a full-screen grid; any photo opens the lightbox. */
function initBento() {
  'use strict';

  const track = document.getElementById('bento');
  if (!track) return;

  const items    = Array.from(track.querySelectorAll('.bento-item'));
  const tabs     = Array.from(document.querySelectorAll('.gallery-tab'));
  const counter  = document.getElementById('gallery-counter');
  const allBtn   = document.getElementById('gallery-all');
  const sheet    = document.getElementById('gallery-grid');
  const sheetList  = document.getElementById('gallery-grid-list');
  const sheetClose = document.getElementById('gallery-grid-close');
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
    const alt = document.documentElement.lang === 'en'
      ? (m.dataset.altEn || m.alt || m.getAttribute('aria-label') || '')
      : (m.alt || m.getAttribute('aria-label') || '');
    const room = roomLabel(el);
    return room ? `${room} · ${alt}` : alt;
  };
  const visible = () => items.filter((i) => !i.hidden);

  /* ── Video slides play only while visible ────────────────── */
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
    }, { threshold: 0.5 });
    track.querySelectorAll('video').forEach((v) => io.observe(v));
  }

  /* ── Slider position: "2 / 7" ───────────────────────────── */
  function current() {
    const w = track.clientWidth || 1;
    return Math.round(track.scrollLeft / w);
  }
  function updateCounter() {
    if (!counter) return;
    const n = visible().length;
    counter.textContent = n ? `${Math.min(current() + 1, n)} / ${n}` : '';
    const i = current();
    const prev = track.parentNode.querySelector('.bento-arrow-prev');
    const next = track.parentNode.querySelector('.bento-arrow-next');
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= n - 1;
  }
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(updateCounter);
  }, { passive: true });

  /* ── Slider: one photo per swipe / drag / arrow / wheel ─────
     Native scroll-snap felt sticky on phones, and with a mouse there
     was no way to move at all. The finger (or mouse) now drags the
     strip directly and it settles on the next photo on release. */
  const fine = window.matchMedia('(pointer: fine)').matches;
  const wrap = document.createElement('div');
  wrap.className = 'bento-wrap';
  track.parentNode.insertBefore(wrap, track);
  wrap.appendChild(track);
  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `bento-arrow bento-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'prev' ? 'Previous photo' : 'Next photo');
    b.innerHTML = `<svg class="icon" aria-hidden="true"><use href="images/icons.svg#fa-chevron-${dir === 'prev' ? 'left' : 'right'}"></use></svg>`;
    wrap.appendChild(b);
    return b;
  };
  const arrowPrev = mkArrow('prev');
  const arrowNext = mkArrow('next');

  let tween = null;
  function goTo(i, instant) {
    const n = visible().length;
    const w = track.clientWidth || 1;
    i = Math.max(0, Math.min(n - 1, i));
    tween?.kill?.();
    if (instant || reduce || typeof gsap === 'undefined') { track.scrollLeft = i * w; updateCounter(); return; }
    tween = gsap.to(track, { scrollLeft: i * w, duration: 0.5, ease: 'power3.out', onUpdate: updateCounter });
  }
  arrowPrev.addEventListener('click', () => goTo(current() - 1));
  arrowNext.addEventListener('click', () => goTo(current() + 1));
  track.tabIndex = 0;
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
  });

  /* Drag with finger or mouse; vertical page scrolling stays native
     (touch-action: pan-y), so only sideways moves reach us */
  let drag = null;
  let suppressClick = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    tween?.kill?.();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: track.scrollLeft, start: current(), t: performance.now(), moved: false };
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(e.clientY - drag.y) > Math.abs(dx)) { drag = null; return; }
      drag.moved = true;
      track.setPointerCapture?.(e.pointerId);
      track.classList.add('is-dragging');
    }
    drag.lastX = e.clientX;
    drag.vx = (e.clientX - (drag.px ?? drag.x)) / Math.max(1, e.timeStamp - (drag.pt ?? e.timeStamp - 16));
    drag.px = e.clientX;
    drag.pt = e.timeStamp;
    track.scrollLeft = drag.left - dx;
    updateCounter();
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    track.classList.remove('is-dragging');
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 50);
    const dx = (e.type === 'pointercancel' ? d.lastX ?? d.x : e.clientX) - d.x;
    const w = track.clientWidth || 1;
    const fast = Math.abs(d.vx || 0) > 0.3 && Math.sign(d.vx) === Math.sign(dx);   /* a flick (px/ms) */
    let i = d.start;
    if (Math.abs(dx) > w * 0.18 || (fast && Math.abs(dx) > 20)) i += dx < 0 ? 1 : -1;
    goTo(i);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  /* A drag shouldn't also open the photo */
  track.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  track.addEventListener('dragstart', (e) => e.preventDefault());

  /* Trackpad sideways swipe / shift+wheel: one photo per gesture.
     Stopped here so the page's smooth scroller doesn't swallow it. */
  let wheelLock = 0;
  track.addEventListener('wheel', (e) => {
    const dx = e.shiftKey ? e.deltaY : e.deltaX;
    if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY) || Math.abs(dx) < 4) return;
    e.preventDefault();
    e.stopPropagation();
    const now = performance.now();
    if (now < wheelLock) return;
    wheelLock = now + 450;
    goTo(current() + (dx > 0 ? 1 : -1));
  }, { passive: false });

  /* Stay on the same photo when the window is resized */
  let lastW = track.clientWidth || 1;
  window.addEventListener('resize', () => {
    const idx = Math.round(track.scrollLeft / lastW);
    lastW = track.clientWidth || 1;
    goTo(idx, true);
  });
  if (!fine) wrap.classList.add('is-touch');

  /* ── Room tabs ──────────────────────────────────────────── */
  function applyFilter(filter) {
    items.forEach((el) => { el.hidden = el.dataset.cat !== filter; });
    track.scrollTo({ left: 0, behavior: 'auto' });
    if (!reduce && typeof gsap !== 'undefined') {
      gsap.fromTo(visible().slice(0, 2), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 });
    }
    updateCounter();
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
  const allCount = document.getElementById('gallery-all-count');
  if (allCount) allCount.textContent = String(items.length);
  const first = tabs.find((t) => t.classList.contains('active')) || tabs[0];
  if (first) applyFilter(first.dataset.filter);

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

  const lockScroll = () => { document.body.style.overflow = 'hidden'; window.__lenis?.stop(); };
  const unlockScroll = () => {
    if (box.classList.contains('open') || sheet?.classList.contains('open')) return;
    document.body.style.overflow = '';
    window.__lenis?.start();
  };

  function open(source, el) {
    list = source;
    index = Math.max(0, list.indexOf(el));
    lastFocus = document.activeElement;
    render();
    box.classList.add('open');
    box.setAttribute('aria-hidden', 'false');
    lockScroll();
    btnClose?.focus();
    if (typeof gtag === 'function') gtag('event', 'gallery_open');
  }
  function close() {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    media.innerHTML = '';
    unlockScroll();
    lastFocus?.focus?.();
  }
  const step = (d) => { index = (index + d + list.length) % list.length; render(); };

  items.forEach((el) => el.addEventListener('click', () => open(visible(), el)));
  btnClose?.addEventListener('click', close);
  btnPrev?.addEventListener('click', () => step(-1));
  btnNext?.addEventListener('click', () => step(1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });

  /* Swipe inside the lightbox */
  let x0 = null;
  box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });

  /* ── "All photos": justified rows, grouped by room ──────────
     Each photo keeps its real shape; rows share one height and fill
     the width. Clips play while visible, tiles reveal on scroll. */
  if (sheet && sheetList && allBtn) {
    const ORDER = ['living', 'rooms', 'bath', 'details'];
    const labelFor = (cat) => tabs.find((t) => t.dataset.filter === cat)?.textContent.trim() || cat;
    const ordered = [];
    const chipsEl = document.getElementById('gallery-grid-chips');
    const groups = [];

    ORDER.forEach((cat) => {
      const groupItems = items.filter((el) => el.dataset.cat === cat);
      if (!groupItems.length) return;

      const group = document.createElement('section');
      group.className = 'ggo-group';
      group.id = `ggo-${cat}`;
      group.innerHTML = `
        <header class="ggo-group-head">
          <h4 class="ggo-group-title"></h4>
          <span class="ggo-group-count">${String(groupItems.length).padStart(2, '0')}</span>
        </header>
        <div class="ggo-bento"></div>`;
      const bento = group.querySelector('.ggo-bento');

      groupItems.forEach((el, i) => {
        ordered.push(el);
        const media = el.querySelector('img, video');
        const ratio = (+media?.getAttribute('width') || 4) / (+media?.getAttribute('height') || 3);

        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ggo-tile';
        /* Justified rows: width grows with the photo's aspect ratio, so every
           row has one height and fills the full width */
        b.style.setProperty('--r', ratio.toFixed(3));
        b.style.setProperty('--d', `${(i % 4) * 70}ms`);
        b.setAttribute('aria-label', altOf(el));

        if (el.dataset.kind === 'vid') {
          const v = document.createElement('video');
          v.src = el.dataset.full;
          v.poster = media.getAttribute('poster') || '';
          v.muted = true; v.loop = true; v.playsInline = true;
          v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
          v.preload = 'none';
          b.classList.add('is-video');
          b.appendChild(v);
        } else {
          const img = document.createElement('img');
          img.src = media.getAttribute('src');
          img.alt = '';
          img.loading = 'lazy';
          img.decoding = 'async';
          b.appendChild(img);
        }
        const cap = document.createElement('span');
        cap.className = 'ggo-cap';
        b.appendChild(cap);
        b.addEventListener('click', () => open(ordered, el));
        b._source = el;
        bento.appendChild(b);
      });

      sheetList.appendChild(group);
      groups.push({ cat, group });

      if (chipsEl) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ggo-chip';
        chip.dataset.cat = cat;
        chip.addEventListener('click', () => {
          const head = sheet.querySelector('.ggo-head');
          sheet.scrollTo({ top: group.offsetTop - (head?.offsetHeight || 0) - 8, behavior: reduce ? 'auto' : 'smooth' });
        });
        chipsEl.appendChild(chip);
      }
    });

    /* Text follows the current language */
    const refreshLabels = () => {
      groups.forEach(({ cat, group }) => {
        group.querySelector('.ggo-group-title').textContent = labelFor(cat);
      });
      chipsEl?.querySelectorAll('.ggo-chip').forEach((c) => { c.textContent = labelFor(c.dataset.cat); });
      sheetList.querySelectorAll('.ggo-tile').forEach((t) => {
        t.querySelector('.ggo-cap').textContent = altOf(t._source);
        t.setAttribute('aria-label', altOf(t._source));
      });
    };
    refreshLabels();
    document.addEventListener('lang:change', refreshLabels);

    /* Reveal tiles + play clips while they are on screen (inside the overlay) */
    const tiles = Array.from(sheetList.querySelectorAll('.ggo-tile'));
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) target.classList.add('in');
          const v = target.querySelector('video');
          if (v) {
            if (isIntersecting && !reduce) { v.preload = 'auto'; v.play().catch(() => {}); }
            else v.pause();
          }
        });
      }, { root: sheet, threshold: 0.15 });
    } else {
      tiles.forEach((t) => t.classList.add('in'));
    }

    /* Highlight the chip of the room you're looking at */
    const syncChips = () => {
      if (!chipsEl) return;
      const head = sheet.querySelector('.ggo-head');
      const y = sheet.scrollTop + (head?.offsetHeight || 0) + 40;
      let current = groups[0]?.cat;
      groups.forEach(({ cat, group }) => { if (group.offsetTop <= y) current = cat; });
      chipsEl.querySelectorAll('.ggo-chip').forEach((c) => c.classList.toggle('active', c.dataset.cat === current));
    };
    sheet.addEventListener('scroll', syncChips, { passive: true });

    const openSheet = () => {
      refreshLabels();
      sheet.classList.add('open');
      sheet.setAttribute('aria-hidden', 'false');
      sheet.scrollTop = 0;
      lockScroll();
      sheetClose?.focus();
      if (reduce || !io) tiles.forEach((t) => t.classList.add('in'));
      else tiles.forEach((t) => io.observe(t));
      syncChips();
    };
    const closeSheet = () => {
      sheet.classList.remove('open');
      sheet.setAttribute('aria-hidden', 'true');
      if (io) tiles.forEach((t) => { io.unobserve(t); t.querySelector('video')?.pause(); });
      unlockScroll();
      allBtn.focus();
    };
    allBtn.addEventListener('click', openSheet);
    sheetClose?.addEventListener('click', closeSheet);

    document.addEventListener('keydown', (e) => {
      if (box.classList.contains('open')) {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      } else if (e.key === 'Escape' && sheet.classList.contains('open')) {
        closeSheet();
      }
    });
  }
}
