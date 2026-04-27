/**
 * open-meteo-forecast.js — 5-day weather forecast widget (Open-Meteo, no API key)
 *
 * Fetches forecast data for any lat/lon and renders a compact table with
 * emoji weather icons. Locale-aware day/date formatting.
 *
 * Dependencies: Fetch API (native), no external libraries
 *
 * HTML:
 *   <div id="weather-grid"></div>
 *
 * Usage:
 *   initWeatherForecast({ lat: 39.604, lon: 21.747 });
 *   initWeatherForecast({
 *     lat:      40.7128,
 *     lon:     -74.0060,
 *     gridId:  'weather-grid',
 *     locale:  'en-US',
 *     title:   '5-Day Forecast — New York',
 *     days:    5,
 *     timezone: 'America/New_York',
 *   });
 */
function initWeatherForecast(opts = {}) {
  'use strict';

  const o = {
    lat:      0,
    lon:      0,
    gridId:   'weather-grid',
    locale:   'el-GR',
    timezone: 'Europe/Athens',
    title:    '5-Day Forecast',
    days:     5,
    labels:   { day: 'Day', weather: 'Weather', min: 'Min', max: 'Max' },
    errorMsg: 'Weather data unavailable.',
    ...opts,
  };

  const WMO_ICONS = {
    0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️',
    45:'🌫️', 48:'🌫️',
    51:'🌦️', 53:'🌧️', 55:'🌧️',
    61:'🌧️', 63:'🌧️', 65:'⛈️',
    71:'❄️', 73:'❄️', 75:'❄️', 77:'❄️',
    80:'🌦️', 81:'🌧️', 82:'⛈️',
    85:'❄️', 86:'❄️',
    95:'⛈️', 96:'⛈️', 99:'⛈️',
  };

  const WMO_DESC = {
    0:'Clear', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Fog', 48:'Freezing fog',
    51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
    61:'Light rain', 63:'Rain', 65:'Heavy rain',
    71:'Snow', 73:'Snow', 75:'Heavy snow', 77:'Snow grains',
    80:'Showers', 81:'Showers', 82:'Violent showers',
    85:'Snow showers', 86:'Heavy snow showers',
    95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm',
  };

  const gridEl = document.getElementById(o.gridId);
  if (!gridEl) return;

  fetch(
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${o.lat}&longitude=${o.lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min` +
    `&timezone=${encodeURIComponent(o.timezone)}&forecast_days=${o.days}`
  )
    .then((res) => res.json())
    .then(({ daily }) => {
      gridEl.innerHTML = `
        <div class="weather-title-row">
          <h4>${o.title}</h4>
          <span class="weather-source">Open-Meteo</span>
        </div>
        <div class="weather-table-head">
          <div>${o.labels.day}</div>
          <div>${o.labels.weather}</div>
          <div>${o.labels.min}</div>
          <div>${o.labels.max}</div>
        </div>
      `;

      daily.time.slice(0, o.days).forEach((date, i) => {
        const d        = new Date(date + 'T12:00:00');
        const dayName  = d.toLocaleDateString(o.locale, { weekday: 'long' });
        const shortDt  = d.toLocaleDateString(o.locale, { day: 'numeric', month: 'short' });
        const code     = daily.weathercode[i];
        const row      = document.createElement('div');
        row.className  = 'weather-table-row';
        row.innerHTML  = `
          <div class="weather-col-day">
            <span class="w-day">${dayName}</span>
            <span class="w-date">${shortDt}</span>
          </div>
          <div class="weather-col-cond">
            <span class="weather-emoji">${WMO_ICONS[code] ?? '🌤️'}</span>
            <span class="weather-desc">${WMO_DESC[code]  ?? 'Partly cloudy'}</span>
          </div>
          <div class="weather-col-min"><span>${Math.round(daily.temperature_2m_min[i])}°</span></div>
          <div class="weather-col-max"><span class="temp-max">${Math.round(daily.temperature_2m_max[i])}°</span></div>
        `;
        gridEl.appendChild(row);
      });
    })
    .catch(() => {
      gridEl.innerHTML = `<p style="padding:1.5rem;text-align:center;opacity:.6;">${o.errorMsg}</p>`;
    });
}
