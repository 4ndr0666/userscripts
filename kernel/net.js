/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/net.js — hardened network transport + the NetHook singleton
 * ----------------------------------------------------------------------------
 * Two responsibilities:
 *
 * 1. Ψ.net.gmFetch — GM_xmlhttpRequest wrapper with a hard timeout (GUP
 *    D2/4.2), bounded retries with backoff, and specific error classes.
 *    Consolidates the ad-hoc retry/timeout fragments from Pixeldrain++,
 *    Gofile++, Bunkr++, and m3u8++.
 *
 * 2. Ψ.net.hook — THE co-install interference fix for the media family.
 *    Before this kernel, seven suite scripts each installed their own
 *    fetch/XHR proxy on the same pages; co-installed, they stacked proxies
 *    (double capture, listener leaks, latency). NetHook installs exactly ONE
 *    proxy per realm and lets every suite script register isolated handlers
 *    against it.
 *
 *    Cross-script coordination uses a single non-enumerable, versioned
 *    contract slot (`__4NDR0_NET__`) — the same interop pattern as
 *    window.jQuery/GM_info, deliberately exempt from the "zero window
 *    pollution" rule because two userscripts share no other memory. The
 *    slot is feature-detected, never overwritten (highest version wins),
 *    and every handler failure is isolated with scoped console.debug per
 *    GUP D6 (deliberate interception).
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.net = (() => {
    'use strict';

    const NET_HOOK_SLOT = '__4NDR0_NET__';
    const NET_HOOK_VERSION = 1;
    const MAX_HANDLERS = 64;          // bounded registry (GUP B.1)

    /* ── Error taxonomy (specific exceptions, never generic) ────────────── */

    class NetError extends Error {
        constructor(message, { url, status, kind } = {}) {
            super(message);
            this.name = 'NetError';
            this.url = url;
            this.status = status;
            this.kind = kind || 'transport';
        }
    }
    class NetTimeoutError extends NetError {
        constructor(url, ms) {
            super(`gmFetch timeout after ${ms}ms: ${url}`, { url, kind: 'timeout' });
            this.name = 'NetTimeoutError';
        }
    }
    class NetHttpError extends NetError {
        constructor(url, status, statusText) {
            super(`HTTP ${status} ${statusText || ''} — ${url}`, { url, status, kind: 'http' });
            this.name = 'NetHttpError';
        }
    }

    /* ── gmFetch — privileged transport with timeout + bounded retry ────── */

    /**
     * Promise-wrapped GM_xmlhttpRequest with hard timeout and optional retry.
     * @param {string} url
     * @param {{method?:string, headers?:object, data?:string, timeout?:number,
     *          retries?:number, responseType?:string, checkStatus?:boolean}} [opts]
     * @returns {Promise<{status:number, statusText:string, responseText:string,
     *                     responseHeaders:string, finalUrl:string}>}
     */
    function gmFetch(url, opts = {}) {
        const {
            method = 'GET', headers = {}, data = null,
            timeout = 15000, retries = 0, responseType = 'text',
            checkStatus = true,
        } = opts;

        const attempt = (triesLeft) => new Promise((resolve, reject) => {
            let settled = false;
            const done = (fn, arg) => { if (!settled) { settled = true; fn(arg); } };
            const req = {
                method, url, headers, data, timeout,
                responseType: responseType === 'text' ? 'text' : responseType,
                onload: (r) => {
                    if (checkStatus && (r.status < 200 || r.status >= 400)) {
                        done(reject, new NetHttpError(url, r.status, r.statusText));
                    } else {
                        done(resolve, r);
                    }
                },
                onerror: () => done(reject, new NetError('network error', { url })),
                ontimeout: () => done(reject, new NetTimeoutError(url, timeout)),
                onabort: () => done(reject, new NetError('aborted', { url, kind: 'abort' })),
            };
            try {
                GM_xmlhttpRequest(req);
            } catch (e) {
                done(reject, new NetError('dispatch failed: ' + e.message, { url }));
            }
        });

        return (async () => {
            let lastErr = null;
            for (let attemptNo = 0; attemptNo <= retries; attemptNo++) {
                try {
                    return await attempt(0);
                } catch (e) {
                    lastErr = e;
                    // Retry only transient failures — never HTTP 4xx logic errors.
                    if (!(e instanceof NetTimeoutError || e.kind === 'transport')) throw e;
                    if (attemptNo < retries) await Ψ.core.sleep(300 * (attemptNo + 1));
                }
            }
            throw lastErr;
        })();
    }

    /* ── Download dispatch (manager-first, tab fallback) ─────────────────── */

    /**
     * Download via GM_download with graceful fallback to GM_openInTab.
     * @returns {Promise<{mode: 'manager'|'tab'}>}
     */
    function download({ url, name, headers = null, saveAs = false }) {
        return new Promise((resolve, reject) => {
            const finishManager = (mode) => resolve({ mode });
            try {
                if (typeof GM_download === 'function') {
                    const handle = GM_download(
                        { url, name: name || url.split('/').pop() || 'download', headers, saveAs },
                        finishManager.bind(null, 'manager'));
                    // GM_download returns an object with abort(); some managers
                    // also fire onerror — surface it rather than hanging.
                    if (handle && typeof handle.then === 'function') {
                        handle.then(() => finishManager('manager'), reject);
                    }
                    // If the manager neither resolves nor errors, resolve anyway
                    // once the tab-level fallback window elapses.
                    setTimeout(() => resolve({ mode: 'manager' }), 8000);
                    return;
                }
                throw new NetError('GM_download unavailable', { url, kind: 'unsupported' });
            } catch (e) {
                if (typeof GM_openInTab === 'function') {
                    const tab = GM_openInTab(url, { active: false });
                    resolve({ mode: 'tab', tab });
                } else {
                    reject(e instanceof NetError ? e : new NetError(String(e && e.message || e), { url }));
                }
            }
        });
    }

    /* ── NetHook — one proxy per realm, many isolated consumers ─────────── */

    /**
     * Obtain (installing exactly once) the suite's network interception hub.
     * Page-context fetch/XHR events are captured and fanned out to isolated
     * handlers. API (also reachable cross-script via the versioned slot):
     *
     *   netHook.version
     *   netHook.onFetch(patternOrFn, handler)   -> unsubscribe()
     *   netHook.onXhr(patternOrFn, handler)     -> unsubscribe()
     *     handler(request, response) — response may be undefined pre-flight.
     *
     * Handlers are try/catch-isolated per D6; a throwing handler can never
     * break the host page or sibling handlers.
     */
    function netHook() {
        const existing = window[NET_HOOK_SLOT];
        if (existing && existing.version >= NET_HOOK_VERSION) return existing;

        const fetchHandlers = new Ψ.core.FIFOCache(MAX_HANDLERS); // insertion-ordered registry
        const xhrHandlers = new Ψ.core.FIFOCache(MAX_HANDLERS);

        const matches = (matcher, arg) =>
            typeof matcher === 'function' ? matcher(arg) : String(arg).includes(matcher);

        const dispatch = (registry, evt) => {
            for (const [key, entry] of registry.map) {
                try {
                    if (matches(entry.matcher, evt.url)) entry.handler(evt);
                } catch (e) {
                    // D6 deliberate interception: log, never propagate.
                    console.debug('[a4/net-hook] handler failed:', (e && e.message) || e);
                }
            }
        };

        /* fetch proxy — installed once; chained over whatever was there. */
        const originalFetch = window.fetch ? window.fetch.bind(window) : null;
        if (originalFetch) {
            window.fetch = function proxiedFetch(input, init) {
                const url = typeof input === 'string' ? input
                    : (input && input.url) || String(input);
                dispatch(fetchHandlers, { url, init, kind: 'fetch', stage: 'request' });
                return originalFetch(input, init).then((response) => {
                    // Tee the body without consuming it: clone() is cheap and
                    // safe for all consumers we register (text inspection).
                    try {
                        if (!response.bodyUsed) {
                            response.clone().text().then((text) => {
                                dispatch(fetchHandlers, { url, init, kind: 'fetch', stage: 'response', status: response.status, text });
                            }).catch(() => { /* body unparsable — request-stage event already fired */ });
                        }
                    } catch (e) {
                        console.debug('[a4/net-hook] response tee failed:', (e && e.message) || e);
                    }
                    return response;
                });
            };
        }

        /* XHR proxy — open/send capture, response text on loadend. */
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function proxiedOpen(method, url, ...rest) {
            this.__a4Url = String(url);
            this.__a4Method = String(method || 'GET');
            return originalOpen.call(this, method, url, ...rest);
        };
        XMLHttpRequest.prototype.send = function proxiedSend(body) {
            const url = this.__a4Url;
            if (url !== undefined) {
                dispatch(xhrHandlers, { url, method: this.__a4Method, body, kind: 'xhr', stage: 'request', xhr: this });
                this.addEventListener('loadend', () => {
                    try {
                        dispatch(xhrHandlers, {
                            url, method: this.__a4Method, kind: 'xhr', stage: 'response',
                            status: this.status, text: this.responseType === '' || this.responseType === 'text' ? this.responseText : null,
                            xhr: this,
                        });
                    } catch (e) {
                        console.debug('[a4/net-hook] xhr loadend dispatch failed:', (e && e.message) || e);
                    }
                }, { once: true });
            }
            return originalSend.call(this, body);
        };

        const api = {
            version: NET_HOOK_VERSION,
            onFetch(matcher, handler) {
                const key = Ψ.core.uid('fh');
                fetchHandlers.set(key, { matcher, handler });
                return () => fetchHandlers.delete(key);
            },
            onXhr(matcher, handler) {
                const key = Ψ.core.uid('xh');
                xhrHandlers.set(key, { matcher, handler });
                return () => xhrHandlers.delete(key);
            },
            get fetchHandlerCount() { return fetchHandlers.size; },
            get xhrHandlerCount() { return xhrHandlers.size; },
        };

        try {
            Object.defineProperty(window, NET_HOOK_SLOT, {
                value: api, writable: false, enumerable: false, configurable: false,
            });
        } catch (e) {
            // Slot collision with a foreign script: keep our local api.
            console.debug('[a4/net-hook] slot registration skipped:', (e && e.message) || e);
        }
        return api;
    }

    return Object.freeze({ NetError, NetTimeoutError, NetHttpError, gmFetch, download, netHook });
})();
