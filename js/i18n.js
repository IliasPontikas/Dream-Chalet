/* i18n.js — Greek/English toggle (self-contained, no external backend) */

function initI18n() {
  'use strict';

  const btns = document.querySelectorAll('[data-lang-btn]');
  /* ?lang=en|el (the address search engines list for each language)
     wins over the visitor's saved choice */
  const urlLang = new URLSearchParams(location.search).get('lang');
  let currentLang = (urlLang === 'en' || urlLang === 'el') ? urlLang : (localStorage.getItem('lang') || 'el');
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
    document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang: currentLang } }));
  }

  function updateToggleBtn() {
    btns.forEach((b) => {
      const on = b.dataset.langBtn === currentLang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
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

  /* Click EL / EN → switch language */
  btns.forEach((b) => b.addEventListener('click', () => {
    const newLang = b.dataset.langBtn;
    if (newLang === currentLang) return;
    loadLang(newLang).then((dict) => {
      if (!dict) return;
      currentLang = newLang;
      localStorage.setItem('lang', newLang);
      /* Drop ?lang= from the address so a reload keeps the new choice */
      if (urlLang) {
        const u = new URL(location.href);
        u.searchParams.delete('lang');
        history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      }
      applyTranslations();
      if (typeof gtag === 'function') {
        gtag('event', 'language_switch', { to: newLang });
      }
    });
  }));

}
