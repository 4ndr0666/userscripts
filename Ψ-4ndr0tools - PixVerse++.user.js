// ==UserScript==
// @name             Ψ-4ndr0tools - PixVerse++
// @namespace    https://github.com/4ndr0666/userscripts
// @author            4ndr0666
// @version           4.1.0
// @description     For educational security research. Merged stable base with advanced UI and obfuscation.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/%CE%A8-4ndr0tools%20-%20PixVerse++.user.js
// @updateURL     https://github.com/4ndr0666/userscripts/raw/refs/heads/main/%CE%A8-4ndr0tools%20-%20PixVerse++.user.js
// @icon                https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match             https://app.pixverse.ai/*
// @run-at              document-start
// @grant               GM_setValue
// @grant               GM_getValue
// @license            MIT
// ==/UserScript==

(() => {
  "use strict";

  if (window._pixverseToolkitInitialized) return;
  window._pixverseToolkitInitialized = true;

  const DEBUG_PREFIX = '[Ψ-4ndr0tools]';
  const DATA_LOG_PREFIX = '[Ψ-4ndr0tools DATA]';
  let savedMediaPath = null;
  let isInitialized = false;

  let myCustomXhrOpen = null;
  let myCustomFetch = null;

  const config = {
    debugMode: false,
    creditBypassType: 'none',
    creditSpoofValue: 999999,
    forceQuality: '1080p',
    nsfwObfuscation: 'zwsp',
    domTamperTarget: 'span.text-text-credit',
    urlReconstructionPatterns: [
      'pixverse/mp4/media/web/customer/{FILENAME}',
      'customer/{FILENAME}',
      'pixverse/mp4/media/customer/{FILENAME}',
      'pixverse-prod-prod/{FILENAME}',
      'pixverse/mp4/media/web/{FILENAME}',
    ]
  };

  const ENCRYPTED_TRIGGERS = "Lyo/Pys1Ljk4Kz0sOzcrKS87MCoqLCo7PComLCoqOy8qLy09KzgqLCoqPTIsKSo9KywqMyssMioqLzItLi8sPD8sKj8qPTotLCsvLio5KSwqOzcrKS89MioqPTMsKCs/Myw/LDotPDMsKz0sOzIsKzotKisrOzUqOzEqLCo9KSwqLjssKy8uLCoqOyopPTcrKSw9LDsvKj0tLSwrLzEsMys5KzcrKSwrPistPTIsKy8xLDMsOSs3KyksKz4rLT0yLCsvLCoqPSwrLzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCorLCssPSwqLCoqPSwsKzIsMioqPTsrLCs5KzcrKSwsPyo9LDsvKywqOzUqPTosKywrPTIsKyo9KywsKzIsMioqPTsrLCsrMyw/LDotPDMsKz0sOzIsKywqMywqPTsrLCs5LCs9LCoqLzItLioqPTEsKzMsOSs3KyksKz0sOzIsKywqOzUqPTosKywqPTcrKSwqPistPTIsKyo9KywqMyssMioqPTsrLCs9LCorLCssKzUsKy8qPSwsKzIsMioqPTsrLD8qPT0sKy8qPSosKz0sOzIsKywqOzUqPTosKyw/LDotPDMsKy8qPSosKy8qPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCs/Kj0sKywqLzItLi8sPyoqPTcrKSwqOzUqPTosKywrPTIsKyo9KywqMyssMioqPTsrLCsrMyw/LDotPDMsKz0sOzIsKzcrKSwrPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCsvLCoqPTssKy8xLCorLCssKyo9KywsKzIsMioqPTsrLCsrMyw/LDotPDMsKz0sOzIsKzUsKy8qPSwsKzIsMioqPTsrLD8qPT0sKy8qPSosKy8qPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCorLCssPSwqLzItLioqPTIsKy8xLDMsOSs3KyksKz0sOzIsKyo9KywqMyssMioqLzItLi8sPD8sKj8qPTotLCsvLio5KSwqOzcrKSwsKz0sOzIsKywqPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCs/Kj0sKywqLzItLioqPTEsKzMsOSs3KyksKz0sOzIsKywqMywqPTsrLCs5LCs9LCoqLzItLioqPTEsKzMsOSs3KyksKz0sOzIsKyw/LDotPDMsKy8qPSosKy8qPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCorLCssPSwqLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCsvLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCs/Kj0sKywqLzItLioqPTMsKCs/Myw/LDotPDMsKz0sOzIsKywqMywqPTsrLDcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCsvLCoqPTssKy8xLCorLCssKyo9KywsKzIsMioqPTsrLCsrMyw/LDotPDMsKy8qPSosKy8qPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLCs/Kj0sKywqLzItLioqPTMsKCs/Myw/LDotPDMsKy8qPSosKzcrKSwrPistPTIsKy8xLCorLCssPSwqLCoqPTIsKy8xLDMsOSs3KyksKz0sOzIsKyo9KywqMywqPTsrLDcrKSwrPTIsKzEsMys5KzcrKSwrPTIsKzEsMys5KzcrKSwrPistPTIsKy8xLCoqPTIsKy8xLDMsOSs3KyksKz4rLT0yLA==";
  const DECRYPTION_KEY = "ChimeraKey2024";

  function xorDecrypt(base64Input, key) {
    try {
      const encrypted = atob(base64Input);
      let result = '';
      for (let i = 0; i < encrypted.length; i++) {
        result += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (e) {
      error("Decryption failed.", e);
      return "";
    }
  }

  const TRIGGER_WORDS = xorDecrypt(ENCRYPTED_TRIGGERS, DECRYPTION_KEY).split(',');
  const NSFW_PROMPT_REGEX = new RegExp(`\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`, "gi");

  const API_ENDPOINTS = {
    credits: /\/user\/credits(?:\?|$)/,
    videoList: /\/video\/list\/personal/,
    batchUpload: /\/media\/batch_upload_media/,
    singleUpload: /\/media\/upload/,
    creativeVideo: /\/creative_platform\/video\/(?:i2v|create)/,
    creativePrompt: /\/creative_platform\/video\//,
    creativeExtend: /\/creative_platform\/video\/extend/
  };

  const _redTeamDebugLog = [];
  const _redTeamGoods = [];

  Object.defineProperties(window, {
    redTeamDebugLog: { get: () => _redTeamDebugLog },
    redTeamGoods: { get: () => _redTeamGoods },
    redTeamClear: { value: () => {
      _redTeamDebugLog.length = 0; _redTeamGoods.length = 0;
      log('Debug logs cleared.');
      if (config.debugMode) updateDebugUI();
    }}
  });

  //────── CORE HELPERS ──────//
  function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function matchesEndpoint(url, key) { return API_ENDPOINTS[key]?.test(url); }
  function log(...args) { if (config.debugMode) console.log(DEBUG_PREFIX, ...args); }
  function error(...args) { if (config.debugMode) console.error(DEBUG_PREFIX, ...args); }
  function safeDeepClone(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    try { if (typeof structuredClone === 'function') return structuredClone(obj); } catch (e) { /* fallback */ }
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { error("Deep clone failed.", e); return null; }
  }
  function writeToLogFile(message, data = null) {
    if (!config.debugMode) return;
    const timestamp = new Date().toISOString();
    _redTeamDebugLog.push(`${timestamp} ${message}`);
    console.log(`${DATA_LOG_PREFIX} ${message}`, data || '');
    if (data) {
      const clonedData = safeDeepClone(data);
      if (clonedData) _redTeamGoods.push({ timestamp, message, data: clonedData, type: 'custom_log' });
    }
    updateDebugUI();
  }
  function logApiResponse(url, data, type) {
    if (!config.debugMode) return;
    const clonedData = safeDeepClone(data);
    if (clonedData) _redTeamGoods.push({ timestamp: new Date().toISOString(), url, type, data: clonedData });
    writeToLogFile(`API ${type.toUpperCase()} for ${url}`, data);
  }
  function dumpBrowserState(context = "UNKNOWN") {
    if (!config.debugMode) return;
    const state = { localStorage: {}, sessionStorage: {}, cookies: document.cookie };
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); state.localStorage[k] = localStorage.getItem(k); } } catch (e) { error("LS access error:", e); }
    try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); state.sessionStorage[k] = sessionStorage.getItem(k); } } catch (e) { error("SS access error:", e); }
    _redTeamGoods.push({ timestamp: new Date().toISOString(), type: 'browser_state', context, data: state });
    writeToLogFile(`Browser State Snapshot (${context})`, state);
  }
  window.analyzeCredits = function() {
    if (!config.debugMode) return;
    writeToLogFile("Initiating credit-related data analysis...");
    const creditKeywords = ["credit", "balance", "coin", "token", "limit", "cost", "price", "usage"];
    const potentialKeys = new Set();
    _redTeamGoods.forEach(entry => {
      if (!entry.type.startsWith('response') && !entry.type.startsWith('request')) return;
      const search = (obj, path = '') => {
        if (typeof obj !== 'object' || obj === null) return;
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (creditKeywords.some(kw => key.toLowerCase().includes(kw))) potentialKeys.add(`Key: ${currentPath} (URL: ${entry.url})`);
          if (typeof value === 'object') search(value, currentPath);
        });
      };
      search(entry.data);
    });
    writeToLogFile(potentialKeys.size > 0 ? "Potential credit-related keys found:" : "No obvious credit-related keys found.", { keys: [...potentialKeys] });
  };
  function parseBody(body) {
    if (body instanceof FormData) {
        const obj = {};
        for (const [key, value] of body.entries()) {
            obj[key] = (value instanceof File) ? { fileName: value.name, fileSize: value.size, fileType: value.type } : value;
        }
        return obj;
    }
    if (typeof body === "string") { try { return JSON.parse(body); } catch (e) { return null; } }
    if (body instanceof URLSearchParams) { return Object.fromEntries(body.entries()); }
    return null;
  }
  function obfuscatePrompt(prompt) {
    if (config.nsfwObfuscation === 'none' || TRIGGER_WORDS.length === 0) return prompt;
    if (config.nsfwObfuscation === 'zwsp') return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
    if (config.nsfwObfuscation === 'bubble_zwsp') return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').map(c=>(c=c.toLowerCase().charCodeAt(0))>=97&&c<=122?String.fromCodePoint(9398+c-97):String.fromCharCode(c)).join('\u200B'));
    return prompt;
  }

  async function verifyAndRecoverUrl(videoInfo) {
    if (!videoInfo || !videoInfo.video_path) return;
    const originalUrl = `https://media.pixverse.ai/${videoInfo.video_path}`;
    const thumbnailUrl = videoInfo.customer_paths?.customer_img_url || '';
    try { if ((await fetch(originalUrl, { method: 'HEAD' })).ok) return addSessionEntry(originalUrl, thumbnailUrl); } catch (e) { /* continue */ }
    log(`Bogus URL detected: ${originalUrl}. Attempting reconstruction...`); showToast('Bogus URL detected. Recovering...');
    const filename = originalUrl.split('/').pop();
    for (const pattern of config.urlReconstructionPatterns) {
      if (!pattern.trim()) continue;
      const candidateUrl = `https://media.pixverse.ai/${pattern.replace('{FILENAME}', filename)}`;
      try {
        if ((await fetch(candidateUrl, { method: 'HEAD' })).ok) {
          log('SUCCESS! Found valid URL:', candidateUrl); showToast('✅ Recovery successful!'); return addSessionEntry(candidateUrl, thumbnailUrl);
        }
      } catch (e) { /* Ignore */ }
    }
    error('URL reconstruction failed.'); showToast('❌ Recovery failed.'); addSessionEntry(originalUrl, thumbnailUrl);
  }
  function spoofCreditsResponse(data) {
    if (config.creditBypassType === 'spoof_response' && data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data); clone.Resp.credits = config.creditSpoofValue; return clone;
    }
    return null;
  }
  function modifyVideoList(data) {
    if (!data?.Resp?.data) return data;
    const clone = structuredClone(data);
    clone.Resp.data.forEach(item => {
      if (item.video_status === 7) item.video_status = 1;
      const url = item.video_path ? `https://media.pixverse.ai/${item.video_path}` : '';
      if (url) {
        const preview = (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url) || item.customer_paths?.customer_img_url || '';
        addSessionEntry(url, preview);
      }
    });
    return clone;
  }
  function modifyResponse(data, url) {
    if (!data || typeof data !== "object") return null;
    let modified = null;
    if (matchesEndpoint(url, "credits")) {
        modified = spoofCreditsResponse(data);
    } else if (matchesEndpoint(url, "videoList")) {
        modified = modifyVideoList(data);
    }
    if (matchesEndpoint(url, "creativeVideo") && data?.ErrCode === 0 && data?.Resp?.data?.[0]?.video_path) {
        verifyAndRecoverUrl(data.Resp.data[0]);
    }
    // CRITICAL: Spoof success on upload moderation failure.
    if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && data?.ErrCode !== 0 && savedMediaPath) {
      log(`Upload blocked (ErrCode: ${data.ErrCode}). Spoofing success with saved path: ${savedMediaPath}`);
      const name = savedMediaPath.split('/').pop() || 'uploaded_media.mp4';
      if (matchesEndpoint(url, "batchUpload")) {
        modified = { ErrCode: 0, ErrMsg: "success", Resp: { result: [{ id: Date.now(), category: 0, err_msg: "", name, path: savedMediaPath, size: 0, url: `https://media.pixverse.ai/${savedMediaPath}` }] } };
      } else {
        modified = { ErrCode: 0, ErrMsg: "success", Resp: { path: savedMediaPath, url: `https://media.pixverse.ai/${savedMediaPath}`, name, type: 1 } };
      }
    }
    return modified;
  }

  function processRequestBodyModifications(url, method, body) {
    let modBody = safeDeepClone(body), modified = false;
    if (config.forceQuality !== 'none' && matchesEndpoint(url, "creativeVideo") && method === "POST" && modBody.quality !== config.forceQuality) { modBody.quality = config.forceQuality; modified = true; }
    if (config.creditBypassType === 'prevent_deduct' && matchesEndpoint(url, "creativeExtend") && method === "POST" && modBody.duration !== 0) { modBody.duration = 0; modified = true; }
    if (config.nsfwObfuscation !== 'none' && matchesEndpoint(url, "creativePrompt") && method === "POST" && modBody.prompt) {
      const obfPrompt = obfuscatePrompt(modBody.prompt);
      if (modBody.prompt !== obfPrompt) { modBody.prompt = obfPrompt; modified = true; }
    }
    return { modifiedBody: modBody, bodyWasModified: modified };
  }
  function reconstructFormData(obj) {
      const formData = new FormData();
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              formData.append(key, obj[key]);
          }
      }
      return formData;
  }
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m, u) { this._url = u; this._method = m; return oOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || ""; const method = (this._method || "GET").toUpperCase();
      let processedBody = body; let originalBodyParsed;
      if (body && (originalBodyParsed = parseBody(body))) {
        logApiResponse(url, originalBodyParsed, 'request_original');
        const { modifiedBody, bodyWasModified } = processRequestBodyModifications(url, method, originalBodyParsed);
        if (bodyWasModified) {
          processedBody = (body instanceof FormData) ? reconstructFormData(modifiedBody) : JSON.stringify(modifiedBody);
          logApiResponse(url, modifiedBody, 'request_modified');
        }
      }
       if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
          const p = originalBodyParsed.path;
          if (p) savedMediaPath = p;
      }
      this.addEventListener("load", () => {
        let respData; try { respData = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}"); } catch (e) { return; }
        if (this.status >= 200 && this.status < 300) {
          logApiResponse(url, respData, 'response_original');
          const modifiedResponse = modifyResponse(respData, url);
          if (modifiedResponse) {
            Object.defineProperties(this, { response: { value: modifiedResponse }, responseText: { value: JSON.stringify(modifiedResponse) } });
            logApiResponse(url, modifiedResponse, 'response_modified');
          }
        }
      }, { once: true });
      return oSend.apply(this, [processedBody]);
    };
    myCustomXhrOpen = XMLHttpRequest.prototype.open; log('XHR override initialized');
  }
  function overrideFetch() {
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      let url = args[0] instanceof Request ? args[0].url : args[0]; let init = args[0] instanceof Request ? args[0] : args[1] || {};
      const method = (init.method || "GET").toUpperCase(); let originalBodyParsed;
      if (init.body && (originalBodyParsed = await parseBody(init.body))) {
        logApiResponse(url, originalBodyParsed, 'request_original');
        const { modifiedBody, bodyWasModified } = processRequestBodyModifications(url, method, originalBodyParsed);
        if (bodyWasModified) {
            if (init.body instanceof FormData) { init = { ...init, body: reconstructFormData(modifiedBody) };
            } else { init = { ...init, body: JSON.stringify(modifiedBody) }; }
            logApiResponse(url, modifiedBody, 'request_modified');
        }
      }
       if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
          const p = originalBodyParsed.path;
          if (p) savedMediaPath = p;
      }
      const finalArgs = args[0] instanceof Request ? [new Request(args[0], init)] : [url, init];
      const res = await origFetch.apply(this, finalArgs);
      if (res.ok) {
        const clone = res.clone(); let respData; try { respData = await clone.json(); } catch (e) { return res; }
        logApiResponse(url, respData, 'response_original');
        const modResp = modifyResponse(respData, url);
        if (modResp) { logApiResponse(url, modResp, 'response_modified'); return new Response(JSON.stringify(modResp), res); }
      }
      return res;
    };
    myCustomFetch = window.fetch; log('Fetch override initialized');
  }

  const SESSION_KEY = 'pixverse_generated_videos_session';
  const MAX_SESSION_ITEMS = 50;
  async function downloadUrl(url, filename) {
    try { const r = await fetch(url); const b = await r.blob(); const u = URL.createObjectURL(b); const a = Object.assign(document.createElement('a'), { href: u, download: filename }); a.click(); URL.revokeObjectURL(u); } catch (e) { error('Download failed:', e); }
  }
  function loadSession() { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); } catch (e) { return []; } }
  function saveSession(arr) { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(arr || [])); } catch (e) { error('Session save failed:', e); } }
  function addSessionEntry(url, thumb) {
    try {
      if (!url) return;
      const nThumb = thumb ? (thumb.startsWith('http') ? thumb : `https://media.pixverse.ai/${thumb}`) : '';
      let arr = loadSession();
      if (!arr.some(i => i.url === url)) { arr.unshift({ url, thumb: nThumb, ts: Date.now() }); }
      if (arr.length > MAX_SESSION_ITEMS) arr = arr.slice(0, MAX_SESSION_ITEMS);
      saveSession(arr);
      updatePreviewPanel();
    } catch (e) { error('addSessionEntry error:', e); }
  }
  function updatePreviewPanel() {
    const body = document.getElementById('pv-session-preview-body'); if (!body) return;
    body.innerHTML = '';
    const items = loadSession();
    if (items.length === 0) { body.innerHTML = `<div class="pv-preview-empty">No assets captured this session.</div>`; return; }
    for (const it of items) {
      const row = document.createElement('div');
      row.className = 'pv-preview-row';
      const filename = it.url.split('/').pop().split('?')[0] || `video.mp4`;
      row.innerHTML = `<div class="pv-preview-img-wrap"><img src="${it.thumb||''}" alt="p"></div><div class="pv-preview-info"><div class="pv-preview-url">${filename}</div><div class="pv-preview-buttons"><button>Open</button><button>DL</button><button>Copy</button></div></div>`;
      const buttons = row.querySelectorAll('button');
      buttons[0].onclick = () => window.open(it.url, '_blank');
      buttons[1].onclick = () => downloadUrl(it.url, filename);
      buttons[2].onclick = async e => { await navigator.clipboard.writeText(it.url); e.target.textContent = 'OK'; setTimeout(() => e.target.textContent = 'Copy', 1200); };
      body.appendChild(row);
    }
  }

  function throttle(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), delay); }; }
  function overrideContextMenuBlockers() { EventTarget.prototype.addEventListener = new Proxy(EventTarget.prototype.addEventListener, { apply: (t, a, r) => (r[0] === 'contextmenu') ? null : Reflect.apply(t, a, r) }); }
  let domTamperObserver = null;
  function setupDOMTampering() {
    if (domTamperObserver) domTamperObserver.disconnect();
    if (config.creditBypassType === 'dom_tamper' && config.domTamperTarget) {
      const cb = () => document.querySelectorAll(config.domTamperTarget).forEach(el => el.textContent = config.creditSpoofValue.toString());
      domTamperObserver = new MutationObserver(cb);
      domTamperObserver.observe(document.body, { childList: true, subtree: true }); cb();
    }
  }
  function showToast(msg, dur = 3500) {
    if (!config.debugMode) return;
    document.querySelectorAll(".pv-toast").forEach(e => e.remove());
    const el = Object.assign(document.createElement("div"), { className: "pv-toast", textContent: msg });
    document.body.appendChild(el); requestAnimationFrame(() => el.classList.add("pv-toast-visible"));
    setTimeout(() => { el.classList.remove("pv-toast-visible"); el.addEventListener("transitionend", () => el.remove(), { once: true }); }, dur);
  }
  function setupSelfHealingHooks() { setInterval(() => { if (myCustomXhrOpen && XMLHttpRequest.prototype.open !== myCustomXhrOpen) { log('XHR re-hooked'); overrideXHR(); } if (myCustomFetch && window.fetch !== myCustomFetch) { log('Fetch re-hooked'); overrideFetch(); } }, 5000); }
  function applyCosmeticFilters() {
    const styleId = "pk-cosmetic-filters";
    if (document.getElementById(styleId)) return;
    const rules = `div[id*="banner"], div[class*="banner"], div[data-testid*="promo"], a[href*="/ads/"], a[href*="?ad="] { display: none !important; }`;
    document.head.insertAdjacentHTML('beforeend', `<style id="${styleId}">${rules}</style>`);
  }

  async function loadConfig() { for (const key in config) if(key !== 'c2Enabled' && key !== 'c2Server' && key !== 'autoExfilAuth') config[key] = await GM_getValue(key, config[key]); }
  function updateDebugUIVisibility() {
    const p = document.getElementById('pv-debug-panel'); if (p) p.style.display = config.debugMode ? 'flex' : 'none';
    if (config.debugMode && !p) injectDebugUI();
  }
  async function createControlPanel() {
    if (document.getElementById('pv-control-panel')) return;
    const panel = document.createElement('div'); panel.id = 'pv-control-panel';
    panel.innerHTML = `<div class="pv-panel-header"><span>Ψ-4ndr0tools v${GM_info.script.version}</span><button id="pv-panel-toggle">+</button></div><div class="pv-panel-content" style="display:none;"><div class="pv-panel-row"><label>Debug Mode</label><input type="checkbox" id="pv-debug-mode"></div><hr class="pv-separator"><div class="pv-panel-row"><label>Credit Bypass</label><span class="pv-placeholder-text">Working on it.</span></div><hr class="pv-separator"><div class="pv-panel-row"><label>Force Quality</label><select id="pv-force-quality"><option value="none">None</option><option value="720p">720p</option><option value="1080p">1080p</option></select></div><div class="pv-panel-row"><label>NSFW Obfus.</label><select id="pv-nsfw-obfuscation"><option value="none">None</option><option value="zwsp">ZWSP</option><option value="bubble_zwsp">Bubble</option></select></div><hr class="pv-separator"><div class="pv-panel-column"><label>Recovery Patterns</label><textarea id="pv-recovery-patterns" rows="4"></textarea></div><hr class="pv-separator"><div class="pv-panel-column"><div class="pv-preview-header"><span>Assets</span><button id="pv-clear-session">Clear</button></div><div id="pv-session-preview-body"></div></div></div>`;
    document.body.appendChild(panel);
    const UIE = { d: panel.querySelector('#pv-debug-mode'), q: panel.querySelector('#pv-force-quality'), n: panel.querySelector('#pv-nsfw-obfuscation'), r: panel.querySelector('#pv-recovery-patterns'), l: panel.querySelector('#pv-clear-session') };
    UIE.d.checked = config.debugMode; UIE.q.value = config.forceQuality; UIE.n.value = config.nsfwObfuscation; UIE.r.value = config.urlReconstructionPatterns.join('\n');
    UIE.d.onchange = async () => { config.debugMode = UIE.d.checked; await GM_setValue('debugMode', config.debugMode); updateDebugUIVisibility(); };
    UIE.q.onchange = async () => { config.forceQuality = UIE.q.value; await GM_setValue('forceQuality', config.forceQuality); };
    UIE.n.onchange = async () => { config.nsfwObfuscation = UIE.n.value; await GM_setValue('nsfwObfuscation', config.nsfwObfuscation); };
    UIE.r.oninput = async () => { config.urlReconstructionPatterns = UIE.r.value.split('\n').map(p => p.trim()); await GM_setValue('urlReconstructionPatterns', config.urlReconstructionPatterns); };
    UIE.l.onclick = () => { if (confirm('Clear assets?')) { saveSession([]); updatePreviewPanel(); } };
    panel.querySelector('#pv-panel-toggle').onclick = (e) => { const c = panel.querySelector('.pv-panel-content'); c.style.display = c.style.display === 'none' ? 'block' : 'none'; e.target.textContent = c.style.display === 'none' ? '+' : '−'; };
    let drag = false, oX, oY; const h = panel.querySelector('.pv-panel-header'); const pos = await GM_getValue('panelPos', { t: '10px', l: null, r: '10px' }); panel.style.top = pos.t; panel.style.left = pos.l; panel.style.right = pos.r;
    h.onmousedown = (e) => { drag = true; oX = e.clientX - panel.getBoundingClientRect().left; oY = e.clientY - panel.getBoundingClientRect().top; panel.style.right = 'auto'; e.preventDefault(); };
    document.onmousemove = (e) => { if (drag) { panel.style.left = `${e.clientX - oX}px`; panel.style.top = `${e.clientY - oY}px`; } };
    document.onmouseup = () => { if (drag) { drag = false; GM_setValue('panelPos', { t: panel.style.top, l: panel.style.left, r: 'auto' }); } };
    updatePreviewPanel();
  }
  function injectCoreStyles() {
    if (document.getElementById("pk-core-styles")) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="pk-core-styles">
      @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&display=swap');
      .pv-toast { position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%); background: rgba(20,40,48,0.94); color: #15FFFF; padding: 8px 20px; border-radius: 6px; z-index: 299999; opacity: 0; transition: opacity .25s; pointer-events: none; font-family: sans-serif; }
      .pv-toast-visible { opacity: 1; }
      #pv-control-panel, #pv-debug-panel { position: fixed; background: rgba(10, 12, 14, 0.8); color: #e0e0e0; border: 1px solid rgba(0, 255, 255, 0.2); border-radius: 8px; box-shadow: 0 0 20px rgba(0, 255, 255, 0.15); user-select: none; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
      #pv-control-panel { top: 10px; right: 10px; z-index: 300000; min-width: 340px; font-family: 'Cinzel Decorative', cursive; font-size: 14px; }
      #pv-control-panel input, #pv-control-panel select, #pv-control-panel textarea, .pv-preview-buttons button, #pv-clear-session, .pv-placeholder-text { font-family: sans-serif; }
      .pv-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(0, 255, 255, 0.2); cursor: grab; }
      .pv-panel-header span { font-weight: 700; color: #00FFFF; text-shadow: 0 0 8px rgba(0, 255, 255, 0.7); }
      #pv-panel-toggle { background: transparent; color: #00FFFF; border: none; font-size: 24px; cursor: pointer; line-height: 1; }
      .pv-panel-content { padding: 12px; }
      .pv-panel-row, .pv-panel-column { margin-bottom: 10px; } .pv-panel-row { display: flex; align-items: center; justify-content: space-between; } .pv-panel-column { display: flex; flex-direction: column; gap: 5px; }
      label { cursor: help; }
      .pv-placeholder-text { color: #888; font-style: italic; font-size: 12px; text-align: right; flex-grow: 1; }
      input, select, textarea { background: rgba(0,0,0,0.5); color: #e0e0e0; border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 4px; padding: 5px 8px; font-size: 12px; }
      .pv-separator { border: 0; border-top: 1px solid rgba(0, 255, 255, 0.2); margin: 12px 0; }
      .pv-preview-header { display: flex; justify-content: space-between; align-items: center; font-weight: 700; margin-bottom: 5px; color: #00FFFF; }
      #pv-clear-session { background: transparent; color: #ff9aa2; border: none; cursor: pointer; font-weight: bold; }
      #pv-session-preview-body { max-height: 200px; overflow-y: auto; padding-right: 5px; }
      .pv-preview-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
      .pv-preview-img-wrap { min-width: 100px; width: 100px; height: 67px; border-radius: 4px; overflow: hidden; background: #111; border: 1px solid rgba(0, 255, 255, 0.1); }
      .pv-preview-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
      .pv-preview-info { flex-grow: 1; font-family: sans-serif; }
      .pv-preview-url { font-size: 11px; opacity: 0.8; word-break: break-all; margin-bottom: 4px; }
      .pv-preview-buttons { display: flex; gap: 4px; }
      .pv-preview-buttons button { background: rgba(0, 255, 255, 0.1); color: #00FFFF; border: 1px solid rgba(0, 255, 255, 0.4); text-shadow: 0 0 3px rgba(0, 255, 255, 0.5); padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; transition: background-color 0.2s; }
      .pv-preview-buttons button:hover { background: rgba(0, 255, 255, 0.2); }
      .pv-preview-empty { font-family: sans-serif; font-size: 12px; text-align: center; opacity: 0.6; padding: 10px; }
    </style>`);
  }
  function injectDebugUI() {
    if (document.getElementById('pv-debug-panel')) return;
    document.head.insertAdjacentHTML('beforeend', `<style>
      #pv-debug-panel { top: 10px; left: 10px; width: 400px; max-height: 60vh; z-index: 299999; font-size: 11px; display: flex; flex-direction: column; font-family: 'Consolas', monospace; }
      #pv-debug-panel .header { padding: 5px 10px; }
      #pv-debug-panel button { background: rgba(0, 255, 255, 0.1); color: #00FFFF; border: 1px solid rgba(0, 255, 255, 0.3); padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; margin-left: 5px; }
      #pv-debug-panel .body { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; padding: 8px; }
      #pv-debug-panel .controls { padding-bottom: 8px; display: flex; flex-wrap: wrap; gap: 5px; border-bottom: 1px dashed rgba(0, 255, 255, 0.2); }
      #pv-debug-panel .section-area { flex: 1; padding: 5px 0; display: flex; flex-direction: column; min-height: 50px; }
      #pv-debug-panel h4 { margin: 5px 0; color: #00FFFF; font-size: 12px; }
      #pv-debug-panel .log-output { flex-grow: 1; background: rgba(0,0,0,0.4); border: 1px solid rgba(0, 255, 255, 0.1); padding: 5px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
    </style>`);
    const p = Object.assign(document.createElement('div'), { id: 'pv-debug-panel', innerHTML: `<div class="pv-panel-header header"><span>Ψ Debug</span></div><div class="body"><div class="controls"><button id="pv-clear-logs">Clear</button><button id="pv-dump-state">Dump</button><button id="pv-analyze-credits">Analyze</button></div><div class="section-area"><h4 class="pv-debug-log-count">Raw Log (0)</h4><div class="log-output" id="pv-debug-log-output"></div></div><div class="section-area"><h4 class="pv-goods-count">Data (0)</h4><div class="log-output" id="pv-goods-output"></div></div></div>`});
    document.body.appendChild(p);
    p.querySelector('#pv-clear-logs').onclick = window.redTeamClear; p.querySelector('#pv-dump-state').onclick = () => dumpBrowserState("Manual"); p.querySelector('#pv-analyze-credits').onclick = window.analyzeCredits;
    let drag=false,oX,oY; const h = p.querySelector('.header'); h.onmousedown=(e)=>{drag=true;oX=e.clientX-p.getBoundingClientRect().left;oY=e.clientY-p.getBoundingClientRect().top;e.preventDefault();}; document.onmousemove=(e)=>{if(drag){p.style.left=`${e.clientX-oX}px`;p.style.top=`${e.clientY-oY}px`;}}; document.onmouseup=()=>drag=false; updateDebugUI();
  }
  const updateDebugUI = throttle(() => {
    if (!config.debugMode) return;
    const l = document.getElementById('pv-debug-log-output'), g = document.getElementById('pv-goods-output'); if (!l || !g) return;
    l.innerHTML = _redTeamDebugLog.map(e => `<div>${e}</div>`).join('');
    g.innerHTML = _redTeamGoods.map(e => `<div><pre>${JSON.stringify(e, null, 2)}</pre></div>`).join('');
    document.querySelector('.pv-debug-log-count').textContent = `Raw Log (${_redTeamDebugLog.length})`;
    document.querySelector('.pv-goods-count').textContent = `Data (${_redTeamGoods.length})`;
    l.scrollTop = l.scrollHeight; g.scrollTop = g.scrollHeight;
  }, 250);

  //────── INITIALIZATION & LIFECYCLE ──────//
  async function initialize() {
    if (isInitialized) return;
    try {
      await loadConfig();
      injectCoreStyles();
      applyCosmeticFilters();
      await createControlPanel();
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupSelfHealingHooks();
      setupDOMTampering();
      dumpBrowserState("Init");
      updateDebugUIVisibility();
      isInitialized = true;
      log(`Ψ-4ndr0tools v${GM_info.script.version} initialized.`);
    } catch (e) { error('Initialization failed:', e); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

})();
