#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/scan-kit.mjs — shared §1.1 lexical scanner + placeholder scan (WO-01
 * round-2, 6-a F08 / 6-b F7 / round-1 deferred item d)
 * ─────────────────────────────────────────────────────────────────────────────
 * build.mjs and validate.mjs each carried a ~120-line port of the same two
 * scanners, and the ports had ALREADY drifted in both directions: build's
 * placeholder set alone caught `pass # todo`, bare quoted "PLACEHOLDER"
 * values and `= "TODO"` assignments, while validate's alone caught
 * `= "STUB"/"PENDING"` sentinels — neither a subset, both thinner than the
 * union. This module is the single source: the lexical balance scanner is
 * the newest lineage (build.mjs's v1.4.7 form — forward lastSig tracking +
 * the nested-template-in-interpolation fix), and the placeholder scan is
 * the three-layer union:
 *
 *   layer A — code view (comments stripped, strings blanked): word markers;
 *   layer B — strings-kept view: sentinel assignments AND quoted
 *             placeholder VALUES (an argument, not just an assignment);
 *   layer C — raw text: the trailing `// …` comment ellipsis (the stub
 *             idiom in prose form; comments are documentation, and a
 *             documentation ellipsis that marks elided CODE is a stub).
 *
 * Zero hits on the current tree — the unification is behavior-neutral today
 * and a strictly tighter net tomorrow.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── §1.1-aware lexical scanner (JS: comments, strings, templates, regex) ── */

/** Returns null when balanced, or a descriptive error string.
 * v1.4.5: lastSig is tracked FORWARD (last significant CODE character,
 * comments and strings excluded by construction) — the old backward
 * prevSignificant() walk stopped at a block-comment terminator's slash, so
 * a regex literal directly after a closing comment token was scanned as
 * division, and a slash inside its first character class then opened a
 * PHANTOM regex that swallowed live parens.
 * v1.4.7: skipTemplate(start) takes the template's opening backtick INDEX
 * (the v1.4.5 port drift passed (src, i) into the one-argument form, so
 * every nested-template-in-interpolation returned -1; latent until Prompt
 * Master's dense `${…`…`…}` nesting became a kernel consumer). */
export function checkLexicalBalance(src, label = "source") {
    let i = 0, line = 1;
    const n = src.length;
    const stack = [];
    let lastSig = "";
    const skipTemplate = (start) => {
        let k = start + 1;
        while (k < n) {
            if (src[k] === "\\") { k += 2; continue; }
            if (src[k] === "`") return k + 1;
            k++;
        }
        return -1;
    };
    while (i < n) {
        const c = src[i];
        if (c === "\n") { line++; i++; continue; }
        if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") i++; continue; }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            if (end === -1) return `${label}: unterminated block comment at line ${line}`;
            line += src.slice(i, end).split("\n").length - 1; i = end + 2; continue;
        }
        if (c === '"' || c === "'") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === "\n") return `${label}: unterminated ${c} string at line ${line}`;
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "`") {
            i++;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "`") { i++; break; }
                if (src[i] === "$" && src[i + 1] === "{") {
                    // template interpolation: structurally live braces
                    let depth = 1; i += 2;
                    while (i < n && depth > 0) {
                        if (src[i] === "{") depth++;
                        else if (src[i] === "}") depth--;
                        else if (src[i] === "`") { // nested template
                            const r = skipTemplate(i);
                            if (r === -1) return `${label}: unterminated nested template at line ${line}`;
                            i = r;
                            continue;
                        }
                        i++;
                    }
                    continue;
                }
                i++;
            }
            lastSig = c;
            continue;
        }
        if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSig || "(")) {
            // regex literal (heuristic per §1.1: only where a value may start)
            i++;
            let inClass = false;
            while (i < n) {
                if (src[i] === "\\") { i += 2; continue; }
                if (src[i] === "[") inClass = true;
                else if (src[i] === "]") inClass = false;
                else if (src[i] === "/" && !inClass) { i++; break; }
                else if (src[i] === "\n") break; // not a regex after all
                i++;
            }
            lastSig = "/";
            continue;
        }
        if (c === "(" || c === "[" || c === "{") {
            stack.push({ ch: c, line });
            lastSig = c; i++; continue;
        }
        if (c === ")" || c === "]" || c === "}") {
            const top = stack.pop();
            if (!top) return `${label}: unmatched "${c}" at line ${line}`;
            const pairs = { "(": ")", "[": "]", "{": "}" };
            if (pairs[top.ch] !== c) return `${label}: "${c}" at line ${line} closes "${top.ch}" opened at line ${top.line}`;
            lastSig = c; i++; continue;
        }
        if (!/\s/.test(c)) lastSig = c;
        i++;
    }
    if (stack.length > 0) return `${label}: unclosed "${stack[stack.length - 1].ch}" opened at line ${stack[stack.length - 1].line}`;
    return null;
}

/* ── Placeholder scan (GUP §7.3 zero-placeholder rule) — three-layer union ── */

/* layer A: word markers in live CODE (comments stripped, strings blanked).
 * The union of the round-1 build set and the validate set: `pass # todo`
 * was build-only. */
export const PLACEHOLDER_WORD_MARKERS = [
    /\bTODO[:\s]/, /\bFIXME\b/, /\bXXX\b/, /\bHACK\b/,
    /\.\.\.\s*existing\s+code/i,
    /\/\*\s*implementation\s+pending\s*\*\//i,
    /\bpass\s*#\s*todo\b/i,
];

/* layer B: sentinel assignments in the strings-kept view. The union: the
 * round-1 validate form alone covered PLACEHOLDER|TODO|FIXME; build's
 * `= "STUB"/"PENDING"` blind spot is closed by including them here. */
export const PLACEHOLDER_SENTINEL_ASSIGN =
    /[\w$\)\]]\s*=\s*["'`](?:PLACEHOLDER|TODO|FIXME|STUB|PENDING)["`']/i;

/* layer B (companion): a quoted placeholder VALUE (an argument, not just an
 * assignment — build-only before the union). CASE-SENSITIVE on purpose: the
 * legacy sentinel values are uppercase "PLACEHOLDER"; the case-insensitive
 * form false-positived on legitimate CSS selector strings like Prompt
 * Master's '[class*="placeholder"]' export-cleanup selector (found live by
 * the union scan on its first run — the refinement is proven, not
 * theoretical). */
export const PLACEHOLDER_QUOTED_VALUE = /["'`]PLACEHOLDER["'`]/;

/* layer C: the trailing comment ellipsis in RAW text — the stub idiom in
 * prose form (build-only before the union; the layered code view strips
 * comments so this marker must read raw lines). */
export const PLACEHOLDER_COMMENT_ELLIPSIS = /\/\/\s*\.\.\.\s*$/;

/* Blank line-comment and block-comment contents (newlines preserved,
 * strings kept) — the strings-kept view shared with validate.mjs. */
export function stripCommentsKeepStrings(src) {
    let out = "";
    let i = 0;
    const n = src.length;
    while (i < n) {
        const c = src[i];
        if (c === "/" && src[i + 1] === "/") { while (i < n && src[i] !== "\n") { out += " "; i++; } continue; }
        if (c === "/" && src[i + 1] === "*") {
            const end = src.indexOf("*/", i + 2);
            const stop = end === -1 ? n : end + 2;
            while (i < stop) { out += src[i] === "\n" ? "\n" : " "; i++; }
            continue;
        }
        if (c === '"' || c === "'" || c === "`") {
            const q = c;
            out += c; i++;
            while (i < n) {
                if (src[i] === "\\") { out += src[i] + (src[i + 1] || ""); i += 2; continue; }
                out += src[i];
                const prev = src[i];
                i++;
                if (prev === q) break;
                if (q !== "`" && prev === "\n") break; // unterminated guard: bail, let the main scanner report it
            }
            continue;
        }
        out += c; i++;
    }
    return out;
}

/** Three-layer placeholder scan. Hits are labelled `placeholder:` so
 * exit-code forks can discriminate validation failures from build failures
 * without pattern-matching on regex source text (WO-01 round-1 F-17). */
export function scanPlaceholders(src, label = "source") {
    const hits = [];
    // layer (a): comment-stripped, string-blanked code
    const codeLines = src.split("\n").map((ln) => ln
        .replace(/\/\/.*$/, "")
        .replace(/\/\*.*?\*\//g, "")
        .replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""'));
    for (let ln = 0; ln < codeLines.length; ln++) {
        for (const pat of PLACEHOLDER_WORD_MARKERS) {
            if (pat.test(codeLines[ln])) hits.push(`placeholder: ${label}: line ${ln + 1}: word marker ${pat.source}`);
        }
    }
    // layer (b): sentinel assignments + quoted placeholder values in the
    // strings-kept view
    const kept = stripCommentsKeepStrings(src).split("\n");
    for (let ln = 0; ln < kept.length; ln++) {
        if (PLACEHOLDER_SENTINEL_ASSIGN.test(kept[ln])) hits.push(`placeholder: ${label}: line ${ln + 1}: sentinel value assignment`);
        if (PLACEHOLDER_QUOTED_VALUE.test(kept[ln])) hits.push(`placeholder: ${label}: line ${ln + 1}: quoted placeholder value`);
    }
    // layer (c): trailing comment ellipsis in raw text
    const rawLines = src.split("\n");
    for (let ln = 0; ln < rawLines.length; ln++) {
        if (PLACEHOLDER_COMMENT_ELLIPSIS.test(rawLines[ln])) hits.push(`placeholder: ${label}: line ${ln + 1}: comment ellipsis (stub idiom)`);
    }
    return hits;
}
