/**
 * RELATIVISTIC FLIGHT SIMULATOR - OPTIMIZED & FIXED
 */

const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const spectralCanvas = document.getElementById('spectralCanvas');
const spectralCtx = spectralCanvas ? spectralCanvas.getContext('2d') : null;
const SPECTRAL_SAMPLES = 360;
const spectralEnergies = new Float32Array(SPECTRAL_SAMPLES + 1);
const spectralSmooth = new Float32Array(SPECTRAL_SAMPLES + 1);
const spectralKernel = new Float32Array([0.15, 0.25, 0.2, 0.25, 0.15]);

// Spectral mapping constants (wavelengths in nanometers)
const LAMBDA_MIN_NM = 1e-3;   // gamma side
const LAMBDA_MAX_NM = 1e10;   // radio side (~10 m)
const LOG_LAMBDA_MIN = Math.log10(LAMBDA_MIN_NM);
const LOG_LAMBDA_MAX = Math.log10(LAMBDA_MAX_NM);

// Configuration
const STAR_COUNT = 8000;
const UNIVERSE_WIDTH = 10000; 
const UNIVERSE_DEPTH = 50000; 
const FOV_FACTOR = 800; 
const EXPOSURE = 3.5; 
const NEAR_BOOST_RADIUS = 11000; 

// DOM Element Cache
// We use a getter or deferred init to ensure elements exist if script runs early
let UI = {};

const TELE_DESCRIPTIONS = {
    "Gamma": "Lorentz factor: governs time dilation and length contraction.",
    "Beta (v/c)": "Velocity expressed as a fraction of light speed (v/c).",
    "Kinetic Energy": "Relativistic kinetic energy of the craft.",
    "Rapidity": "Additive measure of velocity in relativity; sums linearly.",
    "Rel. Momentum": "Relativistic momentum γmv.",
    "Ship vs Ext.": "Time dilation ratio between ship time and external frame.",
    "Earth Offset": "Elapsed time difference relative to Earth frame.",
    "Univ. Age Rate": "How fast the universe ages compared to you.",
    "Aging Diff": "Difference in aging between you and a stationary observer.",
    "Dist. Distortion": "Perceived distance contraction along travel direction.",
    "90% Cone": "Angular width containing 90% of aberrated photon flux.",
    "Fwd Flux %": "Percentage of light flux concentrated forward.",
    "Star Conc.": "Apparent star concentration from aberration/beaming.",
    "Bright Shift": "Forward brightness multiplier (headlight effect).",
    "Color Shift": "Observed wavelength shift relative to rest.",
    "Beaming Fac": "Relativistic beaming factor toward the nose.",
    "Rear Redshift": "Redshift measured directly behind the craft.",
    "Doppler F/S/R": "Doppler factors forward / side / rear.",
    "Lum Error": "Error margin in luminosity estimation.",
    "Dust Impact": "Kinetic energy from dust at current speed.",
    "Rad Dose": "Radiation dose per hour from particle flux.",
    "Hull Heat": "Hull heating from collisions and radiation.",
    "Micro Flux": "Micrometeor flux encountered per second.",
    "Shield Stress": "Shield load from particles and photons.",
    "Fwd Photon": "Forward photon environment (visible/IR/UV).",
    "Reality Gap": "Delay between events and perception due to light speed.",
    "Lookback": "How far back in time distant objects are seen.",
    "Max Range": "Maximum visible range as a fraction of baseline.",
    "Horizon Exp": "Apparent expansion/compression of the horizon."
};

// State
let width, height, cx, cy;
let currentBeta = 0;
let targetBeta = 0;
let elapsedTimeShip = 0;
let elapsedTimeEarth = 0;
const stars = [];
let spectralGradCache = null;
let frameCount = 0; 

const settings = {
    aberration: true,
    doppler: true,
    beaming: true
};
let spectralView = 'forward';

// Utility helpers
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const gaussian = (x, mu, sigma, amp) => {
    const d = (x - mu) / sigma;
    return amp * Math.exp(-0.5 * d * d);
};
function formatWavelength(nm) {
    if (nm >= 1e9) return (nm / 1e9).toFixed(1) + ' m';
    if (nm >= 1e6) return (nm / 1e6).toFixed(1) + ' mm';
    if (nm >= 1e3) return (nm / 1e3).toFixed(1) + ' um';
    if (nm >= 1) return nm.toFixed(0) + ' nm';
    return (nm * 1e3).toFixed(1) + ' pm';
}
function wavelengthToX(lambdaNm, width) {
    const clamped = clamp(lambdaNm, LAMBDA_MIN_NM, LAMBDA_MAX_NM);
    const t = (Math.log10(clamped) - LOG_LAMBDA_MIN) / (LOG_LAMBDA_MAX - LOG_LAMBDA_MIN);
    return width * (1 - t);
}
function tToWavelength(t) {
    const logVal = LOG_LAMBDA_MIN + (1 - t) * (LOG_LAMBDA_MAX - LOG_LAMBDA_MIN);
    return Math.pow(10, logVal);
}

// Telemetry modal state
let teleModalOverlay = null;
let teleModalTitle = null;
let teleModalValue = null;
let teleModalDesc = null;
let teleModalSource = null;

class Star {
    constructor() {
        this.reset(true);
    }

    reset(randomZ = false) {
        const angle = Math.random() * Math.PI * 2;
        const r = UNIVERSE_WIDTH * Math.sqrt(Math.random()); 
        
        this.x = r * Math.cos(angle);
        this.y = r * Math.sin(angle);

        if (randomZ) {
            this.z = (Math.random() * UNIVERSE_DEPTH);
        } else {
            this.z = UNIVERSE_DEPTH;
        }

        this.baseSize = Math.random() * 0.4 + 0.6;
        this.luminosity = Math.random() * 0.8 + 0.2;
        this.proximityBoost = 0.3 + Math.random() * 100;
        
        const rnd = Math.random();
        if (rnd > 0.9) { this.hue = 210; this.sat = 60; } 
        else if (rnd > 0.6) { this.hue = 45; this.sat = 90; } 
        else if (rnd > 0.4) { this.hue = 30; this.sat = 100; } 
        else { this.hue = 0; this.sat = 80; }
    }
}

function init() {
    // 1. Cache UI Elements
    UI = {
        gamma: document.getElementById('val-gamma'),
        beta: document.getElementById('val-beta'),
        ke: document.getElementById('val-ke'),
        rapidity: document.getElementById('val-rapidity'),
        mom: document.getElementById('val-mom'),
        dil: document.getElementById('val-dil'),
        offset: document.getElementById('val-offset'),
        age: document.getElementById('val-age'),
        agediff: document.getElementById('val-agediff'),
        dist: document.getElementById('val-dist'),
        cone: document.getElementById('val-cone'),
        flux: document.getElementById('val-flux'),
        conc: document.getElementById('val-conc'),
        bright: document.getElementById('val-bright'),
        color: document.getElementById('val-color'),
        beam: document.getElementById('val-beam'),
        rear: document.getElementById('val-rear'),
        dop: document.getElementById('val-dop'),
        lum: document.getElementById('val-lum'),
        dust: document.getElementById('val-dust'),
        rad: document.getElementById('val-rad'),
        heat: document.getElementById('val-heat'),
        micro: document.getElementById('val-micro'),
        shield: document.getElementById('val-shield'),
        phot: document.getElementById('val-phot'),
        gap: document.getElementById('val-gap'),
        look: document.getElementById('val-look'),
        range: document.getElementById('val-range'),
        hor: document.getElementById('val-hor'),
        specWindow: document.getElementById('specWindow'),
        specDoppler: document.getElementById('specDoppler'),
        specCmb: document.getElementById('specCmb'),
        specXray: document.getElementById('specXray')
    };

    // 2. Setup
    resize();
    window.addEventListener('resize', resize);
    
    // 3. Populate Stars
    if (stars.length === 0) {
        for (let i = 0; i < STAR_COUNT; i++) stars.push(new Star());
    }

    // 4. Setup Modal
    setupTelemetryModal();

    // 5. Start Loop
    loop();
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    cx = width / 2;
    cy = height / 2;
    resizeSpectralCanvas();
}

window.toggleEffect = function(key) {
    settings[key] = !settings[key];
    const btn = document.getElementById(
        key === 'aberration' ? 'btnAberration' : 
        key === 'doppler' ? 'btnDoppler' : 'btnBeaming'
    );
    if(settings[key]) btn.classList.add('active');
    else btn.classList.remove('active');
}

window.toggleTelemetry = function(side) {
    const el = document.getElementById(side === 'left' ? 'teleIslandLeft' : 'teleIslandRight');
    el.classList.toggle('collapsed');
}

window.toggleSpectral = function() {
    const el = document.getElementById('spectralIsland');
    if (!el) return;
    el.classList.toggle('collapsed');
}

window.setSpectralView = function(direction) {
    spectralView = direction;
    ['forward','side','rear'].forEach(dir => {
        const btn = document.getElementById(dir === 'forward' ? 'viewForward' : dir === 'side' ? 'viewSide' : 'viewRear');
        if (!btn) return;
        if (dir === direction) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function setupTelemetryModal() {
    if (document.getElementById('telemetryModalOverlay')) return;

    teleModalOverlay = document.createElement('div');
    teleModalOverlay.className = 'modal-overlay';
    teleModalOverlay.id = 'telemetryModalOverlay';
    teleModalOverlay.innerHTML = `
        <div class="modal" id="telemetryModal">
            <button class="modal-close" id="telemetryModalClose">×</button>
            <div class="modal-body">
                <div class="modal-title" id="modalTitle"></div>
                <div class="modal-value" id="modalValue"></div>
                <div class="modal-description" id="modalDescription"></div>
            </div>
        </div>`;
    document.body.appendChild(teleModalOverlay);

    const modal = teleModalOverlay.querySelector('#telemetryModal');
    const closeBtn = teleModalOverlay.querySelector('#telemetryModalClose');
    teleModalTitle = teleModalOverlay.querySelector('#modalTitle');
    teleModalValue = teleModalOverlay.querySelector('#modalValue');
    teleModalDesc = teleModalOverlay.querySelector('#modalDescription');

    const cells = document.querySelectorAll('.tele-cell');

    function closeModal() { 
        teleModalOverlay.classList.remove('open'); 
        teleModalSource = null;
    }
    function refreshModal() {
        if (!teleModalSource) return;
        const label = (teleModalSource.querySelector('.label')?.textContent || '').trim();
        const value = (teleModalSource.querySelector('.value-box')?.textContent || '').trim();
        teleModalTitle.textContent = label;
        teleModalValue.textContent = value;
        const descAttr = teleModalSource.dataset.description;
        teleModalDesc.textContent = descAttr || TELE_DESCRIPTIONS[label] || '';
    }
    function openModal(cell) {
        teleModalSource = cell;
        refreshModal();
        teleModalOverlay.classList.add('open');
    }

    cells.forEach(cell => {
        cell.addEventListener('click', () => openModal(cell));
    });

    closeBtn.addEventListener('click', closeModal);
    teleModalOverlay.addEventListener('click', (e) => {
        if (e.target === teleModalOverlay) closeModal();
    });
    modal.addEventListener('click', (e) => e.stopPropagation());

    window.__refreshTelemetryModal = refreshModal;
}

// --- Spectral Rendering ---

function resizeSpectralCanvas() {
    if (!spectralCanvas || !spectralCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = spectralCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    spectralCanvas.width = rect.width * dpr;
    spectralCanvas.height = rect.height * dpr;
    spectralCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spectralGradCache = null;
}

function describeBand(nm) {
    if (nm < 0.1) return 'Gamma';
    if (nm < 10) return 'X-ray';
    if (nm < 400) return 'UV';
    if (nm < 700) return 'Visible';
    if (nm < 1e6) return 'IR';
    if (nm < 1e9) return 'Microwave';
    return 'Radio';
}

function restSpectrum(lambdaNm) {
    const logL = Math.log10(Math.max(lambdaNm, LAMBDA_MIN_NM));
    let e = 0;
    e += gaussian(logL, Math.log10(550), 0.10, 1.0);
    e += gaussian(logL, Math.log10(200), 0.12, 0.35);
    e += gaussian(logL, Math.log10(1500), 0.14, 0.45);
    e += gaussian(logL, Math.log10(1e6), 0.28, 0.55);
    e += gaussian(logL, Math.log10(1e7), 0.40, 0.25);
    e += gaussian(logL, Math.log10(1), 0.18, 0.08);
    return e;
}

function updateSpectralReadouts(direction, dopView, lambdaView, cmbLambda, xrayLambda, xrayIntensity) {
    const dirLabel = direction === 'forward' ? 'Forward' : direction === 'side' ? 'Side' : 'Rear';

    if (UI.specWindow) UI.specWindow.textContent = `${formatWavelength(lambdaView)} (${describeBand(lambdaView)})`;
    if (UI.specDoppler) UI.specDoppler.textContent = `${dopView.toFixed(2)}x ${dirLabel}`;
    if (UI.specCmb) UI.specCmb.textContent = `${formatWavelength(cmbLambda)} (${describeBand(cmbLambda)})`;

    if (UI.specXray) {
        let state = 'Dormant';
        if (xrayIntensity > 0.3) state = `Active @ ${formatWavelength(xrayLambda)}`;
        if (xrayIntensity > 1.2) state = `Spiking @ ${formatWavelength(xrayLambda)}`;
        const cmbState = describeBand(cmbLambda);
        UI.specXray.textContent = `${state} | CMB ${cmbState}`;
    }
}

function drawSpectral(beta, gamma) {
    if (!spectralCanvas || !spectralCtx) return;

    const width = spectralCanvas.clientWidth;
    const height = spectralCanvas.clientHeight;
    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    spectralCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spectralCtx.clearRect(0, 0, width, height);

    if (!spectralGradCache || spectralGradCache.w !== width || spectralGradCache.h !== height) {
        const baseGrad = spectralCtx.createLinearGradient(0, height * 0.65, width, height * 0.65);
        baseGrad.addColorStop(0.00, '#2f1a40');
        baseGrad.addColorStop(0.12, '#27305c');
        baseGrad.addColorStop(0.23, '#7a1622');
        baseGrad.addColorStop(0.33, '#c81e1e');
        baseGrad.addColorStop(0.42, '#ff9900');
        baseGrad.addColorStop(0.48, '#ffd400');
        baseGrad.addColorStop(0.55, '#2dc24f');
        baseGrad.addColorStop(0.63, '#00b7ff');
        baseGrad.addColorStop(0.70, '#5b1cd3');
        baseGrad.addColorStop(0.78, '#8a5bf3');
        baseGrad.addColorStop(0.88, '#6ad6ff');
        baseGrad.addColorStop(1.00, '#f5f7ff');
        spectralGradCache = { grad: baseGrad, w: width, h: height };
    }
    spectralCtx.fillStyle = spectralGradCache.grad;
    spectralCtx.fillRect(0, 0, width, height);

    spectralCtx.save();
    spectralCtx.globalAlpha = 0.14;
    spectralCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i <= 6; i++) {
        const x = (i / 6) * width;
        spectralCtx.beginPath();
        spectralCtx.moveTo(x, 0);
        spectralCtx.lineTo(x, height);
        spectralCtx.stroke();
    }
    spectralCtx.restore();

    const dopFwd = Math.sqrt((1 + beta) / (1 - beta));
    const dopRear = Math.sqrt((1 - beta) / (1 + beta));
    const dopSide = 1 / gamma;
    let dopView = dopFwd;
    if (spectralView === 'rear') dopView = dopRear;
    else if (spectralView === 'side') dopView = dopSide;

    for (let i = 0; i <= SPECTRAL_SAMPLES; i++) {
        const t = i / SPECTRAL_SAMPLES;
        const lambda = tToWavelength(t);
        const lambdaRest = lambda * dopView;
        const base = restSpectrum(lambdaRest);
        const e = base * Math.pow(dopView, 5);
        spectralEnergies[i] = e;
    }

    const kHalf = Math.floor(spectralKernel.length / 2);
    for (let i = 0; i < spectralEnergies.length; i++) {
        let acc = 0;
        let w = 0;
        for (let k = -kHalf; k <= kHalf; k++) {
            const idx = clamp(i + k, 0, spectralEnergies.length - 1);
            const weight = spectralKernel[k + kHalf];
            acc += spectralEnergies[idx] * weight;
            w += weight;
        }
        spectralSmooth[i] = acc / w;
    }

    let maxE = 1;
    for (let i = 0; i < spectralSmooth.length; i++) {
        if (spectralSmooth[i] > maxE) maxE = spectralSmooth[i];
    }
    const bandHeight = height * 0.75;

    spectralCtx.beginPath();
    spectralCtx.moveTo(0, height);
    for (let i = 0; i < spectralSmooth.length; i++) {
        const x = (i / (spectralSmooth.length - 1)) * width;
        const y = height - (spectralSmooth[i] / maxE) * bandHeight - 4;
        spectralCtx.lineTo(x, y);
    }
    spectralCtx.lineTo(width, height);
    spectralCtx.closePath();
    spectralCtx.fillStyle = 'rgba(255,255,255,0.12)';
    spectralCtx.fill();

    const lineGrad = spectralCtx.createLinearGradient(0, 0, width, 0);
    lineGrad.addColorStop(0, 'rgba(255,120,74,0.7)');
    lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.9)');
    lineGrad.addColorStop(1, 'rgba(74,158,255,0.9)');
    spectralCtx.strokeStyle = lineGrad;
    spectralCtx.lineWidth = 2.4;
    spectralCtx.lineJoin = 'round';
    spectralCtx.lineCap = 'round';
    spectralCtx.stroke();

    const lambdaVisible = 550 / dopView;
    const lambdaCmbPeak = 1e6 / dopView;
    const cmbLambda = lambdaCmbPeak;
    const xrayLambda = 1 / dopView;

    const drawLineMarker = (lambda, color, widthPx = 2) => {
        const x = wavelengthToX(lambda, width);
        spectralCtx.strokeStyle = color;
        spectralCtx.lineWidth = widthPx;
        spectralCtx.beginPath();
        spectralCtx.moveTo(x, 0);
        spectralCtx.lineTo(x, height);
        spectralCtx.stroke();
    };

    drawLineMarker(lambdaVisible, 'rgba(74,158,255,0.9)', 2.5);
    drawLineMarker(lambdaCmbPeak, 'rgba(255,120,74,0.9)', 1.6);

    const xrayIntensity = restSpectrum(1) * Math.pow(dopView, 5);
    
    if (frameCount % 6 === 0) {
        updateSpectralReadouts(spectralView, dopView, lambdaVisible, cmbLambda, xrayLambda, xrayIntensity);
    }
}

function getAberratedCosTheta(cosTheta, beta) {
    return (cosTheta + beta) / (1.0 + beta * cosTheta);
}

function getDopplerFactor(beta, gamma, cosTheta) {
    return 1.0 / (gamma * (1.0 - beta * cosTheta));
}

function toneMap(intensity) {
    return intensity / (intensity + EXPOSURE);
}

function updateTelemetry(beta, gamma) {
    if (Math.abs(beta) < 0.00001) beta = 0;
    
    const rapidity = Math.atanh(beta);
    const ke = (gamma - 1) * 931.5;
    const momentum = gamma * beta;
    const agingRate = 1 / gamma; 
    
    elapsedTimeShip += 0.016; 
    elapsedTimeEarth += 0.016 * gamma;
    
    // Performance: Throttle DOM updates to once every 6 frames
    if (frameCount % 6 !== 0) return;

    const offset = elapsedTimeEarth - elapsedTimeShip;

    if (UI.gamma) UI.gamma.textContent = gamma.toFixed(2);
    if (UI.beta) UI.beta.textContent = beta.toFixed(4) + 'c';
    if (UI.ke) UI.ke.textContent = ke < 1000 ? ke.toFixed(0) + ' MJ' : (ke/1000).toFixed(2) + ' TJ';
    if (UI.rapidity) UI.rapidity.textContent = rapidity.toFixed(2);
    if (UI.mom) UI.mom.textContent = momentum.toFixed(2);

    if (UI.dil) UI.dil.textContent = `1 : ${gamma.toFixed(1)}`;
    if (UI.offset) UI.offset.textContent = offset.toFixed(2) + 's';
    if (UI.age) UI.age.textContent = agingRate.toFixed(3) + 'x';
    
    const dopFwd = Math.sqrt((1+beta)/(1-beta));
    const dopRear = Math.sqrt((1-beta)/(1+beta));
    if (UI.agediff) UI.agediff.textContent = (dopFwd/dopRear).toFixed(1);

    const distDistortion = (1.0/gamma) * 100;
    const coneAngle = 180 * (1 - beta); 
    const fwdFlux = 50 + (beta * 49.9);
    const concentration = Math.pow(gamma, 2);

    if (UI.dist) UI.dist.textContent = distDistortion.toFixed(1) + '%';
    if (UI.cone) UI.cone.textContent = coneAngle.toFixed(1) + '°';
    if (UI.flux) UI.flux.textContent = fwdFlux.toFixed(1) + '%';
    if (UI.conc) UI.conc.textContent = concentration.toFixed(1) + 'x';

    const beamFactor = Math.pow(dopFwd, 3);
    const zRear = (1+beta)/Math.sqrt(1-beta*beta) - 1;

    if (UI.bright) UI.bright.textContent = beamFactor.toExponential(1);
    if (UI.color) UI.color.textContent = (beta * -300).toFixed(0) + 'nm';
    if (UI.beam) UI.beam.textContent = beamFactor.toFixed(1);
    if (UI.rear) UI.rear.textContent = zRear.toFixed(2);
    if (UI.dop) UI.dop.textContent = `${dopFwd.toFixed(1)}/${(1/gamma).toFixed(1)}/${dopRear.toFixed(1)}`;
    if (UI.lum) UI.lum.textContent = ((beamFactor-1)*100).toFixed(0) + '%';

    const dustE = (gamma - 1) * 1e9;
    const radDose = beta > 0 ? Math.pow(dopFwd, 2) * 0.5 : 0;
    const hullHeat = 3 + (beta * gamma * 3000);
    const flux = beta * 3e4;
    const stress = Math.min(100, (Math.log10(gamma)*40) + (beta*10));
    let pType = "Vis";
    if(dopFwd > 1000) pType = "Gamma";
    else if(dopFwd > 100) pType = "X-Ray";
    else if(dopFwd > 10) pType = "UV";

    if (UI.dust) UI.dust.textContent = dustE.toExponential(1) + ' J';
    if (UI.rad) UI.rad.textContent = radDose.toFixed(1) + ' Sv';
    if (UI.heat) UI.heat.textContent = hullHeat.toFixed(0) + ' K';
    if (UI.micro) UI.micro.textContent = flux.toFixed(0);
    if (UI.shield) UI.shield.textContent = stress.toFixed(0) + '%';
    if (UI.phot) UI.phot.textContent = pType;

    const gap = gamma * beta * 100;
    const look = 100 * gamma; 
    const range = 100 * dopFwd;
    
    if (UI.gap) UI.gap.textContent = gap.toFixed(0) + ' ms';
    if (UI.look) UI.look.textContent = look.toFixed(0) + ' y';
    if (UI.range) UI.range.textContent = range.toFixed(0) + '%';
    if (UI.hor) UI.hor.textContent = (1/dopFwd).toFixed(3) + 'x';

    if (teleModalOverlay && teleModalOverlay.classList.contains('open') && typeof window.__refreshTelemetryModal === 'function') {
        window.__refreshTelemetryModal();
    }
}

function loop() {
    requestAnimationFrame(loop);
    frameCount++;

    // 1. Controls
    const sliderVal = parseInt(speedSlider.value, 10) / 1000;
    const maxBeta = 0.9999; 
    targetBeta = sliderVal * maxBeta;
    currentBeta += (targetBeta - currentBeta) * 0.005; 
    
    const beta = currentBeta;
    const gamma = 1.0 / Math.sqrt(1.0 - (beta * beta));

    if (frameCount % 6 === 0) {
        speedDisplay.textContent = beta.toFixed(5) + "c";
    }

    // UPDATE TELEMETRY
    updateTelemetry(beta, gamma);
    drawSpectral(beta, gamma);

    // 2. Clear Screen
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // 3. CMB Glare
    if (settings.doppler && beta > 0.1) {
        const opacity = Math.min(1.0, Math.log10(gamma) * 0.6);
        const radius = (Math.min(width, height) * 0.6) / Math.pow(gamma, 0.4); 
        
        if (opacity > 0.01) {
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 3);
            ctx.globalCompositeOperation = 'lighter';
            grad.addColorStop(0, `rgba(200, 230, 255, ${opacity})`);
            grad.addColorStop(0.5, `rgba(50, 100, 200, ${opacity * 0.4})`);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // 4. Render Stars
    ctx.globalCompositeOperation = 'lighter';

    const velocity = (beta > 0.001 ? beta : 0) * 30.0;
    
    for (const star of stars) {
        
        star.z -= velocity;

        if (star.z < -500) {
            star.reset(false);
        }

        const r = Math.sqrt(star.x*star.x + star.y*star.y + star.z*star.z);
        const cosTheta = star.z / r;

        let viewCosTheta = cosTheta;
        if (settings.aberration && beta > 0.0001) {
            viewCosTheta = getAberratedCosTheta(cosTheta, beta);
        }

        if (viewCosTheta <= 0.0001) continue;

        const viewTheta = Math.acos(viewCosTheta);
        const screenR = Math.tan(viewTheta) * FOV_FACTOR;

        const maxR = Math.max(width, height);
        if (screenR > maxR * 1.5) continue;

        const phi = Math.atan2(star.y, star.x);
        const sx = cx + Math.cos(phi) * screenR;
        const sy = cy + Math.sin(phi) * screenR;

        // Intensity & Color
        let doppler = 1.0;
        if (settings.doppler && beta > 0.0001) {
            doppler = getDopplerFactor(beta, gamma, cosTheta);
        }

        let intensity = star.luminosity * (2000 / (r + 1)); 
        if (settings.beaming) {
            intensity *= Math.pow(doppler, 3.5);
        }

        const depthZ = Math.max(0, star.z);
        if (depthZ < NEAR_BOOST_RADIUS) {
            const t = 1 - Math.min(1, depthZ / NEAR_BOOST_RADIUS);
            const depthFactor = t * t;
            const radial = Math.hypot(star.x, star.y);
            const radialFactor = Math.max(0, 1 - (radial / (UNIVERSE_WIDTH * 1.0)));
            const proximity = depthFactor * (0.5 + 0.5 * radialFactor);
            intensity *= 1 + proximity * 0.4 * star.proximityBoost;
        }

        const val = toneMap(intensity);
        let alpha = val;
        
        if (alpha < 0.02) continue; 

        let h = star.hue;
        let s = star.sat;
        let l = 50 + (val * 40);

        if (settings.doppler) {
            if (doppler > 1) {
                const shift = Math.min(1, Math.log10(doppler) * 1.5);
                h = h * (1 - shift) + 220 * shift;
                if (doppler > 3) s *= 0.5;
            } else {
                h *= doppler; 
                l *= doppler;
            }
        }

        if (alpha > 1) alpha = 1;

        // Optimization: Integer rounding for string interning
        const iH = Math.floor(h);
        const iS = Math.floor(s);
        const iL = Math.floor(l);
        const fA = alpha > 0.98 ? 1 : alpha.toFixed(2);
        const size = star.baseSize + (val * 0.1);

        ctx.fillStyle = `hsla(${iH}, ${iS}%, ${iL}%, ${fA})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
}

// Start the simulation when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}