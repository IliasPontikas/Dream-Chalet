# Reusable Modules

Self-contained UI components and utilities extracted from Dream Chalet.
Each module is a single JS/CSS file. Copy the files you need — no build step required.

---

## Folder Structure

```
modules/
  gallery/
    cover-flow-3d.js      3D coverflow carousel + fullscreen overlay
    cover-flow-3d.css
  reviews/
    stacked-cards.js      Scroll-scrubbed stacking card deck
    stacked-cards.css
    marquee.js            Infinite bidirectional marquee
    marquee.css
  cursor/
    custom-cursor.js      Dual-ring cursor with 4 states (hover/drag/view/default)
    custom-cursor.css
  animations/
    scroll-hide-nav.js    Navbar auto-hide on scroll-down, reveal on scroll-up
    hero-char-split.js    Character-by-character title animation
    section-entrances.js  Scroll-triggered fade/slide entrances (+ individual helpers)
    stats-counter.js      Animated number counter (data-target attribute)
    card-tilt-3d.js       3D perspective tilt on mouse move
    scroll-progress-bar.js  Horizontal scroll progress bar
  scroll-video/
    scrubbed-video.js     Lerp-smoothed scroll-scrubbed video playback
  particles/
    three-particles.js    Three.js rotating point-cloud background
  map/
    maplibre-themed.js    MapLibre GL map with light/dark theme switching
  calendar/
    date-range-picker.js  Availability calendar with conflict detection + modal
  weather/
    open-meteo-forecast.js  5-day weather table (Open-Meteo, free, no API key)
  i18n/
    vanilla-i18n.js       JSON-based i18n with dot-notation keys
  theme/
    theme-toggle.js       Dark/light mode toggle with localStorage
```

---

## Quick Reference

### gallery/cover-flow-3d
```html
<link rel="stylesheet" href="modules/gallery/cover-flow-3d.css">
<script src="modules/gallery/cover-flow-3d.js"></script>
```
```js
// All IDs have sensible defaults — see JSDoc in the file
initCoverFlow();
initCoverFlow({ swipeThreshold: 40, dragResistance: 0.3 });
```
**Requires:** GSAP + Draggable plugin

---

### reviews/stacked-cards
```js
initStackedCards();
initStackedCards({ sectionId: 'testimonials', cardSelector: '.card', scrollPerCard: 500 });
```
**Requires:** GSAP + ScrollTrigger

---

### reviews/marquee
```js
initMarquee();                         // targets all .marquee-track
initMarquee({ selector: '#my-marquee', speed: '25s' });
```
Add `.marquee-left` or `.marquee-right` class to set direction.
**Requires:** nothing (pure CSS animation)

---

### cursor/custom-cursor
```js
initCustomCursor({
  hoverTargets: 'a, button, .card',
  dragTargets:  '.slider',
  viewTargets:  '.gallery-slide',
});
```
**Requires:** GSAP core

---

### animations/scroll-hide-nav
```js
initScrollHideNav();
initScrollHideNav({ navId: 'header', threshold: 12 });
```
**Requires:** GSAP ScrollTrigger

---

### animations/hero-char-split
```js
initHeroCharSplit();
initHeroCharSplit({ stagger: 0.08, duration: 1.0 });
```
Pre-build `<span class="char">` in HTML, or let JS auto-split.
**Requires:** GSAP core

---

### animations/section-entrances
```js
// Run all common patterns at once:
initSectionEntrances();

// Or use individual helpers:
entranceFadeUp('.section-heading');
entranceFadeLeft('.about-text');
entranceClipReveal('.image-wrap');
entranceStagger('.grid-item', { stagger: 0.08 });
entranceScale('.btn');
```
**Requires:** GSAP + ScrollTrigger

---

### animations/stats-counter
```html
<span class="stat-number" data-target="4.9">0</span>
```
```js
initStatsCounter();
```
**Requires:** GSAP + ScrollTrigger

---

### animations/card-tilt-3d
```js
initCardTilt3d({ selector: '.product-card', maxY: 12 });
```
**Requires:** GSAP core

---

### animations/scroll-progress-bar
```html
<div id="scroll-progress" class="scroll-progress"></div>
```
```js
initScrollProgressBar();
```
**Requires:** GSAP ScrollTrigger

---

### scroll-video/scrubbed-video
```js
initScrubbedVideo({ sectionId: 'video-section', videoId: 'my-video' });
```
**Requires:** GSAP + ScrollTrigger

---

### particles/three-particles
```html
<canvas id="three-canvas"></canvas>
```
```js
initThreeParticles({ count: 1500, color: 0xffffff, speed: 0.03 });
```
**Requires:** Three.js (r150+)

---

### map/maplibre-themed
```js
initMaplibreThemed({
  center: [21.747, 39.604],
  locations: [
    { id: 'home', coords: [21.747, 39.604], emoji: '🏡', title: 'My Place', isMain: true },
  ],
});
```
**Requires:** MapLibre GL JS v4+, openfreemap.org tiles (free)

---

### calendar/date-range-picker
```js
initDateRangePicker({
  bookedDates: ['2026-05-01', '2026-05-02'],
  whatsappNumber: '30697...',
  airbnbUrl: 'https://airbnb.com/rooms/...',
  onAvailable(nights, ci, co) { /* custom handler */ },
});
```
**Requires:** GSAP core (optional — modal works without it)

---

### weather/open-meteo-forecast
```js
initWeatherForecast({ lat: 51.505, lon: -0.09, locale: 'en-GB', timezone: 'Europe/London' });
```
**Requires:** nothing (Fetch API)

---

### i18n/vanilla-i18n
```js
initVanillaI18n({
  defaultLang: 'en',
  languages:   ['en', 'el', 'de'],
  localesPath: 'locales',
});
```
**Requires:** nothing (Fetch API)

---

### theme/theme-toggle
```js
initThemeToggle();
initThemeToggle({ defaultDark: false, onChange: (dark) => console.log(dark) });
```
**Requires:** nothing
