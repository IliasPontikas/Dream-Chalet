/* cookie-consent.js — GDPR consent banner (vanilla-cookieconsent) */

function initCookieConsent() {
  'use strict';

  if (typeof CookieConsent === 'undefined') {
    console.warn('[cookies] CookieConsent global is undefined — vendor script failed to load');
    return;
  }
  console.info('[cookies] init');

  /* Expose a manual reset helper for testing:
     run window.resetCookieConsent() in DevTools to clear the saved
     consent and force the banner to reappear on next refresh. */
  window.resetCookieConsent = () => {
    try { CookieConsent.eraseCookies && CookieConsent.eraseCookies('cc_cookie'); } catch (_) {}
    document.cookie = 'cc_cookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    location.reload();
  };

  CookieConsent.run({
    /* Bump revision when policy changes — also forces banner to re-show */
    revision: 1,
    autoShow: true,
    disablePageInteraction: false,
    guiOptions: {
      consentModal: { layout: 'bar', position: 'bottom' },
      preferencesModal: { layout: 'box' },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: { enabled: false },
    },
    language: {
      default: localStorage.getItem('lang') === 'en' ? 'en' : 'el',
      autoDetect: 'document',
      translations: {
        el: {
          consentModal: {
            title: 'Χρησιμοποιούμε cookies',
            description: 'Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σας. Μπορείτε να επιλέξετε ποια cookies αποδέχεστε.',
            acceptAllBtn: 'Αποδοχή όλων',
            acceptNecessaryBtn: 'Μόνο απαραίτητα',
            showPreferencesBtn: 'Προτιμήσεις',
            closeIconLabel: 'Κλείσιμο',
          },
          preferencesModal: {
            title: 'Προτιμήσεις cookies',
            acceptAllBtn: 'Αποδοχή όλων',
            acceptNecessaryBtn: 'Μόνο απαραίτητα',
            savePreferencesBtn: 'Αποθήκευση',
            closeIconLabel: 'Κλείσιμο',
            sections: [
              {
                title: 'Απαραίτητα cookies',
                description: 'Απαραίτητα για τη λειτουργία της σελίδας.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Αναλυτικά cookies',
                description: 'Μας βοηθούν να κατανοήσουμε πώς χρησιμοποιείτε την σελίδα.',
                linkedCategory: 'analytics',
              },
            ],
          },
        },
        en: {
          consentModal: {
            title: 'We use cookies',
            description: 'We use cookies to improve your experience. You can choose which cookies you accept.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Necessary only',
            showPreferencesBtn: 'Preferences',
            closeIconLabel: 'Close',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Necessary only',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            sections: [
              {
                title: 'Necessary cookies',
                description: 'Required for the site to function.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Analytics cookies',
                description: 'Help us understand how you use the site.',
                linkedCategory: 'analytics',
              },
            ],
          },
        },
      },
    },
    onConsent() {
      if (CookieConsent.acceptedCategory('analytics')) {
        if (typeof loadGoogleAnalytics === 'function') loadGoogleAnalytics();
      }
    },
    onChange() {
      if (CookieConsent.acceptedCategory('analytics')) {
        if (typeof loadGoogleAnalytics === 'function') loadGoogleAnalytics();
      }
    },
  });
}
