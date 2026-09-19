// ==UserScript==
// @name         4ndr0tools - Instagram++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      13.0.0
// @description  Tab-Bar + Dock Integration. Hotkey trigger (Alt+I). Ad-Blocking. Deep-Stack Recovery. Resilient cursor-based pagination. Stories support. Image/video download engine.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*.instagram.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @grant        unsafeWindow
// @connect      cdninstagram.com
// @connect      *.cdninstagram.com
// @connect      fbcdn.net
// @connect      *.fbcdn.net
// @connect      instagram.com
// @connect      *.instagram.com
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
        SAFE_ZONE:   15,        // nodes from end never pruned
        CACHE_LIMIT: 80,        // total nodes before pruning head
        HYDRATE_PX:  3000,
        PRUNE_PX:    6000,
        HOTKEY:      'i',       // Alt + I
        FETCH_TIMEOUT_MS:    15000,  // hard ceiling on any single API/network call
        DOWNLOAD_TIMEOUT_MS: 120000, // media bytes are much larger than API JSON
        DOWNLOAD_STAGGER_MS: 350,    // pacing between queued downloads
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
        lastError:    null,
        sentinelObserver: null,  // IntersectionObserver driving pagination; never bound to a content node
    };

    // Use unsafeWindow so monkey-patches affect the real page context
    const win = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    const log = (msg) =>
        console.log(`%c[ARES-9 V7.0] %c${msg}`,
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
        /\/api\/v1\/feed\/reels_media/,
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
    // =========================================================
    // [NATIVE SCROLL DRIVER]
    // Keeps Instagram's OWN infinite-scroll advancing in the background.
    // Its pagination trigger is a real IntersectionObserver watching actual
    // document scroll position — nothing here fakes that with a synthetic
    // event; it moves the real scroll position, the same as a user would.
    // =========================================================
    const NativeScrollDriver = {
        timer: null,
        stableRounds: 0,

        start() {
            if (this.timer) return;
            this.stableRounds = 0;
            this.timer = setInterval(() => this.tick(), 1500);
        },

        stop() {
            clearInterval(this.timer);
            this.timer = null;
        },

        tick() {
            const before = STATE.totalLoaded;
            window.scrollTo(0, document.documentElement.scrollHeight);

            setTimeout(() => {
                if (STATE.totalLoaded === before) {
                    this.stableRounds++;
                    if (this.stableRounds >= 8) {
                        this.stop();
                        log('Native auto-scroll paused — no new content after several attempts (likely end of feed). Click LOAD MORE to try again.');
                    }
                } else {
                    this.stableRounds = 0;
                }
            }, 1000);
        },

        kick() {
            if (this.timer) { this.tick(); return; }
            this.start();
        },
    };

    // Instagram's private API is known to serialize a Python None as the
    // literal string "None" rather than JSON null for some pagination
    // fields — a well-documented quirk, not a one-off glitch. Taking that
    // string at face value as "here is a real cursor" produces a request
    // like ?max_id=None, which the server correctly rejects. Normalizing
    // here, once, protects every downstream consumer of STATE.cursors.
    function normalizeCursor(c) {
        if (c === null || c === undefined) return null;
        const s = String(c);
        return (s === '' || s === 'None' || s === 'null' || s === 'undefined') ? null : c;
    }

    function harvestJSON(json, url) {
        let items = [], cursor = null, recognized = true;

        // Schema A: REST v1  feed/user or feed/usertags
        if (json.items || json.feed_items) {
            items  = json.items ||
                     (json.feed_items || []).map(i => i.media_or_ad || i.media).filter(Boolean);
            cursor = normalizeCursor(json.next_max_id);
            if (!STATE.userId) STATE.userId = items[0]?.user?.pk_id || items[0]?.user?.pk;
        }
        // Schema B: classic GraphQL edge_owner_to_timeline_media
        else if (json.data?.user?.edge_owner_to_timeline_media) {
            const tl = json.data.user.edge_owner_to_timeline_media;
            items  = (tl.edges || []).map(e => e.node);
            cursor = normalizeCursor(tl.page_info?.end_cursor);
            STATE.userId = STATE.userId || json.data.user.id;
        }
        // Schema C: newer xdt_api relay connection
        else if (json.data?.xdt_api__v1__feed__user_timeline_graphql_connection) {
            const conn = json.data.xdt_api__v1__feed__user_timeline_graphql_connection;
            items  = (conn.edges || []).map(e => e.node);
            cursor = normalizeCursor(conn.page_info?.end_cursor);
        }
        // Schema D: home sessions
        else if (json.data?.xdt_api__v1__feed__home_connection) {
            const conn = json.data.xdt_api__v1__feed__home_connection;
            items  = (conn.edges || []).map(e => e.node?.media || e.node).filter(Boolean);
            cursor = normalizeCursor(conn.page_info?.end_cursor);
        }
        // Schema F: Stories (reels_media) — a fixed, ephemeral set, never paginated
        else if (json.reels) {
            items  = Object.values(json.reels).flatMap(r => r.items || []);
            cursor = null;
            if (!STATE.userId) {
                const firstKey = Object.keys(json.reels)[0];
                STATE.userId = STATE.userId || firstKey || null;
            }
        }
        // Schema E: deep-scan blobs/Bloks (last resort)
        else {
            items = deepFindMedia(json);
            // /graphql/query and /api/graphql are broad catch-alls that match
            // most GraphQL traffic on the page (comments, likes, notification
            // badges, etc.), not just feed data. A miss there is the expected,
            // common case — not evidence of an API change — so it must not be
            // reported as "unrecognized." Only a miss on a URL that specifically
            // claims to be a feed/media endpoint is genuinely diagnostic.
            const isGenericProbe = /\/graphql\/query/.test(url) || /\/api\/graphql/.test(url)
                                    || url === 'inline-scan';
            recognized = items.length > 0 || isGenericProbe;
        }

        // Generalized userId fallback: every known IG media node — regardless
        // of which connection wrapper delivered it (Schema A-F all end up
        // handing back items shaped like a media object) — carries its
        // author on a `user` or `owner` sub-object. This has stayed constant
        // across IG API generations even as the outer query/connection
        // wrapper names have churned. Schemas C and D never set STATE.userId
        // on their own (their connection wrapper doesn't carry the owner at
        // that level), which live testing showed can leave STATE.userId
        // permanently null — with real items already harvested — silently
        // blocking activeFetch's profile branch forever. This runs for every
        // schema as a no-op safety net: it only ever fires when nothing else
        // already resolved the id.
        if (!STATE.userId && items.length) {
            const uid = deriveUserId(items[0]);
            if (uid) { STATE.userId = uid; log(`UID via harvested media node: ${STATE.userId}`); }
        }

        const rawCount = items.length;

        if (!rawCount) {
            if (!recognized) {
                log(`Unrecognized response shape from ${url} — Instagram may have changed their API.`);
            }
            return { itemsHarvested: 0, cursor, recognized };
        }

        // Persist cursor immediately, unconditionally. This MUST happen before
        // the dedup step below: a page whose items are entirely duplicates
        // (e.g. a re-delivered page during a race between passive intercept
        // and an active fetch) still carries a valid "next" cursor. Persisting
        // it only after a successful dedup — the previous behavior — meant a
        // single all-duplicate page permanently stranded STATE.cursors on a
        // stale value, since nothing ever advanced it again: every subsequent
        // auto-scroll trigger AND every manual "Load More" click would then
        // keep re-requesting that exact same already-seen page forever. This
        // was the root cause of pagination silently halting on both paths.
        if (cursor) {
            const mode = url.includes('timeline')     ? 'home'
                       : url.includes('reels_media')   ? 'stories'
                       : 'profile';
            STATE.cursors[mode] = cursor;
        }

        // Deduplicate
        items = items.filter(item => {
            const id = item.pk || item.id || item.code;
            if (!id || STATE._seen.has(id)) return false;
            STATE._seen.add(id);
            return true;
        });

        if (!items.length) {
            log(`Fetched ${rawCount} item(s) from ${url}; all already seen (0 new).`);
            return { itemsHarvested: 0, cursor, recognized: true };
        }

        log(`Harvested ${items.length} items via intercept.`);

        if (STATE.uiReady) renderBatch(items, cursor);
        else STATE.pendingItems.push(...items);

        return { itemsHarvested: items.length, cursor, recognized: true };
    }

    // Instagram frequently server-renders a single post/story/reel's media
    // straight into the page's own <script type="application/json"> tags —
    // no fetch/XHR ever happens for it, so the passive intercept never sees
    // it. This sweeps those tags through the same harvestJSON pipeline used
    // for network responses, so a global download click works even on a
    // page where nothing has been intercepted yet.
    function harvestInlineJSON() {
        document.querySelectorAll('script[type="application/json"]').forEach(s => {
            try {
                harvestJSON(JSON.parse(s.textContent), 'inline-scan');
            } catch (_) { /* most script tags on the page aren't media JSON at all */ }
        });
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

    // Every IG media node — regardless of which connection wrapper delivered
    // it — carries its author on a `user` or `owner` sub-object. This is the
    // stable part of the contract; the wrapper naming around it is the part
    // that churns.
    function deriveUserId(item) {
        return item?.user?.pk_id  || item?.user?.pk  || item?.user?.id  ||
               item?.owner?.pk_id || item?.owner?.pk  || item?.owner?.id || null;
    }

    // =========================================================
    // [RESILIENCE UTILITIES]
    // Every external call gets a hard, system-level timeout. Without this,
    // a stalled network request never resolves or rejects, so it never
    // reaches STATE.isFetching = false, which silently and permanently
    // disables both auto-scroll pagination and the manual Load More button
    // (activeFetch's own busy-guard would refuse every future call).
    // =========================================================
    function fetchWithTimeout(url, options = {}, ms = CFG.FETCH_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timer));
    }

    function withTimeout(promise, ms, label) {
        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms);
        });
        return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
    }

    // GM_xmlhttpRequest is dispatched by the extension itself, outside the
    // page's JS context entirely — it does not go through window.fetch or
    // XMLHttpRequest.prototype, so no other userscript's monkey-patching of
    // those (privacy blockers, anti-tracking shields, etc.) can see or
    // interfere with it, and it isn't subject to the page's CORS policy.
    function gmFetchBlob(url, timeoutMs) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'function') {
                reject(new Error('GM_xmlhttpRequest unavailable'));
                return;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'blob',
                timeout: timeoutMs,
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300 && res.response) resolve(res.response);
                    else reject(new Error(`GM_xmlhttpRequest HTTP ${res.status}`));
                },
                onerror:   () => reject(new Error('GM_xmlhttpRequest network error')),
                ontimeout: () => reject(new Error('GM_xmlhttpRequest timed out')),
            });
        });
    }

    async function saveBlob(blob, filename) {
        const objUrl = URL.createObjectURL(blob);
        try {
            const a = document.createElement('a');
            a.href = objUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } finally {
            URL.revokeObjectURL(objUrl);
        }
    }

    // Resolve the best-quality source URL for a media node once, shared by
    // both the renderer and the download engine so the two never drift.
    // Some videos (notably Reels) ship only a DASH manifest with no
    // progressive video_versions entry — the same gap ig_extract.py's
    // Representation/BaseURL walk exists to cover. Mirrored here with
    // DOMParser since the browser has no ElementTree.
    function bestDashUrl(manifestXml) {
        try {
            const doc = new DOMParser().parseFromString(manifestXml, 'application/xml');
            if (doc.querySelector('parsererror')) return null;
            const best = [...doc.getElementsByTagName('Representation')]
                .map(r => ({
                    bw:   parseInt(r.getAttribute('bandwidth') || '0', 10),
                    base: r.getElementsByTagName('BaseURL')[0]?.textContent?.trim(),
                }))
                .filter(r => r.base)
                .sort((a, b) => b.bw - a.bw)[0];
            return best ? best.base.replace(/&amp;/g, '&') : null;
        } catch (_) {
            return null;
        }
    }

    // One shared badge factory. asset is resolved lazily via getAsset() at
    // CLICK time (not creation time) so a video whose real URL only becomes
    // known later — once harvested — still downloads correctly without the
    // badge needing to be re-created.
    function makeDownloadBadge(getAsset) {
        const btn = document.createElement('div');
        btn.className = 'ares-dl-badge';
        btn.textContent = '⭳';
        btn.title = 'Download this media';
        btn.style.cssText =
            'position:absolute;top:8px;right:8px;z-index:2147483000;' +
            'width:26px;height:26px;display:flex;align-items:center;justify-content:center;' +
            `background:rgba(0,20,0,0.75);color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};` +
            'border-radius:6px;font-size:14px;line-height:1;cursor:pointer;font-family:monospace;' +
            'opacity:0.85;pointer-events:auto;';
        btn.onmouseover = () => { btn.style.opacity = '1'; };
        btn.onmouseout  = () => { btn.style.opacity = '0.85'; };
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const { url, isVideo, name } = getAsset();
            if (!url) { log('No downloadable source found for this item yet.'); return; }
            const ext = isVideo ? 'mp4' : 'jpg';
            DownloadEngine.enqueue(url, DownloadEngine.sanitize(`${name}.${ext}`));
        };
        return btn;
    }

    function pickMediaAsset(media) {
        const isVideo = !!(media.video_versions || media.is_video || media.video_dash_manifest);
        if (isVideo) {
            const vids = media.video_versions || [];
            const best = vids.length ? vids.reduce((a, b) => a.width > b.width ? a : b) : null;
            let url = best?.url || media.video_url || '';
            if (!url && media.video_dash_manifest) url = bestDashUrl(media.video_dash_manifest) || '';
            return { url, isVideo: true };
        }
        const cands = media.image_versions2?.candidates || media.display_resources || [];
        const best  = cands.length ? cands.reduce((a, b) => a.width > b.width ? a : b) : null;
        return { url: best?.url || media.url || media.display_url || '', isVideo: false };
    }

    // =========================================================
    // [DOWNLOAD ENGINE]
    // Saves images/videos/stories to disk. GM_download is the correct tool
    // here (not a raw <a download> anchor): Instagram serves media from a
    // separate CDN origin, and browsers silently ignore the `download`
    // attribute on cross-origin links, opening a new tab instead of saving.
    // Falls back to a fetch+blob anchor for environments without GM_download,
    // and finally to opening the raw URL so the user can always save
    // manually — never a silent dead end.
    // =========================================================
    const DownloadEngine = {
        queue:  [],
        active: false,

        sanitize(name) {
            return String(name).replace(/[^\w.\-]+/g, '_').slice(0, 120);
        },

        async saveOne(url, filename) {
            if (!url) throw new Error('No source URL for media.');

            // Tier 1 — GM_download: the browser's native download manager,
            // dispatched by the extension itself.
            if (typeof GM_download === 'function') {
                try {
                    await withTimeout(new Promise((resolve, reject) => {
                        GM_download({
                            url, name: filename,
                            onload:    resolve,
                            onerror:   (e) => reject(new Error(`GM_download failed: ${e?.error || 'unknown'}`)),
                            ontimeout: () => reject(new Error('GM_download timed out')),
                        });
                    }), CFG.DOWNLOAD_TIMEOUT_MS, `download:${filename}`);
                    return;
                } catch (err) {
                    log(`GM_download failed for ${filename} (${err.message}) — trying GM_xmlhttpRequest...`);
                }
            }

            // Tier 2 — GM_xmlhttpRequest: still privileged/extension-level,
            // so it is immune to any OTHER userscript's page-context
            // fetch/XHR patching (e.g. a privacy blocker's network shield)
            // and to the page's own CORS policy.
            if (typeof GM_xmlhttpRequest === 'function') {
                try {
                    const blob = await gmFetchBlob(url, CFG.DOWNLOAD_TIMEOUT_MS);
                    await saveBlob(blob, filename);
                    return;
                } catch (err) {
                    log(`GM_xmlhttpRequest fallback failed for ${filename} (${err.message}) — trying page fetch...`);
                }
            }

            // Tier 3 — last resort: the page's own fetch. This is the one
            // layer other userscripts sharing this page can and do rewrite,
            // so it's tried last, not first.
            const res = await fetchWithTimeout(url, {}, CFG.DOWNLOAD_TIMEOUT_MS);
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching media.`);
            const blob = await res.blob();
            await saveBlob(blob, filename);
        },

        enqueue(url, filename) {
            this.queue.push({ url, filename });
            this.drain();
        },

        async drain() {
            if (this.active) return;
            this.active = true;
            try {
                while (this.queue.length) {
                    const { url, filename } = this.queue.shift();
                    try {
                        await this.saveOne(url, filename);
                        log(`Downloaded: ${filename}`);
                    } catch (err) {
                        log(`Download failed for ${filename}: ${err.message}`);
                        try { window.open(url, '_blank'); } catch (_) {}
                    }
                    await new Promise(r => setTimeout(r, CFG.DOWNLOAD_STAGGER_MS));
                }
            } finally {
                this.active = false;
            }
        },
    };

    // Single shared "download everything currently known" action. Sources
    // both STATE.pendingItems (harvested before the wall UI ever got built —
    // buildUI() drains this into domNodes the moment it runs, so the two
    // never overlap) and STATE.domNodes (rendered items, data survives
    // virtualization pruning). Used by both the wall's DOWNLOAD ALL button
    // and the always-present global button, so there is one implementation,
    // not two that can drift.
    function downloadAllKnownMedia() {
        const items = [...STATE.pendingItems, ...STATE.domNodes.map(n => n.data)].filter(Boolean);
        if (!items.length) {
            log('No media known yet — try scrolling this page first, or open recon.');
            return;
        }
        log(`Queuing ${items.length} item(s) for download...`);
        items.forEach((data, i) => {
            const asset = pickMediaAsset(data);
            if (!asset.url) return;
            const code     = data.code || '';
            const ext      = asset.isVideo ? 'mp4' : 'jpg';
            const filename = DownloadEngine.sanitize(
                `${STATE.userId || 'ig'}_${code || data.pk || i}_${i + 1}.${ext}`);
            DownloadEngine.enqueue(asset.url, filename);
        });
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

    // www.instagram.com is the confirmed-working host for these REST v1
    // feed endpoints (same header shape resolveUserId's web_profile_info
    // call already uses successfully). i.instagram.com — the legacy
    // mobile-API host these endpoints originally lived on, and the host
    // that started 404ing outright — is kept as an automatic fallback:
    // Instagram has now moved this host once, so if it moves again a live
    // capture becomes the diagnostic step, not a required code change.
    async function fetchIgRest(pathAndQuery, options, timeoutMs) {
        const hosts = ['https://www.instagram.com', 'https://i.instagram.com'];
        let lastErr;
        for (const host of hosts) {
            const url = host + pathAndQuery;
            try {
                const res = await fetchWithTimeout(url, options, timeoutMs);
                if (!res.ok) {
                    lastErr = new Error(`HTTP ${res.status} from ${url}`);
                    continue;
                }
                // A 2xx status is not proof this is real API data — this host
                // can serve an HTML page (login wall, SPA shell) with a 200.
                const text = await res.text();
                try {
                    return { json: JSON.parse(text), url };
                } catch (_) {
                    const snippet = text.slice(0, 40).replace(/\s+/g, ' ');
                    lastErr = new Error(`Non-JSON response from ${url} (starts with "${snippet}")`);
                }
            } catch (err) {
                lastErr = err;
            }
        }
        throw lastErr;
    }

    async function activeFetch(cursor) {
        // Profile and home pagination goes through NativeScrollDriver, not a
        // direct REST v1 call. Across three rounds of live testing,
        // /api/v1/feed/user/{id}/ and /api/v1/feed/timeline/ failed in three
        // different ways on both hosts tried — wrong host, a "None"-string
        // cursor, and finally a genuine 404 on a syntactically valid cursor
        // on BOTH www.instagram.com and i.instagram.com. That progression
        // points at the endpoint no longer being reachable from a browser
        // context for paginated requests at all — not at a header, host, or
        // cursor bug patchable from here. Instagram's own web client's
        // pagination has shown zero failures in every log in this thread
        // (it is what the passive intercept has been harvesting from all
        // along), so "load more" for these modes now just drives that
        // directly instead of repeating a call with three rounds of
        // evidence against it.
        if (STATE.MODE === 'profile' || STATE.MODE === 'home') {
            NativeScrollDriver.kick();
            return;
        }

        if (STATE.isFetching) {
            log('Fetch already in progress — ignoring duplicate trigger.');
            return;
        }
        STATE.isFetching = true;
        STATE.lastError  = null;

        try {
            let json, url, mode;

            if (STATE.MODE === 'stories') {
                if (!STATE.userId) {
                    log('No userId yet for stories — waiting for resolution.');
                    return;
                }
                mode = 'stories';
                const { json: j, url: reqUrl } = await fetchIgRest(
                    `/api/v1/feed/reels_media/?reel_ids=${STATE.userId}`,
                    { headers: baseHeaders(), credentials: 'include' }, CFG.FETCH_TIMEOUT_MS);
                url = reqUrl; json = j;

            } else {
                log('No userId yet — waiting for intercept to provide one.');
                return;
            }

            const result = harvestJSON(json, url);
            if (result && !result.recognized) {
                STATE.lastError = 'Unrecognized API response — Instagram may have changed their schema.';
            } else if (result && result.itemsHarvested === 0 && !result.cursor) {
                log(`END OF FEED reached for mode "${mode}".`);
            } else if (result && result.itemsHarvested === 0 && result.cursor) {
                log(`Page returned only already-seen items; cursor advanced for mode "${mode}".`);
            }

        } catch (err) {
            STATE.lastError = err?.message || String(err);
            log(`Fetch failed: ${STATE.lastError}`);
        } finally {
            STATE.isFetching = false;
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
        const rootMatch  = location.pathname.match(/^\/([a-zA-Z0-9._]{1,30})\/?$/);
        const storyMatch = location.pathname.match(/^\/stories\/([a-zA-Z0-9._]{1,30})\//);
        const username   = storyMatch?.[1] || rootMatch?.[1];
        const SKIP = ['explore', 'reels', 'stories', 'direct', 'accounts', 'tv'];
        if (username && (storyMatch || !SKIP.includes(username))) {
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

        // Pagination sentinel: a dedicated, non-content node — never registered
        // in STATE.domNodes — so NeuralDOM virtualization can never detach or
        // replace it out from under a live IntersectionObserver. (Previously
        // the observer targeted a real content node's item.node; pruning
        // later swapped that exact node for a placeholder, permanently
        // orphaning the trigger with zero visible error.)
        if (STATE.sentinelObserver) {
            STATE.sentinelObserver.disconnect();
            STATE.sentinelObserver = null;
        }
        document.getElementById('ares-sentinel')?.remove();

        if (cursor) {
            const container = document.querySelector('#igBigContainer');
            const sentinel  = document.createElement('div');
            sentinel.id = 'ares-sentinel';
            sentinel.style.cssText = 'height:1px;width:100%;';
            wall.appendChild(sentinel);

            const obs = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting) {
                    obs.disconnect();
                    STATE.sentinelObserver = null;
                    activeFetch(cursor);
                }
            }, { root: container, rootMargin: '1500px' });
            obs.observe(sentinel);
            STATE.sentinelObserver = obs;
        }
    }

    function createMediaComponent(media, parent, cur, total) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText =
            'margin-bottom:80px;display:flex;flex-direction:column;align-items:center;width:100%;' +
            'transition:opacity 0.3s;pointer-events:auto;';

        const code  = media.code || parent?.code || '';
        const link  = code ? `https://www.instagram.com/p/${code}/` : '#';
        const asset = pickMediaAsset(media);

        // mediaBox wraps ONLY the actual image/video (shrink-to-fit,
        // position:relative) so the badge's top:8px;right:8px lands on that
        // specific media's own corner — not the wider card, which matters
        // once a post has more than one photo/video.
        const mediaBox = document.createElement('div');
        mediaBox.style.cssText = 'position:relative;display:inline-block;max-width:100%;';

        if (asset.isVideo) {
            const vid  = document.createElement('video');
            vid.src        = asset.url;
            vid.controls   = true;
            vid.volume     = CFG.VOLUME;
            vid.preload    = 'metadata';
            vid.style.cssText =
                `max-height:${window.innerHeight * CFG.H_PCT}px;` +
                `max-width:${window.innerWidth  * CFG.W_PCT}px;` +
                `border:2px solid ${CFG.ACCENT};display:block;pointer-events:auto;`;
            mediaBox.appendChild(vid);
        } else {
            const img   = document.createElement('img');
            img.src             = asset.url;
            img.loading         = 'lazy';
            img.style.cssText   =
                `max-height:${window.innerHeight * CFG.H_PCT}px;` +
                `max-width:${window.innerWidth  * CFG.W_PCT}px;` +
                `border:1px solid #333;display:block;cursor:pointer;pointer-events:auto;`;
            const a    = document.createElement('a');
            a.href     = link;
            a.target   = '_blank';
            a.style.cssText = 'display:block;';
            a.appendChild(img);
            mediaBox.appendChild(a);
        }

        mediaBox.appendChild(makeDownloadBadge(() => ({
            url:     asset.url,
            isVideo: asset.isVideo,
            name:    `${STATE.userId || 'ig'}_${code || media.pk || Date.now()}_${cur}of${total}`,
        })));
        wrapper.appendChild(mediaBox);

        const footer = document.createElement('div');
        footer.style.cssText =
            'margin-top:12px;display:flex;gap:10px;align-items:center;pointer-events:auto;';

        const label = document.createElement('a');
        label.href            = link;
        label.target          = '_blank';
        label.style.cssText   =
            `font-family:monospace;font-size:11px;color:${CFG.ACCENT};` +
            `opacity:0.6;text-decoration:none;pointer-events:auto;`;
        label.textContent = `[CODE: ${code || 'N/A'}] [${cur}/${total}]`;
        footer.appendChild(label);

        wrapper.appendChild(footer);

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

        // NOTE: previously set document.body.style.overflow = 'hidden' here.
        // #igBigContainer below is a separate, full-viewport fixed overlay
        // with its OWN internal scroll (overflow-y:auto on itself) — it does
        // not use document/window scroll at all. Instagram's native feed
        // underneath still lives on ordinary document scroll, and its own
        // infinite-scroll is an IntersectionObserver watching real viewport
        // position. Freezing document scroll meant that native trigger could
        // never intersect again once the wall opened, so pagination only
        // ever advanced when the user manually scrolled the (invisible,
        // covered) native page underneath to work around it. NativeScrollDriver
        // below now does that scrolling programmatically instead.
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
                    ARES-9 // SINGULARITY V7.0</div>
                <div id="ares-stat" style="color:#555;font-family:monospace;font-size:10px;margin-top:4px;">
                    INTERCEPTING FEED...</div>
            </div>
            <div style="display:flex;gap:12px;align-items:center;">
                <button id="ares-more" style="background:#001a00;color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};
                    padding:6px 14px;cursor:pointer;font-family:monospace;font-weight:bold;">LOAD MORE</button>
                <button id="ares-dlall" style="background:transparent;color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};
                    padding:6px 14px;cursor:pointer;font-family:monospace;">⭳ DOWNLOAD ALL</button>
                <button id="ares-dump" style="background:transparent;color:#aaa;border:1px solid #333;
                    padding:6px 14px;cursor:pointer;font-family:monospace;">DUMP HTML</button>
                <button id="ares-exit" style="background:transparent;color:${CFG.ERROR};border:1px solid #500;
                    padding:6px 16px;cursor:pointer;font-family:monospace;font-weight:bold;">EXIT</button>
            </div>
        </div>
        <div id="igAllImages" style="padding:80px 0 300px;display:flex;flex-direction:column;align-items:center;"></div>`;

        document.documentElement.appendChild(gui);

        document.getElementById('ares-exit').onclick = () => {
            NativeScrollDriver.stop();
            window.location.assign(window.location.href.split('?')[0]);
        };

        document.getElementById('ares-dump').onclick = () => {
            const blob = new Blob([document.querySelector('#igAllImages').innerHTML], {type:'text/html'});
            const a    = document.createElement('a');
            a.href     = URL.createObjectURL(blob);
            a.download = `4ndr0666_dump_${STATE.userId || 'feed'}.html`;
            a.click();
        };

        document.getElementById('ares-more').onclick = () => {
            const cur = normalizeCursor(
                STATE.cursors[STATE.MODE] ||
                STATE.cursors['profile']  ||
                STATE.cursors['home']     ||
                STATE.cursors['stories']  || null);
            activeFetch(cur);
        };

        document.getElementById('ares-dlall').onclick = () => {
            harvestInlineJSON();
            downloadAllKnownMedia();
        };

        NeuralDOM.observe(gui);

        setInterval(() => {
            const el = document.getElementById('ares-stat');
            if (!el) return;
            const active = STATE.domNodes.filter(n => !n.isPruned).length;
            const parts = [
                `ACTIVE:${active}`,
                `TOTAL:${STATE.totalLoaded}`,
                `UID:${STATE.userId || '…'}`,
                `MODE:${STATE.MODE.toUpperCase()}`,
                `BUFFERED:${STATE.pendingItems.length}`,
            ];
            if (STATE.isFetching) parts.push('FETCHING…');
            if (DownloadEngine.queue.length || DownloadEngine.active) parts.push(`DL:${DownloadEngine.queue.length}`);
            if (STATE.lastError) parts.push(`ERR:${STATE.lastError}`);
            el.textContent = parts.join(' | ');
        }, 1000);

        STATE.uiReady = true;

        if (STATE.MODE !== 'post' && STATE.MODE !== 'stories') {
            NativeScrollDriver.start();
        }

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
        else if (loc.includes('/stories/'))              STATE.MODE = 'stories';
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
    // [NATIVE MEDIA OVERLAY]
    // Puts the same badge directly on Instagram's OWN <img>/<video>
    // elements — on every page, continuously, independent of recon/buildUI.
    // =========================================================
    const MediaOverlay = {
        seen: new WeakSet(),

        findCode(el) {
            const a = el.closest('a[href*="/p/"], a[href*="/reel/"], a[href*="/tv/"]');
            const m = a && a.getAttribute('href').match(/\/(?:p|reel|tv)\/([^/?]+)/);
            return m ? m[1] : null;
        },

        // Instagram frequently plays video through a blob: MediaSource URL,
        // which is not itself a downloadable network resource. When that's
        // what we see, fall back to matching this post's shortcode against
        // whatever's already been harvested (network intercept or inline
        // scan) to recover the real CDN url via the same pickMediaAsset used
        // everywhere else.
        resolveVideoUrl(video) {
            const direct = video.currentSrc || video.src;
            if (direct && !direct.startsWith('blob:')) return direct;
            harvestInlineJSON();
            const code = this.findCode(video);
            if (code) {
                const known = [...STATE.pendingItems, ...STATE.domNodes.map(n => n.data)]
                    .find(d => d && d.code === code);
                if (known) return pickMediaAsset(known).url;
            }
            return '';
        },

        inject(el) {
            if (this.seen.has(el) || !el.parentElement) return;
            const isVideo = el.tagName === 'VIDEO';
            const w = el.naturalWidth || el.videoWidth || el.offsetWidth || 0;
            if (!isVideo && w && w < 150) return;   // skip tiny icons/avatars
            this.seen.add(el);

            const parent = el.parentElement;
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
            parent.appendChild(makeDownloadBadge(() => ({
                url:     isVideo ? this.resolveVideoUrl(el) : (el.currentSrc || el.src || ''),
                isVideo,
                name:    `${STATE.userId || 'ig'}_${this.findCode(el) || Date.now()}`,
            })));
        },

        scan(root) {
            root.querySelectorAll('img, video').forEach(el => {
                if (this.seen.has(el)) return;
                if (el.tagName === 'IMG') {
                    const src = el.currentSrc || el.src || '';
                    if (!/cdninstagram\.com|fbcdn\.net/.test(src)) return;
                }
                this.inject(el);
            });
        },

        start() {
            harvestInlineJSON();
            this.scan(document);
            new MutationObserver(muts => {
                for (const m of muts) {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType !== 1) return;
                        if (n.matches && n.matches('img,video')) this.inject(n);
                        if (n.querySelectorAll) this.scan(n);
                    });
                }
            }).observe(document.body, { childList: true, subtree: true });
        },
    };

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

        // Native media overlay — badges directly on the native img/video tags Instagram renders,
        // always present, independent of recon
        MediaOverlay.start();

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

    log('V7.0 active — intercept hooks planted. Press Alt+I or click Ψ to execute recon.');

    if (document.body) boot();
    else window.addEventListener('DOMContentLoaded', boot);

})();
