// ==UserScript==
// @name         4ndr0tools - Filester++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      7.6.0
// @author       4ndr0666
// @description  Dynamic stream extraction + folder enumeration for any media on Filester.me. Network proxy + glyph injection.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @include      /^[^:]*?://filester\.me/.*?$/
// @include      /^[^:]*?://.*?\.filester\.me/.*?$/
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @connect      u1.filester.me
// @run-at       document-start
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Filester++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Filester++.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==
// 7.5.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.

/* ═══ v7.5.0 — framework realignment pass ═════════════════════════════════
 * · Dropped the dead @require of jQuery 3.6.0 — the v7.4.0 body never
 *   referenced it (zero $/jQuery uses); it only added load time and a
 *   supply-chain surface.
 * · Consolidated the three @include regexes to two (u1.filester.me was
 *   subsumed by the wildcard-subdomain pattern).
 * · MutationObserver re-scan is now genuinely throttled: one in-flight
 *   timer instead of one setTimeout per mutation batch.
 * · Clipboard writes go through GM_setClipboard (focus-independent) with
 *   a navigator.clipboard fallback — and failures now surface on the
 *   glyph instead of dying as unhandled rejections.
 * · Folder glyphs actively probe the folder API and dump results to the
 *   console table instead of only ever showing an alert.
 * ═════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    console.log('%c[4NDR0tools] Filester Universal Liberator v7.6.0-Ψ', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    const API_BASE = 'https://u1.filester.me';
    const mediaCache = new Map(); // id/slug → {type, streamUrl, directUrl}

    // =========================================================================
    // STYLING
    // =========================================================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --yellow: #67E8F9; --purple: #ff0055; }

        .psi-liberator-glyph {
            position: absolute; bottom: 10px; right: 10px;
            width: 44px; height: 44px; background: rgba(10,19,26,0.96);
            border: 2px solid var(--cyan); border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; color: var(--cyan); cursor: pointer;
            z-index: 999999; transition: all 150ms ease-in-out;
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
            background: rgba(10,19,26,0.95); color: var(--cyan);
            padding: 5px 9px; font: 10.5px 'JetBrains Mono', monospace; border: 1px solid var(--cyan);
            border-radius: 4px; max-width: 360px; word-break: break-all;
            cursor: pointer;
        }
    `);

    // =========================================================================
    // CLIPBOARD — GM first (focus-independent), navigator fallback
    // =========================================================================
    async function copyText(text) {
        try {
            GM_setClipboard(text, 'text');
            return true;
        } catch (e) { /* fall through */ }
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            console.warn('[Ψ-4NDR0666] Clipboard write failed:', e);
            return false;
        }
    }

    // =========================================================================
    // NETWORK OBSERVATION — NetHook shared hub (suite v1.4.7)
    // =========================================================================
    // v7.6.0: the bespoke window.fetch wrap is retired; the media-URL cache
    // and API-hit logging ride kernel/net.js onTraffic request events — one
    // shared page-realm wrap per co-install, lazily armed, instead of a
    // per-script proxy stacked on every neighbour (the v1.4.3 sink-census
    // co-install surface this suite is burning down).
    //
    // Superset notes (GUP): the baseline wrap only ever saw transports of
    // the realm it was assigned on — on sandboxed managers (Tampermonkey
    // default) that is the SANDBOX fetch, which the page webapp never
    // calls, so the capture was inert exactly where filester.me's own
    // webapp does its fetching. The hub arms the PAGE realm first
    // (unsafeWindow), so the same capture now works in both manager
    // classes. XHR/beacon request URLs matching the media pattern are now
    // captured too — strictly more observation, same cache shape. The
    // script's own probe fetches (resolveMedia / enumerateFolder) keep the
    // pre-subscription pristine reference below, exactly the baseline's
    // origFetch semantics (own probes never self-observe).
    // =========================================================================
    const origFetch = window.fetch;

    __4NDR0_NET_API__.onTraffic((ev) => {
        if (ev.phase !== 'request' || !ev.url) return;
        const reqUrl = ev.url;

        if (/\.(m3u8|mp4|webm|mov|avi)/i.test(reqUrl)) {
            const key = reqUrl.split('/').pop().split('?')[0];
            mediaCache.set(key, { type: 'video', streamUrl: reqUrl });
        }

        if (reqUrl.includes('/api/v1/')) {
            console.log(`[Ψ-4NDR0666] API hit: ${reqUrl}`);
        }
    });

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
    // FOLDER ENUMERATION — probe the API, dump what answers
    // =========================================================================
    async function enumerateFolder(folderId) {
        const probes = [
            `${API_BASE}/api/v1/folder/${folderId}`,
            `${API_BASE}/api/v1/folders/${folderId}`,
            `${API_BASE}/api/v1/folder/${folderId}/files`
        ];
        for (const url of probes) {
            try {
                const res = await origFetch(url);
                if (res.ok) {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('json')) {
                        const data = await res.json();
                        console.log(`[Ψ-4NDR0666] Folder ${folderId} enumerated via ${url}:`, data);
                        if (Array.isArray(data) || Array.isArray(data?.files) || Array.isArray(data?.data)) {
                            console.table(Array.isArray(data) ? data : (data.files || data.data));
                        }
                        return true;
                    }
                }
            } catch (e) {}
        }
        console.warn(`[Ψ-4NDR0666] Folder API probes exhausted for ${folderId} — use the Python bridge for full enumeration.`);
        return false;
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
            glyph.textContent = el.tagName === 'VIDEO' || el.tagName === 'IMG' ? '▶' : '🔗';
            glyph.title = 'Extract Stream / Direct URL';

            glyph.onclick = async (e) => {
                e.preventDefault(); e.stopImmediatePropagation();
                const saved = glyph.textContent;
                glyph.textContent = '⟳';

                const media = await resolveMedia(id, el.parentElement || el);
                const url = media.streamUrl;

                const ok = await copyText(url);
                glyph.textContent = ok ? '✓' : '✗';
                setTimeout(() => glyph.textContent = saved, 1500);

                if (ok) {
                    console.log(`[Ψ-4NDR0666] Media liberated: ${url} (${media.type})`);
                }
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
            fg.textContent = '📂';
            fg.title = 'Enumerate Folder';

            fg.onclick = async (e) => {
                e.preventDefault(); e.stopImmediatePropagation();
                const fid = folderId || 'unknown';
                console.log(`[Ψ-4NDR0666] Folder detected: ${fid}`);
                const enumerated = await enumerateFolder(fid);
                if (!enumerated) {
                    alert(`Folder ID captured: ${fid}\n\nAPI probes found no JSON endpoint — use the Python bridge for full enumeration.`);
                }
            };

            const w = el.closest('div') || el;
            w.style.position = 'relative';
            w.appendChild(fg);
        });
    }

    // =========================================================================
    // BOOTSTRAP
    // =========================================================================
    let rescanTimer = null;

    function scheduleRescan() {
        // v7.5: one in-flight timer — the old one-setTimeout-per-batch
        // schedule stacked dozens of pending full-DOM passes during churn.
        if (rescanTimer) return;
        rescanTimer = setTimeout(() => {
            rescanTimer = null;
            injectLiberatorGlyphs();
        }, 400);
    }

    function bootstrap() {
        if (!document.body) return setTimeout(bootstrap, 100);

        console.log('[Ψ-4NDR0666] Universal Liberator online — any media / folder');
        injectLiberatorGlyphs();

        new MutationObserver(scheduleRescan)
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
