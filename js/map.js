/* map.js — MapLibre GL JS with 5 custom pins */

function initMap() {
  'use strict';

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

  /* flyTo when attraction cards are clicked */
  document.querySelectorAll('.attraction-card[data-coords]').forEach((card) => {
    card.addEventListener('click', () => {
      const [lng, lat] = card.dataset.coords.split(',').map(Number);
      map.flyTo({ center: [lng, lat], zoom: 12, duration: 1800, essential: true });
    });
  });
}