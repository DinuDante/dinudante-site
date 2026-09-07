(() => {
  let saved;
  try { saved = localStorage.getItem('dinu-theme'); } catch (_) {}
  const system = matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
  document.documentElement.dataset.theme = ['day', 'night'].includes(saved) ? saved : system;
})();
