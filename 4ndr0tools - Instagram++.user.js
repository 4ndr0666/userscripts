// ==UserScript==
// @name         4ndr0tools - Instagram++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      12.0.0
// @description  Tab-Bar + Dock Integration. Hotkey trigger (Alt+I). Ad-Blocking. Deep-Stack Recovery.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAH6UlEQVR42m2Xa49cxRGGn6o+15nd9d1mjdcxxgQvCeBgOQYikIzkD44SJPjGv+HfICV/ACGEQohQcCAIX2JjjGwTG8der9e7653LOX268qF7ZsdORjrTPTNnTr1VXfW+VaLqTAAQEAGd2U8u1Sc/S/xHXAUwMAMjrSHtQ/qcrmAz9xoCZPE5gj1tYNbw7KoKoqDJeMJCSIaDQQhpL8lw+l4TsMnLjIynjU+9TUZUwbnpKmkvEzAw9da6gIUOunSFAF1IkUrGg8W9CIRAhmj0YtagpIc73QaQZWhazQwz2z4GMQSH5DliBm1L8B7zHSIeuhSmkNAaEZxIjADCtvGnPMY5JMuQLEv7HLd3D7p7N1r3QMDalrC+TreyQlhfR1TRoiCITwA9dJO4Bwgacy1GQGIOTD2OXk4NOwdZDplD+33K06fR3Xui4a2tGOqyROfmsbYhrKzQXr2Kv/MzKoopWMtTiZtyQgTRsjZVwVJ4J5fkeTxnlyFlkYBk6N692GgE4zG6uBgNb0TvqSqypSUYj2kuXMQsQNNg3mOtB99GwL6D0CFdisCT4c6Rsohg5+bQqoK2hbqH+8VhtK4J6+vQtrEAhgO03wfvoSyh6+ju30f7PaxtY9KnpI71niLhYynq9tlHD6XIQQTduYve++9DXUNVof0+0gXCygqMx9B1ZC/8kvyVVwhbWzFCXYC2JTt0KP7POXRuDp2bAxfzgjzbzjEVRPvzJpmDPEeKAqkqUKX/wQe0Fy6Cb5G6R9hYR/IcALe4SPHWW2CGjcfozl2057+ivXYtlV6HtS2UJWF1lerMGYaffEJ4+BC6jjAeQ9Mg3iM6v2DqMqwo0LrCvKc6exatKtpLl8iXl+nu3IkJs7BA+ebvcIeX8Feu4H/4AXyHLh2iePVVbDhk/Plf6e79B7xH9+8nbG2BKtmRI2z9+U+oOsJwiDVjpPE4qaoPSZkuKrjduylPn2b8xRfo3Bw2GCBZRn7iBPW532Obm4z//iW2vo7255BejQ0G+GvXkDynfPttZGGBcO8etraG7tmDv36d/Lmj2HBEWFmJVdd1iAWclPWHkwyXLEOqmnD7DlJVSFEinad4/XWKU6doPv8LNhqRH3kOyTLcvn3ovn2R048cwQZD2gsXyF88Tnb4MP777wkbG4ThCLqO/PiLNJcvg2oEEAI6oWARwLlYy483yY698ERCdj/+SFhbozpzht5776E7dlCcOkX1zjvI3Bz12bPUf/wDOIe/fBnp95C8QFTJlg4RHjzA37iBlBXYhBZkFoAyISWdn4e2wUajmHgWYkT6fazrsNEYqesoNN4jvR7WeqxpkLJC5vqRaJyDEJBeH6kr2osXI7dM6HgqviJTdbMQMO/xP/2EZHkSqiQ6ThNQoCiiAdG4FxBRxKV7dULxDtvYiPJbVVMBtcQHOlFDM5CqpDjxm3iz6rbUMiO5odumVZu+xbq2gIUwI7cgWUZ4tEZ49CiW7YSCp0cwJSoBg+zY80ivh1s6HBOFmcYiBPzdu7Eqjh6dMmb+3FF0fh5/+3YkqUkDgmGhQ3fshKrC7duHlEX8SQQjHYEZiCo2HGDDYTx3ASmKSChm2GAQAdy8yfirr6Iazi8geY575gDNt9/SXroUlXYwiKyYSMk9exDJc4o33oh0n6ImGIoZkvTdmoZudRW3uIi/fj3yu4/J5ZaWsKbBNjZoLl5k+PHHhM0NLARGn33G+JtvCI8fYxsbZM8+C06x8RjynLC5idQ1Nh5HHXEuOmWgk3Mz7xHnaK9cwR0+TBgMovfO0Zw/j797l/rddyO7bWzQra5GpawrwuZmfHBZUp07h/T7jD79NFZAWdJeu0Z+7Fh0KoTpJWaIzu+IWlCUaFlAluEWF7HBgGxpCd21i/DzXShysqNHKd58E/Kc9rvvcHUPipzuwSr58nFkxw6a8//A/+syNhige/eCc3QPH1K89hpbH30EIWCjEWE8RtsW0f6CaaZYnkfiKHJwGdrrQebIX/oVDIfYaBi7oqoiW16mPHkSf+sW9vgx2a9fxv9wjfabfxI2N6Y9oR44QHv1KrqwQBgMoqaEQGiaKEZti2hvzsTFxoM8SyAKKAu0THVbVujePWhdw7iJNV7XFL89jc7PM/7yb9jDR7HuUm/h79+PCe19Ep8mKmHTxP7C+6SGdc9k2pBMQORIWYIq5cmTWAj4n/5N8dJy9ODB6nb/T6x1M5C6Rhbm6W7fJqytxW5oPCY0LbRNNJ4SG++RrsNJln04mUW2+zZNjCXQNpQnTuAOHowPfrhGGA4hdLhnnkF27oxqeOdnaFusGZM9/zza6+Fv3MC6DpqGkLzG+2nLHpOwqExFsElD6jT2hXkeO5gEKn/5ZfLlZWhbmq+/jrygLhLN7t3kx48jqX/0N2/SXLgQy7ZtYzU9ZZwQkBAQzcsIILVIk95wchya55BHQhJVdP9+bDyKPaFzmPe4AwfIDh6kvXWL7t69KErOgfcE76H10D1pfBtAVpgKEYDMgFAHWWpUXYbkWUywrou/qWxrQCIr8hxxGYTYktnE49QF001GtkjtEYDLI4D/NwPODiouAhTViZJuz4aTsS7NgGbJ2OyIFrYNT4ZUCUaG2ZSZ47ikM+KTBsoQwEdglozaE4OGbQ+ds0Ym3k72sxNyui8DQwyMkLQpEBv4OPNhMp3jtkfzmal4Mp7PyvMUgP3viP7EGA//BRlkV2d1aGqBAAAAAElFTkSuQmCC
// @icon64       data:image/png;base64,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
// @match        *://*.instagram.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    // [CONFIG]
    // =========================================================
    const CFG = {
        ACCENT:      '#00ffff',
        BG:          '#050505',
        ERROR:       '#ff3e3e',
        H_PCT:       0.88,
        W_PCT:       0.58,
        VOLUME:      0.03,
        BATCH:       12,
        SAFE_ZONE:   15,        // nodes from end never pruned
        CACHE_LIMIT: 80,        // total nodes before pruning head
        HYDRATE_PX:  3000,
        PRUNE_PX:    6000,
        HOTKEY:      'i',       // Alt + I
    };

    // =========================================================
    // [STATE]
    // =========================================================
    const STATE = {
        MODE:         'profile',
        userId:       null,
        isFetching:   false,
        totalLoaded:  0,
        domNodes:     [],
        _seen:        new Set(),
        cursors:      {},       // mode -> next cursor from intercept
        pendingItems: [],       // items buffered before UI exists
        uiReady:      false,
        injected:     false,
        executed:     false,
    };

    // Use unsafeWindow so monkey-patches affect the real page context
    const win = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    const log = (msg) =>
        console.log(`%c[ARES-9 V6.1] %c${msg}`,
            `color:${CFG.ACCENT}; font-weight:bold;`, `color:#ccc;`);

    // =========================================================
    // [TRUSTED TYPES BYPASS]
    // =========================================================
    if (win.trustedTypes && win.trustedTypes.createPolicy) {
        try { win.trustedTypes.createPolicy('default', { createHTML: s => s }); }
        catch (_) {}
    }

    // =========================================================
    // [INTERCEPT ENGINE]
    // Hooks Instagram's own fetch/XHR at document-start so we
    // ride on their authenticated, signed requests for free.
    // =========================================================
    const FEED_RE = [
        /\/api\/v1\/feed\/(timeline|user\/\d+|tag\/[^/]+|usertags\/\d+)/,
        /\/graphql\/query/,
        /\/api\/graphql/,
        /bloks\/apps\/com\.bloks\.www\.feed/,
        /\/api\/v1\/feed\/home_sessions/,
    ];

    function isFeedUrl(url) {
        return FEED_RE.some(r => r.test(url));
    }

    function digestText(url, text) {
        let json;
        try { json = JSON.parse(text.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '')); }
        catch (_) { return; }
        harvestJSON(json, url);
    }

    // --- Patch fetch ---
    const _origFetch = win.fetch;
    win.fetch = function (...args) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        const p = _origFetch.apply(this, args);
        if (isFeedUrl(url)) {
            p.then(r => r.clone().text().then(t => digestText(url, t))).catch(() => {});
        }
        return p;
    };

    // --- Patch XHR ---
    const _origOpen = win.XMLHttpRequest.prototype.open;
    const _origSend = win.XMLHttpRequest.prototype.send;
    win.XMLHttpRequest.prototype.open = function (m, url, ...rest) {
        this._aresUrl = url;
        return _origOpen.call(this, m, url, ...rest);
    };
    win.XMLHttpRequest.prototype.send = function (...args) {
        if (this._aresUrl && isFeedUrl(this._aresUrl)) {
            this.addEventListener('load', () => digestText(this._aresUrl, this.responseText));
        }
        return _origSend.apply(this, args);
    };

    // =========================================================
    // [HARVEST ENGINE]
    // Normalises all known Instagram feed response schemas.
    // =========================================================
    function harvestJSON(json, url) {
        let items = [], cursor = null;

        // Schema A: REST v1  feed/user or feed/usertags
        if (json.items || json.feed_items) {
            items  = json.items ||
                     (json.feed_items || []).map(i => i.media_or_ad || i.media).filter(Boolean);
            cursor = json.next_max_id || null;
            if (!STATE.userId) STATE.userId = items[0]?.user?.pk_id || items[0]?.user?.pk;
        }
        // Schema B: classic GraphQL edge_owner_to_timeline_media
        else if (json.data?.user?.edge_owner_to_timeline_media) {
            const tl = json.data.user.edge_owner_to_timeline_media;
            items  = (tl.edges || []).map(e => e.node);
            cursor = tl.page_info?.end_cursor || null;
            STATE.userId = STATE.userId || json.data.user.id;
        }
        // Schema C: newer xdt_api relay connection
        else if (json.data?.xdt_api__v1__feed__user_timeline_graphql_connection) {
            const conn = json.data.xdt_api__v1__feed__user_timeline_graphql_connection;
            items  = (conn.edges || []).map(e => e.node);
            cursor = conn.page_info?.end_cursor || null;
        }
        // Schema D: home sessions
        else if (json.data?.xdt_api__v1__feed__home_connection) {
            const conn = json.data.xdt_api__v1__feed__home_connection;
            items  = (conn.edges || []).map(e => e.node?.media || e.node).filter(Boolean);
            cursor = conn.page_info?.end_cursor || null;
        }
        // Schema E: deep-scan blobs/Bloks
        else {
            items = deepFindMedia(json);
        }

        if (!items.length) return;

        // Deduplicate
        items = items.filter(item => {
            const id = item.pk || item.id || item.code;
            if (!id || STATE._seen.has(id)) return false;
            STATE._seen.add(id);
            return true;
        });

        if (!items.length) return;

        // Persist cursor
        if (cursor) {
            const mode = url.includes('timeline') ? 'home' : 'profile';
            STATE.cursors[mode] = cursor;
        }

        log(`Harvested ${items.length} items via intercept.`);

        if (STATE.uiReady) renderBatch(items, cursor);
        else STATE.pendingItems.push(...items);
    }

    function deepFindMedia(obj, depth = 0) {
        if (depth > 8 || !obj || typeof obj !== 'object') return [];
        if (Array.isArray(obj)) {
            if (obj.length && obj[0] &&
                (obj[0].image_versions2 || obj[0].video_versions || obj[0].carousel_media))
                return obj;
            return obj.flatMap(v => deepFindMedia(v, depth + 1));
        }
        return Object.values(obj).flatMap(v => deepFindMedia(v, depth + 1));
    }

    // =========================================================
    // [ACTIVE FETCH]
    // Fires authenticated same-origin requests for "load more".
    // =========================================================
    function csrf() {
        return document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
    }

    function baseHeaders() {
        return {
            'X-IG-App-ID':      '936619743392459',
            'X-CSRFToken':      csrf(),
            'X-Requested-With': 'XMLHttpRequest',
            'Accept':           '*/*',
        };
    }

    function activeFetch(cursor) {
        if (STATE.isFetching) return;
        STATE.isFetching = true;

        const done = () => { STATE.isFetching = false; };

        if (STATE.MODE === 'home') {
            const fd = new URLSearchParams({ is_async_ads_rti: '0' });
            if (cursor) fd.set('max_id', cursor);
            fetch('https://i.instagram.com/api/v1/feed/timeline/', {
                method: 'POST',
                headers: { ...baseHeaders(), 'Content-Type': 'application/x-www-form-urlencoded' },
                body: fd.toString(),
                credentials: 'include',
            }).then(r => r.json()).then(json => { done(); harvestJSON(json, 'timeline'); })
              .catch(done);

        } else if (STATE.userId) {
            let url = `https://i.instagram.com/api/v1/feed/user/${STATE.userId}/?count=${CFG.BATCH}`;
            if (cursor) url += `&max_id=${cursor}`;
            fetch(url, { headers: baseHeaders(), credentials: 'include' })
                .then(r => r.json()).then(json => { done(); harvestJSON(json, url); })
                .catch(done);

        } else {
            done();
            log('No userId yet — waiting for intercept to provide one.');
        }
    }

    // =========================================================
    // [USER ID RESOLUTION]  (no _sharedData dependency)
    // =========================================================
    function resolveUserId() {
        if (STATE.userId) return;

        // Layer 1: meta tag
        STATE.userId = document.querySelector(
            'meta[property="instapp:owner_user_id"]')?.content;
        if (STATE.userId) { log(`UID via meta: ${STATE.userId}`); return; }

        // Layer 2: inline JSON script tags
        for (const s of document.querySelectorAll('script[type="application/json"]')) {
            const m = s.textContent.match(/"user_id"\s*:\s*"?(\d+)"?/);
            if (m) { STATE.userId = m[1]; log(`UID via inline JSON: ${STATE.userId}`); return; }
        }

        // Layer 3: web_profile_info (async, fires and forgets)
        const username = location.pathname.match(/^\/([a-zA-Z0-9._]{1,30})\/?$/)?.[1];
        const SKIP = ['explore', 'reels', 'stories', 'direct', 'accounts', 'tv'];
        if (username && !SKIP.includes(username)) {
            fetch(
                `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
                { headers: { 'X-IG-App-ID': '936619743392459', 'X-Requested-With': 'XMLHttpRequest' },
                  credentials: 'include' }
            ).then(r => r.json())
             .then(json => {
                 STATE.userId = json?.data?.user?.id || json?.user?.pk;
                 log(`UID via web_profile_info: ${STATE.userId}`);
             }).catch(() => {});
        }
    }

    // =========================================================
    // [NEURAL VIRTUALIZATION]
    // Prune off-screen nodes to HTML placeholders; re-hydrate on scroll.
    // =========================================================
    const NeuralDOM = {
        prune(item, container) {
            const idx = STATE.domNodes.indexOf(item);
            if (idx >= STATE.domNodes.length - CFG.SAFE_ZONE) return;
            if (item.isPruned) return;
            const rect = item.node.getBoundingClientRect();
            item.height = rect.height || item.height || 800;
            item.node.querySelectorAll('video').forEach(v => { v.pause(); v.src = ''; });
            const ph = document.createElement('div');
            ph.style.cssText = `height:${item.height}px;width:100%;margin-bottom:80px;background:#050505;
                border:1px solid #111;display:flex;align-items:center;justify-content:center;`;
            ph.innerHTML = `<span style="color:#222;font-family:monospace;font-size:10px;">V-STASIS</span>`;
            if (item.node.parentNode) {
                item.node.parentNode.replaceChild(ph, item.node);
                item.node = ph;
                item.isPruned = true;
            }
        },
        hydrate(item) {
            if (!item.isPruned) return;
            const real = createMediaComponent(item.data, item.parent, item.meta.cur, item.meta.total);
            if (item.node.parentNode) {
                item.node.parentNode.replaceChild(real, item.node);
                item.node = real;
                item.isPruned = false;
            }
        },
        observe(container) {
            container.addEventListener('scroll', () => {
                window.requestAnimationFrame(() => {
                    const top = container.scrollTop;
                    STATE.domNodes.forEach(item => {
                        const dist = Math.abs((item.node.offsetTop || 0) - top);
                        if (dist > CFG.PRUNE_PX  && !item.isPruned)  this.prune(item, container);
                        if (dist < CFG.HYDRATE_PX &&  item.isPruned)  this.hydrate(item);
                    });
                });
            }, { passive: true });
        }
    };

    // =========================================================
    // [RENDERING ENGINE]
    // =========================================================
    function renderBatch(items, cursor) {
        const wall = document.querySelector('#igAllImages');
        if (!wall) return;
        const frag = document.createDocumentFragment();

        items.forEach(item => {
            const children =
                item.carousel_media ||
                item.edge_sidecar_to_children?.edges?.map(e => e.node) ||
                [item];

            children.forEach((child, idx) => {
                if (child.ad_id || child.label === 'Sponsored' || child.is_ad) return;
                const node = createMediaComponent(child, item, idx + 1, children.length);
                frag.appendChild(node);
                STATE.domNodes.push({
                    data: child, parent: item, node,
                    isPruned: false, height: 800,
                    meta: { cur: idx + 1, total: children.length }
                });
                STATE.totalLoaded++;
            });
        });

        wall.appendChild(frag);

        // Prune head if over cache limit
        if (STATE.domNodes.length > CFG.CACHE_LIMIT) {
            const container = document.querySelector('#igBigContainer');
            STATE.domNodes
                .slice(0, STATE.domNodes.length - CFG.CACHE_LIMIT)
                .forEach(item => NeuralDOM.prune(item, container));
        }

        // Scroll trigger for next page
        if (cursor) {
            const container  = document.querySelector('#igBigContainer');
            const triggerIdx = Math.max(0, STATE.domNodes.length - CFG.SAFE_ZONE);
            const trigger    = STATE.domNodes[triggerIdx]?.node || wall.lastElementChild;
            if (trigger) {
                const obs = new IntersectionObserver(entries => {
                    if (entries[0].isIntersecting) { obs.disconnect(); activeFetch(cursor); }
                }, { root: container, rootMargin: '1500px' });
                obs.observe(trigger);
            }
        }
    }

    function createMediaComponent(media, parent, cur, total) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText =
            'margin-bottom:80px;display:flex;flex-direction:column;align-items:center;width:100%;' +
            'transition:opacity 0.3s;pointer-events:auto;';

        const code = media.code || parent?.code || '';
        const link = code ? `https://www.instagram.com/p/${code}/` : '#';

        if (media.video_versions || media.is_video) {
            const vids = media.video_versions || [];
            const best = vids.length ? vids.reduce((a, b) => a.width > b.width ? a : b) : null;
            const vid  = document.createElement('video');
            vid.src        = best?.url || media.video_url || '';
            vid.controls   = true;
            vid.volume     = CFG.VOLUME;
            vid.preload    = 'metadata';
            vid.style.cssText =
                `max-height:${window.innerHeight * CFG.H_PCT}px;` +
                `max-width:${window.innerWidth  * CFG.W_PCT}px;` +
                `border:2px solid ${CFG.ACCENT};pointer-events:auto;`;
            wrapper.appendChild(vid);
        } else {
            const cands = media.image_versions2?.candidates || media.display_resources || [];
            const best  = cands.length ? cands.reduce((a, b) => a.width > b.width ? a : b) : null;
            const img   = document.createElement('img');
            img.src             = best?.url || media.url || media.display_url || '';
            img.loading         = 'lazy';
            img.style.cssText   =
                `max-height:${window.innerHeight * CFG.H_PCT}px;` +
                `max-width:${window.innerWidth  * CFG.W_PCT}px;` +
                `border:1px solid #333;cursor:pointer;pointer-events:auto;`;
            const a    = document.createElement('a');
            a.href     = link;
            a.target   = '_blank';
            a.appendChild(img);
            wrapper.appendChild(a);
        }

        const label = document.createElement('a');
        label.href            = link;
        label.target          = '_blank';
        label.style.cssText   =
            `margin-top:12px;font-family:monospace;font-size:11px;color:${CFG.ACCENT};` +
            `opacity:0.6;text-decoration:none;pointer-events:auto;`;
        label.textContent = `[CODE: ${code || 'N/A'}] [${cur}/${total}]`;
        wrapper.appendChild(label);

        return wrapper;
    }

    // =========================================================
    // [UI ENGINE]
    // =========================================================
    const GLYPH = `
    <svg viewBox="0 0 128 128" style="width:24px;height:24px;filter:drop-shadow(0 0 6px ${CFG.ACCENT});">
        <style>
            .g1{transform-origin:center;animation:sp 10s linear infinite;}
            .g2{transform-origin:center;animation:sp 15s linear infinite reverse;}
            @keyframes sp{100%{transform:rotate(360deg);}}
        </style>
        <path class="g1" d="M64,12 A52,52 0 1 1 63.9,12Z" fill="none" stroke="${CFG.ACCENT}" stroke-dasharray="21.78 21.78" stroke-width="2"/>
        <path class="g2" d="M64,20 A44,44 0 1 1 63.9,20Z" fill="none" stroke="${CFG.ACCENT}" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/>
        <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47Z" fill="none" stroke="${CFG.ACCENT}" stroke-width="3"/>
        <text x="64" y="76" text-anchor="middle" dominant-baseline="middle"
              fill="${CFG.ACCENT}" font-size="46" font-weight="700" font-family="monospace">Ψ</text>
    </svg>`;

    function buildUI() {
        if (document.getElementById('igBigContainer')) return;
        log('Building UI...');

        // Hide dock glyph while viewer is open
        const dock = document.getElementById('4ndr0666-dock');
        if (dock) dock.style.display = 'none';

        document.body.style.overflow = 'hidden';
        const gui = document.createElement('div');
        gui.id = 'igBigContainer';
        gui.style.cssText =
            `background:${CFG.BG};width:100vw;height:100vh;z-index:2147483647;` +
            `position:fixed;top:0;left:0;overflow-y:auto;color:#fff;`;

        gui.innerHTML = `
        <div id="ares-header" style="position:sticky;top:0;background:rgba(0,0,0,0.95);padding:15px;
            border-bottom:1px solid #111;display:flex;justify-content:space-between;align-items:center;
            z-index:2147483648;backdrop-filter:blur(10px);">
            <div>
                <div style="color:${CFG.ACCENT};font-family:monospace;font-weight:900;letter-spacing:1px;">
                    ARES-9 // SINGULARITY V6.1</div>
                <div id="ares-stat" style="color:#555;font-family:monospace;font-size:10px;margin-top:4px;">
                    INTERCEPTING FEED...</div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
                <button id="ares-more" style="background:#001a00;color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};
                    padding:6px 14px;cursor:pointer;font-family:monospace;font-weight:bold;">LOAD MORE</button>
                <button id="ares-dump" style="background:transparent;color:#aaa;border:1px solid #333;
                    padding:6px 14px;cursor:pointer;font-family:monospace;">DUMP HTML</button>
                <button id="ares-exit" style="background:transparent;color:${CFG.ERROR};border:1px solid #500;
                    padding:6px 16px;cursor:pointer;font-family:monospace;font-weight:bold;">EXIT</button>
            </div>
        </div>
        <div id="igAllImages" style="padding:80px 0 300px;display:flex;flex-direction:column;align-items:center;"></div>`;

        document.documentElement.appendChild(gui);

        document.getElementById('ares-exit').onclick = () =>
            window.location.assign(window.location.href.split('?')[0]);

        document.getElementById('ares-dump').onclick = () => {
            const blob = new Blob([document.querySelector('#igAllImages').innerHTML], {type:'text/html'});
            const a    = document.createElement('a');
            a.href     = URL.createObjectURL(blob);
            a.download = `4ndr0666_dump_${STATE.userId || 'feed'}.html`;
            a.click();
        };

        document.getElementById('ares-more').onclick = () => {
            const cur = STATE.cursors[STATE.MODE] ||
                        STATE.cursors['profile']  ||
                        STATE.cursors['home']     || null;
            activeFetch(cur);
        };

        NeuralDOM.observe(gui);

        setInterval(() => {
            const el = document.getElementById('ares-stat');
            if (!el) return;
            const active = STATE.domNodes.filter(n => !n.isPruned).length;
            el.textContent =
                `ACTIVE:${active} | TOTAL:${STATE.totalLoaded} | UID:${STATE.userId || '…'} ` +
                `| MODE:${STATE.MODE.toUpperCase()} | BUFFERED:${STATE.pendingItems.length}`;
        }, 1000);

        STATE.uiReady = true;

        // Drain items buffered before UI existed
        if (STATE.pendingItems.length) {
            const drained = STATE.pendingItems.splice(0);
            const cur     = STATE.cursors[STATE.MODE] || STATE.cursors['profile'] || null;
            renderBatch(drained, cur);
        }
    }

    // =========================================================
    // [EXECUTE RECON]
    // =========================================================
    async function executeRecon() {
        if (STATE.executed) { log('Already running.'); return; }
        STATE.executed = true;
        log('Booting kernel...');

        // Determine mode
        const loc = location.href;
        if      (loc.match(/instagram\.com\/?(\?|$|#)/)) STATE.MODE = 'home';
        else if (loc.includes('/tagged/'))               STATE.MODE = 'tagged';
        else if (loc.includes('/explore/'))              STATE.MODE = 'explore';
        else if (loc.includes('/p/') || loc.includes('/reel/')) STATE.MODE = 'post';
        else                                              STATE.MODE = 'profile';

        resolveUserId();
        buildUI();

        // Trigger a first active fetch — if intercept already caught something
        // the dedupe will suppress duplicates gracefully.
        activeFetch(null);
    }

    // =========================================================
    // [INJECTION ENGINE]
    // Strategy 1 : append Ψ glyph to IG's own tab-bar
    // Strategy 2 : fixed-position dock (fallback for non-profile pages)
    // Strategy 3 : Alt+I hotkey (always works, no DOM dependency)
    // Strategy 4 : GM menu command
    // =========================================================
    function injectTrigger() {
        if (STATE.injected) return;

        const tablist = document.querySelector('div[role="tablist"]');
        const fallback = document.querySelector(
            'div.fx7hk, main header section, ._aak6, div[class*="x9f619"]');

        if (tablist) {
            STATE.injected = true;
            const dock = document.createElement('div');
            dock.id           = '4ndr0666-dock';
            dock.title        = 'ARES-9 — Alt+I or click';
            dock.innerHTML    = GLYPH;
            dock.style.cssText =
                'cursor:pointer;margin-left:20px;display:flex;align-items:center;' +
                'opacity:0.7;transition:transform 0.2s,opacity 0.2s;height:52px;';
            dock.onmouseover  = () => { dock.style.opacity='1'; dock.style.transform='scale(1.15)'; };
            dock.onmouseout   = () => { dock.style.opacity='0.7'; dock.style.transform='scale(1)'; };
            dock.onclick      = (e) => { e.preventDefault(); e.stopPropagation(); executeRecon(); };
            tablist.appendChild(dock);
            log('Tab-bar glyph injected.');

        } else if (fallback && !document.getElementById('4ndr0666-dock')) {
            STATE.injected = true;
            const dock = document.createElement('div');
            dock.id           = '4ndr0666-dock';
            dock.title        = 'ARES-9 — Alt+I or click';
            dock.innerHTML    = GLYPH;
            dock.style.cssText =
                'position:fixed;bottom:28px;left:88px;z-index:2147483646;' +
                'cursor:pointer;opacity:0.65;transition:transform 0.2s,opacity 0.2s;';
            dock.onmouseover  = () => { dock.style.opacity='1'; dock.style.transform='scale(1.15)'; };
            dock.onmouseout   = () => { dock.style.opacity='0.65'; dock.style.transform='scale(1)'; };
            dock.onclick      = (e) => { e.preventDefault(); executeRecon(); };
            document.body.appendChild(dock);
            log('Fixed-dock glyph injected (fallback).');
        }
    }

    // =========================================================
    // [HOTKEY]  Alt + I  — fires regardless of DOM state
    // =========================================================
    function registerHotkey() {
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key.toLowerCase() === CFG.HOTKEY) {
                e.preventDefault();
                log(`Hotkey Alt+${CFG.HOTKEY.toUpperCase()} triggered.`);
                executeRecon();
            }
        }, true);
    }

    // =========================================================
    // [BOOT]
    // =========================================================
    function boot() {
        // GM menu — works from any state
        GM_registerMenuCommand('Ψ ARES-9 — Execute Recon', executeRecon);

        // Hotkey — registered immediately
        registerHotkey();

        // DOM injection loop — tries every 1.5 s until it lands
        const daemon = setInterval(() => {
            if (document.getElementById('igBigContainer')) {
                clearInterval(daemon); // UI is open, stop polling
                return;
            }
            injectTrigger();
        }, 1500);

        // Last-resort: if nothing injected after 30 s, force a fixed dock
        setTimeout(() => {
            if (!STATE.injected && document.body) {
                STATE.injected = true;
                const dock = document.createElement('div');
                dock.id           = '4ndr0666-dock';
                dock.title        = 'ARES-9 — click or Alt+I';
                dock.innerHTML    = GLYPH;
                dock.style.cssText =
                    'position:fixed;bottom:28px;left:88px;z-index:2147483646;' +
                    'cursor:pointer;opacity:0.65;';
                dock.onclick = (e) => { e.preventDefault(); executeRecon(); };
                document.body.appendChild(dock);
                log('Forced fixed-dock after 30s timeout.');
            }
        }, 30000);
    }

    log('V6.1 active — intercept hooks planted. Press Alt+I or click Ψ to execute recon.');

    if (document.body) boot();
    else window.addEventListener('DOMContentLoaded', boot);

})();
