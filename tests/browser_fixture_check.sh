#!/usr/bin/env bash
# v2.0.0 Trusted-Types Browser Fixture Harness (4ndr0666/userscripts)
# Drives tools/tt-browser-smoke.mjs against src/ -> dist/ installables.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

[ -d "$ROOT/src" ]  || { echo "[fixture] FAIL: missing src/"; exit 1; }
[ -d "$ROOT/dist" ] || { echo "[fixture] FAIL: missing dist/"; exit 1; }

node "$ROOT/tools/tt-browser-smoke.mjs"
