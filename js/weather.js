/* weather.js — 5-day forecast from Open-Meteo API */

function initWeather() {
  'use strict';

  const lat = 39.6106;
  const lon = 21.75;
  const gridEl = document.getElementById('weather-grid');
  if (!gridEl) return;

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/Athens&forecast_days=5`)
    .then(res => res.json())
    .then(data => {
      const { daily } = data;
      const icons = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '⛈️', 65: '⛈️',
        71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', 80: '🌧️', 81: '⛈️',
        82: '⛈️', 85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
      };

      daily.time.slice(0, 5).forEach((date, i) => {
        const d = new Date(date);
        const day = d.toLocaleDateString('el', { weekday: 'short' });
        const temp = Math.round(daily.temperature_2m_max[i]);
        const code = daily.weathercode[i];
        const icon = icons[code] || '🌤️';

        const card = document.createElement('div');
        card.className = 'weather-card';
        card.innerHTML = `
          <div class="weather-day">${day}</div>
          <div class="weather-icon">${icon}</div>
          <div class="weather-temp">${temp}°C</div>
        `;
        gridEl.appendChild(card);
      });
    })
    .catch(err => console.warn('Weather API error:', err));
}
