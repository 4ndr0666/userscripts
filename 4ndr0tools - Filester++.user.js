// ==UserScript==
// @name         4ndr0tools - Filester Universal Liberator
// @namespace    https://github.com/4ndr0666/userscripts
// @version      7.4.0
// @author       4ndr0666
// @description  Dynamic stream extraction + folder enumeration for any media on Filester.me. Network proxy + glyph injection.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Filester%20Universal%20Liberator.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Filester%20Universal%20Liberator.user.js
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAH6UlEQVR42m2Xa49cxRGGn6o+15nd9d1mjdcxxgQvCeBgOQYikIzkD44SJPjGv+HfICV/ACGEQohQcCAIX2JjjGwTG8der9e7653LOX268qF7ZsdORjrTPTNnTr1VXfW+VaLqTAAQEAGd2U8u1Sc/S/xHXAUwMAMjrSHtQ/qcrmAz9xoCZPE5gj1tYNbw7KoKoqDJeMJCSIaDQQhpL8lw+l4TsMnLjIynjU+9TUZUwbnpKmkvEzAw9da6gIUOunSFAF1IkUrGg8W9CIRAhmj0YtagpIc73QaQZWhazQwz2z4GMQSH5DliBm1L8B7zHSIeuhSmkNAaEZxIjADCtvGnPMY5JMuQLEv7HLd3D7p7N1r3QMDalrC+TreyQlhfR1TRoiCITwA9dJO4Bwgacy1GQGIOTD2OXk4NOwdZDplD+33K06fR3Xui4a2tGOqyROfmsbYhrKzQXr2Kv/MzKoopWMtTiZtyQgTRsjZVwVJ4J5fkeTxnlyFlkYBk6N692GgE4zG6uBgNb0TvqSqypSUYj2kuXMQsQNNg3mOtB99GwL6D0CFdisCT4c6Rsohg5+bQqoK2hbqH+8VhtK4J6+vQtrEAhgO03wfvoSyh6+ju30f7PaxtY9KnpI71niLhYynq9tlHD6XIQQTduYve++9DXUNVof0+0gXCygqMx9B1ZC/8kvyVVwhbWzFCXYC2JTt0KP7POXRuDp2bAxfzgjzbzjEVRPvzJpmDPEeKAqkqUKX/wQe0Fy6Cb5G6R9hYR/IcALe4SPHWW2CGjcfozl2057+ivXYtlV6HtS2UJWF1lerMGYaffEJ4+BC6jjAeQ9Mg3iM6v2DqMqwo0LrCvKc6exatKtpLl8iXl+nu3IkJs7BA+ebvcIeX8Feu4H/4AXyHLh2iePVVbDhk/Plf6e79B7xH9+8nbG2BKtmRI2z9+U+oOsJwiDVjpPE4qaoPSZkuKrjduylPn2b8xRfo3Bw2GCBZRn7iBPW532Obm4z//iW2vo7255BejQ0G+GvXkDynfPttZGGBcO8etraG7tmDv36d/Lmj2HBEWFmJVdd1iAWclPWHkwyXLEOqmnD7DlJVSFEinad4/XWKU6doPv8LNhqRH3kOyTLcvn3ovn2R048cwQZD2gsXyF88Tnb4MP777wkbG4ThCLqO/PiLNJcvg2oEEAI6oWARwLlYy483yY698ERCdj/+SFhbozpzht5776E7dlCcOkX1zjvI3Bz12bPUf/wDOIe/fBnp95C8QFTJlg4RHjzA37iBlBXYhBZkFoAyISWdn4e2wUajmHgWYkT6fazrsNEYqesoNN4jvR7WeqxpkLJC5vqRaJyDEJBeH6kr2osXI7dM6HgqviJTdbMQMO/xP/2EZHkSqiQ6ThNQoCiiAdG4FxBRxKV7dULxDtvYiPJbVVMBtcQHOlFDM5CqpDjxm3iz6rbUMiO5odumVZu+xbq2gIUwI7cgWUZ4tEZ49CiW7YSCp0cwJSoBg+zY80ivh1s6HBOFmcYiBPzdu7Eqjh6dMmb+3FF0fh5/+3YkqUkDgmGhQ3fshKrC7duHlEX8SQQjHYEZiCo2HGDDYTx3ASmKSChm2GAQAdy8yfirr6Iazi8geY575gDNt9/SXroUlXYwiKyYSMk9exDJc4o33oh0n6ImGIoZkvTdmoZudRW3uIi/fj3yu4/J5ZaWsKbBNjZoLl5k+PHHhM0NLARGn33G+JtvCI8fYxsbZM8+C06x8RjynLC5idQ1Nh5HHXEuOmWgk3Mz7xHnaK9cwR0+TBgMovfO0Zw/j797l/rddyO7bWzQra5GpawrwuZmfHBZUp07h/T7jD79NFZAWdJeu0Z+7Fh0KoTpJWaIzu+IWlCUaFlAluEWF7HBgGxpCd21i/DzXShysqNHKd58E/Kc9rvvcHUPipzuwSr58nFkxw6a8//A/+syNhige/eCc3QPH1K89hpbH30EIWCjEWE8RtsW0f6CaaZYnkfiKHJwGdrrQebIX/oVDIfYaBi7oqoiW16mPHkSf+sW9vgx2a9fxv9wjfabfxI2N6Y9oR44QHv1KrqwQBgMoqaEQGiaKEZti2hvzsTFxoM8SyAKKAu0THVbVujePWhdw7iJNV7XFL89jc7PM/7yb9jDR7HuUm/h79+PCe19Ep8mKmHTxP7C+6SGdc9k2pBMQORIWYIq5cmTWAj4n/5N8dJy9ODB6nb/T6x1M5C6Rhbm6W7fJqytxW5oPCY0LbRNNJ4SG++RrsNJln04mUW2+zZNjCXQNpQnTuAOHowPfrhGGA4hdLhnnkF27oxqeOdnaFusGZM9/zza6+Fv3MC6DpqGkLzG+2nLHpOwqExFsElD6jT2hXkeO5gEKn/5ZfLlZWhbmq+/jrygLhLN7t3kx48jqX/0N2/SXLgQy7ZtYzU9ZZwQkBAQzcsIILVIk95wchya55BHQhJVdP9+bDyKPaFzmPe4AwfIDh6kvXWL7t69KErOgfcE76H10D1pfBtAVpgKEYDMgFAHWWpUXYbkWUywrou/qWxrQCIr8hxxGYTYktnE49QF001GtkjtEYDLI4D/NwPODiouAhTViZJuz4aTsS7NgGbJ2OyIFrYNT4ZUCUaG2ZSZ47ikM+KTBsoQwEdglozaE4OGbQ+ds0Ym3k72sxNyui8DQwyMkLQpEBv4OPNhMp3jtkfzmal4Mp7PyvMUgP3viP7EGA//BRlkV2d1aGqBAAAAAElFTkSuQmCC
// @license      UNLICENSED - RED TEAM USE ONLY
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
