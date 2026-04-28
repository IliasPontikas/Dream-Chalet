/* i18n.js — Greek/English toggle (self-contained, no external backend) */

function initI18n() {
  'use strict';

  const btn = document.getElementById('lang-toggle');
  let currentLang = localStorage.getItem('lang') || 'el';
  let translations = {};

  /* Resolve dotted path like "nav.about" to nested string in JSON */
  function resolve(obj, key) {
    return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
  }

  function applyTranslations() {
    const dict = translations[currentLang];
    if (!dict) return;
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const val = resolve(dict, key);
      if (typeof val === 'string') el.textContent = val;
    });
    updateToggleBtn();
  }

  function updateToggleBtn() {
    if (!btn) return;
    if (currentLang === 'el') {
      btn.textContent = 'EN';
      btn.setAttribute('lang', 'en');
      btn.setAttribute('aria-label', 'Switch to English');
    } else {
      btn.textContent = 'ΕΛ';
      btn.setAttribute('lang', 'el');
      btn.setAttribute('aria-label', 'Αλλαγή σε Ελληνικά');
    }
  }

  function loadLang(lang) {
    if (translations[lang]) return Promise.resolve(translations[lang]);
    return fetch(`locales/${lang}.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        translations[lang] = json;
        return json;
      })
      .catch((err) => {
        console.warn(`[i18n] failed to load ${lang}.json:`, err);
        return null;
      });
  }

  /* Initial load */
  loadLang(currentLang).then(() => applyTranslations());

  /* Click → swap language */
  btn?.addEventListener('click', () => {
    const newLang = currentLang === 'el' ? 'en' : 'el';
    loadLang(newLang).then((dict) => {
      if (!dict) return;
      currentLang = newLang;
      localStorage.setItem('lang', newLang);
      applyTranslations();
      if (typeof gtag === 'function') {
        gtag('event', 'language_switch', { to: newLang });
      }
    });
  });
}
