/* i18n.js — Greek/English toggle with i18next */

function initI18n() {
  'use strict';

  if (typeof i18next === 'undefined') return;

  const btn = document.getElementById('lang-toggle');
  let currentLang = localStorage.getItem('lang') || 'el';

  const resources = {
    el: {
      translation: {
        "nav.home": "Αρχική",
        "nav.about": "Πληροφορίες",
        "nav.gallery": "Γκαλερί",
        "nav.amenities": "Παροχές",
        "nav.contact": "Επικοινωνία",
        "hero.bookNow": "Κράτηση Τώρα",
        "hero.title": "Dream Chalet",
        "hero.subtitle": "Πολυτελές Εξοχικό στα Τρίκαλα",
        "hero.scrollDown": "Scroll Down",
        "pricing.cta": "Κράτηση Τώρα",
        "pricing.calendar": "Ημερολόγιο Διαθεσιμότητας"
      }
    },
    en: {
      translation: {
        "nav.home": "Home",
        "nav.about": "About",
        "nav.gallery": "Gallery",
        "nav.amenities": "Amenities",
        "nav.contact": "Contact",
        "hero.bookNow": "Book Now",
        "hero.title": "Dream Chalet",
        "hero.subtitle": "Luxury Chalet in Trikala",
        "hero.scrollDown": "Scroll Down",
        "pricing.cta": "Book Now",
        "pricing.calendar": "Availability Calendar"
      }
    }
  };

  i18next
    .init({
      lng: currentLang,
      fallbackLng: 'el',
      resources: resources,
      interpolation: { escapeValue: false },
    })
    .then(() => {
      applyTranslations();
      updateToggleBtn();
    });

  function applyTranslations() {
    document.documentElement.lang = i18next.language;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      const translation = i18next.t(key);
      if (translation && translation !== key) {
        el.textContent = translation;
      }
    });
  }

  function updateToggleBtn() {
    if (btn) btn.textContent = i18next.language === 'el' ? 'EN' : 'ΕΛ';
  }

  btn?.addEventListener('click', () => {
    const newLang = i18next.language === 'el' ? 'en' : 'el';
    i18next.changeLanguage(newLang).then(() => {
      localStorage.setItem('lang', newLang);
      applyTranslations();
      updateToggleBtn();

      /* Track language switch */
      if (typeof gtag === 'function') {
        gtag('event', 'language_switch', { from: i18next.language, to: newLang });
      }
    });
  });
}