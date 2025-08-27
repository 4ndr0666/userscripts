// ==UserScript==
// @name        4ndr0tools - Redteam Recon
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0.2
// @description Standalone Debugging Tool: Captures browser state and all API requests/responses (XHR/Fetch) without modification. Includes debug UI and credit analysis. For diagnostic use only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20RedteamRecon.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20RedteamRecon.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.*.*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  "use strict";

  // Prevent multiple initializations of the script if it somehow gets loaded more than once.
  if (window._pixverseDebuggerInitialized) {
    return;
  }
  window._pixverseDebuggerInitialized = true;

  //────── CONSTANTS & CONFIG ──────//

  // DEBUG_MODE is always true for the standalone debugger.
  const DEBUG_MODE = true;

  const DEBUG_PREFIX = '[Pixverse++ Debugger]';
  const DATA_LOG_PREFIX = '[Pixverse++ Debugger DATA]'; // For structured data logs in debug mode
  let isInitialized = false; // Flag to ensure core overrides are run only once

  // --- Debugging and Analysis Framework (In-Memory Buffers) ---
  const _redTeamDebugLog = []; // In-memory buffer for raw console-like messages
  const _redTeamGoods = [];   // In-memory buffer for structured test results/API snapshots

  // Expose debug buffers and control functions globally
  window.redTeamDebugLog = _redTeamDebugLog;
  window.redTeamGoods = _redTeamGoods;
  window.redTeamClear = () => {
    _redTeamDebugLog.length = 0; // Clear the array
    _redTeamGoods.length = 0;   // Clear the array
    log('Debug logs and goods cleared.');
    updateDebugUI(); // Update UI after clearing
  };

  /**
   * Logs messages to the console with a consistent prefix for easy filtering.
   * @param {...any} args - Arguments to log.
   */
  function log(...args) {
    if (DEBUG_MODE) {
      console.log(DEBUG_PREFIX, ...args);
    }
  }

  /**
   * Logs error messages to the console with a consistent prefix.
   * @param {...any} args - Arguments to log.
   */
  function error(...args) {
    if (DEBUG_MODE) {
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
          // Attempt structuredClone first if available and object is clonable
          if (typeof structuredClone === 'function') {
              return structuredClone(obj);
          }
      } catch (e) {
          // Fallback for cases where structuredClone exists but fails (e.g., non-clonable object)
          error("structuredClone failed, falling back to JSON serialization. Error:", e);
      }
      // Fallback to JSON serialization (loses functions, dates, etc., but good for simple data)
      try {
          return JSON.parse(JSON.stringify(obj));
      } catch (e) {
          error("Failed to deep clone object via JSON serialization (possible circular reference or non-serializable data). Error:", e);
          return null; // Return null if unable to clone safely
      }
  }

  /**
   * Logs specific messages to the in-memory debug buffer and console.
   * @param {string} message - The main log message.
   * @param {object} [data] - Optional structured data to log. This will also be pushed to _redTeamGoods if provided.
   */
  function writeToLogFile(message, data = null) {
    if (DEBUG_MODE) {
      const timestamp = new Date().toISOString();
      _redTeamDebugLog.push(`${timestamp} ${message}`); // Store as simple string in raw log
      console.log(`${DATA_LOG_PREFIX} ${message}`, data || ''); // Also log to console for immediate visibility
      if (data) {
        const clonedData = safeDeepClone(data);
        if (clonedData !== null) { // Only push if cloning was successful
          _redTeamGoods.push({ timestamp, message, data: clonedData, type: 'custom_log' });
        } else {
          error("Failed to log structured data due to cloning issue:", data);
        }
      }
      updateDebugUI(); // Update UI after adding log
    }
  }

  /**
   * Logs API request/response data to the in-memory structured data buffer and console.
   * @param {string} url - The URL of the API endpoint.
   * @param {object} data - The request body or response data.
   * @param {'request_original' | 'response_original' | `response_error_${number}` | `response_status_${number}`} type - Type of data.
   */
  function logApiResponse(url, data, type) {
    if (DEBUG_MODE) {
      const timestamp = new Date().toISOString();
      const clonedData = safeDeepClone(data);
      if (clonedData !== null) {
        const entry = { timestamp, url, type, data: clonedData };
        _redTeamGoods.push(entry); // Store full objects in _redTeamGoods
        writeToLogFile(`API ${type.toUpperCase()} for ${url}`, entry); // Also add a summary to raw log
        updateDebugUI(); // Update UI after adding log
      } else {
         error(`Failed to log API ${type} for ${url} due to cloning issue. Original data:`, data);
      }
    }
  }

  /**
   * Dumps current localStorage, sessionStorage, and document.cookie to the debug log.
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
      updateDebugUI(); // Update UI after adding log
    } else {
      error("Failed to log browser state due to cloning issue. Original state:", state);
    }
  }

  /**
   * Parses a request body (either FormData or a JSON string) into a JavaScript object.
   * Handles other common body types like URLSearchParams.
   * @param {FormData|string|URLSearchParams|Blob|ArrayBuffer} body - The request body.
   * @returns {object|null} - The parsed object, or null if parsing fails or body type is unsupported.
   */
  function parseBody(body) {
    if (body instanceof FormData) {
      try {
        const obj = {};
        for (const [key, value] of body.entries()) {
            if (value instanceof File) { // Special handling for File objects in FormData
                obj[key] = {
                    fileName: value.name,
                    fileSize: value.size,
                    fileType: value.type,
                    // Note: Actual file content is not captured here for performance/memory reasons
                };
            } else {
                obj[key] = value;
            }
        }
        return obj;
      } catch (e) {
        error("Failed to parse FormData:", e);
        return null;
      }
    }
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (e) {
        // Log the body content if JSON parsing fails to aid debugging
        error("Failed to parse JSON string. Body content:", body, "Error:", e);
        return null;
      }
    }
    if (body instanceof URLSearchParams) {
        return Object.fromEntries(body.entries());
    }
    // For other complex types (Blob, ArrayBuffer), return a representation if possible.
    // Otherwise, return null or an object indicating type.
    if (body && typeof body.toString === 'function' && !(body instanceof Object && body.constructor === Object)) {
        log("Unsupported complex body type, converting to string representation:", body);
        return { rawBodyType: body.constructor.name, rawBodyString: body.toString() };
    }
    // Return null for truly unsupported or empty body types that aren't plain objects/strings
    return null;
  }

  /**
   * Analyzes collected `redTeamGoods` (structured logs) to suggest potential credit-related keys.
   * This function is exposed globally as `window.analyzeCredits()`.
   */
  function analyzeCreditRelatedData() {
    if (!DEBUG_MODE) {
      console.warn("Credit analysis is only available in DEBUG_MODE.");
      return;
    }
    writeToLogFile("Initiating credit-related data analysis...");
    // Expanded keywords to catch more variations
    const creditKeywords = ["credit", "credits", "balance", "bal", "amount", "coin", "coins", "token", "tokens",
                            "limit", "allowance", "premium", "cost", "price", "fee", "tier", "usage", "subscription",
                            "currency", "points", "xp", "gems"]; // Added more generic economic terms
    const potentialKeys = new Set();
    const analysisResults = [];

    // Analyze API responses and requests in _redTeamGoods
    _redTeamGoods.forEach(entry => {
      if (entry.type.startsWith('response') || entry.type.startsWith('request') || entry.type === 'custom_log') {
        const url = entry.url || (entry.data ? entry.data.url : 'N/A');
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
            }
            // Heuristic for credit numbers: positive integers.
            // Removed upper bound, as bypass targets high numbers.
            else if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && creditKeywords.some(kw => key.toLowerCase().includes(kw))) {
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
            if (typeof value === 'string') {
                if (creditKeywords.some(kw => value.toLowerCase().includes(kw))) {
                    potentialKeys.add(`${storageType} Value: ${currentPath} (Context: ${context})`);
                    analysisResults.push({ type: `${storageType} Value Match`, key: currentPath, value, context, entryTimestamp: entry.timestamp });
                }
                // Try to parse string values as JSON for deeper analysis
                try {
                    const parsed = JSON.parse(value);
                    if (typeof parsed === 'object' && parsed !== null) {
                        searchState(parsed, storageType, currentPath); // Recurse into parsed JSON
                    }
                } catch (e) { /* Not JSON, ignore */ }
            }
            // Recursively search objects within browser state (e.g., if a localStorage item is a JS object)
            if (typeof value === 'object' && value !== null) {
              searchState(value, storageType, currentPath);
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

  // Expose analyzeCredits globally
  window.analyzeCredits = analyzeCreditRelatedData;

  /**
   * Overrides the native XMLHttpRequest.prototype.open and .send methods
   * to passively intercept and log request bodies and responses.
   * NO MODIFICATION IS APPLIED IN THIS DEBUGGER SCRIPT.
   */
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(m, u) {
      this._url = u;
      this._method = m;
      return oOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || "";
      const method = (this._method || "GET").toUpperCase();

      if (body) {
        const originalBodyParsed = parseBody(body);
        if (originalBodyParsed) {
          logApiResponse(url, originalBodyParsed, 'request_original'); // Log original request body
        } else {
          log(`XHR request to ${url} had unparseable or empty body:`, body);
        }
      }

      this.addEventListener("load", () => {
        let resp;
        try {
            // Attempt to parse response as JSON regardless of status
            resp = JSON.parse(this.responseText || "{}");
        } catch (e) {
            // If not JSON, log raw text or a structured error object
            error("Error parsing XHR response as JSON:", e, "Response Text:", this.responseText.substring(0, 200) + (this.responseText.length > 200 ? '...' : ''));
            resp = { rawResponse: this.responseText, status: this.status, statusText: this.statusText };
        }

        if (this.status >= 200 && this.status < 300) {
            logApiResponse(url, resp, 'response_original'); // Log original success response data
        } else {
            // Log non-2xx responses as error responses
            logApiResponse(url, resp, `response_error_${this.status}`);
        }
      }, {
        once: true
      });

      return oSend.apply(this, [body]); // Send original body, no modification.
    };
    log('XHR passive override initialized.');
  }

  /**
   * Overrides the native window.fetch method to passively intercept and log requests and responses.
   * NO MODIFICATION IS APPLIED IN THIS DEBUGGER SCRIPT.
   */
  function overrideFetch() {
    const origFetch = window.fetch;

    window.fetch = async function(...args) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      let init = args[1];
      const method = (init?.method || "GET").toUpperCase();
      let body = init?.body;

      if (body) {
        const originalBodyParsed = parseBody(body);
        if (originalBodyParsed) {
          logApiResponse(url, originalBodyParsed, 'request_original'); // Log original request body
        } else {
          log(`Fetch request to ${url} had unparseable or empty body:`, body);
        }
      }

      try {
        const res = await origFetch.apply(this, args); // Call original fetch with original arguments
        const contentType = res.headers.get("content-type") || "";
        const clone = res.clone(); // Clone for reading body without affecting original response stream

        let respData;
        try {
            if (contentType.includes("application/json")) {
                respData = await clone.json();
            } else {
                // If not JSON, try to read as text and then attempt JSON parse
                const text = await clone.text();
                try {
                    respData = JSON.parse(text);
                } catch (e) {
                    respData = text; // Fallback to raw text
                }
            }
        } catch (e) {
            error("Error reading or parsing Fetch response body:", e, "Response URL:", url, "Content-Type:", contentType);
            respData = { rawResponse: "Could not read response body", status: res.status, statusText: res.statusText, contentType };
        }

        if (res.ok) { // Check if response status is in the 200-299 range
            logApiResponse(url, respData, 'response_original'); // Log original success response data
        } else {
            // Log non-2xx responses as error responses
            logApiResponse(url, respData, `response_status_${res.status}`);
        }
        return res; // Return original response, no modification.
      } catch (err) {
        error("Fetch error for", url, err);
        throw err;
      }
    };
    log('Fetch passive override initialized.');
  }

  /**
   * Simple throttle function to limit how often a function can be called.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds.
   * @param {number} [jitter=50] - Max random milliseconds to add.
   * @returns {Function} - The throttled function.
   */
  function throttle(fn, baseDelay, jitter = 50) {
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

  //────── DEBUG UI ──────//

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
        width: 380px; /* Slightly wider for better instruction display */
        height: auto;
        max-height: 90vh;
        background: rgba(30, 30, 30, 0.95);
        color: #15FFFF; /* Primary text color */
        border: 1px solid #15FFFF;
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
        color: #15FFFF; /* Header title color */
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
        border-bottom: 1px dashed #004040; /* Darker cyan dash */
      }
      #pv-debug-panel .section-area { /* Unified styling for log and instruction areas */
        flex: 1;
        min-height: 100px;
        padding: 5px 10px;
        overflow-y: auto;
        border-bottom: 1px dashed #004040;
        display: flex;
        flex-direction: column;
      }
      #pv-debug-panel .section-area:last-of-type {
        border-bottom: none; /* No border for the very last section */
      }
      #pv-debug-panel .section-area h4 {
        margin: 5px 0;
        color: #15FFFF; /* Section heading color */
        font-size: 12px;
        flex-shrink: 0;
      }
      #pv-debug-panel .log-output {
        flex-grow: 1;
        background: rgba(0,0,0,0.6);
        border: 1px solid #002020; /* Very dark cyan border */
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
          color: #E0FFFF; /* Slightly lighter for instructions readability */
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
          color: #FFD700; /* Gold for emphasis */
      }
    `;
    document.head.appendChild(styleElement);
    log('Debug CSS injected.');
  }

  // Inject the debug UI into the DOM
  function injectDebugUI() {
    if (!DEBUG_MODE || document.getElementById("pv-debug-panel")) return;

    try {
        injectDebugCSS();

        const panel = document.createElement("div");
        panel.id = "pv-debug-panel";
        panel.innerHTML = `
          <div class="header">
            <span>Pixverse Redteam Recon</span>
            <button id="pv-toggle-btn">Toggle</button>
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
                  <p><strong>Goal:</strong> Capture the full sequence of network requests and browser state during the Pixverse++ & PixverseBETA credits bypass.</p>
                  <ul>
                    <li><strong>1. Load Script:</strong> Ensure this userscript is active via your browser's userscript manager (e.g., Tampermonkey, Violentmonkey).</li>
                    <li><strong>2. Navigate:</strong> Go to the starting page where the bypass attempt would begin.</li>
                    <li><strong>3. Clear Logs:</strong> Click "Clear All" to start with a fresh log, ensuring only relevant data is captured.</li>
                    <li><strong>4. Dump Initial State:</strong> Click "Dump State" to save a snapshot of cookies/storage before interaction.</li>
                    <li><strong>5. Execute Bypass:</strong> Carefully perform the exact steps for the Pixverse++ & PixverseBETA credits bypass.
                        <br><strong>Remember:</strong> This requires both codebases interacting to succeed.</li>
                    <li><strong>6. Dump Final State:</strong> After successful bypass, click "Dump State" again to capture the final browser state.</li>
                    <li><strong>7. Analyze (Optional):</strong> Click "Analyze Credits" for automated suggestions on credit-related keys.</li>
                    <li><strong>8. Extract Data:</strong> The "API/Structured Data" section (<code style="color:#FFD700;">window.redTeamGoods</code>) contains all captured requests/responses and state snapshots. Copy this data and share it for analysis.</li>
                    <li><strong>9. Toggle UI:</strong> Use the "Toggle" button in the header to collapse/expand the entire panel.</li>
                  </ul>
                  <p><strong>Important:</strong> This tool is for diagnostic use only. Do not use in production environments.</p>
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
        document.getElementById('pv-analyze-credits').addEventListener('click', analyzeCreditRelatedData);

        const toggleInstructionsBtn = document.getElementById('pv-show-instructions');
        const instructionsArea = document.getElementById('pv-instructions-area');
        toggleInstructionsBtn.addEventListener('click', () => {
          instructionsArea.style.display = instructionsArea.style.display === 'none' ? 'flex' : 'none'; // Toggle visibility
          // Optionally, hide other sections when instructions are visible for better focus
          document.querySelectorAll('#pv-debug-panel .section-area:not(#pv-instructions-area)').forEach(el => {
            el.style.display = instructionsArea.style.display === 'flex' ? 'none' : 'flex';
          });
        });


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
          e.preventDefault(); // Prevent text selection during drag
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
        log('Debug UI injected and listeners attached.');
    } catch (e) {
        error('Error injecting debug UI:', e);
    }
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
      const displayData = JSON.stringify(entry, null, 2);
      return `<div><pre>${displayData.length > 1000 ? displayData.substring(0, 1000) + '... (truncated for UI display)' : displayData}</pre></div>`;
    }).join('');
    if (goodsOutput.innerHTML !== newGoodsHTML) {
      goodsOutput.innerHTML = newGoodsHTML;
      goodsOutput.scrollTop = goodsOutput.scrollHeight; // Scroll to bottom
      goodsCount.textContent = _redTeamGoods.length;
    }
  }, 200, 50); // Throttle every 200-250ms


  /**
   * Initializes the debugger by applying necessary passive overrides and setting up the UI.
   */
  function initialize() {
    if (isInitialized) {
      return;
    }
    log('Attempting to initialize Pixverse++ Debugger...');
    try {
      overrideXHR();
      overrideFetch();

      dumpBrowserState("On Initialize"); // Log initial browser state
      injectDebugUI(); // Inject debug UI

      isInitialized = true;
      log('Pixverse++ Debugger initialized successfully!');
    } catch (e) {
      error('Debugger initialization failed catastrophically! Error:', e);
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
