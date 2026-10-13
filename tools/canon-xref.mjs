#!/usr/bin/env node
/* canon-xref.mjs — static cross-reference sweep over canon/ scripts.
 * Detects, per file:
 *   (1) <OBJ>.<prop> accesses where OBJ is a top-level const initialized
 *       to an object literal and prop is never among its literal keys and
 *       never assigned later (the CONFIG.redColor bug class);
 *   (2) identifiers that ONLY ever appear as `name(` calls — never
 *       declared, never mentioned in any other position (the getContent
 *       bug class);
 *   (3) GM APIs referenced but not @grant'd.
 * Heuristic by design — every hit is manually adjudicated before action.
 *
 * ── v1.3.0 SCANNER REBUILD ──────────────────────────────────────────────
 * The v1.2 scanner stripped comments with naive regexes BEFORE blanking
 * strings, so a `//` inside any URL string literal ('https://…') was
 * treated as a line comment, ate the closing quote, and flipped the
 * string/comment state machine for the rest of the file — real function
 * definitions were swallowed and CSS function names (rgba(, calc(, …)
 * leaked out as pseudo-"calls". The result: ~220 false (2) hits and
 * reported line numbers that matched nothing (multi-line template
 * literals also collapsed when blanked).
 * The rebuild is a single-pass, string-AWARE lexer:
 *   • comments are only recognized OUTSIDE string/template literals;
 *   • string + template contents are blanked to SPACES with newlines
 *     preserved (line numbers in findings are now REAL line numbers);
 *   • ${…} interpolation regions are kept as live code, recursively
 *     handling nested templates/strings/comments/regexes inside them;
 *   • regex literal contents are blanked too (the `tbm=isch(` class of
 *     false hits — regex fragments are not function calls);
 *   • identifiers supplied by @require libraries (sha256, saveAs, JSZip,
 *     tippy, …) are auto-derived from the @require lines and excluded.
 * ────────────────────────────────────────────────────────────────────── */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CANON = path.join(ROOT, "canon");

const BUILTINS = new Set([
    "document", "window", "location", "navigator", "console", "JSON", "Math",
    "Object", "Array", "String", "Number", "Boolean", "Date", "RegExp",
    "Promise", "Error", "TypeError", "RangeError", "SyntaxError", "DOMException",
    "Map", "Set", "WeakMap", "WeakSet", "Symbol", "Proxy", "Reflect", "Function",
    "MutationObserver", "ResizeObserver", "IntersectionObserver", "PerformanceObserver",
    "XMLHttpRequest", "fetch", "Response", "Request", "Headers", "URL", "URLSearchParams",
    "FormData", "Blob", "File", "FileReader", "AbortController", "AbortSignal",
    "DOMParser", "Node", "Element", "HTMLElement", "NodeList", "HTMLCollection",
    "Event", "CustomEvent", "EventTarget", "KeyboardEvent", "MouseEvent", "PointerEvent",
    "setTimeout", "setInterval", "clearTimeout", "clearInterval", "requestAnimationFrame",
    "cancelAnimationFrame", "queueMicrotask", "structuredClone", "crypto", "atob", "btoa",
    "alert", "confirm", "prompt", "open", "close", "print", "focus", "blur",
    "getComputedStyle", "matchMedia", "scrollTo", "scrollBy", "scrollIntoView", "postMessage",
    "history", "localStorage", "sessionStorage", "indexedDB", "caches", "clients",
    "performance", "CSS", "RTCPeerConnection", "WebSocket", "Worker", "SharedWorker",
    "ServiceWorker", "CanvasRenderingContext2D", "HTMLCanvasElement", "Image", "Audio",
    "AudioBuffer", "WebGLRenderingContext", "WebGL2RenderingContext", "MediaSource",
    "Storage", "Notification", "webkitRequestAnimationFrame", "CopyEvent",
    "GM_addStyle", "GM_addElement", "GM_getValue", "GM_setValue", "GM_deleteValue",
    "GM_listValues", "GM_getResourceText", "GM_getResourceURL", "GM_registerMenuCommand",
    "GM_unregisterMenuCommand", "GM_notification", "GM_openInTab", "GM_setClipboard",
    "GM_xmlhttpRequest", "GM_download", "GM_info", "unsafeWindow", "cloneInto",
    "GM_addValueChangeListener", "GM_removeValueChangeListener",
    "exportFunction", "GM", "browser", "chrome", "arguments", "undefined",
    "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURI", "encodeURIComponent",
    "decodeURI", "decodeURIComponent", "escape", "unescape", "eval",
    "requestIdleCallback", "reportError", "TextEncoder", "TextDecoder",
    "AggregateError", "FinalizationRegistry", "WeakRef", "WebSocketStream",
    "ShadowRoot", "trustedTypes", "BigInt", "globalThis", "self", "top", "parent",
]);

/* Known @require library globals → excluded from call-only findings. */
const REQUIRE_GLOBALS = [
    [/js-sha256|sha256/i, ["sha256"]],
    [/FileSaver/i, ["saveAs"]],
    [/jszip/i, ["JSZip"]],
    [/tippy/i, ["tippy"]],
];

const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name));
        else if (e.name.endsWith(".user.js")) files.push(path.join(dir, e.name));
    }
})(CANON);

/* ── Single-pass string-aware lexer ────────────────────────────────────
 * Returns a "skeleton": same length + line structure as the source, with
 * string/template/regex CONTENTS and comments replaced by spaces. Code
 * (including ${…} interpolation bodies) survives verbatim. */
function skeletonize(src) {
    const out = src.split("");
    const n = src.length;
    const blank = (a, b) => { for (let k = a; k < b && k < n; k++) if (out[k] !== "\n") out[k] = " "; };
    const prevCodeChar = (i) => {
        let j = i - 1;
        while (j >= 0 && (out[j] === " " || out[j] === "\n" || out[j] === "\t" || out[j] === "\r")) j--;
        return j >= 0 ? src[j] : "";
    };
    const REGEX_PRECEDERS = /[(,=:[!&|?{};+\-*%<>~^]/;

    function scanString(i, q) {
        let j = i + 1;
        while (j < n) {
            if (src[j] === "\\") { j += 2; continue; }
            if (src[j] === q) return j + 1;
            if (q !== "`" && src[j] === "\n") return -1; /* unterminated single/double quote */
            j++;
        }
        return -1;
    }

    function scanRegex(i) {
        let j = i + 1, inClass = false;
        while (j < n) {
            if (src[j] === "\\") { j += 2; continue; }
            if (src[j] === "[") inClass = true;
            else if (src[j] === "]") inClass = false;
            else if (src[j] === "/" && !inClass) return j + 1;
            else if (src[j] === "\n") return -1; /* not a regex after all */
            j++;
        }
        return -1;
    }

    function scanTemplate(i) {
        /* i at opening backtick. Blanks raw-text segments, keeps ${…} bodies
         * as code (recursively), blanks the delimiters themselves. */
        out[i] = " ";
        let j = i + 1;
        let segStart = j;
        while (j < n) {
            if (src[j] === "\\") { j += 2; continue; }
            if (src[j] === "`") { blank(segStart, j); out[j] = " "; return j + 1; }
            if (src[j] === "$" && src[j + 1] === "{") {
                blank(segStart, j);
                let depth = 1, k = j + 2;
                while (k < n && depth > 0) {
                    const ch = src[k];
                    if (ch === "{") depth++;
                    else if (ch === "}") { depth--; if (depth === 0) break; }
                    else if (ch === "`") { k = scanTemplate(k); continue; }
                    else if (ch === '"' || ch === "'") {
                        const e = scanString(k, ch);
                        if (e !== -1) { blank(k + 1, e - 1); k = e; continue; }
                    } else if (ch === "/" && src[k + 1] === "/") {
                        let e = src.indexOf("\n", k); e = e === -1 ? n : e;
                        blank(k, e); k = e; continue;
                    } else if (ch === "/" && src[k + 1] === "*") {
                        let e = src.indexOf("*/", k + 2); e = e === -1 ? n : e + 2;
                        blank(k, e); k = e; continue;
                    } else if (ch === "/" && REGEX_PRECEDERS.test(prevCodeChar(k))) {
                        const e = scanRegex(k);
                        if (e !== -1) { blank(k + 1, e - 1); k = e; continue; }
                    }
                    k++;
                }
                j = k + 1;
                segStart = j;
                continue;
            }
            j++;
        }
        blank(segStart, n);
        return n;
    }

    let i = 0;
    while (i < n) {
        const c = src[i];
        if (c === "/" && src[i + 1] === "/") {
            let e = src.indexOf("\n", i); e = e === -1 ? n : e;
            blank(i, e); i = e; continue;
        }
        if (c === "/" && src[i + 1] === "*") {
            let e = src.indexOf("*/", i + 2); e = e === -1 ? n : e + 2;
            blank(i, e); i = e; continue;
        }
        if (c === '"' || c === "'") {
            const e = scanString(i, c);
            if (e !== -1) { blank(i + 1, e - 1); i = e; continue; }
            i++; continue; /* lone quote — leave as-is, nothing to swallow */
        }
        if (c === "`") { i = scanTemplate(i); continue; }
        if (c === "/" && REGEX_PRECEDERS.test(prevCodeChar(i))) {
            const e = scanRegex(i);
            if (e !== -1) { blank(i + 1, e - 1); i = e; continue; }
        }
        i++;
    }
    return out.join("");
}

let totalHits = 0;
for (const file of files.sort()) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    const hits = [];

    const noStrings = skeletonize(src);

    /* Externals supplied by @require libraries. */
    const externals = new Set();
    const reqRe = /\/\/\s*@require\s+(\S+)/g;
    let rm;
    while ((rm = reqRe.exec(src)) !== null) {
        for (const [pat, names] of REQUIRE_GLOBALS) {
            if (pat.test(rm[1])) for (const nm of names) externals.add(nm);
        }
    }

    /* ── (1) object-literal property cross-reference ── */
    const objDecls = new Map();
    const declRe = /(?:const|let|var)\s+([A-Z][A-Z0-9_]*)\s*=\s*\{/g;
    let m;
    while ((m = declRe.exec(noStrings)) !== null) {
        const name = m[1];
        const start = m.index + m[0].length - 1;
        let depth = 0, i = start;
        for (; i < noStrings.length; i++) {
            const c = noStrings[i];
            if (c === "{") depth++;
            else if (c === "}") { depth--; if (depth === 0) break; }
        }
        const body = noStrings.slice(start + 1, i);
        const keys = new Set();
        const keyRe = /(?:^|[{,])\s*(?:async\s+)?(?:get\s+|set\s+)?\*?([A-Za-z_$][\w$]*)\s*[:=,(\s]/g;
        let km;
        while ((km = keyRe.exec(body)) !== null) keys.add(km[1]);
        objDecls.set(name, keys);
    }
    for (const [name, keys] of objDecls) {
        const used = new Map();   // prop -> first line
        const assigned = new Set();
        const useRe = new RegExp(`\\b${name}\\.([A-Za-z_$][\\w$]*)(\\s*=[^=])?`, "g");
        let um;
        while ((um = useRe.exec(noStrings)) !== null) {
            const prop = um[1];
            if (um[2]) assigned.add(prop);
            if (!used.has(prop)) used.set(prop, noStrings.slice(0, um.index).split("\n").length);
        }
        for (const [prop, line] of used) {
            if (!keys.has(prop) && !assigned.has(prop)) {
                hits.push(`(1) ${name}.${prop} — never a key of the ${name} literal, never assigned (line ${line})`);
            }
        }
    }

    /* ── (2) identifiers that ONLY appear as calls ── */
    const KEYWORDS = new Set(["if", "for", "while", "switch", "catch", "return",
        "typeof", "new", "delete", "void", "do", "else", "function", "yield",
        "await", "throw", "case", "with", "in", "of", "instanceof", "import",
        "async", "get", "set", "static", "super", "this"]);
    const tokenRe2 = /[A-Za-z_$][\w$]*/g;
    /* find the character after the matching close-paren of an opening paren */
    const afterMatchingParen = (openIdx) => {
        let depth = 0;
        for (let i = openIdx; i < noStrings.length; i++) {
            const c = noStrings[i];
            if (c === "(") depth++;
            else if (c === ")") { depth--; if (depth === 0) { let k = i + 1; while (k < noStrings.length && /\s/.test(noStrings[k])) k++; return noStrings[k] || ""; } }
        }
        return "";
    };
    const callOnly = new Map();   // name -> line
    const seenElsewhere = new Set();
    let tm;
    while ((tm = tokenRe2.exec(noStrings)) !== null) {
        const name = tm[0];
        if (BUILTINS.has(name) || KEYWORDS.has(name) || externals.has(name)) continue;
        /* previous significant char(s): method access? */
        let p = tm.index - 1;
        while (p >= 0 && /\s/.test(noStrings[p])) p--;
        const prevCh = p >= 0 ? noStrings[p] : "";
        const isMethod = prevCh === ".";
        let j = tm.index + tm[0].length;
        while (j < noStrings.length && /\s/.test(noStrings[j])) j++;
        const isCall = noStrings[j] === "(";
        /* property-key position: `name:` (object literal / label) */
        let k2 = j;
        if (!isCall && noStrings[k2] === ":") { seenElsewhere.add(name); continue; }
        /* destructuring: `{ name }` / `{ name,` */
        if (prevCh === "{" && (noStrings[j] === "}" || noStrings[j] === ",")) { seenElsewhere.add(name); continue; }
        if (isCall) {
            /* declaration forms: `function name(`, `class name(`(no), and
             * anything already seen in a non-call position */
            let k = p;
            let prevWord = "";
            let q = k;
            while (q >= 0 && /[\w$]/.test(noStrings[q])) { prevWord = noStrings[q] + prevWord; q--; }
            const isDecl = prevWord === "function" || prevWord === "class" || prevWord === "new";
            /* ES6 shorthand method / class method: `name(args) { … }` */
            const isShorthand = afterMatchingParen(j) === "{";
            if (isMethod || isDecl || isShorthand) { seenElsewhere.add(name); tokenRe2.lastIndex = j; continue; }
            if (!callOnly.has(name)) callOnly.set(name, noStrings.slice(0, tm.index).split("\n").length);
            tokenRe2.lastIndex = j;
        } else {
            seenElsewhere.add(name);
        }
    }
    for (const [name, line] of callOnly) {
        if (!seenElsewhere.has(name)) {
            hits.push(`(2) "${name}(" called but the identifier never appears in any other position (line ${line})`);
        }
    }

    /* ── (3) GM API grants ── */
    const grants = new Set();
    const grantRe = /\/\/\s*@grant\s+(\S+)/g;
    while ((m = grantRe.exec(src)) !== null) grants.add(m[1]);
    const allGranted = grants.has("none") || [...grants].some((g) => g.includes("*"));
    if (!allGranted) {
        for (const api of ["GM_addStyle", "GM_setClipboard", "GM_xmlhttpRequest", "GM_registerMenuCommand", "GM_getValue", "GM_setValue", "GM_notification", "GM_download", "GM_openInTab", "GM_addElement"]) {
            if (new RegExp(`(?<![\\w$.])${api}\\s*\\(`).test(noStrings) && !grants.has(api)) {
                hits.push(`(3) ${api} used but not @grant'd`);
            }
        }
    }

    if (hits.length) {
        totalHits += hits.length;
        console.log(`\n=== ${rel} ===`);
        for (const h of hits) console.log(`  ${h}`);
    }
}
console.log(`\n[${totalHits} heuristic hits across ${files.length} files — adjudicate each manually]`);
