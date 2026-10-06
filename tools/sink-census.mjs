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

/* ── String- and comment-aware code view ──────────────────────────────────
 * Blanks line/block comment bodies and string CONTENTS (delimiter kept),
 * preserves ${} interpolation code inside template literals (nested
 * templates + comments inside interpolations included — a stack-based
 * 3-state machine, not ad-hoc recursion; the recursive draft misdrifted
 * line numbers on Prompt Master's modal templates, caught in calibration).
 * Line numbers are preserved 1:1 with the source so census hits point at
 * real lines. Regex literals are consumed as units so their metacharacters
 * never leak into the code view. */
export function codeOnly(src) {
    const out = src.split("\n").map(() => "");
    let i = 0, line = 0;
    const n = src.length;
    const emit = (ch) => { out[line] += ch; };
    /* state stack: {type:"tpl"} while inside a template literal,
     * {type:"interp", depth} while inside its ${…} interpolation. Code
     * states (top-level or interpolation) share one scanner body. */
    const stack = [];
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        const st = stack.length ? stack[stack.length - 1].type : "code";

        if (st === "tpl") {
            if (c === "\\") { i += 2; continue; }          // escaped content
            if (c === "`") { stack.pop(); i++; continue; } // template closes
            if (c === "$" && src[i + 1] === "{") { stack.push({ type: "interp", depth: 0 }); i += 2; continue; }
            i++; continue;                                  // content: blanked
        }

        /* st === "code" or "interp": one shared code scanner */
        if (c === "/" && src[i + 1] === "/") {
            while (i < n && src[i] !== "\n") i++;
            continue;
        }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const stop = end === -1 ? n : end + 2;
            while (i < stop) { if (src[i] === "\n") line++; i++; }
            continue;
        }
        if (c === '"' || c === "'") {
            emit(c); emit(c); i++;                       // "" / '' — contents blanked
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") break;              // unterminated: main gates report it
                i++;
            }
            continue;
        }
        if (c === "`") { stack.push({ type: "tpl" }); i++; continue; }

        /* regex literal — heuristically: only where a value may start */
        const prev = out[line].trim().slice(-1) || "";
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(prev || "(")) {
            emit("/"); i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { emit(src[i]); emit(src[i + 1] || ""); i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) { emit("/"); i++; break; }
                else if (src[i] === "\n") break;         // not a regex after all
                emit(src[i]);
                i++;
            }
            continue;
        }

        if (st === "interp") {
            const f = stack[stack.length - 1];
            if (c === "{") { f.depth++; emit(c); i++; continue; }
            if (c === "}") {
                if (f.depth === 0) { stack.pop(); i++; continue; } // ${…} closes
                f.depth--; emit(c); i++; continue;
            }
        }
        emit(c); i++;
    }
    return out.join("\n");
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
};

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
const ADJUDICATED = {
    /* — fully clean (no surviving sites): FLX, CB, BPW, B2U, purge,
     * Akasha-UI, Bunkr-UI, Filester, Forums, Gofile, GPD, Hailuo,
     * Images-UI, IG-UI, LMΨ-UI, MAM, ModelSearch, Pixeldrain, PM-UI,
     * Redgifs, Recon-UI, Stream Interceptor, WCP, YTPM, YTERB, m3u8-UI — */

    "4ndr0tools - 4ndr0serviceguard Companion.user.js": {
        tapOpenSend: { count: 1, reason: "own-mock: phantom XHR object's send (script-owned decoy, not a page tap)" },
    },
    "4ndr0tools - AlwaysNewWindow.user.js": {
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
    "4ndr0tools - Images++.user.js": {
        eval: { count: 1, reason: "eval-bridge: page-$ interop through trustedScript policy (v1.4.2 adjudication)" },
        newFunction: { count: 1, reason: "eval-bridge: same page-$ bridge, new Function fallback (policy-gated)" },
        parseFromString: { count: 1, reason: "page-policy: $parseHtml routes through the page's own trustedHTML policy (v1.4.2 capture)" },
    },
    "4ndr0tools - Instagram++.user.js": {
        parseFromString: { count: 1, reason: "page-policy: DASH manifest parse covered by the page 'default' createHTML policy minted at boot" },
    },
    /* Instagram++: fetchWrap(1) + xhrWrap(2) burned to zero in v1.4.7 — the
     * feed digest rides kernel/net.js onTraffic response events. */
    "4ndr0tools - Pixeldrain++.user.js": {
        tapOpenSend: { count: 3, reason: "accordion-state: panel s.open flags (not network taps)" },
    },
    /* Prompt Master: fetchWrap(1) + xhrWrap(2) burned to zero in v1.4.7 —
     * the flow-credit scanner rides kernel/net.js onTraffic response
     * events. */
    /* Recon: fetchWrap(1) + the xhrProto recorder taps(2) burned to zero
     * in v1.4.6 — blocklist verdicts + structured capture + pacification
     * ride kernel/net.js v4. The WebSocket bridge tap survives below. */
    "4ndr0tools - Recon.user.js": {
        tapOpenSend: { count: 1, reason: "ws-bridge: WebSocket send recorder (recon4 lineage — out of NetHook's fetch/XHR/beacon scope; the page-realm WS facade is Recon's own)" },
    },
    /* Watermark++: the RPC tapOpenSend(4) burned to zero in v1.4.7 — the
     * batchexecute observer rides kernel/net.js onTraffic events. The
     * surviving fetchWrap is the intent-gated image PROCESSING proxy —
     * an async fetch→process→synthetic-Response rewriter with full header
     * preservation, beyond the hub's synchronous verdict scope (same
     * adjudication class as m3u8++'s dev-proxy and Recon's WS bridge). */
    "4ndr0tools - Watermark++.user.js": {
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

    for (const f of files) {
        const src = fs.readFileSync(path.join(DIST, f), "utf8");
        const code = distCodeView(src);
        const counts = scanCode(code);
        const ledger = ADJUDICATED[f] || {};
        const known = new Set(Object.keys(ledger));

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

    /* Kernel zero-string-sink invariant (defense-in-depth; validate.mjs
     * Gate D owns the authoritative form). Class A only; core.js's
     * policy-wrapped parse pair is the sanctioned exception. */
    if (fs.existsSync(KERNEL)) {
        for (const f of fs.readdirSync(KERNEL).filter((f) => f.endsWith(".js")).sort()) {
            const code = codeOnly(fs.readFileSync(path.join(KERNEL, f), "utf8"));
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
