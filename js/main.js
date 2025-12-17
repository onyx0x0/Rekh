// js/main.js

document.addEventListener('DOMContentLoaded', () => {
  const journeyOverlay = createJourneyOverlay();
  setupNavFolders();

  // Guard against missing Firebase so the header still renders instead of crashing.
  if (!window.firebase || !firebase.auth) {
    console.error('Firebase is unavailable; rendering signed-out header fallback.');
    renderSignedOutNav({ journeyOverlay });
    return;
  }

  // Render a signed-out shell immediately to avoid header popping in later.
  const navRightShell = document.querySelector('.nav-right');
  if (navRightShell && !navRightShell.children.length) {
    renderSignedOutNav({ navRight: navRightShell, journeyOverlay });
  }

  firebase.auth().onAuthStateChanged(async (user) => {
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    navRight.innerHTML = '';

    if (user) {
      // Dashboard
      const dashboardLi = document.createElement('li');
      const dashboardLink = document.createElement('a');
      dashboardLink.href = 'dashboard.html';
      dashboardLink.className = 'button';
      dashboardLink.id = 'dashboard-button';
      dashboardLink.textContent = 'Dashboard';
      dashboardLi.appendChild(dashboardLink);
      navRight.appendChild(dashboardLi);

      // Log out
      const logoutLi = document.createElement('li');
      const logoutLink = document.createElement('a');
      logoutLink.href = '#';
      logoutLink.className = 'button';
      logoutLink.id = 'logout-button';
      logoutLink.textContent = 'Log Out';
      logoutLi.appendChild(logoutLink);
      navRight.appendChild(logoutLi);

      logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        firebase.auth().signOut().then(() => {
          window.location.reload();
        }).catch((error) => {
          console.error('Error signing out:', error);
        });
      });
    } else {
      renderSignedOutNav({ navRight, journeyOverlay });
    }

    navRight.classList.add('visible');
  });
});

function setupNavFolders() {
  const folders = [
    { toggleId: 'tools-folder-toggle', panelId: 'tools-folder-panel' },
    { toggleId: 'data-folder-toggle', panelId: 'data-folder-panel' }
  ];

  const closeAll = () => {
    folders.forEach(({ toggleId }) => {
      const toggle = document.getElementById(toggleId);
      const parent = toggle ? toggle.closest('.nav-folder') : null;
      if (parent) {
        parent.classList.remove('open');
      }
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  };

  folders.forEach(({ toggleId, panelId }) => {
    const toggle = document.getElementById(toggleId);
    const panel = document.getElementById(panelId);
    if (!toggle || !panel) return;

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const parent = toggle.closest('.nav-folder');
      const isOpen = parent?.classList.contains('open');
      closeAll();
      if (parent && !isOpen) {
        parent.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        positionFolderPanel(toggle, panel);
      }
    });

    panel.addEventListener('click', (event) => {
      if (event.target.closest('.app-tile')) {
        closeAll();
      }
      event.stopPropagation();
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-folder')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
}

function positionFolderPanel(toggle, panel) {
  const rect = toggle.getBoundingClientRect();
  const baseTop = rect.bottom + 12;

  // Temporarily show to measure width
  const previousDisplay = panel.style.display;
  const previousVisibility = panel.style.visibility;
  panel.style.display = 'block';
  panel.style.visibility = 'hidden';
  const panelWidth = panel.offsetWidth || 320;
  panel.style.display = previousDisplay;
  panel.style.visibility = previousVisibility;

  const maxLeft = window.innerWidth - panelWidth - 12;
  const left = Math.max(12, Math.min(rect.left + rect.width / 2 - panelWidth / 2, maxLeft));
  const arrowLeft = Math.max(12, Math.min(panelWidth - 28, rect.left + rect.width / 2 - left - 8));

  panel.style.setProperty('--folder-top', `${baseTop}px`);
  panel.style.setProperty('--folder-left', `${left}px`);
  panel.style.setProperty('--folder-arrow-left', `${arrowLeft}px`);
}

function renderSignedOutNav({ navRight = document.querySelector('.nav-right'), journeyOverlay }) {
  if (!navRight) return;
  navRight.innerHTML = '';

  // Journey hint icon
  const journeyLi = document.createElement('li');
  const journeyButton = document.createElement('button');
  journeyButton.type = 'button';
  journeyButton.id = 'journey-hint-button';
  journeyButton.className = 'journey-hint-button';
  journeyButton.setAttribute('aria-label', 'How to use this site');
  journeyButton.textContent = '!';
  journeyLi.appendChild(journeyButton);
  navRight.appendChild(journeyLi);

  if (journeyOverlay && typeof journeyOverlay.attachButton === 'function') {
    journeyOverlay.attachButton(journeyButton);
  }

  // Sign up / Log in
  const signupLi = document.createElement('li');
  const signupLink = document.createElement('a');
  signupLink.href = '#';
  signupLink.className = 'button';
  signupLink.id = 'signup-button';
  signupLink.textContent = 'Sign Up / Log In';
  signupLi.appendChild(signupLink);
  navRight.appendChild(signupLi);

  signupLink.addEventListener('click', (event) => {
    event.preventDefault();
    if (typeof window.openAuthModal === 'function') {
      window.openAuthModal();
    }
  });

  navRight.classList.add('visible');
}

function createJourneyOverlay() {
  const existingOverlay = document.getElementById('journey-overlay');
  const overlay = existingOverlay || document.createElement('div');

  if (!existingOverlay) {
    overlay.id = 'journey-overlay';
    overlay.className = 'journey-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="journey-sequence">
        <div class="journey-track">
          <div class="journey-fill"></div>
          <div class="journey-step" data-step="earth">
            <img src="images/earth.png" alt="Earth">
            <div class="journey-callout">step 1: sign up to get analytic info on your progress and get points</div>
          </div>
          <div class="journey-step" data-step="exoplanet">
            <img src="images/exoplanet.png" alt="Exoplanet">
            <div class="journey-callout">step 2: study the courses and do the quizes to get points</div>
          </div>
          <div class="journey-step" data-step="blackhole">
            <img src="images/black hole.png" alt="Black hole">
            <div class="journey-callout">step 3: check the analysis of your result and unlock badges</div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const fill = overlay.querySelector('.journey-fill');
  const steps = Array.from(overlay.querySelectorAll('.journey-step'));
  let timers = [];

  const clearTimers = () => {
    if (!timers.length) return;
    timers.forEach((timerId) => clearTimeout(timerId));
    timers = [];
  };

  const resetBar = () => {
    if (fill) {
      fill.style.width = '0%';
    }
    steps.forEach((step) => step.classList.remove('is-lit', 'is-current', 'is-shown'));
  };

  const hideOverlay = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('journey-locked');
    clearTimers();
    setTimeout(resetBar, 120);
  };

  const activateStep = (stepName) => {
    const selector = '.journey-step[data-step="' + stepName + '"]';
    steps.forEach((stepEl) => {
      if (stepEl.matches(selector)) {
        stepEl.classList.add('is-lit', 'is-current', 'is-shown'); // keep callouts visible once shown
      } else {
        stepEl.classList.remove('is-current');
      }
    });
  };

  const startOverlay = () => {
    clearTimers();
    resetBar();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('journey-locked');

    const syncLag = 240; // wait for the bar move to register before lighting the image

    // Step 1: Earth lights after a brief pause at the start
    timers.push(setTimeout(() => {
      if (fill) fill.style.width = '0%';
      timers.push(setTimeout(() => activateStep('earth'), syncLag));
    }, 200));

    // Step 2: jump to exoplanet then light it after the bar move starts
    timers.push(setTimeout(() => {
      if (fill) fill.style.width = '50%';
      timers.push(setTimeout(() => activateStep('exoplanet'), syncLag));
    }, 1500));

    // Step 3: jump to black hole then light it after the bar move starts
    timers.push(setTimeout(() => {
      if (fill) fill.style.width = '100%';
      timers.push(setTimeout(() => activateStep('blackhole'), syncLag));
    }, 2800));
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      hideOverlay();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      hideOverlay();
    }
  });

  return {
    start: startOverlay,
    hide: hideOverlay,
    attachButton: (button) => {
      if (!button) return;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        startOverlay();
      });
    }
  };
}
