/* The v3 theme control, shared by the header and any page that shows it (a design-system
   story). Its look is the header's (.header .theme-control); another host styles its own. */
const THEME_KEY = 'jj-theme';
const THEMES = [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']];
const DARK_OS = window.matchMedia('(prefers-color-scheme: dark)');

function syncTheme(control) {
  const root = document.documentElement;
  const choice = root.dataset.themeChoice || 'system';
  const dark = choice === 'dark' || (choice === 'system' && DARK_OS.matches);
  root.dataset.themeEffective = dark ? 'dark' : 'light';
  control.querySelectorAll('[data-set-theme]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.setTheme === choice));
  });
}

function applyTheme(choice, control) {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.dataset.theme = choice;
  root.dataset.themeChoice = choice;
  syncTheme(control);
}

/**
 * The v3 theme control: Light, Dark, System. The choice persists under jj-theme; scripts.js
 * applies it before the body appears on the next page.
 */
export default function buildThemeControl() {
  const control = document.createElement('div');
  control.className = 'theme-control';
  control.setAttribute('role', 'group');
  control.setAttribute('aria-label', 'Color theme');
  THEMES.forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-control-button';
    button.dataset.setTheme = value;
    button.textContent = label;
    control.append(button);
  });
  control.addEventListener('click', (event) => {
    const button = event.target.closest('[data-set-theme]');
    if (!button) return;
    applyTheme(button.dataset.setTheme, control);
    try {
      localStorage.setItem(THEME_KEY, button.dataset.setTheme);
    } catch {
      // optional persistence
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY) return;
    const valid = THEMES.some(([value]) => value === event.newValue);
    applyTheme(valid ? event.newValue : 'system', control);
  });
  DARK_OS.addEventListener('change', () => syncTheme(control));
  syncTheme(control);
  return control;
}
