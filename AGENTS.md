# Agents

## Core Feature Expansion Objectives

>We are extending codex.user.js with eight advanced utility modules, fully integrated into the existing HUD ecosystem:

1.	Fix Dead/Broken URLs
	•	HUD Integration: Button 🔧 Check/Fix URLs in Scrape tab, next to Download/Copy.
	•	Functionality:
	•	Async HEAD/GET requests on all resolved URLs.
	•	Auto-rewrite rules: known patterns (.su ↔ .cr, cdnX → streamX).
	•	Color-coded status: Green = live, Yellow = rewritable, Red = dead.
	•	Hover tooltip: shows original + suggested fix.
	•	Optional auto-apply fixes with user toggle.

2.	Copy All URLs
	•	HUD Integration: Button 📋 Copy All URLs.
	•	Functionality:
	•	Supports filters: all, images only, videos only, documents, compressed archives.
	•	Copies to system clipboard via GM_setClipboard.
	•	Output formats: plaintext (one URL per line), JSON, optional Markdown.

3.	Batch Open / Download
	•	HUD Integration: Button 🌐 Open/Download All.
	•	Functionality:
	•	Open all resolved URLs in new tabs (throttle configurable, default: 5 at a time).
	•	Alternatively, queue direct downloads for all enabled hosts.
	•	Integrates with postSettings to respect zipped/flattened download options.

4.	Smart Export
	•	HUD Integration: Dropdown or button menu Export.
	•	Formats:
	•	CSV: URL, Type, Host, FolderName
	•	JSON: structured array of resolved objects
	•	Markdown: [AltText](URL) for images/videos
	•	Options: Links Only, Links + Context, Links + Thumbnails

5.	M3U8 Sniffer/Parser
	•	HUD Integration: Optional toggle or button in Scrape/Check tabs.
	•	Functionality:
	•	Scan page for .m3u8 manifests.
	•	Auto-parse best candidate.
	•	Provide resolution picker (720p, 1080p).
	•	Generate ready-to-run ffmpeg command snippet for download/stream capture.

6.	Broken Link Detector
	•	HUD Integration: Persistent badge on HUD header, colored by link health (Green/Yellow/Red).
	•	Functionality:
	•	Async validation for every URL.
	•	Filters: show only good, bad, or unknown links dynamically.
	•	Updates real-time as user navigates or resolves new links.

7.	Quick Regex Filter/Search
	•	HUD Integration: Search input in Scrape tab toolbar.
	•	Functionality:
	•	Filters visible URLs by substring, regex, type, or file size.
	•	Instant UI feedback; highlights matches and updates download counter.

8.	Custom Per-Host Plugins
	•	HUD Integration: Admin/Settings tab: Plugin Loader.
	•	Functionality:
	•	External JSON/JS host parsers dynamically loaded.
	•	Auto-update or manually push “host fixers.”
	•	Supports crowd-sourced rule contributions for new or changing hosts.

***

2. UI/UX Integration
	•	HUD Buttons: Align new features alongside existing Download Selected, Configure & Download.
	•	Progress Indicators: Reuse ui.pBars for async URL checks and batch downloads.
	•	Status Labels: Use ui.labels.status.createStatusLabel() for real-time feedback.
	•	Tippy Popovers: Tooltips for all new buttons, showing counts, preview snippets, and fixes.

***

3. Data Flow & Canonical Structures
	•	All resolved URLs must continue to conform to { url, folderName, host, original }.
	•	Broken/fixed URLs tracked separately with a boolean flag fixed: true/false.
	•	Export and clipboard operations act on flattened arrays of canonical URL objects.
	•	Async operations must not mutate shared state; use cloned structures or map-reduce patterns to ensure concurrency safety.

***

4. Codex Environment Startup

# Codex Env Initialization for HUD Feature Expansion
export NODE_ENV=production
export GM_XHR=true
export GM_DOWNLOAD=true
export GM_CLIPBOARD=true

# Dependencies
npm install tippy.js jszip file-saver sha256 m3u8-parser

# Preload custom resolvers / host fixers
curl -s https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js -o ./lib/sha256.min.js
curl -s https://cdn.jsdelivr.net/npm/m3u8-parser@4.7.1/dist/m3u8-parser.min.js -o ./lib/m3u8-parser.min.js

***

5. Edge Considerations
	•	Respect user throttle limits to prevent browser crashes.
	•	Async broken-link fixes must not block download flow; UI must be non-blocking.
	•	Clipboard export must handle thousands of URLs without truncation.
	•	Regex filter should avoid catastrophic backtracking; sanitize user input.
	•	Plugins: sandbox externally loaded scripts to prevent DOM corruption or infinite loops.

***

6. Logging & Akashic Tracking
	•	All new operations must integrate with window.logs, tagging [Ψ-4ndr0666:BrokenFix], [Ψ-4ndr0666:CopyAll], [Ψ-4ndr0666:M3U8].
	•	HUD toast feedback for every operation completion.
