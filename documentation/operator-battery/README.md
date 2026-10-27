# Operator Regression Battery · suite 1.17.0

> 45 operator-side tests across 10 families — every verification the machine gate cannot make.
> Manifest: `tools/operator-battery/manifest.json` (machine-checked: anchor liveness, version stamps, residual coverage). This checklist is its rendered form.
> **BLOCKED is a first-class state** — network/ToS/transient conditions are honest states, never silent. A FAIL with evidence is more valuable than a silent pass.

## Conventions (read once)

- **Install**: Install dist/ files via the raw-GitHub URLs in inventory.json (https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/<name>.user.js).
- **Console prefixes**: Forums++ machinery logs as '[Forums++]' (console.debug/warn); Hailuo++ as '[4ndr0tools][INFO|WARN|DEBUG|ERROR]'; CB as plain '[4ndr0tools]' lines; Instagram++ as '[ARES-9 V7.0]'.
- **Evidence**: Every test: screenshot of the observable + console excerpt (filtered on the prefix above) + manager/browser versions + the URL visited.
- **BLOCKED**: A thread without the host under test at hand is BLOCKED, not FAIL. Transient site states (maintenance, CF interstitials absent) are BLOCKED with a note.
- **Rollback / immediate mitigation**: Immediate mitigation is disable-the-toggle or revert-pin the dist file: git checkout <prior-round-tip> -- dist/… (round tips: r7 6c1b7ea, r8 9a18c04, r9 = this round's pin).

## Forums++ cross-tab bridges (4)

### FPP-GBX-01

**goonbox.cr helper tab opens once, handshakes, and resolves (the flagship P2-only residual)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 Task 3 (14500cb port); residual re-listed r7 Task 7 and r8 Task 10 residuals (3)

- **Environment**: chrome / tampermonkey-mv3 / sites: a logged-in simpcity.su thread containing goonbox.cr links
- **Prerequisites**: Forums++ installed and enabled · goonbox host rows enabled in the per-post config form
- **Risk**: download low · network one inactive tab · ToS moderate — CF-protected hosting; do not solve CAPTCHAs beyond your own account's comfort

**Steps**:
1. Open the thread; open the per-post config form (the t-arrow tippy) and leave goonbox hosts enabled
2. Trigger the per-post Download
3. Watch the tab strip: an INACTIVE goonbox.cr tab opens with ?xfpd_gbx=1 in its URL
4. DevTools on the forum tab: filter console on '[Forums++]' — watch the gbx lines
5. Observe the goonbox resolver rows in the per-post status label

**PASS looks like**: The helper tab opens exactly once; the per-post log shows goonbox.cr rows resolving (direct, or '::API direct failed (403) -> bridge::' followed by resolution); no 'gbx bridge response not ready yet' spam beyond the first per-request debug; the helper tab closes after its idle window; a user browsing goonbox.cr normally never becomes a bridge (the marker gate).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| no tab ever opens | GM_openInTab grant/manager failure or gbxOpenTab throw | Verify the @grant lines and reinstall the dist pin; report the manager's permission prompt | manager version + install-time permission list |
| tab opens but handshake never ready (repeating 'not ready yet' to timeout) | helper-side injection failed (script not installed/enabled on goonbox.cr, or a CF interstitial needs the human) | Solve the CF interstitial manually in the helper tab once and re-run; if still dead, inspect xfpd_gbx_ready in the manager's storage editor and report | storage-editor screenshot of xfpd_gbx_* keys + console excerpt |
| resolution succeeds direct-only, bridge never exercised | the test never touched the CF path — not a failure | re-run with FPP-GBX-02 (the force flag) to isolate the bridge path | note it as direct-path PASS |
| duplicate tabs / tab churn | gbxEnsureTab discard/reopen loop regressed | revert-pin the dist file; report the tab-strip behavior + console lines | video or screenshot series of the tab strip |
| firefox: polled GM storage never updates | the listener-mirror path (GM_addValueChangeListener) regressed | revert-pin; report the manager version | console excerpt + Firefox/Tampermonkey versions |

### FPP-GBX-02

**the force-bridge debug flag proves the whole P2 handshake independent of CF state** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: designed into the r6 port (14500cb) as the operator-side P2 verification instrument

- **Environment**: any / any / sites: a thread with goonbox.cr links
- **Prerequisites**: FPP-GBX-01 environment
- **Risk**: download low · network one inactive tab · ToS moderate

**Steps**:
1. In the forum tab's DevTools console run: localStorage.setItem('xfpd_gbx_force_bridge','true')
2. Run a goonbox-linked post download
3. Observe the per-post log, then REMOVE the flag afterwards

**PASS looks like**: The per-post log shows '::Bridge forced (debug flag)::' and the bridge tab path is taken even when direct would succeed — proving the whole P2 handshake independent of CF state.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| flag ignored (no 'Bridge forced' line) | localStorage probe rejected or gbxForceEnabled regressed | verify via the manager storage editor that the GM mirror also works; revert-pin | console excerpt before/after setItem |
| bridge forced but resolution fails | same taxonomy as FPP-GBX-01 handshake-failure | see FPP-GBX-01 | console excerpt |

### FPP-WRM-01

**gofile.io warm-up tab + guest-token/cookie bridge, cookie restored after idle** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 port (14500cb/a4c1f5b F22/F29); r7 79c70eb restore-race narrowing (7d F27)

- **Environment**: chrome / tampermonkey-mv3 (GM_cookie live) / sites: a thread with gofile.io links
- **Prerequisites**: a gofile.io account is NOT needed (guest flow)
- **Risk**: download low · network one tab, one guest account creation · ToS low — the guest flow is the site's own API path

**Steps**:
1. Download a post with gofile links
2. Watch for the warm-up tab (fires only on the guest gate — 403/gate responses): '::GoFile gate -> warm-up tab (3s) then retry [1/2]::'
3. Observe the gofile resolver rows complete on retry
4. After completion, open gofile.io: your original cookie state should be restored (DevTools → Application → Cookies → gofile.io accountToken back to pre-test value or absent)

**PASS looks like**: The gate line appears when gated; a 3s inactive gofile tab opens and closes; resolution succeeds on retry; no '[GoFile] GM_cookie.set failed' warnings; cookie restored after idle.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| gate hit but no retry success | warm-up tab didn't acquire the guest context or the wt bridge broke | run once with DevTools open on the warm-up tab; revert-pin | warm-up tab console + network excerpt |
| [GoFile] GM_cookie warnings | manager cookie-grant surface (TM needs cookie access enabled; Violentmonkey lacks GM_cookie entirely — the documented degradation) | enable TM's cookie access or accept the VM degradation and record it as the documented matrix difference | warning text + manager |
| your own gofile session corrupted post-run | restore-race regression (the 7d F27 class) | manually clear the gofile accountToken cookie, revert-pin, report the exact interleaving (was another download running at restore time?) | cookie state before/after + what else was running |

### FPP-WRM-02

**cyberdrop warm-up tab fires at most once per origin** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 port (2-e F31) + the r7 backtick fix (ae8fdf2)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with cyberdrop .to/.nl/.cr /f/ or /e/ links
- **Risk**: download low · network one tab per origin · ToS low

**Steps**:
1. Run the post download on cyberdrop links
2. Watch the tab strip + per-post log

**PASS looks like**: At most ONE inactive warm-up tab per distinct cyberdrop origin; resolver rows resolve via the api ladder; warm-up failure is a debug line, not a crash.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| warm-up loop (multiple tabs same origin) | the once-guard regressed | revert-pin; report the tab count | tab strip screenshot |
| resolution fails entirely | ladder failure — see FPP-RES-04 taxonomy | see FPP-RES-04 | per-post log excerpt |

## Forums++ resolver liveness on live hosts (12)

### FPP-RES-01

**kemono.su/.cr direct links resolve with zero network (identity resolver)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration (14500cb) + r7 TLD truth pass (ae8fdf2: 7a F02)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread containing kemono.su or kemono.cr direct /data/ links
- **Prerequisites**: Skip Download + Generate Links ON for a liveness-only, zero-download run
- **Risk**: download none (liveness-only) · network zero extra on PASS · ToS moderate — aggregator site; zero extra traffic on PASS

**Steps**:
1. Run the post download with Skip Download + Generate Links
2. Observe the kemono rows in the per-post status label
3. Check DevTools Network: no dispatch to kemono should occur for direct links

**PASS looks like**: Direct-link pass-through resolves instantly with the same URL in the generated links; a dispatch to kemono for a direct link would be a DEFECT (resolver over-reach).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| row stuck at 'Could not resolve' | resolver gate/regex regression | revert-pin both dist pins and report both console excerpts | per-post log + the link shape |
| manager @connect prompt naming an undeclared host | token gap — the prompt text names the host | screenshot the prompt; the fix is a header token — file the exact host string | the prompt screenshot |
| HTTP 403/401/429 | site-side auth change (site drift, not code regression) | note it for the next round | status code + date |

### FPP-RES-02

**coomer.su AND coomer.st profile walkers enumerate multi-page** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration + r7 ae8fdf2 (7a F01 — the coomer .st dead-end fixed)

- **Environment**: chrome / tampermonkey-mv3 / sites: one thread with coomer.su profile links and one with .st
- **Prerequisites**: Skip Download + Generate Links for liveness-only
- **Risk**: download none (liveness-only) · network moderate — several page GETs · ToS moderate — adult aggregator; keep posts small

**Steps**:
1. Run the post download on a coomer.su profile link
2. Repeat with a .st link
3. Watch for 'Resolving profile:' and multiple 'Resolved page N' lines

**PASS looks like**: The multi-page walker enumerates (several 'Resolved page' lines); BOTH TLDs resolve — the r7 F01 fix made the resolvers TLD-symmetric.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| .st links collected but 'Could not resolve' | the r7 TLD asymmetry class back (resolver still .su-hardcoded) | revert-pin; report which TLD failed | per-post log + the link |
| walker enumerates only page 1 | pagination walker regression | revert-pin | log excerpt |

### FPP-RES-03

**bunkr family resolves: TLD alternation + CF retry + CDN signing (bunkr.org/bunkrr.org/bunkrrr.org/gigachad-cdn)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration (14500cb) + r8 c866a50 (8b F02 family widening)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with a small bunkr /a/ album and a single /f/ file
- **Prerequisites**: Skip Download + Generate Links for liveness-only (DIRECT arms can download hundreds of MB otherwise)
- **Risk**: download none (liveness-only) · network low — API GETs · ToS moderate — file host, adult content; pick a small album

**Steps**:
1. Run the post download on the bunkr links
2. Observe the album /a/ walker enumerating pages
3. Observe single files resolving via the /f/ page + API
4. If a CF-403 fires: the warm-up + blacklist machinery engages ('[Forums++] bunkr CF warm-up rejected' only on failure)

**PASS looks like**: Album walker enumerates; single files resolve; CF-403 triggers warm-up; the derived links point at signed CDN URLs. This also exercises the isBunkrUrl family (rate-defense/maint/500MB arms — see FPP-DLP-02/03).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| 'Could not resolve' on a bunkrrr.org or gigachad-cdn URL | the isBunkrUrl/alternation family regressed (the 8b F02 class) | revert-pin; report the EXACT CDN hostname — it feeds the next widening | the CDN hostname + log lines |
| CF-403 with no warm-up tab | CF machinery regression | revert-pin | console excerpt |

### FPP-RES-04

**cyberdrop ladder: api.<root> runtime arms + literal api.cyberdrop.cr fallbacks** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration + r7 ae8fdf2 (the 7c-F06 backtick fix)

- **Environment**: chrome / tampermonkey-mv3 / sites: one cyberdrop.to link (root arm) and one non-declared-TLD link if findable
- **Risk**: download low · network tiny GETs · ToS low — public host

**Steps**:
1. Run the post download on the cyberdrop link
2. DevTools Network: watch the ladder probe info→auth→url in order

**PASS looks like**: A cyberdrop.to link resolves via api.cyberdrop.to (the root arm); a non-declared TLD falls back to the literal api.cyberdrop.cr arms (the r7 backtick fix — the single-quote interpolation bug is gone).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| requests to URLs containing literal '${slug}' text | THE r7 quoting bug back (7c's find: single quotes never interpolated) | revert-pin immediately; report the request URL | the network request URL |
| ladder exhausts with 401/403 | site-side auth change | note for the next round | status codes |

### FPP-RES-05

**jpg/jpeg no-digit family: NO manager prompt on first dispatch (the engine's first live catch)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r8 836f5bc — the derivation engine's first live catch (8 tokens declared)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with jpg.church / jpg.su / jpg.cr / jpeg.church / jpeg.fish / jpeg.fishing / jpeg.su / jpeg.cr links (any subset)
- **Risk**: download low · network image GETs · ToS moderate — image boards, adult content

**Steps**:
1. Run the post download on the jpg-family links
2. Watch for ANY manager @connect prompt
3. Observe the resolver rows completing

**PASS looks like**: First dispatch must NOT prompt (the 8+4 tokens are declared) and must resolve. If ANY prompt appears, screenshot it — the named host is either a token gap or proof of resolver over-reach. Album links exercise the password-spoiler path ('::Password protected album' when the post hides it).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| manager prompt naming a jpg/jpeg family host | token gap (the 836f5bc catch regressed) or resolver over-reach | screenshot the prompt; file the exact host string | the prompt screenshot (it IS the proof) |
| resolution fails with site errors | site drift | note for the next round | status codes |

### FPP-RES-06

**pixeldrain .com/.net/pixeldra.in — all three domains resolve** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r7 ae8fdf2 (7a F05)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with pixeldrain.net/l/ links (the discriminating case) and .com links
- **Risk**: download low · network low · ToS low

**Steps**:
1. Run the post download on the pixeldrain links

**PASS looks like**: All three domains resolve (the r7 F05 fix — the resolver was .com-only while the host table matched three).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| pixeldrain.net/.in 'Could not resolve' | the r7 F05 widening regressed | revert-pin; report which domain | log + link |

### FPP-RES-07

**yandex disk resolves via the POST ladder; prompts disclose the non-enumerable TLD horizon** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r7 ae8fdf2 (7a F04 — the missing yandex tokens)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with disk.yandex.ru/i/ links
- **Risk**: download low · network one POST · ToS low

**Steps**:
1. Run the post download on the yandex link
2. DevTools shows the POST to disk.yandex.ru

**PASS looks like**: The link resolves to a direct download URL; no prompt for disk.yandex.ru (declared). A prompt naming another yandex TLD (disk.yandex.com) is the DISCLOSED non-enumerable-family residual — record it, do not fail it.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| prompt for disk.yandex.ru | token regression | revert-pin | prompt screenshot |
| prompt for another yandex TLD | the disclosed [a-z]+ TLD-family residual — by design | record the hostname; it joins the next token batch | prompt screenshot (valuable data, not a failure) |

### FPP-RES-08

**redgifs: ONE boot token fetch on /threads/ pages only + token refresh on stale** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration + r7 ae8fdf2 (7a F09/F10)

- **Environment**: chrome / tampermonkey-mv3 / sites: a simpcity thread; then the goonbox helper tab from FPP-GBX-01
- **Risk**: download low · network one anonymous token per session · ToS low

**Steps**:
1. Visit a simpcity thread: DevTools Network shows exactly ONE api.redgifs.com temporary-token GET at boot
2. Open the goonbox helper tab (or gofile.io): NO redgifs request there (the /threads/ boot gate)
3. A redgifs-linked post resolves

**PASS looks like**: One anonymous temporary-token GET per thread page; none on helper tabs (the r7 F10 fix); redgifs posts resolve; refresh fires on 401/403/429 (hard to force — BLOCKED-acceptable).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| redgifs requests on helper tabs | the /threads/ boot gate regressed (r7 F10) | revert-pin | the helper tab's network log |
| duplicate boot fetches per page | the r7 F09 dedupe regressed | revert-pin | network log |

### FPP-RES-09

**saint2/turbo: origin derivation + sign API + embed links** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration (14500cb turbo sign port) + r9 F02 (the template-arm derivation)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with a turbo.cr video link and (if findable) a saint2.su one
- **Risk**: download low · network tiny sign requests · ToS moderate — adult video host

**Steps**:
1. Run the post download on the turbo/saint2 links
2. DevTools shows the sign request (glb-apisign.cdn.cr or the turbo/saint2 origin)

**PASS looks like**: A turbo.cr video link resolves via the sign API; saint2 links derive their origin (saint2 su/pk/cr to origin, else turbo.cr default); embed links resolve. The r9 F02 template fix makes glb-apisign.cdn.cr a machine-derived partial — live confirmation proves the dispatch actually flows.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| sign request 403s repeatedly | the sign API changed (site drift) | note for the next round | network excerpt |
| saint2 links resolve via the wrong origin | origin derivation regression | revert-pin | the resolved URL |

### FPP-RES-10

**filester v2 API + cache-host probe sweep** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6 restoration (14500cb filesterResolveV2 port)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with filester /d/ or /f/ links
- **Risk**: download low · network low · ToS low

**Steps**:
1. Run the post download on the filester links

**PASS looks like**: The link resolves through the v2 API + cache-host probe (DevTools shows the filester API calls).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| 'Could not resolve' | v2 API drift or regression | revert-pin; report the link shape | log + network |

### FPP-RES-11

**imagebam view/gallery + full-embed CDN links** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6/r7 resolver batches

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with imagebam view/gallery links and (if findable) full-embed images<N>.imagebam.com links
- **Risk**: download low · network image GETs · ToS moderate — image host, adult content

**Steps**:
1. Run the post download on the imagebam links

**PASS looks like**: Gallery/view pages resolve to CDN images; full-embed links pass through; the nsfw_inter=1 request header rides the API GET.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| gallery resolves only page 1 | gallery walker regression | revert-pin | log |

### FPP-RES-12

**ibb.co albums walk via JSON; postimg/pixxxels rewrite correctly** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: r6/r7 resolver batches + r9 F03 (the postimg/pixxxels leading-group enumeration)

- **Environment**: chrome / tampermonkey-mv3 / sites: a thread with an ibb.co/album/ link, i.ibb.co single images, and a postimg.cc 8-char link
- **Risk**: download low · network low · ToS low

**Steps**:
1. Run the post download on the links
2. DevTools shows the ibb.co/json POST for the album

**PASS looks like**: Single-image pass-through for i.ibb.co; the album link walks pages (JSON POST visible); postimg.cc 8-char links rewrite to the direct form. The r9 engine work widened the postimg/pixxxels gate family — live runs confirm the derivation matches reality.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| album resolves only page 1 | ibb JSON walker regression | revert-pin | network log |
| postimg rewrite misses | rewrite regression | revert-pin | the link + resolved URL |

## Forums++ download pipeline (7)

### FPP-DLP-01

**safeThreadTitle on a ':'-containing thread title (zip gate + generated.zip names)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 7d F22 filed (partial fix), 8b F01 completed (c866a50), 9a F05 (the dispatch guards)

- **Environment**: chrome / tampermonkey-mv3 / sites: a simpcity thread whose TITLE contains ':' (e.g. 'Video: something')
- **Prerequisites**: Zipped checked · Generate Log + Generate Links checked (forces the generated.zip arm even on an all-DIRECT run)
- **Risk**: download one zip per post — use a small post · network low · ToS low

**Steps**:
1. Download the post
2. Inspect the Downloads folder for every produced name

**PASS looks like**: Every landed filename has ':' (and backslash * ? double-quote < > |) replaced: 'Title #N.zip', 'Title/#N.zip' folder path (Chrome GM_download folder+name), 'Title/#N/generated.zip'; NO GM_download name-validation error in the per-post log.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| 'Error writing zipped file to disk' name-validation + FileSaver fallback fired | the 8b-F01 fix regressed (raw title reached GM_download) — FAIL-with-safety-net: the file still lands but the primary arm is broken | re-run with a colon-free thread (workaround); revert-pin | the exact filename + per-post log lines |
| file lands with a literal ':' in the name | sanitize gap on a saveAs arm | revert-pin | the filename |
| generated.zip missing entirely | zip-gate arithmetic or the all-DIRECT skip | check the config checkboxes were both on; revert-pin if both on | config screenshot + log |

### FPP-DLP-02

**isBunkrUrl maint guard: a maintenance placeholder is NEVER saved as a real file** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 8b F02 MAJOR (c866a50) + r9 9a F02 (the 4 KiB head slice)

- **Environment**: chrome / tampermonkey-mv3 / sites: a bunkr link that is in maintenance (bunkr rotates a maint.mp4 placeholder when a CDN is down)
- **Prerequisites**: maintenance is transient — BLOCKED is acceptable when no maint link is findable that session; re-try later
- **Risk**: download low · network low · ToS low

**Steps**:
1. Attempt the bunkr post
2. Watch the per-post log + Downloads

**PASS looks like**: The per-post log carries the maintenance reason line and the item is counted failed/skipped; NO maint.mp4-shaped file lands in Downloads and NO zip contains it; the pipeline settles within ~2s of the maint detection.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| a tiny maint.mp4 (or the placeholder name) lands in Downloads/zip | isBunkrUrl family regression (the 8b F02 class — check whether the URL's host is a NEW bunkr CDN form outside the widened family) | delete the stray file; revert-pin | the exact CDN hostname (it feeds the next isBunkrUrl widening) + the stray filename |
| pipeline hangs on the item | settle/deadline regression | revert-pin | log with timestamps |
| a healthy bunkr file falsely rejected as maint | the headerless sniff over-triggers | revert-pin; report the content-type + size | network response headers |

### FPP-DLP-03

**the 500 MB bunkr DIRECT switch fires mid-download** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 2-e F04 (a4c1f5b); r7 79c70eb loaded-bytes switch; r8 c866a50 family widening

- **Environment**: chrome / tampermonkey-mv3 / sites: a bunkr file of at least 500 MB (operator-picked)
- **Prerequisites**: Zipped ON so the switch is observable as an exit from the zip path · HIGH download volume — schedule on an unmetered connection; one file only
- **Risk**: download HIGH (one 500MB+ file) · network high · ToS low

**Steps**:
1. Download the large bunkr file
2. Watch progress cross ~500 MB: the DIRECT log line fires and a raw-URL GM_download begins outside the zip

**PASS looks like**: '::Bunkr large file (N bytes > 500MB) -> switch to DIRECT::' fires; the download shelf shows the bare file; the post completes with the file counted; the zip (if other files) excludes it.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| no switch — blob path continues past 500 MB | MV3 blob-size hazard re-exposed | abort the run to save bandwidth; revert-pin | console + log excerpt |
| switch fires but the DIRECT download fails silently | count drift between X/Y | revert-pin | the final X/Y summary line |
| Content-Length unknown, no switch | the disclosed DIRECT-threshold-blind case (7d F26) — known behavior, not FAIL | re-test with the file's page open first (warms Content-Length) | note it as known-behavior |

### FPP-DLP-04

**FF per-file saveAs arm vs Chrome GM_download arm (the named FF residual)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: the standing FF-saveAs residual (r6/r7/r8 lists); 2e F08; r8 c866a50 (8b F04/F12)

- **Environment**: firefox AND chrome (both, as control) / tampermonkey / sites: a small post with 2-3 downloadable files
- **Risk**: download low · network low · ToS low

**Steps**:
1. FF: a post with Zipped UNCHECKED — per-file saves land as 'Title #N - name.ext' (dash-joined, no subfolder)
2. FF: Zipped CHECKED — single zip via saveAs: 'Title #N.zip'
3. FF: open the config form — the custom-filename input is present; fill a ':title: :#:' variant and verify substitution
4. Chrome: same post, Zipped off — per-file GM_download with 'Title/name.ext' folder-qualified names; the filename input is ABSENT

**PASS looks like**: FF per-file saves honor the Zipped checkbox (the 2e-F08 fix); the OS save dialog per file is EXPECTED saveAs semantics (note it, don't fail it); Chrome names carry the folder prefix.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| FF always-zips (Zipped ignored) | the 2e-F08 fix regressed | revert-pin per browser | config + resulting filenames |
| Chrome names lose the folder prefix | saveName ternary regressed | revert-pin | the filenames |
| '[Forums++] URL.createObjectURL unavailable' warn on a modern manager | the blob duck-typing compat arm regressed (7b F06 class) | revert-pin | the warn + manager version |

### FPP-DLP-05

**light vs dark theme tooltip pair + search input ink** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 2e F16 (a4c1f5b); 7d F10 search input (79c70eb); the standing light-theme residual

- **Environment**: chrome / tampermonkey-mv3 / sites: simpcity with the account theme switcher (data-color-scheme)
- **Risk**: download none · network none · ToS none

**Steps**:
1. Set the site theme DARK — open a per-post config form (tippy tooltip) + run the in-thread cached-post search
2. Switch theme to LIGHT (may need reload) — reopen both
3. Inspect element: the .tippy-box computed background matches the branch values (#EDF0F3 light vs rgba(10,19,26,0.85) dark)

**PASS looks like**: Dark: translucent dark tooltip, light search-input ink. Light: #EDF0F3 tooltip surface, dark ink — no dark-on-dark / light-on-light.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| light theme shows the dark-translucent panel | the pre-fix no-op ternary class back (2e F16) | cosmetic — no functional mitigation; report the computed style | screenshot both themes + computed style |
| probe fails, dark fallback on a light site | attribute-name drift on simpcity | record the actual attribute; the code follows data-color-scheme | the html/body attributes |

### FPP-DLP-06

**zip-gate FileSaver fallback fires on a GM_download error (both arms)** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 2-e F07 (v1.12.1), 8b F01 (v1.13.3), 9a F05 (v1.13.4 dispatch guards)

- **Environment**: chrome / tampermonkey-mv3 / sites: any post producing a zip
- **Prerequisites**: the sanctioned trigger: set Chrome to 'Ask where to save each file' and CANCEL once (onerror fires); or run opportunistically when any DLP-01 validation error occurs
- **Risk**: download none beyond the deliberate cancel · network none · ToS none

**Steps**:
1. Trigger a GM_download error on the zip or generated.zip arm (cancel the OS save dialog once)
2. Watch the console

**PASS looks like**: 'Trying to write using FileSaver.js...' appears and the file lands anyway (browser save dialog). The 9a-F05 dispatch guards also cover the synchronous-throw path.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| error, nothing lands, no console line | fallback arm missing (regression of 8b F01 / 2-e F07) | revert-pin | console excerpt |
| FileSaver fires but the blob was already revoked (empty file) | revoke-ordering regression | revert-pin | the empty file's size |

### FPP-DLP-07

**turbo stall, re-sign ladder, DIRECT fallback under adversarial network** — `4ndr0tools - Forums++.user.js` v1.13.4 · provenance: 2-e F02/F03 (a4c1f5b/cae8685)

- **Environment**: chrome / tampermonkey-mv3 / sites: a turbo/saint2 video link
- **Prerequisites**: DevTools Network throttling set to a stall profile (offline after headers)
- **Risk**: download low (throttled transfer) · network low · ToS moderate

**Steps**:
1. Start the download
2. Mid-transfer throttle to offline
3. Watch the per-post log for the stall line
4. Restore network

**PASS looks like**: Stall detected (~5s for turbo); the re-sign ladder or DIRECT fallback log fires; the item settles failed-or-DIRECT; the post completes with X/Y consistent; no infinite retry loop (bounded re-signs).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| hang forever | watchdog dead (7d F01 class) | abort via navigation (the beforeunload guard cleans up); revert-pin | log with timestamps |
| unbounded re-sign loop | the 7d F02 URL-keyed loop class | revert-pin | repeated re-sign lines |
| counter drift X not equal Y at completion | settlement leak | revert-pin | the summary line |

## Hailuo++ live capture on hailuoai.video (9)

### HL-GEN-01

**DOM stalker vault capture: bay thumbnail within ~2s of the first queued node** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: r6 1e23e63 platform; r7 0d35f53 (7b F01/F04/F14); r8 9d82511 + the r9 9a-F03 truth note

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/ logged-in with generation credits
- **Prerequisites**: the HUD boots (Ctrl+Alt+H toggles visibility) · 'Auto Fetch Asset' is ON (sw-dl, runtimeSwitches.autoGrab; ALL SWITCHES DEFAULT OFF — the operator MUST enable it) · the console shows '[4ndr0tools][INFO] Interception platform armed' — if absent every HL test is BLOCKED at boot
- **Risk**: download none (one generation credit, ~cents) · network your own account session · ToS own account

**Steps**:
1. Enable Auto Fetch
2. Run one generation
3. Watch the HUD bay strip while the agent streaming DOM churns

**PASS looks like**: A thumbnail appears in the Asset Bay within ~2s of the FIRST queued node of each quiet-separated burst (the 6.1.2 truth-noted per-queue semantics); console shows '[4ndr0tools][INFO] Asset captured into bay' with the src; the bay bar flashes.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| capture never lands | stalker dead (check the arm-failure WARN lines) or Auto Fetch off | toggle Auto Fetch off/on; reload; revert-pin r7-vs-r8 dist to attribute | console excerpt incl. any WARN |
| capture lands but late (more than 2s after the first node under churn) | the floor semantics regressed beyond the documented per-queue contract | revert-pin | timestamps of node-arrival vs thumbnail |
| duplicate thumbnails of the same asset | hash-after-admission regression (7b F12) | revert-pin | screenshot of the duplicates |

### HL-CAN-01

**canvas toDataURL/toBlob commit hooks capture (96x96px+ and 4KB+ floors, sha256 dedup)** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: the r6 operator directive item (3); r7 hash-after-admission

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/ agent chat
- **Prerequisites**: Auto Fetch ON · ask for an image/diagram generation that renders on a canvas
- **Risk**: download none · network own account · ToS own account

**Steps**:
1. Request a canvas-rendered generation
2. Watch the console for the canvas commit line
3. Repeat the identical frame — no re-entry

**PASS looks like**: '[4ndr0tools][INFO] Canvas commit captured into the vault (sha256 xxxxxxxx, N bytes).' fires; a bay thumbnail shows the canvas content; identical frames do NOT re-enter (dedup).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| no capture + '[4ndr0tools][WARN] Canvas commit hooks were not installed' | prototype sealed / manager sandbox | record the manager version; report | the WARN line |
| captures spam tiny sprites | floor regression | revert-pin | the sizes in the log lines |
| page rendering visually broken | hook arg-shape regression (CRITICAL class) | immediately disable Auto Fetch, revert-pin, report a screenshot | screenshot of the broken render |

### HL-BLB-01

**blob: bay admission + createObjectURL clone registry (playable preview, zero-network SAVE)** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: r6 1e23e63; r7 0d35f53 duck-typing

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/
- **Prerequisites**: Auto Fetch ON · generate a video and let it complete (the player mints blob: URLs)
- **Risk**: download none · network own account · ToS own account

**Steps**:
1. Generate a video
2. Watch the bay for a blob: entry with playable hover preview
3. Click SAVE on it — zero network (the clone is served locally)

**PASS looks like**: A bay thumbnail with playable hover preview for the blob asset (blob: admitted — the pre-v6.1 gates rejected them); SAVE works with zero network.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| blob assets never enter the bay | isBlobLike duck-typing regression (7b F06 cross-realm class — check the manager) | revert-pin; report the manager | console + manager version |
| '[4ndr0tools][WARN] createObjectURL interception was not installed' | sealed URL API | record the manager version | the WARN line |

### HL-SAV-01

**SAVE: native mint, no double charge, bay entry survives repeated SAVEs + Save All** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: r8 9d82511 (8b F05/F06/F15 — the flagship r8 Hailuo fix)

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/
- **Prerequisites**: a bay entry present (from HL-GEN/CAN/BLB)
- **Risk**: download disk space for saved assets · network own account · ToS own account

**Steps**:
1. Click SAVE on a bay entry several times
2. Then Save All
3. Watch the bay entries and the console

**PASS looks like**: Files download with MIME-derived extensions (webp/webm not mislabeled); the bay entry SURVIVES repeated SAVEs (not evicted by dead double-charge entries); 'Save All directive accepted for N bay asset(s)' dispatches sequentially; no 'Clone registry byte budget exceeded' WARN right after SAVEs.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| bay thumbnails start dying / budget 'full' after several SAVEs | THE 8b F05 double-charge regression (SAVE minted through the WRAP) | revert-pin; report the sequence | which entries died + the WARN line |
| 'byte budget exceeded' WARN right after SAVEs | the same class via re-mint double-count (8b F06) | revert-pin | the WARN line |
| SAVE hangs at '····' past 60s | fetch fallback ceiling regression | revert-pin | timing |
| file never lands | save path failure | revert-pin | console excerpt |

### HL-HOV-01

**hover preview plays; the session window never navigates** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: v5.4-era feature, verified across r6-r8 audits

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/ with a bay entry
- **Risk**: download none · network none · ToS none

**Steps**:
1. Hover a bay thumbnail ~1s
2. Move the mouse away

**PASS looks like**: The floating preview panel plays the video / shows the image; it closes on mouseleave; the session window never navigates (the never-navigate contract).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| no preview | event wiring regression | revert-pin | console excerpt |
| preview navigates the tab | openAsset regression (the never-navigate contract) | revert-pin | the navigation |

### HL-EVC-01

**byte-budget eviction: oldest drops, live captures survive, page media keeps working** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: r7 0d35f53 (7b F02/F03)

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/
- **Prerequisites**: a heavy session (or rely on a long session's churn) until the 224 MiB budget is exceeded
- **Risk**: download none · network heavy session on own account · ToS own account; watch RAM

**Steps**:
1. Generate/capture many assets in one session
2. Watch DevTools Memory + the bay + the console

**PASS looks like**: '[4ndr0tools][WARN] Clone registry byte budget exceeded (X MiB retained); dropped a N-byte clone aged' fires; the OLDEST entries drop from the bay; live/recent captures survive; the page's own object URLs keep working (page keys are never revoked).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| memory grows unbounded | eviction dead (7b F02 class) | reload the tab; revert-pin | DevTools Memory timeline |
| page media breaks after eviction | page-key revoked (the never-revoke-page-keys contract) | reload; revert-pin | what broke |
| recent captures evicted while old dead SAVE entries persist | 8b F05 class residue | revert-pin | which entries survived |

### HL-EXP-01

**EXPIRED re-mint escalation: badge, working re-mint, single budget charge** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: r6 escalation; r7 remint-register-as-minted; r8 source retirement (9d82511)

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/ with a captured CDN-URL asset
- **Prerequisites**: simulate expiry: DevTools request-block the CDN host so the thumb errors (safe) — or keep the session open for hours
- **Risk**: download none · network none (request-blocking simulation is safe) · ToS none

**Steps**:
1. Block the CDN host (or wait for real expiry)
2. Observe the EXPIRED badge on the thumb
3. Click it — the re-mint path engages

**PASS looks like**: The thumb shows the EXPIRED badge; clicking re-mints from the vault clone and opens a working new window; the old entry retires (no 2x budget count).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| EXPIRED thumb click yields a broken image/window | re-mint dead or the source didn't retire | revert-pin | console + what opened |
| budget doubles after re-mint | 8b F06 regression | revert-pin | the budget WARN lines |
| badge never appears | expiry probe dead | revert-pin | the blocked host + thumb state |

### HL-BAY-02

**bay persistence across reload (last 60; blob: excluded on BOTH write and restore)** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: v5.4 feature verified r6/r7 audits

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/ with captures
- **Risk**: download none · network none · ToS none

**Steps**:
1. Reload hailuoai.video after captures

**PASS looks like**: The bay strip repopulates from the persisted snapshot (at most 60 non-blob entries); blob: entries are correctly absent; no restore WARN except on genuine storage failure.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| empty bay after reload with no WARN | persistence write path regression | revert-pin | storage editor state |
| blob: entries restored as dead thumbs | the exclusion regression (the dead-blob-reload class) | revert-pin | screenshot |

### HL-SWB-01

**HUD boot + self-heal health (Ctrl+Alt+H, collapse, 60s watchdog)** — `4ndr0tools - Hailuo++.user.js` v6.1.2 · provenance: standing; the 8b F15 fallback literal re-stamped 6.1.2

- **Environment**: chrome / tampermonkey-mv3 / sites: https://hailuoai.video/
- **Risk**: download none · network none · ToS none

**Steps**:
1. Load the site; Ctrl+Alt+H twice; collapse/expand; wait 60s

**PASS looks like**: The HUD re-renders after SPA evictions (the watchdog); zero console errors attributable to the script; version telemetry shows 6.1.2 (the 8b-F15 fallback literal fix).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| HUD missing entirely | boot order / delay regression | revert-pin | console excerpt |
| console [4ndr0tools][ERROR] lines | any ERROR is a finding — capture them | revert-pin if attributable | the ERROR lines |

## Confirmation Bypass on turbo.cr (4)

### CB-TRG-01

**overlay right-click, turbo.cr landing, GRACE_MS auto-click of the download button** — `4ndr0tools - Confirmation Bypass.user.js` v4.1.3 · provenance: the operator's round-6 nuance (1); 8157fbe restoration; 90a9696 + f255b44 hardening; r9 9a F01 (the arming order)

- **Environment**: chrome / tampermonkey-mv3 / sites: a simpcity (or SMG) thread embedding a turbo.cr video (the /embed/ iframe or link)
- **Risk**: download one file · network one adult video host · ToS moderate

**Steps**:
1. Right-click the turbo embed/overlay in the thread
2. The turbo.cr /d/{id}?bypass=0 landing opens
3. Wait through the Altcha PoW
4. Watch the LANDING tab's console

**PASS looks like**: After the download button appears/enables, within ~300ms the console line '[4ndr0tools] Download button triggered.' fires and the download begins — with NO operator click. Exactly one click per page (the data-cb4-dl-clicked guard).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| no console line, no download, button sits enabled | trigger dead (the 2b-F04 perceived-loss class) | click the button manually (the tool degrades to a convenience); revert-pin | console excerpt + the button's HTML at click time |
| console line but no download | the page's handler wasn't ready — the re-arm should fire (see CB-TRG-02) | see CB-TRG-02 | console timing |
| download starts BEFORE Altcha resolves | the G6 immediacy class back | revert-pin | timing |

### CB-TRG-02

**the 1.5s reaction window: second click ONLY when the page didn't react** — `4ndr0tools - Confirmation Bypass.user.js` v4.1.3 · provenance: 8b F07/F16/F17 (f255b44, the ledgered SETTLE probe), r9 9a F01 (the window now arms BEFORE the dispatch loop)

- **Environment**: chrome / tampermonkey-mv3 / sites: as CB-TRG-01
- **Risk**: download as TRG-01 · network as TRG-01 · ToS as TRG-01

**Steps**:
1. PASS path: repeat CB-TRG-01 on a normal turbo link — the page reacts (spinner/label swap/navigation) — observe NO second trigger line within 1.6s
2. Re-arm path: throttle the landing tab's network to offline-at-headers BEFORE the button enables, then restore — the handler-not-ready case yields exactly ONE re-click line at ~1.6s

**PASS looks like**: Reacted page: a single click total. Silent page: exactly two trigger lines total (300ms + ~1.9s), never three.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| second click on a reacted page (double download) | the 8b F07 class back — now including the r9 9a-F01 handler-side-touch class (a toast/progress node appended outside the button) | delete the duplicate download; revert-pin | timestamps of the console lines (the 300ms/1.6s cadence is the diagnostic) |
| no re-click ever on the silent path | re-arm conditions over-tight | revert-pin | timing |
| three or more clicks | MAX_CLICKS bound broken | revert-pin | all the lines |

### CB-TRG-03

**node-swap treated as reacted (a fresh control never receives click #2)** — `4ndr0tools - Confirmation Bypass.user.js` v4.1.3 · provenance: 8b F16 (f255b44)

- **Environment**: chrome / tampermonkey-mv3 / sites: as CB-TRG-01
- **Prerequisites**: hard to force deterministically on live turbo.cr — run opportunistically when TRG-01/02 show the control re-rendering; otherwise BLOCKED-acceptable
- **Risk**: download as TRG-01 · network as TRG-01 · ToS as TRG-01

**Steps**:
1. Watch for a control re-render (node swap) after click #1

**PASS looks like**: A swapped control (new node) never receives click #2 even if it looks identical and idle.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| a second trigger line after a visible re-render | the identity check regressed to visual heuristics | revert-pin | screenshots before/after the swap + console lines |

### CB-TRG-04

**glyph-tolerant anchored fallback ('Download File' with icon glyph) — the drift-time selector** — `4ndr0tools - Confirmation Bypass.user.js` v4.1.3 · provenance: 7b F18 (v4.1.1) + 8b F08 (v4.1.2)

- **Environment**: chrome / tampermonkey-mv3 / sites: as CB-TRG-01
- **Prerequisites**: exercisable only if turbo.cr renames/removes #downloadBtn markup (markup drift). TODAY: run document.querySelector('#downloadBtn') in DevTools — when present the primary selector wins and the fallback is untested (BLOCKED-acceptable)
- **Risk**: download none (selector check) · network none · ToS none

**Steps**:
1. Check whether #downloadBtn exists on the landing page
2. If absent (a redesign), observe the fallback firing

**PASS looks like**: A button labelled 'Download File' with a trailing icon glyph is clicked; footer prose like 'How to download files' is NOT.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| a prose element clicked | anchor regression (7b F18 class) | revert-pin | the clicked element's text |
| a glyph button missed | 8b F08 regression | revert-pin | the button's label |

## Watermark++ on gemini.google.com (3)

### WM-CLP-01

**Gemini copy-button clipboard hook: the transport timeout never wedges it** — `4ndr0tools - Watermark++.user.js` v2.1.2 · provenance: 8c F01/F04 (MAJOR) — 03dccb2 (WM 2.1.2) — the named WM Gemini clipboard residual

- **Environment**: chrome / tampermonkey-mv3 / sites: https://gemini.google.com/ logged in, an image-bearing response on screen
- **Prerequisites**: WM enabled for the page (its manager-menu/config toggle on)
- **Risk**: download none · network your own Gemini account · ToS the operator's standing use-case (already accepted suite-wide)

**Steps**:
1. Hover the response's copy button; click it; immediately paste into a scratch pad; time it
2. Network-throttle gemini's image CDN to a slow profile once and repeat — the bounded wait must hold

**PASS looks like**: The copy completes (clipboard holds the image — the processed/replacement variant when processing is on) within normal time; under throttling it settles within 20s (either processed or the original fallback) — the button NEVER wedges permanently (the pre-2.1.2 defect: pending-forever because ontimeout could never fire).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| copy button dead past 20s / forever | the 8c F01 wedge back (timeout/onabort arms gone) | reload the tab (the hook re-arms at document-start); use the browser's native image copy meanwhile; revert-pin | timing + console |
| copy completes but the image is unprocessed silently | replacement flow broken — see WM-CLP-02 | see WM-CLP-02 | the pasted image |
| [4ndr0tools]-family console errors during copy | capture them | revert-pin if attributable | the error lines |

### WM-CLP-02

**image replacement flow: processed variant, honest degradation to the original** — `4ndr0tools - Watermark++.user.js` v2.1.2 · provenance: 8c F01 context; 03dccb2

- **Environment**: chrome / tampermonkey-mv3 / sites: https://gemini.google.com/
- **Prerequisites**: WM processing enabled
- **Risk**: download none · network own account · ToS as WM-CLP-01

**Steps**:
1. Copy an image response
2. Paste into an image-capable surface
3. Compare with the original

**PASS looks like**: The pasted image is the processed (watermark-removed) variant when processing succeeded; when the original is unavailable, the ORIGINAL unprocessed image still lands (graceful degradation — never an empty clipboard).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| empty clipboard on processing failure | the degradation arm broken | toggle processing off to restore plain copies; revert-pin | the paste result |
| unprocessed always | processing pipeline idle — check WM's own status UI/console | report the status state | status UI screenshot |

### WM-BOOT-01

**boot RPC ceiling: features arm within ~15s even when the history RPC is blocked** — `4ndr0tools - Watermark++.user.js` v2.1.2 · provenance: 8c F02 — 03dccb2 (the 15s AbortController ceiling)

- **Environment**: chrome / tampermonkey-mv3 / sites: https://gemini.google.com/ with WM enabled
- **Prerequisites**: block the RPC endpoint via DevTools request blocking (the /batchexecute conversation-history call)
- **Risk**: download none · network own account · ToS as WM-CLP-01

**Steps**:
1. Block the RPC endpoint
2. Load gemini with WM enabled
3. Watch for 15s: do the features arm anyway?

**PASS looks like**: WM's features (image replacement, copy hook, download hook) all arm within ~15s of the blocked RPC; a debug abort line is acceptable; the beforeunload dispose wiring stays intact (leave the page with no console errors).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| features dead until the tab is reloaded | the 8c F02 starvation back (init still serialized on the RPC) | unblock; reload; revert-pin | which features were dead + timing |
| console error spam | capture it | revert-pin if attributable | the lines |

## Instagram++ ARES wall (1)

### IG-ARES-01

**ARES wall harvest: wall opens, entries present, BUFFERED at most 500** — `4ndr0tools - Instagram++.user.js` v13.2.3 · provenance: 8c F03 — 03dccb2 (IG 13.2.3); the ARES family is long-standing

- **Environment**: chrome / tampermonkey-mv3 / sites: https://www.instagram.com/ logged-in
- **Prerequisites**: scroll a feed/reels/profile for 1-2 minutes WITHOUT opening the wall (this accumulates pendingItems)
- **Risk**: download none · network your own IG account; heavy scrolling mimics normal use · ToS moderate — authenticated DOM/wire as capture surface (the suite's standing stance)

**Steps**:
1. Browse media-heavy surfaces 1-2 min
2. Press Alt+I (or click the dock / menu command)
3. Read the wall header's BUFFERED counter
4. Close and reopen

**PASS looks like**: The ARES-9 wall opens; entries are present; the BUFFERED count is a plausible number at most 500 (the 8c F03 FIFO cap); no wall-open stall longer than a second; [ARES-9 V7.0] console lines clean.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| wall empty after heavy browsing | harvest/hot-path regression (NetHook onTraffic wiring) | reload; revert-pin | the BUFFERED count |
| BUFFERED above 500 | the 8c F03 FIFO cap regression (memory class) | reload; revert-pin; include a heap snapshot if possible | the counter value |
| wall never opens | dock/hotkey armament failure | revert-pin | console excerpt |

## Manager / browser matrix (3)

### MGR-CHT-01

**Chrome + Tampermonkey MV3 primary matrix: full battery + MV3-specific assertions** — `ALL` vsuite · provenance: standing (the saveAs/GM_download arms are Chrome-native per 2e F08)

- **Environment**: chrome / tampermonkey-mv3 / sites: the full battery above runs here first
- **Risk**: download as the families · network as the families · ToS as the families

**Steps**:
1. Run the full battery on this matrix
2. Additional: GM_download folder-qualified names land (DLP-04 Chrome arm)
3. GM_cookie live (WRM-01 — TM requires its cookie setting enabled)
4. MV3 service-worker suspension must NOT kill long Forums++ downloads: verify a bunkr album completes while the tab is backgrounded

**PASS looks like**: All suite behaviors under the primary matrix; no [Forums++] / [4ndr0tools] error attributable to grant surfaces.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| grant prompt at install | record which permissions TM lists | record; compare against the @grant set | the install-time permission list |
| backgrounded download dies | MV3 SW suspension interacts with a long resolver walk | revert-pin; report which host | timing + tab state |

### MGR-FFT-02

**Firefox + Tampermonkey: the saveAs arm + the gbx listener-mirror surfaces** — `ALL` vsuite · provenance: the standing FF-saveAs residual (r6/r7/r8 lists) + the Firefox+TM poll-blindness lesson embedded in the gbx listener-mirror

- **Environment**: firefox / tampermonkey / sites: FPP-DLP-04 (mandatory); FPP-GBX-01/02 (the listener-mirror path); FPP-RES spot-check (3 families); HL-SAV-01
- **Risk**: download as the families · network as the families · ToS as the families

**Steps**:
1. Run FPP-DLP-04 on Firefox
2. Run FPP-GBX-01/02 (the poll-blindness lesson's designed path)
3. Spot-check 3 resolver families + HL-SAV-01

**PASS looks like**: Per-family expectations; FF-specific: per-file OS save dialogs are EXPECTED (saveAs semantics — note, don't fail).

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| per-file names silently flip to the Chrome shape | isFF (InstallTrigger) detection failed — a FUTURE Firefox dropping InstallTrigger is the named watch-item for this test | record the Firefox version; report | the filename shapes + FF version |

### MGR-VIO-03

**Violentmonkey spot-check: documented degradations only (GM_cookie absent), no crashes** — `ALL` vsuite · provenance: the manager-matrix family; the guards hardened r1 — regression watch since

- **Environment**: chrome or firefox / violentmonkey / sites: Forums++ + Hailuo++ + Blob2URL installed on VM
- **Risk**: download low · network low · ToS low — spot-check tier: a failure here is a finding, not a release blocker unless it is the crash class

**Steps**:
1. Install Forums++ + Hailuo++ + Blob2URL on Violentmonkey
2. gofile flow: GM_cookie is NOT provided by VM — resolution must still work via the guest token in GM storage (only the cookie-sync warning appears)
3. gbx handshake: GM_addValueChangeListener works on VM (if not, the polling fallback must carry the bridge)
4. GM_download works (zip gate); Hailuo boots (the armed log line still required — document-start timing differs slightly on VM)

**PASS looks like**: No crash, no uncaught suite errors; only the documented degradations.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| uncaught 'GM_cookie is not defined' | typeof-guard regression (the fail-closed contract broken) — the r1 'Forums++ Violentmonkey transport crash' class back | revert-pin | the uncaught error + stack |
| gbx bridge dead on VM | listener+poll dual-path failure | revert-pin | console excerpt |
| Hailuo arm line missing | document-start semantics difference | record the VM version | the VM version + console |

## Cross-script co-install (1)

### XSI-HLV-01

**Hailuo++ + Akasha Silence + Blob2URL on hailuoai.video: no double-canvas-hook crash** — `ALL` vsuite · provenance: the r6 2-c audit's co-install interference class — standing surface (FEATURE-MATRIX co-install domains)

- **Environment**: chrome / tampermonkey-mv3 with AKS + B2U + HL all installed and enabled / sites: https://hailuoai.video/ logged in
- **Risk**: download one generation · network own account · ToS own account

**Steps**:
1. Load the site — assert HL's armed log fires
2. Run HL-CAN-01 (canvas generation)
3. Run HL-GEN-01 (video generation + bay)
4. Open B2U's vault panel and confirm it still populates
5. DevTools console: filter errors

**PASS looks like**: No double-canvas-hook crash (both scripts wrap the same prototypes — whichever arms second must chain to the first's wrap; a TypeError or infinite recursion in canvas calls is the failure). HL canvas captures still land — NOTE: if Akasha's blinding blanks the canvas BEFORE HL's hook sees the commit, that is the documented semantic interference: record it as a finding (step AKS down to core/off via its valve and re-run — if capture then works, it's the semantic conflict, not a regression). B2U's NetHook wrap and HL's private wraps coexist; zero console errors attributable to any of the three.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| canvas call crashes (page rendering breaks) | wrap-chaining regression — the exact class NetHook was built to fix for fetch/XHR; canvas has no shared hub | set AKS's valve to core/off on hailuoai.video; disable one wrapper; revert-pin | which script armed second (console order) + the TypeError |
| HL captures blank images under AKS full-strict | blinding-vs-capture semantic conflict (record + adjudicate) | step AKS down; re-run | the blank capture + valve state |
| B2U panel dead | NetHook subscriber fan-out broken | revert-pin | console excerpt |

## Suite-wide boot health (1)

### SWB-ALL-01

**all 38 dist scripts in one clean profile, 5 representative sites, zero suite-attributable console errors** — `ALL` vsuite · provenance: the standing suite-wide contract — every round's gate-certified claim has never had a live complement; this is the battery's capstone

- **Environment**: a DEDICATED clean browser profile (no other extensions) / tampermonkey / sites: (1) a simpcity thread (Forums++ + CB + FLX + ModelSearch + universal family); (2) hailuoai.video (HL + AKS + B2U + universal); (3) gemini.google.com (WM + universal); (4) instagram.com (IG + B2U + MPC + universal); (5) a bunkr album page (Bunkr++ + universal)
- **Prerequisites**: all 38 installed from dist/ raw URLs (inventory.json is the manifest)
- **Risk**: download low (5 sites, one profile) · network moderate time · ToS use the operator's own accounts

**Steps**:
1. Install all 38
2. Visit the five surfaces
3. On each, DevTools console open for 60s+ of interaction (scroll, open/close the panels the suites inject)
4. Record every console error; attribute each (stack frame — script or not)

**PASS looks like**: Zero console errors whose stack lands inside a suite script (warnings/debug lines are designed observables — fine); every script that should surface on the page does.

**If it fails** (what it means → what to do):

| mode | meaning | mitigation | evidence to capture |
|---|---|---|---|
| error at document-start on ANY page | the e8072ea boot-death class — unguarded realm refs | disable the offending script for the session; revert-pin | the stack + page |
| errors only on one surface | that script's host gate | as above | the stack + surface |
| a script's UI absent with no error | SILENT boot failure — the worst class | record which script; disable for the session | which script + screenshot |

## Report back (paste this template, filled)

```markdown
## OPERATOR BATTERY REPORT — suite 1.17.0 @ <git sha>
ENV: <browser + version> / <manager + version (MV3?)> / <OS> / dist @ <git sha> / date <YYYY-MM-DD>

| test | status (PASS/FAIL/BLOCKED) | evidence (link/inline) | note (failure mode if FAIL/BLOCKED) |
|---|---|---|---|
| FPP-GBX-01 |  |  |  |
| FPP-GBX-02 |  |  |  |
| FPP-WRM-01 |  |  |  |
| FPP-WRM-02 |  |  |  |
| FPP-RES-01 |  |  |  |
| FPP-RES-02 |  |  |  |
| FPP-RES-03 |  |  |  |
| FPP-RES-04 |  |  |  |
| FPP-RES-05 |  |  |  |
| FPP-RES-06 |  |  |  |
| FPP-RES-07 |  |  |  |
| FPP-RES-08 |  |  |  |
| FPP-RES-09 |  |  |  |
| FPP-RES-10 |  |  |  |
| FPP-RES-11 |  |  |  |
| FPP-RES-12 |  |  |  |
| FPP-DLP-01 |  |  |  |
| FPP-DLP-02 |  |  |  |
| FPP-DLP-03 |  |  |  |
| FPP-DLP-04 |  |  |  |
| FPP-DLP-05 |  |  |  |
| FPP-DLP-06 |  |  |  |
| FPP-DLP-07 |  |  |  |
| HL-GEN-01 |  |  |  |
| HL-CAN-01 |  |  |  |
| HL-BLB-01 |  |  |  |
| HL-SAV-01 |  |  |  |
| HL-HOV-01 |  |  |  |
| HL-EVC-01 |  |  |  |
| HL-EXP-01 |  |  |  |
| HL-BAY-02 |  |  |  |
| HL-SWB-01 |  |  |  |
| CB-TRG-01 |  |  |  |
| CB-TRG-02 |  |  |  |
| CB-TRG-03 |  |  |  |
| CB-TRG-04 |  |  |  |
| WM-CLP-01 |  |  |  |
| WM-CLP-02 |  |  |  |
| WM-BOOT-01 |  |  |  |
| IG-ARES-01 |  |  |  |
| MGR-CHT-01 |  |  |  |
| MGR-FFT-02 |  |  |  |
| MGR-VIO-03 |  |  |  |
| XSI-HLV-01 |  |  |  |
| SWB-ALL-01 |  |  |  |

FREE-FORM FINDINGS:
- <console excerpts, screenshot links, manager prompt hostnames, new-CDN hostnames for isBunkrUrl, etc.>
```

---

*Rendered by `node tools/operator-battery.mjs render` — deterministic; re-render after any bump. The manifest is the source of truth; this doc is its operator-facing projection. Results ingested by `node tools/operator-battery.mjs ingest <report.md>` land in `tools/operator-battery/results.json` (adjudication ledger, expiry v1.18.0).*
