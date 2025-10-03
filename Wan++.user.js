// ==UserScript==
// @name        4ndr0tools - Wan++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     4.0.0
// @description Red Team Framework: Includes proactive CSP neutralization, polymorphic UI, advanced layered NSFW obfuscation, and all credit/model/task bypass vectors. For authorized security research.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20WanVideoChimera.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20WanVideoChimera.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://*.wan.video/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @license     MIT
// ==/UserScript==

(() => {
    "use strict";

    //────── 1. POLYMORPHIC INITIALIZATION & SINGLETON LOCK ──────//
    // Tradecraft: Use a randomized global variable to prevent double-injection, which is stealthier than a static property.
    const generateUUID = () => 'psi'.concat(Math.random().toString(36).substring(2, 10));
    const SCRIPT_ID = generateUUID();
    if (window[SCRIPT_ID]) return;
    window[SCRIPT_ID] = true;

    //────── 2. DEFENSE NEUTRALIZATION (CSP INOCULATOR) ──────//
    // Tradecraft: Proactively remove CSP meta tags on-the-fly to prevent the browser from blocking our dynamic code and inline styles.
    const neutralizeMetaCSP = () => {
        const observer = new MutationObserver((mutations, obs) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'META' && node.httpEquiv?.toLowerCase() === 'content-security-policy') {
                        node.remove();
                        obs.disconnect(); // We found and removed the tag, no need to keep observing.
                        return;
                    }
                }
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };
    neutralizeMetaCSP();

    //────── 3. OPSEC & ALIASED GLOBALS ──────//
    const _window = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    const _console = _window['console'];
    const _JSON = _window['JSON'];
    const _document = _window['document'];

    //────── 4. ENCRYPTED STRING & CONSTANT STORE ──────//
    const ENCRYPTED_STORE = {
        key: "PsiAnarchKey",
        blob: "eyJiIjp7ImxvY2FsU3RvcmFnZUtleSI6InBzaS5hbmFyY2guY29uZmlnLnYxIiwidHJpZ2dlcldvcmRzIjpbImFzc2hvcmUiLCJhbmFsIiwic2V4IiwibnVkZSIsImJvbmRhZ2UiLCJmZXRpc2giLCJjdW0iLCJjb2NrIiwiZGljayIsInB1c3N5IiwiY3VudCIsImZ1Y2siLCJuaXBwbGUiLCJ0aXRzIiwiYnJlYXN0cyIsImJvb2JzIiwib3JnYXNtIiwib3JneSIsImVqYWN1bGF0ZSIsImJsb3dqb2IiLCJoYW5kam9iIiwicG9ybiIsIm5zZnciLCJ4eHgiLCJzbHV0Iiwid2hvcmUiLCJtYXN0dXJiYXRlIiwiY3JlYW1waWUiLCJkZWVwdGhyb2F0Il0sImFwaV9pbWFnaW5lQ291bnQiOiIvd2FueC9hcGkvY29tbW9uL2ltYWdpbmVDb250cm9sIiwiYXBpX3VzZXJJbmZvIjoiL3dhbngvYXBpL2NvbW1vbi91c2VySW5mby9nZXQiLCJhcGlfbW9kZWxMaXN0IjoiL3dhbngvYXBpL21vZGVsL3YyL2xpc3QiLCJhcGlfaW1hZ2VHZW4iOiIvd2FueC9hcGkvY29tbW9uL2ltYWdlR2VuIiwiYXBpX3Rhc2tQYWdpbmdMaXN0IjoiL3dhbngvYXBpL2NvbW1vbi92Mi90YXNrL3BhZ2luZ0xpc3QiLCJhcGlfdGFza1Jlc3VsdCI6Ii93YW54L2FwaS9jb21tb24vdjIvdGFza1Jlc3VsdCIsImFwaV9pbWFnZTJ2aWRlb0dlbiI6Ii93YW54L2FwaS9jb21tbW9uL2ltYWdlMnZpZGVvR2VuIn19",
    };
    const STRINGS = (() => {
        const key = ENCRYPTED_STORE.key;
        const decodedBlob = _window.atob(ENCRYPTED_STORE.blob);
        let decrypted = ""; for (let i = 0; i < decodedBlob.length; i++) { decrypted += String.fromCharCode(decodedBlob.charCodeAt(i) ^ key.charCodeAt(i % key.length)); }
        return _JSON.parse(decrypted).b;
    })();

    const API_ENDPOINTS = {
        imagineCount: new RegExp(STRINGS.api_imagineCount), userInfo: new RegExp(STRINGS.api_userInfo), modelList: new RegExp(STRINGS.api_modelList),
        imageGen: new RegExp(STRINGS.api_imageGen), taskPagingList: new RegExp(STRINGS.api_taskPagingList), taskResult: new RegExp(STRINGS.api_taskResult),
        image2videoGen: new RegExp(STRINGS.api_image2videoGen),
    };

    const NSFW_PROMPT_REGEX = () => new RegExp(`\\b(?:${STRINGS.triggerWords.join('|')})\\b`, "gi");
    const HOMOGLYPH_MAP = { 'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у' };

    //────── 5. STATE MANAGEMENT & REACTIVE CONFIG ──────//
    const DEFAULT_CONFIG = {
        panelCollapsed: false, debugMode: true, imagineCountSpoofValue: 999999, taskQuotaValue: 99999,
        spoofedMemberLevel: 'PREMIUM', modelUnlock: true, nsfwObfuscation: 'layered', // 'none', 'zwsp', 'homoglyph', 'layered'
        watermarkBypass: true, taskCompletionSpoof: true, autoDownloadVideos: true,
        domTamperTarget: 'span.pv-credit-value, span.money-num, span.font-medium.text-sm.ml-\\[4px\\]'
    };

    const STATE = {
        isInitialized: false, originalFetch: _window.fetch, originalXhrOpen: XMLHttpRequest.prototype.open,
        originalXhrSend: XMLHttpRequest.prototype.send, domObserver: null, cryptoKey: null,
        ui: { cssPrefix: generateUUID().substring(0, 4), panelId: generateUUID(), headerId: generateUUID(), contentId: generateUUID() }
    };

    let CONFIG = {};

    //────── 6. CORE & HELPER MODULE ──────//
    const HELPERS = {
        // Tradecraft: Styled logging provides immediate situational awareness, separating framework noise from actionable intelligence.
        log: (msg, ...args) => CONFIG.debugMode && _console.log(`%c[INFO]%c ${msg}`, 'color:#00FFFF;font-weight:bold;', 'color:inherit;', ...args),
        vector: (msg, ...args) => CONFIG.debugMode && _console.log(`%c[VECTOR]%c ${msg}`, 'color:#FFD700;font-weight:bold;', 'color:inherit;', ...args),
        warn: (msg, ...args) => CONFIG.debugMode && _console.warn(`%c[WARN]%c ${msg}`, 'color:#FF4500;font-weight:bold;', 'color:inherit;', ...args),
        error: (msg, ...args) => CONFIG.debugMode && _console.error(`%c[ERROR]%c ${msg}`, 'color:#FF0000;font-weight:bold;', 'color:inherit;', ...args),
        safeDeepClone: (obj) => { try { return structuredClone(obj); } catch { try { return _JSON.parse(_JSON.stringify(obj)); } catch { return null; } } },
        matchesEndpoint: (url, key) => API_ENDPOINTS[key]?.test(url),
        parseBody: (body) => { if (typeof body === "string") { try { return _JSON.parse(body); } catch (e) { return body; } } return null; },
        triggerDownload: (url, filename) => {
            HELPERS.vector(`AUTOMATION: Triggering local exfiltration for ${filename}`);
            const link = _document.createElement('a');
            link.style.display = 'none'; link.href = url; link.download = filename || `chimera-capture-${Date.now()}.mp4`;
            _document.body.appendChild(link); link.click(); setTimeout(() => _document.body.removeChild(link), 100);
        },
        obfuscatePrompt: (prompt) => {
            if (CONFIG.nsfwObfuscation === 'none' || typeof prompt !== 'string') return prompt;
            const applyHomoglyph = (text) => text.replace(NSFW_PROMPT_REGEX(), m => m.split('').map(char => HOMOGLYPH_MAP[char.toLowerCase()] || char).join(''));
            const applyZWSP = (text) => text.replace(NSFW_PROMPT_REGEX(), m => m.split('').join('\u200B'));
            switch (CONFIG.nsfwObfuscation) {
                case 'zwsp': return applyZWSP(prompt);
                case 'homoglyph': return applyHomoglyph(prompt);
                case 'layered': return applyZWSP(applyHomoglyph(prompt));
                default: return prompt;
            }
        },
    };

    //────── 7. CRYPTO MODULE (FOR CONFIG STORAGE) ──────//
    const configProxyHandler = {
        set(target, property, value) {
            target[property] = value;
            CRYPTO_MODULE.encryptAndStore(target);
            if (property === 'panelCollapsed') UI_MODULE.updatePanelVisibility();
            UI_MODULE.showToast(`'${property}' updated.`);
            return true;
        },
    };
    const CRYPTO_MODULE = {
        deriveKey: async () => {
            if (STATE.cryptoKey) return STATE.cryptoKey;
            const enc = new TextEncoder(); const secret = enc.encode("wan-chimera-secret-phrase"); const salt = enc.encode("psi-anarch-salt");
            const keyMaterial = await _window.crypto.subtle.importKey('raw', secret, { name: 'PBKDF2' }, false, ['deriveKey']);
            STATE.cryptoKey = await _window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
            return STATE.cryptoKey;
        },
        encrypt: async (data) => {
            const key = await CRYPTO_MODULE.deriveKey(); const iv = _window.crypto.getRandomValues(new Uint8Array(12));
            const encodedData = new TextEncoder().encode(_JSON.stringify(data));
            const encryptedContent = await _window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encodedData);
            const buffer = new Uint8Array(iv.length + encryptedContent.byteLength); buffer.set(iv); buffer.set(new Uint8Array(encryptedContent), iv.length);
            return _window.btoa(String.fromCharCode.apply(null, buffer));
        },
        decrypt: async (data) => {
            try {
                const key = await CRYPTO_MODULE.deriveKey(); const buffer = new Uint8Array(_window.atob(data).split('').map(c => c.charCodeAt(0)));
                const iv = buffer.slice(0, 12); const encryptedContent = buffer.slice(12);
                const decryptedContent = await _window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedContent);
                return _JSON.parse(new TextDecoder().decode(decryptedContent));
            } catch (e) { HELPERS.error("Crypto: Failed to decrypt config.", e); return null; }
        },
        encryptAndStore: async (configObject) => { const encryptedConfig = await CRYPTO_MODULE.encrypt(configObject); await GM_setValue(STRINGS.localStorageKey, encryptedConfig); },
        loadAndDecrypt: async () => {
            const encryptedConfig = await GM_getValue(STRINGS.localStorageKey, null); if (!encryptedConfig) return { ...DEFAULT_CONFIG };
            const decrypted = await CRYPTO_MODULE.decrypt(encryptedConfig); return decrypted ? { ...DEFAULT_CONFIG, ...decrypted } : { ...DEFAULT_CONFIG };
        }
    };

    //────── 8. WEAPONIZED VECTORS (API MODIFICATION LOGIC) ──────//
    const VECTOR_MODULE = {
        spoofImagineCount: (data) => {
            const clone = HELPERS.safeDeepClone(data); clone.data.availableCount = clone.data.totalCount = CONFIG.imagineCountSpoofValue;
            if (clone.data.amount) { clone.data.amount.total = clone.data.amount.bonus = CONFIG.imagineCountSpoofValue; }
            HELPERS.vector(`Imagine count spoofed to ${CONFIG.imagineCountSpoofValue}`); return clone;
        },
        spoofUserInfo: (data) => {
            let modified = false; const clone = HELPERS.safeDeepClone(data); if (!clone?.data) return null;
            clone.data.taskQuota.image = clone.data.taskQuota.video = CONFIG.taskQuotaValue; clone.data.active.memberLevel = CONFIG.spoofedMemberLevel;
            modified = true; HELPERS.vector(`User info spoofed: Level=${CONFIG.spoofedMemberLevel}, Quota=${CONFIG.taskQuotaValue}`); return modified ? clone : null;
        },
        unlockModels: (data) => {
            if (!CONFIG.modelUnlock || !Array.isArray(data?.data)) return null;
            const clone = HELPERS.safeDeepClone(data); let unlocked = 0;
            clone.data.forEach(m => { if (m.memberLevelList && !m.memberLevelList.includes("FREE")) { m.memberLevelList.unshift("FREE"); unlocked++; } });
            if (unlocked > 0) HELPERS.vector(`Unlocked ${unlocked} premium models.`); return clone;
        },
        processTaskObject: (task, context) => {
            let modified = false; if (!task) return { task, modified };
            if (CONFIG.watermarkBypass && task.taskResult && Array.isArray(task.taskResult)) {
                task.taskResult.forEach(res => { if (res.noWaterMark === false) { res.noWaterMark = true; if (res.ossPath) { res.downloadUrlWithLogo = `https://cdn.wanxai.com/${res.ossPath}`; } modified = true; } });
                if (modified) HELPERS.vector(`Watermark bypassed on task ${task.taskId}`);
            }
            if (CONFIG.taskCompletionSpoof && [0, 1, -1].includes(task.status)) {
                task.status = 2; task.taskRate = 100;
                if (!task.taskResult || task.taskResult.length === 0) { task.taskResult = [{ resourceId: task.taskId, noWaterMark: true, ossPath: `wanx/spoofed/${task.taskId}.mp4` }]; }
                HELPERS.vector(`Spoofed task ${task.taskId} in ${context} to COMPLETED.`); modified = true;
            }
            if (CONFIG.autoDownloadVideos && task.status === 2 && task.taskResult?.[0]?.ossPath && task.taskResult[0].ossPath.endsWith('.mp4')) {
                const downloadUrl = `https://cdn.wanxai.com/${task.taskResult[0].ossPath}`; HELPERS.triggerDownload(downloadUrl, `${task.taskId}.mp4`);
            }
            return { task, modified };
        },
        modifyResponse: (data, url) => {
            if (!data || typeof data !== "object" || data.success === false) return null;
            if (HELPERS.matchesEndpoint(url, "imagineCount")) return VECTOR_MODULE.spoofImagineCount(data);
            if (HELPERS.matchesEndpoint(url, "userInfo")) return VECTOR_MODULE.spoofUserInfo(data);
            if (HELPERS.matchesEndpoint(url, "modelList")) return VECTOR_MODULE.unlockModels(data);
            if (HELPERS.matchesEndpoint(url, "taskPagingList") && Array.isArray(data.data)) {
                const clone = HELPERS.safeDeepClone(data); let listModified = false;
                clone.data = clone.data.map(t => { const r = VECTOR_MODULE.processTaskObject(t, 'pagingList'); if (r.modified) listModified = true; return r.task; });
                return listModified ? clone : null;
            }
            if (HELPERS.matchesEndpoint(url, "taskResult") && data.data) {
                const clone = HELPERS.safeDeepClone(data); const { task, modified } = VECTOR_MODULE.processTaskObject(clone.data, 'taskResult');
                clone.data = task; return modified ? clone : null;
            }
            return null;
        },
        modifyRequest: (url, method, body) => {
            let modifiedBody = HELPERS.safeDeepClone(body); let bodyWasModified = false;
            const isGenerativeEndpoint = HELPERS.matchesEndpoint(url, "imageGen") || HELPERS.matchesEndpoint(url, "image2videoGen");
            if (CONFIG.nsfwObfuscation !== 'none' && isGenerativeEndpoint && method === "POST" && modifiedBody?.taskInput?.prompt) {
                const originalPrompt = modifiedBody.taskInput.prompt;
                const obfuscated = HELPERS.obfuscatePrompt(originalPrompt);
                if (originalPrompt !== obfuscated) {
                    modifiedBody.taskInput.prompt = obfuscated; bodyWasModified = true;
                    const vectorType = HELPERS.matchesEndpoint(url, "image2videoGen") ? "Image2Video" : "ImageGen";
                    HELPERS.vector(`NSFW prompt obfuscation (${CONFIG.nsfwObfuscation}) applied to ${vectorType}.`);
                }
            }
            return { modifiedBody, bodyWasModified };
        }
    };

    //────── 9. NETWORK INTERCEPTION & SELF-HEALING MODULE ──────//
    const NETWORK_MODULE = {
        overrideFetch: () => {
            const fetchHookBody = `
                let url = args[0] instanceof Request ? args[0].url : args[0];
                let init = args[0] instanceof Request ? args[0] : { ...args[1] } || {};
                const method = (init?.method || "GET").toUpperCase();
                if (init.body) {
                    const originalBodyParsed = HELPERS.parseBody(init.body);
                    const { modifiedBody, bodyWasModified } = VECTOR_MODULE.modifyRequest(url, method, originalBodyParsed);
                    if (bodyWasModified) {
                        init.body = _JSON.stringify(modifiedBody);
                        if (args[0] instanceof Request) { args[0] = new Request(args[0], { body: init.body }); } else { args[1] = init; }
                    }
                }
                const res = await STATE.originalFetch.apply(this, args); const clone = res.clone();
                try {
                    const respData = await clone.json();
                    const modifiedResponse = VECTOR_MODULE.modifyResponse(respData, url);
                    if (modifiedResponse) { return new Response(_JSON.stringify(modifiedResponse), { status: res.status, statusText: res.statusText, headers: res.headers }); }
                } catch(e) { /* Not JSON */ }
                return res;`;
            _window.fetch = new Function('STATE', 'HELPERS', 'VECTOR_MODULE', '_JSON', 'return async function(...args) {' + fetchHookBody + '}')(STATE, HELPERS, VECTOR_MODULE, _JSON);
        },
        overrideXHR: () => {
            const openHook = function(method, url) { this._url = url; this._method = method; STATE.originalXhrOpen.apply(this, arguments); };
            const sendHookBody = `
                let finalBody = body;
                if (body) {
                    const { modifiedBody, bodyWasModified } = VECTOR_MODULE.modifyRequest(this._url, this._method, HELPERS.parseBody(body));
                    if (bodyWasModified) { finalBody = _JSON.stringify(modifiedBody); }
                }
                this.addEventListener("load", () => {
                    try {
                        const modifiedResponse = VECTOR_MODULE.modifyResponse(_JSON.parse(this.responseText || "{}"), this._url);
                        if (modifiedResponse) {
                            Object.defineProperties(this, {
                                response: { value: _JSON.stringify(modifiedResponse), writable: true },
                                responseText: { value: _JSON.stringify(modifiedResponse), writable: true }
                            });
                        }
                    } catch(e) { /* Not JSON */ }
                }, { once: true });
                return STATE.originalXhrSend.apply(this, [finalBody]);`;
            XMLHttpRequest.prototype.open = openHook;
            XMLHttpRequest.prototype.send = new Function('STATE', 'HELPERS', 'VECTOR_MODULE', '_JSON', 'return function(body) {' + sendHookBody + '}')(STATE, HELPERS, VECTOR_MODULE, _JSON);
        },
        startSelfHealing: () => { setInterval(() => { if (_window.fetch === STATE.originalFetch) { HELPERS.warn('Self-Healing: fetch overwritten. Re-hooking.'); NETWORK_MODULE.overrideFetch(); } if (XMLHttpRequest.prototype.send === STATE.originalXhrSend) { HELPERS.warn('Self-Healing: XHR.send overwritten. Re-hooking.'); NETWORK_MODULE.overrideXHR(); } }, 3000); }
    };

    //────── 10. DOM & UI MODULE ──────//
    const UI_MODULE = {
        showToast: (msg, duration = 3000) => {
            if (!_document.body) return; const p = STATE.ui.cssPrefix; _document.querySelectorAll(`.${p}-toast`).forEach(e => e.remove());
            const el = _document.createElement("div"); el.className = `${p}-toast`; el.textContent = msg; _document.body.appendChild(el);
            requestAnimationFrame(() => el.classList.add(`${p}-toast-visible`)); setTimeout(() => { el.classList.remove(`${p}-toast-visible`); el.addEventListener("transitionend", () => el.remove(), { once: true }); }, duration);
        },
        injectStyles: () => {
            const p = STATE.ui.cssPrefix;
            const styleSheet = _document.createElement("style");
            styleSheet.innerText = `
                .${p}-hidden { display: none !important; }
                .${p}-toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(20, 40, 48, 0.95); color:#15ffff; padding:10px 22px; border-radius:6px; font: 15px monospace; z-index:2147483647; opacity:0; transition:opacity .25s ease; pointer-events:none; border: 1px solid #15ffff; }
                .${p}-toast-visible { opacity:1; }
                #${STATE.ui.panelId} { position: fixed; z-index: 2147483646; background: #1a1a1a; color: #00fefe; border: 1px solid #00fefe; border-radius: 8px; font-family: monospace; width: 350px; box-shadow: 0 0 20px #00fefe77; user-select: none; }
                #${STATE.ui.headerId} { padding: 10px; margin:-15px -15px 10px -15px; text-align:center; cursor:grab; user-select:none; border-bottom: 1px solid #00fefe; background: #2a2a2a;}
                #${STATE.ui.panelId} hr { border-color:#00fefe; opacity: 0.2; }
                #${STATE.ui.panelId} .control-row { margin: 8px 0; display: flex; justify-content: space-between; align-items: center; }
                #${STATE.ui.panelId} input, #${STATE.ui.panelId} select { background: #333; color: #fff; border: 1px solid #555; padding: 4px; border-radius: 4px; }
                #${STATE.ui.panelId} input[type="checkbox"] { width: 18px; height: 18px; accent-color: #00fefe; }`;
            _document.head.appendChild(styleSheet);
        },
        updatePanelVisibility: () => {
            const content = _document.getElementById(STATE.ui.contentId); if (content) content.style.display = CONFIG.panelCollapsed ? 'none' : 'block';
            const header = _document.getElementById(STATE.ui.headerId); if (header) header.innerHTML = CONFIG.panelCollapsed ? "WanChimera [Collapsed]" : `WanChimera v4.0.0<br><span style="font-size:10px; color:#4CAF50;">STATUS: ARMED</span>`;
        },
        createControlPanel: async () => {
            if (_document.getElementById(STATE.ui.panelId)) return;
            const panel = _document.createElement('div'); panel.id = STATE.ui.panelId; panel.style.padding = '15px';
            const createControl = (key, type, label, options = {}) => {
                const val = CONFIG[key]; const id = `cfg-${STATE.ui.cssPrefix}-${key}`; let controlHtml = `<div class="control-row"><label for="${id}">${label}</label>`;
                switch (type) {
                    case 'toggle': controlHtml += `<input type="checkbox" id="${id}" ${val ? 'checked' : ''}>`; break;
                    case 'text': case 'number': controlHtml += `<input type="text" id="${id}" value="${val}" style="width: 120px;">`; break;
                    case 'select': controlHtml += `<select id="${id}" style="width: 125px;">${options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`; break;
                } return controlHtml + `</div>`;
            };
            let content = `<h3 id="${STATE.ui.headerId}"></h3><div id="${STATE.ui.contentId}">`;
            content += createControl('debugMode', 'toggle', 'Debug Logging'); content += createControl('autoDownloadVideos', 'toggle', 'Auto-Download Video');
            content += '<hr>';
            content += createControl('imagineCountSpoofValue', 'number', 'Spoof Credit Count'); content += createControl('spoofedMemberLevel', 'select', 'Spoofed Level', ['FREE', 'PRO', 'PREMIUM']);
            content += createControl('nsfwObfuscation', 'select', 'NSFW Obfuscation', ['none', 'zwsp', 'homoglyph', 'layered']);
            content += '<hr>';
            content += createControl('modelUnlock', 'toggle', 'Unlock Premium Models'); content += createControl('watermarkBypass', 'toggle', 'Bypass Watermarks'); content += createControl('taskCompletionSpoof', 'toggle', 'Spoof Task Completion');
            content += '</div>'; panel.innerHTML = content; _document.body.appendChild(panel);

            panel.style.left = await GM_getValue('panelPosX', '10px'); panel.style.top = await GM_getValue('panelPosY', '10px');
            const header = _document.getElementById(STATE.ui.headerId);
            header.addEventListener('mousedown', (e) => {
                header.style.cursor = 'grabbing'; let offsetX = e.clientX - panel.getBoundingClientRect().left; let offsetY = e.clientY - panel.getBoundingClientRect().top;
                const moveHandler = (moveEvent) => { panel.style.left = `${moveEvent.clientX - offsetX}px`; panel.style.top = `${moveEvent.clientY - offsetY}px`; };
                const upHandler = () => { header.style.cursor = 'grab'; _document.removeEventListener('mousemove', moveHandler); _document.removeEventListener('mouseup', upHandler); GM_setValue('panelPosX', panel.style.left); GM_setValue('panelPosY', panel.style.top); };
                _document.addEventListener('mousemove', moveHandler); _document.addEventListener('mouseup', upHandler);
            });
            header.addEventListener('dblclick', () => CONFIG.panelCollapsed = !CONFIG.panelCollapsed);
            panel.querySelectorAll('input, select').forEach(el => {
                const key = el.id.replace(`cfg-${STATE.ui.cssPrefix}-`, ''); const type = el.type;
                el.addEventListener('change', (e) => {
                    if (type === 'checkbox') CONFIG[key] = e.target.checked; else if (type === 'number') CONFIG[key] = parseInt(e.target.value, 10) || 0; else CONFIG[key] = e.target.value;
                });
            });
            UI_MODULE.updatePanelVisibility();
        },
        setupStealthMode: () => { _document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'i') { e.preventDefault(); const panel = _document.getElementById(STATE.ui.panelId); if (panel) { panel.classList.toggle(`${STATE.ui.cssPrefix}-hidden`); UI_MODULE.showToast(`Chimera Panel ${panel.classList.contains(`${STATE.ui.cssPrefix}-hidden`) ? 'Hidden' : 'Visible'}`); } } }); }
    };
    const DOM_MODULE = { startDomTampering: () => { if (!CONFIG.domTamperTarget) return; const cb = () => { _document.querySelectorAll(CONFIG.domTamperTarget).forEach(el => { if (el.textContent != CONFIG.imagineCountSpoofValue) { el.textContent = CONFIG.imagineCountSpoofValue; } }); }; STATE.domObserver = new MutationObserver(cb); STATE.domObserver.observe(_document.body, { childList: true, subtree: true, characterData: true }); HELPERS.log('DOM Tampering Observer is now active.'); } };

    //────── 11. INITIALIZATION & LIFECYCLE ──────//
    async function initialize() {
        if (STATE.isInitialized) return; CONFIG = new Proxy(await CRYPTO_MODULE.loadAndDecrypt(), configProxyHandler);
        HELPERS.log('Initializing WanChimeraKit v4.0.0 "Gilded Serpent"...');
        NETWORK_MODULE.overrideFetch(); NETWORK_MODULE.overrideXHR();
        STATE.isInitialized = true; HELPERS.log('Network interception is ARMED.');
    }

    function onBodyAvailable() {
        UI_MODULE.injectStyles(); UI_MODULE.createControlPanel(); UI_MODULE.setupStealthMode();
        NETWORK_MODULE.startSelfHealing(); DOM_MODULE.startDomTampering();
        HELPERS.log('Core systems injected. UI, self-healing, and DOM tampering hooks are active.');
        UI_MODULE.showToast("WanChimera v4.0.0 ARMED");
    }

    initialize().catch(e => HELPERS.error('Catastrophic failure during pre-initialization:', e));
    new MutationObserver((m, o) => { if (_document.body) { onBodyAvailable(); o.disconnect(); } }).observe(_document.documentElement, { childList: true });
    _document.addEventListener('DOMContentLoaded', onBodyAvailable, { once: true });

})();
