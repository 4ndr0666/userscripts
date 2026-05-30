// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.3.4
// @author       4ndr0666
// @description  Part of 4ndr0tools: Canonical routing, auto-sort, hide visited, bypass dl gateway
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Bunkr++.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// @include      /^[^:]*?://bunkr\.[^/]*?/.*?$/
// @include      /^[^:]*?://[^/]*?\.bunkr\.[^/]*?/.*?$/
// @include      /^[^:]*?://bunker\.[^/]*?/.*?$/
// @include      /^[^:]*?://[^/]*?\.bunker\.[^/]*?/.*?$/
// @include      /^[^:]*?://bunkrr\.[^/]*?/.*?$/
// @include      /^[^:]*?://[^/]*?\.bunkrr\.[^/]*?/.*?$/
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

    console.log('%c[4NDR0tools] Bunkr++ v5.3.4-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // =========================================================================
    // INTERNAL STATE & CONSTANTS
    // =========================================================================
    let _visitedCache  = null;
    let _visitedDirty  = false;
    let _visitedMode   = 'DIM';
    let _sortExecuted  = false;
    let _debounceTimer = null;

    const TARGET_DOMAIN = 'bunkr.cr';
    const VISITED_KEY   = 'psi_visited_assets';
    const MODE_KEY      = 'psi_visited_mode';
    const MODES         = ['DIM', 'HIDE', 'SHOW'];
    const MAX_VISITED   = 10_000;

    function ensureRelative(el) {
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    }

    function truncUrl(url, max = 70) {
        return url.length > max ? url.substring(0, max - 3) + '...' : url;
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

        header, .bg-mute, .live-indicator-container, #liveCount, footer, [data-cl-spot],
        iframe[src*="ads"], iframe[src*="pop"], .banner, .ad-container, .ad-box,
        .adsbygoogle, .popup-ad, .ad-wrap { display: none !important; }
    `);

    // =========================================================================
    // MODULE 3: NETWORK SNIFFING
    // =========================================================================
    const directMap = new Map();
    const origFetch = window.fetch;

    window.fetch = async function (...args) {
        const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        if (reqUrl.includes('/api/vs')) {
            try {
                const res = await origFetch.apply(this, args);
                const cloned = res.clone();
                cloned.json().then(data => {
                    if (data.url) {
                        if (data.encrypted) {
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
        } catch {}
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
        } catch {}
        return origXhrOpen.apply(this, [method, url, ...rest]);
    };

    // =========================================================================
    // MODULE 4: STATE-AWARE SORT HIJACK
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
            try { localStorage.setItem(VISITED_KEY, JSON.stringify([..._visitedCache])); }
            catch {}
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
    // MODULE 6: ACQUISITION UTILITIES
    // =========================================================================
    const downloadSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const streamSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const spinnerHtml = '<span style="font-size:8px;font-family:monospace;">...</span>';

    function legacyCopy(text, onDone) {
        const ta = Object.assign(document.createElement('textarea'), { value: text, style: 'position:fixed;opacity:0' });
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

        const fallback = () => { try { legacyCopy(text, onCopied); } catch { onFailed(); } };

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
        overlay.addEventListener('mouseleave', () => { autoRemoveTimer = setTimeout(() => overlay.remove(), 5_000); });

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

    async function ghostFetch(href, fname) {
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
            const dlAnchor = doc.querySelector('a[href*="get.bunkr"], a.ic-download-01, a[href*="/file/"]');
            if (dlAnchor?.href) return dlAnchor.href;

            if (directMap.has('last_media')) {
                console.log('[Ψ-4NDR0666] ghostFetch: falling back to last_media from directMap.');
                return directMap.get('last_media');
            }

            throw new Error('Download anchor not found in fetched DOM and no last_media cached.');
        } finally {
            clearTimeout(timer);
        }
    }

    // =========================================================================
    // MODULE 6.5: HARDENED STREAM URL RESOLVER
    // =========================================================================
    async function getBunkrStreamUrl(slug, contextElement = null) {
        // Tier 1: Intercepted M3U8
        if (directMap.has('m3u8_stream')) {
            console.log('[Ψ-4NDR0666] Tier 1: M3U8 hit.');
            return directMap.get('m3u8_stream');
        }

        // Tier 2: Native API clone
        if (directMap.has('native_api_resolved')) {
            console.log('[Ψ-4NDR0666] Tier 2: Native API clone hit.');
            return directMap.get('native_api_resolved');
        }

        // Tier 3: Live DOM video src
        const vid = document.querySelector('video source, video');
        if (vid?.src && !vid.src.startsWith('blob:')) {
            console.log('[Ψ-4NDR0666] Tier 3: Live DOM src hit.');
            return vid.src;
        }

        console.log('[Ψ-4NDR0666] Tier 4: Dynamic signing engine.');

        let mediaUuid = null;

        // 1. OpenGraph Metadata Analysis (Direct Context Validation)
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg?.content) {
            const match = ogImg.content.match(/\/thumbs\/([a-f0-9-]+)\./i) || ogImg.content.match(/\/([a-f0-9-]+)\.(mp4|jpg|png|webp)/i);
            if (match) {
                mediaUuid = match[1];
                console.log(`[Ψ-4NDR0666] Identity extracted via OpenGraph: ${mediaUuid}`);
            }
        }

        // 2. Live video element lookup (single asset page fallback context)
        if (!mediaUuid && vid?.src) {
            const match = vid.src.match(/\/storage\/media\/([a-f0-9-]+)\.mp4/);
            if (match) mediaUuid = match[1];
        }

        // 3. Environment Object Inspection (single asset metadata context)
        if (!mediaUuid && typeof window.videoCoverUrl !== 'undefined' && window.videoCoverUrl) {
            const match = window.videoCoverUrl.match(/\/thumbs\/([a-f0-9-]+)\.mp4/);
            if (match) mediaUuid = match[1];
        }
        if (!mediaUuid && typeof window.jsCDN !== 'undefined' && window.jsCDN) {
            const match = window.jsCDN.match(/\/storage\/media\/([a-f0-9-]+)\.mp4/);
            if (match) mediaUuid = match[1];
        }

        // 4. Context element thumbnail parsing (grid / related listings context)
        if (!mediaUuid && contextElement) {
            const imgs = contextElement.querySelectorAll('img, source, video');
            for (const img of imgs) {
                const targetSrc = img.src || img.getAttribute('data-src') || img.getAttribute('src');
                if (targetSrc) {
                    const match = targetSrc.match(/\/thumbs\/([a-f0-9-]+)\./i) || targetSrc.match(/\/([a-f0-9-]+)\.(mp4|jpg|png|webp)/i);
                    if (match) {
                        mediaUuid = match[1];
                        break;
                    }
                }
            }
        }

        // 5. Multi-grid context lookup scan (whole document element matching)
        if (!mediaUuid && slug) {
            const links = document.querySelectorAll(`a[href*="${slug}"]`);
            for (const link of links) {
                const container = link.closest('.theItem, .grid-images_box') || link.parentElement;
                if (container) {
                    const img = container.querySelector('img[src*="/thumbs/"]');
                    if (img?.src) {
                        const match = img.src.match(/\/thumbs\/([a-f0-9-]+)\./i);
                        if (match) {
                            mediaUuid = match[1];
                            break;
                        }
                    }
                }
            }
        }

        if (!mediaUuid) {
            console.warn(`[Ψ-4NDR0666] Extract failure for Media UUID belonging to identifier: ${slug}`);
            return null;
        }

        // Dynamic edge cryptographic hash calculation
        try {
            const encodedPath = encodeURIComponent(`/storage/media/${mediaUuid}.mp4`);
            const signRes = await origFetch(`https://glb-apisign.cdn.cr/sign?path=${encodedPath}`, {
                credentials: 'omit',
                headers: { 'Referer': window.location.href }
            });

            if (!signRes.ok) throw new Error(`Sign failed: ${signRes.status}`);

            const { token, ex } = await signRes.json();
            const signedUrl = `https://c4s9-b.cdn.cr/storage/media/${mediaUuid}.mp4?token=${token}&ex=${ex}`;

            console.log(`[Ψ-4NDR0666] Tier 4 Token Sign Complete → ${mediaUuid}`);
            return signedUrl;

        } catch (err) {
            console.warn('[Ψ-4NDR0666] Dynamic validation infrastructure aborted.', err);
            return null;
        }
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

    function injectCaptureVector() {
        const visited = getVisitedCache();

        const scriptId     = document.querySelector('script[data-file-id]')?.getAttribute('data-file-id');
        const mainNativeDl = document.querySelector('a.ic-download-01, a[href*="get.bunkrr.su/file/"]');

        let mainTargetUrl = null;
        if (mainNativeDl?.href) mainTargetUrl = mainNativeDl.href;
        else if (scriptId && /^\d+$/.test(scriptId)) mainTargetUrl = `https://get.bunkrr.su/file/${scriptId}`;

        const urlSlugMatch = window.location.pathname.match(/\/[vfd]\/([\w-]+)/);
        const pageSlug = (typeof window.jsSlug !== 'undefined' && window.jsSlug)
            ? window.jsSlug
            : (urlSlugMatch ? urlSlugMatch[1] : null);

        const mediaContainer = document.querySelector('.video-container, .lightgallery, img.w-full, video, #video-container');
        if (mediaContainer) {
            const wrapper = mediaContainer.parentElement;
            ensureRelative(wrapper);

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

            if (!el.querySelector('.psi-dl-glyph')) {
                const dlGlyph = document.createElement('div');
                dlGlyph.className = 'psi-dl-glyph';
                dlGlyph.innerHTML = downloadSvg;
                dlGlyph.title     = 'Ghost Fetch Direct Download';

                const activateDl = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return;
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
                        const reason = err.name === 'AbortError' ? 'Ghost Fetch timed out (12s).' : `Ghost Fetch failed: ${err.message}`;
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

            if (!el.querySelector('.psi-stream-glyph')) {
                const streamGlyph = document.createElement('div');
                streamGlyph.className = 'psi-stream-glyph';
                streamGlyph.innerHTML = streamSvg;
                streamGlyph.title     = 'Copy Stream URL';

                const activateStream = async (e) => {
                    if (e.type === 'mousedown' && e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();

                    addVisited(alphaId);
                    el.classList.add('psi-visited');

                    const savedHtml = streamGlyph.innerHTML;
                    streamGlyph.innerHTML         = spinnerHtml;
                    streamGlyph.style.color       = '#fff';
                    streamGlyph.style.borderColor = '';

                    const streamUrl = await getBunkrStreamUrl(alphaId, el);
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
    // MODULE 8: DIAGNOSTIC PROBE
    // =========================================================================
    function showToast(msg, durationMs = 4000) {
        const toast = document.createElement('div');
        Object.assign(toast.style, {
            position: 'fixed', top: '16px', right: '16px', zIndex: '9999999',
            background: 'rgba(10,15,26,0.97)', color: '#00E5FF',
            border: '1px solid #00E5FF', borderRadius: '6px',
            padding: '10px 16px', font: 'bold 11px monospace',
            boxShadow: '0 0 14px rgba(0,229,255,0.3)', pointerEvents: 'none',
            maxWidth: '420px'
        });
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), durationMs);
    }

    function executeDiagnosticProbe() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            topology: albumMatch ? 'GRID_VIEW' : 'SINGLE_ASSET_VIEW',
            scripts: Array.from(document.querySelectorAll('script[data-file-id]')).map(s => s.outerHTML),
            nativeDls: Array.from(document.querySelectorAll('a[download], a.ic-download-01, a[href*="get.bunk"], a.btn-main, #download-btn')).map(a => ({ className: a.className, href: a.href, text: a.innerText.trim(), id: a.id })),
            gridItemsCount: document.querySelectorAll('.grid > div, .grid-images_box, .theItem').length,
            firstItemHTML: document.querySelector('.grid > div, .grid-images_box, .theItem')?.outerHTML || 'None',
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
