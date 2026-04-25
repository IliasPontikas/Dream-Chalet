/* map.js — MapLibre GL JS with 5 custom pins, light/dark style switching */

function initMap() {
  'use strict';

  if (typeof maplibregl === 'undefined') return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const getStyle = () =>
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'https://tiles.openfreemap.org/styles/liberty'
      : 'https://tiles.openfreemap.org/styles/dark';

  const map = new maplibregl.Map({
    container: 'map',
    style: getStyle(),
    center: [21.74715078198729, 39.60386403048851],
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
      coords: [21.74715078198729, 39.60386403048851],
      emoji: '🏡',
      title: 'Dream Chalet',
      desc: 'Η κατοικία σας — Raxa, Trikala',
      isMain: true,
    },
    {
      id: 'meteora',
      coords: [21.63065515278235, 39.72279696985126],
      emoji: '⛪',
      title: 'Μετέωρα',
      desc: 'UNESCO World Heritage Site • ~22 km',
    },
    {
      id: 'elati',
      coords: [21.535341361331444, 39.50317742958358],
      emoji: '🏔️',
      title: 'Ελάτι',
      desc: 'Ορεινό χωριό • ~30 km',
    },
    {
      id: 'palaiokarya',
      coords: [21.527416210816465, 39.431308047515344],
      emoji: '💧',
      title: 'Καταρράκτες Παλαιοκαριάς',
      desc: 'Καταρράκτες & Γέφυρα 1517 • ~35 km',
    },
    {
      id: 'pertouli',
      coords: [21.465859934678086, 39.54109910736869],
      emoji: '🎿',
      title: 'Περτούλι',
      desc: 'Χιονοδρομικό κέντρο • ~54 km',
    },
  ];

  let markers = [];

  function addMarkers() {
    markers.forEach((m) => m.remove());
    markers = [];

    locations.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'map-marker' + (loc.isMain ? ' main' : '');
      el.textContent = loc.emoji;
      el.title = loc.title;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: '240px',
      }).setHTML(`
        <strong style="font-family:'Playfair Display',serif;font-size:1.1rem;color:#c9a96e;">${loc.title}</strong>
        <p style="margin:0.4rem 0 0;font-size:0.85rem;color:#9e9690;">${loc.desc}</p>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(loc.coords)
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
    });
  }

  map.on('load', addMarkers);

  /* Re-style map when theme toggles */
  new MutationObserver(() => {
    markers.forEach((m) => m.remove());
    markers = [];
    map.setStyle(getStyle());
    map.once('load', addMarkers);
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  /* flyTo when attraction cards are clicked */
  document.querySelectorAll('.attraction-card[data-coords]').forEach((card) => {
    card.addEventListener('click', () => {
      const [lng, lat] = card.dataset.coords.split(',').map(Number);
      map.flyTo({ center: [lng, lat], zoom: 12, duration: 1800, essential: true });
    });
  });
}
