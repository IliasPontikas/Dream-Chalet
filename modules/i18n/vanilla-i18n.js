/**
 * vanilla-i18n.js — Lightweight JSON-based i18n with dot-notation keys
 *
 * Supports N languages. Loads JSON from a configurable path.
 * Persists preference to localStorage. Updates all [data-i18n] elements.
 *
 * Dependencies: Fetch API (native)
 *
 * JSON format (e.g. locales/en.json):
 *   { "nav": { "about": "About" }, "hero": { "title": "Dream Chalet" } }
 *
 * HTML:
 *   <a data-i18n="nav.about">About</a>
 *   <button id="lang-toggle">EN</button>
 *
 * Usage:
 *   initVanillaI18n({ defaultLang: 'el', localesPath: 'locales' });
 *   initVanillaI18n({
 *     defaultLang:  'en',
 *     languages:    ['en', 'fr', 'de'],
 *     localesPath:  '/assets/locales',
 *     storageKey:   'app-lang',
 *     toggleId:     'lang-toggle',
 *     toggleLabels: { en: 'EN', fr: 'FR', de: 'DE' },
 *     onSwitch:     (lang) => console.log('switched to', lang),
 *   });
 */
function initVanillaI18n(opts = {}) {
  'use strict';

  const o = {
    defaultLang:  'en',
    languages:    ['en'],
    localesPath:  'locales',
    storageKey:   'lang',
    toggleId:     'lang-toggle',
    toggleLabels: null,   // null = auto (shows the OTHER language)
    onSwitch:     null,
    ...opts,
  };

  const btn    = document.getElementById(o.toggleId);
  let current  = localStorage.getItem(o.storageKey) || o.defaultLang;
  const cache  = {};

  /* Resolve dotted key: "nav.about" → obj.nav.about */
  const resolve = (obj, key) =>
    key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);

  function applyTranslations() {
    const dict = cache[current];
    if (!dict) return;
    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const val = resolve(dict, el.dataset.i18n);
      if (typeof val === 'string') el.textContent = val;
    });
    updateBtn();
  }

  function updateBtn() {
    if (!btn) return;
    if (o.toggleLabels) {
      btn.textContent = o.toggleLabels[current] ?? current.toUpperCase();
    } else {
      /* Show next language code */
      const idx  = o.languages.indexOf(current);
      const next = o.languages[(idx + 1) % o.languages.length];
      btn.textContent = next.toUpperCase();
    }
  }

  function loadLang(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(`${o.localesPath}/${lang}.json`, { cache: 'no-cache' })
      .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((json) => { cache[lang] = json; return json; })
      .catch((err) => { console.warn(`[i18n] failed to load ${lang}.json`, err); return null; });
  }

  /* Initial load */
  loadLang(current).then(() => applyTranslations());

  /* Toggle button */
  btn?.addEventListener('click', () => {
    const idx     = o.languages.indexOf(current);
    const newLang = o.languages[(idx + 1) % o.languages.length];
    loadLang(newLang).then((dict) => {
      if (!dict) return;
      current = newLang;
      localStorage.setItem(o.storageKey, newLang);
      applyTranslations();
      if (typeof o.onSwitch === 'function') o.onSwitch(newLang);
    });
  });
}
