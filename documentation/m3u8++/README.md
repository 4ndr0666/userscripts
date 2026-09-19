# 4ndr0tools - m3u8++ v4.5 (GUP v5.3 audited)

**File:** `4ndr0tools-m3u8PlusPlus-v4.5.user.js` — 801 lines, md5 `648ef361c35bc852d9965ef4ab7182a8`
**Baseline:** your uploaded v4.4 (byte-identical to upstream stable — the audit superset contract is v4.5 ⊇ v4.4)
**Certification:** GUP v5.3 proof gate PASS (exit 0) · functional battery 34/34 · static audit zero findings · production rubric 93/100

## Install

1. Tampermonkey → Dashboard → Utilities → Import, or simply create a new userscript and paste the file contents, or drag the file onto the browser.
2. Confirm the header shows `@version 4.5`. The internal `@name` is unchanged (`4ndr0tools - m3u8++`), so Tampermonkey treats it as an update of v4.4 — no duplicate install.

## What v4.5 fixes (audit register G1–G10)

| ID | Gap in v4.4 | v4.5 behavior |
|----|-------------|----------------|
| **G1** | `doM3U` built `new URL(url)` with no base — **relative** (`hls/x.m3u8`) and **root-relative** (`/hls/x.m3u8`) XHR playlist URLs threw `Invalid URL` as *unhandled rejections* and silently vanished from the aggregator. Baseline battery: 2 of 3 sniffed playlists lost. | URLs resolve against `location.href`; both classes aggregate (verified: badge 3 → 5 items). |
| **G2** | `doM3U` is fire-and-forget async with zero error handling; its content-fetch fallback had no timeout. | Scoped `catch` + `console.debug("[m3u8++] m3u8 capture skipped:", …)`; fallback bounded by a 15 s `AbortController`. Zero unhandled rejections (verified). |
| **G3** | `m3u8Parser` used with no guard — a failed `@require` (CDN down) killed every capture silently with a `ReferenceError`. | Explicit `typeof` guard + one-time `console.warn` explaining the degradation. |
| **G4** | thatwind proxy `GM_xmlhttpRequest` had no `timeout`/`ontimeout`/`onabort` — a timed-out or aborted transport left the proxied `fetch()` promise **pending forever**. | Hard 300 s timeout (generous for large segments) + terminal reject handlers on every outcome. |
| **G5** | The proxy's synthetic `Response` lacked `.ok` and `.json()` — webapp code branching on `response.ok` saw `undefined`; `r.json()` threw. | `.ok` boolean + `.json()` added (fetch-compat surface complete). |
| **G6** | `mgmapi.message("Link copied", 2000, 'success')` — the `'success'` argument was silently discarded by the 2-param signature. | Optional `type` param: success → green accent border, error → red; all pre-existing 2-arg calls render byte-identically. |
| **G7** | `mgmapi.download`'s `openInTab` fallback dropped the return value (facade inconsistency). | Returns the tab handle. |
| **G8** | `showVideo` interpolated runtime values (`type`, `url`, `url.pathname`, `duration`) into `innerHTML` unescaped. URL normalization happened to percent-encode the dangerous characters, so no live injection — but zero margin. | `escapeHtml` on all four interpolations; display byte-identical for normal URLs (exact-path assertions). |
| **G9** | `mgmapi.copyText` appended its textarea to `document.body` unguarded — `document-start` boot has a null body (`message()` already guarded; `copyText` didn't). | Guarded host: `document.body \|\| document.documentElement`. |
| **G10** | XHR sniff interceptor swallowed exceptions in an empty `catch { }`. | Scoped `console.debug` logging (host XHR still never breaks — deliberate-interception pattern). |

## Superset guarantee

- Header: every `@grant`, `@require`, `@connect`, `@match`, `@exclude`, `@run-at` entry preserved verbatim. Version 4.4 → 4.5, description now honestly documents the magnet Play-button module.
- Atomization: 16 units — **13 UNCHANGED / 3 CHANGED (doM3U, showVideo, copyTextToClipboard — all ACCEPTED_SUPERSET) / 0 NEW / 0 MISSING**.
- Functional battery (mocked Tampermonkey surface, three origins, route-fulfilled thatwind page, no-GM_download mode): pristine baseline 34/34 with the six gap-documentation assertions; final candidate 34/34 with every gap closed and **zero regressions** across all always-green assertions (copy relay, thatwind hash params + top-title roundtrip, drag/toggle persistence, magnet plain/attribute/double/late/SCRIPT-excluded paths, diancigaoshou relay, dedup, early-return branch).

## Test checklist (2 minutes)

1. Any page with an HLS player → badge count increments; click badge to collapse/expand; drag to reposition (position survives reload).
2. Site using **relative** playlist URLs in XHR (previously missed) → items now appear.
3. Click a URL → "Link copied" toast with green accent; clipboard holds the URL.
4. `[Download]` on an m3u8 item → tools.thatwind.com opens with `m3u8`/`referer`/`filename` hash; `[Download]` on a direct video → GM download (or new-tab fallback where GM_download is unavailable).
5. Any page with magnet links → Play buttons (plain text and inside link attributes; late-arriving links are picked up within ~200 ms + debounce); clicking one opens diancigaoshou.com in a new tab with the magnet in the hash; the current tab never navigates.
6. DevTools console: zero `Uncaught (in promise)` from the userscript; failures (if any) surface as `[m3u8++]` debug lines instead.

## Documented residuals (deliberate, non-regressions)

- `shownUrls` grows unboundedly for the page lifetime — by design: FIFO eviction would re-duplicate long-running feeds (dedup correctness > memory; entries are ~100 B).
- The top-title relay answers any window that posts the magic string (cross-origin `document.title` exposure) — legacy protocol, low sensitivity, unchanged.
- Proxy 300 s timeout is a compromise: strictly better than hang-forever, still permissive for big segments.
- Evidence set: `gup-m3u8/` (baseline, candidate, atomize result, semantic-review.json, alignment-record.json, candidate-validation.json, inventory.json).
