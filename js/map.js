/* map.js — MapLibre GL JS with 5 custom pins, light/dark style + i18n */

const MAP_STRINGS = {
  el: {
    showAll:    'Δείτε όλα τα αξιοθέατα',
    centerHome: 'Κεντράρισμα στο chalet',
    chaletDesc: 'Η κατοικία σας — Ραχούλα, Τρίκαλα',
    titles: {
      chalet:      'Dream Chalet',
      meteora:     'Μετέωρα',
      elati:       'Ελάτι',
      palaiokarya: 'Καταρράκτες Παλαιοκαριάς',
      pertouli:    'Περτούλι',
    },
    descs: {
      meteora:     'UNESCO World Heritage Site • ~22 km',
      elati:       'Ορεινό χωριό • ~30 km',
      palaiokarya: 'Καταρράκτες & Γέφυρα 1517 • ~35 km',
      pertouli:    'Χιονοδρομικό κέντρο • ~54 km',
    },
  },
  en: {
    showAll:    'Show all attractions',
    centerHome: 'Center on chalet',
    chaletDesc: 'Your home — Rachoula, Trikala',
    titles: {
      chalet:      'Dream Chalet',
      meteora:     'Meteora',
      elati:       'Elati',
      palaiokarya: 'Palaiokarya Falls',
      pertouli:    'Pertouli',
    },
    descs: {
      meteora:     'UNESCO World Heritage Site • ~22 km',
      elati:       'Mountain village • ~30 km',
      palaiokarya: 'Waterfalls & 1517 bridge • ~35 km',
      pertouli:    'Ski resort • ~54 km',
    },
  },
};
const _mapLang = () => (document.documentElement.lang === 'en' ? 'en' : 'el');

function initMap() {
  'use strict';

  if (typeof maplibregl === 'undefined') return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const getStyle = () =>
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'https://tiles.openfreemap.org/styles/positron'
      : 'https://tiles.openfreemap.org/styles/dark';

  const center = (typeof SITE_CONFIG !== 'undefined'
    ? [SITE_CONFIG.coords.lng, SITE_CONFIG.coords.lat]
    : [21.74715078198729, 39.60386403048851]);

  const ZOOM_CHALET   = 13;
  const ZOOM_OVERVIEW = 9.2;

  const map = new maplibregl.Map({
    container: 'map',
    style: getStyle(),
    center,
    zoom: ZOOM_CHALET,
    pitch: 25,
    bearing: 0,
    attributionControl: false,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  /* Zoom toggle: chalet ⇄ overview (i18n-aware text) */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'map-zoom-toggle';
  toggle.dataset.mode = 'chalet';
  toggle.setAttribute('aria-label', 'Toggle map view');
  function updateToggleText() {
    const t = MAP_STRINGS[_mapLang()];
    toggle.textContent = toggle.dataset.mode === 'chalet' ? t.showAll : t.centerHome;
  }
  toggle.addEventListener('click', () => {
    const isChalet = toggle.dataset.mode === 'chalet';
    map.flyTo({
      center,
      zoom: isChalet ? ZOOM_OVERVIEW : ZOOM_CHALET,
      duration: 1400,
      essential: true,
    });
    toggle.dataset.mode = isChalet ? 'overview' : 'chalet';
    updateToggleText();
  });
  updateToggleText();
  mapEl.appendChild(toggle);

  const locations = [
    { id: 'chalet',      coords: [21.74715078198729,   39.60386403048851],   emoji: '🏡', isMain: true },
    { id: 'meteora',     coords: [21.63065515278235,   39.72279696985126],   emoji: '⛪' },
    { id: 'elati',       coords: [21.535341361331444,  39.50317742958358],   emoji: '🏔️' },
    { id: 'palaiokarya', coords: [21.527416210816465,  39.431308047515344],  emoji: '💧' },
    { id: 'pertouli',    coords: [21.465859934678086,  39.54109910736869],   emoji: '🎿' },
  ];

  let markers = [];

  function addMarkers() {
    markers.forEach((m) => m.remove());
    markers = [];

    const t = MAP_STRINGS[_mapLang()];
    locations.forEach((loc) => {
      const title = t.titles[loc.id];
      const desc  = loc.id === 'chalet' ? t.chaletDesc : t.descs[loc.id];

      const el = document.createElement('div');
      el.className = 'map-marker' + (loc.isMain ? ' main' : '');
      el.textContent = loc.emoji;
      el.title = title;

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        maxWidth: '240px',
      }).setHTML(`
        <strong style="font-family:'EB Garamond',serif;font-size:1.1rem;color:#c9a96e;">${title}</strong>
        <p style="margin:0.4rem 0 0;font-size:0.85rem;color:#9e9690;">${desc}</p>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(loc.coords)
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
    });
  }

  map.on('load', addMarkers);

  /* Follow the site theme (markers are DOM elements, so they survive setStyle) */
  document.addEventListener('theme:change', () => map.setStyle(getStyle()));

  /* Re-render markers + toggle text when language changes */
  document.addEventListener('lang:change', () => {
    updateToggleText();
    if (map.loaded()) addMarkers();
  });

  /* flyTo when attraction cards are clicked */
  const cards = document.querySelectorAll('.attraction-card[data-coords]');
  cards.forEach((card) => {
    const go = (e) => {
      if (e.target.closest('a')) return; /* let the directions link work */
      const [lng, lat] = card.dataset.coords.split(',').map(Number);
      cards.forEach((c) => c.classList.toggle('active', c === card));
      map.flyTo({ center: [lng, lat], zoom: 12, duration: 1800, essential: true });
      /* On phones the map sits below the list — bring it into view */
      if (window.matchMedia('(max-width: 1024px)').matches) {
        window.__lenis ? window.__lenis.scrollTo(mapEl, { offset: -90 }) : mapEl.scrollIntoView({ behavior: 'smooth' });
      }
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); }
    });
  });
}
