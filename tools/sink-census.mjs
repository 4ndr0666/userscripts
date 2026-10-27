#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/sink-census.mjs — HTML-string sink + network-tap census (suite v1.4.3)
 * ----------------------------------------------------------------------------
 * Operator mandate (v1.4.3 round): "a census-style machine gate + createElement
 * migration is the best-in-class endgame" for the innerHTML write-site class —
 * a DIFFERENT sink class from the parseFromString class fixed in v1.4.2. The
 * same census also measures the fetch/XHR proxy class (NetHook adoption
 * evidence: which scripts still install their own page-network wraps).
 *
 * What it counts, per dist file, on a comment- AND string-aware code view
 * (string CONTENTS are blanked, ${} interpolation code is preserved — a prose
 * mention of innerHTML inside a string or comment is documentation, not a
 * sink; lesson-7 discipline):
 *
 *   Class A — HTML-string sinks (Trusted Types + injection surface):
 *     innerHTML          .innerHTML = / .innerHTML += / .outerHTML =
 *     insertAdjacentHTML insertAdjacentHTML(
 *     documentWrite      document.write( / document.writeln(
 *     eval               eval(
 *     newFunction        new Function(
 *     timerString        setTimeout('… / setInterval('…  (string-arg eval)
 *     parseFromString    DOMParser string parse NOT routed through a
 *                        sanctioned TT policy wrapper (tt.createHTML / the
 *                        per-script TTwrap-family helpers minted in v1.4.2)
 *
 *   Class B — page-network taps (co-install stacking surface):
 *     fetchWrap          .fetch = (property assignment on a window/realm
 *                        object — the per-script proxy installs)
 *     xhrWrap            .prototype.open = / .prototype.send =
 *     tapOpenSend        indirect .open = / .send = taps (local-var
 *                        prototype refs, window.open overrides, WebSocket
 *                        bridges, accordion state — each adjudicated by
 *                        reason; new indirect taps fail closed too)
 *
 * Adjudication ledger (below) — same idiom as canon-xref: every surviving
 * site is enumerated with a reason, and the gate fails closed on:
 *   - an UNADJUDICATED site (new sink appeared),
 *   - a COUNT DRIFT in either direction (regression or stale ledger),
 *   - a kernel/ class-A sink (kernel must stay zero-string-sink by
 *     construction, except core.js's policy-wrapped parse pair).
 *
 * The ledger is the burn-down plan: migrating a script to createElement /
 * NetHook removes its sites here; forgetting this file when adding a
 * site fails the suite. Zero entries = the endgame state.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */
/* WO-01 round-4 (4-a F06/F07): the masked-view primitives live in scan-kit.mjs
 * now (the shared home) — codeOnly is RE-EXPORTED so the nine census/battery
 * importers keep their `from "./sink-census.mjs"` surface unchanged, and the
 * byte-identical third stripCommentsKeepStrings copy that lived here is
 * deleted (the round-2 header comment claimed it "mirrors validate.mjs's
 * stripCommentsKeepStrings discipline" — it is literally the same code now). */
import { codeOnly, codeOnlyCached, stripCommentsKeepStrings } from "./scan-kit.mjs";
export { codeOnly };

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");
const KERNEL = path.join(ROOT, "kernel");

/* Code views of every kernel module — inlined copies (module builds + the
 * v1.4.3 canon CANON_KERNEL injection) are byte-stripped from a dist
 * file's code view before scanning: the kernel is zero-sink-verified
 * separately (below), so its own wrap/parse sites must not count as the
 * carrying script's sites. */
const KERNEL_VIEWS = fs.existsSync(KERNEL)
    ? fs.readdirSync(KERNEL).filter((f) => f.endsWith(".js"))
        .map((f) => codeOnly(fs.readFileSync(path.join(KERNEL, f), "utf8")).trim())
        .filter((v) => v.length > 0)
    : [];

function distCodeView(src) {
    let view = codeOnly(src);
    for (const kv of KERNEL_VIEWS) {
        if (view.includes(kv)) view = view.split(kv).join("");
    }
    return view;
}

/* ── Sink classes ───────────────────────────────────────────────────────── */

/* Sanctioned Trusted-Types policy wrappers for parseFromString (v1.4.2
 * class fix): kernel tt.createHTML + the per-script TTwrap-family helpers.
 * A parseFromString( whose first argument starts with one of these routes
 * the string through a policy — the sanctioned parse path. */
const SANCTIONED_PARSE_ARG =
    /^\s*(?:tt\s*\.\s*createHTML|TTwrapXML|TTwrap|ttWrap|wrap|trustedHTML)\s*\(/;

const CLASSES = {
    innerHTML:          /\.(?:inner|outer)HTML\s*(?:\+)?=(?!=)/g,
    insertAdjacentHTML: /insertAdjacentHTML\s*\(/g,
    documentWrite:      /document\.write(?:ln)?\s*\(/g,
    eval:               /\beval\s*\(/g,
    newFunction:        /new\s+Function\s*\(/g,
    timerString:        /\bset(?:Timeout|Interval)\s*\(\s*['"`]/g,
    parseFromString:    /parseFromString\s*\(/g,
    fetchWrap:           /\.fetch\s*(?:\+)?=(?!=)/g,
    xhrWrap:             /\.prototype\.(?:open|send)\s*=(?!=)/g,
    tapOpenSend:         /(?<!prototype\.)\.(?:open|send)\s*=(?!=)/g,
    /* WO-01 round 6: the page-API interposition family — URL.createObjectURL
     * wraps and canvas prototype commit hooks (the Hailuo++ interception
     * platform). Same adjudication contract as the wrap classes: count drift
     * fails closed, every site is ledgered with justification + expiry. */
    protoWrap:           /(?:URL\.createObjectURL|\.(?:prototype\.)?(?:toDataURL|toBlob))\s*=(?!=)/g,
};

/* WO-01 round-2 (6-a F06): bracket-form tripwires — el["innerHTML"] = … and
 * window["setInterval"]("…") escape every CLASSES regex because codeOnly
 * blanks string contents, so the property name becomes invisible. Zero live
 * occurrences today; these patterns run against a STRING-PRESERVING,
 * comment-stripped view (so the property name is visible again) and fail
 * closed on the first hit — write property access in dot form, or in
 * bracket form only for genuinely dynamic (non-constant) keys. */
const BRACKET_PROP_WRITES =
    /\[\s*["'](?:(?:inner|outer)HTML|fetch|open|send|eval|parseFromString|toDataURL|toBlob|createObjectURL|convertToBlob|getContext)["']\s*\]\s*(?:\+)?=(?!=)/g;
const BRACKET_TIMER_STRINGS =
    /\[\s*["']set(?:Timeout|Interval)["']\s*\]\s*\(\s*["'`]/g;
/* WO-01 round-3 (3-a F02): bracket CALL forms — el["insertAdjacentHTML"](…),
 * window["eval"](…), document["write"](…), new window["Function"](…),
 * dp["parseFromString"](…), and bracket timer calls with ANY argument type
 * (function refs included — also invisible to polling-census's member-form
 * dot receivers) — escape the CLASSES regexes (codeOnly blanks string
 * contents, so the callee renders as el[""]("")") AND both round-2
 * tripwires (they require `=` or a string first-arg). insertAdjacentHTML
 * and document.write are the R3-ENDGAME BANNED classes — the bracket-call
 * disguise defeated the zero-tolerance ban while the gate stayed GREEN
 * (node-proven on all five forms, zero live occurrences). Constant-name
 * sink CALLS must use dot form; dynamic-key bracket access is unaffected. */
const BRACKET_SINK_CALLS =
    /\[\s*["'](?:(?:insertAdjacentHTML|parseFromString|write(?:ln)?|eval|Function)|set(?:Timeout|Interval))["']\s*\]\s*\(/g;
/* WO-01 round 7 (7c F07): defineProperty/Reflect.set tripwire for the
 * page-API interposition family — Object.defineProperty(proto,
 * 'toDataURL', …) and Reflect.set(proto, 'createObjectURL', …) assign the
 * same hooks the protoWrap class adjudicates, but through a call form no
 * CLASSES regex can see. Zero live occurrences; first hit fails closed
 * with the same contract as the bracket tripwires (ledger it in protoWrap
 * or write it in the dot form the census reads). */
const DEFINE_PROP_INTERPOSITION =
    /\b(?:Object\.defineProperty|Reflect\.set)\s*\(\s*[^,()]*,\s*["'](?:toDataURL|toBlob|createObjectURL|convertToBlob|getContext)["']/g;

/* WO-01 round-4 (4-a F07 — the round-3 recommendation, delivered): the
 * ACCEPTED RESIDUALS of the sink-detection surface, enumerated in one place
 * so the next auditor reads the boundary without re-deriving it. All three
 * are zero-live across canon/modules/kernel/dist (re-proven rounds 3 AND 4)
 * and documented-only BY VERDICT (closure cost exceeds the value of a class
 * with zero live occurrences):
 *   • Reflect.apply-form sink dispatch — `Reflect.apply(el.insertAdjacentHTML, el, [...])`;
 *     the tree's live Reflect.apply sites are Akasha's dynamic-target
 *     proxy-forwarding arms, a different shape.
 *   • Unicode-escaped identifiers — `eval`, `\u0069nnerHTML` spellings; every
 *     \u00XX hit in the corpus is a string-literal entity table or regex
 *     class, and closure needs an identifier-unescaping lexer pass.
 *   • Whitespace-after-dot member access — `el. innerHTML =` (zero live);
 *     closure would widen ~10 CLASSES regexes for a class nothing uses. */

/* ── Adjudication ledger ──────────────────────────────────────────────────
 * R3 ENDGAME (suite v1.4.4): every class-A UI string sink is migrated to
 * createElement — innerHTML / insertAdjacentHTML / documentWrite are now
 * ZERO-TOLERANCE across every dist file (enforced below; no ledger entry
 * can ever re-admit them). The ledger below therefore only covers the two
 * remaining adjudicated classes:
 *
 *   Class B — page-network taps (co-install stacking surface):
 *     fetchWrap / xhrWrap / tapOpenSend — the defuser/observer family
 *     whose semantic NetHook migration needs veto support (dedicated
 *     rounds, one script per round, live-smoked each time — Akasha
 *     Silence migrated to zero in v1.4.5; Recon + Stream Interceptor
 *     migrated to zero in v1.4.6; the host-gated observer tail — Bunkr,
 *     Filester, IG, m3u8, PM, Watermark — follows on the shared hub's
 *     structured traffic channel).
 *
 *   Class A-semantic — policy-gated interop bridges that are NOT UI
 *     strings: the Images++ page-$ eval bridge and the TT-policy-wrapped
 *     parseFromString routes (kernel core.js + per-script TTwrap family).
 *
 * Migrated to zero this round (110 sites, v1.4.4 createElement round):
 *   FLX(8) + CB(6) + BPW(2) + B2U(3) [v1.4.3] — and now LMΨ(27) +
 *   Bunkr(23) + Pixeldrain(10) + IG(6) + m3u8(6) + Filester(5) +
 *   Forums(5) + Recon(5) + Hailuo(4) + Gofile(3) + MPC(3) + PM(3) +
 *   GPD(2) + ModelSearch(2) + purge/Akasha/MAM/Redgifs/WCP/YTPM/YTERB/
 *   Images(1 each). The burn-down plan is EXECUTED.
 * v1.4.5 (NetHook veto round): Akasha Silence fetchWrap(1) + xhrWrap(2)
 *   → 0 — the fetch/XHR/beacon defusing rides kernel/net.js v3 onRequest
 *   (one wrap set per realm; the ledger's own entries anticipated this
 *   round).
 * v1.4.6 (hub maturation round): Recon fetchWrap(1) + xhr-taps(2) → 0
 *   and Stream Interceptor fetchWrap(1) + xhrWrap(2) → 0 — both ride
 *   kernel/net.js v4 (onRequest verdicts + onTraffic structured events
 *   + onError recovery); Recon's WebSocket bridge tap stays (out of the
 *   hub's fetch/XHR/beacon scope). */
/* WO-01 round-1 re-adjudication: every entry below was re-verified against
 * the v1.8.2 tree (census green at counts) and its expiry rolled
 * v1.8.0 → v1.12.0 — the G9 gate was silently inert because CURRENT_ROUND
 * stayed hardcoded at v1.7.2 while the suite advanced (see
 * tools/census-round.mjs; the round now derives from package.json). */
const ADJUDICATED = {
    /* — fully clean (no surviving sites): FLX, CB, BPW, B2U, purge,
     * Akasha-UI, Bunkr-UI, Filester, Forums, Gofile, Hailuo,
     * Images-UI, IG-UI, LMΨ-UI, MAM, ModelSearch, Pixeldrain, PM-UI,
     * Redgifs, Recon-UI, Stream Interceptor, WCP, YTPM, YTERB, m3u8-UI —
     * (GPD left this list in v1.4.8: one detached parseFromString — see
     * its entry below.) */

    "4ndr0tools - 4ndr0serviceguard Companion.user.js": {
        expiry: "v1.17.0",
        tapOpenSend: { count: 1, reason: "own-mock: phantom XHR object's send (script-owned decoy, not a page tap)" },
    },
    "4ndr0tools - AlwaysNewWindow.user.js": {
        expiry: "v1.17.0",
        tapOpenSend: { count: 2, reason: "win-open-override: force-open/restore pair — the script's core feature, not an XHR tap" },
    },
    /* Akasha Silence: fetchWrap(1) + xhrWrap(2) burned to zero in v1.4.5 —
     * the request-path defusing rides kernel/net.js (NetHook veto). */
    /* Bunkr++: fetchWrap(2) + tapOpenSend(2) burned to zero in v1.4.7 — the
     * fake-stats defusing rides the NetHook onRequest respond verdict and
     * the URL classifier + body sweeper ride onTraffic (with sandbox-realm
     * propagation preserving the v7.4.0 dual-context fix). */
    /* Filester: fetchWrap(1) burned to zero in v1.4.7 — the media-URL cache
     * + API-hit log ride kernel/net.js onTraffic request events. */
    /* GooglePhotosandDrive++: v8.1.0 (suite v1.4.8) true-direct resolution
     * parses the gmFetch-fetched Drive confirm interstitial — a DETACHED
     * DOMParser document, querySelector reads only, nothing ever inserted
     * into the live DOM (XSS-inert by construction; NOT the TT-wrapped
     * page-parse class above). */
    "4ndr0tools - GooglePhotosandDrive++.user.js": {
        expiry: "v1.17.0",
        parseFromString: { count: 1, reason: "detached-parse: Drive confirm-interstitial HTML parsed into a detached DOMParser document (gmFetch probe body) — querySelector reads only, zero live-DOM insertion, XSS-inert by construction (v1.4.8 true-direct resolution)" },
    },
    "4ndr0tools - Images++.user.js": {
        expiry: "v1.17.0",
        eval: { count: 1, reason: "eval-bridge: page-$ interop through trustedScript policy (v1.4.2 adjudication)" },
        newFunction: { count: 1, reason: "eval-bridge: same page-$ bridge, new Function fallback (policy-gated)" },
        parseFromString: { count: 1, reason: "page-policy: $parseHtml routes through the page's own trustedHTML policy (v1.4.2 capture)" },
    },
    "4ndr0tools - Forums++.user.js": {
        expiry: "v1.17.0",
        newFunction: { count: 1, reason: "gofile-wt-bridge (round 6): scoped Function evaluation of the live-fetched gofile.io/js/wt.obf.js — the site's own generateWT() token generator, called with navigator as the sole argument so the declaration stays local to the factory (never leaks to global); source verified by /generateWT/ content check before eval and cached 24 h in GM storage while the 4-hour time bucket inside generateWT() is recomputed on every call (lineage L3899-3947 port)" },
    },
    "4ndr0tools - Akasha Silence.user.js": {
        expiry: "v1.17.0",
        protoWrap: { count: 2, reason: "canvas-blindness (v5.x feature, first LEDGERED round 6): HTMLCanvasElement toDataURL/toBlob wrapped with the blindedScratch canvas — the anti-fingerprinting neutralizer; originals saved and re-invoked so page rendering is unaffected; this surface was INVISIBLE to the census before the round-6 protoWrap class (the blind spot closed by the Hailuo++ interception platform's arrival in the same family)" },
    },
    "4ndr0tools - Hailuo++.user.js": {
        expiry: "v1.17.0",
        protoWrap: { count: 3, reason: "interception platform (round 6, 2-c): URL.createObjectURL clone-at-create (the blob vault registry) + HTMLCanvasElement toDataURL/toBlob commit hooks (canvas capture above the noise floor) — the page-API interposition family the wrap classes could not see; install-once guarded by the __andr0HailuoIntercept realm mark (MPC class, global-census ledgered), every hook body fail-closed per-family try/catch, originals saved and re-invoked (the page always receives its native result); NetHook owns the fetch/XHR wraps — this family is Hailuo++'s own vault surface" },
    },
    "4ndr0tools - Instagram++.user.js": {
        expiry: "v1.17.0",
        parseFromString: { count: 1, reason: "page-policy: DASH manifest parse covered by the page 'default' createHTML policy minted at boot" },
    },
    /* Instagram++: fetchWrap(1) + xhrWrap(2) burned to zero in v1.4.7 — the
     * feed digest rides kernel/net.js onTraffic response events. */
    "4ndr0tools - Pixeldrain++.user.js": {
        expiry: "v1.17.0",
        tapOpenSend: { count: 3, reason: "accordion-state: panel s.open flags (not network taps)" },
    },
    /* Prompt Master: fetchWrap(1) + xhrWrap(2) burned to zero in v1.4.7 —
     * the flow-credit scanner rides kernel/net.js onTraffic response
     * events. */
    /* Recon: fetchWrap(1) + the xhrProto recorder taps(2) burned to zero
     * in v1.4.6 — blocklist verdicts + structured capture + pacification
     * ride kernel/net.js v4. The WebSocket bridge tap survives below. */
    "4ndr0tools - Recon.user.js": {
        expiry: "v1.17.0",
        tapOpenSend: { count: 1, reason: "ws-bridge: WebSocket send recorder (recon4 lineage — out of NetHook's fetch/XHR/beacon scope; the page-realm WS facade is Recon's own)" },
    },
    /* Watermark++: the RPC tapOpenSend(4) burned to zero in v1.4.7 — the
     * batchexecute observer rides kernel/net.js onTraffic events. The
     * surviving fetchWrap is the intent-gated image PROCESSING proxy —
     * an async fetch→process→synthetic-Response rewriter with full header
     * preservation, beyond the hub's synchronous verdict scope (same
     * adjudication class as m3u8++'s dev-proxy and Recon's WS bridge). */
    "4ndr0tools - Watermark++.user.js": {
        expiry: "v1.17.0",
        fetchWrap: { count: 1, reason: "processing-proxy: intent-gated gemini image rewriter (fetch→process→synthetic Response, full header surface) — an async response REPLACER, out of the hub's sync veto/phantom/observe scope; host-gated gemini.google.com" },
    },
    /* m3u8++: xhrWrap(1) + the (uncounted) Response.text tap burned to zero
     * in v1.4.7 — the playlist sniffer rides kernel/net.js onTraffic
     * response events. The surviving fetchWrap is the dev-proxy: a GM
     * transport re-dispatcher (custom origin/referer headers via
     * GM_xmlhttpRequest, non-200 re-proxied), not an observer — outside
     * the hub's sync veto/phantom/observe scope (the Recon ws-bridge
     * adjudication class), and host-gated to dev-only hosts. */
    "4ndr0tools - m3u8++.user.js": {
        expiry: "v1.17.0",
        fetchWrap: { count: 1, reason: "net-host-proxy: thatwind/localhost dev-proxy fetch path — a GM transport re-dispatcher (custom origin/referer headers, non-200 re-proxy), out of the hub's sync verdict/observe scope; host-gated development tool" },
    },
};

/* ── Census core ────────────────────────────────────────────────────────── */

function scanCode(code) {
    const counts = {};
    for (const [cls, re0] of Object.entries(CLASSES)) {
        const re = new RegExp(re0.source, "g");
        let hits = 0;
        let m;
        while ((m = re.exec(code)) !== null) {
            if (cls === "parseFromString") {
                /* only unsanctioned parses count as sinks */
                const after = code.slice(m.index + m[0].length, m.index + m[0].length + 48);
                if (SANCTIONED_PARSE_ARG.test(after)) continue;
                /* kernel core.js form: parseFromString(tt.createHTML(…)) */
            }
            hits++;
        }
        if (hits > 0) counts[cls] = hits;
    }
    /* xhrWrap sites are also matched by the tapOpenSend pattern
     * (prototype-qualified .open/.send is a subset of every .open/.send)
     * — subtract the overlap so no site is double-counted. */
    if (counts.xhrWrap && counts.tapOpenSend) {
        counts.tapOpenSend -= counts.xhrWrap;
        if (counts.tapOpenSend <= 0) delete counts.tapOpenSend;
    }
    return counts;
}

export function runSinkCensus() {
    const problems = [];
    const registrations = [];   /* per-file per-class sites (report mode) */
    let totalSites = 0;
    let adjudicatedSites = 0;

    const files = fs.existsSync(DIST)
        ? fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")).sort()
        : [];

    const seenFiles = new Set(); /* WO-01 round 7 (7c F09): orphan sweep anchor */
    for (const f of files) {
        seenFiles.add(f);
        const src = fs.readFileSync(path.join(DIST, f), "utf8");
        const code = distCodeView(src);
        /* WO-01 round-2 (6-a F06): bracket-form tripwires (see definitions
         * above) — fail closed with a prescriptive message; there is no
         * ledger path: constant-key bracket writes are the dot-form site
         * wearing a disguise the CLASSES regexes cannot see. */
        const stringsView = stripCommentsKeepStrings(src);
        for (const bw of stringsView.match(BRACKET_PROP_WRITES) || []) {
            problems.push(`${f}: bracket-form property write ${bw.slice(0, 34)}… — constant-key property access must use dot form so the sink classes stay visible (6-a F06 tripwire)`);
        }
        for (const bt of stringsView.match(BRACKET_TIMER_STRINGS) || []) {
            problems.push(`${f}: bracket-form string-arg timer ${bt.slice(0, 34)}… — constant-name timer access must use dot form so the timerString class stays visible (6-a F06 tripwire)`);
        }
        for (const bc of stringsView.match(BRACKET_SINK_CALLS) || []) {
            problems.push(`${f}: bracket-form sink call ${bc.slice(0, 34)}… — constant-name sink calls must use dot form so the CLASSES/polling censuses stay visible (3-a F02 tripwire)`);
        }
        for (const dp of stringsView.match(DEFINE_PROP_INTERPOSITION) || []) {
            problems.push(`${f}: defineProperty/Reflect.set interposition ${dp.slice(0, 44)}… — the page-API hook family must ride the protoWrap class in dot form so the count-drift gate sees it (7c F07 tripwire)`);
        }
        const counts = scanCode(code);
        const ledger = ADJUDICATED[f] || {};
        const expiry = ledger.expiry; /* per-file re-adjudication round (G9) */
        const known = new Set(Object.keys(ledger).filter((k) => k !== "expiry"));

        /* G9 ledger hygiene: a file entry whose expiry round has passed
         * without re-adjudication fails closed; an entry without expiry
         * fails closed too (no un-expiring adjudications) */
        if (Object.keys(ledger).length > 1 && !expiry) {
            problems.push(`${f}: sink ledger entry carries no expiry — every adjudication must carry its re-adjudication round (G9 ledger hygiene)`);
        }
        if (expiry && !roundLt(CURRENT_ROUND, expiry)) {
            problems.push(`${f}: sink ledger expiry ${expiry} has passed round ${CURRENT_ROUND} without re-adjudication (G9 ledger hygiene)`);
        }

        /* R3 ENDGAME HARD GATE — class-A UI string sinks are banned
         * outright: no ledger entry can ever re-admit them. Any single
         * occurrence anywhere in dist is an immediate census failure
         * (this is the gate that keeps the 110-site migration at zero). */
        for (const banned of ["innerHTML", "insertAdjacentHTML", "documentWrite"]) {
            if (counts[banned]) {
                problems.push(`${f}: ${counts[banned]} ${banned} site(s) — CLASS-A UI STRING SINKS ARE BANNED (createElement only; see kernel Ψ.core.$new)`);
            }
            if (ledger[banned]) {
                problems.push(`${f}: ledger still lists ${banned} — the endgame ledger admits only class-B net taps and policy-gated bridges`);
            }
        }

        for (const [cls, count] of Object.entries(counts)) {
            totalSites += count;
            const adj = ledger[cls];
            if (!adj) {
                problems.push(`${f}: ${count} unadjudicated ${cls} site(s) — add the migration or the ledger entry`);
            } else if (adj.count !== count) {
                problems.push(`${f}: ${cls} count drift (ledger ${adj.count}, found ${count}) — regression or stale ledger`);
            } else {
                adjudicatedSites += count;
                registrations.push({ file: f, cls, count, reason: adj.reason });
            }
            known.delete(cls);
        }
        for (const staleCls of known) {
            problems.push(`${f}: stale ledger entry ${staleCls} (0 found) — remove it`);
        }
        /* files entirely absent from the ledger but carrying sites were
         * caught above; files absent and clean are fine. */
    }

    /* WO-01 round 7 (7c F09): orphan sweep — a ledger entry whose dist file
     * disappeared (rename/delete) was never re-checked: the count-drift and
     * expiry machinery only ran for files that EXIST, so a stale entry
     * silently stopped ticking. The connect census has had this sweep since
     * round 6; the sink census's per-file classes get it now. */
    for (const f of Object.keys(ADJUDICATED)) {
        if (!seenFiles.has(f)) {
            problems.push(`stale sink ledger entry: ${f} — the dist file no longer exists (remove the entry)`);
        }
    }

    /* Kernel zero-string-sink invariant (defense-in-depth; validate.mjs
     * Gate D owns the authoritative form). Class A only; core.js's
     * policy-wrapped parse pair is the sanctioned exception. */
    if (fs.existsSync(KERNEL)) {
        for (const f of fs.readdirSync(KERNEL).filter((f) => f.endsWith(".js")).sort()) {
            const code = codeOnlyCached(path.join(KERNEL, f));
            const counts = scanCode(code);
            const allowed = f === "core.js" ? counts.parseFromString || 0 : 0;
            /* net.js is the SANCTIONED wrap owner: its class-B sites are
             * the singleton hub's own fetch/XHR wraps — exactly one set,
             * kernel-owned, every consumer rides it. Class A stays
             * zero-tolerance in every kernel file. */
            const isNetHub = f === "net.js";
            const bad = Object.entries(counts).filter(([cls, c]) => {
                if (cls === "parseFromString") return c > allowed;
                if (isNetHub && (cls === "fetchWrap" || cls === "xhrWrap" || cls === "tapOpenSend")) return false;
                return c > 0;
            });
            if (bad.length) {
                problems.push(`kernel/${f}: string sink(s) ${bad.map(([cls, c]) => `${cls}:${c}`).join(", ")} — kernel must be zero-string-sink by construction`);
            }
        }
    }

    return { problems, registrations, totalSites, adjudicatedSites,
        fileCount: files.length };
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

function main() {
    const report = process.argv.includes("--report");
    const { problems, registrations, totalSites, adjudicatedSites, fileCount } = runSinkCensus();
    if (report) {
        for (const r of registrations) {
            console.log(`${r.file}\n    ${r.cls} ×${r.count} — ${r.reason}`);
        }
    }
    console.log(`\nSINK CENSUS: ${totalSites} site(s) across ${fileCount} dist files — ${adjudicatedSites} adjudicated, ${totalSites - adjudicatedSites} unadjudicated`);
    if (problems.length) {
        console.error(`\n${problems.length} CENSUS FAILURE(S):`);
        for (const p of problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("SINK CENSUS: GREEN");
    process.exit(0);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    main();
}
