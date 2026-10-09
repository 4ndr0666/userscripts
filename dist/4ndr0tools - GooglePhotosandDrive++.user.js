// ==UserScript==
// @name         4ndr0tools - GooglePhotosandDrive++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      8.1.0
// @description  Restores context menus, exposes direct links, adds reverse image search, Drive direct-download resolution, Photos full-res extraction, power-user hotkeys, drag persistence and a settings console. 3lectric-Glass paradigm.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*.googleusercontent.com/*
// @match        *://photos.google.com/*
// @match        *://drive.google.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect       drive.google.com
// @connect       drive.usercontent.google.com
// @connect       googleusercontent.com
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
     * responseType is normalized to the portable set ('text' default).
     *
     * v5.1 (suite v1.4.9) — TRANSPORT OPTS EXTENSION, closure-local and
     * fully backward compatible (VERSION stays 5: gmFetch owns no realm
     * state and is never re-routed, so a co-installed v5/v5.1 pair keeps
     * the established subscription delegation and each copy serves its
     * own transport): opts.onprogress / opts.onloadstart pass the
     * manager's progress callbacks straight through (download UIs);
     * opts.signal (AbortSignal or duck-typed {aborted, addEventListener})
     * aborts the in-flight handle AND force-settles the attempt typed
     * kind 'abort' (a manager that fails to fire onabort after
     * handle.abort() can never hang the call to its hard timeout),
     * breaks the retry chain (abort is not transient), and detaches its
     * listener on settle; opts.anonymous === true is forwarded so
     * credential-free privileged requests stay credential-free. The
     * five census-surviving local gmFetch copies (Bunkr++, Gofile++,
     * Instagram++, Pixeldrain++, Blob2URL) ride this surface as thin
     * policy adapters — one transport implementation suite-wide. */
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
        const onprogress = typeof opts.onprogress === 'function' ? opts.onprogress : null;
        const onloadstart = typeof opts.onloadstart === 'function' ? opts.onloadstart : null;
        const anonymous = opts.anonymous === true;
        const signal = (opts.signal && typeof opts.signal.addEventListener === 'function')
            ? opts.signal : null;

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
        if (signal && signal.aborted) {
            /* Pre-aborted signal — reject typed before any dispatch (an
             * abandoned download must never spend a request slot). */
            return Promise.reject(new NetError('aborted before dispatch', { url: url, kind: 'abort' }));
        }

        let currentHandle = null;
        let signalAborted = false;
        let forceSettle = null; /* current attempt's settle-once reject hook */
        const onSignalAbort = function () {
            signalAborted = true;
            try {
                if (currentHandle && typeof currentHandle.abort === 'function') currentHandle.abort();
            } catch (e) { /* manager handle inert — force-settle below owns the verdict */ }
            try {
                if (forceSettle) forceSettle(new NetError('aborted via signal', { url: url, kind: 'abort' }));
            } catch (e) { /* settle-once already closed — nothing to do */ }
        };
        if (signal) {
            try { signal.addEventListener('abort', onSignalAbort); }
            catch (e) { /* inert signal — proceed unabortable, hard timeout still bounds the call */ }
        }

        function attempt() {
            return new Promise(function (resolve, reject) {
                let settled = false;
                const done = function (fn, arg) { if (!settled) { settled = true; fn(arg); } };
                forceSettle = function (err) { done(reject, err); };
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
                if (onprogress) req.onprogress = onprogress;
                if (onloadstart) req.onloadstart = onloadstart;
                if (anonymous) req.anonymous = true;
                try { currentHandle = transport(req); }
                catch (e) { done(reject, new NetError('dispatch failed: ' + ((e && e.message) || e), { url: url, kind: 'transport' })); }
            });
        }

        return (async function () {
            try {
                let lastErr = null;
                for (let n = 0; n <= retries; n++) {
                    if (signalAborted) throw new NetError('aborted via signal', { url: url, kind: 'abort' });
                    try { return await attempt(); }
                    catch (e) {
                        lastErr = e;
                        const transient = e instanceof NetTimeoutError || (e && e.kind === 'transport');
                        if (!transient || n >= retries) throw e;
                        await gmSleep(300 * (n + 1));
                    }
                }
                throw lastErr;
            } finally {
                /* Listener detachment on every settle path — a reused
                 * controller must not accumulate dead gmFetch listeners
                 * (GUP D4: ruthless reclamation). */
                if (signal) {
                    try { signal.removeEventListener('abort', onSignalAbort); }
                    catch (e) { /* inert signal */ }
                }
            }
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

// 8.1.0 (suite v1.4.8): TRUE-DIRECT RESOLUTION — the Drive HUD's direct
// link was the uc?export=download hop, which large or unscannable files
// answer with Google's confirm interstitial (the button's own tooltip
// said so). The HUD now resolves the TRUE direct URL: on /file/d/ pages
// a privileged gmFetch probe (kernel/net.js v5 — Promise GM transport,
// hard timeout, transient-only retry) follows the redirect chain and, on
// the interstitial, parses the confirm form's action + hidden fields
// (DOMParser, not regex) into the drive.usercontent.google.com link; on
// the interstitial page ITSELF the form is already in this document, so
// the resolution is a zero-fetch DOM read. Grants gained the transport +
// its connect targets; everything else is 8.0.3 untouched.
// 8.0.1 (suite v1.4.0): OPSEC — remote Google-Fonts @import purged (IP-leak / fingerprint vector on every page load); local spec font stack retained. 3lectric-Glass universality round.


/* ═══ SUITE PROMOTION 8.0.0 ═══════════════════════════════════════════
 * GooglePhotosandDrive++BETA v7.0.0 promoted: 'Unified superset revision — GUP gate: 0 MISSING' — Drive direct-download resolution, Photos full-res extraction, hotkeys, drag persistence, settings console; supersedes stable v1.5.0.
 * Retired duplicate: 4ndr0tools - GooglePhotosandDrive++.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

/* ============================================================================
 * 4ndr0tools - GooglePhotosandDrive++ — v7.0.0-Ψ
 * Unified superset revision — Golden Unit Protocol v5.3, 3lectric-Glass
 * paradigm (GTK 3.22+ spec, web mapping), 4ndr0666 Ψ branding glyph.
 * ----------------------------------------------------------------------------
 * LINEAGE
 *   1.5.0    Baseline (canonical): context-menu unlock, s0 direct-link
 *            redirect, OSINT reverse-search HUD, kernel notification overlay.
 *   7.0.0-Ψ  This revision — unified house version bump. Baseline behavior
 *            preserved (GUP gate: 0 MISSING) plus:
 *            · 3lectric-Glass spec realignment — JetBrains Mono + Orbitron,
 *              glass L1/L2/L3 alpha layering, solid headerbar, 0px brutalist
 *              buttons, 150ms transitions, switch / scrollbar / destructive /
 *              notification-label tokens.
 *            · getDirectPhotoLink hardening — size-token validation so empty
 *              or non-size '=' segments are no longer corrupted to '=s0'.
 *            · showNotification leak-proof removal — transitionend once plus
 *              a hard-cap fallback timer for backgrounded tabs.
 *            · Glyph rendering fix — var() moved out of SVG presentation
 *              attributes (invalid there) into style properties so the ring /
 *              hexagon / Ψ core actually render in Electric Cyan.
 *            · Drive direct-download resolution (uc?export=download) with a
 *              glass HUD on /file/d/ pages and legacy ?id= URLs.
 *            · Photos full-res (=s0) viewer extraction, Lens reverse search
 *              and direct-URL clipboard ops from the open viewer.
 *            · Power-user hotkeys (G/O/C/F/V/D, Esc) — Alt-guarded on SPA
 *              hosts so native Photos/Drive shortcuts stay untouched.
 *              v8.0.2 hotkey census round: S→G and R→V — bare Alt+S is
 *              owned by ModelSearch suite-wide, Alt+R by PageCraft.
 *            · Persisted settings console (GM storage with localStorage
 *              fallback), draggable + collapsible HUDs with position memory,
 *              SPA route patch (pushState / replaceState / popstate).
 * ========================================================================== */

(function() {
    'use strict';

    /* ========================================================================
     * MODULE 0 — CONFIG, STATE, TELEMETRY
     * ==================================================================== */

    const SCRIPT_VERSION = '8.1.0-Ψ';
    const STYLE_ELEMENT_ID = '4ndr0-glass-styles';
    /* [v8.1.0 fix — caught by the first GUP live smoke of this script]
     * SVG_NS was const-declared inside the OSINT glyph builder while
     * showNotification's Ψ glyph referenced it out of scope — every
     * notification since the v1.4.4 createElement round threw a silent
     * ReferenceError (caught + logged, never rendered). Hoisted here so
     * both glyph builders share one module-level binding. */
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const SETTINGS_KEY = '4ndr0666.gmedia.settings';
    const HUD_STATE_KEY = '4ndr0666.gmedia.hudstate';
    const SETTINGS_EVENT = '4ndr0-settings-changed';

    const DEFAULT_SETTINGS = Object.freeze({
        contextMenuUnlock: true,
        autoDirectLink: true,
        osintHud: true,
        driveHud: true,
        notifications: true,
        hotkeys: true
    });

    /**
     * MODULE 0.1 — Diagnostic uplink: centralized error telemetry.
     */
    const logError = (module, error) => {
        console.error(`[Ψ-4ndr0666] Exception in ${module}:`, error.message, error.stack);
    };

    /**
     * MODULE 0.2 — Boot banner: version, module roster and live setting state.
     */
    const printBootBanner = () => {
        try {
            const toggles = Object.keys(DEFAULT_SETTINGS)
                .map((key) => `${key}=${settings[key] ? 'on' : 'off'}`)
                .join(' ');
            console.log(`[Ψ] 4ndr0tools GooglePhotosandDrive++ v${SCRIPT_VERSION} — 3lectric-Glass paradigm`);
            console.log('[Ψ] modules: ctxmenu-unlock · s0-direct · osint-recon · drive-direct · true-direct · photos-fullres · hotkeys · settings-console · spa-patch');
            console.log(`[Ψ] settings: ${toggles}`);
        } catch (error) {
            logError('printBootBanner', error);
        }
    };

    /**
     * MODULE 0.3 — Storage backend factory: GM value storage when granted,
     * localStorage fallback otherwise. JSON-safe on both paths.
     */
    const createStorageBackend = () => {
        try {
            if (typeof GM_getValue === 'function' && typeof GM_setValue === 'function') {
                return {
                    get: (key, fallback) => {
                        try {
                            const raw = GM_getValue(key, null);
                            if (raw === null || raw === undefined) return fallback;
                            return typeof raw === 'string' ? JSON.parse(raw) : raw;
                        } catch (error) {
                            logError('storageBackend.get', error);
                            return fallback;
                        }
                    },
                    set: (key, value) => {
                        try {
                            GM_setValue(key, JSON.stringify(value));
                        } catch (error) {
                            logError('storageBackend.set', error);
                        }
                    }
                };
            }
        } catch (error) {
            logError('createStorageBackend', error);
        }
        return {
            get: (key, fallback) => {
                try {
                    const raw = localStorage.getItem(key);
                    return raw === null ? fallback : JSON.parse(raw);
                } catch (error) {
                    logError('storageBackend.get', error);
                    return fallback;
                }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (error) {
                    logError('storageBackend.set', error);
                }
            }
        };
    };

    const storageBackend = createStorageBackend();

    /**
     * MODULE 0.4 — Settings: load (with boolean validation and default
     * merge), save, reset, live mutation with change broadcast.
     */
    const loadSettings = () => {
        const stored = storageBackend.get(SETTINGS_KEY, {});
        const safeStored = (stored && typeof stored === 'object') ? stored : {};
        const merged = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
            merged[key] = typeof safeStored[key] === 'boolean' ? safeStored[key] : DEFAULT_SETTINGS[key];
        }
        return merged;
    };

    const saveSettings = () => {
        storageBackend.set(SETTINGS_KEY, settings);
    };

    const resetSettings = () => {
        settings = Object.assign({}, DEFAULT_SETTINGS);
        saveSettings();
    };

    const emitSettingsChanged = () => {
        try {
            window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
        } catch (error) {
            logError('emitSettingsChanged', error);
        }
    };

    const settingsChanged = (callback) => {
        window.addEventListener(SETTINGS_EVENT, () => callback());
    };

    const setSetting = (key, value) => {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
        if (typeof value !== 'boolean') return;
        settings[key] = value;
        saveSettings();
        emitSettingsChanged();
    };

    let settings = loadSettings();

    /* ========================================================================
     * MODULE 1 — Inject CSS for the 3lectric-Glass paradigm
     * Full GTK 3.22+ spec web mapping: glass L1 window / L2 popup / L3 panel
     * alpha layering, solid headerbar with Orbitron title, 0px brutalist
     * buttons, 150ms ease-in-out transitions, switch / scrollbar /
     * destructive-action / notification-label tokens.
     * ==================================================================== */
    const injectStyles = () => {
        try {
            if (document.getElementById(STYLE_ELEMENT_ID)) return;

            const style = document.createElement('style');
            style.id = STYLE_ELEMENT_ID;
            style.textContent = `

                :root {
                    --glass-l1-window: rgba(10, 19, 26, 0.72);
                    --glass-l2-popup: rgba(10, 19, 26, 0.65);
                    --glass-l3-panel: rgba(10, 19, 26, 0.55);
                    --solid-header: rgba(10, 19, 26, 0.95);
                    --accent-cyan: #00E5FF;
                    --accent-cyan-hover: #67E8F9;
                    --alert-destructive: #ff0055;
                    --absolute-light: #ffffff;
                    --font-body: 'JetBrains Mono', monospace;
                    --font-display: 'Orbitron', sans-serif;
                    --font-glyph: 'Cinzel Decorative', serif;
                    --transition-spec: all 150ms ease-in-out;
                }

                /* --- MAIN WINDOW (window.main-window) --- */
                .psi-glass-window {
                    position: fixed;
                    left: 20px;
                    top: 20px;
                    z-index: 2147483646;
                    display: flex;
                    flex-direction: column;
                    min-width: 220px;
                    max-width: 340px;
                    background: var(--glass-l1-window);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                    border-radius: 4px;
                    box-shadow: 0 0 40px rgba(0, 229, 255, 0.15);
                    color: var(--accent-cyan);
                    font-family: var(--font-body);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    transition: var(--transition-spec);
                }

                /* --- HEADERBAR --- */
                .psi-glass-headerbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: var(--solid-header);
                    border-bottom: 2px solid var(--accent-cyan);
                    border-radius: 3px 3px 0 0;
                    color: var(--accent-cyan);
                    cursor: move;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .psi-glass-headerbar .title {
                    flex: 1;
                    min-width: 0;
                    font-family: var(--font-display);
                    font-size: 14pt;
                    font-weight: 700;
                    color: var(--accent-cyan-hover);
                    letter-spacing: 0.06em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .psi-glass-headerbar .subtitle {
                    font-family: var(--font-body);
                    font-size: 9pt;
                    color: rgba(0, 229, 255, 0.7);
                    white-space: nowrap;
                }

                .psi-glass-headerbtn {
                    flex: none;
                    padding: 2px 8px;
                    background: var(--glass-l3-panel);
                    border: 1px solid rgba(0, 229, 255, 0.4);
                    border-radius: 0px;
                    color: var(--accent-cyan);
                    font-family: var(--font-body);
                    font-size: 9pt;
                    font-weight: bold;
                    line-height: 1.4;
                    cursor: pointer;
                    transition: var(--transition-spec);
                }

                .psi-glass-headerbtn:hover {
                    background: rgba(0, 229, 255, 0.2);
                    border-color: var(--accent-cyan);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
                    color: var(--accent-cyan-hover);
                }

                .psi-glass-headerbtn:active {
                    background: rgba(0, 229, 255, 0.3);
                    color: var(--absolute-light);
                }

                /* --- CONTENT / SCROLLBAR TOKENS --- */
                .psi-glass-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px;
                    max-height: 60vh;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #00E5FF rgba(0, 0, 0, 0.4);
                }

                .psi-glass-content::-webkit-scrollbar { width: 8px; height: 8px; }
                .psi-glass-content::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); }
                .psi-glass-content::-webkit-scrollbar-thumb {
                    background: #00E5FF;
                    border-radius: 0;
                    min-width: 6px;
                    min-height: 6px;
                }
                .psi-glass-content::-webkit-scrollbar-thumb:hover { background: #67E8F9; }

                /* --- GLASS PANEL (L3) --- */
                .psi-glass-panel {
                    background: var(--glass-l3-panel);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    border-radius: 4px;
                    margin: 5px;
                    padding: 6px 8px;
                    color: var(--accent-cyan);
                    font-size: 10pt;
                    word-break: break-all;
                }

                /* --- BUTTONS (0px brutalism) --- */
                .psi-glass-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 20px;
                    border: 1px solid rgba(0, 229, 255, 0.4);
                    background: var(--glass-l2-popup);
                    color: var(--accent-cyan);
                    border-radius: 0px;
                    font-family: var(--font-body);
                    font-weight: bold;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    text-decoration: none;
                    cursor: pointer;
                    transition: var(--transition-spec);
                }

                .psi-glass-button:hover {
                    background: rgba(0, 229, 255, 0.2);
                    border-color: var(--accent-cyan);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
                    color: var(--accent-cyan-hover);
                }

                .psi-glass-button:active {
                    background: rgba(0, 229, 255, 0.3);
                    color: var(--absolute-light);
                }

                .psi-glass-button:focus-visible {
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                /* --- DESTRUCTIVE CONTROL SURFACES --- */
                .psi-glass-button.destructive-action,
                .psi-glass-button.destructive {
                    border-color: var(--alert-destructive);
                    color: var(--alert-destructive);
                }

                .psi-glass-button.destructive-action:hover,
                .psi-glass-button.destructive:hover {
                    background: rgba(255, 0, 85, 0.3);
                    box-shadow: 0 0 25px #ff0055;
                    color: var(--absolute-light);
                }

                /* --- SETTINGS ROWS / LABELS --- */
                .psi-glass-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 4px 0;
                }

                .psi-glass-label {
                    color: var(--accent-cyan);
                    font-size: 9pt;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                /* --- BOOLEAN TOGGLES (switch) --- */
                .psi-glass-switch {
                    display: inline-flex;
                    align-items: center;
                    flex: none;
                    cursor: pointer;
                }

                .psi-glass-switch input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .psi-glass-switch .trough {
                    display: block;
                    position: relative;
                    width: 46px;
                    height: 22px;
                    background: #050A0F;
                    border: 1px solid var(--accent-cyan);
                    transition: var(--transition-spec);
                }

                .psi-glass-switch .trough::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: var(--accent-cyan);
                    box-shadow: 0 0 12px rgba(0, 229, 255, 0.8);
                    transition: var(--transition-spec);
                }

                .psi-glass-switch input:checked + .trough {
                    background: rgba(0, 229, 255, 0.2);
                }

                .psi-glass-switch input:checked + .trough::after {
                    left: calc(100% - 18px);
                }

                .psi-glass-switch input:focus-visible + .trough {
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                /* --- REVEALER / NOTIFICATION OVERLAY --- */
                .psi-glass-notification {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    z-index: 2147483647;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 24px;
                    max-width: 420px;
                    background: var(--glass-l2-popup);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    border-radius: 4px;
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
                    color: var(--absolute-light);
                    font-family: var(--font-body);
                    font-size: 14px;
                    font-weight: bold;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
                    pointer-events: none;
                }

                .psi-glass-notification .notification-label {
                    color: var(--absolute-light);
                    font-weight: bold;
                }
            `;
            const parent = document.head || document.documentElement;
            parent.appendChild(style);
        } catch (error) {
            logError('injectStyles', error);
        }
    };

    /* ========================================================================
     * MODULE 2.5 — Shared URL normalization (googleusercontent size tokens)
     * Rewrites the trailing size token (=w1234-h567, =s1600, …) to '=s0'.
     * Hardened versus the baseline: the segment after the last '=' is only
     * rewritten when it actually validates as a size token, so empty
     * segments ('…=') and non-size tokens are never corrupted.
     * ==================================================================== */
    const SIZE_PARAM_REGEX = /(w\d+-h\d+|s\d+)(?:-c|-k)?((?:-[a-z]+)+)?/i;

    const normalizeImageUrl = (url) => {
        try {
            const urlObj = new URL(url);
            const basePath = urlObj.origin + urlObj.pathname;
            const searchAndHash = urlObj.search + urlObj.hash;
            let newBasePath = basePath;

            const eqIndex = basePath.lastIndexOf('=');
            if (eqIndex !== -1) {
                const lastPart = basePath.slice(eqIndex + 1);
                if (lastPart !== '' && !lastPart.startsWith('s0') && SIZE_PARAM_REGEX.test(lastPart)) {
                    newBasePath = basePath.slice(0, eqIndex) + '=s0';
                }
            } else if (SIZE_PARAM_REGEX.test(basePath)) {
                newBasePath = basePath.replace(SIZE_PARAM_REGEX, 's0');
            }

            return newBasePath + searchAndHash;
        } catch (error) {
            logError('normalizeImageUrl', error);
            return url;
        }
    };

    /**
     * MODULE 1 — Direct Photo Link Enhancement (baseline behavior preserved:
     * navigate to the =s0 full-resolution URL when a size token is present).
     */
    const getDirectPhotoLink = () => {
        try {
            const currentUrl = window.location.href;
            const newUrl = normalizeImageUrl(currentUrl);
            if (newUrl !== currentUrl) {
                window.location.replace(newUrl);
            }
        } catch (error) {
            logError('getDirectPhotoLink', error);
        }
    };

    /**
     * MODULE 2 — Context Menu Integration. Baseline override preserved
     * (capture-phase stopImmediatePropagation + oncontextmenu attribute
     * sweeper); both paths now honor the live contextMenuUnlock setting.
     */
    const removeContextMenuBlockers = () => {
        try {
            const enforceContext = (event) => {
                if (settings.contextMenuUnlock) {
                    event.stopImmediatePropagation();
                }
            };

            window.addEventListener('contextmenu', enforceContext, true);
            document.addEventListener('contextmenu', enforceContext, true);

            const observer = new MutationObserver(mutations => {
                if (!settings.contextMenuUnlock) return;
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'oncontextmenu') {
                        mutation.target.removeAttribute('oncontextmenu');
                    }
                }
            });

            if (document.documentElement) {
                observer.observe(document.documentElement, {
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['oncontextmenu']
                });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.documentElement, {
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['oncontextmenu']
                    });
                }, { once: true });
            }
        } catch (error) {
            logError('removeContextMenuBlockers', error);
        }
    };

    /* ========================================================================
     * MODULE 4.5 — HUD utility belt: persisted per-HUD state (position /
     * collapse), viewport-clamped positioning, pointer-event drag engine,
     * collapse sync, and the shared glass control factories.
     * ==================================================================== */
    const getHudEntry = (hudName, fallback) => {
        const state = storageBackend.get(HUD_STATE_KEY, {});
        const safeState = (state && typeof state === 'object') ? state : {};
        return (safeState[hudName] && typeof safeState[hudName] === 'object') ? safeState[hudName] : fallback;
    };

    const setHudEntry = (hudName, patch) => {
        const state = storageBackend.get(HUD_STATE_KEY, {});
        const safeState = (state && typeof state === 'object') ? state : {};
        const merged = Object.assign({ x: 20, y: 20, collapsed: false }, safeState[hudName], patch);
        safeState[hudName] = merged;
        storageBackend.set(HUD_STATE_KEY, safeState);
        return merged;
    };

    const applyHudPosition = (element, hudName, defaultPos) => {
        const entry = getHudEntry(hudName, {
            x: (defaultPos && typeof defaultPos.x === 'number') ? defaultPos.x : 20,
            y: (defaultPos && typeof defaultPos.y === 'number') ? defaultPos.y : 20,
            collapsed: false
        });
        const maxX = Math.max(0, window.innerWidth - 60);
        const maxY = Math.max(0, window.innerHeight - 60);
        const x = Math.min(Math.max(0, entry.x), maxX);
        const y = Math.min(Math.max(0, entry.y), maxY);
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    };

    const attachDragHandlers = (element, hudName) => {
        const headerbar = element.querySelector('.psi-glass-headerbar');
        if (!headerbar) return;

        let dragOrigin = null;

        headerbar.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (event.target.closest('button, a, input')) return;
            const rect = element.getBoundingClientRect();
            dragOrigin = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                baseX: rect.left,
                baseY: rect.top
            };
            if (headerbar.setPointerCapture) {
                try { headerbar.setPointerCapture(event.pointerId); }
                catch (error) { logError('attachDragHandlers.setPointerCapture', error); }
            }
            event.preventDefault();
        });

        headerbar.addEventListener('pointermove', (event) => {
            if (!dragOrigin) return;
            const maxX = Math.max(0, window.innerWidth - 60);
            const maxY = Math.max(0, window.innerHeight - 60);
            const nextX = Math.min(Math.max(0, dragOrigin.baseX + (event.clientX - dragOrigin.pointerX)), maxX);
            const nextY = Math.min(Math.max(0, dragOrigin.baseY + (event.clientY - dragOrigin.pointerY)), maxY);
            element.style.left = `${nextX}px`;
            element.style.top = `${nextY}px`;
        });

        const endDrag = (event) => {
            if (!dragOrigin) return;
            dragOrigin = null;
            if (headerbar.hasPointerCapture && headerbar.hasPointerCapture(event.pointerId)) {
                try { headerbar.releasePointerCapture(event.pointerId); }
                catch (error) { logError('attachDragHandlers.releasePointerCapture', error); }
            }
            const rect = element.getBoundingClientRect();
            setHudEntry(hudName, { x: Math.round(rect.left), y: Math.round(rect.top) });
        };

        headerbar.addEventListener('pointerup', endDrag);
        headerbar.addEventListener('pointercancel', endDrag);
    };

    const syncHudCollapsed = (hudElement, collapsed, toggleButton) => {
        const content = hudElement.querySelector('.psi-glass-content');
        if (content) content.style.display = collapsed ? 'none' : '';
        if (toggleButton) toggleButton.textContent = collapsed ? '+' : '—';
    };

    const makeHeaderButton = (label, onClick, titleText) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'psi-glass-headerbtn';
        btn.textContent = label;
        if (titleText) btn.title = titleText;
        btn.addEventListener('click', onClick);
        return btn;
    };

    /**
     * Baseline link factory (unit name preserved from v1.5.0): builds an
     * anchor-styled glass control — span-first structure identical to the
     * baseline createLink, restyled to the 0px brutalist button tokens.
     */
    const createLink = (text, targetUrl) => {
        const btn = document.createElement('a');
        btn.className = 'psi-glass-button';
        btn.href = targetUrl;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        const span = document.createElement('span');
        span.textContent = text;
        btn.appendChild(span);
        return btn;
    };

    const makeGlassButton = (text, onClick, destructive = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = destructive ? 'psi-glass-button destructive-action' : 'psi-glass-button';
        const span = document.createElement('span');
        span.textContent = text;
        btn.appendChild(span);
        btn.addEventListener('click', onClick);
        return btn;
    };

    /* ========================================================================
     * MODULE 4 — OSINT Reverse Search HUD (glass window + headerbar).
     * Baseline link roster preserved verbatim; superset adds headerbar with
     * drag / collapse / stow controls, persisted position, and a copy-direct
     * clipboard action. Glyph var() references moved into style properties
     * so the rings, hexagon and Ψ core render in Electric Cyan.
     * ==================================================================== */
    const OSINT_HUD_ID = 'osint-links-4ndr0';

    const displaySearchLinks = () => {
        try {
            const existing = document.getElementById(OSINT_HUD_ID);
            if (existing) {
                existing.style.display = settings.osintHud ? '' : 'none';
                return;
            }
            if (!settings.osintHud || !document.body) return;

            const src = window.location.href;
            const encodedSrc = encodeURIComponent(src);

            const linkBlock = document.createElement('div');
            linkBlock.id = OSINT_HUD_ID;
            linkBlock.className = 'psi-glass-window';
            applyHudPosition(linkBlock, 'osintHud', { x: 20, y: 20 });

            const headerbar = document.createElement('div');
            headerbar.className = 'psi-glass-headerbar';
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = 'Ψ RECON';
            title.style.fontSize = '11pt';
            const subtitle = document.createElement('div');
            subtitle.className = 'subtitle';
            subtitle.textContent = `v${SCRIPT_VERSION}`;
            const collapseBtn = makeHeaderButton('—', () => {
                const entry = getHudEntry('osintHud', { x: 20, y: 20, collapsed: false });
                const merged = setHudEntry('osintHud', { collapsed: !entry.collapsed });
                syncHudCollapsed(linkBlock, merged.collapsed, collapseBtn);
            }, 'Collapse recon panel');
            const closeBtn = makeHeaderButton('×', () => {
                setSetting('osintHud', false);
            }, 'Stow recon panel (O re-engages)');
            headerbar.append(title, subtitle, collapseBtn, closeBtn);

            const content = document.createElement('div');
            content.className = 'psi-glass-content';

            const glyphWrapper = document.createElement('div');
            glyphWrapper.style.display = 'flex';
            glyphWrapper.style.justifyContent = 'center';
            glyphWrapper.style.marginBottom = '10px';
            /* [R3] element-built Ψ glyph (was an innerHTML template). */
            const bigGlyph = document.createElementNS(SVG_NS, 'svg');
            bigGlyph.setAttribute('viewBox', '0 0 128 128');
            bigGlyph.setAttribute('xmlns', SVG_NS);
            bigGlyph.setAttribute('style', 'width: 48px; height: 48px; stroke: var(--accent-cyan);');
            bigGlyph.setAttribute('fill', 'none');
            bigGlyph.setAttribute('stroke-width', '3');
            bigGlyph.setAttribute('stroke-linecap', 'round');
            bigGlyph.setAttribute('stroke-linejoin', 'round');
            const bg1 = document.createElementNS(SVG_NS, 'path');
            bg1.setAttribute('d', 'M 64,12 A 52,52 0 1 1 63.9,12 Z');
            bg1.setAttribute('stroke-dasharray', '21.78 21.78');
            bg1.setAttribute('stroke-width', '2');
            const bg2 = document.createElementNS(SVG_NS, 'path');
            bg2.setAttribute('d', 'M 64,20 A 44,44 0 1 1 63.9,20 Z');
            bg2.setAttribute('stroke-dasharray', '10 10');
            bg2.setAttribute('stroke-width', '1.5');
            bg2.setAttribute('opacity', '0.7');
            const bg3 = document.createElementNS(SVG_NS, 'path');
            bg3.setAttribute('d', 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z');
            bg3.setAttribute('style', 'fill: rgba(10, 19, 26, 0.4);');
            const bgPsi = document.createElementNS(SVG_NS, 'text');
            bgPsi.setAttribute('x', '64');
            bgPsi.setAttribute('y', '67');
            bgPsi.setAttribute('text-anchor', 'middle');
            bgPsi.setAttribute('dominant-baseline', 'middle');
            bgPsi.setAttribute('stroke', 'none');
            bgPsi.setAttribute('font-size', '46');
            bgPsi.setAttribute('font-weight', '700');
            bgPsi.setAttribute('style', 'fill: var(--accent-cyan); font-family: var(--font-glyph);');
            bgPsi.textContent = 'Ψ';
            bigGlyph.append(bg1, bg2, bg3, bgPsi);
            glyphWrapper.appendChild(bigGlyph);
            content.appendChild(glyphWrapper);

            const divider = document.createElement('div');
            Object.assign(divider.style, {
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
                marginBottom: '5px'
            });
            content.appendChild(divider);

            content.appendChild(createLink('[>] Google Lens', `https://lens.google.com/uploadbyurl?url=${encodedSrc}`));
            content.appendChild(createLink('[>] Yandex Recon', `https://yandex.com/images/search?rpt=imageview&img_url=${encodedSrc}`));
            content.appendChild(createLink('[>] TinEye Scan', `https://tineye.com/search?url=${encodedSrc}`));
            content.appendChild(createLink('[+] ImgOps Triage', `https://imgops.com/${src}`));
            content.appendChild(createLink('[+] LunaPic Editor', `https://www.lunapic.com/editor/?action=url&url=${encodedSrc}`));
            content.appendChild(makeGlassButton('[=] Copy Direct URL', () => {
                copyToClipboard(normalizeImageUrl(src));
            }));

            linkBlock.append(headerbar, content);
            attachDragHandlers(linkBlock, 'osintHud');

            const entry = getHudEntry('osintHud', { x: 20, y: 20, collapsed: false });
            syncHudCollapsed(linkBlock, entry.collapsed, collapseBtn);

            document.body.appendChild(linkBlock);
        } catch (error) {
            logError('displaySearchLinks', error);
        }
    };

    /**
     * MODULE 5 — 4NDR0666OS Notification Overlay (Electric-Glass styled).
     * Baseline enter/exit choreography preserved; removal is now leak-proof
     * (transitionend once + hard-cap fallback for backgrounded tabs) and the
     * surface honors the live notifications setting.
     */
    const showNotification = (message) => {
        try {
            if (!settings.notifications || !document.body) return;

            const notification = document.createElement('div');
            notification.className = 'psi-glass-notification';
            notification.setAttribute('role', 'status');
            /* [R3] element-built notification (was an innerHTML template). */
            const notifGlyph = document.createElementNS(SVG_NS, 'svg');
            notifGlyph.setAttribute('viewBox', '0 0 128 128');
            notifGlyph.setAttribute('style', 'width: 20px; height: 20px; flex: none; stroke: currentColor;');
            notifGlyph.setAttribute('fill', 'none');
            notifGlyph.setAttribute('stroke-width', '4');
            const ng1 = document.createElementNS(SVG_NS, 'path');
            ng1.setAttribute('d', 'M 64,12 A 52,52 0 1 1 63.9,12 Z');
            ng1.setAttribute('stroke-dasharray', '21.78 21.78');
            const ngPsi = document.createElementNS(SVG_NS, 'text');
            ngPsi.setAttribute('x', '64');
            ngPsi.setAttribute('y', '70');
            ngPsi.setAttribute('text-anchor', 'middle');
            ngPsi.setAttribute('dominant-baseline', 'middle');
            ngPsi.setAttribute('fill', 'currentColor');
            ngPsi.setAttribute('stroke', 'none');
            ngPsi.setAttribute('font-size', '60');
            ngPsi.setAttribute('font-weight', '700');
            ngPsi.setAttribute('style', 'font-family: var(--font-glyph);');
            ngPsi.textContent = 'Ψ';
            notifGlyph.append(ng1, ngPsi);
            const notifLabel = document.createElement('span');
            notifLabel.className = 'notification-label';
            notifLabel.textContent = `[ KERNEL ]: ${message}`;
            notification.append(notifGlyph, notifLabel);

            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(-10px)';
            });

            let removed = false;
            const removeNotification = () => {
                if (removed) return;
                removed = true;
                notification.remove();
            };
            notification.addEventListener('transitionend', removeNotification, { once: true });

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(10px)';
                setTimeout(removeNotification, 400);
            }, 4000);
        } catch (error) {
            logError('showNotification', error);
        }
    };

    /**
     * MODULE 6 — Photos viewer target acquisition: locates the dominant
     * googleusercontent <img> in the open Google Photos viewer (largest
     * rendered area), falls back to the widest srcset entry for
     * blob:/data: sources, and normalizes to the =s0 full-resolution URL.
     */
    const getCurrentPhotoUrl = () => {
        try {
            const candidates = document.querySelectorAll('img[src*="googleusercontent.com"], img[srcset*="googleusercontent.com"]');
            let best = null;
            let bestArea = 0;
            for (const img of candidates) {
                const rect = img.getBoundingClientRect();
                const area = rect.width * rect.height;
                if (area > bestArea) {
                    bestArea = area;
                    best = img;
                }
            }
            if (!best) return null;

            let url = best.currentSrc || best.src || '';
            if ((!url || url.startsWith('blob:') || url.startsWith('data:')) && best.srcset) {
                const parts = best.srcset.split(',');
                let widest = 0;
                let chosen = '';
                for (const part of parts) {
                    const seg = part.trim().split(/\s+/);
                    const width = parseInt((seg[1] || '').replace(/\D/g, ''), 10) || 0;
                    if (width >= widest) {
                        widest = width;
                        chosen = seg[0] || '';
                    }
                }
                url = chosen;
            }
            if (!url || !url.includes('googleusercontent.com')) return null;
            return normalizeImageUrl(url);
        } catch (error) {
            logError('getCurrentPhotoUrl', error);
            return null;
        }
    };

    /* ========================================================================
     * MODULE 7 — Drive direct-download resolution. Recognizes both the
     * modern /file/d/{id}/ grammar and the legacy ?id= form, builds the
     * uc?export=download direct link, and mounts a glass HUD on file pages
     * with clipboard and direct-download actions.
     * ==================================================================== */
    const DRIVE_HUD_ID = '4ndr0-drive-hud';

    const detectDriveFileId = (url) => {
        try {
            const pathMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
            if (pathMatch) return pathMatch[1];
            const idParam = new URL(url).searchParams.get('id');
            if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) return idParam;
            return null;
        } catch (error) {
            logError('detectDriveFileId', error);
            return null;
        }
    };

    const buildDriveDirectLink = (fileId) => `https://drive.google.com/uc?export=download&id=${fileId}`;

    /* ── v8.1.0: TRUE-DIRECT RESOLUTION ───────────────────────────────────
     * The uc?export=download hop is not always the file: Google answers
     * large/unscannable files with an HTML confirm interstitial whose form
     * posts to the REAL direct link on drive.usercontent.google.com. Two
     * resolution paths share one form reader:
     *   · INTERSTITIAL PAGE (zero fetch): this script runs on
     *     drive.google.com/* — when the interstitial IS the document, the
     *     form is already in the DOM and the true-direct link is a read.
     *   · /file/d/ PAGES (privileged probe): a kernel gmFetch of the uc?
     *     hop follows the redirect chain cross-origin (page fetch dies at
     *     the googleusercontent redirect — no CORS headers there); an HTML
     *     answer is the interstitial, parsed with DOMParser (D8: a DOM
     *     parser, never regex over HTML); a redirected answer's finalUrl
     *     IS the direct link. Probe cost is bounded by the transport's
     *     hard timeout; a scannable file that streams straight through is
     *     transient memory only, then GC — documented trade, media-sized
     *     shares are the mission profile. */
    let driveResolvedCache = null; /* { id, url } — survives HUD re-mounts */

    /* [v8.1.0 TT hardening — caught live by the /tt/ regime] Google hosts
     * enforce require-trusted-types-for 'script', and a bare
     * DOMParser().parseFromString(text, 'text/html') is a TrustedHTML sink
     * there (the harness reproduced the exact CSP violation Google's pages
     * would throw). The kernel-core idiom applies, policy-first: when the
     * trustedTypes API exists, mint a createHTML policy (unique name so a
     * co-installed sibling's policy can never collide) and parse the typed
     * value; the bare parse survives only as the no-API fallback.
     * Read-only parse into a detached document — nothing is ever inserted
     * into the live DOM (the sink-census adjudication). */
    const parseDriveHtml = (html) => {
        /* Policy-first when the TT API exists: a bare parseFromString on
         * an ENFORCING host throws AND fires a securitypolicyviolation
         * report (the live smoke asserts zero of those) — so the bare
         * form is only the no-API fallback, never an attempt-then-
         * fallback. Policy-name exhaustion (CSP-locked regimes) falls
         * through to the bare attempt, which fails loudly and degrades
         * the resolver to its redirect/plain modes (fail-closed). */
        try {
            if (window.trustedTypes && typeof window.trustedTypes.createPolicy === 'function') {
                /* kernel-core convention: the policy handle is `tt`, so
                 * the parse route reads tt.createHTML(…) — the suite's
                 * sanctioned TT-wrap shape (sink-census SANCTIONED_PARSE_ARG). */
                const tt = window.trustedTypes.createPolicy(
                    '4ndr0-gpd-parse-' + String(Date.now() % 100000),
                    { createHTML: (s) => s }
                );
                return new DOMParser().parseFromString(tt.createHTML(html), 'text/html');
            }
        } catch (policyError) {
            logError('parseDriveHtml.policy', policyError);
        }
        try {
            return new DOMParser().parseFromString(html, 'text/html');
        } catch (bareError) {
            logError('parseDriveHtml', bareError);
            return null;
        }
    };

    const findDriveConfirmForm = (root) => {
        try {
            if (!root || !root.querySelector) return null;
            return root.querySelector(
                'form#uc-form, form[action*="/download"], form[action*="confirm"]'
            );
        } catch (error) {
            logError('findDriveConfirmForm', error);
            return null;
        }
    };

    const buildDirectFromForm = (form) => {
        try {
            if (!form || !form.getAttribute) return null;
            const action = form.getAttribute('action') || '';
            if (!action) return null;
            const url = new URL(action, 'https://drive.google.com/');
            for (const input of form.querySelectorAll('input[type="hidden"]')) {
                const name = input.getAttribute('name');
                if (name) url.searchParams.set(name, input.value || '');
            }
            /* The scan-warning ack: Google's own button posts confirm=t;
             * interstitials that omit the hidden field still honor it. */
            if (!url.searchParams.has('confirm')) url.searchParams.set('confirm', 't');
            const out = url.toString();
            return /^https:\/\/[a-z0-9.-]*googleusercontent\.com\//i.test(out) ||
                /^https:\/\/[a-z0-9.-]*google\.com\//i.test(out) ? out : null;
        } catch (error) {
            logError('buildDirectFromForm', error);
            return null;
        }
    };

    const resolveDriveTrueDirect = async (fileId) => {
        const probeUrl = buildDriveDirectLink(fileId);
        /* checkStatus:false — the probe's verdict is BY SHAPE (HTML vs
         * redirect), and a 4xx from a dead share must reach the caller as
         * a typed error it can narrate, not a swallowed rejection. */
        const res = await __4NDR0_NET_API__.gmFetch(probeUrl, {
            timeout: 15000,
            retries: 1,
            checkStatus: false
        });
        const headers = String(res.responseHeaders || '');
        const body = String(res.responseText || '');
        const isHtml = /content-type:\s*text\/html/i.test(headers) ||
            /^\s*<(?:!doctype|html)\b/i.test(body);
        if (isHtml) {
            const doc = parseDriveHtml(body);
            const form = doc ? findDriveConfirmForm(doc) : null;
            const direct = form ? buildDirectFromForm(form) : null;
            if (direct) return { url: direct, mode: 'form' };
        }
        /* Redirected straight through (small/scannable share): the
         * transport already followed the hops — finalUrl is the file. */
        if (res.finalUrl && res.finalUrl !== probeUrl) {
            return { url: res.finalUrl, mode: 'redirect' };
        }
        return { url: probeUrl, mode: 'plain' };
    };

    const mountResolveTrueDirectButton = (content, hud, fileId) => {
        const btn = makeGlassButton('[#] Resolve True Direct', () => {
            if (btn.disabled) return;
            btn.disabled = true;
            const label = btn.textContent;
            btn.textContent = '[~] Resolving\u2026';
            resolveDriveTrueDirect(fileId).then((r) => {
                driveResolvedCache = { id: fileId, url: r.url };
                showNotification(
                    r.mode === 'form' ? 'TRUE DIRECT RESOLVED \u00b7 CONFIRM FORM PARSED' :
                    r.mode === 'redirect' ? 'TRUE DIRECT RESOLVED \u00b7 REDIRECT FOLLOWED' :
                    'DIRECT LINK ANSWERED PLAIN \u00b7 NO INTERSTITIAL');
                hud.remove();
                displayDriveLinks();
            }).catch((error) => {
                const kind = error && error.kind ? error.kind : 'transport';
                showNotification(`TRUE-DIRECT PROBE FAILED \u00b7 ${String(kind).toUpperCase()}`);
                logError('resolveDriveTrueDirect', error);
                btn.disabled = false;
                btn.textContent = label;
            });
        });
        btn.title = 'Privileged probe of the uc?export=download hop \u2014 follows the redirect chain and parses the large-file confirm interstitial (kernel gmFetch, 15 s hard timeout)';
        return btn;
    };

    const displayDriveLinks = () => {
        try {
            const fileId = detectDriveFileId(window.location.href);
            const existing = document.getElementById(DRIVE_HUD_ID);

            if (!fileId) {
                if (existing) existing.remove();
                return;
            }
            if (existing) {
                existing.style.display = settings.driveHud ? '' : 'none';
                return;
            }
            if (!settings.driveHud || !document.body) return;

            /* v8.1.0: the direct link is RESOLVED when a source is known —
             * the interstitial page's own form (zero fetch, this document
             * IS the confirm page), or a cached probe result from this
             * session (HUD re-mounts after SPA hops keep it). Otherwise
             * the plain uc? hop ships with its resolver button. */
            const liveForm = findDriveConfirmForm(document);
            const preResolved = liveForm ? buildDirectFromForm(liveForm) : null;
            const cachedResolved = driveResolvedCache && driveResolvedCache.id === fileId
                ? driveResolvedCache.url : null;
            const resolvedUrl = preResolved || cachedResolved;
            const directLink = resolvedUrl || buildDriveDirectLink(fileId);

            const hud = document.createElement('div');
            hud.id = DRIVE_HUD_ID;
            hud.className = 'psi-glass-window';
            applyHudPosition(hud, 'driveHud', { x: 20, y: 20 });

            const headerbar = document.createElement('div');
            headerbar.className = 'psi-glass-headerbar';
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = 'Ψ DRIVE DIRECT';
            title.style.fontSize = '11pt';
            const subtitle = document.createElement('div');
            subtitle.className = 'subtitle';
            subtitle.textContent = `v${SCRIPT_VERSION}`;
            const collapseBtn = makeHeaderButton('—', () => {
                const entry = getHudEntry('driveHud', { x: 20, y: 20, collapsed: false });
                const merged = setHudEntry('driveHud', { collapsed: !entry.collapsed });
                syncHudCollapsed(hud, merged.collapsed, collapseBtn);
            }, 'Collapse drive panel');
            const closeBtn = makeHeaderButton('×', () => {
                setSetting('driveHud', false);
            }, 'Stow drive panel (settings re-engage)');
            headerbar.append(title, subtitle, collapseBtn, closeBtn);

            const content = document.createElement('div');
            content.className = 'psi-glass-content';

            const idPanel = document.createElement('div');
            idPanel.className = 'psi-glass-panel';
            idPanel.textContent = `ID ${fileId}`;
            idPanel.title = 'Google Drive file id';
            if (resolvedUrl) {
                const srcNote = document.createElement('div');
                srcNote.className = 'psi-glass-label';
                srcNote.style.cssText = 'margin-top:4px;color:#00E5FF;';
                srcNote.textContent = preResolved
                    ? '\u03a8 TRUE DIRECT \u00b7 CONFIRM FORM IN THIS PAGE'
                    : '\u03a8 TRUE DIRECT \u00b7 RESOLVED THIS SESSION';
                srcNote.title = 'The confirm interstitial was parsed into the real drive.usercontent.google.com link \u2014 no uc? hop on copy/download';
                idPanel.appendChild(srcNote);
            }
            content.appendChild(idPanel);

            content.appendChild(makeGlassButton('[=] Copy Direct URL', () => {
                copyToClipboard(directLink);
            }));

            const downloadBtn = makeGlassButton('[>] Direct Download', () => {
                window.open(directLink, '_blank', 'noopener');
            });
            downloadBtn.title = resolvedUrl
                ? 'Opens the resolved true-direct link'
                : 'Opens uc?export=download \u2014 large files may hit a Google confirm interstitial (Resolve True Direct pre-empts it)';
            content.appendChild(downloadBtn);

            if (!resolvedUrl) {
                content.appendChild(mountResolveTrueDirectButton(content, hud, fileId));
            }

            hud.append(headerbar, content);
            attachDragHandlers(hud, 'driveHud');

            const entry = getHudEntry('driveHud', { x: 20, y: 20, collapsed: false });
            syncHudCollapsed(hud, entry.collapsed, collapseBtn);

            document.body.appendChild(hud);
        } catch (error) {
            logError('displayDriveLinks', error);
        }
    };

    /**
     * MODULE 8 — Clipboard bridge: navigator.clipboard when available,
     * execCommand fallback otherwise; kernel feedback on both outcomes.
     */
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '-1000px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            }
            const preview = text.length > 48 ? `${text.slice(0, 45)}...` : text;
            showNotification(`CLIPBOARD ← ${preview}`);
            return true;
        } catch (error) {
            logError('copyToClipboard', error);
            showNotification('CLIPBOARD WRITE DENIED');
            return false;
        }
    };

    /* ========================================================================
     * MODULE 10 — Ψ CONTROL settings console: spec switch toggles for every
     * live setting, destructive reset surface, hotkey legend, Esc-to-close.
     * State changes broadcast through the settings event bus so every HUD
     * re-syncs without a reload.
     * ==================================================================== */
    const SETTINGS_HUD_ID = '4ndr0-settings-console';

    const SETTINGS_SCHEMA = [
        { key: 'contextMenuUnlock', label: 'CTX MENU UNLOCK' },
        { key: 'autoDirectLink', label: 'AUTO s0 DIRECT' },
        { key: 'osintHud', label: 'OSINT RECON HUD' },
        { key: 'driveHud', label: 'DRIVE DIRECT HUD' },
        { key: 'notifications', label: 'KERNEL NOTICES' },
        { key: 'hotkeys', label: 'POWER HOTKEYS' }
    ];

    const closeSettingsConsole = () => {
        const consoleEl = document.getElementById(SETTINGS_HUD_ID);
        if (!consoleEl) return false;
        consoleEl.remove();
        return true;
    };

    const buildSettingsConsole = () => {
        const panel = document.createElement('div');
        panel.id = SETTINGS_HUD_ID;
        panel.className = 'psi-glass-window';
        applyHudPosition(panel, 'settingsConsole', { x: Math.max(20, window.innerWidth - 340), y: 80 });

        const headerbar = document.createElement('div');
        headerbar.className = 'psi-glass-headerbar';
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = 'Ψ CONTROL';
        title.style.fontSize = '11pt';
        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = `v${SCRIPT_VERSION}`;
        const closeBtn = makeHeaderButton('×', () => {
            closeSettingsConsole();
        }, 'Close control console (Esc)');
        headerbar.append(title, subtitle, closeBtn);

        const content = document.createElement('div');
        content.className = 'psi-glass-content';

        for (const schema of SETTINGS_SCHEMA) {
            const row = document.createElement('div');
            row.className = 'psi-glass-row';

            const label = document.createElement('span');
            label.className = 'psi-glass-label';
            label.textContent = schema.label;

            const switchLabel = document.createElement('label');
            switchLabel.className = 'psi-glass-switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.key = schema.key;
            input.checked = settings[schema.key];
            input.addEventListener('change', () => {
                setSetting(schema.key, input.checked);
            });
            const trough = document.createElement('span');
            trough.className = 'trough';
            switchLabel.append(input, trough);

            row.append(label, switchLabel);
            content.appendChild(row);
        }

        content.appendChild(makeGlassButton('[X] RESET DEFAULTS', () => {
            resetSettings();
            syncSettingsConsole();
            showNotification('SETTINGS PURGED TO DEFAULTS');
        }, true));

        const hint = document.createElement('div');
        hint.className = 'psi-glass-label';
        hint.style.opacity = '0.7';
        hint.textContent = 'S console · O hud · C copy · F full-res · R lens · D drive-dl';
        content.appendChild(hint);

        panel.append(headerbar, content);
        attachDragHandlers(panel, 'settingsConsole');
        return panel;
    };

    const toggleSettingsConsole = () => {
        try {
            if (closeSettingsConsole()) return;
            if (!document.body) return;
            document.body.appendChild(buildSettingsConsole());
        } catch (error) {
            logError('toggleSettingsConsole', error);
        }
    };

    const syncSettingsConsole = () => {
        const panel = document.getElementById(SETTINGS_HUD_ID);
        if (!panel) return;
        for (const schema of SETTINGS_SCHEMA) {
            const input = panel.querySelector(`input[data-key="${schema.key}"]`);
            if (input) input.checked = settings[schema.key];
        }
    };

    /* ========================================================================
     * MODULE 9 — Power-user hotkey engine. Plain keys on static
     * googleusercontent image pages; Alt-combos on Photos/Drive so native
     * app shortcuts are never shadowed. Esc always closes the console.
     *   S console · O osint hud · C copy direct · F full-res · R lens · D dl
     * ==================================================================== */
    const isEditableTarget = (target) => {
        if (!target || !target.tagName) return false;
        const tag = target.tagName.toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true;
    };

    const activeDirectUrl = () => {
        const host = window.location.hostname;
        if (isAllowedHost(host, 'googleusercontent.com')) {
            return normalizeImageUrl(window.location.href);
        }
        if (host === 'photos.google.com') {
            return getCurrentPhotoUrl();
        }
        if (isAllowedHost(host, 'drive.google.com')) {
            const fileId = detectDriveFileId(window.location.href);
            if (fileId) return buildDriveDirectLink(fileId);
        }
        return null;
    };

    const openCurrentPhotoFullRes = () => {
        const photoUrl = getCurrentPhotoUrl();
        if (photoUrl) {
            window.open(photoUrl, '_blank', 'noopener');
            showNotification('FULL RESOLUTION VECTORED');
        } else {
            showNotification('NO VIEWER TARGET ACQUIRED');
        }
    };

    const reverseSearchCurrent = () => {
        const host = window.location.hostname;
        let targetUrl = null;
        if (isAllowedHost(host, 'googleusercontent.com')) {
            targetUrl = normalizeImageUrl(window.location.href);
        } else if (host === 'photos.google.com') {
            targetUrl = getCurrentPhotoUrl();
        }
        if (targetUrl) {
            window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(targetUrl)}`, '_blank', 'noopener');
            showNotification('LENS RECON VECTORED');
        } else {
            showNotification('NO RECON TARGET ACQUIRED');
        }
    };

    const triggerDriveDirect = () => {
        const fileId = detectDriveFileId(window.location.href);
        if (fileId) {
            window.open(buildDriveDirectLink(fileId), '_blank', 'noopener');
            showNotification('DRIVE DIRECT DOWNLOAD VECTORED');
        } else {
            showNotification('NO DRIVE FILE TARGET — OPEN A /file/d/ PAGE');
        }
    };

    const hotkeyEngine = () => {
        try {
            window.addEventListener('keydown', (event) => {
                if (!settings.hotkeys) return;

                if (event.key === 'Escape') {
                    if (closeSettingsConsole()) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                    return;
                }
                if (event.ctrlKey || event.metaKey) return;
                if (isEditableTarget(event.target)) return;

                const host = window.location.hostname;
                const isImagePage = Boolean(document.contentType && document.contentType.startsWith('image/'));
                const plainKeysAllowed = isAllowedHost(host, 'googleusercontent.com') && isImagePage;
                if (plainKeysAllowed ? event.altKey : !event.altKey) return;

                const key = event.key.toLowerCase();
                let handled = false;

                if (key === 'g') { // v8.0.2: was 's' — Alt+S is ModelSearch's suite-wide (hotkey census)
                    toggleSettingsConsole();
                    handled = true;
                } else if (key === 'o') {
                    if (plainKeysAllowed) {
                        setSetting('osintHud', !settings.osintHud);
                        showNotification(`OSINT HUD ${settings.osintHud ? 'ENGAGED' : 'STOWED'}`);
                        handled = true;
                    }
                } else if (key === 'c') {
                    const directUrl = activeDirectUrl();
                    if (directUrl) {
                        copyToClipboard(directUrl);
                        handled = true;
                    }
                } else if (key === 'f') {
                    if (host === 'photos.google.com') {
                        openCurrentPhotoFullRes();
                        handled = true;
                    }
                } else if (key === 'v') { // v8.0.2: was 'r' — Alt+R is PageCraft's suite-wide (hotkey census; "reVerse")
                    if (host === 'photos.google.com' || plainKeysAllowed) {
                        reverseSearchCurrent();
                        handled = true;
                    }
                } else if (key === 'd') {
                    if (isAllowedHost(host, 'drive.google.com')) {
                        triggerDriveDirect();
                        handled = true;
                    }
                }

                if (handled) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }, true);
        } catch (error) {
            logError('hotkeyEngine', error);
        }
    };

    /**
     * MODULE 10.7 — Tampermonkey menu surface (granted managers only).
     */
    const registerMenuCommands = () => {
        try {
            if (typeof GM_registerMenuCommand !== 'function') return;
            GM_registerMenuCommand('Ψ Settings console [G / Alt+G]', () => {
                toggleSettingsConsole();
            });
            GM_registerMenuCommand('Ψ Toggle OSINT HUD [O]', () => {
                setSetting('osintHud', !settings.osintHud);
                showNotification(`OSINT HUD ${settings.osintHud ? 'ENGAGED' : 'STOWED'}`);
            });
            GM_registerMenuCommand('Ψ Reset settings', () => {
                resetSettings();
                syncSettingsConsole();
                showNotification('SETTINGS PURGED TO DEFAULTS');
            });
        } catch (error) {
            logError('registerMenuCommands', error);
        }
    };

    /**
     * MODULE 10.5 — SPA route patch: wraps history.pushState/replaceState
     * and listens to popstate so Drive's client-side navigation re-syncs
     * the Drive HUD (mount on /file/d/ routes, unmount on departure).
     */
    const initSpaNavigationPatch = () => {
        try {
            let hudSyncTimer = null;
            const scheduleHudSync = () => {
                if (hudSyncTimer) clearTimeout(hudSyncTimer);
                hudSyncTimer = setTimeout(() => {
                    hudSyncTimer = null;
                    try {
                        displayDriveLinks();
                    } catch (error) {
                        logError('initSpaNavigationPatch.hudSync', error);
                    }
                }, 250);
            };

            const wrapHistoryMethod = (methodName) => {
                const native = history[methodName];
                if (typeof native !== 'function') return;
                history[methodName] = function (...args) {
                    const result = native.apply(this, args);
                    scheduleHudSync();
                    return result;
                };
            };

            wrapHistoryMethod('pushState');
            wrapHistoryMethod('replaceState');
            window.addEventListener('popstate', scheduleHudSync);
        } catch (error) {
            logError('initSpaNavigationPatch', error);
        }
    };

    /* ========================================================================
     * MODULE 11 — Initialization vector: phased boot (document-start safe
     * listener attachment, body-gated DOM surfaces), baseline dispatch
     * order preserved, settings event bus wiring.
     * ==================================================================== */
    const isAllowedHost = (host, domain) => host === domain || host.endsWith(`.${domain}`)
        /* Live-smoke harness regime (v8.1.0): the GUP harness serves
         * platform pages as <domain>.127-0-0-1.sslip.io (sslip wildcard
         * DNS) — the same form PM's detectPlatform and Watermark's gemini
         * gate match naturally via hostname.includes(). Recognized here
         * EXACTLY (the domain label followed by the sslip dashed-IP
         * suffix and nothing else) so the true-direct + HUD regimes run
         * without loosening the production suffix rule: a spoofer
         * (drive.google.com.evil.tld / …sslip.io.evil.tld) fails the
         * anchored IP-tail test. */
        || (host.startsWith(`${domain}.`)
            && /^\d{1,3}(-\d{1,3}){3}\.sslip\.io$/.test(host.slice(domain.length + 1)));

    const initialize = () => {
        try {
            injectStyles();
            printBootBanner();
            removeContextMenuBlockers();
            initSpaNavigationPatch();
            hotkeyEngine();
            registerMenuCommands();

            const currentHost = window.location.hostname;
            const isImage = Boolean(document.contentType && document.contentType.startsWith('image/'));
            const onGusercontent = isAllowedHost(currentHost, 'googleusercontent.com');
            const onGoogle = isAllowedHost(currentHost, 'google.com');

            const mountDomSurfaces = () => {
                try {
                    if (onGusercontent && isImage) {
                        if (settings.autoDirectLink) {
                            getDirectPhotoLink();
                        }
                        displaySearchLinks();
                    }
                    if (isAllowedHost(currentHost, 'drive.google.com')) {
                        displayDriveLinks();
                    }
                    if (onGoogle || onGusercontent) {
                        showNotification(`3LECTRIC-GLASS OVERRIDE ENGAGED · v${SCRIPT_VERSION}`);
                    }
                } catch (error) {
                    logError('mountDomSurfaces', error);
                }
            };

            if (document.body) {
                mountDomSurfaces();
            } else {
                document.addEventListener('DOMContentLoaded', mountDomSurfaces, { once: true });
            }

            settingsChanged(() => {
                displaySearchLinks();
                displayDriveLinks();
                syncSettingsConsole();
            });
        } catch (error) {
            logError('initialize', error);
        }
    };

    initialize();
})();
