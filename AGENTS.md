# Agents

Target File: codex.user.js
Objective: Integrate advanced HUD utilities and post-processing features into the existing codex.user.js userscript without breaking existing functionality. Preserve all canonical host resolvers, scraping logic, and download flows.

1. Feature Integration

1.1 Dead/Broken URL Fixer
	•	Add a HUD button: Fix URLs
	•	Async ping all links in the current post selection
	•	Color-code links in the HUD:
	•	Green: Alive
	•	Yellow: Possibly fixable (pattern-based auto rewrite)
	•	Red: Dead
	•	Auto-suggestion for known transformations (.su ↔ .cr, cdnX → streamX, etc.)
	•	Must not block other HUD functionality; async updates only.

1.2 Copy All URLs
	•	Add Copy All HUD button
	•	Optional filtering: All, Images only, Videos only
	•	Uses GM_setClipboard
	•	Copy format options:
	•	One-per-line plaintext (default)
	•	JSON array
	•	Optional: include folder/host metadata

1.3 Batch Open / Download
	•	Open All / Download All buttons in HUD
	•	Optional throttling (configurable, default 5 simultaneous tabs/downloads)
	•	Integrates with resolved URL queue from resolvePostLinks

1.4 Smart Export
	•	Export formats: CSV, JSON, Markdown
	•	Options:
	•	Links only
	•	Links + context
	•	Links + thumbnails
	•	Include proper escaping and encoding for CSV/Markdown
	•	Use HUD modal for export selection

1.5 M3U8 Stream Utility
	•	Detect and list all m3u8 URLs
	•	Offer stream selection and resolution picker
	•	Copy ffmpeg command to clipboard for each selection
	•	Include error handling for invalid playlists

1.6 Broken Link Detector
	•	Built-in async checker for all resolved links
	•	HUD badge indicator per post: Green / Yellow / Red
	•	Clickable filter in HUD to show only good/bad/unknown links

1.7 Regex/Substring Search
	•	Quick filter input in HUD for visible links
	•	Supports: substring, regex, type (image/video), size filtering
	•	Updates the list dynamically without blocking other HUD interactions

1.8 Custom Per-Host Plugins
	•	Externalize host parsing into plugin folder or object array
	•	Allow runtime addition or update of parsers without touching core script
	•	Include hook to register new host resolver and optional “fixer” logic

⸻

2. HUD Integration Requirements
	•	All new buttons appear alongside existing Configure & Download and post settings
	•	Async operations must show progress bars (per file + total)
	•	Status messages update in real-time
	•	Maintain tooltip previews (images/videos) while adding new buttons
	•	Maintain full compatibility with Forum Mode and General Mode

⸻

3. Technical Notes
	•	Preserve all current resolver logic and resolvePostLinks flow
	•	Maintain compatibility with Firefox and Chrome (GM_* APIs)
	•	Use Promise.all or controlled async queue for batch operations to prevent memory overload
	•	Avoid overwriting previously cached URL transformations or folder names

⸻

4. Validation/Testing
	•	Ensure all new HUD buttons function correctly
	•	Test batch operations on posts with multiple image/video hosts
	•	Test copy/export functions across Firefox/Chrome
	•	Test m3u8 detection + ffmpeg command generation on sample streams
	•	Test Dead/Broken URL fixer with known transformable patterns

⸻

5. Startup/Environment
	•	Standard Codex environment with Node.js >=18 and browser emulation enabled
	•	Required modules preloaded: GM_* APIs, JSZip, tippy.js, sha256, FileSaver
	•	Script is self-contained, no external calls outside resolvers and API endpoints