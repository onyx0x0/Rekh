// Speed of Light modal integration (Data category)
document.addEventListener('DOMContentLoaded', () => {
  attachSolButton();
});

const SOL_SRC = 'speed%20of%20light/index.html';

function createSolModal() {
  let modal = document.getElementById('sol-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'sol-modal';
  modal.className = 'sol-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="sol-shell" tabindex="-1">
      <div class="sol-frame-wrap">
        <div class="sol-loader" role="status" aria-live="polite">
          <span class="sol-dot"></span>
          <span class="sol-dot"></span>
          <span class="sol-dot"></span>
          <span class="sol-loader-text">Loading...</span>
        </div>
        <iframe id="sol-iframe" class="sol-frame" title="Speed of Light simulator" src="${SOL_SRC}"></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const iframe = modal.querySelector('#sol-iframe');
  if (iframe) {
    iframe.addEventListener('load', () => {
      modal.classList.add('sol-loaded');
      iframe.dataset.loaded = '1';
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeSolModal();
    }
  });

  return modal;
}

function attachSolButton() {
  const button = ensureSolButton();
  if (button && !button.dataset.solBound) {
    button.dataset.solBound = '1';
    button.addEventListener('click', openSolModal);
  }
}

function ensureSolButton() {
  let button = document.getElementById('speed-of-light-button');
  if (button) return button;

  const dataGrid = document.querySelector('#data-folder-panel .app-grid');
  if (dataGrid) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.id = 'speed-of-light-button';
    tile.className = 'app-tile';
    tile.setAttribute('role', 'menuitem');
    tile.innerHTML = `
      <div class="app-icon app-icon-sol">
        <span class="app-glyph fa-solid fa-gauge-high" aria-hidden="true"></span>
      </div>
      <span class="app-label">Speed of Light</span>
    `;
    dataGrid.appendChild(tile);
    button = tile;
  } else {
    const navLeft = document.querySelector('.nav-left');
    if (navLeft) {
      const li = document.createElement('li');
      const fallbackBtn = document.createElement('button');
      fallbackBtn.id = 'speed-of-light-button';
      fallbackBtn.className = 'button';
      fallbackBtn.type = 'button';
      fallbackBtn.textContent = 'Speed of Light';
      li.appendChild(fallbackBtn);
      navLeft.appendChild(li);
      button = fallbackBtn;
    }
  }

  return button || null;
}

function openSolModal() {
  const modal = createSolModal();
  const shell = modal?.querySelector('.sol-shell');
  const button = document.getElementById('speed-of-light-button');
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
  document.body.classList.add('sol-open');
  document.addEventListener('keydown', handleSolKeydown, true);
  shell.focus({ preventScroll: true });
}

function closeSolModal() {
  const modal = document.getElementById('sol-modal');
  if (!modal) return;

  modal.classList.remove('visible');
  document.body.classList.remove('sol-open');
  document.removeEventListener('keydown', handleSolKeydown, true);
}

function handleSolKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeSolModal();
  }
}
