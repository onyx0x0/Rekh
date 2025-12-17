// --- START OF FILE standard-model.js ---

let standardModelBooted = false;
document.addEventListener('DOMContentLoaded', function () {
  const btn = document.getElementById('standard-model-button');
  if (!btn) return;
  btn.addEventListener('click', function handleClick() {
    if (standardModelBooted) return;
    standardModelBooted = true;
    btn.removeEventListener('click', handleClick);
    setupStandardModelButton();
    createStandardModelModal();
    // Re-bind opener for subsequent clicks
    const finalBtn = document.getElementById('standard-model-button');
    if (finalBtn && !finalBtn.dataset.smBound) {
      finalBtn.dataset.smBound = '1';
      finalBtn.addEventListener('click', openStandardModelModal);
    }
    openStandardModelModal();
  });
});

// --- Data Definitions ---

// Extended data dictionary for popup details and animations
// Mass: 0-1 relative (log scale approximation for visuals)
// Lifetime: 0-1 relative (1 = stable, 0 = highly unstable)
const smParticleData = {
  // Quarks
  'u': {
    name: 'Up Quark', type: 'Quark (1st Gen)',
    desc: 'The lightest of all quarks. Along with the down quark, it forms the protons and neutrons of atomic nuclei.',
    massVal: 0.1, lifeVal: 1.0, // Effectively stable inside proton
    quantum: { Charge: '+2/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  'd': {
    name: 'Down Quark', type: 'Quark (1st Gen)',
    desc: 'The second lightest quark. It is a key component of nucleons; a neutron contains two down quarks and one up quark.',
    massVal: 0.15, lifeVal: 1.0, // Effectively stable inside proton
    quantum: { Charge: '-1/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  'c': {
    name: 'Charm Quark', type: 'Quark (2nd Gen)',
    desc: 'A heavier cousin of the up quark. It was found in 1974, leading to the "November Revolution" in particle physics.',
    massVal: 0.6, lifeVal: 0.2,
    quantum: { Charge: '+2/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  's': {
    name: 'Strange Quark', type: 'Quark (2nd Gen)',
    desc: 'The third lightest quark. Strange particles are produced in strong interactions but decay via the weak interaction.',
    massVal: 0.3, lifeVal: 0.3,
    quantum: { Charge: '-1/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  't': {
    name: 'Top Quark', type: 'Quark (3rd Gen)',
    desc: 'The heaviest known elementary particle. It is so heavy it decays before it can form hadrons.',
    massVal: 1.0, lifeVal: 0.05,
    quantum: { Charge: '+2/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  'b': {
    name: 'Bottom Quark', type: 'Quark (3rd Gen)',
    desc: 'Also known as the beauty quark. It implies the existence of the top quark and is vital for studying CP violation.',
    massVal: 0.75, lifeVal: 0.2,
    quantum: { Charge: '-1/3', Spin: '1/2', 'Baryon #': '1/3' },
    forces: ['Strong', 'EM', 'Weak', 'Higgs'],
    diagramType: 'quark_gluon'
  },
  // Leptons
  'e−': {
    symbol: 'e⁻',
    name: 'Electron', type: 'Lepton (1st Gen)',
    desc: 'The familiar negatively charged particle orbiting atomic nuclei. It is stable and responsible for electricity and chemistry.',
    massVal: 0.05, lifeVal: 1.0,
    quantum: { Charge: '-1', Spin: '1/2', 'Lepton #': '1' },
    forces: ['EM', 'Weak', 'Higgs'],
    diagramType: 'electron_photon'
  },
  'μ−': {
    symbol: 'μ⁻',
    name: 'Muon', type: 'Lepton (2nd Gen)',
    desc: 'A heavier version of the electron (approx 200x mass). It is unstable and decays into an electron and neutrinos.',
    massVal: 0.3, lifeVal: 0.4,
    quantum: { Charge: '-1', Spin: '1/2', 'Lepton #': '1' },
    forces: ['EM', 'Weak', 'Higgs'],
    diagramType: 'lepton_photon'
  },
  'τ−': {
    symbol: 'τ⁻',
    name: 'Tau', type: 'Lepton (3rd Gen)',
    desc: 'The heaviest lepton. It is the only lepton massive enough to decay into hadrons (particles made of quarks).',
    massVal: 0.65, lifeVal: 0.1,
    quantum: { Charge: '-1', Spin: '1/2', 'Lepton #': '1' },
    forces: ['EM', 'Weak', 'Higgs'],
    diagramType: 'lepton_photon'
  },
  'νe': {
    symbol: 'νₑ', displaySymbol: 'νₑ',
    name: 'Electron Neutrino', type: 'Neutrino (1st Gen)',
    desc: 'A ghostly particle with near-zero mass that rarely interacts with matter. Produced in vast numbers by the Sun.',
    massVal: 0.01, lifeVal: 1.0, // Oscillates but effectively stable
    quantum: { Charge: '0', Spin: '1/2', 'Lepton #': '1' },
    forces: ['Weak'], // Higgs debateable for small mass
    diagramType: 'neutrino_charged'
  },
  'νμ': {
    symbol: 'νₘ', displaySymbol: 'νₘ',
    name: 'Muon Neutrino', type: 'Neutrino (2nd Gen)',
    desc: 'Associated with the muon. Created in the atmosphere when cosmic rays strike atoms.',
    massVal: 0.01, lifeVal: 1.0,
    quantum: { Charge: '0', Spin: '1/2', 'Lepton #': '1' },
    forces: ['Weak'],
    diagramType: 'neutrino_charged'
  },
  'ντ': {
    symbol: 'νₜ', displaySymbol: 'νₜ',
    name: 'Tau Neutrino', type: 'Neutrino (3rd Gen)',
    desc: 'Associated with the tau lepton. It was the last lepton of the Standard Model to be discovered (2000).',
    massVal: 0.01, lifeVal: 1.0,
    quantum: { Charge: '0', Spin: '1/2', 'Lepton #': '1' },
    forces: ['Weak'],
    diagramType: 'neutrino_charged'
  },
  // Bosons
  'g': {
    name: 'Gluon', type: 'Gauge Boson',
    desc: 'The carrier of the strong nuclear force. It "glues" quarks together. Gluons themselves carry color charge.',
    massVal: 0.0, lifeVal: 1.0, // Stable (confinement)
    quantum: { Charge: '0', Spin: '1', Mass: '0' },
    forces: ['Strong'],
    diagramType: 'gluon_split'
  },
  'γ': {
    name: 'Photon', type: 'Gauge Boson',
    desc: 'The particle of light and carrier of the electromagnetic force. It has zero rest mass and moves at the speed of light.',
    massVal: 0.0, lifeVal: 1.0,
    quantum: { Charge: '0', Spin: '1', Mass: '0' },
    forces: ['EM'],
    diagramType: 'electron_photon'
  },
  'Z': {
    name: 'Z Boson', type: 'Gauge Boson',
    desc: 'A heavy neutral boson that mediates the weak force along with W bosons. Responsible for neutral current interactions.',
    massVal: 0.9, lifeVal: 0.05,
    quantum: { Charge: '0', Spin: '1', Mass: '91 GeV' },
    forces: ['Weak'],
    diagramType: 'z_decay'
  },
  'W': {
    name: 'W Boson', type: 'Gauge Boson',
    desc: 'Charged carriers of the weak force. They are responsible for radioactive decay (changing quark flavors).',
    massVal: 0.85, lifeVal: 0.05,
    quantum: { Charge: '±1', Spin: '1', Mass: '80 GeV' },
    forces: ['Weak', 'EM'],
    diagramType: 'w_decay'
  },
  'H': {
    name: 'Higgs Boson', type: 'Scalar Boson',
    desc: 'An excitation of the Higgs field. Interaction with this field gives mass to other elementary particles.',
    massVal: 0.95, lifeVal: 0.08,
    quantum: { Charge: '0', Spin: '0', Mass: '125 GeV' },
    forces: ['Higgs', 'Weak'],
    diagramType: 'higgs_decay'
  }
};

// Grid definitions
const standardModelRows = [
  { label: 'Quarks (up-type)', particles: ['u', 'c', 't'] },
  { label: 'Quarks (down-type)', particles: ['d', 's', 'b'] },
  { label: 'Leptons (charged)', particles: ['e−', 'μ−', 'τ−'] },
  { label: 'Leptons (neutrinos)', particles: ['νe', 'νμ', 'ντ'] }
];

const standardModelGaugeCol = ['g', 'γ', 'Z', 'W'];
const standardModelHiggs = 'H';

// --- Initialization ---

function setupStandardModelButton() {
  const navLeft = document.querySelector('.nav-left');
  if (!navLeft) return; // Hook into your existing nav

  let button = document.getElementById('standard-model-button');
  if (!button) {
    const li = document.createElement('li');
    button = document.createElement('button');
    button.id = 'standard-model-button';
    button.className = 'standard-model-button';
    button.textContent = 'Standard Model';
    li.appendChild(button);
    navLeft.appendChild(li);
  }

  button.addEventListener('click', openStandardModelModal);
}

function createStandardModelModal() {
  if (document.getElementById('standard-model-modal')) return;

  const body = document.querySelector('body');
  
  // 1. Create Modal Wrapper
  const modal = document.createElement('div');
  modal.id = 'standard-model-modal';
  modal.className = 'standard-model-modal';
  modal.addEventListener('click', (e) => {
    if (e.target !== modal) return;

    const popupOverlay = document.getElementById('sm-popup-overlay');
    const popupOpen = popupOverlay?.classList.contains('active');

    if (popupOpen) {
      closeParticlePopup();
      setTimeout(() => closeStandardModelModal(), 320);
    } else {
      closeStandardModelModal();
    }
  });

  // 2. Main Container
  const container = document.createElement('div');
  container.className = 'standard-model-container';

  // Close Button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-button';
  closeBtn.innerHTML = '&times;';
  closeBtn.onclick = closeStandardModelModal;
  container.appendChild(closeBtn);

  // Title
  const title = document.createElement('h2');
  title.className = 'standard-model-title';
  title.textContent = 'Standard Model of Particles';
  container.appendChild(title);

  // 3. The Grid
  const grid = document.createElement('div');
  grid.className = 'standard-model-grid';
  grid.id = 'sm-grid';

  // Headers
  const headers = ['', '1st Gen', '2nd Gen', '3rd Gen', 'Gauge Bosons', 'Higgs'];
  headers.forEach(h => {
    const div = document.createElement('div');
    div.className = 'generation-header';
    div.textContent = h;
    grid.appendChild(div);
  });

  // Build Rows
  standardModelRows.forEach((row, i) => {
    // Row Label
    const label = document.createElement('div');
    label.className = 'standard-model-row-label';
    label.textContent = row.label;
    grid.appendChild(label);

    // 3 Generations
    row.particles.forEach(symbol => {
      grid.appendChild(createParticleTile(symbol));
    });

    // Gauge Column
    grid.appendChild(createParticleTile(standardModelGaugeCol[i]));

    // Higgs Column (Only first row)
    if (i === 0) {
      grid.appendChild(createParticleTile(standardModelHiggs));
    } else {
      grid.appendChild(document.createElement('div')); // Empty cell
    }
  });

  container.appendChild(grid);

  // 4. View Mode Controls
  const controls = document.createElement('div');
  controls.className = 'sm-view-controls';
  
  ['Default', 'Mass', 'Lifetime'].forEach((mode, idx) => {
    const btn = document.createElement('button');
    btn.className = 'sm-view-btn' + (idx === 0 ? ' active' : '');
    btn.textContent = mode;
    btn.dataset.mode = mode.toLowerCase();
    btn.onclick = (e) => setViewMode(e.target);
    controls.appendChild(btn);
  });
  
  container.appendChild(controls);

  // 5. Inner Popup Overlay (Created once, hidden)
  const popupOverlay = document.createElement('div');
  popupOverlay.className = 'sm-popup-overlay';
  popupOverlay.id = 'sm-popup-overlay';
  
  // Close popup when clicking overlay background
  popupOverlay.addEventListener('click', (e) => {
    if(e.target === popupOverlay) closeParticlePopup();
  });

  const popupContent = document.createElement('div');
  popupContent.className = 'sm-popup-content';
  
  // Close X
  const popupClose = document.createElement('button');
  popupClose.className = 'sm-popup-close';
  popupClose.innerHTML = '&times;';
  popupClose.onclick = closeParticlePopup;
  popupContent.appendChild(popupClose);

  // Tabs
  const tabs = document.createElement('div');
  tabs.className = 'sm-popup-tabs';
  tabs.innerHTML = `
    <button class="sm-popup-tab active" onclick="switchPopupTab('overview')">Overview</button>
    <button class="sm-popup-tab" onclick="switchPopupTab('feynman')">Feynman</button>
  `;
  popupContent.appendChild(tabs);

  // Tab Contents (Empty containers to be filled dynamically)
  const tabOverview = document.createElement('div');
  tabOverview.id = 'sm-tab-overview';
  tabOverview.className = 'sm-tab-content active';
  popupContent.appendChild(tabOverview);

  const tabFeynman = document.createElement('div');
  tabFeynman.id = 'sm-tab-feynman';
  tabFeynman.className = 'sm-tab-content';
  popupContent.appendChild(tabFeynman);

  popupOverlay.appendChild(popupContent);
  container.appendChild(popupOverlay);

  // Append to body
  modal.appendChild(container);
  body.appendChild(modal);
}

function createParticleTile(symbol) {
  const data = smParticleData[symbol];
  if (!data) return document.createElement('div'); // Safety for empty slots
  const displaySymbol = data.displaySymbol || data.symbol || symbol;

  // Determine category for coloring
  let category = 'quark';
  if (data.type.includes('Lepton') || data.type.includes('Neutrino')) category = 'lepton';
  if (data.type.includes('Gauge')) category = 'boson';
  if (data.type.includes('Scalar')) category = 'higgs';

  const btn = document.createElement('button');
  btn.className = `sm-particle sm-particle-type-${category}`;
  btn.dataset.symbol = symbol;
  btn.dataset.mass = data.massVal;
  btn.dataset.life = data.lifeVal;
  
  // Symbol & Name
  btn.innerHTML = `
    <div class="sm-particle-symbol">${displaySymbol}</div>
    <div class="sm-particle-name">${data.name}</div>
    <div class="sm-particle-bar-container">
      <div class="sm-particle-bar"></div>
    </div>
  `;

  btn.onclick = () => openParticlePopup(symbol);

  return btn;
}

// --- View Modes ---

function setViewMode(targetBtn) {
  // UI toggle
  document.querySelectorAll('.sm-view-btn').forEach(b => b.classList.remove('active'));
  targetBtn.classList.add('active');

  const mode = targetBtn.dataset.mode;
  const tiles = document.querySelectorAll('.sm-particle');

  tiles.forEach(tile => {
    const barContainer = tile.querySelector('.sm-particle-bar-container');
    const bar = tile.querySelector('.sm-particle-bar');
    
    // Reset widths first to allow transition
    bar.style.width = '0%';
    
    if (mode === 'default') {
      tile.classList.remove('show-bars');
    } else {
      tile.classList.add('show-bars');
      // Small timeout to allow the container to fade in before bar grows
      setTimeout(() => {
        const val = parseFloat(tile.dataset[mode === 'mass' ? 'mass' : 'life']);
        // Min width 5% for visibility if not 0
        const pct = val > 0 ? (val * 95 + 5) : 0; 
        bar.style.width = `${pct}%`;
      }, 50);
    }
  });
}

// --- Popup Logic ---

function openParticlePopup(symbol) {
  const data = smParticleData[symbol];
  if(!data) return;

  const overlay = document.getElementById('sm-popup-overlay');
  overlay.classList.remove('closing');
  
  // Fill Overview
  const overview = document.getElementById('sm-tab-overview');
  overview.innerHTML = `
    <div class="sm-popup-header">
      <div class="sm-popup-symbol">${symbol}</div>
      <div class="sm-popup-name">${data.name}</div>
      <div class="sm-popup-meta">${data.type}</div>
    </div>
    <p class="sm-popup-desc">${data.desc}</p>
    
    <div class="sm-popup-stats">
      <div class="sm-stat-row">
        <div class="sm-stat-label">Mass</div>
        <div class="sm-stat-track"><div class="sm-stat-bar" style="width: ${data.massVal * 100}%"></div></div>
      </div>
      <div class="sm-stat-row">
        <div class="sm-stat-label">Lifetime</div>
        <div class="sm-stat-track"><div class="sm-stat-bar" style="width: ${data.lifeVal * 100}%"></div></div>
      </div>
    </div>

    <div class="sm-section-title">Quantum Numbers</div>
    <div class="sm-badges-grid">
      ${Object.entries(data.quantum).map(([k, v]) => `
        <div class="sm-badge sm-tooltip-trigger" data-tooltip="${getTooltip(k)}">
          <span>${k}</span><span>${v}</span>
        </div>
      `).join('')}
    </div>

    <div class="sm-section-title">Interactions</div>
    <div class="sm-forces-row">
      ${['Strong', 'EM', 'Weak', 'Higgs'].map(f => {
        const active = data.forces.includes(f);
        return `<div class="sm-force-pill ${active ? 'active' : ''} sm-tooltip-trigger" 
                    data-tooltip="${active ? 'Interacts via ' + f + ' force' : 'Does not feel ' + f + ' force'}">
                  ${f}
                </div>`;
      }).join('')}
    </div>
  `;

  // Fill Feynman
  renderFeynmanDiagram(symbol, data);

  // Reset tabs
  switchPopupTab('overview');
  
  // Show
  overlay.classList.add('active');
}

function closeParticlePopup() {
  const overlay = document.getElementById('sm-popup-overlay');
  overlay.classList.add('closing');
  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.classList.remove('closing');
  }, 300);
}

function switchPopupTab(tabName) {
  // Buttons
  document.querySelectorAll('.sm-popup-tab').forEach(b => b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.sm-popup-tab')).find(b => b.textContent.toLowerCase() === tabName);
  if(btn) btn.classList.add('active');

  // Content
  document.querySelectorAll('.sm-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`sm-tab-${tabName}`).classList.add('active');
}

function getTooltip(key) {
  const dict = {
    'Charge': 'Electric Charge relative to proton (+1)',
    'Spin': 'Intrinsic Angular Momentum',
    'Mass': 'Rest Energy',
    'Baryon #': 'Conserved number for quarks (1/3)',
    'Lepton #': 'Conserved number for leptons (1)'
  };
  return dict[key] || '';
}

// --- Feynman Diagram Renderer (SVG) ---

function renderFeynmanDiagram(symbol, data) {
  const container = document.getElementById('sm-tab-feynman');
  const type = data.diagramType || 'none';

  if (type === 'none') {
    container.innerHTML = `<p class="feynman-desc" style="padding: 40px 0;">No simple Feynman diagram is typically associated with this particle in isolation, or it is not implemented in this demo.</p>`;
    return;
  }

  const buildHorizontalCoil = () => {
    let coilPath = 'M 20,90';
    for (let i = 0; i < 11; i++) {
      coilPath += ' c 4,10 10,10 15,0 s -9,-10 -5,0';
    }
    coilPath += ' c 3,10 7,10 10,0';
    return coilPath;
  };

  const buildVerticalWiggle = (x, y) => `M ${x},${y} q 10,-14 0,-28 q -10,-14 0,-28 q 10,-14 0,-28 q -10,-14 0,-28`;

  let svgContent = '';
  let descText = '';

  if (type === 'electron_photon') {
    descText = 'The photon couples to electric charge. An electron can emit or absorb a photon through the QED vertex.';
    const photonPath = buildVerticalWiggle(140, 110);
    svgContent = `
      <path d="M 40,170 L 140,110" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 40,170 L 140,110');" />
      <text x="52" y="184" class="f-label">e⁻</text>

      <path d="M 140,110 L 240,170" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,110 L 240,170');" />
      <text x="226" y="184" class="f-label">e⁻</text>

      <path d="${photonPath}" class="f-line-z" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('${photonPath}'); fill: var(--sm-orange);" />
      <text x="148" y="22" class="f-label">γ</text>

      <circle cx="140" cy="110" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'lepton_photon') {
    descText = `The ${symbol} interacts electromagnetically by emitting or absorbing a photon through the QED vertex.`;
    const photonPath = buildVerticalWiggle(140, 110);
    svgContent = `
      <path d="M 40,170 L 140,110" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 40,170 L 140,110');" />
      <text x="52" y="184" class="f-label">${symbol}</text>

      <path d="M 140,110 L 240,170" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,110 L 240,170');" />
      <text x="226" y="184" class="f-label">${symbol}</text>

      <path d="${photonPath}" class="f-line-z" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('${photonPath}'); offset-rotate: 0deg; fill: var(--sm-orange);" />
      <text x="148" y="22" class="f-label">γ</text>

      <circle cx="140" cy="110" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'neutrino_charged') {
    const leptonLabel = data.displaySymbol || data.symbol || symbol;
    const chargedLabel = symbol.includes('μ') ? 'μ⁻' : symbol.includes('τ') ? 'τ⁻' : 'e⁻';
    descText = `The ${leptonLabel} interacts through the charged weak force by converting into a charged lepton and emitting a W+.`;
    const wPath = buildVerticalWiggle(140, 110);
    svgContent = `
      <path d="M 40,170 L 140,110" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 40,170 L 140,110');" />
      <text x="48" y="184" class="f-label">${leptonLabel}</text>

      <path d="M 140,110 L 240,170" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,110 L 240,170');" />
      <text x="218" y="184" class="f-label">${chargedLabel}</text>

      <path d="${wPath}" class="f-line-z" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('${wPath}'); offset-rotate: 0deg; fill: var(--sm-orange);" />
      <text x="148" y="22" class="f-label">W+</text>

      <circle cx="140" cy="110" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'gluon_emission' || type === 'gluon_split') {
    descText = 'The gluon is the carrier of the strong force. It couples to quarks, creating quark-antiquark pairs or being emitted or absorbed by quarks.';
    const coilPath = buildHorizontalCoil();
    svgContent = `
      <path d="${coilPath}" class="f-line-gluon" fill="none" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('${coilPath}'); fill: var(--sm-orange);" />
      <text x="26" y="65" class="f-label">g</text>

      <path d="M 140,90 L 230,40" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,40');" />
      <text x="214" y="32" class="f-label">q</text>

      <path d="M 140,90 L 230,140" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,140');" />
      <text x="206" y="152" class="f-label">q̄</text>

      <circle cx="140" cy="90" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'quark_gluon') {
    descText = `The ${symbol === 'd' ? 'down' : 'up'} quark interacts through the strong force by emitting or absorbing a gluon.`;
    const coilPath = buildVerticalWiggle(140, 110);
    svgContent = `
      <path d="M 40,160 L 140,110" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 40,160 L 140,110');" />
      <text x="52" y="174" class="f-label">${symbol}</text>

      <path d="M 140,110 L 240,160" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,110 L 240,160');" />
      <text x="226" y="174" class="f-label">${symbol}</text>

      <path d="${coilPath}" class="f-line-gluon" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('${coilPath}'); offset-rotate: 0deg; fill: var(--sm-orange);" />
      <text x="148" y="22" class="f-label">g</text>

      <circle cx="140" cy="110" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'z_decay') {
    descText = 'The Z boson mediates the neutral weak force. It can decay into an electron and a positron via the weak neutral current.';
    svgContent = `
      <path d="M 20,90 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0" class="f-line-z" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 20,90 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0'); fill: var(--sm-orange);" />
      <text x="28" y="74" class="f-label">Z</text>

      <path d="M 140,90 L 230,40" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,40');" />
      <text x="214" y="32" class="f-label">e⁻</text>

      <path d="M 140,90 L 230,140" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,140');" />
      <text x="214" y="152" class="f-label">e⁺</text>

      <circle cx="140" cy="90" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'w_decay') {
    descText = 'The W boson mediates the charged weak interaction. A W- can decay into an electron and an electron antineutrino.';
    svgContent = `
      <path d="M 20,90 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0" class="f-line-z" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 20,90 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0 q 10,-12 20,0 q 10,12 20,0'); fill: var(--sm-orange);" />
      <text x="24" y="74" class="f-label">W⁻</text>

      <path d="M 140,90 L 230,40" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,40');" />
      <text x="214" y="32" class="f-label">e⁻</text>

      <path d="M 140,90 L 230,140" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 140,90 L 230,140');" />
      <text x="206" y="152" class="f-label">ν̅</text>

      <circle cx="140" cy="90" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else if (type === 'higgs_decay') {
    descText = 'A Higgs boson (dashed) decays into a bottom quark and antiquark (solid orange lines).';
    svgContent = `
      <path d="M 20,90 L 120,90" class="f-line-higgs" />
      <circle r="3" class="f-particle-dot anim-in" style="offset-path: path('M 20,90 L 120,90');" />
      <text x="32" y="78" class="f-label">H</text>

      <path d="M 120,90 L 220,40" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 120,90 L 220,40');" />
      <text x="208" y="32" class="f-label">b</text>

      <path d="M 120,90 L 220,140" class="f-line-fermion" />
      <circle r="3" class="f-particle-dot anim-out" style="offset-path: path('M 120,90 L 220,140');" />
      <text x="206" y="152" class="f-label">b̅</text>

      <circle cx="120" cy="90" r="0" class="f-vertex-flash anim-flash" />
    `;
  } else {
    descText = 'Standard model interaction.';
    svgContent = `<circle cx="120" cy="90" r="10" fill="#333" />`;
  }

  container.innerHTML = `
    <div class="feynman-container">
      <svg class="feynman-svg" viewBox="0 0 260 200">
        ${svgContent}
      </svg>
      <p class="feynman-desc">${descText}</p>
    </div>
  `;
}

// --- Main Modal Controls (Open/Close) ---

function openStandardModelModal() {
  const modal = document.getElementById('standard-model-modal');
  if (modal) {
    modal.classList.remove('closing');
    modal.classList.add('visible');
    // Default view mode
    document.querySelector('[data-mode="default"]').click();
  }
}

function closeStandardModelModal() {
  const modal = document.getElementById('standard-model-modal');
  if (modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.remove('visible');
      modal.classList.remove('closing');
    }, 300);
  }
}

// Global Keydown
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // If popup is open, close popup. Else close modal.
    if(document.getElementById('sm-popup-overlay')?.classList.contains('active')) {
      closeParticlePopup();
    } else {
      closeStandardModelModal();
    }
  }
});

// --- END OF FILE standard-model.js ---
