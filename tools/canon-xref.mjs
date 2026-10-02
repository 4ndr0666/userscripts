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
 * Heuristic by design — every hit is manually adjudicated before action. */
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
    "exportFunction", "GM", "browser", "chrome", "arguments", "undefined",
    "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURI", "encodeURIComponent",
    "decodeURI", "decodeURIComponent", "escape", "unescape", "eval",
    "requestIdleCallback", "reportError", "TextEncoder", "TextDecoder",
    "AggregateError", "FinalizationRegistry", "WeakRef", "WebSocketStream",
]);

const files = [];
(function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) walk(path.join(dir, e.name));
        else if (e.name.endsWith(".user.js")) files.push(path.join(dir, e.name));
    }
})(CANON);

function blankStrings(code) {
    let out = "", i = 0;
    const n = code.length;
    while (i < n) {
        const c = code[i];
        if (c === '"' || c === "'" || c === "`") {
            const q = c;
            out += '""';
            i++;
            while (i < n) {
                if (code[i] === "\\") { i += 2; continue; }
                if (code[i] === q) { i++; break; }
                if (q !== "`" && code[i] === "\n") break;
                i++;
            }
            continue;
        }
        out += c;
        i++;
    }
    return out;
}

let totalHits = 0;
for (const file of files.sort()) {
    const src = fs.readFileSync(file, "utf8");
    const rel = path.relative(ROOT, file);
    const hits = [];

    const noComments = src
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
        .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));
    const noStrings = blankStrings(noComments);

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
        "async", "get", "set", "static"]);
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
        if (BUILTINS.has(name) || KEYWORDS.has(name)) continue;
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
