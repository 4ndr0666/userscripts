// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.6.0
// @author       4ndr0666
// @description  Part of 4ndr0tools: Canonical routing, auto-sort, hide visited, bypass dl gateway
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
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    console.log('%c[4NDR0tools] Bunkr++ v5.6.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // =========================================================================
    // INTERNAL STATE & CONSTANTS
    // =========================================================================
    let _visitedCache  = null;   // lazy-init in-memory Set — flushed on beforeunload
    let _visitedDirty  = false;  // true when cache diverges from localStorage
    let _visitedMode   = 'DIM';
    let _sortExecuted  = false;  // closure-scoped — reset on SPA navigation
    let _debounceTimer = null;   // closure-scoped

    const TARGET_DOMAIN = 'bunkr.cr';
    const VISITED_KEY   = 'psi_visited_assets';
    const MODE_KEY      = 'psi_visited_mode';
    const MODES         = ['DIM', 'HIDE', 'SHOW'];
    const MAX_VISITED   = 10_000;

    /**
     * Standard Referer/Origin headers required by Bunkr's API after mid-2025
     * server-side enforcement. Absent headers yield 403 on /api/vs variants.
     * Also used for the CDN signing endpoint (glb-apisign.cdn.cr/sign).
     */
    const API_HEADERS = {
        'Content-Type': 'application/json',
        'Referer':      `https://${TARGET_DOMAIN}/`,
        'Origin':       `https://${TARGET_DOMAIN}`,
    };

    // ─── XOR Decryption Engine ────────────────────────────────────────────────

    /**
     * deriveXorKeys — return all known key candidates for a given timestamp.
     *
     * Bunkr's player.enc.js has used two distinct key schemes across versions:
     *   v1 (pre-2026): key = 'SECRET_KEY_' + Math.floor(timestamp / 3600)
     *   v2 (2026+):    key = Math.floor(timestamp / 3600).toString()
     */
    function deriveXorKeys(timestamp) {
        const hourBucket = Math.floor(timestamp / 3600);
        return [
            `SECRET_KEY_${hourBucket}`,   // v1 — legacy
            String(hourBucket),            // v2 — current
        ];
    }

    /**
     * xorDecrypt — single attempt. Returns plaintext or null on bad base64.
     */
    function xorDecrypt(cipherB64, key) {
        try {
            const binaryString   = atob(cipherB64);
            const keyBytes       = new TextEncoder().encode(key);
            const decryptedBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                decryptedBytes[i] = binaryString.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
            }
            return new TextDecoder().decode(decryptedBytes);
        } catch {
            return null;
        }
    }

    /**
     * tryXorDecrypt — try all known key variants.
     * Returns the first result that starts with 'https://', or first non-null,
     * or null if all fail.
     */
    function tryXorDecrypt(cipherB64, timestamp) {
        let firstResult = null;
        for (const key of deriveXorKeys(timestamp)) {
            const result = xorDecrypt(cipherB64, key);
            if (!result) continue;
            if (!firstResult) firstResult = result;
            if (result.startsWith('https://')) return result;
        }
        return firstResult;
    }

    /**
     * unwrapApiPayload — normalise flat and nested /api/vs response shapes.
     *
     *   Flat (pre-2026):   { url, encrypted, timestamp }
     *   Nested (2026+):    { data: { url, encrypted, timestamp } }
     *   With status field: { status: 'ok', data: { ... } }
     */
    function unwrapApiPayload(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const payload = (raw.data && typeof raw.data === 'object') ? raw.data : raw;
        if (!payload.url) return null;
        return {
            url:       payload.url,
            encrypted: !!payload.encrypted,
            timestamp: Number(payload.timestamp || Math.floor(Date.now() / 1000)),
        };
    }

    // ─── DOM Utilities ────────────────────────────────────────────────────────

    /** Ensure element is a positioning ancestor for absolute children. */
    function ensureRelative(el) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    }

    /** Clamp a string for overlay display. */
    function truncUrl(url, max = 70) {
        return url.length > max ? url.substring(0, max - 3) + '...' : url;
    }

    // =========================================================================
    // MODULE 1: CANONICAL ROUTING & PARAMETRIC SORT
    // =========================================================================
    const u = new URL(window.location.href);
    let redirectNeeded = false;

    // Guard: only redirect foreign hostnames. Never self-redirect on TARGET_DOMAIN.
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

    // Enforce sort params only on /a/<id> album routes.
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
    // MODULE 2: SYSTEM STYLING & SURGICAL PURGE
    // =========================================================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --yellow: #FFD700; --red: #FF0055; }

        .psi-dl-glyph {
            position: absolute;
            bottom: 8px; right: 8px;
            width: 32px; height: 32px;
            background: rgba(10, 19, 26, 0.9);
            border: 1px solid var(--cyan);
            border-radius: 8px;
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; z-index: 9999;
            color: var(--cyan);
            transition: all 0.2s ease;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            text-decoration: none !important;
        }
        .psi-dl-glyph:hover { background: var(--cyan); color: #000; box-shadow: 0 0 15px var(--cyan); transform: scale(1.05); }
        .psi-dl-glyph:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
        .psi-dl-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; }

        .psi-stream-glyph {
            position: absolute;
            bottom: 8px; right: 48px;
            width: 32px; height: 32px;
            background: rgba(10, 19, 26, 0.9);
            border: 1px solid var(--cyan);
            border-radius: 8px;
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; z-index: 9999;
            color: var(--cyan);
            transition: all 0.2s ease;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            text-decoration: none !important;
        }
        .psi-stream-glyph:hover { background: var(--cyan); color: #000; box-shadow: 0 0 15px var(--cyan); transform: scale(1.05); }
        .psi-stream-glyph:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
        .psi-stream-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; fill: currentColor; }

        /*
         * Single-Asset View Overrides:
         * Shifts glyphs to top-right to avoid interference with native player controls.
         */
        .psi-main-dl-glyph {
            top: 42px !important; bottom: auto !important;
            right: 8px !important; z-index: 99999 !important;
        }
        .psi-main-stream-glyph {
            top: 42px !important; bottom: auto !important;
            right: 48px !important; z-index: 99999 !important;
        }

        .psi-url-overlay {
            position: absolute; top: 8px; right: 8px;
            background: rgba(10, 15, 26, 0.95);
            color: var(--cyan); padding: 5px 9px; font-size: 11px; font-family: monospace;
            border: 1px solid var(--cyan); border-radius: 3px; z-index: 999999; cursor: pointer;
            max-width: 360px; word-break: break-all;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
            transition: background 0.2s, color 0.2s;
        }
        .psi-url-overlay:hover { background: var(--cyan); color: #000; }

        #psi-visited-toggle {
            position: fixed; bottom: 8px; left: 8px; z-index: 999999;
            background: rgba(10, 15, 26, 0.95); color: var(--cyan);
            border: 1px solid var(--cyan); border-radius: 4px;
            padding: 6px 12px; font: bold 11px monospace; cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); user-select: none; transition: all 0.2s;
        }
        #psi-visited-toggle:hover { background: var(--cyan); color: #000; }

        body[data-psi-visited-mode="DIM"] .psi-visited {
            opacity: 0.3 !important;
            filter: grayscale(100%);
            transition: opacity 0.3s, filter 0.3s;
        }
        body[data-psi-visited-mode="DIM"] .psi-visited:hover { opacity: 0.9 !important; filter: none; }
        body[data-psi-visited-mode="HIDE"] .psi-visited { display: none !important; }

        /* Surgical Adversarial Purge */
        header, .bg-mute, .live-indicator-container, #liveCount, footer, [data-cl-spot],
        iframe[src*="ads"], iframe[src*="pop"], .banner, .ad-container, .ad-box,
        .adsbygoogle, .popup-ad, .ad-wrap { display: none !important; }

        /* Full filenames in album grid — disables Bunkr's truncation ellipsis */
        .truncate.theName {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: unset !important;
        }

        /* ── Toast Notification System — Electric-Glass Morphism ─────────── */
        @keyframes psi-slide-in {
            from { opacity: 0; transform: translateX(40px) scale(0.96); }
            to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
        @keyframes psi-fade-out {
            from { opacity: 1; transform: scale(1); }
            to   { opacity: 0; transform: translateX(20px) scale(0.94); }
        }
        /* Base toast — glass panel */
        .psi-toast {
            position: fixed; top: 16px; right: 16px; z-index: 9999999;
            /* Glass fill — layered for depth */
            background:
                linear-gradient(135deg,
                    rgba(0, 229, 255, 0.07) 0%,
                    rgba(10, 15, 26, 0.82) 40%,
                    rgba(0, 20, 30, 0.92) 100%);
            /* Crisp cyan border + inner highlight line */
            border: 1px solid rgba(0, 229, 255, 0.55);
            border-top-color: rgba(0, 229, 255, 0.9);
            border-radius: 10px;
            padding: 10px 16px;
            font: bold 11px/1.4 monospace;
            color: var(--cyan);
            /* Multi-layer glow: outer halo + tight inner rim */
            box-shadow:
                0 0 0 1px rgba(0, 229, 255, 0.08) inset,
                0 0 18px rgba(0, 229, 255, 0.22),
                0 4px 24px rgba(0, 0, 0, 0.55);
            /* Frosted glass blur */
            -webkit-backdrop-filter: blur(14px) saturate(160%);
            backdrop-filter: blur(14px) saturate(160%);
            pointer-events: none;
            max-width: 420px;
            animation: psi-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .psi-toast--dying { animation: psi-fade-out 0.38s ease forwards; }

        /* Ψ-glyph variant — cyan accent glass panel */
        .psi-toast--glyph {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px 8px 10px;
            background:
                linear-gradient(135deg,
                    rgba(255, 215, 0, 0.09) 0%,
                    rgba(10, 15, 26, 0.82) 40%,
                    rgba(15, 12, 0, 0.92) 100%);
            border-color: rgba(255, 215, 0, 0.55);
            border-top-color: rgba(255, 215, 0, 0.9);
            box-shadow:
                0 0 0 1px rgba(255, 215, 0, 0.08) inset,
                0 0 18px rgba(255, 215, 0, 0.2),
                0 4px 24px rgba(0, 0, 0, 0.55);
        }
        .psi-toast-icon {
            flex-shrink: 0;
            width: 36px; height: 36px;
            color: var(--cyan);
            /* Subtle icon glow */
            filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6));
        }
        .psi-toast-label {
            color: var(--cyan);
            font: bold 11px/1.4 monospace;
            letter-spacing: 0.05em;
            text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
        }
    `);

    // =========================================================================
    // MODULE 3: NETWORK SNIFFING (Multi-Tier EAFP Proxy)
    // =========================================================================
    const directMap = new Map();

    /**
     * isCdnUrl — expanded to capture all known Bunkr CDN subdomain formats.
     *   Legacy:  media-*.bunkr.*, cdn*.bunkr.*, scdn.st
     *   Current: *.bunkr.cr (any subdomain), i-cdn.bunkr.cr, media-files.bunkr.cr
     */
    function isCdnUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return /(media-|cdn|scdn\.st|i-cdn|media-files|[a-z0-9-]+\.bunkr\.[a-z]{2,})/i.test(url);
    }

    function classifyCdnUrl(url) {
        if (url.includes('.m3u8')) directMap.set('m3u8_stream', url);
        if (/\.(mp4|m3u8|webm|mov)/i.test(url)) {
            const fname = url.split('/').pop().split('?')[0];
            if (fname) directMap.set(fname, url);
            directMap.set('last_media', url);
        }
    }

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        // Intercept the native player's /api/vs (and variant paths) and
        // clone the decrypted payload into directMap for Tier 2 consumption.
        // Loose substring match — covers /api/vs, /api/vs2, /api/vs/, /api/vs?*
        if (reqUrl.includes('/api/vs')) {
            try {
                const res    = await origFetch.apply(this, args);
                const cloned = res.clone();
                cloned.json().then(raw => {
                    const data = unwrapApiPayload(raw);
                    if (!data) return;
                    if (data.encrypted) {
                        const decrypted = tryXorDecrypt(data.url, data.timestamp);
                        if (decrypted) {
                            directMap.set('native_api_resolved', decrypted);
                            console.log('[Ψ-4NDR0666] Sniffer: /api/vs decrypted and cached.');
                        }
                    } else {
                        directMap.set('native_api_resolved', data.url);
                        console.log('[Ψ-4NDR0666] Sniffer: /api/vs plain URL cached.');
                    }
                }).catch(() => {});
                return res;
            } catch (e) {
                return origFetch.apply(this, args);
            }
        }

        const res = await origFetch.apply(this, args);
        try {
            if (isCdnUrl(reqUrl)) classifyCdnUrl(reqUrl);
        } catch { /* EAFP */ }
        return res;
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        try {
            if (typeof url === 'string' && isCdnUrl(url)) classifyCdnUrl(url);
        } catch { /* EAFP */ }
        return origXhrOpen.apply(this, [method, url, ...rest]);
    };

    // =========================================================================
    // MODULE 4: STATE-AWARE SORT HIJACK (Polled)
    // =========================================================================
    // Source analysis of album-sorting.js confirms:
    //   - Button class: .btnSize  (first click → 'asc', second click → 'desc')
    //   - Therefore: ALWAYS issue two clicks separated by 400ms to guarantee desc.
    //   - URL-param redirect (Module 1) is the primary mechanism; this is a fallback
    //     for SPA navigations that do not trigger a hard reload.
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

        // ── Advanced View Auto-Activation ─────────────────────────────────────
        // Switches the album from pagination to infinite-scroll (advanced) view
        // automatically, removing the need for any manual user action.
        // Guard: only fires when pagination is active (i.e. page links present).
        // Resilient selector: positional first, text-content fallback second.
        activateAdvancedView();
    }

    function activateAdvancedView() {
        if (!albumMatch) return;
        let avAttempts = 0;
        const avInterval = setInterval(() => {
            avAttempts++;
            // Already in advanced view if pagination is absent
            const hasPagination = document.querySelector('.pagination, [aria-label="Pagination"], nav.pagination');
            if (!hasPagination) { clearInterval(avInterval); return; }

            // Primary selector (positional — matches the toolbar anchor)
            let advBtn = document.querySelector('body > main > div.album-toolbar > div > a');
            // Text-content fallback
            if (!advBtn) {
                advBtn = Array.from(document.querySelectorAll('.album-toolbar a, [class*="toolbar"] a')).find(
                    a => /advanced|infinite|grid/i.test(a.textContent)
                );
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
        // Primary: localStorage (fast, same-origin)
        try {
            const raw = localStorage.getItem(VISITED_KEY);
            if (raw) return new Set(JSON.parse(raw));
        } catch { /* fall through */ }
        // Fallback: GM_setValue mirror (survives localStorage clears)
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

    // addVisited mutates only the in-memory Set.
    // localStorage is written exclusively in the beforeunload flush.
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
            try { localStorage.setItem(VISITED_KEY, JSON.stringify([..._visitedCache])); }
            catch { /* silent */ }
            // Mirror to GM storage — survives localStorage clears and private-browsing wipes
            try { GM_setValue(VISITED_KEY, JSON.stringify([..._visitedCache])); }
            catch { /* silent */ }
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
        const toggleBtn       = document.createElement('div');
        toggleBtn.id          = 'psi-visited-toggle';
        toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        toggleBtn.title       = 'Left-Click: Cycle Mode (DIM/HIDE/SHOW)\nRight-Click: Purge Registry\nBuffer: 10,000 items max (FIFO)';
        toggleBtn.onclick     = (e) => {
            e.preventDefault();
            const idx    = MODES.indexOf(_visitedMode);
            _visitedMode = MODES[(idx + 1) % MODES.length];
            localStorage.setItem(MODE_KEY, _visitedMode);
            document.body.setAttribute('data-psi-visited-mode', _visitedMode);
            toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        };
        toggleBtn.oncontextmenu = (e) => {
            e.preventDefault();
            if (window.confirm('[Ψ-4NDR0666OS] PURGE WARNING:\nClear the local storage of all visited assets?')) {
                localStorage.removeItem(VISITED_KEY);
                _visitedCache = new Set();
                _visitedDirty = false;
                location.reload();
            }
        };
        document.body.appendChild(toggleBtn);

        GM_registerMenuCommand('💾 Save History', exportVisitedRegistry);
        GM_registerMenuCommand('☠ Purge History', () => {
            localStorage.removeItem(VISITED_KEY);
            try { GM_setValue(VISITED_KEY, null); } catch { /* silent */ }
            _visitedCache = new Set();
            _visitedDirty = false;
            location.reload();
        });
    }

    /**
     * exportVisitedRegistry — on-demand JSON file export via GM menu command.
     *
     * Persistence is localStorage (automatic, silent, always-on via beforeunload).
     * This function is the opt-in file export for users who want a portable copy.
     * Triggered only by the GM menu — never called automatically.
     */
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

        GM_download({
            url,
            name: fname,
            onload: () => {
                URL.revokeObjectURL(url);
                showToast(`💾 ${cache.size} assets exported → ${fname}`);
                console.log(`[Ψ-4NDR0666] Visited registry exported: ${fname} (${cache.size} items)`);
            },
            onerror: (err) => {
                URL.revokeObjectURL(url);
                console.error('[Ψ-4NDR0666] exportVisitedRegistry failed:', err);
                showToast('☠ Export failed — see F12 console.');
            },
        });
    }

    // =========================================================================
    // MODULE 6: ACQUISITION UTILITIES & GHOST FETCH
    // =========================================================================
    const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const streamSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const spinnerHtml = '<span style="font-size:8px;font-family:monospace;">...</span>';

    /**
     * gmDownload — force a file save.
     *
     * Routing logic:
     *   Signed CDN URLs (token= + ex=) are IP-bound to the browser session.
     *   GM_download runs outside the browser's cookie/session context and will
     *   receive a 404 from the CDN's token validator. For these URLs we use a
     *   native hidden-anchor click which shares the page's session identity.
     *
     *   Unsigned CDN URLs use GM_download directly, which bypasses
     *   Content-Disposition and forces a browser save regardless of MIME type.
     *
     * @param {string} url    — fully resolved CDN URL
     * @param {string} [hint] — optional filename override
     */
    function gmDownload(url, hint) {
        const name = hint
            || url.split('/').pop().split('?')[0].split('#')[0]
            || 'bunkr_download';

        const isSigned = url.includes('token=') && url.includes('ex=');
        if (isSigned) {
            // Native anchor download — preserves browser session for IP-bound tokens
            console.log(`[Ψ-4NDR0666] Native anchor download (signed URL): ${name}`);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = name;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 1000);
            return;
        }

        console.log(`[Ψ-4NDR0666] GM_download: ${name} <- ${url}`);
        GM_download({
            url,
            name,
            onerror: (err) => {
                console.warn(`[Ψ-4NDR0666] GM_download failed (${JSON.stringify(err)}). Falling back to window.open.`);
                window.open(url, '_blank');
            },
        });
    }

    function legacyCopy(text, onDone) {
        const ta = Object.assign(document.createElement('textarea'), {
            value: text,
            style: 'position:fixed;opacity:0',
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        onDone?.();
    }

    function robustCopy(text, overlay) {
        const isGlyph     = overlay.classList.contains('psi-dl-glyph') || overlay.classList.contains('psi-stream-glyph');
        const origContent = isGlyph ? overlay.innerHTML : overlay.textContent;
        const origColor   = overlay.style.color;
        const origBorder  = overlay.style.borderColor;
        const onCopied    = () => {
            if (isGlyph) overlay.innerHTML = '<span style="font-size:14px;font-family:monospace;font-weight:bold;">✓</span>';
            else overlay.textContent = 'COPIED ✓';
            overlay.style.color       = 'var(--cyan)';
            overlay.style.borderColor = 'var(--cyan)';
            setTimeout(() => {
                if (isGlyph) overlay.innerHTML = origContent;
                else overlay.textContent       = origContent;
                overlay.style.color       = origColor;
                overlay.style.borderColor = origBorder;
            }, 1400);
        };
        const onFailed = () => {
            if (isGlyph) overlay.innerHTML = '<span style="font-size:14px;font-family:monospace;font-weight:bold;">X</span>';
            else overlay.textContent = 'CLIPBOARD BLOCKED';
            overlay.style.color       = 'var(--red)';
            overlay.style.borderColor = 'var(--red)';
            setTimeout(() => {
                if (isGlyph) overlay.innerHTML = origContent;
                else overlay.textContent       = origContent;
                overlay.style.color       = origColor;
                overlay.style.borderColor = origBorder;
            }, 2200);
        };
        const fallback = () => { try { legacyCopy(text, onCopied); } catch { onFailed(); } };
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(fallback);
        } else {
            fallback();
        }
    }

    function createFileOverlay(url, element, idToMark) {
        if (element.querySelector('.psi-url-overlay')) return;
        const overlay       = document.createElement('div');
        overlay.className   = 'psi-url-overlay';
        overlay.textContent = truncUrl(url);
        let autoRemoveTimer = setTimeout(() => overlay.remove(), 25_000);
        overlay.addEventListener('mouseenter', () => clearTimeout(autoRemoveTimer));
        overlay.addEventListener('mouseleave', () => {
            autoRemoveTimer = setTimeout(() => overlay.remove(), 5_000);
        });
        overlay.onclick = (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            robustCopy(url, overlay);
            if (idToMark) {
                addVisited(idToMark);
                element.classList.add('psi-visited');
            }
        };
        ensureRelative(element);
        element.appendChild(overlay);
    }

    /**
     * ghostFetch — resolve a grid item's true CDN download URL.
     *
     * Waterfall:
     *   1. directMap filename cache (network proxy hit)
     *   2. Fetch the view page and parse with DOMParser (expanded selectors)
     *   3. directMap 'last_media' fallback
     *   4. /api/vs inline fallback for fully client-rendered pages
     *
     * Expanded DOM selectors cover legacy + current Bunkr markup variants:
     *   og:video meta tag, <source src>, <video src>, direct CDN anchors.
     */
    async function ghostFetch(href, fname) {
        // Fast path: live CDN map hit
        if (fname && directMap.has(fname)) {
            console.log(`[Ψ-4NDR0666] directMap cache hit for: ${fname}`);
            return directMap.get(fname);
        }

        const controller = new AbortController();
        const timer      = setTimeout(() => controller.abort(), 12_000);
        try {
            const res = await origFetch(href, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();
            const doc  = new DOMParser().parseFromString(html, 'text/html');

            // Expanded anchor selector
            const dlAnchor = doc.querySelector([
                'a[href*="get.bunkr"]',
                'a.ic-download-01',
                'a[href*="/file/"]',
                'a[href*="cdn"][href$=".mp4"]',
                'a[href*="cdn"][href$=".zip"]',
                'a[download][href]',
            ].join(', '));
            if (dlAnchor?.href) return dlAnchor.href;

            // Video source elements
            const videoSrc = doc.querySelector('source[src], video[src]');
            if (videoSrc) {
                const src = videoSrc.getAttribute('src') || videoSrc.src;
                if (src && !src.startsWith('blob:')) return src;
            }

            // OG video meta tag
            const ogVideo = doc.querySelector('meta[property="og:video"]');
            if (ogVideo?.content) return ogVideo.content;

            // last_media fallback
            if (directMap.has('last_media')) {
                console.log('[Ψ-4NDR0666] ghostFetch: falling back to last_media from directMap.');
                return directMap.get('last_media');
            }

            // Inline /api/vs fallback for fully client-rendered pages
            const slugMatch = href.match(/\/[vfd]\/([\w-]+)/);
            if (slugMatch) {
                console.log('[Ψ-4NDR0666] ghostFetch: engaging /api/vs inline fallback.');
                const streamUrl = await getBunkrStreamUrl(slugMatch[1], null);
                if (streamUrl) return streamUrl;
            }

            throw new Error('No resolvable URL found via ghostFetch waterfall.');
        } finally {
            clearTimeout(timer);
        }
    }

    // =========================================================================
    // MODULE 6.5: HARDENED STREAM URL RESOLVER
    // =========================================================================
    /**
     * gmApiRequest — GM_xmlhttpRequest wrapper returning a Promise<object>.
     *
     * GM_xmlhttpRequest bypasses the browser Fetch spec's forbidden-header
     * list, allowing Referer and Origin to be transmitted — required by
     * Bunkr's /api/vs and the CDN signing endpoint (glb-apisign.cdn.cr/sign).
     */
    function gmApiRequest(url, method, body, extraHeaders, timeoutMs = 10_000) {
        const headers = Object.assign({}, API_HEADERS, extraHeaders || {});
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers,
                data:      body ? JSON.stringify(body) : undefined,
                timeout:   timeoutMs,
                onload:    (resp) => {
                    if (resp.status < 200 || resp.status >= 300) {
                        reject(new Error(`HTTP ${resp.status}`));
                        return;
                    }
                    try { resolve(JSON.parse(resp.responseText)); }
                    catch (e) { reject(new Error(`JSON parse failed: ${e.message}`)); }
                },
                onerror:   (e) => reject(new Error(`GM XHR network error: ${JSON.stringify(e)}`)),
                ontimeout: ()  => reject(new Error('GM XHR timed out')),
            });
        });
    }

    /**
     * getBunkrStreamUrl — Resolves the canonical streaming URL.
     *
     * ============================================================
     * 8-Tier Waterfall Extraction Engine (v5.4.0)
     * ============================================================
     *
     *   Tier 0 — Poll directMap for native_api_resolved (up to 2 s)
     *            On single-asset pages the native player fires its own
     *            /api/vs call ~300-800 ms after DOMContentLoaded. M3's
     *            fetch proxy intercepts and decrypts it into directMap.
     *            If the stream glyph is clicked before that completes,
     *            this tier waits rather than hammering the API tiers.
     *
     *   Tier 1 — Intercepted M3U8 playlist (XHR/fetch proxy hit)
     *   Tier 2 — Native-player API clone already in directMap
     *   Tier 3 — Live DOM video src extraction
     *   Tier 4 — window.jsCDN environment global (server-injected)
     *
     *   Tier 5 — POST /api/vs  with {slug}        + dual-key XOR
     *   Tier 6 — POST /api/vs  with {token: slug}  + dual-key XOR
     *   Tier 7 — GET  /api/vs?slug=<slug>          + dual-key XOR
     *
     *   Tier 8 — CDN signing endpoint (glb-apisign.cdn.cr/sign)
     *            mediaUuid extracted from: OG image meta, window.videoCoverUrl,
     *            or contextElement thumbnails.
     *            IMPORTANT: The signed URL is IP-bound to the requesting browser
     *            session (MD5(IP + UUID + salt + ex) = token). It must be opened
     *            in the SAME browser that requested it. Passing it to an external
     *            tool on a different network stack will produce a 404.
     *
     * @param {string}      slug           — Alphanumeric asset slug.
     * @param {Element|null} contextElement — Grid item element (for Tier 8 UUID extraction).
     * @returns {Promise<string|null>}
     */
    async function getBunkrStreamUrl(slug, contextElement = null) {
        // ── Tier 0: Poll for native player intercept (up to 5 s) ─────────────
        // The native player fires /api/vs after the JS bundle lazy-loads.
        // On fast connections this is ~300-800 ms; on slow connections or with
        // ad-blocker overhead it can reach 2-4 s. 25 × 200 ms = 5 s budget.
        if (!directMap.has('native_api_resolved') && !directMap.has('m3u8_stream')) {
            console.log('[Ψ-4NDR0666] Tier 0: Polling for native player intercept (max 5 s)...');
            await new Promise(resolve => {
                let ticks = 0;
                const poll = setInterval(() => {
                    if (directMap.has('native_api_resolved') || directMap.has('m3u8_stream') || ++ticks >= 25) {
                        clearInterval(poll);
                        resolve();
                    }
                }, 200);
            });
        }

        // ── Tier 1: Intercepted M3U8 ─────────────────────────────────────────
        if (directMap.has('m3u8_stream')) {
            console.log('[Ψ-4NDR0666] Tier 1: M3U8 XHR match.');
            return directMap.get('m3u8_stream');
        }

        // ── Tier 2: Native player API clone ──────────────────────────────────
        if (directMap.has('native_api_resolved')) {
            console.log('[Ψ-4NDR0666] Tier 2: Native API decryption layer hit.');
            return directMap.get('native_api_resolved');
        }

        // ── Tier 3: Live DOM video src / currentSrc ───────────────────────────
        // LinkMasterΨ battle-tested pattern: read what the player actually loaded.
        // video.currentSrc is the resolved URL after any redirect or blob swap —
        // it returns the true CDN URL even when video.src is a blob: or empty.
        // Query order: currentSrc on <video> first, then <source src>, then .src.
        const vidEl = document.querySelector('video');
        if (vidEl) {
            const cSrc = vidEl.currentSrc;
            if (cSrc && !cSrc.startsWith('blob:') && cSrc.startsWith('http')) {
                console.log('[Ψ-4NDR0666] Tier 3a: video.currentSrc hit.');
                return cSrc;
            }
            const srcEl = vidEl.querySelector('source[src]');
            if (srcEl?.src && !srcEl.src.startsWith('blob:')) {
                console.log('[Ψ-4NDR0666] Tier 3b: <source src> hit.');
                return srcEl.src;
            }
            if (vidEl.src && !vidEl.src.startsWith('blob:')) {
                console.log('[Ψ-4NDR0666] Tier 3c: video.src hit.');
                return vidEl.src;
            }
        }

        // ── Tier 4: Environment global (window.jsCDN) ────────────────────────
        if (typeof window.jsCDN !== 'undefined' && window.jsCDN && !window.jsCDN.startsWith('blob:')) {
            console.log('[Ψ-4NDR0666] Tier 4: Environment memory abstraction hit (jsCDN).');
            return window.jsCDN;
        }

        // ── Tiers 5-7: Autonomous /api/vs waterfall (GM_xmlhttpRequest) ──────
        const resolveViaApi = (raw) => {
            const data = unwrapApiPayload(raw);
            if (!data) return null;
            if (data.encrypted) return tryXorDecrypt(data.url, data.timestamp);
            return data.url || null;
        };

        // Tier 5: POST /api/vs {slug}
        console.log('[Ψ-4NDR0666] Tier 5: POST /api/vs {slug}.');
        try {
            const raw    = await gmApiRequest(`https://${TARGET_DOMAIN}/api/vs`, 'POST', { slug });
            const result = resolveViaApi(raw);
            if (result) { console.log('[Ψ-4NDR0666] Tier 5 resolved.'); return result; }
        } catch (e) { console.warn(`[Ψ-4NDR0666] Tier 5 failed: ${e.message}`); }

        // Tier 6: POST /api/vs {token: slug} — body-key variant (2026 API mutation)
        console.log('[Ψ-4NDR0666] Tier 6: POST /api/vs {token}.');
        try {
            const raw    = await gmApiRequest(`https://${TARGET_DOMAIN}/api/vs`, 'POST', { token: slug });
            const result = resolveViaApi(raw);
            if (result) { console.log('[Ψ-4NDR0666] Tier 6 resolved.'); return result; }
        } catch (e) { console.warn(`[Ψ-4NDR0666] Tier 6 failed: ${e.message}`); }

        // Tier 7: GET /api/vs?slug=<slug> — method variant
        console.log('[Ψ-4NDR0666] Tier 7: GET /api/vs?slug.');
        try {
            const raw    = await gmApiRequest(
                `https://${TARGET_DOMAIN}/api/vs?slug=${encodeURIComponent(slug)}`,
                'GET', null
            );
            const result = resolveViaApi(raw);
            if (result) { console.log('[Ψ-4NDR0666] Tier 7 resolved.'); return result; }
        } catch (e) { console.warn(`[Ψ-4NDR0666] Tier 7 failed: ${e.message}`); }

        // ── Tier 8: CDN Signing Endpoint (glb-apisign.cdn.cr/sign) ───────────
        //
        // Extract a media UUID from available metadata sources, then request a
        // signed CDN URL via GM_xmlhttpRequest (CORS-safe, Referer-aware).
        //
        // ⚠ IP BINDING WARNING: The signed URL is cryptographically bound to
        // the requesting browser session's IP address. The token digest is:
        //   MD5(ClientIP + MediaUUID + SecretSalt + ex) = token
        // Opening the copied URL in the SAME browser works. Passing it to an
        // external tool (curl, mpv, wget) on a different network context or
        // proxy pool will produce a 404 — the server suppresses 403 responses
        // to mask existence and limit reverse engineering.
        // Use the URL in this browser session immediately after copying.
        console.log('[Ψ-4NDR0666] Tier 8: CDN signing endpoint.');

        let mediaUuid = null;

        // 8a: OpenGraph image metadata (fastest — always server-rendered)
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg?.content) {
            const m = ogImg.content.match(/\/thumbs\/([a-f0-9-]+)\./i)
                   || ogImg.content.match(/\/([a-f0-9-]+)\.(mp4|jpg|png|webp)/i);
            if (m) mediaUuid = m[1];
        }

        // 8b: window.videoCoverUrl environment global
        if (!mediaUuid && typeof window.videoCoverUrl !== 'undefined' && window.videoCoverUrl) {
            const m = window.videoCoverUrl.match(/\/thumbs\/([a-f0-9-]+)\.mp4/);
            if (m) mediaUuid = m[1];
        }

        // 8c: contextElement thumbnail/source scan
        if (!mediaUuid && contextElement) {
            for (const el of contextElement.querySelectorAll('img, source, video')) {
                const src = el.src || el.getAttribute('data-src') || el.getAttribute('src');
                if (src) {
                    const m = src.match(/\/thumbs\/([a-f0-9-]+)\./i)
                           || src.match(/\/([a-f0-9-]+)\.(mp4|jpg|png|webp)/i);
                    if (m) { mediaUuid = m[1]; break; }
                }
            }
        }

        if (!mediaUuid) {
            console.warn(`[Ψ-4NDR0666] Tier 8: Media UUID not extractable for slug "${slug}". All tiers exhausted.`);
            return null;
        }

        try {
            const encodedPath = encodeURIComponent(`/storage/media/${mediaUuid}.mp4`);
            const signUrl     = `https://glb-apisign.cdn.cr/sign?path=${encodedPath}`;
            console.log(`[Ψ-4NDR0666] Tier 8: Requesting sign for UUID ${mediaUuid}.`);
            // Content-Type not needed for GET; override to avoid preflight rejection
            const signData = await gmApiRequest(signUrl, 'GET', null, { 'Content-Type': undefined });
            const { token, ex } = signData;
            if (!token || !ex) throw new Error('Sign response missing token or ex fields.');
            // Build the signed CDN URL. The CDN node (c4s9-b) may rotate;
            // if the sign endpoint returns a full URL or node field, prefer that.
            const cdnNode   = signData.url || signData.node || 'c4s9-b.cdn.cr';
            const signedUrl = cdnNode.startsWith('https://')
                ? cdnNode
                : `https://${cdnNode}/storage/media/${mediaUuid}.mp4?token=${token}&ex=${ex}`;
            console.log(`[Ψ-4NDR0666] Tier 8 resolved: ${signedUrl}`);
            return signedUrl;
        } catch (e) {
            console.warn(`[Ψ-4NDR0666] Tier 8 failed: ${e.message}`);
        }

        console.error('[Ψ-4NDR0666] getBunkrStreamUrl: all 8 tiers exhausted. No stream URL resolved.');
        return null;
    }

    // =========================================================================
    // MODULE 7: UNIFIED DIRECT ACQUISITION
    // =========================================================================

    /** Apply accessibility attributes and keyboard activation to a glyph. */
    function makeAccessible(glyph, label, activateFn) {
        glyph.setAttribute('role', 'button');
        glyph.setAttribute('tabindex', '0');
        glyph.setAttribute('aria-label', label);
        glyph.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFn(e); }
        };
    }

    /**
     * NATIVE_DL_SEL — ordered selector battery for the native download anchor.
     * Used by both the single-asset DL glyph and autoEngageDownloadEndpoint.
     * Clicking the native anchor is the canonical download mechanism: it fires
     * the existing authenticated download flow without URL construction.
     */
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

        // ── Context 1: Single-Asset View ─────────────────────────────────────
        const urlSlugMatch = window.location.pathname.match(/\/[vfd]\/([\w-]+)/);
        const pageSlug     = (typeof window.jsSlug !== 'undefined' && window.jsSlug)
            ? window.jsSlug
            : (urlSlugMatch ? urlSlugMatch[1] : null);

        const mediaContainer = document.querySelector(
            '.video-container, .lightgallery, img.w-full, video, #video-container'
        );
        if (mediaContainer) {
            const wrapper = mediaContainer.parentElement;
            ensureRelative(wrapper);

            // DL Glyph — single-asset view
            //
            // Strategy (v5.7.0): getBunkrStreamUrl waterfall → gmDownload directly.
            //   The stream waterfall already resolves the CDN URL (Tier 3a currentSrc
            //   being the fastest path when the player is running). We reuse that
            //   resolved URL for the download — zero gateway hops, no HTML parsing,
            //   no new tabs. Falls back to gateway ghost-fetch only if waterfall fails.
            if (!document.querySelector('.psi-main-dl-glyph')) {
                const dlGlyph     = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph psi-main-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download';
                const activateDl  = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dlGlyph.innerHTML = spinnerHtml;

                    // Primary: resolve CDN URL via stream waterfall
                    // (Tier 3a video.currentSrc fires instantly when player is live)
                    if (pageSlug) {
                        const cdnUrl = await getBunkrStreamUrl(pageSlug, null);
                        if (cdnUrl) {
                            dlGlyph.innerHTML = downloadSvg;
                            console.log(`[Ψ-4NDR0666] DL glyph: waterfall resolved → ${cdnUrl}`);
                            gmDownload(cdnUrl);
                            return;
                        }
                    }

                    // Fallback: gateway ghost-fetch
                    const gatewayAnchor = document.querySelector(NATIVE_DL_SEL);
                    if (!gatewayAnchor?.href || gatewayAnchor.href === window.location.href) {
                        dlGlyph.innerHTML = downloadSvg;
                        console.warn('[Ψ-4NDR0666] DL glyph: no CDN URL and no gateway anchor. Aborting.');
                        return;
                    }
                    const gatewayUrl = gatewayAnchor.href;
                    if (/\.(mp4|webm|mkv|mov|zip|rar|7z|jpg|jpeg|png|gif|webp)(\?|$)/i.test(gatewayUrl)) {
                        dlGlyph.innerHTML = downloadSvg;
                        gmDownload(gatewayUrl);
                        return;
                    }
                    console.log(`[Ψ-4NDR0666] DL glyph: waterfall exhausted, ghost-fetching gateway: ${gatewayUrl}`);
                    GM_xmlhttpRequest({
                        method:  'GET',
                        url:     gatewayUrl,
                        headers: { 'Referer': `https://${TARGET_DOMAIN}/`, 'Accept': 'text/html,application/xhtml+xml' },
                        timeout: 15_000,
                        onload: (resp) => {
                            dlGlyph.innerHTML = downloadSvg;
                            if (resp.status < 200 || resp.status >= 300) { gmDownload(gatewayUrl); return; }
                            const doc         = new DOMParser().parseFromString(resp.responseText, 'text/html');
                            const finalAnchor = doc.querySelector('#download-btn[href], a[href*="cdn"][href$=".mp4"], a[href*="cdn"][href$=".zip"], a.ic-download-01[href], a[download][href]');
                            const finalUrl    = finalAnchor ? new URL(finalAnchor.getAttribute('href'), gatewayUrl).href : gatewayUrl;
                            gmDownload(finalUrl);
                        },
                        onerror:   () => { dlGlyph.innerHTML = downloadSvg; gmDownload(gatewayUrl); },
                        ontimeout: () => { dlGlyph.innerHTML = downloadSvg; gmDownload(gatewayUrl); },
                    });
                };
                dlGlyph.onclick = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
                wrapper.appendChild(dlGlyph);
            }

            // Stream Glyph — single-asset view
            if (pageSlug && !document.querySelector('.psi-main-stream-glyph')) {
                const streamGlyph     = document.createElement('div');
                streamGlyph.className = 'psi-stream-glyph psi-main-stream-glyph';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';
                const activateStream  = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const savedHtml               = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';
                    const streamUrl               = await getBunkrStreamUrl(pageSlug, null);
                    streamGlyph.innerHTML         = savedHtml;
                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        console.log(`[Ψ-4NDR0666] Stream URL acquired: ${streamUrl}`);
                        // Warn if URL is from Tier 8 (IP-bound signed URL)
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

        // ── Context 2: Grid View / Async Ghost Fetch Acquisition ─────────────
        // Selector battery covers all known Bunkr grid layouts:
        //   Legacy:        .grid > div, .grid-images_box, .theItem
        //   Advanced mode: main.grid > div  (album-sorting.js v6 grid parent)
        const items = document.querySelectorAll(
            '.grid > div, .grid-images_box, .theItem, main.grid > div, main[class*="grid"] > div'
        );
        // De-duplicate: advanced mode selectors may overlap with .grid > div.
        // Also skip the album header div (first child of advanced-mode grid) —
        // it contains the title/sort/stats UI and has no /f/ or /v/ anchor.
        const seenItems = new Set();
        [...items].filter(el => {
            if (seenItems.has(el)) return false;
            seenItems.add(el);
            // Must contain a file or video anchor to be a valid item
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

            // DL Glyph — grid view
            if (!el.querySelector('.psi-dl-glyph')) {
                const dlGlyph     = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Ghost Fetch Direct Download';
                const activateDl  = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    addVisited(alphaId);
                    el.classList.add('psi-visited');
                    if (dlGlyph.dataset.resolvedUrl) {
                        gmDownload(dlGlyph.dataset.resolvedUrl);
                        return;
                    }
                    dlGlyph.style.color       = 'var(--cyan)';
                    dlGlyph.style.borderColor = 'var(--cyan)';
                    try {
                        const fname    = link.href.split('/').pop();
                        console.log(`[Ψ-4NDR0666] Ghost Fetch engaging: ${link.href}`);
                        const finalUrl = await ghostFetch(link.href, fname);
                        dlGlyph.dataset.resolvedUrl = finalUrl;
                        dlGlyph.style.color         = 'var(--cyan)';
                        dlGlyph.style.borderColor   = 'var(--cyan)';
                        gmDownload(finalUrl, fname);
                    } catch (err) {
                        const reason = err.name === 'AbortError'
                            ? 'Ghost Fetch timed out (12s).'
                            : `Ghost Fetch failed: ${err.message}`;
                        console.warn(`[Ψ-4NDR0666] ${reason} Routing to view page.`);
                        dlGlyph.style.color       = 'var(--red)';
                        dlGlyph.style.borderColor = 'var(--red)';
                        window.open(link.href, '_blank');
                    }
                };
                dlGlyph.onmousedown = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
                ensureRelative(el);
                el.appendChild(dlGlyph);
            }

            // Stream Glyph — grid view
            if (!el.querySelector('.psi-stream-glyph')) {
                const streamGlyph     = document.createElement('div');
                streamGlyph.className = 'psi-stream-glyph';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';
                const activateStream  = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    addVisited(alphaId);
                    el.classList.add('psi-visited');
                    const savedHtml               = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';
                    const streamUrl               = await getBunkrStreamUrl(alphaId, el);
                    streamGlyph.innerHTML         = savedHtml;
                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        console.log(`[Ψ-4NDR0666] Stream URL acquired: ${streamUrl}`);
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
                streamGlyph.onmousedown = activateStream;
                makeAccessible(streamGlyph, 'Copy stream URL', activateStream);
                ensureRelative(el);
                el.appendChild(streamGlyph);
            }
        });

        // ── Context 3: Direct Links → URL Overlay ────────────────────────────
        document.querySelectorAll(
            'a[href*="get.bunk"], a[href*="bunkr.cr/files"], a[download], a[href$=".mp4"], a[href$=".zip"]'
        ).forEach(a => {
            if (a.classList.contains('psi-dl-glyph')) return;
            if (!a.href || a.href.includes('bunkr.cr/album')) return;
            const alphaIdMatch = a.href.match(/\/([a-zA-Z0-9]{8,15})$/);
            const overlayId    = alphaIdMatch?.[1] ?? null;
            const container    = a.closest('.grid > div, .grid-images_box, .theItem') || a.parentElement;
            if (container) createFileOverlay(a.href, container, overlayId);
        });

        document.querySelectorAll('img[src*="bunkr.cr"], video[src*="bunkr.cr"]').forEach(el => {
            if (!el.src) return;
            const alphaIdMatch = el.src.match(/\/([a-zA-Z0-9]{8,15})\./);
            const overlayId    = alphaIdMatch?.[1] ?? null;
            const container    = el.closest('.grid > div, .grid-images_box, .theItem') || el.parentElement;
            if (container) createFileOverlay(el.src, container, overlayId);
        });
    }

    // =========================================================================
    // MODULE 8: DIAGNOSTIC PROBE INTEGRATION
    // =========================================================================
    /**
     * showToast — display a timed notification overlay.
     *
     * @param {string}  msg        — Message text.
     * @param {number}  durationMs
     * @param {boolean} isPsi      — When true, renders the Ψ-glyph aesthetic
     *                              (SVG hexagon + styled label). Used for the
     *                              IP-streaming URL copy confirmation.
     *                              When false, renders plain monospace text
     *                              (diagnostic probe confirmations).
     */
    function showToast(msg, durationMs = 4000, isPsi = false) {
        const toast = document.createElement('div');
        toast.className = isPsi ? 'psi-toast psi-toast--glyph' : 'psi-toast';

        if (isPsi) {
            const psiSvg = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="psi-toast-icon" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2"/><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/><text x="64" y="68" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="serif">Ψ</text></svg>`;
            toast.innerHTML = `${psiSvg}<span class="psi-toast-label">${msg}</span>`;
        } else {
            toast.textContent = msg;
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('psi-toast--dying'), Math.max(0, durationMs - 400));
        setTimeout(() => toast.remove(), durationMs);
    }

    function executeDiagnosticProbe() {
        const report = {
            timestamp:      new Date().toISOString(),
            url:            window.location.href,
            topology:       albumMatch ? 'GRID_VIEW' : 'SINGLE_ASSET_VIEW',
            scripts:        Array.from(document.querySelectorAll('script[data-file-id]')).map(s => s.outerHTML),
            nativeDls:      Array.from(document.querySelectorAll(
                                'a[download], a.ic-download-01, a[href*="get.bunk"], a.btn-main, #download-btn'
                            )).map(a => ({ className: a.className, href: a.href, text: a.innerText.trim(), id: a.id })),
            gridItemsCount: document.querySelectorAll('.grid > div, .grid-images_box, .theItem').length,
            firstItemHTML:  document.querySelector('.grid > div, .grid-images_box, .theItem')?.outerHTML || 'None',
            interceptedCDN: Object.fromEntries(directMap),
            envGlobals: {
                jsSlug:        typeof window.jsSlug !== 'undefined'        ? window.jsSlug        : 'undefined',
                jsCDN:         typeof window.jsCDN !== 'undefined'         ? window.jsCDN         : 'undefined',
                videoCoverUrl: typeof window.videoCoverUrl !== 'undefined' ? window.videoCoverUrl : 'undefined',
            },
        };
        const dump = JSON.stringify(report, null, 2);
        console.log('[Ψ-4NDR0666OS] Diagnostic Probe:\n', dump);
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(dump)
                .then(() => showToast('📡 Probe complete — data copied to clipboard.'))
                .catch(() => showToast('📡 Probe complete — clipboard blocked. See F12 console.'));
        } else {
            showToast('📡 Probe complete — clipboard unavailable. See F12 console.');
        }
    }

    GM_registerMenuCommand('📡 Execute Diagnostic Probe', executeDiagnosticProbe);

    // =========================================================================
    // MODULE 9: AUTONOMOUS GATEWAY BYPASS
    // =========================================================================
    /**
     * autoEngageDownloadEndpoint — auto-click the download button on the
     * get.bunkr* /file/<id> intermediary gateway page only.
     *
     * This is intentionally restricted to the gateway hostname topology.
     * The isAssetView branch (bunkr.cr /v/ /f/ /d/) was removed in v5.6.0
     * because it fired unconditionally on every asset page navigation,
     * triggering an unwanted download popup every time the user simply
     * browsed to a media page. The DL glyph on single-asset pages now
     * handles direct acquisition via background ghostFetch instead.
     */
    function autoEngageDownloadEndpoint() {
        const isGateway = /get\.bunkr/i.test(window.location.hostname)
                          && window.location.pathname.includes('/file/');
        if (!isGateway) return;

        console.log('[Ψ-4NDR0666] Gateway page detected. Hunting #download-btn...');
        let attempts = 0;
        const MAX_ATTEMPTS = 30;
        const engageInterval = setInterval(() => {
            attempts++;
            const dlBtn = document.getElementById('download-btn')
                       || document.querySelector('a.ic-download-01');
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
    // MODULE 11: HOVER VIDEO PREVIEW ENGINE
    // =========================================================================
    /**
     * On mouseenter over a grid item that represents a video asset, resolves
     * the CDN URL via getBunkrStreamUrl and injects a muted autoplay <video>
     * overlay. Removed immediately on mouseleave, src nulled to release the
     * media resource and prevent memory leaks on long album sessions.
     *
     * Guards:
     *   - 300 ms dwell before fetch fires (prevents spam on fast hovering)
     *   - AbortController per card (cancels in-flight resolve if user leaves)
     *   - dataset.psiHoverBound flag prevents double-binding on re-injection
     *   - Video type detection via thumbnail URL pattern and anchor path
     */
    const HOVER_DWELL_MS  = 300;
    const VIDEO_EXTS_RE   = /\.(mp4|webm|mkv|mov|avi|flv|wmv|3gp)(\?|$)/i;
    const VIDEO_THUMB_RE  = /\/thumbs\/|\.mp4\.(jpg|jpeg|png|webp)/i;

    function isVideoGridItem(el) {
        const img = el.querySelector('img[src]');
        if (img?.src && VIDEO_THUMB_RE.test(img.src)) return true;
        const a = el.querySelector('a[href^="/v/"], a[href^="/f/"]');
        if (!a) return false;
        return VIDEO_EXTS_RE.test(a.href) || a.href.includes('/v/');
    }

    function initHoverPreviews() {
        if (!albumMatch) return;
        document.querySelectorAll('.grid > div, .grid-images_box, .theItem')
                .forEach(attachHoverPreview);
    }

    function attachHoverPreview(el) {
        if (el.dataset.psiHoverBound) return;
        el.dataset.psiHoverBound = '1';
        if (!isVideoGridItem(el)) return;

        let dwellTimer = null;
        let abortCtrl  = null;
        let previewEl  = null;

        const onEnter = () => {
            dwellTimer = setTimeout(async () => {
                abortCtrl?.abort();
                abortCtrl = new AbortController();
                const signal = abortCtrl.signal;

                const a    = el.querySelector('a[href^="/v/"], a[href^="/f/"]');
                if (!a) return;
                const slug = a.getAttribute('href').split('/').pop();
                if (!slug) return;

                const cdnUrl = await getBunkrStreamUrl(slug, el);
                if (!cdnUrl || signal.aborted) return;

                const vid       = document.createElement('video');
                vid.src         = cdnUrl;
                vid.autoplay    = true;
                vid.muted       = true;
                vid.loop        = true;
                vid.playsInline = true;
                vid.preload     = 'auto';
                Object.assign(vid.style, {
                    position:      'absolute',
                    inset:         '0',
                    width:         '100%',
                    height:        '100%',
                    objectFit:     'cover',
                    borderRadius:  'inherit',
                    zIndex:        '10',
                    background:    '#000',
                    pointerEvents: 'none',
                });
                ensureRelative(el);
                el.appendChild(vid);
                previewEl = vid;
                vid.play().catch(() => { /* autoplay blocked — silent */ });
            }, HOVER_DWELL_MS);
        };

        const onLeave = () => {
            clearTimeout(dwellTimer);
            abortCtrl?.abort();
            if (previewEl) {
                previewEl.pause();
                previewEl.src = '';
                previewEl.remove();
                previewEl = null;
            }
        };

        el.addEventListener('mouseenter', onEnter, { passive: true });
        el.addEventListener('mouseleave', onLeave, { passive: true });
    }

    // =========================================================================
    // MODULE 10: DEFENSIVE ORCHESTRATION
    // =========================================================================
    function bootstrap() {
        if (!document.body) {
            setTimeout(bootstrap, 50);
            return;
        }
        console.log('[Ψ-4NDR0666] Intelligence baseline established. Injecting payloads.');
        initVisitedTracker();
        forceLargestFirst();
        autoEngageDownloadEndpoint();
        setTimeout(injectCaptureVector, 800);
        setTimeout(initHoverPreviews,   1200);

        const observer = new MutationObserver((mutations) => {
            const structural = mutations.some(m => m.addedNodes.length > 0);
            if (!structural) return;
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                injectCaptureVector();
                initHoverPreviews();
            }, 400);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });

        // SPA navigation handler: reconnect observer and re-run injection.
        // Resets _sortExecuted so the sort hijack fires again on album pages.
        const onSpaNav = () => {
            observer.disconnect();
            _sortExecuted = false;
            setTimeout(() => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    initVisitedTracker();
                    forceLargestFirst();
                    injectCaptureVector();
                    initHoverPreviews();
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
