/* Setup catalogue discovery: search combined with category selection,
   exposed selected state, correct counts, a visible reset, a useful empty
   state, and hash/featured links that reveal their target even when a filter
   would otherwise hide it.

   Without JavaScript every product is already rendered and visible; this file
   only adds filtering on top. */
(() => {
  const container = document.getElementById('gear-container');
  const input = document.getElementById('gear-search');
  const searchField = document.getElementById('search-field');
  const clearBtn = document.getElementById('search-clear');
  const filterList = document.getElementById('gear-filters');
  const countEl = document.getElementById('catalogue-count');
  const emptyState = document.getElementById('empty-state');
  const emptyReset = document.getElementById('empty-reset');
  const resetRow = document.getElementById('reset-row');
  const resetBtn = document.getElementById('reset-filters');
  const summaryEl = document.getElementById('filter-summary');
  if (!container || !input || !filterList) return;

  const items = Array.from(container.querySelectorAll('.gear-card'));
  const buttons = Array.from(filterList.querySelectorAll('.filter-btn'));
  const total = items.length;

  const normalise = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  let activeFilter = 'all';
  let query = '';

  function activeButton() {
    return buttons.find(b => b.dataset.filter === activeFilter) || buttons[0];
  }

  function setFilter(value) {
    activeFilter = value;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
  }

  function apply() {
    let visible = 0;
    for (const item of items) {
      const matchesCategory = activeFilter === 'all' || item.dataset.category === activeFilter;
      const matchesSearch = query === '' || item.dataset.search.includes(query);
      const show = matchesCategory && matchesSearch;
      item.hidden = !show;
      if (show) visible++;
    }

    if (countEl) countEl.textContent = visible === 1 ? '1 item' : visible + ' items';
    if (emptyState) emptyState.hidden = visible !== 0;

    const filtering = activeFilter !== 'all' || query !== '';
    if (resetRow) resetRow.hidden = !filtering;
    if (summaryEl && filtering) {
      const parts = [];
      if (activeFilter !== 'all') {
        const label = activeButton();
        parts.push('category “' + label.firstChild.textContent.trim() + '”');
      }
      if (query !== '') parts.push('search “' + input.value.trim() + '”');
      summaryEl.textContent = 'Showing ' + (visible === 1 ? '1 item' : visible + ' items') + ' for ' + parts.join(' + ') + '.';
    }

    if (searchField) searchField.classList.toggle('has-value', input.value !== '');
    syncUrlState();
    return visible;
  }

  /* Keep the current view in the URL so browser back/forward and a reload
     restore what the visitor was looking at. */
  let suppressUrlSync = false;
  function syncUrlState() {
    if (suppressUrlSync) return;
    const params = new URLSearchParams();
    if (activeFilter !== 'all') params.set('category', activeFilter);
    if (query !== '') params.set('q', input.value.trim());
    const search = params.toString();
    const next = location.pathname + (search ? '?' + search : '') + location.hash;
    if (next !== location.pathname + location.search + location.hash) {
      history.replaceState(null, '', next);
    }
  }

  function readUrlState() {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    if (category && buttons.some(b => b.dataset.filter === category)) setFilter(category);
    else setFilter('all');
    const q = params.get('q');
    input.value = q || '';
    query = normalise(q);
  }

  function resetAll(focusTarget) {
    input.value = '';
    query = '';
    setFilter('all');
    apply();
    if (focusTarget) focusTarget.focus();
  }

  /* ------------------------------------------------------------ events */

  input.addEventListener('input', () => { query = normalise(input.value); apply(); });
  input.addEventListener('search', () => { query = normalise(input.value); apply(); });

  if (clearBtn) clearBtn.addEventListener('click', () => { input.value = ''; query = ''; apply(); input.focus(); });
  if (resetBtn) resetBtn.addEventListener('click', () => resetAll(input));
  if (emptyReset) emptyReset.addEventListener('click', () => resetAll(input));

  filterList.addEventListener('click', event => {
    const btn = event.target.closest('.filter-btn');
    if (!btn) return;
    setFilter(btn.dataset.filter);
    apply();
  });

  /* ------------------------------------------- featured and hash links */

  let targetTimer = null;

  function revealTarget(hash, smooth) {
    if (!hash || hash.indexOf('#item-') !== 0) return false;
    let target;
    try { target = container.querySelector(hash); } catch (_) { return false; }
    if (!target) return false;

    // A filter or search must never hide the item a link points at.
    if (target.hidden) {
      input.value = '';
      query = '';
      setFilter('all');
      apply();
    }

    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    target.focus({ preventScroll: true });
    target.classList.add('is-target');
    clearTimeout(targetTimer);
    targetTimer = setTimeout(() => target.classList.remove('is-target'), 2600);
    return true;
  }

  // Featured cards and any other in-page item link.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#item-"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    event.preventDefault();
    suppressUrlSync = true;
    const ok = revealTarget(hash, !matchMedia('(prefers-reduced-motion: reduce)').matches);
    suppressUrlSync = false;
    if (ok) history.pushState(null, '', location.pathname + location.search + hash);
  });

  window.addEventListener('hashchange', () => revealTarget(location.hash, true));
  window.addEventListener('popstate', () => {
    suppressUrlSync = true;
    readUrlState();
    apply();
    suppressUrlSync = false;
    if (location.hash) revealTarget(location.hash, false);
  });

  /* -------------------------------------------------------------- init */

  readUrlState();
  apply();
  if (location.hash) revealTarget(location.hash, false);
})();
