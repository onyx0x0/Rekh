import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Configuration ---
const CONFIG = {
    resolution: 192, // Base voxel grid (higher clarity)
    maxTextureRes: 256,
    graphSamples: 400
};

// --- State ---
const state = {
    n: 4,
    l: 1,
    m: 0,
    exposure: 15.0,
    threshold: 0.0,
    theme: 0,
    slice: 1.0, // 1.0 = Full view, 0.0 = completely cut
    chargeFlash: 0
};

// --- DOM References ---
const dom = {
    // Stepper Buttons
    nDec: document.getElementById('n-dec'),
    nInc: document.getElementById('n-inc'),
    lDec: document.getElementById('l-dec'),
    lInc: document.getElementById('l-inc'),
    mDec: document.getElementById('m-dec'),
    mInc: document.getElementById('m-inc'),

    // Value Displays
    nVal: document.getElementById('n-val'),
    lVal: document.getElementById('l-val'),
    mVal: document.getElementById('m-val'),

    // Other Controls
    exposureSlider: document.getElementById('exposure-slider'),
    thresholdSlider: document.getElementById('threshold-slider'),
    sliceSlider: document.getElementById('slice-slider'),
    orbitalName: document.getElementById('orbital-name'),
    loader: document.getElementById('loader'),

    // Graph canvas
    graphAll: document.getElementById('graph-all'),
    legendButtons: Array.from(document.querySelectorAll('.legend-item')),

    // Modal
    modal: document.getElementById('info-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalText: document.getElementById('modal-text'),
    modalClose: document.getElementById('modal-close'),
    themeSelect: document.getElementById('theme-select'),
    themeToggle: document.getElementById('theme-toggle'),
    themeMenu: document.getElementById('theme-menu'),
    chargeToggle: document.getElementById('charge-toggle')
};

// --- Three.js Setup ---
const canvasContainer = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Default position: closer-in start
camera.position.set(1.2, 0.5, 0);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ 
    antialias: false, // disable AA for speed; visuals dominated by volume blur
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvasContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 0.25; // Allows zooming INSIDE the orbital
controls.maxDistance = 2;
controls.zoomSpeed = 1.2;
controls.enableZoom = false; // custom smoothing below

let zoomTargetDistance = camera.position.distanceTo(controls.target);
const zoomVec = new THREE.Vector3();
const clock = new THREE.Clock();

function renderScene() {
    renderer.render(scene, camera);
}

renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.0018);
    zoomTargetDistance = THREE.MathUtils.clamp(
        zoomTargetDistance * factor,
        controls.minDistance,
        controls.maxDistance
    );
}, { passive: false });

// --- Volumetric Rendering Shaders ---

const vertexShader = `
    varying vec3 vOrigin;
    varying vec3 vDirection;
    varying vec3 vPosition;
    
    void main() {
        vPosition = position;
        vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
        vDirection = position - vOrigin;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    precision highp float;
    precision highp sampler3D;

    varying vec3 vOrigin;
    varying vec3 vDirection;

    uniform sampler3D uTexture;
    uniform float uThreshold;
    uniform float uExposure;
    uniform float uSlice;
    uniform int uSteps;
    uniform int uTheme;
    uniform float uChargeFlash;
    uniform float uTime;

    // Ray-Box Intersection
    vec2 hitBox(vec3 orig, vec3 dir) {
        vec3 boxMin = vec3(-0.5);
        vec3 boxMax = vec3(0.5);
        vec3 invDir = 1.0 / dir;
        vec3 tmin = (boxMin - orig) * invDir;
        vec3 tmax = (boxMax - orig) * invDir;
        vec3 t1 = min(tmin, tmax);
        vec3 t2 = max(tmin, tmax);
        float tNear = max(max(t1.x, t1.y), t1.z);
        float tFar = min(min(t2.x, t2.y), t2.z);
        return vec2(tNear, tFar);
    }

    vec3 colormap(float v, int theme) {
        vec3 col = vec3(0.0);
        
        if (theme == 0) {
            // Default Glow: Deep Blue -> Purple -> Orange -> White
            if (v < 0.2) col = mix(vec3(0.0,0.0,0.1), vec3(0.5,0.0,0.5), v*5.0);
            else if (v < 0.5) col = mix(vec3(0.5,0.0,0.5), vec3(1.0,0.2,0.0), (v-0.2)*3.33);
            else col = mix(vec3(1.0,0.2,0.0), vec3(1.0,1.0,0.8), (v-0.5)*2.0);
        } else if (theme == 1) {
            // Magma Fire: black -> deep red-orange -> gold -> white
            float d = clamp(v, 0.0, 1.0);
            vec3 deepRed = vec3(1.0, 0.1, 0.0);
            vec3 brightGold = vec3(1.0, 0.8, 0.0);
            vec3 coreWhite = vec3(1.0, 1.0, 1.0);
            col = mix(vec3(0.0), deepRed, smoothstep(0.0, 0.4, d));
            col = mix(col, brightGold, smoothstep(0.4, 0.8, d));
            col = mix(col, coreWhite, smoothstep(0.8, 1.0, d));
        } else {
            // Fallback to default
            if (v < 0.2) col = mix(vec3(0.0,0.0,0.1), vec3(0.5,0.0,0.5), v*5.0);
            else if (v < 0.5) col = mix(vec3(0.5,0.0,0.5), vec3(1.0,0.2,0.0), (v-0.2)*3.33);
            else col = mix(vec3(1.0,0.2,0.0), vec3(1.0,1.0,0.8), (v-0.5)*2.0);
        }
        return col;
    }

    void main() {
        vec3 rayDir = normalize(vDirection);
        vec2 bounds = hitBox(vOrigin, rayDir);

        if (bounds.x > bounds.y) discard;
        bounds.x = max(bounds.x, 0.0);

        vec3 p = vOrigin + bounds.x * rayDir;
        vec3 step = rayDir * (bounds.y - bounds.x) / float(uSteps);

        vec4 color = vec4(0.0);
        
        for (int i = 0; i < 256; i++) {
            if (i >= uSteps) break;
            // SLICING LOGIC:
            // p ranges roughly from -0.5 to 0.5. 
            // uSlice is 0.0 to 1.0. 
            // We map uSlice to cutoff Z.
            float cutZ = (uSlice * 1.2) - 0.6; // Map 0..1 to -0.6..0.6
            
            // Only sample if behind the cut plane
            if (p.z < cutZ) {
                float d = texture(uTexture, p + 0.5).r; // signed amplitude (normalized)
                float dens = d * d; // probability density (relative)
                // Fade out near cube edges to avoid hard cutoff
                float edge = min(min(0.5 - abs(p.x), 0.5 - abs(p.y)), 0.5 - abs(p.z));
                float fade = smoothstep(0.0, 0.08, edge);
                dens *= fade;
                
                if (dens > uThreshold) {
                    float v = clamp(dens * uExposure, 0.0, 1.0);
                    vec3 rgb = colormap(v, uTheme);
                    if (uChargeFlash > 0.5) {
                        float phase = 0.5 + 0.5 * sin(uTime * 3.0);
                        // Use full colormaps for clear spectra
                        vec3 defaultCol = colormap(v, 0); // default spectrum
                        vec3 magmaCol   = colormap(v, 1); // magma fire spectrum
                        vec3 posColor = mix(defaultCol, magmaCol, phase);
                        vec3 negColor = mix(magmaCol, defaultCol, phase);
                        rgb = (d >= 0.0) ? posColor : negColor;
                    }
                    float alpha = v * 0.5; // Gas-like accumulation
                    
                    vec4 src = vec4(rgb, alpha);
                    src.rgb *= src.a;
                    color = color + src * (1.0 - color.a);
                }
            }

            if (color.a > 0.99) break;
            p += step;
        }

        if (color.a <= 0.0) discard;
        gl_FragColor = color;
    }
`;

// Create Unit Cube for Raymarching Volume
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: null },
        uThreshold: { value: state.threshold },
        uExposure: { value: state.exposure },
        uSteps: { value: 192 },
        uTheme: { value: state.theme },
        uSlice: { value: state.slice },
        uChargeFlash: { value: state.chargeFlash },
        uTime: { value: 0 }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false // Important for internal glowing look
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);


// --- Graph + helper state ---
const GRAPH_COLORS = {
    radial: '#ff7b00',
    probability: '#c300ff',
    cumulative: '#ff0077'
};
const GRAPH_PADDING = { left: 38, right: 14, top: 12, bottom: 24 };
let graphData = { r: [], radial: [], probability: [], cumulative: [], rMax: 1 };
let graphCursorR = 0;
let currentBoundScale = getBoundScale(state.n);
let cursorSphereActive = false;
let activeLegend = null;
let dropdownAnchor = null;

// Cursor sphere that follows the graph radius
const cursorSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xff9d00, wireframe: true, transparent: true, opacity: 0.35 })
);
cursorSphere.visible = false;
scene.add(cursorSphere);

// Shared dropdown element for quantum selection
const quantumDropdown = document.createElement('div');
quantumDropdown.className = 'quantum-dropdown';
document.body.appendChild(quantumDropdown);

// --- Physics Engine ---
function getBoundScale(n) {
    return 4.0 + (n * n * 2.2);
}

function factorial(n) {
    if (n < 0) return 0;
    let v = 1;
    for (let i = 2; i <= n; i++) v *= i;
    return v;
}

function assocLaguerre(p, alpha, x) {
    if (p === 0) return 1;
    if (p === 1) return 1 + alpha - x;
    let L0 = 1;
    let L1 = 1 + alpha - x;
    for (let k = 2; k <= p; k++) {
        const coeff1 = ((2 * k - 1 + alpha - x) * L1 - (k - 1 + alpha) * L0) / k;
        L0 = L1;
        L1 = coeff1;
    }
    return L1;
}

function radialPart(n, l, r) {
    if (n < 1 || l < 0 || l >= n) return 0;
    const rho = (2 * r) / n;
    const p = n - l - 1;
    if (p < 0) return 0;
    const norm = (2 / n) * (2 / n) * Math.sqrt(factorial(p) / factorial(n + l));
    const lag = assocLaguerre(p, 2 * l + 1, rho);
    return norm * Math.exp(-r / n) * Math.pow(rho, l) * lag;
}

// Associated Legendre polynomial P_l^m (unnormalized, enough for shape)
function associatedLegendre(l, m, x) {
    if (m > l) return 0;
    let pmm = 1;
    if (m > 0) {
        const somx2 = Math.sqrt((1 - x) * (1 + x));
        let fact = 1;
        for (let i = 1; i <= m; i++) {
            pmm *= -fact * somx2;
            fact += 2;
        }
    }
    if (l === m) return pmm;
    let pm1m = x * (2 * m + 1) * pmm;
    if (l === m + 1) return pm1m;
    let pll = 0;
    for (let ll = m + 2; ll <= l; ll++) {
        pll = ((2 * ll - 1) * x * pm1m - (ll + m - 1) * pmm) / (ll - m);
        pmm = pm1m;
        pm1m = pll;
    }
    return pll;
}

function angularReal(l, m, theta, phi) {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const cos2P = Math.cos(2 * phi);
    const sin2P = Math.sin(2 * phi);
    const cos3P = Math.cos(3 * phi);
    const sin3P = Math.sin(3 * phi);

    if (l === 0) return 1;
    if (l === 1) {
        if (m === 0) return cosT;           // pz
        if (m === 1) return sinT * cosP;    // px
        if (m === -1) return sinT * sinP;   // py
    }
    if (l === 2) {
        if (m === 0) return 3 * cosT * cosT - 1;             // dz^2
        if (m === 1) return sinT * cosT * cosP;              // dxz
        if (m === -1) return sinT * cosT * sinP;             // dyz
        if (m === 2) return sinT * sinT * cos2P;             // dx^2-y^2
        if (m === -2) return sinT * sinT * sin2P;            // dxy
    }
    if (l === 3) {
        if (m === 0) return 5 * cosT * cosT * cosT - 3 * cosT;
        if (m === 1) return (5 * cosT * cosT - 1) * sinT * cosP;
        if (m === -1) return (5 * cosT * cosT - 1) * sinT * sinP;
        if (m === 2) return sinT * sinT * cosT * cos2P;
        if (m === -2) return sinT * sinT * cosT * sin2P;
        if (m === 3) return sinT * sinT * sinT * cos3P;
        if (m === -3) return sinT * sinT * sinT * sin3P;
    }
    // Fallback to magnitude-like shape for higher l using associated Legendre
    const mAbs = Math.abs(m);
    const P = associatedLegendre(l, mAbs, cosT);
    const phiFactor = m === 0 ? 1 : Math.cos(mAbs * phi);
    return P * phiFactor;
}

function getAngularValue(l, m, theta, phi) {
    return angularReal(l, m, theta, phi);
}

function getOrbitalValue(n, l, m, x, y, z) {
    const r = Math.sqrt(x * x + y * y + z * z);
    if (!isFinite(r)) return 0;
    if (r === 0) {
        const R0 = radialPart(n, l, 0);
        return R0 * R0;
    }
    const theta = Math.acos(z / r);
    const phi = Math.atan2(y, x);

    const R = radialPart(n, l, r);
    const Y = getAngularValue(l, m, theta, phi);
    return R * Y; // signed amplitude
}

// --- Radial data + graphs ---
function generateRadialCurves(boundScale) {
    const steps = CONFIG.graphSamples;
    const rMax = boundScale;
    const r = new Array(steps);
    const radial = new Array(steps);
    const probRaw = new Array(steps);

    for (let i = 0; i < steps; i++) {
        const radius = (i / (steps - 1)) * rMax;
        const R = radialPart(state.n, state.l, radius);
        r[i] = radius;
        radial[i] = R;
        probRaw[i] = 4 * Math.PI * radius * radius * (R * R);
    }

    let area = 0;
    for (let i = 1; i < steps; i++) {
        const dr = r[i] - r[i - 1];
        area += 0.5 * (probRaw[i] + probRaw[i - 1]) * dr;
    }

    const probability = new Array(steps);
    const cumulative = new Array(steps);
    let running = 0;
    for (let i = 0; i < steps; i++) {
        probability[i] = area > 0 ? probRaw[i] / area : 0;
        if (i > 0) {
            const dr = r[i] - r[i - 1];
            running += 0.5 * (probRaw[i] + probRaw[i - 1]) * dr;
        }
        cumulative[i] = area > 0 ? running / area : 0;
    }

    return { r, radial, probability, cumulative, rMax };
}

function getSeriesValue(series, radius) {
    if (!graphData.r.length) return 0;
    const t = Math.min(Math.max(radius / graphData.rMax, 0), 1);
    const idx = t * (series.length - 1);
    const i0 = Math.floor(idx);
    const i1 = Math.min(series.length - 1, i0 + 1);
    const f = idx - i0;
    return series[i0] * (1 - f) + series[i1] * f;
}

function drawCombinedGraph(canvas) {
    if (!canvas || !graphData.r.length) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, width, height);

    const pad = GRAPH_PADDING;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const radialMax = Math.max(...graphData.radial.map((v) => Math.abs(v)), 1e-6);
    const probMax = Math.max(...graphData.probability, 1e-6);
    const radialNorm = graphData.radial.map((v) => v / radialMax);
    const probNorm = graphData.probability.map((v) => v / probMax);
    const cumNorm = graphData.cumulative.slice();

    let minY = Math.min(...radialNorm, 0);
    let maxY = Math.max(...radialNorm, ...probNorm, ...cumNorm, 1);
    if (maxY === minY) {
        maxY += 1;
        minY -= 1;
    }

    const xToPx = (x) => pad.left + (x / graphData.rMax) * plotW;
    const yToPx = (y) => pad.top + (1 - (y - minY) / (maxY - minY)) * plotH;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
        const gx = pad.left + (plotW * i) / 4;
        ctx.moveTo(gx, pad.top);
        ctx.lineTo(gx, height - pad.bottom);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (minY < 0 && maxY > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.beginPath();
        ctx.moveTo(pad.left, yToPx(0));
        ctx.lineTo(width - pad.right, yToPx(0));
        ctx.stroke();
    }

    // Axis annotations
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('nuclide', pad.left + 2, height - pad.bottom + 14);
    ctx.textAlign = 'right';
    ctx.fillText('far away', width - pad.right - 2, height - pad.bottom + 14);
    ctx.save();
    ctx.translate(pad.left - 18, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('normalization', 0, -6);
    ctx.fillText('amplitude / probability', 0, 10);
    ctx.restore();

    const dimColor = 'rgba(80,80,80,0.6)';
    const seriesList = [
        { key: 'radial', data: radialNorm, color: GRAPH_COLORS.radial },
        { key: 'probability', data: probNorm, color: GRAPH_COLORS.probability },
        { key: 'cumulative', data: cumNorm, color: GRAPH_COLORS.cumulative }
    ];

    seriesList.forEach(({ data, color, key }) => {
        const stroke = activeLegend && activeLegend !== key ? dimColor : (activeLegend ? '#ff9d00' : color);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((val, i) => {
            const x = xToPx(graphData.r[i]);
            const y = yToPx(val);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });

    const cursorX = xToPx(graphCursorR);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cursorX, pad.top);
    ctx.lineTo(cursorX, height - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    seriesList.forEach(({ data, color, key }) => {
        const cursorVal = getSeriesValue(data, graphCursorR);
        const fill = activeLegend && activeLegend !== key ? dimColor : (activeLegend ? '#ff9d00' : color);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(cursorX, yToPx(cursorVal), 4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.restore();
}

function renderGraphs() {
    if (!graphData.r.length) return;
    drawCombinedGraph(dom.graphAll);
}

function updateCursorSphere() {
    if (!cursorSphereActive) {
        cursorSphere.visible = false;
        return;
    }
    const normalized = graphCursorR / (2 * currentBoundScale);
    if (normalized <= 0) {
        cursorSphere.visible = false;
        return;
    }
    cursorSphere.visible = true;
    cursorSphere.scale.setScalar(Math.max(normalized / 0.5, 0.0001));
}

function setCursorRadius(radius) {
    const maxR = graphData.rMax || currentBoundScale;
    graphCursorR = Math.min(Math.max(radius, 0), maxR);
    updateCursorSphere();
    renderGraphs();
}

function getRadiusFromEvent(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const usable = Math.max(rect.width - GRAPH_PADDING.left - GRAPH_PADDING.right, 1);
    const normalized = (x - GRAPH_PADDING.left) / usable;
    return Math.min(Math.max(normalized, 0), 1) * (graphData.rMax || currentBoundScale);
}

function refreshRadialGraphs() {
    graphData = generateRadialCurves(currentBoundScale);
    if (!graphCursorR || graphCursorR > graphData.rMax) {
        graphCursorR = graphData.rMax * 0.35;
    }
    setCursorRadius(graphCursorR);
}

function closeDropdown() {
    dropdownAnchor = null;
    quantumDropdown.classList.remove('active');
}

function openDropdown(target, values, onSelect) {
    if (!target || !values.length) return;
    dropdownAnchor = target;
    quantumDropdown.innerHTML = '';
    values.forEach((val) => {
        const btn = document.createElement('button');
        btn.textContent = val;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelect(val);
            closeDropdown();
        });
        quantumDropdown.appendChild(btn);
    });
    const rect = target.getBoundingClientRect();
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(values.length))));
    const cell = 52;
    const dropWidth = Math.max(rect.width, cols * cell);
    quantumDropdown.style.width = `${dropWidth}px`;
    quantumDropdown.classList.remove('active');
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    const half = dropWidth / 2;
    const clampedCenter = Math.max(half + 8, Math.min(window.innerWidth - half - 8, centerX));
    quantumDropdown.style.left = `${clampedCenter}px`;
    quantumDropdown.style.top = `${rect.bottom + 6 + window.scrollY}px`;
    quantumDropdown.classList.add('active');
}

document.addEventListener('click', (e) => {
    if (dropdownAnchor && !quantumDropdown.contains(e.target)) {
        closeDropdown();
    }
});

// --- Modal helpers ---
const LEGEND_INFO = {
    radial: {
        title: "R(r) - Radial Wavefunction",
        text: "Oscillates with nodes; sign changes mark nodes and shape the orbital lobes.",
        eq: "R_{n,l}(r) \\text{ with } n-l-1 \\text{ radial nodes}",
        eqExplain: "n-l-1 gives the count of radial nodes; sign flips at each node."
    },
    probability: {
        title: "P(r) - Radial Probability Density",
        text: "Probability density in a thin shell at radius r; peaks show where electrons are most likely.",
        eq: "P(r) = 4\\pi r^2 |R_{n,l}(r)|^2",
        eqExplain: "Multiply |R|^2 by shell area 4*pi*r^2 to get probability per radius."
    },
    cumulative: {
        title: "C(r) - Cumulative Probability",
        text: "Total probability enclosed within radius r; rises toward 1 as radius grows.",
        eq: "C(r) = \\int_{0}^{r} 4\\pi r^{\\prime 2} |R_{n,l}(r)|^2 \\, dr'",
        eqExplain: "Integrate P(r) from 0->r to get total probability contained inside."
    }
};

function openModal(key) {
    const info = LEGEND_INFO[key];
    if (!info) return;
    activeLegend = key;
    renderGraphs();
    dom.modalTitle.textContent = info.title;
    dom.modalText.innerHTML = `${info.text}<br><span id="modal-eq-slot"></span><br><span class="eq-explain">${info.eqExplain || ""}</span>`;
    const eqSlot = dom.modalText.querySelector('#modal-eq-slot');
    if (window.katex && eqSlot) {
        window.katex.render(info.eq, eqSlot, { throwOnError: false });
    } else if (eqSlot) {
        eqSlot.textContent = info.eq;
    }
    dom.modal.classList.add('active');
}

function closeModal() {
    activeLegend = null;
    renderGraphs();
    dom.modal.classList.remove('active');
    dom.legendButtons.forEach((b) => b.classList.remove('active'));
}
// --- UI helpers ---
function formatOrbitalName(lLetter) {
    const letters = ['s', 'p', 'd', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'q', 'r', 't', 'u'];
    const base = `${state.n}${lLetter || letters[state.l] || ''}`;
    const realNames = {
        1: { 0: 'p_z', 1: 'p_x', '-1': 'p_y' },
        2: { 0: 'd_{z^2}', 1: 'd_{xz}', '-1': 'd_{yz}', 2: 'd_{x^2-y^2}', '-2': 'd_{xy}' },
        3: {
            0: 'f_{z^3}', 1: 'f_{xz^2}', '-1': 'f_{yz^2}', 2: 'f_{z(x^2-y^2)}',
            '-2': 'f_{xyz}', 3: 'f_{x(x^2-3y^2)}', '-3': 'f_{y(3x^2-y^2)}'
        }
    };
    const name = (realNames[state.l] && realNames[state.l][state.m]) ? realNames[state.l][state.m] : (lLetter || letters[state.l] || `l=${state.l}`);
    return `${base} (${name})`;
}

function updateTexture() {
    dom.loader.classList.add('active');

    setTimeout(() => {
        const size = CONFIG.resolution;
        const data = new Float32Array(size * size * size);
        currentBoundScale = getBoundScale(state.n);

        let maxVal = 0;
        let idx = 0;
        for (let z = 0; z < size; z++) {
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const fx = ((x / size) - 0.5) * 2 * currentBoundScale;
                    const fy = ((y / size) - 0.5) * 2 * currentBoundScale;
                    const fz = ((z / size) - 0.5) * 2 * currentBoundScale;

                    const val = getOrbitalValue(state.n, state.l, state.m, fx, fy, fz);
                    data[idx] = val;
                    const a = Math.abs(val);
                    if (a > maxVal) maxVal = a;
                    idx++;
                }
            }
        }

        if (maxVal > 0) {
            for (let i = 0; i < data.length; i++) data[i] /= maxVal;
        }

        const texture = new THREE.Data3DTexture(data, size, size, size);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;
        texture.needsUpdate = true;

        material.uniforms.uTexture.value = texture;
        material.uniforms.uSteps.value = Math.min(256, Math.max(128, Math.floor(size * 0.9)));

        updateUI();
        refreshRadialGraphs();
        dom.loader.classList.remove('active');
        renderScene();
    }, 20);
}

function updateUI() {
    const letters = ['s', 'p', 'd', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 'o', 'q', 'r', 't', 'u'];
    const lLetter = letters[state.l] || `l=${state.l}`;
    dom.nVal.innerText = state.n;
    dom.lVal.innerText = `${state.l} (${lLetter})`;
    dom.mVal.innerText = state.m;
    dom.orbitalName.innerText = formatOrbitalName(lLetter);
    if (dom.themeSelect) dom.themeSelect.value = `${state.theme}`;
    if (dom.themeToggle) dom.themeToggle.textContent = state.theme === 1 ? 'Magma Fire' : 'Default Glow';
    if (dom.chargeToggle) dom.chargeToggle.textContent = state.chargeFlash ? 'Charge Flash: On' : 'Charge Flash: Off';
}

// --- Logic for Steppers ---
function clampQuantumNumbers() {
    if (state.l >= state.n) state.l = state.n - 1;
    if (state.l < 0) state.l = 0;
    if (state.m > state.l) state.m = state.l;
    if (state.m < -state.l) state.m = -state.l;
}

// Event Handlers for Buttons
dom.nDec.addEventListener('click', () => { if (state.n > 1) { state.n--; clampQuantumNumbers(); updateTexture(); } });
dom.nInc.addEventListener('click', () => { if (state.n < 16) { state.n++; clampQuantumNumbers(); updateTexture(); } });

dom.lDec.addEventListener('click', () => { if (state.l > 0) { state.l--; clampQuantumNumbers(); updateTexture(); } });
dom.lInc.addEventListener('click', () => { if (state.l < state.n - 1) { state.l++; clampQuantumNumbers(); updateTexture(); } });

dom.mDec.addEventListener('click', () => { if (state.m > -state.l) { state.m--; updateTexture(); } });
dom.mInc.addEventListener('click', () => { if (state.m < state.l) { state.m++; updateTexture(); } });

dom.exposureSlider.addEventListener('input', (e) => {
    state.exposure = parseFloat(e.target.value);
    material.uniforms.uExposure.value = state.exposure;
});

dom.thresholdSlider.addEventListener('input', (e) => {
    state.threshold = parseFloat(e.target.value);
    material.uniforms.uThreshold.value = state.threshold;
});

dom.sliceSlider.addEventListener('input', (e) => {
    state.slice = parseFloat(e.target.value);
    material.uniforms.uSlice.value = state.slice;
});

if (dom.chargeToggle) {
    dom.chargeToggle.addEventListener('click', () => {
        state.chargeFlash = state.chargeFlash ? 0 : 1;
        material.uniforms.uChargeFlash.value = state.chargeFlash;
        updateUI();
        renderScene();
    });
}

function applyTheme(val) {
    state.theme = val;
    material.uniforms.uTheme.value = state.theme;
    if (dom.themeSelect) dom.themeSelect.value = `${val}`;
    if (dom.themeToggle) dom.themeToggle.textContent = val === 1 ? 'Magma Fire' : 'Default Glow';
}

if (dom.themeSelect) {
    dom.themeSelect.addEventListener('change', (e) => {
        applyTheme(parseInt(e.target.value, 10) || 0);
    });
}

if (dom.themeToggle && dom.themeMenu) {
    const closeThemeMenu = () => dom.themeMenu.classList.remove('active');
    const openThemeMenu = () => {
        dom.themeMenu.classList.add('active');
    };
    dom.themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (dom.themeMenu.classList.contains('active')) closeThemeMenu();
        else openThemeMenu();
    });
    dom.themeMenu.querySelectorAll('.theme-option').forEach((btn) => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.theme, 10) || 0;
            applyTheme(val);
            closeThemeMenu();
        });
    });
    document.addEventListener('click', (e) => {
        if (!dom.themeMenu.contains(e.target) && e.target !== dom.themeToggle) closeThemeMenu();
    });
}

// Quick dropdown selection on value click
if (dom.nVal) {
    dom.nVal.addEventListener('click', (e) => {
        e.stopPropagation();
        const vals = Array.from({ length: 16 }, (_, i) => i + 1);
        openDropdown(dom.nVal, vals, (val) => {
            state.n = val;
            clampQuantumNumbers();
            updateTexture();
        });
    });
}

if (dom.lVal) {
    dom.lVal.addEventListener('click', (e) => {
        e.stopPropagation();
        const maxL = Math.max(0, state.n - 1);
        const vals = Array.from({ length: maxL + 1 }, (_, i) => i);
        openDropdown(dom.lVal, vals, (val) => {
            state.l = val;
            clampQuantumNumbers();
            updateTexture();
        });
    });
}

if (dom.mVal) {
    dom.mVal.addEventListener('click', (e) => {
        e.stopPropagation();
        const vals = [];
        for (let i = -state.l; i <= state.l; i++) vals.push(i);
        openDropdown(dom.mVal, vals, (val) => {
            state.m = val;
            clampQuantumNumbers();
            updateTexture();
        });
    });
}

if (dom.graphAll) {
    dom.graphAll.addEventListener('pointerenter', () => {
        cursorSphereActive = true;
        updateCursorSphere();
    });
    dom.graphAll.addEventListener('pointerleave', () => {
        cursorSphereActive = false;
        updateCursorSphere();
        renderGraphs();
    });
    dom.graphAll.addEventListener('pointermove', (evt) => setCursorRadius(getRadiusFromEvent(dom.graphAll, evt)));
    dom.graphAll.addEventListener('pointerdown', (evt) => setCursorRadius(getRadiusFromEvent(dom.graphAll, evt)));
}

dom.legendButtons.forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
        const key = btn.dataset.key;
        activeLegend = key;
        dom.legendButtons.forEach((b) => b.classList.toggle('active', b === btn));
        renderGraphs();
    });
    btn.addEventListener('mouseleave', () => {
        if (!dom.modal.classList.contains('active')) {
            activeLegend = null;
            dom.legendButtons.forEach((b) => b.classList.remove('active'));
            renderGraphs();
        }
    });
    btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        dom.legendButtons.forEach((b) => b.classList.toggle('active', b === btn));
        openModal(key);
    });
});

if (dom.modal) {
    dom.modal.addEventListener('click', (e) => {
        if (e.target === dom.modal) closeModal();
    });
    dom.modalClose.addEventListener('click', closeModal);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderGraphs();
    renderScene();
});

// --- Init ---
updateTexture();

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const currentDist = camera.position.distanceTo(controls.target);
    const nextDist = THREE.MathUtils.lerp(currentDist, zoomTargetDistance, 0.18);
    zoomVec.subVectors(camera.position, controls.target).normalize().multiplyScalar(nextDist);
    camera.position.copy(controls.target).add(zoomVec);
    camera.lookAt(controls.target);

    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
}
animate();
