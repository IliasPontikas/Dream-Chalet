/* calendar.js — Availability calendar with date-range selection (i18n-aware) */

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
    availableTitle: 'Διαθέσιμο!',
    availableMsg: (n, ci, co) => `Το chalet είναι διαθέσιμο για ${n} νύχτ${n === 1 ? 'α' : 'ες'} (${ci} → ${co}). Επικοινωνήστε μαζί μας για να ολοκληρώσετε την κράτηση.`,
    bookAirbnb: 'Κράτηση Airbnb →',
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
    availableTitle: 'Available!',
    availableMsg: (n, ci, co) => `The chalet is available for ${n} night${n === 1 ? '' : 's'} (${ci} → ${co}). Contact us to complete your booking.`,
    bookAirbnb: 'Book on Airbnb →',
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

  /* Sample booked dates — replace with real iCal sync once client provides URLs */
  const BOOKED = new Set([
    '2026-04-20', '2026-04-21', '2026-04-22',
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04',
    '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19',
    '2026-06-10', '2026-06-11', '2026-06-12',
  ]);

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

    if (conflict) {
      showAvailabilityModal('no', t.unavailableTitle, t.unavailableMsg);
    } else {
      showAvailabilityModal('ok', t.availableTitle, t.availableMsg(nights, ci, co), true);
    }
  });

  renderMonth(viewDate.getFullYear(), viewDate.getMonth());

  /* Re-render on language change */
  document.addEventListener('lang:change', () => {
    renderMonth(viewDate.getFullYear(), viewDate.getMonth());
  });
}

/* ── Availability popup modal ─────────────────────────────── */
function showAvailabilityModal(type, title, message, showBook = false) {
  const t = CALENDAR_STRINGS[_calLang()];
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
      ${showBook ? `
      <div class="avail-modal-btns">
        <a href="${typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.whatsappUrl : 'https://wa.me/306976908838'}" target="_blank" rel="noopener" class="btn-avail-contact">
          <svg class="icon" aria-hidden="true"><use href="images/icons.svg#fa-whatsapp"></use></svg> WhatsApp
        </a>
        <a href="${typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.airbnbUrl : 'https://www.airbnb.gr/rooms/1019294882973971198'}" target="_blank" rel="noopener" class="btn-avail-book">
          ${t.bookAirbnb}
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
