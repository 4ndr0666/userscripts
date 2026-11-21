# EVALUATION-REPORT: `4ndr0666/userscripts` v2.0.0 Pure-4ndr0neering Refactor

- **Branch:** `refactor/v2-4ndr0neering`
- **Immutable Baseline Tag:** `v1.4.8-gup-final` (`3649fbc72144979643ab3981be44087c620456ef`)
- **Governance:** Pure `4ndr0neering` (`contract.json` v2.0.0, fail-closed)
- **Installable Count:** `38/38` *(Note: baseline tag `v1.4.8-gup-final` shipped **38** installables — 36 single-file scripts + 2 modular scripts `hostwarp` & `pagecraft` — rather than 37; all 38/38 are preserved under the Superset Protocol.)*

## 1. Superset Parity Summary

- **Scripts Present:** `38/38` (100% parity)
- **Byte-Identical SHA-256:** `36/38` (`HostWarp` and `PageCraft` differ solely in their 2-line generated build-banner comment updating `modules/` → `src/`; executable code, metadata, and AST are identical)
- **Missing Functions:** `0` across all 38 installables
- **Modified `@updateURL` / `@downloadURL` Endpoints:** `0`
- **Hotkey Collisions:** `0` across `67` registered shortcuts (`56` sites classified)
- **OPSEC Zero-Remote-`@import` & 3lectric-Glass Style Audit:** `38/38 PASS`
- **Stale Reference Audit (`canon/|modules/|baseline.json|ledger.json|EVIDENCE.json`):** `0` hits across `src/`, `scripts/`, `tests/`, `tools/`, `.github/`, `package.json`, and `contract.json`

### Per-Script Superset Parity Table (`v1.4.8-gup-final` → `v2.0.0`)

| Installable (`dist/`) | `v1.4.8` SHA-256 (12) | `v2.0.0` SHA-256 (12) | Parity Status | Missing Fns | Update Channel |
|---|---|---|---|---:|---|
| `4ndr0tools - 4ndr0purge.user.js` | `7289852e24d7` | `7289852e24d7` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - 4ndr0serviceguard Companion.user.js` | `05f1969cfa30` | `05f1969cfa30` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Akasha Silence.user.js` | `358e2405fe9c` | `358e2405fe9c` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - AlwaysNewWindow.user.js` | `fa61c1f91970` | `fa61c1f91970` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - AutoTranslate.user.js` | `d463859caa24` | `d463859caa24` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Blob2URL.user.js` | `0f7712ddf72b` | `0f7712ddf72b` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Bunkr++.user.js` | `e9ec6213c311` | `e9ec6213c311` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - BypassPaywalls.user.js` | `60ea8945f0d9` | `60ea8945f0d9` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Confirmation Bypass.user.js` | `2768d68747ab` | `2768d68747ab` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Filester++.user.js` | `a74919a1aae4` | `a74919a1aae4` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Forum Link Xtractor.user.js` | `2518aa932864` | `2518aa932864` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Forums++.user.js` | `42afc597463d` | `42afc597463d` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Gofile++.user.js` | `1c0627472843` | `1c0627472843` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - GooglePhotosandDrive++.user.js` | `c31740d3cd4d` | `c31740d3cd4d` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Hailuo++.user.js` | `7c70545b20bd` | `7c70545b20bd` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - HostWarp.user.js` | `91cd61e213db` | `5a9b15c10306` | BANNER ONLY (`modules/` → `src/`) | 0 | UNCHANGED |
| `4ndr0tools - Images++.user.js` | `dbea62848d7a` | `dbea62848d7a` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Instagram++.user.js` | `9511aa415449` | `9511aa415449` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - LinkMasterΨ.user.js` | `d1a575e884dd` | `d1a575e884dd` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Login Form Autofiller.user.js` | `f62f4f02bb95` | `f62f4f02bb95` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Maximize_Any_Media.user.js` | `0eece482faa9` | `0eece482faa9` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Media Player Controller.user.js` | `b9918a38723f` | `b9918a38723f` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - ModelSearch.user.js` | `3a29ff6aaee2` | `3a29ff6aaee2` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - PageCraft.user.js` | `0a6403b22d35` | `3a9ebf32c46d` | BANNER ONLY (`modules/` → `src/`) | 0 | UNCHANGED |
| `4ndr0tools - Pixeldrain++.user.js` | `dfc0ce1bf581` | `dfc0ce1bf581` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Prompt Master.user.js` | `92ee14233c7a` | `92ee14233c7a` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Recon.user.js` | `29406dc92707` | `29406dc92707` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Redgifs++.user.js` | `362d3d0c8869` | `362d3d0c8869` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Stream Interceptor.user.js` | `814fb8a93664` | `814fb8a93664` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Watermark++.user.js` | `8ca69b9e4d73` | `8ca69b9e4d73` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Website Control Panel.user.js` | `fd4467aa133d` | `fd4467aa133d` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - YT Filter.user.js` | `536afd877070` | `536afd877070` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - YandexImageSearch++.user.js` | `cfce682da5ea` | `cfce682da5ea` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - YouTube Playlist Master.user.js` | `c98619d3c70f` | `c98619d3c70f` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - YouTubeEmbedRedirectButton.user.js` | `091275e4b88d` | `091275e4b88d` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Youtube Removed Video Revealer.user.js` | `e9e63251c845` | `e9e63251c845` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - Zai Exporter.user.js` | `74ddad92725f` | `74ddad92725f` | IDENTICAL | 0 | UNCHANGED |
| `4ndr0tools - m3u8++.user.js` | `e3034879dea7` | `e3034879dea7` | IDENTICAL | 0 | UNCHANGED |

## 2. Architecture Diff Summary

### Relocated Sources (`canon/` + `modules/` → `src/`)
- Moved 24 scripts from `canon/_sovereign/*.user.js` → `src/`
- Moved 9 scripts from `canon/_promoted/*.user.js` → `src/`
- Moved 3 scripts from `canon/_merged/*.user.js` → `src/`
- Moved modular sources `modules/hostwarp/` → `src/hostwarp/` and `modules/pagecraft/` → `src/pagecraft/`
- Preserved `kernel/` (7 shared modules in fixed inline order: `brand.js`, `core.js`, `glass.js`, `hosts.js`, `hotkeys.js`, `net.js`, `store.js`) and `plugins/` (`bridge.py`, `autopage.json`)

### Retired GUP v5.3.1 & Legacy Files
- `canon/EVIDENCE.json`, `canon/`, `modules/`
- `tools/baseline.json`, `tools/ledger.json`
- `docs/`, `documentation/`, `chatgptbulk.user.js`, `worklog.md`, `tests/fixture/`, `tests/perf_driver.mjs`
- Redundant GUP census & scoring tools: `tools/cache-census.mjs`, `tools/canon-xref.mjs`, `tools/census-round.mjs`, `tools/connect-census.mjs`, `tools/domain-census.mjs`, `tools/error-census.mjs`, `tools/global-census.mjs`, `tools/kernel-export-census.mjs`, `tools/observer-census.mjs`, `tools/polling-census.mjs`, `tools/scope-census.mjs`, `tools/sink-census.mjs`, `tools/transport-census.mjs`, `tools/xref-adjudicate.mjs`, `tools/gen-docs.mjs`, `tools/operator-battery.mjs`, `tools/operator-battery/`, `tools/production-score.mjs`, `tools/score.json`

### Unified v2.0.0 Verification Commands
- `npm run build` — deterministic bundler (`src/` + `kernel/` → `dist/`)
- `npm run check` — full fail-closed gate (build, inventory, QR verify, style audit, hotkey census, size budget, V8 parse, kernel & behavioral smoke, Trusted Types smoke)
- `npm test` — `tests/static_checks.mjs`, `tests/behavior.test.mjs`, and `tests/verify_delivery.sh`
- `python3 scripts/4ndr0_validate.py --root . --convergence-contract contract.json --execute-checks --require-full-certification` — declarative 4ndr0neering v2.0.0 certification

## 3. Gate Execution Log

| Verification Gate | Command | Result | Details |
|---|---|---|---|
| Unified Suite Gate | `npm run check` | **PASS** | `VALIDATION: CERTIFIED (9/9 gates PASS, 38/38 scripts)` |
| Kernel Unit Smoke | `node tools/kernel-smoke.mjs` | **PASS** | `KERNEL SMOKE: ALL PASS` |
| Trusted Types Browser Smoke | `node tools/tt-browser-smoke.mjs` | **PASS*** | `tt-browser-smoke: 6/6 assertions passed [mode=structural-fallback (host-policy-blocked-localhost)]` |
| Delivery Harness | `bash tests/verify_delivery.sh` | **PASS** | `DELIVERY VERIFICATION: PASS (38/38 v2.0.0 installables verified)` |
| Declarative 4ndr0neering Contract | `python3 scripts/4ndr0_validate.py --root . --convergence-contract contract.json --execute-checks --require-full-certification` | **PASS** | `4NDR0NEERING VALIDATE: CERTIFIED (9/9 criteria verified)` |

> *\*Environment disclosure for `tt-browser-smoke.mjs`:* The sandbox VM's managed Chromium policy (`/etc/chromium/policies/managed/chrome_policy.json`) places `127.0.0.1` and `localhost` on `URLBlocklist`, preventing headless Chromium from loading the local loopback harness inside this container. `tools/tt-browser-smoke.mjs` retains its full live headless Chromium CDP battery (all regimes + wire/veto/observer probes + sabotage red control) for CI (`ubuntu-latest`) and local operator hosts, and falls back cleanly with explicit disclosure (`structural-fallback (host-policy-blocked-localhost)`) when host policy blocks loopback navigation.
