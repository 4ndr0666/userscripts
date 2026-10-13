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
 *   /api/telemetry             a tracker-URL-shaped endpoint (matches the
 *                              Akasha Silence blocklist) — server-hit
 *                              counted; the veto probe asserts it stays at
 *                              ZERO while fetch/XHR/beacon all get phantoms
 *   /api/echo                  POST body echo (identifier-poisoning proof)
 *   /api/hits                  the /api/telemetry hit counter
 *   /api/album/stats/<id>      bunkr stats-shaped endpoint (hit-counted —
 *                              the Bunkr observer probe asserts the FAKE
 *                              body resolves and the counter stays ZERO)
 *   /api/flow.json             Prompt-Master flow-credit JSON ({left,total})
 *                              — drives the #pm-flow-credit-chip proof
 *   /api/v1/feed/timeline     Instagram++ Schema-A feed payload (drives the
 *                              harvest-engine delivery proof)
 *   /_/BardChatUi/data/…      gemini batchexecute-shaped endpoint (hit-
 *                              counted — the Watermark RPC probe asserts
 *                              clean passthrough, exactly one server hit)
 *
 * The harness page collects diagnostics into window.__SMOKE__ (page errors,
 * console.error calls, CSP violation events, captured GM menu commands,
 * console.log captures) and can auto-invoke a script's settings-console
 * menu command (?autopanel=1), run the wire probes (?probe=wire) for the
 * NetHook consumers, run the veto probe (?probe=veto) for the NetHook v3
 * defusers (request cancel / phantom-respond / body-rewrite, live), or run
 * the observer probe (?probe=observer) for the NetHook v4 observer family
 * (structured-traffic delivery, live).
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
        /* [v1.4.8 gmFetch regime] the GPD true-direct probe targets the
         * REAL uc?export=download URL — remap it onto the harness mock so
         * the live smoke never leaves 127.0.0.1 (finalUrl keeps the
         * original, so the resolver's form-mode semantics are exact). */
        var target = String(details.url || '').replace(/^https:\\/\\/drive\\.google\\.com\\/uc\\?/, '/api/drive-uc?');
        fetch(target, {
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
    /* [R3 shim fidelity] Tampermonkey always provides unsafeWindow (the
     * raw page window). Watermark++ and m3u8++ reference it at boot —
     * without the alias they die on the harness (live-matrix proof). */
    window.unsafeWindow = window;
    Object.assign(window, {
        GM_getValue, GM_setValue, GM_deleteValue, GM_listValues,
        GM_addValueChangeListener, GM_removeValueChangeListener,
        GM_addStyle, GM_registerMenuCommand, GM_setClipboard,
        GM_xmlhttpRequest, GM_download, GM_openInTab,
    });
})();`;
}

function m3u8ParserStub() {
    /* Minimal stand-in for the m3u8-parser @require library — the real
     * library ships via the userscript manager's @require channel, which a
     * plain harness page cannot reproduce. doM3U consumes exactly:
     * new m3u8Parser.Parser() .push(text) .end() .manifest with
     * segments[{uri,duration}] and playlists[{uri}] — the stub derives
     * both from the standard EXTINF/URI line grammar. */
    return `window.m3u8Parser = { Parser: function () {
    this._chunks = [];
    this.push = function (chunk) { this._chunks.push(String(chunk || '')); };
    this.end = function () {
        var lines = this._chunks.join('\\n').split(/\\r?\\n/);
        this.manifest = { segments: [], playlists: [] };
        var duration = 0;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf('#EXTINF:') === 0) {
                duration = parseFloat(line.slice(8)) || 0;
            } else if (line.indexOf('#EXT-X-STREAM-INF:') === 0) {
                var next = (lines[i + 1] || '').trim();
                if (next && next.charAt(0) !== '#') this.manifest.playlists.push({ uri: next });
            } else if (line && line.charAt(0) !== '#') {
                this.manifest.segments.push({ uri: line, duration: duration });
                duration = 0;
            }
        }
    };
} };`;
}

function harnessPage(ttMode) {
    const csp = ttMode === "enforced"
        ? "require-trusted-types-for 'script'"
        : ttMode === "locked"
            ? "require-trusted-types-for 'script'; trusted-types 4ndr0666tools#dom 4ndr0666tools#dom.2 4ndr0666tools#dom.3"
            : "";
    return (scriptName, probe, autopanel, tabprobe, veto, observer, fileId, liveform) => `<!doctype html>
<html><head><meta charset="utf-8">
<title>tt-smoke — ${scriptName} (${ttMode})</title>
<script>
window.__SMOKE__ = { mode: ${JSON.stringify(ttMode)}, script: ${JSON.stringify(scriptName)},
    errors: [], csp: [], menu: [], notes: [], logs: [], tabProbe: null, vetoProbe: null, observerProbe: null, ready: false };
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
    /* [v1.4.7 observer probe] console.log capture — the observer family's
     * capture proofs are console-annotated (Filester's API-hit log, Bunkr's
     * CDN-capture log); only the first argument is captured, capped. */
    var cl = console.log;
    console.log = function () {
        if (__SMOKE__.logs.length < 200) __SMOKE__.logs.push(String(arguments[0] || ''));
        return cl.apply(console, arguments);
    };
})();
__SMOKE__.report = function () {
    var hud = document.querySelector('.a4-window');
    var sheet = document.getElementById('a4-glass-stylesheet-v1');
    var netSlot = window.__4NDR0_NET__ || null;
    var content = document.querySelector('.a4-content') || document.getElementById('hud-content-panel');
    var vault = document.querySelector('.psi-ig-panel');
    var lmhud = document.getElementById('hud-panel-root');
    return {
        errors: __SMOKE__.errors, csp: __SMOKE__.csp,
        hudMounted: !!(hud && hud.isConnected) || !!(vault && vault.isConnected && vault.style.display !== 'none')
            || !!(lmhud && lmhud.isConnected && !lmhud.hidden),
        glassStylesheet: !!sheet,
        contentRows: content ? content.children.length : (vault && vault.style.display !== 'none' ? vault.children.length : -1),
        tabProbe: __SMOKE__.tabProbe,
        vetoProbe: __SMOKE__.vetoProbe,
        observerProbe: __SMOKE__.observerProbe,
        netSlot: !!(netSlot && typeof netSlot.onBody === 'function'),
        netVersion: netSlot ? netSlot.version : null,
        netSubscribers: netSlot ? netSlot.subscriberCount : 0,
        netRequestSubscribers: netSlot ? (netSlot.requestSubscriberCount || 0) : 0,
        menuCommands: (window.__GM_MENU__ || []).length,
        reconDock: !!document.getElementById('psi-dock-host'),
        siToasts: (function () { var t = document.getElementById('psi-interceptor-toasts'); return t ? t.children.length : 0; })(),
    };
};
</script>
${csp ? `<meta http-equiv="Content-Security-Policy" content="${csp}">` : ""}
</head>
<body>
<h3 style="font-family:monospace">tt-smoke harness — ${scriptName} — ${ttMode}</h3>
<p style="font-family:monospace;font-size:11px">diagnostics in <code>window.__SMOKE__</code> · summary via <code>__SMOKE__.report()</code></p>
${scriptName.indexOf("GooglePhotosandDrive") !== -1 && liveform ? `<form id="uc-form" action="https://drive.usercontent.google.com/download" method="post"><input type="hidden" name="id" value="${fileId}"><input type="hidden" name="export" value="download"><input type="hidden" name="uuid" value="smoke-uuid-8148"><input type="hidden" name="confirm" value="t"><input type="submit" value="Download anyway"></form>` : ""}
${scriptName.indexOf("Prompt Master") !== -1 && observer ? `<img src="/api/pixel.png" alt="smoke-a" style="width:420px;height:300px"><img src="/api/pixel2.png" alt="smoke-b" style="width:420px;height:300px">` : ""}
<script src="/gm-shim.js"></script>
${scriptName.indexOf("m3u8") !== -1 ? `<script src="/m3u8-parser-stub.js"></script>\n` : ""}<script src="/dist/${encodeURIComponent(scriptName)}"></script>
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
    /* [R3 interactive console probe — the gate that would have caught the
     * v1.4.3 $new variadic bug: a console can mount its frame yet have NO
     * render target, so "hudMounted" alone was a false green. probe=tabs
     * clicks EVERY tab button and records, per tab: active-class flip,
     * content rows, and any render errors. A tab with zero content rows
     * after a successful click is a FAILURE (the operator's live-field
     * report: "tabs do nothing, body empty"). */
    function probeTabs() {
        var results = [];
        var tabs = Array.from(document.querySelectorAll('.a4-tab, .hud-tabs .hud-button'));
        results.push({ tab: '(mount)', rows: document.querySelectorAll('.a4-content > *, #hud-content-panel > *').length });
        var _loop = function (i) {
            var t = tabs[i];
            var label = (t.textContent || '').trim();
            try {
                t.click();
                setTimeout(function () {
                    var content = document.querySelector('.a4-content') || document.getElementById('hud-content-panel');
                    results.push({
                        tab: label,
                        clicked: true,
                        active: t.classList.contains('a4-tab--active') || t.classList.contains('active'),
                        rows: content ? content.children.length : -1,
                    });
                    if (i + 1 < tabs.length) _loop(i + 1);
                    else {
                        __SMOKE__.tabProbe = results;
                        __SMOKE__.notes.push('tab probe: ' + tabs.length + ' tab(s) clicked');
                    }
                }, 60);
            } catch (e) {
                results.push({ tab: label, clicked: false, error: String(e && e.message) });
                __SMOKE__.tabProbe = results;
            }
        };
        if (tabs.length) _loop(0); else __SMOKE__.tabProbe = results;
    }
    /* [v1.4.5 NetHook veto probe — live defusal proof] Loads the dist
     * defuser (AkashA-class: fetch/XHR/beacon ride the hub), then fires
     * tracker-shaped + clean requests through the page realm. Green
     * contract: the tracker fetch resolves the MOCKED body (never the
     * server's), the clean control passes through, the POST body returns
     * identifier-poisoned (device_id → 0xDEADBEEF-…), the tracker XHR
     * delivers the mock on the 40 ms cadence, the beacon swallows — and
     * the server-side hit counter for /api/telemetry stays at ZERO
     * across every channel. ]
     * [v1.4.6 script-aware veto probes] Recon: the blocklist is applied
     * live through the reconEngine C2 surface, blocked fetch/XHR/beacon
     * pacify with the ReconEngine 204, clean traffic passes, and the
     * session ledger records blocked + request + response entries (the
     * recorder provably rides the hub's traffic channel). Stream
     * Interceptor: malformed-SVG fetch/XHR/beacon die at the hub (the
     * caller sees the native-style TypeError / status-0 surface), clean
     * traffic passes, and a textual body carrying an absolute media URL
     * produces a discovery card (deep inspection provably rides the
     * traffic channel). ] */
    function runVetoProbe() {
        var SCRIPT = ${JSON.stringify(scriptName)};
        var out = {};
        var MOCK = '{"success":true,"code":0}';
        function getHits() {
            return fetch('/api/hits').then(function (r) { return r.json(); })
                .catch(function () { return { telemetry: -1, svg: -1 }; });
        }
        function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
        function waitFor(fn, ms) {
            var t0 = Date.now();
            return new Promise(function (res) {
                (function p() { if (fn()) return res(true); if (Date.now() - t0 > (ms || 4000)) return res(false); setTimeout(p, 50); })();
            });
        }
        function slotFields() {
            var slot = window.__4NDR0_NET__ || (typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow.__4NDR0_NET__ : null);
            out.netVersion = slot ? slot.version : null;
            out.netRequestSubscribers = slot ? (slot.requestSubscriberCount || 0) : 0;
            out.netTrafficSubscribers = slot ? (slot.trafficSubscriberCount || 0) : 0;
            out.netErrorSubscribers = slot ? (slot.errorSubscriberCount || 0) : 0;
        }

        if (SCRIPT.indexOf('Recon') !== -1) {
            return waitFor(function () { return window.reconEngine && window.Hook && window.chimeraRecon; }).then(function (ok) {
                out.c2Exposed = !!ok;
                if (!ok) return out;
                window.reconEngine.applyBlockRules('/api/telemetry');
                return getHits().then(function (h0) {
                    out.hitsBefore = h0.telemetry;
                    return fetch('/api/telemetry').then(function (r) {
                        out.fetchBlocked204 = (r.status === 204 && String(r.statusText || '').indexOf('ReconEngine') !== -1);
                    }).then(function () {
                        return fetch('/api/echo', { method: 'POST', body: JSON.stringify({ device: 'wire', note: 'keep' }) })
                            .then(function (r) { return r.text(); });
                    }).then(function (t) {
                        out.echoPassthrough = (t.indexOf('wire') !== -1 && t.indexOf('keep') !== -1);
                        return fetch('/api/probe.json').then(function (r) { return r.json(); });
                    }).then(function (j) {
                        out.controlPassthrough = !!(j && j.probe === true);
                        return new Promise(function (resolve) {
                            try {
                                var x = new XMLHttpRequest();
                                var settled = false;
                                x.onreadystatechange = function () {
                                    if (x.readyState === 4 && !settled) { settled = true; resolve({ ok: x.status === 204 }); }
                                };
                                x.open('GET', '/api/telemetry');
                                x.send();
                                setTimeout(function () { if (!settled) { settled = true; resolve({ ok: false, timeout: true }); } }, 900);
                            } catch (e) { resolve({ ok: false, error: String(e) }); }
                        });
                    }).then(function (r) {
                        out.xhrBlocked204 = r.ok;
                        out.beaconSwallowed = navigator.sendBeacon('/api/telemetry', 'x=1');
                        return wait(500);
                    }).then(function () {
                        var sd = (window.chimeraRecon && window.chimeraRecon.sessionData) || [];
                        out.ledgerBlocked = sd.some(function (e) { return e && e.type === 'blocked' && String(e.url).indexOf('/api/telemetry') !== -1; });
                        out.ledgerRequest = sd.some(function (e) { return e && e.type === 'request' && String(e.url).indexOf('/api/echo') !== -1; });
                        out.ledgerResponse = sd.some(function (e) { return e && (e.type === 'response') && (String(e.url).indexOf('/api/echo') !== -1 || String(e.url).indexOf('/api/probe.json') !== -1); });
                        return getHits();
                    }).then(function (h1) {
                        out.zeroServerHits = (out.hitsBefore === 0 && h1.telemetry === 0 && out.beaconSwallowed === true);
                    });
                });
            }).then(function () {
                slotFields();
                __SMOKE__.vetoProbe = out;
            }).catch(function (e) {
                out.fatal = String(e);
                __SMOKE__.vetoProbe = out;
            });
        }

        if (SCRIPT.indexOf('Stream Interceptor') !== -1) {
            return getHits().then(function (h0) {
                out.hitsBefore = h0.svg;
                return fetch('/api/svg/image/svg+xml,malformed').then(function () {
                    out.svgVetoed = false; /* a resolved fetch means the veto failed */
                }).catch(function (e) {
                    out.svgVetoed = !!(e && e.message === 'Failed to fetch');
                }).then(function () {
                    return fetch('/api/probe.json').then(function (r) { return r.json(); });
                }).then(function (j) {
                    out.controlPassthrough = !!(j && j.probe === true);
                    return new Promise(function (resolve) {
                        try {
                            var x = new XMLHttpRequest();
                            var settled = false;
                            x.onreadystatechange = function () {
                                if (x.readyState === 4 && !settled) { settled = true; resolve({ ok: x.status === 0 }); }
                            };
                            x.open('GET', '/api/svg/image/svg+xml,x');
                            x.send();
                            setTimeout(function () { if (!settled) { settled = true; resolve({ ok: false, timeout: true }); } }, 900);
                        } catch (e) { resolve({ ok: false, error: String(e) }); }
                    });
                }).then(function (r) {
                    out.svgXhrVetoedStatus0 = r.ok;
                    out.beaconSwallowed = navigator.sendBeacon('/api/svg/image/svg+xml,b', 'x=1');
                    return fetch('/api/embed.json?u=' + encodeURIComponent(location.origin + '/stream.mp4'))
                        .then(function (r) { return r.text(); });
                }).then(function () {
                    return wait(700);
                }).then(function () {
                    var toasts = document.getElementById('psi-interceptor-toasts');
                    out.discoveryCards = toasts ? toasts.children.length : 0;
                    return getHits();
                }).then(function (h1) {
                    out.zeroServerHits = (out.hitsBefore === 0 && h1.svg === 0 && out.beaconSwallowed === true);
                });
            }).then(function () {
                slotFields();
                __SMOKE__.vetoProbe = out;
            }).catch(function (e) {
                out.fatal = String(e);
                __SMOKE__.vetoProbe = out;
            });
        }

        /* Akasha-class default (v1.4.5 contract, unchanged) */
        return getHits().then(function (h0) {
            out.telemetryServerHitsBefore = h0.telemetry;
            return fetch('/api/telemetry').then(function (r) {
                return r.text().then(function (t) { out.fetchMocked = (r.status === 200 && t === MOCK); });
            });
        }).then(function () {
            return fetch('/api/probe.json').then(function (r) {
                return r.json().then(function (j) { out.controlPassthrough = !!(j && j.probe === true); });
            });
        }).then(function () {
            return fetch('/api/echo', { method: 'POST', body: JSON.stringify({ device_id: 'legit-device-xyz', note: 'keep' }) })
                .then(function (r) { return r.text(); })
                .then(function (t) {
                    out.bodyPoisoned = (/0xDEADBEEF-/.test(t) && t.indexOf('legit-device-xyz') === -1 && t.indexOf('keep') !== -1);
                });
        }).then(function () {
            return new Promise(function (resolve) {
                try {
                    var x = new XMLHttpRequest();
                    var settled = false;
                    x.onreadystatechange = function () {
                        if (x.readyState === 4 && !settled) { settled = true; resolve({ ok: x.status === 200 && x.responseText === MOCK }); }
                    };
                    x.open('GET', '/api/telemetry');
                    x.send();
                    setTimeout(function () { if (!settled) { settled = true; resolve({ ok: false, timeout: true }); } }, 900);
                } catch (e) { resolve({ ok: false, error: String(e) }); }
            }).then(function (r) { out.xhrMocked = r.ok; });
        }).then(function () {
            out.beaconReturned = navigator.sendBeacon('/api/telemetry', 'x=1');
            return new Promise(function (r) { setTimeout(r, 250); }).then(function () { return getHits(); });
        }).then(function (h1) {
            out.telemetryServerHitsAfter = h1.telemetry;
            out.zeroServerHits = (out.telemetryServerHitsBefore === 0 && h1.telemetry === 0 && out.beaconReturned === true);
            slotFields();
            __SMOKE__.vetoProbe = out;
        }).catch(function (e) {
            out.fatal = String(e);
            __SMOKE__.vetoProbe = out;
        });
    }
    /* [v1.4.7 NetHook observer probe — structured-traffic delivery proof]
     * Loads a dist observer (the six-script family migrated this round),
     * fires script-specific traffic through the page realm, and asserts the
     * observable outcome of the subscriber plus the shared-hub contract:
     * armed slot, version 4, subscriber counts, clean control passthrough,
     * zero page errors. Per-script strong proofs: Bunkr fake-stats respond
     * verdict (body + zero server hits), m3u8 playlist panel mount, PM
     * flow-credit chip values, Watermark RPC passthrough (exactly one
     * server hit), Filester API-hit log capture, IG feed delivery. */
    function runObserverProbe() {
        var SCRIPT = ${JSON.stringify(scriptName)};
        var out = {};
        function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
        function waitFor(fn, ms) {
            var t0 = Date.now();
            return new Promise(function (res) {
                (function p() { if (fn()) return res(true); if (Date.now() - t0 > (ms || 5000)) return res(false); setTimeout(p, 50); })();
            });
        }
        function slotFields() {
            var slot = window.__4NDR0_NET__ || null;
            out.netVersion = slot ? slot.version : null;
            out.netTrafficSubscribers = slot ? (slot.trafficSubscriberCount || 0) : 0;
            out.netRequestSubscribers = slot ? (slot.requestSubscriberCount || 0) : 0;
        }
        function control() {
            return fetch('/api/probe.json').then(function (r) { return r.json(); })
                .then(function (j) { out.controlPassthrough = !!(j && j.probe === true); });
        }
        function hasLog(needle) {
            return __SMOKE__.logs.some(function (l) { return l.indexOf(needle) !== -1; });
        }

        if (SCRIPT.indexOf('Bunkr') !== -1) {
            return fetch('/api/album/stats/smoke').then(function (r) {
                return r.text().then(function (t) {
                    out.statsFetchStatus = r.status;
                    out.statsBodyMocked = (t.indexOf('"viewCount":0') !== -1 && t.indexOf('"live":1') !== -1);
                });
            }).then(function () {
                return fetch('/api/media-/capture.mp4').then(function () { return wait(400); });
            }).then(function () {
                out.cdnCaptureLogged = hasLog('CDN URL captured');
                return control();
            }).then(function () {
                return fetch('/api/hits').then(function (r) { return r.json(); });
            }).then(function (h) {
                out.statsServerHits = h.albumStats;
                out.zeroServerHits = (h.albumStats === 0);
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        if (SCRIPT.indexOf('m3u8') !== -1) {
            return fetch('/api/media.m3u8').then(function () { return wait(1200); }).then(function () {
                /* the m3u8 UI lives inside an open shadow root (rootDiv →
                 * attachShadow) — document.querySelectorAll cannot pierce
                 * it; scan every element's shadowRoot instead. */
                var items = 0;
                Array.prototype.forEach.call(document.querySelectorAll('*'), function (el) {
                    if (el.shadowRoot) items += el.shadowRoot.querySelectorAll('.m3u8-item').length;
                });
                out.playlistItems = items;
                out.playlistPanelMounted = items >= 1;
                return control();
            }).then(function () {
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        if (SCRIPT.indexOf('Instagram') !== -1) {
            /* The ARES wall is user-gated: the script boots, plants the hub
             * hooks, and listens for the Alt+I hotkey (Strategy 3 — no DOM
             * dependency; the harness page has no IG tablist/landmarks for
             * the dock strategies). The probe harvests the feed FIRST
             * (items buffer in pendingItems), then fires the hotkey and
             * asserts the buffered harvest drained into the status line. */
            return fetch('/api/v1/feed/timeline').then(function () { return wait(600); }).then(function () {
                var fired = false;
                try {
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'i', altKey: true, bubbles: true, cancelable: true,
                    }));
                    fired = true;
                } catch (e) { out.hotkeyError = String(e); }
                out.hotkeyFired = fired;
                return wait(2400);
            }).then(function () {
                var stat = document.getElementById('ares-stat');
                out.harvestStatusLine = stat ? String(stat.textContent || '') : '';
                out.aresPanelMounted = !!stat;
                out.harvestTotalPositive = /TOTAL:[1-9]/.test(out.harvestStatusLine);
                return control();
            }).then(function () {
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        if (SCRIPT.indexOf('Prompt Master') !== -1) {
            /* PM's observer registers during the platform-dock boot (late —
             * a 22k-line script builds its UI first). The probe must wait
             * for the hub + subscriber BEFORE firing the credit fetch, or
             * the exchange traverses the still-unwrapped fetch and is
             * invisible to the observer (the first draft raced it).
             * v1.4.8: the hub wait is version 5 (kernel gmFetch round), and
             * the probe gains the MEDIA SLIDESHOW contract after the chip:
             * Alt+T opens the deck over the harness media, the counter
             * reads, ArrowRight advances, Escape tears the deck down. */
            return waitFor(function () {
                var slot = window.__4NDR0_NET__;
                return !!(slot && slot.version === 5 && (slot.trafficSubscriberCount || 0) >= 1);
            }, 10000).then(function (hubReady) {
                out.hubReadyBeforeFetch = hubReady;
                return fetch('/api/flow.json');
            }).then(function () {
                return waitFor(function () {
                    var chip = document.getElementById('pm-flow-credit-chip');
                    var v = chip && chip.querySelector('.mp-credit-values');
                    return !!(v && /\\d/.test(String(v.textContent || '')));
                }, 8000);
            }).then(function () {
                var chip = document.getElementById('pm-flow-credit-chip');
                out.flowChipMounted = !!chip;
                out.flowChipValues = (function () {
                    var v = chip && chip.querySelector('.mp-credit-values');
                    return v ? String(v.textContent || '') : '';
                })();
                out.flowChipHasValues = /41/.test(out.flowChipValues);
                /* v1.4.8 Media Slideshow contract */
                var fired = false;
                try {
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 't', altKey: true, bubbles: true, cancelable: true,
                    }));
                    fired = true;
                } catch (e) { out.slideshowHotkeyError = String(e); }
                out.slideshowHotkeyFired = fired;
                return waitFor(function () {
                    return !!document.getElementById('mp-media-slideshow');
                }, 6000);
            }).then(function (deckOpen) {
                out.slideshowDeckOpened = !!deckOpen;
                if (!deckOpen) return null;
                var counter = document.querySelector('#mp-media-slideshow .mp-ss-counter');
                out.slideshowCounter = counter ? String(counter.textContent || '') : '';
                out.slideshowStyleMounted = !!document.getElementById('pm-slideshow-style');
                out.bodyPresentationClass = document.body.classList.contains('mp-slideshow-open');
                document.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'ArrowRight', bubbles: true, cancelable: true,
                }));
                return wait(450).then(function () {
                    var c2 = document.querySelector('#mp-media-slideshow .mp-ss-counter');
                    out.slideshowAdvanced = c2 ? String(c2.textContent || '') : '';
                    out.slideshowAdvanceMoved = (out.slideshowAdvanced !== out.slideshowCounter) ||
                        /1\\s*\\/\\s*1$/.test(out.slideshowCounter);
                    document.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'Escape', bubbles: true, cancelable: true,
                    }));
                    return wait(450);
                });
            }).then(function () {
                out.slideshowClosed = !document.getElementById('mp-media-slideshow');
                out.slideshowBodyClassCleared = !document.body.classList.contains('mp-slideshow-open');
                return control();
            }).then(function () {
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        if (SCRIPT.indexOf('Watermark') !== -1) {
            /* Wait for the hub + RPC subscriber BEFORE firing the
             * batchexecute XHR, so the exchange provably traverses the
             * armed hub (the observer rides its traffic channel). v1.4.8:
             * hub wait is version 5 (kernel gmFetch round). */
            return waitFor(function () {
                var slot = window.__4NDR0_NET__;
                return !!(slot && slot.version === 5 && (slot.trafficSubscriberCount || 0) >= 1);
            }, 10000).then(function (hubReady) {
                out.hubReadyBeforeXhr = hubReady;
                return new Promise(function (resolve) {
                try {
                    var x = new XMLHttpRequest();
                    var settled = false;
                    x.onreadystatechange = function () {
                        if (x.readyState === 4 && !settled) { settled = true; resolve({ status: x.status, text: x.responseText }); }
                    };
                    x.open('POST', '/_/BardChatUi/data/batchexecute');
                    x.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
                    x.send('fReq=[[["wrb","generatecontent"]]]');
                    setTimeout(function () { if (!settled) { settled = true; resolve({ status: -1, timeout: true }); } }, 1500);
                } catch (e) { resolve({ status: -1, error: String(e) }); }
                });
            }).then(function (r) {
                out.rpcXhrPassthrough = (r.status === 200 && String(r.text || '').indexOf('googleusercontent.com') !== -1);
                return control();
            }).then(function () {
                return fetch('/api/hits').then(function (r) { return r.json(); });
            }).then(function (h) {
                out.rpcServerHits = h.batchexecute;
                out.exactlyOneServerHit = (h.batchexecute === 1);
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        if (SCRIPT.indexOf('GooglePhotosandDrive') !== -1) {
            /* [v1.4.8 GPD true-direct regimes] Two probes share this block:
             * the BUTTON path (no form in the page — the resolve button's
             * gmFetch probe traverses the kernel v5 transport through the
             * shim's uc→mock remap, the interstitial HTML parses, the HUD
             * re-renders with the session-resolved TRUE DIRECT label, and
             * the mock endpoint saw EXACTLY ONE hit) and the LIVEFORM path
             * (the confirm form IS the document — zero-fetch DOM
             * resolution; the endpoint counter must stay at ZERO). */
            return waitFor(function () { return !!document.getElementById('4ndr0-drive-hud'); }, 10000).then(function (hudMounted) {
                out.hudMounted = !!hudMounted;
                out.bootVersion810 = hasLog('8.1.0');
                if (!hudMounted) return null;
                if (${JSON.stringify(liveform)}) {
                    var hudLf = document.getElementById('4ndr0-drive-hud');
                    var lbl = hudLf ? hudLf.querySelector('.psi-glass-label') : null;
                    out.liveFormLabel = lbl ? String(lbl.textContent || '') : '';
                    out.zeroFetchResolved = /CONFIRM FORM IN THIS PAGE/.test(out.liveFormLabel);
                    return fetch('/api/hits').then(function (r) { return r.json(); }).then(function (h) {
                        out.driveUcHits = h.driveUc;
                        out.zeroFetchConfirmed = (h.driveUc === 0);
                        return null;
                    });
                }
                var hudBt = document.getElementById('4ndr0-drive-hud');
                var btn = hudBt ? Array.prototype.slice.call(hudBt.querySelectorAll('button')).find(function (b) {
                    return /Resolve True Direct/.test(String(b.textContent || ''));
                }) : null;
                out.resolveButtonPresent = !!btn;
                if (!btn) return null;
                btn.click();
                return waitFor(function () {
                    var h2 = document.getElementById('4ndr0-drive-hud');
                    var l2 = h2 ? h2.querySelector('.psi-glass-label') : null;
                    return !!(l2 && /RESOLVED THIS SESSION/.test(String(l2.textContent || '')));
                }, 12000).then(function (resolved) {
                    out.trueDirectResolved = resolved === true;
                    var h3 = document.getElementById('4ndr0-drive-hud');
                    var l3 = h3 ? h3.querySelector('.psi-glass-label') : null;
                    out.resolvedLabel = l3 ? String(l3.textContent || '') : '';
                    return fetch('/api/hits').then(function (r) { return r.json(); });
                }).then(function (h) {
                    out.driveUcHits = h.driveUc;
                    out.exactlyOneProbe = (h.driveUc === 1);
                    return null;
                });
            }).then(function () {
                slotFields();
                __SMOKE__.observerProbe = out;
            }).catch(function (e) {
                out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
            });
        }

        /* Filester default */
        return fetch('/api/v1/list').then(function () { return wait(300); }).then(function () {
            out.apiHitLogged = hasLog('API hit');
            return fetch('/api/v1/media/video-987.mp4');
        }).then(function () {
            return control();
        }).then(function () {
            slotFields();
            __SMOKE__.observerProbe = out;
        }).catch(function (e) {
            out.fatal = String(e); slotFields(); __SMOKE__.observerProbe = out;
        });
    }

    setTimeout(function () {
        var work = ${JSON.stringify(probe)} ? runProbes()
            : (${JSON.stringify(veto)} ? runVetoProbe()
            : (${JSON.stringify(observer)} ? runObserverProbe() : Promise.resolve()));
        work.then(function () {
            setTimeout(function () {
                if (${JSON.stringify(autopanel)}) autoPanel();
                if (${JSON.stringify(tabprobe)}) probeTabs();
                setTimeout(function () { __SMOKE__.ready = true; }, 700);
            }, 300);
        });
    }, 250);
})();
</script>
</body></html>`;
}

let telemetryHits = 0;
let svgHits = 0;
let albumStatsHits = 0;
let batchexecuteHits = 0;
/* [v1.4.8] per-referer accounting for the GPD true-direct mock: the
 * zero-fetch (liveform) regime must prove ITSELF gmFetch-free even when
 * the resolve regime hit the same server instance earlier — a global
 * counter conflates probes. */
const driveUcHitsByRef = new Map();
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const send = (code, type, body) => {
        res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
        res.end(body);
    };

    if (url.pathname === "/gm-shim.js") return send(200, "application/javascript; charset=utf-8", gmShim());
    if (url.pathname === "/m3u8-parser-stub.js") return send(200, "application/javascript; charset=utf-8", m3u8ParserStub());
    if (url.pathname === "/api/media.m3u8") return send(200, "application/vnd.apple.mpegurl", M3U8);
    if (url.pathname === "/api/probe.json") return send(200, "application/json", PROBE_JSON);
    /* [v1.4.7 observer-probe endpoints] bunkr stats (hit-counted — the
     * Bunkr respond verdict must keep it at ZERO), PM flow-credit JSON,
     * the IG Schema-A feed, the gemini batchexecute RPC (hit-counted —
     * the Watermark RPC observer must PASS IT THROUGH, exactly one hit),
     * and generic /api/v1/* passthroughs for Filester's capture logs. */
    if (url.pathname.startsWith("/api/album/stats/")) {
        albumStatsHits++;
        return send(200, "application/json", JSON.stringify({ real: true, viewCount: 999 }));
    }
    if (url.pathname === "/api/flow.json") {
        /* Credit-scoped shape — PM's walker only classifies left/total
         * keys inside a credit scope (key path containing "credit"),
         * which is how Flow's real responses carry them. */
        return send(200, "application/json", JSON.stringify({ credit: { left: 41, total: 100, used: 59 }, note: "observer probe" }));
    }
    if (url.pathname === "/api/v1/feed/timeline") {
        return send(200, "application/json", JSON.stringify({
            items: [{
                user: { pk: 4170, pk_id: 4170, username: "smoke_test" },
                id: "smoke-2801",
                media_type: 1,
                image_versions2: { candidates: [{ url: "https://smoke.test/cdn/ig-asset-2801.jpg", width: 1080, height: 1350 }] },
                caption: { text: "observer probe" },
            }],
            next_max_id: null,
        }));
    }
    if (url.pathname.startsWith("/_/BardChatUi/data/batchexecute")) {
        batchexecuteHits++;
        return send(200, "text/plain; charset=utf-8",
            `)]}'\n[[["wrb","XK1Bxc",null,null,null,null,null,"1","\\u003d",[\"https://lh3.googleusercontent.com/gg/asset/smoke-rc01.jpg\"]]]]`);
    }
    if (url.pathname === "/api/v1/list" || url.pathname.startsWith("/api/v1/media/")) {
        return send(200, "application/json", JSON.stringify({ ok: true, path: url.pathname }));
    }
    /* [v1.4.8 GPD true-direct endpoints] the interstitial mock the gmFetch
     * probe is remapped onto (hit-counted — the BUTTON path must see
     * exactly one hit, the LIVEFORM path zero), and the two pixel stand-ins
     * the PM slideshow harvests (geometry-gated, distinct URLs → two
     * slides). */
    if (url.pathname === "/api/drive-uc") {
        const ref = String(req.headers.referer || "");
        driveUcHitsByRef.set(ref, (driveUcHitsByRef.get(ref) || 0) + 1);
        return send(200, "text/html; charset=utf-8",
            `<!doctype html><html><head><title>(*) Google Drive — virus scan warning</title></head><body>` +
            `<form id="uc-form" action="https://drive.usercontent.google.com/download" method="post">` +
            `<input type="hidden" name="id" value="${url.searchParams.get("id") || ""}">` +
            `<input type="hidden" name="export" value="download">` +
            `<input type="hidden" name="uuid" value="smoke-uuid-8148">` +
            `<input type="hidden" name="confirm" value="t">` +
            `<input type="submit" value="Download anyway"></form></body></html>`);
    }
    if (url.pathname === "/api/pixel.png" || url.pathname === "/api/pixel2.png") {
        return send(200, "image/png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
    }
    if (url.pathname === "/api/media-/capture.mp4") {
        return send(200, "video/mp4", "");
    }
    if (url.pathname === "/api/telemetry") {
        telemetryHits++; /* the Akasha/Recon veto probes assert this counter stays at zero */
        return send(200, "application/json", JSON.stringify({ real: true }));
    }
    /* malformed-SVG bait for the Stream Interceptor veto probe — the URL
     * carries the literal content-type marker SI's gate hunts for; the
     * counter must stay at zero (the veto fires before the network) */
    if (url.pathname.startsWith("/api/svg/")) {
        svgHits++;
        return send(200, "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg'/>");
    }
    /* textual body carrying a caller-supplied absolute media URL — SI's
     * deep text inspection discovers it and mounts a discovery card */
    if (url.pathname === "/api/embed.json") {
        const u = url.searchParams.get("u") || "";
        return send(200, "application/json", JSON.stringify({ embed: u, note: "stream source follows", ref: u }));
    }
    if (url.pathname === "/api/hits") return send(200, "application/json", JSON.stringify({ telemetry: telemetryHits, svg: svgHits, albumStats: albumStatsHits, batchexecute: batchexecuteHits, driveUc: (driveUcHitsByRef.get(String(req.headers.referer || "")) || 0) }));
    if (url.pathname === "/api/echo") {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => send(200, "text/plain; charset=utf-8", Buffer.concat(chunks).toString("utf8")));
        return;
    }

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
        const probeParam = url.searchParams.get("probe") || "";
        const probe = url.searchParams.has("probe") && probeParam !== "veto" && probeParam !== "observer";
        const veto = probeParam === "veto";
        const observer = probeParam === "observer";
        const autopanel = url.searchParams.has("autopanel");
        const tabprobe = url.searchParams.has("tabs");
        const fileId = url.searchParams.get("id") || "SMOKEFILEID123";
        const liveform = url.searchParams.has("liveform");
        return send(200, "text/html; charset=utf-8", harnessPage(ttRoute)(match, probe, autopanel, tabprobe, veto, observer, fileId, liveform));
    }

    send(404, "text/plain", "routes: /tt/ /tt-locked/ /nott/ ?script=…&probe=wire&autopanel · /gm-shim.js · /api/media.m3u8 · /api/probe.json\n");
});

server.listen(port, "127.0.0.1", () => {
    console.log(`tt-smoke harness — http://127.0.0.1:${port}`);
    console.log(`  /tt/?script=HostWarp&autopanel&tabs   (TT enforced — console + interactive tab probe)`);
    console.log(`  /tt-locked/?script=PageCraft&autopanel&tabs (TT + policy-name allowlist)`);
    console.log(`  /nott/?script=HostWarp&autopanel&tabs  (no TT — parity)`);
    console.log(`  /tt/?script=Blob2URL&probe=wire&autopanel (NetHook wire capture)`);
    console.log(`  /tt/?script=Akasha%20Silence&probe=veto  (NetHook veto — live defusal proof)`);
    console.log(`  /tt/?script=Recon&probe=veto&autopanel  (NetHook v4 — Recon blocklist + ledger proof)`);
    console.log(`  /tt/?script=Stream%20Interceptor&probe=veto&autopanel  (NetHook v4 — SVG veto + discovery proof)`);
    console.log(`  /tt/?script=Bunkr%2B%2B&probe=observer  (NetHook v4 — observer: fake-stats respond verdict + CDN capture)`);
    console.log(`  /tt/?script=m3u8%2B%2B&probe=observer  (observer: playlist panel mount)`);
    console.log(`  /tt/?script=Instagram%2B%2B&probe=observer  (observer: feed harvest delivery)`);
    console.log(`  /tt/?script=Prompt%20Master&probe=observer  (observer: flow-credit chip)`);
    console.log(`  /tt/?script=Watermark%2B%2B&probe=observer  (observer: gemini RPC passthrough)`);
    console.log(`  /tt/?script=Filester%2B%2B&probe=observer  (observer: API-hit capture)`);
  console.log(`  /tt/?script=GooglePhotosandDrive%2B%2B&probe=observer&id=SMOKEFILEID123  (v1.4.8 gmFetch: true-direct resolve button → interstitial parse)`);
  console.log(`  /nott/?script=GooglePhotosandDrive%2B%2B&probe=observer&liveform  (v1.4.8 zero-fetch: confirm form in the document)`);
});
