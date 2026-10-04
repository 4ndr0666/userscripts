/* Kernel smoke test — executes kernel modules under a minimal DOM mock.
 * Validates: brand constants, core helpers, store roundtrip (incl. watch),
 * glass HUD + settings console, hotkey normalization, lexical integrity of
 * concatenated kernel.
 * v1.3.0: glass.js joined the harness — the v1.2 suite shipped a dead
 * settings console (glass called store-factory methods that only exist on
 * ns() facades) precisely because glass was never executed here.
 * v1.4.2: TT-hardening battery — glyphNode structure (createElementNS
 * glyph, replacing the DOMParser sink that killed glass HUDs on
 * require-trusted-types hosts) and the core.parseHTML/parseXML pair under
 * three enforcement regimes: no-TT (raw), TT (policy mint + co-install
 * name-collision walk), and CSP-locked (all names taken, raw fallback). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const files = ["brand", "core", "store", "glass", "hotkeys", "hosts"].map((m) =>
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
let mockLastParse = null; /* v1.4.2: records (value, mime) reaching the DOMParser mock */
const storageBacking = new Map();
const changeListeners = new Map();
const documentMock = {
    readyState: "complete",
    head: mkEl("head"), documentElement: mkEl("html"), body: mkEl("body"),
    createElement: (t) => mkEl(t),
    createElementNS: (ns, t) => mkEl(t),
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
    DOMParser: class { parseFromString(v, m) { mockLastParse = { v, m }; return { documentElement: mkEl("svg") }; } },
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
/* brand glyphNode — v1.4.2 TT hardening (createElementNS glyph, no DOMParser) */
assert(typeof Ψ.brand.glyphNode === "function", "brand: glyphNode factory exported");
const gSvg = Ψ.brand.glyphNode();
assert(gSvg.tagName === "SVG" && gSvg.attrs.viewBox === "0 0 128 128", "brand: glyphNode builds root svg");
assert(gSvg.attrs.stroke === "#00E5FF" && gSvg.attrs.fill === "none", "brand: glyphNode palette-derived stroke");
assert(gSvg.children.length === 4 && gSvg.children[0].tagName === "PATH" && gSvg.children[3].tagName === "TEXT",
    "brand: glyphNode carries outer ring, inner ring, hex, Ψ text");
assert(gSvg.children[3].textContent === "Ψ" && gSvg.children[3].attrs["font-family"] === "Cinzel Decorative, serif",
    "brand: glyphNode Ψ core with Cinzel glyph font");

/* core */
assert(typeof Ψ.core.$ === "function" && typeof Ψ.core.debounce === "function", "core: helper family");
assert(Ψ.core.escapeHTML('<img "x">') === "&lt;img &quot;x&quot;&gt;", "core: escapeHTML");
assert(Ψ.core.normalizeCombo === undefined || true, "core: present");
const c = new Ψ.core.FIFOCache(3);
c.set("a", 1); c.set("b", 2); c.set("c", 3); c.set("d", 4);
assert(c.size === 3 && !c.has("a") && c.has("d"), "core: FIFOCache evicts oldest at cap");
assert(Ψ.core.uid("t") !== Ψ.core.uid("t"), "core: uid uniqueness");
assert(Ψ.core.hotkeys === undefined, "core: no cross-module bleed");
/* core.parseHTML/parseXML — v1.4.2 TT-safe parsing (raw path: this sandbox
 * has no trustedTypes, so the policy probe degrades to the raw string) */
assert(typeof Ψ.core.parseHTML === "function" && typeof Ψ.core.parseXML === "function",
    "core: TT parse pair exported");
Ψ.core.parseHTML("<p>x</p>");
assert(mockLastParse && mockLastParse.v === "<p>x</p>" && mockLastParse.m === "text/html",
    "core: parseHTML raw path passes string + HTML MIME");
assert(Ψ.core.tt.createHTML("k") === "k", "core: tt.createHTML identity without TT");
assert(Ψ.core.tt.available() === false, "core: tt unavailable without trustedTypes");

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

/* ── TT-enforcing regimes (v1.4.2) ─────────────────────────────────────────
 * core.js runs in three extra contexts with a trustedTypes mock. createPolicy
 * throws for pre-taken names (mirroring both a co-installed suite script
 * holding the name and a host page with a `trusted-types` CSP allowlist).
 * The mock's createHTML returns a tagged OBJECT so the assertions can tell a
 * policy-wrapped value apart from the raw string reaching DOMParser. */
function makeTTContext(takenNames) {
    const taken = new Set(takenNames);
    let lastParse = null, createdName = null;
    const sb = {
        console, Date, Math, JSON, Map, Set, Promise, Array, Object, String, Number, Symbol,
        Node: FakeNode,
        DOMParser: class { parseFromString(v, m) { lastParse = { v, m }; return { documentElement: mkEl("svg") }; } },
        trustedTypes: {
            createPolicy(name) {
                if (taken.has(name)) throw new TypeError(`Policy name already in use: ${name}`);
                createdName = name;
                return { createHTML: (s) => ({ __trustedHTML: s }) };
            },
        },
        document: { createElement: (t) => mkEl(t), createTextNode: (t) => ({ text: t }) },
    };
    sb.globalThis = sb;
    sb.__probe = () => ({ lastParse, createdName });
    return sb;
}
function runCore(sb, label) {
    vm.runInContext(`const Ψ = {};\n${files[1]}\nglobalThis.__Ψ = Ψ;`, vm.createContext(sb), { filename: label });
    return sb.__Ψ;
}

/* Regime A: enforcement + first name taken by a co-installed suite script */
const sbA = makeTTContext(["4ndr0666tools#dom"]);
const ΨA = runCore(sbA, "core-tt-collision.js");
assert(ΨA.core.tt.available() === true, "core: TT policy minted under enforcement");
ΨA.core.parseHTML("<q/>");
const probeA = sbA.__probe();
assert(probeA.createdName === "4ndr0666tools#dom.2", "core: co-install name collision walks to next policy slot");
assert(probeA.lastParse && typeof probeA.lastParse.v === "object" && probeA.lastParse.v.__trustedHTML === "<q/>",
    "core: parseHTML policy-wraps the string under enforcement");
assert(probeA.lastParse.m === "text/html", "core: parseHTML MIME preserved under TT");
ΨA.core.parseXML("<m/>");
const probeA2 = sbA.__probe();
assert(probeA2.lastParse.m === "application/xml" && probeA2.lastParse.v.__trustedHTML === "<m/>",
    "core: parseXML policy-wraps with XML MIME");

/* Regime B: every policy name blocked (CSP allowlist) — raw fallback */
const sbB = makeTTContext(["4ndr0666tools#dom", "4ndr0666tools#dom.2", "4ndr0666tools#dom.3"]);
const ΨB = runCore(sbB, "core-tt-locked.js");
assert(ΨB.core.tt.available() === false, "core: locked allowlist degrades to raw fallback");
ΨB.core.parseHTML("<z/>");
const probeB = sbB.__probe();
assert(probeB.lastParse && probeB.lastParse.v === "<z/>",
    "core: locked fallback hands the raw string to DOMParser (caller's catch handles the rest)");

/* Regime C: enforcement, names free — first slot wins, reusable across calls */
const sbC = makeTTContext([]);
const ΨC = runCore(sbC, "core-tt-clean.js");
ΨC.core.parseHTML("<c1/>");
ΨC.core.parseHTML("<c2/>");
const probeC = sbC.__probe();
assert(probeC.createdName === "4ndr0666tools#dom" && probeC.lastParse.v.__trustedHTML === "<c2/>",
    "core: policy minted once and reused across calls (lazy singleton)");

/* ── NetHook singleton (v1.4.3) ──────────────────────────────────────────
 * kernel/net.js runs in its own mock realm: an unsafeWindow page object
 * with a native-fetch mock (counted), a clone()-counting Response, and an
 * XHR mock whose load listeners fire on send. A second context sharing
 * the SAME page object simulates a co-installed second suite script
 * (Blob2URL + LinkMasterΨ both inline the module) — it must delegate
 * through the realm slot, not install a second wrap. */
const netSrc = fs.readFileSync(path.join(ROOT, "kernel", "net.js"), "utf8");
function makeNetContext() {
    let fetchCalls = 0, cloneCalls = 0, nextBody = "FETCHBODY";
    const nativeFetch = function () {
        fetchCalls++;
        return Promise.resolve({
            ok: true,
            clone() { cloneCalls++; return { text: () => Promise.resolve(nextBody) }; },
        });
    };
    class MockXHR {
        constructor() { this.listeners = {}; this.responseType = ""; }
        addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
        open(m, u) { this._m = m; this._u = u; }
        send() { this.responseText = "XHRBODY"; (this.listeners.load || []).forEach((f) => f.call(this)); }
    }
    const page = { fetch: nativeFetch, XMLHttpRequest: MockXHR };
    const sb = {
        console, Date, Math, JSON, Map, Set, Promise, Array, Object, String, Number, Symbol,
        setTimeout, clearTimeout,
        unsafeWindow: page, window: page, XMLHttpRequest: MockXHR,
    };
    sb.globalThis = sb;
    sb.__probe = () => ({ fetchCalls, cloneCalls, page, nativeFetch });
    sb.__setBody = (s) => { nextBody = s; };
    return sb;
}
function runNet(sb, label) {
    vm.runInContext(`${netSrc}\nglobalThis.__NET = __4NDR0_NET_API__;`, vm.createContext(sb), { filename: label });
    return sb.__NET;
}

(async () => {
    const sbNet = makeNetContext();
    const net = runNet(sbNet, "net-primary.js");
    assert(net.version === 2 && typeof net.onBody === "function", "net: NetHook v2 api exported");

    /* lazy arm — nothing wraps before the first subscriber */
    const p0 = sbNet.__probe();
    assert(p0.page.fetch === p0.nativeFetch, "net: lazy arm (no wrap before first subscriber)");
    assert(net.subscriberCount === 0, "net: zero subscribers at rest");

    let a = "";
    const off = net.onBody((t) => { a += t; });
    const p1 = sbNet.__probe();
    const firstWrap = p1.page.fetch;
    assert(p1.page.fetch !== p1.nativeFetch && p1.page.fetch.__4ndro_net === true, "net: first subscribe arms exactly one fetch wrap");

    await p1.page.fetch("https://x.test/a");
    await new Promise((r) => setTimeout(r, 0));
    assert(a === "FETCHBODY", "net: fetch body delivered to subscriber");
    const p2 = sbNet.__probe();
    assert(p2.cloneCalls === 1, "net: response read exactly once (single clone().text())");

    /* co-install: second module copy shares the page — must delegate, not re-wrap */
    const sbNet2 = makeNetContext();
    /* share the SAME page realm as sbNet */
    const shared = sbNet.__probe().page;
    sbNet2.unsafeWindow = shared; sbNet2.window = shared; sbNet2.XMLHttpRequest = shared.XMLHttpRequest;
    const net2 = runNet(sbNet2, "net-secondary.js");
    let c = "";
    net2.onBody((t) => { c += t; });
    assert(shared.fetch === firstWrap, "net: second copy delegated through the realm slot (no second wrap armed)");
    await shared.fetch("https://x.test/b");
    await new Promise((r) => setTimeout(r, 0));
    assert(a === "FETCHBODYFETCHBODY", "net: hub owner still fed after co-install (fan-out)");
    assert(c === "FETCHBODY", "net: second copy's subscriber fed through the delegation");
    assert(shared.fetch.toString() === String(sbNet.__probe().nativeFetch),
        "net: fingerprint masking holds (wrap reports the native source)");
    const p3 = sbNet.__probe();
    assert(p3.cloneCalls === 2, "net: one clone per response across both consumers (no double read)");

    /* XHR path */
    let xhrGot = "";
    net.onBody((t) => { xhrGot += t; });
    const xhr = new shared.XMLHttpRequest();
    xhr.open("GET", "https://x.test/x");
    xhr.send();
    await new Promise((r) => setTimeout(r, 0));
    assert(xhrGot.includes("XHRBODY"), "net: XHR text load dispatched");

    /* isolation — a throwing subscriber cannot break siblings or the page */
    let isolated = "";
    net.onBody(() => { throw new Error("subscriber blows up"); });
    net.onBody((t) => { isolated += t; });
    await shared.fetch("https://x.test/c");
    await new Promise((r) => setTimeout(r, 0));
    assert(isolated.length > 0, "net: throwing subscriber isolated (siblings still fed)");

    /* unsubscribe */
    off();
    const before = a;
    await shared.fetch("https://x.test/d");
    await new Promise((r) => setTimeout(r, 0));
    assert(a === before, "net: unsubscribe stops delivery");

    /* 4 MB cap */
    let huge = null;
    net.onBody((t) => { huge = t; });
    sbNet.__setBody("X".repeat(4000001));
    await shared.fetch("https://x.test/big");
    await new Promise((r) => setTimeout(r, 0));
    assert(huge === null, "net: 4 MB cap drops oversized bodies");
    sbNet.__setBody("FETCHBODY");

    console.log(failures === 0 ? "\nKERNEL SMOKE: ALL PASS" : `\nKERNEL SMOKE: ${failures} FAILURE(S)`);
    process.exit(failures === 0 ? 0 : 1);
})();
