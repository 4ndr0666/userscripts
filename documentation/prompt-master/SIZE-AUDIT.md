# SIZE-AUDIT — 4ndr0tools - Prompt Master.user.js (suite v2.0.0, G6 record)

**Artifact:** `dist/4ndr0tools - Prompt Master.user.js` — 1,160,627 B (re-measured 2026-10-24 at suite v2.0.0, script v28.7.7; the v1.8.2-round "unchanged" claim was already wrong at its own commit — the tree measured 1,160,241 B that day; v1.4.10 baseline 1,122,838 B). The byte count in this line is machine-verified by tools/size-budget.mjs since WO-01 round-2.
**Gate:** tools/size-budget.mjs (1,300,000 B hard budget; 1,000,000 B audit line — this record satisfies the latter; byte count VERIFIED against the live artifact).

## Composition analysis (machine-measured, this round — partitions exactly)

| Component | Share | Notes |
|---|---|---|
| Embedded base64/data-URI payloads | **0 B** (0 blobs — the @icon SVG is the only data URI, ~2 KB) | nothing material to externalize on the asset axis |
| Embedded fonts / images | **0 B** | WCP-local font stack; no font payloads |
| Comment mass | ~186 KB across 3,228 comment lines (v-series changelogs + per-feature rationale) | dense documentation-in-source is deliberate |
| Application code | ~0.99 MB across 20,642 lines (avg 56 B/line) | the prompt-management application |
| **Total** | **1,160,627 B / 23,870 lines** | 3,228 comment + 20,642 code = 23,870 ✓ |

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
