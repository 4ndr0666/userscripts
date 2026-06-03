// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.6.16
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
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @connect      *
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';
    console.log('%c[4NDR0tools] Bunkr++ v5.6.16-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // =========================================================================
    // MODULE 0.1: SYNCHRONOUS ENVIRONMENT MOCKING (Sandbox Escape)
    // =========================================================================
    try {
        unsafeWindow.aclib = { 
            runAutoTag: function(){}, 
            runBanner: function(){}, 
            runPop: function(){}, 
            runVideo: function(){} 
        };
        unsafeWindow.kxysy = function(){};
        unsafeWindow.ggihyqfb = function(){};

        const origFetch = unsafeWindow.fetch;
        unsafeWindow.fetch = async function(...args) {
            try {
                const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                if (reqUrl.includes('/api/album/stats/') || reqUrl.includes('/api/file/stats/') || reqUrl.includes('s.bunkr.ru') || reqUrl.includes('/api/lv')) {
                    return new Response(JSON.stringify({ status: "success", viewCount: 0, downloadCount: 0, live: 1 }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            } catch(e) {}
            return origFetch.apply(this, args);
        };
        console.log('[Ψ-4NDR0666] Synchronous environment isolation deployed.');
    } catch(e) {
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
    const textKeywords = ['DisableDevtool', 'DevtoolsDetector', 'adblock', 'devtool', 'contextmenu', '_ads', 'kxysy', 'ggihyqfb'];
    const srcKeywords = ['disable-devtool', 'devtools-detector', 'detect2', 'on.js', 'bn.js'];

    function defuseScript(script) {
        const text = script.innerHTML || '';
        const src = script.src || '';
        if (textKeywords.some(w => text.includes(w)) || srcKeywords.some(w => src.includes(w))) {
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
    Element.prototype.appendChild = function() {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalAppendChild.apply(this, arguments);
    };

    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function() {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalInsertBefore.apply(this, arguments);
    };

    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT') defuseScript(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('script').forEach(defuseScript);
                }
            }
        }
    }).observe(document.documentElement, { childList: true, subtree: true });

    // =========================================================================
    // INTERNAL STATE & CONSTANTS
    // =========================================================================
    let _visitedCache  = null;
    let _visitedDirty  = false;
    let _visitedMode   = 'DIM';
    let _sortExecuted  = false;
    let _debounceTimer = null;
    
    let albumGalleryCache = new Map();
    let albumGalleryFetched = false;

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
    // MODULE 2: SYSTEM STYLING & SURGICAL PURGE
    // =========================================================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --yellow: #FFD700; --red: #FF0055; }

        .psi-dl-glyph {
            position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px;
            background: rgba(10, 19, 26, 0.9); border: 1px solid var(--cyan); border-radius: 8px;
            display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 9999;
            color: var(--cyan); transition: all 0.2s ease; -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px); text-decoration: none !important;
        }
        .psi-dl-glyph:hover { background: var(--cyan); color: #000; box-shadow: 0 0 15px var(--cyan); transform: scale(1.05); }
        .psi-dl-glyph:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
        .psi-dl-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; }

        .psi-stream-glyph {
            position: absolute; bottom: 8px; right: 48px; width: 32px; height: 32px;
            background: rgba(10, 19, 26, 0.9); border: 1px solid var(--cyan); border-radius: 8px;
            display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 9999;
            color: var(--cyan); transition: all 0.2s ease; -webkit-backdrop-filter: blur(4px);
            backdrop-filter: blur(4px); text-decoration: none !important;
        }
        .psi-stream-glyph:hover { background: var(--cyan); color: #000; box-shadow: 0 0 15px var(--cyan); transform: scale(1.05); }
        .psi-stream-glyph:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; }
        .psi-stream-glyph svg { width: 18px; height: 18px; stroke-width: 2.5; pointer-events: none; fill: currentColor; }

        .psi-main-dl-glyph { top: 42px !important; bottom: auto !important; right: 8px !important; z-index: 99999 !important; }
        .psi-main-stream-glyph { top: 42px !important; bottom: auto !important; right: 48px !important; z-index: 99999 !important; }

        #psi-visited-toggle {
            position: fixed; bottom: 8px; left: 8px; z-index: 999999; background: rgba(10, 15, 26, 0.95); color: var(--cyan);
            border: 1px solid var(--cyan); border-radius: 4px; padding: 6px 12px; font: bold 11px monospace; cursor: pointer;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2); user-select: none; transition: all 0.2s;
        }
        #psi-visited-toggle:hover { background: var(--cyan); color: #000; }

        body[data-psi-visited-mode="DIM"] .psi-visited { opacity: 0.3 !important; filter: grayscale(100%); transition: opacity 0.3s, filter 0.3s; }
        body[data-psi-visited-mode="DIM"] .psi-visited:hover { opacity: 0.9 !important; filter: none; }
        body[data-psi-visited-mode="HIDE"] .psi-visited { display: none !important; }

        header, .bg-mute, .live-indicator-container, #liveCount, footer, [data-cl-spot],
        iframe[src*="ads"], iframe[src*="pop"], .banner, .ad-container, .ad-box,
        .adsbygoogle, .popup-ad, .ad-wrap { display: none !important; }

        .truncate.theName { white-space: normal !important; overflow: visible !important; text-overflow: unset !important; }

        @keyframes psi-slide-in { from { opacity: 0; transform: translateX(40px) scale(0.96); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes psi-fade-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: translateX(20px) scale(0.94); } }
        .psi-toast {
            position: fixed; top: 16px; right: 16px; z-index: 9999999;
            background: linear-gradient(135deg, rgba(0, 229, 255, 0.07) 0%, rgba(10, 15, 26, 0.82) 40%, rgba(0, 20, 30, 0.92) 100%);
            border: 1px solid rgba(0, 229, 255, 0.55); border-top-color: rgba(0, 229, 255, 0.9); border-radius: 10px;
            padding: 10px 16px; font: bold 11px/1.4 monospace; color: var(--cyan);
            box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.08) inset, 0 0 18px rgba(0, 229, 255, 0.22), 0 4px 24px rgba(0, 0, 0, 0.55);
            -webkit-backdrop-filter: blur(14px) saturate(160%); backdrop-filter: blur(14px) saturate(160%);
            pointer-events: none; max-width: 420px; animation: psi-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .psi-toast--dying { animation: psi-fade-out 0.38s ease forwards; }

        .psi-toast--glyph {
            display: flex; align-items: center; gap: 10px; padding: 8px 14px 8px 10px;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.09) 0%, rgba(10, 15, 26, 0.82) 40%, rgba(15, 12, 0, 0.92) 100%);
            border-color: rgba(255, 215, 0, 0.55); border-top-color: rgba(255, 215, 0, 0.9);
            box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.08) inset, 0 0 18px rgba(255, 215, 0, 0.2), 0 4px 24px rgba(0, 0, 0, 0.55);
        }
        .psi-toast-icon { flex-shrink: 0; width: 36px; height: 36px; color: var(--cyan); filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.6)); }
        .psi-toast-label { color: var(--cyan); font: bold 11px/1.4 monospace; letter-spacing: 0.05em; text-shadow: 0 0 8px rgba(255, 215, 0, 0.4); }
    `);

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
            const hasPagination = document.querySelector('.pagination, [aria-label="Pagination"], nav.pagination');
            if (!hasPagination) { clearInterval(avInterval); return; }

            let advBtn = document.querySelector('body > main > div.album-toolbar > div > a');
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
            const [oldest] = cache;
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

        const a = document.createElement('a');
        a.href = url;
        a.download = fname;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`💾 ${cache.size} assets exported → ${fname}`);
    }

    // =========================================================================
    // MODULE 6: ACQUISITION UTILITIES & LINK SCRAPER
    // =========================================================================
    const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const streamSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const spinnerHtml = '<span style="font-size:8px;font-family:monospace;">...</span>';

    function isCdnUrl(url) {
        if (!url || typeof url !== 'string') return false;
        return /(cdn\.cr|bunkr|bunkrr|scdn\.st|media-)/i.test(url) && /\.(mp4|webm|mkv|mov|avi|zip|rar|7z|jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
    }

    function nativeDownload(url, hint) {
        const name = hint || url.split('/').pop().split('?')[0].split('#')[0] || 'bunkr_download';
        console.log(`[Ψ-4NDR0666] Initiating native download: ${name}`);
        showToast(`⦒ █▓░ Download initiated: ${name}`, 3000, true);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 1000);
    }

    function robustCopy(text, overlay) {
        const isGlyph     = overlay && (overlay.classList.contains('psi-dl-glyph') || overlay.classList.contains('psi-stream-glyph'));
        const origContent = isGlyph ? overlay.innerHTML : '';
        const origColor   = isGlyph ? overlay.style.color : '';
        const origBorder  = isGlyph ? overlay.style.borderColor : '';
        
        const onCopied    = () => {
            if (isGlyph) overlay.innerHTML = '<span style="font-size:14px;font-family:monospace;font-weight:bold;">✓</span>';
            if (isGlyph) {
                overlay.style.color       = 'var(--cyan)';
                overlay.style.borderColor = 'var(--cyan)';
                setTimeout(() => {
                    overlay.innerHTML = origContent;
                    overlay.style.color       = origColor;
                    overlay.style.borderColor = origBorder;
                }, 1400);
            }
        };
        const onFailed = () => {
            if (isGlyph) overlay.innerHTML = '<span style="font-size:14px;font-family:monospace;font-weight:bold;">X</span>';
            if (isGlyph) {
                overlay.style.color       = 'var(--red)';
                overlay.style.borderColor = 'var(--red)';
                setTimeout(() => {
                    overlay.innerHTML = origContent;
                    overlay.style.color       = origColor;
                    overlay.style.borderColor = origBorder;
                }, 2200);
            }
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
    async function prefetchAlbumGallery() {
        if (albumGalleryFetched || !albumMatch) return;
        albumGalleryFetched = true;
        const albumSlug = albumMatch[1];
        
        try {
            console.log(`[Ψ-4NDR0666] Prefetching album gallery API for slug: ${albumSlug}`);
            const response = await fetch("/api/album/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: albumSlug })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    data.data.forEach(item => {
                        if (item.id && item.image_url) {
                            albumGalleryCache.set(String(item.id), item.image_url);
                        }
                    });
                    console.log(`[Ψ-4NDR0666] Preloaded ${albumGalleryCache.size} direct CDN links from gallery API.`);
                }
            }
        } catch (e) {
            console.warn('[Ψ-4NDR0666] Album gallery prefetch failed.', e);
        }
    }

    async function resolveDomStreamUrl(targetUrl) {
        if (!targetUrl) return null;
        if (isCdnUrl(targetUrl)) return targetUrl;

        let gatewayUrl = null;
        let initialReferer = targetUrl;

        if (targetUrl.includes('get.bunk') || targetUrl.includes('/file/')) {
            gatewayUrl = targetUrl;
        } else {
            try {
                const res = await new Promise((resolve) => {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: targetUrl,
                        headers: { 'Referer': targetUrl, 'Accept': 'text/html' },
                        timeout: 8000,
                        onload: resolve,
                        onerror: () => resolve({ status: 500 }),
                        ontimeout: () => resolve({ status: 408 })
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

                    const cdnAnchor = doc.querySelector('a[href*="cdn.cr"][href$=".mp4"], a[href*="cdn.cr"][href$=".zip"]');
                    if (cdnAnchor && isCdnUrl(cdnAnchor.href)) return cdnAnchor.href;

                    const gw = doc.querySelector('a[href*="get.bunkr"], a.ic-download-01, a[href*="/file/"]');
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
                method: 'GET',
                url: gatewayUrl,
                headers: {
                    'Referer': initialReferer,
                    'Accept': 'text/html,application/xhtml+xml',
                },
                timeout: 8000,
                onload: (resp) => {
                    if (resp.status < 200 || resp.status >= 300) return resolve(null);
                    const doc = new DOMParser().parseFromString(resp.responseText, 'text/html');
                    const dlAnchor = doc.querySelector('#download-btn[href], a[href*="cdn"][href$=".mp4"], a[href*="cdn"][href$=".zip"], a.ic-download-01[href]');
                    if (dlAnchor) {
                        const finalCdnUrl = new URL(dlAnchor.getAttribute('href'), gatewayUrl).href;
                        console.log(`[Ψ-4NDR0666] Direct CDN resolved: ${finalCdnUrl}`);
                        return resolve(finalCdnUrl);
                    }
                    resolve(null);
                },
                onerror: () => resolve(null),
                ontimeout: () => resolve(null)
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
        glyph.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activateFn(e); } };
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
        const pageSlug     = (typeof window.jsSlug !== 'undefined' && window.jsSlug) ? window.jsSlug : (urlSlugMatch ? urlSlugMatch[1] : null);

        // ── Context 1: Single-Asset View ─────────────────────────────────────
        const mediaContainer = document.querySelector('.video-container, .lightgallery, img.w-full, video, #video-container');
        if (mediaContainer) {
            const wrapper = mediaContainer.parentElement;
            ensureRelative(wrapper);

            if (!document.querySelector('.psi-main-dl-glyph')) {
                const dlGlyph     = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph psi-main-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Direct Download';
                const activateDl  = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dlGlyph.innerHTML = spinnerHtml;

                    const vidEl = document.querySelector('video');
                    if (vidEl && vidEl.currentSrc && !vidEl.currentSrc.startsWith('blob:') && isCdnUrl(vidEl.currentSrc)) {
                        dlGlyph.innerHTML = downloadSvg;
                        nativeDownload(vidEl.currentSrc);
                        return;
                    }

                    const gatewayAnchor = document.querySelector(NATIVE_DL_SEL);
                    let targetUrl = gatewayAnchor?.href && gatewayAnchor.href !== window.location.href ? gatewayAnchor.href : window.location.href;

                    const cdnUrl = await resolveDomStreamUrl(targetUrl);
                    
                    if (cdnUrl) {
                        dlGlyph.innerHTML = downloadSvg;
                        nativeDownload(cdnUrl);
                    } else {
                        dlGlyph.innerHTML = downloadSvg;
                        showToast('Download failed. No gateway or stream link found.', 3000);
                        if (targetUrl !== window.location.href) window.open(targetUrl, '_blank');
                    }
                };
                dlGlyph.onclick = activateDl;
                makeAccessible(dlGlyph, 'Download file', activateDl);
                wrapper.appendChild(dlGlyph);
            }

            if (!document.querySelector('.psi-main-stream-glyph')) {
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
                    
                    const vidEl = document.querySelector('video');
                    let streamUrl = (vidEl && vidEl.currentSrc && !vidEl.currentSrc.startsWith('blob:') && isCdnUrl(vidEl.currentSrc)) ? vidEl.currentSrc : null;

                    if (!streamUrl) {
                        const gatewayAnchor = document.querySelector(NATIVE_DL_SEL);
                        let targetUrl = gatewayAnchor?.href && gatewayAnchor.href !== window.location.href ? gatewayAnchor.href : window.location.href;
                        streamUrl = await resolveDomStreamUrl(targetUrl);
                    }

                    streamGlyph.innerHTML = savedHtml;
                    if (streamUrl) {
                        robustCopy(streamUrl, streamGlyph);
                        if (streamUrl.includes('token=') && streamUrl.includes('ex=')) showToast('⦒ █▓░URL copied for IP streaming.', 6000, true);
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

        // ── Context 2: Grid View State Tracking ONLY (Glyphs Purged) ─────────
        const items = document.querySelectorAll('.grid > div, .grid-images_box, .theItem, main.grid > div, main[class*="grid"] > div');
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
            
            // Retain forensic mousedown tracking
            link.addEventListener('mousedown', () => {
                addVisited(alphaId);
                el.classList.add('psi-visited');
            }, { passive: true });
        });
    }

    // =========================================================================
    // MODULE 8: DIAGNOSTIC PROBE INTEGRATION
    // =========================================================================
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
            nativeDls:      Array.from(document.querySelectorAll('a[download], a.ic-download-01, a[href*="get.bunk"], a.btn-main, #download-btn')).map(a => ({ className: a.className, href: a.href, text: a.innerText.trim(), id: a.id })),
            gridItemsCount: document.querySelectorAll('.grid > div, .grid-images_box, .theItem').length,
            apiCacheCount:  albumGalleryCache.size,
            envGlobals: {
                jsSlug:        typeof window.jsSlug !== 'undefined'        ? window.jsSlug        : 'undefined',
                jsCDN:         typeof window.jsCDN !== 'undefined'         ? window.jsCDN         : 'undefined',
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
        const isGateway = /get\.bunkr/i.test(window.location.hostname) && window.location.pathname.includes('/file/');
        if (!isGateway) return;

        console.log('[Ψ-4NDR0666] Gateway page detected. Hunting #download-btn...');
        let attempts = 0;
        const MAX_ATTEMPTS = 30;
        const engageInterval = setInterval(() => {
            attempts++;
            const dlBtn = document.getElementById('download-btn') || document.querySelector('a.ic-download-01');
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
    // MODULE 10: DEFENSIVE ORCHESTRATION
    // =========================================================================
    function bootstrap() {
        if (!document.body) { setTimeout(bootstrap, 50); return; }
        console.log('[Ψ-4NDR0666] Intelligence baseline established. Injecting payloads.');

        // Initialize Native API preloading immediately for 0-latency grid downloads
        prefetchAlbumGallery();
        
        initVisitedTracker();
        forceLargestFirst();
        autoEngageDownloadEndpoint();
        setTimeout(injectCaptureVector, 800);

        const observer = new MutationObserver((mutations) => {
            const structural = mutations.some(m => m.addedNodes.length > 0);
            if (!structural) return;
            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(() => {
                injectCaptureVector();
            }, 400);
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
                    injectCaptureVector();
                }
            }, 600);
        };
        window.addEventListener('popstate', onSpaNav);
        window.addEventListener('hashchange', onSpaNav);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
