(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.gravity-spacetime');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const canvas = root.querySelector('.spacetime-canvas');
    const ctx = canvas.getContext('2d');
    const slider = root.querySelector('.spacetime-slider');
    const scaleText = root.querySelector('[data-scale-text]');
    const forceStatus = root.querySelector('[data-force-status]');
    const distanceText = root.querySelector('[data-distance]');

    let width, height;
    let animationFrame;
    let t = 0; // Start at far left (Cosmic)

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width * window.devicePixelRatio;
      height = rect.height * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    const FOV = 400;
    const TILT = -0.65; 

    const project = (x, y, z) => {
      const cosT = Math.cos(TILT);
      const sinT = Math.sin(TILT);
      const yRot = y * cosT - z * sinT;
      const zRot = y * sinT + z * cosT;
      const dist = zRot + 800; 
      if (dist < 10) return null;
      const scale = FOV / dist;
      return { 
        x: x * scale + width / 2, 
        y: yRot * scale + height / 5 
      };
    };

    const drawGrid = () => {
      ctx.clearRect(0, 0, width, height);
      
      const targetT = parseFloat(slider.value) / 100;
      // High-precision smoothing (0.15 for snappier but smooth response)
      t += (targetT - t) * 0.15;

      // Distance Readout (rounded only for text, not for physics)
      const currentExp = 9 - (t * 24);
      distanceText.innerHTML = `10<sup>${Math.round(currentExp)}</sup> m`;

      // SMOOTH DISTORTION: Calculate directly from continuous 't' to avoid jitter
      // Threshold: starts curving when zooming out past human scale (t < 0.5)
      let distortionBase = 0;
      if (t < 0.5) {
        const factor = (0.5 - t) / 0.5;
        distortionBase = Math.pow(factor, 2.2) * 1200;
      }
      
      const softening = 160;
      const gridSize = 1600; 
      const divisions = 28; // Slightly reduced for performance, still high detail
      const step = gridSize / divisions;

      ctx.lineWidth = 1.0;

      // Batch grid line drawing for smoothness
      ctx.beginPath();
      ctx.strokeStyle = `rgba(100, 180, 255, ${0.1 + (1-t) * 0.3})`;
      
      // Horizontal Lines
      for (let i = 0; i <= divisions; i++) {
        let moved = false;
        for (let j = 0; j <= divisions; j++) {
          const x = i * step - gridSize / 2;
          const y = j * step - gridSize / 2;
          const d = Math.sqrt(x*x + y*y);
          const z = distortionBase * (1 / (Math.pow(d/softening, 1.8) + 1));
          const p = project(x, y, z);
          if (p) {
            if (!moved) { ctx.moveTo(p.x, p.y); moved = true; }
            else ctx.lineTo(p.x, p.y);
          }
        }
      }

      // Vertical Lines
      for (let j = 0; j <= divisions; j++) {
        let moved = false;
        for (let i = 0; i <= divisions; i++) {
          const x = i * step - gridSize / 2;
          const y = j * step - gridSize / 2;
          const d = Math.sqrt(x*x + y*y);
          const z = distortionBase * (1 / (Math.pow(d/softening, 1.8) + 1));
          const p = project(x, y, z);
          if (p) {
            if (!moved) { ctx.moveTo(p.x, p.y); moved = true; }
            else ctx.lineTo(p.x, p.y);
          }
        }
      }
      ctx.stroke();

      // Draw mass
      const pCenter = project(0, 0, distortionBase);
      if (pCenter) {
        const distCenter = (Math.cos(TILT) * distortionBase) + 800;
        const scale = FOV / distCenter;
        const radius = ((1 - t) * 85 + 15) * scale;
        const gradient = ctx.createRadialGradient(pCenter.x, pCenter.y, 0, pCenter.x, pCenter.y, radius);
        
        if (currentExp > 3) {
          scaleText.textContent = 'Cosmic Scale';
          forceStatus.textContent = 'Gravity Dominates';
          gradient.addColorStop(0, '#fff');
        } else if (currentExp > -9) {
          scaleText.textContent = 'Atomic Scale';
          forceStatus.textContent = 'Gravity is Zero';
          gradient.addColorStop(0, '#88f');
        } else {
          scaleText.textContent = 'Nuclear Scale';
          forceStatus.textContent = 'Gravity is Zero';
          gradient.addColorStop(0, '#f44');
        }
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pCenter.x, pCenter.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    container.addEventListener('remove', () => {
      cancelAnimationFrame(animationFrame);
    });
  };

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('gravity-spacetime', { init });
  }
})();