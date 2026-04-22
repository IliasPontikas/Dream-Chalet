/* weather.js — Premium 5-day forecast table from Open-Meteo */

function initWeather() {
  'use strict';

  const lat = 39.60386403048851;
  const lon = 21.74715078198729;
  const gridEl = document.getElementById('weather-grid');
  if (!gridEl) return;

  const WMO_ICONS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '⛈️',
    71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    85: '❄️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };

  const WMO_DESC = {
    0: 'Αίθριος', 1: 'Ελαφρά συννεφιά', 2: 'Μερ. συννεφιά', 3: 'Συννεφιά',
    45: 'Ομίχλη', 48: 'Παγετός',
    51: 'Ψιχάλα', 53: 'Ψιχάλα', 55: 'Πυκνή ψιχάλα',
    61: 'Ελαφρά βροχή', 63: 'Βροχή', 65: 'Έντονη βροχή',
    71: 'Χιονόπτωση', 73: 'Χιονόπτωση', 75: 'Έντονη χιονόπτωση', 77: 'Χαλάζι',
    80: 'Μπόρα', 81: 'Μπόρες', 82: 'Ισχυρές μπόρες',
    85: 'Χιονόπτωση', 86: 'Ισχυρή χιονόπτωση',
    95: 'Καταιγίδα', 96: 'Καταιγίδα', 99: 'Καταιγίδα',
  };

  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Athens&forecast_days=5`
  )
    .then((res) => res.json())
    .then((data) => {
      const { daily } = data;

      gridEl.innerHTML = `
        <div class="weather-title-row">
          <h4>Πρόγνωση 5 Ημερών — Τρίκαλα</h4>
          <span class="weather-source">Open-Meteo</span>
        </div>
        <div class="weather-table-head">
          <div>Ημέρα</div>
          <div>Καιρός</div>
          <div>Ελάχ.</div>
          <div>Μέγ.</div>
        </div>
      `;

      daily.time.slice(0, 5).forEach((date, i) => {
        const d = new Date(date + 'T12:00:00');
        const dayName = d.toLocaleDateString('el-GR', { weekday: 'long' });
        const shortDate = d.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weathercode[i];
        const icon = WMO_ICONS[code] ?? '🌤️';
        const desc = WMO_DESC[code] ?? 'Μερ. συννεφιά';

        const row = document.createElement('div');
        row.className = 'weather-table-row';
        row.innerHTML = `
          <div class="weather-col-day">
            <span class="w-day">${dayName}</span>
            <span class="w-date">${shortDate}</span>
          </div>
          <div class="weather-col-cond">
            <span class="weather-emoji">${icon}</span>
            <span class="weather-desc">${desc}</span>
          </div>
          <div class="weather-col-min"><span>${tempMin}°</span></div>
          <div class="weather-col-max"><span class="temp-max">${tempMax}°</span></div>
        `;
        gridEl.appendChild(row);
      });
    })
    .catch(() => {
      gridEl.innerHTML = '<p style="padding:1.5rem;color:var(--text-muted);text-align:center;">Τα δεδομένα καιρού δεν είναι διαθέσιμα αυτή τη στιγμή.</p>';
    });
}
