// ==UserScript==
// @name         4ndr0tools - Filester++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      7.4.0
// @author       4ndr0666
// @description  Dynamic stream extraction + folder enumeration for any media on Filester.me. Network proxy + glyph injection.
// @license      UNLICENSED - RED TEAM USE ONLY
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Filester++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Filester++.user.js
// @include      /^[^:]*?://filester\.me/.*?$/
// @include      /^[^:]*?://u1\.filester\.me/.*?$/
// @include      /^[^:]*?://.*?\.filester\.me/.*?$/
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      u1.filester.me
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @noframes
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    console.log('%c[4NDR0tools] Filester Universal Liberator v7.4.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    const API_BASE = 'https://u1.filester.me';
    let mediaCache = new Map(); // id/slug → {type, streamUrl, directUrl}

    // =========================================================================
    // STYLING
    // =========================================================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --yellow: #FFD700; --purple: #C724FF; }

        .psi-liberator-glyph {
            position: absolute; bottom: 10px; right: 10px;
            width: 44px; height: 44px; background: rgba(15,22,35,0.96);
            border: 2px solid var(--cyan); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; color: var(--cyan); cursor: pointer;
            z-index: 999999; transition: all 0.3s ease;
            box-shadow: 0 0 15px rgba(0,229,255,0.5);
        }
        .psi-liberator-glyph:hover {
            background: var(--cyan); color: #000; transform: scale(1.25);
            box-shadow: 0 0 25px var(--cyan);
        }

        .psi-folder-glyph {
            right: 64px; border-color: var(--yellow); color: var(--yellow);
        }
        .psi-folder-glyph:hover { background: var(--yellow); }

        .psi-overlay {
            position: absolute; top: 8px; right: 8px; z-index: 99999;
            background: rgba(10,15,26,0.95); color: var(--cyan);
            padding: 5px 9px; font: 10.5px monospace; border: 1px solid var(--cyan);
            border-radius: 4px; max-width: 360px; word-break: break-all;
            cursor: pointer;
        }
    `);

    // =========================================================================
    // NETWORK PROXY — Adaptive capture
    // =========================================================================
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
        const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');

        if (/\.(m3u8|mp4|webm|mov|avi)/i.test(reqUrl)) {
            const key = reqUrl.split('/').pop().split('?')[0];
            mediaCache.set(key, { type: 'video', streamUrl: reqUrl });
        }

        if (reqUrl.includes('/api/v1/')) {
            console.log(`[Ψ-4NDR0666] API hit: ${reqUrl}`);
        }

        return origFetch.apply(this, args);
    };

    // =========================================================================
    // DYNAMIC STREAM / MEDIA RESOLVER
    // =========================================================================
    async function resolveMedia(idOrSlug, container) {
        if (mediaCache.has(idOrSlug)) return mediaCache.get(idOrSlug);

        const probes = [
            `${API_BASE}/api/v1/file/${idOrSlug}/stream`,
            `${API_BASE}/api/v1/file/${idOrSlug}`,
            `${API_BASE}/api/v1/file/${idOrSlug}/download`,
            `https://filester.me/d/${idOrSlug}`
        ];

        for (const url of probes) {
            try {
                const res = await origFetch(url, { method: 'HEAD' });
                if (res.ok) {
                    const entry = { type: res.headers.get('content-type')?.includes('video') ? 'video' : 'file', streamUrl: url };
                    mediaCache.set(idOrSlug, entry);
                    return entry;
                }
            } catch (e) {}
        }

        // DOM fallback for video players
        const video = container.querySelector('video') || document.querySelector('video');
        if (video?.src) {
            mediaCache.set(idOrSlug, { type: 'video', streamUrl: video.src });
            return { type: 'video', streamUrl: video.src };
        }

        return { type: 'unknown', streamUrl: `${API_BASE}/api/v1/file/${idOrSlug}/download` };
    }

    // =========================================================================
    // GLYPH INJECTION — Universal
    // =========================================================================
    function injectLiberatorGlyphs() {
        // Files / Media items
        document.querySelectorAll('a[href*="/file/"], a[href*="/d/"], .file-item, [data-file-id], video, img').forEach(el => {
            if (el.querySelector('.psi-liberator-glyph')) return;

            const id = el.getAttribute('data-file-id') ||
                      el.href?.match(/\/(?:file|d)\/([^/?#]+)/)?.[1] ||
                      el.src?.match(/\/([^/?#]+)\./)?.[1];

            if (!id) return;

            // Stream glyph
            const glyph = document.createElement('div');
            glyph.className = 'psi-liberator-glyph';
            glyph.innerHTML = el.tagName === 'VIDEO' || el.tagName === 'IMG' ? '▶' : '🔗';
            glyph.title = 'Extract Stream / Direct URL';

            glyph.onclick = async (e) => {
                e.preventDefault(); e.stopImmediatePropagation();
                const saved = glyph.innerHTML;
                glyph.innerHTML = '⟳';

                const media = await resolveMedia(id, el.parentElement || el);
                const url = media.streamUrl;

                glyph.innerHTML = '✓';
                setTimeout(() => glyph.innerHTML = saved, 1500);

                await navigator.clipboard.writeText(url);
                console.log(`[Ψ-4NDR0666] Media liberated: ${url} (${media.type})`);
            };

            const wrapper = el.closest('div, figure, .item') || el.parentElement;
            if (wrapper) {
                wrapper.style.position = 'relative';
                wrapper.appendChild(glyph);
            }
        });

        // Folder items
        document.querySelectorAll('a[href*="/folder/"], .folder-item, [data-folder-id]').forEach(el => {
            if (el.querySelector('.psi-folder-glyph')) return;

            const folderId = el.getAttribute('data-folder-id') || el.href?.match(/\/folder\/([^/?#]+)/)?.[1];

            const fg = document.createElement('div');
            fg.className = 'psi-liberator-glyph psi-folder-glyph';
            fg.innerHTML = '📂';
            fg.title = 'Enumerate Folder';

            fg.onclick = (e) => {
                e.preventDefault(); e.stopImmediatePropagation();
                const fid = folderId || 'unknown';
                console.log(`[Ψ-4NDR0666] Folder detected: ${fid}`);
                alert(`Folder ID captured: ${fid}\n\nUse Python bridge for full enumeration.`);
            };

            const w = el.closest('div') || el;
            w.style.position = 'relative';
            w.appendChild(fg);
        });
    }

    // =========================================================================
    // BOOTSTRAP
    // =========================================================================
    function bootstrap() {
        if (!document.body) return setTimeout(bootstrap, 100);

        console.log('[Ψ-4NDR0666] Universal Liberator online — any media / folder');
        injectLiberatorGlyphs();

        new MutationObserver(() => setTimeout(injectLiberatorGlyphs, 400))
            .observe(document.body, { childList: true, subtree: true });

        GM_registerMenuCommand('📊 Dump Media Cache', () => {
            console.table(Object.fromEntries(mediaCache));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
