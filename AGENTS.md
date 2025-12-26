# Agent

**TARGET FILE:** codex.user.js  
**OBJECTIVE:** Integrate advanced HUD utilities, dead link fixer, copy/export functions, m3u8 parsing, and batch operations while preserving existing functionality and resolver flow.

------------------------------------------------------------
1. DEAD/BROKEN URL FIXER
------------------------------------------------------------
- HUD BUTTON: "Fix URLs" per post or global selection
- Async ping all resolved URLs
- Color-code results:
  - Green: alive
  - Yellow: transformable via pattern rules
  - Red: dead
- Known transformations:
  - `.su` ↔ `.cr`
  - `cdnX` → `streamX`  
- Async updates only; do not block UI
- Output updated URLs into HUD dynamically

------------------------------------------------------------
2. COPY ALL URLS
------------------------------------------------------------
- HUD BUTTON: "Copy All"
- Optional filter: All / Images / Videos
- Use `GM_setClipboard` for max cross-browser support
- Output formats: 
  - Plaintext one-per-line (default)
  - JSON array including `{ url, host, folderName }`  
- Configurable via HUD modal

------------------------------------------------------------
3. BATCH OPEN / DOWNLOAD
------------------------------------------------------------
- HUD BUTTONS: "Open All", "Download All"
- Async queue, configurable throttle (default 5 concurrent)
- Works on resolved URLs per post
- Integrates with `resolvePostLinks` queue
- Must preserve progress bar updates

------------------------------------------------------------
4. SMART EXPORT
------------------------------------------------------------
- HUD BUTTON: "Export"
- Formats: CSV, JSON, Markdown
- Options: Links only / Links+Context / Links+Thumbnails
- Proper escaping for CSV/Markdown
- Export modal displays selectable format
- Downloads as Blob using `FileSaver.saveAs`  

------------------------------------------------------------
5. M3U8 PARSER
------------------------------------------------------------
- HUD BUTTON: "Scan Streams"
- Detect all m3u8 URLs in resolved URLs
- Fetch playlists, extract variants, determine best quality
- Provide selection dropdown for quality
- Copy corresponding `ffmpeg` command to clipboard
- Async, non-blocking; progress indicators per m3u8 URL

------------------------------------------------------------
6. BROKEN LINK DETECTOR
------------------------------------------------------------
- Async HUD badge indicator per post: Green/Yellow/Red
- Clickable filter to show only Good/Bad/Unknown links
- Integrates with Dead/Broken URL fixer

------------------------------------------------------------
7. REGEX / SUBSTRING FILTER
------------------------------------------------------------
- Input in HUD: filter displayed links dynamically
- Supports regex, substring, type (image/video), size
- Updates visible list without blocking download actions

------------------------------------------------------------
8. CUSTOM HOST PLUGINS
------------------------------------------------------------
- Externalize host parsers as objects/modules
- Runtime registration hook: `registerHostPlugin({ name, patterns, resolver })`
- Supports crowdsource/future auto-updates
- Maintains existing resolver execution order

------------------------------------------------------------
9. HUD INTEGRATION
------------------------------------------------------------
- Place new buttons alongside existing `Configure & Download`
- Async progress bars per file + total
- Status updates in real-time
- Preserve tooltip previews (images/videos)
- Preserve Forum Mode & General Mode compatibility

------------------------------------------------------------
10. TECHNICAL NOTES
------------------------------------------------------------
- Preserve all existing resolver logic in `resolvePostLinks`
- Compatible Firefox + Chrome (GM_* APIs)
- Batch operations: controlled async queue, prevents memory overload
- Do not overwrite existing folder structures or cached URLs
- Ensure all async functions have error handling

------------------------------------------------------------
11. VALIDATION
------------------------------------------------------------
- HUD buttons test for functionality
- Batch operations tested with multiple hosts per post
- Copy/export tested across supported browsers
- M3U8 detection + ffmpeg command validation
- Dead/Broken URL fixer tested with known patterns

------------------------------------------------------------
12. STARTUP / ENVIRONMENT
------------------------------------------------------------
- Standard Codex Node.js environment >=18 with GM_* APIs available
- Preload modules: JSZip, tippy.js, sha256, FileSaver
- Script self-contained; external calls only through resolvers/API endpoints
