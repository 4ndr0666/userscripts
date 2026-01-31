// ==UserScript==
// @name        4ndr0tools - Hailuo++ v20.1
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     20.1.0
// @description The Platinum release. Fixes 'ghost asset' flooding via GM_xmlhttpRequest. Features circular-safe cloning, debounced DOM harvesting, and absolute asset verification.
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @connect     hailuoai.video
// @connect     cdn.hailuoai.video
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @license     MIT
// ==/UserScript==

(async () => {
    "use strict";

    if (window._redCellInitialized) return;
    window._redCellInitialized = true;

    //────── 1. CRYPTO & UTILS ──────//
    const Utils = {
        randStr: (len = 8) => [...Array(len)].map(() => Math.floor(Math.random() * 36).toString(36)).join(''),
        sleep: (ms) => new Promise(r => setTimeout(r, ms)),
        escapeRegExp: (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        debounce: (func, wait) => {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        },
        // Circular-safe clone
        safeClone: (obj) => {
            const seen = new WeakMap();
            function clone(val) {
                if (typeof val !== "object" || val === null) return val;
                if (seen.has(val)) return seen.get(val);
                const result = Array.isArray(val) ? [] : {};
                seen.set(val, result);
                for (const key in val) {
                    if (Object.prototype.hasOwnProperty.call(val, key)) {
                        result[key] = clone(val[key]);
                    }
                }
                return result;
            }
            return clone(obj);
        },

        // Volatile AES-256 Key (RAM only)
        sessionKey: null,
        initCrypto: async () => {
            if (Utils.sessionKey) return;
            try {
                Utils.sessionKey = await window.crypto.subtle.generateKey(
                    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
                );
            } catch(e) { console.error("Hailuo++: Crypto Init Failed", e); }
        },
        encrypt: async (data) => {
            if (!Utils.sessionKey) await Utils.initCrypto();
            try {
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const enc = new TextEncoder();
                const ciphertext = await window.crypto.subtle.encrypt(
                    { name: "AES-GCM", iv: iv }, Utils.sessionKey, enc.encode(JSON.stringify(data))
                );
                const combined = new Uint8Array(iv.length + ciphertext.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(ciphertext), iv.length);
                let binary = '';
                for (let i = 0; i < combined.byteLength; i++) binary += String.fromCharCode(combined[i]);
                return btoa(binary);
            } catch (e) { return null; }
        },
        decrypt: async (str) => {
            if (!Utils.sessionKey || !str) return null;
            try {
                const binary = atob(str);
                const raw = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) raw[i] = binary.charCodeAt(i);
                const iv = raw.slice(0, 12);
                const data = raw.slice(12);
                const dec = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv }, Utils.sessionKey, data
                );
                return JSON.parse(new TextDecoder().decode(dec));
            } catch (e) { return null; }
        }
    };

    //────── 2. ADVANCED CSP EVASION ──────//
    const SecurityContext = {
        policy: null,
        init: () => {
            if (window.trustedTypes && window.trustedTypes.createPolicy) {
                try {
                    SecurityContext.policy = window.trustedTypes.createPolicy('redcell-' + Utils.randStr(4), {
                        createHTML: s => s,
                        createScript: s => s,
                        createScriptURL: s => s
                    });
                } catch (e) {}
            }
        },
        injectCSS: (css, id) => {
            if (document.getElementById(id)) return;
            const tryBlob = () => {
                try {
                    const blob = new Blob([css], { type: 'text/css' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.id = id;
                    link.href = SecurityContext.policy ? SecurityContext.policy.createScriptURL(url) : url;
                    (document.head || document.documentElement).appendChild(link);
                } catch(e) {}
            };
            try {
                const style = document.createElement('style');
                style.id = id;
                style.textContent = css;
                (document.head || document.documentElement).appendChild(style);
            } catch (e) { tryBlob(); }
        }
    };

    await Utils.initCrypto();
    SecurityContext.init();

    //────── 3. CONFIG & STATE ──────//
    let isInitialized = false;
    let savedMediaPath = null;
    let processingBuffer = [];
    let processingMutations = Object.create(null);
    let benignBatchRing = [];

    const config = {
        debugMode: false,
        nsfwObfuscation: 'bracket',
        autoMutateOnBlock: true,
        archiveOlderThan: 200,
        benignRingSize: 5
    };

    function log(msg, data) {
        if (!config.debugMode) return;
        console.log(`[RedCell] ${msg}`, data || '');
    }

    function isJunkAsset(url) {
        if (!url || typeof url !== 'string') return true;
        if (url.includes('filecdn.minimax.chat') && url.includes('/public/')) return true;
        if (/meerkat|browser-intake|sentry|trace|log/.test(url)) return true;
        return false;
    }

    //────── 4. ASSET MANAGEMENT (SESSION) ──────//
    const SESSION_KEY = 'hailuo_secure_store_v20';
    let _sessionCache = null;

    async function getSession() {
        if (_sessionCache) return _sessionCache;
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (!stored) { _sessionCache = []; return []; }
        const decrypted = await Utils.decrypt(stored);
        if (decrypted === null) {
            sessionStorage.removeItem(SESSION_KEY);
            _sessionCache = [];
            return [];
        }
        _sessionCache = decrypted;
        return _sessionCache;
    }

    async function saveSession(arr) {
        _sessionCache = arr;
        const enc = await Utils.encrypt(arr);
        if (enc) sessionStorage.setItem(SESSION_KEY, enc);
    }

    // Debounced UI update
    const updatePreviewPanelDebounced = Utils.debounce(updatePreviewPanel, 500);

    async function addAsset(url, thumb = "") {
        if (isJunkAsset(url)) return;
        const list = await getSession();
        if (list.some(i => i.url === url)) return;

        // Visual Fix: Generate SVG thumb for videos/images if missing
        if (!thumb) {
            if (/\.(mp4|webm)$/i.test(url)) {
                 thumb = 'data:image/svg+xml,<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect fill="%23101827" width="16" height="16"/><text x="4" y="11" fill="%2315fafa" font-size="8">VID</text></svg>';
            } else {
                 thumb = 'data:image/svg+xml,<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect fill="%23101827" width="16" height="16"/><text x="4" y="11" fill="%230f0" font-size="8">IMG</text></svg>';
            }
        }

        const filename = url.split('/').pop().split('?')[0];
        const isRaw = !url.includes('watermark') && url.includes('moss/prod');

        list.unshift({
            url, filename, thumb: thumb||"",
            ts: Date.now(),
            isRaw: isRaw,
            health: "pending",
            lastChecked: 0
        });

        if (list.length > config.archiveOlderThan) list.length = config.archiveOlderThan;
        await saveSession(list);
        updatePreviewPanelDebounced();
    }

    //────── 5. LOGIC CORE & RECOVERY ──────//
    const TRIGGER_WORDS_B64 = "YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAsc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhyb2F0aW5nLHRpdHMsdGl0LHRpdHR5LHRpdGZ1Y2ssdGl0dGllcyx0aXR0eWRyb3AsdGl0dHlmdWNrLHRpdGZ1Y2ssdmFnaW5hLHdpZW5lcix3aG9yZSx0aG9uZw==";
    let _triggers = null;

    function bracketObfuscate(text) {
        if (!text || typeof text !== 'string') return text;
        if (!_triggers) {
            try { _triggers = atob(TRIGGER_WORDS_B64).split(','); }
            catch(e) { _triggers = ["ass", "naked", "nude", "fuck"]; }
        }
        const re = new RegExp(`\\b(${_triggers.join('|')})\\b`, 'gi');
        return text.replace(re, m => `[${m.split('').map(c=>c+c).join('')}]`);
    }

    function extractThumb(obj) {
        if (obj.coverUrl) return obj.coverUrl;
        const url = obj.url || obj.videoUrl || obj.imageUrl || "";
        if (/\.(png|jpg|jpeg|gif)$/i.test(url)) return url;
        // SVG Fallback handled in addAsset now
        return "";
    }

    // ROBUST CHECKER (GM_xmlhttpRequest)
    function checkUrlExists(url) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: "HEAD",
                url: url,
                onload: (r) => resolve(r.status >= 200 && r.status < 400),
                onerror: () => resolve(false)
            });
        });
    }

    async function verifyAndRecoverUrl(originalUrl, thumb) {
        if (isJunkAsset(originalUrl)) return;

        // 1. Try Original
        if (await checkUrlExists(originalUrl)) {
            addAsset(originalUrl, thumb);
            return;
        }

        const filename = originalUrl.split('/').pop().split('?')[0];
        const patterns = [
            `https://cdn.hailuoai.video/moss/prod/${filename}`,
            `https://cdn.hailuoai.video/generated/${filename}`,
            `https://cdn.hailuoai.video/user_assets/${filename}`
        ];

        // 2. UUID Pivot (Image -> Video)
        if (/(jpeg|jpg|png)$/i.test(filename) && filename.match(/[0-9a-f]{8}-[0-9a-f]{4}/)) {
            const mp4Name = filename.replace(/\.(jpeg|jpg|png)$/i, '.mp4');
            patterns.push(originalUrl.replace(filename, mp4Name));
            patterns.push(`https://cdn.hailuoai.video/moss/prod/${mp4Name}`);
        }

        for (const url of patterns) {
            if (url === originalUrl) continue;
            if (await checkUrlExists(url)) {
                showToast("RECOVERED: " + url.split('/').pop());
                addAsset(url, thumb || (/\.(jpeg|jpg|png)$/i.test(originalUrl) ? originalUrl : ""));
                // Only add if verified
            }
        }
    }

    function deepScan(obj, cb) {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(k => {
            const v = obj[k];
            if (/(batchVideos|sensitiveInfo|asset|videoUrl|imageUrl|coverUrl|downloadURLWithoutWatermark)/i.test(k)) cb(obj, k, v);
            if (typeof v === 'object') deepScan(v, cb);
        });
    }

    // Auto-Mutation & Spoofing
    function cacheBenignBatch(batchVideos) {
        if (!Array.isArray(batchVideos) || !batchVideos.length) return;
        benignBatchRing.push(batchVideos);
        if (benignBatchRing.length > config.benignRingSize) benignBatchRing.shift();
    }

    function getBestBenignBatch() {
        for (let i = benignBatchRing.length - 1; i >= 0; i--) {
            if (benignBatchRing[i] && benignBatchRing[i].length) return benignBatchRing[i];
        }
        return null;
    }

    function autoMutateOnModeration(chunk, originalPrompt = "") {
        if (!config.autoMutateOnBlock) return null;
        const best = getBestBenignBatch();
        if (!best) return null;

        if (chunk && chunk.data === null && chunk.statusInfo && chunk.statusInfo.code !== 0) {
            showToast("Hailuo++: Moderation Bypass");
            let forged = Utils.safeClone(chunk); // Safe Clone
            let shuffled = [...best];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            forged.data = {
                batchVideos: shuffled.map(b => ({
                    ...b,
                    assets: b.assets ? b.assets.map(a => ({
                        ...a,
                        downloadURLWithoutWatermark: a.downloadURLWithoutWatermark || a.videoUrl || a.imageUrl || "",
                        status: "completed"
                    })) : []
                })),
                processing: false, hasMore: false
            };
            if (originalPrompt && forged.data.batchVideos?.[0]?.assets?.[0]) {
                forged.data.batchVideos[0].assets[0].desc = originalPrompt;
            }
            forged.statusInfo = { code: 0, message: "Success", requestID: chunk.statusInfo?.requestID || Date.now().toString() };
            return forged;
        }
        return null;
    }

    //────── 6. INTERCEPTION LAYER ──────//
    function parseBody(body) {
        if (body instanceof FormData) {
            const obj = {};
            for (const [key, value] of body.entries()) obj[key] = (value instanceof File) ? { fileName: value.name } : value;
            return obj;
        }
        if (typeof body === "string") { try { return JSON.parse(body); } catch (e) { return null; } }
        return null;
    }

    function processRequestBody(url, method, body) {
        let modBody = Utils.safeClone(body); // Safe Clone
        let modified = false;

        // Obfuscation
        if (config.nsfwObfuscation !== 'none' && method !== 'GET') {
             deepScan(modBody, (p, k, v) => {
                if (/sensitiveInfo/i.test(k)) { p[k] = {level:0, prompt:"", type:0}; modified = true; }
                if (/desc/i.test(k) && config.nsfwObfuscation === 'bracket' && typeof p[k] === 'string') {
                    const obf = bracketObfuscate(p[k]);
                    if (obf !== p[k]) { p[k] = obf; modified = true; }
                }
            });
        }
        return { modifiedBody: modBody, bodyWasModified: modified };
    }

    function modifyResponse(data, url) {
        if (!data || typeof data !== "object") return null;

        // Harvest
        deepScan(data, (p, k, v) => {
            if (/(downloadURLWithoutWatermark|videoUrl|imageUrl|assetUrl)/i.test(k) && typeof v === 'string') {
                if (!isJunkAsset(v)) verifyAndRecoverUrl(v, extractThumb(p));
            }
        });

        // Cache Benign
        if (data?.data?.batchVideos) cacheBenignBatch(data.data.batchVideos);
        if (data?.data?.mediaPath) savedMediaPath = data.data.mediaPath;

        // Mutation / Spoofing
        if (/\/processing\b/i.test(url)) {
            let chunkId = data.requestID || (data.data?.batchVideos?.[0]?.batchID) || Date.now();
            processingBuffer.push({ id: chunkId, ts: Date.now(), data });
            if (processingBuffer.length > 30) processingBuffer.shift();

            let prompt = data.prompt || data.desc || "";
            let autoForged = autoMutateOnModeration(data, prompt);
            if (autoForged) return autoForged;

            if (processingMutations[chunkId]) {
                showToast(`Mutation Injected: ${chunkId}`);
                return processingMutations[chunkId];
            }
        }

        // Echo Exploit
        if (data?.ErrCode && String(data.ErrCode).match(/400101|moderation|nsfw/i) && savedMediaPath) {
            showToast("Echo Exploit: Restoring");
            return Object.assign({}, data, { data: { mediaPath: savedMediaPath } });
        }

        return null;
    }

    function setupInterceptors() {
        // XHR Override
        const oOpen = XMLHttpRequest.prototype.open;
        const oSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(m, u) { this._url = u; this._method = m; return oOpen.apply(this, arguments); };
        XMLHttpRequest.prototype.send = function(body) {
            if(isJunkAsset(this._url)) return oSend.apply(this, [body]);

            const method = (this._method || "GET").toUpperCase();
            let finalBody = body;
            const parsed = parseBody(body);

            if (parsed) {
                const { modifiedBody, bodyWasModified } = processRequestBody(this._url, method, parsed);
                if (bodyWasModified) finalBody = JSON.stringify(modifiedBody);
            }

            this.addEventListener("load", () => {
                if (this.responseType === '' || this.responseType === 'text' || this.responseType === 'json') {
                    try {
                        let respData = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
                        const modified = modifyResponse(respData, this._url);
                        if (modified) {
                            try {
                                Object.defineProperties(this, {
                                    response: { value: modified },
                                    responseText: { value: JSON.stringify(modified) }
                                });
                            } catch(e) { console.warn("Hailuo++: XHR Modify Failed", e); }
                        }
                    } catch(e) {}
                }
            }, { once: true });

            return oSend.apply(this, [finalBody]);
        };
        // Tag XHR
        XMLHttpRequest.prototype.open._redCellAttached = true;

        // Fetch Override
        const origFetch = window.fetch;
        window.fetch = async (...args) => {
            let url = args[0] instanceof Request ? args[0].url : args[0];
            if (isJunkAsset(url)) return new Response("{}", {status: 200});

            let init = args[0] instanceof Request ? args[0] : args[1] || {};
            const method = (init.method || "GET").toUpperCase();

            if (init.body) {
                const parsed = parseBody(init.body);
                if (parsed) {
                    const { modifiedBody, bodyWasModified } = processRequestBody(url, method, parsed);
                    if (bodyWasModified) init = { ...init, body: JSON.stringify(modifiedBody) };
                }
            }

            const finalArgs = args[0] instanceof Request ? [new Request(args[0], init)] : [url, init];
            const res = await origFetch.apply(this, finalArgs);

            if (res.ok) {
                try {
                    const clone = res.clone();
                    const txt = await clone.text();
                    if (txt && txt.length < 2000000 && (txt.trim().startsWith('{') || txt.trim().startsWith('['))) {
                        const data = JSON.parse(txt);
                        const modResp = modifyResponse(data, url);
                        if (modResp) return new Response(JSON.stringify(modResp), { status: 200, headers: res.headers });
                    }
                } catch(e){}
            }
            return res;
        };
        // Tag Fetch
        window.fetch._redCellAttached = true;

        // Console Override
        const origLog = console.log;
        console.log = function(...args) {
            if (console.log._isHarvesting) return origLog.apply(this, args);
            console.log._isHarvesting = true;
            try {
                args.forEach(arg => {
                    if (typeof arg === 'string') {
                        if (!isJunkAsset(arg)) {
                            const m = arg.match(/https:\/\/cdn\.hailuoai\.video\/[^"\s\']+/g);
                            if (m) m.forEach(u => verifyAndRecoverUrl(u));
                        }
                    }
                });
            } catch(e){}
            console.log._isHarvesting = false;
            return origLog.apply(this, args);
        };
        console.log._redCellAttached = true;
    }

    //────── 7. DOM HARVESTER ──────//
    const DOMHarvester = {
        init: () => {
            // Debounce the mutation handler to prevent lag
            const debouncedScan = Utils.debounce(() => {
                document.querySelectorAll('img').forEach(DOMHarvester.scanImage);
            }, 1000);

            const observer = new MutationObserver(debouncedScan);
            observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

            // Initial scan
            setTimeout(() => document.querySelectorAll('img').forEach(DOMHarvester.scanImage), 1000);
        },
        scanImage: (img) => {
            if (!img.src) return;
            // RECURSION GUARD: Do not scan images inside the control panel
            if (img.closest('#rc-control-panel')) return;

            // Precise target based on test result
            const isTracking = img.classList.contains('tracking-image-ref') ||
                               img.alt === 'tracking-image-ref' ||
                               img.closest('.video-card-footer-bar');

            const isTargetDomain = img.src.includes('cdn.hailuoai.video');

            if (isTargetDomain && !isJunkAsset(img.src)) {
                if (isTracking) {
                    verifyAndRecoverUrl(img.src, img.src);
                }
            }
        }
    };

    //────── 8. UI & CONTROL PANEL ──────//
    async function updatePreviewPanel() {
        const body = document.getElementById('rc-session-preview-body'); if (!body) return;
        body.innerHTML = '';
        const items = await getSession();
        if (items.length === 0) { body.innerHTML = `<div class="rc-preview-empty">No assets.</div>`; return; }

        for (const it of items) {
            if (it.archived) continue;
            const row = document.createElement('div');
            row.className = 'rc-preview-row';
            const filename = it.filename || 'asset.bin';
            const statusColor = it.health === 'alive' ? '#0f0' : (it.health === 'dead' ? '#f06' : '#cc0');
            const typeInfo = it.isRaw ? '<span style="color:#0f0">[RAW]</span>' : '';

            row.innerHTML = `
                <div class="rc-preview-img-wrap"><img src="${it.thumb}" onerror="this.style.display='none'"></div>
                <div class="rc-preview-info">
                    <div class="rc-preview-url" style="color:${statusColor}">${filename} ${typeInfo}</div>
                    <div class="rc-preview-buttons">
                        <button class="open-btn">OPEN</button>
                        <button class="copy-btn">COPY</button>
                    </div>
                </div>`;

            row.querySelector('.open-btn').onclick = () => window.open(it.url, '_blank');
            row.querySelector('.copy-btn').onclick = async (e) => {
                await navigator.clipboard.writeText(it.url);
                e.target.textContent = 'OK';
                setTimeout(() => e.target.textContent = 'COPY', 1000);
            };
            body.appendChild(row);
        }
    }

    function createControlPanel() {
        if (document.getElementById('rc-control-panel')) return;

        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
            #rc-control-panel { position:fixed; top:20px; right:20px; width:360px; background:rgba(10,12,14,0.9); border:1px solid #00E5FF; border-radius:8px; z-index:999999; color:#fff; font-family:sans-serif; font-size:12px; backdrop-filter:blur(8px); box-shadow:0 0 15px rgba(0,229,255,0.2); }
            .rc-header { display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(0,229,255,0.1); border-bottom:1px solid rgba(0,229,255,0.2); cursor:grab; font-family:'Orbitron',sans-serif; color:#00E5FF; }
            .rc-content { padding:12px; display:none; }
            .rc-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
            .rc-row label { color:#aaa; }
            .rc-sep { border-top:1px solid rgba(255,255,255,0.1); margin:10px 0; }
            input, select { background:#000; color:#fff; border:1px solid #333; padding:4px; border-radius:4px; }
            button { background:rgba(0,229,255,0.1); border:1px solid #00E5FF; color:#00E5FF; padding:4px 8px; border-radius:4px; cursor:pointer; }
            button:hover { background:rgba(0,229,255,0.3); }
            #rc-session-preview-body { max-height:250px; overflow-y:auto; margin-top:10px; }
            .rc-preview-row { display:flex; gap:10px; margin-bottom:8px; background:rgba(255,255,255,0.05); padding:5px; border-radius:4px; }
            .rc-preview-img-wrap { width:60px; height:40px; background:#000; flex-shrink:0; }
            .rc-preview-img-wrap img { width:100%; height:100%; object-fit:cover; }
            .rc-preview-info { flex-grow:1; overflow:hidden; }
            .rc-preview-url { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; font-weight:bold; }
            .rc-preview-buttons { display:flex; gap:5px; }
            .rc-toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.9); border:1px solid #00E5FF; color:#00E5FF; padding:10px 20px; border-radius:20px; z-index:1000000; animation: fadeUp 0.3s; }
            @keyframes fadeUp { from {opacity:0; transform:translate(-50%, 20px)} to {opacity:1; transform:translate(-50%,0)} }
        `;

        SecurityContext.injectCSS(css, 'rc-styles');

        const panel = document.createElement('div');
        panel.id = 'rc-control-panel';
        panel.innerHTML = `
            <div class="rc-header">
                <span>Ψ Hailuo++ v20.0</span>
                <button id="rc-toggle">▼</button>
            </div>
            <div class="rc-content">
                <div class="rc-row">
                    <label>Debug Mode</label>
                    <input type="checkbox" id="rc-debug">
                </div>
                <div class="rc-row">
                    <label>Obfuscation</label>
                    <select id="rc-obf">
                        <option value="none">None</option>
                        <option value="bracket">Bracket</option>
                    </select>
                </div>
                 <div class="rc-row">
                    <label>Auto-Mutate</label>
                    <input type="checkbox" id="rc-mutate">
                </div>
                <div class="rc-sep"></div>
                <div class="rc-row">
                     <span style="color:#00E5FF;font-weight:bold">Asset Recovery</span>
                     <button id="rc-clear">CLEAR</button>
                     <button id="rc-export">EXPORT</button>
                     <button id="rc-dump">DUMP STATE</button>
                </div>
                <div id="rc-session-preview-body"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // Bindings
        const els = {
            toggle: panel.querySelector('#rc-toggle'),
            content: panel.querySelector('.rc-content'),
            debug: panel.querySelector('#rc-debug'),
            obf: panel.querySelector('#rc-obf'),
            mutate: panel.querySelector('#rc-mutate'),
            clear: panel.querySelector('#rc-clear'),
            export: panel.querySelector('#rc-export'),
            dump: panel.querySelector('#rc-dump')
        };

        els.toggle.onclick = () => {
            const isHidden = els.content.style.display === 'none';
            els.content.style.display = isHidden ? 'block' : 'none';
            els.toggle.textContent = isHidden ? '▲' : '▼';
        };

        els.debug.checked = config.debugMode;
        els.debug.onchange = () => { config.debugMode = els.debug.checked; GM_setValue('debugMode', config.debugMode); };

        els.obf.value = config.nsfwObfuscation;
        els.obf.onchange = () => { config.nsfwObfuscation = els.obf.value; GM_setValue('nsfwObfuscation', config.nsfwObfuscation); };

        els.mutate.checked = config.autoMutateOnBlock;
        els.mutate.onchange = () => { config.autoMutateOnBlock = els.mutate.checked; GM_setValue('autoMutateOnBlock', config.autoMutateOnBlock); };

        els.clear.onclick = async () => { if(confirm('Wipe?')) { await saveSession([]); updatePreviewPanelDebounced(); } };
        els.export.onclick = () => exportData();
        els.dump.onclick = () => dumpBrowserState();

        // Dragging
        let isDragging = false, startX, startY, initLeft, initTop;
        const header = panel.querySelector('.rc-header');
        header.onmousedown = (e) => {
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            initLeft = rect.left; initTop = rect.top;
            panel.style.right = 'auto';
        };
        document.onmousemove = (e) => {
            if (!isDragging) return;
            panel.style.left = (initLeft + (e.clientX - startX)) + 'px';
            panel.style.top = (initTop + (e.clientY - startY)) + 'px';
        };
        document.onmouseup = () => isDragging = false;

        updatePreviewPanelDebounced();
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'rc-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    //────── 9. EXPORT & DUMP ──────//
    async function exportData() {
        const data = await getSession();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `redcell_harvest_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        showToast('EXPORTED');
    }

    function dumpBrowserState() {
        const state = { localStorage: {}, sessionStorage: {}, cookies: document.cookie };
        try { for(let i=0; i<localStorage.length; i++) state.localStorage[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)); } catch(e){}
        try { for(let i=0; i<sessionStorage.length; i++) state.sessionStorage[sessionStorage.key(i)] = sessionStorage.getItem(sessionStorage.key(i)); } catch(e){}
        console.log('[Hailuo++] Browser State:', state);
        showToast('STATE DUMPED TO CONSOLE');
    }

    //────── 10. BOOTSTRAP ──────//
    async function init() {
        if (isInitialized) return;

        for (const k of Object.keys(config)) {
            const v = await GM_getValue(k, undefined);
            if (v !== undefined) config[k] = v;
        }

        setupInterceptors();

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                SecurityContext.init();
                Defense.engage();
                createControlPanel();
                DOMHarvester.init();
            });
        } else {
            SecurityContext.init();
            Defense.engage();
            createControlPanel();
            DOMHarvester.init();
        }

        // Pulse check
        setInterval(() => {
            Defense.engage();
            // PATCH: Correctly check if fetch has been overwritten without our tag
            if (!window.fetch._redCellAttached) setupInterceptors();
        }, 5000);

        isInitialized = true;
        log('RedCell v20.0 Active');
        showToast('Hailuo++ v20.0 Active');
    }

    // Active Defense Wrapper
    const Defense = {
        kill: (doc) => {
            if (!doc) return;
            try {
                doc.querySelectorAll('meta[http-equiv="content-security-policy"]').forEach(m => m.remove());
            } catch(e){}
        },
        engage: () => {
            Defense.kill(document);
            document.querySelectorAll('iframe').forEach(i => { try { Defense.kill(i.contentDocument); } catch(e){} });
        }
    };

    init();

})();
