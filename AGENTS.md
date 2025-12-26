# Work Order: LinkMasterΨ2 — Optimization, Hardening, and Feature Enhancements

## Task Overview
This work order outlines a set of recommended improvements, optimizations, and architectural refinements for the **LinkMasterΨ2 UserScript**. The goal is to enhance robustness, performance, user experience, and maintainability while preserving the full breadth of scraping, resolving, and downloading functionality.

---

## 1. Performance Enhancements

### 1.1 Lazy-Load Media Previews
- **Issue:** Previews (images/videos) are generated for all resources upfront. For posts with many resources, this increases memory usage and DOM nodes significantly.
- **Recommendation:** Implement lazy-loading:
  - Only generate previews when a user hovers over a post.
  - Use `IntersectionObserver` or deferred DOM population.
- **Technical Implementation:**
  - Modify `generatePreviewContent` in `renderScrapePanel` to populate children on first hover.
  - Remove the DOM elements from tooltip when hidden to free memory.

### 1.2 Throttled HTTP Requests
- **Issue:** Bulk link resolution (`resolveAllPosts`) currently initiates many concurrent HTTP requests.
- **Recommendation:** Introduce concurrency limits to prevent browser memory overuse and host rate-limiting.
- **Technical Implementation:**
  - Implement a promise pool with a configurable concurrency limit (e.g., 5–10 concurrent requests).
  - Ensure link resolution promises queue properly and continue once a slot is available.

### 1.3 Persistent Resolved Link Cache
- **Issue:** Resolving links per page load may redundantly re-fetch previously resolved links.
- **Recommendation:** Implement persistent caching across sessions.
- **Technical Implementation:**
  - Store `resolvedCache` and `linkStatusCache` in `GM_setValue` on unload.
  - Reload caches on script initialization using `GM_getValue`.
  - Maintain cache invalidation by timestamp or page-specific key.

---

## 2. Reliability & Robustness

### 2.1 Error Handling for Resolvers
- **Issue:** Host resolvers can fail silently or throw uncaught exceptions, halting resolution for a post.
- **Recommendation:** Wrap all resolver calls in `try/catch` blocks and log failures gracefully.
- **Technical Implementation:**
  - Standardize error reporting with `log.host.error`.
  - Ensure unresolved links are still processed, marking status as `Error`.

### 2.2 FFmpeg Command Generation Validation
- **Issue:** `buildFfmpegCommand` assumes URLs and filenames are safe and valid.
- **Recommendation:** Add comprehensive sanitization and validation.
- **Technical Implementation:**
  - Escape spaces and special characters.
  - Ensure file path separators are platform-safe.
  - Validate URI via `encodeURI` or `encodeURIComponent` as needed.

### 2.3 Plugin Load Feedback
- **Issue:** Plugin loading errors are logged to console but not surfaced in UI.
- **Recommendation:** Provide user-visible notifications for failed plugin loads.
- **Technical Implementation:**
  - Display toast messages with source URL and error summary.
  - Maintain a plugin status panel in settings for success/failure.

---

## 3. UX & Usability Improvements

### 3.1 Bulk Operations Feedback
- **Issue:** During bulk downloads or resolution, users may not know exact progress.
- **Recommendation:** Enhance progress bars and status labels.
- **Technical Implementation:**
  - Display per-host resolution count.
  - Show a dynamic queue or estimated time remaining.
  - Color-code progress based on successful vs failed resolutions.

### 3.2 Filter Enhancements
- **Issue:** Quick Filter only supports substring and regex; additional metadata is ignored.
- **Recommendation:** Expand filters to include:
  - Host name
  - Post number
  - Folder name
  - File size ranges
- **Technical Implementation:**
  - Extend `quickFilterState` with new filter keys.
  - Update `renderQuickFilterResults` to apply additional conditions.

### 3.3 Settings Persistence Enhancements
- **Issue:** Changing settings requires page reload to apply.
- **Recommendation:** Apply critical settings dynamically where possible.
- **Technical Implementation:**
  - Dynamically update `globalConfig` without reloading the page.
  - Re-initialize post parsing and plugin registration on-the-fly.

---

## 4. Architectural & Code Quality Improvements

### 4.1 Modularization
- **Issue:** Script is monolithic (~10k+ lines), making maintenance and debugging difficult.
- **Recommendation:** Break into modules:
  - `core` (utility functions, status cache)
  - `ui` (HUD, tooltips, modals)
  - `resolvers` (per-host resolvers)
  - `downloadManager` (download/zip logic)
  - `plugins` (plugin loader, register, fixers)
- **Technical Implementation:**
  - Use ES Modules or IIFE submodules.
  - Expose only essential APIs to the global script.

### 4.2 Typed Structures & Documentation
- **Recommendation:** Introduce TypeScript or JSDoc annotations for key objects:
  - `ParsedPost`, `HostResource`, `ResolvedLink`, `PluginDefinition`.
- **Benefit:** Easier onboarding, reduced runtime errors, clearer plugin interface expectations.

### 4.3 Enhanced Logging
- **Recommendation:** Add log levels and structured formatting.
- **Technical Implementation:**
  - Differentiate `INFO`, `WARN`, `ERROR`, `DEBUG`.
  - Allow export of logs per session or per post.

---

## 5. Security Considerations

### 5.1 Sanitization of External Data
- **Issue:** Inline HTML or external plugin data may be unsafe.
- **Recommendation:** Ensure tooltips, modals, and previews sanitize content.
- **Technical Implementation:**
  - Escape user-generated content in tooltips.
  - Use DOMPurify or manual sanitization before injecting into HUD.

### 5.2 Temporary Token Handling
- **Issue:** Redgifs token or GoFile token may be exposed.
- **Recommendation:** Mask sensitive data in UI, limit storage to script-level persistence.
- **Technical Implementation:**
  - Store tokens in `GM_setValue` with restricted scope.
  - Avoid displaying full token in settings textarea.

---

## 6. Optional Enhancements

1. **Batch Download Scheduling**
   - Queue downloads with rate-limiting.
   - Optionally resume after tab reload.
2. **Preview Enhancement**
   - Support animated GIFs, WebP, or live video thumbnails.
3. **Host Health Monitoring**
   - Track resolver success/failure over time.
   - Highlight consistently failing hosts in UI.

---

## Deliverables for Codex

- Refactored modules as per **Section 4.1**.
- Lazy-loading for media previews.
- Concurrency-limited HTTP requests.
- Persistent resolved link cache.
- Enhanced error handling and logging.
- UI feedback enhancements for bulk operations and plugin loading.
- Extended quick filter and export functionality.
- Security hardening for tokens and external data.
- Optional: Download queueing and preview enhancements.

---

**Priority:** High — critical for performance, stability, and maintainability.  
**Environment:** UserScript / Tampermonkey / Greasemonkey, modern browsers (FF, Chromium).  
**Dependencies:** JSZip, FileSaver, Popper, Tippy.js, sha256, m3u8-parser.