/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/net.js — the NetHook singleton (suite v1.4.3 restore + hardening)
 * ----------------------------------------------------------------------------
 * THE co-install interference fix for the media family. Before this module,
 * every network-tapping script installed its own fetch/XHR proxy on shared
 * pages; co-installed, they stacked — Blob2URL's vault over LinkMasterΨ's
 * IG harvester on instagram.com read every response body twice, with wrap
 * chains N scripts deep (the v1.4.3 sink census measured the surface).
 * NetHook installs exactly ONE wrap per realm and fans every captured body
 * out to isolated suite subscribers.
 *
 * Consumed via build-time injection into the canon scripts that declare it
 * (tools/build.mjs CANON_KERNEL) — the identifier `__4NDR0_NET_API__` below
 * is script-scope visible to the consumer's IIFE.
 *
 * Design contract (v2 — restored from the v1.1.0 design, hardened):
 *   - PAGE REALM FIRST: the slot + wraps live on unsafeWindow when
 *     available (that is where host page fetches live — the same realm
 *     choice the per-script wraps already made), window otherwise.
 *   - LAZY ARM: zero wraps until the first subscriber registers — a
 *     co-installed script that only subscribes on its own host costs
 *     nothing anywhere else.
 *   - SINGLE BODY READ: one clone().text() per response, dispatched to
 *     every subscriber — the two-vault double-read on instagram is the
 *     exact failure this replaces. 4 MB read cap (Blob2URL's wire limit).
 *   - FINGERPRINT MASKING: wrapped.toString() reports the native source
 *     (anti-bot parity with the per-script wraps it replaces).
 *   - ISOLATION: a throwing subscriber can never break the host page or
 *     its siblings (scoped console.debug, GUP D6 deliberate interception).
 *   - VERSIONED SLOT: `__4NDR0_NET__` on the realm — highest version
 *     wins, never overwritten; the second suite script reuses the first's
 *     wraps through the slot (cross-script memory is the documented interop
 *     exception, same class as window.jQuery/GM_info).
 * ═══════════════════════════════════════════════════════════════════════════ */
const __4NDR0_NET_API__ = (function () {
    'use strict';

    const SLOT = '__4NDR0_NET__';
    const VERSION = 2;
    const MAX_SUBS = 32;            /* bounded registry (GUP B.1) */
    const MAX_BODY = 4000000;       /* 4 MB read cap (Blob2URL's wire limit) */

    function realm() {
        try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) return unsafeWindow; } catch (e) { /* sandboxed away */ }
        try { if (typeof window !== 'undefined' && window) return window; } catch (e) { /* no DOM */ }
        return null;
    }

    const subs = new Map();         /* key -> fn(text) */
    let seq = 0;
    let armed = false;

    function dispatch(text) {
        for (const [, fn] of subs) {
            try { fn(text); }
            catch (e) { console.debug('[a4/net] subscriber failed:', (e && e.message) || e); }
        }
    }

    function arm(target) {
        if (armed) return;
        armed = true;
        /* fetch — one wrap, body tee only while subscribers exist */
        try {
            const origFetch = target.fetch;
            if (typeof origFetch === 'function' && !origFetch.__4ndro_net) {
                const wrapped = function () {
                    const p = origFetch.apply(this, arguments);
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
                };
                try { wrapped.toString = function () { return String(origFetch); }; } catch (e) { /* frozen fn */ }
                wrapped.__4ndro_net = true;
                target.fetch = wrapped;
            }
        } catch (e) { console.debug('[a4/net] fetch arm skipped:', (e && e.message) || e); }
        /* XHR — send-time load listener, response text dispatched once */
        try {
            const xo = target.XMLHttpRequest && target.XMLHttpRequest.prototype;
            if (xo && typeof xo.send === 'function' && !xo.__4ndro_net) {
                xo.__4ndro_net = true;
                const origSend = xo.send;
                xo.send = function () {
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
                try { xo.send.toString = function () { return String(origSend); }; } catch (e) { /* frozen fn */ }
            }
        } catch (e) { console.debug('[a4/net] xhr arm skipped:', (e && e.message) || e); }
    }

    const api = {
        version: VERSION,
        /* onBody(fn) -> unsubscribe. fn(text) receives every textual
         * response body captured in the page realm (ok fetch responses +
         * XHR text/json loads), read once per response, capped at 4 MB.
         * A throwing subscriber is isolated — never page-fatal.
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
                    if (hub && hub !== api && hub.version >= VERSION && typeof hub.onBody === 'function') {
                        return hub.onBody(fn);
                    }
                } catch (e) { /* unreadable slot — fall through to local hub */ }
            }
            if (subs.size >= MAX_SUBS) return function () {};
            const key = 'nb' + (++seq);
            subs.set(key, fn);
            if (target) {
                arm(target);
                try {
                    const existing = target[SLOT];
                    if (!existing || existing.version < VERSION || typeof existing.onBody !== 'function') {
                        Object.defineProperty(target, SLOT, {
                            value: api, writable: false, enumerable: false, configurable: true,
                        });
                    }
                } catch (e) { /* slot collision with a foreign script — local hub only */ }
            }
            return function () { subs.delete(key); };
        },
        get subscriberCount() { return subs.size; },
    };
    return api;
})();
