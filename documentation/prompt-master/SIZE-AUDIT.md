# SIZE-AUDIT — 4ndr0tools - Prompt Master.user.js (suite v1.23.0, G6 record)

**Artifact:** `dist/4ndr0tools - Prompt Master.user.js` — 1,178,959 B (re-measured 2026-10-31 at suite v1.23.0, script v28.9.0 — the WO-01 round-15 pin ride-along: PM canon and kernel byte-identical this round), prior re-measure 2026-10-30 at suite v1.22.0, script v28.9.0 — the WO-01 round-14 normalization-symmetry batch: the insertPrompt contenteditable escape (PM-F01), raw-ingest + render-escape for shared prompts (PM-F02), the detectPlatform hostEq gates (PM-F03), the compareVersions numeric-prefix parse (PM-F04), the per-run random placeholder sentinels (PM-F05), the SCRIPT_VERSION fallback sync (PM-F06); +6,827 B / +103 lines), prior re-measure 1,172,132 B at suite v1.21.0 (2026-10-29, script v28.8.2 — the WO-01 round-13 storage round-trip batch: GlobalFiles LRU bounds (64 entries / 20 MB, oldest-first) + the caught save, the getGlobalFiles Array.isArray choke point, the backup-table defaultVal corrections, the caught pin save, the debug-to-warn auto-backup catch; +3,602 B / +59 lines), prior re-measure 1,168,530 B at suite v1.20.0 (2026-10-28 — the WO-01 round-12 pin ride-along: PM canon and kernel byte-identical that round), prior re-measure 2026-10-27 at suite v1.19.0 (the WO-01 round-11 pin ride-along: canon and kernel byte-identical that round), prior re-measure 1,168,530 B at suite v1.18.0 (2026-10-27, the WO-01 round-10 pin ride-along: canon and kernel byte-identical that round), prior re-measure 1,168,530 B at suite v1.17.0 (2026-10-27, the WO-01 round-9 pin ride-along: canon and kernel byte-identical that round), prior re-measure 1,168,530 B at suite v1.16.0 (2026-10-26, the WO-01 round-8 connection-hygiene batch: the memoized IndexedDB open + the SCRIPT_VERSION fallback re-stamp; +561 B / +7 lines), prior re-measure 1,167,969 B at suite v1.15.0 (the WO-01 round-7 pin ride-along: PM/WM canon and kernel byte-identical this round), prior re-measure 2026-10-26 at suite v1.14.0 (the WO-01 round-6 pin ride-along: canon/kernel byte-identical that round), prior re-measure 2026-10-25 at suite v1.13.0, script v28.8.0 — the WO-01 round-5 MIT license adoption re-measure: the @license meta value flip (−27 B; partition: −22 comment-mass by stripper-diff + −5 in-comment spaces), prior re-measure 1,167,996 B at suite v1.12.0 with the round-4 kernel truth batch riding the inlined kernel chunk; prior 1,166,403 B at suite v1.10.0; the v1.8.2-round "unchanged" claim was already wrong at its own commit — the tree measured 1,160,241 B that day; v1.4.10 baseline 1,122,838 B). The byte count in this line is machine-verified by tools/size-budget.mjs since WO-01 round-2.
**Gate:** tools/size-budget.mjs (1,300,000 B hard budget; 1,000,000 B audit line — this record satisfies the latter; byte count VERIFIED against the live artifact).

## Composition analysis (machine-measured, this round — partitions exactly)

| Component | Share | Notes |
|---|---|---|
| Embedded base64/data-URI payloads | **0 B** (0 blobs — the @icon SVG is the only data URI, ~2 KB) | nothing material to externalize on the asset axis |
| Embedded fonts / images | **0 B** | WCP-local font stack; no font payloads |
| Comment mass | ~167 KB across 3,227 comment lines (scan-kit stripper-diff method — the shared scanner's own comment-blanked chars) | dense documentation-in-source is deliberate |
| Application code | ~1,012 KB across 20,902 lines (avg 48 B/line) | the prompt-management application |
| **Total** | **1,178,959 B / 24,129 lines** | 3,227 comment + 20,902 code = 24,129 ✓ (byte partition: 166,990 comment + 1,011,969 code = 1,178,959 ✓) |

## What the weight IS

The artifact is the suite's largest application: collections/saved-views/
ratings/archive organization engine, dedupe, the media slideshow with
video-aware dwell, the AI prompt enhancer, auto-gist syncing, the Flow
credit meter (official unit ledger, day rolling, wall reconciliation — the
flow-credit observer/tick pipeline gained the B.1 idle-park wiring this
round), the manager hotkeys, and the 3lectric-Glass UI family. The v-series
changelog comments (~156 KB) are retained deliberately: they are the
operator's audit trail for every integrated candidate, and removing them
would save mass at the cost of the suite's provenance discipline.

## Externalization decision

Externalization-where-legal was evaluated and **rejected** for this round:
the mass is application logic plus its own changelog prose, not assets; a
`@require` split would trade ~180 KB of parse cost for a network dependency
and manager-version coherency surface (same OPSEC argument as the
Watermark++ record). Parse cost lands at document-end run-at, off the
interactive critical path.

## Justification

Ships as-is at 1,178,959 B (re-verified 2026-10-31, suite v1.23.0): under the 1.3 MB hard budget, above the audit
line by design, with this record as the audited decision. Watch item: the
comment mass (~167 KB) is the one *reversible* component if a future round
needs headroom — moving the v-series changelogs into
`documentation/prompt-master/CHANGELOG.md` and keeping per-feature notes in
source would reclaim the mass without any asset externalization.
