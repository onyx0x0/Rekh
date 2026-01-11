(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.force-scale');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const grid = root.querySelector('.force-scale-grid');
    const scaleValue = root.querySelector('[data-scale-value]');
    const distanceSliderWrap = root.querySelector('[data-slider="distance"]');
    const energySliderWrap = root.querySelector('[data-slider="energy"]');
    const distanceSlider = distanceSliderWrap ? distanceSliderWrap.querySelector('.force-scale-range') : null;
    const energySlider = energySliderWrap ? energySliderWrap.querySelector('.force-scale-range') : null;
    const modeButtons = Array.from(root.querySelectorAll('[data-mode]'));

    if (!grid || !scaleValue || !distanceSlider || !energySlider) return;

    const nodeElements = Array.from(grid.querySelectorAll('.force-node'));
    const nodes = {};
    const labels = {};
    const statuses = {};

    nodeElements.forEach((el) => {
      const key = el.dataset.force;
      nodes[key] = el;
      labels[key] = el.querySelector('.force-node-label');
      statuses[key] = el.querySelector('.force-node-status');
    });

    const baseLabels = {
      gravity: 'Gravity',
      em: 'Electro<br>magnetism',
      weak: 'Weak',
      strong: 'Strong'
    };

    const mergedLabels = {
      electroweak: 'Electro<br>weak',
      gut: 'Grand<br>Unified',
      toe: 'Theory of<br>Everything'
    };

    const positions = {};
    let singleRow = true;

    const statusClasses = [
      'status-dominant',
      'status-relevant',
      'status-negligible',
      'status-separate',
      'status-merged',
      'status-unified'
    ];

    const computePositions = () => {
      const gridWidth = grid.clientWidth || 1;
      const tops = nodeElements.map((el) => el.offsetTop);
      singleRow = tops.every((top) => Math.abs(top - tops[0]) < 2);
      nodeElements.forEach((el) => {
        positions[el.dataset.force] = el.offsetLeft + el.offsetWidth / 2 - gridWidth / 2;
      });
    };

    const setLabel = (key, html) => {
      const label = labels[key];
      if (!label) return;
      if (label.innerHTML !== html) {
        label.innerHTML = html;
      }
    };

    const setStatus = (key, text, level) => {
      const status = statuses[key];
      if (!status) return;
      if (status.textContent !== text) {
        status.textContent = text;
      }
      statusClasses.forEach((cls) => status.classList.remove(cls));
      if (level) {
        status.classList.add(`status-${level}`);
      }
    };

    const setNode = (key, { offset = 0, scale = 1, opacity = 1, merged = false }) => {
      const el = nodes[key];
      if (!el) return;
      el.style.setProperty('--offset-x', `${offset.toFixed(2)}px`);
      el.style.setProperty('--node-scale', scale.toFixed(3));
      el.style.setProperty('--node-opacity', opacity.toFixed(3));
      el.classList.toggle('force-node--merged', merged);
    };

    const getDistanceStatus = (force, exp) => {
      switch (force) {
        case 'gravity':
          if (exp >= 0) return { text: 'Dominant', level: 'dominant' };
          if (exp >= -6) return { text: 'Relevant', level: 'relevant' };
          return { text: 'Negligible', level: 'negligible' };
        case 'em':
          if (exp >= -6) return { text: 'Relevant', level: 'relevant' };
          if (exp >= -12) return { text: 'Dominant', level: 'dominant' };
          return { text: 'Relevant', level: 'relevant' };
        case 'strong':
          if (exp >= -12) return { text: 'Negligible', level: 'negligible' };
          if (exp >= -14) return { text: 'Relevant', level: 'relevant' };
          return { text: 'Dominant', level: 'dominant' };
        case 'weak':
          if (exp <= -18) return { text: 'Relevant', level: 'relevant' };
          return { text: 'Negligible', level: 'negligible' };
        default:
          return { text: 'Negligible', level: 'negligible' };
      }
    };

    const updateDistance = () => {
      const value = Number(distanceSlider.value) || 0;
      const exp = Math.round(6 - (value / 100) * 24);
      scaleValue.innerHTML = `10<sup>${exp}</sup> m`;

      setLabel('gravity', baseLabels.gravity);
      setLabel('em', baseLabels.em);
      setLabel('weak', baseLabels.weak);
      setLabel('strong', baseLabels.strong);

      ['gravity', 'em', 'weak', 'strong'].forEach((key) => {
        const status = getDistanceStatus(key, exp);
        setStatus(key, status.text, status.level);
        setNode(key, { offset: 0, scale: 1, opacity: 1, merged: false });
      });
    };

    const updateEnergy = () => {
      const value = Number(energySlider.value) || 0;
      const exp = Math.round((value / 100) * 19);
      scaleValue.innerHTML = `10<sup>${exp}</sup> GeV`;

      const ewOn = exp >= 2;
      const gutOn = exp >= 15;
      const toeOn = exp >= 19;

      setLabel('gravity', baseLabels.gravity);
      setLabel('weak', baseLabels.weak);
      setLabel('strong', baseLabels.strong);

      let mergedLabel = baseLabels.em;
      if (toeOn) {
        mergedLabel = mergedLabels.toe;
      } else if (gutOn) {
        mergedLabel = mergedLabels.gut;
      } else if (ewOn) {
        mergedLabel = mergedLabels.electroweak;
      }
      setLabel('em', mergedLabel);

      setStatus('em', ewOn ? 'Unified' : 'Separate', ewOn ? 'unified' : 'separate');
      setStatus('weak', ewOn ? 'Merged' : 'Separate', ewOn ? 'merged' : 'separate');
      setStatus('strong', gutOn ? 'Merged' : 'Separate', gutOn ? 'merged' : 'separate');
      setStatus('gravity', toeOn ? 'Merged' : 'Separate', toeOn ? 'merged' : 'separate');

      const hasPositions = ['gravity', 'em', 'weak', 'strong'].every((key) => typeof positions[key] === 'number');
      const pos = hasPositions ? positions : { gravity: 0, em: 0, weak: 0, strong: 0 };
      const centerX = 0;

      const targets = {
        gravity: toeOn ? centerX : pos.gravity,
        em: ewOn || gutOn || toeOn ? centerX : pos.em,
        weak: ewOn ? centerX : pos.weak,
        strong: gutOn ? centerX : pos.strong
      };

      const offsets = { gravity: 0, em: 0, weak: 0, strong: 0 };

      if (singleRow && hasPositions) {
        offsets.gravity = targets.gravity - pos.gravity;
        offsets.em = targets.em - pos.em;
        offsets.weak = targets.weak - pos.weak;
        offsets.strong = targets.strong - pos.strong;
      }

      const gravityOpacity = toeOn ? 0 : 1;
      const strongOpacity = gutOn ? 0 : 1;
      const weakOpacity = ewOn ? 0 : 1;
      const emOpacity = 1;

      let emScale = 1;
      if (ewOn) emScale = 1.12;
      if (gutOn) emScale = 1.18;
      if (toeOn) emScale = 1.24;

      setNode('gravity', { offset: offsets.gravity, scale: 1, opacity: gravityOpacity, merged: false });
      setNode('em', { offset: offsets.em, scale: emScale, opacity: emOpacity, merged: ewOn || gutOn || toeOn });
      setNode('weak', { offset: offsets.weak, scale: 1, opacity: weakOpacity, merged: false });
      setNode('strong', { offset: offsets.strong, scale: 1, opacity: strongOpacity, merged: false });
    };

    const update = () => {
      if ((root.dataset.mode || 'distance') === 'energy') {
        updateEnergy();
      } else {
        updateDistance();
      }
    };

    const setMode = (mode) => {
      const nextMode = mode === 'energy' ? 'energy' : 'distance';
      root.dataset.mode = nextMode;
      if (distanceSliderWrap) {
        distanceSliderWrap.classList.toggle('is-hidden', nextMode !== 'distance');
      }
      if (energySliderWrap) {
        energySliderWrap.classList.toggle('is-hidden', nextMode !== 'energy');
      }
      modeButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.mode === nextMode);
      });
      update();
    };

    const refresh = () => {
      computePositions();
      update();
    };

    const updateOnFrame = () => requestAnimationFrame(update);

    distanceSlider.addEventListener('input', updateOnFrame);
    energySlider.addEventListener('input', updateOnFrame);

    modeButtons.forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.mode));
    });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => requestAnimationFrame(refresh));
      observer.observe(grid);
    } else {
      window.addEventListener('resize', refresh);
    }

    setMode(root.dataset.mode || 'distance');
  };

  if (!window.ModuleWebapps || typeof window.ModuleWebapps.register !== 'function') {
    window.ModuleWebapps = window.ModuleWebapps || {};
  }

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('force-scale', { init });
  }
})();
