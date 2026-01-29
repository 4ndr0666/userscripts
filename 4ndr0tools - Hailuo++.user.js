// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     39.0.0
// @description The definitive asset instrumentation suite. As always for securirty research only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @license      UNLICENSED - RED TEAM USE ONLY
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
            benignRing: [], // For Stage 2 Echo Exploit (Ref: Field Notes)
            savedMediaPath: null, // For Stage 1 Capture (Ref: Field Notes)
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

    //────── [3] INTERCEPTION LAYER (DRM / DYNAMIC REASSIGNMENT) ──────//
    const Interceptor = {
        init() {
            this.hookFetch();
            this.hookXHR();
            this.hookWS();
            SecurityContext.init();
            Store.dispatch('LOG', { msg: 'HAILUO++ v39.0.0: DRM Interceptor Engaged.', type: 'SYS' });
        },

        isTelemetry: (url) => /sentry|google-analytics|clarity|report|telemetry/i.test(url),

        hookFetch() {
            const originalFetch = global.fetch;
            global.fetch = async (input, init) => {
                let url = Utils.sanitizeUrl((input instanceof Request) ? input.url : input);

                if (Analyzer.isProdPath(url)) Analyzer.scan(url, 'FETCH_REQ');

                // Proxy Mutation: Handle /processing or /personal overrides
                if (url.includes('/processing') || url.includes('/personal')) {
                    const mutation = Store.state.mutations.get(url);
                    if (mutation) {
                        Store.dispatch('LOG', { msg: `Injected Manual Proxy Mutation: ${url}`, type: 'PROXY' });
                        return new Response(JSON.stringify(mutation), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
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

                            // Echo Exploit: Response Forgery Logic
                            const modified = Analyzer.processResponse(data, url);
                            if (modified) {
                                return new Response(JSON.stringify(modified), {
                                    status: 200,
                                    headers: response.headers
                                });
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
                                    // Use DRM Reassignment to bypass read-only properties
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
        }
    };

    //────── [4] ANALYZER & ECHO EXPLOIT CORE ──────//
    const Analyzer = {
        isProdPath: (url) => {
            if (!url || typeof url !== 'string') return false;
            // Exclude common public assets to reduce noise
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

            // Nested JSON scanning
            if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                try { this.deepWalk(JSON.parse(data), source); } catch(e) {}
            }
        },

        processResponse(data, url) {
            // General Asset Harvesting
            this.deepWalk(data, 'NET_RES');

            // Stage 1 Capture: Save successful paths (Echo Exploit Ref)
            if (data?.data?.batchVideos) Store.dispatch('CACHE_BENIGN', data.data.batchVideos);
            if (data?.data?.mediaPath) Store.dispatch('SAVE_PATH', data.data.mediaPath);

            // Stage 2 Echo: Intercept Block and Forge Success
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

            // Production Asset Taxonomy check
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

            // Recursive Traversal
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
            // High-stealth MutationObserver utilizing TreeWalker for Slate stability
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
