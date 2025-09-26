// ==UserScript==
// @name        4ndr0tools - Recon
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666 (Ψ-Anarch Revision)
// @version     2.0.0-AHE
// @description Red-team tool for automated recon. Passively captures all traffic and generates a heuristic analysis report on command. For educational and lab use only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ReconAnalysisEngine.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ReconAnalysisEngine.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*/*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
    "use strict";

    if (window._reconEngineInitialized) return;
    window._reconEngineInitialized = true;

    //────── CONFIGURATION & STATE ──────//
    const DEBUG_PREFIX = '[ReconEngine]';
    let _sessionData = []; // In-memory buffer for structured API captures for the current session.

    // Expose control functions globally for manual access if needed.
    window.reconEngine = {
        get sessionData() { return _sessionData; },
        startNewSession: () => {
            _sessionData = [];
            log('New session started. All captured data has been cleared.');
            updateDebugUI();
        },
        generateReport: () => generateAnalysisReport(),
    };

    //────── CORE HELPERS ──────//
    const log = (...args) => console.log(DEBUG_PREFIX, ...args);
    const error = (...args) => console.error(DEBUG_PREFIX, ...args);
    const safeDeepClone = (obj) => { try { return JSON.parse(JSON.stringify(obj)); } catch (e) { error("Clone failed:", e); return null; } };

    const parseBody = (body) => {
        if (!body) return null;
        if (body instanceof FormData) {
            const obj = {};
            for (const [key, value] of body.entries()) {
                obj[key] = (value instanceof File) ? { fileName: value.name, fileSize: value.size, fileType: value.type } : value;
            }
            return obj;
        }
        if (typeof body === "string") { try { return JSON.parse(body); } catch (e) { return body; } }
        if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
        return null;
    };

    const logApiResponse = (url, data, type, method) => {
        const clonedData = safeDeepClone(data);
        if (clonedData !== null) {
            _sessionData.push({ timestamp: new Date().toISOString(), url, type, method, data: clonedData });
            updateDebugUI();
        }
    };

    //────── NETWORK INTERCEPTION (PASSIVE) ──────//
    function overrideFetch() {
        const origFetch = window.fetch;
        window.fetch = async function(...args) {
            const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
            const method = (args[1]?.method || "GET").toUpperCase();
            if (args[1]?.body) {
                logApiResponse(url, parseBody(args[1].body), 'request', method);
            }
            const response = await origFetch.apply(this, args);
            const clone = response.clone();
            try {
                const jsonResponse = await clone.json();
                logApiResponse(url, jsonResponse, 'response', method);
            } catch (e) {
                // Not JSON, ignore for now. Could be extended to capture text/html.
            }
            return response;
        };
        log('Passive Fetch override active.');
    }

    //────── AUTOMATED HEURISTIC ANALYSIS ENGINE (AHE) ──────//
    function generateAnalysisReport() {
        log('Generating Analysis Report...');
        const reportArea = document.getElementById('recon-report-output');
        if (!reportArea) {
            error("Report UI not found.");
            return;
        }

        if (_sessionData.length === 0) {
            reportArea.value = "No data captured in this session. Perform some actions on the page and try again.";
            return;
        }

        // 1. Endpoint Profiling
        const endpointStats = _sessionData.reduce((acc, entry) => {
            const path = new URL(entry.url).pathname;
            if (!acc[path]) {
                acc[path] = { count: 0, methods: new Set(), types: new Set() };
            }
            acc[path].count++;
            acc[path].methods.add(entry.method);
            acc[path].types.add(entry.type);
            return acc;
        }, {});
        
        let report = `## Reconnaissance Report (${new Date().toISOString()})\n\n`;
        report += `### 1. Endpoint Profile (${Object.keys(endpointStats).length} unique paths)\n`;
        report += "| Count | Methods | Path |\n";
        report += "|---|---|---|\n";
        Object.entries(endpointStats).sort((a, b) => b[1].count - a[1].count).forEach(([path, stats]) => {
            report += `| ${stats.count} | ${Array.from(stats.methods).join(', ')} | \`${path}\` |\n`;
        });

        // 2. Heuristic Key Discovery
        const interestingKeys = new Set();
        const keyKeywords = ['token', 'jwt', 'session', 'auth', 'key', 'secret', 'user', 'account', 'profile', 'credit', 'balance', 'promo', 'subscription', 'status', 'progress', 'task', 'job_id'];
        const traverse = (obj) => {
            if (typeof obj !== 'object' || obj === null) return;
            for (const key in obj) {
                if (keyKeywords.some(kw => key.toLowerCase().includes(kw))) {
                    interestingKeys.add(key);
                }
                traverse(obj[key]);
            }
        };
        _sessionData.forEach(entry => traverse(entry.data));
        report += `\n### 2. Discovered Keys of Interest\n`;
        if (interestingKeys.size > 0) {
            report += Array.from(interestingKeys).map(k => `* \`${k}\``).join('\n');
        } else {
            report += "None found based on current heuristics.";
        }

        // 3. Engagement Flow Mapping
        report += `\n\n### 3. Observed Engagement Flow (Chronological)\n`;
        const actionKeywords = ['create', 'generate', 'upload', 'start', 'process', 'submit', 'post'];
        let flowCount = 0;
        _sessionData.forEach((entry, index) => {
            const path = new URL(entry.url).pathname;
            if (entry.type === 'request' && actionKeywords.some(kw => path.toLowerCase().includes(kw))) {
                flowCount++;
                report += `\n**Flow #${flowCount}: Action triggered by ${entry.method} to \`${path}\`**\n`;
                // Look ahead 5-10 steps for related status/polling calls
                for (let i = index + 1; i < Math.min(index + 10, _sessionData.length); i++) {
                    const nextEntry = _sessionData[i];
                    const nextPath = new URL(nextEntry.url).pathname;
                    report += `  - Step ${i - index}: ${nextEntry.method} to \`${nextPath}\` (${nextEntry.type})\n`;
                }
            }
        });
        if (flowCount === 0) {
            report += "No clear 'action' entry points found to map a flow.";
        }
        
        reportArea.value = report;
        log('Analysis Report Generated.');
    }

    //────── UI FRAMEWORK ──────//
    function injectUI() {
        const styleId = "recon-engine-css";
        if (document.getElementById(styleId)) return;
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
            #recon-engine-panel { position: fixed; bottom: 10px; right: 10px; width: 500px; height: 400px; background: #1a1a1a; color: #e0e0e0; border: 1px solid #15ffff; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 12px; z-index: 999999; box-shadow: 0 5px 15px rgba(0,0,0,0.5); display: flex; flex-direction: column; resize: both; overflow: auto; }
            .recon-header { padding: 8px; background: #2a2a2a; display: flex; justify-content: space-between; align-items: center; cursor: grab; border-bottom: 1px solid #444; }
            .recon-header span { color: #15ffff; font-weight: bold; }
            .recon-controls button { background: #008080; color: #15ffff; border: 1px solid #15ffff; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-left: 5px; }
            .recon-body { display: flex; flex-grow: 1; overflow: hidden; }
            .recon-tabs { display: flex; border-bottom: 1px solid #444; }
            .recon-tab { padding: 8px 12px; cursor: pointer; background: #2a2a2a; border-right: 1px solid #444; }
            .recon-tab.active { background: #1a1a1a; color: #15ffff; border-bottom: 1px solid #1a1a1a; }
            .recon-content { display: none; padding: 10px; flex-grow: 1; overflow-y: auto; background: #111; }
            .recon-content.active { display: block; }
            #recon-log-output, #recon-report-output { width: 100%; height: 100%; background: #0d0d0d; color: #e0e0e0; border: none; font-family: 'Consolas', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; }
        `;
        document.head.appendChild(style);

        const panel = document.createElement("div");
        panel.id = "recon-engine-panel";
        panel.innerHTML = `
            <div class="recon-header">
                <span>Recon & Analysis Engine v2.0</span>
                <div class="recon-controls">
                    <button id="recon-session-btn">Start New Session</button>
                    <button id="recon-report-btn">Generate Report</button>
                </div>
            </div>
            <div class="recon-tabs">
                <div class="recon-tab active" data-tab="log">Raw Log (<span id="recon-log-count">0</span>)</div>
                <div class="recon-tab" data-tab="report">Analysis Report</div>
            </div>
            <div class="recon-body">
                <div class="recon-content active" id="recon-content-log"><textarea id="recon-log-output" readonly></textarea></div>
                <div class="recon-content" id="recon-content-report"><textarea id="recon-report-output" readonly>Click "Generate Report" to analyze captured data.</textarea></div>
            </div>
        `;
        document.body.appendChild(panel);

        // --- Event Listeners ---
        document.getElementById('recon-session-btn').addEventListener('click', window.reconEngine.startNewSession);
        document.getElementById('recon-report-btn').addEventListener('click', window.reconEngine.generateReport);
        
        const tabs = panel.querySelectorAll('.recon-tab');
        const contents = panel.querySelectorAll('.recon-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`recon-content-${tab.dataset.tab}`).classList.add('active');
            });
        });
        
        let isDragging = false, offsetX, offsetY;
        const header = panel.querySelector('.recon-header');
        header.addEventListener('mousedown', (e) => {
          isDragging = true;
          offsetX = e.clientX - panel.getBoundingClientRect().left;
          offsetY = e.clientY - panel.getBoundingClientRect().top;
        });
        document.addEventListener('mousemove', (e) => {
          if (isDragging) {
            panel.style.left = `${e.clientX - offsetX}px`;
            panel.style.top = `${e.clientY - offsetY}px`;
          }
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    const throttle = (fn, delay) => { let last=0; return (...args) => { const now=Date.now(); if(now-last<delay) return; last=now; fn(...args) }; };
    const updateDebugUI = throttle(() => {
        const logOutput = document.getElementById('recon-log-output');
        const logCount = document.getElementById('recon-log-count');
        if (!logOutput || !logCount) return;
        logOutput.value = JSON.stringify(_sessionData, null, 2);
        logCount.textContent = _sessionData.length;
    }, 500);

    //────── INITIALIZATION ──────//
    function initialize() {
        log('Engine initializing...');
        overrideFetch();
        if (document.body) {
            injectUI();
        } else {
            document.addEventListener('DOMContentLoaded', injectUI, { once: true });
        }
        log('Engine Initialized.');
    }
    initialize();

})();
