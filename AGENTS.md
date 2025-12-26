# LinkMasterΨ2 - Agent Instructions for Feature Completion

## Purpose
Integrate missing or incomplete features into the existing `LinkMasterΨ2` UserScript to match the full desired feature set.

## Features to Complete

### 1. Broken Link Detector Enhancements
- HUD badge per post: color-coded (green/yellow/red) for link status.
- Filter links displayed in HUD based on status (good/bad/unknown).
- Improve auto-suggestion for trivial transformations:
  - `.su ↔ .cr`
  - `cdnX → streamX`
  - `cyberdrop /a/ → /e/`
  - Any other trivial host-specific rewrites.

### 2. Quick Regex Filter / Search
- Provide HUD input for live filtering:
  - By substring
  - By regex
  - By type (image/video/document/compressed)
  - Optional: size filter if content-length available
- Filtering must update HUD display dynamically without resolving links again.

### 3. Custom Per-Host Plugin Loader
- Support external per-host plugin JS files:
  - Allow auto-discovery or manual drop-in
  - Each plugin can provide:
    - Host patterns
    - Resolver functions
    - Optional fixers
- Plugin system must integrate with existing `resolvers` logic.
- Must support adding/updating without redeploying main script.

## General Requirements
- All new features must respect existing `parsedPosts` and `globalConfig`.
- Preserve HUD styles and existing UI interactions.
- Maintain compatibility with Firefox and Chrome.
- Use existing utility helpers (`h`, `ui`, `log`) wherever possible.
- Ensure async operations show progress bars and update status labels.

## Deliverables
- Updated UserScript with completed features.
- New or updated functions must be fully integrated with HUD.
- Any new configuration options must be persisted in `GM_setValue('linkmaster_settings', ...)`.
- Must retain all prior functionality: scraping, per-post downloads, copy/export, m3u8 parser, etc.