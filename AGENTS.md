### **1. Technical Scope & Objective**

* Integrate **three new core features** directly into the HUD:

  1. **Copy All Resolved URLs**: extracts all resolved media URLs from the current session, flattening nested arrays, including videos, images, documents, compressed archives, and direct media links; copies to system clipboard via `GM_setClipboard`.
  2. **Broken URL Scanner / Fixer**: asynchronously checks each resolved URL with HEAD requests, detects HTTP 4xx/5xx, then attempts canonical transformations (strip query strings, HTTPS/HTTP swap, host-specific reroute logic). Returns a remediated URL array.
  3. **Generic Media Detection Enhancer**: adds support for `<video>`, `<audio>`, `<source>` tags, direct `<a>` download links with `.mp4`, `.webm`, `.mp3`, `.m4v` extensions, and arbitrary dynamic JS-injected sources. Ensures no `<video>` goes untracked in general mode.

* Each feature must seamlessly inject **as HUD buttons** under the “Scrape” tab, following the existing tippy/popover pattern for settings and status feedback. Status labels and progress bars should mirror existing download resolution mechanics for visual consistency.

* Features must obey **globalConfig & postSettings**, including zipped vs flattened downloads, duplicate detection, spoiler handling, and post-processing hooks.

---

### **2. HUD Integration Specification**

* **Copy All URLs Button**

  * Position: Below `Download Selected` in Scrape tab.
  * Label: `"📋 Copy All URLs"`.
  * Tooltip: shows total count of resolved links.
  * Function: collects all `postData.parsedHosts` where `host.enabled === true`, flattens arrays of `url`, removes duplicates, copies via `GM_setClipboard`, and logs success in `window.logs` and HUD toast.

* **Broken URL Scanner Button**

  * Position: Adjacent to Copy All.
  * Label: `"🔧 Scan/Repair URLs"`.
  * Function: asynchronously iterates over all URLs, performs `HEAD` requests. On 4xx/5xx, apply resolver fallback rules (`stripQueryString`, host-specific heuristics, protocol swap). Updates HUD in real-time progress bar and logs.

* **Generic Media Detector Toggle**

  * Position: Within HUD Settings as checkbox.
  * Label: `"Enable Generic Media Detection"`.
  * Function: If enabled, augment `resolvePostLinks` logic to:

    * Detect `<video>` and `<audio>` elements dynamically added to the DOM.
    * Pull `src` attributes from `<source>` children.
    * Include direct `.mp4`, `.m4v`, `.webm`, `.mp3` links in general mode scraping.

* All features must **trigger postDownloadCallbacks** where applicable, preserve ordering, and maintain the unique filename generator.

---

### **3. Coding Instructions for Codex**

* Environment: **GreaseMonkey/TamperMonkey JS environment**, ES2021+, `async/await` throughout.
* Use **existing HUD CSS class structure**; append new buttons as siblings to `.hud-content` flexbox.
* Functions must **return canonical object structures**: `{ url, folderName, host, original }` for each resolved link.
* Integration must **not interfere with existing host-specific resolvers** (Coomer, Bunkr, Cyberdrop, Pornhub, Redgifs, etc.).

---

### **5. Edge & Error Handling**

* **Concurrency safety**: ensure `resolvePostLinks` and `downloadPost` do not mutate shared state during async operations.
* **Progress tracking**: integrate new buttons into `ui.pBars` for visual feedback.
* **Logging**: all operations must write into `window.logs` with `[Ψ-4ndr0666]` tags for traceability.

---
