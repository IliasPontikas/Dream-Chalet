/* map.js — MapLibre GL JS with 5 custom pins, light/dark style + i18n */

const MAP_STRINGS = {
  el: {
    showAll:    'Δείτε όλα τα αξιοθέατα',
    openGmaps:  'Άνοιγμα στο Google Maps',
    centerHome: 'Κεντράρισμα στο chalet',
    chaletDesc: 'Η κατοικία σας — Ραχούλα, Τρίκαλα',
    titles: {
      chalet:      'Dream Chalet',
      meteora:     'Μετέωρα',
      elati:       'Ελάτη',
      palaiokarya: 'Καταρράκτες Παλαιοκαριάς',
      pertouli:    'Περτούλι',
    },
    descs: {
      meteora:     'UNESCO World Heritage Site • ~30 λεπτά με αυτοκίνητο',
      elati:       'Ορεινό χωριό • ~40 λεπτά με αυτοκίνητο',
      palaiokarya: 'Καταρράκτες & Γέφυρα 1517 • ~35 λεπτά με αυτοκίνητο',
      pertouli:    'Χιονοδρομικό κέντρο • ~1 ώρα με αυτοκίνητο',
    },
  },
  en: {
    showAll:    'Show all attractions',
    openGmaps:  'Open in Google Maps',
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
      meteora:     'UNESCO World Heritage Site • ~30 min by car',
      elati:       'Mountain village • ~40 min by car',
      palaiokarya: 'Waterfalls & 1517 bridge • ~35 min by car',
      pertouli:    'Ski resort • ~1 hour by car',
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
      ? 'https://tiles.openfreemap.org/styles/liberty'
      : 'https://tiles.openfreemap.org/styles/dark';

  const center = (typeof SITE_CONFIG !== 'undefined'
    ? [SITE_CONFIG.coords.lng, SITE_CONFIG.coords.lat]
    : [21.74715078198729, 39.60386403048851]);

  const ZOOM_CHALET = 13;

  /* Overview = a frame that fits the chalet and every attraction */
  const ALL_POINTS = [
    center,
    [21.63065515278235, 39.72279696985126],  /* Meteora */
    [21.535341361331444, 39.50317742958358], /* Elati */
    [21.527416210816465, 39.431308047515344],/* Palaiokarya */
    [21.465859934678086, 39.54109910736869], /* Pertouli */
  ];
  const lngs = ALL_POINTS.map((p) => p[0]);
  const lats = ALL_POINTS.map((p) => p[1]);
  const BOUNDS = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
  const fitPadding = () => {
    const small = mapEl.clientWidth < 520;
    return small ? { top: 70, bottom: 60, left: 40, right: 40 } : { top: 80, bottom: 70, left: 70, right: 70 };
  };

  const map = new maplibregl.Map({
    container: 'map',
    style: getStyle(),
    bounds: BOUNDS,
    fitBoundsOptions: { padding: fitPadding() },
    pitch: 0,
    bearing: 0,
    attributionControl: false,
    /* Page scroll passes over the map: one finger scrolls the page,
       two fingers move/zoom the map (Ctrl/⌘ + wheel on desktop) */
    cooperativeGestures: true,
    locale: _mapLang() === 'en' ? {
      'CooperativeGesturesHandler.MobileHelpText': 'Use two fingers to move or zoom the map',
      'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + scroll to zoom the map',
      'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + scroll to zoom the map',
    } : {
      'CooperativeGesturesHandler.MobileHelpText': 'Χρησιμοποιήστε δύο δάχτυλα για μετακίνηση ή ζουμ',
      'CooperativeGesturesHandler.WindowsHelpText': 'Ctrl + κύλιση για ζουμ στον χάρτη',
      'CooperativeGesturesHandler.MacHelpText': '⌘ + κύλιση για ζουμ στον χάρτη',
    },
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  /* Zoom toggle: chalet ⇄ overview (i18n-aware text) */
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'map-zoom-toggle';
  toggle.dataset.mode = 'overview';
  toggle.setAttribute('aria-label', 'Toggle map view');
  function updateToggleText() {
    const t = MAP_STRINGS[_mapLang()];
    toggle.textContent = toggle.dataset.mode === 'chalet' ? t.showAll : t.centerHome;
  }
  toggle.addEventListener('click', () => {
    const isChalet = toggle.dataset.mode === 'chalet';
    if (isChalet) {
      map.fitBounds(BOUNDS, { padding: fitPadding(), duration: 1400, essential: true });
    } else {
      map.flyTo({ center, zoom: ZOOM_CHALET, duration: 1400, essential: true });
    }
    toggle.dataset.mode = isChalet ? 'overview' : 'chalet';
    updateToggleText();
  });
  updateToggleText();
  mapEl.appendChild(toggle);

  const locations = [
    { id: 'chalet',      coords: [21.74715078198729,   39.60386403048851],   emoji: '🏡', isMain: true, gmaps: 'https://maps.app.goo.gl/bZhBAc3cMwijPPTFA' },
    { id: 'meteora',     coords: [21.63065515278235,   39.72279696985126],   emoji: '⛪',  gmaps: 'https://maps.app.goo.gl/Z9ApEdYgCb9W95Cm6' },
    { id: 'elati',       coords: [21.535341361331444,  39.50317742958358],   emoji: '🏔️', gmaps: 'https://maps.app.goo.gl/TuWsUt32V9KnysraA' },
    { id: 'palaiokarya', coords: [21.527416210816465,  39.431308047515344],  emoji: '💧', gmaps: 'https://maps.app.goo.gl/tJ2DyL4YLRNNviEr6' },
    { id: 'pertouli',    coords: [21.465859934678086,  39.54109910736869],   emoji: '🎿', gmaps: 'https://maps.app.goo.gl/KKk7iq6tWskwNZZn8' },
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
        ${loc.gmaps ? `<a class="map-popup-link" href="${loc.gmaps}" target="_blank" rel="noopener">${t.openGmaps} ↗</a>` : ''}
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
      toggle.dataset.mode = 'chalet';   /* button now offers 'show all' */
      updateToggleText();
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
