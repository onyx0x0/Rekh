(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.energy-perspective');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const slider = root.querySelector('.energy-slider');
    const label = root.querySelector('[data-energy-label]');
    const value = root.querySelector('[data-energy-value]');
    const indicator = root.querySelector('[data-indicator]');
    const track = root.querySelector('.energy-scale-track');
    const chemicalCard = root.querySelector('.energy-card--chemical');
    const nuclearCard = root.querySelector('.energy-card--nuclear');
    const midCard = root.querySelector('.energy-mid-card');

    if (!slider || !label || !value || !indicator || !track) return;

    const updateIndicator = (t) => {
      const trackHeight = track.clientHeight || 0;
      const indicatorSize = indicator.offsetHeight || 14;
      if (!trackHeight) return;
      const travel = Math.max(0, trackHeight - indicatorSize);
      const top = (1 - t) * travel;
      indicator.style.top = `${top}px`;
    };

    const update = () => {
      const raw = Number(slider.value) || 0;
      const t = Math.min(1, Math.max(0, raw / 100));
      const exp = t * 6;
      const expLabel = exp.toFixed(1).replace(/\.0$/, '');
      value.innerHTML = `10<sup>${expLabel}</sup> eV`;

      let nextLabel = 'Chemical scale';
      if (exp >= 4.8) {
        nextLabel = 'Nuclear scale';
      } else if (exp >= 2.4) {
        nextLabel = 'Transition scale (keV)';
      }
      label.textContent = nextLabel;

      if (chemicalCard) {
        chemicalCard.classList.toggle('is-active', exp < 2.4);
      }
      if (midCard) {
        midCard.classList.toggle('is-active', exp >= 2.4 && exp < 4.8);
      }
      if (nuclearCard) {
        nuclearCard.classList.toggle('is-active', exp >= 4.8);
      }

      updateIndicator(t);
    };

    slider.addEventListener('input', () => requestAnimationFrame(update));

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => requestAnimationFrame(update));
      observer.observe(track);
    } else {
      window.addEventListener('resize', () => requestAnimationFrame(update));
    }

    update();
  };

  if (!window.ModuleWebapps || typeof window.ModuleWebapps.register !== 'function') {
    window.ModuleWebapps = window.ModuleWebapps || {};
  }

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('energy-perspective', { init });
  }
})();
