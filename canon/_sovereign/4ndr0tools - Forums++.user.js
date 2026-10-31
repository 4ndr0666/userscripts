// noinspection SpellCheckingInspection,JSUnresolvedVariable,JSUnresolvedFunction,TypeScriptUMDGlobal,JSUnusedGlobalSymbols
// ==UserScript==
// @name        4ndr0tools - Forums++
// @namespace    https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.13.8
// @description Forum utils UI with powerful downloading, indexing, link checking, archiving features and more.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match       https://simpcity.su/threads/*
// @match       https://simpcity.cr/threads/*
// @match       https://simpcity.is/threads/*
// @match       https://simpcity.cz/threads/*
// @match       https://simpcity.hk/threads/*
// @match       https://simpcity.rs/threads/*
// @match       https://simpcity.ax/threads/*
// @match       https://gofile.io/*
// @match       https://goonbox.cr/*
// @match       https://*.goonbox.cr/*
// @require     https://unpkg.com/@popperjs/core@2
// @require     https://unpkg.com/tippy.js@6
// @require     https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require     https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @connect self
// @connect coomer.su
// @connect coomer.st
// @connect kemono.su
// @connect kemono.cr
// @connect big-taco-1img.bunkr.ru
// @connect i-pizza.bunkr.ru
// @connect bunkr.ac
// @connect bunkr.ax
// @connect bunkr.black
// @connect bunkr.cat
// @connect bunkr.ci
// @connect bunkr.cr
// @connect bunkr.fi
// @connect bunkr.is
// @connect bunkr.lu
// @connect bunkr.lv
// @connect bunkr.bi
// @connect bunkr.cm
// @connect bunkr.at
// @connect bunkr.by
// @connect bunkr.cx
// @connect bunkr.sx
// @connect bunkr.media
// @connect bunkr.nu
// @connect bunkr.red
// @connect bunkr.ru
// @connect bunkr.se
// @connect bunkr.si
// @connect bunkr.su
// @connect bunkr.site
// @connect bunkr.pk
// @connect bunkr.ph
// @connect bunkr.ps
// @connect bunkr.sk
// @connect bunkr.ws
// @connect bunkrr.ru
// @connect bunkrr.su
// @connect bunkrrr.org
// @connect bunkr.org
// @connect bunkrr.org
// @connect bunkr-cache.se
// @connect mlk-bk.cdn.gigachad-cdn.ru
// @connect apidl.bunkr.ru
// @connect get.bunkrr.su
// @connect cdn.cr
// @connect glb-apisign.cdn.cr
// @connect cyberdrop.me
// @connect cyberdrop.cc
// @connect cyberdrop.ch
// @connect cyberdrop.cloud
// @connect cyberdrop.nl
// @connect cyberdrop.to
// @connect cyberdrop.cr
// @connect cyberfile.su
// @connect cyberfile.me
// @connect saint2.su
// @connect saint2.pk
// @connect saint2.cr
// @connect turbo.cr
// @connect turbocdn.st
// @connect redd.it
// @connect i.ibb.co
// @connect ibb.co
// @connect imagebam.com
// @connect jpg.fish
// @connect jpg.fishing
// @connect jpg.pet
// @connect jpeg.pet
// @connect jpg.church
// @connect jpg.su
// @connect jpg.cr
// @connect jpeg.church
// @connect jpeg.fish
// @connect jpeg.fishing
// @connect jpeg.su
// @connect jpeg.cr
// @connect jpg1.su
// @connect jpg2.su
// @connect jpg3.su
// @connect jpg4.su
// @connect jpg5.su
// @connect jpg6.su
// @connect jpg7.cr
// @connect cuckcapital.cr
// @connect selti-delivery.ru
// @connect imgbox.com
// @connect pixhost.to
// @connect pornhub.com
// @connect postimg.cc
// @connect imgvb.com
// @connect pixxxels.cc
// @connect imagevenue.com
// @connect pbs.twimg.com
// @connect pixeldrain.com
// @connect pixeldrain.net
// @connect pixeldra.in
// @connect redgifs.com
// @connect noodlemagazine.com
// @connect spankbang.com
// @connect sb-cd.com
// @connect gofile.io
// @connect phncdn.com
// @connect goonbox.cr
// @connect filester.me
// @connect filester.sh
// @connect filester.si
// @connect filester.gg
// @connect box.com
// @connect boxcloud.com
// @connect give.xxx
// @connect pomf2.lain.la
// @connect onlyfans.com
// @connect yandex.ru
// @connect yandex.com
// @connect yandex.kz
// @run-at document-start
// @grant GM_xmlhttpRequest
// @grant GM_download
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_addValueChangeListener
// @grant GM_openInTab
// @grant GM_cookie
// @grant GM_deleteValue
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Forums++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Forums++.user.js
// @license      MIT
// ==/UserScript==
// 1.13.7 (WO-01 round 13): THE TWIN-DIVERGENCE ROUND — every finding below
// came from the r13 storage-round-trip and normalization-symmetry lenses
// (the two lenses the r12 handoff proposed after the MAM-F01 and SGC-F02
// classes proved impactful). (1) fnNoExt('photo') popped the only part and
// returned '' — the MIME-repair arm then minted '.mp4' (a HIDDEN DOTFILE)
// and the dedup suffix minted ' (1)' with a leading space; a basename with
// no dot IS the stem (13b-F01). (2) The ibb album page-count parse: a
// missing count node or a comma-formatted count made pageCount NaN, the
// page loop never ran, and the album silently resolved to ZERO files —
// digits-only extraction + a one-page floor now (13b-F02). (3) The kemono
// ?f= pretty-name recovery was DEAD CODE since 1.11.x: the generic
// basename arm strips the query BEFORE the kemono branch, so the recovery
// regex could never match and kemono files saved under UUID names — the
// recovery now reads the ORIGINAL url via URL/searchParams (percent-
// decoding included, which the old single-instance '%20' replace was not)
// (13b-F03). (4) The Pixeldrain resolver glued strings onto query-bearing
// links ('/u/abc?x=1' → '…?x=1?download', '/l/abc?x=1' → '…?x=1/zip') —
// URL-object construction appends to the path and sets a real param
// (13b-F04). (5) The current-page ThreadCache write cached an empty page
// forever — the 7d-F07 truthiness class armed on the write side: a CF
// interstitial or logged-out view parsed to zero posts and the refetch
// guard treated [] as cached (13a-F04). (6) getCachedThreadData shape-
// guards its store — a string-shaped value (manager coercion) made every
// page write a silent no-op through this non-strict file (13a-F15).
// (7) The skip-duplicates Bunkr arm kept '' as its dedup key for trailing-
// slash URLs — every such resource after the first was falsely logged
// 'Skipped duplicate' and dropped; h.basename strips the slash (13b-F11).
// (8) The redgifs users decode is guarded — a username with a bare '%'
// threw URIError before the resolver catch and nulled the whole profile
// walk (13b-F12, the 5-c F01 sibling). (9) The cyberdrop parseInfoText
// escapes the page-sourced slug before RegExp interpolation — a slug with
// regex metachars threw SyntaxError and dropped the file (13b-F13).
// 1.13.6 (suite v1.19.0, WO-01 round 11): THE OPERATOR-BATTERY LIVE CATCH
// (OBI-F01 — the operator's first real battery run: FPP-GBX-01/GBX-02/WRM-01
// all crashed live with 'Uncaught ReferenceError: resolve is not defined at
// finishSuccessfulLoad'). Root cause: since 1.12.1 (r6 a4c1f5b, the
// download-pipeline restoration) finishSuccessfulLoad has been defined in
// startDownload's scope but referenced the downloadPromise EXECUTOR's
// `resolve` param — a free variable outside its binding scope. Every
// successful onload threw at the settle line: the file was counted and
// staged into the zip, but the per-file promise NEVER settled — the
// concurrency slot never freed and the batch wedged forever ('fired up
// gofile++ to absolutely zero avail'). The function takes its settle
// callback as a parameter now (all four arms settle(); the three call
// sites pass their in-scope resolve) — and the class itself is now guarded
// repo-wide by tools/scope-census.mjs (r11): a free-variable reference to
// a promise-executor param outside its binding scope fails the gate.
// 1.13.5 (suite v1.18.0, WO-01 round 10): three audit one-liners. (1) The
// HEAD-SLICE sniff widens 4096→8192 bytes (10b F01 — a 4096-byte slice of
// CJK/emoji content decodes to only ~1366 chars, letting a marker at char
// position ~1400 escape the 2048-char window the test reads; 8192 covers the
// 4-byte worst case, still trivially cheap). (2) The zip arms' FileSaver
// fallback gains its own guard (10b F03 — an @require failure made the
// catch itself throw, degrading the guard to downloadPostGuarded's wrapper;
// the fallback now logs instead). (3) http.base gains onabort (10c F04 — an
// externally aborted GM request hung the resolver promise forever; timeout
// covered, abort did not). Truth note for the record: the r9 commit message
// claimed the zip arms gained 'the try/catch + FileSaver fallback the
// per-file arm has had since 1.13.3' — the per-file arm's catch is
// count+settle only; the FileSaver-in-catch was NEW for the zip arms
// (attribution drift, code sound).
// 1.13.4 (suite v1.16.0, WO-01 round 9): the two audit one-liners
// (9a F02/F05) + the disposition truth pass. The 1.13.3 headerless-body
// sniff admission fed the WHOLE blob to blob.text() to inspect 2048 chars
// — a multi-hundred-MB headerless binary spiked memory for nothing; the
// sniff reads a 4 KiB HEAD SLICE now (the head carries every marker the
// test reads). The zip-gate GM_download dispatches (zip + generated.zip)
// gain the arm-level try/catch + FileSaver fallback the per-file arm has
// had since 1.13.3 (8b F04) — a synchronous dispatch throw (blocked
// manager API, revoked grant) must not kill the post's save; the
// generated.zip artifacts land via FileSaver either way. WAIVED on
// record (9a F06): isBunkrUrl stays unanchored-substring — both matched
// substrings are bunkr infrastructure exclusively (bunkrr?r?./bunkr-cache/
// gigachad-cdn appear in no non-bunkr hostname), and anchoring on hostname
// would trade the negligible false-positive surface for a new URL-parse
// failure mode on non-URL inputs. CORRECTED on record (9a F07): the 1.13.3
// commit message said 'six' bunkr alternation groups; the tree carries
// seven live instances (the dedup itself was complete).
// 1.13.2 (suite v1.15.0, WO-01 round 7): the storage/UI/hygiene batch
// (7d F06-F12/F18-F23/F26-F28). STORAGE: pruned ThreadCache threads
// GM_deleteValue their key (the old {} placeholder capped the data but
// accumulated one dead key per thread ever visited) and expired gofile
// wt/at entries purge on read; a failed page fetch no longer poisons the
// cache (the catch returned [] — truthy, so a transient error permanently
// cached that page as 0 posts and the search undercounted); the zip save
// arms revoke the URL STRING (the old arms revoked the Blob object — a
// no-op that pinned every multi-MB zip blob until page unload). ZIP: the
// in-zip folder structure materializes (the sanitizer class included '/' —
// 'folder/video.mp4' flattened to 'folder_video.mp4' so the hierarchy the
// FF log/links paths and the folder-aware dedup both assume never existed);
// the thread title rides the segment sanitizer (a ':' failed GM_download
// name validation) and the FF flat arm sanitizes the basename too. DIRECT
// files join the folder-aware dedup set (a blob-staged name.mp4 and a
// DIRECT-switched same-named file collided on disk); the (n) suffix emits
// no trailing dot when the extension is empty. UI: the cached-post search
// input is readable on the light theme (near-white on near-white); matches
// on non-visible cached pages navigate to the PAGE path (a bare #post-<id>
// fragment silently no-oped when the post wasn't in the current DOM); the
// Download-Page tooltip's onShown wires post checkboxes + content tooltips
// once (every show re-registered them — handler accumulation); the
// auto-reaction fires only when something was actually staged or saved
// (completed>0 counted ALL-failed runs too — failures increment completed).
// The bunkr tiny-sniff needs a strong marker or ≥2 weak ones (a single
// 'cloudflare' byte sequence in a legit small binary dropped real files);
// the gofile cookie restore re-checks the busy state inside itself (a
// download starting between the idle check and the restore got the
// operator's own cookie swapped back mid-run).
// 1.13.1 (suite v1.15.0, WO-01 round 7): the pipeline settlement pass —
// every per-file promise now settles on every exit path. The bunkr maint
// abort wedged the whole post forever (7d F01: the onabort arm's comment
// claimed it owned the count, but the recoveryArmed early-return swallowed
// it and onload never fires after abort — Promise.all hung, the in-flight
// guard pinned, no zip, no summary; the maint branch now counts+settles
// single-shot in onabort with an onload fallback for managers whose abort()
// throws). The turbo re-sign ladder never advanced (7d F02: retry state was
// keyed by the MUTABLE url, so every successful re-sign handed the retried
// download a fresh {resign:0} — a permanently-stalling turbo file cycled
// forever; the state now keys the RESOURCE object in a WeakMap). The stall
// watchdog stood armed across the post-onload save window (7d F03: no
// onprogress after onload — a slow disk write or an ask-where-to-save prompt
// past 30 s double-counted the file or re-downloaded it entirely for turbo;
// onload/onerror/ontimeout now set transferDone and the watchdog stands
// down). The 2h watchdog ceiling now settles instead of silently relying on
// the transport bound (7d F24). Lifecycle: downloadPostGuarded arms the
// in-flight guard at ENTRY — before the minutes-long resolver walk, where a
// navigate used to kill the run with the guard unarmed (7d F13) — and a
// try/catch/finally restores it on EVERY exit path (7d F04: any throw below
// resolution leaked the flag, pinned beforeunload, skipped the summary/zip/
// log cleanup and surfaced as an unhandled rejection at both call sites);
// re-entry guards at both download buttons stop a double-click stacking a
// second pipeline over the same resources (7d F05). Batch composition is
// per-batch now (7d F14: one bunkr link no longer serializes fifty
// pixeldrain links — rate-defense items ride alone, others keep 2-slot
// batches, ≤1 GoFile per batch still holds). DIRECT switches also fire on
// accumulated bytes when Content-Length is absent (7d F15); every recovery
// arm settles on rejection too (7d F16: a synchronous dispatch throw or a
// rejected .then no longer hangs the per-file promise); the turbo re-sign
// passes the EMBED page as referer like the resolvers do — the CDN URL was
// being sent, defaulting saint2 re-signs to the turbo.cr origin (7d F17).
// 1.13.0 (suite v1.15.0, WO-01 round 7): the resolution-layer truth pass —
// every host the widened v1.12.0 tables collect is now actually resolvable
// (the matcher-widening asymmetry class: hosts/@connect were widened but the
// resolver patterns were not — 7a F01/F02/F03/F05/F06). Coomer .st (both
// resolvers + the walker's host derivation), kemono .cr, JPGX .cr
// +cuckcapital singles, the no-digit/jpe?g family forms (jpg.fish/jpg.pet/
// jpeg.pet were collected since v1.11.2 but never matched a resolver — the
// inherited 7a F08 defect), pixeldrain .net/pixeldra.in, and bunkr.at (the
// token shipped in v1.12.0 but the TLD never joined the four alternations)
// all resolve now; the yandex resolver's literal disk.yandex.ru endpoint and
// page fetches gain their covering tokens (yandex ru/com/kz — 7a F04) and
// bunkr.org/bunkrr.org join bunkrrr.org (the alternation always admitted
// them); the cyberdrop single-file fallback ladder's four api.cyberdrop.cr
// candidates interpolate their slug (single quotes shipped literal
// '${slug}' text — 7c F06); the boot redgifs token fetch dedupes into the
// status-checked refresh helper and only runs on /threads/ pages (it fired
// on every gofile.io/goonbox.cr helper tab the widened @match added —
// 7a F09/F10).
// 1.12.1 (suite v1.14.0, WO-01 round 6): the lineage restoration, segment 2 —
// the download pipeline + UI/storage layer. PIPELINE: lineage batch rules
// (turbo-family/bunkr serialize to 1, else 2, ≤1 GoFile per batch — the
// gate-spam cascade); the hard 60 s timeout and the dead interval are replaced
// by the no-progress stall watchdog (turbo 5 s else 30 s) with the turbo
// re-sign ladder (≤3 re-signs → 1 DIRECT fallback); DIRECT raw-URL fallback
// above 1.6 GB (gofile/pixeldrain/filester) and 500 MB (bunkr); maint.mp4
// early abort; onload guards (bad status, HTML gates, the verifyBunkrLinks
// tiny-sniff — the checkbox's FIRST consumer); the GoFile warm-up-tab retry;
// onabort completion arm; resource-keyed tracking (duplicate URLs no longer
// collapse, the Promise.race deref can't throw); folder-aware dedup naming;
// awaited GM_download completions; the zip gate (no empty archive on
// all-DIRECT/all-failed runs) + caught JSZip assembly; the amber X/Y final
// summary; gofile cookie restore when the last post goes idle; resolving
// counter + per-resolver progress callback. UI/STORAGE: the Zipped checkbox
// renders on Firefox too (per-file blob-URL GM_download makes it meaningful
// there — the always-zip behavior was the lost lineage shape); 'Toggle All'
// label (was EMPTY on both forms — an inherited lineage defect); theme-aware
// tooltip colors (the no-op ternary gone; light keeps the lineage light
// surface, dark keeps 3lectric-Glass); Duplicate Tab keeps the post anchor's
// href; ThreadCache bounded (MRU thread registry, ≤12 threads) with its read
// side's FIRST consumer — the in-thread cached-post search box in the Post
// Selection form (getAllCachedPosts/getCachedPage/listCachedPageNumbers).
// 1.12.0 (suite v1.14.0, WO-01 round 6): the lineage restoration, segment 1 — the
// resolution layer is restored to XenForoPostDownloader v3.23 feature parity
// (the operator's Forums++ directive; every port below carries its machinery
// complete — no matcher-only dead-ends). HEADER: @match gains the four
// simpcity TLD mirrors + gofile.io/* + goonbox.cr/* (the goonbox helper-tab
// bridge and the gofile cookie sync run in those tabs); @grant gains
// GM_addValueChangeListener/GM_openInTab/GM_cookie; @connect loses six
// zero-code tokens (media.tumblr.com, pvvstream.pro, xvideos.com, github.com,
// githubusercontent.com, postimg.cc duplicate) and gains the port-driven set
// (coomer.st, kemono.cr, jpg7.cr, cuckcapital.cr, bunkr lu/lv/bi/cm/at/by/cx/sx,
// apidl.bunkr.ru, get.bunkrr.su, cdn.cr, glb-apisign.cdn.cr, cyberdrop.cr,
// turbo.cr, turbocdn.st, onlyfans.com, pomf2.lain.la, give.xxx, box.com,
// boxcloud.com, goonbox.cr, filester me/sh/si/gg, pixeldrain.net, pixeldra.in).
// HOSTS: Goonbox / Redgifs:users / Filester:d+f / turbo(v|d|a) shapes join the
// table; Saint widens to the turbo.cr originals beside the saint2 migration;
// Coomer .st, kemono .cr, JPGX .cr+cuckcapital, Bunkr +8 TLDs, Pixeldrain
// .net/pixeldra.in, Cyberdrop generic-TLD matchers widened. RESOLVERS: the
// turbo sign API (5 s timeout, 2 jittered retries, fn= preservation, embed
// fallback) + stall re-sign ride-along state; the goonbox CF bridge (GM-storage
// handshake, marker-gated helper tab, path allow-list, 120 s breaker, listener
// + poll dual delivery); GoFile's 2026-08 API (wt.obf.js scoped-eval + guest
// account + xfpd_gofile_wt/at 24 h TTL + bearerOverride + cookie sync/restore
// — the hardcoded token and its unreachable createAccount boot path are dead
// against the live site and are gone); Bunkr's apidl/_001_v2 flow with CF
// warm-up tabs, 60-min domain blacklist, cdn.cr signing, name hints and the
// ?page= album walker; Cyberdrop's api.cyberdrop.cr info→auth→direct ladder
// with warm-up; Redgifs users pagination walker + token refresh on
// 401/403/429; Pornhub flashvars reassembly (bounded retries, the lineage's
// 20-loop tamed to 5 with logging); Filester v2 token API for /d/ + /f/ (the
// v1 cache-host probe sweep stays unported by design — its hosts are
// NXDOMAIN/black-holed per the lineage's own field notes; Filester++
// sovereign keeps the standalone surface). All hint registries bounded
// (hintMap FIFO); every catch logged (G11).
// 1.11.2 (suite v1.12.0, WO-01 round 5): the ibb.co data-object decode joins
// the guarded family (5-c F01 — the 1.11.1 line below claimed "both sites"
// while only the Content-Disposition filename site had shipped the guard;
// this is the second site, error-path-only, identical on well-formed input).
// 1.11.1 (suite v1.12.0, WO-01 round 4): hardening batch — createForm's
// form-id now escapes postId like every sibling sink (4-c F07); the
// Content-Disposition filename decodeURIComponent site degrades losslessly
// on malformed input instead of throwing (4-c F05).
// 1.9.2 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Forums++.user v1.13.6 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px;');

/* global JSZip, tippy, GM_xmlhttpRequest, saveAs, sha256, GM_download, GM_getValue, GM_setValue, GM_addValueChangeListener, GM_openInTab, GM_cookie, GM_deleteValue */

const JSZipGlobal = window.JSZip;
const tippyGlobal = window.tippy;
const http = GM_xmlhttpRequest;
const isFF = typeof InstallTrigger !== 'undefined';
let logs = [];

const log = {
    /**
     * @param {string} postId
     * @returns {number}
     */
    separator: postId => logs.push({ postId, message: '-'.repeat(175) }),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} type
     * @param {boolean} [toConsole=true]
     */
    write: (postId, str, type, toConsole = true) => {
        const date = new Date();
        const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
            .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
            .replace(/::/g, '');
        logs.push({ postId, message });
        if (toConsole) {
            const lowerType = type.toLowerCase();
            if (lowerType === 'info') {
                console.info(message);
            } else if (lowerType === 'warn') {
                console.warn(message);
            } else {
                console.error(message);
            }
        }
    },
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'INFO'),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'WARNING'),
    /**
     * @param {string} postId
     * @param {string} str
     * @param {string} scope
     */
    error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, 'ERROR'),
    post: {
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} postNumber
         * @returns {void}
         */
        info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} postNumber
         * @returns {void}
         */
        error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`),
    },
    host: {
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} host
         * @returns {void}
         */
        info: (postId, str, host) => log.info(postId, str, host),
        /**
         * @param {string} postId
         * @param {string} str
         * @param {string} host
         * @returns {void}
         */
        error: (postId, str, host) => log.error(postId, str, host),
    },
};

const settings = {
    naming: {
        allowEmojis: false,
        invalidCharSubstitute: '-',
    },
    hosts: {
        goFile: {
            // v1.12.0: the hardcoded token is gone — the live API requires the
            // per-request x-website-token (wt.obf.js generateWT) and the token
            // is now created/persisted lazily by the resolver (xfpd_gofile_at,
            // 24 h TTL). bearerOverride: paste a personal GoFile token here to
            // always use it instead of the anonymous account flow.
            token: '',
            bearerOverride: '',
        },
    },
    ui: {
        checkboxes: {
            /* v1.12.1 (2e-F15): 'Toggle All' — the label was empty on BOTH the
             * per-host and page-level forms (an inherited lineage defect: a
             * checkbox rendered with no accessible name). */
            toggleAllCheckboxLabel: 'Toggle All',
        },
    },
    extensions: {
        documents: ['.txt', '.doc', '.docx', '.pdf'],
        compressed: ['.zip', '.rar', '.7z', '.tar', '.bz2', '.gzip'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jpe', '.svg', '.tif', '.tiff', '.jif'],
        video: [
            '.mpeg',
            '.avchd',
            '.webm',
            '.mpv',
            '.swf',
            '.avi',
            '.m4p',
            '.wmv',
            '.mp2',
            '.m4v',
            '.qt',
            '.mpe',
            '.mp4',
            '.flv',
            '.mov',
            '.mpg',
            '.ogg',
        ],
    },
    // Page caching specific settings
    caching: {
        maxPagesToCache: 10, // Total pages around the current page (e.g., 5 prev + current + 4 next = 10)
    }
};

const h = {
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isArray: v => Array.isArray(v),
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isObject: v => typeof v === 'object' && v !== null,
    /**
     * @param {*} v
     * @returns {boolean}
     */
    isNullOrUndef: v => v === null || typeof v === 'undefined',
    /**
     * @param {string} path
     * @returns {string}
     */
    basename: path => path.replace(/\/(\s+)?$/, '').split('/').pop() ?? '',
    /**
     * @param {string} path
     * @returns {string}
     */
    fnNoExt: path => {
        const trimmed = String(path).trim();
        const parts = trimmed.split('.');
        /* v1.13.7 (13b-F01): a dotless basename is its own stem — the old
         * pop-then-join returned '' for 'photo', the MIME-repair arm minted
         * '.mp4' (a hidden dotfile) and the dedup suffix minted ' (1)'. */
        if (parts.length < 2) return trimmed;
        parts.pop(); // Remove extension
        return parts.join('.');
    },
    /**
     * @param {string} path
     * @returns {string|null}
     */
    ext: path => {
        if (!path || !path.includes('.')) return null;
        return path.split('.').pop()?.toLowerCase() ?? null;
    },
    /**
     * @param {HTMLElement} element
     * @returns {void}
     */
    show: element => (element.style.display = 'block'),
    /**
     * @param {HTMLElement} element
     * @returns {void}
     */
    hide: element => (element.style.display = 'none'),
    /**
     * @template T
     * @param {(resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void} executor
     * @returns {Promise<T>}
     */
    promise: executor => new Promise(executor),
    /**
     * @param {number} ms
     * @returns {Promise<void>}
     */
    delayedResolve: async ms => await h.promise(resolve => setTimeout(resolve, ms)),
    /**
     * @param {string} tag
     * @param {string} content
     * @returns {string}
     */
    stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?<\/${tag}>`, 'igs'), ''),
    /**
     * @param {string[]} tags
     * @param {string} content
     * @returns {string}
     */
    stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
    /**
     * @param {string} string
     * @param {number} [maxLength=20]
     * @returns {string}
     */
    limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
    /**
     * v1.11.0 (WO-01 round 3, 3-c F01 — CRITICAL): the forms module
     * interpolates post text (innerText) and page-derived ids into
     * HTML-string templates rendered by tippy with allowHTML:true +
     * interactive:true — a post whose first 20 characters are a complete
     * handler tag (`<b onclick=alert(1)>` is exactly 20 chars, so h.limit
     * passes it whole) executed in every viewer's page. Port of the
     * merged twin LinkMasterΨ's escapeHTML (the twin was hardened in its
     * merge; the sovereign never received the fix). Escaping AFTER
     * h.limit keeps the visible ≤20 chars intact.
     *
     * @param {string} str
     * @returns {string}
     */
    escapeHTML: (str) => String(str ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch])),
    /**
     * @param {string} selector
     * @param {ParentNode} [container=document]
     * @returns {Element|null}
     */
    element: (selector, container = document) => container.querySelector(selector),
    /**
     * @param {string} selector
     * @param {ParentNode} [container=document]
     * @returns {NodeListOf<Element>}
     */
    elements: (selector, container = document) => container.querySelectorAll(selector),
    /**
     * @param {string} needle
     * @param {string} haystack
     * @param {boolean} [ignoreCase=true]
     * @returns {boolean}
     */
    contains: (needle, haystack, ignoreCase = true) =>
        (ignoreCase ? haystack.toLowerCase().includes(needle.toLowerCase()) : haystack.includes(needle)),
    /**
     * @param {string} str
     * @returns {string}
     */
    ucFirst: str => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
    /**
     * @template T
     * @param {T[]} items
     * @param {function(T): string} [cb]
     * @returns {T[]}
     */
    unique: (items, cb) => {
        if (cb) {
            const seen = new Set();
            return items.filter(item => {
                const key = cb(item);
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        }
        return [...new Set(items)];
    },
    /**
     * @param {number} number
     * @param {object} [options={}]
     * @returns {string}
     */
    prettyBytes: (number, options = {}) => {
        const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const BIBYTE_UNITS = ['B', 'kiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        const BIT_UNITS = ['b', 'kbit', 'Mbit', 'Gbit', 'Tbit', 'Pbit', 'Ebit', 'Zbit', 'Ybit'];
        const BIBIT_UNITS = ['b', 'kibit', 'Mibit', 'Gibit', 'Tibit', 'Pibit', 'Eibit', 'Zibit', 'Yibit'];

        const toLocaleString = (num, locale, opts) => {
            let result = num;
            if (typeof locale === 'string' || h.isArray(locale)) {
                result = num.toLocaleString(locale, opts);
            } else if (locale === true || opts !== undefined) {
                result = num.toLocaleString(undefined, opts);
            }
            return result;
        };

        if (!Number.isFinite(number)) {
            throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
        }

        options = {
            bits: false,
            binary: false,
            space: true,
            ...options,
        };

        const UNITS = options.bits ? (options.binary ? BIBIT_UNITS : BIT_UNITS) : options.binary ? BIBYTE_UNITS : BYTE_UNITS;
        const separator = options.space ? ' ' : '';

        if (options.signed && number === 0) {
            return ` 0${separator}${UNITS[0]}`;
        }

        const isNegative = number < 0;
        const prefix = isNegative ? '-' : options.signed ? '+' : '';

        if (isNegative) {
            number = -number;
        }

        let localeOptions;
        if (options.minimumFractionDigits !== undefined) {
            localeOptions = { minimumFractionDigits: options.minimumFractionDigits };
        }
        if (options.maximumFractionDigits !== undefined) {
            localeOptions = { maximumFractionDigits: options.maximumFractionDigits, ...localeOptions };
        }

        if (number < 1) {
            const numberString = toLocaleString(number, options.locale, localeOptions);
            return prefix + numberString + separator + UNITS[0];
        }

        const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
        number /= (options.binary ? 1024 : 1000) ** exponent;

        if (!localeOptions) {
            number = Number(number.toPrecision(3));
        }

        const numberString = toLocaleString(number, options.locale, localeOptions);
        const unit = UNITS[exponent];
        return prefix + numberString + separator + unit;
    },
    ui: {
        /**
         * @param {HTMLElement} element
         * @param {string} text
         */
        setText: (element, text) => {
            element.textContent = text;
        },
        /**
         * @param {HTMLElement} element
         * @param {CSSStyleDeclaration} props
         */
        setElProps: (element, props) => {
            for (const prop in props) {
                if (Object.prototype.hasOwnProperty.call(props, prop)) {
                    element.style[prop] = props[prop];
                }
            }
        },
    },
    http: {
        /**
         * @param {string} method
         * @param {string} url
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {*} [data=null]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<{source: string, request: XMLHttpRequest, status: number, dom: Document, responseHeaders: string}>}
         */
        base: (method, url, callbacks = {}, headers = {}, data = null, responseType = 'document') => {
            return new Promise((resolve, reject) => {
                let responseHeaders = null;
                let request = null;
                request = http({
                    method,
                    url,
                    responseType,
                    data,
                    // v1.10.0: hard 20 s bound — the document transport used
                    // to be unbounded (a stalled host hung the resolver).
                    timeout: 20000,
                    headers: { Referer: url, ...headers },
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            responseHeaders = response.responseHeaders;
                            if (callbacks?.onResponseHeadersReceieved) {
                                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });
                                if (request) {
                                    request.abort();
                                    resolve({ request, response, status: response.status, responseHeaders });
                                }
                            }
                        }
                        callbacks?.onStateChange?.({ request, response });
                    },
                    onprogress: response => callbacks?.onProgress?.({ request, response }),
                    onload: response => {
                        const { responseText, status } = response;
                        const dom = response?.response;
                        callbacks?.onLoad?.(response);
                        resolve({ source: responseText, request, status, dom, responseHeaders });
                    },
                    onerror: error => {
                        callbacks?.onError?.(error);
                        reject(error);
                    },
                    ontimeout: () => reject(new Error('Request timed out (20s)')),
                    /* v1.13.5 (10c F04): a manager-aborted request must settle
                     * the resolver — timeout covered this, abort did not. */
                    onabort: () => reject(new Error('Request aborted')),
                });
            });
        },
        /**
         * @param {string} url
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<object>}
         */
        get: (url, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.http.base('GET', url, callbacks, headers, null, responseType);
        },
        /**
         * @param {string} url
         * @param {*} [data={}]
         * @param {object} [callbacks={}]
         * @param {object} [headers={}]
         * @param {XMLHttpRequestResponseType} [responseType='document']
         * @returns {Promise<object>}
         */
        post: (url, data = {}, callbacks = {}, headers = {}, responseType = 'document') => {
            return h.http.base('POST', url, callbacks, headers, data, responseType);
        },
    },
    re: {
        /**
         * @param {RegExp} pattern
         * @returns {string}
         */
        stripFlags: pattern => pattern.toString().replace(/^\/|\/[a-z]*$/g, ''),
        /**
         * @param {RegExp} pattern
         * @returns {string}
         */
        toString: pattern => h.re.stripFlags(pattern.toString()),
        /**
         * @param {string} pattern
         * @param {string} flags
         * @returns {RegExp}
         */
        toRegExp: (pattern, flags) => new RegExp(pattern, flags),
        /**
         * @param {RegExp} pattern
         * @param {string} subject
         * @returns {string|null}
         */
        match: (pattern, subject) => {
            const matches = pattern.exec(subject);
            return matches?.[0] ?? null;
        },
        /**
         * @param {RegExp} pattern
         * @param {string} subject
         * @returns {string[]}
         */
        matchAll: (pattern, subject) => {
            const matches = [];
            let m;
            // Ensure global flag for matchAll-like behavior
            const regex = new RegExp(pattern.source, 'g' + (pattern.flags?.replace('g', '') || ''));
            while ((m = regex.exec(subject)) !== null) {
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                matches.push(m[0]);
            }
            return matches;
        },
    },
};

// Extend Array prototype for convenience
Array.prototype.unique = function (cb) {
    return h.unique(this, cb);
};

const parsers = {
    thread: {
        /**
         * @returns {string}
         */
        parseTitle: () => {
            const emojisPattern =
                  /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
            let parsed = h.stripTags(['a', 'span'], h.element('.p-title-value')?.innerHTML ?? '').replace(/\n/g, '');
            return !settings.naming.allowEmojis ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim() : parsed.trim();
        },
        /**
         *
         * @param {HTMLElement} postEl
         * @returns {object}
         */
        parsePost: postEl => {
            const messageContent = postEl.parentNode.parentNode.querySelector('.message-content > .message-userContent');
            const footer = postEl.parentNode.parentNode.querySelector('footer');
            const messageContentClone = messageContent?.cloneNode(true);

            const postIdAnchor = postEl.querySelector('li:last-of-type > a');
            const postId = /(?<=\/post-).*/i.exec(postIdAnchor?.getAttribute('href') ?? '')?.[0] ?? '';
            const postNumber = postIdAnchor?.textContent.replace('#', '').trim() ?? '';

            // Remove elements not relevant for content extraction or that cause issues.
            ['.contentRow-figure', '.js-unfurl-favicon', 'blockquote', '.button-text > span']
                .flatMap(selector => [...(messageContentClone?.querySelectorAll(selector) ?? [])])
                .forEach(el => {
                if (el.tagName === 'BLOCKQUOTE') {
                    // Only remove blockquotes that quote other posts.
                    if (el.querySelector('.bbCodeBlock-title')) {
                        el.remove();
                    }
                } else {
                    el.remove();
                }
            });

            // Remove thread links/unfurled content. (v1.9: host-agnostic
            // selector — the simpcity.cr mirror is matched too, not just .su.)
            [...(messageContentClone?.querySelectorAll('.contentRow-header > a[href*="/threads"]') ?? [])]
                .map(a => a.closest('.bbCodeBlock--unfurl'))
                .forEach(el => el?.remove());

            // Extract spoilers from the post content.
            const spoilers = [...(messageContentClone?.querySelectorAll('.bbCodeBlock--spoiler > .bbCodeBlock-content, .bbCodeInlineSpoiler') ?? [])]
                .filter(s => !s.querySelector('.bbCodeBlock--unfurl')) // Ensure not to parse unfurled content as spoiler
                .map(s => s.innerText)
                .concat(
                    h.re
                    .matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?\/,;.]+/gis, messageContentClone?.innerText ?? '')
                    .map(s => s.trim()),
                )
                .map(s =>
                     s
                     .trim()
                     .replace(/^:/, '')
                     .replace(/\bp:\b/i, '')
                     .replace(/\bpw:\b/i, '')
                     .replace(/\bkey:\b/i, '')
                     .trim(),
                )
                .filter(s => s !== '')
                .unique();

            const postContent = messageContentClone?.innerHTML ?? '';
            const postTextContent = messageContentClone?.innerText ?? '';

            const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);
            const pageNumber = matches?.[0] ? Number(matches[0]) : 1;

            return {
                post: postEl, // Keep reference to original DOM element if needed later
                postId,
                postNumber,
                pageNumber,
                spoilers,
                footer,
                content: postContent,
                textContent: postTextContent,
                contentContainer: messageContent,
            };
        },
    },
    hosts: {
        /**
         * @param {string} postContent
         * @returns {Array<object>}
         */
        parseHosts: postContent => {
            const parsed = [];

            for (const host of hosts) {
                if (host.length < 2) continue; // Require at-least the signature plus an array of matchers.

                const [name, category = 'misc'] = host[0].split(':');
                const [singleMatcherPattern, albumMatcherPattern] = host[1];

                const execMatcher = matcher => {
                    if (!matcher) return [];

                    let patternStr = matcher.toString();

                    const stripQueryString = h.contains('<no_qs>', patternStr);
                    const stripTrailingSlash = !h.contains('<keep_ts>', patternStr);
                    // Replace placeholders and options
                    patternStr = patternStr.replace(/<no_qs>|<keep_ts>|~an@/g, (match) => match === '~an@' ? '[a-zA-Z0-9]' : '');

                    let pattern;
                    if (h.contains('!!', patternStr)) { // Custom pattern override
                        patternStr = patternStr.replace('!!', '');
                        pattern = h.re.toRegExp(h.re.toString(patternStr), 'igs');
                    } else { // Default pattern for href, src, data-url attributes or direct URLs
                        const pat = `(?<=data-url="|src="|href=")${h.re.toString(patternStr)}.*?(?=")|https?:\/\/(www.)?${h.re.toString(patternStr)}.*?(?=("|<|$|\\]|'))`;
                        pattern = h.re.toRegExp(pat, 'igs');
                    }

                    let matches = h.re.matchAll(pattern, postContent).unique();

                    matches = matches.map(url => {
                        let processedUrl = url.trim();
                        if (stripQueryString && processedUrl.includes('?')) {
                            processedUrl = processedUrl.substring(0, processedUrl.indexOf('?'));
                        }
                        if (stripTrailingSlash && processedUrl.endsWith('/')) {
                            processedUrl = processedUrl.slice(0, -1);
                        }
                        return processedUrl;
                    });

                    return h.unique(matches);
                };

                const categories = category.split(',');

                if (singleMatcherPattern) {
                    const singleCategory = categories[0];
                    const formattedCategory = ['image', 'video'].includes(singleCategory) ? `${h.ucFirst(singleCategory)}s` : (singleCategory.trim() ? h.ucFirst(singleCategory) : 'Links');

                    parsed.push({
                        name,
                        type: 'single',
                        category: formattedCategory,
                        resources: execMatcher(singleMatcherPattern),
                    });
                }

                if (albumMatcherPattern) {
                    const albumCategory = categories.length > 1 ? categories[1] : categories[0];
                    parsed.push({
                        name,
                        type: 'album',
                        category: `${h.ucFirst(albumCategory)} Albums`,
                        resources: execMatcher(albumMatcherPattern),
                    });
                }
            }

            return parsed
                .map(p => ({
                    ...p,
                    enabled: true,
                    id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER), // Unique ID for checkbox
                }))
                .filter(p => p.resources.length); // Only include hosts that found resources
        },
    },
};

const styles = {
    tippy: {
        theme: `.tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:1 7px 7px;border-bottom-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:#67E8F9}`,
    },
};

const ui = {
    /**
     * @returns {string}
     */
    /* v1.12.1 (2e-F16): theme-aware tooltip colors — the old body was a no-op
     * ternary returning the same 3lectric dark value on BOTH branches (the
     * site's light theme got dark-translucent panels). Dark keeps the
     * 3lectric-Glass palette; light gets the lineage's light surface. */
    getTooltipBackgroundColor: () => {
        const lightTheme = (() => {
            try {
                const scheme = document.documentElement?.dataset?.colorScheme
                    || document.documentElement?.getAttribute('data-color-scheme')
                    || document.body?.dataset?.colorScheme
                    || document.body?.getAttribute('data-color-scheme');
                if (scheme) return String(scheme).toLowerCase().includes('light');
            } catch (e) {
                console.debug('[Forums++] color-scheme probe rejected:', e && e.message);
            }
            return false;
        })();
        return lightTheme ? '#EDF0F3' : 'rgba(10,19,26,0.85)';
    },
    /* v1.13.2 (7d F10): the same probe, as a flag — the cached-post search
     * input styled its text with the dark ink on the light surface
     * (near-white on near-white). */
    isLightTheme: () => {
        try {
            const scheme = document.documentElement?.dataset?.colorScheme
                || document.documentElement?.getAttribute('data-color-scheme')
                || document.body?.dataset?.colorScheme
                || document.body?.getAttribute('data-color-scheme');
            if (scheme) return String(scheme).toLowerCase().includes('light');
        } catch (e) {
            console.debug('[Forums++] color-scheme probe rejected:', e && e.message);
        }
        return false;
    },
    /**
     * @param {HTMLElement|string} target
     * @param {string} content
     * @param {object} [options={}]
     * @returns {any} Tippy.js instance
     */
    tooltip: (target, content, options = {}) => {
        return tippyGlobal(target, {
            arrow: true,
            theme: 'transparent',
            allowHTML: true, // Be cautious with HTML from untrusted sources
            content: content,
            appendTo: () => document.body,
            placement: 'left',
            interactive: true,
            ...options,
        });
    },
    pBars: {
        /**
         * @param {string} color
         * @param {string} [height='3px']
         * @param {string} [width='0%']
         * @returns {HTMLDivElement}
         */
        base: (color, height = '3px', width = '0%') => {
            const pb = document.createElement('div');
            pb.style.height = height;
            pb.style.background = color;
            pb.style.width = width;
            return pb;
        },
        /**
         * @param {string} [color='#00E5FF']
         * @returns {HTMLDivElement}
         */
        createFileProgressBar: (color = '#00E5FF') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '1px';
            return pb;
        },
        /**
         * @param {string} [color='#67E8F9']
         * @returns {HTMLDivElement}
         */
        createTotalProgressBar: (color = '#67E8F9') => {
            const pb = ui.pBars.base(color);
            pb.style.marginBottom = '10px';
            return pb;
        },
    },
    labels: {
        /**
         * @param {string|null} [initialText=null]
         * @param {string} [color='rgba(0,229,255,0.7)']
         * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
         */
        createBlockLabel: (initialText = null, color = 'rgba(0,229,255,0.7)') => {
            const container = document.createElement('div');
            container.style.color = color;
            container.style.fontSize = '12px';

            const span = document.createElement('span');
            container.appendChild(span);

            if (initialText) {
                span.textContent = initialText;
            }

            return {
                el: span,
                container,
            };
        },
        status: {
            /**
             * @param {string} [initialText='']
             * @returns {{container: HTMLDivElement, el: HTMLSpanElement}}
             */
            createStatusLabel: (initialText = '') => {
                const label = ui.labels.createBlockLabel(initialText);
                label.el.style.marginBottom = '3px';

                return label;
            },
        },
    },
    buttons: {
        /**
         * @returns {HTMLAnchorElement}
         */
        createPostDownloadButton: () => {
            const downloadPostBtn = document.createElement('a');
            downloadPostBtn.setAttribute('href', '#');
            downloadPostBtn.textContent = '🡳 Download';

            return downloadPostBtn;
        },
        /**
         * @returns {HTMLLIElement}
         */
        createPostDownloadButtonContainer: () => {
            return document.createElement('li');
        },
        /**
         * @param {HTMLElement} post
         * @returns {{container: HTMLLIElement, btn: HTMLAnchorElement}}
         */
        addDownloadPostButton: post => {
            const btnDownloadPostContainer = ui.buttons.createPostDownloadButtonContainer();
            const btnDownloadPost = ui.buttons.createPostDownloadButton();
            btnDownloadPostContainer.appendChild(btnDownloadPost);
            post.prepend(btnDownloadPostContainer);

            return {
                container: btnDownloadPostContainer,
                btn: btnDownloadPost,
            };
        },
    },
    forms: {
        /**
         * @param {string} id
         * @param {string} label
         * @param {boolean} checked
         * @returns {string}
         */
        createCheckbox: (id, label, checked) => {
            return `
                <div class="menu-row" style="margin-top: -5px;">
                    <label class="iconic" style="user-select: none">
                        <input type="checkbox" ${checked ? 'checked="checked"' : ''} id="${h.escapeHTML(id)}" />
                        <i aria-hidden="true"></i>
                        <span class="iconic-label" style="font-weight: bold; margin-left: -7px">
                            <span id="${h.escapeHTML(id)}-label">${h.escapeHTML(label)}</span>
                        </span>
                    </label>
                </div>
            `;
        },
        /**
         * @param {string} content
         * @returns {string}
         */
        createRow: content => {
            return `
                <div class="menu-row">
                    ${content}
                </div>
            `;
        },
        /**
         * @param {string} label
         * @returns {string}
         */
        createLabel: label => {
            return `
                <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #00E5FF;">
                    ${h.escapeHTML(label)}
                </div>
            `;
        },
        config: {
            page: {
                /**
                 * @param {string} backgroundColor
                 * @param {string} innerHTML
                 * @returns {string}
                 */
                createForm: (backgroundColor, innerHTML) => {
                    return `
                        <form
                            id="downloader-page-config-form"
                            class="menu-content"
                            style="padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
                        >
                            ${innerHTML}
                        </form>
                    `;
                },
            },
            post: {
                /**
                 * @param {string} postId
                 * @param {string} backgroundColor
                 * @param {string} innerHTML
                 * @returns {string}
                 */
                createForm: (postId, backgroundColor, innerHTML) => {
                    return `
                        <form
                            id="download-config-form-${h.escapeHTML(postId)}"
                            class="menu-content"
                            style="user-select: none; padding: 5px 10px; background: ${backgroundColor};width:300px; min-width: 300px;"
                        >
                            ${innerHTML}
                        </form>
                    `;
                },
                /**
                 * @param {string} currentValue
                 * @param {string} postId
                 * @param {string} backgroundColor
                 * @param {string} placeholder
                 * @returns {string}
                 */
                createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => {
                    return `
                        <div class="menu-row">
                            <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; color: #00E5FF;">
                                File / Archive Name
                            </div>
                            <input
                                id="filename-input-${h.escapeHTML(postId)}"
                                type="text"
                                style="background: ${backgroundColor};"
                                class="archive-name input"
                                autocomplete="off"
                                name="keywords"
                                placeholder="${h.escapeHTML(placeholder)}"
                                aria-label="Search"
                                value="${h.escapeHTML(currentValue)}"
                            />
                        </div>
                    `;
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createZippedCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-zipped`, 'Zipped', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createFlattenCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-flatten`, 'Flatten', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createSkipDownloadCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-download`, 'Skip Download', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createVerifyBunkrLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, 'Verify Bunkr Links', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createGenerateLinksCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-links`, 'Generate Links', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createGenerateLogCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-generate-log`, 'Generate Log', checked);
                },
                /**
                 * @param {string} postId
                 * @param {boolean} checked
                 * @returns {string}
                 */
                createSkipDuplicatesCheckbox: (postId, checked) => {
                    return ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, 'Skip Duplicates', checked);
                },
                /**
                 * @param {Array<object>} hosts
                 * @param {function(Array<object>): number} getTotalDownloadableResourcesCB
                 * @returns {string}
                 */
                createFilterLabel: (hosts, getTotalDownloadableResourcesCB) => {
                    return `
                        <div style="font-weight: bold; margin-top:5px; margin-bottom: 8px; margin-left: 8px; color: #00E5FF;">Filter <span id="filtered-count">(${getTotalDownloadableResourcesCB(
                        hosts,
                    )})</span></div>
                    `;
                },
                /**
                 * @param {string} postId
                 * @returns {string}
                 */
                createToggleAllCheckbox: postId => {
                    return ui.forms.createCheckbox(`settings-toggle-all-hosts-${postId}`, settings.ui.checkboxes.toggleAllCheckboxLabel, true);
                },
                /**
                 * @param {string} postId
                 * @param {object} host
                 * @returns {string}
                 */
                createHostCheckbox: (postId, host) => {
                    const title = `${host.name} ${host.category}`;
                    return ui.forms.createCheckbox(`downloader-host-${host.id}-${postId}`, `${title} (${host.resources.length})`, host.enabled);
                },
                /**
                 * @param {string} postId
                 * @param {string} filterLabel
                 * @param {string} hostsHtml
                 * @param {boolean} createToggleAllCheckbox
                 * @returns {string}
                 */
                createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAllCheckbox) => {
                    return `
                        <div>
                            ${filterLabel}
                            ${createToggleAllCheckbox ? ui.forms.config.post.createToggleAllCheckbox(postId) : ''}
                            ${hostsHtml}
                        </div>
                    `;
                },
                /**
                 * @param {object} parsedPost
                 * @param {Array<object>} parsedHosts
                 * @param {string} defaultFilename
                 * @param {object} currentSettings
                 * @param {function(object): void} onSubmitFormCB
                 * @param {function(Array<object>): number} totalDownloadableResourcesForPostCB
                 * @param {HTMLAnchorElement} btnDownloadPost
                 */
                createPostConfigForm: (
                    parsedPost,
                    parsedHosts,
                    defaultFilename,
                    currentSettings,
                    onSubmitFormCB,
                    totalDownloadableResourcesForPostCB,
                    btnDownloadPost,
                ) => {
                    const { postId } = parsedPost;
                    const color = ui.getTooltipBackgroundColor();

                    const customFilename = currentSettings.output.find(o => o.postId === postId)?.value || '';

                    let hostsHtml = '<div>';
                    parsedHosts.forEach(host => (hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host)));
                    hostsHtml += '</div>';

                    const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB);

                    const settingsHeading = `
                        <div class="menu-row">
                            <div style="font-weight: bold; margin-top:3px; margin-bottom: 4px; color: #00E5FF;">
                                Settings
                            </div>
                        </div>
                    `;

                    // Filter out nulls for FF compatibility and settings toggles
                    const formHtml = [
                        isFF ? ui.forms.config.post.createFilenameInput(customFilename, postId, color, defaultFilename) : null,
                        settingsHeading,
                        /* v1.12.1 (2e-F14): rendered on Firefox too — the
                         * per-file blob-URL GM_download arm makes the toggle
                         * meaningful there now (the always-zip behavior was the
                         * lost lineage shape). */
                        ui.forms.config.post.createZippedCheckbox(postId, currentSettings.zipped),
                        ui.forms.config.post.createFlattenCheckbox(postId, currentSettings.flatten),
                        ui.forms.config.post.createSkipDuplicatesCheckbox(postId, currentSettings.skipDuplicates),
                        ui.forms.config.post.createGenerateLinksCheckbox(postId, currentSettings.generateLinks),
                        ui.forms.config.post.createGenerateLogCheckbox(postId, currentSettings.generateLog),
                        ui.forms.config.post.createSkipDownloadCheckbox(postId, currentSettings.skipDownload),
                        ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, currentSettings.verifyBunkrLinks),
                        ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
                        ui.forms.createRow(
                            '<a href="#download-page" style="color: #00E5FF; font-weight: bold"><i class="fa fa-arrow-up"></i> Show Download Page Button</a>',
                        ),
                    ].filter(c => c !== null).join('');

                    const configForm = ui.forms.config.post.createForm(postId, color, formHtml);

                    ui.tooltip(btnDownloadPost, configForm, {
                        onShown: instance => {
                            const inputEl = h.element(`#filename-input-${postId}`);
                            if (inputEl) {
                                inputEl.addEventListener('input', e => {
                                    const value = e.target.value;
                                    const o = currentSettings.output.find(o => o.postId === postId);
                                    if (o) {
                                        o.value = value;
                                    } else {
                                        currentSettings.output.push({
                                            postId,
                                            value,
                                        });
                                    }
                                });
                            }

                            let prevSettings = JSON.parse(JSON.stringify(currentSettings));

                            const setPrevSettings = settingsToSet => {
                                prevSettings = JSON.parse(JSON.stringify(settingsToSet));
                            };

                            let updateSettings = true;

                            // Event listener for "Skip Download" checkbox
                            h.element(`#settings-${postId}-skip-download`)?.addEventListener('change', e => {
                                const checked = e.target.checked;
                                currentSettings.skipDownload = checked;

                                // Adjust dependent settings
                                currentSettings.flatten = checked ? false : prevSettings.flatten;
                                currentSettings.skipDuplicates = checked ? false : prevSettings.skipDuplicates;
                                currentSettings.generateLinks = checked ? true : prevSettings.generateLinks;

                                updateSettings = false; // Prevent immediate update of prevSettings for cascading changes

                                const flattenEl = h.element(`#settings-${postId}-flatten`);
                                if (flattenEl) {
                                    flattenEl.checked = currentSettings.flatten;
                                    flattenEl.disabled = checked;
                                }

                                const skipDuplicatesEl = h.element(`#settings-${postId}-skip-duplicates`);
                                if (skipDuplicatesEl) {
                                    skipDuplicatesEl.checked = currentSettings.skipDuplicates;
                                    skipDuplicatesEl.disabled = checked;
                                }

                                const generateLinksEl = h.element(`#settings-${postId}-generate-links`);
                                if (generateLinksEl) {
                                    generateLinksEl.checked = currentSettings.generateLinks;
                                    generateLinksEl.disabled = checked;
                                }

                                setTimeout(() => (updateSettings = true), 100); // Re-enable updating after a short delay
                            });

                            h.element(`#settings-${postId}-verify-bunkr-links`)?.addEventListener('change', e => {
                                currentSettings.verifyBunkrLinks = e.target.checked;
                            });

                            if (!isFF) {
                                h.element(`#settings-${postId}-zipped`)?.addEventListener('change', e => {
                                    currentSettings.zipped = e.target.checked;
                                });
                            }

                            h.element(`#settings-${postId}-generate-links`)?.addEventListener('change', e => {
                                currentSettings.generateLinks = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-generate-log`)?.addEventListener('change', e => {
                                currentSettings.generateLog = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-flatten`)?.addEventListener('change', e => {
                                currentSettings.flatten = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#settings-${postId}-skip-duplicates`)?.addEventListener('change', e => {
                                currentSettings.skipDuplicates = e.target.checked;
                                if (updateSettings) {
                                    setPrevSettings(currentSettings);
                                }
                            });

                            h.element(`#download-config-form-${postId}`)?.addEventListener('submit', async e => {
                                e.preventDefault();
                                onSubmitFormCB({ tippyInstance: instance });
                            });

                            if (parsedHosts.length > 1) {
                                h.element(`#settings-toggle-all-hosts-${postId}`)?.addEventListener('change', async e => {
                                    e.preventDefault();
                                    const checked = e.target.checked;
                                    const hostCheckboxes = parsedHosts.flatMap(host => h.element(`#downloader-host-${host.id}-${postId}`));
                                    // Use filter/forEach instead of click() for better direct control
                                    hostCheckboxes.forEach(checkbox => {
                                        if (checkbox.checked !== checked) {
                                            checkbox.checked = checked;
                                            checkbox.dispatchEvent(new Event('change')); // Manually dispatch change event
                                        }
                                    });
                                });
                            }

                            parsedHosts.forEach(host => {
                                h.element(`#downloader-host-${host.id}-${postId}`)?.addEventListener('change', e => {
                                    host.enabled = e.target.checked;
                                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                                    const filteredCountEl = h.element('#filtered-count');
                                    if (filteredCountEl) filteredCountEl.textContent = `(${filteredCount})`;

                                    if (parsedHosts.length > 0) {
                                        const checkedLength = parsedHosts
                                            .filter(h => h.enabled)
                                            .length;

                                        const totalResources = parsedHosts.reduce((acc, currentHost) => acc + currentHost.resources.length, 0);

                                        const totalDownloadableResources = parsedHosts
                                            .filter(currentHost => currentHost.enabled && currentHost.resources.length)
                                            .reduce((acc, currentHost) => acc + currentHost.resources.length, 0);

                                        btnDownloadPost.textContent = `🡳 Download (${totalDownloadableResources}/${totalResources})`;

                                        if (parsedHosts.length > 1) {
                                            const toggleAllHostsCheckbox = h.element(`#settings-toggle-all-hosts-${postId}`);
                                            if (toggleAllHostsCheckbox) {
                                                toggleAllHostsCheckbox.checked = checkedLength === parsedHosts.length;
                                            }
                                        }
                                    }
                                });
                            });
                        },
                    });
                },
            },
        },
    },
};

const init = {
    injectCustomStyles: () => {
        // Tippy transparent theme.
        const styleEl = document.createElement('style');
        styleEl.textContent = styles.tippy.theme + '\n.menu-content{font-family:"JetBrains Mono",monospace;transition:all 150ms ease-in-out;box-shadow:0 0 40px rgba(0,229,255,0.15),0 8px 32px rgba(10,19,26,0.4);}';
        document.head.append(styleEl);

        const customStyles = document.createElement('style');
        // Margins classes
        const marginClasses = [];

        for (let i = 1; i <= 15; i++) {
            marginClasses.push(`.m-l-${i} {margin-left: ${i}px;}`);
            marginClasses.push(`.m-t-${i} {margin-top: ${i}px;}`);
        }

        customStyles.textContent = marginClasses.join('\n');
        document.head.append(customStyles);
    },
};

// Holds the posts that are processing downloads.
let processing = [];

// v1.9.1 (suite v1.3.0): setProcessing() was invoked at three call sites but
// never defined anywhere in the lineage — every download run threw a
// ReferenceError immediately after URL resolution, and the beforeunload
// in-flight guard never saw the flag flip. Restored as the minimal per-post
// flag keeper the read side (`processing.find(p => p.processing)`) expects.
function setProcessing(isProcessing, postId) {
    let entry = processing.find(p => p.postId === postId);
    if (!entry) {
        entry = { postId, processing: false };
        processing.push(entry);
    }
    entry.processing = Boolean(isProcessing);
}

/* ════════════════════════════════════════════════════════════════════════════
   v1.12.0 (WO-01 round 6) — THE LINEAGE MACHINERY (segment 1 of the
   XenForoPostDownloader v3.23 restoration). Everything between this banner and
   the hosts[] table below is ported from the operator-provided lineage source
   (gup/forumspp-lineage.js, @namespace github.com/SkyCloudDev), rewritten to
   the canon's census laws: every catch is non-empty and logged (G11), every
   registry is FIFO-bounded (cache census), the two page-lifetime service
   intervals are polling-census ledgered, and no empty TODO survives.
   ════════════════════════════════════════════════════════════════════════════ */

/* Bounded hint registry factory — the lineage's hint Maps were unbounded
 * (cache-census violation); every one below is FIFO-capped instead. */
const hintMap = (cap = 2000) => {
    const map = new Map();
    return {
        get: k => map.get(k),
        set: (k, v) => {
            if (map.has(k)) { map.set(k, v); return; }
            map.set(k, v);
            while (map.size > cap) {
                const oldest = map.keys().next().value;
                if (oldest === undefined) break;
                map.delete(oldest);
            }
        },
        has: k => map.has(k),
        get size() { return map.size; },
    };
};

const gofileNameById = hintMap(4000);
const gofileNameByUrl = hintMap(4000);
const cyberdropNameBySlug = hintMap(4000);
const cyberdropNameByUrl = hintMap(4000);
const bunkrNameByUrl = hintMap(4000);
const filesterNameBySlug = hintMap(4000);
const filesterNameByUrl = hintMap(4000);
const filesterSlugByUrl = hintMap(4000);
const filesterRefByUrl = hintMap(4000);
const goonboxThumbByUrl = hintMap(1000);
/* Turbo: signed turbocdn URL -> turbo id (needed for re-sign when a signed
 * URL stalls mid-download — the segment-2 watchdog consumes this). */
const turboIdBySignedUrl = hintMap(4000);

/* v1.12.0 (round 6): the shared kernel-first GM transport — kernel gmFetch
 * when the singleton is present, the kernel-less fallback otherwise (the
 * boundary-smoke contract; every dispatch hard-timeout bounded). Resolves the
 * raw GM response ({status, responseText, ...}); rejects typed NetError kinds. */
const fppKernelLessGmFetch = (u, o) => {
    if (typeof GM_xmlhttpRequest !== 'function') return Promise.reject(Object.assign(new Error('kernel-less transport unavailable'), { kind: 'gm-unavailable' }));
    o = o || {};
    return new Promise((res, rej) => {
        let s = false;
        const d = (fn, v) => { if (!s) { s = true; fn(v); } };
        GM_xmlhttpRequest({
            method: o.method || 'GET',
            url: u,
            timeout: Math.max(1, o.timeout || 15000),
            onload: (r) => d(res, r),
            onerror: () => d(rej, Object.assign(new Error('network error'), { kind: 'transport' })),
            ontimeout: () => d(rej, Object.assign(new Error('gmFetch timeout'), { kind: 'timeout' })),
            onabort: () => d(rej, Object.assign(new Error('aborted'), { kind: 'abort' })),
        });
    });
};
const fppGmFetch = (u, o) => (typeof __4NDR0_NET_API__ === 'undefined' ? fppKernelLessGmFetch : __4NDR0_NET_API__.gmFetch)(u, o);

const xfpdSleepMs = ms => new Promise(r => setTimeout(r, ms));
const xfpdJitterMs = (minMs, maxMs) => {
    const lo = Math.min(minMs, maxMs);
    const hi = Math.max(minMs, maxMs);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
};

/* Tab-handle closer — Tampermonkey can return either a Tab object or a
 * Promise<Tab> from GM_openInTab; both close through this. */
const xfpdCloseTabHandle = tabOrPromise => {
    try {
        if (tabOrPromise && typeof tabOrPromise.close === 'function') {
            tabOrPromise.close();
            return;
        }
        if (tabOrPromise && typeof tabOrPromise.then === 'function') {
            tabOrPromise.then(tab => { try { tab?.close?.(); } catch (e) { console.debug('[Forums++] deferred tab close rejected:', e && e.message); } }).catch(e => { console.debug('[Forums++] deferred tab handle rejected (already settled):', e && e.message); });
        }
    } catch (e) {
        console.debug('[Forums++] tab close rejected:', e && e.message);
    }
};

/* ── Turbo/saint2 sign API (lineage L2816-2893) ──────────────────────────
 * turbo.cr (and its saint2 migration) sign their CDN URLs through
 * <origin>/api/sign?v=<id> (legacy <origin>/sign?v=). 5 s timeout, 2 retries
 * with 700-1400 ms jitter — avoids the rare ~50 s stalls on the sign route.
 * The fn= parameter preserves the original filename on the CDN download. */
const XFPD_TURBO_SIGN_TIMEOUT_MS = 5000;
const XFPD_TURBO_SIGN_RETRIES = 2;
const XFPD_TURBO_SIGN_JITTER_MIN_MS = 700;
const XFPD_TURBO_SIGN_JITTER_MAX_MS = 1400;

const xfpdGmGetText = (getUrl, headers, timeoutMs) =>
    fppGmFetch(String(getUrl), { method: 'GET', timeout: Number(timeoutMs) || 15000, headers: headers || {}, checkStatus: false })
        .then(r => ({ ok: true, status: r.status || 0, text: String(r.responseText || r.response || '') }))
        .catch(e => {
            console.debug('[Forums++] turbo sign transport rejected:', e && (e.message || e.kind));
            return { ok: false, status: 0, text: '' };
        });

const xfpdTurboOrigin = turboUrl => {
    try {
        const u = new URL(String(turboUrl));
        if (/(^|\.)turbo\.cr$/i.test(u.hostname)) return 'https://turbo.cr';
        if (/(^|\.)saint2\.(su|pk|cr)$/i.test(u.hostname)) return u.origin;
    } catch (e) {
        console.debug('[Forums++] turbo origin derivation rejected (turbo.cr default):', e && e.message);
    }
    return 'https://turbo.cr';
};

const xfpdTurboFetchSignJsonWithTimeout = async (turboId, refererUrl) => {
    const id = String(turboId || '').trim();
    if (!id) return null;

    const origin = xfpdTurboOrigin(refererUrl);
    const embedUrl = String(refererUrl || `${origin}/embed/${id}`);
    const headers = {
        Accept: 'application/json, text/plain, */*',
        Referer: embedUrl,
    };

    const signUrls = [
        `${origin}/api/sign?v=${encodeURIComponent(id)}`,
        `${origin}/sign?v=${encodeURIComponent(id)}`, // legacy fallback
    ];

    for (let attempt = 0; attempt <= XFPD_TURBO_SIGN_RETRIES; attempt++) {
        for (const signUrl of signUrls) {
            const r = await xfpdGmGetText(signUrl, headers, XFPD_TURBO_SIGN_TIMEOUT_MS);
            if (!r || !r.ok || r.status !== 200 || !r.text) continue;

            let j = null;
            try { j = JSON.parse(r.text); } catch (e) { j = null; }
            if (!j || !j.url) continue;

            const ok = (j.success === undefined) ? true : !!j.success;
            if (ok) return j;
        }
        if (attempt < XFPD_TURBO_SIGN_RETRIES) {
            await xfpdSleepMs(xfpdJitterMs(XFPD_TURBO_SIGN_JITTER_MIN_MS, XFPD_TURBO_SIGN_JITTER_MAX_MS));
        }
    }
    return null;
};

const xfpdTurboSignUrlWithTimeout = async (turboId, refererUrl, nameHint) => {
    const j = await xfpdTurboFetchSignJsonWithTimeout(turboId, refererUrl);
    if (!j || !j.url) return null;

    let signed = j.url;
    const originalName = j.original_filename || nameHint;

    // Preserve filename for the CDN download (used later for saveAs).
    if (signed && originalName && !/[?&]fn=/.test(String(signed))) {
        const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
        signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
    }
    return signed;
};

/* ── Goonbox same-origin API bridge (lineage L598-1071) ──────────────────
 * Goonbox's API sits behind Cloudflare and needs first-party cookies; a
 * GM_xmlhttpRequest from the forum tab is third-party and 403s on Firefox.
 * One inactive marker-gated goonbox.cr tab (this script also runs there via
 * the @match) serves the API same-origin; the two tabs talk over GM storage.
 * Direct request first — the bridge only engages on 403/empty/unparseable. */
const GOONBOX_ORIGIN = 'https://goonbox.cr';

const GBX_K_READY = 'xfpd_gbx_ready';
const GBX_K_REQ = 'xfpd_gbx_req';
const GBX_K_RES = 'xfpd_gbx_res';

const GBX_POLL_MS = 150;
const GBX_HEARTBEAT_MS = 1000;
const GBX_READY_TIMEOUT_MS = 20000;
const GBX_REQ_TIMEOUT_MS = 25000;
// Close a few seconds after the *last* request — a post usually resolves
// several Goonbox links, and a tab per link would be slow and conspicuous.
const GBX_IDLE_CLOSE_MS = 5000;
// Cloudflare may still be settling when the helper tab first runs.
const GBX_FETCH_ATTEMPTS = 3;
const GBX_FETCH_RETRY_MS = 800;

// The helper tab opens on a REAL Goonbox page with this marker appended: the
// marker gates the worker (a user browsing goonbox.cr never becomes a bridge)
// and the bare-origin form never injects on Firefox+Tampermonkey (b08 lesson).
const GBX_MARKER_KEY = 'xfpd_gbx';
const GBX_MARKER_VAL = '1';

// Only these two API shapes may cross the bridge — the helper builds the final
// URL itself and never accepts full URLs, so GM storage cannot turn a
// cookie-bearing tab into a general-purpose proxy. Enforced on both sides.
const GBX_ALLOWED_PATHS = [
    /^\/api\/images\/[A-Za-z0-9_-]{1,64}$/,
    /^\/api\/albums\/[A-Za-z0-9._~-]{1,128}\/images\?page=\d{1,4}$/,
];

const goonboxBridgePathAllowed = p => {
    const s = String(p || '');
    return GBX_ALLOWED_PATHS.some(rx => rx.test(s));
};

/* Cross-tab delivery: GM storage reads are not reliably cross-tab (per-tab
 * cache), so GM_addValueChangeListener mirrors feed the polled reads. Both
 * paths dedupe naturally (request id / newest heartbeat). */
const xfpdAddValueChangeListener =
    (typeof GM_addValueChangeListener === 'function' ? GM_addValueChangeListener : null) ||
    (typeof window.GM_addValueChangeListener === 'function' ? window.GM_addValueChangeListener.bind(window) : null);

let gbxReadyMirror = 0;
let gbxResMirror = '';
let gbxListenersBound = false;

const gbxBindListeners = () => {
    if (gbxListenersBound || !xfpdAddValueChangeListener) return;
    gbxListenersBound = true;
    try {
        xfpdAddValueChangeListener(GBX_K_READY, (name, oldV, newV) => {
            gbxReadyMirror = Number(newV || 0) || 0;
        });
    } catch (e) { console.debug('[Forums++] gbx ready listener rejected:', e && e.message); }
    try {
        xfpdAddValueChangeListener(GBX_K_RES, (name, oldV, newV) => {
            gbxResMirror = String(newV || '');
        });
    } catch (e) { console.debug('[Forums++] gbx res listener rejected:', e && e.message); }
};

const gbxGet = (key, dflt = '') => {
    try { return GM_getValue(key, dflt); } catch (e) { return dflt; }
};

const gbxSet = (key, val) => {
    try { GM_setValue(key, val); } catch (e) { console.debug('[Forums++] gbx storage write rejected:', e && e.message); }
};

// Requester side (runs in the forum tab).
let gbxTabHandle = null;
let gbxIdleTimer = null;
let gbxChain = Promise.resolve();
let gbxSeq = 0;
// Circuit breaker: if the helper never announces itself (a CF interstitial
// that needs a human), back off 120 s instead of paying the timeout per link.
let gbxUnavailableUntil = 0;
let gbxInFlight = 0;
const GBX_BREAKER_MS = 120000;

const gbxBridgeAlive = () => {
    const polled = Number(gbxGet(GBX_K_READY, 0) || 0) || 0;
    const t = Math.max(polled, gbxReadyMirror);
    return t > 0 && (Date.now() - t) < (GBX_HEARTBEAT_MS * 5);
};

const gbxCloseTab = () => {
    try { if (gbxIdleTimer) clearTimeout(gbxIdleTimer); } catch (e) { console.debug('[Forums++] gbx idle timer clear rejected:', e && e.message); }
    gbxIdleTimer = null;
    xfpdCloseTabHandle(gbxTabHandle);
    gbxTabHandle = null;
    gbxSet(GBX_K_READY, 0);
    gbxSet(GBX_K_REQ, '');
    gbxSet(GBX_K_RES, '');
};

// The idle timer must be cancelled when a request STARTS, not only re-armed
// when one finishes — a mid-request close returned null in b08.
const gbxCancelIdleTimer = () => {
    try { if (gbxIdleTimer) clearTimeout(gbxIdleTimer); } catch (e) { console.debug('[Forums++] gbx idle timer cancel rejected:', e && e.message); }
    gbxIdleTimer = null;
};

const gbxMaybeArmIdleTimer = () => {
    gbxCancelIdleTimer();
    if (gbxInFlight > 0) return;
    gbxIdleTimer = setTimeout(() => { gbxCloseTab(); }, GBX_IDLE_CLOSE_MS);
};

const gbxHelperUrl = pageUrl => {
    const base = String(pageUrl || '').trim();
    try {
        const u = new URL(base);
        if (/(^|\.)goonbox\.cr$/i.test(u.hostname)) {
            u.searchParams.set(GBX_MARKER_KEY, GBX_MARKER_VAL);
            return u.href;
        }
    } catch (e) { console.debug('[Forums++] gbx helper URL parse rejected:', e && e.message); }
    return `${GOONBOX_ORIGIN}/?${GBX_MARKER_KEY}=${GBX_MARKER_VAL}`;
};

const gbxOpenTab = pageUrl => {
    gbxSet(GBX_K_READY, 0);
    try {
        return GM_openInTab(gbxHelperUrl(pageUrl), { active: false, insert: true, setParent: true });
    } catch (e) {
        console.debug('[Forums++] gbx helper tab open rejected:', e && e.message);
        return null;
    }
};

const gbxAwaitReady = async () => {
    const deadline = Date.now() + GBX_READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (gbxBridgeAlive()) return true;
        await xfpdSleepMs(GBX_POLL_MS);
    }
    return false;
};

const gbxEnsureTab = async pageUrl => {
    gbxBindListeners(); // before the first gbxBridgeAlive() read.

    if (gbxBridgeAlive()) {
        gbxUnavailableUntil = 0;
        return true;
    }
    if (Date.now() < gbxUnavailableUntil) return false;

    if (!gbxTabHandle) {
        gbxTabHandle = gbxOpenTab(pageUrl);
        if (!gbxTabHandle) return false;
    }

    if (await gbxAwaitReady()) {
        gbxUnavailableUntil = 0;
        return true;
    }

    // No heartbeat: the tab may never have had the script injected — discard
    // it and open a fresh one exactly once (the Firefox+TM lesson).
    xfpdCloseTabHandle(gbxTabHandle);
    gbxTabHandle = gbxOpenTab(pageUrl);
    if (gbxTabHandle && await gbxAwaitReady()) {
        gbxUnavailableUntil = 0;
        return true;
    }

    // Still nothing: most likely a CF interstitial that needs a human. Leave
    // the tab open (it is where they would solve it) and back off.
    gbxUnavailableUntil = Date.now() + GBX_BREAKER_MS;
    return false;
};

// One API path through the helper tab. Serialized: exactly one bridge request
// in flight at a time keeps the handshake race-free and the calls sequential.
const goonboxBridgeGet = (path, pageUrl) => {
    const run = async () => {
        if (!goonboxBridgePathAllowed(path)) return null;
        if (!(await gbxEnsureTab(pageUrl))) return null;

        const id = `${Date.now()}_${++gbxSeq}`;
        gbxResMirror = '';
        gbxSet(GBX_K_RES, '');
        gbxSet(GBX_K_REQ, JSON.stringify({ id, path, t: Date.now() }));

        const deadline = Date.now() + GBX_REQ_TIMEOUT_MS;
        let notReadyLogged = false; // the parse throw fires every 150 ms until the helper answers — log it once per request, not per tick
        while (Date.now() < deadline) {
            await xfpdSleepMs(GBX_POLL_MS);

            // Listener mirror first — on Firefox+Tampermonkey the polled read
            // never updates.
            let res = null;
            for (const raw of [gbxResMirror, gbxGet(GBX_K_RES, '')]) {
                try {
                    const p = JSON.parse(String(raw || ''));
                    if (p && p.id === id) { res = p; break; }
                } catch (e) {
                    if (!notReadyLogged) {
                        notReadyLogged = true;
                        console.debug('[Forums++] gbx bridge response not ready yet (polling until the helper answers):', e && e.message);
                    }
                }
            }
            if (res) return res;

            // Tab closed or crashed mid-request.
            if (!gbxBridgeAlive()) break;
        }
        return null;
    };

    // Count in, cancel any pending close, run, count out, re-arm only when
    // nothing else is outstanding. Incrementing here (not inside run) is
    // deliberate: the tab must survive until the chain drains.
    gbxInFlight++;
    gbxCancelIdleTimer();

    const settle = () => {
        gbxInFlight = Math.max(0, gbxInFlight - 1);
        gbxMaybeArmIdleTimer();
    };

    gbxChain = gbxChain.catch(e => { console.debug('[Forums++] gbx chain step rejected (chain continues):', e && e.message); }).then(run);
    const p = gbxChain;
    p.then(settle, settle);
    return p;
};

// Debug switch: force every Goonbox API call down the bridge path from the
// devtools console: localStorage.setItem('xfpd_gbx_force_bridge', 'true').
// Off unless enabled; enabling only ever ADDS an attempt (a failed bridge
// still falls through to the direct result).
const GBX_K_FORCE = 'xfpd_gbx_force_bridge';

const gbxForceEnabled = () => {
    try {
        const v = localStorage.getItem(GBX_K_FORCE);
        if (v !== null && String(v).toLowerCase() === 'true') return true;
    } catch (e) { console.debug('[Forums++] force-flag read rejected:', e && e.message); }
    try {
        const v = gbxGet(GBX_K_FORCE, false);
        if (v === true || String(v).toLowerCase() === 'true') return true;
    } catch (e) { console.debug('[Forums++] force-flag GM read rejected:', e && e.message); }
    return false;
};

// One Goonbox API call: direct first, bridge second. Parsed JSON or null.
const goonboxApiJson = async (apiHttp, path, pageUrl, postId) => {
    const referer = pageUrl;
    const say = msg => { log.host.info(postId, msg, 'goonbox.cr'); };
    const parse = s => {
        try {
            const j = JSON.parse(String(s || ''));
            return (j && typeof j === 'object') ? j : null;
        } catch (e) { return null; }
    };

    let status = 0;
    let source = '';
    try {
        const r = await apiHttp.get(
            `${GOONBOX_ORIGIN}${path}`,
            {},
            { Referer: referer || `${GOONBOX_ORIGIN}/`, Accept: 'application/json' },
            'text',
        );
        status = Number((r && r.status) || 0) || 0;
        source = String((r && r.source) || '');
    } catch (e) {
        console.debug('[Forums++] goonbox direct transport rejected:', e && e.message);
    }

    const direct = (status && status < 400) ? parse(source) : null;
    const forced = gbxForceEnabled();

    if (direct && !forced) return direct;

    if (forced) {
        say(`::Bridge forced (debug flag)::: ${path}`);
    } else {
        // 403 from Cloudflare, an empty body, or an HTML challenge page all
        // mean the same thing here — retry same-origin rather than tell apart.
        say(`::API direct failed (${status || 'no response'}) -> bridge::: ${path}`);
    }

    const viaBridge = await goonboxBridgeGet(path, pageUrl);

    if (viaBridge && viaBridge.ok) {
        const j = parse(viaBridge.body);
        if (j) {
            say(`::Bridge OK (${viaBridge.status})::: ${path}`);
            return j;
        }
        say(`::Bridge returned ${viaBridge.status} but body was not JSON::: ${path}`);
    } else {
        say(`::Bridge failed (${viaBridge ? viaBridge.status : 'no response'})::: ${path}`);
    }

    // Forcing must never break a working download: fall back to the direct result.
    if (direct) return direct;

    return null;
};

// Helper-tab side (runs only on goonbox.cr, marker-gated).
const gbxIsHelperTab = () => {
    try {
        return new URLSearchParams(location.search).get(GBX_MARKER_KEY) === GBX_MARKER_VAL;
    } catch (e) {
        return false;
    }
};

const goonboxBridgeServe = () => {
    if (!gbxIsHelperTab()) return;

    let lastId = '';
    let busy = false;

    const beat = () => gbxSet(GBX_K_READY, Date.now());
    beat();
    // Page-lifetime service heartbeat (polling-census ledgered — round 6).
    const heartbeatInterval = setInterval(beat, GBX_HEARTBEAT_MS);
    window.addEventListener('beforeunload', () => { try { clearInterval(heartbeatInterval); gbxSet(GBX_K_READY, 0); } catch (e) { console.debug('[Forums++] gbx heartbeat teardown rejected:', e && e.message); } }, { once: true });

    const handle = async raw => {
        if (busy) return;

        let req = null;
        try { req = JSON.parse(String(raw || '')); } catch (e) { req = null; }
        if (!req || !req.id || req.id === lastId) return;

        lastId = req.id;
        busy = true;

        const reply = payload => {
            try { gbxSet(GBX_K_RES, JSON.stringify({ id: req.id, ...payload })); } catch (e) { console.debug('[Forums++] gbx reply write rejected:', e && e.message); }
        };

        try {
            // Re-check here too: this tab holds the cookies — the restriction
            // only protects anything where it is enforced.
            if (!goonboxBridgePathAllowed(req.path)) {
                reply({ ok: false, status: 0, body: '' });
                return;
            }

            // Cloudflare may still be settling in a freshly loaded tab, so
            // retry a few times while the answer still looks like a challenge
            // or a transport failure — a clean 404 is a real answer.
            let last = { ok: false, status: 0, body: '' };
            for (let attempt = 1; attempt <= GBX_FETCH_ATTEMPTS; attempt++) {
                try {
                    const r = await fetch(`${GOONBOX_ORIGIN}${req.path}`, {
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    });
                    const body = await r.text();
                    last = { ok: !!r.ok, status: Number(r.status) || 0, body };
                } catch (e) {
                    console.debug('[Forums++] gbx helper fetch rejected:', e && e.message);
                    last = { ok: false, status: 0, body: '' };
                }

                let parsed = null;
                try { parsed = JSON.parse(String(last.body || '')); } catch (e) { parsed = null; }
                if (last.ok && parsed && typeof parsed === 'object') break;
                if (last.status && last.status !== 403 && last.status !== 429 && last.status < 500) break;

                if (attempt < GBX_FETCH_ATTEMPTS) await xfpdSleepMs(GBX_FETCH_RETRY_MS);
            }

            reply(last);
        } catch (e) {
            console.debug('[Forums++] gbx helper serve rejected:', e && e.message);
            reply({ ok: false, status: 0, body: '' });
        } finally {
            busy = false;
        }
    };

    // Listener first (Firefox+TM poll blindness); polling retained — `lastId`
    // makes double-delivery a no-op. Page-lifetime service poll (ledgered).
    if (xfpdAddValueChangeListener) {
        try {
            xfpdAddValueChangeListener(GBX_K_REQ, (name, oldV, newV) => { handle(newV); });
        } catch (e) { console.debug('[Forums++] gbx req listener rejected:', e && e.message); }
    }
    const pollInterval = setInterval(() => { handle(gbxGet(GBX_K_REQ, '')); }, GBX_POLL_MS);
    window.addEventListener('beforeunload', () => { try { clearInterval(pollInterval); } catch (e) { console.debug('[Forums++] gbx poll teardown rejected:', e && e.message); } }, { once: true });
};

goonboxBridgeServe(); // no-op unless this tab is the marker-gated helper.

/* ── Bunkr/Cloudflare machinery (lineage L1073-1385) ─────────────────────
 * Best-effort warm-up tabs let the browser complete JS-only CF interstitials
 * (NOT interactive Turnstile — those still need a human). Fast-fail + a
 * 60-minute domain blacklist keep a dead TLD from stalling every link. */
const BUNKR_CF_WARMUP_MS = 6000;
const BUNKR_CF_MAX_RETRIES = 3;
const BUNKR_CF_WARMUP_ACTIVE_TAB = false;
const BUNKR_CF_WARMUP_COOLDOWN_MS = 15000;
const BUNKR_FASTFAIL_ON_403 = true;
const BUNKR_DOMAIN_BLACKLIST_MS = 60 * 60 * 1000;
const xfpdBunkrDomainBanUntil = hintMap(64);

const xfpdBunkrNormalizeBase = baseOrUrl => {
    try {
        const u = new URL(String(baseOrUrl || ''));
        return u.origin;
    } catch (e) {
        return String(baseOrUrl || '').replace(/\/+$/, '');
    }
};

const xfpdBunkrIsBaseBanned = baseOrUrl => {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        const until = xfpdBunkrDomainBanUntil.get(base);
        if (!until) return false;
        if (Date.now() >= until) {
            // hintMap has no delete; a stale entry simply expires by time.
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

const xfpdBunkrBanBase = baseOrUrl => {
    try {
        const base = xfpdBunkrNormalizeBase(baseOrUrl);
        // Never blacklist the last-resort domain.
        if (base === 'https://bunkr.cr') return;
        xfpdBunkrDomainBanUntil.set(base, Date.now() + BUNKR_DOMAIN_BLACKLIST_MS);
    } catch (e) { console.debug('[Forums++] bunkr ban rejected:', e && e.message); }
};

const xfpdBunkrFilterBases = bases => {
    const uniq = [];
    const seen = new Set();
    for (const b of (bases || [])) {
        const base = xfpdBunkrNormalizeBase(b);
        if (!base || seen.has(base)) continue;
        seen.add(base);
        uniq.push(base);
    }
    const filtered = uniq.filter(b => b === 'https://bunkr.cr' || !xfpdBunkrIsBaseBanned(b));
    return filtered.length ? filtered : uniq;
};

const xfpdLooksLikeCfChallenge = (source, dom) => {
    try {
        const s = String(source || '');
        const head = s.slice(0, 8000).toLowerCase();

        const title = String(dom?.querySelector?.('title')?.textContent || '').trim();

        if (title && /just a moment|attention required|checking your browser/i.test(title)) return true;
        if (title && /cloudflare/i.test(title)) return true;

        if (head.includes('cdn-cgi/challenge-platform')) return true;
        if (head.includes('challenges.cloudflare.com')) return true;
        if (head.includes('cf-browser-verification')) return true;
        if (head.includes('checking your browser')) return true;
        if (head.includes('just a moment')) return true;
        if (head.includes('attention required')) return true;

        if (dom?.querySelector?.('#cf-challenge-running, #challenge-form, .cf-browser-verification, .cf-challenge')) return true;
    } catch (e) {
        console.debug('[Forums++] CF challenge sniff rejected:', e && e.message);
    }
    return false;
};

const xfpdLooksLikeCfFilenameHint = name => {
    const n = String(name || '').trim();
    return /^(?:just a moment\.{0,3}|checking your browser\.{0,3}|attention required\.{0,3})$/i.test(n) || /cloudflare/i.test(n);
};

// Original filename from Bunkr /api/_001_v2 JSON (when /v/ is CF-blocked).
const xfpdBunkrExtractNameFromVsData = data => {
    try {
        const cands = [];
        const add = v => {
            if (!v) return;
            if (typeof v === 'string') cands.push(v);
            else if (typeof v === 'number') cands.push(String(v));
        };

        add(data?.name);
        add(data?.filename);
        add(data?.file_name);
        add(data?.original);
        add(data?.title);

        if (data?.data && typeof data.data === 'object') {
            add(data.data.name);
            add(data.data.filename);
            add(data.data.file_name);
            add(data.data.original);
            add(data.data.title);
        }
        if (data?.file && typeof data.file === 'object') {
            add(data.file.name);
            add(data.file.filename);
            add(data.file.original);
            add(data.file.title);
        }

        const norm = s => {
            let t = String(s || '').replace(/\s+/g, ' ').trim();
            t = t.replace(/\s*\|\s*Bunkr\s*$/i, '').trim();
            return t;
        };

        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            if (/\.[A-Za-z0-9]{1,8}$/.test(t)) return t;
        }
        for (const raw of cands) {
            const t = norm(raw);
            if (!t) continue;
            if (xfpdLooksLikeCfFilenameHint(t)) continue;
            return t;
        }
    } catch (e) {
        console.debug('[Forums++] bunkr name extraction rejected:', e && e.message);
    }
    return '';
};

const xfpdWarmupTab = async (url, ms = BUNKR_CF_WARMUP_MS, active = BUNKR_CF_WARMUP_ACTIVE_TAB) => {
    try {
        const tab = GM_openInTab(url, { active: !!active, insert: true, setParent: true });
        await h.delayedResolve(ms);
        xfpdCloseTabHandle(tab);
    } catch (e) {
        console.debug('[Forums++] warm-up tab rejected (best-effort):', e && e.message);
        await h.delayedResolve(ms);
    }
};

let xfpdBunkrCfWarmupPromise = null;
let xfpdBunkrCfWarmupLastAt = 0;

// At most ONE warm-up tab at a time, and no more than one per cooldown window.
const xfpdBunkrCfWarmup = async url => {
    try {
        const now = Date.now();

        if (xfpdBunkrCfWarmupPromise) {
            return await xfpdBunkrCfWarmupPromise;
        }

        if (now - xfpdBunkrCfWarmupLastAt < BUNKR_CF_WARMUP_COOLDOWN_MS) {
            await h.delayedResolve(Math.min(1000, BUNKR_CF_WARMUP_MS));
            return null;
        }

        xfpdBunkrCfWarmupLastAt = now;

        xfpdBunkrCfWarmupPromise = (async () => {
            await xfpdWarmupTab(url);
        })();

        try {
            return await xfpdBunkrCfWarmupPromise;
        } finally {
            xfpdBunkrCfWarmupPromise = null;
        }
    } catch (e) {
        console.debug('[Forums++] bunkr CF warm-up rejected (best-effort):', e && e.message);
        return null;
    }
};

const xfpdBunkrGetWithCfRetry = async (cfHttp, url, warmUrlOrOrigin, allowWarmup = true) => {
    let last = null;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            last = await cfHttp.get(url);
        } catch (e) {
            last = null;
        }

        const dom = last?.dom;
        const source = last?.source || '';
        const status = Number(last?.status || 0);

        // Fast-fail on 403 / CF interstitial for non-last domains: blacklist
        // immediately so the caller can try the next domain.
        if (BUNKR_FASTFAIL_ON_403 && (status === 403) && !allowWarmup) {
            xfpdBunkrBanBase(warmUrlOrOrigin || url);
            return last || { dom: null, source: '' };
        }
        if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && last && xfpdLooksLikeCfChallenge(source, dom)) {
            xfpdBunkrBanBase(warmUrlOrOrigin || url);
            return last || { dom: null, source: '' };
        }

        if (last && !xfpdLooksLikeCfChallenge(source, dom)) return last;

        if (attempt < BUNKR_CF_MAX_RETRIES) {
            if (allowWarmup) {
                await xfpdBunkrCfWarmup(String(warmUrlOrOrigin || url));
            } else {
                await h.delayedResolve(200);
            }
        }
    }
    return last || { dom: null, source: '' };
};

const xfpdBunkrPostVsWithCfRetry = async (cfHttp, endpoint, payload, refererUrl, originUrl, allowWarmup = true) => {
    let lastText = '';
    let lastStatus = 0;
    for (let attempt = 0; attempt <= BUNKR_CF_MAX_RETRIES; attempt++) {
        try {
            const response = await cfHttp.post(
                endpoint,
                JSON.stringify(payload),
                {},
                {
                    'Content-Type': 'application/json',
                    Referer: refererUrl,
                    Origin: originUrl,
                },
            );
            lastText = String(response?.source || '');
            lastStatus = Number(response?.status || 0);
        } catch (e) {
            lastText = '';
            lastStatus = 0;
        }

        if (BUNKR_FASTFAIL_ON_403 && (Number(lastStatus || 0) === 403) && !allowWarmup) {
            xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
            return null;
        }
        if (BUNKR_FASTFAIL_ON_403 && !allowWarmup && xfpdLooksLikeCfChallenge(lastText, null)) {
            xfpdBunkrBanBase(originUrl || refererUrl || endpoint);
            return null;
        }
        try {
            return JSON.parse(lastText || '{}');
        } catch (e) {
            if (xfpdLooksLikeCfChallenge(lastText, null) && attempt < BUNKR_CF_MAX_RETRIES) {
                if (allowWarmup) {
                    await xfpdBunkrCfWarmup(String(refererUrl || originUrl || endpoint));
                } else {
                    await h.delayedResolve(200);
                }
                continue;
            }
            return null;
        }
    }
    return null;
};

// Sign a bunkr cdn.cr URL via glb-apisign.cdn.cr — unsigned URLs 403.
const xfpdBunkrSignCdnUrl = async (signHttp, rawUrl) => {
    try {
        const urlObj = new URL(rawUrl);
        const path = decodeURIComponent(urlObj.pathname);
        const signRes = await signHttp.get(
            `https://glb-apisign.cdn.cr/sign?path=${encodeURIComponent(path)}`
        );
        const signText = String(signRes?.source || '');
        const signData = JSON.parse(signText);
        if (signData?.token && signData?.ex) {
            urlObj.searchParams.set('token', String(signData.token));
            urlObj.searchParams.set('ex', String(signData.ex));
            return urlObj.toString();
        }
    } catch (e) {
        console.debug('[Forums++] bunkr CDN signing rejected (unsigned URL returned):', e && e.message);
    }
    return rawUrl;
};

/* ── GoFile cookie sync (lineage L309-426) ────────────────────────────────
 * The site authenticates CDN downloads via the accountToken cookie set
 * client-side; mirroring it with OUR resolved guest token keeps resolution
 * and download on the same account. The user's own cookie is captured once
 * and restored when the last post goes idle. */
let gofileCookieCaptured = false;
let gofileOriginalCookieValue = null;

const gofileCaptureOriginalCookie = () =>
    new Promise(resolve => {
        if (gofileCookieCaptured || typeof GM_cookie === 'undefined' || !GM_cookie || typeof GM_cookie.list !== 'function') {
            resolve();
            return;
        }
        try {
            GM_cookie.list({ url: 'https://gofile.io/', domain: 'gofile.io', name: 'accountToken' }, (cookies, error) => {
                if (error) {
                    console.warn('[GoFile] GM_cookie.list failed while capturing original accountToken cookie:', error);
                } else {
                    const existing = Array.isArray(cookies) ? cookies.find(c => c && c.name === 'accountToken') : null;
                    gofileOriginalCookieValue = existing ? existing.value : null;
                }
                gofileCookieCaptured = true;
                resolve();
            });
        } catch (e) {
            console.warn('[GoFile] GM_cookie.list threw while capturing original accountToken cookie:', e && e.message);
            gofileCookieCaptured = true;
            resolve();
        }
    });

const gofileSyncCookie = token =>
    new Promise(resolve => {
        (async () => {
            try {
                if (!token || typeof GM_cookie === 'undefined' || !GM_cookie || typeof GM_cookie.set !== 'function') {
                    resolve(false);
                    return;
                }
                await gofileCaptureOriginalCookie();
                GM_cookie.set(
                    {
                        url: 'https://gofile.io/',
                        name: 'accountToken',
                        value: String(token),
                        domain: 'gofile.io',
                        path: '/',
                        secure: true,
                        sameSite: 'lax',
                    },
                    error => {
                        if (error) console.warn('[GoFile] GM_cookie.set failed for accountToken:', error);
                        resolve(!error);
                    },
                );
            } catch (e) {
                console.warn('[GoFile] gofileSyncCookie threw:', e && e.message);
                resolve(false);
            }
        })();
    });

const gofileRestoreCookie = () =>
    new Promise(resolve => {
        try {
            if (!gofileCookieCaptured || typeof GM_cookie === 'undefined' || !GM_cookie) {
                resolve();
                return;
            }
            /* v1.13.2 (7d F27): a download that started between the caller's
             * idle check and this restore must not get the operator's own
             * cookie swapped back mid-run — leave the capture armed for the
             * next idle window. */
            if (processing.find(p => p.processing)) {
                resolve();
                return;
            }
            const originalValue = gofileOriginalCookieValue;
            gofileCookieCaptured = false;
            gofileOriginalCookieValue = null;

            if (originalValue === null) {
                if (typeof GM_cookie.delete === 'function') {
                    GM_cookie.delete({ url: 'https://gofile.io/', name: 'accountToken', domain: 'gofile.io', path: '/' }, error => {
                        if (error) console.warn('[GoFile] Failed to remove guest accountToken cookie during restore:', error);
                        resolve();
                    });
                    return;
                }
                resolve();
                return;
            }

            GM_cookie.set(
                {
                    url: 'https://gofile.io/',
                    name: 'accountToken',
                    value: originalValue,
                    domain: 'gofile.io',
                    path: '/',
                    secure: true,
                    sameSite: 'lax',
                },
                error => {
                    if (error) console.warn('[GoFile] Failed to restore original accountToken cookie:', error);
                    resolve();
                },
            );
        } catch (e) {
            console.debug('[GoFile] cookie restore rejected:', e && e.message);
            resolve();
        }
    });

/* ── Cyberdrop warm-up (lineage L8968-9018) ───────────────────────────────
 * One inactive /f/ tab per origin lets the site set its cookies; at most one
 * warm-up tab at any time, once per origin. */
const CYBERDROP_WARMUP_DEFAULT_MS = 2500;
let cyberdropWarmupChain = Promise.resolve();
const cyberdropWarmupAttempted = hintMap(16);

const cyberdropWarmupOnce = async (key, warmUrl, ms = CYBERDROP_WARMUP_DEFAULT_MS) => {
    // Back-compat: allow cyberdropWarmupOnce(url) calls.
    if (typeof warmUrl === 'undefined') {
        const maybeUrl = String(key || '').trim();
        if (/^https?:\/\//i.test(maybeUrl)) {
            warmUrl = maybeUrl;
            try { key = `cyberdrop:${new URL(maybeUrl).origin}`; } catch (e) { key = `cyberdrop:${maybeUrl}`; }
        }
    }

    // Normalize keys that accidentally include a full URL (avoid per-file warmups).
    const _k0 = String(key || '').trim();
    if (_k0.indexOf('://') !== -1) {
        const m = _k0.match(/https?:\/\/[^\s]+/i);
        if (m) { try { key = `cyberdrop:${new URL(m[0]).origin}`; } catch (e) { console.debug('[Forums++] cyberdrop warmup key normalize rejected:', e && e.message); } }
    }

    const k = String(key || '').trim();
    const u = String(warmUrl || '').trim();
    if (!k || !u) return;

    if (cyberdropWarmupAttempted.has(k)) {
        return;
    }

    cyberdropWarmupChain = cyberdropWarmupChain.then(() => {
        return new Promise(resolve => {
            try {
                const tab = GM_openInTab(u, { active: false, insert: true, setParent: true });
                setTimeout(() => {
                    xfpdCloseTabHandle(tab);
                    resolve();
                }, Math.max(250, ms));
            } catch (e) {
                console.debug('[Forums++] cyberdrop warm-up tab rejected:', e && e.message);
                resolve();
            }
        });
    });

    cyberdropWarmupAttempted.set(k, true);
    await cyberdropWarmupChain;
};

/* ── Filester v2 token API (lineage L447-588) ─────────────────────────────
 * The ONLY resolver that still works: POST {apiBase}/v2/api/public/download
 * {file_slug} → { server, file, token, name, expires_in }. Tokens are
 * IP-bound and expire ~30 min — resolve as late as possible. The legacy
 * cache-host probe sweep is intentionally NOT ported: its hosts are
 * NXDOMAIN/black-holed per the lineage's own field notes (dead infra). */
const FILESTER_API_TIMEOUT_MS = 20000;

const filesterResolveV2 = async (v2Http, apiBase, slug) => {
    const base = String(apiBase || 'https://filester.me').replace(/\/$/, '');
    const s = String(slug || '').trim();
    if (!s) return null;

    try {
        const res = await v2Http.base(
            'POST',
            `${base}/v2/api/public/download`,
            {},
            {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json;charset=UTF-8',
                Origin: base,
                Referer: `${base}/d/${s}`,
            },
            JSON.stringify({ file_slug: s }),
            'text',
        );

        let j = null;
        try { j = JSON.parse(String((res && res.source) || '')); } catch (e) { j = null; }

        const server = String((j && j.server) || '').replace(/\/$/, '');
        const file = String((j && j.file) || '');
        const token = String((j && j.token) || '');
        const name = String((j && j.name) || '');
        if (!server || !file || !token) return null;

        // Encode per path segment (encodeURI leaves `#` alone, which would
        // truncate the URL at the fragment).
        const filePath = String(file).split('/').map(encodeURIComponent).join('/');
        let streamUrl = `${server}/v2/${filePath}?token=${encodeURIComponent(token)}&download=true`;
        if (name) streamUrl += `&n=${encodeURIComponent(name)}`;

        const finalName = name || `Filester_${s}${(/\.[A-Za-z0-9]{1,8}$/.exec(file) || [''])[0]}`;
        const ref = `${base}/d/${s}`;

        filesterSlugByUrl.set(String(streamUrl), String(s));
        filesterRefByUrl.set(String(streamUrl), String(ref));
        filesterNameBySlug.set(String(s), String(finalName));
        filesterNameByUrl.set(String(streamUrl), String(finalName));

        return { url: streamUrl, name: finalName, ref, token, server, file };
    } catch (e) {
        console.debug('[Forums++] filester v2 resolve rejected:', e && e.message);
    }

    return null;
};

// Recognize a resolved Filester stream URL by the slug map (populated at
// resolution time) rather than by CDN hostname — Filester renames its CDN.
const isFilesterUrl = u => {
    const s = String(u || '');
    if (/(?:^|\/\/)(?:[a-z0-9-]+\.)*filester\.(me|sh|si|gg)\/(?:d|v)\//i.test(s)) return true;
    return filesterSlugByUrl.has(s);
};

/* ── Redgifs token refresh (lineage L4557-4577) ───────────────────────────
 * A 401 at download time is no longer fatal until page refresh. */
const redgifsFetchTempToken = async () => {
    try {
        const { source, status } = await h.http.get('https://api.redgifs.com/v2/auth/temporary', {}, {}, 'text');
        if (status === 200 && source && h.contains('token', source)) {
            const token = JSON.parse(source).token;
            if (token) {
                GM_setValue('redgifs_token', token);
            }
            return token || null;
        }
    } catch (e) {
        console.debug('[Forums++] redgifs token refresh rejected:', e && e.message);
    }
    return null;
};

/**
 * An array of arrays defining how to match hosts inside the posts.
 *
 * The first item in the array is the signature.
 * The second item is an array of matchers.
 *
 * A matcher is a regular expression matching a substring inside the post.
 *
 * The first matcher matches a single resource (e.g. an image or a video).
 * The second matcher matches a folder or an album (e.g. a set of related images)
 *
 * [0: signature(name+category), 1: [single_regex, album_regex]]
 *
 * When applied, every matcher is prefixed with https?:\/\/(www.)?
 *
 * Every matcher is matched against the following attributes:
 *
 * href, src, data-url
 *
 * You must not include the pattern to match attributes.
 * They are automatically handled when a matcher is run.
 *
 * For a completely custom pattern, put !! (two excl. characters) anywhere in it:
 *
 * [/!!https:\/\/cyberfile.su\/\w+(?=")/, /cyberfile.su\/folder\//]
 *
 * @signature {string} The name and categories of the host, separated by a colon.
 * @matchers {Array<RegExp>} The name and categories of the host, separated by a colon.
 *
 * Matchers can include the following options anywhere
 * (preferably where it doesn't break the pattern) within a pattern.
 *
 * @option <no_qs> Removes query string
 * @option <keep_ts> Keeps the trailing slash
 *
 * The following placeholders can be used inside any matcher pattern:
 *
 * @placeholder ~an@ -> a-zA-Z0-9
 *
 */
const hosts = [
    ['Simpcity:Attachments', [/(\/attachments\/|\/data\/video\/)/]],
    ['Coomer:Profiles', [/coomer.(su|st)\/[~an@._-]+\/user/]],
    ['Coomer:image', [/(\w+\.)?coomer.(su|st)\/(data|thumbnail)/]],
    ['JPGX:image', [/(simp\d+\.)?(cuckcapital\.cr|jpe?g\d?\.(church|fish|fishing|pet|su|cr))\/(?!(img\/|a\/|album\/))/, /jpe?g\d?\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/]],
    ['Goonbox:image', [/goonbox\.cr\/img\//, /goonbox\.cr\/a\//]],
    ['kemono:direct link', [/.{2,6}\.(kemono.su|kemono.cr)\/data\//]],
    ['Postimg:image', [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]],
    ['Ibb:image',
        [
            /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
            /ibb.co\/album\/[~an@_.-]+/,
        ],
    ],
    ['Ibb:direct link', [/!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/]],
    ['Imagevenue:image', [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
    ['Imgvb:image', [/imgvb.com\/images\//, /imgvb.com\/album/]],
    ['Imgbox:image', [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
    ['Onlyfans:image', [/public.onlyfans.com\/files/]],
    ['Reddit:image', [/(\w+)?.redd.it/]],
    ['Pomf2:File', [/pomf2.lain.la/]],
    ['Nitter:image', [/nitter\.(.{1,20})\/pic/]],
    ['Twitter:image', [/([~an@.]+)?twimg.com\//]],
    ['Pixhost:image', [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
    ['Imagebam:image', [/imagebam.com\/(view|gallery)/]],
    ['Imagebam:full embed', [/images\d.imagebam.com/]],
    ['Saint:video', [/((\w+\.)?(saint2.(su|pk|cr)|turbo\.cr)\/(embed|v|d)\/)|(([~an@]+\.)?saint2.(su|pk|cr)\/videos)/]],
    ['Saint:albums', [/((\w+\.)?(saint2.(su|pk|cr)|turbo\.cr)\/a\/)/]],
    ['Redgifs:video', [/!!redgifs.com(\/|\\\/)(ifr|watch|gifs\/detail|gifs\/watch).*?(?="|&quot;)/]],
    ['Redgifs:user', [/redgifs\.com\/users\//]],
    ['Bunkr:',
        [
            /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/,
        ]
    ],
    ['Bunkr:Albums', [/bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)\/a\//]],
    ['Give.xxx:Profiles', [/give.xxx\/[~an@_-]+/]],
    ['Pixeldrain:', [/(focus\.)?(pixeldrain.com|pixeldrain.net|pixeldra.in)\/[lu]\//]],
    ['Gofile:', [/gofile.io\/d/]],
    ['Filester:links', [/filester\.(me|sh|si|gg)\/d\//]],
    ['Filester:albums', [/filester\.(me|sh|si|gg)\/f\//]],
    ['Box.com:', [/m\.box\.com\//]],
    ['Yandex:', [/(disk\.)?yandex\.[a-z]+/]],
    ['Cyberfile:', [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    ['Cyberdrop:', [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /cyberdrop\.[a-z]{2,}\/a\//]],
    ['Pornhub:video', [/([~an@]+\.)?pornhub.com\/view_video/]],
    ['Noodlemagazine:video', [/(adult.)?noodlemagazine.com\/watch\//]],
    ['Spankbang:video', [/spankbang.com\/.*?\/video/]],
];

/**
 * An array of url resolvers.
 *
 * Each resolver is an array: [RegExp[], Function]
 * The first element is an array of RegExp patterns. All patterns must match for the resolver to be applied.
 * The second element is the resolver function: (url, http, spoilers, postId, postSettings) => Promise<string|object|null>
 * The resolver function should return:
 * - A string (resolved URL)
 * - An object { folderName: string, resolved: string[] } for albums
 * - Null if resolution fails
 */
const resolvers = [
    [
        [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
        url => url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, 'https://pbs.twimg.com/media/$3'),
    ],
    [
        [/imagevenue.com/],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                return dom.querySelector('.col-md-12 > a > img')?.getAttribute('src');
            } catch (error) {
                console.error(`Error resolving Imagevenue: ${error.message}`);
                return null;
            }
        },
    ],
    [[/pomf2.lain.la/], url => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, 'pomf2.lain.la/f/$1.$2')],
    [[/coomer\.(su|st)\/(data|thumbnail)/], url => url],
    [
        [/coomer\.(su|st)/, /:!coomer\.(su|st)\/(data|thumbnail)/],
        async (url, http) => {
            const host = `https://${String(url).match(/coomer\.(su|st)/i)?.[0] || 'coomer.su'}`;
            const profileId = url.replace(/\?.*/, '').split('/').pop();
            if (!profileId) return null;

            let finalURL = url.replace(/\?.*/, '');
            let nextPage = null;
            const posts = [];
            let page = 1;

            log.info('coomer.su', `Resolving profile: ${profileId}`, 'Coomer');

            do {
                try {
                    const { dom } = await http.get(finalURL);
                    const links = [...(dom.querySelectorAll('.card-list__items > article') ?? [])]
                        .map(a => a.querySelector('.post-card__heading > a'))
                        .filter(Boolean)
                        .map(a => ({
                            link: `${host}${a.getAttribute('href')}`,
                            id: a.getAttribute('href')?.split('/').pop() ?? '',
                        }));

                    posts.push(...links);
                    nextPage = dom.querySelector('a[title="Next page"]');
                    if (nextPage) {
                        finalURL = `${host}${nextPage.getAttribute('href')}`;
                    }
                    log.info('coomer.su', `Resolved page: ${page}`, 'Coomer');
                    page++;
                } catch (error) {
                    log.error('coomer.su', `Error fetching Coomer page ${page}: ${error.message}`, 'Coomer');
                    break;
                }
            } while (nextPage);

            const resolved = [];
            let index = 1;
            for (const post of posts) {
                try {
                    const { dom } = await http.get(post.link);
                    const filesContainer = dom.querySelector('.post__files');

                    if (filesContainer) {
                        const images = filesContainer.querySelectorAll('.post__thumbnail > .fileThumb');
                        if (images.length) {
                            resolved.push(
                                ...[...images].map(a => ({
                                    url: `${host}${a.getAttribute('href')}`,
                                    folderName: post.id,
                                })),
                            );
                        }
                    }

                    const attachments = dom.querySelectorAll('.post__attachments > .post__attachment > .post__attachment-link');
                    if (attachments.length) {
                        resolved.push(
                            ...[...attachments].map(a => {
                                const fileUrl = `${host}${a.getAttribute('href')}`;
                                let folder = 'Images';
                                const ext = h.ext(fileUrl.replace(/\?.*/, ''));
                                if (settings.extensions.video.includes(`.${ext}`)) {
                                    folder = 'Videos';
                                }
                                return {
                                    url: fileUrl,
                                    folderName: `${post.id}/${folder}`,
                                };
                            }),
                        );
                    }
                    log.info('coomer.su', `Resolved post ${index} / ${posts.length}`, 'Coomer');
                } catch (error) {
                    log.error('coomer.su', `Error resolving Coomer post ${post.link}: ${error.message}`, 'Coomer');
                }
                index++;
            }

            return { folderName: profileId, resolved };
        },
    ],
    [
        [/(postimg|pixxxels).cc/],
        async (url, http) => {
            try {
                url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, 'https://postimg.cc/$3');
                const { dom } = await http.get(url);
                return dom.querySelector('.controls > nobr > a')?.getAttribute('href');
            } catch (error) {
                console.error(`Error resolving Postimg: ${error.message}`);
                return null;
            }
        },
    ],
    [[/kemono\.(su|cr)\/data/], url => url],
    [
        [/(jpe?g\d?\.(church|fish|fishing|pet|su|cr))|cuckcapital\.cr\//i, /:!jpe?g\d?\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        url => url.replace('.th.', '.').replace('.md.', '.'),
    ],
    [
        [/jpe?g\d?\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
        async (url, http, spoilers, postId) => {
            url = url.replace(/\?.*/, '');
            let reFetch = false;
            let { source, dom } = await http.get(url, {
                onStateChange: response => {
                    if (response.readyState === 2 && response.finalUrl !== url) {
                        url = response.finalUrl;
                        reFetch = true;
                    }
                },
            });

            if (reFetch) {
                ({ source, dom } = await http.get(url));
            }

            if (h.contains('Please enter your password to continue', source)) {
                const authTokenNode = dom.querySelector('input[name="auth_token"]');
                const authToken = authTokenNode?.getAttribute('value');

                if (!authToken || !spoilers?.length) {
                    log.host.error(postId, `::Password protected album requires password::: ${url}`, 'jpg6.su');
                    return null;
                }

                const attemptWithPassword = async password => {
                    const { source: src, dom: d } = await http.post(
                        url,
                        `auth_token=${authToken}&content-password=${password}`,
                        {},
                        {
                            Referer: url,
                            Origin: 'https://jpg6.su',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    );
                    return { source: src, dom: d };
                };

                let authenticated = false;
                for (const spoiler of spoilers) {
                    try {
                        const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
                        if (!h.contains('Please enter your password to continue', src)) {
                            authenticated = true;
                            source = src;
                            dom = d;
                            break;
                        }
                    } catch (error) {
                        log.host.warn(postId, `::Attempt with password '${spoiler}' failed::: ${error.message}`, 'jpg6.su');
                    }
                }

                if (!authenticated) {
                    log.host.error(postId, `::Could not resolve password protected album::: ${url}`, 'jpg6.su');
                    return null;
                }
            }

            const resolvePageImages = async domToParse => {
                let images = [...(domToParse.querySelectorAll('.list-item-image > a > img') ?? [])]
                    .map(img => img.getAttribute('src'))
                    .filter(Boolean)
                    .map(url => url.replace('.md.', '.').replace('.th.', '.'));

                const nextPage = domToParse.querySelector('a[data-pagination="next"]');
                if (nextPage?.hasAttribute('href')) {
                    try {
                        const { dom: nextDom } = await http.get(nextPage.getAttribute('href'));
                        images.push(...(await resolvePageImages(nextDom)));
                    } catch (error) {
                        log.host.warn(postId, `::Error fetching next page of JPG6 album::: ${error.message}`, 'jpg6.su');
                    }
                }
                return images;
            };

            const resolved = await resolvePageImages(dom);
            return {
                dom,
                source,
                folderName: dom.querySelector('meta[property="og:title"]')?.content.trim() ?? 'JPG6 Album',
                resolved,
            };
        },
    ],
    /* v1.12.0 (round 6): Goonbox /img/ + /a/ — metadata API first (with the
     * CF bridge fallback), original_url deep-scan, reachability probe before
     * discarding originals, thumbnail fallback, album pagination walker
     * (lineage L3018-3126). */
    [
        [/goonbox\.cr\/img\//],
        async (url, http, spoilers, postId) => {
            try {
                const id = url.split('/').pop().split('?')[0];
                const fallback = goonboxThumbByUrl.get(url.replace(/\?.*/, '').replace(/\/$/, '')) || null;

                // Direct request first, same-origin bridge tab only if
                // Cloudflare rejects it — see goonboxApiJson.
                const data = await goonboxApiJson(http, `/api/images/${id}`, url, postId);

                // Take the first original_url anywhere in the response rather
                // than pinning to data.image.original_url — that pin yields
                // undefined the moment Goonbox moves the field, and the only
                // symptom is a silently lower-resolution file.
                const findOriginal = (obj, depth = 0) => {
                    if (!obj || typeof obj !== 'object' || depth > 6) return null;
                    if (Array.isArray(obj)) {
                        for (const it of obj) {
                            const v = findOriginal(it, depth + 1);
                            if (v) return v;
                        }
                        return null;
                    }
                    for (const k of ['original_url', 'originalUrl', 'original']) {
                        const v = obj[k];
                        if (typeof v === 'string' && /^https?:\/\//i.test(v.trim())) return v.trim();
                    }
                    for (const k of Object.keys(obj)) {
                        const v = findOriginal(obj[k], depth + 1);
                        if (v) return v;
                    }
                    return null;
                };

                const originalUrl = findOriginal(data);

                if (!originalUrl) {
                    // Silent downgrade to a thumbnail is the worst failure mode here.
                    log.host.info(postId, `::No original_url in API response -> thumbnail::: ${url}`, 'goonbox.cr');
                    return fallback;
                }

                // Some originals genuinely 404 while the medium-res thumbnail
                // still exists — but only a definitive "gone" justifies
                // discarding: a refused HEAD says nothing (plenty of CDN edges
                // do not serve HEAD), so a ranged GET is the authority.
                const probe = async (method, headers) => {
                    try {
                        const r = await http.base(method, originalUrl, {}, { Referer: url, ...headers }, null, 'text');
                        return Number((r && r.status) || 0) || 0;
                    } catch (e) {
                        return 0;
                    }
                };

                let status = await probe('HEAD', {});
                let reachable = status >= 200 && status < 400;

                if (!reachable) {
                    status = await probe('GET', { Range: 'bytes=0-0' });
                    reachable = status >= 200 && status < 400;
                }

                if (!reachable) {
                    log.host.info(postId, `::Original unreachable (${status}) -> thumbnail::: ${originalUrl}`, 'goonbox.cr');
                    return fallback || originalUrl;
                }

                return originalUrl;
            } catch (error) {
                log.host.error(postId, `::Error resolving Goonbox image ${url}::: ${error.message}`, 'goonbox.cr');
                return null;
            }
        },
    ],
    [
        [/goonbox\.cr\/a\//],
        async (url, http, spoilers, postId) => {
            try {
                const albumSlug = url.replace(/\?.*/, '').split('/').filter(Boolean).pop();

                // Direct request first; the helper tab is reused across every
                // page of the album.
                const fetchPage = async page =>
                    await goonboxApiJson(http, `/api/albums/${albumSlug}/images?page=${page}`, url, postId);

                const first = await fetchPage(1);
                if (!first || !h.isArray(first.images)) return null;

                const resolved = first.images.map(img => img.original_url).filter(Boolean);
                const lastPage = first.pagination?.last_page || 1;

                for (let page = 2; page <= lastPage; page++) {
                    const data = await fetchPage(page);
                    if (data && h.isArray(data.images)) {
                        resolved.push(...data.images.map(img => img.original_url).filter(Boolean));
                    }
                }

                return {
                    folderName: `goonbox_${albumSlug}`,
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Goonbox album ${url}::: ${error.message}`, 'goonbox.cr');
                return null;
            }
        },
    ],
    [
        [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                return dom.querySelector('.header-content-right > a')?.getAttribute('href');
            } catch (err) {
                console.error(`Error resolving Ibb direct link: ${err.message}`);
                return url; // Fallback to original URL if resolution fails
            }
        },
    ],
    [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], url => url],
    [
        [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
        async (url, http, _, postId) => {
            const albumId = url.replace(/\?.*/, '').split('/').pop();
            if (!albumId) return null;

            try {
                const { source, dom } = await http.get(url);
                /* v1.13.7 (13b-F02): NaN-proof — a missing count node or a
                 * comma-formatted count parsed to NaN, the page loop never
                 * ran, and the album silently resolved to zero files. */
                const countText = String(dom.querySelector('span[data-text="image-count"]')?.innerText || '').replace(/[^0-9]/g, '');
                const imageCount = parseInt(countText, 10) || 0;
                const pageCount = Math.max(1, Math.ceil(imageCount / 32));
                const authToken = h.re.match(/(?<=auth_token=").*?(?=")/i, source);

                const fetchPageData = async (albId, page, seekEnd, token) => {
                    const seek = seekEnd || '';
                    /* WO-01 round-5 (5-c F01): the ibb.co data-object URL decode now
                     * degrades losslessly like its disposition-filename sibling
                     * (the 1.11.1 changelog claimed "both sites" but only the
                     * disposition site had shipped the guard — this was the raw
                     * one; a bare '%' previously aborted the whole album page
                     * into the error-logged drop below). */
                    const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
                    const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albId}&auth_token=${token}&seek=${seek}&items_per_page=32`;
                    const { source: response } = await http.post(
                        'https://ibb.co/json',
                        data,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );

                    try {
                        const parsed = JSON.parse(response);
                        if (parsed && parsed.status_code === 200) {
                            const html = parsed.html;
                            const urls = h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html)
                                .map(o => JSON.parse(safeDecode(o))?.url)
                                .filter(Boolean);
                            return { urls, parsed };
                        }
                        return { urls: [], parsed };
                    } catch (e) {
                        log.host.error(postId, `::Error parsing Ibb JSON response for album ${albId} page ${page}::: ${e.message}`, 'ibb.co');
                        return { urls: [], parsed: {} };
                    }
                };

                const resolved = [];
                let currentSeekEnd = '';

                for (let i = 1; i <= pageCount; i++) {
                    try {
                        const data = await fetchPageData(albumId, i, currentSeekEnd, authToken);
                        currentSeekEnd = data.parsed.seekEnd;
                        resolved.push(...data.urls);
                    } catch (error) {
                        log.host.error(postId, `::Error fetching Ibb album page ${i}::: ${error.message}`, 'ibb.co');
                        break;
                    }
                }

                return {
                    dom,
                    source,
                    folderName: dom.querySelector('meta[property="og:title"]')?.content.trim() ?? 'IBB Album',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Ibb album ${albumId}::: ${error.message}`, 'ibb.co');
                return null;
            }
        },
    ],
    [[/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//], url => url.replace(/\/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/')],
    [
        [/pixhost.to\/gallery\//],
        async (url, http, _, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const imageLinksInput = dom?.querySelector('.share > div:nth-child(2) > input') || dom?.querySelector('.share > input:nth-child(2)');

                if (!imageLinksInput) {
                    log.host.error(postId, `::Could not find image links input for Pixhost gallery::: ${url}`, 'pixhost.to');
                    return null;
                }

                const resolved = h.re
                    .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, imageLinksInput.getAttribute('value') ?? '')
                    .map(imgUrl => imgUrl.replace(/t(\d+)\./gi, 'img$1.').replace(/thumbs\//i, 'images/'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('.link > h2')?.innerText.trim() ?? 'Pixhost Gallery',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Pixhost gallery ${url}::: ${error.message}`, 'pixhost.to');
                return null;
            }
        },
    ],
    /* v1.12.0 (round 6): Bunkr's live flow — /f/<slug> pages carry the
     * data-file-id; apidl.bunkr.ru/api/_001_v2 returns the (possibly XOR-
     * "SECRET_KEY_<hour>" encrypted) CDN URL; glb-apisign.cdn.cr signs it.
     * CF fast-fail + 60-min domain blacklist + warm-up tabs ride the machinery
     * (lineage L3321-3723). Name hints from the album grid ride the bounded
     * maps. The legacy /api/v2/file/{id} decrypt is kept as the fallback when
     * the /f/ page yields no data-file-id. */
    [
        [/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)\/(v\/)?/i, /:!bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)\/a\//],
        async (url, http, _, postId) => {
            try {
                const { pathname } = new URL(url);
                const segments = pathname.split('/').filter(Boolean);
                const index = segments.findIndex(s => ['f', 'v', 'd'].includes(s));
                const slug = index > -1 ? segments.slice(index + 1).join('/') : segments.pop();
                if (!slug) {
                    log.host.error(postId, `::Could not extract ID from Bunkr URL::: ${url}`, 'Bunkr');
                    return null;
                }

                const fileBase = (() => { try { return new URL(url).origin; } catch (e) { return 'https://bunkr.cr'; } })();

                // Live flow: fetch the /f/ page for the numeric data-file-id.
                let dataId = null;
                try {
                    const fileRes = await xfpdBunkrGetWithCfRetry(http, `${fileBase}/f/${slug}`, fileBase, fileBase === 'https://bunkr.cr');
                    const fileDom = fileRes?.dom;
                    if (fileDom && !xfpdLooksLikeCfChallenge(fileRes?.source || '', fileDom)) {
                        dataId = fileDom?.querySelector?.('[data-file-id]')?.getAttribute?.('data-file-id') || null;
                    }
                } catch (e) {
                    console.debug('[Forums++] bunkr /f/ page fetch rejected:', e && e.message);
                }

                if (dataId) {
                    const data = await xfpdBunkrPostVsWithCfRetry(
                        http,
                        'https://apidl.bunkr.ru/api/_001_v2',
                        { id: dataId },
                        `https://get.bunkrr.su/file/${dataId}`,
                        'https://get.bunkrr.su',
                        true,
                    );

                    if (data && data.url) {
                        const decodeFinalUrl = dataToDecode => {
                            try {
                                if (!dataToDecode || !dataToDecode.url) return null;
                                if (!dataToDecode.encrypted) return dataToDecode.url;

                                const binaryString = atob(dataToDecode.url);
                                const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(dataToDecode.timestamp / 3600)}`);

                                return Array.from(binaryString)
                                    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                                    .join('');
                            } catch (e) {
                                return null;
                            }
                        };

                        let finalUrl = decodeFinalUrl(data);
                        if (finalUrl && typeof finalUrl === 'string') {
                            finalUrl = finalUrl.trim();
                            if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;
                            finalUrl = await xfpdBunkrSignCdnUrl(http, finalUrl);

                            const hint = xfpdBunkrExtractNameFromVsData(data) || '';
                            if (hint && String(hint).trim()) {
                                bunkrNameByUrl.set(String(finalUrl), String(hint).trim());
                            }

                            return finalUrl;
                        }
                    }
                }

                // Legacy fallback: the /api/v2/file/{id} decrypt (kept for URLs
                // whose /f/ page yields no data-file-id).
                const response = await http.post(
                    `https://bunkr.cr/api/v2/file/${slug}`,
                    null,
                    {},
                    { 'Content-Type': 'application/json' }
                );

                const data = JSON.parse(response.source);

                if (!data || data.status === 'error') {
                    log.host.error(postId, `::Bunkr API error for ID ${slug}::: ${data?.message || 'Unknown error'}`, 'Bunkr');
                    return null;
                }

                let finalURL;
                if (!data.encrypted) {
                    finalURL = data.url;
                } else {
                    const binaryString = atob(data.url);
                    const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                    finalURL = Array.from(binaryString)
                        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                        .join('');
                }
                return finalURL;
            } catch (error) {
                log.host.error(postId, `::Error resolving Bunkr direct link for ${url}::: ${error.message}`, 'Bunkr');
                return null;
            }
        },
    ],
    [
        [/bunkrr?r?\.(ac|at|ax|bi|black|by|cat|ci|cm|cr|cx|fi|is|lu|lv|media|nu|pk|ph|ps|red|ru|se|si|site|sk|sx|ws|su|org)\/a\//],
        async (url, http, _, postId, ____, progressCB) => {
            try {
                const cleanUrl = String(url || '').split('#')[0];
                const baseUrl = cleanUrl.split('?')[0].replace(/\/+$/, '');

                const resolved = [];
                const seen = new Set();

                // Keep the human filename from the album grid (title / .theName).
                const nameHintBySlug = new Map();

                let firstDom = null;
                let firstSource = null;

                const sanitizeName = s => String(s || '')
                    .replace(/[\\/:*?"<>|]/g, '-')
                    .replace(/\s+/g, ' ')
                    .trim();

                const extractSlugsFromDom = dom => {
                    const containers = dom?.querySelectorAll?.('.grid-images > div') || [];
                    const slugs = [];

                    for (const c of containers) {
                        const a =
                            c.querySelector('a[class="after:absolute after:z-10 after:inset-0"]') ||
                            c.querySelector('a[href*="/f/"]') ||
                            c.querySelector('a[href*="/v/"]') ||
                            c.querySelector('a[href*="/d/"]');

                        const href = a?.getAttribute?.('href') || '';
                        const m = href.match(/\/(f|v|d)\/([^\/?#]+)/i);
                        if (m && m[2]) {
                            const slug = m[2];
                            slugs.push(slug);

                            try {
                                let hint = c?.getAttribute?.('title') || '';
                                if (!hint) hint = c?.querySelector?.('.theName')?.textContent || '';
                                if (!hint) hint = c?.querySelector?.('p.truncate')?.textContent || '';
                                if (!hint) hint = c?.querySelector?.('.grid-images_box-txt p')?.textContent || '';
                                hint = String(hint || '').replace(/\s+/g, ' ').trim();
                                if (hint) nameHintBySlug.set(slug, hint);
                            } catch (e) {
                                console.debug('[Forums++] bunkr album name hint rejected:', e && e.message);
                            }
                        }
                    }

                    /* v1.13.8 (15a F04): the grid walk stays the primary,
                     * but a redesigned album page must not silently yield an
                     * empty album (FPP-RES-03: page fetched, 0 slugs, ZERO
                     * diagnostics — the run ended in a bare "FOUND 0
                     * RESOURCE(S)" naming no cause). Before giving up, sweep
                     * every /f|v|d anchor on the page — container-agnostic,
                     * so a markup restructure that drops or renames
                     * .grid-images cannot orphan the album. */
                    if (!slugs.length) {
                        const anchors = dom?.querySelectorAll?.('a[href*="/f/"], a[href*="/v/"], a[href*="/d/"]') || [];
                        for (const a of anchors) {
                            const href = a?.getAttribute?.('href') || '';
                            const m = href.match(/\/(f|v|d)\/([^\/?#]+)/i);
                            if (m && m[2] && !slugs.includes(m[2])) slugs.push(m[2]);
                        }
                    }

                    return slugs;
                };

                const asyncPool = async (limit, items, worker) => {
                    const results = new Array(items.length);
                    let i = 0;

                    const runners = Array.from({ length: Math.max(1, limit) }, async () => {
                        while (true) {
                            const idx = i++;
                            if (idx >= items.length) break;
                            try {
                                results[idx] = await worker(items[idx], idx);
                            } catch (e) {
                                results[idx] = null;
                            }
                        }
                    });

                    await Promise.all(runners);
                    return results;
                };

                const origin = (() => {
                    try { return new URL(baseUrl).origin; } catch (e) { return 'https://bunkr.cr'; }
                })();

                let folderName = null;

                const MAX_PAGES = 500;
                const CONCURRENCY = 8;

                const albumUrlObj = (() => {
                    try { return new URL(baseUrl); } catch (e) { return null; }
                })();
                const albumPath = (albumUrlObj && albumUrlObj.pathname) ? albumUrlObj.pathname : '/';
                const albumBasesAll = xfpdBunkrFilterBases([origin, 'https://bunkr.pk', 'https://bunkr.cr']);
                let albumBaseChosen = null;

                for (let page = 1; page <= MAX_PAGES; page++) {
                    if (typeof progressCB === 'function') {
                        progressCB(`Resolving: ${baseUrl}?page=${page}`);
                    }

                    const pageBases = albumBaseChosen
                        ? [albumBaseChosen, ...albumBasesAll.filter(b => b !== albumBaseChosen)]
                        : albumBasesAll;

                    let dom = null, source = '';
                    let slugs = [];

                    for (const base of pageBases) {
                        const base0 = String(base || '').replace(/\/$/, '');
                        const candidate = `${base0}${albumPath}?page=${page}`;

                        try {
                            ({ dom, source } = await xfpdBunkrGetWithCfRetry(http, candidate, base0, base0 === 'https://bunkr.cr'));
                        } catch (e) {
                            dom = null;
                            source = '';
                        }

                        if (xfpdLooksLikeCfChallenge(source, dom)) continue;

                        slugs = extractSlugsFromDom(dom);
                        if (page === 1 && !slugs.length) {
                            continue;
                        }

                        if (!albumBaseChosen) albumBaseChosen = base0;
                        break;
                    }

                    /* v1.13.8 (15a F05): both silent-empty exits are named
                     * now — every mirror unreachable, and a page-1 that
                     * yields no file links even after the fallback sweep
                     * (markup redesign, an empty album, or an undetected
                     * challenge). A LATER page running dry is the normal
                     * end-of-album, not a defect — only page 1 is a named
                     * failure. */
                    if (!dom) {
                        log.host.error(postId, `::Bunkr album unreachable on every mirror::: ${baseUrl}`, 'Bunkr');
                        break;
                    }
                    if (!slugs.length) {
                        if (page === 1) {
                            log.host.error(postId, `::Bunkr album page yielded no file links (markup redesign, empty album, or undetected challenge)::: ${baseUrl}`, 'Bunkr');
                        }
                        break;
                    }

                    if (page === 1) {
                        firstDom = dom;
                        firstSource = source;

                        const h1 = dom?.querySelector?.('h1');
                        const title = (h1?.innerText || h1?.textContent || '').split('\n')[0]?.trim();
                        if (title) folderName = sanitizeName(title);
                    }

                    const fresh = [];
                    for (const s of slugs) {
                        if (!s || seen.has(s)) continue;
                        seen.add(s);
                        fresh.push(s);
                    }

                    if (!fresh.length) break;

                    const urls = await asyncPool(CONCURRENCY, fresh, async slug => {
                        // Fetch /f/{slug} to get the numeric file ID required by the new API.
                        const fileBase = String(albumBaseChosen || origin || 'https://bunkr.cr').replace(/\/$/, '');
                        const filePageUrl = `${fileBase}/f/${slug}`;
                        let dataId = null;
                        try {
                            const fileRes = await xfpdBunkrGetWithCfRetry(http, filePageUrl, fileBase, fileBase === 'https://bunkr.cr');
                            const fileDom = fileRes?.dom;
                            if (fileDom && !xfpdLooksLikeCfChallenge(fileRes?.source || '', fileDom)) {
                                dataId = fileDom?.querySelector?.('[data-file-id]')?.getAttribute?.('data-file-id') || null;
                            }
                        } catch (e) {
                            console.debug('[Forums++] bunkr album /f/ fetch rejected for one slug:', e && e.message);
                        }
                        if (!dataId) return null;

                        let data = null;
                        try {
                            data = await xfpdBunkrPostVsWithCfRetry(
                                http,
                                'https://apidl.bunkr.ru/api/_001_v2',
                                { id: dataId },
                                `https://get.bunkrr.su/file/${dataId}`,
                                'https://get.bunkrr.su',
                                true,
                            );
                        } catch (e) {
                            console.debug('[Forums++] bunkr album API step rejected for one slug:', e && e.message);
                        }
                        if (!data || !data.url) return null;

                        let finalUrl;
                        try {
                            if (!data.encrypted) {
                                finalUrl = data.url;
                            } else {
                                const binaryString = atob(data.url);
                                const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
                                finalUrl = Array.from(binaryString)
                                    .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
                                    .join('');
                            }
                        } catch (e) {
                            console.debug('[Forums++] bunkr album decode rejected for one slug:', e && e.message);
                            return null;
                        }
                        if (!finalUrl || typeof finalUrl !== 'string') return null;
                        finalUrl = finalUrl.trim();
                        if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl;

                        finalUrl = await xfpdBunkrSignCdnUrl(http, finalUrl);

                        try {
                            const hint = nameHintBySlug.get(slug) || xfpdBunkrExtractNameFromVsData(data) || '';
                            if (hint && String(hint).trim()) {
                                bunkrNameByUrl.set(String(finalUrl), String(hint).trim());
                            }
                        } catch (e) {
                            console.debug('[Forums++] bunkr album hint registration rejected:', e && e.message);
                        }

                        return finalUrl;
                    });

                    for (const u of urls) if (u) resolved.push(u);
                }

                if (!folderName) folderName = h.basename(baseUrl);

                return {
                    dom: firstDom,
                    source: firstSource,
                    folderName,
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Bunkr album ${url}::: ${error.message}`, 'Bunkr');
                return null;
            }
        },
    ],
    [
        [/give.xxx\//],
        async (url, http, _, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const profileId = h.re.match(/(?<=profile-id=")\d+/, source);
                if (!profileId) {
                    log.host.error(postId, `::Could not find profile ID for Give.xxx URL::: ${url}`, 'give.xxx');
                    return null;
                }

                const resolved = [];
                let username = null;
                let firstMediaId = null;
                let mediaId = 1;
                let iteration = 1;

                while (true) {
                    let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
                    endpoint += iteration === 1 ? '&min_id=1' : `&max_id=${mediaId}`;
                    try {
                        const { source: apiSource } = await http.get(endpoint);
                        if (h.contains('_v', apiSource)) {
                            const parsed = JSON.parse(apiSource);

                            if (!parsed || parsed.length === 0) {
                                break;
                            }

                            if (username === null) {
                                username = parsed[0]?.account?.username;
                            }

                            if (firstMediaId === null) {
                                firstMediaId = parsed[0]?.id;
                            } else {
                                if (firstMediaId === parsed[0]?.id) {
                                    break;
                                }
                            }
                            resolved.push(
                                ...parsed.flatMap(i => {
                                    return i.media_attachments
                                        .map(a => a.sizes)
                                        .map(s => s.large || s.normal || s.small)
                                        .filter(Boolean);
                                }),
                            );
                            mediaId = parsed[parsed.length - 1]?.id;
                        } else {
                            break;
                        }
                    } catch (error) {
                        log.host.error(postId, `::Error fetching Give.xxx API page ${iteration}::: ${error.message}`, 'give.xxx');
                        break;
                    }
                    iteration++;
                }

                return {
                    dom,
                    source,
                    folderName: username ?? 'Give.xxx Profile',
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Give.xxx album ${url}::: ${error.message}`, 'give.xxx');
                return null;
            }
        },
    ],
    [
        [/pixeldrain\.(com|net)\/[ul]|pixeldra\.in\/[ul]/],
        url => {
            /* v1.13.7 (13b-F04): URL-object construction — the old string
             * splices glued a second '?' or a trailing segment onto query-
             * bearing links ('/u/abc?x=1' → '…abc?x=1?download',
             * '/l/abc?x=1' → '…abc?x=1/zip'), corrupting both API forms. */
            try {
                const u = new URL(url);
                if (u.pathname.includes('/l/')) {
                    u.pathname = u.pathname.replace('/l/', '/api/list/').replace(/\/+$/, '') + '/zip';
                    return u.toString();
                }
                u.pathname = u.pathname.replace('/u/', '/api/file/');
                if (u.search) {
                    u.searchParams.set('download', '');
                    return u.toString();
                }
                return `${u.origin}${u.pathname}?download`;
            } catch (e) {
                console.debug('Forums++: pixeldrain resolver fell back to the raw url:', e && e.message);
                return url;
            }
        },
    ],
    /* v1.12.0 (round 6): GoFile's 2026-08 API — the static wt is dead; the
     * site derives a per-request X-Website-Token from the account token via
     * generateWT() in gofile.io/js/wt.obf.js. The script is fetched live,
     * evaluated in a scoped Function (reads navigator only, the declaration
     * stays local), and its source cached for a day (xfpd_gofile_wt) — the
     * 4-hour time bucket inside generateWT() is recomputed on every call.
     * Guest account via POST /accounts + GET /accounts/website activation,
     * persisted 24 h (xfpd_gofile_at); bearerOverride pins a personal token.
     * Password albums try each spoiler as a sha256 hash (lineage L3873-4229). */
    [
        [/gofile.io\/d/],
        async (url, http, spoilers, postId) => {
            const WT_KEY = 'xfpd_gofile_wt';
            const AT_KEY = 'xfpd_gofile_at';
            const WT_MAX_AGE_MS = 24 * 3600 * 1000;
            const AT_MAX_AGE_MS = 24 * 3600 * 1000;

            const gmGet = (key, fallback) => {
                try {
                    return typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback;
                } catch (e) {
                    return fallback;
                }
            };

            const gmSet = (key, val) => {
                try {
                    if (typeof GM_setValue === 'function') GM_setValue(key, val);
                } catch (e) {
                    console.debug('[Forums++] gofile storage write rejected:', e && e.message);
                }
            };

            /* v1.13.2 (7d F28): expired wt/at entries purge on read — they
             * were inert-but-lingering storage. */
            const gmDelete = key => {
                try {
                    if (typeof GM_deleteValue === 'function') GM_deleteValue(key);
                } catch (e) {
                    console.debug('[Forums++] gofile storage purge rejected:', e && e.message);
                }
            };

            const gmReq = async (method, reqUrl, data = null, headers = {}, responseType = 'text') => {
                return await http.base(method, reqUrl, {}, headers, data, responseType);
            };

            let cachedGenerateWT = null;

            const getGenerateWT = async (force = false) => {
                if (!force && cachedGenerateWT) return cachedGenerateWT;

                const now = Date.now();
                const cached = gmGet(WT_KEY, null);
                if (!force && cached && cached.ts && now - cached.ts >= WT_MAX_AGE_MS) gmDelete(WT_KEY);
                let srcText =
                    !force && cached && cached.src && cached.ts && now - cached.ts < WT_MAX_AGE_MS
                        ? cached.src
                        : null;

                if (!srcText) {
                    const { source } = await gmReq('GET', 'https://gofile.io/js/wt.obf.js', null, {}, 'text');
                    srcText = source || '';
                    if (!srcText || !/generateWT/.test(srcText)) {
                        throw new Error('Could not fetch GoFile wt.obf.js (generateWT).');
                    }
                    gmSet(WT_KEY, { src: srcText, ts: now });
                }

                try {
                    const factory = new Function(
                        'navigator',
                        `${srcText}\nreturn (typeof generateWT === 'function') ? generateWT : null;`,
                    );
                    const fn = factory(navigator);
                    if (typeof fn !== 'function') throw new Error('no generateWT');
                    cachedGenerateWT = fn;
                    return fn;
                } catch (e) {
                    throw new Error('Could not evaluate GoFile generateWT().');
                }
            };

            const computeWebsiteToken = async (token, force = false) => {
                const gen = await getGenerateWT(force);
                return gen(token);
            };

            const createAccountToken = async () => {
                // Live site creates the guest account with a plain POST (no website-token).
                const { source } = await gmReq(
                    'POST',
                    'https://api.gofile.io/accounts',
                    JSON.stringify({}),
                    {
                        accept: 'application/json',
                        'content-type': 'application/json',
                    },
                    'text',
                );

                const json = JSON.parse(source || '{}');

                if (!json || json.status !== 'ok' || !json.data || !json.data.token) {
                    throw new Error(`createAccount failed: ${json?.message || json?.status || 'unknown'}`);
                }

                const token = json.data.token;

                // Sync/activate the fresh guest token server-side — the website
                // does this via GET /accounts/website before it will resolve
                // /contents for that token.
                try {
                    await gmReq(
                        'GET',
                        'https://api.gofile.io/accounts/website',
                        null,
                        { accept: 'application/json', authorization: `Bearer ${token}` },
                        'text',
                    );
                } catch (e) {
                    console.debug('[Forums++] gofile account activation rejected (best-effort):', e && e.message);
                }

                try {
                    settings.hosts.goFile.token = token;
                } catch (e) {
                    console.debug('[Forums++] gofile settings write rejected:', e && e.message);
                }

                gmSet(AT_KEY, { token, ts: Date.now() });
                await gofileSyncCookie(token);
                return token;
            };

            const getAccountToken = async (force = false) => {
                // If the user provided a personal Bearer token, always use it.
                let token = null;
                try {
                    const override = settings?.hosts?.goFile?.bearerOverride;
                    if (override && String(override).trim() !== '') {
                        token = String(override).trim();
                    }
                } catch (e) {
                    console.debug('[Forums++] gofile bearerOverride read rejected:', e && e.message);
                }

                if (!token) {
                    const now = Date.now();
                    const cached = gmGet(AT_KEY, null);
                    if (!force && cached && cached.token && cached.ts && now - cached.ts < AT_MAX_AGE_MS) {
                        token = cached.token;
                        try {
                            settings.hosts.goFile.token = token;
                        } catch (e) {
                            console.debug('[Forums++] gofile settings mirror rejected:', e && e.message);
                        }
                    } else if (cached && cached.ts && now - cached.ts >= AT_MAX_AGE_MS) {
                        gmDelete(AT_KEY); // 7d F28: purge the expired entry
                    }
                }

                if (!token) {
                    try {
                        if (!force && settings && settings.hosts && settings.hosts.goFile && settings.hosts.goFile.token) {
                            token = settings.hosts.goFile.token;
                        }
                    } catch (e) {
                        console.debug('[Forums++] gofile settings token read rejected:', e && e.message);
                    }
                }

                if (!token) {
                    // createAccountToken() already syncs the cookie for this token.
                    return await createAccountToken();
                }

                await gofileSyncCookie(token);
                return token;
            };

            const apiContentsRaw = async (contentId, passwordHash, token) => {
                const wt = await computeWebsiteToken(token);

                // Match the website's getContent() query shape exactly.
                const params = [
                    'contentFilter=',
                    'page=1',
                    'pageSize=1000',
                    'sortField=createTime',
                    'sortDirection=-1',
                ];
                if (passwordHash) params.push(`password=${encodeURIComponent(passwordHash)}`);
                const apiUrl = `https://api.gofile.io/contents/${encodeURIComponent(contentId)}?${params.join('&')}`;

                const { source } = await gmReq(
                    'GET',
                    apiUrl,
                    null,
                    {
                        accept: 'application/json',
                        authorization: `Bearer ${token}`,
                        'x-website-token': wt,
                        'x-bl': (typeof navigator !== 'undefined' && navigator.language) || '',
                    },
                    'text',
                );

                return JSON.parse(source || '{}');
            };

            const apiContents = async (contentId, passwordHash) => {
                let token = await getAccountToken(false);

                let json = await apiContentsRaw(contentId, passwordHash, token);
                if (json && json.status === 'ok') return json;

                const s = String(json?.status || json?.message || '').toLowerCase();

                if (s.includes('unauthorized') || s.includes('token') || s.includes('invalid')) {
                    // Refresh both the salts (wt.obf.js may have rotated) and the guest token.
                    await getGenerateWT(true);
                    token = await getAccountToken(true);
                    json = await apiContentsRaw(contentId, passwordHash, token);
                    return json;
                }

                return json;
            };

            const resolveAlbum = async (urlOrId, availableSpoilers) => {
                const id = String(urlOrId).includes('gofile.io/d/') ? String(urlOrId).split('/').reverse()[0] : String(urlOrId);

                let props = await apiContents(id, null);

                if (props && props.status === 'error-notFound') {
                    log.host.error(postId, `::Album not found::: ${urlOrId}`, 'gofile.io');
                    return null;
                }

                if (props && props.status === 'error-notPublic') {
                    log.host.error(postId, `::Album not public::: ${urlOrId}`, 'gofile.io');
                    return null;
                }

                if (props && props.status === 'error-passwordRequired') {
                    log.host.info(postId, `::Album requires password::: ${urlOrId}`, 'gofile.io');

                    if (!availableSpoilers || !availableSpoilers.length) {
                        return props;
                    }

                    log.host.info(postId, `::Trying with ${availableSpoilers.length} available password(s)::`, 'gofile.io');

                    for (const spoiler of availableSpoilers) {
                        const hash = sha256(spoiler);
                        const attempt = await apiContents(id, hash);

                        if (attempt && attempt.status === 'ok') {
                            log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, 'gofile.io');
                            props = attempt;
                            break;
                        }
                    }
                }

                return props;
            };

            const props = await resolveAlbum(url, spoilers);

            let folderName = h.basename(url);

            if (!props || props.status !== 'ok' || !props.data) {
                if (props && props.status === 'error-passwordRequired') {
                    log.host.error(postId, `::Password required (no valid password found)::: ${url}`, 'gofile.io');
                } else {
                    log.host.error(postId, `::Unable to resolve album::: ${url}`, 'gofile.io');
                }

                return {
                    dom: null,
                    source: null,
                    folderName,
                    resolved: [],
                };
            }

            const resolved = [];

            // Some /d/ links point directly at a file — /contents/{id} then
            // returns data.type === 'file' with no data.children.
            const resolveGofileFileLink = obj => {
                if (!obj) return null;

                const fileId = obj.id || obj.code;
                const fileName = encodeURIComponent(obj.name || fileId || 'file');

                // Prefer direct/CDN links when available; do NOT force
                // /download/web/ (the web flow can return album HTML).
                const candidates = [obj.directLink, obj.link, obj.downloadLink].filter(Boolean);
                const link =
                    candidates.find(u => /\/download\/direct\//i.test(String(u))) ||
                    candidates[0] ||
                    (fileId ? `https://gofile.io/download/web/${fileId}/${fileName}` : null);

                if (link && obj.name && fileId) {
                    gofileNameById.set(String(fileId), String(obj.name));
                    gofileNameByUrl.set(String(link), String(obj.name));
                }

                return link;
            };

            const getChildAlbums = async (childProps, currentSpoilers) => {
                if (!childProps || childProps.status !== 'ok' || !childProps.data) {
                    return [];
                }

                const currentResolved = [];

                folderName = childProps.data.name || folderName;

                if (childProps.data.type === 'file') {
                    const link = resolveGofileFileLink(childProps.data);
                    if (link) currentResolved.push(link);
                    return currentResolved;
                }

                if (!childProps.data.children) {
                    return [];
                }

                const files = childProps.data.children;

                for (const fileKey in files) {
                    if (!Object.prototype.hasOwnProperty.call(files, fileKey)) continue;
                    const obj = files[fileKey];

                    if (!obj) continue;

                    if (obj.type === 'file') {
                        const link = resolveGofileFileLink(obj);
                        if (link) currentResolved.push(link);
                    } else if (obj.type === 'folder') {
                        const folderId = obj.id || obj.code;
                        if (!folderId) continue;

                        try {
                            const folderProps = await resolveAlbum(folderId, currentSpoilers);
                            currentResolved.push(...(await getChildAlbums(folderProps, currentSpoilers)));
                        } catch (error) {
                            log.host.error(postId, `::Error resolving Gofile subfolder ${folderId}::: ${error.message}`, 'gofile.io');
                        }
                    }
                }

                return currentResolved;
            };

            resolved.push(...(await getChildAlbums(props, spoilers)));

            if (!resolved.length) {
                log.host.warn(postId, `::Empty album::: ${url}`, 'gofile.io');
            }

            return {
                dom: null,
                source: null,
                folderName,
                resolved,
            };
        },
    ],
    /* v1.12.0 (round 6): Filester /d/ + /f/ via the v2 token API — resolve as
     * late as possible (tokens are IP-bound, ~30 min TTL) (lineage L5433+,
     * v2 core). The /f/ album walker lists div.file-item rows. */
    [
        [/filester\.(me|sh|si|gg)\/d\//],
        async (url, http, spoilers, postId) => {
            try {
                let clean = String(url || '').trim();
                if (clean.startsWith('//')) clean = 'https:' + clean;
                if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean.replace(/^\/+/, '');

                const u = new URL(clean);
                const origin = `${u.protocol}//${u.hostname}`;
                const mSlug = (u.pathname || '').match(/\/d\/([^\/?#]+)/i);
                if (!mSlug || !mSlug[1]) return null;

                const slug = mSlug[1];
                const result = await filesterResolveV2(http, origin, slug);
                if (!result) {
                    log.host.error(postId, `::Could not resolve Filester download token::: ${url}`, 'filester');
                    return null;
                }
                return result.url;
            } catch (error) {
                log.host.error(postId, `::Error resolving Filester link ${url}::: ${error.message}`, 'filester');
                return null;
            }
        },
    ],
    [
        [/filester\.(me|sh|si|gg)\/f\//],
        async (url, http, spoilers, postId) => {
            try {
                let clean = String(url || '').trim();
                if (!clean) return null;
                if (clean.startsWith('//')) clean = 'https:' + clean;
                if (!/^https?:\/\//i.test(clean)) clean = 'https://' + clean.replace(/^\/+/, '');

                const u0 = new URL(clean);
                const origin = `${u0.protocol}//${u0.hostname}`;

                const mId = (u0.pathname || '').match(/\/f\/([^\/?#]+)/i);
                if (!mId || !mId[1]) return clean;

                const albumId = mId[1];
                const baseUrl = `${origin}/f/${albumId}`;

                const { dom, source } = await http.get(baseUrl);

                // Folder name: og:title / <title> with site suffixes stripped.
                const pickClean = s => {
                    let t = String(s || '').trim();
                    if (!t) return '';
                    t = t.replace(/\s*\|\s*filester\.(me|sh|si|gg)\s*$/i, '').trim();
                    t = t.replace(/\s*-\s*filester\.(me|sh|si|gg)\s*$/i, '').trim();
                    if (t.includes('|')) t = t.replace(/\s*\|\s*/g, ' - ').trim();
                    t = t.replace(/\s+/g, ' ').trim();
                    return t;
                };

                let title = '';
                try {
                    title = pickClean(dom?.querySelector('meta[property="og:title"]')?.getAttribute('content') || '');
                } catch (e) { console.debug('[Forums++] filester og:title read rejected:', e && e.message); }
                if (!title) {
                    try {
                        title = pickClean(dom?.querySelector('title')?.textContent || '');
                    } catch (e) { console.debug('[Forums++] filester title read rejected:', e && e.message); }
                }
                if (!title || /^filester\.(me|sh|si|gg)\b/i.test(title) || /BETA\s*\d/i.test(title)) {
                    title = albumId;
                }

                // Album rows: div.file-item with /d/<slug> in the onclick or a
                // download button.
                const slugs = [];
                const seen = new Set();
                for (const el of [...(dom ? dom.querySelectorAll('div.file-item') : [])]) {
                    let slug = '';
                    try {
                        const oc = String(el.getAttribute('onclick') || '');
                        const m = /\/d\/([^'"?\s]+)/i.exec(oc);
                        if (m && m[1]) slug = m[1];
                    } catch (e) { console.debug('[Forums++] filester row onclick read rejected:', e && e.message); }

                    if (!slug) {
                        try {
                            const btn = el.querySelector('button.download-btn');
                            const oc2 = String(btn?.getAttribute?.('onclick') || '');
                            const m2 = /downloadFile\(\s*'([^']+)'/i.exec(oc2);
                            if (m2 && m2[1]) slug = m2[1];
                        } catch (e) { console.debug('[Forums++] filester row button read rejected:', e && e.message); }
                    }

                    if (slug && !seen.has(slug)) {
                        seen.add(slug);
                        slugs.push(slug);
                    }
                }

                // Regex fallback when the DOM shape drifts.
                if (!slugs.length && source) {
                    for (const m of source.matchAll(/\/d\/([A-Za-z0-9_-]{4,})/g)) {
                        if (!seen.has(m[1])) {
                            seen.add(m[1]);
                            slugs.push(m[1]);
                        }
                    }
                }

                if (!slugs.length) return clean;

                const resolved = [];
                for (const slug of slugs) {
                    const result = await filesterResolveV2(http, origin, slug);
                    if (result && result.url) {
                        resolved.push(result.url);
                    } else {
                        log.host.warn(postId, `::Filester album file not resolvable::: ${baseUrl}/d/${slug}`, 'filester');
                    }
                }

                return {
                    dom,
                    source,
                    folderName: title,
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving Filester album ${url}::: ${error.message}`, 'filester');
                return null;
            }
        },
    ],
    [
        [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers, postId) => {
            try {
                const { source } = await http.get(url);
                const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)?.[0];
                if (!u) {
                    log.host.error(postId, `::Could not extract file ID from Cyberfile URL::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const getFileInfo = async () => {
                    const { source: fileInfoSource } = await http.post(
                        'https://cyberfile.me/account/ajax/file_details',
                        `u=${u}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    return fileInfoSource;
                };

                let response = await getFileInfo();
                let requiredPassword = false;
                let unlocked = false;

                if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers?.length) {
                    const html = JSON.parse(response)?.html;
                    const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html ?? '');
                    const folderId = matches?.[1] || matches?.[2];

                    if (!folderId) {
                        log.host.error(postId, `::Could not extract folder ID for password protected Cyberfile::: ${url}`, 'cyberfile.su');
                        return null;
                    }

                    requiredPassword = true;
                    for (const password of spoilers) {
                        try {
                            const { source: passwordSource } = await http.post(
                                'https://cyberfile.me/ajax/folder_password_process',
                                `submitme=1&folderId=${folderId}&folderPassword=${password}`,
                                {},
                                { 'Content-Type': 'application/x-www-form-urlencoded' },
                            );
                            if (h.contains('success', passwordSource) && JSON.parse(passwordSource)?.success === true) {
                                unlocked = true;
                                break;
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Attempt with password '${password}' failed for Cyberfile::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                if (requiredPassword && !unlocked) {
                    log.host.error(postId, `::Failed to unlock password protected Cyberfile::: ${url}`, 'cyberfile.su');
                    return null;
                }

                if (requiredPassword && unlocked) {
                    response = await getFileInfo(); // Re-fetch info after unlocking
                }

                return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)?.[0]?.replace(/\\\//gi, '/');
            } catch (error) {
                log.host.error(postId, `::Error resolving Cyberfile direct link ${url}::: ${error.message}`, 'cyberfile.su');
                return null;
            }
        },
    ],
    [
        [/cyberfile.(su|me)\/folder\//],
        async (url, http, spoilers, postId) => {
            try {
                const { source, dom } = await http.get(url);
                const script = [...(dom.querySelectorAll('script') ?? [])].map(s => s.innerText).find(s => h.contains('data-toggle="tab"', s));
                if (!script) {
                    log.host.error(postId, `::Could not find script with folder data for Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script)?.[0];
                if (!nodeId) {
                    log.host.error(postId, `::Could not extract node ID for Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                const loadFiles = async () => {
                    const { source: filesSource } = await http.post(
                        'https://cyberfile.me/account/ajax/load_files',
                        `pageType=folder&nodeId=${nodeId}`,
                        {},
                        { 'Content-Type': 'application/x-www-form-urlencoded' },
                    );
                    return filesSource;
                };

                let response = await loadFiles();
                let requiredPassword = false;
                let unlocked = false;

                if ((h.contains('albumPasswordModel', response) || h.contains('This folder requires a password', response)) && spoilers?.length) {
                    requiredPassword = true;
                    for (const password of spoilers) {
                        try {
                            const { source: passwordSource } = await http.post(
                                'https://cyberfile.me/ajax/folder_password_process',
                                `submitme=1&folderId=${nodeId}&folderPassword=${password}`,
                                {},
                                { 'Content-Type': 'application/x-www-form-urlencoded' },
                            );
                            if (h.contains('success', passwordSource) && JSON.parse(passwordSource)?.success === true) {
                                unlocked = true;
                                break;
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Attempt with password '${password}' failed for Cyberfile album::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                if (requiredPassword && !unlocked) {
                    log.host.error(postId, `::Failed to unlock password protected Cyberfile album::: ${url}`, 'cyberfile.su');
                    return null;
                }

                if (requiredPassword && unlocked) {
                    response = await loadFiles(); // Re-fetch files after unlocking
                }

                const resolved = [];
                let folderName = h.basename(url);
                const props = JSON.parse(response ?? '{}');

                if (props?.html) {
                    folderName = props.page_title || folderName;
                    const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);

                    for (const fileUrl of urls) {
                        try {
                            const { source: filePageSource } = await http.get(fileUrl);
                            const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, filePageSource)?.[0];
                            if (u) {
                                const { source: fileDetailsResponse } = await http.post(
                                    'https://cyberfile.me/account/ajax/file_details',
                                    `u=${u}`,
                                    {},
                                    { 'Content-Type': 'application/x-www-form-urlencoded' },
                                );
                                const finalFileUrl = h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, fileDetailsResponse)?.[0]?.replace(/\\\//gi, '/');
                                if (finalFileUrl) {
                                    resolved.push(finalFileUrl);
                                }
                            }
                        } catch (error) {
                            log.host.warn(postId, `::Error resolving Cyberfile album file ${fileUrl}::: ${error.message}`, 'cyberfile.su');
                        }
                    }
                }

                return { dom, source, folderName, resolved };
            } catch (error) {
                log.host.error(postId, `::Error resolving Cyberfile album ${url}::: ${error.message}`, 'cyberfile.su');
                return null;
            }
        },
    ],
    [[/([~an@]+\.)?saint2.(su|pk|cr)\/videos/], async url => url],
    [[/public.onlyfans.com\/files/], async url => url],
    /* v1.12.0 (round 6): the turbo/saint2 family — sign API first (5 s timeout,
     * 2 jittered retries, fn= filename preservation), embed <source>/<video> DOM
     * fallback, then the /d/ route as the last resort (lineage L4376-4542). */
    [
        [/(([\w-]+\.)?(saint2.(su|pk|cr)|turbo\.cr))\/a\//],
        async (url, http, spoilers, postId) => {
            try {
                const { dom, source } = await http.get(url);

                // Album folder naming (stable + readable): turbo_<albumId> - <title>
                const mAlbum = url.match(/\/a\/([^\/?#]+)/i);
                const albumId = mAlbum ? mAlbum[1] : null;
                const base = albumId ? `turbo_${albumId}` : 'turbo_album';

                const rawTitle = dom?.querySelector('h1')?.textContent?.trim() || '';
                const invalidSub = settings.naming.invalidCharSubstitute || '_';

                let safeTitle = rawTitle
                    .replace(/[\\/:*?"<>|]/g, invalidSub)
                    .replace(/\s+/g, ' ')
                    .trim();

                // Cap title to avoid extremely long Windows paths.
                if (safeTitle.length > 120) safeTitle = safeTitle.slice(0, 120).trim();

                let folderName = base;
                if (safeTitle && safeTitle.toLowerCase() !== base.toLowerCase()) {
                    folderName = `${safeTitle} - ${base}`;
                }

                folderName = folderName
                    .replace(/[\\/:*?"<>|]/g, invalidSub)
                    .replace(/\s+/g, ' ')
                    .trim();

                if (folderName.length > 180) folderName = folderName.slice(0, 180).trim();

                // Map videoId -> original filename (from the album table rows).
                const idToName = new Map();

                let ids = Array.from(dom?.querySelectorAll('tr.file-row') || [])
                    .map(row => {
                        const a = row.querySelector('a[href^="/v/"]');
                        const id = (a?.getAttribute('href') || '').match(/\/v\/([^\/?#]+)/i)?.[1];
                        if (id) {
                            const nm = row.getAttribute('data-name') || row.dataset?.name;
                            if (nm) idToName.set(id, nm);
                        }
                        return id;
                    })
                    .filter(Boolean)
                    .unique();

                // Fallback: regex scan (if DOM parsing fails).
                if (!ids.length && source) {
                    ids = (source.match(/href="\/v\/([^"?#]+)"/gi) || [])
                        .map(s => (s.match(/\/v\/([^"?#]+)/i) || [null, null])[1])
                        .filter(Boolean)
                        .unique();
                }

                const resolved = [];

                for (const id of ids) {
                    const embedUrl = `${xfpdTurboOrigin(url)}/embed/${id}`;
                    let signed = null;
                    try {
                        signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, idToName.get(id));
                    } catch (e) {
                        console.debug('[Forums++] turbo album sign rejected for one id:', e && e.message);
                    }

                    // Fallback: read the media URL from the embed page.
                    if (!signed) {
                        try {
                            const { dom: edom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                            const src =
                                  edom?.querySelector('source[src]')?.getAttribute('src') ||
                                  edom?.querySelector('video[src]')?.getAttribute('src');
                            if (src) {
                                signed = new URL(src, embedUrl).toString();
                            }
                        } catch (e) {
                            console.debug('[Forums++] turbo album embed fallback rejected:', e && e.message);
                        }
                    }

                    // Attach the original name to CDN URLs.
                    if (signed && /turbocdn\.st/i.test(signed)) {
                        const originalName = idToName.get(id);
                        if (originalName && !/[?&]fn=/.test(signed)) {
                            const enc = encodeURIComponent(String(originalName)).replace(/%20/g, '+');
                            signed += (signed.includes('?') ? '&' : '?') + 'fn=' + enc;
                        }
                    }

                    if (signed && id) {
                        turboIdBySignedUrl.set(String(signed), String(id)); // stall re-sign state
                    }
                    resolved.push(signed || `${xfpdTurboOrigin(url)}/d/${id}`);
                }

                return {
                    dom,
                    source,
                    folderName,
                    resolved,
                };
            } catch (error) {
                log.host.error(postId, `::Error resolving turbo/saint2 album ${url}::: ${error.message}`, 'turbo.cr');
                return null;
            }
        },
    ],
    [
        [/(([\w-]+\.)?(saint2.(su|pk|cr)|turbo\.cr))\/(v|d)\//],
        async (url, http, _, postId) => {
            const mm = url.match(/\/(v|d)\/([^\/?#]+)/i);
            const id = mm ? mm[2] : null;
            /* v1.13.8 (15a F03): a bare /v or /d route with no id used to
             * be RETURNED as the resolved media URL — the downloader then
             * fetched an HTML page as the "video" (silent wrong-behavior,
             * the FPP-RES-09 sibling class). Named and refused now; a
             * query-carrying URL keeps the legacy pass-through (it may
             * still be a genuine direct route). */
            if (!id) {
                if (url.includes('?')) return url;
                log.host.error(postId, `::Malformed turbo/saint2 link (no id)::: ${url}`, 'turbo.cr');
                return null;
            }

            const origin = xfpdTurboOrigin(url);
            const embedUrl = `${origin}/embed/${id}`;
            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, embedUrl, null);
                if (signed) {
                    turboIdBySignedUrl.set(String(signed), String(id));
                    return signed;
                }
            } catch (e) {
                console.debug('[Forums++] turbo single sign rejected:', e && e.message);
            }

            // Fallback: read <source>/<video> directly from the embed page.
            try {
                const { dom } = await http.get(embedUrl, {}, { Referer: embedUrl });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) {
                    return new URL(src, embedUrl).toString();
                }
            } catch (e) {
                console.debug('[Forums++] turbo single embed fallback rejected:', e && e.message);
            }

            // Last fallback: the site's direct download route.
            return `${origin}/d/${id}`;
        },
    ],
    [
        [/(([\w-]+\.)?(saint2.(su|pk|cr)|turbo\.cr))\/embed\//],
        async (url, http, _, postId) => {
            const m = url.match(/\/embed\/([^\/?#]+)/i);
            const id = m ? m[1] : null;
            /* v1.13.8 (15a F02): the bare embed — an href ".../embed/" walks
             * to "https://turbo.cr/embed" once the trailing slash is
             * stripped — died as a generic "could not resolve" with zero
             * diagnosis (FPP-RES-09). Named now: the link itself carries
             * no id; no resolver can invent one. */
            if (!id) {
                log.host.error(postId, `::Malformed turbo/saint2 embed link (no id)::: ${url}`, 'turbo.cr');
                return null;
            }

            try {
                const signed = await xfpdTurboSignUrlWithTimeout(id, url, null);
                if (signed) {
                    turboIdBySignedUrl.set(String(signed), String(id));
                    return signed;
                }
            } catch (e) {
                console.debug('[Forums++] turbo embed sign rejected:', e && e.message);
            }

            try {
                const { dom } = await http.get(url, {}, { Referer: url });
                const src =
                      dom?.querySelector('source[src]')?.getAttribute('src') ||
                      dom?.querySelector('video[src]')?.getAttribute('src');
                if (src) {
                    return new URL(src, url).toString();
                }
            } catch (e) {
                console.debug('[Forums++] turbo embed DOM fallback rejected:', e && e.message);
            }

            return null;
        },
    ],
    /* v1.12.0 (round 6): Redgifs users pagination walker — count=80 pages,
     * 429 backoff, token refresh on 401/403 (lineage L4544-4692). */
    [
        [/redgifs\.com\/users\//i],
        async (url, http, spoilers, postId, postSettings, progressCB) => {
            const raw = String(url || '');
            const m = raw.match(/redgifs\.com\/users\/([^\/?#]+)/i);
            /* v1.13.7 (13b-F12): guarded decode — a username carrying a bare
             * '%' threw URIError before the resolver's own catch could
             * degrade it, nulling the whole profile walk. */
            let username = m && m[1] ? m[1] : '';
            if (username) {
                try { username = decodeURIComponent(username); } catch (e) { console.debug('Forums++: redgifs username kept raw:', e && e.message); }
            }

            if (!username) {
                return null;
            }

            const baseUrl = `https://www.redgifs.com/users/${username}`;

            let token = GM_getValue('redgifs_token', null);
            if (!token) {
                token = await redgifsFetchTempToken();
            }
            if (!token) {
                log.host.error(postId, `::Could not obtain redgifs token::: ${baseUrl}`, 'redgifs.com');
                return null;
            }

            const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
            const resolved = [];

            const MAX_PAGES = 5000;
            const COUNT = 80;
            const ORDER = 'new';

            const fetchPage = async (page, t) => {
                const apiUrl = `https://api.redgifs.com/v2/users/${encodeURIComponent(username)}/search?order=${ORDER}&page=${page}&count=${COUNT}`;
                try {
                    return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                } catch (e) {
                    return { source: null, status: 0 };
                }
            };

            const tryFetchPage = async page => {
                let attempt = 0;
                let last = { source: null, status: 0 };

                while (attempt < 3) {
                    attempt++;

                    last = await fetchPage(page, token);

                    if (last.status === 429) {
                        await xfpdSleepMs(800 * attempt);
                        continue;
                    }

                    if (last.status === 401 || last.status === 403 || (last.source && /unauthorized|forbidden/i.test(last.source))) {
                        token = await redgifsFetchTempToken();
                        if (!token) {
                            return last;
                        }
                        last = await fetchPage(page, token);
                    }

                    return last;
                }

                return last;
            };

            let pages = 1;

            for (let page = 1; page <= pages && page <= MAX_PAGES; page++) {
                if (typeof progressCB === 'function') {
                    progressCB(`Resolving: ${baseUrl} (page ${page}/${pages})`);
                }

                const { source, status } = await tryFetchPage(page);

                if (status !== 200 || !source) {
                    break;
                }

                let j;
                try {
                    j = JSON.parse(source);
                } catch (e) {
                    break;
                }

                const gifs = Array.isArray(j?.gifs) ? j.gifs : (Array.isArray(j?.results) ? j.results : []);
                pages = Number(j?.pages) || pages;

                for (const g of gifs) {
                    const urls = g?.urls || g?.gif?.urls;
                    if (!urls) {
                        continue;
                    }

                    let best = null;

                    for (const k of preferredKeys) {
                        const v = urls[k];
                        if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
                            best = v;
                            break;
                        }
                    }

                    if (!best) {
                        for (const v of Object.values(urls)) {
                            if (typeof v === 'string' && /^https?:\/\//i.test(v) && /\.mp4(\?|$)/i.test(v)) {
                                best = v;
                                break;
                            }
                        }
                    }

                    if (best) {
                        resolved.push(best);
                    }
                }

                if (!gifs.length) {
                    break;
                }

                await xfpdSleepMs(75);
            }

            if (!resolved.length) {
                return null;
            }

            return {
                folderName: username,
                resolved,
            };
        },
    ],
    /* v1.12.0 (round 6): ifr/watch/detail single gifs — token refresh on
     * 401/403 before giving up (lineage L4693-4780). */
    [
        [/redgifs.com(\/|\\\/)(ifr|watch|gifs\/detail|gifs\/watch)/i],
        async (url, http) => {
            try {
                const raw = String(url || '');
                const idMatch =
                      raw.match(/redgifs\.com(?:\/|\\\/)(?:ifr(?:\/|\\\/)|watch(?:\/|\\\/)|gifs(?:\/|\\\/)detail(?:\/|\\\/))?([a-z0-9_-]+)/i) ||
                      raw.match(/\/([a-z0-9_-]+)(?:\?.*)?$/i);
                const id = (idMatch && idMatch[1] ? String(idMatch[1]) : '').match(/[a-z0-9_-]+/i)?.[0];

                if (!id) {
                    return null;
                }

                let token = GM_getValue('redgifs_token', null);
                if (!token) {
                    token = await redgifsFetchTempToken();
                }
                if (!token) {
                    return null;
                }

                const apiUrl = `https://api.redgifs.com/v2/gifs/${id}`;

                const fetchGif = async t => {
                    try {
                        return await http.get(apiUrl, {}, { Authorization: `Bearer ${t}` }, 'text');
                    } catch (e) {
                        return { source: null, status: 0 };
                    }
                };

                let { source, status } = await fetchGif(token);

                if (status === 401 || status === 403 || (source && /unauthorized|forbidden/i.test(source))) {
                    token = await redgifsFetchTempToken();
                    if (!token) {
                        return null;
                    }
                    ({ source, status } = await fetchGif(token));
                }

                if (status !== 200 || !source) {
                    return null;
                }

                let j;
                try {
                    j = JSON.parse(source);
                } catch (e) {
                    return null;
                }

                const urls = j?.gif?.urls || j?.urls;
                if (!urls) {
                    return null;
                }

                const preferredKeys = ['hd', 'hd1080', 'hd720', 'sd', 'mp4'];
                for (const k of preferredKeys) {
                    const v = urls[k];
                    if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
                        return v;
                    }
                }

                for (const v of Object.values(urls)) {
                    if (typeof v === 'string' && /\.mp4(\?|$)/i.test(v)) {
                        return v;
                    }
                }

                return null;
            } catch (error) {
                console.error(`Error resolving Redgifs: ${error.message}`);
                return null;
            }
        },
    ],
    /* v1.12.0 (round 6): Cyberdrop's live API ladder — album /a/ pages list
     * /f/ slugs; each resolves via api.cyberdrop.cr /api/file/auth/<slug> (with
     * the page-origin api base tried first); the single-file ladder walks the
     * info → auth → tokenized-direct candidates, then a warm-up tab retry
     * (lineage L4782-5291, L8968-9018). Name hints ride the bounded maps.
     * TLD contract (v1.13.0): the matchers accept any cyberdrop.<tld>, the
     * transports carry tokens for the seven known live roots (me/cc/ch/
     * cloud/nl/to/cr — 7a F07); a rotation to a new root needs the @connect
     * token and (for the api.<root> ladder) nothing else — the generic
     * matcher already collects it. */
    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http, spoilers, postId, postSettings, progressCB) => {
            try {
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

                const albumIdMatch = url.match(/\/a\/([^\/?#]+)/i);
                const albumId = albumIdMatch ? albumIdMatch[1] : '';

                const pageUrl = url;
                let pageOrigin = 'https://cyberdrop.cr';
                try { pageOrigin = new URL(pageUrl).origin; } catch (e) { console.debug('[Forums++] cyberdrop album origin parse rejected:', e && e.message); }

                const getAlbumHtml = async () => {
                    if (typeof progressCB === 'function') progressCB('Cyberdrop: loading album page');
                    const r = await http.get(pageUrl, {}, {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Referer': pageOrigin + '/',
                        'Origin': pageOrigin,
                    }, 'text');
                    return r && r.source ? r.source : '';
                };

                let html = await getAlbumHtml();

                const extractSlugs = src => {
                    const slugs = [];
                    const seen = new Set();
                    const re = /href\s*=\s*["'](?:https?:\/\/(?:[\w-]+\.)*cyberdrop\.[a-z.]+)?\/f\/([A-Za-z0-9_-]+)(?:[\/?#"'])/ig;
                    let m;
                    while ((m = re.exec(src || '')) !== null) {
                        const s = m[1];
                        if (s && !seen.has(s)) {
                            seen.add(s);
                            slugs.push(s);
                        }
                    }
                    return slugs;
                };

                let slugs = extractSlugs(html);

                // If the HTML is gated/empty, warm the album page once and retry.
                if (!slugs.length) {
                    await cyberdropWarmupOnce(pageUrl);
                    html = await getAlbumHtml();
                    slugs = extractSlugs(html);
                }

                if (!slugs.length) return url;

                const pickTitle = src => {
                    const m1 = src.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                               src.match(/content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
                    const m2 = src.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    const m3 = src.match(/<title[^>]*>([^<]+)<\/title>/i);
                    let t = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || '';
                    t = t.trim();
                    t = t.replace(/\s*\|\s*CyberDrop.*$/i, '').replace(/\s*-\s*CyberDrop.*$/i, '').trim();
                    if (!t) t = albumId ? `cyberdrop_${albumId}` : 'cyberdrop_album';
                    return t;
                };

                const folderName = pickTitle(html);

                // Per-file names from the album page (regex form — the album grid
                // carries title= hints) so downloads keep extensions.
                try {
                    const rxName = /href=["']\/f\/([A-Za-z0-9]+)["'][^>]*\btitle=["']([^"']+)["']/gi;
                    let m;
                    while ((m = rxName.exec(html)) !== null) {
                        const slug = m[1];
                        const nm = String(m[2]).trim();
                        if (nm) cyberdropNameBySlug.set(slug, nm);
                    }
                } catch (e) {
                    console.debug('[Forums++] cyberdrop album name hints rejected:', e && e.message);
                }

                const host = (() => { try { return new URL(pageUrl).hostname; } catch (e) { return ''; } })();
                const root = (String(host || '').match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBases = [];
                if (root) apiBases.push(`https://api.${root}`);
                apiBases.push('https://api.cyberdrop.cr');

                const resolved = [];
                for (let i = 0; i < slugs.length; i++) {
                    const slug = slugs[i];
                    if (typeof progressCB === 'function') progressCB(`Cyberdrop: resolving ${i + 1}/${slugs.length}`);

                    let j = null;

                    for (const base of apiBases) {
                        const apiUrl = `${base}/api/file/auth/${slug}`;

                        const r = await http.get(apiUrl, {}, {
                            'Accept': 'application/json, text/plain, */*',
                            'Origin': pageOrigin,
                            'Referer': pageOrigin + '/',
                        }, 'text');

                        if (!r || !r.source) continue;

                        try { j = JSON.parse(r.source); } catch (e) { j = null; }
                        if (j) break;
                    }

                    if (!j) continue;

                    let direct = null;
                    if (typeof j.url === 'string') direct = j.url;
                    else if (j.data && typeof j.data.url === 'string') direct = j.data.url;
                    else if (typeof j.file === 'string') direct = j.file;
                    else if (j.data && typeof j.data.file === 'string') direct = j.data.file;

                    if (typeof direct !== 'string' || !direct.trim()) continue;
                    direct = direct.trim();
                    if (direct.startsWith('//')) direct = 'https:' + direct;

                    if (!/^https?:\/\//i.test(direct)) continue;
                    resolved.push(direct);
                }

                if (!resolved.length) return url;

                return { folderName, resolved };
            } catch (error) {
                log.host.error(postId, `::Error resolving Cyberdrop album ${url}::: ${error.message}`, 'cyberdrop');
                return url;
            }
        },
    ],
    [
        [/fs-\d+\.cyberdrop\.[a-z]{2,}\/|cyberdrop\.[a-z]{2,}\/(f|e)\//, /:!cyberdrop\.[a-z]{2,}\/a\//],
        async (url, http) => {
            // Cyberdrop embeds (/e/) expose the real file URL only after loading
            // the /f/ page. Preferred: the info API ladder; on failure, warm up
            // /f/ in an inactive tab once and retry.
            try {
                url = String(url || '').trim();
                if (url.startsWith('//')) url = 'https:' + url;
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');

                // Normalize legacy fs-*/img-* hosts (old mirrors).
                if (url.includes('fs-') || url.includes('img-')) {
                    url = url.replace(/(fs|img)-\d+/i, '').replace(/(to|cc|nl)-\d+/i, 'me');
                }

                const u = new URL(url);
                const origin = `${u.protocol}//${u.hostname}`;
                const slugMatch = String(url).match(/\/([ef])\/([^\/?#]+)/i);
                if (!slugMatch || !slugMatch[2]) {
                    return url;
                }

                const slug = slugMatch[2];
                const pageUrl = `${origin}/f/${slug}`;

                const root = (u.hostname.match(/cyberdrop\.[a-z]+$/i) || [null])[0];
                const apiBaseDefault = root ? `https://api.${root}` : 'https://api.cyberdrop.cr';

                // Candidate ladder: new API styles first, legacy style last.
                const apiCandidates = [];
                if (root) {
                    apiCandidates.push(`https://api.${root}/api/file/info/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/auth/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/url/${slug}`);
                    apiCandidates.push(`https://api.${root}/api/file/${slug}`);
                }
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/info/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/auth/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/url/${slug}`);
                apiCandidates.push(`https://api.cyberdrop.cr/api/file/${slug}`);
                apiCandidates.push(`${origin}/api/f/${slug}`);

                const headers = {
                    Accept: 'application/json, text/plain, */*',
                    Referer: `${origin}/`,
                    Origin: origin,
                };

                const cyberdropGmGetText = (reqUrl, hdrs) =>
                    fppGmFetch(String(reqUrl), { method: 'GET', timeout: 6000, headers: hdrs || {}, checkStatus: false })
                        .then(r => ({ status: r.status || 0, source: String(r.responseText || r.response || '') }))
                        .catch(e => {
                            console.debug('[Forums++] cyberdrop ladder transport rejected:', e && (e.message || e.kind));
                            return { status: 0, source: '' };
                        });

                const cyberdropFetchText = async reqUrl => {
                    let r = await cyberdropGmGetText(reqUrl, headers);
                    if ((r.status === 0) && (headers.Origin || headers.Referer)) {
                        r = await cyberdropGmGetText(reqUrl, { Accept: headers.Accept });
                    }
                    return r;
                };

                const looksLikeName = v => {
                    if (!v || typeof v !== 'string') return false;
                    if (v.length > 260) return false;
                    if (/^https?:\/\//i.test(v)) return false;
                    const base = v.split(/[\\/]/).pop();
                    return /^[^<>:"|?*\x00-\x1F]+\.[a-z0-9]{2,8}$/i.test(base);
                };

                const looksLikeJwt = v => {
                    if (!v || typeof v !== 'string') return false;
                    return /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v);
                };

                const parseInfoText = txt => {
                    const out = { direct: null, name: null, token: null, base: null, auth: null };
                    const s = String(txt || '');
                    if (!s) return out;

                    /* v1.13.7 (13b-F13): the slug is page-sourced text — escape
                     * it before RegExp interpolation; a slug carrying regex
                     * metachars threw SyntaxError in the constructor and the
                     * ladder dropped the file. The isTokenUrl string compare
                     * below stays raw (plain substring, no regex). */
                    const slugRe = String(slug || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // 1) Quick regex for an absolute token URL (plain or JSON-escaped).
                    const rePlain = new RegExp(`https?:\/\/[^"'\s]+\/api\/file\/d\/${slugRe}\?[^"'\s]*token=[^"'\s]+`, 'i');
                    let m = s.match(rePlain);
                    if (m && m[0]) out.direct = m[0];

                    if (!out.direct) {
                        const reEsc = new RegExp(`https?:\\\/\\\/[^"\s]+\\\/api\\\/file\\\/d\\\/${slugRe}\\\?[^"\s]*token=[^"\s]+`, 'i');
                        m = s.match(reEsc);
                        if (m && m[0]) out.direct = m[0].replace(/\\\//g, '/');
                    }

                    // 2) Relative token URL.
                    if (!out.direct) {
                        const reRel = new RegExp(`\/api\/file\/d\/${slugRe}\?[^"'\s]*token=[^"'\s]+`, 'i');
                        m = s.match(reRel);
                        if (m && m[0]) out.direct = `${apiBaseDefault}${m[0]}`;
                    }

                    // 3) JSON deep scan for direct/name/token/base/auth fields.
                    try {
                        const j = JSON.parse(s);
                        const seen = new Set();

                        const isTokenUrl = v => {
                            return typeof v === 'string' && v.includes(`/api/file/d/${slug}`) && /token=/i.test(v);
                        };

                        const walk = (val, key = '') => {
                            if (val === null || val === undefined) return;

                            if (typeof val === 'string') {
                                const v = val;

                                if (isTokenUrl(v) && (!out.direct || v.length > out.direct.length)) out.direct = v;

                                if (!out.name && looksLikeName(v)) {
                                    out.name = v.split(/[\\/]/).pop();
                                }

                                if (!out.token && looksLikeJwt(v)) {
                                    out.token = v;
                                }

                                if (!out.auth && /\/api\/file\/auth\//i.test(v) && /cyberdrop/i.test(v)) {
                                    out.auth = v;
                                }

                                return;
                            }

                            if (typeof val !== 'object') return;
                            if (seen.has(val)) return;
                            seen.add(val);

                            if (Array.isArray(val)) {
                                for (const v of val) walk(v, key);
                            } else {
                                for (const [k, v] of Object.entries(val)) walk(v, k);
                            }
                        };

                        walk(j, '');

                        // Common direct/auth/name fields.
                        if (!out.direct) {
                            const direct =
                                (j && (j.url || j.downloadUrl || j.download_url ||
                                    (j.data && (j.data.url || j.data.downloadUrl || j.data.download_url)) ||
                                    (j.file && (j.file.url || j.file.downloadUrl || j.file.download_url)))) || null;
                            if (direct && typeof direct === 'string') out.direct = direct;
                        }
                        if (!out.auth) {
                            const a =
                                (j && (j.auth_url || j.authUrl ||
                                    (j.data && (j.data.auth_url || j.data.authUrl)) ||
                                    (j.file && (j.file.auth_url || j.file.authUrl)))) || null;
                            if (a && typeof a === 'string') out.auth = a;
                        }
                        if (!out.name) {
                            const n =
                                (j && (j.name || j.filename || j.fileName || j.originalName ||
                                    (j.file && (j.file.name || j.file.filename || j.file.originalName)) ||
                                    (j.data && (j.data.name || j.data.filename || j.data.originalName)))) || null;
                            if (n && typeof n === 'string' && looksLikeName(n)) out.name = n.split(/[\\/]/).pop();
                        }

                        // token without direct → build the tokenized URL.
                        if (!out.direct && out.token) {
                            const tok = out.token.includes('%') ? out.token : encodeURIComponent(out.token);
                            out.direct = `${apiBaseDefault.replace(/\/$/, '')}/api/file/d/${slug}?token=${tok}`;
                        }
                    } catch (e) {
                        console.debug('[Forums++] cyberdrop info JSON scan skipped:', e && e.message);
                    }

                    // Normalize escaped slashes / relative forms.
                    if (out.direct && typeof out.direct === 'string' && out.direct.includes('\\/')) {
                        out.direct = out.direct.replace(/\\\//g, '/');
                    }
                    if (out.direct && typeof out.direct === 'string' && out.direct.startsWith('/')) {
                        out.direct = `${apiBaseDefault}${out.direct}`;
                    }
                    if (out.auth && typeof out.auth === 'string') {
                        if (out.auth.includes('\\/')) out.auth = out.auth.replace(/\\\//g, '/');
                        if (out.auth.startsWith('/')) out.auth = `${apiBaseDefault}${out.auth}`;
                    }

                    return out;
                };

                const fetchInfo = async () => {
                    for (const apiUrl of apiCandidates) {
                        try {
                            const { source, status } = await cyberdropFetchText(apiUrl);
                            if (status !== 200 || !source) continue;

                            const { direct, name, auth } = parseInfoText(source);

                            let resolvedName = name || null;
                            let resolvedDirect = direct || null;

                            // New flow: info returns auth_url; auth returns the
                            // tokenized direct URL.
                            if (!resolvedDirect && auth && typeof auth === 'string') {
                                try {
                                    const { source: authSource, status: authStatus } = await cyberdropFetchText(auth);
                                    if (authStatus === 200 && authSource) {
                                        const parsedAuth = parseInfoText(authSource);
                                        if (!resolvedName && parsedAuth && parsedAuth.name) resolvedName = parsedAuth.name;
                                        if (!resolvedDirect && parsedAuth && parsedAuth.direct) resolvedDirect = parsedAuth.direct;
                                    }
                                } catch (e) {
                                    console.debug('[Forums++] cyberdrop auth step rejected:', e && e.message);
                                }
                            }

                            if (resolvedName) cyberdropNameBySlug.set(String(slug), String(resolvedName));

                            if (resolvedDirect && typeof resolvedDirect === 'string') {
                                if (resolvedName) cyberdropNameByUrl.set(String(resolvedDirect), String(resolvedName));
                                return resolvedDirect;
                            }
                        } catch (e) {
                            console.debug('[Forums++] cyberdrop ladder step rejected:', e && e.message);
                        }
                    }
                    return null;
                };

                // 1st attempt: API directly (some setups need two requests for
                // ddos-guard cookies).
                let directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                if (directUrl) return directUrl;

                // Warm-up (one tab at a time) then retry.
                let warmKey = 'cyberdrop';
                try { warmKey = `cyberdrop:${new URL(pageUrl).origin}`; } catch (e) { console.debug('[Forums++] cyberdrop warm key rejected:', e && e.message); }
                await cyberdropWarmupOnce(warmKey, pageUrl, CYBERDROP_WARMUP_DEFAULT_MS);

                directUrl = await fetchInfo();
                if (!directUrl) directUrl = await fetchInfo();
                return directUrl || url;
            } catch (error) {
                console.debug('[Forums++] cyberdrop single resolver rejected:', error && error.message);
                return url;
            }
        },
    ],
    /* v1.12.0 (round 6): Pornhub flashvars reassembly — var media_N strings
     * concatenated from the page's own variable table, then the get_media JSON
     * laddered by quality. The lineage's unbounded 20-retry loop is tamed to 5
     * attempts with logging (the lineage carried a TODO here; none survives). */
    [
        [/([~an@]+\.)?pornhub.com\/view_video/],
        async (url, http, spoilers, postId) => {
            try {
                url = url.replace(/([a-zA-Z0-9]+\.)?pornhub/, 'pornhub');

                const resolvePH = async phUrl => {
                    const { dom } = await http.get(
                        phUrl,
                        {},
                        {
                            referer: phUrl,
                            cookie: 'age-verified: 1; platform=tv; cookiesBannerSeen=1; hasVisited=1',
                        },
                    );
                    const script = [...dom.querySelectorAll('script')]
                        .map(s => s.innerText)
                        .filter(s => /var\smedia_\d+/gis.test(s))
                        .map(s => {
                            return {
                                mediaVars: h.re.matchAll(/var\smedia_\d+=.*?;/gis, s),
                                flashVars: s,
                            };
                        })[0];

                    if (!script) return null;

                    const { mediaVars, flashVars } = script;

                    return mediaVars
                        .map(m => {
                            const cleaned = m
                                .replace(/\/\*.*?\*\//gis, '')
                                .replace(/var\smedia_\d+=/i, '')
                                .replace(';', '');

                            return cleaned
                                .split('+')
                                .map(s => s.trim())
                                .map(s => {
                                    const valueMatch = new RegExp(`var ${s}=".*?"`, 'isg').exec(flashVars);
                                    if (!valueMatch) return '';
                                    return valueMatch[0].replace(/.*?"/i, '').replace(/"/i, '');
                                })
                                .join('');
                        })
                        .find(u => u.indexOf('pornhub.com/video/get_media?s=') > -1);
                };

                let parsed = null;
                let tries = 0;
                const MAX_TRIES = 5;

                // The site does not send the right json link on the first try;
                // there are also occasional 403s / redirects.
                do {
                    const infoURL = await resolvePH(url);

                    if (infoURL) {
                        try {
                            const { source } = await http.get(infoURL);
                            const json = JSON.parse(source);
                            const fetchedFormats = json.reverse();
                            const qualities = ['1080', '720', '480', '320', '240'];
                            for (const q of qualities) {
                                const f = fetchedFormats.find(f => f.quality === q);
                                if (f && f.videoUrl) {
                                    parsed = f.videoUrl;
                                    break;
                                }
                            }
                        } catch (e) {
                            console.debug('[Forums++] pornhub get_media step rejected:', e && e.message);
                        }
                    }
                    await h.delayedResolve(1000);
                    tries++;
                } while (!parsed && tries < MAX_TRIES);

                if (!parsed) {
                    log.host.error(postId, `::Could not resolve Pornhub stream (after ${MAX_TRIES} attempts)::: ${url}`, 'pornhub.com');
                }

                return parsed;
            } catch (error) {
                log.host.error(postId, `::Error resolving Pornhub video ${url}::: ${error.message}`, 'pornhub.com');
                return null;
            }
        },
    ],
    [
        [/noodlemagazine.com\/watch\//],
        async (url, http) => {
            try {
                const { dom } = await http.get(url);
                let playerIFrameUrl = dom.querySelector('#iplayer')?.getAttribute('src');

                if (!playerIFrameUrl) {
                    console.error('Noodlemagazine: Could not find player iframe.');
                    return null;
                }

                playerIFrameUrl = playerIFrameUrl.replace('/player/', 'https://noodlemagazine.com/playlist/');

                const { source } = await http.get(playerIFrameUrl);

                const props = JSON.parse(source || JSON.stringify([]));

                if (props.sources?.length) {
                    return props.sources[0].file;
                }

                return null;
            } catch (error) {
                console.error(`Error resolving Noodlemagazine: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/spankbang.com\/.*?\/video/],
        async (url, http) => {
            try {
                const { source } = await http.get(url);

                let streamDataMatch = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)?.[0];
                if (!streamDataMatch) return null;

                let streamData = streamDataMatch.replace(/'/g, '"');
                streamData = JSON.parse(streamData);

                const qualities = ['4k', '1080p', '720p', '480p', '320p', '240p']; // Ordered from best to worst

                for (const quality of qualities) {
                    if (streamData[quality]?.length) {
                        return streamData[quality][0];
                    }
                }

                return null;
            } catch (error) {
                console.error(`Error resolving Spankbang: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/imagebam.com\/(view|gallery)/],
        async (url, http) => {
            try {
                const date = new Date();
                date.setTime(date.getTime() + 6 * 60 * 60 * 1000); // +6 hours for cookie
                const expires = '; expires=' + date.toUTCString();
                const { source, dom } = await http.get(
                    url,
                    {},
                    { cookie: 'nsfw_inter=1' + expires + '; path=/' },
                );

                if (h.contains('gallery-name', source)) {
                    const resolved = [];
                    const imageLinksInput = dom.querySelector('.links.gallery > div:nth-child(2) > div > input');

                    const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput?.getAttribute('value') ?? '');

                    for (const link of rawImageLinks) {
                        try {
                            const { dom: imgDom } = await http.get(link);
                            const imgSrc = imgDom?.querySelector('.main-image')?.getAttribute('src');
                            if (imgSrc) resolved.push(imgSrc);
                        } catch (error) {
                            console.warn(`Imagebam (gallery): Error fetching image link ${link}: ${error.message}`);
                        }
                    }

                    return {
                        dom,
                        source,
                        folderName: dom?.querySelector('#gallery-name')?.innerText.trim() ?? 'Imagebam Gallery',
                        resolved,
                    };
                } else {
                    return dom?.querySelector('.main-image')?.getAttribute('src');
                }
            } catch (error) {
                console.error(`Error resolving Imagebam: ${error.message}`);
                return null;
            }
        },
    ],
    [[/images\d.imagebam.com/], url => url],
    [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], url => url.replace('.th.', '.').replace('.md.', '.')],
    [
        [/imgvb.com\/album\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);
                const resolved = [...(dom.querySelectorAll('.image-container > img') ?? [])]
                    .map(i => i.getAttribute('src'))
                    .filter(Boolean)
                    .map(imgUrl => imgUrl.replace('.th.', '.').replace('.md.', '.'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('meta[property="og:title"]')?.content.trim() ?? 'Imgvb Album',
                    resolved,
                };
            } catch (error) {
                console.error(`Error resolving Imgvb album: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/(\/attachments\/|\/data\/video\/)/],
        async (url) => {
            // Ensure full URL for local attachments if not already present
            if (url.startsWith('/attachments/') || url.startsWith('/data/video/')) {
                return `https://simpcity.su${url}`;
            }
            return url;
        },
    ],
    [[/(thumbs|images)(\d+)?\.imgbox\.com\//, /:!imgbox.com\/g\//], url => url.replace(/_t\./gi, '_o.').replace(/thumbs/i, 'images')],
    [
        [/imgbox.com\/g\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);

                const resolved = [...(dom?.querySelectorAll('#gallery-view-content > a > img') ?? [])]
                    .map(img => img.getAttribute('src'))
                    .filter(Boolean)
                    .map(imgUrl => imgUrl.replace(/(thumbs|t)(\d+)\./gis, 'images$2.').replace('_b.', '_o.'));

                return {
                    dom,
                    source,
                    folderName: dom?.querySelector('#gallery-view > h1')?.innerText.trim() ?? 'Imgbox Gallery',
                    resolved,
                };
            } catch (error) {
                console.error(`Error resolving Imgbox gallery: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/m\.box\.com\//],
        async (url, http) => {
            try {
                const { source, dom } = await http.get(url);
                const files = [...(dom.querySelectorAll('.files-item-anchor') ?? [])].map(el => `https://m.box.com${el.getAttribute('href')}`);

                const resolved = [];
                for (const fileUrl of files) {
                    try {
                        const { source: fileSource, dom: fileDom } = await http.get(fileUrl);
                        if (h.contains('image-preview', fileSource)) {
                            const imgSrc = fileDom.querySelector('.image-preview')?.getAttribute('src');
                            if (imgSrc) resolved.push(imgSrc);
                        } else {
                            const dlHref = fileDom.querySelector('.mtl > a')?.getAttribute('href');
                            if (dlHref) resolved.push(dlHref);
                        }
                    } catch (error) {
                        console.warn(`Box.com: Error fetching file ${fileUrl}: ${error.message}`);
                    }
                }

                return {
                    source,
                    dom,
                    folderName: dom.querySelector('.folder-nav-title')?.innerText.trim() ?? 'Box.com Folder',
                    resolved: resolved.map(u => u.startsWith('https://') ? u : `https://m.box.com${u}`), // Ensure full URL for relative paths
                };
            } catch (error) {
                console.error(`Error resolving Box.com: ${error.message}`);
                return null;
            }
        },
    ],
    [
        [/twimg.com\//],
        url => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, 'https://pbs.twimg.com/media/$1.$3'),
    ],
    [
        [/(disk\.)?yandex\.[a-z]+/],
        async (url, http, _, postId) => {
            try {
                const { dom } = await http.get(url);
                const script = dom.querySelector('script[id="store-prefetch"]');
                if (!script) {
                    log.host.error(postId, `::Could not find store-prefetch script for Yandex disk::: ${url}`, 'Yandex');
                    return null;
                }

                const json = JSON.parse(script.innerText);
                let sk, hash = null;

                if (json?.environment && json.resources) {
                    sk = json.environment.sk;
                    const resourcesKeys = Object.keys(json.resources);
                    hash = json.resources[resourcesKeys[0]]?.hash;
                }

                if (!sk || !hash) {
                    log.host.error(postId, `::Missing SK or hash in Yandex disk data::: ${url}`, 'Yandex');
                    return null;
                }

                const data = JSON.stringify({ hash, sk });
                const { source } = await http.post(
                    'https://disk.yandex.ru/public/api/download-url',
                    data,
                    {},
                    { 'Content-Type': 'text/plain' },
                );

                const response = JSON.parse(source);
                if (response && response.error !== 'true' && response.data?.url) {
                    return response.data.url;
                }

                log.host.error(postId, `::Yandex download URL not found in API response::: ${url}`, 'Yandex');
                return null;
            } catch (error) {
                log.host.error(postId, `::Error resolving Yandex disk ${url}::: ${error.message}`, 'Yandex');
                return null;
            }
        },
    ],
    [[/(\w+)?.redd.it/], url => url.replace(/&amp;/g, '&')],
];

/**
 * Manages caching and retrieval of forum thread pages using GM_setValue.
 * Stores minimal data (postId, postNumber, textContent) for search/navigation.
 * v1.12.1 (round 6, 2e-F24/2d-K02): the write side gained a thread registry
 * (XFPD_ThreadCache_Index, MRU-first, capped at MAX_CACHED_THREADS — the
 * per-thread keys were unbounded GM-storage growth before), and the read side
 * (getAllCachedPosts/getCachedPage) gained its FIRST consumer: the cached-post
 * search box in the page-level Post Selection form (below).
 */
const ThreadCache = (() => {
    const CACHE_KEY_PREFIX = 'XFPD_ThreadCache_'; // Prefix for GM_setValue keys
    const INDEX_KEY = 'XFPD_ThreadCache_Index'; // MRU-first thread id registry
    const MAX_CACHED_THREADS = 12; // prune beyond this many threads

    /**
     * Extracts thread ID from the current URL.
     * Assumes URL format like https://simpcity.su/threads/thread-title.123/page-N
     * @returns {string|null} The thread ID or null if not found.
     */
    const getThreadIdFromUrl = () => {
        const match = window.location.pathname.match(/\/threads\/.*\.(\d+)(\/|$)/);
        return match?.[1] ?? null;
    };

    /**
     * Fetches and parses posts from a given page URL.
     * Returns minimal data suitable for caching.
     * @param {string} pageUrl
     * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
     */
    const fetchAndParsePage = async (pageUrl) => {
        try {
            const { dom } = await h.http.get(pageUrl, {}, {}, 'document');
            const postElements = dom.querySelectorAll('.message-attribution-opposite');
            const pagePosts = [];
            for (const postEl of postElements) {
                const parsed = parsers.thread.parsePost(postEl);
                pagePosts.push({
                    postId: parsed.postId,
                    postNumber: parsed.postNumber,
                    pageNumber: parsed.pageNumber,
                    textContent: parsed.textContent // Store text content for search
                });
            }
            return pagePosts;
        } catch (error) {
            console.error(`ThreadCache: Failed to fetch or parse page ${pageUrl}: ${error.message}`);
            /* v1.13.2 (7d F07): null, not [] — an empty array is truthy, so a
             * transient fetch failure permanently cached that page as 0
             * posts (the search undercounted and the page never refetched). */
            return null;
        }
    };

    /**
     * Retrieves cached thread data.
     * @param {string} threadId
     * @returns {Promise<object>} Cached data, organized by page number.
     */
    const getCachedThreadData = async (threadId) => {
        const cachedData = await GM_getValue(`${CACHE_KEY_PREFIX}${threadId}`, {});
        /* v1.13.7 (13a-F15): shape guard — a string-shaped store (manager
         * coercion or a hand edit) made every `cachedData[page] = posts`
         * write a silent no-op through this non-strict file (property set
         * on a transient String wrapper). Re-seed empty instead of
         * silently freezing the cache. */
        return (cachedData && typeof cachedData === 'object' && !Array.isArray(cachedData)) ? cachedData : {};
    };

    /**
     * Stores thread data in cache.
     * @param {string} threadId
     * @param {object} dataToCache
     * @returns {Promise<void>}
     */
    const setCachedThreadData = async (threadId, dataToCache) => {
        await GM_setValue(`${CACHE_KEY_PREFIX}${threadId}`, dataToCache);

        // v1.12.1: MRU register + prune — the thread keys were unbounded before.
        try {
            const index = Array.isArray(GM_getValue(INDEX_KEY, [])) ? GM_getValue(INDEX_KEY, []) : [];
            const next = [String(threadId), ...index.filter(id => id !== String(threadId))];
            const pruned = next.slice(0, MAX_CACHED_THREADS);
            for (const staleId of next.slice(MAX_CACHED_THREADS)) {
                /* v1.13.2 (7d F06): pruned threads DELETE their key — the old
                 * {} placeholder capped the DATA but accumulated one dead key
                 * per thread ever visited. The typeof guard keeps managers
                 * without GM_deleteValue on the old shape. */
                if (typeof GM_deleteValue === 'function') {
                    try { GM_deleteValue(`${CACHE_KEY_PREFIX}${staleId}`); } catch (e) { console.debug('ThreadCache: prune rejected:', e && e.message); }
                } else {
                    await GM_setValue(`${CACHE_KEY_PREFIX}${staleId}`, {});
                }
            }
            if (JSON.stringify(pruned) !== JSON.stringify(index)) {
                await GM_setValue(INDEX_KEY, pruned);
            }
        } catch (e) {
            console.debug('ThreadCache: index register rejected:', e && e.message);
        }
    };

    /**
     * Initiates caching of pages for the current thread.
     * @param {number} currentPageNumber
     * @param {number} totalPages
     * @param {string} threadId
     * @param {string} baseUrl
     */
    const cacheSurroundingPages = async (currentPageNumber, totalPages, threadId, baseUrl) => {
        const cachedData = await getCachedThreadData(threadId);
        const pagesToFetch = new Set();
        const numPagesToCache = settings.caching.maxPagesToCache;
        const half = Math.floor(numPagesToCache / 2);

        // Determine pages to fetch around the current one
        for (let i = 0; i < numPagesToCache; i++) {
            let pageNum = currentPageNumber - half + i;
            if (pageNum < 1) pageNum = 1;
            if (pageNum > totalPages) pageNum = totalPages;
            pagesToFetch.add(pageNum);
        }

        const fetchPromises = [];
        for (const pageNum of Array.from(pagesToFetch).sort((a,b) => a - b)) {
            // Only fetch if not already in cache
            if (!cachedData[pageNum]) {
                const pageUrl = pageNum === 1 ? baseUrl : `${baseUrl}page-${pageNum}`;
                console.debug(`ThreadCache: Fetching page ${pageNum} for caching...`);
                fetchPromises.push(
                    fetchAndParsePage(pageUrl).then(posts => {
                        if (posts) cachedData[pageNum] = posts; // 7d F07: never store a failed fetch
                    }).catch(err => {
                        console.error(`ThreadCache: Error fetching/parsing page ${pageNum}: ${err.message}`);
                    })
                );
            }
        }
        await Promise.all(fetchPromises);
        await setCachedThreadData(threadId, cachedData);
        console.debug(`ThreadCache: Finished caching pages for thread ${threadId}. Cached pages: ${Object.keys(cachedData).length}`);
    };

    return {
        init: async () => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) {
                console.warn('ThreadCache: Could not determine thread ID from URL. Caching skipped.');
                return;
            }

            const paginationEl = h.element('.pageNav-main .pageNav-page.pageNav-page--current');
            const totalPagesEl = h.element('.pageNav-main .pageNav-page:last-of-type'); // Assuming last page button implies total pages
            const currentPageNumber = paginationEl ? Number(paginationEl.textContent) : 1;
            let totalPages = totalPagesEl ? Number(totalPagesEl.textContent) : currentPageNumber;

            if (totalPages < currentPageNumber) { // Fallback if last page button isn't correct, e.g., only one page or simple prev/next
                const lastPageLink = h.element('.pageNav-main a[href*="page-"]:last-of-type');
                if (lastPageLink) {
                    const match = lastPageLink.href.match(/page-(\d+)$/);
                    if (match) {
                        totalPages = Math.max(totalPages, Number(match[1]));
                    }
                }
            }

            const baseUrlMatch = window.location.pathname.match(/(.*\/threads\/.*?\.\d+)\//);
            const baseUrl = baseUrlMatch?.[1] ?? window.location.origin + window.location.pathname.split('/').slice(0, 4).join('/'); // Fallback to /threads/thread-slug.id/

            // Fetch and parse the current page's posts initially, then cache
            const currentPosts = [];
            h.elements('.message-attribution-opposite').forEach(postEl => {
                const parsed = parsers.thread.parsePost(postEl);
                currentPosts.push({
                    postId: parsed.postId,
                    postNumber: parsed.postNumber,
                    pageNumber: parsed.pageNumber,
                    textContent: parsed.textContent
                });
            });

            const cachedData = await getCachedThreadData(threadId);
            /* v1.13.7 (13a-F04): the 7d-F07 truthiness class, armed on the
             * WRITE side — a CF interstitial or logged-out view parsed the
             * current page to zero posts and the empty array was cached
             * unconditionally; the `!cachedData[pageNum]` refetch guard
             * treats [] as cached, freezing that page at 0 posts forever.
             * Never store an empty current page over anything. */
            if (currentPosts.length) {
                cachedData[currentPageNumber] = currentPosts;
            }
            await setCachedThreadData(threadId, cachedData);

            // Asynchronously cache surrounding pages
            requestAnimationFrame(() => {
                cacheSurroundingPages(currentPageNumber, totalPages, threadId, baseUrl);
            });
        },
        /**
         * Get all cached posts for the current thread.
         * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
         */
        getAllCachedPosts: async () => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) return [];
            const cachedData = await getCachedThreadData(threadId);
            return Object.values(cachedData).flat();
        },
        /**
         * Get cached data for a specific page.
         * @param {number} pageNumber
         * @returns {Promise<Array<{postId: string, postNumber: string, pageNumber: number, textContent: string}>>}
         */
        getCachedPage: async (pageNumber) => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) return [];
            const cachedData = await getCachedThreadData(threadId);
            return cachedData[pageNumber] || [];
        },
        /* v1.12.1: the search panel's page counter + per-page grouping source. */
        listCachedPageNumbers: async () => {
            const threadId = getThreadIdFromUrl();
            if (!threadId) return [];
            const cachedData = await getCachedThreadData(threadId);
            return Object.keys(cachedData).map(Number).filter(n => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
        }
    };
})();


/**
 * @param {object} parsedPost
 * @param {Array<object>} parsedHosts
 * @param {function(Array<object>): Array<object>} enabledHostsCB
 * @param {Array<Array<any>>} resolvers
 * @param {function(): object} getSettingsCB
 * @param {object} statusUI
 * @param {object} [callbacks={}]
 */
const downloadPost = async (parsedPost, parsedHosts, enabledHostsCB, resolvers, getSettingsCB, statusUI, callbacks = {}) => {
    const { postId, postNumber } = parsedPost;
    const postSettings = getSettingsCB();
    const enabledHosts = enabledHostsCB(parsedHosts);

    // Filter out previous logs for this post
    logs = logs.filter(l => l.postId !== postId);

    log.separator(postId);
    log.post.info(postId, `::Using ${enabledHosts.length} host(s)::: ${enabledHosts.map(h => h.name).join(', ')}`, postNumber);
    log.separator(postId);
    log.post.info(postId, `::Preparing download::`, postNumber);

    let completed = 0;
    const zip = new JSZipGlobal(); // Use global JSZip
    let resolved = [];

    const statusLabel = statusUI.status;
    const filePB = statusUI.filePB;
    const totalPB = statusUI.totalPB;

    h.ui.setElProps(statusLabel.el, { // Access the actual span element
        color: '#00E5FF',
        marginBottom: '3px',
        fontSize: '12px',
    });

    h.ui.setElProps(filePB, {
        width: '0%',
        marginBottom: '1px',
    });

    h.ui.setElProps(totalPB, {
        width: '0%',
        marginBottom: '10px',
    });

    h.show(statusLabel.container); // Show the container div for the label
    h.show(filePB);
    h.show(totalPB);

    h.ui.setText(statusLabel.el, 'Resolving...');

    log.post.info(postId, '::Url resolution started::', postNumber);

    /* v1.12.1 (round 6, 2e-F18): resolving counter + per-resolver progress
     * callback — long walkers (bunkr albums, redgifs users, cyberdrop ladders)
     * now update the status label instead of a bare URL. */
    let resolveIndex = 0;
    const totalResolveTargets = enabledHosts.filter(host => host.resources.length).reduce((acc, host) => acc + host.resources.length, 0);

    for (const host of enabledHosts.filter(host => host.resources.length)) {
        const resources = host.resources;

        for (const resource of resources) {
            resolveIndex++;
            h.ui.setElProps(statusLabel.el, { color: '#00E5FF', fontWeight: 'bold' });
            h.ui.setText(statusLabel.el, `Resolving: ${resolveIndex} / ${totalResolveTargets} 🢒 ${h.limit(resource, 80)}`);

            let r = null; // Resolved data for the current resource

            for (const resolver of resolvers) {
                const patterns = resolver[0];
                const resolverCB = resolver[1];

                let matched = true;
                for (const pattern of patterns) {
                    let strPattern = pattern.toString();
                    let shouldMatch = !h.contains(':!', strPattern);
                    strPattern = strPattern.replace(':!', '');
                    const regex = h.re.toRegExp(h.re.toString(strPattern), 'is');

                    if (shouldMatch && !regex.test(resource)) {
                        matched = false;
                        break;
                    } else if (!shouldMatch && regex.test(resource)) {
                        matched = false;
                        break;
                    }
                }

                if (!matched) {
                    continue;
                }

                const passwords = parsedPost.spoilers.concat(parsedPost.spoilers.map(s => s.toLowerCase()));

                try {
                    r = await resolverCB(resource, h.http, passwords, postId, postSettings, progressText => {
                        h.ui.setText(statusLabel.el, String(progressText || '').slice(0, 120));
                    });
                    if (r !== null) { // If resolver successfully returned something, stop trying other resolvers
                        break;
                    }
                } catch (e) {
                    log.post.error(postId, `::Error executing resolver for ${resource} on host ${host.name}::: ${e.message}`, postNumber);
                    r = null; // Ensure r is null if resolver failed
                }
            }

            if (h.isNullOrUndef(r)) {
                log.post.error(postId, `::Could not resolve::: ${resource}`, postNumber);
                continue;
            }

            h.ui.setElProps(statusLabel.el, { color: '#67E8F9', fontWeight: 'bold' });
            h.ui.setText(statusLabel.el, `Resolved: ${resolved.length}`);

            const addResolved = (urlToAdd, folderName) => {
                if (!resolved.length) {
                    log.separator(postId);
                }
                if (h.isObject(urlToAdd) && urlToAdd.url) { // Handle {url, folderName} objects from resolvers
                    resolved.push({
                        url: urlToAdd.url,
                        host,
                        original: resource,
                        folderName: urlToAdd.folderName,
                    });
                    log.post.info(postId, `::Resolved::: ${urlToAdd.url}`, postNumber);
                } else if (typeof urlToAdd === 'string') { // Handle plain string URLs
                    resolved.push({
                        url: urlToAdd,
                        host,
                        original: resource,
                        folderName,
                    });
                    log.post.info(postId, `::Resolved::: ${urlToAdd}`, postNumber);
                }
            };

            if (h.isArray(r.resolved)) { // If resolver returned an album/list of URLs
                /* v1.13.8 (15a F06): the uniform fail-visible floor — an
                 * album walk that fetched its pages and resolved ZERO files
                 * used to end in a bare "FOUND 0 RESOURCE(S)" with no named
                 * cause (FPP-RES-03). One line here covers every album host
                 * in the table; the host-specific resolvers layer their own
                 * why on top. */
                if (!r.resolved.length) {
                    log.post.error(postId, `::Album resolved 0 file(s)::: ${resource}`, postNumber);
                }
                r.resolved.forEach(url => addResolved(url, r.folderName));
            } else { // If resolver returned a single URL
                addResolved(r, null);
            }
        }
    }

    if (resolved.length) {
        log.separator(postId);
    }

    log.post.info(postId, '::Url resolution completed::', postNumber);

    let totalDownloadable = resolved.filter(r => r.url).length;
    const totalResourcesInHostSelection = enabledHosts.reduce((acc, hst) => hst.resources.length + acc, 0);

    h.ui.setElProps(statusLabel.el, { color: '#67E8F9', fontWeight: 'bold' });
    h.ui.setText(statusLabel.el, `Resolved: ${resolved.length} / ${totalDownloadable} 🢒 ${totalResourcesInHostSelection} Total Links`);

    const downloadedFilenames = new Set(); // To track actual filenames saved, including deduplication renaming

    log.separator(postId);
    log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
    log.separator(postId);

    const threadTitle = parsers.thread.parseTitle();
    let customFilename = postSettings.output.find(o => o.postId === postId)?.value;
    if (customFilename) {
        customFilename = customFilename.replace(/:title:/g, threadTitle);
        customFilename = customFilename.replace(/:#:/g, postNumber);
        customFilename = customFilename.replace(/:id:/g, postId);
    }

    /* v1.13.2 (7d F22): hoisted to post scope — the zip-gate title and the
     * FF flat save arm need the SEGMENT sanitizer too (a ':' in the thread
     * title failed GM_download name validation; the old arms only replaced
     * slashes). */
    const WIN_ILLEGAL_RE = /[<>:"\\|?*\x00-\x1F]/g;
    const sanitizeWinSegment = s => {
        const sub = (settings && settings.naming && settings.naming.invalidCharSubstitute) ? settings.naming.invalidCharSubstitute : '_';
        let out = String(s || '');
        if (settings?.naming?.allowEmojis === false) {
            try {
                out = out.replace(/\p{Extended_Pictographic}/gu, '');
            } catch (e) {
                out = out.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
            }
            out = out.replace(/[\uFE0E\uFE0F\u200D]/g, '');
        }
        out = out.replace(WIN_ILLEGAL_RE, sub);
        out = out.replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');
        out = out.replace(/[\. ]+$/g, '').replace(/^[\. ]+/g, '');
        if (!out) out = '_';
        if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(out)) out = '_' + out;
        return out;
    };
    const sanitizeWinPath = pth => String(pth || '').split('/').map(sanitizeWinSegment).join('/');
    const safeThreadTitle = sanitizeWinSegment(threadTitle);
    let saveFallbackWarned = false; // v1.13.3 (8b F12): one-shot log for the URL.createObjectURL compat arm

    // Deduplicate resolved URLs based on their final filename AFTER stripping query strings/hashes
    if (postSettings.skipDuplicates) {
        const uniqueResolved = [];
        const seenBasenames = new Set();
        for (const r of resolved.filter(res => res.url)) {
            let potentialBasename = h.basename(r.url).replace(/\?.*/, '').replace(/#.*/, '');
            // For Bunkr, the filename often comes from content-disposition, not URL basename directly.
            // This is a simplification; a more robust solution would be to resolve filename during actual download for more accuracy.
            if (r.host.name === 'Bunkr') {
                // Heuristic for bunkr, assume last part of path is the effective ID, we won't know the exact filename until headers.
                /* v1.13.7 (13b-F11): h.basename strips the trailing slash —
                 * a slash-terminated bunkr URL made the old split-pop yield
                 * '' (non-null, so the ?? never fired): every resource after
                 * the first shared the '' dedup key and was falsely dropped
                 * as a duplicate. */
                potentialBasename = h.basename(String(r.url).split('?')[0].split('#')[0]) || potentialBasename;
            }

            if (!seenBasenames.has(potentialBasename.toLowerCase())) {
                uniqueResolved.push(r);
                seenBasenames.add(potentialBasename.toLowerCase());
            } else {
                log.post.info(postId, `::Skipped duplicate (filename heuristic):: ${potentialBasename} ::from:: ${r.url}`, postNumber);
            }
        }
        if (uniqueResolved.length !== resolved.length) {
            h.ui.setText(statusLabel.el, `Removed ${resolved.length - uniqueResolved.length} duplicates...`);
            resolved = uniqueResolved;
            totalDownloadable = resolved.length;
        }
    }


    // v1.10.1: removed TDZ self-shadowing `const isFF = isFF;` (uses script-scope isFF)

    /* v1.12.1 (round 6, 2e-F07): the pipeline promise — awaited before the zip
     * assembly so the in-flight guard and the file-count gate see the truth. */
    let pipelinePromise = Promise.resolve();

    if (!postSettings.skipDownload) {
        const resourcesToDownload = resolved.filter(r => r.url);
        totalDownloadable = resourcesToDownload.length;

        /* v1.12.1 (round 6, 2e-F01/F03): lineage batch rules — turbo-family
         * hosts and bunkr serialize (parallel connections trip their rate
         * defenses), 2 otherwise, and never more than ONE GoFile item per
         * batch (the gate-spam / soft-block cascade). v1.13.1 (7d F14): the
         * rule is PER-BATCH now — see the builder below. */
        const isTurboFamilyUrl = u => /(turbocdn\.st|turbo\.cr|turbovid\.cr|saint2\.(su|pk|cr))/i.test(String(u || ''));
        /* v1.13.3 (8b F02): the classifier now carries the FULL family the hosts
         * table collects — 'bunkrr?\.' missed bunkrrr.org (three r's) and the
         * gigachad-cdn CDN host entirely, so the rate-defense serialization
         * (7d F14), the maint.mp4 guards (7d F01), the 500 MB DIRECT switch and
         * the tiny-sniff were ALL inoperative on the flagship bunkr CDN URLs
         * (a 200 maintenance placeholder got saved as a real file). */
        const isBunkrUrl = u => /(bunkrr?r?\.)|(bunkr-cache)|(gigachad-cdn)/i.test(String(u || ''));
        const isGoFileUrl = u => /gofile\.io/i.test(String(u || ''));
        const isPixeldrainUrl = u => /pixeldrain\.(com|net)|pixeldra\.in/i.test(String(u || ''));

        /* v1.13.1 (7d F14): per-batch composition — the old whole-post rule
         * (batchLength=1 if ANY resource was turbo/bunkr) serialized fifty
         * pixeldrain links behind one bunkr link; the lineage rule is
         * per-batch: a rate-defense item rides ALONE, everything else keeps
         * the 2-slot batches, and ≤1 GoFile per batch still holds. */
        const batches = [];
        let tmp = [];
        let tmpHasGoFile = false;
        for (const item of resourcesToDownload) {
            const isGF = isGoFileUrl(item.url);
            if (isTurboFamilyUrl(item.url) || isBunkrUrl(item.url)) {
                if (tmp.length) { batches.push(tmp); tmp = []; tmpHasGoFile = false; }
                batches.push([item]); // rate-defense hosts ride alone
                continue;
            }
            if (tmp.length >= 2 || (tmpHasGoFile && isGF)) {
                batches.push(tmp);
                tmp = [];
                tmpHasGoFile = false;
            }
            tmp.push(item);
            if (isGF) tmpHasGoFile = true;
        }
        if (tmp.length) batches.push(tmp);

        /* v1.12.1 (2e-F04): DIRECT fallback thresholds — blobs >1.6 GB blow MV3
         * message ports (GoFile/Pixeldrain/Filester sizes surface mid-download),
         * and Bunkr's CDN rejects blob transfers above 500 MB; those download
         * raw-URL through GM_download, outside the zip, Windows-safe names. */
        const BLOB_MAX_BYTES = Math.floor(1.6 * 1024 * 1024 * 1024);
        const BUNKR_DIRECT_MIN_BYTES = 500 * 1024 * 1024;
        // (sanitizeWinSegment/sanitizeWinPath are hoisted to post scope — v1.13.2, 7d F22)

        /* v1.12.1 (2e-F03): turbo stall re-sign — a signed URL that stops
         * progressing is re-signed (≤3) before ONE direct fallback. */
        const TURBO_STALL_MS = 5000;
        const TURBO_RESIGN_RETRIES = 3;
        const TURBO_DIRECT_FALLBACKS = 1;
        const TURBO_RETRY_DELAY_MS = 600;
        /* v1.13.1 (7d F02): keyed by the RESOURCE object — url-keyed state
         * reset on every successful re-sign (the rewrite gives the retry a
         * fresh url, so the ≤3/≤1 ladder never advanced while re-signs kept
         * succeeding — an unbounded 5 s-cadence retry loop). WeakMap: the
         * state dies with the per-run resource objects. */
        const turboRetryState = new WeakMap(); // resource -> { resign, direct }

        const gofileWarmupAttempted = new Set();
        const gofileWarmupOpenTab = gfUrl => {
            try {
                const tab = GM_openInTab(gfUrl, { active: false, insert: true, setParent: true });
                setTimeout(() => { xfpdCloseTabHandle(tab); }, 3000);
            } catch (e) {
                console.debug('[Forums++] gofile warm-up tab rejected:', e && e.message);
            }
        };

        const reflinkFor = resource => {
            if (resource.url.includes('bunkr')) {
                return 'https://bunkr.si';
            }
            if (resource.url.includes('pomf2')) {
                return 'https://pomf2.lain.la';
            }
            if (isFilesterUrl(resource.url)) {
                return filesterRefByUrl.get(resource.url) || resource.original;
            }
            return resource.original;
        };

        let successful = 0;      // staged-or-saved count (7d F19: consumed by the onComplete reaction gate — F23)
        let zipFileCount = 0;    // files staged into the zip (2e-F07)

        /* v1.13.2 (7d F20): the dead bookkeeping is gone — activeDownloads
         * and resource._downloadPromise were written and deleted but NEVER
         * read anywhere (the re-entry guard reads the processing registry
         * instead; the batch runner awaits startDownload's return value). */

        /* The DIRECT path: raw-URL GM_download outside the zip. Returns a
         * promise that settles when the download completes (2e-F07: awaited,
         * not fire-and-forget). */
        const startDirectDownload = (resource, sizeHint) => {
            const folder = resource.folderName || '';
            let name = resource._filename
                || bunkrNameByUrl.get(resource.url)
                || cyberdropNameByUrl.get(resource.url)
                || gofileNameByUrl.get(resource.url)
                || filesterNameByUrl.get(resource.url)
                || h.basename(resource.url).replace(/\?.*/, '').replace(/#.*/, '');
            /* v1.13.2 (7d F18): DIRECT-path files join the folder-aware dedup
             * set — a blob-staged name.mp4 and a DIRECT-switched same-named
             * file used to collide on disk (overwrite or browser auto-rename
             * race). Same key space + (n) suffix logic as the zip arm, and
             * the suffix carries no trailing dot when the extension is
             * empty (7d F21). */
            const inFolderD = (!postSettings.flatten && folder && folder.trim() !== '');
            const pathKeyD = nm => (inFolderD ? `${folder}/${nm}` : nm).toLowerCase();
            let dCounter = 1;
            const dExt = h.ext(name);
            while (downloadedFilenames.has(pathKeyD(name))) {
                name = `${h.fnNoExt(name)} (${dCounter})${dExt ? `.${dExt}` : ''}`;
                dCounter++;
            }
            downloadedFilenames.add(pathKeyD(name));
            const relative = (!postSettings.flatten && folder && folder.trim() !== '') ? `${folder}/${name}` : name;
            const winPath = sanitizeWinPath(`${threadTitle}/${relative}`);
            resource._direct = true;
            log.post.info(postId, `::DIRECT download${sizeHint ? ` (${(sizeHint / 1024 / 1024).toFixed(0)} MB)` : ''}::: ${resource.url} ::as:: ${winPath}`, postNumber);
            return new Promise(resolve => {
                try {
                    GM_download({
                        url: resource.url,
                        name: winPath,
                        headers: { Referer: reflinkFor(resource) },
                        onload: () => {
                            successful++;
                            completed++;
                            h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                            log.post.info(postId, `::Completed (direct)::: ${resource.url}`, postNumber);
                            resolve(true);
                        },
                        onerror: err => {
                            completed++;
                            log.post.error(postId, `DIRECT download failed for ${resource.url}: ${err?.error} - ${err?.details}`, postNumber);
                            resolve(false);
                        },
                        ontimeout: () => {
                            completed++;
                            log.post.error(postId, `DIRECT download timed out for ${resource.url}`, postNumber);
                            resolve(false);
                        },
                    });
                } catch (e) {
                    completed++;
                    log.post.error(postId, `DIRECT download dispatch failed for ${resource.url}: ${e.message}`, postNumber);
                    resolve(false);
                }
            });
        };

        const startDownload = resource => {
            const url = resource.url;
            const ellipsedUrl = h.limit(url, 80);
            const host = resource.host;
            const isTurbo = isTurboFamilyUrl(url);
            const isBunkr = isBunkrUrl(url);
            const isGoFile = isGoFileUrl(url);
            const isPixeldrain = isPixeldrainUrl(url);
            const isFilester = isFilesterUrl(url);
            /* v1.12.1 (2e-F02): the no-progress stall threshold replaces the
             * hard 60 s timeout (which killed every transfer slower than 60 s —
             * 500 MB–1.6 GB files) and the dead interval (which could never
             * fire before that timeout). */
            const stallMs = isTurbo ? TURBO_STALL_MS : 30000;
            let switchedToDirect = false;
            let recoveryArmed = false;
            let abortReason = null;
            let maintSettled = false; // 7d F01: the maint settle is single-shot across onabort/onload
            let transferDone = false; // 7d F03: onload/onerror/ontimeout stand the watchdog down
            const progress = { old: 0, updated: 0, intervalId: null, armedAt: Date.now() };

            log.post.info(postId, `::Downloading::: ${url}`, postNumber);

            const reflink = reflinkFor(resource);

            /* The success path — filename derivation (host hint maps ride the
             * segment-1 registries), folder-aware dedup naming (2e-F06), and
             * the per-browser save arms (2e-F08: Firefox honors the Zipped
             * checkbox now — per-file GM_download of the blob URL instead of
             * the old always-zip behavior).
             * v1.13.6 (OBI-F01): the settle callback arrives as a PARAMETER —
             * this function lives in startDownload's scope, one level OUTSIDE
             * the downloadPromise executor that owns `resolve`; the bare
             * resolve() calls this shipped with since 1.12.1 were free
             * variables (ReferenceError on every successful load — the batch
             * wedged with its slots never freed). */
            const finishSuccessfulLoad = (response, settle) => {
                completed++;
                successful++;
                h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                h.ui.setElProps(statusLabel.el, { color: '#67E8F9' });
                h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });

                // Determine filename
                let basename = resource._filename || h.basename(resource.url).replace(/\?.*/, '').replace(/#.*/, '');

                // Host-specific filename processing
                if (resource.url.includes('https://simpcity.su/attachments/')) {
                    basename = basename.replace(/(.*)-(.{3,4})\.\d*$/i, '$1.$2');
                } else if (resource.url.includes('kemono.su') || resource.url.includes('kemono.cr')) {
                    /* v1.13.7 (13b-F03): the ?f= recovery reads the ORIGINAL
                     * url — the generic arm above already stripped the query
                     * from the basename, so the old regex could never match
                     * (dead since 1.11.x; kemono files saved under UUID
                     * names). searchParams decodes percent-encoding properly
                     * (the old '%20' replace was single-instance). */
                    try {
                        const fParam = new URL(resource.url).searchParams.get('f');
                        if (fParam) basename = fParam;
                    } catch (e) { console.debug('Forums++: kemono ?f= recovery skipped:', e && e.message); }
                } else if (resource.url.includes('cyberdrop')) {
                    const hint = cyberdropNameByUrl.get(resource.url);
                    if (hint) {
                        basename = hint;
                    } else {
                        let cext = h.ext(basename);
                        if (cext) {
                            basename = h.fnNoExt(basename).replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/, '') + `.${cext}`;
                        }
                    }
                } else if (resource.url.includes('bunkr')) {
                    const hint = bunkrNameByUrl.get(resource.url) || bunkrNameByUrl.get(String(resource.url).split('?')[0]);
                    if (hint) {
                        const hintExt = h.ext(hint);
                        const baseExt = h.ext(basename);
                        basename = hintExt ? hint : `${hint}${baseExt ? `.${baseExt}` : ''}`;
                    }
                } else if (isFilester) {
                    const hint = filesterNameByUrl.get(resource.url);
                    if (hint) basename = hint;
                }

                let ext = h.ext(basename);
                if (!ext && resource._mimeType) {
                    switch (resource._mimeType.split(';')[0].trim()) {
                        case 'image/jpeg':
                            ext = 'jpg'; break;
                        case 'image/png':
                            ext = 'png'; break;
                        case 'image/gif':
                            ext = 'gif'; break;
                        case 'video/mp4':
                            ext = 'mp4'; break;
                        default:
                            ext = 'unknown';
                    }
                    if (ext !== 'unknown') {
                        basename = `${h.fnNoExt(basename)}.${ext}`;
                    }
                }

                /* v1.12.1 (2e-F06): folder-aware duplicate naming — the old
                 * basename-only Set false-suffixed (n) across DIFFERENT folders;
                 * the key is now the in-zip path. */
                const folder = resource.folderName || '';
                const inFolder = !postSettings.flatten && folder && folder.trim() !== '';
                const pathKeyOf = name => (inFolder ? `${folder}/${name}` : name).toLowerCase();
                let finalBasename = basename;
                let counter = 1;
                while (downloadedFilenames.has(pathKeyOf(finalBasename))) {
                    /* v1.13.2 (7d F21): no trailing dot when the extension is
                     * empty — 'name (1).' strips to 'name (1)' on Windows and
                     * collides with the unsuffixed save. */
                    finalBasename = `${h.fnNoExt(basename)} (${counter})${ext ? `.${ext}` : ''}`;
                    counter++;
                }
                downloadedFilenames.add(pathKeyOf(finalBasename));

                let finalPathInZip = finalBasename;
                if (inFolder) {
                    finalPathInZip = `${folder}/${finalBasename}`;
                }

                log.separator(postId);
                log.post.info(postId, `::Completed::: ${resource.url}`, postNumber);
                if (inFolder) {
                    log.post.info(postId, `::Saving as::: ${finalBasename} ::to:: ${folder}`, postNumber);
                } else {
                    log.post.info(postId, `::Saving as::: ${finalBasename}`, postNumber);
                }

                // Sanitize filename for various OS — v1.13.2 (7d F09): per
                // SEGMENT, keeping the '/' folder separators: the class used
                // to flatten 'folder/video.mp4' to 'folder_video.mp4' so the
                // zip never materialized the folder structure that the FF
                // log/links paths and the folder-aware dedup both assume.
                finalPathInZip = finalPathInZip
                    .split('/')
                    .map(seg => seg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\uFFFF]/g, '').replace(/[\\:\*?"<>|]/g, settings.naming.invalidCharSubstitute))
                    .join('/');

                if (!postSettings.zipped) {
                    /* Chrome AND Firefox: per-file GM_download of the blob URL
                     * (2e-F08 — Firefox honors the Zipped checkbox now; the
                     * always-zip behavior was the lost lineage shape). */
                    /* v1.13.3 (8b F12): the compat arm is duck-typed (instanceof Blob
                     * is cross-realm fragile for manager-minted blobs — the 7b F06
                     * class) and observable now (logged once) — every modern manager
                     * has URL.createObjectURL; this arm is a managed-environment
                     * fallback, not dead code. */
                    const blobIsAttachable = response.response && typeof response.response.size === 'number' && typeof response.response.slice === 'function';
                    let blobUrl;
                    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && blobIsAttachable) {
                        blobUrl = URL.createObjectURL(response.response);
                    } else {
                        if (!saveFallbackWarned) {
                            saveFallbackWarned = true;
                            console.warn('[Forums++] URL.createObjectURL unavailable — the save arm receives the raw blob.');
                        }
                        blobUrl = response.response;
                    }
                    const revokeBlobUrl = () => {
                        if (typeof blobUrl === 'string' && blobUrl.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
                            URL.revokeObjectURL(blobUrl);
                        }
                    };
                    const saveName = isFF
                        ? `${safeThreadTitle} #${postNumber} - ${sanitizeWinSegment(finalBasename)}`
                        : `${safeThreadTitle}/${finalPathInZip}`;
                    /* v1.13.3 (8b F04): a synchronous dispatch throw (blocked
                     * manager API, revoked grant) counts and settles — the
                     * per-file promise must not hang on the save arm. */
                    try {
                        GM_download({
                            url: blobUrl,
                            name: saveName,
                            onload: () => {
                                revokeBlobUrl();
                                settle();
                            },
                            onerror: err => {
                                revokeBlobUrl();
                                log.post.error(postId, `Error writing file ${finalPathInZip} to disk: ${err.error} - ${err.details}`, postNumber);
                                settle();
                            },
                        });
                    } catch (saveDispatchError) {
                        revokeBlobUrl();
                        log.post.error(postId, `Save dispatch failed for ${finalPathInZip}: ${saveDispatchError && saveDispatchError.message}`, postNumber);
                        settle();
                    }
                } else {
                    // Add to zip
                    zip.file(finalPathInZip, response.response);
                    zipFileCount++;
                    settle();
                }
            };

            const downloadPromise = new Promise(resolve => {
                let request = null;
                try {
                request = GM_xmlhttpRequest({
                    url,
                    headers: { Referer: reflink },
                    responseType: 'blob',
                    timeout: 7200000, // 2 h ultimate bound (see the comment below)
                    /* v1.12.1 (2e-F02): the stall watchdog below owns PRIMARY
                     * liveness (a fixed 60 s cap failed slow-but-healthy
                     * transfers; the no-progress abort fails only dead ones).
                     * The 2 h hard bound is the transport census's ultimate
                     * ceiling: blob transfers are capped at ~1.6 GB by the
                     * DIRECT switch (larger files never ride this transport),
                     * and 1.6 GB at 2 Mbps completes inside the bound. */
                    onreadystatechange: response => {
                        if (response.readyState === 2) {
                            // Extract filename from headers early
                            let filenameMatch = response.responseHeaders.match(/(?<=filename\*?=([^;]+'')?").*?(?=")/i);
                            if (!filenameMatch) { // Fallback for basic filename detection
                                filenameMatch = response.responseHeaders.match(/(?<=filename=").*?(?=")/i);
                            }
                            // v1.11.1 (4-c F05): a bare '%' in the header value must not
                            // abort filename detection — degrade to the raw token.
                            const safeDecodeURIComponent = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
                            const dispositionFilename = filenameMatch ? safeDecodeURIComponent(filenameMatch[0]) : null;

                            // Extract MIME type
                            const mimeTypeMatch = response.responseHeaders.match(/(?<=content-type:\s).*$/i);
                            const mimeType = mimeTypeMatch ? mimeTypeMatch[0] : null;

                            if (!resource._filename) resource._filename = dispositionFilename;
                            if (!resource._mimeType) resource._mimeType = mimeType;

                            /* v1.12.1 (2e-F05): Bunkr maintenance placeholder
                             * redirect — abort BEFORE the body lands. */
                            if (isBunkr && !abortReason) {
                                const loc = (response.responseHeaders.match(/(?<=location:\s)[^\r\n]+/i) || [''])[0].trim();
                                const fu = String(response.finalUrl || '');
                                if (/\/maint\.mp4(\?|$)/i.test(loc) || /\/maint\.mp4(\?|$)/i.test(fu)) {
                                    abortReason = 'bunkr_maint';
                                    recoveryArmed = true; // the onabort arm below owns the count
                                    try { request.abort(); } catch (e) { console.debug('[Forums++] maint abort rejected:', e && e.message); }
                                    /* v1.13.3 (8b F03): the silent-abort deadline — a manager
                                     * that fires NEITHER onabort NOR onload after abort() wedged
                                     * the per-file promise forever (the watchdog stands down on
                                     * recoveryArmed, so the F24 ceiling was unreachable);
                                     * maintSettled keeps this single-shot across all three
                                     * arms. */
                                    window.setTimeout(() => {
                                        if (maintSettled) return;
                                        maintSettled = true;
                                        completed++;
                                        h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                                        h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                        h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                                        log.post.error(postId, `::Bunkr skipped (maintenance redirect; abort callback missing)::: ${url}`, postNumber);
                                        resolve();
                                    }, 2000);
                                }
                            }
                        }
                    },
                    onprogress: response => {
                        progress.updated = response.loaded;
                        h.ui.setElProps(statusLabel.el, { color: '#00E5FF', fontWeight: 'normal' });
                        const downloadedSizeInMB = (response.loaded / (1024 * 1024)).toFixed(2);
                        const totalSizeInMB = (response.total !== -1 && response.total !== 0) ? (response.total / (1024 * 1024)).toFixed(2) : 'Unknown';

                        h.ui.setText(
                            statusLabel.el,
                            `${completed + 1} / ${totalDownloadable} 🢒 ${host.name} 🢒 ${downloadedSizeInMB} MB / ${totalSizeInMB} MB  🢒 ${ellipsedUrl}`,
                        );
                        if (response.total !== -1 && response.total !== 0) {
                            h.show(filePB);
                            h.ui.setElProps(filePB, {
                                width: `${(response.loaded / response.total) * 100}%`,
                            });
                        } else {
                            h.ui.setElProps(filePB, { width: '0%' }); // Hide or reset if total is unknown
                        }

                        /* v1.12.1 (2e-F04): large-file DIRECT switches — the size
                         * surfacing mid-download (GoFile/Pixeldrain/Filester) or the
                         * Bunkr port-killer threshold hand off to GM_download.
                         * v1.13.1 (7d F15): accumulated bytes also switch when
                         * Content-Length is absent (chunked/no-length responses
                         * never tripped the total-based check — a >1.6 GB blob
                         * rode the MV3 transport to the 2 h kill). */
                        if (!switchedToDirect && (isGoFile || isPixeldrain || isFilester) && ((response.total && response.total > BLOB_MAX_BYTES) || response.loaded > BLOB_MAX_BYTES)) {
                            switchedToDirect = true;
                            recoveryArmed = true;
                            log.post.info(postId, `::Large file (${response.total} bytes > ~1.6GB) detected -> switch to DIRECT::: ${url}`, postNumber);
                            try { request.abort(); } catch (e) { console.debug('[Forums++] large-file abort rejected:', e && e.message); }
                            startDirectDownload(resource, response.total).then(() => resolve(), () => resolve());
                            return;
                        }
                        if (!switchedToDirect && isBunkr && ((response.total && response.total > BUNKR_DIRECT_MIN_BYTES) || response.loaded > BUNKR_DIRECT_MIN_BYTES)) {
                            switchedToDirect = true;
                            recoveryArmed = true;
                            log.post.info(postId, `::Bunkr large file (${response.total} bytes > 500MB) -> switch to DIRECT::: ${url}`, postNumber);
                            try { request.abort(); } catch (e) { console.debug('[Forums++] bunkr-large abort rejected:', e && e.message); }
                            startDirectDownload(resource, response.total).then(() => resolve(), () => resolve());
                            return;
                        }
                    },
                    onload: response => {
                        /* v1.13.1 (7d F03): the transfer is COMPLETE — the save
                         * window (ask-where-to-save prompt, slow disk, the
                         * bunkr tiny-sniff chain) can take longer than stallMs
                         * with zero onprogress; the watchdog stands down so a
                         * completed file cannot be double-counted (or fully
                         * re-downloaded, for turbo). */
                        transferDone = true;
                        /* v1.12.1 (2e-F05): the onload guards — bad status,
                         * HTML/maintenance bodies, and the verifyBunkrLinks
                         * tiny-sniff (the checkbox's FIRST consumer — it was
                         * rendered+tracked but never read before this round). */
                        if (abortReason === 'bunkr_maint') {
                            /* v1.13.1 (7d F01): abort() threw — onload carries
                             * the settle the onabort arm would have owned. */
                            if (!maintSettled) {
                                maintSettled = true;
                                completed++;
                                h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                                h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                                log.post.error(postId, `::Bunkr skipped (maintenance redirect)::: ${url}`, postNumber);
                                resolve();
                            }
                            return;
                        }

                        const contentType = String((response.responseHeaders || '').match(/(?<=content-type:\s)[^\r\n]+/i)?.[0] || '');
                        const isHtml = /text\/html|application\/xhtml\+xml/i.test(contentType);
                        const badStatus = !response.status || response.status >= 400;

                        const countFailure = reason => {
                            completed++;
                            h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                            h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                            h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                            log.post.error(postId, reason, postNumber);
                            resolve();
                        };

                        if (isGoFile && (badStatus || isHtml)) {
                            /* v1.12.1 (2e-F29): the GoFile soft-block gate — warm
                             * the tab once per URL, retry once; a still-gated second
                             * pass counts the failure. */
                            if (!gofileWarmupAttempted.has(url)) {
                                gofileWarmupAttempted.add(url);
                                recoveryArmed = true;
                                log.post.info(postId, `::GoFile gate -> warm-up tab (3s) then retry [1/2]::: ${url}`, postNumber);
                                gofileWarmupOpenTab(url);
                                setTimeout(() => { startDownload(resource).then(() => resolve(), () => resolve()); }, 3000);
                                return;
                            }
                            countFailure(`::GoFile failed (gate persisted after retry)::: ${url}`);
                            return;
                        }

                        if (isBunkr) {
                            const bunkrFinalUrl = String(response.finalUrl || '');
                            const bunkrLoc = String((response.responseHeaders || '').match(/(?<=location:\s)[^\r\n]+/i)?.[0] || '');
                            const isMaint = /\/maint\.mp4(\?|$)/i.test(bunkrFinalUrl) || /\/maint\.mp4(\?|$)/i.test(bunkrLoc);
                            const blob = response.response;
                            const size = blob && typeof blob.size === 'number' ? blob.size : 0;
                            const tinyLimit = 32768;

                            if (badStatus || isHtml || isMaint) {
                                const reason = isMaint ? 'maintenance redirect (maint.mp4)' : (badStatus ? `HTTP ${response.status || 0}` : 'HTML/maintenance response');
                                countFailure(`::Bunkr skipped (${reason})::: ${url}`);
                                return;
                            }

                            /* The verifyBunkrLinks tiny-sniff — read the first 2 KB
                             * of a suspiciously small non-HTML body for placeholder
                             * markers before trusting it (async continuation owns
                             * the settle). */
                            /* v1.13.3 (8b F13): a body with NO content-type header
                             * escapes the isHtml guard above (contentType ''), so
                             * the sniff admits the headerless class too — the
                             * verifyBunkrLinks checkbox is opt-in and cheap. */
                            /* v1.13.4 (9a F02): the sniff reads a 4 KiB HEAD SLICE — the
                             * v1.13.3 headerless admission fed the WHOLE blob to
                             * blob.text(), materializing a multi-hundred-MB string to
                             * inspect 2048 chars (a headerless large binary spiked
                             * memory for nothing; the head carries every marker the
                             * test reads). */
                            if (postSettings.verifyBunkrLinks && size > 0 && (size <= tinyLimit || !contentType)) {
                                recoveryArmed = true;
                                /* v1.13.5 (10b F01): 8192 bytes covers the 2048-char
                                 * window at the 4-byte worst case — a 4096-byte CJK
                                 * slice decodes to ~1366 chars and could drop a
                                 * marker inside the window the test reads. */
                                blob.slice(0, 8192).text().then(t => {
                                    const head = String(t || '').slice(0, 2048).toLowerCase();
                                    /* v1.13.2 (7d F26): a strong marker alone, or ≥2
                                     * weak ones — a single 'cloudflare' byte sequence
                                     * in a legit small binary dropped real files. */
                                    if (head.includes('<!doctype') || head.includes('<html') || head.includes('<head') || head.includes('<body')) {
                                        return true;
                                    }
                                    return ['temporarily not available', 'maintenance', 'cloudflare'].filter(m => head.includes(m)).length >= 2;
                                }).catch(e => {
                                    console.debug('[Forums++] bunkr tiny-sniff read rejected:', e && e.message);
                                    return false;
                                }).then(isPlaceholder => {
                                    if (isPlaceholder) {
                                        countFailure(`::Bunkr skipped (tiny HTML placeholder)::: ${url}`);
                                    } else {
                                        finishSuccessfulLoad(response, resolve);
                                    }
                                }).catch(sniffChainError => {
                                    /* v1.13.3 (8b F04): the sniff chain's terminal
                                     * continuation threw (finishSuccessfulLoad's save
                                     * arm, a manager API rejection) — count and settle
                                     * instead of surfacing an unhandled rejection
                                     * that wedges the per-file promise. */
                                    console.debug('[Forums++] bunkr sniff chain rejected:', sniffChainError && sniffChainError.message);
                                    countFailure(`::Bunkr sniff chain rejected; counting as failure::: ${url}`);
                                });
                                return;
                            }

                            finishSuccessfulLoad(response, resolve);
                            return;
                        }

                        /* v1.13.3 (8b F18): a 200 HTML body on a non-bunkr host is a
                         * soft-error page — the bunkr arm has guarded this class
                         * since v1.12.1 and gofile since v1.12.0; the generic path
                         * counted it a success and staged an HTML file into the
                         * zip. Fail visibly instead. */
                        if (isHtml) {
                            countFailure(`::Download failed (HTML response)::: ${url}`);
                            return;
                        }

                        if (badStatus) {
                            countFailure(`::Download failed (HTTP ${response.status || 0})::: ${url}`);
                            return;
                        }

                        finishSuccessfulLoad(response, resolve);
                    },
                    onerror: err => {
                        transferDone = true; // 7d F03: the watchdog stands down
                        completed++;
                        log.post.error(postId, `Download failed for ${url}: ${err.error} - ${err.details}`, postNumber);
                        resolve();
                    },
                    ontimeout: () => {
                        /* v1.12.1: the 2 h ultimate bound fired — count it like
                         * any other failure (the stall watchdog should have
                         * caught genuinely dead transfers long before). */
                        transferDone = true; // 7d F03: the watchdog stands down
                        completed++;
                        log.post.error(postId, `Download timed out (2h hard bound) for ${url}`, postNumber);
                        resolve();
                    },
                    /* v1.12.1 (2e-F05): abort completion handler — recovery-owned
                     * aborts (DIRECT switch, maint, retries) are counted by their
                     * own arms; a stray abort counts as a failure.
                     * v1.13.1 (7d F01): the maint arm's comment claimed THIS arm
                     * owns the count — it never did (the recoveryArmed early
                     * return swallowed it; onload never fires after abort; the
                     * watchdog stands down on recoveryArmed) — the per-file
                     * promise hung and Promise.all wedged the whole post with
                     * the guard armed forever. The maint branch counts+settles
                     * here, single-shot (maintSettled guards the both-arms edge
                     * some managers produce). */
                    onabort: () => {
                        if (abortReason === 'bunkr_maint') {
                            if (!maintSettled) {
                                maintSettled = true;
                                completed++;
                                h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                                h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                                h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                                log.post.error(postId, `::Bunkr skipped (maintenance redirect)::: ${url}`, postNumber);
                                resolve();
                            }
                            return;
                        }
                        if (recoveryArmed || switchedToDirect) return;
                        completed++;
                        log.post.error(postId, `Download aborted for ${url}`, postNumber);
                        resolve();
                    },
                });
                } catch (e) {
                    /* v1.13.1 (7d F16): a synchronous dispatch throw (revoked
                     * grant, blocked manager API) counts and settles instead
                     * of hanging the per-file promise on an unhandled
                     * rejection — request stays null and every request.abort()
                     * site is already try-guarded. */
                    completed++;
                    log.post.error(postId, `Download dispatch failed for ${url}: ${e && e.message}`, postNumber);
                    resolve();
                }

                /* v1.12.1 (2e-F02): the no-progress stall watchdog — aborts when
                 * the byte counter stalls for stallMs; turbo URLs re-sign and
                 * retry (≤3) then fall back to DIRECT (≤1); everything else
                 * fails visibly. The interval self-clears on stall and the
                 * .finally below clears it on settle (guard+lifecycle pair). */
                /* v1.12.1: the watchdog's own time ceiling — the transport's
                 * 2 h hard bound backstops it; this arm keeps the interval
                 * from outliving a wedged request handle. */
                const WATCHDOG_MAX_MS = 7260000; // 2 h + 1 min > the transport bound
                progress.intervalId = setInterval(async () => {
                    if (switchedToDirect || recoveryArmed || transferDone) {
                        clearInterval(progress.intervalId);
                        return;
                    }
                    if (Date.now() - progress.armedAt > WATCHDOG_MAX_MS) {
                        clearInterval(progress.intervalId);
                        /* v1.13.1 (7d F24): settle at the ceiling — if the
                         * manager ignores the transport's 2 h bound the
                         * per-file promise must not hang past it. */
                        completed++;
                        log.post.error(postId, `Download watchdog ceiling reached for ${url}`, postNumber);
                        resolve();
                        return;
                    }
                    if (progress.old === progress.updated) {
                        try { request.abort(); } catch (e) { console.debug('[Forums++] stall abort rejected:', e && e.message); }
                        clearInterval(progress.intervalId);
                        recoveryArmed = true;

                        if (isTurbo) {
                            const turboId = turboIdBySignedUrl.get(url) || turboIdBySignedUrl.get(String(url).split('?')[0]);
                            const st = turboRetryState.get(resource) || { resign: 0, direct: 0 };

                            if (turboId && st.resign < TURBO_RESIGN_RETRIES) {
                                st.resign++;
                                turboRetryState.set(resource, st);
                                log.post.info(postId, `::Turbo stalled (no progress for ${Math.round(stallMs / 1000)}s) -> re-sign + retry [${st.resign}/${TURBO_RESIGN_RETRIES}]::: ${url}`, postNumber);

                                try {
                                    /* v1.13.1 (7d F17): the EMBED page is the
                                     * referer, like the resolvers pass it — the
                                     * signed CDN URL was being sent, so the
                                     * origin derivation defaulted saint2
                                     * re-signs to turbo.cr (wrong origin →
                                     * sign failure → plain retry). */
                                    const newUrl = await xfpdTurboSignUrlWithTimeout(turboId, resource.original || reflink, null);
                                    if (newUrl) {
                                        resource.url = newUrl;
                                        turboIdBySignedUrl.set(newUrl, turboId);
                                    }
                                } catch (e) {
                                    console.debug('[Forums++] turbo re-sign rejected:', e && e.message);
                                }

                                // Retry (even a plain retry sometimes works when re-sign failed).
                                setTimeout(() => { startDownload(resource).then(() => resolve(), () => resolve()); }, TURBO_RETRY_DELAY_MS);
                                return;
                            }

                            if (st.direct < TURBO_DIRECT_FALLBACKS) {
                                st.direct++;
                                turboRetryState.set(resource, st);
                                log.post.info(postId, `::Turbo stalled (no progress for ${Math.round(stallMs / 1000)}s) -> DIRECT fallback (outside ZIP) [${st.direct}/${TURBO_DIRECT_FALLBACKS}]::: ${url}`, postNumber);
                                startDirectDownload(resource).then(() => resolve(), () => resolve());
                                return;
                            }

                            completed++;
                            h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                            h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                            h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                            log.post.error(postId, `::Turbo failed (stalled after retries)::: ${url}`, postNumber);
                            resolve();
                            return;
                        }

                        // Make stalls visible instead of silently counting a
                        // failed download as complete.
                        completed++;
                        h.ui.setElProps(statusLabel.el, { color: '#ff0055' });
                        h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} 🢒 ${ellipsedUrl}`);
                        h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
                        log.post.error(postId, `::Stalled/Failed::: ${url}`, postNumber);
                        resolve();
                    } else {
                        progress.old = progress.updated;
                    }
                }, stallMs);
            }).finally(() => {
                if (progress.intervalId) clearInterval(progress.intervalId);
            });

            return downloadPromise;
        };

        // Sequential batches; items within a batch run concurrently.
        const runBatches = async () => {
            for (const batch of batches) {
                await Promise.all(batch.map(item => startDownload(item)));
            }
        };
        pipelinePromise = runBatches();
    } else {
        log.post.info(postId, '::Skipping download::', postNumber);
    }

    /* v1.12.1 (2e-F07): await the pipeline BEFORE the zip assembly — the old
     * fire-and-forget GM_download path let the beforeunload guard drop while
     * writes were still pending, and the zip gate below needs the true file
     * count. */
    await pipelinePromise;

    /* v1.12.1 (2e-F17): the final summary — an incomplete run keeps an amber
     * X / Y label visible instead of vanishing silently. */
    h.hide(filePB);
    h.hide(totalPB);
    if (!postSettings.skipDownload && totalDownloadable > 0 && completed < totalDownloadable) {
        h.ui.setElProps(statusLabel.el, { color: '#e8a838', fontWeight: 'bold' });
        h.ui.setText(statusLabel.el, `${completed} / ${totalDownloadable} downloaded`);
        h.show(statusLabel.container);
    } else {
        h.hide(statusLabel.container);
    }

    /* v1.12.1 (2e-F29): the gofile cookie restore + the processing-flag
     * clear ride downloadPostGuarded's finally now (7d F04) — they run on
     * every exit path, not just the happy one. */

    /* v1.12.1 (2e-F07): the zip gate — needZipBlob is true only when the zip
     * actually carries files, or the log/links artifacts were requested; an
     * all-DIRECT or all-failed run no longer downloads an empty archive. */
    const needZipBlob = postSettings.generateLog || postSettings.generateLinks || (postSettings.zipped && zipFileCount > 0);

    if (totalDownloadable > 0 && needZipBlob) {
        /* v1.13.3 (8b F01): safeThreadTitle at the zip gate too — the old
         * slash-only replace left ': ? *' in the GM_download names, the exact
         * GM_download name-validation failure 7d F22 was filed for (it landed
         * at the per-file arm only). */
        let title = safeThreadTitle;
        const filename = customFilename || `${title} #${postNumber}.zip`;

        log.separator(postId);
        log.post.info(postId, `::Preparing zip (${zipFileCount} file(s))::`, postNumber);

        if (postSettings.generateLog) {
            log.post.info(postId, `::Generating log file::`, postNumber);
            zip.file(
                isFF ? 'generated/log.txt' : 'log.txt',
                logs
                    .filter(l => l.postId === postId)
                    .map(l => l.message)
                    .join('\n'),
            );
        }

        if (postSettings.generateLinks) {
            log.post.info(postId, `::Generating links::`, postNumber);
            zip.file(
                isFF ? 'generated/links.txt' : 'links.txt',
                resolved
                    .filter(r => r.url)
                    .map(r => r.url)
                    .join('\n'),
            );
        }

        /* v1.12.1 (2e-F07): JSZip assembly failures are caught and logged — a
         * raw throw here used to abort the completion callbacks below. */
        let blob = null;
        try {
            blob = await zip.generateAsync({ type: 'blob' });
        } catch (zipError) {
            log.post.error(postId, `Zip assembly failed: ${zipError.message}`, postNumber);
        }

        if (blob) {
            if (isFF) {
                saveAs(blob, filename);
            } else if (postSettings.zipped && zipFileCount > 0) {
                /* v1.13.2 (7d F08): revoke the URL STRING — the old arm
                 * revoked the Blob object (coerced to '[object Blob]', a no-op
                 * that pinned every multi-MB zip blob until page unload); the
                 * saveAs fallback revokes after FileSaver has taken the blob. */
                const zipUrl = URL.createObjectURL(blob);
                /* v1.13.4 (9a F05): the zip-gate dispatches gain the arm-level
                 * try/catch the per-file arm has had since v1.13.3 (8b F04) — a
                 * synchronous dispatch throw (blocked manager API, revoked
                 * grant) must not kill the post's save; the FileSaver fallback
                 * takes the blob either way. */
                try {
                    GM_download({
                        url: zipUrl,
                        name: `${title}/#${postNumber}.zip`,
                        onload: () => URL.revokeObjectURL(zipUrl),
                        onerror: response => {
                            log.post.error(postId, `Error writing zipped file to disk: ${response.error} - ${response.details}`, postNumber);
                            console.log('Trying to write using FileSaver.js...');
                            try { saveAs(blob, filename); } catch (fsErr) { log.post.error(postId, `FileSaver fallback failed: ${fsErr && fsErr.message}`, postNumber); } // Fallback for GM_download errors (guarded v1.13.5, 10b F03)
                            URL.revokeObjectURL(zipUrl);
                        },
                    });
                } catch (zipDispatchError) {
                    log.post.error(postId, `Zip dispatch failed: ${zipDispatchError && zipDispatchError.message}`, postNumber);
                    console.log('Trying to write using FileSaver.js...');
                    /* v1.13.5 (10b F03): FileSaver itself may be missing
                     * (@require failure) — the guard's catch must not throw. */
                    try { saveAs(blob, filename); } catch (fsErr) { log.post.error(postId, `FileSaver fallback failed: ${fsErr && fsErr.message}`, postNumber); }
                    URL.revokeObjectURL(zipUrl);
                }
            } else if (postSettings.generateLog || postSettings.generateLinks) {
                // Only generate a zip with logs/links when not zipping all files
                const genUrl = URL.createObjectURL(blob);
                /* v1.13.4 (9a F05): the generated.zip arm mirrors its sibling's
                 * dispatch guard (same 8b F04 class, completed by symmetry). */
                try {
                    GM_download({
                        url: genUrl,
                        name: `${title}/#${postNumber}/generated.zip`, // Put it in a subfolder
                        onload: () => URL.revokeObjectURL(genUrl),
                        onerror: response => {
                            log.post.error(postId, `Error writing generated.zip to disk: ${response.error} - ${response.details}`, postNumber);
                            /* v1.13.3 (8b F01): the generated.zip arm gains the FileSaver
                             * fallback its sibling has had since v1.12.1 — a GM_download
                             * error silently dropped the log/links artifacts before. */
                            console.log('Trying to write using FileSaver.js...');
                            try { saveAs(blob, `${title} #${postNumber} - generated.zip`); } catch (fsErr) { log.post.error(postId, `FileSaver fallback failed: ${fsErr && fsErr.message}`, postNumber); }
                            URL.revokeObjectURL(genUrl);
                        },
                    });
                } catch (genDispatchError) {
                    log.post.error(postId, `Generated.zip dispatch failed: ${genDispatchError && genDispatchError.message}`, postNumber);
                    console.log('Trying to write using FileSaver.js...');
                    /* v1.13.5 (10b F03): the sibling's FileSaver guard, mirrored. */
                    try { saveAs(blob, `${title} #${postNumber} - generated.zip`); } catch (fsErr) { log.post.error(postId, `FileSaver fallback failed: ${fsErr && fsErr.message}`, postNumber); }
                    URL.revokeObjectURL(genUrl);
                }
            }
        }
    }

    if (totalDownloadable > 0) {
        if (!postSettings.skipDownload) {
            log.post.info(postId, `::Download completed::`, postNumber);
        } else {
            log.post.info(postId, `::Links generation completed::`, postNumber);
        }
        callbacks?.onComplete?.(totalDownloadable, completed, successful);
    }

    // Clear logs for this post after completion
    logs = logs.filter(l => l.postId !== postId);
};

/* v1.13.1 (7d F04/F13): the settlement wrapper — owns the per-post
 * lifecycle around downloadPost: the in-flight guard arms at ENTRY (before
 * the minutes-long resolver walk — a navigate during resolution used to
 * kill the run with the guard unarmed), and the try/catch/finally restores
 * it on EVERY exit path (a throw anywhere in the pipeline used to leak the
 * processing flag, pin the beforeunload guard, skip the summary/zip/log
 * cleanup, and surface as an unhandled rejection at the call sites). The
 * gofile cookie restore rides the finally (re-checked inside the restore
 * for the start-again race — 7d F27). Adjudicated window (lineage parity):
 * the guard drops when downloadPost returns; the zip's GM_download is
 * fire-and-forget by design and FileSaver's saveAs arm offers no completion
 * signal at all — holding the guard through a save that may never signal
 * trades a bounded window for a potential forever-flag. */
const downloadPostGuarded = async (parsedPost, parsedHosts, enabledHostsCB, resolversArg, getSettingsCB, statusUI, callbacks) => {
    setProcessing(true, parsedPost.postId);
    try {
        await downloadPost(parsedPost, parsedHosts, enabledHostsCB, resolversArg, getSettingsCB, statusUI, callbacks);
    } catch (e) {
        console.debug('[Forums++] downloadPost threw:', e && (e.message || e));
    } finally {
        setProcessing(false, parsedPost.postId);
        if (!processing.find(p => p.processing)) {
            gofileRestoreCookie().catch(e => console.debug('[Forums++] gofile cookie restore rejected:', e && e.message));
        }
    }
};

/**
 * Adds a "Duplicate Tab" link to a post's attribution area.
 * @param {HTMLElement} postEl The HTML element of the post's attribution.
 */
const addDuplicateTabLink = postEl => {
    const span = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = 'fa fa-copy';
    span.append(icon, ' Duplicate Tab');

    const dupTabLI = postEl.parentNode.querySelector('.u-concealed')?.cloneNode(true);
    if (!dupTabLI) return; // Ensure element exists

    dupTabLI.setAttribute('class', 'duplicate-tab');

    const anchor = dupTabLI.querySelector('a');
    if (anchor) {
        anchor.style.color = 'rgb(138, 138, 138)';
        anchor.setAttribute('target', '_blank');
        /* v1.12.1 (2e-F19): keep the cloned post anchor's own href (the
         * #post-<id> scroll context) — only the target flips to a new tab;
         * overwriting with location.href lost the anchor. */
        anchor.querySelector('time')?.remove(); // Use optional chaining
        anchor.parentNode.style.marginLeft = '10px';
        anchor.append(span);
    }

    postEl.parentNode.querySelector('.message-attribution-main')?.append(dupTabLI);
};

/**
 * Adds a "Show Download Page Button" link to a post's attribution area.
 * @param {HTMLElement} postEl The HTML element of the post's attribution.
 */
const addShowDownloadPageBtnLink = postEl => {
    const span = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = 'fa fa-arrow-up';
    span.append(icon, ' Download Page');

    const dupTabLI = postEl.parentNode.querySelector('.u-concealed')?.cloneNode(true);
    if (!dupTabLI) return; // Ensure element exists

    dupTabLI.setAttribute('class', 'show-download-page');

    const anchor = dupTabLI.querySelector('a');
    if (anchor) {
        anchor.style.color = 'rgb(138, 138, 138)';
        anchor.setAttribute('href', '#download-page');
        anchor.querySelector('time')?.remove(); // Use optional chaining
        anchor.parentNode.style.marginLeft = '10px';
        anchor.append(span);
    }

    postEl.parentNode.querySelector('.message-attribution-main')?.append(dupTabLI);
};

/**
 * Adds the main "Download Page" button to the thread.
 * @returns {HTMLAnchorElement} The created button element.
 */
const addDownloadPageButton = () => {
    const downloadAllButton = document.createElement('a');
    downloadAllButton.setAttribute('id', 'download-page');
    downloadAllButton.setAttribute('href', '#');
    downloadAllButton.setAttribute('class', 'button--link button rippleButton');

    const buttonTextSpan = document.createElement('span');
    buttonTextSpan.setAttribute('class', 'button-text download-page-btn');
    buttonTextSpan.innerText = `🡳 Download Page`;

    downloadAllButton.appendChild(buttonTextSpan);

    const buttonGroup = h.element('.buttonGroup');
    if (buttonGroup) {
        buttonGroup.prepend(downloadAllButton);
    }

    return downloadAllButton;
};

/**
 * Registers a "like" reaction on the post's footer if not already reacted.
 * @param {HTMLElement} postFooter
 */
const registerPostReaction = postFooter => {
    // Check if the user has already reacted. The target reaction ID (33) might need to be confirmed.
    const hasReaction = postFooter.querySelector('.has-reaction');
    if (!hasReaction) {
        // Find the reaction anchor to simulate a click
        const reactionAnchor = postFooter.querySelector('a[data-xf-click="reaction"]');
        if (reactionAnchor) {
            // Modify the reaction ID in the URL to a specific "like" or positive reaction ID
            const originalHref = reactionAnchor.getAttribute('href');
            if (originalHref) {
                const newHref = originalHref.replace(/_id=\d+/, '_id=33'); // Assuming _id=33 is the desired reaction
                reactionAnchor.setAttribute('href', newHref);
                reactionAnchor.click(); // Simulate click to trigger reaction
            }
        }
    }
};

const parsedPosts = [];
const selectedPosts = [];

(async () => {
    window.addEventListener('beforeunload', e => {
        if (processing.find(p => p.processing)) {
            const message = 'Downloads are in progress. Sure you wanna exit this page?';
            e.returnValue = message;
            return message;
        }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        // v1.12.0 (round 6): the legacy GoFile boot-token block (unreachable
        // createAccount path against the dead pre-2026-08 API) is removed — the
        // resolver now creates/activates/persists the guest token lazily
        // (xfpd_gofile_at, 24 h TTL) with the cookie sync in place.

        // Redgifs token handling (v1.13.0: the duplicated inline fetch is
        // gone — the status-checked refresh helper owns the flow — and the
        // boot fetch only runs on /threads/ pages, not on the gofile.io /
        // goonbox.cr helper surfaces the v1.12.0 @match widening added).
        if (location.pathname.startsWith('/threads/')) {
            await redgifsFetchTempToken();
        }

        init.injectCustomStyles(); // Inject custom CSS styles

        // Initialize Thread Page Caching
        await ThreadCache.init();
        // The cached-post search consumes this data (v1.13.2 wired the read
        // side — the in-thread search over ThreadCache pages; 7a F17's stale
        // 'future search/navigation UI' pointer is retired).

        h.elements('.message-attribution-opposite').forEach(post => {
            // Default settings for each post's download configuration
            const postDefaultSettings = {
                zipped: true,
                flatten: false,
                generateLinks: false,
                generateLog: false,
                skipDuplicates: false,
                skipDownload: false,
                verifyBunkrLinks: false,
                output: [], // Stores custom filenames per post
            };

            const parsedPost = parsers.thread.parsePost(post);
            const { content, contentContainer } = parsedPost;

            addDuplicateTabLink(post);
            addShowDownloadPageBtnLink(post);

            const parsedHosts = parsers.hosts.parseHosts(content);

            const getEnabledHostsCB = currentParsedHosts => currentParsedHosts.filter(host => host.enabled);

            if (!parsedHosts.length) {
                return; // Skip if no downloadable resources found for this post
            }

            const getTotalDownloadableResourcesForPostCB = currentParsedHosts => {
                return currentParsedHosts.filter(host => host.enabled && host.resources.length).reduce((acc, host) => acc + host.resources.length, 0);
            };

            // Create and attach the download button to post.
            const { btn: btnDownloadPost } = ui.buttons.addDownloadPostButton(post);
            const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
            const checkedLength = getTotalDownloadableResourcesForPostCB(parsedHosts);
            btnDownloadPost.textContent = `🡳 Download (${checkedLength}/${totalResources})`;

            // Create download status / progress elements.
            const { el: statusTextEl, container: statusTextContainer } = ui.labels.status.createStatusLabel();
            const filePBar = ui.pBars.createFileProgressBar();
            const totalPBar = ui.pBars.createTotalProgressBar();

            // Append status UI elements to the post's content container
            contentContainer.prepend(totalPBar);
            contentContainer.prepend(filePBar);
            contentContainer.prepend(statusTextContainer); // Prepend the container for the label

            h.hide(statusTextContainer); // Hide the label container
            h.hide(filePBar);
            h.hide(totalPBar);

            const onFormSubmitCB = data => {
                const { tippyInstance } = data;
                tippyInstance.hide(); // Hide the tooltip when form is submitted
            };

            ui.forms.config.post.createPostConfigForm(
                parsedPost,
                parsedHosts,
                `#${parsedPost.postNumber}.zip`,
                postDefaultSettings,
                onFormSubmitCB,
                getTotalDownloadableResourcesForPostCB,
                btnDownloadPost,
            );

            const statusUI = {
                status: { el: statusTextEl, container: statusTextContainer }, // Pass the label element and its container
                filePB: filePBar,
                totalPB: totalPBar,
            };

            const postDownloadCallbacks = {
                /* v1.13.2 (7d F23): the reaction fires only when something was
                 * actually staged or saved — completed>0 counted ALL-failed
                 * runs too (failures increment completed). */
                onComplete: (total, completed, successful) => {
                    if (total > 0 && successful > 0) {
                        registerPostReaction(parsedPost.footer); // React to the post on successful download
                    }
                },
            };

            let getSettingsCB = () => postDefaultSettings; // Closure to provide post-specific settings

            parsedPosts.push({
                parsedPost,
                parsedHosts,
                enabledHostsCB: getEnabledHostsCB,
                resolvers,
                getSettingsCB,
                statusUI,
                postDownloadCallbacks,
            });

            btnDownloadPost.addEventListener('click', e => {
                e.preventDefault();
                /* v1.13.1 (7d F05): re-entry guard — a double-click (or a
                 * Download-Page launch) while a run is active must not stack
                 * a second pipeline over the same resources (double
                 * downloads, torn progress bars, double auto-reaction).
                 * v1.13.8 (15a F01): the guard read a bare `postId` that has
                 * never existed in this closure — EVERY quick-download
                 * button click died as `ReferenceError: postId is not
                 * defined` before downloadPostGuarded could run (field-run
                 * proven: the operator's 2026-10-30 battery, FPP-WRM-02 /
                 * RES-03 / RES-09 all crashed at this line). The Download-
                 * Page sibling always qualified the id through the post
                 * object; this handler now does too. */
                if (processing.find(p => p.postId === parsedPost.postId && p.processing)) return;
                downloadPostGuarded(parsedPost, parsedHosts, getEnabledHostsCB, resolvers, getSettingsCB, statusUI, postDownloadCallbacks);
            });
        });

        // Initialize "Download Page" button if there are any downloadable posts
        if (parsedPosts.filter(p => p.parsedHosts.length).length > 0) {
            const btnDownloadPage = addDownloadPageButton();

            btnDownloadPage.addEventListener('click', e => {
                e.preventDefault();

                selectedPosts
                    .filter(s => s.enabled)
                    .forEach(s => {
                    /* v1.13.1 (7d F05): re-entry guard — see the per-post
                     * button above. */
                    if (processing.find(p => p.postId === s.post.parsedPost.postId && p.processing)) return;
                    downloadPostGuarded(
                        s.post.parsedPost,
                        s.post.parsedHosts,
                        s.post.enabledHostsCB,
                        s.post.resolvers,
                        s.post.getSettingsCB,
                        s.post.statusUI,
                        s.post.postDownloadCallbacks,
                    );
                });
            });

            const color = ui.getTooltipBackgroundColor();

            // Create HTML for page-level configuration form
            let html = ui.forms.createCheckbox('config-toggle-all-posts', settings.ui.checkboxes.toggleAllCheckboxLabel, false);

            parsedPosts
                .filter(p => p.parsedHosts.length)
                .forEach(post => {
                const { postId, postNumber, textContent } = post.parsedPost;

                selectedPosts.push({ post, enabled: false }); // Track which posts are selected for page download

                const threadTitle = parsers.thread.parseTitle();
                let defaultPostContent = textContent.trim().replace('​', ''); // Remove zero-width space if present

                const ellipsedText = h.escapeHTML(h.limit(defaultPostContent === '' ? threadTitle : defaultPostContent, 20));

                const summary = `<a id="post-content-${h.escapeHTML(postId)}" href="#post-${h.escapeHTML(postId)}" style="color: #00E5FF"> ${ellipsedText} </a>`;
                html += ui.forms.createCheckbox(`config-download-post-${postId}`, `Post #${h.escapeHTML(postNumber)} ${summary}`, false);
            });

            /* v1.12.1 (round 6, 2e-F24/2d-K02): the cached-post search — the
             * ThreadCache read side's FIRST consumer (the getters were exposed
             * but never called before this round; the docs' search claim was
             * false). Searches the ≤10 cached surrounding pages of THIS thread
             * (in-thread scope — not cross-thread) and jumps to matches. */
            html = `${ui.forms.createRow(ui.forms.createLabel('Post Selection'))} ${html}`;
            html += ui.forms.createRow(`<div style="margin-top:6px">
                <input id="xfpd-cache-search" type="text" placeholder="Search cached posts (this thread)" autocomplete="off"
                    style="width:92%;background:${color};color:${ui.isLightTheme() ? '#1A1D21' : '#f4f4f5'};border:1px solid rgba(0,229,255,0.35);border-radius:4px;padding:4px 6px;font-size:11px;font-family:'JetBrains Mono',monospace" />
                <div id="xfpd-cache-search-results" style="margin-top:4px;max-height:180px;overflow-y:auto;font-size:11px"></div>
            </div>`);
            ui.tooltip(btnDownloadPage, ui.forms.config.page.createForm(color, html), {
                placement: 'bottom',
                interactive: true,
                onShown: () => {
                    // Wire the cached-post search (once per tooltip render).
                    (() => {
                        const searchInput = h.element('#xfpd-cache-search');
                        const resultsBox = h.element('#xfpd-cache-search-results');
                        if (!searchInput || !resultsBox || searchInput.dataset.wired === 'true') return;
                        searchInput.dataset.wired = 'true';

                        let searchDebounce = null;

                        const runSearch = async () => {
                            const query = String(searchInput.value || '').trim().toLowerCase();
                            resultsBox.replaceChildren();
                            if (query.length < 2) {
                                const pages = await ThreadCache.listCachedPageNumbers();
                                const currentPageCount = (await ThreadCache.getCachedPage(parsers.thread.parsePost(h.elements('.message-attribution-opposite')[0])?.pageNumber || 1)).length;
                                resultsBox.textContent = pages.length
                                    ? `${pages.length} cached page(s) · ${currentPageCount} post(s) on this page's cache entry`
                                    : 'No cached pages yet (caching runs after page load)';
                                return;
                            }

                            const allPosts = await ThreadCache.getAllCachedPosts();
                            const matches = allPosts
                                .filter(p => (p.textContent || '').toLowerCase().includes(query))
                                .slice(0, 10);

                            if (!matches.length) {
                                resultsBox.textContent = `No matches for "${query}" in the cached pages.`;
                                return;
                            }

                            for (const match of matches) {
                                const line = document.createElement('div');
                                line.style.marginBottom = '3px';
                                const link = document.createElement('a');
                                /* v1.13.2 (7d F11): a match on a NON-visible cached
                                 * page needs the page path — a bare #post-<id> fragment
                                 * silently no-oped when the post wasn't in the current
                                 * DOM (the search spans up to 10 cached pages). */
                                const threadBase = location.pathname.replace(/\/page-\d+\/?$/, '/');
                                link.href = `${threadBase}${match.pageNumber > 1 ? `page-${match.pageNumber}/` : ''}#post-${match.postId}`;
                                link.style.color = '#67E8F9';
                                link.style.textDecoration = 'none';
                                const snippet = h.escapeHTML(h.limit(String(match.textContent || '').replace(/\s+/g, ' ').trim(), 48));
                                link.textContent = `#${match.postNumber} (p.${match.pageNumber}): ${snippet}`;
                                link.addEventListener('click', () => {
                                    btnDownloadPage._tippy?.hide();
                                });
                                line.appendChild(link);
                                resultsBox.appendChild(line);
                            }
                        };

                        searchInput.addEventListener('input', () => {
                            if (searchDebounce) clearTimeout(searchDebounce);
                            searchDebounce = setTimeout(() => {
                                searchDebounce = null;
                                runSearch().catch(e => console.debug('[Forums++] cache search rejected:', e && e.message));
                            }, 250);
                        });

                        runSearch().catch(e => console.debug('[Forums++] cache search initial render rejected:', e && e.message));
                    })();


                    parsedPosts
                        .filter(p => p.parsedHosts.length)
                        .forEach(post => {
                        const { postId, contentContainer } = post.parsedPost;
                        /* v1.13.2 (7d F12): wire ONCE — the tooltip content
                         * persists across shows, so every onShown re-registered
                         * the change listeners (handler accumulation) and
                         * stacked another tippy instance on the content anchor. */
                        const contentAnchor = h.element(`#post-content-${postId}`);
                        if (contentAnchor && contentAnchor.dataset.wired !== 'true') {
                            contentAnchor.dataset.wired = 'true';
                            // Add tooltips for post content summary links
                            ui.tooltip(
                                `#post-content-${postId}`,
                                `<div style="overflow-y: auto; background: rgba(10,19,26,0.85); padding: 16px; width: 500px; max-height: 500px">
                                    ${contentContainer.innerHTML}
                                </div>`,
                                { placement: 'right', offset: [10, 15] },
                            );
                        }

                        // Event listener for individual post selection checkboxes
                        const postCb = document.querySelector(`#config-download-post-${postId}`);
                        if (postCb && postCb.dataset.wired !== 'true') {
                            postCb.dataset.wired = 'true';
                            postCb.addEventListener('change', e => {
                                const selectedPost = selectedPosts.find(s => s.post.parsedPost.postId === postId);
                                if (selectedPost) {
                                    selectedPost.enabled = e.target.checked;
                                }

                                const checkAllCB = h.element('#config-toggle-all-posts');
                                if (checkAllCB) {
                                    // Update "toggle all" checkbox based on individual selections
                                    checkAllCB.checked = selectedPosts.filter(s => s.enabled).length === parsedPosts.filter(p => p.parsedHosts.length).length;
                                }
                            });
                        }

                    });

                    // Event listener for "toggle all posts" checkbox (registered once per tooltip render)
                    const toggleAllPostsEl = h.element('#config-toggle-all-posts');
                    if (toggleAllPostsEl) {
                        toggleAllPostsEl.onchange = async e => {
                            e.preventDefault();
                            const checked = e.target.checked;

                            const postCheckboxes = parsedPosts
                                .filter(p => p.parsedHosts.length)
                                .map(p => p.parsedPost)
                                .flatMap(p => h.element(`#config-download-post-${p.postId}`))
                                .filter(Boolean);

                            // Update all individual post checkboxes
                            postCheckboxes.forEach(checkbox => {
                                if (checkbox.checked !== checked) {
                                    checkbox.checked = checked;
                                    checkbox.dispatchEvent(new Event('change')); // Manually trigger change to update selectedPosts array
                                }
                            });
                        };
                    }
                },
            });
        }
    });
})();
