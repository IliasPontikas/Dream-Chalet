/* theme.js — Light / dark theme toggle (initial theme is set inline in <head>) */

(function () {
  'use strict';

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const COLORS = { dark: '#0a0a0a', light: '#eee4d6' };

  function apply(theme, save) {
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', COLORS[theme]);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', theme === 'dark' ? 'Light theme' : 'Dark theme');
    });
    if (save) {
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme } }));
  }

  function init() {
    apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        apply(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
