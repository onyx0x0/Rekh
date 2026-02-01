(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.strong-force');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const canvas = root.querySelector('.strong-canvas');
    const ctx = canvas.getContext('2d');
    const statusEl = root.querySelector('[data-force-status]');
    const distEl = root.querySelector('[data-distance]');
    const resetBtn = root.querySelector('.reset-btn');

    let width, height;
    let animationFrame;
    
    const R = 25; 
    const PIXELS_PER_FM = 40; 
    const FORCE_RANGE = 2.5 * PIXELS_PER_FM; 
    const BREAK_LIMIT = 3.5 * PIXELS_PER_FM; 

    const proton = { x: 0, y: 0, type: 'p' };
    const neutron = { x: 0, y: 0, vx: 0, vy: 0, type: 'n', isDragged: false };

    let isBound = false;
    let mouseX = 0, mouseY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return; // Wait for element to be visible

      width = rect.width * window.devicePixelRatio;
      height = rect.height * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
      
      proton.x = width / 2;
      proton.y = height / 2;
      
      if (!neutron.x) resetPositions();
    };

    const resetPositions = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        width = rect.width * window.devicePixelRatio;
        height = rect.height * window.devicePixelRatio;
        proton.x = width / 2;
        proton.y = height / 2;
      }
      neutron.x = proton.x + 150 * window.devicePixelRatio; 
      neutron.y = proton.y;
      neutron.vx = 0;
      neutron.vy = 0;
      isBound = false;
    };

    window.addEventListener('resize', resize);
    
    // Crucial: check for size until loaded (fixes scrollytelling init bug)
    const initCheck = setInterval(() => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) {
        resize();
        clearInterval(initCheck);
      }
    }, 100);

    const update = () => {
      ctx.clearRect(0, 0, width, height);
      if (!width) {
        animationFrame = requestAnimationFrame(update);
        return;
      }
      
      const dx = neutron.x - proton.x;
      const dy = neutron.y - proton.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const distFm = (dist / (PIXELS_PER_FM * window.devicePixelRatio)).toFixed(2);
      
      // Handle snap logic outside of drag
      if (!isBound && dist < FORCE_RANGE * window.devicePixelRatio) isBound = true;
      if (isBound && dist > BREAK_LIMIT * window.devicePixelRatio) isBound = false;

      if (neutron.isDragged) {
        neutron.vx = (mouseX - neutron.x) * 0.4;
        neutron.vy = (mouseY - neutron.y) * 0.4;
        neutron.x += neutron.vx;
        neutron.y += neutron.vy;
      } else {
        if (isBound) {
          const targetDist = R * 2.1 * window.devicePixelRatio;
          const pull = (dist - targetDist) * 0.2;
          neutron.vx -= (dx / dist) * pull;
          neutron.vy -= (dy / dist) * pull;
          neutron.vx *= 0.8;
          neutron.vy *= 0.8;
        } else {
          neutron.vx *= 0.95;
          neutron.vy *= 0.95;
        }
        neutron.x += neutron.vx;
        neutron.y += neutron.vy;
      }

      // Render Tether
      if (isBound) {
        const limit = BREAK_LIMIT * window.devicePixelRatio;
        const rad = R * window.devicePixelRatio;
        const tension = Math.max(0, (dist - rad*2) / (limit - rad*2));
        const color = tension > 0.8 ? '#ffaa00' : '#0088ff';
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = (8 - tension * 4) * window.devicePixelRatio;
        ctx.moveTo(proton.x, proton.y);
        ctx.lineTo(neutron.x, neutron.y);
        ctx.stroke();
      }

      distEl.innerHTML = `${distFm}`;

      // Update status text
      if (isBound) {
        const limit = BREAK_LIMIT * window.devicePixelRatio;
        const rad = R * window.devicePixelRatio;
        const tension = Math.max(0, (dist - rad*2) / (limit - rad*2));
        
        if (tension > 0.8) {
          statusEl.textContent = 'Straining';
          statusEl.style.color = '#ffaa00';
        } else {
          statusEl.textContent = 'Bonded';
          statusEl.style.color = '#00ff88';
        }
      } else {
        statusEl.textContent = 'Out of Range';
        statusEl.style.color = 'rgba(255, 255, 255, 0.5)';
      }

      // Draw Nucleons (Flat Style)
      [proton, neutron].forEach(n => {
        const rad = R * window.devicePixelRatio;
        ctx.beginPath();
        ctx.fillStyle = n.type === 'p' ? '#ff3c3c' : '#bbbbbb';
        ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${16 * window.devicePixelRatio}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.type.toUpperCase(), n.x, n.y);
      });

      animationFrame = requestAnimationFrame(update);
    };

    const updateMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const cy = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      mouseX = (cx - rect.left) * (canvas.width / rect.width);
      mouseY = (cy - rect.top) * (canvas.height / rect.height);
    };

    canvas.addEventListener('mousedown', (e) => { e.preventDefault(); updateMouse(e); neutron.isDragged = true; });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); updateMouse(e); neutron.isDragged = true; }, {passive: false});
    window.addEventListener('mousemove', (e) => { if (neutron.isDragged) updateMouse(e); });
    window.addEventListener('mouseup', () => { neutron.isDragged = false; });
    window.addEventListener('touchend', () => { neutron.isDragged = false; });

    resetBtn.addEventListener('click', resetPositions);
    update();

    container.addEventListener('remove', () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(initCheck);
    });
  };

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('strong-force', { init });
  }
})();