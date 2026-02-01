(function () {
  const init = (container) => {
    if (!container) return;
    const root = container.querySelector('.weak-decay');
    if (!root || root.dataset.init === 'true') return;
    root.dataset.init = 'true';

    // DOM Elements
    const canvas = root.querySelector('.scene-canvas');
    const ctx = canvas.getContext('2d');
    
    // Labels
    const labels = {
      w: root.querySelector('[data-label-w]'),
      e: root.querySelector('[data-label-e]'),
      v: root.querySelector('[data-label-v]'),
    };
    
    const statusText = root.querySelector('[data-status]');
    const btnTrigger = root.querySelector('.trigger-decay');
    const btnReset = root.querySelector('.reset-decay');

    // State
    let width, height;
    let animId;
    let time = 0;
    let phase = 'idle'; 

    // Entities
    const nucleon = { x: 0, y: 0, r: 45, type: 'n', shake: 0, label: 'N', color: [200, 200, 200] };
    const wBoson = { x: 0, y: 0, r: 0, active: false, opacity: 0 };
    const electron = { x: 0, y: 0, vx: 0, vy: 0, active: false };
    const neutrino = { x: 0, y: 0, vx: 0, vy: 0, active: false };

    // Resize
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width * window.devicePixelRatio;
      height = rect.height * window.devicePixelRatio;
      canvas.width = width;
      canvas.height = height;
      
      if (phase === 'idle') {
        nucleon.x = width / 2;
        nucleon.y = height / 2;
      }
    };
    window.addEventListener('resize', resize);
    resize();

    // Reset
    const reset = () => {
      phase = 'idle';
      time = 0;
      nucleon.x = width / 2;
      nucleon.y = height / 2;
      nucleon.r = 45;
      nucleon.type = 'n';
      nucleon.shake = 0;
      nucleon.label = 'N';
      nucleon.color = [200, 200, 200];

      wBoson.active = false;
      electron.active = false;
      neutrino.active = false;

      // Reset Labels
      labels.w.style.display = 'none';
      labels.e.style.display = 'none';
      labels.v.style.display = 'none';
      
      statusText.textContent = "Stable Neutron";
      btnTrigger.disabled = false;
      btnTrigger.textContent = "Trigger Decay";
      btnTrigger.classList.remove('is-triggered');
    };

    // Helper: Position DOM label over Canvas entity
    const moveLabel = (el, x, y, offsetX, offsetY) => {
      const pxX = (x / width) * 100;
      const pxY = (y / height) * 100;
      el.style.left = `calc(${pxX}% + ${offsetX}px)`;
      el.style.top = `calc(${pxY}% + ${offsetY}px)`;
    };

    const updateLabels = () => {
      if (wBoson.active) moveLabel(labels.w, wBoson.x, wBoson.y, 0, -35);
      if (electron.active) moveLabel(labels.e, electron.x, electron.y, 15, 0);
      if (neutrino.active) moveLabel(labels.v, neutrino.x, neutrino.y, 15, 0);
    };

    // Animation Loop
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.05;

      // 1. Draw W- Boson
      if (wBoson.active) {
        if (phase === 'emission') {
           wBoson.x += 0.8 * window.devicePixelRatio;
           wBoson.r = Math.min(22, wBoson.r + 0.4);
           wBoson.opacity = Math.min(1, wBoson.opacity + 0.05);
        }

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = `rgba(50, 150, 255, ${wBoson.opacity * 0.25})`;
        ctx.strokeStyle = `rgba(100, 200, 255, ${wBoson.opacity})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.arc(wBoson.x, wBoson.y, wBoson.r * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Nucleon (Flat Style)
      let nx = nucleon.x;
      let ny = nucleon.y;
      if (nucleon.shake > 0) {
        nx += (Math.random()-0.5) * nucleon.shake * window.devicePixelRatio;
        ny += (Math.random()-0.5) * nucleon.shake * window.devicePixelRatio;
      }
      
      const r = nucleon.r * window.devicePixelRatio;
      ctx.save();
      ctx.beginPath();
      
      if (nucleon.type === 'p') {
        ctx.fillStyle = '#ff3c3c';
      } else {
        ctx.fillStyle = `rgb(${nucleon.color[0]}, ${nucleon.color[1]}, ${nucleon.color[2]})`;
      }
      
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // DRAW LABEL ON NUCLEON
      ctx.save();
      ctx.font = `700 ${20 * window.devicePixelRatio}px sans-serif`;
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(nucleon.label, nx, ny);
      ctx.restore();

      // 3. Draw Particles
      if (electron.active) {
        electron.x += electron.vx;
        electron.y += electron.vy;
        
        ctx.save();
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.arc(electron.x, electron.y, 6 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (neutrino.active) {
        neutrino.x += neutrino.vx;
        neutrino.y += neutrino.vy;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(neutrino.x, neutrino.y, 5 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      
      updateLabels();
      animId = requestAnimationFrame(loop);
    };

    // Trigger Logic
    const startDecay = () => {
      if (phase !== 'idle') return;
      phase = 'unstable';
      btnTrigger.disabled = true;
      btnTrigger.textContent = "Decay Triggered";
      btnTrigger.classList.add('is-triggered');
      statusText.textContent = "Neutron Destabilizing...";

      // STEP 1: Destabilize
      let count = 0;
      const shakeInt = setInterval(() => {
        count++;
        nucleon.shake = count * 0.15;
        // Fade to Red
        nucleon.color[0] = Math.min(255, 200 + count); 
        nucleon.color[1] = Math.max(60, 200 - count*2); 
        nucleon.color[2] = Math.max(60, 200 - count*2); 
        
        if (count > 60) {
          clearInterval(shakeInt);
          emitBoson();
        }
      }, 25);
    };

    const emitBoson = () => {
      phase = 'emission';
      statusText.textContent = "Emitting W- Boson...";
      
      // Transform Nucleon -> Proton immediately
      nucleon.shake = 0;
      nucleon.type = 'p'; 
      nucleon.label = 'P';
      
      wBoson.active = true;
      wBoson.x = nucleon.x;
      wBoson.y = nucleon.y;
      wBoson.r = 5;
      wBoson.opacity = 0;
      labels.w.style.display = 'block';

      setTimeout(decayBoson, 1500);
    };

    const decayBoson = () => {
      phase = 'decay';
      statusText.textContent = "Decay Complete";
      
      wBoson.active = false;
      labels.w.style.display = 'none';
      
      labels.e.style.display = 'block';
      labels.v.style.display = 'block';
      
      const speed = 0.6 * window.devicePixelRatio; 

      electron.active = true;
      electron.x = wBoson.x;
      electron.y = wBoson.y;
      electron.vx = speed; 
      electron.vy = -speed * 0.5;

      neutrino.active = true;
      neutrino.x = wBoson.x;
      neutrino.y = wBoson.y;
      neutrino.vx = speed * 0.4; 
      neutrino.vy = speed * 0.8;
      
      phase = 'done';
    };

    btnTrigger.addEventListener('click', startDecay);
    btnReset.addEventListener('click', reset);

    reset();
    loop();

    container.addEventListener('remove', () => {
      cancelAnimationFrame(animId);
    });
  };

  if (window.ModuleWebapps && typeof window.ModuleWebapps.register === 'function') {
    window.ModuleWebapps.register('weak-decay', { init });
  }
})();