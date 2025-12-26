# Codex Work Order: LinkMasterΨ2 — Full Production Integration & Enhancement

## Objective
Finalize the `4ndr0tools - LinkMasterΨ2` userscript with production-ready enhancements, ensuring robust Flarum forum post detection, generic media scraping, M3U8 stream handling, clipboard/export utilities, and resilient plugin architecture.

---

## Tasks

### 1. Post Detection & Parsing
- Ensure `processPost` handles both Flarum (`article.CommentPost.Post`) and legacy post structures.
- Attach `MutationObserver` to `document.body` with `{ childList: true, subtree: true }`.
- Mark posts as processed to prevent duplicates: `post.dataset.linkmasterProcessed = "true"`.
- Collect post metadata: `postId`, `postNumber`, `contentContainer`, `spoilers`.
- Parse content for:
  - `parsedHosts` via `parsers.hosts.parseHosts`
  - Generic media via `collectGenericMediaResources` if enabled.
- Reset resolved cache after new post detection.

### 2. Generic Media Detection
- Implement `collectGenericMediaResources(root)`:
  - Detect `<video>`, `<audio>`, `<source>` tags.
  - Detect `<a>` links with media extensions: `mp4, webm, mp3, m4v, m4a, aac, wav, flac`.
  - Deduplicate and normalize URLs.
- Wrap results in a virtual host object using `buildGenericMediaHost(postId, resources)`.

### 3. Resolver & Fixer Logic
- Maintain existing `resolvers` array with pattern matching and async resolution.
- Apply `pluginFixers` to URLs post-resolution.
- Implement robust error handling and retries where appropriate.
- Resolve protected content using spoilers/passwords if available.
- Ensure resolved URLs are cached via `cacheResolvedLinks` and `cacheLinkStatus`.

### 4. HUD & Interface
- Inject HUD container with:
  - Tabs: Scrape, Check, Settings.
  - Quick Filter panel with regex, type, status, and min size.
  - Post listing with checkboxes, download buttons, and status chips.
  - Bulk actions: Copy URLs, Export, Scan/Repair, Scan Streams.
- Display previews for images/videos via lazy tooltip (`ui.tooltip`).
- Update HUD dynamically when posts are added/processed.

### 5. Download System
- Implement `downloadPost(postData, statusContainer)`:
  - Resolve all links for the post.
  - Handle duplicate prevention, folder structure, and custom filenames.
  - Integrate zip creation (`JSZip`) and optional `links.txt` and `log.txt`.
  - Provide per-file progress bars and overall progress.
  - Support Firefox vs non-Firefox behavior for downloads.
  - Use `GM_download` for direct file saves.

### 6. Bulk Operations
- `copyAllResolvedUrls`:
  - Filters by type (`all/images/videos/documents/compressed`).
  - Supports formats: plaintext, JSON, Markdown.
  - Copies to clipboard and updates HUD.
- `exportResolvedUrls`:
  - Show modal with filter, format, and detail options.
  - Export to CSV, JSON, or Markdown.
  - Include optional context and thumbnails.
- `scanAndRepairResolvedUrls`:
  - Check all resolved links via HEAD requests.
  - Attempt protocol toggling or minor rewrites for broken links.
  - Copy repaired links to clipboard.
- `scanM3u8Streams`:
  - Parse playlists, display selectable variants.
  - Generate and copy ffmpeg commands per variant.

### 7. Plugin Architecture
- Load inline, script, or URL-defined plugins.
- Normalize plugin definitions: `hosts`, `resolvers`, `fixers`.
- Register plugins dynamically to extend parsing and resolution.
- Maintain error logging for plugin failures.

### 8. Settings Management
- Persist global settings via `GM_setValue` / `GM_getValue`.
- Settings include:
  - App mode (`forum` / `general`)
  - Default download options (zipped, flatten, generate links/log, skip duplicates)
  - Generic media detection toggle
  - GoFile token
  - Plugin sources
- Provide Settings HUD panel with live-save and reload capability.

### 9. Event Handling & Safety
- Warn user on page unload if downloads are in progress.
- Handle dynamically added posts in Flarum via `MutationObserver`.
- Ensure tooltips, buttons, and modals are interactive and non-blocking.
- Update HUD in real-time when resolved links or generic media are added.

### 10. Logging & Debug
- Structured logging via `log` object with `post` and `host` context.
- Store logs per post for download generation.
- Include severity levels: info, warn, error.
- Use console output for developer visibility.

---

## Deliverables
1. Full userscript (`LinkMasterΨ2`) with all above functionality integrated.
2. Persistent settings management.
3. Fully operational HUD for forum and general modes.
4. Download system with zip and progress tracking.
5. Clipboard/export utilities with filtering.
6. Robust resolver/fixer logic with plugin support.
7. Comprehensive logging and error handling.

---

## Notes
- Strictly maintain canonical host/resolver definitions.
- Avoid duplicate downloads.
- All async operations must be properly awaited.
- Preserve UI/UX consistency for both light/dark themes.
- Ensure all features are fully production-ready.