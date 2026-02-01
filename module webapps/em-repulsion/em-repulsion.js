(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.em-repulsion');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    const canvas = root.querySelector('.em-canvas');
    const ctx = canvas.getContext('2d');
    const pCountEl = root.querySelector('[data-p-count]');
    const nCountEl = root.querySelector('[data-n-count]');
    const stabilityEl = root.querySelector('[data-stability-warning]');
    const emValEl = root.querySelector('[data-em-val]');
    const strongValEl = root.querySelector('[data-strong-val]');
    const emFill = root.querySelector('.em-fill');
    const strongFill = root.querySelector('.strong-fill');

    let width, height;
    let nucleons = [];
    let animationFrame;
    
    // Interaction
    let mouseX = 0, mouseY = 0;
    let draggedNucleon = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width * window.devicePixelRatio;
      height = rect.height * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    class Nucleon {
      constructor(type) {
        this.type = type; 
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 20;
        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12 * window.devicePixelRatio;
        this.isDragged = false;
      }

      update(allNucleons, stabilityFactor) {
        if (this.isDragged) {
          // Drag logic: follow mouse
          this.vx = (mouseX - this.x) * 0.3;
          this.vy = (mouseY - this.y) * 0.3;
        } else {
          // Boundary Confinement (Bounce off walls)
          const r = this.radius;
          const bounce = -0.5;
          
          if (this.x < r) { this.x = r; this.vx *= bounce; }
          if (this.x > width - r) { this.x = width - r; this.vx *= bounce; }
          if (this.y < r) { this.y = r; this.vy *= bounce; }
          if (this.y > height - r) { this.y = height - r; this.vy *= bounce; }

          allNucleons.forEach(other => {
            if (other === this) return;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq) || 1;
            const dirX = dx / dist;
            const dirY = dy / dist;

            // 2. Strong Force (Short range)
            const range = 42 * window.devicePixelRatio;
            if (dist < range) {
              const strongStr = 3.2; // Decreased to make 2-Proton system unstable
              this.vx += dirX * strongStr;
              this.vy += dirY * strongStr;
            }

            // 3. Hard sphere repulsion
            const minDist = this.radius * 2;
            if (dist < minDist) {
              const push = (minDist - dist) * 0.8;
              this.vx -= dirX * push;
              this.vy -= dirY * push;
            }

            // 4. EM Repulsion
            if (this.type === 'p' && other.type === 'p') {
              const emStr = 0.9; // Increased to ensure repulsion beats strong force for pp pair
              const effectiveDist = Math.max(dist, 15); 
              this.vx -= dirX * (emStr * 200 / effectiveDist);
              this.vy -= dirY * (emStr * 200 / effectiveDist);
            }
          });

          if (stabilityFactor > 0.8) {
            const jitter = (stabilityFactor - 0.8) * 10;
            this.vx += (Math.random() - 0.5) * jitter;
            this.vy += (Math.random() - 0.5) * jitter;
          }
        }

        // Cap maximum velocity to prevent explosions
        const MAX_SPEED = 8.0;
        const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (speed > MAX_SPEED) {
          const scale = MAX_SPEED / speed;
          this.vx *= scale;
          this.vy *= scale;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.6; // High Friction (was 0.7)
        this.vy *= 0.6;
      }

      draw(ctx) {
        ctx.beginPath();
        if (this.type === 'p') {
          ctx.fillStyle = '#ff3c3c'; // Flat Red
        } else {
          ctx.fillStyle = '#bbbbbb'; // Flat Grey
        }
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add black labels
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${10 * window.devicePixelRatio}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.toUpperCase(), this.x, this.y);
      }
    }

    const updateSimulation = () => {
      ctx.clearRect(0, 0, width, height);
      
      const protons = nucleons.filter(n => n.type === 'p');
      const pCount = protons.length;
      const nCount = nucleons.length - pCount;

      const emPressure = pCount > 1 ? (pCount * (pCount - 1)) / 120 : 0;
      const strongBinding = nucleons.length / 50;
      const stabilityFactor = emPressure / (strongBinding || 1);

      if (pCount > 1) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 60, 60, ${Math.min(0.4, emPressure * 0.1)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < protons.length; i++) {
          for (let j = i + 1; j < protons.length; j++) {
            ctx.moveTo(protons[i].x, protons[i].y);
            ctx.lineTo(protons[j].x, protons[j].y);
          }
        }
        ctx.stroke();
      }

      nucleons.forEach(n => {
        n.update(nucleons, stabilityFactor);
        n.draw(ctx);
      });

      pCountEl.textContent = pCount;
      nCountEl.textContent = nCount;
      const emPercent = Math.min(100, Math.round(emPressure * 100));
      const strongPercent = Math.min(100, Math.round(strongBinding * 100));
      emValEl.textContent = `${emPercent}%`;
      strongValEl.textContent = `${strongPercent}%`;
      emFill.style.width = `${emPercent}%`;
      strongFill.style.width = `${strongPercent}%`;

      if (stabilityFactor > 1.1) {
        stabilityEl.textContent = 'Highly Unstable';
        stabilityEl.className = 'stability-warning is-unstable';
      } else if (stabilityFactor > 0.85) {
        stabilityEl.textContent = 'Unstable';
        stabilityEl.className = 'stability-warning is-unstable';
      } else {
        stabilityEl.textContent = 'Stable';
        stabilityEl.className = 'stability-warning';
      }

      animationFrame = requestAnimationFrame(updateSimulation);
    };

    // Interaction Handlers
    const updateMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const cy = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      mouseX = (cx - rect.left) * (canvas.width / rect.width);
      mouseY = (cy - rect.top) * (canvas.height / rect.height);
    };

    const handleDown = (e) => {
      updateMouse(e);
      e.preventDefault();
      
      // Grab Closest logic
      let minDist = Infinity;
      let closest = null;
      
      nucleons.forEach(n => {
        const d = Math.hypot(n.x - mouseX, n.y - mouseY);
        if (d < minDist) {
          minDist = d;
          closest = n;
        }
      });
      
      if (closest) {
        // Generous grab radius or just grab the absolute closest?
        // Let's say if within 100px (generous)
        if (minDist < 100 * window.devicePixelRatio) {
          draggedNucleon = closest;
          closest.isDragged = true;
          canvas.style.cursor = 'grabbing';
        }
      }
    };

    const handleUp = () => {
      if (draggedNucleon) {
        draggedNucleon.isDragged = false;
        draggedNucleon = null;
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('touchstart', handleDown, {passive: false});
    
    window.addEventListener('mousemove', (e) => { if(draggedNucleon) updateMouse(e); });
    window.addEventListener('touchmove', (e) => { if(draggedNucleon) updateMouse(e); }, {passive: false});
    
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    root.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (nucleons.length < 60) {
          nucleons.push(new Nucleon(btn.dataset.add));
        }
      });
    });

    root.querySelector('.reset-btn').addEventListener('click', () => {
      nucleons = [];
    });

    for(let i=0; i<2; i++) nucleons.push(new Nucleon('p'));
    for(let i=0; i<2; i++) nucleons.push(new Nucleon('n'));

    updateSimulation();

    container.addEventListener('remove', () => {
      cancelAnimationFrame(animationFrame);
    });
  };

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('em-repulsion', { init });
  }
})();
