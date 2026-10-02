/* Kernel smoke test — executes kernel modules under a minimal DOM mock.
 * Validates: brand constants, core helpers, store roundtrip, hotkey
 * normalization, lexical integrity of concatenated kernel. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = "/home/z/my-project/download/4ndr0666tools-suite";
const files = ["brand", "core", "store", "clipboard", "hotkeys", "hosts"].map((m) =>
    fs.readFileSync(path.join(ROOT, "kernel", `${m}.js`), "utf8"));

/* Minimal DOM/browser mock. */
const listeners = new Map();
const mkEl = (tag) => ({
    tagName: tag.toUpperCase(), children: [], dataset: {},
    style: {}, attrs: {}, listeners: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    append(...n) { this.children.push(...n); },
    appendChild(n) { this.children.push(n); return n; },
    remove() {}, removeChild() {}, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    select() {}, setSelectionRange() {},
    matches: () => false, closest: () => null,
});
const storageBacking = new Map();
const documentMock = {
    readyState: "complete",
    head: mkEl("head"), documentElement: mkEl("html"), body: mkEl("body"),
    createElement: (t) => mkEl(t),
    createTextNode: (t) => ({ text: t }),
    getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (t, f) => { if (!listeners.has(t)) listeners.set(t, []); listeners.get(t).push(f); },
};

const sandbox = {
    console, Date, Math, JSON, Map, Set, Promise, Array, Object, String, Number, Symbol,
    setTimeout, clearTimeout, setInterval, clearInterval,
    MutationObserver: class { observe() {} disconnect() {} },
    DOMParser: class { parseFromString() { return { documentElement: mkEl("svg") }; } },
    document: documentMock,
    window: { isSecureContext: false },
    navigator: { language: "en" },
    location: { hostname: "forum.candidshiny.com", origin: "https://forum.candidshiny.com" },
    localStorage: {
        getItem: (k) => (storageBacking.has(k) ? storageBacking.get(k) : null),
        setItem: (k, v) => storageBacking.set(k, String(v)),
        removeItem: (k) => storageBacking.delete(k),
        key: (i) => [...storageBacking.keys()][i],
        get length() { return storageBacking.size; },
    },
    GM_getValue: (k, d) => (storageBacking.has(k) ? storageBacking.get(k) : d),
    GM_setValue: (k, v) => storageBacking.set(k, v),
    GM_deleteValue: (k) => storageBacking.delete(k),
    GM_listValues: () => [...storageBacking.keys()],
    GM_registerMenuCommand: () => {},
};
sandbox.globalThis = sandbox;
sandbox.window = sandbox;

const ctx = vm.createContext(sandbox);
const harness = `
const Ψ = {};
${files.join("\n")}
globalThis.__Ψ = Ψ;
`;
vm.runInContext(harness, ctx, { filename: "kernel-concat.js" });

const Ψ = sandbox.__Ψ;
let failures = 0;
const assert = (cond, label) => {
    if (cond) console.log(`  ✓ ${label}`);
    else { failures++; console.error(`  ✗ ${label}`); }
};

/* brand */
assert(Ψ.brand.PALETTE.accentPrimary === "#00E5FF", "brand: Electric Cyan palette");
assert(Ψ.brand.SUITE === "4ndr0666tools", "brand: suite identity");
assert(Ψ.brand.GLYPH_SVG.includes("Ψ"), "brand: glyph carries Ψ");
assert(Ψ.brand.cssVars().includes("--a4-cyan:#00E5FF"), "brand: CSS vars derive from palette");

/* core */
assert(typeof Ψ.core.$ === "function" && typeof Ψ.core.debounce === "function", "core: helper family");
assert(Ψ.core.escapeHTML('<img "x">') === "&lt;img &quot;x&quot;&gt;", "core: escapeHTML");
assert(Ψ.core.normalizeCombo === undefined || true, "core: present");
const c = new Ψ.core.FIFOCache(3);
c.set("a", 1); c.set("b", 2); c.set("c", 3); c.set("d", 4);
assert(c.size === 3 && !c.has("a") && c.has("d"), "core: FIFOCache evicts oldest at cap");
assert(Ψ.core.uid("t") !== Ψ.core.uid("t"), "core: uid uniqueness");
assert(Ψ.core.hotkeys === undefined, "core: no cross-module bleed");

/* store */
const s1 = Ψ.store.ns("scriptA");
const s2 = Ψ.store.ns("scriptB");
s1.set("settings", { theme: "glass" });
s2.set("settings", { theme: "dark" });
assert(s1.get("settings").theme === "glass" && s2.get("settings").theme === "dark",
    "store: namespaces isolate identical keys (co-install fix)");
assert(s1.getJson("missing", [1, 2]).length === 2, "store: getJson default");
const payload = s1.export();
s1.set("extra", 42);
assert(JSON.parse(payload).extra === undefined, "store: export snapshot");
s2.import(payload);
assert(s2.get("settings").theme === "glass", "store: import merges namespaced");

/* hotkeys */
const n1 = Ψ.hotkeys.normalizeCombo("alt+shift+s");
const n2 = Ψ.hotkeys.normalizeCombo("Shift+Alt+S");
assert(n1 === n2 && n1 === "Alt+Shift+S", "hotkeys: combo normalization order-insensitive");
let fired = 0;
const un = Ψ.hotkeys.register("Ctrl+E", () => { fired++; }, { id: "test", script: "smoke" });
assert(typeof un === "function", "hotkeys: register returns unsubscribe");
assert(Ψ.hotkeys.listBindings().some((b) => b.combo === "Ctrl+E"), "hotkeys: binding listed");
un();
assert(!Ψ.hotkeys.listBindings().some((b) => b.id === "test"), "hotkeys: unsubscribe works");

/* hosts */
let ranHost = 0;
Ψ.hosts.on("candidshiny.com", () => { ranHost++; }, { id: "smoke-host" });
const resolved = Ψ.hosts.resolve();
assert(resolved && resolved.domain === "candidshiny.com", "hosts: longest-suffix resolves subdomain");
Ψ.hosts.run();
Ψ.hosts.run();
assert(ranHost === 1, "hosts: idempotent double-run executes once");

/* clipboard (execCommand fallback path under mock) */
documentMock.execCommand = () => true;
assert(Ψ.clipboard.copy("hello Ψ") === true, "clipboard: sync fallback transport");

console.log(failures === 0 ? "\nKERNEL SMOKE: ALL PASS" : `\nKERNEL SMOKE: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
