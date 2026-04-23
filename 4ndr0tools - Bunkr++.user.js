// ==UserScript==
// @name         4ndr0tools - Bunkr++ 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.0.0
// @author       4ndr0666
// @description  Part of 4ndr0tools: Canonical routing, auto-sort, hide visited, bypass dl gateway
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://bunkr.*/*
// @match        *://*.bunkr.*/*
// @match        *://bunker.*/*
// @match        *://*.bunker.*/*
// @match        *://bunkrr.*/*
// @match        *://*.bunkrr.*/*
// @icon         data:image/png;base64,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      
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @grant        GM_download
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_registerMenuCommand
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log('%c[4NDR0666OS] Bunkr++ v4.0.12-Ψ — INFORMATION IS INERT', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // ==========================================
    // INTERNAL STATE & UTILITIES (Zero Window Pollution)
    // ==========================================
    /** @type {Set<string>} In-memory visited registry — single source of truth. */
    let _visitedCache = null;
    let _visitedMode  = 'DIM';
    let _sortExecuted = false;
    let _debounceTimer = null;

    const VISITED_KEY = 'psi_visited_assets';
    const MODE_KEY    = 'psi_visited_mode';
    const MODES       = ['DIM', 'HIDE', 'SHOW'];
    const MAX_VISITED = 10_000;

    /** Utility: ensure an element has position context for absolute children. */
    function ensureRelative(el) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    }

    /** Utility: clamp a string for overlay display. */
    function truncUrl(url, max = 70) {
        return url.length > max ? url.substring(0, max - 3) + '...' : url;
    }

    // ==========================================
    // MODULE 1: CANONICAL ROUTING & PARAMETRIC SORT
    // ==========================================
    const TARGET_DOMAIN = 'bunkr.cr';
    const u = new URL(window.location.href);
    let redirectNeeded = false;

    const isAssetEndpoint = /cdn|get|media/i.test(u.hostname);

    if (u.hostname !== TARGET_DOMAIN && !isAssetEndpoint) {
        const pat = /(?:^|\.)(bunkr|bunker|bunkrr)\.[a-z0-9-]{2,}$/i;
        if (pat.test(u.hostname)) {
            u.hostname = TARGET_DOMAIN;
            redirectNeeded = true;
        }
    }

    if (u.pathname.startsWith('/a/')) {
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

    // ==========================================
    // MODULE 2: SYSTEM STYLING & SURGICAL PURGE
    // ==========================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --yellow: #FFD700; --red: #FF0055; }

        /* Direct Acquisition Glyph */
        .psi-dl-glyph {
            position: absolute;
            bottom: 8px;
            right: 8px;
            width: 32px;
            height: 32px;
            background: rgba(10, 19, 26, 0.9);
            border: 1px solid var(--cyan);
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            z-index: 9999;
            color: var(--cyan);
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            text-decoration: none !important;
        }
        .psi-dl-glyph:hover {
            background: var(--cyan);
            color: #000;
            box-shadow: 0 0 15px var(--cyan);
            transform: scale(1.05);
        }
        .psi-dl-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; }

        /* Direct URL Overlay */
        .psi-url-overlay {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(10, 15, 26, 0.95);
            color: var(--cyan);
            padding: 5px 9px;
            font-size: 11px;
            font-family: monospace;
            border: 1px solid var(--cyan);
            border-radius: 3px;
            z-index: 999999;
            cursor: pointer;
            max-width: 360px;
            word-break: break-all;
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
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); user-select: none;
            transition: all 0.2s;
        }
        #psi-visited-toggle:hover { background: var(--cyan); color: #000; }

        /* Filtration States */
        body[data-psi-visited-mode="DIM"] .psi-visited {
            opacity: 0.3 !important;
            filter: grayscale(100%);
            transition: opacity 0.3s, filter 0.3s;
        }
        body[data-psi-visited-mode="DIM"] .psi-visited:hover {
            opacity: 0.9 !important;
            filter: none;
        }
        body[data-psi-visited-mode="HIDE"] .psi-visited { display: none !important; }

        /* Surgical Adversarial Purge */
        header, .bg-mute, .live-indicator-container, #liveCount, footer, [data-cl-spot],
        iframe[src*="ads"], iframe[src*="pop"], .banner, .ad-container, .ad-box,
        .adsbygoogle, .popup-ad, .ad-wrap { display: none !important; }
    `);

    // ==========================================
    // MODULE 3: NETWORK SNIFFING (EAFP Proxy)
    // ==========================================
    const directMap = new Map();
    const origFetch = window.fetch;

    window.fetch = async function (...args) {
        const res = await origFetch.apply(this, args);
        try {
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (url && /bunkr/i.test(url) && /(media-|cdn)/i.test(url)) {
                const fname = url.split('/').pop().split('?')[0];
                if (fname) directMap.set(fname, url);
            }
        } catch { /* EAFP: Never disrupt the host thread */ }
        return res;
    };

    // ==========================================
    // MODULE 4: STATE-AWARE SORT HIJACK (Polled)
    // ==========================================
    function forceLargestFirst() {
        if (!window.location.pathname.startsWith('/a/')) return;
        if (_sortExecuted) return;

        let attempts = 0;
        const sortInterval = setInterval(() => {
            attempts++;

            const sizeBtn = document.querySelector('.btnSize, button[title*="size"], a[href*="sort=size"], .sort-size') ||
                            Array.from(document.querySelectorAll('a, button')).find(e => e.textContent.trim().toLowerCase() === 'size');

            if (sizeBtn) {
                clearInterval(sortInterval);
                console.log('[Ψ-4NDR0666] Size sort node acquired. Initiating descent.');

                sizeBtn.click();
                _sortExecuted = true;

                setTimeout(() => {
                    const href = (sizeBtn.href || '').toLowerCase();
                    const cls  = (sizeBtn.className || '').toLowerCase();
                    const txt  = (sizeBtn.textContent || '').toLowerCase();

                    const isAscending = txt.includes('↑') ||
                                        cls.includes('asc') ||
                                        href.includes('order=asc') ||
                                        (!txt.includes('↓') && !txt.includes('desc') && !cls.includes('desc') && !href.includes('order=desc'));

                    if (isAscending) {
                        console.log('[Ψ-4NDR0666] Ascending state detected. Secondary descent strike forced.');
                        if (sizeBtn.tagName === 'A' && sizeBtn.href) {
                            window.location.href = sizeBtn.href.replace('order=asc', 'order=desc');
                        } else {
                            sizeBtn.click();
                        }
                    } else {
                        console.log('[Ψ-4NDR0666] Descent confirmed.');
                    }
                }, 800);
            } else if (attempts > 15) {
                clearInterval(sortInterval);
                console.log('[Ψ-4NDR0666] Size sort node not found after 15 cycles. Aborting sort hijack.');
            }
        }, 400);

        window.addEventListener('beforeunload', () => clearInterval(sortInterval), { once: true });
    }

    // ==========================================
    // MODULE 5: FORENSIC STATE TRACKER
    // ==========================================
    function _loadVisitedFromStorage() {
        try {
            const raw = localStorage.getItem(VISITED_KEY);
            return new Set(raw ? JSON.parse(raw) : []);
        } catch {
            return new Set();
        }
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

        if (cache.size > MAX_VISITED) {
            const [oldest] = cache;
            cache.delete(oldest);
        }

        try {
            localStorage.setItem(VISITED_KEY, JSON.stringify([...cache]));
        } catch {
            // Storage full — silent EAFP
        }
    }

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
        toggleBtn.title = 'Left-Click: Change Mode | Right-Click: Purge Registry';

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
            if (confirm('[Ψ-4NDR0666OS] PURGE WARNING:\nClear the forensic registry of all visited assets?')) {
                localStorage.removeItem(VISITED_KEY);
                _visitedCache = new Set();
                location.reload();
            }
        };

        document.body.appendChild(toggleBtn);

        GM_registerMenuCommand('🧹 Purge Visited Registry', () => {
            localStorage.removeItem(VISITED_KEY);
            _visitedCache = new Set();
            location.reload();
        });
    }

    // ==========================================
    // MODULE 6: ACQUISITION UTILITIES & GHOST FETCH
    // ==========================================
    const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

    function robustCopy(text, overlay) {
        const orig = overlay.textContent;
        const confirm = () => {
            overlay.textContent = 'COPIED ✓';
            setTimeout(() => { overlay.textContent = orig; }, 1400);
        };

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(confirm).catch(() => legacyCopy(text, confirm));
        } else {
            legacyCopy(text, confirm);
        }
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

    function createFileOverlay(url, element, idToMark) {
        if (element.querySelector('.psi-url-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'psi-url-overlay';
        overlay.textContent = truncUrl(url);

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

        setTimeout(() => overlay.remove(), 25000);
    }

    /**
     * Ghost Fetch: resolve a grid item's true CDN download URL by fetching its view page.
     * Uses AbortController to enforce a hard 12s timeout.
     */
    async function ghostFetch(href) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12_000);

        try {
            const res = await origFetch(href, { signal: controller.signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();

            const match = html.match(/href=["'](https:\/\/get\.bunkr[a-z0-9.-]+\/file\/\d+)["']/i);
            if (match?.[1]) return match[1];

            throw new Error('Endpoint pattern not found in response DOM.');
        } finally {
            clearTimeout(timer);
        }
    }

    // ==========================================
    // MODULE 7: UNIFIED DIRECT ACQUISITION
    // ==========================================
    function injectCaptureVector() {
        const visited = getVisitedCache();

        // --- Context 1: Single Item View Exact ID Acquisition ---
        const scriptId = document.querySelector('script[data-file-id]')?.getAttribute('data-file-id');
        const mainNativeDl = document.querySelector('a.ic-download-01, a[href*="get.bunkrr.su/file/"]');

        let mainTargetUrl = null;
        if (mainNativeDl && mainNativeDl.href) {
            mainTargetUrl = mainNativeDl.href;
        } else if (scriptId && /^\d+$/.test(scriptId)) {
            mainTargetUrl = `https://get.bunkrr.su/file/${scriptId}`;
        }

        if (mainTargetUrl && !document.querySelector('.psi-main-dl-glyph')) {
            const mediaContainer = document.querySelector('.video-container, .lightgallery, img.w-full, video');
            if (mediaContainer) {
                const wrapper = mediaContainer.parentElement;

                const glyph = document.createElement('div');
                glyph.className = 'psi-dl-glyph psi-main-dl-glyph';
                glyph.innerHTML = downloadSvg;

                glyph.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[Ψ-4NDR0666] Direct acquisition bypass: ${mainTargetUrl}`);
                    window.open(mainTargetUrl, '_blank');
                };

                ensureRelative(wrapper);
                wrapper.appendChild(glyph);
            }
        }

        // --- Context 2: Grid View / Async Ghost Fetch Acquisition ---
        const items = document.querySelectorAll('.grid > div, .grid-images_box, .theItem');

        items.forEach(el => {
            if (el.querySelector('.psi-dl-glyph')) return;

            const link = el.querySelector('a[href^="/f/"], a[href^="/v/"], a[href*="/d/"]');
            if (!link) return;

            const alphaId = link.getAttribute('href').split('/').pop();

            if (visited.has(alphaId)) {
                el.classList.add('psi-visited');
            }

            link.addEventListener('mousedown', () => {
                addVisited(alphaId);
                el.classList.add('psi-visited');
            }, { passive: true });

            const glyph = document.createElement('div');
            glyph.className = 'psi-dl-glyph';
            glyph.innerHTML = downloadSvg;

            glyph.onmousedown = async (e) => {
                e.preventDefault();
                e.stopPropagation();

                addVisited(alphaId);
                el.classList.add('psi-visited');

                if (glyph.dataset.resolvedUrl) {
                    window.open(glyph.dataset.resolvedUrl, '_blank');
                    return;
                }

                glyph.style.color = 'var(--yellow)';
                glyph.style.borderColor = 'var(--yellow)';

                try {
                    console.log(`[Ψ-4NDR0666] Ghost Fetch engaging: ${link.href}`);

                    const finalUrl = await ghostFetch(link.href);
                    glyph.dataset.resolvedUrl = finalUrl;
                    console.log(`[Ψ-4NDR0666] Ghost Fetch resolved: ${finalUrl}`);

                    glyph.style.color = 'var(--cyan)';
                    glyph.style.borderColor = 'var(--cyan)';
                    window.open(finalUrl, '_blank');
                } catch (err) {
                    console.warn(`[Ψ-4NDR0666] Ghost Fetch failed. Routing to view page. Error:`, err);
                    glyph.style.color = 'var(--red)';
                    glyph.style.borderColor = 'var(--red)';
                    window.open(link.href, '_blank');
                }
            };

            ensureRelative(el);
            el.appendChild(glyph);
        });

        // --- Context 3: Direct Links Extraction for URL Overlay ---
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

    // ==========================================
    // MODULE 8: DIAGNOSTIC PROBE INTEGRATION
    // ==========================================
    function executeDiagnosticProbe() {
        const report = {
            timestamp:      new Date().toISOString(),
            url:            window.location.href,
            topology:       window.location.pathname.startsWith('/a/') ? 'GRID_VIEW' : 'SINGLE_ASSET_VIEW',
            scripts:        Array.from(document.querySelectorAll('script[data-file-id]')).map(s => s.outerHTML),
            nativeDls:      Array.from(document.querySelectorAll('a[download], a.ic-download-01, a[href*="get.bunk"], a.btn-main, #download-btn'))
                                 .map(a => ({ className: a.className, href: a.href, text: a.innerText.trim(), id: a.id })),
            gridItemsCount: document.querySelectorAll('.grid > div, .grid-images_box, .theItem').length,
            firstItemHTML:  document.querySelector('.grid > div, .grid-images_box, .theItem')?.outerHTML || 'None',
            interceptedCDN: Object.fromEntries(directMap),
        };

        const dump = JSON.stringify(report, null, 2);

        console.log('[Ψ-4NDR0666OS] Diagnostic Probe:\n', dump);

        const notify = (msg) => {
            const toast = Object.assign(document.createElement('div'), {
                textContent: msg,
                style: `
                    position:fixed; top:16px; right:16px; z-index:9999999;
                    background:rgba(10,15,26,0.97); color:#00E5FF;
                    border:1px solid #00E5FF; border-radius:6px;
                    padding:10px 16px; font:bold 11px monospace;
                    box-shadow:0 0 14px rgba(0,229,255,0.3);
                    pointer-events:none;
                `,
            });
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        };

        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(dump)
                .then(() => notify('📡 Probe complete — data copied to clipboard.'))
                .catch(() => notify('📡 Probe complete — see console (F12) for data.'));
        } else {
            legacyCopy(dump);
            notify('📡 Probe complete — data copied to clipboard.');
        }
    }

    GM_registerMenuCommand('📡 Execute Diagnostic Probe', executeDiagnosticProbe);

    // ==========================================
    // MODULE 9: AUTONOMOUS GATEWAY BYPASS
    // ==========================================
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
                console.log(`[Ψ-4NDR0666] Gateway breached. Auto-triggering: ${dlBtn.href}`);
                dlBtn.click();
            } else if (attempts >= MAX_ATTEMPTS) {
                clearInterval(engageInterval);
                console.warn('[Ψ-4NDR0666] Download button inactive after 15 s. Aborting gateway bypass.');
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(engageInterval), { once: true });
    }

    // ==========================================
    // MODULE 10: DEFENSIVE ORCHESTRATION
    // ==========================================
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

})();
