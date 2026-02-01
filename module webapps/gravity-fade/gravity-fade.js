(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.gravity-fade');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const slider = root.querySelector('.gravity-slider');
    const label = root.querySelector('[data-readout-label]');
    const value = root.querySelector('[data-readout-value]');

    if (!slider || !label || !value) return;

    const update = () => {
      const raw = Number(slider.value) || 0;
      const t = Math.min(1, Math.max(0, raw / 100));
      const windowPositions = ['12%', '42%', '72%'];
      const index = t < 0.33 ? 0 : t < 0.66 ? 1 : 2;
      root.style.setProperty('--window-y', windowPositions[index]);

      if (index === 0) {
        label.textContent = 'Cosmic scale';
        value.textContent = 'Gravity dominates large-scale motion';
      } else if (index === 1) {
        label.textContent = 'Atomic scale';
        value.textContent = 'Gravity fades compared to EM';
      } else {
        label.textContent = 'Nuclear scale';
        value.textContent = 'Gravity is negligible';
      }
    };

    slider.addEventListener('input', () => requestAnimationFrame(update));
    update();
  };

  if (!window.ModuleWebapps || typeof window.ModuleWebapps.register !== 'function') {
    window.ModuleWebapps = window.ModuleWebapps || {};
  }

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('gravity-fade', { init });
  }
})();
