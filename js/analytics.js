/* analytics.js — GA4 loaded conditionally after cookie consent */

function loadGoogleAnalytics() {
  'use strict';

  /* Replace G-XXXXXXXXXX with real GA4 Measurement ID */
  const GA_ID = 'G-XXXXXXXXXX';

  if (document.querySelector(`script[src*="${GA_ID}"]`)) return; /* Already loaded */

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  initTracking();
}

function initTracking() {
  'use strict';

  /* Booking button clicks */
  document.querySelectorAll('[data-track]').forEach((el) => {
    el.addEventListener('click', () => {
      gtag('event', 'booking_click', { platform: el.dataset.track });
    });
  });

  /* Scroll depth milestones */
  const milestones = [25, 50, 75, 100];
  const fired = new Set();

  window.addEventListener('scroll', () => {
    const pct = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    milestones.forEach((m) => {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        gtag('event', 'scroll_depth', { depth: m });
      }
    });
  }, { passive: true });

  /* Gallery opens */
  document.getElementById('gallery-overlay')?.addEventListener('transitionend', (e) => {
    if (e.target.classList.contains('open')) {
      gtag('event', 'gallery_open');
    }
  });
}