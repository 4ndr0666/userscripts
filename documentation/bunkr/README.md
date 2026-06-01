# Bunkr++ · Engineering Devlog & Field Intelligence Reference

> **4ndr0tools — Bunkr++ v5.0.1 → v5.5.0**
> A complete forensic record of the development arc: every failure mode, root cause,
> architectural decision, and battle-tested resolution uncovered across this session.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [The Golden Reference Protocol](#2-the-golden-reference-protocol)
3. [Failure Mode Catalogue](#3-failure-mode-catalogue)
4. [Root-Cause Analysis: Stream URL Acquisition](#4-root-cause-analysis-stream-url-acquisition)
5. [The Bunkr State Decoupling Problem](#5-the-bunkr-state-decoupling-problem)
6. [CDN & WAF Evasion Intelligence](#6-cdn--waf-evasion-intelligence)
7. [The 8-Tier Waterfall Engine](#7-the-8-tier-waterfall-engine)
8. [The Battle-Tested Pattern: DOM-First Acquisition](#8-the-battle-tested-pattern-dom-first-acquisition)
9. [Download Mechanics: What Actually Works](#9-download-mechanics-what-actually-works)
10. [IP Binding & Signed URL Constraints](#10-ip-binding--signed-url-constraints)
11. [Key Engineering Decisions Log](#11-key-engineering-decisions-log)
12. [Superset Protocol](#12-superset-protocol)
13. [Version History](#13-version-history)

---

## 1. Architecture Overview

Bunkr++ is a Tampermonkey/Violentmonkey userscript operating across all `bunkr.*`, `bunker.*`, and `bunkrr.*` domains. It is structured as ten discrete modules:

| Module | Responsibility |
|--------|---------------|
| M1 | Canonical routing — redirects variant domains to `bunkr.cr`, enforces sort parameters |
| M2 | System styling — CSS injection, ad-purge rules, glyph aesthetics |
| M3 | Network sniffing — `fetch`/XHR proxy intercepting CDN and `/api/vs` traffic |
| M4 | Sort hijack — polls for and double-clicks the size-sort button on album pages |
| M5 | Forensic tracker — visited-asset registry with DIM/HIDE/SHOW filtration modes |
| M6 | Acquisition utilities — `ghostFetch`, `gmDownload`, `robustCopy`, overlay injection |
| M6.5 | Stream URL resolver — 8-tier waterfall engine for CDN URL extraction |
| M7 | Unified direct acquisition — DL and stream glyphs for single-asset and grid views |
| M8 | Diagnostic probe — full DOM + network state snapshot copied to clipboard |
| M9 | Autonomous gateway bypass — auto-clicks download button on asset and gateway pages |
| M10 | Defensive orchestration — bootstrap, MutationObserver, SPA navigation handling |

---

## 2. The Golden Reference Protocol

Every revision is governed by the **Superset Protocol**: a non-negotiable rule that no previously validated feature may be omitted, weakened, or regressed. Practically, this means:

- A segment-level hash manifest is maintained per version
- Every function name, CSS class, and grant declaration is tracked
- An automated verification script runs against every output before delivery
- **Forward progress is mandatory. Regression is a critical failure.**

The manifest is validated with a Node.js check battery. Example:

```javascript
const checks = [
    ['gmApiRequest',   'gmApiRequest() present'],
    ['NATIVE_DL_SEL',  'NATIVE_DL_SEL battery present'],
    // ... all symbols
];
let fail = 0;
for (const [token, label] of checks) {
    if (!src.includes(token)) { console.error(`[FAIL] ${label}`); fail++; }
}
process.exit(fail > 0 ? 1 : 0);
```

---

## 3. Failure Mode Catalogue

### 3.1 Download glyph opened wrong file (v5.0.x → v5.2.0)

**Symptom:** Clicking the download glyph on an album grid item downloaded a random unrelated file.

**Root cause:** The script constructed a synthetic `https://get.bunkrr.su/file/<numeric-id>` URL using a numeric ID scraped from a `<script data-file-id>` tag. This ID was a *database primary key* for the CDN delivery layer — completely decoupled from the alphanumeric routing hash visible in the grid DOM. The constructed URL was stale, wrong, or belonged to a different asset.

**Resolution:** Abandoned synthetic URL construction entirely. The download glyph now clicks the **native download anchor** already present in the DOM (`a.ic-download-01`, `a[href*="get.bunkr"]`, etc.). The browser's existing authenticated session handles the download. No URL guessing.

**Lesson:** *Do not construct CDN URLs from index-layer identifiers. The index and CDN layers are intentionally decoupled in Bunkr's architecture.*

---

### 3.2 `GM_download` granted but never called (v5.0.x → v5.2.0)

**Symptom:** Files "downloaded" by opening in a new tab rather than saving locally.

**Root cause:** `GM_download` was present in the `@grant` header but every activation path called `window.open(url, '_blank')`. Bunkr's CDN does not consistently send `Content-Disposition: attachment`, so the browser renders the file inline instead of saving it.

**Resolution:** Introduced `gmDownload(url, hint)` helper wrapping `GM_download({url, name, onerror})`. The `onerror` callback falls back to `window.open` so the asset remains accessible even if the userscript manager blocks the download.

---

### 3.3 Stream glyph silently failing — `Referer` stripped (v5.0.x → v5.2.0)

**Symptom:** All autonomous `/api/vs` tiers returned 403. Clipboard copy never fired.

**Root cause:** The browser's Fetch specification classifies `Referer` and `Origin` as [forbidden headers](https://fetch.spec.whatwg.org/#forbidden-request-header). Any `headers: { 'Referer': '...' }` set inside a `fetch()` call is silently stripped before the request leaves the browser. Bunkr's `/api/vs` endpoint enforces a same-site `Referer` check server-side — requests arriving without it receive 403.

**Resolution:** Replaced `origFetch` in autonomous API tiers with `GM_xmlhttpRequest`, which runs in the userscript's privileged context outside the Fetch spec's forbidden-header list. Added `@grant GM_xmlhttpRequest`. All `Referer` and `Origin` headers now transmit correctly.

```javascript
GM_xmlhttpRequest({
    method:  'POST',
    url:     'https://bunkr.cr/api/vs',
    headers: { 'Content-Type': 'application/json', 'Referer': 'https://bunkr.cr/', 'Origin': 'https://bunkr.cr' },
    data:    JSON.stringify({ slug }),
    onload:  (resp) => resolve(JSON.parse(resp.responseText)),
    onerror: (e)    => reject(new Error(JSON.stringify(e))),
});
```

---

### 3.4 M3 `/api/vs` intercept regex too strict (v5.4.0 → v5.5.0)

**Symptom:** Console showed "Tier 0: Polling... (max 2s)" expiring clean. Tier 2 (native API clone) never hit. `/api/vs` was being called by the native player but `directMap` remained empty.

**Root cause:** The M3 fetch proxy tested `reqUrl` against `/\/api\/vs2?($|\?)/` — requiring the URL to terminate immediately after `vs` or `vs2`, or be followed by `?`. Any trailing slash (`/api/vs/`), extra path segment, or unexpected query structure silently bypassed the intercept block.

**Resolution:** Replaced the strict regex with a plain substring test:

```javascript
// Before (misses /api/vs/, /api/vs/slug, /api/vs?other=param&slug=...)
if (/\/api\/vs2?($|\?)/.test(reqUrl)) {

// After (catches all variants)
if (reqUrl.includes('/api/vs')) {
```

---

### 3.5 Tier 0 poll window too short (v5.4.0 → v5.5.0)

**Symptom:** Tier 0 expired before the native player fired its `/api/vs` call, causing the waterfall to fall through to Tier 5–7 (all 404).

**Root cause:** The native player's JS bundle lazy-loads after the SPA hydrates. On connections with ad-blocker overhead, this routinely takes 2–4 seconds. Tier 0 was polling for only 2 seconds (10 ticks × 200 ms), consistently losing the race.

**Resolution:** Extended to 5 seconds (25 ticks × 200 ms):

```javascript
// 25 × 200ms = 5s budget
if (directMap.has('native_api_resolved') || directMap.has('m3u8_stream') || ++ticks >= 25) {
```

---

### 3.6 The iframe cross-origin signing bridge (v5.3.6 anti-pattern)

**Symptom:** Tier 5 (iframe to `glb-apisign.cdn.cr/sign`) always failed silently.

**Root causes (two distinct issues):**

1. **CORS block:** The iframe was set to `about:blank` and injected a `<script>` that `fetch()`'d the signing endpoint cross-origin. An `about:blank` frame has a null origin — cross-origin `fetch` from null origin is blocked by CORS with no possible workaround from within the page's JS context.

2. **IP binding:** Even if the request succeeded, the signed token is computed as `MD5(ClientIP + MediaUUID + SecretSalt + ex)`. Any tool that opens the URL from a *different network context* (different IP, proxy, external machine) receives a silently-suppressed 404. The server masks 403 responses to prevent reverse engineering.

**Resolution:** Replaced the iframe bridge with `GM_xmlhttpRequest` to the same signing endpoint, preserving the UUID extraction logic (OG image meta, `window.videoCoverUrl`, contextElement thumbnail scan). Signed URLs from Tier 8 now display a warning toast:

```
⦒ █▓░URL copied for IP streaming.
```

This documents the constraint to the user: the URL is valid only in the same browser session that requested it.

---

### 3.7 Tier 3 reading `video.src` instead of `video.currentSrc` (v5.4.0 → v5.5.0)

**Symptom:** Even when the native player was running and the video was visibly playing, Tier 3 returned nothing because `video.src` was empty or a `blob:` URI.

**Root cause:** Bunkr's player sets `video.src` to a `blob:` object URL (a local media source handle), not a CDN URL. `video.src` is therefore always `blob:https://...` and was correctly filtered out. However, `video.currentSrc` — set by the browser's media engine to the *actual fetched URL* — contains the real CDN endpoint.

**Resolution (ported from LinkMasterΨ battle-tested pattern):**

```javascript
const vidEl = document.querySelector('video');
if (vidEl) {
    // currentSrc = what the browser actually fetched (CDN URL, never blob:)
    const cSrc = vidEl.currentSrc;
    if (cSrc && !cSrc.startsWith('blob:') && cSrc.startsWith('http')) {
        return cSrc;  // Tier 3a — fastest DOM path
    }
    const srcEl = vidEl.querySelector('source[src]');
    if (srcEl?.src && !srcEl.src.startsWith('blob:')) return srcEl.src;  // Tier 3b
    if (vidEl.src && !vidEl.src.startsWith('blob:')) return vidEl.src;   // Tier 3c
}
```

---

## 4. Root-Cause Analysis: Stream URL Acquisition

### The fundamental problem

Bunkr encrypts the CDN streaming URL server-side and delivers it only through a `/api/vs` API call initiated by the native player after page load. The encryption algorithm (from `player.enc.js`) is:

```
key    = 'SECRET_KEY_' + Math.floor(timestamp / 3600)   // v1 key scheme
       | String(Math.floor(timestamp / 3600))             // v2 key scheme (2026)
bytes  = atob(encrypted_url) → charCodeAt → Uint8Array
result = XOR(bytes, TextEncoder(key), cyclic)
output = TextDecoder(result)
```

The key rotates every hour. The timestamp is supplied by the API response itself, making the decryption self-contained once you have the response.

### Why autonomous API calls fail

After mid-2025, Bunkr's server enforces a `Referer` check on `/api/vs`. Requests from browser JS without a valid `Referer` (or with it stripped by the Fetch spec) return 403. The XOR algorithm itself is correct — the delivery mechanism was the failure.

### Why Tier 0 (native intercept) is the right primary path

The native player makes the `/api/vs` call with full browser context (cookies, headers, correct `Referer`). M3's fetch proxy intercepts the response and stores the decrypted URL in `directMap`. When the stream glyph is clicked *after* the player has loaded, Tier 2 returns the result instantly. The extended Tier 0 poll handles the race when the glyph is clicked *during* player initialization.

---

## 5. The Bunkr State Decoupling Problem

This is the single most important architectural insight in the entire codebase.

### The two-layer system

```
LAYER 1 — Visual Index (Grid / Album DOM)
  Identifier: alphanumeric slug   e.g. /f/unuyLInJZHx3h
  Purpose:    routing pointer / obfuscated navigation hash
  Exposed in: DOM anchors, URL path
  Relationship to CDN: NONE DIRECT

LAYER 2 — CDN Delivery (Asset Database)
  Identifier: integer primary key  e.g. 48458069
  Purpose:    canonical database ID, CDN token seed
  Exposed in: gateway page DOM, /api/vs response
  Relationship to index: DELIBERATELY DECOUPLED
```

### Why heuristic concatenation fails

You cannot derive the integer CDN ID from the alphanumeric slug by any pattern or hash function. They are independent identifiers in separate subsystems. Any attempt to construct `https://cdn.bunkr.cr/file/48458069.mp4` from `unuyLInJZHx3h` will fail — the numeric ID is not present in the index DOM.

### The Async Ghost Fetch solution

The resolution is the `ghostFetch()` function: asynchronously fetch the intermediate gateway page (`/f/<slug>`) in the background, parse its DOM for the actual download anchor (`a[href*="get.bunkr"]`, `a.ic-download-01`), cache the resolved URL, and return it before the user has finished clicking. The gap is crossed programmatically, not heuristically.

```javascript
async function ghostFetch(href, fname) {
    const res = await origFetch(href, { signal: controller.signal });
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const dlAnchor = doc.querySelector('a[href*="get.bunkr"], a.ic-download-01, ...');
    if (dlAnchor?.href) return dlAnchor.href;
    // ... additional fallback selectors
}
```

**Corporate red-team framing of this problem:**
> *"We identified a critical state decoupling between the frontend routing matrix and the backend CDN delivery endpoints. The primary index utilizes obfuscated alphanumeric hashes for navigation, while final asset delivery requires canonical database primary keys (integer IDs). Because the primary keys are not exposed in the index DOM, heuristic concatenation failed. We resolved this by implementing an Asynchronous Endpoint Resolution protocol. The script proactively fetches the intermediate gateway payload in the background to dynamically resolve and cache the canonical CDN delivery URL prior to user interaction, bypassing the routing obfuscation entirely."*

---

## 6. CDN & WAF Evasion Intelligence

### 6.1 HEAD request suppression

CDNs and image hosts actively return false 404/403 responses to `HEAD` requests to mitigate automated scraping. `mode: 'no-cors'` fetch results are always `type: 'opaque'` — you cannot read status codes from them, making them useless for link validation. The only reliable probe is a full `GET` with browser-realistic headers.

### 6.2 Referer enforcement

**Root domain as Referer is flagged.** Edge servers expect the immediate parent page (the gallery/album page) as the `Referer`, not the bare domain. Providing `https://bunkr.cr/` when the asset is being served from an album context may pass, but providing no `Referer` at all is instantly rejected. Always set:

```
Referer: https://bunkr.cr/
Origin:  https://bunkr.cr
```

### 6.3 WAF bot fingerprinting

Modern media hosts fingerprint the absence of browser metadata headers:

- `Sec-Fetch-Dest`
- `Sec-Fetch-Mode`
- `Sec-Fetch-Site`
- `Sec-Ch-Ua` family

A bare `fetch()` or `XMLHttpRequest` missing these headers is classified as a bot and routed to a 404 honeypot. `GM_xmlhttpRequest` in privileged mode can set these headers; browser `fetch()` cannot set `Sec-*` headers (they are forbidden).

### 6.4 Range request poisoning (aria2c / multi-connection downloads)

When a download tool opens multiple concurrent range-based connections (`-x 16 -s 16`), edge servers detect the anomaly and return deliberately malformed range boundaries:

```
Request:  Range: bytes=0-100000
Response: Content-Range: bytes 0-1249628/1249629
```

This poisons the download stream and forces the client into a deadlocked retry loop. **Mitigation:** disable per-file chunking (`-x 1 -s 1`), maintain concurrency only across files (`-j 16`). This makes each connection indistinguishable from a standard browser fetch.

### 6.5 CDN tarpit attacks

Even with chunking disabled, advanced edge servers accept the TCP connection and then throttle transfer to 0 bytes/second without closing the socket. Standard `--timeout` flags only trigger if *no* data has been received — once a few bytes trickle in, the timer resets and the client waits indefinitely.

**Mitigation:**
```bash
aria2c --lowest-speed-limit=10K --connect-timeout=15
```

This severs and retries any connection that drops below 10 KB/s, refusing to be held in a tarpit.

### 6.6 IP binding on signed CDN tokens

Bunkr's CDN signing service (`glb-apisign.cdn.cr/sign`) generates tokens computed as:

```
token = MD5(ClientIP + MediaUUID + SecretSalt + ex)
```

The token is valid **only for the IP address that requested it**. Copying a signed URL and opening it in a different browser, different machine, or through a proxy will produce a 404 (the server suppresses 403 to obscure the mechanism). The signed URL must be consumed in the same browser session that generated it.

---

## 7. The 8-Tier Waterfall Engine

`getBunkrStreamUrl(slug, contextElement)` resolves the canonical streaming URL through a strictly ordered sequence. Each tier fails fast and falls through to the next.

```
Tier 0 │ Poll directMap for native_api_resolved      │ max 5s (25 × 200ms)
       │ Waits for M3's fetch proxy intercept        │
       │ to catch the native player's /api/vs call   │
───────┼─────────────────────────────────────────────┼──────────────────────
Tier 1 │ directMap['m3u8_stream']                    │ XHR/fetch proxy hit
Tier 2 │ directMap['native_api_resolved']            │ Decrypted /api/vs clone
───────┼─────────────────────────────────────────────┼──────────────────────
Tier 3a│ video.currentSrc                            │ ← BATTLE-TESTED
Tier 3b│ source[src]                                 │   DOM-first pattern
Tier 3c│ video.src (non-blob)                        │   from LinkMasterΨ
───────┼─────────────────────────────────────────────┼──────────────────────
Tier 4 │ window.jsCDN                                │ Server-injected global
───────┼─────────────────────────────────────────────┼──────────────────────
Tier 5 │ POST /api/vs  {slug: slug}                  │ GM_xmlhttpRequest
Tier 6 │ POST /api/vs  {token: slug}                 │ body-key variant
Tier 7 │ GET  /api/vs?slug=<slug>                    │ method variant
───────┼─────────────────────────────────────────────┼──────────────────────
Tier 8 │ GET glb-apisign.cdn.cr/sign?path=...        │ ⚠ IP-bound signed URL
       │ UUID from: OG image meta / videoCoverUrl /  │
       │ contextElement thumbnail scan               │
```

Each of Tiers 5–7 applies `tryXorDecrypt()` with both known key schemes and `unwrapApiPayload()` to handle flat and nested response shapes.

---

## 8. The Battle-Tested Pattern: DOM-First Acquisition

### The insight from LinkMasterΨ

LinkMasterΨ, a companion userscript that reliably produces valid Bunkr URLs across versions, uses **zero API calls** for URL acquisition. Its entire strategy is:

1. Walk `document.querySelectorAll('a[href]')`
2. Decode any confirmation-redirect wrappers (`/goto/link-confirmation?url=...`)
3. Test against known hoster patterns
4. Return the already-rendered, browser-resolved URL

Applied to stream URL extraction, this resolves to `video.currentSrc` — the property set by the browser's media engine to the actual fetched URL:

```javascript
// video.src     → blob:https://bunkr.cr/abc123  (useless)
// video.currentSrc → https://c4s9-b.cdn.cr/storage/media/uuid.mp4  (gold)
```

### Why this works when everything else fails

- The browser already completed the `/api/vs` negotiation to populate `currentSrc`
- No additional network requests needed
- No encryption to reverse
- No IP binding
- No CORS restrictions
- Available immediately once the player has initialized

### Principle

> **Read what the browser already resolved. Don't re-derive what it already computed.**

This is the same philosophy as `decodeConfirmationHref()` in LinkMasterΨ: instead of reverse-engineering redirect chains, read the resolved `href` the browser already decoded.

---

## 9. Download Mechanics: What Actually Works

### Single-asset page (`/v/<slug>`, `/f/<slug>`, `/d/<slug>`)

The native download anchor is already present in the DOM after SPA hydration. Click it directly. No URL construction. The browser's existing authenticated session handles everything.

```javascript
const NATIVE_DL_SEL = [
    'a.ic-download-01',
    'a[href*="get.bunkr"]',
    'a[href*="/file/"]',
    'a[download][href]',
    'a.btn-main[href]',
    '#download-btn',
].join(', ');

document.querySelector(NATIVE_DL_SEL)?.click();
```

`autoEngageDownloadEndpoint()` polls at 500ms intervals with a 1-second initial delay (SPA hydration window) and clicks automatically on page load.

### Grid view (album asset items)

`ghostFetch()` resolves the CDN URL asynchronously in the background when the glyph is first activated, caches it in `dlGlyph.dataset.resolvedUrl`, and calls `gmDownload()` which forces a browser save via `GM_download`.

### `GM_download` vs `window.open`

| Method | Forces save dialog | Works without Content-Disposition | Bypasses CORS |
|--------|--------------------|-----------------------------------|---------------|
| `window.open` | ✗ (plays inline if CDN serves video MIME) | ✗ | N/A |
| `GM_download` | ✓ | ✓ | ✓ |

Always use `GM_download`. Fall back to `window.open` only in `onerror`.

---

## 10. IP Binding & Signed URL Constraints

### The constraint

Bunkr's CDN signing endpoint (`glb-apisign.cdn.cr/sign`) generates a time-limited, IP-bound token:

```
token = MD5(ClientIP + MediaUUID + SecretSalt + ex)
```

The `ex` field is a Unix timestamp representing expiry. The window may be as short as 60 seconds.

### What works

- Opening the signed URL **in the same browser** that requested the token: ✓
- Streaming in a media player running **on the same machine through the same network interface**: may work depending on NAT/proxy transparency
- Using `mpv` or `curl` on the **same machine, same public IP, no proxy change**: may work if within the expiry window

### What reliably fails

- Copying the URL to a **different machine** on a different IP
- Passing through a **VPN or proxy** not active when the token was generated
- Waiting longer than the **expiry window** (sometimes < 60 seconds)

### The server's evasion

The server returns `404 Not Found` (not `403 Forbidden`) for invalid token requests. This obscures the existence of the IP-binding mechanism and wastes scanner time.

### Practical guidance

The stream glyph displays:

```
⦒ █▓░URL copied for IP streaming.
```

This indicates the URL will work in the current browser session. For any external tool use, Tiers 1–3 (intercepted URLs from the native player's own authenticated request) are preferable — those URLs are pre-authorized for the session by the server itself.

---

## 11. Key Engineering Decisions Log

| Decision | Rationale |
|----------|-----------|
| `@include` regex instead of `@match` | Catches all TLD variants (`bunkr.cr`, `bunkr.ru`, `bunkr.si`, etc.) without maintaining an exhaustive list |
| `origFetch` saved before proxy wrapping | Ensures ghostFetch and API calls bypass our own intercept layer, preventing infinite recursion |
| `directMap` as central CDN state | Single source of truth for all intercepted URLs; avoids polling DOM across async gaps |
| FIFO eviction at 10,000 visited entries | Prevents `localStorage` bloat while maintaining a meaningful working set |
| `beforeunload` flush for visited cache | Batches all writes to a single localStorage operation; prevents write storms on heavy pages |
| MutationObserver with 400ms debounce | Catches dynamically injected grid items (infinite scroll) without reprocessing on every DOM tick |
| `_sortExecuted` flag reset on SPA nav | Prevents the sort hijack from firing twice on the same album after a popstate event |
| Tier 0 poll before API tiers | Prioritizes the native player's already-authenticated request over our autonomous calls |
| `video.currentSrc` over `video.src` | `src` is a blob URI; `currentSrc` is the actual fetched CDN URL — fundamental media API distinction |
| `/api/vs` substring match in M3 | Regex end-anchoring silently dropped intercepts on URL variants with trailing slashes or extra params |

---

## 12. Superset Protocol

The development of this script is governed by the **Superset Protocol** — a strict regression-prevention standard.

### Rules

1. Every feature validated in a prior version is considered **permanently locked**
2. Any omission or weakening is classified as a **critical failure**
3. Before any revision ships, an automated token-presence check runs against the full source
4. Version numbers increment on every structural change
5. No placeholders (`// TODO`, `// ... rest of file`), stubs, or orphaned references are permitted in output

### Segment hash approach

```bash
# Split source into 500-line segments
split -l 500 bunkr++.user.js segment_

# Hash each segment
for f in segment_*; do sha256sum "$f"; done > segments.hashes

# Hash entire file
sha256sum bunkr++.user.js > overall.hash
```

Compare against the previous version's manifest. Any segment regression triggers a build failure.

### Checkpoint manifest structure

```json
{
  "version": "5.5.0",
  "timestamp": "2026-05-31T00:00:00Z",
  "overall_sha256": "...",
  "segments": {
    "1-500":    "...",
    "501-1000": "...",
    "1001-1299": "..."
  },
  "symbols": [
    "gmApiRequest", "tryXorDecrypt", "unwrapApiPayload",
    "NATIVE_DL_SEL", "ghostFetch", "getBunkrStreamUrl",
    "isCdnUrl", "classifyCdnUrl", "gmDownload"
  ]
}
```

---

## 13. Version History

| Version | Key Changes |
|---------|-------------|
| **5.0.1** | Original canonical baseline. Four-tier stream waterfall, basic DL glyph, `window.open` for downloads |
| **5.1.0** | Expanded CDN regex (`isCdnUrl`/`classifyCdnUrl`), dual XOR key derivation (`tryXorDecrypt`), `unwrapApiPayload`, ghostFetch expanded selectors (OG video, `source[src]`), Tiers 5–6 added |
| **5.2.0** | `GM_xmlhttpRequest` grant added, `gmDownload` helper, all DL paths switched from `window.open` to `gmDownload`, `Referer` now transmitted via GM XHR for API calls |
| **5.3.0** | M9 extended to `bunkr.cr` asset pages, `NATIVE_DL_SEL` battery, DL glyph native-button click, Tier 0 poll (2s), Tier 7 GET variant, ghostFetch inline `/api/vs` fallback |
| **5.4.0** | Reconciliation with user's v5.3.6 canonical: `@icon`, `@include` regex, `contextElement` param, `window.jsCDN` Tier 4, UUID extraction (OG image/`videoCoverUrl`/element scan), Tier 8 CDN signing (GM XHR, IP-binding warning toast), Ψ-glyph toast aesthetic |
| **5.5.0** | M3 `/api/vs` regex loosened to substring match (fixed silent intercept miss), Tier 0 poll extended to 5s (25 ticks), `video.currentSrc` added as Tier 3a (LinkMasterΨ battle-tested DOM-first pattern) |

---

## Appendix: XOR Decryption Algorithm Reference

Reproduced from `player.enc.js` (`_0x2ad1ff`), verified across both key schemes:

```javascript
function tryXorDecrypt(cipherB64, timestamp) {
    const hourBucket = Math.floor(timestamp / 3600);
    const keyCandidates = [
        `SECRET_KEY_${hourBucket}`,  // v1 — pre-2026
        String(hourBucket),           // v2 — 2026+
    ];
    let firstResult = null;
    for (const key of keyCandidates) {
        try {
            const binaryString   = atob(cipherB64);
            const keyBytes       = new TextEncoder().encode(key);
            const decryptedBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                decryptedBytes[i] = binaryString.charCodeAt(i) ^ keyBytes[i % keyBytes.length];
            }
            const result = new TextDecoder().decode(decryptedBytes);
            if (!firstResult) firstResult = result;
            if (result.startsWith('https://')) return result;  // prefer valid URL
        } catch { continue; }
    }
    return firstResult;
}
```

Key rotates every 3600 seconds (1 hour). The `timestamp` field in the `/api/vs` response is Unix epoch seconds and is used directly — no client clock required.

---

*Document compiled from the Bunkr++ v5.0.1 → v5.5.0 development session.*
*All findings are empirical, derived from live console output, source analysis, and field testing.*
