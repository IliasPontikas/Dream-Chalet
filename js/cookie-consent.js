/* cookie-consent.js — GDPR consent banner (vanilla-cookieconsent) */

function initCookieConsent() {
  'use strict';

  if (typeof CookieConsent === 'undefined') return;

  CookieConsent.run({
    guiOptions: {
      consentModal: { layout: 'bar', position: 'bottom' },
      preferencesModal: { layout: 'box' },
    },
    categories: {
      necessary: { enabled: true, readOnly: true },
      analytics: { enabled: false },
    },
    language: {
      default: localStorage.getItem('lang') || 'el',
      translations: {
        el: {
          consentModal: {
            title: 'Χρησιμοποιούμε cookies',
            description: 'Χρησιμοποιούμε cookies για να βελτιώσουμε την εμπειρία σας. Μπορείτε να επιλέξετε ποια cookies αποδέχεστε.',
            acceptAllBtn: 'Αποδοχή όλων',
            acceptNecessaryBtn: 'Μόνο απαραίτητα',
            showPreferencesBtn: 'Προτιμήσεις',
          },
          preferencesModal: {
            title: 'Προτιμήσεις cookies',
            acceptAllBtn: 'Αποδοχή όλων',
            acceptNecessaryBtn: 'Μόνο απαραίτητα',
            savePreferencesBtn: 'Αποθήκευση',
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
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Necessary only',
            savePreferencesBtn: 'Save preferences',
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