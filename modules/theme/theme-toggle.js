/**
 * theme-toggle.js — Dark / light mode toggle with localStorage persistence
 *
 * Sets data-theme="dark" | "light" on <html>. Reads saved preference from
 * localStorage; defaults to dark if nothing saved.
 *
 * Dependencies: none
 *
 * HTML:
 *   <button id="theme-toggle" aria-label="Toggle theme">
 *     <i class="theme-icon-moon"></i>
 *     <i class="theme-icon-sun"></i>
 *   </button>
 *
 * CSS needed:
 *   [data-theme="light"]  .theme-icon-moon { display: none; }
 *   [data-theme="dark"]   .theme-icon-sun  { display: none; }
 *
 * Usage:
 *   initThemeToggle();
 *   initThemeToggle({ toggleId: 'my-btn', defaultDark: false, storageKey: 'color-scheme' });
 */
function initThemeToggle(opts = {}) {
  'use strict';

  const o = {
    toggleId:   'theme-toggle',
    storageKey: 'theme',
    defaultDark: true,
    themeAttr:  'data-theme',
    darkClass:  'dark',     // added to button when dark mode is active
    onChange:   null,       // fn(isDark)
    ...opts,
  };

  const toggle = document.getElementById(o.toggleId);

  function applyTheme(dark) {
    document.documentElement.setAttribute(o.themeAttr, dark ? 'dark' : 'light');
    toggle?.classList.toggle(o.darkClass, dark);
    localStorage.setItem(o.storageKey, dark ? 'dark' : 'light');
    if (typeof o.onChange === 'function') o.onChange(dark);
  }

  const saved  = localStorage.getItem(o.storageKey);
  const isDark = saved ? saved === 'dark' : o.defaultDark;
  applyTheme(isDark);

  toggle?.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute(o.themeAttr) !== 'dark');
  });
}
