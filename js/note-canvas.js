// Note Canvas modal integration
document.addEventListener('DOMContentLoaded', () => {
  attachNoteCanvasButton();
});

const NOTE_CANVAS_SRC = 'note%20canvas/index.html';

function createNoteCanvasModal() {
  let modal = document.getElementById('note-canvas-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'note-canvas-modal';
  modal.className = 'note-canvas-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  modal.innerHTML = `
    <div class="note-canvas-shell" tabindex="-1">
      <div class="note-canvas-frame-wrap">
        <div class="note-canvas-loader" role="status" aria-live="polite">
          <span class="note-canvas-dot"></span>
          <span class="note-canvas-dot"></span>
          <span class="note-canvas-dot"></span>
          <span class="note-canvas-loader-text">Loading canvas...</span>
        </div>
        <iframe id="note-canvas-iframe" class="note-canvas-frame" title="Note Canvas workspace" src="${NOTE_CANVAS_SRC}"></iframe>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const iframe = modal.querySelector('#note-canvas-iframe');
  if (iframe) {
    iframe.addEventListener('load', () => {
      modal.classList.add('note-canvas-loaded');
      iframe.dataset.loaded = '1';
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeNoteCanvasModal();
    }
  });

  return modal;
}

function attachNoteCanvasButton() {
  const button = ensureNoteCanvasButton();
  if (button && !button.dataset.noteCanvasBound) {
    button.dataset.noteCanvasBound = '1';
    button.addEventListener('click', openNoteCanvasModal);
  }
}

function ensureNoteCanvasButton() {
  let button = document.getElementById('note-canvas-button');
  if (button) return button;

  const toolsGrid = document.querySelector('#tools-folder-panel .app-grid');
  if (toolsGrid) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.id = 'note-canvas-button';
    tile.className = 'app-tile';
    tile.setAttribute('role', 'menuitem');
    tile.innerHTML = `
      <div class="app-icon app-icon-canvas">
        <span class="app-glyph fa-solid fa-pen-ruler" aria-hidden="true"></span>
      </div>
      <span class="app-label">Note Canvas</span>
    `;
    toolsGrid.appendChild(tile);
    button = tile;
  } else {
    const navLeft = document.querySelector('.nav-left');
    if (navLeft) {
      const li = document.createElement('li');
      const fallbackBtn = document.createElement('button');
      fallbackBtn.id = 'note-canvas-button';
      fallbackBtn.className = 'button';
      fallbackBtn.type = 'button';
      fallbackBtn.textContent = 'Note Canvas';
      li.appendChild(fallbackBtn);
      navLeft.appendChild(li);
      button = fallbackBtn;
    }
  }

  return button || null;
}

function openNoteCanvasModal() {
  const modal = createNoteCanvasModal();
  const shell = modal?.querySelector('.note-canvas-shell');
  const button = document.getElementById('note-canvas-button');
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
  document.body.classList.add('note-canvas-open');
  document.addEventListener('keydown', handleNoteCanvasKeydown, true);
  shell.focus({ preventScroll: true });
}

function closeNoteCanvasModal() {
  const modal = document.getElementById('note-canvas-modal');
  if (!modal) return;

  modal.classList.remove('visible');
  document.body.classList.remove('note-canvas-open');
  document.removeEventListener('keydown', handleNoteCanvasKeydown, true);
}

function handleNoteCanvasKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeNoteCanvasModal();
  }
}
