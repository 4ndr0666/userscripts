// ==UserScript==
// @name         4ndr0tools - Stream Interceptor
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.2.0
// @description  Intercepts, parses, and extracts stream tokens, manifests, and direct video sources via network hooks and DOM inspection. Suite promotion of the v3.1 BETA: ShadowDOM piercing, context-safe Reflect hooks, ReDoS-proof regex, 3lectric-Glass card surface, universal URL registry cap.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Stream%20Interceptor.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Stream%20Interceptor.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @connect      playmogo.com
// @connect      vidara.to
// @connect      viderea.cloud
// @connect      doodcdn.com
// @connect      doodcdn.io
// @connect      dood.to
// @connect      dood.wf
// @connect      dood.la
// @connect      doodstream.com
// @connect      *
// ==/UserScript==

(function () {
    'use strict';

    /* ═══ v3.2.0 — SUITE PROMOTION (4ndr0tools, suite v1.3.0) ══════════════
     * The operator's Stream Interceptor BETA v3.1.0, promoted into the
     * 4ndr0tools suite (BETA suffix stripped per promotion convention):
     *   P1  Suite metadata + update channel (raw dist/ URLs, Ψ glyph icon).
     *   P2  UI refactored to the 3lectric-Glass spec — the BETA cards ran an
     *       off-spec palette (rgba(10,15,26) base, #ff003c destructive,
     *       #15FFFF cyan, Courier New, 300ms transitions). Now: RGB(10,19,26)
     *       glass base, #00E5FF primary / #67E8F9 hover / #ff0055 destructive,
     *       JetBrains Mono data + Orbitron label typography, 150ms
     *       ease-in-out transitions, 0px-radius brutalist buttons, toast
     *       left-rail accent, Ψ-Orbitron card label.
     *   P3  Review hardening: the discovered-URL registry is now bounded
     *       (1000 entries — a long session on a busy page previously grew it
     *       without limit), console chrome follows the suite color matrix,
     *       menu labels carry the Ψ prefix.
     * Every v3.1 behavior — ShadowDOM-piercing scans, context-safe Reflect
     * hooks on both page and sandbox windows, the ReDoS-lazy extraction
     * regex, pass_md5 token capture, malformed-SVG sanitization, fetch/XHR
     * body deep-inspection with unicode/percent decoding, the tracker-stub
     * (_wv) suppressor, and the observer discipline — is preserved verbatim.
     * ═══════════════════════════════════════════════════════════════════ */

    /* =========================================================================
       1. CORE CONFIGURATION & STATE
       ========================================================================= */
    const CONFIG = {
        DEBUG_MODE: true,
        ENABLE_OBSERVER: true,
        AUTO_DOWNLOAD: false,
        OBSERVER_DEBOUNCE_MS: 800,
        UI_TIMEOUT_MS: 15000,
        MAX_UI_CARDS: 10,
        MAX_INSPECT_PAYLOAD_SIZE: 500000,
        MAX_REDIRECT_DEPTH: 2,
        MAX_FOUND_URLS: 1000,   // v3.2: bounded registry (GUP B.1)
        TARGET_DOMAINS: [
            'playmogo.com', 'vidara.to', 'doodcdn.io', 'dood.',
            'doodcdn.com', 'dood.to', 'dood.wf', 'dood.la', 'doodstream.',
			'viderea.cloud'
        ],
        // Lazy quantifier [*?] implemented to prevent ReDoS on massive payload chunks
        EXTRACTION_REGEX: /(https?:\\?\/\\?\/[^\s"'<>]*?(?:playmogo\.com|viderea\.cloud|vidara\.to|\.mp4|\.m3u8|\.ts|\\?\/pass_md5\\?\/)[^\s"'<>]*)/gi
    };

    const foundUrls = new Set();

    const log = {
        info: (msg) => { if (CONFIG.DEBUG_MODE) console.log(`%c[INFO] ${msg}`, 'color:#00E5FF;'); },
        warn: (msg) => { if (CONFIG.DEBUG_MODE) console.warn(`%c[WARN] ${msg}`, 'color:#ffaa00;'); },
        error: (msg, err = '') => console.error(`%c[CRITICAL] ${msg}`, 'color:#ff0055; font-weight:bold;', err),
        success: (msg) => console.log(`%c[SUCCESS] ${msg}`, 'color:#67E8F9; font-weight:bold;')
    };

    /* =========================================================================
       2. CONTEXT & SANITIZATION (Runs immediately)
       ========================================================================= */
    const pageWindow = (() => {
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow === 'object') {
                return unsafeWindow;
            }
        } catch (e) {
            log.warn('unsafeWindow scope boundary restricted. Falling back to local window.');
        }
        return window;
    })();

    const isSandboxed = (pageWindow !== window);

    (function injectTrackerStub() {
        const targets = isSandboxed ? [pageWindow, window] : [window];
        for (const win of targets) {
            try {
                if (typeof win._wv === 'undefined') {
                    win._wv = {};
                    log.info('Suppressed blocked tracker fault (_wv proxy injected).');
                }
            } catch (e) {
                log.warn('Tracker stub injection bypassed: ' + e.message);
            }
        }
    })();

    const ALLOWED_SCHEMES = ['http:', 'https:', 'blob:'];
    const MEDIA_SIGNATURE_RE = /\.(mp4|m3u8|ts|m4s|webm|mkv|mov|flv|mpd)(?=$|[\s?&#/=])/i;

    /* =========================================================================
       3. URL RESOLUTION & NORMALIZATION
       ========================================================================= */
    function decodeUrlEscapes(raw) {
        if (raw == null) return raw;
        let s = String(raw);
        try {
            if (s.indexOf('\\u') !== -1) {
                s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
            }
            if (s.indexOf('\\/') !== -1) {
                s = s.replace(/\\\//g, '/');
            }
        } catch (e) {
            log.warn('URL escape sequence decoding failed.', e);
        }
        if (s.indexOf('&') !== -1) {
            s = s.replace(/&amp;/g, '&').replace(/&#0?38;/g, '&').replace(/&#x0?26;/gi, '&');
        }
        return s;
    }

    function resolveUrl(rawUrl) {
        if (rawUrl == null) return null;
        if (typeof rawUrl !== 'string') {
            try { rawUrl = String(rawUrl); } catch (e) { return null; }
        }
        let cleaned = decodeUrlEscapes(rawUrl.trim());
        if (!cleaned) return null;
        cleaned = cleaned.replace(/[\s)\]}"',.;:+]+$/, '').trim();
        if (!cleaned) return null;
        try {
            const parsed = new URL(cleaned, location.origin);
            if (ALLOWED_SCHEMES.indexOf(parsed.protocol) === -1) return null;
            return parsed.href;
        } catch (e) {
            return null;
        }
    }

    function inspectUrl(rawUrl) {
        const resolved = resolveUrl(rawUrl);
        if (resolved) return resolved;
        if (typeof rawUrl === 'string' && rawUrl.trim()) return rawUrl.trim();
        return null;
    }

    function isTargetMatch(url) {
        if (!url) return false;
        const lower = String(url).toLowerCase();
        const hasDomain = CONFIG.TARGET_DOMAINS.some((domain) => lower.includes(domain));
        if (hasDomain) return true;
        return MEDIA_SIGNATURE_RE.test(lower) || lower.includes('/pass_md5/');
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function extractEmbeddedUrls(url) {
        const results = [];
        try {
            const u = new URL(url);
            u.searchParams.forEach((value) => {
                if (!value) return;
                let candidate = value;
                if (/%2F/i.test(candidate) || /%3A/i.test(candidate) || /%25/.test(candidate)) {
                    try { candidate = decodeURIComponent(candidate); } catch (e) { /* keep raw */ }
                }
                candidate = decodeUrlEscapes(candidate);
                const resolved = resolveUrl(candidate);
                if (resolved) results.push(resolved);
            });
        } catch (e) {
            // URL parse failure on embedded params, safe to bypass
        }
        return results;
    }

    /* =========================================================================
       4. UI, CLIPBOARD, & FILE ABSTRACTIONS
       ========================================================================= */
    function legacyCopy(text) {
        try {
            const host = document.body || document.documentElement;
            if (!host) return false;
            const ta = document.createElement('textarea');
            ta.value = text;
            Object.assign(ta.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                opacity: '0',
                pointerEvents: 'none'
            });
            host.appendChild(ta);
            ta.focus();
            ta.select();
            const successful = typeof document.execCommand === 'function' && document.execCommand('copy');
            if (ta.parentNode) ta.parentNode.removeChild(ta);
            if (successful) {
                log.success('Data transaction written via fallback copy layout.');
                return true;
            }
            log.error('Fallback layout replication context returned negative execution verification.');
            return false;
        } catch (fallbackErr) {
            log.error('Critical operational fault during legacy selection copy sequence.', fallbackErr);
            return false;
        }
    }

    async function writeClipboard(text) {
        if (typeof GM_setClipboard === 'function') {
            try {
                GM_setClipboard(text);
                log.success('Copied to clipboard via GM_setClipboard.');
                return true;
            } catch (e) { /* fall through to page APIs */ }
        }
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                log.success('Copied to clipboard via Clipboard API.');
                return true;
            }
        } catch (e) { /* fall through to legacy path */ }
        log.warn('Primary Clipboard API blocked or sandboxed. Using legacy element selection abstraction.');
        return legacyCopy(text);
    }

    function copyToClipboard(text, btn) {
        const originalText = btn.textContent;
        const resetBtn = () => { setTimeout(() => { btn.textContent = originalText; }, 1500); };
        writeClipboard(text).then((ok) => {
            if (ok) {
                btn.textContent = 'COPIED ✓';
            } else {
                btn.textContent = 'FAILED ✗';
                log.error('Clipboard write rejected by all available copy strategies.');
            }
            resetBtn();
        });
    }

    function buildSafeFilename(url) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = `asset_${timestamp}.mp4`;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1] || '';
            if (lastPart && lastPart.includes('.')) {
                filename = lastPart;
            }
        } catch (e) {
            log.warn('Standard filename parsing aborted. Utilizing automatic structural fallback nomenclature.');
        }
        filename = filename
            .replace(/[\u0000-\u001f\u007f]/g, '')
            .replace(/\.{2,}/g, '.')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/^\.+/, '')
            .slice(0, 150);
        return filename || `asset_${timestamp}.mp4`;
    }

    function executeAutoDownload(url) {
        const filename = buildSafeFilename(url);
        log.info(`Initiating automated stream retrieval for: ${filename}`);

        if (typeof GM_download === 'function') {
            GM_download({
                url: url,
                name: filename,
                saveAs: false,
                onload: () => log.success(`Asset structurally verified and secured: ${filename}`),
                onerror: (err) => log.error(`Download pipeline execution halted: ${err.details || err.error || 'Unknown error'}`)
            });
        } else {
            const host = document.body || document.documentElement;
            if (!host) {
                log.error('No DOM host available for fallback anchor retrieval.');
                return;
            }
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            host.appendChild(a);
            a.click();
            if (a.parentNode) a.parentNode.removeChild(a);
            log.success(`Triggered fallback anchor retrieval: ${filename}`);
        }
    }

    function getOrCreateToastContainer() {
        let container = document.getElementById('psi-interceptor-toasts');
        if (!container) {
            const mountPoint = document.body || document.documentElement;
            if (!mountPoint) return null;
            container = document.createElement('div');
            container.id = 'psi-interceptor-toasts';
            container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 2147483647;
                pointer-events: none;
                max-width: 460px;
                width: calc(100vw - 20px);
                font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
            `;
            mountPoint.appendChild(container);
        }
        return container;
    }

    function enforceCardLimit(container) {
        const max = Math.max(1, CONFIG.MAX_UI_CARDS);
        while (container.children && container.children.length > max) {
            const oldest = container.firstElementChild || container.children[0];
            if (!oldest || !oldest.parentNode) break;
            oldest.parentNode.removeChild(oldest);
        }
    }

    function mountAssetCard(url) {
        const mount = () => {
            const host = document.body || document.documentElement;
            if (!host) {
                window.addEventListener('DOMContentLoaded', mount, { once: true });
                return;
            }

            const container = getOrCreateToastContainer();
            if (!container) return;

            const card = document.createElement('div');
            /* 3lectric-Glass toast card (spec §4.2 window / §5.0 notification):
             * RGB(10,19,26) glass base, cyan containment border + left rail,
             * 4px panel geometry, 150ms ease-in-out transitions. */
            card.style.cssText = `
                position: relative;
                background: rgba(10, 19, 26, 0.96);
                border: 1px solid rgba(0, 229, 255, 0.4);
                border-left: 3px solid #00E5FF;
                border-radius: 4px;
                padding: 10px 12px;
                font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
                font-size: 12px;
                color: #e0ffff;
                box-shadow: 0 4px 20px rgba(0, 229, 255, 0.25);
                word-break: break-all;
                backdrop-filter: blur(8px) saturate(130%);
                pointer-events: auto;
                opacity: 1;
                transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
            `;

            const title = document.createElement('div');
            title.textContent = 'Ψ STREAM INTERCEPTOR — ASSET DETECTED';
            title.style.cssText = 'font-family:"Orbitron","JetBrains Mono",sans-serif; color:#67E8F9; font-weight:700; font-size:9px; margin-bottom:4px; letter-spacing:2px;';

            const link = document.createElement('a');
            link.href = url;
            link.textContent = url.length > 70 ? url.substring(0, 67) + '...' : url;
            link.style.cssText = 'color:#00E5FF; text-decoration:none; display:block; margin-bottom:8px; font-size:11px;';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const actionRow = document.createElement('div');
            actionRow.style.cssText = 'display:flex; justify-content:flex-end; gap:8px;';

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'COPY URL';
            copyBtn.style.cssText = 'background:#00E5FF; color:#0A131A; border:1px solid #00E5FF; padding:4px 10px; border-radius:0; cursor:pointer; font-weight:bold; font-size:11px; text-transform:uppercase; transition:all 150ms ease-in-out;';
            copyBtn.onmouseover = () => { copyBtn.style.background = '#67E8F9'; copyBtn.style.boxShadow = '0 0 20px rgba(0,229,255,0.5)'; };
            copyBtn.onmouseout = () => { copyBtn.style.background = '#00E5FF'; copyBtn.style.boxShadow = 'none'; };
            copyBtn.onclick = () => copyToClipboard(url, copyBtn);

            const dlBtn = document.createElement('button');
            dlBtn.textContent = 'FORCE DL';
            dlBtn.style.cssText = 'background:rgba(10,19,26,0.65); color:#ff0055; border:1px solid #ff0055; padding:4px 10px; border-radius:0; cursor:pointer; font-weight:bold; font-size:11px; text-transform:uppercase; transition:all 150ms ease-in-out;';
            dlBtn.onmouseover = () => { dlBtn.style.background = 'rgba(255,0,85,0.3)'; dlBtn.style.color = '#ffffff'; dlBtn.style.boxShadow = '0 0 25px #ff0055'; };
            dlBtn.onmouseout = () => { dlBtn.style.background = 'rgba(10,19,26,0.65)'; dlBtn.style.color = '#ff0055'; dlBtn.style.boxShadow = 'none'; };
            dlBtn.onclick = () => { executeAutoDownload(url); dlBtn.textContent = 'INITIATED'; };

            actionRow.append(copyBtn, dlBtn);
            card.append(title, link, actionRow);

            const closeBtn = document.createElement('div');
            closeBtn.textContent = '×';
            closeBtn.title = 'Dismiss';
            closeBtn.style.cssText = 'position:absolute; top:5px; right:8px; color:rgba(0,229,255,0.5); cursor:pointer; font-size:14px; line-height:1; user-select:none; transition:color 150ms ease-in-out;';
            closeBtn.onmouseover = () => { closeBtn.style.color = '#ffffff'; };
            closeBtn.onmouseout = () => { closeBtn.style.color = 'rgba(0,229,255,0.5)'; };
            card.appendChild(closeBtn);

            const dismissCard = () => {
                clearTimeout(dismissTimer);
                card.style.opacity = '0';
                card.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (card.parentNode) card.parentNode.removeChild(card);
                }, 150);
            };
            const dismissTimer = setTimeout(dismissCard, CONFIG.UI_TIMEOUT_MS);
            closeBtn.onclick = dismissCard;

            container.appendChild(card);
            enforceCardLimit(container);
        };
        mount();
    }

    /* =========================================================================
       5. ASSET PIPELINE & DEEP INSPECTION
       ========================================================================= */
    function processDiscoveredAsset(rawUrl, depth) {
        if (typeof depth !== 'number') depth = 0;

        const url = resolveUrl(rawUrl);
        if (!url || foundUrls.has(url)) return;

        foundUrls.add(url);
        // v3.2: bound the registry — unbounded growth on long sessions.
        if (foundUrls.size > CONFIG.MAX_FOUND_URLS) {
            const it = foundUrls.values();
            const drop = it.next().value;
            foundUrls.delete(drop);
        }
        log.success(`Target Asset Profile Registered: ${url.substring(0, 70)}...`);

        if (depth < CONFIG.MAX_REDIRECT_DEPTH) {
            const embedded = extractEmbeddedUrls(url);
            for (let i = 0; i < embedded.length; i++) {
                const innerUrl = embedded[i];
                if (!foundUrls.has(innerUrl) && isTargetMatch(innerUrl)) {
                    processDiscoveredAsset(innerUrl, depth + 1);
                }
            }
        }

        if (CONFIG.AUTO_DOWNLOAD) {
            executeAutoDownload(url);
            return;
        }
        mountAssetCard(url);
    }

    function scanPayloadForUrls(text) {
        const RE = CONFIG.EXTRACTION_REGEX;
        RE.lastIndex = 0;
        try {
            let match;
            while ((match = RE.exec(text)) !== null) {
                const extractedUrl = inspectUrl(match[1]);
                if (isTargetMatch(extractedUrl)) {
                    log.info('Regex structural signature matched in network payload text.');
                    processDiscoveredAsset(extractedUrl);
                }
            }
        } finally {
            RE.lastIndex = 0;
        }
    }

    function decodeUnicodeEscapes(text) {
        if (typeof text !== 'string' || text.indexOf('\\u') === -1) return null;
        try {
            const decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
            return (decoded !== text) ? decoded : null;
        } catch (e) {
            return null;
        }
    }

    function deepTextInspect(textPayload) {
        if (typeof textPayload !== 'string' || !textPayload) return;
        if (textPayload.length > CONFIG.MAX_INSPECT_PAYLOAD_SIZE) return;

        scanPayloadForUrls(textPayload);

        const unicodeDecoded = decodeUnicodeEscapes(textPayload);
        if (unicodeDecoded) {
            scanPayloadForUrls(unicodeDecoded);
        }

        if (/%(?:2F|3A)/i.test(textPayload)) {
            try {
                const decoded = decodeURIComponent(textPayload);
                if (decoded && decoded !== textPayload) {
                    scanPayloadForUrls(decoded);
                }
            } catch (e) {
                // Malformed percent sequences safely ignored; raw scan already completed
            }
        }
    }

    /* =========================================================================
       6. DOM TRAVERSAL (Shadow DOM Piercing Included)
       ========================================================================= */
    function pierceShadowDOM(rootNode, elements = []) {
        if (!rootNode) return elements;

        // Push matches from current level
        if (typeof rootNode.querySelectorAll === 'function') {
            const matches = rootNode.querySelectorAll('iframe[src], video[src], video source[src], source[src], .jw-video, [data-src], [data-video], [data-file]');
            for (let i = 0; i < matches.length; i++) {
                elements.push(matches[i]);
            }
        }

        // Recursively traverse child nodes and open shadow roots
        const children = rootNode.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.shadowRoot) {
                pierceShadowDOM(child.shadowRoot, elements);
            }
            if (child.nodeType === Node.ELEMENT_NODE) {
                pierceShadowDOM(child, elements);
            }
        }
        return elements;
    }

    function scanStaticDOM() {
        try {
            // Initiate full document traversal, penetrating open shadow-roots
            const elements = pierceShadowDOM(document.body || document.documentElement);

            elements.forEach((el) => {
                const candidates = [
                    el.src,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('src') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-src') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-video') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-file') : null,
                    (el.tagName === 'VIDEO' && typeof el.currentSrc === 'string') ? el.currentSrc : null
                ];

                for (let i = 0; i < candidates.length; i++) {
                    const src = inspectUrl(candidates[i]);
                    if (isTargetMatch(src)) {
                        processDiscoveredAsset(src);
                    }
                }
            });
            log.info('Static architectural scan (incl. Shadow DOM) pass complete.');
        } catch (error) {
            log.error('Static DOM traversal processing encountered execution block:', error);
        }
    }

    /* =========================================================================
       7. NETWORK INTERCEPTION (Fetch / XHR)
       ========================================================================= */
    async function readStreamCapped(stream, maxBytes) {
        const reader = stream.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        let received = 0;
        let text = '';
        try {
            while (received < maxBytes) {
                const chunk = await reader.read();
                if (chunk.done) break;
                received += chunk.value.byteLength;
                text += decoder.decode(chunk.value, { stream: true });
            }
        } finally {
            try { reader.cancel(); } catch (e) { /* already closed */ }
        }
        return text + decoder.decode();
    }

    function inspectResponseBody(response) {
        try {
            const contentType = ((response.headers && typeof response.headers.get === 'function')
                ? response.headers.get('content-type') : '') || '';
            const ct = contentType.toLowerCase();
            const isTextual = ct.includes('text') || ct.includes('json') || ct.includes('javascript');
            if (!isTextual) return;

            const clone = response.clone();
            if (clone.body && typeof clone.body.getReader === 'function') {
                readStreamCapped(clone.body, CONFIG.MAX_INSPECT_PAYLOAD_SIZE)
                    .then((text) => { if (text) deepTextInspect(text); })
                    .catch(() => { /* stream consumption blocked */ });
                return;
            }
            if (typeof clone.text === 'function') {
                clone.text().then((textData) => {
                    deepTextInspect(textData);
                }).catch(() => { /* Fails silently if stream consumption blocked */ });
            }
        } catch (err) {
        }
    }

    function installFetchHook(win) {
        try {
            if (typeof win.fetch !== 'function') return;
            if (win.fetch.__usiHooked === true) return;

            const nativeFetch = win.fetch;

            const hookedFetch = async function (...args) {
                try {
                    const requestInput = args[0];
                    let reqUrl = '';
                    if (typeof requestInput === 'string') {
                        reqUrl = requestInput;
                    } else if (requestInput && typeof requestInput.url === 'string') {
                        reqUrl = requestInput.url;
                    } else if (requestInput && typeof requestInput.href === 'string') {
                        reqUrl = requestInput.href;
                    } else if (requestInput != null) {
                        try { reqUrl = String(requestInput); } catch (e) { /* opaque input */ }
                    }
                    const absoluteReqUrl = inspectUrl(reqUrl);

                    if (absoluteReqUrl && absoluteReqUrl.includes('image/svg+xml') && !absoluteReqUrl.startsWith('data:')) {
                        log.warn('Intercepted and aborted malformed SVG fetch request.');
                        return Promise.reject(new TypeError('Failed to fetch: Blocked malformed SVG request.'));
                    }

                    if (isTargetMatch(absoluteReqUrl)) {
                        processDiscoveredAsset(absoluteReqUrl);
                    }
                } catch (e) {
                    log.warn('Asynchronous network request intercept parsing bypassed.');
                }

                // Safely enforce `this` context to prevent strict 'Illegal Invocation' errors
                const fetchContext = this === undefined ? win : this;
                const responsePromise = Reflect.apply(nativeFetch, fetchContext, args);

                try {
                    responsePromise.then((response) => {
                        if (response && typeof response.clone === 'function') {
                            inspectResponseBody(response);
                        }
                    }).catch(() => { /* request itself failed */ });
                } catch (e) { /* non-thenable edge from exotic shims */ }

                return responsePromise;
            };

            hookedFetch.__usiHooked = true;
            win.fetch = hookedFetch;
            log.info(`Fetch interception layer installed (${win === pageWindow ? 'page context' : 'local context'}).`);
        } catch (e) {
            log.warn('Fetch hook installation bypassed: ' + e.message);
        }
    }

    function installXhrHooks(win) {
        try {
            const XHR = win.XMLHttpRequest;
            if (!XHR || !XHR.prototype) return;
            const originalOpen = XHR.prototype.open;
            const originalSend = XHR.prototype.send;
            if (typeof originalOpen !== 'function' || typeof originalSend !== 'function') return;
            if (originalOpen.__usiHooked === true) return;

            function handleXhrLoad() {
                try {
                    const rawEffectiveUrl = this.responseURL || this._xhReqUrl || '';
                    const effectiveUrl = inspectUrl(rawEffectiveUrl);

                    if (isTargetMatch(effectiveUrl)) {
                        processDiscoveredAsset(effectiveUrl);
                    }

                    if (typeof effectiveUrl === 'string' && effectiveUrl.includes('/pass_md5/') &&
                        (!this.responseType || this.responseType === 'text') &&
                        typeof this.responseText === 'string' && this.responseText) {
                        const token = this.responseText.trim();
                        log.info(`pass_md5 token payload captured (${token.length} chars): ${token.substring(0, 40)}`);
                    }

                    const isTextType = !this.responseType || this.responseType === 'text';
                    if (isTextType && typeof this.responseText === 'string') {
                        deepTextInspect(this.responseText);
                    }
                } catch (error) {
                    log.warn('XHR response stream scanning processing interrupted: ' + error.message);
                }
            }

            const hookedOpen = function (...args) {
                try { this._xhReqUrl = args[1]; } catch (e) { /* frozen shim instance */ }
                return Reflect.apply(originalOpen, this, args);
            };

            const hookedSend = function (...args) {
                try {
                    this.addEventListener('load', handleXhrLoad, { once: true });
                } catch (e) { /* non-compliant XHR shim */ }
                return Reflect.apply(originalSend, this, args);
            };

            hookedOpen.__usiHooked = true;
            XHR.prototype.open = hookedOpen;
            XHR.prototype.send = hookedSend;
            log.info(`XHR interception layer installed (${win === pageWindow ? 'page context' : 'local context'}).`);
        } catch (e) {
            log.warn('XHR hook installation bypassed: ' + e.message);
        }
    }

    function installNetworkHooks(win) {
        installFetchHook(win);
        installXhrHooks(win);
    }

    /* =========================================================================
       8. EVENT OBSERVERS & LIFECYCLE
       ========================================================================= */
    function sanitizeNode(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

        try {
            if (typeof node.hasAttribute === 'function' && node.hasAttribute('src')) {
                const currentSrc = node.getAttribute('src');
                if (typeof currentSrc === 'string' && currentSrc.startsWith('image/svg+xml')) {
                    node.setAttribute('src', 'data:' + currentSrc);
                    log.info('Sanitized malformed SVG src attribute on element.');
                }
            }
            if (typeof node.querySelectorAll === 'function') {
                const malformedChildren = node.querySelectorAll('[src^="image/svg+xml"]');
                Array.prototype.forEach.call(malformedChildren, (child) => {
                    const childSrc = (typeof child.getAttribute === 'function') ? child.getAttribute('src') : null;
                    if (typeof childSrc === 'string' && childSrc.startsWith('image/svg+xml')) {
                        child.setAttribute('src', 'data:' + childSrc);
                        log.info('Sanitized malformed descendant SVG src attribute.');
                    }
                });
            }
        } catch (e) {
            log.warn('SVG sanitization pass bypassed for one node: ' + e.message);
        }
    }

    function initSanitizationObserver() {
        try {
            const root = document.documentElement;
            if (!root) {
                document.addEventListener('DOMContentLoaded', initSanitizationObserver, { once: true });
                return;
            }
            const sanitizationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(sanitizeNode);
                    } else if (mutation.type === 'attributes' && mutation.target) {
                        sanitizeNode(mutation.target);
                    }
                }
            });
            sanitizationObserver.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src']
            });
        } catch (e) {
            log.warn('Early sanitization initialization bypassed: ' + e.message);
        }
    }

    function initDynamicObserver() {
        if (!CONFIG.ENABLE_OBSERVER) return;

        const target = document.body || document.documentElement;
        if (!target) {
            document.addEventListener('DOMContentLoaded', initDynamicObserver, { once: true });
            return;
        }

        const debouncedScan = debounce(scanStaticDOM, CONFIG.OBSERVER_DEBOUNCE_MS);
        const observer = new MutationObserver((mutations) => {
            const hasNewElements = mutations.some((m) =>
                Array.from(m.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE)
            );
            const srcMutated = mutations.some((m) => m.type === 'attributes');

            if (hasNewElements || srcMutated) {
                debouncedScan();
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-video', 'data-file']
        });
        log.info('Dynamic DOM layout interaction mutation tracker registered and running.');
    }

    function copyAllDiscoveredUrls() {
        const list = Array.from(foundUrls);
        if (list.length === 0) {
            log.warn('No discovered assets to export yet — wait for network activity or re-scan the DOM.');
            return;
        }
        writeClipboard(list.join('\n')).then((ok) => {
            if (ok) {
                log.success(`Exported ${list.length} discovered asset URL(s) to clipboard.`);
            } else {
                log.error('Clipboard export failed for discovered asset list.');
            }
        });
    }

    function registerMenuCommands() {
        let register = null;
        if (typeof GM_registerMenuCommand === 'function') {
            register = GM_registerMenuCommand;
        } else if (typeof GM !== 'undefined' && GM && typeof GM.registerMenuCommand === 'function') {
            register = GM.registerMenuCommand.bind(GM);
        }
        if (!register) return;

        try {
            register('\u03A8: Copy all discovered URLs', copyAllDiscoveredUrls);
            register('\u03A8: Re-scan DOM for media assets', () => scanStaticDOM());
            register('\u03A8: Toggle AUTO_DOWNLOAD', () => {
                CONFIG.AUTO_DOWNLOAD = !CONFIG.AUTO_DOWNLOAD;
                log.success(`AUTO_DOWNLOAD is now ${CONFIG.AUTO_DOWNLOAD ? 'ENABLED' : 'DISABLED'}.`);
            });
            register('\u03A8: Toggle DEBUG_MODE', () => {
                CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
                log.success(`DEBUG_MODE is now ${CONFIG.DEBUG_MODE ? 'ENABLED' : 'DISABLED'}.`);
            });
        } catch (e) {
            log.warn('Menu command registration bypassed: ' + e.message);
        }
    }

    function boot() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                log.info('DOM loaded. Triggering baseline sector query deployment operations.');
                scanStaticDOM();
                initDynamicObserver();
            }, { once: true });
        } else {
            log.info('DOM already loaded. Triggering baseline sector query deployment operations.');
            scanStaticDOM();
            initDynamicObserver();
        }
    }

    // Initialize Network Hooks & Lifecycle
    installNetworkHooks(pageWindow);
    if (isSandboxed) {
        installNetworkHooks(window);
    }

    initSanitizationObserver();
    registerMenuCommands();
    boot();

    log.info('Ψ Stream Interceptor v3.2.0 — CORE INJECTED & VERIFIED (4ndr0tools suite)');
})();
