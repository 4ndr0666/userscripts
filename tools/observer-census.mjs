#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/observer-census.mjs — MutationObserver discipline census (suite v1.5.1)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.5.0 verdict §2/G2, completed in v1.5.1): the Phase A
 * machine audit found 61 active `new MutationObserver` sites across the
 * review sources and NO gate measuring the class — 21 with a node filter but
 * no coalescer, 7 with neither. This census is that gate.
 * (Precedent: tools/transport-census.mjs v1.4.10, tools/polling-census.mjs
 * v1.5.0.)
 *
 * What it scans: the REVIEW SOURCES — every canon/<tier> .user.js, every
 * modules/<name>/body.js and kernel/net.js, on the codeOnly view (string
 * contents, comments, template prose and regex bodies blanked; line numbers
 * preserved). dist is a machine-verified splice of exactly these files.
 *
 * Per `new MutationObserver(<arg>)` site, the census resolves the callback
 * (inline arrow/function body; identifier or wrap(identifier) references
 * resolved to the nearest preceding definition in the same file — nearest
 * following when the name is unique, covering hoisted declarations; alias
 * assignments followed one level) and classifies:
 *
 *   ONE-SHOT (structurally proven):
 *     - the resolved callback calls `.disconnect()` — the self-disconnecting
 *       waitFor idiom. The observer is its own bound: it stops itself on its
 *       settle condition. (Condition-gated disconnects count: the site stops
 *       the moment its target appears; until then each fire is the O(1)
 *       predicate.)
 *
 *   PERSISTENT-COALESCED (structurally proven):
 *     - filter proof (ANY of):
 *         F1 callback reads addedNodes / removedNodes (node-gated dispatch)
 *         F2 callback gates on nodeType / attributeName / mutation.type
 *         F3 callback carries an element-presence gate (querySelector /
 *            getElementById / .contains( / .matches( inside an if condition)
 *         F4 the .observe() config is scoped: NOT (characterData on a
 *            whole-document target), NOT (bare attributes without
 *            attributeFilter on a whole-document target). childList watching
 *            (with or without subtree) is scoped by construction.
 *       AND
 *     - coalescer proof: a structural debounce/throttle token in the RESOLVED
 *       callback body — setTimeout( / clearTimeout / requestAnimationFrame /
 *       cancelAnimationFrame, or a Date.now()/performance.now() delta throttle
 *       gate. Calls to local coalescer-named functions (debouncedX(),
 *       scheduleX()) count ONLY when the callee's body (resolved one level)
 *       contains a structural token — name trust is not a proof.
 *
 *   PERSISTENT-CHEAP (structurally proven):
 *     - filter proof (as above) AND the resolved callback body is O(1): no
 *       loop constructs (for/while/forEach/map/some/every/reduce/filter),
 *       no structural DOM writes (appendChild/.append(/insertAdjacentHTML/
 *       innerHTML/outerHTML/removeChild/replaceChild/insertBefore/createElement/
 *       setAttribute/parseFromString/.remove()/.after(/.before(/.replaceWith),
 *       no network dispatch, no eval family, body ≤ 500 chars of code. The
 *       no-change path must be a predicate; idempotency-guarded calls
 *       (dataset flags, class-list toggles, presence checks) are the exemption's
 *       letter: O(1) single-predicate work.
 *     - a callback that DELEGATES the mutation records to a local function
 *       (passes the records argument through) does NOT get cheap standing on
 *       its own shell: the delegated body is resolved and must itself pass
 *       the proof; an unresolvable delegation fails closed.
 *
 *   HUB-DELEGATED (structurally proven, v1.6.0): `__4NDR0_NET_API__.onNode(fn)`
 *     registrations — the defuse-class migration target. The observer
 *     lifecycle is KERNEL-OWNED (lazy arm on first subscriber, symmetric
 *     disarm on last unsubscribe, bounded registry, isolated synchronous
 *     fan in the insertion microtask — the race contract preserved); the
 *     callback is the script's defuse policy. The census requires the
 *     registration callback to be machine-resolvable (same callback
 *     resolution as private observers).
 *
 *   KERNEL-OWNED (self-asserted, v1.6.0): the single `new MutationObserver`
 *     site inside kernel/net.js — the NetHook v6 DOM defuse channel's own
 *     observer. The census self-asserts the kernel contract markers on the
 *     raw source (armNodeObserver / disarmNodeObserver / nodeSubs.size >=
 *     MAX_SUBS / disconnect / mutations.slice() isolation / the union
 *     observe config); a drifted kernel fails closed here.
 *
 *   LEDGERED: per-site adjudication for PERSISTENT sites the scanner cannot
 *     structurally clear — timing-critical immediate dispatch (defuse/
 *     sanitize families whose microtask timing IS the feature — a coalescer
 *     would let hostile content execute first), scoped-single-element
 *     watchers, settle-bounded probes, delegated batch processors behind
 *     alias chains, generic body-change watchers with broad configs. Every
 *     entry: file, callText, reason, expiry (the round that must re-adjudicate
 *     or migrate it). Drift-checked (site gone → fail; expiry passed → fail).
 *
 * Anything else fails closed.
 *
 * v1.6.0 round: the five TIMING defuse-class sites (Akasha defuse +
 *   iframe-propagation, Stream Interceptor sanitize, Bunkr defuse, YTPM
 *   menu reattach) MIGRATED onto the NetHook v6 onNode channel — their
 *   ledger entries are retired (the sites are now HUB-DELEGATED
 *   registrations; the kernel observer is KERNEL-OWNED). The remaining
 *   seven entries were re-adjudicated under the operator's v1.6.0
 *   authorization (GUP §5.3.2.4 human-adjudication boundary): site
 *   semantics re-verified this round, expiry rolled to v1.7.0.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ── Adjudication ledger (drift-checked; expiry must not have passed) ──────
 * Every entry is a PERSISTENT site the scanner cannot structurally clear.
 * Classes represented: TIMING (microtask-immediate defuse/sanitize/reattach
 * families whose coalescing would hand hostile content a macrotask window —
 * a superset regression, not a cleanup), SCOPED (single-element / single-
 * container watchers whose target scoping IS the bound), SETTLE (bounded
 * probe/keeper loops that self-terminate via their own settle path), and
 * DELEGATED (coalescing proven by construction but behind an alias chain
 * deeper than the census's bounded resolution). */
/* WO-01 round-1 re-adjudication: every entry below was re-verified against
 * the v1.8.2 tree (census green at counts) and its expiry rolled
 * v1.8.0 → v1.12.0 — the G9 gate was silently inert because CURRENT_ROUND
 * stayed hardcoded at v1.7.2 while the suite advanced (see
 * tools/census-round.mjs; the round now derives from package.json). */
const ADJUDICATED = [
    {
        file: "canon/_promoted/4ndr0tools - Media Player Controller.user.js",
        callText: "new MutationObserver((mutations) => { if (!repeatActive",
        reason: "SCOPED repeat tracker: observes the active media container only (subtree + attributeFilter on time/src); each fire is a gated single-action (executeRepeat) on a matching mutation — coalescing would collapse distinct video-end signals into one and change repeat semantics; repeat-mode exit gates the whole observer (repeatActive early return). v1.6.0 re-adjudication: site re-verified unchanged; scoped-container contract still the bound; NetHook onNode migration not applicable (per-container observe target, not document-level)",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Media Player Controller.user.js",
        callText: "new MutationObserver((mutations) => { const current = g",
        reason: "SCOPED media acquisition: observes the active container; getActiveMedia() liveness check + first-match early return per fire — acquisition must see the transient window when the active media swaps (a coalesced flush can miss intermediate nodes and latch a stale target); disconnected and re-armed per container by the acquire path. v1.6.0 re-adjudication: site re-verified unchanged; the re-arm-per-container lifecycle is the site's own, kernel ownership would not add a proof. v1.7.0 re-review",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - m3u8++.user.js",
        callText: "new MutationObserver(() => { if (!timeout) { timeout = ",
        reason: "SETTLE generic body watcher: watchBodyChange utility — the 200 ms in-flight debounce timer IS in the callback; the broad config (childList+attributes+characterData on the document) is deliberate because the utility's consumers (player mount/unmount detection) need the full surface and the consumer's onchange performs the filtering; per-fire work is the O(1) timer guard. v1.6.0 re-adjudication: coalescer-in-callback re-verified; the broad config is the utility's contract (consumer-side filtering), not drift. v1.7.0 re-review",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - AutoTranslate.user.js",
        callText: "new MutationObserver(probe); obs.observe(document.body,",
        reason: "SETTLE language probe: 120 ms Date.now() throttle gate + O(bounded) visible-text sample per fire; characterData on body is the point (text arrival is the signal); settles via finish() or the arming timeoutMs timer, after which the waitForText caller disconnects it — settle-bounded by construction. v1.6.0 re-adjudication: settle path re-verified; probe semantics unchanged. v1.7.0 re-review",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Prompt Master.user.js",
        callText: "new MutationObserver(async () => { if (!e.classList.con",
        reason: "SCOPED single-element sync: watches ONE prompt-row element (attributeFilter on class/data attributes) to re-sync color/tooltip from prompt metadata — per-fire work is an async storage read plus style writes on that single element; a coalescer would lag the UI sync visibly behind the class toggle; scoped by construction (the element is the whole observed surface). v1.6.0 re-adjudication: scope + filter re-verified. v1.7.0 re-review",
        expiry: "v1.18.0",
    },
    {
        file: "canon/_promoted/4ndr0tools - Confirmation Bypass.user.js",
        callText: "new MutationObserver(() => { pageReacted = true; });",
        reason: "SETTLE reaction-window probe (8b F07, round 8): a time-bounded 1.5 s whole-DOM liveness probe opened at click #1 — ANY mutation (childList, subtree, or attribute) is the signal that the page's handler reacted to the synthetic click, suppressing the single re-click. The callback is the O(1) flag set; the broad config IS the contract (a reaction is any mutation — narrowing attributeFilter or childList would blind exactly the reaction classes the guard needs: attribute flips, label swaps, spinner classes, handler-side DOM touches). Settle-bounded by construction: the observer disconnects itself via the REARM_MS-100 timer opened at the same click, and the beforeunload cleanup is the second bound; it cannot outlive the re-arm window it exists to guard",
        expiry: "v1.18.0",
    },
    /* v28.7.0 (suite re-review): the Prompt Master flow-credit SETTLE liveness
     * ledger entry REMOVED — the site graduated to structural discipline:
     * flowCreditScheduleTick now carries its own node gate (the host-chrome
     * filter over the mutation records) ahead of the 250 ms debounce, so the
     * census classifies it coalesced (node filter + coalescer) and no
     * justification ledger is owed. The v1.5.0 G1 liveness semantics are
     * unchanged: host DOM churn still keeps the storage sweep armed. */
    /* v1.7.0 (Wave 1.1 / 1.2 Door 1 graduation): the Watermark++ DELEGATED
     * batch processor ledger entry REMOVED — findDefs now skips destructured
     * parameter braces before locating the function body, and hasCoalescer
     * resolves the 2-hop factory member chain (scheduleProcess →
     * batchProcessor.schedule → createRootBatchProcessor → scheduleOnNextFrame),
     * graduating the site to structurally proven COALESCED, backed by the
     * 15-assertion tools/watermark-batch-smoke.mjs battery. */
];

/* ledger key: file + normalized callText */
const ledgerKey = (e) => `${e.file}::${e.callText.replace(/\s+/g, "")}`;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineStartsOf(view) {
    const s = [0];
    for (let i = 0; i < view.length; i++) if (view[i] === "\n") s.push(i + 1);
    return s;
}

function lineOf(starts, off) {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1; }
    return lo + 1;
}

/* Balanced-brace span from the first { at/after from. */
function braceSpan(view, from) {
    let i = from;
    while (i < view.length && view[i] !== "{") {
        if (view[i] === ";" || view[i] === ")") return null;
        i++;
    }
    let depth = 0;
    for (let j = i; j < view.length; j++) {
        if (view[j] === "{") depth++;
        else if (view[j] === "}") { depth--; if (depth === 0) return [i, j]; }
        if (depth < 0) return null;
    }
    return null;
}

/* ── definitions lookup: every definition of NAME in the file ──────────────
 * function NAME(…) {…}  ·  NAME = (…) => {…} / function  ·  NAME(…) {…} (method)
 * Returns [{offset, end, span}] sorted by offset. */
function findDefs(view, name) {
    const defs = [];
    const nameRe = escapeRe(name);
    const patterns = [
        new RegExp("function\\s+" + nameRe + "\\s*\\(", "g"),
        new RegExp("(?:^|[^\\w$.])" + nameRe + "\\s*=\\s*(?:async\\s+)?(?:function\\b|\\((?:[^()]|\\([^()]*\\))*\\)\\s*=>|[A-Za-z_$][\\w$]*\\s*=>)", "g"),
        new RegExp("(?:^|[^\\w$.])" + nameRe + "\\s*\\([^)]{0,80}\\)\\s*\\{", "g"),
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(view)) !== null) {
            let searchFrom = m.index + m[0].length - 1;
            if (view[searchFrom] === "(") {
                let pDepth = 0;
                for (let k = searchFrom; k < view.length; k++) {
                    if (view[k] === "(") pDepth++;
                    else if (view[k] === ")") {
                        pDepth--;
                        if (pDepth === 0) { searchFrom = k + 1; break; }
                    }
                }
            }
            const bOff = view.indexOf("{", searchFrom);
            const sp = bOff >= 0 ? braceSpan(view, bOff) : null;
            if (sp) defs.push({ offset: m.index, end: sp[1], span: sp });
        }
    }
    defs.sort((a, b) => a.offset - b.offset);
    return defs;
}

/* Resolve an identifier reference at `siteIdx` to ONE definition body:
 * nearest preceding def; when none precedes, nearest following (hoisted
 * function declarations). Alias assignments (`const a = b` where the RHS is
 * not a function) are followed one level when the RHS is a bare identifier. */
function resolveIdentBody(view, name, siteIdx) {
    let defs = findDefs(view, name);
    if (!defs.length) {
        /* alias follow: NAME = OTHER;  (RHS a bare identifier, not a function) */
        const aliasRe = new RegExp("(?:^|[^\\w$.])" + escapeRe(name) + "\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*[;,\n]");
        const am = aliasRe.exec(view.slice(0, siteIdx + 400));
        if (am) {
            const target = am[1];
            if (target !== name && !/^(?:true|false|null|undefined|this|self)$/.test(target)) {
                defs = findDefs(view, target);
                if (!defs.length) return null;
                return { body: view.slice(defs[0].span[0], defs[0].span[1] + 1), via: `${name}→${target}` };
            }
        }
        return null;
    }
    let pick = null;
    for (const d of defs) if (d.offset <= siteIdx) pick = d;
    if (!pick) pick = defs[0];
    return { body: view.slice(pick.span[0], pick.span[1] + 1), via: name };
}

/* ── constructor argument capture ──────────────────────────────────────────
 * new MutationObserver( <arg> … ): capture the first argument expression up
 * to its top-level closing paren / comma. */
function captureArg(view, openParen) {
    let depth = 0, end = openParen + 1;
    for (let i = openParen + 1; i < view.length; i++) {
        const c = view[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") {
            if (c === ")" && depth === 0) { end = i; break; }
            depth--;
        } else if (c === "," && depth === 0) { end = i; break; }
        if (depth < 0) { end = i; break; }
    }
    return view.slice(openParen + 1, end).trim();
}

/* ── the paired .observe( call (within 1200 chars after the constructor) ── */
function findObserve(view, fromOff) {
    const win = view.slice(fromOff, fromOff + 1200);
    const m = win.match(/\.observe\s*\(/);
    if (!m) return null;
    const openRel = m.index + m[0].length - 1;
    /* capture both observe args up to the closing paren of the call */
    let depth = 0, end = openRel + 1;
    for (let i = openRel + 1; i < win.length; i++) {
        const c = win[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") {
            if (c === ")" && depth === 0) { end = i; break; }
            depth--;
        }
    }
    const inner = win.slice(openRel + 1, end);
    const comma = inner.indexOf(",");
    const target = comma >= 0 ? inner.slice(0, comma).trim() : inner.trim();
    const config = comma >= 0 ? inner.slice(comma + 1).trim() : "";
    return { target, config, abs: fromOff + openRel };
}

/* ── proofs ──────────────────────────────────────────────────────────────── */

const DISCONNECT_RE = /\.disconnect\s*\(\)/;
const F1_RE = /\.(?:addedNodes|removedNodes)\b/;
const F2_RE = /(?:nodeType|attributeName|\.\s*type\s*(?:===|!==))/;
const F3_RE = /if\s*\([^)]{0,160}(?:querySelector|getElementById|\.contains\s*\(|\.matches\s*\(|\.isConnected|classList\.contains)/;
const LOOP_RE = /for\s*\(|while\s*\(|\.forEach\s*\(|\.map\s*\(|\.some\s*\(|\.every\s*\(|\.reduce\s*\(|\.filter\s*\(|for\s+await/;
const DOMWRITE_RE = /appendChild|\.append\s*\(|insertAdjacentHTML|innerHTML|outerHTML|removeChild|replaceChild|insertBefore|createElement|setAttribute|parseFromString|\.remove\s*\(\)|\.after\s*\(|\.before\s*\(|\.replaceWith/;
const NET_RE = /gmFetch|GM_xmlhttpRequest|GM\.xmlHttpRequest|fetch\s*\(|XMLHttpRequest|\.send\s*\(/;
/* WO-01 round-4 (4-a F07): the `.` dropped from the class — `window.eval(`
 * was invisible to the cheap-body classifier (the identical one-character
 * precedent already landed twice: polling 6-a F04, transport 3-a F10).
 * Zero live today (the only window.eval site is Images++'s page-$ bridge,
 * not an observer body) — the member form fails closed from now on. */
const EVAL_RE = /(?:^|[^\w$])eval\s*\(|new\s+Function/;
const COALESCE_STRUCT_RE = /setTimeout\s*\(|clearTimeout|requestAnimationFrame|cancelAnimationFrame/;
const THROTTLE_RE = /(?:Date|performance)\s*\.\s*now\s*\(\s*\)\s*-\s*[A-Za-z_$][\w$]*\s*</;
const CHEAP_MAX_BODY = 500;

/* whole-document observe targets (the broad-surface anti-pattern) */
function isWholeDocTarget(target) {
    return /^(?:document|unsafeWindow\s*\.\s*document|document\s*\.\s*(?:documentElement|body)|doc\s*\.\s*body|root\s*\|\|\s*document\s*\.\s*body)$/.test(target.trim()) ||
           /^document\b/.test(target.trim());
}

/* F4: config scoped by construction */
function configScoped(target, config) {
    const whole = isWholeDocTarget(target);
    const attrBare = /attributes\s*:\s*(?:true|!0)/.test(config) && !/attributeFilter/.test(config);
    const charData = /characterData\s*:\s*(?:true|!0)/.test(config);
    if (whole && charData) return false;
    if (whole && attrBare) return false;
    return true;
}

function hasFilter(body, obs) {
    if (F1_RE.test(body)) return true;
    if (F2_RE.test(body)) return true;
    if (F3_RE.test(body)) return true;
    if (obs && configScoped(obs.target, obs.config)) return true;
    return false;
}

/* structural coalescer in the body, or via a resolved local callee */
function hasCoalescer(view, body, siteIdx) {
    if (COALESCE_STRUCT_RE.test(body) || THROTTLE_RE.test(body)) return true;
    /* local coalescer-named calls: debouncedX() / scheduleX() / flushX() —
     * proven only through the callee's resolved body (one level, bounded):
     *   (a) a function definition of that name, or
     *   (b) `const X = FACTORY(...)` — the FACTORY's own body must carry the
     *       structural token (the debounce()/throttle() util idiom). */
    const callRe = /(?:^|[^\w$.])((?:debounce\w*|schedule\w*|coalesce\w*|flush\w*|tranche\w*))\s*\(/g;
    let m;
    while ((m = callRe.exec(body)) !== null) {
        const fn = m[1];
        const res = resolveIdentBody(view, fn, siteIdx);
        if (res && (COALESCE_STRUCT_RE.test(res.body) || THROTTLE_RE.test(res.body))) return true;
        /* factory-result assignment: X = FACTORY(args…) or X = OBJ.method where OBJ = FACTORY(args…) */
        let targetVar = fn;
        const propRe = new RegExp("(?:^|[^\\w$.])" + escapeRe(fn) + "\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\.\\s*[A-Za-z_$][\\w$]*");
        const pm = propRe.exec(view.slice(0, siteIdx + 400));
        if (pm) targetVar = pm[1];
        const factRe = new RegExp("(?:^|[^\\w$.])" + escapeRe(targetVar) + "\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\(");
        const fm = factRe.exec(view.slice(0, siteIdx + 400));
        if (fm) {
            const fres = resolveIdentBody(view, fm[1], siteIdx);
            if (fres) {
                if (COALESCE_STRUCT_RE.test(fres.body) || THROTTLE_RE.test(fres.body)) return true;
                const fDefs = findDefs(view, fm[1]);
                if (fDefs.length) {
                    const hdr = view.slice(fDefs[0].offset, fDefs[0].span[0]);
                    const defSched = hdr.match(/(?:schedule\w*|flush\w*)\s*=\s*([A-Za-z_$][\w$]*)/);
                    if (defSched) {
                        const sres = resolveIdentBody(view, defSched[1], siteIdx);
                        if (sres && (COALESCE_STRUCT_RE.test(sres.body) || THROTTLE_RE.test(sres.body))) return true;
                    }
                }
            }
        }
    }
    return false;
}

function isCheapBody(body) {
    if (LOOP_RE.test(body)) return false;
    if (DOMWRITE_RE.test(body)) return false;
    if (NET_RE.test(body)) return false;
    if (EVAL_RE.test(body)) return false;
    if (body.length > CHEAP_MAX_BODY) return false;
    return true;
}

/* delegation: body passes the mutation records into a local call */
function findRecordDelegation(body) {
    const m = body.match(/(?:^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(\s*(?:mutations?|muts?|records?|entries?|mutationList|mutationsList)\s*[,)]/);
    return m ? m[1] : null;
}

/* ── callback resolution ──────────────────────────────────────────────────
 * Returns { body, kind } where kind ∈ inline | ref | unresolved. */
function resolveCallback(view, argExpr, openParen) {
    const arrowish = /^(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/.test(argExpr) || /^function\b/.test(argExpr);
    if (arrowish || /^function\b/.test(argExpr)) {
        if (/\{\s*$/.test(argExpr) || argExpr.includes("{")) {
            const bOff = view.indexOf("{", openParen + 1);
            const sp = braceSpan(view, bOff);
            if (sp) return { body: view.slice(sp[0], sp[1] + 1), kind: "inline" };
        }
        return { body: argExpr, kind: "inline" }; /* expression arrow */
    }
    /* reference / wrap(reference) forms */
    const idents = argExpr.match(/[A-Za-z_$][\w$]*/g) || [];
    const skip = new Set(["new", "MutationObserver", "SAFETY", "safeWrap", "async", "function", "this", "self", "bind", "debounce", "throttle"]);
    let name = null;
    for (let i = idents.length - 1; i >= 0; i--) {
        if (!skip.has(idents[i]) && /^[A-Za-z_$]/.test(idents[i])) { name = idents[i]; break; }
    }
    if (!name) return { body: argExpr, kind: "unresolved" };
    const res = resolveIdentBody(view, name, openParen);
    if (!res) return { body: argExpr, kind: "unresolved", ref: name };
    return { body: res.body, kind: "ref", ref: name, via: res.via };
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runObserverCensus(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { sites: 0, oneShot: 0, coalesced: 0, cheap: 0, ledgered: 0, hubDelegated: 0, kernelOwned: 0, filesScanned: 0 };
    const seenLedger = new Set();

    const targets = [];
    const canonDir = path.join(root, "canon");
    if (fs.existsSync(canonDir)) {
        for (const tier of fs.readdirSync(canonDir).sort()) {
            const dir = path.join(canonDir, tier);
            if (!fs.statSync(dir).isDirectory()) continue;
            for (const f of fs.readdirSync(dir).sort()) {
                if (f.endsWith(".user.js")) targets.push([`canon/${tier}/${f}`, path.join(dir, f)]);
            }
        }
    }
    const modulesDir = path.join(root, "modules");
    if (fs.existsSync(modulesDir)) {
        for (const d of fs.readdirSync(modulesDir).sort()) {
            const body = path.join(modulesDir, d, "body.js");
            if (fs.existsSync(body)) targets.push([`modules/${d}/body.js`, body]);
        }
    }
    targets.push(["kernel/net.js", path.join(root, "kernel", "net.js")]);

    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        stats.filesScanned++;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);
        const isKernel = rel === "kernel/net.js";
        if (isKernel) {
            /* v1.6.0 KERNEL-OWNED self-assertion — the NetHook v6 DOM defuse
             * channel's single observer. Markers are checked on the RAW
             * source (codeOnly blanks the string literals some markers
             * carry); a drifted kernel fails closed right here. */
            const raw = fs.readFileSync(abs, "utf8");
            const moCount = (raw.match(/new\s+MutationObserver\s*\(/g) || []).length;
            if (moCount !== 1) {
                problems.push(`kernel/net.js: expected exactly ONE kernel-owned MutationObserver (the v6 onNode channel), found ${moCount} — the DOM defuse channel contract is broken`);
            }
            const markers = [
                [/function fanNode\(/, "fanNode fan entry point"],
                [/function armNodeObserver\(/, "lazy arm guard (armNodeObserver)"],
                [/function disarmNodeObserver\(/, "symmetric disarm (disarmNodeObserver)"],
                [/nodeSubs\.size >= MAX_SUBS/, "bounded onNode registry (MAX_SUBS)"],
                [/nodeObserver\.disconnect\(\)/, "disconnect-on-empty"],
                [/nodeSubs\.size === 0\) disarmNodeObserver\(\)/, "disarm wired to last unsubscribe"],
                [/mutations\.slice\(\)/, "per-subscriber batch isolation"],
                [/attributeFilter: \['src'\]/, "union observe config (attributes filtered to src)"],
                [/node subscriber failed/, "subscriber isolation (scoped debug)"],
                [/typeof h\.onNode === 'function'/, "isFullHub carries the onNode surface"],
            ];
            for (const [re, label] of markers) {
                if (!re.test(raw)) {
                    problems.push(`kernel/net.js: v6 onNode channel marker missing — ${label}`);
                }
            }
        }
        const siteRe = /new\s+MutationObserver\s*\(/g;
        let m;
        while ((m = siteRe.exec(view)) !== null) {
            stats.sites++;
            if (isKernel) {
                /* v1.6.0: the kernel's own observer — its lifecycle contract
                 * is self-asserted above (lazy arm / symmetric disarm /
                 * bounded registry / isolated fan); it is not a script-side
                 * discipline site. */
                stats.kernelOwned++;
                continue;
            }
            const openParen = m.index + m[0].length - 1;
            const line = lineOf(starts, m.index);
            const argExpr = captureArg(view, openParen);
            const cb = resolveCallback(view, argExpr, openParen);
            const callText = view.slice(m.index, m.index + 90).replace(/\s+/g, " ").trim().slice(0, 55);

            /* the paired .observe() call (also captures multi-line configs) */
            let closeSearch = openParen + argExpr.length + 2;
            const obs = findObserve(view, closeSearch);

            if (cb.kind === "unresolved") {
                problems.push(
                    `${rel}:${line}: UNRESOLVED observer callback \`${callText}…\` — the reference (${cb.ref || argExpr.slice(0, 30)}) has no resolvable function body in this file; GUP B.1 observer discipline needs a machine-provable callback (or a ledger entry)`
                );
                continue;
            }

            /* ONE-SHOT: self-disconnecting */
            if (DISCONNECT_RE.test(cb.body)) { stats.oneShot++; continue; }

            /* delegation with the records: resolve the delegated body */
            let proofBody = cb.body;
            const deleg = findRecordDelegation(cb.body);
            if (deleg && cb.kind === "inline") {
                const res = resolveIdentBody(view, deleg, m.index);
                if (res) proofBody = proofBody + "\n" + res.body;
                else {
                    problems.push(
                        `${rel}:${line}: UNRESOLVED delegation \`${callText}…\` → ${deleg}(records) — the delegated handler body cannot be resolved; prove it or ledger the site`
                    );
                    continue;
                }
            }

            const filter = hasFilter(proofBody, obs);
            const coalesce = hasCoalescer(view, proofBody, m.index);
            const cheap = isCheapBody(proofBody);

            if (filter && coalesce) { stats.coalesced++; continue; }
            if (filter && cheap && !deleg) { stats.cheap++; continue; }

            /* ledger match (whitespace-insensitive prefix, 45 collapsed chars —
             * long enough to disambiguate same-file sites whose call texts
             * share the constructor + parameter prefix) */
            const norm = (s) => s.replace(/\s+/g, "");
            const entry = ADJUDICATED.find(
                (e) => e.file === rel && norm(callText).startsWith(norm(e.callText).slice(0, 45))
            );
            if (entry) { stats.ledgered++; seenLedger.add(ledgerKey(entry)); continue; }

            const missing = !filter ? "no structural filter (node gate / presence gate / scoped config)" :
                (!coalesce && !cheap) ? "no coalescer and not an O(1) body" :
                !coalesce ? "no coalescer (debounce/throttle/rAF)" : "body is not O(1)";
            problems.push(
                `${rel}:${line}: UNDISCIPLINED observer \`${callText}…\` — ${missing} (GUP B.1: observer discipline; add a node filter + coalescer, keep the callback O(1)-guarded, or ledger the site with justification + expiry)`
            );
        }

        /* v1.6.0: HUB-DELEGATED registrations — every
         * __4NDR0_NET_API__.onNode(fn) call site in the review sources.
         * The lifecycle is kernel-owned (self-asserted on kernel/net.js);
         * the census requires the policy callback to be machine-resolvable
         * (same callback resolution as private observers). */
        const regRe = /__4NDR0_NET_API__\s*\.\s*onNode\s*\(/g;
        while ((m = regRe.exec(view)) !== null) {
            const openParen = m.index + m[0].length - 1;
            const line = lineOf(starts, m.index);
            const argExpr = captureArg(view, openParen);
            const cb = resolveCallback(view, argExpr, openParen);
            const callText = view.slice(m.index, m.index + 90).replace(/\s+/g, " ").trim().slice(0, 55);
            if (cb.kind === "unresolved") {
                problems.push(
                    `${rel}:${line}: UNRESOLVED onNode registration \`${callText}…\` — the defuse policy callback (${cb.ref || argExpr.slice(0, 30)}) has no resolvable function body in this file; hub-delegated discipline needs a machine-provable policy (GUP B.1)`
                );
                continue;
            }
            stats.hubDelegated++;
        }
    }

    /* ledger drift + expiry enforcement */
    for (const e of ADJUDICATED) {
        if (!seenLedger.has(ledgerKey(e))) {
            problems.push(`stale observer ledger entry: ${e.file} :: ${e.callText} — site not found (remove or update)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired observer ledger entry: ${e.file} :: ${e.callText} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    return { problems, ...stats };
}

/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/* CLI: node tools/observer-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runObserverCensus(root);
    console.log(`observer census: ${r.filesScanned} source files, ${r.sites} MutationObserver sites — ${r.oneShot} one-shot, ${r.coalesced} coalesced, ${r.cheap} cheap-O(1), ${r.ledgered} ledgered, ${r.hubDelegated} hub-delegated, ${r.kernelOwned} kernel-owned`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every observer is self-bounded, coalesced, O(1), ledgered, hub-delegated or kernel-owned");
}
