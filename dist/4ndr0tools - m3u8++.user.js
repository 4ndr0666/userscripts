// ==UserScript==
// @name         4ndr0tools - m3u8++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.1.0
// @author       4ndr0666
// @description  Automatically displays the m3u8 url for ANY video playing in the top right corner of the video. Click url to copy or click download to use the webapp "tools.thatwind.com". Also injects Play buttons next to magnet links on every page, relaying them to www.diancigaoshou.com.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20m3u8++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20m3u8++.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @exclude      *://www.diancigaoshou.com/*
// @require      https://cdn.jsdelivr.net/npm/m3u8-parser@4.7.1/dist/m3u8-parser.min.js
// @connect      *
// @grant        unsafeWindow
// @grant        GM_openInTab
// @grant        GM.openInTab
// @grant        GM_getValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM_deleteValue
// @grant        GM.deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_download
// @run-at       document-start
// ==/UserScript==

/* ══ kernel/net.js (inlined by tools/build.mjs — edit kernel/, not here) ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/net.js — the NetHook singleton (v1.4.3 restore + hardening;
 * v1.4.5 veto semantics; v1.4.6 structured traffic + error recovery)
 * ----------------------------------------------------------------------------
 * THE co-install interference fix for the network family. Before this module,
 * every network-tapping script installed its own fetch/XHR proxy on shared
 * pages; co-installed, they stacked — Blob2URL's vault over LinkMasterΨ's
 * IG harvester on instagram.com read every response body twice, with wrap
 * chains N scripts deep (the v1.4.3 sink census measured the surface).
 * NetHook installs exactly ONE wrap set per realm and fans every captured
 * event out to isolated suite subscribers.
 *
 * v3 (suite v1.4.5) — REQUEST VETO. The hub is no longer observer-only:
 *   - onRequest(fn) — request-time defusal. fn(req) sees every outgoing
 *     fetch/XHR/sendBeacon BEFORE the network, where req is
 *     { url, method, kind: 'fetch'|'xhr'|'beacon', body }, and may return:
 *       { veto: true }    cancel — fetch rejects with a native-style
 *                        TypeError, XHR fires the readystatechange/error/
 *                        loadend surface at status 0, beacons swallow and
 *                        report success;
 *       { respond: { status, statusText, body, contentType } }
 *                        phantom response — the request never leaves the
 *                        page. fetch resolves a synthetic Response; XHR
 *                        delivers on the 40 ms D6 cadence with the full
 *                        mocked surface (readyState/status/statusText/
 *                        responseText/response/responseURL +
 *                        readystatechange/load/loadend, responseType
 *                        'json' parsed); beacons swallow;
 *       { body: <new> }   rewrite the outgoing body (identifier
 *                        poisoning) — later subscribers see earlier
 *                        rewrites; the last rewrite wins.
 *     Verdict order: first veto/respond wins; a throwing subscriber is
 *     isolated (scoped console.debug, GUP D6 deliberate interception) and
 *     treated as no-opinion — a broken defuser must never break the page.
 *   - propagate(target) — arm the wrap set into an additional realm
 *     (iframe propagation); idempotent, slot-aware, cross-origin safe.
 *   - Phantom bodies are fanned to onBody observers exactly like real
 *     ones (deterministic parity with the stacked-wrap ordering the
 *     per-script facades produced), under the same 4 MB cap.
 *
 * v4 (suite v1.4.6) — STRUCTURED TRAFFIC + ERROR RECOVERY:
 *   - onTraffic(fn) — the structured observer channel. fn(ev) receives
 *     { id, url, method, kind: 'fetch'|'xhr'|'beacon', phase, body?,
 *     status?, contentType?, responseType?, truncated?, source?,
 *     errorName?, errorMessage? } with phase:
 *       'request'  — after the defusal consult (blocked requests never
 *                    fire a request event: their story is the defuser's
 *                    own onRequest verdict, not a phantom exchange);
 *                    body may be null (GETs) — subscribers apply policy;
 *       'response' — EVERY fetch status (2xx through 5xx — the forensic
 *                    family needs error bodies too), XHR text/json loads,
 *                    and phantom respond-verdict bodies (source:
 *                    'respond'), bodies capped at 4 MB with a truncated
 *                    flag when the cap tripped;
 *       'error'    — real network failures (source: 'network') AND
 *                    hub-vetoed requests (source: 'veto').
 *     The id field correlates the phases of one logical exchange
 *     (monotonic per hub instance). The channel is COMPLETE: the hub
 *     reports every observable event, and policy (what to log, what to
 *     ignore) belongs to subscribers — Recon's ledger and Stream
 *     Interceptor's sniffer both subscribe here instead of stacking
 *     their own wraps (the v1.4.5 defuser migration, extended to the
 *     observer family).
 *   - onError(fn) — failure-time recovery, fetch-only. fn(ev) receives
 *     { id, url, method, kind: 'fetch', errorName, errorMessage } and
 *     may return { respond: {...} } to convert a REAL network failure
 *     into a phantom response (the reconh-lineage 204 pacification:
 *     an ad-blocker-nulled fetch resolves as a synthetic 204 instead
 *     of crashing the host app). Hub-vetoed requests are final and
 *     NEVER reach this consult — a pacifier must not un-defuse a
 *     defuser's cancel (veto-vs-pacify conflict resolution: the
 *     earlier, decisive defusal wins). XHR errors surface through
 *     onTraffic only (the reconh lineage never pacified XHR failures,
 *     and adding a mock-at-error-time surface would change host-visible
 *     semantics that no baseline guaranteed).
 *   - Transitional chaining: every arm mark now carries the hub VERSION.
 *     A newer-generation hub wraps ABOVE older-generation wraps (the old
 *     generation keeps serving its own subscribers underneath for the
 *     one update window where old and new dist co-install); a
 *     same-or-newer mark is left alone. This fixes the v2→v3 window
 *     where a newer hub's subscriptions sat unreachable behind an older
 *     generation's wraps — silently inert network features — because the
 *     version-less mark made the newer hub skip its own arm.
 *   - Bounded reads: fetch bodies are read through the clone's stream
 *     reader with early cancel at the 4 MB cap when available
 *     (clone().text() fallback for exotic realms) — the read stops
 *     feeding memory past the cap instead of materializing an
 *     unbounded string first (the v2/v3 read was full-length with a
 *     post-hoc length check; Stream Interceptor's readStreamCapped
 *     pattern, promoted into the kernel).
 *
 * Design contract (v2, preserved):
 *   - PAGE REALM FIRST: the slot + wraps live on unsafeWindow when
 *     available (that is where host page fetches live — the same realm
 *     choice the per-script wraps already made), window otherwise.
 *   - LAZY ARM: zero wraps until the first subscriber registers (onBody,
 *     onRequest, onTraffic OR onError) — a co-installed script that only
 *     subscribes on its own host costs nothing anywhere else.
 *   - SINGLE BODY READ: one clone per response, dispatched to every
 *     subscriber — the two-vault double-read on instagram is the exact
 *     failure this replaces. 4 MB read cap (Blob2URL's wire limit).
 *   - FINGERPRINT MASKING: name, length AND toString() of every wrapped
 *     native report the native source (D1-grade — v2 masked toString
 *     only; the defuser facades this replaces kept all three).
 *   - ISOLATION: a throwing subscriber can never break the host page or
 *     its siblings (scoped console.debug, GUP D6 deliberate interception).
 *   - VERSIONED SLOT: `__4NDR0_NET__` on the realm — highest version
 *     wins, never overwritten; the second suite script reuses the first's
 *     wraps through the slot (cross-script memory is the documented interop
 *     exception, same class as window.jQuery/GM_info). A stale slot is
 *     replaced by a newer full-channel hub (older wraps remain chained
 *     underneath for that transitional co-install generation).
 *
 *
 * v5 (suite v1.4.8) — PRIVILEGED TRANSPORT. gmFetch joins the api: a
 *   Promise-wrapped GM_xmlhttpRequest with a hard timeout (default 15 s),
 *   transient-only bounded retry (timeouts and transport faults re-fire
 *   with linear backoff; HTTP status verdicts never do — they are logic
 *   answers, not transient faults), settle-once semantics (a manager that
 *   fires two callbacks cannot double-resolve), and the typed NetError
 *   taxonomy (kinds: timeout | http | transport | abort | gm-unavailable).
 *   Restored from the v1.0.0-era kernel, which carried it with zero
 *   consumers until the v1.4.3 dead-code sweep removed it; GooglePhotosandDrive++'s
 *   Drive true-direct resolution (suite v1.4.8) is the first v5 consumer.
 *   The transport is FEATURE-DETECTED (GM_xmlhttpRequest, then GM.xmlHttpRequest):
 *   a consumer without the grant gets a typed gm-unavailable rejection —
 *   never a ReferenceError — so the eleven existing consumers that grant
 *   nothing of the sort are unaffected. gmFetch is served by each copy's
 *   own module closure (it owns no realm state and wraps nothing), so a
 *   co-installed hub owner change never re-routes it; isFullHub grows the
 *   gmFetch surface so a v5 copy only delegates subscriptions to a v5
 *   slot owner (a v4 owner keeps serving its own subscribers through the
 *   chain while the v5 copy arms above it — the established transitional
 *   co-install progression).
 *
 * Consumed via build-time injection into the canon scripts that declare it
 * (tools/build.mjs CANON_KERNEL) — the identifier `__4NDR0_NET_API__` below
 * is script-scope visible to the consumer's IIFE.
 * ═══════════════════════════════════════════════════════════════════════════ */
const __4NDR0_NET_API__ = (function () {
    'use strict';

    const SLOT = '__4NDR0_NET__';
    const VERSION = 5;
    const MAX_SUBS = 32;            /* bounded registry (GUP B.1) */
    const MAX_BODY = 4000000;       /* 4 MB read cap (Blob2URL's wire limit) */
    const XHR_MOCK_DELAY = 40;      /* D6 cadence — mocked XHR responses deliver
                                     * on 40 ms timers so async call sites behave
                                     * exactly as they would against the real
                                     * (hostile) endpoint */

    /* ── v5: typed transport errors ─────────────────────────────────────
     * gmFetch rejects with these — never a bare string, never a generic
     * Error. `kind` is the machine-branchable axis (timeout | http |
     * transport | abort | gm-unavailable); `url` and, for http, `status`
     * ride along so a consumer can log the full verdict. */
    class NetError extends Error {
        constructor(message, meta) {
            super(message);
            this.name = 'NetError';
            try {
                this.url = meta && meta.url;
                this.status = meta && meta.status;
                this.kind = (meta && meta.kind) || 'transport';
            } catch (e) { /* exotic meta — defaults stand */ }
        }
    }
    class NetTimeoutError extends NetError {
        constructor(url, ms) {
            super('gmFetch timeout after ' + ms + 'ms: ' + url, { url: url, kind: 'timeout' });
            this.name = 'NetTimeoutError';
        }
    }
    class NetHttpError extends NetError {
        constructor(url, status, statusText) {
            super('HTTP ' + status + ' ' + (statusText || '') + ' — ' + url,
                { url: url, status: status, kind: 'http' });
            this.name = 'NetHttpError';
        }
    }

    /* The privileged transport — GM_xmlhttpRequest in managers that expose
     * the grant, GM.xmlHttpRequest in the GM.* world, null where neither
     * is granted (the typed gm-unavailable rejection answers that case). */
    function gmTransport() {
        try { if (typeof GM_xmlhttpRequest === 'function') return GM_xmlhttpRequest; }
        catch (e) { /* grant absent — ReferenceError caught, not thrown */ }
        try {
            if (typeof GM === 'object' && GM && typeof GM.xmlHttpRequest === 'function')
                return GM.xmlHttpRequest;
        } catch (e2) { /* sandbox sealed GM away */ }
        return null;
    }

    function gmSleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* ── v5: gmFetch — privileged GET/POST with a hard timeout and
     * transient-only bounded retry. Settle-once: a manager firing two
     * callbacks (onload AND onerror, a known Violentmonkey-on-CORS shape)
     * resolves exactly once. checkStatus (default true) turns non-2xx
     * into NetHttpError rejections; opts.checkStatus === false hands the
     * raw response to the caller for verdict-by-status use (the Drive
     * resolver walks both a 200 interstitial and redirect-final URLs).
     * responseType is normalized to the portable set ('text' default). */
    function gmFetch(url, opts) {
        opts = opts || {};
        const method = opts.method || 'GET';
        const headers = opts.headers || {};
        const data = opts.data != null ? opts.data : null;
        const timeout = Math.max(1, opts.timeout || 15000);
        const retries = Math.max(0, Math.min(opts.retries || 0, 3));
        const responseType = (opts.responseType === 'json' || opts.responseType === 'arraybuffer' ||
            opts.responseType === 'blob') ? opts.responseType : 'text';
        const checkStatus = opts.checkStatus !== false;

        const transport = gmTransport();
        if (!transport) {
            /* The grant name lives in the header comment (comment text is
             * inert); the message stays free of bare manager identifiers
             * so the inventory grant scanner sees only the two sanctioned
             * detection shapes in this module. */
            return Promise.reject(new NetError(
                'gmFetch unavailable: no privileged transport granted in this consumer',
                { url: url, kind: 'gm-unavailable' }));
        }

        function attempt() {
            return new Promise(function (resolve, reject) {
                let settled = false;
                const done = function (fn, arg) { if (!settled) { settled = true; fn(arg); } };
                const req = {
                    method: method, url: url, headers: headers, data: data,
                    timeout: timeout, responseType: responseType,
                    onload: function (r) {
                        if (checkStatus && (r.status < 200 || r.status >= 400))
                            done(reject, new NetHttpError(url, r.status, r.statusText));
                        else done(resolve, r);
                    },
                    onerror: function () { done(reject, new NetError('network error', { url: url, kind: 'transport' })); },
                    ontimeout: function () { done(reject, new NetTimeoutError(url, timeout)); },
                    onabort: function () { done(reject, new NetError('aborted', { url: url, kind: 'abort' })); },
                };
                try { transport(req); }
                catch (e) { done(reject, new NetError('dispatch failed: ' + ((e && e.message) || e), { url: url, kind: 'transport' })); }
            });
        }

        return (async function () {
            let lastErr = null;
            for (let n = 0; n <= retries; n++) {
                try { return await attempt(); }
                catch (e) {
                    lastErr = e;
                    const transient = e instanceof NetTimeoutError || (e && e.kind === 'transport');
                    if (!transient || n >= retries) throw e;
                    await gmSleep(300 * (n + 1));
                }
            }
            throw lastErr;
        })();
    }

    function realm() {
        try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow; } catch (e) { /* sandboxed away */ }
        try { if (typeof window !== 'undefined' && window) return window; } catch (e) { /* no DOM */ }
        return null;
    }

    const subs = new Map();         /* onBody observers: key -> fn(text) */
    const reqSubs = new Map();      /* onRequest defusers: key -> fn(req) */
    const trafficSubs = new Map();  /* onTraffic observers: key -> fn(ev) */
    const errSubs = new Map();      /* onError recoverers: key -> fn(ev) */
    const served = (typeof WeakSet === 'function') ? new WeakSet() : null; /* propagate-armed realms */
    let seq = 0;
    let rseq = 0;
    let tseq = 0;
    let eseq = 0;
    let trafficSeq = 0;             /* request ids for phase correlation */

    function dispatch(text) {
        for (const [, fn] of subs) {
            try { fn(text); }
            catch (e) { console.debug('[a4/net] subscriber failed:', (e && e.message) || e); }
        }
    }

    function dispatchTraffic(ev) {
        for (const [, fn] of trafficSubs) {
            try { fn(ev); }
            catch (e) { console.debug('[a4/net] traffic subscriber failed:', (e && e.message) || e); }
        }
    }

    /* Request-time consult. Returns the first decisive verdict or null;
     * body rewrites are applied onto the req object in place so later
     * subscribers (and the wrap, afterwards) observe them. */
    function consult(req) {
        for (const [, fn] of reqSubs) {
            let v = null;
            try { v = fn(req); }
            catch (e) { console.debug('[a4/net] request subscriber failed:', (e && e.message) || e); }
            if (!v || typeof v !== 'object') continue;
            if (v.veto) return { veto: true };
            if (v.respond && typeof v.respond === 'object') return { respond: v.respond };
            if ('body' in v) req.body = v.body;
        }
        return null;
    }

    /* Failure-time consult (fetch only). A subscriber may return
     * { respond: {...} } to pacify a REAL network failure; hub vetoes
     * never reach here (final by design — see the v4 header contract). */
    function consultError(ev) {
        for (const [, fn] of errSubs) {
            let v = null;
            try { v = fn(ev); }
            catch (e) { console.debug('[a4/net] error subscriber failed:', (e && e.message) || e); }
            if (v && typeof v === 'object' && v.respond && typeof v.respond === 'object') {
                return { respond: v.respond };
            }
        }
        return null;
    }

    /* D1-grade masking: the wrapped native keeps its name, length and
     * source string (hook-detection parity with the Proxy facades this
     * module replaced). */
    function maskNative(wrapped, orig) {
        try { Object.defineProperty(wrapped, 'name', { value: orig.name, configurable: true }); } catch (e) { /* frozen */ }
        try { Object.defineProperty(wrapped, 'length', { value: orig.length, configurable: true }); } catch (e) { /* frozen */ }
        try { wrapped.toString = function () { return String(orig); }; } catch (e) { /* frozen fn */ }
    }

    /* v4 versioned arm mark. The number lets a newer hub chain ABOVE an
     * older generation's wraps (transitional co-install) while leaving
     * same-or-newer marks alone. Legacy v2/v3 marks are the boolean true,
     * which compares as older than every number — exactly the chaining
     * decision the transitional window needs. */
    function markVer(fn) {
        try { Object.defineProperty(fn, '__4ndro_net', { value: VERSION, configurable: true }); }
        catch (e) { try { fn.__4ndro_net = VERSION; } catch (e2) { /* frozen */ } }
    }

    function markOwn(obj) {
        try { Object.defineProperty(obj, '__4ndro_net', { value: VERSION, configurable: true }); }
        catch (e) { try { obj.__4ndro_net = VERSION; } catch (e2) { /* locked */ } }
    }

    /* True when the existing arm mark belongs to a same-or-newer hub
     * generation — the one case where arming must be skipped. */
    function markIsCurrent(m) {
        return typeof m === 'number' && m >= VERSION;
    }

    function fire(xhr, type) {
        try {
            const h = xhr['on' + type];
            if (typeof h === 'function') { try { h.call(xhr, { type: type }); } catch (e) { /* page handler */ } }
        } catch (e) { /* property read locked */ }
        try {
            if (typeof xhr.dispatchEvent === 'function' && typeof Event === 'function') {
                xhr.dispatchEvent(new Event(type));
            }
        } catch (e) { /* exotic realm */ }
    }

    /* Synthetic Response builder — the phantom surface shared by the
     * respond verdict and the onError pacification path. Null-body
     * statuses (204/205/304) are constructed with a null body — the
     * browser Response constructor THROWS on a non-null body with a
     * null-body status (the live Recon smoke caught the first draft
     * passing '' for the 204 pacification and degrading to a veto).
     * Returns null when the realm has no usable Response constructor
     * (callers degrade to a hard cancel — a defused request must never
     * leak to the network). */
    function synthesize(r) {
        try {
            const status = r.status || 200;
            const nullBody = status === 204 || status === 205 || status === 304;
            const opts = { status: status, statusText: r.statusText || 'OK' };
            if (r.contentType) opts.headers = { 'Content-Type': r.contentType };
            return new Response(nullBody ? null : (r.body != null ? r.body : ''), opts);
        } catch (e) { return null; }
    }

    /* Mocked XHR delivery — D6: full response surface on the 40 ms
     * cadence, responseType 'json' parsed; readystatechange/load/loadend
     * all fire (property handlers AND events). The mocked body is fanned
     * to onBody observers under the standard cap, and to onTraffic with
     * source 'respond' (phantom parity with the real exchange surface). */
    function scheduleXhrMock(xhr, r, meta) {
        setTimeout(function () {
            try {
                const bodyStr = r.body != null ? String(r.body) : '';
                const status = r.status || 200;
                const def = function (prop, value) {
                    try { Object.defineProperty(xhr, prop, { value: value, configurable: true }); }
                    catch (e) { /* sealed instance — native getters win */ }
                };
                def('readyState', 4);
                def('status', status);
                def('statusText', r.statusText || 'OK');
                def('responseText', bodyStr);
                let resp = bodyStr;
                if (xhr.responseType === 'json' && bodyStr) {
                    try { resp = JSON.parse(bodyStr); } catch (e) { /* keep the string */ }
                }
                def('response', resp);
                def('responseURL', meta ? meta.url || '' : '');
                if (r.contentType) {
                    try { xhr.getAllResponseHeaders = function () { return 'content-type: ' + r.contentType + '\r\n'; }; }
                    catch (e) { /* locked */ }
                }
                fire(xhr, 'readystatechange');
                fire(xhr, 'load');
                fire(xhr, 'loadend');
                if (bodyStr && bodyStr.length <= MAX_BODY) dispatch(bodyStr);
                if (trafficSubs.size) {
                    dispatchTraffic({
                        id: meta ? meta.id : 0, url: meta ? meta.url || '' : '', method: meta ? meta.method || 'GET' : 'GET',
                        kind: 'xhr', phase: 'response', body: bodyStr.slice(0, MAX_BODY), status: status,
                        contentType: r.contentType || null, responseType: xhr.responseType || '',
                        truncated: bodyStr.length > MAX_BODY, source: 'respond',
                    });
                }
            } catch (e) { console.debug('[a4/net] xhr mock delivery failed:', (e && e.message) || e); }
        }, XHR_MOCK_DELAY);
    }

    /* Cancelled XHR — native network-failure surface at status 0. */
    function scheduleXhrError(xhr, meta, source) {
        setTimeout(function () {
            try {
                const def = function (prop, value) {
                    try { Object.defineProperty(xhr, prop, { value: value, configurable: true }); }
                    catch (e) { /* sealed instance */ }
                };
                def('readyState', 4);
                def('status', 0);
                def('statusText', '');
                fire(xhr, 'readystatechange');
                fire(xhr, 'error');
                fire(xhr, 'loadend');
                if (trafficSubs.size) {
                    dispatchTraffic({
                        id: meta ? meta.id : 0, url: meta ? meta.url || '' : '', method: meta ? meta.method || 'GET' : 'GET',
                        kind: 'xhr', phase: 'error', source: source || 'veto',
                        errorName: 'Error', errorMessage: 'XHR failed',
                    });
                }
            } catch (e) { console.debug('[a4/net] xhr error delivery failed:', (e && e.message) || e); }
        }, 0);
    }

    /* Bounded body read (v4). Reads the CLONE's stream incrementally with
     * early cancel at MAX_BODY when a reader is available; falls back to
     * clone().text() for exotic realms. Dispatches:
     *   - onBody (text) when the response is ok and the body is within
     *     the cap — byte-stable with the v2/v3 contract;
     *   - onTraffic (response phase) for EVERY status — the forensic
     *     channel — with a truncated flag when the cap tripped.
     * A read that fails or overflows silently degrades (the v2
     * body-unreadable contract); truncation never breaks the caller. */
    function readCapped(res, meta) {
        const finish = function (text, truncated) {
            try {
                if (!truncated && res.ok && typeof text === 'string' && text) dispatch(text);
                if (trafficSubs.size) {
                    let ct = null;
                    try {
                        if (res.headers && typeof res.headers.get === 'function') ct = res.headers.get('content-type');
                    } catch (e) { /* header read locked */ }
                    dispatchTraffic({
                        id: meta.id, url: meta.url, method: meta.method, kind: 'fetch',
                        phase: 'response', body: typeof text === 'string' ? text.slice(0, MAX_BODY) : '',
                        status: (function () { try { return res.status; } catch (e) { return 0; } })(),
                        contentType: ct, truncated: !!truncated, source: 'network',
                    });
                }
            } catch (e) { /* hostile response surface */ }
        };
        try {
            const clone = (typeof res.clone === 'function') ? res.clone() : null;
            if (!clone) return;
            if (clone.body && typeof clone.body.getReader === 'function' && typeof TextDecoder === 'function') {
                const reader = clone.body.getReader();
                const dec = new TextDecoder();
                let text = '';
                let bytes = 0;
                let truncated = false;
                const step = function () {
                    return reader.read().then(function (r) {
                        if (r.done) return null;
                        const chunk = r.value;
                        text += dec.decode(chunk, { stream: true });
                        bytes += (chunk && chunk.byteLength) || 0;
                        if (bytes > MAX_BODY) {
                            truncated = true;
                            try { return reader.cancel().then(function () { return null; }); }
                            catch (e) { return null; }
                        }
                        return step();
                    });
                };
                step().then(function () {
                    text += dec.decode();
                    finish(text, truncated || text.length > MAX_BODY);
                }).catch(function () { /* body stream failed mid-read */ });
                return;
            }
            clone.text().then(function (t) {
                finish(t, typeof t === 'string' && t.length > MAX_BODY);
            }).catch(function () { /* body unreadable */ });
        } catch (e) { /* exotic clone surface */ }
    }

    function armRealm(target) {
        /* fetch — one wrap: request consult first, body tee after */
        try {
            const origFetch = target.fetch;
            let priorMark;
            try { priorMark = origFetch ? origFetch.__4ndro_net : undefined; } catch (e) { priorMark = undefined; }
            if (typeof origFetch === 'function' && !markIsCurrent(priorMark)) {
                const wrapped = function () {
                    try {
                        if (reqSubs.size || subs.size || trafficSubs.size || errSubs.size) {
                            let url = '', method = 'GET', body = null;
                            const a0 = arguments[0];
                            if (typeof a0 === 'string') url = a0;
                            else if (a0 && typeof a0 === 'object') {
                                if (typeof a0.url === 'string') {
                                    url = a0.url;
                                    method = String(a0.method || 'GET').toUpperCase() || 'GET';
                                    if (a0.body != null) body = a0.body;
                                } else { try { url = String(a0); } catch (e) { url = ''; } }
                            } else if (a0 != null) { url = String(a0); }
                            const init = arguments[1];
                            if (init && typeof init === 'object') {
                                if (init.method) method = String(init.method).toUpperCase() || method;
                                if (init.body != null) body = init.body;
                            }
                            const meta = { id: ++trafficSeq, url: url, method: method, kind: 'fetch' };
                            const req = { url: url, method: method, kind: 'fetch', body: body };
                            const verdict = consult(req);
                            if (verdict) {
                                if (verdict.veto) {
                                    dispatchTraffic({ id: meta.id, url: url, method: method, kind: 'fetch', phase: 'error', source: 'veto', errorName: 'TypeError', errorMessage: 'Failed to fetch' });
                                    return Promise.reject(new TypeError('Failed to fetch'));
                                }
                                if (verdict.respond) {
                                    const r = verdict.respond;
                                    const res = synthesize(r);
                                    if (res) {
                                        if (subs.size && typeof res.clone === 'function') {
                                            res.clone().text().then(function (t) {
                                                if (typeof t === 'string' && t && t.length <= MAX_BODY) dispatch(t);
                                            }).catch(function () { /* synthetic body unreadable */ });
                                        }
                                        if (trafficSubs.size) {
                                            dispatchTraffic({
                                                id: meta.id, url: url, method: method, kind: 'fetch', phase: 'response',
                                                body: r.body != null ? String(r.body).slice(0, MAX_BODY) : '',
                                                status: r.status || 200, contentType: r.contentType || null,
                                                truncated: false, source: 'respond',
                                            });
                                        }
                                        return Promise.resolve(res);
                                    }
                                    /* Response unavailable in this realm — a
                                     * vetoed request must never leak to the
                                     * network; degrade to a hard cancel. */
                                    dispatchTraffic({ id: meta.id, url: url, method: method, kind: 'fetch', phase: 'error', source: 'veto', errorName: 'TypeError', errorMessage: 'Failed to fetch' });
                                    return Promise.reject(new TypeError('Failed to fetch'));
                                }
                            }
                            /* No decisive verdict — the exchange is real: the
                             * complete request event fires (body may be null;
                             * subscribers apply policy), then the tee. */
                            dispatchTraffic({ id: meta.id, url: url, method: method, kind: 'fetch', phase: 'request', body: body });
                            /* body rewrite — only the init.body path is
                             * rewritable (Request objects are immutable; the
                             * per-script facades had the same boundary). A
                             * shallow init copy keeps the caller's object
                             * untouched (the v1.4.4-and-older facades mutated
                             * it in place). */
                            if (init && typeof init === 'object' && init.body != null && req.body !== init.body) {
                                return tee(origFetch.call(this, arguments[0], Object.assign({}, init, { body: req.body })), meta);
                            }
                            return tee(origFetch.apply(this, arguments), meta);
                        }
                    } catch (e) { /* hostile args — defusing must never break the page */ }
                    return tee(origFetch.apply(this, arguments), null);
                };
                maskNative(wrapped, origFetch);
                markVer(wrapped);
                target.fetch = wrapped;
            }
        } catch (e) { console.debug('[a4/net] fetch arm skipped:', (e && e.message) || e); }

        /* XHR — open stashes method/url per instance, send consults */
        try {
            const xo = target.XMLHttpRequest && target.XMLHttpRequest.prototype;
            let xoMark;
            try { xoMark = xo ? xo.__4ndro_net : undefined; } catch (e) { xoMark = undefined; }
            if (xo && typeof xo.send === 'function' && !markIsCurrent(xoMark)) {
                markOwn(xo);
                const origOpen = xo.open;
                if (typeof origOpen === 'function') {
                    const wrappedOpen = function (method, url) {
                        try {
                            const stash = { m: String(method || 'GET'), u: String(url || ''), id: 0 };
                            try {
                                Object.defineProperty(this, '__4ndro_req', { value: stash, configurable: true, writable: true, enumerable: false });
                            } catch (e) { this.__4ndro_req = stash; }
                        } catch (e) { /* non-compliant XHR shim */ }
                        return origOpen.apply(this, arguments);
                    };
                    maskNative(wrappedOpen, origOpen);
                    xo.open = wrappedOpen;
                }
                const origSend = xo.send;
                const wrappedSend = function () {
                    const anySubs = reqSubs.size || subs.size || trafficSubs.size || errSubs.size;
                    let meta = null;
                    try {
                        if (anySubs) {
                            const stash = this.__4ndro_req;
                            const body = arguments.length > 0 ? arguments[0] : null;
                            const rid = ++trafficSeq;
                            if (stash) { try { stash.id = rid; } catch (e) { /* frozen stash */ } }
                            meta = { id: rid, url: stash ? stash.u : '', method: stash ? stash.m : 'GET', kind: 'xhr' };
                            const req = { url: meta.url, method: meta.method, kind: 'xhr', body: body };
                            const verdict = consult(req);
                            if (verdict) {
                                if (verdict.veto) { scheduleXhrError(this, meta, 'veto'); return; }
                                if (verdict.respond) { scheduleXhrMock(this, verdict.respond, meta); return; }
                            }
                            if (arguments.length > 0 && req.body !== body) arguments[0] = req.body; /* fall through: the tee must still see rewritten sends */
                            dispatchTraffic({ id: rid, url: meta.url, method: meta.method, kind: 'xhr', phase: 'request', body: body });
                        }
                    } catch (e) { /* non-compliant XHR shim */ }
                    try {
                        if (anySubs) {
                            const xhr = this;
                            xhr.addEventListener('load', function () {
                                try {
                                    const stash = xhr.__4ndro_req;
                                    let url = '';
                                    try { url = xhr.responseURL || (stash ? stash.u : '') || ''; } catch (e) { url = stash ? stash.u : ''; }
                                    let t = '';
                                    if (xhr.responseType === '' || xhr.responseType === 'text') t = xhr.responseText;
                                    else if (xhr.responseType === 'json' && xhr.response) t = JSON.stringify(xhr.response);
                                    if (subs.size && t) dispatch(t);
                                    if (trafficSubs.size) {
                                        let status = 0; try { const s = xhr.status; if (typeof s === 'number') status = s; } catch (e) { /* locked */ }
                                        let ct = null;
                                        try { ct = (typeof xhr.getResponseHeader === 'function') ? xhr.getResponseHeader('content-type') : null; } catch (e) { /* locked */ }
                                        dispatchTraffic({
                                            id: stash ? stash.id : 0, url: url, method: stash ? stash.m : 'GET', kind: 'xhr',
                                            phase: 'response', body: t ? String(t).slice(0, MAX_BODY) : '',
                                            status: status, contentType: ct, responseType: xhr.responseType || '',
                                            truncated: false, source: 'network',
                                        });
                                    }
                                } catch (e) { /* responseType-locked body */ }
                            }, { once: true });
                            if (trafficSubs.size || errSubs.size) {
                                xhr.addEventListener('error', function () {
                                    const stash = xhr.__4ndro_req;
                                    dispatchTraffic({
                                        id: (stash && stash.id) || (meta ? meta.id : 0),
                                        url: (stash ? stash.u : '') || (meta ? meta.url : ''),
                                        method: (stash ? stash.m : 'GET') || (meta ? meta.method : 'GET'),
                                        kind: 'xhr', phase: 'error', source: 'network',
                                        errorName: 'Error', errorMessage: 'XHR failed',
                                    });
                                }, { once: true });
                            }
                        }
                    } catch (e) { /* non-compliant XHR shim */ }
                    return origSend.apply(this, arguments);
                };
                maskNative(wrappedSend, origSend);
                xo.send = wrappedSend;
            }
        } catch (e) { console.debug('[a4/net] xhr arm skipped:', (e && e.message) || e); }

        /* sendBeacon — veto/respond both swallow and report success (a
         * failed beacon makes pages retry over noisier channels); body
         * rewrites pass through; passed beacons surface a request event
         * (the complete-channel contract — beacons carry forensic signal
         * the observer family opted out of before the hub existed). */
        try {
            const nav = target.navigator;
            let bMark;
            try { bMark = (nav && nav.sendBeacon) ? nav.sendBeacon.__4ndro_net : undefined; } catch (e) { bMark = undefined; }
            if (nav && typeof nav.sendBeacon === 'function' && !markIsCurrent(bMark)) {
                const origBeacon = nav.sendBeacon;
                const wrappedBeacon = function () {
                    try {
                        if (reqSubs.size || trafficSubs.size) {
                            const req = { url: String(arguments[0] || ''), method: 'POST', kind: 'beacon', body: arguments.length > 1 ? arguments[1] : null };
                            if (consult(req)) return true;
                            if (trafficSubs.size) {
                                dispatchTraffic({ id: ++trafficSeq, url: req.url, method: 'POST', kind: 'beacon', phase: 'request', body: req.body });
                            }
                            if (arguments.length > 1 && req.body !== arguments[1]) {
                                return origBeacon.call(this, arguments[0], req.body);
                            }
                        }
                    } catch (e) { console.debug('[a4/net] beacon consult failed:', (e && e.message) || e); }
                    return origBeacon.apply(this, arguments);
                };
                maskNative(wrappedBeacon, origBeacon);
                markVer(wrappedBeacon);
                try { nav.sendBeacon = wrappedBeacon; } catch (e) { /* read-only navigator */ }
            }
        } catch (e) { console.debug('[a4/net] beacon arm skipped:', (e && e.message) || e); }
    }

    /* Body tee — the v2 single-read contract, extended (v4): the meta
     * threads the exchange id/url/method into readCapped, and a REAL
     * network failure consults the error recoverers — a pacifying
     * { respond } verdict replaces the rejection with a synthetic
     * response for the caller; hub vetoes never reach this path. */
    function tee(p, meta) {
        try {
            if (subs.size || trafficSubs.size || errSubs.size) {
                return p.then(function (res) {
                    if (res) readCapped(res, meta || { id: 0, url: '', method: 'GET', kind: 'fetch' });
                    return res;
                }, function (err) {
                    const name = (err && err.name) || 'Error';
                    const msg = (err && err.message) || String(err);
                    const m = meta || { id: 0, url: '', method: 'GET', kind: 'fetch' };
                    dispatchTraffic({ id: m.id, url: m.url, method: m.method, kind: 'fetch', phase: 'error', source: 'network', errorName: name, errorMessage: msg });
                    const fix = consultError({ id: m.id, url: m.url, method: m.method, kind: 'fetch', errorName: name, errorMessage: msg });
                    if (fix && fix.respond) {
                        const res = synthesize(fix.respond);
                        if (res) return res;
                    }
                    throw err;
                });
            }
        } catch (e) { /* exotic thenable */ }
        return p;
    }

    /* Full-channel surface check — a hub this copy may delegate to (or
     * leave owning the slot) must expose every v4 channel AND the v5
     * privileged transport (gmFetch). */
    function isFullHub(h) {
        return !!(h && typeof h.onBody === 'function' && typeof h.onRequest === 'function' &&
            typeof h.onTraffic === 'function' && typeof h.onError === 'function' &&
            typeof h.gmFetch === 'function');
    }

    /* Slot install — a strictly newer full-channel hub replaces the
     * slot; a same-version full hub is left alone (the caller already
     * delegated to it). */
    function installSlot(target) {
        try {
            const existing = target[SLOT];
            if (existing === api) return;
            if (existing && existing.version >= VERSION && isFullHub(existing)) return;
            Object.defineProperty(target, SLOT, {
                value: api, writable: false, enumerable: false, configurable: true,
            });
        } catch (e) { /* slot collision with a foreign script — local hub only */ }
    }

    const api = {
        version: VERSION,
        /* gmFetch(url, opts) -> Promise<{status, statusText, responseText,
         * responseHeaders, finalUrl, ...}>. Privileged GM transport with
         * hard timeout + transient-only bounded retry — see the v5 block
         * in the file header. Rejects with the typed NetError taxonomy
         * below (branch on .kind: timeout | http | transport | abort |
         * gm-unavailable). Served by this copy's own closure: never
         * re-routed to a co-installed hub owner (no realm state). */
        gmFetch: gmFetch,
        NetError: NetError,
        NetTimeoutError: NetTimeoutError,
        NetHttpError: NetHttpError,
        /* onBody(fn) -> unsubscribe. fn(text) receives every textual
         * response body captured in the page realm (ok fetch responses +
         * XHR text/json loads, real AND phantom), read once per response,
         * capped at 4 MB. A throwing subscriber is isolated — never
         * page-fatal.
         *
         * HUB DELEGATION: every script inlines its own copy of this
         * module, so module-local state would double-wrap the realm when
         * two consumers co-install. The first consumer to register
         * installs its api into the realm slot and therefore OWNS the
         * wraps; every later copy sees the slot here and delegates its
         * subscriptions to that hub — exactly one wrap set per realm,
         * no matter how many suite scripts carry the module. */
        onBody: function (fn) {
            if (typeof fn !== 'function') return function () {};
            const target = realm();
            if (target) {
                try {
                    const hub = target[SLOT];
                    if (hub && hub !== api && hub.version >= VERSION && isFullHub(hub)) {
                        return hub.onBody(fn);
                    }
                } catch (e) { /* unreadable slot — fall through to local hub */ }
            }
            if (subs.size >= MAX_SUBS) return function () {};
            const key = 'nb' + (++seq);
            subs.set(key, fn);
            if (target) {
                armRealm(target);
                installSlot(target);
            }
            return function () { subs.delete(key); };
        },
        /* onRequest(fn) -> unsubscribe. Request-time defusal — see the
         * v3 contract in the file header. Same hub-delegation rule as
         * onBody: the realm-slot owner serves every co-installed copy. */
        onRequest: function (fn) {
            if (typeof fn !== 'function') return function () {};
            const target = realm();
            if (target) {
                try {
                    const hub = target[SLOT];
                    if (hub && hub !== api && hub.version >= VERSION && isFullHub(hub)) {
                        return hub.onRequest(fn);
                    }
                } catch (e) { /* unreadable slot — fall through to local hub */ }
            }
            if (reqSubs.size >= MAX_SUBS) return function () {};
            const key = 'rq' + (++rseq);
            reqSubs.set(key, fn);
            if (target) {
                armRealm(target);
                installSlot(target);
            }
            return function () { reqSubs.delete(key); };
        },
        /* onTraffic(fn) -> unsubscribe. The structured observer channel —
         * see the v4 contract in the file header: complete request/
         * response/error events with phase-correlating ids, every fetch
         * status, phantom parity, truncated bodies flagged. Policy
         * belongs to subscribers; the hub reports what happened. */
        onTraffic: function (fn) {
            if (typeof fn !== 'function') return function () {};
            const target = realm();
            if (target) {
                try {
                    const hub = target[SLOT];
                    if (hub && hub !== api && hub.version >= VERSION && isFullHub(hub)) {
                        return hub.onTraffic(fn);
                    }
                } catch (e) { /* unreadable slot — fall through to local hub */ }
            }
            if (trafficSubs.size >= MAX_SUBS) return function () {};
            const key = 'tf' + (++tseq);
            trafficSubs.set(key, fn);
            if (target) {
                armRealm(target);
                installSlot(target);
            }
            return function () { trafficSubs.delete(key); };
        },
        /* onError(fn) -> unsubscribe. Failure-time recovery, fetch-only —
         * see the v4 contract in the file header. fn(ev) may return
         * { respond: {...} } to pacify a REAL network failure into a
         * phantom response; hub vetoes are final and never consult
         * recoverers. */
        onError: function (fn) {
            if (typeof fn !== 'function') return function () {};
            const target = realm();
            if (target) {
                try {
                    const hub = target[SLOT];
                    if (hub && hub !== api && hub.version >= VERSION && isFullHub(hub)) {
                        return hub.onError(fn);
                    }
                } catch (e) { /* unreadable slot — fall through to local hub */ }
            }
            if (errSubs.size >= MAX_SUBS) return function () {};
            const key = 'er' + (++eseq);
            errSubs.set(key, fn);
            if (target) {
                armRealm(target);
                installSlot(target);
            }
            return function () { errSubs.delete(key); };
        },
        /* propagate(target) -> armed. Arm the wrap set into an additional
         * realm (iframe propagation, or the userscript sandbox realm for
         * scripts that historically hooked both contexts). Idempotent
         * per target; a realm whose slot is owned by an equal-or-newer
         * full hub is left to that owner. Cross-origin targets are
         * safely inert (every step is guarded). Subscriptions are shared
         * across every realm this module's hub armed. */
        propagate: function (target) {
            try {
                if (!target || typeof target !== 'object') return false;
                /* Defer to the owner of OUR realm when we delegated our
                 * subscriptions to it: the owner's registries (which carry
                 * our subscriber) must serve the new realm, and the owner's
                 * propagate installs its own api as the target's slot so
                 * later copies delegate correctly. */
                const home = realm();
                if (home && home !== target) {
                    try {
                        const owner = home[SLOT];
                        if (owner && owner !== api && owner.version >= VERSION && isFullHub(owner) &&
                            typeof owner.propagate === 'function') {
                            return owner.propagate(target);
                        }
                    } catch (e) { /* unreadable — arm ourselves */ }
                }
                try {
                    const existing = target[SLOT];
                    if (existing && existing !== api && existing.version >= VERSION && isFullHub(existing)) return false;
                } catch (e) { /* unreadable — continue to arm */ }
                if (served && served.has(target)) return false; /* this hub already armed it */
                armRealm(target);
                installSlot(target);
                if (served) served.add(target);
                return true;
            } catch (e) { console.debug('[a4/net] propagate skipped:', (e && e.message) || e); return false; }
        },
        get subscriberCount() { return subs.size; },
        get requestSubscriberCount() { return reqSubs.size; },
        get trafficSubscriberCount() { return trafficSubs.size; },
        get errorSubscriberCount() { return errSubs.size; },
    };
    return api;
})();

// 5.0.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.


/* ═══ SUITE PROMOTION 5.0.0 ═══════════════════════════════════════════
 * m3u8++BETA v4.5 promoted: G1–G10 GUP gap-mitigation set + magnet-play relays are a strict superset of stable v4.4 (verified by diff + embedded changelog).
 * Retired duplicate: 4ndr0tools - m3u8++.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

/*
 * CHANGELOG v4.5 (GUP v5.3 audit — stepwise gap mitigation, superset over v4.4):
 *  G1  doM3U: resolve XHR-supplied relative and root-relative playlist URLs against
 *      location.href — previously threw "Invalid URL" (unhandled rejection) and silently
 *      dropped those playlists from the aggregator.
 *  G2  doM3U: fire-and-forget async capture now resolves internally (scoped console.debug)
 *      and the content-fetch fallback carries a 15s AbortController timeout.
 *  G3  doM3U: explicit typeof guard + one-time console.warn when the m3u8-parser @require
 *      failed to load, instead of a silent ReferenceError per capture.
 *  G4  thatwind proxy: GM_xmlhttpRequest transport now carries a hard 300s timeout plus
 *      ontimeout/onabort rejection handlers — the proxied fetch() promise can no longer
 *      hang forever.
 *  G5  thatwind proxy: synthetic Response gains .ok and .json() (fetch-compat surface).
 *  G6  mgmapi.message: optional type parameter ("success"/"error" accent border) — the
 *      "Link copied" call site already passed 'success', which was silently discarded.
 *  G7  mgmapi.download: openInTab fallback branch now returns the tab handle.
 *  G8  showVideo: all runtime interpolations into the item template are HTML-escaped
 *      (defense-in-depth; display byte-identical for normal URLs).
 *  G9  mgmapi.copyText: guarded host (document.body may be null at document-start).
 *  G10 XHR sniff interceptor: empty catch replaced with scoped console.debug logging.
 */

(function () {
    'use strict';

    /* [R3 createElement migration — suite v1.4.4] The Ψ glyph is built
     * through createElementNS (was a string SVG inside the bar template and
     * the play button). TT-immune by construction. */
    function buildPsiGlyph() {
        const NS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 128 128");
        svg.setAttribute("xmlns", NS);
        svg.setAttribute("style", "width: 100%; height: 100%;");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "var(--accent-cyan, #00E5FF)");
        svg.setAttribute("stroke-width", "3");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        const ring1 = document.createElementNS(NS, "path");
        ring1.setAttribute("class", "glyph-ring-1");
        ring1.setAttribute("d", "M 64,12 A 52,52 0 1 1 63.9,12 Z");
        ring1.setAttribute("stroke-dasharray", "21.78 21.78");
        ring1.setAttribute("stroke-width", "2");
        const ring2 = document.createElementNS(NS, "path");
        ring2.setAttribute("class", "glyph-ring-2");
        ring2.setAttribute("d", "M 64,20 A 44,44 0 1 1 63.9,20 Z");
        ring2.setAttribute("stroke-dasharray", "10 10");
        ring2.setAttribute("stroke-width", "1.5");
        ring2.setAttribute("opacity", "0.7");
        const hex = document.createElementNS(NS, "path");
        hex.setAttribute("class", "glyph-hex");
        hex.setAttribute("d", "M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z");
        const psi = document.createElementNS(NS, "text");
        psi.setAttribute("x", "64");
        psi.setAttribute("y", "67");
        psi.setAttribute("text-anchor", "middle");
        psi.setAttribute("dominant-baseline", "middle");
        psi.setAttribute("fill", "var(--accent-cyan, #00E5FF)");
        psi.setAttribute("stroke", "none");
        psi.setAttribute("font-size", "56");
        psi.setAttribute("font-weight", "700");
        psi.setAttribute("font-family", "'Cinzel Decorative', serif");
        psi.textContent = "Ψ";
        svg.append(ring1, ring2, hex, psi);
        return svg;
    }

    const mgmapi = {
        addStyle(s) {
            let style = document.createElement("style");
            style.textContent = s;
            document.documentElement.appendChild(style);
        },
        async getValue(name, defaultVal) {
            return await ((typeof GM_getValue === "function") ? GM_getValue : GM.getValue)(name, defaultVal);
        },
        async setValue(name, value) {
            return await ((typeof GM_setValue === "function") ? GM_setValue : GM.setValue)(name, value);
        },
        async deleteValue(name) {
            return await ((typeof GM_deleteValue === "function") ? GM_deleteValue : GM.deleteValue)(name);
        },
        openInTab(url, open_in_background = false) {
            return ((typeof GM_openInTab === "function") ? GM_openInTab : GM.openInTab)(url, open_in_background);
        },
        xmlHttpRequest(details) {
            return ((typeof GM_xmlhttpRequest === "function") ? GM_xmlhttpRequest : GM.xmlHttpRequest)(details);
        },
        download(details) {

            if (typeof GM_download === "function") {
                this.message("\nDownloading, pay attention to the browser's download pop-up.", 3000);
                return GM_download(details);
            } else {
                // G7 (audit v4.5): return the fallback result — the GM_download branch returns its
                // control object, so the openInTab branch must not silently swallow its handle.
                return this.openInTab(details.url);
            }
        },
        copyText(text) {
            copyTextToClipboard(text);
            function copyTextToClipboard(text) {
                var copyFrom = document.createElement("textarea");
                copyFrom.textContent = text;
                // G9 (audit v4.5): the script runs at document-start where document.body may be
                // null — mirror message()'s guarded host so clipboard fallback never throws on boot.
                const host = document.body || document.documentElement;
                host.appendChild(copyFrom);
                copyFrom.select();
                document.execCommand('copy');
                copyFrom.blur();
                host.removeChild(copyFrom);
            }
        },
        message(text, disappearTime = 5000, type = "info") {
            const id = "f8243rd238-gm-message-panel";
            let p = document.querySelector(`#${id}`);
            if (!p) {
                p = document.createElement("div");
                p.id = id;
                p.style = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: end;
                    z-index: 999999999999999;
                `;
                (document.body || document.documentElement).appendChild(p);
            }
            let mdiv = document.createElement("div");
            mdiv.innerText = text;
            mdiv.style = `
                padding: 3px 8px;
                border-radius: 5px;
                background: black;
                box-shadow: #000 1px 2px 5px;
                margin-top: 10px;
                font-size: small;
                color: #fff;
                text-align: right;
            `;
            // G6 (audit v4.5): the "Link copied" call site already passed a 'success' type that the
            // old signature silently discarded. Type is now consumed: success/error get an accent
            // border; every pre-existing 2-arg call renders byte-identically (default "info").
            if (type === "success") {
                mdiv.style.borderLeft = "3px solid #00E5FF";
            } else if (type === "error") {
                mdiv.style.borderLeft = "3px solid #ff0055";
            }
            p.appendChild(mdiv);
            setTimeout(() => {
                p.removeChild(mdiv);
            }, disappearTime);
        }
    };

    if (location.host === "tools.thatwind.com" || location.host === "localhost:3000") {
        mgmapi.addStyle("#userscript-tip{display:none !important;}");

        const _fetch = unsafeWindow.fetch;
        unsafeWindow.fetch = async function (...args) {
            try {
                let response = await _fetch(...args);
                if (response.status !== 200) throw new Error(response.status);
                return response;
            } catch (e) {
                if (args.length == 1) {
                    console.log(`Proxy request: ${args[0]}`);
                    return await new Promise((resolve, reject) => {
                        let referer = new URLSearchParams(location.hash.slice(1)).get("referer");
                        let headers = {};
                        if (referer) {
                            referer = new URL(referer);
                            headers = {
                                "origin": referer.origin,
                                "referer": referer.href
                            };
                        }
                        mgmapi.xmlHttpRequest({
                            method: "GET",
                            url: args[0],
                            responseType: 'arraybuffer',
                            headers,
                            // G4 (audit v4.5): hard timeout (D2/4.2) + terminal handlers for every
                            // transport outcome — previously a timed-out or aborted request left the
                            // proxied fetch() promise pending forever. 300s is deliberately generous
                            // because the webapp streams large media segments through this channel.
                            timeout: 300000,
                            onload(r) {
                                resolve({
                                    status: r.status,
                                    // G5 (audit v4.5): fetch-compat surface — .ok and .json() were
                                    // absent from the synthetic response, breaking webapp code that
                                    // branches on response.ok or parses JSON bodies.
                                    ok: r.status >= 200 && r.status < 300,
                                    headers: new Headers(r.responseHeaders.split("\n").filter(n => n).map(s => s.split(/:\s*/)).reduce((all, [a, b]) => { all[a] = b; return all; }, {})),
                                    async text() {
                                        return r.responseText;
                                    },
                                    async json() {
                                        return JSON.parse(r.responseText);
                                    },
                                    async arrayBuffer() {
                                        return r.response;
                                    }
                                });
                            },
                            onerror() {
                                reject(new Error());
                            },
                            ontimeout() {
                                reject(new Error("proxy request timed out"));
                            },
                            onabort() {
                                reject(new Error("proxy request aborted"));
                            }
                        });
                    });
                } else {
                    throw e;
                }
            }
        }

        return;
    }


    window.addEventListener("message", async (e) => {
        if (e.data === "3j4t9uj349-gm-get-title") {
            let name = `top-title-${Date.now()}`;
            await mgmapi.setValue(name, document.title);
            e.source.postMessage(`3j4t9uj349-gm-top-title-name:${name}`, "*");
        }
    });

    function getTopTitle() {
        return new Promise(resolve => {
            window.addEventListener("message", async function l(e) {
                if (typeof e.data === "string") {
                    if (e.data.startsWith("3j4t9uj349-gm-top-title-name:")) {
                        let name = e.data.slice("3j4t9uj349-gm-top-title-name:".length);
                        await new Promise(r => setTimeout(r, 5));
                        resolve(await mgmapi.getValue(name));
                        mgmapi.deleteValue(name);
                        window.removeEventListener("message", l);
                    }
                }
            });
            window.top.postMessage("3j4t9uj349-gm-get-title", "*");
        });
    }


    {
        // v5.1.0 (suite v1.4.7): the bespoke Response.prototype.text wrap and
        // the XHR open/send taps are retired; the m3u8 sniffer rides
        // kernel/net.js onTraffic response events — one shared page-realm
        // wrap per co-install, instead of a universal script patching
        // Response.text + XMLHttpRequest on every page it meets (the exact
        // stacking surface the v1.4.3 sink census measured).
        //
        // Superset notes (GUP):
        // · The baseline text-wrap only saw bodies the page READ via
        //   .text() — playlists consumed through arrayBuffer()/stream()
        //   (hls.js does exactly this) were invisible. The hub's response
        //   phase sees every settled fetch regardless of how (or whether)
        //   the page reads the body.
        // · XHR response events keep the baseline's open-time URL shape
        //   (ev.url), which doM3U's own G1 base resolution (new URL(url,
        //   location.href)) has always handled — the fetch path's given-URL
        //   shape is symmetric with it (the baseline XHR path was always
        //   pre-redirect too, and the thatwind downloader refetches
        //   server-side).
        // · responseType-locked XHRs (arraybuffer/blob) yield empty hub
        //   bodies and are skipped — the G10 deliberate-interception
        //   outcome, minus the throwing responseText read.
        // · Phantom (defuser-responded) bodies arrive with source 'respond'
        //   — the baseline text-wrap saw those same bodies whenever the
        //   page read them, so sniffing them is parity, not new surface.
        // · The dev-proxy fetch path above (tools.thatwind.com /
        //   localhost:3000) stays the script's own: it is a GM transport
        //   re-dispatcher (custom origin/referer headers, non-200
        //   re-proxy), not an observer — outside the hub's veto/phantom/
        //   observe scope, same adjudication as Recon's WebSocket bridge.
        function checkContent(content) {
            if (content.trim().startsWith("#EXTM3U")) {
                return true;
            }
        }

        __4NDR0_NET_API__.onTraffic((ev) => {
            if (ev.phase !== "response") return;
            try {
                const content = ev.body;
                if (content && checkContent(content)) {
                    doM3U({ url: ev.url || location.href, content });
                }
            } catch (e) {
                // G10 (audit v4.5): D6 deliberate-interception pattern — sniffing
                // failures must never break the host page, but they are logged for
                // diagnosis instead of being silently swallowed.
                console.debug("[m3u8++] traffic sniff skipped:", (e && e.message) || e);
            }
        });

        setInterval(doVideos, 1000);

    }

    const rootDiv = document.createElement("div");
    rootDiv.style = `
        position: fixed;
        z-index: 9999999999999999;
        opacity: 0.9;
    `;
    rootDiv.style.display = "none";
    document.documentElement.appendChild(rootDiv);

    const shadowDOM = rootDiv.attachShadow({ mode: 'open' });
    const wrapper = document.createElement("div");
    shadowDOM.appendChild(wrapper);


    const bar = document.createElement("div");
    bar.style = `
        text-align: right;
    `;
    const barSpan = document.createElement("span");
    barSpan.className = "number-indicator";
    barSpan.dataset.number = "0";
    barSpan.style.cssText = "display:inline-flex;width:50px;height:50px;background:transparent;padding:0;border-radius:100px;margin-bottom:5px;cursor:pointer;border:none;";
    barSpan.appendChild(buildPsiGlyph());
    bar.appendChild(barSpan);

    wrapper.appendChild(bar);

    const style = document.createElement("style");
    style.textContent = `
        .number-indicator{
            position:relative;
        }

        .number-indicator::after{
            content: attr(data-number);
            position: absolute;
            bottom: 0;
            right: 0;
            color: #00E5FF;
            font-size: 14px;
            font-weight: bold;
            background: rgba(10, 19, 26, 0.95);
            border-radius: 10px;
            padding: 3px 5px;
        }

        .copy-link:active{
            color: #67E8F9;
        }

        .download-btn:hover{
            text-decoration: underline;
        }
        .download-btn:active{
            opacity: 0.9;
        }

        .m3u8-item{
            color: white;
            margin-bottom: 5px;
            display: flex;
            flex-direction: row;
            background: black;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 14px;
            user-select: none;
        }

        [data-shown="false"] {
            opacity: 0.8;
            zoom: 0.8;
        }

        [data-shown="false"]:hover{
            opacity: 1;
        }

        [data-shown="false"] .m3u8-item{
            display: none;
        }

    `;

    wrapper.appendChild(style);

    const barBtn = bar.querySelector(".number-indicator");

    (async function () {

        let shown = await mgmapi.getValue("shown", true);
        wrapper.setAttribute("data-shown", shown);


        let x = await mgmapi.getValue("x", 10);
        let y = await mgmapi.getValue("y", 10);

        x = Math.min(innerWidth - 50, x);
        y = Math.min(innerHeight - 50, y);

        if (x < 0) x = 0;
        if (y < 0) y = 0;

        rootDiv.style.top = `${y}px`;
        rootDiv.style.right = `${x}px`;

        barBtn.addEventListener("mousedown", e => {
            let startX = e.pageX;
            let startY = e.pageY;

            let moved = false;

            let mousemove = e => {
                let offsetX = e.pageX - startX;
                let offsetY = e.pageY - startY;
                if (moved || (Math.abs(offsetX) + Math.abs(offsetY)) > 5) {
                    moved = true;
                    rootDiv.style.top = `${y + offsetY}px`;
                    rootDiv.style.right = `${x - offsetX}px`;
                }
            };
            let mouseup = e => {

                let offsetX = e.pageX - startX;
                let offsetY = e.pageY - startY;

                if (moved) {
                    x -= offsetX;
                    y += offsetY;
                    mgmapi.setValue("x", x);
                    mgmapi.setValue("y", y);
                } else {
                    shown = !shown;
                    mgmapi.setValue("shown", shown);
                    wrapper.setAttribute("data-shown", shown);
                }
                removeEventListener("mousemove", mousemove);
                removeEventListener("mouseup", mouseup);
            }
            addEventListener("mousemove", mousemove);
            addEventListener("mouseup", mouseup);
        });
    })();

    let count = 0;
    let shownUrls = [];

    function doVideos() {
        for (let v of Array.from(document.querySelectorAll("video"))) {
            if (v.duration && v.src && v.src.startsWith("http") && (!shownUrls.includes(v.src))) {
                const src = v.src;

                shownUrls.push(src);
                showVideo({
                    type: "video",
                    url: new URL(src),
                    duration: `${Math.ceil(v.duration * 10 / 60) / 10} mins`,
                    download() {
                        const details = {
                            url: src,
                            name: (() => {
                                let name = new URL(src).pathname.split("/").slice(-1)[0];
                                if (!/\.\w+$/.test(name)) {
                                    if (name.match(/^\s*$/)) name = Date.now();
                                    name = name + ".mp4";
                                }
                                return name;
                            })(),
                            headers: {
                                origin: location.origin
                            },
                            onerror(e) {
                                mgmapi.openInTab(src);
                            }
                        };
                        mgmapi.download(details);
                    }
                })
            }
        }
    }

    async function doM3U({ url, content }) {

        // G3 (audit v4.5): explicit failure surface if the m3u8-parser @require failed to load —
        // previously a silent ReferenceError killed every capture with no diagnostic.
        if (typeof m3u8Parser === "undefined") {
            console.warn("[m3u8++] m3u8-parser library unavailable (@require failed to load); m3u8 capture disabled.");
            return;
        }

        try {

            // G1 (audit v4.5): resolve against the document base — XHR open() receives relative
            // ("hls/x.m3u8") and root-relative ("/hls/x.m3u8") URLs, which previously threw
            // "Invalid URL" as unhandled rejections and silently dropped those playlists.
            url = new URL(url, location.href);

            if (shownUrls.includes(url.href)) return;

            // G2 (audit v4.5): network fallback now carries a hard timeout (D2) — previously an
            // unbounded fetch could hang the capture forever.
            if (!content) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 15000);
                try {
                    const response = await fetch(url, { signal: controller.signal });
                    content = await response.text();
                } finally {
                    clearTimeout(timer);
                }
            }

            const parser = new m3u8Parser.Parser();
            parser.push(content);
            parser.end();
            const manifest = parser.manifest;

            if (manifest.segments) {
                let duration = 0;
                manifest.segments.forEach((segment) => {
                    duration += segment.duration;
                });
                manifest.duration = duration;
            }

            showVideo({
                type: "M3u8 URL:",
                url,

                duration: manifest.duration ? `${Math.ceil(manifest.duration * 10 / 60) / 10} mins` : manifest.playlists ? `Streams(${manifest.playlists.length})` : "unknown",


                async download() {
                    mgmapi.openInTab(
                        `https://tools.thatwind.com/tool/m3u8downloader#${new URLSearchParams({
                            m3u8: url.href,
                            referer: location.href,
                            filename: (await getTopTitle()) || ""
                        })}`
                    );
                }
            })

        } catch (e) {
            // G2 (audit v4.5): scoped interceptor logging — doM3U is fire-and-forget at both sniff
            // call sites, so any failure must resolve here (never an unhandled rejection) while
            // remaining visible for diagnosis (D6 deliberate-interception pattern).
            console.debug("[m3u8++] m3u8 capture skipped:", (e && e.message) || e);
        }

    }

    // G8 (audit v4.5): HTML-escape every runtime value interpolated into the item template.
    // URL normalization already percent-encodes the dangerous characters for http(s) URLs, so this
    // is defense-in-depth for non-special-scheme or future call paths — display is byte-identical
    // for all normal URLs (verified by the A3/A5/A6/A7 exact-path assertions).
    const escapeHtml = (s) => String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    async function showVideo({
        type,
        url,
        duration,
        download
    }) {
        let div = document.createElement("div");
        div.className = "m3u8-item";
        const typeSpan = document.createElement("span");
        typeSpan.textContent = type;
        const copySpan = document.createElement("span");
        copySpan.className = "copy-link";
        copySpan.title = url.href;
        copySpan.style.cssText = "max-width:200px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;margin-left:10px;";
        copySpan.textContent = url.pathname;
        const durSpan = document.createElement("span");
        durSpan.style.cssText = "margin-left:10px;flex-grow:1;";
        durSpan.textContent = duration;
        const dlSpan = document.createElement("span");
        dlSpan.className = "download-btn";
        dlSpan.style.cssText = "margin-left:10px;cursor:pointer;";
        dlSpan.textContent = "[Download]";
        div.append(typeSpan, copySpan, durSpan, dlSpan);

        div.querySelector(".copy-link").addEventListener("click", () => {
            mgmapi.copyText(url.href);
            mgmapi.message("Link copied", 2000, 'success');
        });

        div.querySelector(".download-btn").addEventListener("click", download);

        rootDiv.style.display = "block";

        count++;

        shownUrls.push(url.href);

        bar.querySelector(".number-indicator").setAttribute("data-number", count);

        wrapper.appendChild(div);
    }

})();

(function () {
    'use strict';

    const reg = /magnet:\?xt=urn:btih:\w{10,}([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

    let l = "en";

    const T = {
        "en": {
            play: "Play"
        }
    }[l];

    whenDOMReady(() => {
        addStyle(`
            button[data-wtmzjk-mag-url]{
                all: initial;
                border: none;
                outline: none;
                background: none;
                background: #67E8F9;
                background: #00E5FF;
                margin: 2px 8px;
                border-radius: 3px;
                font-family: 'JetBrains Mono', monospace;
                color: white;
                cursor: pointer;
                display: inline-flex;
                height: 1.6em;
                padding: 0 .8em;
                align-items: center;
                justify-content: center;
                transition: background 150ms ease-in-out;
                text-decoration: none;
                border-radius: 0.8em;
                font-size: small;
            }
            button[data-wtmzjk-mag-url]>svg{
                height: 60%;
                fill: white;
                pointer-events: none;
            }
            button[data-wtmzjk-mag-url]:hover{
                background: #67E8F9;
                background: #67E8F9;
            }
            button[data-wtmzjk-mag-url]:active{
                background: #67E8F9;
                background: #67E8F9;
            }
            button[data-wtmzjk-mag-url]>span{
                pointer-events: none;
                font-size: small;margin-right: .5em;font-weight:bold;color:white !important;
            }
        `);
        window.addEventListener("click", onEvents, true);
        window.addEventListener("mousedown", onEvents, true);
        window.addEventListener("mouseup", onEvents, true);

        watchBodyChange(work);
    });

    function onEvents(e) {
        if (e.target.hasAttribute('data-wtmzjk-mag-url')) {
            e.preventDefault();
            e.stopPropagation();
            if (e.type == "click") {
                let a = document.createElement('a');
                a.href = 'https://www.diancigaoshou.com/#' + new URLSearchParams({ url: e.target.getAttribute('data-wtmzjk-mag-url') });
                a.target = "_blank";
                a.click();
            }
        }
    }



    function createWatchButton(url, isForPlain = false) {
        let button = document.createElement("button");
        button.setAttribute('data-wtmzjk-mag-url', url);
        if (isForPlain) button.setAttribute('data-wtmzjk-button-for-plain', '');
        const playLabel = document.createElement("span");
        playLabel.textContent = T.play;
        const faNS = "http://www.w3.org/2000/svg";
        const playIcon = document.createElementNS(faNS, "svg");
        playIcon.setAttribute("xmlns", faNS);
        playIcon.setAttribute("viewBox", "0 0 384 512");
        const playPath = document.createElementNS(faNS, "path");
        playPath.setAttribute("d", "M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z");
        playIcon.appendChild(playPath);
        button.append(playLabel, playIcon);
        return button;
    }

    function hasPlainMagUrlThatNotHandled() {
        let m = document.body.textContent.match(new RegExp(reg, 'g'));
        return document.querySelectorAll(`[data-wtmzjk-button-for-plain]`).length != (m ? m.length : 0);
    }

    function work() {
        if (!document.body) return;
        if (hasPlainMagUrlThatNotHandled()) {
            for (let node of getAllTextNodes(document.body)) {
                if (node.nextSibling && node.nextSibling.hasAttribute && node.nextSibling.hasAttribute('data-wtmzjk-mag-url')) continue;
                let text = node.nodeValue;
                if (!reg.test(text)) continue;
                let match = text.match(reg);
                if (match) {
                    let url = match[0];
                    let p = node.parentNode;
                    p.insertBefore(document.createTextNode(text.slice(0, match.index + url.length)), node);
                    p.insertBefore(createWatchButton(url, true), node);
                    p.insertBefore(document.createTextNode(text.slice(match.index + url.length)), node);
                    p.removeChild(node);
                }
            }
        }
        for (let a of Array.from(document.querySelectorAll(
            ['href', 'value', 'data-clipboard-text', 'data-value', 'title', 'alt', 'data-url', 'data-magnet', 'data-copy'].map(n => `[${n}*="magnet:?xt=urn:btih:"]`).join(',')
        ))) {
            if (a.nextSibling && a.nextSibling.hasAttribute && a.nextSibling.hasAttribute('data-wtmzjk-mag-url')) continue;
            if (reg.test(a.textContent)) continue;
            for (let attr of a.getAttributeNames()) {
                let val = a.getAttribute(attr);
                if (!reg.test(val)) continue;
                let url = val.match(reg)[0];
                a.parentNode.insertBefore(createWatchButton(url), a.nextSibling);
            }
        }
    }


    function watchBodyChange(onchange) {
        let timeout;
        let observer = new MutationObserver(() => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    onchange();
                }, 200);
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

    }

    function getAllTextNodes(parent) {
        var re = [];
        if (["STYLE", "SCRIPT", "BASE", "COMMAND", "LINK", "META", "TITLE", "XTRANS-TXT", "XTRANS-TXT-GROUP", "XTRANS-POPUP"].includes(parent.tagName)) return re;
        for (let node of parent.childNodes) {
            if (node.childNodes.length) re = re.concat(getAllTextNodes(node));
            else if (Text.prototype.isPrototypeOf(node) && (!node.nodeValue.match(/^\s*$/))) re.push(node);
        }
        return re;
    }

    function whenDOMReady(f) {
        if (document.body) f();
        else window.addEventListener("DOMContentLoaded", f);
    }

    function addStyle(s) {
        let style = document.createElement("style");
        style.textContent = s;
        document.documentElement.appendChild(style);
    }

})();
