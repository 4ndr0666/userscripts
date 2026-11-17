#!/usr/bin/env bash
# Real-Chromium integration fixture for chatgptbulk.user.js (contract criterion real-browser-fixture).
#
# Serves the repository root over HTTP, opens the fixture page in a real headless
# browser via agent-browser, drives the panel through a full mocked generate run,
# verifies the gallery, and proves settings persistence across an HTTP-origin reload.
#
# Panel interactions go through the shadow root explicitly (deterministic and
# independent of accessible-name computation for emoji-labelled controls).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${FX_PORT:-8123}"
BASE="http://127.0.0.1:$PORT"
FAIL=0
step() { printf '[fixture] %s\n' "$*"; }
die() { printf '[fixture] FAIL: %s\n' "$*"; FAIL=1; }

command -v agent-browser >/dev/null 2>&1 || { echo "agent-browser not installed"; exit 1; }

if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  echo "port $PORT busy"; exit 1
fi

# eval in page, strip JSON quoting
pe() { agent-browser eval "$1" 2>/dev/null | sed 's/^"//; s/"$//'; }
# click inside the userscript's shadow root
sx() { pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('$1').click()"; }

cd "$ROOT"
python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/fx-http.log 2>&1 &
HTTP_PID=$!
trap 'kill $HTTP_PID 2>/dev/null; agent-browser close >/dev/null 2>&1' EXIT
sleep 1

step "open fixture page"
agent-browser open "$BASE/tests/fixture/" >/dev/null
agent-browser wait --load networkidle >/dev/null

step "userscript booted (host + fab in shadow root)"
HOST=$(pe "!!document.getElementById('bulkimg-host')")
FAB=$(pe "!!document.getElementById('bulkimg-host').shadowRoot.querySelector('.fab')")
[ "$HOST" = "true" ] || die "bulkimg-host missing"
[ "$FAB" = "true" ] || die "fab missing"

step "seed settings and reload (persistence precondition)"
agent-browser storage local set bulkimg:settings '{"prompt":"fixture red panda","count":1,"mode":"same","delay":0,"version":"","effort":"","project":"__current__","wait":false,"force":false,"lock":false,"ref":false,"stateless":false,"purge":false}' >/dev/null
agent-browser reload >/dev/null
agent-browser wait --load networkidle >/dev/null

step "panel opens on fab click"
sx '.fab'
sleep 1
OPEN=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('.panel').classList.contains('open')")
[ "$OPEN" = "true" ] || die "panel did not open"

step "round-4 controls present in the panel"
for id in lock refFile stateless purge; do
  EL=$(pe "!!document.getElementById('bulkimg-host').shadowRoot.getElementById('$id')")
  [ "$EL" = "true" ] || die "round-4 control missing: #$id"
done

step "limits render from the mocked backend"
LIMITS=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('.limits').textContent")
case "$LIMITS" in
  *"Images left: 9"*) step "limits OK" ;;
  *) die "limits not rendered: $LIMITS" ;;
esac

step "prompt restored from localStorage after reload"
PROMPT=$(pe "document.getElementById('bulkimg-host').shadowRoot.getElementById('p').value")
[ "$PROMPT" = "fixture red panda" ] || die "prompt not restored: $PROMPT"

step "model select populated from the mocked backend"
VEROPTS=$(pe "document.getElementById('bulkimg-host').shadowRoot.getElementById('ver').textContent")
case "$VEROPTS" in
  *"Fixture Alpha"*) step "model options OK" ;;
  *) die "model options wrong: $VEROPTS" ;;
esac

step "run a full mocked generate"
sx '.go'
DONE=0
for i in $(seq 1 60); do
  ST=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('.status').textContent")
  case "$ST" in *"Done: sent 1 prompts"*) DONE=1; break ;; esac
  sleep 0.5
done
[ "$DONE" = "1" ] || die "run did not complete (last status: $ST)"

step "composer received the prompt through the real execCommand path"
COMPOSER=$(pe "document.getElementById('prompt-textarea').textContent")
[ "$COMPOSER" = "fixture red panda" ] || die "composer text wrong: $COMPOSER"

step "backend received the send with the expected model"
POSTED=$(pe "JSON.stringify(window.__fixture && window.__fixture.posted)")
case "$POSTED" in
  *fx-alpha*) step "posted body: $POSTED" ;;
  *) die "no posted body recorded: $POSTED" ;;
esac

step "gallery tile appears after the poll tick"
GAL=0
for i in $(seq 1 40); do
  T=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('#galTitle').textContent")
  case "$T" in *"Images 1/1"*) GAL=1; break ;; esac
  sleep 0.5
done
[ "$GAL" = "1" ] || die "gallery counter never reached 1/1 (last: $T)"
TILES=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelectorAll('.tile img').length")
[ "$TILES" = "1" ] || die "expected 1 image tile, got: $TILES"

step "settings persisted by the run"
SAVED=$(agent-browser storage local get bulkimg:settings 2>/dev/null)
case "$SAVED" in
  *"fixture red panda"*) step "settings persisted" ;;
  *) die "settings not persisted: $SAVED" ;;
esac

step "HTTP-origin reload keeps the saved prompt"
# The mocked run pushState'd to /c/<uuid>, which the static server cannot serve; open the
# fixture URL fresh instead — an equivalent full HTTP-origin document load for storage.
agent-browser open "$BASE/tests/fixture/" >/dev/null
agent-browser wait --load networkidle >/dev/null
sx '.fab'
sleep 1
PROMPT2=$(pe "document.getElementById('bulkimg-host').shadowRoot.getElementById('p').value")
[ "$PROMPT2" = "fixture red panda" ] || die "prompt lost across reload: $PROMPT2"

step "panel header shows the version"
HDR=$(pe "document.getElementById('bulkimg-host').shadowRoot.querySelector('h3').textContent")
case "$HDR" in
  *"1.4.0"*) step "header version OK" ;;
  *) die "header missing version: $HDR" ;;
esac

agent-browser close >/dev/null 2>&1
if [ "$FAIL" = "0" ]; then
  echo "BROWSER FIXTURE: PASS (real Chromium, HTTP origin, full mocked run + reload persistence)"
  exit 0
fi
echo "BROWSER FIXTURE: FAIL"
exit 1
