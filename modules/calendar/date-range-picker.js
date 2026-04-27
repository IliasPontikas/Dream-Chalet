/**
 * date-range-picker.js — Interactive date-range availability calendar
 *
 * Two-click selection: first click = check-in, second = check-out.
 * Prevents spanning over booked dates. Shows an animated modal with
 * customisable action buttons.
 *
 * Dependencies: GSAP core (optional — modal animates without it too)
 *
 * HTML structure expected:
 *   <div id="calendar-container"></div>
 *   <input type="date" id="checkin-date">
 *   <input type="date" id="checkout-date">
 *   <button id="check-availability">Check</button>
 *
 * Usage:
 *   initDateRangePicker({
 *     bookedDates: ['2026-05-01', '2026-05-02', '2026-05-15'],
 *     onAvailable(nights, checkIn, checkOut) {
 *       // show your booking modal
 *     },
 *     onUnavailable(checkIn, checkOut) {
 *       // show unavailable message
 *     },
 *   });
 */
function initDateRangePicker(opts = {}) {
  'use strict';

  const o = {
    containerId:   'calendar-container',
    checkinId:     'checkin-date',
    checkoutId:    'checkout-date',
    checkBtnId:    'check-availability',
    bookedDates:   [],   // array of 'YYYY-MM-DD' strings
    days:          ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months:        ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'],
    onAvailable:   null,  // fn(nights, checkIn, checkOut) → default shows modal
    onUnavailable: null,  // fn(checkIn, checkOut)
    whatsappNumber: '',   // e.g. '306976908838' — shown in default available modal
    airbnbUrl:     '',
    ...opts,
  };

  const container     = document.getElementById(o.containerId);
  if (!container) return;

  const BOOKED        = new Set(o.bookedDates);
  const checkinInput  = document.getElementById(o.checkinId);
  const checkoutInput = document.getElementById(o.checkoutId);
  const checkBtn      = document.getElementById(o.checkBtnId);

  let viewDate  = new Date(); viewDate.setDate(1);
  let checkIn   = null;
  let checkOut  = null;

  const pad         = (n) => String(n).padStart(2, '0');
  const dateKey     = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const keyFromDate = (dt) => dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate());

  const isToday = (y, m, d) => {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  };
  const isPast = (y, m, d) => new Date(y, m, d) < new Date(new Date().setHours(0, 0, 0, 0));
  const inRange = (key) =>
    checkIn && checkOut && key > keyFromDate(checkIn) && key < keyFromDate(checkOut);

  function renderMonth(y, m) {
    const firstDay    = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const ciKey = checkIn  ? keyFromDate(checkIn)  : null;
    const coKey = checkOut ? keyFromDate(checkOut) : null;

    let html = `
      <div class="calendar-month-header">
        <button class="calendar-nav-btn" id="cal-prev" aria-label="Previous month">‹</button>
        <span class="calendar-month-title">${o.months[m]} ${y}</span>
        <button class="calendar-nav-btn" id="cal-next" aria-label="Next month">›</button>
      </div>
      <div class="calendar-grid">
        ${o.days.map((d) => `<div class="calendar-day-header">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="calendar-day empty"></div>').join('')}
    `;

    for (let d = 1; d <= daysInMonth; d++) {
      const key    = dateKey(y, m, d);
      const booked = BOOKED.has(key);
      const today  = isToday(y, m, d);
      const past   = isPast(y, m, d);
      let cls      = 'calendar-day';
      if (past)        cls += ' past';
      else if (booked) cls += ' booked';
      else             cls += ' available cal-day-selectable';
      if (today)       cls += ' today';
      if (key === ciKey) cls += ' selected-in';
      if (key === coKey) cls += ' selected-out';
      if (!booked && !past && inRange(key)) cls += ' in-range';
      const attrs = (!past && !booked) ? `data-key="${key}" data-y="${y}" data-m="${m}" data-d="${d}"` : '';
      html += `<div class="${cls}" ${attrs}>${d}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;

    document.getElementById('cal-prev')?.addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      renderMonth(viewDate.getFullYear(), viewDate.getMonth());
    });
    document.getElementById('cal-next')?.addEventListener('click', () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      renderMonth(viewDate.getFullYear(), viewDate.getMonth());
    });

    container.querySelectorAll('.cal-day-selectable').forEach((cell) => {
      cell.addEventListener('click', () => {
        const { y: cy, m: cm, d: cd } = cell.dataset;
        const clicked = new Date(+cy, +cm, +cd);

        if (!checkIn || (checkIn && checkOut)) {
          checkIn = clicked; checkOut = null;
        } else {
          if (clicked <= checkIn) {
            checkIn = clicked;
          } else {
            let cur = new Date(checkIn.getTime()); cur.setDate(cur.getDate() + 1);
            let conflict = false;
            while (cur < clicked) {
              if (BOOKED.has(keyFromDate(cur))) { conflict = true; break; }
              cur.setDate(cur.getDate() + 1);
            }
            if (conflict) { checkIn = clicked; checkOut = null; }
            else          { checkOut = clicked; }
          }
        }

        if (checkinInput)  checkinInput.value  = checkIn  ? keyFromDate(checkIn)  : '';
        if (checkoutInput) checkoutInput.value = checkOut ? keyFromDate(checkOut) : '';
        renderMonth(viewDate.getFullYear(), viewDate.getMonth());
      });
    });
  }

  checkinInput?.addEventListener('change', () => {
    const v = checkinInput.value;
    checkIn = v ? new Date(v + 'T12:00:00') : null;
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });
  checkoutInput?.addEventListener('change', () => {
    const v = checkoutInput.value;
    checkOut = v ? new Date(v + 'T12:00:00') : null;
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });

  checkBtn?.addEventListener('click', () => {
    const ci = checkinInput?.value;
    const co = checkoutInput?.value;

    if (!ci || !co) { _showModal('warn', 'Select dates', 'Please select a check-in and check-out date.'); return; }
    if (ci >= co)   { _showModal('warn', 'Invalid dates', 'Check-out must be after check-in.'); return; }

    let cur = new Date(ci + 'T12:00:00');
    const end = new Date(co + 'T12:00:00');
    let conflict = false;
    while (cur < end) {
      if (BOOKED.has(keyFromDate(cur))) { conflict = true; break; }
      cur.setDate(cur.getDate() + 1);
    }

    const nights = Math.round((end - new Date(ci + 'T12:00:00')) / 86400000);

    if (conflict) {
      if (o.onUnavailable) { o.onUnavailable(ci, co); }
      else { _showModal('no', 'Unavailable', `The property is not available for those dates.`); }
    } else {
      if (o.onAvailable) { o.onAvailable(nights, ci, co); }
      else {
        _showModal('ok', 'Available!',
          `${nights} night${nights !== 1 ? 's' : ''} · ${ci} → ${co}`,
          true
        );
      }
    }
  });

  /* Built-in animated modal */
  function _showModal(type, title, message, showBook = false) {
    const icons = { ok: '✓', no: '✕', warn: '!' };
    const modal = document.createElement('div');
    modal.className = 'avail-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const bookBtns = showBook ? `
      <div class="avail-modal-btns">
        ${o.whatsappNumber ? `<a href="https://wa.me/${o.whatsappNumber}" target="_blank" rel="noopener" class="btn-avail-contact">WhatsApp</a>` : ''}
        ${o.airbnbUrl      ? `<a href="${o.airbnbUrl}" target="_blank" rel="noopener" class="btn-avail-book">Book on Airbnb →</a>` : ''}
      </div>` : '';

    modal.innerHTML = `
      <div class="avail-modal-inner">
        <div class="avail-modal-icon avail-${type}">${icons[type]}</div>
        <h3>${title}</h3><p>${message}</p>
        ${bookBtns}
        <button class="avail-modal-close">Close</button>
      </div>`;

    document.body.appendChild(modal);

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(modal.querySelector('.avail-modal-inner'),
        { y: 24, scale: 0.95 }, { y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.2)' });
    }

    const close = () => {
      if (typeof gsap !== 'undefined') {
        gsap.to(modal, { opacity: 0, duration: 0.2, onComplete: () => modal.remove() });
      } else { modal.remove(); }
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    modal.querySelector('.avail-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', onKey);
  }

  renderMonth(viewDate.getFullYear(), viewDate.getMonth());
}
