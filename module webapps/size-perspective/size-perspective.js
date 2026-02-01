(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.size-perspective');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const slider = root.querySelector('.size-slider');
    const scaleLabel = root.querySelector('[data-scale-label]');
    const scaleValue = root.querySelector('[data-scale-value]');
    const zoomRatio = root.querySelector('[data-zoom-ratio]');

    if (!slider || !scaleLabel || !scaleValue || !zoomRatio) return;

    const update = () => {
      const value = Number(slider.value) || 0;
      const t = Math.min(1, Math.max(0, value / 100));
      root.style.setProperty('--zoom', t.toFixed(3));

      const exp = -10 - (5 * t);
      const expLabel = exp.toFixed(1).replace(/\.0$/, '');
      scaleValue.innerHTML = `10<sup>${expLabel}</sup> m`;

      const ratio = Math.pow(10, 5 * t);
      zoomRatio.textContent = `Zoom ${Math.round(ratio).toLocaleString()}x`;

      let label = 'Atomic scale';
      if (t >= 0.75) {
        label = 'Nuclear scale';
      } else if (t >= 0.35) {
        label = 'Zooming in';
      }
      scaleLabel.textContent = label;
    };

    slider.addEventListener('input', () => requestAnimationFrame(update));
    update();
  };

  if (!window.ModuleWebapps || typeof window.ModuleWebapps.register !== 'function') {
    window.ModuleWebapps = window.ModuleWebapps || {};
  }

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('size-perspective', { init });
  }
})();
