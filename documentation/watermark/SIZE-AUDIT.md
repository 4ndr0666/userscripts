# SIZE-AUDIT — 4ndr0tools - Watermark++.user.js (suite v1.15.0, G6 record)

**Artifact:** `dist/4ndr0tools - Watermark++.user.js` — 1,292,307 B (re-measured 2026-10-26 at suite v1.15.0 (the WO-01 round-7 pin ride-along: PM/WM canon and kernel byte-identical this round), prior re-measure 2026-10-26 at suite v1.14.0 (the WO-01 round-6 pin ride-along: canon/kernel byte-identical that round), prior re-measure 2026-10-25 at suite v1.13.0, script v2.1.1 — the WO-01 round-5 MIT license adoption re-measure: the @license meta value flip (−27 B; partition: −22 comment-mass by stripper-diff + −5 in-comment spaces); prior re-measure 1,292,334 B at suite v1.12.0 with the round-4 kernel truth batch riding the inlined kernel chunk; prior 1,290,741 B at suite v1.10.0; the v1.8.2-round claim of 1,286,666 B was the pre-round-1 baseline number recorded in error — the WO-01 round-1 tree already measured 1,287,132 B; the v1.5.0-round record below measured 1,279,706 B; v1.4.10 baseline 1,279,143 B). The byte count in this line is machine-verified by tools/size-budget.mjs since WO-01 round-2.
**Gate:** tools/size-budget.mjs (1,300,000 B hard budget; 1,000,000 B audit line — this record satisfies the latter; byte count VERIFIED against the live artifact).

## Composition analysis (machine-measured, this round — partitions exactly)

| Component | Share | Notes |
|---|---|---|
| Embedded base64/data-URI payloads | **0 B** (0 blobs) | nothing to externalize on the asset axis |
| Embedded fonts / images | **0 B** | none present |
| Comment mass | ~27 KB across 613 comment lines (scan-kit stripper-diff method — the shared scanner's own comment-blanked chars; the engine's mass is code, not prose) | headers, banners, algorithm notes |
| Application code | ~1,265 KB across 14,899 lines (avg 85 B/line) | the Gemini image watermark-removal engine |
| **Total** | **1,292,307 B / 15,512 lines** | 613 comment + 14,899 code = 15,512 ✓ (byte partition: 27,492 comment + 1,264,815 code = 1,292,307 ✓) |

## What the weight IS

The artifact is a self-contained computer-vision engine: alpha-map derivation
and decode caching (`decodedAlphaMaps`, FIFO-bounded this round), gradient
and variance scoring, size-adjusted confidence, preview-neighborhood priors
per radius, scale lists, batchexecute RPC observation via the NetHook, the
intent-gated processing proxy, session bookkeeping (FIFO-capped this round),
and the 3lectric-Glass overlay family. The density (83 B/line average —
long mathematical expressions, not padding) is the irreducible cost of the
feature set; no blob, font, or data asset contributes to the mass.

## Externalization decision

Externalization-where-legal was evaluated and **rejected** for this round:
splitting the vision core into a `@require`-hosted module would move the
parse cost off the critical path but introduce (a) a network dependency on
first run per manager profile, violating the suite's offline/OPSEC posture
(zero remote @imports is an enforced gate), and (b) a cache-coherency
surface between manager versions and the hosted module. The measured parse
cost on current hardware is in the tens of milliseconds at document-end
run-at — the artifact's own `@run-at` — which is not on the interactive
critical path.

## Justification

Ships as-is at 1,292,307 B (re-verified 2026-10-26, suite v1.15.0): under the 1.3 MB hard budget, above the audit
line by design, with this record as the audited decision. The watch item for
the next round: if the engine grows past ~1,290,000 B, the vision core
becomes a decomposition candidate (observer → overlay split, or a lazily-
evaluated module body), to be re-adjudicated then.
