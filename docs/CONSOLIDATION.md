# 4ndr0666tools — Consolidation Report

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
   (BrokenImgFixer-class interstitial bypassers, MegaEmbedRedirector,
   PlanetsuzyMobileSkinRedirect, Telegram Web Redirect, Searxng Sticky
   Settings, Gemini Answer Now) collapsed into **HostWarp** (per-host modules,
   one engine, every module toggleable).
5. **Page-utility overlap** — SelectAllCheckboxes, Collapse All Images, HDImgsOnly
   and Brave-infinite-scroll utilities collapsed into **PageCraft**.
6. **Co-install interference** (documented, then fixed):
   - `Alt+S` — Maximize_Any_Media console vs ModelSearch overlay → console
     moved to `Alt+Shift+S`.
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
- `npm run check` runs build → inventory → validate; CI runs it on every
  push (`.github/workflows/validate.yml`).

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
   — corrected in the plugin autopsy copy under `plugins/`.
5. **Ψ2 dead `@require`** (m3u8-parser, never referenced) — dropped.
6. **`Array.prototype.unique` global pollution** (Ψ2) — replaced with inline
   dedupe, identical semantics.
7. **jsconfig.json referencing nonexistent `codex.user.js`** — legacy repo
   hygiene issue recorded here; the suite's own `jsconfig.json` is clean.

## 6. Known, Accepted Trade-offs

- LinkMasterΨ carries five library `@require`s (popper/tippy/FileSaver/JSZip/
  sha256) inherited from Ψ2's download-packaging feature set. Every other
  suite script is fully self-contained (kernel inlined at build time).
- Ψ2's per-frame HUD is unified into the top-frame-only LinkMaster dock
  (v5.x frame policy); post *detection* still runs in every frame.
- The legacy stable/BETA pairs' historical changelogs remain embedded in the
  promoted scripts as comments (GUP provenance); they are inert documentation.
