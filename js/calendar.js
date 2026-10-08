/* calendar.js — Date-range calendar that hands the stay off to Airbnb / Booking / WhatsApp */

const CALENDAR_STRINGS = {
  el: {
    days: ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'],
    months: [
      'Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος',
      'Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος',
    ],
    prevMonth: 'Προηγούμενος μήνας',
    nextMonth: 'Επόμενος μήνας',
    pickDates: 'Επιλέξτε ημερομηνίες',
    pickDatesMsg: 'Παρακαλώ επιλέξτε ημερομηνία άφιξης και αναχώρησης.',
    invalidDates: 'Μη έγκυρες ημερομηνίες',
    invalidDatesMsg: 'Η ημερομηνία αναχώρησης πρέπει να είναι μετά την άφιξη.',
    unavailableTitle: 'Μη Διαθέσιμο',
    unavailableMsg: 'Δυστυχώς το chalet δεν είναι διαθέσιμο για τις επιλεγμένες ημερομηνίες. Επικοινωνήστε μαζί μας για εναλλακτικές ή επιλέξτε άλλες ημερομηνίες.',
    handoffTitle: 'Οι ημερομηνίες σας',
    handoffMsg: (n, ci, co, g) => `${n} νύχτ${n === 1 ? 'α' : 'ες'} · ${ci} → ${co} · ${g} επισκέπτ${g === 1 ? 'ης' : 'ες'}. Δείτε τιμή και διαθεσιμότητα:`,
    whatsappText: (ci, co, g) => `Γεια σας! Ενδιαφέρομαι για το Dream Chalet από ${ci} έως ${co} για ${g} άτομα. Είναι διαθέσιμο;`,
    bookAirbnb: 'Airbnb',
    bookBooking: 'Booking.com',
    close: 'Κλείσιμο',
  },
  en: {
    days: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    months: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December',
    ],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    pickDates: 'Pick dates',
    pickDatesMsg: 'Please choose a check-in and check-out date.',
    invalidDates: 'Invalid dates',
    invalidDatesMsg: 'Check-out must be after check-in.',
    unavailableTitle: 'Not Available',
    unavailableMsg: 'Sorry, the chalet is not available for the selected dates. Contact us for alternatives or pick different dates.',
    handoffTitle: 'Your dates',
    handoffMsg: (n, ci, co, g) => `${n} night${n === 1 ? '' : 's'} · ${ci} → ${co} · ${g} guest${g === 1 ? '' : 's'}. See price and availability:`,
    whatsappText: (ci, co, g) => `Hello! I'm interested in Dream Chalet from ${ci} to ${co} for ${g} guests. Is it available?`,
    bookAirbnb: 'Airbnb',
    bookBooking: 'Booking.com',
    close: 'Close',
  },
};

function _calLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'el';
}

function initCalendar() {
  'use strict';

  const container = document.getElementById('calendar-container');
  if (!container) return;

  /* Booked nights. Empty until the Airbnb/Booking iCal feeds are connected —
     we never show made-up availability. Fill with 'YYYY-MM-DD' strings. */
  const BOOKED = new Set([]);

  let viewDate = new Date();
  viewDate.setDate(1);

  /* Date range state */
  let checkIn  = null;
  let checkOut = null;

  const checkinInput  = document.getElementById('checkin-date');
  const checkoutInput = document.getElementById('checkout-date');
  const checkBtn      = document.getElementById('check-availability');

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
  function keyFromDate(dt) { return dateKey(dt.getFullYear(), dt.getMonth(), dt.getDate()); }

  function isToday(y, m, d) {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  }

  function isPast(y, m, d) {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(y, m, d) < today;
  }

  function inRange(key) {
    if (!checkIn || !checkOut) return false;
    return key > keyFromDate(checkIn) && key < keyFromDate(checkOut);
  }

  function renderMonth(y, m) {
    const t = CALENDAR_STRINGS[_calLang()];
    const firstDay    = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const ciKey = checkIn  ? keyFromDate(checkIn)  : null;
    const coKey = checkOut ? keyFromDate(checkOut) : null;

    let html = `
      <div class="calendar-month-header">
        <button class="calendar-nav-btn" id="cal-prev" aria-label="${t.prevMonth}">‹</button>
        <span class="calendar-month-title">${t.months[m]} ${y}</span>
        <button class="calendar-nav-btn" id="cal-next" aria-label="${t.nextMonth}">›</button>
      </div>
      <div class="calendar-grid">
        ${t.days.map((d) => `<div class="calendar-day-header">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="calendar-day empty"></div>').join('')}
    `;

    for (let d = 1; d <= daysInMonth; d++) {
      const key    = dateKey(y, m, d);
      const booked = BOOKED.has(key);
      const today  = isToday(y, m, d);
      const past   = isPast(y, m, d);

      let cls = 'calendar-day';
      if (past)         cls += ' past';
      else if (booked)  cls += ' booked';
      else              cls += ' available cal-day-selectable';

      if (today)        cls += ' today';
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

    /* Day click: first click = check-in, second = check-out */
    container.querySelectorAll('.cal-day-selectable').forEach((cell) => {
      cell.addEventListener('click', () => {
        const { y: cy, m: cm, d: cd } = cell.dataset;
        const clicked = new Date(+cy, +cm, +cd);

        if (!checkIn || (checkIn && checkOut)) {
          checkIn  = clicked;
          checkOut = null;
        } else {
          if (clicked <= checkIn) {
            checkIn = clicked;
          } else {
            /* Ensure no booked dates within range */
            let cur  = new Date(checkIn.getTime()); cur.setDate(cur.getDate() + 1);
            let conflict = false;
            while (cur < clicked) {
              if (BOOKED.has(keyFromDate(cur))) { conflict = true; break; }
              cur.setDate(cur.getDate() + 1);
            }
            if (conflict) {
              checkIn  = clicked;
              checkOut = null;
            } else {
              checkOut = clicked;
            }
          }
        }

        /* Sync to date inputs */
        if (checkinInput)  checkinInput.value  = checkIn  ? keyFromDate(checkIn)  : '';
        if (checkoutInput) checkoutInput.value = checkOut ? keyFromDate(checkOut) : '';

        renderMonth(viewDate.getFullYear(), viewDate.getMonth());
      });
    });
  }

  /* Sync date inputs → internal state */
  checkinInput?.addEventListener('change', () => {
    const v = checkinInput.value;
    checkIn  = v ? new Date(v + 'T12:00:00') : null;
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });
  checkoutInput?.addEventListener('change', () => {
    const v = checkoutInput.value;
    checkOut = v ? new Date(v + 'T12:00:00') : null;
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });

  /* Check Availability button */
  checkBtn?.addEventListener('click', () => {
    const t = CALENDAR_STRINGS[_calLang()];
    const ci = checkinInput?.value;
    const co = checkoutInput?.value;

    if (!ci || !co) {
      showAvailabilityModal('warn', t.pickDates, t.pickDatesMsg);
      return;
    }
    if (ci >= co) {
      showAvailabilityModal('warn', t.invalidDates, t.invalidDatesMsg);
      return;
    }

    let cur = new Date(ci + 'T12:00:00');
    const end = new Date(co + 'T12:00:00');
    let conflict = false;
    while (cur < end) {
      if (BOOKED.has(keyFromDate(cur))) { conflict = true; break; }
      cur.setDate(cur.getDate() + 1);
    }

    const nights = Math.round((end - new Date(ci + 'T12:00:00')) / 86400000);
    const guests = parseInt(document.getElementById('guests')?.value || '2', 10);

    if (conflict) {
      showAvailabilityModal('no', t.unavailableTitle, t.unavailableMsg);
    } else {
      showAvailabilityModal('ok', t.handoffTitle, t.handoffMsg(nights, ci, co, guests), { ci, co, guests });
    }
  });

  renderMonth(viewDate.getFullYear(), viewDate.getMonth());

  /* Re-render on language change */
  document.addEventListener('lang:change', () => {
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });
}

/* ── Availability popup modal ─────────────────────────────── */
function showAvailabilityModal(type, title, message, stay = null) {
  const t = CALENDAR_STRINGS[_calLang()];
  const cfg = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : null;
  const airbnb  = cfg ? cfg.airbnbUrl  : 'https://www.airbnb.gr/rooms/1019294882973971198';
  const booking = cfg ? cfg.bookingUrl : 'https://www.booking.com/hotel/gr/dream-chalet-trikala.html';
  const wa      = cfg ? cfg.whatsappUrl : 'https://wa.me/306976908838';
  const links = stay ? {
    airbnb:  `${airbnb}?check_in=${stay.ci}&check_out=${stay.co}&adults=${stay.guests}`,
    booking: `${booking}?checkin=${stay.ci}&checkout=${stay.co}&group_adults=${stay.guests}&no_rooms=1`,
    wa:      `${wa}?text=${encodeURIComponent(t.whatsappText(stay.ci, stay.co, stay.guests))}`,
  } : null;
  const iconMap = { ok: 'fa-check', no: 'fa-xmark', warn: 'fa-triangle-exclamation' };
  const clsMap  = { ok: 'avail-ok', no: 'avail-no', warn: 'avail-warn' };

  const modal = document.createElement('div');
  modal.className = 'avail-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="avail-modal-inner">
      <div class="avail-modal-icon ${clsMap[type]}">
        <svg class="icon" aria-hidden="true"><use href="images/icons.svg#${iconMap[type]}"></use></svg>
      </div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${links ? `
      <div class="avail-modal-btns">
        <a href="${links.airbnb}" target="_blank" rel="noopener" class="btn-avail-book" data-track="airbnb">
          <svg class="icon" aria-hidden="true"><use href="images/icons.svg#fa-airbnb"></use></svg> ${t.bookAirbnb}
        </a>
        <a href="${links.booking}" target="_blank" rel="noopener" class="btn-avail-book" data-track="booking">
          <svg class="icon" aria-hidden="true"><use href="images/icons.svg#fa-bed"></use></svg> ${t.bookBooking}
        </a>
        <a href="${links.wa}" target="_blank" rel="noopener" class="btn-avail-contact" data-track="whatsapp">
          <svg class="icon" aria-hidden="true"><use href="images/icons.svg#fa-whatsapp"></use></svg> WhatsApp
        </a>
      </div>` : ''}
      <button class="avail-modal-close">${t.close}</button>
    </div>
  `;

  document.body.appendChild(modal);

  if (typeof gsap !== 'undefined') {
    gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    gsap.fromTo(
      modal.querySelector('.avail-modal-inner'),
      { y: 24, scale: 0.95 },
      { y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.2)' }
    );
  }

  function close() {
    if (typeof gsap !== 'undefined') {
      gsap.to(modal, { opacity: 0, duration: 0.2, onComplete: () => modal.remove() });
    } else {
      modal.remove();
    }
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) { if (e.key === 'Escape') close(); }
  modal.querySelector('.avail-modal-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', onKey);
}
