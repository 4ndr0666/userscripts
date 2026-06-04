// ==UserScript==
// @name         4ndr0tools - Media Player Controller
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.0.0
// @author       4ndr0666
// @description  Speed • Alt+Shift rAF Zoom/Pan • Rotation • Smart Maximize • PiP • Play • DblClick • Pause-on-Acquire • Virtual DOM Nodes • IG Story Nav • Story Repeat • Draggable HUD • Space Hotkey
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Media%20Player%20Controller.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Media%20Player%20Controller.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_addValueChangeListener
// @all_frames   true
// @run-at       document-end
// ==/UserScript==


(function () {
    'use strict';

    // ==========================================
    // SINGLETON GUARD
    // ==========================================
    if (window.psiMediaGodmodeLoaded) return;
    window.psiMediaGodmodeLoaded = true;

    // ==========================================
    // INTERNAL STATE & TARGETING
    // ==========================================
    let activeVideo = null;
    let targetSpeed = GM_getValue('media_speed', 1.0);

    const state = {
        rotation:    0,
        zoom:        1.0,
        panX:        50,
        panY:        50,
        isMaximized: false,
        isPlaying:   false
    };

    // ==========================================
    // VIRTUAL DOM — localStorage Node Registry
    // ==========================================
    // Each video on the page is registered by a stable key derived from its src
    // or position-in-page. Off-screen videos are swapped out for lightweight
    // <div class="psi-video-placeholder"> nodes to reduce memory pressure.
    // On scroll/return the placeholder is replaced with a real <video> element
    // re-hydrated from stored state (src, currentTime, muted, volume).
    //
    // localStorage schema (key: "psi_vnode_<stableId>"):
    // {
    //   stableId:    string,
    //   src:         string,
    //   currentTime: number,
    //   muted:       boolean,
    //   volume:      number,
    //   loop:        boolean,
    //   rect:        { top, left, width, height }
    // }

    const VNODE_PREFIX = 'psi_vnode_';
    const VNODE_MARGIN = 200; // px outside viewport before pruning

    /**
     * Generates a stable identity string for a video element.
     * Prefers src, falls back to page-order index.
     */
    function getStableId(video) {
        const src = video.currentSrc || video.src || '';
        if (src) {
            try {
                const u = new URL(src);
                return 'src_' + (u.pathname + u.search).slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_');
            } catch (_) {
                return 'raw_' + src.slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_');
            }
        }
        const all = Array.from(document.querySelectorAll('video'));
        return 'idx_' + all.indexOf(video);
    }

    /** Persist current state of a live video element to localStorage. */
    function persistVNode(video) {
        const id   = getStableId(video);
        const rect = video.getBoundingClientRect();
        const record = {
            stableId:    id,
            src:         video.currentSrc || video.src || '',
            currentTime: isFinite(video.currentTime) ? video.currentTime : 0,
            muted:       video.muted,
            volume:      video.volume,
            loop:        video.loop,
            rect: {
                top:    rect.top  + window.scrollY,
                left:   rect.left + window.scrollX,
                width:  rect.width,
                height: rect.height
            }
        };
        try {
            localStorage.setItem(VNODE_PREFIX + id, JSON.stringify(record));
        } catch (_) { /* quota: silently skip */ }
    }

    /** Load a persisted vnode record by stable id. Returns null if missing. */
    function loadVNode(id) {
        try {
            const raw = localStorage.getItem(VNODE_PREFIX + id);
            return raw ? JSON.parse(raw) : null;
        } catch (_) { return null; }
    }

    /** Remove a vnode record from localStorage. */
    function purgeVNode(id) {
        try { localStorage.removeItem(VNODE_PREFIX + id); } catch (_) {}
    }

    /**
     * Replace an off-screen video with a dimensionally-accurate placeholder <div>.
     * Stores all necessary re-hydration data before pruning the live element.
     */
    function pruneToPlaceholder(video) {
        if (video.dataset.psiPruned === 'true') return;
        persistVNode(video);
        const id   = getStableId(video);
        const rect = video.getBoundingClientRect();

        const ph = document.createElement('div');
        ph.className        = 'psi-video-placeholder';
        ph.dataset.psiStableId = id;
        ph.style.cssText = `
            display: inline-block;
            width:  ${rect.width  || video.offsetWidth}px;
            height: ${rect.height || video.offsetHeight}px;
            background: #000;
            border: 1px dashed rgba(0,229,255,0.3);
            box-sizing: border-box;
            position: relative;
        `;
        const label = document.createElement('span');
        label.style.cssText = [
            'position:absolute;top:50%;left:50%;',
            'transform:translate(-50%,-50%);',
            'color:rgba(0,229,255,0.4);font-size:11px;',
            'font-family:monospace;pointer-events:none;'
        ].join('');
        label.textContent = '[psi-node]';
        ph.appendChild(label);

        if (video.id)        ph.dataset.psiOrigId    = video.id;
        if (video.className) ph.dataset.psiOrigClass = video.className;

        video.dataset.psiPruned = 'true';
        video.replaceWith(ph);
    }

    /**
     * Re-hydrate a placeholder back into a <video> element using stored vnode state.
     */
    function rehydratePlaceholder(ph) {
        const id = ph.dataset.psiStableId;
        if (!id) return;
        const record = loadVNode(id);
        if (!record || !record.src) return;

        const video       = document.createElement('video');
        video.src         = record.src;
        video.currentTime = record.currentTime || 0;
        video.muted       = record.muted  !== undefined ? record.muted  : false;
        video.volume      = record.volume !== undefined ? record.volume : 1.0;
        video.loop        = record.loop   || false;
        video.controls    = true;
        video.style.width  = ph.style.width;
        video.style.height = ph.style.height;

        if (ph.dataset.psiOrigId)    video.id        = ph.dataset.psiOrigId;
        if (ph.dataset.psiOrigClass) video.className = ph.dataset.psiOrigClass;

        // Pause on creation — only play on explicit user interaction (pause-on-acquire)
        video.pause();
        ph.replaceWith(video);
        video.playbackRate = targetSpeed;
    }

    /**
     * Scroll-driven virtualization loop.
     * Prunes videos fully outside VNODE_MARGIN px of the viewport.
     * Re-hydrates placeholders that have scrolled back into view.
     */
    function runVirtualizationSweep() {
        const vpTop    = window.scrollY;
        const vpBottom = vpTop + window.innerHeight;

        document.querySelectorAll('video').forEach(video => {
            if (video === activeVideo) return; // Never prune the active target
            const rect     = video.getBoundingClientRect();
            const absTop   = rect.top  + window.scrollY;
            const absBottom = absTop   + rect.height;
            const offScreen = absBottom < (vpTop - VNODE_MARGIN) || absTop > (vpBottom + VNODE_MARGIN);
            if (offScreen && !video.dataset.psiPruned) {
                pruneToPlaceholder(video);
            }
        });

        document.querySelectorAll('.psi-video-placeholder').forEach(ph => {
            const rect     = ph.getBoundingClientRect();
            const absTop   = rect.top  + window.scrollY;
            const absBottom = absTop   + rect.height;
            const inView   = absBottom > (vpTop - VNODE_MARGIN) && absTop < (vpBottom + VNODE_MARGIN);
            if (inView) {
                rehydratePlaceholder(ph);
            }
        });
    }

    let sweepScheduled = false;
    function scheduleSweep() {
        if (sweepScheduled) return;
        sweepScheduled = true;
        requestAnimationFrame(() => {
            runVirtualizationSweep();
            sweepScheduled = false;
        });
    }

    window.addEventListener('scroll', scheduleSweep, { passive: true });
    window.addEventListener('resize', scheduleSweep, { passive: true });
    setTimeout(runVirtualizationSweep, 1200);

    window.addEventListener('beforeunload', () => {
        document.querySelectorAll('video').forEach(persistVNode);
    });

    // ==========================================
    // PAUSE-ON-ACQUIRE
    // ==========================================
    // When a NEW video is targeted (not already activeVideo), all other playing
    // videos are paused. The newly acquired video is NOT touched — it stays in
    // whatever play/pause state it was already in. PLAY button and dblclick are
    // the only explicit play/pause command paths.
    function pauseAllExcept(target) {
        document.querySelectorAll('video').forEach(v => {
            if (v !== target && !v.paused) {
                persistVNode(v);
                v.pause();
            }
        });
    }

    // ==========================================
    // SYSTEM STYLING & ISOLATION (GM_addStyle)
    // ==========================================
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500;700&display=swap');

        :root {
            --bg-dark-base:          #050A0F;
            --bg-glass-panel:        rgba(10,19,26,0.85);
            --accent-cyan:           #00E5FF;
            --text-cyan-active:      #67E8F9;
            --accent-cyan-border:    rgba(0,229,255,0.4);
            --accent-cyan-bg-active: rgba(0,229,255,0.18);
            --glow-cyan-active:      rgba(0,229,255,0.35);
            --font-body:             'Roboto Mono', monospace;
        }

        /* ── Maximization isolation class ── */
        .psi-media-maximized {
            position:   fixed      !important;
            inset:      0          !important;
            width:      100vw      !important;
            height:     100vh      !important;
            max-width:  none       !important;
            max-height: none       !important;
            z-index:    2147483646 !important;
            background: #000       !important;
            object-fit: contain    !important;
        }
        body.psi-max-locked { overflow: hidden !important; }

        /* ── Virtual node placeholder ── */
        .psi-video-placeholder { cursor: pointer; }
        .psi-video-placeholder:hover { border-color: rgba(0,229,255,0.7) !important; }

        /* ── Draggable HUD ── */
        #media-godmode-ui {
            position:        fixed;
            z-index:         2147483647;
            padding:         12px 16px;
            background:      var(--bg-glass-panel);
            backdrop-filter: blur(16px);
            border:          1px solid var(--accent-cyan-border);
            border-radius:   6px;
            box-shadow:      0 8px 32px rgba(0,0,0,0.45);
            color:           #e0ffff;
            font-family:     var(--font-body);
            user-select:     none;
            font-size:       11px;
            transition:      opacity 0.2s ease;
        }
        #media-godmode-ui.dragging { box-shadow: 0 0 25px var(--glow-cyan-active); }

        #mg-title {
            font-size:     10px;
            font-weight:   700;
            margin-bottom: 10px;
            text-align:    center;
            letter-spacing: 1.5px;
            cursor:        grab;
            border-bottom: 1px solid rgba(0,229,255,0.2);
            padding-bottom: 6px;
            text-shadow:   0 0 6px var(--accent-cyan);
        }
        #mg-title:active { cursor: grabbing; }

        .mg-row {
            display:       flex;
            align-items:   center;
            gap:           8px;
            margin-bottom: 9px;
        }

        /* ── Base button ── */
        #media-godmode-ui button {
            background:   rgba(0,0,0,0.55);
            border:       1px solid rgba(0,229,255,0.35);
            color:        #e0ffff;
            padding:      5px 9px;
            border-radius: 3px;
            cursor:       pointer;
            transition:   all 0.2s;
            font-size:    10.5px;
            font-family:  inherit;
            font-weight:  bold;
        }
        #media-godmode-ui button:hover {
            border-color: var(--accent-cyan);
            background:   rgba(0,229,255,0.08);
        }
        #media-godmode-ui button.active {
            color:        var(--text-cyan-active);
            background:   var(--accent-cyan-bg-active);
            border-color: var(--accent-cyan);
            box-shadow:   0 0 10px var(--glow-cyan-active);
        }

        input[type="range"] {
            accent-color: var(--accent-cyan);
            width:        130px;
            height:       4px;
            cursor:       pointer;
        }

        /* ── Actions row ── */
        .mg-actions { display: flex; gap: 6px; }
        .mg-actions button { flex: 1; padding: 7px 0; font-size: 10px; letter-spacing: 0.5px; }

        /* ── Icon buttons (rotate row) ── */
        .mg-icon-btn {
            padding:     5px 8px  !important;
            font-size:   11px     !important;
            line-height: 1        !important;
            flex-shrink: 0;
        }

        /* ── Maximize — red active state ── */
        #mg-maximize.active {
            color:        #FF0055;
            border-color: #FF0055;
            box-shadow:   0 0 10px rgba(255,0,85,0.3);
        }

        /* ── Play/Pause — green active state ── */
        #mg-play.active {
            color:        #00FF88;
            border-color: #00FF88;
            box-shadow:   0 0 10px rgba(0,255,136,0.35);
        }

        /* ── Repeat active ── */
        #mg-repeat.active {
            color:        #00FF88;
            border-color: #00FF88;
            box-shadow:   0 0 10px rgba(0,255,136,0.35);
        }

        /* ── Nav arrows ── */
        #mg-nav-prev, #mg-nav-next { font-size: 13px !important; }
    `);

    // ==========================================
    // CORE EXECUTION ENGINE (Event Driven)
    // ==========================================

    /**
     * Synchronizes playback speed across ALL video elements in the frame.
     * Visual transforms (rotate/zoom/pan) are applied ONLY to the active target.
     */
    const applyMediaState = () => {
        document.querySelectorAll('video').forEach(v => {
            if (v.playbackRate !== targetSpeed) v.playbackRate = targetSpeed;
        });
        if (activeVideo) {
            activeVideo.style.transform      = `rotate(${state.rotation}deg) scale(${state.zoom})`;
            activeVideo.style.transformOrigin = `${state.panX}% ${state.panY}%`;
            activeVideo.style.objectPosition  = `${state.panX}% ${state.panY}%`;
        }
    };

    /**
     * Acquires a video as the active target.
     *
     * BUG FIX (Bug 3): Guard returns early when video === activeVideo.
     * pauseAllExcept() is only called on a genuine NEW target — it never
     * re-fires on the same video, preventing the PLAY button from being
     * immediately countered by a spurious pause.
     */
    function acquireTarget(video, autoPlay = false) {
        if (!video || video === activeVideo) return;
        activeVideo = video;
        pauseAllExcept(video);
        applyMediaState();
        if (autoPlay) {
            video.play().catch(() => { /* Autoplay blocked — silently accept */ });
        }
        if (window === window.top && typeof syncPlayButton === 'function') {
            syncPlayButton();
        }
    }

    // Target acquisition via native play event (site or user initiates playback)
    document.addEventListener('play', (e) => {
        if (e.target.tagName !== 'VIDEO') return;
        if (e.target !== activeVideo) {
            activeVideo = e.target;
            pauseAllExcept(e.target);
            applyMediaState();
        }
        state.isPlaying = true;
        if (window === window.top && typeof syncPlayButton === 'function') {
            syncPlayButton();
        }
    }, true);

    document.addEventListener('pause', (e) => {
        if (e.target === activeVideo) {
            state.isPlaying = false;
            if (window === window.top && typeof syncPlayButton === 'function') {
                syncPlayButton();
            }
        }
    }, true);

    // Hover acquisition — does NOT auto-play, does NOT re-pause if same video
    document.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'VIDEO' && e.target !== activeVideo) {
            acquireTarget(e.target, false);
        }
    }, { passive: true, capture: true });

    // ==========================================
    // DOUBLE-CLICK PLAY / PAUSE
    // ==========================================
    document.addEventListener('dblclick', (e) => {
        const video = e.target.closest('video') ||
                      (activeVideo && e.target === activeVideo ? activeVideo : null);
        if (!video) return;
        if (video !== activeVideo) acquireTarget(video, false);
        if (video.paused || video.ended) {
            video.play().catch(() => {});
            state.isPlaying = true;
        } else {
            video.pause();
            state.isPlaying = false;
        }
        if (window === window.top && typeof syncPlayButton === 'function') {
            syncPlayButton();
        }
    }, true);

    // Cross-frame speed sync
    GM_addValueChangeListener('media_speed', (_, __, val) => {
        targetSpeed = val;
        applyMediaState();
        if (window === window.top && typeof updateActiveSpeed === 'function') {
            updateActiveSpeed(targetSpeed);
        }
    });

    // ==========================================
    // HARDWARE ACCELERATED PAN & ZOOM (rAF)
    // ==========================================
    let isPanning    = false;
    let rAF_Pending  = false;

    document.addEventListener('mousedown', (e) => {
        if (e.altKey && e.shiftKey) {
            const v = e.target.closest('video') || activeVideo || document.querySelector('video');
            if (v) {
                if (v !== activeVideo) acquireTarget(v, false);
                isPanning = true;
                e.preventDefault();
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isPanning || !activeVideo) return;
        if (!rAF_Pending) {
            rAF_Pending = true;
            requestAnimationFrame(() => {
                const rect  = activeVideo.getBoundingClientRect();
                state.panX  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width)  * 100));
                state.panY  = Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100));
                applyMediaState();
                rAF_Pending = false;
            });
        }
    });

    document.addEventListener('mouseup', () => { isPanning = false; });

    document.addEventListener('wheel', (e) => {
        if (!e.altKey || !e.shiftKey) return;
        const v = e.target.closest('video') || activeVideo;
        if (!v) return;
        e.preventDefault();
        if (v !== activeVideo) acquireTarget(v, false);
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        state.zoom  = Math.max(0.5, Math.min(5.0, state.zoom + delta));
        requestAnimationFrame(applyMediaState);
    }, { passive: false });

    // ==========================================
    // HUD INJECTION (TOP FRAME ONLY)
    // ==========================================
    if (window !== window.top) return;

    const ui = document.createElement('div');
    ui.id = 'media-godmode-ui';
    ui.innerHTML = `
        <div id="mg-title">Ψ 4NDR0666 // MEDIA GODMODE</div>
        <div class="mg-row speed-row">
            <button data-speed="0.25">0.25</button>
            <button data-speed="0.50">0.50</button>
            <button data-speed="0.75">0.75</button>
            <button data-speed="1.00">1.00</button>
            <button data-speed="1.50">1.50</button>
            <button data-speed="2.00">2.00</button>
            <button data-speed="3.00">3.00</button>
        </div>
        <div class="mg-row">
            <span style="font-weight:bold;">Rotate</span>
            <input type="range" id="rotate-slider" min="0" max="360" value="0" step="1">
            <span id="rotate-val" style="width:30px;text-align:right;">0°</span>
            <button id="rotate-reset"  class="mg-icon-btn" title="Reset rotation">↺</button>
            <button id="mg-view-reset" class="mg-icon-btn" title="Reset view (zoom + pan)">↩</button>
            <button id="mg-maximize"   class="mg-icon-btn" title="Maximize / Restore">⤢</button>
            <button id="mg-pip"        class="mg-icon-btn" title="Picture in Picture">⧉</button>
        </div>
        <div class="mg-actions">
            <button id="mg-play">PLAY</button>
            <button id="mg-nav-prev" title="Previous story / prev media">&lt;</button>
            <button id="mg-nav-next" title="Next story / next media">&gt;</button>
            <button id="mg-repeat"   title="Loop / repeat current story">○ REPEAT</button>
        </div>
    `;
    document.body.appendChild(ui);

    // ==========================================
    // DRAGGABLE HUD WITH GM POSITION MEMORY
    // ==========================================
    let isDragging = false, ox = 0, oy = 0;
    const title = ui.querySelector('#mg-title');

    title.addEventListener('mousedown', (e) => {
        isDragging = true;
        ox = e.clientX - ui.offsetLeft;
        oy = e.clientY - ui.offsetTop;
        ui.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const nl = Math.max(10, Math.min(e.clientX - ox, window.innerWidth  - ui.offsetWidth  - 10));
        const nt = Math.max(10, Math.min(e.clientY - oy, window.innerHeight - ui.offsetHeight - 10));
        ui.style.left   = nl + 'px';
        ui.style.top    = nt + 'px';
        ui.style.bottom = 'auto';
        ui.style.right  = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            ui.classList.remove('dragging');
            GM_setValue('media_pos', { left: ui.style.left, top: ui.style.top });
        }
    });

    const savedPos = GM_getValue('media_pos');
    if (savedPos) {
        ui.style.left = savedPos.left;
        ui.style.top  = savedPos.top;
    } else {
        ui.style.bottom = '35px';
        ui.style.right  = '35px';
    }

    // ==========================================
    // CONTROLS BINDING
    // ==========================================

    // --- Speed ---
    const speedButtons = ui.querySelectorAll('.speed-row button');
    window.updateActiveSpeed = (speed) => {
        speedButtons.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === speed));
    };
    updateActiveSpeed(targetSpeed);
    speedButtons.forEach(btn => btn.addEventListener('click', () => {
        GM_setValue('media_speed', parseFloat(btn.dataset.speed));
        // GM_addValueChangeListener fires and updates UI + all frames
    }));

    // --- Play / Pause Button ---
    //
    // BUG FIX (Bug 3): The handler NO LONGER calls acquireTarget() on the
    // already-active video. That was the root cause: acquireTarget →
    // pauseAllExcept → video.pause() fired synchronously, then .play() was
    // called on a newly-paused video, which some browsers silently reject
    // (AbortError) or which IG overrides.
    //
    // New flow:
    //   1. If no activeVideo yet → call acquireTarget(first) once to register it.
    //      (pauseAllExcept is fine here since nothing was active.)
    //   2. Read activeVideo directly, toggle play/pause — no re-acquisition.
    //
    // BUG FIX (Bug 4): Labels are plain ASCII "PLAY" / "PAUSE" — no unicode
    // glyphs that break the monospace cyan-outline button aesthetic.

    const btnPlay = ui.querySelector('#mg-play');

    window.syncPlayButton = () => {
        if (!activeVideo) {
            btnPlay.textContent = 'PLAY';
            btnPlay.classList.remove('active');
            state.isPlaying = false;
            return;
        }
        const playing   = !activeVideo.paused && !activeVideo.ended;
        state.isPlaying  = playing;
        btnPlay.textContent = playing ? 'PAUSE' : 'PLAY';
        btnPlay.classList.toggle('active', playing);
    };

    btnPlay.addEventListener('click', () => {
        if (!activeVideo) {
            const first = document.querySelector('video');
            if (!first) return;
            acquireTarget(first, false); // Full acquisition safe — nothing was active
        }
        const v = activeVideo;
        if (!v) return;
        // Direct toggle — no re-acquisition, no side effects
        if (v.paused || v.ended) {
            v.play().catch(() => {});
            state.isPlaying = true;
        } else {
            v.pause();
            state.isPlaying = false;
        }
        syncPlayButton();
    });

    // --- Rotation ---
    const rotSlider = ui.querySelector('#rotate-slider');
    const rotVal    = ui.querySelector('#rotate-val');

    rotSlider.addEventListener('input', () => {
        state.rotation     = parseInt(rotSlider.value);
        rotVal.textContent = state.rotation + '°';
        requestAnimationFrame(applyMediaState);
    });

    ui.querySelector('#rotate-reset').addEventListener('click', () => {
        state.rotation     = 0;
        rotSlider.value    = 0;
        rotVal.textContent = '0°';
        requestAnimationFrame(applyMediaState);
    });

    // --- Reset View (zoom + pan) ---
    ui.querySelector('#mg-view-reset').addEventListener('click', () => {
        state.zoom  = 1.0;
        state.panX  = 50;
        state.panY  = 50;
        requestAnimationFrame(applyMediaState);
    });

    // --- Maximize (Smart Class Toggle) ---
    const btnMax = ui.querySelector('#mg-maximize');

    btnMax.addEventListener('click', () => {
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        if (v !== activeVideo) acquireTarget(v, false);
        state.isMaximized = !state.isMaximized;
        if (state.isMaximized) {
            document.body.classList.add('psi-max-locked');
            v.classList.add('psi-media-maximized');
            btnMax.textContent = '⬛';
            btnMax.title       = 'Restore';
            btnMax.classList.add('active');
        } else {
            document.body.classList.remove('psi-max-locked');
            v.classList.remove('psi-media-maximized');
            btnMax.textContent = '⤢';
            btnMax.title       = 'Maximize / Restore';
            btnMax.classList.remove('active');
        }
        applyMediaState();
    });

    // --- Picture in Picture ---
    ui.querySelector('#mg-pip').addEventListener('click', () => {
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        document.pictureInPictureElement
            ? document.exitPictureInPicture()
            : v.requestPictureInPicture();
    });

    // ==========================================
    // INSTAGRAM STORY NAVIGATION
    // ==========================================
    //
    // BUG FIX (Bug 1): Previous layer 1 ran querySelectorAll on the entire
    // document, matching IG's global page-level "Next" tray buttons before the
    // story tap zones. Layer 2 only searched div variants, missing IG's <button>
    // tap zones present in current desktop markup.
    //
    // Fixed three-layer strategy:
    //   Layer 1 — Scoped aria-label search within the story container ancestor,
    //             with multi-locale label patterns.
    //   Layer 2 — Scoped geometric search within the container; includes <button>
    //             elements, excludes the HUD itself.
    //   Layer 3 — ArrowLeft / ArrowRight keyboard events dispatched to the focused
    //             element or document.body.

    function igStoryNav(direction) {
        const v         = activeVideo || document.querySelector('video');
        const container = v
            ? (v.closest('[role="dialog"]') || v.closest('section') || v.closest('main') || document.body)
            : document.body;

        // Layer 1: scoped aria-label search
        const prevPatterns = [/previous/i, /go back/i, /zurück/i, /précédent/i, /anterior/i];
        const nextPatterns = [/next/i, /go forward/i, /weiter/i, /suivant/i, /siguiente/i];
        const patterns     = direction === 'prev' ? prevPatterns : nextPatterns;

        const ariaBtn = Array.from(
            container.querySelectorAll('button[aria-label], [role="button"][aria-label]')
        ).find(el => patterns.some(p => p.test(el.getAttribute('aria-label') || '')));

        if (ariaBtn) { ariaBtn.click(); return; }

        // Layer 2: geometric overlay search (includes <button>)
        if (v) {
            const vRect     = v.getBoundingClientRect();
            const candidates = Array.from(
                container.querySelectorAll('button, div[tabindex], div[role="button"], [role="button"]')
            ).filter(el => {
                if (el.closest('#media-godmode-ui')) return false; // Exclude own HUD
                const r = el.getBoundingClientRect();
                return (
                    r.height >= vRect.height * 0.5 &&
                    r.width  >= 20 &&
                    r.top    <= vRect.top    + 40 &&
                    r.bottom >= vRect.bottom - 40 &&
                    r.left   >= vRect.left   - 60 &&
                    r.right  <= vRect.right  + 60
                );
            });

            if (candidates.length >= 2) {
                candidates.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
                const target = direction === 'prev' ? candidates[0] : candidates[candidates.length - 1];
                target.click();
                return;
            }

            if (candidates.length === 1) {
                const r = candidates[0].getBoundingClientRect();
                const x = direction === 'prev' ? r.left + r.width * 0.25 : r.left + r.width * 0.75;
                const y = r.top + r.height / 2;
                candidates[0].dispatchEvent(
                    new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })
                );
                return;
            }
        }

        // Layer 3: keyboard arrow fallback
        const key            = direction === 'prev' ? 'ArrowLeft' : 'ArrowRight';
        const dispatchTarget = (document.activeElement && document.activeElement !== document.body)
            ? document.activeElement
            : document.body;
        dispatchTarget.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        dispatchTarget.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true, cancelable: true }));
    }

    // ==========================================
    // INSTAGRAM STORY REPEAT ENGINE
    // ==========================================
    //
    // BUG FIX (Bug 2): Instagram does NOT fire the 'ended' event on story videos.
    // Instead, IG either (a) swaps the video's src attribute or (b) replaces the
    // entire <video> element when transitioning to the next story. The previous
    // implementation's 'ended' listener was therefore a dead code path on IG.
    //
    // Three-layer detection:
    //
    //   Layer A — MutationObserver on the story container: detects src attribute
    //             changes on the tracked video, and new <video> node insertions
    //             (IG's element-swap pattern). Fires executeRepeat() on detection.
    //
    //   Layer B — timeupdate near-end sentinel: arms a one-shot 350ms timer when
    //             currentTime >= duration - 0.4s. Catches IG's mid-play src-swap
    //             which happens before any end event. Timer is cancelled if the
    //             video rewinds or pauses before firing (false alarm guard).
    //
    //   Layer C — 'ended' event listener: belt-and-suspenders fallback for non-IG
    //             pages and any IG variant that does emit 'ended'.

    let repeatActive         = false;
    let repeatDebounceTimer  = null;
    let repeatNearEndArmed   = false;
    let repeatObserver       = null;
    let repeatTrackedVideo   = null;

    /** Core repeat action — debounced 150ms to suppress double-fires. */
    function executeRepeat() {
        clearTimeout(repeatDebounceTimer);
        repeatDebounceTimer = setTimeout(() => {
            if (!repeatActive) return;
            if (window.location.hostname.includes('instagram.com')) {
                igStoryNav('prev');
            } else {
                const v = activeVideo;
                if (v) {
                    v.currentTime = 0;
                    v.play().catch(() => {});
                }
            }
        }, 150);
    }

    /** Layer C: ended event fallback. */
    function onVideoEnded(e) {
        if (!repeatActive)         return;
        if (e.target !== activeVideo) return;
        repeatNearEndArmed = false;
        executeRepeat();
    }
    document.addEventListener('ended', onVideoEnded, true);

    /** Layer B: timeupdate near-end sentinel. */
    function onTimeUpdate(e) {
        if (!repeatActive)            return;
        if (e.target !== activeVideo) return;
        const v = e.target;
        if (!isFinite(v.duration) || v.duration < 1) return;
        const nearEnd = v.currentTime >= v.duration - 0.4;
        if (nearEnd && !repeatNearEndArmed) {
            repeatNearEndArmed  = true;
            repeatDebounceTimer = setTimeout(() => {
                if (!repeatActive) return;
                if (activeVideo && activeVideo.currentTime >= activeVideo.duration - 0.6) {
                    executeRepeat();
                }
                repeatNearEndArmed = false;
            }, 350);
        } else if (!nearEnd && repeatNearEndArmed) {
            // Video was seeked backwards — cancel the pending repeat
            repeatNearEndArmed = false;
            clearTimeout(repeatDebounceTimer);
        }
    }
    document.addEventListener('timeupdate', onTimeUpdate, { passive: true, capture: true });

    /** Layer A: MutationObserver — detects IG video element swap and src change. */
    function startRepeatObserver() {
        if (repeatObserver) repeatObserver.disconnect();
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        repeatTrackedVideo = v;

        const container = (
            v.closest('[role="dialog"]') ||
            v.closest('section')         ||
            v.closest('main')            ||
            v.parentElement
        );
        if (!container) return;

        repeatObserver = new MutationObserver((mutations) => {
            if (!repeatActive) return;
            for (const m of mutations) {
                // Src attribute changed on the tracked video — IG replaced the story
                if (m.type === 'attributes' && m.attributeName === 'src' && m.target === repeatTrackedVideo) {
                    executeRepeat();
                    return;
                }
                // A new <video> element appeared — IG's element-swap pattern
                if (m.type === 'childList') {
                    for (const node of m.addedNodes) {
                        if (node.tagName === 'VIDEO' && node !== repeatTrackedVideo) {
                            executeRepeat();
                            return;
                        }
                        if (node.querySelector && node.querySelector('video')) {
                            executeRepeat();
                            return;
                        }
                    }
                }
            }
        });

        repeatObserver.observe(container, {
            childList:       true,
            subtree:         true,
            attributes:      true,
            attributeFilter: ['src']
        });
    }

    function stopRepeatObserver() {
        if (repeatObserver) {
            repeatObserver.disconnect();
            repeatObserver = null;
        }
        repeatTrackedVideo = null;
        repeatNearEndArmed = false;
        clearTimeout(repeatDebounceTimer);
    }

    // Re-arm the observer when the active video changes while repeat is on
    document.addEventListener('play', (e) => {
        if (repeatActive && e.target.tagName === 'VIDEO' && e.target !== repeatTrackedVideo) {
            startRepeatObserver();
        }
    }, true);

    // --- Nav < > bindings ---
    ui.querySelector('#mg-nav-prev').addEventListener('click', () => igStoryNav('prev'));
    ui.querySelector('#mg-nav-next').addEventListener('click', () => igStoryNav('next'));

    // --- Repeat button binding ---
    const btnRepeat = ui.querySelector('#mg-repeat');
    btnRepeat.addEventListener('click', () => {
        repeatActive = !repeatActive;
        if (repeatActive) {
            startRepeatObserver();
            if (!window.location.hostname.includes('instagram.com')) {
                const v = activeVideo || document.querySelector('video');
                if (v) v.loop = true;
            }
        } else {
            stopRepeatObserver();
            if (!window.location.hostname.includes('instagram.com')) {
                const v = activeVideo || document.querySelector('video');
                if (v) v.loop = false;
            }
        }
        btnRepeat.textContent = repeatActive ? '● REPEAT' : '○ REPEAT';
        btnRepeat.classList.toggle('active', repeatActive);
    });

    // ==========================================
    // GLOBAL HOTKEYS
    // ==========================================
    // Alt+M  → toggle HUD visibility (opacity + pointer-events)
    // Escape → un-maximize
    // Space  → play/pause active video (guard: skip if typing in input)

    let hudVisible = true;

    document.addEventListener('keydown', (e) => {
        // Alt+M — HUD visibility toggle
        if (e.altKey && e.key.toLowerCase() === 'm') {
            hudVisible           = !hudVisible;
            ui.style.opacity     = hudVisible ? '1'    : '0';
            ui.style.pointerEvents = hudVisible ? 'auto' : 'none';
            return;
        }

        // Escape — un-maximize
        if (e.key === 'Escape' && state.isMaximized) {
            btnMax.click();
            return;
        }

        // Space — play/pause (skip if typing in a form field)
        if (e.code === 'Space') {
            const tag = document.activeElement ? document.activeElement.tagName : '';
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
            const v = activeVideo || document.querySelector('video');
            if (!v) return;
            e.preventDefault();
            if (v.paused || v.ended) {
                v.play().catch(() => {});
                state.isPlaying = true;
            } else {
                v.pause();
                state.isPlaying = false;
            }
            syncPlayButton();
        }
    });

    // ==========================================
    // PERIODIC PERSISTENCE (Auto-save every 5s)
    // ==========================================
    // Persist active video's currentTime so an accidental refresh can restore
    // playhead position via the vnode record.
    setInterval(() => {
        if (activeVideo) persistVNode(activeVideo);
    }, 5000);

    // ==========================================
    // PLACEHOLDER CLICK-TO-REHYDRATE
    // ==========================================
    document.addEventListener('click', (e) => {
        const ph = e.target.closest('.psi-video-placeholder');
        if (!ph) return;
        rehydratePlaceholder(ph);
    }, true);

    // ==========================================
    // BOOT LOG
    // ==========================================
    console.log(
        '%c[4NDR0666OS] Media Godmode v5.0.0-Ψ — Unified Superset. ' +
        'Speed | rAF Zoom/Pan | Rotation | Smart Maximize | PiP | ' +
        'Play | DblClick | Pause-on-Acquire | Virtual DOM | ' +
        'IG Nav (3-Layer) | IG Repeat (3-Layer) | Space Hotkey | Draggable HUD.',
        'color:#00E5FF;font-weight:bold;'
    );
})();
