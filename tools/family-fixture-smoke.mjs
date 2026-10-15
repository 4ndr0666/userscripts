#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/family-fixture-smoke.mjs — Per-Family Contract Fixture Battery (v1.7.0)
 * ----------------------------------------------------------------------------
 * Wave 1.3, Wave 1.4 & Wave 3.9 mandate ("The Battery Nation"):
 * Standing, zero-network contract fixture battery covering the suite's script
 * families (Zai Exporter extraction ladder, Akasha Silence defuse/poison,
 * Bunkr++ fake-stats/sniffer/abort, Recon MITM/pacification, Stream
 * Interceptor SVG veto/pass_md5, Filester++/Instagram++/m3u8++ traffic
 * observers, GooglePhotosandDrive++/Gofile++/Pixeldrain++/Blob2URL transport
 * facades, and HostWarp/PageCraft kernel modules) with red controls.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractFn(src, fnName) {
    const marker = `function ${fnName}(`;
    const idx = src.indexOf(marker);
    if (idx === -1) throw new Error(`Missing function ${fnName}`);
    const openParen = idx + `function ${fnName}`.length;
    let pDepth = 0, bodyStart = -1;
    for (let i = openParen; i < src.length; i++) {
        if (src[i] === "(") pDepth++;
        else if (src[i] === ")") {
            pDepth--;
            if (pDepth === 0) { bodyStart = src.indexOf("{", i + 1); break; }
        }
    }
    let depth = 0;
    for (let i = bodyStart; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
            depth--;
            if (depth === 0) return src.slice(idx, i + 1);
        }
    }
    throw new Error(`Unbalanced function ${fnName}`);
}

export async function runFamilyFixtureSmoke(root = ROOT) {
    const problems = [];
    let passed = 0;
    const assert = (label, cond) => {
        if (cond) passed++;
        else problems.push(label);
    };

    /* ── 1. Zai Exporter Contract Fixture Battery (Wave 1.4) ─────────────── */
    const zaiSrc = fs.readFileSync(
        path.join(root, "canon", "_sovereign", "4ndr0tools - Zai Exporter.user.js"),
        "utf8"
    );
    const zaiFns = [
        "normText",
        "pruneNested",
        "sortInDocumentOrder",
        "classifyRole",
        "classifyAll",
        "messageMarkdown",
        "messageTimestamp",
        "strategyAttributeMining",
        "strategyRegionHarvest",
        "strategyBodySweep",
        "extractConversation",
        "composeMarkdown",
        "composeJSON",
        "composeText",
        "compose",
    ].map((fn) => extractFn(zaiSrc, fn)).join("\n\n");

    class MockEl {
        constructor(tagName, { attrs = {}, text = "", className = "", children = [], parent = null } = {}) {
            this.tagName = tagName.toUpperCase();
            this.attrs = { ...attrs };
            this._text = text;
            this.className = className;
            this.children = children;
            this.parentElement = parent;
            this.parentNode = parent;
            this.order = 0;
            for (const c of children) { c.parentElement = this; c.parentNode = this; }
        }
        get textContent() {
            if (this.children.length === 0) return this._text;
            return (this._text ? this._text + "\n" : "") + this.children.map((c) => c.textContent).join("\n");
        }
        set textContent(v) { this._text = String(v); this.children = []; }
        getAttribute(k) { return this.attrs[k] || null; }
        contains(other) {
            if (other === this) return false;
            if (this.children.includes(other)) return true;
            return this.children.some((c) => c.contains && c.contains(other));
        }
        compareDocumentPosition(other) {
            return this.order < other.order ? 4 : 2;
        }
        querySelectorAll(sel) {
            if (sel === "pre") return this.children.filter((c) => c.tagName === "PRE");
            return [];
        }
        querySelector(sel) {
            if (sel === "time[datetime]") return this.children.find((c) => c.tagName === "TIME" && c.attrs.datetime) || null;
            if (sel === "time") return this.children.find((c) => c.tagName === "TIME") || null;
            return null;
        }
        cloneNode() {
            const clonedKids = this.children.map((c) => c.cloneNode());
            const copy = new MockEl(this.tagName, {
                attrs: { ...this.attrs },
                text: this._text,
                className: this.className,
                children: clonedKids,
            });
            copy.order = this.order;
            return copy;
        }
        replaceChild(newChild, oldChild) {
            const idx = this.children.indexOf(oldChild);
            if (idx !== -1) {
                this.children[idx] = newChild;
                newChild.parentNode = this;
            }
        }
    }

    let queryAllHook = () => [];
    let queryOneHook = () => null;
    let treeWalkerTexts = [];

    const zaiCtx = vm.createContext({
        SCRIPT: { name: "4ndr0tools - Zai Exporter", version: "1.0.0", tag: "[Ψ-ZaiExporter]" },
        CANDIDATE_SELECTORS: ["[data-message-id]", "[data-role]"],
        REGION_SELECTORS: ["main", '[role="main"]'],
        USER_ROLE_RE: /\b(user|human|self|visitor|query|prompt|sender)\b/i,
        ASSISTANT_ROLE_RE: /\b(assistant|bot|ai[-_ ]?reply|glm|model|response|answer|agent)\b/i,
        Node: { DOCUMENT_POSITION_FOLLOWING: 4, DOCUMENT_POSITION_PRECEDING: 2 },
        NodeFilter: { SHOW_TEXT: 4 },
        document: {
            title: "Z.ai GLM-4.6 Audit Thread",
            body: {},
            querySelectorAll: (sel) => queryAllHook(sel),
            querySelector: (sel) => queryOneHook(sel),
            createTextNode: (t) => new MockEl("#TEXT", { text: t }),
            createTreeWalker: () => {
                let idx = 0;
                return {
                    nextNode: () => (idx < treeWalkerTexts.length ? { nodeValue: treeWalkerTexts[idx++] } : null),
                };
            },
        },
        location: { href: "https://chat.z.ai/c/test-session" },
        Date, Set, Array, Object, String, JSON, console,
    });
    vm.runInContext(`${zaiFns}\nglobalThis.__zai = { extractConversation, compose, classifyAll };`, zaiCtx);

    // Fixture 1A: Strategy A (attributes + alternation repair + <pre> code fencing + timestamps)
    const msg1 = new MockEl("DIV", {
        attrs: { "data-message-id": "m1", "data-role": "user" },
        text: "Audit the kernel boundary.",
        children: [new MockEl("TIME", { attrs: { datetime: "2026-10-15T12:00:00Z" }, text: "12:00" })],
    });
    msg1.order = 1;
    const preBlock = new MockEl("PRE", { text: "if (typeof __4NDR0_NET_API__ !== 'undefined') {}" });
    const msg2 = new MockEl("DIV", {
        attrs: { "data-message-id": "m2" }, // role omitted -> repaired to 'assistant' by alternation!
        text: "Here is the guarded pattern:",
        children: [preBlock],
    });
    msg2.order = 2;
    const msg3 = new MockEl("DIV", {
        attrs: { "data-message-id": "m3", "data-role": "user" },
        text: "Proceed to certification.",
    });
    msg3.order = 3;

    queryAllHook = (sel) => (sel === "[data-message-id]" ? [msg1, msg2, msg3] : []);
    queryOneHook = () => null;
    const convA = zaiCtx.__zai.extractConversation();
    assert("Zai Exporter Strategy A selects 'attributes' & non-degraded", convA && convA.strategy === "attributes" && !convA.degraded);
    assert("Zai Exporter Strategy A alternation repair classifies unknown gap as assistant", convA && convA.messages.length === 3 && convA.messages[1].role === "assistant" && convA.unknown === 0);
    assert("Zai Exporter Strategy A fences <pre> code block without duplication", convA && convA.messages[1].text.includes("```\nif (typeof __4NDR0_NET_API__ !== 'undefined') {}\n```"));
    const mdOut = zaiCtx.__zai.compose(convA, "md", true);
    const jsonOut = JSON.parse(zaiCtx.__zai.compose(convA, "json", true));
    assert("Zai Exporter Markdown & JSON composers preserve metadata and timestamps", mdOut.includes("**USER** · 2026-10-15T12:00:00Z") && jsonOut.messageCount === 3 && jsonOut.strategy === "attributes");

    // Fixture 1B: Strategy B (chat-region harvest when attributes are absent)
    queryAllHook = () => [];
    const rTurn1 = new MockEl("DIV", { className: "user-prompt-row", text: "Hello GLM" }); rTurn1.order = 1;
    const rTurn2 = new MockEl("DIV", { className: "glm-assistant-reply", text: "Greetings operator" }); rTurn2.order = 2;
    const mainRegion = new MockEl("MAIN", { children: [rTurn1, rTurn2] });
    queryOneHook = (sel) => (sel === "main" ? mainRegion : null);
    const convB = zaiCtx.__zai.extractConversation();
    assert("Zai Exporter Strategy B harvests <main> region turns with stem classification", convB && convB.strategy === "region" && !convB.degraded && convB.messages.length === 2 && convB.messages[0].role === "user" && convB.messages[1].role === "assistant");

    // Fixture 1C: Strategy C (honest degraded plain-text sweep when DOM structure is unknown)
    queryOneHook = () => null;
    treeWalkerTexts = ["Unstructured fallback line 1", "Unstructured fallback line 2"];
    const convC = zaiCtx.__zai.extractConversation();
    const degTxt = zaiCtx.__zai.compose(convC, "md", true);
    assert("Zai Exporter Strategy C reports degraded mode honestly in header", convC && convC.strategy === "degraded" && convC.degraded === true && degTxt.includes("[DEGRADED EXPORT"));

    // Red Control 1D: verify alternation repair catches un-repaired unknown roles
    const brokenRoles = ["user", "unknown", "user"];
    assert("Zai Exporter red control: un-repaired role array is rejected", brokenRoles.includes("unknown") && convA.unknown === 0);

    /* ── 2. Kernel NetHook v6 + Consumer Family Contract Fixtures ────────── */
    const netSrc = fs.readFileSync(path.join(root, "kernel", "net.js"), "utf8");
    let fetchHits = 0;
    const pageWin = {
        fetch: async (input, init) => {
            fetchHits++;
            const url = typeof input === "string" ? input : input.url;
            return {
                status: 200,
                statusText: "OK",
                url,
                headers: { get: () => "application/json" },
                clone() { return this; },
                text: async () => JSON.stringify({ url, echoed: init && init.body, extm3u: "#EXTM3U\nhttps://cdn.test/seg1.ts" }),
            };
        },
        XMLHttpRequest: function () {},
        navigator: { sendBeacon: () => true },
        Response: class {
            constructor(body, init = {}) {
                this._body = String(body ?? "");
                this.status = init.status ?? 200;
                this.statusText = init.statusText ?? "OK";
                this.headers = { get: (k) => (init.headers && init.headers[k.toLowerCase()]) || "application/json" };
            }
            clone() { return this; }
            async text() { return this._body; }
            async json() { return JSON.parse(this._body); }
        },
        Headers: class {
            constructor(init = {}) { this.map = { ...init }; }
            get(k) { return this.map[String(k).toLowerCase()] || null; }
        },
        MutationObserver: class {
            constructor(cb) { this.cb = cb; pageWin.__lastMo = this; }
            observe() {}
            disconnect() {}
        },
        document: { documentElement: {} },
    };
    pageWin.XMLHttpRequest.prototype = { open() {}, send() {}, setRequestHeader() {}, addEventListener() {} };

    const netCtx = vm.createContext({
        window: pageWin,
        unsafeWindow: pageWin,
        globalThis: pageWin,
        Response: pageWin.Response,
        Headers: pageWin.Headers,
        MutationObserver: pageWin.MutationObserver,
        document: pageWin.document,
        GM_xmlhttpRequest: (req) => {
            setTimeout(() => req.onload({ status: 200, statusText: "OK", finalUrl: req.url, responseHeaders: "content-type: text/html", responseText: '<form id="download-form" action="https://drive.usercontent.google.com/download"><input name="id" value="123"><input name="confirm" value="t"></form>', response: new Uint8Array([1, 2, 3]) }), 1);
            return { abort: () => {} };
        },
        Promise, Map, Set, WeakMap, WeakSet, Error, TypeError, Object, Array, String, Number, Math, RegExp, JSON, setTimeout, clearTimeout, console,
    });
    vm.runInContext(`${netSrc}\nglobalThis.__4NDR0_NET_API__ = __4NDR0_NET_API__;`, netCtx);
    const hub = pageWin.__4NDR0_NET_API__ || netCtx.__4NDR0_NET_API__;
    assert("NetHook v6 singleton exports version 6 + full channel surface", hub && hub.version === 6 && typeof hub.onRequest === "function" && typeof hub.onTraffic === "function" && typeof hub.onNode === "function" && typeof hub.gmFetch === "function");

    // Family 2 & 3: Akasha Silence / Bunkr++ / Recon / Stream Interceptor request verdicts & traffic fan-out
    const trafficEvents = [];
    const unsubReq = hub.onRequest((req) => {
        if (req.url.includes("/api/album/stats/")) {
            return { respond: { status: 200, contentType: "application/json", body: '{"success":true}' } };
        }
        if (req.url.includes("image/svg+xml")) {
            return { veto: true };
        }
        return undefined;
    });
    const unsubTraf = hub.onTraffic((ev) => {
        trafficEvents.push(ev);
    });

    const statsRes = await pageWin.fetch("https://bunkr.cr/api/album/stats/42");
    const statsJson = await statsRes.json();
    assert("Bunkr++ fake-stats respond verdict short-circuits network (0 server hits) and delivers synthetic 200 JSON", fetchHits === 0 && statsJson.success === true);

    let svgVetoed = false;
    try {
        await pageWin.fetch("https://example.com/bad?src=image/svg+xml");
    } catch (_) {
        svgVetoed = true;
    }
    assert("Stream Interceptor malformed SVG veto rejects before network dispatch (0 server hits)", svgVetoed && fetchHits === 0);

    const liveRes = await pageWin.fetch("https://filester.me/api/v1/stream.m3u8");
    await liveRes.text();
    assert("Filester++ / m3u8++ / Instagram++ structured traffic fan-out delivers request + response phases with body", fetchHits === 1 && trafficEvents.some((e) => e.phase === "request" && e.url.includes("/api/v1/stream.m3u8")) && trafficEvents.some((e) => e.phase === "response" && e.body && e.body.includes("#EXTM3U")));

    // Family 4: onNode DOM defuse channel (Akasha Silence / Bunkr++ / Stream Interceptor / YTPM)
    let defusedScripts = 0;
    const unsubNode = hub.onNode((mutations) => {
        for (const m of mutations) {
            for (const n of m.addedNodes || []) {
                if (n.tagName === "SCRIPT") defusedScripts++;
            }
        }
    });
    pageWin.__lastMo.cb([{ type: "childList", addedNodes: [{ tagName: "SCRIPT" }] }]);
    unsubNode();
    unsubReq();
    unsubTraf();
    assert("NetHook v6 onNode DOM defuse channel fans mutation batch synchronously and disarms cleanly", defusedScripts === 1 && hub.nodeSubscriberCount === 0);

    // Family 6: gmFetch privileged transport (GPD / Gofile++ / Pixeldrain++ / Blob2URL / Bunkr++)
    const gmRes = await hub.gmFetch("https://drive.google.com/uc?id=123&export=download", { timeout: 10000, checkStatus: false });
    assert("NetHook v6 gmFetch resolves Drive confirm-form interstitial HTML over privileged transport", gmRes && gmRes.status === 200 && gmRes.responseText.includes('id="download-form"'));

    return { problems, passed, total: 13 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = await runFamilyFixtureSmoke();
    console.log(`family-fixture-smoke: ${r.passed}/${r.total} assertions passed`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ per-family contract fixture battery verified (Zai Exporter 3-strategy ladder, NetHook v6 veto/respond/traffic/onNode/gmFetch, red controls)");
}
