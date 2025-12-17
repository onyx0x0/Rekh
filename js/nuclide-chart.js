// Premium Nuclide Chart with Advanced Decay Tree Visualization
(function() {
  const state = {
    isotope: null,
    colorMap: 'halflife',
    searchQuery: '',
    filters: {
      stable: true,
      long: true,
      medium: true,
      short: true,
      instant: true,
      unstable: true,
      unknown: true
    }
  };

  const colorMaps = {
    halflife: {
      name: 'Half-life',
      colors: {
        stable: '#420057',
        long: '#eb004d',
        medium: '#f17700',
        short: '#ff6c5a',
        instant: '#d00031',
        unstable: '#cc0078',
        unknown: '#303262'
      },
      legend: [
        { key: 'stable', label: 'Stable' },
        { key: 'long', label: '>=1 year' },
        { key: 'medium', label: '1 day - 1 year' },
        { key: 'short', label: '1s - 1 day' },
        { key: 'instant', label: '<1 second' },
        { key: 'unstable', label: 'Particle unstable' },
        { key: 'unknown', label: 'Unknown' }
      ]
    },
    decay: {
      name: 'Decay Mode',
      colors: {
        stable: '#420057',
        'beta-minus': '#eb004d',
        'beta-plus': '#d00031',
        alpha: '#f17700',
        proton: '#ff6c5a',
        neutron: '#6e0029',
        ec: '#d00031',
        it: '#f770ff',
        sf: '#38163a',
        mixed: '#303262',
        unknown: '#303262'
      },
      legend: [
        { key: 'stable', label: 'Stable' },
        { key: 'beta-minus', label: 'Beta minus' },
        { key: 'beta-plus', label: 'Beta plus / EC' },
        { key: 'alpha', label: 'Alpha' },
        { key: 'proton', label: 'Proton emission' },
        { key: 'neutron', label: 'Neutron emission' },
        { key: 'it', label: 'Isomeric transition' },
        { key: 'sf', label: 'Spontaneous fission' },
        { key: 'mixed', label: 'Multiple modes' },
        { key: 'unknown', label: 'Unknown' }
      ]
    },
    neutrons: {
      name: 'Neutron Number',
      getColor: (n) => {
        const hue = (n % 60) * 6;
        return `hsl(${hue}, 70%, 60%)`;
      },
      legend: [{ label: 'Color by neutron count', gradient: true }]
    },
    protons: {
      name: 'Proton Number',
      getColor: (z) => {
        const hue = (z % 60) * 6;
        return `hsl(${hue}, 80%, 55%)`;
      },
      legend: [{ label: 'Color by proton count', gradient: true }]
    },
    mass: {
      name: 'Mass Number',
      getColor: (a) => {
        const ratio = Math.min(1, a / 300);
        const hue = 240 + ratio * 120;
        return `hsl(${hue}, 70%, 60%)`;
      },
      legend: [{ label: 'Light -> Heavy', gradient: true }]
    }
  };


  const chart = {
    container: null,
    canvas: null,
    ctx: null,
    dpr: 1,
    layout: null,
    nuclides: [],
    filteredNuclides: [],
    byCoord: new Map(),
    decayIndex: new Map(),
    decayOverlay: null,
    bounds: null,
    spans: null,
    baseCell: 10,
    zoom: 1,
    panX: 0,
    panY: 0,
    offsetX: 0,
    offsetY: 0,
    selectedKey: null,
    needsFit: true,
    isPanning: false,
    dragDistance: 0,
    lastPointer: null,
    labelThreshold: 8
  };
  let dataLoadStarted = false;

  // Flash timing and easing (tweakable)
  const FLASH_DURATION_MS = 1400;  // total duration of chart flash
  const FLASH_SPLIT = 0.15;          // fraction of time easing toward highlight (0-1)
  const FLASH_EASE_IN_POWER = 10;    // power curve returning to base
  const FLASH_EASE_OUT_POWER = 1;  // power curve toward highlight
  const flashState = {
    type: null,
    value: null,
    timer: null,
    scope: null,
    start: 0,
    animHandle: null
  };

  document.addEventListener('DOMContentLoaded', () => {
    setupButton();
  });

  function setupButton() {
    const navLeft = document.querySelector('.nav-left');
    if (!navLeft) return;
    let btn = document.getElementById('nuclide-chart-button');
    if (!btn) {
      const li = document.createElement('li');
      btn = document.createElement('button');
      btn.id = 'nuclide-chart-button';
      btn.className = 'nuclide-chart-button';
      btn.type = 'button';
      btn.textContent = 'Nuclides';
      li.appendChild(btn);
      navLeft.appendChild(li);
    }
    if (!btn.__nuclideBound) {
      btn.addEventListener('click', openModal);
      btn.__nuclideBound = true;
    }
  }

  function normalizeMode(modeRaw) {
    if (!modeRaw) return 'unknown';
    const rawStr = String(modeRaw).trim();
    const raw = rawStr.toLowerCase();

    if (raw === 'a' || raw.includes('alpha')) return 'alpha-decay';

    if (
      raw === 'beta-' ||
      raw === 'b-' ||
      raw.startsWith('b-') ||
      raw.includes('beta-') ||
      raw.includes('betaminus') ||
      raw.includes('beta minus')
    ) {
      return 'beta-minus-decay';
    }

    if (
      raw === 'beta+' ||
      raw === 'b+' ||
      raw.startsWith('b+') ||
      raw.includes('beta+') ||
      raw.includes('betaplus') ||
      raw.includes('beta plus') ||
      raw.startsWith('ec') ||
      raw.includes('electron capture')
    ) {
      return 'electron-capture-beta-plus-decay';
    }

    if (raw.startsWith('it') || raw.includes('isomer')) {
      return 'isomeric-transition';
    }

    if (raw.startsWith('sf') || (raw.includes('spont') && raw.includes('fission'))) {
      return 'spontaneous-fission';
    }

    if (raw.startsWith('p') && !raw.includes('beta')) {
      return 'proton-emission';
    }

    if (raw.startsWith('n') && !raw.includes('beta')) {
      return 'neutron-emission';
    }

    if (raw.includes('double') && raw.includes('beta')) {
      return raw.includes('+') ? 'double-beta-plus-decay' : 'double-beta-minus-decay';
    }

    if (raw.startsWith('2b-')) return 'double-beta-minus-decay';
    if (raw.startsWith('2b+')) return 'double-beta-plus-decay';

    if (raw.includes('cluster')) return 'cluster-decay';
    if (raw.includes('beta-delayed') && raw.includes('n')) return 'beta-delayed-neutron-emission';

    const slug = raw.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'unknown';
  }

  function scopeIncludes(target) {
    const scope = flashState.scope || 'all';
    if (scope === 'all') return true;
    if (Array.isArray(scope)) return scope.includes(target);
    return scope === target;
  }

  function triggerFlash(type, value, scope = 'all') {
    if (!type) return;
    if (flashState.timer) clearTimeout(flashState.timer);
    if (flashState.animHandle) cancelAnimationFrame(flashState.animHandle);
    flashState.type = type;
    flashState.value = value;
    flashState.scope = scope;
    flashState.start = performance.now ? performance.now() : Date.now();
    applyFlashClasses();
    renderChart();
    startFlashAnimation();
    flashState.timer = setTimeout(clearFlash, FLASH_DURATION_MS);
  }

  function clearFlash() {
    if (flashState.timer) {
      clearTimeout(flashState.timer);
      flashState.timer = null;
    }
    if (flashState.animHandle) {
      cancelAnimationFrame(flashState.animHandle);
      flashState.animHandle = null;
    }
    flashState.type = null;
    flashState.value = null;
    flashState.scope = null;
    applyFlashClasses();
    renderChart();
  }

  function startFlashAnimation() {
    const step = () => {
      if (!flashState.type) {
        flashState.animHandle = null;
        return;
      }
      renderChart();
      const now = performance.now ? performance.now() : Date.now();
      const elapsed = now - flashState.start;
      if (elapsed < FLASH_DURATION_MS) {
        flashState.animHandle = requestAnimationFrame(step);
      } else {
        flashState.animHandle = null;
      }
    };
    flashState.animHandle = requestAnimationFrame(step);
  }

  function getLegendKeyForNuclide(nuclide) {
    if (!nuclide) return null;
    if (state.colorMap === 'decay') return nuclide.decayCategory;
    if (state.colorMap === 'halflife') return nuclide.category;
    return null;
  }

  function nuclideMatchesFlash(nuclide) {
    if (!flashState.type || !scopeIncludes('chart')) return true;
    const nuclideKey = `${nuclide.protons}-${nuclide.neutrons}`;

    if (flashState.type === 'nuclide') return nuclideKey === flashState.value;
    if (flashState.type === 'decay-mode') {
      const targetCategory = mapModeToCategory(normalizeMode(flashState.value));
      return targetCategory && nuclide.decayCategory === targetCategory;
    }
    if (flashState.type === 'category') {
      const legendKey = getLegendKeyForNuclide(nuclide);
      return legendKey && legendKey === flashState.value;
    }
    return false;
  }

  function setElementFlashState(el, isMatch, isActive) {
    if (!el) return;
    el.classList.toggle('element-highlighted', Boolean(isActive && isMatch));
    el.classList.toggle('element-dimmed', Boolean(isActive && !isMatch));
  }

  function applyLegendFlash() {
    const active = flashState.type === 'category' && scopeIncludes('legend');
    const items = document.querySelectorAll('#legend-container .legend-item');
    items.forEach(item => {
      item.classList.remove('element-highlighted', 'element-dimmed');
      const color = item.querySelector('.legend-color');
      color?.classList.remove('element-highlighted', 'element-dimmed');
    });
    if (!active) return;
    items.forEach(item => {
      const key = item.dataset.key;
      if (key && key === String(flashState.value)) {
        item.classList.add('element-highlighted');
        item.classList.remove('element-dimmed');
        const color = item.querySelector('.legend-color');
        color?.classList.add('element-highlighted');
        color?.classList.remove('element-dimmed');
      }
    });
  }

  function applyDecayLegendFlash() {
    const active = flashState.type === 'decay-mode' && scopeIncludes('decay');
    const items = document.querySelectorAll('.decay-legend-item');
    items.forEach(item => {
      const mode = item.dataset.mode;
      const match = active && mode === String(flashState.value);
      setElementFlashState(item, match, active);
      setElementFlashState(item.querySelector('.decay-legend-swatch'), match, active);
    });
  }

  function applyDecayGraphFlash() {
    if (!scopeIncludes('decay')) {
      // Ensure any stale classes are cleared when scope doesn't include decay
      document.querySelectorAll('.decay-node-group, .decay-branch').forEach(el => setElementFlashState(el, false, false));
      return;
    }
    const hasFlash = Boolean(flashState.type);
    const targetMode = flashState.type === 'decay-mode' ? String(flashState.value) : null;
    const targetKey = flashState.type === 'nuclide' ? String(flashState.value) : null;
    const targetCategory = flashState.type === 'category' ? String(flashState.value) : null;
    const targetModeCategory = flashState.type === 'decay-mode'
      ? mapModeToCategory(normalizeMode(flashState.value))
      : null;

    const nodeGroups = document.querySelectorAll('.decay-node-group');
    nodeGroups.forEach(group => {
      const key = group.dataset.key;
      const category = group.dataset.category;
      const decayCategory = group.dataset.decayCategory;

      let match = false;
      if (flashState.type === 'nuclide') {
        match = key === targetKey;
      } else if (flashState.type === 'category') {
        match = category === targetCategory || decayCategory === targetCategory;
      } else if (flashState.type === 'decay-mode') {
        match = decayCategory && decayCategory === targetModeCategory;
      }

      setElementFlashState(group, match, hasFlash);
    });

    const branches = document.querySelectorAll('.decay-branch');
    branches.forEach(branch => {
      const mode = branch.dataset.mode;
      const from = branch.dataset.from;
      const to = branch.dataset.to;
      const fromCategory = branch.dataset.fromCategory;
      const toCategory = branch.dataset.toCategory;

      let match = false;
      if (flashState.type === 'decay-mode') {
        match = mode === targetMode;
      } else if (flashState.type === 'nuclide') {
        match = from === targetKey || to === targetKey;
      } else if (flashState.type === 'category') {
        match = targetCategory && (fromCategory === targetCategory || toCategory === targetCategory);
      }

      setElementFlashState(branch, match, hasFlash);
    });
  }

  function applyFlashClasses() {
    applyLegendFlash();
    applyDecayLegendFlash();
    applyDecayGraphFlash();
  }

  function buildModal() {
    const existingModal = document.getElementById('nuclide-modal');
    if (existingModal) return existingModal;
    
    const modal = document.createElement('div');
    modal.id = 'nuclide-modal';
    modal.className = 'nuclide-modal';

    // Animation wrapper - this gets the scale transform, surface stays at actual size
    const animationWrapper = document.createElement('div');
    animationWrapper.className = 'nuclide-animation-wrapper';

    const surface = document.createElement('div');
    surface.className = 'nuclide-chart-surface';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-button';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', closeModal);
    surface.appendChild(closeBtn);

    const header = buildHeader();
    const controls = buildControls();
    const body = buildBody();

    surface.appendChild(header);
    surface.appendChild(controls);
    surface.appendChild(body);
    animationWrapper.appendChild(surface);
    buildDecayOverlay(modal);
    modal.appendChild(animationWrapper);
    document.body.appendChild(modal);

    // Handle clicks on the modal backdrop (not outside the modal)
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        // If decay overlay is open, do not close modal
        const decayLayer = modal.querySelector('.decay-overlay-layer');
        if (decayLayer && decayLayer.classList.contains('visible')) return;
        if (modal.dataset.decayClosed === '1') {
          delete modal.dataset.decayClosed;
          return;
        }
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
    });

    window.addEventListener('resize', () => resizeChart());
    return modal;
  }

  function buildHeader() {
    const header = document.createElement('div');
    header.className = 'nuclide-chart-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Nuclide Chart';
    
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Interactive chart of the nuclides';
    
    header.appendChild(title);
    header.appendChild(subtitle);
    return header;
  }

  function buildControls() {
    const controls = document.createElement('div');
    controls.className = 'nuclide-controls';

    const colorMapGroup = document.createElement('div');
    colorMapGroup.className = 'control-group';
    const colorMapLabel = document.createElement('label');
    colorMapLabel.textContent = 'Color by';
    const dropdown = createColorMapDropdown();
    
    colorMapGroup.appendChild(colorMapLabel);
    colorMapGroup.appendChild(dropdown);

    const searchGroup = document.createElement('div');
    searchGroup.className = 'control-group';
    const searchLabel = document.createElement('label');
    searchLabel.textContent = 'Search';
    const searchInput = document.createElement('input');
    searchInput.className = 'control-input';
    searchInput.id = 'isotope-search';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search isotopes (e.g., Fe-56)...';
    
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      applyFilters();
    });
    
    searchGroup.appendChild(searchLabel);
    searchGroup.appendChild(searchInput);

    const filterGroup = document.createElement('div');
    filterGroup.className = 'control-group';
    const filterLabel = document.createElement('label');
    filterLabel.textContent = 'Filter';
    const filterChips = document.createElement('div');
    filterChips.className = 'filter-chips';
    
    const filterOptions = [
      { key: 'stable', label: 'Stable' },
      { key: 'long', label: 'Long' },
      { key: 'medium', label: 'Medium' },
      { key: 'short', label: 'Short' },
      { key: 'instant', label: 'Instant' },
      { key: 'unstable', label: 'Unstable' },
      { key: 'unknown', label: 'Unknown' }
    ];
    
    filterOptions.forEach(opt => {
      const chip = document.createElement('div');
      chip.className = 'filter-chip active';
      chip.textContent = opt.label;
      chip.dataset.filter = opt.key;
      chip.addEventListener('click', () => {
        state.filters[opt.key] = !state.filters[opt.key];
        chip.classList.toggle('active', state.filters[opt.key]);
        applyFilters();
      });
      filterChips.appendChild(chip);
    });
    
    filterGroup.appendChild(filterLabel);
    filterGroup.appendChild(filterChips);

    controls.appendChild(colorMapGroup);
    controls.appendChild(searchGroup);
    controls.appendChild(filterGroup);
    return controls;
  }

  const dropdownRegistry = [];

  function closeAllDropdowns() {
    dropdownRegistry.forEach(d => d.shell.classList.remove('open'));
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.color-map-dropdown')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });

  function createColorMapDropdown() {
    const shell = document.createElement('div');
    shell.className = 'color-map-dropdown';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'color-map-toggle';
    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = colorMaps[state.colorMap]?.name || 'Select';
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.innerHTML = `
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M3.5 6.5 8 11l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    toggle.appendChild(toggleLabel);
    toggle.appendChild(chevron);

    const options = document.createElement('div');
    options.className = 'color-map-options';

    Object.keys(colorMaps).forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-map-option';
      if (key === state.colorMap) btn.classList.add('active');
      btn.dataset.value = key;
      btn.textContent = colorMaps[key].name;
      btn.addEventListener('click', () => {
        state.colorMap = key;
        toggleLabel.textContent = colorMaps[key].name;
        options.querySelectorAll('.color-map-option').forEach(o => o.classList.remove('active'));
        btn.classList.add('active');
        updateLegend();
        renderChart();
        shell.classList.remove('open');
      });
      options.appendChild(btn);
    });

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = shell.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) shell.classList.add('open');
    });

    shell.appendChild(toggle);
    shell.appendChild(options);

    dropdownRegistry.push({ shell });
    return shell;
  }

  function buildBody() {
    const body = document.createElement('div');
    body.className = 'nuclide-chart-body';

    const chartArea = buildChartArea();
    const panel = buildInfoPanel();
    
    body.appendChild(chartArea);
    body.appendChild(panel);
    return body;
  }

  function buildChartArea() {
    const wrap = document.createElement('div');
    wrap.className = 'nuclide-chart-main';
    
    const canvas = document.createElement('canvas');
    canvas.className = 'nuclide-chart-canvas';
    wrap.appendChild(canvas);

    const legendContainer = document.createElement('div');
    legendContainer.className = 'nuclide-legend-container';
    legendContainer.id = 'legend-container';
    wrap.appendChild(legendContainer);

    chart.container = wrap;
    chart.canvas = canvas;
    chart.ctx = canvas.getContext('2d', { alpha: false });

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointerleave', (evt) => handlePointerUp(evt, { skipSelect: true }));

    updateLegend();
    return wrap;
  }

  function updateLegend() {
    const container = document.getElementById('legend-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const title = document.createElement('div');
    title.className = 'nuclide-legend-title';
    title.textContent = colorMaps[state.colorMap].name;
    container.appendChild(title);
    
    const items = document.createElement('div');
    items.className = 'nuclide-legend-items';
    
    const map = colorMaps[state.colorMap];
    if (map.legend) {
      map.legend.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        if (item.key) legendItem.dataset.key = item.key;
        
        const color = document.createElement('div');
        color.className = 'legend-color';
        if (item.gradient) {
          color.style.background = 'linear-gradient(to right, #4dabf7, #ffd43b, #ff6b6b)';
        } else {
          color.style.background = map.colors[item.key];
        }
        
        const label = document.createElement('div');
        label.className = 'legend-label';
        label.textContent = item.label;
        
        legendItem.appendChild(color);
        legendItem.appendChild(label);
        if (!item.gradient && item.key) {
          legendItem.addEventListener('click', () => triggerFlash('category', item.key, ['chart', 'legend']));
        }
        items.appendChild(legendItem);
      });
    }
    
    container.appendChild(items);
    applyFlashClasses();
  }

  function buildInfoPanel() {
    const panel = document.createElement('div');
    panel.className = 'nuclide-info-panel';
    panel.id = 'info-panel';
    
    updateInfoPanel(null);
    return panel;
  }

  function updateInfoPanel(nuclide) {
    const panel = document.getElementById('info-panel');
    if (!panel) return;
    
    panel.innerHTML = '';
    
    if (!nuclide) {
      const noSelection = document.createElement('div');
      noSelection.className = 'no-selection';
      noSelection.innerHTML = `
        <div class="no-selection-icon">⚛</div>
        <div class="no-selection-text">Click on a nuclide to view details</div>
      `;
      panel.appendChild(noSelection);
      return;
    }
    
    const titleSection = document.createElement('div');
    titleSection.className = 'info-section';
    const title = document.createElement('div');
    title.className = 'isotope-title';
    title.textContent = nuclide.label;
    const subtitle = document.createElement('div');
    subtitle.className = 'isotope-subtitle';
    subtitle.textContent = nuclide.element;
    titleSection.appendChild(title);
    titleSection.appendChild(subtitle);
    panel.appendChild(titleSection);
    
    const basicSection = document.createElement('div');
    basicSection.className = 'info-section';
    const basicTitle = document.createElement('h3');
    basicTitle.textContent = 'Basic Properties';
    basicSection.appendChild(basicTitle);
    
    const basicGrid = document.createElement('div');
    basicGrid.className = 'data-grid';
    
    const basicData = [
      { label: 'Protons (Z)', value: nuclide.protons },
      { label: 'Neutrons (N)', value: nuclide.neutrons },
      { label: 'Mass Number (A)', value: nuclide.massNumber },
      { label: 'N/Z Ratio', value: (nuclide.neutrons / nuclide.protons).toFixed(3) }
    ];
    
    basicData.forEach(item => {
      const dataItem = createDataItem(item.label, item.value);
      basicGrid.appendChild(dataItem);
    });
    
    basicSection.appendChild(basicGrid);
    panel.appendChild(basicSection);
    
    const nuclearSection = document.createElement('div');
    nuclearSection.className = 'info-section';
    const nuclearTitle = document.createElement('h3');
    nuclearTitle.textContent = 'Nuclear Properties';
    nuclearSection.appendChild(nuclearTitle);
    
    const nuclearGrid = document.createElement('div');
    nuclearGrid.className = 'data-grid';
    
    const nuclearData = [
      { label: 'Half-life', value: nuclide.halfLife, full: true },
      { label: 'Spin & Parity', value: nuclide.spinParity },
      { label: 'Discovery', value: nuclide.discoveryYear },
      { label: 'Decay Modes', value: nuclide.decayModes, full: true }
    ];
    
    nuclearData.forEach(item => {
      const dataItem = createDataItem(item.label, item.value, item.full);
      nuclearGrid.appendChild(dataItem);
    });
    
    nuclearSection.appendChild(nuclearGrid);
    panel.appendChild(nuclearSection);
  }

  const decayModeStyles = {
    'alpha-decay': { label: '\u03b1', color: '#f17700' },
    'beta-minus-decay': { label: '\u03b2-', color: '#eb004d' },
    'electron-capture-beta-plus-decay': { label: 'EC/\u03b2+', color: '#d00031' },
    'isomeric-transition': { label: 'IT', color: '#f770ff' },
    'spontaneous-fission': { label: 'SF', color: '#38163a' },
    'proton-emission': { label: 'p', color: '#ff6c5a' },
    'neutron-emission': { label: 'n', color: '#6e0029' },
    'double-beta-minus-decay': { label: '\u03b2\u03b2-', color: '#8e6dfd' },
    'double-beta-plus-decay': { label: '\u03b2\u03b2+', color: '#4dd0e1' },
    'cluster-decay': { label: 'Cluster', color: '#16a085' },
    'beta-delayed-neutron-emission': { label: '\u03b2n', color: '#1abc9c' },
    unknown: { label: '?', color: '#303262' }
  };

  const renderableDecaySlugs = new Set([
    'alpha-decay',
    'beta-minus-decay',
    'electron-capture-beta-plus-decay',
    'proton-emission',
    'neutron-emission',
    'double-beta-minus-decay',
    'double-beta-plus-decay',
    'beta-delayed-neutron-emission',
    'cluster-decay',
    'isomeric-transition',
    'spontaneous-fission'
  ]);

  const MIN_FISSION_BRANCH_PERCENT = 0.001; // ignore vanishing SF traces

  function parseBranchPercent(part) {
    if (!part || typeof part !== 'string') return null;
    const trimmed = part.trim();
    // Ignore speculative or limit-style entries; they are not firm decay branches.
    if (!trimmed || /[<>?]/.test(trimmed)) return null;
    const match = trimmed.match(/([0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?)/i);
    if (!match) return null;
    const value = parseFloat(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  function parseDecayModesString(modesText) {
    if (!modesText || typeof modesText !== 'string') return [];
    return modesText
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const match = part.match(/^([A-Za-z][A-Za-z0-9+\-]*)/);
        const code = (match?.[1] || part).toUpperCase();
        const percent = parseBranchPercent(part);
        const slug = mapDecayCodeToSlug(code);
        return { code, slug, percent };
      });
  }

  function mapDecayCodeToSlug(code) {
    switch (code) {
      case 'A': return 'alpha-decay';
      case 'B-': return 'beta-minus-decay';
      case 'B+':
      case 'EC':
      case 'EC/B+':
        return 'electron-capture-beta-plus-decay';
      case 'IT': return 'isomeric-transition';
      case 'SF': return 'spontaneous-fission';
      case 'P': return 'proton-emission';
      case 'N': return 'neutron-emission';
      case '2B-':
      case 'BB-':
        return 'double-beta-minus-decay';
      case '2B+':
      case 'BB+':
        return 'double-beta-plus-decay';
      default:
        return normalizeMode(code);
    }
  }

  function makeCoordKey(z, n) {
    if (!Number.isFinite(z) || !Number.isFinite(n)) return null;
    const zi = Math.round(z);
    const ni = Math.round(n);
    if (zi < 0 || ni < 0) return null;
    return `${zi}-${ni}`;
  }

  function deriveDaughterKey(slug, nuclide) {
    if (!nuclide) return null;
    const { protons: z, neutrons: n } = nuclide;
    switch (slug) {
      case 'alpha-decay': return makeCoordKey(z - 2, n - 2);
      case 'beta-minus-decay': return makeCoordKey(z + 1, n - 1);
      case 'electron-capture-beta-plus-decay': return makeCoordKey(z - 1, n + 1);
      case 'proton-emission': return makeCoordKey(z - 1, n);
      case 'neutron-emission': return makeCoordKey(z, n - 1);
      default: return null;
    }
  }

  function isRenderableDecayMode(slug) {
    return renderableDecaySlugs.has(slug);
  }

  // ========================================
  // DECAY TREE VISUALIZATION - COMPLETE REWRITE
  // ========================================

  function renderDecayTree(nuclide) {
    if (!chart.decayOverlay) return;
    const { container, svg, empty, title } = chart.decayOverlay;
    if (!container || !svg || !empty || !title) return;

    svg.innerHTML = '';
    svg.style.display = 'none';
    empty.style.display = 'block';
    chart.decayOverlay.renderLegend?.(new Set());

    if (!nuclide) {
      empty.textContent = 'Select a nuclide to view its decay tree.';
      return;
    }

    const graph = buildDecayGraph(nuclide);
    if (!graph || graph.nodes.length === 0) {
      empty.textContent = 'No decay data available for this nuclide.';
      return;
    }

    if (graph.nodes.length === 1 && nuclide.category === 'stable') {
      empty.textContent = 'This nuclide is stable (no decay).';
      return;
    }

    if (!graph.edges.length) {
      empty.textContent = 'No decay data available for this nuclide.';
      return;
    }

    const usedModes = new Set();
    graph.edges.forEach(edge => {
      const slug = normalizeMode(edge.mode);
      if (decayModeStyles[slug]) usedModes.add(slug);
    });
    chart.decayOverlay.renderLegend?.(usedModes);

    title.textContent = `${nuclide.label} Decay Chain`;
    chart.decayOverlay.camera.manualSet = false;
    // Make SVG measurable before drawing so label boxes size correctly.
    svg.style.display = 'block';
    svg.style.visibility = 'hidden';
    empty.style.display = 'none';
    drawDecayGraph(graph, svg);
    svg.style.visibility = 'visible';
    svg.style.display = 'block';
    applyFlashClasses();
  }

  function buildDecayGraph(rootNuclide) {
    const rootKey = `${rootNuclide.protons}-${rootNuclide.neutrons}`;
    const maxDepth = 15;
    const maxBranches = 100;
    
    const nodes = new Map();
    const edges = [];
    const syntheticNodes = new Map();
    let branchCount = 0;

    function getNodeData(key) {
      if (syntheticNodes.has(key)) return syntheticNodes.get(key);
      const direct = chart.byCoord.get(key);
      if (direct) {
        return {
          key,
          label: direct.label,
          element: direct.element,
          category: direct.category,
          halfLife: direct.halfLife,
          halfLifeSeconds: direct.halfLifeSeconds,
          decayModes: direct.decayModes,
          decayCategory: direct.decayCategory,
          protons: direct.protons,
          neutrons: direct.neutrons,
          massNumber: direct.massNumber
        };
      }
      const idx = chart.decayIndex.get(key);
      if (idx) {
        const firstBranch = idx.branches?.[0];
        return {
          key,
          label: idx.parentID || key,
          element: idx.parentID ? idx.parentID.replace(/\d+/g, '') : '?',
          category: 'unknown',
          halfLife: formatHalfLifeFromSeconds(firstBranch?.halfLifeSeconds, firstBranch?.halfLifeUnit),
          halfLifeSeconds: firstBranch?.halfLifeSeconds ?? null,
          decayModes: '',
          decayCategory: categorizeDecay('', 'unknown'),
          protons: idx.z,
          neutrons: idx.n,
          massNumber: idx.a
        };
      }
      return null;
    }

    function ensureSyntheticNode(key, data) {
      if (!syntheticNodes.has(key)) {
        syntheticNodes.set(key, { ...data, key, depth: 0, parents: [], children: [] });
      }
      return syntheticNodes.get(key);
    }

    function buildFallbackBranches(nodeData, seenKeys) {
      if (!nodeData?.decayModes) return [];
      const parsed = parseDecayModesString(nodeData.decayModes);
      const out = [];

      parsed.forEach(info => {
        const slug = info.slug;
        if (!slug || slug === 'unknown' || slug === 'isomeric-transition') return;
        if (!isRenderableDecayMode(slug)) return;

        if (slug === 'spontaneous-fission') {
          const total = info.percent;
          if (!Number.isFinite(total) || total < MIN_FISSION_BRANCH_PERCENT) return;
          const splitPercent = Number.isFinite(total) ? total / 2 : null;
          ['a', 'b'].forEach((suffix, idx) => {
            const childKey = `${nodeData.key}-sf-${suffix}`;
            ensureSyntheticNode(childKey, {
              label: `Fission fragment ${idx + 1}`,
              element: 'Fission fragment',
              category: 'unknown',
              halfLife: 'Fission products',
              halfLifeSeconds: null,
              decayModes: '',
              protons: null,
              neutrons: null,
              massNumber: null
            });
            const dedup = `${slug}::${childKey}`;
            if (!seenKeys.has(dedup)) {
              out.push({
                from: nodeData.key,
                to: childKey,
                mode: slug,
                branchPercent: splitPercent,
                qValueKeV: null,
                halfLifeSeconds: nodeData.halfLifeSeconds ?? null,
                halfLifeUnit: null,
                terminal: true
              });
              seenKeys.add(dedup);
            }
          });
          return;
        }

        const toKey = deriveDaughterKey(slug, nodeData);
        if (!toKey) return;
        const dedupKey = `${slug}::${toKey}`;
        if (seenKeys.has(dedupKey)) return;

        if (!chart.byCoord.has(toKey)) {
          const [zStr, nStr] = toKey.split('-');
          const z = Number(zStr);
          const n = Number(nStr);
          ensureSyntheticNode(toKey, {
            label: `Daughter ${toKey}`,
            element: 'Unknown',
            category: 'unknown',
            halfLife: 'Unknown',
            halfLifeSeconds: null,
            decayModes: '',
            protons: Number.isFinite(z) ? z : null,
            neutrons: Number.isFinite(n) ? n : null,
            massNumber: Number.isFinite(z) && Number.isFinite(n) ? z + n : null
          });
        }

        out.push({
          from: nodeData.key,
          to: toKey,
          mode: slug,
          branchPercent: info.percent ?? null,
          qValueKeV: null,
          halfLifeSeconds: nodeData.halfLifeSeconds ?? null,
          halfLifeUnit: null,
          terminal: false
        });
        seenKeys.add(dedupKey);
      });

      return out;
    }

    function collectBranches(key, nodeData) {
      const fromIndex = [];
      const decayData = chart.decayIndex.get(key);
      if (decayData?.branches?.length) {
        decayData.branches.forEach(branch => {
          fromIndex.push({
            from: key,
            to: branch.to,
            mode: normalizeMode(branch.mode),
            branchPercent: branch.branchPercent,
            qValueKeV: branch.qValueKeV,
            halfLifeSeconds: branch.halfLifeSeconds,
            halfLifeUnit: branch.halfLifeUnit,
            terminal: false
          });
        });
      }

      const seen = new Set(fromIndex.map(b => `${b.mode}::${b.to}`));
      const fallback = buildFallbackBranches(nodeData, seen);
      return [...fromIndex, ...fallback];
    }

    function traverse(key, depth, visited) {
      if (depth > maxDepth || branchCount > maxBranches) return;
      if (visited.has(key)) return;
      
      const nodeData = getNodeData(key);
      if (!nodeData) return;
      
      if (!nodes.has(key)) {
        nodes.set(key, { ...nodeData, depth, parents: [], children: [] });
      } else {
        const existing = nodes.get(key);
        existing.depth = Math.min(existing.depth, depth);
      }

      const currentNode = nodes.get(key);
      if (nodeData.category === 'stable') return;
      
      const branches = collectBranches(key, nodeData);
      if (!branches.length) return;
      
      const newVisited = new Set(visited);
      newVisited.add(key);
      
      branches.forEach(branch => {
        if (branchCount >= maxBranches) return;
        branchCount++;
        
        const childKey = branch.to;
        edges.push({
          from: key,
          to: childKey,
          mode: branch.mode,
          branchPercent: branch.branchPercent,
          qValueKeV: branch.qValueKeV,
          halfLifeSeconds: branch.halfLifeSeconds,
          halfLifeUnit: branch.halfLifeUnit
        });
        
        if (!currentNode.children.includes(childKey)) {
          currentNode.children.push(childKey);
        }
        
        const targetData = getNodeData(childKey);
        if (targetData) {
          if (!nodes.has(childKey)) {
            nodes.set(childKey, { ...targetData, depth: depth + 1, parents: [key], children: [] });
          } else {
            const existing = nodes.get(childKey);
            existing.depth = Math.min(existing.depth, depth + 1);
            if (!existing.parents.includes(key)) {
              existing.parents.push(key);
            }
          }
        }
        
        if (!branch.terminal) {
          traverse(childKey, depth + 1, newVisited);
        }
      });
    }

    traverse(rootKey, 0, new Set());

    return {
      nodes: Array.from(nodes.values()),
      edges,
      nodeMap: nodes
    };
  }

  function drawDecayGraph(graph, svg) {
    const ns = 'http://www.w3.org/2000/svg';
    const nodeWidth = 140;
    const nodeHeight = 70;
    const layerGap = 140;
    const nodeGap = 20;
    
    // Layer assignment - group nodes by depth
    const layers = new Map();
    graph.nodes.forEach(node => {
      if (!layers.has(node.depth)) {
        layers.set(node.depth, []);
      }
      layers.get(node.depth).push(node);
    });
    
    // Sort layers
    const sortedLayers = Array.from(layers.entries()).sort((a, b) => a[0] - b[0]);
    
    // Barycenter heuristic for reducing edge crossings
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < sortedLayers.length; i++) {
        const layer = sortedLayers[i][1];
        layer.forEach(node => {
          if (node.parents.length > 0) {
            const parentPositions = node.parents
              .map(pKey => graph.nodeMap.get(pKey))
              .filter(p => p && p.layerPos !== undefined)
              .map(p => p.layerPos);
            if (parentPositions.length > 0) {
              node.barycenter = parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length;
            }
          }
        });
        layer.sort((a, b) => {
          if (a.barycenter !== undefined && b.barycenter !== undefined) {
            return a.barycenter - b.barycenter;
          }
          return 0;
        });
      }
      
      // Reverse pass
      for (let i = sortedLayers.length - 2; i >= 0; i--) {
        const layer = sortedLayers[i][1];
        layer.forEach(node => {
          if (node.children.length > 0) {
            const childPositions = node.children
              .map(cKey => graph.nodeMap.get(cKey))
              .filter(c => c && c.layerPos !== undefined)
              .map(c => c.layerPos);
            if (childPositions.length > 0) {
              node.barycenter = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
            }
          }
        });
        layer.sort((a, b) => {
          if (a.barycenter !== undefined && b.barycenter !== undefined) {
            return a.barycenter - b.barycenter;
          }
          return 0;
        });
      }
    }
    
    // Assign positions within layers
    sortedLayers.forEach(([depth, layer]) => {
      layer.forEach((node, idx) => {
        node.layerPos = idx;
        node.y = depth * layerGap + 50;
        node.x = idx * (nodeWidth + nodeGap) + nodeWidth / 2 + 50;
      });
    });
    
    // Center each layer horizontally
    sortedLayers.forEach(([depth, layer]) => {
      if (layer.length === 0) return;
      const layerWidth = layer.length * (nodeWidth + nodeGap) - nodeGap;
      const offset = -layerWidth / 2;
      layer.forEach(node => {
        node.x += offset;
      });
    });
    
    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graph.nodes.forEach(node => {
      minX = Math.min(minX, node.x - nodeWidth / 2);
      maxX = Math.max(maxX, node.x + nodeWidth / 2);
      minY = Math.min(minY, node.y - nodeHeight / 2);
      maxY = Math.max(maxY, node.y + nodeHeight / 2);
    });
    
    const padding = 40;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const viewW = svg.clientWidth || 640;
    const viewH = svg.clientHeight || 460;
    const fit = Math.min(viewW / contentW, viewH / contentH, 1);
    
    svg.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`);
    svg.innerHTML = '';
    
    const mainGroup = document.createElementNS(ns, 'g');
    svg.appendChild(mainGroup);
    
    // Setup camera
    if (chart.decayOverlay?.camera) {
      const cam = chart.decayOverlay.camera;
      cam.baseFit = fit;
      cam.originX = minX - padding;
      cam.originY = minY - padding;
      if (!cam.manualSet) {
        cam.zoom = 1;
        cam.panX = (viewW - contentW * fit) / 2;
        cam.panY = (viewH - contentH * fit) / 2;
      }
      chart.decayOverlay.contentGroup = mainGroup;
      chart.decayOverlay.updateOverlayTransform();
    }
    
    const targetGroup = chart.decayOverlay?.contentGroup || mainGroup;
    
    // Draw edges with smooth curves
    const edgeGroup = document.createElementNS(ns, 'g');
    edgeGroup.setAttribute('class', 'decay-edges');
    targetGroup.appendChild(edgeGroup);

    // Label overlay drawn last so it always sits above every edge/node
    const labelGroup = document.createElementNS(ns, 'g');
    labelGroup.setAttribute('class', 'decay-branch-labels');
    labelGroup.setAttribute('pointer-events', 'none');
    targetGroup.appendChild(labelGroup);
    
    graph.edges.forEach(edge => {
      const fromNode = graph.nodeMap.get(edge.from);
      const toNode = graph.nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;
      
      const x1 = fromNode.x;
      const y1 = fromNode.y + nodeHeight / 2;
      const x2 = toNode.x;
      const y2 = toNode.y - nodeHeight / 2;
      
      // Control points for smooth curve
      const dx = x2 - x1;
      const dy = y2 - y1;
      const offset = Math.min(Math.abs(dy) * 0.5, 60);
      
      const branchGroup = document.createElementNS(ns, 'g');
      branchGroup.setAttribute('class', 'branch-group');
      edgeGroup.appendChild(branchGroup);
      branchGroup.addEventListener('click', () => triggerFlash('decay-mode', modeSlug, 'decay'));

      const labelWrap = document.createElementNS(ns, 'g');
      labelWrap.setAttribute('class', 'branch-label-group');
      labelGroup.appendChild(labelWrap);
      branchGroup.addEventListener('mouseenter', () => labelWrap.classList.add('active'));
      branchGroup.addEventListener('mouseleave', () => labelWrap.classList.remove('active'));
      
      const curvePath = `M ${x1} ${y1} C ${x1} ${y1 + offset}, ${x2} ${y2 - offset}, ${x2} ${y2}`;
      const modeSlug = normalizeMode(edge.mode);
      const modeClass = `mode-${modeSlug}`;
      
      // Invisible wide hit area for easy hover
      const hitPath = document.createElementNS(ns, 'path');
      hitPath.setAttribute('d', curvePath);
      hitPath.setAttribute('class', 'decay-branch-hit');
      branchGroup.appendChild(hitPath);
      
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', curvePath);
      path.setAttribute('fill', 'none');
      path.setAttribute('class', `decay-branch ${modeClass}`);
      path.style.stroke = getModeColor(edge.mode);
      path.dataset.mode = modeSlug;
      path.dataset.from = edge.from;
      path.dataset.to = edge.to;
      path.dataset.fromCategory = fromNode.category || '';
      path.dataset.toCategory = toNode.category || '';
      branchGroup.appendChild(path);
      
      // Two independent boxed labels: mode (above) and energy (below)
      const midX = x1 + dx / 2;
      const midY = y1 + dy / 2;

      function makeBoxedLabel(text, offsetY) {
        if (!text) return;
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('transform', `translate(${midX}, ${midY + offsetY})`);
        labelWrap.appendChild(g);

        const t = document.createElementNS(ns, 'text');
        t.setAttribute('class', 'decay-branch-label');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'middle');
        t.textContent = text;
        t.setAttribute('x', '0');
        t.setAttribute('y', '0');
        g.appendChild(t);

        // After text is in the DOM, measure and build box
        const bb = t.getBBox();
        const padX = 3;
        const padY = 3;
        const rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', bb.x - padX);
        rect.setAttribute('y', bb.y - padY);
        rect.setAttribute('width', bb.width + padX * 2);
        rect.setAttribute('height', bb.height + padY * 2);
        rect.setAttribute('rx', 6);
        rect.setAttribute('ry', 6);
        rect.setAttribute('class', 'decay-branch-label-bg');
        g.insertBefore(rect, t);
      }

      makeBoxedLabel(getModeLabel(edge.mode, edge.branchPercent), -13);
      makeBoxedLabel(formatQValue(edge.qValueKeV), 13);
    });
    
    // Draw nodes
    const nodeGroup = document.createElementNS(ns, 'g');
    nodeGroup.setAttribute('class', 'decay-nodes');
    targetGroup.appendChild(nodeGroup);
    
      graph.nodes.forEach(node => {
      const group = document.createElementNS(ns, 'g');
      group.classList.add('decay-node-group');
      group.dataset.key = node.key;
      group.dataset.category = node.category || 'unknown';
      group.dataset.decayCategory = node.decayCategory || 'unknown';
      
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', node.x - nodeWidth / 2);
      rect.setAttribute('y', node.y - nodeHeight / 2);
      rect.setAttribute('width', nodeWidth);
      rect.setAttribute('height', nodeHeight);
      rect.setAttribute('rx', 8);
      rect.setAttribute('class', `decay-node ${node.category}`);
      rect.setAttribute('fill', getNodeColor(node.category));
      rect.setAttribute('stroke', node.category === 'stable' ? '#54d68c' : '#2a2a2a');
      rect.setAttribute('stroke-width', node.category === 'stable' ? '2.5' : '1.5');
      group.appendChild(rect);
      
      const title = document.createElementNS(ns, 'text');
      title.setAttribute('x', node.x);
      title.setAttribute('y', node.y - 8);
      title.setAttribute('class', 'decay-node-title');
      title.setAttribute('text-anchor', 'middle');
      title.textContent = node.label;
      group.appendChild(title);
      
      const detail = document.createElementNS(ns, 'text');
      detail.setAttribute('x', node.x);
      detail.setAttribute('y', node.y + 12);
      detail.setAttribute('class', 'decay-node-meta');
      detail.setAttribute('text-anchor', 'middle');
      detail.textContent = node.halfLife || 'Unknown';
      group.appendChild(detail);
      
      group.addEventListener('click', () => {
        triggerFlash('category', node.category || 'unknown', 'decay');
        selectNuclideByKey(node.key);
      });
      
      nodeGroup.appendChild(group);
    });

    // Move label layer to the very end for guaranteed top stacking
    targetGroup.appendChild(labelGroup);
  }

  function selectNuclideByKey(key) {
    const nuclide = chart.byCoord.get(key);
    if (!nuclide) return;
    setSelection(nuclide);
    renderChart();
    showDecayOverlay(nuclide);
  }

  function formatHalfLifeFromSeconds(seconds, unit) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) return unit ? `${unit}` : 'Unknown';
    const scales = [
      { label: 'y', value: 31557600 },
      { label: 'd', value: 86400 },
      { label: 'h', value: 3600 },
      { label: 'min', value: 60 },
      { label: 's', value: 1 },
      { label: 'ms', value: 1e-3 },
      { label: 'µs', value: 1e-6 }
    ];
    for (const scale of scales) {
      if (value >= scale.value || scale.label === 'µs') {
        const val = value / scale.value;
        const precision = val >= 100 ? 0 : val >= 10 ? 1 : 2;
        return `${val.toFixed(precision)} ${scale.label}`;
      }
    }
    return `${value.toFixed(2)} s`;
  }

  function formatBranchPercent(percent) {
    const value = Number(percent);
    if (!Number.isFinite(value)) return '';
    if (value >= 10) return `${value.toFixed(0)}%`;
    if (value >= 1) return `${value.toFixed(1)}%`;
    return `${value.toFixed(2)}%`;
  }

  function formatQValue(qValueKeV) {
    const value = Number(qValueKeV);
    if (!Number.isFinite(value)) return '';
    const mev = value / 1000;
    const precision = Math.abs(mev) >= 10 ? 1 : 2;
    return `Q=${mev.toFixed(precision)} MeV`;
  }

  function getModeLabel(mode, percent) {
    const slug = normalizeMode(mode);
    const base = decayModeStyles[slug]?.label || mode || '';
    const pct = formatBranchPercent(percent);
    return pct ? `${base} (${pct})` : base;
  }

  function getModeColor(mode) {
    const slug = normalizeMode(mode);
    return decayModeStyles[slug]?.color || '#888';
  }

  function getNodeColor(category) {
    return colorMaps.halflife.colors[category] || '#1c1c1c';
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean;
    const bigint = parseInt(full, 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { r = c; g = x; b = 0; }
    else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function colorStringToRgb(color) {
    if (!color) return { r: 0, g: 0, b: 0 };
    const c = color.trim().toLowerCase();
    if (c.startsWith('#')) return hexToRgb(c);
    if (c.startsWith('rgb')) {
      const nums = c.replace(/[^\d.,]/g, '').split(',').map(Number);
      return { r: nums[0] || 0, g: nums[1] || 0, b: nums[2] || 0 };
    }
    if (c.startsWith('hsl')) {
      const match = c.match(/hsl\s*\(\s*([\d.]+)[^,]*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
      if (match) {
        const h = parseFloat(match[1]) || 0;
        const s = (parseFloat(match[2]) || 0) / 100;
        const l = (parseFloat(match[3]) || 0) / 100;
        return hslToRgb(h, s, l);
      }
    }
    return { r: 0, g: 0, b: 0 };
  }

  function blendColors(from, to, t) {
    const a = colorStringToRgb(from);
    const b = colorStringToRgb(to);
    const lerp = (x, y) => Math.round(x + (y - x) * t);
    return `rgb(${lerp(a.r, b.r)}, ${lerp(a.g, b.g)}, ${lerp(a.b, b.b)})`;
  }

  function easeInPow(t, p = 2) {
    return Math.pow(Math.max(0, Math.min(1, t)), p);
  }

  function easeOutPow(t, p = 2) {
    const clamped = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - clamped, p);
  }

  function createDataItem(label, value, full = false) {
    const item = document.createElement('div');
    item.className = full ? 'data-item data-full' : 'data-item';
    
    const labelEl = document.createElement('span');
    labelEl.className = 'data-label';
    labelEl.textContent = label;
    
    const valueEl = document.createElement('span');
    valueEl.className = 'data-value';
    valueEl.textContent = value || '-';
    
    item.appendChild(labelEl);
    item.appendChild(valueEl);
    return item;
  }

  function openModal() {
    const modal = buildModal();
    if (!modal) return;
    if (!dataLoadStarted) {
      dataLoadStarted = true;
      loadData();
    }
    // Remove any closing animation class first
    modal.classList.remove('closing');
    modal.style.display = 'flex';
    updateLegend();
    
    // Only render if data is loaded (chart.bounds exists)
    // If data isn't loaded yet, it will render automatically when loadData() completes
    if (chart.layout && chart.bounds && chart.nuclides) {
      resizeChart({ resetView: chart.needsFit });
      chart.needsFit = false;
    }
    
    const animationWrapper = modal.querySelector('.nuclide-animation-wrapper');
    
    // Re-render after animation completes to ensure perfect dimensions
    // (though it should already be correct due to offsetWidth/offsetHeight)
    const onAnimationEnd = () => {
      // Only re-render if data is loaded
      if (chart.bounds && chart.nuclides) {
        resizeChart({ resetView: false });
      }
      if (animationWrapper) {
        animationWrapper.removeEventListener('animationend', onAnimationEnd);
      }
    };
    
    if (animationWrapper) {
      animationWrapper.addEventListener('animationend', onAnimationEnd, { once: true });
    }
    
    requestAnimationFrame(() => {
      modal.classList.add('visible');
      document.body.classList.add('nuclide-modal-open');
    });
  }

  function closeModal() {
    const modal = document.getElementById('nuclide-modal');
    if (!modal || !modal.classList.contains('visible')) return;
    modal.classList.add('closing');
    document.body.classList.remove('nuclide-modal-open');
    setTimeout(() => {
      modal.classList.remove('visible');
      modal.classList.remove('closing');
      modal.style.display = 'none';
    }, 300); // Match animation duration (0.3s)
  }

  async function loadData() {
    try {
      const [nuclideRes, decayRes] = await Promise.all([
        fetch('Nuclide%20Data/nubase_4.mas20.txt'),
        fetch('Nuclide%20Data/decay-index.json').catch(() => null)
      ]);

      if (!nuclideRes?.ok) throw new Error('Data load failed');
      const text = await nuclideRes.text();
      const parsed = parseNuclideData(text);
      if (!parsed.nuclides.length) return;
      
      chart.nuclides = parsed.nuclides;
      chart.byCoord = parsed.byCoord;
      chart.bounds = parsed.bounds;
      chart.spans = parsed.spans;
      chart.needsFit = true;

      if (decayRes && decayRes.ok) {
        const decayJson = await decayRes.json();
        if (decayJson && decayJson.parents) {
          chart.decayIndex = new Map(Object.entries(decayJson.parents));
        }
      }

      applyFilters();

      const defaultSelection = chart.nuclides.find(n => n.category === 'stable') || chart.nuclides[0];
      if (defaultSelection) setSelection(defaultSelection);

      // Always try to render chart when data loads
      // resizeChart() will check for chart.container and chart.canvas internally
      // This ensures chart renders if modal is already open when data loads
      resizeChart({ resetView: true });
    } catch (e) {
      console.error('Failed to load nuclide data:', e);
    }
  }

  function parseNuclideData(raw) {
    const lines = raw.split(/\r?\n/);
    const out = [];
    const byCoord = new Map();

    for (const line of lines) {
      if (!line || line.startsWith('#') || line.length < 90) continue;
      if (line[7] && line[7] !== '0') continue;
      
      const massNumber = parseInt(line.slice(0, 3), 10);
      const protons = parseInt(line.slice(4, 7).trim(), 10);
      if (Number.isNaN(massNumber) || Number.isNaN(protons)) continue;
      
      const rawElement = line.slice(11, 16).trim();
      const element = rawElement.replace(/^\d+/, '') || rawElement || '?';
      const rawHalfLife = line.slice(69, 78).trim();
      const halfLifeUnit = line.slice(78, 80).trim();
      const spinParity = line.slice(88, 102).trim();
      const discoveryYear = line.slice(114, 118).trim();
      const decayModes = line.slice(119).trim() || 'Decay data unavailable';
      const neutrons = massNumber - protons;

      const { label, seconds, category } = prepareHalfLife(rawHalfLife, halfLifeUnit);
      const decayCategory = categorizeDecay(decayModes, category);
      const key = `${protons}-${neutrons}`;
      if (byCoord.has(key)) continue;

      const nuclide = {
        label: `${element}-${massNumber}`,
        element: element,
        protons,
        neutrons,
        massNumber,
        halfLife: label,
        halfLifeSeconds: seconds,
        spinParity: spinParity || '-',
        decayModes,
        discoveryYear: discoveryYear || '-',
        category,
        decayCategory
      };
      out.push(nuclide);
      byCoord.set(key, nuclide);
    }

    out.sort((a, b) => (a.neutrons - b.neutrons) || (a.protons - b.protons));

    const bounds = out.reduce((acc, n) => ({
      minN: Math.min(acc.minN, n.neutrons),
      maxN: Math.max(acc.maxN, n.neutrons),
      minZ: Math.min(acc.minZ, n.protons),
      maxZ: Math.max(acc.maxZ, n.protons)
    }), { minN: Infinity, maxN: -Infinity, minZ: Infinity, maxZ: -Infinity });

    const spans = {
      n: bounds.maxN - bounds.minN + 1,
      z: bounds.maxZ - bounds.minZ + 1
    };

    return { nuclides: out, byCoord, bounds, spans };
  }

  function prepareHalfLife(rawValue, unit) {
    const normalized = rawValue ? rawValue.trim() : '';
    if (/stbl/i.test(normalized)) return { label: 'Stable', seconds: Infinity, category: 'stable' };
    if (/p-unst/i.test(normalized)) return { label: 'Particle unstable', seconds: null, category: 'unstable' };

    const cleaned = normalized.replace(/[#\s]+/g, ' ').trim();
    const label = cleaned ? `${cleaned} ${unit || ''}`.trim() : 'Unknown';
    const seconds = toSeconds(cleaned, unit);

    if (seconds === null) return { label, seconds: null, category: 'unknown' };
    if (seconds >= 31557600) return { label, seconds, category: 'long' };
    if (seconds >= 86400) return { label, seconds, category: 'medium' };
    if (seconds >= 1) return { label, seconds, category: 'short' };
    return { label, seconds, category: 'instant' };
  }

  function toSeconds(valueStr, unit) {
    if (!valueStr) return null;
    const numeric = parseFloat(valueStr.replace(/[^\d.+-]/g, ''));
    if (!Number.isFinite(numeric)) return null;
    const u = (unit || '').toLowerCase();
    const map = {
      ys: 1e-24, zs: 1e-21, as: 1e-18, fs: 1e-15, ps: 1e-12, ns: 1e-9,
      us: 1e-6, ms: 1e-3, cs: 1e-2, ds: 1e-1, s: 1, mn: 60, h: 3600,
      d: 86400, w: 604800, mo: 2629800, y: 31557600, ky: 31557600 * 1000,
      my: 31557600 * 1e6, gy: 31557600 * 1e9
    };
    return map[u] ? numeric * map[u] : null;
  }

    function categorizeDecay(modes, halfLifeCategory) {
    if (halfLifeCategory === 'stable') return 'stable';
    if (halfLifeCategory === 'unstable') return 'unstable';
    if (!modes || modes === 'Decay data unavailable') return 'unknown';

    const parsed = parseDecayModesString(modes);
    if (!parsed.length) return 'unknown';
    if (parsed.length > 1) return 'mixed';

    const primary = parsed.reduce((top, item) => {
      if (!top) return item;
      if (!Number.isFinite(item.percent)) return top;
      if (!Number.isFinite(top.percent)) return item;
      return item.percent > top.percent ? item : top;
    }, null) || parsed[0];

    return mapModeToCategory(primary.slug);
  }

  function mapModeToCategory(slug) {
    switch (slug) {
      case 'beta-minus-decay': return 'beta-minus';
      case 'electron-capture-beta-plus-decay': return 'beta-plus';
      case 'alpha-decay': return 'alpha';
      case 'proton-emission': return 'proton';
      case 'neutron-emission': return 'neutron';
      case 'isomeric-transition': return 'it';
      case 'spontaneous-fission': return 'sf';
      default: return 'mixed';
    }
  }

  function applyFilters() {
    chart.filteredNuclides = chart.nuclides.filter(n => {
      if (!state.filters[n.category]) return false;
      if (state.searchQuery) {
        const query = state.searchQuery;
        const label = n.label.toLowerCase();
        const element = n.element.toLowerCase();
        return label.includes(query) || element.includes(query) || 
               String(n.protons).includes(query) || String(n.massNumber).includes(query);
      }
      return true;
    });
    
    if (chart.layout) renderChart();
  }

  function getNuclideColor(nuclide) {
    const map = colorMaps[state.colorMap];
    let baseColor;
    if (map.getColor) {
      if (state.colorMap === 'neutrons') baseColor = map.getColor(nuclide.neutrons);
      else if (state.colorMap === 'protons') baseColor = map.getColor(nuclide.protons);
      else if (state.colorMap === 'mass') baseColor = map.getColor(nuclide.massNumber);
    }
    if (!baseColor) {
      if (state.colorMap === 'decay') {
        baseColor = map.colors[nuclide.decayCategory] || map.colors.unknown;
      } else {
        baseColor = map.colors[nuclide.category] || map.colors.unknown;
      }
    }

    if (flashState.type && scopeIncludes('chart')) {
      const now = performance.now ? performance.now() : Date.now();
      const t = Math.min(1, Math.max(0, (now - flashState.start) / FLASH_DURATION_MS));
      const split = Math.min(0.95, Math.max(0.05, FLASH_SPLIT));
      const eased = t < split
        ? easeOutPow(t / split, FLASH_EASE_OUT_POWER)
        : 1 - easeInPow((t - split) / (1 - split), FLASH_EASE_IN_POWER);
      const target = nuclideMatchesFlash(nuclide) ? '#ff8000' : '#1a1a1a';
      return blendColors(baseColor, target, eased);
    }

    return baseColor;
  }

  function resizeChart(opts = {}) {
    if (!chart.canvas || !chart.container) return;
    // Use offsetWidth/offsetHeight instead of getBoundingClientRect()
    // because offsetWidth/offsetHeight are NOT affected by CSS transforms (scale)
    // This ensures correct dimensions even during animation
    const width = Math.max(320, Math.floor(chart.container.offsetWidth));
    const height = Math.max(320, Math.floor(chart.container.offsetHeight));
    chart.dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    chart.canvas.width = width * chart.dpr;
    chart.canvas.height = height * chart.dpr;
    chart.canvas.style.width = `${width}px`;
    chart.canvas.style.height = `${height}px`;
    chart.ctx.setTransform(chart.dpr, 0, 0, chart.dpr, 0, 0);
    chart.layout = computeLayout(width, height, chart.spans);

    if (chart.bounds) {
      setBaseScale();
      if (opts.resetView) {
        chart.zoom = 1;
        chart.panX = 0;
        chart.panY = 0;
      }
      clampPan();
      renderChart();
    }
  }

  function computeLayout(width, height, spans) {
    const padding = { left: 70, right: 14, top: 12, bottom: 58 };
    const availableWidth = Math.max(60, width - padding.left - padding.right);
    const availableHeight = Math.max(60, height - padding.top - padding.bottom);
    let plotWidth = availableWidth;
    let plotHeight = availableHeight;

    if (spans && spans.n > 0 && spans.z > 0) {
      const cell = Math.min(availableWidth / spans.n, availableHeight / spans.z);
      plotWidth = Math.max(40, Math.min(availableWidth, cell * spans.n));
      plotHeight = Math.max(40, Math.min(availableHeight, cell * spans.z));
    }

    return {
      width, height, padding,
      plot: { x: padding.left, y: padding.top, width: plotWidth, height: plotHeight }
    };
  }

  function setBaseScale() {
    if (!chart.layout || !chart.spans) return;
    const usableWidth = Math.max(40, chart.layout.plot.width);
    const usableHeight = Math.max(40, chart.layout.plot.height);
    chart.baseCell = Math.max(2, Math.min(usableWidth / chart.spans.n, usableHeight / chart.spans.z));
    chart.offsetX = 0;
    chart.offsetY = 0;
  }

  function renderChart() {
    if (!chart.ctx || !chart.layout || !chart.bounds) return;
    const ctx = chart.ctx;
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, chart.layout.width, chart.layout.height);
    drawGrid(ctx);
    drawNuclides(ctx);
    drawAxes(ctx);
    updateCursor();
  }

  function drawGrid(ctx) {
    const cell = getCellSize();
    const minPixelSpacing = 18; // target spacing in pixels between grid lines
    const step = Math.max(1, Math.ceil(minPixelSpacing / cell));
    const { plot } = chart.layout;
    const dataLeft = plot.x + chart.offsetX + chart.panX;
    const dataBottom = plot.y + plot.height - (chart.offsetY + chart.panY);
    const visible = getVisibleRange();

    const nStart = Math.max(chart.bounds.minN, Math.floor(visible.minN / step) * step);
    const nEnd = Math.min(chart.bounds.maxN, Math.ceil(visible.maxN / step) * step);
    const zStart = Math.max(chart.bounds.minZ, Math.floor(visible.minZ / step) * step);
    const zEnd = Math.min(chart.bounds.maxZ, Math.ceil(visible.maxZ / step) * step);

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    for (let n = nStart; n <= nEnd + 1; n += step) {
      const x = dataLeft + (n - chart.bounds.minN) * cell;
      if (x < plot.x - 20 || x > plot.x + plot.width + 20) continue;
      ctx.beginPath();
      ctx.moveTo(x, Math.max(plot.y, dataBottom - chart.spans.z * cell));
      ctx.lineTo(x, Math.min(plot.y + plot.height, dataBottom));
      ctx.stroke();
    }

    for (let z = zStart; z <= zEnd + 1; z += step) {
      const y = dataBottom - (z - chart.bounds.minZ) * cell;
      if (y < plot.y - 20 || y > plot.y + plot.height + 20) continue;
      ctx.beginPath();
      ctx.moveTo(Math.max(plot.x, dataLeft), y);
      ctx.lineTo(Math.min(plot.x + plot.width, dataLeft + chart.spans.n * cell), y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawNuclides(ctx) {
    const cell = getCellSize();
    const { plot } = chart.layout;
    const left = plot.x;
    const right = plot.x + plot.width;
    const top = plot.y;
    const bottom = plot.y + plot.height;
    const dataLeft = left + chart.offsetX + chart.panX;
    const dataBottom = bottom - (chart.offsetY + chart.panY);
    const showLabels = cell >= chart.labelThreshold;

    ctx.font = `${Math.floor(cell * 0.3)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const nuclide of chart.filteredNuclides) {
      const x = dataLeft + (nuclide.neutrons - chart.bounds.minN) * cell;
      const y = dataBottom - cell - (nuclide.protons - chart.bounds.minZ) * cell;
      if (x > right + cell || x + cell < left || y > bottom + cell || y + cell < top) continue;
      
      ctx.fillStyle = getNuclideColor(nuclide);
      ctx.fillRect(x, y, cell, cell);

      if (showLabels && cell >= 12) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const fontSize = Math.floor(cell * 0.25);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(nuclide.element, x + cell / 2, y + cell * 0.35);
        ctx.font = `${Math.floor(fontSize * 0.8)}px sans-serif`;
        ctx.fillText(String(nuclide.massNumber), x + cell / 2, y + cell * 0.65);
      }

      if (chart.selectedKey === `${nuclide.protons}-${nuclide.neutrons}`) {
        const outline = Math.max(2, cell * 0.1);
        const inset = outline / 2;
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = outline;
        ctx.strokeRect(x + inset, y + inset, cell - outline, cell - outline);
        ctx.restore();
      }
    }
  }

  function drawAxes(ctx) {
    const { plot } = chart.layout;
    const axisX = plot.x;
    const axisY = plot.y + plot.height;
    const cell = getCellSize();
    const dataLeft = plot.x + chart.offsetX + chart.panX;
    const dataBottom = plot.y + plot.height - (chart.offsetY + chart.panY);
    const visible = getVisibleRange();

    ctx.save();
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, plot.x, chart.layout.height);
    ctx.fillRect(plot.x, axisY, chart.layout.width - plot.x, chart.layout.height - axisY);
    ctx.fillRect(plot.x + plot.width, 0, chart.layout.width - (plot.x + plot.width), chart.layout.height);
    ctx.fillRect(0, 0, chart.layout.width, plot.y);

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(axisX, plot.y);
    ctx.lineTo(axisX, axisY);
    ctx.lineTo(plot.x + plot.width, axisY);
    ctx.stroke();

    ctx.fillStyle = '#ccc';
    ctx.font = '11px sans-serif';

    const nTicks = buildTicks(visible.minN, visible.maxN, 8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const n of nTicks) {
      const x = dataLeft + (n - chart.bounds.minN + 0.5) * cell;
      if (x < plot.x || x > plot.x + plot.width) continue;
      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, axisY + 5);
      ctx.stroke();
      ctx.fillText(String(n), x, axisY + 8);
    }

    const zTicks = buildTicks(visible.minZ, visible.maxZ, 7);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const z of zTicks) {
      const y = dataBottom - (z - chart.bounds.minZ + 0.5) * cell;
      if (y < plot.y || y > plot.y + plot.height) continue;
      ctx.strokeStyle = '#666';
      ctx.beginPath();
      ctx.moveTo(axisX - 5, y);
      ctx.lineTo(axisX, y);
      ctx.stroke();
      ctx.fillText(String(z), axisX - 8, y);
    }

    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Neutrons (N)', plot.x + plot.width / 2, axisY + 28);
    ctx.translate(axisX - 45, plot.y + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Protons (Z)', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function buildTicks(min, max, maxCount) {
    const span = Math.max(1, max - min);
    const rawStep = span / Math.max(1, maxCount);
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10];
    let step = candidates.find(c => c * power >= rawStep) * power || rawStep;
    const start = Math.ceil(min / step) * step;
    const ticks = [];
    for (let v = start; v <= max; v += step) ticks.push(Math.round(v));
    return ticks;
  }

  function getVisibleRange() {
    if (!chart.layout || !chart.bounds) return { minN: 0, maxN: 0, minZ: 0, maxZ: 0 };
    const bottomLeft = screenToData(chart.layout.plot.x, chart.layout.plot.y + chart.layout.plot.height);
    const topRight = screenToData(chart.layout.plot.x + chart.layout.plot.width, chart.layout.plot.y);
    return {
      minN: Math.max(chart.bounds.minN, Math.min(bottomLeft.n, topRight.n)),
      maxN: Math.min(chart.bounds.maxN, Math.max(bottomLeft.n, topRight.n)),
      minZ: Math.max(chart.bounds.minZ, Math.min(bottomLeft.z, topRight.z)),
      maxZ: Math.min(chart.bounds.maxZ, Math.max(bottomLeft.z, topRight.z))
    };
  }

  function getCellSize() {
    return chart.baseCell * chart.zoom;
  }

  function clampPan() {
    if (!chart.layout || !chart.spans) return;
    const cell = getCellSize();
    const { plot } = chart.layout;
    const dataWidth = chart.spans.n * cell;
    const dataHeight = chart.spans.z * cell;
    const maxPanX = 0;
    const minPanX = Math.min(0, plot.width - chart.offsetX - dataWidth);
    chart.panX = Math.max(minPanX, Math.min(maxPanX, chart.panX));
    const maxPanY = 0;
    const minPanY = Math.min(0, plot.height - chart.offsetY - dataHeight);
    chart.panY = Math.max(minPanY, Math.min(maxPanY, chart.panY));
  }

  function handleWheel(evt) {
    if (!chart.bounds) return;
    evt.preventDefault();
    const factor = evt.deltaY > 0 ? 0.8 : 1.2;
    const rect = chart.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    applyZoom(factor, x, y);
  }

  function applyZoom(factor, focusX, focusY) {
    if (!chart.layout) return;
    const newZoom = clampZoom(chart.zoom * factor);
    if (newZoom === chart.zoom) return;
    const focusData = screenToData(focusX, focusY);
    chart.zoom = newZoom;
    if (focusData) anchorDataToScreen(focusData, focusX, focusY);
    clampPan();
    renderChart();
  }

  function clampZoom(val) {
    return Math.min(32, Math.max(1, val));
  }

  function handlePointerDown(evt) {
    if (!chart.bounds) return;
    chart.isPanning = true;
    chart.dragDistance = 0;
    chart.lastPointer = { x: evt.clientX, y: evt.clientY };
    chart.canvas.setPointerCapture(evt.pointerId);
    chart.canvas.classList.add('panning');
  }

  function handlePointerMove(evt) {
    if (!chart.isPanning || !chart.bounds) return;
    const dx = evt.clientX - chart.lastPointer.x;
    const dy = evt.clientY - chart.lastPointer.y;
    chart.lastPointer = { x: evt.clientX, y: evt.clientY };
    chart.dragDistance += Math.abs(dx) + Math.abs(dy);
    if (isPannable()) {
      chart.panX += dx;
      chart.panY -= dy;
      clampPan();
      renderChart();
    }
  }

  function handlePointerUp(evt, opts = {}) {
    if (!chart.bounds) return;
    if (chart.isPanning) {
      chart.canvas.releasePointerCapture(evt.pointerId);
      chart.canvas.classList.remove('panning');
    }
    const moved = chart.dragDistance;
    chart.isPanning = false;
    chart.dragDistance = 0;
    if (opts.skipSelect) return;
    if (moved < 4) {
      const rect = chart.canvas.getBoundingClientRect();
      const x = evt.clientX - rect.left;
      const y = evt.clientY - rect.top;
      handleSelection(x, y);
    }
  }

  function isPannable() {
    if (!chart.layout || !chart.spans) return false;
    const cell = getCellSize();
    return chart.spans.n * cell > chart.layout.plot.width || chart.spans.z * cell > chart.layout.plot.height;
  }

  function handleSelection(x, y) {
    if (!chart.layout || !chart.bounds) return;
    const cell = getCellSize();
    if (cell <= 0) return;
    const dataLeft = chart.layout.plot.x + chart.offsetX + chart.panX;
    const dataBottom = chart.layout.plot.y + chart.layout.plot.height - (chart.offsetY + chart.panY);

    const nIdx = chart.bounds.minN + Math.round((x - dataLeft - cell / 2) / cell);
    const zIdx = chart.bounds.minZ + Math.round((dataBottom - y - cell / 2) / cell);

    if (nIdx < chart.bounds.minN || nIdx > chart.bounds.maxN) return;
    if (zIdx < chart.bounds.minZ || zIdx > chart.bounds.maxZ) return;
    const picked = chart.byCoord.get(`${zIdx}-${nIdx}`);
    if (picked) {
      setSelection(picked);
      renderChart();
      showDecayOverlay(picked);
    }
  }

  function setSelection(nuclide) {
    chart.selectedKey = `${nuclide.protons}-${nuclide.neutrons}`;
    state.isotope = nuclide;
    updateInfoPanel(nuclide);
  }

  function screenToData(x, y) {
    if (!chart.layout || !chart.bounds) return null;
    const cell = getCellSize();
    if (cell <= 0) return null;
    const dataLeft = chart.layout.plot.x + chart.offsetX + chart.panX;
    const dataBottom = chart.layout.plot.y + chart.layout.plot.height - (chart.offsetY + chart.panY);
    const n = chart.bounds.minN + (x - dataLeft) / cell;
    const z = chart.bounds.minZ + (dataBottom - cell - y) / cell;
    return { n, z };
  }

  function anchorDataToScreen(dataCoord, screenX, screenY) {
    const cell = getCellSize();
    const baseX = chart.layout.plot.x + chart.offsetX;
    const baseY = chart.layout.plot.y + chart.layout.plot.height;
    chart.panX = screenX - baseX - (dataCoord.n - chart.bounds.minN) * cell;
    chart.panY = baseY - screenY - cell - (dataCoord.z - chart.bounds.minZ) * cell - chart.offsetY;
  }

  function updateCursor() {
    if (!chart.canvas) return;
    chart.canvas.style.cursor = chart.isPanning ? 'grabbing' : 'crosshair';
  }

  function buildDecayOverlay(modalRoot) {
    const layer = document.createElement('div');
    layer.className = 'decay-overlay-layer';
    layer.style.display = 'none';

    const overlay = document.createElement('div');
    overlay.className = 'decay-overlay';

    const header = document.createElement('div');
    header.className = 'decay-overlay-header';
    const title = document.createElement('div');
    title.className = 'decay-overlay-title';
    title.textContent = 'Decay Chain';
    const close = document.createElement('button');
    close.className = 'decay-overlay-close';
    close.type = 'button';
    close.textContent = '×';
    close.addEventListener('click', () => hideDecayOverlay());
    header.appendChild(title);
    header.appendChild(close);

    const legend = document.createElement('div');
    legend.className = 'decay-legend';
    overlay.appendChild(legend);

    const view = document.createElement('div');
    view.className = 'decay-tree-view';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('decay-tree-svg');
    svg.setAttribute('tabindex', '0');
    const empty = document.createElement('div');
    empty.className = 'decay-tree-empty';
    empty.textContent = 'Select a nuclide to view its decay chain.';
    view.appendChild(svg);
    view.appendChild(empty);

    overlay.appendChild(header);
    overlay.appendChild(legend);
    overlay.appendChild(view);
    layer.appendChild(overlay);
    modalRoot.appendChild(layer);

    const camera = {
      zoom: 1,
      panX: 0,
      panY: 0,
      originX: 0,
      originY: 0,
      baseFit: 1,
      dragDist: 0,
      manualSet: false
    };

    svg.addEventListener('wheel', evt => {
      evt.preventDefault();
      applyOverlayZoom(evt.deltaY > 0 ? 0.8 : 1.2, evt.offsetX, evt.offsetY);
    });

    let dragging = false;
    let last = null;
    svg.addEventListener('pointerdown', evt => {
      dragging = true;
      camera.dragDist = 0;
      last = { x: evt.clientX, y: evt.clientY };
      svg.setPointerCapture(evt.pointerId);
      svg.classList.add('panning');
    });
    svg.addEventListener('pointermove', evt => {
      if (!dragging) return;
      if (!last) last = { x: evt.clientX, y: evt.clientY };
      const dx = evt.clientX - last.x;
      const dy = evt.clientY - last.y;
      last = { x: evt.clientX, y: evt.clientY };
      camera.dragDist += Math.abs(dx) + Math.abs(dy);
      camera.panX += dx;
      camera.panY += dy;
      camera.manualSet = true;
      updateOverlayTransform();
    });
    svg.addEventListener('pointerup', evt => {
      dragging = false;
      const moved = camera.dragDist;
      camera.dragDist = 0;
      last = null;
      svg.releasePointerCapture(evt.pointerId);
      svg.classList.remove('panning');
      if (moved < 4) {
        const hit = document.elementFromPoint(evt.clientX, evt.clientY);
        const target = hit ? hit.closest('g.decay-node-group') : null;
        if (target?.dataset?.key) {
          selectNuclideByKey(target.dataset.key);
        }
      }
    });
    svg.addEventListener('pointerleave', () => {
      dragging = false;
      last = null;
      svg.classList.remove('panning');
    });

    function applyOverlayZoom(factor, focusX, focusY) {
      const newZoom = Math.max(0.25, Math.min(6, camera.zoom * factor));
      if (newZoom === camera.zoom) return;
      const rect = svg.getBoundingClientRect();
      const fx = focusX ?? rect.width / 2;
      const fy = focusY ?? rect.height / 2;
      const scale = newZoom / camera.zoom;
      camera.panX = fx - (fx - camera.panX) * scale;
      camera.panY = fy - (fy - camera.panY) * scale;
      camera.zoom = newZoom;
      camera.manualSet = true;
      updateOverlayTransform();
    }

    function updateOverlayTransform() {
      if (!chart.decayOverlay?.contentGroup) return;
      const group = chart.decayOverlay.contentGroup;
      group.setAttribute(
        'transform',
        `translate(${camera.panX},${camera.panY}) scale(${camera.zoom * camera.baseFit}) translate(${-camera.originX},${-camera.originY})`
      );
    }

    chart.decayOverlay = { container: overlay, layer, svg, empty, title, camera, updateOverlayTransform };
    chart.decayOverlay.legend = legend;
    chart.decayOverlay.renderLegend = (modeSet) => {
      if (!legend) return;
      legend.innerHTML = '';
      const modes = Array.from(modeSet || []);
      if (!modes.length) {
        const emptyLegend = document.createElement('div');
        emptyLegend.className = 'decay-legend-empty';
        emptyLegend.textContent = 'No decay modes in this chain';
        legend.appendChild(emptyLegend);
        return;
      }
      modes.forEach(mode => {
        const info = decayModeStyles[mode];
        if (!info) return;
        const item = document.createElement('div');
        item.className = 'decay-legend-item';
        item.dataset.mode = mode;
        const swatch = document.createElement('div');
        swatch.className = 'decay-legend-swatch';
        swatch.style.background = info.color;
        const label = document.createElement('span');
        label.textContent = info.label || mode;
        item.appendChild(swatch);
        item.appendChild(label);
        item.addEventListener('click', () => triggerFlash('decay-mode', mode, 'decay'));
        legend.appendChild(item);
      });
      applyFlashClasses();
    };
  }

  function showDecayOverlay(nuclide) {
    if (!chart.decayOverlay) return;
    if (chart.decayOverlay._hideTimeout) {
      clearTimeout(chart.decayOverlay._hideTimeout);
      chart.decayOverlay._hideTimeout = null;
    }
    chart.decayOverlay.layer.style.display = 'flex';
    requestAnimationFrame(() => chart.decayOverlay.layer.classList.add('visible'));
    centerOverlay();
    if (chart.decayOverlay.camera) {
      chart.decayOverlay.camera.manualSet = false;
      chart.decayOverlay.camera.panX = 0;
      chart.decayOverlay.camera.panY = 0;
      chart.decayOverlay.camera.zoom = 1;
    }
    // Bind outside click to close (similar to periodic table atom modal)
    if (chart.decayOverlay._outsideHandler) {
      document.removeEventListener('mousedown', chart.decayOverlay._outsideHandler);
      document.removeEventListener('touchstart', chart.decayOverlay._outsideHandler);
    }
    const outsideHandler = (event) => {
      if (!chart.decayOverlay) return;
      const { container } = chart.decayOverlay;
      if (!container) return;
      if (container.contains(event.target)) return;
      hideDecayOverlay();
      const modal = document.getElementById('nuclide-modal');
      if (modal) modal.dataset.decayClosed = '1';
    };
    // Delay binding to avoid immediate close from the opening click
    setTimeout(() => {
      document.addEventListener('mousedown', outsideHandler);
      document.addEventListener('touchstart', outsideHandler);
    }, 0);
    chart.decayOverlay._outsideHandler = outsideHandler;
    renderDecayTree(nuclide);
  }

  function hideDecayOverlay() {
    if (!chart.decayOverlay) return;
    if (chart.decayOverlay._outsideHandler) {
      document.removeEventListener('mousedown', chart.decayOverlay._outsideHandler);
      document.removeEventListener('touchstart', chart.decayOverlay._outsideHandler);
      chart.decayOverlay._outsideHandler = null;
    }
    chart.decayOverlay.layer.classList.remove('visible');
    chart.decayOverlay._hideTimeout = setTimeout(() => {
      if (chart.decayOverlay) {
        chart.decayOverlay.layer.style.display = 'none';
        chart.decayOverlay._hideTimeout = null;
      }
    }, 220);
    const modal = document.getElementById('nuclide-modal');
    if (modal) delete modal.dataset.decayClosed;
  }

  function centerOverlay() {
    if (!chart.decayOverlay?.container || !chart.container) return;
    const overlay = chart.decayOverlay.container;
    const layer = chart.decayOverlay.layer;
    const chartRect = chart.container.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const offsetLeft = chartRect.left - layerRect.left + chartRect.width / 2;
    const offsetTop = chartRect.top - layerRect.top + chartRect.height / 2;
    overlay.style.left = `${offsetLeft}px`;
    overlay.style.top = `${offsetTop}px`;
    overlay.style.transform = 'translate(-50%, -50%)';
  }
})();
