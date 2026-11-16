#!/usr/bin/env bash
# Browser possession proof (contract criterion browser-txt-verification).
#
# Reads the file-delivery base URL from .4ndr0/delivery-url.txt, opens the delivered
# userscript as a .txt copy in a real headless browser — both directly and through
# the caddy user-facing chain on :81 — and verifies the rendered text is the complete
# artifact: header, version line, IIFE wrapper, final buildUI() call, closing token,
# exact character count, and exact line count.
#
# Harness hardening (Round 1 closure): the agent-browser daemon intermittently
# drops its response socket (EAGAIN / "Resource temporarily unavailable") when a
# second open/eval burst follows a prior chain's evals. Each chain therefore gets
# a fresh browser instance and every eval is retried with a settle pause. The
# checks themselves are unchanged — a chain still passes only when every marker
# and both exact counts match.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAIL=0
step() { printf '[delivery] %s\n' "$*"; }
die() { printf '[delivery] FAIL: %s\n' "$*"; FAIL=1; }

command -v agent-browser >/dev/null 2>&1 || { echo "agent-browser not installed"; exit 1; }
[ -f "$ROOT/.4ndr0/delivery-url.txt" ] || { echo "missing .4ndr0/delivery-url.txt (delivery endpoint not set up)"; exit 1; }
BASE="$(tr -d '[:space:]' < "$ROOT/.4ndr0/delivery-url.txt")"
BASE="${BASE%/}"

EXPECTED_CHARS=$(node -p "fs.readFileSync('$ROOT/chatgptbulk.user.js','utf8').length")
EXPECTED_LINES=$(node -p "fs.readFileSync('$ROOT/chatgptbulk.user.js','utf8').split('\\n').length")

# agent-browser eval with bounded retries: a transient daemon drop returns empty
# output; re-reading after a settle pause recovers. Fails closed (empty output)
# after the final attempt so downstream checks cannot silently pass.
ab_eval() {
  local expr="$1" out="" rc=1
  for _attempt in 1 2 3; do
    out=$(agent-browser eval "$expr" 2>/dev/null) && rc=0 || rc=1
    if [ "$rc" -eq 0 ] && [ -n "$out" ]; then printf '%s' "$out"; return 0; fi
    sleep 2
  done
  printf '%s' "$out"
  return 1
}

verify_base() {
  local label="$1" base="$2"
  local url="$base/chatgptbulk.user.js.txt"
  agent-browser close >/dev/null 2>&1 || true # fresh instance per chain
  sleep 1
  step "[$label] open $url"
  agent-browser open "$url" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1
  sleep 1

  local text
  text=$(ab_eval "document.body.textContent" | sed 's/^"//; s/"$//')

  case "$text" in
    *'// ==UserScript=='*) step "[$label] userscript header rendered" ;;
    *) die "[$label] header line not visible" ;;
  esac
  case "$text" in
    *'@version      1.3.0'*) step "[$label] version line rendered (1.3.0)" ;;
    *) die "[$label] version line not visible" ;;
  esac
  case "$text" in
    *'(() => {'*) step "[$label] IIFE wrapper rendered" ;;
    *) die "[$label] IIFE wrapper not visible" ;;
  esac
  case "$text" in
    *'buildUI();'*) step "[$label] final buildUI() call rendered" ;;
    *) die "[$label] buildUI() call not visible" ;;
  esac
  case "$text" in
    *'})();'*) step "[$label] closing token rendered" ;;
    *) die "[$label] closing token not visible" ;;
  esac
  case "$text" in
    *'Not Found'*|*'404'*) die "[$label] server returned an error page" ;;
  esac

  local chars lines
  chars=$(ab_eval "document.body.textContent.length" | tr -d '"')
  lines=$(ab_eval "document.body.textContent.split('\\n').length" | tr -d '"')
  [ "$chars" = "$EXPECTED_CHARS" ] || die "[$label] character count mismatch: browser $chars vs artifact $EXPECTED_CHARS"
  [ "$lines" = "$EXPECTED_LINES" ] || die "[$label] line count mismatch: browser $lines vs artifact $EXPECTED_LINES"
  step "[$label] complete artifact rendered: $lines lines, $chars chars"
}

verify_base "direct" "$BASE"
verify_base "user-facing-chain" "http://127.0.0.1:81"

agent-browser close >/dev/null 2>&1
if [ "$FAIL" = "0" ]; then
  echo "BROWSER TXT VERIFICATION: PASS (all expected lines rendered through both endpoint chains)"
  exit 0
fi
echo "BROWSER TXT VERIFICATION: FAIL"
exit 1
