// noinspection SpellCheckingInspection,JSUnresolvedVariable,JSUnresolvedFunction,TypeScriptUMDGlobal,JSUnusedGlobalSymbols
// ==UserScript==
// @name        4ndr0tools - Forums++
// @namespace    https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.10.0
// @description Forum utils UI with powerful downloading, indexing, link checking, archiving features and more.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match       https://simpcity.su/threads/*
// @match       https://simpcity.cr/threads/*
// @require     https://unpkg.com/@popperjs/core@2
// @require     https://unpkg.com/tippy.js@6
// @require     https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require     https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @connect self
// @connect coomer.su
// @connect kemono.su
// @connect github.com
// @connect big-taco-1img.bunkr.ru
// @connect i-pizza.bunkr.ru
// @connect bunkr.ac
// @connect bunkr.ax
// @connect bunkr.black
// @connect bunkr.cat
// @connect bunkr.ci
// @connect bunkr.cr
// @connect bunkr.fi
// @connect bunkr.is
// @connect bunkr.media
// @connect bunkr.nu
// @connect bunkr.red
// @connect bunkr.ru
// @connect bunkr.se
// @connect bunkr.si
// @connect bunkr.site
// @connect bunkr.pk
// @connect bunkr.ph
// @connect bunkr.ps
// @connect bunkr.sk
// @connect bunkr.ws
// @connect bunkrr.ru
// @connect bunkrr.su
// @connect bunkrrr.org
// @connect bunkr-cache.se
// @connect mlk-bk.cdn.gigachad-cdn.ru
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.ch
// @connect cyberdrop.cloud
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect cyberfile.su
// @connect cyberfile.me
// @connect saint2.su
// @connect saint2.pk
// @connect saint2.cr
// @connect redd.it
// @connect i.ibb.co
// @connect ibb.co
// @connect imagebam.com
// @connect jpg.fish
// @connect jpg.fishing
// @connect jpg.pet
// @connect jpeg.pet
// @connect jpg1.su
// @connect jpg2.su
// @connect jpg3.su
// @connect jpg4.su
// @connect jpg5.su
// @connect jpg6.su
// @connect selti-delivery.ru
// @connect imgbox.com
// @connect pixhost.to
// @connect pornhub.com
// @connect postimg.cc
// @connect imgvb.com
// @connect pixxxels.cc
// @connect postimg.cc
// @connect imagevenue.com
// @connect pbs.twimg.com
// @connect media.tumblr.com
// @connect pixeldrain.com
// @connect redgifs.com
// @connect noodlemagazine.com
// @connect pvvstream.pro
// @connect spankbang.com
// @connect sb-cd.com
// @connect gofile.io
// @connect phncdn.com
// @connect xvideos.com
// @connect githubusercontent.com
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_log
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Forums++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Forums++.user.js
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

// 1.9.2 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Forums++.user v1.9.2 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px;');

/* global JSZip, tippy, GM_xmlhttpRequest, saveAs, sha256, GM_download, GM_getValue, GM_setValue */

const JSZipGlobal = window.JSZip;
const tippyGlobal = window.tippy;
const http = window.GM_xmlhttpRequest;
window.isFF = typeof InstallTrigger !== 'undefined';
window.logs = [];

const log = {
    /**
     * @param {string} postId
     * @returns {number}
     */
    separator: postId => window.logs.push({ postId, message: '-'.repeat(175) }),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} type
     * @param {boolean} [toConsole=true]
     */
    write: (postId, str, type, toConsole = true) => {
        const date = new Date();
        const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
            .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
            .replace(/::/g, '');
        window.logs.push({ postId, message });
        if (toConsole) {
            const lowerType = type.toLowerCase();
            if (lowerType === 'info') {
                console.info(message);
            } else if (lowerType === 'warn') {
                console.warn(message);
            } else {
                console.error(message);
            }
        }
    },
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'INFO'),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'WARNING'),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'ERROR'),
    post: {
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} postNumber
         * @returns {void}
         */
        info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} postNumber
         * @returns {void}
         */
        error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`),
    },
    host: {
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} host
         * @returns {void}
         */
        info: (postId, str, host) => log.info(postId, str, host),
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} host
         * @returns {void}
         */
        error: (postId, str, host) => log.error(postId, str, host),
    },
};

const settings = {
    naming: {
        allowEmojis: false,
        invalidCharSubstitute: '-',
    },
    hosts: {
        goFile: {
            token: 'KPQJgKlYsy8JPmbuxj3MC4e5PFEpdZYP',
        },
    },
    ui: {
        checkboxes: {
            toggleAllCheckboxLabel: '',
        },
    },
    extensions: {
        documents: ['.txt', '.doc', '.docx', '.pdf'],
        compressed: ['.zip', '.rar', '.7z', '.tar', '.bz2', '.gzip'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jpe', '.svg', '.tif', '.tiff', '.jif'],
        video: [
            '.mpeg',
            '.avchd',
            '.webm',
            '.mpv',
            '.swf',
            '.avi',
            '.m4p',
            '.wmv',
            '.mp2',
            '.m4v',
            '.qt',
            '.mpe',
            '.mp4',
            '.flv',
            '.mov',
            '.mpg',
            '.ogg',
        ],
    },
    // Page caching specific settings
    caching: {
        maxPagesToCache: 10, // Total pages around the current page (e.g., 5 prev + current + 4 next = 10)
    }
};

const h = {
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isArray: v => Array.isArray(v),
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isObject: v => typeof v === 'object' && v !== null,
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isNullOrUndef: v => v === null || typeof v === 'undefined',
    /**
     * @param {string} path
     * @returns {string}
     */
    basename: path => path.replace(/\/(\s+)?$/, '').split('/').pop() ?? '',
    /**
     * @param {string} path
     * @returns {string}
     */
    fnNoExt: path => {
        const parts = path.trim().split('.');
        parts.pop(); // Remove extension
        return parts.join('.');
    },
    /**
     * @param {string} path
     * @returns {string|null}
     */
    ext: path => {
        if (!path || !path.includes('.')) return null;
        return path.split('.').pop()?.toLowerCase() ?? null;
    },
    /**
     * @param {HTMLElement} element
     * @returns {void}
     */
    show: element => (element.style.display = 'block'),
    /**
     * @param {HTMLElement} element
     * @returns {void}
     */
    hide: element => (element.style.display = 'none'),
    /**
     * @template T
     * @param {(resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void} executor
     * @returns {Promise<T>}
     */
    promise: executor => new Promise(executor),
    /**
     * @param {number} ms
     * @returns {Promise<void>}
     */
    delayedResolve: async ms => await h.promise(resolve => setTimeout(resolve, ms)),
    /**
     * @param {string} tag
     * @param {string} content
     * @returns {string}
     */
    stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?<\/${tag}>`, 'igs'), ''),
    /**
     * @param {string[]} tags
     * @param {string} content
     * @returns {string}
     */
    stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
    /**
     * @param {string} string
     * @param {number} [maxLength=20]
     * @returns {string}
     */
    limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
    /**
     * @param {string} selector
     * @param {ParentNode} [container=document]
     * @returns {Element|null}
     */
    element: (selector, container = document) => container.querySelector(selector),
    /**
     * @param {string} selector
     * @param {ParentNode} [container=document]
     * @returns {NodeListOf<Element>}
     */
    elements: (selector, container = document) => container.querySelectorAll(selector),
    /**
     * @param {string} needle
     * @param {string} haystack
     * @param {boolean} [ignoreCase=true]
     * @returns {boolean}
     */
    contains: (needle, haystack, ignoreCase = true) =>
        (ignoreCase ? haystack.toLowerCase().includes(needle.toLowerCase()) : haystack.includes(needle)),
    /**
     * @param {string} str
     * @returns {string}
     */
    ucFirst: str => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
    /**
     * @template T
     * @param {T[]} items
     * @param {function(T): string} [cb]
     * @returns {T[]}
     */
    unique: (items, cb) => {
        if (cb) {
            const seen = new Set();
            return items.filter(item => {
                const key = cb(item);
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        }
        return [...new Set(items)];
    },
    /**
     * @param {number} number
     * @param {object} [options={}]
     * @returns {string}
     */
    prettyBytes: (number, options = {}) => {
        const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const BIBYTE_UNITS = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const BIT_UNITS = ['b', 'kbit', 'Mbit', 'Gbit', 'Tbit', 'Pbit', 'Ebit', 'Zbit', 'Ybit'];
        const BIBIT_UNITS = ['b', 'kibit', 'Mibit', 'Gibit', 'Tibit', 'Pibit', 'Eibit', 'Zibit', 'Yibit'];

        const toLocaleString = (num, locale, opts) => {
            let result = num;
            if (typeof locale === 'string' || h.isArray(locale)) {
                result = num.toLocaleString(locale, opts);
            } else if (locale === true || opts !== undefined) {
                result = num.toLocaleString(undefined, opts);
            }
            return result;
        };

        if (!Number.isFinite(number)) {
            throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
        }

        options = {
            bits: false,
            binary: false,
            space: true,
            ...options,
        };

        const UNITS = options.bits ? (options.binary ? BIBIT_UNITS : BIT_UNITS) : options.binary ? BIBYTE_UNITS : BYTE_UNITS;
        const separator = options.space ? ' ' : '';

        if (options.signed && number === 0) {
            return ` 0${separator}${UNITS[0]}`;
        }

        const isNegative = number < 0;
        const prefix = isNegative ? '-' : options.signed ? '+' : '';

        if (isNegative) {
            number = -number;
        }

        let localeOptions;
        if (options.minimumFractionDigits !== undefined) {
            localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
        }
        if (options.maximumFractionDigits !== undefined) {
            localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
        }

        if (number < 1) {
            const numberString = toLocaleString(number, options.locale, localeOptions);
            return prefix + numberString + separator + UNITS[0];
        }

        const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
        number /= (options.binary ? 1024 : 1000) ** exponent;

        if (!localeOptions) {
            number = Number(number.toPrecision(3));
        }

        const numberString = toLocaleString(number, options.locale, localeOptions);
        const unit = UNITS[exponent];
        return prefix + numberString + separator + unit;
    },
    ui: {
        /**
         * @param {HTMLElement} element
         * @param {string} text
         */
        setText: (element, text) => {
            element.textContent = text;
        },
        /**
         * @param {HTMLElement} element
         * @param {CSSStyleDeclaration} props
         */
        setElProps: (element, props) => {
            for (const prop in props) {
                if (Object.prototype.hasOwnProperty.call(props, prop)) {
                    element.style[prop] = props[prop];
                }
            }
        },
    },
    http: {
        /**
         * @param {string} method
         * @param {string} url
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {*} [data=null]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<{source: string, request: XMLHttpRequest, status: number, dom: Document, responseHeaders: string}>}
         */
        base: (method, url, callbacks = {}, headers = {}, data = null, responseType = 'document') => {
            return new Promise((resolve, reject) => {
                let responseHeaders = null;
                let request = null;
                request = http({
                    method,
                    url,
                    responseType,
                    data,
                    // v1.10.0: hard 20 s bound — the document transport used
                    // to be unbounded (a stalled host hung the resolver).
                    timeout: 20000,
                    headers: { Referer: url, ...headers },
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            responseHeaders = response.responseHeaders;
                            if (callbacks?.onResponseHeadersReceieved) {
                                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });
                                if (request) {
                                    request.abort();
                                    resolve({ request, response, status: response.status, responseHeaders });
                                }
                            }
                        }
                        callbacks?.onStateChange?.({ request, response });
                    },
                    onprogress: response => callbacks?.onProgress?.({ request, response }),
                    onload: response => {
                        const { responseText, status } = response;
                        const dom = response?.response;
                        callbacks?.onLoad?.(response);
                        resolve({ source: responseText, request, status, dom, responseHeaders });
                    },
                    onerror: error => {
                        callbacks?.onError?.(error);
                        reject(error);
                    },
                    ontimeout: () => reject(new Error('Request timed out (20s)')),
                });
            });
        },
        /**
         * @param {string} url
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<object>}
         */
        get: (url, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.http.base('GET', url, callbacks, headers, null, responseType);
        },
        /**
         * @param {string} url
         * @param {*} [data={}]
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<object>}
         */
        post: (url, data = {}, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.http.base('POST', url, callbacks, headers, data, responseType);
        },
    },
    re: {
        /**
         * @param {RegExp} pattern
         * @returns {string}
         */
        stripFlags: pattern => pattern.toString().replace(/^\/|\/[a-z]*$/g, ''),
        /**
         * @param {RegExp} pattern
         * @returns {string}
         */
        toString: pattern => h.re.stripFlags(pattern.toString()),
        /**
         * @param {string} pattern
         * @param {string} flags
         * @returns {RegExp}
         */
        toRegExp: (pattern, flags) => new RegExp(pattern, flags),
        /**
         * @param {RegExp} pattern
         * @param {string} subject
         * @returns {string|null}
         */
        match: (pattern, subject) => {
            const matches = pattern.exec(subject);
            return matches?.[0] ?? null;
        },
        /**
         * @param {RegExp} pattern
         * @param {string} subject
         * @returns {string[]}
         */
        matchAll: (pattern, subject) => {
            const matches = [];
            let m;
            // Ensure global flag for matchAll-like behavior
            const regex = new RegExp(pattern.source, 'g' + (pattern.flags?.replace('g', '') || ''));
            while ((m = regex.exec(subject)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                matches.push(m[0]);
            }
            return matches;
        },
    },
};

// Extend Array prototype for convenience
Array.prototype.unique = function (cb) {
    return h.unique(this, cb);
};

const parsers = {
    thread: {
        /**
         * @returns {string}
         */
        parseTitle: () => {
            const emojisPattern =
                  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
            let parsed = h.stripTags(['a', 'span'], h.element('.p-title-value')?.innerHTML ?? '').replace(/\n/g, '');
            return !settings.naming.allowEmojis ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim() : parsed.trim();
        },
        /**
         *
         * @param {HTMLElement} postEl
         * @returns {object}
         */
        parsePost: postEl => {
            const messageContent = postEl.parentNode.parentNode.querySelector('.message-content > .message-userContent');
            const footer = postEl.parentNode.parentNode.querySelector('footer');
            const messageContentClone = messageContent?.cloneNode(true);

            const postIdAnchor = postEl.querySelector('li:last-of-type > a');
            const postId = /(?<=\/post-).*/i.exec(postIdAnchor?.getAttribute('href') ?? '')?.[0] ?? '';
            const postNumber = postIdAnchor?.textContent.replace('#', '').trim() ?? '';

            // Remove elements not relevant for content extraction or that cause issues.
            ['.contentRow-figure', '.js-unfurl-favicon', 'blockquote', '.button-text > span']
                .flatMap(selector => [...(messageContentClone?.querySelectorAll(selector) ?? [])])
                .forEach(el => {
                if (el.tagName === 'BLOCKQUOTE') {
                    // Only remove blockquotes that quote other posts.
                    if (el.querySelector('.bbCodeBlock-title')) {
                        el.remove();
                    }
                } else {
                    el.remove();
                }
            });

            // Remove thread links/unfurled content. (v1.9: host-agnostic
            // selector — the simpcity.cr mirror is matched too, not just .su.)
            [...(messageContentClone?.querySelectorAll('.contentRow-header > a[href*="/threads"]') ?? [])]
                .map(a => a.closest('.bbCodeBlock--unfurl'))
                .forEach(el => el?.remove());

            // Extract spoilers from the post content.
            const spoilers = [...(messageContentClone?.querySelectorAll('.bbCodeBlock--spoiler > .bbCodeBlock-content, .bbCodeInlineSpoiler') ?? [])]
                .filter(s => !s.querySelector('.bbCodeBlock--unfurl')) // Ensure not to parse unfurled content as spoiler
                .map(s => s.innerText)
                .concat(
                    h.re
                    .matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?\/,;.]+/gis, messageContentClone?.innerText ?? '')
                    .map(s => s.trim()),
                )
                .map(s =>
                     s
                     .trim()
                     .replace(/^:/, '')
                     .replace(/\bp:\b/i, '')
                     .replace(/\bpw:\b/i, '')
                     .replace(/\bkey:\b/i, '')
                     .trim(),
                )
                .filter(s => s !== '')
                .unique();

            const postContent = messageContentClone?.innerHTML ?? '';
            const postTextContent = messageContentClone?.innerText ?? '';

            const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);
            const pageNumber = matches?.[0] ? Number(matches[0]) : 1;

            return {
                post: postEl, // Keep reference to original DOM element if needed later
                postId,
                postNumber,
                pageNumber,
                spoilers,
                footer,
                content: postContent,
                textContent: postTextContent,
                contentContainer: messageContent,
            };
        },
    },
    hosts: {
        /**
         * @param {string} postContent
         * @returns {Array<object>}
         */
        parseHosts: postContent => {
            const parsed = [];

            for (const host of hosts) {
                if (host.length < 2) continue; // Require at-least the signature plus an array of matchers.

                const [name, category = 'misc'] = host[0].split(':');
                const [singleMatcherPattern, albumMatcherPattern] = host[1];

                const execMatcher = matcher => {
                    if (!matcher) return [];

                    let patternStr = matcher.toString();

                    const stripQueryString = h.contains('<no_qs>', patternStr);
                    const stripTrailingSlash = !h.contains('<keep_ts>', patternStr);
                    // Replace placeholders and options
                    patternStr = patternStr.replace(/<no_qs>|<keep_ts>|~an@/g, (match) => match === '~an@' ? '[a-zA-Z0-9]' : '');

                    let pattern;
                    if (h.contains('!!', patternStr)) { // Custom pattern override
                        patternStr = patternStr.replace('!!', '');
                        pattern = h.re.toRegExp(h.re.toString(patternStr), 'igs');
                    } else { // Default pattern for href, src, data-url attributes or direct URLs
                        const pat = `(?<=data-url="|src="|href=")${h.re.toString(patternStr)}.*?(?=")|https?:\/\/(www.)?${h.re.toString(patternStr)}.*?(?=("|<|$|\\]|'))`;
                        pattern = h.re.toRegExp(pat, 'igs');
                    }

                    let matches = h.re.matchAll(pattern, postContent).unique();

                    matches = matches.map(url => {
                        let processedUrl = url.trim();
                        if (stripQueryString && processedUrl.includes('?')) {
                            processedUrl = processedUrl.substring(0, processedUrl.indexOf('?'));
                        }
                        if (stripTrailingSlash && processedUrl.endsWith('/')) {
                            processedUrl = processedUrl.slice(0, -1);
                        }
                        return processedUrl;
                    });

                    return h.unique(matches);
                };

                const categories = category.split(',');

                if (singleMatcherPattern) {
                    const singleCategory = categories[0];
                    const formattedCategory = ['image', 'video'].includes(singleCategory) ? `${h.ucFirst(singleCategory)}s` : (singleCategory.trim() ? h.ucFirst(singleCategory) : 'Links');

                    parsed.push({
                        name,
                        type: 'single',
                        category: formattedCategory,
                        resources: execMatcher(singleMatcherPattern),
                    });
                }

                if (albumMatcherPattern) {
                    const albumCategory = categories.length > 1 ? categories[1] : categories[0];
                    parsed.push({
                        name,
                        type: 'album',
                        category: `${h.ucFirst(albumCategory)} Albums`,
                        resources: execMatcher(albumMatcherPattern),
                    });
                }
            }

            return parsed
                .map(p => ({
                    ...p,
                    enabled: true,
                    id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER), // Unique ID for checkbox
                }))
                .filter(p => p.resources.length); // Only include hosts that found resources
        },
    },
};

const styles = {
    tippy: {
        theme: `.tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:1 7px 7px;border-bottom-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:#67E8F9}`,
    },
};

const ui = {
    /**
     * @returns {string}
     */
    getTooltipBackgroundColor: () => {
        // Determine theme based on a unique class/ID found in the body for purple vs classic
        return document.body.innerHTML.includes('__&s=11') ? 'rgba(10,19,26,0.85)' : 'rgba(10,19,26,0.85)';
    },
    /**
     * @param {HTMLElement|string} target
     * @param {string} content
     * @param {object} [options={}]
     * @returns {any} Tippy.js instance
     */
    tooltip: (target, content, options = {}) => {
        return tippyGlobal(target, {
            arrow: true,
            theme: 'transparent',
            allowHTML: true, // Be cautious with HTML from untrusted sources
            content: content,
            appendTo: () => document.body,
            placement: 'left',
            interactive: true,
            ...options,
        });
    },
    pBars: {
        /**
         * @param {string} color
         * @param {string} [height='3px']
         * @param {string} [width='0%']
         * @returns {HTMLDivElement}
         */
        base: (color, height = '3px', width = '0%') => {
            const pb = document.createElement('div');
            pb.style.height = height;
            pb.style.background = color;
            pb.style.width = width;
            return pb;
        },
        /**
         * @param {string} [color='#00E5FF']
         * @returns {HTMLDivElement}
         */
        createFileProgressBar: (color = '#00E5FF') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '1px';
            return pb;
        },
        /**
         * @param {string} [color='#67E8F9']
         * @returns {HTMLDivElement}
         */
        createTotalProgressBar: (color = '#67E8F9') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '10px';
            return pb;
        },
    },
    labels: {
        /**
         * @param {string|null} [initialText=null]
         * @param {string} [color='rgba(0,229,255,0.7)']
         * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
         */
        createBlockLabel: (initialText = null, color = 'rgba(0,229,255,0.7)') => {
            const container = document.createElement('div');
            container.style.color = color;
            container.style.fontSize = '12px';

            const span = document.createElement('span');
            container.appendChild(span);

            if (initialText) {
                span.textContent = initialText;
            }

            return {
                el: span,
                container,
            };
        },
        status: {
            /**
             * @param {string} [initialText='']
             * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
             */
            createStatusLabel: (initialText = '') => {
                const label = ui.labels.createBlockLabel(initialText);
                label.el.style.marginBottom = '3px';

                return label;
            },
        },
    },
    buttons: {
        /**
         * @returns {HTMLAnchorElement}
         */
        createPostDownloadButton: () => {
            const downloadPostBtn = document.createElement('a');
            downloadPostBtn.setAttribute('href', '#');
            downloadPostBtn.textContent = '🡳 Download';

            return downloadPostBtn;
        },
        /**
         * @returns {HTMLLIElement}
         */
        createPostDownloadButtonContainer: () => {
            return document.createElement('li');
        },
        /**
         * @param {HTMLElement} post
         * @returns {{container: HTMLLIElement, btn: HTMLAnchorElement}}
         */
        addDownloadPostButton: post => {
            const btnDownloadPostContainer = ui.buttons.createPostDownloadButtonContainer();
            const btnDownloadPost = ui.buttons.createPostDownloadButton();
            btnDownloadPostContainer.appendChild(btnDownloadPost);
            post.prepend(btnDownloadPostContainer);

            return {
                container: btnDownloadPostContainer,
                btn: btnDownloadPost,
            };
        },
    },
    forms: {
        /**
         * @param {string} id
         * @param {string} label
         * @param {boolean} checked
         * @returns {string}
         */
        createCheckbox: (id, label, checked) => {
            return `
                <div class="menu-row" style="margin-top: -5px;">
                    <label class="iconic" style="user-select: none">
                        <input type="checkbox" ${checked ? 'checked="checked"' : ''} id="${id}" />
                        <i aria-hidden="true"></i>
                        <span class="iconic-label" style="font-weight: bold; margin-left: -7px">
                            <span id="${id}-label">${label}</span>
                        </span>
                    </label>
                </div>
            `;
        },
        /**
         * @param {string} content
         * @returns {string}
         */
        createRow: content => {
            return `
                <div class="menu-row">
                    ${content}
                </div>
            `;
        },
        /**
         * @param {string} label
         * @returns {string}
         */
        createLabel: label => {
            return `
                <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #00E5FF;">
                    ${label}
                </div>
            `;
        },
        config: {
            page: {
                /**
                 * @param {string} backgroundColor
                 * @param {string} innerHTML
                 * @returns {string}
                 */
                createForm: (backgroundColor, innerHTML) => {
                    return `
                        <form
                            id="downloader-page-config-form"
                            class="menu-content"
                            style="padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
                        >
                            ${innerHTML}
                        </form>
                    `;
                },
            },
            post: {
                /**
                 * @param {string} postId
                 * @param {string} backgroundColor
                 * @param {string} innerHTML
                 * @returns {string}
                 */
                createForm: (postId, backgroundColor, innerHTML) => {
                    return `
                        <form
                            id="download-config-form-${postId}"
                            class="menu-content"
                            style="user-select: none; padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
                        >
                            ${innerHTML}
                        </form>
                    `;
                },
                /**
                 * @param {string} currentValue
                 * @param {string} postId
                 * @param {string} backgroundColor
                 * @param {string} placeholder
                 * @returns {string}
                 */
                createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => {
                    return `
                        <div class="menu-row">
                            <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #00E5FF;">
                                File / Archive Name
                            </div>
                            <input
                                id="filename-input-${postId}"
                                type="text"
                                style="background: ${backgroundColor};"
                                class="archive-name input"
                                autocomplete="off"
                                name="keywords"
                                placeholder="${placeholder}"
                                aria-label="Search"
                                value="${currentValue}"
                            />
                        </div>
                    `;
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createZippedCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-zipped`, 'Zipped', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createFlattenCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-flatten`, 'Flatten', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createSkipDownloadCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-download`, 'Skip Download', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createVerifyBunkrLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, 'Verify Bunkr Links', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createGenerateLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-links`, 'Generate Links', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createGenerateLogCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-log`, 'Generate Log', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createSkipDuplicatesCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, 'Skip Duplicates', checked);
                },
                /**
                 * @param {Array<object>} hosts
                 * @param {function(Array<object>): number} getTotalDownloadableResourcesCB
                 * @returns {string}
                 */
                createFilterLabel: (hosts, getTotalDownloadableResourcesCB) => {
                    return `
                        <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; margin-left: 8px; color: #00E5FF;">Filter <span id="filtered-count">(${getTotalDownloadableResourcesCB(
                        hosts,
                    )})</span></div>
                    `;
                },
                /**
                 * @param {string} postId
                 * @returns {string}
                 */
                createToggleAllCheckbox: postId => {
                    return ui.forms.createCheckbox(`settings-toggle-all-hosts-${postId}`, settings.ui.checkboxes.toggleAllCheckboxLabel, true);
                },
                /**
                 * @param {string} postId
                 * @param {object} host
                 * @returns {string}
                 */
                createHostCheckbox: (postId, host) => {
                    const title = `${host.name} ${host.category}`;
                    return ui.forms.createCheckbox(`downloader-host-${host.id}-${postId}`, `${title} (${host.resources.length})`, host.enabled);
                },
                /**
                 * @param {string} postId
                 * @param {string} filterLabel
                 * @param {string} hostsHtml
                 * @param {boolean} createToggleAllCheckbox
                 * @returns {string}
                 */
                createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAllCheckbox) => {
                    return `
                        <div>
                            ${filterLabel}
                            ${createToggleAllCheckbox ? ui.forms.config.post.createToggleAllCheckbox(postId) : ''}
                            ${hostsHtml}
                        </div>
                    `;
                },
                /**
                 * @param {object} parsedPost
                 * @param {Array<object>} parsedHosts
                 * @param {string} defaultFilename
                 * @param {object} currentSettings
                 * @param {function(object): void} onSubmitFormCB
                 * @param {function(Array<object>): number} totalDownloadableResourcesForPostCB
                 * @param {HTMLAnchorElement} btnDownloadPost
                 */
                createPostConfigForm: (
                    parsedPost,
                    parsedHosts,
                    defaultFilename,
                    currentSettings,
                    onSubmitFormCB,
                    totalDownloadableResourcesForPostCB,
                    btnDownloadPost,
                ) => {
                    const { postId } = parsedPost;
                    const color = ui.getTooltipBackgroundColor();

                    const customFilename = currentSettings.output.find(o => o.postId === postId)?.value || '';

                    let hostsHtml = '<div>';
                    parsedHosts.forEach(host => (hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host)));
                    hostsHtml += '</div>';

                    const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB);

                    const settingsHeading = `
                        <div class="menu-row">
                            <div style="font-weight: bold; margin-top:3px; margin-bottom: 4px; color: #00E5FF;">
                                Settings
                            </div>
                        </div>
                    `;

                    // Filter out nulls for FF compatibility and settings toggles
                    const formHtml = [
                        window.isFF ? ui.forms.config.post.createFilenameInput(customFilename, postId, color, defaultFilename) : null,
                        settingsHeading,
                        !window.isFF ? ui.forms.config.post.createZippedCheckbox(postId, currentSettings.zipped) : null,
                        ui.forms.config.post.createFlattenCheckbox(postId, currentSettings.flatten),
                        ui.forms.config.post.createSkipDuplicatesCheckbox(postId, currentSettings.skipDuplicates),
                        ui.forms.config.post.createGenerateLinksCheckbox(postId, currentSettings.generateLinks),
                        ui.forms.config.post.createGenerateLogCheckbox(postId, currentSettings.generateLog),
                        ui.forms.config.post.createSkipDownloadCheckbox(postId, currentSettings.skipDownload),
                        ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, currentSettings.verifyBunkrLinks),
                        ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
                        ui.forms.createRow(
                            '<a href="#download-page" style="color: #00E5FF; font-weight: bold"><i class="fa fa-arrow-up"></i> Show Download Page Button</a>',
                        ),
                    ].filter(c => c !== null).join('');

                    const configForm = ui.forms.config.post.createForm(postId, color, formHtml);

                    ui.tooltip(btnDownloadPost, configForm, {
                        onShown: instance => {
                            const inputEl = h.element(`#filename-input-${postId}`);
                            if (inputEl) {
                                inputEl.addEventListener('input', e => {
                                    const value = e.target.value;
                                    const o = currentSettings.output.find(o => o.postId === postId);
                                    if (o) {
                                        o.value = value;
                                    } else {
                                        currentSettings.output.push({
                                            postId,
                                            value,
                                        });
                                    }
                                });
                            }

                            let prevSettings = JSON.parse(JSON.stringify(currentSettings));

                            const setPrevSettings = settingsToSet => {
                                prevSettings = JSON.parse(JSON.stringify(settingsToSet));
                            };

                            let updateSettings = true;

                            // Event listener for "Skip Download" checkbox
                            h.element(`#settings-${postId}-skip-download`)?.addEventListener('change', e => {
                                const checked = e.target.checked;
                                currentSettings.skipDownload = checked;

                                // Adjust dependent settings
                                currentSettings.flatten = checked ? false : prevSettings.flatten;
                                currentSettings.skipDuplicates = checked ? false : prevSettings.skipDuplicates;
                                currentSettings.generateLinks = checked ? true : prevSettings.generateLinks;

                                updateSettings = false; // Prevent immediate update of prevSettings for cascading changes

                                const flattenEl = h.element(`#settings-${postId}-flatten`);
                                if (flattenEl) {
                                    flattenEl.checked = currentSettings.flatten;
                                    flattenEl.disabled = checked;
                                }

                                const skipDuplicatesEl = h.element(`#settings-${postId}-skip-duplicates`);
                                if (skipDuplicatesEl) {
                                    skipDuplicatesEl.checked = currentSettings.skipDuplicates;
                                    skipDuplicatesEl.disabled = checked;
                                }

                                const generateLinksEl = h.element(`#settings-${postId}-generate-links`);
                                if (generateLinksEl) {
                                    generateLinksEl.checked = currentSettings.generateLinks;
                                    generateLinksEl.disabled = checked;
                                }

                                setTimeout(() => (updateSettings = true), 100); // Re-enable updating after a short delay
                            });

                            h.element(`#settings-${postId}-verify-bunkr-links`)?.addEventListener('change', e => {
                                currentSettings.verifyBunkrLinks = e.target.checked;
                            });

                            if (!window.isFF) {
                                h.element(`#settings-${postId}-zipped`)?.addEventListener('change', e => {
                                    currentSettings.zipped = e.target.checked;
                                });
                            }

                            h.element(`#settings-${postId}-generate-links`)?.addEventListener('change', e => {
                                currentSettings.generateLinks = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-generate-log`)?.addEventListener('change', e => {
                                currentSettings.generateLog = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-flatten`)?.addEventListener('change', e => {
                                currentSettings.flatten = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-skip-duplicates`)?.addEventListener('change', e => {
                                currentSettings.skipDuplicates = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#download-config-form-${postId}`)?.addEventListener('submit', async e => {
                                e.preventDefault();
                                onSubmitFormCB({ tippyInstance: instance });
                            });

                            if (parsedHosts.length > 1) {
                                h.element(`#settings-toggle-all-hosts-${postId}`)?.addEventListener('change', async e => {
                                    e.preventDefault();
                                    const checked = e.target.checked;
                                    const hostCheckboxes = parsedHosts.flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`));
                                    // Use filter/forEach instead of click() for better direct control
                                    hostCheckboxes.forEach(checkbox => {
                                        if (checkbox.checked !== checked) {
                                            checkbox.checked = checked;
                                            checkbox.dispatchEvent(new Event('change')); // Manually dispatch change event
                                        }
                                    });
                                });
                            }

                            parsedHosts.forEach(host => {
                                h.element(`#downloader-host-${host.id}-${postId}`)?.addEventListener('change', e => {
                                    host.enabled = e.target.checked;
                                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                                    const filteredCountEl = h.element('#filtered-count');
                                    if (filteredCountEl) filteredCountEl.textContent = `(${filteredCount})`;

                                    if (parsedHosts.length > 0) {
                                        const checkedLength = parsedHosts
                                            .filter(h => h.enabled)
                                            .length;

                                        const totalResources = parsedHosts.reduce((acc, currentHost) => acc + currentHost.resources.length, 0);

                                        const totalDownloadableResources = parsedHosts
                                            .filter(currentHost => currentHost.enabled && currentHost.resources.length)
                                            .reduce((acc, currentHost) => acc + currentHost.resources.length, 0);

                                        btnDownloadPost.textContent = `🡳 Download (${totalDownloadableResources}/${totalResources})`;

                                        if (parsedHosts.length > 1) {
                                            const toggleAllHostsCheckbox = h.element(`#settings-toggle-all-hosts-${postId}`);
                                            if (toggleAllHostsCheckbox) {
                                                toggleAllHostsCheckbox.checked = checkedLength === parsedHosts.length;
                                            }
                                        }
                                    }
                                });
                            });
                        },
                    });
                },
            },
        },
    },
};

const init = {
    injectCustomStyles: () => {
        // Tippy transparent theme.
        const styleEl = document.createElement('style');
        styleEl.textContent = styles.tippy.theme + '\n.menu-content{font-family:"JetBrains Mono",monospace;transition:all 150ms ease-in-out;box-shadow:0 0 40px rgba(0,229,255,0.15),0 8px 32px rgba(10,19,26,0.4);}';
        document.head.append(styleEl);

        const customStyles = document.createElement('style');
        // Margins classes
        const marginClasses = [];

        for (let i = 1; i <= 15; i++) {
            marginClasses.push(`.m-l-${i} {margin-left: ${i}px;}`);
            marginClasses.push(`.m-t-${i} {margin-top: ${i}px;}`);
        }

        customStyles.textContent = marginClasses.join('\n');
        document.head.append(customStyles);
    },
};

// Holds the posts that are processing downloads.
let processing = [];

// v1.9.1 (suite v1.3.0): setProcessing() was invoked at three call sites but
// never defined anywhere in the lineage — every download run threw a
// ReferenceError immediately after URL resolution, and the beforeunload
// in-flight guard never saw the flag flip. Restored as the minimal per-post
// flag keeper the read side (`processing.find(p => p.processing)`) expects.
function setProcessing(isProcessing, postId) {
    let entry = processing.find(p => p.postId === postId);
    if (!entry) {
        entry = { postId, processing: false };
        processing.push(entry);
    }
    entry.processing = Boolean(isProcessing);
}

/**
 * An array of arrays defining how to match hosts inside the posts.
 *
 * The first item in the array is the signature.
 * The second item is an array of matchers.
 *
 * A matcher is a regular expression matching a substring inside the post.
 *
 * The first matcher matches a single resource (e.g. an image or a video).
 * The second matcher matches a folder or an album (e.g. a set of related images)
 *
 * [0: signature(name+category), 1: [single_regex, album_regex]]
 *
 * When applied, every matcher is prefixed with https?:\/\/(www.)?
 *
 * Every matcher is matched against the following attributes:
 *
 * href, src, data-url
 *
 * You must not include the pattern to match attributes.
 * They are automatically handled when a matcher is run.
 *
 * For a completely custom pattern, put !! (two excl. characters) anywhere in it:
 *
 * [/!!https:\/\/cyberfile.su\/\w+(?=")/, /cyberfile.su\/folder\//]
 *
 * @signature {string} The name and categories of the host, separated by a colon.
 * @matchers {Array<RegExp>} The name and categories of the host, separated by a colon.
 *
 * Matchers can include the following options anywhere
 * (preferably where it doesn't break the pattern) within a pattern.
 *
 * @option <no_qs> Removes query string
 * @option <keep_ts> Keeps the trailing slash
 *
 * The following placeholders can be used inside any matcher pattern:
 *
 * @placeholder ~an@ -> a-zA-Z0-9
 *
 */
const hosts = [
    ['Simpcity:Attachments', [/(\/attachments\/|\/data\/video\/)/]],
    ['Coomer:Profiles', [/coomer.su\/[~an@._-]+\/user/]],
    ['Coomer:image', [/(\w+\.)?coomer.su\/(data|thumbnail)/]],
    ['JPG6:image', [/(simp\d+\.)?(selti-delivery\.ru|jpg\d?\.(church|fish|fishing|pet|su))\/(?!(img\/|a\/|album\/))/, /jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/]],
    ['kemono:direct link', [/.{2,6}\.kemono.su\/data\//]],
    ['Postimg:image', [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]],
    ['Ibb:image',
        [
            /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
            /ibb.co\/album\/[~an@_.-]+/,
        ],
    ],
    ['Ibb:direct link', [/!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/]],
    ['Imagevenue:image', [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
    ['Imgvb:image', [/imgvb.com\/images\//, /imgvb.com\/album/]],
    ['Imgbox:image', [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
    ['Onlyfans:image', [/public.onlyfans.com\/files/]],
    ['Reddit:image', [/(\w+)?.redd.it/]],
    ['Pomf2:File', [/pomf2.lain.la/]],
    ['Nitter:image', [/nitter\.(.{1,20})\/pic/]],
    ['Twitter:image', [/([~an@.]+)?twimg.com\//]],
    ['Pixhost:image', [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
    ['Imagebam:image', [/imagebam.com\/(view|gallery)/]],
    ['Imagebam:full embed', [/images\d.imagebam.com/]],
    ['Saint:video', [/(saint2.(su|pk|cr)\/embed\/|([~an@]+\.)?saint2.(su|pk|cr)\/videos)/]],
    ['Redgifs:video', [/!!redgifs.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
    ['Bunkr:',
        [
            /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/,
        ]
    ],
    ['Bunkr:Albums', [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]],
    ['Give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
    ['Pixeldrain:', [/(focus\.)?pixeldrain.com\/[lu]\//]],
    ['Gofile:', [/gofile.io\/d/]],
    ['Box.com:', [/m\.box\.com\//]],
    ['Yandex:', [/(disk\.)?yandex\.[a-z]+/]],
    ['Cyberfile:', [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    ['Cyberdrop:', [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /cyberdrop.(me|to|cc|nl)\/a\//]],
    ['Pornhub:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
    ['Noodlemagazine:video', [/(adult.)?noodlemagazine.com\/watch\//]],
    ['Spankbang:video', [/spankbang.com\/.*?\/video/]],
];

/**
 * An array of url resolvers.
 *
 * Each resolver is an array: [RegExp[], Function]
 * The first element is an array of RegExp patterns. All patterns must match for the resolver to be applied.
 * The second element is the resolver function: (url, http, spoilers, postId, postSettings) => Promise<string|object|null>
 * The resolver function should return:
 * - A string (resolved URL)
 * - An object { folderName: string, resolved: string[] } for albums
 * - Null if resolution fails
 */
const resolvers = [
    [
        [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
        url => url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, 'https://pbs.twimg.com/media/$3'),
    ],
    [
        [/imagevenue.com/],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                return dom.querySelector('.col-md-12 > a > img')?.getAttribute('src');
            } catch (error) {
                console.error(`Error resolving Imagevenue: ${error.message}`);
                return null;
            }
        },
    ],
    [[/pomf2.lain.la/], url => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, 'pomf2.lain.la/f/$1.$2')],
    [[/coomer.su\/(data|thumbnail)/], url => url],
    [
        [/coomer.su/, /:!coomer.su\/(data|thumbnail)/],
        async (url, http) => {
            const host = `https://coomer.su`;
            const profileId = url.replace(/\?.*/, '').split('/').pop();
            if (!profileId) return null;

            let finalURL = url.replace(/\?.*/, '');
            let nextPage = null;
            const posts = [];
            let page = 1;

            log.info('coomer.su', `Resolving profile: ${profileId}`, 'Coomer');

            do {
                try {
                    const { dom } = await http.get(finalURL);
                    const links = [...(dom.querySelectorAll('.card-list__items > article') ?? [])]
                        .map(a => a.querySelector('.post-card__heading > a'))
                        .filter(Boolean)
                        .map(a => ({
                            link: `${host}${a.getAttribute('href')}`,
                            id: a.getAttribute('href')?.split('/').pop() ?? '',
                        }));

                    posts.push(...links);
                    nextPage = dom.querySelector('a[title="Next page"]');
                    if (nextPage) {
                        finalURL = `${host}${nextPage.getAttribute('href')}`;
                    }
                    log.info('coomer.su', `Resolved page: ${page}`, 'Coomer');
                    page++;
                } catch (error) {
                    log.error('coomer.su', `Error fetching Coomer page ${page}: ${error.message}`, 'Coomer');
                    break;
                }
            } while (nextPage);

            const resolved = [];
            let index = 1;
            for (const post of posts) {
                try {
                    const { dom } = await http.get(post.link);
                    const filesContainer = dom.querySelector('.post__files');

                    if (filesContainer) {
                        const images = filesContainer.querySelectorAll('.post__thumbnail > .fileThumb');
                        if (images.length) {
                            resolved.push(
                                ...[...images].map(a => ({
                                    url: `${host}${a.getAttribute('href')}`,
                                    folderName: post.id,
                                })),
                            );
                        }
                    }

                    const attachments = dom.querySelectorAll('.post__attachments > .post__attachment > .post__attachment-link');
                    if (attachments.length) {
                        resolved.push(
                            ...[...attachments].map(a => {
                                const fileUrl = `${host}${a.getAttribute('href')}`;
                                let folder = 'Images';
                                const ext = h.ext(fileUrl.replace(/\?.*/, ''));
                                if (settings.extensions.video.includes(`.${ext}`)) {
                                    folder = 'Videos';
                                }
                                return {
                                    url: fileUrl,
                                    folderName: `${post.id}/${folder}`,
                                };
                            }),
                        );
                    }
                    log.info('coomer.su', `Resolved post ${index} / ${posts.length}`, 'Coomer');
                } catch (error) {
                    log.error('coomer.su', `Error resolving Coomer post ${post.link}: ${error.message}`, 'Coomer');
                }
                index++;
            }

            return { folderName: profileId, resolved };
        },
    ],
    [
        [/(postimg|pixxxels).cc/],
        async (url, http) => {
            try {
                url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, 'https://postimg.cc/$3');
                const { dom } = await http.get(url);
                return dom.querySelector('.controls > nobr > a')?.getAttribute('href');
            } catch (error) {
                console.error(`Error resolving Postimg: ${error.message}`);
                return null;
            }
        },
    ],
    [[/kemono.su\/data/], url => url],
    [
        [/(jpg\d\.(church|fish|fishing|pet|su))|selti-delivery\.ru\//i, /:!jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)/i],
        url => url.replace('.th.', '.').replace('.md.', '.'),
    ],
    [
        [/jpe?g\d\.(church|fish|fishing|pet|su)(\/a\/|\/album\/)/i],
        async (url, http, spoilers, postId) => {
            url = url.replace(/\?.*/, '');
            let reFetch = false;
            let { source, dom } = await http.get(url, {
                onStateChange: response => {
                    if (response.readyState === 2 && response.finalUrl !== url) {
                        url = response.finalUrl;
                        reFetch = true;
                    }
                },
            });

            if (reFetch) {
                ({ source, dom } = await http.get(url));
            }

            if (h.contains('Please enter your password to continue', source)) {
                const authTokenNode = dom.querySelector('input[name="auth_token"]');
                const authToken = authTokenNode?.getAttribute('value');

                if (!authToken || !spoilers?.length) {
                    log.host.error(postId, `::Password protected album requires password::: ${url}`, 'jpg6.su');
                    return null;
                }

                const attemptWithPassword = async password => {
                    const { source: src, dom: d } = await http.post(
                        url,
                        `auth_token=${authToken}&content-password=${password}`,
                        {},
                        {
                            Referer: url,
                            Origin: 'https://jpg6.su',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );
                    return { source: src, dom: d };
                };

                let authenticated = false;
                for (const spoiler of spoilers) {
                    try {
                        const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
                        if (!h.contains('Please enter your password to continue', src)) {
                            authenticated = true;
                            source = src;
                            dom = d;
                            break;
                        }
                    } catch (error) {
                        log.host.warn(postId, `::Attempt with password '${spoiler}' failed::: ${error.message}`, 'jpg6.su');
                    }
                }

                if (!authenticated) {
                    log.host.error(postId, `::Could not resolve password protected album::: ${url}`, 'jpg6.su');
                    return null;
                }
            }

            const resolvePageImages = async domToParse => {
                let images = [...(domToParse.querySelectorAll('.list-item-image > a > img') ?? [])]
                    .map(img => img.getAttribute('src'))
                    .filter(Boolean)
                    .map(url => url.replace('.md.', '.').replace('.th.', '.'));

                const nextPage = domToParse.querySelector('a[data-pagination="next"]');
                if (nextPage?.hasAttribute('href')) {
                    try {
                        const { dom: nextDom } = await http.get(nextPage.getAttribute('href'));
                        images.push(...(await resolvePageImages(nextDom)));
                    } catch (error) {
                        log.host.warn(postId, `::Error fetching next page of JPG6 album::: ${error.message}`, 'jpg6.su');
                    }
                }
                return images;
            };

            const resolved = await resolvePageImages(dom);
            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]')?.content.trim() ?? 'JPG6 Album',
                resolved,
            };
        },
    ],
    [
        [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                return dom.querySelector('.header-content-right > a')?.getAttribute('href');
            } catch (err) {
                console.error(`Error resolving Ibb direct link: ${err.message}`);
                return url; // Fallback to original URL if resolution fails
            }
        },
    ],
    [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], url => url],
    [
        [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http, _, postId) => {
            const albumId = url.replace(/\?.*/, '').split('/').pop();
            if (!albumId) return null;

            try {
                const { source, dom } = await http.get(url);
                const imageCount = Number(dom.querySelector('span[data-text="image-count"]')?.innerText);
                const pageCount = Math.ceil(imageCount / 32);
                const authToken = h.re.match(/(?<=auth_token=").*?(?=")/i, source);

                const fetchPageData = async (albId, page, seekEnd, token) => {
                    const seek = seekEnd || '';
                    const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albId}&auth_token=${token}&seek=${seek}&items_per_page=32`;
                    const { source: response } = await http.post(
                        'https://ibb.co/json',
                        data,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );

                    try {
                        const parsed = JSON.parse(response);
                        if (parsed && parsed.status_code === 200) {
                            const html = parsed.html;
                            const urls = h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html)
                                .map(o => JSON.parse(decodeURIComponent(o))?.url)
                                .filter(Boolean);
                            return { urls, parsed };
                        }
                        return { urls: [], parsed };
                    } catch (e) {
                        log.host.error(postId, `::Error parsing Ibb JSON response for album ${albId} page ${page}::: ${e.message}`, 'ibb.co');
                        return { urls: [], parsed: {} };
                    }
                };

                const resolved = [];
                let currentSeekEnd = '';

                for (let i = 1; i <= pageCount; i++) {
                    try {
                        const data = await fetchPageData(albumId, i, currentSeekEnd, authToken);
                        currentSeekEnd = data.parsed.seekEnd;
                        resolved.push(...data.urls);
                    } catch (error) {
                        log.host.error(postId, `::Error fetching Ibb album page ${i}::: ${error.message}`, 'ibb.co');
                        break;
                    }
                }

                return {
                    dom,
                    source,
                    folderName: dom.querySelector('meta[property="og:title"]')?.content.trim() ?? 'IBB Album',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Ibb album ${albumId}::: ${error.message}`, 'ibb.co');
                return null;
            }
        },
    ],
    [[/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//], url => url.replace(/\/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/')],
    [
        [/pixhost.to\/gallery\//],
        async (url, http, _, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const imageLinksInput = dom?.querySelector('.share > div:nth-child(2) > input') || dom?.querySelector('.share > input:nth-child(2)');

                if (!imageLinksInput) {
                    log.host.error(postId, `::Could not find image links input for Pixhost gallery::: ${url}`, 'pixhost.to');
                    return null;
                }

                const resolved = h.re
                    .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, imageLinksInput.getAttribute('value') ?? '')
                    .map(imgUrl => imgUrl.replace(/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('.link > h2')?.innerText.trim() ?? 'Pixhost Gallery',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Pixhost gallery ${url}::: ${error.message}`, 'pixhost.to');
                return null;
            }
        },
    ],
    [
        [/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/(v\/)?/i, /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
        async (url, http, _, postId) => {
            try {
                const { pathname } = new URL(url);
                const segments = pathname.split('/').filter(Boolean);
                const index = segments.findIndex(s => ['f', 'v', 'd'].includes(s));
                const id = index > -1 ? segments.slice(index + 1).join('/') : segments.pop();
                if (!id) {
                    log.host.error(postId, `::Could not extract ID from Bunkr URL::: ${url}`, 'Bunkr');
                    return null;
                }

                const response = await http.post(
                    `https://bunkr.cr/api/v2/file/${id}`, // Updated API endpoint based on typical Bunkr structures
                    null, // No data needed for GET equivalent
                    {},
                    { 'Content-Type': 'application/json' }
                );

                const data = JSON.parse(response.source);

                if (!data || data.status === 'error') {
                    log.host.error(postId, `::Bunkr API error for ID ${id}::: ${data?.message || 'Unknown error'}`, 'Bunkr');
                    return null;
                }

                let finalURL;
                if (!data.encrypted) {
                    finalURL = data.url;
                } else {
                    const binaryString = atob(data.url);
                    // Bunkr encryption key derivation logic might vary, this is a common one.
                    const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                    finalURL = Array.from(binaryString)
                        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                        .join('');
                }
                return finalURL;
            } catch (error) {
                log.host.error(postId, `::Error resolving Bunkr direct link for ${url}::: ${error.message}`, 'Bunkr');
                return null;
            }
        },
    ],
    [
        [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|su|org)\/a\//],
        async (url, http, _, postId) => {
            try {
                const { dom, source } = await http.get(url);
                const containers = dom.querySelectorAll('.grid-images > div');
                const files = [];

                for (const f of containers) {
                    const a = f.querySelector('a[class="after:absolute after:z-10 after:inset-0"]');
                    if (!a) continue;

                    const href = a.getAttribute('href');
                    if (!href || !href.includes('/f/')) continue;

                    const id = href.split('/f/')[1];
                    // v1.9: derive the API origin from the link being resolved
                    // instead of hardcoding bunkr.cr — bunkr rotates domains
                    // constantly and a stale base 404s the whole album scan.
                    let apiBase;
                    try { apiBase = new URL(href, url).origin; }
                    catch (e) { try { apiBase = new URL(url).origin; } catch (e2) { apiBase = 'https://bunkr.si'; } }
                    try {
                        const response = await http.post(
                            `${apiBase}/api/v2/file/${id}`,
                            null,
                            {},
                            { 'Content-Type': 'application/json' }
                        );
                        const data = JSON.parse(response.source);

                        if (!data || data.status === 'error') {
                            log.host.warn(postId, `::Bunkr album API error for ID ${id}::: ${data?.message || 'Unknown error'}`, 'Bunkr');
                            continue;
                        }

                        let finalURL;
                        if (!data.encrypted) {
                            finalURL = data.url;
                        } else {
                            const binaryString = atob(data.url);
                            const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                            finalURL = Array.from(binaryString)
                                .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                                .join('');
                        }
                        files.push(finalURL);
                    } catch (error) {
                        log.host.warn(postId, `::Error resolving Bunkr album file ${id}::: ${error.message}`, 'Bunkr');
                    }
                }

                const infoContainer = dom.querySelector('h1');
                const parts = infoContainer?.outerText
                    .split('\n')
                    .map(t => t.trim())
                    .filter(t => t !== '');
                const origAlbumName = parts.length ? parts[0].trim() : url.split('/').pop() ?? 'Bunkr Album';
                const albumName = origAlbumName.replaceAll('/', '-').replace(/&amp;/g, '');

                return {
                    dom,
                    source,
                    folderName: albumName,
                    resolved: files.filter(file => file),
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Bunkr album ${url}::: ${error.message}`, 'Bunkr');
                return null;
            }
        },
    ],
    [
        [/give.xxx\//],
        async (url, http, _, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const profileId = h.re.match(/(?<=profile-id=")\d+/, source);
                if (!profileId) {
                    log.host.error(postId, `::Could not find profile ID for Give.xxx URL::: ${url}`, 'give.xxx');
                    return null;
                }

                const resolved = [];
                let username = null;
                let firstMediaId = null;
                let mediaId = 1;
                let iteration = 1;

                while (true) {
                    let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
                    endpoint += iteration === 1 ? '&min_id=1' : `&max_id=${mediaId}`;
                    try {
                        const { source: apiSource } = await http.get(endpoint);
                        if (h.contains('_v', apiSource)) {
                            const parsed = JSON.parse(apiSource);

                            if (!parsed || parsed.length === 0) {
                                break;
                            }

                            if (username === null) {
                                username = parsed[0]?.account?.username;
                            }

                            if (firstMediaId === null) {
                                firstMediaId = parsed[0]?.id;
                            } else {
                                if (firstMediaId === parsed[0]?.id) {
                                    break;
                                }
                            }
                            resolved.push(
                                ...parsed.flatMap(i => {
                                    return i.media_attachments
                                        .map(a => a.sizes)
                                        .map(s => s.large || s.normal || s.small)
                                        .filter(Boolean);
                                }),
                            );
                            mediaId = parsed[parsed.length - 1]?.id;
                        } else {
                            break;
                        }
                    } catch (error) {
                        log.host.error(postId, `::Error fetching Give.xxx API page ${iteration}::: ${error.message}`, 'give.xxx');
                        break;
                    }
                    iteration++;
                }

                return {
                    dom,
                    source,
                    folderName: username ?? 'Give.xxx Profile',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Give.xxx album ${url}::: ${error.message}`, 'give.xxx');
                return null;
            }
        },
    ],
    [
        [/pixeldrain.com\/[ul]/],
        url => {
            let resolved = url.replace('/u/', '/api/file/').replace('/l/', '/api/list/');
            resolved = h.contains('/api/list', resolved) ? `${resolved}/zip` : resolved;
            resolved = h.contains('/api/file', resolved) ? `${resolved}?download` : resolved;
            return resolved;
        },
    ],
    [
        [/gofile.io\/d/],
        async (url, http, spoilers, postId) => {
            const resolveAlbum = async (contentId, availableSpoilers) => {
                const apiUrl = `https://api.gofile.io/contents/${contentId}?wt=4fd6sg89d7s6`;
                let { source } = await http.get(apiUrl, {}, { 'Authorization': `Bearer ${settings.hosts.goFile.token}` });

                if (h.contains('error-notFound', source)) {
                    log.host.error(postId, `::Album not found::: ${url}`, 'gofile.io');
                    return null;
                }
                if (h.contains('error-notPublic', source)) {
                    log.host.error(postId, `::Album not public::: ${url}`, 'gofile.io');
                    return null;
                }

                let props = JSON.parse(source?.toString() ?? '{}');

                if (h.contains('error-passwordRequired', source) && availableSpoilers?.length) {
                    log.host.info(postId, `::Album requires password::: ${url}`, 'gofile.io');
                    log.host.info(postId, `::Trying with ${availableSpoilers.length} available password(s)::`, 'gofile.io');

                    for (const spoiler of availableSpoilers) {
                        try {
                            const hash = sha256(spoiler);
                            const { source: passwordSource } = await http.get(`${apiUrl}&password=${hash}`);
                            const passwordProps = JSON.parse(passwordSource?.toString() ?? '{}');
                            if (passwordProps?.status === 'ok') {
                                props = passwordProps;
                                log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, 'gofile.io');
                                break;
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Attempt with password '${spoiler}' failed::: ${error.message}`, 'gofile.io');
                        }
                    }
                    if (props?.status !== 'ok') {
                        log.host.error(postId, `::Failed to authenticate with any provided password::: ${url}`, 'gofile.io');
                        return null;
                    }
                }
                return props;
            };

            const contentCode = url.split('/').pop();
            if (!contentCode) return null;

            const props = await resolveAlbum(contentCode, spoilers);
            let folderName = h.basename(url);

            if (!props?.status === 'ok' || !props?.data) {
                log.host.error(postId, `::Unable to resolve album::: ${url}`, 'gofile.io');
                return { dom: null, source: null, folderName, resolved: [] };
            }

            const resolved = [];

            const getChildAlbums = async (currentProps, currentSpoilers) => {
                if (!currentProps || currentProps.status !== 'ok' || !currentProps.data?.children) {
                    return [];
                }

                const currentResolved = [];
                const files = currentProps.data.children;
                folderName = currentProps.data.name; // Update folderName with the root album name

                for (const fileKey in files) {
                    if (Object.prototype.hasOwnProperty.call(files, fileKey)) {
                        const obj = files[fileKey];
                        if (obj.type === 'file') {
                            currentResolved.push(obj.link);
                        } else if (obj.type === 'folder') {
                            try {
                                const folderProps = await resolveAlbum(obj.code, currentSpoilers);
                                currentResolved.push(...(await getChildAlbums(folderProps, currentSpoilers)));
                            } catch (error) {
                                log.host.error(postId, `::Error resolving Gofile subfolder ${obj.code}::: ${error.message}`, 'gofile.io');
                            }
                        }
                    }
                }
                return currentResolved;
            };

            resolved.push(...(await getChildAlbums(props, spoilers)));

            if (!resolved.length) {
                log.host.warn(postId, `::Empty album::: ${url}`, 'gofile.io');
            }

            return { dom: null, source: null, folderName, resolved };
        },
    ],
    [
        [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers, postId) => {
            try {
                const { source } = await http.get(url);
                const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)?.[0];
                if (!u) {
                    log.host.error(postId, `::Could not extract file ID from Cyberfile URL::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const getFileInfo = async () => {
                    const { source: fileInfoSource } = await http.post(
                        'https://cyberfile.me/account/ajax/file_details',
                        `u=${u}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    return fileInfoSource;
                };

                let response = await getFileInfo();
                let requiredPassword = false;
                let unlocked = false;

                if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers?.length) {
                    const html = JSON.parse(response)?.html;
                    const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html ?? '');
                    const folderId = matches?.[1] || matches?.[2];

                    if (!folderId) {
                        log.host.error(postId, `::Could not extract folder ID for password protected Cyberfile::: ${url}`, 'cyberfile.su');
                        return null;
                    }

                    requiredPassword = true;
                    for (const password of spoilers) {
                        try {
                            const { source: passwordSource } = await http.post(
                                'https://cyberfile.me/ajax/folder_password_process',
                                `submitme=1&folderId=${folderId}&folderPassword=${password}`,
                                {},
                                { 'Content-Type': 'application/x-www-form-urlencoded' },
                            );
                            if (h.contains('success', passwordSource) && JSON.parse(passwordSource)?.success === true) {
                                unlocked = true;
                                break;
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Attempt with password '${password}' failed for Cyberfile::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                if (requiredPassword && !unlocked) {
                    log.host.error(postId, `::Failed to unlock password protected Cyberfile::: ${url}`, 'cyberfile.su');
                    return null;
                }

                if (requiredPassword && unlocked) {
                    response = await getFileInfo(); // Re-fetch info after unlocking
                }

                return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)?.[0]?.replace(/\\\//gi, '/');
            } catch (error) {
                log.host.error(postId, `::Error resolving Cyberfile direct link ${url}::: ${error.message}`, 'cyberfile.su');
                return null;
            }
        },
    ],
    [
        [/cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const script = [...(dom.querySelectorAll('script') ?? [])].map(s => s.innerText).find(s => h.contains('data-toggle="tab"', s));
                if (!script) {
                    log.host.error(postId, `::Could not find script with folder data for Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const nodeId = h.re.matchAll(/(?='folder',\s').*?(?=')/gis, script)?.[0];
                if (!nodeId) {
                    log.host.error(postId, `::Could not extract node ID for Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const loadFiles = async () => {
                    const { source: filesSource } = await http.post(
                        'https://cyberfile.me/account/ajax/load_files',
                        `pageType=folder&nodeId=${nodeId}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    return filesSource;
                };

                let response = await loadFiles();
                let requiredPassword = false;
                let unlocked = false;

                if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers?.length) {
                    requiredPassword = true;
                    for (const password of spoilers) {
                        try {
                            const { source: passwordSource } = await http.post(
                                'https://cyberfile.me/ajax/folder_password_process',
                                `submitme=1&folderId=${nodeId}&folderPassword=${password}`,
                                {},
                                { 'Content-Type': 'application/x-www-form-urlencoded' },
                            );
                            if (h.contains('success', passwordSource) && JSON.parse(passwordSource)?.success === true) {
                                unlocked = true;
                                break;
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Attempt with password '${password}' failed for Cyberfile album::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                if (!unlocked) {
                    log.host.error(postId, `::Failed to unlock password protected Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                if (requiredPassword && unlocked) {
                    response = await loadFiles(); // Re-fetch files after unlocking
                }

                const resolved = [];
                let folderName = h.basename(url);
                const props = JSON.parse(response ?? '{}');

                if (props?.html) {
                    folderName = props.page_title || folderName;
                    const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);

                    for (const fileUrl of urls) {
                        try {
                            const { source: filePageSource } = await http.get(fileUrl);
                            const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, filePageSource)?.[0];
                            if (u) {
                                const { source: fileDetailsResponse } = await http.post(
                                    'https://cyberfile.me/account/ajax/file_details',
                                    `u=${u}`,
                                    {},
                                    { 'Content-Type': 'application/x-www-form-urlencoded' },
                                );
                                const finalFileUrl = h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, fileDetailsResponse)?.[0]?.replace(/\\\//gi, '/');
                                if (finalFileUrl) {
                                    resolved.push(finalFileUrl);
                                }
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Error resolving Cyberfile album file ${fileUrl}::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                return { dom, source, folderName, resolved };
            } catch (error) {
                log.host.error(postId, `::Error resolving Cyberfile album ${url}::: ${error.message}`, 'cyberfile.su');
                return null;
            }
        },
    ],
    [[/([~an@]+\.)?saint2.(su|pk|cr)\/videos/], async url => url],
    [[/public.onlyfans.com\/files/], async url => url],
    [
        [/saint2.(su|pk|cr)\/embed/],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                return dom.querySelector('source')?.getAttribute('src');
            } catch (error) {
                console.error(`Error resolving Saint2 embed: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/redgifs.com(\/|\\\/)ifr/],
        async (url, http) => {
            try {
                const id = url.split('/').pop();
                if (!id) return null;

                const apiUrl = `https://api.redgifs.com/v2/gifs/${id}`;
                const token = GM_getValue('redgifs_token', null);
                const { source } = await http.get(apiUrl, {}, { Authorization: `Bearer ${token}` });
                if (h.contains('urls', source)) {
                    const urls = JSON.parse(source)?.gif?.urls;
                    return urls?.hd || urls?.sd || null;
                }
                return null;
            } catch (error) {
                console.error(`Error resolving Redgifs: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /:!cyberdrop.(me|to|cc|nl)\/a\//],
        async (url) => {
            let resolvedUrl = "";
            let apiHost = "https://cyberdrop.me/api/f"; // Base API for files

            if (url.includes('fs-')) {
                // Initial URL might be a direct file link, try to normalize it to Cyberdrop's domain
                url = url.replace(/(fs|img)-\d+/i, '').replace(/(to|cc|nl)-\d+/i, 'me');
                try {
                    // This initial GET request might be to get redirects or direct file info page
                    await http.get(url, {
                        onStateChange: response => {
                            if (response.readyState === 2 && response.finalUrl !== url) {
                                url = response.finalUrl;
                            }
                        },
                    });
                } catch (error) {
                    console.warn(`Cyberdrop (direct): Initial GET failed for ${url}: ${error.message}`);
                    // Fallback to try API directly if initial GET fails
                }
            }

            // Attempt to resolve via Cyberdrop's API for file links
            try {
                const parts = url.split('/');
                const fileId = parts.pop() || parts.pop(); // Get last segment, or second to last if trailing slash
                if (fileId) {
                    const apiUrl = `${apiHost}/${fileId}`;
                    // v1.10.0: bounded + typed — kernel gmFetch (15 s). Any
                    // HTTP status resolves so the caller's gates are
                    // unchanged; transport faults map to status 0 with the
                    // typed NetError kind logged.
                    const response = await __4NDR0_NET_API__.gmFetch(apiUrl, {
                        method: "GET",
                        timeout: 15000,
                        checkStatus: false
                    }).catch(err => {
                        console.warn(`Cyberdrop (direct): transport failure for ${apiUrl} (${err && err.kind})`);
                        return { status: 0, responseText: '' };
                    });

                    if (response.status === 200) {
                        const webData = JSON.parse(response.responseText);
                        if (webData.url) {
                            resolvedUrl = webData.url;
                        }
                    } else {
                        console.error(`Cyberdrop (direct): API request for ${apiUrl} failed with status ${response.status}`);
                    }
                }
            } catch (error) {
                console.error(`Cyberdrop (direct): Error during API resolution for ${url}: ${error.message}`);
            }

            return resolvedUrl || url; // Return resolved URL or original if all attempts fail
        },
    ],
    [
        [/cyberdrop.me\/a\//],
        async (url, http, _, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const resolved = [];
                const apiHost = "https://cyberdrop.me/api/f"; // API for individual files in album

                let files = [...(dom?.querySelectorAll('#file') ?? [])].map(file => {
                    const href = file.getAttribute('href');
                    const fileId = href?.split('/').pop();
                    return fileId ? `${apiHost}/${fileId}` : null;
                }).filter(Boolean);

                for (const fileApiUrl of files) {
                    try {
                        let dl_url = '';
                        // v1.10.0: bounded + typed — kernel gmFetch (15 s).
                        // Transport faults map to status 0 so the non-200 path
                        // (warn + cyberdrop_helper fallback) is preserved;
                        // the typed NetError kind is logged.
                        const response = await __4NDR0_NET_API__.gmFetch(fileApiUrl, {
                            method: "GET",
                            timeout: 15000,
                            checkStatus: false
                        }).catch(err => {
                            console.warn(`Cyberdrop (album): transport failure for ${fileApiUrl} (${err && err.kind})`);
                            return { status: 0, responseText: '' };
                        });

                        if (response.status === 200) {
                            const webData = JSON.parse(response.responseText);
                            dl_url = webData.url;
                        } else {
                            log.host.warn(postId, `Cyberdrop (album): API request for ${fileApiUrl} failed with status ${response.status}`, 'cyberdrop.me');
                            // Fallback retry with helper for persistent issues, if helper has retry logic
                            dl_url = await cyberdrop_helper(fileApiUrl);
                        }
                        if (dl_url) {
                            resolved.push(dl_url);
                        }
                    } catch (error) {
                        log.host.error(postId, `Cyberdrop (album): Error resolving file ${fileApiUrl}: ${error.message}`, 'cyberdrop.me');
                    }
                }

                return {
                    dom,
                    source,
                    folderName: dom.querySelector('#title')?.innerText.trim() ?? 'Cyberdrop Album',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `Cyberdrop (album): Error resolving album ${url}: ${error.message}`, 'cyberdrop.me');
                return null;
            }
        },
    ],
    [
        [/noodlemagazine.com\/watch\//],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                let playerIFrameUrl = dom.querySelector('#iplayer')?.getAttribute('src');

                if (!playerIFrameUrl) {
                    console.error('Noodlemagazine: Could not find player iframe.');
                    return null;
                }

                playerIFrameUrl = playerIFrameUrl.replace('/player/', 'https://noodlemagazine.com/playlist/');

                const { source } = await http.get(playerIFrameUrl);

                const props = JSON.parse(source || JSON.stringify([]));

                if (props.sources?.length) {
                    return props.sources[0].file;
                }

                return null;
            } catch (error) {
                console.error(`Error resolving Noodlemagazine: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/spankbang.com\/.*?\/video/],
        async (url, http) => {
            try {
                const { source } = await http.get(url);

                let streamDataMatch = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)?.[0];
                if (!streamDataMatch) return null;

                let streamData = streamDataMatch.replace(/'/g, '"');
                streamData = JSON.parse(streamData);

                const qualities = ['4k', '1080p', '720p', '480p', '320p', '240p']; // Ordered from best to worst

                for (const quality of qualities) {
                    if (streamData[quality]?.length) {
                        return streamData[quality][0];
                    }
                }

                return null;
            } catch (error) {
                console.error(`Error resolving Spankbang: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/imagebam.com\/(view|gallery)/],
        async (url, http) => {
            try {
                const date = new Date();
                date.setTime(date.getTime() + 6 * 60 * 60 * 1000); // +6 hours for cookie
                const expires = '; expires=' + date.toUTCString();
                const { source, dom } = await http.get(
                    url,
                    {},
                    { cookie: 'nsfw_inter=1' + expires + '; path=/' },
                );

                if (h.contains('gallery-name', source)) {
                    const resolved = [];
                    const imageLinksInput = dom.querySelector('.links.gallery > div:nth-child(2) > div > input');

                    const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput?.getAttribute('value') ?? '');

                    for (const link of rawImageLinks) {
                        try {
                            const { dom: imgDom } = await http.get(link);
                            const imgSrc = imgDom?.querySelector('.main-image')?.getAttribute('src');
                            if (imgSrc) resolved.push(imgSrc);
                        } catch (error) {
                            console.warn(`Imagebam (gallery): Error fetching image link ${link}: ${error.message}`);
                        }
                    }

                    return {
                        dom,
                        source,
                        folderName: dom?.querySelector('#gallery-name')?.innerText.trim() ?? 'Imagebam Gallery',
                        resolved,
                    };
                } else {
                    return dom?.querySelector('.main-image')?.getAttribute('src');
                }
            } catch (error) {
                console.error(`Error resolving Imagebam: ${error.message}`);
                return null;
            }
        },
    ],
    [[/images\d.imagebam.com/], url => url],
    [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], url => url.replace('.th.', '.').replace('.md.', '.')],
    [
        [/imgvb.com\/album\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);
                const resolved = [...(dom.querySelectorAll('.image-container > img') ?? [])]
                    .map(i => i.getAttribute('src'))
                    .filter(Boolean)
                    .map(imgUrl => imgUrl.replace('.th.', '.').replace('.md.', '.'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('meta[property="og:title"]')?.content.trim() ?? 'Imgvb Album',
                    resolved,
                };
            } catch (error) {
                console.error(`Error resolving Imgvb album: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/(\/attachments\/|\/data\/video\/)/],
        async (url) => {
            // Ensure full URL for local attachments if not already present
            if (url.startsWith('/attachments/') || url.startsWith('/data/video/')) {
                return `https://simpcity.su${url}`;
            }
            return url;
        },
    ],
    [[/(thumbs|images)(\d+)?\.imgbox\.com\//, /:!imgbox.com\/g\//], url => url.replace(/_t\./gi, '_o.').replace(/thumbs/i, 'images')],
    [
        [/imgbox.com\/g\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);

                const resolved = [...(dom?.querySelectorAll('#gallery-view-content > a > img') ?? [])]
                    .map(img => img.getAttribute('src'))
                    .filter(Boolean)
                    .map(imgUrl => imgUrl.replace(/(thumbs|t)(\d+)\./gis, 'images$2.').replace('_b.', '_o.'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('#gallery-view > h1')?.innerText.trim() ?? 'Imgbox Gallery',
                    resolved,
                };
            } catch (error) {
                console.error(`Error resolving Imgbox gallery: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/m\.box\.com\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);
                const files = [...(dom.querySelectorAll('.files-item-anchor') ?? [])].map(el => `https://m.box.com${el.getAttribute('href')}`);

                const resolved = [];
                for (const fileUrl of files) {
                    try {
                        const { source: fileSource, dom: fileDom } = await http.get(fileUrl);
                        if (h.contains('image-preview', fileSource)) {
                            const imgSrc = fileDom.querySelector('.image-preview')?.getAttribute('src');
                            if (imgSrc) resolved.push(imgSrc);
                        } else {
                            const dlHref = fileDom.querySelector('.mtl > a')?.getAttribute('href');
                            if (dlHref) resolved.push(dlHref);
                        }
                    } catch (error) {
                        console.warn(`Box.com: Error fetching file ${fileUrl}: ${error.message}`);
                    }
                }

                return {
                    source,
                    dom,
                    folderName: dom.querySelector('.folder-nav-title')?.innerText.trim() ?? 'Box.com Folder',
                    resolved: resolved.map(u => u.startsWith('https://') ? u : `https://m.box.com${u}`), // Ensure full URL for relative paths
                };
            } catch (error) {
                console.error(`Error resolving Box.com: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/twimg.com\//],
        url => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, 'https://pbs.twimg.com/media/$1.$3'),
    ],
    [
        [/(disk\.)?yandex\.[a-z]+/],
        async (url, http, _, postId) => {
            try {
                const { dom } = await http.get(url);
                const script = dom.querySelector('script[id="store-prefetch"]');
                if (!script) {
                    log.host.error(postId, `::Could not find store-prefetch script for Yandex disk::: ${url}`, 'Yandex');
                    return null;
                }

                const json = JSON.parse(script.innerText);
                let sk, hash = null;

                if (json?.environment && json.resources) {
                    sk = json.environment.sk;
                    const resourcesKeys = Object.keys(json.resources);
                    hash = json.resources[resourcesKeys[0]]?.hash;
                }

                if (!sk || !hash) {
                    log.host.error(postId, `::Missing SK or hash in Yandex disk data::: ${url}`, 'Yandex');
                    return null;
                }

                const data = JSON.stringify({ hash, sk });
                const { source } = await http.post(
                    'https://disk.yandex.ru/public/api/download-url',
                    data,
                    {},
                    { 'Content-Type': 'text/plain' },
                );

                const response = JSON.parse(source);
                if (response && response.error !== 'true' && response.data?.url) {
                    return response.data.url;
                }

                log.host.error(postId, `::Yandex download URL not found in API response::: ${url}`, 'Yandex');
                return null;
            } catch (error) {
                log.host.error(postId, `::Error resolving Yandex disk ${url}::: ${error.message}`, 'Yandex');
                return null;
            }
        },
    ],
    [[/(\w+)?.redd.it/], url => url.replace(/&amp;/g, '&')],
];

/**
 * Helper function for Cyberdrop to retry fetching URLs if initial attempt fails.
 * This is meant for cases where GM_xmlhttpRequest might intermittently fail.
 * @param {string} fileUrl The Cyberdrop API URL for the file.
 * @param {number} [retries=3] Number of retry attempts.
 * @param {number} [delay=3500] Delay between retries in milliseconds.
 * @returns {Promise<string>} The resolved download URL or empty string.
 */
async function cyberdrop_helper(fileUrl, retries = 3, delay = 3500) {
    for (let i = 0; i < retries; i++) {
        await h.delayedResolve(delay); // Wait before retrying
        try {
            // v1.10.0: bounded + typed — kernel gmFetch (15 s). Transport
            // faults map to status 0 so the retry loop is preserved; the
            // typed NetError kind is logged.
            const response = await __4NDR0_NET_API__.gmFetch(fileUrl, {
                method: "GET",
                timeout: 15000,
                checkStatus: false
            }).catch(err => {
                console.warn(`Cyberdrop retry: transport failure for ${fileUrl} (${err && err.kind})`);
                return { status: 0, responseText: '' };
            });

            if (response.status === 200) {
                const webData = JSON.parse(response.responseText);
                if (webData.url) {
                    return webData.url;
                }
            } else {
                console.warn(`Cyberdrop retry (${i + 1}/${retries}): API for ${fileUrl} failed with status ${response.status}`);
            }
        } catch (error) {
            console.error(`Cyberdrop retry (${i + 1}/${retries}): Error for ${fileUrl}: ${error.message}`);
        }
    }
    console.error(`Cyberdrop retry: All attempts failed for ${fileUrl}`);
    return "";
}

/**
 * Manages caching and retrieval of forum thread pages using GM_setValue.
 * Stores minimal data (postId, postNumber, textContent) for search/navigation.
 */
const ThreadCache = (() => {
    const CACHE_KEY_PREFIX = 'XFPD_ThreadCache_'; // Prefix for GM_setValue keys

    /**
     * Extracts thread ID from the current URL.
     * Assumes URL format like https://simpcity.su/threads/thread-title.123/page-N
     * @returns {string|null} The thread ID or null if not found.
     */
    const getThreadIdFromUrl = () => {
        const match = window.location.pathname.match(/\/threads\/.*\.(\d+)(\/|$)/);
        return match?.[1] ?? null;
    };

    /**
     * Fetches and parses posts from a given page URL.
     * Returns minimal data suitable for caching.
     * @param {string} pageUrl
     * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
     */
    const fetchAndParsePage = async (pageUrl) => {
        try {
            const { dom } = await h.http.get(pageUrl, {}, {}, 'document');
            const postElements = dom.querySelectorAll('.message-attribution-opposite');
            const pagePosts = [];
            for (const postEl of postElements) {
                const parsed = parsers.thread.parsePost(postEl);
                pagePosts.push({
                    postId: parsed.postId,
                    postNumber: parsed.postNumber,
                    pageNumber: parsed.pageNumber,
                    textContent: parsed.textContent // Store text content for search
                });
            }
            return pagePosts;
        } catch (error) {
            console.error(`ThreadCache: Failed to fetch or parse page ${pageUrl}: ${error.message}`);
            return [];
        }
    };

    /**
     * Retrieves cached thread data.
     * @param {string} threadId
     * @returns {Promise<object>} Cached data, organized by page number.
     */
    const getCachedThreadData = async (threadId) => {
        const cachedData = await GM_getValue(`${CACHE_KEY_PREFIX}${threadId}`, {});
        return cachedData;
    };

    /**
     * Stores thread data in cache.
     * @param {string} threadId
     * @param {object} dataToCache
     * @returns {Promise<void>}
     */
    const setCachedThreadData = async (threadId, dataToCache) => {
        await GM_setValue(`${CACHE_KEY_PREFIX}${threadId}`, dataToCache);
    };

    /**
     * Initiates caching of pages for the current thread.
     * @param {number} currentPageNumber
     * @param {number} totalPages
     * @param {string} threadId
     * @param {string} baseUrl
     */
    const cacheSurroundingPages = async (currentPageNumber, totalPages, threadId, baseUrl) => {
        const cachedData = await getCachedThreadData(threadId);
        const pagesToFetch = new Set();
        const numPagesToCache = settings.caching.maxPagesToCache;
        const half = Math.floor(numPagesToCache / 2);

        // Determine pages to fetch around the current one
        for (let i = 0; i < numPagesToCache; i++) {
            let pageNum = currentPageNumber - half + i;
            if (pageNum < 1) pageNum = 1;
            if (pageNum > totalPages) pageNum = totalPages;
            pagesToFetch.add(pageNum);
        }

        const fetchPromises = [];
        for (const pageNum of Array.from(pagesToFetch).sort((a,b) => a - b)) {
            // Only fetch if not already in cache
            if (!cachedData[pageNum]) {
                const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}page-${pageNum}`;
                console.log(`ThreadCache: Fetching page ${pageNum} for caching...`);
                fetchPromises.push(
                    fetchAndParsePage(pageUrl).then(posts => {
                        cachedData[pageNum] = posts;
                    }).catch(err => {
                        console.error(`ThreadCache: Error fetching/parsing page ${pageNum}: ${err.message}`);
                    })
                );
            }
        }
        await Promise.all(fetchPromises);
        await setCachedThreadData(threadId, cachedData);
        console.log(`ThreadCache: Finished caching pages for thread ${threadId}. Cached pages: ${Object.keys(cachedData).length}`);
    };

    return {
        init: async () => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) {
                console.warn('ThreadCache: Could not determine thread ID from URL. Caching skipped.');
                return;
            }

            const paginationEl = h.element('.pageNav-main .pageNav-page.pageNav-page--current');
            const totalPagesEl = h.element('.pageNav-main .pageNav-page:last-of-type'); // Assuming last page button implies total pages
            const currentPageNumber = paginationEl ? Number(paginationEl.textContent) : 1;
            let totalPages = totalPagesEl ? Number(totalPagesEl.textContent) : currentPageNumber;

            if (totalPages < currentPageNumber) { // Fallback if last page button isn't correct, e.g., only one page or simple prev/next
                const lastPageLink = h.element('.pageNav-main a[href*="page-"]:last-of-type');
                if (lastPageLink) {
                    const match = lastPageLink.href.match(/page-(\d+)$/);
                    if (match) {
                        totalPages = Math.max(totalPages, Number(match[1]));
                    }
                }
            }

            const baseUrlMatch = window.location.pathname.match(/(.*\/threads\/.*?\.\d+)\//);
            const baseUrl = baseUrlMatch?.[1] ?? window.location.origin + window.location.pathname.split('/').slice(0, 4).join('/'); // Fallback to /threads/thread-slug.id/

            // Fetch and parse the current page's posts initially, then cache
            const currentPosts = [];
            h.elements('.message-attribution-opposite').forEach(postEl => {
                const parsed = parsers.thread.parsePost(postEl);
                currentPosts.push({
                    postId: parsed.postId,
                    postNumber: parsed.postNumber,
                    pageNumber: parsed.pageNumber,
                    textContent: parsed.textContent
                });
            });

            const cachedData = await getCachedThreadData(threadId);
            cachedData[currentPageNumber] = currentPosts; // Always update current page
            await setCachedThreadData(threadId, cachedData);

            // Asynchronously cache surrounding pages
            requestAnimationFrame(() => {
                cacheSurroundingPages(currentPageNumber, totalPages, threadId, baseUrl);
            });
        },
        /**
         * Get all cached posts for the current thread.
         * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
         */
        getAllCachedPosts: async () => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) return [];
            const cachedData = await getCachedThreadData(threadId);
            return Object.values(cachedData).flat();
        },
        /**
         * Get cached data for a specific page.
         * @param {number} pageNumber
         * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
         */
        getCachedPage: async (pageNumber) => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) return [];
            const cachedData = await getCachedThreadData(threadId);
            return cachedData[pageNumber] || [];
        }
    };
})();


/**
 * @param {object} parsedPost
 * @param {Array<object>} parsedHosts
 * @param {function(Array<object>): Array<object>} enabledHostsCB
 * @param {Array<Array<any>>} resolvers
 * @param {function(): object} getSettingsCB
 * @param {object} statusUI
 * @param {object} [callbacks={}]
 */
const downloadPost = async (parsedPost, parsedHosts, enabledHostsCB, resolvers, getSettingsCB, statusUI, callbacks = {}) => {
    const { postId, postNumber } = parsedPost;
    const postSettings = getSettingsCB();
    const enabledHosts = enabledHostsCB(parsedHosts);

    // Filter out previous logs for this post
    window.logs = window.logs.filter(l => l.postId !== postId);

    log.separator(postId);
    log.post.info(postId, `::Using ${enabledHosts.length} host(s)::: ${enabledHosts.map(h => h.name).join(', ')}`, postNumber);
    log.separator(postId);
    log.post.info(postId, `::Preparing download::`, postNumber);

    let completed = 0;
    const zip = new JSZipGlobal(); // Use global JSZip
    let resolved = [];

    const statusLabel = statusUI.status;
    const filePB = statusUI.filePB;
    const totalPB = statusUI.totalPB;

    h.ui.setElProps(statusLabel.el, { // Access the actual span element
        color: '#00E5FF',
        marginBottom: '3px',
        fontSize: '12px',
    });

    h.ui.setElProps(filePB, {
        width: '0%',
        marginBottom: '1px',
    });

    h.ui.setElProps(totalPB, {
        width: '0%',
        marginBottom: '10px',
    });

    h.show(statusLabel.container); // Show the container div for the label
    h.show(filePB);
    h.show(totalPB);

    h.ui.setText(statusLabel.el, 'Resolving...');

    log.post.info(postId, '::Url resolution started::', postNumber);

    for (const host of enabledHosts.filter(host => host.resources.length)) {
        const resources = host.resources;

        for (const resource of resources) {
            h.ui.setElProps(statusLabel.el, { color: '#00E5FF', fontWeight: 'bold' });
            h.ui.setText(statusLabel.el, `Resolving: ${h.limit(resource, 80)}`);

            let r = null; // Resolved data for the current resource

            for (const resolver of resolvers) {
                const patterns = resolver[0];
                const resolverCB = resolver[1];

                let matched = true;
                for (const pattern of patterns) {
                    let strPattern = pattern.toString();
                    let shouldMatch = !h.contains(':!', strPattern);
                    strPattern = strPattern.replace(':!', '');
                    const regex = h.re.toRegExp(h.re.toString(strPattern), 'is');

                    if (shouldMatch && !regex.test(resource)) {
                        matched = false;
                        break;
                    } else if (!shouldMatch && regex.test(resource)) {
                        matched = false;
                        break;
                    }
                }

                if (!matched) {
                    continue;
                }

                const passwords = parsedPost.spoilers.concat(parsedPost.spoilers.map(s => s.toLowerCase()));

                try {
                    r = await resolverCB(resource, h.http, passwords, postId, postSettings);
                    if (r !== null) { // If resolver successfully returned something, stop trying other resolvers
                        break;
                    }
                } catch (e) {
                    log.post.error(postId, `::Error executing resolver for ${resource} on host ${host.name}::: ${e.message}`, postNumber);
                    r = null; // Ensure r is null if resolver failed
                }
            }

            if (h.isNullOrUndef(r)) {
                log.post.error(postId, `::Could not resolve::: ${resource}`, postNumber);
                continue;
            }

            h.ui.setElProps(statusLabel.el, { color: '#67E8F9', fontWeight: 'bold' });
            h.ui.setText(statusLabel.el, `Resolved: ${resolved.length}`);

            const addResolved = (urlToAdd, folderName) => {
                if (!resolved.length) {
                    log.separator(postId);
                }
                if (h.isObject(urlToAdd) && urlToAdd.url) { // Handle {url, folderName} objects from resolvers
                    resolved.push({
                        url: urlToAdd.url,
                        host,
                        original: resource,
                        folderName: urlToAdd.folderName,
                    });
                    log.post.info(postId, `::Resolved::: ${urlToAdd.url}`, postNumber);
                } else if (typeof urlToAdd === 'string') { // Handle plain string URLs
                    resolved.push({
                        url: urlToAdd,
                        host,
                        original: resource,
                        folderName,
                    });
                    log.post.info(postId, `::Resolved::: ${urlToAdd}`, postNumber);
                }
            };

            if (h.isArray(r.resolved)) { // If resolver returned an album/list of URLs
                r.resolved.forEach(url => addResolved(url, r.folderName));
            } else { // If resolver returned a single URL
                addResolved(r, null);
            }
        }
    }

    if (resolved.length) {
        log.separator(postId);
    }

    log.post.info(postId, '::Url resolution completed::', postNumber);

    let totalDownloadable = resolved.filter(r => r.url).length;
    const totalResourcesInHostSelection = enabledHosts.reduce((acc, hst) => hst.resources.length + acc, 0);

    h.ui.setElProps(statusLabel.el, { color: '#67E8F9', fontWeight: 'bold' });
    h.ui.setText(statusLabel.el, `Resolved: ${resolved.length} / ${totalDownloadable} 🢒 ${totalResourcesInHostSelection} Total Links`);

    const downloadedFilenames = new Set(); // To track actual filenames saved, including deduplication renaming

    setProcessing(true, postId);

    log.separator(postId);
    log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
    log.separator(postId);

    const threadTitle = parsers.thread.parseTitle();
    let customFilename = postSettings.output.find(o => o.postId === postId)?.value;
    if (customFilename) {
        customFilename = customFilename.replace(/:title:/g, threadTitle);
        customFilename = customFilename.replace(/:#:/g, postNumber);
        customFilename = customFilename.replace(/:id:/g, postId);
    }

    // Deduplicate resolved URLs based on their final filename AFTER stripping query strings/hashes
    if (postSettings.skipDuplicates) {
        const uniqueResolved = [];
        const seenBasenames = new Set();
        for (const r of resolved.filter(res => res.url)) {
            let potentialBasename = h.basename(r.url).replace(/\?.*/, '').replace(/#.*/, '');
            // For Bunkr, the filename often comes from content-disposition, not URL basename directly.
            // This is a simplification; a more robust solution would be to resolve filename during actual download for more accuracy.
            if (r.host.name === 'Bunkr') {
                // Heuristic for bunkr, assume last part of path is the effective ID, we won't know the exact filename until headers.
                potentialBasename = r.url.split('/').pop()?.split('?')[0].split('#')[0] ?? potentialBasename;
            }

            if (!seenBasenames.has(potentialBasename.toLowerCase())) {
                uniqueResolved.push(r);
                seenBasenames.add(potentialBasename.toLowerCase());
            } else {
                log.post.info(postId, `::Skipped duplicate (filename heuristic):: ${potentialBasename} ::from:: ${r.url}`, postNumber);
            }
        }
        if (uniqueResolved.length !== resolved.length) {
            h.ui.setText(statusLabel.el, `Removed ${resolved.length - uniqueResolved.length} duplicates...`);
            resolved = uniqueResolved;
            totalDownloadable = resolved.length;
        }
    }


    const isFF = window.isFF;

    if (!postSettings.skipDownload) {
        const resourcesToDownload = resolved.filter(r => r.url);
        totalDownloadable = resourcesToDownload.length;

        // Limit bunkr links to a single concurrent download, otherwise 2 concurrent downloads
        let batchSize = resourcesToDownload.some(file => /(bunkrr?\.\w+)|(bunkr-cache)/.test(file.url)) ? 1 : 2;

        const downloadQueue = [...resourcesToDownload];
        const activeDownloads = new Set();

        const processQueue = async () => {
            while (downloadQueue.length > 0 || activeDownloads.size > 0) {
                // Add new downloads to activeDownloads if there's capacity
                while (activeDownloads.size < batchSize && downloadQueue.length > 0) {
                    const resource = downloadQueue.shift();
                    if (!resource) continue;

                    activeDownloads.add(resource.url);

                    const ellipsedUrl = h.limit(resource.url, 80);
                    log.post.info(postId, `::Downloading::: ${resource.url}`, postNumber);

                    let reflink = resource.original;
                    // Specific referer handling
                    if (resource.url.includes('bunkr')) {
                        reflink = "https://bunkr.si";
                    } else if (resource.url.includes('pomf2')) {
                        reflink = "https://pomf2.lain.la";
                    }

                    const downloadPromise = new Promise((resolve, reject) => {
                        const requestProgress = { loaded: 0, total: 0, intervalId: null };
                        const request = GM_xmlhttpRequest({
                            url: resource.url,
                            headers: { Referer: reflink },
                            responseType: 'blob',
                            // v1.10.0: hard 60 s bound (Pixeldrain++ download
                            // precedent) — the ontimeout handler below existed
                            // but could never fire without this bound.
                            timeout: 60000,
                            onreadystatechange: response => {
                                if (response.readyState === 2) {
                                    // Extract filename from headers early
                                    let filenameMatch = response.responseHeaders.match(/(?<=filename\*?=([^;]+'')?").*?(?=")/i);
                                    if (!filenameMatch) { // Fallback for basic filename detection
                                        filenameMatch = response.responseHeaders.match(/(?<=filename=").*?(?=")/i);
                                    }
                                    const dispositionFilename = filenameMatch ? decodeURIComponent(filenameMatch[0]) : null;

                                    // Extract MIME type
                                    const mimeTypeMatch = response.responseHeaders.match(/(?<=content-type:\s).*$/i);
                                    const mimeType = mimeTypeMatch ? mimeTypeMatch[0] : null;

                                    if (!resource._filename) resource._filename = dispositionFilename;
                                    if (!resource._mimeType) resource._mimeType = mimeType;
                                }
                            },
                            onprogress: response => {
                                requestProgress.loaded = response.loaded;
                                requestProgress.total = response.total;

                                h.ui.setElProps(statusLabel.el, { color: '#00E5FF', fontWeight: 'normal' });
                                const downloadedSizeInMB = (response.loaded / (1024 * 1024)).toFixed(2);
                                const totalSizeInMB = (response.total !== -1 && response.total !== 0) ? (response.total / (1024 * 1024)).toFixed(2) : 'Unknown';

                                h.ui.setText(
                                    statusLabel.el,
                                    `${completed + 1} / ${totalDownloadable} 🢒 ${resource.host.name} 🢒 ${downloadedSizeInMB} MB / ${totalSizeInMB} MB  🢒 ${ellipsedUrl}`,
                                );
                                if (response.total !== -1 && response.total !== 0) {
                                    h.show(filePB);
                                    h.ui.setElProps(filePB, {
                                        width: `${(response.loaded / response.total) * 100}%`,
                                    });
                                } else {
                                    h.ui.setElProps(filePB, { width: '0%' }); // Hide or reset if total is unknown
                                }
                            },
                            onload: response => {
                                completed++;
                                h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(statusLabel.el, { color: '#00E5FF' });
                                h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });

                                // Determine filename
                                let basename = resource._filename || h.basename(resource.url).replace(/\?.*/, '').replace(/#.*/, '');

                                // Specific filename processing for certain hosts
                                if (resource.url.includes('https://simpcity.su/attachments/')) {
                                    // Simplified regex for attachments if original basename contains extra numbers
                                    basename = basename.replace(/(.*)-(.{3,4})\.\d*$/i, '$1.$2');
                                } else if (resource.url.includes('kemono.su')) {
                                    basename = basename.replace(/(.*)\?f=(.*)/, '$2').replace('%20', ' ');
                                } else if (resource.url.includes('cyberdrop')) {
                                    // Cyberdrop filenames can have random hashes, try to remove them
                                    let ext = h.ext(basename);
                                    if (ext) {
                                        basename = h.fnNoExt(basename).replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/, '') + `.${ext}`;
                                    }
                                }

                                let ext = h.ext(basename);
                                if (!ext && resource._mimeType) {
                                    switch (resource._mimeType.split(';')[0].trim()) {
                                        case 'image/jpeg':
                                            ext = 'jpg'; break;
                                        case 'image/png':
                                            ext = 'png'; break;
                                        case 'image/gif':
                                            ext = 'gif'; break;
                                        case 'video/mp4':
                                            ext = 'mp4'; break;
                                        // Add more cases as needed
                                        default:
                                            ext = 'unknown';
                                    }
                                    if (ext !== 'unknown') {
                                        basename = `${h.fnNoExt(basename)}.${ext}`;
                                    }
                                }

                                // Handle duplicate filenames by appending a number
                                let finalBasename = basename;
                                let counter = 1;
                                while (downloadedFilenames.has(finalBasename.toLowerCase())) {
                                    finalBasename = `${h.fnNoExt(basename)} (${counter}).${ext}`;
                                    counter++;
                                }
                                downloadedFilenames.add(finalBasename.toLowerCase());

                                const folder = resource.folderName || '';
                                let finalPathInZip = finalBasename;
                                if (!postSettings.flatten && folder && folder.trim() !== '') {
                                    finalPathInZip = `${folder}/${finalBasename}`;
                                }

                                log.separator(postId);
                                log.post.info(postId, `::Completed::: ${resource.url}`, postNumber);
                                if (folder && folder.trim() !== '') {
                                    log.post.info(postId, `::Saving as::: ${finalBasename} ::to:: ${folder}`, postNumber);
                                } else {
                                    log.post.info(postId, `::Saving as::: ${finalBasename}`, postNumber);
                                }

                                // Sanitize filename for various OS
                                finalPathInZip = finalPathInZip.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\uFFFF]/g, '').replace(/[\\\/:\*?"<>|]/g, settings.naming.invalidCharSubstitute);


                                if (!isFF && !postSettings.zipped) {
                                    // Directly download for Chrome if not zipped
                                    GM_download({
                                        url: response.response, // Use the actual blob
                                        name: `${threadTitle.replace(/[\\\/]/g, settings.naming.invalidCharSubstitute)}/${finalPathInZip}`,
                                        onload: () => resolve(),
                                        onerror: err => {
                                            log.post.error(postId, `Error writing file ${finalPathInZip} to disk: ${err.error} - ${err.details}`, postNumber);
                                            reject(err);
                                        },
                                    });
                                } else {
                                    // Add to zip for Firefox or if zipping is enabled
                                    zip.file(finalPathInZip, response.response);
                                    resolve();
                                }
                            },
                            onerror: err => {
                                completed++;
                                log.post.error(postId, `Download failed for ${resource.url}: ${err.error} - ${err.details}`, postNumber);
                                reject(err);
                            },
                            ontimeout: () => {
                                completed++;
                                log.post.error(postId, `Download timed out for ${resource.url}`, postNumber);
                                reject(new Error('Download timed out'));
                            }
                        });

                        // Set up a timeout check for the request
                        requestProgress.intervalId = setInterval(() => {
                            if (requestProgress.total > 0 && requestProgress.loaded === 0 && activeDownloads.has(resource.url)) {
                                log.warn(postId, `Download stalled for ${resource.url}. Aborting.`, postNumber);
                                request.abort(); // Abort the stalled request
                                clearInterval(requestProgress.intervalId);
                                completed++; // Mark as completed (failed)
                                reject(new Error('Download stalled and aborted'));
                            }
                        }, 60000); // 1 minute timeout check
                    }).finally(() => {
                        activeDownloads.delete(resource.url);
                    });
                    resource._downloadPromise = downloadPromise; // Attach promise to resource for tracking
                }

                // Wait for any active downloads to finish before processing more
                if (activeDownloads.size > 0) {
                    await Promise.race(Array.from(activeDownloads).map(url => resolved.find(r => r.url === url)._downloadPromise));
                } else if (downloadQueue.length > 0) {
                    await h.delayedResolve(100); // Small delay to prevent busy-waiting if queue has new items
                }
            }
        };

        await processQueue(); // Start processing the download queue
    } else {
        log.post.info(postId, '::Skipping download::', postNumber);
    }

    h.hide(statusLabel.container);
    h.hide(filePB);
    h.hide(totalPB);

    setProcessing(false, postId);

    if (totalDownloadable > 0) {
        let title = threadTitle.replace(/[\\\/]/g, settings.naming.invalidCharSubstitute);
        const filename = customFilename || `${title} #${postNumber}.zip`;

        log.separator(postId);
        log.post.info(postId, `::Preparing zip::`, postNumber);

        if (postSettings.generateLog) {
            log.post.info(postId, `::Generating log file::`, postNumber);
            zip.file(
                isFF ? 'generated/log.txt' : 'log.txt',
                window.logs
                    .filter(l => l.postId === postId)
                    .map(l => l.message)
                    .join('\n'),
            );
        }

        if (postSettings.generateLinks) {
            log.post.info(postId, `::Generating links::`, postNumber);
            zip.file(
                isFF ? 'generated/links.txt' : 'links.txt',
                resolved
                    .filter(r => r.url)
                    .map(r => r.url)
                    .join('\n'),
            );
        }

        let blob = await zip.generateAsync({ type: 'blob' });

        if (isFF) {
            saveAs(blob, filename);
        } else if (postSettings.zipped) {
            GM_download({
                url: URL.createObjectURL(blob),
                name: `${title}/#${postNumber}.zip`,
                onload: () => URL.revokeObjectURL(blob),
                onerror: response => {
                    log.post.error(postId, `Error writing zipped file to disk: ${response.error} - ${response.details}`, postNumber);
                    console.log('Trying to write using FileSaver.js...');
                    saveAs(blob, filename); // Fallback for GM_download errors
                },
            });
        } else if (!postSettings.zipped && (postSettings.generateLog || postSettings.generateLinks)) {
            // Only generate a zip with logs/links if not zipping all files, for non-FF
            GM_download({
                url: URL.createObjectURL(blob),
                name: `${title}/#${postNumber}/generated.zip`, // Put it in a subfolder
                onload: () => URL.revokeObjectURL(blob),
                onerror: response => {
                    log.post.error(postId, `Error writing generated.zip to disk: ${response.error} - ${response.details}`, postNumber);
                },
            });
        }
    } else {
        setProcessing(false, postId); // Ensure processing flag is reset even if no files were downloaded
    }

    if (totalDownloadable > 0) {
        if (!postSettings.skipDownload) {
            log.post.info(postId, `::Download completed::`, postNumber);
        } else {
            log.post.info(postId, `::Links generation completed::`, postNumber);
        }
        callbacks?.onComplete?.(totalDownloadable, completed);
    }

    // Clear logs for this post after completion
    window.logs = window.logs.filter(l => l.postId !== postId);
};

/**
 * Adds a "Duplicate Tab" link to a post's attribution area.
 * @param {HTMLElement} postEl The HTML element of the post's attribution.
 */
const addDuplicateTabLink = postEl => {
    const span = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = 'fa fa-copy';
    span.append(icon, ' Duplicate Tab');

    const dupTabLI = postEl.parentNode.querySelector('.u-concealed')?.cloneNode(true);
    if (!dupTabLI) return; // Ensure element exists

    dupTabLI.setAttribute('class', 'duplicate-tab');

    const anchor = dupTabLI.querySelector('a');
    if (anchor) {
        anchor.style.color = 'rgb(138, 138, 138)';
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('href', window.location.href); // Set href to current page to open duplicate
        anchor.querySelector('time')?.remove(); // Use optional chaining
        anchor.parentNode.style.marginLeft = '10px';
        anchor.append(span);
    }

    postEl.parentNode.querySelector('.message-attribution-main')?.append(dupTabLI);
};

/**
 * Adds a "Show Download Page Button" link to a post's attribution area.
 * @param {HTMLElement} postEl The HTML element of the post's attribution.
 */
const addShowDownloadPageBtnLink = postEl => {
    const span = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = 'fa fa-arrow-up';
    span.append(icon, ' Download Page');

    const dupTabLI = postEl.parentNode.querySelector('.u-concealed')?.cloneNode(true);
    if (!dupTabLI) return; // Ensure element exists

    dupTabLI.setAttribute('class', 'show-download-page');

    const anchor = dupTabLI.querySelector('a');
    if (anchor) {
        anchor.style.color = 'rgb(138, 138, 138)';
        anchor.setAttribute('href', '#download-page');
        anchor.querySelector('time')?.remove(); // Use optional chaining
        anchor.parentNode.style.marginLeft = '10px';
        anchor.append(span);
    }

    postEl.parentNode.querySelector('.message-attribution-main')?.append(dupTabLI);
};

/**
 * Adds the main "Download Page" button to the thread.
 * @returns {HTMLAnchorElement} The created button element.
 */
const addDownloadPageButton = () => {
    const downloadAllButton = document.createElement('a');
    downloadAllButton.setAttribute('id', 'download-page');
    downloadAllButton.setAttribute('href', '#');
    downloadAllButton.setAttribute('class', 'button--link button rippleButton');

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.setAttribute('class', 'button-text download-page-btn');
    buttonTextSpan.innerText = `🡳 Download Page`;

    downloadAllButton.appendChild(buttonTextSpan);

    const buttonGroup = h.element('.buttonGroup');
    if (buttonGroup) {
        buttonGroup.prepend(downloadAllButton);
    }

    return downloadAllButton;
};

/**
 * Registers a "like" reaction on the post's footer if not already reacted.
 * @param {HTMLElement} postFooter
 */
const registerPostReaction = postFooter => {
    // Check if the user has already reacted. The target reaction ID (33) might need to be confirmed.
    const hasReaction = postFooter.querySelector('.has-reaction');
    if (!hasReaction) {
        // Find the reaction anchor to simulate a click
        const reactionAnchor = postFooter.querySelector('a[data-xf-click="reaction"]');
        if (reactionAnchor) {
            // Modify the reaction ID in the URL to a specific "like" or positive reaction ID
            const originalHref = reactionAnchor.getAttribute('href');
            if (originalHref) {
                const newHref = originalHref.replace(/_id=\d+/, '_id=33'); // Assuming _id=33 is the desired reaction
                reactionAnchor.setAttribute('href', newHref);
                reactionAnchor.click(); // Simulate click to trigger reaction
            }
        }
    }
};

const parsedPosts = [];
const selectedPosts = [];

(async () => {
    window.addEventListener('beforeunload', e => {
        if (processing.find(p => p.processing)) {
            const message = 'Downloads are in progress. Sure you wanna exit this page?';
            e.returnValue = message;
            return message;
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        const goFileTokenFetchFailedErr = 'Failed to create GoFile token. GoFile albums may not work. Refresh the browser to retry.';

        // GoFile token handling
        if (h.isNullOrUndef(settings.hosts.goFile.token) || settings.hosts.goFile.token.trim() === '') {
            try {
                console.log('Creating GoFile token...');
                const { source } = await h.http.get('https://api.gofile.io/createAccount');
                if (h.isNullOrUndef(source) || source.trim() === '') {
                    console.error(goFileTokenFetchFailedErr);
                } else {
                    const props = JSON.parse(source);
                    if (props.status === 'ok' && props.data?.token) {
                        const token = props.data.token;
                        settings.hosts.goFile.token = token;
                        console.log(`Created GoFile token: ${token}`);
                    } else {
                        console.error(goFileTokenFetchFailedErr);
                    }
                }
            } catch (e) {
                console.error(`${goFileTokenFetchFailedErr} Error: ${e.message}`);
            }
        }

        // Redgifs token handling
        try {
            const { source } = await h.http.get('https://api.redgifs.com/v2/auth/temporary');
            if (h.contains('token', source)) {
                const token = JSON.parse(source).token;
                GM_setValue('redgifs_token', token); // Store token for future use
            }
        } catch (e) {
            console.error(`Error getting temporary redgifs auth token: ${e.message}`);
        }

        init.injectCustomStyles(); // Inject custom CSS styles

        // Initialize Thread Page Caching
        await ThreadCache.init();
        // Example of accessing cached data (for future search/navigation UI)
        // const allPosts = await ThreadCache.getAllCachedPosts();
        // console.log('All cached posts:', allPosts);

        h.elements('.message-attribution-opposite').forEach(post => {
            // Default settings for each post's download configuration
            const postDefaultSettings = {
                zipped: true,
                flatten: false,
                generateLinks: false,
                generateLog: false,
                skipDuplicates: false,
                skipDownload: false,
                verifyBunkrLinks: false,
                output: [], // Stores custom filenames per post
            };

            const parsedPost = parsers.thread.parsePost(post);
            const { content, contentContainer } = parsedPost;

            addDuplicateTabLink(post);
            addShowDownloadPageBtnLink(post);

            const parsedHosts = parsers.hosts.parseHosts(content);

            const getEnabledHostsCB = currentParsedHosts => currentParsedHosts.filter(host => host.enabled);

            if (!parsedHosts.length) {
                return; // Skip if no downloadable resources found for this post
            }

            const getTotalDownloadableResourcesForPostCB = currentParsedHosts => {
                return currentParsedHosts.filter(host => host.enabled && host.resources.length).reduce((acc, host) => acc + host.resources.length, 0);
            };

            // Create and attach the download button to post.
            const { btn: btnDownloadPost } = ui.buttons.addDownloadPostButton(post);
            const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
            const checkedLength = getTotalDownloadableResourcesForPostCB(parsedHosts);
            btnDownloadPost.textContent = `🡳 Download (${checkedLength}/${totalResources})`;

            // Create download status / progress elements.
            const { el: statusTextEl, container: statusTextContainer } = ui.labels.status.createStatusLabel();
            const filePBar = ui.pBars.createFileProgressBar();
            const totalPBar = ui.pBars.createTotalProgressBar();

            // Append status UI elements to the post's content container
            contentContainer.prepend(totalPBar);
            contentContainer.prepend(filePBar);
            contentContainer.prepend(statusTextContainer); // Prepend the container for the label

            h.hide(statusTextContainer); // Hide the label container
            h.hide(filePBar);
            h.hide(totalPBar);

            const onFormSubmitCB = data => {
                const { tippyInstance } = data;
                tippyInstance.hide(); // Hide the tooltip when form is submitted
            };

            ui.forms.config.post.createPostConfigForm(
                parsedPost,
                parsedHosts,
                `#${parsedPost.postNumber}.zip`,
                postDefaultSettings,
                onFormSubmitCB,
                getTotalDownloadableResourcesForPostCB,
                btnDownloadPost,
            );

            const statusUI = {
                status: { el: statusTextEl, container: statusTextContainer }, // Pass the label element and its container
                filePB: filePBar,
                totalPB: totalPBar,
            };

            const postDownloadCallbacks = {
                onComplete: (total, completed) => {
                    if (total > 0 && completed > 0) {
                        registerPostReaction(parsedPost.footer); // React to the post on successful download
                    }
                },
            };

            let getSettingsCB = () => postDefaultSettings; // Closure to provide post-specific settings

            parsedPosts.push({
                parsedPost,
                parsedHosts,
                enabledHostsCB: getEnabledHostsCB,
                resolvers,
                getSettingsCB,
                statusUI,
                postDownloadCallbacks,
            });

            btnDownloadPost.addEventListener('click', e => {
                e.preventDefault();
                downloadPost(parsedPost, parsedHosts, getEnabledHostsCB, resolvers, getSettingsCB, statusUI, postDownloadCallbacks);
            });
        });

        // Initialize "Download Page" button if there are any downloadable posts
        if (parsedPosts.filter(p => p.parsedHosts.length).length > 0) {
            const btnDownloadPage = addDownloadPageButton();

            btnDownloadPage.addEventListener('click', e => {
                e.preventDefault();

                selectedPosts
                    .filter(s => s.enabled)
                    .forEach(s => {
                    downloadPost(
                        s.post.parsedPost,
                        s.post.parsedHosts,
                        s.post.enabledHostsCB,
                        s.post.resolvers,
                        s.post.getSettingsCB,
                        s.post.statusUI,
                        s.post.postDownloadCallbacks,
                    );
                });
            });

            const color = ui.getTooltipBackgroundColor();

            // Create HTML for page-level configuration form
            let html = ui.forms.createCheckbox('config-toggle-all-posts', settings.ui.checkboxes.toggleAllCheckboxLabel, false);

            parsedPosts
                .filter(p => p.parsedHosts.length)
                .forEach(post => {
                const { postId, postNumber, textContent } = post.parsedPost;

                selectedPosts.push({ post, enabled: false }); // Track which posts are selected for page download

                const threadTitle = parsers.thread.parseTitle();
                let defaultPostContent = textContent.trim().replace('​', ''); // Remove zero-width space if present

                const ellipsedText = h.limit(defaultPostContent === '' ? threadTitle : defaultPostContent, 20);

                const summary = `<a id="post-content-${postId}" href="#post-${postId}" style="color: #00E5FF"> ${ellipsedText} </a>`;
                html += ui.forms.createCheckbox(`config-download-post-${postId}`, `Post #${postNumber} ${summary}`, false);
            });

            html = `${ui.forms.createRow(ui.forms.createLabel('Post Selection'))} ${html}`;
            ui.tooltip(btnDownloadPage, ui.forms.config.page.createForm(color, html), {
                placement: 'bottom',
                interactive: true,
                onShown: () => {
                    parsedPosts
                        .filter(p => p.parsedHosts.length)
                        .forEach(post => {
                        const { postId, contentContainer } = post.parsedPost;
                        // Add tooltips for post content summary links
                        ui.tooltip(
                            `#post-content-${postId}`,
                            `<div style="overflow-y: auto; background: rgba(10,19,26,0.85); padding: 16px; width: 500px; max-height: 500px">
                                ${contentContainer.innerHTML}
                            </div>`,
                            { placement: 'right', offset: [10, 15] },
                        );

                        // Event listener for individual post selection checkboxes
                        document.querySelector(`#config-download-post-${postId}`)?.addEventListener('change', e => {
                            const selectedPost = selectedPosts.find(s => s.post.parsedPost.postId === postId);
                            if (selectedPost) {
                                selectedPost.enabled = e.target.checked;
                            }

                            const checkAllCB = h.element('#config-toggle-all-posts');
                            if (checkAllCB) {
                                // Update "toggle all" checkbox based on individual selections
                                checkAllCB.checked = selectedPosts.filter(s => s.enabled).length === parsedPosts.filter(p => p.parsedHosts.length).length;
                            }
                        });

                        // Event listener for "toggle all posts" checkbox
                        h.element('#config-toggle-all-posts')?.addEventListener('change', async e => {
                            e.preventDefault();
                            const checked = e.target.checked;

                            const postCheckboxes = parsedPosts
                                .filter(p => p.parsedHosts.length)
                                .map(p => p.parsedPost)
                                .flatMap(p => h.element(`#config-download-post-${p.postId}`));

                            // Update all individual post checkboxes
                            postCheckboxes.forEach(checkbox => {
                                if (checkbox.checked !== checked) {
                                    checkbox.checked = checked;
                                    checkbox.dispatchEvent(new Event('change')); // Manually trigger change to update selectedPosts array
                                }
                            });
                        });
                    });
                },
            });
        }
    });
})();
