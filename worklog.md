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

## Handoff — priming Round 2

**Apply this round:** `bash update-bulkimg-round-1.sh /full/path/to/repo` (works on the
pristine baseline, a moved HEAD, or an independent lineage via content pinning; fails
closed on conflicting edits to `chatgptbulk.user.js` — never force past a fail-closed).

**Operator live-site checklist (closes the two open boundaries):**

1. Install v1.1.0 in Tampermonkey/Violentmonkey on `chatgpt.com`; confirm the FAB appears
   after idle and no second panel appears on SPA re-renders.
2. Run a 2-image job in fresh-chat mode with default model; confirm limits render, the
   gallery populates, and downloads are named `bulk-1-1.png`, `bulk-2-1.png`.
3. Pick a model with no effort presets (if the live list has one) and confirm the request
   model in DevTools matches the selection (finding 6 on real data).
4. Press Stop during the "Sending…" phase and confirm no extra prompt goes out.
5. Open a chat that previously produced images (repeat-run scenario) and confirm new jobs
   pair to the new segments, not yesterday's.

**Candidate improvements deliberately deferred** (avoided scope creep in Round 1, all
superset-safe if wanted later): retry budget for permanently-failing `files/download`
calls; `save-on-change` for settings (currently saved on run, as in v1.0.0); parallel
per-conversation polling; download-all button. None are regressions — they are
additions, and each should carry its own measured justification per PF directives.

**Round 2 entry point:** re-run the review loop against v1.1.0 with fresh eyes
("does this code impress me?"), fold in any operator findings from the checklist above,
re-seal a versioned contract if acceptance changes, and emit `update-bulkimg-round-2.sh`
from the new commit range. The ledger, tests, fixture, and perf driver in this repo are
the regression backbone — extend them, never bypass them.
