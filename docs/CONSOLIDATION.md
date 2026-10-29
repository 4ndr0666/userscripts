# 4ndr0666tools — Consolidation Report

> **AS-OF STAMP (WO-01 round-2, 6-d F2): this report describes the v1.1.0
> consolidation EVENT — its counts were true on the day it was written and
> are preserved verbatim as the historical record (the superset law forbids
> rewriting history). Numbers that moved since: 24 sovereign carries (the
> three Anti-* ICC scripts folded into Akasha Silence at merge; Zai Exporter
> arrived later), 9 BETA promotions (Stream Interceptor v1.3.0; Forum Link
> Xtractor's second candidate promotion), 3 merges (Akasha Silence), 38
> dist installables at 118,786 lines (the WO-01 round-13
> twin-divergence settlement — 16 canon bumps: LinkMasterΨ v6.3.4 →
> v6.3.5 (THE CRITICAL matchAll g-flag rebuild — a non-global pattern
> was a tab hang — plus the canon's last unguarded boot-time settings
> parse and five Forums++ hardenings never ported to the twin), Forums++
> v1.13.6 → v1.13.7 (the kemono ?f= dead-code recovery, the query-aware
> Pixeldrain resolver, the ThreadCache empty-page freeze, the Bunkr ''
> dedup key, the dotless-basename hidden-dotfile class), Login Form
> Autofiller v2.0.10 → v2.0.11 (THE CROSS-SITE CREDENTIAL GATE — the
> substring domain match served the previous site's BugMeNot credentials
> into lookalike domains), serviceguard Companion v7.4.2 → v7.4.3 (THE
> HOMOGRAPH GATE — the URL parser is the IDN normalizer now), Watermark++
> v2.1.2 → v2.1.3, Prompt Master v28.8.1 → v28.8.2 (GlobalFiles bounded),
> Zai Exporter v1.0.1 → v1.0.2, Instagram++ v13.2.4 → v13.2.5 (the
> operator's button contract adjudicated in-code + self-documenting
> titles), Pixeldrain++ v1.2.4 → v1.2.5, m3u8++ v5.1.2 → v5.1.3, WCP
> v5.3.1 → v5.3.2, MPC v8.1.4 → v8.1.5, ModelSearch v4.0.4 → v4.0.5,
> YRVR v2.0.5 → v2.0.6, YTPM v1.7.4 → v1.7.5, YT Filter v2.5.1 →
> v2.5.2 — plus the two new gate instruments: norm-symmetry-smoke (45
> assertions) and tt-browser-smoke (the Trusted-Types harness finally
> gate-wired, 8/8 live) — measured after the round-12
> → v9.1.2, Zai Exporter v1.0.0 → v1.0.1, AlwaysNewWindow v1.0.2 →
> v1.0.3, LFA v2.0.9 → v2.0.10 — over the WO-01 round-11
> operator-battery settlement — 11 canon bumps over the operator's first
> real paste-back: Forums++ v1.13.5 → v1.13.6 (the OBI-F01 settle-callback
> fix), Akasha v5.2.4 → v5.2.5 (the OBI-F02 cross-origin guards), Gofile++
> v2.2.0 → v2.3.0 (the zero-avail batch), Pixeldrain++ v1.2.3 → v1.2.4
> (the resume-integrity batch), BypassPaywalls v0.1.7 → v0.1.8 (the
> dead-branch resurrection), YTPM v1.7.3 → v1.7.4, Filester++ v7.6.2 →
> v7.6.3, YRVR v2.0.4 → v2.0.5, Redgifs++ v5.2.2 → v5.3.3, YT Filter
> v2.5 → v2.5.1, Bunkr++ v7.7.0 → v7.7.1 — over the WO-01 round-10 rotation
> settlement batch — 15 canon bumps: Forums++ v1.13.4 → v1.13.5, CB
> v4.1.3 → v4.1.4, Pixeldrain++ v1.2.2 → v1.2.3, LFA v2.0.8 → v2.0.9,
> m3u8++ v5.1.1 → v5.1.2, Images++ v4.0.5 → v4.0.6, YRVR v2.0.3 →
> v2.0.4, Stream Interceptor v3.3.0 → v3.3.1, Blob2URL v7.3.0 → v7.3.1,
> ModelSearch v4.0.3 → v4.0.4, MPC v8.1.3 → v8.1.4, MAM v2.0.1 → v2.0.2,
> Yandex v0.4.2 → v0.4.3, Akasha v5.2.3 → v5.2.4, FLX v3.2.3 → v3.2.4 —
> over the WO-01 round-9 audit
> one-liners + the operator battery's birth — Forums++ v1.13.3 → v1.13.4,
> CB v4.1.2 → v4.1.3 — over the WO-01 round-8 settlement rounds:
> Forums++ v1.13.2 → v1.13.3, Hailuo++ v6.1.1 → v6.1.2, CB
> v4.1.1 → v4.1.2, the suite-wide transport/registry batch — WM v2.1.2,
> IG v13.2.3, PM v28.8.1, Filester v7.6.2, LMΨ v6.3.4 — over the round-6
> lineage restoration: Forums++ v1.11.2 → v1.12.1 carries the
> XenForoPostDownloader v3.23 machinery), 2,464 baseline units checked with 54
> reconciled renames (52 + round 6's cyberdrop_helper/processQueue
> supersession records), and `npm run check` = build → inventory → qr-verify →
> style-audit → validate. The machine-checked truth is always the gate; this
> prose is the story of how the suite came to be.**
>
> GUP v5.3 verification artifact. Evidence chain: `tools/baseline.json` (frozen
> legacy inventories) → `tools/ledger.json` (consolidation map) →
> `canon/EVIDENCE.json` (per-script transform evidence) → `tools/validate.mjs`
> (machine gates A–D). This report is the human-readable summary of that chain.

## 1. Executive Summary

The legacy repository shipped **59 userscripts (96,520 lines)** grown by
accretion: eight stable/BETA sibling pairs, a five-way LinkMaster lineage,
six near-identical micro host-tools, four overlapping page utilities, and
seven independently maintained fetch/XHR proxy stacks. The consolidation
distills this into **38 installables (85,883 lines)** with a shared kernel,
one design system, and a machine-enforced superset contract — **no validated
feature was dropped, renamed away, or weakened**.

| Metric | Legacy | Suite | Δ |
|---|---|---|---|
| Installables | 59 (+2 archive/plugin) | 38 | −21 |
| Total lines | 96,520 | 85,883 | −11% |
| Palette constant copies | 148+ across 29 files | 1 (kernel `glass.js`) | −99% |
| Update URLs pointing at wrong file | 2 (self-downgrade bugs) | 0 | fixed |
| Hotkey collisions (co-install) | 2 | 0 | fixed |
| Dead `@require` (m3u8-parser) | 1 | 0 | removed |

## 2. Audit Findings (the taxonomy that drove the map)

1. **Hidden subsets / ~95% clones** — `m3u8++` ⊂ `m3u8++BETA` (G1–G10 gap set),
   `Hailuo++` ⊂ `Hailuo++BETA`, `Blob2URL` ⊂ `Blob2URLBETA` (G1–G3 + IG vault),
   `Confirmation Bypass` ⊂ its BETA (Set-based rel handling), `ModelSearch` ⊂
   `ModelSearchBETA`, `GooglePhotosandDrive++` ⊂ its BETA (0-MISSING GUP gate),
   `Media Player Controller` ⊂ its BETA (unified superset + IGDL salvage),
   `Forum Link Xtractor` ⊂ its BETA (XenForo Enhancer). **Eight BETA
   promotions retired sixteen files.**
2. **Five-way LinkMaster lineage** — `archive/Linkmaster` (v1–4) → `LinkMasterΨ`
   (v5.0.0) → `LinkMasterBETA` (v5.1.1, superset of Ψ) ∥ `LinkMasterΨ2`
   (v3.1.0, parallel redesign with the forum deep-scrape engine) + `Premium
   Link Revealer` + `Git Raw URL File List Parser`. All five retire into
   **LinkMasterΨ v6.1.0**.
3. **Resolver goldmines** — Ψ2's 30+ per-host resolver chain (bunkr API, coomer
   profiles, gofile albums, cyberdrop/cyberfile folders, pixhost/imgbox/ibb/
   jpg6 albums, yandex disk, box.com, redgifs API, pornhub/spankbang/
   noodlemagazine streams) ported verbatim into the merged LinkMasterΨ.
4. **Micro host-tool janitors** — six single-purpose scripts
   (HDImgsOnly image-host interstitial bypassers, MegaEmbedRedirector,
   PlanetsuzyMobileSkinRedirect, Telegram Web Redirect, Searxng Sticky
   Settings, Gemini Answer Now) collapsed into **HostWarp** (per-host modules,
   one engine, every module toggleable).
5. **Page-utility overlap** — SelectAllCheckboxes, Collapse All Images, BrokenImgFixer
   and Brave-infinite-scroll utilities collapsed into **PageCraft**.
6. **Co-install interference** (documented, then fixed):
   - `Alt+S` — Maximize_Any_Media console vs ModelSearch overlay (and `Alt+Shift+S` vs YouTube Playlist Master) → console
     moved to `Alt+Shift+M`.
   - `Alt+R` — Recon dock vs legacy BrokenImgFixer retrigger → Recon moved to
     `Alt+Shift+R` (PageCraft keeps `Alt+R` through the collision-aware
     kernel hotkey registry).
   - Duplicate right-click-scroll-to-top handlers (AlwaysNewWindow +
     Confirmation Bypass) and duplicated neon scrollbar styling — left
     in-place where page-scoped, surfaced in the README interference report
     for awareness.
7. **Inventory tooling gaps** (legacy `tools/update_catalog.mjs`, 80-line
   description window, no version/overlap/collision/validation/JSON output)
   — replaced by `tools/inventory.mjs` (version-aware catalog, family
   classification, co-install domain matrix, JSON export, README regeneration)
   + `tools/validate.mjs` (Gates A–D) + `tools/build.mjs` (kernel inliner).

## 3. The Consolidation Map

### 3.1 BETA promotions (16 → 8)

| Suite script (v) | Retired stable | Evidence |
|---|---|---|
| m3u8++ 5.0.0 | m3u8++ 4.4 | G1–G10 GUP gap set + magnet relays, strict superset |
| Hailuo++ 6.0.0 | Hailuo++ 5.1.1 | 5.4.0 "zero functional removals" + editable-context guards |
| Blob2URL 7.0.0 | Blob2URL 6.3 | SUPerset G1–G3 + IG vault render |
| Confirmation Bypass 4.0.0 | 3.6.1 | Set-based rel handling + xcandid overlay fix |
| ModelSearch 4.0.0 | 2.1 | BUG-1/2/3 fixes + Electric-Glass covert UI; **@updateURL self-downgrade bug corrected** |
| GooglePhotosandDrive++ 8.0.0 | 1.5.0 | "GUP gate: 0 MISSING" unified revision |
| Media Player Controller 8.0.0 | 5.1.0 | unified superset + IGDL v6.0.1 salvage |
| Forum Link Xtractor 3.0.0 | 1.0 | XenForo Enhancer superset |

### 3.2 Merges

- **LinkMasterΨ 6.1.0** — five-way merge (see §2.2). The v6.1.0 revision
  completed the Ψ2 engine port after Gate-B verification flagged 25 missing
  units: forum deep-scrape (post parsing, host inventory, resolver chain,
  configure-and-download with zip/flatten/skip-dupes/links.txt/log.txt,
  batch download, post-reaction automation), check-scraped-links flow,
  GoFile-token settings, general-mode page inventory. Settings migrate via
  Ψ2's `linkmaster_settings` storage key.
- **Images++ 4.0.0** — universal stable v3.0.0 base + the BETA's single
  non-subset feature (configurable collapse hotkey). The BETA's
  IG/imagefap-only scoping was a regression and is intentionally not carried.

### 3.3 Composites (kernel-powered)

- **HostWarp 1.0.0** — absorbs 6 micro host-tools (image-host interstitial
  bypass ×10 hosts, MegaEmbedRedirector, PlanetsuzyMobileSkinRedirect,
  Telegram Web Redirect, SearXNG Sticky Settings, Gemini Answer Now) as
  per-host modules over the kernel (`hosts`/`glass`/`store`/`hotkeys`).
- **PageCraft 1.0.0** — absorbs 4 page utilities (SelectAllCheckboxes,
  Collapse All Images, BrokenImgFixer, Brave infinite scroll) as toggleable
  modules over the kernel.

### 3.4 Sovereign carries (26)

Carried verbatim (metadata normalized only): 4ndr0purge, 4ndr0serviceguard
Companion, AlwaysNewWindow, Anti-detection, Anti-telemetry (ICC),
AutoTranslate, Bunkr++, BypassPaywalls, Counter-survillance, Filester++,
Forums++, GoFile++, Instagram++, Login Form Autofiller, Maximize_Any_Media,
Pixeldrain++, Prompt Master, Recon, Redgifs++, Watermark++, Website Control
Panel, YT Filter, YandexImageSearch++, YouTube Playlist Master,
YouTubeEmbedRedirectButton, Youtube Removed Video Revealer.

## 4. Superset Verification (how "no regression" is enforced)

- **Baseline freeze** — `tools/baseline.json` records every legacy artifact's
  SHA-256, line count, and named-unit inventory (function/class/arrow
  declarations): **61 artifacts, 2,465 units**.
- **Gate A (coverage)** — every baseline artifact has a ledger entry.
- **Gate B (identity)** — every baseline unit must appear in its destination
  dist file by name, except 15 explicitly reconciled renames (each verified
  by reading the destination code — e.g. BrokenImgFixer's `init` is
  PageCraft's `initialScan` boot orchestration).
- **Gate C (structural)** — every dist file passes the §1.1-aware lexical
  scanner, an authoritative V8 parse (`node --check`), metadata
  self-consistency (@name/@version/@updateURL self-reference), and the
  two-layer placeholder scan (word markers in live code; sentinel values
  like the legacy `settingsHash = "PLACEHOLDER"` ship-stopper bug class).
- **Gate D (interference)** — every documented collision fix is verified
  present in dist output.
- `npm run check` runs build → inventory → qr-verify → style-audit →
  validate (WO-01 round-2, 6-d F6: the enumeration previously omitted the
  qr-verify and style-audit stages); CI runs it on every push
  (`.github/workflows/validate.yml`).

## 5. Defects Fixed During Absorption

1. **ModelSearchBETA self-downgrade** — `@updateURL` pointed at the *stable*
   filename; the suite build rewrites it to the promoted dist file.
2. **Git Raw URL File List Parser double-domain URLs** — legacy emitted
   `raw.githubusercontent.com/githubusercontent.com/...`; corrected mapping
   with `/blob/` strip.
3. **SearXNG Sticky Settings sentinel** — legacy shipped
   `const settingsHash = "PLACEHOLDER"` (never worked out of the box); the
   HostWarp module computes the real hash.
4. **candidshiny plugin invalid selectors** (`'aref]'`, `'a.attachmentref]'`)
   — corrected in the plugin autopsy copy under `plugins/` at the time;
   the plugin was RETIRED outright in WO-01 round-1 (2-b F-05: orphaned —
   its only consumer was the long-retired LinkMasterΨ2, and it ran a
   3333 ms full-document scan forever outside every census scope;
   `plugins/` now holds the MPV bridge + autopage config only).
5. **Ψ2 dead `@require`** (m3u8-parser, never referenced) — dropped.
6. **`Array.prototype.unique` global pollution** (Ψ2) — replaced with inline
   dedupe, identical semantics.
7. **jsconfig.json referencing nonexistent `codex.user.js`** — legacy repo
   hygiene issue recorded here; the legacy file was pruned at integration and
   the suite ships no `jsconfig.json` at all.

## 6. Known, Accepted Trade-offs

- Runtime `@require` dependencies are carried by four scripts — **LinkMasterΨ**
  and **Forums++** (the same five libraries each: popper/tippy/FileSaver/JSZip/
  sha256, inherited from Ψ2's download-packaging feature set), **m3u8++**
  (m3u8-parser, load-failure guarded) and **Youtube Removed Video Revealer**
  (cash 8.1.5). **Login Form Autofiller's** gm4-polyfill @require was retired
  at v2.0.5 (WO-01 round 4, 3-c F08): its body is solely dot-form, so the
  GM3-era bridge (underscore→dot shim) was inert on every current engine —
  its removal drops the last third-party remote-code fetch that served zero
  function. Every other suite
  script is fully self-contained (kernel inlined at build time, zero external
  libraries).
- Ψ2's per-frame HUD is unified into the top-frame-only LinkMaster dock
  (v5.x frame policy); post *detection* still runs in every frame.
- The legacy stable/BETA pairs' historical changelogs remain embedded in the
  promoted scripts as comments (GUP provenance); they are inert documentation.
