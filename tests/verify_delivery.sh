#!/usr/bin/env bash
# v2.0.0 Suite Delivery Verification Harness (4ndr0666/userscripts)
# Verifies src/ flat topology, dist/ installables, V8 parse, canonical headers,
# inventory.json / README.md presence, and contract.json integrity.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

step() { printf '[delivery] %s\n' "$*"; }
die()  { printf '[delivery] FAIL: %s\n' "$*" >&2; exit 1; }

step "verifying v2.0.0 flat source & dist layout"
[ -d "$ROOT/src" ]      || die "missing src/ directory"
[ -d "$ROOT/kernel" ]   || die "missing kernel/ directory"
[ -d "$ROOT/dist" ]     || die "missing dist/ directory"
[ -f "$ROOT/contract.json" ]  || die "missing contract.json"
[ -f "$ROOT/inventory.json" ] || die "missing inventory.json"
[ -f "$ROOT/README.md" ]      || die "missing README.md"

SRC_COUNT=$(find "$ROOT/src" -maxdepth 2 \( -name '*.user.js' -o -name 'meta.json' \) | wc -l | tr -d ' ')
DIST_COUNT=$(find "$ROOT/dist" -maxdepth 1 -name '*.user.js' | wc -l | tr -d ' ')
[ "$SRC_COUNT" -eq "$DIST_COUNT" ] || die "src/ count ($SRC_COUNT) != dist/ count ($DIST_COUNT)"
[ "$DIST_COUNT" -ge 37 ]           || die "expected >= 37 installables, found $DIST_COUNT"
step "source/dist parity confirmed: $DIST_COUNT/$DIST_COUNT installables"

step "running V8 syntax parse and header integrity check across dist/"
for f in "$ROOT"/dist/*.user.js; do
  node --check "$f" || die "V8 parse failed: $f"
  grep -q '// ==UserScript==' "$f"  || die "missing ==UserScript== header: $f"
  grep -q '// ==/UserScript==' "$f" || die "missing ==/UserScript== terminator: $f"
  grep -q '@updateURL' "$f"         || die "missing @updateURL: $f"
  grep -q '@downloadURL' "$f"       || die "missing @downloadURL: $f"
done

step "verifying contract.json parses cleanly"
python3 -c "import json; c=json.load(open('contract.json')); assert c.get('version')=='2.0.0' and len(c.get('criteria',[]))>=7"

echo "DELIVERY VERIFICATION: PASS ($DIST_COUNT/$DIST_COUNT v2.0.0 installables verified)"
