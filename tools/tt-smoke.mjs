#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/tt-smoke.mjs — live Trusted-Types integration smoke harness (v1.4.3)
 * ----------------------------------------------------------------------------
 * Operator mandate: "Per-site live integration testing (browser-automation
 * smoke of the settings consoles on TT and non-TT hosts) — the static + mock
 * evidence is strong; live field confirmation closes it."
 *
 * This is a ZERO-DEPENDENCY local harness server. It serves:
 *
 *   /tt/?script=HostWarp       Trusted Types ENFORCED (the exact regime that
 *                              killed the v1.4.1 consoles: glyphEl()'s
 *                              DOMParser sink threw TrustedHTML assignment)
 *   /tt-locked/?script=HostWarp TT enforced + a policy-name allowlist that
 *                              permits the kernel's probe names (locked CSP)
 *   /nott/?script=HostWarp     no TT at all (regression parity)
 *   /gm-shim.js                a userscript-manager mock (GM_* APIs) so the
 *                              dist installables run as plain page scripts
 *   /dist/<file>               the built installables
 *   /api/media.m3u8            a fake HLS manifest full of media URLs
 *   /api/probe.json            JSON carrying a direct media URL
 *
 * The harness page collects diagnostics into window.__SMOKE__ (page errors,
 * console.error calls, CSP violation events, captured GM menu commands) and
 * can auto-invoke a script's settings-console menu command (?autopanel=1)
 * plus run the wire probes (?probe=wire) for the NetHook consumers.
 *
 * Run:      node tools/tt-smoke.mjs          (serves on 127.0.0.1:8765)
 *           node tools/tt-smoke.mjs --port 9000
 * Drive:    any browser — open the URLs above; DevTools console:
 *              __SMOKE__                     diagnostics
 *              __SMOKE__.report()            summary
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");

const port = (() => {
    const i = process.argv.indexOf("--port");
    return i !== -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : 8765;
})();

const M3U8 = [
    "#EXTM3U",
    "#EXT-X-VERSION:6",
    "#EXT-X-STREAM-INF:BANDWIDTH=1240000,RESOLUTION=1280x720",
    "https://smoke.test/video/seg-720.mp4",
    "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1920x1080",
    "https://smoke.test/video/master-1080.m3u8",
    "",
].join("\n");

const PROBE_JSON = JSON.stringify({
    probe: true,
    candidates: [
        "https://smoke.test/cdn/asset-final.mp4",
        "https://smoke.test/cdn/clip.webm",
    ],
});

function gmShim() {
    return `(function () {
    'use strict';
    const store = new Map();
    const menu = [];
    const clips = [];
    window.__GM_MENU__ = menu;
    window.__GM_CLIPS__ = clips;
    function GM_getValue(k, d) { return store.has(k) ? store.get(k) : d; }
    function GM_setValue(k, v) { store.set(k, v); }
    function GM_deleteValue(k) { store.delete(k); }
    function GM_listValues() { return [...store.keys()]; }
    function GM_addValueChangeListener() { return 1; }
    function GM_removeValueChangeListener() {}
    function GM_addStyle(css) {
        const s = document.createElement('style');
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
        return s;
    }
    function GM_registerMenuCommand(label, fn) { menu.push({ label: String(label), fn }); }
    function GM_setClipboard(text) { clips.push(String(text)); }
    function GM_xmlhttpRequest(details) {
        fetch(details.url, {
            method: details.method || 'GET',
            headers: details.headers || {},
            body: details.data || null,
        }).then(async (r) => {
            const text = await r.text();
            if (details.onload) details.onload({
                status: r.status, statusText: r.statusText,
                responseText: text, finalUrl: details.url,
                responseHeaders: [...r.headers.entries()].map(([k, v]) => k + ': ' + v).join('\\r\\n'),
            });
        }).catch((e) => { if (details.onerror) details.onerror({ error: String(e) }); });
    }
    function GM_download(details, cb) { if (typeof cb === 'function') cb(); }
    function GM_openInTab() { return { close() {} }; }
    window.GM_info = { script: { name: 'tt-smoke', version: '0' }, scriptHandler: 'tt-smoke', scriptMetaStr: '' };
    Object.assign(window, {
        GM_getValue, GM_setValue, GM_deleteValue, GM_listValues,
        GM_addValueChangeListener, GM_removeValueChangeListener,
        GM_addStyle, GM_registerMenuCommand, GM_setClipboard,
        GM_xmlhttpRequest, GM_download, GM_openInTab,
    });
})();`;
}

function harnessPage(ttMode) {
    const csp = ttMode === "enforced"
        ? "require-trusted-types-for 'script'"
        : ttMode === "locked"
            ? "require-trusted-types-for 'script'; trusted-types 4ndr0666tools#dom 4ndr0666tools#dom.2 4ndr0666tools#dom.3"
            : "";
    return (scriptName, probe, autopanel) => `<!doctype html>
<html><head><meta charset="utf-8">
<title>tt-smoke — ${scriptName} (${ttMode})</title>
<script>
window.__SMOKE__ = { mode: ${JSON.stringify(ttMode)}, script: ${JSON.stringify(scriptName)},
    errors: [], csp: [], menu: [], notes: [], ready: false };
window.addEventListener('error', function (e) {
    __SMOKE__.errors.push('pageerror: ' + (e.message || String(e)));
});
document.addEventListener('securitypolicyviolation', function (e) {
    __SMOKE__.csp.push(e.violatedDirective + ' <- ' + (e.blockedURI || '').slice(0, 80));
});
(function () {
    var ce = console.error;
    console.error = function () {
        __SMOKE__.errors.push('console.error: ' + Array.prototype.map.call(arguments, String).join(' '));
        return ce.apply(console, arguments);
    };
})();
__SMOKE__.report = function () {
    var hud = document.querySelector('.a4-window');
    var sheet = document.getElementById('a4-glass-stylesheet-v1');
    var netSlot = window.__4NDR0_NET__ || null;
    return {
        errors: __SMOKE__.errors, csp: __SMOKE__.csp,
        hudMounted: !!(hud && hud.isConnected),
        glassStylesheet: !!sheet,
        netSlot: !!(netSlot && typeof netSlot.onBody === 'function'),
        netSubscribers: netSlot ? netSlot.subscriberCount : 0,
        menuCommands: (window.__GM_MENU__ || []).length,
    };
};
</script>
${csp ? `<meta http-equiv="Content-Security-Policy" content="${csp}">` : ""}
</head>
<body>
<h3 style="font-family:monospace">tt-smoke harness — ${scriptName} — ${ttMode}</h3>
<p style="font-family:monospace;font-size:11px">diagnostics in <code>window.__SMOKE__</code> · summary via <code>__SMOKE__.report()</code></p>
<script src="/gm-shim.js"></script>
<script src="/dist/${encodeURIComponent(scriptName)}"></script>
<script>
(function () {
    function runProbes() {
        return Promise.all([
            fetch('/api/media.m3u8').then(function (r) { return r.text(); }).catch(function (e) { __SMOKE__.errors.push('probe fetch: ' + e); }),
            new Promise(function (resolve) {
                var x = new XMLHttpRequest();
                x.open('GET', '/api/probe.json');
                x.onload = function () { resolve(x.responseText); };
                x.onerror = function () { __SMOKE__.errors.push('probe xhr failed'); resolve(''); };
                x.send();
            }),
        ]);
    }
    function autoPanel() {
        var menu = window.__GM_MENU__ || [];
        var hit = menu.find(function (m) { return /settings console/i.test(m.label); })
            || menu.find(function (m) { return /URL Vault/i.test(m.label); });
        if (hit) {
            try { hit.fn(); __SMOKE__.notes.push('invoked: ' + hit.label); }
            catch (e) { __SMOKE__.errors.push('panel invoke: ' + (e && e.message)); }
        } else {
            __SMOKE__.notes.push('no settings/vault menu command found');
        }
    }
    setTimeout(function () {
        var work = ${JSON.stringify(probe)} ? runProbes() : Promise.resolve();
        work.then(function () {
            setTimeout(function () {
                if (${JSON.stringify(autopanel)}) autoPanel();
                setTimeout(function () { __SMOKE__.ready = true; }, 400);
            }, 300);
        });
    }, 250);
})();
</script>
</body></html>`;
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const send = (code, type, body) => {
        res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
        res.end(body);
    };

    if (url.pathname === "/gm-shim.js") return send(200, "application/javascript; charset=utf-8", gmShim());
    if (url.pathname === "/api/media.m3u8") return send(200, "application/vnd.apple.mpegurl", M3U8);
    if (url.pathname === "/api/probe.json") return send(200, "application/json", PROBE_JSON);

    if (url.pathname.startsWith("/dist/")) {
        const name = decodeURIComponent(url.pathname.slice("/dist/".length));
        if (!/^4ndr0tools - [^/]+\.user\.js$/.test(name) || !fs.existsSync(path.join(DIST, name))) {
            return send(404, "text/plain", "unknown dist file\n");
        }
        return send(200, "text/javascript; charset=utf-8", fs.readFileSync(path.join(DIST, name), "utf8"));
    }

    const ttRoute = url.pathname === "/tt/" ? "enforced"
        : url.pathname === "/tt-locked/" ? "locked"
        : url.pathname === "/nott/" ? "none" : null;
    if (ttRoute) {
        const script = url.searchParams.get("script") || "HostWarp";
        const candidates = fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js"));
        const match = candidates.find((f) => f.replace(/4ndr0tools - /, "").replace(/\.user\.js$/, "") === script)
            || candidates.find((f) => f.includes(script));
        if (!match) return send(404, "text/plain", `no dist script matches "${script}"\n`);
        const probe = url.searchParams.has("probe") || url.searchParams.get("probe") === "wire";
        const autopanel = url.searchParams.has("autopanel");
        return send(200, "text/html; charset=utf-8", harnessPage(ttRoute)(match, probe, autopanel));
    }

    send(404, "text/plain", "routes: /tt/ /tt-locked/ /nott/ ?script=…&probe=wire&autopanel · /gm-shim.js · /api/media.m3u8 · /api/probe.json\n");
});

server.listen(port, "127.0.0.1", () => {
    console.log(`tt-smoke harness — http://127.0.0.1:${port}`);
    console.log(`  /tt/?script=HostWarp&autopanel        (TT enforced — the console-death regime)`);
    console.log(`  /tt-locked/?script=PageCraft&autopanel (TT + policy-name allowlist)`);
    console.log(`  /nott/?script=HostWarp&autopanel       (no TT — parity)`);
    console.log(`  /tt/?script=Blob2URL&probe=wire&autopanel (NetHook wire capture)`);
});
