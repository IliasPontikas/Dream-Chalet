/* weather.js — Premium 5-day forecast table from Open-Meteo (i18n-aware) */

function initWeather() {
  'use strict';

  const lat = (typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.coords.lat : 39.60386403048851);
  const lon = (typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG.coords.lng : 21.74715078198729);
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

  const STRINGS = {
    el: {
      title: 'Πρόγνωση 5 Ημερών — Τρίκαλα',
      day: 'Ημέρα', cond: 'Καιρός', min: 'Ελάχ.', max: 'Μέγ.',
      unavailable: 'Τα δεδομένα καιρού δεν είναι διαθέσιμα αυτή τη στιγμή.',
      desc: {
        0: 'Αίθριος', 1: 'Ελαφρά συννεφιά', 2: 'Μερ. συννεφιά', 3: 'Συννεφιά',
        45: 'Ομίχλη', 48: 'Παγετός',
        51: 'Ψιχάλα', 53: 'Ψιχάλα', 55: 'Πυκνή ψιχάλα',
        61: 'Ελαφρά βροχή', 63: 'Βροχή', 65: 'Έντονη βροχή',
        71: 'Χιονόπτωση', 73: 'Χιονόπτωση', 75: 'Έντονη χιονόπτωση', 77: 'Χαλάζι',
        80: 'Μπόρα', 81: 'Μπόρες', 82: 'Ισχυρές μπόρες',
        85: 'Χιονόπτωση', 86: 'Ισχυρή χιονόπτωση',
        95: 'Καταιγίδα', 96: 'Καταιγίδα', 99: 'Καταιγίδα',
      },
    },
    en: {
      title: '5-Day Forecast — Trikala',
      day: 'Day', cond: 'Weather', min: 'Low', max: 'High',
      unavailable: 'Weather data is not available right now.',
      desc: {
        0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy',
        45: 'Fog', 48: 'Freezing fog',
        51: 'Drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
        61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
        71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Hail',
        80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
        85: 'Snow showers', 86: 'Heavy snow',
        95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
      },
    },
  };

  const getLang = () => (document.documentElement.lang === 'en' ? 'en' : 'el');
  const localeFor = (lang) => (lang === 'en' ? 'en-US' : 'el-GR');

  let cachedDaily = null;

  function render(daily) {
    const lang = getLang();
    const t = STRINGS[lang];
    const loc = localeFor(lang);

    gridEl.innerHTML = `
      <div class="weather-title-row">
        <h4>${t.title}</h4>
        <span class="weather-source">Open-Meteo</span>
      </div>
      <div class="weather-table-head">
        <div>${t.day}</div>
        <div>${t.cond}</div>
        <div>${t.min}</div>
        <div>${t.max}</div>
      </div>
    `;

    daily.time.slice(0, 5).forEach((date, i) => {
      const d = new Date(date + 'T12:00:00');
      const dayName   = d.toLocaleDateString(loc, { weekday: 'long' });
      const shortDate = d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
      const tempMax = Math.round(daily.temperature_2m_max[i]);
      const tempMin = Math.round(daily.temperature_2m_min[i]);
      const code = daily.weathercode[i];
      const icon = WMO_ICONS[code] ?? '🌤️';
      const desc = t.desc[code] ?? t.desc[2];

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
  }

  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Athens&forecast_days=5`
  )
    .then((res) => res.json())
    .then((data) => {
      cachedDaily = data.daily;
      render(cachedDaily);
    })
    .catch(() => {
      gridEl.innerHTML = `<p style="padding:1.5rem;color:var(--text-muted);text-align:center;">${STRINGS[getLang()].unavailable}</p>`;
    });

  /* Re-render on language change */
  document.addEventListener('lang:change', () => {
    if (cachedDaily) render(cachedDaily);
    else gridEl.innerHTML = `<p style="padding:1.5rem;color:var(--text-muted);text-align:center;">${STRINGS[getLang()].unavailable}</p>`;
  });
}
