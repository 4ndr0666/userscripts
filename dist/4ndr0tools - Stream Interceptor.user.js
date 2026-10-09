// ==UserScript==
// @name         4ndr0tools - Stream Interceptor
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.3.0
// @description  Intercepts, parses, and extracts stream tokens, manifests, and direct video sources via the suite's shared NetHook hub and DOM inspection. Suite v3.3: the v3.1 dual-realm fetch/XHR hooks ride the shared NetHook singleton (malformed-SVG veto, asset discovery, deep text inspection); ShadowDOM piercing, ReDoS-proof regex, 3lectric-Glass card surface, universal URL registry cap.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Stream%20Interceptor.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Stream%20Interceptor.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @connect      playmogo.com
// @connect      vidara.to
// @connect      viderea.cloud
// @connect      doodcdn.com
// @connect      doodcdn.io
// @connect      dood.to
// @connect      dood.wf
// @connect      dood.la
// @connect      doodstream.com
// @connect      *
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


(function () {
    'use strict';

    /* ═══ v3.3.0 — SHARED NETHOOK (4ndr0tools, suite v1.4.6) ═════════════
     * The dual-realm fetch/XHR Reflect hooks migrate onto the suite's
     * shared NetHook singleton (kernel/net.js v4, build-inlined as
     * __4NDR0_NET_API__ — see section 7). One wrap set per realm now
     * serves every co-installed suite script; the malformed-SVG abort
     * becomes a request-time veto, discovery and deep inspection ride
     * the structured traffic channel, and the sandbox realm is armed
     * through hub propagation instead of a second local wrap. Every
     * v3.1 discovery behavior is preserved (see section 7 header).
     *
     * ═══ v3.2.0 — SUITE PROMOTION (4ndr0tools, suite v1.3.0) ══════════════
     * The operator's Stream Interceptor BETA v3.1.0, promoted into the
     * 4ndr0tools suite (BETA suffix stripped per promotion convention):
     *   P1  Suite metadata + update channel (raw dist/ URLs, Ψ glyph icon).
     *   P2  UI refactored to the 3lectric-Glass spec — the BETA cards ran an
     *       off-spec palette (rgba(10,15,26) base, #ff0055 destructive,
     *       #00E5FF cyan, Courier New, 300ms transitions). Now: RGB(10,19,26)
     *       glass base, #00E5FF primary / #67E8F9 hover / #ff0055 destructive,
     *       JetBrains Mono data + Orbitron label typography, 150ms
     *       ease-in-out transitions, 0px-radius brutalist buttons, toast
     *       left-rail accent, Ψ-Orbitron card label.
     *   P3  Review hardening: the discovered-URL registry is now bounded
     *       (1000 entries — a long session on a busy page previously grew it
     *       without limit), console chrome follows the suite color matrix,
     *       menu labels carry the Ψ prefix.
     * Every v3.1 behavior — ShadowDOM-piercing scans, context-safe Reflect
     * hooks on both page and sandbox windows, the ReDoS-lazy extraction
     * regex, pass_md5 token capture, malformed-SVG sanitization, fetch/XHR
     * body deep-inspection with unicode/percent decoding, the tracker-stub
     * (_wv) suppressor, and the observer discipline — is preserved verbatim.
     * ═══════════════════════════════════════════════════════════════════ */

    /* =========================================================================
       1. CORE CONFIGURATION & STATE
       ========================================================================= */
    const CONFIG = {
        DEBUG_MODE: true,
        ENABLE_OBSERVER: true,
        AUTO_DOWNLOAD: false,
        OBSERVER_DEBOUNCE_MS: 800,
        UI_TIMEOUT_MS: 15000,
        MAX_UI_CARDS: 10,
        MAX_INSPECT_PAYLOAD_SIZE: 500000,
        MAX_REDIRECT_DEPTH: 2,
        MAX_FOUND_URLS: 1000,   // v3.2: bounded registry (GUP B.1)
        TARGET_DOMAINS: [
            'playmogo.com', 'vidara.to', 'doodcdn.io', 'dood.',
            'doodcdn.com', 'dood.to', 'dood.wf', 'dood.la', 'doodstream.',
                        'viderea.cloud'
        ],
        // Lazy quantifier [*?] implemented to prevent ReDoS on massive payload chunks
        EXTRACTION_REGEX: /(https?:\\?\/\\?\/[^\s"'<>]*?(?:playmogo\.com|viderea\.cloud|vidara\.to|\.mp4|\.m3u8|\.ts|\\?\/pass_md5\\?\/)[^\s"'<>]*)/gi
    };

    const foundUrls = new Set();

    const log = {
        info: (msg) => { if (CONFIG.DEBUG_MODE) console.log(`%c[INFO] ${msg}`, 'color:#00E5FF;'); },
        warn: (msg) => { if (CONFIG.DEBUG_MODE) console.warn(`%c[WARN] ${msg}`, 'color:#ffaa00;'); },
        error: (msg, err = '') => console.error(`%c[CRITICAL] ${msg}`, 'color:#ff0055; font-weight:bold;', err),
        success: (msg) => console.log(`%c[SUCCESS] ${msg}`, 'color:#67E8F9; font-weight:bold;')
    };

    /* =========================================================================
       2. CONTEXT & SANITIZATION (Runs immediately)
       ========================================================================= */
    const pageWindow = (() => {
        try {
            if (typeof unsafeWindow !== 'undefined' && unsafeWindow && typeof unsafeWindow === 'object') {
                return unsafeWindow;
            }
        } catch (e) {
            log.warn('unsafeWindow scope boundary restricted. Falling back to local window.');
        }
        return window;
    })();

    const isSandboxed = (pageWindow !== window);

    (function injectTrackerStub() {
        const targets = isSandboxed ? [pageWindow, window] : [window];
        for (const win of targets) {
            try {
                if (typeof win._wv === 'undefined') {
                    win._wv = {};
                    log.info('Suppressed blocked tracker fault (_wv proxy injected).');
                }
            } catch (e) {
                log.warn('Tracker stub injection bypassed: ' + e.message);
            }
        }
    })();

    const ALLOWED_SCHEMES = ['http:', 'https:', 'blob:'];
    const MEDIA_SIGNATURE_RE = /\.(mp4|m3u8|ts|m4s|webm|mkv|mov|flv|mpd)(?=$|[\s?&#/=])/i;

    /* =========================================================================
       3. URL RESOLUTION & NORMALIZATION
       ========================================================================= */
    function decodeUrlEscapes(raw) {
        if (raw == null) return raw;
        let s = String(raw);
        try {
            if (s.indexOf('\\u') !== -1) {
                s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
            }
            if (s.indexOf('\\/') !== -1) {
                s = s.replace(/\\\//g, '/');
            }
        } catch (e) {
            log.warn('URL escape sequence decoding failed.', e);
        }
        if (s.indexOf('&') !== -1) {
            s = s.replace(/&amp;/g, '&').replace(/&#0?38;/g, '&').replace(/&#x0?26;/gi, '&');
        }
        return s;
    }

    function resolveUrl(rawUrl) {
        if (rawUrl == null) return null;
        if (typeof rawUrl !== 'string') {
            try { rawUrl = String(rawUrl); } catch (e) { return null; }
        }
        let cleaned = decodeUrlEscapes(rawUrl.trim());
        if (!cleaned) return null;
        cleaned = cleaned.replace(/[\s)\]}"',.;:+]+$/, '').trim();
        if (!cleaned) return null;
        try {
            const parsed = new URL(cleaned, location.origin);
            if (ALLOWED_SCHEMES.indexOf(parsed.protocol) === -1) return null;
            return parsed.href;
        } catch (e) {
            return null;
        }
    }

    function inspectUrl(rawUrl) {
        const resolved = resolveUrl(rawUrl);
        if (resolved) return resolved;
        if (typeof rawUrl === 'string' && rawUrl.trim()) return rawUrl.trim();
        return null;
    }

    function isTargetMatch(url) {
        if (!url) return false;
        const lower = String(url).toLowerCase();
        const hasDomain = CONFIG.TARGET_DOMAINS.some((domain) => lower.includes(domain));
        if (hasDomain) return true;
        return MEDIA_SIGNATURE_RE.test(lower) || lower.includes('/pass_md5/');
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function extractEmbeddedUrls(url) {
        const results = [];
        try {
            const u = new URL(url);
            u.searchParams.forEach((value) => {
                if (!value) return;
                let candidate = value;
                if (/%2F/i.test(candidate) || /%3A/i.test(candidate) || /%25/.test(candidate)) {
                    try { candidate = decodeURIComponent(candidate); } catch (e) { /* keep raw */ }
                }
                candidate = decodeUrlEscapes(candidate);
                const resolved = resolveUrl(candidate);
                if (resolved) results.push(resolved);
            });
        } catch (e) {
            // URL parse failure on embedded params, safe to bypass
        }
        return results;
    }

    /* =========================================================================
       4. UI, CLIPBOARD, & FILE ABSTRACTIONS
       ========================================================================= */
    function legacyCopy(text) {
        try {
            const host = document.body || document.documentElement;
            if (!host) return false;
            const ta = document.createElement('textarea');
            ta.value = text;
            Object.assign(ta.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                opacity: '0',
                pointerEvents: 'none'
            });
            host.appendChild(ta);
            ta.focus();
            ta.select();
            const successful = typeof document.execCommand === 'function' && document.execCommand('copy');
            if (ta.parentNode) ta.parentNode.removeChild(ta);
            if (successful) {
                log.success('Data transaction written via fallback copy layout.');
                return true;
            }
            log.error('Fallback layout replication context returned negative execution verification.');
            return false;
        } catch (fallbackErr) {
            log.error('Critical operational fault during legacy selection copy sequence.', fallbackErr);
            return false;
        }
    }

    async function writeClipboard(text) {
        if (typeof GM_setClipboard === 'function') {
            try {
                GM_setClipboard(text);
                log.success('Copied to clipboard via GM_setClipboard.');
                return true;
            } catch (e) { /* fall through to page APIs */ }
        }
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(text);
                log.success('Copied to clipboard via Clipboard API.');
                return true;
            }
        } catch (e) { /* fall through to legacy path */ }
        log.warn('Primary Clipboard API blocked or sandboxed. Using legacy element selection abstraction.');
        return legacyCopy(text);
    }

    function copyToClipboard(text, btn) {
        const originalText = btn.textContent;
        const resetBtn = () => { setTimeout(() => { btn.textContent = originalText; }, 1500); };
        writeClipboard(text).then((ok) => {
            if (ok) {
                btn.textContent = 'COPIED ✓';
            } else {
                btn.textContent = 'FAILED ✗';
                log.error('Clipboard write rejected by all available copy strategies.');
            }
            resetBtn();
        });
    }

    function buildSafeFilename(url) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let filename = `asset_${timestamp}.mp4`;
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            const lastPart = pathParts[pathParts.length - 1] || '';
            if (lastPart && lastPart.includes('.')) {
                filename = lastPart;
            }
        } catch (e) {
            log.warn('Standard filename parsing aborted. Utilizing automatic structural fallback nomenclature.');
        }
        filename = filename
            .replace(/[\u0000-\u001f\u007f]/g, '')
            .replace(/\.{2,}/g, '.')
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/^\.+/, '')
            .slice(0, 150);
        return filename || `asset_${timestamp}.mp4`;
    }

    function executeAutoDownload(url) {
        const filename = buildSafeFilename(url);
        log.info(`Initiating automated stream retrieval for: ${filename}`);

        if (typeof GM_download === 'function') {
            GM_download({
                url: url,
                name: filename,
                saveAs: false,
                onload: () => log.success(`Asset structurally verified and secured: ${filename}`),
                onerror: (err) => log.error(`Download pipeline execution halted: ${err.details || err.error || 'Unknown error'}`)
            });
        } else {
            const host = document.body || document.documentElement;
            if (!host) {
                log.error('No DOM host available for fallback anchor retrieval.');
                return;
            }
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            host.appendChild(a);
            a.click();
            if (a.parentNode) a.parentNode.removeChild(a);
            log.success(`Triggered fallback anchor retrieval: ${filename}`);
        }
    }

    function getOrCreateToastContainer() {
        let container = document.getElementById('psi-interceptor-toasts');
        if (!container) {
            const mountPoint = document.body || document.documentElement;
            if (!mountPoint) return null;
            container = document.createElement('div');
            container.id = 'psi-interceptor-toasts';
            container.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 2147483647;
                pointer-events: none;
                max-width: 460px;
                width: calc(100vw - 20px);
                font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
            `;
            mountPoint.appendChild(container);
        }
        return container;
    }

    function enforceCardLimit(container) {
        const max = Math.max(1, CONFIG.MAX_UI_CARDS);
        while (container.children && container.children.length > max) {
            const oldest = container.firstElementChild || container.children[0];
            if (!oldest || !oldest.parentNode) break;
            oldest.parentNode.removeChild(oldest);
        }
    }

    function mountAssetCard(url) {
        const mount = () => {
            const host = document.body || document.documentElement;
            if (!host) {
                window.addEventListener('DOMContentLoaded', mount, { once: true });
                return;
            }

            const container = getOrCreateToastContainer();
            if (!container) return;

            const card = document.createElement('div');
            /* 3lectric-Glass toast card (spec §4.2 window / §5.0 notification):
             * RGB(10,19,26) glass base, cyan containment border + left rail,
             * 4px panel geometry, 150ms ease-in-out transitions. */
            card.style.cssText = `
                position: relative;
                background: rgba(10, 19, 26, 0.96);
                border: 1px solid rgba(0, 229, 255, 0.4);
                border-left: 3px solid #00E5FF;
                border-radius: 4px;
                padding: 10px 12px;
                font-family: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
                font-size: 12px;
                color: #67E8F9;
                box-shadow: 0 4px 20px rgba(0, 229, 255, 0.25);
                word-break: break-all;
                backdrop-filter: blur(8px) saturate(130%);
                pointer-events: auto;
                opacity: 1;
                transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
            `;

            const title = document.createElement('div');
            title.textContent = 'Ψ STREAM INTERCEPTOR — ASSET DETECTED';
            title.style.cssText = 'font-family:"Orbitron","JetBrains Mono",sans-serif; color:#67E8F9; font-weight:700; font-size:9px; margin-bottom:4px; letter-spacing:2px;';

            const link = document.createElement('a');
            link.href = url;
            link.textContent = url.length > 70 ? url.substring(0, 67) + '...' : url;
            link.style.cssText = 'color:#00E5FF; text-decoration:none; display:block; margin-bottom:8px; font-size:11px;';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const actionRow = document.createElement('div');
            actionRow.style.cssText = 'display:flex; justify-content:flex-end; gap:8px;';

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'COPY URL';
            copyBtn.style.cssText = 'background:#00E5FF; color:#0A131A; border:1px solid #00E5FF; padding:4px 10px; border-radius:0; cursor:pointer; font-weight:bold; font-size:11px; text-transform:uppercase; transition:all 150ms ease-in-out;';
            copyBtn.onmouseover = () => { copyBtn.style.background = '#67E8F9'; copyBtn.style.boxShadow = '0 0 20px rgba(0,229,255,0.5)'; };
            copyBtn.onmouseout = () => { copyBtn.style.background = '#00E5FF'; copyBtn.style.boxShadow = 'none'; };
            copyBtn.onclick = () => copyToClipboard(url, copyBtn);

            const dlBtn = document.createElement('button');
            dlBtn.textContent = 'FORCE DL';
            dlBtn.style.cssText = 'background:rgba(10,19,26,0.65); color:#ff0055; border:1px solid #ff0055; padding:4px 10px; border-radius:0; cursor:pointer; font-weight:bold; font-size:11px; text-transform:uppercase; transition:all 150ms ease-in-out;';
            dlBtn.onmouseover = () => { dlBtn.style.background = 'rgba(255,0,85,0.3)'; dlBtn.style.color = '#ffffff'; dlBtn.style.boxShadow = '0 0 25px #ff0055'; };
            dlBtn.onmouseout = () => { dlBtn.style.background = 'rgba(10,19,26,0.65)'; dlBtn.style.color = '#ff0055'; dlBtn.style.boxShadow = 'none'; };
            dlBtn.onclick = () => { executeAutoDownload(url); dlBtn.textContent = 'INITIATED'; };

            actionRow.append(copyBtn, dlBtn);
            card.append(title, link, actionRow);

            const closeBtn = document.createElement('div');
            closeBtn.textContent = '×';
            closeBtn.title = 'Dismiss';
            closeBtn.style.cssText = 'position:absolute; top:5px; right:8px; color:rgba(0,229,255,0.5); cursor:pointer; font-size:14px; line-height:1; user-select:none; transition:color 150ms ease-in-out;';
            closeBtn.onmouseover = () => { closeBtn.style.color = '#ffffff'; };
            closeBtn.onmouseout = () => { closeBtn.style.color = 'rgba(0,229,255,0.5)'; };
            card.appendChild(closeBtn);

            const dismissCard = () => {
                clearTimeout(dismissTimer);
                card.style.opacity = '0';
                card.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (card.parentNode) card.parentNode.removeChild(card);
                }, 150);
            };
            const dismissTimer = setTimeout(dismissCard, CONFIG.UI_TIMEOUT_MS);
            closeBtn.onclick = dismissCard;

            container.appendChild(card);
            enforceCardLimit(container);
        };
        mount();
    }

    /* =========================================================================
       5. ASSET PIPELINE & DEEP INSPECTION
       ========================================================================= */
    function processDiscoveredAsset(rawUrl, depth) {
        if (typeof depth !== 'number') depth = 0;

        const url = resolveUrl(rawUrl);
        if (!url || foundUrls.has(url)) return;

        foundUrls.add(url);
        // v3.2: bound the registry — unbounded growth on long sessions.
        if (foundUrls.size > CONFIG.MAX_FOUND_URLS) {
            const it = foundUrls.values();
            const drop = it.next().value;
            foundUrls.delete(drop);
        }
        log.success(`Target Asset Profile Registered: ${url.substring(0, 70)}...`);

        if (depth < CONFIG.MAX_REDIRECT_DEPTH) {
            const embedded = extractEmbeddedUrls(url);
            for (let i = 0; i < embedded.length; i++) {
                const innerUrl = embedded[i];
                if (!foundUrls.has(innerUrl) && isTargetMatch(innerUrl)) {
                    processDiscoveredAsset(innerUrl, depth + 1);
                }
            }
        }

        if (CONFIG.AUTO_DOWNLOAD) {
            executeAutoDownload(url);
            return;
        }
        mountAssetCard(url);
    }

    function scanPayloadForUrls(text) {
        const RE = CONFIG.EXTRACTION_REGEX;
        RE.lastIndex = 0;
        try {
            let match;
            while ((match = RE.exec(text)) !== null) {
                const extractedUrl = inspectUrl(match[1]);
                if (isTargetMatch(extractedUrl)) {
                    log.info('Regex structural signature matched in network payload text.');
                    processDiscoveredAsset(extractedUrl);
                }
            }
        } finally {
            RE.lastIndex = 0;
        }
    }

    function decodeUnicodeEscapes(text) {
        if (typeof text !== 'string' || text.indexOf('\\u') === -1) return null;
        try {
            const decoded = text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
            return (decoded !== text) ? decoded : null;
        } catch (e) {
            return null;
        }
    }

    function deepTextInspect(textPayload) {
        if (typeof textPayload !== 'string' || !textPayload) return;
        if (textPayload.length > CONFIG.MAX_INSPECT_PAYLOAD_SIZE) return;

        scanPayloadForUrls(textPayload);

        const unicodeDecoded = decodeUnicodeEscapes(textPayload);
        if (unicodeDecoded) {
            scanPayloadForUrls(unicodeDecoded);
        }

        if (/%(?:2F|3A)/i.test(textPayload)) {
            try {
                const decoded = decodeURIComponent(textPayload);
                if (decoded && decoded !== textPayload) {
                    scanPayloadForUrls(decoded);
                }
            } catch (e) {
                // Malformed percent sequences safely ignored; raw scan already completed
            }
        }
    }

    /* =========================================================================
       6. DOM TRAVERSAL (Shadow DOM Piercing Included)
       ========================================================================= */
    function pierceShadowDOM(rootNode, elements = []) {
        if (!rootNode) return elements;

        // Push matches from current level
        if (typeof rootNode.querySelectorAll === 'function') {
            const matches = rootNode.querySelectorAll('iframe[src], video[src], video source[src], source[src], .jw-video, [data-src], [data-video], [data-file]');
            for (let i = 0; i < matches.length; i++) {
                elements.push(matches[i]);
            }
        }

        // Recursively traverse child nodes and open shadow roots
        const children = rootNode.childNodes || [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.shadowRoot) {
                pierceShadowDOM(child.shadowRoot, elements);
            }
            if (child.nodeType === Node.ELEMENT_NODE) {
                pierceShadowDOM(child, elements);
            }
        }
        return elements;
    }

    function scanStaticDOM() {
        try {
            // Initiate full document traversal, penetrating open shadow-roots
            const elements = pierceShadowDOM(document.body || document.documentElement);

            elements.forEach((el) => {
                const candidates = [
                    el.src,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('src') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-src') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-video') : null,
                    (typeof el.getAttribute === 'function') ? el.getAttribute('data-file') : null,
                    (el.tagName === 'VIDEO' && typeof el.currentSrc === 'string') ? el.currentSrc : null
                ];

                for (let i = 0; i < candidates.length; i++) {
                    const src = inspectUrl(candidates[i]);
                    if (isTargetMatch(src)) {
                        processDiscoveredAsset(src);
                    }
                }
            });
            log.info('Static architectural scan (incl. Shadow DOM) pass complete.');
        } catch (error) {
            log.error('Static DOM traversal processing encountered execution block:', error);
        }
    }

    /* =========================================================================
       7. NETWORK INTERCEPTION — the shared NetHook hub (v3.3.0)
       =========================================================================
       The v3.1/v3.2 dual-realm fetch/XHR Reflect hooks rode their own
       wraps; they now subscribe to the suite's shared NetHook singleton
       (kernel/net.js, build-inlined as __4NDR0_NET_API__): one wrap set
       per realm, shared with every co-installed suite script — the
       stacked-proxy interference the suite's sink census measured is
       gone. Every v3.1 behavior is preserved, expressed as request
       verdicts and structured traffic events instead of local proxies:
       the malformed-SVG request abort (a hub veto — the exchange never
       leaves the page and the caller sees a native-style TypeError, the
       doctrine-consistent form of the v3.1 rejection), fetch-time asset
       discovery, the content-type-gated response deep-inspection, the
       XHR load twin with responseURL-preferred targets, and the
       pass_md5 token capture. */
    const NET_HUB = __4NDR0_NET_API__;   // build-inlined (tools/build.mjs CANON_KERNEL)

    function installNetworkHooks() {
        // Defusal — malformed-SVG requests die at the hub (all three
        // channels: fetch, XHR and beacons; the v3.1 fetch-only gate
        // widens to the same doctrine the rest of the suite runs).
        NET_HUB.onRequest((req) => {
            const absoluteReqUrl = inspectUrl(req.url);
            if (absoluteReqUrl && absoluteReqUrl.includes('image/svg+xml') && !absoluteReqUrl.startsWith('data:')) {
                log.warn('Intercepted and aborted malformed SVG network request.');
                return { veto: true };
            }
            return undefined;
        });

        // Observation — discovery + deep inspection on the structured
        // traffic channel (phase-correlated, every fetch status).
        NET_HUB.onTraffic((ev) => {
            if (ev.phase === 'request') {
                // Fetch-time asset discovery (the XHR twin discovered at
                // load time — response phase below; baseline parity).
                if (ev.kind !== 'fetch') return;
                const absoluteReqUrl = inspectUrl(ev.url);
                if (absoluteReqUrl && isTargetMatch(absoluteReqUrl)) {
                    processDiscoveredAsset(absoluteReqUrl);
                }
                return;
            }
            if (ev.phase !== 'response') return;

            if (ev.kind === 'fetch') {
                // Content-type-gated deep inspection (text/json/javascript
                // only — the v3.1 textual gate, unchanged; SI's own 500 KB
                // inspection cap governs the payload slice).
                const ct = String(ev.contentType || '').toLowerCase();
                if (ct.includes('text') || ct.includes('json') || ct.includes('javascript')) {
                    if (typeof ev.body === 'string' && ev.body) {
                        deepTextInspect(ev.body.slice(0, CONFIG.MAX_INSPECT_PAYLOAD_SIZE));
                    }
                }
                return;
            }

            // XHR load twin — responseURL-preferred target match, the
            // pass_md5 token capture, and the text-gated deep inspect
            // (the v3.1 handleXhrLoad surface, event-for-event).
            const effectiveUrl = inspectUrl(ev.url);
            if (isTargetMatch(effectiveUrl)) {
                processDiscoveredAsset(effectiveUrl);
            }
            if (typeof effectiveUrl === 'string' && effectiveUrl.includes('/pass_md5/') &&
                (!ev.responseType || ev.responseType === 'text') &&
                typeof ev.body === 'string' && ev.body) {
                const token = ev.body.trim();
                log.info(`pass_md5 token payload captured (${token.length} chars): ${token.substring(0, 40)}`);
            }
            const isTextType = !ev.responseType || ev.responseType === 'text';
            if (isTextType && typeof ev.body === 'string' && ev.body) {
                deepTextInspect(ev.body.slice(0, CONFIG.MAX_INSPECT_PAYLOAD_SIZE));
            }
        });

        // Dual-realm parity: the v3.1 hooks wrapped the page window AND
        // the userscript sandbox window; the hub owns the page realm and
        // is propagated into the sandbox realm here (guarded, idempotent).
        if (isSandboxed) {
            NET_HUB.propagate(window);
        }
        log.info(`NetHub interception layer installed (shared NetHook; ${isSandboxed ? 'page + sandbox realms' : 'page realm'}).`);
    }


    /* =========================================================================
       8. EVENT OBSERVERS & LIFECYCLE
       ========================================================================= */
    function sanitizeNode(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;

        try {
            if (typeof node.hasAttribute === 'function' && node.hasAttribute('src')) {
                const currentSrc = node.getAttribute('src');
                if (typeof currentSrc === 'string' && currentSrc.startsWith('image/svg+xml')) {
                    node.setAttribute('src', 'data:' + currentSrc);
                    log.info('Sanitized malformed SVG src attribute on element.');
                }
            }
            if (typeof node.querySelectorAll === 'function') {
                const malformedChildren = node.querySelectorAll('[src^="image/svg+xml"]');
                Array.prototype.forEach.call(malformedChildren, (child) => {
                    const childSrc = (typeof child.getAttribute === 'function') ? child.getAttribute('src') : null;
                    if (typeof childSrc === 'string' && childSrc.startsWith('image/svg+xml')) {
                        child.setAttribute('src', 'data:' + childSrc);
                        log.info('Sanitized malformed descendant SVG src attribute.');
                    }
                });
            }
        } catch (e) {
            log.warn('SVG sanitization pass bypassed for one node: ' + e.message);
        }
    }

    function initSanitizationObserver() {
        try {
            const root = document.documentElement;
            if (!root) {
                document.addEventListener('DOMContentLoaded', initSanitizationObserver, { once: true });
                return;
            }
            const sanitizationObserver = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(sanitizeNode);
                    } else if (mutation.type === 'attributes' && mutation.target) {
                        sanitizeNode(mutation.target);
                    }
                }
            });
            sanitizationObserver.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src']
            });
        } catch (e) {
            log.warn('Early sanitization initialization bypassed: ' + e.message);
        }
    }

    function initDynamicObserver() {
        if (!CONFIG.ENABLE_OBSERVER) return;

        const target = document.body || document.documentElement;
        if (!target) {
            document.addEventListener('DOMContentLoaded', initDynamicObserver, { once: true });
            return;
        }

        const debouncedScan = debounce(scanStaticDOM, CONFIG.OBSERVER_DEBOUNCE_MS);
        const observer = new MutationObserver((mutations) => {
            const hasNewElements = mutations.some((m) =>
                Array.from(m.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE)
            );
            const srcMutated = mutations.some((m) => m.type === 'attributes');

            if (hasNewElements || srcMutated) {
                debouncedScan();
            }
        });

        observer.observe(target, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'data-video', 'data-file']
        });
        log.info('Dynamic DOM layout interaction mutation tracker registered and running.');
    }

    function copyAllDiscoveredUrls() {
        const list = Array.from(foundUrls);
        if (list.length === 0) {
            log.warn('No discovered assets to export yet — wait for network activity or re-scan the DOM.');
            return;
        }
        writeClipboard(list.join('\n')).then((ok) => {
            if (ok) {
                log.success(`Exported ${list.length} discovered asset URL(s) to clipboard.`);
            } else {
                log.error('Clipboard export failed for discovered asset list.');
            }
        });
    }

    function registerMenuCommands() {
        let register = null;
        if (typeof GM_registerMenuCommand === 'function') {
            register = GM_registerMenuCommand;
        } else if (typeof GM !== 'undefined' && GM && typeof GM.registerMenuCommand === 'function') {
            register = GM.registerMenuCommand.bind(GM);
        }
        if (!register) return;

        try {
            register('\u03A8: Copy all discovered URLs', copyAllDiscoveredUrls);
            register('\u03A8: Re-scan DOM for media assets', () => scanStaticDOM());
            register('\u03A8: Toggle AUTO_DOWNLOAD', () => {
                CONFIG.AUTO_DOWNLOAD = !CONFIG.AUTO_DOWNLOAD;
                log.success(`AUTO_DOWNLOAD is now ${CONFIG.AUTO_DOWNLOAD ? 'ENABLED' : 'DISABLED'}.`);
            });
            register('\u03A8: Toggle DEBUG_MODE', () => {
                CONFIG.DEBUG_MODE = !CONFIG.DEBUG_MODE;
                log.success(`DEBUG_MODE is now ${CONFIG.DEBUG_MODE ? 'ENABLED' : 'DISABLED'}.`);
            });
        } catch (e) {
            log.warn('Menu command registration bypassed: ' + e.message);
        }
    }

    function boot() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                log.info('DOM loaded. Triggering baseline sector query deployment operations.');
                scanStaticDOM();
                initDynamicObserver();
            }, { once: true });
        } else {
            log.info('DOM already loaded. Triggering baseline sector query deployment operations.');
            scanStaticDOM();
            initDynamicObserver();
        }
    }

    // Initialize Network Hooks & Lifecycle (the hub owns the page realm;
    // the sandbox realm is propagated inside when sandboxed)
    installNetworkHooks();

    initSanitizationObserver();
    registerMenuCommands();
    boot();

    log.info('Ψ Stream Interceptor v3.2.0 — CORE INJECTED & VERIFIED (4ndr0tools suite)');
})();
