# Worklog — ChatGPT Bulk Images userscript

Engineering log for `chatgptbulk.user.js`, maintained under the 4ndr0neering v8.2.0
convergence protocol. Every round ends with a superset check (no prior feature may be
omitted, regressed, or weakened), a certified or bounded delivery decision, and a
handoff priming the next iteration.

---

## Round 1 — silent stepwise gap mitigation (2026-11-13)

- **Protocol:** 4ndr0neering v8.2.0, tier T3 (single-file userscript + full kit delivery)
- **Baseline:** `93056fc` — userscript v1.0.0 imported verbatim from the operator upload
- **Contract:** sealed before implementation (`2b8bf5e`), re-sealed once pre-execution
  only to correct a command's JSON-schema reference (`866f9f4`); acceptance semantics unchanged
- **Candidate:** v1.1.0, commit range `93056fc..HEAD`
- **Method:** full-file adversarial review (logic holes, edge cases, efficiency, dead code),
  then focused mitigation commits, each individually syntax-checked and committed with rationale.

### Findings ledger

Every gap found in the v1.0.0 review, its class, and the fixing commit:

| # | Finding (v1.0.0 behavior) | Class | Fix commit |
|---|---|---|---|
| 1 | Double injection (two managers / re-inject) stacked a second panel and double-patched `window.fetch` | robustness | `1ae1a6d` |
| 2 | `when()` rendered `Invalid Date` (and epoch for null) for missing/unparsable reset timestamps | correctness | `1ae1a6d` |
| 3 | Missing `reset_after` produced a dangling `Resets .` message | correctness | `1ae1a6d` |
| 4 | API-derived strings (slugs, notes) reached `innerHTML` unescaped — hostile backend payload could inject markup into the panel | security | `1ae1a6d` |
| 5 | Unsigned session sent `Authorization: Bearer undefined` instead of failing with a clear error | correctness | `1ae1a6d` |
| 6 | Model-only selection of a preset-less version silently kept the page default model (dropdown was a no-op) | functional gap | `5d59a81` |
| 7 | Lock detection ignored version-only choices, so the "Send anyway" guard never appeared for them | functional gap | `5d59a81` |
| 8 | `execCommand` failure (blocked/unsupported) left the composer empty and the run errored downstream | robustness | `2a55b88` |
| 9 | Stop was ignored during pre-send waits — up to 70 s of dead time after pressing Stop | UX correctness | `2a55b88` |
| 10 | Cyclic/malformed conversation mapping hung `thread()` forever, latching `polling` true and silently freezing all gallery updates | crash resilience | `4d1d02f` |
| 11 | Any throw outside the per-conversation `api()` catch escaped `pollGallery` as an unhandled rejection every 4 s | crash resilience | `4d1d02f` |
| 12 | Job-to-message matching stalled to the 15-minute timeout when the user interleaved their own messages, or mispaired neighbors | correctness | `4d1d02f` + `6efcce5` |
| 13 | One poisoned job could abort processing of its siblings | robustness | `4d1d02f` |
| 14 | Gallery rebuilt every tile on every 4 s poll tick — flicker plus discarded layout work at any gallery size | efficiency | `5182231` |
| 15 | Multi-image jobs downloaded every image as `bulk-<n>.png`, overwriting each other | correctness | `5182231` |
| 16 | Header version was blank when `GM_info` was unavailable; no second-host guard in `buildUI` | polish | `5182231` |

Commit map: `1ae1a6d` boot/escaping/dates/session · `5d59a81` model+lock · `2a55b88`
composer/stop · `4d1d02f` gallery resilience · `6efcce5` matching refinement ·
`5182231` render safety/efficiency + v1.1.0 bump · `0740afa`/`ea2f603` test suites.

### Superset verification (v1.0.0 feature inventory → v1.1.0 status)

All 27 baseline lexical units preserved (**0 MISSING** in the `93056fc..HEAD` unit
comparison), and every sealed capability verified present and exercised:

| v1.0.0 capability | Status in v1.1.0 | Evidence |
|---|---|---|
| Fresh-chat-per-image mode | preserved | behavior suite T4/T5 (mocked `newChat` path via same-mode equivalents; selector inventory in static guard) |
| Same-chat mode | preserved | behavior suite T4/T5/T8 full runs |
| Project targeting (current / none / named) | preserved | static guard markers; `newChat` untouched |
| Model + effort selection with Keep-current | preserved | behavior suite T3/T5 |
| Model-lock detection + force override | preserved, extended (finding 7) | behavior suite T5 |
| Usage limits (display, refresh, auto-cap, stop-at-zero) | preserved, hardened (findings 2–4) | behavior suite T3, real-Chromium fixture |
| Delay control / wait-for-each | preserved | static guard; runner untouched |
| Live gallery (pending/done/failed, lightbox, clear) | preserved, hardened (findings 10–14) | behavior suite T7/T8, fixture |
| Stop button + cancellation semantics | preserved, improved (finding 9) | behavior suite T6 |
| Ctrl/Cmd+Enter run, keyboard isolation | preserved | static guard markers |
| Settings persistence (`bulkimg:settings`) | preserved | behavior suite T9, fixture reload |
| SPA re-attach, shadow-DOM isolation | preserved | behavior suite T1/T2 |
| Fetch-based model override | preserved, extended (finding 6) | behavior suite T5 (rewritten body asserted) |
| Image extraction + download URLs, 15-min timeout | preserved | behavior suite T7, fixture |

Deliberate behavioral deltas (all strictly additive): Stop now takes effect before a
prompt is sent; preset-less models actually apply; version-only locks now warn;
downloads are collision-free; hostile strings render escaped.

### Verification evidence (contract `contract.json`, 10 mandatory criteria)

| Criterion | Gate | Result |
|---|---|---|
| syntax-valid | functional | `node --check` clean |
| static-superset-guard | regression | 129/129 checks (hygiene, metadata, 27 definitions, 66 feature markers, 19 hardening markers) |
| behavior-suite | functional | 53/53 jsdom checks |
| unit-superset-no-missing | regression | 0 MISSING units (11 CHANGED, 1 NEW, 19 UNCHANGED) |
| perf-gallery-render | performance | paired ratio 0.671 (95 % CI 0.669–0.678), equal stdout, Node 24 + jsdom envelope |
| real-browser-fixture | integration | full mocked run in real Chromium + HTTP-origin reload persistence |
| kit-battery-green | delivery | P0–P7 + P1B + P1C + RED_CONTROL battery GREEN; kit bytes match `PIN_KIT_SHA` |
| round-record-pins | delivery | all six pins present in the HTML round record |
| worklog-handoff | delivery | this file, zero stubs |
| browser-txt-verification | delivery | delivered `.txt` rendered in a real browser through both endpoint chains |

Artifacts: `.4ndr0/` (ledger, manifests, comparison, alignment report, perf result,
kit metadata, round record) — gitignored by protocol; mirrored pins live in the
update kit and the round-record HTML.

### Performance review (PF directives applied)

- No N+1 or repeated scans introduced; the poll loop fetches each pending conversation
  once per tick (unchanged from v1.0.0).
- The one measured hot path (onGalleryChange at poll cadence) was changed only with a
  workload-backed measurement: 40 pending jobs × 1000 ticks, paired, source-fingerprinted,
  alternating order, bootstrap CI — candidate median 0.671× baseline with identical output.
- Wall-time in a real browser engine is explicitly **not** claimed; the measurement
  envelope is Node 24 + jsdom (see boundaries below).

### Known boundaries (BOUNDED, not waived)

1. **Userscript-manager injection** (`@run-at document-idle`, `@noframes`, `GM_info`
   provisioning) requires Tampermonkey/Violentmonkey on a real profile — not executable
   in this sandbox. Bounded by: static metadata checks + the script body proven to boot
   and run in real Chromium via the HTTP fixture.
2. **Live ChatGPT backend** (auth/session tokens, models list, conversation/init limits,
   files/download) is an external authenticated service. Bounded by: the full payload
   contract exercised against recorded shapes in jsdom and real Chromium — the operator's
   live-site spot-check closes this boundary.
3. **Real-browser wall-time** for the render suppression is bounded by the jsdom-envelope
   measurement above; no browser-engine speed claim is made.

Because of boundaries 1–2 the GUP evidence plane records `BOUNDED_PASS` even though every
engineer-owned contract criterion is VERIFIED; the kit is therefore delivered as
**Class H (Bounded Handoff)** per the delivery ladder. This is the protocol's honest
representation, not a defect.

### Round 1 closure addendum (2026-11-14)

The original session was interrupted after the kit build but before the round-record
HTML generation and the final ledger pass (ledger stood at 7/10 with
`kit-battery-green`, `round-record-pins`, and `browser-txt-verification` pending).
Closure work in the resumed session:

- **Delivery endpoints restored.** The sandbox recycles processes between sessions;
  the direct file-delivery chain (:3000) and the caddy user-facing chain (:81, whose
  upstream is :3000) were brought back up before the browser possession proof.
- **Endpoint charset defect found and fixed (environment, not artifact).** Python's
  `http.server` serves `.txt` as `text/plain` with no charset parameter, so Chrome
  decoded the UTF-8 artifact as Latin-1 — every multi-byte character doubled
  (604 lines correct, but 33256 rendered chars vs 33227 code points, exactly the
  29 multi-byte characters in the artifact). The file-delivery endpoint now declares
  `charset=utf-8`; the artifact itself is unchanged (SHA-256 `a674ffc…` still equals
  `PIN_KEY_SHA`).
- **Delivery harness hardened** (`tests/verify_delivery.sh`): the agent-browser
  daemon deterministically dropped its response socket (EAGAIN) when the second
  chain's open/eval burst followed the first chain's evals. Each chain now gets a
  fresh browser instance and every eval is retried with a settle pause, failing
  closed on exhaustion. The checks themselves are unchanged — both chains must
  still render every marker with exact character and line counts.
- **Kit rebuilt over the extended range** (`93056fc..HEAD`, now including the harness
  hardening) with the full `P0–P7 + P1B + P1C + RED_CONTROL` battery re-executed;
  all pins re-derived mechanically from the new tip.
- **Ledger closed:** all 10 mandatory criteria verified (latest-event-wins; the
  transient `browser-txt-verification` DEFECT events from the endpoint-charset and
  daemon debugging are retained in the chain as honest history). The GUP evidence
  plane remains `BOUNDED_PASS` under the same two runtime boundaries above —
  Class H delivery stands.

---

## Round 2 — silent stepwise gap mitigation (2026-11-14)

- **Protocol:** 4ndr0neering v8.2.0, tier T3
- **Baseline:** `3413c7e` — the closed Round 1 state (v1.1.0)
- **Contract:** re-sealed before implementation — a new acceptance baseline (GUP-C01:
  the round-2 delivery artifacts carry new names — `round-record-round-2.html`,
  round-2 kit metadata — so the contract SHA changed and a fresh ledger was initialized;
  the controller schema stays v1.0). The ten acceptance gates keep their original
  semantics; the superset rule now explicitly covers v1.0.0 **and** v1.1.0 capabilities.
- **Candidate:** v1.2.0, commit range `3413c7e..HEAD`
- **Method:** full-file adversarial re-review of v1.1.0 with fresh eyes, then one
  focused mitigation commit (`8044d35`) with every finding covered by a new behavioral
  test (RED-verified against the v1.1.0 artifact) and a new static hardening marker.

### Findings ledger

| # | Finding (v1.1.0 behavior) | Class | Fix |
|---|---|---|---|
| R2-1 | Re-running the same chat with a **different prompt** (old jobs still in the gallery) inflated the job ordinal `k` with prior-prompt jobs while the match list filtered by the new prompt — `k` landed out of range, both new jobs stalled to the 15-minute timeout and false-failed | correctness | `8044d35` |
| R2-2 | An explicit model/effort selection **silently no-ops** when the models list fails to load (a persisted effort survives the failed load), sending every prompt under the page default model with no warning | correctness | `8044d35` |
| R2-3 | The inter-job delay was an **uninterruptible sleep** (the input allows up to 600 s) and `read()` applied no upper clamp — Stop stayed dead for the whole delay | UX correctness | `8044d35` |
| R2-4 | Named-project chat opening clicked the **first** `aria-label` match even when hidden (collapsed sidebar), unlike the no-project path that prefers visible controls | robustness | `8044d35` |

### Superset verification (v1.1.0 → v1.2.0)

Static guard: **135/135** — all 27 v1.0.0 definitions, all 66 v1.0.0 feature markers
(one strengthened: the delay clamp now also enforces the 600 s upper bound), all 19
v1.1.0 hardening markers (the tail-of-matching marker now tracks the stronger
per-prompt sibling expression), and 6 new v1.2.0 hardening markers. Behavior suite:
**64/64** (T1–T10 unchanged and passing; T11a–d added). Every Round 1 fix keeps its
test. Deliberate behavioral deltas (all strictly additive): a different-prompt re-run
now pairs correctly instead of timing out; an unresolvable model selection refuses
the run instead of silently using the page default; Stop cuts the inter-job delay
within 250 ms; hidden named-project buttons are no longer clicked.

### Verification evidence (round-2 acceptance baseline, 10 mandatory criteria)

| Criterion | Gate | Result |
|---|---|---|
| syntax-valid | functional | `node --check` clean |
| static-superset-guard | regression | 135/135 checks |
| behavior-suite | functional | 64/64 jsdom checks (T11a–d RED-verified against v1.1.0) |
| unit-superset-no-missing | regression | 0 MISSING units across the full engagement range `93056fc..HEAD` |
| perf-gallery-render | performance | paired ratio 0.664 (95 % CI 0.659–0.671), equal stdout, Node 24 + jsdom envelope; contract re-sealed to the v1.2.0 candidate fingerprint before the run |
| real-browser-fixture | integration | full mocked run in real Chromium + HTTP-origin reload persistence (v1.2.0) |
| kit-battery-green | delivery | round-2 kit `update-bulkimg-round-2.sh`, P0–P7 + P1B + P1C + RED_CONTROL battery GREEN; kit bytes match `PIN_KIT_SHA` |
| round-record-pins | delivery | all six round-2 pins present in `round-record-round-2.html` |
| worklog-handoff | delivery | this file, zero stubs |
| browser-txt-verification | delivery | delivered v1.2.0 `.txt` rendered in a real browser through both endpoint chains |

### Known boundaries (BOUNDED, not waived) — unchanged from Round 1

1. Userscript-manager injection on a real profile (Tampermonkey/Violentmonkey).
2. Live authenticated ChatGPT backend.
3. Real-browser wall-time for the render suppression (jsdom-envelope measurement).

GUP evidence plane: `BOUNDED_PASS` → the round-2 kit is delivered as **Class H
(Bounded Handoff)**, exactly as Round 1.

---

## Round 3 — silent stepwise gap mitigation (2026-11-16)

- **Protocol:** 4ndr0neering v8.2.0, tier T3
- **Baseline:** `dd10b84` — the closed Round 2 state (v1.2.0); the operator's GitHub
  HEAD was verified byte-identical to the Round 2 candidate (`chatgptbulk.user.js`
  SHA-256 `d3d01ec…` = the round-2 `PIN_KEY_SHA`) before any work started
- **Contract:** re-sealed before implementation — the round-3 delivery artifacts carry
  new names (`update-bulkimg-round-3.sh`, `round-record-round-3.html`, round-3 kit
  metadata), so the contract SHA changed and a fresh ledger was initialized (the
  round-2 ledger is archived as `.4ndr0/ledger-round-2.json` with its criterion logs
  under `.4ndr0/evidence-round-2/`). The ten acceptance gates keep their original
  semantics; the superset rule now explicitly covers v1.0.0, v1.1.0, **and** v1.2.0
  capabilities.
- **Candidate:** v1.3.0, commit range `dd10b84..HEAD`
- **Method:** fresh-eyes adversarial re-review of v1.2.0 ("does this code impress
  me?"), then two focused commits — the `.gitignore` containment ship (R3-6) and one
  mitigation commit covering the five artifact findings, every one guarded by a new
  behavioral test **RED-verified against the v1.2.0 artifact** (9 failing checks,
  logs archived under `.4ndr0/evidence/round3-red/`) and a new static hardening
  marker. No operator findings were relayed from the Round 2 checklist (none
  reported), so the round is entirely review-driven.

### Findings ledger

| # | Finding (v1.2.0 behavior) | Class | Fix |
|---|---|---|---|
| R3-1 | Prompt→message matching compared only the **first 80 characters** while sibling grouping used full-prompt equality — two distinct prompts sharing an 80-char prefix in one conversation **cross-paired** (RED proof: both jobs bound to the second prompt's image; the first prompt's image was never claimed) | correctness | `171f2d9` |
| R3-2 | The **by-id project branch** (current-project mode — the default project setting — and every later chat of a named run) never got the hidden-control fallback R2-4 gave the by-name branch: a collapsed sidebar hid the project link and the whole run aborted with "could not find a way to open a new chat there" | robustness | `171f2d9` |
| R3-3 | The fetch override rewrote only the `/backend-api/f/conversation` send shape; a page POSTing to the plain `/backend-api/conversation` shape got **no rewrite** — the model/effort selection silently no-oped (the R2-2 silent-no-op class at the transport layer) | functional gap | `171f2d9` |
| R3-4 | Stop was **dead during the new-chat navigation window**: `newChat`'s 15 s opened-wait (plus the fixed settle) never checked the cancel flag — up to ~16.5 s of dead time after Stop, and a stray new chat could still open | UX correctness | `171f2d9` |
| R3-5 | `renderLimits` interpolated the backend-controlled `imagesLeft` (`limits_progress[].remaining`) into `innerHTML` **unescaped** — the Round 1 escaping fix covered slugs/notes/reset strings but left this field injectable (RED proof: a hostile remaining injected a real `img` element) | security hardening | `171f2d9` |
| R3-6 | The operator's repository never received the `.4ndr0/` gitignore containment the protocol mandates and the shipped README/worklog both **claim** — running the documented protocol commands there pollutes the worktree with untracked runtime state | repo hygiene | `2b96612` |

Commit map: `2b96612` .gitignore superset ship (operator content verbatim + section 10;
strict superset, zero WO-01 rule removed) · `171f2d9` the five artifact fixes +
T12a–e tests + v1.3.0 static markers + harness version pins · `141e2de` contract
re-seal.

### Superset verification (v1.2.0 → v1.3.0)

Static guard: **140/140** — all 27 v1.0.0 definitions, all 66 v1.0.0 feature
markers, all 19 v1.1.0 hardening markers, all 6 v1.2.0 hardening markers, and 5
new v1.3.0 hardening markers. Behavior suite: **81/81** (T1–T11 unchanged and
passing; T12a–e added and RED-verified against v1.2.0). Unit comparison over the
full engagement range `93056fc..HEAD`: **0 MISSING** units (14 CHANGED, 126 NEW,
16 UNCHANGED). Every Round 1 and Round 2 fix keeps its test. Deliberate behavioral
deltas (all strictly additive): prefix-sharing prompts now pair exactly; a hidden
project link is clicked as a last resort instead of aborting the run; the model
override rewrites both conversation-send shapes; Stop cuts the new-chat navigation
short and never opens a stray chat after it; the images-left value renders escaped.

### Verification evidence (round-3 acceptance baseline, 10 mandatory criteria)

| Criterion | Gate | Result |
|---|---|---|
| syntax-valid | functional | `node --check` clean |
| static-superset-guard | regression | 140/140 checks |
| behavior-suite | functional | 81/81 jsdom checks (T12a–e RED-verified against v1.2.0) |
| unit-superset-no-missing | regression | 0 MISSING units across the full engagement range `93056fc..HEAD` |
| perf-gallery-render | performance | paired ratio 0.727 (95 % CI 0.722–0.735), equal stdout, Node 24 + jsdom envelope; contract re-sealed to the v1.3.0 candidate fingerprint before the run |
| real-browser-fixture | integration | full mocked run in real Chromium + HTTP-origin reload persistence (v1.3.0) |
| kit-battery-green | delivery | round-3 kit `update-bulkimg-round-3.sh`, P0–P7 + P1B + P1C + RED_CONTROL battery GREEN (18/18); kit bytes match `PIN_KIT_SHA` |
| round-record-pins | delivery | all six round-3 pins present in `round-record-round-3.html` |
| worklog-handoff | delivery | this file, zero stubs |
| browser-txt-verification | delivery | delivered v1.3.0 `.txt` rendered in a real browser through both endpoint chains (641 lines, 36231 chars, charset-faithful) |

### Known boundaries (BOUNDED, not waived) — unchanged from Rounds 1–2

1. Userscript-manager injection on a real profile (Tampermonkey/Violentmonkey).
2. Live authenticated ChatGPT backend.
3. Real-browser wall-time for the render suppression (jsdom-envelope measurement).

GUP evidence plane: `BOUNDED_PASS` → the round-3 kit is delivered as **Class H
(Bounded Handoff)**, exactly as Rounds 1 and 2.

---

## Handoff — priming Round 4

**Apply this round:** from the closed Round 2 state run `bash
update-bulkimg-round-3.sh /full/path/to/repo` (from earlier states apply the
round-1/round-2 kits first). The kit works on the Round 2 state, a moved HEAD, or
an independent lineage via content pinning (`PIN_KEY_BASE_SHA` = the v1.2.0
artifact), and fails closed on conflicting edits to `chatgptbulk.user.js` — never
force past a fail-closed. It also ships the `.gitignore` containment section the
operator repo has been missing (R3-6), as a strict superset of the operator's
current ignore rules.

**Operator live-site checklist (closes the two open boundaries):**

1. Install v1.3.0 in Tampermonkey/Violentmonkey on `chatgpt.com`; confirm the FAB
   appears after idle and no second panel appears on SPA re-renders.
2. Run a 2-image job in fresh-chat mode with default model; confirm limits render,
   the gallery populates, and downloads are named `bulk-1-1.png`, `bulk-2-1.png`.
3. Pick a model with no effort presets (if the live list has one) and confirm the
   request model in DevTools matches the selection — **watch which conversation
   endpoint the page POSTs to** (`/backend-api/f/conversation` or the plain
   `/backend-api/conversation`); v1.3.0 rewrites both (R3-3).
4. Press Stop during the "Sending…" phase, during a long inter-job delay, **and
   while the status shows "Opening chat N/M…"**; confirm no extra prompt goes out,
   the delay cuts short within a second, and no stray new chat opens after Stop
   (R3-4).
5. Iterate on one long prompt in the same chat, changing only its **tail** (e.g.
   "…in summer" → "…in winter"); confirm each job claims its own image (R3-1).
6. Collapse the sidebar and run in current-project mode from inside a project
   chat; confirm the run still opens the project's chats (R3-2).
7. If the models list ever fails to load with a model/effort ticked, confirm the
   run refuses with "could not load the model list" instead of silently using the
   default.

**Candidate improvements still deliberately deferred** (each needs its own measured
justification per PF directives before adoption): retry budget for late-transient
`files/download` failures (the per-tick loop already retries while a job is
pending); `save-on-change` for settings; parallel per-conversation polling;
download-all button; signed-URL refresh for expired gallery links.

**Round 4 entry point:** re-run the review loop against v1.3.0 with fresh eyes
("does this code impress me?"), fold in operator findings from the checklist above
(especially the live endpoint-shape observation in item 3), re-seal a versioned
contract if the acceptance surface changes, and emit `update-bulkimg-round-4.sh`
from the new commit range. The ledger, tests, fixture, and perf driver in this repo
are the regression backbone — extend them, never bypass them.

---

## Round 4 — silent stepwise gap mitigation (2026-11-17)

- **Protocol:** 4ndr0neering v8.2.0, tier T3
- **Baseline:** `138d42a` — the closed Round 3 state (v1.3.0); the operator's GitHub
  HEAD was verified byte-identical to the Round 3 candidate (`chatgptbulk.user.js`
  SHA-256 `47bd5ff9…` = the round-3 `PIN_KEY_SHA`) before any work started
- **Operator directives (this round's driver):** the standing exhaustive-audit
  battery plus four explicit nuances — (1) a forced model selector as in
  `urzeye/ophel`, (2) the same reference image re-supplied with the prompt on every
  run, (3) stateless runs via cache dump + hard reload with failed-generation
  masking as in `4ndr0tools - Hailuo++.user.js`, (4) Hailuo++'s asset vault
  (intercept blobs and hold their bytes before the URL dies) replicated here.
- **Contract:** re-sealed before implementation — the round-4 delivery artifacts
  carry new names (`update-bulkimg-round-4.sh`, `round-record-round-4.html`,
  round-4 kit metadata), so the contract SHA changed and a fresh ledger was
  initialized (the round-3 ledger is archived as `.4ndr0/ledger-round-3.json`
  with its criterion logs under `.4ndr0/evidence-round-3/`). The ten acceptance
  gates keep their original semantics; the superset rule now explicitly covers
  v1.0.0, v1.1.0, v1.2.0, **and** v1.3.0 capabilities.
- **Candidate:** v1.4.0, commit range `138d42a..HEAD`
- **Method:** fresh-eyes adversarial re-review of v1.3.0 plus the four operator
  nuances; one mitigation commit covering the eight findings, every one guarded by
  a new behavioral test (RED-verified against the v1.3.0 artifact: 25 failing
  checks in the behavior suite + 19 static failures, logs archived under
  `.4ndr0/evidence/round4-red/`) and a new static hardening marker. The ophel
  reference was read from source (clone of `urzeye/ophel` @ v1.3.4:
  `src/core/model-locker.ts` + `src/adapters/chatgpt.ts`/`chatgpt-config.ts`
  config v10) and the Hailuo++ reference from this repository's own
  `dist/4ndr0tools - Hailuo++.user.js` (vault clone-at-create, purge masking).
  **Pre-delivery amendment (r4a, `f1d2213`):** the finalization review
  ("does this code impress me?") on the assembled candidate found three more
  gaps — the vault's live-shape join, a vanished-selection silent no-op, and a
  missing-reference silent degradation — each fixed and RED-verified against the
  pre-amendment v1.4.0 artifact (7 failing behavior checks + 4 static failures,
  logs archived under `.4ndr0/evidence/round4a-red/`), bringing the behavior
  suite to 128 checks and the static guard to 160.

### Findings ledger

| # | Finding (v1.3.0 behavior) | Class | Fix |
|---|---|---|---|
| R4-1 | A job whose prompt **never appears in the thread** (send dropped server-side, chat deleted, or the text came back altered) stayed `pending` forever — the 15-minute timeout sat *after* the `ui === undefined` continue, so the unmatched path never reached it (RED proof: a restored 16-minute-old unmatched job stays pending in v1.3.0, fails on the first tick in v1.4.0 while a freshly-sent unmatched sibling stays pending) | correctness | `0d05951` |
| R4-2 | The gallery "clear" guarded only the page-local `running` flag; with the stateless cycle a pending resume between reload and resume-start could be wiped, orphaning the run | UX correctness | `0d05951` |
| R4-3 | Model/effort selection applied **only during bulk runs** — the page's own (manual) sends always used the site default, and nothing kept the picker honest after route resets (nuance 1: the ophel forced-model selector) | functional gap | `0d05951` |
| R4-4 | No reference-image support: a reference image is consumed once by the composer; every bulk prompt went out text-only (nuance 2) | functional gap | `0d05951` |
| R4-5 | No stateless-run cycle and no failure masking: every job ran in one long-lived SPA session, and failed chats accumulated in the account (nuance 3 — the operator's cache-dump + hard-reload regime and the Hailuo++ purge mask) | functional gap | `0d05951` |
| R4-6 | No asset vault: images lived behind signed URLs that expire and blob: URLs the page revokes — a late download 403s or dies with the URL (nuance 4 — Hailuo++'s clone-at-create interception) | functional gap | `0d05951` |
| R4-7 | With an attachment uploading, the send button stays disabled longer than `sendPrompt`'s 10 s window — spurious "send button not available" failures once reference images land | robustness (support) | `0d05951` |
| R4-8 | With a model/effort selected and the model list unavailable, runs refuse (R2-2) but the panel gave no persistent indication that a ticked lock is inert | polish (support) | `0d05951` |
| R4-9 | The vault's join key was a **mock-world artifact**: `files/download` returns signed https URLs on the live site, so the page's blob: mint keys could never equal the stored `download_url` — the vault arm of the download chain and the tile re-mint would silently never fire outside the blob-download_url fixture (RED proof: a page-fetched image held under its signed URL re-mints after the signed refresh dies; the pre-amendment artifact served the dead URL) | live-shape gap | `f1d2213` |
| R4-10 | A **vanished model/effort selection** (retired server-side, arriving through the stateless-resume descriptor or the raw settings store that `lockActive` reads — both bypass the panel's dropdown sanitization) made `rewriteBody` silently no-op: every send left under the page default, the R2-2 failure class at two new entry points (RED proof: a resumed run with a retired model id sends under the page default in the pre-amendment artifact, refuses with a re-pick message after) | correctness | `f1d2213` |
| R4-11 | A ticked reference with **no loaded bytes** (never picked, unreadable, or too large to survive a stateless reload — the localStorage quota drops it) silently degraded the run to text-only sends, exactly what the feature exists to prevent (RED proof: the pre-amendment artifact sends text-only and reports Done; the amendment refuses with "reference image is ticked but not loaded") | correctness | `f1d2213` |

Commit map: `0d05951` the eight fixes + T13a–h tests + v1.4.0 static markers +
harness version pins · `0aa3331` contract re-seal + the perf driver's stateless
guard · `d1d04d2` worklog/README for the round-4 state · `f1d2213` the r4a
pre-delivery amendment (R4-9/10/11 + T13i–k tests + four static markers) ·
the worklog/README commit that closes the range.

### What the four nuances became

1. **Forced model selector (ophel-style), two layers.** *Transport:* the fetch
   rewrite (both conversation-send shapes, R3-3) now stays armed whenever the new
   "Force model" lock is ticked — every send on the page carries the locked
   model/effort, not just bulk runs. *UI sync:* an ophel-shaped picker sync keeps
   the page's own picker honest — selector families from ophel's chatgpt config
   v10 (composer-pill, `data-composer-navigation-target="reasoning"`,
   `data-codex-intelligence-trigger`, Model/模型 aria-labels; the Radix model menu;
   `model-switcher-*` test-id slugs; `.min-w-0` names; `.trailing`/`data-state`/
   `aria-checked` selected indicators), staged exactly like ophel: button wait →
   current-model signal check → native click with an `aria-expanded`-verified
   `pointerdown` fallback → 500 ms menu render delay → item click matched by slug
   or name → 1.5 s verification polls with two-consecutive stability → bounded
   relocks (max 2, then respect a manual override) → 3 s re-entry cooldown →
   500 ms debounce on setting changes → 300 ms relock on `pushState`/`popstate`
   route changes. With the models list unavailable, the panel warns the lock is
   inert (R4-8) and the run-refusal from R2-2 still applies. Since r4a the
   warning judges the **persisted store** (what `applyOverride` actually forces)
   rather than the sanitized dropdowns and names a dead selection explicitly, a
   live lock persists dropdown changes immediately (so it can never keep forcing
   a stale store model), and every run entry — panel Generate and the stateless
   resume — refuses a selection that no longer resolves against the loaded list
   (R4-10).
2. **Reference image re-supply.** The image persists as a data URL under
   `bulkimg:ref` (localStorage, decoded to a **fresh File per send** so the
   composer's one-shot consumption never starves the next run; oversized images
   degrade to page-memory with a status note). Three attach strategies, each
   followed by an attach-evidence wait: the composer's own (possibly hidden) file
   input (`input.files` assignment + change event), a paste carrying the file
   (duck-typed clipboard data when the engine has no `DataTransfer`), and a drop
   onto the composer. If no strategy produces evidence the run **refuses** with
   "reference image did not attach" — never a silent text-only send. The
   send-button wait extends to 30 s while an attachment uploads (R4-7). Since r4a
   a ticked reference with no loaded bytes also refuses the run — "reference image
   is ticked but not loaded — pick it again or untick" — covering the never-picked,
   unreadable, and too-large-to-survive-a-stateless-reload cases (R4-11).
3. **Stateless runs + failed-generation masking.** After each send (and the pacing
   delay), a stateless run persists a durable resume descriptor
   (`bulkimg:run` in sessionStorage — prompt, settings, next index, and the whole
   job list), dumps every Cache Storage entry, deregisters the service workers,
   and reloads; the next document restores the gallery, resumes polling, and
   continues the run at the next index (a 6 h TTL discards stale descriptors;
   Stop clears the resume; a crash mid-run leaves the last-persisted index
   durable). Failed jobs **purge** their conversation via
   `DELETE /backend-api/conversation/<id>` — once per conversation, only when no
   sibling job is pending or done (never destroy live or successful work), and
   the failure note records the mask, exactly the Hailuo++ `purgeAccount` shape
   scoped to what this script owns.
4. **Asset vault.** `URL.createObjectURL` is wrapped so every image blob the page
   mints is cloned into a bounded registry (64 entries / 192 MiB, FIFO, duck-typed
   cross-realm admission) — and, since r4a, the fetch wrapper carries a **response
   arm**: every GET the page itself makes that answers `image/*` is cloned into the
   vault under the exact URL the gallery stores. That is the join the signed-URL
   world needs — the page's blob: mint keys never equal the stored `download_url`,
   so the blob-keyed arm alone could never fire on the live site (R4-9); the
   response arm is passive (zero extra requests), GET-only, and silently tolerant
   of engines whose Response objects cannot be cloned. The download chain tries a
   fresh signed URL first, then re-mints the vault clone (mime-derived extension,
   keyed by either arm), then the original URL as last resort; dead gallery tiles
   re-mint once from the clone. The registry holds the *bytes* — a Blob outlives
   its URL — so revocation and signed-URL expiry can no longer kill a late
   download.

### Superset verification (v1.3.0 → v1.4.0)

Static guard: **160/160** — all 27 v1.0.0 definitions, all 66 v1.0.0 feature
markers, all 19 v1.1.0, 6 v1.2.0, and 5 v1.3.0 hardening markers, and 20 new
v1.4.0 hardening/feature markers (16 from the mitigation commit, 4 from r4a).
Behavior suite: **128/128** (T1–T12 unchanged and passing — T11c/T12d now opt out
of the stateless default explicitly, since they target the delay's and the
navigation's interruptibility; T13a–h added and RED-verified against v1.3.0;
T13i–k added and RED-verified against the pre-amendment v1.4.0 artifact). Unit
comparison over the full engagement range `93056fc..HEAD`: **0 MISSING** units
(15 CHANGED, 154 NEW, 15 UNCHANGED — 184 total). Every Round 1–3 fix keeps its
test. Deliberate behavioral deltas (all strictly additive, all operator-directed):
stateless runs default **on** (the operator's regime; one checkbox disables them
and the perf driver/seeding tests do exactly that); purge defaults **on** (scoped
to exclusively-failed conversations); a locked model applies to manual sends too;
unmatched jobs time out on schedule; a dead selection or a missing reference
refuses the run instead of degrading silently.

### Verification evidence (round-4 acceptance baseline, 10 mandatory criteria)

| Criterion | Gate | Result |
|---|---|---|
| syntax-valid | functional | `node --check` clean |
| static-superset-guard | regression | 160/160 checks |
| behavior-suite | functional | 128/128 jsdom checks (T13a–h RED-verified against v1.3.0; T13i–k RED-verified against the pre-amendment v1.4.0) |
| unit-superset-no-missing | regression | 0 MISSING units across the full engagement range `93056fc..HEAD` (184 units: 15 CHANGED, 154 NEW, 15 UNCHANGED) |
| perf-gallery-render | performance | paired ratio 0.759 (95 % CI 0.745–0.759), equal stdout, Node 24 + jsdom envelope; perf contract re-sealed to the amended v1.4.0 candidate fingerprint before the run |
| real-browser-fixture | integration | full mocked run in real Chromium + HTTP-origin reload persistence + round-4 controls verified (v1.4.0) |
| kit-battery-green | delivery | round-4 kit `update-bulkimg-round-4.sh` (4-commit range `138d42a..f1d2213`), P0–P7 + P1B + P1C + RED_CONTROL battery GREEN (18/18); kit bytes match `PIN_KIT_SHA` |
| round-record-pins | delivery | all six round-4 pins present in `round-record-round-4.html` |
| worklog-handoff | delivery | this file, zero stubs |
| browser-txt-verification | delivery | delivered v1.4.0 `.txt` rendered in a real browser through both endpoint chains (1160 lines, 63705 chars, charset-faithful) |

### Known boundaries (BOUNDED, not waived) — unchanged from Rounds 1–3

1. Userscript-manager injection on a real profile (Tampermonkey/Violentmonkey).
2. Live authenticated ChatGPT backend — extended this round to the live shape of
   the model picker (selector families were taken from ophel's actively-maintained
   chatgpt adapter, config v10, 2026-11) and the attachment-evidence selectors
   (chip hints verified only against the mocked composer).
3. Real-browser wall-time for the render suppression (jsdom-envelope measurement).

GUP evidence plane: `BOUNDED_PASS` → the round-4 kit is delivered as **Class H
(Bounded Handoff)**, exactly as Rounds 1–3.

---

## Handoff — priming Round 5

**Apply this round:** from the closed Round 3 state run `bash
update-bulkimg-round-4.sh /full/path/to/repo` (from earlier states apply the
round-1/2/3 kits first). The kit works on the Round 3 state, a moved HEAD, or an
independent lineage via content pinning (`PIN_KEY_BASE_SHA` = the v1.3.0
artifact), and fails closed on conflicting edits to `chatgptbulk.user.js` — never
force past a fail-closed.

**Operator live-site checklist (closes the open boundaries; round-4 items first):**

1. Install v1.4.0 in Tampermonkey/Violentmonkey on `chatgpt.com`; confirm the FAB
   appears, and the four new controls render: "Force model", the reference-image
   picker, "Stateless run", and "Purge failed chats".
2. **Reference image:** pick an image, tick "Attach reference to every prompt",
   run 2 images, and confirm each chat carries the attachment (the composer shows
   the chip before each send). If a run ever stops with "reference image did not
   attach", report which composer surface the live site showed — the attach
   evidence selectors are the one live-shape guess in this feature.
3. **Forced model:** tick "Force model" with a model chosen, open a manual chat,
   send anything, and confirm DevTools shows the locked model in the outgoing
   `/backend-api/conversation` (or `/f/conversation`) body; navigate around and
   confirm the page's own picker follows the lock.
4. **Stateless runs:** run 3 images with the toggle on; watch the page dump caches
   and reload between images, the gallery restore after each reload, and the run
   complete 3/3. Press Stop mid-cycle and confirm no further prompts go out and
   the resume descriptor is gone (the run does not continue after a manual reload).
5. **Purge:** force one failed generation (e.g. a policy-refusing prompt) and
   confirm the conversation disappears from the sidebar with the failure note
   reading "(chat purged — failure masked)"; confirm a *successful* chat is never
   deleted.
6. **Asset vault:** after a run, wait a minute (or revoke/expire by closing and
   reopening the chats), then click a gallery tile → Download: the image must
   still save (fresh signed URL or the vault clone).
7. The standing Round 3 checklist items remain valid (limits render, downloads
   named `bulk-<n>-<i>.png`, Stop during send/delay/navigation, prefix-sharing
   prompts pair correctly, model-list refusal).

**Candidate improvements still deliberately deferred** (each needs its own measured
justification per PF directives before adoption): retry budget for late-transient
`files/download` failures (the per-tick loop already retries while a job is
pending); `save-on-change` for settings; parallel per-conversation polling;
download-all button; IndexedDB reference storage beyond the localStorage quota;
purge pacing/jitter if the API ever rate-limits deletes.

**Round 5 entry point:** re-run the review loop against v1.4.0 with fresh eyes
("does this code impress me?"), fold in operator findings from the checklist above
(especially items 2–5 — the live shapes behind this round's four features), re-seal
a versioned contract if the acceptance surface changes, and emit
`update-bulkimg-round-5.sh` from the new commit range. The ledger, tests, fixture,
and perf driver in this repo are the regression backbone — extend them, never
bypass them.
