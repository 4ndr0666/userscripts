#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/validate.mjs — GUP v7.0.2 verification gate for the consolidated suite
 * (WO-01 round-2, 6-a F16: header said v5.3 while the banner printed v7.0.1
 * and the governing skill is v7.0.2 — one label, the real one.)
 * ----------------------------------------------------------------------------
 * Machine-checks the superset contract over the frozen baseline
 * (tools/baseline.json) and the consolidation map (tools/ledger.json):
 *
 *  Gate A — Coverage: every baseline artifact has a ledger entry (no orphans).
 *  Gate B — Identity preservation: for every baseline script, every named
 *           unit (function/class) must appear in its destination dist file,
 *           EXCEPT units explicitly reconciled in the ledger's rename map
 *           (name-based identity per GUP §1; MISSING = hard fail).
 *  Gate C — Structural: every dist file is lexically balanced, placeholder-
 *           free, and its metadata is self-consistent (name/version/URLs).
 *  Gate D — Interference ledger: verifies the documented collision fixes
 *           are actually present in dist output.
 *
 * Exit codes: 0 = certified, 1 = verification failure (fail closed).
 * ═══════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runCensus, stripComments } from "./hotkey-census.mjs";
import { runSinkCensus } from "./sink-census.mjs";
import { runKernelExportCensus } from "./kernel-export-census.mjs";
/* WO-01 round-2 (6-a F08 / round-1 deferred item d): the §1.1 lexical
 * scanner, the three-layer placeholder scan and stripCommentsKeepStrings
 * now live in tools/scan-kit.mjs — shared with build.mjs so the two
 * scanner ports can never drift apart again. */
import { checkLexicalBalance, scanPlaceholders, stripCommentsKeepStrings } from "./scan-kit.mjs";
import { runTransportCensus } from "./transport-census.mjs";
import { runPollingCensus } from "./polling-census.mjs";
import { runObserverCensus } from "./observer-census.mjs";
import { runErrorCensus } from "./error-census.mjs";
import { runScopeCensus } from "./scope-census.mjs"; /* WO-01 round 11 (OBI-F01): the promise-settlement binding census — a free-variable reference to a settlement name outside every binding span (the Forums++ 1.12.1–1.13.5 'resolve is not defined' live crash the operator's first battery run caught) fails closed */
import { runConnectCensus } from "./connect-census.mjs";
import { runOperatorBatteryCheck } from "./operator-battery.mjs"; /* WO-01 round 9: the operator-side regression battery — the machine half (anchor liveness, version stamps, residual coverage, results discipline) */
import { runDomainCensus } from "./domain-census.mjs";
import { runGlobalCensus } from "./global-census.mjs";
import { runCacheCensus } from "./cache-census.mjs";
import { runSizeBudget } from "./size-budget.mjs";
import { runWatermarkBatchSmoke } from "./watermark-batch-smoke.mjs";
import { runKernelBoundarySmoke } from "./kernel-boundary-smoke.mjs";
import { runFamilyFixtureSmoke } from "./family-fixture-smoke.mjs";
import { runFlowChipBrowserBattery } from "./flow-chip-browser-smoke.mjs";
import { runIgWallBrowserBattery } from "./ig-wall-browser-smoke.mjs";
import { runPmGridBrowserBattery } from "./pm-grid-browser-smoke.mjs";
import { runProductionScore, SCORE_THRESHOLD } from "./production-score.mjs";
import { computeInventory, serialize } from "./inventory.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const PLUGINS = path.join(ROOT, "plugins");

const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "baseline.json"), "utf8"));
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "ledger.json"), "utf8"));
/* WO-01 round-2 (6-a F09): single-read JSON cache — inventory.json was
 * parsed 4×, ledger.json 3× and package.json 2× per validation run on
 * identical bytes. The byte-parity check below still reads RAW text for
 * the byte-identity comparison and deliberately bypasses this cache. */
const jsonCache = new Map();
function readJsonCached(rel) {
    if (!jsonCache.has(rel)) {
        jsonCache.set(rel, JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")));
    }
    return jsonCache.get(rel);
}

/* Baseline keys strip the .user.js suffix + dir prefix for ledger lookup. */
function ledgerKey(baseFile) {
    return baseFile.replace(/\.user\.js$/, "").replace(/^4ndr0tools\s*-\s*/, "");
}

/* Some baseline unit names are intentionally renamed in the destination;
 * these are reconciled explicitly (GUP bidirectional alignment). */
const RECONCILED_NAMES = {
    /* WO-01 round-3 (3-a F04): MACHINE ANCHORS — every entry is now an
     * object { note, anchor } where anchor is { file, mustContain } (the
     * claimed successor surface, VERIFIED against the comment-stripped file
     * on every gate run — prose can no longer drift from code) or null
     * (documented pure removal: the absence itself is the machine-checked
     * fact, the note carries the provenance). String values remain
     * accepted by gateB() for back-compat; the map carries none today. */
    /* WO-01 round-1 (2-a F7): the map now contains ONLY entries whose units
     * are genuinely ABSENT from their dest (verified code-vs-comment:
     * comment-only mentions — Bunkr++'s retired sniffers, Prompt Master's
     * WO-001d removals — are kept because the absence is the documented
     * reconciliation; entries whose units are PRESENT AS CODE (the old
     * "(kept)" prose entries — 19 of them across PageCraft/HostWarp/
     * LinkMasterΨ) were purged: a rename that can never fire today would
     * silently mask exactly the regression it described as "kept". If one
     * of those units goes missing now, Gate B fails CLOSED, as it should. */
    "Prompt Master": {
        // v28.7.0 — operator-authorized removals (2026-10-13 transmission,
        // WO-001d): "the tools initially used to arrive at the chip counter
        // (e.g., Flow Credits Copy Report, Self-Test, etc) are not for
        // production release; Remove them." Each removal's surviving
        // invariants live on in flowCreditIntegrityCheck (boot-time) and
        // exportFlowCreditLedger (the production data surface).
        "flowCreditDebugSelfTestImpl": {"note": "removed per operator authorization (WO-001d): the 44-assertion self-test battery was the arrival tool for the counter; its table-integrity and state-machine pins survive as flowCreditIntegrityCheck's production checks, and the browser battery remains the external regression gate", "anchor": {"file": "canon/_sovereign/4ndr0tools - Prompt Master.user.js", "mustContain": ["flowCreditIntegrityCheck"]}},
        "flowCreditSleep": {"note": "removed with the pull's click path (WO-001d): paced the click/close cascade that no longer exists", "anchor": null},
        "reportFlowCreditTracker": {"note": "removed per operator authorization (WO-001d): the Copy Report was dev diagnostics, not production; superseded by exportFlowCreditLedger (machine-exact ledger JSON via the same clipboard path) + flowCreditIntegrityCheck (its self-audit block's seven machine checks live on at boot)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Prompt Master.user.js", "mustContain": ["exportFlowCreditLedger", "flowCreditIntegrityCheck"]}},
        /* The three pull-path removals below are comment-only mentions in
         * the dist changelog today (v28.7.0 banner) — the CODE is gone, so
         * these entries are the live reconciliation for when that comment
         * is ever cleaned up (WO-01 round-1, 2-a F7: kept deliberately). */
        "findFlowProfileMenuButton": {"note": "removed with the pull's click path (WO-001d): its only caller was the report's manual pull reason; pulls are passive-only now — a wallet-bearing menu already on screen is harvested, never opened", "anchor": null},
        "flowCreditDispatchEscape": {"note": "removed with the pull's click path (WO-001d): closed the menu the report opened; no code path opens Flow's profile menu anymore", "anchor": null},
        "flowCreditAnyDialog": {"note": "removed with the pull's click path (WO-001d): verified the report-opened menu's closure; flowCreditDialogWithCredits (branch A, passive harvest) stays", "anchor": {"file": "canon/_sovereign/4ndr0tools - Prompt Master.user.js", "mustContain": ["flowCreditDialogWithCredits"]}},
        /* v28.8.0 (WO-01 round 3) — the no-occlusion contract's removals.
         * The operator's field report retired the parked berth ("remains
         * present overlayed on the grid at times and obstructs the prompt
         * input itself"); the counter lives on exclusively through
         * positionFlowCreditChip's berth ladder. */
        "parkAtFlowDock": {"note": "removed with parked mode (WO-01 round 3): the above-the-dock berth put the chip over the composer's right shoulder — the input itself — when the anchor cascade went stale; positionFlowCreditChip's no-occlusion contract (flowCreditRectsOverlap + the B1/B2/B3 berth ladder) is the successor surface", "anchor": {"file": "canon/_sovereign/4ndr0tools - Prompt Master.user.js", "mustContain": ["flowCreditRectsOverlap"]}},
        "flowCreditChipHasContent": {"note": "removed with parked mode (WO-01 round 3): gated WHICH chip could park; with no parking there is nothing to gate — the chip is visible exactly when a lawful berth exists and hidden otherwise", "anchor": null},
        /* v28.8.0 (WO-01 round 3) — the pill's action-surface swap. The
         * operator retired the copy/paste pair ("the unused functions")
         * for Insights (openInsightsModal) + Enhance Prompt
         * (handleInstantPageEnhancement). */
        "handleInstantPageCopy": {"note": "removed with the pill's Copy button (WO-01 round 3): the operator retired the copy/paste pair for the Insights/Enhance pair; the pill's first slot now opens openInsightsModal, and prompt-level copy lives on in the prompt modal's per-item copy actions", "anchor": {"file": "canon/_sovereign/4ndr0tools - Prompt Master.user.js", "mustContain": ["openInsightsModal", "handleInstantPageEnhancement"]}},
    },
    "Recon": {
        "overrideFetch": {"note": "armNetworkHub onRequest/onTraffic/onError subscribers (NetHook v4 adoption, suite v1.4.6 — the reconh recorder + MITM blocklist + TypeError→204 pacification ride the shared hub; same surface, no local wrap)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Recon.user.js", "mustContain": ["armNetworkHub"]}},
        "overrideXHR": {"note": "armNetworkHub onTraffic response subscriber (NetHook v4 adoption — the XHR recorder twin rides the shared hub)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Recon.user.js", "mustContain": ["armNetworkHub"]}},
    },
    "PageCraft": {
        "redirectToImage": {"note": "n/a (HDImgsOnly unit — lives in HostWarp)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["redirectToImage"]}},
        "init": {"note": "initialScan on DOMContentLoaded/immediate (same boot orchestration — verified in modules/pagecraft/body.js)", "anchor": {"file": "modules/pagecraft/body.js", "mustContain": ["initialScan"]}},
        "GMCommandHandler": {"note": "inline typeof GM_registerMenuCommand guard (same GM4 fallback semantics)", "anchor": {"file": "modules/pagecraft/body.js", "mustContain": ["typeof GM_registerMenuCommand"]}},
    },
    "HostWarp": {
        /* WO-01 round-2 (6-a F05): surfaced by comment-aware unitPresent —
         * HDImgsOnly's waitForElement appeared only in the module-header
         * migration note. */
        "waitForElement": {"note": "kernel Ψ.core.waitFor (HDImgsOnly unit): the 100 ms polling element-wait became the kernel's MutationObserver-based waitFor — identical 3 s budget, zero idle CPU (module-header migration note, machine-anchored here)", "anchor": {"file": "kernel/core.js", "mustContain": ["waitFor"]}},
        "getChannelId": {"note": "telegramChannelId (renamed, namespace-scoped)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["telegramChannelId"]}},
        "hidePreviewBanner": {"note": "inlined into injectWebButton (same behavior)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["injectWebButton"]}},
        "orchestrate": {"note": "module boot (hosts.on dispatch)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["hosts.on("]}},
        "redirectToEmbed": {"note": "inlined into mega module (same regex)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["mega"]}},
        "enhanceVideoPlayback": {"note": "enhance (same logic)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["enhance"]}},
        "redirectToMobileSkin": {"note": "planetsuzy module body (same flow)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["planetsuzy"]}},
        "getInputField": {"note": "GEMINI_SELECTORS.input inline query (same selector)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["GEMINI_SELECTORS"]}},
        "startObserver": {"note": "watchDOM kernel replacement (same observer semantics)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["watchDOM"]}},
        "init": {"note": "module boots", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["hosts.on("]}},
        "tryInject": {"note": "injectWebButton + waitFor retry (same flow)", "anchor": {"file": "modules/hostwarp/body.js", "mustContain": ["injectWebButton"]}},
    },
    "Pixeldrain++": {
        "rng": {"note": "removed with the decorative pseudo-QR it served (hash-PRNG noise fill that could never scan); superseded by the real RS/mask QR encoder — tools/qr-verify.mjs round-trip proves the replacement", "anchor": {"file": "tools/qr-verify.mjs", "mustContain": ["qrEncode"]}},
    },
    "Forum Link Xtractor": {
        "createRadio": {"note": "createUIElement('radio', …) — unified builder, same options (download/copy)", "anchor": {"file": "canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js", "mustContain": ["createUIElement"]}},
        "createCheckbox": {"note": "createUIElement('checkbox', …) — unified builder, same options (current-page/sort)", "anchor": {"file": "canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js", "mustContain": ["createUIElement"]}},
        "silentScan": {"note": "extraction flow redesigned around toggleBtn 'Initialize Extraction Protocol'; same scan semantics", "anchor": {"file": "canon/_promoted/4ndr0tools - Forum Link Xtractor.user.js", "mustContain": ["toggleBtn"]}},
    },
    /* LinkMasterΨ section purged (WO-01 round-1, 2-a F7): all six entries
     * were "kept (AbsorbedPLR/GitRaw closure)" prose for units that are
     * present AS CODE in the dist — dead weight that would have excused
     * their disappearance. They are live code now: Gate B verifies them
     * directly, fail-closed. */
    "Forums++": {
        /* WO-01 round-6: cyberdrop_helper removed — the legacy 3x3.5 s retry
         * ladder (old cyberdrop.me/api/f JSON flow) is superseded by the live
         * api.cyberdrop.cr info->auth->direct candidate ladder with
         * cyberdropWarmupOnce retries; every former call site consumed the
         * old-API response shape the live site no longer serves. Removal
         * authorized by the operator's standing round-6 directive (zero dead
         * code); the anchor machine-checks the successor surface. */
        "cyberdrop_helper": {"note": "removed as superseded dead code (WO-01 round 6): the legacy /api/f retry ladder is replaced by the api.cyberdrop.cr info→auth→direct ladder + warm-up retries (lineage L4782-5291 port)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Forums++.user.js", "mustContain": ["cyberdropWarmupOnce", "api/file/auth/"]}},
        /* WO-01 round-6 segment 2: processQueue removed — the URL-keyed
         * while-loop scheduler is replaced by the pre-built batch array
         * (lineage batch rules) + runBatches()/startDownload(); the old
         * Promise.race deref threw on rewritten URLs and duplicate URLs
         * collapsed in the URL-keyed Set. */
        "processQueue": {"note": "removed as superseded (WO-01 round 6 segment 2): the batch-array + runBatches()/startDownload() pipeline replaces the URL-keyed while-loop scheduler", "anchor": {"file": "canon/_sovereign/4ndr0tools - Forums++.user.js", "mustContain": ["const runBatches", "startDownload(resource)"]}},
    },
    "Akasha Silence": {
        "applyNetworkHooks": {"note": "applyLocalHooks (renamed, suite v1.4.5) — the fetch/XHR/beacon defusing migrated to the NetHook v3 veto (__4NDR0_NET_API__.onRequest, kernel-owned wraps); the local installer keeps the WebSocket/WebRTC/worker pacifiers", "anchor": {"file": "canon/_merged/4ndr0tools - Akasha Silence.user.js", "mustContain": ["applyLocalHooks", "onRequest"]}},
    },
    "Youtube Removed Video Revealer": {
        /* WO-01 round-2 (6-c F05): dead helper removed — zero call sites
         * (the identifier's only occurrence was its own definition;
         * comment-stripped census clean). */
        "escapeHTML": {"note": "removed as dead code (WO-01 round-2): the HTML entity escaper had zero call sites in the shipped script and zero in the legacy baseline it was carried verbatim from", "anchor": null},
    },
    "Login Form Autofiller": {
        /* WO-01 round-10 (10c F06): the index-era ID resolver retired — the
         * element-identity binding replaced every consumer (the menu click,
         * the focus/blur visibility toggles, and updateGetLoginLinkLabel
         * carry the bound __bmnWrapper ref injected at field-wrap time);
         * zero call sites remain (comment-stripped census clean — the
         * wrapper's id survives as a diagnostic label only). */
        "getBmnWrapper": {"note": "removed as dead code (WO-01 round-10, 10c F06): the by-ID wrapper resolver served the live-index binding the element-identity refactor retired — sibling refs, the wrapper ref, and the get-login link now bind by element identity at injection time (__bmnUsernameField/__bmnPwField/__bmnWrapper), so an SPA re-render can no longer shift credentials into the wrong field or orphan the menu", "anchor": {"file": "canon/_sovereign/4ndr0tools - Login Form Autofiller.user.js", "mustContain": ["__bmnWrapper", "injectedUsernameFields"]}},
    },
    "m3u8++": {
        /* WO-01 round-4 (4-c F06): dead helper removed — zero call sites
         * (showVideo renders through createElement/textContent since the TT
         * migration; comment-stripped census clean). */
        "escapeHtml": {"note": "removed as dead code (WO-01 round-4): the G8 string-escaper had zero call sites — showVideo's item rendering is element-built (createElement/textContent), so the mitigation outlived its consumer", "anchor": { "file": "canon/_promoted/4ndr0tools - m3u8++.user.js", "mustContain": ["showVideo", "createElement"] }},
    },
    "Blob2URL": {
        /* WO-01 round-2 (6-a F05): surfaced by comment-aware unitPresent —
         * esc appeared only in the v7.2.0 TT-migration comment; both
         * baseline files (Blob2URL + Blob2URLBETA) dest here. */
        "esc": {"note": "retired v7.2.0 (suite v1.4.3 TT render class fix): the vault panels render through createElement — attributes via setAttribute, text via textContent; esc()'s HTML-assembly escaping has no assembly left to escape", "anchor": {"file": "canon/_promoted/4ndr0tools - Blob2URL.user.js", "mustContain": ["createElement", "textContent"]}},
    },
    "Confirmation Bypass": {
        /* WO-01 round-2 (6-a F05): surfaced by comment-aware unitPresent —
         * convertLinks appeared ONLY in the script's own changelog comment
         * (the G2 note); the capability lives on in appendLinks. */
        "convertLinks": {"note": "appendLinks (v4.0.3 builder form): URL hyperlinking in the View Replies table now assembles text nodes + anchor elements — the G2 \\b word-boundary fix lives in appendLinks' URL_RE; zero HTML-string assembly (TT sink class)", "anchor": {"file": "canon/_promoted/4ndr0tools - Confirmation Bypass.user.js", "mustContain": ["appendLinks"]}},
    },
    "LinkMasterΨ": {
        /* WO-01 round-2 (6-a F05): surfaced by comment-aware unitPresent —
         * the three units appeared only in the v5.1.0 superset-check
         * comment; the retirements were already documented as authorized
         * there ("superseded by the generalized epoch-guarded runCheckQueue
         * and the GM-transport-first checker; removal documented in the
         * semantic review record") — this ledger section is that record's
         * machine-checked anchor. */
        "checkLinksQueued": {"note": "retired v5.1.0 (authorized): superseded by the generalized epoch-guarded runCheckQueue — queue-drain semantics preserved, epoch guards prevent stale-batch application", "anchor": {"file": "canon/_merged/4ndr0tools - LinkMasterΨ.user.js", "mustContain": ["runCheckQueue"]}},
        "nextBulk": {"note": "retired v5.1.0 (authorized): the manual bulk-step advancer was folded into runCheckQueue's continuous drain", "anchor": {"file": "canon/_merged/4ndr0tools - LinkMasterΨ.user.js", "mustContain": ["runCheckQueue"]}},
        "getHosterChecker": {"note": "retired v5.1.0 (authorized): superseded by the GM-transport-first checker (the xhr(opts) GM_xmlhttpRequest transport with typed fallbacks)", "anchor": {"file": "canon/_merged/4ndr0tools - LinkMasterΨ.user.js", "mustContain": ["GM_xmlhttpRequest"]}},
        /* WO-01 round-4 (4-c F06): dead helper removed — zero call sites since
         * the v6.2.3 element-built twin (comment-stripped census clean). */
        "getPsiGlyphSVG": {"note": "removed as dead code (WO-01 round-4): the string-built SVG had zero call sites since buildPsiGlyphEl (v6.2.3) replaced the dock button's TT-hostile innerHTML render", "anchor": {"file": "canon/_merged/4ndr0tools - LinkMasterΨ.user.js", "mustContain": ["buildPsiGlyphEl"]}},
    },
    "4ndr0purge": {
        /* WO-01 round-1 (2-c E17): dead helper removed — zero call sites
         * verified (comment-stripped identifier census; $ / sleep / onReady
         * remain and are still consumed). */
        "$$": {"note": "removed as dead code (WO-01 round-1): the querySelectorAll wrapper had zero call sites in the shipped script — the $ helper it shadowed alongside is the live path", "anchor": null},
    },
    "BypassPaywalls": {
        /* WO-01 round-1 (2-c deferred removal, tombstone purge): the BPC
         * extension-backend tombstone (~573 lines) was REMOVED — every unit
         * below lived inside `if (typeof extensionApi !== 'undefined')`,
         * a free variable that can never exist in a userscript realm, or in
         * the GA beacon that only it called. The live DOM-side paywall chain
         * (main/matchDomain/removeDOMElement/waitDOMElement/…) is untouched.
         * WO-01 round-2 (6-a F05): this section was keyed "Bypass Paywalls"
         * (with a space) while the ledger dest is "BypassPaywalls" — the
         * lookup returned undefined and NONE of these reconciliations could
         * ever fire; the gate stayed green only because unitPresent matched
         * the purge's own changelog comments (comment-only presence). Re-keyed
         * to the real dest; comment-aware matching + the ledger-dest
         * self-check below now hold this section to its absence claims. */
        "initGA": {"note": "removed with the extension-backend tombstone (WO-01 round-1): dead GA beacon (UA-69824169-2) whose only caller lived inside the unreachable extensionApi guard", "anchor": null},
        "isSiteEnabled": {"note": "removed with the extension-backend tombstone (WO-01 round-1): consulted only by the guard block's webRequest listeners — unreachable in the userscript realm", "anchor": null},
        "matchUrlDomain": {"note": "removed with the extension-backend tombstone (WO-01 round-1): served only the guard block's request classifiers; matchDomain (the live resolver) survives", "anchor": {"file": "canon/_sovereign/4ndr0tools - BypassPaywalls.user.js", "mustContain": ["matchDomain"]}},
        "urlHost": {"note": "removed with the extension-backend tombstone (WO-01 round-1): sole consumer was matchUrlDomain (also removed)", "anchor": null},
        "getBadgeText": {"note": "removed with the extension-backend tombstone (WO-01 round-1): chrome.tabs badge helper, defined inside the unreachable guard", "anchor": null},
        "updateBadge": {"note": "removed with the extension-backend tombstone (WO-01 round-1): chrome.tabs badge helper, defined inside the unreachable guard", "anchor": null},
        "setDefaultOptions": {"note": "removed with the extension-backend tombstone (WO-01 round-1): body is pure extensionApi.storage/runtime calls; sole caller lived inside the unreachable guard", "anchor": null},
    },
    "Watermark++": {
        /* WO-01 round-2 (6-a F11): prose corrected — the cited helper name
         * armNetworkHub exists only in Recon; Watermark++ subscribes
         * directly via the inlined hub identifier. */
        "handleLoadEnd": {"note": "__4NDR0_NET_API__.onTraffic subscriber (NetHook v4 adoption, suite v1.4.7 — the RPC loadend handler became the subscriber's response-phase arm; request bodies joined by hub exchange id, same 2xx + text gates)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Watermark++.user.js", "mustContain": ["onTraffic"]}},
    },
    "Bunkr++": {
        /* WO-01 round-2 (6-a F11): prose corrected — armNetworkHub is
         * Recon's local arming helper; Bunkr++ subscribes directly via the
         * inlined hub identifier. */
        "installFetchSniff": {"note": "__4NDR0_NET_API__.onTraffic subscriber (NetHook v4 adoption, suite v1.4.7 — the fetch sniffer became the subscriber's request/response arms; the hub's page-realm wrap replaces the per-script proxy)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Bunkr++.user.js", "mustContain": ["__4NDR0_NET_API__.onTraffic"]}},
        "installXhrSniff": {"note": "__4NDR0_NET_API__.onTraffic subscriber + propagate(sandbox) (NetHook v4 adoption, suite v1.4.7 — the XHR sniffer taps became the same subscriber's arms; sandbox-realm coverage via hub propagation)", "anchor": {"file": "canon/_sovereign/4ndr0tools - Bunkr++.user.js", "mustContain": ["__4NDR0_NET_API__.onTraffic", "propagate"]}},
    },
};

const failures = [];
const passes = [];

/* ── Gate A: coverage ─────────────────────────────────────────────────── */
function gateA() {
    const baseFiles = Object.keys(baseline);
    const missing = baseFiles.filter((f) => !(ledgerKey(f) in ledger));
    if (missing.length > 0) {
        for (const m of missing) failures.push(`[A] no ledger entry for baseline "${m}"`);
    } else {
        passes.push(`[A] coverage: all ${baseFiles.length} baseline artifacts mapped`);
    }
}

/* ── Gate B: unit identity preservation ───────────────────────────────── */
/* Unit-name matcher: $-prefixed and other non-word names cannot use \b
 * word boundaries — fall back to plain substring search for them.
 * WO-01 round-2 (6-a F05): matching now runs against a COMMENT-STRIPPED
 * view (strings KEPT — a unit name in a live string is runtime behavior;
 * a unit name in a comment is documentation). The round-1 form matched RAW
 * dist text, so a changelog comment naming a retired unit satisfied Gate B
 * — the "lesson 7" anti-pattern: the gate was green because the prose
 * remembered the unit, while the code had none. The pre-existing
 * stripCommentsKeepStrings helper (below, hoisted) already implements
 * exactly these semantics for sentinel detection — Gate B now shares it. */
function unitPresent(unit, src) {
    if (/^\w/.test(unit) && /\w$/.test(unit)) {
        return new RegExp(`\\b${unit.replace(/\$/g, "\\$")}\\b`).test(src);
    }
    return src.includes(unit);
}

function gateB() {
    const distFiles = fs.existsSync(DIST) ? fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")) : [];
    const distByName = new Map();
    const distStrippedByName = new Map();
    for (const f of distFiles) {
        const key = f.replace(/\.user\.js$/, "").replace(/^4ndr0tools\s*-\s*/, "");
        const raw = fs.readFileSync(path.join(DIST, f), "utf8");
        distByName.set(key, raw);
        /* WO-01 round-2 (6-a F05): the comment-stripped view is what unit
         * identity is tested against — comments are documentation, not
         * code; strings are runtime data and stay. Computed once per file. */
        distStrippedByName.set(key, stripCommentsKeepStrings(raw));
    }
    /* WO-01 round-2 (6-a F05): RECONCILED_NAMES key self-check — every key
     * must be a live ledger dest. A mis-keyed section (the round-1
     * "Bypass Paywalls" vs dest "BypassPaywalls" drift) is dead config whose
     * reconciliations can never fire, and the gate had no way to notice. */
    const ledgerDests = new Set(Object.values(ledger).map((e) => e.dest).filter(Boolean));
    for (const rnKey of Object.keys(RECONCILED_NAMES)) {
        if (!ledgerDests.has(rnKey)) {
            failures.push(`[B] RECONCILED_NAMES key "${rnKey}" matches no ledger dest — dead reconciliation config (re-key it to the ledger dest)`);
        }
    }
    /* WO-01 round-4 (4-a F06): UNCONDITIONAL anchor self-check — the
     * per-unit path below only verifies anchors whose units are ABSENT
     * from the dest (the unitPresent short-circuit runs first), so an
     * anchor whose claimed successor disappeared while the unit name
     * coincidentally (re)appeared in the dest was never checked — a
     * dormant-anchor class. Every anchor is now verified on EVERY run,
     * independent of unit presence: drift in either direction fails. */
    for (const [destKeySelf, renamesSelf] of Object.entries(RECONCILED_NAMES)) {
        for (const unitSelf of Object.keys(renamesSelf)) {
            const rnSelf = renamesSelf[unitSelf];
            if (typeof rnSelf !== "object" || rnSelf === null || !rnSelf.anchor) continue;
            const anchorFileSelf = path.join(ROOT, rnSelf.anchor.file);
            if (!fs.existsSync(anchorFileSelf)) {
                failures.push(`[B] anchor self-check: "${unitSelf}" (${destKeySelf}) — anchor file missing: ${rnSelf.anchor.file}`);
                continue;
            }
            const anchorViewSelf = stripCommentsKeepStrings(fs.readFileSync(anchorFileSelf, "utf8"));
            for (const tokenSelf of rnSelf.anchor.mustContain || []) {
                if (!anchorViewSelf.includes(tokenSelf)) {
                    failures.push(`[B] anchor self-check: "${unitSelf}" (${destKeySelf}) — anchor stale: "${tokenSelf}" not found in ${rnSelf.anchor.file}`);
                }
            }
        }
    }
    /* WO-01 round-1 (2-b F-05): the plugins/candidshiny.user.js special
     * case was removed with the plugin's retirement — its only consumer was
     * the long-retired LinkMasterΨ2; the ledger entry is mode "retired" and
     * Gate B skips it before any dest lookup. */
    let checked = 0, reconciled = 0;
    for (const [baseFile, info] of Object.entries(baseline)) {
        const key = ledgerKey(baseFile);
        const entry = ledger[key];
        if (!entry) continue;
        if (entry.mode === "retired") continue;

        /* Absorbed-by-PageCraft exceptions: HDImgsOnly units land in HostWarp. */
        let destKey = entry.dest;
        if (!destKey) continue;   /* retired in place (e.g. plugins/candidshiny, WO-01 r1) */
        let destSrc = distStrippedByName.get(destKey);
        if (!distByName.has(destKey)) {
            failures.push(`[B] "${key}" -> dest "${destKey}" not found in dist/`);
            continue;
        }
        const renames = RECONCILED_NAMES[destKey] || {};
        for (const unit of info.units) {
            checked++;
            if (unitPresent(unit, destSrc)) continue;
            /* WO-01 round-1 (2-a F7): hasOwnProperty, NOT truthiness — a unit
             * named like an Object.prototype member (the baseline carries
             * "toLocaleString") would be excused by the INHERITED method
             * through `renames[unit]` truthiness, masking a real regression.
             * WO-01 round-3 (3-a F04): the value may be a STRING (prose,
             * back-compat) or an OBJECT with a machine anchor —
             *   { note, anchor: { file, mustContain } }  → every mustContain
             *     token is verified against the comment-stripped view of the
             *     anchored file, so the claimed successor surface is
             *     machine-checked and prose can no longer drift from code;
             *   { note, anchor: null }                   → documented pure
             *     removal (the absence itself is the machine-checked fact —
             *     unitPresent already proved the name is gone). */
            if (Object.prototype.hasOwnProperty.call(renames, unit)) {
                const rn = renames[unit];
                if (typeof rn === "object" && rn !== null && rn.anchor) {
                    const anchorFile = path.join(ROOT, rn.anchor.file);
                    if (!fs.existsSync(anchorFile)) {
                        failures.push(`[B] unit "${unit}" from "${key}": anchor file missing — ${rn.anchor.file}`);
                        continue;
                    }
                    const anchorView = stripCommentsKeepStrings(fs.readFileSync(anchorFile, "utf8"));
                    for (const token of rn.anchor.mustContain || []) {
                        if (!anchorView.includes(token)) {
                            failures.push(`[B] unit "${unit}" from "${key}": anchor stale — "${token}" not found in ${rn.anchor.file} (the reconciliation's claimed successor is gone — update the anchor or the prose)`);
                        }
                    }
                }
                reconciled++;
                continue;
            }
            failures.push(`[B] unit "${unit}" from "${key}" MISSING in dest "${destKey}"`);
        }
    }
    passes.push(`[B] identity: ${checked} baseline units checked, ${reconciled} explicitly reconciled`);
}

/* ── Gate C: structural integrity of dist ──
 * §1.1-aware lexical scanner: imported from tools/scan-kit.mjs (WO-01
 * round-2, 6-a F08 — build.mjs's v1.4.7 lineage was strictly newer: the
 * forward lastSig + nested-template fixes this local v1.3.0 copy lacked). */

/* Placeholder scan, two layers:
 *  (a) WORD markers (TODO/FIXME/XXX/HACK/…): matched against code with
 *      comments stripped AND string literal contents blanked — a TODO note
 *      in a comment or the word "placeholder" inside a CSS selector string
 *      is documentation, not a defect.
 *  (b) SENTINEL VALUES: `= "PLACEHOLDER"` / `= 'TODO'` assignments matched
 *      against comment-stripped source (strings preserved) — the legacy
 *      `const settingsHash = "PLACEHOLDER"` bug class, where a shipped
 *      script could never work out of the box. The assignment anchor
 *      ([\w$)]] before =) keeps CSS attribute selectors like
 *      [class*="placeholder"] out of scope. */
/* stripCommentsKeepStrings: imported from tools/scan-kit.mjs (WO-01 round-2, 6-a F08). */

/* scanPlaceholders (three-layer union): imported from tools/scan-kit.mjs. */

function gateC() {
    if (!fs.existsSync(DIST)) { failures.push("[C] dist/ not built"); return; }
    const files = fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js"));

    /* Docs-coincide invariant (suite v1.4.2, operator mandate): every dist
     * script must have coinciding documentation. The INDEX.md version
     * stamps must match the live inventory — fail-closed when a version
     * bump forgets `npm run docs` (docs drift = stale manifests, the
     * exact failure mode GUP 5.2.2 codified for code). */
    const docsIndexPath = path.join(ROOT, "documentation", "INDEX.md");
    if (!fs.existsSync(docsIndexPath)) {
        failures.push(`[C] documentation: INDEX.md missing — run \`npm run docs\``);
    } else if (files.length) {
        const idx = fs.readFileSync(docsIndexPath, "utf8");
        const invScripts = readJsonCached("inventory.json").scripts;   /* WO-01 round-2 (6-a F09): cached single read */
        const drift = [];
        for (const s of invScripts) {
            const short = s.name.replace(/^4ndr0tools\s*-\s*/, "");
            if (!idx.includes(`| **${short}** | \`${s.version}\``)) drift.push(`${short} v${s.version}`);
        }
        if (drift.length) {
            failures.push(`[C] documentation drift (INDEX.md stale for: ${drift.join(", ")}) — run \`npm run docs\``);
        } else passes.push(`[C] documentation coincides with all ${invScripts.length} dist scripts (INDEX version-stamped)`);
    }
    /* v1.4.6: README Size-stamp freshness — gen-docs writes `| Size | … |`
     * from inventory.json; a source change between the docs run and the
     * final check leaves stale size stamps that INDEX version-stamping
     * cannot see (the v1.4.6 kit matrix caught exactly this failure
     * class). The stamps must coincide with the live inventory. */
    if (files.length && fs.existsSync(docsIndexPath)) {
        const invScripts2 = readJsonCached("inventory.json").scripts;
        const readmes = {};
        for (const dir of fs.readdirSync(path.join(ROOT, "documentation"))) {
            const rp = path.join(ROOT, "documentation", dir, "README.md");
            if (!fs.existsSync(rp)) continue;
            const content = fs.readFileSync(rp, "utf8");
            const head = (content.split("\n", 1)[0] || "");
            const hm = /^# (.+?) · v(\d[\d.]*)$/.exec(head);
            if (hm) readmes[hm[1]] = { version: hm[2], content };
        }
        const stale = [];
        for (const s of invScripts2) {
            const short = s.name.replace(/^4ndr0tools\s*-\s*/, "");
            const r = readmes[short];
            if (!r) continue; /* scripts without a generated per-script README are not Size-stamped */
            if (r.version !== s.version) { stale.push(`${short} version ${r.version}≠${s.version}`); continue; }
            const want = `| Size | ${(s.bytes / 1024).toFixed(1)} KB · ${s.lines} lines |`;
            if (!r.content.includes(want)) stale.push(`${short} size stamp`);
        }
        if (stale.length) {
            failures.push(`[C] documentation drift (README stale for: ${stale.join(", ")}) — run \`npm run docs\` AFTER the final \`npm run check\``);
        } else {
            passes.push(`[C] README size/version stamps coincide with inventory for all ${Object.keys(readmes).length} documented scripts`);
        }
    }
    /* WO-01 round 9 (the 9d82511 message-vs-diff class caught live): the
     * hand-written deep devlogs (documented=true in gen-docs KNOWLEDGE)
     * are LINKED but never rewritten by the generator, so their
     * "current shipped" banners can drift silently — the r8 commit claimed
     * "Devlog: the 6.1.2 entry" while its diff never touched the devlog,
     * and the tree advertised v6.1.1 against canon v6.1.2 for a full round.
     * The banner must name its dist file and carry that script's live
     * inventory version; the check self-discovers devlogs by the banner
     * shape (a new hand-written devlog is covered on its first run). */
    {
        const invScripts3 = readJsonCached("inventory.json").scripts;
        const bannerStale = [];
        let devlogCount = 0;
        for (const dir of fs.readdirSync(path.join(ROOT, "documentation"))) {
            const rp = path.join(ROOT, "documentation", dir, "README.md");
            if (!fs.existsSync(rp)) continue;
            const head = fs.readFileSync(rp, "utf8").split("\n").slice(0, 12).join("\n");
            if (!/current shipped/i.test(head)) continue; /* generated references re-write their own head */
            devlogCount++;
            const dm = /dist\/(4ndr0tools - [^`*]+?\.user\.js)/.exec(head);
            if (!dm) { bannerStale.push(`${dir}/README.md banner names no dist file`); continue; }
            const scriptFile = dm[1].trim();
            const inv = invScripts3.find((s) => s.file === scriptFile);
            if (!inv) { bannerStale.push(`${dir}/README.md banner names unknown dist file ${scriptFile}`); continue; }
            /* the "current shipped" LINE must carry the version — not just
             * anywhere in the head (an addendum mentioning the release would
             * mask a stale banner line; red-controlled exactly so). */
            const bannerLines = head.split("\n").filter((l) => /current shipped/i.test(l)).join("\n");
            if (!bannerLines.includes(inv.version)) bannerStale.push(`${dir}/README.md banner stale (the 'current shipped' line says a version ≠ v${inv.version} for ${scriptFile}) — re-stamp the banner and add the release addendum`);
        }
        if (bannerStale.length) {
            failures.push(`[C] documentation drift (devlog banner stale for: ${bannerStale.join(", ")}) — hand-written devlogs are linked, never rewritten: re-stamp them with the release`);
        } else {
            passes.push(`[C] devlog current-release banners coincide with inventory for all ${devlogCount} hand-written devlog(s)`);
        }
    }
    let n = 0;
    for (const f of files) {
        n++;
        const src = fs.readFileSync(path.join(DIST, f), "utf8");
        const bal = checkLexicalBalance(src, f);
        if (bal) failures.push(`[C] lexical imbalance — ${bal}`);

        /* V8 authoritative parse — the §1.1 scanner is a heuristic; V8 is
         * ground truth (same engine family that executes the script). */
        const v8 = spawnSync(process.execPath, ["--check", path.join(DIST, f)], { encoding: "utf8" });
        if (v8.status !== 0) {
            failures.push(`[C] ${f}: V8 parse rejected — ${(v8.stderr || "").split("\n").filter(Boolean).slice(0, 2).join(" | ")}`);
        }

        const m = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
        if (!m) { failures.push(`[C] ${f}: no metadata block`); continue; }
        const ver = m[1].match(/@version\s+(\S+)/);
        const name = m[1].match(/@name\s+(.+)/);
        if (!ver) failures.push(`[C] ${f}: no @version`);
        if (!name) failures.push(`[C] ${f}: no @name`);
        /* Update-channel integrity: keys must be canonical-case, URLs must
         * carry the /dist/ install-channel segment, and must self-reference
         * the file. Case-variant keys (@updateUrl) previously escaped this
         * check entirely — a silent 404 update channel. */
        const upd = m[1].match(/@\s*updateURL\s+(\S+)/gi) || [];
        const dl = m[1].match(/@\s*downloadURL\s+(\S+)/gi) || [];
        for (const u of [...upd, ...dl]) {
            const key = u.match(/@(\w+)/)[1];
            if (key !== "updateURL" && key !== "downloadURL") {
                failures.push(`[C] ${f}: non-canonical metadata key case "${key}"`);
                continue;
            }
            const url = u.replace(/@\w+\s+/, "");
            if (!url.includes("/dist/")) {
                failures.push(`[C] ${f}: ${key} missing /dist/ install-channel segment`);
            }
            if (!url.includes(encodeURI(f).replace(/#/g, "%23")) && !url.includes(f.replace(/ /g, "%20"))) {
                failures.push(`[C] ${f}: ${key} self-reference drift (${url.slice(-40)})`);
            }
        }
        /* placeholder scan (comment/string-aware; see scanPlaceholders) */
        for (const ph of scanPlaceholders(src)) failures.push(`[C] ${f}: ${ph}`);
    }
    passes.push(`[C] structural: ${n} dist files lexically + metadata checked`);
}

/* ── Gate D: documented collision fixes present in dist ───────────────── */
async function gateD() {
    const read = (key) => {
        const f = path.join(DIST, `4ndr0tools - ${key}.user.js`);
        return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
    };
    const recon = read("Recon");
    if (!recon.includes("e.altKey && e.shiftKey && (e.key || '').toLowerCase() === 'r'")) {
        failures.push(`[D] Recon: Alt+Shift+R collision fix not present`);
    } else passes.push(`[D] Recon Alt+Shift+R fix verified`);

    const mam = read("Maximize_Any_Media");
    // v1.2.0 moved the MAM console from Alt+S (ModelSearch's suite-wide combo)
    // to Alt+Shift+S; the v1.4.1 hotkey-census round moved it again to
    // Alt+Shift+M — Alt+Shift+S is YTPM's YouTube settings combo.
    if (!/console \(Alt\+Shift\+M\)/.test(mam)) {
        failures.push(`[D] Maximize_Any_Media: Alt+Shift+M console combo not present`);
    } else if (/console \(Alt\+Shift\+S\)/.test(mam) || /keyCode == 83/.test(mam)) {
        failures.push(`[D] Maximize_Any_Media: stale Alt+Shift+S console remnants still present`);
    } else passes.push(`[D] Maximize_Any_Media Alt+Shift+M console combo verified (YTPM owns Alt+Shift+S on YouTube)`);

    const lm = read("LinkMasterΨ");
    if (!lm.includes("AbsorbedPLR") || !lm.includes("AbsorbedGitRaw")) {
        failures.push(`[D] LinkMasterΨ: absorbed modules not present`);
    } else passes.push(`[D] LinkMasterΨ absorbed modules verified`);

    const img = read("Images++");
    if (!img.includes("collapseModeHotkey")) {
        failures.push(`[D] Images++: configurable hotkey port not present`);
    } else passes.push(`[D] Images++ configurable hotkey verified`);

    const hw = read("HostWarp");
    if (!hw.includes("imagetwist.com") || !hw.includes("mega.nz/embed/") || !hw.includes("styleid") || !hw.includes("tg4-web-btn") || !hw.includes("searxng:pattern") || !hw.includes("forceImmediateAnswer")) {
        failures.push(`[D] HostWarp: 6 absorbed host-tool modules not complete`);
    } else passes.push(`[D] HostWarp 6 absorbed modules verified`);

    const pc = read("PageCraft");
    if (!pc.includes("_cache_bust") || !pc.includes("RELOAD_BROKEN_IMAGES")) {
        failures.push(`[D] PageCraft: imgfix module not present`);
    } else passes.push(`[D] PageCraft modules verified`);

    const asil = read("Akasha Silence");
    if (!asil.includes("defuseScript") || !asil.includes("applyLocalHooks") || !asil.includes("getRealLinkFromGoogleUrl") || !asil.includes("makePhantomWebSocket")) {
        failures.push(`[D] Akasha Silence: absorbed trio modules not present`);
    } else passes.push(`[D] Akasha Silence absorbed trio verified`);

    /* v1.4.5 NetHook veto migration — Akasha's fetch/XHR/beacon defusing
     * rides the shared hub (kernel/net.js v3): the per-script Proxy
     * facades are gone, the veto subscription + iframe propagation are
     * present, and the canon source carries no own-network-wrap
     * remnants. Canon is the scan surface (dist carries the inlined
     * kernel, which owns the sanctioned wraps). */
    const asilCanonPath = path.join(ROOT, "canon", "_merged", "4ndr0tools - Akasha Silence.user.js");
    const asilCanon = fs.existsSync(asilCanonPath) ? fs.readFileSync(asilCanonPath, "utf8") : "";
    if (!asilCanon.includes("__4NDR0_NET_API__.onRequest") || !asilCanon.includes("__4NDR0_NET_API__.propagate")) {
        failures.push(`[D] Akasha Silence: NetHook veto subscription/propagation not present in canon`);
    } else passes.push(`[D] Akasha Silence NetHook veto adoption verified (fetch/XHR/beacon defusing rides the shared hub)`);
    if (/targetWindow\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|navigator\.sendBeacon\s*=|\.prototype\.(?:open|send)\s*=\s*function/.test(asilCanon)) {
        failures.push(`[D] Akasha Silence: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }
    const netSrcV = fs.readFileSync(path.join(ROOT, "kernel", "net.js"), "utf8");
    if (!/VERSION\s*=\s*6\s*;/.test(netSrcV) || !/onRequest:\s*function/.test(netSrcV) || !/propagate:\s*function/.test(netSrcV) || !/onTraffic:\s*function/.test(netSrcV) || !/onError:\s*function/.test(netSrcV) || !/gmFetch:\s*gmFetch/.test(netSrcV) || !/onNode:\s*function/.test(netSrcV) || !/requestSubscriberCount/.test(netSrcV) || !/trafficSubscriberCount/.test(netSrcV) || !/errorSubscriberCount/.test(netSrcV) || !/nodeSubscriberCount/.test(netSrcV)) {
        failures.push(`[D] NetHook kernel: veto/traffic/error/transport/dom api surface incomplete (version 6 + onRequest/onTraffic/onError/onNode/propagate/gmFetch + subscriber counts)`);
    } else passes.push(`[D] NetHook veto + traffic + recovery + transport + DOM defuse semantics verified (request verdicts, structured events, error pacification, gmFetch privileged transport, onNode kernel-owned observer; defusers and observers ride one hub)`);

    /* v1.4.6 NetHook adoption — Recon + Stream Interceptor ride the shared
     * hub (kernel/net.js v4): the per-script fetch/XHR recorders and
     * blockers are gone from canon, the veto/traffic/recovery
     * subscriptions are present, and no own-network-wrap remnants
     * survive. Canon is the scan surface (dist carries the inlined
     * kernel, which owns the sanctioned wraps). */
    const reconCanonPath = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Recon.user.js");
    const reconCanon = fs.existsSync(reconCanonPath) ? fs.readFileSync(reconCanonPath, "utf8") : "";
    if (!reconCanon.includes("__4NDR0_NET_API__") || !reconCanon.includes("NET_HUB.onRequest") || !reconCanon.includes("NET_HUB.onTraffic") || !reconCanon.includes("NET_HUB.onError")) {
        failures.push(`[D] Recon: NetHook veto/traffic/recovery subscriptions not present in canon`);
    } else passes.push(`[D] Recon NetHook adoption verified (blocklist verdicts + structured capture + 204 pacification on the shared hub)`);
    if (/_window\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|navigator\.sendBeacon\s*=|\.prototype\.(?:open|send)\s*=\s*function/.test(reconCanon)) {
        failures.push(`[D] Recon: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }
    const siCanonPath = path.join(ROOT, "canon", "_promoted", "4ndr0tools - Stream Interceptor.user.js");
    const siCanon = fs.existsSync(siCanonPath) ? fs.readFileSync(siCanonPath, "utf8") : "";
    if (!siCanon.includes("__4NDR0_NET_API__") || !siCanon.includes("NET_HUB.onRequest") || !siCanon.includes("NET_HUB.onTraffic") || !siCanon.includes("NET_HUB.propagate")) {
        failures.push(`[D] Stream Interceptor: NetHook veto/traffic/propagate subscriptions not present in canon`);
    } else passes.push(`[D] Stream Interceptor NetHook adoption verified (SVG veto + discovery + deep inspection on the shared hub)`);
    if (/win\.fetch\s*=|pageWindow\.fetch\s*=|XMLHttpRequest\.prototype\.(?:open|send)\s*=|__usiHooked/.test(siCanon)) {
        failures.push(`[D] Stream Interceptor: legacy own-network-wrap remnants still present in canon (must ride NetHook)`);
    }

    /* v1.4.7 NetHook adoption — the observer family rides the shared hub.
     * Per script: the canon must carry the hub subscription surface, and
     * the legacy per-script wrap shapes must be gone. The two surviving
     * adjudicated wraps (m3u8++'s GM dev-proxy, Watermark++'s intent-gated
     * processing proxy) are NOT refused — their shapes are scoped to the
     * exact legacy sites each refusal targets. */
    const OBSERVER_ADOPTIONS = [
        {
            name: "Bunkr++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onRequest", "__4NDR0_NET_API__.onTraffic", "__4NDR0_NET_API__.propagate"],
            label: "fake-stats respond verdict + URL classifier/body sweeper + sandbox propagation on the shared hub",
            refuse: [/unsafeWindow\.fetch\s*=/, /target\.fetch\s*=\s*wrapped/, /\bxo\.open\s*=/, /\bxo\.send\s*=/],
        },
        {
            name: "Filester++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "media-URL cache + API-hit log on request-phase events",
            refuse: [/window\.fetch\s*=/],
        },
        {
            name: "Instagram++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "feed digest on response-phase events",
            refuse: [/win\.fetch\s*=/, /XMLHttpRequest\.prototype\.open\s*=/, /XMLHttpRequest\.prototype\.send\s*=/],
        },
        {
            name: "Prompt Master", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "flow-credit scanner on response-phase events",
            refuse: [/pageWin\.fetch\s*=/, /XO\.prototype\.open\s*=/, /XO\.prototype\.send\s*=/],
        },
        {
            name: "Watermark++", dir: "_sovereign",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "gemini RPC observer on xhr events (pending-map join by exchange id)",
            refuse: [/gwrGeminiRpcOpen/, /gwrGeminiRpcSend/],
        },
        {
            name: "m3u8++", dir: "_promoted",
            need: ["__4NDR0_NET_API__.onTraffic"],
            label: "playlist sniffer on response-phase events (fetch + xhr unified)",
            refuse: [/XMLHttpRequest\.prototype\.open\s*=/, /Response\.prototype\.text\s*=/],
        },
    ];
    for (const spec of OBSERVER_ADOPTIONS) {
        const p = path.join(ROOT, "canon", spec.dir, `4ndr0tools - ${spec.name}.user.js`);
        const src = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
        const missing = spec.need.filter((needle) => !src.includes(needle));
        if (missing.length > 0) {
            failures.push(`[D] ${spec.name}: NetHook subscription surface missing (${missing.join(", ")})`);
        } else {
            passes.push(`[D] ${spec.name} NetHook adoption verified (${spec.label})`);
        }
        const remnant = spec.refuse.find((re) => re.test(src));
        if (remnant) {
            failures.push(`[D] ${spec.name}: legacy own-network-wrap remnant still present in canon (${remnant})`);
        }
    }

    /* v1.4.8 PM Media Slideshow (operator candidate integration) — the
     * surface gate: the mediaSlideshow shortcut entry with the
     * census-safe Alt+T combo (the candidate's Alt+S was re-lettered —
     * ModelSearch owns it universally), the full open/close/toggle
     * lifecycle, the persisted config riding the backup family, and the
     * manager-menu entry. The candidate's slideshowKeyHandler indirection
     * was simplified to the named handler (census-resolvable). */
    const pmCanonPath2 = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Prompt Master.user.js");
    const pmCanon2 = fs.existsSync(pmCanonPath2) ? fs.readFileSync(pmCanonPath2, "utf8") : "";
    if (!pmCanon2.includes('mediaSlideshow: {') || !pmCanon2.includes('keys: "Alt+T"') ||
        !pmCanon2.includes("function toggleSlideshow()") || !pmCanon2.includes("function closeSlideshow()") ||
        !pmCanon2.includes("function openSlideshow()") || !pmCanon2.includes("function harvestSlideshowMedia()") ||
        !pmCanon2.includes("function resolveSlideshowScopeRoot()") || !pmCanon2.includes("function slideshowSweepScrollerSync(") ||
        !pmCanon2.includes("function slideshowScheduleAsyncHarvest(") || !pmCanon2.includes("function slideshowSyncFullscreenIcon()") ||
        !pmCanon2.includes('"SlideshowConfig",') || !pmCanon2.includes("Media Slideshow")) {
        failures.push(`[D] Prompt Master: Media Slideshow surface incomplete (mediaSlideshow Alt+T + lifecycle + active-collection scoping + virtual-scroll harvest + config + menu entry)`);
    } else passes.push(`[D] Prompt Master Media Slideshow verified (operator candidate integrated; Alt+T census re-letter, active-collection scoping + virtual-scroll accumulation + high-contrast 3lectric-Glass icons, config rides the backup family)`);
    if (/keys: "Alt\+[SD]",\s*\n\s*desc: "Opens\/closes the media slideshow/.test(pmCanon2) || /mediaSlideshow[\s\S]{0,120}keys: "Alt\+S"/.test(pmCanon2)) {
        failures.push(`[D] Prompt Master: media slideshow combo regressed to a census-owned letter (Alt+S ModelSearch / Alt+D GPD domain)`);
    }

    /* v1.4.8 GPD gmFetch adoption — GooglePhotosandDrive++ rides the
     * kernel's v5 privileged transport for Drive true-direct resolution:
     * the canon calls the hub's gmFetch (never a bare manager call), the
     * transport grant + its @connect targets are declared (alignment:
     * declared use ⇒ declared grant), and the confirm-form parser stays
     * DOMParser-based (D8 — regex over HTML is a hard fail shape). */
    const gpdCanonPath = path.join(ROOT, "canon", "_promoted", "4ndr0tools - GooglePhotosandDrive++.user.js");
    const gpdCanon = fs.existsSync(gpdCanonPath) ? fs.readFileSync(gpdCanonPath, "utf8") : "";
    if (!gpdCanon.includes("__4NDR0_NET_API__.gmFetch") || !gpdCanon.includes("resolveDriveTrueDirect") || !gpdCanon.includes("buildDirectFromForm")) {
        failures.push(`[D] GooglePhotosandDrive++: kernel gmFetch adoption surface missing (resolveDriveTrueDirect via __4NDR0_NET_API__.gmFetch)`);
    } else passes.push(`[D] GooglePhotosandDrive++ gmFetch adoption verified (Drive true-direct resolution rides the kernel v5 transport)`);
    if (/GM_xmlhttpRequest\s*\(/.test(gpdCanon.replace(/const gpdKernelLessGmFetch = [\s\S]*?\n        \};/, ""))) {
        failures.push(`[D] GooglePhotosandDrive++: bare GM transport call in canon (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(gpdCanon) || !/@connect\s+drive\.usercontent\.google\.com/.test(gpdCanon) || !/@connect\s+drive\.google\.com/.test(gpdCanon)) {
        failures.push(`[D] GooglePhotosandDrive++: transport grant/@connect declarations incomplete for the privileged probe`);
    } else passes.push(`[D] GooglePhotosandDrive++ transport declarations verified (grant + connect targets align with the probe's endpoints)`);
    if (/drive\.(?:google|usercontent\.google)[^'"`\n]*\\?\s*\)|form\.innerHTML\s*=/.test(gpdCanon) && /responseText\.match\(\s*<form/.test(gpdCanon)) {
        failures.push(`[D] GooglePhotosandDrive++: regex-over-HTML parsing shape present (must use DOMParser)`);
    }

    /* v1.4.9 gmFetch consolidation — the five census-surviving local wrapped
     * transports retire onto kernel/net.js v5.1 (one suite-wide transport
     * implementation). Per script: the canon's facade must route through
     * __4NDR0_NET_API__.gmFetch, the legacy bare-dispatch body shape must
     * be gone (adjudicated one-off GM sites are NOT refused — the refusal
     * targets the retired copy's exact dispatch shape), and the transport
     * grant + connect surface stays declared (bidirectional alignment:
     * the inlined kernel's capability detection consumes the grant). */
    const canonOf = (dir, name) => {
        const p = path.join(ROOT, "canon", dir, `4ndr0tools - ${name}.user.js`);
        return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
    };

    /* Bunkr++ 7.7.0 — GAP 9 abort registry now holds AbortControllers fed to
     * the kernel's opts.signal; typed NetError replaces the untyped
     * 'Network error: '/'Timeout: '/'Aborted: ' rejections (no caller ever
     * branched on those strings — verified). */
    const bkrCanonG = canonOf("_sovereign", "Bunkr++");
    if (!bkrCanonG.includes("__4NDR0_NET_API__.gmFetch") || !bkrCanonG.includes("checkStatus:  false") || !/_activeRequests\.add\(ctl\)/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: kernel gmFetch adoption surface missing (kernel-routed adapter + AbortController in the GAP 9 registry + checkStatus:false raw resolution)`);
    } else passes.push(`[D] Bunkr++ kernel gmFetch adoption verified (transport rides kernel v5.1; GAP 9 STOP aborts via AbortController, typed NetError taxonomy)`);
    if (/const control = GM_xmlhttpRequest\(\{\s*\n\s*timeout:\s*_API_TIMEOUT_MS,\s*\n\s*\.\.\.opts,/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(bkrCanonG) || !/@connect\s+\*/.test(bkrCanonG) || !/@connect\s+127\.0\.0\.1/.test(bkrCanonG)) {
        failures.push(`[D] Bunkr++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Bunkr++ transport declarations preserved (GM_xmlhttpRequest grant + wildcard/localhost connects intact)`);

    /* Gofile++ 2.2.0 — the Response-facade utils.gmFetch routes through the
     * kernel (every status resolves raw; ok computed facade-side); the
     * baseline dispatched with NO timeout, so the 20 s hard bound is a
     * superset hardening, and the fetch-Response facade is preserved
     * byte-for-byte for its five call sites (gofile API + ADBM + aria2). */
    const gfCanonG = canonOf("_sovereign", "Gofile++");
    if (!gfCanonG.includes("__4NDR0_NET_API__.gmFetch") || !gfCanonG.includes("checkStatus: false") ||
        !/json: \(\) => Promise\.resolve\(JSON\.parse\(response\.responseText\)\)/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: kernel gmFetch adoption surface missing (kernel-routed facade + checkStatus:false + preserved Response facade)`);
    } else passes.push(`[D] Gofile++ kernel gmFetch adoption verified (fetch-Response facade rides the kernel v5.1 transport; 20 s hard timeout added)`);
    if (/GM_xmlhttpRequest\(\{\s*\n\s*method: options\.method \|\| 'GET',/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(gfCanonG) || !/@connect\s+api\.gofile\.io/.test(gfCanonG) || !/@connect\s+localhost/.test(gfCanonG)) {
        failures.push(`[D] Gofile++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Gofile++ transport declarations preserved (GM_xmlhttpRequest grant + api.gofile.io/localhost connects intact)`);

    /* Instagram++ 13.2.0 — gmFetchBlob keeps only its POLICY (the 2xx+body
     * blob gate) on top of the kernel transport; the download tier's
     * GM_xmlhttpRequest typeof guard stays (sanctioned detection shape,
     * avoids the pointless typed rejection round-trip before Tier 3). */
    const igCanonG = canonOf("_sovereign", "Instagram++");
    if (!igCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/responseType: 'blob'/.test(igCanonG) ||
        !/res\.status >= 200 && res\.status < 300 && res\.response/.test(igCanonG)) {
        failures.push(`[D] Instagram++: kernel gmFetch adoption surface missing (blob gate policy over the kernel transport)`);
    } else passes.push(`[D] Instagram++ kernel gmFetch adoption verified (gmFetchBlob policy gate rides the kernel v5.1 transport)`);
    if (/GM_xmlhttpRequest\(\{\s*\n\s*method: 'GET',\s*\n\s*url,\s*\n\s*responseType: 'blob',/.test(igCanonG)) {
        failures.push(`[D] Instagram++: legacy local gmFetchBlob dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(igCanonG) || !/@connect\s+cdninstagram\.com/.test(igCanonG) || !/@connect\s+instagram\.com/.test(igCanonG)) {
        failures.push(`[D] Instagram++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Instagram++ transport declarations preserved (GM_xmlhttpRequest grant + cdn/instagram connects intact)`);

    /* Pixeldrain++ 1.2.0 — the rich gmXHR facade keeps SPOOF_HEADERS +
     * anonymous-default + 60s timeout + raw-response policy over the
     * kernel transport; progress/onloadstart/signal ride the v5.1 opts;
     * the five gmXHR abort branches recognize BOTH the typed
     * (e.kind === 'abort') and legacy ('aborted') forms; the fsa inline
     * stream one-off (adjudicated, custom settle semantics) and the
     * fetch AbortError branch are untouched. */
    const pdCanonG = canonOf("_sovereign", "Pixeldrain++");
    if (!pdCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/opts\.spoof === false \? \{\} : SPOOF_HEADERS/.test(pdCanonG) ||
        !/anonymous:\s*opts\.anonymous !== false/.test(pdCanonG) || !/onprogress:\s*opts\.onprogress/.test(pdCanonG) ||
        !/signal:\s*opts\.signal/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: kernel gmFetch adoption surface missing (spoof/anonymous/progress/signal policy over the kernel transport)`);
    } else passes.push(`[D] Pixeldrain++ kernel gmFetch adoption verified (gmXHR facade rides the kernel v5.1 transport with progress + signal)`);
    if (/const xhr = typeof GM_xmlhttpRequest === 'function'\s*\n\s*\? GM_xmlhttpRequest\s*\n\s*: \(typeof GM !== 'undefined' && GM\.xmlHttpRequest\);/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: legacy local gmXHR dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/e\.kind === 'abort' \|\| e\.message === 'aborted'/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: abort branches not widened to the typed taxonomy (e.kind === 'abort')`);
    } else passes.push(`[D] Pixeldrain++ abort branches verified (typed abort + legacy message both recognized — superset)`);
    if (!/@grant\s+GM_xmlhttpRequest/.test(pdCanonG) || !/@grant\s+GM\.xmlHttpRequest/.test(pdCanonG) || !/@connect\s+pixeldrain\.com/.test(pdCanonG)) {
        failures.push(`[D] Pixeldrain++: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Pixeldrain++ transport declarations preserved (GM_xmlhttpRequest + GM.xmlHttpRequest grants + pixeldrain.com connects intact)`);

    /* Blob2URL 7.3.0 — the privileged blob hop rides the kernel; the
     * status-0 opaque tolerance, empty-body classification, and exact
     * fallback-chain diagnostics stay facade-side (hardenedFetch chain
     * untouched). */
    const b2uCanonG = canonOf("_promoted", "Blob2URL");
    if (!b2uCanonG.includes("__4NDR0_NET_API__.gmFetch") || !/responseType: 'blob'/.test(b2uCanonG) ||
        !/\(status >= 200 && status < 300\) \|\| status === 0/.test(b2uCanonG) || !/hardenedFetch/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: kernel gmFetch adoption surface missing (blob policy + status-0 tolerance + hardenedFetch chain over the kernel transport)`);
    } else passes.push(`[D] Blob2URL kernel gmFetch adoption verified (privileged blob hop + hardenedFetch fallback chain ride the kernel v5.1 transport)`);
    if (/const gmFetch = \(url\) => new Promise\(\(resolve, reject\) => \{\s*\n\s*if \(typeof GM_xmlhttpRequest !== 'function'\)/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: legacy local gmFetch dispatch shape still present (must ride __4NDR0_NET_API__.gmFetch)`);
    }
    if (!/@grant\s+GM_xmlhttpRequest/.test(b2uCanonG) || !/@connect\s+\*/.test(b2uCanonG)) {
        failures.push(`[D] Blob2URL: transport grant/@connect declarations incomplete after consolidation`);
    } else passes.push(`[D] Blob2URL transport declarations preserved (GM_xmlhttpRequest grant + wildcard connects intact)`);

    /* v1.3.0 interference ledger — the nine documented fixes of this round. */
    if (!asil.includes("AKASHA_PROFILE") || !asil.includes("Ctrl+Alt+Shift+K") || !asil.includes("akasha_silence_profile")) {
        failures.push(`[D] Akasha Silence: strictness relief valve not present`);
    } else passes.push(`[D] Akasha Silence profile valve verified`);

    const bkr = read("Bunkr++");
    if (!bkr.includes("/^\\/(?:a|v|d|e)\\//") || !bkr.includes("session-surface exemption")) {
        failures.push(`[D] Bunkr++: session-surface exemption not present`);
    } else passes.push(`[D] Bunkr++ session-surface exemption verified`);

    const wcp = read("Website Control Panel");
    if (!wcp.includes("hud_site_off") || !wcp.includes("psi-cp-close") || !wcp.includes("Alt+Shift+H")) {
        failures.push(`[D] WCP: HUD sovereignty surfaces not present`);
    } else passes.push(`[D] WCP HUD sovereignty verified`);
    if (wcp.includes("@import url(") || wcp.includes("@importurl(") || /@import\s+url\(\s*['"]?https?:/i.test(wcp)) {
        failures.push(`[D] WCP: remote font @import still present`);
    } else passes.push(`[D] WCP local font stack verified`);

    const mpc = read("Media Player Controller");
    if (!mpc.includes("MEDIA PLAYER CONTROLLER") || !mpc.includes("acquireBestCandidate")) {
        failures.push(`[D] MPC: rebrand + fallback acquisition not present`);
    } else passes.push(`[D] MPC rebrand + fallback acquisition verified`);
    if (mpc.includes("MEDIA GODMODE</div>") || /Media Godmode v\d/.test(mpc)) {
        failures.push(`[D] MPC: legacy Godmode branding still present`);
    } else passes.push(`[D] MPC legacy branding purged`);

    const lm2 = read("LinkMasterΨ");
    if (!lm2.includes("isVideoPageLink") || !lm2.includes("looksLikeMediaTile") || !lm2.includes("data-lazy-src")) {
        failures.push(`[D] LinkMasterΨ: video-grid + lazy capture not present`);
    } else passes.push(`[D] LinkMasterΨ video-grid + lazy capture verified`);

    const b2u = read("Blob2URL");
    if (!b2u.includes("URL VAULT") || !b2u.includes("__4NDR0_NET_API__")) {
        failures.push(`[D] Blob2URL: universal vault + NetHook wire capture not present`);
    } else passes.push(`[D] Blob2URL universal vault + shared NetHook wire capture verified`);

    const si = read("Stream Interceptor");
    if (!si || !si.includes("MAX_FOUND_URLS") || !si.includes("Stream Interceptor")) {
        failures.push(`[D] Stream Interceptor: suite membership incomplete`);
    } else passes.push(`[D] Stream Interceptor suite membership verified`);

    const hwDist = read("HostWarp");
    const pcDist = read("PageCraft");
    if (!hwDist.includes("a4:glass") || !pcDist.includes("a4:glass")) {
        failures.push(`[D] HostWarp/PageCraft: rebuilt without the repaired glass kernel`);
    } else passes.push(`[D] HostWarp/PageCraft glass-kernel repair verified`);

    // Kernel TT-immunity invariant (suite v1.4.2): DOMParser.parseFromString
    // is a Trusted Types sink under require-trusted-types-for 'script' —
    // including the image/svg+xml branch (field-proven: YTPM v1.4.0's 54
    // uncaught TypeErrors on YouTube; the HostWarp/PageCraft settings-
    // console deaths at glyphEl()). The kernel must be zero-string-sink BY
    // CONSTRUCTION: no parseFromString, no innerHTML/outerHTML assignment,
    // no insertAdjacentHTML, no document.write, no eval/new Function in
    // kernel/*.js. Scripts that must parse remote strings route through
    // Ψ.core.parseHTML/parseXML (policy-wrapped, verified in kernel-smoke).
    // Comment-aware scan — changelog notes never satisfy a gate (lesson 7).
    const KERNEL = path.join(ROOT, "kernel");
    const TT_SINK_RE = /parseFromString\s*\(|\.(?:inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/;
    const kernelSinks = [];
    for (const f of fs.readdirSync(KERNEL).filter(f => f.endsWith(".js"))) {
        const code = stripComments(fs.readFileSync(path.join(KERNEL, f), "utf8"));
        if (f === "core.js") {
            // core.js HOSTS the sanctioned wrappers (parseHTML/parseXML) —
            // every parseFromString there must feed tt.createHTML(...).
            const bare = code.match(/parseFromString\(\s*(?!tt\.createHTML\()/g);
            if (bare) kernelSinks.push(`${f}: ${bare.length} un-wrapped parseFromString call(s)`);
            const m2 = code.match(/\.(?:inner|outer)HTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/);
            if (m2) kernelSinks.push(`${f}: ${m2[0].trim()}`);
        } else {
            const m = code.match(TT_SINK_RE);
            if (m) kernelSinks.push(`${f}: ${m[0].trim()}`);
        }
    }
    if (kernelSinks.length) {
        for (const k of kernelSinks) failures.push(`[D] kernel TT-immunity: string sink in ${k}`);
    } else passes.push(`[D] kernel TT-immunity verified (0 parseFromString/innerHTML/eval sinks in kernel/)`);
    const glyphSrc = fs.readFileSync(path.join(KERNEL, "brand.js"), "utf8");
    if (!glyphSrc.includes("glyphNode") || !fs.readFileSync(path.join(KERNEL, "glass.js"), "utf8").includes("Ψ.brand.glyphNode()")) {
        failures.push(`[D] kernel TT-immunity: glyph must be built via Ψ.brand.glyphNode (createElementNS), not parsed`);
    } else passes.push(`[D] glyph createElementNS construction verified`);

    const fpp = read("Forums++");
    if (!fpp.includes("function setProcessing")) {
        failures.push(`[D] Forums++: setProcessing restoration not present`);
    } else passes.push(`[D] Forums++ setProcessing restoration verified`);

    const pdDist = read("Pixeldrain++");
    if (
        !pdDist.includes("const list = el('div', null, jobs.map(j =>") ||
        !pdDist.includes("const runNavRefresh = debounce(() => {") ||
        !pdDist.includes("GM_registerMenuCommand('★ Premium: active', openSettingsPanel);") ||
        /* WO-01 round 6: the gofile status gate strengthened to the null-safe
         * form in the 2026-08 API rewrite (`!props ||` short-circuits before
         * the member reads — the v1.10.2 precedence fix preserved and
         * strictly widened). */
        !fpp.includes("if (!props || props.status !== 'ok' || !props.data)") ||
        !fpp.includes("if (requiredPassword && !unlocked)") ||
        /* WO-01 round 6 (segment 2): the watchdog cleanup rides the
         * per-download progress record now (the requestProgress shared
         * record died with the restructure). */
        !fpp.includes("if (progress.intervalId) clearInterval(progress.intervalId);") ||
        !lm2.includes("const spoilerCandidates =") ||
        !lm2.includes("const folderId = matches?.[1] || matches?.[2] || null;") ||
        !lm2.includes("hasRedirectLink(n)")
    ) {
        failures.push(`[D] v1.7.2 stepwise gap mitigations: incomplete in Pixeldrain++ / Forums++ / LinkMasterΨ`);
    } else {
        passes.push(`[D] v1.7.2 stepwise gap mitigations verified (Pixeldrain++ DOM-node jobs modal + debounced nav; Forums++ gofile/cyberfile/cyberdrop/GM_download/interval fixes; LinkMasterΨ jpg6/ibb/cyberfile/cyberdrop/m.box/AbsorbedPLR fixes)`);
    }

    const yrvrDist = read("Youtube Removed Video Revealer");
    if (/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\1\s*;/.test(stripComments(lm2)) ||
        /\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\1\s*;/.test(stripComments(fpp)) ||
        !yrvrDist.includes("let batchDeletedIDs =") ||
        !yrvrDist.includes("button.addEventListener('click', ButtonClickActionFullView)")) {
        failures.push(`[D] TDZ & restore-button closure: self-shadowing TDZ or unwired TitleRestoredBtn detected in LinkMasterΨ / Forums++ / Youtube Removed Video Revealer`);
    } else {
        passes.push(`[D] LinkMasterΨ, Forums++ & Youtube Removed Video Revealer TDZ closure + Restore Titles button wiring verified`);
    }

    const wmk = read("Watermark++");
    if (!wmk.includes("function resolveFetchedImageMimeType")) {
        failures.push(`[D] Watermark++: resolveFetchedImageMimeType restoration not present`);
    } else passes.push(`[D] Watermark++ mime resolver restoration verified`);

    const wmBatch = runWatermarkBatchSmoke(ROOT);
    if (wmBatch.problems.length) {
        for (const p of wmBatch.problems) failures.push(`[D] Watermark++ delegated-batch smoke: ${p}`);
    } else {
        passes.push(`[D] Watermark++ delegated-batch battery verified (${wmBatch.passed}/${wmBatch.total} assertions + red control; observer graduated to structural COALESCED)`);
    }

    // OPSEC invariant (suite v1.4.0): zero remote asset fetches — a
    // counter-surveillance suite must never phone home to font CDNs
    // (IP leak + fingerprint vector on every page load). Local stacks only.
    const remoteImports = [];
    for (const f of fs.readdirSync(DIST).filter(f => f.endsWith(".user.js"))) {
        if (fs.readFileSync(path.join(DIST, f), "utf8").includes("@import url('http")) {
            remoteImports.push(f);
        }
    }
    if (remoteImports.length) {
        failures.push(`[D] OPSEC: remote @import still present in: ${remoteImports.join(", ")}`);
    } else passes.push(`[D] OPSEC remote-asset ban verified (0 remote @imports across dist)`);

    // Hotkey census (suite v1.4.1): registration-level co-install safety —
    // every keyboard claim across canon/ + modules/ is mined idiom-aware
    // (kernel registry, hand-rolled keydown, config defaults, combo tables)
    // and same-combo + domain-overlap pairs fail closed.
    const census = runCensus();
    if (census.problems.length) {
        for (const pr of census.problems) failures.push(`[D] hotkey census: unresolved site ${pr.file}:${pr.line} — ${pr.msg}`);
    }
    for (const col of census.collisions) {
        failures.push(`[D] hotkey census: COLLISION ${col.combo} — ${col.a.script} × ${col.b.script}`);
    }
    for (const st of census.stale) {
        failures.push(`[D] hotkey census: stale adjudication ${st.combo} × ${st.scripts.join(" × ")} — remove the dead entry`);
    }
    if (!census.problems.length && !census.collisions.length && !census.stale.length) {
        passes.push(`[D] hotkey census verified (${census.registrations.length} combos across ${new Set(census.registrations.map(r => r.script)).size} scripts, ${census.siteTotal} sites scanned, 0 co-install collisions)`);
    }

    // Sink census (suite v1.4.3, operator mandate): every HTML-string
    // sink + page-network tap across dist is counted and adjudicated in
    // tools/sink-census.mjs's ledger; fail closed on unadjudicated sites,
    // count drift in either direction, and any kernel class-A sink.
    // Migrated-to-zero this round: FLX (8), Confirmation Bypass (6),
    // BypassPaywalls (2); the Blob2URL + LinkMasterΨ net layers ride the
    // shared kernel/net.js NetHook singleton.
    const sinks = runSinkCensus();
    if (sinks.problems.length) {
        for (const sk of sinks.problems) failures.push(`[D] sink census: ${sk}`);
    } else {
        passes.push(`[D] sink census verified (${sinks.totalSites} HTML-string/net-tap sites across ${sinks.fileCount} dist files, all adjudicated; FLX/CB/BPW at zero, NetHook owns the ψ-family wraps)`);
    }

    /* WO-01 round-2 (6-a F10 / round-1 deferred item c): the kernel-export
     * census — round-1's dead-export prune was manual; this check keeps the
     * export surface × consumer contract machine-enforced so dead surface
     * cannot re-accumulate and orphaned Ψ-references fail closed. */
    const kexports = runKernelExportCensus();
    if (kexports.problems.length) {
        for (const ke of kexports.problems) failures.push(`[D] kernel-export census: ${ke}`);
    } else {
        passes.push(`[D] kernel-export census verified (${kexports.summary.exports} exports across ${kexports.summary.modules} modules — ${kexports.summary.live} code-consumed, ${kexports.summary.kept} ledgered, ${kexports.summary.refs} references checked bidirectionally)`);
    }

    // Transport boundedness census (suite v1.4.10, round mandate): every
    // GM_xmlhttpRequest / GM.xmlHttpRequest dispatch in the review sources
    // (canon + modules + kernel) must be hard-bounded — a literal call
    // object without `timeout:` is the exact defect class that shipped in
    // v1.4.9 (11 sites / 5 scripts, found by manual audit because no gate
    // measured it). Indirect dispatches are adjudicated in the census
    // ledger; the kernel's own bound is asserted on its req literal. This
    // gate is the class-closure: the suite can never ship an unbounded
    // privileged transport again.
    const transport = runTransportCensus();
    if (transport.problems.length) {
        for (const tp of transport.problems) failures.push(`[D] transport census: ${tp}`);
    } else {
        passes.push(`[D] transport census verified (${transport.boundedSites} bounded dispatch(es) + ${transport.adjudicatedSites} adjudicated indirect dispatch(es) across ${transport.filesScanned} source files, 0 unbounded; kernel req-literal timeout asserted)`);
    }

    // Polling boundedness census (suite v1.5.0, GUP B.1 round mandate):
    // every setInterval site in the review sources is machine-classified
    // as RETRY-BOUND (attempt/time ceiling with a proven clear),
    // SERVICE-GUARDED (lifecycle clear + bounding guard — visibility,
    // activity, negated-presence, or session gate), or LEDGERED
    // (page-lifetime watcher with justification + expiry, drift-checked).
    // The Phase A audit found 39 active sites with no gate measuring the
    // class — 24 of them with no clear path at all. This gate is the
    // class-closure for GUP B.1 "Bounded Polling".
    const polling = runPollingCensus();
    if (polling.problems.length) {
        for (const pl of polling.problems) failures.push(`[D] polling census: ${pl}`);
    } else {
        passes.push(`[D] polling census verified (${polling.sites} setInterval sites across ${polling.filesScanned} source files — ${polling.retryBounded} retry-bounded, ${polling.serviceGuarded} service-guarded, ${polling.ledgered} ledgered page-lifetime; 0 unbounded; ${polling.selfRearms} setTimeout self-re-arm(s): ${polling.selfRearmBounded} block-scoped ceilinged + ${polling.selfRearmStateGated} state-gated under @noframes — the WO-01 round-4 scoping closed the vacuous-pass class: the ceiling proof now reads the re-arm's own basic block, not the whole resolved body)`);
    }

    // Observer discipline census (suite v1.5.1, GUP B.1 "Observer
    // Discipline" — v1.5.0 verdict §2/G2): every new MutationObserver site
    // in the review sources is machine-classified as ONE-SHOT
    // (self-disconnecting waitFor idiom — the observer is its own bound),
    // PERSISTENT-COALESCED (structural node/presence/config filter plus a
    // proven debounce/throttle/rAF coalescer), PERSISTENT-CHEAP (filter plus
    // an O(1) guarded body — no loops, no structural DOM writes, no network),
    // or LEDGERED (per-site adjudication: timing-critical microtask
    // defuse/sanitize/reattach races, scoped single-element watchers,
    // settle-bounded probes, delegated batch processors — justification +
    // expiry, drift-checked). The v1.5.1 round coalesced 9 sites (CB
    // scanTargets, GPD context-menu strip, Gofile sidebar sync, IG media
    // scan, LMΨ redirect rewrite + forum post tranche, ANW node tranche,
    // Yandex viewer check, YTPM stats re-add) — all behavior-preserving
    // (identical node sets / idempotent rescans). This gate is the
    // class-closure for GUP B.1 observer discipline.
    const observers = runObserverCensus();
    if (observers.problems.length) {
        for (const ob of observers.problems) failures.push(`[D] observer census: ${ob}`);
    } else {
        passes.push(`[D] observer census verified (${observers.sites} MutationObserver sites across ${observers.filesScanned} source files — ${observers.oneShot} one-shot, ${observers.coalesced} coalesced, ${observers.cheap} cheap-O(1), ${observers.ledgered} ledgered, ${observers.hubDelegated} hub-delegated (NetHook onNode), ${observers.kernelOwned} kernel-owned; 0 undisciplined)`);
    }

    // Typed-error census (suite v1.5.1, GUP G11 — v1.5.0 verdict §2/G11):
    // every non-kernel catch site in the review sources is machine-classified
    // as TYPED (instanceof / name / code / kind branching — the D6 primary),
    // DEBUG (scoped-interceptor-with-debug — the v1.5.1 round inserted the
    // tagged console.debug line into all 246 former silent swallows across
    // 21 scripts, zero functional change), HANDLED (recovery work without
    // logging), or SILENT (true swallow — fails closed unless ledgered with
    // justification + expiry). The kernel's NetError family is self-asserted
    // (non-shrink: class definitions + API exports). This gate is the
    // class-closure for GUP G11 typed errors.
    const errors = runErrorCensus();
    if (errors.problems.length) {
        for (const er of errors.problems) failures.push(`[D] error census: ${er}`);
    } else {
        passes.push(`[D] error census verified (${errors.catchSites} catch sites + ${errors.promiseCatchSites} Promise .catch sites + ${errors.thenArmSites} .then error arms across ${errors.filesScanned} source files — ${errors.typed} typed, ${errors.debug} debug-logged, ${errors.handled} handled, ${errors.silent} silent, ${errors.silentPromiseCatches - errors.ledgeredPromiseArms} silent promise handlers (${errors.ledgeredPromiseArms} ledgered); kernel NetError family asserted, ${errors.kernelClasses} classes)`);
    }

    // Promise-settlement binding census (WO-01 round 11, OBI-F01): the
    // operator's first real battery run caught Forums++ 1.12.1–1.13.5
    // shipping a success handler that referenced the download promise
    // executor's `resolve` param from OUTSIDE its binding scope — every
    // successful load threw ReferenceError at the settle line and the
    // batch wedged forever ('gofile++ to absolutely zero avail'). Five
    // rounds of shape-reading censuses missed it because none read
    // BINDING. This census reads binding: every settlement-name reference
    // (resolve/reject/settle/fulfill) must sit inside a span where that
    // name is actually bound (executor param, callback param, declaration,
    // catch). Fixture self-assertion proves the class both directions at
    // every run.
    const scopes = runScopeCensus();
    if (scopes.problems.length) {
        for (const sc of scopes.problems) failures.push(`[D] scope census: ${sc}`);
    } else {
        passes.push(`[D] scope census verified (${scopes.filesScanned} source files, ${scopes.references} settlement references, ${scopes.bindingNames} bound names, 0 free — the OBI-F01 class closed repo-wide; fixture self-assertion green)`);
    }

    // Minimal-privilege connect census (suite v1.5.1, GUP G7 — v1.5.0
    // verdict §2/G7): every canon installable's declared @connect set is
    // reconciled against its observed privileged-endpoint literals
    // (gmFetch / GM_xhr argument strings); observed-but-undeclared hosts
    // fail closed; the 9 sanctioned wildcards (page-content/user-directed
    // fetch families — Blob2URL, LinkMasterΨ, FLX, m3u8++, Stream
    // Interceptor, Images++, Bunkr++, Gofile++, Pixeldrain++) are ledgered
    // with justification + burn-down note + expiry, drift-checked in both
    // directions. Class-closure for GUP G7 minimal-privilege connects.
    const connects = runConnectCensus();
    if (connects.problems.length) {
        for (const cn of connects.problems) failures.push(`[D] connect census: ${cn}`);
    } else {
        passes.push(`[D] connect census verified (${connects.scripts} declaring scripts, ${connects.connectDeclarations} @connect tokens, ${connects.observedHosts} observed literal hosts — ${connects.dispatchLiteral} literal + ${connects.dispatchVariable} variable-url dispatch sites (${connects.dispatchDerived} derived host-sets / ${connects.dispatchPartial} partial / ${connects.dispatchResidual} residual underivable — the 2d-F01 derivation engine: const-walk ≤2 hops + helper-1-level admission + resolver-table gate alternation, decrease-refusing exact-equality ledger per file; the 7c F01 form family: GM_download + aliases + opts-args + parameter-alias admission, comment/definition sites excluded) — ${connects.wildcardScripts} wildcards, all ledgered with justification + expiry)`);
    }

    // Operator-side regression battery (WO-01 round 9 — the operator's
    // directive: the live-behavior verifications the machine gate cannot
    // make, finally given a manifest, a checklist, and an ingestion loop).
    // The machine certifies the battery is WELL-FORMED AND AIMED AT LIVING
    // CODE: manifest schema, anchor liveness at the stamped version (the
    // RECONCILED_NAMES {file, mustContain} precedent), residual-coverage
    // totality, dist installability, results-ledger discipline. The
    // OPERATOR certifies the code works by running the rendered checklist
    // (documentation/operator-battery/README.md) and pasting the report
    // back — ingest lands in tools/operator-battery/results.json.
    const battery = runOperatorBatteryCheck();
    if (battery.problems.length) {
        for (const bt of battery.problems) failures.push(`[D] operator battery: ${bt}`);
    } else {
        passes.push(`[D] operator regression battery verified (${battery.tests} operator-side tests across ${battery.families} families — ${battery.anchors} anchors all LIVE at their stamped versions, ${battery.residuals} worklog residuals fully covered, every referenced script installable from dist; results ledger: ${battery.adjudicated} of ${battery.results} entries adjudicated — the live-behavior complement renders at documentation/operator-battery/README.md)`);
    }

    // Co-install domain census (suite v1.5.1, GUP G12 — v1.5.0 verdict
    // §2/G12): the @match/@include surface (incl. module meta.json) is
    // normalized to domain keys; every hot key (≥2 scripts) must be
    // coordinated in the co-install ledger with drift-checked membership
    // — the 19-script star family, the forum trio, the instagram pair, the
    // YT quartet, the gemini pair. A NEW hot domain fails closed (no
    // un-governed co-install overlap can be added silently). The hotkey
    // census remains the behavioral-collision gate. Class-closure for GUP
    // G12 domain co-install.
    const domains = runDomainCensus();
    if (domains.problems.length) {
        for (const dm of domains.problems) failures.push(`[D] domain census: ${dm}`);
    } else {
        passes.push(`[D] domain census verified (${domains.scripts} scripts, ${domains.domainKeys} domain keys — ${domains.starFamily}-script star family, ${domains.hotDomains} hot domains all coordinated, drift-checked)`);
    }

    // Identity evidence coverage (suite v1.5.1, GUP G8 — the escalation
    // contract's target-0): every unit in tools/ledger.json carries an
    // evidence/note field (carried units cite Gate B identity preservation;
    // merged units cite the rename-map reconciliation and the census
    // surfaces that own their classes), and every destination exists in
    // dist. Un-evidenced units fail closed — identity reconciliation may
    // never regress to narrative-only. (Gate A owns coverage; Gate B owns
    // named-unit preservation; this gate owns the evidence trail.)
    try {
        const led = ledger;   /* WO-01 round-2 (6-a F09): module-level single read */
        const ledKeys = Object.keys(led).filter((k) => !k.startsWith("_"));
        const unEvidenced = ledKeys.filter((k) => !led[k].evidence && !led[k].note);
        const missingDest = ledKeys.filter((k) => {
            /* dest is a suite script name (dist files carry the 4ndr0tools
             * prefix); plugin-path dests point at the plugins/ tree */
            const dest = led[k].dest;
            if (!dest || dest.includes("/")) return false;
            return !fs.existsSync(path.join(DIST, `4ndr0tools - ${dest}.user.js`));
        });
        if (unEvidenced.length) {
            for (const u of unEvidenced) failures.push(`[D] identity ledger: unit "${u}" carries no evidence/note (GUP G8: cite the identity-preservation argument or reconcile the unit)`);
        }
        if (missingDest.length) {
            for (const d of missingDest) failures.push(`[D] identity ledger: unit "${d}" → destination "${led[d].dest}" missing from dist (GUP G8: update the ledger)`);
        }
        if (!unEvidenced.length && !missingDest.length) {
            passes.push(`[D] identity ledger verified (${ledKeys.length} units, ${ledKeys.length} evidenced, all destinations present (dist/ — plus the two plugins/ external-data dests exempt by design; WO-01 round-4, 4-d F7 wording) — evidence coverage 100%)`);
        }
    } catch (e) {
        failures.push(`[D] identity ledger unreadable: ${e.message}`);
    }

    // Global-pollution census (suite v1.5.0, GUP B.1 round mandate): every
    // realm write (window/unsafeWindow/globalThis/self, dot/bracket/
    // defineProperty) in the review sources must be either closure-moved
    // (own state stays in script scope — the v1.5.0 round closure-ized 23
    // writes across PM/Forums++/YTERB) or sanctioned in the census ledger
    // (defuse mocks, console C2, debug hooks, cross-context bridges,
    // double-injection guards, page-API wipes, NetHook-family wraps).
    // The kernel realm slot is self-asserted. This gate is the class-
    // closure for GUP B.1 "Zero Global Pollution".
    const globals = runGlobalCensus();
    if (globals.problems.length) {
        for (const gl of globals.problems) failures.push(`[D] global census: ${gl}`);
    } else {
        passes.push(`[D] global census verified (${globals.writes} realm writes across ${globals.filesScanned} source files — ${globals.sanctioned} ledger-sanctioned, 0 unledgered; kernel realm slot asserted)`);
    }

    // Cache-growth census (suite v1.5.0, GUP B.1 round mandate): every
    // Map/Set registry in the review sources is machine-classified —
    // static-config, weak (GC-bounded), bounded (FIFO/ceiling/lifetime),
    // dedupe-guarded, call-scoped local, or factory-escaped (captured by a
    // returned closure — must carry a bound proof or a ledger entry; the
    // v1.4.10 defects in that class, WM image sessions + YTPM sweep
    // coalescer, are bounded this round and the census is negative-proven
    // to flag them on the prior canon). Class-closure for GUP B.1
    // "O(1) Caching".
    const caches = runCacheCensus();
    if (caches.problems.length) {
        for (const cc of caches.problems) failures.push(`[D] cache census: ${cc}`);
    } else {
        passes.push(`[D] cache census verified (${caches.registries} Map/Set registries across ${caches.filesScanned} source files — ${caches.bounded} bounded, ${caches.dedupeGuarded} dedupe-guarded, ${caches.callScoped} call-scoped, ${caches.staticConfig} static, ${caches.weakBounded} weak, ${caches.ledgered} ledgered; 0 unbounded)`);
    }

    // Size budget (suite v1.5.0, G6): no dist file over 1.3 MB; every
    // 1.0 MB+ file carries a decomposed-asset audit record (the two
    // current ones: Watermark++ and Prompt Master — both pure code mass,
    // zero blob/font payload, externalization evaluated and rejected with
    // the OPSEC argument; records under documentation/<script>/SIZE-AUDIT.md).
    const sizes = runSizeBudget();
    if (sizes.problems.length) {
        for (const sz of sizes.problems) failures.push(`[D] size budget: ${sz}`);
    } else {
        passes.push(`[D] size budget verified (${sizes.files} dist files, largest ${sizes.largestBytes.toLocaleString()} B, ${sizes.overAuditLine.length} over the 1.0 MB audit line with ${sizes.auditRecords} audit records; 0 over the 1.3 MB hard budget)`);
    }

    // Production rubric, machine-scored (suite v1.5.1, G5 — §3.5 escalated
    // to >= 90, recorded to tools/score.json): every input is machine-fed —
    // kernel-smoke, style-audit and qr-verify are SPAWNED here (their
    // console verdicts parsed, never hardcoded), the censuses are the live
    // objects above, docs-truthfulness and OPSEC derive from this run's
    // own failure list. Error Handling's input surface is complete since
    // v1.5.1 (the G11 catch census: typed/debug/handled/silent counts).
    /* WO-01 round-2 (6-a F09): process.execPath, not "node" — the spawned
     * batteries must run under the SAME binary the operator invoked the
     * gate with, without hoping `node` resolves on PATH (the kernel-boundary
     * smoke already used execPath; these three now match). */
    const smokeRes = spawnSync(process.execPath, [path.join(ROOT, "tools", "kernel-smoke.mjs")], { encoding: "utf8", timeout: 180000 });
    const smokeOut = (smokeRes.stdout || "") + (smokeRes.stderr || "");
    const smokePass = smokeRes.status === 0 && /KERNEL SMOKE: ALL PASS/.test(smokeOut);
    const smokeCount = (smokeOut.match(/✓/g) || []).length;
    if (!smokePass) failures.push(`[D] kernel-smoke battery failed inside the production score (status ${smokeRes.status})`);
    const styleRes = spawnSync(process.execPath, [path.join(ROOT, "tools", "style-audit.mjs")], { encoding: "utf8", timeout: 60000 });
    const qrRes = spawnSync(process.execPath, [path.join(ROOT, "tools", "qr-verify.mjs")], { encoding: "utf8", timeout: 60000 });
    const stylePass = styleRes.status === 0;
    /* v1.6.2: parse the audit's own verdict line — the score record's
     * style label must cite the live counts, never a hardcoded fraction
     * (the v1.6.1 record said "37/37" on a 38/38 tree). */
    const styleOut = (styleRes.stdout || "") + (styleRes.stderr || "");
    const styleCounts = (() => {
        const m = styleOut.match(/STYLE AUDIT: ALL PASS \((\d+)\/(\d+)\)/);
        return m ? { pass: Number(m[1]), total: Number(m[2]) } : { pass: 0, total: 0 };
    })();
    const qrPass = qrRes.status === 0;
    const docsTruthful = !failures.some((f) => f.includes("documentation drift"));
    const opsecClean = !failures.some((f) => f.includes("OPSEC"));
    let ledgerStats = { units: 0, evidenced: 0 };
    try {
        const led = ledger;   /* WO-01 round-2 (6-a F09): module-level single read */
        const ledKeys = Object.keys(led).filter((k) => !k.startsWith("_"));
        ledgerStats = { units: ledKeys.length, evidenced: ledKeys.filter((k) => led[k] && (led[k].evidence || led[k].note)).length };
    } catch (e) { /* scored at 0 coverage */ }
    const docDir = path.join(ROOT, "documentation");
    const readmeCount = fs.existsSync(docDir) ? fs.readdirSync(docDir).filter((d) => fs.existsSync(path.join(docDir, d, "README.md"))).length : 0;
    /* v1.6.0: derived, never hardcoded — the suite round from package.json
     * and the NetHook consumer count from the canon surface itself (the
     * canon-kernel wiring gate cross-checks the dist splice separately). */
    const suiteRound = "v" + readJsonCached("package.json").version;   /* WO-01 round-2 (6-a F09): cached single read */
    let netConsumerCount = 0;
    for (const cd of ["_sovereign", "_promoted", "_merged"]) {
        const dir = path.join(ROOT, "canon", cd);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".user.js"))) {
            if (fs.readFileSync(path.join(dir, f), "utf8").includes("__4NDR0_NET_API__")) netConsumerCount++;
        }
    }
    /* WO-01 round-2 (6-a F09/g): the inventory-parity verdict now computes
     * BEFORE the production score writes tools/score.json — the round-1
     * order wrote the score record first, so a DRIFTING tree still recorded
     * its full inventoryDeterministic points before the drift failure
     * landed (a false-certification window in the recorded artifact). The
     * score input is the live verdict, never a hardcoded true. */
    let invParityOk = false;
    // Inventory regeneration determinism (suite v1.4.3): the legacy
    // `generated: <wall clock>` field made every `npm run check` rewrite
    // inventory.json — kit base detection (content-hash, git-state
    // agnostic) then failed G1 with "content drift (not base, not
    // applied)" after any post-apply verification run (operator field
    // report, v1.4.2 apply). The field is now a content-addressed
    // digest; a fresh recomputation must be byte-identical to the file
    // on disk.
    try {
        const invOnDisk = fs.readFileSync(path.join(ROOT, "inventory.json"), "utf8");
        const invFresh = serialize(computeInventory());
        if (invOnDisk !== invFresh) {
            failures.push(`[D] inventory regeneration drift — dist and inventory.json are out of sync (run: npm run inventory)`);
        } else {
            invParityOk = true;
            const digest = JSON.parse(invOnDisk).digest;
            passes.push(`[D] inventory regeneration deterministic (content digest ${String(digest).slice(0, 16)}…)`);
        }
    } catch (e) {
        failures.push(`[D] inventory determinism check failed: ${e.message}`);
    }

    const scoreCtx = { /* v1.6.2: named ctx — the determinism gate below re-runs the scorer with the SAME inputs */
        smoke: { pass: smokePass, count: smokeCount, floor: 160 }, /* floor = shrinkage guard (NOT derived from the battery's self-report — that would make it a tautology); 160 = WO-01 round-4 executed size (157 pre-round-3 + the a4-scope toast tripwire, f73a7e0, + the waitFor timeout/abort pins, this round). Regex-counting kernel-smoke.mjs assert( sites yields 161 — the extra one is the deliberate unreachable glass-switch guard; the floor is the EXECUTED count. */
        otherGateFailures: failures.length,
        censuses: {
            sink: { clean: !sinks.problems.length },
            transport: { clean: !transport.problems.length },
            global: { clean: !globals.problems.length },
            hotkey: { clean: !census.problems.length && !census.collisions.length && !census.stale.length },
            polling: { clean: !polling.problems.length, sites: polling.sites },
            observer: { clean: !observers.problems.length, sites: observers.sites },
            cache: { clean: !caches.problems.length, registries: caches.registries },
            size: { clean: !sizes.problems.length },
            connect: { clean: !connects.problems.length, derived: connects.dispatchDerived, partial: connects.dispatchPartial, residual: connects.dispatchResidual },
            operatorBattery: { clean: !battery.problems.length, tests: battery.tests, families: battery.families, residuals: battery.residuals, adjudicated: battery.adjudicated },
            domain: { clean: !domains.problems.length },
            error: { clean: !errors.problems.length, catchSites: errors.catchSites, typed: errors.typed, debug: errors.debug, handled: errors.handled, silent: errors.silent },
            scope: { clean: !scopes.problems.length, files: scopes.filesScanned }, /* r11 (11c-F07): the 13th instrument rides the score context — the OBI-F01 binding census */
        },
        opsec: opsecClean,
        netHook: { consumers: netConsumerCount },
        inventoryDeterministic: invParityOk,   /* WO-01 round-2 (6-a F09/g): live parity verdict, was hardcoded true */
        style: stylePass,
        styleCounts, /* v1.6.2: derived label — see the audit parse above */
        docsTruthful,
        ledger: ledgerStats,
        qr: qrPass,
        /* v1.6.1: derived from the live inventory — was hardcoded 37, which
         * silently misreported coverage the moment a 38th script landed. */
        docsCoverage: { readmes: readmeCount, scripts: readJsonCached("inventory.json").scripts.length },
        round: suiteRound,
    };
    const score = runProductionScore(ROOT, scoreCtx);
    if (score.problems.length) {
        for (const sc of score.problems) failures.push(`[D] production score: ${sc}`);
    } else {
        passes.push(`[D] production score verified (${score.total}/100, threshold ${SCORE_THRESHOLD}; recorded tools/score.json — dims: ${score.dims.map((d) => `${d.dimension}=${d.score}/${d.weight}`).join(", ")})`);
    }

    // Score-record determinism (suite v1.6.2 — same contract as the v1.4.3
    // inventory fix): tools/score.json used to carry a wall-clock
    // `generatedAt`, so every `npm run check` rewrote the file and a
    // post-apply re-verification always left the staged canon drifted
    // (operator field report, v1.6.1 apply — the kit had to discard the
    // verifier's side-effects by hand). The record is now round-addressed;
    // this gate re-runs the scorer with the SAME inputs and demands a
    // byte-identical rewrite, and pins the schema to non-volatile keys so
    // the bug class cannot silently return.
    try {
        const scorePath = path.join(ROOT, "tools", "score.json");
        const firstBytes = fs.readFileSync(scorePath, "utf8");
        const parsed = JSON.parse(firstBytes);
        const ALLOWED_SCORE_KEYS = new Set(["round", "total", "threshold", "dimensions"]);
        const volatileKeys = Object.keys(parsed).filter((k) => !ALLOWED_SCORE_KEYS.has(k));
        if (volatileKeys.length) {
            failures.push(`[D] score record carries non-deterministic field(s): ${volatileKeys.join(", ")} — wall-clock addressing is forbidden (see the v1.4.3 inventory precedent)`);
        } else if (parsed.round !== suiteRound) {
            failures.push(`[D] score record round is ${parsed.round}, expected ${suiteRound} (stale record — rerun npm run check)`);
        } else {
            runProductionScore(ROOT, scoreCtx);
            const secondBytes = fs.readFileSync(scorePath, "utf8");
            if (firstBytes !== secondBytes) {
                failures.push(`[D] score record regeneration drift — the record is not deterministic (same inputs must rewrite byte-identical bytes)`);
            } else {
                passes.push(`[D] score record regeneration deterministic (round-addressed, schema pinned, byte-identical on re-run)`);
            }
        }
    } catch (e) {
        failures.push(`[D] score determinism check failed: ${e.message}`);
    }

    // Canon-kernel wiring (suite v1.4.3): kernel modules consumed by
    // canon-carried scripts (build.mjs CANON_KERNEL) must be inlined
    // byte-identically into the dist twin, and only into files whose
    // canon source references the module identifier — both directions,
    // so a forgotten map entry or an accidental injection both fail.
    const NET_ID = "__4NDR0_NET_API__";
    const netModule = fs.readFileSync(path.join(KERNEL, "net.js"), "utf8").trim();
    const canonDirs = ["_sovereign", "_promoted", "_merged"];
    let netConsumers = 0;
    for (const cd of canonDirs) {
        const dir = path.join(ROOT, "canon", cd);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".user.js"))) {
            const canonSrc = fs.readFileSync(path.join(dir, f), "utf8");
            const distSrc = fs.existsSync(path.join(DIST, f))
                ? fs.readFileSync(path.join(DIST, f), "utf8") : "";
            const canonUses = canonSrc.includes(NET_ID);
            /* WO-01 round-3 (3-a F11): full-module byte identity — the comment
             * promises it and a 200-byte prefix test delivers only a prefix
             * presence check (a spliced/truncated kernel passing the prefix
             * shipped green). The live dist twin carries kernel/net.js
             * byte-exact (verified), so the strengthening is green-preserving. */
            const distHas = distSrc.includes(netModule);
            if (canonUses && !distHas) {
                failures.push(`[D] canon-kernel wiring: ${f} references ${NET_ID} but dist carries no kernel/net.js — add the CANON_KERNEL map entry`);
            } else if (!canonUses && distHas) {
                failures.push(`[D] canon-kernel wiring: ${f} dist carries kernel/net.js without a canon reference — accidental injection`);
            } else if (canonUses && distHas) {
                netConsumers++;
            }
        }
    }
    if (netConsumers === 0) {
        failures.push(`[D] canon-kernel wiring: zero NetHook consumers — kernel/net.js is dead kernel surface`);
    } else {
        passes.push(`[D] NetHook singleton wiring verified (${netConsumers} canon consumer(s) share one page-realm wrap; lazy arm + 4 MB single-read contract)`);
    }

    const kbSmoke = await runKernelBoundarySmoke(ROOT);
    if (kbSmoke.problems.length) {
        for (const p of kbSmoke.problems) failures.push(`[D] kernel-boundary smoke: ${p}`);
    } else {
        passes.push(`[D] canon kernel-less boundary verified (${kbSmoke.canonFiles} canon scripts: ${kbSmoke.kernelFreeCount} kernel-free, ${kbSmoke.guardedConsumerCount} typeof-guarded across ${kbSmoke.totalGuardedSites} sites, ${kbSmoke.transportFallbacksVerified}/${kbSmoke.expectedFallbacks} kernel-less gmFetch fallbacks, ${kbSmoke.runtimeAssertions}/${kbSmoke.expectedRuntimeAssertions} runtime+red-control assertions)`); /* WO-01 round-3 (3-a F05): denominators derive from the smoke's own fixture map — the hardcoded /8 /10 go stale the moment a VM fixture is added */
    }

    const famSmoke = await runFamilyFixtureSmoke(ROOT);
    if (famSmoke.problems.length) {
        for (const p of famSmoke.problems) failures.push(`[D] family-fixture smoke: ${p}`);
    } else {
        passes.push(`[D] per-family contract fixture battery verified (${famSmoke.passed}/${famSmoke.total} assertions: Zai Exporter 3-strategy ladder + NetHook v6 family fixtures + v1.7.1/v1.7.2 gap-mitigation fixtures + the round-12 Hailuo++ BlobSanitizer family (real attack-sample repair) + red control)`);
    }

    const flowBrowser = await runFlowChipBrowserBattery();
    if (!flowBrowser.clean) {
        for (const f of flowBrowser.failed) failures.push(`[D] flow-chip browser smoke: ${f.name} (${f.detail})`);
    } else {
        passes.push(`[D] Google Flow token/credit chip browser Proof-of-Possession verified (${flowBrowser.passed}/${flowBrowser.total} click/wait/get assertions + red control, mode=${flowBrowser.mode})`); /* WO-01 round-3 (3-a F12): mode disclosed like pm-grid — a structural fallback must never present as live browser proof */
    }

    const igBrowser = await runIgWallBrowserBattery();
    if (!igBrowser.clean) {
        for (const f of igBrowser.failed) failures.push(`[D] ig-wall browser smoke: ${f.name} (${f.detail})`);
    } else {
        passes.push(`[D] Instagram++ NeuralDOM V-STASIS browser Proof-of-Possession verified (${igBrowser.passed}/${igBrowser.total} click/wait/get assertions + red control, mode=${igBrowser.mode})`); /* WO-01 round-3 (3-a F12): mode disclosed like pm-grid */
    }

    const pmGridBrowser = await runPmGridBrowserBattery();
    if (!pmGridBrowser.clean) {
        for (const f of pmGridBrowser.failed) failures.push(`[D] pm-grid browser smoke: ${f.name} (${f.detail})`);
    } else {
        passes.push(`[D] Prompt Master expanded-grid card layout & Media Slideshow browser Proof-of-Possession verified (${pmGridBrowser.passed}/${pmGridBrowser.total} click/wait/get assertions + red control, mode=${pmGridBrowser.mode})`);
    }
}

gateA();
gateB();
gateC();
await gateD();

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  GUP v7.0.2 SUITE VERIFICATION — " + new Date().toISOString().slice(0, 19) + "        ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
for (const p of passes) console.log("  ✓ " + p);
if (failures.length > 0) {
    console.error(`\n${failures.length} VERIFICATION FAILURE(S):`);
    for (const f of failures) console.error("  ✗ " + f);
    process.exit(1);
}
console.log("\nGUP VERIFICATION: CERTIFIED (superset contract holds)");
process.exit(0);
