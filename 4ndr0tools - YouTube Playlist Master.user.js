// ==UserScript==
// @name         4ndr0tools - YouTube Playlist Master
// @namespace    https://github.com/4ndr0666
// @version      1.6.0
// @description  Channel playlist buttons (All / Popular / Videos / Shorts / Streams / Members-only), Random play (prefer newest/oldest), reverse autoplay order, playlist autoplay toggle, duration sort, bulk copy/move/delete, JSON + plaintext export/import, snapshots with deleted-video detection, quick watch_videos playlists, queue & watch-later overlays, playlist close button, date/view metadata, episode auto-expand, huge-playlist browser, live settings (no reload), always-available Ψ deck, playlist row filter, duplicate finder & purge, global hotkeys (Alt+Shift+U/S/X), failsafe deck rescue, 404-proof navigation guards, Trusted-Types-immune rendering, fully-visible fit-content modal dialogs.
// @author       4ndr0666
// @license      UNLICENSED REDTEAM ONLY
// @match        https://*.youtube.com/*
// @match        https://youtube.com/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%3E%3Cg%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2221.78%2021.78%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%20stroke-dasharray%3D%2210%2010%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// @noframes
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YouTube%20Playlist%20Master.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YouTube%20Playlist%20Master.user.js
// ==/UserScript==

/* ============================================================================
 *                           VERSION HISTORY (GUP-superset)
 * ============================================================================
 * v1.6.0 (2026-09-27) — field-run gap mitigation on the v1.5.0 golden unit.
 *   Evidence: youtubeplaylistmaster_debug.txt (2026-09-27 09:20 session) —
 *   the deck mounted (banner + "mounted" logged at 09:20:08.2) yet no
 *   feature ever materialized: the page spent the following seconds
 *   churning on heavy I/O (requestIdleCallback chains, blocked-telemetry
 *   retries amplified by the counter-surveillance blockers) while every
 *   script feature sat behind synchronous O(N) DOM sweeps and one raw
 *   un-throttled document-wide observer. On huge playlists the script's
 *   own sweeps join that churn as long tasks instead of interleaving with
 *   it — the script starves the page and the page starves the script.
 *
 *   ADDED — SCHED cooperative sweep runner (I/O-resilience): all O(N)
 *     row/thumbnail sweeps (DOMADAPTER checkbox injection / select-all /
 *     checkbox refresh / row filter, QUICK buttons, QUEUE overlays,
 *     METAINFO initial sweep) now run in bounded yielding slices (40
 *     nodes, setTimeout(0) yield between slices) that interleave with the
 *     page's heavy-I/O churn instead of joining it as one more long
 *     synchronous task. Sweeps coalesce per key (never cancel — forward
 *     progress is guaranteed even under continuous churn) and isolate
 *     per-node faults (first 3 logged, rest summarized — no console
 *     flooding). The deck row filter is additionally keystroke-debounced
 *     (120 ms) so typing a needle no longer fires an O(N) sweep per key.
 *
 *   THROTTLED — CLOSE's playlist-close observer was the last raw
 *     un-throttled whole-document MutationObserver (2 full-document
 *     queries per mutation batch, hundreds of batches/s during churn);
 *     it now rides the 300 ms debounced document observer.
 *
 *   WIRED — SAFETY.attachGlobalListener (defined since v1.1.0, never
 *     called — grep-verified 2 occurrences: definition + export): the
 *     global error/unhandledrejection shield now actually attaches at
 *     BOOT, before any feature starts.
 *
 *   REMOVED — dead units with zero call sites (grep-verified; v1.4.0/
 *     v1.2.0 orphans, user-authorized zero-dead-code sweep):
 *     DOMU.escapeHtml (orphaned by the v1.4.0 Trusted-Types rebuild),
 *     DOMU.timestampToSeconds (SORTER parses inline),
 *     SAFETY.safeTimeout/safeInterval (never adopted).
 *
 *   HARDENED — RANDOM.applyRandomPlay null-guards a missing #items host
 *     (was a per-tick TypeError caught only by safeWrap); MANAGER bulk-op
 *     progress callbacks guard a mid-re-mount deck; AUTH.readSAPISID
 *     re-reads cookies when the active account identity changes (fixes
 *     stale-SAPISID auth failures after account switches).
 * ==========================================================================*/

/* ============================================================================
 *                           TROUBLESHOOTING
 * ============================================================================
 *
 *   Deck    : the Ψ badge docks bottom-right on EVERY YouTube page; click
 *             it (or Alt+Shift+U) to expand the command panel.
 *   Hotkeys : Alt+Shift+U toggle deck · Alt+Shift+S settings ·
 *             Alt+Shift+X force-show failsafe · Shift+N next video while
 *             random play / the huge-playlist browser is active.
 *   Nothing appears? The F12 console must show the Ψ PLAYLIST MASTER
 *             banner; then run the manager menu command "Ψ Force show
 *             deck (Alt+Shift+X)".
 *
 * ==========================================================================*/

(function __ytpu_root__() {
    'use strict';

    const CFG = {
        SCRIPT_NAME: 'Ψ Playlist Master',
        SCRIPT_VERSION: '1.6.0',
        STORAGE_KEY: 'ytpu.settings',
        SNAPSHOT_KEY: 'ytpu.snapshots',
        SNAPSHOT_CAP: 20,
        CHANNEL_CACHE_CAP: 64,
        LOG_RING_CAP: 100,

        BATCH_SIZE: 100,
        MAX_BATCH_RETRIES: 3,
        PACE_MU_MS: 1200,
        PACE_SIGMA_MS: 400,
        PACE_MIN_MS: 500,
        PACE_MAX_MS: 4000,
        BACKOFF_START_MS: 5000,
        BACKOFF_MAX_MS: 60000,
        BACKOFF_MAX_ATTEMPTS: 3,
        WARN_BULK_THRESHOLD: 500,
        FETCH_TIMEOUT_MS: 30000,
        PAGE_FETCH_TIMEOUT_MS: 10000,
        MAX_PAGES: 200,

        OBSERVER_DEBOUNCE_MS: 400,
        MOBILE_POLL_MS: 1500,
        MOBILE_POLL_MAX: 400,
        WAIT_ELEMENT_TIMEOUT_MS: 15000,

        REVERSE_TIME_LEFT: 0.3,
        REVERSE_TIME_LEFT_MINI: 0.6,

        RANDOM_MARK_WATCHED_AT: 0.9,
        RANDOM_AUTOPLAY_AT_END: 3,
    };

    const LOG = (() => {
        const enabled = () => !!STORE.data().debug;
        const prefix = `[${CFG.SCRIPT_NAME}]`;
        return {
            debug: (...a) => { if (enabled()) console.debug(prefix, ...a); },
            info: (...a) => console.info(prefix, ...a),
            warn: (...a) => console.warn(prefix, ...a),
            error: (...a) => console.error(prefix, ...a),
        };
    })();

    const SAFETY = (() => {
        function handleError(e) { LOG.error(e); }

        function attachGlobalListener() {
            window.addEventListener('unhandledrejection', (event) => {
                const e = event.reason || event;
                const stack = (e && e.stack) || '';
                if (!stack || !stack.includes('__ytpu_root__')) return;
                handleError(e);
            });
            window.addEventListener('error', (event) => {
                if (event && event.message && String(event.message).includes('ytpu')) handleError(event.error || event.message);
            });
        }

        function safeWrap(fn) {
            return function safeWrapped(...args) {
                try {
                    const result = fn.apply(this, args);
                    if (result instanceof Promise) result.catch(handleError);
                    return result;
                } catch (e) {
                    handleError(e);
                }
                return undefined;
            };
        }
        const safeListen = (node, ev, fn, opts) => node.addEventListener(ev, safeWrap(fn), opts);
        return { handleError, attachGlobalListener, safeWrap, safeListen };
    })();

    const BUS = (() => {
        const listeners = new Map(); // topic -> Set<fn>
        return {
            on(topic, fn) {
                if (!listeners.has(topic)) listeners.set(topic, new Set());
                listeners.get(topic).add(fn);
                return () => listeners.get(topic).delete(fn);
            },
            emit(topic, ...args) {
                const set = listeners.get(topic);
                if (!set) return;
                for (const fn of [...set]) {
                    try { fn(...args); }
                    catch (e) { LOG.error('bus handler failed for', topic, e); }
                }
            },
        };
    })();

    const ENV = (() => {
        const pageWin = (typeof unsafeWindow !== 'undefined' && unsafeWindow) ? unsafeWindow : window;
        const pageDoc = document;

        function cfgGet(key) {
            try {
                const cfg = pageWin.ytcfg;
                return cfg && typeof cfg.get === 'function' ? cfg.get(key) : undefined;
            } catch (e) {
                LOG.debug('ytcfg access failed:', e && e.message);
                return undefined;
            }
        }

        function pageFetch(url, options) {
            return pageWin.fetch(url, options);
        }

        // v1.4.0: the TrustedTypes policy (ttPolicy) and its setHTML helper
        // were removed. Runtime evidence (youtubeplaylistmaster_debug.txt)
        // proved Chrome's Trusted Types enforcement also covers
        // DOMParser.parseFromString — the two svg builders used it un-gated,
        // so the deck died at mount on every TT-enforcing profile while
        // setHTML sat uncalled (dead code). The script now builds ALL of its
        // DOM through the createElement/createElementNS APIs: zero
        // HTML-string sinks remain (no innerHTML, no parseFromString), so it
        // is Trusted-Types-immune BY CONSTRUCTION and needs no policy
        // exemption from the host page's CSP.

        function isMobile() { return location.host === 'm.youtube.com'; }

        return { pageWin, pageDoc, cfgGet, pageFetch, isMobile };
    })();

    const DOMU = (() => {
        function el(tag, attrs = {}, props = {}, styles = {}, events = {}, children = []) {
            const node = document.createElement(tag);
            for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
            for (const [k, v] of Object.entries(props)) { try { node[k] = v; } catch (e) { LOG.debug('prop set failed', k, e && e.message); } }
            for (const [k, v] of Object.entries(styles)) node.style[k] = v;
            for (const [k, fn] of Object.entries(events)) SAFETY.safeListen(node, k, fn);
            for (const child of children) {
                if (child === null || child === undefined) continue;
                node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
            }
            return node;
        }

        /** v1.4.0: namespace-correct SVG builder. The DOMParser-based
         *  svgEl predecessor was a Trusted Types sink — parseFromString
         *  requires a TrustedHTML object under enforcement and threw on
         *  every TT-hardened profile (54 uncaught TypeErrors in the field
         *  debug log, plus the deck-mount failure itself). All SVG in this
         *  script is now built through createElementNS, which no Trusted
         *  Types policy ever intercepts. */
        function svg(tag, attrs = {}, children = [], text = null) {
            const ns = 'http://www.w3.org/2000/svg';
            const node = document.createElementNS(ns, tag);
            for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
            for (const child of children) {
                if (child === null || child === undefined) continue;
                node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
            }
            if (text !== null) node.textContent = text;
            return node;
        }

        function svgPath(d, extraAttrs = {}) {
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'currentColor');
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', d);
            for (const [k, v] of Object.entries(extraAttrs)) path.setAttribute(k, v);
            svg.appendChild(path);
            return svg;
        }

        /** waitForElement — MutationObserver-driven, with hard timeout + cleanup. */
        function waitForElement(selector, { root = document, timeout = CFG.WAIT_ELEMENT_TIMEOUT_MS } = {}) {
            return new Promise((resolve) => {
                let settled = false;
                const done = (val) => { if (!settled) { settled = true; resolve(val); } };
                const existing = root.querySelector(selector);
                if (existing) return done(existing);
                const observer = new MutationObserver(() => {
                    const found = root.querySelector(selector);
                    if (found) { observer.disconnect(); done(found); }
                });
                observer.observe(root, { childList: true, subtree: true });
                if (timeout > 0) {
                    setTimeout(() => { observer.disconnect(); done(null); }, timeout);
                }
            });
        }

        /** Debounced document observer: cb fires at most once per `ms` while mutations stream. */
        function observeDocument(cb, ms = CFG.OBSERVER_DEBOUNCE_MS) {
            let timer = null;
            const observer = new MutationObserver(() => {
                if (timer) return;
                timer = setTimeout(() => { timer = null; SAFETY.safeWrap(cb)(); }, ms);
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            return {
                disconnect() {
                    if (timer) { clearTimeout(timer); timer = null; }
                    observer.disconnect();
                },
            };
        }

        /** James0x57 selector-observation (from Show-Date-Posted upstream).
         *  Watches parent/child selector pairs and reports inserted/removed nodes. */
        const selectorWatchers = [];
        const selectorObserver = new MutationObserver((mutationsList) => {
            for (const w of selectorWatchers) {
                const nodeMatches = (node) => node.nodeType === 1 && node.matches(w.childSelector);
                for (const mu of mutationsList) {
                    if (mu.type !== 'childList' || !mu.target.matches || !mu.target.matches(w.parentSelector)) continue;
                    const added = Array.prototype.filter.call(mu.addedNodes, nodeMatches);
                    const removed = Array.prototype.filter.call(mu.removedNodes, nodeMatches);
                    if (added.length) SAFETY.safeWrap(w.inserted)(added);
                    if (removed.length) SAFETY.safeWrap(w.removed)(removed);
                }
            }
        });

        function onParentChildSelectors(opts) {
            const nullFn = () => {};
            selectorWatchers.push(Object.assign({
                parentSelector: '', childSelector: '', inserted: nullFn, removed: nullFn,
            }, opts));
            if (!selectorObserver._ytpuActive) {
                selectorObserver.observe(document.documentElement, { childList: true, subtree: true });
                selectorObserver._ytpuActive = true;
            }
        }

        /** Single managed <style> for page-level CSS; content swapped on theme reset. */
        let pageStyleEl = null;
        function setPageStyle(cssText) {
            if (!pageStyleEl) {
                pageStyleEl = document.createElement('style');
                pageStyleEl.id = 'ytpu-page-style';
                (document.head || document.documentElement).appendChild(pageStyleEl);
            }
            pageStyleEl.textContent = cssText;
        }

        /** Bounded clipboard write with execCommand fallback (GUP B.1). */
        async function copyText(text) {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                    return true;
                }
            } catch (e) { LOG.debug('clipboard API failed, falling back:', e && e.message); }
            try {
                const node = document.createElement('pre');
                node.textContent = text;
                node.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;';
                document.body.appendChild(node);
                const selection = getSelection();
                const range = document.createRange();
                range.selectNodeContents(node);
                selection.removeAllRanges();
                selection.addRange(range);
                const ok = document.execCommand('copy');
                selection.removeAllRanges();
                node.remove();
                return ok;
            } catch (e) {
                LOG.debug('execCommand clipboard fallback failed:', e && e.message);
                return false;
            }
        }

        function fmtBytes(n) {
            const kb = Math.max(0, Math.round(n / 1024));
            return `${kb} KB`;
        }

        return {
            el, svg, svgPath, waitForElement, observeDocument,
            onParentChildSelectors, setPageStyle, copyText, fmtBytes,
        };
    })();

    const SCHED = (() => {
        // Paradigm: cooperative main-thread scheduling — O(N) DOM sweeps run
        // in bounded slices with yields between them, so a huge-playlist
        // page churning on heavy I/O never has to absorb the script's sweeps
        // as one more long synchronous task (and the script's own timers are
        // never starved behind its own work). v1.6.0 answer to the
        // youtubeplaylistmaster_debug.txt field report: the deck mounted,
        // then nothing materialized while the page choked.

        const CHUNK = 40;           // nodes per slice — a few ms of work
        const MAX_NODE_ERRORS = 3;  // per-node fault isolation, no flooding

        // key -> { running, pending: null | () => void }
        const sweeps = new Map();

        const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

        /** Run `worker` over `nodes` in yielding slices.
         *  - Coalescing, NOT cancellation: while a sweep for `key` runs,
         *    later invocations are remembered as a single trailing re-run.
         *    Continuous DOM churn therefore can never restart a sweep
         *    forever — forward progress is guaranteed — and each re-run
         *    only sees whatever is still outstanding thanks to the callers'
         *    own per-node idempotence guards (PROCESSED_ATTR, .ytpu-cb
         *    presence, dataset keys).
         *  - Per-node fault isolation (GUP fault-isolation parity with
         *    BOOT.startAllFeatures): a throwing worker is logged and the
         *    sweep continues with the remaining nodes; beyond the first
         *    MAX_NODE_ERRORS the rest are summarized in one line.
         *  - `onDone` runs after the final slice of the final pass only. */
        function sweep(key, nodes, worker, { chunk = CHUNK, onDone = null } = {}) {
            const state = sweeps.get(key) || { running: false, pending: null };
            sweeps.set(key, state);
            if (state.running) {
                state.pending = () => sweep(key, nodes, worker, { chunk, onDone });
                return;
            }
            state.running = true;
            const list = Array.prototype.slice.call(nodes); // static snapshot
            (async () => {
                try {
                    let nodeErrors = 0;
                    for (let i = 0; i < list.length; i += chunk) {
                        const end = Math.min(i + chunk, list.length);
                        for (let j = i; j < end; j++) {
                            try {
                                worker(list[j], j);
                            } catch (e) {
                                nodeErrors += 1;
                                if (nodeErrors <= MAX_NODE_ERRORS) LOG.error(`SCHED[${key}] node failed:`, e);
                            }
                        }
                        if (end < list.length) await nextTick();
                    }
                    if (nodeErrors > MAX_NODE_ERRORS) {
                        LOG.error(`SCHED[${key}]: ${nodeErrors} nodes failed (${nodeErrors - MAX_NODE_ERRORS} further errors suppressed)`);
                    }
                } finally {
                    state.running = false;
                    if (state.pending) {
                        const rerun = state.pending;
                        state.pending = null;
                        rerun();
                    } else if (onDone) {
                        try { onDone(); } catch (e) { LOG.error(`SCHED[${key}] onDone failed:`, e); }
                    }
                }
            })();
        }

        return { sweep, nextTick };
    })();

    const NAV = (() => {
        function classify() {
            const path = location.pathname;
            const params = new URLSearchParams(location.search);
            const list = params.get('list');
            return {
                path,
                videoId: params.get('v'),
                list,
                randomParam: params.get('ytpa-random'),
                isWatch: path === '/watch',
                isWatchWithList: path === '/watch' && !!list,
                isPlaylistPage: path === '/playlist' || path === '/feed/liked',
                isSubscriptions: path === '/feed/subscriptions',
                isChannel: path.startsWith('/channel/') || path.startsWith('/@') ||
                    path.startsWith('/c/') || path.startsWith('/user/'),
                isChannelTab: null, // computed below
                isMobile: ENV.isMobile(),
            };
        }

        function channelTab() {
            const m = location.pathname.match(/^\/[^/]+\/([^/]+)/);
            if (!m) return null;
            if (['videos', 'shorts', 'streams'].includes(m[1])) return m[1];
            return null;
        }

        // ---- v1.3.0: navigation integrity gate -------------------------------
        // Every programmatic navigation in the script routes through
        // safeNavigate()/safeOpen(). A malformed target (undefined/garbage
        // video or list id, foreign host, empty watch_videos set) is logged
        // and dropped instead of navigating YouTube into a 404 page.
        const YT_HOST_RE = /(^|\.)youtube\.com$/i;

        function validVideoId(v) {
            return typeof v === 'string' && /^[A-Za-z0-9_-]{11}$/.test(v);
        }

        function validListId(l) {
            return typeof l === 'string' && l.length >= 2
                && /^[A-Za-z0-9_-]+$/.test(l)
                && l !== 'undefined' && l !== 'null';
        }

        function vetUrl(target, label) {
            let u = null;
            try { u = new URL(target, location.origin); }
            catch (e) { /* fall through to the reject below */ }
            if (!u || (u.protocol !== 'https:' && u.protocol !== 'http:')) {
                LOG.warn(`navigation blocked (${label}): not an http(s) URL — ${String(target).slice(0, 120)}`);
                return null;
            }
            if (!YT_HOST_RE.test(u.hostname)) {
                LOG.warn(`navigation blocked (${label}): non-YouTube host ${u.hostname}`);
                return null;
            }
            if (u.pathname === '/watch') {
                if (!validVideoId(u.searchParams.get('v'))) {
                    LOG.warn(`navigation blocked (${label}): /watch without a valid 11-char video id — ${u.search}`);
                    return null;
                }
            } else if (u.pathname === '/playlist') {
                if (!validListId(u.searchParams.get('list'))) {
                    LOG.warn(`navigation blocked (${label}): /playlist without a plausible list id — ${u.search}`);
                    return null;
                }
            } else if (u.pathname === '/watch_videos') {
                const ids = (u.searchParams.get('video_ids') || '').split(',').filter(Boolean);
                if (!ids.length || !ids.every(validVideoId)) {
                    LOG.warn(`navigation blocked (${label}): watch_videos with an empty/invalid id set`);
                    return null;
                }
            }
            return u;
        }

        function safeNavigate(target, label = 'script') {
            const u = vetUrl(target, label);
            if (!u) return false;
            location.href = u.href;
            return true;
        }

        function safeOpen(target, label = 'script') {
            const u = vetUrl(target, label);
            if (!u) return null;
            return window.open(u.href, '_blank', 'noopener');
        }

        const listeners = new Set();
        function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

        function fire(reason) {
            const route = classify();
            route.isChannelTab = channelTab();
            route.reason = reason;
            LOG.debug('route:', reason, route.path, route.list || '');
            for (const fn of [...listeners]) {
                try { fn(route); }
                catch (e) { LOG.error('route handler failed:', e); }
            }
            BUS.emit('route', route);
        }

        let started = false;
        function start() {
            if (started) return;
            started = true;
            // Primary: YouTube's own SPA events (desktop + most mobile builds).
            window.addEventListener('yt-navigate-start', () => fire('navigate-start'));
            window.addEventListener('yt-navigate-finish', () => fire('navigate-finish'));
            window.addEventListener('yt-page-data-updated', () => fire('page-data-updated'));
            window.addEventListener('popstate', () => fire('popstate'));
            // m.youtube.com does not reliably emit yt-navigate-*: bounded idle poll
            // that re-arms on user activity (GUP B.1 bounded polling).
            if (ENV.isMobile()) {
                let attempts = 0;
                let lastHref = location.href;
                const id = setInterval(() => {
                    attempts++;
                    if (attempts >= CFG.MOBILE_POLL_MAX) {
                        clearInterval(id);
                        LOG.debug('mobile idle poll exhausted; waiting for activity re-arm');
                        return;
                    }
                    if (location.href !== lastHref) {
                        lastHref = location.href;
                        attempts = 0;
                        fire('mobile-poll');
                    }
                }, CFG.MOBILE_POLL_MS);
                const rearm = () => { attempts = 0; };
                document.addEventListener('touchstart', rearm, { passive: true });
                document.addEventListener('click', rearm, { passive: true });
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) { attempts = 0; fire('visibility'); }
                });
            }
            fire('boot');
        }

        return { classify, channelTab, onRoute, fire, start, validVideoId, validListId, safeNavigate, safeOpen };
    })();

    const PLAYER = (() => {
        const getPlayer = () => document.querySelector('#movie_player');
        const isAdPlaying = () => !!document.querySelector('.ad-interrupting');

        function getVideoId(url) {
            try { return new URLSearchParams(new URL(url, location.origin).search).get('v'); }
            catch (e) { return null; }
        }

        function currentTime() {
            try {
                const player = getPlayer();
                return player ? Math.floor(player.getCurrentTime()) | 0 : 0;
            } catch (e) { return 0; }
        }

        function getProgressState() {
            try {
                const player = getPlayer();
                return player ? player.getProgressState() : null;
            } catch (e) { return null; }
        }

        /** YouTube client-side routing trick:
         *  a hidden playlist-panel anchor whose .data carries a watchEndpoint.
         *  v1.3.0: ids are validated up front (NAV.validVideoId/validListId)
         *  and every hard-navigate branch routes through NAV.safeNavigate —
         *  a malformed id is dropped with a warning instead of navigating
         *  YouTube into a 404 page. */
        function redirect(videoId, list, extraParam = null) {
            if (!NAV.validVideoId(videoId)) {
                LOG.warn(`redirect blocked: "${videoId}" is not a valid video id (dropped instead of a 404 navigation)`);
                return false;
            }
            const safeList = NAV.validListId(list) ? list : null;
            const buildQuery = () => {
                const q = new URLSearchParams({ v: videoId });
                if (safeList) q.set('list', safeList);
                if (extraParam) q.set(extraParam.key, extraParam.value);
                return q.toString();
            };
            if (ENV.isMobile()) {
                // Mobile cannot use client-side routing reliably — hard navigate.
                return NAV.safeNavigate(`${location.origin}/watch?${buildQuery()}`, 'PLAYER.redirect');
            }
            const redirector = document.createElement('a');
            redirector.className = 'yt-simple-endpoint style-scope ytd-playlist-panel-video-renderer';
            redirector.setAttribute('hidden', '');
            redirector.data = {
                commandMetadata: {
                    webCommandMetadata: {
                        url: `/watch?${buildQuery()}`,
                        webPageType: 'WEB_PAGE_TYPE_WATCH',
                        rootVe: 3832,
                    },
                },
                watchEndpoint: safeList
                    ? { videoId, playlistId: safeList }
                    : { videoId },
            };
            const container = document.querySelector('ytd-playlist-panel-renderer #items');
            if (!container) {
                // No playlist panel (huge-playlist fallback surfaces): the
                // client-side trick has nothing to attach to — hard navigate
                // through the integrity gate.
                return NAV.safeNavigate(`/watch?${buildQuery()}`, 'PLAYER.redirect');
            }
            container.append(redirector);
            redirector.click();
            return true;
        }

        return { getPlayer, isAdPlaying, getVideoId, currentTime, getProgressState, redirect };
    })();

    const CHANNEL = (() => {
        const idCache = new Map(); // videoUrl -> 'UC...' (FIFO-bounded, GUP B.1)

        function cachePut(key, value) {
            if (idCache.size >= CFG.CHANNEL_CACHE_CAP) {
                const oldest = idCache.keys().next().value;
                idCache.delete(oldest);
            }
            idCache.set(key, value);
        }

        function fromPageManager() {
            try {
                const pageMan = document.querySelector('#page-manager');
                if (!pageMan || typeof pageMan.getCurrentData !== 'function') return null;
                const data = pageMan.getCurrentData();
                const id = data?.response?.metadata?.channelMetadataRenderer?.externalId;
                return /^UC[\w-]+$/.test(id || '') ? id : null;
            } catch (e) { return null; }
        }

        function fromMetaTag() {
            try {
                const meta = document.querySelector('meta[itemprop="identifier"]');
                const id = meta && meta.getAttribute('content');
                return /^UC[\w-]+$/.test(id || '') ? id : null;
            } catch (e) { return null; }
        }

        async function fetchText(url, timeoutMs) {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), timeoutMs);
            try {
                const res = await ENV.pageFetch(url, { signal: ctrl.signal, credentials: 'omit' });
                return await res.text();
            } finally {
                clearTimeout(timer);
            }
        }

        async function fromCanonicalLink() {
            try {
                const html = await fetchText(location.href, CFG.PAGE_FETCH_TIMEOUT_MS);
                const marker = '<link rel="canonical" href="https://www.youtube.com/channel/UC';
                const i = html.indexOf(marker) + marker.length;
                if (i < marker.length) return null;
                const id = html.substring(i, i + 24);
                return /^UC[\w-]+$/.test(id) ? id : null;
            } catch (e) { return null; }
        }

        async function fromFirstVideoPage() {
            try {
                const href = document.querySelector(
                    '#content ytd-rich-item-renderer a, .rich-grid-renderer-contents a.YtmCompactMediaItemImage, ytd-rich-item-renderer a#thumbnail',
                )?.href;
                if (!href) return null;
                if (idCache.has(href)) return idCache.get(href);
                const html = await fetchText(href, CFG.PAGE_FETCH_TIMEOUT_MS);
                // Regex chain: prefer the channelId anchored to subscribeButton,
                // then to Subscribe, then any channelId inside ytInitialData (last resort).
                const reQuote = `(?:"|'|\\\\x22)`;
                const id =
                    new RegExp(`var ytInitialData.+?${reQuote}subscribeButton${reQuote}:.*?${reQuote}channelId${reQuote}:${reQuote}(UC[\\w-]+)${reQuote}`).exec(html)?.[1]
                    ?? new RegExp(`var ytInitialData.+?[Ss]ubscribe.*?${reQuote}channelId${reQuote}:${reQuote}(UC[\\w-]+)${reQuote}`).exec(html)?.[1]
                    ?? new RegExp(`var ytInitialData.+?${reQuote}channelId${reQuote}:${reQuote}(UC[\\w-]+)${reQuote}`).exec(html)?.[1]
                    ?? null;
                if (id) cachePut(href, id);
                return id;
            } catch (e) { return null; }
        }

        async function resolve() {
            const direct = fromPageManager() || fromMetaTag();
            if (direct) return direct;
            const canonical = await fromCanonicalLink();
            if (canonical) return canonical;
            return await fromFirstVideoPage();
        }

        const bare = (ucId) => (ucId ? ucId.substring(2) : null);

        return { resolve, bare };
    })();

    const STORE = (() => {
        const DEFAULTS = {
            version: 1,
            data: {
                appearance: { theme: 'glass', spacerVisible: true, deckEverywhere: true },
                hotkeys: { enabled: true }, // v1.2.0: global Alt+Shift+U/S/X shortcuts
                channelButtons: {
                    enabled: true, playNext: true, newTabs: false,
                    viewInsteadOfPlay: false, everythingOnVideos: false, randomEnabled: true,
                },
                membersTab: { enabled: true },
                reverseOrder: { enabled: true, active: false },
                autoplay: { enabled: true, active: false },
                manager: { enabled: true },
                sort: { enabled: true, mode: 'asc', autoScroll: true, scrollLoopTime: 600 },
                exporter: {
                    enabled: true, getVideoTitle: true, getVideoChannel: false,
                    getVideoURL: false, getVideoDuration: false, getVideoIndex: false,
                    videoListSeperator: ' ; ',
                },
                quickPlaylist: { enabled: true },
                queueButtons: { enabled: true },
                playlistClose: { enabled: true },
                metaInfo: { enabled: true },
                episodeExpand: { enabled: true },
                hugePlaylist: { enabled: true },
                debug: false,
            },
        };

        function deepMerge(base, patch) {
            if (patch === null || patch === undefined) return base;
            if (typeof patch !== 'object' || Array.isArray(patch)) return patch;
            const out = (typeof base === 'object' && base !== null && !Array.isArray(base)) ? base : {};
            for (const key of Object.keys(patch)) {
                out[key] = deepMerge(out[key], patch[key]);
            }
            return out;
        }

        function clone(obj) {
            try { return structuredClone(obj); }
            catch (e) { return JSON.parse(JSON.stringify(obj)); }
        }

        const migrations = [
            (previous) => clone(DEFAULTS),                                                                 // 0 -> 1: birth
            (previous) => deepMerge(clone(previous), { data: { exporter: { getVideoDuration: false, getVideoIndex: false } } }), // 1 -> 2
            (previous) => deepMerge(clone(previous), { data: { appearance: { deckEverywhere: true } } }),                       // 2 -> 3: v1.1.0 always-dock deck
            (previous) => deepMerge(clone(previous), { data: { hotkeys: { enabled: true } } }),                                 // 3 -> 4: v1.2.0 global hotkeys (default on)
        ];

        function migrate(previous) {
            let current = previous && typeof previous === 'object' ? previous : {};
            let version = current.version ?? 0;
            while (version < migrations.length) {
                const next = migrations[version](current);
                next.version = version + 1;
                current = next;
                version = next.version;
            }
            return current;
        }

        function importLegacy() {
            try {
                const lsAuto = localStorage.getItem('YouTubePreventPlaylistAutoplayStatus');
                if (lsAuto !== null) {
                    DEFAULTS.data.autoplay.active = lsAuto === 'true';
                }
                const m = document.cookie.match(/(?:^|;\s*)pytplir_playPrevious=([^;]+)/);
                if (m) {
                    DEFAULTS.data.reverseOrder.active = m[1].toLowerCase() === 'true';
                }
                const yavpPlayNext = GM_getValue && GM_getValue('playNext', null);
                if (yavpPlayNext !== null && typeof yavpPlayNext === 'boolean') {
                    DEFAULTS.data.channelButtons.playNext = yavpPlayNext;
                }
                const yavpNewTabs = GM_getValue && GM_getValue('newTabs', null);
                if (yavpNewTabs !== null && typeof yavpNewTabs === 'boolean') {
                    DEFAULTS.data.channelButtons.newTabs = yavpNewTabs;
                }
                for (const [gmKey, path] of [
                    ['getVideoTitle', ['exporter', 'getVideoTitle']],
                    ['getVideoChannel', ['exporter', 'getVideoChannel']],
                    ['getVideoURL', ['exporter', 'getVideoURL']],
                    ['videoListSeperator', ['exporter', 'videoListSeperator']],
                ]) {
                    const v = GM_getValue && GM_getValue(gmKey, null);
                    if (v !== null && v !== undefined) {
                        let node = DEFAULTS.data;
                        for (let i = 0; i < path.length - 1; i++) node = node[path[i]];
                        node[path[path.length - 1]] = v;
                    }
                }
            } catch (e) {
                LOG.debug('legacy import skipped:', e && e.message);
            }
        }

        let cache = null;

        function load() {
            importLegacy();
            let raw = {};
            try { raw = (typeof GM_getValue === 'function' ? GM_getValue(CFG.STORAGE_KEY, {}) : {}); }
            catch (e) { raw = {}; }
            cache = migrate(raw);
            save();
        }

        function save() {
            if (cache === null) return;
            try {
                if (typeof GM_setValue === 'function') GM_setValue(CFG.STORAGE_KEY, cache);
            } catch (e) {
                LOG.warn('settings persist failed (storage unavailable):', e && e.message);
            }
        }

        function data() {
            if (cache === null) load();
            return cache.data;
        }

        function patch(partial) {
            cache.data = deepMerge(cache.data, partial);
            save();
            BUS.emit('settings-changed');
        }

        async function reset() {
            try { if (typeof GM_deleteValue === 'function') GM_deleteValue(CFG.STORAGE_KEY); }
            catch (e) { LOG.warn('reset failed:', e && e.message); }
            cache = null;
            load();
            BUS.emit('settings-changed');
        }

        return { data, patch, reset, load };
    })();

    const SNAPSHOTS = (() => {
        function all() {
            try {
                const raw = typeof GM_getValue === 'function' ? GM_getValue(CFG.SNAPSHOT_KEY, {}) : {};
                return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
            } catch (e) { return {}; }
        }

        function put(playlistId, bundle) {
            const map = all();
            map[playlistId] = {
                savedAt: new Date().toISOString(),
                itemCount: bundle.playlists[0].items.length,
                bundle,
            };
            const keys = Object.keys(map);
            if (keys.length > CFG.SNAPSHOT_CAP) {
                keys.sort((a, b) => (map[a].savedAt || '').localeCompare(map[b].savedAt || ''));
                for (let i = 0; i < keys.length - CFG.SNAPSHOT_CAP; i++) delete map[keys[i]];
            }
            try {
                if (typeof GM_setValue === 'function') GM_setValue(CFG.SNAPSHOT_KEY, map);
            } catch (e) { LOG.warn('snapshot persist failed:', e && e.message); }
            return map[playlistId];
        }

        function get(playlistId) { return all()[playlistId] || null; }

        /** Diff a stored snapshot against the current item list.
         *  Returns { missing, gonePrivate, added } — jc "Check deleted videos",
         *  upgraded to also report videos added since the snapshot and videos
         *  that turned private/deleted between snapshot and now. */
        function diff(playlistId, currentItems) {
            const snap = get(playlistId);
            if (!snap) return null;
            const snapItems = snap.bundle.playlists[0].items;
            const snapIds = new Set(snapItems.map((i) => i.videoId));
            const curIds = new Set(currentItems.map((i) => i.videoId));
            const missing = snapItems.filter((it) => !curIds.has(it.videoId));
            const gonePrivate = currentItems.filter((c) => {
                if (!c.deleted) return false;
                const then = snapItems.find((s) => s.videoId === c.videoId);
                return then && !then.deleted;
            });
            const added = currentItems.filter((c) => !snapIds.has(c.videoId));
            return { missing, gonePrivate, added, savedAt: snap.savedAt, snapCount: snap.itemCount };
        }

        return { all, put, get, diff };
    })();

    const AUTH = (() => {
        let sapisid = null;
        // v1.6.0: identity-keyed cache — a cached SAPISID survived account
        // switches (the cookie changes, the cache didn't), leaving every
        // authenticated InnerTube call failing with 401 until a reload.
        let sapisidTag = null;

        function readSAPISID() {
            const tag = identityTag();
            if (sapisid && sapisidTag === tag) return sapisid;
            const jar = {};
            for (const c of document.cookie.split(';').map((s) => s.trim())) {
                const i = c.indexOf('=');
                if (i > 0) jar[c.slice(0, i)] = c.slice(i + 1);
            }
            for (const k of ['SAPISID', '__Secure-3PAPISID', '__Secure-1PAPISID']) {
                if (jar[k]) { sapisid = jar[k]; sapisidTag = tag; return sapisid; }
            }
            return null;
        }

        async function sapisidhash() {
            const sid = readSAPISID();
            if (!sid) throw new Error('No SAPISID cookie — are you signed in?');
            const ts = Math.floor(Date.now() / 1000);
            const raw = `${ts} ${sid} ${location.origin}`;
            const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(raw));
            const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
            return `${ts}_${hex}`;
        }

        async function authHeader() {
            return `SAPISIDHASH ${await sapisidhash()}`;
        }

        const ytcfgGet = (key) => ENV.cfgGet(key);

        let acctName = null;
        let acctHandle = null;
        let acctTag = null;

        async function accountLabel() {
            const tag = identityTag();
            if (acctName && acctTag === tag) return acctName;
            let name = null;
            let handle = null;
            try {
                const j = await INNERTUBE.call('account/account_menu', {});
                (function walk(n) {
                    if (!n || typeof n !== 'object' || name) return;
                    if (Array.isArray(n)) { n.forEach(walk); return; }
                    const a = n.activeAccountHeaderRenderer;
                    if (a) {
                        name = a.accountName?.simpleText || a.accountName?.runs?.[0]?.text || null;
                        handle = a.channelHandle?.simpleText || a.channelHandle?.runs?.[0]?.text || a.email?.simpleText || null;
                        return;
                    }
                    for (const k of Object.keys(n)) walk(n[k]);
                })(j);
            } catch (e) {
                LOG.debug('accountLabel lookup failed (caller keeps fallback):', e && e.message);
            }
            if (name) { acctName = name; acctHandle = handle; acctTag = tag; }
            return name;
        }

        function context() {
            const c = ytcfgGet('INNERTUBE_CONTEXT');
            if (!c) throw new Error('INNERTUBE_CONTEXT missing — page not fully loaded');
            return c;
        }

        function apiKey() {
            const k = ytcfgGet('INNERTUBE_API_KEY');
            if (!k) throw new Error('INNERTUBE_API_KEY missing');
            return k;
        }

        function identityTag() {
            return `${ytcfgGet('SESSION_INDEX') || 0}|${ytcfgGet('DELEGATED_SESSION_ID') || ''}`;
        }

        /** Op-scoped identity pin: aborts multi-step operations when the active
         *  account/brand changes mid-flight, preventing wrong-account writes. */
        function openOpGuard() {
            const tag = identityTag();
            return {
                tag,
                check() {
                    const now = identityTag();
                    if (now !== tag) {
                        throw new Error(`Identity changed mid-operation (was "${tag}", now "${now}") — aborting to avoid wrong-account writes`);
                    }
                },
            };
        }

        return { authHeader, ytcfgGet, accountLabel, context, apiKey, identityTag, openOpGuard };
    })();

    const PACING = (() => {
        let lastWrite = 0;
        let queue = Promise.resolve();

        function jitter() {
            // Box-Muller log-normal delay
            const u1 = Math.random() || 1e-9;
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const ms = Math.exp(Math.log(CFG.PACE_MU_MS) + (CFG.PACE_SIGMA_MS / CFG.PACE_MU_MS) * z);
            return Math.min(CFG.PACE_MAX_MS, Math.max(CFG.PACE_MIN_MS, ms));
        }

        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

        async function writeGate() {
            const now = Date.now();
            const since = now - lastWrite;
            const delay = jitter();
            if (since < delay) await sleep(delay - since);
            if (document.hidden) {
                await new Promise((r) => {
                    const h = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', h); r(); } };
                    document.addEventListener('visibilitychange', h);
                });
            }
            lastWrite = Date.now();
        }

        /** Serializes all write operations single-file. */
        function serialize(fn) {
            const p = queue.then(() => fn());
            queue = p.catch(() => {});
            return p;
        }

        return { jitter, sleep, writeGate, serialize };
    })();

    const INNERTUBE = (() => {
        async function call(endpoint, body, { isWrite = false } = {}) {
            const key = AUTH.apiKey();
            const url = `${location.origin}/youtubei/v1/${endpoint}?key=${encodeURIComponent(key)}&prettyPrint=false`;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': await AUTH.authHeader(),
                'X-Origin': location.origin,
                'X-Goog-AuthUser': String(AUTH.ytcfgGet('SESSION_INDEX') || 0),
                'X-Youtube-Client-Name': String(AUTH.ytcfgGet('INNERTUBE_CONTEXT_CLIENT_NAME') || 1),
                'X-Youtube-Client-Version': AUTH.ytcfgGet('INNERTUBE_CONTEXT_CLIENT_VERSION') || '2.0',
            };
            const pageId = AUTH.ytcfgGet('DELEGATED_SESSION_ID');
            if (pageId) headers['X-Goog-PageId'] = pageId;
            const payload = { context: AUTH.context(), ...body };
            if (isWrite) await PACING.writeGate();
            let attempt = 0;
            let backoff = CFG.BACKOFF_START_MS;
            for (;;) {
                const ctrl = new AbortController();
                const timer = setTimeout(() => ctrl.abort(), CFG.FETCH_TIMEOUT_MS);
                let res;
                try {
                    res = await ENV.pageFetch(url, {
                        method: 'POST',
                        credentials: 'include',
                        headers,
                        body: JSON.stringify(payload),
                        signal: ctrl.signal,
                    });
                } catch (e) {
                    if (e && e.name === 'AbortError') {
                        throw new Error(`InnerTube ${endpoint} timed out after ${CFG.FETCH_TIMEOUT_MS}ms`);
                    }
                    throw e;
                } finally {
                    clearTimeout(timer);
                }
                if (res.status === 429 || res.status === 503) {
                    attempt++;
                    if (attempt > CFG.BACKOFF_MAX_ATTEMPTS) {
                        throw new Error(`Rate-limited after ${attempt} retries (${res.status})`);
                    }
                    const retryAfter = parseInt(res.headers.get('Retry-After') || '0', 10) * 1000;
                    await PACING.sleep(Math.max(retryAfter, backoff));
                    backoff = Math.min(CFG.BACKOFF_MAX_MS, backoff * 2);
                    continue;
                }
                if (res.status === 401 || res.status === 403) {
                    throw new Error(`Auth rejected (${res.status}) — reload the page`);
                }
                if (!res.ok) throw new Error(`InnerTube ${endpoint} failed: ${res.status}`);
                return res.json();
            }
        }

        const browse = (body) => call('browse', body);
        const playlistEdit = (body) => call('browse/edit_playlist', body, { isWrite: true });
        const playlistCreate = (body) => call('playlist/create', body, { isWrite: true });

        function available() {
            try { AUTH.apiKey(); AUTH.context(); return true; }
            catch (e) { return false; }
        }

        return { call, browse, playlistEdit, playlistCreate, available };
    })();

    const READER = (() => {
        function extractItems(renderers) {
            const items = [];
            for (const r of renderers || []) {
                const v = r.playlistVideoRenderer;
                if (v) {
                    items.push({
                        videoId: v.videoId,
                        setVideoId: v.setVideoId,
                        title: v.title?.simpleText || v.title?.runs?.[0]?.text || '',
                        channelId: v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
                        channelName: v.shortBylineText?.runs?.[0]?.text || '',
                        lengthText: v.lengthText?.simpleText || '',
                        isPlayable: v.isPlayable !== false,
                        deleted: v.isPlayable === false,
                    });
                    continue;
                }
                const cont = r.continuationItemRenderer;
                if (cont) {
                    items.push({ __continuation: cont.continuationEndpoint?.continuationCommand?.token });
                }
            }
            return items;
        }

        function extractHeader(resp) {
            const h = resp.header?.playlistHeaderRenderer
                || resp.metadata?.playlistMetadataRenderer
                || resp.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer;
            const countText = h?.numVideosText?.runs?.[0]?.text
                || h?.stats?.[0]?.runs?.[0]?.text
                || '';
            const title = h?.title?.simpleText || h?.title?.runs?.[0]?.text || '';
            return { title, itemCount: parseInt(countText.replace(/[^\d]/g, ''), 10) || null };
        }

        function findPlaylistRenderers(resp) {
            const tabs = resp.contents?.twoColumnBrowseResultsRenderer?.tabs;
            if (!tabs) return null;
            for (const t of tabs) {
                const sections = t.tabRenderer?.content?.sectionListRenderer?.contents;
                if (!sections) continue;
                for (const s of sections) {
                    const items = s.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
                    if (items) return items;
                }
            }
            return null;
        }

        function findContinuationRenderers(resp) {
            const buckets = [
                resp.onResponseReceivedActions,
                resp.onResponseReceivedEndpoints,
                resp.onResponseReceivedCommands,
            ].filter(Boolean).flat();
            for (const a of buckets) {
                const cont = a.appendContinuationItemsAction?.continuationItems
                    || a.reloadContinuationItemsCommand?.continuationItems;
                if (cont) return cont;
            }
            return null;
        }

        async function loadPlaylist(playlistId, onProgress) {
            const items = [];
            let resp = await INNERTUBE.browse({ browseId: `VL${playlistId}` });
            const header = extractHeader(resp);
            let renderers = findPlaylistRenderers(resp);
            // Parse-drift sentinel: only cry "drift" when the header says there
            // ARE items but none were found. A genuinely empty playlist returns
            // empty rather than throwing, so add/copy into empty lists still works.
            if (header.title && !renderers && header.itemCount > 0) {
                throw new Error(`Playlist parse drift: header recognized but no item renderers found (playlistId=${playlistId})`);
            }
            const seenTokens = new Set();
            let pages = 0;
            while (renderers && renderers.length) {
                pages++;
                if (pages > CFG.MAX_PAGES) {
                    throw new Error(`Pagination ceiling reached (${CFG.MAX_PAGES} pages, ${items.length} items) — likely a runaway continuation loop`);
                }
                const extracted = extractItems(renderers);
                const cont = extracted.find((x) => x.__continuation);
                const before = items.length;
                for (const it of extracted) if (!it.__continuation) items.push(it);
                if (onProgress) onProgress({ loaded: items.length, total: header.itemCount });
                if (!cont) break;
                if (seenTokens.has(cont.__continuation)) {
                    throw new Error(`Pagination token repeated at page ${pages} — aborting infinite loop`);
                }
                if (items.length === before && pages > 1) {
                    throw new Error(`Pagination made no progress (page ${pages} added 0 items)`);
                }
                seenTokens.add(cont.__continuation);
                resp = await INNERTUBE.browse({ continuation: cont.__continuation });
                renderers = findContinuationRenderers(resp);
            }
            return { header, items };
        }

        /** The signed-in user's owned playlists (destination picker). */
        async function loadOwnedPlaylists() {
            const resp = await INNERTUBE.browse({ browseId: 'FEplaylist_aggregation' });
            const out = [];
            const tabs = resp.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
            const walk = (node) => {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { node.forEach(walk); return; }
                if (node.lockupViewModel?.contentId && node.lockupViewModel.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') {
                    const meta = node.lockupViewModel.metadata?.lockupMetadataViewModel;
                    out.push({ id: node.lockupViewModel.contentId, title: meta?.title?.content || '' });
                    return;
                }
                if (node.playlistLockupViewModel) {
                    out.push({
                        id: node.playlistLockupViewModel.contentId || node.playlistLockupViewModel.playlistId,
                        title: node.playlistLockupViewModel.metadata?.lockupMetadataViewModel?.title?.content || '',
                    });
                    return;
                }
                for (const k of Object.keys(node)) walk(node[k]);
            };
            walk(tabs);
            const seen = new Set();
            return out.filter((p) => p.id && !seen.has(p.id) && seen.add(p.id));
        }

        return { loadPlaylist, loadOwnedPlaylists };
    })();

    const MUTATOR = (() => {
        async function addVideos(playlistId, videoIds, onProgress) {
            return batchedEdit(playlistId, videoIds.map((v) => ({
                action: 'ACTION_ADD_VIDEO', addedVideoId: v,
            })), { mode: 'add', videoIds }, onProgress);
        }

        async function removeVideos(playlistId, setVideoIds, onProgress) {
            return batchedEdit(playlistId, setVideoIds.map((s) => ({
                action: 'ACTION_REMOVE_VIDEO', setVideoId: s,
            })), { mode: 'remove', setVideoIds }, onProgress);
        }

        async function batchedEdit(playlistId, actions, meta, onProgress) {
            const result = { applied: 0, failed: [], retried: 0 };
            const batches = [];
            for (let i = 0; i < actions.length; i += CFG.BATCH_SIZE) {
                batches.push(actions.slice(i, i + CFG.BATCH_SIZE));
            }
            for (let bi = 0; bi < batches.length; bi++) {
                const batch = batches[bi];
                if (meta.mode === 'add') {
                    const { items } = await READER.loadPlaylist(playlistId);
                    meta.preCount = new Map();
                    for (const i of items) meta.preCount.set(i.videoId, (meta.preCount.get(i.videoId) || 0) + 1);
                }
                await PACING.serialize(() => runAndVerifyBatch(playlistId, batch, meta, result));
                if (onProgress) {
                    onProgress({
                        batch: bi + 1, totalBatches: batches.length,
                        applied: result.applied, failed: result.failed.length,
                    });
                }
            }
            return result;
        }

        async function runAndVerifyBatch(playlistId, batch, meta, result, depth = 0) {
            try {
                await INNERTUBE.playlistEdit({ playlistId, actions: batch });
            } catch (e) {
                LOG.warn('playlistEdit threw:', e && e.message);
                if (depth >= CFG.MAX_BATCH_RETRIES) {
                    result.failed.push(...batch);
                    return;
                }
                await PACING.sleep(CFG.BACKOFF_START_MS * (depth + 1));
            }

            // Verify: re-read the target playlist and compare multiset counts so
            // pre-existing entries can't mask silently dropped mutations.
            const { items } = await READER.loadPlaylist(playlistId);
            const countByVideo = new Map();
            for (const i of items) countByVideo.set(i.videoId, (countByVideo.get(i.videoId) || 0) + 1);
            const presentSetIds = new Set(items.map((i) => i.setVideoId));
            if (meta.mode === 'remove' && items.length > 0) {
                const haveSetIds = items.some((i) => i.setVideoId);
                if (!haveSetIds) {
                    throw new Error('Verifier health: playlist has rows but no setVideoIds were extracted — extractor likely drifted, refusing to confirm removals');
                }
            }

            const missing = [];
            if (meta.mode === 'add') {
                const expectedAdds = new Map();
                const pre = meta.preCount || new Map();
                for (const act of batch) {
                    const v = act.addedVideoId;
                    expectedAdds.set(v, (expectedAdds.get(v) || pre.get(v) || 0) + 1);
                }
                for (const [vid, exp] of expectedAdds) {
                    const cur = countByVideo.get(vid) || 0;
                    const short = exp - cur;
                    if (short > 0) {
                        const acts = batch.filter((a) => a.addedVideoId === vid).slice(0, short);
                        missing.push(...acts);
                    }
                }
            } else {
                for (const act of batch) {
                    if (presentSetIds.has(act.setVideoId)) missing.push(act);
                }
            }

            result.applied += batch.length - missing.length;

            if (missing.length && depth < CFG.MAX_BATCH_RETRIES) {
                result.retried += missing.length;
                LOG.debug(`Verifier: ${missing.length}/${batch.length} silently dropped, retrying (depth ${depth + 1})`);
                const half = Math.max(1, Math.floor(missing.length / 2));
                for (let i = 0; i < missing.length; i += half) {
                    await runAndVerifyBatch(playlistId, missing.slice(i, i + half), meta, result, depth + 1);
                }
            } else if (missing.length) {
                result.failed.push(...missing);
            }
        }

        return { addVideos, removeVideos };
    })();

    const PORTABILITY = (() => {
        async function exportPlaylist(playlistId) {
            const { header, items } = await READER.loadPlaylist(playlistId);
            const cleanItems = items.map((i) => ({
                videoId: i.videoId,
                setVideoId: i.setVideoId || null,
                title: i.title,
                channelId: i.channelId || null,
                channelName: i.channelName || null,
                lengthText: i.lengthText || null,   // additive; /1 readers ignore it
                isPlayable: i.isPlayable,
                deleted: i.deleted,
            }));
            return {
                schema: 'ytpm.bundle/1',            // kept for drop-in compatibility
                generator: `${CFG.SCRIPT_NAME} ${CFG.SCRIPT_VERSION}`,
                exportedAt: new Date().toISOString(),
                origin: location.origin,
                playlists: [{
                    id: playlistId,
                    title: header.title,
                    itemCount: cleanItems.length,
                    items: cleanItems,
                }],
            };
        }

        async function importIntoPlaylist(targetPlaylistId, bundle, { dedupe = true } = {}) {
            const pls = Array.isArray(bundle?.playlists) ? bundle.playlists : [];
            const existingIds = new Set();
            if (dedupe) {
                const { items } = await READER.loadPlaylist(targetPlaylistId);
                items.forEach((i) => existingIds.add(i.videoId));
            }
            const seenInBundle = new Set();
            const videoIds = [];
            for (const p of pls) {
                for (const it of (p?.items || [])) {
                    if (!it || typeof it.videoId !== 'string' || !it.videoId) continue;
                    if (it.deleted) continue;
                    if (dedupe && existingIds.has(it.videoId)) continue;
                    if (seenInBundle.has(it.videoId)) continue;
                    seenInBundle.add(it.videoId);
                    videoIds.push(it.videoId);
                }
            }
            return MUTATOR.addVideos(targetPlaylistId, videoIds);
        }

        function downloadJSON(data, filename) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function downloadText(text, filename) {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        async function readFile(file) {
            const text = await file.text();
            return JSON.parse(text);
        }

        return { exportPlaylist, importIntoPlaylist, downloadJSON, downloadText, readFile };
    })();

    const DOMADAPTER = (() => {
        let observer = null;
        // rowKey -> { videoId, setVideoId, title }; keyed per-row so duplicate
        // videos appearing multiple times track each instance independently.
        const selected = new Map();
        const listeners = new Set();
        let rowSeq = 0;
        // Live title filter state (deck input drives this; empty = show all).
        let filterText = '';

        function currentPlaylistId() {
            const u = new URL(location.href);
            const list = u.searchParams.get('list');
            if (list) return list;
            if (location.pathname === '/feed/liked') return 'LL';
            return null;
        }

        function isPlaylistPage() {
            return location.pathname === '/playlist'
                || location.pathname === '/feed/liked'
                || (location.pathname === '/watch' && new URL(location.href).searchParams.get('list'));
        }

        function onSelectionChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
        function emit() { for (const fn of [...listeners]) { try { fn(selected); } catch (e) { LOG.error(e); } } }

        function clearSelection() { selected.clear(); refreshCheckboxes(); emit(); }
        function getSelection() { return new Map(selected); }

        // Rows scoped to the playlist's OWN list; YouTube renders a "Recommended
        // videos" tail with the same row tag — those must never be selectable.
        function rows() {
            const list = document.querySelector('ytd-playlist-video-list-renderer');
            return list ? list.querySelectorAll('ytd-playlist-video-renderer') : [];
        }

        function refreshCheckboxes() {
            // v1.6.0: O(N) read pass — chunked through SCHED so a 5000-row
            // playlist doesn't turn a "Clear" click into a long task.
            SCHED.sweep('domadapter.refresh', rows(), (r) => {
                const rowKey = r.dataset.ytpuRowKey;
                const cb = r.querySelector('.ytpu-cb');
                if (cb && rowKey) cb.checked = selected.has(rowKey);
            });
        }

        function videoIdOf(row) {
            const link = row.querySelector('a#video-title, a#thumbnail');
            if (!link) return null;
            const href = link.getAttribute('href') || '';
            const m = href.match(/[?&]v=([^&]+)/);
            return m ? m[1] : null;
        }

        function setVideoIdOf(row) {
            const d = row.data || row.polymerController?.data || row.__data;
            return d?.setVideoId || d?.playlistVideoRenderer?.setVideoId || null;
        }

        function titleOf(row) {
            return row.querySelector('#video-title')?.textContent?.trim() || '';
        }

        function rowEntry(row) {
            return {
                videoId: videoIdOf(row),
                setVideoId: setVideoIdOf(row),
                title: titleOf(row),
            };
        }

        function injectCheckboxes() {
            if (!isPlaylistPage()) return;
            if (!STORE.data().manager.enabled) return;
            // v1.6.0: chunked + yielding (SCHED) — on huge playlists the
            // old synchronous forEach was a multi-second long task that
            // joined YouTube's own heavy-I/O churn instead of interleaving
            // with it. Same per-row work, same guards, same end state.
            SCHED.sweep('domadapter.rows', rows(), (row) => {
                if (row.querySelector('.ytpu-cb')) return;
                if (!row.dataset.ytpuRowKey) row.dataset.ytpuRowKey = `r${++rowSeq}`;
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'ytpu-cb';
                cb.title = 'Playlist Master selection';
                cb.style.cssText = 'margin-right: 8px; width: 18px; height: 18px; cursor: pointer; accent-color: #00E5FF;';
                cb.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rowKey = row.dataset.ytpuRowKey;
                    const vid = videoIdOf(row);
                    if (!rowKey || !vid) return;
                    if (cb.checked) selected.set(rowKey, rowEntry(row));
                    else selected.delete(rowKey);
                    emit();
                });
                const anchor = row.querySelector('#index-container') || row.querySelector('#index') || row.firstElementChild;
                if (anchor) anchor.insertBefore(cb, anchor.firstChild);
            }, { onDone: () => refreshCheckboxes() });
        }

        function selectAll() {
            if (!STORE.data().manager.enabled) return;
            // v1.6.0: chunked + yielding (SCHED); emit fires once at the end,
            // exactly as before.
            SCHED.sweep('domadapter.selectall', rows(), (row) => {
                if (!row.dataset.ytpuRowKey) row.dataset.ytpuRowKey = `r${++rowSeq}`;
                const entry = rowEntry(row);
                if (row.dataset.ytpuRowKey && entry.videoId) selected.set(row.dataset.ytpuRowKey, entry);
            }, { onDone: () => { refreshCheckboxes(); emit(); } });
        }

        /** Live row filter: hide rows whose title doesn't contain the needle.
         *  Purely presentational — selection state is untouched, so a hidden
         *  selected row still participates in bulk operations.
         *  v1.6.0: the per-row pass is chunked through SCHED, and setFilter
         *  debounces keystrokes (120 ms) so typing a needle into the deck on
         *  a 5000-row playlist no longer fires an O(N) sweep per keypress. */
        function applyFilter() {
            if (!isPlaylistPage()) return;
            const needle = filterText.trim().toLowerCase();
            SCHED.sweep('domadapter.filter', rows(), (row) => {
                row.classList.toggle('ytpu-row-hidden', !!needle && !titleOf(row).toLowerCase().includes(needle));
            });
        }

        let applyTimer = null;

        function setFilter(text) {
            filterText = String(text || '');
            if (applyTimer) clearTimeout(applyTimer);
            applyTimer = setTimeout(SAFETY.safeWrap(applyFilter), 120);
        }

        function start() {
            if (observer) return;
            observer = DOMU.observeDocument(() => {
                if (isPlaylistPage()) { injectCheckboxes(); applyFilter(); }
            });
            NAV.onRoute((route) => {
                if (route.reason !== 'navigate-start') {
                    selected.clear();
                    emit();
                    setTimeout(() => { injectCheckboxes(); applyFilter(); }, 500);
                }
            });
        }

        return {
            currentPlaylistId, isPlaylistPage, onSelectionChange, clearSelection,
            getSelection, rows, injectCheckboxes, selectAll, start, rowEntry,
            setFilter, applyFilter,
        };
    })();

    const GLYPH = (() => {
        // v1.4.0: rebuilt via namespace-correct createElementNS (DOMU.svg).
        // The previous DOMParser/parseFromString construction was a Trusted
        // Types sink — under TT enforcement (field debug log,
        // youtubeplaylistmaster_debug.txt) parseFromString requires a
        // TrustedHTML object and threw at deck mount, leaving the Ψ deck
        // unmounted on every hardened profile. Attribute-for-attribute the
        // rendered glyph is identical; only the construction path changed.

        /** Ring pair + hexagon outline shared by both renderings (128 canvas). */
        function ringAndHexagon() {
            return [
                DOMU.svg('path', {
                    d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z',
                    'stroke-dasharray': '21.78 21.78', 'stroke-width': '2',
                }),
                DOMU.svg('path', {
                    d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z',
                    'stroke-dasharray': '10 10', 'stroke-width': '1.5', opacity: '0.7',
                }),
                DOMU.svg('path', { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z' }),
            ];
        }

        /** Build the Ψ glyph as a detached SVG node at an explicit size. */
        function node(size = 24, stroke = '#00E5FF') {
            return DOMU.svg('svg', {
                viewBox: '0 0 128 128', width: String(size), height: String(size),
                fill: 'none', stroke, 'stroke-width': '3',
                'stroke-linecap': 'round', 'stroke-linejoin': 'round',
            }, [
                ...ringAndHexagon(),
                DOMU.svg('text', {
                    x: '64', y: '67', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
                    fill: '#00E5FF', stroke: 'none', 'font-size': '56', 'font-weight': '700',
                    'font-family': "'Cinzel Decorative', serif",
                }, [], 'Ψ'),
            ]);
        }

        /** Standalone 24×24 icon variant (menu entries, buttons). The Ψ is
         *  scaled from its 128 canvas into the 24 viewport via a 0.1875 group
         *  transform — identical shapes to node() at icon scale (the v1.3.0
         *  INLINE_24 markup string, rebuilt TT-immune). */
        function inline24() {
            return DOMU.svg('svg', { viewBox: '0 0 24 24' }, [
                DOMU.svg('g', {
                    transform: 'scale(0.1875)', fill: 'none', stroke: 'currentColor',
                    'stroke-width': '12', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
                }, [
                    DOMU.svg('path', {
                        d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z',
                        'stroke-dasharray': '21.78 21.78', 'stroke-width': '9',
                    }),
                    DOMU.svg('path', {
                        d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z',
                        'stroke-dasharray': '10 10', 'stroke-width': '7', opacity: '0.7',
                    }),
                    DOMU.svg('path', { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z' }),
                    DOMU.svg('text', {
                        x: '64', y: '72', 'text-anchor': 'middle', fill: 'currentColor',
                        stroke: 'none', 'font-size': '58', 'font-weight': '700', 'font-family': 'serif',
                    }, [], 'Ψ'),
                ]),
            ]);
        }

        return { node, inline24 };
    })();

    const THEME = (() => {
        // Palette constants (spec §2.1)
        const C = {
            base: '10, 19, 26',
            cyan: '#00E5FF',
            cyan2: '#67E8F9',
            pink: '#ff0055',
            white: '#ffffff',
            L: { header: 'rgba(10, 19, 26, 0.95)', window: 'rgba(10, 19, 26, 0.72)', menu: 'rgba(10, 19, 26, 0.65)', panel: 'rgba(10, 19, 26, 0.55)' },
            border: { subtle: 'rgba(0, 229, 255, 0.2)', std: 'rgba(0, 229, 255, 0.3)', btn: 'rgba(0, 229, 255, 0.4)' },
            wash: 'rgba(0, 229, 255, 0.2)',
            washDeep: 'rgba(0, 229, 255, 0.3)',
            glow: { out: '0 0 40px rgba(0, 229, 255, 0.15)', mid: '0 0 20px rgba(0, 229, 255, 0.5)', pink: '0 0 25px #ff0055', knob: '0 0 12px rgba(0, 229, 255, 0.8)' },
            trough: '#050A0F',
            mono: `"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace`,
            display: `"Orbitron", "JetBrains Mono", ui-monospace, monospace`,
            speed: 'all 150ms ease-in-out',
        };

        /** Page-level CSS for injected YouTube-DOM elements. */
        function pageCss() {
            const adaptive = STORE.data().appearance.theme === 'adaptive';
            if (adaptive) return `
/* ——— Ψ Playlist Master · adaptive theme (blends with YouTube variables) ——— */
html { --ytpu-btn-h: 32px; }
.ytpu-chipbar { display: flex; flex: 0.8; align-items: center; margin-left: 12px; flex-wrap: wrap; gap: 4px; }
.ytpu-btn { display: inline-flex; align-items: center; height: var(--ytpu-btn-h); padding: 0 12px;
  background: var(--yt-spec-additive-background, rgba(255,255,255,0.1));
  border: 1px solid transparent; border-radius: 8px; color: var(--yt-spec-text-primary, #f1f1f1);
  font: 500 1.2rem/1 var(--ytpu-font, "Roboto","Arial",sans-serif); cursor: pointer; text-decoration: none;
  user-select: none; transition: all 150ms ease-in-out; white-space: nowrap; }
.ytpu-btn:hover { background: var(--yt-spec-badge-style-type-live-now, rgba(255,255,255,0.2)); color: var(--ytpu-hover, var(--yt-spec-call-to-action, #3ea6ff)); }
.ytpu-btn.ytpu-on { color: var(--yt-spec-call-to-action, #3ea6ff); }
.ytpu-btn.ytpu-off { opacity: 0.55; }
.ytpu-btn.ytpu-destructive { color: var(--yt-spec-brand-link-text, #ff0055); }
.ytpu-sep { display: none; }
${sharedPageCss(C, true)}
`;
            return `
/* ——— Ψ Playlist Master · 3lectric-Glass theme (4NDR0666OS spec) ——— */
html { --ytpu-btn-h: 32px; }
.ytpu-chipbar { display: flex; flex: 0.8; align-items: center; margin-left: 12px; flex-wrap: wrap; gap: 4px; }
.ytpu-btn { display: inline-flex; align-items: center; height: var(--ytpu-btn-h); padding: 0 12px;
  background: ${C.L.menu}; border: 1px solid ${C.border.btn}; border-radius: 0px;
  color: ${C.cyan}; font: 700 1.2rem/1 ${C.mono}; cursor: pointer; text-decoration: none;
  user-select: none; transition: ${C.speed}; white-space: nowrap; }
.ytpu-btn:hover { background: ${C.wash}; border-color: ${C.cyan}; color: ${C.cyan2};
  box-shadow: ${C.glow.mid}; }
.ytpu-btn:active { background: ${C.washDeep}; color: ${C.white}; }
.ytpu-btn.ytpu-on { background: ${C.wash}; border-color: ${C.cyan}; color: ${C.cyan2};
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.35); }
.ytpu-btn.ytpu-off { opacity: 0.55; border-color: ${C.border.subtle}; }
.ytpu-btn.ytpu-destructive { border-color: ${C.pink}; color: ${C.pink}; }
.ytpu-btn.ytpu-destructive:hover { background: rgba(255, 0, 85, 0.3); box-shadow: ${C.glow.pink}; color: ${C.white}; }
.ytpu-sep { width: 8px; height: calc(var(--ytpu-btn-h) - 8px); background: rgba(0, 229, 255, 0.25);
  margin: 0 4px; border-radius: 1px; }
${sharedPageCss(C, false)}
`;
        }

        /** CSS shared by both themes for structural/behavioral page features. */
        function sharedPageCss(C, adaptive) {
            const glassBtn = adaptive
                ? `background: var(--yt-spec-additive-background, rgba(255,255,255,0.1)); color: var(--yt-spec-text-primary, #f1f1f1); border: 1px solid transparent; border-radius: 2px;`
                : `background: ${C.L.menu}; color: ${C.cyan}; border: 1px solid ${C.border.btn}; border-radius: 2px;`;
            const glassHover = adaptive
                ? `.ytpu-hover-btn:hover { background: var(--yt-spec-badge-style-type-live-now, rgba(255,255,255,0.2)); }`
                : `.ytpu-hover-btn:hover { background: ${C.wash}; border-color: ${C.cyan}; color: ${C.cyan2}; box-shadow: ${C.glow.mid}; }
.ytpu-hover-btn:active { background: ${C.washDeep}; color: ${C.white}; }`;
            return `
/* ——— Random play (YouTube-Play-All engine, Ψ-styled) ——— */
.ytpu-random-notice { padding: 1em; margin: 0 0 8px; border-radius: 4px;
  background: ${C.L.panel}; border: 1px solid ${C.border.std};
  color: ${C.cyan}; font: 500 1.2rem/1.5 ${C.mono}; }
.ytpu-random-notice strong { color: ${C.cyan2}; }
.ytpu-badge { border-radius: 4px; padding: 0.2em 0.4em; font: 700 0.8em/1 ${C.mono}; vertical-align: top;
  background: ${C.L.menu}; border: 1px solid ${C.border.btn}; color: ${C.cyan};
  text-decoration: none; cursor: pointer; transition: ${C.speed}; margin-left: 0.4em; }
.ytpu-badge:hover { background: ${C.wash}; box-shadow: ${C.glow.mid}; }
.ytpu-badge span.x { margin-left: 0.32em; vertical-align: middle; color: ${C.cyan2}; }
#secondary ytd-playlist-panel-renderer[ytpa-random] ytd-menu-renderer.ytd-playlist-panel-renderer,
#below ytd-playlist-panel-renderer[ytpa-random] ytd-menu-renderer.ytd-playlist-panel-renderer { height: 1em; visibility: hidden; }
#secondary ytd-playlist-panel-renderer[ytpa-random]:not(:hover) ytd-playlist-panel-video-renderer,
#below ytd-playlist-panel-renderer[ytpa-random]:not(:hover) ytd-playlist-panel-video-renderer { filter: blur(2em); }
body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
body:has(#secondary ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([ytpa-random="applied"]),
body:has(#below ytd-playlist-panel-renderer[ytpa-random]) .ytp-prev-button.ytp-button,
body:has(#below ytd-playlist-panel-renderer[ytpa-random]) .ytp-next-button.ytp-button:not([ytpa-random="applied"]) { display: none !important; }

/* ——— Queue / watch-later hover overlays (buhoho engine) ——— */
yt-thumbnail-view-model, ytd-thumbnail { position: relative !important; }
.ytpu-thumb-overlay { position: absolute; top: 4px; right: 4px; z-index: 800; display: flex;
  flex-direction: column; gap: 2px; opacity: 0; transition: opacity 0.15s ease; pointer-events: none; }
yt-thumbnail-view-model:hover .ytpu-thumb-overlay,
ytd-thumbnail:hover .ytpu-thumb-overlay { opacity: 1; pointer-events: auto; }
.ytpu-hover-btn { width: 28px; height: 28px; border-radius: 2px; ${glassBtn}
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
  transition: all 0.15s ease-in-out; }
${glassHover}
.ytpu-hover-btn svg { width: 18px; height: 18px; fill: currentColor; pointer-events: none; }
.ytpu-hover-btn.ytpu-ok { background: rgba(0, 229, 255, 0.35); color: ${C.white}; }
.ytpu-hover-btn.ytpu-err { background: rgba(255, 0, 85, 0.55); color: ${C.white}; }
body.ytpu-hiding-menu tp-yt-iron-dropdown { position: fixed !important; left: -9999px !important;
  top: -9999px !important; opacity: 0 !important; pointer-events: none !important; }
body.ytpu-hiding-menu tp-yt-iron-overlay-backdrop { display: none !important; }

/* ——— Random-play popover (channel chip bar) ——— */
.ytpu-chipbar-popover { position: fixed; z-index: 2147483645; background: ${C.L.menu};
  border: 1px solid ${C.border.std}; box-shadow: 0 0 20px rgba(0, 229, 255, 0.15), 0 4px 16px rgba(0,0,0,0.6);
  min-width: 160px; padding: 4px 0; }
.ytpu-chipbar-popover > a { display: block; padding: 8px 14px; color: ${C.cyan};
  font: 500 12px/1.2 ${C.mono}; text-decoration: none; transition: ${C.speed}; }
.ytpu-chipbar-popover > a:hover { background: ${C.wash}; color: ${C.white}; }

/* ——— Playlist close button (AjaxGb engine, Ψ-styled) ——— */
#player-playlist .playlist-header, #playlist .header { position: relative; }
.ytpu-close-btn { width: 44px; height: 40px; position: absolute; top: 0px; right: 0px;
  display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.55;
  background: ${C.L.menu}; border: none; border-bottom: 1px solid ${C.border.subtle};
  border-left: 1px solid ${C.border.subtle}; transition: ${C.speed}; padding: 0; color: ${C.cyan}; }
.ytpu-close-btn:hover { opacity: 1; background: ${C.wash}; box-shadow: ${C.glow.mid}; }
.ytpu-close-btn svg { width: 20px; height: 20px; stroke: ${C.cyan}; stroke-width: 2.4;
  fill: none; stroke-linecap: round; }

/* ——— Playlist date/views metadata line (James0x57 engine) ——— */
#video-title.ytd-playlist-video-renderer[aria-label]:after {
  content: attr(data-ytpu-meta); font-weight: normal; font-size: 12px; display: block;
  font-family: ${C.mono}; color: rgba(0, 229, 255, 0.75); margin-top: 2px; }

/* ——— Playlist action-menu injections (autoplay switch + reverse order) ——— */
#playlist-action-menu .top-level-buttons { align-items: center; }
.ytpu-pl-switch { position: relative; height: 20px; width: 36px; cursor: pointer; margin-left: 8px;
  background: ${C.trough}; border: 1px solid ${C.cyan}; border-radius: 10px; padding: 0;
  transition: ${C.speed}; display: inline-block; vertical-align: middle; }
.ytpu-pl-switch .knob { position: absolute; left: 0; top: 0; height: 20px; width: 20px;
  background: ${C.cyan}; border-radius: 50%; box-shadow: ${C.glow.knob};
  transition: left linear .08s, background-color linear .08s; }
.ytpu-pl-switch.on { background: ${C.wash}; }
.ytpu-pl-switch.on .knob { left: calc(100% - 20px); background: ${C.cyan2}; }
.ytpu-rev-btn { height: 32px; width: 40px; margin-left: 8px; padding: 0 6px; cursor: pointer;
  ${adaptive ? `background: var(--yt-spec-additive-background, rgba(255,255,255,0.1)); border: 1px solid transparent; border-radius: 16px;`
              : `background: ${C.L.menu}; border: 1px solid ${C.border.btn}; border-radius: 16px;`}
  display: inline-flex; align-items: center; justify-content: center; transition: ${C.speed}; }
.ytpu-rev-btn:hover { ${adaptive ? `background: var(--yt-spec-badge-style-type-live-now, rgba(255,255,255,0.2));`
                                  : `background: ${C.wash}; box-shadow: ${C.glow.mid};`} }
.ytpu-rev-btn svg { width: 24px; height: 24px; }
.ytpu-rev-btn .arrow-up { fill: rgba(144,144,144,0.9); transition: fill 150ms ease-in-out; }
.ytpu-rev-btn .arrow-down { fill: rgba(144,144,144,0.9); transition: fill 150ms ease-in-out; }
.ytpu-rev-btn.reversed .arrow-up { fill: ${C.cyan}; }
.ytpu-rev-btn:not(.reversed) .arrow-down { fill: ${adaptive ? 'var(--ytpu-hover, #67E8F9)' : C.cyan2}; }
.ytpu-rev-btn .pulse { animation: ytpu-pulse 0.3s ease; }
@keyframes ytpu-pulse { 0% { opacity: 0.35; } 50% { opacity: 1; } 100% { opacity: 1; } }
.ytpu-tt { position: relative; }
.ytpu-tt .tip { position: absolute; top: 28px; left: 50%; transform: translateX(-50%);
  background: rgba(10, 19, 26, 0.92); border: 1px solid ${C.border.std}; color: ${C.cyan};
  font: 500 12px/1 ${C.mono}; padding: 4px 8px; border-radius: 2px; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: opacity 0.15s ease; z-index: 100; }
.ytpu-tt:hover .tip { opacity: 1; }

/* ——— Quick-playlist add buttons on the subscriptions feed ——— */
.ytpu-qp-add { width: 26px; height: 26px; border-radius: 2px; ${glassBtn}
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
  transition: ${C.speed}; }
.ytpu-qp-add svg { width: 16px; height: 16px; fill: currentColor; }
.ytpu-qp-add:hover { ${adaptive ? `background: var(--yt-spec-badge-style-type-live-now, rgba(255,255,255,0.2));`
                                 : `background: ${C.wash}; border-color: ${C.cyan}; box-shadow: ${C.glow.mid};`} }
.ytpu-qp-add.in-list { ${adaptive ? `color: var(--yt-spec-call-to-action, #3ea6ff);`
                                   : `background: ${C.wash}; border-color: ${C.cyan}; color: ${C.cyan2};`} }

/* ——— Export entry inside YouTube's three-dot menu ——— */
#ytpuExportEntry { cursor: pointer; height: 36px; width: 100%; display: flex; align-items: center;
  transition: ${C.speed}; }
#ytpuExportEntry svg { width: 22px; height: 22px; margin: 0 13px 0 16px; color: ${C.cyan};
  fill: currentColor; flex: 0 0 auto; }
#ytpuExportEntry span { font-family: "Roboto","Arial",sans-serif; color: ${adaptive ? 'var(--yt-spec-text-primary, #d9d9d9)' : '#d9d9d9'};
  white-space: nowrap; font-size: 1.4rem; line-height: 2rem; font-weight: 400; }
#ytpuExportEntry:hover { background: rgba(0, 229, 255, 0.12); }
tp-yt-paper-listbox#items { overflow-x: hidden; }
ytd-menu-popup-renderer.ytd-popup-container { overflow-x: hidden !important; max-height: none !important; }
tp-yt-iron-dropdown.ytd-popup-container #contentWrapper > yt-sheet-view-model.ytd-popup-container { max-height: unset !important; }

/* ——— Huge-playlist browser panel (replaces YTPA playlist emulator) ——— */
.ytpu-huge-browser { margin-bottom: 1.6rem; border-radius: 4px; background: ${C.L.window};
  border: 1px solid ${C.border.subtle}; box-shadow: ${C.glow.out}; overflow: hidden; }
.ytpu-huge-browser > .title { font: 700 1.6rem/1.2 ${C.display}; background: ${C.L.header};
  border-bottom: 2px solid ${C.cyan}; color: ${C.cyan2}; padding: 0.8rem; }
.ytpu-huge-browser > .information { font: 500 1rem/1.5 ${C.mono}; background: ${C.L.panel};
  color: rgba(0, 229, 255, 0.75); padding: 0.8rem; }
.ytpu-huge-browser > .items { max-height: 500px; overflow-y: auto; overflow-x: hidden; }
.ytpu-huge-browser > .items::-webkit-scrollbar { width: 6px; height: 6px; }
.ytpu-huge-browser > .items::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); }
.ytpu-huge-browser > .items::-webkit-scrollbar-thumb { background: ${C.cyan}; border-radius: 0; }
.ytpu-huge-browser > .items::-webkit-scrollbar-thumb:hover { background: ${C.cyan2}; }
.ytpu-huge-browser > .items > .item { background: ${C.L.panel}; padding: 0.6rem 0.8rem;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12); font: 500 1.3rem/1.4 ${C.mono};
  color: ${C.cyan}; min-height: 3.4rem; cursor: pointer; transition: ${C.speed}; }
.ytpu-huge-browser > .items > .item:hover { background: ${C.wash}; }
.ytpu-huge-browser > .items > .item[data-current] { background: ${C.washDeep}; color: ${C.white};
  border-left: 2px solid ${C.cyan}; }
.ytpu-huge-browser > .footer { background: ${C.L.header}; padding: 0.6rem 0.8rem;
  font: 500 1.1rem/1 ${C.mono}; color: rgba(0, 229, 255, 0.7); }
body:has(.ytpu-huge-browser) .ytp-prev-button.ytp-button,
body:has(.ytpu-huge-browser) .ytp-next-button.ytp-button:not([ytpu-huge="applied"]) { display: none !important; }

/* ——— Playlist row filter (deck manager section) ——— */
.ytpu-row-hidden { display: none !important; }

/* ——— Duplicate-injection race guard (YTPA pattern) ——— */
.ytpu-chipbar ~ .ytpu-chipbar { display: none; }
`;
        }

        /** Shadow-DOM CSS for the command deck, dialogs and modals. */
        function deckCss() {
            const s = C;
            return `
:host { all: initial; }
* { box-sizing: border-box; }
.panel, .modal-card {
  font: 13px/1.45 ${s.mono}; color: ${s.cyan};
  background: ${s.L.window}; border: 1px solid ${s.border.subtle};
  box-shadow: ${s.glow.out};
  display: flex; flex-direction: column; overflow: hidden;
  transition: ${s.speed}; }
.panel { width: 340px; max-height: 72vh; }
.panel.collapsed { width: 52px; height: 52px; border-radius: 0; align-items: center;
  justify-content: center; cursor: pointer; background: ${s.L.header}; }
.panel.collapsed > *:not(.badge) { display: none !important; }
.panel.collapsed .badge { display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; }
.badge { padding: 0; background: none; border: none; }
.badge:hover { filter: drop-shadow(0 0 8px rgba(0,229,255,0.9)); }
.header { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: ${s.L.header}; border-bottom: 2px solid ${s.cyan}; }
.title { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.title .t1 { font: 700 14px/1.1 ${s.display}; color: ${s.cyan2}; letter-spacing: 0.08em; }
.title .t2 { font: 500 9px/1.4 ${s.mono}; color: rgba(0, 229, 255, 0.7); letter-spacing: 0.14em; }
.acct { font-weight: 400; font-size: 10px; color: rgba(0, 229, 255, 0.55);
  max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count { font-variant-numeric: tabular-nums; color: ${s.cyan2}; font-weight: 700; }
button.icon { background: none; border: 1px solid transparent; color: ${s.cyan}; cursor: pointer;
  padding: 4px 6px; font-size: 14px; transition: ${s.speed}; display: inline-flex; }
button.icon:hover { color: ${s.cyan2}; background: ${s.wash}; border-color: ${s.border.btn}; }
button.icon svg { width: 16px; height: 16px; fill: currentColor; }
.progress { height: 4px; background: rgba(0, 0, 0, 0.4); }
.progress > .bar { height: 100%; background: ${s.cyan}; width: 0%; transition: width .2s ease-in-out; }
.sections { overflow-y: auto; }
.sections::-webkit-scrollbar { width: 6px; }
.sections::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); }
.sections::-webkit-scrollbar-thumb { background: ${s.cyan}; border-radius: 0; }
.sections::-webkit-scrollbar-thumb:hover { background: ${s.cyan2}; }
.section { padding: 8px 12px; border-bottom: 1px solid rgba(0, 229, 255, 0.12); }
.section-title { font: 700 10px/1.2 ${s.mono}; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(0, 229, 255, 0.7); margin-bottom: 6px; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.span2 { grid-column: 1 / -1; }
.btn { background: ${s.L.menu}; border: 1px solid ${s.border.btn}; color: ${s.cyan};
  border-radius: 0px; padding: 8px 10px; font: 700 12px/1.2 ${s.mono}; cursor: pointer;
  transition: ${s.speed}; text-align: center; }
.btn:hover { background: ${s.wash}; border-color: ${s.cyan}; box-shadow: ${s.glow.mid}; color: ${s.cyan2}; }
.btn:active { background: ${s.washDeep}; color: ${s.white}; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.primary { border-color: ${s.cyan}; color: ${s.cyan2}; }
.btn.danger { border-color: ${s.pink}; color: ${s.pink}; }
.btn.danger:hover { background: rgba(255, 0, 85, 0.3); box-shadow: ${s.glow.pink}; color: ${s.white}; }
.field { display: flex; align-items: center; gap: 6px; margin: 6px 0; font-size: 12px; }
.field label { flex: 1; color: rgba(0, 229, 255, 0.85); }
input[type="text"], input[type="number"], select, textarea {
  background: ${s.L.panel}; border: 1px solid ${s.border.btn}; color: ${s.cyan};
  border-radius: 0px; padding: 6px; font: 500 12px/1.2 ${s.mono}; transition: ${s.speed};
  max-width: 100%; }
input[type="text"]:hover, select:hover, textarea:hover { border-color: ${s.cyan}; }
input[type="number"] { width: 72px; }
select option { background: #0a131a; color: ${s.cyan}; }
textarea { width: 100%; min-height: 220px; resize: vertical; white-space: pre; }
input[type="file"] { display: none; }
.switch { position: relative; width: 40px; height: 20px; flex: 0 0 auto; cursor: pointer;
  background: ${s.trough}; border: 1px solid ${s.cyan}; border-radius: 10px; transition: ${s.speed}; }
.switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.switch .slider { position: absolute; top: 1px; left: 1px; width: 16px; height: 16px;
  border-radius: 50%; background: ${s.cyan}; box-shadow: ${s.glow.knob};
  transition: transform .15s ease-in-out, background .15s ease-in-out; }
.switch input:checked + .slider { transform: translateX(20px); background: ${s.cyan2}; }
.switch input:focus-visible + .slider { outline: 2px solid ${s.cyan2}; outline-offset: 2px; }
.switch.on { background: ${s.wash}; }
.tog { display: flex; align-items: center; gap: 10px; padding: 5px 0; }
.tog .text { flex: 1; font-size: 12px; color: rgba(0, 229, 255, 0.85); }
.group-title { font: 700 11px/1.4 ${s.mono}; letter-spacing: 0.14em; text-transform: uppercase;
  color: ${s.cyan2}; border-bottom: 1px solid ${s.border.std}; margin: 10px 0 4px; padding-bottom: 2px; }
.destpicker { padding: 8px 12px; background: ${s.L.menu}; border-bottom: 1px solid ${s.border.subtle}; }
.dest-list { max-height: 180px; overflow: auto; margin: 6px 0; border: 1px solid ${s.border.subtle}; }
.dest-list::-webkit-scrollbar { width: 6px; }
.dest-list::-webkit-scrollbar-thumb { background: ${s.cyan}; }
.dest-row { display: flex; align-items: center; padding: 5px; cursor: pointer; transition: ${s.speed}; }
.dest-row:hover { background: ${s.wash}; color: ${s.white}; }
.dest-row input { margin-right: 6px; accent-color: ${s.cyan}; }
.dest-row .dest-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dest-manual { width: 100%; box-sizing: border-box; margin: 4px 0; padding: 6px;
  background: ${s.L.panel}; border: 1px solid ${s.border.btn}; color: ${s.cyan};
  border-radius: 0px; font: 500 11px/1.2 ${s.mono}; }
.dest-actions { display: flex; gap: 6px; justify-content: flex-end; padding-top: 6px;
  border-top: 1px solid rgba(0, 229, 255, 0.12); }
.log { flex: 1; max-height: 130px; overflow: auto; padding: 6px 12px; font-size: 11px;
  color: rgba(0, 229, 255, 0.75); border-top: 1px solid rgba(0, 229, 255, 0.12); }
.log::-webkit-scrollbar { width: 6px; }
.log::-webkit-scrollbar-thumb { background: ${s.cyan}; }
.log-info { color: rgba(0, 229, 255, 0.75); }
.log-ok { color: #67f5c8; }
.log-warn { color: #fd7; }
.log-err { color: #f77; }
.hint { font-size: 10px; color: rgba(0, 229, 255, 0.55); padding: 4px 12px; letter-spacing: 0.1em; }
dialog { border: none; padding: 0; background: none; box-shadow: none;
  width: fit-content; max-width: 94vw; }
dialog::backdrop { background: rgba(0, 0, 0, 0.72); }
dialog .modal-card { width: min(560px, 92vw); max-height: 84vh; }
.modal-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: ${s.L.header}; border-bottom: 2px solid ${s.cyan}; }
.modal-title { flex: 1; font: 700 13px/1.2 ${s.display}; color: ${s.cyan2}; letter-spacing: 0.08em; }
.modal-body { padding: 12px 14px; overflow-y: auto; }
.modal-body::-webkit-scrollbar { width: 6px; }
.modal-body::-webkit-scrollbar-thumb { background: ${s.cyan}; }
.modal-foot { display: flex; gap: 8px; justify-content: flex-end; padding: 10px 14px;
  border-top: 1px solid rgba(0, 229, 255, 0.12); }
.modal-list { list-style: none; margin: 0; padding: 0; font-size: 12px; }
.modal-list li { padding: 5px 6px; border-bottom: 1px solid rgba(0, 229, 255, 0.1); display: flex;
  gap: 8px; align-items: baseline; }
.modal-list a { color: ${s.cyan2}; text-decoration: none; }
.modal-list a:hover { text-decoration: underline; }
.modal-list .tag { font-size: 10px; padding: 1px 4px; border: 1px solid ${s.border.btn};
  color: ${s.cyan}; flex: 0 0 auto; }
.modal-list .tag.gone { border-color: ${s.pink}; color: ${s.pink}; }
.kv { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0;
  color: rgba(0, 229, 255, 0.7); }
`;
        }

        function apply() {
            DOMU.setPageStyle(pageCss());
            BUS.emit('theme-applied');
        }

        return { C, pageCss, deckCss, apply };
    })();

    const DECK = (() => {
        let root = null;
        let shadow = null;
        const elx = {}; // element registry
        const logRing = [];
        let busy = false;
        let selectionWired = false; // v1.2.0: re-mount-safe single registration of the adapter hook
        let ownedPlaylists = [];
        let ownedTag = null;

        function logMsg(msg, kind = 'info') {
            logRing.push({ t: Date.now(), msg: String(msg), kind });
            if (logRing.length > CFG.LOG_RING_CAP) logRing.shift();
            renderLog();
        }

        function renderLog() {
            if (!elx.log) return;
            // v1.4.0: clear via replaceChildren — innerHTML assignment is a
            // Trusted Types sink even for the empty string on enforcing
            // profiles. The innerHTML fallback only ever runs on pre-2020
            // engines, none of which implement Trusted Types.
            if (typeof elx.log.replaceChildren === 'function') elx.log.replaceChildren();
            else elx.log.innerHTML = '';
            for (const e of logRing.slice(-10).reverse()) {
                elx.log.appendChild(DOMU.el('div', { class: `log-${e.kind}` }, { textContent: e.msg }));
            }
        }

        function setProgress(frac) {
            if (!elx.bar) return;
            elx.bar.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
        }

        function setBadgeCount(n) {
            if (!elx.badgeCount) return;
            elx.badgeCount.textContent = n ? String(n) : '';
        }

        // ---- UI-in-flight lock: whole user-initiated workflows are atomic ----
        async function withLock(fn) {
            if (busy) {
                logMsg('Another operation is in progress — wait for it to finish.', 'warn');
                return null;
            }
            busy = true;
            setActionsDisabled(true);
            try {
                return await fn();
            } finally {
                busy = false;
                setActionsDisabled(false);
            }
        }

        function setActionsDisabled(disabled) {
            for (const key of ['selall', 'clear', 'copy', 'move', 'delBtn', 'export', 'importLbl', 'snapshot', 'check', 'plaintext', 'dupes', 'rowFilter']) {
                if (elx[key]) elx[key].disabled = disabled;
            }
        }

        function toggleExpand() {
            elx.panel.classList.toggle('collapsed');
            if (!elx.panel.classList.contains('collapsed')) loadOwnedPlaylists();
        }

        function updateVisibility(route) {
            if (!root || !elx.panel) return; // v1.4.0: guard the registry too — a partial mount must no-op
            const show = STORE.data().appearance.deckEverywhere !== false
                || route.isPlaylistPage || route.isSubscriptions || (route.isWatch && !!route.list);
            root.style.display = show ? '' : 'none';
            elx.secManager.style.display = route.isPlaylistPage ? '' : 'none';
            elx.secSort.style.display = route.isPlaylistPage ? '' : 'none';
            elx.secQuick.style.display = route.isSubscriptions ? '' : 'none';
            // Leaving a playlist page invalidates the row filter — clear both
            // the adapter state and the deck input so a stale needle can't hide
            // rows on the next playlist.
            if (!route.isPlaylistPage && elx.rowFilter) {
                if (elx.rowFilter.value) elx.rowFilter.value = '';
                DOMADAPTER.setFilter('');
            }
        }

        async function loadOwnedPlaylists() {
            const tag = AUTH.identityTag();
            if (ownedPlaylists.length && ownedTag === tag) return;
            try {
                ownedPlaylists = await READER.loadOwnedPlaylists();
                ownedTag = tag;
                logMsg(`Loaded ${ownedPlaylists.length} of your playlists`, 'ok');
            } catch (e) {
                logMsg(`Failed to load playlists: ${e && e.message}`, 'err');
            }
        }

        function refreshAccount() {
            if (!elx.acct) return;
            const idx = ENV.cfgGet('SESSION_INDEX') || 0;
            const brand = ENV.cfgGet('DELEGATED_SESSION_ID');
            elx.acct.textContent = `· ${brand ? `brand ${String(brand).slice(0, 6)}…` : `account ${idx}`}`;
            AUTH.accountLabel().then((name) => {
                if (name && elx.acct.isConnected) {
                    elx.acct.textContent = `· ${name}`;
                    elx.acct.title = 'Active account';
                }
            }).catch(() => {});
        }

        // ---- destination picker ----
        function showDestPicker(mode, onConfirm) {
            const sel = DOMADAPTER.getSelection();
            if (!sel.size) { logMsg('No videos selected', 'warn'); return; }
            const srcId = DOMADAPTER.currentPlaylistId();
            const render = () => {
                const candidates = ownedPlaylists.filter((p) => p.id !== srcId);
                elx.destpicker.textContent = '';
                elx.destpicker.appendChild(DOMU.el('div', { style: 'font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:4px;' }, {}, {}, {}, [
                    DOMU.el('span', {}, { textContent: `${mode === 'move' ? 'Move' : 'Copy'} ${sel.size} videos to:` }, { flex: '1' }),
                    DOMU.el('button', { class: 'icon', id: 'refreshpls', title: 'Reload your playlists' }, {}, {}, {
                        click: async () => {
                            ownedTag = null;
                            await loadOwnedPlaylists();
                            render();
                        },
                    }, [document.createTextNode('↻')]),
                ]));
                const list = DOMU.el('div', { class: 'dest-list' });
                list.appendChild(DOMU.el('label', { class: 'dest-row', style: 'border-bottom:1px solid rgba(0,229,255,0.12);font-style:italic;' }, {}, {}, {}, [
                    DOMU.el('input', { type: 'checkbox', value: '__NEW__' }),
                    DOMU.el('span', { class: 'dest-title' }, { textContent: '+ Create new playlist…' }),
                ]));
                for (const p of candidates) {
                    list.appendChild(DOMU.el('label', { class: 'dest-row' }, {}, {}, {}, [
                        DOMU.el('input', { type: 'checkbox', value: p.id }),
                        DOMU.el('span', { class: 'dest-title' }, { textContent: p.title, title: p.id }),
                    ]));
                }
                elx.destpicker.appendChild(list);
                const manual = DOMU.el('input', { id: 'destmanual', class: 'dest-manual', placeholder: '…or paste a playlist URL / ID', type: 'text' });
                elx.destpicker.appendChild(manual);
                elx.destpicker.appendChild(DOMU.el('div', { class: 'dest-actions' }, {}, {}, {}, [
                    DOMU.el('button', { class: 'btn', id: 'cancelpick' }, { textContent: 'Cancel' }, {}, {
                        click: () => { elx.destpicker.style.display = 'none'; },
                    }),
                    DOMU.el('button', { class: 'btn primary', id: 'confirmpick' }, { textContent: 'Go' }, {}, {
                        click: () => {
                            const picks = [...elx.destpicker.querySelectorAll('.dest-row input:checked')].map((i) => i.value);
                            const manualValue = elx.destpicker.querySelector('#destmanual')?.value?.trim();
                            if (manualValue) {
                                const id = parsePlaylistId(manualValue);
                                if (!id) { logMsg('Could not read a playlist ID from that input', 'warn'); return; }
                                if (!picks.includes(id)) picks.push(id);
                            }
                            if (!picks.length) { logMsg('Pick at least one destination', 'warn'); return; }
                            elx.destpicker.style.display = 'none';
                            onConfirm(picks, sel);
                        },
                    }),
                ]));
            };
            render();
            elx.destpicker.style.display = 'block';
        }

        function parsePlaylistId(s) {
            try { const l = new URL(s, location.origin).searchParams.get('list'); if (l) return l; } catch (e) { /* fall through */ }
            const m = String(s).match(/[A-Za-z0-9_-]{13,}/);
            return m ? m[0] : null;
        }

        function modal(title, buildBody, actions = []) {
            const dlg = document.createElement('dialog');
            const card = DOMU.el('div', { class: 'modal-card' });
            card.appendChild(DOMU.el('div', { class: 'modal-head' }, {}, {}, {}, [
                DOMU.el('div', { class: 'modal-title' }, { textContent: title }),
                DOMU.el('button', { class: 'icon', title: 'Close' }, {}, {}, {
                    click: () => dlg.close(),
                }, [document.createTextNode('×')]),
            ]));
            const body = DOMU.el('div', { class: 'modal-body' });
            buildBody(body);
            card.appendChild(body);
            if (actions.length) {
                const foot = DOMU.el('div', { class: 'modal-foot' });
                for (const a of actions) {
                    // Listener added after the button's own creation-time handler,
                    // so it runs once the action has completed its sync phase.
                    if (!a.hasAttribute('data-keep-open')) a.addEventListener('click', () => dlg.close());
                    foot.appendChild(a);
                }
                card.appendChild(foot);
            }
            dlg.appendChild(card);
            shadow.appendChild(dlg);
            dlg.addEventListener('close', () => dlg.remove());
            dlg.showModal();
            return { close: () => dlg.close(), element: dlg };
        }

        function mount() {
            if (root && root.isConnected) return;
            if (root && !root.isConnected) {
                // v1.2.0: YouTube or another extension detached the deck —
                // reset the cached references so a full re-mount rebuilds the
                // element registry instead of writing into a dead tree
                // forever (v1.1.0 could never recover from removal).
                root = null;
                shadow = null;
                for (const key of Object.keys(elx)) delete elx[key];
            }
            // v1.4.0: atomic mount. v1.3.0 committed `root` to the DOM before
            // building the panel — a construction throw (e.g. the v1.3.0
            // TrustedTypes failure) left a live-but-empty #ytpu-deck node that
            // made `root.isConnected` true, which silently defeated the
            // idempotency guard, the 5 s watchdog AND the Alt+Shift+X rescue
            // (all see "connected" and skip the re-mount). Everything is now
            // built into locals and module state is only mutated in the
            // commit phase at the end — a throw leaves root null, elx empty
            // and nothing appended, so every recovery path stays operational.
            const nextRoot = document.createElement('div');
            nextRoot.id = 'ytpu-deck';
            nextRoot.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483646;';
            const nextShadow = nextRoot.attachShadow({ mode: 'open' });

            const style = document.createElement('style');
            style.textContent = THEME.deckCss();
            nextShadow.appendChild(style);

            const panel = DOMU.el('div', { class: 'panel collapsed', id: 'panel' });

            // Badge (collapsed state): the Ψ glyph
            const badge = DOMU.el('button', { class: 'badge', id: 'badge', title: `${CFG.SCRIPT_NAME} — expand` }, {}, {}, {
                click: () => toggleExpand(),
            });
            badge.appendChild(GLYPH.node(44));
            const badgeCount = DOMU.el('span', { class: 'count', style: 'position:absolute;top:2px;right:2px;font-size:10px;' });

            // Header
            const header = DOMU.el('div', { class: 'header' }, {}, {}, {}, [
                DOMU.el('div', { class: 'title' }, {}, {}, {}, [
                    DOMU.el('div', { class: 't1' }, { textContent: 'PLAYLIST MASTER' }),
				    DOMU.el('div', { class: 't2' }, { textContent: `v${CFG.SCRIPT_VERSION}`}),
                ]),
                DOMU.el('span', { class: 'acct', id: 'acct', title: 'Active account' }),
                DOMU.el('span', { class: 'count', id: 'count' }),
                DOMU.el('button', { class: 'icon', id: 'settingsBtn', title: 'Settings' }, {}, {}, {
                    click: () => SETTINGS.show(),
                }, [DOMU.svgPath('M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5zm7.4-2.6l2.1-1.6-2-3.5-2.5 1a7.7 7.7 0 0 0-1.8-1L14.8 5h-4l-.4 2.8a7.7 7.7 0 0 0-1.8 1l-2.5-1-2 3.5 2.1 1.6a8 8 0 0 0 0 2L4.1 15l2 3.5 2.5-1a7.7 7.7 0 0 0 1.8 1l.4 2.8h4l.4-2.8a7.7 7.7 0 0 0 1.8-1l2.5 1 2-3.5-2.1-1.6a8 8 0 0 0 0-2z')]),
                DOMU.el('button', { class: 'icon', id: 'collapse', title: 'Collapse' }, {}, {}, {
                    click: () => toggleExpand(),
                }, [document.createTextNode('—')]),
            ]);

            const progress = DOMU.el('div', { class: 'progress' }, {}, {}, {}, [
                DOMU.el('div', { class: 'bar', id: 'bar' }),
            ]);

            // Manager section
            const secManager = DOMU.el('div', { class: 'section', id: 'secManager' }, {}, {}, {}, [
                DOMU.el('div', { class: 'section-title' }, { textContent: 'Ψ Playlist Manager' }),
                DOMU.el('div', { class: 'actions' }, {}, {}, {}, [
                    DOMU.el('button', { class: 'btn', id: 'selall' }, { textContent: 'Select all' }, {}, { click: () => DOMADAPTER.selectAll() }),
                    DOMU.el('button', { class: 'btn', id: 'clear' }, { textContent: 'Clear' }, {}, { click: () => DOMADAPTER.clearSelection() }),
                    DOMU.el('button', { class: 'btn primary', id: 'copy' }, { textContent: 'Copy to…' }, {}, {
                        click: () => showDestPicker('copy', (picks, sel) => withLock(() => MANAGER.runBulkOp('copy', picks, sel))),
                    }),
                    DOMU.el('button', { class: 'btn primary', id: 'move' }, { textContent: 'Move to…' }, {}, {
                        click: () => showDestPicker('move', (picks, sel) => withLock(() => MANAGER.runBulkOp('move', picks, sel))),
                    }),
                    DOMU.el('button', { class: 'btn danger span2', id: 'delBtn' }, { textContent: 'Delete from this playlist' }, {}, {
                        click: () => withLock(() => MANAGER.doDelete()),
                    }),
                    DOMU.el('button', { class: 'btn', id: 'export' }, { textContent: 'Export JSON' }, {}, {
                        click: () => withLock(() => MANAGER.doExport()),
                    }),
                    DOMU.el('label', { class: 'btn', id: 'importLbl', for: 'importfile', style: 'text-align:center;cursor:pointer;' }, { textContent: 'Import JSON' }),
                    DOMU.el('input', { type: 'file', id: 'importfile', accept: '.json,application/json' }, {}, {}, {
                        change: (e) => {
                            const file = e.target.files[0];
                            e.target.value = ''; // allow re-import of the same file
                            withLock(() => MANAGER.doImport(file));
                        },
                    }),
                    DOMU.el('button', { class: 'btn', id: 'snapshot' }, { textContent: 'Snapshot' }, {}, {
                        click: () => withLock(() => EXPORTER.doSnapshot()),
                    }),
                    DOMU.el('button', { class: 'btn', id: 'check' }, { textContent: 'Check changes' }, {}, {
                        click: () => withLock(() => EXPORTER.doCheck()),
                    }),
                    DOMU.el('button', { class: 'btn span2', id: 'plaintext' }, { textContent: 'Export as plaintext…' }, {}, {
                        click: () => withLock(() => EXPORTER.openPlaintextDialog()),
                    }),
                    DOMU.el('button', { class: 'btn span2', id: 'dupes' }, { textContent: 'Find duplicates' }, {}, {
                        click: () => MANAGER.doDupes(),
                    }),
                ]),
                DOMU.el('input', {
                    type: 'text', id: 'rowFilter', class: 'dest-manual',
                    placeholder: 'Filter rows by title…',
                    style: 'width:100%;box-sizing:border-box;margin-top:6px;',
                }, {}, {}, {
                    input: (e) => DOMADAPTER.setFilter(e.target.value),
                }),
            ]);

            // Sort section
            const secSort = DOMU.el('div', { class: 'section', id: 'secSort' }, {}, {}, {}, [
                DOMU.el('div', { class: 'section-title' }, { textContent: 'Ψ Sort By Duration' }),
                DOMU.el('div', { class: 'actions' }, {}, {}, {}, [
                    DOMU.el('button', { class: 'btn primary', id: 'sortGo' }, { textContent: 'Sort Videos' }, {}, {
                        click: () => withLock(() => SORTER.activateSort()),
                    }),
                    DOMU.el('button', { class: 'btn danger', id: 'sortStop' }, { textContent: 'Stop Sort' }, {}, {
                        click: () => SORTER.stop(),
                    }),
                ]),
                DOMU.el('div', { class: 'field' }, {}, {}, {}, [
                    DOMU.el('label', { for: 'sortMode' }, { textContent: 'Order' }),
                    DOMU.el('select', { id: 'sortMode' }, {}, {}, {
                        change: (e) => STORE.patch({ sort: { mode: e.target.value } }),
                    }, [
                        DOMU.el('option', { value: 'asc' }, { textContent: 'Shortest First' }),
                        DOMU.el('option', { value: 'desc' }, { textContent: 'Longest First' }),
                    ]),
                ]),
                DOMU.el('div', { class: 'field' }, {}, {}, {}, [
                    DOMU.el('label', { for: 'sortScroll' }, { textContent: 'Scope' }),
                    DOMU.el('select', { id: 'sortScroll' }, {}, {}, {
                        change: (e) => STORE.patch({ sort: { autoScroll: e.target.value === 'all' } }),
                    }, [
                        DOMU.el('option', { value: 'all' }, { textContent: 'Sort all' }),
                        DOMU.el('option', { value: 'loaded' }, { textContent: 'Sort only loaded' }),
                    ]),
                ]),
                DOMU.el('div', { class: 'field' }, {}, {}, {}, [
                    DOMU.el('label', { for: 'sortRetry' }, { textContent: 'Scroll retry (ms)' }),
                    DOMU.el('input', { type: 'number', id: 'sortRetry', min: '100', max: '5000', step: '100' }, { value: String(STORE.data().sort.scrollLoopTime) }, {}, {
                        input: (e) => {
                            const v = parseInt(e.target.value, 10);
                            if (Number.isFinite(v) && v >= 100 && v <= 5000) STORE.patch({ sort: { scrollLoopTime: v } });
                        },
                    }),
                ]),
            ]);

            // Quick playlist section (subscriptions feed)
            const secQuick = DOMU.el('div', { class: 'section', id: 'secQuick' }, {}, {}, {}, [
                DOMU.el('div', { class: 'section-title' }, { textContent: 'Ψ Quick Playlist' }),
                DOMU.el('div', { class: 'kv', id: 'qpCount' }, {}, { textContent: '0 videos' }),
                DOMU.el('a', { class: 'btn', id: 'qpOpen', href: 'javascript:void(0)' }, { textContent: 'Open playlist' }, {}, {
                    click: (e) => { if (!QUICK.videoIds.length) { e.preventDefault(); logMsg('Quick playlist is empty', 'warn'); } },
                }),
                DOMU.el('div', { class: 'actions', style: 'margin-top:6px;' }, {}, {}, {}, [
                    DOMU.el('button', { class: 'btn', id: 'qpCopy' }, { textContent: 'Copy IDs' }, {}, {
                        click: async () => {
                            const ok = await DOMU.copyText(QUICK.videoIds.join(','));
                            logMsg(ok ? 'Video IDs copied' : 'Copy failed — select the field text manually', ok ? 'ok' : 'err');
                        },
                    }),
                    DOMU.el('button', { class: 'btn danger', id: 'qpClear' }, { textContent: 'Clear' }, {}, {
                        click: () => QUICK.clear(),
                    }),
                ]),
            ]);

            const destpicker = DOMU.el('div', { class: 'destpicker', id: 'destpicker', style: 'display:none;' });
            const log = DOMU.el('div', { class: 'log', id: 'log' });
            const hint = DOMU.el('div', { class: 'hint' }, { textContent: 'hotkeys -> Alt+Shift+U·S·X  · // Ψ 4ndr0tools' });

            panel.appendChild(badge);
            badge.appendChild(badgeCount);
            panel.appendChild(header);
            panel.appendChild(progress);
            const sections = DOMU.el('div', { class: 'sections' });
            sections.appendChild(secManager);
            sections.appendChild(secSort);
            sections.appendChild(secQuick);
            panel.appendChild(sections);
            panel.appendChild(destpicker);
            panel.appendChild(log);
            panel.appendChild(hint);
            nextShadow.appendChild(panel);

            const nextElx = {
                panel, badge, badgeCount, header, acct: header.querySelector('#acct'), count: header.querySelector('#count'),
                settingsBtn: header.querySelector('#settingsBtn'), collapse: header.querySelector('#collapse'),
                bar: progress.querySelector('#bar'),
                secManager, secSort, secQuick,
                selall: secManager.querySelector('#selall'), clear: secManager.querySelector('#clear'),
                copy: secManager.querySelector('#copy'), move: secManager.querySelector('#move'),
                delBtn: secManager.querySelector('#delBtn'), export: secManager.querySelector('#export'),
                importLbl: secManager.querySelector('#importLbl'), importfile: secManager.querySelector('#importfile'),
                snapshot: secManager.querySelector('#snapshot'), check: secManager.querySelector('#check'),
                plaintext: secManager.querySelector('#plaintext'), dupes: secManager.querySelector('#dupes'),
                rowFilter: secManager.querySelector('#rowFilter'),
                sortGo: secSort.querySelector('#sortGo'), sortStop: secSort.querySelector('#sortStop'),
                sortMode: secSort.querySelector('#sortMode'), sortScroll: secSort.querySelector('#sortScroll'),
                sortRetry: secSort.querySelector('#sortRetry'),
                qpCount: secQuick.querySelector('#qpCount'), qpOpen: secQuick.querySelector('#qpOpen'),
                qpCopy: secQuick.querySelector('#qpCopy'), qpClear: secQuick.querySelector('#qpClear'),
                destpicker, log,
            };
            // reflect persisted options into the selects
            nextElx.sortMode.value = STORE.data().sort.mode;
            nextElx.sortScroll.value = STORE.data().sort.autoScroll ? 'all' : 'loaded';

            // ---- commit phase: module state changes only after the whole
            // deck has been built. A throw anywhere above leaves root null,
            // elx empty and nothing appended to the document — the watchdog,
            // rescue and hotkey paths all remain fully operational. ----
            document.body.appendChild(nextRoot);
            root = nextRoot;
            shadow = nextShadow;
            Object.assign(elx, nextElx);

            if (!selectionWired) {
                // v1.2.0: register exactly once across re-mounts (the adapter
                // keeps a listener set — re-mounting must not stack copies).
                selectionWired = true;
                DOMADAPTER.onSelectionChange((sel) => {
                    if (elx.count) elx.count.textContent = sel.size ? `${sel.size} selected` : '';
                    setBadgeCount(sel.size);
                });
            }

            refreshAccount();
            renderLog();
            LOG.info(`mounted · v${CFG.SCRIPT_VERSION}`);
        }

        // ---- v1.2.0: hotkey + failsafe entry points ----

        /** Hotkey path (Alt+Shift+U): recover first, then expand/collapse. */
        function toggleFromHotkey() {
            try {
                if (!root || !root.isConnected) mount();
                if (!root || !elx.panel) return;
                if (root.style.display === 'none') {
                    // Route rules are hiding the deck — an explicit hotkey
                    // press overrides them for this page view.
                    root.style.display = '';
                    if (elx.panel.classList.contains('collapsed')) toggleExpand();
                } else {
                    toggleExpand();
                }
            } catch (e) { LOG.error('hotkey toggle failed:', e); }
        }

        /** Failsafe (menu command / Alt+Shift+X): force a sane mounted,
         *  visible, on-top deck no matter what removed or hid it. */
        function rescue() {
            try {
                if (!root || !root.isConnected) mount();
                if (!root) return;
                root.style.display = '';
                root.style.setProperty('position', 'fixed', 'important');
                root.style.setProperty('right', '16px', 'important');
                root.style.setProperty('bottom', '16px', 'important');
                root.style.setProperty('z-index', '2147483646', 'important');
                if (elx.panel && elx.panel.classList.contains('collapsed')) toggleExpand();
                logMsg('Deck force-restored (menu failsafe / Alt+Shift+X)', 'ok');
            } catch (e) { LOG.error('deck rescue failed:', e); }
        }

        return {
            mount, logMsg, setProgress, withLock, showDestPicker, parsePlaylistId, modal,
            updateVisibility, refreshAccount, setActionsDisabled, elx,
            toggleFromHotkey, rescue,
            get ownedPlaylists() { return ownedPlaylists; },
            setOwned(list, tag) { ownedPlaylists = list; ownedTag = tag; },
            addOwned(entry) { ownedPlaylists.push(entry); },
            get root() { return root; },
        };
    })();

    const SETTINGS = (() => {
        function toggleRow(label, get, set) {
            const input = DOMU.el('input', { type: 'checkbox' }, { checked: !!get() });
            input.addEventListener('change', () => set(input.checked));
            const sw = DOMU.el('span', { class: `switch${input.checked ? ' on' : ''}` }, {}, {}, {}, [
                input,
                DOMU.el('span', { class: 'slider' }),
            ]);
            input.addEventListener('change', () => sw.classList.toggle('on', input.checked));
            return DOMU.el('label', { class: 'tog' }, {}, {}, {}, [
                sw,
                DOMU.el('span', { class: 'text' }, { textContent: label }),
            ]);
        }

        function group(title) {
            const g = DOMU.el('div', { class: 'group-title' }, { textContent: title });
            return { node: g, wrap: g };
        }

        const d = () => STORE.data();

        function buildBody(body) {
            const simple = (label, getPath, setPath) => toggleRow(label,
                () => getPath().reduce((o, k) => o && o[k], d()),
                (v) => STORE.patch(buildPatch(setPath, v)));
            function buildPatch(path, value) {
                const out = {};
                let cur = out;
                for (let i = 0; i < path.length; i++) {
                    cur[path[i]] = (i === path.length - 1) ? value : {};
                    cur = cur[path[i]];
                }
                return out;
            }

            body.appendChild(group('Appearance').node);
            body.appendChild(toggleRow('3lectric-Glass theme (off = adaptive YouTube blend)',
                () => d().appearance.theme === 'glass',
                (v) => {
                    STORE.patch({ appearance: { theme: v ? 'glass' : 'adaptive' } });
                    THEME.apply();
                    BUS.emit('reset');
                }));
            body.appendChild(toggleRow('Show spacer before channel buttons',
                () => d().appearance.spacerVisible,
                (v) => { STORE.patch({ appearance: { spacerVisible: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Ψ deck on all pages (off = playlist & subscriptions only)',
                () => d().appearance.deckEverywhere !== false,
                (v) => {
                    STORE.patch({ appearance: { deckEverywhere: v } });
                    DECK.updateVisibility(NAV.classify());
                }));
            body.appendChild(toggleRow('Global hotkeys — Alt+Shift+U deck · Alt+Shift+S settings · Alt+Shift+X rescue',
                () => (d().hotkeys ? d().hotkeys.enabled !== false : true),
                (v) => STORE.patch({ hotkeys: { enabled: v } }))); // live: HOTKEYS reads the flag on every keydown

            body.appendChild(group('Channel pages').node);
            body.appendChild(simple('Playlist buttons (All / Popular / Shorts / Streams…)',
                () => ['channelButtons', 'enabled'], ['channelButtons', 'enabled']));
            body.appendChild(simple('Members-only playlist button when joinable',
                () => ['membersTab', 'enabled'], ['membersTab', 'enabled']));
            body.appendChild(simple('Open playlists with "play next"',
                () => ['channelButtons', 'playNext'], ['channelButtons', 'playNext']));
            body.appendChild(simple('Open playlists in new tabs',
                () => ['channelButtons', 'newTabs'], ['channelButtons', 'newTabs']));
            body.appendChild(simple('Show playlist instead of playing',
                () => ['channelButtons', 'viewInsteadOfPlay'], ['channelButtons', 'viewInsteadOfPlay']));
            body.appendChild(simple('"Videos" tab plays all content (UU)',
                () => ['channelButtons', 'everythingOnVideos'], ['channelButtons', 'everythingOnVideos']));
            body.appendChild(simple('Random play buttons',
                () => ['channelButtons', 'randomEnabled'], ['channelButtons', 'randomEnabled']));

            body.appendChild(group('Playback').node);
            body.appendChild(toggleRow('Reverse autoplay order control',
                () => d().reverseOrder.enabled, (v) => { STORE.patch({ reverseOrder: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Playlist autoplay toggle switch',
                () => d().autoplay.enabled, (v) => { STORE.patch({ autoplay: { enabled: v } }); BUS.emit('reset'); }));

            body.appendChild(group('Playlist pages').node);
            body.appendChild(toggleRow('Bulk manager (select / copy / move / delete / import)',
                () => d().manager.enabled, (v) => { STORE.patch({ manager: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Export tools (three-dot entry + plaintext dialog)',
                () => d().exporter.enabled, (v) => { STORE.patch({ exporter: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Sort by duration',
                () => d().sort.enabled, (v) => { STORE.patch({ sort: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Show date posted & view count',
                () => d().metaInfo.enabled, (v) => { STORE.patch({ metaInfo: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Playlist close button',
                () => d().playlistClose.enabled, (v) => { STORE.patch({ playlistClose: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Huge-playlist browser fallback',
                () => d().hugePlaylist.enabled, (v) => { STORE.patch({ hugePlaylist: { enabled: v } }); BUS.emit('reset'); }));

            body.appendChild(group('Everywhere').node);
            body.appendChild(toggleRow('Queue & watch-later hover buttons',
                () => d().queueButtons.enabled, (v) => { STORE.patch({ queueButtons: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Quick playlist (subscriptions feed)',
                () => d().quickPlaylist.enabled, (v) => { STORE.patch({ quickPlaylist: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Auto-expand episode/chapter list',
                () => d().episodeExpand.enabled, (v) => { STORE.patch({ episodeExpand: { enabled: v } }); BUS.emit('reset'); }));
            body.appendChild(toggleRow('Debug logging',
                () => d().debug, (v) => STORE.patch({ debug: v })));
        }

        function show() {
            DECK.modal('Ψ SETTINGS — PLAYLIST MASTER', buildBody, [
                DOMU.el('button', { class: 'btn danger' }, { textContent: 'Reset all settings' }, {}, {
                    click: async () => {
                        if (!confirm('Reset ALL Playlist Master settings to defaults?')) return;
                        await STORE.reset();
                        THEME.apply();
                        BUS.emit('reset');
                        DECK.logMsg('Settings reset to defaults', 'ok');
                    },
                }),
                DOMU.el('button', { class: 'btn primary' }, { textContent: 'Done' }),
            ]);
        }

        return { show };
    })();

    const CHBTNS = (() => {
        let lastChannelId = null;
        let observer = null;
        let randomPopover = null;
        let popoverCloser = null;

        // &playnext=1 for everything
        // when playNext is on (never for Members-Only), always for Popular.
        function listUrl(listType, chanId) {
            const cb = STORE.data().channelButtons;
            let url = `https://www.youtube.com/playlist?list=${listType}${chanId}`;
            if ((cb.playNext && listType !== 'UUMO') || listType === 'PU') url += '&playnext=1';
            return url;
        }

        function viewUrl(listType, chanId) {
            const cb = STORE.data().channelButtons;
            const base = `https://www.youtube.com/playlist?list=${listType}${chanId}`;
            return cb.playNext && listType !== 'UUMO' ? `${base}&playnext=1` : base;
        }

        function makeButton(text, title, url, { posClass = '', onClick = null, state = null } = {}) {
            const cb = STORE.data().channelButtons;
            const btn = DOMU.el('a', {
                class: `ytpu-btn ${posClass} ${state === true ? 'ytpu-on' : state === false ? 'ytpu-off' : ''}`,
                title,
                role: 'button',
                tabindex: '0',
            }, { textContent: text });
            if (url) {
                btn.href = url;
                if (cb.newTabs) btn.target = '_blank';
            } else {
                btn.href = 'javascript:void(0)';
            }
            if (onClick) btn.addEventListener('click', (e) => { e.preventDefault(); onClick(e); });
            return btn;
        }

        function makeToggle(text, title, key) {
            const cb = STORE.data().channelButtons;
            return makeButton(text, title, null, {
                state: !!cb[key],
                onClick: () => {
                    cb[key] = !cb[key];
                    STORE.patch({ channelButtons: { [key]: cb[key] } });
                    render();
                },
            });
        }

        function hasMembership(pageData) {
            try {
                const head = pageData?.response?.header;
                if (!head) return false;
                if (head.c4TabbedHeaderRenderer?.sponsorButton) return true;
                const rows = head.pageHeaderRenderer?.content?.pageHeaderViewModel
                    ?.actions?.flexibleActionsViewModel?.actionsRows;
                for (const row of rows || []) {
                    for (const a of row.actions || []) {
                        if (a.buttonViewModel) return true;
                    }
                }
            } catch (e) { LOG.debug('membership probe failed:', e && e.message); }
            return false;
        }

        function availableTabs(pageData) {
            const out = { videos: false, shorts: false, streams: false };
            try {
                const tabs = pageData?.response?.contents?.twoColumnBrowseResultsRenderer?.tabs;
                for (const tab of tabs || []) {
                    if (!tab.tabRenderer) continue;
                    // Match URLs, not titles — titles are localized.
                    const url = tab.tabRenderer.endpoint?.commandMetadata?.webCommandMetadata?.url || '';
                    if (url.endsWith('/videos')) out.videos = true;
                    else if (url.endsWith('/shorts')) out.shorts = true;
                    else if (url.endsWith('/streams')) out.streams = true;
                }
            } catch (e) { LOG.debug('tab probe failed:', e && e.message); }
            return out;
        }

        /** Random-play entry URLs. */
        function randomUrls(allPlaylist, chanId) {
            const base = `/playlist?list=${allPlaylist}${chanId}&playnext=1`;
            return {
                random: `${base}&ytpa-random=random&ytpa-random-initial=1`,
                newest: `${base}&ytpa-random=prefer-newest`,
                oldest: `${base}&ytpa-random=prefer-oldest&ytpa-random-initial=1`,
            };
        }

        function buildPopover(urls) {
            const pop = DOMU.el('div', { class: 'ytpu-chipbar-popover', role: 'menu', 'aria-label': 'Random play options', hidden: '' });
            const items = [
                ['Play Random', urls.random],
                ['Prefer newest', urls.newest],
                ['Prefer oldest', urls.oldest],
            ];
            for (const [text, href] of items) {
                pop.appendChild(DOMU.el('a', { role: 'menuitem', href, 'aria-label': text }, { textContent: text }));
            }
            return pop;
        }

        function render() {
            remove();
            if (!STORE.data().channelButtons.enabled) return;
            const route = NAV.classify();
            if (!route.isChannel) return;

            const anchor = findAnchor();
            if (!anchor) return;

            const pageMan = document.querySelector('#page-manager');
            let pageData = null;
            try { pageData = pageMan && typeof pageMan.getCurrentData === 'function' ? pageMan.getCurrentData() : null; }
            catch (e) { pageData = null; }

            const tabs = availableTabs(pageData);
            const chanIdFull = lastChannelId;
            if (!chanIdFull) return;
            const bareId = CHANNEL.bare(chanIdFull);
            const cb = STORE.data().channelButtons;
            const verb = cb.viewInsteadOfPlay ? 'View' : 'Play';
            const currentTab = NAV.channelTab(); // null on channel home

            const bar = DOMU.el('div', { class: 'ytpu-chipbar' });

            // Core pair : All Uploads + Popular Uploads — always available.
            bar.appendChild(makeButton('All', `${verb} All Uploads`, viewUrl('UU', bareId), { posClass: 'ytpu-seg-start' }));
            bar.appendChild(makeButton('Pop', `${verb} Popular Uploads`, viewUrl('PU', bareId), { posClass: 'ytpu-seg-end' }));

            // Tab-conditional pairs
            if (tabs.videos) {
                const everything = cb.everythingOnVideos;
                bar.appendChild(makeButton('VA', everything ? `${verb} All Content` : `${verb} All Videos`,
                    viewUrl(everything ? 'UU' : 'UULF', bareId), { posClass: 'ytpu-seg-start' }));
                if (!everything) {
                    bar.appendChild(makeButton('VP', `${verb} Popular Videos`, viewUrl('UULP', bareId), { posClass: 'ytpu-seg-end' }));
                }
            }
            if (tabs.shorts) {
                bar.appendChild(makeButton('SA', `${verb} All Shorts`, viewUrl('UUSH', bareId), { posClass: 'ytpu-seg-start' }));
                bar.appendChild(makeButton('SP', `${verb} Popular Shorts`, viewUrl('UUPS', bareId), { posClass: 'ytpu-seg-end' }));
            }
            if (tabs.streams) {
                bar.appendChild(makeButton('LA', `${verb} All Streams`, viewUrl('UULV', bareId), { posClass: 'ytpu-seg-start' }));
                bar.appendChild(makeButton('LP', `${verb} Popular Streams`, viewUrl('UUPV', bareId), { posClass: 'ytpu-seg-end' }));
            }

            // Members-only: only when joinable.
            if (hasMembership(pageData)) {
                bar.appendChild(makeButton('Mem', 'Members-Only Videos', listUrl('UUMO', bareId)));
            }

            if (cb.spacerVisible) bar.appendChild(DOMU.el('span', { class: 'ytpu-sep', 'aria-hidden': 'true' }));

            // Random play — needs the current tab's playlist.
            if (cb.randomEnabled && currentTab) {
                let allPlaylist = 'UULF';
                if (currentTab === 'shorts') allPlaylist = 'UUSH';
                else if (currentTab === 'streams') allPlaylist = 'UULV';
                else if (cb.everythingOnVideos) allPlaylist = 'UU';
                const urls = randomUrls(allPlaylist, bareId);
                const more = makeButton('⇯▾', 'Random play options', null, {
                    onClick: (e) => {
                        e.stopPropagation();
                        if (!randomPopover || !randomPopover.isConnected) {
                            randomPopover = buildPopover(urls);
                            document.body.appendChild(randomPopover);
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        randomPopover.style.top = `${rect.bottom + 4}px`;
                        randomPopover.style.left = `${rect.right}px`;
                        randomPopover.removeAttribute('hidden');
                        // v1.1.0: drop any previous capture listener instead of
                        // stacking one per open (v1.0.0 accumulated them).
                        if (popoverCloser) document.removeEventListener('click', popoverCloser, true);
                        const close = (ev) => {
                            if (randomPopover && !randomPopover.contains(ev.target) && ev.target !== e.currentTarget) {
                                randomPopover.setAttribute('hidden', '');
                                document.removeEventListener('click', close, true);
                                if (popoverCloser === close) popoverCloser = null;
                            }
                        };
                        popoverCloser = close;
                        document.addEventListener('click', close, true);
                    },
                });
                bar.appendChild(more);
                bar.appendChild(makeButton('⇯', 'Play Random', urls.random));
            }

            // Behavior toggles
            bar.appendChild(makeToggle('AP', 'AutoPlay (PlayNext)', 'playNext'));
            bar.appendChild(makeToggle('NT', 'Open in New Tabs', 'newTabs'));

            anchor.insertAdjacentElement('afterend', bar);
        }

        function findAnchor() {
            return document.querySelector('#tabsContainer')
                || document.querySelector('.ytChipBarViewModelChipBarScrollContainer')
                || document.querySelector('ytd-feed-filter-chip-bar-renderer iron-selector#chips')
                || null;
        }

        function remove() {
            document.querySelectorAll('.ytpu-chipbar').forEach((n) => n.remove());
            if (randomPopover) { randomPopover.remove(); randomPopover = null; }
        }

        async function onRoute(route) {
            if (!route.isChannel) { remove(); lastChannelId = null; return; }
            if (route.reason === 'navigate-start') return; // DOM is mid-teardown
            if (applying) return;
            applying = true;
            try {
                const ucId = await CHANNEL.resolve();
                if (!ucId || !NAV.classify().isChannel) { remove(); return; }
                lastChannelId = ucId;
                let anchor = findAnchor();
                if (!anchor) {
                    anchor = await DOMU.waitForElement(
                        '#tabsContainer, .ytChipBarViewModelChipBarScrollContainer',
                        { timeout: CFG.WAIT_ELEMENT_TIMEOUT_MS },
                    );
                }
                if (anchor && NAV.classify().isChannel) render();
            } finally {
                applying = false;
            }
        }

        let applying = false;

        function start() {
            NAV.onRoute(SAFETY.safeWrap(onRoute));
            // Re-render when the tabs container churns (YouTube rewrites its DOM).
            observer = DOMU.observeDocument(() => {
                const route = NAV.classify();
                if (route.isChannel && lastChannelId && !document.querySelector('.ytpu-chipbar')) render();
            }, 600);
            BUS.on('reset', () => { remove(); lastChannelId = null; SAFETY.safeWrap(onRoute)(NAV.classify()); });
        }

        return { start, render, remove, listUrl };
    })();

    const MEMBERSTAB = (() => {
        let button = null;
        let chId = null;
        const displayTextMap = {
            'zh-Hant-TW': '會限清單', 'zh-Hant-HK': '會限清單', 'zh-Hant': '會限清單',
            'zh-Hans-CN': '会限清单', 'zh-Hans': '会限清单', 'zh': '会限清单',
            'ja-JP': 'メン限リスト', 'ja': 'メン限リスト',
            'en': 'Members-only-video List',
        };

        function displayText() {
            const lang = document.documentElement.lang || 'en';
            if (displayTextMap[lang]) return displayTextMap[lang];
            const short = lang.split('-')[0];
            return displayTextMap[short] || displayTextMap.en;
        }

        function addLink() {
            if (!STORE.data().membersTab.enabled) return;
            const tabTagName = 'yt-tab-shape';
            const anchorSelector = `${tabTagName}:nth-last-of-type(2)`;
            const anchorElement = document.querySelector(anchorSelector);
            if (anchorElement === null) return;
            const tabs = document.querySelectorAll(tabTagName);
            if (!tabs.length) return; // v1.1.0: tab strip raced empty — retry via observers
            try { anchorElement.parentNode.removeChild(button); } catch (e) { /* first run: nothing to remove */ }

            const newNode = tabs[0].cloneNode(true);
            newNode.removeAttribute('aria-selected');
            newNode.setAttribute('tab-identifier', 'TAB_ID_SPONSORSHIP_PLAYLIST');
            const labelNode = newNode.childNodes[0];
            if (labelNode) labelNode.textContent = displayText();

            anchorElement.parentNode.insertBefore(button || newNode, anchorElement);

            if (!button) {
                button = document.querySelector(`${tabTagName}:nth-last-of-type(3)`);
                if (button) {
                    button.addEventListener('click', async () => {
                        if (!chId) {
                            const meta = document.querySelector('[itemprop="identifier"]');
                            chId = meta ? meta.getAttribute('content') : null;
                        }
                        if (!chId) chId = await CHANNEL.resolve();
                        if (!chId) { LOG.warn('Members-only: channel id unavailable'); return; }
                        const targetURL = `${location.protocol}//${location.host}/playlist?list=${chId.replace(/^UC/, 'UUMO')}`;
                        NAV.safeOpen(targetURL, 'MEMBERSTAB.members'); // v1.3.0: integrity gate
                    });
                }
            }
        }

        function arm() {
            if (!STORE.data().membersTab.enabled) return;
            DOMU.waitForElement('yt-tab-shape:nth-last-of-type(2)', { timeout: CFG.WAIT_ELEMENT_TIMEOUT_MS })
                .then((found) => { if (found) addLink(); });
        }

        function start() {
            // Dynamic re-add via a filtered observer (registered once).
            DOMU.onParentChildSelectors({
                parentSelector: '.tabGroupShapeTabs',
                childSelector: 'yt-tab-shape',
                inserted: () => addLink(),
            });
            // v1.1.0: re-arm on SPA entry into channel pages so the tab
            // appears without a hard reload; addLink() live-checks the flag.
            NAV.onRoute((route) => {
                if (route.isChannel && route.reason !== 'navigate-start') arm();
            });
            if (NAV.classify().isChannel) arm();
        }

        return { start };
    })();

    const REVERSE = (() => {
        const selectors = {
            buttonLocation: 'div[id=playlist-action-menu] > .ytd-playlist-panel-renderer > div[id=top-level-buttons-computed], #playlist-action-menu .top-level-buttons',
            player: '.html5-main-video',
            miniplayerDiv: 'div.miniplayer',
            playlistButtons: '.ytd-watch-flexy #playlist #playlist-action-menu',
            playlistButtonsMiniplayer: 'ytd-playlist-panel-renderer.ytd-miniplayer #playlist-action-menu',
            playlistCurrentVideo: 'ytd-playlist-panel-video-renderer[selected]',
            playlistVideos: '#publisher-container span.index-message',
            playlistVideosMiniplayer: 'yt-formatted-string[id=owner-text] :nth-child(3)',
            shuffleButtonActive: "path[d='M18.51,13.29l4.21,4.21l-4.21,4.21l-1.41-1.41l1.8-1.8c-2.95-0.03-5.73-1.32-7.66-3.55l1.51-1.31 c1.54,1.79,3.77,2.82,6.13,2.85l-1.79-1.79L18.51,13.29z M18.88,7.51l-1.78,1.78l1.41,1.41l4.21-4.21l-4.21-4.21l-1.41,1.41l1.8,1.8 c-3.72,0.04-7.12,2.07-8.9,5.34l-0.73,1.34C7.81,14.85,5.03,17,2,17v2c3.76,0,7.21-2.55,9.01-5.85l0.73-1.34 C13.17,9.19,15.9,7.55,18.88,7.51z M8.21,10.31l1.5-1.32C7.77,6.77,4.95,5,2,5v2C4.38,7,6.64,8.53,8.21,10.31z']",
            shuffleButtonInactive: "path[d='M18.15,13.65l3.85,3.85l-3.85,3.85l-0.71-0.71L20.09,18H19c-2.84,0-5.53-1.23-7.39-3.38l0.76-0.65 C14.03,15.89,16.45,17,19,17h1.09l-2.65-2.65L18.15,13.65z M19,7h1.09l-2.65,2.65l0.71,0.71l3.85-3.85l-3.85-3.85l-0.71,0.71 L20.09,6H19c-3.58,0-6.86,1.95-8.57,5.09l-0.73,1.34C8.16,15.25,5.21,17,2,17v1c3.58,0,6.86-1.95,8.57-5.09l0.73-1.34 C12.84,8.75,15.79,7,19,7z M8.59,9.98l0.75-0.66C7.49,7.21,4.81,6,2,6v1C4.52,7,6.92,8.09,8.59,9.98z']",
            shuffleButtonLegacy: "path[d='M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z']",
            timestamp: 'span.ytd-thumbnail-overlay-time-status-renderer',
            videoPlayer: '.html5-video-player',
        };

        const ytdApp = () => document.querySelector('ytd-app, ytm-app');
        let player = null;
        let redirectFlag = false;
        let shuffle = null;
        let miniplayerFlag = false;
        let playerListenersAdded = false;
        let statsObserver = null;

        function isMiniplayerActive() {
            const app = ytdApp();
            if (!app) return false;
            for (const attr of ['miniplayer-is-active', 'miniplayer-active_', 'miniplayer-active']) {
                if (app.hasAttribute(attr)) return true;
            }
            return false;
        }

        function buildButton() {
            const svg = DOMU.svg('svg', { viewBox: '0 0 16 24' }, [
                DOMU.svg('g', { class: 'arrows' }, [
                    DOMU.svg('polygon', { class: 'arrow-up', points: '6,8.5 6,6.5 3,6.5 8,1.5 13,6.5 10,6.5 10,8.5' }),
                    DOMU.svg('polygon', { class: 'arrow-down', points: '6,15.5 6,17.5 3,17.5 8,22.5 13,17.5 10,17.5 10,15.5' }),
                ]),
            ]);
            const btn = DOMU.el('button', {
                class: 'ytpu-rev-btn', id: 'ytpu-rev-btn', title: 'Autoplay order', 'aria-pressed': 'false',
            }, {}, {}, {
                click: () => {
                    const ro = STORE.data().reverseOrder;
                    ro.active = !ro.active;
                    STORE.patch({ reverseOrder: { active: ro.active } });
                    updateButtonState();
                    svg.classList.remove('pulse');
                    void svg.offsetWidth; // restart the CSS animation
                    svg.classList.add('pulse');
                },
            }, [svg]);
            return btn;
        }

        function updateButtonState() {
            const active = STORE.data().reverseOrder.active;
            document.querySelectorAll('#ytpu-rev-btn').forEach((btn) => {
                btn.classList.toggle('reversed', active);
                btn.setAttribute('aria-pressed', String(active));
                btn.title = active ? 'Autoplay order: previous video first' : 'Autoplay order: next video (default)';
            });
        }

        function addButton() {
            document.querySelectorAll(selectors.buttonLocation).forEach((host) => {
                if (host.querySelector('#ytpu-rev-btn')) return;
                host.appendChild(buildButton());
                updateButtonState();
            });
        }

        function ensurePlayerListeners() {
            if (playerListenersAdded) return;
            const video = document.querySelector(selectors.player);
            if (!video) return;
            player = video;
            video.addEventListener('timeupdate', checkTime);
            video.addEventListener('play', addButton);
            playerListenersAdded = true;
        }

        function checkTime() {
            const route = NAV.classify();
            if (!route.isWatchWithList) return;
            const miniplayerActive = isMiniplayerActive();
            const context = miniplayerActive ? selectors.miniplayerDiv : '#content';
            const noButton = !document.querySelector(`${context} ${selectors.buttonLocation} #ytpu-rev-btn`);
            const playlistHeaderQuery = miniplayerActive
                ? document.querySelector(selectors.playlistVideosMiniplayer)?.parentElement
                : document.querySelector(selectors.playlistVideos)?.parentElement;
            const playlistVisible = playlistHeaderQuery && playlistHeaderQuery.offsetParent !== null;
            if (!playlistVisible) return;
            if (noButton) addButton();

            if (!player) return;
            let timeLeft;
            try { timeLeft = player.duration - player.currentTime; }
            catch (e) { return; }
            const videoPlayer = document.querySelector(selectors.videoPlayer);
            if (!videoPlayer) return;

            const redirectTime = miniplayerActive ? CFG.REVERSE_TIME_LEFT_MINI : CFG.REVERSE_TIME_LEFT;
            const shuffleContext = miniplayerActive ? selectors.playlistButtonsMiniplayer : selectors.playlistButtons;

            if (!shuffle || miniplayerActive !== miniplayerFlag) {
                shuffle = document.querySelector(`${shuffleContext} ${selectors.shuffleButtonActive}`)?.closest('button[aria-pressed]')
                    || document.querySelector(`${shuffleContext} ${selectors.shuffleButtonInactive}`)?.closest('button[aria-pressed]')
                    || document.querySelector(selectors.shuffleButtonLegacy)?.closest('button[aria-pressed]')
                    || null;
                miniplayerFlag = miniplayerActive;
            }

            let shuffleEnabled = false;
            try { shuffleEnabled = shuffle && shuffle.attributes['aria-pressed'].nodeValue.toLowerCase() === 'true'; }
            catch (e) { shuffleEnabled = false; } // e.g. when using Queues (upstream parity)

            if (timeLeft < redirectTime && !redirectFlag && STORE.data().reverseOrder.active
                && !shuffleEnabled && !player.hasAttribute('loop')
                && !videoPlayer.classList.contains('ad-showing')) {
                // Attempt to preempt YouTube's own next-video redirect.
                player.pause();
                player.currentTime -= 2;
                if (getVidNum()[0] !== '1') {
                    redirectFlag = true;
                    redirect();
                    setTimeout(() => { redirectFlag = false; }, 1000);
                }
            }
        }

        function getVidNum() {
            // "32 / 152" -> ["32", "152"]
            const mini = isMiniplayerActive(); // v1.1.0: single source of truth
            let node = mini ? document.querySelector(selectors.playlistVideosMiniplayer) : document.querySelector(selectors.playlistVideos);
            if (!node || !node.textContent) return ['1', '1'];
            return node.textContent.trim().split(' / ');
        }

        function redirect() {
            const prev = getPreviousAnchor();
            if (prev) prev.click();
        }

        function getPreviousAnchor() {
            const mini = isMiniplayerActive(); // v1.1.0: single source of truth
            const scope = mini ? document.querySelector(selectors.miniplayerDiv) : document.querySelector('#content');
            if (!scope) return null;
            let elem = scope.querySelector(selectors.playlistCurrentVideo)?.previousElementSibling || null;
            if (!elem) return null;
            let ts = elem.querySelector(selectors.timestamp)?.textContent || null;
            // Skip unplayable/private videos and not-yet-premiered entries
            // (no timestamp).
            while ((elem.querySelector('#unplayableText') && !elem.querySelector('#unplayableText').hidden)
                || (ts !== null && !ts.includes(':'))) {
                elem = elem.previousElementSibling;
                if (!elem) return null; // first video in playlist
                ts = elem.querySelector(selectors.timestamp)?.textContent || null;
            }
            return elem.querySelector('a') || elem.firstElementChild;
        }

        function start() {
            // v1.1.0: no boot-time early return — every path live-checks the
            // enabled flag so toggling Settings takes effect without reload.
            NAV.onRoute((route) => {
                if (route.isWatchWithList && STORE.data().reverseOrder.enabled) {
                    addButton();
                    ensurePlayerListeners();
                    ensureStatsObserver();
                }
            });
            BUS.on('reset', () => updateButtonState());
            // Failsafe re-add loop while watching a playlist (self-guarding:
            // classify() is cheap and the flag check short-circuits first).
            setInterval(() => {
                if (STORE.data().reverseOrder.enabled && NAV.classify().isWatchWithList) {
                    addButton();
                    ensurePlayerListeners();
                }
            }, 2500);
        }

        function ensureStatsObserver() {
            if (statsObserver) return;
            // The button must be re-added whenever the playlist churns
            // (video loads / removals).
            statsObserver = new MutationObserver(SAFETY.safeWrap(addButton));
            const targets = [
                document.querySelector(selectors.playlistVideos),
                document.querySelector(selectors.playlistVideosMiniplayer),
            ].filter(Boolean);
            for (const t of targets) statsObserver.observe(t, { subtree: true, childList: true, characterData: true });
            if (!targets.length) {
                // Elements not present yet: retry once they appear.
                DOMU.waitForElement(selectors.playlistVideos, { timeout: 20000 }).then((el) => {
                    if (el && statsObserver) statsObserver.observe(el, { subtree: true, childList: true, characterData: true });
                });
            }
        }

        return { start };
    })();

    const AUTOPLAY = (() => {
        let navigateStatus = -1;
        let fCounter = 0;
        let transition = false;
        let reattachObserver = null;

        function getManager() {
            return document.querySelector('yt-playlist-manager');
        }

        function setAssociatedAutoplay() {
            const manager = getManager();
            if (manager && typeof manager.canAutoAdvance_ === 'boolean') {
                if (navigateStatus !== 1) manager.canAutoAdvance_ = !!STORE.data().autoplay.active;
            } else {
                LOG.debug('yt-playlist-manager.canAutoAdvance_ unavailable on this surface');
            }
            document.querySelectorAll('.ytpu-pl-switch').forEach((b) => {
                b.classList.toggle('on', STORE.data().autoplay.active);
                b.title = `Autoplay is ${STORE.data().autoplay.active ? 'on' : 'off'}`;
            });
        }

        function toggleAutoplay(e) {
            e.stopPropagation();
            if (transition) { e.preventDefault(); return; }
            const ap = STORE.data().autoplay;
            ap.active = !ap.active;
            STORE.patch({ autoplay: { active: ap.active } });
            setAssociatedAutoplay();
        }

        function buildSwitch() {
            const sw = DOMU.el('button', {
                class: `ytpu-pl-switch${STORE.data().autoplay.active ? ' on' : ''}`,
                title: `Autoplay is ${STORE.data().autoplay.active ? 'on' : 'off'}`,
                'aria-pressed': String(STORE.data().autoplay.active),
                role: 'switch',
            }, {}, {}, { click: toggleAutoplay }, [
                DOMU.el('span', { class: 'knob' }),
            ]);
            sw.addEventListener('transitionrun', () => { transition = true; }, { passive: true });
            sw.addEventListener('transitionend', () => { transition = false; }, { passive: true });
            sw.addEventListener('transitioncancel', () => { transition = false; }, { passive: true });
            const wrap = DOMU.el('span', { class: 'ytpu-tt' }, {}, {}, {}, [
                sw,
                DOMU.el('span', { class: 'tip' }, { textContent: 'Playlist autoplay toggle' }),
            ]);
            return wrap;
        }

        function isHidden(el) {
            return !el || el.hidden || el.offsetParent === null;
        }

        function setupMenu(menu) {
            if (!(menu instanceof Element)) return;
            const hosts = menu.querySelectorAll('.top-level-buttons:not([hidden])');
            if (hosts.length >= 1) {
                for (const host of hosts) {
                    if (!host.querySelector('.ytpu-pl-switch')) host.appendChild(buildSwitch());
                }
                menu.setAttribute('ytpu-autoplay-container', '1');
            } else {
                if (!menu.querySelector('.ytpu-pl-switch')) menu.appendChild(buildSwitch());
                menu.setAttribute('ytpu-autoplay-container', '2');
            }
            setAssociatedAutoplay();
            watchForRemoval(menu);
        }

        /** Upstream moButtonAttachment: YouTube removes our switch when the
         *  playlist header re-renders — re-insert it at its old position. */
        function watchForRemoval(menu) {
            if (reattachObserver) reattachObserver.disconnect();
            reattachObserver = new MutationObserver((entries) => {
                for (const entry of entries) {
                    const { target, previousSibling, removedNodes } = entry;
                    if (removedNodes.length >= 1 && target.isConnected === true && previousSibling && previousSibling.isConnected === true) {
                        for (const elem of removedNodes) {
                            if (elem.classList && elem.classList.contains('ytpu-tt') && elem.isConnected === false) {
                                target.insertBefore(elem, previousSibling.nextSibling);
                            }
                        }
                    }
                }
            });
            reattachObserver.observe(menu, { childList: true, subtree: false });
        }

        function scanAndSetup() {
            if (!STORE.data().autoplay.enabled) return;
            const route = NAV.classify();
            if (!route.isWatchWithList && !route.isPlaylistPage) return;
            const menus = document.querySelectorAll('#playlist-action-menu');
            for (const menu of menus) {
                if (isHidden(menu)) {
                    menu.removeAttribute('ytpu-autoplay-container');
                    continue;
                }
                setupMenu(menu);
            }
        }

        function onNavigateStart() {
            // canAutoAdvance_ becomes false during onYtNavigateStart_.
            navigateStatus = 1;
            fCounter = fCounter > 1e9 ? 9 : fCounter + 1;
        }

        function onNavigateFinish() {
            // canAutoAdvance_ becomes true in onYtNavigateFinish_ — reassert
            // the user's preference right after (100ms, fCounter-guarded).
            navigateStatus = 2;
            fCounter = fCounter > 1e9 ? 9 : fCounter + 1;
            const t = fCounter;
            setTimeout(() => {
                if (t !== fCounter) return;
                if (navigateStatus === 2) setAssociatedAutoplay();
            }, 100);
        }

        function start() {
            // v1.1.0: no boot-time early return — scanAndSetup live-checks the
            // enabled flag, so Settings toggles take effect without reload.
            document.addEventListener('yt-navigate-start', onNavigateStart, false);
            document.addEventListener('yt-navigate-cache', () => { navigateStatus = 1; }, false);
            document.addEventListener('yt-navigate-finish', onNavigateFinish, false);
            window.addEventListener('yt-navigate-finish', onNavigateFinish, false);
            document.addEventListener('yt-action', SAFETY.safeWrap(scanAndSetup), true);
            NAV.onRoute(() => setTimeout(scanAndSetup, 300));
            DOMU.observeDocument(scanAndSetup, 500);
            scanAndSetup();
        }

        return { start, setAssociatedAutoplay };
    })();

    const SORTER = (() => {
        let stopSort = false;
        let sortLoopTime = () => STORE.data().sort.scrollLoopTime;

        function fireMouseEvent(type, elem, centerX, centerY) {
            const event = new MouseEvent(type, {
                view: window, bubbles: true, cancelable: true, clientX: centerX, clientY: centerY,
            });
            elem.dispatchEvent(event);
        }

        /** Full drag-and-drop event sequence. */
        function simulateDrag(elemDrag, elemDrop) {
            let pos = elemDrag.getBoundingClientRect();
            const c1X = Math.floor((pos.left + pos.right) / 2);
            const c1Y = Math.floor((pos.top + pos.bottom) / 2);
            pos = elemDrop.getBoundingClientRect();
            const c2X = Math.floor((pos.left + pos.right) / 2);
            const c2Y = Math.floor((pos.top + pos.bottom) / 2);

            fireMouseEvent('mousemove', elemDrag, c1X, c1Y);
            fireMouseEvent('mouseenter', elemDrag, c1X, c1Y);
            fireMouseEvent('mouseover', elemDrag, c1X, c1Y);
            fireMouseEvent('mousedown', elemDrag, c1X, c1Y);
            fireMouseEvent('dragstart', elemDrag, c1X, c1Y);
            fireMouseEvent('drag', elemDrag, c1X, c1Y);
            fireMouseEvent('mousemove', elemDrag, c1X, c1Y);
            fireMouseEvent('drag', elemDrag, c2X, c2Y);
            fireMouseEvent('mousemove', elemDrop, c2X, c2Y);
            fireMouseEvent('mouseenter', elemDrop, c2X, c2Y);
            fireMouseEvent('dragenter', elemDrop, c2X, c2Y);
            fireMouseEvent('mouseover', elemDrop, c2X, c2Y);
            fireMouseEvent('dragover', elemDrop, c2X, c2Y);
            fireMouseEvent('drop', elemDrop, c2X, c2Y);
            fireMouseEvent('dragend', elemDrag, c1X, c1Y);
            fireMouseEvent('mouseup', elemDrag, c1X, c1Y);
        }

        async function autoScroll(scrollTop = null) {
            const element = document.scrollingElement;
            let currentScroll = element.scrollTop;
            const scrollDestination = scrollTop !== null ? scrollTop : element.scrollHeight;
            let scrollCount = 0;
            do {
                currentScroll = element.scrollTop;
                element.scrollTop = scrollDestination;
                await new Promise((r) => setTimeout(r, sortLoopTime()));
                scrollCount++;
            } while (currentScroll !== scrollDestination && scrollCount < 2 && stopSort === false);
        }

        function sortVideos(allAnchors, allDragPoints, expectedCount) {
            const videos = [];
            let sorted = 0;
            let dragged = false;
            const asc = STORE.data().sort.mode === 'asc';

            // If the page is not fully loaded the counts mismatch — wait instead
            // of sorting a partial list.
            if (allDragPoints.length !== expectedCount || allAnchors.length !== expectedCount) {
                DECK.logMsg('Playlist is not fully loaded, waiting...');
                return 0;
            }

            for (let j = 0; j < allDragPoints.length; j++) {
                const thumb = allAnchors[j];
                // v1.1.0: a mid-list row can lack #text (premiere/upcoming or
                // render race) — v1.0.0 crashed on null.innerText there.
                const rawStamp = thumb.querySelector('#text')?.innerText?.trim() || '';
                const timeDigits = rawStamp.split(':').reverse();
                let time;
                if (timeDigits.length === 1) {
                    // No timestamp (upcoming / not-yet-premiered): sort to the
                    // extreme end in both modes.
                    time = asc ? 999999999999999999 : -1;
                } else {
                    time = parseInt(timeDigits[0], 10) || 0;
                    if (timeDigits[1]) time += (parseInt(timeDigits[1], 10) || 0) * 60;
                    if (timeDigits[2]) time += (parseInt(timeDigits[2], 10) || 0) * 3600;
                }
                videos.push({ anchor: allDragPoints[j], time, originalIndex: j });
            }

            videos.sort((a, b) => (asc ? a.time - b.time : b.time - a.time));

            for (let j = 0; j < videos.length; j++) {
                const originalIndex = videos[j].originalIndex;
                if (originalIndex !== j) {
                    const elemDrag = videos[j].anchor;
                    const elemDrop = videos.find((v) => v.originalIndex === j).anchor;
                    DECK.logMsg(`Drag ${originalIndex} to ${j}`);
                    simulateDrag(elemDrag, elemDrop);
                    dragged = true;
                }
                sorted = j;
                if (stopSort || dragged) break; // one drag per pass; YouTube re-renders
            }
            return sorted;
        }

        async function activateSort() {
            if (!STORE.data().sort.enabled) return;
            if (!DOMADAPTER.isPlaylistPage()) { DECK.logMsg('Not on a playlist page', 'warn'); return; }

            const reportedEl = document.querySelector('.metadata-stats span.yt-formatted-string:first-of-type');
            if (!reportedEl) { DECK.logMsg('Playlist metadata not found — is this an editable playlist?', 'warn'); return; }
            // v1.1.0: digit extraction — localized text ("1,234 videos" /
            // "1.234 Videos") made plain Number() NaN in v1.0.0, forcing
            // phantom scroll retries against a count that never matched.
            const reportedVideoCount = parseInt((reportedEl.innerText.match(/\d/g) || []).join(''), 10) || 0;

            let allDragPoints = document.querySelectorAll('ytd-item-section-renderer:first-of-type yt-icon#reorder');
            let allAnchors;
            let sortedCount = 0;
            let initialVideoCount = allDragPoints.length;
            let scrollRetryCount = 0;
            stopSort = false;

            // Phase 1: load the full list (bounded retry, upstream parity).
            while (reportedVideoCount !== initialVideoCount
                && location.href.includes('playlist?list=')
                && stopSort === false
                && STORE.data().sort.autoScroll) {
                DECK.logMsg(`Loading more videos — ${allDragPoints.length} loaded`);
                if (scrollRetryCount > 5) break;
                if (scrollRetryCount > 0) {
                    DECK.logMsg(`Reported count does not match actual count. Remove unavailable videos? Attempt ${scrollRetryCount}/5`, 'warn');
                }
                if (allDragPoints.length > 300) {
                    DECK.logMsg('Many videos loaded — sorting may take a long time', 'warn');
                }
                await autoScroll();
                allDragPoints = document.querySelectorAll('ytd-item-section-renderer:first-of-type yt-icon#reorder');
                initialVideoCount = allDragPoints.length;
                if (((reportedVideoCount - initialVideoCount) / 10) < 1) scrollRetryCount++;
            }

            DECK.logMsg(`${initialVideoCount} videos loaded.`);
            if (scrollRetryCount > 5) DECK.logMsg('Scroll attempts exhausted — sorting despite count mismatch.', 'warn');
            const loadedLocation = document.scrollingElement.scrollTop;
            scrollRetryCount = 0;

            // Phase 2: iterative single-drag passes until fully ordered.
            while (sortedCount < initialVideoCount && stopSort === false) {
                allDragPoints = document.querySelectorAll('ytd-item-section-renderer:first-of-type yt-icon#reorder');
                allAnchors = document.querySelectorAll('ytd-item-section-renderer:first-of-type div#content a#thumbnail.inline-block.ytd-thumbnail');
                scrollRetryCount = 0;

                while (!allAnchors[initialVideoCount - 1]?.querySelector('#text') && stopSort === false) {
                    if (document.scrollingElement.scrollTop < loadedLocation && scrollRetryCount < 3) {
                        DECK.logMsg(`Video ${initialVideoCount} not loaded yet, scrolling.`);
                        await autoScroll(loadedLocation);
                        scrollRetryCount++;
                    } else {
                        DECK.logMsg(`Video ${initialVideoCount} still not loaded — brute-force scroll.`);
                        await autoScroll();
                    }
                }

                sortedCount = Number(sortVideos(allAnchors, allDragPoints, initialVideoCount) + 1);
                await new Promise((r) => setTimeout(r, sortLoopTime() * 4));
            }

            if (stopSort) {
                DECK.logMsg('Sort cancelled.', 'warn');
                stopSort = false;
            } else {
                DECK.logMsg(`Sort complete. Videos sorted: ${sortedCount}`, 'ok');
            }
            DECK.setProgress(0);
        }

        function stop() { stopSort = true; }

        function start() {
            // UI lives in the deck's Sort section; only the engine here.
            // Hot-navigations into /playlist re-arm automatically via route events.
            if (typeof navigation !== 'undefined' && navigation.addEventListener) {
                navigation.addEventListener('navigate', (navigateEvent) => {
                    try {
                        const url = new URL(navigateEvent.destination.url);
                        if (url.pathname.includes('playlist')) stopSort = true; // cancel stale runs
                    } catch (e) { LOG.debug('navigate parse failed:', e && e.message); }
                });
            }
        }

        return { activateSort, stop, start };
    })();

    const EXPORTER = (() => {
        // ---- playlist item access: InnerTube primary, DOM fallback ----

        async function loadItems() {
            const playlistId = DOMADAPTER.currentPlaylistId();
            if (!playlistId) throw new Error('Not on a playlist page');
            if (INNERTUBE.available()) {
                const { header, items } = await READER.loadPlaylist(playlistId);
                return { header, items, source: 'innertube' };
            }
            // DOM fallback: scroll until no continuation remains.
            const popup = DECK.modal('Ψ EXPORT — SCROLLING', (body) => {
                body.appendChild(DOMU.el('div', { class: 'log-info' }, { textContent: 'Scrolling to load all videos in the playlist. Please wait...' }));
            });
            // v1.1.0: attempt ceiling — v1.0.0 could spin forever if YouTube
            // kept a continuation marker mounted (GUP B.1 bounded polling).
            const MAX_SCROLLS = 400;
            let scrolls = 0;
            while (document.querySelector('ytd-continuation-item-renderer.ytd-playlist-video-list-renderer')
                && scrolls < MAX_SCROLLS) {
                window.scrollTo(0, document.documentElement.scrollHeight || document.body.scrollHeight);
                await new Promise((r) => setTimeout(r, 100));
                scrolls++;
            }
            if (scrolls >= MAX_SCROLLS) LOG.warn(`DOM fallback scroll ceiling hit (${MAX_SCROLLS}) — exporting the loaded portion`);
            popup.close();
            const items = [];
            for (const row of document.querySelectorAll('ytd-playlist-video-list-renderer > #contents > ytd-playlist-video-renderer #content')) {
                const titleEl = row.querySelector('#video-title');
                if (!titleEl) continue;
                items.push({
                    videoId: (titleEl.getAttribute('href') || '').match(/[?&]v=([^&]+)/)?.[1] || null,
                    title: titleEl.getAttribute('title') || '',
                    channelName: row.querySelector('#channel-name yt-formatted-string.ytd-channel-name > a')?.textContent || '',
                    lengthText: row.querySelector('span.ytd-thumbnail-overlay-time-status-renderer')?.textContent.trim() || '',
                    setVideoId: null,
                    deleted: false,
                    isPlayable: true,
                });
            }
            const titleEl = document.querySelector('ytd-playlist-header-renderer h1 yt-formatted-string, .ytd-playlist-header-renderer h1');
            return { header: { title: titleEl ? titleEl.textContent.trim() : playlistId, itemCount: items.length }, items, source: 'dom' };
        }

        // ---- plaintext build ----

        function buildPlaintext(items) {
            const ex = STORE.data().exporter;
            const sep = ex.videoListSeperator;
            const lines = [];
            items.forEach((it, i) => {
                let line = '';
                if (ex.getVideoIndex) line += `${i + 1}`;
                if (ex.getVideoTitle) line += (line ? sep : '') + (it.title || '');
                if (ex.getVideoChannel) line += (line ? sep : '') + (it.channelName || '');
                if (ex.getVideoURL) line += (line ? sep : '') + (it.videoId ? `https://www.youtube.com/watch?v=${it.videoId}` : '');
                if (ex.getVideoDuration) line += (line ? sep : '') + (it.lengthText || '');
                lines.push(line);
            });
            return lines.join('\n');
        }

        function openPlaintextDialog() {
            const ex = STORE.data().exporter;
            let items = null;
            let text = '';
            const buildOptions = (body) => {
                const mk = (label, key) => DOMU.el('label', { class: 'tog' }, {}, {}, {}, [
                    DOMU.el('input', { type: 'checkbox' }, { checked: !!ex[key] }, {}, {
                        change: (e) => {
                            STORE.patch({ exporter: { [key]: e.target.checked } });
                            if (items) {
                                text = buildPlaintext(items);
                                const out = dlg.element.querySelector('#ytpuOut');
                                if (out) out.value = text;
                            }
                        },
                    }),
                    DOMU.el('span', { class: 'text' }, { textContent: label }),
                ]);
                body.appendChild(mk('Index', 'getVideoIndex'));
                body.appendChild(mk('Titles', 'getVideoTitle'));
                body.appendChild(mk('Channel names', 'getVideoChannel'));
                body.appendChild(mk('URLs', 'getVideoURL'));
                body.appendChild(mk('Durations', 'getVideoDuration'));
                const field = DOMU.el('div', { class: 'field' }, {}, {}, {}, [
                    DOMU.el('label', { for: 'ytpuSep' }, { textContent: 'Separator' }),
                    DOMU.el('input', { type: 'text', id: 'ytpuSep', style: 'width:90px;' }, { value: ex.videoListSeperator }, {}, {
                        change: (e) => {
                            STORE.patch({ exporter: { videoListSeperator: e.target.value } });
                            if (items) {
                                text = buildPlaintext(items);
                                const out = dlg.element.querySelector('#ytpuOut');
                                if (out) out.value = text;
                            }
                        },
                    }),
                ]);
                body.appendChild(field);
                const out = DOMU.el('textarea', { id: 'ytpuOut', readonly: 'readonly', placeholder: 'Press "Get list" to build the playlist text...' });
                body.appendChild(out);
                if (text) out.value = text;
            };
            const dlg = DECK.modal('Ψ EXPORT PLAYLIST — PLAINTEXT', buildOptions, [
                DOMU.el('button', { class: 'btn primary', 'data-keep-open': '' }, { textContent: 'Get list' }, {}, {
                    click: async () => {
                        const btn = dlg.element.querySelector('.modal-foot .btn.primary');
                        if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
                        try {
                            const res = await loadItems();
                            items = res.items;
                            text = buildPlaintext(items);
                            const out = dlg.element.querySelector('#ytpuOut');
                            if (out) out.value = text;
                            DECK.logMsg(`Plaintext built: ${items.length} items (${res.source})`, 'ok');
                        } catch (e) {
                            DECK.logMsg(`Export failed: ${e && e.message}`, 'err');
                        } finally {
                            if (btn) { btn.disabled = false; btn.textContent = 'Get list'; }
                        }
                    },
                }),
                DOMU.el('button', { class: 'btn', 'data-keep-open': '' }, { textContent: 'Copy' }, {}, {
                    click: async () => {
                        const out = dlg.element.querySelector('#ytpuOut');
                        if (!out || !out.value) { DECK.logMsg('Nothing to copy yet', 'warn'); return; }
                        const ok = await DOMU.copyText(out.value);
                        DECK.logMsg(ok ? 'Copied to clipboard' : 'Copy failed', ok ? 'ok' : 'err');
                    },
                }),
                DOMU.el('button', { class: 'btn', 'data-keep-open': '' }, { textContent: 'Download .txt' }, {}, {
                    click: () => {
                        if (!text) { DECK.logMsg('Nothing to download yet', 'warn'); return; }
                        const id = DOMADAPTER.currentPlaylistId() || 'playlist';
                        PORTABILITY.downloadText(text, `ytpu-playlist-${id}.txt`);
                    },
                }),
            ]);
        }

        // ---- snapshot / check ----

        async function doSnapshot() {
            const id = DOMADAPTER.currentPlaylistId();
            if (!id) { DECK.logMsg('Not on a playlist page', 'warn'); return; }
            DECK.logMsg('Snapshotting playlist…');
            try {
                const bundle = await PORTABILITY.exportPlaylist(id);
                const rec = SNAPSHOTS.put(id, bundle);
                const size = JSON.stringify(bundle).length;
                DECK.logMsg(`Snapshot saved: ${rec.itemCount} items, ${DOMU.fmtBytes(size)} (storage holds ${Object.keys(SNAPSHOTS.all()).length})`, 'ok');
            } catch (e) {
                DECK.logMsg(`Snapshot failed: ${e && e.message}`, 'err');
            }
        }

        async function doCheck() {
            const id = DOMADAPTER.currentPlaylistId();
            if (!id) { DECK.logMsg('Not on a playlist page', 'warn'); return; }
            if (!SNAPSHOTS.get(id)) {
                DECK.logMsg('No snapshot stored for this playlist yet — press Snapshot first.', 'warn');
                return;
            }
            try {
                const { items } = await loadItems();
                const diff = SNAPSHOTS.diff(id, items);
                if (!diff) { DECK.logMsg('Snapshot vanished', 'err'); return; }
                const rows = [];
                const li = (tag, text, videoId, cls = '') => DOMU.el('li', {}, {}, {}, {}, [
                    DOMU.el('span', { class: `tag${cls}` }, { textContent: tag }),
                    videoId
                        ? DOMU.el('a', { href: `https://www.youtube.com/watch?v=${videoId}`, target: '_blank', rel: 'noreferrer' }, { textContent: text || videoId })
                        : DOMU.el('span', {}, { textContent: text || '(unknown title)' }),
                ]);
                for (const it of diff.missing) rows.push(li('GONE', it.title, it.videoId, ' gone'));
                for (const it of diff.gonePrivate) rows.push(li('PRIVATE', it.title, it.videoId, ' gone'));
                for (const it of diff.added) rows.push(li('NEW', it.title, it.videoId));
                DECK.modal('Ψ SNAPSHOT DIFF', (body) => {
                    body.appendChild(DOMU.el('div', { class: 'kv' }, {}, {}, {}, [
                        document.createTextNode(`Snapshot: ${diff.savedAt} · ${diff.snapCount} items`),
                    ]));
                    body.appendChild(DOMU.el('div', { class: 'kv' }, {}, {}, {}, [
                        document.createTextNode(`Now: ${items.length} items`),
                    ]));
                    if (!rows.length) {
                        body.appendChild(DOMU.el('div', { class: 'log-ok', style: 'padding:8px 0;' }, { textContent: 'No differences — playlist matches the snapshot.' }));
                        return;
                    }
                    body.appendChild(DOMU.el('ul', { class: 'modal-list' }, {}, {}, {}, rows));
                }, [
                    DOMU.el('button', { class: 'btn primary' }, { textContent: 'Close' }),
                ]);
                DECK.logMsg(`Diff: ${diff.missing.length} gone, ${diff.gonePrivate.length} turned private, ${diff.added.length} new`, 'ok');
            } catch (e) {
                DECK.logMsg(`Check failed: ${e && e.message}`, 'err');
            }
        }

        // ---- three-dot menu entry ----

        function injectMenuEntry() {
            if (!STORE.data().exporter.enabled) return;
            if (!NAV.classify().isPlaylistPage) return;
            if (document.getElementById('ytpuExportEntry')) return;
            let place = document.querySelector("tp-yt-iron-dropdown.ytd-popup-container .yt-list-view-model-wiz[role='menu']");
            if (!place) place = document.querySelector("tp-yt-iron-dropdown.ytd-popup-container tp-yt-paper-listbox.ytd-menu-popup-renderer[role='listbox']");
            if (!place) return;
            const icon = GLYPH.inline24();
            const wrap = document.createElement('div');
            wrap.id = 'ytpuExportEntry';
            wrap.setAttribute('role', 'menuitem');
            wrap.appendChild(icon);
            const span = document.createElement('span');
            span.textContent = 'Export Playlist';
            wrap.appendChild(span);
            wrap.addEventListener('click', () => SAFETY.safeWrap(() => openPlaintextDialog())());
            place.appendChild(wrap);
        }

        function start() {
            // v1.1.0: no boot-time early return — injectMenuEntry live-checks
            // the exporter flag, so the three-dot entry follows Settings live.
            // Menu entry is injected whenever YouTube opens a dropdown on a playlist page.
            DOMU.observeDocument(injectMenuEntry, 300);
        }

        return { openPlaintextDialog, doSnapshot, doCheck, loadItems, start };
    })();

    const MANAGER = (() => {
        /** Resolve one setVideoId per selected row, preserving duplicates:
         *  DOM-scraped ids first, then per-videoId queues built from a fresh
         *  source read so multiple instances map to distinct setVideoIds. */
        async function resolveSetVideoIds(srcId, sel) {
            const need = [...sel.values()];
            const direct = need.map((v) => v.setVideoId).filter(Boolean);
            if (direct.length === sel.size) return direct;
            const { items } = await READER.loadPlaylist(srcId);
            const queueByVid = new Map();
            for (const it of items) {
                if (!it.setVideoId) continue;
                if (!queueByVid.has(it.videoId)) queueByVid.set(it.videoId, []);
                queueByVid.get(it.videoId).push(it.setVideoId);
            }
            // Pre-consume DOM-scraped setVideoIds so they aren't double-allocated.
            for (const v of need) {
                if (!v.setVideoId) continue;
                const q = queueByVid.get(v.videoId);
                if (q) {
                    const idx = q.indexOf(v.setVideoId);
                    if (idx >= 0) q.splice(idx, 1);
                }
            }
            const out = [];
            for (const v of need) {
                if (v.setVideoId) { out.push(v.setVideoId); continue; }
                const q = queueByVid.get(v.videoId);
                if (q && q.length) out.push(q.shift());
            }
            return out;
        }

        async function createNewPlaylist(title, videoIds) {
            const body = { title, privacyStatus: 'PRIVATE' };
            if (videoIds && videoIds.length) body.videoIds = videoIds;
            const resp = await INNERTUBE.playlistCreate(body);
            const newId = resp?.playlistId
                || resp?.actions?.[0]?.createPlaylistAction?.playlistId
                || resp?.actions?.find?.((a) => a?.createPlaylistAction)?.createPlaylistAction?.playlistId;
            if (!newId) {
                throw new Error('playlistCreate returned no recognizable playlist ID — InnerTube response shape may have drifted');
            }
            return newId;
        }

        async function runBulkOp(mode, destIds, sel) {
            const srcId = DOMADAPTER.currentPlaylistId();
            const videoIds = [...sel.values()].map((v) => v.videoId);
            const guard = AUTH.openOpGuard();

            const realDestIds = destIds.filter((id) => id !== '__NEW__');
            if (destIds.includes('__NEW__')) {
                const name = prompt('Name for the new playlist:');
                if (!name || !name.trim()) {
                    DECK.logMsg('New-playlist destination cancelled (no name)', 'warn');
                    return;
                }
                try {
                    guard.check();
                    const newId = await createNewPlaylist(name.trim(), videoIds);
                    if (!newId) return;
                    // playlistCreate already seeded the videos; skip it below.
                    DECK.addOwned({ id: newId, title: name.trim() });
                    DECK.logMsg(`Created playlist "${name.trim()}" (${newId}) and seeded with ${videoIds.length} videos`, 'ok');
                } catch (e) {
                    DECK.logMsg(`Create-new-playlist failed: ${e && e.message}. Aborting.`, 'err');
                    return;
                }
            }

            let setVideoIds = [];
            if (mode === 'move') {
                DECK.logMsg('Resolving setVideoIds from source playlist…');
                try {
                    setVideoIds = await resolveSetVideoIds(srcId, sel);
                    if (setVideoIds.length !== sel.size) {
                        DECK.logMsg(`Warning: resolved ${setVideoIds.length}/${sel.size} setVideoIds; will proceed but some rows may not be removable`, 'warn');
                    }
                } catch (e) {
                    DECK.logMsg(`Failed to resolve setVideoIds: ${e && e.message}. Aborting move.`, 'err');
                    return;
                }
            }

            if (sel.size > CFG.WARN_BULK_THRESHOLD) {
                const destCount = realDestIds.length + (destIds.includes('__NEW__') ? 1 : 0);
                if (!confirm(`You're about to ${mode} ${sel.size} videos across ${destCount} playlists. Continue?`)) return;
            }

            const destFailures = [];
            if (realDestIds.length) {
                DECK.logMsg(`${mode === 'move' ? 'Moving' : 'Copying'} ${videoIds.length} videos → ${realDestIds.length} existing playlist${realDestIds.length === 1 ? '' : 's'}…`);
            }
            for (const destId of realDestIds) {
                try {
                    guard.check();
                    DECK.logMsg(`  → ${destId}`);
                    const r = await MUTATOR.addVideos(destId, videoIds, (p) => {
                        DECK.setProgress(p.applied / videoIds.length);
                        if (DECK.elx.count) DECK.elx.count.textContent = `${p.applied}/${videoIds.length}`;
                    });
                    if (r.failed.length > 0) destFailures.push({ destId, failed: r.failed.length });
                    DECK.logMsg(`  + added ${r.applied}, retried ${r.retried}, failed ${r.failed.length}`, r.failed.length ? 'warn' : 'ok');
                } catch (e) {
                    destFailures.push({ destId, error: e && e.message });
                    DECK.logMsg(`  ! ${destId}: ${e && e.message}`, 'err');
                }
            }

            if (mode === 'move') {
                if (destFailures.length > 0) {
                    // Move = copy-then-conditional-delete: any destination failure
                    // leaves the source intact or data would be silently lost.
                    DECK.logMsg(`Aborting source removal: ${destFailures.length}/${realDestIds.length} destinations had failures. Source playlist left intact.`, 'err');
                    DECK.setProgress(0);
                    return;
                }
                try {
                    guard.check();
                    DECK.logMsg(`Removing ${setVideoIds.length} from source…`);
                    const r = await MUTATOR.removeVideos(srcId, setVideoIds, (p) => {
                        DECK.setProgress(p.applied / setVideoIds.length);
                    });
                    DECK.logMsg(`- removed ${r.applied}, failed ${r.failed.length}`, r.failed.length ? 'warn' : 'ok');
                } catch (e) {
                    DECK.logMsg(`Source removal error: ${e && e.message}`, 'err');
                }
            }
            DOMADAPTER.clearSelection();
            DECK.setProgress(0);
            DECK.logMsg('Done.', 'ok');
        }

        async function doDelete() {
            const sel = DOMADAPTER.getSelection();
            if (!sel.size) { DECK.logMsg('No videos selected', 'warn'); return; }
            const srcId = DOMADAPTER.currentPlaylistId();
            if (!srcId) { DECK.logMsg('Not on a playlist page', 'warn'); return; }

            const guard = AUTH.openOpGuard();
            let setVideoIds;
            try {
                setVideoIds = await resolveSetVideoIds(srcId, sel);
            } catch (e) {
                DECK.logMsg(`Failed to resolve setVideoIds: ${e && e.message}. Aborting delete.`, 'err');
                return;
            }
            if (!setVideoIds.length) {
                DECK.logMsg('Could not resolve any setVideoIds for the selected rows; cannot delete.', 'err');
                return;
            }
            if (setVideoIds.length !== sel.size) {
                DECK.logMsg(`Warning: resolved ${setVideoIds.length}/${sel.size} setVideoIds; only those will be deleted`, 'warn');
            }
            if (!confirm(`Delete ${setVideoIds.length} video${setVideoIds.length === 1 ? '' : 's'} from this playlist?\nThis cannot be undone.`)) {
                DECK.logMsg('Delete cancelled', 'warn');
                return;
            }

            DECK.logMsg(`Deleting ${setVideoIds.length} from current playlist…`);
            try {
                guard.check();
                const r = await MUTATOR.removeVideos(srcId, setVideoIds, (p) => {
                    DECK.setProgress(p.applied / setVideoIds.length);
                });
                DECK.logMsg(`- deleted ${r.applied}, failed ${r.failed.length}`, r.failed.length ? 'warn' : 'ok');
                DOMADAPTER.clearSelection();
                DECK.setProgress(0);
            } catch (e) {
                DECK.logMsg(`Delete error: ${e && e.message}`, 'err');
            }
        }

        async function doExport() {
            const id = DOMADAPTER.currentPlaylistId();
            if (!id) { DECK.logMsg('Not on a playlist page', 'warn'); return; }
            DECK.logMsg('Exporting…');
            try {
                const data = await PORTABILITY.exportPlaylist(id);
                const title = data.playlists[0].title.replace(/[^\w-]/g, '_').slice(0, 40) || 'playlist';
                PORTABILITY.downloadJSON(data, `ytpu-${title}-${id}.json`);
                DECK.logMsg(`Exported ${data.playlists[0].items.length} items`, 'ok');
            } catch (e) {
                DECK.logMsg(`Export failed: ${e && e.message}`, 'err');
            }
        }

        async function doImport(file) {
            if (!file) return;
            const id = DOMADAPTER.currentPlaylistId();
            if (!id) { DECK.logMsg('Open a target playlist first', 'warn'); return; }
            const guard = AUTH.openOpGuard();
            try {
                const bundle = await PORTABILITY.readFile(file);
                if (!bundle || typeof bundle !== 'object') {
                    DECK.logMsg('Import failed: file is not a valid JSON object', 'err');
                    return;
                }
                if (!Array.isArray(bundle.playlists)) {
                    DECK.logMsg('Import failed: bundle.playlists missing or not an array', 'err');
                    return;
                }
                if (bundle.schema !== 'ytpm.bundle/1') {
                    DECK.logMsg(`Unknown schema: ${bundle.schema} — attempting import anyway`, 'warn');
                }
                const sources = bundle.playlists.length;
                if (sources > 1) {
                    DECK.logMsg(`Bundle contains ${sources} source playlists — all will be merged into the current target.`, 'warn');
                }

                // Preview: count what will actually land before writing.
                DECK.logMsg('Previewing target playlist…');
                const { header, items } = await READER.loadPlaylist(id);
                const existing = new Set(items.map((i) => i.videoId));
                const accepted = new Set();
                let candidate = 0, skipDup = 0, skipDel = 0, skipInBundle = 0, skipBad = 0;
                for (const p of bundle.playlists) {
                    for (const it of (p?.items || [])) {
                        if (!it || typeof it.videoId !== 'string' || !it.videoId) { skipBad++; continue; }
                        if (it.deleted) { skipDel++; continue; }
                        if (existing.has(it.videoId)) { skipDup++; continue; }
                        if (accepted.has(it.videoId)) { skipInBundle++; continue; }
                        accepted.add(it.videoId);
                        candidate++;
                    }
                }
                const title = header.title || id;
                if (candidate === 0) {
                    DECK.logMsg(`Nothing to import (${skipDup} dupes in target, ${skipInBundle} dup within bundle, ${skipDel} removed from YT, ${skipBad} malformed)`, 'warn');
                    return;
                }
                const sourceLine = sources > 1 ? `Merging ${sources} source playlists.\n` : '';
                const skipBits = [];
                if (skipDup) skipBits.push(`${skipDup} already in playlist`);
                if (skipInBundle) skipBits.push(`${skipInBundle} dup within bundle`);
                if (skipDel) skipBits.push(`${skipDel} no longer on YouTube`);
                if (skipBad) skipBits.push(`${skipBad} malformed`);
                const msg = sourceLine
                    + `Add ${candidate} new video${candidate === 1 ? '' : 's'} to "${title}"?\n`
                    + (skipBits.length ? `(${skipBits.join(', ')} — will be skipped)` : '');
                if (!confirm(msg)) { DECK.logMsg('Import cancelled', 'warn'); return; }

                guard.check();
                DECK.logMsg(`Importing ${candidate} into "${title}"…`);
                const r = await PORTABILITY.importIntoPlaylist(id, bundle, { dedupe: true });
                DECK.logMsg(`Imported: applied=${r.applied} failed=${r.failed.length}`, r.failed.length ? 'warn' : 'ok');
            } catch (e) {
                DECK.logMsg(`Import failed: ${e && e.message}`, 'err');
            }
        }

        /** v1.1.0 — Duplicate finder: groups the current playlist's items by
         *  videoId, lists every video appearing more than once, and offers a
         *  keep-first purge that removes the extra setVideoIds through the
         *  verified mutator. Read-only until the user explicitly confirms. */
        async function doDupes() {
            const id = DOMADAPTER.currentPlaylistId();
            if (!id) { DECK.logMsg('Not on a playlist page', 'warn'); return; }
            DECK.logMsg('Scanning for duplicates…');
            let items;
            try {
                const res = await EXPORTER.loadItems();
                items = res.items;
            } catch (e) {
                DECK.logMsg(`Duplicate scan failed: ${e && e.message}`, 'err');
                return;
            }
            const groups = new Map();
            for (const it of items) {
                if (!it.videoId) continue;
                if (!groups.has(it.videoId)) groups.set(it.videoId, []);
                groups.get(it.videoId).push(it);
            }
            const dupes = [...groups.entries()].filter(([, list]) => list.length > 1);
            const extraCount = dupes.reduce((n, [, list]) => n + list.length - 1, 0);
            if (!dupes.length) {
                DECK.logMsg('No duplicate videos found — every entry is unique.', 'ok');
                return;
            }
            DECK.logMsg(`Found ${dupes.length} duplicated video${dupes.length === 1 ? '' : 's'} (${extraCount} extra cop${extraCount === 1 ? 'y' : 'ies'})`, 'warn');
            const li = (it, copy) => DOMU.el('li', {}, {}, {}, {}, [
                DOMU.el('span', { class: 'tag' }, { textContent: `×${copy}` }),
                DOMU.el('a', { href: `https://www.youtube.com/watch?v=${it.videoId}`, target: '_blank', rel: 'noreferrer' }, { textContent: it.title || it.videoId }),
            ]);
            const rows = dupes.map(([vid, list]) => li(list[0], list.length));
            const removable = dupes.flatMap(([, list]) => list.slice(1).map((it) => it.setVideoId)).filter(Boolean);
            const m = DECK.modal('Ψ DUPLICATES — KEEP FIRST', (body) => {
                body.appendChild(DOMU.el('div', { class: 'kv' }, {}, {}, {}, [
                    document.createTextNode(`${dupes.length} duplicated videos · ${extraCount} extra copies · ${removable.length} removable now`),
                ]));
                if (removable.length < extraCount) {
                    body.appendChild(DOMU.el('div', { class: 'log-warn', style: 'padding:4px 0;' }, {
                        textContent: 'Some copies lack setVideoIds (read-only or drifted playlist) — they will be skipped.',
                    }));
                }
                body.appendChild(DOMU.el('ul', { class: 'modal-list' }, {}, {}, {}, rows));
            }, [
                DOMU.el('button', { class: 'btn' }, { textContent: 'Close' }),
                DOMU.el('button', { class: 'btn danger', 'data-keep-open': '' }, { textContent: `Remove ${removable.length} extra cop${removable.length === 1 ? 'y' : 'ies'}` }, {}, {
                    click: SAFETY.safeWrap(() => DECK.withLock(async () => {
                        if (!removable.length) { DECK.logMsg('Nothing removable — the playlist is read-only for this account.', 'warn'); return; }
                        if (!confirm(`Remove ${removable.length} duplicate cop${removable.length === 1 ? 'y' : 'ies'} (keeping the first of each)?\nThis cannot be undone.`)) return;
                        const guard = AUTH.openOpGuard();
                        try {
                            guard.check();
                            DECK.logMsg(`Purging ${removable.length} duplicates…`);
                            const r = await MUTATOR.removeVideos(id, removable, (p) => {
                                DECK.setProgress(p.applied / removable.length);
                            });
                            DECK.logMsg(`- removed ${r.applied}, failed ${r.failed.length}`, r.failed.length ? 'warn' : 'ok');
                            DOMADAPTER.clearSelection();
                            DECK.setProgress(0);
                            m.close();
                        } catch (e) {
                            DECK.logMsg(`Duplicate purge error: ${e && e.message}`, 'err');
                        }
                    })),
                }),
            ]);
        }

        function start() {
            // v1.1.0: the DOM adapter always runs; injectCheckboxes/selectAll
            // live-check the manager flag so Settings toggles need no reload.
            DOMADAPTER.start();
        }

        return { runBulkOp, doDelete, doExport, doImport, doDupes, resolveSetVideoIds, start };
    })();

    const QUICK = (() => {
        const videoIds = []; // ordered, deduped
        let observer = null;

        function updateDeck() {
            if (!DECK.elx.qpCount) return;
            if (videoIds.length > 20) {
                DECK.elx.qpCount.textContent = `${videoIds.length} videos — the playlist link will only play the first 20 videos.`;
                DECK.elx.qpCount.style.color = '#fd7';
            } else if (`https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`.length > 2000) {
                DECK.elx.qpCount.textContent = `${videoIds.length} videos — too many videos, URL is too long. Some videos in the playlist link may not work.`;
                DECK.elx.qpCount.style.color = '#fd7';
            } else {
                DECK.elx.qpCount.textContent = `${videoIds.length} video${videoIds.length === 1 ? '' : 's'}`;
                DECK.elx.qpCount.style.color = '';
            }
            if (DECK.elx.qpOpen) {
                // v1.3.0: an empty watch_videos?video_ids= URL 404s — the
                // anchor stays inert until the list is non-empty (the click
                // guard below remains as defense in depth).
                DECK.elx.qpOpen.href = videoIds.length
                    ? `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`
                    : 'javascript:void(0)';
            }
        }

        function toggle(videoId) {
            const at = videoIds.indexOf(videoId);
            if (at === -1) { videoIds.push(videoId); return true; }
            videoIds.splice(at, 1);
            return false;
        }

        function clear() {
            videoIds.length = 0;
            document.querySelectorAll('.ytpu-qp-add').forEach((b) => b.classList.remove('in-list'));
            updateDeck();
            DECK.logMsg('Quick playlist cleared', 'ok');
        }

        function findItemVideoId(item) {
            const link = item.querySelector('a[href*="/watch"]');
            if (!link) return null;
            try { return new URL(link.href, location.origin).searchParams.get('v'); }
            catch (e) { return null; }
        }

        function injectButtons() {
            if (!STORE.data().quickPlaylist.enabled) return;
            if (!NAV.classify().isSubscriptions) return;
            const items = document.querySelectorAll(
                'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, yt-lockup-view-model',
            );
            // v1.6.0: chunked + yielding (SCHED) — same per-item work and
            // guards; the subscriptions feed no longer absorbs this as one
            // long synchronous task.
            SCHED.sweep('quick.items', items, (item) => {
                const anchor = item.querySelector('ytd-thumbnail, yt-thumbnail-view-model, #details #menu, #menu');
                const target = anchor || item;
                if (!target || target.querySelector('.ytpu-qp-add')) return;
                const videoId = findItemVideoId(item);
                if (!videoId) return;
                const btn = DOMU.el('button', {
                    class: `ytpu-qp-add${videoIds.includes(videoId) ? ' in-list' : ''}`,
                    title: 'Add to quick playlist / remove',
                    'aria-pressed': videoIds.includes(videoId) ? 'true' : 'false',
                }, {}, {}, {
                    click: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = toggle(videoId);
                        btn.classList.toggle('in-list', added);
                        btn.setAttribute('aria-pressed', String(added));
                        updateDeck();
                    },
                }, [DOMU.svgPath('M11 5v6H5v2h6v6h2v-6h6v-2h-6V5z')]);
                target.appendChild(btn);
            });
        }

        function start() {
            // v1.1.0: no boot-time early return — injectButtons live-checks the
            // quickPlaylist flag so Settings toggles need no reload.
            observer = DOMU.observeDocument(injectButtons, CFG.OBSERVER_DEBOUNCE_MS);
            NAV.onRoute((route) => {
                if (route.isSubscriptions) setTimeout(injectButtons, 400);
            });
            updateDeck();
        }

        return { videoIds, clear, start };
    })();

    const QUEUE = (() => {
        const PROCESSED_ATTR = 'data-ytpu-queue';
        const HIDING_CLASS = 'ytpu-hiding-menu';

        // Multilingual "Add to queue" keywords.
        const QUEUE_KEYWORDS = [
            'キューに追加',            // ja
            'Add to queue',            // en
            'Añadir a la cola',        // es
            "file d'attente",          // fr
            'Warteschlange',           // de
            'Adicionar à fila',        // pt-BR
            '대기열에 추가',            // ko
            '添加到队列',               // zh-CN
            '加入佇列',                // zh-TW
            'Добавить в очередь',      // ru
            'Aggiungi alla coda',      // it
            'Aan wachtrij',            // nl
            'Dodaj do kolejki',        // pl
            'Sıraya ekle',             // tr
            'เพิ่มลงในคิว',             // th
            'Tambahkan ke antrean',    // id
            'Додати до черги',         // uk
        ];

        const ICON_QUEUE = 'M21 3H3v2h18V3zm0 4H3v2h18V7zM3 13h12v-2H3v2zm0 4h12v-2H3v2zm16-4v4h-2v-4h-4v-2h4V7h2v4h4v2h-4z';
        const ICON_WL = 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z';

        function findVideoItem(el) {
            return el.closest(
                'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model',
            );
        }

        function getVideoId(videoItem) {
            const link = videoItem.querySelector('a[href*="/watch"]');
            if (!link) return null;
            try { return new URL(link.href, location.origin).searchParams.get('v'); }
            catch (e) { return null; }
        }

        function findMenuBtn(videoItem) {
            return videoItem.querySelector('button[aria-label="その他の操作"]')
                || videoItem.querySelector('button[aria-label="Action menu"]')
                || videoItem.querySelector('button[aria-label="More actions"]')
                || videoItem.querySelector('ytd-menu-renderer #button-shape button')
                || videoItem.querySelector('ytd-menu-renderer yt-icon-button button')
                || videoItem.querySelector('button-view-model button')
                || videoItem.querySelector('yt-button-shape button[aria-haspopup="menu"]');
        }

        function waitFor(selector, timeout = 2000) {
            return new Promise((resolve) => {
                let resolved = false;
                const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };
                const found = document.querySelector(selector);
                if (found) return done(found);
                const obs = new MutationObserver(() => {
                    const el = document.querySelector(selector);
                    if (el) { obs.disconnect(); done(el); }
                });
                obs.observe(document.body, { childList: true, subtree: true, attributes: true });
                setTimeout(() => { obs.disconnect(); done(null); }, timeout);
            });
        }

        function flash(btn, ok) {
            btn.classList.add(ok ? 'ytpu-ok' : 'ytpu-err');
            setTimeout(() => btn.classList.remove('ytpu-ok', 'ytpu-err'), 1200);
        }

        async function addToWatchLater(videoId) {
            // Direct InnerTube call through the hardened kernel client.
            try {
                if (!INNERTUBE.available()) return false;
                const res = await INNERTUBE.call('browse/edit_playlist', {
                    playlistId: 'WL',
                    actions: [{ addedVideoId: videoId, action: 'ACTION_ADD_VIDEO' }],
                }, { isWrite: true });
                return res?.status === 'STATUS_SUCCEEDED';
            } catch (e) {
                LOG.debug('watch-later add failed:', e && e.message);
                return false;
            }
        }

        let busy = false;
        let busyTimer = null;

        function closeExistingPopups() {
            document.querySelectorAll('tp-yt-iron-dropdown:not([aria-hidden="true"])').forEach((dd) => {
                dd.setAttribute('aria-hidden', 'true');
                dd.style.display = 'none';
            });
        }

        const delay = (ms) => new Promise((r) => setTimeout(r, ms));

        async function addToQueueViaMenu(videoItem) {
            if (busy) return false;
            busy = true;
            if (busyTimer) clearTimeout(busyTimer);
            busyTimer = setTimeout(() => { busy = false; }, 5000);

            const menuBtn = findMenuBtn(videoItem);
            if (!menuBtn) { busy = false; return false; }

            document.body.classList.add(HIDING_CLASS);
            try {
                closeExistingPopups();
                await delay(50);
                menuBtn.click();

                const popupSel = [
                    'tp-yt-iron-dropdown:not([aria-hidden="true"]) yt-list-item-view-model',
                    'tp-yt-iron-dropdown:not([aria-hidden="true"]) ytd-menu-service-item-renderer',
                ].join(',');
                await waitFor(popupSel, 2000);
                await delay(50);

                const items = document.querySelectorAll(popupSel);
                const target = Array.from(items).find((el) =>
                    QUEUE_KEYWORDS.some((kw) => el.textContent.includes(kw)));

                if (target) {
                    target.click();
                    return true;
                }
                document.body.click();
                return false;
            } finally {
                setTimeout(() => {
                    document.body.classList.remove(HIDING_CLASS);
                    busy = false;
                    if (busyTimer) { clearTimeout(busyTimer); busyTimer = null; }
                }, 200);
            }
        }

        function isShorts(thumbnail) {
            if (thumbnail.querySelector('a[href*="/shorts/"]')) return true;
            const item = findVideoItem(thumbnail);
            if (!item) return false;
            return !!item.querySelector('a[href*="/shorts/"]');
        }

        function injectButtons(thumbnail) {
            if (thumbnail.hasAttribute(PROCESSED_ATTR)) return;
            thumbnail.setAttribute(PROCESSED_ATTR, '1');
            if (isShorts(thumbnail)) return;

            const container = DOMU.el('div', { class: 'ytpu-thumb-overlay' });

            const wlBtn = DOMU.el('button', { class: 'ytpu-hover-btn', title: 'Watch later' }, {}, {}, {
                click: async (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const item = findVideoItem(thumbnail);
                    if (!item) return flash(wlBtn, false);
                    const videoId = getVideoId(item);
                    if (!videoId) return flash(wlBtn, false);
                    const ok = await addToWatchLater(videoId);
                    flash(wlBtn, ok);
                },
            }, [DOMU.svgPath(ICON_WL)]);

            const qBtn = DOMU.el('button', { class: 'ytpu-hover-btn', title: 'Add to queue' }, {}, {}, {
                click: async (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const item = findVideoItem(thumbnail);
                    if (!item) return flash(qBtn, false);
                    const ok = await addToQueueViaMenu(item);
                    flash(qBtn, ok);
                },
            }, [DOMU.svgPath(ICON_QUEUE)]);

            container.appendChild(wlBtn);
            container.appendChild(qBtn);
            thumbnail.appendChild(container);
        }

        function processAll() {
            if (!STORE.data().queueButtons.enabled) return;
            const sel = [
                `yt-thumbnail-view-model:not([${PROCESSED_ATTR}])`,
                `ytd-thumbnail:not([${PROCESSED_ATTR}])`,
            ].join(',');
            SCHED.sweep('queue.thumbs', document.querySelectorAll(sel), injectButtons);
        }

        function start() {
            DOMU.observeDocument(processAll, CFG.OBSERVER_DEBOUNCE_MS);
            window.addEventListener('yt-navigate-finish', () => setTimeout(processAll, 600));
            processAll();
        }

        return { start };
    })();

    const CLOSE = (() => {
        let button = null;

        function getQueryArgs(query) {
            query = (query || window.location.search).substring(1);
            if (!query) return {};
            return query.split('&').reduce((prev, curr) => {
                const p = curr.split('=');
                prev[decodeURIComponent(p[0])] = p[1] ? decodeURIComponent(p[1]) : p[1];
                return prev;
            }, {});
        }

        function setQueryArgs(query) {
            if (!query) return '';
            let search = '';
            for (const prop in query) {
                if (query[prop] === undefined) {
                    search += `&${encodeURIComponent(prop)}`;
                } else {
                    search += `&${encodeURIComponent(prop)}=${encodeURIComponent(query[prop])}`;
                }
            }
            return `?${search.substr(1)}`;
        }

        let q;

        function updateURL() {
            if (!button) return;
            button.href = location.toString();
            q = getQueryArgs(button.search);
            delete q.list;
            delete q.index;
            delete q.t;
            button.search = setQueryArgs(q);
        }

        function resetQuery() {
            delete q.time_continue;
            button.search = setQueryArgs(q);
        }

        function buildButton() {
            const b = document.createElement('a');
            b.id = 'ytpu-close-playlist-btn';
            b.title = 'Close playlist';
            const svg = DOMU.svg('svg', {
                viewBox: '0 0 24 24', width: '20', height: '20',
                fill: 'none', stroke: 'currentColor', 'stroke-width': '2.4',
            }, [
                DOMU.svg('path', { d: 'M5 5 L19 19 M19 5 L5 19', 'stroke-linecap': 'round' }),
            ]);
            b.appendChild(svg);
            b.addEventListener('mouseenter', updateURL);
            b.addEventListener('mouseup', () => {
                updateURL();
                const t = PLAYER.currentTime();
                if (t > 0) {
                    q.time_continue = t;
                    b.search = setQueryArgs(q);
                    setTimeout(resetQuery, 300);
                }
            });
            return b;
        }

        function addButton(headerEl) {
            if (!button) button = buildButton();
            updateURL();
            headerEl.appendChild(button);
        }

        function start() {
            // v1.1.0: no boot-time early return — the observer callback
            // live-checks the playlistClose flag so Settings toggles need no reload.
            // v1.6.0: this was the last raw un-throttled whole-document
            // MutationObserver (two full-document queries per mutation batch —
            // hundreds of batches/s during heavy-I/O churn). It now rides
            // DOMU's debounced document observer: same guard logic, same
            // re-add behavior, bounded 300 ms cadence.
            DOMU.observeDocument(() => {
                if (!STORE.data().playlistClose.enabled) return;
                if (document.contains(button)) return;
                const playlistHeader = document.querySelector([
                    '#playlist:not(.ytd-miniplayer) .header',
                    '#player-playlist .playlist-header',
                ].join(','));
                if (playlistHeader) addButton(playlistHeader);
            }, 300);
        }

        return { start };
    })();

    const METAINFO = (() => {
        function handleVideoInList(rowEl) {
            if (!STORE.data().metaInfo.enabled) return; // v1.1.0: live toggle
            const titleEl = rowEl.querySelector('#video-title.ytd-playlist-video-renderer[aria-label]');
            if (!titleEl) return;
            const hiddenData = titleEl.getAttribute('aria-label');
            let time, unit, views;
            hiddenData.replace(
                /.*?([0-9,]+) ([a-z]+?)s? ago.*? ([0-9,]+) views/,
                (x, ...captures) => { [time, unit, views] = captures; return x; },
            );
            let metaInfo = 'Posted ';
            const date = new Date();
            if (unit === 'day') {
                date.setDate(date.getDate() - time);
                metaInfo += `on ${date.toString().replace(/(20\d\d) .*/, '$1')}`;
            } else if (unit === 'week') {
                date.setDate(date.getDate() - (time * 7));
                metaInfo += `week of ${date.toString().replace(/(20\d\d) .*/, '$1')}`;
            } else if (unit === 'month') {
                date.setMonth(date.getMonth() - time);
                metaInfo += `in ${date.toString().replace(/^[^ ]* ([^ ]+) .*? (20\d\d) .*/, '$1 $2')}`;
            } else if (unit === 'year') {
                date.setYear(date.getYear() - time + 1900);
                metaInfo += `in ${date.toString().replace(/^.*? (20\d\d) .*/, '$1')}`;
            } else if (unit) {
                // hours / minutes — today.
                metaInfo += `today (${date.toString().replace(/(20\d\d) .*/, '$1')})`;
            } else {
                return; // no recognizable relative date in the aria-label
            }
            if (views !== undefined) metaInfo += ` | Views: ${views}`;
            titleEl.setAttribute('data-ytpu-meta', metaInfo);
        }

        function start() {
            // v1.1.0: no boot-time early return — handleVideoInList live-checks
            // the metaInfo flag so Settings toggles need no reload.
            DOMU.onParentChildSelectors({
                parentSelector: 'ytd-playlist-video-list-renderer #contents',
                childSelector: 'ytd-playlist-video-renderer',
                inserted: (rows) => rows.forEach(handleVideoInList),
            });
            // Initial sweep for already-rendered rows.
            // v1.6.0: chunked + yielding (SCHED) — a 5000-row playlist's
            // initial metadata pass no longer runs as one long task.
            SCHED.sweep('metainfo.rows',
                document.querySelectorAll('ytd-playlist-video-list-renderer ytd-playlist-video-renderer'),
                handleVideoInList);
        }

        return { start };
    })();

    const EPISODE = (() => {
        function expand() {
            if (!STORE.data().episodeExpand.enabled) return; // v1.1.0: live toggle
            const chapterTitle = document.querySelector('.ytp-chapter-title');
            // Null-guarded: upstream threw on chapter-less videos.
            if (chapterTitle && typeof chapterTitle.click === 'function') chapterTitle.click();
        }

        function start() {
            // v1.1.0: no boot-time early return — expand live-checks the flag.
            window.addEventListener('load', () => setTimeout(expand, 0));
            window.addEventListener('yt-page-data-updated', () => setTimeout(expand, 400));
            window.addEventListener('yt-navigate-finish', () => setTimeout(expand, 600));
        }

        return { start };
    })();

    const HUGE = (() => {
        let nextButtonInterval = null;

        function markCurrentItem(videoId) {
            const existing = document.querySelector('.ytpu-huge-browser .item[data-current]');
            if (existing) existing.removeAttribute('data-current');
            const current = document.querySelector(`.ytpu-huge-browser .item[data-id="${videoId}"]`);
            if (current) {
                current.setAttribute('data-current', '');
                current.parentElement.scrollTop = current.offsetTop
                    - 12 * parseFloat(getComputedStyle(document.documentElement).fontSize || '10px');
            }
        }

        function playNext() {
            if (location.pathname !== '/watch') return;
            const next = document.querySelector('.ytpu-huge-browser .items .item[data-current] + .item');
            if (next) next.click();
        }

        function hijackNextButton() {
            const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpu-huge="applied"])');
            if (!nextButton) return;
            const newButton = nextButton.cloneNode(true);
            newButton.removeAttribute('href');
            newButton.setAttribute('ytpu-huge', 'applied');
            nextButton.replaceWith(newButton);
            newButton.addEventListener('click', () => playNext());
        }

        async function buildBrowser(list) {
            const panelHost = document.querySelector('#secondary-inner > ytd-playlist-panel-renderer#playlist');
            if (!panelHost) return;
            const browser = DOMU.el('div', { class: 'ytpu-huge-browser', 'data-list': list }, {}, {}, {}, [
                DOMU.el('div', { class: 'title' }, { textContent: 'Ψ PLAYLIST BROWSER' }),
                DOMU.el('div', { class: 'information' }, {
                    textContent: 'YouTube could not render this playlist natively. Playlist Master is browsing it through the InnerTube API — every item is here.',
                }),
                DOMU.el('div', { class: 'items' }, { textContent: 'Loading playlist…' }),
                DOMU.el('div', { class: 'footer' }, { textContent: `list=${list}` }),
            ]);
            panelHost.insertAdjacentElement('afterend', browser);

            try {
                const { header, items } = await READER.loadPlaylist(list, (p) => {
                    const box = browser.querySelector('.items');
                    if (box) box.textContent = `Loading… ${p.loaded}${p.total ? ` / ${p.total}` : ''}`;
                });
                const box = browser.querySelector('.items');
                box.textContent = '';
                if (header.title) browser.querySelector('.title').textContent = `Ψ ${header.title}`;
                browser.querySelector('.footer').textContent = `${items.length} items · list=${list}`;
                items.forEach((it) => {
                    // v1.3.0: entries without a valid video id (deleted /
                    // unavailable) render as dimmed, non-navigable notes —
                    // a clickable /watch?v=undefined row is a guaranteed 404.
                    const playable = NAV.validVideoId(it.videoId);
                    const row = DOMU.el('div', {
                        class: 'item',
                        'data-id': it.videoId || '',
                        role: playable ? 'link' : 'note',
                        tabindex: playable ? '0' : '-1',
                    }, {
                        textContent: `${it.deleted || !playable ? '⚑ ' : ''}${it.title || it.videoId || '[unavailable]'}${it.lengthText ? ` · ${it.lengthText}` : ''}`,
                    }, {}, playable ? {
                        click: () => PLAYER.redirect(it.videoId, list),
                    } : {});
                    if (!playable) row.style.opacity = '0.55';
                    box.appendChild(row);
                });
                markCurrentItem(new URLSearchParams(location.search).get('v'));
            } catch (e) {
                const box = browser.querySelector('.items');
                box.textContent = `Could not load this playlist: ${e && e.message}`;
                box.style.color = '#f77';
            }

            if (nextButtonInterval) clearInterval(nextButtonInterval);
            nextButtonInterval = setInterval(() => {
                if (!document.querySelector('.ytpu-huge-browser')) { clearInterval(nextButtonInterval); return; }
                hijackNextButton();
            }, 1000);

            // Auto-advance near the end + SHIFT+N shortcut (upstream parity).
            document.addEventListener('keydown', (event) => {
                if (!document.querySelector('.ytpu-huge-browser')) return;
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    playNext();
                }
            }, true);

            const autoInterval = setInterval(() => {
                if (!document.querySelector('.ytpu-huge-browser')) { clearInterval(autoInterval); return; }
                const player = PLAYER.getPlayer();
                const progressState = PLAYER.getProgressState();
                if (!player || !progressState) return;
                if (!PLAYER.isAdPlaying() && progressState.current >= progressState.duration - 2) {
                    player.pauseVideo();
                    player.seekTo(0);
                    playNext();
                }
            }, 500);
        }

        function apply() {
            if (!STORE.data().hugePlaylist.enabled) return;
            if (location.pathname !== '/watch') return;
            const params = new URLSearchParams(location.search);
            if (!params.has('list') || params.has('ytpa-random')) return;
            const list = params.get('list');
            if (list.startsWith('TLPQ')) return;      // queues cannot be browsed externally
            if (list.length <= 4) return;              // no user id — not fetchable

            const existing = document.querySelector('.ytpu-huge-browser');
            if (existing) {
                if (list === existing.getAttribute('data-list')) {
                    markCurrentItem(params.get('v'));
                    return;
                }
                existing.remove();
                location.reload(); // drop client-side manipulations (upstream parity)
                return;
            }
            // Only intervene when YouTube itself failed to render the playlist.
            const native = document.querySelector('#secondary-inner > ytd-playlist-panel-renderer#playlist #items:empty');
            if (!native) return;
            buildBrowser(list);
        }

        function start() {
            window.addEventListener('yt-navigate-finish', () => setTimeout(SAFETY.safeWrap(apply), 1000));
            NAV.onRoute((route) => { if (route.isWatch) setTimeout(SAFETY.safeWrap(apply), 1000); });
        }

        return { start };
    })();

    const RANDOM = (() => {
        const storagePrefix = 'ytpa-random-'; // same key format — YTPA users keep their state

        function getStorageKey() { return `${storagePrefix}${new URLSearchParams(location.search).get('list')}`; }

        function readStorage(allowEmpty = false) {
            try {
                const value = localStorage.getItem(getStorageKey());
                if (!value) {
                    if (allowEmpty) return {};
                    updateStorage();
                    return readStorage(true);
                }
                return JSON.parse(value);
            } catch (e) {
                try { localStorage.removeItem(getStorageKey()); } catch (e2) { LOG.debug('storage reset failed:', e2 && e2.message); }
                return {};
            }
        }

        function writeStorage(map) {
            try { localStorage.setItem(getStorageKey(), JSON.stringify(map)); }
            catch (e) { LOG.debug('random storage write failed (quota?):', e && e.message); }
        }

        function getPlaylistContainer() {
            return document.querySelector('#secondary ytd-playlist-panel-renderer, #below ytd-playlist-panel-renderer');
        }

        function updateStorage() {
            const container = getPlaylistContainer();
            if (!container) return;
            const elements = container.querySelectorAll('a#wc-endpoint:not([href*="&ytpa-random="])');
            if (elements.length === 0) return;
            const map = readStorage(true);
            elements.forEach((element) => {
                const videoId = PLAYER.getVideoId(element.href);
                if (videoId && !(videoId in map)) map[videoId] = false;
                element.href += `&ytpa-random=${mode}`;
                // Bypass client-side routing.
                element.addEventListener('click', (event) => {
                    event.preventDefault();
                    NAV.safeNavigate(element.href, 'RANDOM.rowBypass'); // v1.3.0: integrity gate
                });
                if (videoId && map[videoId]) {
                    element.parentElement.setAttribute('hidden', '');
                }
            });
            writeStorage(map);
        }

        const isWatched = (videoId) => !!readStorage(true)[videoId];

        function markWatched(videoId) {
            if (!videoId) return;
            const map = readStorage(true);
            map[videoId] = true;
            writeStorage(map);
            document.querySelectorAll(`#wc-endpoint[href*="${videoId}"]`).forEach((element) => {
                element.parentElement.setAttribute('hidden', '');
            });
        }

        function playNextRandom(reload = false) {
            if (location.pathname !== '/watch') return;
            const player = PLAYER.getPlayer();
            if (player) player.pauseVideo();

            const map = readStorage(true);
            // v1.3.0: garbage/legacy localStorage keys can never become a
            // navigation target — the candidate pool is id-validated.
            const videos = Object.entries(map).filter(([id, watched]) => !watched && NAV.validVideoId(id));
            if (!videos.length) return;
            const params = new URLSearchParams(location.search);

            // Either one fifth or at most the 20 newest.
            const preferenceRange = Math.max(1, Math.min(videos.length * 0.2, 20));
            let videoIndex;
            switch (mode) {
                case 'prefer-newest':
                    videoIndex = Math.floor(Math.random() * preferenceRange);
                    break;
                case 'prefer-oldest':
                    videoIndex = Math.max(0, videos.length - 1 - Math.floor(Math.random() * preferenceRange));
                    break;
                default:
                    videoIndex = Math.floor(Math.random() * videos.length);
            }
            if (reload) {
                params.set('v', videos[videoIndex][0]);
                params.set('ytpa-random', mode);
                params.delete('t');
                params.delete('index');
                params.delete('ytpa-random-initial');
                NAV.safeNavigate(`${location.pathname}?${params.toString()}`, 'RANDOM.next');
            } else {
                PLAYER.redirect(videos[videoIndex][0], params.get('list'), { key: 'ytpa-random', value: mode });
            }
        }

        function applyRandomPlay() {
            if (location.pathname !== '/watch') return;
            const container = getPlaylistContainer();
            if (container === null) return;
            if (container.hasAttribute('ytpa-random')) return;
            // v1.1.0: a fresh container means a new session — retire the
            // previous session's timers and keydown hook instead of stacking
            // them across SPA navigations (v1.0.0 accumulated both).
            if (activeShutdown) { activeShutdown(); activeShutdown = null; }
            container.setAttribute('ytpa-random', 'applied');

            // v1.6.0: the panel can exist before its #items host renders.
            // v1.5.0 threw a TypeError here per 1 s tick (caught by safeWrap,
            // but re-logged forever); now retire the marker and retry on the
            // next tick until the items host appears.
            const itemsHost = container.querySelector('#items');
            if (!itemsHost) {
                container.removeAttribute('ytpa-random');
                return;
            }
            itemsHost.insertAdjacentElement('beforebegin', DOMU.el('div', { class: 'ytpu-random-notice' }, {}, {}, {}, [
                document.createTextNode('This playlist is using random play. The videos will '),
                DOMU.el('strong', {}, { textContent: 'not play in the order' }),
                document.createTextNode(' listed here.'),
            ]));

            // v1.1.0: every interval is tracked so shutdown can reclaim all of
            // them — v1.0.0 leaked updateStorage + badge timers forever after
            // the user exited random mode (GUP D4 ruthless reclamation).
            const ownedIntervals = new Set();
            const ownInterval = (fn, ms) => {
                const id = setInterval(fn, ms);
                ownedIntervals.add(id);
                return id;
            };
            const shutdown = () => {
                for (const id of ownedIntervals) clearInterval(id);
                ownedIntervals.clear();
                document.removeEventListener('keydown', onKey, true);
                const notice = container.querySelector('.ytpu-random-notice');
                if (notice) notice.remove();
            };

            updateStorage();
            ownInterval(SAFETY.safeWrap(updateStorage), 1000);

            // YouTube keeps erasing the exit badge — keep re-adding it.
            ownInterval(() => {
                if (!container.isConnected) { shutdown(); return; }
                if (container.querySelector('.ytpu-badge')) return;
                const header = container.querySelector('h3 a');
                if (!header) return;
                header.href = 'javascript:void(0)';
                header.insertAdjacentElement('beforeend', DOMU.el('button', { class: 'ytpu-badge', title: 'Exit random play' }, {}, {}, {
                    click: (event) => {
                        event.preventDefault();
                        try { localStorage.removeItem(getStorageKey()); } catch (e) { LOG.debug('badge exit failed:', e && e.message); }
                        const params = new URLSearchParams(location.search);
                        params.delete('ytpa-random');
                        params.delete('ytpa-random-initial');
                        NAV.safeNavigate(`${location.pathname}?${params.toString()}`, 'RANDOM.exit');
                    },
                }, [
                    document.createTextNode(mode),
                    DOMU.el('span', { class: 'x' }, { textContent: '×' }),
                ]));
            }, 5000);

            if (initial === '1' || isWatched(PLAYER.getVideoId(location.href))) {
                playNextRandom();
            }

            const onKey = (event) => {
                // SHIFT + N (upstream parity)
                if (event.shiftKey && event.key.toLowerCase() === 'n') {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    const videoId = PLAYER.getVideoId(location.href);
                    markWatched(videoId);
                    playNextRandom(true); // reload — YouTube otherwise forces the next in line
                }
            };
            document.addEventListener('keydown', onKey, true);
            activeShutdown = shutdown;

            const tick = () => {
                const paramsNow = new URLSearchParams(location.search);
                if (!paramsNow.has('ytpa-random') || location.pathname !== '/watch') {
                    clearInterval(tickInterval); // random mode exited — reclaim (GUP D4)
                    shutdown(); // v1.1.0: also reclaim the storage/badge timers, keydown hook + notice
                    container.removeAttribute('ytpa-random');
                    if (activeShutdown === shutdown) activeShutdown = null;
                    return;
                }
                const videoId = PLAYER.getVideoId(location.href);
                const params = new URLSearchParams(location.search);
                params.set('ytpa-random', mode);
                window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);

                const player = PLAYER.getPlayer();
                const progressState = PLAYER.getProgressState();
                if (!player || !progressState) return;
                if (!PLAYER.isAdPlaying()) {
                    if (progressState.current / progressState.duration >= CFG.RANDOM_MARK_WATCHED_AT) {
                        markWatched(videoId);
                    }
                    if (progressState.current >= progressState.duration - CFG.RANDOM_AUTOPLAY_AT_END) {
                        player.pauseVideo();
                        player.seekTo(0);
                        playNextRandom();
                    }
                }
                const nextButton = document.querySelector('#ytd-player .ytp-next-button.ytp-button:not([ytpa-random="applied"])');
                if (nextButton) {
                    const newButton = nextButton.cloneNode(true);
                    newButton.removeAttribute('href');
                    newButton.setAttribute('ytpa-random', 'applied');
                    nextButton.replaceWith(newButton);
                    newButton.addEventListener('click', () => {
                        markWatched(videoId);
                        playNextRandom();
                    });
                }
            };
            const tickInterval = setInterval(SAFETY.safeWrap(tick), 500);
            SAFETY.safeWrap(tick)();
        }

        let mode = 'random';
        let initial = null;
        let activeShutdown = null; // v1.1.0: retire the previous random session on SPA re-entry

        function start() {
            if (ENV.isMobile()) return; // random play is desktop-only
            const params = new URLSearchParams(location.search);
            if (!params.has('ytpa-random') || params.get('ytpa-random') === '0') return;
            mode = params.get('ytpa-random');
            initial = params.get('ytpa-random-initial');

            // Legacy migration: broken array-format storage is discarded.
            try {
                const value = readStorage(true);
                if (Array.isArray(value)) localStorage.removeItem(getStorageKey());
            } catch (e) { /* already handled inside readStorage */ }

            setInterval(SAFETY.safeWrap(applyRandomPlay), 1000);
            applyRandomPlay();
        }

        return { start };
    })();

    const MENU = (() => {
        const registered = new Map(); // key -> menu id

        function canRegister() {
            return typeof GM_registerMenuCommand === 'function';
        }

        function set(key, label, handler) {
            if (!canRegister()) return;
            if (registered.has(key)) {
                if (typeof GM_unregisterMenuCommand === 'function') {
                    GM_unregisterMenuCommand(registered.get(key));
                }
                registered.delete(key);
            }
            try {
                registered.set(key, GM_registerMenuCommand(label, SAFETY.safeWrap(handler)));
            } catch (e) {
                LOG.debug('menu command failed:', key, e && e.message);
            }
        }

        function remove(key) {
            if (!canRegister() || !registered.has(key)) return;
            if (typeof GM_unregisterMenuCommand === 'function') {
                try { GM_unregisterMenuCommand(registered.get(key)); } catch (e) { LOG.debug('unregister failed:', e && e.message); }
            }
            registered.delete(key);
        }

        /** drhouse's view=57 trick: the legacy channel-uploads playlist view.
         *  v1.3.0: the legacy renderer only exists on channel TAB urls
         *  (videos/shorts/streams/featured) — on a channel home YouTube
         *  hard-404s /@handle?view=57, so we guide instead of navigating. */
        function uploaderView57() {
            if (!/^\/(@[^/]+|c\/[^/]+|user\/[^/]+|channel\/[^/]+)\/(videos|shorts|streams|featured)$/.test(location.pathname)) {
                LOG.warn('view=57 needs a channel tab (Videos / Shorts / Live) — open one first, then run this command');
                return;
            }
            const sep = location.href.includes('?') ? '&' : '?';
            NAV.safeNavigate(`${location.href}${sep}view=57`, 'MENU.view57');
        }

        function refresh(route) {
            // Always available
            set('settings', 'Ψ Open Settings', () => SETTINGS.show());
            set('export', 'Export current playlist…', () => EXPORTER.openPlaintextDialog());
            set('snapshot', 'Snapshot current playlist', () => DECK.withLock(() => EXPORTER.doSnapshot()));

            // Contextual
            if (route.isChannel) {
                set('view57', 'Uploader playlist (legacy view=57)', uploaderView57);
            } else {
                remove('view57');
            }
        }

        function start() {
            NAV.onRoute(refresh);
            refresh(NAV.classify());
        }

        // v1.2.0: set is exposed so BOOT can register the failsafe rescue
        // command BEFORE any feature starts (remove stays internal — it has
        // no external consumer; zero dead code).
        return { start, set };
    })();

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║ §35A HOTKEYS — global keyboard shortcuts (v1.2.0)               ║
    // ╚══════════════════════════════════════════════════════════════════╝

    const HOTKEYS = (() => {
        // Alt+Shift+<letter> sits outside YouTube's own shortcut map (which
        // uses bare letters and Shift+<letter>), so nothing here shadows the
        // player, the playlist panel or YouTube's keyboard help overlay.
        const COMBOS = {
            'Alt+Shift+U': { action: 'toggleDeck', label: 'Toggle the Ψ deck panel' },
            'Alt+Shift+S': { action: 'openSettings', label: 'Open Settings' },
            'Alt+Shift+X': { action: 'rescueDeck', label: 'Force re-show the Ψ deck' },
        };

        function comboOf(event) {
            if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return null;
            if (!event.key || event.key.length !== 1) return null;
            return `Alt+Shift+${event.key.toUpperCase()}`;
        }

        function isTyping(event) {
            const t = event.target;
            if (!t || !t.tagName) return false;
            const tag = t.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select' || t.isContentEditable === true;
        }

        function onKeydown(event) {
            if (event.repeat || isTyping(event)) return;
            const settings = STORE.data();
            if (!settings.hotkeys || settings.hotkeys.enabled === false) return; // live setting
            const combo = comboOf(event);
            const binding = combo ? COMBOS[combo] : null;
            if (!binding) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            LOG.info(`hotkey ${combo} — ${binding.label}`);
            try {
                if (binding.action === 'toggleDeck') DECK.toggleFromHotkey();
                else if (binding.action === 'openSettings') SETTINGS.show();
                else if (binding.action === 'rescueDeck') DECK.rescue();
            } catch (e) { LOG.error(`hotkey ${combo} failed:`, e); }
        }

        function start() {
            document.addEventListener('keydown', onKeydown, true);
        }

        return { start };
    })();

    const BOOT = (() => {
        let started = false;
        let watchdogId = null;

        function greet() {
            // One branded line per page load (YTPA Greeter, miniaturized).
            console.info(
                `%cΨ PLAYLIST MASTER%c v${CFG.SCRIPT_VERSION} · 4NDR0666 · 3lectric-Glass · GUP v5.3 superset`,
                'color:#00E5FF;font-weight:bold;font-size:14px',
                'color:#67E8F9;font-size:11px',
            );
            if (STORE.data().debug) {
                const info = {
                    time: new Date().toISOString(),
                    version: CFG.SCRIPT_VERSION,
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    route: NAV.classify(),
                };
                console.debug(`[Ψ] debug info: ${JSON.stringify(info, null, 2)}`);
            }
        }

        // v1.2.0: fault isolation. v1.1.0 wrapped the whole start chain in a
        // single try/catch, so one throwing feature silently killed every
        // feature after it. Each start now runs in its own isolation cell and
        // reports its own failure.
        const FEATURES = [
            ['THEME', () => THEME.apply()],
            ['CHBTNS', () => CHBTNS.start()],
            ['MEMBERSTAB', () => MEMBERSTAB.start()],
            ['REVERSE', () => REVERSE.start()],
            ['AUTOPLAY', () => AUTOPLAY.start()],
            ['SORTER', () => SORTER.start()],
            ['EXPORTER', () => EXPORTER.start()],
            ['MANAGER', () => MANAGER.start()],
            ['QUICK', () => QUICK.start()],
            ['QUEUE', () => QUEUE.start()],
            ['CLOSE', () => CLOSE.start()],
            ['METAINFO', () => METAINFO.start()],
            ['EPISODE', () => EPISODE.start()],
            ['HUGE', () => HUGE.start()],
            ['RANDOM', () => RANDOM.start()],
            ['MENU', () => MENU.start()],
            ['HOTKEYS', () => HOTKEYS.start()],
        ];

        function startAllFeatures() {
            for (const [name, start] of FEATURES) {
                try { start(); } catch (e) { LOG.error(`${name}.start failed:`, e); }
            }
        }

        function pageContextReady() {
            try { return !!(ENV.pageWin.ytcfg && typeof ENV.pageWin.ytcfg.get === 'function'); }
            catch (e) { return false; }
        }

        /** v1.2.0: ytcfg availability is STATUS, not a boot gate. The deck is
         *  already mounted; this only flips the deck log to "online" the
         *  moment the InnerTube context appears. Bounded poll (120 × 1 s,
         *  GUP B.1) — v1.1.0 instead blocked ALL UI on this condition for
         *  100 s and then booted "degraded". */
        function trackPageContext() {
            if (pageContextReady()) return;
            DECK.logMsg('YouTube API not visible yet — manager/export come online automatically', 'warn');
            console.warn('[Ψ Playlist Master] window.ytcfg is not yet visible from this userscript manager. The deck is fully mounted; API-backed features (bulk manager, snapshots, quick playlists) will activate automatically when the context appears.');
            let tries = 0;
            const poll = setInterval(() => {
                tries += 1;
                if (pageContextReady()) {
                    clearInterval(poll);
                    DECK.logMsg('YouTube API online — all features available', 'ok');
                } else if (tries >= 120) {
                    clearInterval(poll);
                    DECK.logMsg('YouTube API never became visible — API features stay offline (deck unaffected)', 'err');
                }
            }, 1000);
        }

        /** v1.2.0: if YouTube's DOM churn (or another extension) detaches the
         *  deck, re-mount it automatically. Bounded work per tick; lifetime
         *  interval of the same class as NAV's mobile poll. */
        function armWatchdog() {
            if (watchdogId !== null) return;
            let mountFails = 0; // v1.4.0: consecutive re-mount failure tracking
            watchdogId = setInterval(() => {
                try {
                    if (!DECK.root || !DECK.root.isConnected) {
                        DECK.mount();
                        DECK.updateVisibility(NAV.classify());
                        DECK.logMsg('Deck was detached — automatically re-mounted', 'warn');
                        mountFails = 0;
                    }
                } catch (e) {
                    // v1.4.0: re-mount failures were debug-level (invisible in
                    // the field log while the deck silently stayed down for
                    // the whole session). Escalate the FIRST consecutive
                    // failure to error level with the retry cadence stated,
                    // then stay quiet so a persistent fault cannot flood the
                    // console; the counter resets on the next success.
                    mountFails += 1;
                    if (mountFails === 1) LOG.error('deck re-mount failed — the watchdog keeps retrying every 5 s:', e);
                }
            }, 5000);
        }

        function initialize() {
            // v1.6.0: attach the global error/unhandledrejection shield
            // FIRST — defined since v1.1.0 but never wired (grep-verified:
            // its only two occurrences were definition + export), the
            // documented crash-resilience capability never actually ran.
            try { SAFETY.attachGlobalListener(); } catch (e) { LOG.debug('global shield attach failed:', e && e.message); }
            // Failsafe first (v1.2.0): the manager-menu rescue command must
            // exist even if every later step throws.
            try { MENU.set('rescue', 'Ψ Force show deck (Alt+Shift+X)', () => DECK.rescue()); }
            catch (e) { LOG.debug('rescue menu command failed:', e && e.message); }
            try { greet(); } catch (e) { LOG.debug('greet failed:', e && e.message); }
            try { DECK.mount(); } catch (e) { LOG.error('deck mount failed:', e); }
            try { startAllFeatures(); } catch (e) { LOG.error('feature start failed:', e); }
            try {
                NAV.onRoute((route) => { if (DECK.root) DECK.updateVisibility(route); });
                DECK.updateVisibility(NAV.classify());
                NAV.start();
            } catch (e) { LOG.error('navigation wiring failed:', e); }
            try { trackPageContext(); } catch (e) { LOG.debug('page-context tracking failed:', e && e.message); }
            try { armWatchdog(); } catch (e) { LOG.debug('watchdog arming failed:', e && e.message); }
        }

        /** v1.2.0: mount immediately — no ytcfg gate. v1.0.0/v1.1.0 refused
         *  to mount any UI until unsafeWindow.ytcfg appeared, which never
         *  happens in some manager sandboxes; users saw nothing for 100
         *  seconds and then a "degraded" boot. The UI never depends on page
         *  JS; API-backed features degrade on their own. */
        function start() {
            if (started) return;
            started = true;
            initialize();
        }

        return { start };
    })();

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        BOOT.start();
    } else {
        window.addEventListener('DOMContentLoaded', BOOT.start, { once: true });
    }
})();
