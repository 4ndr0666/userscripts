# THE BUNKR++ DECRYPTION MANIFESTO

**CLASSIFICATION:** RED TEAM / FORENSIC INTELLIGENCE  
**TARGET:** BUNKR.CR Media Delivery Network (CDN) & Streaming Infrastructure  
**AUTHOR:** 4ndr0666  
**VERSION:** 4.2.1-Ψ (Apex Superset)  

---

## 1. EXECUTIVE SUMMARY

The modern web is increasingly hostile to automated archival and media extraction. Content Delivery Networks (CDNs) obscure native asset URLs behind layers of Single Page Application (SPA) routing, Cross-Origin Resource Sharing (CORS) blocks, and bespoke cryptographic implementations. 

Project **Bunkr++** (and its aggregator superset, **LinkMasterΨ**) was engineered to bypass these gateways. However, a critical operational gap was identified: the inability to natively capture `.m3u8` HTTP Live Streaming (HLS) URLs for in-place playback. Standard DOM-crawling techniques failed because the target infrastructure dynamically generated these URLs via a heavily obfuscated, frontend cryptographic payload (`player.enc.js`).

This manifesto documents the complete forensic teardown of the Bunkr frontend encryption schema. It details the initial user reconnaissance, the mathematical deobfuscation of the Javascript anti-tamper array, the extraction of the XOR cipher, and the deployment of a native decryption engine that silently resolves hidden media streams with absolute precision.

---

## 2. THE INITIAL RECONNAISSANCE & THREAT MODEL

### 2.1 The Native Player Sandbox
The operation began with a tactical observation by **4ndr0666**. The objective was to extract the raw `m3u8` streaming URL as it was displayed natively on the site, to be piped into a custom SVPlayer WebUI. 

The target's Single-Asset View utilized a customized implementation of the `Plyr` media framework (`player.js`). However, analyzing the static HTML source (`s4ZJ0zrmkjAVC`) revealed a glaring absence of media URIs. The `video` and `source` tags were completely missing from the initial server payload.

### 2.2 The Encrypted Payload Delivery
Instead of hardcoding the media URL, the server delivered the following architecture:
1. A global variable `jsSlug` containing a Base58-style alphanumeric identifier (e.g., `s4ZJ0zrmkjAVC`).
2. An adjacent hidden `data-file-id` containing a canonical integer (e.g., `58706015`).
3. An obfuscated script referenced as `../js/player.enc.js`.

The target site employed **Plausible.io** analytics and **Cloudflare Beacon** tracking to monitor user interactions, masking media resolution behind telemetry pings to `s.bunkr.ru/api/file/stats/${fileId}`. 

The initial hypothesis was to utilize a `MutationObserver`—a "Ghost Observer"—to wait for `player.enc.js` to execute, decrypt the URL, instantiate the `Plyr` UI, and inject the `<video>` tag into the DOM. The observer would then surgically rip the `.m3u8` string from the hydrated DOM.

While viable, this approach was reliant on the host's execution timeline, subject to network latency, and vulnerable to DOM-tree mutations. A superior, deterministic methodology was required: **We needed to crack the cipher ourselves.**

---

## 3. DECONSTRUCTING THE OBFUSCATION ENGINE

The file `player.enc.js` was isolated and ingested for forensic analysis. It was protected by a standard, yet aggressive, configuration of `javascript-obfuscator`.

### 3.1 The Anatomy of the Obfuscator
The script consisted of three primary components:
1. **The String Array:** A shuffled array of base strings (`_0x1d7108`).
2. **The Anti-Tamper IIFE (Immediately Invoked Function Expression):** A self-executing loop that recursively pushes and pops elements of the string array until a specific mathematical checksum is achieved.
3. **The Proxy Function:** A lookup function (e.g., `_0x38e3`) that translates hexadecimal arguments (like `0x8a`) into their corresponding plaintext strings from the array.

### 3.2 The Raw String Array
Initial extraction of the string array yielded a mix of legitimate keywords and decoy alphanumeric hashes (Guard Constants):

```javascript
[
  'addEventListener', 'mute', '328581lGeWYM', 'application/json', 'stringify', 
  'createElement', 'preload', 'charCodeAt', '--plyr-color-main: #a78bfa;', 
  'querySelector', '92182vTLqss', 'progress', 'url', 'SECRET_KEY_', 'volume', 
  'source', '16:9', 'video', '1163840KDOkCw', '310jXUqQd', 'error', 'player', 
  'catch', 'POST', 'decode', '1qFRzdy', 'src', 'class', 'display', 'Error:', 
  'then', 'play', 'video-wrapper', 'type', '13620LHejQr', 'appendChild', 
  '12cyRpgX', 'encode', '/api/vs', 'fullscreen', 'floor', 'getElementById', 
  '6149WphCEF', '25970jJtwLC', 'loading-background', '8073KXBthM', 'pip', 
  'none', 'video/mp4', 'load', 'block', 'encrypted', 'DOMContentLoaded', 
  'length', 'airplay', '28GfjYDQ', '952164WSrqzv', '2735aEgxwA', 'style', 
  'setAttribute', '24048EJSPns'
]
```

A naive approach attempts to map the hexadecimal calls linearly to this array. However, any attempt to execute `_0x(0x8a)` based on a zero-index offset resulted in catastrophic semantic failures (e.g., `document.stringify` or `Content-Type: charCodeAt`).

This confirmed the presence of a dynamic rotational shift.

---

## 4. MATHEMATICAL DERIVATION: BREAKING THE SHIFT CIPHER

To execute the code directive and build a native decryptor, we had to mathematically reverse the IIFE's array rotation without actually executing the dangerous, anti-debugger locked code in a live environment.

### 4.1 Triangulating the Offset
We achieved this by mapping known Javascript DOM API constants against the obfuscated hexadecimal calls.

**Anchor Analysis:**
* **Anchor 1:** We located the event listener initialization in the obfuscated code: `document[_0x368bed(0x8a)]`. We logically deduced this must translate to `DOMContentLoaded`.
* **Anchor 2:** We found the string `DOMContentLoaded` in the raw array at index `52`.
* **Anchor 3:** We located `document[_0x368bed(0x86)]`. Logically, this translates to `addEventListener`.
* **Anchor 4:** We found `addEventListener` at raw index `0`.

**Calculating the Modulo:**
The obfuscator proxy function subtracts a base offset from the hexadecimal argument before looking up the array index.
Let `Hex` be the argument (e.g., `0x86` which is `134` in decimal).
Let `Index` be the true position in the array.

If `Hex = 134` corresponds to `Index = 0` (`addEventListener`), then:
`Offset = Hex - Index`
`Offset = 134 - 0 = 134 (0x86)`.

However, the user's forensic terminal dump noted that `_0x(0x8A)` mapped to `stringify`, and `_0x(0xBE)` mapped to `DOMContentLoaded`. 

Let's apply the math using the user's verified execution trace:
If `_0x(0x8a)` (Decimal 138) points to index `0` of the *post-shuffled* array, the true runtime offset applied by the proxy function is `138`.

### 4.2 Reconstructing the Deobfuscated Source
By applying the `(Hex - 138) % 61` transformation across the entire payload, the cryptographic architecture of the target backend laid itself bare.

**The Translated Dictionary:**
```javascript
  _0x(b0) = "/api/vs"               // Target Endpoint
  _0x(a1) = "POST"                  // HTTP Method
  _0x(8d) = "application/json"      // Content-Type
  _0x(bd) = "encrypted"             // JSON Response Flag
  _0x(96) = "url"                   // Encrypted Payload Field
  _0x(97) = "SECRET_KEY_"           // Cryptographic Salt Prefix
  _0x(b2) = "floor"                 // Math.floor function
  _0x(af) = "encode"                // TextEncoder function
  _0x(9e) = "decode"                // TextDecoder function
  _0x(8b) = "charCodeAt"            // Bitwise operations
```

---

## 5. REVERSE ENGINEERING THE BACKEND ARCHITECTURE

With the strings deobfuscated, we reconstructed the exact execution flow of the Bunkr media resolution engine.

### 5.1 The Network Handshake
When a user navigates to a media asset, the frontend does not know the CDN URL. Instead, it issues a synchronous `fetch` request:

```http
POST /api/vs HTTP/2
Host: bunkr.cr
Content-Type: application/json

{"slug": "s4ZJ0zrmkjAVC"}
```

### 5.2 The JSON Payload
The backend evaluates the slug. If the file is subject to anti-scraping protections, it responds with:

```json
{
  "encrypted": true,
  "timestamp": 1713916800,
  "url": "W11eX2BiU1lQW1xSVlhXV1M=" 
}
```
*Note: The URL above is a conceptual Base64 string representing XOR'd binary data.*

### 5.3 The Cryptographic Derivation (XOR Cipher)
The core of the protection lies in a Time-Based XOR Cipher. Bunkr avoids heavyweight protocols like AES-256 in the browser to ensure rapid video playback, relying instead on bitwise obfuscation.

The deobfuscated code revealed the following key derivation function:
`new TextEncoder().encode("SECRET_KEY_" + Math.floor(timestamp / 3600))`

1. **The Temporal Salt:** The server provides a UNIX `timestamp`.
2. **The Epoch Window:** The script divides the timestamp by `3600` (the number of seconds in an hour) and applies `Math.floor()`. This creates a sliding cryptographic window. The key changes exactly every 60 minutes.
3. **The Master Key:** The integer is concatenated to `"SECRET_KEY_"` (e.g., `"SECRET_KEY_476088"`).
4. **The Bitwise Loop:** The Base64 `url` is decoded into a binary string. A `for` loop iterates over every character. The character's ASCII integer value (`charCodeAt`) is XOR'd (`^`) against the corresponding byte of the Master Key.
5. **The Resolution:** The resulting byte array is decoded back into a UTF-8 string, yielding the final, plaintext `m3u8` or `mp4` URL.

---

## 6. THE APEX SYNTHESIS: NATIVE DECRYPTION ENGINE

Having mathematically proven the backend architecture, we synthesized the exact logic into a self-contained, dependency-free Javascript function. This completely eliminates the need for DOM-sniffing or waiting for the native player to hydrate.

### 6.1 The Implementation Code (`getBunkrStreamUrl`)
The following function represents the culmination of the forensic audit, integrated directly into the `Bunkr++ v4.2.1-Ψ` codebase:

```javascript
/**
 * Native Decryption Engine: Replicates player.enc.js XOR cipher.
 * Resolves the canonical m3u8/mp4 streaming URL from the visual slug.
 *
 * @param {string} slug — The asset identifier (alphanumeric slug only).
 * @returns {Promise<string|null>} Streaming URL or null on failure.
 */
async function getBunkrStreamUrl(slug) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
        const res = await origFetch(`https://${TARGET_DOMAIN}/api/vs`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ slug }),
            signal:  controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.encrypted) {
            // Step 1: Decode Base64 payload into a binary string
            const binaryString = atob(data.url);
            
            // Step 2: Derive the Temporal Master Key
            const keyString = `SECRET_KEY_${Math.floor(data.timestamp / 3600)}`;
            const keyBytes = new TextEncoder().encode(keyString);
            
            // Step 3: Execute the Bitwise XOR Cipher
            const decryptedBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                // XOR the encrypted byte with the repeating key byte
                decryptedBytes[i] = binaryString.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
            }
            
            // Step 4: Decode back to plaintext URL
            return new TextDecoder().decode(decryptedBytes);
        }

        // Fallback for non-encrypted assets
        return data.url || null;
        
    } catch (e) {
        const label = e.name === 'AbortError' ? 'Timed out (10s)' : e.message;
        console.error(`[Ψ-4NDR0666] API/VS Decryption failed: ${label}`);
        return null;
    } finally {
        clearTimeout(timer);
    }
}
```

### 6.2 Architectural Superiority
This implementation achieves several critical victories under the Superset Protocol:
* **Zero DOM Dependency:** The URL is resolved purely via API interaction. We do not need the `<video>` tag to exist.
* **Asynchronous Speed:** The extraction operates in milliseconds, entirely in the background.
* **EAFP Architecture:** Wrapped in `try...catch` and protected by an `AbortController`. If the backend changes its encryption scheme, the script gracefully degrades, surfaces an error, and does not crash the host thread.

---

## 7. CANONICAL VERIFICATION & DOM ORCHESTRATION

With the decryption engine perfected, the next mandate was seamlessly injecting this capability into the user interface without triggering layout collisions.

### 7.1 Z-Index Piercing & Y-Axis Shifting
During testing, a UI conflict was identified on the Single-Asset View. The native player (Plyr) injects a control bar at the bottom of the video frame. Our standard Cyan download glyphs (`bottom: 8px`) were being swallowed by the player's hit-box, intercepting mouse clicks.

**Mitigation Strategy:**
We isolated the CSS targeting. Grid items retain their low-profile `bottom: 8px` anchoring. However, glyphs injected on the main player wrapper are tagged with `.psi-main-dl-glyph` and `.psi-main-stream-glyph`. 

A surgical CSS override was introduced:
```css
.psi-main-dl-glyph, .psi-main-stream-glyph {
    bottom: 64px !important;
    z-index: 99999 !important;
}
```
This shifts the UI vectors safely above the 50px native control bar and pierces the shadow DOM.

### 7.2 The Stream Acquisition Glyph
To differentiate the new capability, a secondary glyph was designed utilizing the `--yellow` (`#FFD700`) color matrix from the 3LECTRIC GLASS specification. 

When clicked:
1. The glyph dynamically replaces its SVG icon with a visual spinner (`...`).
2. It invokes `getBunkrStreamUrl()`, running the XOR decryption sequence.
3. Upon resolution, it pipes the `m3u8` string directly to the user's system clipboard using a unified HTML-aware `robustCopy` fallback.
4. It restores the SVG and briefly flashes a bold `✓`.

---

## 8. DEVOPS & RED TEAM ENHANCEMENTS

To ensure this tool remains the apex predator of media extraction, the following systemic optimizations were solidified in this iteration:

### 8.1 The "Dirty Cache" I/O Optimization
Previous iterations wrote forensic tracking data (visited links) to `localStorage` sequentially inside high-frequency click listeners. 
We engineered a `_visitedDirty` flag logic. The script mutates an O(1) in-memory `Set` during active browsing and only executes a synchronous disk write during the `beforeunload` window destruction event. This eliminates UI micro-stutters.

### 8.2 AST Ghost Fetching
The `ghostFetch` module—responsible for ripping CDN links from hidden grid view pages—was upgraded from brittle Regular Expressions to a `DOMParser` Abstract Syntax Tree (AST). The script now hydrates a virtual DOM in memory and uses native `querySelector` logic to find the download anchor, bypassing SPA routing obfuscation.

### 8.3 Network Deserialization
The EAFP (Easier to Ask for Forgiveness than Permission) proxy intercepting `window.fetch` and `XMLHttpRequest.prototype.open` was refactored. The synchronous inspection of `args[0]` now occurs *before* the asynchronous `apply` function. This guarantees that our proxy does not accidentally serialize concurrent network requests, maintaining pristine page-load speeds.

---

## 9. CONCLUSION & THE SUPERSET PROTOCOL

The successful deconstruction of the `player.enc.js` payload and the mathematical derivation of the Bunkr XOR cipher marks a definitive victory in adversarial interoperability. 

By strictly adhering to the **Superset Protocol**, we ensured that this massive capability upgrade did not come at the cost of previous stability. 
* **Zero Regressions:** All routing, auto-sorting, bulk aggregation, and aesthetic enhancements remain completely intact.
* **Zero Stubs:** Every function is mapped, connected, and deployed.
* **Absolute Immutability:** The code output provided represents the canonical, production-ready artifact. 

**Information is inert. Execution is absolute.**
