# 4ndr0tools - Hailuo++ (GUP v5.3 Revision)

## Deliverable

**`4ndr0tools-HailuoPlusPlus-v5.3.0.user.js`** — revision **v5.3.0**, hardened for the 2026-09 MiniMax H3 site generation and the `hailuoai.video/agent` chat surface, now with the **Asset Bay**: a non-interrupting capture system that replaces the window-hijacking auto-download.

> Filename is intentionally URL-safe (no spaces/`+`) so the download link resolves. The script's internal `@name` remains `4ndr0tools - Hailuo++`, so Tampermonkey shows the original identity after install.

Validated under Golden Unit Protocol v5.3 with **two proof gates, both PASS**:
- Chained gate (upstream baseline → v5.3.0): 16 UNCHANGED / 17 CHANGED / 23 NEW / 0 MISSING, 40 reviewed units.
- Cycle-local gate (v5.2.0 → v5.3.0): 27 UNCHANGED / 11 CHANGED / 18 NEW / 1 authorized removal (`dispatchFallbackAnchorDownload`), 30 reviewed units.
- Alignment bidirectional: 17/17/17 declarations = observations = bindings.

## The defect this cycle fixes (root cause)

On `/agent`, assets are plain `cdn.hailuoai.video` images with no rendered download control, so v5.2.0's auto fetch fell back to clicking a cross-origin `<a download>` anchor. Browsers only honor the `download` attribute for **same-origin / `blob:` / `data:`** URLs (or `Content-Disposition: attachment` responses) — the CDN serves media inline, so the click **navigated your tab** and took over the working window. The console shows nothing when this happens: a navigation is not a console event, which is why your capture looked clean while the session still got hijacked.

## What v5.3.0 does instead — the Asset Bay

1. **Capture, never navigate.** With Auto Fetch Asset on, completed media without a native download control is captured into the **Asset Bay** — an in-HUD gallery. Native download buttons (home feed / own posts) are still clicked directly as before.
2. **Clickable thumbnails → new window.** The bay bar appears above the action matrix as a horizontal strip of 56px thumbnails (with an IMG/MP4 badge and a flash animation on each new capture). Click any thumbnail and the asset opens in a **new window** (`_blank` + `noopener`) — your session window is never touched.
3. **Playable previews, resurrected.** Hover a thumbnail for a floating playable preview: images enlarge; videos play muted and looping. (The old hover-preview system lives again — this time scoped to the bay instead of chimera-ing onto card overlays.)
4. **Expand the bay** (count button) for a 3-column grid with per-asset actions:
   - **SAVE** — true download via the blob pipeline (below), button shows `SAVED`/`NEW WIN` feedback.
   - **COPY** — copies the asset URL to the clipboard (`COPIED`/`BLOCKED` feedback).
   - **SAVE ALL** — sequential blob downloads of everything not yet in the tracked archive.
   - **CLEAR** — empties the gallery.
5. **The blob pipeline (`downloadAssetViaBlob`).** Real downloads go: `GM_xmlhttpRequest` (blob, cross-origin via the new `@grant`/`@connect` header entries) → `URL.createObjectURL` → a **same-origin `blob:` anchor** whose `download` attribute is honored → file saved, zero navigation. If the transport fails, the asset **escalates to a new window** — the "at least" behavior you asked for — never the active tab.
6. **Dedup stays honest.** The persistent tracked archive (TRACKED ARCHIVE SIZE) now only records *actual downloads*. Bay captures dedup in-memory per session, so nothing re-captures on re-sweeps, and previously-downloaded assets aren't re-fetched.
7. **LINK overlays unchanged** (click → new window, hover → preview) — they're now consistent with the bay philosophy instead of being its chimera.

## Install

1. Open the Tampermonkey dashboard.
2. If a previous version is installed, open it in the editor, select-all, replace with this file's contents, and save (preserves your GM_setValue state). Otherwise create a new script from this file.
3. Navigate to `https://hailuoai.video/agent` — the HUD should boot; first console line ends with `Build 5.3.0.`.

> If Tampermonkey asks once about cross-domain requests, allow it — the header already declares `@connect cdn.hailuoai.video` (+ sibling hosts) so blob downloads run without further prompts.

## What to verify while testing

- **Version stamp**: first console line ends `Build 5.3.0.`; HUD footer shows `v5.3.0`.
- **On /agent**: generate an image → the Asset Bay bar appears with a thumbnail + flash; click the thumbnail → new window (session untouched); hover → enlarged preview; expand → SAVE downloads a real file (`hailuo-<name>-<timestamp>.<ext>`); COPY puts the CDN URL on your clipboard.
- **The critical regression**: enable Auto Fetch Asset and let assets complete — **your tab must never navigate away**. Watch the address bar while captures happen.
- **On /create and the home feed**: behavior unchanged (create control, 30-card feed binding, native download chain, queue parsing); LINK overlays still open new windows.
- **Dedup**: leave Auto Fetch on across sweeps — each asset captures once; SAVE then TRACKED ARCHIVE SIZE increments.

## Known residuals (documented, ACCEPTED)

- Own-feed download control and failure-card text surface remain credential-walled on classic pages; agent-surface completion has no percentage, so the 90% completion notification does not fire on `/agent` (title-state only).
- Free-form agent failure prose (e.g. safety-filter retries) is intentionally NOT masked — only the evidenced fixed-format error pill is.
- Bay items are session-scoped by design (CDN URLs can expire; broken thumbs show an EXPIRED state). Everything actually saved is recorded in the persistent tracked archive.
- If a CDN asset's transport is blocked entirely (network/extension), SAVE escalates to a new window rather than a download — the documented "at least" floor.

## Reading the console (field triage)

Red `net::ERR_BLOCKED_BY_CLIENT` entries are your ad-blocker blocking trackers (GTM, Bing, TikTok, Facebook) and one Firebase login refresh (`identitytoolkit.googleapis.com`) — the `Counter-survillance.user.js` stack frames are just its XHR wrapper appearing in the stack, not the cause. WebGL deprecation notices are Chrome-internal; the Slate "Cannot get start point" error is the site's own editor bug. From v5.3.0, useful script lines include `[INFO] Asset captured into bay: <url>` (each capture) and `[INFO] Bay asset download dispatched via blob pipeline (zero navigation): <file>` (each real download). Post-boot silence otherwise is expected: the engine idles until you toggle Auto Fetch / Auto Generate on the HUD.
