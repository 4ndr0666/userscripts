// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666 (Red Team Revision)
// @version     9.0.0-RT
// @description For educational and official red-team lab purposes only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @license     MIT
// ==/UserScript==

(() => {
    "use strict";

    //────── POLYMORPHIC INITIALIZATION & SINGLETON LOCK ──────//
    // Operator Note: This ensures the script only runs once, even if injected multiple times.
    // The key is randomized for each session to avoid static footprinting.
    const generateShortUUID = () => 'xxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
    const scriptId = `_hk_${generateShortUUID()}`;
    if (window[scriptId]) return;
    window[scriptId] = true;

    //────── DEFENSE NEUTRALIZATION (CSP INOCULATOR) ──────//
    // Operator Note: This runs at document-start to find and remove the CSP meta tag before the browser enforces it.
    // This is a critical pre-flight operation for enabling subsequent actions.
    function neutralizeMetaCSP() {
        const observer = new MutationObserver((mutations, obs) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    // RT-ENHANCEMENT: Check for node properties safely to avoid errors on non-element nodes.
                    if (node.tagName === 'META' && node.httpEquiv?.toLowerCase() === 'content-security-policy') {
                        node.remove();
                        // Mission complete, disconnect to minimize performance overhead and detection surface.
                        obs.disconnect();
                        return;
                    }
                }
            }
        });
        // Observe the entire document tree as early as possible.
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    neutralizeMetaCSP();


    //────── CORE CONFIGURATION & STATE ──────//
    // RT-ENHANCEMENT: Using indirect access to global objects to reduce static analysis signatures.
    const _window = window;
    const _console = _window.console;
    const _JSON = _window.JSON;
    const _XMLHttpRequest = _window.XMLHttpRequest;
    const _document = _window.document;
    const _navigator = _window.navigator;

    const DEBUG_PREFIX = '[HailuoKit]';
    let isInitialized = false;
    let myCustomXhrOpen = null;
    let myCustomFetch = null;
    let debugUIInjected = false;
    let savedSafeMediaPath = null;

    // RT-ENHANCEMENT: Configuration is now a single object, making it easier to manage and parameterize.
    const config = {
        debugMode: false,
        promoExploitEnabled: true,
        forceQualityEnabled: true,
        forceMaxImagesEnabled: true,
        mediaBypassEnabled: true,
        statusBypassEnabled: true,
        nsfwObfuscation: 'homoglyph',
        antiDebugging: true, // RT-ENHANCEMENT: Added anti-debugging feature.
    };

    const API_ENDPOINTS = {
        videoGeneration: /(?:[a-zA-Z0-9-]+\/)*generate\/video/,
        imageGeneration: /(?:[a-zA-Z0-9-]+\/)*generate\/image/,
        mediaUpload: /(?:[a-zA-Z0-9-]+\/)*upload\//,
        taskStatus: /(?:[a-zA-Z0-9-]+\/)*batch\/get\/task/,
        videoDetail: /(?:[a-zA-Z0-9-]+\/)*get\/video\/detail/,
        fileList: /(?:[a-zA-Z0-9-]+\/)*get\/file\/list/,
    };

    // RT-ENHANCEMENT: Trigger words are dynamically decoded from Base64 to evade static scanners and keyword-based detection.
    let TRIGGER_WORDS_B64 = "YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAsc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhyb2F0aW5nLHRpdHMsdGl0LHRpdHR5LHRpdGZ1Y2ssdGl0dGllcyx0aXR0eWRyb3AsdGl0dHlmdWNrLHRpdGZ1Y2ssdmFnaW5hLHdpZW5lcix3aG9yZSxjcmVhbXBpZSxjdW1zaG90LGN1bm5pbGluZ3VzLGRvZ2d5c3R5bGUsZWphY3VsYXRlLGVqYWN1bGF0aW9uLGhhbmRqb2IsamVyayBvZmYsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZX Isc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZQ==";
    let _decodedTriggerWords = null;

    function getTriggerWords() {
        if (!_decodedTriggerWords) {
            _decodedTriggerWords = _window.atob(TRIGGER_WORDS_B64).split(',');
            // RT-ENHANCEMENT (Anti-Forensics): Clear the encoded string from memory after decoding.
            TRIGGER_WORDS_B64 = null;
        }
        return _decodedTriggerWords;
    }

    const HOMOGLYPH_MAP = { 'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у' };

    //────── RECON MODULE ──────//
    const _structuredData = [];
    _window.hailuoKit = {
        get reconData() { return _structuredData; },
        clearRecon: () => { _structuredData.length = 0; if (config.debugMode) updateDebugUI(); log('Recon data cleared.'); showToast('Recon Cleared'); },
        analyzeEngagement: () => analyzeEngagement(),
    };
    function logStructuredData(url, data, type) { if (!config.debugMode) return; _structuredData.push({ timestamp: new Date().toISOString(), url, type, data: safeDeepClone(data) }); updateDebugUI(); }

    //────── CORE HELPERS ──────//
    function log(...args) { if (config.debugMode) _console.log(DEBUG_PREFIX, ...args); }
    function error(...args) { if (config.debugMode) _console.error(DEBUG_PREFIX, ...args); }
    function safeDeepClone(obj) { try { return _JSON.parse(_JSON.stringify(obj)); } catch (e) { error("Clone failed:", e); return null; } }
    function matchesEndpoint(url, key) { return API_ENDPOINTS[key]?.test(url); }
    function generateUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }
    function parseBody(body) {
        if (!body) return null;
        if (body instanceof FormData) {
            const obj = {};
            for (const [key, value] of body.entries()) { obj[key] = (value instanceof File) ? { fileName: value.name, fileSize: value.size, fileType: value.type } : value; }
            return obj;
        }
        if (typeof body === "string") { try { return _JSON.parse(body); } catch (e) { return body; } }
        if (body instanceof URLSearchParams) return Object.fromEntries(body.entries());
        return null;
    }
    function obfuscatePrompt(prompt) {
        if (config.nsfwObfuscation === 'none' || !prompt) return prompt;
        // RT-ENHANCEMENT: Regex is built at runtime from decoded words, further evading static analysis.
        const NSFW_PROMPT_REGEX = new RegExp(`\\b(?:${getTriggerWords().join('|')})\\b`, "gi");

        switch (config.nsfwObfuscation) {
            case 'zwsp': return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
            case 'homoglyph': return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').map(char => HOMOGLYPH_MAP[char.toLowerCase()] || char).join(''));
            default: return prompt;
        }
    }

    //────── API MODIFICATION LOGIC (THE EXPLOIT) ──────//
    function processRequestBodyModifications(url, originalBodyParsed) {
        let modifiedBody = safeDeepClone(originalBodyParsed);
        if (!modifiedBody) return { modifiedBody: originalBodyParsed, bodyWasModified: false };
        let bodyWasModified = false;

        if (matchesEndpoint(url, "videoGeneration")) {
            const isAlreadyPromo = Array.isArray(modifiedBody.fileList) && modifiedBody.fileList.some(f => f.frameType === 0) && modifiedBody.fileList.some(f => f.frameType === 1);
            let promoExploitApplied = false;

            if (config.promoExploitEnabled && !isAlreadyPromo) {
                log(`EXPLOIT: Injecting dummy start/end frames with forged UUIDs to trigger promo.`);
                modifiedBody.fileList = [{ id: generateUUID(), frameType: 0 }, { id: generateUUID(), frameType: 1 }, ...(modifiedBody.fileList || [])];
                bodyWasModified = true;
                promoExploitApplied = true;
            }

            const isFinalPromoCall = isAlreadyPromo || promoExploitApplied;
            if (config.forceQualityEnabled && !isFinalPromoCall && modifiedBody.resolutionType !== 2) {
                log(`EXPLOIT: Forcing 'resolutionType' to 2 (1080P) on standard generation.`);
                modifiedBody.resolutionType = 2;
                bodyWasModified = true;
            }
        } else if (matchesEndpoint(url, "imageGeneration")) {
            if (config.forceMaxImagesEnabled && modifiedBody.imageNum !== 9) {
                log(`EXPLOIT: Forcing 'imageNum' to 9.`);
                modifiedBody.imageNum = 9;
                bodyWasModified = true;
            }
        }

        if (modifiedBody.desc) {
            const obfuscated = obfuscatePrompt(modifiedBody.desc);
            if (obfuscated !== modifiedBody.desc) {
                log(`EXPLOIT: Applying NSFW obfuscation (${config.nsfwObfuscation}) to 'desc' field.`);
                modifiedBody.desc = obfuscated;
                bodyWasModified = true;
            }
        }

        return { modifiedBody, bodyWasModified };
    }

    function processResponseModifications(url, originalResponse) {
        if (matchesEndpoint(url, "mediaUpload")) {
            const isSuccess = originalResponse?.base_resp?.status_code === 0;
            const isModerated = originalResponse?.base_resp?.status_code === 1026;

            if (isSuccess) {
                const mediaPath = originalResponse?.data?.path || originalResponse?.data?.id;
                if (mediaPath) {
                    savedSafeMediaPath = mediaPath;
                    log(`BAIT: Captured safe media path: ${savedSafeMediaPath}`);
                    showToast(`Safe Media Path Saved`);
                }
            } else if (config.mediaBypassEnabled && isModerated && savedSafeMediaPath) {
                log(`SWITCH: Media moderation detected (Code 1026). Forging success response with path: ${savedSafeMediaPath}`);
                showToast(`Bypass Triggered!`);
                const forgedResponse = { base_resp: { status_code: 0, status_msg: "success" }, data: { id: savedSafeMediaPath, path: savedSafeMediaPath, url: `https://media.example.com/${savedSafeMediaPath}` } };
                logStructuredData(url, forgedResponse, 'RESPONSE_FORGED');
                return forgedResponse;
            }
        } else if (config.statusBypassEnabled && (matchesEndpoint(url, "taskStatus") || matchesEndpoint(url, "fileList"))) {
            const listKey = matchesEndpoint(url, "taskStatus") ? 'taskList' : 'fileList';
            if (originalResponse?.data?.[listKey] && Array.isArray(originalResponse.data[listKey])) {
                let wasModified = false;
                const newList = originalResponse.data[listKey].map(item => {
                    if (item.sensitiveInfo && item.sensitiveInfo.level !== 0) {
                        wasModified = true;
                        return { ...item, sensitiveInfo: { level: 0, prompt: "", type: 0 } };
                    }
                    return item;
                });

                if (wasModified) {
                    log(`STATE FORGERY: Sanitized sensitiveInfo in ${listKey.toUpperCase()} response.`);
                    const forgedResponse = { ...originalResponse, data: { ...originalResponse.data, [listKey]: newList } };
                    logStructuredData(url, forgedResponse, 'RESPONSE_FORGED');
                    return forgedResponse;
                }
            }
        } else if (config.statusBypassEnabled && matchesEndpoint(url, "videoDetail")) {
            if (originalResponse?.data?.videoInfo?.sensitiveInfo?.level !== 0) {
                log('STATE FORGERY: Sanitized sensitiveInfo in VIDEO DETAIL response.');
                const forgedResponse = safeDeepClone(originalResponse);
                forgedResponse.data.videoInfo.sensitiveInfo = { level: 0, prompt: "", type: 0 };
                logStructuredData(url, forgedResponse, 'RESPONSE_FORGED');
                return forgedResponse;
            }
        }
        return null; // No modification applied
    }

    //────── NETWORK INTERCEPTION ──────//
    // Operator Note: Using indirect property access (e.g., window['fetch']) to make static analysis by security tools more difficult.
    const originalFetch = _window['fetch'];
    const originalXhrSend = _XMLHttpRequest['prototype']['send'];
    const originalXhrOpen = _XMLHttpRequest['prototype']['open'];

    function overrideFetch() {
        _window['fetch'] = async function (...args) {
            let url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            let init = args[1] || {};
            const isFormData = init.body instanceof FormData;

            if (init.body && (init.method === 'POST' || init.method === 'PUT')) {
                const originalBodyParsed = parseBody(init.body);
                if (originalBodyParsed) {
                    logStructuredData(url, originalBodyParsed, 'REQUEST');
                    const { modifiedBody, bodyWasModified } = processRequestBodyModifications(url, originalBodyParsed);
                    if (bodyWasModified) {
                        init = { ...init, body: isFormData ? objectToFormData(modifiedBody) : _JSON.stringify(modifiedBody) };
                        logStructuredData(url, modifiedBody, 'REQUEST_MODIFIED');
                    }
                }
            }
            const response = await originalFetch.apply(this, [args[0], init]);
            const responseClone = response.clone();
            try {
                const originalResponseData = await responseClone.json();
                logStructuredData(url, originalResponseData, 'RESPONSE_ORIGINAL');
                const forgedResponseData = processResponseModifications(url, originalResponseData);
                if (forgedResponseData) {
                    return new Response(_JSON.stringify(forgedResponseData), { status: response.status, statusText: response.statusText, headers: response.headers });
                }
            } catch (e) { /* Not JSON, ignore */ }
            return response;
        };
        myCustomFetch = _window['fetch'];
        log('Fetch override active.');
    }

    function overrideXHR() {
        _XMLHttpRequest['prototype']['open'] = function (m, u) { this._url = u; this._method = m; return originalXhrOpen.apply(this, arguments); };
        _XMLHttpRequest['prototype']['send'] = function (body) {
            const url = this._url || "";
            let processedBody = body;
            const isFormData = body instanceof FormData;
            if (body && (this._method === 'POST' || this._method === 'PUT')) {
                const originalBodyParsed = parseBody(body);
                if (originalBodyParsed) {
                    logStructuredData(url, originalBodyParsed, 'REQUEST');
                    const { modifiedBody, bodyWasModified } = processRequestBodyModifications(url, originalBodyParsed);
                    if (bodyWasModified) {
                        processedBody = isFormData ? objectToFormData(modifiedBody) : _JSON.stringify(modifiedBody);
                        logStructuredData(url, modifiedBody, 'REQUEST_MODIFIED');
                    }
                }
            }
            this.addEventListener('load', function () {
                try {
                    const responseData = _JSON.parse(this.responseText);
                    logStructuredData(url, responseData, 'RESPONSE_ORIGINAL');
                    const forgedResponseData = processResponseModifications(url, responseData);
                    if (forgedResponseData) {
                        Object.defineProperty(this, 'responseText', { value: _JSON.stringify(forgedResponseData), writable: false, configurable: true });
                        Object.defineProperty(this, 'response', { value: forgedResponseData, writable: false, configurable: true });
                    }
                } catch (e) { /* Not JSON, ignore */ }
            }, { once: true });
            return originalXhrSend.apply(this, [processedBody]);
        };
        myCustomXhrOpen = _XMLHttpRequest['prototype']['open'];
        log('XHR override active.');
    }

    function objectToFormData(obj) {
        const formData = new FormData();
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                formData.append(key, _JSON.stringify(value));
            } else if (Array.isArray(value)) {
                formData.append(key, _JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }
        return formData;
    }

    //────── ANTI-FORENSICS & EVASION ──────//
    function setupAntiDebugging() {
        if (!config.antiDebugging) return;
        const checkInterval = 2500;
        const threshold = 100;
        setInterval(() => {
            if (!config.antiDebugging) return;
            const startTime = new Date();
            // This statement will pause execution if devtools is open
            debugger;
            const endTime = new Date();
            if (endTime.getTime() - startTime.getTime() > threshold) {
                log('Anti-Debug: DevTools detected. Clearing recon data.');
                _window.hailuoKit.clearRecon();
                showToast('Debugger Detected!', 2000);
            }
        }, checkInterval);
        log('Anti-debugging module active.');
    }

    //────── SELF-HEALING & UI FRAMEWORK ──────//
    function setupSelfHealingHooks() { setInterval(() => { if (myCustomXhrOpen && _XMLHttpRequest['prototype']['open'] !== myCustomXhrOpen) { log('XHR hook overwritten, re-applying...'); overrideXHR(); } if (myCustomFetch && _window['fetch'] !== myCustomFetch) { log('Fetch hook overwritten, re-applying...'); overrideFetch(); } }, 5000); log('Self-healing hooks active.'); }
    function showToast(msg, duration = 3500) { if (!_document.body) return; _document.querySelectorAll(".hk-toast").forEach(e => e.remove()); const el = _document.createElement("div"); el.className = "hk-toast"; el.textContent = msg; _document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("hk-toast-visible")); setTimeout(() => { el.classList.remove("hk-toast-visible"); el.addEventListener("transitionend", () => el.remove(), { once: true }); }, duration); }

    async function loadConfig() {
        config.debugMode = await GM_getValue('debugMode', false);
        config.promoExploitEnabled = await GM_getValue('promoExploitEnabled', true);
        config.forceQualityEnabled = await GM_getValue('forceQualityEnabled', true);
        config.forceMaxImagesEnabled = await GM_getValue('forceMaxImagesEnabled', true);
        config.mediaBypassEnabled = await GM_getValue('mediaBypassEnabled', true);
        config.statusBypassEnabled = await GM_getValue('statusBypassEnabled', true);
        config.nsfwObfuscation = await GM_getValue('nsfwObfuscation', 'homoglyph');
        config.antiDebugging = await GM_getValue('antiDebugging', true);
    }

    async function createControlPanel() {
        const panelId = 'hk-control-panel'; if (_document.getElementById(panelId)) return;
        const panel = _document.createElement('div'); panel.id = panelId; panel.classList.add('hk-hidden');
        panel.innerHTML = `
      <div class="hk-panel-header"><span>HailuoKit v${GM_info.script.version}</span><button id="hk-panel-toggle" title="Toggle Panel Content">-</button></div>
      <div class="hk-panel-content">
        <div class="hk-panel-row"><label for="hk-media-bypass" title="Enables Bait-and-Switch to bypass media content moderation. Upload a safe file first!">Media Bypass</label><input type="checkbox" id="hk-media-bypass"></div>
        <div class="hk-panel-row"><label for="hk-status-bypass" title="Continuously forges 'safe' status for generated content across all status checks.">Status Bypass</label><input type="checkbox" id="hk-status-bypass"></div>
        <div class="hk-panel-row"><label for="hk-promo-exploit" title="Injects dummy start/end frames into video requests to trigger the unlimited promo.">Promo Exploit (Video)</label><input type="checkbox" id="hk-promo-exploit"></div>
        <hr class="hk-separator">
        <div class="hk-panel-row"><label for="hk-force-quality" title="Forces 1080p on standard video generation requests.">Force Video Quality</label><input type="checkbox" id="hk-force-quality"></div>
        <div class="hk-panel-row"><label for="hk-force-max-images" title="Forces the number of generated images to the maximum (9).">Force Max Images</label><input type="checkbox" id="hk-force-max-images"></div>
        <div class="hk-panel-row"><label for="hk-nsfw-obfuscation" title="Obfuscates prompts for both video and image generation.">NSFW Obfuscation</label><select id="hk-nsfw-obfuscation"><option value="none">None</option><option value="zwsp">ZWSP</option><option value="homoglyph">Homoglyph</option></select></div>
        <hr class="hk-separator">
        <div class="hk-panel-row"><label for="hk-anti-debugging" title="Detects developer tools and clears recon data to hinder analysis.">Anti-Debugging</label><input type="checkbox" id="hk-anti-debugging"></div>
        <div class="hk-panel-row"><label for="hk-debug-mode" title="Show debug messages and Recon UI.">Debug Mode</label><input type="checkbox" id="hk-debug-mode"></div>
      </div>`;
        if (!_document.body) { error('Document body not ready for UI injection.'); return; } _document.body.appendChild(panel);
        const i = (id) => _document.getElementById(id);
        const inputs = { m:i('hk-media-bypass'),s:i('hk-status-bypass'),p:i('hk-promo-exploit'),q:i('hk-force-quality'),i:i('hk-force-max-images'),n:i('hk-nsfw-obfuscation'),a:i('hk-anti-debugging'),d:i('hk-debug-mode') };
        inputs.m.checked=config.mediaBypassEnabled; inputs.s.checked=config.statusBypassEnabled; inputs.p.checked=config.promoExploitEnabled; inputs.q.checked=config.forceQualityEnabled; inputs.i.checked=config.forceMaxImagesEnabled; inputs.n.value=config.nsfwObfuscation; inputs.a.checked=config.antiDebugging; inputs.d.checked=config.debugMode;
        const addToggleListener = (el, confKey, name) => el.addEventListener('change', async(e)=>{ const val=el.type==='checkbox'?e.target.checked:e.target.value; config[confKey]=val; await GM_setValue(confKey,val); showToast(`${name} ${typeof val==='boolean'?(val?'Enabled':'Disabled'):`: ${val.toUpperCase()}`}`); });
        addToggleListener(inputs.m, 'mediaBypassEnabled', 'Media Bypass'); addToggleListener(inputs.s, 'statusBypassEnabled', 'Status Bypass'); addToggleListener(inputs.p, 'promoExploitEnabled', 'Promo Exploit'); addToggleListener(inputs.q, 'forceQualityEnabled', 'Forced Quality'); addToggleListener(inputs.i, 'forceMaxImagesEnabled', 'Forced Max Images'); addToggleListener(inputs.n, 'nsfwObfuscation', 'NSFW Obfuscation'); addToggleListener(inputs.a, 'antiDebugging', 'Anti-Debugging');
        inputs.d.addEventListener('change', async (e) => { config.debugMode = e.target.checked; await GM_setValue('debugMode', config.debugMode); showToast(`Debug Mode ${e.target.checked ? 'Enabled' : 'Disabled'}`); updateDebugUIVisibility(); });
        const content = panel.querySelector('.hk-panel-content'); const toggleBtn = i('hk-panel-toggle'); toggleBtn.addEventListener('click', () => { const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; toggleBtn.textContent = isHidden ? '-' : '+'; });
        const header = panel.querySelector('.hk-panel-header'); let isDragging = false, offsetX, offsetY; panel.style.left = await GM_getValue('panelPosX', 'auto'); panel.style.top = await GM_getValue('panelPosY', '10px'); panel.style.right = panel.style.left === 'auto' ? '10px' : 'auto'; header.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - panel.getBoundingClientRect().left; offsetY = e.clientY - panel.getBoundingClientRect().top; panel.style.cursor = 'grabbing'; panel.style.right = 'auto'; e.preventDefault(); }); _document.addEventListener('mousemove', (e) => { if (isDragging) { panel.style.left = `${e.clientX - offsetX}px`; panel.style.top = `${e.clientY - offsetY}px`; } }); _document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; panel.style.cursor = 'grab'; GM_setValue('panelPosX', panel.style.left); GM_setValue('panelPosY', panel.style.top); } });
    }

    function setupStealthUI() { _document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') { e.preventDefault(); const p = _document.getElementById('hk-control-panel'); if (p) { p.classList.toggle('hk-hidden'); showToast('HailuoKit Panel Toggled'); } } }); }
    function injectCoreStyles() { if (_document.getElementById("hk-core-styles")) return; const style = _document.createElement("style"); style.id = "hk-core-styles"; style.textContent = `.hk-hidden { display: none !important; } .hk-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:rgba(20,40,48,.94);color:#15ffff;padding:8px 20px;border-radius:6px;font:15px/1.2 sans-serif;z-index:300001;opacity:0;transition:opacity .25s ease-in-out;pointer-events:none}.hk-toast-visible{opacity:1}#hk-control-panel{position:fixed;top:10px;right:10px;z-index:300000;background:#1a1a1a;color:#e0e0e0;border:1px solid #444;border-radius:6px;font-family:sans-serif;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.5);user-select:none;min-width:320px;cursor:grab}.hk-panel-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#2a2a2a;border-bottom:1px solid #444}.hk-panel-header span{font-weight:700;color:#15ffff}#hk-panel-toggle{background:#444;color:#e0e0e0;border:none;border-radius:4px;width:20px;height:20px;line-height:20px;text-align:center;cursor:pointer;font-weight:700}.hk-panel-content{padding:10px}.hk-panel-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.hk-panel-row:last-child{margin-bottom:0}.hk-panel-row label{margin-right:15px;cursor:help}.hk-panel-row input[type=checkbox]{width:16px;height:16px;margin-left:auto}.hk-panel-row select{background:#111;color:#e0e0e0;border:1px solid #555;border-radius:4px;padding:4px 6px;width:180px;font-size:12px}.hk-separator{border:0;border-top:1px solid #333;margin:10px 0}#hk-debug-panel{position:fixed;bottom:10px;right:10px;width:420px;max-height:50vh;background:rgba(30,30,30,.95);color:#15ffff;border:1px solid #15ffff;border-radius:8px;font-family:'Consolas','Monaco',monospace;font-size:11px;z-index:299998;box-shadow:0 4px 8px rgba(0,0,0,.5);overflow:hidden;display:flex;flex-direction:column;resize:both}.hk-debug-panel.collapsed{height:auto;max-height:35px;resize:none}.hk-debug-header{background:rgba(0,0,0,.8);padding:5px 10px;display:flex;justify-content:space-between;align-items:center;cursor:grab}.hk-debug-header span{font-weight:bold;color:#15ffff}.hk-debug-body{flex-grow:1;display:flex;flex-direction:column;overflow:hidden}.hk-debug-panel.collapsed .hk-debug-body{display:none}.hk-debug-controls{padding:5px 10px;display:flex;flex-wrap:wrap;gap:5px;border-bottom:1px dashed #004040}.hk-debug-controls button{background:#008080;color:#15ffff;border:1px solid #15ffff;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px}.hk-debug-section{flex:1;min-height:80px;padding:5px 10px;overflow-y:auto;border-bottom:1px dashed #004040;display:flex;flex-direction:column}.hk-debug-section:last-of-type{border-bottom:none}.hk-debug-section h4{margin:5px 0;color:#15ffff;font-size:12px;flex-shrink:0}.hk-debug-output{flex-grow:1;background:rgba(0,0,0,.6);border:1px solid #002020;padding:5px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;height:100%}.log-entry{border-bottom:1px solid #004040;padding-bottom:5px;margin-bottom:5px}.log-type{font-weight:bold;margin-bottom:3px}.response_original{color:#888}.response_modified,.response_forged,.request_modified{color:#00ff00}`; if(_document.head) _document.head.appendChild(style); }
    const throttle = (fn, delay) => { let last=0, id; return (...args) => { const now=Date.now(); if(now-last<delay){clearTimeout(id); id=setTimeout(() => {last=now; fn(...args)}, delay-(now-last))} else {last=now; fn(...args)} }; };

    function injectDebugUI() {
        if (debugUIInjected || !_document.body) return;
        const p = _document.createElement("div"); p.id = "hk-debug-panel"; p.className="hk-debug-panel";
        p.innerHTML = `<div class="hk-debug-header"><span>HailuoKit Recon</span><button id="hk-toggle-debug-btn">Collapse</button></div><div class="hk-debug-body"><div class="hk-debug-controls"><button id="hk-clear-recon">Clear Recon</button><button id="hk-copy-recon">Copy Recon</button><button id="hk-analyze">Analyze Engagement</button></div><div id="hk-analysis-area" class="hk-debug-section" style="display:none;"><h4>Engagement Analysis</h4><pre id="hk-analysis-output" class="hk-debug-output"></pre></div><div class="hk-debug-section"><h4>Captured Data (<span id="hk-data-count">0</span>)</h4><div id="hk-data-output" class="hk-debug-output"></div></div></div>`;
        _document.body.appendChild(p);
        const i = (id) => _document.getElementById(id);
        i('hk-clear-recon').addEventListener('click', _window.hailuoKit.clearRecon);
        i('hk-copy-recon').addEventListener('click', () => { _navigator.clipboard.writeText(_JSON.stringify(_window.hailuoKit.reconData, null, 2)); showToast("Recon copied to clipboard!"); });
        i('hk-analyze').addEventListener('click', analyzeEngagement);
        i('hk-toggle-debug-btn').addEventListener('click', () => p.classList.toggle('collapsed'));
        let isDragging = false, offsetX, offsetY; const header = p.querySelector('.hk-debug-header'); header.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - p.getBoundingClientRect().left; offsetY = e.clientY - p.getBoundingClientRect().top; e.preventDefault(); }); _document.addEventListener('mousemove', (e) => { if (isDragging) { p.style.left = `${e.clientX - offsetX}px`; p.style.top = `${e.clientY - offsetY}px`; } }); _document.addEventListener('mouseup', () => { isDragging = false; });
        debugUIInjected = true; updateDebugUI();
    }

    const updateDebugUI = throttle(() => {
        if (!config.debugMode || !debugUIInjected) return;
        const dataOutput = _document.getElementById('hk-data-output'); if (!dataOutput) return;
        dataOutput.innerHTML = _structuredData.map(e => `<div class="log-entry"><div class="log-type ${e.type.toLowerCase()}">${e.type} @ ${e.url}</div><pre>${_JSON.stringify(e.data, null, 2)}</pre></div>`).join('');
        dataOutput.scrollTop = dataOutput.scrollHeight;
        _document.getElementById('hk-data-count').textContent = _structuredData.length;
    }, 250);
    function updateDebugUIVisibility() {
        const debugPanel = _document.getElementById('hk-debug-panel');
        if (debugPanel) { debugPanel.style.display = config.debugMode ? 'flex' : 'none'; }
        else if (config.debugMode && _document.body) { injectDebugUI(); }
    }
    function analyzeEngagement() {
        const report = `--- Engagement Analysis Report ---

Promo Exploit Triggered: ${_structuredData.some(e => e.type === 'REQUEST_MODIFIED' && e.url.includes('generate/video')) ? 'SUCCESS' : 'NOT TRIGGERED'}
Media Bypass Triggered: ${_structuredData.some(e => e.type === 'RESPONSE_FORGED' && e.url.includes('upload')) ? 'SUCCESS' : 'NOT TRIGGERED'}
Status Bypass Triggered: ${_structuredData.some(e => e.type === 'RESPONSE_FORGED' && (e.url.includes('get/task') || e.url.includes('get/video/detail') || e.url.includes('get/file/list'))) ? 'SUCCESS' : 'NOT TRIGGERED'}`;
        const outputEl = _document.getElementById('hk-analysis-output'); const areaEl = _document.getElementById('hk-analysis-area');
        if(outputEl && areaEl) { outputEl.textContent = report; areaEl.style.display = 'block'; }
    }

    //────── INITIALIZATION ──────//
    async function initialize() {
        if (isInitialized) return;
        try {
            await loadConfig();
            const onReady = async () => {
                injectCoreStyles();
                await createControlPanel();
                setupStealthUI();
                updateDebugUIVisibility();
            };
            if (_document.body) { await onReady(); } else { _document.addEventListener('DOMContentLoaded', onReady, { once: true }); }
            overrideFetch(); overrideXHR(); setupSelfHealingHooks(); setupAntiDebugging();
            isInitialized = true; log(`HailuoKit v${GM_info.script.version} initialized.`); showToast(`HailuoKit v${GM_info.script.version} loaded.`);
        } catch (e) { error('HailuoKit initialization failed:', e); }
    }

    if (_document.readyState === 'loading') { _document.addEventListener('DOMContentLoaded', initialize, { once: true }); }
    else { initialize(); }

})();
