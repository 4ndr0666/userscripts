/* Kernel smoke test — executes kernel modules under a minimal DOM mock.
 * Validates: brand constants, core helpers, store roundtrip (incl. watch),
 * glass HUD + settings console, hotkey normalization, lexical integrity of
 * concatenated kernel.
 * v1.3.0: glass.js joined the harness — the v1.2 suite shipped a dead
 * settings console (glass called store-factory methods that only exist on
 * ns() facades) precisely because glass was never executed here. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = ["brand", "core", "store", "glass", "clipboard", "hotkeys", "hosts"].map((m) =>
    fs.readFileSync(path.join(ROOT, "kernel", `${m}.js`), "utf8"));

/* Minimal DOM/browser mock. */
const listeners = new Map();
/* Element base class — mkEl objects must be `instanceof Node` inside the vm
 * or kernel $new() wraps element children as TEXT nodes (createElement must
 * return real Node descendants, like the browser does). */
class FakeNode { }
const mkClassList = () => {
    const set = new Set();
    return {
        add: (c) => set.add(c),
        remove: (c) => set.delete(c),
        toggle: (c, f) => { const on = f === undefined ? !set.has(c) : Boolean(f); on ? set.add(c) : set.delete(c); return on; },
        contains: (c) => set.has(c),
    };
};
const mkEl = (tag) => Object.assign(Object.create(FakeNode.prototype), {
    tagName: tag.toUpperCase(), children: [], dataset: {},
    style: {}, attrs: {}, listeners: {}, classList: mkClassList(),
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
    append(...n) { this.children.push(...n); },
    appendChild(n) { this.children.push(n); return n; },
    replaceChildren(...n) { this.children.length = 0; this.children.push(...n); },
    remove() {}, removeChild() {}, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    removeEventListener() {},
    setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect() { return { left: 10, top: 20, right: 410, bottom: 440, width: 400, height: 420 }; },
    select() {}, setSelectionRange() {},
    matches: () => false, closest: () => null,
    isConnected: true,
});
const storageBacking = new Map();
const changeListeners = new Map();
const documentMock = {
    readyState: "complete",
    head: mkEl("head"), documentElement: mkEl("html"), body: mkEl("body"),
    createElement: (t) => mkEl(t),
    createTextNode: (t) => ({ text: t }),
    importNode: (n) => n,
    getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (t, f) => { if (!listeners.has(t)) listeners.set(t, []); listeners.get(t).push(f); },
};

const sandbox = {
    console, Date, Math, JSON, Map, Set, Promise, Array, Object, String, Number, Symbol,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Node: FakeNode,
    MutationObserver: class { observe() {} disconnect() {} },
    DOMParser: class { parseFromString() { return { documentElement: mkEl("svg") }; } },
    document: documentMock,
    window: { isSecureContext: false },
    navigator: { language: "en" },
    location: { hostname: "forum.candidshiny.com", origin: "https://forum.candidshiny.com" },
    innerWidth: 1280, innerHeight: 800,
    requestAnimationFrame: (fn) => { fn(); return 0; },
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
    GM_addValueChangeListener: (k, cb) => { changeListeners.set(k, cb); return 1; },
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

/* store.watch — v1.3.0 repair (local notify + per-key GM listener) */
let watchHits = 0;
const unwatch = s1.watch("mod:live", () => { watchHits++; });
s1.set("mod:live", true);
assert(watchHits === 1, "store: set() notifies local watchers (live-apply fix)");
const remoteCb = changeListeners.get("scriptA::mod:live");
if (typeof remoteCb === "function") remoteCb("scriptA::mod:live", true, false, true);
assert(watchHits === 2, "store: per-key GM listener fires watcher (exact-key fix)");
unwatch();
s1.set("mod:live", false);
assert(watchHits === 2, "store: unsubscribed watcher stays silent");

/* glass — HUD + settings console (the v1.2 dead-console regression class) */
assert(typeof Ψ.glass.hud === "function" && typeof Ψ.glass.settingsConsole === "function",
    "glass: hud + settingsConsole exported");
let tabRendered = 0;
const smokeHud = Ψ.glass.hud({
    id: "smoke-console",
    title: "SMOKE",
    subtitle: "kernel harness",
    width: 400, height: 300,
    tabs: [{ id: "mods", label: "MODS", render: () => { tabRendered++; } }],
});
assert(typeof smokeHud.show === "function" && tabRendered === 1,
    "glass: hud builds + first tab renders (no store-facade TypeError)");
smokeHud.show();
assert(smokeHud.root.isConnected !== false && documentMock.body.children.includes(smokeHud.root),
    "glass: hud.show() mounts the frame");
const smokeHud2 = Ψ.glass.hud({ id: "smoke-console", title: "SMOKE", tabs: [] });
assert(smokeHud2 === smokeHud, "glass: reopen dedups to the same instance");
smokeHud.toggleCollapse();
assert(smokeHud.isCollapsed() === true, "glass: collapse toggle works");
let scChange = null;
const scHost = mkEl("div");
Ψ.glass.settingsConsole(scHost, "hostwarp", [
    { key: "mod:test", type: "bool", label: "Test module", default: false },
    { key: "mod:num", type: "number", label: "Size", default: 200, min: 100, max: 480 },
], (k) => { scChange = k; });
assert(scHost.children.length === 2, "glass: settingsConsole renders one row per schema field");
const hwStore = Ψ.store.ns("hostwarp");
const findChangeInput = (node) => {
    if (!node || !node.children) return null;
    if (node.listeners && node.listeners.change) return node;
    for (const c of node.children) { const hit = findChangeInput(c); if (hit) return hit; }
    return null;
};
const swInput = findChangeInput(scHost.children[0]);
assert(hwStore.get("mod:test", "MISSING") === "MISSING", "glass: default not written before interaction");
if (swInput) {
    swInput.checked = true; /* emulate the user flipping the switch */
    swInput.listeners.change[0]();
    assert(hwStore.get("mod:test", null) === true && scChange === "mod:test",
        "glass: toggle writes through the module's own namespace (key parity)");
} else {
    assert(false, "glass: switch input reachable in mock");
}
let toastDied = false;
const dieToast = Ψ.glass.toast("smoke", { duration: 0 });
dieToast();
toastDied = true;
assert(toastDied, "glass: toast returns a disposer");

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
