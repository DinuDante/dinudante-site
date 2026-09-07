(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.theme-toggle');
  const label = document.querySelector('.theme-label');
  const meta = document.querySelector('meta[name="theme-color"]');
  let explicit = false;
  try { explicit = ['day', 'night'].includes(localStorage.getItem('dinu-theme')); } catch (_) {}
  function syncTheme() {
    const day = root.dataset.theme === 'day';
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(day));
      toggle.setAttribute('aria-label', day ? 'Switch to dark mode' : 'Switch to light mode');
      toggle.title = day ? 'Dark mode' : 'Light mode';
    }
    if (label) label.textContent = day ? 'light' : 'dark';
    if (meta) meta.content = day ? '#e5e3d8' : '#0d1512';
  }
  toggle?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'night' ? 'day' : 'night';
    explicit = true;
    try { localStorage.setItem('dinu-theme', root.dataset.theme); } catch (_) {}
    syncTheme();
  });
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', event => {
    if (!explicit) { root.dataset.theme = event.matches ? 'day' : 'night'; syncTheme(); }
  });
  syncTheme();

  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('#main-navigation');
  if (!menu || !links) return;
  root.classList.add('menu-ready');
  function closeMenu(restoreFocus = false) {
    menu.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
    if (restoreFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  });
  links.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    if (link.hash && link.pathname === location.pathname) {
      const target = document.querySelector(link.hash);
      if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-nav')) closeMenu();
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.site-nav')) closeMenu();
  });
  matchMedia('(max-width: 1100px)').addEventListener('change', () => closeMenu());
  window.addEventListener('pageshow', () => closeMenu());
})();
