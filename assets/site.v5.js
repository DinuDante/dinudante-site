/* Shared behaviour for every route: theme control and disclosure navigation.
   Loaded with `defer`. The page is fully usable if this file never runs:
   theme-init.js has already applied the saved theme, and the navigation
   links only collapse behind the menu button once `menu-ready` is set here. */
(() => {
  const root = document.documentElement;

  /* ------------------------------------------------------------ theme */

  const toggle = document.querySelector('.theme-toggle');
  const label = document.querySelector('.theme-label');
  const meta = document.querySelector('meta[name="theme-color"]');
  const THEME_COLOR = { day: '#e5e3d8', night: '#0d1512' };

  let explicit = false;
  try { explicit = ['day', 'night'].includes(localStorage.getItem('dinu-theme')); } catch (_) {}

  function syncTheme() {
    const day = root.dataset.theme === 'day';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(day));
      // The label always describes what activating the control will do.
      toggle.setAttribute('aria-label', day ? 'Switch to dark mode' : 'Switch to light mode');
      toggle.title = day ? 'Switch to dark mode' : 'Switch to light mode';
    }
    if (label) label.textContent = day ? 'light' : 'dark';
    if (meta) meta.setAttribute('content', day ? THEME_COLOR.day : THEME_COLOR.night);
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'night' ? 'day' : 'night';
      explicit = true;
      try { localStorage.setItem('dinu-theme', root.dataset.theme); } catch (_) {}
      syncTheme();
    });
  }

  // Follow the operating system until the visitor makes an explicit choice.
  const mql = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
  const onSchemeChange = event => {
    if (explicit) return;
    root.dataset.theme = event.matches ? 'day' : 'night';
    syncTheme();
  };
  if (mql) {
    if (mql.addEventListener) mql.addEventListener('change', onSchemeChange);
    else if (mql.addListener) mql.addListener(onSchemeChange);
  }
  syncTheme();

  /* ------------------------------------------------- mobile navigation */

  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('#main-navigation');
  if (!menu || !links) return;

  // Only now do the links become collapsible; see the `.menu-ready` rules.
  root.classList.add('menu-ready');

  const isOpen = () => menu.getAttribute('aria-expanded') === 'true';

  function openMenu() {
    menu.setAttribute('aria-expanded', 'true');
    links.classList.add('is-open');
  }

  function closeMenu(restoreFocus) {
    if (!isOpen() && !links.classList.contains('is-open')) return;
    menu.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
    // Clear every inline property, not just display, so nothing leaks into
    // the desktop layout after a resize.
    links.removeAttribute('style');
    if (restoreFocus) menu.focus();
  }

  menu.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (isOpen()) closeMenu(); else openMenu();
  });

  links.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    // Same-page anchors: move both scroll position and keyboard focus.
    if (link.hash && link.pathname === location.pathname && link.host === location.host) {
      const target = document.querySelector(link.hash);
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) closeMenu(true);
  });

  document.addEventListener('pointerdown', event => {
    if (isOpen() && !event.target.closest('.site-nav')) closeMenu();
  }, { passive: true });

  document.addEventListener('focusin', event => {
    if (isOpen() && !event.target.closest('.site-nav')) closeMenu();
  });

  const wide = window.matchMedia ? matchMedia('(min-width: 901px)') : null;
  if (wide) {
    const onWidthChange = () => closeMenu();
    if (wide.addEventListener) wide.addEventListener('change', onWidthChange);
    else if (wide.addListener) wide.addListener(onWidthChange);
  }
  // Restoring from the back/forward cache must not show a stale open menu.
  window.addEventListener('pageshow', () => closeMenu());
})();
