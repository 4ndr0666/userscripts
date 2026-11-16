# ChatGPT Bulk Images (userscript)

A Tampermonkey/Violentmonkey userscript that sends one image prompt to ChatGPT many
times (a fresh chat each time, optionally inside a project), lets you pick model and
effort, watches your image usage limits, and shows the generated images in a live
gallery with a lightbox.

- Main artifact: `chatgptbulk.user.js`
- Baseline: v1.0.0 (imported verbatim from the operator's upload)
- Current round: Round 3 — silent stepwise gap mitigation under the 4ndr0neering
  v8.2.0 convergence protocol (superset rule: no v1.0.0, v1.1.0, or v1.2.0
  capability may be omitted, regressed, or weakened; current artifact v1.3.0).

## Install

1. Open the Tampermonkey dashboard → Create a new script.
2. Paste the full contents of `chatgptbulk.user.js`. Save.
3. Open <https://chatgpt.com>; a round FAB (bottom-right) toggles the panel.

## Repository layout

```
chatgptbulk.user.js      the userscript (deliverable)
contract.json            immutable v8.2.0 convergence acceptance contract
tests/                   static superset guard + jsdom behavioral suite + perf driver
scripts/                 4ndr0neering v8.2.0 toolchain (committed as protocol source)
worklog.md               round-by-round engineering log + operator handoff
.4ndr0/                  (gitignored) ledger, evidence, manifests, kits, perf artifacts
```

## Verification quickstart

```bash
node --check chatgptbulk.user.js          # syntax
node tests/static_checks.mjs              # superset + hygiene gate (no deps)
npm install jsdom                         # once, for the behavioral suite
node tests/behavior.test.mjs              # jsdom behavioral suite
```

Protocol commands (run from repo root):

```bash
python3 scripts/4ndr0_converge.py run --root . --contract contract.json --ledger .4ndr0/ledger.json --all
python3 scripts/4ndr0_converge.py evaluate --root . --contract contract.json --ledger .4ndr0/ledger.json --output .4ndr0/status.json
```
