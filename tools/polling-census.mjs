#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/polling-census.mjs — setInterval boundedness census (suite v1.5.0)
 * ----------------------------------------------------------------------------
 * Round mandate (v1.5.0, GUP B.1 "Bounded Polling"): the Phase A machine
 * audit found 39 active setInterval sites across the review sources and NO
 * gate measuring the class. 24 of them never clear at all; the rest clear on
 * conditions but carry no ceiling for the never-found / hung-state case. This
 * census is that gate. (Precedent: tools/transport-census.mjs, v1.4.10.)
 *
 * What it scans: the REVIEW SOURCES — every canon/<tier> .user.js, every
 * modules/<name>/body.js and kernel/net.js, on the codeOnly view (string
 * contents, comments, template prose and regex bodies blanked; line numbers
 * preserved). dist is a machine-verified splice of exactly these files.
 *
 * Per setInterval( site, the census resolves the callback (inline arrow /
 * function expression — or, for reference callbacks like setInterval(fn, ms)
 * or setInterval(wrap(fn), ms), the referenced function's body in the same
 * file, one resolution level) and classifies:
 *
 *   RETRY-BOUND (structurally proven):
 *     - attempt ceiling: a counter increment (n++ / ++n / n += 1) AND a
 *       >=/> comparison against a numeric literal or a MAX/LIMIT/CAP-named
 *       constant AND clearInterval reachable in the callback body; or
 *     - time ceiling: Date.now()/performance.now() minus an arming
 *       timestamp compared with a bound, clearInterval on exceed.
 *
 *   SERVICE-GUARDED (structurally proven):
 *     - lifecycle clear: clearInterval(<this timer>) inside the callback
 *       body, OR the timer's holding variable (captured at the arming site,
 *       incl. this.X / obj.X property forms) is cleared somewhere else in
 *       the file (stop/destroy/close path); AND
 *     - bounding guard: an early-return gate in the resolved callback —
 *       document.hidden / visibilityState (visibility gate), a
 *       .enabled/.active/.running/.open config-state gate, or an
 *       element-presence gate (querySelector/getElementById/isConnected
 *       check returning early when the feature surface is absent).
 *
 *   LEDGERED: page-lifetime watchers with no machine-provable bound — each
 *     entry needs file + call text + justification + expiry; drift-checked.
 *
 * Anything else fails closed. A ceiling constant that exists but never
 * clears the interval does NOT count (both halves must be present).
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENT_ROUND, roundLt } from "./census-round.mjs"; /* WO-01 round-1 (2-a F1): round derives from package.json — the hardcoded
 * "v1.7.2" left every G9 expiry check inert while the suite reached v1.8.2. */
import { codeOnlyCached } from "./scan-kit.mjs"; /* WO-01 round-4 (4-a F04): shared per-file memo */

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* v1.6.0 < v1.7.0 (string-aware compare, tolerant of missing segments) */
/* WO-01 round-4 (4-a F02): roundLt is single-sourced from census-round.mjs now — the nine byte-identical copies are gone (port-drift class closed). */

/* ── Adjudication ledger: page-lifetime watchers without machine-provable
 * bounds. Every entry: file, callText (as the scanner normalizes it),
 * reason, expiry (the round that must re-adjudicate or migrate it). An
 * entry whose site disappears fails the census (drift); an entry whose
 * expiry has passed without re-adjudication fails too. All six entries
 * re-adjudicated v1.6.0 under the operator's standing authorization (GUP
 * §5.3.2.4): site semantics re-verified, expiry rolled to v1.7.0. */
/* WO-01 round-1 re-adjudication: every entry below was re-verified against
 * the v1.8.2 tree (census green at counts) and its expiry rolled
 * v1.8.0 → v1.12.0 — the G9 gate was silently inert because CURRENT_ROUND
 * stayed hardcoded at v1.7.2 while the suite advanced (see
 * tools/census-round.mjs; the round now derives from package.json). */
const ADJUDICATED_PAGE_LIFETIME = [
    {
        file: "canon/_promoted/4ndr0tools - Hailuo++.user.js",
        callText: "setInterval(() => { try { this.ensureHudInt",
        reason: "engine heartbeat: ensureHudIntegrity + executeLoopIteration every executionInterval; D6 try/catch with Logger.error; per-tick work is the download engine itself — a hidden-gate would stall background downloads and an idle ceiling has no idle definition (integrity repair IS the work). Page-lifetime by design. v1.6.0 re-adjudication: the NetHook onNode channel was reviewed for this site and REJECTED as a migration target — the hub owns DOM/network event fan-out, not engine liveness ticks; the heartbeat IS the feature's liveness contract. v1.7.0 re-review",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - AlwaysNewWindow.user.js",
        callText: "setInterval(() => { if (location.href !==",
        reason: "SPA href-watch fallback (armed only when the Navigation API is absent): O(1) same-href compare per 1 s — the compare IS the detection mechanism; stopPollingLocation() exists for teardown. No re-arm trigger exists short of a full history-hook rewrite (separate round)",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Prompt Master.user.js",
        callText: "setInterval(() => { h.scrollTop += c; }, 20",
        reason: "auto-scroll animator: re-arm clear in the speed setter (B) + explicit stop (R) lifecycle pair; 20 ms animation tick; scroll-position semantics make visibility/idle gating a behavior change (a parked animator stops following new chat content)",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Prompt Master.user.js",
        callText: "setInterval(async () => { const e = getCurrent",
        reason: "chat-id watcher: O(1) same-chat compare each tick; the compare IS the detection mechanism (no re-arm trigger exists short of an SPA history-hook rewrite — separate round); page-lifetime by design",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js",
        callText: "setInterval(fn, ms); ownedIntervals.add",
        reason: "interval-registry infra: ownInterval() registers every timer it creates into ownedIntervals, and the session shutdown clears the registry wholesale (for (const id of ownedIntervals) clearInterval(id)); the call sites carry the guards (tick: session-exit self-clear; applyRandomPlay: pathname gate)",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Forums++.user.js",
        callText: "setInterval(beat, GBX_HEARTBEAT_MS)",
        reason: "goonbox bridge heartbeat (round 6, lineage L598-1071 port): the marker-gated helper tab beats xfpd_gbx_ready every second so the forum tab's gbxBridgeAlive() freshness check (5x heartbeat window) can detect a dead/closed helper — the beat IS the liveness signal, no detection trigger can be separated from it; teardown pair: beforeunload clears the interval AND zeroes the ready key; the tab's whole purpose is to outlive individual requests (idle close is request-driven, not time-driven)",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - Forums++.user.js",
        callText: "setInterval(() => { handle(gbxGet(GBX_K_REQ,",
        reason: "goonbox bridge request poll (round 6): dual-delivery receiver — GM_addValueChangeListener delivers the request on the configurations where cross-tab storage propagation works, this 150 ms poll is the ONLY delivery path on Firefox+Tampermonkey (per-tab GM cache blindness, the b13 lesson); per-tick work is a JSON.parse of a usually-empty string (O(1) not-ready return); lastId makes double-delivery a no-op; teardown pair: beforeunload clears the interval",
        expiry: "v1.15.0",
    },
    {
        file: "canon/_sovereign/4ndr0tools - YouTube Playlist Master.user.js",
        callText: "setInterval(() => { try { if (!DECK.root",
        reason: "deck watchdog: self-healing re-mount daemon (documented v1.2.0/v1.4.0 behavior — deliberately retries every 5 s for the page lifetime, mountFails counter guards error-flood); per-tick work is an O(1) isConnected check; detection of detach IS this watchdog, so no re-arm trigger can be separated from it",
        expiry: "v1.15.0",
    },
];

/* ledger key: file + normalized callText (drift detection uses the same) */
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

/* Balanced-brace span from the first { at/after from; stops early at a
 * statement terminator in code view (valid JS keeps braces balanced). */
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

/* ── proof detectors (all operate on the RESOLVED callback body) ────────── */

/* counter increment: n++ / ++n / n += 1 / n = … + 1 (assignment form) */
const COUNTER_INC_RE = /(?:\(\s*\+\+\s*([A-Za-z_$][\w$]*)|(^|[^\w$])([A-Za-z_$][\w$]*)\s*(?:\+\+|\+=\s*1\b)|([A-Za-z_$][\w$.]*)\s*=[^=;]{0,60}\+\s*1\b)/;
/* ceiling compare: >= / > against a numeric literal or a MAX/LIMIT/CAP-named
 * constant (the name may START with MAX, e.g. MAX_ATTEMPTS) */
const CEILING_CMP_RE = /(?:>=|>)\s*(?:\d+|[A-Za-z_$][\w$.]*)/g;
function hasCeilingCompare(text) {
    CEILING_CMP_RE.lastIndex = 0;
    let m;
    while ((m = CEILING_CMP_RE.exec(text)) !== null) {
        const rhs = m[0].replace(/^[>=]+\s*/, "").trim();
        if (/^\d+$/.test(rhs)) return true;                        /* numeric ceiling */
        if (/\w*(?:MAX|LIMIT|CAP|CEIL)\w*/i.test(rhs)) return true; /* named ceiling const */
    }
    return false;
}
/* time ceiling: Date.now()/performance.now() delta compared */
const TIME_CEIL_RE = /(?:Date|performance)\s*\.\s*now\s*\(\s*\)\s*-\s*[A-Za-z_$][\w$]*\s*(?:>|>=)/;
const CLEAR_IN_CB_RE = /clearInterval\s*\(/;

/* guard: an early-return (or clear) gated on visibility / negated config-
 * state / NEGATED element-presence — checked as ±220-char windows around
 * each `return` and each in-callback clearInterval. Presence markers must
 * be NEGATED in the guarding condition: `if (!el) return` / `if (!el)
 * {clear; return}` bound the loop to the surface's lifetime, while
 * `if (el) { work; clear }` is retry-until-found and needs a ceiling.
 * A bare data-compare (if (a === b) return) is NOT a guard. */
function hasGuard(cb) {
    const probes = [];
    let idx = 0;
    while ((idx = cb.indexOf("return", idx)) !== -1) {
        probes.push(cb.slice(Math.max(0, idx - 220), idx + 40));
        idx += 6;
    }
    idx = 0;
    while ((idx = cb.indexOf("clearInterval", idx)) !== -1) {
        probes.push(cb.slice(Math.max(0, idx - 220), idx + 60));
        idx += 13;
    }
    const PRESENCE = /(?:querySelector|getElementById|isConnected)/;
    const CFGSTATE = /\.\s*(?:enabled|active|running|open)\b/;
    /* session-state gates: negated URL-param/path/attribute checks — the
     * "feature session still active" class (YTPM random-mode tick) and
     * mode gates on string literals. Var-vs-var compares stay OUT. */
    const SESSION = /(?:\.has\s*\(\s*['"]|!==\s*['"]|!\s*\.?\s*hasAttribute\s*\()/;
    for (const win of probes) {
        if (/document\s*\.\s*(?:hidden|visibilityState)/.test(win)) return true;      /* visibility: hidden-positive is the skip */
        const ifm = win.match(/if\s*\(([^)]{0,150})\)/);
        if (!ifm) continue;
        const cond = ifm[1];
        const negPresence = /!\s*[^&|]{0,80}/.test(cond) || /===\s*(?:null|undefined|!1\b|false)/.test(cond) || /&&\s*!/.test(cond);
        if (PRESENCE.test(cond) && negPresence) return true;                              /* !el / el === null gate */
        if (CFGSTATE.test(cond) && /!/.test(cond)) return true;                           /* !cfg.enabled gate */
        if (SESSION.test(cond) && /!/.test(cond)) return true;                            /* session/mode gate on a literal */
    }
    /* guard as the head of the body */
    const head = cb.slice(0, 250);
    if (/document\s*\.\s*(?:hidden|visibilityState)/.test(head)) return true;
    const hm = head.match(/if\s*\(([^)]{0,150})\)\s*\{?\s*(?:return|clearInterval)/);
    if (hm) {
        const cond = hm[1];
        if (PRESENCE.test(cond) && /!/.test(cond)) return true;
        if (CFGSTATE.test(cond) && /!/.test(cond)) return true;
    }
    return false;
}

/* clear-equivalence: clearInterval literal, OR a this.stop()/self.stop()
 * call whose stop() method (in the same file) clears the interval — the
 * suite's start/stop driver idiom (IG NativeScrollDriver). */
function clearEquiv(cb, fileView, fileHasStopClear) {
    if (CLEAR_IN_CB_RE.test(cb)) return true;
    if (/\b(?:this|self)\s*\.\s*stop\s*\(/.test(cb) && fileHasStopClear) return true;
    return false;
}

/* attempt-ceiling proof: counter + ceiling compare + a clear (or clear-
 * equivalent) — all in the callback (or its resolved body) */
function hasAttemptCeiling(cb, fileView, fileHasStopClear) {
    if (!clearEquiv(cb, fileView, fileHasStopClear)) return false;
    const inc = cb.match(COUNTER_INC_RE);
    if (!inc) return false;
    /* the compared name should be the counter or a ceiling-named const */
    return hasCeilingCompare(cb);
}

/* time ceiling: Date.now()/performance.now() delta compared, with a clear
 * (or clear-equivalent) in the resolved body */
function hasTimeCeiling(cb, fileView, fileHasStopClear) {
    if (!clearEquiv(cb, fileView, fileHasStopClear)) return false;
    return TIME_CEIL_RE.test(cb);
}

/* ── callback resolution ────────────────────────────────────────────────────
 * setInterval( <arg>, ms ): if arg starts with ( or function or an arrow,
 * resolve inline; if it is an identifier / member / wrap(ident) chain, also
 * scan the referenced function body (one level, same file). Returns an
 * array of code chunks composing the "resolved body". */
function resolveCallbackBodies(view, openParen) {
    const chunks = [];
    let p = openParen + 1;
    while (p < view.length && /\s/.test(view[p])) p++;
    /* collect the argument expression up to the closing paren of arg1
     * (top-level comma) */
    let depth = 0, end = p;
    for (let i = p; i < view.length; i++) {
        const c = view[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") {
            if (c === ")" && depth === 0) { end = i; break; }
            depth--;
        } else if (c === "," && depth === 0) { end = i; break; }
        else if (c === "\n" && depth === 0) { /* multiline arg — continue */ }
        if (depth < 0) { end = i; break; }
    }
    const argExpr = view.slice(p, end).trim();
    /* inline function expression / arrow */
    const mArrow = argExpr.match(/^(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*(\{?)/);
    const mFunc = argExpr.match(/^(?:async\s+)?function\b/);
    if (mArrow || mFunc) {
        if (argExpr.includes("{")) {
            /* brace-body inline callback: the proof scope is EXACTLY this
             * body — never resolve identifiers found inside it (coincidental
             * same-file names would smuggle in foreign ceilings) */
            const bOff = view.indexOf("{", p);
            const sp = braceSpan(view, bOff);
            chunks.push(sp ? view.slice(sp[0], sp[1] + 1) : argExpr);
            return chunks;
        }
        /* expression arrow — the referenced callee resolves below */
        chunks.push(argExpr);
    } else if (/^['"`]/.test(argExpr)) {
        /* string-literal timer (timerString sink class — sink-census owns it,
         * but flag it here too as unbounded-by-construction) */
        chunks.push("TIMER_STRING");
        return chunks;
    } else {
        /* reference: plain identifier, member, or wrap(ident) — the call
         * shape itself is a guard probe target */
        chunks.push(argExpr);
    }
    /* resolve CALLEE identifiers of the (small, callee-shaped) argument
     * expression to their definitions in the same file, one level */
    const idents = argExpr.match(/[A-Za-z_$][\w$]*/g) || [];
    for (const id of idents) {
        if (["setInterval", "setTimeout", "SAFETY", "safeWrap", "App", "this", "self"].includes(id)) {
            /* wrapper/utility namespaces — follow deeper idents */
            continue;
        }
        const defs = [];
        /* function NAME(…) { */
        const fnRe = new RegExp("function\\s+" + escapeRe(id) + "\\s*\\(", "g");
        /* NAME = (…,…) => / NAME = function / NAME(…) { (method) */
        const asgRe = new RegExp("(?:^|[^\\w$.])" + escapeRe(id) + "\\s*=\\s*(?:async\\s+)?(?:function\\b|\\(|[A-Za-z_$][\\w$]*\\s*=>)", "g");
        const methRe = new RegExp("(?:^|[^\\w$])" + escapeRe(id) + "\\s*\\([^)]{0,80}\\)\\s*\\{", "g");
        let mm;
        while ((mm = fnRe.exec(view)) !== null) { const sp = braceSpan(view, mm.index + mm[0].length - 1); if (sp) defs.push(view.slice(sp[0], sp[1] + 1)); }
        while ((mm = asgRe.exec(view)) !== null) {
            const bOff = view.indexOf("{", mm.index + mm[0].length - 1);
            const sp = bOff >= 0 ? braceSpan(view, bOff) : null;
            if (sp) defs.push(view.slice(sp[0], sp[1] + 1));
        }
        while ((mm = methRe.exec(view)) !== null) { const sp = braceSpan(view, mm.index + mm[0].length - 1); if (sp) defs.push(view.slice(sp[0], sp[1] + 1)); }
        chunks.push(...defs.slice(0, 3));
    }
    return chunks;
}

/* timer holding variable at the arming site: NAME = / this.NAME = / obj.NAME = */
function holdingVar(view, siteIdx) {
    const before = view.slice(Math.max(0, siteIdx - 120), siteIdx);
    const m = before.match(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?)\s*=\s*$/) ||
              before.match(/(this\.[A-Za-z_$][\w$]*)\s*=\s*$/);
    return m ? m[1] : null;
}

/* ── the census ──────────────────────────────────────────────────────────── */

export function runPollingCensus(root = DEFAULT_ROOT) {
    const problems = [];
    const stats = { sites: 0, retryBounded: 0, serviceGuarded: 0, ledgered: 0, selfRearms: 0, selfRearmBounded: 0, selfRearmStateGated: 0, filesScanned: 0 };
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
        /* WO-01 round-2 (6-a F04): the char class dropped the `.` so member-form
         * `window.setInterval(…)` sites were INVISIBLE to the census — exactly
         * the class this census exists to catch (the round-2 audit's live
         * instance: BPP theathletic's no-argument clearInterval() watcher,
         * which polled forever because clearInterval() without a handle is a
         * spec no-op). Preceding `.` is now admitted; identifier-word and `$`
         * boundaries still guard against substring matches inside longer
         * identifiers. */
        const siteRe = /(^|[^\w$])setInterval\s*\(/g;
        let m;
        while ((m = siteRe.exec(view)) !== null) {
            stats.sites++;
            const openParen = m.index + m[0].length - 1;
            const line = lineOf(starts, m.index);
            const bodies = resolveCallbackBodies(view, openParen);
            const cb = bodies.join("\n");

            if (cb.includes("TIMER_STRING")) {
                problems.push(`${rel}:${line}: string-arg interval (timerString sink class) — sink-census adjudication required; polling census treats it as unbounded`);
                continue;
            }

            const arming = view.slice(Math.max(0, m.index - 400), m.index);
            const hv = holdingVar(view, m.index);

            /* lifecycle: the holding variable cleared by a stop/destroy path
             * anywhere in the file (member-qualified forms count), or the
             * holding variable cleared inside the resolved callback. A clear
             * of a DIFFERENT timer does not prove this site's lifecycle, and
             * a bare (un-held) interval can never prove one — those must be
             * retry-bounded or ledgered. */
            const fileHasStopClear = /(?:function\s+stop\s*\(|\bstop\s*\([^)]{0,40}\)\s*\{)[\s\S]{0,400}?clearInterval/.test(view);
            const hvBase = hv ? (hv.includes(".") ? hv.split(".").pop() : hv) : null;
            const hvBaseEsc = hvBase ? escapeRe(hvBase) : null;
            const clearInCb = hvBaseEsc
                ? (new RegExp("clearInterval\\s*\\(\\s*(?:this\\s*\\.\\s*)?" + hvBaseEsc + "\\s*\\)").test(cb) ||
                   (/\b(?:this|self)\s*\.\s*stop\s*\(/.test(cb) && fileHasStopClear))
                : false;
            let lifecycle = clearInCb;
            if (!lifecycle && hvBaseEsc) {
                /* member-qualified clears count: clearInterval(state.drawTimer),
                 * clearInterval(this.active.timer), clearInterval(id)… */
                lifecycle = new RegExp(
                    "clearInterval\\s*\\(\\s*(?:[A-Za-z_$][\\w$.]*\\s*\\.\\s*)?" + hvBaseEsc + "\\s*\\)"
                ).test(view);
            }

            const ceil = hasAttemptCeiling(cb, view, fileHasStopClear) || hasTimeCeiling(cb, view, fileHasStopClear);
            let guard = hasGuard(cb);

            /* feature-session rule: the site is armed inside a start()/
             * arm() method AND the same file's stop()/destroy() clears the
             * holding variable — the user-toggled driver idiom (Yandex
             * slideshow, IG scroll driver): the interval exists only for
             * the duration of an explicitly-started session. */
            if (!guard && hv) {
                /* WO-01 round-1 (2-a F26): reuse the outer hvBase — the inner
                 * redeclaration shadowed it with an identically-computed value. */
                const hvClearRe = new RegExp(
                    "clearInterval\\s*\\(\\s*(?:this\\s*\\.\\s*)?" + escapeRe(hvBase) + "\\s*\\)"
                );
                const startRe = /(?:^|[^\w$])(?:start|arm)\s*\(\s*\)\s*\{/g;
                let sm;
                while ((sm = startRe.exec(view)) !== null) {
                    const sp = braceSpan(view, sm.index + sm[0].length - 1);
                    if (!sp) continue;
                    if (m.index > sp[0] && m.index < sp[1]) {
                        /* site is inside a start/arm method — does a stop/
                         * destroy method clear the timer? */
                        const stopRe = /(?:^|[^\w$])(?:stop|destroy|shutdown|teardown)\s*\(\s*\)\s*\{/g;
                        let om;
                        while ((om = stopRe.exec(view)) !== null) {
                            const sp2 = braceSpan(view, om.index + om[0].length - 1);
                            if (sp2 && hvClearRe.test(view.slice(sp2[0], sp2[1] + 1))) { guard = true; break; }
                        }
                        break;
                    }
                }
            }

            /* normalized call text for ledger match */
            const callText = view.slice(m.index, m.index + 100).replace(/\s+/g, " ").trim().slice(0, 60);

            if (ceil) { stats.retryBounded++; continue; }
            if (guard && lifecycle) { stats.serviceGuarded++; continue; }

            /* whitespace-insensitive prefix ledger match: the normalized
             * site text (40 collapsed chars) must start with the entry's
             * first ~20 non-whitespace characters */
            const norm = (s) => s.replace(/\s+/g, "");
            const entry = ADJUDICATED_PAGE_LIFETIME.find(
                (e) => e.file === rel && norm(callText).startsWith(norm(e.callText).slice(0, 20))
            );
            if (entry) { stats.ledgered++; seenLedger.add(ledgerKey(entry)); continue; }

            problems.push(
                `${rel}:${line}: UNBOUNDED interval \`${callText}…\` — no ceiling (counter+bound+clear), no guard+lifecycle pair (GUP B.1: bounded polling; add an attempt/idle ceiling or a visibility/activity gate plus a proven clearInterval path, or ledger the page-lifetime watcher)`
            );
        }
    }

    /* WO-01 round-3 (3-c F05): setTimeout SELF-RE-ARM coverage — the
     * setInterval-only instrument could not see the body-wait class (a
     * setTimeout(main, 50) whose referenced body re-arms itself is an
     * interval wearing a different hat; three unceilinged sites shipped
     * through a CERTIFIED gate — Filester bootstrap, Yandex main, WCP init,
     * all closed this round with 10 s stand-down ceilings). For every
     * setTimeout(<identifier>, ms) site, resolve the referenced body (the
     * same one-level machinery the interval scan uses) and if that body
     * re-arms the same name, demand a ceiling: a counter increment plus a
     * numeric/ceiling-const comparison, or a clearTimeout, in the resolved
     * body. The stand-down `return` IS the clear-equivalent here — the
     * loop dies by not re-arming. */
    for (const [rel, abs] of targets) {
        if (!fs.existsSync(abs)) continue;
        const view = codeOnlyCached(abs);
        const starts = lineStartsOf(view);
        const toRe = /(^|[^\w$])setTimeout\s*\(\s*([A-Za-z_$][\w$]*)\s*,/g;
        let tm3;
        while ((tm3 = toRe.exec(view)) !== null) {
            const name = tm3[2];
            const openParen = tm3.index + tm3[0].length - 1 - (tm3[0].length - tm3[0].indexOf("(") - 1);
            const bodies = resolveCallbackBodies(view, openParen);
            const cb = bodies.join("\n");
            if (!cb) continue;
            /* does the resolved body re-arm the same name? (setTimeout(name or
             * window.setTimeout(name) — member-form admitted like 6-a F04) */
            const rearmsRe = new RegExp("(?:^|[^\\w$])setTimeout\\s*\\(\\s*(?:[A-Za-z_$][\\w$.]*\\s*\\.\\s*)?" + escapeRe(name) + "\\s*[,)]");
            const rm = rearmsRe.exec(cb);
            if (!rm) continue;
            stats.selfRearms++;
            const line = lineOf(starts, tm3.index);
            /* WO-01 round-4 (4-c F04): the ceiling proof is SCOPED to the
             * re-arm's basic block (+ everything lexically before it in the
             * body — counter declarations and stand-down returns live there).
             * The old form accepted a counter/compare or clearTimeout
             * ANYWHERE in the resolved body: FLX/Bunkr's document.body
             * bootstraps passed via unrelated debounce clearTimeouts, and
             * PM's fire deferral passed via the pull-budget counter that
             * guards a different branch — vacuous passes on a CERTIFIED
             * gate. The brace walk is reliable on the masked view (string
             * contents are blanked, so braces are structural). */
            const rearmIdx = rm.index;
            /* everything up to AND INCLUDING the re-arm's enclosing block:
             * declarations/stand-downs before it + the block's own statements
             * (an increment before the re-arm inside the block counts); later
             * UNRELATED siblings after the block's closing brace do not. */
            const blockEnd = (() => {
                let depth = 0, k = rearmIdx;
                for (; k < cb.length; k++) {
                    if (cb[k] === "{") depth++;
                    else if (cb[k] === "}") { if (depth === 0) return k + 1; depth--; }
                }
                return cb.length;
            })();
            const scoped = cb.slice(0, Math.max(blockEnd, rearmIdx + 1));
            const inc = scoped.match(COUNTER_INC_RE);
            const ceil = (inc && hasCeilingCompare(scoped)) || /clearTimeout\s*\(/.test(scoped);
            if (ceil) { stats.selfRearmBounded++; continue; }
            /* WO-01 round-4 (4-c F04) admission: state-gated deferral under
             * @noframes — the re-arm fires only while a BROWSER-MANAGED page
             * state holds (!document.body during load / document.hidden while
             * backgrounded). The state resolves by construction in the TOP
             * document (body appears at DOM construction; visibility restores
             * on activation), and @noframes removes the non-HTML-frame class
             * entirely — a frame whose body never appears (the 3-c F05
             * concern) cannot exist. FLX/Bunkr bootstrap waits and PM's
             * visibility deferral are the live members; each ALSO carries its
             * own stand-down/one-in-flight guard at function entry. */
            const noframes = /^\/\/\s*@noframes\b/m.test(fs.readFileSync(abs, "utf8").slice(0, 4000));
            const stateGated = /\bdocument\s*\.\s*(?:body|hidden)\b/.test(scoped);
            if (noframes && stateGated) { stats.selfRearmStateGated++; continue; }
            const callText = view.slice(tm3.index, tm3.index + 100).replace(/\s+/g, " ").trim().slice(0, 60);
            problems.push(
                `${rel}:${line}: UNBOUNDED setTimeout self-re-arm \`${callText}…\` — the referenced body re-arms itself with no ceiling (3-c F05: add an attempt counter + stand-down return, or clearTimeout; the body-wait class must not outlive a non-HTML frame)`
            );
        }
    }

    /* ledger drift: an entry whose site no longer matches fails closed */
    for (const e of ADJUDICATED_PAGE_LIFETIME) {
        if (!seenLedger.has(ledgerKey(e))) {
            problems.push(`stale polling ledger entry: ${e.file} :: ${e.callText} — site not found (remove or update)`);
        }
        if (!e.expiry) {
            problems.push(`adjudication without expiry: ${e.file} :: ${e.callText} — every ledger entry must carry its re-adjudication round (G9 ledger hygiene)`);
        }
        if (e.expiry && roundLt(CURRENT_ROUND, e.expiry) === false) {
            problems.push(`expired polling ledger entry: ${e.file} :: ${e.callText} — expiry ${e.expiry} has passed round ${CURRENT_ROUND} without re-adjudication`);
        }
    }

    return { problems, ...stats };
}

/* CLI: node tools/polling-census.mjs [root] */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    const r = runPollingCensus(root);
    console.log(`polling census: ${r.filesScanned} source files, ${r.sites} setInterval sites — ${r.retryBounded} retry-bounded, ${r.serviceGuarded} service-guarded, ${r.ledgered} ledgered page-lifetime; ${r.selfRearms} setTimeout self-re-arm(s), ${r.selfRearmBounded} ceilinged, ${r.selfRearmStateGated} state-gated+noframes`);
    if (r.problems.length) {
        for (const p of r.problems) console.log(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ every interval is bounded, guarded, or ledgered");
}
