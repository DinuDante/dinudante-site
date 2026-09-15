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
  if (toggle) {
    toggle.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'night' ? 'day' : 'night';
      explicit = true;
      try { localStorage.setItem('dinu-theme', root.dataset.theme); } catch (_) {}
      syncTheme();
    });
  }
  const mql = matchMedia('(prefers-color-scheme: light)');
  const mqlChange = event => {
    if (!explicit) { root.dataset.theme = event.matches ? 'day' : 'night'; syncTheme(); }
  };
  if (mql.addEventListener) {
    mql.addEventListener('change', mqlChange);
  } else if (mql.addListener) {
    mql.addListener(mqlChange);
  }
  syncTheme();

  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('#main-navigation');
  if (menu && links) {
    root.classList.add('menu-ready');
    
    const closeMenu = (restoreFocus = false) => {
      menu.setAttribute('aria-expanded', 'false');
      links.classList.remove('is-open');
      if (restoreFocus) menu.focus();
    };

    menu.onclick = (e) => {
      e.preventDefault();
      const isOpen = links.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        menu.setAttribute('aria-expanded', 'true');
        links.classList.add('is-open');
      }
    };

    links.onclick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      if (link.hash && link.pathname === location.pathname) {
        closeMenu();
        const target = document.querySelector(link.hash);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });

    ['click', 'touchstart'].forEach(type => {
      document.addEventListener(type, e => {
        if (links.classList.contains('is-open') && !e.target.closest('.site-nav')) {
          closeMenu();
        }
      }, { passive: true });
    });

    document.addEventListener('focusin', e => {
      if (links.classList.contains('is-open') && !e.target.closest('.site-nav')) {
        closeMenu();
      }
    });

    matchMedia('(max-width: 1100px)').addEventListener('change', () => closeMenu());
    window.addEventListener('pageshow', () => closeMenu());
  }
})();
