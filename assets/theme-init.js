/* Runs before first paint. Applies the saved (or system) theme and marks the
   document as scripted, so the navigation can collapse behind the menu button
   immediately instead of reflowing once the deferred script arrives. */
(() => {
  const root = document.documentElement;
  let saved;
  try { saved = localStorage.getItem('dinu-theme'); } catch (_) {}
  const system = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
  root.dataset.theme = ['day', 'night'].includes(saved) ? saved : system;
  root.classList.add('js');

  /* Last-resort menu toggle, used only if site.v5.js never arrives. It is a
     no-op once that script has run and set `menu-ready`. */
  document.addEventListener('click', event => {
    if (root.classList.contains('menu-ready')) return;
    const btn = event.target.closest && event.target.closest('.menu-toggle');
    if (!btn) return;
    const links = document.getElementById('main-navigation');
    if (!links) return;
    event.preventDefault();
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    links.classList.toggle('is-open', !open);
  });
})();
