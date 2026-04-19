/* availability.js — Date picker availability checker */

function initAvailability() {
  'use strict';

  const btns = document.querySelectorAll('#check-availability, #check-availability-2');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dateRange = prompt('Select check-in and check-out dates (YYYY-MM-DD to YYYY-MM-DD):');
      if (!dateRange) return;

      const [start, end] = dateRange.split(' to ').map(d => d.trim());
      if (!start || !end) {
        alert('Invalid format. Use: YYYY-MM-DD to YYYY-MM-DD');
        return;
      }

      const booked = ['2026-04-20', '2026-04-21', '2026-04-22', '2026-05-01', '2026-05-02', '2026-05-03'];
      const isAvailable = !booked.some(d => d >= start && d <= end);

      alert(isAvailable
        ? `✓ Available for ${start} to ${end}. Proceed to booking!`
        : `✗ Not available for those dates. Please select another period.`
      );
    });
  });
}
