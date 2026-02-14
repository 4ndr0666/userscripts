# 4ndr0tools – Blob2Url v6.1
**Ultimate hardened blob: exfiltration + universal asset sniffer**  
**Namespace**    https://github.com/4ndr0666/userscripts  
**Author**       4ndr0666  
**Version**      6.1
**Match**        *://*/* (activates on every page)  
**Grants**       GM_addStyle, GM_registerMenuCommand, GM_setClipboard, GM_xmlhttpRequest, GM_download, @connect *

## Core Mission Profile
Bypass CORS/CSP restrictions on `blob:` resources  
Force direct filesystem exfiltration via GM_download  
Provide interactive reconnaissance/sniffing of any element's src/href/background-image  
Maintain minimal footprint — no external dependencies, no persistent storage

## Automatic Features (Passive / Always-On)

### Blob Resource Auto-Detection & Extraction Buttons
- Script scans entire DOM (initial + MutationObserver live updates)
- Targets: `<a href="blob:…">`, `<img src="blob:…">`, `<video src="blob:…">`, `<audio src="…">`, `<source src="blob:…">`
- Injects small neon-green button **Ψ_EXTRACT** immediately after each matching element
- Button states:
  - **Ψ_EXTRACT**     → ready
  - **Ψ_PROC…**       → fetching (grayed)
  - **Ψ_DONE**        → success (green glow)
  - **Ψ_ERR**         → failure (red glow)

**How to use:**
1. Navigate to any page containing blob: URLs (common on media-heavy sites, canvas exports, webcam captures, PDF viewers, etc.)
2. Look for small **Ψ_EXTRACT** buttons next to images/videos/links
3. Click button → silent background fetch → direct disk save as `exfiltrated_TIMESTAMP.ext`
   - Supported extensions: .mp4, .webm, .png, .jpg, .webp, .pdf, .bin (fallback)

**Stealth notes:**
- Uses GM_xmlhttpRequest → ignores page CSP/fetch restrictions
- Uses GM_download → no temporary <a> element → bypasses form-action / sandbox CSP directives
- Cleanup: object URL revoked immediately after download

## Manual Reconnaissance Mode – Universal Sniffer

### Activation
Three equivalent methods:

1. **Menu command**  
   Violentmonkey / Tampermonkey menu → **Ψ: Toggle Universal Sniffer**

2. **Hotkey**  
   **Alt + S** (anywhere on page)

3. **Console trigger** (for scripting/automation)  
   ```js
   window.dispatchEvent(new KeyboardEvent('keydown', {altKey:true, key:'s'}));
   ```

### Operation
- Green translucent overlay mask appears and follows cursor
- Mask highlights the element currently under pointer (slight padding for visibility)
- Press **Enter** while hovering desired element → URL copied to clipboard
  - Sources checked (in order): `el.src`, `el.href`, CSS `background-image:url(…)`
  - Long URLs truncated in console log (first 100 chars + …)

**Behavior notes:**
- Sniffer **remains active** after capture → rapid multi-element exfil possible
- Toggle off with Alt+S or menu command again
- Console logs:  
  `Sniffer ACTIVE // MOVE CURSOR + ENTER TO CAPTURE`  
  `CAPTURED → clipboard: https://…`  
  `No URL detected` (if element has no extractable resource)

### Force Re-Scan (Edge Cases)
Menu command: **Ψ: Force DOM Re-scan**  
Useful when:
- Page uses heavy shadow DOM / iframes not caught by top-level observer
- Lazy-loaded content appears after initial scan
- You manually want to re-instrument without reload

## Console Visibility
All operations logged with styled output:  
`[Ψ-blob2url] message` (neon green + gray)

Example startup:  
`Ψ-4ndr0tools - blob2url_v6.1_ONLINE`

## Security & Evasion Posture
- Zero `@require` / external scripts
- No localStorage / IndexedDB / cookie writes
- No network calls except GM_download (to blob: data URL → local filesystem)
- Script vanishes on disable / browser close
- Button / mask z-index extremely high (2147483647) → overlays most page content

## Known Compatible Environments
- Tampermonkey (Chrome / Edge / Firefox)
- Violentmonkey (preferred – better GM_download reliability)
- FireMonkey (partial – test GM_download)

## Troubleshooting
- No buttons appear? → Page has no `blob:` resources or CSP blocked script injection
- Download fails? → GM_download permission denied (rare – re-install extension)
- Sniffer mask not moving? → Check console for uncaught errors (should be none in v6.1)
- Hotkey not working? → Page may capture Alt+S – use menu instead
