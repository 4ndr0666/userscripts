// ==UserScript==
// @name         4ndr0tools - Blob2URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      7.2.1
// @author       4ndr0666
// @description  Universal blob exfiltration, universal media URL sniffer + wire capture + URL vault (Alt+Shift+V), interactive asset sniffing, CSP/CORS bypass.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Blob2URL.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        unsafeWindow
// @connect      *
// ==/UserScript==

/* ══ kernel/net.js (inlined by tools/build.mjs — edit kernel/, not here) ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/net.js — the NetHook singleton (v1.4.3 restore + hardening;
 * v1.4.5 veto semantics)
 * ----------------------------------------------------------------------------
 * THE co-install interference fix for the network family. Before this module,
 * every network-tapping script installed its own fetch/XHR proxy on shared
 * pages; co-installed, they stacked — Blob2URL's vault over LinkMasterΨ's
 * IG harvester on instagram.com read every response body twice, with wrap
 * chains N scripts deep (the v1.4.3 sink census measured the surface).
 * NetHook installs exactly ONE wrap set per realm and fans every captured
 * body out to isolated suite subscribers.
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
 * Design contract (v2, preserved):
 *   - PAGE REALM FIRST: the slot + wraps live on unsafeWindow when
 *     available (that is where host page fetches live — the same realm
 *     choice the per-script wraps already made), window otherwise.
 *   - LAZY ARM: zero wraps until the first subscriber registers (onBody
 *     OR onRequest) — a co-installed script that only subscribes on its
 *     own host costs nothing anywhere else.
 *   - SINGLE BODY READ: one clone().text() per response, dispatched to
 *     every subscriber — the two-vault double-read on instagram is the
 *     exact failure this replaces. 4 MB read cap (Blob2URL's wire limit).
 *   - FINGERPRINT MASKING: name, length AND toString() of every wrapped
 *     native report the native source (D1-grade — v2 masked toString
 *     only; the defuser facades this replaces kept all three).
 *   - ISOLATION: a throwing subscriber can never break the host page or
 *     its siblings (scoped console.debug, GUP D6 deliberate interception).
 *   - VERSIONED SLOT: `__4NDR0_NET__` on the realm — highest version
 *     wins, never overwritten; the second suite script reuses the first's
 *     wraps through the slot (cross-script memory is the documented interop
 *     exception, same class as window.jQuery/GM_info). A stale v2 slot is
 *     replaced by v3 (higher version); the v2 wraps remain chained
 *     underneath for that transitional co-install generation.
 *
 * Consumed via build-time injection into the canon scripts that declare it
 * (tools/build.mjs CANON_KERNEL) — the identifier `__4NDR0_NET_API__` below
 * is script-scope visible to the consumer's IIFE.
 * ═══════════════════════════════════════════════════════════════════════════ */
const __4NDR0_NET_API__ = (function () {
    'use strict';

    const SLOT = '__4NDR0_NET__';
    const VERSION = 3;
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
    const served = (typeof WeakSet === 'function') ? new WeakSet() : null; /* propagate-armed realms */
    let seq = 0;
    let rseq = 0;

    function dispatch(text) {
        for (const [, fn] of subs) {
            try { fn(text); }
            catch (e) { console.debug('[a4/net] subscriber failed:', (e && e.message) || e); }
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

    /* D1-grade masking: the wrapped native keeps its name, length and
     * source string (hook-detection parity with the Proxy facades this
     * module replaced). */
    function maskNative(wrapped, orig) {
        try { Object.defineProperty(wrapped, 'name', { value: orig.name, configurable: true }); } catch (e) { /* frozen */ }
        try { Object.defineProperty(wrapped, 'length', { value: orig.length, configurable: true }); } catch (e) { /* frozen */ }
        try { wrapped.toString = function () { return String(orig); }; } catch (e) { /* frozen fn */ }
    }

    function mark(fn) {
        try { Object.defineProperty(fn, '__4ndro_net', { value: true, configurable: true }); }
        catch (e) { fn.__4ndro_net = true; }
    }

    /* Fire an on* property handler + the DOM event, best-effort both. */
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

    /* Mocked XHR delivery — D6: full response surface on the 40 ms
     * cadence, responseType 'json' parsed; readystatechange/load/loadend
     * all fire (property handlers AND events). The mocked body is fanned
     * to onBody observers under the standard cap. */
    function scheduleXhrMock(xhr, r, url) {
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
                def('responseURL', url || '');
                if (r.contentType) {
                    try { xhr.getAllResponseHeaders = function () { return 'content-type: ' + r.contentType + '\r\n'; }; }
                    catch (e) { /* locked */ }
                }
                fire(xhr, 'readystatechange');
                fire(xhr, 'load');
                fire(xhr, 'loadend');
                if (bodyStr && bodyStr.length <= MAX_BODY) dispatch(bodyStr);
            } catch (e) { console.debug('[a4/net] xhr mock delivery failed:', (e && e.message) || e); }
        }, XHR_MOCK_DELAY);
    }

    /* Cancelled XHR — native network-failure surface at status 0. */
    function scheduleXhrError(xhr) {
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
            } catch (e) { console.debug('[a4/net] xhr error delivery failed:', (e && e.message) || e); }
        }, 0);
    }

    function armRealm(target) {
        /* fetch — one wrap: request consult first, body tee after */
        try {
            const origFetch = target.fetch;
            if (typeof origFetch === 'function' && !origFetch.__4ndro_net) {
                const wrapped = function () {
                    try {
                        if (reqSubs.size) {
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
                            const req = { url: url, method: method, kind: 'fetch', body: body };
                            const verdict = consult(req);
                            if (verdict) {
                                if (verdict.veto) return Promise.reject(new TypeError('Failed to fetch'));
                                if (verdict.respond) {
                                    const r = verdict.respond;
                                    try {
                                        const opts = { status: r.status || 200, statusText: r.statusText || 'OK' };
                                        if (r.contentType) opts.headers = { 'Content-Type': r.contentType };
                                        const res = new Response(r.body != null ? r.body : '', opts);
                                        if (subs.size && typeof res.clone === 'function') {
                                            res.clone().text().then(function (t) {
                                                if (typeof t === 'string' && t && t.length <= MAX_BODY) dispatch(t);
                                            }).catch(function () { /* synthetic body unreadable */ });
                                        }
                                        return Promise.resolve(res);
                                    } catch (e) {
                                        /* Response unavailable in this realm — a
                                         * vetoed request must never leak to the
                                         * network; degrade to a hard cancel. */
                                        return Promise.reject(new TypeError('Failed to fetch'));
                                    }
                                }
                            }
                            /* body rewrite — only the init.body path is
                             * rewritable (Request objects are immutable; the
                             * per-script facades had the same boundary). A
                             * shallow init copy keeps the caller's object
                             * untouched (the v1.4.4-and-older facades mutated
                             * it in place). */
                            if (init && typeof init === 'object' && init.body != null && req.body !== init.body) {
                                return tee(origFetch.call(this, arguments[0], Object.assign({}, init, { body: req.body })));
                            }
                        }
                    } catch (e) { /* hostile args — defusing must never break the page */ }
                    return tee(origFetch.apply(this, arguments));
                };
                maskNative(wrapped, origFetch);
                mark(wrapped);
                target.fetch = wrapped;
            }
        } catch (e) { console.debug('[a4/net] fetch arm skipped:', (e && e.message) || e); }

        /* XHR — open stashes method/url per instance, send consults */
        try {
            const xo = target.XMLHttpRequest && target.XMLHttpRequest.prototype;
            if (xo && typeof xo.send === 'function' && !xo.__4ndro_net) {
                try { Object.defineProperty(xo, '__4ndro_net', { value: true, configurable: true }); }
                catch (e) { xo.__4ndro_net = true; }
                const origOpen = xo.open;
                if (typeof origOpen === 'function') {
                    const wrappedOpen = function (method, url) {
                        try {
                            const stash = { m: String(method || 'GET'), u: String(url || '') };
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
                    try {
                        if (reqSubs.size) {
                            const stash = this.__4ndro_req;
                            const body = arguments.length > 0 ? arguments[0] : null;
                            const req = { url: stash ? stash.u : '', method: stash ? stash.m : 'GET', kind: 'xhr', body: body };
                            const verdict = consult(req);
                            if (verdict) {
                                if (verdict.veto) { scheduleXhrError(this); return; }
                                if (verdict.respond) { scheduleXhrMock(this, verdict.respond, req.url); return; }
                            }
                            if (arguments.length > 0 && req.body !== body) arguments[0] = req.body; /* fall through: the tee must still see rewritten sends */
                        }
                    } catch (e) { /* non-compliant XHR shim */ }
                    try {
                        if (subs.size) {
                            const xhr = this;
                            xhr.addEventListener('load', function () {
                                try {
                                    let t = '';
                                    if (xhr.responseType === '' || xhr.responseType === 'text') t = xhr.responseText;
                                    else if (xhr.responseType === 'json' && xhr.response) t = JSON.stringify(xhr.response);
                                    if (t) dispatch(t);
                                } catch (e) { /* responseType-locked body */ }
                            }, { once: true });
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
         * rewrites pass through. */
        try {
            const nav = target.navigator;
            if (nav && typeof nav.sendBeacon === 'function' && !nav.sendBeacon.__4ndro_net) {
                const origBeacon = nav.sendBeacon;
                const wrappedBeacon = function () {
                    try {
                        if (reqSubs.size) {
                            const req = { url: String(arguments[0] || ''), method: 'POST', kind: 'beacon', body: arguments.length > 1 ? arguments[1] : null };
                            if (consult(req)) return true;
                            if (arguments.length > 1 && req.body !== arguments[1]) {
                                return origBeacon.call(this, arguments[0], req.body);
                            }
                        }
                    } catch (e) { console.debug('[a4/net] beacon consult failed:', (e && e.message) || e); }
                    return origBeacon.apply(this, arguments);
                };
                maskNative(wrappedBeacon, origBeacon);
                mark(wrappedBeacon);
                try { nav.sendBeacon = wrappedBeacon; } catch (e) { /* read-only navigator */ }
            }
        } catch (e) { console.debug('[a4/net] beacon arm skipped:', (e && e.message) || e); }
    }

    /* Body tee — the v2 single-read contract, unchanged. */
    function tee(p) {
        try {
            if (subs.size) {
                p.then(function (res) {
                    if (res && res.ok && typeof res.clone === 'function') {
                        res.clone().text().then(function (t) {
                            if (typeof t === 'string' && t && t.length <= MAX_BODY) dispatch(t);
                        }).catch(function () { /* body unreadable */ });
                    }
                }).catch(function () { /* request itself failed */ });
            }
        } catch (e) { /* exotic thenable */ }
        return p;
    }

    /* Slot install — higher version wins; a same-version full hub is left
     * alone (the caller already delegated to it). */
    function installSlot(target) {
        try {
            const existing = target[SLOT];
            if (existing === api) return;
            if (existing && existing.version >= VERSION &&
                typeof existing.onBody === 'function' && typeof existing.onRequest === 'function') return;
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
                    if (hub && hub !== api && hub.version >= VERSION && typeof hub.onBody === 'function' && typeof hub.onRequest === 'function') {
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
                    if (hub && hub !== api && hub.version >= VERSION && typeof hub.onBody === 'function' && typeof hub.onRequest === 'function') {
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
        /* propagate(target) -> armed. Arm the wrap set into an additional
         * realm (iframe propagation). Idempotent per target; a realm whose
         * slot is owned by an equal-or-newer full hub is left to that
         * owner. Cross-origin targets are safely inert (every step is
         * guarded). Subscriptions are shared across every realm this
         * module's hub armed. */
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
                        if (owner && owner !== api && owner.version >= VERSION &&
                            typeof owner.onBody === 'function' && typeof owner.onRequest === 'function' &&
                            typeof owner.propagate === 'function') {
                            return owner.propagate(target);
                        }
                    } catch (e) { /* unreadable — arm ourselves */ }
                }
                try {
                    const existing = target[SLOT];
                    if (existing && existing !== api && existing.version >= VERSION &&
                        typeof existing.onBody === 'function' && typeof existing.onRequest === 'function') return false;
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
    };
    return api;
})();



/* ═══ SUITE PROMOTION 7.0.0 ═══════════════════════════════════════════
 * Blob2URLBETA v6.5 promoted: SUPerset gap mitigation (G1..G3) + IG vault render — strict superset of stable v6.3.
 * Retired duplicate: 4ndr0tools - Blob2URL.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

/* ═══ v7.2.0 — suite v1.4.3 TT render class fix (live-proven) ═══
   tt-smoke (tools/tt-smoke.mjs) caught the vault panels DEAD on any
   require-trusted-types-for host: both render() paths assigned innerHTML,
   so the universal URL vault + IG vault could not open — "Failed to set the
   'innerHTML' property on 'Element': This document requires 'TrustedHTML'
   assignment". The renders are now createElement builders (shared el /
   panelHead / glyphEl helpers; the Ψ glyph is createElementNS geometry, the
   CONFIG.glyph string is retired), row buttons carry their payloads through
   setAttribute, and clean()'s textarea innerHTML entity-decode idiom is a
   string decoder (decodeEntities). Escaping discipline is now structural:
   textContent + setAttribute — no HTML assembly anywhere in the panels.

/* ═══ v7.1.3 — suite v1.4.3 NetHook round ═══
   The universal wire capture now subscribes to the shared kernel/net.js singleton
   (build-inlined) instead of installing its own fetch/XHR property wraps. One wrap
   per realm, every response body read once and fanned out to all suite subscribers
   (this vault + the IG module's ingest on instagram.com; LinkMasterΨ's IG harvester
   rides the same hub — the v7.1.2 + LMΨ 6.2.2 co-install read every body twice).
   4 MB per-body cap and res.ok gating preserved from the v7.1.2 wrap. The IG
   module's own deferred net-hook is removed as redundant (vault feed covers it).
   TT-immunity unchanged (no string-sink sites added; parse path untouched).

/* ═══ v6.5 — SUPerset gap mitigation (GUP v5.3 audit; strictly additive, zero regressions) ═══
   G1  Page-context fetch() fallback transport is now hard-bounded by a 45s AbortController
       timeout with timer reclamation on every terminal path — v6.4 could hang forever on a
       stalled cross-origin response, permanently locking the extract button (busy) and every
       IG inFlight entry. The privileged GM transport remains first; the CSP/CORS bypass
       posture is unchanged.
   G2  GM_download terminal failures (onerror/ontimeout) now escalate to the same-origin
       blob: anchor transport — v6.4 only reached the anchor path when a manager lacked the
       API entirely, leaving managers whose GM_download rejects blob: URLs with a dead
       download path. Object-URL revocation still runs on every terminal path.
   G3  The IG vault renders every retained entry (bounded by the 500-entry cap) — v6.4
       sliced rendering to the newest 100, leaving entries 101+ in state but unreachable
       from any UI action.
   G4  The MutationObserver now also watches media-URL attribute mutations
       (src/href/data/srcset/poster, childList fallback retained): a blob: source assigned
       AFTER element insertion (no structural mutation) is hooked within one debounced scan.
       The 100ms debounce — the v6.2 anti-thrash guarantee — is untouched.
   G5  route2() now dedupes within a batch (mirroring ingest()'s net semantics): one DOM
       sweep previously emitted one vault entry per regex OCCURRENCE, so every .mp4 present
       as element attribute + mounted-button title + inline script text (3+ occurrences)
       yielded duplicate vault rows — violating the "dedupe semantics preserved 1:1"
       guarantee for the ig_extract.py port.
   Every v6.1–v6.4 guarantee — privileged-first transports, button UX, MIME/magic-byte
   extension resolution, leak-free download lifecycle, sniffer semantics, hotkeys, per-frame
   operation, duplicate-injection sentinel, IG module routes/ordering/autosave-once, manager
   portability guards, both menu commands — is intact.
*/

/* ═══ v6.4 — 3LECTRIC-GLASS RESKIN + GLYPH BRANDING (aesthetic-only; zero logic touched) ═══
   01  UI realigned to the 4NDR0666OS "3lectric-Glass" GTK3 spec: matrix-green-on-black is
       retired for the alpha-composited glass stack — window rgba(10,19,26,0.72), headerbar
       0.95, controls 0.65, panels 0.55 — with backdrop-filter blur as the web stand-in for
       the RGBA compositor pipeline, containment borders, spatial glows, and the mandated
       150ms ease-in-out transitions on every interactive node. The spec's universal `*`
       reset is deliberately NOT ported (it would restyle host pages); the paradigm is
       scoped to .psi-* nodes only.
   02  Colorimetry: Electric Cyan #00E5FF primary, #67E8F9 hover/highlight, #ff0055
       destructive surfaces (Ψ_ERR, vault close), #ffffff reserved for active/critical
       text; console log chrome follows the same matrix.
   03  Typography: "JetBrains Mono", monospace on all data surfaces; "Orbitron", sans-serif
       weight 700 reserved for the vault header title (spec display font). Strict 0px
       button brutalism, 4px glass-panel geometry, spec scrollbar trough/slider mapping.
   04  Branding: the 4ndr0666 splash glyph (dashed orbit rings, hex shell, Ψ core) ships as
       an inline SVG in the IG vault header and as the @icon data-URI rendered by
       userscript manager dashboards; extract-button labels and menu prefixes keep the Ψ
       sigil. Glyph strokes bind to the spec's Electric Cyan.
   05  Vault header rebuilt as a headerbar (glyph + title + subtitle + controls);
       AUTOSAVE latches to the switch:checked cyan flood; the empty state renders as the
       spec's white-bold notification label. Logic, hotkeys, observers, transports, and
       the extraction pipeline are untouched — every v6.2/v6.3 guarantee holds.
*/

/* ═══ v6.2/v6.3 — superset gap mitigation + IG auto-extract (strictly additive; zero regressions) ═══
   01  Per-document injection sentinel: a second copy of the script (dual install, re-exec)
       aborts before registering any UI, hotkeys, or observers.
   02  hardenedFetch error surface completed: onerror/ontimeout/onabort wired, 45s timeout,
       HTTP status validation (status 0 tolerated for opaque blob: responses), and a
       page-context fetch() fallback transport — the privileged transport stays first, so
       the CSP/CORS bypass is preserved and only failure escalates to the fallback.
   03  GM_download lifecycle completed: onerror/ontimeout handlers, 60s timeout, object-URL
       revocation on every terminal path (v6.1 leaked the URL on failure), anchor-click
       fallback for managers without GM_download.
   04  MIME map extended 6 → 50 types; unknown types derive an extension from the subtype;
       untyped blobs go through a magic-byte sniffer (PNG/JPG/GIF/PDF/WEBP/WAV/AVI/MP4/MOV/
       M4A/AVIF/HEIC/MKV/MP3/OGG/FLAC/ZIP/GZ/BMP/ICO/SVG) before the .bin terminal fallback.
   05  Filenames salted with 4 random chars — rapid extractions can no longer collide.
   06  Extract buttons hardened: type="button" (cannot submit an ancestor form), in-flight
       click lock, self-reverting state labels, safe insertion with appendChild fallback,
       and <source> elements now mount their control after the host <video|audio|picture>
       so it is actually visible and clickable (v6.1 dropped it inside the container).
   07  deploy(): selector extended with iframe/embed/object; supplementary sweep catches
       currentSrc blob URLs that attribute selectors cannot see (MSE-style sources);
       observer re-scans debounced 100ms so mutation-storm SPAs stop thrashing; bootstrap
       is body-ready so document-start execution also survives.
   08  URL resolution unified in resolveMediaUrl(): currentSrc → href → src → data → first
       srcset entry → computed background-image, with non-string candidates filtered
       (v6.1 could throw on SVG anchors exposing SVGAnimatedString).
   09  Sniffer hardened: self-healing mask when host pages rewrite <body>, passive
       mousemove, ESC exits, Enter no longer hijacks editable contexts (v6.1 broke form
       submission while sniffing), blob: captures also drive the full extraction pipeline
       (a raw blob: URL pasted off-page is inert — the file is the actionable artifact),
       clipboard writes fall back to navigator.clipboard/execCommand.
   10  Hotkeys: Alt+S (sniffer; now Alt+B after the v7.1.1 census round) is case-insensitive with modifier/IME/repeat guards and listens in
       the capture phase so page handlers cannot swallow it first.
   11  Manager portability guards for GM_addStyle/GM_setClipboard/GM_download/
       GM_registerMenuCommand with in-page fallbacks — graceful degradation instead of a
       crash on managers lacking the grants.
   12  New command "Ψ: Copy All Discovered Blob URLs" (deduped, newline-joined).
   13  Instagram auto-extract module — faithful JS port of ig_extract.py (FINAL REVISION):
       Route 1 structural walk (video_versions progressive with min-type dedupe;
       video_dash_manifest DASH BaseURLs + FBQualityLabel via DOMParser) and Route 2
       regex fallback net over the surrogate-safe clean() chain (entity decode →
       surrogate pairs → \u singles → \/ \" unescape). Ordering + dedupe semantics
       preserved 1:1 (progressive sorted by type, labeled dash, fallback net).
   14  Live sources the CLI could never reach: best-effort page-context fetch/XHR
       response sniffing (unsafeWindow property wrap — no inline script, CSP-safe,
       fingerprint-masked toString), script[type="application/json"] scanning on every
       debounced re-scan, and a one-shot full-DOM Route 2 sweep. The session is already
       authenticated, so cookies/login-wall juggling is moot; --save maps to the vault
       SAVE/AUTOSAVE actions.
   15  Ψ IG VAULT panel (Alt+J / menu, instagram.com only; was Alt+I before the
       v7.1.1 census round): newest-first entries with
       per-URL SAVE/COPY, URL dedupe index, 500-entry cap, XSS-escaped rendering,
       RESCAN and AUTOSAVE toggle (auto-downloads the best progressive URL of each
       new capture, once per URL).
   16  IG CDN <video> elements get direct extract controls with click-time URL
       re-resolution (survives React element reuse); runExtraction/buildFileName gain
       an optional filename prefix — v6.2 default naming unchanged. Alt+I only binds
       on instagram.com so page shortcuts elsewhere are untouched.
   Superset check: every v6.1 feature — privileged fetch, button UX (labels/states/styles),
   mimeExt table, sniffer (mask/track/capture/toggle), deploy + MutationObserver + lock,
   both menu commands, Alt+S (now Alt+B after the v7.1.1 census round) / Enter hotkeys, per-frame operation, metadata — is intact.
*/

/* ═══ v7.1.0 — UNIVERSAL SNIFFER + URL VAULT (suite v1.3.0) ═════════════════
   The v6/v7 lineage was blob:-centric: outside instagram.com its discovery
   surface was a blob:-only element scan plus the interactive sniffer — as a
   “universal url sniffer and DOM scraper” that was structurally hit-or-miss.
   U1  UNIVERSAL VAULT (Alt+Shift+V, every site): one registry of every
       discovered media URL — DOM-scraped, wire-captured and sniffer-picked —
       with per-URL COPY / SAVE, COPY ALL and RESCAN. 500-entry cap, deduped.
   U2  WIRE CAPTURE: page-context fetch/XHR wraps (property wrap, CSP-safe,
       fingerprint-masked toString — the [14] technique, now universal)
       scan textual response bodies for media URLs (mp4/webm/m3u8/ts/m4s/
       mpd/mkv/mov/flac/jpg/webp/…), so URLs that only ever exist inside
       API/JSON payloads surface without opening devtools. On instagram.com
       the same wrap feeds the IG structural parser (single wrap, no double
       scanning).
   U3  DOM SCRAPE DEPTH: every deploy() sweep also registers element-resolved
       media URLs (video/audio/source/img/iframe/embed/object/anchor, plus
       the data-src lazy family) into the vault — the vault is always the
       complete answer even when no per-element button is mounted.
   U4  EXTRACT-BUTTON REACH: direct (non-blob) media files now mount Ψ_EXTRACT
       controls on A/V-bearing elements (video/audio/source/iframe/embed) —
       previously only IG CDN mp4s qualified. Images/anchors stay vault +
       sniffer territory (a button on every <img> on the internet was the
       v6 design boundary and it stands).
   Every v7.0 guarantee — privileged-first transports, IG module routes,
   vault autosave, G1–G5 mitigations — is intact; this is a strict superset.
*/

(function() {
    'use strict';

    // ──[01] Duplicate-injection sentinel (DOM-based: shared truth across sandbox modes) ──
    const SENTINEL = 'data-psi-blob2url-instance';
    const root = document.documentElement;
    if (!root || (root.hasAttribute && root.hasAttribute(SENTINEL))) return;
    try { root.setAttribute(SENTINEL, String(Date.now())); } catch (_) {}

    const SCRIPT_ID = 'Ψ-blob2url';
    const log = (m) => console.log(`%c[${SCRIPT_ID}] %c${m}`, "color: #00E5FF; font-weight: bold;", "color: #67E8F9;");

    const CONFIG = {
        styles: `
            /* ═══ 3LECTRIC-GLASS PARADIGM — web port of the 4NDR0666OS GTK3 spec ═══
               base rgba(10,19,26,α) glass · #00E5FF primary · #67E8F9 hover · #ff0055 purge
               all interactive nodes: transition all 150ms ease-in-out (spec §2.2) */

            .psi-btn { margin-left:8px; padding:3px 10px; color:#00E5FF; background:rgba(10,19,26,0.65); border:1px solid rgba(0,229,255,0.4); border-radius:0; cursor:crosshair; z-index:2147483647; font-family:"JetBrains Mono", monospace; font-size:10px; font-weight:bold; text-transform:uppercase; white-space:nowrap; backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); transition:all 150ms ease-in-out; }
            .psi-btn:hover { background:rgba(0,229,255,0.2); border-color:#00E5FF; box-shadow:0 0 20px rgba(0,229,255,0.5); color:#67E8F9; }
            .psi-btn:active { background:rgba(0,229,255,0.3); color:#ffffff; }
            .psi-btn.loading { background:rgba(10,19,26,0.55); color:rgba(0,229,255,0.55); border-color:rgba(0,229,255,0.25); box-shadow:none; }
            .psi-btn.success { background:rgba(0,229,255,0.3); border-color:#00E5FF; color:#ffffff; box-shadow:0 0 20px rgba(0,229,255,0.5); }
            .psi-btn.fail { background:rgba(255,0,85,0.3); border-color:#ff0055; color:#ffffff; box-shadow:0 0 25px #ff0055; }

            .psi-sniff-mask { background:rgba(0,229,255,0.1); border:1px solid #00E5FF; box-shadow:0 0 12px rgba(0,229,255,0.8); position:fixed; z-index:10000; pointer-events:none; }

            .psi-ig-panel { position:fixed; right:12px; bottom:12px; max-width:440px; max-height:46vh; overflow-y:auto; background:rgba(10,19,26,0.72); border:1px solid rgba(0,229,255,0.2); border-radius:4px; box-shadow:0 0 40px rgba(0,229,255,0.15); color:#00E5FF; font-family:"JetBrains Mono", monospace; font-size:10px; z-index:2147483647; backdrop-filter:blur(10px) saturate(130%); -webkit-backdrop-filter:blur(10px) saturate(130%); scrollbar-width:thin; scrollbar-color:#00E5FF rgba(0,0,0,0.4); }
            .psi-ig-panel::-webkit-scrollbar { width:8px; height:8px; }
            .psi-ig-panel::-webkit-scrollbar-track { background:rgba(0,0,0,0.4); }
            .psi-ig-panel::-webkit-scrollbar-thumb { background:#00E5FF; border-radius:0; }
            .psi-ig-panel::-webkit-scrollbar-thumb:hover { background:#67E8F9; }

            .psi-ig-head { position:sticky; top:0; z-index:5; display:flex; align-items:center; flex-wrap:wrap; gap:6px; background:rgba(10,19,26,0.95); border-bottom:2px solid #00E5FF; border-radius:3px 3px 0 0; padding:6px 8px; color:#00E5FF; }
            .psi-glyph { width:20px; height:20px; flex:0 0 auto; display:block; }
            .psi-ig-title { font-family:"Orbitron", sans-serif; font-size:14px; font-weight:700; color:#67E8F9; letter-spacing:1px; }
            .psi-ig-sub { font-family:"JetBrains Mono", monospace; font-size:9px; color:rgba(0,229,255,0.7); margin-right:auto; }
            .psi-ig-entry { border-bottom:1px solid rgba(0,229,255,0.15); padding:4px 7px; }
            .psi-ig-tag { font-weight:bold; color:#00E5FF; }
            .psi-ig-code { color:#67E8F9; margin-left:6px; }
            .psi-ig-url { color:rgba(0,229,255,0.7); word-break:break-all; margin:2px 0 3px 0; }
            .psi-ig-empty { color:#ffffff; font-weight:bold; }
            .psi-ig-act { margin:1px 4px 0 0; padding:2px 7px; color:#00E5FF; background:rgba(10,19,26,0.55); border:1px solid rgba(0,229,255,0.4); border-radius:0; cursor:pointer; font-family:"JetBrains Mono", monospace; font-size:9px; font-weight:bold; text-transform:uppercase; transition:all 150ms ease-in-out; }
            .psi-ig-act:hover { background:rgba(0,229,255,0.2); border-color:#00E5FF; color:#67E8F9; box-shadow:0 0 20px rgba(0,229,255,0.5); }
            .psi-ig-act:active { background:rgba(0,229,255,0.3); color:#ffffff; }
            .psi-ig-head .psi-ig-act { margin:0; }
            .psi-ig-act.psi-ig-on { background:rgba(0,229,255,0.2); border-color:#00E5FF; color:#ffffff; box-shadow:0 0 12px rgba(0,229,255,0.8); }
            .psi-ig-act.psi-ig-close { border-color:#ff0055; color:#ff0055; }
            .psi-ig-act.psi-ig-close:hover { background:rgba(255,0,85,0.3); border-color:#ff0055; color:#ffffff; box-shadow:0 0 25px #ff0055; }
        `,
        labels: { init: "Ψ_EXTRACT", load: "Ψ_PROC...", win: "Ψ_DONE", fail: "Ψ_ERR" },
        mimeExt: {
            // v6.1 set (preserved)
            'video/mp4':'.mp4', 'video/webm':'.webm',
            'image/png':'.png', 'image/jpeg':'.jpg', 'image/webp':'.webp',
            'application/pdf':'.pdf',
            // v6.2 coverage
            'video/quicktime':'.mov', 'video/x-matroska':'.mkv', 'video/x-msvideo':'.avi',
            'video/ogg':'.ogv', 'video/mp2t':'.ts', 'video/3gpp':'.3gp', 'video/x-flv':'.flv',
            'image/gif':'.gif', 'image/svg+xml':'.svg', 'image/bmp':'.bmp', 'image/tiff':'.tiff',
            'image/avif':'.avif', 'image/apng':'.png', 'image/x-icon':'.ico',
            'image/vnd.microsoft.icon':'.ico', 'image/heic':'.heic', 'image/heif':'.heif',
            'audio/mpeg':'.mp3', 'audio/mp4':'.m4a', 'audio/x-m4a':'.m4a', 'audio/aac':'.aac',
            'audio/ogg':'.ogg', 'audio/wav':'.wav', 'audio/x-wav':'.wav', 'audio/webm':'.weba',
            'audio/flac':'.flac',
            'text/plain':'.txt', 'text/csv':'.csv', 'text/html':'.html', 'text/css':'.css',
            'text/javascript':'.js', 'application/json':'.json', 'application/xml':'.xml',
            'application/rtf':'.rtf', 'application/zip':'.zip', 'application/gzip':'.gz',
            'application/x-tar':'.tar', 'application/x-7z-compressed':'.7z',
            'application/wasm':'.wasm',
            'font/woff':'.woff', 'font/woff2':'.woff2', 'font/ttf':'.ttf', 'font/otf':'.otf'
        }
    };

    // ──[11] Style injection with manager fallback ──
    const injectStyles = (css) => {
        try {
            if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }
        } catch (_) {}
        try {
            const s = document.createElement('style');
            s.textContent = css;
            (document.head || document.documentElement).appendChild(s);
        } catch (_) {}
    };
    injectStyles(CONFIG.styles);

    // ──[11] Clipboard with escalation chain (GM → async API → execCommand) ──
    const fallbackCopy = (text) => {
        try {
            const ta = document.createElement('textarea');
            ta.value = String(text);
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            return !!ok;
        } catch (_) { return false; }
    };
    const copyText = (text) => new Promise((resolve) => {
        try {
            if (typeof GM_setClipboard === 'function') { GM_setClipboard(String(text)); resolve(true); return; }
        } catch (_) {}
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(String(text)).then(() => resolve(true), () => resolve(fallbackCopy(text)));
            return;
        }
        resolve(fallbackCopy(text));
    });

    /* v7.1.2 (suite v1.4.2 TT class fix): Blob2URL is universal-scope
     * (wildcard match), so the DASH-manifest parse must survive
     * require-trusted-types-for 'script' hosts. Mint an identity policy
     * where allowed; raw fallback otherwise (the existing try/catch at
     * the parse site degrades gracefully). */
    const TTwrapXML = (() => {
        let policy = null, tried = false;
        return (s) => {
            if (!tried) {
                tried = true;
                try {
                    const TT = window.trustedTypes;
                    if (TT && typeof TT.createPolicy === 'function')
                        policy = TT.createPolicy('4ndr0666tools#b2u', { createHTML: (v) => v });
                } catch (e) { policy = null; }
            }
            return policy ? policy.createHTML(s) : s;
        };
    })();

    // ──[08] Unified, type-safe URL resolution (superset of every v6.1 path) ──
    const firstSrcsetUrl = (el) => {
        try {
            const ss = el.getAttribute && el.getAttribute('srcset');
            if (!ss) return '';
            const first = ss.split(',')[0].trim();
            return first ? first.split(/\s+/)[0] : '';
        } catch (_) { return ''; }
    };
    const resolveMediaUrl = (el) => {
        try {
            if (!el || el.nodeType !== 1) return '';
            const candidates = [el.currentSrc, el.href, el.src, el.data, firstSrcsetUrl(el)];
            for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                if (typeof c === 'string' && c) return c;
            }
            const bg = getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
                const m = bg.match(/url\(["']?(.*?)["']?\)/);
                if (m && m[1]) return m[1];
            }
        } catch (_) {}
        return '';
    };

    // ──[02] Transports: privileged first (CSP/CORS bypass), page-context fallback second ──
    const gmFetch = (url) => new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GM_xmlhttpRequest unavailable')); return; }
        let settled = false;
        const fail = (msg) => { if (!settled) { settled = true; reject(new Error(msg)); } };
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                timeout: 45000,
                onload: (res) => {
                    if (settled) return;
                    const status = res && typeof res.status === 'number' ? res.status : -1;
                    const body = res && res.response;
                    const statusOk = (status >= 200 && status < 300) || status === 0; // 0 = opaque blob:/file: on some managers
                    if (statusOk && body) { settled = true; resolve(body); }
                    else if (status >= 400) fail(`HTTP ${status} via privileged transport`);
                    else if (!body) fail(`empty response body (HTTP ${status})`);
                    else fail(`unexpected HTTP status ${status}`);
                },
                onerror: (err) => fail(`network error${err && err.error ? ': ' + err.error : ''}`),
                ontimeout: () => fail('privileged transport timeout (45s)'),
                onabort: () => fail('privileged transport aborted')
            });
        } catch (err) { fail('GM_xmlhttpRequest threw: ' + (err && err.message ? err.message : err)); }
    });
    const pageFetch = (url) => new Promise((resolve, reject) => {
        if (typeof fetch !== 'function') { reject(new Error('page transport unavailable')); return; }
        // [G1] Hard timeout on the fallback transport too — v6.4 could hang forever here,
        // permanently locking the extract button (busy) and every IG inFlight entry.
        const ctl = (typeof AbortController === 'function') ? new AbortController() : null;
        const timer = ctl ? setTimeout(() => { try { ctl.abort(); } catch (_) {} }, 45000) : null;
        let settled = false;
        const settle = (fn, val) => { if (settled) return; settled = true; if (timer !== null) clearTimeout(timer); fn(val); };
        fetch(url, ctl ? { signal: ctl.signal } : undefined).then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' via page transport');
            return r.blob();
        }).then((b) => settle(resolve, b), (err) => settle(reject, new Error(
            err && err.name === 'AbortError' ? 'page transport timeout (45s)'
            : (err && err.message ? err.message : 'page transport failed'))));
    });
    const hardenedFetch = (url) => gmFetch(url).catch((gmErr) =>
        pageFetch(url).catch((pageErr) => {
            throw new Error('all transports failed — ' + gmErr.message + ' | ' + pageErr.message);
        })
    );

    // ──[04] Extension resolution: MIME table → subtype → magic bytes → .bin ──
    const extForMime = (type) => {
        const t = String(type || '').split(';')[0].trim().toLowerCase();
        if (CONFIG.mimeExt[t]) return CONFIG.mimeExt[t];
        if (t && t !== 'application/octet-stream') {
            const sub = t.split('/')[1];
            if (sub) {
                const cleaned = sub.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
                if (cleaned) return '.' + cleaned;
            }
        }
        return '';
    };
    const sniffExt = async (blob) => {
        try {
            if (!blob || typeof blob.size !== 'number' || !blob.size || typeof blob.slice !== 'function') return '';
            const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
            if (head.length < 4) return '';
            const eq = (i, s) => { for (let j = 0; j < s.length; j++) if (head[i + j] !== s.charCodeAt(j)) return false; return true; };
            if (eq(0, '\x89PNG')) return '.png';
            if (eq(0, '\xFF\xD8\xFF')) return '.jpg';
            if (eq(0, 'GIF8')) return '.gif';
            if (eq(0, '%PDF')) return '.pdf';
            if (eq(0, 'RIFF')) {
                if (eq(8, 'WEBP')) return '.webp';
                if (eq(8, 'WAVE')) return '.wav';
                if (eq(8, 'AVI ')) return '.avi';
            }
            if (eq(4, 'ftyp') && head.length >= 12) {
                const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
                if (/^(avif|avis)/i.test(brand)) return '.avif';
                if (/^(heic|heix|hevc|mif1|msf1)/i.test(brand)) return '.heic';
                if (eq(8, 'qt  ')) return '.mov';
                if (/^M4[AB]/.test(brand)) return '.m4a';
                if (/^3gp/i.test(brand)) return '.3gp';
                return '.mp4';
            }
            if (eq(0, '\x1A\x45\xDF\xA3')) return '.mkv';
            if (eq(0, 'ID3')) return '.mp3';
            if (head[0] === 0xFF && (head[1] & 0xE0) === 0xE0) return '.mp3';
            if (eq(0, 'OggS')) return '.ogg';
            if (eq(0, 'fLaC') || eq(0, 'FLAC')) return '.flac';
            if (eq(0, 'PK\x03\x04') || eq(0, 'PK\x05\x06') || eq(0, 'PK\x07\x08')) return '.zip';
            if (eq(0, '\x1F\x8B')) return '.gz';
            if (eq(0, 'BM')) return '.bmp';
            if (eq(0, '\x00\x00\x01\x00')) return '.ico';
            if (eq(0, '<svg') || eq(0, '<?xml') || eq(0, '<SVG')) return '.svg';
            return '';
        } catch (_) { return ''; }
    };

    // ──[03] Download lifecycle: leak-free on every terminal path + manager fallback ──
    const downloadBlob = (blob, name) => new Promise((resolve, reject) => {
        let dlUrl = '';
        try { dlUrl = URL.createObjectURL(blob); }
        catch (err) { reject(new Error('createObjectURL failed: ' + (err && err.message ? err.message : err))); return; }
        let done = false;
        const finish = (ok, msg) => {
            if (done) return;
            done = true;
            // Grace period lets the downloader drain the URL, then it is always reclaimed.
            setTimeout(() => { try { URL.revokeObjectURL(dlUrl); } catch (_) {} }, 10000);
            if (ok) resolve();
            else reject(new Error(msg || 'download failed'));
        };
        // [G2] Anchor transport extracted: same-origin blob: URLs honor the download
        // attribute, so this path never navigates the tab. It is now also the escalation
        // target when GM_download terminates in failure — v6.4 only reached it when the
        // manager lacked the API entirely, leaving managers whose GM_download rejects
        // blob: URLs with a dead download path.
        const anchorTransport = () => {
            try {
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = name;
                a.rel = 'noopener';
                a.style.display = 'none';
                (document.body || document.documentElement).appendChild(a);
                a.click();
                setTimeout(() => { try { a.remove(); } catch (_) {} }, 0);
                return true; // anchor transport is fire-and-forget: no synchronous error channel
            } catch (err) { return false; }
        };
        if (typeof GM_download === 'function') {
            try {
                GM_download({
                    url: dlUrl,
                    name: name,
                    timeout: 60000,
                    onload: () => finish(true),
                    onerror: (err) => {
                        if (anchorTransport()) finish(true);
                        else finish(false, 'GM_download error' + (err && err.error ? ': ' + err.error : err && err.message ? ': ' + err.message : ''));
                    },
                    ontimeout: () => {
                        if (anchorTransport()) finish(true);
                        else finish(false, 'GM_download timeout (60s)');
                    }
                });
                return;
            } catch (_) { /* fall through to anchor transport */ }
        }
        if (anchorTransport()) finish(true);
        else finish(false, 'anchor fallback failed');
    });

    // ──[05] Shared extraction pipeline (buttons and sniffer converge here) ──
    const buildFileName = (ext, prefix) =>
        `${prefix || 'exfiltrated'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext || '.bin'}`;

    // v7.1 [U4]: direct-media predicate for A/V-bearing elements.
    const DIRECT_MEDIA_RE = /\.(mp4|webm|mkv|mov|avi|flv|m4v|mp3|m4a|ogg|wav|flac|aac|m3u8|ts|m4s|mpd)([?#]|$)/i;
    const isDirectMediaUrl = (url) => typeof url === 'string' && DIRECT_MEDIA_RE.test(url.split('#')[0]);

    const runExtraction = async (url, opts) => {
        try {
            const blob = await hardenedFetch(url);
            if (!blob || typeof blob.size !== 'number') throw new Error('transport returned a non-blob payload');
            const ext = extForMime(blob.type) || (await sniffExt(blob)) || '.bin';
            const name = buildFileName(ext, opts && opts.namePrefix);
            await downloadBlob(blob, name);
            log(`EXTRACTED → ${name} (${(blob.size / 1024).toFixed(1)} KiB)`);
            return true;
        } catch (err) {
            log(`Extraction failed: ${err && err.message ? err.message : err}`);
            return false;
        }
    };

    // Core blob hooking (v6.1 engine, hardened)
    const hookAsset = (el, opts) => {
        const url = resolveMediaUrl(el);
        if (!url) return;
        const isBlob = url.indexOf('blob:') === 0;
        // Direct (non-blob) hooking: IG CDN media under opts.allowDirect (v6)
        // — v7.1 [U4] extends the same opt-in to ANY A/V-bearing element
        // (video/audio/source/iframe/embed) whose resolved URL is a media
        // file. Images/anchors remain vault + sniffer territory.
        const tag = (el.tagName || '').toUpperCase();
        const isAvElement = tag === 'VIDEO' || tag === 'AUDIO' || tag === 'SOURCE' || tag === 'IFRAME' || tag === 'EMBED';
        if (!isBlob && !(opts && opts.allowDirect && (IG.isIgVideoUrl(url) || (isAvElement && isDirectMediaUrl(url))))) return; // no lock set → element re-checked on later scans

        // [06] <source> lives inside <video|audio|picture> where sibling buttons never
        // render — mount the control after the host media element instead.
        const host = (el.tagName === 'SOURCE') ? (el.closest('video, audio, picture') || el) : el;
        const lock = (node) => { try { node.setAttribute('data-psi-locked', 'true'); } catch (_) {} };
        if (host.hasAttribute('data-psi-locked')) { lock(el); return; } // one control per hook target
        lock(host);
        if (el !== host) lock(el);

        const btn = document.createElement('button');
        btn.type = 'button'; // [06] never submits an ancestor <form> (default type is "submit")
        btn.className = 'psi-btn';
        btn.textContent = CONFIG.labels.init;
        btn.title = `Ψ extract: ${url.slice(0, 80)}${url.length > 80 ? '...' : ''}`;

        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.dataset.busy === '1') return; // in-flight guard: idempotent clicks
            btn.dataset.busy = '1';
            btn.textContent = CONFIG.labels.load;
            btn.classList.add('loading');
            // Click-time re-resolution survives React-style element reuse (src swap).
            const ok = await runExtraction(resolveMediaUrl(el) || url, opts);
            btn.textContent = ok ? CONFIG.labels.win : CONFIG.labels.fail;
            btn.classList.remove('loading');
            btn.classList.add(ok ? 'success' : 'fail');
            btn.dataset.busy = '0';
            // Terminal states auto-revert so the control visibly signals re-clickability.
            setTimeout(() => {
                if (btn.dataset.busy !== '1') {
                    btn.textContent = CONFIG.labels.init;
                    btn.classList.remove('success', 'fail');
                }
            }, 2500);
        };

        try {
            host.insertAdjacentElement('afterend', btn);
        } catch (_) {
            try { (host.parentNode || document.body).appendChild(btn); } catch (_) { return; }
        }
    };

    // ──[07] Heuristic DOM engine ──
    const DEPLOY_SELECTOR = 'a[href^="blob:"], img[src^="blob:"], video[src^="blob:"], audio[src^="blob:"], source[src^="blob:"], iframe[src^="blob:"], embed[src^="blob:"], object[data^="blob:"]';
    const deploy = () => {
        try {
            document.querySelectorAll(DEPLOY_SELECTOR).forEach((el) => hookAsset(el));
            // Attribute selectors cannot see MSE-selected currentSrc (property-only change).
            document.querySelectorAll('video, audio, img').forEach((el) => {
                const cs = el.currentSrc;
                if (typeof cs === 'string' && cs.indexOf('blob:') === 0) hookAsset(el);
            });
            // v7.1 [U4]: direct-media extract controls on A/V-bearing elements
            // (any media file, any site — the v6 IG-only gate opened here).
            document.querySelectorAll('video, audio, source, iframe, embed').forEach((el) => {
                const url = resolveMediaUrl(el);
                if (url && isDirectMediaUrl(url)) hookAsset(el, { allowDirect: true });
            });
            // v7.1 [U3]: every sweep also feeds the universal vault.
            VAULT.scrapeDom();
            if (IG.active) { IG.scanNewScripts(); IG.sweep(); }
        } catch (err) { log('scan error: ' + (err && err.message ? err.message : err)); }
    };
    let deployTimer = null;
    const scheduleDeploy = () => {
        if (deployTimer !== null) return;
        deployTimer = setTimeout(() => { deployTimer = null; deploy(); }, 100);
    };
    const observer = new MutationObserver(scheduleDeploy);
    // [G4] v6.4 watched childList only: an element whose blob: src/href/data/srcset is
    // assigned AFTER insertion (no structural mutation — React property/attribute sets)
    // was never re-scanned, and the supplementary currentSrc sweep never ran because
    // deploy() itself never fired. Media-URL attribute changes now re-arm the debounced
    // scan; the 100ms debounce keeps mutation-storm SPAs from thrashing (v6.2 §07 intact).
    try {
        observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'data', 'srcset', 'poster'] });
    } catch (_) {
        try { observer.observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}
    }

    // Interactive sniffer (v6.1 engine, hardened)
    let sniffMode = false;
    const sniffer = {
        mask: document.createElement('div'),
        activeEl: null,
        init() {
            this.mask.className = 'psi-sniff-mask';
            this.mask.style.display = 'none';
            this.ensureMask();
        },
        ensureMask() {
            // [09] Host pages that rewrite <body> can orphan the mask — self-heal on demand.
            if (!this.mask.isConnected) {
                try { (document.body || document.documentElement).appendChild(this.mask); } catch (_) {}
            }
            return this.mask;
        },
        toggle() {
            sniffMode = !sniffMode;
            log(`Sniffer ${sniffMode ? 'ACTIVE // MOVE CURSOR + ENTER TO CAPTURE (ESC exits)' : 'OFF'}`);
            this.ensureMask().style.display = sniffMode ? 'block' : 'none';
            if (sniffMode) document.addEventListener('mousemove', this.track, { passive: true });
            else {
                document.removeEventListener('mousemove', this.track);
                this.activeEl = null;
            }
        },
        track: (e) => {
            let el = null;
            try { el = document.elementFromPoint(e.clientX, e.clientY); } catch (_) { return; }
            if (!el || el === document.body || el === document.documentElement || el === sniffer.mask) return;
            const rect = el.getBoundingClientRect();
            Object.assign(sniffer.mask.style, {
                width: `${rect.width + 4}px`,
                height: `${rect.height + 4}px`,
                left: `${rect.left - 2}px`,
                top: `${rect.top - 2}px`
            });
            sniffer.activeEl = el;
        },
        capture() {
            if (!sniffer.activeEl) return;
            const url = resolveMediaUrl(sniffer.activeEl);
            if (!url) { log('No URL detected'); return; }
            // v7.1 [U1]: sniffer picks land in the universal vault too.
            if (/^https?:/i.test(url)) VAULT.add(url, 'snif', 'picker');
            copyText(url).then((ok) => {
                log(ok
                    ? `CAPTURED → clipboard: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`
                    : `CAPTURED (clipboard blocked) — URL: ${url}`);
            });
            // [09] blob: URLs are page-scoped: pasted anywhere else they are inert. Route
            // them through the full extraction pipeline so Enter yields the actual file.
            if (url.indexOf('blob:') === 0) runExtraction(url);
            // Sniffer stays active after capture (v6.1 semantics preserved)
        }
    };

    // ═══[13–16] IG AUTO-EXTRACT MODULE — JS port of ig_extract.py (FINAL REVISION) ═══
    const MP4_RE = /https:\/\/[^\s"'<>\\]+?\.mp4(?:\?[^\s"'<>\\]*)?/g;
    /* v7.2.0 (suite v1.4.3 TT render class fix): the vault renders are
     * built through createElement — the v7.1.x panel-head/row innerHTML
     * renders died on require-trusted-types-for hosts (tt-smoke live
     * proof: "Failed to set the 'innerHTML' property on 'Element'"),
     * taking the whole vault UI with them. esc() string-escaping is
     * retired with them: attributes now go through setAttribute, text
     * through textContent — no HTML assembly anywhere in the panels. */
    const el = (tag, cls) => {
        const n = document.createElement(tag);
        if (cls) n.className = cls;
        return n;
    };
    /* Ψ glyph via createElementNS — same geometry as the retired
     * CONFIG.glyph string (innerHTML of an SVG string is a TT sink). */
    const glyphEl = () => {
        const NS = 'http://www.w3.org/2000/svg';
        const svgEl = (tag, attrs) => {
            const n = document.createElementNS(NS, tag);
            for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
            return n;
        };
        const svg = svgEl('svg', { class: 'psi-glyph', viewBox: '0 0 128 128', xmlns: NS, fill: 'none',
            stroke: '#00E5FF', 'stroke-width': '3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' });
        svg.appendChild(svgEl('path', { d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z', 'stroke-dasharray': '21.78 21.78', 'stroke-width': '2' }));
        svg.appendChild(svgEl('path', { d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z', 'stroke-dasharray': '10 10', 'stroke-width': '1.5', opacity: '0.7' }));
        svg.appendChild(svgEl('path', { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z' }));
        const psi = svgEl('text', { x: '64', y: '67', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
            fill: '#00E5FF', stroke: 'none', 'font-size': '56', 'font-weight': '700', 'font-family': 'Cinzel Decorative, serif' });
        psi.textContent = '\u03A8';
        svg.appendChild(psi);
        return svg;
    };
    const panelHead = (title, sub, buttons) => {
        const head = el('div', 'psi-ig-head');
        head.appendChild(glyphEl());
        const t = el('span', 'psi-ig-title');
        t.textContent = title;
        head.appendChild(t);
        const sb = el('span', 'psi-ig-sub');
        sb.textContent = sub;
        head.appendChild(sb);
        for (const b of buttons) {
            const btn = el('button', 'psi-ig-act' + (b.on ? ' psi-ig-on' : '') + (b.cls ? ' ' + b.cls : ''));
            btn.setAttribute('data-psi-act', b.act);
            btn.textContent = b.label;
            head.appendChild(btn);
        }
        return head;
    };
    /* String entity decoder — replaces the textarea innerHTML decode
     * idiom in clean() (a TrustedHTML sink under enforcement). Named set
     * covers the entities the IG payloads actually carry; numeric dec/hex
     * covers the rest. */
    const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0',
        copy: '\u00A9', reg: '\u00AE', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
        lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D', deg: '\u00B0',
        middot: '\u00B7', bull: '\u2022', dagger: '\u2020', permil: '\u2030',
        lsaquo: '\u2039', rsaquo: '\u203A', euro: '\u20AC', pound: '\u00A3', yen: '\u00A5',
        cent: '\u00A2', sect: '\u00A7', para: '\u00B6', plusmn: '\u00B1', times: '\u00D7',
        divide: '\u00F7', frac12: '\u00BD', sup2: '\u00B2', sup3: '\u00B3', micro: '\u00B5' };
    const decodeEntities = (str) => String(str).replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e) => {
        if (e[0] === '#') {
            const code = (e[1] === 'x' || e[1] === 'X') ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            if (!Number.isFinite(code) || code <= 0 || code > 0x10FFFF) return m;
            try { return String.fromCodePoint(code); } catch (_) { return m; }
        }
        return NAMED_ENTITIES[e] || m;
    });

    const IG = {
        active: false,
        autoSave: false,
        entries: [],          // newest-first: {kind, type, label, url, code}
        index: new Set(),     // URL dedupe
        autoSaved: new Set(), // URLs already auto-downloaded
        inFlight: new Set(),
        panel: null,
        renderTimer: null,

        init() {
            const host = String((location && location.hostname) || '').toLowerCase();
            this.active = /(^|\.)instagram\.com$/.test(host);
            if (!this.active) return;
            // v7.1.3: net route removed — the universal vault's NetHook
            // subscription (installNetHook above) feeds IG.ingest for every
            // captured body on instagram.com (single-wrap, single-read).
            log('IG module ONLINE — vault-fed net route + DOM routes armed (Alt+J vault)');
            this.scanNewScripts();
            // One-shot Route 2 over the full DOM (deferred until the initial render settles).
            setTimeout(() => { try { this.route2(document.documentElement.outerHTML || ''); } catch (_) {} }, 1500);
        },

        // ──[13] Route 1 walk (video_versions progressive + video_dash_manifest DASH) ──
        walk(node, prog, dash) {
            try {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { for (const v of node) this.walk(v, prog, dash); return; }
                const vv = node.video_versions;
                if (Array.isArray(vv)) {
                    for (const entry of vv) {
                        if (entry && typeof entry.url === 'string' && entry.url) {
                            const t = entry.type || 999;
                            prog.set(entry.url, Math.min(prog.has(entry.url) ? prog.get(entry.url) : 999, t));
                        }
                    }
                }
                const manifest = node.video_dash_manifest;
                if (typeof manifest === 'string' && manifest) {
                    try {
                        const doc = new DOMParser().parseFromString(TTwrapXML(manifest), 'application/xml');
                        const reps = doc.getElementsByTagName('Representation');
                        for (let i = 0; i < reps.length; i++) {
                            const bases = reps[i].getElementsByTagName('BaseURL');
                            if (bases.length && bases[0].textContent) {
                                const label = reps[i].getAttribute('FBQualityLabel') || '?';
                                const url = bases[0].textContent.trim().replace(/&amp;/g, '&');
                                if (url) dash.push([label, url]);
                            }
                        }
                    } catch (_) {}
                }
                for (const key in node) this.walk(node[key], prog, dash);
            } catch (_) {}
        },

        // Shortcode hunt for human-friendly filenames (additive, no effect on extraction).
        findCode(node) {
            try {
                if (!node || typeof node !== 'object') return '';
                if (Array.isArray(node)) { for (const v of node) { const c = this.findCode(v); if (c) return c; } return ''; }
                const c = node.shortcode || node.code;
                if (typeof c === 'string' && /^[A-Za-z0-9_-]{4,32}$/.test(c)) return c;
                for (const key in node) { const r = this.findCode(node[key]); if (r) return r; }
            } catch (_) {}
            return '';
        },

        // ──[13] Route 2 clean chain: entities → surrogate pairs → \u singles → \/ \"
        clean(text) {
            // v7.2.0: string entity decoder — the textarea innerHTML idiom
            // was a TrustedHTML sink under enforcement (tt-smoke live proof).
            try {
                text = decodeEntities(text);
            } catch (_) {}
            text = text.replace(/\\u(d[89ab][0-9a-f]{2})\\u(d[cdef][0-9a-f]{2})/gi, (m, hi, lo) =>
                String.fromCodePoint(0x10000 + ((parseInt(hi, 16) - 0xD800) << 10) + (parseInt(lo, 16) - 0xDC00)));
            text = text.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
            return text.replace(/\\\//g, '/').replace(/\\"/g, '"');
        },

        // ── Entry point: text → vault (Route 1 structural, then Route 2 fallback net) ──
        ingest(text) {
            try {
                if (typeof text !== 'string' || !text) return;
                if (text.indexOf('video_versions') === -1 && text.indexOf('video_dash_manifest') === -1 && text.indexOf('.mp4') === -1) return;
                const prog = new Map();
                const dash = [];
                let parsed = null, code = '';
                try { parsed = JSON.parse(text); } catch (_) {}
                if (parsed != null) {
                    this.walk(parsed, prog, dash);
                    code = this.findCode(parsed);
                }
                const seen = new Set([...prog.keys()]);
                for (const [, u] of dash) seen.add(u);
                const extra = [];
                if (text.indexOf('.mp4') !== -1) {
                    const cleaned = this.clean(text);
                    for (const raw of (cleaned.match(MP4_RE) || [])) {
                        const url = raw.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
                        if (!url || seen.has(url)) continue;
                        seen.add(url);
                        extra.push(url);
                    }
                }
                if (!prog.size && !dash.length && !extra.length) return;
                // Batch in ig_extract.py print order: progressive (type asc) → dash → fallback net.
                const batch = [];
                for (const [url, t] of [...prog].sort((a, b) => a[1] - b[1])) batch.push({ kind: 'progressive', type: t, label: '', url, code });
                for (const [label, url] of dash) batch.push({ kind: 'dash', type: 999, label, url, code });
                for (const url of extra) batch.push({ kind: 'extra', type: 999, label: '', url, code: '' });
                this.merge(batch);
            } catch (_) {}
        },

        merge(batch) {
            const fresh = batch.filter((e) => !this.index.has(e.url));
            if (!fresh.length) return;
            for (const e of fresh) this.index.add(e.url);
            this.entries.unshift(...fresh);
            while (this.entries.length > 500) { const drop = this.entries.pop(); this.index.delete(drop.url); }
            if (this.autoSave) {
                let best = null;
                for (const e of fresh) if (e.kind === 'progressive' && (!best || e.type < best.type)) best = e;
                if (best && !this.autoSaved.has(best.url)) {
                    this.autoSaved.add(best.url);
                    this.saveUrl(best.url, best.code);
                }
            }
            this.renderSoon();
        },

        // ──[15] Vault panel ──
        togglePanel() {
            if (!this.active) { log('IG module idle — instagram.com only'); return; }
            if (!this.panel) this.buildPanel();
            if (!this.panel.isConnected) { try { (document.body || document.documentElement).appendChild(this.panel); } catch (_) {} }
            const show = this.panel.style.display === 'none';
            this.panel.style.display = show ? 'block' : 'none';
            if (show) this.render();
        },
        buildPanel() {
            const p = document.createElement('div');
            p.className = 'psi-ig-panel';
            p.style.display = 'none';
            p.addEventListener('click', (e) => {
                const b = e.target && e.target.closest ? e.target.closest('button[data-psi-act]') : null;
                if (!b) return;
                e.preventDefault();
                e.stopPropagation();
                const act = b.getAttribute('data-psi-act');
                if (act === 'close') { this.panel.style.display = 'none'; return; }
                if (act === 'autosave') {
                    this.autoSave = !this.autoSave;
                    this.render();
                    log(`IG auto-save ${this.autoSave ? 'ON — best progressive of each new capture downloads automatically' : 'OFF'}`);
                    return;
                }
                if (act === 'rescan') {
                    this.scanNewScripts(true);
                    try { this.route2(document.documentElement.outerHTML || ''); } catch (_) {}
                    this.render();
                    log(`IG re-scan → ${this.entries.length} unique URL(s)`);
                    return;
                }
                const url = b.getAttribute('data-psi-url');
                if (!url) return;
                if (act === 'copy') {
                    copyText(url).then((ok) => log(ok
                        ? `CAPTURED → clipboard: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`
                        : `Clipboard blocked — URL: ${url}`));
                    return;
                }
                if (act === 'save') this.saveUrl(url, b.getAttribute('data-psi-code') || '');
            });
            (document.body || document.documentElement).appendChild(p);
            this.panel = p;
        },
        render() {
            if (!this.panel) return;
            // [G3] Render every retained entry (bounded by the 500 cap). v6.4 sliced to the
            // newest 100, leaving entries 101+ present in state but unreachable from any UI
            // action — contradicting the documented per-URL SAVE/COPY capability.
            // v7.2.0: builder form (TT-immune).
            this.panel.replaceChildren(panelHead('IG VAULT', `${this.entries.length} URL(s)`, [
                { act: 'autosave', label: `AUTOSAVE: ${this.autoSave ? 'ON' : 'OFF'}`, on: this.autoSave },
                { act: 'rescan', label: 'RESCAN' },
                { act: 'close', label: '×', cls: 'psi-ig-close' },
            ]));
            if (!this.entries.length) {
                const empty = el('div', 'psi-ig-entry psi-ig-empty');
                empty.textContent = 'no mp4 captured — login wall? scroll the feed or open a post, then RESCAN';
                this.panel.appendChild(empty);
                return;
            }
            for (const e of this.entries) {
                const tag = e.kind === 'progressive' ? `progressive type ${e.type} — video+audio`
                    : e.kind === 'dash' ? `dash ${e.label} — video-only`
                    : 'fallback net';
                const row = el('div', 'psi-ig-entry');
                const tagEl = el('span', 'psi-ig-tag');
                tagEl.textContent = `[${tag}]`;
                row.appendChild(tagEl);
                const codeEl = el('span', 'psi-ig-code');
                codeEl.textContent = e.code || '';
                row.appendChild(codeEl);
                const urlEl = el('div', 'psi-ig-url');
                urlEl.textContent = e.url.length > 96 ? `${e.url.slice(0, 96)}...` : e.url;
                row.appendChild(urlEl);
                for (const [act, label] of [['save', 'SAVE'], ['copy', 'COPY']]) {
                    const b = el('button', 'psi-ig-act');
                    b.setAttribute('data-psi-act', act);
                    b.setAttribute('data-psi-url', e.url);
                    if (act === 'save') b.setAttribute('data-psi-code', e.code || '');
                    b.textContent = label;
                    row.appendChild(b);
                }
                this.panel.appendChild(row);
            }
        },
        renderSoon() {
            if (this.renderTimer !== null) return;
            this.renderTimer = setTimeout(() => {
                this.renderTimer = null;
                if (this.panel && this.panel.style.display !== 'none') this.render();
            }, 400);
        },

        saveUrl(url, code) {
            if (this.inFlight.has(url)) return;
            this.inFlight.add(url);
            const safeCode = String(code || '').replace(/[^A-Za-z0-9_-]/g, '');
            const prefix = safeCode ? `ig_${safeCode}` : 'ig_video';
            runExtraction(url, { namePrefix: prefix }).then(() => { this.inFlight.delete(url); });
        },

        // ──[16] IG CDN <video> sweep (click-time URL re-resolution lives in hookAsset) ──
        isIgVideoUrl(url) {
            return typeof url === 'string' && /\.mp4(\?|$)/i.test(url) && /(cdninstagram|fbcdn)\./i.test(url);
        },
        sweep() {
            document.querySelectorAll('video').forEach((el) => {
                if (el.hasAttribute('data-psi-locked')) return;
                const u = resolveMediaUrl(el);
                if (u && this.isIgVideoUrl(u)) hookAsset(el, { allowDirect: true });
            });
        },

        // ──[14] DOM routes: script[type=application/json] + full-DOM Route 2 ──
        scanNewScripts(force) {
            document.querySelectorAll('script[type="application/json"]').forEach((s) => {
                if (!force && s.hasAttribute('data-psi-ig-scanned')) return;
                try { s.setAttribute('data-psi-ig-scanned', 'true'); } catch (_) {}
                const t = s.textContent;
                if (t) this.ingest(t);
            });
        },
        route2(text) {
            if (typeof text !== 'string' || text.indexOf('.mp4') === -1) return;
            const cleaned = this.clean(text);
            const batch = [];
            // [G5] Within-batch dedupe (mirrors ingest()'s net semantics). v6.4 pushed one
            // entry per regex OCCURRENCE: after extract buttons mount (title carries the URL)
            // and the vault renders (data-psi-url attributes), every .mp4 in the DOM appears
            // 3+ times in outerHTML — one DOM sweep yielded clip×3/not-ig×2 duplicate rows and
            // silently violated the changelog's "dedupe semantics preserved 1:1" guarantee.
            const seen = new Set();
            for (const raw of (cleaned.match(MP4_RE) || [])) {
                const url = raw.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
                if (!url || seen.has(url) || this.index.has(url)) continue;
                seen.add(url);
                batch.push({ kind: 'extra', type: 999, label: '', url, code: '' });
            }
            if (batch.length) this.merge(batch);
        },
    };

    // ═══[17] UNIVERSAL URL VAULT + WIRE CAPTURE (v7.1.0 [U1]–[U3]) ═══
    // One registry for every media URL this page has disclosed: DOM scrape,
    // page-context net capture, and sniffer picks all converge here. The IG
    // vault stays untouched (its entries carry structural labels the CLI port
    // depends on); VAULT is the universal surface.
    const VAULT = {
        entries: [],          // newest-first: {url, kind, tag}
        index: new Set(),     // URL dedupe
        panel: null,
        renderTimer: null,
        MAX: 500,

        add(url, kind, tag) {
            if (!url || typeof url !== 'string' || this.index.has(url)) return;
            this.index.add(url);
            this.entries.unshift({ url, kind, tag: tag || '' });
            while (this.entries.length > this.MAX) { const drop = this.entries.pop(); this.index.delete(drop.url); }
            this.renderSoon();
        },

        // [U3] DOM scrape — the element-resolved truth of the current page.
        scrapeDom() {
            let found = 0;
            const consider = (url, tag) => {
                if (!url || !/^https?:/i.test(url)) return;
                if (!isDirectMediaUrl(url)) return;
                this.add(url, 'dom', tag);
                found++;
            };
            document.querySelectorAll('video, audio, source, img, iframe, embed, object, a[href]').forEach((el) => {
                consider(resolveMediaUrl(el), (el.tagName || '').toLowerCase());
            });
            // lazy family — real thumbs/sources behind data-* placeholders
            document.querySelectorAll('[data-src], [data-original], [data-lazy-src], [data-video], [data-file]').forEach((el) => {
                for (const attr of ['data-src', 'data-original', 'data-lazy-src', 'data-video', 'data-file']) {
                    const v = el.getAttribute && el.getAttribute(attr);
                    if (v) { const abs = inspectUrlLike(v); if (abs) { consider(abs, (el.tagName || '').toLowerCase()); break; } }
                }
            });
            return found;
        },

        // ──[14] Page-context response sniffing (v7.1.3: shared NetHook) ──
        // The v7.1.2 per-script wrap (property wrap: CSP-safe, no inline
        // script) stacked with LinkMasterΨ's own IG-harvester wrap on
        // instagram.com — every response body read twice. Both consumers
        // now subscribe to the build-inlined kernel/net.js singleton:
        // ONE wrap per realm, one body read, fanned out to all suite
        // subscribers (this vault + IG.ingest below).
        installNetHook() {
            if (typeof __4NDR0_NET_API__ !== 'undefined' && __4NDR0_NET_API__ && typeof __4NDR0_NET_API__.onBody === 'function') {
                const feed = (text) => {
                    this.ingestText(text);
                    if (IG.active) IG.ingest(text);
                };
                try {
                    __4NDR0_NET_API__.onBody(feed);
                    log('wire capture ONLINE — shared NetHook subscriber (4 MB cap, single body read)');
                } catch (e) {
                    log('wire capture idle — ' + ((e && e.message) || e));
                }
            } else {
                log('wire capture idle — NetHook module unavailable (DOM routes only)');
            }
        },

        ingestText(text) {
            NET_MEDIA_RE.lastIndex = 0;
            let m;
            while ((m = NET_MEDIA_RE.exec(text)) !== null) {
                const url = m[0].replace(/&amp;/g, '&').replace(/[.,;\])}]+$/, '');
                if (url && !this.index.has(url)) this.add(url, 'net', 'wire');
            }
            NET_MEDIA_RE.lastIndex = 0;
        },

        // [U1] the panel — 3lectric-Glass, same class family as the IG vault.
        togglePanel() {
            if (!this.panel) this.buildPanel();
            if (!this.panel.isConnected) { try { (document.body || document.documentElement).appendChild(this.panel); } catch (_) {} }
            const show = this.panel.style.display === 'none';
            this.panel.style.display = show ? 'block' : 'none';
            if (show) { this.scrapeDom(); this.render(); }
        },
        buildPanel() {
            const p = document.createElement('div');
            p.className = 'psi-ig-panel';
            p.style.display = 'none';
            p.addEventListener('click', (e) => {
                const b = e.target && e.target.closest ? e.target.closest('button[data-psi-act]') : null;
                if (!b) return;
                e.preventDefault();
                e.stopPropagation();
                const act = b.getAttribute('data-psi-act');
                if (act === 'close') { this.panel.style.display = 'none'; return; }
                if (act === 'copyall') {
                    const list = this.entries.map((e2) => e2.url).join('\n');
                    if (!list) { log('Vault is empty'); return; }
                    copyText(list).then((ok) => log(ok ? `CAPTURED → clipboard: ${this.entries.length} URL(s)` : `Clipboard blocked — ${this.entries.length} URL(s) logged only:\n${list}`));
                    return;
                }
                if (act === 'rescan') {
                    this.scrapeDom();
                    try { this.ingestText(document.documentElement.outerHTML || ''); } catch (_) {}
                    this.render();
                    log(`Re-scan → ${this.entries.length} unique URL(s)`);
                    return;
                }
                const url = b.getAttribute('data-psi-url');
                if (!url) return;
                if (act === 'copy') {
                    copyText(url).then((ok) => log(ok
                        ? `CAPTURED → clipboard: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`
                        : `Clipboard blocked — URL: ${url}`));
                    return;
                }
                if (act === 'save') this.saveUrl(url);
            });
            (document.body || document.documentElement).appendChild(p);
            this.panel = p;
        },
        render() {
            if (!this.panel) return;
            // v7.2.0: builder form (TT-immune; see the shared helpers above).
            this.panel.replaceChildren(panelHead('URL VAULT', `${this.entries.length} URL(s) · universal`, [
                { act: 'copyall', label: 'COPY ALL' },
                { act: 'rescan', label: 'RESCAN' },
                { act: 'close', label: '×', cls: 'psi-ig-close' },
            ]));
            if (!this.entries.length) {
                const empty = el('div', 'psi-ig-entry psi-ig-empty');
                empty.textContent = 'no media URLs discovered yet — play the media, then RESCAN';
                this.panel.appendChild(empty);
                return;
            }
            for (const e of this.entries) {
                const row = el('div', 'psi-ig-entry');
                const tagEl = el('span', 'psi-ig-tag');
                tagEl.textContent = `[${e.kind}${e.tag ? ' · ' + e.tag : ''}]`;
                row.appendChild(tagEl);
                const urlEl = el('div', 'psi-ig-url');
                urlEl.textContent = e.url.length > 96 ? `${e.url.slice(0, 96)}...` : e.url;
                row.appendChild(urlEl);
                for (const [act, label] of [['save', 'SAVE'], ['copy', 'COPY']]) {
                    const b = el('button', 'psi-ig-act');
                    b.setAttribute('data-psi-act', act);
                    b.setAttribute('data-psi-url', e.url);
                    b.textContent = label;
                    row.appendChild(b);
                }
                this.panel.appendChild(row);
            }
        },
        renderSoon() {
            if (this.renderTimer !== null) return;
            this.renderTimer = setTimeout(() => {
                this.renderTimer = null;
                if (this.panel && this.panel.style.display !== 'none') this.render();
            }, 400);
        },
        saveUrl(url) {
            runExtraction(url, { namePrefix: 'vault' });
        },
    };

    const NET_MEDIA_RE = /https?:\/\/[^\s"'<>\\]+?\.(?:mp4|webm|m3u8|ts|m4s|mpd|mkv|mov|avi|flv|mp3|m4a|ogg|wav|flac|aac|jpg|jpeg|png|webp|gif|avif|bmp)(?:\?[^\s"'<>\\]*)?/gi;

    // resolveUrl is scope-private above; the vault's lazy-attr sweep needs a
    // forgiving variant that also tolerates protocol-relative values.
    const inspectUrlLike = (raw) => {
        if (!raw || typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed) return null;
        try { return new URL(trimmed, location.href).href; } catch (_) { return null; }
    };

    // ──[12] Tradecraft controls ──
    const copyAllBlobUrls = () => {
        const urls = new Set();
        document.querySelectorAll('[data-psi-locked]').forEach((el) => {
            const u = resolveMediaUrl(el);
            if (u && u.indexOf('blob:') === 0) urls.add(u);
        });
        if (!urls.size) { log('No blob URLs discovered on this page'); return; }
        const list = Array.from(urls).join('\n');
        copyText(list).then((ok) => log(ok
            ? `CAPTURED → clipboard: ${urls.size} unique blob URL(s)`
            : `Clipboard blocked — ${urls.size} URL(s) logged only:\n${list}`));
    };
    const registerMenus = () => {
        if (typeof GM_registerMenuCommand !== 'function') return; // hotkeys + auto-scan remain fully operational
        GM_registerMenuCommand("Ψ: Toggle Universal Sniffer", () => sniffer.toggle());
        GM_registerMenuCommand("Ψ: Force DOM Re-scan", deploy);
        GM_registerMenuCommand("Ψ: Copy All Discovered Blob URLs", copyAllBlobUrls);
        GM_registerMenuCommand("Ψ: Universal URL Vault (Alt+Shift+V)", () => VAULT.togglePanel());
        GM_registerMenuCommand("Ψ: Copy All Discovered Media URLs", () => {
            VAULT.scrapeDom();
            const list = VAULT.entries.map((e) => e.url).join('\n');
            if (!list) { log('No media URLs discovered on this page'); return; }
            copyText(list).then((ok) => log(ok
                ? `CAPTURED → clipboard: ${VAULT.entries.length} unique URL(s)`
                : `Clipboard blocked — ${VAULT.entries.length} URL(s) logged only:\n${list}`));
        });
        GM_registerMenuCommand("Ψ: IG Vault Panel", () => IG.togglePanel());
    };

    // ──[10] Hotkeys (capture phase so page handlers cannot swallow them first) ──
    const onKeydown = (e) => {
        if (e.isComposing) return; // IME composition safety
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.repeat && typeof e.key === 'string') {
            const k = e.key.toLowerCase();
            // v7.1.1 hotkey-census round: sniffer was Alt+S (fought ModelSearch's
            // suite-wide Alt+S AND GPD's on Google hosts) — Alt+B is free everywhere;
            // IG vault was Alt+I (fought Instagram++'s Alt+I on its own host) — Alt+J is free.
            if (k === 'b') { e.preventDefault(); sniffer.toggle(); return; }
            if (k === 'j' && IG.active) { e.preventDefault(); IG.togglePanel(); return; } // [15] IG vault (Alt+J)
        }
        // [U1] universal vault — Alt+Shift+V (collision-checked: YTPM owns
        // Alt+Shift+U/S/X on YouTube, Recon R, MAM S — V is free suite-wide).
        if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.repeat && typeof e.key === 'string'
            && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            VAULT.togglePanel();
            return;
        }
        if (sniffMode && e.key === 'Escape') { sniffer.toggle(); return; } // [09] one-key exit
        if (sniffMode && e.key === 'Enter' && !e.repeat) {
            // [09] Don't hijack typing contexts (v6.1 swallowed Enter inside inputs mid-sniff).
            const t = e.target;
            const editing = !!(t && (t.isContentEditable || (t.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))));
            if (!editing) { e.preventDefault(); sniffer.capture(); }
        }
    };
    document.addEventListener('keydown', onKeydown, true);

    // ──[07] Body-ready bootstrap (document-start safe) ──
    const whenBodyReady = (fn) => {
        if (document.body) { fn(); return; }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    };
    whenBodyReady(() => {
        sniffer.init();
        registerMenus();
        VAULT.installNetHook(); // [U2] FIRST — IG's hook defers to this wrap
        IG.init();
        deploy(); // Initial scan
    });

    log("Ψ-4ndr0tools - blob2url_v7.1_ONLINE // 3LECTRIC-GLASS // GUP-G1..G5 + U1..U4");
})();
