# SIZE-AUDIT — 4ndr0tools - Prompt Master.user.js (suite v1.8.2, G6 record)

**Artifact:** `dist/4ndr0tools - Prompt Master.user.js` — 1,159,643 B (measured v1.8.2, byte-count re-verified 2026-10-23 — unchanged; header suite-stamp corrected from the stale v1.5.0; v1.4.10 baseline 1,122,838 B).
**Gate:** tools/size-budget.mjs (1,300,000 B hard budget; 1,000,000 B audit line — this record satisfies the latter).

## Composition analysis (machine-measured, this round)

| Component | Share | Notes |
|---|---|---|
| Embedded base64/data-URI payloads | **0 B** (0 blobs — the @icon SVG is the only data URI, ~2 KB) | nothing material to externalize on the asset axis |
| Embedded fonts / images | **0 B** | WCP-local font stack; no font payloads |
| Comment mass | ~182 KB across 2,825 comment lines (v-series changelogs + per-feature rationale) | dense documentation-in-source is deliberate |
| Application code | ~0.97 MB across 23,839 lines (avg 49 B/line) | the prompt-management application |

## What the weight IS

The artifact is the suite's largest application: collections/saved-views/
ratings/archive organization engine, dedupe, the media slideshow with
video-aware dwell, the AI prompt enhancer, auto-gist syncing, the Flow
credit meter (official unit ledger, day rolling, wall reconciliation — the
flow-credit observer/tick pipeline gained the B.1 idle-park wiring this
round), the manager hotkeys, and the 3lectric-Glass UI family. The v-series
changelog comments (~182 KB) are retained deliberately: they are the
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

Ships as-is at 1,159,643 B (re-verified 2026-10-23, suite v1.8.2): under the 1.3 MB hard budget, above the audit
line by design, with this record as the audited decision. Watch item: the
comment mass (~182 KB) is the one *reversible* component if a future round
needs headroom — moving the v-series changelogs into
`documentation/prompt-master/CHANGELOG.md` and keeping per-feature notes in
source would reclaim the mass without any asset externalization.
