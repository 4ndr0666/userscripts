#!/usr/bin/env bash
# ═════════════════════════════════════════════════════════════════════════════
# update-4ndr0666tools-suite-v1.2.0.sh — gap-mitigation pass (GUP v5.3.1)
# ─────────────────────────────────────────────────────────────────────────────
# Applies suite v1.2.0 on top of the live repo (base e7f8697):
#   · Akasha Silence v5.0.0 — three-way privacy consolidation (trio retired)
#   · Ported the dist-only upgrades into canon (ServiceGuard v7.3.0,
#     YTPM v1.7.0, LinkXtractor icon) with namespace/URL realignment
#   · Gofile++ v2.1.0 — restored the missing UI layer + getContent
#   · Pixeldrain++ v1.1.0 — REAL QR encoder (round-trip verified 8/8)
#   · Filester++ v7.5.0, Forums++ v1.9, Redgifs++ v5.1, WCP v5.2.0,
#     Yandex v0.4.0, LinkXtractor v3.1.0 hardening
#   · Update-channel repairs (Images++/WCP /dist/ + key case) + hardened Gate C
#   · dist prune step; qr-verify wired into npm run check
# Payload design: reuses YOUR OWN dist/ bytes for the two big ports
# (ServiceGuard / YTPM canon = your dist files + exact header seds), a
# unified patch for the 13 small deltas, and a tarball for the new files.
# Idempotent. Fail-closed. Run from the repo directory (or pass its path).
# ═════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GRN='\033[0;32m'; CYN='\033[0;36m'; RST='\033[0m'
die()  { printf "%b ✗ %s\n" "$RED" "$*"; exit 1; }
info() { printf "%b • %s\n" "$CYN" "$*"; }
ok()   { printf "%b ✓ %s\n" "$GRN" "$*"; }

REPO_DIR="${1:-$PWD}"
[ -d "$REPO_DIR/.git" ] || die "$REPO_DIR is not a git repository (pass the repo path)"
[ -f "$REPO_DIR/package.json" ] || die "no package.json — is this the userscripts repo root?"
cd "$REPO_DIR"

# ── G0: environment ──────────────────────────────────────────────────────────
command -v node >/dev/null 2>&1 || die "node not found (need >= 18)"
NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
[ "$NODE_MAJOR" -ge 18 ] || die "node >= 18 required (found $NODE_MAJOR)"
command -v xz >/dev/null 2>&1 || die "xz not found"
command -v git >/dev/null 2>&1 || die "git not found"
info "environment OK (node $(node --version))"

# ── hash tables ──────────────────────────────────────────────────────────────
declare -A BASE_SHA=(
    ["canon/EVIDENCE.json"]="981633270d04c1e01b65e41b70b77f38556ebd5504e31d7a2387e0669ca9f1d6"
    ["canon/_merged/4ndr0tools - Images++.user.js"]="93b0a31d86e20758912fa01845380d121b41f468f849acaadbf4326964980010"
    ["canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js"]="b308843753a4ec7bbea0b3cf8d7fbeecdba52565504c501239eada455b839d94"
    ["canon/_sovereign/4ndr0tools - 4ndr0serviceguard Companion.user.js"]="8e590115bf8076838a1ed4a77c60d13cbfc3848edf39d942806bfc7ee624d049"
    ["canon/_sovereign/4ndr0tools - Anti-detection.user.js"]="6990f7882098f4248b0e4a51430452e0e3237fc11cfc2dc40067d58e48d36958"
    ["canon/_sovereign/4ndr0tools - Anti-telemetry (Intelligent Cloud Computing).user.js"]="cbbf6d96bb6da66d740575df07e5998b130b74075d5dd5569b1b15f518d8115a"
    ["canon/_sovereign/4ndr0tools - Counter-surveillance.user.js"]="ea00d48f008cc83ee11b225b7c0225944be12fe25acc98ef9b7252d998316e03"
    ["canon/_sovereign/4ndr0tools - Filester++.user.js"]="69da7b9a39604753435d890cb123ecba989129532097a028133f8728b4330977"
    ["canon/_sovereign/4ndr0tools - Forums++.user.js"]="c0f7eaaeb2043feda55846dc57e2e1337254266bacb1f87372ce79dfe23561cb"
    ["canon/_sovereign/4ndr0tools - Gofile++.user.js"]="61f56065ec8c48e4b59bd6a43559c31e536d5363e516f23e864ca06a8cb57cae"
    ["canon/_sovereign/4ndr0tools - Pixeldrain++.user.js"]="a08b320fd029e51653c5e5f0e79df620f96f47ce1b533767e3224f9ab7274121"
    ["canon/_sovereign/4ndr0tools - Redgifs++.user.js"]="38fe316b413559cf12e33a6af590ff52810646d19d97a1dd1c9cb06eaf0b7f7d"
    ["canon/_sovereign/4ndr0tools - Website Control Panel.user.js"]="e30d4b9b127fd3b54c1659fdb11322bd2b8f2eca981eb2953e0ef193a33d11b4"
    ["canon/_sovereign/4ndr0tools - YandexImageSearch++.user.js"]="c934a97411b514523f8db77aee5790776622d29ec65e15504d2b53fd1cd13162"
    ["canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js"]="1f417864d94d3ac60f8291687fb301be9e645eca0cdd1b17572268036d3b1e95"
    ["docs/MIGRATION.md"]="63305615bbbe017ab43e221357a4982eb2cfc5a7b8baf7560123048a67f1192b"
    ["package.json"]="7d6be87160c5128753159cebfb644bfb679bbe0029eae9da6f31f15b9d9380f8"
    ["tools/build.mjs"]="8ad583cbd79f088d58a52eac990a0cd265d5e820b7c4ccfef55f7a4e03e2b54a"
    ["tools/ledger.json"]="08719f0752eabefb65228c9af1ac136960069ed3e4627a3b90373caf83b77257"
    ["tools/validate.mjs"]="6903e7370d53e3f6b18decbf60a574c44bbe38af8faf9b07d18e842823a584e2"
)
declare -A TARGET_SHA=(
    ["canon/EVIDENCE.json"]="e41ab0d60d4a5d707f1e0ca709576d12cbc02653c46ca49641992bb8c8d94f36"
    ["canon/_merged/4ndr0tools - Akasha Silence.user.js"]="f5a71b33bd38750ce868d18dae5c904841685994f46b79645b4cd8b34f828e70"
    ["canon/_merged/4ndr0tools - Images++.user.js"]="5a8338e00195aad98e5e61a22f9003ecb4c4116cf2b1a62c65d0ddebcafdf7b6"
    ["canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js"]="36f9f7019a56fdafe8f4bec5281159da8b6f0bcb186b6f642178b8be6a5dff59"
    ["canon/_sovereign/4ndr0tools - 4ndr0serviceguard Companion.user.js"]="07ee3bba7512f3cd4473b1ff07b2ed3faee636e14f073fe038282003270e1045"
    ["canon/_sovereign/4ndr0tools - Filester++.user.js"]="96dcfa819c854a03c8ecac15065edd4179f794de3ddbcd8ae53ce3732949075e"
    ["canon/_sovereign/4ndr0tools - Forums++.user.js"]="b0416cbf3329128e458a64fc60096daa548e851842e30c4994449557d2f3eb1b"
    ["canon/_sovereign/4ndr0tools - Gofile++.user.js"]="7af7867a6f8c04ca24f6184b64b9977c7ac469dc42e5c5f35afcb030be491d7e"
    ["canon/_sovereign/4ndr0tools - Pixeldrain++.user.js"]="49138f153a50a0722fa8bdafaeee50e748b027b384bc5cb813c4bcb9f5de18e7"
    ["canon/_sovereign/4ndr0tools - Redgifs++.user.js"]="09edcf9b231dea4e4716dd9eac52a2999bd05fd6dd8b21e8677f96d1f27ebad6"
    ["canon/_sovereign/4ndr0tools - Website Control Panel.user.js"]="b84373795cec070ffacad8e28a626718114f4dfaf42a318a0c695cd4f9c26fad"
    ["canon/_sovereign/4ndr0tools - YandexImageSearch++.user.js"]="0b9daa5961fafb3c86baa04b24420fa8105002f52193b40a636739bef60d9385"
    ["canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js"]="1b181ae36a773a17f1e833c48dddd64eb17c869dfb9919d6e6759c7fa87690c7"
    ["docs/MIGRATION.md"]="2d140a44aebd1cd53ea67f87a3a19a52ef4c81c1485d6fe11277ecfb5109b993"
    ["package.json"]="28c53a0185213491cf2ae47a3a740b37c2188df43c060deed806ef7c37d4aaf1"
    ["tools/build.mjs"]="0ba48a9892cb79daafc2255e04d9acbbfdb09ba308288bc46534414a26438ada"
    ["tools/canon-xref.mjs"]="1e1c6e16dcdddac25318dc478feea1db6f42e271fc022e54c5ddd8e0865f7cfb"
    ["tools/ledger.json"]="22a12150590b87bbf9dbff6b4b3eacec11838151226e740c999afe460ee8af5c"
    ["tools/qr-verify.mjs"]="62f7dc2bbdb66c66e62027b0e3695c6fd158c1dc7c048e6702b9496a85a8ba7d"
    ["tools/validate.mjs"]="b7f0dedfd21e4257a29ca3c5a434893d469d01540417f2743445d976b65031dc"
    ["tools/xref-adjudicate.mjs"]="91eb378b7f569641beeb399cd59fb3c7ba78c6ce84e50ec40bd1f25e893768fc"
)
declare -A DIST_SHA=(
    ["dist/4ndr0tools - 4ndr0purge.user.js"]="4e5c23f9ec78e4a0bc798401012f37d492f5515e9e8af1152352b2bbe060f8ea"
    ["dist/4ndr0tools - 4ndr0serviceguard Companion.user.js"]="07ee3bba7512f3cd4473b1ff07b2ed3faee636e14f073fe038282003270e1045"
    ["dist/4ndr0tools - Akasha Silence.user.js"]="f5a71b33bd38750ce868d18dae5c904841685994f46b79645b4cd8b34f828e70"
    ["dist/4ndr0tools - AlwaysNewWindow.user.js"]="f58be6a87be390c65ea60970bc790f6362f9355cddc3f49185357c7ac406162b"
    ["dist/4ndr0tools - AutoTranslate.user.js"]="cadb5954d8cf3a03b3d812bf5b5eca38703be14c9ef28e1d43a5024e12c60d81"
    ["dist/4ndr0tools - Blob2URL.user.js"]="fb4822491cf01820236b2d447aa62fcfd36ae8d294a3c0ba906fa5d1ceeecac0"
    ["dist/4ndr0tools - Bunkr++.user.js"]="82bae5f8a3e5b3223674f1c0e73e510ae762ddd7502cadf703f9d7ad39a4334e"
    ["dist/4ndr0tools - BypassPaywalls.user.js"]="eeb7a99b8c03a5257f99ee3a959466134d31dd2ecee2b8df4815dbc3ce72ca2f"
    ["dist/4ndr0tools - Confirmation Bypass.user.js"]="7d7d43f9bbc3642961d2a844c5c9a637c02385ef0287261a6238ac2b8cab6b4b"
    ["dist/4ndr0tools - Filester++.user.js"]="96dcfa819c854a03c8ecac15065edd4179f794de3ddbcd8ae53ce3732949075e"
    ["dist/4ndr0tools - Forum Link Xtractor.user.js"]="36f9f7019a56fdafe8f4bec5281159da8b6f0bcb186b6f642178b8be6a5dff59"
    ["dist/4ndr0tools - Forums++.user.js"]="b0416cbf3329128e458a64fc60096daa548e851842e30c4994449557d2f3eb1b"
    ["dist/4ndr0tools - Gofile++.user.js"]="7af7867a6f8c04ca24f6184b64b9977c7ac469dc42e5c5f35afcb030be491d7e"
    ["dist/4ndr0tools - GooglePhotosandDrive++.user.js"]="44095eba1db7f263731cc2b4eabc0ebfc611a75181270b3aa274c0a4bf707f2a"
    ["dist/4ndr0tools - Hailuo++.user.js"]="700d663fc3875f3fb66f798b5173c47f3dd88fb996d87a2e4593e891e5c24758"
    ["dist/4ndr0tools - HostWarp.user.js"]="35b5ecb790acaddaa305b351da7905e942be4d00d45323174670e89700da2910"
    ["dist/4ndr0tools - Images++.user.js"]="5a8338e00195aad98e5e61a22f9003ecb4c4116cf2b1a62c65d0ddebcafdf7b6"
    ["dist/4ndr0tools - Instagram++.user.js"]="e7a37c4c5bb56f2f19b3d61cac0ee9a5a40dd7f8cef957fc35d43d4df0d5a0b2"
    ["dist/4ndr0tools - LinkMasterΨ.user.js"]="10d123e0bb2aed15e54e2989a673d42a70cc193611c26c98c4b5b0cb80cdf87f"
    ["dist/4ndr0tools - Login Form Autofiller.user.js"]="df691166c5df67620e4862db230480df5cbf53d7387bd4434095ac59eaef30e4"
    ["dist/4ndr0tools - Maximize_Any_Media.user.js"]="8fc0c32463e18c69bb2f5d16f83d1a119931c91188505146c42277d3747a37ad"
    ["dist/4ndr0tools - Media Player Controller.user.js"]="d9e8d4f9433065359e3ccfbbf4feedc12c50eda2b752ae529d48dcc58f43d01d"
    ["dist/4ndr0tools - ModelSearch.user.js"]="53d6cf3949eb303f1d84c5fb87f63b29173e6800acda7121ba2871ada08c59ff"
    ["dist/4ndr0tools - PageCraft.user.js"]="71cc72dbe7afa1ec2f52c478040165312cf8c0ed66901cd20e83548df7e80743"
    ["dist/4ndr0tools - Pixeldrain++.user.js"]="49138f153a50a0722fa8bdafaeee50e748b027b384bc5cb813c4bcb9f5de18e7"
    ["dist/4ndr0tools - Prompt Master.user.js"]="140ac889c9274bec1962925845141fbdf9a7d69610e38cf9f6b9028b858c294f"
    ["dist/4ndr0tools - Recon.user.js"]="bf318aea473df0e51fd746c9fe035f0152e6a2256f9a5ae8e1d34406042ffbaa"
    ["dist/4ndr0tools - Redgifs++.user.js"]="09edcf9b231dea4e4716dd9eac52a2999bd05fd6dd8b21e8677f96d1f27ebad6"
    ["dist/4ndr0tools - Watermark++.user.js"]="c552501a0a941a179f4ef1450175ef24727cb84aeda8e6a361020fdc63d34e49"
    ["dist/4ndr0tools - Website Control Panel.user.js"]="b84373795cec070ffacad8e28a626718114f4dfaf42a318a0c695cd4f9c26fad"
    ["dist/4ndr0tools - YT Filter.user.js"]="17bcc3f12c7dc05c2e7b15429b0cd8f30ae2a5bcc5f53cabe24975bbb0b9979b"
    ["dist/4ndr0tools - YandexImageSearch++.user.js"]="0b9daa5961fafb3c86baa04b24420fa8105002f52193b40a636739bef60d9385"
    ["dist/4ndr0tools - YouTube Playlist Master.user.js"]="1b181ae36a773a17f1e833c48dddd64eb17c869dfb9919d6e6759c7fa87690c7"
    ["dist/4ndr0tools - YouTubeEmbedRedirectButton.user.js"]="7e77d0e78c8fca01556e0f1a33ed6c4e69d6f2d62182a16f4b2c53a678c45019"
    ["dist/4ndr0tools - Youtube Removed Video Revealer.user.js"]="21f992b4d549879e8e78dc02ab0869518cc12724b12de505654fe6a7424eee88"
    ["dist/4ndr0tools - m3u8++.user.js"]="888de2a9d3c0112f8ebb110eb2e1c78d2f10ae3eec4ce3c882e445d58623ed38"
)
README_SHA="f9d9e4ab137796f8c410f15ce8fbd0b3eeff794ad86550c8ddb1b051ebd88be8"
DIST_COUNT=36

sha_of() { sha256sum -- "$1" 2>/dev/null | awk '{print $1}' || true; }

# ── G1: base-state attestation ───────────────────────────────────────────────
# (also gates the C1 sources: the two dist files the kit copies from)
APPLIED=yes
for f in "${!TARGET_SHA[@]}"; do
    if [ ! -f "$f" ]; then
        APPLIED=no
        continue
    fi
    s=$(sha_of "$f")
    if [ "$s" != "${TARGET_SHA[$f]}" ]; then
        if [ -n "${BASE_SHA[$f]:-}" ] && [ "$s" = "${BASE_SHA[$f]}" ]; then
            APPLIED=no
        else
            die "G1 drift: '$f' matches neither base e7f8697 nor target v1.2.0 (sha $s). Commit or stash local changes first."
        fi
    fi
done
for f in "canon/_sovereign/4ndr0tools - Anti-detection.user.js" "canon/_sovereign/4ndr0tools - Anti-telemetry (Intelligent Cloud Computing).user.js" "canon/_sovereign/4ndr0tools - Counter-surveillance.user.js"; do
    if [ -f "$f" ]; then
        s=$(sha_of "$f")
        if [ "$s" != "${BASE_SHA[$f]}" ]; then
            die "G1 drift: retired file '$f' has unexpected content — commit or stash first."
        fi
        APPLIED=no
    fi
done
# C1 dist sources must be at their base content (or already at target,
# in which case the canon check above already passed)

for spec in "dist/4ndr0tools - 4ndr0serviceguard Companion.user.js" "dist/4ndr0tools - YouTube Playlist Master.user.js"; do
    # base dist hash is implied by G4 dist verification post-build; here we
    # only require the file exists.
    [ -f "$spec" ] || die "G1: C1 source '$spec' not found"
done
for f in "tools/inventory.mjs" "kernel/core.js" "modules/hostwarp/meta.json"; do
    [ -f "$f" ] || die "G1: expected suite file '$f' not found — wrong repo?"
done

if [ "$APPLIED" = "yes" ] && [ ! -f "canon/_sovereign/4ndr0tools - Anti-detection.user.js" ]; then
    ok "state: v1.2.0 already applied — entering verify-only mode"
    VERIFY_ONLY=yes
else
    VERIFY_ONLY=no
    info "state: base e7f8697 confirmed — proceeding with application"
fi

# ── G2: apply ────────────────────────────────────────────────────────────────
if [ "$VERIFY_ONLY" = "no" ]; then
    PAYLOAD_B64='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'
    info "decoding payload (${#PAYLOAD_B64} b64 chars)…"
    printf '%s' "$PAYLOAD_B64" | tr -d '\n' | base64 -d | xz -dc | tar -x -C "$REPO_DIR"
    ok "payload extracted"

    # C1: canon bodies from your own dist files + exact header fixes
    cp -- "dist/4ndr0tools - 4ndr0serviceguard Companion.user.js" "canon/_sovereign/4ndr0tools - 4ndr0serviceguard Companion.user.js"
    sed -i -e 's#// @namespace    https://github.com/4ndr0666/4ndr0serviceguard#// @namespace    https://github.com/4ndr0666/userscripts#' -- "canon/_sovereign/4ndr0tools - 4ndr0serviceguard Companion.user.js"
    cp -- "dist/4ndr0tools - YouTube Playlist Master.user.js" "canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js"
    sed -i -e 's#// @namespace    https://github\.com/4ndr0666$#// @namespace    https://github.com/4ndr0666/userscripts#' -- "canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js"
    sed -i -e 's#raw/refs/heads/main/4ndr0tools%20-%20YouTube#raw/refs/heads/main/dist/4ndr0tools%20-%20YouTube#g' -- "canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js"

    # C2: unified patch for the small deltas
    git apply --whitespace=nowarn changes.patch
    rm -f changes.patch
    ok "patched 13 modified files"

    # retirements
    rm -f -- "canon/_sovereign/4ndr0tools - Anti-detection.user.js" "canon/_sovereign/4ndr0tools - Anti-telemetry (Intelligent Cloud Computing).user.js" "canon/_sovereign/4ndr0tools - Counter-surveillance.user.js"
    ok "retired 3 canon scripts (privacy trio → Akasha Silence)"
fi

# ── G3: certification ────────────────────────────────────────────────────────
info "running npm run check (build + inventory + qr-verify + validate)…"
CHECK_OUT=$(npm run check 2>&1) || { printf '%s\n' "$CHECK_OUT" >&2; die "G3: npm run check failed"; }
printf '%s\n' "$CHECK_OUT" | grep -q "GUP VERIFICATION: CERTIFIED" || { printf '%s\n' "$CHECK_OUT" >&2; die "G3: certification line missing"; }
printf '%s\n' "$CHECK_OUT" | grep -q "8 passed, 0 failed" || { printf '%s\n' "$CHECK_OUT" >&2; die "G3: QR round-trip gate missing"; }
printf '%s\n' "$CHECK_OUT" | grep -q "36 dist files" || { printf '%s\n' "$CHECK_OUT" >&2; die "G3: expected 36 dist files"; }
ok "GUP v5.3.1 CERTIFIED (36 dist, QR 8/8)"

# ── G4: final tree verification ─────────────────────────────────────────────
FAIL=0
for f in "${!TARGET_SHA[@]}"; do
    s=$(sha_of "$f")
    [ "$s" = "${TARGET_SHA[$f]}" ] || { printf "  ✗ %s\n" "$f"; FAIL=1; }
done
[ "$FAIL" = 0 ] || die "G4: source file hash mismatches (see above)"
ok "all ${#TARGET_SHA[@]} source files byte-exact"

N=$(ls -1 dist/*.user.js 2>/dev/null | wc -l)
[ "$N" -eq "$DIST_COUNT" ] || die "G4: dist has $N files, expected $DIST_COUNT"
FAIL=0
for f in "${!DIST_SHA[@]}"; do
    s=$(sha_of "$f")
    [ "$s" = "${DIST_SHA[$f]}" ] || { printf "  ✗ %s\n" "$f"; FAIL=1; }
done
[ "$FAIL" = 0 ] || die "G4: dist hash mismatches (see above)"
ok "all $DIST_COUNT dist installables byte-exact"

s=$(sha_of "README.md")
[ "$s" = "$README_SHA" ] || die "G4: README.md mismatch"

node -e '
const fs = require("fs"), crypto = require("crypto");
const j = JSON.parse(fs.readFileSync("inventory.json", "utf8"));
delete j.generated;
const sortKeys = (o) => Array.isArray(o) ? o.map(sortKeys)
    : (o && typeof o === "object")
        ? Object.keys(o).sort().reduce((a, k) => { a[k] = sortKeys(o[k]); return a; }, {})
        : o;
const canon = JSON.stringify(sortKeys(j));
const got = crypto.createHash("sha256").update(canon, "utf8").digest("hex");
if (got !== process.argv[1]) { console.error("inventory canonical hash mismatch: " + got); process.exit(1); }
' "b44f6c088af10c735a110f5d62fbfc4945ca93633884b493cf263c541a1b663e" || die "G4: inventory.json content mismatch"
ok "inventory.json content verified (timestamp-excluded)"

printf "%b\n" "${GRN}════════════════════════════════════════════════"
printf "%b suite v1.2.0 APPLIED AND VERIFIED\n" "$GRN"
printf "%b 36 installables · GUP v5.3.1 CERTIFIED · QR 8/8\n" "$GRN"
printf "%b next: git add -A && git commit && git push origin main\n" "$GRN"
printf "%b════════════════════════════════════════════════%b\n" "$GRN" "$RST"
