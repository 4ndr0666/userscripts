// ==UserScript==
// @name         4ndr0tools - Pixeldrain++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.2.0
// @description  Enhanced pixeldrain with multi-proxy parallel, streaming, adaptive chunking, aria2c.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Pixeldrain++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Pixeldrain++.user.js
// @match           https://pixeldrain.com/*
// @match           https://pixeldrain.net/*
// @match           https://pixeldrain.dev/*
// @match           https://pixeldra.in/*
// @run-at          document-start
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM_download
// @grant           GM_openInTab
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @grant           GM_notification
// @grant           GM_setClipboard
// @grant           unsafeWindow
// @connect         pixeldrain.com
// @connect         pixeldrain.net
// @connect         pixeldrain.dev
// @connect         pixeldra.in
// @connect         cdn.pixeldrain.eu.cc
// @connect         pixeldrain.eu.cc
// @connect         pd.1drv.eu.org
// @connect         pd.cybar.xyz
// @connect         pd.zeroken.id
// @connect         pd.hakimi.uk
// @connect         pd.512.gay
// @connect         pd.voidnet.tech
// @connect         pd.kanibal.xyz
// @connect         pd.arcjbtc.my.id
// @connect         pd.ramdani.cloud
// @connect         pd.noisyfox.io
// @connect         pd.meridian.pm
// @connect         pd.dwnld.workers.dev
// @connect         pd.itsmeonly.workers.dev
// @connect         pd.blazing.works
// @connect         pd.unblockit.click
// @connect         127.0.0.1
// @connect         localhost
// @connect         *
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

// 1.1.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Pixeldrain++.user v1.1.1 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px;');

/* eslint-disable no-undef */
(function () {
    'use strict';

    // ================================================================
    // 0. CONFIG & CONSTANTS
    // ================================================================
    const VERSION = '1.1.2';
    const NS = 'pdbp';

    /* [R3 createElement migration — suite v1.4.4] Local element builder:
     * every innerHTML template in this script is retired (settings panel,
     * modals, toasts, pills, export bodies, popup player). Same contract as
     * the kernel's Ψ.core.$new: variadic children (Nodes/strings/arrays,
     * null-skipped), style string-or-object, data-dash/aria-dash/role/class
     * via setAttribute, on-prefixed keys as listeners. Zero HTML-string
     * sinks — TT-immune by construction. */
    function el(tag, attrs, ...rest) {
        const node = document.createElement(tag);
        if (attrs) {
            for (const key of Object.keys(attrs)) {
                const val = attrs[key];
                if (val == null) continue;
                if (key === 'style' && typeof val === 'object') Object.assign(node.style, val);
                else if (key === 'class' || key.startsWith('data-') || key.startsWith('aria-') || key === 'role') node.setAttribute(key, String(val));
                else if (key.startsWith('on') && typeof val === 'function') node.addEventListener(key.slice(2), val);
                else if (key in node && typeof val !== 'string') node[key] = val;
                else node.setAttribute(key, String(val));
            }
        }
        const kids = [];
        for (const c of rest) { if (Array.isArray(c)) kids.push(...c); else kids.push(c); }
        for (const c of kids) {
            if (c == null) continue;
            node.append(c instanceof Node ? c : document.createTextNode(String(c)));
        }
        return node;
    }
    const BANDWIDTH_CAP = 6 * 1024 * 1024 * 1024;
    const SPEED_LIMIT_PER_CONN = 1048576; // 1 MB/s server-enforced per connection
    const RATE_LIMIT_MAX = 3000;
    const RECAPTCHA_SITEKEY = '6Lfbzz4UAAAAAAaBgox1R7jU0axiGneLDkOA-PKf';

    // Updated proxy listing containing active community mirrors
    const PROXY_MIRRORS = [
        { name: 'pixeldrain.eu.cc',     host: 'cdn.pixeldrain.eu.cc',       priority: 1,  range: true,  zip: true,  weight: 100 },
        { name: '1drv.eu.org',          host: 'pd.1drv.eu.org',             priority: 2,  range: true,  zip: false, weight: 90  },
        { name: 'cybar.xyz',            host: 'pd.cybar.xyz',               priority: 3,  range: true,  zip: false, weight: 85  },
        { name: 'zeroken.id',           host: 'pd.zeroken.id',              priority: 4,  range: true,  zip: false, weight: 80  },
        { name: 'pixeldrain.eu.cc-alt', host: 'pixeldrain.eu.cc',           priority: 5,  range: true,  zip: false, weight: 75  },
        { name: 'hakimi.uk',            host: 'pd.hakimi.uk',               priority: 6,  range: true,  zip: false, weight: 70  },
        { name: '512.gay',              host: 'pd.512.gay',                 priority: 7,  range: true,  zip: false, weight: 65  },
        { name: 'voidnet.tech',         host: 'pd.voidnet.tech',            priority: 8,  range: true,  zip: false, weight: 60  },
        { name: 'kanibal.xyz',          host: 'pd.kanibal.xyz',             priority: 9,  range: true,  zip: false, weight: 55  },
        { name: 'arcjbtc.my.id',        host: 'pd.arcjbtc.my.id',           priority: 10, range: true,  zip: false, weight: 50  },
        { name: 'ramdani.cloud',        host: 'pd.ramdani.cloud',           priority: 11, range: true,  zip: false, weight: 45  },
        { name: 'noisyfox.io',          host: 'pd.noisyfox.io',             priority: 12, range: true,  zip: false, weight: 40  },
        { name: 'meridian.pm',          host: 'pd.meridian.pm',             priority: 13, range: true,  zip: false, weight: 35  },
        { name: 'dwnld.workers.dev',    host: 'pd.dwnld.workers.dev',       priority: 14, range: true,  zip: false, weight: 30  },
        { name: 'itsmeonly.workers.dev', host: 'pd.itsmeonly.workers.dev',  priority: 15, range: true,  zip: false, weight: 25  },
        { name: 'blazing.works',        host: 'pd.blazing.works',           priority: 16, range: true,  zip: false, weight: 20  }
    ];

    const DIRECT_HOSTS = ['pixeldrain.com', 'pixeldrain.net', 'pixeldrain.dev', 'pixeldra.in'];

    const DEFAULTS = {
        primaryStrategy: 'auto',
        autoFailover: true,

        // Auth (Layer A)
        apiKey: '',
        useDirectIfAuth: true,
        preferDirectForLarge: true,
        directThresholdBytes: 50 * 1024 * 1024,

        // Proxy
        proxyHealthTtl: 5 * 60 * 1000,
        healthCheckTimeoutMs: 6000,
        healthProbeId: '',

        // Speed multiplication (exploit 1MB/s per-connection limit)
        speedMultiplier: true,
        connectionsPerMirror: 4,
        maxTotalConnections: 32,

        // Multi-proxy chunked
        multiProxyChunks: 16,
        chunkConcurrency: 16,
        chunkRetry: 5,
        chunkSizeMin: 512 * 1024,
        chunkSizeMax: 8 * 1024 * 1024,
        adaptiveChunking: true,

        // Circuit breaker
        circuitBreakerThreshold: 3,
        circuitBreakerCooldown: 30000,

        // Misc
        retryBackoffMs: 800,
        retryBackoffMultiplier: 1.5,
        maxRetries: 5,
        downloadTimeoutMs: 60 * 60 * 1000,
        preflightCheck: true,

        // Bypass
        bypassVideoLogged: true,
        bypassViewerContinuous: true,
        bypassShowAds: true,
        autoTriggerOnLoad: false,
        viewPadEnabled: true,

        // Captcha
        captchaAutoDetect: true,
        captchaAutoOpen: true,
        captchaPreCheck: true,

        // Resume
        resumableEnabled: true,
        resumeMaxAge: 86400000,

        // Bandwidth tracker
        bandwidthTracker: true,
        bandwidthWarningPct: 80,

        // Custom proxy hosts (comma-separated)
        customProxy: '',

        // External downloaders
        jdownloaderUrl: 'http://127.0.0.1:9666/flash/addcnl',
        aria2RpcUrl: 'http://127.0.0.1:6800/jsonrpc',
        aria2Secret: '',
        aria2MaxConn: 16,
        aria2Split: 16,

        // UI
        notificationsEnabled: true,
        compactUI: false,
        showSpeedGraph: true,
        debugLog: false,
        downloadStats: { count: 0, bytes: 0, savedBandwidth: 0, lastReset: Date.now() }
    };

    const STORAGE_KEY = `${NS}_settings_v7`;
    const RESUME_KEY = `${NS}_resume_jobs_v7`;
    const BANDWIDTH_KEY = `${NS}_bandwidth_v7`;
    const HEALTH_KEY = `${NS}_health_scores_v7`;

    const SPOOF_HEADERS = {
        'Referer': 'https://pixeldrain.com/',
        'Origin': 'https://pixeldrain.com'
    };

    // ================================================================
    // 1. STORAGE
    // ================================================================
    const Store = (() => {
        const hasGM = typeof GM_getValue === 'function';
        return {
            get: (k, def) => { try { if (hasGM) return GM_getValue(k, def); const raw = localStorage.getItem(k); return raw == null ? def : JSON.parse(raw); } catch { return def; } },
            set: (k, v) => { try { if (hasGM) return GM_setValue(k, v); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error(`[${NS}]`, e); } },
            del: (k) => { try { if (hasGM && typeof GM_deleteValue === 'function') return GM_deleteValue(k); localStorage.removeItem(k); } catch {} }
        };
    })();
    function loadSettings() { return Object.assign({}, DEFAULTS, Store.get(STORAGE_KEY, {}) || {}); }
    function saveSettings(patch) { const next = Object.assign({}, loadSettings(), patch); Store.set(STORAGE_KEY, next); return next; }
    let SETTINGS = loadSettings();

    // ================================================================
    // 2. UTILITIES
    // ================================================================
    const Log = {
        _on: () => SETTINGS.debugLog,
        info: (...a) => { if (Log._on()) console.log(`[${NS}]`, ...a); },
        warn: (...a) => console.warn(`[${NS}]`, ...a),
        error: (...a) => console.error(`[${NS}]`, ...a)
    };
    function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxx-xxxx-xxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)); }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function escapeHTML(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
    function sanitizeFilename(n) { return String(n || 'download').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'download'; }
    function formatBytes(b) { if (!b) return '0 B'; const u = ['B', 'KB', 'MB', 'GB', 'TB']; const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1); return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i]; }
    function formatSpeed(bps) { return bps ? formatBytes(bps) + '/s' : ''; }
    function formatETA(rem, spd) { if (!spd) return '--:--'; const s = Math.ceil(rem / spd); return s > 3600 ? `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m` : s > 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`; }
    function formatDuration(ms) { const s = Math.floor(ms / 1000); return s > 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`; }
    function b64(s) { try { return btoa(s); } catch { return s; } }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

    // ================================================================
    // 3. CAPABILITIES DETECTION
    // ================================================================
    const Caps = {
        gmXHR: typeof GM_xmlhttpRequest === 'function' || (typeof GM !== 'undefined' && GM && GM.xmlHttpRequest),
        gmDownload: typeof GM_download === 'function',
        gmOpenInTab: typeof GM_openInTab === 'function',
        gmAddStyle: typeof GM_addStyle === 'function',
        gmClipboard: typeof GM_setClipboard === 'function',
        gmNotification: typeof GM_notification === 'function',
        fsAccess: typeof window.showSaveFilePicker === 'function',
        streams: typeof ReadableStream !== 'undefined' && typeof WritableStream !== 'undefined',
        wasm: typeof WebAssembly !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        transferable: typeof structuredClone === 'function'
    };

    // ================================================================
    // 4. GM TRANSPORT FACADE (kernel-routed since v1.2.0, suite v1.4.9)
    // ================================================================
    // Transport mechanics live in the kernel now: this is a thin POLICY
    // facade over __4NDR0_NET_API__.gmFetch (kernel/net.js v5.1) — one
    // suite-wide implementation of settle-once, grant feature-detection,
    // the typed NetError taxonomy (kind: timeout|http|transport|abort|
    // gm-unavailable), AbortSignal wiring (pre-abort rejection, mid-flight
    // force-settle, retry-chain break, listener detachment), and
    // progress/onloadstart passthrough. Facade policy kept verbatim:
    // SPOOF_HEADERS merge (spoof === false opts out), the anonymous
    // default (credential-free unless explicitly false — premium_direct
    // passes credentials), the 60 s default timeout, and the raw-response
    // contract (every status resolves; callers gate — checkStatus:false).
    // Abort-branching call sites now test e.kind === 'abort' OR the legacy
    // 'aborted' message (both forms recognized — superset).
    function gmXHR(opts) {
        return __4NDR0_NET_API__.gmFetch(opts.url, {
            method:       opts.method,
            headers:      Object.assign({}, opts.spoof === false ? {} : SPOOF_HEADERS, opts.headers || {}),
            data:         opts.data != null ? opts.data : null,
            responseType: opts.responseType,
            timeout:      opts.timeout != null ? opts.timeout : 60000,
            checkStatus:  false,
            anonymous:    opts.anonymous !== false,
            signal:       opts.signal,
            onprogress:   opts.onprogress,
            onloadstart:  opts.onloadstart,
        });
    }

    // ================================================================
    // 5. BANDWIDTH TRACKER
    // ================================================================
    const BandwidthTracker = {
        _data: null,
        load() {
            if (!this._data) {
                this._data = Store.get(BANDWIDTH_KEY, { used: 0, windowStart: Date.now(), history: [] });
                if (Date.now() - this._data.windowStart > 86400000) {
                    this._data = { used: 0, windowStart: Date.now(), history: [] };
                    this.save();
                }
            }
            return this._data;
        },
        save() { Store.set(BANDWIDTH_KEY, this._data); },
        add(bytes, viaProxy = true) {
            const d = this.load();
            if (!viaProxy) d.used += bytes;
            d.history.push({ ts: Date.now(), bytes, proxy: viaProxy });
            if (d.history.length > 500) d.history = d.history.slice(-200);
            this.save();
        },
        getUsed() { return this.load().used; },
        getRemaining() { return Math.max(0, BANDWIDTH_CAP - this.getUsed()); },
        getPct() { return (this.getUsed() / BANDWIDTH_CAP) * 100; },
        isNearCap() { return this.getPct() >= SETTINGS.bandwidthWarningPct; },
        reset() { this._data = { used: 0, windowStart: Date.now(), history: [] }; this.save(); },
        getSpeedHistory(windowMs = 30000) {
            const d = this.load();
            const cutoff = Date.now() - windowMs;
            return d.history.filter(h => h.ts > cutoff);
        }
    };

    // ================================================================
    // 6. PIXELDRAIN API (metadata + auth-aware + pre-flight)
    // ================================================================
    const PDApi = {
        _authHeader() {
            const k = (SETTINGS.apiKey || '').trim();
            return k ? { 'Authorization': 'Basic ' + b64(':' + k) } : null;
        },
        _gmFetch(url, opts = {}) {
            return gmXHR(Object.assign({
                url,
                spoof: false,
                anonymous: !this._authHeader(),
                headers: Object.assign({ 'Accept': 'application/json' }, this._authHeader() || {}, opts.headers || {})
            }, opts));
        },
        async fileInfo(id) {
            try {
                const r = await this._gmFetch(`https://pixeldrain.com/api/file/${id}/info`, { responseType: 'json', timeout: 10000 });
                if (r.status >= 200 && r.status < 300) return r.response || JSON.parse(r.responseText);
                throw new Error(`HTTP ${r.status}`);
            } catch (e) {
                const r = await fetch(`https://pixeldrain.com/api/file/${id}/info`, { credentials: 'omit' });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }
        },
        async listInfo(id) {
            const r = await fetch(`https://pixeldrain.com/api/list/${id}`, { credentials: 'omit' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        },
        async fsPath(path) {
            const r = await fetch(`https://pixeldrain.com/api/filesystem/${path}?stat`, { credentials: 'omit' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        },
        async user() {
            if (!this._authHeader()) return null;
            try {
                const r = await this._gmFetch('https://pixeldrain.com/api/user', { responseType: 'json', timeout: 10000 });
                if (r.status >= 200 && r.status < 300) return r.response || JSON.parse(r.responseText);
            } catch {}
            return null;
        },
        directURL(id, { download = false } = {}) {
            return `https://pixeldrain.com/api/file/${id}${download ? '?download' : ''}`;
        },
        async preflight(id) {
            try {
                const info = await this.fileInfo(id);
                const result = {
                    ok: true,
                    id: info.id,
                    name: info.name,
                    size: info.size,
                    mime: info.mime_type,
                    canDownload: info.can_download !== false,
                    availability: info.availability || '',
                    availabilityMessage: info.availability_message || '',
                    needsCaptcha: false,
                    speedLimit: info.download_speed_limit || SPEED_LIMIT_PER_CONN,
                    showAds: info.show_ads || false
                };
                if (result.availability) {
                    const av = result.availability.toLowerCase();
                    result.needsCaptcha = av.includes('captcha') || av.includes('rate_limited') || av.includes('transfer_limited');
                    result.isVirus = av.includes('virus');
                    result.isBanned = av.includes('banned') || av.includes('abuse');
                }
                return result;
            } catch (e) {
                return { ok: false, error: e.message };
            }
        },
        async viewPad(id, count = 1) {
            if (!SETTINGS.viewPadEnabled) return;
            for (let i = 0; i < count; i++) {
                try {
                    await fetch(`https://pixeldrain.com/u/${id}`, {
                        method: 'GET',
                        credentials: 'omit',
                        headers: { 'Accept': 'text/html' },
                        redirect: 'follow'
                    });
                } catch {}
                if (i < count - 1) await sleep(200);
            }
            Log.info(`view-pad: +${count} views for ${id}`);
        }
    };

    // ================================================================
    // 7. CIRCUIT BREAKER (per-mirror failure tracking)
    // ================================================================
    const CircuitBreaker = {
        _state: new Map(),

        record(host, success) {
            if (!this._state.has(host)) this._state.set(host, { failures: 0, lastFailure: 0, open: false, successes: 0 });
            const s = this._state.get(host);
            if (success) {
                s.successes++;
                s.failures = Math.max(0, s.failures - 1);
                s.open = false;
            } else {
                s.failures++;
                s.lastFailure = Date.now();
                if (s.failures >= SETTINGS.circuitBreakerThreshold) {
                    s.open = true;
                    Log.warn(`Circuit OPEN for ${host} (${s.failures} failures)`);
                }
            }
        },

        isOpen(host) {
            const s = this._state.get(host);
            if (!s || !s.open) return false;
            if (Date.now() - s.lastFailure > SETTINGS.circuitBreakerCooldown) {
                s.open = false;
                s.failures = Math.floor(s.failures / 2);
                Log.info(`Circuit half-open for ${host}`);
                return false;
            }
            return true;
        },

        getScore(host) {
            const s = this._state.get(host);
            if (!s) return 100;
            const total = s.successes + s.failures;
            if (total === 0) return 100;
            return Math.round((s.successes / total) * 100);
        },

        reset(host) {
            if (host) this._state.delete(host);
            else this._state.clear();
        },

        getAll() { return Object.fromEntries(this._state); }
    };

    // ================================================================
    // 8. PROXY MANAGER (Health Checking Hardened)
    // ================================================================
    const ProxyManager = {
        _blocked: new Set(),
        _cache: { ts: 0, results: null },
        _scores: null,

        _loadScores() {
            if (!this._scores) this._scores = Store.get(HEALTH_KEY, {}) || {};
            return this._scores;
        },
        _saveScores() { Store.set(HEALTH_KEY, this._scores || {}); },

        list() {
            const proxies = PROXY_MIRRORS.slice();
            if (SETTINGS.customProxy && SETTINGS.customProxy.trim()) {
                SETTINGS.customProxy.split(',').map(h => h.trim()).filter(Boolean).forEach((h, i) => {
                    proxies.unshift({
                        name: `custom-${i + 1}`,
                        host: h.replace(/^https?:\/\//, '').replace(/\/+$/, ''),
                        priority: 0,
                        range: true,
                        zip: false,
                        weight: 110
                    });
                });
            }
            const active = proxies
                .filter(p => !this._blocked.has(p.host))
                .filter(p => !CircuitBreaker.isOpen(p.host))
                .sort((a, b) => {
                    const sa = this._getHealthScore(a.host);
                    const sb = this._getHealthScore(b.host);
                    if (sb !== sa) return sb - sa;
                    return a.priority - b.priority;
                });

            // Fallback emergency loop: If logic drops all mirrors to dead states, restore baseline to prevent bricked script executions.
            if (active.length === 0) {
                Log.warn("All proxy nodes reported failing status logic; resetting pools to prevent deadlock.");
                this.unblockAll();
                return proxies.slice(0, 3);
            }
            return active;
        },

        _getHealthScore(host) {
            const scores = this._loadScores();
            const stored = scores[host] || { latency: 1000, successRate: 0.5 };
            const cbScore = CircuitBreaker.getScore(host);
            return Math.round((stored.successRate * 50) + (cbScore * 0.3) + (Math.max(0, 2000 - stored.latency) / 20));
        },

        markBlocked(host) { this._blocked.add(host); Log.warn(`Blocked: ${host}`); },
        unblockAll() { this._blocked.clear(); this._cache = { ts: 0, results: null }; CircuitBreaker.reset(); },

        url(proxy, id, { download = false, zip = false } = {}) {
            return `https://${proxy.host}/${zip ? id + '/zip' : id}${download ? '?download' : ''}`;
        },

        async check(proxy, probeId) {
            const start = performance.now();
            const id = probeId || SETTINGS.healthProbeId || '';

            // PROXY HARDENING FIX: Avoid sending raw directory base paths which drop 403/405 Cloudflare codes.
            // Probe using an active metadata pattern or execute a safer GET option.
            const url = id ? this.url(proxy, id) : `https://${proxy.host}/`;

            try {
                const r = await gmXHR({
                    method: id ? 'HEAD' : 'GET',
                    url,
                    timeout: SETTINGS.healthCheckTimeoutMs,
                    headers: { 'Accept': '*/*' }
                });
                const ms = performance.now() - start;

                // Allow alternate server status responses like 404 or 405 to register as alive
                // as long as they prove the infrastructure is up and listening.
                const ok = r.status >= 200 && r.status < 500 && r.status !== 403;
                if (r.status === 403) this.markBlocked(proxy.host);

                const scores = this._loadScores();
                if (!scores[proxy.host]) scores[proxy.host] = { latency: ms, successRate: ok ? 1 : 0, checks: 0 };
                const s = scores[proxy.host];
                s.checks++;
                s.latency = (s.latency * 0.7) + (ms * 0.3);
                s.successRate = (s.successRate * 0.8) + ((ok ? 1 : 0) * 0.2);
                this._saveScores();
                CircuitBreaker.record(proxy.host, ok);
                return { ok, ms, proxy, status: r.status };
            } catch (e) {
                CircuitBreaker.record(proxy.host, false);
                return { ok: false, ms: performance.now() - start, proxy, error: e.message };
            }
        },

        async checkAll(force = false, probeId = '') {
            if (!force && this._cache.results && Date.now() - this._cache.ts < SETTINGS.proxyHealthTtl) return this._cache.results;
            const results = await Promise.all(PROXY_MIRRORS.map(p => this.check(p, probeId)));
            this._cache = { ts: Date.now(), results };
            return results;
        },

        async best(probeId) {
            const results = await this.checkAll(false, probeId);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            return alive.length ? alive[0].proxy : this.list()[0];
        },

        async topN(n = 4, probeId) {
            const results = await this.checkAll(false, probeId);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            return alive.length >= n ? alive.slice(0, n).map(r => r.proxy) : this.list().slice(0, n);
        },

        async race(id) {
            const proxies = this.list().slice(0, 10);
            return new Promise((resolve, reject) => {
                let pending = proxies.length, resolved = false;
                if (!pending) { reject(new Error('no proxies')); return; }
                proxies.forEach(p => {
                    gmXHR({ method: 'HEAD', url: this.url(p, id), timeout: SETTINGS.healthCheckTimeoutMs })
                        .then(r => {
                            if (resolved) return;
                            if (r.status >= 200 && r.status < 405) {
                                resolved = true;
                                CircuitBreaker.record(p.host, true);
                                resolve(p);
                            } else {
                                if (r.status === 403) this.markBlocked(p.host);
                                CircuitBreaker.record(p.host, false);
                                if (--pending === 0 && !resolved) reject(new Error('All mirrors failed'));
                            }
                        })
                        .catch(() => {
                            CircuitBreaker.record(p.host, false);
                            if (--pending === 0 && !resolved) reject(new Error('All mirrors unreachable'));
                        });
                });
            });
        },

        async raceOrBest(id) { try { return await this.race(id); } catch { return await this.best(id); } },

        async getParallelPool(id, count = 8) {
            const results = await this.checkAll(false, id);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            const pool = alive.length >= count ? alive.slice(0, count).map(r => r.proxy) : this.list().slice(0, count);
            return pool;
        }
    };

    // ================================================================
    // 9. RESUME MANAGER (per-chunk persistence)
    // ================================================================
    const ResumeManager = {
        _jobs: null,
        load() { if (!this._jobs) this._jobs = Store.get(RESUME_KEY, {}) || {}; return this._jobs; },
        save() { Store.set(RESUME_KEY, this._jobs || {}); },
        create(fileId, fileName, fileSize, chunkCount) {
            const jobs = this.load();
            const id = uuid();
            jobs[id] = { id, fileId, fileName, fileSize, chunkCount, chunks: Array(chunkCount).fill(0), hosts: Array(chunkCount).fill(null), createdAt: Date.now(), updatedAt: Date.now(), completed: false, totalTime: 0 };
            this.save();
            return id;
        },
        updateChunk(jobId, idx, bytes, host) {
            const j = this.load();
            if (j[jobId]) {
                j[jobId].chunks[idx] = bytes;
                if (host) j[jobId].hosts[idx] = host;
                j[jobId].updatedAt = Date.now();
                this.save();
            }
        },
        markComplete(jobId, totalTime) {
            const j = this.load();
            if (j[jobId]) { j[jobId].completed = true; j[jobId].totalTime = totalTime || 0; this.save(); }
        },
        findByFile(fileId) { return Object.values(this.load()).find(j => j.fileId === fileId && !j.completed) || null; },
        cleanup(maxAge) {
            maxAge = maxAge != null ? maxAge : SETTINGS.resumeMaxAge;
            const j = this.load(); let n = 0;
            for (const [id, job] of Object.entries(j)) {
                if (job.completed || Date.now() - job.updatedAt > maxAge) { delete j[id]; n++; }
            }
            if (n) this.save();
            return n;
        },
        getPendingJobs() { return Object.values(this.load()).filter(j => !j.completed); },
        getProgress(jobId) {
            const j = this.load();
            if (!j[jobId]) return null;
            const sum = j[jobId].chunks.reduce((a, b) => a + b, 0);
            return { loaded: sum, total: j[jobId].fileSize, pct: j[jobId].fileSize ? (sum / j[jobId].fileSize * 100) : 0 };
        }
    };

    // ================================================================
    // 10. CAPTCHA HANDLER (pre-check + auto-detect + guidance)
    // ================================================================
    const CaptchaHandler = {
        _solving: false,
        _detected: false,

        isRateLimited(r) { return r && (r.status === 429 || (r.status === 403 && /rate|captcha|too many/i.test(r.responseText || ''))); },
        isHotlink(r) { return r && r.status === 403 && /hotlink/i.test(r.responseText || ''); },
        isCaptchaRequired(r) { return r && r.status === 403 && /captcha/i.test(r.responseText || ''); },

        async preCheck(fileId) {
            if (!SETTINGS.captchaPreCheck) return { needed: false };
            try {
                const info = await PDApi.preflight(fileId);
                if (info.needsCaptcha) {
                    return { needed: true, reason: info.availability, message: info.availabilityMessage };
                }
                return { needed: false, info };
            } catch {
                return { needed: false };
            }
        },

        async handle(fileId) {
            if (this._solving) return;
            this._solving = true;
            this._detected = true;
            try {
                const msg = `Rate-limited! Captcha required for file ${fileId}`;
                Toast.warn(msg, 8000);
                Log.warn(msg);

                if (SETTINGS.captchaAutoOpen) {
                    const url = `https://pixeldrain.com/u/${fileId}`;
                    if (Caps.gmOpenInTab) GM_openInTab(url, { active: true });
                    else window.open(url);
                    Toast.node([
                        el('strong', null, '\u26A0 Solve captcha in opened tab'),
                        el('br'),
                        el('span', { style: 'font-size:12px' }, 'reCAPTCHA v2', el('br'), 'After solving, retry download here.')
                    ], 'warn', 15000);
                }

                if (Caps.gmNotification) {
                    GM_notification({
                        title: 'Pixeldrain Bypass',
                        text: 'Captcha required — solve in browser tab',
                        timeout: 10000
                    });
                }
            } finally { this._solving = false; }
        },

        detectOnPage() {
            return !!(document.querySelector('.g-recaptcha') ||
                document.querySelector('[data-sitekey]') ||
                document.querySelector('iframe[src*="recaptcha"]') ||
                document.querySelector('[data-callback*="captcha"]'));
        },

        wasDetected() { return this._detected; },
        reset() { this._detected = false; }
    };

    // ================================================================
    // 11. DOWNLOAD STRATEGIES
    // ================================================================
    const Strategies = {

        async premium_direct({ id, name, size, onProgress, signal }) {
            const auth = PDApi._authHeader();
            if (!auth) throw new Error('API key not configured');
            const url = PDApi.directURL(id, { download: true });
            Log.info(`premium_direct: ${url}`);

            if (Caps.fsAccess && Caps.streams) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: sanitizeFilename(name),
                    types: [{ description: 'File', accept: { '*/*': [] } }]
                });
                const writable = await handle.createWritable();
                try {
                    const r = await fetch(url, { headers: auth, credentials: 'omit', signal });
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    const total = parseInt(r.headers.get('content-length') || size || '0', 10);
                    const start = performance.now();
                    let loaded = 0;
                    const reader = r.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writable.write(value);
                        loaded += value.byteLength;
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                    }
                    await writable.close();
                    BandwidthTracker.add(loaded, false);
                    return { ok: true, mode: 'premium_direct', size: loaded };
                } catch (e) { try { await writable.abort(); } catch {} throw e; }
            }

            const start = performance.now();
            const r = await gmXHR({
                url, responseType: 'blob', spoof: false,
                anonymous: false, headers: auth,
                timeout: SETTINGS.downloadTimeoutMs, signal,
                onprogress: (e) => {
                    if (e && e.lengthComputable && onProgress) {
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                    }
                }
            });
            if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
            this._saveBlob(r.response, name);
            BandwidthTracker.add(r.response.size, false);
            return { ok: true, mode: 'premium_direct', size: r.response.size };
        },

        async speed_multiplied({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) {
                const proxy = await ProxyManager.best(id);
                try {
                    const h = await gmXHR({ method: 'HEAD', url: ProxyManager.url(proxy, id), timeout: 10000 });
                    size = parseInt((h.responseHeaders || '').match(/content-length:\s*(\d+)/i)?.[1] || '0', 10);
                } catch {}
            }
            if (!size) throw new Error('Cannot determine file size');

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const theoreticalTime = size / SPEED_LIMIT_PER_CONN;
            const targetTime = Math.max(5, theoreticalTime / SETTINGS.maxTotalConnections);
            const optimalConns = clamp(
                Math.ceil(theoreticalTime / targetTime),
                2,
                SETTINGS.maxTotalConnections
            );

            const mirrors = await ProxyManager.getParallelPool(id, Math.min(optimalConns, 16));
            const totalConns = Math.min(optimalConns, mirrors.length * SETTINGS.connectionsPerMirror);
            const chunkSize = Math.ceil(size / totalConns);

            const loadedArr = Array(totalConns).fill(0);
            const totalStart = performance.now();
            const speedSamples = [];

            let resumeJobId = null;
            if (SETTINGS.resumableEnabled) {
                const existing = ResumeManager.findByFile(id);
                if (existing && existing.chunkCount === totalConns) {
                    resumeJobId = existing.id;
                    existing.chunks.forEach((b, i) => { loadedArr[i] = b; });
                } else {
                    resumeJobId = ResumeManager.create(id, name, size, totalConns);
                }
            }

            const reportProgress = () => {
                const sum = loadedArr.reduce((a, b) => a + b, 0);
                const elapsed = (performance.now() - totalStart) / 1000;
                const speed = sum / Math.max(elapsed, 0.001);
                speedSamples.push({ ts: Date.now(), speed });
                if (speedSamples.length > 60) speedSamples.shift();
                onProgress && onProgress({ loaded: sum, total: size, speed, connections: totalConns, mirrors: mirrors.length });
            };

            const queue = [];
            for (let i = 0; i < totalConns; i++) {
                const expected = (i === totalConns - 1) ? size - i * chunkSize : chunkSize;
                if (loadedArr[i] >= expected) continue;
                queue.push(i);
            }

            const fetchChunk = async (idx) => {
                const baseFrom = idx * chunkSize;
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                let lastErr;
                const maxAttempts = SETTINGS.chunkRetry + 1;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    if (signal && signal.aborted) throw new Error('aborted');
                    const mirror = mirrors[(idx + attempt) % mirrors.length];
                    if (CircuitBreaker.isOpen(mirror.host)) continue;

                    const from = baseFrom + loadedArr[idx];
                    if (from > to) return;
                    const url = ProxyManager.url(mirror, id);

                    try {
                        const r = await gmXHR({
                            url, method: 'GET', responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status === 403) {
                            CircuitBreaker.record(mirror.host, false);
                            if (/hotlink/i.test(r.responseText || '')) ProxyManager.markBlocked(mirror.host);
                            throw new Error('blocked');
                        }
                        if (r.status === 429) { const e = new Error('Rate-limited'); e.code = 'CAPTCHA'; throw e; }
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);

                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        CircuitBreaker.record(mirror.host, true);
                        reportProgress();
                        if (resumeJobId) ResumeManager.updateChunk(resumeJobId, idx, loadedArr[idx], mirror.host);
                        return;
                    } catch (e) {
                        lastErr = e;
                        CircuitBreaker.record(mirror.host, false);
                        if (e.kind === 'abort' || e.message === 'aborted') throw e;
                        if (e.code === 'CAPTCHA') throw e;
                        const backoff = SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt);
                        if (attempt < maxAttempts - 1) await sleep(backoff);
                    }
                }
                throw lastErr;
            };

            const concurrency = totalConns;
            const workers = Array.from({ length: concurrency }, async () => {
                while (queue.length) {
                    const idx = queue.shift();
                    if (idx == null) break;
                    await fetchChunk(idx);
                }
            });

            try {
                await Promise.all(workers);
                await writable.close();
                const elapsed = performance.now() - totalStart;
                if (resumeJobId) ResumeManager.markComplete(resumeJobId, elapsed);
                BandwidthTracker.add(size, true);
                const avgSpeed = size / (elapsed / 1000);
                return { ok: true, mode: 'speed_multiplied', size, connections: totalConns, mirrors: mirrors.length, time: elapsed, speed: avgSpeed };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async multi_proxy_ranged({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) {
                const proxy = await ProxyManager.best(id);
                try {
                    const h = await gmXHR({ method: 'HEAD', url: ProxyManager.url(proxy, id), timeout: 10000 });
                    size = parseInt((h.responseHeaders || '').match(/content-length:\s*(\d+)/i)?.[1] || '0', 10);
                } catch {}
            }
            if (!size) throw new Error('Cannot determine file size');

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const mirrors = await ProxyManager.topN(SETTINGS.multiProxyChunks, id);
            const targetChunkBytes = SETTINGS.adaptiveChunking
                ? clamp(Math.ceil(size / (mirrors.length * 2)), SETTINGS.chunkSizeMin, SETTINGS.chunkSizeMax)
                : Math.max(SETTINGS.chunkSizeMin, Math.min(SETTINGS.chunkSizeMax, Math.ceil(size / SETTINGS.multiProxyChunks)));
            const chunkCount = Math.max(2, Math.min(SETTINGS.multiProxyChunks * 2, Math.ceil(size / targetChunkBytes)));
            const chunkSize = Math.ceil(size / chunkCount);
            const loadedArr = Array(chunkCount).fill(0);
            const totalStart = performance.now();

            let resumeJobId = null;
            if (SETTINGS.resumableEnabled) {
                const existing = ResumeManager.findByFile(id);
                if (existing && existing.chunkCount === chunkCount) {
                    resumeJobId = existing.id;
                    existing.chunks.forEach((b, i) => { loadedArr[i] = b; });
                } else {
                    resumeJobId = ResumeManager.create(id, name, size, chunkCount);
                }
            }

            const reportProgress = () => {
                const sum = loadedArr.reduce((a, b) => a + b, 0);
                const elapsed = (performance.now() - totalStart) / 1000;
                onProgress && onProgress({ loaded: sum, total: size, speed: sum / Math.max(elapsed, 0.001) });
            };

            const queue = [];
            for (let i = 0; i < chunkCount; i++) {
                const expected = (i === chunkCount - 1) ? size - i * chunkSize : chunkSize;
                if (loadedArr[i] >= expected) continue;
                queue.push(i);
            }

            const fetchChunk = async (idx) => {
                const baseFrom = idx * chunkSize;
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                let lastErr;
                for (let attempt = 0; attempt <= SETTINGS.chunkRetry; attempt++) {
                    if (signal && signal.aborted) throw new Error('aborted');
                    const live = ProxyManager.list();
                    const pool = mirrors.filter(m => live.find(l => l.host === m.host));
                    if (!pool.length) pool.push(...live.slice(0, 3));
                    const proxy = pool[(idx + attempt) % pool.length];
                    const from = baseFrom + loadedArr[idx];
                    if (from > to) return;
                    const url = ProxyManager.url(proxy, id);
                    try {
                        const r = await gmXHR({
                            url, method: 'GET', responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status === 403) {
                            CircuitBreaker.record(proxy.host, false);
                            if (/hotlink/i.test(r.responseText || '')) ProxyManager.markBlocked(proxy.host);
                            throw new Error('blocked');
                        }
                        if (r.status === 429) { const e = new Error('Rate-limited'); e.code = 'CAPTCHA'; throw e; }
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        CircuitBreaker.record(proxy.host, true);
                        reportProgress();
                        if (resumeJobId) ResumeManager.updateChunk(resumeJobId, idx, loadedArr[idx], proxy.host);
                        return;
                    } catch (e) {
                        lastErr = e;
                        if (e.kind === 'abort' || e.message === 'aborted') throw e;
                        if (e.code === 'CAPTCHA') throw e;
                        CircuitBreaker.record(proxy.host, false);
                        if (attempt < SETTINGS.chunkRetry) await sleep(SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt));
                    }
                }
                throw lastErr;
            };

            const concurrency = Math.min(SETTINGS.chunkConcurrency, chunkCount);
            const workers = Array.from({ length: concurrency }, async () => { while (queue.length) await fetchChunk(queue.shift()); });
            try {
                await Promise.all(workers);
                await writable.close();
                const elapsed = performance.now() - totalStart;
                if (resumeJobId) ResumeManager.markComplete(resumeJobId, elapsed);
                BandwidthTracker.add(size, true);
                return { ok: true, mode: 'multi_proxy_ranged', size, chunks: chunkCount, time: elapsed };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async gm_stream_fsa({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API unavailable');
            const proxy = await ProxyManager.raceOrBest(id);
            const url = ProxyManager.url(proxy, id, { download: true });
            Log.info(`gm_stream_fsa via ${proxy.host}`);

            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable();
            const start = performance.now();
            let loaded = 0;
            const total = size || 0;

            try {
                const streamed = await new Promise((resolve, reject) => {
                    const xhr = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : (GM && GM.xmlHttpRequest);
                    let aborted = false;
                    const h = xhr({
                        method: 'GET', url, headers: SPOOF_HEADERS,
                        responseType: 'stream', anonymous: true,
                        timeout: SETTINGS.downloadTimeoutMs,
                        onloadstart: async (resp) => {
                            try {
                                const reader = resp.response && resp.response.getReader && resp.response.getReader();
                                if (!reader) { resolve(false); return; }
                                while (!aborted) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    await writable.write(value);
                                    loaded += value.byteLength;
                                    const elapsed = (performance.now() - start) / 1000;
                                    onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                                }
                                resolve(true);
                            } catch (e) { reject(e); }
                        },
                        onload: () => { if (loaded > 0) resolve(true); else resolve(false); },
                        onerror: (e) => reject(new Error(`network: ${(e && (e.error || e.statusText)) || 'unknown'}`)),
                        ontimeout: () => reject(new Error('timeout'))
                    });
                    if (signal) signal.addEventListener('abort', () => { aborted = true; try { h && h.abort && h.abort(); } catch {} reject(new Error('aborted')); });
                });
                if (streamed && loaded > 0) {
                    await writable.close();
                    CircuitBreaker.record(proxy.host, true);
                    BandwidthTracker.add(loaded, true);
                    return { ok: true, mode: 'gm_stream_fsa', proxy: proxy.host, size: loaded };
                }
            } catch (e) {
                if (e.message === 'aborted') { try { await writable.abort(); } catch {} throw e; }
                Log.warn('stream fallback to buffered:', e.message);
            }

            try {
                const r = await gmXHR({
                    url, responseType: 'arraybuffer',
                    timeout: SETTINGS.downloadTimeoutMs, signal,
                    onprogress: (e) => {
                        if (e && e.lengthComputable && onProgress) {
                            const elapsed = (performance.now() - start) / 1000;
                            onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                        }
                    }
                });
                if (r.status === 403) { CircuitBreaker.record(proxy.host, false); throw new Error('blocked'); }
                if (r.status === 429) throw Object.assign(new Error('Rate-limited'), { code: 'CAPTCHA' });
                if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
                await writable.write(new Uint8Array(r.response));
                await writable.close();
                CircuitBreaker.record(proxy.host, true);
                BandwidthTracker.add(r.response.byteLength, true);
                return { ok: true, mode: 'gm_stream_fsa', proxy: proxy.host, size: r.response.byteLength };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async single_host_ranged({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('FSA required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) throw new Error('Cannot determine size');
            const proxy = await ProxyManager.best(id);
            const url = ProxyManager.url(proxy, id);

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const conns = Math.min(SETTINGS.connectionsPerMirror, Math.ceil(size / SETTINGS.chunkSizeMin));
            const chunkSize = Math.ceil(size / conns);
            const loadedArr = Array(conns).fill(0);
            const start = performance.now();

            const fetchChunk = async (idx) => {
                const from = idx * chunkSize + loadedArr[idx];
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                if (from > to) return;
                let lastErr;
                for (let attempt = 0; attempt <= SETTINGS.chunkRetry; attempt++) {
                    try {
                        const r = await gmXHR({
                            url, responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        const sum = loadedArr.reduce((a, b) => a + b, 0);
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress && onProgress({ loaded: sum, total: size, speed: sum / Math.max(elapsed, 0.001) });
                        return;
                    } catch (e) {
                        lastErr = e;
                        if (e.kind === 'abort' || e.message === 'aborted') throw e;
                        if (attempt < SETTINGS.chunkRetry) await sleep(SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt));
                    }
                }
                throw lastErr;
            };

            const queue = Array.from({ length: conns }, (_, i) => i);
            const workers = Array.from({ length: conns }, async () => { while (queue.length) await fetchChunk(queue.shift()); });
            try {
                await Promise.all(workers);
                await writable.close();
                CircuitBreaker.record(proxy.host, true);
                BandwidthTracker.add(size, true);
                return { ok: true, mode: 'single_host_ranged', size, proxy: proxy.host, connections: conns };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async native_fetch({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess || !Caps.streams) throw new Error('FSA/streams unavailable');
            const mirrors = ProxyManager.list().slice(0, 6);
            let lastErr;
            for (const mirror of mirrors) {
                const url = ProxyManager.url(mirror, id, { download: true });
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: sanitizeFilename(name),
                        types: [{ description: 'File', accept: { '*/*': [] } }]
                    });
                    const writable = await handle.createWritable();
                    try {
                        const r = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
                        if (r.status === 403) { CircuitBreaker.record(mirror.host, false); ProxyManager.markBlocked(mirror.host); throw new Error('blocked'); }
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        const total = parseInt(r.headers.get('content-length') || size || '0', 10);
                        const start = performance.now();
                        let loaded = 0;
                        const reader = r.body.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            await writable.write(value);
                            loaded += value.byteLength;
                            const elapsed = (performance.now() - start) / 1000;
                            onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                        }
                        await writable.close();
                        CircuitBreaker.record(mirror.host, true);
                        BandwidthTracker.add(loaded, true);
                        return { ok: true, mode: 'native_fetch', proxy: mirror.host, size: loaded };
                    } catch (e) { try { await writable.abort(); } catch {} throw e; }
                } catch (e) { lastErr = e; if (e.kind === 'abort' || e.message === 'aborted') throw e; }
            }
            throw lastErr || new Error('All mirrors failed');
        },

        async gm_blob({ id, name, onProgress, signal }) {
            const mirrors = ProxyManager.list().slice(0, 8);
            let lastErr;
            for (const mirror of mirrors) {
                if (CircuitBreaker.isOpen(mirror.host)) continue;
                const url = ProxyManager.url(mirror, id, { download: true });
                Log.info(`gm_blob trying ${mirror.host}`);
                const start = performance.now();
                try {
                    const r = await gmXHR({
                        url, responseType: 'blob',
                        timeout: SETTINGS.downloadTimeoutMs, signal,
                        onprogress: (e) => {
                            if (e && e.lengthComputable && onProgress) {
                                const elapsed = (performance.now() - start) / 1000;
                                onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                            }
                        }
                    });
                    if (r.status === 403) { CircuitBreaker.record(mirror.host, false); ProxyManager.markBlocked(mirror.host); continue; }
                    if (r.status === 429) { lastErr = Object.assign(new Error('Rate-limited'), { code: 'CAPTCHA' }); break; }
                    if (r.status !== 200) { lastErr = new Error(`HTTP ${r.status}`); CircuitBreaker.record(mirror.host, false); continue; }
                    this._saveBlob(r.response, name);
                    CircuitBreaker.record(mirror.host, true);
                    BandwidthTracker.add(r.response.size, true);
                    return { ok: true, mode: 'gm_blob', proxy: mirror.host, size: r.response.size };
                } catch (e) { lastErr = e; if (e.kind === 'abort' || e.message === 'aborted') throw e; CircuitBreaker.record(mirror.host, false); }
            }
            throw lastErr || new Error('All mirrors failed');
        },

        async gm_download({ id, name, onProgress }) {
            if (!Caps.gmDownload) throw new Error('GM_download not available');
            const proxy = await ProxyManager.raceOrBest(id);
            return new Promise((resolve, reject) => {
                const tryMirror = (mirror, attempt = 0) => {
                    if (CircuitBreaker.isOpen(mirror.host)) {
                        const mirrors = ProxyManager.list();
                        const nextIdx = mirrors.indexOf(mirror) + 1;
                        if (nextIdx < mirrors.length) tryMirror(mirrors[nextIdx], attempt);
                        else reject(new Error('All mirrors circuit-broken'));
                        return;
                    }
                    const dlUrl = ProxyManager.url(mirror, id, { download: true });
                    Log.info(`gm_download via ${mirror.host}`);
                    GM_download({
                        url: dlUrl,
                        name: sanitizeFilename(name),
                        headers: SPOOF_HEADERS,
                        saveAs: false,
                        onload: () => { CircuitBreaker.record(mirror.host, true); resolve({ ok: true, mode: 'gm_download', proxy: mirror.host }); },
                        onerror: (e) => {
                            const msg = (e && (e.error || e.details)) || '';
                            Log.warn(`gm_download fail on ${mirror.host}: ${msg}`);
                            CircuitBreaker.record(mirror.host, false);
                            const mirrors = ProxyManager.list();
                            const nextIdx = mirrors.indexOf(mirror) + 1;
                            if (nextIdx < mirrors.length && attempt < 4) tryMirror(mirrors[nextIdx], attempt + 1);
                            else reject(new Error(`GM_download failed: ${msg}`));
                        },
                        ontimeout: () => { CircuitBreaker.record(mirror.host, false); reject(new Error('GM_download timeout')); },
                        onprogress: (e) => { if (e && e.lengthComputable && onProgress) onProgress({ loaded: e.loaded, total: e.total }); }
                    });
                };
                tryMirror(proxy);
            });
        },

        async stream({ id, name, mime }) {
            const proxy = await ProxyManager.best(id);
            const url = ProxyManager.url(proxy, id);
            const w = window.open('about:blank', '_blank');
            if (!w) { Toast.error('Popup blocked'); return { ok: false }; }
            const tag = (mime || '').startsWith('audio/') ? 'audio' : 'video';
            /* [R3] popup player built through the DOM (document.write on the
             * script-owned popup was the last own-popup string sink). */
            const d = w.document;
            d.title = name;
            const meta = d.createElement('meta');
            meta.setAttribute('charset', 'utf-8');
            const refMeta = d.createElement('meta');
            refMeta.setAttribute('name', 'referrer');
            refMeta.setAttribute('content', 'no-referrer');
            const style = d.createElement('style');
            style.textContent = `html,body{margin:0;background:#0A131A;height:100%;display:flex;align-items:center;justify-content:center}${tag}{max-width:100vw;max-height:100vh;width:100%}`;
            d.head.append(meta, refMeta, style);
            const media = d.createElement(tag);
            media.setAttribute('src', url);
            media.setAttribute('controls', '');
            media.setAttribute('autoplay', '');
            media.setAttribute('playsinline', '');
            d.body.append(media);
            return { ok: true, mode: 'stream', proxy: proxy.host };
        },

        async jdownloader({ urls }) {
            const list = Array.isArray(urls) ? urls : [urls];
            const r = await gmXHR({
                method: 'POST', url: SETTINGS.jdownloaderUrl,
                headers: { 'Content-Type': 'application/json' },
                spoof: false,
                data: JSON.stringify({ urls: list.join('\r\n'), source: list.join('\r\n'), referrer: 'https://pixeldrain.com/' }),
                timeout: 8000
            });
            if (r.status >= 200 && r.status < 300) return { ok: true };
            throw new Error(`JDownloader HTTP ${r.status}`);
        },

        async aria2({ urls, names }) {
            const list = Array.isArray(urls) ? urls : [urls];
            const nameList = Array.isArray(names) ? names : [names || ''];
            const results = [];
            for (let i = 0; i < list.length; i++) {
                const opts = {
                    referer: 'https://pixeldrain.com/',
                    'max-connection-per-server': String(SETTINGS.aria2MaxConn),
                    split: String(SETTINGS.aria2Split),
                    'min-split-size': '1M'
                };
                if (nameList[i]) opts.out = sanitizeFilename(nameList[i]);
                const params = SETTINGS.aria2Secret
                    ? [`token:${SETTINGS.aria2Secret}`, [list[i]], opts]
                    : [[list[i]], opts];
                const r = await gmXHR({
                    method: 'POST', url: SETTINGS.aria2RpcUrl,
                    headers: { 'Content-Type': 'application/json' }, spoof: false,
                    data: JSON.stringify({ jsonrpc: '2.0', id: uuid(), method: 'aria2.addUri', params }),
                    responseType: 'json', timeout: 8000
                });
                if (r.status !== 200) throw new Error(`Aria2 HTTP ${r.status}`);
                results.push((r.response || {}).result);
            }
            return { ok: true, gid: results[0], count: results.length };
        },

        _saveBlob(blob, name) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = sanitizeFilename(name); a.style.display = 'none';
            document.body.appendChild(a); a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
        }
    };

    // ================================================================
    // 12. DOWNLOAD MANAGER (auto-strategy + pre-flight + view-pad)
    // ================================================================
    const Downloader = {
        _activeJobs: new Map(),
        _queue: [],

        _resolveAuto(file) {
            const hasAuth = !!PDApi._authHeader();
            if (hasAuth && SETTINGS.useDirectIfAuth) return 'premium_direct';
            if (Caps.fsAccess && SETTINGS.speedMultiplier && (file.size || 0) > 5 * 1024 * 1024) return 'speed_multiplied';
            if (Caps.fsAccess) return 'multi_proxy_ranged';
            if (Caps.gmDownload) return 'gm_download';
            return 'gm_blob';
        },

        _fallbackOrder(primary, file) {
            const all = ['premium_direct', 'speed_multiplied', 'multi_proxy_ranged', 'single_host_ranged', 'gm_stream_fsa', 'native_fetch', 'gm_blob', 'gm_download'];
            const order = [primary];
            if (!SETTINGS.autoFailover) return order;
            for (const s of all) {
                if (order.includes(s)) continue;
                if (s === 'premium_direct' && !PDApi._authHeader()) continue;
                if (s === 'gm_download' && !Caps.gmDownload) continue;
                if (s === 'gm_stream_fsa' && !Caps.fsAccess) continue;
                if (s === 'native_fetch' && !(Caps.fsAccess && Caps.streams)) continue;
                if (s === 'speed_multiplied' && !Caps.fsAccess) continue;
                if (s === 'multi_proxy_ranged' && !Caps.fsAccess) continue;
                if (s === 'single_host_ranged' && !Caps.fsAccess) continue;
                order.push(s);
            }
            return order;
        },

        async run(file, strategy = SETTINGS.primaryStrategy) {
            const jobId = uuid();
            const ac = new AbortController();
            this._activeJobs.set(jobId, { id: jobId, file, ac, startTime: Date.now() });

            if (SETTINGS.preflightCheck) {
                try {
                    const pf = await PDApi.preflight(file.id);
                    if (pf.ok && pf.needsCaptcha) {
                        Toast.warn(`Captcha required: ${pf.availability}`, 6000);
                        await CaptchaHandler.handle(file.id);
                        this._activeJobs.delete(jobId);
                        return { ok: false, reason: 'captcha_required' };
                    }
                    if (pf.ok && pf.size && !file.size) file.size = pf.size;
                    if (pf.ok && pf.name && !file.name) file.name = pf.name;
                    if (pf.ok && pf.mime && !file.mime_type) file.mime_type = pf.mime;
                } catch (e) { Log.warn('preflight failed:', e.message); }
            }

            if (SETTINGS.viewPadEnabled && strategy !== 'premium_direct') {
                PDApi.viewPad(file.id, 2).catch(() => {});
            }

            const ui = this._createProgressUI(file, () => ac.abort());

            const onProgress = ({ loaded, total, speed, connections, mirrors }) => {
                const pct = total ? Math.min(100, (loaded / total) * 100) : 0;
                ui.bar.style.width = `${pct}%`;
                const eta = total && speed ? formatETA(total - loaded, speed) : '';
                ui.label.textContent = total
                    ? `${formatBytes(loaded)} / ${formatBytes(total)} (${pct.toFixed(1)}%)${eta ? ' · ' + eta : ''}`
                    : formatBytes(loaded);
                let speedText = formatSpeed(speed || 0);
                if (connections) speedText += ` · ${connections}x`;
                if (mirrors) speedText += ` · ${mirrors}m`;
                ui.speed.textContent = speedText;
            };

            try {
                const resolved = strategy === 'auto' ? this._resolveAuto(file) : strategy;
                const order = this._fallbackOrder(resolved, file);
                let result, lastErr;

                for (const s of order) {
                    try {
                        Log.info(`strategy: ${s}`);
                        ui.label.textContent = `→ ${s}`;
                        if (s === 'gm_download') {
                            ui.bar.style.width = '100%';
                            ui.bar.style.background = 'repeating-linear-gradient(45deg,#00E5FF,#00E5FF 10px,#67E8F9 10px,#67E8F9 20px)';
                            ui.speed.textContent = 'browser-managed';
                        }
                        result = await Strategies[s]({
                            id: file.id, name: file.name, size: file.size, mime: file.mime_type,
                            onProgress: s === 'gm_download' ? undefined : onProgress,
                            signal: ac.signal
                        });
                        if (result && result.ok) break;
                    } catch (e) {
                        lastErr = e;
                        Log.warn(`${s} failed:`, e.message);
                        if (e.message === 'aborted' || e.name === 'AbortError') break;
                        if (/user (?:activation|aborted|denied)/i.test(e.message)) break;
                        if (e.code === 'CAPTCHA') {
                            Toast.warn('Rate-limited, trying next strategy…');
                            if (SETTINGS.captchaAutoDetect) await CaptchaHandler.handle(file.id);
                        }
                        if (!SETTINGS.autoFailover) break;
                    }
                }
                if (!result || !result.ok) throw lastErr || new Error('All strategies failed');

                const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
                stats.count++;
                stats.bytes += (file.size || result.size || 0);
                if (result.mode !== 'premium_direct' && result.mode !== 'native_fetch') {
                    stats.savedBandwidth += (file.size || result.size || 0);
                }
                SETTINGS = saveSettings({ downloadStats: stats });

                ui.bar.style.width = '100%';
                ui.bar.style.background = 'linear-gradient(90deg,#00E5FF,#67E8F9)';
                const elapsed = Date.now() - this._activeJobs.get(jobId).startTime;
                const tag = result.mode === 'premium_direct'
                    ? `✓ Done (premium · no cap)`
                    : `✓ Done (${result.mode} · 0 BW · ${formatDuration(elapsed)})`;
                ui.label.textContent = tag;
                ui.speed.textContent = result.speed ? formatSpeed(result.speed) : '';
                Toast.success(`${file.name} — ${result.mode}${result.connections ? ' · ' + result.connections + 'x' : ''}`);
                setTimeout(() => ui.wrap.remove(), 5000);
                return result;
            } catch (e) {
                Log.error(e);
                ui.label.textContent = `✗ ${e.message}`;
                ui.bar.style.background = '#ff0055';
                ui.bar.style.width = '100%';
                Toast.error(`Failed: ${e.message}`);
                setTimeout(() => ui.wrap.remove(), 10000);
                throw e;
            } finally { this._activeJobs.delete(jobId); }
        },

        async runBatch(files, strategy) {
            const valid = files.filter(f => !f.availability && !f.availability_message);
            Toast.info(`Batch: ${valid.length} files`);
            const results = [];
            for (const f of valid) {
                try { results.push({ file: f, result: await this.run(f, strategy) }); }
                catch (e) { results.push({ file: f, error: e }); if (e.code === 'CAPTCHA') break; }
                await sleep(500);
            }
            const ok = results.filter(r => !r.error).length;
            Toast.success(`Batch complete: ${ok}/${valid.length} succeeded`);
            return results;
        },

        cancelAll() {
            for (const [, job] of this._activeJobs) { try { job.ac.abort(); } catch {} }
            this._activeJobs.clear();
        },

        _createProgressUI(file, onCancel) {
            const wrap = document.createElement('div');
            wrap.className = `${NS}-toast info`;
            wrap.style.minWidth = '360px';
            const closeBtn = el('button', { class: `${NS}-modal-close`, style: 'font-size:16px;cursor:pointer;background:none;border:none;color:#ff0055' }, '\u00D7');
            wrap.append(
                el('div', { style: 'font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center' },
                    el('span', { style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px', title: file.name }, file.name),
                    closeBtn),
                el('div', { style: 'font-size:11px;color:#67E8F9;margin-bottom:4px' },
                    `${formatBytes(file.size || 0)} \u00B7 ${file.mime_type || 'unknown'}`),
                el('div', { class: `${NS}-progress` }, el('div', { class: `${NS}-progress-bar` })),
                el('div', { class: `${NS}-stat` },
                    el('span', { class: `${NS}-dl-label` }, 'Preparing\u2026'),
                    el('span', { class: `${NS}-dl-speed` })));
            closeBtn.addEventListener('click', () => { onCancel(); wrap.remove(); });
            (Toast.ensure ? Toast.ensure() : document.body).appendChild(wrap);
            return {
                wrap,
                bar: wrap.querySelector(`.${NS}-progress-bar`),
                label: wrap.querySelector(`.${NS}-dl-label`),
                speed: wrap.querySelector(`.${NS}-dl-speed`)
            };
        }
    };

    // ================================================================
    // 13. EXPORT GENERATORS
    // ================================================================
    const ExportGenerator = {
        curl(url, name) { return `curl -L -C - -o "${sanitizeFilename(name)}" -e "https://pixeldrain.com/" "${url}"`; },
        wget(url, name) { return `wget -c -O "${sanitizeFilename(name)}" --referer="https://pixeldrain.com/" "${url}"`; },
        aria2c(url, name) { return `aria2c -x${SETTINGS.aria2MaxConn} -s${SETTINGS.aria2Split} -c -o "${sanitizeFilename(name)}" --referer="https://pixeldrain.com/" --min-split-size=1M "${url}"`; },
        idm(url, name) { return `idman /d "${url}" /f "${sanitizeFilename(name)}" /n`; },
        ps(url, name) { return `Invoke-WebRequest -Uri "${url}" -OutFile "${sanitizeFilename(name)}" -Headers @{Referer="https://pixeldrain.com/"} -Resume`; },
        httpie(url, name) { return `http -d "${url}" Referer:https://pixeldrain.com/ -o "${sanitizeFilename(name)}"`; },
        axel(url, name) { return `axel -n ${SETTINGS.aria2MaxConn} -H "Referer: https://pixeldrain.com/" -o "${sanitizeFilename(name)}" "${url}"`; },

        async showModal(file) {
            const proxy = await ProxyManager.best(file.id);
            const url = ProxyManager.url(proxy, file.id, { download: true });
            const name = sanitizeFilename(file.name);
            const cmds = {
                curl: this.curl(url, name),
                wget: this.wget(url, name),
                aria2c: this.aria2c(url, name),
                axel: this.axel(url, name),
                IDM: this.idm(url, name),
                PowerShell: this.ps(url, name),
                HTTPie: this.httpie(url, name)
            };
            const cmdBlocks = [];
            cmdBlocks.push(el('div', { style: 'margin-bottom:12px;padding:8px;background:rgba(10,19,26,0.55);border-radius:6px;font-size:11px;color:#67E8F9' },
                el('strong', null, 'Mirror:'), ` ${proxy.host}`, el('br'),
                el('strong', null, 'URL:'), ' ',
                el('span', { style: 'word-break:break-all' }, url)));
            for (const [k, v] of Object.entries(cmds)) {
                cmdBlocks.push(el('div', { style: 'margin-bottom:10px' },
                    el('div', { style: 'font-size:12px;font-weight:600;color:#00E5FF;margin-bottom:3px' }, k),
                    el('pre', { style: 'background:rgba(10,19,26,0.55);padding:8px;border-radius:4px;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0;color:#67E8F9;cursor:pointer', title: 'Click to copy', 'data-cmd': v }, v)));
            }
            const m = Modal.open({
                title: `📤 Export: ${name}`,
                body: cmdBlocks,
                footer: [
                    el('button', { class: `${NS}-btn ${NS}-copy-all` }, '📋 Copy All'),
                    el('button', { class: `${NS}-btn ${NS}-cancel` }, 'Close')
                ]
            });
            m.body.querySelectorAll('pre[data-cmd]').forEach(el => {
                el.addEventListener('click', async () => {
                    const ok = await copyToClipboard(el.dataset.cmd);
                    Toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
                });
            });
            m.el.querySelector(`.${NS}-copy-all`).addEventListener('click', async () => {
                const ok = await copyToClipboard(Object.values(cmds).join('\n\n'));
                Toast[ok ? 'success' : 'error'](ok ? 'All copied' : 'Failed');
            });
            m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        },

        async showBatch(files) {
            const proxy = await ProxyManager.best();
            const lines = files.filter(f => !f.availability).map(f => this.aria2c(ProxyManager.url(proxy, f.id, { download: true }), f.name));
            const urls = files.filter(f => !f.availability).map(f => ProxyManager.url(proxy, f.id, { download: true })).join('\n');
            const curlLines = files.filter(f => !f.availability).map(f => this.curl(ProxyManager.url(proxy, f.id, { download: true }), f.name));
            const m = Modal.open({
                title: `📤 Batch Export (${files.length} files)`,
                body: [
                    el('div', { style: 'margin-bottom:8px;font-size:12px;color:#00E5FF;font-weight:600' }, 'aria2c (recommended - multi-threaded)'),
                    el('pre', { style: 'background:rgba(10,19,26,0.55);padding:8px;border-radius:4px;font-size:11px;max-height:200px;overflow:auto;color:#67E8F9' }, lines.join('\n')),
                    el('div', { style: 'margin:12px 0 8px;font-size:12px;color:#00E5FF;font-weight:600' }, 'curl'),
                    el('pre', { style: 'background:rgba(10,19,26,0.55);padding:8px;border-radius:4px;font-size:11px;max-height:200px;overflow:auto;color:#67E8F9' }, curlLines.join('\n'))
                ],
                footer: [
                    el('button', { class: `${NS}-btn ${NS}-copy-aria` }, 'aria2c'),
                    el('button', { class: `${NS}-btn ${NS}-copy-curl` }, 'curl'),
                    el('button', { class: `${NS}-btn ${NS}-copy-urls` }, 'URLs'),
                    el('button', { class: `${NS}-btn ${NS}-save-sh` }, '💾 .sh'),
                    el('button', { class: `${NS}-btn ${NS}-save-bat` }, '💾 .bat'),
                    el('button', { class: `${NS}-btn ${NS}-cancel` }, 'Close')
                ]
            });
            m.el.querySelector(`.${NS}-copy-aria`).addEventListener('click', async () => { await copyToClipboard(lines.join('\n')); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-copy-curl`).addEventListener('click', async () => { await copyToClipboard(curlLines.join('\n')); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-copy-urls`).addEventListener('click', async () => { await copyToClipboard(urls); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-save-sh`).addEventListener('click', () => {
                const b = new Blob(['#!/bin/bash\nset -e\n\n' + lines.join('\n') + '\n\necho "Done!"\n'], { type: 'text/plain' });
                Strategies._saveBlob(b, `pd-batch-${Date.now()}.sh`);
            });
            m.el.querySelector(`.${NS}-save-bat`).addEventListener('click', () => {
                const batLines = files.filter(f => !f.availability).map(f => {
                    const u = ProxyManager.url(proxy, f.id, { download: true });
                    return `curl -L -C - -o "${sanitizeFilename(f.name)}" -e "https://pixeldrain.com/" "${u}"`;
                });
                const b = new Blob(['@echo off\r\n\r\n' + batLines.join('\r\n') + '\r\n\r\necho Done!\r\npause\r\n'], { type: 'text/plain' });
                Strategies._saveBlob(b, `pd-batch-${Date.now()}.bat`);
            });
            m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        }
    };

    // ================================================================
    // 14. QR CODE GENERATOR
    // ================================================================
    const QRCode = (() => {
        /* ── REAL QR ENCODER (v1.1.0) ─────────────────────────────────────
         * Byte mode, EC level L, versions 1-5 (single block), all 8 masks
         * evaluated by spec penalty. Replaces the decorative pseudo-QR that
         * filled its data modules from a hash PRNG — it looked like a QR
         * code and could never scan. Round-trip verified by
         * tools/qr-roundtrip-test.mjs (format BCH, structure, zigzag
         * extraction, RS syndrome, payload equality — 8/8 cases). */

        // GF(256), primitive polynomial 0x11D
        const EXP = new Uint8Array(512);
        const LOG = new Uint8Array(256);
        (() => {
            let x = 1;
            for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
            for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
        })();
        const gmul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

        // [dataCodewords, ecCodewords] per version 1-5 (EC L, 1 block)
        const QR_CAP = [[19, 7], [34, 10], [55, 15], [80, 20], [108, 26]];
        const QR_ALIGN = [null, null, [6, 18], [6, 22], [6, 26], [6, 30]];

        function rsGenerator(degree) {
            let result = [1];
            let root = 1;
            for (let i = 0; i < degree; i++) {
                const next = new Array(result.length + 1).fill(0);
                for (let j = 0; j < result.length; j++) {
                    next[j] ^= result[j];
                    next[j + 1] ^= gmul(result[j], root);
                }
                result = next;
                root = gmul(root, 2);
            }
            return result;
        }

        function rsRemainder(data, gen) {
            const degree = gen.length - 1;
            const result = new Array(degree).fill(0);
            for (const b of data) {
                const factor = b ^ result[0];
                result.shift();
                result.push(0);
                if (factor !== 0) {
                    for (let i = 0; i < degree; i++) result[i] ^= gmul(gen[i + 1], factor);
                }
            }
            return result;
        }

        function qrEncode(text) {
            const bytes = Array.from(new TextEncoder().encode(text));
            let v = 0;
            for (let i = 0; i < QR_CAP.length; i++) {
                if (QR_CAP[i][0] >= bytes.length + 2) { v = i + 1; break; }
            }
            if (!v) return null; // payload exceeds v5-L capacity
            const [dataLen, ecLen] = QR_CAP[v - 1];
            const size = 17 + 4 * v;

            const bits = [];
            const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
            push(4, 4);
            push(bytes.length, 8);
            for (const b of bytes) push(b, 8);
            push(0, Math.min(4, dataLen * 8 - bits.length));
            while (bits.length % 8 !== 0) bits.push(0);
            const codewords = [];
            for (let i = 0; i < bits.length; i += 8) {
                let b = 0;
                for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
                codewords.push(b);
            }
            const PAD = [0xEC, 0x11];
            for (let i = 0; codewords.length < dataLen; i++) codewords.push(PAD[i % 2]);

            const gen = rsGenerator(ecLen);
            const full = codewords.concat(rsRemainder(codewords, gen));

            // function-pattern template + reserved map
            const T = Array.from({ length: size }, () => new Array(size).fill(false));
            const R = Array.from({ length: size }, () => new Array(size).fill(false));
            const setFn = (r, c, dark) => { T[r][c] = dark; R[r][c] = true; };
            const finder = (r0, c0) => {
                for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
                    const r = r0 + dr, c = c0 + dc;
                    if (r < 0 || r >= size || c < 0 || c >= size) continue;
                    const dark = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 &&
                        (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
                    setFn(r, c, dark);
                }
            };
            finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
            for (let i = 8; i < size - 8; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
            if (QR_ALIGN[v]) {
                for (const r of QR_ALIGN[v]) for (const c of QR_ALIGN[v]) {
                    if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
                    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
                        setFn(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
                    }
                }
            }
            setFn(size - 8, 8, true); // dark module
            for (let i = 0; i <= 8; i++) { if (!R[8][i]) setFn(8, i, false); if (!R[i][8]) setFn(i, 8, false); }
            for (let i = 0; i < 8; i++) { if (!R[8][size - 1 - i]) setFn(8, size - 1 - i, false); if (!R[size - 1 - i][8]) setFn(size - 1 - i, 8, false); }

            const MASKS = [
                (r, c) => (r + c) % 2 === 0,
                (r, c) => r % 2 === 0,
                (r, c) => c % 3 === 0,
                (r, c) => (r + c) % 3 === 0,
                (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
                (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
                (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
                (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
            ];

            function formatBits(mask) {
                const data = (0b01 << 3) | mask; // EC level L = 01
                let rem = data << 10;
                for (let i = 14; i >= 10; i--) {
                    if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
                }
                return (((data << 10) | rem) ^ 0x5412) & 0x7FFF;
            }

            function buildWithMask(mask) {
                const m = T.map((row) => row.slice());
                const fn = MASKS[mask];
                const totalBits = full.length * 8;
                let bitIdx = 0;
                const nextBit = () => {
                    if (bitIdx >= totalBits) return 0;
                    const bit = (full[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
                    bitIdx++;
                    return bit;
                };
                let up = true;
                for (let right = size - 1; right >= 1; right -= 2) {
                    if (right === 6) right--;
                    for (let vert = 0; vert < size; vert++) {
                        for (let j = 0; j < 2; j++) {
                            const c = right - j;
                            const r = up ? size - 1 - vert : vert;
                            if (R[r][c]) continue;
                            m[r][c] = (nextBit() === 1) !== fn(r, c);
                        }
                    }
                    up = !up;
                }
                const fmt = formatBits(mask);
                const fb = (i) => (fmt >> i) & 1;
                for (let i = 0; i <= 5; i++) m[8][i] = fb(i) === 1;
                m[8][7] = fb(6) === 1;
                m[8][8] = fb(7) === 1;
                m[7][8] = fb(8) === 1;
                for (let i = 9; i <= 14; i++) m[14 - i][8] = fb(i) === 1;
                for (let i = 0; i <= 6; i++) m[size - 1 - i][8] = fb(i) === 1;
                for (let i = 7; i <= 14; i++) m[8][size - 15 + i] = fb(i) === 1;
                return m;
            }

            function penalty(m) {
                let score = 0;
                for (let axis = 0; axis < 2; axis++) {
                    for (let i = 0; i < size; i++) {
                        let run = 1;
                        for (let j = 1; j < size; j++) {
                            const cur = axis === 0 ? m[i][j] : m[j][i];
                            const prev = axis === 0 ? m[i][j - 1] : m[j - 1][i];
                            if (cur === prev) { run++; if (j === size - 1 && run >= 5) score += 3 + (run - 5); }
                            else { if (run >= 5) score += 3 + (run - 5); run = 1; }
                        }
                    }
                }
                for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
                    if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) score += 3;
                }
                const pat = [true, false, true, true, true, false, true];
                const seqAt = (get, start) => pat.every((p, k) => get(start + k) === p);
                const lightAfter = (get, start) => {
                    let n = 0;
                    for (let k = start + 7; k < start + 11; k++) { if (k >= size || get(k)) break; n++; }
                    return n === 4;
                };
                const lightBefore = (get, start) => {
                    let n = 0;
                    for (let k = start - 1; k >= start - 4; k--) { if (k < 0 || get(k)) break; n++; }
                    return n === 4;
                };
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j <= size - 7; j++) {
                        if (seqAt((k) => m[i][k], j) && (lightBefore((k) => m[i][k], j) || lightAfter((k) => m[i][k], j))) score += 40;
                        if (seqAt((k) => m[k][i], j) && (lightBefore((k) => m[k][i], j) || lightAfter((k) => m[k][i], j))) score += 40;
                    }
                }
                let dark = 0;
                for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
                const ratio = (dark * 100) / (size * size);
                score += Math.floor(Math.abs(ratio - 50) / 5) * 10;
                return score;
            }

            let best = null, bestScore = Infinity;
            for (let mask = 0; mask < 8; mask++) {
                const m = buildWithMask(mask);
                const s = penalty(m);
                if (s < bestScore) { bestScore = s; best = m; }
            }
            return { size, modules: best };
        }

        /* [R3] returns a live SVG Element (was an HTML string — the QR
         * modal then spliced it into an innerHTML template). */
        function svg(text, size = 220) {
            const enc = qrEncode(text);
            if (!enc) return null;
            const s = enc.size;
            const m = enc.modules;
            const cs = size / s;
            let path = '';
            for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (m[r][c]) path += `M${c * cs},${r * cs}h${cs}v${cs}h-${cs}z`;
            const NS2 = 'http://www.w3.org/2000/svg';
            const out = document.createElementNS(NS2, 'svg');
            out.setAttribute('xmlns', NS2);
            out.setAttribute('viewBox', `0 0 ${size} ${size}`);
            out.setAttribute('width', String(size));
            out.setAttribute('height', String(size));
            const rect = document.createElementNS(NS2, 'rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', 'white');
            const p = document.createElementNS(NS2, 'path');
            p.setAttribute('d', path);
            p.setAttribute('fill', 'black');
            out.append(rect, p);
            return out;
        }
        return {
            show: async (file) => {
                const proxy = await ProxyManager.best(file.id);
                const url = ProxyManager.url(proxy, file.id, { download: true });
                const qrSvg = svg(url, 240);
                if (!qrSvg) { Toast.error('URL exceeds QR capacity (106 bytes)'); return; }
                Modal.open({
                    title: '\uD83D\uDCF1 QR Code',
                    body: el('div', { style: 'text-align:center' },
                        el('div', { style: 'background:white;display:inline-block;padding:16px;border-radius:8px' }, qrSvg),
                        el('p', { style: 'font-size:11px;color:#67E8F9;word-break:break-all;margin:12px 0' }, url),
                        el('p', { style: 'font-size:11px;color:#666;background:rgba(10,19,26,0.55);padding:6px 10px;border-radius:4px' },
                            'Note: Scanner app needs to send Referer: https://pixeldrain.com/'),
                        el('button', { class: `${NS}-btn`, style: 'margin-top:8px', id: `${NS}-qr-copy-btn` }, '\uD83D\uDCCB Copy URL'))
                });
                document.getElementById(`${NS}-qr-copy-btn`).addEventListener('click', async () => {
                    const ok = await copyToClipboard(url);
                    Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
                });
            }
        };
    })();

    // ================================================================
    // 15. PAGE DETECTION & VIEWER PATCH
    // ================================================================
    const Page = {
        kind() {
            const p = location.pathname;
            if (/^\/l\//.test(p)) return 'list';
            if (/^\/u\//.test(p)) return 'file';
            if (/^\/file\//.test(p)) return 'file-legacy';
            if (/^\/d\//.test(p)) return 'fs';
            return 'other';
        },
        id() { const m = location.pathname.match(/^\/(?:u|l|file)\/([\w-]+)/); return m ? m[1] : null; },
        fsPath() { const m = location.pathname.match(/^\/d\/(.+)/); return m ? decodeURIComponent(m[1]) : null; }
    };

    function getViewerData() {
        try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow.viewer_data) return unsafeWindow.viewer_data; } catch {}
        try { const el = document.querySelector('#viewer_data,[data-viewer],script[type="application/json"]'); if (el) return JSON.parse(el.textContent); } catch {}
        try { if (window.viewer_data) return window.viewer_data; } catch {}
        return null;
    }

    function getCurrentFileFromViewer() {
        const v = getViewerData();
        if (!v) return null;
        if (v.api_response && v.api_response.id) return v.api_response;
        if (v.api_response && Array.isArray(v.api_response.files)) {
            const i = v.current_file_index || 0;
            return v.api_response.files[i] || v.api_response.files[0];
        }
        return null;
    }

    function patchVideoLoggedRestriction() {
        if (!SETTINGS.bypassVideoLogged) return;
        const unlock = (v) => {
            if (!v) return;
            const apply = (r) => {
                if (!r) return;
                r.allow_video_player = true;
                r.can_download = true;
                r.availability = '';
                r.availability_message = '';
                if (SETTINGS.bypassShowAds) r.show_ads = false;
            };
            apply(v.api_response);
            if (v.api_response && Array.isArray(v.api_response.files)) v.api_response.files.forEach(apply);
        };

        const target = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        try {
            let _v = target.viewer_data;
            unlock(_v);
            if (SETTINGS.bypassViewerContinuous) {
                Object.defineProperty(target, 'viewer_data', {
                    configurable: true,
                    get() { return _v; },
                    set(v) { unlock(v); _v = v; }
                });
            }
        } catch (e) { Log.warn('viewer patch:', e.message); }

        const tick = () => unlock(getViewerData());
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
        else tick();
        let n = 0;
        const t = setInterval(() => { tick(); if (++n > 30) clearInterval(t); }, 200);
    }

    // ================================================================
    // 16. STYLES
    // ================================================================
    const STYLES = `
    .${NS}-toast-container{position:fixed;top:1rem;right:1rem;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:420px;pointer-events:none}
    .${NS}-toast{pointer-events:auto;background:rgba(10,19,26,0.85);color:#67E8F9;padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.4);border-left:4px solid #00E5FF;animation:${NS}-slide .25s ease-out}
    .${NS}-toast.success{border-left-color:#00E5FF}.${NS}-toast.warn{border-left-color:#67E8F9}.${NS}-toast.error{border-left-color:#ff0055}.${NS}-toast.info{border-left-color:#67E8F9}
    @keyframes ${NS}-slide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .${NS}-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:6px;border:1px solid rgba(0,229,255,0.2);background:rgba(10,19,26,0.65);color:#00E5FF;font-size:12px;cursor:pointer;white-space:nowrap;transition:all 150ms ease-in-out;font-family:'JetBrains Mono',monospace}
    .${NS}-btn:hover{background:rgba(0,229,255,0.15);border-color:#00E5FF;color:#fff}
    .${NS}-btn.primary{background:rgba(0,229,255,0.2);border-color:#00E5FF;color:#fff;font-weight:600}.${NS}-btn.primary:hover{background:rgba(0,229,255,0.35)}
    .${NS}-btn.gold{background:rgba(103,232,249,0.15);border-color:#67E8F9;color:#fff;font-weight:600}.${NS}-btn.gold:hover{background:rgba(103,232,249,0.3)}
    .${NS}-btn.danger{background:rgba(255,0,85,0.3);border-color:#ff0055;color:#fff}.${NS}-btn.danger:hover{background:#804040}
    .${NS}-btn:disabled{opacity:.5;cursor:not-allowed}
    .${NS}-btn-group{display:inline-flex;gap:0}.${NS}-btn-group .${NS}-btn{border-radius:0}.${NS}-btn-group .${NS}-btn:first-child{border-radius:6px 0 0 6px}.${NS}-btn-group .${NS}-btn:last-child{border-radius:0 6px 6px 0}
    .${NS}-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;display:flex;align-items:center;justify-content:center;animation:${NS}-fade .15s}
    @keyframes ${NS}-fade{from{opacity:0}to{opacity:1}}
    .${NS}-modal{background:rgba(10,19,26,0.72);border-radius:12px;max-width:650px;width:92vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.5)}
    .${NS}-modal-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid rgba(0,229,255,0.2)}
    .${NS}-modal-title{font-weight:600;font-size:15px}
    .${NS}-modal-close{background:none;border:none;color:#67E8F9;font-size:22px;cursor:pointer;padding:0 4px}.${NS}-modal-close:hover{color:#ff0055}
    .${NS}-modal-body{padding:18px;overflow-y:auto;flex:1}
    .${NS}-modal-foot{padding:12px 18px;border-top:1px solid rgba(0,229,255,0.2);display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
    .${NS}-input{background:rgba(10,19,26,0.55);color:#67E8F9;border:1px solid rgba(0,229,255,0.2);border-radius:4px;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box;font-family:'JetBrains Mono',monospace}
    .${NS}-input:focus{outline:none;border-color:#00E5FF}
    .${NS}-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}.${NS}-row label{flex:1;font-size:13px}.${NS}-row input[type=checkbox]{width:16px;height:16px;cursor:pointer}
    .${NS}-progress{width:100%;height:10px;background:rgba(10,19,26,0.55);border-radius:5px;overflow:hidden;margin-top:8px}
    .${NS}-progress-bar{height:100%;background:linear-gradient(90deg,#00E5FF,#67E8F9);width:0%;transition:width .2s ease}
    .${NS}-stat{font-size:11px;color:#67E8F9;margin-top:4px;display:flex;justify-content:space-between}
    .${NS}-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;margin:2px}
    .${NS}-pill.ok{background:rgba(0,229,255,0.15);color:#00E5FF}.${NS}-pill.bad{background:rgba(255,0,85,0.15);color:#ff0055}.${NS}-pill.gold{background:rgba(103,232,249,0.12);color:#67E8F9}.${NS}-pill.info{background:rgba(10,19,26,0.55);color:#67E8F9}
    .${NS}-toolbar{display:inline-flex;gap:6px;flex-wrap:wrap;margin:6px 0;align-items:center}
    .${NS}-section-title{margin:14px 0 10px;font-size:13px;color:#00E5FF;font-weight:600;border-bottom:1px solid rgba(0,229,255,0.2);padding-bottom:4px}
    .${NS}-banner{background:rgba(10,19,26,0.85);padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:12px;border-left:3px solid #00E5FF;line-height:1.5}
    .${NS}-badge{position:fixed;bottom:1rem;right:1rem;background:rgba(10,19,26,0.72);border:1px solid rgba(0,229,255,0.2);border-radius:8px;padding:6px 10px;font-size:11px;color:#67E8F9;z-index:99990;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;transition:all .2s}
    .${NS}-badge:hover{border-color:#00E5FF;color:#67E8F9}
    .${NS}-file-info{background:rgba(10,19,26,0.55);border-radius:6px;padding:10px 14px;margin-bottom:10px;font-size:12px;line-height:1.6}
    `;

    function injectStyles() {
        if (Caps.gmAddStyle) GM_addStyle(STYLES);
        else { const s = document.createElement('style'); s.textContent = STYLES; (document.head || document.documentElement).appendChild(s); }
    }

    // ================================================================
    // 17. TOAST & MODAL
    // ================================================================
    const Toast = (() => {
        let container;
        const ensure = () => {
            if (container && document.body && document.body.contains(container)) return container;
            container = document.createElement('div');
            container.className = `${NS}-toast-container`;
            (document.body || document.documentElement).appendChild(container);
            return container;
        };
        const show = (msg, kind = 'info', timeout = 4000) => {
            if (!SETTINGS.notificationsEnabled) return;
            const el = document.createElement('div');
            el.className = `${NS}-toast ${kind}`;
            el.textContent = msg;
            ensure().appendChild(el);
            if (timeout > 0) setTimeout(() => {
                el.style.transition = 'opacity .3s, transform .3s';
                el.style.opacity = '0';
                el.style.transform = 'translateX(50px)';
                setTimeout(() => el.remove(), 300);
            }, timeout);
            return el;
        };
        /* [R3] element-built toast: children is a Node or array of Nodes —
         * replaces the retired Toast.html string path. */
        const node = (children, kind = 'info', timeout = 4000) => {
            if (!SETTINGS.notificationsEnabled) return;
            const el = document.createElement('div');
            el.className = `${NS}-toast ${kind}`;
            el.append(...(Array.isArray(children) ? children : [children]).filter(Boolean));
            ensure().appendChild(el);
            if (timeout > 0) setTimeout(() => {
                el.style.transition = 'opacity .3s, transform .3s';
                el.style.opacity = '0';
                el.style.transform = 'translateX(50px)';
                setTimeout(() => el.remove(), 300);
            }, timeout);
            return el;
        };
        return {
            show, ensure, node,
            info: (m, t) => show(m, 'info', t),
            success: (m, t) => show(m, 'success', t),
            warn: (m, t) => show(m, 'warn', t),
            error: (m, t) => show(m, 'error', t || 6000)
        };
    })();

    const Modal = {
        /* [R3] body/footer accept a Node or array of Nodes (strings are
         * gone — the innerHTML paths are retired). */
        open({ title = '', body = null, footer = null, onClose } = {}) {
            const bg = document.createElement('div');
            bg.className = `${NS}-modal-bg`;
            const closeBtn = el('button', { class: `${NS}-modal-close` }, '\u00D7');
            const bodyEl = el('div', { class: `${NS}-modal-body` });
            const modal = el('div', { class: `${NS}-modal` },
                el('div', { class: `${NS}-modal-head` },
                    el('span', { class: `${NS}-modal-title` }, title),
                    closeBtn),
                bodyEl,
                footer ? el('div', { class: `${NS}-modal-foot` }) : null);
            bg.append(modal);
            const footEl = bg.querySelector(`.${NS}-modal-foot`);
            if (body) bodyEl.append(...(Array.isArray(body) ? body : [body]));
            if (footEl && footer) footEl.append(...(Array.isArray(footer) ? footer : [footer]));
            const close = () => { try { onClose && onClose(); } catch {} bg.remove(); };
            closeBtn.addEventListener('click', close);
            bg.addEventListener('click', e => { if (e.target === bg) close(); });
            document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
            (document.body || document.documentElement).appendChild(bg);
            return { el: bg, body: bodyEl, footer: footEl, close };
        }
    };

    function copyToClipboard(text) {
        if (Caps.gmClipboard) { try { GM_setClipboard(text); return Promise.resolve(true); } catch {} }
        if (navigator.clipboard) return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        return Promise.resolve(false);
    }

    // ================================================================
    // 18. SETTINGS PANEL
    // ================================================================
    function openSettingsPanel() {
        const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
        const bw = BandwidthTracker.load();
        const body = document.createElement('div');
        const authBadge = SETTINGS.apiKey
            ? el('span', { class: `${NS}-pill gold` }, '★ premium')
            : el('span', { class: `${NS}-pill bad` }, 'free tier');
        const bwPct = BandwidthTracker.getPct();
        const bwColor = bwPct > 80 ? 'bad' : bwPct > 50 ? 'gold' : 'ok';

        /* [R3] settings panel — element-built (was the script's largest
         * innerHTML template). Structure, classes, data-k keys and styles
         * preserved 1:1; the data-k hydration loop below is unchanged. */
        const sectionTitle = (t) => el('div', { class: `${NS}-section-title` }, t);
        const row = (...kids) => el('div', { class: `${NS}-row` }, kids);
        const label = (t) => el('label', null, t);
        const inp = (type, k, extra = {}) => el('input', Object.assign({ type, 'data-k': k, class: `${NS}-input` }, extra));
        const cbox = (k) => el('input', { type: 'checkbox', 'data-k': k });
        const num = (k, min, max, style) => el('input', { type: 'number', 'data-k': k, class: `${NS}-input`, style, min, max });
        const strategyOptions = [
            ['auto', '⚡ Auto (smartest pick)'],
            ['premium_direct', '★ Premium direct'],
            ['speed_multiplied', '⚡ Speed multiplied (N×1MB/s)'],
            ['multi_proxy_ranged', 'Multi-proxy chunked'],
            ['single_host_ranged', 'Single-host ranged'],
            ['gm_stream_fsa', 'GM → FSA stream'],
            ['native_fetch', 'Native fetch (no-referrer)'],
            ['gm_blob', 'GM blob (in-RAM)'],
            ['gm_download', 'GM_download (browser)'],
        ];
        body.append(
            el('div', { class: `${NS}-banner` },
                el('strong', null, `Pixeldrain Bypass Pro v${VERSION}`), el('br'),
                `Speed multiplication: ${SETTINGS.maxTotalConnections} parallel connections × 1 MB/s = up to ${SETTINGS.maxTotalConnections} MB/s`, el('br'),
                authBadge,
                el('span', { class: `${NS}-pill ${Caps.fsAccess ? 'ok' : 'bad'}` }, `FSA ${Caps.fsAccess ? '✓' : '✗'}`),
                el('span', { class: `${NS}-pill ${Caps.streams ? 'ok' : 'bad'}` }, `streams ${Caps.streams ? '✓' : '✗'}`),
                el('span', { class: `${NS}-pill ${Caps.gmDownload ? 'ok' : 'bad'}` }, `GM_dl ${Caps.gmDownload ? '✓' : '✗'}`),
                el('span', { class: `${NS}-pill ${bwColor}` }, `BW: ${bwPct.toFixed(1)}%`)),

            sectionTitle('★ Premium Auth (Layer A)'),
            row(label('API Key'), inp('password', 'apiKey', { placeholder: 'paste pixeldrain API key', style: 'max-width:320px' })),
            row(label('Use direct when authenticated'), cbox('useDirectIfAuth')),
            row(label('Direct threshold (bytes)'), num('directThresholdBytes', null, null, 'max-width:140px')),
            row(el('button', { class: `${NS}-btn ${NS}-test-auth` }, '🔑 Verify'),
                el('span', { class: `${NS}-auth-result`, style: 'font-size:12px;color:#67E8F9;margin-left:8px' })),

            sectionTitle('⚡ Speed Multiplication'),
            row(label('Enable speed multiplier'), cbox('speedMultiplier')),
            row(label('Connections per mirror'), num('connectionsPerMirror', '1', '8', 'max-width:80px')),
            row(label('Max total connections'), num('maxTotalConnections', '2', '64', 'max-width:80px')),

            sectionTitle('Strategy'),
            row(label('Primary'),
                el('select', { class: `${NS}-input`, 'data-k': 'primaryStrategy', style: 'max-width:320px' },
                    strategyOptions.map(([v, t]) => el('option', { value: v }, t)))),
            row(label('Auto failover'), cbox('autoFailover')),
            row(label('Pre-flight check'), cbox('preflightCheck')),
            row(label('Auto-download on load'), cbox('autoTriggerOnLoad')),

            sectionTitle('Chunking'),
            row(label('Max chunks'), num('multiProxyChunks', '2', '64', 'max-width:80px')),
            row(label('Concurrency'), num('chunkConcurrency', '1', '64', 'max-width:80px')),
            row(label('Retries'), num('chunkRetry', '0', '10', 'max-width:80px')),
            row(label('Adaptive chunking'), cbox('adaptiveChunking')),
            row(label('Resumable'), cbox('resumableEnabled')),

            sectionTitle('Bypass & Protection'),
            row(label('Video unlock (logged-in gate)'), cbox('bypassVideoLogged')),
            row(label('Continuous viewer patch'), cbox('bypassViewerContinuous')),
            row(label('Hide ads'), cbox('bypassShowAds')),
            row(label('View-pad (prevent captcha)'), cbox('viewPadEnabled')),
            row(label('Captcha pre-check'), cbox('captchaPreCheck')),
            row(label('Captcha auto-open tab'), cbox('captchaAutoOpen')),

            sectionTitle('Circuit Breaker'),
            row(label('Failure threshold'), num('circuitBreakerThreshold', '1', '10', 'max-width:80px')),
            row(label('Cooldown (ms)'), num('circuitBreakerCooldown', null, null, 'max-width:120px')),

            sectionTitle(`Proxies (${PROXY_MIRRORS.length} built-in)`),
            row(label('Custom hosts'), inp('text', 'customProxy', { placeholder: 'host1,host2,...', style: 'max-width:320px' })),
            row(label('Probe file ID'), inp('text', 'healthProbeId', { placeholder: 'optional', style: 'max-width:200px' })),
            row(
                el('button', { class: `${NS}-btn ${NS}-test` }, '🔍 Test All'),
                el('button', { class: `${NS}-btn ${NS}-unblock` }, '🔓 Unblock'),
                el('button', { class: `${NS}-btn ${NS}-reset-cb` }, 'Reset Circuits')),
            el('div', { class: `${NS}-results`, style: 'font-size:11px;color:#67E8F9;margin-top:6px;max-height:120px;overflow-y:auto' }),

            sectionTitle('External Downloaders'),
            row(label('JDownloader URL'), inp('text', 'jdownloaderUrl', { style: 'max-width:320px' })),
            row(label('Aria2 RPC URL'), inp('text', 'aria2RpcUrl', { style: 'max-width:320px' })),
            row(label('Aria2 secret'), inp('text', 'aria2Secret', { style: 'max-width:200px' })),
            row(label('Aria2 connections'), num('aria2MaxConn', '1', '64', 'max-width:80px')),

            sectionTitle('UI'),
            row(label('Notifications'), cbox('notificationsEnabled')),
            row(label('Debug log'), cbox('debugLog')),

            sectionTitle('Stats & Bandwidth'),
            el('div', { class: `${NS}-file-info` },
                'Downloads: ', el('strong', null, String(stats.count || 0)), ' · Total: ', el('strong', null, formatBytes(stats.bytes || 0)), el('br'),
                'Saved bandwidth: ', el('strong', null, formatBytes(stats.savedBandwidth || 0)), ' (via proxy, 0 cost to your cap)', el('br'),
                'Current session BW used: ', el('strong', null, formatBytes(bw.used || 0)), ` / ${formatBytes(BANDWIDTH_CAP)} (${bwPct.toFixed(1)}%)`, el('br'),
                'Remaining: ', el('strong', null, formatBytes(BandwidthTracker.getRemaining()))),
            el('div', { class: `${NS}-row`, style: 'margin-top:8px' },
                el('button', { class: `${NS}-btn ${NS}-reset-stats` }, 'Reset stats'),
                el('button', { class: `${NS}-btn ${NS}-reset-bw` }, 'Reset BW'),
                el('button', { class: `${NS}-btn ${NS}-cleanup` }, 'Cleanup jobs'),
                el('button', { class: `${NS}-btn ${NS}-show-jobs` }, '📋 Jobs')),
            el('div', { style: 'margin-top:14px;font-size:11px;color:rgba(103,232,249,0.5);text-align:center' },
                `v${VERSION} · ${PROXY_MIRRORS.length} mirrors · Circuit breaker · Speed multiplication`));

        const footer = [
            el('button', { class: `${NS}-btn ${NS}-cancel` }, 'Cancel'),
            el('button', { class: `${NS}-btn primary ${NS}-save` }, '💾 Save')
        ];
        const m = Modal.open({ title: `⚙ Pixeldrain Bypass Pro v${VERSION}`, body, footer });

        body.querySelectorAll('[data-k]').forEach(el => {
            const v = SETTINGS[el.dataset.k];
            if (el.type === 'checkbox') el.checked = !!v;
            else if (el.tagName === 'SELECT') el.value = v || '';
            else el.value = v != null ? v : '';
        });

        body.querySelector(`.${NS}-test-auth`).addEventListener('click', async ev => {
            ev.target.disabled = true;
            const inp = body.querySelector('[data-k="apiKey"]');
            const prev = SETTINGS.apiKey;
            SETTINGS = saveSettings({ apiKey: inp.value.trim() });
            const u = await PDApi.user();
            SETTINGS = saveSettings({ apiKey: prev });
            const r = body.querySelector(`.${NS}-auth-result`);
            if (u && (u.username || u.email)) {
                r.replaceChildren(el('span', { class: `${NS}-pill ok` },
                    `✓ ${u.username || u.email}${u.subscription ? ' · ' + (u.subscription.name || u.subscription.type || 'premium') : ''}`));
            } else r.replaceChildren(el('span', { class: `${NS}-pill bad` }, '✗ invalid'));
            ev.target.disabled = false;
        });

        body.querySelector(`.${NS}-test`).addEventListener('click', async ev => {
            ev.target.disabled = true;
            const probeId = body.querySelector('[data-k="healthProbeId"]').value.trim() || Page.id() || '';
            const r = await ProxyManager.checkAll(true, probeId);
            const sorted = [...r].sort((a, b) => (a.ok ? a.ms : 99999) - (b.ok ? b.ms : 99999));
            const resultBox = body.querySelector(`.${NS}-results`);
            resultBox.replaceChildren();
            sorted.forEach((x, i) => {
                if (i > 0) resultBox.append(' ');
                resultBox.append(el('span', { class: `${NS}-pill ${x.ok ? 'ok' : 'bad'}` },
                    `${x.proxy.name}: ${x.ok ? Math.round(x.ms) + 'ms' : '✗' + (x.status ? ' ' + x.status : '')}`));
            });
        });

        body.querySelector(`.${NS}-unblock`).addEventListener('click', () => { ProxyManager.unblockAll(); Toast.success('Unblocked all'); });
        body.querySelector(`.${NS}-reset-cb`).addEventListener('click', () => { CircuitBreaker.reset(); Toast.success('Circuits reset'); });
        body.querySelector(`.${NS}-reset-stats`).addEventListener('click', () => {
            SETTINGS = saveSettings({ downloadStats: { count: 0, bytes: 0, savedBandwidth: 0, lastReset: Date.now() } });
            Toast.success('Stats reset'); m.close();
        });
        body.querySelector(`.${NS}-reset-bw`).addEventListener('click', () => { BandwidthTracker.reset(); Toast.success('BW reset'); m.close(); });
        body.querySelector(`.${NS}-cleanup`).addEventListener('click', () => { Toast.success(`Cleaned ${ResumeManager.cleanup(0)}`); });
        body.querySelector(`.${NS}-show-jobs`).addEventListener('click', () => {
            const jobs = ResumeManager.getPendingJobs();
            if (!jobs.length) { Toast.info('No pending jobs'); return; }
            const html = jobs.map(j => {
                const sum = j.chunks.reduce((a, b) => a + b, 0);
                const pct = j.fileSize ? (sum / j.fileSize * 100).toFixed(1) : '?';
                return `<div style="padding:6px;border-bottom:1px solid rgba(0,229,255,0.2)"><strong>${escapeHTML(j.fileName)}</strong> · ${pct}% (${formatBytes(sum)} / ${formatBytes(j.fileSize)})</div>`;
            }).join('');
            Modal.open({ title: `Pending Jobs (${jobs.length})`, body: html });
        });

        m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        m.el.querySelector(`.${NS}-save`).addEventListener('click', () => {
            const patch = {};
            body.querySelectorAll('[data-k]').forEach(el => {
                const k = el.dataset.k;
                if (el.type === 'checkbox') patch[k] = el.checked;
                else if (el.type === 'number') patch[k] = Number(el.value) || DEFAULTS[k];
                else patch[k] = el.value.trim();
            });
            SETTINGS = saveSettings(patch);
            Toast.success('Settings saved');
            m.close();
        });
    }

    // ================================================================
    // 19. TOOLBAR BUILDER
    // ================================================================
    function buildToolbar(file, kind, files = null) {
        const tb = document.createElement('div');
        tb.className = `${NS}-toolbar`;
        tb.dataset.pdbp = '1';
        const mk = (text, title, handler, cls = '') => {
            const b = document.createElement('button');
            b.className = `${NS}-btn ${cls}`.trim();
            b.textContent = text;
            b.title = title;
            b.addEventListener('click', handler);
            return b;
        };

        const hasAuth = !!PDApi._authHeader();

        if ((kind === 'file' || kind === 'file-legacy' || kind === 'fs') && file) {
            tb.appendChild(mk('⬇ Download', `Smart download (auto)${hasAuth ? ' · premium' : ''}`, () => Downloader.run(file, 'auto'), 'primary'));

            if (hasAuth) tb.appendChild(mk('★ Premium', 'Direct via API key (no cap)', () => Downloader.run(file, 'premium_direct'), 'gold'));

            if (Caps.fsAccess && SETTINGS.speedMultiplier) {
                tb.appendChild(mk('⚡ Speed×', `Speed multiplied (${SETTINGS.maxTotalConnections} connections)`, () => Downloader.run(file, 'speed_multiplied')));
            }

            if (Caps.fsAccess) {
                tb.appendChild(mk('📦 Multi', 'Multi-proxy chunked', () => Downloader.run(file, 'multi_proxy_ranged')));
            }
            if (Caps.gmDownload) tb.appendChild(mk('📥 GM', 'GM_download', () => Downloader.run(file, 'gm_download')));

            if ((file.mime_type || '').match(/^(video|audio)\//)) {
                tb.appendChild(mk('▶ Play', 'Stream via proxy', () => Strategies.stream({ id: file.id, name: file.name, mime: file.mime_type })));
            }

            tb.appendChild(mk('🔗 Copy', 'Copy proxy URL', async () => {
                const p = await ProxyManager.best(file.id);
                const url = ProxyManager.url(p, file.id, { download: true });
                const ok = await copyToClipboard(url);
                Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
            }));

            tb.appendChild(mk('📤 Export', 'curl/wget/aria2c/IDM/axel/PS', () => ExportGenerator.showModal(file)));

            tb.appendChild(mk('📱 QR', 'QR code', () => QRCode.show(file)));

            tb.appendChild(mk('JD', 'Send to JDownloader', async () => {
                try {
                    const p = await ProxyManager.best(file.id);
                    await Strategies.jdownloader({ urls: ProxyManager.url(p, file.id, { download: true }) });
                    Toast.success('Sent to JDownloader');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('Aria2', 'Send to Aria2 RPC', async () => {
                try {
                    const p = await ProxyManager.best(file.id);
                    await Strategies.aria2({ urls: ProxyManager.url(p, file.id, { download: true }), names: file.name });
                    Toast.success('Sent to Aria2');
                } catch (e) { Toast.error(e.message); }
            }));

            if (SETTINGS.resumableEnabled && ResumeManager.findByFile(file.id)) {
                tb.appendChild(mk('🔄 Resume', 'Resume incomplete download', () => Downloader.run(file, 'speed_multiplied')));
            }

            tb.appendChild(mk('ℹ Info', 'File info & preflight', async () => {
                const pf = await PDApi.preflight(file.id);
                const proxy = await ProxyManager.best(file.id);
                const infoRow = (k, v) => [el('strong', null, `${k}:`), ' ', v, el('br')];
                Modal.open({
                    title: 'File Info',
                    body: el('div', { class: `${NS}-file-info` },
                        infoRow('Name', pf.name || file.name),
                        infoRow('Size', formatBytes(pf.size || file.size)),
                        infoRow('MIME', pf.mime || file.mime_type || 'unknown'),
                        infoRow('Can download', pf.canDownload ? '✓' : '✗'),
                        infoRow('Captcha needed', pf.needsCaptcha ? '⚠ YES' : '✓ No'),
                        pf.availability ? infoRow('Availability', pf.availability) : null,
                        infoRow('Speed limit', `${formatBytes(pf.speedLimit || SPEED_LIMIT_PER_CONN)}/s per connection`),
                        infoRow('Best mirror', proxy.host),
                        el('strong', null, 'Proxy URL:'), ' ',
                        el('span', { style: 'word-break:break-all' }, ProxyManager.url(proxy, file.id)))
                });
            }));
        }

        if (kind === 'list' && files && files.length) {
            const valid = files.filter(f => !f.availability && !f.availability_message);
            tb.appendChild(mk(`⬇ All (${valid.length})`, 'Batch download', () => Downloader.runBatch(valid, 'auto'), 'primary'));
            tb.appendChild(mk('🔗 All URLs', 'Copy all proxy URLs', async () => {
                const p = await ProxyManager.best();
                const urls = valid.map(f => ProxyManager.url(p, f.id, { download: true })).join('\n');
                const ok = await copyToClipboard(urls);
                Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
            }));
            tb.appendChild(mk('📤 Batch', 'Export all commands', () => ExportGenerator.showBatch(valid)));
            tb.appendChild(mk('JD All', 'All to JDownloader', async () => {
                try {
                    const p = await ProxyManager.best();
                    await Strategies.jdownloader({ urls: valid.map(f => ProxyManager.url(p, f.id, { download: true })) });
                    Toast.success('Sent');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('Aria2 All', 'All to Aria2', async () => {
                try {
                    const p = await ProxyManager.best();
                    await Strategies.aria2({
                        urls: valid.map(f => ProxyManager.url(p, f.id, { download: true })),
                        names: valid.map(f => f.name)
                    });
                    Toast.success('Sent');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('📦 ZIP', 'Server-side ZIP', async () => {
                const id = Page.id();
                const p = PROXY_MIRRORS.find(m => m.zip) || (await ProxyManager.best());
                window.open(ProxyManager.url(p, id, { zip: true }));
            }));
        }

        tb.appendChild(mk('⚙', 'Settings', openSettingsPanel));
        return tb;
    }

    // ================================================================
    // 20. INJECTION & INIT
    // ================================================================
    function injectIntoToolbar(el) {
        if (!el || el.dataset.pdbpInjected) return;
        const kind = Page.kind();
        let file = getCurrentFileFromViewer(), files = null;
        const v = getViewerData();
        if (kind === 'list' && v && v.api_response && Array.isArray(v.api_response.files)) {
            files = v.api_response.files;
            if (!file) file = files[0];
        }
        if (!file && !files) return;
        const toolbar = buildToolbar(file, kind, files);
        el.parentElement && el.parentElement.insertBefore(toolbar, el.nextSibling);
        el.dataset.pdbpInjected = '1';
    }

    function injectFallback() {
        if (document.querySelector(`[data-pdbp="1"]`)) return;
        const kind = Page.kind(), id = Page.id();
        if (!id && kind !== 'fs') return;

        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:99997;background:rgba(10,19,26,0.85);padding:12px;border-radius:10px;border:1px solid rgba(0,229,255,0.2);box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:90vw;overflow-x:auto';

        let file = getCurrentFileFromViewer();
        const v = getViewerData();
        const files = (v && v.api_response && Array.isArray(v.api_response.files)) ? v.api_response.files : null;

        if (!file && id) {
            file = { id, name: id, size: 0, mime_type: '' };
            PDApi.fileInfo(id).then(info => {
                file.name = info.name || id;
                file.size = info.size || 0;
                file.mime_type = info.mime_type || '';
            }).catch(() => {});
        }

        host.appendChild(buildToolbar(file, kind === 'list' ? 'list' : 'file', files));
        (document.body || document.documentElement).appendChild(host);
    }

    function injectBadge() {
        if (document.querySelector(`.${NS}-badge`)) return;
        const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
        const badge = document.createElement('div');
        badge.className = `${NS}-badge`;
        badge.title = 'Pixeldrain Bypass Pro — click for settings';
        const strong = document.createElement('strong');
        strong.textContent = 'PD Pro';
        badge.appendChild(strong);
        badge.appendChild(document.createTextNode(` v${VERSION} · ${stats.count} DLs · ${formatBytes(stats.savedBandwidth || 0)} saved`));
        badge.addEventListener('click', openSettingsPanel);
        (document.body || document.documentElement).appendChild(badge);
    }

    function registerMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand('⚙ Settings', openSettingsPanel);
        GM_registerMenuCommand('📊 Test Proxies', async () => {
            Toast.info('Testing mirrors…');
            const r = await ProxyManager.checkAll(true, Page.id() || '');
            const alive = r.filter(x => x.ok);
            Toast.info(`${alive.length}/${r.length} alive (best: ${alive.length ? Math.round(alive.sort((a, b) => a.ms - b.ms)[0].ms) + 'ms' : 'none'})`);
        });
        GM_registerMenuCommand(`🚀 Strategy: ${SETTINGS.primaryStrategy}`, openSettingsPanel);
        GM_registerMenuCommand('🔓 Unblock all mirrors', () => { ProxyManager.unblockAll(); Toast.success('Unblocked'); });
        GM_registerMenuCommand('🧹 Cleanup resume jobs', () => Toast.success(`Cleaned ${ResumeManager.cleanup(0)}`));
        GM_registerMenuCommand('❌ Cancel all downloads', () => { Downloader.cancelAll(); Toast.warn('Cancelled'); });
        if (SETTINGS.apiKey) GM_registerMenuCommand('★ Premium: active', () => {});
    }

    function findToolbar() {
        return document.querySelector('.toolbar > .separator.svelte-jngqwx')
            || document.querySelector('.toolbar .separator')
            || document.querySelector('.toolbar')
            || document.querySelector('[class*="toolbar"]')
            || null;
    }

    function tryInject() {
        const el = findToolbar();
        if (el) injectIntoToolbar(el);
        else injectFallback();
    }

    // ================================================================
    // 21. MAIN INIT
    // ================================================================
    function init() {
        Log.info(`v${VERSION} init — Speed multiplication + Circuit breaker + ${PROXY_MIRRORS.length} mirrors`);

        try { patchVideoLoggedRestriction(); } catch (e) { Log.warn(e); }

        registerMenu();
        ResumeManager.cleanup();

        const onReady = () => {
            try { injectStyles(); } catch {}

            const obs = new MutationObserver(() => {
                const el = findToolbar();
                if (el && !el.dataset.pdbpInjected) injectIntoToolbar(el);
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => obs.disconnect(), 60000);

            let lastPath = location.pathname;
            const onNav = () => {
                if (location.pathname !== lastPath) {
                    lastPath = location.pathname;
                    setTimeout(() => {
                        document.querySelectorAll('[data-pdbp="1"]').forEach(e => e.remove());
                        document.querySelectorAll('[data-pdbp-injected]').forEach(e => delete e.dataset.pdbpInjected);
                        document.querySelectorAll(`[data-pdbp-injected]`).forEach(e => e.removeAttribute('data-pdbp-injected'));
                        try { patchVideoLoggedRestriction(); } catch {}
                        tryInject();
                    }, 600);
                }
            };
            const origPush = history.pushState, origReplace = history.replaceState;
            history.pushState = function () { origPush.apply(this, arguments); onNav(); };
            history.replaceState = function () { origReplace.apply(this, arguments); onNav(); };
            window.addEventListener('popstate', onNav);

            if (SETTINGS.captchaAutoDetect && document.body) {
                const co = new MutationObserver(() => {
                    if (CaptchaHandler.detectOnPage()) {
                        Toast.warn('⚠ Captcha detected on page!', 8000);
                        co.disconnect();
                    }
                });
                co.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => co.disconnect(), 20000);
            }

            if (SETTINGS.bandwidthTracker && BandwidthTracker.isNearCap()) {
                Toast.warn(`⚠ Bandwidth ${BandwidthTracker.getPct().toFixed(0)}% used. Using proxy mirrors to save cap.`, 6000);
            }

            setTimeout(() => {
                try { tryInject(); } catch (e) { Log.error(e); }
                injectBadge();

                if (Page.kind() === 'fs') {
                    const p = Page.fsPath();
                    if (p) PDApi.fsPath(p).then(() => injectFallback()).catch(() => {});
                }

                if ((Page.kind() === 'file' || Page.kind() === 'list') && SETTINGS.autoTriggerOnLoad) {
                    const f = getCurrentFileFromViewer();
                    if (f) {
                        Log.info('Auto-trigger download');
                        Downloader.run(f, 'auto').catch(() => {});
                    }
                }
            }, 500);
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') onReady();
        else document.addEventListener('DOMContentLoaded', onReady);
    }

    init();
})();
