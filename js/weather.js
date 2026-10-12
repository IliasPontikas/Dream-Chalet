/* weather.js — 5-day forecast strip (i18n-aware).
   Data: MET Norway (CC BY 4.0), fetched every 3 hours by the
   sync-calendar GitHub Action into data/weather.json. */

function initWeather() {
  'use strict';

  const gridEl = document.getElementById('weather-grid');
  if (!gridEl) return;

  /* MET Norway symbol codes → a small set of conditions */
  function kind(sym) {
    if (/thunder/.test(sym)) return 'storm';
    if (/snow/.test(sym)) return 'snow';
    if (/sleet/.test(sym)) return 'sleet';
    if (/rainshowers/.test(sym)) return 'showers';
    if (/heavyrain/.test(sym)) return 'heavyrain';
    if (/lightrain/.test(sym)) return 'lightrain';
    if (/rain/.test(sym)) return 'rain';
    if (/fog/.test(sym)) return 'fog';
    if (/partlycloudy/.test(sym)) return 'partly';
    if (/cloudy/.test(sym)) return 'cloudy';
    if (/fair/.test(sym)) return 'fair';
    return 'clear';
  }
  const ICONS = {
    clear: '☀️', fair: '🌤️', partly: '⛅', cloudy: '☁️', fog: '🌫️',
    lightrain: '🌦️', rain: '🌧️', heavyrain: '🌧️', showers: '🌦️',
    sleet: '🌨️', snow: '❄️', storm: '⛈️',
  };

  const STRINGS = {
    el: {
      title: 'Καιρός στα Τρίκαλα',
      today: 'Σήμερα',
      day: 'Ημέρα', cond: 'Καιρός', min: 'Ελάχ.', max: 'Μέγ.',
      source: 'Πηγή',
      desc: {
        clear: 'Αίθριος', fair: 'Λίγα σύννεφα', partly: 'Μερ. συννεφιά', cloudy: 'Συννεφιά',
        fog: 'Ομίχλη', lightrain: 'Ελαφρά βροχή', rain: 'Βροχή', heavyrain: 'Έντονη βροχή',
        showers: 'Μπόρες', sleet: 'Χιονόνερο', snow: 'Χιονόπτωση', storm: 'Καταιγίδα',
      },
    },
    en: {
      title: 'Weather in Trikala',
      today: 'Today',
      day: 'Day', cond: 'Weather', min: 'Low', max: 'High',
      source: 'Source',
      desc: {
        clear: 'Clear', fair: 'Fair', partly: 'Partly cloudy', cloudy: 'Cloudy',
        fog: 'Fog', lightrain: 'Light rain', rain: 'Rain', heavyrain: 'Heavy rain',
        showers: 'Showers', sleet: 'Sleet', snow: 'Snow', storm: 'Thunderstorm',
      },
    },
  };

  const getLang = () => (document.documentElement.lang === 'en' ? 'en' : 'el');
  const localeFor = (lang) => (lang === 'en' ? 'en-US' : 'el-GR');

  let days = null;

  /* Forecast days from today on (the file can be a few hours old) */
  function todayISO() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  }
  function upcoming(all) {
    const today = todayISO();
    return all.filter((d) => d.date >= today).slice(0, 5);
  }

  function render() {
    const lang = getLang();
    const t = STRINGS[lang];
    const loc = localeFor(lang);
    const list = upcoming(days);
    if (list.length < 3) { gridEl.hidden = true; return; }
    gridEl.hidden = false;

    /* Minimal strip: weekday · icon · max / min, with the data credit */
    gridEl.innerHTML = `
      <p class="wx-title">${t.title}</p>
      <ol class="wx-days"></ol>
      <p class="wx-credit">${t.source}: <a href="https://www.met.no/en" target="_blank" rel="noopener">MET Norway</a>
        · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a></p>
    `;
    const ol = gridEl.querySelector('.wx-days');

    list.forEach((day) => {
      const d = new Date(day.date + 'T12:00:00');
      const isToday = day.date === todayISO();
      const dayName = isToday ? t.today : d.toLocaleDateString(loc, { weekday: 'short' }).replace('.', '');
      const k = kind(day.symbol || '');
      const desc = t.desc[k];

      const li = document.createElement('li');
      li.className = 'wx-day';
      li.title = desc;
      li.innerHTML = `
        <span class="wx-name">${dayName}</span>
        <span class="wx-icon" role="img" aria-label="${desc}">${ICONS[k]}</span>
        <span class="wx-temp"><strong>${day.max}°</strong> <span>${day.min}°</span></span>
      `;
      ol.appendChild(li);
    });
  }

  gridEl.hidden = true;
  fetch('data/weather.json', { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => {
      if (!Array.isArray(data.days)) return;
      days = data.days;
      render();
    })
    .catch(() => {});

  /* Re-render on language change */
  document.addEventListener('lang:change', () => { if (days) render(); });
}
