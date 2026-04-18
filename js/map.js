/* map.js — MapLibre GL JS with 5 custom pins */

function initMap() {
  'use strict';

  /* Always initialize weather independently */
  initWeather();

  if (typeof maplibregl === 'undefined') return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/dark',
    center: [21.7500, 39.6106],
    zoom: 9.5,
    pitch: 25,
    bearing: 0,
    attributionControl: false,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  const locations = [
    {
      id: 'chalet',
      coords: [21.7500, 39.6106],
      emoji: '🏡',
      title: 'Dream Chalet',
      desc: 'Η κατοικία σας',
      isMain: true,
    },
    {
      id: 'meteora',
      coords: [21.6315, 39.7228],
      emoji: '⛪',
      title: 'Μετέωρα',
      desc: 'UNESCO World Heritage Site • ~22 km',
    },
    {
      id: 'elati',
      coords: [21.4833, 39.5333],
      emoji: '🏔️',
      title: 'Ελάτι',
      desc: 'Ορεινό χωριό • ~30 km',
    },
    {
      id: 'palaiokarya',
      coords: [21.8333, 39.6333],
      emoji: '💧',
      title: 'Καταρράκτες Παλαιοκαριάς',
      desc: 'Καταρράκτες & Γέφυρα 1517 • ~35 km',
    },
    {
      id: 'pertouli',
      coords: [21.4000, 39.4500],
      emoji: '🎿',
      title: 'Περτούλι',
      desc: 'Χιονοδρομικό κέντρο • ~54 km',
    },
  ];

  map.on('load', () => {
    locations.forEach((loc) => {
      /* Create custom marker element */
      const el = document.createElement('div');
      el.className = 'map-marker' + (loc.isMain ? ' main' : '');
      el.textContent = loc.emoji;
      el.title = loc.title;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: '240px',
      }).setHTML(`
        <strong style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#c9a96e;">${loc.title}</strong>
        <p style="margin:0.4rem 0 0;font-size:0.85rem;color:#9e9690;">${loc.desc}</p>
      `);

      new maplibregl.Marker({ element: el })
        .setLngLat(loc.coords)
        .setPopup(popup)
        .addTo(map);
    });
  });
}

/* ── 5-Day Weather Forecast using Open-Meteo ───────────────── */
async function initWeather() {
  const container = document.getElementById('weather-container');
  if (!container) return;

  try {
    const lat = 39.5557;
    const lon = 21.7679; // Trikala region
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);

    if (!res.ok) throw new Error('Weather fetch failed');
    const data = await res.json();
    const daily = data.daily;

    let html = '';

    for (let i = 0; i < 5; i++) {
      const date = new Date(daily.time[i]);
      const dayName = date.toLocaleDateString('el-GR', { weekday: 'short' });
      const maxTemp = Math.round(daily.temperature_2m_max[i]);
      const minTemp = Math.round(daily.temperature_2m_min[i]);
      const code = daily.weather_code[i];

      let icon = 'fa-cloud';
      if (code === 0) icon = 'fa-sun';
      else if (code >= 1 && code <= 3) icon = 'fa-cloud-sun';
      else if (code === 45 || code === 48) icon = 'fa-smog';
      else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) icon = 'fa-cloud-rain';
      else if ((code >= 71 && code <= 77) || code === 85 || code === 86) icon = 'fa-snowflake';
      else if (code >= 95) icon = 'fa-bolt';

      html += `
        <div class="weather-day">
          <span class="day-name">${dayName}</span>
          <i class="fa-solid ${icon} weather-icon"></i>
          <span class="weather-temp">${maxTemp}° / <span style="color:var(--text-muted);font-size:0.85em">${minTemp}°</span></span>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;">Μη διαθέσιμα δεδομένα καιρού.</div>';
  }
}