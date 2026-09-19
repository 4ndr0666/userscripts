// ==UserScript==
// @name        4ndr0tools - Recon
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.3.1-AHE
// @description Red-team tool for automated recon. Passively captures all traffic and generates a heuristic analysis report on command. For security research only.
// @license     UNLICENSED - RED TEAM USE ONLY
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Recon.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Recon.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match       *://*/*
// @run-at      document-start
// @grant       none
// ==/UserScript==

(() => {
    "use strict";

    if (window._reconEngineInitialized) return;
    window._reconEngineInitialized = true;

    const DEBUG_PREFIX = '[Ψ-RECON]';
    let _sessionData = [];

    window.reconEngine = {
        get sessionData() { return _sessionData; },
        startNewSession: () => {
            _sessionData = [];
            log('New session started. Void purged.');
            updateDebugUI();
        },
        generateReport: () => generateAnalysisReport(),
    };

    const log = (...args) => console.log('%c' + DEBUG_PREFIX, 'color:#15FFFF;font-weight:bold', ...args);
    const error = (...args) => console.error(DEBUG_PREFIX, ...args);
    const safeDeepClone = (obj) => { try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return null; } };

    const parseBody = (body) => {
        if (!body) return null;
        if (body instanceof FormData) {
            const obj = {};
            for (const [key, value] of body.entries()) {
                obj[key] = (value instanceof File) ? { fileName: value.name, fileSize: value.size } : value;
            }
            return obj;
        }
        if (typeof body === "string") { try { return JSON.parse(body); } catch (e) { return body; } }
        return null;
    };

    const logApiResponse = (url, data, type, method) => {
        const clonedData = safeDeepClone(data);
        if (clonedData !== null) {
            _sessionData.push({ timestamp: new Date().toISOString(), url, type, method, data: clonedData });
            updateDebugUI();
        }
    };

    // [Ψ-FETCH-PROXY] Enhanced Fetch with SSE Support
    function overrideFetch() {
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
            const method = (args[1]?.method || "GET").toUpperCase();

            if (args[1]?.body) logApiResponse(url, parseBody(args[1].body), 'request', method);

            const response = await origFetch.apply(this, args);
            const contentType = response.headers.get('Content-Type') || '';

            if (contentType.includes('text/event-stream')) {
                const reader = response.clone().body.getReader();
                const decoder = new TextDecoder();
                (async () => {
                    let buffer = '';
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                try {
                                    const json = JSON.parse(line.substring(5).trim());
                                    logApiResponse(url, json, 'sse-chunk', method);
                                } catch (e) {}
                            }
                        }
                    }
                })();
            } else if (contentType.includes('application/json')) {
                try {
                    const json = await response.clone().json();
                    logApiResponse(url, json, 'response', method);
                } catch (e) {}
            }
            return response;
        };
    }

    // [Ψ-XHR-PROXY]
    function overrideXHR() {
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function(method, url) {
            this._method = method;
            this._url = url;
            return origOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function(body) {
            if (body) logApiResponse(this._url, parseBody(body), 'request', this._method);
            this.addEventListener('load', () => {
                if (this.readyState === 4 && this.responseText) {
                    try {
                        const json = JSON.parse(this.responseText);
                        logApiResponse(this._url, json, 'response', this._method);
                    } catch (e) {}
                }
            });
            return origSend.apply(this, arguments);
        };
    }

    // [Ψ-WS-PROXY] WebSocket Interception
    function overrideWS() {
        const NativeWS = window.WebSocket;
        window.WebSocket = function(url, protocols) {
            const ws = new NativeWS(url, protocols);
            ws.addEventListener('message', (event) => {
                try {
                    const json = JSON.parse(event.data);
                    logApiResponse(url, json, 'websocket', 'WS');
                } catch (e) {}
            });
            return ws;
        };
        window.WebSocket.prototype = NativeWS.prototype;
    }

    async function generateAnalysisReport() {
        const reportArea = document.getElementById('recon-report-output');
        const statusEl = document.getElementById('recon-status-msg');

        if (_sessionData.length === 0) {
            reportArea.value = "Void state. Capture data first.";
            return;
        }

        const endpointStats = _sessionData.reduce((acc, entry) => {
            const path = entry.url.split('?')[0];
            if (!acc[path]) acc[path] = { count: 0, methods: new Set() };
            acc[path].count++;
            acc[path].methods.add(entry.method);
            return acc;
        }, {});

        let report = "## Reconnaissance Report (" + new Date().toISOString() + ")\n\n";
        report += "### 1. Endpoint Profile\n| Count | Methods | Path |\n|---|---|---|\n";
        Object.entries(endpointStats).sort((a, b) => b[1].count - a[1].count).forEach(([path, stats]) => {
            report += "| " + stats.count + " | " + Array.from(stats.methods).join(', ') + " | `" + path + "` |\n";
        });

        // [Ψ-NEXUS] Deep JSON Path Mapping for Heuristics
        const keyKeywords = ['videoId', 'mediaUrl', 'task', 'status', 'isModerated', 'assetId', 'toolResponses', 'prompt', 'message', 'restricted'];
        const interestingData = new Set();

        const traverse = (obj, path = '$', contextMethod = '', contextUrl = '') => {
            if (typeof obj !== 'object' || obj === null) return;
            for (const key in obj) {
                const currentPath = path + "." + key;
                if (keyKeywords.some(kw => key.toLowerCase().includes(kw.toLowerCase()))) {
                    let val = obj[key];
                    let typeStr = typeof val;
                    if (val === null) typeStr = 'null';
                    else if (Array.isArray(val)) typeStr = "Array(" + val.length + ")";
                    else if (typeStr === 'string') val = val.length > 50 ? val.substring(0, 50) + '...' : val;

                    if (typeStr === 'string' || typeStr === 'number' || typeStr === 'boolean') {
                        interestingData.add("* `" + currentPath + "` (" + typeStr + "): " + val + "  _[" + contextMethod + "]_");
                    } else {
                        interestingData.add("* `" + currentPath + "` (" + typeStr + ")  _[" + contextMethod + "]_");
                    }
                }
                traverse(obj[key], currentPath, contextMethod, contextUrl);
            }
        };

        _sessionData.forEach(entry => traverse(entry.data, '$', entry.method, entry.url));

        report += "\n### 2. Seized High-Value State Paths\n" + [...interestingData].sort().join('\n') + "\n";

        reportArea.value = report;

        // [Ψ-AUTO-COPY] Instant Clipboard Exfiltration
        try {
            await navigator.clipboard.writeText(report);
            if (statusEl) {
                statusEl.innerText = "REPORT EXFILTRATED TO CLIPBOARD";
                statusEl.style.color = "#15FFFF";
                setTimeout(() => { statusEl.innerText = ""; }, 3000);
            }
            log('Report generated and copied to clipboard.');
        } catch (err) {
            error('Clipboard access denied. Please click inside the document to allow permissions.');
            if (statusEl) {
                statusEl.innerText = "CLIPBOARD DENIED - COPY MANUALLY";
                statusEl.style.color = "#FF0000";
            }
        }
    }

    function injectUI() {
        const panel = document.createElement("div");
        panel.id = "recon-engine-panel";
        panel.style.cssText = "position:fixed;bottom:20px;right:20px;width:600px;height:450px;background:rgba(5,5,5,0.95);color:#15FFFF;border:1px solid #15FFFF;z-index:2147483647;font-family:'Consolas',monospace;display:flex;flex-direction:column;box-shadow:0 0 20px rgba(21,255,255,0.4);border-radius:6px;backdrop-filter:blur(5px);";

        // Multi-line HTML remains safe inside standard template literals, no nested backticks used.
        panel.innerHTML = `
            <div class="recon-header" style="background:#0a0a0a;font-weight:bold;border-bottom:1px solid #15FFFF;padding:8px 10px;display:flex;justify-content:space-between;cursor:move;border-radius:6px 6px 0 0;">
                <span style="pointer-events:none;">Ψ-RECON-QUANTUM v2.3.1</span>
                <span id="recon-status-msg" style="font-size:10px;pointer-events:none;"></span>
            </div>
            <div style="display:flex;gap:5px;padding:8px 10px 4px 10px;">
                <button id="recon-session-btn" style="background:#000;color:#15FFFF;border:1px solid #15FFFF;cursor:pointer;flex:1;padding:6px;font-family:inherit;">Purge Session</button>
                <button id="recon-report-btn" style="background:#15FFFF;color:#000;border:1px solid #15FFFF;cursor:pointer;flex:1;font-weight:bold;padding:6px;font-family:inherit;">GENERATE & COPY REPORT</button>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;gap:5px;padding:4px 10px 10px 10px;">
                <textarea id="recon-log-output" readonly style="flex:1;background:#000;color:#15FFFF;border:1px solid #005555;font-size:11px;padding:6px;resize:none;font-family:inherit;"></textarea>
                <textarea id="recon-report-output" readonly style="flex:1;background:#000;color:#15FFFF;border:1px solid #005555;font-size:11px;padding:6px;resize:none;font-family:inherit;"></textarea>
            </div>
        `;
        document.body.appendChild(panel);

        // [Ψ-DRAG-LOGIC] Moveable Panel Implementation - Hardened string concatenation
        let isDragging = false, offsetX, offsetY;
        const header = panel.querySelector('.recon-header');

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            panel.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                panel.style.userSelect = '';
            }
        });

        document.getElementById('recon-session-btn').onclick = window.reconEngine.startNewSession;
        document.getElementById('recon-report-btn').onclick = window.reconEngine.generateReport;
    }

    const updateDebugUI = () => {
        const logOutput = document.getElementById('recon-log-output');
        if (logOutput) {
            logOutput.value = "Captured: " + _sessionData.length + " events\n" + _sessionData.map(d => "[" + d.type + "] " + d.url.substring(0, 60) + "...").join('\n');
            logOutput.scrollTop = logOutput.scrollHeight;
        }
    };

    overrideFetch();
    overrideXHR();
    overrideWS();
    if (document.body) injectUI();
    else document.addEventListener('DOMContentLoaded', injectUI);
    log('Recon Engine Initialized. Drag header to move.');
})();
