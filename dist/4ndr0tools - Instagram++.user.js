// ==UserScript==
// @name         4ndr0tools - Instagram++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      13.1.0
// @description  Tab-Bar + Dock Integration. Hotkey trigger (Alt+I). Ad-Blocking. Deep-Stack Recovery. Resilient cursor-based pagination. Stories support. Image/video download engine.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Instagram++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Instagram++.user.js
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
 * Consumed via build-time injection into the canon scripts that declare it
 * (tools/build.mjs CANON_KERNEL) — the identifier `__4NDR0_NET_API__` below
 * is script-scope visible to the consumer's IIFE.
 * ═══════════════════════════════════════════════════════════════════════════ */
const __4NDR0_NET_API__ = (function () {
    'use strict';

    const SLOT = '__4NDR0_NET__';
    const VERSION = 4;
    const MAX_SUBS = 32;            /* bounded registry (GUP B.1) */
    const MAX_BODY = 4000000;       /* 4 MB read cap (Blob2URL's wire limit) */
    const XHR_MOCK_DELAY = 40;      /* D6 cadence — mocked XHR responses deliver
                                     * on 40 ms timers so async call sites behave
                                     * exactly as they would against the real
                                     * (hostile) endpoint */

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
     * leave owning the slot) must expose every v4 channel. */
    function isFullHub(h) {
        return !!(h && typeof h.onBody === 'function' && typeof h.onRequest === 'function' &&
            typeof h.onTraffic === 'function' && typeof h.onError === 'function');
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

// 13.0.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.

(function () {
    'use strict';

    // =========================================================
    // [CONFIG]
    // =========================================================
    const CFG = {
        ACCENT:      '#00E5FF',
        BG:          'rgba(10,19,26,0.85)',
        ERROR:       '#ff0055',
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
            `color:${CFG.ACCENT}; font-weight:bold;`, `color:#67E8F9;`);

    // =========================================================
    // [TRUSTED TYPES BYPASS]
    // =========================================================
    if (win.trustedTypes && win.trustedTypes.createPolicy) {
        try { win.trustedTypes.createPolicy('default', { createHTML: s => s }); }
        catch (_) {}
    }

    // =========================================================
    // [INTERCEPT ENGINE — NetHook shared hub (suite v1.4.7)]
    // Hooks Instagram's own fetch/XHR at document-start so we
    // ride on their authenticated, signed requests for free — via
    // kernel/net.js onTraffic response events instead of stacked
    // per-script proxies (one shared page-realm wrap per co-install).
    //
    // Superset notes (GUP): the baseline's XHR load listener read
    // this.responseText unguarded — responseType-locked XHRs (json)
    // threw uncaught inside the listener and never digested. The hub
    // delivers json-XHR bodies pre-stringified, so those feed loads now
    // digest cleanly; fetch bodies arrive from the hub's single bounded
    // read (same digest, no per-subscriber clone). XHR response events
    // prefer responseURL with the open-time shape as fallback — for
    // Instagram's unredirected API endpoints this is the identical URL.
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

    __4NDR0_NET_API__.onTraffic((ev) => {
        if (ev.phase !== 'response') return;
        if (!ev.url || !ev.body || !isFeedUrl(ev.url)) return;
        digestText(ev.url, ev.body);
    });

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
            `background:rgba(10,19,26,0.72);color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};` +
            'border-radius:6px;font-size:14px;line-height:1;cursor:pointer;font-family:"JetBrains Mono",monospace;transition:all 150ms ease-in-out;' +
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
            ph.style.cssText = `height:${item.height}px;width:100%;margin-bottom:80px;background:rgba(10,19,26,0.85);
                border:1px solid rgba(0,229,255,0.2);display:flex;align-items:center;justify-content:center;`;
            const vs = document.createElement('span');
            vs.style.cssText = "color:rgba(103,232,249,0.5);font-family:'JetBrains Mono',monospace;font-size:10px;";
            vs.textContent = 'V-STASIS';
            ph.appendChild(vs);
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
                `border:1px solid rgba(0,229,255,0.35);display:block;cursor:pointer;pointer-events:auto;`;
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
            `font-family:'JetBrains Mono',monospace;font-size:11px;color:${CFG.ACCENT};` +
            `opacity:0.6;text-decoration:none;pointer-events:auto;`;
        label.textContent = `[CODE: ${code || 'N/A'}] [${cur}/${total}]`;
        footer.appendChild(label);

        wrapper.appendChild(footer);

        return wrapper;
    }

    // =========================================================
    // [UI ENGINE]
    // =========================================================
    /* [R3] glyph builder — createElementNS twin of the retired string
     * constant (spin animations preserved: the <style> child rides inside
     * the SVG exactly as before). TT-immune by construction. */
    const buildGlyph = () => {
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 128 128');
        svg.setAttribute('style', `width:24px;height:24px;filter:drop-shadow(0 0 6px ${CFG.ACCENT});`);
        const st = document.createElementNS(SVG_NS, 'style');
        st.textContent = `
            .g1{transform-origin:center;animation:sp 10s linear infinite;}
            .g2{transform-origin:center;animation:sp 15s linear infinite reverse;}
            @keyframes sp{100%{transform:rotate(360deg);}}
        `;
        const p1 = document.createElementNS(SVG_NS, 'path');
        p1.setAttribute('class', 'g1');
        p1.setAttribute('d', 'M64,12 A52,52 0 1 1 63.9,12Z');
        p1.setAttribute('fill', 'none');
        p1.setAttribute('stroke', CFG.ACCENT);
        p1.setAttribute('stroke-dasharray', '21.78 21.78');
        p1.setAttribute('stroke-width', '2');
        const p2 = document.createElementNS(SVG_NS, 'path');
        p2.setAttribute('class', 'g2');
        p2.setAttribute('d', 'M64,20 A44,44 0 1 1 63.9,20Z');
        p2.setAttribute('fill', 'none');
        p2.setAttribute('stroke', CFG.ACCENT);
        p2.setAttribute('stroke-dasharray', '10 10');
        p2.setAttribute('stroke-width', '1.5');
        p2.setAttribute('opacity', '0.7');
        const p3 = document.createElementNS(SVG_NS, 'path');
        p3.setAttribute('d', 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47Z');
        p3.setAttribute('fill', 'none');
        p3.setAttribute('stroke', CFG.ACCENT);
        p3.setAttribute('stroke-width', '3');
        const psi = document.createElementNS(SVG_NS, 'text');
        psi.setAttribute('x', '64');
        psi.setAttribute('y', '76');
        psi.setAttribute('text-anchor', 'middle');
        psi.setAttribute('dominant-baseline', 'middle');
        psi.setAttribute('fill', CFG.ACCENT);
        psi.setAttribute('font-size', '46');
        psi.setAttribute('font-weight', '700');
        psi.setAttribute('font-family', 'monospace');
        psi.textContent = 'Ψ';
        svg.append(st, p1, p2, p3, psi);
        return svg;
    };

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

        const hdr = document.createElement('div');
        hdr.id = 'ares-header';
        hdr.style.cssText = 'position:sticky;top:0;background:rgba(0,0,0,0.95);padding:15px;' +
            'border-bottom:1px solid rgba(0,229,255,0.2);display:flex;justify-content:space-between;align-items:center;' +
            'z-index:2147483648;backdrop-filter:blur(10px);';
        const hdrText = document.createElement('div');
        const hdrTitle = document.createElement('div');
        hdrTitle.style.cssText = `color:${CFG.ACCENT};font-family:monospace;font-weight:900;letter-spacing:1px;`;
        hdrTitle.textContent = 'ARES-9 // SINGULARITY V7.0';
        const hdrStat = document.createElement('div');
        hdrStat.id = 'ares-stat';
        hdrStat.style.cssText = 'color:rgba(103,232,249,0.5);font-family:monospace;font-size:10px;margin-top:4px;';
        hdrStat.textContent = 'INTERCEPTING FEED...';
        hdrText.append(hdrTitle, hdrStat);
        const hdrBtns = document.createElement('div');
        hdrBtns.style.cssText = 'display:flex;gap:12px;align-items:center;';
        const mkBtn = (id, text, css) => {
            const b = document.createElement('button');
            b.id = id;
            b.style.cssText = css;
            b.textContent = text;
            return b;
        };
        hdrBtns.append(
            mkBtn('ares-more', 'LOAD MORE', `background:rgba(10,19,26,0.85);color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};padding:6px 14px;cursor:pointer;font-family:monospace;font-weight:bold;`),
            mkBtn('ares-dlall', '⭳ DOWNLOAD ALL', `background:transparent;color:${CFG.ACCENT};border:1px solid ${CFG.ACCENT};padding:6px 14px;cursor:pointer;font-family:monospace;`),
            mkBtn('ares-dump', 'DUMP HTML', 'background:transparent;color:#67E8F9;border:1px solid rgba(0,229,255,0.35);padding:6px 14px;cursor:pointer;font-family:monospace;'),
            mkBtn('ares-exit', 'EXIT', `background:transparent;color:${CFG.ERROR};border:1px solid #ff0055;padding:6px 16px;cursor:pointer;font-family:monospace;font-weight:bold;`));
        hdr.append(hdrText, hdrBtns);
        const imgWall = document.createElement('div');
        imgWall.id = 'igAllImages';
        imgWall.style.cssText = 'padding:80px 0 300px;display:flex;flex-direction:column;align-items:center;';
        gui.append(hdr, imgWall);

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
            dock.replaceChildren(buildGlyph());
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
            dock.replaceChildren(buildGlyph());
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
                dock.replaceChildren(buildGlyph());
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
