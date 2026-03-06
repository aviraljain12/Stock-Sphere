/**
 * themes.js - Stock-Sphere Theme Manager
 * Handles Light (Glassmorphism), Dark (Neon), and Neumorphism themes
 * Stores preference in localStorage
 */

const ThemeManager = (() => {
  const THEME_KEY = 'stock_sphere_theme';
  const themes = [ 'dark', 'neumorphism'];
  const themeIcons = { light: 'fa-sun', dark: 'fa-moon', neumorphism: 'fa-circle-half-stroke' };
    const themeLabels = { dark: 'Dark', neumorphism: 'Neo' };
  function getCurrentTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeButton(theme);
    updateMetaThemeColor(theme);
  }

  function cycleTheme() {
    const current = getCurrentTheme();
    const idx = themes.indexOf(current);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next);
    // Show toast about theme change
    if (window.ToastManager) ToastManager.show(`Switched to ${themeLabels[next]} mode ✨`, 'info');
  }

  function updateThemeButton(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const label = btn.querySelector('.theme-label');
    if (icon) {
      icon.className = `fas ${themeIcons[theme]}`;
    }
    if (label) label.textContent = themeLabels[theme];
    btn.setAttribute('data-current-theme', theme);
  }

  function updateMetaThemeColor(theme) {
    let color = '#f4f5fa';
    if (theme === 'dark') color = '#0a0a0f';
    if (theme === 'neumorphism') color = '#e0e5ec';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }

  function createThemeButton() {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.className = 'btn theme-toggle-btn';
    btn.setAttribute('title', 'Switch Theme');
    btn.setAttribute('aria-label', 'Toggle theme');
    const current = getCurrentTheme();
    btn.innerHTML = `<i class="fas ${themeIcons[current]}"></i><span class="theme-label">${themeLabels[current]}</span>`;
    btn.addEventListener('click', cycleTheme);
    return btn;
  }

  function injectThemeButton() {
    // Try to inject into the header user-profile area
    const userProfile = document.querySelector('.user-profile');
    if (userProfile && !document.getElementById('theme-toggle-btn')) {
      const btn = createThemeButton();
      userProfile.prepend(btn);
    }
  }

  function init() {
    const saved = getCurrentTheme();
    setTheme(saved);
    // Wait for DOM to inject button
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectThemeButton);
    } else {
      injectThemeButton();
    }
  }

  return { init, setTheme, getCurrentTheme, cycleTheme };
})();

// Auto-init
ThemeManager.init();
