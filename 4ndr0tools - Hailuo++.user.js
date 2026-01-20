// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     38.0.0APEXOMNI
// @description The definitive asset instrumentation suite. Zero-latency WebSocket parsing, Shadow-DOM encapsulation, and reactive state management. As always for securirty research only.
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_setClipboard
// @grant       unsafeWindow
// @license     UNLICENSED - OMNI
// ==/UserScript==

(function (global) {
    "use strict";

    //────── [0] KERNEL: IDENTITY & ENTROPY ──────//
    const CORE = {
        name: "HailuoΨ-OMNI",
        id: `psi-${Math.random().toString(36).slice(2, 9)}`,
        config: {
            telemetryBlock: true,
            autoScrollLog: true,
            maxLogEntries: 100
        }
    };

    const LOG_PREFIX = `[${CORE.name}]`;

    //────── [1] STATE MATRIX (REACTIVE STORE) ──────//
    // A simplified reactive store. When data changes, the UI updates automatically.
    const Store = {
        state: {
            assets: new Map(),
            logs: [],
            socketStatus: 'DISCONNECTED'
        },
        listeners: new Set(),

        subscribe(fn) {
            this.listeners.add(fn);
        },

        dispatch(action, payload) {
            switch(action) {
                case 'ADD_ASSET':
                    if (payload.url && !this.state.assets.has(payload.url)) {
                        this.state.assets.set(payload.url, {
                            ...payload,
                            timestamp: Date.now()
                        });
                        this.notify();
                    }
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
            }
        },

        notify() {
            this.listeners.forEach(fn => fn(this.state));
        }
    };

    //────── [2] INTERCEPTION LAYER (READ-ONLY) ──────//
    const Interceptor = {
        init() {
            this.hookFetch();
            this.hookXHR();
            this.hookWS();
            Store.dispatch('LOG', { msg: 'Interceptor Matrix Online', type: 'SYS' });
        },

        isTelemetry(url) {
            return /sentry|google-analytics|clarity|report/i.test(url);
        },

        hookFetch() {
            const originalFetch = global.fetch;
            global.fetch = async (input, init) => {
                const url = (input instanceof Request) ? input.url : input;

                if (CORE.config.telemetryBlock && Interceptor.isTelemetry(url)) {
                    return new Response("{}", {status: 200});
                }

                const response = await originalFetch(input, init);

                if (response.ok) {
                    const clone = response.clone();
                    clone.text().then(txt => Analyzer.scan(txt, 'FETCH'));
                }

                return response;
            };
        },

        hookXHR() {
            const originalOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (CORE.config.telemetryBlock && Interceptor.isTelemetry(url)) {
                    arguments[1] = 'data:application/json,{}';
                }
                this.addEventListener('load', () => {
                    if (this.responseText) Analyzer.scan(this.responseText, 'XHR');
                });
                return originalOpen.apply(this, arguments);
            };
        },

        hookWS() {
            const OriginalWS = global.WebSocket;
            const WSProxy = new Proxy(OriginalWS, {
                construct(target, args) {
                    const ws = new target(...args);
                    Store.dispatch('SOCKET', 'CONNECTING');

                    ws.addEventListener('open', () => Store.dispatch('SOCKET', 'CONNECTED'));
                    ws.addEventListener('close', () => Store.dispatch('SOCKET', 'DISCONNECTED'));

                    ws.addEventListener('message', (e) => {
                        if (typeof e.data === 'string') {
                            Analyzer.scan(e.data, 'WEBSOCKET');
                        }
                    });
                    return ws;
                }
            });
            global.WebSocket = WSProxy;
        }
    };

    //────── [3] ANALYZER ENGINE ──────//
    const Analyzer = {
        scan(data, source) {
            if (!data) return;

            // 1. Raw URL Extraction (Regex)
            // Catches any media URL passing through the wire
            const urlRegex = /https?:\/\/[^"'\s]+\.(mp4|png|jpg|webp)/g;
            const matches = data.match(urlRegex);
            if (matches) {
                matches.forEach(url => {
                    if (url.includes('hailuoai.video') || url.includes('pixverse')) {
                        Store.dispatch('ADD_ASSET', {
                            url,
                            type: 'raw-stream',
                            source
                        });
                    }
                });
            }

            // 2. Structured JSON Parsing
            // Looks for specific Hailuo/PixVerse object shapes
            try {
                if (data.startsWith('{') || data.startsWith('[')) {
                    const json = JSON.parse(data);
                    this.deepWalk(json, source);
                }
            } catch (e) { /* ignore parse errors */ }
        },

        deepWalk(obj, source) {
            if (!obj || typeof obj !== 'object') return;

            // Heuristics for Asset Objects
            const isAsset = (o) => (o.videoUrl || o.video_url || o.downloadURLWithoutWatermark);

            if (isAsset(obj)) {
                const url = obj.downloadURLWithoutWatermark || obj.videoUrl || obj.video_url;
                const thumb = obj.coverUrl || obj.imageUrl || obj.cover_url;
                const id = obj.id || obj.batchID || url.split('/').pop();

                if (url) {
                    Store.dispatch('ADD_ASSET', {
                        id, url, thumb, type: 'video', source,
                        prompt: obj.prompt || obj.desc || "No Prompt"
                    });
                }
            }

            Object.values(obj).forEach(val => this.deepWalk(val, source));
        }
    };

    //────── [4] SHADOW HUD (UI) ──────//
    const HUD = {
        root: null,

        init() {
            const host = document.createElement('div');
            host.id = CORE.id;
            document.body.appendChild(host);

            const shadow = host.attachShadow({ mode: 'closed' });
            HUD.root = shadow;

            const style = document.createElement('style');
            style.textContent = `
                :host { font-family: 'JetBrains Mono', 'Consolas', monospace; font-size: 11px; }
                * { box-sizing: border-box; }
                .panel {
                    position: fixed; bottom: 20px; left: 20px; width: 400px;
                    background: #050505; border: 1px solid #333;
                    border-left: 3px solid #00E5FF; color: #ccc;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                    display: flex; flex-direction: column; max-height: 80vh;
                    z-index: 9999999; transition: height 0.3s;
                }
                .header {
                    padding: 10px; background: #0a0a0a; border-bottom: 1px solid #222;
                    display: flex; justify-content: space-between; align-items: center;
                    cursor: pointer; user-select: none;
                }
                .title { font-weight: 700; color: #00E5FF; }
                .status { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #222; }
                .status.connected { color: #0f0; background: #002200; }

                .tabs { display: flex; background: #0f0f0f; border-bottom: 1px solid #222; }
                .tab { flex: 1; padding: 8px; text-align: center; cursor: pointer; color: #666; }
                .tab.active { color: #fff; background: #222; border-bottom: 2px solid #00E5FF; }

                .viewport { flex: 1; overflow-y: auto; background: #000; min-height: 200px; scrollbar-width: thin; scrollbar-color: #333 #000; }

                /* Asset Card */
                .asset { display: flex; padding: 8px; border-bottom: 1px solid #1a1a1a; gap: 10px; }
                .asset:hover { background: #0a0a0a; }
                .thumb { width: 80px; height: 45px; background: #111; object-fit: cover; border: 1px solid #222; }
                .info { flex: 1; overflow: hidden; }
                .filename { color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
                .meta { color: #555; font-size: 9px; display: flex; gap: 6px; }
                .actions { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
                button {
                    background: transparent; border: 1px solid #333; color: #777;
                    cursor: pointer; padding: 2px 6px; font-size: 9px; border-radius: 2px;
                }
                button:hover { border-color: #00E5FF; color: #00E5FF; }

                /* Logs */
                .log-entry { padding: 4px 8px; border-bottom: 1px solid #111; display: flex; gap: 8px; }
                .log-ts { color: #444; }
                .log-type { color: #00E5FF; font-weight: bold; width: 30px; }
                .log-msg { color: #aaa; word-break: break-all; }
            `;
            shadow.appendChild(style);

            const wrapper = document.createElement('div');
            wrapper.className = 'panel';
            wrapper.innerHTML = `
                <div class="header" id="toggle">
                    <span class="title">Ψ HAILUO OMNI</span>
                    <span class="status" id="socket-status">INIT</span>
                </div>
                <div class="tabs">
                    <div class="tab active" data-view="assets">ASSETS (<span id="count">0</span>)</div>
                    <div class="tab" data-view="logs">TERMINAL</div>
                </div>
                <div class="viewport" id="view-assets"></div>
                <div class="viewport" id="view-logs" style="display:none"></div>
            `;
            shadow.appendChild(wrapper);

            // Logic
            const $ = (s) => shadow.querySelector(s);

            $('#toggle').onclick = () => wrapper.classList.toggle('minimized');

            shadow.querySelectorAll('.tab').forEach(t => t.onclick = () => {
                shadow.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
                t.classList.add('active');
                if (t.dataset.view === 'assets') {
                    $('#view-assets').style.display = 'block';
                    $('#view-logs').style.display = 'none';
                } else {
                    $('#view-assets').style.display = 'none';
                    $('#view-logs').style.display = 'block';
                }
            });

            // Store Subscription
            Store.subscribe((state) => {
                // Update Socket Status
                const statusEl = $('#socket-status');
                statusEl.textContent = state.socketStatus;
                statusEl.className = `status ${state.socketStatus === 'CONNECTED' ? 'connected' : ''}`;

                // Update Assets
                const assetContainer = $('#view-assets');
                $('#count').textContent = state.assets.size;

                // Simple redraw (for stability over differential updates in this context)
                assetContainer.innerHTML = '';
                const sortedAssets = Array.from(state.assets.values()).sort((a,b) => b.timestamp - a.timestamp);

                sortedAssets.forEach(asset => {
                    const el = document.createElement('div');
                    el.className = 'asset';
                    const thumb = asset.thumb || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHJlY3QgZmlsbD0iIzExMSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+PC9zdmc+';

                    el.innerHTML = `
                        <img src="${thumb}" class="thumb">
                        <div class="info">
                            <div class="filename" title="${asset.url}">${asset.url.split('/').pop()}</div>
                            <div class="meta">
                                <span>${asset.source}</span>
                                <span>${asset.type || 'unknown'}</span>
                            </div>
                        </div>
                        <div class="actions">
                            <button class="dl">DL</button>
                            <button class="cp">CP</button>
                        </div>
                    `;

                    el.querySelector('.dl').onclick = () => window.open(asset.url, '_blank');
                    el.querySelector('.cp').onclick = () => {
                        GM_setClipboard(asset.url);
                        Store.dispatch('LOG', { msg: `Copied ${asset.url.substr(-10)}`, type: 'UI' });
                    };

                    assetContainer.appendChild(el);
                });

                // Update Logs
                const logContainer = $('#view-logs');
                logContainer.innerHTML = state.logs.map(l => `
                    <div class="log-entry">
                        <span class="log-ts">${l.ts}</span>
                        <span class="log-type">${l.type}</span>
                        <span class="log-msg">${l.msg}</span>
                    </div>
                `).join('');
                if (CORE.config.autoScrollLog) logContainer.scrollTop = logContainer.scrollHeight;
            });
        }
    };

    //────── [5] BOOTSTRAP ──────//
    const main = () => {
        Interceptor.init();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', HUD.init);
        } else {
            HUD.init();
        }

        console.log(`${LOG_PREFIX} OMNI-Protocol Engaged. Listening...`);
    };

    main();

})(window);
