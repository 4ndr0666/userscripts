// ==UserScript==
// @name         4ndr0tools - Bunkr++ 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.0.0
// @author       4ndr0666
// @description  Part of 4ndr0tools: Canonical routing, auto-sort, hide visited, bypass dl gateway
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr%2B%2B.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr%2B%2B.user.js
// @icon         data:image/png;base64,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
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://bunkr.*/*
// @match        *://*.bunkr.*/*
// @match        *://bunker.*/*
// @match        *://*.bunker.*/*
// @match        *://bunkrr.*/*
// @match        *://*.bunkrr.*/*
// @grant        GM_download
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log('%c[4NDR0tools] Bunkr++ v5.0.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

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

        /* Direct Acquisition Glyph */
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
        .psi-dl-glyph:focus-visible { outline: 2px solid var(--yellow); outline-offset: 2px; }
        .psi-dl-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; }

        /* Stream Extraction Glyph — shifted left of DL glyph */
        .psi-stream-glyph {
            position: absolute;
            bottom: 8px; right: 48px;
            width: 32px; height: 32px;
            background: rgba(10, 19, 26, 0.9);
            border: 1px solid var(--yellow);
            border-radius: 8px;
            display: flex; justify-content: center; align-items: center;
            cursor: pointer; z-index: 9999;
            color: var(--yellow);
            transition: all 0.2s ease;
            -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px);
            text-decoration: none !important;
        }
        .psi-stream-glyph:hover { background: var(--yellow); color: #000; box-shadow: 0 0 15px var(--yellow); transform: scale(1.05); }
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

        /* Forensic Tracker UI */
        #psi-visited-toggle {
            position: fixed; bottom: 8px; left: 8px; z-index: 999999;
            background: rgba(10, 15, 26, 0.95); color: var(--cyan);
            border: 1px solid var(--cyan); border-radius: 4px;
            padding: 6px 12px; font: bold 11px monospace; cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); user-select: none; transition: all 0.2s;
        }
        #psi-visited-toggle:hover { background: var(--cyan); color: #000; }

        /* Filtration States */
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
    `);

    // =========================================================================
    // MODULE 3: NETWORK SNIFFING (Multi-Tier EAFP Proxy)
    // =========================================================================
    const directMap = new Map();
    const origFetch = window.fetch;

    window.fetch = async function (...args) {
        const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        // Tier 2: Intercept the native player's /api/vs request and clone the
        // decrypted payload. This fires when the Bunkr native player is active
        // (single-asset view). Absent on grid/album pages — Tier 4 handles those.
        if (reqUrl.includes('/api/vs')) {
            try {
                const res = await origFetch.apply(this, args);
                const cloned = res.clone();
                cloned.json().then(data => {
                    if (data.url) {
                        if (data.encrypted) {
                            // Exact algorithm from player.enc.js (_0x2ad1ff):
                            //   key = 'SECRET_KEY_' + Math.floor(timestamp / 3600)
                            //   bytes = atob(url) -> Uint8Array via charCodeAt
                            //   XOR bytes with TextEncoder.encode(key) cyclically
                            const binaryString  = atob(data.url);
                            const key           = `SECRET_KEY_${Math.floor(data.timestamp / 3600)}`;
                            const keyBytes      = new TextEncoder().encode(key);
                            const decryptedBytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                decryptedBytes[i] = binaryString.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
                            }
                            directMap.set('native_api_resolved', new TextDecoder().decode(decryptedBytes));
                        } else {
                            directMap.set('native_api_resolved', data.url);
                        }
                    }
                }).catch(() => {});
                return res;
            } catch (e) {
                return origFetch.apply(this, args);
            }
        }

        // Tier 1 & Logging: CDN URL intercept
        const res = await origFetch.apply(this, args);
        try {
            if (reqUrl && /(media-|cdn|scdn\.st|bunkr)/i.test(reqUrl)) {
                if (reqUrl.includes('.m3u8')) directMap.set('m3u8_stream', reqUrl);
                if (/\.(mp4|m3u8)/i.test(reqUrl)) {
                    const fname = reqUrl.split('/').pop().split('?')[0];
                    if (fname) directMap.set(fname, reqUrl);
                    directMap.set('last_media', reqUrl);
                }
            }
        } catch { /* EAFP */ }
        return res;
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        try {
            if (typeof url === 'string') {
                if (url.includes('.m3u8')) directMap.set('m3u8_stream', url);
                if (/(media-|cdn|scdn\.st|bunkr)/i.test(url) && /\.(mp4|m3u8)/i.test(url)) {
                    const fname = url.split('/').pop().split('?')[0];
                    if (fname) directMap.set(fname, url);
                    directMap.set('last_media', url);
                }
            }
        } catch { /* EAFP */ }
        return origXhrOpen.apply(this, [method, url, ...rest]);
    };

    // =========================================================================
    // MODULE 4: STATE-AWARE SORT HIJACK (Polled)
    // =========================================================================
    // Source analysis of album-sorting.js confirms:
    //   - Button class: .btnSize  (first click → 'asc', second click → 'desc')
    //   - No ascending-indicator class/glyph injected by the framework.
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

                // Always issue a second click — first click produces 'asc',
                // second click produces 'desc'. No heuristic needed.
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
    }

    // =========================================================================
    // MODULE 5: FORENSIC STATE TRACKER
    // =========================================================================
    function _loadVisitedFromStorage() {
        try { return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]')); }
        catch { return new Set(); }
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

        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'psi-visited-toggle';
        toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        toggleBtn.title = 'Left-Click: Cycle Mode (DIM/HIDE/SHOW)\nRight-Click: Purge Registry\nBuffer: 10,000 items max (FIFO)';

        toggleBtn.onclick = (e) => {
            e.preventDefault();
            const idx = MODES.indexOf(_visitedMode);
            _visitedMode = MODES[(idx + 1) % MODES.length];
            localStorage.setItem(MODE_KEY, _visitedMode);
            document.body.setAttribute('data-psi-visited-mode', _visitedMode);
            toggleBtn.textContent = `👁 VISITED: ${_visitedMode}`;
        };

        toggleBtn.oncontextmenu = (e) => {
            e.preventDefault();
            if (window.confirm('[Ψ-4NDR0666OS] PURGE WARNING:\nClear the forensic registry of all visited assets?')) {
                localStorage.removeItem(VISITED_KEY);
                _visitedCache = new Set();
                _visitedDirty = false;
                location.reload();
            }
        };

        document.body.appendChild(toggleBtn);

        GM_registerMenuCommand('🧹 Purge Visited Registry', () => {
            localStorage.removeItem(VISITED_KEY);
            _visitedCache = new Set();
            _visitedDirty = false;
            location.reload();
        });
    }

    // =========================================================================
    // MODULE 6: ACQUISITION UTILITIES & GHOST FETCH
    // =========================================================================
    const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const streamSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const spinnerHtml = '<span style="font-size:8px;font-family:monospace;">...</span>';

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

        const onCopied = () => {
            if (isGlyph) overlay.innerHTML = '<span style="font-size:14px;font-family:monospace;font-weight:bold;">✓</span>';
            else overlay.textContent = 'COPIED ✓';
            overlay.style.color       = 'var(--cyan)';
            overlay.style.borderColor = 'var(--cyan)';
            setTimeout(() => {
                if (isGlyph) overlay.innerHTML = origContent;
                else overlay.textContent = origContent;
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
                else overlay.textContent = origContent;
                overlay.style.color       = origColor;
                overlay.style.borderColor = origBorder;
            }, 2200);
        };

        const fallback = () => {
            try { legacyCopy(text, onCopied); } catch { onFailed(); }
        };

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(onCopied).catch(fallback);
        } else {
            fallback();
        }
    }

    function createFileOverlay(url, element, idToMark) {
        if (element.querySelector('.psi-url-overlay')) return;

        const overlay = document.createElement('div');
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
     *   2. Fetch the view page and parse with DOMParser
     *   3. directMap 'last_media' fallback (most recently seen CDN media URL)
     *
     * @param {string} href  — The /f/<id> or /v/<id> view-page URL.
     * @param {string} fname — Optional filename hint for directMap cache lookup.
     * @returns {Promise<string>} Resolved CDN URL.
     */
    async function ghostFetch(href, fname) {
        // Fast path: live CDN map hit
        if (fname && directMap.has(fname)) {
            console.log(`[Ψ-4NDR0666] directMap cache hit for: ${fname}`);
            return directMap.get(fname);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12_000);

        try {
            const res = await origFetch(href, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();

            const doc = new DOMParser().parseFromString(html, 'text/html');
            const dlAnchor = doc.querySelector(
                'a[href*="get.bunkr"], a.ic-download-01, a[href*="/file/"]'
            );
            if (dlAnchor?.href) return dlAnchor.href;

            // Last-resort: use the most recently intercepted CDN media URL.
            // Applies when the page is fully client-rendered and the parser
            // finds no server-rendered anchor.
            if (directMap.has('last_media')) {
                console.log('[Ψ-4NDR0666] ghostFetch: falling back to last_media from directMap.');
                return directMap.get('last_media');
            }

            throw new Error('Download anchor not found in fetched DOM and no last_media cached.');
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * getBunkrStreamUrl — Resolves the canonical streaming URL.
     *
     * 4-Tier Waterfall Extraction Engine:
     *
     *   Tier 1 — Intercepted M3U8 playlist (XHR/fetch proxy hit)
     *   Tier 2 — Native-player API clone (decrypted /api/vs response)
     *   Tier 3 — Live DOM video src extraction
     *   Tier 4 — Standalone autonomous /api/vs call with XOR decryption
     *
     * Decryption algorithm verified against player.enc.js (_0x2ad1ff):
     *   key    = 'SECRET_KEY_' + Math.floor(data.timestamp / 3600)
     *   bytes  = atob(data.url) → charCodeAt → Uint8Array
     *   result = XOR(bytes, TextEncoder.encode(key), cyclic)
     *   output = TextDecoder.decode(result)
     *
     * The server rotates the key every hour; setInterval in the native player
     * also fires every 3,600,000 ms (1 h) to re-fetch, keeping them in sync.
     *
     * @param {string} slug — Alphanumeric asset slug (not a numeric file ID).
     * @returns {Promise<string|null>}
     */
    async function getBunkrStreamUrl(slug) {
        // Tier 1: Intercepted M3U8
        if (directMap.has('m3u8_stream')) {
            console.log('[Ψ-4NDR0666] Tier 1 Waterfall: M3U8 XHR match.');
            return directMap.get('m3u8_stream');
        }

        // Tier 2: Natively decrypted API payload (from native player intercept)
        if (directMap.has('native_api_resolved')) {
            console.log('[Ψ-4NDR0666] Tier 2 Waterfall: Native API clone match.');
            return directMap.get('native_api_resolved');
        }

        // Tier 3: Live DOM video src
        const vid = document.querySelector('video source, video');
        if (vid && vid.src && !vid.src.startsWith('blob:')) {
            console.log('[Ψ-4NDR0666] Tier 3 Waterfall: Live DOM src match.');
            return vid.src;
        }

        // Tier 4: Standalone XOR Decryption Engine
        console.log('[Ψ-4NDR0666] Tier 4 Waterfall: Engaging Standalone Decryption Engine.');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10_000);

        try {
            const res = await origFetch(`https://${TARGET_DOMAIN}/api/vs`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ slug }),
                signal:  controller.signal,
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data.encrypted) {
                // Exact replica of player.enc.js _0x2ad1ff:
                const binaryString   = atob(data.url);
                const key            = `SECRET_KEY_${Math.floor(data.timestamp / 3600)}`;
                const keyBytes       = new TextEncoder().encode(key);
                const decryptedBytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    decryptedBytes[i] = binaryString.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
                }
                return new TextDecoder().decode(decryptedBytes);
            }

            return data.url || null;
        } catch (e) {
            const label = e.name === 'AbortError' ? 'Timed out (10s)' : e.message;
            console.error(`[Ψ-4NDR0666] getBunkrStreamUrl failed: ${label}`);
            return null;
        } finally {
            clearTimeout(timer);
        }
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

    function injectCaptureVector() {
        const visited = getVisitedCache();

        // ── Context 1: Single-Asset View ─────────────────────────────────────
        const scriptId     = document.querySelector('script[data-file-id]')?.getAttribute('data-file-id');
        const mainNativeDl = document.querySelector('a.ic-download-01, a[href*="get.bunkrr.su/file/"]');

        let mainTargetUrl = null;
        if (mainNativeDl?.href) {
            mainTargetUrl = mainNativeDl.href;
        } else if (scriptId && /^\d+$/.test(scriptId)) {
            mainTargetUrl = `https://get.bunkrr.su/file/${scriptId}`;
        }

        // jsSlug is a server-rendered template global confirmed by player.enc.js.
        // Fall back to URL extraction for robustness.
        const urlSlugMatch = window.location.pathname.match(/\/[vfd]\/([\w-]+)/);
        const pageSlug = (typeof window.jsSlug !== 'undefined' && window.jsSlug)
            ? window.jsSlug
            : (urlSlugMatch ? urlSlugMatch[1] : null);

        const mediaContainer = document.querySelector('.video-container, .lightgallery, img.w-full, video');
        if (mediaContainer) {
            const wrapper = mediaContainer.parentElement;
            ensureRelative(wrapper);

            // DL Glyph — single-asset view
            if (mainTargetUrl && !document.querySelector('.psi-main-dl-glyph')) {
                const dlGlyph = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph psi-main-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download Bypass';

                const activateDl = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[Ψ-4NDR0666] Direct acquisition bypass: ${mainTargetUrl}`);
                    window.open(mainTargetUrl, '_blank');
                };
                dlGlyph.onclick = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
                wrapper.appendChild(dlGlyph);
            }

            // Stream Glyph — single-asset view
            if (pageSlug && !document.querySelector('.psi-main-stream-glyph')) {
                const streamGlyph = document.createElement('div');
                streamGlyph.className = 'psi-stream-glyph psi-main-stream-glyph';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';

                const activateStream = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const savedHtml = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';

                    const streamUrl = await getBunkrStreamUrl(pageSlug);
                    streamGlyph.innerHTML = savedHtml;

                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        console.log(`[Ψ-4NDR0666] Stream URL acquired: ${streamUrl}`);
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
        const items = document.querySelectorAll('.grid > div, .grid-images_box, .theItem');

        items.forEach(el => {
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
                const dlGlyph = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Ghost Fetch Direct Download';

                const activateDl = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return; // right-click guard
                    e.preventDefault();
                    e.stopPropagation();

                    addVisited(alphaId);
                    el.classList.add('psi-visited');

                    if (dlGlyph.dataset.resolvedUrl) {
                        window.open(dlGlyph.dataset.resolvedUrl, '_blank');
                        return;
                    }

                    dlGlyph.style.color       = 'var(--yellow)';
                    dlGlyph.style.borderColor = 'var(--yellow)';

                    try {
                        const fname    = link.href.split('/').pop();
                        console.log(`[Ψ-4NDR0666] Ghost Fetch engaging: ${link.href}`);
                        const finalUrl = await ghostFetch(link.href, fname);
                        dlGlyph.dataset.resolvedUrl = finalUrl;
                        dlGlyph.style.color       = 'var(--cyan)';
                        dlGlyph.style.borderColor = 'var(--cyan)';
                        window.open(finalUrl, '_blank');
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
                const streamGlyph = document.createElement('div');
                streamGlyph.className = 'psi-stream-glyph';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';

                const activateStream = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return; // right-click guard
                    e.preventDefault();
                    e.stopPropagation();

                    addVisited(alphaId);
                    el.classList.add('psi-visited');

                    // Validate slug: /api/vs requires an alphanumeric slug, not a raw numeric ID.
                    if (/^\d+$/.test(alphaId)) {
                        console.warn(`[Ψ-4NDR0666] Stream glyph: "${alphaId}" is a numeric file ID, not a slug. Navigate to the asset page to use the stream extractor.`);
                        streamGlyph.style.color       = 'var(--red)';
                        streamGlyph.style.borderColor = 'var(--red)';
                        setTimeout(() => {
                            streamGlyph.style.color       = '';
                            streamGlyph.style.borderColor = '';
                        }, 2500);
                        return;
                    }

                    const savedHtml = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';

                    const streamUrl = await getBunkrStreamUrl(alphaId);
                    streamGlyph.innerHTML = savedHtml;

                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        console.log(`[Ψ-4NDR0666] Stream URL acquired: ${streamUrl}`);
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
    function showToast(msg, durationMs = 4000) {
        const toast = document.createElement('div');
        Object.assign(toast.style, {
            position:      'fixed',
            top:           '16px',
            right:         '16px',
            zIndex:        '9999999',
            background:    'rgba(10,15,26,0.97)',
            color:         '#00E5FF',
            border:        '1px solid #00E5FF',
            borderRadius:  '6px',
            padding:       '10px 16px',
            font:          'bold 11px monospace',
            boxShadow:     '0 0 14px rgba(0,229,255,0.3)',
            pointerEvents: 'none',
            maxWidth:      '420px',
        });
        toast.textContent = msg;
        document.body.appendChild(toast);
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
    function autoEngageDownloadEndpoint() {
        if (!/get\.bunkr/i.test(window.location.hostname)) return;
        if (!window.location.pathname.includes('/file/')) return;

        console.log('[Ψ-4NDR0666] Intermediary gateway detected. Hunting #download-btn...');

        let attempts = 0;
        const MAX_ATTEMPTS = 30;

        const engageInterval = setInterval(() => {
            attempts++;
            const dlBtn = document.getElementById('download-btn') || document.querySelector('a.ic-download-01');

            if (dlBtn?.href && dlBtn.href !== window.location.href && dlBtn.href !== '#') {
                clearInterval(engageInterval);
                console.log(`[Ψ-4NDR0666] Gateway breached after ${attempts} attempt(s). Navigating: ${dlBtn.href}`);
                window.open(dlBtn.href, '_self');
            } else if (attempts >= MAX_ATTEMPTS) {
                clearInterval(engageInterval);
                console.warn(`[Ψ-4NDR0666] Download button inactive after ${MAX_ATTEMPTS} attempts (15s). Aborting.`);
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(engageInterval), { once: true });
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

        const observer = new MutationObserver((mutations) => {
            const structural = mutations.some(m => m.addedNodes.length > 0);
            if (!structural) return;
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(injectCaptureVector, 400);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });

        // SPA navigation handler: reconnect observer and re-run injection.
        // Also resets _sortExecuted so the sort hijack fires again on album pages.
        const onSpaNav = () => {
            observer.disconnect();
            _sortExecuted = false;  // Allow sort hijack to re-fire on new album routes
            setTimeout(() => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true });
                    initVisitedTracker();
                    forceLargestFirst();
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
