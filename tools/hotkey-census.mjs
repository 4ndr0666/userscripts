#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/hotkey-census.mjs — registration-level hotkey census (Gate D extension)
 * ----------------------------------------------------------------------------
 * Idiom-aware static census of every keyboard-combo registration across the
 * suite (canon/ + modules/), with co-install collision analysis:
 *
 *   • registration sites: addEventListener('keydown', …) on document/window
 *     (global) or any element (scoped), el.onkeydown = …, and the kernel
 *     collision-aware registry Ψ.hotkeys.register('Combo', …) including its
 *     Ψ.hosts.on('domain', …) gating context;
 *   • handler resolution: inline arrows/functions plus named references
 *     (function NAME, NAME = / NAME: / object-literal + class methods,
 *     this.NAME — comma-chain const declarations included);
 *   • combo mining: literal modifier+key tests (incl. (e.key||'').toLowerCase()
 *     and reversed operands), switch/case dispatch, keyCode maps, local key
 *     aliases (const key = e.key.toLowerCase() / describeKey(e)), negative
 *     early-return guards (if (key!=='h' && key!=='H') return → claims H;
 *     if (!e.ctrlKey || !e.altKey) return → requires Ctrl+Alt), config-table
 *     defaults (COMBOS / DEFAULT_SHORTCUTS / cfg.* / CONFIG.* / CFG.* /
 *     DEFAULT_HOTKEY / getHotkey()), and the Alt-contextual ternary idiom
 *     (plain keys on image tabs, Alt keys on SPA hosts);
 *   • classification: fixed | config | table | media (collision classes)
 *     vs scoped | ui-nav | transient | recorder | guard | observer
 *     (structurally multi-tenant — reported, never collision-classed);
 *   • collision gate: same normalized combo + overlapping @match/@include
 *     domains across two scripts in a collision class = FAILURE, unless the
 *     pair is explicitly adjudicated below (and every adjudication must stay
 *     live — stale entries fail closed too).
 *
 * OPSEC/lesson-7 discipline: all mining runs on comment-stripped source via
 * a string-aware lexer — a changelog note or banner string can NEVER
 * self-satisfy this census. Anchor tests target code structure only.
 *
 * Exit codes: 0 = census green, 1 = collision / unresolved site (fail closed).
 * CLI: node tools/hotkey-census.mjs [--report]
 * Library: import { runCensus } from './hotkey-census.mjs'
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ──────────────────────────────────────────────────────────────────────────
 * §1 String-aware lexer — comments blanked (spaces), strings + regex
 * literals preserved as opaque tokens. Same lexical profile the style-audit
 * gate validated in production (kept per-tool on purpose: Gate E is a
 * certified surface and must not be destabilized by a shared refactor).
 * ────────────────────────────────────────────────────────────────────────── */

const REGEX_PRECEDERS = new Set([
    "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", ";", "return",
    "typeof", "in", "of", "new", "delete", "void", "case", "do", "else",
]);

/* Exported for validate.mjs Gate D (kernel TT-immunity scan) — same
 * string-aware lexer discipline the census itself uses (lesson 7). */
export function stripComments(src) {
    const out = src.split("");
    let i = 0;
    const n = src.length;
    let prevSignificant = "";
    while (i < n) {
        const c = src[i];
        const next = src[i + 1];
        if (c === "/" && next === "/") {
            while (i < n && src[i] !== "\n") { out[i] = " "; i++; }
            continue;
        }
        if (c === "/" && next === "*") {
            out[i] = " "; out[i + 1] = " ";
            i += 2;
            while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
                if (src[i] !== "\n") out[i] = " ";
                i++;
            }
            if (i < n) { out[i] = " "; out[i + 1] = " "; i += 2; }
            continue;
        }
        if (c === '"' || c === "'" || c === "`") {
            const quote = c;
            i++;
            while (i < n && src[i] !== quote) {
                if (src[i] === "\\") i++;
                if (quote !== "`" && src[i] === "\n") break;
                i++;
            }
            i++;
            prevSignificant = quote;
            continue;
        }
        if (c === "/" && (prevSignificant === "" || REGEX_PRECEDERS.has(prevSignificant))) {
            i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) break;
                else if (src[i] === "\n") break;
                i++;
            }
            i++;
            prevSignificant = "/re/";
            continue;
        }
        if (!/\s/.test(c)) prevSignificant = c;
        i++;
    }
    return out.join("");
}

/* ──────────────────────────────────────────────────────────────────────────
 * §2 Balanced-delimiter utilities (operate on comment-stripped source)
 * ────────────────────────────────────────────────────────────────────────── */

function skipStrings(src, i) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
        const quote = c;
        i++;
        while (i < src.length && src[i] !== quote) {
            if (src[i] === "\\") i++;
            i++;
        }
        return i + 1;
    }
    return -1;
}

/** Skip a regex literal starting at i (the opening slash). Returns the index
 *  just past the closing slash (+flags). Character classes may contain
 *  quotes and slashes — they are opaque inside [...]. */
function skipRegex(src, i) {
    i++; // past the opening /
    let inClass = false;
    while (i < src.length) {
        const c = src[i];
        if (c === "\\") { i += 2; continue; }
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass) break;
        else if (c === "\n") break; // not a regex after all — bail defensively
        i++;
    }
    i++;
    while (i < src.length && /[a-z]/i.test(src[i])) i++; // flags
    return i;
}

/** Lexically-aware balanced-region extraction: strings, template literals,
 *  and regex literals are structurally neutral (GUP 5.3.0 discipline — only
 *  syntactically active code may modify brace depth). */
function balancedRegion(src, openIdx, prevSignificant = "") {
    const open = src[openIdx];
    const close = open === "(" ? ")" : open === "{" ? "}" : open === "[" ? "]" : null;
    if (!close) return null;
    let depth = 0;
    let i = openIdx;
    let prev = prevSignificant;
    while (i < src.length) {
        const c = src[i];
        if (c === '"' || c === "'" || c === "`") {
            i = skipStrings(src, i);
            prev = c;
            continue;
        }
        if (c === "/" && (prev === "" || REGEX_PRECEDERS.has(prev))) {
            i = skipRegex(src, i);
            prev = "/re/";
            continue;
        }
        if (c === open) depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) return { start: openIdx, end: i, body: src.slice(openIdx + 1, i) };
        }
        if (!/\s/.test(c)) prev = c;
        i++;
    }
    return null;
}

function matchingParen(src, openIdx) {
    const r = balancedRegion(src, openIdx);
    return r ? r.end : -1;
}

/* ──────────────────────────────────────────────────────────────────────────
 * §3 Script inventory — files, names, domains
 * ────────────────────────────────────────────────────────────────────────── */

function walk(dir, out = []) {
    if (!fs.existsSync(dir)) return out;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory()) walk(p, out);
        else if (p.endsWith(".user.js") || p.endsWith("/body.js")) out.push(p);
    }
    return out;
}

function parseHeader(src) {
    const m = src.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
    const header = {};
    if (!m) return header;
    for (const line of m[1].split("\n")) {
        const mm = line.match(/\/\/\s*@(\w[\w-]*)\s+(.*)$/);
        if (!mm) continue;
        const [, key, val] = mm;
        if (header[key] === undefined) header[key] = val.trim();
        else if (Array.isArray(header[key])) header[key].push(val.trim());
        else header[key] = [header[key], val.trim()];
    }
    return header;
}

/** Convert @match/@include patterns into a domain-ish set.
 *  A catch-all match pattern (star-scheme, star-host) or include "*" is
 *  treated as universal (overlaps every script). */
function domainsFromHeader(header) {
    const domains = new Set();
    let universal = false;
    const pats = [
        ...(header.match ? [].concat(header.match) : []),
        ...(header.include ? [].concat(header.include) : []),
    ];
    for (const raw of pats) {
        const pat = String(raw).trim();
        if (pat === "*" || /^\w+:\/\/\*$/.test(pat) || /^\*:\/\/\*\/\*$/.test(pat) || /^https?:\/\/*$/.test(pat)) {
            universal = true;
            continue;
        }
        if (pat.startsWith("/") && pat.lastIndexOf("/") > 0) {
            const frags = pat.match(/[a-z]{4,}/g) || [];
            for (const f of frags) if (!["https", "http", "www"].includes(f)) domains.add(f);
            continue;
        }
        const hostish = pat.replace(/^\w+:\/\//, "").replace(/^\/\^?/, "");
        const host = hostish.split("/")[0].replace(/^\*\./, "").replace(/\*$/, "");
        if (host && host !== "*") domains.add(host.toLowerCase());
        else if (hostish.includes("*")) universal = true;
    }
    return { universal, domains };
}

/* ──────────────────────────────────────────────────────────────────────────
 * §4 Registration-site scanner + handler resolution
 * ────────────────────────────────────────────────────────────────────────── */

const GLOBAL_RECEIVERS = new Set(["document", "window", "_window", "globalThis", ""]);

function findSites(code, lineOfIndex) {
    const sites = [];
    const siteRe = /(?:((?:[A-Za-z_$][\w$]*)(?:(?:\s*\.\s*[A-Za-z_$][\w$]*)|(?:\s*\([^()]*\)))*)\s*\.\s*)?addEventListener\s*\(\s*(['"])keydown\2/g;
    let m;
    while ((m = siteRe.exec(code))) {
        const receiver = (m[1] || "").trim();
        sites.push({
            index: m.index,
            kind: "addEventListener",
            receiver,
            receiverIsGlobal: GLOBAL_RECEIVERS.has(receiver),
            handlerStart: m.index + m[0].length,
            line: lineOfIndex(m.index),
        });
    }
    const propRe = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\.\s*onkeydown\s*=/g;
    while ((m = propRe.exec(code))) {
        sites.push({
            index: m.index,
            kind: "onkeydown-prop",
            receiver: m[1],
            receiverIsGlobal: false,
            handlerStart: propRe.lastIndex,
            line: lineOfIndex(m.index),
        });
    }
    return sites.sort((a, b) => a.index - b.index);
}

function extractHandlerToken(src, start) {
    let i = start;
    while (i < src.length && /[\s,]/.test(src[i])) i++;
    const rest = src.slice(i);
    if (rest.startsWith("function") || rest.startsWith("async function")) {
        return { inline: true, body: extractInlineFunction(src, i) };
    }
    if (rest[0] === "(") {
        const closeParen = matchingParen(src, i);
        if (src.slice(closeParen + 1).match(/^\s*=>/)) return { inline: true, body: extractArrowWithParams(src, i) };
        return { inline: false, ref: null, unparseable: true, offset: i };
    }
    const single = rest.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/);
    if (single) return { inline: true, body: extractArrowSingle(src, i) };
    const refMatch = rest.match(/^(?:this\s*\.)?[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*/);
    if (refMatch) return { inline: false, ref: refMatch[0].replace(/\s+/g, "") };
    return { inline: false, ref: null, unparseable: true, offset: i };
}

function extractInlineFunction(src, i) {
    const paren = src.slice(i).match(/^(?:async\s+)?function\s*\*?\s*[A-Za-z_$][\w$]*\s*\(/);
    const parenAt = i + (paren ? paren[0].length - 1 : src.slice(i).indexOf("("));
    let params = "";
    if (parenAt > i) {
        const closeParen = matchingParen(src, parenAt);
        if (closeParen < 0) return null;
        params = src.slice(parenAt + 1, closeParen);
    }
    const brace = src.indexOf("{", i);
    if (brace === -1) return null;
    const region = balancedRegion(src, brace);
    if (!region) return null;
    return { params, body: region.body, bodyStart: region.start + 1 };
}

function extractArrowWithParams(src, i) {
    const closeParen = matchingParen(src, i);
    const params = src.slice(i + 1, closeParen);
    const arrow = src.slice(closeParen + 1).match(/^\s*=>/);
    if (!arrow) return null;
    let j = closeParen + 1 + arrow[0].length;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] === "{") {
        const region = balancedRegion(src, j);
        if (!region) return null;
        return { params, body: region.body, bodyStart: region.start + 1 };
    }
    return { params, body: captureExpression(src, j), bodyStart: j };
}

function extractArrowSingle(src, i) {
    const m = src.slice(i).match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/);
    if (!m) return null;
    const params = m[1];
    let j = i + m[0].length;
    while (j < src.length && /\s/.test(src[j])) j++;
    if (src[j] === "{") {
        const region = balancedRegion(src, j);
        if (!region) return null;
        return { params, body: region.body, bodyStart: region.start + 1 };
    }
    return { params, body: captureExpression(src, j), bodyStart: j };
}

function captureExpression(src, j) {
    let depth = 0;
    let k = j;
    while (k < src.length) {
        const skipped = skipStrings(src, k);
        if (skipped !== -1 && skipped > k) { k = skipped; continue; }
        const c = src[k];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") {
            if (depth === 0) break;
            depth--;
        } else if ((c === "," || c === ";") && depth === 0) break;
        k++;
    }
    return src.slice(j, k);
}

function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve a handler reference to { params, body } — try every definition
 *  idiom (function decls, assignments incl. comma chains, object-literal
 *  props, class methods, this.NAME) and every candidate position. */
function resolveReference(code, ref) {
    if (!ref) return null;
    const name = ref.includes(".") ? ref.split(".").pop() : ref;
    const candidates = [];
    const seen = new Set();
    const push = (idx, kind) => {
        if (idx >= 0 && !seen.has(idx)) { seen.add(idx); candidates.push({ idx, kind }); }
    };

    const decl = new RegExp(`(?:async\\s+)?function\\s+${escapeRe(name)}\\s*\\(`, "g");
    let m;
    while ((m = decl.exec(code))) push(m.index + m[0].indexOf(name), "function");

    // assignments: NAME = (preceded by a boundary that is NOT a property access)
    const assign = new RegExp(`(?:^|[^\\w$.])${escapeRe(name)}\\s*=\\s*`, "g");
    while ((m = assign.exec(code))) push(m.index + m[0].indexOf(name), "assign");

    // object-literal property / method shorthand / class method:
    const prop = new RegExp(`(?:^|[{,;]\\s*|\\n\\s*)${escapeRe(name)}\\s*[:(]`, "g");
    while ((m = prop.exec(code))) push(m.index + m[0].indexOf(name), "prop");

    for (const cand of candidates) {
        const parsed = parseDefinitionAt(code, cand.idx, cand.kind);
        if (parsed) return parsed;
    }
    return null;
}

function parseDefinitionAt(code, idx, kind) {
    // advance past the name token
    let i = idx;
    const nameLen = code.slice(i).match(/^[A-Za-z_$][\w$]*/)[0].length;
    i += nameLen;
    while (i < code.length && /\s/.test(code[i])) i++;
    if (kind === "function") {
        // function NAME (params) { body }
        if (code[i] !== "(") return null;
        return parseParamsAndBody(code, i);
    }
    if (code[i] === "=") {
        i++;
        while (i < code.length && /\s/.test(code[i])) i++;
        return parseHandlerValue(code, i);
    }
    if (code[i] === ":") {
        i++;
        while (i < code.length && /\s/.test(code[i])) i++;
        return parseHandlerValue(code, i);
    }
    if (code[i] === "(") {
        return parseParamsAndBody(code, i);
    }
    return null;
}

/** At a "(" — parse (params) => {body} | (params) {body} (method) | (params) expr */
function parseParamsAndBody(code, i) {
    const closeParen = matchingParen(code, i);
    if (closeParen < 0) return null;
    const params = code.slice(i + 1, closeParen);
    const after = code.slice(closeParen + 1).match(/^\s*(=>|\{)/);
    if (!after) return null;
    if (after[0].includes("{")) {
        // method-style: NAME(params) { body } — the brace is already consumed
        const braceAt = closeParen + 1 + after[0].indexOf("{");
        const region = balancedRegion(code, braceAt);
        if (!region) return null;
        return { params, body: region.body, bodyStart: region.start + 1 };
    }
    // arrow: NAME(params) => { body } | expression
    let j = closeParen + 1 + after[0].length;
    while (j < code.length && /\s/.test(code[j])) j++;
    if (code[j] === "{") {
        const region = balancedRegion(code, j);
        if (!region) return null;
        return { params, body: region.body, bodyStart: region.start + 1 };
    }
    return { params, body: captureExpression(code, j), bodyStart: j };
}

/** RHS of NAME = / NAME : — arrow (paren/single), function, or IIFE-ish call */
function parseHandlerValue(code, i) {
    let j = i;
    const asyncPre = code.slice(j).match(/^async\s+/);
    if (asyncPre) j += asyncPre[0].length;
    if (code[j] === "(") {
        const closeParen = matchingParen(code, j);
        const arrow = code.slice(closeParen + 1).match(/^\s*=>/);
        if (arrow) return parseParamsAndBody(code, j);
        return null; // a call (e.g. this.x.bind(this)) — not a definition
    }
    if (code.slice(j).startsWith("function")) {
        return extractInlineFunction(code, j);
    }
    const single = code.slice(j).match(/^([A-Za-z_$][\w$]*)\s*=>/);
    if (single) return extractArrowSingle(code, j);
    return null;
}

/* ──────────────────────────────────────────────────────────────────────────
/* ──────────────────────────────────────────────────────────────────────────
 * §5 Combo mining + §6 classification
 *
 * The mining model is PER-CLAIM: every key literal a handler tests becomes a
 * claim; every claim is analyzed for (a) its enclosing condition's positive
 * modifiers, (b) handler-level guard-required modifiers (negative early
 * returns), (c) the nearest preceding own-state gate (`if (!STATE) return`)
 * which classifies the claim as fixed / ui-gated / media-gated.
 * ────────────────────────────────────────────────────────────────────────── */

const KEYCODE_MAP = (() => {
    const map = {};
    const named = { 8: "Backspace", 9: "Tab", 13: "Enter", 16: "Shift", 17: "Ctrl", 18: "Alt", 19: "Pause", 20: "CapsLock", 27: "Escape", 32: "Space", 33: "PageUp", 34: "PageDown", 35: "End", 36: "Home", 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 45: "Insert", 46: "Delete" };
    for (const [k, v] of Object.entries(named)) map[k] = v;
    for (let d = 48; d <= 57; d++) map[d] = String.fromCharCode(d);
    for (let a = 65; a <= 90; a++) map[a] = String.fromCharCode(a);
    for (let f = 112; f <= 123; f++) map[f] = `F${f - 111}`;
    return map;
})();

const GESTURE_KEYS = new Set(["Escape", "Enter", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Backspace", "Delete", "Insert", "Space"]);
const TYPEOF_LITERALS = new Set(["string", "number", "boolean", "function", "undefined", "object", "symbol", "bigint"]);
const MOD_PROPS = { altKey: "Alt", ctrlKey: "Ctrl", controlKey: "Ctrl", metaKey: "Meta", shiftKey: "Shift" };
const UI_HINT = /popup|shown|visible|isOpen|open|menu|modal|hud|panel|overlay|browser|dialog|zapper|sniff/i;
const MEDIA_HINT = /video|activeVideo|candidate|target|player|media/i;

function normalizeCombo(mods, key) {
    const set = [...new Set(mods)].sort().join("+");
    const k = String(key).toUpperCase();
    return set ? `${set}+${k}` : k;
}

function canonicalComboString(str) {
    const parts = String(str).split("+").map((p) => p.trim()).filter(Boolean);
    const mods = [];
    let key = "";
    for (const p of parts) {
        const up = p.toUpperCase();
        if (up === "CTRL" || up === "CONTROL" || up === "^") mods.push("Ctrl");
        else if (up === "ALT" || up === "!") mods.push("Alt");
        else if (up === "SHIFT" || up === "+") mods.push("Shift");
        else if (up === "META" || up === "CMD" || up === "#" || up === "SUPER") mods.push("Meta");
        else key = p.replace(/^(Key|Digit)/, "");
    }
    if (!key) return null;
    return normalizeCombo(mods, key.replace(/^!/, ""));
}

function isModifierToken(lit) {
    // chord-state tokens from describeKey-style switches: '+Shift', '!Alt', 'Control', …
    if (["Shift", "Ctrl", "Alt", "Meta", "Control", "ContextMenu"].includes(lit)) return true;
    return /^[!^+#]/.test(lit);
}

/** Enumerate every if/else-if condition span in the body. */
function conditionSpans(body) {
    const spans = [];
    const re = /\bif\s*\(/g;
    let m;
    while ((m = re.exec(body))) {
        const open = m.index + m[0].length - 1;
        const close = matchingParen(body, open);
        if (close < 0) continue;
        spans.push({ start: open + 1, end: close });
    }
    return spans;
}

/** Every if-condition controlling idx — both a direct hit inside the
 *  condition parens AND lexical containment inside the if's block:
 *  `if (e.altKey) { … if (k === 's') … }` claims Alt+S. */
function enclosingConditions(body, idx) {
    const out = [];
    const re = /\bif\s*\(/g;
    let m;
    while ((m = re.exec(body))) {
        const open = m.index + m[0].length - 1;
        const close = matchingParen(body, open);
        if (close < 0) continue;
        if (idx >= open + 1 && idx <= close) out.push({ start: open + 1, end: close });
        // block form: if (...) { … }
        const after = body.slice(close + 1).match(/^\s*\{/);
        if (after) {
            const braceAt = close + 1 + after[0].indexOf("{");
            const region = balancedRegion(body, braceAt);
            if (region && idx >= region.start && idx <= region.end) {
                out.push({ start: open + 1, end: close });
            }
        }
    }
    return out;
}

/** All key literals a handler claims (positive tests + negative early-returns). */
function collectKeyClaims(body, paramRe, keyAliases) {
    const claims = [];
    const aliasSrc = [paramRe, ...keyAliases.map((a) => escapeRe(a))].join("|");
    const keyAccess = String.raw`(?:${paramRe}\s*\.\s*(?:key|code)(?:\s*\|\|\s*['"]{2})?(?:\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?|\(\s*(?:${paramRe})\s*\.\s*key(?:\s*\|\|\s*['"]{2})?\s*\)\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))`;

    const patterns = [
        { re: new RegExp(String.raw`${keyAccess}\s*(?<op>===?|!==?)\s*(['"])(?<lit>[^'"]+)\2`, "g") },
        { re: new RegExp(String.raw`(['"])(?<lit>[^'"]+)\1\s*(?<op>===?|!==?)\s*${keyAccess}`, "g") },
        { re: new RegExp(String.raw`\b(?<alias>${aliasSrc})\s*(?<op>===?|!==?)\s*(['"])(?<lit>[^'"]+)\3`, "g") },
        { re: new RegExp(String.raw`(?:${paramRe})\s*\.\s*keyCode\s*(?<op>===?|!==?)\s*(?<lit>\d+)`, "g"), kc: true },
    ];
    for (const p of patterns) {
        let m;
        while ((m = p.re.exec(body))) {
            let lit = m.groups.lit;
            if (p.kc) {
                const code = KEYCODE_MAP[Number(lit)];
                if (!code) continue;
                lit = code;
            }
            if (TYPEOF_LITERALS.has(lit)) continue;
            if (isModifierToken(lit)) continue;
            if (lit === " ") continue; // matcher normalization, not a claim
            const negated = m.groups.op.startsWith("!") || isNegated(body, m.index);
            if (lit.length === 1) lit = lit.toUpperCase();
            claims.push({ key: lit.replace(/^(Key|Digit)/, ""), idx: m.index, negated });
        }
    }

    // switch dispatch on bare key/code/alias
    const switchRe = new RegExp(String.raw`switch\s*\(\s*(?:(?:${paramRe})\s*\.\s*(?:key|code)(?:\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?|(?:${aliasSrc}))\s*\)`, "g");
    let sm;
    while ((sm = switchRe.exec(body))) {
        const open = body.indexOf("{", sm.index + sm[0].length);
        const region = balancedRegion(body, open);
        if (!region) continue;
        const caseRe = /case\s+(['"])([^'"]+)\1\s*:/g;
        let cm;
        while ((cm = caseRe.exec(region.body))) {
            let lit = cm[2];
            if (TYPEOF_LITERALS.has(lit)) continue;
            if (isModifierToken(lit)) continue;
            if (lit === " ") continue;
            if (lit.length === 1) lit = lit.toUpperCase();
            claims.push({ key: lit.replace(/^(Key|Digit)/, ""), idx: sm.index + open + cm.index, negated: false, viaSwitch: true });
        }
    }
    return claims;
}

/** Early-return gates: `if (COND) return` — partition the body's claims. */
function collectGates(body, paramRe) {
    const gates = [];
    const re = /\bif\s*\(/g;
    let m;
    while ((m = re.exec(body))) {
        const open = m.index + m[0].length - 1;
        const close = matchingParen(body, open);
        if (close < 0) continue;
        const cond = body.slice(open + 1, close);
        if (!/^\s*return\b/.test(body.slice(close + 1, close + 20))) continue; // single-statement return gate only
        const testsEvent = new RegExp(String.raw`\b(?:${paramRe})\s*\.\s*(?:key|code|keyCode|target|repeat|isComposing|ctrlKey|altKey|metaKey|shiftKey)\b`).test(cond);
        // state var tested: !NAME / NAME alone (NAME not an event alias)
        const stateVar = cond.match(new RegExp(String.raw`!?\b([a-z_$][\w$]*)\b(?!\s*\()` , "g")) || [];
        const locals = [...cond.matchAll(new RegExp(String.raw`(!?)\b([A-Za-z_$][\w$]*)\b`, "g"))]
            .map((x) => ({ neg: x[1] === "!", name: x[2], idx: x.index }))
            // predicate calls — isEditableTarget(…) — are event hygiene, not state
            .filter((x) => cond[x.idx + x.name.length] !== "(")
            // property accesses — .target / .tagName — are not standalone vars
            .filter((x) => x.idx === 0 || cond[x.idx - 1] !== ".")
            .filter((x) => !new RegExp(String.raw`^(?:${paramRe})$`).test(x.name))
            .filter((x) => !["typeof", "null", "true", "false", "length", "repeat", "window", "document", "location"].includes(x.name));
        gates.push({ idx: m.index, close, cond, testsEvent, locals });
    }
    return gates;
}

/** Classify a gate: 'ui' | 'media' | 'settings' | 'event' | null (unclassified). */
function gateKind(gate, body, paramRe) {
    // typing-context / DOM-target hygiene guards are event-shaped, not state
    if (/(?:isContentEditable|tagName|\.closest\()/.test(gate.cond)) return "event";
    if (gate.testsEvent && gate.locals.length === 0) return "event";
    for (const l of gate.locals) {
        // locals derived directly from the event object are event-shaped
        const evInit = body.match(new RegExp(String.raw`(?:const|let|var)\s+${escapeRe(l.name)}\s*=\s*(?:${paramRe})\s*\.`));
        if (evInit) return "event";
        // look the var's initializer up
        const init = body.match(new RegExp(String.raw`(?:const|let|var)\s+${escapeRe(l.name)}\s*=\s*([^;\n]{0,80})`));
        const haystack = `${l.name} ${init ? init[1] : ""}`;
        if (MEDIA_HINT.test(haystack)) return "media";
        if (UI_HINT.test(haystack)) return "ui";
        if (/settings|cfg|store|prefs/i.test(haystack)) return "settings";
    }
    return null;
}

/** Guard modifiers from negative early returns: if (!e.ctrlKey || !e.altKey) return → required. */
function collectGuardMods(body, paramRe) {
    const required = new Set();
    const re = new RegExp(String.raw`\bif\s*\(`, "g");
    let m;
    while ((m = re.exec(body))) {
        const open = m.index + m[0].length - 1;
        const close = matchingParen(body, open);
        if (close < 0) continue;
        if (!/^\s*return\b/.test(body.slice(close + 1, close + 20))) continue;
        const cond = body.slice(open + 1, close);
        // whole-condition modifier polarity — only when ALL modifier tests are negated
        const modOcc = [...cond.matchAll(new RegExp(String.raw`(!?)\s*\b(?:${paramRe})\s*\.\s*(altKey|ctrlKey|controlKey|metaKey|shiftKey)\b`, "g"))];
        if (modOcc.length && modOcc.every((x) => x[1] === "!")) {
            for (const x of modOcc) required.add(MOD_PROPS[x[2]]);
        }
    }
    return required;
}

/** Mine combo registrations from a resolved handler body. */
function mineCombos(params, body, fileCtx) {
    const combos = [];
    if (!body) return combos;

    const aliases = eventAliases(params, body);
    if (!aliases.length) return combos;
    const paramRe = aliases.join("|");

    // local key aliases: const key = e.key[.toLowerCase()] | describeKey(e)
    const keyAliases = [];
    const aliasRe = new RegExp(String.raw`(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:describeKey\s*\(\s*(?:${paramRe})\s*\)|(?:${paramRe})\s*\.\s*key(?:\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?(?:\s*\|\|\s*['"]{2})?)`, "g");
    let am;
    while ((am = aliasRe.exec(body))) keyAliases.push(am[1]);

    const guardRequired = collectGuardMods(body, paramRe);
    const claims = collectKeyClaims(body, paramRe, keyAliases);
    const gates = collectGates(body, paramRe);

    // dynamic shortcut matchers (split("+") + shortcut tables) are recorder
    // machinery, not fixed claims — drop claims sitting near that idiom
    const splitIdxs = [];
    const splitRe = /\.split\s*\(\s*(['"])\+\1\s*\)/g;
    let sp;
    while ((sp = splitRe.exec(body))) splitIdxs.push(sp.index);
    const nearMatcher = (idx) => splitIdxs.some((s) => Math.abs(s - idx) < 420);

    // handler-level Alt-contextual gate (GPD idiom): a ternary routes every
    // letter claim through two contexts (plain + Alt)
    const altCtxHandler = /plainKeysAllowed\s*\?\s*[A-Za-z_$][\w$]*\s*\.\s*altKey\s*:/.test(body);

    for (const lit of claims) {
        if (process.env.CENSUS_DEBUG) console.error("CLAIM", JSON.stringify(lit), "ctx:", JSON.stringify(body.slice(Math.max(0, lit.idx - 90), lit.idx + 25)));
        if (nearMatcher(lit.idx)) continue;
        // negative claims only count when they gate an early return
        if (lit.negated) {
            const after = body.slice(lit.idx, lit.idx + 200);
            if (!/\breturn\b/.test(after.slice(0, after.indexOf("\n") + 1 || 120))) continue;
        }
        // nearest preceding own-state gate decides the claim's class
        let gateCls = null;
        for (const g of gates) {
            if (g.idx < lit.idx) {
                const kind = gateKind(g, body, paramRe);
                if (kind === "event" || kind === null) continue;
                gateCls = kind; // settings gates keep the claim fixed (defaults ship on)
                if (kind === "ui" || kind === "media") break;
            }
        }
        const claimClass = gateCls === "ui" ? "ui-gated" : gateCls === "media" ? "media-gated" : "fixed";

        // positive modifiers across ALL enclosing if-conditions (nested accumulation)
        const mods = new Set(guardRequired);
        for (const cond of enclosingConditions(body, lit.idx)) {
            const condSrc = body.slice(cond.start, cond.end);
            const modOcc = [...condSrc.matchAll(new RegExp(String.raw`(?<!!)\b(?:${paramRe})\s*\.\s*(altKey|ctrlKey|controlKey|metaKey|shiftKey)\b`, "g"))];
            for (const x of modOcc) mods.add(MOD_PROPS[x[1]]);
        }

        if (altCtxHandler && lit.key.length === 1) {
            // plain variants only fire on image-contentType tabs (document.contentType
            // image/*) — a structurally videoless document, so they can never meet a
            // media-gated claim in activation
            combos.push({ combo: normalizeCombo([...mods], lit.key), key: lit.key, cls: "image-tab", note: "alt-contextual (plain on image tabs)" });
            combos.push({ combo: normalizeCombo([...new Set([...mods, "Alt"])], lit.key), key: lit.key, cls: claimClass, note: "alt-contextual (Alt on SPA hosts)" });
            continue;
        }
        combos.push({ combo: normalizeCombo([...mods], lit.key), key: lit.key, cls: claimClass });
    }

    // combo-table lookups inside the body (e.g. COMBOS[combo])
    const tableRe = /(['"])((?:Ctrl|Alt|Shift|Meta|Control)[a-zA-Z+]*\+[A-Za-z][\w]*)\1\s*:/g;
    let tm;
    while ((tm = tableRe.exec(body))) {
        const combo = canonicalComboString(tm[2]);
        if (combo) combos.push({ combo, key: tm[2], cls: "fixed", note: "table" });
    }

    // isShortcutPressed(e, "name") — resolve via DEFAULT_SHORTCUTS-style tables
    const scpRe = new RegExp(String.raw`isShortcutPressed\s*\(\s*(?:${paramRe})\s*,\s*(['"])([\w.]+)\1\s*\)`, "g");
    let scm;
    while ((scm = scpRe.exec(body))) {
        const defRe = new RegExp(`${scm[2]}\\s*:\\s*\\{[^}]*keys\\s*:\\s*(['"])([^'"]+)\\1`);
        const dm = defRe.exec(fileCtx.code || "");
        if (dm) {
            const combo = canonicalComboString(dm[2]);
            if (combo) combos.push({ combo, key: dm[2], cls: "fixed", note: `config:${scm[2]}` });
        } else {
            combos.push({ combo: null, key: scm[2], cls: "fixed", note: `unresolved-config:${scm[2]}` });
        }
    }

    // config-ref keys: key === cfg.NAME / CONFIG.NAME (either operand side, aliases included)
    const aliasSrc = [paramRe, ...keyAliases.map((a) => escapeRe(a))].join("|");
    const cfgRes = [];
        const cfgRe = new RegExp(String.raw`(?:\b(?:${paramRe})\b\s*\.\s*(?:key|code)\s*(?:\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?|\b(?:${keyAliases.length ? keyAliases.map(escapeRe).join("|") : "$^"})\b\s*(?:\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?)\s*(?<op>===?|!==?)\s*(?<ref>[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)`, "g");
    let cm;
    while ((cm = cfgRe.exec(body))) cfgRes.push({ ref: cm.groups.ref, idx: cm.index });
    const cfgRev = new RegExp(String.raw`(?<ref>[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+)\s*(?<op>===?|!==?)\s*\b(?:${aliasSrc})\b(?:\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?`, "g");
    while ((cm = cfgRev.exec(body))) cfgRes.push({ ref: cm.groups.ref, idx: cm.index });
    for (const cr of cfgRes) {
        const leaf = cr.ref.split(".").pop();
        if (["length", "key", "code", "keyCode", "keys"].includes(leaf)) continue;
        const defRe = new RegExp(String.raw`\b${escapeRe(leaf)}\s*[:=]\s*(['"])([^'"]+)\1`);
        const dm = defRe.exec(fileCtx.code || "");
        if (dm) {
            const combo = canonicalComboString(dm[2]);
            if (combo && !combos.some((c) => c.combo === combo)) {
                // attach the enclosing condition's modifiers (e.g. e.altKey && key === CFG.HOTKEY)
                const mods = new Set();
                for (const cond of enclosingConditions(body, cr.idx)) {
                    const condSrc = body.slice(cond.start, cond.end);
                    const modOcc = [...condSrc.matchAll(new RegExp(String.raw`(?<!!)\b(?:${paramRe})\s*\.\s*(altKey|ctrlKey|controlKey|metaKey|shiftKey)\b`, "g"))];
                    for (const x of modOcc) mods.add(MOD_PROPS[x[1]]);
                }
                const full = normalizeCombo([...mods], combo.split("+").pop());
                combos.push({ combo: mods.size ? full : combo, key: dm[2], cls: "fixed", note: `config:${cr.ref}` });
            }
        } else if (/^(?:cfg|CFG|CONFIG|settings|DEFAULT)/i.test(cr.ref.split(".")[0])) {
            combos.push({ combo: null, key: leaf, cls: "fixed", note: `unresolved-config:${cr.ref}` });
        }
    }

    // getHotkey() idiom → DEFAULT_HOTKEY
    if (/getHotkey\s*\(\s*\)/.test(body)) {
        const dm = (fileCtx.code || "").match(/DEFAULT_HOTKEY\s*=\s*(['"])([^'"]+)\1/);
        if (dm) {
            const combo = canonicalComboString(dm[2]);
            if (combo) combos.push({ combo, key: dm[2], cls: "fixed", note: "config:DEFAULT_HOTKEY" });
        }
    }

    // dedupe identical (combo, cls, note)
    const seen = new Set();
    return combos.filter((c) => {
        const k = `${c.combo}|${c.cls}|${c.note}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

function isNegated(body, idx) {
    let i = idx - 1;
    while (i >= 0 && /\s/.test(body[i])) i--;
    let bangs = 0;
    while (i >= 0 && body[i] === "!") { bangs++; i--; }
    return bangs % 2 === 1;
}

function eventAliases(params, body) {
    const candidates = String(params || "").split(",").map((s) => s.trim().split(/[=:]/)[0].trim()).filter(Boolean);
    if (candidates.length) return [candidates[0]];
    const m = String(body || "").match(/\b([a-z])\s*\.\s*(?:key|altKey|ctrlKey|metaKey|shiftKey|code|keyCode|target|preventDefault)\b/);
    return m ? [m[1]] : [];
}

/** Structural classification of a resolved handler (handler-level classes;
 *  claim-level gating is computed inside mineCombos). */
function classifyHandler(params, body, receiverIsGlobal, fileCtx) {
    const b = body || "";
    const hasKeySemantics = /\b(?:key|code|keyCode)\b/.test(b);
    const stops = /stopPropagation|stopImmediatePropagation/.test(b);
    const prevents = /preventDefault/.test(b);
    const removesSelf = /removeEventListener/.test(b);
    const keyTests = allKeyLiterals(b);
    const gestureOnly = keyTests.length > 0 && keyTests.every((k) => GESTURE_KEYS.has(k));

    if (!hasKeySemantics && !prevents && !stops) return { cls: "observer", notes: ["no key semantics — passive engagement listener"] };

    // recorder idiom: keys = n.join("+") after modifier pushes
    if (/\.keys\s*=/.test(b) && /\.join\s*\(\s*(['"])\+\1\s*\)/.test(b) && /push\s*\(\s*(['"])(Ctrl|Alt|Shift|Meta)\1/.test(b)) {
        return { cls: "recorder", notes: ["capture-all shortcut recorder (user-defined combos)"] };
    }

    // table-driven dispatch (COMBOS[comboOf(e)]) claims via its table
    if (/comboOf\s*\(|COMBOS\s*\[/.test(b)) {
        return { cls: "fixed", notes: ["table-driven dispatch (combo table)"] };
    }

    // guard / shield: no key literal claim, only event shaping
    if (keyTests.length === 0 && stops) {
        return { cls: "guard", notes: ["stopPropagation shield — swallows/filters events, claims no combo"] };
    }

    // Escape-only dismiss surfaces
    if (keyTests.length > 0 && keyTests.every((k) => k === "Escape")) {
        return { cls: "transient", notes: [removesSelf ? "Escape-to-close that unregisters itself" : "Escape-dismiss of own surface"] };
    }

    // media-conditional: keys gated on an acquired media target
    if (/(?:querySelector\s*\(\s*['"]video['"]|activeVideo|acquireBestCandidate)/.test(b) && /if\s*\(\s*!\s*[a-zA-Z_$][\w$]*\s*\)/.test(b)) {
        return { cls: "media", notes: ["keys gated on an acquired media (video) target"] };
    }

    // ui-nav: gesture keys + own-UI visibility gate
    const ownUiGate = /classList\.contains|hasAttribute|\.parentNode\b|querySelector\s*\(\s*['"][.#]|#isVisible|dataset\.|hidden\b/.test(b);
    if (gestureOnly && ownUiGate && receiverIsGlobal) {
        return { cls: "ui-nav", notes: ["gesture keys gated on own-UI visibility — multi-tenant by design"] };
    }

    if (!receiverIsGlobal) return { cls: "scoped", notes: ["element-level receiver — no page-wide claim"] };

    return { cls: "fixed", notes: [] };
}

function allKeyLiterals(b) {
    const out = new Set();
    const pats = [
        /(?:key|code)(?:\s*\.\s*(?:toLowerCase|toUpperCase)\s*\(\s*\))?\s*(?:===?|!==?)\s*(['"])([^'"]+)\1/g,
        /(['"])([^'"]+)\1\s*(?:===?|!==?)\s*[A-Za-z_$][\w$]*\s*\.\s*(?:key|code)\b/g,
        /case\s+(['"])([^'"]+)\1\s*:/g,
    ];
    for (const re of pats) {
        let m;
        while ((m = re.exec(b))) {
            let lit = m[2];
            if (TYPEOF_LITERALS.has(lit)) continue;
            if (isModifierToken(lit)) continue;
            if (lit.length === 1) lit = lit.toUpperCase();
            out.add(lit.replace(/^(Key|Digit)/, ""));
        }
    }
    return [...out];
}
/* ──────────────────────────────────────────────────────────────────────────
 * §7 Kernel registrations (modules/)
 * ────────────────────────────────────────────────────────────────────────── */

function mineKernelRegistrations(code, lineOfIndex) {
    const out = [];
    const re = /(?:Ψ|psi)\s*\.\s*hotkeys\s*\.\s*register\s*\(\s*(['"])([^'"]+)\1/g;
    let m;
    while ((m = re.exec(code))) {
        const combo = canonicalComboString(m[2]);
        const before = code.slice(0, m.index);
        let domain = null;
        const hostRe = /(?:Ψ|psi)\s*\.\s*hosts\s*\.\s*on\s*\(\s*(?:(['"])([^'"]+)\1|\[([^\]]*)\])/g;
        let hm;
        while ((hm = hostRe.exec(before))) {
            const open = code.indexOf("(", hm.index + hm[0].length - 1);
            const close = matchingParen(code, open);
            if (close > m.index) domain = hm[2] || hm[3];
        }
        out.push({ combo, raw: m[2], domainScope: domain, line: lineOfIndex(m.index), note: "kernel-registry" });
    }
    return out;
}

/* ──────────────────────────────────────────────────────────────────────────
 * §8 Census driver + collision analysis
 * ────────────────────────────────────────────────────────────────────────── */

/** Pairs that ARE same-combo + domain-overlapping but adjudicated as safe.
 *  Every entry must stay live — a stale adjudication is a failure. */
const ADJUDICATIONS = [
    // (empty — the media/ui-gated claim classes now cover prior conditional
    //  adjudications structurally; entries here must name live pairs only)
];

const COLLISION_CLASSES = new Set(["fixed", "media", "image-tab"]);

function scriptsOverlap(a, b) {
    if (a.universal || b.universal) return true;
    for (const d of a.domains) if (b.domains.has(d)) return true;
    return false;
}

function isGestureCombo(combo) {
    if (combo.includes("+")) return false;
    const up = combo.toUpperCase();
    return [...GESTURE_KEYS].some((k) => k.toUpperCase() === up);
}

export function runCensus(root = ROOT, opts = {}) {
    const problems = [];
    const registrations = [];
    const classified = [];
    let siteTotal = 0;

    const files = [
        ...walk(path.join(root, "canon")),
        ...walk(path.join(root, "modules")),
    ];

    for (const file of files) {
        const raw = fs.readFileSync(file, "utf8");
        const code = stripComments(raw);
        const rel = path.relative(root, file);
        const isModule = rel.startsWith("modules");
        const scriptName = isModule
            ? path.basename(path.dirname(file))
            : path.basename(file).replace(/\.user\.js$/, "").replace(/^4ndr0tools\s*-\s*/, "");

        let domainInfo;
        if (isModule) {
            const metaPath = path.join(path.dirname(file), "meta.json");
            domainInfo = fs.existsSync(metaPath)
                ? domainsFromHeader({ match: JSON.parse(fs.readFileSync(metaPath, "utf8")).match })
                : { universal: true, domains: new Set() };
        } else {
            domainInfo = domainsFromHeader(parseHeader(raw));
        }

        const lineOfIndex = (idx) => raw.slice(0, idx).split("\n").length;

        for (const k of mineKernelRegistrations(code, lineOfIndex)) {
            registrations.push({
                script: scriptName, combo: k.combo, cls: "fixed", line: k.line,
                note: k.domainScope ? `${k.note} (hosts.on ${k.domainScope})` : k.note,
                domains: k.domainScope
                    ? { universal: false, domains: new Set([k.domainScope]) }
                    : domainInfo,
                file: rel,
            });
        }

        // file-level combo tables (e.g. YTPM's COMBOS map outside the handler)
        const fileTableCombos = [];
        const ftcRe = /(?:const|let|var)\s+([A-Z_][A-Z0-9_]*)\s*=\s*\{/g;
        let ftc;
        while ((ftc = ftcRe.exec(code))) {
            const open = code.indexOf("{", ftc.index + ftc[0].length - 1);
            const region = balancedRegion(code, open);
            if (!region) continue;
            const keyRe = /(['"])((?:Ctrl|Alt|Shift|Meta|Control)[a-zA-Z+]*\+[A-Za-z][\w]*)\1\s*:/g;
            let km;
            while ((km = keyRe.exec(region.body))) {
                const combo = canonicalComboString(km[2]);
                if (combo) fileTableCombos.push({ table: ftc[1], combo, idx: ftc.index });
            }
        }

        const sites = findSites(code, lineOfIndex);
        for (const site of sites) {
            siteTotal++;
            const record = { file: rel, line: site.line, receiver: site.receiver || "(implicit window)", kind: site.kind };

            // scoped receivers never need handler resolution — no page-wide claim
            if (!site.receiverIsGlobal) {
                record.cls = "scoped";
                record.notes = ["element-level receiver — no page-wide claim"];
                record.combos = [];
                classified.push(record);
                continue;
            }

            const tok = extractHandlerToken(code, site.handlerStart);
            if (tok.unparseable) {
                problems.push({ file: rel, line: site.line, msg: `unparseable handler token: ${code.slice(site.handlerStart, site.handlerStart + 40).replace(/\n/g, " ")}` });
                continue;
            }

            let handler = null;
            if (tok.inline) handler = tok.body;
            else handler = resolveReference(code, tok.ref);

            if (!handler) {
                problems.push({ file: rel, line: site.line, msg: `unresolved handler reference "${tok.ref}"` });
                continue;
            }

            const fileCtx = { code };
            const { cls, notes } = classifyHandler(handler.params, handler.body, site.receiverIsGlobal, fileCtx);
            record.cls = cls;
            record.notes = notes;

            let mined = mineCombos(handler.params, handler.body, fileCtx);

            // attribute file-level combo tables when the handler consults one
            if (/\bcomboOf\s*\(|\bCOMBOS\s*\[/.test(handler.body)) {
                for (const t of fileTableCombos) {
                    if (!mined.some((c) => c.combo === t.combo)) {
                        mined.push({ combo: t.combo, key: t.combo, cls: "fixed", note: `table:${t.table}` });
                    }
                }
            }

            record.combos = mined;
            // whole-handler non-collision classes suppress registration entirely
            const handlerCollides = ["fixed", "media", "ui-nav"].includes(cls);
            for (const c of mined) {
                if (c.combo == null) {
                    problems.push({ file: rel, line: site.line, msg: `config-driven combo not resolvable: ${c.note}` });
                    continue;
                }
                if (!handlerCollides) continue;
                // handler-level media classification overrides claim classes
                const effective = cls === "media" ? "media" : c.cls;
                if (effective === "ui-gated") continue; // own-UI claims never collide
                // ui-nav handlers keep only their non-gesture (global) claims
                if (cls === "ui-nav" && isGestureCombo(c.combo)) continue;
                if (["fixed", "media", "image-tab"].includes(effective)) {
                    registrations.push({
                        script: scriptName, combo: c.combo, cls: effective, line: site.line,
                        note: c.note || effective, domains: domainInfo, file: rel,
                    });
                }
            }
            classified.push(record);
        }
    }

    // collision analysis
    const collisions = [];
    for (let i = 0; i < registrations.length; i++) {
        for (let j = i + 1; j < registrations.length; j++) {
            const a = registrations[i], b = registrations[j];
            if (a.script === b.script) continue;
            if (!a.combo || !b.combo || a.combo !== b.combo) continue;
            if (!COLLISION_CLASSES.has(a.cls) || !COLLISION_CLASSES.has(b.cls)) continue;
            // image-contentType tabs carry no <video> for a media-gated claim to
            // acquire — the two activation sets are structurally disjoint
            if ((a.cls === "image-tab" && b.cls === "media") || (b.cls === "image-tab" && a.cls === "media")) continue;
            if (!scriptsOverlap(a.domains, b.domains)) continue;
            // gesture keys (bare Escape/Enter/arrows/…) only collide when both sides are unconditional
            if (isGestureCombo(a.combo) && !(a.cls === "fixed" && b.cls === "fixed")) continue;
            // Escape/Tab are multi-tenant dismissal keys by construction — never collision-class
            if (a.combo === "ESCAPE" || a.combo === "TAB") continue;
            const adj = ADJUDICATIONS.find((x) => x.combo === a.combo &&
                ((x.scripts[0] === a.script && x.scripts[1] === b.script) || (x.scripts[1] === a.script && x.scripts[0] === b.script)));
            if (adj) continue;
            collisions.push({ combo: a.combo, a, b });
        }
    }

    // stale adjudication check (fail closed on dead entries)
    const stale = [];
    for (const adj of ADJUDICATIONS) {
        const live = registrations.some((r) => r.script === adj.scripts[0] && r.combo === adj.combo) &&
            registrations.some((r) => r.script === adj.scripts[1] && r.combo === adj.combo);
        if (!live) stale.push(adj);
    }

    return { registrations, classified, collisions, problems, stale, siteTotal };
}

/* ──────────────────────────────────────────────────────────────────────────
 * §9 CLI
 * ────────────────────────────────────────────────────────────────────────── */

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
    const verbose = process.argv.includes("--report");
    const c = runCensus();

    const byScript = {};
    for (const r of c.registrations) {
        (byScript[r.script] ||= []).push(`${r.combo} [${r.cls}]${r.note && r.note !== r.cls ? ` (${r.note})` : ""}`);
    }
    console.log("=== HOTKEY CENSUS ===");
    for (const [script, combos] of Object.entries(byScript).sort()) {
        console.log(`  ${script}`);
        for (const combo of [...new Set(combos)].sort()) console.log(`    ${combo}`);
    }
    const classCounts = {};
    for (const s of c.classified) classCounts[s.cls] = (classCounts[s.cls] || 0) + 1;
    console.log(`  sites: ${c.siteTotal} scanned · ${c.classified.length} classified · ` +
        Object.entries(classCounts).map(([k, v]) => `${v} ${k}`).join(", "));
    console.log(`  registrations: ${c.registrations.length} · collisions: ${c.collisions.length} · adjudicated: ${ADJUDICATIONS.length - c.stale.length}`);

    if (verbose) {
        console.log("\n-- site classification --");
        for (const s of c.classified) {
            console.log(`  [${String(s.cls).padEnd(9)}] ${s.file}:${s.line} -> ${s.receiver} ${s.notes.join("; ")}`);
        }
    }

    for (const p of c.problems) console.error(`  x ${p.file}:${p.line} -- ${p.msg}`);
    for (const col of c.collisions) {
        console.error(`  x COLLISION ${col.combo}: ${col.a.script} (${col.a.file}:${col.a.line}) x ${col.b.script} (${col.b.file}:${col.b.line})`);
    }
    for (const st of c.stale) console.error(`  x STALE ADJUDICATION: ${st.combo} x ${st.scripts.join(" x ")} -- pair no longer collides; remove the entry`);

    if (c.problems.length || c.collisions.length || c.stale.length) {
        console.log("\nHOTKEY CENSUS: FAIL");
        process.exit(1);
    }
    console.log("\nHOTKEY CENSUS: GREEN");
    process.exit(0);
}
