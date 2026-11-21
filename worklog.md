# Worklog — 4ndr0666/userscripts suite (4ndr0neering rounds)

Engineering log for the `4ndr0666/userscripts` repository, maintained under the
4ndr0neering convergence protocol. This file is the **suite-scoped successor**
of the retired `chatgptbulk.user.js` worklog (rounds 1–5 of the single-script
engagement; that history is preserved verbatim on the `archive/r5-bulkimg`
branch and in the round-4/5 tags, and the round-5 update kit lives outside the
tree at the operator's discretion — it targets the pre-v2.0.0 layout and is
superseded by the architecture below). Every round ends with a superset check
(no prior feature may be omitted, regressed, or weakened), a certified
delivery, and a handoff priming the next iteration.

---

## Round 6 — silent stepwise gap mitigation over the v2.0.0 flat suite (2026-11-21)

- **Protocol:** 4ndr0neering, contract `contract.json` v2.0.0 (declarative, fail-closed)
- **Baseline:** `1daaffa` — the operator's post-refactor state (v2.0.0 architecture
  flatten → suite package 7.0.0 → 8.0.0 → Forums++ simpcity.cr migration →
  Prompt Master v29.0.0 Flow++ bulk engine → **ChatGPT++ v1.6.0 added**).
  The operator reported the round-5 update kit was never applied — their
  refactor branches from the round-4 close `e964bce`, so the round-5 fixes
  were re-verified against the rewritten engines rather than assumed (see
  the superset section).
- **Bootstrap:** worklog ingestion (the retired round-5 log), manifest verify
  (39 installables: 37 single-file `src/*.user.js` + `hostwarp/` +
  `pagecraft/`), liveness probe (`git log`, divergence reconciled by archiving
  the local round-5 lineage to `archive/r5-bulkimg` and adopting `origin/main`).
- **Method:** exhaustive adversarial review of the highest-blast-radius surfaces
  (ChatGPT++ v1.8.0 in full, the Prompt Master v29.0.0 Flow++ engine in full,
  all 7 kernel modules, the build/inventory/validation toolchain, the delivery
  and workflow harnesses, the python contract executor), plus a suite-wide
  stub/orphan/dead-reference sweep — then focused mitigation commits, each
  individually syntax-gated, and a fail-closed end-to-end battery.

### Findings ledger

| # | Finding (v1.8.0 / v29.0.2 behavior) | Class | Fix |
|---|---|---|---|
| R6-1 | ChatGPT++ **async clarifications were never consumed in the default mode**: `pollGallery` set `job.pendingClarification`, but its only consumer (`evaluateJobAfterSend`'s while-loop) had already returned by the time the question landed tens of seconds after the non-wait send. The job spun 'pending' for 15 minutes, failed, and `autoCleanFailed` then **deleted a perfectly recoverable thread** — while "Auto-answer clarification questions" was ticked on | correctness | `a4bbfb5`-class fix: poller-side consumer `maybeAnswerPendingClarification` (answers when the page sits on the job's conversation and no run owns the composer; in-flight guard; question restored on send failure) + the 15-minute timeout branch now reports an unanswered clarification honestly and **never auto-deletes** it |
| R6-2 | Prompt Master Flow++ (v29.0.0) shipped **no poller at all**: with "Wait for each generation" unchecked, `inspectOnce` ran once 500 ms after the send and nothing ever looked again — every non-wait job spun 'pending' forever, the gallery never resolved, and smart-stop was structurally blind to async results | correctness | `pollPendingJobs` (4 s cadence, re-entrant guarded, self-clearing): FIFO attribution of sniffed generation responses (`generationResponseLog`, the single `lastGenerationResponse` slot could only ever serve the newest job) + per-job DOM-delta harvest (`beforeUrls` now stored on the job) + the same 15-minute bound; the sync clarify loop is fenced with `clarifyBusy` so the poller never fights it for the composer |
| R6-3 | ChatGPT++ lightbox **Download navigated with whatever signed URL the tile happened to capture** — open a gallery hours later and the browser fails silently on the expired link (the round-3/4 "downloads never die" asset guarantee, weakened by the v1.6 rewrite: only tile-render errors re-signed, the download anchor never did) | robustness / superset | the download click now re-signs first (`files/download` re-fetch) and navigates on the fresh URL; the lightbox image gains the same one-shot error refresh; download extensions derive from the asset URL (`assetExt`) instead of hardcoded `.png` |
| R6-4 | ChatGPT++ **partial download failures were never retried**: the `dlRetries`/`MAX_DL_RETRIES` budget only armed when `images.length === 0`, so a job that fetched 1 of 2 images went straight to `done` with the second silently missing | correctness | the partial-failure branch now stays pending while the retry budget lasts, so the next 4 s tick re-fetches only the missing ids |
| R6-5 | **Dead code in both engines**: `restoreHeldFilesFromStorage()` and `hasHeldImages()` had zero callers; `persistHeldState()` was a semantically-empty shim whose name lied about the stateless v1.6+ design | dead code | all three removed from both scripts; call sites now invoke `purgeLegacyHeldStorage()` directly, with a comment documenting the stateless design |
| R6-6 | `contract.json` declared **`installables: 38` while the suite holds 39**, and the field was decorative — nothing in the toolchain compared the declarative contract to the repository it governed, so the stale count certified clean through 9/9 gates | contract integrity | count corrected to 39; `scripts/4ndr0_validate.py` direct-contract mode now fail-closes on architecture drift (dirs exist, `kernel_order` matches `kernel/` contents, declared count matches `dist/` population). RED-verified both directions: a stale count and a drifted kernel_order each exit 1; the true contract exits 0 |
| R6-7 | The generated README **hardcoded its facts**: "36 single-file" (actual 37) and a "v2.0.0" badge (package is 8.0.0) — the template silently re-emitted the lie on every regeneration | toolchain | `tools/inventory.mjs` now derives the badge from `package.json`, the src/ topology from the tree itself, and the contract line from `contract.json`; README regenerated |
| R6-8 | Flow++ video downloads were **named `.mp4` regardless of codec** — `.webm` outputs downloaded as `*.mp4` | correctness | `mediaExt()` derives the extension from the asset URL with an honest fallback |
| R6-9 | The v2.0.0 refactor retired `worklog.md`, but the engagement protocol requires a record base and a handoff — every future round bootstraps from this file | delivery | this file re-established as the suite-scoped log |

Superset verification notes (silent, against the operator's current stable
state AND the retired single-script lineage): the round-5 fixes were
re-derived against the rewritten engines — normalized prompt→message pairing
survives in ChatGPT++ v1.8.0 (`norm()` on both sides of `matchIdx`/`siblings`);
the round-5 picker-relock subsystem no longer exists because forced-model moved
from picker-clicking to **request-body rewriting** (`rewriteBody`), which is
structurally immune to the relock/cooldown bug class; the round-4 four
features (forced model, held reference images, stateless runs, failed-thread
cleanup) and the rounds-1–3 fix inventory (double-injection guard, timestamp
normalization, HTML escaping, model-list refusal) are all present in the v1.8.0
engine. Every mitigation this round is strictly additive — no prior behavior
was removed or weakened.

### Verification evidence (round-6 acceptance baseline)

| Criterion | Gate | Result |
|---|---|---|
| build-and-inventory | functional | `npm run build` 39/39 (2 built, 21 carried, 16 kernel-inlined); `npm run inventory` CLEAN (0 problems) |
| static-v8-and-metadata | functional | `npm test` static checks PASS (39/39; source/dist parity, V8 parse, canonical URLs, OPSEC) |
| opsec-and-3lectric-glass-style | structural | 39/39 PASS |
| hotkey-collision-census | structural | 67 registrations, 0 collisions |
| qr-encoder-roundtrip | functional | 8/8 payloads PASS |
| size-budget | performance | 39 files within budget (largest Watermark++ 1,297,172 B < 1.3 MB ceiling) |
| kernel-and-behavior-smoke | functional | kernel / boundary / family / watermark / norm PASS + the new dist-load-harness (both modified installables evaluated headless in a stubbed manager environment: guard armed, fetch patched, zero load-time throws) |
| trusted-types-browser-smoke | integration | 8/8 checks PASS (mode=live) |
| delivery-verification | delivery | 39/39 v2.0.0 installables verified |
| declarative contract | regression | `4NDR0NEERING VALIDATE: CERTIFIED (9/9 criteria verified)` — now including the R6-6 architecture cross-check (RED-verified fail-closed on stale counts and kernel_order drift) |
| unified gate | regression | `VALIDATION: CERTIFIED (9/9 gates PASS, 39/39 scripts)` |
| kit battery | delivery | `update-4ndr0666tools-suite-round-6.sh` over the round range: P1 clean git-am on PIN_BASE (tree bit-identical to PIN_TIP_TREE) · P2 idempotent re-run exits 0 · P3 adaptive 3-way over a moved HEAD with markers verified · P4 corrupted payload fails closed with HEAD untouched · P5 dirty worktree stashed and restored; the kit-applied clone re-certified end-to-end (9/9 + 7/7 + 9/9) with delivered dist digests equal to the kit pins |
| browser-txt-verification | delivery | all four delivery artifacts rendered in a real browser through the charset-faithful endpoint: ChatGPT++ v1.8.1 `.txt` (1,852 lines / 88,636 chars, UTF-8, R6-1/R6-3/R6-4 markers visible), Prompt Master v29.0.3 `.txt` (25,899 lines / 1,257,952 chars, UTF-8, R6-2/FIFO/mediaExt markers visible), the kit `.txt` (1,776 lines, PIN_BASE/PIN_TIP/PIN_PAYLOAD_SHA rendered, payload section present), and the worklog `.txt` (119 lines, Round 6 ledger + handoff rendered) |

### Known boundaries (BOUNDED, not waived)

1. Userscript-manager injection on a real profile (Tampermonkey/Violentmonkey).
2. Live authenticated ChatGPT / Google Flow backends — the R6-1/R6-2 consumers
   are verified against the engines' state machines and the load harness, not
   against the live sites' timing.
3. The Flow++ response-FIFO attribution assumes Flow completes queued
   generations in send order (the DOM-delta path is order-independent).

---

## Handoff — priming Round 7

**State:** main at the round-6 mitigation commits; every gate green; the
declarative contract now self-verifies its own architecture block.

**Operator live-site checklist (highest-value next actions):**

1. ChatGPT++ v1.8.1 on chatgpt.com: run in the default mode (new chat per
   image, no wait) with a prompt that triggers a clarification question — the
   panel should now answer it asynchronously when the run has finished and the
   page sits on that chat, or report "Clarification needed" with the thread
   left alive (never auto-deleted).
2. Open a gallery hours after a run and click Download — the file must save
   (fresh signed URL at click time), with the extension matching the asset.
3. Prompt Master v29.0.3 on Flow: uncheck "Wait for each generation", fire 3
   prompts — outputs should populate the gallery as they land (the poller),
   and the download names should carry real extensions (.webm stays .webm).
4. The standing suite-wide checks: `npm run check`, `npm test`, and
   `python3 scripts/4ndr0_validate.py --root . --convergence-contract contract.json --execute-checks --require-full-certification`.

**Round 7 entry point:** re-run the review loop with fresh eyes ("does this
code impress me?"), fold in operator findings from the checklist above (the
async consumers and the re-sign path have still never met the live sites),
re-seal the contract if the acceptance surface changes, and keep the ledger,
load harness, and gates as the regression backbone — extend them, never bypass
them. Candidate deferred improvements: a general all-39-script load harness
(richer DOM stubs); Attribution of Flow generation responses by request-id
correlation rather than FIFO; a clarify-answer path for non-active ChatGPT
conversations via navigation queueing (currently deliberately conservative).
---

## Round 7 — Suite-Wide VM Load Coverage, Timer/Navigation Hygiene & Smoke Wiring

**Baseline:** `c413673` (`main`, Round 6 close).
**Method:** `4ndr0neering` silent stepwise gap mitigation under strict **Superset Protocol** (`0 MISSING` units vs `c413673`).

### Findings ledger

| ID | Area | Severity | Root cause & fix | Verification |
|---|---|---|---|---|
| **R7-1** | `src/4ndr0tools - ChatGPT++.user.js` (`v1.8.1` → `v1.8.2`), `src/4ndr0tools - Prompt Master.user.js` (`v29.0.3` → `v29.0.4`) | Medium | `maybeAnswerPendingClarification` only checked `convIdOf(location.pathname) === job.convId` before entering its multi-turn loop, risking sending a follow-up turn into a different chat if the user navigated away mid-clarification; both ChatGPT++ `attach()` and Prompt Master Flow++ `buildUI()` ran unbounded `setInterval(..., 2000)` DOM probes even in hidden tabs without `pagehide` teardown. Added per-turn `convIdOf(location.pathname) === job.convId` re-check inside the clarification loop, `document.hidden` short-circuit on both probes, `attachTimer` handles, and `pagehide` listeners clearing `attachTimer` and `pollTimer`; synced Prompt Master `@version` and fallback `VERSION` constants to `29.0.4`. | Rebuilt `dist/` + `inventory.json` (`39/39 CLEAN`); `tools/r6-load-harness.mjs` asserts `pagehide` registration, per-turn `convId` check, and `attachTimer` markers. |
| **R7-2** | `tools/r6-load-harness.mjs` | High | Round 6's load harness checked only 2 scripts and used a vacuous `__pmLoadedGuarantor` bypass for Prompt Master. Removed the bypass, added real contract assertions for `ChatGPT++` on `https://chatgpt.com/` and `Prompt Master` on `https://flow.google.com/` (verifying `__4NDR0_NET_API__`, `pollPendingJobs`, `attachTimer`), and expanded the isolated VM load sweep with richer DOM/prototype stubs (`Element`, `Node`, `HTMLCanvasElement`, `WebGLRenderingContext`, `AudioContext`, `GM_*`) to cover **all 39 `dist/*.user.js` installables**. | `node tools/r6-load-harness.mjs` → `LOAD HARNESS: PASS (39/39 scripts)` with zero uncaught throws. |
| **R7-3** | `package.json` | Low | Four standalone browser smoke scripts (`flow-chip-browser-smoke.mjs`, `ig-wall-browser-smoke.mjs`, `pm-grid-browser-smoke.mjs`, `tt-browser-smoke.mjs`) were unlinked from `package.json` npm scripts. Added `"smoke:browser"` chaining all four so no smoke harness is orphaned. | `npm run check` (`9/9 gates PASS`), `npm test` (`7/7 PASS`), `npm run smoke` (`ALL PASS`). |

### Verification summary (Round 7)

| Check | Outcome |
|---|---|
| `npm run check` | `VALIDATION: CERTIFIED (9/9 gates PASS, 39/39 scripts)` |
| `BASH_ENV= npm test` | `STATIC CHECKS: PASS` · `BEHAVIOR SUITE: ALL PASS (7/7)` · `DELIVERY VERIFICATION: PASS` |
| `node tools/r6-load-harness.mjs` | `LOAD HARNESS: PASS (39/39 scripts)` |
| `npm run smoke` | `ALL PASS` (`tt-browser-smoke.mjs` runs `6/6 PASS` via `structural-fallback` in sandbox where Chromium policy blocks `127.0.0.1`) |
| `scripts/4ndr0_validate.py --execute-checks --require-full-certification` | `4NDR0NEERING VALIDATE: CERTIFIED (9/9 criteria verified)` |
| `scripts/4ndr0_hash.py --baseline-rev c413673` | `0 MISSING` units (strict Superset Protocol verified) |

### Handoff — priming Round 8

**State:** `main` advanced with Round 7 mitigations (`ChatGPT++ v1.8.2`, `Prompt Master v29.0.4`, all-39-script VM load harness, `smoke:browser` script); all 9 validation gates, 7 behavior suites, and 9 declarative contract criteria green with `0 MISSING` units.
**Remaining live-site boundary:** Authenticated live testing of ChatGPT++ (`v1.8.2`) and Prompt Master Flow++ (`v29.0.4`) in a real browser profile (Tampermonkey/Violentmonkey) and running `npm run smoke:browser` on an unrestricted host remain operator verification steps.
---

## Round 8 — Version-Surface Parity, Grant-Scoped VM Sandbox & Timer Hygiene

**Baseline:** `bdfc254` (`main`, Round 7 close).
**Method:** `4ndr0neering` silent stepwise gap mitigation under strict **Superset Protocol** (`0 MISSING` units vs `bdfc254`).

### Findings ledger

| ID | Area | Severity | Root cause & fix | Verification |
|---|---|---|---|---|
| **R8-1** | `src/4ndr0tools - Pixeldrain++.user.js` (`v1.2.7` → `v1.2.8`), `src/4ndr0tools - Zai Exporter.user.js` (`v1.0.2` → `v1.0.3`), `src/4ndr0tools - Forum Link Xtractor.user.js` (`v3.2.5` → `v3.2.6`), `src/4ndr0tools - Forums++.user.js` (`v1.14.1` → `v1.14.2`), `tests/static_checks.mjs` | Medium | Four shipped scripts had stale internal version strings diverging from `@version` (`Pixeldrain++` `VERSION = '1.2.2'` rendered in modal/badge/footer/log; `Zai Exporter` `SCRIPT.version = '1.0.0'` written to exported JSON/MD; `Forum Link Xtractor` `v3.2.4-Ψ` banner; `Forums++` `v1.14.0` banner), with no automated static gate. Synced all internal version constants and banners to `@version` and added an automated `Version-surface parity (39/39)` gate to `tests/static_checks.mjs` (RED-verified when it immediately caught stale `BypassPaywalls` and `Hailuo++` banners before sync). | `node tests/static_checks.mjs` → `Version-surface parity (39/39)` PASS. |
| **R8-2** | `src/4ndr0tools - Hailuo++.user.js` (`v6.2.0` → `v6.2.1`) | Medium | Primary orchestration `setInterval(..., config.constants.executionInterval)` was untracked with zero `clearInterval` and zero `pagehide` teardown. Bound handle to `this.loopTimer` and added `{ once: true }` `pagehide` teardown clearing `this.loopTimer`. | Rebuilt `dist/` (`39/39 CLEAN`); `node tools/r6-load-harness.mjs` evaluates clean (`39/39`). |
| **R8-3** | `src/4ndr0tools - BypassPaywalls.user.js` (`v0.1.8` → `v0.1.9`), `tests/static_checks.mjs`, `tools/r6-load-harness.mjs` | Medium | `BypassPaywalls` omitted `@grant` completely (leaving sandbox mode to userscript-manager heuristics), and `tools/r6-load-harness.mjs` injected every `GM_*` API into every VM sandbox regardless of each script's `@grant` header. Added explicit `// @grant none` to `BypassPaywalls`, added an `Explicit non-conflicting @grant (39/39)` check to `tests/static_checks.mjs`, and refactored `tools/r6-load-harness.mjs` to expose only the `GM_*` / `GM.*` APIs declared by each script's own `@grant` header. | `STATIC CHECKS: PASS (39 installables verified)` · `LOAD HARNESS: PASS (39/39 scripts)` under grant-scoped VM isolation. |
| **R8-4** | `package.json` (`tests/browser_fixture_check.sh`) | Low | `tests/browser_fixture_check.sh` was unreferenced in `package.json`. Wired `"smoke:fixture": "bash tests/browser_fixture_check.sh"` so no test script is orphaned. | `npm run smoke:fixture` → `tt-browser-smoke: 6/6 assertions passed`. |

### Verification summary (Round 8)

| Check | Outcome |
|---|---|
| `npm run check` | `VALIDATION: CERTIFIED (9/9 gates PASS, 39/39 scripts)` |
| `BASH_ENV= npm test` | `STATIC CHECKS: PASS` (incl. `@grant` + Version-surface parity) · `BEHAVIOR SUITE: ALL PASS (7/7)` · `DELIVERY VERIFICATION: PASS` |
| `node tools/r6-load-harness.mjs` | `LOAD HARNESS: PASS (39/39 scripts)` (grant-scoped VM sandbox) |
| `npm run smoke` & `npm run smoke:fixture` | `ALL PASS` (`tt-browser-smoke.mjs` runs `6/6 PASS` via `structural-fallback` in sandbox where Chromium policy blocks `127.0.0.1`) |
| `scripts/4ndr0_validate.py --execute-checks --require-full-certification` | `4NDR0NEERING VALIDATE: CERTIFIED (9/9 criteria verified)` |
| `scripts/4ndr0_hash.py --baseline-rev bdfc254` | `0 MISSING` units (strict Superset Protocol verified) |

### Handoff — priming Round 9

**State:** `main` advanced with Round 8 mitigations (`Pixeldrain++ v1.2.8`, `Zai Exporter v1.0.3`, `Forum Link Xtractor v3.2.6`, `Forums++ v1.14.2`, `Hailuo++ v6.2.1`, `BypassPaywalls v0.1.9`, automated version-parity & `@grant` static gates, grant-scoped 39-script VM load harness, `smoke:fixture` script); all 9 validation gates, 7 behavior suites, and 9 declarative contract criteria green with `0 MISSING` units.
**Remaining live-site boundary:** Live authenticated browser testing in Tampermonkey/Violentmonkey and running `npm run smoke:browser` / `npm run smoke:fixture` on an unrestricted host (where `127.0.0.1` is permitted by Chromium policy) remain operator verification steps.
---

## Round 9 — Browser-Smoke Binary Discovery & OPSEC `window.open` Hardening

**Baseline:** `787064e` (`main`, Round 8 close).
**Method:** `4ndr0neering` silent stepwise gap mitigation under strict **Superset Protocol** (`0 MISSING` units vs `787064e`).

### Findings ledger

| ID | Area | Severity | Root cause & fix | Verification |
|---|---|---|---|---|
| **R9-1** | `tools/flow-chip-browser-smoke.mjs`, `tools/ig-wall-browser-smoke.mjs`, `tools/pm-grid-browser-smoke.mjs`, `tools/tt-browser-smoke.mjs` | Medium | Operator debrief on Arch Linux (`theworkpc`) hit `[mode=structural-fallback (no-chromium)]` across browser smoke harnesses because `findChromium`/`probeChromium` only probed 3 hardcoded paths (`/usr/lib/chromium/chromium`, `/usr/bin/chromium`, `/usr/bin/google-chrome`) plus `~/.cache/ms-playwright`, ignoring `CHROME_BIN`/`CHROMIUM_BIN`/`BROWSER_BIN` env overrides and common Chromium-family binaries (`google-chrome-stable`, `chromium-browser`, `brave`, `brave-browser`, `vivaldi`, `vivaldi-stable`, `ungoogled-chromium`, `microsoft-edge-stable`, `thorium-browser`). Expanded binary discovery in all four drivers while preserving existing function names for zero-regression unit parity. | `npm run smoke:browser` & `BASH_ENV= npm run smoke:fixture` PASS (all 4 harnesses green). |
| **R9-2** | `src/4ndr0tools - Bunkr++.user.js` (`v7.7.2` → `v7.7.3`), `src/4ndr0tools - ChatGPT++.user.js` (`v1.8.2` → `v1.8.3`), `src/4ndr0tools - Confirmation Bypass.user.js` (`v4.1.7` → `v4.1.8`), `src/4ndr0tools - Instagram++.user.js` (`v13.3.0` → `v13.3.1`), `src/4ndr0tools - Login Form Autofiller.user.js` (`v2.0.11` → `v2.0.12`), `src/4ndr0tools - Pixeldrain++.user.js` (`v1.2.8` → `v1.2.9`), `src/4ndr0tools - Prompt Master.user.js` (`v29.0.4` → `v29.0.5`) | Medium | 12 fire-and-forget external `window.open(...)` calls across 7 scripts omitted `'noopener,noreferrer'`, exposing `window.opener` and referrer metadata to external destinations. Added `'noopener,noreferrer'` to all 12 sites while intentionally preserving `Gofile++:571` (`if (!win) blocked++` popup-blocker detector) and `Pixeldrain++:1502` (`about:blank` handle write). Synced all `@version`, internal `VERSION`/`SCRIPT_VERSION`, and console banners and rebuilt `dist/`, `inventory.json`, and `README.md`. | `node tests/static_checks.mjs` (`Version-surface parity 39/39`, `Explicit @grant 39/39`) · `node tools/r6-load-harness.mjs` (`39/39 PASS`). |

### Verification summary (Round 9)

| Check | Outcome |
|---|---|
| `npm run check` | `VALIDATION: CERTIFIED (9/9 gates PASS, 39/39 scripts)` |
| `BASH_ENV= npm test` | `STATIC CHECKS: PASS` · `BEHAVIOR SUITE: ALL PASS (7/7)` · `DELIVERY VERIFICATION: PASS` |
| `npm run smoke:browser` & `BASH_ENV= npm run smoke:fixture` | `ALL PASS` — **live headless Chromium** unlocked: Flow Chip `13/13` · IG Wall `23/23` (`dist+canon+sabotage+layout-red-control`) · PM Grid `15/15` (`dist`) · TT `6/6` (`structural-fallback (host-policy-blocked-localhost)`) |
| `scripts/4ndr0_validate.py --execute-checks --require-full-certification` | `4NDR0NEERING VALIDATE: CERTIFIED (9/9 criteria verified)` |
| `scripts/4ndr0_hash.py --baseline-rev 787064e` | `0 MISSING` units (strict Superset Protocol verified) |

### Handoff — priming Round 10

**State:** `main` advanced with Round 9 mitigations (Chromium-family + `CHROME_BIN` discovery in all 4 browser smoke harnesses; `'noopener,noreferrer'` OPSEC hardening across 7 scripts); all 9 validation gates, 7 behavior suites, and 9 declarative contract criteria green with `0 MISSING` units.
**Operator next step:** Pull & push the Round 9 bundle, then run `npm run smoke:browser` (or `CHROME_BIN=/path/to/your-browser npm run smoke:browser`) on `theworkpc` to confirm live headless Chromium execution.
