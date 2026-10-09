// ==UserScript==
// @name        4ndr0tools - GoFile++
// @namespace    https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.2.0
// @description Directly batch-download GoFiles with a robust UI. Supports recursive folder scans, direct links, and download managers (Aria2, IDM). Fixing SPA persistence and Sandbox access.
// @match       *://gofile.io/*
// @icon        data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @connect     api.gofile.io
// @connect     localhost
// @connect     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @license     UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Gofile++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Gofile++.user.js
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

// 2.1.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Gofile++.user v2.1.1 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px;');


; (function () {
    'use strict'

    const SUPPORTED_DOWNLOADERS = ['Direct', 'ABDM', 'Aria2', 'IDM']

    const DEFAULT_LANGUAGE = 'en-US'
    const CRLF = '\r\n'

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'
    const GE_GORM_ID_PREFIX = 'GofileEnhanced_Form'

    const I18N = {
        'zh-CN': {
            abdm_connected: 'ABDM 连接成功',
            abdm_connection_fail: 'ABDM 连接失败',
            abdm_download_folder: 'ABDM 下载目录',
            abdm_download_folder_placeholder: '若留空则使用 ABDM 默认设置',
            abdm_port: 'ABDM 端口',
            abdm_port_not_configured: 'ABDM 端口未配置',
            abdm_port_placeholder: '默认为 15151',
            abdm_settings: ' AB Download Manager 设置',
            are_you_sure_to_download__these_files: '确定要下载下列文件吗？',
            aria2_connected: 'Aria2 连接成功',
            aria2_connection_fail: 'Aria2 连接失败',
            aria2_rpc_address: 'Aria2 RPC 地址',
            aria2_rpc_address_placeholder: '默认为 http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC 密钥',
            aria2_rpc_secret_placeholder: '若未设置留空即可',
            aria2_rpc_dir: 'Aria2 下载目录',
            aria2_rpc_dir_placeholder: '若留空则使用 Aria2 默认设置',
            aria2_settings: 'Aria2 设置',
            cancel: '取消',
            config: '配置',
            confirm: '确定',
            download_all: '下载全部',
            download_selected: '下载选中',
            empty_folder: '文件夹为空',
            empty_folder_description: '当前文件夹内容为空',
            error: '错误',
            export_all: '导出全部',
            export_selected: '导出选中',
            failed_to_fetch_folder_content: '获取文件夹内容失败',
            failed_to_send_to_abdm: '未成功发送至 ABDM',
            failed_to_send_to_aria2: '未成功发送至 Aria2',
            fetching_file_list: '正在获取文件列表',
            loading: '加载中...',
            loading_file_list: '正在加载文件列表',
            loading_please_wait: '正在加载，请稍候',
            no_file_selected: '未选择文件',
            no_file_selected_description: '请至少选择一个文件',
            please_make_sure_you_have_configured_download_folder: '请确保已正确配置下载目录。',
            recursive_download: '递归下载',
            reset_aria2: '重置 Aria2',
            send_all: '发送全部',
            send_selected: '发送选中',
            success: '成功',
            successfully_fetched_file_list: '成功获取文件列表',
            successfully_reset: '已重置',
            successfully_sent_to_abdm: '已成功发送至 ABDM',
            successfully_sent_to_aria2: '已成功发送至 Aria2',
            test_abdm: '测试 ABDM',
            test_aria2: '测试 Aria2',
            unknown_error: '未知错误',
            unsupported_format: '不支持的格式',
            request_aborted: '请求中断',
            request_timed_out: '请求超时',
        },
        'en-US': {
            abdm_connected: 'ABDM connected successfully',
            abdm_connection_fail: 'ABDM connection failed',
            abdm_download_folder: 'ABDM Download Folder',
            abdm_download_folder_placeholder: 'Leave empty to use ABDM default settings',
            abdm_port: 'ABDM Port',
            abdm_port_not_configured: 'ABDM port not configured',
            abdm_port_placeholder: 'Default is 15151',
            abdm_settings: 'AB Download Manager Settings',
            are_you_sure_to_download__these_files: 'Are you sure you want to download the following files?',
            aria2_connected: 'Aria2 connected successfully',
            aria2_connection_fail: 'Aria2 connection failed',
            aria2_rpc_address: 'Aria2 RPC Address',
            aria2_rpc_address_placeholder: 'Default is http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC Secret',
            aria2_rpc_secret_placeholder: 'Leave empty if not set',
            aria2_rpc_dir: 'Aria2 RPC Directory',
            aria2_rpc_dir_placeholder: 'Leave empty to use Aria2 default settings',
            aria2_settings: 'Aria2 Settings',
            cancel: 'Cancel',
            config: 'Config',
            confirm: 'Confirm',
            download_all: 'Download All',
            download_selected: 'Download Selected',
            empty_folder: 'Empty Folder',
            empty_folder_description: 'The current folder is empty',
            error: 'Error',
            export_all: 'Export All',
            export_selected: 'Export Selected',
            failed_to_fetch_folder_content: 'Failed to fetch folder content',
            failed_to_send_to_abdm: 'Failed to send to ABDM',
            failed_to_send_to_aria2: 'Failed to send to Aria2',
            fetching_file_list: 'Fetching file list',
            loading: 'Loading...',
            loading_file_list: 'Loading file list',
            loading_please_wait: 'Loading, please wait',
            no_file_selected: 'No File Selected',
            no_file_selected_description: 'Please select at least one file',
            please_make_sure_you_have_configured_download_folder: 'Please make sure you have configured the download folder.',
            reset_aria2: 'Reset Aria2',
            recursive_download: 'Recursive Download',
            send_all: 'Send All',
            send_selected: 'Send Selected',
            success: 'Success',
            successfully_fetched_file_list: 'Successfully fetched file list',
            successfully_reset: 'successfully reset',
            successfully_sent_to_abdm: 'successfully sent to ABDM',
            successfully_sent_to_aria2: 'successfully sent to Aria2',
            test_abdm: 'Test ABDM',
            test_aria2: 'Test Aria2',
            unknown_error: 'Unknown Error',
            unsupported_format: 'Unsupported Format',
            request_aborted: 'Request Aborted',
            request_timed_out: 'Request Timed Out',
            abdm_not_configured: 'ABDM port not configured',
        },
    }

    const ICONS = {
        circle_down_s: 'fas fa-circle-down',
        circle_down_r: 'far fa-circle-down',
        circle_nodes_s: 'fas fa-circle-nodes',
        copy_s: 'fas fa-copy',
        copy_r: 'far fa-copy',
        file_s: 'fas fa-file',
        file_r: 'far fa-file',
        file_ziper_s: 'fas fa-file-zipper',
        file_ziper_r: 'far fa-file-zipper',
        folder_s: 'fas fa-folder',
        folder_r: 'far fa-folder',
        gear_s: 'fas fa-gear',
        google_plus: 'fa-brands fa-google-plus',
        key_s: 'fas fa-key',
        link_s: 'fas fa-link',
        plane_s: 'fas fa-paper-plane',
        plane_r: 'far fa-paper-plane',
        plug_s: 'fas fa-plug',
        rotate_left_s: 'fas fa-rotate-left',
    }

    /* ═══ UI LAYER (v2.1.0 — restored) ═════════════════════════════════════════
     * The v2.0.0 rewrite referenced createNotification / createAlert /
     * createPopup / closePopup / getContent but never defined them — every
     * button action died on a ReferenceError before reaching its fetch.
     * Restored here in the suite's electric-glass idiom, self-contained
     * (no grants beyond the existing set: a <style> element + fixed
     * z-index layer do the job). */
    const GE_UI_STYLE_ID = 'GofileEnhanced_UILayer';
    const GE_UI_CSS = `
        #GofileEnhanced_Layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
        #GofileEnhanced_Layer > * { pointer-events: auto; }
        .ge-modal-backdrop {
            position: fixed; inset: 0; background: rgba(10, 19, 26, 0.72);
            backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
            animation: geFadeIn 0.18s ease-out;
        }
        .ge-modal {
            width: min(560px, calc(100vw - 48px)); max-height: calc(100vh - 96px); overflow: auto;
            background: rgba(10, 19, 26, 0.97); border: 1px solid #00E5FF; border-radius: 10px;
            transition: all 150ms ease-in-out;
            box-shadow: 0 0 32px rgba(0, 229, 255, 0.25); color: #67E8F9;
            font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px;
        }
        .ge-modal-head {
            display: flex; align-items: center; gap: 10px; padding: 14px 18px;
            border-bottom: 1px solid rgba(0, 229, 255, 0.35); color: #00E5FF;
            font-weight: 700; letter-spacing: 0.5px; position: sticky; top: 0;
            background: rgba(10, 19, 26, 0.97); z-index: 1;
        }
        .ge-modal-close {
            margin-left: auto; cursor: pointer; color: #ff0055; font-size: 18px; line-height: 1;
            padding: 2px 8px; border-radius: 4px; border: none; background: none;
        }
        .ge-modal-close:hover { color: #ff0055; }
        .ge-modal-body { padding: 16px 18px; }
        .ge-modal-body a { color: #00E5FF; }
        .ge-spinner {
            width: 18px; height: 18px; border-radius: 50%; flex: none;
            border: 2px solid rgba(0, 229, 255, 0.25); border-top-color: #00E5FF;
            animation: geSpin 0.8s linear infinite;
        }
        #GofileEnhanced_Toasts {
            position: fixed; right: 20px; bottom: 20px; display: flex;
            flex-direction: column; gap: 10px; max-width: min(420px, calc(100vw - 40px));
        }
        .ge-toast {
            background: rgba(10, 15, 26, 0.96); color: #67E8F9; padding: 12px 16px;
            border-left: 3px solid #00E5FF; border-radius: 6px; font-size: 12.5px;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); animation: geSlideIn 0.25s ease-out;
        }
        .ge-toast .ge-toast-title { font-weight: 700; color: #00E5FF; margin-bottom: 3px; }
        .ge-toast.ge-success { border-left-color: #00E5FF; }
        .ge-toast.ge-success .ge-toast-title { color: #00E5FF; }
        .ge-toast.ge-error { border-left-color: #ff0055; }
        .ge-toast.ge-error .ge-toast-title { color: #ff0055; }
        .ge-toast.ge-warning { border-left-color: #67E8F9; }
        .ge-toast.ge-warning .ge-toast-title { color: #67E8F9; }
        @keyframes geSpin { to { transform: rotate(360deg); } }
        @keyframes geFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes geSlideIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    `;

    function ensureUiLayer() {
        if (!document.getElementById(GE_UI_STYLE_ID)) {
            const style = document.createElement('style');
            style.id = GE_UI_STYLE_ID;
            style.textContent = GE_UI_CSS;
            document.head.appendChild(style);
        }
        let layer = document.getElementById('GofileEnhanced_Layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'GofileEnhanced_Layer';
            const toasts = document.createElement('div');
            toasts.id = 'GofileEnhanced_Toasts';
            layer.appendChild(toasts);
            document.documentElement.appendChild(layer);
        }
        return layer;
    }

    function createNotification(title, message, type = 'info') {
        ensureUiLayer();
        const toasts = document.querySelector('#GofileEnhanced_Toasts');
        const toast = document.createElement('div');
        toast.className = `ge-toast ge-${type}`;
        const t = document.createElement('div');
        t.className = 'ge-toast-title';
        t.textContent = String(title || '');
        const m = document.createElement('div');
        m.textContent = String(message || '');
        toast.append(t, m);
        toasts.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            setTimeout(() => toast.remove(), 320);
        }, 4200);
    }

    function createAlert(type, message) {
        // Compact non-dismissable modal — closed by closePopup(). The
        // classic 'loading' spinner plus any status message.
        ensureUiLayer();
        closePopup();
        const backdrop = document.createElement('div');
        backdrop.className = 'ge-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'ge-modal';
        modal.style.width = 'auto';
        const head = document.createElement('div');
        head.className = 'ge-modal-head';
        if (type === 'loading') head.appendChild(Object.assign(document.createElement('span'), { className: 'ge-spinner' }));
        const title = document.createElement('span');
        title.textContent = String(message || '');
        head.appendChild(title);
        const body = document.createElement('div');
        body.className = 'ge-modal-body';
        modal.append(head, body);
        backdrop.appendChild(modal);
        document.getElementById('GofileEnhanced_Layer').appendChild(backdrop);
    }

    function createPopup({ title, content, icon } = {}) {
        ensureUiLayer();
        closePopup();
        const backdrop = document.createElement('div');
        backdrop.className = 'ge-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'ge-modal';
        const head = document.createElement('div');
        head.className = 'ge-modal-head';
        if (icon) {
            const i = document.createElement('i');
            i.className = icon;
            head.appendChild(i);
        }
        const t = document.createElement('span');
        t.textContent = String(title || '');
        head.appendChild(t);
        const close = document.createElement('button');
        close.className = 'ge-modal-close';
        close.textContent = '✕';
        close.title = 'Close';
        close.addEventListener('click', closePopup);
        head.appendChild(close);
        const body = document.createElement('div');
        body.className = 'ge-modal-body';
        // [R3] content is a Node or array of Nodes (trusted local markup
        // built element-side; the innerHTML string path is retired).
        body.append(...(Array.isArray(content) ? content : [content]).filter(Boolean));
        modal.append(head, body);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePopup(); });
        document.getElementById('GofileEnhanced_Layer').appendChild(backdrop);
        const onKey = (e) => { if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
        return modal;
    }

    function closePopup() {
        const layer = document.getElementById('GofileEnhanced_Layer');
        if (!layer) return;
        layer.querySelectorAll('.ge-modal-backdrop').forEach((el) => el.remove());
    }

    /** GoFile content fetch for the recursive scan (v2.1.0 — was missing
     *  entirely). Uses the page's website token when available, with the
     *  known public token as fallback, and carries the session cookie. */
    async function getContent(contentId) {
        const pageApp = (typeof appdata !== 'undefined' && appdata) ? appdata : null;
        const wt = (pageApp && pageApp.wt) ? pageApp.wt : '4fd6sg89d7s6';
        const res = await utils.gmFetch(`https://api.gofile.io/contents/${contentId}?wt=${wt}`, {
            headers: { Cookie: utils.getToken() },
        });
        return res.json();
    }


    const GE_CONFIG = {
        ABDM: {
            name: 'ABDM',
            id: 'ABDM',
            desc: 'AB Download Manager',
            homepage: 'https://github.com/amir1376/ab-download-manager',
            settings: {
                abdmPort: {
                    key: 'abdm_port',
                    defaultValue: '15151',
                    i18nKey: 'abdm_port',
                    icon: ICONS.plug_s,
                    placeholderI18nKey: 'abdm_port_placeholder',
                },
                abdmDownloadFolder: {
                    key: 'abdm_download_folder',
                    defaultValue: '',
                    i18nKey: 'abdm_download_folder',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'abdm_download_folder_placeholder',
                },
            },
        },
        Aria2: {
            name: 'Aria2',
            id: 'Aria2',
            desc: 'Aria2 RPC Interface',
            homepage: 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface',
            settings: {
                rpcAddress: {
                    key: 'aria2_rpc_address',
                    defaultValue: 'http://localhost:6800/jsonrpc',
                    i18nKey: 'aria2_rpc_address',
                    icon: ICONS.link_s,
                    placeholderI18nKey: 'aria2_rpc_address_placeholder',
                },
                rpcSecret: {
                    key: 'aria2_rpc_secret',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_secret',
                    icon: ICONS.key_s,
                    placeholderI18nKey: 'aria2_rpc_secret_placeholder',
                },
                rpcDir: {
                    key: 'aria2_rpc_dir',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_dir',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'aria2_rpc_dir_placeholder',
                },
            },
        },
    }

    /* Page-state accessor: `appdata` is gofile.io's Nuxt payload and may
     * not exist yet when our observer first fires — bare references throw
     * ReferenceError, so every read goes through this guard. */
    const pageApp = () => (typeof appdata !== 'undefined' && appdata) ? appdata : null

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        gmFetch(url, options = {}) {
            // v2.2.0 (suite v1.4.9): transport mechanics ride the kernel's
            // privileged gmFetch (__4NDR0_NET_API__, kernel/net.js v5.1) —
            // settle-once, grant feature-detection, the typed NetError
            // taxonomy, and a 20 s hard timeout (the baseline dispatched
            // with no timeout at all: a dead endpoint could hang the
            // recursive scan forever — GUP hard-timeout compliance; the
            // gofile API, the ADBM bridge, and aria2 RPC are all fast
            // localhost/LAN answers where 20 s is generous). Every status
            // still resolves; the fetch-Response facade below is preserved
            // byte-for-byte for callers (ok/status/statusText/url/text/
            // json/xml/raw).
            return __4NDR0_NET_API__.gmFetch(url, {
                method: options.method,
                headers: options.headers,
                data: options.body != null ? options.body : null,
                responseType: options.responseType,
                timeout: options.timeout != null ? options.timeout : 20000,
                checkStatus: false,
            }).then((response) => ({
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.statusText,
                url: response.finalUrl,
                text: () => Promise.resolve(response.responseText),
                json: () => Promise.resolve(JSON.parse(response.responseText)),
                xml: () => Promise.resolve(response.responseXML),
                raw: response,
            }))
        },
        getSettings(category, settingKey) {
            const setting = GE_CONFIG[category].settings[settingKey]
            return utils.getValue(setting.key) ?? setting.defaultValue
        },
        setSettings(category, settingKey, value) {
            const setting = GE_CONFIG[category].settings[settingKey]
            utils.setValue(setting.key, value)
        },
        getAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            return Object.keys(settings).reduce((acc, key) => {
                acc[key] = utils.getSettings(category, key)
                return acc
            }, {})
        },
        resetAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            Object.keys(settings).forEach((key) => {
                const setting = settings[key]
                utils.setValue(setting.key, setting.defaultValue)
                createNotification(utils.getTranslation('success'), `${utils.getTranslation(setting.i18nKey)} ${utils.getTranslation('successfully_reset')}`)
            })
        },
        initSettings() {
            Object.keys(GE_CONFIG).forEach((category) => {
                const settings = GE_CONFIG[category].settings
                Object.keys(settings).forEach((key) => {
                    const setting = settings[key]
                    if (utils.getValue(setting.key) === undefined) {
                        utils.setValue(setting.key, setting.defaultValue)
                    }
                })
            })
        },
        getTranslation(key) {
            const lang = I18N[navigator.language] ? navigator.language : DEFAULT_LANGUAGE
            return I18N[lang][key] || key
        },
        getToken: () => document.cookie,
        goDirectLinks(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        async collectAllItems() {
            createAlert('loading', utils.getTranslation('fetching_file_list'))

            const mainContentData = pageApp()?.fileManager?.mainContent?.data
            if (!mainContentData) { closePopup(); return { items: [] } }
            const tbdItems = []

            const collectItems = async (contentData, parentPath = '') => {
                if (contentData.childrenCount > 0) {
                    for (const key of Object.keys(contentData.children)) {
                        const childItem = contentData.children[key]

                        const currentPath = `${parentPath}/${contentData.name}`

                        if (childItem.type === 'file') {
                            tbdItems.push({ ...childItem, downloadFolder: currentPath })
                        } else if (childItem.type === 'folder') {
                            if (childItem.childrenCount === 0) {
                                continue
                            }
                            try {
                                // API
                                const res = await getContent(childItem.id)

                                if (res.status === 'ok') {
                                    const currentContentData = res.data
                                    await collectItems(currentContentData, currentPath)
                                } else {
                                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}: ${res.message || 'unknown'}`, 'error')
                                }
                            } catch (error) {
                                createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}`, 'error')
                            }
                        }
                    }
                }
            }

            await collectItems(mainContentData)
            closePopup()

            return { items: tbdItems }
        },
        recursiveDownload(tbdItems, callback) {
            const fileItems = tbdItems.map((item) => {
                return {
                    name: item.name,
                    path: item.downloadFolder || '',
                }
            })
            const fileList = fileItems.map((file) => {
                const p = document.createElement('p')
                p.append(`${file.path}/`)
                const nameSpan = document.createElement('span')
                nameSpan.className = 'text-blue-500'
                nameSpan.textContent = file.name
                p.appendChild(nameSpan)
                return p
            }).sort((a, b) => a.textContent.localeCompare(b.textContent))

            /* [R3] element-built popup body (was the HTML string above). */
            const popupWrap = document.createElement('div')
            popupWrap.className = 'space-y-4'
            const infoBox = document.createElement('div')
            infoBox.className = 'bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4'
            const infoRow = document.createElement('div')
            infoRow.className = 'flex items-center space-x-3'
            const infoIcon = document.createElement('i')
            infoIcon.className = 'fas fa-info-circle text-blue-400 text-xl'
            const infoText = document.createElement('p')
            infoText.className = 'text-gray-300 text-sm'
            const infoSpan1 = document.createElement('span')
            infoSpan1.textContent = utils.getTranslation('are_you_sure_to_download__these_files')
            const infoSpan2 = document.createElement('span')
            infoSpan2.textContent = utils.getTranslation('please_make_sure_you_have_configured_download_folder')
            infoText.append(infoSpan1, infoSpan2)
            infoRow.append(infoIcon, infoText)
            infoBox.appendChild(infoRow)
            const listForm = document.createElement('form')
            listForm.id = `${GE_GORM_ID_PREFIX}_FILE_LIST`
            listForm.className = 'space-y-4'
            for (const entry of fileList) listForm.appendChild(entry)
            const listSubmit = document.createElement('button')
            listSubmit.type = 'submit'
            listSubmit.className = 'w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ' +
                'ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2'
            const listSubmitIcon = document.createElement('i')
            listSubmitIcon.className = 'fas fa-check'
            const listSubmitText = document.createElement('span')
            listSubmitText.textContent = ` ${utils.getTranslation('confirm')} `
            listSubmit.append(listSubmitIcon, listSubmitText)
            listForm.appendChild(listSubmit)
            popupWrap.append(infoBox, listForm)
            createPopup({
                title: utils.getTranslation('successfully_fetched_file_list'),
                content: popupWrap,
                icon: ICONS.copy_s,
            })

            const form = document.forms[`${GE_GORM_ID_PREFIX}_FILE_LIST`]

            if (form) {
                form.addEventListener('submit', (event) => {
                    event.preventDefault()

                    callback()

                    closePopup()
                })
            }
        },
        sendToABDM(tbdItems) {
            const { abdmPort, abdmDownloadFolder } = utils.getAllSettings('ABDM')
            const cookie = utils.getToken()

            if (!abdmPort) {
                return createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_port_not_configured'), 'error')
            }

            const postDatas = tbdItems.map((item) => {
                return {
                    downloadSource: {
                        link: item.link,
                        headers: {
                            cookie,
                        },
                    },
                    name: item.name,
                    folder: item.downloadFolder || (abdmDownloadFolder === '' ? '/' : abdmDownloadFolder),
                }
            })

            // console.log('[GoFile Enhanced] Sending to ABDM:', postDatas)

            postDatas.forEach(async (data) => {
                try {
                    const res = await utils.gmFetch(`http://localhost:${abdmPort}/start-headless-download`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                    })
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), `${data.name} ${utils.getTranslation('successfully_sent_to_abdm')}`, 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${data.name} ${utils.getTranslation('failed_to_send_to_abdm')} / ${res.status} - ${res.statusText}`, 'error')
                        console.error('[GoFile Enhanced] Error sending to ABDM:', res)
                    }
                } catch (error) {
                    createNotification(utils.getTranslation('error'), `${data.name}  ${utils.getTranslation('failed_to_send_to_abdm')}`, 'error')
                    console.error('[GoFile Enhanced] Error sending to ABDM:', error)
                }
            })
        },
        async testABDMConnection() {
            const port = utils.getSettings('ABDM', 'abdmPort')

            if (port) {
                try {
                    const res = await utils.gmFetch(`http://localhost:${port}/ping`)
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), utils.getTranslation('abdm_connected'), 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${utils.getTranslation('abdm_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                    }
                } catch (e) {
                    createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_connection_fail'), 'error')
                }
            } else {
                createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_not_configured'), 'error')
            }
        },
        async testAria2Connection() {
            const { rpcAddress, rpcSecret } = utils.getAllSettings('Aria2')

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify({
                        id: new Date().getTime(),
                        jsonrpc: '2.0',
                        method: 'aria2.getVersion',
                        params: [`token:${rpcSecret}`],
                    }),
                })

                if (res.ok) {
                    createNotification(utils.getTranslation('success'), utils.getTranslation('aria2_connected'), 'success')
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('aria2_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('aria2_connection_fail'), 'error')
            }
        },
        async sendToAria2(tbdItems) {
            const { rpcAddress, rpcSecret, rpcDir } = utils.getAllSettings('Aria2')

            const cookie = utils.getToken()

            const header = [`Cookie: ${cookie}`]

            const rpcData = tbdItems.map((item) => {
                return {
                    id: crypto.randomUUID(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${rpcSecret}`,
                        [item.link],
                        {
                            header,
                            dir: item.downloadFolder || rpcDir,
                        },
                    ],
                }
            })

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify(rpcData),
                })

                if (res.ok) {
                    const responseArray = await res.json()

                    responseArray.forEach((item) => {
                        if (item.error) {
                            createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} / ${item.error.code} - ${item.error.message}`, 'error')
                        } else {
                            createNotification(utils.getTranslation('success'), `${utils.getTranslation('successfully_sent_to_aria2')} / ID: ${item.result}`)
                        }
                    })
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} /  ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('failed_to_send_to_aria2'), 'error')
            }
        },
        exportToIDM(tbdItems) {
            const cookie = utils.getToken()
            const IDMFormatContent = tbdItems
                .map((item) => {
                    return `<${CRLF}${item.link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                })
                .join('')

            utils.saveAsFile(IDMFormatContent, 'ef2')
        },
        saveAsFile(content, fileExtension) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const rootName = pageApp()?.fileManager?.mainContent?.data?.name
            link.download = `${rootName || 'gofile-export'}.${fileExtension}`
            link.click()
            URL.revokeObjectURL(url)
        },
        getHrLine() {
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')
            return hrLine
        },
        /* [R3] element-built button (was getButtonTemplate's HTML string). */
        getButtonTemplate(icon, text) {
            const anchor = document.createElement('a')
            anchor.href = 'javascript:void(0)'
            anchor.className = 'hover:text-blue-500 flex items-center gap-2'
            anchor.setAttribute('aria-label', text)
            const iconEl = document.createElement('i')
            iconEl.className = icon
            anchor.append(iconEl, ' ', text)
            return anchor
        },
        createButton(options = {}) {
            const { icon, text, onClick } = options

            const button = document.createElement('li')
            button.appendChild(utils.getButtonTemplate(icon, text))

            if (onClick) {
                button.addEventListener('click', onClick)
            }

            return button
        },
        getRegularButtons(format) {
            // Header
            const formatTitleElement = document.createElement('li')
            const formatTitleSpan = document.createElement('span')
            formatTitleSpan.className = 'flex items-center gap-2 text-blue-500 font-bold'
            const formatTitleIcon = document.createElement('i')
            formatTitleIcon.className = ICONS.google_plus
            formatTitleSpan.append(formatTitleIcon, ` ${format}`)
            formatTitleElement.appendChild(formatTitleSpan)

            let exportAllText, exportSelectedText, exportAllIcon, exportSelectedIcon

            switch (format) {
                case 'ABDM':
                case 'Aria2':
                    exportAllText = utils.getTranslation('send_all')
                    exportAllIcon = ICONS.plane_s
                    exportSelectedText = utils.getTranslation('send_selected')
                    exportSelectedIcon = ICONS.plane_r
                    break
                case 'IDM':
                    exportAllText = utils.getTranslation('export_all')
                    exportAllIcon = ICONS.file_s
                    exportSelectedText = utils.getTranslation('export_selected')
                    exportSelectedIcon = ICONS.file_r
                    break
                default:
                    exportAllText = utils.getTranslation('download_all')
                    exportAllIcon = ICONS.circle_down_s
                    exportSelectedText = utils.getTranslation('download_selected')
                    exportSelectedIcon = ICONS.circle_down_r
                    break
            }

            const exportAllButton = utils.createButton({
                text: exportAllText,
                icon: exportAllIcon,
                onClick: operations.handleExport.bind(null, {
                    selectMode: false,
                    format,
                }),
            })

            const exportSelectedButton = utils.createButton({
                text: exportSelectedText,
                icon: exportSelectedIcon,
                onClick: operations.handleExport.bind(null, {
                    selectMode: true,
                    format,
                }),
            })

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getSpecialButtons(downloader) {
            const additionalButtons = []

            const settingsPanleTitle = utils.getTranslation(`${downloader.toLowerCase()}_settings`)
            const settingsButton = utils.createButton({
                icon: ICONS.gear_s,
                text: `${utils.getTranslation('config')} ${downloader}`,
                onClick: () => {
                    createPopup({
                        title: settingsPanleTitle,
                        content: utils.getConfigPanel(downloader),
                        icon: ICONS.gear_s,
                    })

                    const form = document.forms[`${GE_GORM_ID_PREFIX}_${downloader}`]

                    if (form) {
                        form.addEventListener('submit', (event) => {
                            event.preventDefault()

                            Object.entries(GE_CONFIG[downloader].settings).forEach(([settingKey, _value]) => {
                                utils.setSettings(downloader, settingKey, form.elements[_value.key].value)
                            })

                            closePopup()
                        })
                    }
                },
            })

            const abdmRecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'ABDM',
                }),
            })

            const testABDMButton = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_abdm'),
                onClick: () => {
                    utils.testABDMConnection()
                },
            })

            const aria2RecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'Aria2',
                }),
            })

            const testAria2Button = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_aria2'),
                onClick: () => {
                    utils.testAria2Connection()
                },
            })

            const rpcResetButton = utils.createButton({
                icon: ICONS.rotate_left_s,
                text: utils.getTranslation('reset_aria2'),
                onClick: () => {
                    utils.resetAllSettings('Aria2')
                },
            })

            switch (downloader) {
                case 'ABDM':
                    additionalButtons.push(abdmRecursiveDownloadButton)
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testABDMButton)
                    break
                case 'Aria2':
                    additionalButtons.push(aria2RecursiveDownloadButton)
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testAria2Button)
                    additionalButtons.push(rpcResetButton)
                    break
                default:
                    break
            }

            return additionalButtons
        },
        getButtonsByDownloader(downloader) {
            const regularButtons = utils.getRegularButtons(downloader)

            const additionalButtons = utils.getSpecialButtons(downloader)

            return [utils.getHrLine(), ...regularButtons, ...additionalButtons]
        },
        /* [R3] element-built form item (was getFormInputItemTemplate's HTML string). */
        getFormInputItem(setting) {
            const { key, i18nKey, icon, placeholderI18nKey } = setting

            const wrap = document.createElement('div')
            wrap.className = 'space-y-2'
            const label = document.createElement('label')
            label.setAttribute('for', key)
            label.className = 'block text-sm font-medium text-gray-300'
            label.textContent = ' ' + utils.getTranslation(i18nKey) + ' '
            const relative = document.createElement('div')
            relative.className = 'relative'
            const iconBox = document.createElement('div')
            iconBox.className = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'
            const iconEl = document.createElement('i')
            iconEl.className = icon + ' text-gray-400'
            iconBox.appendChild(iconEl)
            const input = document.createElement('input')
            input.type = 'text'
            input.id = key
            input.setAttribute('key', key)
            input.className = 'w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 ' +
                'focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 text-white placeholder-gray-400'
            input.value = utils.getValue(key)
            input.title = utils.getTranslation(placeholderI18nKey)
            relative.append(iconBox, input)
            wrap.append(label, relative)
            return wrap
        },
        /* [R3] element-built config panel (was an HTML string return). */
        getConfigPanel(category) {
            const config = GE_CONFIG[category]

            const wrap = document.createElement('div')
            wrap.className = 'space-y-4'
            const infoBox = document.createElement('div')
            infoBox.className = 'bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4'
            const infoRow = document.createElement('div')
            infoRow.className = 'flex items-center space-x-3'
            const infoIcon = document.createElement('i')
            infoIcon.className = 'fas fa-info-circle text-blue-400 text-xl'
            const infoText = document.createElement('p')
            infoText.className = 'text-gray-300 text-sm'
            const infoLink = document.createElement('a')
            infoLink.href = config.homepage
            infoLink.target = '_blank'
            infoLink.rel = 'noopener noreferrer'
            infoLink.textContent = ' ' + config.homepage + ' '
            infoText.appendChild(infoLink)
            infoRow.append(infoIcon, infoText)
            infoBox.appendChild(infoRow)
            const form = document.createElement('form')
            form.id = `${GE_GORM_ID_PREFIX}_${config.id}`
            form.className = 'space-y-4'
            for (const [, setting] of Object.entries(config.settings)) {
                form.appendChild(utils.getFormInputItem(setting))
            }
            const submit = document.createElement('button')
            submit.id = `GofileEnhanced_${config.id}_Submit`
            submit.type = 'submit'
            submit.className = 'w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ' +
                'ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2'
            const submitIcon = document.createElement('i')
            submitIcon.className = 'fas fa-check'
            const submitText = document.createElement('span')
            submitText.textContent = ` ${utils.getTranslation('confirm')} `
            submit.append(submitIcon, submitText)
            form.appendChild(submit)
            wrap.append(infoBox, form)
            return wrap
        },
    }

    const operations = {
        async handleExport(options) {
            const { selectMode, format, enableRecursion } = options
            const abdmDownloadFolder = utils.getSettings('ABDM', 'abdmDownloadFolder')
            const aria2RpcDir = utils.getSettings('Aria2', 'rpcDir')

            let tbdItems = []

            if (enableRecursion) {
                const { items } = await utils.collectAllItems()
                tbdItems = items
            } else {
                const pageData = pageApp()?.fileManager?.mainContent?.data
                if (!pageData) { return createNotification(utils.getTranslation('error'), utils.getTranslation('loading_please_wait'), 'warning') }
                const allFiles = pageData.children
                const selectedKeys = pageApp()?.fileManager?.contentsSelected || {}

                // all file keys or selected file keys
                const fileKeys = Object.keys(selectMode ? selectedKeys : allFiles)
                // to be downloaded keys
                const tbdKeys = fileKeys.filter((key) => allFiles[key].type === 'file')

                tbdItems = tbdKeys.map((key) => allFiles[key])
            }

            if (tbdItems.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('no_file_selected') : utils.getTranslation('empty_folder'),
                    selectMode ? utils.getTranslation('no_file_selected_description') : utils.getTranslation('empty_folder_description'),
                    'warning',
                )
            }

            switch (format) {
                case 'Direct':
                    utils.goDirectLinks(tbdItems.map((item) => item.link))
                    break
                case 'ABDM':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToABDM(tbdItems.map((item) => ({ ...item, downloadFolder: abdmDownloadFolder + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToABDM(tbdItems)
                    }
                    break
                case 'Aria2':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToAria2(tbdItems.map((item) => ({ ...item, downloadFolder: aria2RpcDir + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToAria2(tbdItems)
                    }
                    break
                case 'IDM':
                    utils.exportToIDM(tbdItems)
                    break
                default:
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('unsupported_format')}`, 'error')
                    break
            }
        },
        // add buttons to sidebar
        addContainerToSidebar() {
            // create container
            const container = document.createElement('ul')
            container.id = GE_CONTAINER_ID
            // 'border-t', 'border-gray-700', 'mt-4',
            container.classList.add('pt-4', 'space-y-4')

            // append buttons to container
            SUPPORTED_DOWNLOADERS.forEach((downloader) => {
                utils.getButtonsByDownloader(downloader).forEach((item) => {
                    container.appendChild(item)
                })
            })

            // append container to sidebar
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            utils.initSettings()

            // Observe changes in the DOM
            const observer = new MutationObserver((_mutations, _obs) => {
                // Check if the target node is available
                const container = document.getElementById(GE_CONTAINER_ID)

                // Check if the mainContent is available
                if (pageApp()?.fileManager?.mainContent?.data) {
                    // Add buttons to sidebar
                    !container && operations.addContainerToSidebar()
                    // Stop observing
                    // obs.disconnect()
                } else {
                    // remove GofileEnhanced_Container
                    container && container.remove()
                }
            })

            // Observe the target node "#index_main", which is in the DOM initially.
            const targetNode = document.getElementById('index_main')
            const config = { childList: true, subtree: true }
            if (targetNode) {
                observer.observe(targetNode, config)
            } else {
                /* [R3 boot hygiene] wrong-host diagnostic: the harness and
                 * non-gofile pages legitimately lack #index_main — a debug
                 * line, not an error (the live matrix boot gate requires a
                 * clean error channel on every host). */
                console.debug('[Gofile Enhanced] #index_main not found.')
            }
        },
    }

    // Script Entry Point
    main.init()
})()
