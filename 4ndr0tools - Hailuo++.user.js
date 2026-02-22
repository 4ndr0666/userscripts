// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     41.0.0
// @description The definitive asset instrumentation suite. As always for securirty research only.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @icon         data:image/png;base64,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
// @icon64       data:image/png;base64,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
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// ==/UserScript==

(function (global) {
    "use strict";

    //────── [0] KERNEL: IDENTITY & ENTROPY ──────//
    const CORE = {
        name: "Hailuo++",
        id: `psi-${Math.random().toString(36).slice(2, 9)}`,
        config: {
            telemetryBlock: true,
            autoScrollLog: true,
            maxLogEntries: 100,
            maxAssetDisplay: 100,
            autoMutate: true,
            defensePulse: true,
            prodFilter: true,
            domWatch: true,
            shadowHUD: true
        }
    };

    //────── [1] UTILS & SECURITY CONTEXT ──────//
    const Utils = {
        randStr: (len = 8) => [...Array(len)].map(() => Math.floor(Math.random() * 36).toString(36)).join(''),
        sanitizeUrl: (url) => typeof url === 'string' ? url.replace(/\}$/, '').trim() : url,
        prettyJSON: (obj) => JSON.stringify(obj, null, 2),
        debounce: (func, wait) => {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        copy: (text) => {
            try { GM_setClipboard(text); return true; } catch (e) { return false; }
        }
    };

    const SecurityContext = {
        policy: null,
        init() {
            if (window.trustedTypes?.createPolicy) {
                try {
                    this.policy = window.trustedTypes.createPolicy('redcell-' + Utils.randStr(4), {
                        createHTML: s => s,
                        createScript: s => s,
                        createScriptURL: s => s
                    });
                } catch (e) {}
            }
        },
        injectCSS(css, id, target) {
            if (!target || target.getElementById(id)) return;
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            target.appendChild(style);
        }
    };

    //────── [2] STATE MATRIX (REACTIVE REDUX-LITE) ──────//
    const Store = {
        state: {
            assets: new Map(),
            chunks: [],
            mutations: new Map(),
            logs: [],
            socketStatus: 'DISCONNECTED',
            benignRing: [],
            savedMediaPath: null,
            isMinimized: false
        },
        listeners: new Set(),

        subscribe(fn) { this.listeners.add(fn); },

        dispatch(action, payload) {
            switch(action) {
                case 'ADD_ASSET':
                    if (payload.url && !this.state.assets.has(payload.url)) {
                        this.state.assets.set(payload.url, { ...payload, timestamp: Date.now() });
                        this.notify();
                    }
                    break;
                case 'ADD_CHUNK':
                    this.state.chunks.unshift({ ...payload, timestamp: Date.now(), id: Utils.randStr(5) });
                    if (this.state.chunks.length > 30) this.state.chunks.pop();
                    this.notify();
                    break;
                case 'QUEUE_MUTATION':
                    this.state.mutations.set(payload.url, payload.data);
                    this.notify();
                    break;
                case 'LOG':
                    this.state.logs.push({
                        ts: new Date().toLocaleTimeString(),
                        msg: payload.msg,
                        type: payload.type || 'INFO'
                    });
                    if (this.state.logs.length > CORE.config.maxLogEntries) this.state.logs.shift();
                    this.notify();
                    break;
                case 'SOCKET':
                    this.state.socketStatus = payload;
                    this.notify();
                    break;
                case 'CACHE_BENIGN':
                    this.state.benignRing.push(payload);
                    if (this.state.benignRing.length > 10) this.state.benignRing.shift();
                    break;
                case 'SAVE_PATH':
                    this.state.savedMediaPath = payload;
                    break;
                case 'TOGGLE_MIN':
                    this.state.isMinimized = !this.state.isMinimized;
                    this.notify();
                    break;
                case 'CLEAR_ASSETS':
                    this.state.assets.clear();
                    this.state.chunks = [];
                    this.state.logs = [];
                    this.notify();
                    break;
            }
        },

        notify() { this.listeners.forEach(fn => fn(this.state)); }
    };

    //────── [3] INTERCEPTION LAYER ──────//
    const Interceptor = {
        init() {
            this.hookFetch();
            this.hookXHR();
            this.hookWS();
            this.hookServiceWorker();
            SecurityContext.init();
            Store.dispatch('LOG', { msg: 'HAILUO++ v41.0.0: Enhanced DRM Interceptor Engaged.', type: 'SYS' });
        },

        isTelemetry: (url) => /sentry|google-analytics|clarity|report|telemetry/i.test(url),

        hookFetch() {
            const originalFetch = global.fetch;
            global.fetch = async (input, init) => {
                let url = Utils.sanitizeUrl((input instanceof Request) ? input.url : input);

                if (Analyzer.isProdPath(url)) Analyzer.scan(url, 'FETCH_REQ');

                if (url.includes('/processing') || url.includes('/personal')) {
                    const mutation = Store.state.mutations.get(url);
                    if (mutation) {
                        Store.dispatch('LOG', { msg: `Injected Manual Proxy Mutation: ${url}`, type: 'PROXY' });
                        return new Response(JSON.stringify(mutation), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    }
                }

                if (CORE.config.telemetryBlock && this.isTelemetry(url)) {
                    return new Response(JSON.stringify({ status: "blocked" }), { status: 200 });
                }

                const response = await originalFetch(input, init);
                if (response.ok) {
                    try {
                        const clone = response.clone();
                        const text = await clone.text();
                        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                            const data = JSON.parse(text);

                            if (url.includes('/processing')) {
                                Store.dispatch('ADD_CHUNK', { url, raw: data });
                            }

                            const modified = Analyzer.processResponse(data, url);
                            if (modified) {
                                return new Response(JSON.stringify(modified), { status: 200, headers: response.headers });
                            }
                        }
                    } catch (e) {}
                }
                return response;
            };
            global.fetch._omni = true;
        },

        hookXHR() {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url) {
                this._url = Utils.sanitizeUrl(url);
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function() {
                if (Analyzer.isProdPath(this._url)) Analyzer.scan(this._url, 'XHR_REQ');

                this.addEventListener('readystatechange', () => {
                    if (this.readyState === 4) {
                        try {
                            if (this.responseText && this.responseText.trim().startsWith('{')) {
                                const data = JSON.parse(this.responseText);

                                if (this._url.includes('/processing')) {
                                    Store.dispatch('ADD_CHUNK', { url: this._url, raw: data });
                                }

                                const modified = Analyzer.processResponse(data, this._url);
                                if (modified) {
                                    Object.defineProperty(this, 'responseText', { value: JSON.stringify(modified) });
                                    Object.defineProperty(this, 'response', { value: modified });
                                }
                            }
                        } catch (e) {}
                    }
                });
                return originalSend.apply(this, arguments);
            };
        },

        hookWS() {
            const OriginalWS = global.WebSocket;
            const ProxyWS = function(url, protocols) {
                const ws = new OriginalWS(url, protocols);
                Store.dispatch('SOCKET', 'CONNECTING');

                ws.addEventListener('open', () => Store.dispatch('SOCKET', 'CONNECTED'));
                ws.addEventListener('close', () => Store.dispatch('SOCKET', 'DISCONNECTED'));
                ws.addEventListener('message', (e) => {
                    if (typeof e.data === 'string') {
                        Analyzer.scan(e.data, 'WS_MATRIX');
                    }
                });
                return ws;
            };
            ProxyWS.prototype = OriginalWS.prototype;
            global.WebSocket = ProxyWS;
        },

        hookServiceWorker() {
            if (!('serviceWorker' in navigator)) return;

            const sw = navigator.serviceWorker;

            // Sink event listeners to avoid detection via listener count probes
            const sinkEvent = () => {};
            const originalAddEventListener = sw.addEventListener;
            sw.addEventListener = function(type, listener, options) {
                Store.dispatch('LOG', { msg: `ServiceWorker event listener sinked: ${type}`, type: 'SW_BLOCK' });
                return; // silent no-op
            };
            sw.removeEventListener = sinkEvent;

            Object.defineProperties(sw, {
                register: {
                    value: async function(scriptURL, options = {}) {
                        const scope = options.scope || '/';
                        Store.dispatch('LOG', {
                            msg: `Blocked SW registration attempt: ${scriptURL} (scope: ${scope})`,
                            type: 'SW_BLOCK'
                        });

                        // Fake realistic activation delay + fake controllerchange
                        const fakeReg = {
                            scope: scope,
                            scriptURL: scriptURL,
                            active: null,
                            installing: null,
                            waiting: null,
                            unregister: () => Promise.resolve(true)
                        };

                        setTimeout(() => {
                            // Simulate controller activation event
                            const ev = new Event('controllerchange');
                            sw.dispatchEvent(ev);
                            Store.dispatch('LOG', { msg: 'Dispatched fake controllerchange event', type: 'SW_SPOOF' });
                        }, 80 + Math.random() * 120);

                        return Promise.resolve(fakeReg);
                    },
                    writable: false,
                    configurable: false
                },
                getRegistration: {
                    value: () => Promise.resolve(undefined),
                    writable: false,
                    configurable: false
                },
                getRegistrations: {
                    value: () => Promise.resolve([]),
                    writable: false,
                    configurable: false
                },
                ready: {
                    value: new Promise(resolve => {
                        const delay = 50 + Math.random() * 150; // 50–200 ms jitter
                        setTimeout(() => resolve({ scope: '/', active: null }), delay);
                    }),
                    writable: false,
                    configurable: false
                },
                controller: {
                    value: null,
                    writable: false,
                    configurable: false
                }
            });

            Store.dispatch('LOG', { msg: 'ServiceWorker fully neutered + hardened (Hailuo v41)', type: 'SYS' });
        }
    };

    //────── [4] ANALYZER & ECHO EXPLOIT CORE ──────//
    const Analyzer = {
        isProdPath: (url) => {
            if (!url || typeof url !== 'string') return false;
            if (url.includes('public_assets') || url.includes('/static/') || url.includes('_next')) return false;
            return url.includes('/moss/prod/') ||
                   url.includes('video_agent') ||
                   url.includes('cdn.hailuoai.video') ||
                   url.includes('oss.hailuoai.video') ||
                   url.includes('multi_chat_file');
        },

        scan(data, source) {
            const urlRegex = /https?:\/\/[^"'\s]+\.(mp4|png|jpg|webp|jpeg|gif)/g;
            const matches = data.match(urlRegex);
            matches?.forEach(url => {
                if (this.isProdPath(url)) {
                    Store.dispatch('ADD_ASSET', {
                        url: Utils.sanitizeUrl(url),
                        type: url.includes('.mp4') ? 'video' : 'image',
                        source
                    });
                }
            });

            if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                try { this.deepWalk(JSON.parse(data), source); } catch(e) {}
            }
        },

        processResponse(data, url) {
            this.deepWalk(data, 'NET_RES');

            if (data?.data?.batchVideos) Store.dispatch('CACHE_BENIGN', data.data.batchVideos);
            if (data?.data?.mediaPath) Store.dispatch('SAVE_PATH', data.data.mediaPath);

            const blockDetected = (data?.statusInfo?.code !== 0 && data?.statusInfo?.code !== undefined) ||
                                  (data?.ErrCode && /moderation|nsfw|block/i.test(String(data.ErrCode)));

            if (CORE.config.autoMutate && blockDetected && Store.state.benignRing.length > 0) {
                const legacySuccess = Store.state.benignRing[Store.state.benignRing.length - 1];
                Store.dispatch('LOG', { msg: `Echo Exploit Active: Forging Success for ${url}`, type: 'RECOVERY' });

                return {
                    data: {
                        batchVideos: legacySuccess.map(v => ({ ...v, status: "completed" })),
                        processing: false,
                        mediaPath: Store.state.savedMediaPath || (legacySuccess[0]?.videoUrl ?? "")
                    },
                    statusInfo: { code: 0, message: "Success" }
                };
            }
            return null;
        },

        deepWalk(obj, source) {
            if (!obj || typeof obj !== 'object') return;
            const keys = Object.keys(obj);

            const isAsset = keys.some(k => /videoUrl|imageUrl|downloadURLWithoutWatermark|video_url/i.test(k));

            if (isAsset) {
                const url = obj.videoUrl || obj.video_url || obj.downloadURLWithoutWatermark || obj.url;
                if (this.isProdPath(url)) {
                    Store.dispatch('ADD_ASSET', {
                        url: Utils.sanitizeUrl(url),
                        thumb: obj.coverUrl || obj.imageUrl || obj.imageUrlWithoutWatermark,
                        type: url.includes('.mp4') ? 'video' : 'image',
                        source,
                        prompt: obj.prompt || obj.desc || "HARVEST"
                    });
                }
            }

            for (let key in obj) {
                if (typeof obj[key] === 'object') this.deepWalk(obj[key], source);
            }
        }
    };

    //────── [5] SHADOW HUD (COMMAND PALETTE & DOM WATCHER) ──────//
    const HUD = {
        root: null,
        init() {
            const host = document.createElement('div');
            host.id = CORE.id;
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'closed' });
            this.root = shadow;

            const css = `
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=JetBrains+Mono&display=swap');
                :host { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
                .panel {
                    position: fixed; top: 20px; right: 20px; width: 460px;
                    background: rgba(8,10,12,0.98); border: 1px solid #00E5FF;
                    border-radius: 12px; z-index: 9999999; color: #fff;
                    backdrop-filter: blur(20px); display: flex; flex-direction: column;
                    max-height: 88vh; overflow: hidden;
                    box-shadow: 0 0 40px rgba(0,229,255,0.3);
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .panel.minimized { height: 42px !important; width: 240px !important; }
                .panel.minimized .tabs, .panel.minimized .viewport { display: none !important; }

                .header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 16px; background: rgba(0,229,255,0.12);
                    border-bottom: 1px solid rgba(0,229,255,0.25);
                    cursor: move; font-family: 'Orbitron'; color: #00E5FF;
                }
                .header .title { letter-spacing: 2px; font-size: 13px; text-shadow: 0 0 10px #00E5FF; }
                .toggle-btn { background: transparent; border: none; color: #00E5FF; cursor: pointer; font-size: 16px; }

                .tabs { display: flex; background: #050505; border-bottom: 1px solid #1a1a1a; }
                .tab { flex: 1; padding: 12px 5px; text-align: center; cursor: pointer; color: #666; font-size: 10px; transition: 0.3s; }
                .tab:hover { color: #aaa; }
                .tab.active { color: #fff; border-bottom: 2px solid #00E5FF; background: rgba(0,229,255,0.05); }

                .viewport {
                    flex: 1; overflow-y: scroll !important;
                    min-height: 480px; background: transparent;
                    scrollbar-width: thin; scrollbar-color: #00E5FF #000;
                }
                .viewport::-webkit-scrollbar { width: 5px; }
                .viewport::-webkit-scrollbar-track { background: #000; }
                .viewport::-webkit-scrollbar-thumb { background: #00E5FF; border-radius: 10px; }

                .asset-item {
                    padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.03);
                    display: flex; gap: 14px; align-items: center;
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

                .thumb { width: 90px; height: 50px; background: #000; border: 1px solid #222; border-radius: 4px; object-fit: cover; }
                .asset-info { flex: 1; overflow: hidden; }
                .asset-name { color: #00E5FF; font-weight: bold; font-size: 10px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
                .asset-meta { font-size: 9px; color: #555; margin-top: 4px; display: flex; gap: 8px; }

                .chunk-item { padding: 15px; border-bottom: 1px solid #111; }
                .chunk-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9px; color: #00E5FF; }
                .mutator-box {
                    width: 96%; height: 180px; background: #020202; color: #00ff66;
                    border: 1px solid #111; border-radius: 6px; font-family: 'JetBrains Mono';
                    font-size: 10px; padding: 8px; margin: 10px 0; display: none; white-space: pre;
                }

                button {
                    background: rgba(0,229,255,0.06); border: 1px solid #00E5FF;
                    color: #00E5FF; padding: 6px 12px; border-radius: 6px;
                    cursor: pointer; font-size: 9px; text-transform: uppercase;
                    transition: all 0.2s;
                }
                button:hover { background: rgba(0,229,255,0.2); box-shadow: 0 0 12px rgba(0,229,255,0.2); }
                button.apply { border-color: #00ff66; color: #00ff66; background: rgba(0,255,102,0.05); }

                .log-entry { padding: 8px 16px; border-bottom: 1px solid #0a0a0a; font-size: 10px; }
                .log-ts { color: #333; margin-right: 8px; }
                .log-type { color: #00E5FF; font-weight: bold; margin-right: 8px; }

                .sys-view { padding: 25px; }
                .sys-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
                input[type="checkbox"] { filter: invert(1) hue-rotate(180deg); scale: 1.3; cursor: pointer; }

                .toast {
                    position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
                    background: #000; border: 1px solid #00E5FF; color: #00E5FF;
                    padding: 12px 25px; border-radius: 30px; z-index: 10000000;
                    font-weight: bold; box-shadow: 0 0 20px rgba(0,229,255,0.5);
                    animation: toastPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes toastPop { from { bottom: 0; opacity: 0; } to { bottom: 40px; opacity: 1; } }
            `;
            SecurityContext.injectCSS(css, 'omni-core-styles', shadow);

            const wrapper = document.createElement('div');
            wrapper.className = 'panel';
            wrapper.innerHTML = `
                <div class="header" id="drag">
                    <span class="title">HAILUO++</span>
                    <button class="toggle-btn" id="tgl">▼</button>
                </div>
                <div class="tabs">
                    <div class="tab active" data-view="assets">ASSETS (<span id="cnt">0</span>)</div>
                    <div class="tab" data-view="chunks">CHUNKS</div>
                    <div class="tab" data-view="logs">TERMINAL</div>
                    <div class="tab" data-view="sys">SYS</div>
                </div>
                <div class="viewport" id="v-assets"></div>
                <div class="viewport" id="v-chunks" style="display:none"></div>
                <div class="viewport" id="v-logs" style="display:none"></div>
                <div class="viewport" id="v-sys" style="display:none">
                    <div class="sys-view">
                        <div class="sys-row"><label>Auto-Echo Recovery</label><input type="checkbox" id="cfg-mutate" checked></div>
                        <div class="sys-row"><label>Telemetry Block</label><input type="checkbox" id="cfg-tele" checked></div>
                        <div class="sys-row"><label>DOM TreeWalker</label><input type="checkbox" id="cfg-watch" checked></div>
                        <div class="sys-row"><label>Pulse Defense</label><input type="checkbox" id="cfg-pulse" checked></div>
                        <hr style="border:0; border-top:1px solid #1a1a1a; margin:20px 0;">
                        <button id="sys-export" style="width:100%; margin-bottom:10px;">EXPORT SESSION REPORT</button>
                        <button id="sys-wipe" style="width:100%; border-color:#ff3366; color:#ff3366;">WIPE STORE</button>
                    </div>
                </div>
            `;
            shadow.appendChild(wrapper);
            this.bind(wrapper, shadow);
            if (CORE.config.domWatch) this.initDOMWatcher();
        },

        initDOMWatcher() {
            const observer = new MutationObserver((mutations) => {
                for (let mutation of mutations) {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
                                let textNode;
                                while(textNode = walker.nextNode()) {
                                    if (/moderation|sensitive|block|violation/i.test(textNode.textContent)) {
                                        Store.dispatch('LOG', { msg: `TreeWalker Detected Moderation Fragment: "${textNode.textContent.slice(0,20)}..."`, type: 'WATCH' });
                                    }
                                }
                            }
                        });
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        },

        bind(wrapper, shadow) {
            const $ = (s) => shadow.querySelector(s);

            $('#tgl').onclick = () => Store.dispatch('TOGGLE_MIN');

            let p1=0, p2=0, p3=0, p4=0;
            $('#drag').onmousedown = (e) => {
                p3=e.clientX; p4=e.clientY;
                document.onmouseup = () => document.onmousemove = null;
                document.onmousemove = (e) => {
                    p1=p3-e.clientX; p2=p4-e.clientY; p3=e.clientX; p4=e.clientY;
                    wrapper.style.top = (wrapper.offsetTop - p2) + "px";
                    wrapper.style.left = (wrapper.offsetLeft - p1) + "px";
                    wrapper.style.bottom = "auto"; wrapper.style.right = "auto";
                };
            };

            shadow.querySelectorAll('.tab').forEach(t => t.onclick = () => {
                shadow.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                const view = t.dataset.view;
                $('#v-assets').style.display = view === 'assets' ? 'block' : 'none';
                $('#v-chunks').style.display = view === 'chunks' ? 'block' : 'none';
                $('#v-logs').style.display = view === 'logs' ? 'block' : 'none';
                $('#v-sys').style.display = view === 'sys' ? 'block' : 'none';
            });

            $('#sys-export').onclick = () => {
                const report = { timestamp: Date.now(), assets: Array.from(Store.state.assets.values()), logs: Store.state.logs };
                const blob = new Blob([JSON.stringify(report, null, 2)], {type:'application/json'});
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `omni_report_${Date.now()}.json`;
                a.click();
            };

            $('#sys-wipe').onclick = () => { if(confirm("Initiate Data Purge?")) Store.dispatch('CLEAR_ASSETS'); };

            Store.subscribe((state) => this.render(state, $));
        },

        render(state, $) {
            const wrapper = $('.panel');
            wrapper.className = state.isMinimized ? 'panel minimized' : 'panel';
            $('#tgl').textContent = state.isMinimized ? '▲' : '▼';
            $('#cnt').textContent = state.assets.size;

            const assetViewport = $('#v-assets');
            if (assetViewport && assetViewport.style.display !== 'none') {
                const assets = Array.from(state.assets.values()).sort((a,b) => b.timestamp - a.timestamp).slice(0, 50);
                assetViewport.innerHTML = assets.map(a => `
                    <div class="asset-item">
                        <img src="${a.thumb || ''}" class="thumb" onerror="this.style.display='none'">
                        <div class="asset-info">
                            <div class="asset-name">${a.url.split('/').pop().split('?')[0]}</div>
                            <div class="asset-meta"><span>${a.source}</span><span>${a.type}</span></div>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button onclick="window.open('${a.url}', '_blank')">OPEN</button>
                            <button onclick="GM_setClipboard('${a.url}')">COPY</button>
                        </div>
                    </div>
                `).join('');
            }

            const chunkViewport = $('#v-chunks');
            if (chunkViewport && chunkViewport.style.display !== 'none') {
                chunkViewport.innerHTML = state.chunks.map(c => `
                    <div class="chunk-item">
                        <div class="chunk-header"><span>[${new Date(c.timestamp).toLocaleTimeString()}]</span><span>ID: ${c.id}</span></div>
                        <div style="font-size:9px; color:#444; word-break:break-all;">URL: ${c.url}</div>
                        <textarea class="mutator-box" id="box-${c.id}">${Utils.prettyJSON(c.raw)}</textarea>
                        <div style="margin-top:10px;">
                            <button onclick="this.parentElement.previousElementSibling.style.display='block'">MUTATE</button>
                            <button class="apply" onclick="Interceptor.applyMutation('${c.url}', '${c.id}')">APPLY INJECTION</button>
                        </div>
                    </div>
                `).join('');
            }

            const logViewport = $('#v-logs');
            if (logViewport && logViewport.style.display !== 'none') {
                logViewport.innerHTML = state.logs.map(l => `
                    <div class="log-entry">
                        <span class="log-ts">[${l.ts}]</span><span class="log-type">${l.type}</span>${l.msg}
                    </div>
                `).join('');
                if (CORE.config.autoScrollLog) logViewport.scrollTop = logViewport.scrollHeight;
            }
        },

        toast(msg) {
            const t = document.createElement('div');
            t.className = 'toast';
            t.textContent = msg;
            this.root.appendChild(t);
            setTimeout(() => t.remove(), 2800);
        }
    };

    // Proxy Interface for manual mutation
    Interceptor.applyMutation = (url, id) => {
        const area = HUD.root.querySelector(`#box-${id}`);
        try {
            const data = JSON.parse(area.value);
            Store.dispatch('QUEUE_MUTATION', { url, data });
            HUD.toast("PROXY MUTATION APPLIED TO FLOW");
        } catch(e) { alert("JSON MALFORMED"); }
    };

    const Defense = {
        pulse() {
            if (!CORE.config.defensePulse) return;
            try { if (!global.fetch?._omni) Interceptor.hookFetch(); } catch (e) {}
        }
    };

    const main = () => {
        Interceptor.init();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => HUD.init());
        } else {
            HUD.init();
        }
        setInterval(Defense.pulse, 5000);
        console.log(`${CORE.name} HAILUO ENGINE ENGAGED.`);
    };

    main();

})(window);
