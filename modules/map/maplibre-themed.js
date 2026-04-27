/**
 * maplibre-themed.js — MapLibre GL map with light/dark theme auto-switching
 *
 * Renders an interactive map with custom emoji markers + popups.
 * Watches the <html data-theme> attribute and re-styles the map on toggle.
 * Uses map.once('idle') after setStyle() because the 'load' event only fires once.
 *
 * Dependencies: MapLibre GL JS (v4+), openfreemap.org tiles (free, no API key)
 *
 * HTML:
 *   <div id="map"></div>
 *
 * CSS needed on .map-marker:
 *   .map-marker { font-size: 1.8rem; cursor: pointer; filter: drop-shadow(0 2px 6px rgba(0,0,0,.5)); }
 *   .map-marker.main { font-size: 2.4rem; }
 *
 * Usage:
 *   initMaplibreThemed({
 *     mapId:  'map',
 *     center: [21.747, 39.604],
 *     zoom:   9.5,
 *     locations: [
 *       { id: 'home', coords: [21.747, 39.604], emoji: '🏡', title: 'My Place', desc: 'Description', isMain: true },
 *       { id: 'poi1', coords: [21.63,  39.72],  emoji: '⛪', title: 'Meteora',  desc: '~22 km' },
 *     ],
 *     lightStyle: 'https://tiles.openfreemap.org/styles/liberty',
 *     darkStyle:  'https://tiles.openfreemap.org/styles/dark',
 *     themeAttr:  'data-theme',   // attribute on <html> that equals 'light' / 'dark'
 *     flyOnClick: '.attraction-card[data-coords]',  // selector for cards that trigger flyTo
 *   });
 */
function initMaplibreThemed(opts = {}) {
  'use strict';

  if (typeof maplibregl === 'undefined') return;

  const o = {
    mapId:       'map',
    center:      [0, 0],
    zoom:        9.5,
    pitch:       25,
    bearing:     0,
    lightStyle:  'https://tiles.openfreemap.org/styles/liberty',
    darkStyle:   'https://tiles.openfreemap.org/styles/dark',
    themeAttr:   'data-theme',
    locations:   [],
    flyOnClick:  null,
    flyZoom:     12,
    flyDuration: 1800,
    popupAccent: '#c9a96e',
    popupMuted:  '#9e9690',
    ...opts,
  };

  const mapEl = document.getElementById(o.mapId);
  if (!mapEl) return;

  const getStyle = () =>
    document.documentElement.getAttribute(o.themeAttr) === 'light'
      ? o.lightStyle
      : o.darkStyle;

  const map = new maplibregl.Map({
    container: o.mapId,
    style: getStyle(),
    center: o.center,
    zoom:   o.zoom,
    pitch:  o.pitch,
    bearing: o.bearing,
    attributionControl: false,
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

  let markers = [];

  function addMarkers() {
    markers.forEach((m) => m.remove());
    markers = [];

    o.locations.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'map-marker' + (loc.isMain ? ' main' : '');
      el.textContent = loc.emoji;
      el.title = loc.title;

      const popup = new maplibregl.Popup({ offset: 25, closeButton: true, maxWidth: '240px' })
        .setHTML(`
          <strong style="font-family:serif;font-size:1.1rem;color:${o.popupAccent};">${loc.title}</strong>
          <p style="margin:.4rem 0 0;font-size:.85rem;color:${o.popupMuted};">${loc.desc || ''}</p>
        `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(loc.coords)
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
    });
  }

  map.on('load', addMarkers);

  /* Re-add markers after theme switch — 'idle' fires after setStyle completes */
  new MutationObserver(() => {
    markers.forEach((m) => m.remove());
    markers = [];
    map.setStyle(getStyle());
    map.once('idle', addMarkers);
  }).observe(document.documentElement, { attributes: true, attributeFilter: [o.themeAttr] });

  /* Optional: fly-to on card click */
  if (o.flyOnClick) {
    document.querySelectorAll(o.flyOnClick).forEach((card) => {
      card.addEventListener('click', () => {
        const [lng, lat] = card.dataset.coords.split(',').map(Number);
        map.flyTo({ center: [lng, lat], zoom: o.flyZoom, duration: o.flyDuration, essential: true });
      });
    });
  }
}
