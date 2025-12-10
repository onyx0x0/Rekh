// --- Configuration & State ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width, height;

// App State
const state = {
    theme: 'dark', // 'dark' or 'light'
    tool: 'select', // select, pen, line, arrow, rect, ellipse, text, eraser
    color: '#ffffff',
    strokeWidth: 3,
    isDrawing: false,
    isScaling: false,
    isPanning: false,
    objects: [], // { id, type, x, y, w, h, points, color, width, text, img... }
    selection: null, // Selected Object ID
    history: [],
    historyIndex: -1,
    camera: { x: 0, y: 0, zoom: 1 },
    startPos: { x: 0, y: 0 }, // Mouse start world coords
    lastMouse: { x: 0, y: 0 }, // Screen coords
    layerPanelOpen: false,
    showGrid: true,
    scaleInfo: null,
    layerDrag: null
};

const TOOL_ICONS = {
    pen: 'edit',
    line: 'show_chart',
    arrow: 'arrow_right_alt',
    rect: 'crop_square',
    ellipse: 'radio_button_unchecked',
    text: 'text_fields',
    image: 'image'
};

function strokeToFontSize(width) {
    return Math.max(8, Math.round(width * 6));
}

function mapColorForTheme(color, theme) {
    const c = (color || '').toLowerCase();
    if (theme === 'light' && c === '#ffffff') return '#000000';
    if (theme === 'dark' && c === '#000000') return '#ffffff';
    return color;
}

const colorInput = document.getElementById('color-picker');
const colorWrapper = document.querySelector('.color-picker-wrapper');
const colorPop = document.getElementById('color-pop');
const colorTrigger = document.getElementById('color-trigger');
const toolPop = document.getElementById('tool-pop');
const toolConnector = document.getElementById('tool-connector');
const headModal = document.getElementById('head-modal');
const headSizeSlider = document.getElementById('head-size-slider');
const headCloseBtn = document.getElementById('head-close');
const headBothToggle = document.getElementById('head-both-toggle');

const swatches = [
    '#ffffff','#000000','#ff4757','#ffa502','#1e90ff',
    '#2ed573','#3742fa','#70a1ff','#eccc68','#a29bfe',
    '#2f3542','#ced6e0','#ff6b81','#ff7f50','#7bed9f'
];

const toolSettings = {
    pen: { dash: 'solid' },
    line: { dash: 'solid' },
    arrow: { dash: 'solid', headScale: 1, headType: 'classic', doubleHead: false },
    rect: { dash: 'solid' },
    ellipse: { dash: 'solid' }
};

function setColor(val) {
    state.color = val;
    if (colorInput) colorInput.value = val;
    if (colorTrigger) colorTrigger.style.background = val;
    if (state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj) { obj.color = state.color; saveState(); render(); }
    }
}

function buildSwatches() {
    if (!colorPop) return;
    colorPop.innerHTML = '';
    swatches.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.background = c;
        div.addEventListener('click', () => {
            setColor(c);
            closeColorPop();
        });
        colorPop.appendChild(div);
    });
}

function openColorPop() {
    if (colorWrapper) colorWrapper.classList.add('open');
}
function closeColorPop() {
    if (colorWrapper) colorWrapper.classList.remove('open');
}

// --- Tool chooser (long press) ---
let toolHoldTimer = null;
const toolPopTools = new Set(['line','arrow','rect','ellipse','pen']);
let chooserHover = null;
let chooserAnchor = null;
let pendingHead = { type: 'classic', scale: 1, doubleHead: false };

function buildToolChooser(tool) {
    const settings = toolSettings[tool] || {};
    const dash = settings.dash || 'solid';
    const options = [
        { key: 'solid', cls: 'line-sample' },
        { key: 'dashed', cls: 'line-sample dashed' },
        { key: 'dotted', cls: 'line-sample dotted' }
    ];
    if (tool === 'arrow') {
        options.push({ key: 'head', cls: '', icon: 'play_arrow' });
    }
    const optionsHtml = options.map(opt => {
        const active = opt.key === dash;
        const inner = opt.icon ? `<span class="material-icons-round">${opt.icon}</span>` : `<div class="${opt.cls}"></div>`;
        return `<div class="tool-option ${active ? 'active' : ''}" data-key="${opt.key}">${inner}</div>`;
    }).join('');
    toolPop.innerHTML = `<div class="tool-options">${optionsHtml}</div>`;
    toolPop.dataset.tool = tool;
}

function positionToolPop(anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    chooserAnchor = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    toolPop.style.left = `${chooserAnchor.x}px`;
    toolPop.style.top = `${rect.top - 110}px`;
}

function showToolPop(tool, anchorEl) {
    if (!toolPop || !anchorEl) return;
    toolHoldTimer = null;
    closeColorPop();
    setActiveTool(tool);
    buildToolChooser(tool);
    positionToolPop(anchorEl);
    toolPop.classList.add('open');
    chooserHover = null;
    if (toolConnector) toolConnector.classList.remove('visible');
}

function hideToolPop() {
    if (toolPop) {
        toolPop.classList.remove('open');
        toolPop.dataset.tool = '';
    }
    chooserHover = null;
    if (toolConnector) toolConnector.classList.remove('visible');
}

function updateDash(tool, value) {
    if (!toolSettings[tool]) return;
    toolSettings[tool].dash = value;
    if (state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj && obj.type === tool) {
            obj.dashStyle = value;
            saveState();
            render();
        }
    }
}

function updateArrowHead(scale) {
    toolSettings.arrow.headScale = scale;
    if (state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj && obj.type === 'arrow') {
            obj.headScale = scale;
            if (!obj.headType) obj.headType = toolSettings.arrow.headType || 'classic';
            saveState();
            render();
        }
    }
}

function setActiveTool(tool) {
    state.tool = tool;
    state.selection = null;
    updateUI();
    render();
}

function updateConnector(targetEl) {
    if (!toolConnector || !chooserAnchor || !targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const tx = rect.left + rect.width / 2;
    const ty = rect.top + rect.height / 2;
    const dx = tx - chooserAnchor.x;
    const dy = ty - chooserAnchor.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    toolConnector.style.left = `${chooserAnchor.x}px`;
    toolConnector.style.top = `${chooserAnchor.y}px`;
    toolConnector.style.width = `${dist}px`;
    toolConnector.style.transform = `rotate(${angle}deg)`;
    toolConnector.classList.add('visible');
}

function showHeadPopup(opt) {
    if (!headPopupEl || !opt) return;
    headPopupEl.classList.add('open');
    const offset = opt.getBoundingClientRect();
    const parent = toolPop.getBoundingClientRect();
    headPopupEl.style.left = `${offset.left - parent.left + opt.offsetWidth / 2}px`;
    headPopupEl.style.top = `-90px`;
}

function hideHeadPopup() {
    if (headPopupEl) headPopupEl.classList.remove('open');
}

function applyToolChoice(tool, key) {
    if (!tool) return;
    if (key === 'head') {
        pendingHead.type = toolSettings.arrow.headType || 'classic';
        pendingHead.scale = toolSettings.arrow.headScale || 1;
        pendingHead.doubleHead = toolSettings.arrow.doubleHead || false;
        hideToolPop();
        openHeadModal();
        return;
    } else {
        updateDash(tool, key);
    }
    hideToolPop();
}

function bindToolPopEvents() {
    if (!toolPop) return;
    toolPop.addEventListener('pointerenter', (e) => {
        const opt = e.target.closest('.tool-option');
        if (!opt) return;
        chooserHover = opt;
        updateConnector(opt);
    });
    toolPop.addEventListener('pointermove', (e) => {
        const opt = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tool-option');
        if (opt && opt !== chooserHover) {
            chooserHover = opt;
            updateConnector(opt);
        }
    });
    toolPop.addEventListener('pointerleave', () => {
        chooserHover = null;
        if (toolConnector) toolConnector.classList.remove('visible');
    });
}
bindToolPopEvents();

document.addEventListener('pointerup', (e) => {
    if (!toolPop?.classList.contains('open')) return;
    const opt = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tool-option');
    if (opt) {
        applyToolChoice(toolPop.dataset.tool, opt.dataset.key);
    } else {
        hideToolPop();
    }
});

document.addEventListener('click', (e) => {
    if (toolPop && !toolPop.contains(e.target) && !e.target.closest('.tool-btn')) {
        hideToolPop();
    }
});

function remapObjectsForTheme(objs, theme) {
    return objs.map(o => {
        const copy = { ...o };
        if (copy.points) copy.points = copy.points.map(p => ({ ...p }));
        if (typeof copy.color === 'string') copy.color = mapColorForTheme(copy.color, theme);
        return copy;
    });
}

function getNextTypeIndex(type) {
    let max = 0;
    state.objects.forEach(o => {
        if (o.type === type && o.typeIndex && o.typeIndex > max) max = o.typeIndex;
    });
    return max + 1;
}

function ensureTypeIndex(obj) {
    if (!obj.typeIndex) {
        obj.typeIndex = getNextTypeIndex(obj.type);
    }
}

function ensureAllTypeIndices() {
    state.objects.forEach(o => ensureTypeIndex(o));
}

function cloneObject(o) {
    return { ...o, points: o.points ? o.points.map(p => ({ ...p })) : null };
}

function getBoundingBox(obj) {
    if (!obj) return null;
    if (obj.type === 'pen') {
        if (!obj.points || obj.points.length === 0) return null;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        obj.points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (obj.type === 'line' || obj.type === 'arrow') {
        const minX = Math.min(obj.x, obj.ex);
        const minY = Math.min(obj.y, obj.ey);
        const maxX = Math.max(obj.x, obj.ex);
        const maxY = Math.max(obj.y, obj.ey);
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (obj.type === 'text') {
        const size = obj.size || 20;
        ctx.font = `${size}px sans-serif`;
        const m = ctx.measureText(obj.text || '');
        return { x: obj.x, y: obj.y - size, w: m.width, h: size };
    }
    if (obj.type === 'image' || obj.type === 'rect' || obj.type === 'ellipse') {
        const w = Math.abs(obj.w || 0);
        const h = Math.abs(obj.h || 0);
        const x = Math.min(obj.x, obj.x + (obj.w || 0));
        const y = Math.min(obj.y, obj.y + (obj.h || 0));
        return { x, y, w, h };
    }
    return null;
}

function dashArray(style) {
    if (style === 'dashed') return [12, 8];
    if (style === 'dotted') return [3, 6];
    return [];
}

function drawArrowHead(ctxRef, x, y, angle, headlen, headType) {
    if (headType === 'classic') {
        ctxRef.beginPath();
        ctxRef.moveTo(x, y);
        ctxRef.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
        ctxRef.moveTo(x, y);
        ctxRef.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
        ctxRef.stroke();
    } else if (headType === 'triangle') {
        const back = headlen * 0.9;
        const side = headlen * 0.55;
        ctxRef.beginPath();
        ctxRef.moveTo(x, y);
        ctxRef.lineTo(x - back * Math.cos(angle) + side * Math.cos(angle - Math.PI / 2), y - back * Math.sin(angle) + side * Math.sin(angle - Math.PI / 2));
        ctxRef.lineTo(x - back * Math.cos(angle) - side * Math.cos(angle - Math.PI / 2), y - back * Math.sin(angle) - side * Math.sin(angle - Math.PI / 2));
        ctxRef.closePath();
        ctxRef.fill();
    } else if (headType === 'bar') {
        ctxRef.beginPath();
        ctxRef.moveTo(x - headlen * Math.cos(angle + Math.PI / 2), y - headlen * Math.sin(angle + Math.PI / 2));
        ctxRef.lineTo(x + headlen * Math.cos(angle + Math.PI / 2), y + headlen * Math.sin(angle + Math.PI / 2));
        ctxRef.stroke();
    } else if (headType === 'dot') {
        ctxRef.beginPath();
        ctxRef.arc(x, y, headlen / 3, 0, Math.PI * 2);
        ctxRef.fill();
    }
}

function drawScaleHandle(box) {
    if (!box) return;
    const size = 12 / state.camera.zoom;
    const x = box.x + box.w;
    const y = box.y;
    ctx.save();
    ctx.lineWidth = 1.5 / state.camera.zoom;
    ctx.strokeStyle = '#6c5ce7';
    ctx.fillStyle = state.theme === 'dark' ? 'rgba(18,18,18,0.9)' : 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.rect(x - size, y - size, size, size);
    ctx.fill();
    ctx.stroke();

    // Diagonal arrow indicator
    ctx.beginPath();
    ctx.moveTo(x - size * 0.8, y - size * 0.2);
    ctx.lineTo(x - size * 0.2, y - size * 0.8);
    ctx.moveTo(x - size * 0.6, y - size * 0.8);
    ctx.lineTo(x - size * 0.2, y - size * 0.8);
    ctx.lineTo(x - size * 0.2, y - size * 0.4);
    ctx.stroke();
    ctx.restore();
}

function isOnScaleHandle(obj, mouseScreen) {
    const box = getBoundingBox(obj);
    if (!box) return false;
    const handleWorld = { x: box.x + box.w, y: box.y };
    const handleScreen = toScreen(handleWorld.x, handleWorld.y);
    const dist = Math.hypot(handleScreen.x - mouseScreen.x, handleScreen.y - mouseScreen.y);
    return dist < 14;
}

// --- Initialization ---

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    render();
}
window.addEventListener('resize', resize);
resize();

// --- Theme Management ---

document.getElementById('theme-btn').addEventListener('click', toggleTheme);
document.getElementById('grid-btn').addEventListener('click', toggleGrid);

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    
    const icon = document.querySelector('#theme-btn span');
    icon.textContent = state.theme === 'dark' ? 'dark_mode' : 'light_mode';

    // Smart Color Inversion for Black/White objects (non-undoable)
    state.objects = remapObjectsForTheme(state.objects, state.theme);
    if (state.history.length) {
        state.history = state.history.map(snap => remapObjectsForTheme(snap, state.theme));
    }
    ensureAllTypeIndices();
    
    // Update current picker if it was B or W
    if (state.theme === 'light' && state.color === '#ffffff') state.color = '#000000';
    if (state.theme === 'dark' && state.color === '#000000') state.color = '#ffffff';
    setColor(state.color);

    render();
}

function toggleGrid() {
    state.showGrid = !state.showGrid;
    const icon = document.querySelector('#grid-btn span');
    icon.textContent = state.showGrid ? 'grain' : 'grid_off';
    document.getElementById('grid-btn').classList.toggle('active', state.showGrid);
    render();
}

// Initial sync for grid button state
document.getElementById('grid-btn').classList.toggle('active', state.showGrid);

// Color picker pop
buildSwatches();
    setColor(state.color);
if (colorTrigger && colorWrapper) {
    colorTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = colorWrapper.classList.contains('open');
        if (isOpen) closeColorPop(); else openColorPop();
    });
    document.addEventListener('click', (e) => {
        if (!colorWrapper.contains(e.target)) closeColorPop();
    });
}

// --- Layers Island ---

const layersPanel = document.getElementById('layers-panel');
const layersBtn = document.getElementById('layers-btn');
const layersList = document.getElementById('layers-list');

layersBtn.addEventListener('click', () => {
    state.layerPanelOpen = !state.layerPanelOpen;
    layersPanel.classList.toggle('layers-hidden', !state.layerPanelOpen);
    if (state.layerPanelOpen) updateLayersList();
});

function updateLayersList() {
    if (!state.layerPanelOpen) return;
    
    layersList.innerHTML = '';
    
    state.objects.forEach((obj, index) => {
        const item = document.createElement('div');
        item.className = `layer-item ${state.selection === obj.id ? 'selected' : ''}`;
        item.dataset.index = index;
        item.draggable = true;

        const iconName = TOOL_ICONS[obj.type] || 'layers';
        ensureTypeIndex(obj);
        const displayNumber = obj.typeIndex;

        item.innerHTML = `
            <div class="layer-main">
                <span class="material-icons-round layer-icon">${iconName}</span>
                <span class="layer-number">${displayNumber}</span>
            </div>
            <div class="layer-actions">
                <button class="layer-btn" onclick="toggleVisibility('${obj.id}')">
                    <span class="material-icons-round">${obj.hidden ? 'visibility_off' : 'visibility'}</span>
                </button>
            </div>
        `;

        item.addEventListener('click', (e) => {
            if(!e.target.closest('.layer-btn')) {
                state.selection = obj.id;
                state.tool = 'select'; // Switch to select to manipulate
                updateUI();
                render();
                updateLayersList();
            }
        });

        item.addEventListener('dragstart', (e) => {
            startLayerDrag(e, index);
        });
        item.addEventListener('dragover', (e) => {
            layerDragOver(e, index);
        });
        item.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drop-before', 'drop-after');
        });
        item.addEventListener('drop', (e) => {
            layerDrop(e, index);
        });
        item.addEventListener('dragend', endLayerDrag);

        layersList.appendChild(item);
    });
}

window.toggleVisibility = (id) => {
    const obj = state.objects.find(o => o.id === id);
    if (obj) {
        obj.hidden = !obj.hidden;
        render();
        updateLayersList();
    }
};

// --- Toolbar Logic ---

const tools = document.querySelectorAll('.tool-btn');
tools.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.querySelector('input')) return; // Skip file input
        
        // Visual update
        tools.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        
        state.tool = btn.dataset.tool;
        state.selection = null; // Deselect when changing tool
        render();
        updateCursor();
        hideToolPop();
    });

    // Long press for tool settings
    btn.addEventListener('pointerdown', () => {
        const t = btn.dataset.tool;
        if (!toolPopTools.has(t)) return;
        toolHoldTimer = setTimeout(() => showToolPop(t, btn), 400);
    });
    ['pointerup','pointerleave','pointercancel'].forEach(ev => {
        btn.addEventListener(ev, () => {
            if (toolHoldTimer) {
                clearTimeout(toolHoldTimer);
                toolHoldTimer = null;
            }
        });
    });
});

if (colorInput) {
    colorInput.addEventListener('input', (e) => {
        setColor(e.target.value);
        closeColorPop();
    });
}

document.getElementById('stroke-width').addEventListener('input', (e) => {
    state.strokeWidth = parseInt(e.target.value, 10);
    if (state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj) {
            if (obj.type === 'text') {
                obj.size = strokeToFontSize(state.strokeWidth);
            } else {
                obj.strokeWidth = state.strokeWidth;
            }
            saveState();
            render();
        }
    }
});

function updateUI() {
    tools.forEach(t => {
        t.classList.toggle('active', t.dataset.tool === state.tool);
    });
    updateCursor();
}

function updateCursor() {
    canvas.style.cursor = 'default';
    if (state.tool === 'select') canvas.style.cursor = 'default';
    else if (state.tool === 'text') canvas.style.cursor = 'text';
    else if (state.tool === 'eraser') canvas.style.cursor = 'none'; // Custom eraser
    else canvas.style.cursor = 'crosshair';
}

// --- Coordinate Systems ---

function toWorld(x, y) {
    return {
        x: (x - width / 2) / state.camera.zoom + state.camera.x,
        y: (y - height / 2) / state.camera.zoom + state.camera.y
    };
}

function toScreen(x, y) {
    return {
        x: (x - state.camera.x) * state.camera.zoom + width / 2,
        y: (y - state.camera.y) * state.camera.zoom + height / 2
    };
}

// --- Interaction Logic ---

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('wheel', handleWheel, { passive: false });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { undo(); e.preventDefault(); }
    if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { redo(); e.preventDefault(); }
    if (e.key === 'Shift') { state.isShiftDown = true; if(!state.isDrawing) canvas.classList.add('cursor-hand'); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selection) {
        state.objects = state.objects.filter(o => o.id !== state.selection);
        state.selection = null;
        saveState();
        render();
        updateLayersList();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') { state.isShiftDown = false; canvas.classList.remove('cursor-hand'); }
});

function handleMouseDown(e) {
    const mouse = { x: e.clientX, y: e.clientY };
    const world = toWorld(mouse.x, mouse.y);
    state.lastMouse = mouse;
    state.startPos = world;

    // Pan Logic (Shift + Drag or Middle Click)
    if (state.isShiftDown || e.button === 1) {
        state.isPanning = true;
        canvas.classList.add('cursor-grabbing');
        return;
    }

    state.isDrawing = true;

    if (state.tool === 'select') {
        const selectedObj = state.selection ? state.objects.find(o => o.id === state.selection) : null;
        if (selectedObj && isOnScaleHandle(selectedObj, mouse)) {
            startScaling(selectedObj, world);
            state.isDrawing = false;
            return;
        }
        // Hit Test
        const clickedObj = hitTest(world.x, world.y);
        state.selection = clickedObj ? clickedObj.id : null;
        updateLayersList();
        render();
    } else if (state.tool === 'text') {
        // Text is handled in createText function, but we initiate here
        createTextInput(e.clientX, e.clientY, world.x, world.y);
        state.isDrawing = false; // Don't drag
        return;
    } else if (state.tool === 'eraser') {
        handleEraser(world.x, world.y);
    } else {
        // Create new Object
    const id = Date.now().toString();
    let newObj = {
        id,
        type: state.tool,
        x: world.x,
        y: world.y,
        color: state.color,
        strokeWidth: state.strokeWidth,
        hidden: false
    };
    ensureTypeIndex(newObj);
    const toolCfg = toolSettings[state.tool] || {};
    newObj.dashStyle = toolCfg.dash || 'solid';
    if (state.tool === 'arrow') {
        newObj.headScale = toolCfg.headScale || 1;
        newObj.headType = toolCfg.headType || 'classic';
        newObj.doubleHead = !!toolCfg.doubleHead;
    }

        if (state.tool === 'pen') {
            newObj.points = [{ x: world.x, y: world.y }];
        } else if (['line', 'arrow', 'rect', 'ellipse'].includes(state.tool)) {
            newObj.w = 0;
            newObj.h = 0; // Or endX, endY
            newObj.ex = world.x;
            newObj.ey = world.y;
        }

        state.objects.push(newObj);
        state.currentObj = newObj;
    }
    render();
}

function handleMouseMove(e) {
    const mouse = { x: e.clientX, y: e.clientY };
    const world = toWorld(mouse.x, mouse.y);
    const dx = mouse.x - state.lastMouse.x;
    const dy = mouse.y - state.lastMouse.y;

    state.lastMouse = mouse;
    state.currentMouseWorld = world; // for eraser cursor

    if (state.isPanning) {
        state.camera.x -= dx / state.camera.zoom;
        state.camera.y -= dy / state.camera.zoom;
        render();
        return;
    }

    if (state.isScaling && state.scaleInfo) {
        applyScaleDrag(world);
        render();
        return;
    }

    if (!state.isDrawing) {
        if(state.tool === 'eraser') render(); // Re-render for eraser cursor
        return;
    }

    if (state.tool === 'select' && state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj) {
            // Move object
            if (obj.type === 'pen') {
                obj.points.forEach(p => { p.x += dx / state.camera.zoom; p.y += dy / state.camera.zoom; });
            } else {
                obj.x += dx / state.camera.zoom;
                obj.y += dy / state.camera.zoom;
                if(obj.ex) { obj.ex += dx / state.camera.zoom; obj.ey += dy / state.camera.zoom; }
            }
        }
    } else if (state.tool === 'eraser') {
        handleEraser(world.x, world.y);
    } else if (state.currentObj) {
        // Update shape being drawn
        const obj = state.currentObj;
        if (state.tool === 'pen') {
            obj.points.push({ x: world.x, y: world.y });
        } else {
            obj.ex = world.x;
            obj.ey = world.y;
            obj.w = world.x - obj.x;
            obj.h = world.y - obj.y;
        }
    }
    render();
}

function handleMouseUp(e) {
    if (state.isPanning) {
        state.isPanning = false;
        canvas.classList.remove('cursor-grabbing');
        return;
    }
    if (state.isScaling) {
        state.isScaling = false;
        state.scaleInfo = null;
        saveState();
        render();
        updateLayersList();
        return;
    }
    hideToolPop();
    
    if (state.isDrawing) {
        if (state.tool !== 'select' && state.tool !== 'eraser' && state.currentObj) {
            // Finish drawing
            saveState();
            state.currentObj = null;
            updateLayersList();
        } else if (state.tool === 'select' && state.selection) {
            saveState(); // Saved move
        } else if (state.tool === 'eraser') {
            saveState();
        }
    }
    state.isDrawing = false;
}

function handleWheel(e) {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = Math.exp(wheel * zoomIntensity);

    // Zoom towards mouse pointer
    const mouseWorldBefore = toWorld(e.clientX, e.clientY);
    
    state.camera.zoom *= zoomFactor;
    state.camera.zoom = Math.max(0.1, Math.min(state.camera.zoom, 10)); // Clamp

    const mouseWorldAfter = toWorld(e.clientX, e.clientY);
    
    state.camera.x += (mouseWorldBefore.x - mouseWorldAfter.x);
    state.camera.y += (mouseWorldBefore.y - mouseWorldAfter.y);

    render();
}

// --- Tools Implementation ---

function hitTest(x, y) {
    // Reverse iterate to select top-most
    for (let i = state.objects.length - 1; i >= 0; i--) {
        const o = state.objects[i];
        if (o.hidden) continue;

        if (o.type === 'rect' || o.type === 'image') {
            const bx = Math.min(o.x, o.x + o.w);
            const by = Math.min(o.y, o.y + o.h);
            const bw = Math.abs(o.w);
            const bh = Math.abs(o.h);
            if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) return o;
        } else if (o.type === 'ellipse') {
            const cx = o.x + o.w/2;
            const cy = o.y + o.h/2;
            const rx = Math.abs(o.w/2);
            const ry = Math.abs(o.h/2);
            if (Math.pow((x - cx)/rx, 2) + Math.pow((y - cy)/ry, 2) <= 1) return o;
        } else if (o.type === 'text') {
            // Approx hit box for text
            ctx.font = `${o.size || 20}px sans-serif`;
            const m = ctx.measureText(o.text);
            if (x >= o.x && x <= o.x + m.width && y >= o.y - (o.size||20) && y <= o.y) return o;
        } else if (o.type === 'line' || o.type === 'arrow') {
            if (distToSegment({x,y}, {x:o.x, y:o.y}, {x:o.ex, y:o.ey}) < 10) return o;
        } else if (o.type === 'pen') {
            for (let p of o.points) {
                if (Math.hypot(p.x - x, p.y - y) < o.strokeWidth + 5) return o;
            }
        }
    }
    return null;
}

function handleEraser(x, y) {
    const target = hitTest(x, y);
    if (!target) return;

    state.objects = state.objects.filter(o => o.id !== target.id);
    if (state.selection === target.id) state.selection = null;
    updateLayersList();
}

// Distance from point p to segment v-w
function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}


// --- Text Tool Special Handling ---

function createTextInput(screenX, screenY, worldX, worldY) {
    const input = document.createElement('textarea');
    input.className = 'temp-text-input';
    input.style.left = screenX + 'px';
    input.style.top = screenY + 'px';
    input.style.color = state.color;
    const textSize = strokeToFontSize(state.strokeWidth);
    input.style.fontSize = Math.max(12, textSize * state.camera.zoom) + 'px'; // Scale font slightly for visual cue
    
    document.getElementById('text-input-container').appendChild(input);
    
    // Auto focus
    setTimeout(() => input.focus(), 10);

    const finish = () => {
        const text = input.value.trim();
        if (text) {
            const obj = {
                id: Date.now().toString(),
                type: 'text',
                x: worldX,
                y: worldY,
                text: text,
                color: state.color,
                size: textSize, // Base size tied to stroke slider
                strokeWidth: state.strokeWidth,
                hidden: false
            };
            ensureTypeIndex(obj);
            state.objects.push(obj);
            saveState();
            updateLayersList();
            render();
        }
        input.remove();
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            input.blur();
        }
        e.stopPropagation(); // Prevent app shortcuts
    });
}

// --- Image Upload ---

document.getElementById('img-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
            // Center of screen
            const c = toWorld(width/2, height/2);
            // Scale down if huge
            let w = img.width;
            let h = img.height;
            if (w > 500) { const r = 500/w; w*=r; h*=r; }

            const obj = {
                id: Date.now().toString(),
                type: 'image',
                x: c.x - w/2,
                y: c.y - h/2,
                w: w,
                h: h,
                imgData: img, // Store actual Image object
                hidden: false
            };
            ensureTypeIndex(obj);
            state.objects.push(obj);
            saveState();
            updateLayersList();
            render();
        };
        img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
    // Reset input
    this.value = '';
});

// --- Rendering ---

function render() {
    // Clear whole canvas
    ctx.clearRect(0, 0, width, height);
    
    // Save context for camera transform
    ctx.save();
    
    // Apply camera
    ctx.translate(width / 2, height / 2);
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x, -state.camera.y);

    // Grid dots
    if (state.showGrid) {
        const spacing = 60;
        const radius = 1.5 / Math.max(1, state.camera.zoom * 0.8);
        const viewLeft = state.camera.x - (width / 2) / state.camera.zoom;
        const viewRight = state.camera.x + (width / 2) / state.camera.zoom;
        const viewTop = state.camera.y - (height / 2) / state.camera.zoom;
        const viewBottom = state.camera.y + (height / 2) / state.camera.zoom;
        const startX = Math.floor(viewLeft / spacing) * spacing;
        const startY = Math.floor(viewTop / spacing) * spacing;
        ctx.fillStyle = state.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
        for (let x = startX; x <= viewRight; x += spacing) {
            for (let y = startY; y <= viewBottom; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Draw Objects
    state.objects.forEach(obj => {
        if (obj.hidden) return;

        ctx.strokeStyle = obj.color;
        ctx.fillStyle = obj.color;
        ctx.lineWidth = obj.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;

        if (obj.id === state.selection) {
            // Draw highlight behind
            ctx.save();
            ctx.strokeStyle = '#6c5ce7';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            const box = getBoundingBox(obj);
            if (box) {
                ctx.strokeRect(box.x - 5, box.y - 5, box.w + 10, box.h + 10);
                drawScaleHandle(box);
            }
            ctx.restore();
        }

        ctx.setLineDash(dashArray(obj.dashStyle));
        ctx.beginPath();

        if (obj.type === 'pen') {
            if (obj.points.length === 1) {
                const p = obj.points[0];
                ctx.beginPath();
                ctx.arc(p.x, p.y, obj.strokeWidth / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.moveTo(obj.points[0].x, obj.points[0].y);
                // Simple smoothing (quadratic bezier)
                for (let i = 1; i < obj.points.length - 2; i++) {
                    const c = { 
                        x: (obj.points[i].x + obj.points[i+1].x) / 2, 
                        y: (obj.points[i].y + obj.points[i+1].y) / 2 
                    };
                    ctx.quadraticCurveTo(obj.points[i].x, obj.points[i].y, c.x, c.y);
                }
                // Last two points
                if(obj.points.length > 2) {
                    const last = obj.points[obj.points.length-1];
                    ctx.lineTo(last.x, last.y);
                }
                ctx.stroke();
            }

        } else if (obj.type === 'line') {
            ctx.moveTo(obj.x, obj.y);
            ctx.lineTo(obj.ex, obj.ey);
            ctx.stroke();

        } else if (obj.type === 'arrow') {
            const headlen = Math.max(10, obj.strokeWidth * 2 * (obj.headScale || 1)); 
            const angle = Math.atan2(obj.ey - obj.y, obj.ex - obj.x);
            const ux = Math.cos(angle);
            const uy = Math.sin(angle);
            const inset = headlen * 0.6;
            const sx = obj.x + (obj.doubleHead ? ux * inset : 0);
            const sy = obj.y + (obj.doubleHead ? uy * inset : 0);
            const exLine = obj.ex - ux * inset;
            const eyLine = obj.ey - uy * inset;
            ctx.moveTo(sx, sy);
            ctx.lineTo(exLine, eyLine);
            ctx.stroke();
            
            // Arrowhead types
            const headType = obj.headType || 'classic';
            ctx.setLineDash([]); // heads always solid
            drawArrowHead(ctx, obj.ex, obj.ey, angle, headlen, headType);
            if (obj.doubleHead) {
                drawArrowHead(ctx, obj.x, obj.y, angle + Math.PI, headlen, headType);
            }

        } else if (obj.type === 'rect') {
            ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);

        } else if (obj.type === 'ellipse') {
            ctx.ellipse(obj.x + obj.w/2, obj.y + obj.h/2, Math.abs(obj.w/2), Math.abs(obj.h/2), 0, 0, 2 * Math.PI);
            ctx.stroke();

        } else if (obj.type === 'text') {
            ctx.font = `${obj.size}px sans-serif`;
            ctx.fillStyle = obj.color;
            ctx.fillText(obj.text, obj.x, obj.y);

        } else if (obj.type === 'image') {
            if(obj.imgData) {
                ctx.drawImage(obj.imgData, obj.x, obj.y, obj.w, obj.h);
            }
        }
    });

    // Draw Eraser Cursor
    if (state.tool === 'eraser' && !state.isPanning && state.currentMouseWorld) {
        ctx.save();
        ctx.strokeStyle = state.theme === 'dark' ? '#fff' : '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Scale circle by 1/zoom to keep constant screen size, or use world size
        // Request implied visual feedback. Let's make it world relative.
        const r = Math.max(5, state.strokeWidth * 2);
        ctx.arc(state.currentMouseWorld.x, state.currentMouseWorld.y, r, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.restore();
}

function startScaling(obj, mouseWorld) {
    const box = getBoundingBox(obj);
    if (!box) return;
    const center = { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const handle = { x: box.x + box.w, y: box.y };
    const startVec = { x: handle.x - center.x, y: handle.y - center.y };
    const startLen = Math.max(0.001, Math.hypot(startVec.x, startVec.y));
    state.isScaling = true;
    state.scaleInfo = {
        objId: obj.id,
        center,
        startLen,
        original: cloneObject(obj),
        originalBox: box
    };
}

function applyScaleDrag(mouseWorld) {
    if (!state.scaleInfo) return;
    const info = state.scaleInfo;
    const obj = state.objects.find(o => o.id === info.objId);
    if (!obj) return;
    const vec = { x: mouseWorld.x - info.center.x, y: mouseWorld.y - info.center.y };
    const len = Math.max(0.001, Math.hypot(vec.x, vec.y));
    const scale = Math.max(0.05, len / info.startLen);
    const o = info.original;
    const c = info.center;

    const applyStrokeScale = () => {
        if (o.strokeWidth) obj.strokeWidth = Math.max(0.5, o.strokeWidth * scale);
    };

    if (obj.type === 'pen' && o.points) {
        obj.points = o.points.map(p => ({
            x: c.x + (p.x - c.x) * scale,
            y: c.y + (p.y - c.y) * scale
        }));
        applyStrokeScale();
    } else if (obj.type === 'line' || obj.type === 'arrow') {
        obj.x = c.x + (o.x - c.x) * scale;
        obj.y = c.y + (o.y - c.y) * scale;
        obj.ex = c.x + (o.ex - c.x) * scale;
        obj.ey = c.y + (o.ey - c.y) * scale;
        applyStrokeScale();
    } else if (obj.type === 'rect' || obj.type === 'ellipse' || obj.type === 'image') {
        const newW = (info.originalBox.w || 0) * scale;
        const newH = (info.originalBox.h || 0) * scale;
        obj.w = newW;
        obj.h = newH;
        obj.x = c.x - newW / 2;
        obj.y = c.y - newH / 2;
        applyStrokeScale();
    } else if (obj.type === 'text') {
        obj.size = Math.max(4, (o.size || 20) * scale);
        obj.x = c.x + (o.x - c.x) * scale;
        obj.y = c.y + (o.y - c.y) * scale;
        obj.strokeWidth = Math.max(0.5, (o.strokeWidth || 1) * scale);
    }
}

function startLayerDrag(e, index) {
    state.layerDrag = { from: index, to: index };
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', 'layer'); } catch (_) {}
    e.currentTarget.classList.add('dragging');
}

function layerDragOver(e, index) {
    e.preventDefault();
    if (!state.layerDrag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const target = after ? index + 1 : index;
    state.layerDrag.to = target;

    layersList.querySelectorAll('.layer-item').forEach(el => el.classList.remove('drop-before', 'drop-after'));
    e.currentTarget.classList.add(after ? 'drop-after' : 'drop-before');
}

function layerDrop(e, index) {
    e.preventDefault();
    if (!state.layerDrag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    state.layerDrag.to = after ? index + 1 : index;
    finalizeLayerReorder();
}

function endLayerDrag() {
    finalizeLayerReorder();
}

function finalizeLayerReorder() {
    layersList.querySelectorAll('.layer-item').forEach(el => {
        el.classList.remove('dragging');
        el.classList.remove('drop-before');
        el.classList.remove('drop-after');
    });
    if (!state.layerDrag) return;
    const from = state.layerDrag.from;
    let to = state.layerDrag.to;
    state.layerDrag = null;
    if (from === undefined || to === undefined || from === to) return;
    const moved = state.objects.splice(from, 1)[0];
    if (to > from) to -= 1;
    to = Math.max(0, Math.min(state.objects.length, to));
    state.objects.splice(to, 0, moved);
    saveState();
    render();
    updateLayersList();
}

// --- History (Undo/Redo) ---

function saveState() {
    // Deep copy objects (simplified)
    // Note: Image objects contain DOM elements, so we reference them.
    // For a real production app, you'd serialize differently.
    const snapshot = state.objects.map(o => ({...o, points: o.points ? [...o.points] : null}));
    
    // Remove future states
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(snapshot);
    state.historyIndex++;
}

// Initial state
saveState();

function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreState(state.history[state.historyIndex]);
    }
}

function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreState(state.history[state.historyIndex]);
    }
}

function restoreState(snapshot) {
    // We need to preserve imgData references if they are missing in JSON copy
    // But since we did a shallow copy of properties + deep of points, refs should be ok.
    state.objects = snapshot.map(o => ({...o, points: o.points ? [...o.points] : null}));
    ensureAllTypeIndices();
    state.selection = null;
    render();
    updateLayersList();
}

document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);
document.getElementById('clear-btn').addEventListener('click', () => {
    state.objects = [];
    saveState();
    render();
    updateLayersList();
});

// --- Export Image ---

document.getElementById('download-btn').addEventListener('click', () => {
    if (state.objects.length === 0) return;

    // 1. Calculate Bounding Box of all content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    state.objects.forEach(o => {
        if(o.hidden) return;
        let ox=o.x, oy=o.y, ow=0, oh=0;
        
        if (o.type === 'pen') {
            o.points.forEach(p => {
                if(p.x < minX) minX = p.x;
                if(p.x > maxX) maxX = p.x;
                if(p.y < minY) minY = p.y;
                if(p.y > maxY) maxY = p.y;
            });
            return;
        } else if (o.type === 'line' || o.type === 'arrow') {
            minX = Math.min(minX, o.x, o.ex);
            maxX = Math.max(maxX, o.x, o.ex);
            minY = Math.min(minY, o.y, o.ey);
            maxY = Math.max(maxY, o.y, o.ey);
            return;
        } else if (o.type === 'text') {
             // approximate text dims
             ctx.font = `${o.size}px sans-serif`;
             const m = ctx.measureText(o.text);
             ow = m.width; oh = o.size; oy = o.y - o.size;
        } else {
            ow = o.w; oh = o.h;
        }
        
        // Normalize rects with negative w/h
        let bx = ox, by = oy;
        if(ow < 0) { bx += ow; ow = Math.abs(ow); }
        if(oh < 0) { by += oh; oh = Math.abs(oh); }
        
        if (bx < minX) minX = bx;
        if (bx + ow > maxX) maxX = bx + ow;
        if (by < minY) minY = by;
        if (by + oh > maxY) maxY = by + oh;
    });

    // Add padding
    const padding = 50;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;
    
    const w = maxX - minX;
    const h = maxY - minY;

    // 2. Create Temp Canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext('2d');

    // 3. Fill Background
    tCtx.fillStyle = state.theme === 'dark' ? '#121212' : '#f0f2f5';
    tCtx.fillRect(0,0,w,h);

    // 4. Draw Objects shifted by -minX, -minY
    tCtx.translate(-minX, -minY);
    
    // Reuse render logic? Hard to decouple. Let's reimplement simple draw loop for export.
    state.objects.forEach(obj => {
        if(obj.hidden) return;
        tCtx.setLineDash(dashArray(obj.dashStyle));
        tCtx.strokeStyle = obj.color;
        tCtx.fillStyle = obj.color;
        tCtx.lineWidth = obj.strokeWidth;
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';
        
        tCtx.beginPath();
        if (obj.type === 'pen') {
            if(obj.points.length<2) return;
            tCtx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length - 2; i++) {
                const c = { x: (obj.points[i].x + obj.points[i+1].x)/2, y: (obj.points[i].y + obj.points[i+1].y)/2 };
                tCtx.quadraticCurveTo(obj.points[i].x, obj.points[i].y, c.x, c.y);
            }
            if(obj.points.length>2) tCtx.lineTo(obj.points[obj.points.length-1].x, obj.points[obj.points.length-1].y);
            tCtx.stroke();
        } else if (obj.type === 'rect') {
            tCtx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        } else if (obj.type === 'ellipse') {
            tCtx.ellipse(obj.x + obj.w/2, obj.y + obj.h/2, Math.abs(obj.w/2), Math.abs(obj.h/2), 0, 0, 2*Math.PI);
            tCtx.stroke();
        } else if (obj.type === 'line') {
            tCtx.moveTo(obj.x, obj.y); tCtx.lineTo(obj.ex, obj.ey); tCtx.stroke();
        } else if (obj.type === 'arrow') {
            const headlen = Math.max(10, obj.strokeWidth * 2 * (obj.headScale || 1)); 
            const angle = Math.atan2(obj.ey - obj.y, obj.ex - obj.x);
            const ux = Math.cos(angle);
            const uy = Math.sin(angle);
            const inset = headlen * 0.6;
            const sx = obj.x + (obj.doubleHead ? ux * inset : 0);
            const sy = obj.y + (obj.doubleHead ? uy * inset : 0);
            const exLine = obj.ex - ux * inset;
            const eyLine = obj.ey - uy * inset;
            tCtx.moveTo(sx, sy); tCtx.lineTo(exLine, eyLine); tCtx.stroke();
            const headType = obj.headType || 'classic';
            tCtx.setLineDash([]);
            drawArrowHead(tCtx, obj.ex, obj.ey, angle, headlen, headType);
            if (obj.doubleHead) {
                drawArrowHead(tCtx, obj.x, obj.y, angle + Math.PI, headlen, headType);
            }
        } else if (obj.type === 'text') {
            tCtx.font = `${obj.size}px sans-serif`;
            tCtx.fillText(obj.text, obj.x, obj.y);
        } else if (obj.type === 'image' && obj.imgData) {
            tCtx.drawImage(obj.imgData, obj.x, obj.y, obj.w, obj.h);
        }
    });

    // 5. Download
    const link = document.createElement('a');
    link.download = 'canvas-note.png';
    link.href = tempCanvas.toDataURL();
    link.click();
});
// Arrow head modal
function syncHeadModal() {
    const types = headModal.querySelectorAll('.head-type');
    types.forEach(t => t.classList.remove('active'));
    const active = headModal.querySelector(`.head-type[data-head="${pendingHead.type}"]`);
    if (active) active.classList.add('active');
    if (headSizeSlider) headSizeSlider.value = Math.min(3, Math.max(0.5, pendingHead.scale / 2.5));
    if (headBothToggle) headBothToggle.checked = !!pendingHead.doubleHead;
}

function openHeadModal() {
    if (!headModal) return;
    pendingHead.type = toolSettings.arrow.headType || 'classic';
    pendingHead.scale = toolSettings.arrow.headScale || 1;
    pendingHead.doubleHead = toolSettings.arrow.doubleHead || false;
    syncHeadModal();
    // Position near chooser (top-right of options)
    const optsRect = toolPop.getBoundingClientRect();
    headModal.style.left = `${optsRect.right - 40}px`;
    headModal.style.top = `${optsRect.top - 220}px`;
    headModal.classList.add('open');
}

function closeHeadModal() {
    if (headModal) headModal.classList.remove('open');
}

function applyHeadModal() {
    toolSettings.arrow.headType = pendingHead.type;
    toolSettings.arrow.headScale = pendingHead.scale;
    toolSettings.arrow.doubleHead = pendingHead.doubleHead;
    if (state.selection) {
        const obj = state.objects.find(o => o.id === state.selection);
        if (obj && obj.type === 'arrow') {
            obj.headType = toolSettings.arrow.headType;
            obj.headScale = toolSettings.arrow.headScale;
            obj.doubleHead = toolSettings.arrow.doubleHead;
            saveState();
            render();
        }
    }
}

if (headModal) {
    headModal.addEventListener('click', (e) => {
        if (e.target === headModal) closeHeadModal();
        const headBtn = e.target.closest('.head-type');
        if (headBtn) {
            pendingHead.type = headBtn.dataset.head;
            applyHeadModal();
            syncHeadModal();
        }
    });
}
if (headSizeSlider) {
    headSizeSlider.addEventListener('input', (e) => {
        pendingHead.scale = parseFloat(e.target.value) * 2.5;
        applyHeadModal();
    });
}
if (headBothToggle) {
    headBothToggle.addEventListener('change', (e) => {
        pendingHead.doubleHead = e.target.checked;
        applyHeadModal();
    });
}
if (headCloseBtn) headCloseBtn.addEventListener('click', closeHeadModal);
document.addEventListener('pointerdown', (e) => {
    if (headModal && headModal.classList.contains('open')) {
        if (!headModal.contains(e.target) && !e.target.closest('.tool-option[data-key="head"]')) {
            closeHeadModal();
        }
    }
});
