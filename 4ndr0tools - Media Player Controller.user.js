// ==UserScript==
// @name         4ndr0tools - Media Player Controller
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.0
// @author       4ndr0666
// @description  Speed • Alt+Shift Drag+Wheel Zoom/Pan • Rotation • Maximize • PiP
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         data:image/png;base64,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
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @all_frames   true
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    if (window.mediaGodmodeLoaded) return;
    window.mediaGodmodeLoaded = true;

    let targetSpeed = GM_getValue('media_speed', 1.0);
    let currentRotation = 0;
    let currentZoom = 1.0;
    let panX = 50;
    let panY = 50;
    let isPanning = false;

    const applyMediaState = () => {
        document.querySelectorAll("video").forEach(v => {
            v.playbackRate = targetSpeed;
            v.style.transform = `rotate(${currentRotation}deg) scale(${currentZoom})`;
            v.style.transformOrigin = `${panX}% ${panY}%`;
            v.style.objectPosition = `${panX}% ${panY}%`;
        });
    };

    document.addEventListener('play', e => {
        if (e.target.tagName === 'VIDEO') applyMediaState();
    }, true);

    setInterval(applyMediaState, 600);

    GM_addValueChangeListener('media_speed', (_, __, val) => { targetSpeed = val; applyMediaState(); });

    if (window !== window.top) return;

    const ui = document.createElement('div');
    ui.id = 'media-godmode-ui';
    ui.innerHTML = `
        <div id="mg-title">Ψ 4NDR0666 // MEDIA GODMODE</div>
        <div class="mg-row speed-row">
            <button data-speed="0.25">0.25</button>
            <button data-speed="0.50">0.50</button>
            <button data-speed="0.75">0.75</button>
            <button data-speed="1.00" class="active">1.00</button>
            <button data-speed="1.50">1.50</button>
            <button data-speed="2.00">2.00</button>
            <button data-speed="3.00">3.00</button>
        </div>
        <div class="mg-row">
            <span>Rotate</span>
            <input type="range" id="rotate-slider" min="0" max="360" value="0" step="1">
            <span id="rotate-val">0°</span>
            <button id="rotate-reset">↺</button>
        </div>
        <div class="mg-actions">
            <button id="mg-view-reset">RESET VIEW</button>
            <button id="mg-maximize">MAXIMIZE</button>
            <button id="mg-pip">PiP</button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        :root {
            --bg-dark-base: #050A0F;
            --bg-glass-panel: rgba(10,19,26,0.32);
            --accent-cyan: #00E5FF;
            --text-cyan-active: #67E8F9;
            --accent-cyan-border-idle: rgba(0,229,255,0.22);
            --accent-cyan-bg-active: rgba(0,229,255,0.18);
            --glow-cyan-active: rgba(0,229,255,0.35);
            --font-body: 'Roboto Mono', monospace;
        }
        #media-godmode-ui {
            position: fixed; z-index: 2147483647; padding: 12px 16px;
            background: var(--bg-glass-panel); backdrop-filter: blur(16px);
            border: 1px solid var(--accent-cyan-border-idle);
            border-top: 1px solid rgba(255,255,255,0.09);
            border-left: 1px solid rgba(255,255,255,0.09);
            border-radius: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 0 20px var(--glow-cyan-active);
            color: #e0ffff; font-family: var(--font-body); user-select: none; cursor: move;
            font-size: 11px;
        }
        #media-godmode-ui.dragging { box-shadow: 0 0 35px var(--glow-cyan-active); }
        #mg-title { font-size: 10px; font-weight: 700; margin-bottom: 10px; text-align: center; letter-spacing: 1.5px; text-shadow: 0 0 6px var(--accent-cyan); }
        .mg-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
        button { background: rgba(0,0,0,0.55); border: 1px solid rgba(0,229,255,0.35); color: #e0ffff; padding: 5px 9px; border-radius: 3px; cursor: pointer; transition: all 0.2s; font-size: 10.5px; }
        button:hover { border-color: var(--accent-cyan); background: rgba(0,229,255,0.08); }
        button.active { color: var(--text-cyan-active); background: var(--accent-cyan-bg-active); border-color: var(--accent-cyan); box-shadow: 0 0 10px var(--glow-cyan-active); }
        input[type="range"] { accent-color: var(--accent-cyan); width: 130px; height: 4px; }
        .mg-actions { display: flex; gap: 6px; }
        .mg-actions button { flex: 1; padding: 7px 0; font-size: 10px; letter-spacing: 0.5px; }
        #mg-maximize { color: #67E8F9; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(ui);

    // Draggable
    let isDragging = false, ox = 0, oy = 0;
    const title = ui.querySelector('#mg-title');
    title.addEventListener('mousedown', e => { isDragging = true; ox = e.clientX - ui.offsetLeft; oy = e.clientY - ui.offsetTop; ui.classList.add('dragging'); });
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        let nl = Math.max(10, Math.min(e.clientX - ox, window.innerWidth - ui.offsetWidth - 10));
        let nt = Math.max(10, Math.min(e.clientY - oy, window.innerHeight - ui.offsetHeight - 10));
        ui.style.left = nl + 'px'; ui.style.top = nt + 'px'; ui.style.bottom = 'auto'; ui.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) { isDragging = false; ui.classList.remove('dragging');
            GM_setValue('media_pos', {left: ui.style.left, top: ui.style.top});
        }
    });

    const saved = GM_getValue('media_pos');
    if (saved) { ui.style.left = saved.left; ui.style.top = saved.top; }
    else { ui.style.bottom = '35px'; ui.style.right = '35px'; }

    // Speed
    const speedButtons = ui.querySelectorAll('.speed-row button');
    const updateActiveSpeed = (speed) => speedButtons.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === speed));
    updateActiveSpeed(targetSpeed);
    speedButtons.forEach(btn => btn.addEventListener('click', () => {
        const ns = parseFloat(btn.dataset.speed);
        GM_setValue('media_speed', ns);
        updateActiveSpeed(ns);
    }));

    // Rotation
    const rotSlider = ui.querySelector('#rotate-slider');
    const rotVal = ui.querySelector('#rotate-val');
    rotSlider.addEventListener('input', () => {
        currentRotation = parseInt(rotSlider.value);
        rotVal.textContent = currentRotation + '°';
        applyMediaState();
    });
    ui.querySelector('#rotate-reset').addEventListener('click', () => {
        currentRotation = 0; rotSlider.value = 0; rotVal.textContent = '0°'; applyMediaState();
    });

    // Reset View
    ui.querySelector('#mg-view-reset').addEventListener('click', () => {
        currentZoom = 1.0; panX = 50; panY = 50; applyMediaState();
    });

    // Maximize + PiP
    let isMax = false;
    ui.querySelector('#mg-maximize').addEventListener('click', () => {
        const v = document.querySelector('video');
        if (!v) return;
        if (!isMax) {
            document.documentElement.style.overflow = 'hidden';
            v.style.position = 'fixed'; v.style.inset = '0'; v.style.zIndex = '2147483646'; v.style.background = '#000';
            isMax = true; ui.querySelector('#mg-maximize').textContent = 'RESTORE';
        } else {
            v.style.cssText = ''; document.documentElement.style.overflow = ''; isMax = false;
            ui.querySelector('#mg-maximize').textContent = 'MAXIMIZE';
        }
        applyMediaState();
    });

    ui.querySelector('#mg-pip').addEventListener('click', () => {
        const v = document.querySelector('video');
        if (v) document.pictureInPictureElement ? document.exitPictureInPicture() : v.requestPictureInPicture();
    });

    // Alt+M toggle
    let hudVisible = true;
    document.addEventListener('keydown', e => {
        if (e.altKey && e.key.toLowerCase() === 'm') {
            hudVisible = !hudVisible;
            ui.style.display = hudVisible ? 'block' : 'none';
        }
        if (e.key === 'Escape' && isMax) ui.querySelector('#mg-maximize').click();
    });

    // Alt+Shift: Pan (drag) + Zoom (wheel)
    document.addEventListener('mousedown', e => {
        if (e.altKey && e.shiftKey) { isPanning = true; e.preventDefault(); }
    });
    document.addEventListener('mousemove', e => {
        if (!isPanning) return;
        const video = document.querySelector('video');
        if (!video) return;
        const rect = video.getBoundingClientRect();
        panX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        panY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        applyMediaState();
    });
    document.addEventListener('mouseup', () => { isPanning = false; });

    document.addEventListener('wheel', e => {
        if (!e.altKey || !e.shiftKey) return;
        const video = document.querySelector('video');
        if (!video) return;
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        currentZoom = Math.max(0.5, Math.min(4.0, currentZoom + delta));
        applyMediaState();
        e.preventDefault();
    }, { passive: false });

    console.log('%c[4NDR0666OS] Media Godmode v3.3.1 3lectric Glass Minimal — HUD decluttered', 'color:#00E5FF;');
})();
