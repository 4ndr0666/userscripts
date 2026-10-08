// ==UserScript==
// @name         4ndr0tools - Akasha Silence
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.2.1
// @description  Unified counter-surveillance defense layer with a three-stage strictness valve (full / core / off via Ctrl+Alt+Shift+K). Three-way consolidation of Anti-detection + Counter-surveillance + Anti-telemetry (ICC): anti-analysis script neutralization, telemetry sinkholing (fetch/XHR/beacon/WebSocket), WebRTC blinding, session-stable fingerprint spoofing (hardware/canvas/WebGL/audio), identifier poisoning, Google link-tracking sanitization and hostile-UI countermeasures.
// @author       4ndr0666
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Akasha%20Silence.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Akasha%20Silence.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
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


/* ═══════════════════════════════════════════════════════════════════════════
 * 4ndr0tools - Akasha Silence v5.2.0 — unified counter-surveillance layer
 * ─────────────────────────────────────────────────────────────────────────
 * CONSOLIDATION (three → one):
 *   • Anti-detection v1.1            — anti-analysis script neutralizer
 *   • Counter-surveillance v4.0.0    — telemetry/canvas/Google/site defenses
 *   • Anti-telemetry (ICC) v3.5.0    — SW/SharedWorker pacifier, iframe
 *                                      propagation, ICC blocklist entries
 * Every feature of all three survives here (GUP superset contract); the
 * ~70% duplicated core (DEADBEEF / MYCELIUM / network hooks) exists once.
 *
 * ENGINEERING UPGRADES over the union of the three predecessors:
 *   D1-STEALTH   All native-function hooks stay fingerprint-native:
 *                appendChild / insertBefore / createElement /
 *                pushState and the WebSocket/WebRTC/worker pacifiers are
 *                Proxy facades, and (v5.2.0) the fetch/XHR/beacon defusing
 *                rides the NetHook singleton whose wraps mask name,
 *                length AND toString() to the native source — defeating
 *                the hook-detection half of the arms race that plain
 *                reassignment loses.
 *   D2-STABILITY Fingerprint values are session-stable: navigator
 *                properties are memoized (the legacy per-call randomizers
 *                failed `navigator.hardwareConcurrency ===
 *                navigator.hardwareConcurrency` — an instant tell), and
 *                canvas noise is seeded PER-CANVAS, so reading the same
 *                canvas twice yields identical output while different
 *                canvases/sessions still differ.
 *   D3-COVERAGE  Canvas blinding now covers toDataURL/toBlob (the legacy
 *                getImageData-only hook was trivially bypassed), plus
 *                WebGL debug-renderer spoofing and AudioBuffer LSB noise.
 *   D4-SPOOF     Tracker WebSockets resolve to a PACIFIED phantom
 *                (ServiceGuard v7.3.0 doctrine): CONNECTING → OPEN at the
 *                40 ms cadence, sends swallowed silently, close() honored.
 *                Pages believe they have a live socket and never nag,
 *                retry, or fall back to noisier channels.
 *   D5-INTEROP   Worker/WebSocket control defers to 4ndr0serviceguard
 *                when its guard flags (window._4ndr0ghostV7 extension /
 *                __4ndr0ghostUserV7 userscript) are present — no double
 *                gating, no non-configurable property wars.
 *   D6-ASYNC     Mocked XHR responses are delivered on the 40 ms cadence
 *                with the full response surface (status/responseURL/
 *                headers + readystatechange/load/loadend events), so
 *                Promise-based call sites behave exactly as they would
 *                against a real (hostile) endpoint.
 *   D7-SCOPE     The SW/SharedWorker pacifier keeps its original
 *                ICC-scope (wan.video / kuaishou / aliyun / icc-cloud.kr)
 *                — every other defense runs globally.
 *
 * v5.1.0 (suite v1.3.0) — STRICTNESS RELIEF VALVE. The v5.0 posture was
 * all-or-nothing: when a defense broke a site (canvas-dependent editors,
 * g.alicdn-hosted libraries, sites whose functional API matched a broad
 * blocklist token), the only remedy was killing the whole script. Three
 * per-site profiles now exist, cycled live with Ctrl+Alt+Shift+K (the
 * page reloads to re-install hooks at the new posture):
 *   FULL — every defense (default; identical to v5.0).
 *   CORE — telemetry sinkholing, identifier poisoning, Google link
 *          sanitization and pushState SPM scrubbing only. Fingerprint
 *          spoofing (navigator/canvas/WebGL/audio), the anti-analysis
 *          neutralizer and the site-maintenance overrides are OFF — the
 *          three most frequent site-breakers.
 *   OFF  — completely inert (the hotkey stays armed so OFF is never a
 *          one-way door).
 * The profile persists per-origin in localStorage (grant:none page
 * context — no GM storage available by design, since sandboxing would
 * detach the hooks from the page). Also tightened two over-broad
 * blocklist entries that produced false positives on legitimate traffic:
 * '/track' now requires a path boundary (music sites' /tracks/<id> APIs
 * were being mocked dead) and the blanket 'g.alicdn.com' CDN entry is
 * narrowed to its known tracker artifacts (awsc/aplus/alidt paths).
 *
 * v5.2.0 (suite v1.4.5) — NETHOOK VETO MIGRATION. The fetch/XHR/beacon
 * tracker nullifiers no longer install their own Proxy facades — they
 * ride the suite's shared NetHook singleton (kernel/net.js v3, inlined
 * above by tools/build.mjs): ONE wrap set per realm no matter how many
 * suite scripts defuse or observe (the co-install stacking the v1.4.3
 * sink census measured). SPOOF doctrine is unchanged — tracker
 * fetches/XHRs resolve to the mocked 200 {success:true,code:0} phantom
 * (XHR delivered on the 40 ms D6 cadence with the full response
 * surface; responseURL is now truthful), beacons swallow and report
 * success, and identifier poisoning still rewrites outgoing bodies —
 * now as a hub {body} verdict. URL-object fetch targets are inspected
 * too (the facades only read strings and Request.url — a coverage
 * gap). WebSocket phantoms, WebRTC blinding and the SW/SharedWorker
 * pacifier stay local (not request-path semantics); §9 iframe
 * propagation arms the hub into child realms and keeps applying the
 * local pacifiers.
 * ═══════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const win = window;
    const domain = win.location.hostname;

    /* ══ §0 STRICTNESS PROFILE + RELIEF VALVE (v5.1.0) ═══════════════ */

    const PROFILE_KEY = 'akasha_silence_profile';
    const PROFILES = ['full', 'core', 'off'];
    let AKASHA_PROFILE = 'full';
    try {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (stored === 'full' || stored === 'core' || stored === 'off') AKASHA_PROFILE = stored;
    } catch (e) { /* private mode — 'full' default stands */ }
    const P_FULL = (AKASHA_PROFILE === 'full');
    const P_CORE = P_FULL || (AKASHA_PROFILE === 'core'); // core defenses on

    /* 3lectric-Glass toast (grant:none — no GM surfaces exist here). */
    function akashaToast(text) {
        try {
            const host = document.body || document.documentElement;
            if (!host) { console.log('[Ψ Akasha]', text); return; }
            const el = document.createElement('div');
            el.textContent = text;
            el.style.cssText = [
                'position:fixed', 'right:14px', 'bottom:14px', 'z-index:2147483647',
                'background:rgba(10,19,26,0.95)', 'border:1px solid rgba(0,229,255,0.4)',
                'border-left:3px solid #00E5FF', 'color:#67E8F9',
                'font-family:"JetBrains Mono","Cascadia Mono",Consolas,monospace',
                'font-size:12px', 'padding:10px 14px', 'max-width:340px',
                'box-shadow:0 0 20px rgba(0,229,255,0.25)',
                'transition:opacity 150ms ease-in-out', 'opacity:1', 'pointer-events:auto'
            ].join(';');
            host.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                setTimeout(() => { try { el.remove(); } catch (_) {} }, 200);
            }, 1600);
        } catch (e) { console.log('[Ψ Akasha]', text); }
    }

    /* The relief valve itself. Cycles full → core → off → full, persists
     * per-origin, and reloads so document-start hooks re-install at the
     * new posture. Runs in EVERY profile (OFF must never be a trap). */
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.shiftKey && !e.metaKey && !e.repeat &&
            typeof e.key === 'string' && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            e.stopPropagation();
            const next = PROFILES[(PROFILES.indexOf(AKASHA_PROFILE) + 1) % PROFILES.length];
            try { localStorage.setItem(PROFILE_KEY, next); } catch (err) { /* non-fatal */ }
            akashaToast(`Ψ AKASHA SILENCE — profile: ${AKASHA_PROFILE} → ${next}. Reloading…`);
            setTimeout(() => { try { location.reload(); } catch (_) {} }, 900);
        }
    }, true);

    if (AKASHA_PROFILE === 'off') {
        console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: AKASHA_SILENCE v5.2.0 profile=OFF — INERT. Ctrl+Alt+Shift+K cycles the profile. ', 'background: #000; color: #00ff00; font-weight: bold; font-family: monospace; padding: 4px;');
        return;
    }

    /* ══ §1 CORE UTILITIES & HEX CORRUPTION LAYER ═══════════════════════ */

    const DEADBEEF = () => {
        return '0xDEADBEEF-' + Math.random().toString(16).slice(2, 12).toUpperCase();
    };

    const MYCELIUM = {
        shroud: function (target, prop, fakeValue) {
            if (target && prop in target) {
                try {
                    Object.defineProperty(target, prop, {
                        get: () => typeof fakeValue === 'function' ? fakeValue() : fakeValue,
                        configurable: true,
                        enumerable: true
                    });
                } catch (e) {}
            }
        }
    };

    /* Deterministic PRNG (mulberry32) — per-element stable noise seeds. */
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* Proxy facade: patched natives keep native toString/name/length. */
    const facade = (native, apply) => new Proxy(native, { apply });

    /* ══ §2 FINGERPRINT NULLIFICATION (session-stable) — FULL profile only */

    if (P_FULL) {
    /* D2: values are computed ONCE per session — repeated reads agree. */
    const HW_THREADS = [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)];
    const HW_MEMORY = [4, 8, 16, 32][Math.floor(Math.random() * 4)];
    MYCELIUM.shroud(navigator, 'hardwareConcurrency', HW_THREADS);
    MYCELIUM.shroud(navigator, 'deviceMemory', HW_MEMORY);
    MYCELIUM.shroud(navigator, 'platform', 'Win32'); // blend into the noise
    MYCELIUM.shroud(navigator, 'languages', ['en-US', 'en']);

    /* Canvas blinding — per-canvas seeded LSB noise (D2 + D3).
     * A WeakMap keys the seed to the element itself: the same canvas
     * always reads back the same noise (defeats the read-twice-compare
     * detector), while distinct canvases and distinct sessions diverge. */
    const canvasSeeds = new WeakMap();
    function canvasSeed(canvas) {
        let s = canvasSeeds.get(canvas);
        if (s === undefined) {
            s = (Math.random() * 0xFFFFFFFF) >>> 0;
            canvasSeeds.set(canvas, s);
        }
        return s;
    }

    function perturbImageData(canvas, data) {
        const rnd = mulberry32(canvasSeed(canvas));
        for (let i = 0; i < data.length; i += 4) {
            data[i]     = Math.min(255, Math.max(0, data[i]     + ((rnd() * 3) | 0) - 1));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + ((rnd() * 3) | 0) - 1));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + ((rnd() * 3) | 0) - 1));
        }
    }

    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function () {
        const data = originalGetImageData.apply(this, arguments);
        try { perturbImageData(this.canvas, data.data); } catch (e) {}
        return data;
    };

    /* toDataURL / toBlob were never blinded in the legacy scripts — the
     * primary channel most fingerprint libraries actually use. Both are
     * blinded through a perturbed scratch copy so the page's own canvas
     * bitmap is never corrupted. */
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    function blindedScratch(source) {
        const w = source.width, h = source.height;
        if (!(w > 0 && h > 0)) return null;
        const scratch = document.createElement('canvas');
        scratch.width = w;
        scratch.height = h;
        const sctx = scratch.getContext('2d');
        sctx.drawImage(source, 0, 0);
        const img = originalGetImageData.call(sctx, 0, 0, w, h);
        perturbImageData(scratch, img.data);
        sctx.putImageData(img, 0, 0);
        return scratch;
    }

    HTMLCanvasElement.prototype.toDataURL = function () {
        try {
            const scratch = blindedScratch(this);
            if (scratch) return originalToDataURL.apply(scratch, arguments);
        } catch (e) {}
        return originalToDataURL.apply(this, arguments);
    };

    HTMLCanvasElement.prototype.toBlob = function (callback) {
        try {
            const scratch = blindedScratch(this);
            if (scratch) return originalToBlob.apply(scratch, arguments);
        } catch (e) {}
        return originalToBlob.apply(this, arguments);
    };

    /* WebGL renderer spoofing — stable per session (D2). */
    const GPU_PROFILES = [
        ['Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)'],
        ['Google Inc. (Intel)', 'ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E92) Direct3D11 vs_5_0 ps_5_0, D3D11)'],
        ['Google Inc. (AMD)', 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'],
        ['Google Inc. (Intel)', 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)']
    ];
    const GPU_PROFILE = GPU_PROFILES[Math.floor(Math.random() * GPU_PROFILES.length)];
    const DBG_EXT = 'WEBGL_debug_renderer_info';

    function blindWebGL(ctxProto) {
        const originalGetParameter = ctxProto.getParameter;
        ctxProto.getParameter = function (param) {
            try {
                const ext = this.getExtension(DBG_EXT);
                if (ext) {
                    if (param === ext.UNMASKED_VENDOR_WEBGL) return GPU_PROFILE[0];
                    if (param === ext.UNMASKED_RENDERER_WEBGL) return GPU_PROFILE[1];
                }
            } catch (e) {}
            return originalGetParameter.call(this, param);
        };
    }
    try { if (win.WebGLRenderingContext) blindWebGL(win.WebGLRenderingContext.prototype); } catch (e) {}
    try { if (win.WebGL2RenderingContext) blindWebGL(win.WebGL2RenderingContext.prototype); } catch (e) {}

    /* AudioContext fingerprint — sub-16-bit LSB noise, applied once per
     * buffer (marked via WeakSet so repeat reads stay deterministic). */
    try {
        const poisonedAudio = new WeakSet();
        const originalGetChannelData = win.AudioBuffer.prototype.getChannelData;
        win.AudioBuffer.prototype.getChannelData = function (channel) {
            const data = originalGetChannelData.call(this, channel);
            try {
                if (!poisonedAudio.has(data)) {
                    poisonedAudio.add(data);
                    const rnd = mulberry32((Math.random() * 0xFFFFFFFF) >>> 0);
                    for (let i = 0; i < data.length; i++) data[i] += (rnd() - 0.5) * 1e-7;
                }
            } catch (e) {}
            return data;
        };
    } catch (e) {}
    } /* end P_FULL fingerprint nullification */

    /* ══ §3 TELEMETRY ROUTING (union blocklist) ═════════════════════════ */

    const TELEMETRY_BLOCKLIST = [
        'log.aliyuncs.com',
        /* v5.1.0: '/track' tightened to a boundary match — the bare
         * substring also mocked /tracks/<id> and /tracking/… API paths
         * that legitimate music/streaming sites serve their content
         * through (the #1 "Akasha broke this site" false positive). */
        /(?:^|[?&/._-])track(?:[?#/.]|$)/i,
        '/progress/count',
        'fireyejs',
        'tracker-plugin',
        'aplus',
        'alidt.alicdn.com',
        'fourier.taobao.com',
        /* v5.1.0: the blanket 'g.alicdn.com' entry is narrowed to the
         * known tracker artifacts — g.alicdn.com is a general-purpose CDN
         * that serves arbitrary legitimate libraries (jQuery et al.);
         * blocking it wholesale broke every site that loaded a script
         * from it. */
        /g\.alicdn\.com\/[^?#]*\/(?:awsc|aplus|alidt)/i,
        'awsc.js',
        'sufei_data',
        'stat-',
        'icc-cloud.kr',
        '/telemetry',
        'google-analytics.com/collect',
        'doubleclick.net'
    ];

    const isTracker = (url) => {
        if (!url || typeof url !== 'string') return false;
        const normalizedUrl = url.toLowerCase();
        return TELEMETRY_BLOCKLIST.some(block =>
            block instanceof RegExp ? block.test(normalizedUrl) : normalizedUrl.includes(block));
    };

    const poisonData = (data) => {
        const keysToPoison = ['device_id', 'install_id', 'fingerprint', 'uuid', 'did', 'mac', 'client_id'];
        if (typeof data === 'string') {
            keysToPoison.forEach(k => {
                const regex = new RegExp(`("${k}":\\s*")[^"]+`, 'g');
                data = data.replace(regex, `$1${DEADBEEF()}`);
            });
        } else if (data instanceof FormData || data instanceof URLSearchParams) {
            keysToPoison.forEach(k => {
                if (data.has(k)) data.set(k, DEADBEEF());
            });
        }
        return data;
    };

    /* ══ §4 NETWORK DEFUSING — NetHook v3 veto (suite v1.4.5) ══════════ */

    /* D5 interop: 4ndr0serviceguard owns worker/socket policy when present. */
    const serviceGuardOwnsWorkers = !!(win._4ndr0ghostV7 || win.__4ndr0ghostUserV7);

    /* D7: the worker pacifier keeps its original ICC scope. */
    const SW_SCOPE_HOSTS = ['wan.video', 'kuaishou.com', 'aliyun.com', 'icc-cloud.kr'];
    const inIccScope = SW_SCOPE_HOSTS.some(s => domain === s || domain.endsWith('.' + s));

    function makePhantomWebSocket(url) {
        const listeners = new Map();
        let readyState = 0; // CONNECTING
        const fire = (type, ev) => {
            ev = ev || { type: type };
            const handler = phantom['on' + type];
            if (typeof handler === 'function') { try { handler(ev); } catch (e) {} }
            const arr = listeners.get(type);
            if (arr) for (const fn of arr.slice()) { try { fn(ev); } catch (e) {} }
        };
        const phantom = {
            url: String(url),
            binaryType: 'blob',
            extensions: '',
            protocol: '',
            bufferedAmount: 0,
            get readyState() { return readyState; },
            send: function () { /* silently swallowed */ },
            close: function (code, reason) {
                if (readyState === 3) return;
                readyState = 2;
                setTimeout(() => {
                    readyState = 3;
                    fire('close', { type: 'close', wasClean: true, code: code || 1005, reason: reason || '' });
                }, 40);
            },
            addEventListener: function (type, fn) {
                if (typeof fn !== 'function') return;
                if (!listeners.has(type)) listeners.set(type, []);
                listeners.get(type).push(fn);
            },
            removeEventListener: function (type, fn) {
                const arr = listeners.get(type);
                if (!arr) return;
                const i = arr.indexOf(fn);
                if (i !== -1) arr.splice(i, 1);
            },
            dispatchEvent: function () { return true; }
        };
        setTimeout(() => {
            if (readyState !== 0) return;
            readyState = 1;
            fire('open', { type: 'open' });
        }, 40);
        return phantom;
    }

    /* v5.2.0 — request-path defusing rides the shared NetHook singleton
     * (__4NDR0_NET_API__, kernel/net.js v3, inlined above by build). The
     * hub consults this subscriber at REQUEST time, before the network:
     * tracker URLs get the SPOOF phantom (mocked 200, the beacons "succeed"
     * so the app never retries or escalates); everything else gets
     * outgoing-body identifier poisoning as a {body} verdict. One wrap set
     * per realm serves every co-installed suite script — the per-window
     * facades this replaces stacked N deep under co-install. */
    const AKASHA_MOCK_BODY = JSON.stringify({ success: true, code: 0 });

    __4NDR0_NET_API__.onRequest(function (req) {
        if (isTracker(req.url)) {
            if (req.kind === 'beacon') {
                console.log(`%c [💀] BEACON NULLIFIED: ${req.url}`, "color: #ff0055;");
                return { veto: true };
            }
            console.log(`%c [💀] ${req.kind === 'xhr' ? 'XHR' : 'FETCH'} NULLIFIED (MOCKED 200 OK): ${req.url}`, "color: #ff0055;");
            return { respond: { status: 200, statusText: 'OK', body: AKASHA_MOCK_BODY } };
        }
        if (req.body != null) {
            const poisoned = poisonData(req.body);
            if (poisoned !== req.body) return { body: poisoned };
        }
        return undefined;
    });

    /* Local (non-request-path) defenses — still Proxy facades (D1).
     * Applied to the boot realm and to every propagated iframe realm. */
    const applyLocalHooks = (targetWindow) => {
        if (!targetWindow || targetWindow._akashaLocalHooked) return;
        targetWindow._akashaLocalHooked = true;

        /* WebSocket — tracker URLs resolve to a pacified phantom (D4).
         * Static CONNECTING/OPEN/CLOSING/CLOSED constants are carried over
         * (the legacy shim omitted them, breaking `WebSocket.OPEN` reads). */
        if (targetWindow.WebSocket) {
            const OrigWebSocket = targetWindow.WebSocket;
            const wsShim = function (url, protocols) {
                if (isTracker(url)) {
                    console.log(`%c [💀] WEBSOCKET CONNECTION NULLIFIED (PACIFIED): ${url}`, "color: #ffaa00; font-weight: bold;");
                    const phantom = makePhantomWebSocket(url);
                    Object.setPrototypeOf(phantom, OrigWebSocket.prototype);
                    return phantom;
                }
                return protocols !== undefined ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
            };
            wsShim.CONNECTING = 0;
            wsShim.OPEN = 1;
            wsShim.CLOSING = 2;
            wsShim.CLOSED = 3;
            wsShim.prototype = OrigWebSocket.prototype;
            targetWindow.WebSocket = wsShim;
            Object.defineProperty(OrigWebSocket.prototype, 'constructor', { value: wsShim, writable: true, configurable: true });
        }

        /* WebRTC blinding — IP-leak prevention. */
        if (targetWindow.RTCPeerConnection) {
            const OrigRTC = targetWindow.RTCPeerConnection;
            targetWindow.RTCPeerConnection = function () {
                console.log("%c [💀] WEBRTC PEER CONNECTION BLOCKED: IP LEAK PREVENTED", "color: #00ffff; font-weight: bold;");
                const pc = new OrigRTC(...arguments);
                pc.createDataChannel = function () { return {}; };
                pc.createOffer = function () { return Promise.reject(new Error("WebRTC Disabled by 4ndr0guard")); };
                return pc;
            };
            targetWindow.RTCPeerConnection.prototype = OrigRTC.prototype;
        }

        /* ServiceWorker / SharedWorker pacifier — original ICC scope only
         * (D7), and deferred to 4ndr0serviceguard when it owns the page
         * (D5): no double gating, no property wars. */
        if (inIccScope && !serviceGuardOwnsWorkers) {
            if (targetWindow.navigator && targetWindow.navigator.serviceWorker) {
                Object.defineProperty(targetWindow.navigator, 'serviceWorker', {
                    get: function () {
                        return {
                            register: function () {
                                console.log("%c [💀] SERVICE WORKER REGISTRATION SILENTLY DROPPED", "color: #ffaa00;");
                                return Promise.reject(new Error("SW Disabled by 4ndr0guard"));
                            },
                            getRegistration: () => Promise.resolve(undefined),
                            getRegistrations: () => Promise.resolve([]),
                            controller: null
                        };
                    },
                    set: () => false,
                    configurable: true
                });
            }
            if (targetWindow.SharedWorker) {
                Object.defineProperty(targetWindow, 'SharedWorker', {
                    get: () => function () {
                        console.log("%c [💀] SHARED WORKER BLOCKED", "color: #ffaa00;");
                        throw new DOMException('SharedWorker disabled by security policy', 'SecurityError');
                    },
                    set: () => false,
                    configurable: true
                });
            }
        }
    };

    /* history.pushState — SPM tracking-parameter destruction (Proxy, D1). */
    const originalPushState = history.pushState;
    history.pushState = facade(originalPushState, function (target, that, args) {
        if (args[2] && typeof args[2] === 'string' && args[2].includes('spm=')) {
            args[2] = args[2].replace(/spm=[^&]*/, `spm=4NDR0666.${Math.random()}`);
        }
        return Reflect.apply(target, that, args);
    });

    applyLocalHooks(win);

    /* ══ §5 ANTI-ANALYSIS NEUTRALIZER (from Anti-detection) — FULL only */

    if (P_FULL) {
    const SCRIPT_TEXT_FILTER = ['DisableDevtool', 'DevtoolsDetector', 'adblock', 'devtool', 'contextmenu', '_ads'];
    const SCRIPT_SRC_FILTER = ['disable-devtool', 'devtools-detector', 'detect2'];

    function defuseScript(script) {
        const text = script.innerHTML || '';
        const src = script.src || '';

        const matchesText = SCRIPT_TEXT_FILTER.some(word => text.includes(word));
        const matchesSrc = SCRIPT_SRC_FILTER.some(word => src.includes(word));

        if (matchesText || matchesSrc) {
            console.log('[Ψ-4NDR0666] Anti-analysis script intercepted and neutralized.', script);
            script.type = 'javascript/blocked'; // neutralize before engine compilation
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            return true;
        }
        return false;
    }

    /* Neutralizer for any mutation-delivered script node: anti-analysis
     * filter first, then telemetry-src sinkholing — this closes the
     * innerHTML/insertAdjacentHTML injection gap the legacy DOM sinkhole
     * (§6, createElement-only) never covered. */
    function neutralizeNode(node) {
        if (!node || node.tagName !== 'SCRIPT') return;
        defuseScript(node);
        if (node.src && isTracker(node.src)) {
            console.log(`%c [💀] DOM SINKHOLE (MUTATION): Blocked injection of ${node.src}`, "color: #ffaa00;");
            node.type = 'javascript/blocked';
            if (node.parentNode) node.parentNode.removeChild(node);
        }
    }

    /* 1. Gecko-specific interceptor (Firefox) — fires before the engine
     *    compiles the script; the only truly pre-execution path. */
    win.addEventListener('beforescriptexecute', (e) => {
        if (defuseScript(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    /* 2. Blink/WebKit prototype interception for dynamically appended
     *    scripts — Proxy facades (D1) so the patches are invisible to
     *    hook-detection (toString stays native). */
    Element.prototype.appendChild = facade(Element.prototype.appendChild, function (target, thisArg, args) {
        const node = args[0];
        if (node && node.tagName === 'SCRIPT' && defuseScript(node)) return node;
        return Reflect.apply(target, thisArg, args);
    });

    Element.prototype.insertBefore = facade(Element.prototype.insertBefore, function (target, thisArg, args) {
        const node = args[0];
        if (node && node.tagName === 'SCRIPT' && defuseScript(node)) return node;
        return Reflect.apply(target, thisArg, args);
    });

    /* 3. Fast synchronous observer for statically parsed inline scripts
     *    and any other injection path (innerHTML, adoption, etc.). */
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                neutralizeNode(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('script').forEach(neutralizeNode);
                }
            }
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
    } /* end P_FULL anti-analysis neutralizer */

    /* ══ §6 DOM SINKHOLE (dynamic script interception) ═════════════════ */

    const originalCreateElement = document.createElement;
    document.createElement = facade(originalCreateElement, function (target, thisArg, args) {
        const element = Reflect.apply(target, thisArg, args);
        const tagName = args[0];
        if (tagName && String(tagName).toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function (name, value) {
                if (name.toLowerCase() === 'src' && isTracker(value)) {
                    console.log(`%c [💀] DOM SINKHOLE ENGAGED: Blocked dynamic injection of ${value}`, "color: #ffaa00;");
                    value = 'data:application/javascript,console.log("[AKASHA_SILENCE] Tracker Neutered");';
                }
                return originalSetAttribute.call(this, name, value);
            };

            Object.defineProperty(element, 'src', {
                set: function (value) {
                    if (isTracker(value)) {
                        console.log(`%c [💀] DOM SINKHOLE ENGAGED: Blocked direct property injection of ${value}`, "color: #ffaa00;");
                        this.setAttribute('src', 'data:application/javascript,console.log("[AKASHA_SILENCE] Tracker Neutered");');
                    } else {
                        this.setAttribute('src', value);
                    }
                },
                get: function () { return this.getAttribute('src'); },
                configurable: true
            });
        }
        return element;
    });

    /* ══ §7 GOOGLE LINK-TRACKING SANITIZATION ══════════════════════════ */

    const isGoogleDomain = domain.includes('google.') && !domain.includes('googleweblight.');

    if (P_CORE && isGoogleDomain) {
        let scriptCspNonce;
        let needsCspNonce = typeof browser !== 'undefined';
        let forceNoReferrer = true;
        let noping = true;

        const getScriptCspNonce = () => {
            const scripts = document.querySelectorAll('script[nonce]');
            for (let i = 0; i < scripts.length && !scriptCspNonce; ++i) {
                scriptCspNonce = scripts[i].nonce;
            }
            return scriptCspNonce;
        };

        const findScriptCspNonce = (callback) => {
            let timer;
            function checkDOM() {
                if (getScriptCspNonce() || document.readyState === 'complete') {
                    document.removeEventListener('DOMContentLoaded', checkDOM, true);
                    if (timer) clearTimeout(timer);
                    callback();
                    return;
                }
                timer = setTimeout(checkDOM, 50);
            }
            document.addEventListener('DOMContentLoaded', checkDOM, true);
            checkDOM();
        };

        const getReferrerPolicy = () => forceNoReferrer ? 'origin' : '';

        const updateReferrerPolicy = (a) => {
            if (a.referrerPolicy === 'no-referrer') return;
            const referrerPolicy = getReferrerPolicy();
            if (referrerPolicy) a.referrerPolicy = referrerPolicy;
        };

        const newURL = (href) => {
            try { return new URL(href); }
            catch (e) {
                const a = document.createElement('a');
                a.href = href;
                return a;
            }
        };

        const getRealLinkFromGoogleUrl = (a) => {
            if (a.protocol !== 'https:' && a.protocol !== 'http:') return;
            let url;
            if ((a.hostname === location.hostname || a.hostname === 'www.google.com') &&
                (a.pathname === '/url' || a.pathname === '/local_url' ||
                 a.pathname === '/searchurl/rr.html' || a.pathname === '/linkredirect')) {
                url = /[?&](?:q|url|dest)=((?:https?|ftp)[%:][^&]+)/.exec(a.search);
                if (url) return decodeURIComponent(url[1]);
                url = /[?&](?:q|url)=((?:%2[Ff]|\/)[^&]+)/.exec(a.search);
                if (url) return a.origin + decodeURIComponent(url[1]);
                url = /[#&]url=(https?[:%][^&]+)/.exec(a.hash);
                if (url) return decodeURIComponent(url[1]);
            }
        };

        const getSanitizedIntentUrl = (intentUrl) => {
            if (!intentUrl.startsWith('intent:')) return;
            const BROWSER_FALLBACK_URL = ';S.browser_fallback_url=';
            let indexStart = intentUrl.indexOf(BROWSER_FALLBACK_URL);
            if (indexStart === -1) return;
            indexStart += BROWSER_FALLBACK_URL.length;
            let indexEnd = intentUrl.indexOf(';', indexStart);
            indexEnd = indexEnd === -1 ? intentUrl.length : indexEnd;

            const url = decodeURIComponent(intentUrl.substring(indexStart, indexEnd));
            const realUrl = getRealLinkFromGoogleUrl(newURL(url));
            if (!realUrl) return;

            return intentUrl.substring(0, indexStart) + encodeURIComponent(realUrl) + intentUrl.substring(indexEnd);
        };

        const handlePointerPress = (e) => {
            let a = e.target;
            while (a && !a.href) a = a.parentElement;
            if (!a) return;

            const inlineMousedown = a.getAttribute('onmousedown');
            if (inlineMousedown && /\ba?rwt\(/.test(inlineMousedown)) {
                a.removeAttribute('onmousedown');
                a.removeAttribute('ping');
                e.stopImmediatePropagation();
            }
            if (noping) a.removeAttribute('ping');

            let realLink = getRealLinkFromGoogleUrl(a);
            if (realLink) {
                a.href = realLink;
                realLink = getRealLinkFromGoogleUrl(a);
                if (realLink) a.href = realLink;
            }
            updateReferrerPolicy(a);

            if (e.eventPhase === Event.CAPTURING_PHASE) {
                const eventOptions = { capture: false, once: true };
                a.addEventListener(e.type, handlePointerPress, eventOptions);
                document.addEventListener(e.type, handlePointerPress, eventOptions);
            }
        };

        const handleClick = (e) => {
            if (e.button !== 0) return;
            let a = e.target;
            while (a && !a.href) a = a.parentElement;
            if (!a) return;

            if (a.dataset && a.dataset.url) {
                const realLink = getSanitizedIntentUrl(a.dataset.url);
                if (realLink) a.dataset.url = realLink;
            }

            if (!location.hostname.startsWith('mail.')) return;
            if (a.origin === location.origin) return;
            if (a.protocol !== 'http:' && a.protocol !== 'https:' && a.protocol !== 'ftp:') return;

            if (a.target === '_blank') {
                e.stopPropagation();
                updateReferrerPolicy(a);
            }
        };

        const setupAggressiveUglyLinkPreventer = () => {
            const s = document.createElement('script');
            if (getScriptCspNonce()) {
                s.setAttribute('nonce', scriptCspNonce);
            } else if (document.readyState !== 'complete' && needsCspNonce) {
                findScriptCspNonce(setupAggressiveUglyLinkPreventer);
                return;
            }
            s.textContent = '(' + function (getRealLinkFromGoogleUrl) {
                const proto = HTMLAnchorElement.prototype;
                const hrefProp = Object.getOwnPropertyDescriptor(proto, 'href');
                const hrefGet = Function.prototype.call.bind(hrefProp.get);
                const hrefSet = Function.prototype.call.bind(hrefProp.set);

                Object.defineProperty(proto, 'href', {
                    configurable: true,
                    enumerable: true,
                    get() { return hrefGet(this); },
                    set(v) {
                        hrefSet(this, v);
                        try {
                            v = getRealLinkFromGoogleUrl(this);
                            if (v) hrefSet(this, v);
                        } catch (e) {}

                        try {
                            const rpProp = Object.getOwnPropertyDescriptor(proto, 'referrerPolicy');
                            if (rpProp && rpProp.get && rpProp.get.call(this) !== 'no-referrer') {
                                const currentScript = document.currentScript;
                                if (currentScript && currentScript.referrerPolicy) {
                                   rpProp.set.call(this, currentScript.referrerPolicy);
                                }
                            }
                        } catch (e) {}
                    },
                });

                function replaceAMethod(methodName, methodFunc) {
                    Object.defineProperty(proto, methodName, {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: methodFunc,
                    });
                }

                const setAttribute = Function.prototype.call.bind(proto.setAttribute);
                replaceAMethod('setAttribute', function (name, value) {
                    if (name === 'href' || name === 'HREF') {
                        this.href = value;
                    } else {
                        setAttribute(this, name, value);
                    }
                });

                const aDispatchEvent = Function.prototype.apply.bind(proto.dispatchEvent);
                replaceAMethod('dispatchEvent', function () {
                    return aDispatchEvent(this, arguments);
                });

                const aClick = Function.prototype.apply.bind(proto.click);
                replaceAMethod('click', function () {
                    return aClick(this, arguments);
                });

                document.currentScript.dataset.jsEnabled = 1;
            } + ')(' + getRealLinkFromGoogleUrl + ');';

            s.referrerPolicy = getReferrerPolicy();
            (document.head || document.documentElement).appendChild(s);
            s.remove();
        };

        document.addEventListener('mousedown', handlePointerPress, true);
        document.addEventListener('touchstart', handlePointerPress, true);
        document.addEventListener('click', handleClick, true);
        setupAggressiveUglyLinkPreventer();
    }

    /* ══ §8 SITE MAINTENANCE (Reddit/Instagram/Facebook) — FULL only ═══ */

    if (P_FULL) {
    const createdStyles = [];
    const addCss = (css) => {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = css;
        createdStyles.push(style);
        if (document.head != null) {
            document.head.appendChild(style);
        }
        return style;
    };

    const disableAddCssRemoval = () => {
        const _removeChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function removeChild(child) {
            if (createdStyles.includes(child)) return;
            return _removeChild.call(this, child);
        };
        const _replaceChild = Node.prototype.replaceChild;
        Node.prototype.replaceChild = function replaceChild(newChild, oldChild) {
            if (createdStyles.includes(oldChild)) return;
            return _replaceChild.call(this, newChild, oldChild);
        };
    };

    if (domain === 'reddit.com' || domain.endsWith('.reddit.com')) {
        disableAddCssRemoval();
        document.addEventListener('DOMContentLoaded', () => {
            addCss('#COIN_PURCHASE_DROPDOWN_ID { display: none !important; }');
            document.querySelectorAll('[id*="vote-arrows"] > :not(button) [role="screen-reader"]').forEach((screenReaderNode) => {
                addCss(`.${screenReaderNode.parentNode.className} > :not([role="screen-reader"]) { display: none !important; }`);
                addCss(`.${screenReaderNode.parentNode.className} .${screenReaderNode.className} { display: block !important; position: static !important; width: auto !important; height: auto !important; margin: 0 !important; }`);
            });
        });
    }

    if (domain === 'instagram.com' || domain.endsWith('.instagram.com')) {
        sessionStorage.setItem('loggedOutCTAIsShown', '1');
        document.addEventListener('DOMContentLoaded', () => {
            document.body.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.hasAttribute('href') && link.getAttribute('href').startsWith('/p/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = link.getAttribute('href');
                    const popupCheck = setInterval(() => {
                        const popup = document.querySelector('.RnEpo');
                        if (popup) {
                            setTimeout(() => { document.body.style.overflow = 'auto'; }, 50);
                            popup.remove();
                            clearInterval(popupCheck);
                        }
                    }, 1);
                }
            });
        });
    }

    if (domain === 'facebook.com' || domain.endsWith('.facebook.com')) {
        if (window === window.top) {
            if (/^[\/]?$/g.test(location.pathname)) location = '/messages/t/';
            document.documentElement.style.setProperty('--notification-badge', 'transparent');
        }
    }

    } /* end P_FULL site maintenance */

    /* ══ §9 CONTEXT ESCAPE PREVENTION (iframe propagation) ═════════════ */

    if (P_CORE) {
    const iframeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName && node.tagName.toLowerCase() === 'iframe') {
                    try {
                        if (node.contentWindow) {
                            /* v5.2.0: request-path defusing arms the shared
                             * hub in the child realm; local pacifiers follow. */
                            __4NDR0_NET_API__.propagate(node.contentWindow);
                            applyLocalHooks(node.contentWindow);
                        }
                        node.addEventListener('load', () => {
                            if (node.contentWindow) {
                                __4NDR0_NET_API__.propagate(node.contentWindow);
                                applyLocalHooks(node.contentWindow);
                            }
                        });
                    } catch (e) {}
                }
            });
        });
    });

    iframeObserver.observe(document.documentElement || document.body, { childList: true, subtree: true });
    } /* end P_CORE iframe propagation */

    /* ══ §10 BOOT ══════════════════════════════════════════════════════ */

    console.log(`%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: AKASHA_SILENCE v5.2.0 ACTIVE — profile=${AKASHA_PROFILE.toUpperCase()}. SURVEILLANCE COUNTERMEASURES DEPLOYED. Ctrl+Alt+Shift+K cycles strictness. `, "background: #000; color: #00ff00; font-weight: bold; font-family: monospace; padding: 4px; border: 1px solid #00ff00;");
    console.log("%c [4NDR0TOOLS] Initialization complete. Core shielded. ", "background: #000; color: #00ff00; font-weight: bold; padding: 4px; border: 1px solid #00ff00;");
})();
