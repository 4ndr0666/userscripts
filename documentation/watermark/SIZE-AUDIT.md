# SIZE-AUDIT — 4ndr0tools - Watermark++.user.js (suite v1.5.0, G6 record)

**Artifact:** `dist/4ndr0tools - Watermark++.user.js` — 1,279,706 B (measured this round; v1.4.10 baseline 1,279,143 B).
**Gate:** tools/size-budget.mjs (1,300,000 B hard budget; 1,000,000 B audit line — this record satisfies the latter).

## Composition analysis (machine-measured, this round)

| Component | Share | Notes |
|---|---|---|
| Embedded base64/data-URI payloads | **0 B** (0 blobs) | nothing to externalize on the asset axis |
| Embedded fonts / images | **0 B** | none present |
| Comment mass | ~25 KB across 409 comment lines | headers, changelogs, algorithm notes |
| Application code | ~1.25 MB across 15,326 lines (avg 83 B/line) | the Gemini image watermark-removal engine |

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

Ships as-is at 1,279,706 B: under the 1.3 MB hard budget, above the audit
line by design, with this record as the audited decision. The watch item for
the next round: if the engine grows past ~1,290,000 B, the vision core
becomes a decomposition candidate (observer → overlay split, or a lazily-
evaluated module body), to be re-adjudicated then.
