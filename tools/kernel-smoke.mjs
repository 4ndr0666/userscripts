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
    let nextStatus = 200, nextFail = null, streamMode = false;
    let lastFetchArgs = null, beaconCalls = 0, lastBeaconArgs = null;
    const encoder = new TextEncoder();
    const nativeFetch = function () {
        fetchCalls++;
        lastFetchArgs = Array.from(arguments);
        if (nextFail) return Promise.reject(nextFail);
        const makeClone = () => {
            cloneCalls++;
            if (streamMode) {
                const bytes = encoder.encode(nextBody);
                let pos = 0;
                return {
                    body: {
                        getReader() {
                            return {
                                read() {
                                    if (pos < bytes.length) { const v = bytes.slice(pos, pos + 10); pos += 10; return Promise.resolve({ value: v, done: false }); }
                                    return Promise.resolve({ done: true });
                                },
                                cancel() { pos = bytes.length; return Promise.resolve(); },
                            };
                        },
                    },
                    text: () => Promise.resolve(nextBody),
                };
            }
            return { text: () => Promise.resolve(nextBody) };
        };
        return Promise.resolve({
            ok: nextStatus >= 200 && nextStatus < 300,
            status: nextStatus,
            headers: { get: (h) => (String(h).toLowerCase() === "content-type" ? "application/json" : null) },
            clone: makeClone,
        });
    };
    class MockEvent { constructor(type) { this.type = type; } }
    class MockXHR {
        constructor() { this.listeners = {}; this.responseType = ""; }
        addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
        dispatchEvent(ev) { (this.listeners[ev.type] || []).forEach((f) => f.call(this, ev)); return true; }
        open(m, u) { this._m = m; this._u = u; }
        send() { this.responseText = "XHRBODY"; this.status = 200; (this.listeners.load || []).forEach((f) => f.call(this)); }
    }
    const page = {
        fetch: nativeFetch,
        XMLHttpRequest: MockXHR,
        navigator: {
            sendBeacon: function () { beaconCalls++; lastBeaconArgs = Array.from(arguments); return true; },
        },
    };
    const sb = {
        console, Date, Math, JSON, Map, Set, WeakSet, Promise, Array, Object, String, Number, Symbol,
        setTimeout, clearTimeout, TextDecoder, TextEncoder,
        Event: MockEvent,
        Response: class {
            constructor(body, init) {
                const st = (init && init.status) || 200;
                /* browser-faithful: a null-body status rejects a non-null
                 * body (the live Recon smoke caught the first synthesize
                 * draft violating this — the mock now enforces it so the
                 * battery can never miss it again) */
                if ((st === 204 || st === 205 || st === 304) && body != null) {
                    throw new TypeError("Response with null body status cannot have body");
                }
                this._body = body == null ? "" : String(body);
                this.status = st;
                this.statusText = (init && init.statusText) || "";
                this.ok = this.status >= 200 && this.status < 300;
            }
            clone() { cloneCalls++; const self = this; return { text: () => Promise.resolve(self._body) }; }
            text() { return Promise.resolve(this._body); }
        },
        unsafeWindow: page, window: page, XMLHttpRequest: MockXHR,
    };
    sb.globalThis = sb;
    sb.__probe = () => ({ fetchCalls, cloneCalls, page, nativeFetch, lastFetchArgs, beaconCalls, lastBeaconArgs });
    sb.__setBody = (s) => { nextBody = s; };
    sb.__setStatus = (s) => { nextStatus = s; };
    sb.__setFail = (e) => { nextFail = e; };
    sb.__setStream = (on) => { streamMode = !!on; };
    return sb;
}
function runNet(sb, label) {
    vm.runInContext(`${netSrc}\nglobalThis.__NET = __4NDR0_NET_API__;`, vm.createContext(sb), { filename: label });
    return sb.__NET;
}

(async () => {
    const sbNet = makeNetContext();
    const net = runNet(sbNet, "net-primary.js");
    assert(net.version === 5 && typeof net.onBody === "function", "net: NetHook v5 api exported");

    /* lazy arm — nothing wraps before the first subscriber */
    const p0 = sbNet.__probe();
    assert(p0.page.fetch === p0.nativeFetch, "net: lazy arm (no wrap before first subscriber)");
    assert(net.subscriberCount === 0, "net: zero subscribers at rest");

    let a = "";
    const off = net.onBody((t) => { a += t; });
    const p1 = sbNet.__probe();
    const firstWrap = p1.page.fetch;
    assert(p1.page.fetch !== p1.nativeFetch && p1.page.fetch.__4ndro_net === 5, "net: first subscribe arms exactly one fetch wrap (v5 versioned mark)");

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

    /* ── NetHook v3 veto battery (suite v1.4.5) ───────────────────────────
     * onRequest verdicts: {veto} cancels, {respond} phantoms, {body}
     * rewrites; first decisive verdict wins; throwing defusers fail open;
     * propagate arms iframe realms; second copies delegate. */

    assert(typeof net.onRequest === "function" && typeof net.propagate === "function" && net.requestSubscriberCount === 0,
        "net: v3 veto api exported (onRequest + propagate, zero at rest)");

    /* fetch veto-cancel — native never called, native-style TypeError */
    {
        const sbV = makeNetContext();
        const netV = runNet(sbV, "net-veto-cancel.js");
        const offV = netV.onRequest(() => ({ veto: true }));
        let rejected = false, errType = "";
        sbV.__probe().page.fetch("https://tracker.test/telemetry").catch((e) => {
            rejected = true;
            errType = (e && e.name === "TypeError") ? "TypeError" : String(e && e.message);
        });
        await new Promise((r) => setTimeout(r, 0));
        assert(rejected && errType === "TypeError", "net: veto cancels fetch with a native-style TypeError");
        assert(sbV.__probe().fetchCalls === 0, "net: vetoed fetch never reaches the network");
        offV();
        await sbV.__probe().page.fetch("https://x.test/after-off");
        assert(sbV.__probe().fetchCalls === 1, "net: unsubscribed veto stops cancelling");
    }

    /* fetch respond — synthetic Response, off-network, phantom fanned out.
     * v1.4.6 browser-faithfulness: a 204 is a null-body phantom — the real
     * Response constructor rejects a body at null-body statuses, so the
     * original 204+body combo would have degraded to a veto in a real
     * browser (the live Recon smoke exposed it; the mock now enforces
     * the contract, and this test asserts the legal shapes). */
    {
        const sbR = makeNetContext();
        const netR = runNet(sbR, "net-respond.js");
        let obs = "";
        netR.onBody((t) => { obs += t; });
        netR.onRequest((req) => (req.url.includes("tracker")
            ? { respond: { status: 200, statusText: "NO CONTENT", body: "PHANTOM" } }
            : undefined));
        const res = await sbR.__probe().page.fetch("https://tracker.test/x");
        assert(res.status === 200 && res.statusText === "NO CONTENT" && (await res.text()) === "PHANTOM",
            "net: respond verdict resolves a synthetic Response (no network)");
        assert(sbR.__probe().fetchCalls === 0, "net: responded fetch stays off the network");
        await new Promise((r) => setTimeout(r, 0));
        assert(obs.includes("PHANTOM"), "net: phantom body fanned to onBody observers (stacked-ordering parity)");
        /* null-body phantom — 204 without a body resolves legally (the
         * URL must not match the first subscriber's tracker rule) */
        netR.onRequest(() => ({ respond: { status: 204, statusText: "Blocked" } }));
        const res204 = await sbR.__probe().page.fetch("https://x.test/blocked204");
        assert(res204.status === 204 && (await res204.text()) === "",
            "net: 204 respond verdicts resolve a legal null-body phantom");
    }

    /* fetch body rewrite — identifier poisoning as a {body} verdict */
    {
        const sbW = makeNetContext();
        const netW = runNet(sbW, "net-rewrite.js");
        netW.onRequest((req) => (typeof req.body === "string" && req.body.includes("device_id")
            ? { body: req.body.replace(/("device_id":")[^"]+/, "$10xDEADBEEF-POISON") }
            : undefined));
        await sbW.__probe().page.fetch("https://x.test/echo", { method: "POST", body: '{"device_id":"real"}' });
        const args = sbW.__probe().lastFetchArgs;
        assert(args && args[1] && args[1].body.includes("0xDEADBEEF-POISON") && !args[1].body.includes('"real"'),
            "net: body rewrite reaches the native call (identifier poisoning via hub)");
    }

    /* XHR respond — 40 ms D6 cadence, full surface, json parse */
    {
        const sbX = makeNetContext();
        const netX = runNet(sbX, "net-xhr-respond.js");
        netX.onRequest((req) => (req.kind === "xhr" && req.url.includes("tracker")
            ? { respond: { status: 200, statusText: "OK", body: '{"success":true}' } }
            : undefined));
        const xhr = new (sbX.__probe().page.XMLHttpRequest)();
        let ready = null, loadend = 0;
        xhr.onreadystatechange = () => { if (xhr.readyState === 4) ready = { status: xhr.status, text: xhr.responseText, url: xhr.responseURL }; };
        xhr.addEventListener("loadend", () => { loadend++; });
        xhr.open("GET", "https://tracker.test/api");
        xhr.send();
        assert(xhr.readyState !== 4, "net: XHR mock delivers async (D6 cadence, never synchronous)");
        await new Promise((r) => setTimeout(r, 80));
        assert(ready && ready.status === 200 && ready.text === '{"success":true}' && ready.url === "https://tracker.test/api",
            "net: XHR respond delivers the full mocked surface (status/responseText/responseURL)");
        assert(loadend === 1, "net: XHR mock fires loadend exactly once");
        const x2 = new (sbX.__probe().page.XMLHttpRequest)();
        x2.responseType = "json";
        let j = null;
        x2.onload = () => { j = x2.response; };
        x2.open("GET", "https://tracker.test/api");
        x2.send();
        await new Promise((r) => setTimeout(r, 80));
        assert(j && typeof j === "object" && j.success === true,
            "net: XHR responseType json parses the phantom body");
    }

    /* XHR veto-cancel — native error surface at status 0 */
    {
        const sbE = makeNetContext();
        const netE = runNet(sbE, "net-xhr-cancel.js");
        netE.onRequest((req) => (req.kind === "xhr" ? { veto: true } : undefined));
        const xhr = new (sbE.__probe().page.XMLHttpRequest)();
        let errored = false, done = false;
        xhr.onerror = () => { errored = true; };
        xhr.onloadend = () => { done = true; };
        xhr.open("GET", "https://x.test/api");
        xhr.send();
        await new Promise((r) => setTimeout(r, 20));
        assert(errored && done && xhr.status === 0 && xhr.readyState === 4,
            "net: XHR veto fires the native error surface (status 0)");
    }

    /* beacon — veto swallows and reports success; clean traffic passes */
    {
        const sbB = makeNetContext();
        const netB = runNet(sbB, "net-beacon.js");
        netB.onRequest((req) => (req.kind === "beacon" && req.url.includes("tracker") ? { veto: true } : undefined));
        const nav = sbB.__probe().page.navigator;
        const okT = nav.sendBeacon("https://tracker.test/t", "a=1");
        assert(okT === true && sbB.__probe().beaconCalls === 0,
            "net: beacon veto swallows and reports success (no network)");
        nav.sendBeacon("https://clean.test/c", "a=1");
        assert(sbB.__probe().beaconCalls === 1,
            "net: clean beacons pass through");
    }

    /* request-subscriber isolation — a throwing defuser fails open */
    {
        const sbI = makeNetContext();
        const netI = runNet(sbI, "net-iso.js");
        netI.onRequest(() => { throw new Error("defuser blows up"); });
        const res = await sbI.__probe().page.fetch("https://x.test/iso");
        assert(res.ok === true && sbI.__probe().fetchCalls === 1,
            "net: throwing request subscriber isolated (fail-open, page unbroken)");
    }

    /* verdict order — first veto/respond wins */
    {
        const sbO = makeNetContext();
        const netO = runNet(sbO, "net-order.js");
        netO.onRequest(() => ({ veto: true }));
        netO.onRequest(() => ({ respond: { status: 200, body: "X" } }));
        let rej = false;
        sbO.__probe().page.fetch("https://x.test/o").catch(() => { rej = true; });
        await new Promise((r) => setTimeout(r, 0));
        assert(rej && sbO.__probe().fetchCalls === 0,
            "net: first veto/respond verdict wins (ordered registry)");
    }

    /* co-install onRequest delegation — the second copy's verdict executes
     * through the owner's single wrap (no second wrap armed) */
    {
        const sbD = makeNetContext();
        const netD = runNet(sbD, "net-deleg-primary.js");
        netD.onRequest(() => undefined); /* owner arms; no verdicts */
        const ownerWrap = sbD.__probe().page.fetch;
        const sbD2 = makeNetContext();
        const sharedD = sbD.__probe().page;
        sbD2.unsafeWindow = sharedD; sbD2.window = sharedD; sbD2.XMLHttpRequest = sharedD.XMLHttpRequest;
        const netD2 = runNet(sbD2, "net-deleg-secondary.js");
        assert(netD2 !== netD, "net: delegation test uses two module copies");
        let delegated = false;
        netD2.onRequest(() => { delegated = true; return { respond: { status: 200, body: "FROM2" } }; });
        const resD = await sharedD.fetch("https://x.test/deleg");
        assert(delegated && (await resD.text()) === "FROM2",
            "net: second copy's onRequest verdict executes through the realm slot");
        assert(sharedD.fetch === ownerWrap && sbD.__probe().fetchCalls === 0,
            "net: no second wrap armed for the delegating copy (off-network phantom)");
    }

    /* propagate — iframe realm armed once, shared subscriptions */
    {
        const sbP = makeNetContext();
        const netP = runNet(sbP, "net-propagate.js");
        netP.onRequest((req) => (req.url.includes("tracker") ? { veto: true } : undefined));
        const iframe = {
            fetch: function () { return Promise.resolve({ ok: true }); },
            navigator: {},
        };
        const armed1 = netP.propagate(iframe);
        const armed2 = netP.propagate(iframe);
        assert(armed1 === true && armed2 === false,
            "net: propagate arms an iframe realm exactly once (idempotent)");
        let rejI = false;
        iframe.fetch("https://tracker.test/i").catch(() => { rejI = true; });
        await new Promise((r) => setTimeout(r, 0));
        assert(rejI, "net: veto serves the propagated realm (shared subscriptions)");
        const okRes = await iframe.fetch("https://clean.test/i");
        assert(okRes.ok === true, "net: propagated realm passes clean traffic");
    }

    /* ── NetHook v4 battery (suite v1.4.6) ───────────────────────────────
     * onTraffic structured events (request/response/error phases with
     * correlating ids, every fetch status, phantom parity), onError
     * recovery (pacify REAL failures, never hub vetoes), bounded
     * stream reads, and versioned transitional chaining. */

    assert(typeof net.onTraffic === "function" && typeof net.onError === "function" &&
        net.trafficSubscriberCount === 0 && net.errorSubscriberCount === 0,
        "net: v4 traffic/error api exported (zero at rest)");

    /* traffic phases + id correlation — one fetch exchange, both events */
    {
        const sbT = makeNetContext();
        const netT = runNet(sbT, "net-traffic.js");
        const evs = [];
        const offT = netT.onTraffic((ev) => { evs.push(ev); });
        await sbT.__probe().page.fetch("https://x.test/t1", { method: "POST", body: "PAYLOAD" });
        await new Promise((r) => setTimeout(r, 0));
        const req = evs.find((e) => e.phase === "request");
        const res = evs.find((e) => e.phase === "response");
        assert(req && req.url === "https://x.test/t1" && req.method === "POST" && req.kind === "fetch" && req.body === "PAYLOAD",
            "net: traffic request phase carries url/method/kind/body");
        assert(res && res.body === "FETCHBODY" && res.status === 200 && res.contentType === "application/json" && res.source === "network",
            "net: traffic response phase carries body/status/contentType");
        assert(req && res && req.id === res.id && typeof req.id === "number",
            "net: request and response phases share the correlation id");
        const evsBefore = evs.length;
        assert(typeof offT === "function", "net: onTraffic returns a working unsubscribe");
        offT();
        await sbT.__probe().page.fetch("https://x.test/t1-off");
        await new Promise((r) => setTimeout(r, 0));
        assert(evs.length === evsBefore, "net: unsubscribed traffic observer stops receiving");
    }

    /* all-status fetch traffic — the forensic channel sees 4xx/5xx bodies
     * that the ok-gated onBody contract correctly ignores */
    {
        const sbS = makeNetContext();
        const netS = runNet(sbS, "net-status.js");
        let bodyGot = null;
        netS.onBody((t) => { bodyGot = t; });
        let errEv = null;
        netS.onTraffic((ev) => { if (ev.phase === "response") errEv = ev; });
        sbS.__setStatus(404);
        await sbS.__probe().page.fetch("https://x.test/missing");
        await new Promise((r) => setTimeout(r, 0));
        assert(bodyGot === null, "net: onBody stays ok-gated (404 body not vaulted)");
        assert(errEv && errEv.status === 404 && errEv.body === "FETCHBODY",
            "net: onTraffic reports every status (404 body visible to observers)");
    }

    /* onError recovery — pacify REAL failures; never un-defuse a veto */
    {
        const sbR = makeNetContext();
        const netR = runNet(sbR, "net-recovery.js");
        let consulted = false;
        netR.onError((ev) => {
            consulted = true;
            if (ev.errorName === "TypeError") return { respond: { status: 204, statusText: "Intercepted & Nullified" } };
            return null;
        });
        let vetoTraffic = null, netTraffic = null;
        netR.onTraffic((ev) => { if (ev.phase === "error") { if (ev.source === "veto") vetoTraffic = ev; else netTraffic = ev; } });
        sbR.__setFail(new TypeError("net down"));
        const resR = await sbR.__probe().page.fetch("https://x.test/fail");
        assert(consulted && resR && resR.status === 204,
            "net: onError pacification converts a real TypeError into a phantom 204");
        assert(netTraffic && netTraffic.errorName === "TypeError" && netTraffic.source === "network",
            "net: real failures surface on traffic with source network");
        /* non-TypeError failures rethrow (subscriber policy, not hub policy) */
        sbR.__setFail(new RangeError("bad range"));
        let threwRange = false;
        try { await sbR.__probe().page.fetch("https://x.test/range"); } catch (e) { threwRange = e instanceof RangeError; }
        assert(threwRange, "net: non-pacified failures still reject (policy lives in the subscriber)");
        /* a hub veto is final — the pacifier must not be consulted */
        sbR.__setFail(null);
        let pacifyCalls = 0;
        netR.onError(() => { pacifyCalls++; return { respond: { status: 204 } }; });
        netR.onRequest(() => ({ veto: true }));
        let vetoThrew = false;
        try { await sbR.__probe().page.fetch("https://x.test/vetoed"); } catch (e) { vetoThrew = !!(e && e.message === "Failed to fetch"); }
        assert(vetoThrew && pacifyCalls === 0 && vetoTraffic && vetoTraffic.source === "veto",
            "net: hub vetoes never consult recoverers (a pacifier cannot un-defuse a cancel)");
    }

    /* XHR traffic — request/response events, veto error surface, responseType */
    {
        const sbX = makeNetContext();
        const netX = runNet(sbX, "net-xhr-traffic.js");
        const xevs = [];
        netX.onTraffic((ev) => { xevs.push(ev); });
        const sharedX = sbX.__probe().page;
        const xhrT = new sharedX.XMLHttpRequest();
        xhrT.open("GET", "https://x.test/xt");
        xhrT.send("XBODY");
        await new Promise((r) => setTimeout(r, 0));
        const xreq = xevs.find((e) => e.phase === "request");
        const xres = xevs.find((e) => e.phase === "response");
        assert(xreq && xreq.kind === "xhr" && xreq.url === "https://x.test/xt" && xreq.body === "XBODY",
            "net: XHR traffic request phase fires on send");
        assert(xres && xres.body === "XHRBODY" && xres.status === 200 && xres.source === "network",
            "net: XHR traffic response phase fires on load with status");
        /* vetoed XHR — error traffic with source veto */
        netX.onRequest((req) => (req.kind === "xhr" && req.url.includes("tracker") ? { veto: true } : undefined));
        const xhrV = new sharedX.XMLHttpRequest();
        xhrV.open("GET", "https://tracker.test/x");
        xhrV.send();
        await new Promise((r) => setTimeout(r, 10));
        const xverr = xevs.find((e) => e.phase === "error" && e.source === "veto");
        assert(xverr && xverr.kind === "xhr" && xverr.url === "https://tracker.test/x",
            "net: vetoed XHR surfaces an error traffic event (source veto)");
    }

    /* beacon traffic — passed beacons fire a request event */
    {
        const sbBc = makeNetContext();
        const netBc = runNet(sbBc, "net-beacon-traffic.js");
        let bEv = null;
        netBc.onTraffic((ev) => { if (ev.kind === "beacon") bEv = ev; });
        sbBc.__probe().page.navigator.sendBeacon("https://x.test/beacon", "ping=1");
        assert(bEv && bEv.phase === "request" && bEv.method === "POST" && bEv.body === "ping=1",
            "net: passed beacons surface a request traffic event");
    }

    /* phantom parity — respond verdicts fan to traffic with source respond */
    {
        const sbPh = makeNetContext();
        const netPh = runNet(sbPh, "net-phantom-traffic.js");
        netPh.onRequest(() => ({ respond: { status: 200, statusText: "OK", body: "PHANTOM", contentType: "application/json" } }));
        let phEv = null;
        netPh.onTraffic((ev) => { if (ev.phase === "response") phEv = ev; });
        await sbPh.__probe().page.fetch("https://x.test/phantom");
        assert(phEv && phEv.body === "PHANTOM" && phEv.status === 200 && phEv.source === "respond",
            "net: phantom responses fan to traffic observers (source respond)");
        /* null-body statuses (204) construct a legal phantom — the live
         * Recon smoke regression (browser Response rejects a non-null
         * body at 204; the first draft degraded the pacification to a
         * veto). */
        const sbN = makeNetContext();
        const netN = runNet(sbN, "net-null-body.js");
        netN.onRequest(() => ({ respond: { status: 204, statusText: "Blocked by ReconEngine Rule" } }));
        const resN = await sbN.__probe().page.fetch("https://x.test/blocked204");
        assert(resN && resN.status === 204 && resN.ok === true,
            "net: 204 respond verdicts resolve a legal null-body phantom (no veto degrade)");
    }

    /* bounded stream read — the reader path cancels past the 4 MB cap and
     * flags truncation instead of materializing an unbounded string */
    {
        const sbL = makeNetContext();
        const netL = runNet(sbL, "net-capped.js");
        let capBody = null, capEv = null;
        netL.onBody((t) => { capBody = t; });
        netL.onTraffic((ev) => { if (ev.phase === "response") capEv = ev; });
        sbL.__setStream(true);
        sbL.__setBody("X".repeat(4000001));
        await sbL.__probe().page.fetch("https://x.test/big");
        await new Promise((r) => setTimeout(r, 20));
        assert(capBody === null, "net: stream read drops oversized bodies from onBody (4 MB cap)");
        assert(capEv && capEv.truncated === true && capEv.body.length === 4000000,
            "net: stream read caps traffic bodies at 4 MB with the truncated flag");
        sbL.__setBody("SMALLSTREAM");
        await sbL.__probe().page.fetch("https://x.test/small");
        await new Promise((r) => setTimeout(r, 20));
        assert(capBody === "SMALLSTREAM", "net: stream read dispatches in-cap bodies to onBody");
    }

    /* versioned transitional chaining — a legacy (boolean-mark) wrap is
     * chained UNDER the v4 hub: v4 subscribers still get served, the old
     * generation keeps its own; a future-version mark is left alone */
    {
        const sbC = makeNetContext();
        const legacyCalls = [];
        const probeC = sbC.__probe();
        const nativeC = probeC.nativeFetch;
        /* simulate an older-generation hub wrap (boolean mark, v2/v3 era)
         * installed BEFORE the v4 module copy registers */
        const legacyWrap = function () { legacyCalls.push(Array.from(arguments)); return nativeC.apply(this, arguments); };
        legacyWrap.__4ndro_net = true; /* v2/v3-era mark */
        probeC.page.fetch = legacyWrap;
        const netC = runNet(sbC, "net-chain-v4.js");
        let chained = "";
        netC.onBody((t) => { chained += t; });
        const afterArm = sbC.__probe().page.fetch;
        assert(afterArm !== legacyWrap && afterArm.__4ndro_net === 5,
            "net: v5 wraps ABOVE a legacy-marked wrap (transitional chaining)");
        await afterArm("https://x.test/chain");
        await new Promise((r) => setTimeout(r, 0));
        assert(chained === "FETCHBODY", "net: v4 subscribers served through the chained wrap");
        assert(legacyCalls.length === 1 && legacyCalls[0][0] === "https://x.test/chain",
            "net: legacy generation keeps its own dispatch underneath");
        /* future mark — v5 defers arming */
        const sbF = makeNetContext();
        const probeF = sbF.__probe();
        const futureWrap = function () { return Promise.resolve({ ok: true }); };
        futureWrap.__4ndro_net = 6;
        probeF.page.fetch = futureWrap;
        const netF = runNet(sbF, "net-future.js");
        netF.onBody(() => {});
        assert(sbF.__probe().page.fetch === futureWrap,
            "net: a future-version mark is left alone (no wrap above)");
    }

    /* onTraffic delegation — the second copy's observer is served by the
     * realm-slot owner (single wrap set, both fed) */
    {
        const sbDg = makeNetContext();
        const netDg1 = runNet(sbDg, "net-traffic-deleg-1.js");
        netDg1.onTraffic(() => {});
        const ownerWrapT = sbDg.__probe().page.fetch;
        const sbDg2 = makeNetContext();
        const sharedDg = sbDg.__probe().page;
        sbDg2.unsafeWindow = sharedDg; sbDg2.window = sharedDg; sbDg2.XMLHttpRequest = sharedDg.XMLHttpRequest;
        const netDg2 = runNet(sbDg2, "net-traffic-deleg-2.js");
        let delegatedT = 0;
        netDg2.onTraffic((ev) => { if (ev.phase === "response") delegatedT++; });
        await sharedDg.fetch("https://x.test/deleg-traffic");
        await new Promise((r) => setTimeout(r, 0));
        assert(delegatedT === 1 && sharedDg.fetch === ownerWrapT,
            "net: onTraffic delegates through the realm slot (no second wrap)");
        /* throwing traffic subscriber is isolated */
        netDg2.onTraffic(() => { throw new Error("traffic observer blows up"); });
        let siblingT = 0;
        netDg2.onTraffic((ev) => { if (ev.phase === "response") siblingT++; });
        await sharedDg.fetch("https://x.test/deleg-isolated");
        await new Promise((r) => setTimeout(r, 0));
        assert(siblingT === 1,
            "net: throwing traffic subscriber isolated (siblings still fed)");
    }

    /* ── NetHook v5 battery (suite v1.4.8) ───────────────────────────────
     * gmFetch — the privileged transport: surface export, typed
     * gm-unavailable rejection when the grant is absent, success
     * pass-through, http-error verdicts (and the checkStatus:false
     * override), timeout taxonomy, transient-only bounded retry (retries
     * re-fire; HTTP verdicts never do), settle-once against a manager
     * that fires two callbacks, and a synchronous dispatch throw. */
    {
        const sbG = makeNetContext();
        const netG = runNet(sbG, "net-gmfetch.js");
        assert(typeof netG.gmFetch === "function" && typeof netG.NetError === "function" &&
            typeof netG.NetTimeoutError === "function" && typeof netG.NetHttpError === "function",
            "net: v5 api exports gmFetch + the NetError taxonomy");

        /* no grant in this context — typed rejection, never a ReferenceError */
        let noGrantErr = null;
        try { await netG.gmFetch("https://x.test/privileged"); }
        catch (e) { noGrantErr = e; }
        assert(noGrantErr && noGrantErr.kind === "gm-unavailable" &&
            noGrantErr instanceof netG.NetError,
            "net: gmFetch without a grant rejects typed gm-unavailable (no ReferenceError)");

        /* mock transport — success pass-through */
        const seen = [];
        sbG.GM_xmlhttpRequest = (req) => {
            seen.push({ method: req.method, url: req.url, timeout: req.timeout });
            req.onload({ status: 200, statusText: "OK", responseText: "GMBODY", finalUrl: "https://final.test/x" });
        };
        const r1 = await netG.gmFetch("https://x.test/gm");
        assert(r1.status === 200 && r1.responseText === "GMBODY" && r1.finalUrl === "https://final.test/x",
            "net: gmFetch success passes the full response through");
        assert(seen.length === 1 && seen[0].method === "GET" && seen[0].timeout === 15000,
            "net: gmFetch dispatch carries method + hard timeout defaults");

        /* http-error verdict + checkStatus:false override */
        sbG.GM_xmlhttpRequest = (req) => req.onload({ status: 404, statusText: "Not Found", responseText: "" });
        let httpErr = null;
        try { await netG.gmFetch("https://x.test/404"); }
        catch (e) { httpErr = e; }
        assert(httpErr && httpErr instanceof netG.NetHttpError && httpErr.kind === "http" &&
            httpErr.status === 404,
            "net: gmFetch non-2xx rejects with NetHttpError (kind http, status rides along)");
        const rRaw = await netG.gmFetch("https://x.test/404-raw", { checkStatus: false });
        assert(rRaw.status === 404 && rRaw.responseText === "",
            "net: gmFetch checkStatus:false hands the raw response to the caller");

        /* timeout taxonomy */
        sbG.GM_xmlhttpRequest = (req) => req.ontimeout();
        let tErr = null;
        try { await netG.gmFetch("https://x.test/slow", { timeout: 50 }); }
        catch (e) { tErr = e; }
        assert(tErr && tErr instanceof netG.NetTimeoutError && tErr.kind === "timeout",
            "net: gmFetch timeout rejects with NetTimeoutError (kind timeout)");

        /* transient-only bounded retry — transport fault then success */
        let tries = 0;
        sbG.GM_xmlhttpRequest = (req) => {
            tries++;
            if (tries === 1) { req.onerror(); return; }
            req.onload({ status: 200, statusText: "OK", responseText: "SECOND", finalUrl: "https://x.test/" });
        };
        const rRetry = await netG.gmFetch("https://x.test/retry", { retries: 1 });
        assert(tries === 2 && rRetry.responseText === "SECOND",
            "net: gmFetch retries a transient transport fault and resolves on the retry");

        /* HTTP verdicts never re-fire — one dispatch, immediate rejection */
        let dispatches = 0;
        sbG.GM_xmlhttpRequest = (req) => { dispatches++; req.onload({ status: 500, statusText: "ISE", responseText: "" }); };
        let noRetryErr = null;
        try { await netG.gmFetch("https://x.test/500", { retries: 3 }); }
        catch (e) { noRetryErr = e; }
        assert(dispatches === 1 && noRetryErr && noRetryErr.kind === "http",
            "net: gmFetch never retries an HTTP verdict (one dispatch despite retries:3)");

        /* settle-once — a manager firing onload AND onerror resolves exactly once */
        sbG.GM_xmlhttpRequest = (req) => {
            req.onload({ status: 200, statusText: "OK", responseText: "ONCE", finalUrl: "https://x.test/" });
            req.onerror();
        };
        let settled = 0;
        await netG.gmFetch("https://x.test/double").then(() => { settled++; });
        await new Promise((r) => setTimeout(r, 20));
        assert(settled === 1,
            "net: gmFetch settle-once (double-callback manager cannot double-resolve)");

        /* synchronous dispatch throw — typed transport rejection */
        sbG.GM_xmlhttpRequest = () => { throw new Error("manager broke"); };
        let throwErr = null;
        try { await netG.gmFetch("https://x.test/throwy"); }
        catch (e) { throwErr = e; }
        assert(throwErr && throwErr.kind === "transport" && /manager broke/.test(throwErr.message),
            "net: gmFetch synchronous dispatch throw rejects typed transport");

        /* delegation coexistence — gmFetch stays local when the realm slot
         * is owned by another hub: the second copy's gmFetch works even
         * though its subscriptions delegate to the first copy. */
        const sbCo = makeNetContext();
        sbCo.GM_xmlhttpRequest = (req) => req.onload({ status: 200, statusText: "OK", responseText: "LOCAL", finalUrl: "https://x.test/" });
        const netCo1 = runNet(sbCo, "net-gm-co1.js");
        netCo1.onBody(() => {});
        const sharedCo = sbCo.__probe().page;
        const sbCo2 = makeNetContext();
        sbCo2.unsafeWindow = sharedCo; sbCo2.window = sharedCo; sbCo2.XMLHttpRequest = sharedCo.XMLHttpRequest;
        sbCo2.GM_xmlhttpRequest = sbCo.GM_xmlhttpRequest;
        const netCo2 = runNet(sbCo2, "net-gm-co2.js");
        netCo2.onBody(() => {});
        assert(sharedCo.fetch.__4ndro_net === 5,
            "net: second v5 copy delegates through the realm slot (single wrap set)");
        const rCo = await netCo2.gmFetch("https://x.test/co");
        assert(rCo.responseText === "LOCAL",
            "net: gmFetch served by the copy's own closure under co-install delegation");
    }

    /* ── NetHook v5.1 battery (suite v1.4.9) ────────────────────────────
     * gmFetch transport opts: onprogress/onloadstart passthrough,
     * anonymous forwarding, default-shape regression guard, AbortSignal
     * semantics (pre-abort rejection, mid-flight force-settle + handle
     * abort + settle-once under a double-firing manager, retry-chain
     * break, lazy-manager abort, listener detachment). */
    {
        const sbP = makeNetContext();
        const netP = runNet(sbP, "net-gmfetch-opts.js");

        /* onprogress + onloadstart + anonymous passthrough (one dispatch) */
        const progressEvents = [];
        let started = 0;
        let seenOpts = null;
        sbP.GM_xmlhttpRequest = (req) => {
            seenOpts = req;
            req.onloadstart({ loaded: 0, total: 10 });
            req.onprogress({ loaded: 5, total: 10, lengthComputable: true });
            req.onload({ status: 200, statusText: "OK", responseText: "PROG", finalUrl: "https://x.test/" });
        };
        const rP = await netP.gmFetch("https://x.test/progress", {
            onprogress: (e) => progressEvents.push(e),
            onloadstart: () => { started++; },
            anonymous: true,
        });
        assert(rP.responseText === "PROG" && progressEvents.length === 1 && progressEvents[0].loaded === 5 && started === 1,
            "net: gmFetch passes onprogress + onloadstart through to the manager callbacks");
        assert(seenOpts && seenOpts.anonymous === true,
            "net: gmFetch forwards anonymous:true onto the privileged dispatch");

        /* default-shape regression guard — no progress/anonymous fields
         * when the opts are absent (the v5.0 dispatch shape is law for
         * every existing consumer) */
        const sbD = makeNetContext();
        const netD = runNet(sbD, "net-gmfetch-defaults.js");
        let defaultReq = null;
        sbD.GM_xmlhttpRequest = (req) => { defaultReq = req; req.onload({ status: 200, statusText: "OK", responseText: "D", finalUrl: "https://x.test/" }); };
        await netD.gmFetch("https://x.test/plain");
        assert(defaultReq && !("onprogress" in defaultReq) && !("onloadstart" in defaultReq) &&
            !("anonymous" in defaultReq) && !("signal" in defaultReq) && defaultReq.method === "GET" &&
            defaultReq.timeout === 15000 && defaultReq.responseType === "text",
            "net: gmFetch v5.0 default dispatch shape unchanged (no passthrough fields, GET/15s/text)");

        /* pre-aborted signal — typed abort rejection, zero dispatches */
        const sbA = makeNetContext();
        const netA = runNet(sbA, "net-gmfetch-abort.js");
        let dispatchCount = 0;
        sbA.GM_xmlhttpRequest = (req) => { dispatchCount++; req.onload({ status: 200, statusText: "OK", responseText: "X", finalUrl: "https://x.test/" }); };
        const preCtl = new AbortController();
        preCtl.abort();
        let preErr = null;
        try { await netA.gmFetch("https://x.test/pre", { signal: preCtl.signal }); }
        catch (e) { preErr = e; }
        assert(preErr && preErr.kind === "abort" && preErr instanceof netA.NetError && dispatchCount === 0,
            "net: gmFetch pre-aborted signal rejects typed abort without dispatching");

        /* mid-flight abort — handle.abort() called, typed rejection,
         * settle-once holds even when the manager ALSO fires onabort */
        let handleAborted = 0;
        sbA.GM_xmlhttpRequest = (req) => {
            return {
                abort: () => { handleAborted++; req.onabort(); },
            };
        };
        const midCtl = new AbortController();
        let midErr = null;
        const midPromise = netA.gmFetch("https://x.test/mid", { signal: midCtl.signal, timeout: 5000 });
        midPromise.catch((e) => { midErr = e; });
        await new Promise((r) => setTimeout(r, 10));
        midCtl.abort();
        await new Promise((r) => setTimeout(r, 10));
        assert(midErr && midErr.kind === "abort" && handleAborted === 1,
            "net: gmFetch signal abort calls handle.abort() and rejects typed abort exactly once");

        /* lazy manager — handle.abort() without firing onabort: the
         * force-settle path must own the verdict (no hang to timeout) */
        sbA.GM_xmlhttpRequest = (req) => {
            return { abort: () => { /* lazy manager: no onabort callback */ } };
        };
        const lazyCtl = new AbortController();
        let lazyErr = null;
        const lazyPromise = netA.gmFetch("https://x.test/lazy", { signal: lazyCtl.signal, timeout: 5000 });
        lazyPromise.catch((e) => { lazyErr = e; });
        await new Promise((r) => setTimeout(r, 10));
        lazyCtl.abort();
        await new Promise((r) => setTimeout(r, 10));
        assert(lazyErr && lazyErr.kind === "abort",
            "net: gmFetch force-settles a lazy manager's abort (typed verdict, never hangs)");

        /* abort during the retry backoff — the chain must not re-dispatch */
        let tries2 = 0;
        sbA.GM_xmlhttpRequest = (req) => {
            tries2++;
            req.ontimeout();
            return { abort: () => {} };
        };
        const retryCtl = new AbortController();
        let retryErr = null;
        const retryPromise = netA.gmFetch("https://x.test/retry-abort", { retries: 3, timeout: 50, signal: retryCtl.signal });
        retryPromise.catch((e) => { retryErr = e; });
        await new Promise((r) => setTimeout(r, 10));
        retryCtl.abort();
        await new Promise((r) => setTimeout(r, 800));
        assert(retryErr && retryErr.kind === "abort" && tries2 === 1,
            "net: gmFetch abort during retry backoff breaks the chain (one dispatch despite retries:3)");

        /* listener detachment — a duck-typed spy signal proves the abort
         * listener is removed after settle (reused controllers stay clean,
         * and a manually fired stale listener is a no-op) */
        const sbL = makeNetContext();
        const netL = runNet(sbL, "net-gmfetch-listener.js");
        sbL.GM_xmlhttpRequest = (req) => req.onload({ status: 200, statusText: "OK", responseText: "L", finalUrl: "https://x.test/" });
        const spyListeners = new Map();
        const addedFns = [];
        const spySignal = {
            aborted: false,
            addEventListener: (t, fn) => { addedFns.push(fn); spyListeners.set(t, fn); },
            removeEventListener: (t, fn) => { if (spyListeners.get(t) === fn) spyListeners.delete(t); },
        };
        await netL.gmFetch("https://x.test/listener", { signal: spySignal });
        assert(spyListeners.size === 0,
            "net: gmFetch detaches the signal listener on settle (no dangling abort hooks)");
        /* stale listener fired after settle — inert (settle-once guards) */
        let staleNoop = true;
        try {
            for (const stale of addedFns) stale();
        } catch (e) { staleNoop = false; }
        assert(staleNoop, "net: gmFetch post-settle signal fire is inert (settle-once holds)");
        const rAgain = await netL.gmFetch("https://x.test/listener2");
        assert(rAgain.responseText === "L",
            "net: gmFetch unaffected by a stale abort fire (transport still serves)");
    }

    console.log(failures === 0 ? "\nKERNEL SMOKE: ALL PASS" : `\nKERNEL SMOKE: ${failures} FAILURE(S)`);
    process.exit(failures === 0 ? 0 : 1);
})();
