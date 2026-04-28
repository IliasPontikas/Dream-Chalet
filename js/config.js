/* config.js — single source of truth for site-wide constants */

const SITE_CONFIG = Object.freeze({
  /* Contact */
  phone:       '+306976908838',
  phoneDisplay: '+30 697 690 8838',

  /* Booking platforms */
  airbnbUrl:   'https://www.airbnb.gr/rooms/1019294882973971198',
  bookingUrl:  'https://www.booking.com/hotel/gr/dream-chalet-trikala.html',
  instagramUrl: 'https://www.instagram.com/dream_chalet_trikala/',

  /* Derived contact links */
  get whatsappUrl() { return `https://wa.me/${this.phone}`; },
  get viberUrl()    { return `viber://chat?number=${this.phone}`; },
  get telUrl()      { return `tel:${this.phone}`; },

  /* Property location (WGS84) */
  coords: { lat: 39.60386403048851, lng: 21.74715078198729 },

  /* Analytics — replace with real GA4 Measurement ID when available */
  ga4Id: '',   /* e.g. 'G-XXXXXXXXXX' */
});
