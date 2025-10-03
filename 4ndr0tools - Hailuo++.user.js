// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     9.6.0-RT-RefundLoop
// @description For educational and official red-team lab purposes only. This version codifies the Re-Edit Refund Exploit and is designed for automated deployment.
// @downloadURL https://github.com/4ndr0666/userscripts/edit/main/4ndr0tools%20-%20Hailuo%2B%2B.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/edit/main/4ndr0tools%20-%20Hailuo%2B%2B.user.js
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
    const generateShortUUID = () => 'xxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
    const scriptId = `_hk_${generateShortUUID()}`;
    if (window[scriptId]) return;
    window[scriptId] = true;

    //────── DEFENSE NEUTRALIZATION (CSP INOCULATOR) ──────//
    function neutralizeMetaCSP() {
        const observer = new MutationObserver((mutations, obs) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'META' && node.httpEquiv?.toLowerCase() === 'content-security-policy') {
                        node.remove();
                        obs.disconnect();
                        return;
                    }
                }
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
    neutralizeMetaCSP();

    //────── CORE CONFIGURATION & STATE ──────//
    const _window = window;
    const _console = _window['console'];
    const _JSON = _window['JSON'];
    const _document = _window['document'];
    const _navigator = _window['navigator'];
    const CSS_PREFIX = generateShortUUID().substring(0, 4);

    const STRINGS = {
        DEBUG_PREFIX: () => _window.atob('W0hhaWx1b0tpdF0='),
        API_VIDEO_GEN: () => _window.atob('KD86W2EtekEtWjAtOS1dKy8pKmנעגFyYXRlL3ZpZGVv'),
        API_IMAGE_GEN: () => _window.atob('KD86W2EtekEtWjAtOS1dKy8pKmנעגFyYXRlL2ltYWdl'),
        API_TASK_STATUS: () => _window.atob('KD86W2EtekEtWjAtOS1dKy8pKmJhdGNoL2dldC90YXNr'),
        API_VIDEO_DETAIL: () => _window.atob('KD86W2EtekEtWjAtOS1dKy8pCmdldC92aWRlby9kZXRhaWw='),
        API_FILE_LIST: () => _window.atob('KD86W2EtekEtWjAtOS1dKy8pCmdldC9maWxlL2xpc3Q='),
        API_REPORTER: () => _window.atob('L21lZXJrYXQtcmVwb3J0ZXIvYXBpL3JlcG9ydA==')
    };

    let isInitialized = false;
    let myCustomFetch = null;
    let processRequestBodyModifications = null;
    const config = {
        debugMode: false,
        promoExploitEnabled: false,
        forceQualityEnabled: true,
        forceMaxImagesEnabled: false,
        statusBypassEnabled: true,
        nsfwObfuscation: 'layered',
        antiDebugging: true,
    };
    let TRIGGER_WORDS_B64 = "YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAsc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhyb2F0aW5nLHRpdHMsdGl0LHRpdHR5LHRpdGZ1Y2ssdGl0dGllcyx0aXR0eWRyb3AsdGl0dHlmdWNrLHRpdGZ1Y2ssdmFnaW5hLHdpZW5lcix3aG9yZSxjcmVhbXBpZSxjdW1zaG90LGN1bm5pbGluZ3VzLGRvZ2d5c3R5bGUsZWphY3VsYXRlLGVqYWN1bGF0aW9uLGhhbmRqb2IsamVyayBvZmYsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZXIsc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZSx0aG9uZw==";
    let _decodedTriggerWords = null;
    const HOMOGLYPH_MAP = { 'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у' };

    //────── CORE HELPERS ──────//
    function log(...args) { if (config.debugMode) _console.log(STRINGS.DEBUG_PREFIX(), ...args); }
    function error(...args) { if (config.debugMode) _console.error(STRINGS.DEBUG_PREFIX(), ...args); }
    function safeDeepClone(obj) { try { return _JSON.parse(_JSON.stringify(obj)); } catch (e) { error("Clone failed:", e); return null; } }
    function matchesEndpoint(url, key) { const regex = new RegExp(STRINGS[key](), 'i'); return regex.test(url); }
    function getTriggerWords() { if (!_decodedTriggerWords) { _decodedTriggerWords = _window['atob'](TRIGGER_WORDS_B64).split(','); TRIGGER_WORDS_B64 = null; } return _decodedTriggerWords; }

    function triggerAutomaticDownload(data, filename) {
        log(`AUTO-EXFIL: Initiating download for ${filename}`);
        showToast('Auto-Exfil Triggered!');
        const link = _document.createElement('a');
        link.style.display = 'none';
        link.href = (data instanceof Blob) ? URL.createObjectURL(data) : data;
        link.download = filename || `exfiltrated-media-${generateShortUUID()}`;
        _document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            _document.body.removeChild(link);
            if (link.href.startsWith('blob:')) { URL.revokeObjectURL(link.href); }
        }, 100);
    }

    function obfuscatePrompt(prompt) {
        if (config.nsfwObfuscation === 'none' || !prompt) return prompt;
        const getRegex = () => new RegExp(`\\b(?:${getTriggerWords().join('|')})\\b`, "gi");
        const applyHomoglyph = (text) => text.replace(getRegex(), m => m.split('').map(char => HOMOGLYPH_MAP[char.toLowerCase()] || char).join(''));
        const applyZWSP = (text, targetRegex) => text.replace(targetRegex, m => m.split('').join('\u200B'));
        switch (config.nsfwObfuscation) {
            case 'zwsp': return applyZWSP(prompt, getRegex());
            case 'homoglyph': return applyHomoglyph(prompt);
            case 'layered':
                let layeredPrompt = applyHomoglyph(prompt);
                const homoglyphedWords = getTriggerWords().map(word => word.split('').map(char => HOMOGLYPH_MAP[char.toLowerCase()] || char).join(''));
                const layeredRegex = new RegExp(`\\b(?:${homoglyphedWords.join('|')})\\b`, "gi");
                return applyZWSP(layeredPrompt, layeredRegex);
            default: return prompt;
        }
    }

    //────── API MODIFICATION & RESPONSE INTERCEPTION ──────//
    function buildPolymorphicFunction() {
        const functionBodyParts = [
            "let modifiedBody = JSON.parse(JSON.stringify(originalBodyParsed));", // Safe clone
            "let bodyWasModified = false;",
            "if (matchesEndpoint(url, 'API_VIDEO_GEN')) {",
            "  if (config.promoExploitEnabled) {", // Only applies if the Credit Bypass is checked
            "    log('EXPLOIT: Injecting dummy start/end frames for Promo Bypass.');",
            "    modifiedBody.fileList = [{ id: generateUUID(), frameType: 0 }, { id: generateUUID(), frameType: 1 }, ...(modifiedBody.fileList || [])];",
            "    bodyWasModified = true;",
            "  }",
            "  if (config.forceQualityEnabled && modifiedBody.resolutionType !== 2) {",
            "    log('EXPLOIT: Forcing \\'resolutionType\\' to 2 (1080P).');",
            "    modifiedBody.resolutionType = 2; bodyWasModified = true;",
            "  }",
            "} else if (matchesEndpoint(url, 'API_IMAGE_GEN')) {",
            "  if (config.forceMaxImagesEnabled && modifiedBody.imageNum !== 9) {",
            "    log('EXPLOIT: Forcing \\'imageNum\\' to 9.');",
            "    modifiedBody.imageNum = 9; bodyWasModified = true;",
            "  }",
            "}",
            "if (modifiedBody.desc) {",
            "  const obfuscated = obfuscatePrompt(modifiedBody.desc);",
            "  if (obfuscated !== modifiedBody.desc) {",
            "    log(`EXPLOIT: Applying NSFW obfuscation (${config.nsfwObfuscation}).`);",
            "    modifiedBody.desc = obfuscated; bodyWasModified = true;",
            "  }",
            "}",
            "return { modifiedBody, bodyWasModified };"
        ];
        return new Function('url', 'originalBodyParsed', 'config', 'log', 'matchesEndpoint', 'generateUUID', 'obfuscatePrompt', functionBodyParts.join('\n'));
    }

    function processResponseModifications(url, originalResponse) {
        if (config.statusBypassEnabled) {
            if (matchesEndpoint(url, "API_TASK_STATUS") || matchesEndpoint(url, "API_FILE_LIST")) {
                const listKey = matchesEndpoint(url, "API_TASK_STATUS") ? 'taskList' : 'fileList';
                if (originalResponse?.data?.[listKey] && Array.isArray(originalResponse.data[listKey])) {
                    let wasModified = false;
                    const newList = originalResponse.data[listKey].map(item => { if (item.sensitiveInfo && item.sensitiveInfo.level !== 0) { wasModified = true; return { ...item, sensitiveInfo: { level: 0, prompt: "", type: 0 } }; } return item; });
                    if (wasModified) { log(`STATE FORGERY: Sanitized sensitiveInfo in ${listKey.toUpperCase()} response.`); const forgedResponse = { ...originalResponse, data: { ...originalResponse.data, [listKey]: newList } }; return forgedResponse; }
                }
            } else if (matchesEndpoint(url, "API_VIDEO_DETAIL")) {
                if (originalResponse?.data?.videoInfo?.sensitiveInfo?.level !== 0) { log('STATE FORGERY: Sanitized sensitiveInfo in VIDEO DETAIL response.'); const forgedResponse = safeDeepClone(originalResponse); forgedResponse.data.videoInfo.sensitiveInfo = { level: 0, prompt: "", type: 0 }; return forgedResponse; }
            }
        }
        return null;
    }

    //────── NETWORK INTERCEPTION (STREAM HIJACKER & TELEMETRY BLOCK) ──────//
    const originalFetch = _window['fetch'];

    async function captureStream(response) {
        const filename = new URL(response.url).pathname.split('/').pop();
        log(`STREAM-CAPTURE: Intercepting stream for ${filename}`);
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;
        while (true) {
            try {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                receivedLength += value.length;
            } catch (error) { error("Stream read failed:", error); break; }
        }
        if (chunks.length > 0) {
            log(`STREAM-CAPTURE: Reassembled ${receivedLength} bytes. Triggering download.`);
            const blob = new Blob(chunks, { type: 'video/mp4' });
            triggerAutomaticDownload(blob, filename);
        } else { error(`STREAM-CAPTURE: Failed to capture any data for ${filename}`); }
    }

    function overrideFetch() {
        _window['fetch'] = async function (...args) {
            let url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
            let init = { ...(args[1] || {}) };

            if (matchesEndpoint(url, 'API_REPORTER')) {
                log('TELEMETRY-BLOCK: Neutralized analytics report.');
                return new Response(_JSON.stringify({ "status": "ok" }), { status: 200 });
            }

            if (init.body && typeof init.body === 'string' && (init.method === 'POST' || init.method === 'PUT')) {
                try {
                     const originalBodyParsed = JSON.parse(init.body);
                    if (originalBodyParsed) {
                        const { modifiedBody, bodyWasModified } = processRequestBodyModifications(url, originalBodyParsed, config, log, matchesEndpoint, generateUUID, obfuscatePrompt);
                        if (bodyWasModified) { init.body = _JSON.stringify(modifiedBody); }
                    }
                } catch(e) { /* Body is not JSON (e.g., FormData), ignore modification for now */ }
            }

            const response = await originalFetch.apply(this, [args[0], init]);

            if (response.ok && url.includes('.mp4') && (init.method === 'GET' || !init.method)) {
                const responseClone = response.clone();
                captureStream(responseClone);
                return response;
            } else {
                const responseClone = response.clone();
                try {
                    const originalResponseData = await responseClone.json();
                    const forgedResponseData = processResponseModifications(url, originalResponseData);
                    if (forgedResponseData) { return new Response(_JSON.stringify(forgedResponseData), { status: response.status, statusText: response.statusText, headers: response.headers }); }
                } catch (e) { /* Not JSON */ }
            }
            return response;
        };
        myCustomFetch = _window['fetch'];
        log('Stream-Hijack & Telemetry-Block Fetch override active.');
    }

    //────── UI & INITIALIZATION ──────//
    let debugUIInjected = false;
    const _structuredData = [];
    _window.hailuoKit = { get reconData() { return _structuredData; }, clearRecon: () => { _structuredData.length = 0; if (config.debugMode) updateDebugUI(); log('Recon data cleared.'); showToast('Recon Cleared'); }, analyzeEngagement: () => analyzeEngagement(), };
    function logStructuredData(url, data, type) { if (!config.debugMode) return; const sanitizedData = JSON.parse(JSON.stringify(data)); _structuredData.push({ timestamp: new Date().toISOString(), url, type, data: sanitizedData }); updateDebugUI(); }
    function showToast(msg, duration = 3500) { if (!_document.body) return; _document.querySelectorAll(`.${CSS_PREFIX}-toast`).forEach(e => e.remove()); const el = _document.createElement("div"); el.className = `${CSS_PREFIX}-toast`; el.textContent = msg; _document.body.appendChild(el); requestAnimationFrame(() => el.classList.add(`${CSS_PREFIX}-toast-visible`)); setTimeout(() => { el.classList.remove(`${CSS_PREFIX}-toast-visible`); el.addEventListener("transitionend", () => el.remove(), { once: true }); }, duration); }
    async function loadConfig() { const keys = Object.keys(config); for (const key of keys) { const storedValue = await GM_getValue(key, config[key]); config[key] = storedValue; } }
    async function createControlPanel() {
        const panelId = `${CSS_PREFIX}-control-panel`; if (_document.getElementById(panelId)) return;
        const panel = _document.createElement('div'); panel.id = panelId;
        panel.innerHTML = `
      <div class="${CSS_PREFIX}-panel-header"><span>HailuoKit v${GM_info.script.version}</span><button id="${CSS_PREFIX}-panel-toggle" title="Toggle Panel Content">-</button></div>
      <div class="${CSS_PREFIX}-panel-content">
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-promo-exploit" title="METHOD 1 (New Videos): Injects dummy frames to attempt a free promo render. METHOD 2 (Re-Edits): Turn this OFF, use 'Status Bypass' on a moderated video's Re-edit button to trigger a credit refund loop.">Credit Bypass</label><input type="checkbox" id="${CSS_PREFIX}-promo-exploit"></div>
        <hr class="${CSS_PREFIX}-separator">
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-force-quality" title="Forces 1080p on standard video generation requests.">Force Video Quality</label><input type="checkbox" id="${CSS_PREFIX}-force-quality"></div>
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-force-max-images" title="Forces the number of generated images to the maximum (9).">Force Max Images</label><input type="checkbox" id="${CSS_PREFIX}-force-max-images"></div>
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-nsfw-obfuscation" title="Obfuscates prompts. Layered applies Homoglyph THEN ZWSP for maximum evasion.">NSFW Obfuscation</label><select id="${CSS_PREFIX}-nsfw-obfuscation"><option value="none">None</option><option value="zwsp">ZWSP</option><option value="homoglyph">Homoglyph</option><option value="layered">Layered</option></select></div>
        <hr class="${CSS_PREFIX}-separator">
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-status-bypass" title="CRITICAL FOR REFUND EXPLOIT. Continuously forges 'safe' status for generated content.">Status Bypass</label><input type="checkbox" id="${CSS_PREFIX}-status-bypass"></div>
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-anti-debugging" title="Detects developer tools and clears recon data to hinder analysis.">Anti-Debugging</label><input type="checkbox" id="${CSS_PREFIX}-anti-debugging"></div>
        <div class="${CSS_PREFIX}-panel-row"><label for="${CSS_PREFIX}-debug-mode" title="Show debug messages and Recon UI.">Debug Mode</label><input type="checkbox" id="${CSS_PREFIX}-debug-mode"></div>
      </div>`;
        if (!_document.body) { error('Document body not ready.'); return; } _document.body.appendChild(panel);
        const i = (id) => _document.getElementById(`${CSS_PREFIX}-${id}`);
        const inputs = { p: i('promo-exploit'), q: i('force-quality'), img: i('force-max-images'), n: i('nsfw-obfuscation'), s: i('status-bypass'), a: i('anti-debugging'), d: i('debug-mode') };
        const confKeys = { p: 'promoExploitEnabled', q: 'forceQualityEnabled', img: 'forceMaxImagesEnabled', n: 'nsfwObfuscation', s: 'statusBypassEnabled', a: 'antiDebugging', d: 'debugMode' };
        Object.keys(inputs).forEach(key => {
            const el = inputs[key]; const confKey = confKeys[key];
            if (el.type === 'checkbox') el.checked = config[confKey]; else el.value = config[confKey];
            el.addEventListener('change', async (e) => { const val = el.type === 'checkbox' ? e.target.checked : e.target.value; config[confKey] = val; await GM_setValue(confKey, val); showToast(`${el.parentElement.querySelector('label').textContent} ${typeof val === 'boolean' ? (val ? 'Enabled' : 'Disabled') : `: ${val.toUpperCase()}`}`); if (confKey === 'debugMode') updateDebugUIVisibility(); });
        });
        const content = panel.querySelector(`.${CSS_PREFIX}-panel-content`); const toggleBtn = i('panel-toggle'); toggleBtn.addEventListener('click', () => { const isHidden = content.style.display === 'none'; content.style.display = isHidden ? 'block' : 'none'; toggleBtn.textContent = isHidden ? '-' : '+'; });
        const header = panel.querySelector(`.${CSS_PREFIX}-panel-header`); let isDragging = false, offsetX, offsetY; panel.style.left = await GM_getValue('panelPosX', 'auto'); panel.style.top = await GM_getValue('panelPosY', '10px'); panel.style.right = panel.style.left === 'auto' ? '10px' : 'auto'; header.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - panel.getBoundingClientRect().left; offsetY = e.clientY - panel.getBoundingClientRect().top; panel.style.cursor = 'grabbing'; panel.style.right = 'auto'; e.preventDefault(); }); _document.addEventListener('mousemove', (e) => { if (isDragging) { panel.style.left = `${e.clientX - offsetX}px`; panel.style.top = `${e.clientY - offsetY}px`; } }); _document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; panel.style.cursor = 'grab'; GM_setValue('panelPosX', panel.style.left); GM_setValue('panelPosY', panel.style.top); } });
    }
    function setupStealthUI() { _document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'h') { e.preventDefault(); const p = _document.getElementById(`${CSS_PREFIX}-control-panel`); if (p) { p.classList.toggle(`${CSS_PREFIX}-hidden`); showToast(`HailuoKit Panel Toggled`); } } }); }
    function injectCoreStyles() { if (_document.getElementById(`${CSS_PREFIX}-core-styles`)) return; const style = _document.createElement("style"); style.id = `${CSS_PREFIX}-core-styles`; style.textContent = `.${CSS_PREFIX}-hidden { display: none !important; } .${CSS_PREFIX}-toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:rgba(20,40,48,.94);color:#15ffff;padding:8px 20px;border-radius:6px;font:15px/1.2 sans-serif;z-index:300001;opacity:0;transition:opacity .25s ease-in-out;pointer-events:none}.${CSS_PREFIX}-toast-visible{opacity:1}#${CSS_PREFIX}-control-panel{position:fixed;top:10px;right:10px;z-index:300000;background:#1a1a1a;color:#e0e0e0;border:1px solid #444;border-radius:6px;font-family:sans-serif;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.5);user-select:none;min-width:320px;cursor:grab}.${CSS_PREFIX}-panel-header{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#2a2a2a;border-bottom:1px solid #444}.${CSS_PREFIX}-panel-header span{font-weight:700;color:#15ffff}#${CSS_PREFIX}-panel-toggle{background:#444;color:#e0e0e0;border:none;border-radius:4px;width:20px;height:20px;line-height:20px;text-align:center;cursor:pointer;font-weight:700}.${CSS_PREFIX}-panel-content{padding:10px}.${CSS_PREFIX}-panel-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.${CSS_PREFIX}-panel-row:last-child{margin-bottom:0}.${CSS_PREFIX}-panel-row label{margin-right:15px;cursor:help}.${CSS_PREFIX}-panel-row input[type=checkbox]{width:16px;height:16px;margin-left:auto}.${CSS_PREFIX}-panel-row select{background:#111;color:#e0e0e0;border:1px solid #555;border-radius:4px;padding:4px 6px;width:180px;font-size:12px}.${CSS_PREFIX}-separator{border:0;border-top:1px solid #333;margin:10px 0}#${CSS_PREFIX}-debug-panel{position:fixed;bottom:10px;right:10px;width:420px;max-height:50vh;background:rgba(30,30,30,.95);color:#15ffff;border:1px solid #15ffff;border-radius:8px;font-family:'Consolas','Monaco',monospace;font-size:11px;z-index:299998;box-shadow:0 4px 8px rgba(0,0,0,.5);overflow:hidden;display:flex;flex-direction:column;resize:both}.${CSS_PREFIX}-debug-panel.collapsed{height:auto;max-height:35px;resize:none}.${CSS_PREFIX}-debug-header{background:rgba(0,0,0,.8);padding:5px 10px;display:flex;justify-content:space-between;align-items:center;cursor:grab}.${CSS_PREFIX}-debug-header span{font-weight:bold;color:#15ffff}.${CSS_PREFIX}-debug-body{flex-grow:1;display:flex;flex-direction:column;overflow:hidden}.${CSS_PREFIX}-debug-panel.collapsed .${CSS_PREFIX}-debug-body{display:none}.${CSS_PREFIX}-debug-controls{padding:5px 10px;display:flex;flex-wrap:wrap;gap:5px;border-bottom:1px dashed #004040}.${CSS_PREFIX}-debug-controls button{background:#008080;color:#15ffff;border:1px solid #15ffff;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px}.${CSS_PREFIX}-debug-section{flex:1;min-height:80px;padding:5px 10px;overflow-y:auto;border-bottom:1px dashed #004040;display:flex;flex-direction:column}.${CSS_PREFIX}-debug-section:last-of-type{border-bottom:none}.${CSS_PREFIX}-debug-section h4{margin:5px 0;color:#15ffff;font-size:12px;flex-shrink:0}.${CSS_PREFIX}-debug-output{flex-grow:1;background:rgba(0,0,0,.6);border:1px solid #002020;padding:5px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;height:100%}.log-entry{border-bottom:1px solid #004040;padding-bottom:5px;margin-bottom:5px}.log-type{font-weight:bold;margin-bottom:3px}.response_original{color:#888}.response_modified,.response_forged,.request_modified{color:#00ff00}`; if(_document.head) _document.head.appendChild(style); }
    const throttle = (fn, delay) => { let last=0, id; return (...args) => { const now=Date.now(); if(now-last<delay){clearTimeout(id); id=setTimeout(() => {last=now; fn(...args)}, delay-(now-last))} else {last=now; fn(...args)} }; };
    const updateDebugUI = throttle(() => { if (!config.debugMode || !debugUIInjected) return; const dataOutput = _document.getElementById(`${CSS_PREFIX}-data-output`); if (!dataOutput) return; dataOutput.innerHTML = _structuredData.map(e => `<div class="log-entry"><div class="log-type ${e.type.toLowerCase()}">${e.type} @ ${e.url}</div><pre>${_JSON.stringify(e.data, null, 2)}</pre></div>`).join(''); dataOutput.scrollTop = dataOutput.scrollHeight; _document.getElementById(`${CSS_PREFIX}-data-count`).textContent = _structuredData.length; }, 250);
    function updateDebugUIVisibility() { const debugPanel = _document.getElementById(`${CSS_PREFIX}-debug-panel`); if (debugPanel) { debugPanel.style.display = config.debugMode ? 'flex' : 'none'; } else if (config.debugMode && _document.body) { injectDebugUI(); } }
    function injectDebugUI() { if (debugUIInjected || !_document.body) return; const p = _document.createElement("div"); p.id = `${CSS_PREFIX}-debug-panel`; p.className=`${CSS_PREFIX}-debug-panel`; p.innerHTML = `<div class="${CSS_PREFIX}-debug-header"><span>HailuoKit Recon</span><button id="${CSS_PREFIX}-toggle-debug-btn">Collapse</button></div><div class="${CSS_PREFIX}-debug-body"><div class="${CSS_PREFIX}-debug-controls"><button id="${CSS_PREFIX}-clear-recon">Clear Recon</button><button id="${CSS_PREFIX}-copy-recon">Copy Recon</button><button id="${CSS_PREFIX}-analyze">Analyze Engagement</button></div><div id="${CSS_PREFIX}-analysis-area" class="${CSS_PREFIX}-debug-section" style="display:none;"><h4>Engagement Analysis</h4><pre id="${CSS_PREFIX}-analysis-output" class="${CSS_PREFIX}-debug-output"></pre></div><div class="${CSS_PREFIX}-debug-section"><h4>Captured Data (<span id="${CSS_PREFIX}-data-count">0</span>)</h4><div id="${CSS_PREFIX}-data-output" class="${CSS_PREFIX}-debug-output"></div></div></div>`; _document.body.appendChild(p); const i = (id) => _document.getElementById(`${CSS_PREFIX}-${id}`); i('clear-recon').addEventListener('click', _window.hailuoKit.clearRecon); i('copy-recon').addEventListener('click', () => { _navigator.clipboard.writeText(_JSON.stringify(_structuredData, null, 2)); showToast("Recon copied to clipboard!"); }); i('analyze').addEventListener('click', analyzeEngagement); i('toggle-debug-btn').addEventListener('click', () => p.classList.toggle('collapsed')); let isDragging = false, offsetX, offsetY; const header = p.querySelector(`.${CSS_PREFIX}-debug-header`); header.addEventListener('mousedown', (e) => { isDragging = true; offsetX = e.clientX - p.getBoundingClientRect().left; offsetY = e.clientY - p.getBoundingClientRect().top; e.preventDefault(); }); _document.addEventListener('mousemove', (e) => { if (isDragging) { p.style.left = `${e.clientX - offsetX}px`; panel.style.top = `${e.clientY - offsetY}px`; } }); _document.addEventListener('mouseup', () => { isDragging = false; }); debugUIInjected = true; updateDebugUI(); }
    function analyzeEngagement() { const report = `--- Engagement Analysis Report ---\n\nCredit Bypass (Promo): ${_structuredData.some(e => e.type === 'REQUEST_MODIFIED' && e.url.includes('generate/video') && JSON.parse(e.data.fileList || '[]').length > 1) ? 'SUCCESS' : 'NOT TRIGGERED'}\nCredit Bypass (Refund): ${_structuredData.some(e => e.type === 'RESPONSE_FORGED') ? 'SUCCESS' : 'NOT TRIGGERED'}`; const outputEl = _document.getElementById(`${CSS_PREFIX}-analysis-output`); const areaEl = _document.getElementById(`${CSS_PREFIX}-analysis-area`); if(outputEl && areaEl) { outputEl.textContent = report; areaEl.style.display = 'block'; } }

    async function initialize() {
        if (isInitialized) return;
        try {
            await loadConfig();
            processRequestBodyModifications = buildPolymorphicFunction();
            const onReady = async () => { injectCoreStyles(); await createControlPanel(); setupStealthUI(); updateDebugUIVisibility(); };
            if (_document.readyState === 'loading') {
                _document.addEventListener('DOMContentLoaded', onReady, { once: true });
            } else {
                onReady();
            }
            overrideFetch();
            isInitialized = true; log(`HailuoKit v${GM_info.script.version} initialized.`); showToast(`HailuoKit v${GM_info.script.version} loaded.`);
        } catch (e) { error('HailuoKit initialization failed:', e); }
    }

    initialize();

})();
