// Executado antes do CSS/React para restaurar o tema sem flash do tema claro.
(() => {
  let preference = 'system';
  try {
    const stored = localStorage.getItem('gt.ui.theme');
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch { /* Armazenamento indisponível: acompanha o sistema. */ }
  const dark = preference === 'dark' || preference === 'system' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
