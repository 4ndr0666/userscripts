// ==UserScript==
// @name         4ndr0tools - Recon
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      9.0.0

// @description  Alt+R hotkey — unified forensic recon platform: hardened XHR/fetch interception with MITM block & mute rules, console harvesting, WebSocket + postMessage bridge capture, JWT identity harvesting, headless C2 API (reconEngine / chimeraRecon / Hook) and a moveable Shadow-DOM glass dock with full markdown reporting. For security research only.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @run-at       document-start
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Recon.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Recon.user.js
// ==/UserScript==

/* Paradigm (D1): Userscript Interceptor — document-start prototype patching of
 * fetch / XMLHttpRequest / WebSocket / console / postMessage on the page context
 * (unsafeWindow), closure-scoped module state, and a Shadow-DOM-isolated dock UI.
 * Zero frameworks; zero page-global leakage beyond the three documented operator
 * entry points: window.reconEngine, window.chimeraRecon, window.Hook.
 *
 * Unified superset of: recon3 [HUD] v3.0.0, recond [Dock] v8.1.0-Ω,
 * recon4 [Dock] v8.2.02-Ω, reconc [Chimera's Eye] v3.0.0, reconh [Headless] v2.3.7.
 */

(() => {
    'use strict';

    // ─── OPERATOR WORKFLOW (reconh lineage, updated for the unified platform) ───
    // 1. Activate  : the glass dock auto-injects when the DOM is ready. Toggle it with Alt+R.
    // 2. Operate   : use the site. Everything is captured live — the NETWORK /
    //                CONSOLE / REPORT / DATA tabs update in real time.
    // 3. Silence   : reconEngine.applyMuteRules('play.google.com/log')
    //                (capture continues; only the console feed is silenced)
    // 4. Block     : reconEngine.applyBlockRules('/_/rpc/PostImage/Annotate')
    //                (matching fetch/XHR requests are MITM-blocked and pacified with 204)
    // 5. Extract   : the REPORT button copies the full forensic markdown report, or use
    //                reconEngine.copySessionData(), then run: copy(reconEngine.sessionData)
    // 6. Fresh run : PURGE button, reconEngine.startNewSession() or
    //                chimeraRecon.startNewSession()
    // 7. Float     : the FLOAT button detaches the dock into a draggable floating panel
    //                (recon3/reconc moveability); the resizer and Alt+R work in both modes.

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
                    background:rgba(20,40,48,0.95); color:#00E5FF; padding:10px 22px; border-radius:6px;
                    font:15px monospace; z-index:2147483647; opacity:0; transition:opacity .25s ease; pointer-events:none; }
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
            overrideFetch();             // reconh lineage: hardened fetch interceptor
            overrideXHR();               // reconh lineage: hardened XHR interceptor
            Hook.hookPostMessage();      // recond + recon4 lineage: postMessage bridge
            Hook.hookWebSocket();        // recon4 lineage: WebSocket bridge (statics preserved)
            pristineConsole.log('%c[Ψ-RECON-Ω] UNIFIED v9.0.0-Ω — ALL INTERCEPTORS ARMED', 'color:#00E5FF;font-weight:bold');
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

    // ─── 8. HARDENED NETWORK INTERCEPTORS (reconh MITM + recon3 rich capture + reconc parsing) ───

    function overrideFetch() {
        const origFetch = _window.fetch;
        if (typeof origFetch !== 'function' || origFetch.__psiReconHooked) return;
        const hookedFetch = async function(...args) {
            const url = HELPERS.normalizeUrl(args[0]);
            const method = String((args[1] && args[1].method) || 'GET').toUpperCase();

            if (url && STATE.blockRules.some((rule) => url.includes(rule))) {   // reconh MITM block
                HELPERS.log('[MITM] BLOCKED Fetch request to: ' + url);
                const blockedBody = await parseBody(args[1] && args[1].body);
                logApiResponse('FETCH', url, { body: blockedBody }, 'blocked', method);
                return new _window.Response(null, { status: 204, statusText: 'Blocked by ReconEngine Rule' });
            }

            let requestEnvelope = null;
            if (args[1] && args[1].body) {                                       // reconh/reconc request capture
                requestEnvelope = await parseBody(args[1].body);
                logApiResponse('FETCH', url, requestEnvelope, 'request', method);
            }

            try {
                const response = await origFetch.apply(this, args);              // regular fn: this = caller's this
                const clone = response.clone();
                parseBody(clone, response.headers).then((responseEnvelope) => {  // recon3 rich + reconc headers-aware
                    captureNetwork(url, method, requestEnvelope, responseEnvelope, 'FETCH');
                    logApiResponse('FETCH', url, responseEnvelope, 'response', method);
                }).catch((responseParseError) => {
                    HELPERS.debug('[interceptor] FETCH response parse failed:', responseParseError);
                });
                return response;
            } catch (fetchError) {
                if (fetchError instanceof TypeError) {                           // reconh 204 pacification
                    if (!(url && STATE.muteRules.some((rule) => url.includes(rule)))) {
                        HELPERS.error('Fetch to ' + url + ' was blocked by an external filter (e.g., ad-blocker).');
                    }
                    logApiResponse('FETCH', url, { error: fetchError.message }, 'external_block', method);
                    return new _window.Response(null, { status: 204, statusText: 'Intercepted & Nullified by ReconEngine' });
                }
                HELPERS.error('Fetch failed for ' + method + ' ' + url + ':', fetchError);
                throw fetchError;                                                // host semantics preserved
            }
        };
        HELPERS.markHooked(hookedFetch);
        _window.fetch = hookedFetch;
        HELPERS.log('Hardened FETCH override active (recorder + block/mute + identity rules ARMED).');
    }

    function overrideXHR() {
        const xhrProto = _window.XMLHttpRequest && _window.XMLHttpRequest.prototype;
        if (!xhrProto || xhrProto.__psiReconHooked) return;
        const origOpen = xhrProto.open;
        const origSend = xhrProto.send;

        xhrProto.open = function(method, url) {
            this._psiRecon = { method: String(method || 'GET'), url: HELPERS.normalizeUrl(url) };
            return origOpen.apply(this, arguments);
        };

        xhrProto.send = function(body) {
            const meta = this._psiRecon || { method: 'GET', url: '[unknown]' };
            const method = String(meta.method || 'GET').toUpperCase();

            if (meta.url && STATE.blockRules.some((rule) => meta.url.includes(rule))) {   // reconh MITM block
                HELPERS.log('[MITM] BLOCKED XHR request to: ' + meta.url);
                parseBody(body).then((blockedBody) => {
                    logApiResponse('XHR', meta.url, { body: blockedBody }, 'blocked', method);
                }).catch((blockedParseError) => {
                    HELPERS.debug('[interceptor] XHR blocked-body parse failed:', blockedParseError);
                });
                Object.defineProperty(this, 'status', { value: 204, configurable: true });
                Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
                this.dispatchEvent(new _window.Event('load'));
                return;                                                                   // origSend never called
            }

            const requestPromise = (body != null) ? parseBody(body) : Promise.resolve(null);
            requestPromise.then((requestEnvelope) => {                                    // reconh/reconc request capture
                logApiResponse('XHR', meta.url, requestEnvelope, 'request', method);
            }).catch((requestParseError) => {
                HELPERS.debug('[interceptor] XHR request parse failed:', requestParseError);
            });

            this.addEventListener('loadend', async () => {                                 // reconc loadend ⊇ 'load'
                try {
                    if (this.readyState !== 4) return;                                     // reconh guard
                    const contentType = (typeof this.getResponseHeader === 'function') ? this.getResponseHeader('content-type') : null;
                    const requestEnvelope = await requestPromise.catch(() => null);
                    const responseEnvelope = await parseBody(this.response, { 'content-type': contentType || '' });
                    captureNetwork(meta.url, method, requestEnvelope, responseEnvelope, 'XHR');
                    logApiResponse('XHR', meta.url, responseEnvelope, 'response', method);
                } catch (loadendError) {
                    HELPERS.debug('[interceptor] XHR loadend capture failed:', loadendError);
                }
            }, { once: true });

            this.addEventListener('error', () => {                                        // reconh external-block path
                if (!(meta.url && STATE.muteRules.some((rule) => meta.url.includes(rule)))) {
                    HELPERS.error('XHR Error for ' + method + ' ' + meta.url + '. This may be due to an external filter.');
                }
                logApiResponse('XHR', meta.url, { error: 'XHR failed' }, 'external_block', method);
            }, { once: true });

            return origSend.apply(this, arguments);                                       // arguments passthrough
        };

        HELPERS.markHooked(xhrProto);
        HELPERS.log('Hardened XHR override active (recorder + block/mute rules ARMED).');
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
                transition:transform 0.3s cubic-bezier(0.4,0,0.2,1); pointer-events:auto; }
            #panel.hidden { transform:translateY(100%); }
            #resizer { height:8px; cursor:ns-resize; width:100%; background:transparent; position:absolute; top:0; z-index:10; }
            #resizer:hover { background:${THEME.border}; }
            .header { display:flex; justify-content:space-between; align-items:center; padding:10px 15px;
                background:rgba(0,229,255,0.05); border-bottom:1px solid ${THEME.border}; }
            .header-info { display:flex; align-items:center; gap:10px; color:${THEME.cyan}; font-weight:bold; font-size:11px; }
            .counters { display:flex; gap:8px; font-size:9px; color:#888; }
            .tabs { display:flex; background:rgba(0,0,0,0.2); }
            .tab { padding:8px 20px; cursor:pointer; font-size:10px; border-right:1px solid ${THEME.border}; opacity:0.6; }
            .tab.active { opacity:1; color:${THEME.cyan}; background:rgba(0,229,255,0.05); border-bottom:2px solid ${THEME.cyan}; }
            #viewport { flex:1; overflow-y:auto; padding:10px; font-size:9px; background:rgba(0,0,0,0.1);
                white-space:pre-wrap; word-break:break-all; }
            .row { margin-bottom:3px; border-bottom:1px solid rgba(255,255,255,0.02); padding:2px 0; }
            .btn { background:transparent; border:1px solid ${THEME.border}; color:${THEME.cyan};
                padding:3px 10px; font-size:10px; cursor:pointer; font-weight:bold; transition:0.2s; }
            #status { font-size:9px; color:#00AAAA; text-align:center; border:1px solid #004444; padding:4px; margin:0 15px 8px 15px; }
        `;
        shadow.appendChild(style);
        const ui = _document.createElement('div');
        ui.id = 'panel';
        ui.innerHTML = `
            <div id="resizer"></div>
            <div class="header">
                <div class="header-info">
                    <svg viewBox="0 0 128 128" style="width:14px;height:14px;"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke="${THEME.cyan}" fill="none" stroke-width="2" /><text x="64" y="75" text-anchor="middle" fill="${THEME.cyan}" font-size="50" font-weight="700">Ψ</text></svg>
                    <span>RECON_Ω_UNIFIED_9.0.0-Ω</span>
                    <span class="counters">PKT:<b id="p-count">0</b> LOG:<b id="l-count">0</b> ID:<b id="i-count">0</b> EVT:<b id="evt-count">0</b></span>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn" id="do-float">FLOAT</button>
                    <button class="btn" id="do-rep">REPORT</button>
                    <button class="btn" id="do-purge" style="color:#FF00FF;">PURGE</button>
                </div>
            </div>
            <div class="tabs">
                <div class="tab active" id="tab-net">NETWORK</div>
                <div class="tab" id="tab-log">CONSOLE</div>
                <div class="tab" id="tab-rep">REPORT</div>
                <div class="tab" id="tab-data">DATA</div>
            </div>
            <div id="status" class="status">SNIFFING_ACTIVE...</div>
            <div id="viewport"></div>
        `;
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
                target.style.background = '#00FF00';
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

        // Alt+R hide/show (recond/recon4 lineage, phantom-click mitigation)
        _window.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key || '').toLowerCase() === 'r') {
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
        if (STATE.currentTab === 'net') {
            viewportEl.innerHTML = STATE.network.slice(-VIEW_SLICE).reverse().map((n) =>
                '<div class="row"><span style="color:#555">[' + HELPERS.escapeHtml(n.localTs) + ']</span> <span style="color:' + THEME.cyan + '">' + HELPERS.escapeHtml(n.protocol) + '</span> ' + HELPERS.escapeHtml(n.method) + ' ' + HELPERS.escapeHtml(n.displayUrl) + '</div>'
            ).join('') || '<div class="row">* No traffic captured yet.</div>';
        } else if (STATE.currentTab === 'log') {
            viewportEl.innerHTML = STATE.logs.slice(-VIEW_SLICE).reverse().map((l) =>
                '<div class="row"><span style="color:#555">[' + HELPERS.escapeHtml(l.localTs) + ']</span> ' + HELPERS.escapeHtml(l.type) + ': ' + HELPERS.escapeHtml(l.content) + '</div>'
            ).join('') || '<div class="row">* No console output captured yet.</div>';
        } else if (STATE.currentTab === 'rep') {
            viewportEl.innerHTML = '<pre style="white-space:pre-wrap; color:#ccc; margin:0;">' + HELPERS.escapeHtml(generateReport()) + '</pre>';
        } else {
            // DATA tab — reconc's raw JSON ledger view
            viewportEl.innerHTML = '<pre style="white-space:pre-wrap; color:#ccc; margin:0;">' + HELPERS.escapeHtml(HELPERS.safeStringify(STATE.sessionData) || '[]') + '</pre>';
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
        if (statusLine) statusLine.textContent = STATE.isHidden ? 'SNIFFING_SUSPENDED_UI — Alt+R to restore' : 'SNIFFING_ACTIVE...';
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
        HELPERS.log('Ψ-RECON-Ω UNIFIED v9.0.0-Ω initialized. C2 via reconEngine / chimeraRecon / Hook in the console; dock toggles with Alt+R.');
    }

    initialize();   // interceptors armed at document-start (reconh guarantee)
    boot();         // dock UI injected as soon as the DOM can host it (recon3/recond/reconc timing superset)
})();
