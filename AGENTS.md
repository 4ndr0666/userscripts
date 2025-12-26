/* Codex Transmission: Actionable Tasks for LinkMasterΨ2 Completion */

/*
1. HUD & DOM Integration
   - Inject HUD container (`#hud-panel-root`) with tabs: "scrape", "check", "settings".
   - Bind all tab buttons to `setHudTab(tab)`.
   - Ensure HUD floats on page with toggle button `#hud-float-btn`.
   - Attach tippy tooltips for post links with lazy-loaded image/video previews.
   - Render per-post panels in `#posts-container` with download/config buttons.
   - Attach bulk actions: select all, select none, download selected.

2. Post & Host Parsing
   - Parse forum posts:
       - `parsers.thread.parsePost(post)` returns: postId, postNumber, pageNumber, spoilers, content.
       - `parsers.hosts.parseHosts(html)` returns structured host objects with resources array.
   - Mark posts processed (`data-linkmaster-processed`) to avoid duplicates.
   - For general mode pages:
       - Parse entire page and generate synthetic `virtualPost`.
       - Use `collectGenericMediaResources()` to detect video/audio links.

3. Resolvers
   - Maintain `resolvers` array: each entry is `[patterns, async resolverCallback]`.
   - Resolver callback input: (url, http, spoilers, postId, postSettings) => resolved URLs.
   - Ensure all resolvers:
       - Return consistent object `{ resolved: [...], folderName }` OR string for single URL.
       - Handle password-protected content (e.g., JPG6, GoFile, Cyberfile).
       - Retry network failures 3x with delays.
   - Include host-specific transformations (Pixhost, Pixeldrain, Bunkr, Cyberdrop, Pornhub, Redgifs, Nitter, IBB, etc.).
   - Integrate `buildGenericMediaHost()` if generic detection enabled.

4. Download & Packaging
   - `downloadPost(postData, statusContainerElement)`:
       - Resolve all enabled hosts and their resources.
       - Respect `postSettings` flags: zipped, flatten, skipDownload, skipDuplicates, generateLinks, generateLog.
       - Use JSZip for zip packaging if `zipped` OR for Firefox if required.
       - File naming rules:
           - sanitize invalid characters
           - append counter for duplicates
           - support `:title:`, `:#:`, `:id:` placeholders.
       - Update progress bars: totalPB, filePB.
       - Copy URLs for successfully repaired/bulk operations if needed.

5. URL Repair
   - `scanAndRepairLink(url)` generates candidate URLs:
       - swaps protocols, alternate host paths (/v/→/d/, /a/→/e/), strip query string.
       - Use HEAD request to verify existence.
   - `scanAndRepairResolvedUrls(statusContainer)` iterates all resolved URLs.
       - Update HUD statusLabel per URL.
       - Return array: `{ original, repaired, status, error }`.
       - Copy working URLs to clipboard.

6. Export & Copy
   - `copyAllResolvedUrls(statusContainer, options)`:
       - Filters: all/images/videos/documents/compressed.
       - Formats: plaintext, JSON, Markdown.
   - `showExportModal(statusContainer)`:
       - Presents filter, detail, format options.
       - Calls `exportResolvedUrls(statusContainer, {filter, format, detail})`.
   - `exportResolvedUrls()` generates CSV/JSON/Markdown:
       - Builds rows with context and thumbnails depending on detail.
       - Uses FileSaver for download.
       - StatusLabel updated in HUD.

7. M3U8 Streaming
   - `scanM3u8Streams(statusContainer)`:
       - Filters `.m3u8` URLs from resolved list.
       - Parses playlists using `m3u8-parser`.
       - Populates select dropdown with variants sorted by BANDWIDTH.
       - Copies FFmpeg command for selected variant.

8. Settings Management
   - `loadSettings()` reads GM_getValue('linkmaster_settings'), merges defaults.
   - `saveSettings()` stores GM_setValue('linkmaster_settings').
   - Settings panel:
       - appMode (forum/general)
       - GoFile Token
       - defaultZipped, defaultFlatten, defaultGenerateLinks, defaultGenerateLog, defaultSkipDuplicates
       - enableGenericMediaDetection
   - Save button triggers reload after storing values.

9. Async Utilities & Logging
   - `h.http.gm_promise()` wraps GM_xmlhttpRequest in Promise.
   - `h.re.matchAll()`, `toRegExp()`, `toString()` central regex parsing.
   - Logging: window.logs, structured tags, HUD updates.

10. Execution & Startup
    - On DOMContentLoaded:
        - Load settings.
        - Inject HUD styles.
        - Process initial posts (forum) or parse page (general).
        - Initialize HUD button.
        - Preload Redgifs token.
    - MutationObserver watches for dynamically added posts.
    - beforeunload event warns if processing downloads.

11. Lint & Code Style
    - ESLint target: ES2021, browser, Greasemonkey globals.
    - Enforce: strict semi, quotes single, eqeqeq true, no unused vars, consistent arrow functions, async/await.
    - Functions modularized by purpose: helpers, parsers, resolvers, ui, export, download.

All tasks above are atomic, deterministic, and ordered. Codex must produce final `codex.user.js` by implementing each step **exactly**. No speculative defaults; all referenced functions and objects exist in the provided canonical code.