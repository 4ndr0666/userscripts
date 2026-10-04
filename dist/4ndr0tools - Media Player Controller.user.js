// ==UserScript==
// @name         4ndr0tools - Media Player Controller
// @namespace    https://github.com/4ndr0666/userscripts
// @version      8.1.2
// @author       4ndr0666
// @description  Speed • Fine Rate ±0.1 • Alt+Shift rAF Zoom/Pan • Rotation • Smart Maximize • Native Fullscreen • PiP • Play • DblClick • Pause-on-Acquire • Virtual DOM Nodes • Shadow-DOM Discovery • Cyan-Glass Scrub Bar • Download Button (fetch + blob capture) • Screenshot • Volume/Mute • Frame Step • Seek Hotkeys • IG Story Nav (3-Layer) • Story Repeat (3-Layer) • Active-Media Observer • YouTube Ad Auto-Skip • Toast Feedback • Draggable HUD • Full Hotkey Suite
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Media%20Player%20Controller.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Media%20Player%20Controller.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_addValueChangeListener
// @all_frames   true
// @run-at       document-end
// ==/UserScript==
// 8.1.1 (suite v1.4.0): OPSEC — remote Google-Fonts @import purged (IP-leak / fingerprint vector on every page load); local spec font stack retained. 3lectric-Glass universality round.


/* ═══ SUITE PROMOTION 8.0.0 ═══════════════════════════════════════════
 * Media Player Controller BETA v7.0.0-Ψ promoted: 'UNIFIED SUPERSET' over mediaplayercontroller v5.1.0 (31 baseline units) + IGDL v6.0.1 salvage — shadow-DOM discovery, scrub bar, download blob-capture, full hotkey suite.
 * Retired duplicate: 4ndr0tools - Media Player Controller.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// 4NDR0666OS // MEDIA GODMODE v7.0.0-Ψ — UNIFIED SUPERSET
//
// Paradigm (GUP D1): Event-Driven Overlay Controller — capture-phase DOM
// listeners + rAF-batched style application; module-scope state only; a
// single composed `applyMediaState` pipeline; zero framework hybrids, zero
// monkey-patch layering. Host augmentation is strictly additive and flagged.
//
// Lineage (GUP 0.3.1 CSoT):
//   • mediaplayercontroller.user.js   v5.1.0    — canonical baseline (31 units)
//   • mediaplayercontrollerbeta       v6.0.0-Ψ  — Gate-2 chimera + timeout fixes
//   • mediaplayercontroller-igdl      v6.0.1    — ad-skip + blob-capture salvage
//   • html5videoplayingtools                     — hotkey suite, screenshot,
//                                                 Shadow-DOM discovery, toast
//   • fpsbooster                                 — audited; destructive timer
//                                                 kill-switch REJECTED, ad
//                                                 heuristic superseded by IGDL
//
// Every baseline unit is preserved by name (GUP §1 identity rule). All
// integration points are wired — zero dead code, zero placeholders.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
    'use strict';

    // ==========================================
    // SINGLETON GUARD (idempotency across double-injection)
    // ==========================================
    if (window.psiMediaControllerLoaded || window.psiMediaGodmodeLoaded) return;
    window.psiMediaControllerLoaded = true;
    // legacy co-install guard kept — an older copy on the same page must
    // still be recognized (and must recognize us via the legacy flag).
    window.psiMediaGodmodeLoaded = true;

    // ==========================================
    // FRAME ROLE & INTERNAL STATE
    // ==========================================
    const IS_TOP = (window === window.top);

    let activeVideo = null;
    let activeImage = null; // Image-based story/post media — no play/scrub semantics, but trackable for download
    let targetSpeed = GM_getValue('media_speed', 1.0);

    // Top-frame-only UI hooks. Declared here (shared scope) as null and
    // assigned inside the top-frame section, so shared-section event
    // dispatchers can null-check them without TDZ hazards and without
    // polluting `window` (GUP B.1 — zero global pollution).
    let syncPlayButton = null;      // assigned top-frame
    let updateActiveSpeed = null;   // assigned top-frame

    const state = {
        rotation:    0,
        zoom:        1.0,
        panX:        50,
        panY:        50,
        isMaximized: false,
        isPlaying:   false,
        isScrubbing: false
    };

    // Scrub drag flag lives in the shared scope so the shared timeupdate
    // dispatcher can consult it in every frame without TDZ risk.
    let scrubIsDragging = false;

    /** Returns whichever media element (video or image) is currently the active target. */
    function getActiveMedia() {
        return activeVideo || activeImage;
    }

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
     * Remove vnode records that no longer correspond to any live video or
     * placeholder. Bounds localStorage growth (GUP B.1 bounded registries).
     */
    function purgeOrphanVNodes() {
        try {
            const liveIds = new Set();
            allVideos().forEach(v => {
                const id = getStableId(v);
                if (id) liveIds.add(id);
            });
            queryAll('.psi-video-placeholder').forEach(ph => {
                if (ph.dataset && ph.dataset.psiStableId) liveIds.add(ph.dataset.psiStableId);
            });
            const staleKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.indexOf(VNODE_PREFIX) === 0) staleKeys.push(k);
            }
            staleKeys.forEach(k => {
                const id = k.slice(VNODE_PREFIX.length);
                if (!liveIds.has(id)) purgeVNode(id);
            });
        } catch (_) { /* storage unavailable — nothing to purge */ }
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
     * The consumed record is purged once its state has been transferred — any
     * future off-screen prune re-persists a fresh record.
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
        trackVideo(video); // shadow-rooted rehydrations need direct listeners
        purgeVNode(id);
    }

    /**
     * Scroll-driven virtualization loop.
     * Prunes videos fully outside VNODE_MARGIN px of the viewport.
     * Re-hydrates placeholders that have scrolled back into view.
     * Shadow-root aware via queryAll().
     */
    function runVirtualizationSweep() {
        const vpTop    = window.scrollY;
        const vpBottom = vpTop + window.innerHeight;

        queryAll('video').forEach(video => {
            if (video === activeVideo) return; // Never prune the active target
            const rect     = video.getBoundingClientRect();
            const absTop   = rect.top  + window.scrollY;
            const absBottom = absTop   + rect.height;
            const offScreen = absBottom < (vpTop - VNODE_MARGIN) || absTop > (vpBottom + VNODE_MARGIN);
            if (offScreen && !video.dataset.psiPruned) {
                pruneToPlaceholder(video);
            }
        });

        queryAll('.psi-video-placeholder').forEach(ph => {
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
        allVideos().forEach(persistVNode);
        purgeOrphanVNodes();
    });

    // ==========================================
    // PAUSE-ON-ACQUIRE
    // ==========================================
    // When a NEW video is targeted (not already activeVideo), all other playing
    // videos are paused. The newly acquired video is NOT touched — it stays in
    // whatever play/pause state it was already in. PLAY button and dblclick are
    // the only explicit play/pause command paths.
    function pauseAllExcept(target) {
        allVideos().forEach(v => {
            if (v !== target && !v.paused) {
                persistVNode(v);
                v.pause();
            }
        });
    }

    // ==========================================
    // SHADOW-DOM AWARE QUERY LAYER
    // ==========================================
    // The canonical baseline used document.querySelectorAll only, which is
    // blind to <video> elements inside open AND closed shadow roots. The
    // unified controller registers every shadow root at creation time (via a
    // flagged, additive attachShadow hook — salvaged from html5videoplayingtools)
    // and mirrors all registry queries across them.
    const shadowRoots = new Set();
    const trackedShadowVideos = new Set();
    const MAX_SHADOW_DEPTH = 8;

    /** Registry query: document + every discovered shadow root. */
    function queryAll(selector) {
        const out = [];
        try { out.push(...document.querySelectorAll(selector)); } catch (_) { /* detached document */ }
        for (const root of shadowRoots) {
            try { out.push(...root.querySelectorAll(selector)); } catch (_) { /* dead root */ }
        }
        return out;
    }

    /** All video elements visible to the registry (light DOM + shadow DOM). */
    function allVideos() {
        return queryAll('video');
    }

    /**
     * Additive attachShadow hook. Calls the host implementation unchanged and
     * registers the returned root for discovery. Flagged for idempotency;
     * never throws into the host page (interceptor-scoped guard, GUP D6).
     */
    function hookAttachShadow() {
        if (typeof Element === 'undefined') return;
        if (typeof Element.prototype.attachShadow !== 'function') return;
        if (Element.prototype.attachShadow.psiHooked) return;

        const rawAttachShadow = Element.prototype.attachShadow;
        function patchedAttachShadow(init) {
            const root = rawAttachShadow.call(this, init);
            try {
                shadowRoots.add(root);
                scheduleDiscoverySoon();
            } catch (_) { /* discovery-only: never break host attachShadow */ }
            return root;
        }
        patchedAttachShadow.psiHooked = true;
        Element.prototype.attachShadow = patchedAttachShadow;
    }

    let discoverySoonScheduled = false;
    function scheduleDiscoverySoon() {
        if (discoverySoonScheduled) return;
        discoverySoonScheduled = true;
        setTimeout(() => {
            discoverySoonScheduled = false;
            allVideos().forEach(trackVideo);
        }, 60);
    }

    /**
     * Depth-bounded walk that discovers shadow roots hosted anywhere under the
     * document or inside already-known roots. Runs at boot, on attachShadow,
     * and periodically — catching roots that existed before this script loaded.
     */
    function deepShadowWalk() {
        const seen = new Set(shadowRoots);
        seen.add(document);
        let frontier = [document];
        let depth = 0;
        while (frontier.length > 0 && depth < MAX_SHADOW_DEPTH) {
            const next = [];
            for (const root of frontier) {
                let elements;
                try { elements = root.querySelectorAll('*'); } catch (_) { continue; }
                for (const el of elements) {
                    const sr = el.shadowRoot;
                    if (sr && !seen.has(sr)) {
                        seen.add(sr);
                        shadowRoots.add(sr);
                        next.push(sr);
                    }
                }
            }
            frontier = next;
            depth++;
        }
        allVideos().forEach(trackVideo);
    }

    // ==========================================
    // SHADOW MEDIA EVENT DELEGATION
    // ==========================================
    // Media events ('play', 'pause', 'timeupdate', 'ended', 'loadedmetadata')
    // are NOT composed, so they never cross a shadow boundary to the document
    // capture listeners. Shadow-rooted videos get direct listeners routed into
    // the exact same dispatchers. Light-DOM videos remain covered by the
    // document capture listeners alone — no double dispatch is possible.
    function trackVideo(video) {
        if (!video || trackedShadowVideos.has(video)) return;
        const root = video.getRootNode();
        if (!(root instanceof ShadowRoot)) return; // light DOM: covered by document listeners

        trackedShadowVideos.add(video);
        video.addEventListener('play',          onMediaPlayEvent,      false);
        video.addEventListener('pause',         onMediaPauseEvent,     false);
        video.addEventListener('timeupdate',    onMediaTimeUpdateEvent,{ passive: true });
        video.addEventListener('ended',         onMediaEndedEvent,     false);
        video.addEventListener('loadedmetadata',onMediaLoadedMetaEvent,false);
        video.addEventListener('mouseover',     (e) => {
            if (e.target === video && video !== activeVideo) acquireTarget(video, false);
        }, { passive: true });
        video.addEventListener('dblclick',      handleDblClick,       false);
    }

    /** Drops registry entries whose elements left the document (bounded registry). */
    function pruneDiscoveryRegistries() {
        for (const v of trackedShadowVideos) {
            if (!v.isConnected) trackedShadowVideos.delete(v);
        }
        for (const root of shadowRoots) {
            if (root.host && !root.host.isConnected) shadowRoots.delete(root);
        }
    }

    /**
     * v8.1.0 PLAY-REGISTRATION FALLBACK. Acquisition previously relied on
     * the site firing a 'play' event (document capture / shadow listeners)
     * or a mouseover on a SHADOW-rooted video — a paused-on-load video in
     * the light DOM (poster grids, click-to-play sites, custom controls)
     * never became active, so PLAY/Space did nothing on those sites. This
     * picker selects the most plausible target directly: the LARGEST
     * visible video (light DOM + every discovered shadow root), preferring
     * one that is already playing, never an 0×0 node.
     * @returns {Element|null}
     */
    function acquireBestCandidate() {
        const candidates = allVideos().filter((v) => v.isConnected);
        if (!candidates.length) return null;
        let best = null, bestScore = -1;
        for (const v of candidates) {
            let r;
            try { r = v.getBoundingClientRect(); } catch (_) { continue; }
            const area = (r.width || 0) * (r.height || 0);
            if (area <= 1) continue; // 0×0 / display:none node — never a real target
            // A playing video outranks a bigger paused poster tile.
            const playing = (!v.paused && !v.ended) ? 1e12 : 0;
            const score = area + playing;
            if (score > bestScore) { bestScore = score; best = v; }
        }
        return best;
    }

    /** True when the active target is missing or was detached by the host
     * SPA — the signal to re-acquire before honoring PLAY/Space. */
    function activeTargetStale() {
        return !activeVideo || !activeVideo.isConnected;
    }

    /**
     * v8.1.0: light-DOM mouseover acquisition — the shadow path (trackVideo)
     * had hover acquisition, the light-DOM path did not. Document-level
     * capture delegation, one handler, no per-video listeners.
     */
    document.addEventListener('mouseover', (e) => {
        const t = e.target;
        if (!t || t.tagName !== 'VIDEO') return;
        if (t !== activeVideo) acquireTarget(t, false);
    }, { passive: true, capture: true });

    hookAttachShadow();
    setTimeout(deepShadowWalk, 1200);

    // Continuous bounded discovery: cheap root scan every tick, deep walk every
    // 5th tick. Skipped entirely while the tab is hidden.
    // v8.1.0: when no live target is held (initial load, SPA teardown), the
    // tick also runs the fallback acquirer so the HUD's PLAY/Space/scrub are
    // wired to the page's dominant video without waiting for a site 'play'.
    let discoveryTick = 0;
    setInterval(() => {
        if (document.hidden) return;
        discoveryTick++;
        allVideos().forEach(trackVideo);
        pruneDiscoveryRegistries();
        if (discoveryTick % 5 === 0) deepShadowWalk();
        if (IS_TOP && activeTargetStale()) {
            const candidate = acquireBestCandidate();
            if (candidate) acquireTarget(candidate, false);
        }
        applyMediaState(); // drift correction (sites reset playbackRate on ad insert, etc.)
    }, 1500);

    // ==========================================
    // SYSTEM STYLING & ISOLATION (GM_addStyle)
    // 3LECTRIC-GLASS PARADIGM — GTK3 UI/UX SPEC COMPLIANCE
    // ==========================================
    // Palette mapping (spec §2.1):
    //   HUD container ......... Glass Level 1 (Window)   rgba(10,19,26,0.72)
    //   Scrub bar / toast /
    //   help popover / dl btn . Glass Level 2 (Popup)    rgba(10,19,26,0.65)
    //   Nested inputs ......... Glass Level 3 (Panel)    rgba(10,19,26,0.55)
    //   Headerbar ............. Solid Header             rgba(10,19,26,0.95)
    //   Accents ............... #00E5FF / #67E8F9 / #ff0055 / #ffffff
    // Geometry (spec §4.4): buttons border-radius 0px — strict rectangular
    // brutalism. Glass panels: 4px. Transitions (spec §2.2): all 150ms
    // ease-in-out. Typography (spec §3.0): JetBrains Mono (data),
    // Orbitron 700 (display). Deviation note: -webkit-backdrop-filter is
    // retained alongside backdrop-filter for Safari engine support only.
    GM_addStyle(`

        :root {
            --matrix-deep-base:    rgba(10, 19, 26, 1.0);
            --glass-1-window:      rgba(10, 19, 26, 0.72);
            --glass-2-popup:       rgba(10, 19, 26, 0.65);
            --glass-3-panel:       rgba(10, 19, 26, 0.55);
            --solid-header:        rgba(10, 19, 26, 0.95);
            --accent-cyan:         #00E5FF;
            --text-cyan-active:    #67E8F9;
            --accent-destructive:  #ff0055;
            --absolute-light:      #ffffff;
            --accent-cyan-border:  rgba(0, 229, 255, 0.4);
            --accent-cyan-border2: rgba(0, 229, 255, 0.3);
            --accent-cyan-border3: rgba(0, 229, 255, 0.2);
            --cyan-wash:           rgba(0, 229, 255, 0.2);
            --cyan-wash-strong:    rgba(0, 229, 255, 0.3);
            --glow-cyan-window:    rgba(0, 229, 255, 0.15);
            --glow-cyan-hover:     rgba(0, 229, 255, 0.5);
            --glow-cyan-active:    rgba(0, 229, 255, 0.35);
            --font-body:           'JetBrains Mono', monospace;
            --font-display:        'Orbitron', sans-serif;
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

        /* ── Draggable HUD — window.main-window topology (spec §4.2) ── */
        #mpc-hud-ui {
            position:        fixed;
            z-index:         2147483647;
            padding:         0;
            background:      var(--glass-1-window);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border:          1px solid var(--accent-cyan-border3);
            border-radius:   4px;
            box-shadow:      0 0 40px var(--glow-cyan-window);
            color:           var(--accent-cyan);
            font-family:     var(--font-body);
            user-select:     none;
            font-size:       11px;
            transition:      opacity 150ms ease-in-out;
            max-height:      calc(100vh - 60px);
            overflow-y:      auto;
            scrollbar-width: thin;
            scrollbar-color: var(--accent-cyan) rgba(0, 0, 0, 0.4);
        }
        #mpc-hud-ui::-webkit-scrollbar { width: 8px; }
        #mpc-hud-ui::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); }
        #mpc-hud-ui::-webkit-scrollbar-thumb {
            background:      var(--accent-cyan);
            border-radius:   0;
            min-height:      6px;
        }
        #mpc-hud-ui::-webkit-scrollbar-thumb:hover { background: var(--text-cyan-active); }
        #mpc-hud-ui.dragging { box-shadow: 0 0 25px var(--glow-cyan-hover); }

        /* ── Headerbar (spec §4.3): drag surface + display typography ── */
        #mg-header {
            display:          flex;
            align-items:      center;
            gap:              10px;
            padding:          10px;
            background:       var(--solid-header);
            border-bottom:    2px solid var(--accent-cyan);
            border-radius:    4px 4px 0 0;
            cursor:           grab;
        }
        #mg-header:active { cursor: grabbing; }
        #mg-glyph {
            width:           28px;
            height:          28px;
            flex-shrink:     0;
            pointer-events:  none;
        }
        #mg-title {
            /* v8.1.0 rebrand: compact label scale, not a heading — the name is
             * Media Player Controller, set at control-label size per spec §4.3. */
            font-family:     var(--font-display);
            font-size:       10px;
            font-weight:     700;
            color:           var(--text-cyan-active);
            line-height:     1.1;
            letter-spacing:  2px;
        }
        #mg-subtitle {
            font-family:     var(--font-body);
            font-size:       9pt;
            color:           rgba(0, 229, 255, 0.7);
            line-height:     1.2;
        }
        #mg-titlebar-text { display: flex; flex-direction: column; min-width: 0; }

        .mg-body { padding: 12px 16px; }

        .mg-row {
            display:       flex;
            align-items:   center;
            gap:           8px;
            margin-bottom: 9px;
        }
        .mg-row-label {
            font-weight:   bold;
            color:         var(--accent-cyan);
            font-size:     10px;
            flex-shrink:   0;
        }

        /* ── Standard control surfaces (spec §4.4) ── */
        #mpc-hud-ui button {
            background:      var(--glass-2-popup);
            border:          1px solid var(--accent-cyan-border);
            color:           var(--accent-cyan);
            padding:         5px 9px;
            border-radius:   0px; /* strict rectangular brutalism */
            cursor:          pointer;
            transition:      all 150ms ease-in-out;
            font-size:       10.5px;
            font-family:     var(--font-body);
            font-weight:     bold;
        }
        #mpc-hud-ui button:hover {
            background:      var(--cyan-wash);
            border-color:    var(--accent-cyan);
            box-shadow:      0 0 20px var(--glow-cyan-hover);
            color:           var(--text-cyan-active);
        }
        #mpc-hud-ui button:active {
            background:      var(--cyan-wash-strong);
            color:           var(--absolute-light);
        }
        /* toggled/checked state — switch:checked wash (spec §4.6) */
        #mpc-hud-ui button.active {
            color:           var(--text-cyan-active);
            background:      var(--cyan-wash);
            border-color:    var(--accent-cyan);
            box-shadow:      0 0 10px var(--glow-cyan-active);
        }

        input[type="range"] {
            accent-color:    var(--accent-cyan);
            width:           130px;
            height:          4px;
            cursor:          pointer;
        }

        /* ── Speed readout ── */
        #mg-speed-val {
            font-weight:     bold;
            color:           var(--text-cyan-active);
            min-width:       48px;
            text-align:      right;
            font-size:       11px;
            border:          1px solid var(--accent-cyan-border2);
            background:      var(--glass-3-panel);
            padding:         3px 6px;
            flex-shrink:     0;
        }

        /* ── Actions row ── */
        .mg-actions {
            display:         flex;
            gap:             6px;
            flex-wrap:       wrap;
        }
        .mg-actions button { flex: 1; padding: 7px 0; font-size: 10px; letter-spacing: 0.5px; }

        /* ── Icon buttons (rotate row) ── */
        .mg-icon-btn {
            padding:     5px 8px  !important;
            font-size:   11px     !important;
            line-height: 1        !important;
            flex-shrink: 0;
        }

        /* ── Maximize active — destructive alert hex (spec §2.1 / §4.5) ── */
        #mg-maximize.active {
            color:        var(--accent-destructive);
            border-color: var(--accent-destructive);
            box-shadow:   0 0 10px rgba(255, 0, 85, 0.3);
        }

        /* ── Nav arrows ── */
        #mg-nav-prev, #mg-nav-next { font-size: 13px !important; }

        /* ── Hotkey reference popover (spec §4.7) ── */
        #mg-help-panel {
            background:      var(--glass-2-popup);
            border:          1px solid var(--accent-cyan-border2);
            border-radius:   4px;
            box-shadow:      0 0 20px var(--glow-cyan-window);
            padding:         8px;
            margin-top:      4px;
        }
        #mg-help-panel[hidden] { display: none; }
        .mg-help-row {
            display:       flex;
            align-items:   center;
            gap:           8px;
            padding:       5px;
            color:         var(--accent-cyan);
            font-size:     10px;
            transition:    all 150ms ease-in-out;
        }
        .mg-help-row:hover {
            background:    var(--cyan-wash);
            color:         var(--absolute-light);
        }
        .mg-key {
            display:          inline-block;
            min-width:        86px;
            text-align:       center;
            background:       var(--glass-3-panel);
            border:           1px solid var(--accent-cyan-border2);
            border-radius:    0;
            padding:          2px 4px;
            font-weight:      bold;
            color:            var(--text-cyan-active);
            flex-shrink:      0;
        }

        /* ── Cyan-Glass Scrub Bar (per-video floating seek control) ── */
        .psi-scrub-bar {
            position:        fixed;
            z-index:         2147483645; /* below HUD, above maximized video chrome */
            display:         flex;
            align-items:     center;
            gap:             8px;
            padding:         6px 10px;
            background:      var(--glass-2-popup);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border:          1px solid var(--accent-cyan-border2);
            border-radius:   4px;
            box-shadow:      0 0 20px var(--glow-cyan-window);
            font-family:     var(--font-body);
            font-size:       10px;
            color:           var(--accent-cyan);
            user-select:     none;
            opacity:         0;
            pointer-events:  none;
            transition:      opacity 150ms ease-in-out;
        }
        .psi-scrub-bar.psi-scrub-visible {
            opacity:         1;
            pointer-events:  auto;
        }
        .psi-scrub-time {
            flex-shrink:     0;
            white-space:     nowrap;
            letter-spacing:  0.3px;
            min-width:       78px;
            text-align:      center;
        }
        .psi-scrub-track {
            position:        relative;
            flex:            1;
            height:          4px;
            min-width:       80px;
            background:      rgba(0, 229, 255, 0.15);
            border-radius:   2px;
            cursor:          pointer;
        }
        .psi-scrub-fill {
            position:        absolute;
            top: 0; left: 0; bottom: 0;
            width:           0%;
            background:      var(--accent-cyan);
            border-radius:   2px;
            box-shadow:      0 0 6px var(--glow-cyan-active);
            pointer-events:  none;
        }
        .psi-scrub-handle {
            position:        absolute;
            top:             50%;
            left:            0%;
            width:           10px;
            height:          10px;
            border-radius:   50%;
            background:      var(--text-cyan-active);
            box-shadow:      0 0 8px var(--glow-cyan-active);
            transform:       translate(-50%, -50%);
            pointer-events:  none;
        }
        .psi-scrub-track:hover .psi-scrub-fill,
        .psi-scrub-bar.psi-scrub-dragging .psi-scrub-fill {
            box-shadow: 0 0 10px var(--glow-cyan-active), 0 0 2px var(--accent-cyan);
        }

        /* ── Download button (active media) ── */
        .psi-dl-btn {
            position:        fixed;
            z-index:         2147483645;
            width:           32px;
            height:          32px;
            padding:         0;
            display:         flex;
            align-items:     center;
            justify-content: center;
            background:      var(--glass-2-popup);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border:          1px solid var(--accent-cyan-border2);
            border-radius:   0px; /* spec §4.4 brutalism */
            box-shadow:      0 0 20px var(--glow-cyan-window);
            color:           var(--text-cyan-active);
            font-size:       16px;
            line-height:     1;
            cursor:          pointer;
            opacity:         0;
            pointer-events:  none;
            transition:      all 150ms ease-in-out;
        }
        .psi-dl-btn.psi-dl-visible { opacity: 1; pointer-events: auto; }
        .psi-dl-btn:hover {
            border-color:    var(--accent-cyan);
            box-shadow:      0 0 20px var(--glow-cyan-hover);
            color:           var(--text-cyan-active);
            transform:       scale(1.08);
        }
        .psi-dl-btn.psi-dl-busy {
            color:           var(--absolute-light);
            background:      var(--cyan-wash);
            opacity:         0.7 !important;
            cursor:          wait;
        }

        /* ── Notification overlay — .notification-label (spec §5.0) ── */
        #psi-toast {
            position:        fixed;
            top:             12%;
            left:            50%;
            transform:       translateX(-50%);
            z-index:         2147483647;
            padding:         8px 18px;
            background:      var(--glass-2-popup);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border:          1px solid var(--accent-cyan-border2);
            border-radius:   4px;
            box-shadow:      0 0 20px var(--glow-cyan-window);
            color:           var(--absolute-light);
            font-family:     var(--font-body);
            font-weight:     bold;
            font-size:       12px;
            letter-spacing:  1px;
            pointer-events:  none;
            opacity:         0;
            transition:      opacity 150ms ease-in-out;
        }
        #psi-toast.psi-toast-visible { opacity: 1; }
    `);

    // ==========================================
    // CORE EXECUTION ENGINE (Event Driven)
    // ==========================================

    /**
     * Synchronizes playback speed across ALL video elements in the frame
     * (light DOM + shadow DOM registry). Visual transforms (rotate/zoom/pan)
     * are applied to the active media target — video OR image (image support
     * salvaged from the igdl variant; object-position applies to video only).
     *
     * GATE 2 FIX (§4.5 — no architectural chimeras, from the v6.0.0-Ψ beta):
     * the scrub bar and download button position-sync were previously bolted
     * on via a two-stage runtime monkey-patch chain (`let applyMediaState`
     * reassigned twice, each stage capturing and wrapping the prior value).
     * This is now a single composed `const` calling the position functions by
     * name (they are hoisted function declarations).
     *
     * GATE 1 FIX (child-frame regression introduced by the beta): the beta's
     * composed function called the top-frame-only position functions
     * unguarded, which throws TDZ ReferenceErrors inside child frames where
     * the scrub bar / download button DOM was never created. The IS_TOP guard
     * restores the baseline's child-frame purity while keeping the single
     * composed pipeline — a strict superset of BOTH prior versions.
     */
    const applyMediaState = () => {
        allVideos().forEach(v => {
            if (v.playbackRate !== targetSpeed) v.playbackRate = targetSpeed;
        });
        const media = getActiveMedia();
        if (media) {
            media.style.transform      = `rotate(${state.rotation}deg) scale(${state.zoom})`;
            media.style.transformOrigin = `${state.panX}% ${state.panY}%`;
            if (media.tagName === 'VIDEO') {
                media.style.objectPosition  = `${state.panX}% ${state.panY}%`;
            }
        }
        if (IS_TOP) {
            positionScrubBar();
            updateScrubProgress();
            positionDownloadButton();
        }
    };

    /**
     * Acquires a video as the active target.
     *
     * BUG FIX (Bug 3, baseline lineage): Guard returns early when
     * video === activeVideo. pauseAllExcept() is only called on a genuine NEW
     * target — it never re-fires on the same video, preventing the PLAY button
     * from being immediately countered by a spurious pause.
     */
    function acquireTarget(video, autoPlay = false) {
        if (!video || video === activeVideo) return;
        activeVideo = video;
        activeImage = null; // Video acquisition always supersedes a stale image target
        pauseAllExcept(video);
        applyMediaState();
        if (autoPlay) {
            video.play().catch(() => { /* Autoplay blocked — silently accept */ });
        }
        if (syncPlayButton) syncPlayButton();
    }

    /**
     * Acquires a story/post <img> as the active media target.
     *
     * Images have no play/pause/scrub semantics, so this never touches
     * pauseAllExcept or autoplay. It exists so the download button (and its
     * position tracking) has something to anchor to when the current story
     * slide is a photo rather than a video — and, since v7, so rotation,
     * zoom/pan and smart-maximize apply to images as well.
     */
    function acquireImage(img) {
        if (!img || img === activeImage) return;
        activeImage = img;
        activeVideo = null; // Image acquisition always supersedes a stale video target
        applyMediaState();
    }

    /**
     * Identifies whether an element is a "real" story/post image worth
     * tracking — excludes tiny avatars, icons, and emoji that litter the
     * IG DOM, since those should never become the active download target.
     */
    function isTrackableImage(el) {
        if (!el || el.tagName !== 'IMG') return false;
        const rect = el.getBoundingClientRect();
        return rect.width >= 150 && rect.height >= 150;
    }

    // ==========================================
    // MEDIA EVENT DISPATCHERS (document capture + shadow delegation)
    // ==========================================

    /**
     * 'play' dispatcher. Consolidates the baseline's three document-level
     * 'play' capture listeners (acquisition, active-media observer re-arm,
     * repeat observer re-arm) into one handler with identical ordering, and
     * routes shadow-rooted videos through the same path via trackVideo().
     * Gap fix: a stale activeImage is now cleared on video play, matching
     * acquireTarget() semantics (baseline left it stale).
     */
    function onMediaPlayEvent(e) {
        const t = e.target;
        if (!t || t.tagName !== 'VIDEO') return;
        if (t !== activeVideo) {
            activeVideo = t;
            activeImage = null;
            pauseAllExcept(t);
            applyMediaState();
        }
        state.isPlaying = true;
        if (syncPlayButton) syncPlayButton();
        if (IS_TOP) {
            startMediaObserver();
            if (repeatActive && t !== repeatTrackedVideo) startRepeatObserver();
        }
    }

    /** 'pause' dispatcher — mirrors the baseline document capture listener. */
    function onMediaPauseEvent(e) {
        if (e.target === activeVideo) {
            state.isPlaying = false;
            if (syncPlayButton) syncPlayButton();
        }
    }

    /**
     * 'timeupdate' dispatcher — routes to the scrub progress update (top
     * frame, suppressed while dragging) and the repeat engine's near-end
     * sentinel (Layer B). IS_TOP guard keeps repeat-engine state (declared in
     * the top-frame section) unreachable from child frames — the baseline
     * registered these listeners in the top frame only, so this preserves
     * validated semantics exactly.
     */
    function onMediaTimeUpdateEvent(e) {
        if (!IS_TOP) return;
        if (e.target === activeVideo && !scrubIsDragging) {
            updateScrubProgress();
        }
        onTimeUpdate(e);
    }

    /** 'ended' dispatcher — repeat engine Layer C fallback (top frame only). */
    function onMediaEndedEvent(e) {
        if (IS_TOP) onVideoEnded(e);
    }

    /** 'loadedmetadata' dispatcher — refreshes the scrub readout. */
    function onMediaLoadedMetaEvent(e) {
        if (IS_TOP && e.target === activeVideo) updateScrubProgress();
    }

    document.addEventListener('play',           onMediaPlayEvent,      true);
    document.addEventListener('pause',          onMediaPauseEvent,     true);
    document.addEventListener('timeupdate',     onMediaTimeUpdateEvent,{ passive: true, capture: true });
    document.addEventListener('ended',          onMediaEndedEvent,     true);
    document.addEventListener('loadedmetadata', onMediaLoadedMetaEvent,true);

    // Target acquisition via native play event (site or user initiates playback)

    // Hover acquisition — does NOT auto-play, does NOT re-pause if same video.
    // Composed mouseover events retarget at the shadow host, so shadow-rooted
    // videos are covered by trackVideo()'s direct listener instead.
    document.addEventListener('mouseover', (e) => {
        if (e.target.tagName === 'VIDEO' && e.target !== activeVideo) {
            acquireTarget(e.target, false);
        } else if (isTrackableImage(e.target) && e.target !== activeImage) {
            acquireImage(e.target);
        }
    }, { passive: true, capture: true });

    // ==========================================
    // DOUBLE-CLICK PLAY / PAUSE
    // ==========================================
    function handleDblClick(e) {
        const video = (e.target.tagName === 'VIDEO' && e.target) ||
                      e.target.closest('video') ||
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
        if (syncPlayButton) syncPlayButton();
    }
    document.addEventListener('dblclick', handleDblClick, true);

    // Cross-frame speed sync
    GM_addValueChangeListener('media_speed', (_, __, val) => {
        targetSpeed = val;
        applyMediaState();
        if (IS_TOP && updateActiveSpeed) {
            updateActiveSpeed(targetSpeed);
        }
    });

    // Cross-frame ad-skip toggle sync
    GM_addValueChangeListener('adskip_enabled', (_, __, val) => {
        adSkipEnabled = !!val;
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
        // Clamp widened from the baseline's 5.0 to the igdl variant's 8.0 —
        // a strict superset (every previously reachable zoom is still reachable).
        state.zoom  = Math.max(0.5, Math.min(8.0, state.zoom + delta));
        requestAnimationFrame(applyMediaState);
        if (IS_TOP) showToast('ZOOM ' + state.zoom.toFixed(1) + 'x');
    }, { passive: false });

    // ==========================================
    // AD AUTO-SKIP ENGINE (salvaged from igdl variant)
    // ==========================================
    // YouTube-specific: clicks the skip button when it appears and
    // fast-forwards unskippable ad creatives while .ad-showing is set.
    // Toggleable from the HUD (SKIP button, persisted via GM storage) and
    // synced across frames. Gated on hostname + visibility so the 400ms poll
    // is a no-op everywhere else. The fpsbooster heuristic (pause/remove any
    // video under 10s) was audited and REJECTED as destructive — the
    // duration-rewind below only touches the dedicated ad-showing creative.
    let adSkipEnabled = GM_getValue('adskip_enabled', true);

    function runAdSkipSweep() {
        if (!adSkipEnabled || document.hidden) return;
        if (!/(^|\.)youtube(-nocookie)?\.com$/.test(location.hostname)) return;

        const skipBtn = document.querySelector(
            '.ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-skip-button-modern'
        );
        if (skipBtn) {
            try { skipBtn.click(); } catch (_) { /* button detached mid-sweep */ }
            return;
        }

        const adVideo = document.querySelector('.html5-video-player.ad-showing video');
        if (adVideo && isFinite(adVideo.duration) && adVideo.duration > 0) {
            // Fix over the igdl original: `duration || 0` rewound to 0 on NaN.
            try {
                adVideo.currentTime = adVideo.duration;
                adVideo.playbackRate = 16.0;
            } catch (_) { /* ad element mid-teardown — next sweep retries */ }
        }
    }
    setInterval(runAdSkipSweep, 400);

    // ==========================================
    // TOP-FRAME UI BOUNDARY
    // ==========================================
    // Everything below this line exists only in the top frame. Shared-section
    // functions reference these hoisted declarations exclusively behind the
    // IS_TOP guard or a null check.
    if (!IS_TOP) return;

    // ==========================================
    // NOTIFICATION OVERLAY (toast — spec §5.0 .notification-label)
    // ==========================================
    // Salvaged from html5videoplayingtools' tip() and rebuilt on the
    // 3lectric-Glass notification tokens. Single element, retargeted text,
    // idempotent timer lifecycle (GUP D.4).
    const toastEl = document.createElement('div');
    toastEl.id = 'psi-toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);

    let toastTimer = null;
    function showToast(message) {
        toastEl.textContent = message;
        toastEl.classList.add('psi-toast-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('psi-toast-visible');
        }, 1600);
    }

    // ==========================================
    // HUD INJECTION (3LECTRIC-GLASS TOPOLOGY)
    // ==========================================
    const ui = document.createElement('div');
    ui.id = 'mpc-hud-ui';
    /* [R3] element-built HUD (was an innerHTML template). IDs,
     * classes, data-speed keys and help rows preserved 1:1. */
    const mgcHeader = document.createElement('div');
    mgcHeader.id = 'mg-header';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const mgcGlyph = document.createElementNS(SVG_NS, 'svg');
    mgcGlyph.id = 'mg-glyph';
    mgcGlyph.setAttribute('viewBox', '0 0 128 128');
    mgcGlyph.setAttribute('xmlns', SVG_NS);
    mgcGlyph.setAttribute('fill', 'none');
    mgcGlyph.setAttribute('stroke', 'var(--accent-cyan)');
    mgcGlyph.setAttribute('stroke-width', '3');
    mgcGlyph.setAttribute('stroke-linecap', 'round');
    mgcGlyph.setAttribute('stroke-linejoin', 'round');
    const ug1 = document.createElementNS(SVG_NS, 'path');
    ug1.setAttribute('d', 'M 64,12 A 52,52 0 1 1 63.9,12 Z');
    ug1.setAttribute('stroke-dasharray', '21.78 21.78');
    ug1.setAttribute('stroke-width', '2');
    const ug2 = document.createElementNS(SVG_NS, 'path');
    ug2.setAttribute('d', 'M 64,20 A 44,44 0 1 1 63.9,20 Z');
    ug2.setAttribute('stroke-dasharray', '10 10');
    ug2.setAttribute('stroke-width', '1.5');
    ug2.setAttribute('opacity', '0.7');
    const ug3 = document.createElementNS(SVG_NS, 'path');
    ug3.setAttribute('d', 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z');
    const ugPsi = document.createElementNS(SVG_NS, 'text');
    ugPsi.setAttribute('x', '64');
    ugPsi.setAttribute('y', '67');
    ugPsi.setAttribute('text-anchor', 'middle');
    ugPsi.setAttribute('dominant-baseline', 'middle');
    ugPsi.setAttribute('fill', 'var(--accent-cyan)');
    ugPsi.setAttribute('stroke', 'none');
    ugPsi.setAttribute('font-size', '56');
    ugPsi.setAttribute('font-weight', '700');
    ugPsi.setAttribute('font-family', "'Cinzel Decorative', serif");
    ugPsi.textContent = 'Ψ';
    mgcGlyph.append(ug1, ug2, ug3, ugPsi);
    const mgcTitlebar = document.createElement('div');
    mgcTitlebar.id = 'mg-titlebar-text';
    const mgcTitle = document.createElement('div');
    mgcTitle.id = 'mg-title';
    mgcTitle.textContent = 'MEDIA PLAYER CONTROLLER';
    const mgcSubtitle = document.createElement('div');
    mgcSubtitle.id = 'mg-subtitle';
    mgcSubtitle.textContent = '4ndr0666tools · v8.1.0';
    mgcTitlebar.append(mgcTitle, mgcSubtitle);
    const mgcHelpBtn = document.createElement('button');
    mgcHelpBtn.id = 'mg-help';
    mgcHelpBtn.className = 'mg-icon-btn';
    mgcHelpBtn.title = 'Hotkey reference';
    mgcHelpBtn.textContent = '?';
    mgcHeader.append(mgcGlyph, mgcTitlebar, mgcHelpBtn);
    const mgcBody = document.createElement('div');
    mgcBody.className = 'mg-body';
    const mgcSpeedRow = document.createElement('div');
    mgcSpeedRow.className = 'mg-row speed-row';
    for (const s of ['0.25', '0.50', '0.75', '1.00', '1.50', '2.00', '3.00']) {
        const b = document.createElement('button');
        b.dataset.speed = s;
        b.textContent = s;
        mgcSpeedRow.appendChild(b);
    }
    const mgcSpeedVal = document.createElement('span');
    mgcSpeedVal.id = 'mg-speed-val';
    mgcSpeedVal.textContent = '1.00x';
    mgcSpeedRow.appendChild(mgcSpeedVal);
    const mgcRotRow = document.createElement('div');
    mgcRotRow.className = 'mg-row';
    const mgcRotLabel = document.createElement('span');
    mgcRotLabel.className = 'mg-row-label';
    mgcRotLabel.textContent = 'ROT';
    const mgcRotSlider = document.createElement('input');
    mgcRotSlider.type = 'range';
    mgcRotSlider.id = 'rotate-slider';
    mgcRotSlider.min = '0'; mgcRotSlider.max = '360'; mgcRotSlider.value = '0'; mgcRotSlider.step = '1';
    const mgcRotVal = document.createElement('span');
    mgcRotVal.id = 'rotate-val';
    mgcRotVal.style.cssText = 'width:30px;text-align:right;';
    mgcRotVal.textContent = '0°';
    const iconBtn = (id, title, glyph, extraSpace) => {
        const b = document.createElement('button');
        b.id = id;
        b.className = 'mg-icon-btn';
        b.title = title;
        b.textContent = glyph;
        return b;
    };
    mgcRotRow.append(mgcRotLabel, mgcRotSlider, mgcRotVal,
        iconBtn('rotate-reset', 'Reset rotation', '↺'),
        iconBtn('mg-view-reset', 'Reset view (zoom + pan)', '↩'),
        iconBtn('mg-maximize', 'Smart maximize / restore (Esc)', '⤢'),
        iconBtn('mg-nativefs', 'Native fullscreen (Enter)', '⛶'),
        iconBtn('mg-pip', 'Picture in Picture (I)', '⧉'));
    const mgcActionsRow = document.createElement('div');
    mgcActionsRow.className = 'mg-actions';
    const actBtn = (id, text, title) => {
        const b = document.createElement('button');
        b.id = id;
        if (title) b.title = title;
        b.textContent = text;
        return b;
    };
    mgcActionsRow.append(
        actBtn('mg-play', 'PLAY'),
        actBtn('mg-nav-prev', '<', 'Previous story / prev media (Shift+N)'),
        actBtn('mg-nav-next', '>', 'Next story / next media (N)'),
        actBtn('mg-repeat', '○ REPEAT', 'Loop / repeat current story'),
        actBtn('mg-mute', 'MUTE', 'Mute toggle (M)'),
        actBtn('mg-adskip', 'SKIP', 'Toggle ad auto-skip'));
    const mgcHelpPanel = document.createElement('div');
    mgcHelpPanel.id = 'mg-help-panel';
    mgcHelpPanel.hidden = true;
    const mgcHelpRows = [
        ['SPACE', 'Play / pause active video'],
        ['← / →', 'Seek −5s / +5s'],
        ['SHIFT ← / →', 'Seek −20s / +20s'],
        ['↑ / ↓', 'Volume +10% / −10%'],
        ['D / F', 'Frame back / forward (pauses)'],
        ['Z', 'Toggle remembered fast speed'],
        ['X / C', 'Playback rate −0.1 / +0.1'],
        ['M', 'Mute toggle'],
        ['P', 'Screenshot frame → PNG'],
        ['I', 'Picture-in-Picture toggle'],
        ['ENTER', 'Native fullscreen toggle'],
        ['N / SHIFT N', 'Next / previous story media'],
        ['ALT+M', 'Hide / show this HUD'],
        ['ESC', 'Restore maximized video'],
        ['ALT+SHIFT', '+ drag = pan · + wheel = zoom'],
    ];
    for (const [key, desc] of mgcHelpRows) {
        const row = document.createElement('div');
        row.className = 'mg-help-row';
        const keySpan = document.createElement('span');
        keySpan.className = 'mg-key';
        keySpan.textContent = key;
        const descSpan = document.createElement('span');
        descSpan.textContent = desc;
        row.append(keySpan, descSpan);
        mgcHelpPanel.appendChild(row);
    }
    mgcBody.append(mgcSpeedRow, mgcRotRow, mgcActionsRow, mgcHelpPanel);
    ui.append(mgcHeader, mgcBody);
    document.body.appendChild(ui);

    // ==========================================
    // DRAGGABLE HUD WITH GM POSITION MEMORY
    // ==========================================
    let isDragging = false, ox = 0, oy = 0;
    const hudHeader = ui.querySelector('#mg-header');

    hudHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // help button is not a drag handle
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
    // SPEED CONTROL (discrete buttons + fine ±0.1 hotkeys)
    // ==========================================
    const speedButtons = ui.querySelectorAll('.speed-row button');
    const speedValEl   = ui.querySelector('#mg-speed-val');

    updateActiveSpeed = (speed) => {
        speedButtons.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.speed) === speed));
        speedValEl.textContent = speed.toFixed(2) + 'x';
    };
    updateActiveSpeed(targetSpeed);

    /**
     * Single speed mutation path (buttons, X/C/Z hotkeys all route here).
     * Clamps to [0.1, 16] (html5videoplayingtools range — a superset of the
     * baseline's 0.25–3.00 button ladder), persists across sessions, syncs
     * every frame through the GM value listener, and remembers the fast rate
     * for the Z toggle. Idempotent: re-applying the same value is a no-op.
     */
    function setSpeed(speed) {
        const clamped = Math.max(0.1, Math.min(16, +Number(speed).toFixed(2)));
        if (clamped !== 1) GM_setValue('media_fast_rate', clamped);
        targetSpeed = clamped;
        GM_setValue('media_speed', clamped);
        applyMediaState();
        updateActiveSpeed(clamped);
        showToast('RATE ' + clamped.toFixed(2) + 'x');
    }

    speedButtons.forEach(btn => btn.addEventListener('click', () => {
        setSpeed(parseFloat(btn.dataset.speed));
    }));

    /** Fine rate adjustment (html5videoplayingtools actList X/C). */
    function adjustRate(delta) {
        setSpeed(targetSpeed + delta);
    }

    /** Toggle between 1x and the remembered fast rate (actList Z). */
    function toggleFastSpeed() {
        const fast = GM_getValue('media_fast_rate', 1.3);
        setSpeed(targetSpeed === 1 ? fast : 1);
    }

    // ==========================================
    // PLAY / PAUSE BUTTON
    // ==========================================
    //
    // BUG FIX (Bug 3, baseline lineage): The Handler NO LONGER calls
    // acquireTarget() on the already-active video. That was the root cause:
    // acquireTarget → pauseAllExcept → video.pause() fired synchronously, then
    // .play() was called on a newly-paused video, which some browsers
    // silently reject (AbortError) or which IG overrides.
    //
    // New flow:
    //   1. If no activeVideo yet → call acquireTarget(first) once to register it.
    //      (pauseAllExcept is fine here since nothing was active.)
    //   2. Read activeVideo directly, toggle play/pause — no re-acquisition.
    //
    // BUG FIX (Bug 4, baseline lineage): Labels are plain ASCII "PLAY" /
    // "PAUSE" — no unicode glyphs that break the monospace button aesthetic.

    const btnPlay = ui.querySelector('#mg-play');

    syncPlayButton = () => {
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
        // v8.1.0: the fallback uses the BEST candidate (largest visible,
        // playing preferred — acquireBestCandidate), not the first <video>
        // in the DOM (which was routinely a hidden/ad/preview node); a
        // detached stale target (SPA teardown) is re-acquired the same way.
        if (activeTargetStale()) {
            const candidate = acquireBestCandidate();
            if (!candidate) return;
            acquireTarget(candidate, false); // Full acquisition safe — nothing was live
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

    // ==========================================
    // ROTATION / VIEW RESET
    // ==========================================
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
        showToast('ROTATION 0°');
    });

    // --- Reset View (zoom + pan) ---
    ui.querySelector('#mg-view-reset').addEventListener('click', () => {
        state.zoom  = 1.0;
        state.panX  = 50;
        state.panY  = 50;
        requestAnimationFrame(applyMediaState);
        showToast('VIEW RESET');
    });

    // ==========================================
    // SMART MAXIMIZE (media-general: video or image)
    // ==========================================
    const btnMax = ui.querySelector('#mg-maximize');

    btnMax.addEventListener('click', () => {
        // Gap fix over baseline: images are maximizable too (igdl semantics).
        const m = getActiveMedia() || document.querySelector('video');
        if (!m) return;
        if (m !== activeVideo && m !== activeImage) {
            if (m.tagName === 'IMG') acquireImage(m); else acquireTarget(m, false);
        }
        state.isMaximized = !state.isMaximized;
        if (state.isMaximized) {
            document.body.classList.add('psi-max-locked');
            m.classList.add('psi-media-maximized');
            btnMax.textContent = '⬛';
            btnMax.title       = 'Restore';
            btnMax.classList.add('active');
        } else {
            document.body.classList.remove('psi-max-locked');
            m.classList.remove('psi-media-maximized');
            btnMax.textContent = '⤢';
            btnMax.title       = 'Smart maximize / restore (Esc)';
            btnMax.classList.remove('active');
        }
        applyMediaState();
    });

    // ==========================================
    // NATIVE FULLSCREEN (salvaged from html5videoplayingtools FullScreen)
    // ==========================================
    function toggleNativeFullscreen() {
        const v = activeVideo || document.querySelector('video');
        if (!v) { showToast('NO VIDEO'); return; }
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            const exit = document.exitFullscreen || document.webkitExitFullscreen;
            if (typeof exit !== 'function') { showToast('FULLSCREEN UNSUPPORTED'); return; }
            try {
                const p = exit.call(document);
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (err) {
                console.warn('[4NDR0666OS] fullscreen exit failed:', err);
            }
        } else {
            const req = v.requestFullscreen || v.webkitRequestFullscreen;
            if (typeof req !== 'function') { showToast('FULLSCREEN UNSUPPORTED'); return; }
            try {
                const p = req.call(v);
                if (p && typeof p.catch === 'function') {
                    p.catch((err) => {
                        console.warn('[4NDR0666OS] fullscreen request failed:', err);
                        showToast('FULLSCREEN DENIED');
                    });
                }
            } catch (err) {
                console.warn('[4NDR0666OS] fullscreen request failed:', err);
                showToast('FULLSCREEN DENIED');
            }
        }
    }
    ui.querySelector('#mg-nativefs').addEventListener('click', toggleNativeFullscreen);

    // ==========================================
    // PICTURE IN PICTURE
    // ==========================================
    function togglePiP() {
        const v = activeVideo || document.querySelector('video');
        if (!v) { showToast('NO VIDEO'); return; }
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch((err) => {
                console.warn('[4NDR0666OS] PiP exit failed:', err);
            });
        } else if (typeof v.requestPictureInPicture === 'function') {
            v.requestPictureInPicture().catch((err) => {
                console.warn('[4NDR0666OS] PiP request failed:', err);
                showToast('PIP DENIED');
            });
        } else {
            showToast('PIP UNSUPPORTED');
        }
    }
    ui.querySelector('#mg-pip').addEventListener('click', togglePiP);

    // ==========================================
    // VOLUME / MUTE (salvaged from html5videoplayingtools actList)
    // ==========================================
    const btnMute = ui.querySelector('#mg-mute');

    function adjustVolume(delta) {
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        const next = Math.max(0, Math.min(1, +((v.volume || 0) + delta).toFixed(2)));
        v.volume = next;
        if (next > 0 && v.muted) v.muted = false;
        syncMuteButton();
        showToast('VOL ' + Math.round(next * 100) + '%');
    }

    function toggleMute() {
        const v = activeVideo || document.querySelector('video');
        if (!v) { showToast('NO VIDEO'); return; }
        v.muted = !v.muted;
        syncMuteButton();
        showToast(v.muted ? 'MUTED' : 'UNMUTED');
    }

    function syncMuteButton() {
        const v = activeVideo || document.querySelector('video');
        btnMute.classList.toggle('active', !!(v && v.muted));
    }
    btnMute.addEventListener('click', toggleMute);

    // ==========================================
    // AD-SKIP TOGGLE
    // ==========================================
    const btnAdSkip = ui.querySelector('#mg-adskip');
    btnAdSkip.classList.toggle('active', adSkipEnabled);
    btnAdSkip.addEventListener('click', () => {
        adSkipEnabled = !adSkipEnabled;
        GM_setValue('adskip_enabled', adSkipEnabled);
        btnAdSkip.classList.toggle('active', adSkipEnabled);
        showToast(adSkipEnabled ? 'AD-SKIP ON' : 'AD-SKIP OFF');
    });

    // ==========================================
    // HOTKEY REFERENCE POPOVER
    // ==========================================
    const helpPanel = ui.querySelector('#mg-help-panel');
    ui.querySelector('#mg-help').addEventListener('click', () => {
        helpPanel.hidden = !helpPanel.hidden;
    });

    // ==========================================
    // CYAN-GLASS SCRUB BAR (per-video floating seek control)
    // ==========================================
    //
    // Replaces native <video controls> entirely — no browser chrome is ever
    // enabled. A single floating bar tracks whichever video is `activeVideo`
    // and re-positions itself under that video's live bounding rect on every
    // rAF tied to the existing applyMediaState/sweep cadence, so it survives
    // rotation, zoom, pan, maximize, and scroll without a second polling loop.
    //
    // Applies uniformly across Instagram contexts (feed, reels, stories) and
    // any other site this script runs on — there is no IG-specific branch
    // here, the bar simply tracks whatever activeVideo currently is.
    //
    // isScrubbing is exported on `state` so the Story Repeat engine (added
    // below) can suppress its near-end timeupdate arming while the user is
    // mid-drag, preventing a false repeat trigger from a manual seek.

    const scrubBar = document.createElement('div');
    scrubBar.className = 'psi-scrub-bar';
    const scrubTimeEl = document.createElement('span');
    scrubTimeEl.className = 'psi-scrub-time';
    scrubTimeEl.textContent = '0:00 / 0:00';
    const scrubTrackEl = document.createElement('div');
    scrubTrackEl.className = 'psi-scrub-track';
    const scrubFillEl = document.createElement('div');
    scrubFillEl.className = 'psi-scrub-fill';
    const scrubHandleEl = document.createElement('div');
    scrubHandleEl.className = 'psi-scrub-handle';
    scrubTrackEl.append(scrubFillEl, scrubHandleEl);
    scrubBar.append(scrubTimeEl, scrubTrackEl);
    document.body.appendChild(scrubBar);

    const scrubTime   = scrubBar.querySelector('.psi-scrub-time');
    const scrubTrack  = scrubBar.querySelector('.psi-scrub-track');
    const scrubFill   = scrubBar.querySelector('.psi-scrub-fill');
    const scrubHandle = scrubBar.querySelector('.psi-scrub-handle');

    let scrubIsDraggingLocal = false;

    /** Formats seconds as M:SS (or H:MM:SS for anything over an hour). */
    function formatScrubTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
        const ss = String(s).padStart(2, '0');
        return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
    }

    /** Repositions the scrub bar directly under the active video's live rect. */
    function positionScrubBar() {
        if (!activeVideo || !document.body.contains(activeVideo)) {
            scrubBar.classList.remove('psi-scrub-visible');
            return;
        }
        const rect = activeVideo.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) {
            scrubBar.classList.remove('psi-scrub-visible');
            return;
        }
        const barWidth = Math.max(160, Math.min(rect.width - 16, 480));
        scrubBar.style.width  = barWidth + 'px';
        scrubBar.style.left   = (rect.left + (rect.width - barWidth) / 2) + 'px';
        scrubBar.style.top    = (rect.bottom - 34) + 'px';
        scrubBar.classList.add('psi-scrub-visible');
    }

    /** Updates fill/handle/time readout from the active video's current playback position. */
    function updateScrubProgress() {
        if (!activeVideo) return;
        const dur = activeVideo.duration;
        const cur = activeVideo.currentTime;
        const pct = (isFinite(dur) && dur > 0) ? Math.max(0, Math.min(100, (cur / dur) * 100)) : 0;
        scrubFill.style.width    = pct + '%';
        scrubHandle.style.left   = pct + '%';
        scrubTime.textContent    = `${formatScrubTime(cur)} / ${formatScrubTime(isFinite(dur) ? dur : 0)}`;
    }

    /** Computes a 0..1 ratio from a pointer clientX position over the track. */
    function scrubRatioFromEvent(e) {
        const r = scrubTrack.getBoundingClientRect();
        if (r.width <= 0) return 0;
        return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    }

    /** Seeks the active video to a given 0..1 ratio of its duration. */
    function seekToRatio(ratio) {
        if (!activeVideo) return;
        const dur = activeVideo.duration;
        if (!isFinite(dur) || dur <= 0) return;
        activeVideo.currentTime = ratio * dur;
        updateScrubProgress();
    }

    scrubTrack.addEventListener('mousedown', (e) => {
        if (!activeVideo) return;
        scrubIsDraggingLocal = true;
        scrubIsDragging      = true;
        state.isScrubbing    = true;
        scrubBar.classList.add('psi-scrub-dragging');
        seekToRatio(scrubRatioFromEvent(e));
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!scrubIsDraggingLocal) return;
        seekToRatio(scrubRatioFromEvent(e));
    });

    document.addEventListener('mouseup', () => {
        if (!scrubIsDraggingLocal) return;
        scrubIsDraggingLocal = false;
        scrubIsDragging      = false;
        state.isScrubbing    = false;
        scrubBar.classList.remove('psi-scrub-dragging');
    });

    // Scrub progress and metadata updates arrive through the shared
    // dispatchers (onMediaTimeUpdateEvent / onMediaLoadedMetaEvent), which
    // serve both the document capture listeners and the shadow delegation.
    //
    // Re-run positioning on the same rAF cadence as pan/zoom/rotation so the
    // bar never lags behind a moving/resizing/maximizing video.
    window.addEventListener('scroll', () => requestAnimationFrame(positionScrubBar), { passive: true });
    window.addEventListener('resize', () => requestAnimationFrame(positionScrubBar), { passive: true });

    // ==========================================
    // DOWNLOAD BUTTON (active media — cyan-glass icon)
    // ==========================================
    //
    // Single hover-revealed icon button anchored to the top-right corner of
    // whichever media is active. Fetches the element's current media URL as a
    // blob and saves it locally with its original CDN filename — no renaming,
    // no metadata template, no batch/profile/highlight scraping.
    //
    // This is an original, from-scratch implementation: fetch → blob →
    // object URL → temporary <a download> click → revoke. If the fetch is
    // blocked (CORS, auth-gated CDN response, network failure), it falls back
    // to opening the raw media URL in a new tab so the person can still save
    // it manually via the browser's native "Save As".
    //
    // v7 additions (salvaged from the igdl variant, per the audit directive):
    // blob: URLs — unfetchable by design — route through a MediaRecorder
    // stream capture instead of the hopeless window.open fallback.

    const dlBtn = document.createElement('button');
    dlBtn.className   = 'psi-dl-btn';
    dlBtn.title        = 'Download active media';
    dlBtn.textContent  = '⭳';
    dlBtn.type         = 'button';
    document.body.appendChild(dlBtn);

    /** Extracts a usable filename from a media URL's last path segment. */
    function filenameFromUrl(url, fallbackExt) {
        try {
            const u  = new URL(url);
            const seg = u.pathname.split('/').filter(Boolean).pop() || '';
            if (seg && seg.includes('.')) return decodeURIComponent(seg);
            if (seg) return decodeURIComponent(seg) + '.' + fallbackExt;
        } catch (_) { /* fall through to generic name */ }
        return 'media_' + Date.now() + '.' + fallbackExt;
    }

    /** Repositions the download button at the top-right of the active media (video or image). */
    function positionDownloadButton() {
        const m = getActiveMedia();
        if (!m || !document.body.contains(m)) {
            dlBtn.classList.remove('psi-dl-visible');
            return;
        }
        const rect = m.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) {
            dlBtn.classList.remove('psi-dl-visible');
            return;
        }
        dlBtn.style.left = (rect.right - 40) + 'px';
        dlBtn.style.top  = (rect.top + 8) + 'px';
        dlBtn.classList.add('psi-dl-visible');
    }

    /**
     * Stream capture for blob:-URL videos (igdl salvage, hardened):
     * captureStream → MediaRecorder → blob download. Guards MediaRecorder /
     * captureStream availability, picks the first supported container,
     * flushes chunks on a 250ms timeslice, stops on the earlier of duration
     * bound (≤30s) or natural 'ended', and always restores the busy state.
     */
    function downloadVideoFromBlob(video, filename) {
        if (typeof MediaRecorder === 'undefined') {
            showToast('RECORDER UNSUPPORTED');
            window.open(video.currentSrc || video.src, '_blank', 'noopener');
            return;
        }
        const cap = video.captureStream || video.mozCaptureStream;
        if (typeof cap !== 'function') {
            showToast('CAPTURE UNSUPPORTED');
            window.open(video.currentSrc || video.src, '_blank', 'noopener');
            return;
        }
        try {
            const stream  = cap.call(video);
            const mime    = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm']
                .find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (_) { return false; } });
            const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            const chunks   = [];
            recorder.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
            recorder.onstop = () => {
                try {
                    const blob = new Blob(chunks, { type: mime || 'video/mp4' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = filename + (mime && mime.indexOf('mp4') !== -1 ? '.mp4' : '.webm');
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 4000);
                    showToast('CAPTURE SAVED');
                } finally {
                    dlBtn.classList.remove('psi-dl-busy');
                }
            };
            recorder.onerror = (ev) => {
                console.warn('[4NDR0666OS] recorder error:', (ev && (ev.error || ev.name)) || 'unknown');
                dlBtn.classList.remove('psi-dl-busy');
            };

            dlBtn.classList.add('psi-dl-busy');
            showToast('CAPTURING STREAM…');
            recorder.start(250);
            const stopMs = Math.min(1000 * (isFinite(video.duration) && video.duration > 0 ? video.duration : 10), 30000);
            const stopTimer = setTimeout(() => {
                try { if (recorder.state !== 'inactive') recorder.stop(); } catch (_) { /* already stopped */ }
            }, stopMs);
            video.addEventListener('ended', () => {
                clearTimeout(stopTimer);
                try { if (recorder.state !== 'inactive') recorder.stop(); } catch (_) { /* already stopped */ }
            }, { once: true });
        } catch (err) {
            console.error('[4NDR0666OS] stream capture error:', err);
            dlBtn.classList.remove('psi-dl-busy');
            window.open(video.currentSrc || video.src, '_blank', 'noopener');
        }
    }

    /**
     * Fetches the active media's (video or image) current URL and saves it as
     * a blob.
     *
     * GATE 2 FIX (§4.2 — hard timeout on every external execution, from the
     * v6.0.0-Ψ beta): the fetch is bound to an AbortController armed by a
     * DOWNLOAD_TIMEOUT_MS timer. A hung connection previously left the button
     * stuck in .psi-dl-busy indefinitely. The timer is cleared unconditionally
     * in `finally` (§4.4 — unconditional resource reclamation) — success,
     * HTTP failure, network failure, and abort-timeout all route through the
     * same cleanup path.
     */
    async function downloadActiveMedia() {
        const m = getActiveMedia();
        if (!m) return;
        const isImg = m.tagName === 'IMG';
        const url    = m.currentSrc || m.src;
        if (!url) return;

        if (url.startsWith('blob:') && !isImg) {
            const safeName = (document.title || 'media_capture')
                .replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'media_capture';
            downloadVideoFromBlob(m, safeName);
            return;
        }

        const DOWNLOAD_TIMEOUT_MS = 20000; // 20s hard bound on the fetch
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
        dlBtn.classList.add('psi-dl-busy');
        try {
            const res  = await fetch(url, { credentials: 'omit', signal: controller.signal });
            if (!res.ok) throw new Error('fetch failed: ' + res.status);
            const blob = await res.blob();
            const defaultExt = isImg
                ? ((blob.type && blob.type.includes('png')) ? 'png' : 'jpg')
                : 'mp4';
            const ext  = (blob.type && blob.type.includes('video')) ? 'mp4'
                       : (blob.type && blob.type.includes('png'))   ? 'png'
                       : (blob.type && blob.type.includes('image')) ? 'jpg'
                       : defaultExt;
            const name = filenameFromUrl(url, ext);

            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href     = objectUrl;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
            showToast('DOWNLOAD STARTED');
        } catch (err) {
            // CORS-blocked, network failure, or timeout-abort — fall back to a
            // manual save path so the person can still right-click/Save As.
            if (err && err.name === 'AbortError') {
                console.warn(
                    '[4NDR0666OS] Download fetch timed out after ' + DOWNLOAD_TIMEOUT_MS +
                    'ms, opening media URL directly:', err
                );
            } else {
                console.warn('[4NDR0666OS] Download fetch failed, opening media URL directly:', err);
            }
            window.open(url, '_blank', 'noopener');
        } finally {
            clearTimeout(timeoutId);
            dlBtn.classList.remove('psi-dl-busy');
        }
    }

    dlBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        downloadActiveMedia();
    });

    window.addEventListener('scroll', () => requestAnimationFrame(positionDownloadButton), { passive: true });
    window.addEventListener('resize', () => requestAnimationFrame(positionDownloadButton), { passive: true });

    // Consolidated UI cadence: keeps the scrub bar and download button glued
    // to the active media between events. Supersedes the baseline's two
    // separate 400ms intervals; hidden tabs skip the work entirely.
    setInterval(() => {
        if (document.hidden) return;
        positionScrubBar();
        positionDownloadButton();
    }, 400);

    // ==========================================
    // SCREENSHOT (salvaged from html5videoplayingtools actList P)
    // ==========================================
    function captureScreenshot() {
        const v = activeVideo || document.querySelector('video');
        if (!v || v.videoWidth === 0 || v.videoHeight === 0) {
            showToast('NO VIDEO TO CAPTURE');
            return;
        }
        let canvas;
        try {
            canvas = document.createElement('canvas');
            canvas.width  = v.videoWidth;
            canvas.height = v.videoHeight;
            canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
        } catch (err) {
            console.warn('[4NDR0666OS] screenshot draw failed:', err);
            showToast('SCREENSHOT BLOCKED');
            return;
        }
        try {
            canvas.toBlob((blob) => {
                if (!blob) { showToast('SCREENSHOT FAILED'); return; }
                const dataURL = URL.createObjectURL(blob);
                const link    = document.createElement('a');
                link.addEventListener('click', (ev) => { ev.stopPropagation(); }, { once: true });
                link.href      = dataURL;
                link.download  = 'psi_shot_' + Date.now().toString(36) + '.png';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(dataURL), 4000);
                showToast('SCREENSHOT SAVED');
            }, 'image/png');
        } catch (err) {
            // Tainted canvas (cross-origin media without CORS) throws here.
            console.warn('[4NDR0666OS] screenshot export failed:', err);
            showToast('SCREENSHOT BLOCKED (CORS)');
        }
    }

    // ==========================================
    // INSTAGRAM STORY NAVIGATION
    // ==========================================
    //
    // BUG FIX (Bug 1, baseline lineage): Previous layer 1 ran querySelectorAll
    // on the entire document, matching IG's global page-level "Next" tray
    // buttons before the story tap zones. Layer 2 only searched div variants,
    // missing IG's <button> tap zones present in current desktop markup.
    //
    // Fixed three-layer strategy:
    //   Layer 1 — Scoped aria-label search within the story container
    //             ancestor, with multi-locale label patterns.
    //   Layer 2 — Scoped geometric search within the container; includes
    //             <button> elements, excludes the HUD itself.
    //   Layer 3 — ArrowLeft / ArrowRight keyboard events dispatched to the
    //             focused element or document.body.

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
                if (el.closest('#mpc-hud-ui')) return false; // Exclude own HUD
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
    // BUG FIX (Bug 2, baseline lineage): Instagram does NOT fire the 'ended'
    // event on story videos. Instead, IG either (a) swaps the video's src
    // attribute or (b) replaces the entire <video> element when transitioning
    // to the next story. The previous implementation's 'ended' listener was
    // therefore a dead code path on IG.
    //
    // Three-layer detection:
    //
    //   Layer A — MutationObserver on the story container: detects src
    //             attribute changes on the tracked video, and new <video> node
    //             insertions (IG's element-swap pattern). Fires executeRepeat()
    //             on detection.
    //
    //   Layer B — timeupdate near-end sentinel: arms a one-shot 350ms timer
    //             when currentTime >= duration - 0.4s. Catches IG's mid-play
    //             src-swap which happens before any end event. Timer is
    //             cancelled if the video rewinds or pauses before firing
    //             (false alarm guard).
    //
    //   Layer C — 'ended' event listener: belt-and-suspenders fallback for
    //             non-IG pages and any IG variant that does emit 'ended'.
    //             Shadow-rooted videos reach Layer C through the
    //             onMediaEndedEvent dispatcher (a superset over baseline).

    let repeatActive         = false;
    let repeatDebounceTimer  = null;
    let repeatNearEndArmed   = false;
    let repeatObserver       = null;
    let repeatTrackedVideo   = null;

    /** Core repeat action — debounced 150ms to suppress double-fires. */
    function executeRepeat() {
        if (state.isScrubbing) return; // User is mid-seek — never repeat-trigger off a manual drag
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

    /** Layer B: timeupdate near-end sentinel. */
    function onTimeUpdate(e) {
        if (!repeatActive)            return;
        if (e.target !== activeVideo) return;
        if (state.isScrubbing)        return; // Suppress arming while user is dragging the scrub bar
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

    // ==========================================
    // ACTIVE-MEDIA OBSERVER (always-on, direction-agnostic)
    // ==========================================
    //
    // BUG FIX (baseline lineage): Stories navigated BACKWARD frequently
    // restore a previously-buffered <video> in a paused state, or swap
    // directly to an <img> slide, without ever firing a native 'play' event.
    // The only acquisition paths that existed (native 'play' listener, hover)
    // both depend on either autoplay firing or the mouse physically moving —
    // neither is guaranteed on backward navigation, leaving activeVideo
    // pointed at a detached node and every position function
    // correctly-but-uselessly hiding the UI.
    //
    // This observer runs independently of the repeat-toggle (unlike Layer A
    // above) and fires on every container mutation, in both directions:
    //   - New <video> node appears  → acquireTarget() on it directly
    //     (autoPlay:false — never force playback the user didn't request)
    //   - New trackable <img> node appears → acquireImage() on it
    //   - Neither present, but the currently active element has been
    //     detached from the document → fall back to whatever video/img is
    //     now actually visible in the container.

    let mediaTrackedContainer = null;
    let mediaObserver         = null;

    function pickVisibleMedia(container) {
        const vids = Array.from(container.querySelectorAll('video'));
        const liveVideo = vids.find(v => v.getBoundingClientRect().width > 100);
        if (liveVideo) return { el: liveVideo, kind: 'video' };

        const imgs = Array.from(container.querySelectorAll('img')).filter(isTrackableImage);
        if (imgs.length > 0) return { el: imgs[0], kind: 'image' };

        return null;
    }

    function reacquireFromContainer(container) {
        const picked = pickVisibleMedia(container);
        if (!picked) return;
        if (picked.kind === 'video') {
            acquireTarget(picked.el, false);
        } else {
            acquireImage(picked.el);
        }
    }

    function startMediaObserver() {
        const seed = getActiveMedia() || document.querySelector('video, img');
        if (!seed) return;

        const container = (
            seed.closest('[role="dialog"]') ||
            seed.closest('section')         ||
            seed.closest('main')            ||
            document.body
        );
        if (!container) return;
        if (mediaObserver && mediaTrackedContainer === container) return; // already watching this container

        if (mediaObserver) mediaObserver.disconnect();
        mediaTrackedContainer = container;

        mediaObserver = new MutationObserver((mutations) => {
            const current = getActiveMedia();
            if (current && !document.body.contains(current)) {
                // Active element was detached (either direction of story nav) — re-pick immediately.
                reacquireFromContainer(container);
                return;
            }
            for (const m of mutations) {
                if (m.type !== 'childList') continue;
                for (const node of m.addedNodes) {
                    if (node.tagName === 'VIDEO' && node !== activeVideo) {
                        acquireTarget(node, false);
                        return;
                    }
                    if (isTrackableImage(node) && node !== activeImage) {
                        acquireImage(node);
                        return;
                    }
                    if (node.querySelector) {
                        const nestedVideo = node.querySelector('video');
                        if (nestedVideo && nestedVideo !== activeVideo) {
                            acquireTarget(nestedVideo, false);
                            return;
                        }
                        const nestedImg = Array.from(node.querySelectorAll ? node.querySelectorAll('img') : [])
                            .find(isTrackableImage);
                        if (nestedImg && nestedImg !== activeImage) {
                            acquireImage(nestedImg);
                            return;
                        }
                    }
                }
            }
        });

        mediaObserver.observe(container, { childList: true, subtree: true });
    }

    // Initial arm — covers page load landing directly on a story/post.
    setTimeout(startMediaObserver, 1200);

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
        showToast(repeatActive ? 'REPEAT ON' : 'REPEAT OFF');
    });

    // ==========================================
    // SEEK & FRAME STEP (salvaged from html5videoplayingtools actList)
    // ==========================================
    function seekBy(delta) {
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        try {
            v.currentTime = Math.max(0, v.currentTime + delta);
        } catch (_) {
            showToast('SEEK UNAVAILABLE');
        }
    }

    function stepFrame(direction) {
        const v = activeVideo || document.querySelector('video');
        if (!v) return;
        try {
            v.currentTime = Math.max(0, v.currentTime + direction * 0.03);
        } catch (_) {
            return;
        }
        v.pause();
    }

    // ==========================================
    // GLOBAL HOTKEYS
    // ==========================================
    // Baseline: Alt+M HUD toggle · Escape un-maximize · Space play/pause.
    // v7 superset (html5videoplayingtools actList): seek, volume, frame step,
    // rate adjust, screenshot, PiP, native fullscreen, story nav.
    //
    // Capture-phase registration with stopImmediatePropagation on handled
    // keys guarantees this controller wins over site handlers — the exact
    // technique html5videoplayingtools validated across dozens of video
    // sites. Typing contexts (inputs, textareas, contentEditable) are exempt,
    // and Space/Enter additionally defer to focused interactive controls.

    let hudVisible = true;

    document.addEventListener('keydown', (e) => {
        // Alt+M — HUD visibility toggle (baseline)
        if (e.altKey && !e.ctrlKey && !e.metaKey && e.key && e.key.toLowerCase() === 'm') {
            hudVisible             = !hudVisible;
            ui.style.opacity       = hudVisible ? '1' : '0';
            ui.style.pointerEvents = hudVisible ? 'auto' : 'none';
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }

        // Typing-context guards (baseline + html5videoplayingtools)
        const t   = e.target;
        const tag = t && t.tagName ? t.tagName : '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
        if (t && t.isContentEditable) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Escape — un-maximize (baseline)
        if (e.key === 'Escape') {
            if (state.isMaximized) {
                btnMax.click();
                e.preventDefault();
            }
            return;
        }

        // Space/Enter defer to focused interactive controls (native click)
        if ((e.code === 'Space' || e.key === 'Enter') &&
            t && (t.closest('button, a, summary, [role="button"]') ||
                  t.closest('#mpc-hud-ui, .psi-scrub-bar'))) {
            return;
        }

        // v8.1.0: same fallback acquisition as the PLAY button — a page whose
        // videos never fire 'play' previously left Space dead too.
        let v = activeVideo;
        if (activeTargetStale()) {
            const candidate = acquireBestCandidate();
            if (candidate) { acquireTarget(candidate, false); v = candidate; }
        }

        // v8.1.2 sovereignty gate (hotkey-census round): with no acquired
        // VIDEO target this controller must not touch the keyboard at all.
        // The switch previously preventDefaulted bare z/x/c/m/p/i/n/Enter
        // and the arrows on EVERY page — hijacking text pages and fighting
        // sibling scripts (Images++ KeyX collapse, Bunkr 'm' MPV dispatch,
        // GPD plain letters on image tabs). On video pages behavior is
        // unchanged 1:1; KeyN (IG story nav) stays reachable for its
        // Instagram-only surface below.
        if (!v && e.code !== 'KeyN') return;

        switch (e.code) {
            case 'Space':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                if (v.paused || v.ended) { v.play().catch(() => {}); state.isPlaying = true; }
                else                     { v.pause();                 state.isPlaying = false; }
                syncPlayButton();
                return;

            case 'ArrowLeft':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                seekBy(e.shiftKey ? -20 : -5);
                return;

            case 'ArrowRight':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                seekBy(e.shiftKey ? 20 : 5);
                return;

            case 'ArrowUp':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                adjustVolume(0.1);
                return;

            case 'ArrowDown':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                adjustVolume(-0.1);
                return;

            case 'KeyZ':
                e.preventDefault(); e.stopImmediatePropagation();
                toggleFastSpeed();
                return;

            case 'KeyX':
                e.preventDefault(); e.stopImmediatePropagation();
                adjustRate(-0.1);
                return;

            case 'KeyC':
                e.preventDefault(); e.stopImmediatePropagation();
                adjustRate(0.1);
                return;

            case 'KeyD':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                stepFrame(-1);
                return;

            case 'KeyF':
                if (!v) return;
                e.preventDefault(); e.stopImmediatePropagation();
                stepFrame(1);
                return;

            case 'KeyM':
                e.preventDefault(); e.stopImmediatePropagation();
                toggleMute();
                return;

            case 'KeyP':
                e.preventDefault(); e.stopImmediatePropagation();
                captureScreenshot();
                return;

            case 'KeyI':
                e.preventDefault(); e.stopImmediatePropagation();
                togglePiP();
                return;

            case 'Enter':
                e.preventDefault(); e.stopImmediatePropagation();
                toggleNativeFullscreen();
                return;

            case 'KeyN':
                // v8.1.2: bare-N story nav is an Instagram-surface feature; on
                // other hosts the Layer-1 aria search clicked unrelated
                // "next" buttons site-wide.
                if (!/(^|\.)instagram\.com$/.test(location.hostname)) return;
                e.preventDefault(); e.stopImmediatePropagation();
                igStoryNav(e.shiftKey ? 'prev' : 'next');
                return;
        }
    }, true);

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
        '%c[4NDR0666OS] Media Player Controller v8.1.2-Ψ — Unified Superset. ' +
        'Speed ±0.1 | rAF Zoom/Pan (0.5–8x) | Rotation | Smart Maximize (Video+Image) | ' +
        'Native Fullscreen | PiP | Play/DblClick/Space | Pause-on-Acquire | Fallback Target Acquisition | Virtual DOM | ' +
        'Shadow-DOM Discovery | Scrub Bar | Download (fetch + blob capture) | Screenshot | ' +
        'Volume/Mute | Frame Step | Seek | IG Nav (3-Layer) | IG Repeat (3-Layer) | ' +
        'Active-Media Observer | Ad Auto-Skip | Toast | Draggable HUD | Hotkey Reference.',
        'color:#00E5FF;font-weight:bold;'
    );
})();
