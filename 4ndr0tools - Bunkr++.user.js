// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.9.0
// @author       4ndr0666
// @description  Part of 4ndr0tools: Direct URL routing, auto-sort, hide visited, bypass dl gateway, bulk download
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr++.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// @include      /^[^:]*?:\/\/bunkr\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/[^/]*?\.bunkr\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/bunker\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/[^/]*?\.bunker\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/bunkrr\.[^/]*?\/.*?$/
// @include      /^[^:]*?:\/\/[^/]*?\.bunkrr\.[^/]*?\/.*?$/
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        unsafeWindow
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    console.log('%c[4NDR0tools] Bunkr++ v5.9.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // =========================================================================
    // MODULE 0.1: SYNCHRONOUS ENVIRONMENT MOCKING (Sandbox Escape)
    // =========================================================================
    try {
        unsafeWindow.aclib = {
            runAutoTag: function(){},
            runBanner:  function(){},
            runPop:     function(){},
            runVideo:   function(){}
        };
        unsafeWindow.kxysy    = function(){};
        unsafeWindow.ggihyqfb = function(){};

        const origFetch = unsafeWindow.fetch;
        unsafeWindow.fetch = async function (...args) {
            try {
                const reqUrl = typeof args[0] === 'string'
                    ? args[0]
                    : (args[0] && args[0].url ? args[0].url : '');
                if (
                    reqUrl.includes('/api/album/stats/') ||
                    reqUrl.includes('/api/file/stats/')  ||
                    reqUrl.includes('s.bunkr.ru')        ||
                    reqUrl.includes('/api/lv')
                ) {
                    return new Response(
                        JSON.stringify({ status: 'success', viewCount: 0, downloadCount: 0, live: 1 }),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    );
                }
            } catch (e) { /* EAFP */ }
            return origFetch.apply(this, args);
        };
        console.log('[Ψ-4NDR0666] Synchronous environment isolation deployed.');
    } catch (e) {
        console.warn('[Ψ-4NDR0666] unsafeWindow context inaccessible.', e);
    }

    if (!document.getElementById('lunchGallery')) {
        const dummy = document.createElement('div');
        dummy.id = 'lunchGallery';
        dummy.style.display = 'none';
        (document.body || document.documentElement).appendChild(dummy);
    }

    // =========================================================================
    // MODULE 0.2: ANTI-TAMPER & SCRIPT DEFUSION LAYER
    // =========================================================================
    const textKeywords = [
        'DisableDevtool', 'DevtoolsDetector', 'adblock',
        'devtool', 'contextmenu', '_ads', 'kxysy', 'ggihyqfb',
    ];
    const srcKeywords = [
        'disable-devtool', 'devtools-detector', 'detect2', 'on.js', 'bn.js',
    ];

    function defuseScript(script) {
        const text = script.innerHTML || '';
        const src  = script.src || '';
        if (
            textKeywords.some(w => text.includes(w)) ||
            srcKeywords.some(w  => src.includes(w))
        ) {
            script.type = 'javascript/blocked';
            script.remove();
            console.log('[Ψ-4NDR0666] Aborted anti-analysis script safely.');
            return true;
        }
        return false;
    }

    window.addEventListener('beforescriptexecute', (e) => {
        if (defuseScript(e.target)) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function () {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalAppendChild.apply(this, arguments);
    };

    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function () {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalInsertBefore.apply(this, arguments);
    };

    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT') defuseScript(node);
                if (node.querySelectorAll) node.querySelectorAll('script').forEach(defuseScript);
            }
        }
    }).observe(document.documentElement, { childList: true, subtree: true });

    // =========================================================================
    // INTERNAL STATE & CONSTANTS
    // =========================================================================
    let _visitedCache   = null;
    let _visitedDirty   = false;
    let _visitedMode    = 'DIM';
    let _sortExecuted   = false;
    let _debounceTimer  = null;

    // Gallery prefetch cache: numericId → direct CDN image_url (fast-path bypass)
    let albumGalleryCache   = new Map();
    let albumGalleryFetched = false;

    // Module-scope reference populated by initBulkEngine so M7 grid glyphs can call it
    let resolveBulkFile = null;

    const TARGET_DOMAIN = 'bunkr.cr';
    const VISITED_KEY   = 'psi_visited_assets';
    const MODE_KEY      = 'psi_visited_mode';
    const MODES         = ['DIM', 'HIDE', 'SHOW'];
    const MAX_VISITED   = 10_000;

    function ensureRelative(el) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    }

    // =========================================================================
    // MODULE 1: CANONICAL ROUTING & PARAMETRIC SORT
    // =========================================================================
    const u = new URL(window.location.href);
    let redirectNeeded = false;

    if (u.hostname !== TARGET_DOMAIN) {
        const isAssetEndpoint = /cdn|get|media/i.test(u.hostname);
        if (!isAssetEndpoint) {
            const pat = /(?:^|\.)(bunkr|bunker|bunkrr)\.[a-z0-9-]{2,}$/i;
            if (pat.test(u.hostname)) {
                u.hostname = TARGET_DOMAIN;
                redirectNeeded = true;
            }
        }
    }

    const albumMatch = u.pathname.match(/^\/a\/([^/]+)\/?$/);
    if (albumMatch) {
        if (u.searchParams.get('sort') !== 'size' || u.searchParams.get('order') !== 'desc') {
            u.searchParams.set('sort', 'size');
            u.searchParams.set('order', 'desc');
            redirectNeeded = true;
            console.log('[Ψ-4NDR0666] Enforcing parametric size descent via URL.');
        }
    }

    if (redirectNeeded) {
        window.location.replace(u.href);
        return;
    }

    // =========================================================================
    // MODULE 2: SYSTEM STYLING — ELECTRIC-GLASSMORPHISM
    // =========================================================================
    GM_addStyle(`
        :root {
            --bg-dark-base: #050A0F;
            --bg-glass-panel: rgba(10, 19, 26, 0.75);
            --accent-cyan: #00E5FF;
            --text-cyan-active: #67E8F9;
            --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
            --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
            --accent-cyan-bg-hover: rgba(0, 229, 255, 0.05);
            --accent-cyan-bg-active: rgba(0, 229, 255, 0.2);
            --glow-cyan-active: rgba(0, 229, 255, 0.4);
            --shadow-glass-base: -4px 8px 32px 0 rgba(0, 0, 0, 0.37);
            --shadow-glass-glow: 0 8px 32px 0 rgba(0, 229, 255, 0.15);
            --edge-light-top: rgba(255, 255, 255, 0.1);
            --edge-light-left: rgba(255, 255, 255, 0.1);
            --text-primary: #EAEAEA;
            --text-secondary: #9E9E9E;
            --font-body: 'Roboto Mono', monospace;
            --font-glyph: 'Cinzel Decorative', serif, sans-serif;
            --yellow: #FFD700;
            --red: #FF0055;
        }

        .psi-glass-panel {
            background: var(--bg-glass-panel);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--accent-cyan-border-idle);
            border-top: 1px solid var(--edge-light-top);
            border-left: 1px solid var(--edge-light-left);
            border-radius: 6px;
            box-shadow: var(--shadow-glass-base);
        }
        @supports not (backdrop-filter: blur(1px)) {
            .psi-glass-panel { background: rgba(10, 19, 26, 0.95) !important; }
        }

        .psi-btn {
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-size: 0.875rem;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            color: var(--text-primary);
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid transparent;
            border-radius: 4px;
            transition: all 300ms ease-in-out;
            cursor: pointer;
            font-family: var(--font-body);
        }
        .psi-btn:hover:not(:disabled) {
            color: var(--accent-cyan);
            border-color: var(--accent-cyan-border-hover);
            background-color: var(--accent-cyan-bg-hover);
        }
        .psi-btn:active:not(:disabled) {
            color: var(--text-cyan-active);
            background-color: var(--accent-cyan-bg-active);
            border-color: var(--accent-cyan);
            box-shadow: inset 0 0 10px var(--glow-cyan-active);
        }
        .psi-btn:focus-visible {
            outline: 2px solid var(--accent-cyan);
            outline-offset: 2px;
        }
        .psi-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            border-color: rgba(0, 229, 255, 0.3);
            color: var(--text-secondary);
        }

        .psi-dl-glyph, .psi-stream-glyph {
            position: absolute;
            bottom: 8px;
            width: 32px;
            height: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: var(--accent-cyan);
            text-decoration: none !important;
            padding: 0;
            border-radius: 6px;
        }
        .psi-dl-glyph    { right: 8px; }
        .psi-stream-glyph { right: 48px; }
        .psi-dl-glyph svg,
        .psi-stream-glyph svg {
            width: 18px;
            height: 18px;
            stroke-width: 2.5;
            pointer-events: none;
            fill: currentColor;
        }

        .psi-main-dl-glyph     { top: 42px !important; bottom: auto !important; right: 8px  !important; z-index: 99999 !important; }
        .psi-main-stream-glyph { top: 42px !important; bottom: auto !important; right: 48px !important; z-index: 99999 !important; }

        #psi-visited-toggle {
            position: fixed;
            bottom: 8px;
            left: 8px;
            z-index: 999999;
            padding: 6px 12px;
            font: 500 11px var(--font-body);
            color: var(--text-secondary);
            user-select: none;
        }
        #psi-visited-toggle:hover { color: var(--accent-cyan); }

        body[data-psi-visited-mode="DIM"]  .psi-visited { opacity: 0.3 !important; filter: grayscale(100%); transition: opacity 0.3s, filter 0.3s; }
        body[data-psi-visited-mode="DIM"]  .psi-visited:hover { opacity: 0.9 !important; filter: none; }
        body[data-psi-visited-mode="HIDE"] .psi-visited { display: none !important; }

        header, .bg-mute, .live-indicator-container, #liveCount, footer, [data-cl-spot],
        iframe[src*="ads"], iframe[src*="pop"], .banner, .ad-container, .ad-box,
        .adsbygoogle, .popup-ad, .ad-wrap { display: none !important; }

        .truncate.theName {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
        }

        @keyframes psi-slide-in {
            from { opacity: 0; transform: translateX(40px) scale(0.96); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes psi-fade-out {
            from { opacity: 1; transform: scale(1); }
            to   { opacity: 0; transform: translateX(20px) scale(0.94); }
        }
        @keyframes psi-fadeIn { to { opacity: 1; } }

        .psi-toast {
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 9999999;
            padding: 10px 16px;
            font: 500 11px/1.4 var(--font-body);
            color: var(--text-primary);
            pointer-events: none;
            max-width: 420px;
            animation: psi-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .psi-toast--dying { animation: psi-fade-out 0.38s ease forwards; }
        .psi-toast--glyph {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px 8px 10px;
            border-color: rgba(255, 215, 0, 0.55);
        }
        .psi-toast-icon  { flex-shrink: 0; width: 36px; height: 36px; color: var(--accent-cyan); filter: drop-shadow(0 0 4px var(--glow-cyan-active)); }
        .psi-toast-label { color: var(--text-primary); font: 500 11px/1.4 var(--font-body); letter-spacing: 0.05em; }

        /* Bulk Acquisition Panel */
        #psi-bulk-panel {
            position: fixed;
            bottom: 85px;
            right: 0;
            z-index: 2147483646;
            display: flex;
            border-radius: 6px 0 0 6px;
            overflow: hidden;
            background: var(--bg-glass-panel);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--accent-cyan-border-idle);
            border-right: none;
            border-top: 1px solid var(--edge-light-top);
            border-left: 1px solid var(--edge-light-left);
            box-shadow: var(--shadow-glass-base);
            transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms ease;
            transform: translateX(calc(100% - 32px));
        }
        #psi-bulk-panel:hover { transform: translateX(0); }

        #psi-bulk-peek {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 32px;
            flex-shrink: 0;
            background: rgba(0, 229, 255, 0.05);
            border-right: 1px solid var(--accent-cyan-border-idle);
            color: var(--accent-cyan);
            cursor: pointer;
        }
        #psi-bulk-peek svg {
            width: 20px;
            height: 20px;
            filter: drop-shadow(0 0 8px var(--glow-cyan-active));
            transition: filter 300ms ease, transform 300ms ease;
        }
        #psi-bulk-panel:hover #psi-bulk-peek svg {
            filter: drop-shadow(0 0 12px var(--accent-cyan));
        }

        #psi-bulk-content {
            width: 320px;
            max-height: 80vh;
            overflow-y: hidden;
            padding: 12px;
            color: var(--text-cyan-active);
            font: 11px var(--font-body);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        #psi-bulk-content h3 {
            margin: 0;
            font-size: 14px;
            text-transform: uppercase;
            color: var(--accent-cyan);
            text-shadow: 0 0 8px var(--glow-cyan-active);
            font-family: var(--font-body);
            font-weight: 500;
            letter-spacing: 0.05em;
        }
        #psi-bulk-content .controls { display: flex; gap: 6px; margin-top: 4px; }

        #psi-bulk-progress {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 3px;
            overflow: hidden;
            border: 1px solid rgba(0, 0, 0, 0.5);
        }
        #psi-bulk-bar {
            width: 0%;
            height: 100%;
            background: var(--accent-cyan);
            box-shadow: 0 0 8px var(--glow-cyan-active);
            transition: width 0.3s;
        }

        #psi-bulk-log {
            max-height: 180px;
            overflow-y: auto;
            background: transparent;
            padding: 4px 0 0 0;
            display: none;
            margin-top: 4px;
        }
        #psi-bulk-log span {
            display: block;
            margin-bottom: 4px;
            border-left: 2px solid var(--accent-cyan);
            padding-left: 8px;
            opacity: 0;
            animation: psi-fadeIn 0.3s forwards;
            color: var(--text-cyan-active);
            font-size: 11px;
            word-break: break-all;
        }
        .psi-log-inf { color: var(--text-cyan-active); }
        .psi-log-ok  { color: #4ade80 !important; border-left-color: #4ade80 !important; }
        .psi-log-err { color: var(--red)   !important; border-left-color: var(--red)   !important; }
        .psi-log-dbg { color: #6b7280 !important; border-left-color: #6b7280 !important; display: none; }
    `);

    // =========================================================================
    // MODULE 3: NETWORK SNIFFING — CDN URL CLASSIFICATION
    // =========================================================================
    // Passively intercepts outgoing fetch/XHR to capture CDN media URLs in
    // transit. Stored in _lastCdnMedia for use as a fast-path fallback when
    // video.currentSrc is not yet populated (race condition on page load).
    let _lastCdnMedia = null;

    const _origFetchM3 = window.fetch;
    window.fetch = async function (...args) {
        const reqUrl = typeof args[0] === 'string'
            ? args[0]
            : (args[0] && args[0].url ? args[0].url : '');
        if (reqUrl && isCdnUrl(reqUrl)) {
            _lastCdnMedia = reqUrl;
            console.log(`[Ψ-4NDR0666] M3: CDN URL captured: ${reqUrl.slice(0, 80)}`);
        }
        return _origFetchM3.apply(this, args);
    };

    const _origXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (typeof url === 'string' && isCdnUrl(url)) {
            _lastCdnMedia = url;
        }
        return _origXhrOpen.apply(this, [method, url, ...rest]);
    };

    // =========================================================================
    // MODULE 4: STATE-AWARE SORT HIJACK (Polled)
    // =========================================================================
    function forceLargestFirst() {
        if (!albumMatch) return;
        if (_sortExecuted) return;
        let attempts = 0;
        const sortInterval = setInterval(() => {
            attempts++;
            const sizeBtn =
                document.querySelector('.btnSize, button[title*="size"], a[href*="sort=size"]') ||
                Array.from(document.querySelectorAll('a, button')).find(
                    e => e.textContent.trim().toLowerCase() === 'size'
                );
            if (sizeBtn) {
                clearInterval(sortInterval);
                _sortExecuted = true;
                console.log('[Ψ-4NDR0666] Size sort node acquired. Initiating descent (click 1/2).');
                sizeBtn.click();
                setTimeout(() => {
                    console.log('[Ψ-4NDR0666] Secondary descent strike (click 2/2).');
                    if (sizeBtn.tagName === 'A' && sizeBtn.href) {
                        const descUrl = new URL(sizeBtn.href);
                        descUrl.searchParams.set('order', 'desc');
                        window.location.href = descUrl.href;
                    } else {
                        sizeBtn.click();
                    }
                }, 400);
            } else if (attempts > 15) {
                clearInterval(sortInterval);
                console.log('[Ψ-4NDR0666] Size sort node not found after 15 cycles. Aborting.');
            }
        }, 400);
        window.addEventListener('beforeunload', () => clearInterval(sortInterval), { once: true });
        activateAdvancedView();
    }

    function activateAdvancedView() {
        if (!albumMatch) return;
        let avAttempts = 0;
        const avInterval = setInterval(() => {
            avAttempts++;
            const hasPagination = document.querySelector(
                '.pagination, [aria-label="Pagination"], nav.pagination'
            );
            if (!hasPagination) { clearInterval(avInterval); return; }

            let advBtn = document.querySelector('body > main > div.album-toolbar > div > a');
            if (!advBtn) {
                advBtn = Array.from(
                    document.querySelectorAll('.album-toolbar a, [class*="toolbar"] a')
                ).find(a => /advanced|infinite|grid/i.test(a.textContent));
            }
            if (advBtn) {
                clearInterval(avInterval);
                console.log('[Ψ-4NDR0666] Advanced view anchor found. Activating infinite scroll.');
                advBtn.click();
            } else if (avAttempts > 20) {
                clearInterval(avInterval);
                console.log('[Ψ-4NDR0666] Advanced view anchor not found after 20 cycles. Aborting.');
            }
        }, 500);
        window.addEventListener('beforeunload', () => clearInterval(avInterval), { once: true });
    }

    // =========================================================================
    // MODULE 5: FORENSIC STATE TRACKER
    // =========================================================================
    function _loadVisitedFromStorage() {
        try {
            const raw = localStorage.getItem(VISITED_KEY);
            if (raw) return new Set(JSON.parse(raw));
        } catch { /* fall through */ }
        try {
            const raw = GM_getValue(VISITED_KEY, null);
            if (raw) return new Set(JSON.parse(raw));
        } catch { /* fall through */ }
        return new Set();
    }

    function getVisitedCache() {
        if (_visitedCache === null) _visitedCache = _loadVisitedFromStorage();
        return _visitedCache;
    }

    function addVisited(id) {
        if (!id) return;
        const cache = getVisitedCache();
        if (cache.has(id)) return;
        cache.add(id);
        _visitedDirty = true;
        if (cache.size > MAX_VISITED) {
            const [oldest] = cache;   // FIFO eviction
            cache.delete(oldest);
        }
    }

    window.addEventListener('beforeunload', () => {
        if (_visitedDirty && _visitedCache) {
            try { localStorage.setItem(VISITED_KEY, JSON.stringify([..._visitedCache])); } catch {}
            try { GM_setValue(VISITED_KEY, JSON.stringify([..._visitedCache])); } catch {}
        }
    });

    function initVisitedTracker() {
        const pathParts = window.location.pathname.split('/');
        if (['v', 'f', 'd'].includes(pathParts[1]) && pathParts[2]) {
            addVisited(pathParts[2]);
        }
        if (document.getElementById('psi-visited-toggle')) return;
        _visitedMode = localStorage.getItem(MODE_KEY) || 'DIM';
        document.body.setAttribute('data-psi-visited-mode', _visitedMode);

        const toggleBtn       = document.createElement('button');
        toggleBtn.id          = 'psi-visited-toggle';
        toggleBtn.className   = 'psi-glass-panel psi-btn';
        toggleBtn.setAttribute('aria-label', 'Toggle visited assets visibility');
        toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        toggleBtn.title       =
            'Left-Click: Cycle Mode (DIM/HIDE/SHOW)\n' +
            'Right-Click: Purge Registry\n' +
            'Buffer: 10,000 items max (FIFO)';
        toggleBtn.onclick = (e) => {
            e.preventDefault();
            const idx    = MODES.indexOf(_visitedMode);
            _visitedMode = MODES[(idx + 1) % MODES.length];
            localStorage.setItem(MODE_KEY, _visitedMode);
            document.body.setAttribute('data-psi-visited-mode', _visitedMode);
            toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        };
        toggleBtn.oncontextmenu = (e) => {
            e.preventDefault();
            if (window.confirm(
                '[Ψ-4NDR0666OS] PURGE WARNING:\nClear the local storage of all visited assets?'
            )) {
                localStorage.removeItem(VISITED_KEY);
                _visitedCache = new Set();
                _visitedDirty = false;
                location.reload();
            }
        };
        document.body.appendChild(toggleBtn);

        GM_registerMenuCommand('💾 Save History',  exportVisitedRegistry);
        GM_registerMenuCommand('☠ Purge History', () => {
            localStorage.removeItem(VISITED_KEY);
            try { GM_setValue(VISITED_KEY, null); } catch {}
            _visitedCache = new Set();
            _visitedDirty = false;
            location.reload();
        });
    }

    function exportVisitedRegistry() {
        const cache   = getVisitedCache();
        const fname   = 'bunkr_visited.json';
        const payload = JSON.stringify({
            version:  '1.0',
            exported: new Date().toISOString(),
            count:    cache.size,
            domain:   TARGET_DOMAIN,
            assets:   [...cache],
        }, null, 2);

        const blob = new Blob([payload], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = fname;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`💾 ${cache.size} assets exported → ${fname}`);
    }

    // =========================================================================
    // MODULE 6: ACQUISITION UTILITIES
    // =========================================================================
    const downloadSvg  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const streamSvg    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const spinnerHtml  = '<span style="font-size:8px;font-family:var(--font-body);">...</span>';
    const specPsiSvg   = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="psi-toast-icon" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif" class="glyph-core-psi">Ψ</text></svg>`;

    function isCdnUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return /(cdn\.cr|bunkr|bunkrr|scdn\.st|media-)/i.test(url) &&
               /\.(mp4|webm|mkv|mov|avi|zip|rar|7z|jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
    }

    function nativeDownload(url, hint) {
        const name = hint ||
            url.split('/').pop().split('?')[0].split('#')[0] ||
            'bunkr_download';
        console.log(`[Ψ-4NDR0666] Initiating native download: ${name}`);
        showToast(`⦒ █▓░ Download initiated: ${name}`, 3000, true);
        const a = document.createElement('a');
        a.href     = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
    }

    function robustCopy(text, overlay) {
        const isGlyph     = overlay && (
            overlay.classList.contains('psi-dl-glyph') ||
            overlay.classList.contains('psi-stream-glyph')
        );
        const origContent = isGlyph ? overlay.innerHTML    : '';
        const origColor   = isGlyph ? overlay.style.color  : '';
        const origBorder  = isGlyph ? overlay.style.borderColor : '';

        const onCopied = () => {
            if (!isGlyph) return;
            overlay.innerHTML = '<span style="font-size:14px;font-family:var(--font-body);font-weight:bold;">✓</span>';
            overlay.style.color       = 'var(--accent-cyan)';
            overlay.style.borderColor = 'var(--accent-cyan)';
            setTimeout(() => {
                overlay.innerHTML = origContent;
                overlay.style.color       = origColor;
                overlay.style.borderColor = origBorder;
            }, 1400);
        };
        const onFailed = () => {
            if (!isGlyph) return;
            overlay.innerHTML = '<span style="font-size:14px;font-family:var(--font-body);font-weight:bold;">X</span>';
            overlay.style.color       = 'var(--red)';
            overlay.style.borderColor = 'var(--red)';
            setTimeout(() => {
                overlay.innerHTML = origContent;
                overlay.style.color       = origColor;
                overlay.style.borderColor = origBorder;
            }, 2200);
        };

        try {
            if (typeof GM_setClipboard !== 'undefined') {
                GM_setClipboard(text, 'text');
                onCopied();
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                Object.assign(ta.style, { position: 'absolute', left: '-9999px' });
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                onCopied();
            }
        } catch (e) {
            onFailed();
        }
    }

    // =========================================================================
    // MODULE 6.4: DOM-DRIVEN CDN EXTRACTOR & GALLERY PREFETCH
    // =========================================================================
    /**
     * prefetchAlbumGallery — fetches the album gallery API and caches
     * numericId → image_url mappings. These cached CDN URLs are used as a
     * fast-path bypass in resolveBulkFile, skipping getNumericId +
     * callMainAPI when the cache already holds a direct CDN URL for the item.
     *
     * Cache key: String(item.id)   Value: item.image_url (CDN URL)
     */
    async function prefetchAlbumGallery() {
        if (albumGalleryFetched || !albumMatch) return;
        albumGalleryFetched = true;
        const albumSlug = albumMatch[1];
        try {
            console.log(`[Ψ-4NDR0666] Prefetching album gallery API for slug: ${albumSlug}`);
            const response = await fetch('/api/album/gallery', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ slug: albumSlug }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    data.data.forEach(item => {
                        if (item.id && item.image_url) {
                            albumGalleryCache.set(String(item.id), item.image_url);
                        }
                    });
                    console.log(
                        `[Ψ-4NDR0666] Gallery prefetch: cached ${albumGalleryCache.size} CDN entries.`
                    );
                }
            }
        } catch (e) {
            console.warn('[Ψ-4NDR0666] Album gallery prefetch failed.', e);
        }
    }

    /**
     * resolveDomStreamUrl — DOM-first single-asset CDN URL resolver.
     *
     * Used ONLY for single-asset view pages (/v/, /f/, /d/) where
     * video.currentSrc may not yet be populated. Falls back through:
     *   1. OG video meta tag
     *   2. <source src> / <video src>
     *   3. Direct CDN anchor in fetched HTML
     *   4. Gateway page #download-btn (second GM_xmlhttpRequest hop)
     *
     * For grid items, use resolveBulkFile() which uses the authenticated
     * dl.bunkr.cr API pipeline and is far more reliable.
     */
    async function resolveDomStreamUrl(targetUrl) {
        if (!targetUrl) return null;
        if (isCdnUrl(targetUrl)) return targetUrl;

        // Also check M3 passive intercept cache
        if (_lastCdnMedia && isCdnUrl(_lastCdnMedia)) {
            console.log('[Ψ-4NDR0666] M3 passive intercept fast-path hit.');
            return _lastCdnMedia;
        }

        let gatewayUrl    = null;
        const initialReferer = targetUrl;

        if (targetUrl.includes('get.bunk') || targetUrl.includes('/file/')) {
            gatewayUrl = targetUrl;
        } else {
            try {
                const res = await new Promise((resolve) => {
                    GM_xmlhttpRequest({
                        method:    'GET',
                        url:       targetUrl,
                        headers:   { 'Referer': targetUrl, 'Accept': 'text/html' },
                        timeout:   8000,
                        onload:    resolve,
                        onerror:   () => resolve({ status: 500 }),
                        ontimeout: () => resolve({ status: 408 }),
                    });
                });

                if (res.status >= 200 && res.status < 300) {
                    const doc = new DOMParser().parseFromString(res.responseText, 'text/html');

                    const ogVideo = doc.querySelector("meta[property='og:video']");
                    if (ogVideo?.content && isCdnUrl(ogVideo.content)) return ogVideo.content;

                    const videoSrc = doc.querySelector('source[src], video[src]');
                    if (videoSrc) {
                        const src = videoSrc.getAttribute('src') || videoSrc.src;
                        if (src && !src.startsWith('blob:') && isCdnUrl(src)) return src;
                    }

                    const cdnAnchor = doc.querySelector(
                        'a[href*="cdn.cr"][href$=".mp4"], a[href*="cdn.cr"][href$=".zip"]'
                    );
                    if (cdnAnchor && isCdnUrl(cdnAnchor.href)) return cdnAnchor.href;

                    const gw = doc.querySelector(
                        'a[href*="get.bunkr"], a.ic-download-01, a[href*="/file/"]'
                    );
                    if (gw) gatewayUrl = new URL(gw.getAttribute('href'), targetUrl).href;
                }
            } catch (e) {
                console.warn(`[Ψ-4NDR0666] Initial DOM fetch failed: ${e.message}`);
            }
        }

        if (!gatewayUrl) return null;

        console.log(`[Ψ-4NDR0666] Extracting from gateway: ${gatewayUrl}`);
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method:  'GET',
                url:     gatewayUrl,
                headers: {
                    'Referer': initialReferer,
                    'Accept':  'text/html,application/xhtml+xml',
                },
                timeout:   8000,
                onload:    (resp) => {
                    if (resp.status < 200 || resp.status >= 300) return resolve(null);
                    const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
                    const dlAnchor = doc.querySelector(
                        '#download-btn[href], a[href*="cdn"][href$=".mp4"], ' +
                        'a[href*="cdn"][href$=".zip"], a.ic-download-01[href]'
                    );
                    if (dlAnchor) {
                        const finalUrl = new URL(dlAnchor.getAttribute('href'), gatewayUrl).href;
                        console.log(`[Ψ-4NDR0666] Direct CDN resolved: ${finalUrl}`);
                        return resolve(finalUrl);
                    }
                    resolve(null);
                },
                onerror:   () => resolve(null),
                ontimeout: () => resolve(null),
            });
        });
    }

    // =========================================================================
    // MODULE 7: UNIFIED DIRECT ACQUISITION
    // =========================================================================
    function makeAccessible(glyph, label, activateFn) {
        glyph.setAttribute('role', 'button');
        glyph.setAttribute('tabindex', '0');
        glyph.setAttribute('aria-label', label);
        glyph.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFn(e); }
        };
    }

    const NATIVE_DL_SEL = [
        'a.ic-download-01',
        'a[href*="get.bunkr"]',
        'a[href*="/file/"]',
        'a[download][href]',
        'a.btn-main[href]',
        '#download-btn',
    ].join(', ');

    function injectCaptureVector() {
        const visited = getVisitedCache();

        const urlSlugMatch = window.location.pathname.match(/\/[vfd]\/([\w-]+)/);
        const pageSlug     = (typeof window.jsSlug !== 'undefined' && window.jsSlug)
            ? window.jsSlug
            : (urlSlugMatch ? urlSlugMatch[1] : null);

        // ── Context 1: Single-Asset View ─────────────────────────────────────
        const mediaContainer = document.querySelector(
            '.video-container, .lightgallery, img.w-full, video, #video-container'
        );
        if (mediaContainer) {
            const wrapper = mediaContainer.parentElement;
            ensureRelative(wrapper);

            if (!document.querySelector('.psi-main-dl-glyph')) {
                const dlGlyph     = document.createElement('a');
                dlGlyph.className = 'psi-dl-glyph psi-main-dl-glyph psi-glass-panel psi-btn';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download';
                const activateDl  = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dlGlyph.innerHTML = spinnerHtml;

                    // Tier A: video.currentSrc (fastest — player already running)
                    const vidEl = document.querySelector('video');
                    if (vidEl?.currentSrc && !vidEl.currentSrc.startsWith('blob:') && isCdnUrl(vidEl.currentSrc)) {
                        dlGlyph.innerHTML = downloadSvg;
                        nativeDownload(vidEl.currentSrc);
                        return;
                    }

                    // Tier B: 3-hop authenticated API pipeline (dl.bunkr.cr)
                    // Requires initBulkEngine to have run and populated resolveBulkFile
                    if (resolveBulkFile && pageSlug) {
                        try {
                            const item = {
                                filePageURL: window.location.href,
                                slug:        pageSlug,
                                name:        document.title || pageSlug,
                            };
                            const { cdnURL, fname } = await resolveBulkFile(item);
                            if (cdnURL) {
                                dlGlyph.innerHTML = downloadSvg;
                                nativeDownload(cdnURL, fname);
                                return;
                            }
                        } catch (e) {
                            console.warn(`[Ψ-4NDR0666] Single-asset API pipeline failed: ${e.message}`);
                        }
                    }

                    // Tier C: DOM gateway parse (last resort)
                    const gatewayAnchor = document.querySelector(NATIVE_DL_SEL);
                    const targetUrl     = (gatewayAnchor?.href && gatewayAnchor.href !== window.location.href)
                        ? gatewayAnchor.href
                        : window.location.href;

                    const cdnUrl = await resolveDomStreamUrl(targetUrl);
                    dlGlyph.innerHTML = downloadSvg;
                    if (cdnUrl) {
                        nativeDownload(cdnUrl);
                    } else {
                        showToast('Download failed. No resolvable CDN URL found.', 3000);
                        if (targetUrl !== window.location.href) window.open(targetUrl, '_blank');
                    }
                };
                dlGlyph.onclick = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
                wrapper.appendChild(dlGlyph);
            }

            if (!document.querySelector('.psi-main-stream-glyph')) {
                const streamGlyph     = document.createElement('a');
                streamGlyph.className = 'psi-stream-glyph psi-main-stream-glyph psi-glass-panel psi-btn';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';
                const activateStream  = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const savedHtml               = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';

                    // Tier A: video.currentSrc
                    const vidEl = document.querySelector('video');
                    let streamUrl = (vidEl?.currentSrc && !vidEl.currentSrc.startsWith('blob:') && isCdnUrl(vidEl.currentSrc))
                        ? vidEl.currentSrc
                        : null;

                    // Tier B: 3-hop API pipeline
                    if (!streamUrl && resolveBulkFile && pageSlug) {
                        try {
                            const item = {
                                filePageURL: window.location.href,
                                slug:        pageSlug,
                                name:        document.title || pageSlug,
                            };
                            const result = await resolveBulkFile(item);
                            if (result?.cdnURL) streamUrl = result.cdnURL;
                        } catch (e) {
                            console.warn(`[Ψ-4NDR0666] Single-asset stream API failed: ${e.message}`);
                        }
                    }

                    // Tier C: DOM gateway
                    if (!streamUrl) {
                        const gatewayAnchor = document.querySelector(NATIVE_DL_SEL);
                        const targetUrl     = (gatewayAnchor?.href && gatewayAnchor.href !== window.location.href)
                            ? gatewayAnchor.href
                            : window.location.href;
                        streamUrl = await resolveDomStreamUrl(targetUrl);
                    }

                    streamGlyph.innerHTML = savedHtml;
                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        if (streamUrl.includes('token=') && streamUrl.includes('ex=')) {
                            showToast('⦒ █▓░URL copied for IP streaming.', 6000, true);
                        }
                    } else {
                        streamGlyph.style.color       = 'var(--red)';
                        streamGlyph.style.borderColor = 'var(--red)';
                        setTimeout(() => {
                            streamGlyph.style.color       = '';
                            streamGlyph.style.borderColor = '';
                        }, 2500);
                    }
                };
                streamGlyph.onclick = activateStream;
                makeAccessible(streamGlyph, 'Copy stream URL', activateStream);
                wrapper.appendChild(streamGlyph);
            }
        }

        // ── Context 2: Grid View — Visited Tracking + Per-Item DL Glyphs ─────
        const items = document.querySelectorAll(
            '.grid > div, .grid-images_box, .theItem, main.grid > div, main[class*="grid"] > div'
        );
        const seenItems = new Set();
        [...items].filter(el => {
            if (seenItems.has(el)) return false;
            seenItems.add(el);
            return !!el.querySelector('a[href^="/f/"], a[href^="/v/"], a[href*="/d/"]');
        }).forEach(el => {
            const link = el.querySelector('a[href^="/f/"], a[href^="/v/"], a[href*="/d/"]');
            if (!link) return;
            const alphaId = link.getAttribute('href').split('/').pop();

            if (visited.has(alphaId)) el.classList.add('psi-visited');
            link.addEventListener('mousedown', () => {
                addVisited(alphaId);
                el.classList.add('psi-visited');
            }, { passive: true });

            // Per-item DL glyph — uses resolveBulkFile 3-hop pipeline when available
            if (!el.querySelector('.psi-dl-glyph') && resolveBulkFile) {
                const dlGlyph     = document.createElement('a');
                dlGlyph.className = 'psi-dl-glyph psi-glass-panel psi-btn';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download';
                ensureRelative(el);
                el.appendChild(dlGlyph);

                const activateDl = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    addVisited(alphaId);
                    el.classList.add('psi-visited');

                    // Use cached resolution if available
                    if (dlGlyph.dataset.resolvedUrl) {
                        nativeDownload(dlGlyph.dataset.resolvedUrl);
                        return;
                    }

                    dlGlyph.style.color       = 'var(--yellow)';
                    dlGlyph.style.borderColor = 'var(--yellow)';
                    dlGlyph.innerHTML         = spinnerHtml;

                    try {
                        // Name extraction mirrors scanFiles() logic
                        let name = link.getAttribute('title') || '';
                        if (!name) { const img = link.querySelector('img'); name = img ? (img.alt || '') : ''; }
                        if (!name) { const sp  = el.querySelector('p,span'); name = sp ? sp.textContent.trim() : ''; }

                        const item   = { filePageURL: link.href, slug: alphaId, name: name || alphaId };
                        const { cdnURL, fname } = await resolveBulkFile(item);
                        dlGlyph.dataset.resolvedUrl = cdnURL;
                        dlGlyph.innerHTML           = downloadSvg;
                        dlGlyph.style.color         = '';
                        dlGlyph.style.borderColor   = '';
                        nativeDownload(cdnURL, fname);
                    } catch (err) {
                        dlGlyph.innerHTML = downloadSvg;
                        dlGlyph.style.color       = 'var(--red)';
                        dlGlyph.style.borderColor = 'var(--red)';
                        console.warn(`[Ψ-4NDR0666] Grid DL failed for ${alphaId}: ${err.message}`);
                        setTimeout(() => {
                            dlGlyph.style.color       = '';
                            dlGlyph.style.borderColor = '';
                        }, 2500);
                    }
                };
                dlGlyph.onmousedown = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
            }
        });
    }

    // =========================================================================
    // MODULE 8: DIAGNOSTIC PROBE & TOAST
    // =========================================================================
    function showToast(msg, durationMs = 4000, isPsi = false) {
        const toast     = document.createElement('div');
        toast.className = isPsi
            ? 'psi-toast psi-toast--glyph psi-glass-panel'
            : 'psi-toast psi-glass-panel';
        if (isPsi) {
            toast.innerHTML = `${specPsiSvg}<span class="psi-toast-label">${msg}</span>`;
        } else {
            toast.textContent = msg;
        }
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('psi-toast--dying'), Math.max(0, durationMs - 400));
        setTimeout(() => toast.remove(), durationMs);
    }

    function executeDiagnosticProbe() {
        const report = {
            timestamp:       new Date().toISOString(),
            url:             window.location.href,
            topology:        albumMatch ? 'GRID_VIEW' : 'SINGLE_ASSET_VIEW',
            scripts:         Array.from(document.querySelectorAll('script[data-file-id]'))
                               .map(s => s.outerHTML),
            nativeDls:       Array.from(document.querySelectorAll(
                               'a[download], a.ic-download-01, a[href*="get.bunk"], a.btn-main, #download-btn'
                             )).map(a => ({
                               className: a.className,
                               href:      a.href,
                               text:      a.innerText.trim(),
                               id:        a.id,
                             })),
            gridItemsCount:  document.querySelectorAll('.grid > div, .grid-images_box, .theItem').length,
            apiCacheCount:   albumGalleryCache.size,
            lastCdnMedia:    _lastCdnMedia || 'none',
            bulkEngineReady: !!resolveBulkFile,
            envGlobals: {
                jsSlug:        typeof window.jsSlug        !== 'undefined' ? window.jsSlug        : 'undefined',
                jsCDN:         typeof window.jsCDN         !== 'undefined' ? window.jsCDN         : 'undefined',
                videoCoverUrl: typeof window.videoCoverUrl !== 'undefined' ? window.videoCoverUrl : 'undefined',
            },
        };
        const dump = JSON.stringify(report, null, 2);
        console.log('[Ψ-4NDR0666OS] Diagnostic Probe:\n', dump);
        robustCopy(dump, null);
        showToast('📡 Probe complete — data copied to clipboard.');
    }
    GM_registerMenuCommand('📡 Execute Diagnostic Probe', executeDiagnosticProbe);

    // =========================================================================
    // MODULE 9: AUTONOMOUS GATEWAY BYPASS
    // =========================================================================
    function autoEngageDownloadEndpoint() {
        const isGateway = /get\.bunkr/i.test(window.location.hostname) &&
                          window.location.pathname.includes('/file/');
        if (!isGateway) return;

        console.log('[Ψ-4NDR0666] Gateway page detected. Hunting #download-btn...');
        let attempts = 0;
        const MAX_ATTEMPTS   = 30;
        const engageInterval = setInterval(() => {
            attempts++;
            const dlBtn = document.getElementById('download-btn') ||
                          document.querySelector('a.ic-download-01');
            if (dlBtn?.href && dlBtn.href !== window.location.href && dlBtn.href !== '#') {
                clearInterval(engageInterval);
                console.log(`[Ψ-4NDR0666] Gateway: anchor found after ${attempts} attempt(s). Navigating.`);
                window.open(dlBtn.href, '_self');
            } else if (attempts >= MAX_ATTEMPTS) {
                clearInterval(engageInterval);
                console.warn(`[Ψ-4NDR0666] Gateway: anchor not ready after ${MAX_ATTEMPTS} attempts. Aborting.`);
            }
        }, 500);
        window.addEventListener('beforeunload', () => clearInterval(engageInterval), { once: true });
    }

    // =========================================================================
    // MODULE 11: BULK ACQUISITION ENGINE
    // =========================================================================
    function initBulkEngine() {
        if (!albumMatch) return;
        if (document.getElementById('psi-bulk-panel')) return;

        // ── Panel DOM ────────────────────────────────────────────────────────
        const panel = document.createElement('div');
        panel.id    = 'psi-bulk-panel';
        // specPsiSvg is defined at module scope — no re-declaration needed (GAP 1)
        panel.innerHTML = `
            <div id="psi-bulk-peek">${specPsiSvg}</div>
            <div id="psi-bulk-content">
                <h3>// DOWNLOAD ALL</h3>
                <div id="psi-bulk-status">Scanning files...</div>
                <div id="psi-bulk-info">0 OK / 0 ERR / 0 TOTAL</div>
                <div id="psi-bulk-progress"><div id="psi-bulk-bar"></div></div>
                <div class="controls">
                    <button id="btn-bulk-start"   class="psi-btn" aria-label="Start Bulk Download"  style="flex:1;" disabled>START</button>
                    <button id="btn-bulk-pause"   class="psi-btn" aria-label="Pause Bulk Download"  style="flex:1;" disabled>PAUSE</button>
                    <button id="btn-bulk-stop"    class="psi-btn" aria-label="Stop Bulk Download"   style="flex:1;" disabled>STOP</button>
                    <button id="btn-bulk-log-tog" class="psi-btn" aria-label="Toggle Log Display"   style="flex:0 0 auto;padding:.5rem .75rem;">LOG</button>
                </div>
                <div id="psi-bulk-log"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // ── Queue state ───────────────────────────────────────────────────────
        const BulkState = {
            queue:          [],
            running:        0,
            done:           0,
            failed:         0,
            total:          0,
            paused:         false,
            aborted:        false,
            DELAY_MS:       1200,
            MAX_CONCURRENT: 2,
            API_TIMEOUT:    20000,
        };

        const sleep = ms => new Promise(r => setTimeout(r, ms));

        // ── Logging helpers ───────────────────────────────────────────────────
        function logBulk(msg, level = 'inf') {
            const logEl = document.getElementById('psi-bulk-log');
            if (!logEl) return;
            const span     = document.createElement('span');
            span.className = `psi-log-${level}`;
            span.textContent = `[Ψ] ${msg}`;
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
            if (level !== 'dbg') console.log(`[Ψ-BULK] ${msg}`);
        }

        function setBulkStatus(msg) {
            const st = document.getElementById('psi-bulk-status');
            if (st) st.textContent = msg;
        }

        function updateBulkUI() {
            const bar  = document.getElementById('psi-bulk-bar');
            const info = document.getElementById('psi-bulk-info');
            if (!BulkState.total) return;
            const pct = ((BulkState.done + BulkState.failed) / BulkState.total) * 100;
            if (bar)  bar.style.width    = `${pct}%`;
            if (info) info.textContent   =
                `${BulkState.done} OK / ${BulkState.failed} ERR / ${BulkState.total} TOTAL`;
        }

        // ── scanFiles ─────────────────────────────────────────────────────────
        function scanFiles() {
            const seen  = new Set();
            const files = [];
            for (const a of document.querySelectorAll('a[href*="/f/"]')) {
                try {
                    const url = new URL(a.href);
                    if (!url.pathname.startsWith('/f/') || seen.has(url.pathname)) continue;
                    seen.add(url.pathname);
                    const slug = url.pathname.split('/').pop();
                    let name = a.getAttribute('title') || '';
                    if (!name) { const img = a.querySelector('img');  name = img ? (img.alt || '') : ''; }
                    if (!name) { const sp  = a.querySelector('p,span'); name = sp ? sp.textContent.trim() : ''; }
                    files.push({ filePageURL: a.href, slug, name: name || slug });
                } catch (_) { /* EAFP */ }
            }
            return files;
        }

        // ── GM_xmlhttpRequest wrapper ─────────────────────────────────────────
        function gmFetch(opts) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    timeout:   BulkState.API_TIMEOUT,
                    ...opts,
                    onload:    r  => resolve(r),
                    onerror:   () => reject(new Error('Network error: ' + opts.url)),
                    ontimeout: () => reject(new Error('Timeout: '       + opts.url)),
                });
            });
        }

        // ── findFileObj (deep __NEXT_DATA__ traversal) ────────────────────────
        function findFileObj(obj, depth = 0) {
            if (depth > 12 || !obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj)) {
                for (const v of obj) { const r = findFileObj(v, depth + 1); if (r) return r; }
                return null;
            }
            const hasNumId = obj.id && /^\d{5,12}$/.test(String(obj.id));
            const hasName  = obj.name || obj.filename || obj.original;
            if (hasNumId && hasName) {
                return { id: String(obj.id), name: obj.name || obj.filename || obj.original };
            }
            for (const v of Object.values(obj)) {
                const r = findFileObj(v, depth + 1);
                if (r) return r;
            }
            return null;
        }

        // ── getNumericId ──────────────────────────────────────────────────────
        async function getNumericId(item) {
            const res  = await gmFetch({
                method:  'GET',
                url:     item.filePageURL,
                headers: { 'User-Agent': navigator.userAgent, 'Referer': window.location.href },
            });
            const html = res.responseText;

            // 1. __NEXT_DATA__ JSON — most reliable
            const ndm = html.match(
                /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
            );
            if (ndm) {
                try {
                    const nd   = JSON.parse(ndm[1]);
                    const pp   = nd?.props?.pageProps || {};
                    const keys = ['file', 'media', 'item', 'data', 'video', 'image'];
                    for (const k of keys) {
                        if (pp[k]?.id) {
                            const numId = String(pp[k].id);
                            const fname = pp[k].name || pp[k].filename || pp[k].original || item.name;
                            logBulk(`  [ND] ${k}.id=${numId}`, 'dbg');
                            return { numId, fname };
                        }
                    }
                    if (pp.id) return { numId: String(pp.id), fname: pp.name || item.name };

                    const found = findFileObj(nd);
                    if (found) {
                        logBulk(`  [ND-deep] id=${found.id}`, 'dbg');
                        return { numId: String(found.id), fname: found.name || item.name };
                    }
                } catch (e) {
                    logBulk(`  ND err: ${e.message}`, 'dbg');
                }
            }

            // 2. dl.bunkr.cr/file/<id> href in raw HTML
            const dlm = html.match(/dl\.bunkr\.cr\/file\/(\d+)/i);
            if (dlm) return { numId: dlm[1], fname: item.name };

            // 3. Generic numeric id regex fallback
            const idMatches = [...html.matchAll(/"id"\s*:\s*(\d{5,12})/g)];
            if (idMatches.length) {
                const numId = idMatches[idMatches.length - 1][1];
                logBulk(`  [regex] id=${numId}`, 'dbg');
                return { numId, fname: item.name };
            }

            throw new Error('Numeric ID resolution failure.');
        }

        // ── callMainAPI ───────────────────────────────────────────────────────
        async function callMainAPI(numId) {
            logBulk(`  POST _001_v2 {id:"${numId}"}`, 'dbg');
            const res = await gmFetch({
                method: 'POST',
                url:    'https://dl.bunkr.cr/api/_001_v2',
                headers: {
                    'Content-Type': 'application/json',
                    'Origin':       'https://dl.bunkr.cr',
                    'Referer':      'https://dl.bunkr.cr/',
                    'User-Agent':   navigator.userAgent,
                },
                data: JSON.stringify({ id: numId }),
            });
            logBulk(`  API ${res.status}: ${res.responseText.slice(0, 120)}`, 'dbg');

            if (res.status < 200 || res.status >= 300)
                throw new Error(`API ${res.status}: ${res.responseText.slice(0, 80)}`);

            let json;
            try { json = JSON.parse(res.responseText); }
            catch (_) { throw new Error('JSON parse error: ' + res.responseText.slice(0, 80)); }

            if (!json?.mediafiles || !json?.path)
                throw new Error('API routing payload empty: ' + res.responseText.slice(0, 80));

            return {
                cdnBase:  json.mediafiles.replace(/\/$/, ''),
                filePath: json.path,
                original: json.original || '',
            };
        }

        // ── getSignedToken ────────────────────────────────────────────────────
        async function getSignedToken(filePath) {
            const signURL = `https://glb-apisign.cdn.cr/sign?path=${encodeURIComponent(filePath)}`;
            logBulk(`  SIGN ${signURL}`, 'dbg');
            const res = await gmFetch({
                method:  'GET',
                url:     signURL,
                headers: {
                    'Origin':     'https://dl.bunkr.cr',
                    'Referer':    'https://dl.bunkr.cr/',
                    'User-Agent': navigator.userAgent,
                },
            });
            logBulk(`  SIGN ${res.status}: ${res.responseText.slice(0, 120)}`, 'dbg');

            if (res.status < 200 || res.status >= 300)
                throw new Error(`Sign API ${res.status}: ${res.responseText.slice(0, 80)}`);

            let json;
            try { json = JSON.parse(res.responseText); }
            catch (_) { throw new Error('Sign JSON parse error: ' + res.responseText.slice(0, 80)); }

            if (!json?.token || !json?.ex)
                throw new Error('Sign response payload empty: ' + res.responseText.slice(0, 80));

            return { token: json.token, ex: json.ex };
        }

        // ── resolveBulkFile (module-scope export) ─────────────────────────────
        // GAP 2 fix: albumGalleryCache fast-path wired here.
        // GAP 6 fix: 3-retry exponential backoff on API failures.
        //
        // Resolution order:
        //   0. albumGalleryCache fast-path (pre-fetched CDN URL — skips hops 1+2)
        //   1. getNumericId (fetch /f/<slug> page, parse __NEXT_DATA__)
        //   2. callMainAPI  (POST dl.bunkr.cr/api/_001_v2 → CDN base + file path)
        //   3. getSignedToken (GET glb-apisign.cdn.cr/sign → token + ex)
        //   4. Assemble signed CDN URL
        resolveBulkFile = async function _resolveBulkFile(item, attempt = 0) {
            const MAX_RETRIES = 3;

            // Fast-path: gallery prefetch cache hit (numericId → image_url)
            // The cache key is the numeric id. We do not have it yet at this
            // point (we have the alpha slug), so we attempt a slug→id lookup
            // by checking if the fetched page HTML leaks the id early.
            // The full fast-path activates after the first resolution caches
            // the numeric id back into the item object.
            if (item._numId && albumGalleryCache.has(item._numId)) {
                const cachedUrl = albumGalleryCache.get(item._numId);
                if (isCdnUrl(cachedUrl)) {
                    logBulk(`  [cache] Fast-path hit for ${item._numId}`, 'dbg');
                    return { cdnURL: cachedUrl, fname: item.name };
                }
            }

            try {
                const { numId, fname }                = await getNumericId(item);
                // Store numId on item for future cache lookups
                item._numId = numId;

                // Re-check cache now that we have the numId
                if (albumGalleryCache.has(numId)) {
                    const cachedUrl = albumGalleryCache.get(numId);
                    if (isCdnUrl(cachedUrl)) {
                        logBulk(`  [cache] Post-ID cache hit for ${numId}`, 'dbg');
                        return { cdnURL: cachedUrl, fname };
                    }
                }

                const { cdnBase, filePath, original } = await callMainAPI(numId);
                const { token, ex }                   = await getSignedToken(filePath);
                const n      = original || fname || item.name;
                const cdnURL = `${cdnBase}${filePath}?n=${encodeURIComponent(n)}&token=${token}&ex=${ex}`;
                logBulk(`  CDN: ${cdnURL.slice(0, 80)}…`, 'dbg');
                return { cdnURL, fname: n };

            } catch (e) {
                // Exponential backoff retry for transient failures (429, network errors)
                if (attempt < MAX_RETRIES) {
                    const backoff = Math.pow(2, attempt) * 1000;
                    logBulk(
                        `  Retry ${attempt + 1}/${MAX_RETRIES} for ${item.name} in ${backoff}ms: ${e.message}`,
                        'dbg'
                    );
                    await sleep(backoff);
                    return _resolveBulkFile(item, attempt + 1);
                }
                throw e;
            }
        };

        // ── downloadBulkFile ──────────────────────────────────────────────────
        // GAP 5 fix: GM_download does not expose ontimeout — removed.
        // Timeout is handled at the gmFetch layer (API_TIMEOUT covers each hop).
        function downloadBulkFile(url, filename) {
            return new Promise((resolve, reject) => {
                GM_download({
                    url,
                    name:   (filename || 'bunkr_file').replace(/[\\/:*?"<>|]/g, '_').substring(0, 200),
                    saveAs: false,
                    headers: { 'Referer': 'https://dl.bunkr.cr/' },
                    onerror(e)  { reject(new Error(JSON.stringify(e))); },
                    onload()    { resolve(); },
                });
            });
        }

        // ── processBulkQueue ──────────────────────────────────────────────────
        async function processBulkQueue() {
            while (BulkState.queue.length > 0 && !BulkState.aborted) {
                if (BulkState.paused)                        { await sleep(400); continue; }
                if (BulkState.running >= BulkState.MAX_CONCURRENT) { await sleep(200); continue; }

                const item = BulkState.queue.shift();
                BulkState.running++;

                (async () => {
                    try {
                        setBulkStatus(`⟳ Res: ${item.name}`);
                        logBulk(`→ Res: ${item.name}`, 'inf');
                        const { cdnURL, fname } = await resolveBulkFile(item);

                        setBulkStatus(`⟳ DL: ${fname}`);
                        logBulk(`↓ DL: ${fname}`, 'inf');
                        await downloadBulkFile(cdnURL, fname);

                        BulkState.done++;
                        logBulk(`✓ OK: ${fname}`, 'ok');
                    } catch (e) {
                        BulkState.failed++;
                        logBulk(`✗ ERR: ${item.name} — ${e.message}`, 'err');
                    } finally {
                        BulkState.running--;
                        updateBulkUI();
                    }
                    if (BulkState.queue.length > 0) await sleep(BulkState.DELAY_MS);
                })();
            }

            // Wait for all concurrent downloads to settle
            await new Promise(r => {
                const iv = setInterval(() => {
                    if (!BulkState.running) { clearInterval(iv); r(); }
                }, 300);
            });

            if (!BulkState.aborted) {
                setBulkStatus(`✅ Complete: ${BulkState.done} OK / ${BulkState.failed} ERR`);
                const bar = document.getElementById('psi-bulk-bar');
                if (bar) {
                    bar.style.background = '#4ade80';
                    bar.style.boxShadow  = '0 0 10px #4ade80';
                }
            }
            document.getElementById('btn-bulk-start').disabled = false;
            document.getElementById('btn-bulk-pause').disabled = true;
            document.getElementById('btn-bulk-stop').disabled  = true;
        }

        // ── Button event wiring ───────────────────────────────────────────────
        document.getElementById('btn-bulk-log-tog').onclick = () => {
            const l = document.getElementById('psi-bulk-log');
            l.style.display = l.style.display === 'block' ? 'none' : 'block';
        };

        document.getElementById('btn-bulk-start').onclick = async () => {
            const files = scanFiles();
            if (!files.length) { setBulkStatus('⚠ No files found!'); return; }

            Object.assign(BulkState, {
                queue:   [...files],
                total:   files.length,
                done:    0,
                failed:  0,
                running: 0,
                paused:  false,
                aborted: false,
            });

            const log = document.getElementById('psi-bulk-log');
            const bar = document.getElementById('psi-bulk-bar');
            if (log) log.innerHTML     = '';
            if (log) log.style.display = 'block';
            if (bar) {
                bar.style.background = 'var(--accent-cyan)';
                bar.style.boxShadow  = '0 0 8px var(--glow-cyan-active)';
            }
            document.getElementById('btn-bulk-start').disabled = true;
            document.getElementById('btn-bulk-pause').disabled = false;
            document.getElementById('btn-bulk-stop').disabled  = false;

            updateBulkUI();
            setBulkStatus('Initiating Pipeline…');
            logBulk(`Registered ${files.length} payload(s) from DOM matrix.`, 'inf');
            processBulkQueue();
        };

        document.getElementById('btn-bulk-pause').onclick = () => {
            BulkState.paused = !BulkState.paused;
            document.getElementById('btn-bulk-pause').textContent =
                BulkState.paused ? 'RESUME' : 'PAUSE';
            setBulkStatus(BulkState.paused ? '⏸ Pipeline Suspended' : '▶ Resuming Pipeline…');
        };

        document.getElementById('btn-bulk-stop').onclick = () => {
            BulkState.aborted = true;
            BulkState.queue   = [];
            setBulkStatus('✕ Pipeline Cancelled');
            document.getElementById('btn-bulk-start').disabled = false;
            document.getElementById('btn-bulk-pause').disabled = true;
            document.getElementById('btn-bulk-stop').disabled  = true;
        };

        // Initial scan — polls until grid is populated
        const scanAndShow = () => {
            const files    = scanFiles();
            const status   = document.getElementById('psi-bulk-status');
            const startBtn = document.getElementById('btn-bulk-start');
            if (files.length) {
                if (status)   status.textContent = `${files.length} grid files acquired.`;
                if (startBtn) startBtn.disabled  = false;
            } else {
                if (status) status.textContent = 'Awaiting grid population…';
                setTimeout(scanAndShow, 1500);
            }
        };
        setTimeout(scanAndShow, 1000);
    }

    // =========================================================================
    // MODULE 10: DEFENSIVE ORCHESTRATION
    // =========================================================================
    function bootstrap() {
        if (!document.body) { setTimeout(bootstrap, 50); return; }
        console.log('[Ψ-4NDR0666] Intelligence baseline established. Injecting payloads.');

        // Prefetch album gallery for fast-path cache (albumGalleryCache)
        prefetchAlbumGallery();

        initVisitedTracker();
        forceLargestFirst();
        autoEngageDownloadEndpoint();

        // initBulkEngine must run BEFORE injectCaptureVector so that
        // resolveBulkFile is populated when grid glyphs are injected
        initBulkEngine();
        setTimeout(injectCaptureVector, 800);

        const observer = new MutationObserver((mutations) => {
            const structural = mutations.some(m => m.addedNodes.length > 0);
            if (!structural) return;
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => { injectCaptureVector(); }, 400);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });

        const onSpaNav = () => {
            observer.disconnect();
            _sortExecuted = false;
            setTimeout(() => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    initVisitedTracker();
                    forceLargestFirst();
                    if (!document.getElementById('psi-bulk-panel')) initBulkEngine();
                    injectCaptureVector();
                }
            }, 600);
        };
        window.addEventListener('popstate',   onSpaNav);
        window.addEventListener('hashchange', onSpaNav);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
