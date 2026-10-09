// ==UserScript==
// @name         4ndr0tools - Recon
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      9.1.0

// @description  Alt+Shift+R hotkey — unified forensic recon platform: hardened XHR/fetch/beacon interception through the suite's shared NetHook hub with MITM block & mute rules and failure pacification, console harvesting, WebSocket + postMessage bridge capture, JWT identity harvesting, headless C2 API (reconEngine / chimeraRecon / Hook) and a moveable Shadow-DOM glass dock with full markdown reporting. For security research only.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Recon.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Recon.user.js
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

// 9.1.0 (suite v1.4.6): NetHook adoption — the fetch/XHR recorders and the reconh
// MITM blocklist ride the suite's shared hub (kernel/net.js v4: request verdicts,
// structured traffic events, failure recovery); blocklist doctrine extended to
// beacons; the reconh TypeError→204 pacification is preserved on the onError channel.
// 9.0.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.

/* Paradigm (D1): Userscript Interceptor — document-start interception of
 * fetch / XMLHttpRequest / sendBeacon through the suite's shared NetHook
 * singleton (kernel/net.js, build-inlined; request-time verdicts +
 * structured traffic events + failure recovery), plus local wraps for the
 * non-request channels (WebSocket / console / postMessage) on the page
 * context (unsafeWindow), closure-scoped module state, and a Shadow-DOM-
 * isolated dock UI. Zero frameworks; zero page-global leakage beyond the
 * three documented operator entry points: window.reconEngine,
 * window.chimeraRecon, window.Hook.
 *
 * Unified superset of: recon3 [HUD] v3.0.0, recond [Dock] v8.1.0-Ω,
 * recon4 [Dock] v8.2.02-Ω, reconc [Chimera's Eye] v3.0.0, reconh [Headless] v2.3.7.
 */

(() => {
    'use strict';

    // ─── OPERATOR WORKFLOW (reconh lineage, updated for the unified platform) ───
    // 1. Activate  : the glass dock auto-injects when the DOM is ready. Toggle it with Alt+Shift+R.
    // 2. Operate   : use the site. Everything is captured live — the NETWORK /
    //                CONSOLE / REPORT / DATA tabs update in real time.
    // 3. Silence   : reconEngine.applyMuteRules('play.google.com/log')
    //                (capture continues; only the console feed is silenced)
    // 4. Block     : reconEngine.applyBlockRules('/_/rpc/PostImage/Annotate')
    //                (matching fetch/XHR/beacon requests are MITM-blocked and
    //                pacified with 204 through the shared NetHook hub)
    // 5. Extract   : the REPORT button copies the full forensic markdown report, or use
    //                reconEngine.copySessionData(), then run: copy(reconEngine.sessionData)
    // 6. Fresh run : PURGE button, reconEngine.startNewSession() or
    //                chimeraRecon.startNewSession()
    // 7. Float     : the FLOAT button detaches the dock into a draggable floating panel
    //                (recon3/reconc moveability); the resizer and Alt+Shift+R work in both modes.

    // ─── 0. SINGLETON GUARD (stable key — fixes reconc's random-key lock defect) ───
    if (window.__RECON_Ω_UNIFIED_V9__) return;
    window.__RECON_Ω_UNIFIED_V9__ = true;

    // ─── 1. CONTEXT & OPSEC ALIASES (reconc lineage; makes the unsafeWindow grant real) ───
    const _window = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const _console = _window.console;
    const _JSON = _window.JSON;
    const _document = _window.document;
    const _navigator = _window.navigator;
    // Pristine console references captured BEFORE hooking, so this platform's own
    // diagnostics never feed back into the console harvester.
    const pristineConsole = {
        log: _console.log,
        warn: _console.warn,
        error: _console.error,
        debug: _console.debug
    };

    // ─── 2. CONFIGURATION & STATE ───
    const THEME = {
        cyan: '#00E5FF',
        glass: 'rgba(10, 19, 26, 0.45)',
        border: 'rgba(0, 229, 255, 0.2)',
        glow: 'rgba(0, 229, 255, 0.4)'
    };
    const BUFFER_LIMIT = 1000;        // ring-buffer ceiling for network + console captures
    const SESSION_LIMIT = 1000;       // FIFO ceiling for the raw sessionData ledger (B.1 bounded cache)
    const VIEW_SLICE = 50;            // rows rendered per live tab (max of recond 40 / recon4 50)
    const SNIPPET_LEN = 500;          // max characters stored per captured raw payload
    const CONSOLE_TYPES = ['log', 'warn', 'error', 'info', 'debug'];   // union of recon3 (4) + recon4 (5)
    const REPORT_DEBOUNCE_MS = 2000;  // recon4 clipboard debounce
    const BOOT_POLL_MS = 50;          // reconc boot-poll cadence
    const BOOT_POLL_MAX = 200;        // B.1: every interval carries an attempt ceiling (10s)
    const HOST_ID = 'psi-dock-host';  // stable host id (recond/recon4 injection guard)
    const STYLE_ID = 'psi-recon-toast-styles';
    const CSS_PREFIX = 'psi' + Math.random().toString(36).slice(2, 8);   // reconc OPSEC polymorphism
    const JWT_PATTERN = /eyJ[a-zA-Z0-9._-]+/g;                            // recond/recon4 identity pattern

    const STATE = {
        network: [],
        logs: [],
        identities: new Set(),
        sessionData: [],
        startTime: new Date().toISOString(),
        currentTab: 'net',
        isHidden: false,
        isFloat: false,
        lastReportCopy: 0,
        packetCount: 0,
        logCount: 0,
        isInitialized: false,
        hooksInstalled: false,
        isUiReady: false,
        blockRules: [],
        muteRules: []
    };

    // Dock references (closed shadow root is unreachable from outside by design)
    let dockHost = null;
    let dockShadow = null;
    let panelEl = null;
    let viewportEl = null;

    // Per-MessageEvent dedupe table shared by the passive listener and the wrapper
    const seenMessages = new WeakSet();

    // ─── 3. HELPERS ───
    const HELPERS = {
        log: (...args) => pristineConsole.log('%c[Ψ-RECON-Ω UNIFIED v9.0.0-Ω]%c', 'color:#00E5FF;font-weight:bold;', 'color:inherit;', ...args),
        error: (...args) => pristineConsole.error('%c[Ψ-RECON-Ω UNIFIED v9.0.0-Ω]%c', 'color:#FF0066;font-weight:bold;', 'color:inherit;', ...args),
        debug: (...args) => pristineConsole.debug('[Ψ-RECON-Ω interceptor]', ...args),
        escapeHtml: (text) => String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])),
        safeStringify: (value) => {
            try { return _JSON.stringify(value, null, 2); }
            catch (stringifyError) { return '[Unserializable Object]'; }
        },
        normalizeUrl: (input) => {
            if (typeof input === 'string') return input;
            if (input && typeof input.url === 'string') return input.url;    // Request objects
            if (input && typeof input.href === 'string') return input.href;  // URL objects
            return '[unknown]';                                              // recon4 label
        },
        normalizePayload: (payload) => {
            if (payload == null) return null;
            if (typeof payload === 'string') {
                return { format: 'text', content: payload.length > SNIPPET_LEN ? payload.substring(0, SNIPPET_LEN) : payload };
            }
            if (typeof payload === 'object' && ('format' in payload) && ('content' in payload)) return payload;
            return { format: 'binary', content: '[binary]' };                // recon4 non-string label
        },
        harvestIdentities: (text) => {
            if (typeof text !== 'string' || !text) return;
            const tokens = text.match(JWT_PATTERN);
            if (tokens) tokens.forEach((token) => STATE.identities.add(token));
        },
        markHooked: (fn) => {
            try { Object.defineProperty(fn, '__psiReconHooked', { value: true, configurable: true }); }
            catch (markerError) { HELPERS.debug('hook marker failed:', markerError); }
        }
    };

    // ─── 4. UI PLUMBING (event bus + rAF-coalesced rendering + clipboard + toast) ───
    const UI = {
        renderPending: false,
        notifyUI() {
            _window.dispatchEvent(new _window.CustomEvent('psi-update'));        // recond lineage bus
            _window.dispatchEvent(new _window.CustomEvent('psi-recon-update'));  // recon4 lineage bus
            UI.scheduleRender();
        },
        scheduleRender() {
            if (UI.renderPending || !STATE.isUiReady) return;
            UI.renderPending = true;
            const raf = _window.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
            raf(() => {
                UI.renderPending = false;
                updateView();
                updateHUD();
            });
        },
        injectStyles() {
            if (_document.getElementById(STYLE_ID)) return;
            const style = _document.createElement('style');
            style.id = STYLE_ID;
            style.textContent = `
                .${CSS_PREFIX}-toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%);
                    background:rgba(10,19,26,0.95); color:#00E5FF; padding:10px 22px; border-radius:6px;
                    font:15px 'JetBrains Mono', monospace; z-index:2147483647; opacity:0; transition:opacity 150ms ease-in-out; pointer-events:none; }
                .${CSS_PREFIX}-toast-visible { opacity:1; }
            `;
            (_document.head || _document.documentElement).appendChild(style);
        },
        showToast(msg, duration = 3000) {
            if (!_document.body) return;
            _document.querySelectorAll('.' + CSS_PREFIX + '-toast').forEach((el) => el.remove());
            const el = _document.createElement('div');
            el.className = CSS_PREFIX + '-toast';
            el.textContent = msg;
            _document.body.appendChild(el);
            const raf = _window.requestAnimationFrame || ((fn) => setTimeout(fn, 16));
            raf(() => el.classList.add(CSS_PREFIX + '-toast-visible'));
            setTimeout(() => {
                el.classList.remove(CSS_PREFIX + '-toast-visible');
                el.addEventListener('transitionend', () => el.remove(), { once: true });
                setTimeout(() => el.remove(), 500);   // fallback if transitionend never fires (reconc leak fix)
            }, duration);
        },
        copyToClipboard(text) {   // B.1 chain: GM_setClipboard → navigator.clipboard → execCommand
            return new Promise((resolve) => {
                try {
                    if (typeof GM_setClipboard === 'function') { GM_setClipboard(text); resolve(true); return; }
                } catch (gmError) { HELPERS.debug('[clipboard] GM_setClipboard failed:', gmError); }
                if (_navigator.clipboard && typeof _navigator.clipboard.writeText === 'function') {
                    _navigator.clipboard.writeText(text).then(() => resolve(true)).catch((navError) => {
                        HELPERS.debug('[clipboard] navigator.clipboard failed:', navError);
                        resolve(UI.fallbackExecCommand(text));
                    });
                    return;
                }
                resolve(UI.fallbackExecCommand(text));
            });
        },
        fallbackExecCommand(text) {   // B.1 clipboard fallback for cross-origin iframe contexts
            try {
                const ta = _document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed; left:-9999px; top:0; opacity:0;';
                _document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = _document.execCommand('copy');
                ta.remove();
                return ok;
            } catch (execError) {
                HELPERS.debug('[clipboard] execCommand fallback failed:', execError);
                return false;
            }
        },
        toggleFloat() {
            if (!STATE.isUiReady) return;
            STATE.isFloat = !STATE.isFloat;
            if (STATE.isFloat) {
                dockHost.style.width = 'min(760px, 92vw)';
                dockHost.style.left = '16px';
                dockHost.style.top = '16px';
                dockHost.style.bottom = 'auto';
                panelEl.style.height = '420px';
                panelEl.style.maxHeight = '80vh';
                panelEl.style.resize = 'both';       // reconc native resize capability
                panelEl.style.overflow = 'auto';
                UI.showToast('FLOAT MODE — drag the header to reposition');
            } else {
                dockHost.style.width = '100%';
                dockHost.style.left = '0';
                dockHost.style.top = 'auto';
                dockHost.style.bottom = '0';
                panelEl.style.height = '280px';
                panelEl.style.maxHeight = '';
                panelEl.style.resize = 'none';
                panelEl.style.overflow = 'hidden';
                UI.showToast('DOCK MODE');
            }
        }
    };

    // ─── 5. SHARED HOOK REGISTRY (recond/recon4 window.Hook contract, init() repaired) ───
    const Hook = {
        init() {
            if (STATE.hooksInstalled) return;
            STATE.hooksInstalled = true;
            hookConsole();               // recon3 lineage: console harvester (5 types)
            armNetworkHub();             // v9.1.0: fetch/XHR/beacon defusal + capture on the shared NetHook
            Hook.hookPostMessage();      // recond + recon4 lineage: postMessage bridge
            Hook.hookWebSocket();        // recon4 lineage: WebSocket bridge (statics preserved)
            pristineConsole.log('%c[Ψ-RECON-Ω] UNIFIED v9.1.0-Ω — ALL INTERCEPTORS ARMED', 'color:#00E5FF;font-weight:bold');
        },
        record(url, method, data, type) {          // recon4 external contract
            captureNetwork(HELPERS.normalizeUrl(url), method, null, data, type);
        },
        logConsole(type, ...args) {                // recon4 external contract
            let content;
            try {
                content = args.map((a) => {
                    if (a == null) return String(a);
                    if (typeof a === 'object') return _JSON.stringify(a, null, 2);
                    return String(a);
                }).join(' ');
            } catch (stringifyError) { content = '[Complex object]'; }
            STATE.logs.push({
                ts: new Date().toISOString(),
                localTs: new Date().toLocaleTimeString(),
                type: String(type).toUpperCase(),
                content: content
            });
            STATE.logCount++;
            if (STATE.logs.length > BUFFER_LIMIT) STATE.logs.shift();
            UI.notifyUI();
        },
        hookPostMessage() {
            // (a) Passive bridge listener (recond lineage): sees every MessageEvent
            //     delivered to window, even when no host listener exists.
            _window.addEventListener('message', (e) => {
                if (seenMessages.has(e)) return;
                seenMessages.add(e);
                Hook.recordBridge(e);
            });
            // (b) Intercepting wrapper (recon4 lineage): records before host listeners
            //     run. removeEventListener is honored via a WeakMap unwrap table
            //     (fixes recon4's listener leak) and a WeakSet dedupes double capture.
            const origAdd = _window.addEventListener;
            const origRemove = _window.removeEventListener;
            const unwrap = new WeakMap();
            _window.addEventListener = function(type, listener, options) {
                if (type === 'message' && typeof listener === 'function') {
                    const wrapped = (e) => {
                        if (!seenMessages.has(e)) {
                            seenMessages.add(e);
                            Hook.recordBridge(e);
                        }
                        return listener(e);
                    };
                    unwrap.set(listener, wrapped);
                    return origAdd.call(this, type, wrapped, options);
                }
                return origAdd.apply(this, arguments);
            };
            _window.removeEventListener = function(type, listener, options) {
                const wrappedListener = (type === 'message' && typeof listener === 'function') ? unwrap.get(listener) : undefined;
                if (wrappedListener) {
                    unwrap.delete(listener);
                    return origRemove.call(this, type, wrappedListener, options);
                }
                return origRemove.apply(this, arguments);
            };
        },
        recordBridge(e) {
            let payload;
            try { payload = _JSON.stringify(e.data); }
            catch (bridgeError) { payload = '[non-serializable]'; }   // fixes recond's unguarded stringify
            Hook.record(_window.location.href, 'MSG', payload, 'BRIDGE');
        },
        hookWebSocket() {
            const NativeWS = _window.WebSocket;
            if (typeof NativeWS !== 'function' || NativeWS.__psiReconHooked) return;
            const WSWrapper = function(...args) {
                const ws = new NativeWS(...args);
                const bridgeUrl = HELPERS.normalizeUrl(args[0]);
                ws.addEventListener('message', (e) => {
                    const snippet = (typeof e.data === 'string') ? e.data.substring(0, SNIPPET_LEN) : '[binary/blob]';
                    captureNetwork(bridgeUrl, 'WS', null, { format: 'ws-in', content: snippet }, 'BRIDGE');
                });
                const nativeSend = (typeof ws.send === 'function') ? ws.send.bind(ws) : null;
                if (nativeSend) {
                    ws.send = (data) => {                 // outgoing bridge capture (new capability)
                        const snippet = (typeof data === 'string') ? data.substring(0, SNIPPET_LEN) : '[binary/blob]';
                        captureNetwork(bridgeUrl, 'WS', { format: 'ws-out', content: snippet }, null, 'BRIDGE');
                        return nativeSend(data);
                    };
                }
                return ws;
            };
            // Preserve constructor statics and prototype identity (fixes recon4's
            // instanceof / READY-state regression).
            ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach((key) => {
                if (NativeWS[key] !== undefined) {
                    try { Object.defineProperty(WSWrapper, key, { value: NativeWS[key], configurable: true }); }
                    catch (staticError) { HELPERS.debug('WebSocket static copy failed:', staticError, key); }
                }
            });
            try { WSWrapper.prototype = NativeWS.prototype; }
            catch (protoError) { HELPERS.debug('WebSocket prototype link failed:', protoError); }
            HELPERS.markHooked(WSWrapper);
            _window.WebSocket = WSWrapper;
        }
    };

    // ─── 6. OPERATOR CONTROL SURFACES (reconh C2 + reconc facade) ───
    const API = {
        get sessionData() { return STATE.sessionData; },
        purgeAll() {
            STATE.network = [];
            STATE.logs = [];
            STATE.sessionData = [];
            STATE.identities.clear();
            STATE.packetCount = 0;
            STATE.logCount = 0;
            UI.notifyUI();
        },
        startNewSession() {
            API.purgeAll();
            HELPERS.log('New reconnaissance session started. All captured data has been cleared.');
            UI.showToast('New Recon Session Started');
        },
        applyBlockRules(rulesStr) {
            if (typeof rulesStr !== 'string') { HELPERS.error('applyBlockRules expects a string.'); return; }
            STATE.blockRules = rulesStr.split('\n').map((r) => r.trim()).filter(Boolean);
            HELPERS.log('Applied ' + STATE.blockRules.length + ' block rule(s):', STATE.blockRules);
        },
        applyMuteRules(rulesStr) {
            if (typeof rulesStr !== 'string') { HELPERS.error('applyMuteRules expects a string.'); return; }
            STATE.muteRules = rulesStr.split('\n').map((r) => r.trim()).filter(Boolean);
            HELPERS.log('Applied ' + STATE.muteRules.length + ' mute rule(s):', STATE.muteRules);
        },
        copySessionData() {
            if (STATE.sessionData.length === 0) { HELPERS.log('Session data is empty. Nothing to copy.'); return; }
            HELPERS.log('Session data (' + STATE.sessionData.length + ' entries) staged below.');
            pristineConsole.log(STATE.sessionData);
            HELPERS.log('>>> FOOLPROOF COPY: Run the following command in the console to copy the data as a JSON object:');
            pristineConsole.log('copy(reconEngine.sessionData)');
        }
    };

    // ─── 7. CORE PARSING & CAPTURE (reconh + reconc + recon3 lineage) ───

    function safeDeepClone(obj) {
        try { return _JSON.parse(_JSON.stringify(obj)); }
        catch (cloneError) { HELPERS.error('Clone failed:', cloneError); return null; }
    }

    async function parseBody(body, headers = {}) {
        if (body == null) return { format: 'empty', content: null };
        const contentType = (headers && typeof headers.get === 'function')
            ? (headers.get('content-type') || '')
            : ((headers && headers['content-type']) || '');
        try {
            if (body instanceof _window.FormData) {
                const fields = {};
                for (const [key, value] of body.entries()) {
                    fields[key] = (value instanceof _window.File)
                        ? { fileName: value.name, fileSize: value.size, fileType: value.type }
                        : value;
                }
                return { format: 'form-data', content: fields };
            }
            if (body instanceof _window.URLSearchParams) {
                return { format: 'urlencoded', content: Object.fromEntries(body.entries()) };
            }
            if (body instanceof _window.Blob) {
                const blobText = await body.text();
                try { return { format: 'json-from-blob', content: _JSON.parse(blobText) }; }
                catch (blobJsonError) { return { format: 'text-from-blob', content: blobText.substring(0, SNIPPET_LEN) }; }
            }
            if (typeof body === 'string') {
                try { return { format: 'json-from-string', content: _JSON.parse(body) }; }
                catch (jsonError) { return { format: 'text', content: body.substring(0, SNIPPET_LEN) }; }
            }
            if (typeof body === 'object' && typeof body.text === 'function') {
                const streamText = await body.text();
                try { return { format: 'json', content: _JSON.parse(streamText) }; }
                catch (streamJsonError) { return { format: 'text', content: streamText.substring(0, SNIPPET_LEN) }; }
            }
            if (body instanceof _window.ArrayBuffer) {
                return { format: 'binary', content: '[ArrayBuffer ' + body.byteLength + ' bytes]' };
            }
            if (typeof body === 'object') {
                // Pre-parsed bodies (XHR responseType 'json') pass through and are
                // deep-cloned downstream — fixes reconc's JSON.parse(object) crash.
                return { format: 'object', content: body };
            }
            return { format: 'unknown', content: '[Unsupported Body Type]' };
        } catch (parseError) {
            return { format: 'error', content: '[Parse Error: ' + (parseError && parseError.message) + ']' };
        }
    }

    function logApiResponse(source, url, data, type, method) {
        const clonedData = safeDeepClone(data);
        if (clonedData === null) return;   // uncloneable payloads are skipped (baseline guarantee)
        STATE.sessionData.push({
            timestamp: new Date().toISOString(),
            source: source,
            url: url,
            type: type,
            method: method,
            data: clonedData
        });
        if (STATE.sessionData.length > SESSION_LIMIT) STATE.sessionData.shift();   // B.1 FIFO eviction
        if (url && STATE.muteRules.some((rule) => url.includes(rule))) {
            UI.notifyUI();   // reconh guarantee: always recorded, console feed silenced only
            return;
        }
        pristineConsole.log('[Ψ-RECON-Ω] [' + String(type).toUpperCase() + '] ' + (method || 'GET') + ' -> ' + url, clonedData);
        UI.notifyUI();
    }

    function captureNetwork(url, method, req, res, proto) {
        url = String(url == null ? '' : url);
        if (!url || url.includes('blob:') || url.includes('data:')) return;   // recon3 blob: + recon4 data: filters
        const request = req ? HELPERS.normalizePayload(req) : null;
        const response = HELPERS.normalizePayload(res);
        STATE.network.push({
            timestamp: new Date().toISOString(),
            localTs: new Date().toLocaleTimeString(),
            protocol: proto || 'NET',
            method: String(method || 'GET').toUpperCase(),
            url: url,
            displayUrl: url.split('?')[0],        // recond/recon4 query-stripped display form
            request: request,
            response: response
        });
        STATE.packetCount++;
        if (STATE.network.length > BUFFER_LIMIT) STATE.network.shift();
        HELPERS.harvestIdentities(url + ' ' + HELPERS.safeStringify(request) + ' ' + HELPERS.safeStringify(response));
        UI.notifyUI();
    }

    // ─── 8. NETWORK DEFUSAL & CAPTURE — the shared NetHook hub (v9.1.0) ───
    // The reconh/recon3/reconc fetch/XHR recorders rode their own wraps
    // until v9.1.0; they now subscribe to the suite's shared NetHook
    // singleton (kernel/net.js, build-inlined as __4NDR0_NET_API__): one
    // wrap set per realm, shared with every co-installed suite script —
    // the stacked-proxy interference the sink census measured is gone.
    // Recon keeps its full baseline surface, expressed as hub verdicts
    // and structured traffic events instead of local proxies:
    //   - MITM block rules → request-time respond verdicts (the same 204
    //     pacification; fetch resolves a phantom Response, XHR delivers
    //     the full mocked load surface on the hub cadence, and the
    //     blocklist doctrine now extends to beacons);
    //   - request/response envelopes → traffic events, phase-correlated
    //     by the hub's exchange id (request parses awaited exactly like
    //     the loadend await the local facade performed);
    //   - external-block logging + the reconh TypeError→204 pacification
    //     → the onError recovery channel (hub vetoes from co-installed
    //     defusers are final and never un-defused).
    const NET_HUB = __4NDR0_NET_API__;   // build-inlined (tools/build.mjs CANON_KERNEL)

    // In-flight request parses, keyed by hub exchange id — bounded FIFO
    // (B.1): beyond 512 concurrent exchanges the oldest entry evicts and
    // its response records a null request envelope (the exact shape a
    // bodyless GET always produced).
    const PENDING_LIMIT = 512;
    const pendingRequests = new Map();   // id -> { reqUrl, promise }

    function stashPending(id, reqUrl, promise) {
        pendingRequests.set(id, { reqUrl: reqUrl, promise: promise });
        if (pendingRequests.size > PENDING_LIMIT) {
            pendingRequests.delete(pendingRequests.keys().next().value);
        }
    }

    function ledgerLabel(kind) {
        return kind === 'xhr' ? 'XHR' : kind === 'beacon' ? 'BEACON' : 'FETCH';
    }

    function messageLabel(kind) {
        return kind === 'xhr' ? 'XHR' : kind === 'beacon' ? 'Beacon' : 'Fetch';
    }

    function armNetworkHub() {
        // Defusal — the reconh MITM blocklist as request-time verdicts: a
        // blocked exchange never leaves the page.
        NET_HUB.onRequest((req) => {
            const url = HELPERS.normalizeUrl(req.url);
            if (url && STATE.blockRules.some((rule) => url.includes(rule))) {   // reconh MITM block
                const kind = messageLabel(req.kind);
                const method = String(req.method || 'GET').toUpperCase();
                HELPERS.log('[MITM] BLOCKED ' + kind + ' request to: ' + url);
                parseBody(req.body).then((blockedBody) => {
                    logApiResponse(ledgerLabel(req.kind), url, { body: blockedBody }, 'blocked', method);
                }).catch((blockedParseError) => {
                    HELPERS.debug('[interceptor] blocked-body parse failed:', blockedParseError);
                });
                return { respond: { status: 204, statusText: 'Blocked by ReconEngine Rule' } };
            }
            return undefined;
        });

        // Observation — the recon3 rich capture + reconc parsing as
        // structured traffic events (every fetch status, XHR loads,
        // phantom parity; request bodies awaited, never raced).
        NET_HUB.onTraffic((ev) => {
            const url = HELPERS.normalizeUrl(ev.url);
            const method = String(ev.method || 'GET').toUpperCase();

            if (ev.phase === 'request') {
                // Baseline parity: fetch logged request envelopes only when
                // a body was present; XHR always logged (empty envelope for
                // bodyless sends). Beacons are the v9.1.0 forensic
                // extension of the same recorder to the third channel.
                if (ev.kind === 'fetch' && ev.body == null) return;
                const parse = parseBody(ev.body).catch(() => ({ format: 'error', content: null }));
                stashPending(ev.id, url, parse);
                parse.then((requestEnvelope) => {
                    logApiResponse(ledgerLabel(ev.kind), url, requestEnvelope, 'request', method);
                });
                return;
            }

            if (ev.phase === 'response') {
                if (ev.kind === 'beacon') return;   // beacons have no response phase on the hub
                const pending = pendingRequests.get(ev.id);
                const captureUrl = pending ? pending.reqUrl : url;   // open-time URL (baseline shape)
                pendingRequests.delete(ev.id);
                parseBody(ev.body, { 'content-type': ev.contentType || '' })   // recon3 rich + reconc headers-aware
                    .then((responseEnvelope) => {
                        return (pending ? pending.promise : Promise.resolve(null)).then((requestEnvelope) => {
                            captureNetwork(captureUrl, method, requestEnvelope, responseEnvelope, ledgerLabel(ev.kind));
                            logApiResponse(ledgerLabel(ev.kind), url, responseEnvelope, 'response', method);
                        });
                    })
                    .catch((responseParseError) => {
                        HELPERS.debug('[interceptor] ' + ledgerLabel(ev.kind) + ' response parse failed:', responseParseError);
                    });
                return;
            }

            // Error phase — XHR external blocks (reconh twin), hub vetoes
            // from co-installed defusers (forensic observation only — a
            // veto is final and never un-defused), and real non-TypeError
            // fetch failures exactly as the local facade logged them
            // (TypeError-class failures log — and pacify — in the onError
            // recoverer below, so they do not double-log here).
            if (ev.kind === 'xhr') {
                if (!(url && STATE.muteRules.some((rule) => url.includes(rule)))) {
                    HELPERS.error('XHR Error for ' + method + ' ' + url + '. This may be due to an external filter.');
                }
                logApiResponse('XHR', url, { error: 'XHR failed' }, 'external_block', method);
                return;
            }
            if (ev.source === 'veto') {
                logApiResponse('FETCH', url, { error: 'Failed to fetch' }, 'external_block', method);
                return;
            }
            if (ev.errorName !== 'TypeError') {
                HELPERS.error('Fetch failed for ' + method + ' ' + url + ': ' + (ev.errorMessage || 'network error'));
            }
        });

        // Recovery — the reconh 204 pacification: an externally-nulled
        // fetch (ad-blocker / dead endpoint) resolves as a synthetic 204
        // instead of crashing the host app. TypeError-class only — the
        // instanceof gate the local facade carried; hub vetoes never
        // reach this consult (final by kernel contract).
        NET_HUB.onError((ev) => {
            const url = HELPERS.normalizeUrl(ev.url);
            const method = String(ev.method || 'GET').toUpperCase();
            if (ev.errorName === 'TypeError') {
                if (!(url && STATE.muteRules.some((rule) => url.includes(rule)))) {
                    HELPERS.error('Fetch to ' + url + ' was blocked by an external filter (e.g., ad-blocker).');
                }
                logApiResponse('FETCH', url, { error: ev.errorMessage || 'Failed to fetch' }, 'external_block', method);
                return { respond: { status: 204, statusText: 'Intercepted & Nullified by ReconEngine' } };
            }
            return undefined;
        });

        HELPERS.log('NetHub interception active on the shared NetHook (recorder + block/mute + identity rules ARMED).');
    }


    function hookConsole() {
        CONSOLE_TYPES.forEach((type) => {
            const org = _console[type];
            if (typeof org !== 'function' || org.__psiReconHooked) return;
            _console[type] = (...args) => {
                Hook.logConsole(type, ...args);
                return org.apply(_console, args);
            };
            HELPERS.markHooked(_console[type]);
        });
        HELPERS.log('Console harvester ARMED (log/warn/error/info/debug).');
    }

    // ─── 9. REPORTING (recon3 full forensic + recond/recon4 compact) ───

    function generateReport() {          // compact dock report (recond/recon4 lineage)
        let r = '# 📂 Ψ-FORENSIC RECON REPORT\n';
        r += '**Host:** ' + _window.location.host + '\n';
        r += '**Session Start:** ' + STATE.startTime + '\n';
        r += '**Time:** ' + new Date().toISOString() + '\n\n';
        r += '## 🌐 Identities (' + STATE.identities.size + ')\n';
        r += STATE.identities.size
            ? [...STATE.identities].map((identity) => '* `' + identity.slice(0, 40) + '...`').join('\n')
            : '* None';
        r += '\n\n## 📡 Network (last ' + VIEW_SLICE + ')\n| Type | Method | Path |\n|---|---|---|\n';
        r += STATE.network.slice(-VIEW_SLICE).reverse()
            .map((n) => '| ' + n.protocol + ' | ' + n.method + ' | `' + String(n.displayUrl).replace(/\|/g, '\\|') + '` |')
            .join('\n') || '| | | |';
        r += '\n\n## 🖥️ Console (last ' + VIEW_SLICE + ')\n';
        r += STATE.logs.slice(-VIEW_SLICE).reverse()
            .map((l) => '[' + l.ts + '] ' + l.type + ': ' + String(l.content).replace(/\|/g, '\\|'))
            .join('\n') || '* None';
        r += '\n\n## 🧾 Session Ledger (last ' + VIEW_SLICE + ' of ' + STATE.sessionData.length + ')\n';
        r += STATE.sessionData.slice(-VIEW_SLICE).reverse()
            .map((s) => '[' + s.timestamp + '] ' + s.source + ' ' + s.type + ' ' + s.method + ' ' + s.url)
            .join('\n') || '* None';
        return r;
    }

    function generateMarkdownReport() {  // full forensic report (recon3 lineage, superset)
        let md = '# 📂 Ψ-FORENSIC RECON REPORT\n';
        md += '**Session Start:** ' + STATE.startTime + '\n';
        md += '**Report Generated:** ' + new Date().toISOString() + '\n';
        md += '**Target Host:** ' + _window.location.host + '\n\n';
        md += '## 📊 Telemetry Summary\n';
        md += '* Total Network Packets: ' + STATE.packetCount + '\n';
        md += '* Total Console Logs: ' + STATE.logCount + '\n';
        md += '* Session Ledger Events: ' + STATE.sessionData.length + '\n';
        md += '* Identities Harvested: ' + STATE.identities.size + '\n\n';
        md += '## 🌐 Identities\n';
        md += STATE.identities.size
            ? [...STATE.identities].map((identity) => '* `' + identity.slice(0, 40) + '...`').join('\n')
            : '* None';
        md += '\n\n## 🌐 Network Stream (' + STATE.network.length + ' entries)\n';
        STATE.network.forEach((n) => {
            md += '### [' + n.protocol + '] ' + n.method + ' - ' + n.url + '\n';
            md += '* **Timestamp:** ' + n.timestamp + '\n';
            if (n.request) md += '* **Request Payload:** ```json\n' + HELPERS.safeStringify(n.request) + '\n```\n';
            md += '* **Response:** ```json\n' + HELPERS.safeStringify(n.response) + '\n```\n\n';
            md += '---\n';
        });
        md += '\n## 💻 Console Output (' + STATE.logs.length + ' entries)\n';
        md += '| Timestamp | Type | Content |\n|---|---|---|\n';
        STATE.logs.forEach((l) => {
            md += '| ' + l.ts + ' | ' + l.type + ' | `' + String(l.content).substring(0, 200).replace(/\|/g, '\\|') + '` |\n';
        });
        md += '\n## 🧾 Raw Session Ledger (' + STATE.sessionData.length + ' events)\n';
        md += '```json\n' + HELPERS.safeStringify(STATE.sessionData) + '\n```\n';
        return md;
    }

    // ─── 10. DOCK UI (recond/recon4 glass dock + recon3 HUD counters + reconc float/drag) ───

    function injectHUD() {
        if (_document.getElementById(HOST_ID)) return null;
        const host = _document.createElement('div');
        host.id = HOST_ID;
        host.style.cssText = 'all:initial; position:fixed; bottom:0; left:0; width:100%; z-index:2147483647; pointer-events:none;';
        _document.documentElement.appendChild(host);
        const shadow = host.attachShadow({ mode: 'closed' });
        const style = _document.createElement('style');
        style.textContent = `
            #panel { width:100%; height:280px; background:${THEME.glass}; border-top:1px solid ${THEME.border};
                backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
                display:flex; flex-direction:column; font-family:'JetBrains Mono',monospace;
                overflow:hidden; color:#fff; box-shadow:0 -4px 15px ${THEME.glow};
                transition:transform 300ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease-in-out; pointer-events:auto; }
            #panel.hidden { transform:translateY(100%); }
            #resizer { height:8px; cursor:ns-resize; width:100%; background:transparent; position:absolute; top:0; z-index:10; }
            #resizer:hover { background:${THEME.border}; }
            .header { display:flex; justify-content:space-between; align-items:center; padding:10px 15px;
                background:rgba(0,229,255,0.05); border-bottom:1px solid ${THEME.border}; }
            .header-info { display:flex; align-items:center; gap:10px; color:${THEME.cyan}; font-weight:bold; font-size:11px; }
            .counters { display:flex; gap:8px; font-size:9px; color:rgba(0,229,255,0.35); }
            .tabs { display:flex; background:rgba(0,0,0,0.2); }
            .tab { padding:8px 20px; cursor:pointer; font-size:10px; border-right:1px solid ${THEME.border}; opacity:0.6; }
            .tab.active { opacity:1; color:${THEME.cyan}; background:rgba(0,229,255,0.05); border-bottom:2px solid ${THEME.cyan}; }
            #viewport { flex:1; overflow-y:auto; padding:10px; font-size:9px; background:rgba(0,0,0,0.1);
                white-space:pre-wrap; word-break:break-all; }
            .row { margin-bottom:3px; border-bottom:1px solid rgba(255,255,255,0.02); padding:2px 0; }
            .btn { background:transparent; border:1px solid ${THEME.border}; color:${THEME.cyan};
                padding:3px 10px; font-size:10px; cursor:pointer; font-weight:bold; transition:0.2s; }
            #status { font-size:9px; color:#00E5FF; text-align:center; border:1px solid rgba(0,229,255,0.15); padding:4px; margin:0 15px 8px 15px; }
        `;
        shadow.appendChild(style);
        const ui = _document.createElement('div');
        ui.id = 'panel';
        /* [R3] element-built panel (was an innerHTML template inside the
         * closed shadow root). IDs/classes/handlers preserved 1:1. */
        const resizer = _document.createElement('div');
        resizer.id = 'resizer';
        const header = _document.createElement('div');
        header.className = 'header';
        const headerInfo = _document.createElement('div');
        headerInfo.className = 'header-info';
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const glyph = _document.createElementNS(SVG_NS, 'svg');
        glyph.setAttribute('viewBox', '0 0 128 128');
        glyph.setAttribute('style', 'width:14px;height:14px;');
        const glyphRing = _document.createElementNS(SVG_NS, 'path');
        glyphRing.setAttribute('d', 'M 64,12 A 52,52 0 1 1 63.9,12 Z');
        glyphRing.setAttribute('stroke', THEME.cyan);
        glyphRing.setAttribute('fill', 'none');
        glyphRing.setAttribute('stroke-width', '2');
        const glyphPsi = _document.createElementNS(SVG_NS, 'text');
        glyphPsi.setAttribute('x', '64');
        glyphPsi.setAttribute('y', '75');
        glyphPsi.setAttribute('text-anchor', 'middle');
        glyphPsi.setAttribute('fill', THEME.cyan);
        glyphPsi.setAttribute('font-size', '50');
        glyphPsi.setAttribute('font-weight', '700');
        glyphPsi.textContent = 'Ψ';
        glyph.append(glyphRing, glyphPsi);
        const titleSpan = _document.createElement('span');
        titleSpan.textContent = 'RECON_Ω_UNIFIED_9.0.0-Ω';
        const counters = _document.createElement('span');
        counters.className = 'counters';
        counters.append('PKT:', (() => { const b = _document.createElement('b'); b.id = 'p-count'; b.textContent = '0'; return b; })(),
            ' LOG:', (() => { const b = _document.createElement('b'); b.id = 'l-count'; b.textContent = '0'; return b; })(),
            ' ID:', (() => { const b = _document.createElement('b'); b.id = 'i-count'; b.textContent = '0'; return b; })(),
            ' EVT:', (() => { const b = _document.createElement('b'); b.id = 'evt-count'; b.textContent = '0'; return b; })());
        headerInfo.append(glyph, titleSpan, counters);
        const headerBtns = _document.createElement('div');
        headerBtns.style.cssText = 'display:flex; gap:10px;';
        const mkBtn = (id, text, extraStyle) => {
            const b = _document.createElement('button');
            b.className = 'btn';
            b.id = id;
            if (extraStyle) b.style.cssText = extraStyle;
            b.textContent = text;
            return b;
        };
        headerBtns.append(
            mkBtn('do-float', 'FLOAT'),
            mkBtn('do-rep', 'REPORT'),
            mkBtn('do-purge', 'PURGE', 'color:#ff0055;'));
        header.append(headerInfo, headerBtns);
        const tabs = _document.createElement('div');
        tabs.className = 'tabs';
        const mkTab = (id, text, active) => {
            const t = _document.createElement('div');
            t.className = 'tab' + (active ? ' active' : '');
            t.id = id;
            t.textContent = text;
            return t;
        };
        tabs.append(
            mkTab('tab-net', 'NETWORK', true),
            mkTab('tab-log', 'CONSOLE', false),
            mkTab('tab-rep', 'REPORT', false),
            mkTab('tab-data', 'DATA', false));
        const status = _document.createElement('div');
        status.id = 'status';
        status.className = 'status';
        status.textContent = 'SNIFFING_ACTIVE...';
        const viewport = _document.createElement('div');
        viewport.id = 'viewport';
        ui.append(resizer, header, tabs, status, viewport);
        shadow.appendChild(ui);
        return { host: host, shadow: shadow, ui: ui };
    }

    function injectUI() {
        if (STATE.isUiReady) return;
        const hud = injectHUD();
        if (!hud) return;
        STATE.isUiReady = true;
        dockHost = hud.host;
        dockShadow = hud.shadow;
        panelEl = hud.ui;
        viewportEl = dockShadow.getElementById('viewport');

        // Event delegation for tabs and buttons (recon4 lineage)
        panelEl.addEventListener('click', (e) => {
            const target = e.target.closest ? e.target.closest('.tab, .btn') : null;
            if (!target) return;
            if (target.classList.contains('tab')) {
                dockShadow.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
                target.classList.add('active');
                STATE.currentTab = target.id.replace('tab-', '');
                updateView();
            } else if (target.id === 'do-rep') {
                if (Date.now() - STATE.lastReportCopy < REPORT_DEBOUNCE_MS) return;   // recon4 debounce
                STATE.lastReportCopy = Date.now();
                UI.copyToClipboard(generateMarkdownReport()).then((copied) => {
                    UI.showToast(copied
                        ? 'Full forensic report copied to clipboard!'
                        : 'Clipboard copy failed — open the REPORT tab and copy manually.');
                });
                target.textContent = 'COPIED TO CLIPBOARD!';   // recon3 visual feedback
                target.style.background = '#00E5FF';
                target.style.color = '#000';
                setTimeout(() => {
                    target.textContent = 'REPORT';
                    target.style.background = '';
                    target.style.color = '';
                }, 2000);
            } else if (target.id === 'do-purge') {
                API.startNewSession();   // recond/recon4 PURGE + reconc New Session semantics
            } else if (target.id === 'do-float') {
                UI.toggleFloat();
            }
        });

        // Resizer (recond/recon4 lineage) — dock-mode vertical resize
        const resizer = dockShadow.getElementById('resizer');
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startH = panelEl.offsetHeight;
            const onMove = (ev) => {
                const h = _window.innerHeight - ev.clientY;
                // Safety floor 40px / ceiling 95% of viewport so the resizer stays reachable
                if (h > 40 && h < _window.innerHeight * 0.95) panelEl.style.height = h + 'px';
            };
            const onUp = () => {
                _document.removeEventListener('mousemove', onMove);
                _document.removeEventListener('mouseup', onUp);
            };
            _document.addEventListener('mousemove', onMove);
            _document.addEventListener('mouseup', onUp);
        });

        // Header drag (recon3/reconc lineage) — repositioning in float mode
        const header = dockShadow.querySelector('.header');
        header.addEventListener('mousedown', (e) => {
            if (!STATE.isFloat) return;
            e.preventDefault();
            const rect = panelEl.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            const onMouseMove = (ev) => {
                dockHost.style.left = (ev.clientX - offsetX) + 'px';
                dockHost.style.top = (ev.clientY - offsetY) + 'px';
            };
            const onMouseUp = () => {
                _document.removeEventListener('mousemove', onMouseMove);
                _document.removeEventListener('mouseup', onMouseUp);
            };
            _document.addEventListener('mousemove', onMouseMove);
            _document.addEventListener('mouseup', onMouseUp);
        });

        // Alt+Shift+R hide/show (recond/recon4 lineage, phantom-click mitigation).
        // Suite collision fix: bare Alt+R is owned by PageCraft's broken-image
        // retrigger (legacy BrokenImgFixer binding); Recon takes the shifted combo.
        _window.addEventListener('keydown', (e) => {
            if (e.altKey && e.shiftKey && (e.key || '').toLowerCase() === 'r') {
                STATE.isHidden = !STATE.isHidden;
                panelEl.classList.toggle('hidden');
                dockHost.style.visibility = STATE.isHidden ? 'hidden' : 'visible';
                updateHUD();
            }
        });

        // Live updates (recond 'psi-update' + recon4 'psi-recon-update' buses)
        _window.addEventListener('psi-update', UI.scheduleRender);
        _window.addEventListener('psi-recon-update', UI.scheduleRender);

        UI.injectStyles();
        updateView();
        updateHUD();
        UI.showToast('Ψ-RECON-Ω UNIFIED v9.0.0-Ω ARMED');
    }

    function updateView() {
        if (!STATE.isUiReady || !viewportEl) return;
        /* [R3] element-built views (was per-row HTML string assembly —
         * textContent carries the payloads, so escapeHtml is no longer
         * needed on this path: structural safety by construction). */
        const mkRow = (...kids) => {
            const row = _document.createElement('div');
            row.className = 'row';
            row.append(...kids.filter(Boolean));
            return row;
        };
        const mkSpan = (color, text) => {
            const s = _document.createElement('span');
            if (color) s.style.color = color;
            s.textContent = text;
            return s;
        };
        const mkPre = (text) => {
            const pre = _document.createElement('pre');
            pre.style.cssText = 'white-space:pre-wrap; color:#67E8F9; margin:0;';
            pre.textContent = text;
            return pre;
        };
        if (STATE.currentTab === 'net') {
            const rows = STATE.network.slice(-VIEW_SLICE).reverse().map((n) =>
                mkRow(
                    mkSpan('rgba(103,232,249,0.5)', '[' + n.localTs + ']'),
                    ' ',
                    mkSpan(THEME.cyan, n.protocol),
                    ' ' + n.method + ' ' + n.displayUrl));
            viewportEl.replaceChildren(...(rows.length ? rows : [mkRow('* No traffic captured yet.')]));
        } else if (STATE.currentTab === 'log') {
            const rows = STATE.logs.slice(-VIEW_SLICE).reverse().map((l) =>
                mkRow(
                    mkSpan('rgba(103,232,249,0.5)', '[' + l.localTs + ']'),
                    ' ' + l.type + ': ' + l.content));
            viewportEl.replaceChildren(...(rows.length ? rows : [mkRow('* No console output captured yet.')]));
        } else if (STATE.currentTab === 'rep') {
            viewportEl.replaceChildren(mkPre(generateReport()));
        } else {
            // DATA tab — reconc's raw JSON ledger view
            viewportEl.replaceChildren(mkPre(HELPERS.safeStringify(STATE.sessionData) || '[]'));
        }
    }

    function updateHUD() {
        if (!STATE.isUiReady || !dockShadow) return;
        const packetCountEl = dockShadow.getElementById('p-count');
        const logCountEl = dockShadow.getElementById('l-count');
        const identityCountEl = dockShadow.getElementById('i-count');
        const eventCountEl = dockShadow.getElementById('evt-count');
        const statusLine = dockShadow.getElementById('status');
        if (packetCountEl) packetCountEl.textContent = STATE.packetCount;
        if (logCountEl) logCountEl.textContent = STATE.logCount;
        if (identityCountEl) identityCountEl.textContent = STATE.identities.size;
        if (eventCountEl) eventCountEl.textContent = STATE.sessionData.length;
        if (statusLine) statusLine.textContent = STATE.isHidden ? 'SNIFFING_SUSPENDED_UI — Alt+Shift+R to restore' : 'SNIFFING_ACTIVE...';
    }

    // ─── 11. LIFECYCLE ───

    function boot() {
        if (_document.body) { injectUI(); return; }
        let attempts = 0;
        const bootPoll = setInterval(() => {                       // reconc poll, now bounded (B.1)
            attempts++;
            if (_document.body) {
                clearInterval(bootPoll);
                injectUI();
                return;
            }
            if (attempts >= BOOT_POLL_MAX) {
                clearInterval(bootPoll);
                HELPERS.error('Boot polling exhausted before document.body appeared; dock UI not injected. Interceptors remain armed.');
            }
        }, BOOT_POLL_MS);
        _document.addEventListener('DOMContentLoaded', () => {      // recond/recon4 path
            clearInterval(bootPoll);
            if (!STATE.isUiReady) injectUI();
        }, { once: true });
    }

    function initialize() {
        if (STATE.isInitialized) return;
        STATE.isInitialized = true;
        Hook.init();    // all five interceptors, armed at document-start (zero missed traffic)
        // Operator control surfaces (reconh reconEngine + reconc chimeraRecon + recon4 Hook),
        // exposed on both the page context and the userscript sandbox window.
        _window.reconEngine = API;
        _window.chimeraRecon = {
            get sessionData() { return STATE.sessionData; },
            startNewSession: () => API.startNewSession()
        };
        _window.Hook = Hook;
        window.reconEngine = API;
        window.chimeraRecon = _window.chimeraRecon;
        window.Hook = Hook;
        HELPERS.log('Ψ-RECON-Ω UNIFIED v9.1.0-Ω initialized. C2 via reconEngine / chimeraRecon / Hook in the console; dock toggles with Alt+Shift+R.');
    }

    initialize();   // interceptors armed at document-start (reconh guarantee)
    boot();         // dock UI injected as soon as the DOM can host it (recon3/recond/reconc timing superset)
})();
