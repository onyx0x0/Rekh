(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.force-intro');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    return;
  };

  if (!window.ModuleWebapps || typeof window.ModuleWebapps.register !== 'function') {
    window.ModuleWebapps = window.ModuleWebapps || {};
  }

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('force-intro', { init });
  }
})();
