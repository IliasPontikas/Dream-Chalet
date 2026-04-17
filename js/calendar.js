/* calendar.js — Availability calendar with sample booked dates */

function initCalendar() {
  'use strict';

  const container = document.getElementById('calendar-container');
  if (!container) return;

  /* Sample booked dates (replace with real iCal URLs after client provides them) */
  /* iCal setup note: fetch Airbnb + Booking.com .ics URLs via a CORS proxy, parse with ical.js */
  const BOOKED = new Set([
    '2026-04-20', '2026-04-21', '2026-04-22',
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04',
    '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19',
    '2026-06-10', '2026-06-11', '2026-06-12',
  ]);

  const DAYS_EL = ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'];
  const MONTHS_EL = [
    'Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος',
    'Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος',
  ];

  let viewDate = new Date();
  viewDate.setDate(1);

  function pad(n) { return String(n).padStart(2, '0'); }
  function dateKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
  function isToday(y, m, d) {
    const t = new Date();
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
  }

  function renderMonth(y, m) {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let html = `
      <div class="calendar-month-header">
        <button class="calendar-nav-btn" id="cal-prev">‹</button>
        <span class="calendar-month-title">${MONTHS_EL[m]} ${y}</span>
        <button class="calendar-nav-btn" id="cal-next">›</button>
      </div>
      <div class="calendar-grid">
        ${DAYS_EL.map((d) => `<div class="calendar-day-header">${d}</div>`).join('')}
        ${Array(firstDay).fill('<div class="calendar-day empty"></div>').join('')}
    `;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(y, m, d);
      const booked = BOOKED.has(key);
      const today  = isToday(y, m, d);
      const cls = ['calendar-day', today ? 'today' : booked ? 'booked' : 'available'].join(' ');
      html += `<div class="${cls}">${d}</div>`;
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
  }

  renderMonth(viewDate.getFullYear(), viewDate.getMonth());
}