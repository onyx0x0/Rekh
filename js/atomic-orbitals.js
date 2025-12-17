// Atomic Orbitals modal integration (Data category)
document.addEventListener('DOMContentLoaded', () => {
  attachOrbitalsButton();
});

const ORBITALS_SRC = 'atomic%20orbitals/index.html';

function createOrbitalsModal() {
  let modal = document.getElementById('orbitals-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'orbitals-modal';
  modal.className = 'orbitals-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="orbitals-shell" tabindex="-1">
      <div class="orbitals-frame-wrap">
        <div class="orbitals-loader" role="status" aria-live="polite">
          <span class="orbitals-dot"></span>
          <span class="orbitals-dot"></span>
          <span class="orbitals-dot"></span>
          <span class="orbitals-loader-text">Loading...</span>
        </div>
        <iframe id="orbitals-iframe" class="orbitals-frame" title="Atomic Orbitals visualizer" src="${ORBITALS_SRC}"></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const iframe = modal.querySelector('#orbitals-iframe');
  if (iframe) {
    iframe.addEventListener('load', () => {
      modal.classList.add('orbitals-loaded');
      iframe.dataset.loaded = '1';
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeOrbitalsModal();
    }
  });

  return modal;
}

function attachOrbitalsButton() {
  const button = ensureOrbitalsButton();
  if (button && !button.dataset.orbitalsBound) {
    button.dataset.orbitalsBound = '1';
    button.addEventListener('click', openOrbitalsModal);
  }
}

function ensureOrbitalsButton() {
  let button = document.getElementById('orbitals-button');
  if (button) return button;

  const dataGrid = document.querySelector('#data-folder-panel .app-grid');
  if (dataGrid) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.id = 'orbitals-button';
    tile.className = 'app-tile';
    tile.setAttribute('role', 'menuitem');
    tile.innerHTML = `
      <div class="app-icon app-icon-orbitals">
        <span class="app-glyph fa-solid fa-dna" aria-hidden="true"></span>
      </div>
      <span class="app-label">Atomic Orbitals</span>
    `;
    dataGrid.appendChild(tile);
    button = tile;
  } else {
    const navLeft = document.querySelector('.nav-left');
    if (navLeft) {
      const li = document.createElement('li');
      const fallbackBtn = document.createElement('button');
      fallbackBtn.id = 'orbitals-button';
      fallbackBtn.className = 'button';
      fallbackBtn.type = 'button';
      fallbackBtn.textContent = 'Atomic Orbitals';
      li.appendChild(fallbackBtn);
      navLeft.appendChild(li);
      button = fallbackBtn;
    }
  }

  return button || null;
}

function openOrbitalsModal() {
  const modal = createOrbitalsModal();
  const shell = modal?.querySelector('.orbitals-shell');
  const button = document.getElementById('orbitals-button');
  if (!modal || !shell) return;

  if (button) {
    const rect = button.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    shell.style.transformOrigin = `${originX}px ${originY}px`;
  } else {
    shell.style.transformOrigin = '50% 50%';
  }

  modal.classList.add('visible');
  document.body.classList.add('orbitals-open');
  document.addEventListener('keydown', handleOrbitalsKeydown, true);
  shell.focus({ preventScroll: true });
}

function closeOrbitalsModal() {
  const modal = document.getElementById('orbitals-modal');
  if (!modal) return;

  modal.classList.remove('visible');
  document.body.classList.remove('orbitals-open');
  document.removeEventListener('keydown', handleOrbitalsKeydown, true);
}

function handleOrbitalsKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeOrbitalsModal();
  }
}
