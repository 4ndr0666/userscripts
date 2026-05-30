// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.4.0
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
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==
(function () {
    'use strict';
    console.log('%c[4NDR0tools] Bunkr++ v5.4.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

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
        .psi-dl-glyph:focus-visible { outline: 2px solid var(--yellow); outline-offset: 2px; }
        .psi-dl-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; }

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

        // Intercept the native player's /api/vs (and /api/vs2) request and
        // clone the decrypted payload into directMap for Tier 2 consumption.
        if (/\/api\/vs2?($|\?)/.test(reqUrl)) {
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

    /**
     * gmDownload — force a file save via GM_download.
     *
     * Bypasses Content-Disposition; the browser saves regardless of MIME type.
     * Filename is derived from the URL's last path segment.
     * Falls back to window.open on GM_download error so the file is still
     * accessible (opened in a new tab) rather than silently dropped.
     */
    function gmDownload(url, hint) {
        const name = hint
            || url.split('/').pop().split('?')[0].split('#')[0]
            || 'bunkr_download';
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
        // ── Tier 0: Poll for native player intercept (up to 2 s) ─────────────
        if (!directMap.has('native_api_resolved') && !directMap.has('m3u8_stream')) {
            console.log('[Ψ-4NDR0666] Tier 0: Polling for native player intercept (max 2 s)...');
            await new Promise(resolve => {
                let ticks = 0;
                const poll = setInterval(() => {
                    if (directMap.has('native_api_resolved') || directMap.has('m3u8_stream') || ++ticks >= 10) {
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

        // ── Tier 3: Live DOM video src ────────────────────────────────────────
        const vid = document.querySelector('video source, video');
        if (vid?.src && !vid.src.startsWith('blob:')) {
            console.log('[Ψ-4NDR0666] Tier 3: Live DOM video object extraction hit.');
            return vid.src;
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
            // Clicks the native download anchor directly. If the SPA has not yet
            // hydrated the anchor, polls for up to 1.5 s before giving up.
            if (!document.querySelector('.psi-main-dl-glyph')) {
                const dlGlyph     = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph psi-main-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download Bypass';
                const activateDl  = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const btn = document.querySelector(NATIVE_DL_SEL);
                    if (btn?.href && btn.href !== window.location.href && btn.href !== '#') {
                        console.log(`[Ψ-4NDR0666] Native DL anchor clicked: ${btn.href}`);
                        btn.click();
                    } else {
                        console.log('[Ψ-4NDR0666] Native DL anchor not ready. Polling (max 1.5 s)...');
                        dlGlyph.innerHTML = spinnerHtml;
                        let ticks = 0;
                        const poll = setInterval(() => {
                            const b = document.querySelector(NATIVE_DL_SEL);
                            if (b?.href && b.href !== window.location.href && b.href !== '#') {
                                clearInterval(poll);
                                dlGlyph.innerHTML = downloadSvg;
                                console.log(`[Ψ-4NDR0666] Native DL anchor resolved: ${b.href}`);
                                b.click();
                            } else if (++ticks >= 6) {
                                clearInterval(poll);
                                dlGlyph.innerHTML = downloadSvg;
                                console.warn('[Ψ-4NDR0666] Native DL anchor not found within 1.5 s.');
                            }
                        }, 250);
                    }
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
                            showToast('⚠ Signed URL copied — IP-bound to this browser session. Open in this browser only.', 6000);
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
                    dlGlyph.style.color       = 'var(--yellow)';
                    dlGlyph.style.borderColor = 'var(--yellow)';
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
                            showToast('⦒ █▓░URL copied for IP streaming.', 6000);
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
     * autoEngageDownloadEndpoint — poll for a native download anchor and click it.
     *
     * Covers two distinct page topologies:
     *
     *   A) get.bunkr* /file/<id>  — intermediary download gateway page.
     *      Selectors: #download-btn, a.ic-download-01
     *      Action: navigate self to the resolved href.
     *
     *   B) bunkr.cr /v/<slug>, /f/<slug>, /d/<slug>  — single-asset view pages.
     *      Selectors: NATIVE_DL_SEL battery
     *      Action: click the native anchor — triggers the browser's built-in
     *      download flow without any URL guessing or synthetic construction.
     *      A 1 s initial delay allows the SPA to fully hydrate before polling.
     */
    function autoEngageDownloadEndpoint() {
        const isGateway   = /get\.bunkr/i.test(window.location.hostname)
                            && window.location.pathname.includes('/file/');
        const isAssetView = window.location.hostname === TARGET_DOMAIN
                            && /^\/[vfd]\//.test(window.location.pathname);

        if (!isGateway && !isAssetView) return;

        const label       = isGateway ? 'Gateway' : 'Asset-view';
        const initialWait = isAssetView ? 1000 : 0;
        const MAX_ATTEMPTS = 30;

        console.log(`[Ψ-4NDR0666] ${label} page detected. Scheduling download engagement.`);

        setTimeout(() => {
            let attempts = 0;
            const engageInterval = setInterval(() => {
                attempts++;
                let dlBtn = null;
                if (isGateway) {
                    dlBtn = document.getElementById('download-btn')
                         || document.querySelector('a.ic-download-01');
                } else {
                    dlBtn = document.querySelector(NATIVE_DL_SEL);
                }
                if (dlBtn?.href && dlBtn.href !== window.location.href && dlBtn.href !== '#') {
                    clearInterval(engageInterval);
                    console.log(`[Ψ-4NDR0666] ${label}: anchor found after ${attempts} attempt(s).`);
                    if (isGateway) {
                        window.open(dlBtn.href, '_self');
                    } else {
                        dlBtn.click();
                        console.log('[Ψ-4NDR0666] Asset-view: native download button clicked.');
                    }
                } else if (attempts >= MAX_ATTEMPTS) {
                    clearInterval(engageInterval);
                    console.warn(`[Ψ-4NDR0666] ${label}: anchor not ready after ${MAX_ATTEMPTS} attempts. Aborting.`);
                }
            }, 500);
            window.addEventListener('beforeunload', () => clearInterval(engageInterval), { once: true });
        }, initialWait);
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
