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
 * facades, and HostWarp/PageCraft kernel modules) with red controls — plus
 * the round-12 Hailuo++ BlobSanitizer family (the operator's REAL attack
 * sample head, byte-embedded): the Windows-1252-then-UTF-8 double-encoding
 * repair, proven by full roundtrip + negative controls + wiring tripwires.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
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
    let passed = 0,
        total = 0;
    /* WO-01 round-3 (3-a F01): total derives from EXECUTION (SUK v1.2 Part V:
     * battery expectations must derive from internal state) — the hardcoded
     * 21 rode four commits of CERTIFIED output printing an impossible
     * 23/21 fraction (round-2's searxng pair was added without the bump,
     * while gen-docs DERIVED 23 into FEATURE-MATRIX and the two artifacts
     * contradicted each other). */
    const assert = (label, cond) => {
        total++;
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

    /* r17 (F08): the constants ride the EXTRACTION discipline — the
     * hand-copied selector subsets above had already drifted (2 of 11
     * candidate selectors, 2 of 7 region selectors: the fixture certified
     * a stale 2-selector ladder while the shipped script walks the full
     * one — the fixture-bypass class at the CONSTANT layer, the exact
     * shape the r16 6B3/6B4/6F precedent closes for behavior). The canon's
     * OWN blocks are sliced and evaluated; the 1Z-red control below
     * reverts to the stale copy and proves the extraction is load-bearing
     * (the export misses the testid-only node). */
    const extractZaiConst = (src, name, kind) => {
        const start = src.indexOf(`const ${name} = `);
        if (start === -1) throw new Error(`${name} not found in Zai canon`);
        if (kind === "line") {
            const nl = src.indexOf("\n", start);
            return src.slice(start, nl).trim();
        }
        let depth = 0, end = -1, inStr = null;
        for (let i = start; i < src.length; i++) {
            const c = src[i];
            if (inStr) { if (c === inStr && src[i - 1] !== "\\") inStr = null; continue; }
            if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
            if (c === "[" || c === "(" || c === "{") depth++;
            else if (c === "]" || c === ")" || c === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
        }
        if (end === -1) throw new Error(`${name} block unterminated`);
        return src.slice(start, end) + ";";
    };
    const evalZaiConst = (blockSrc, name) => new Function(`${blockSrc}\nreturn ${name};`)();
    const zaiCandidateSelectors = evalZaiConst(extractZaiConst(zaiSrc, "CANDIDATE_SELECTORS", "block"), "CANDIDATE_SELECTORS");
    const zaiRegionSelectors = evalZaiConst(extractZaiConst(zaiSrc, "REGION_SELECTORS", "block"), "REGION_SELECTORS");
    const zaiUserRoleRe = evalZaiConst(extractZaiConst(zaiSrc, "USER_ROLE_RE", "line"), "USER_ROLE_RE");
    const zaiAssistantRoleRe = evalZaiConst(extractZaiConst(zaiSrc, "ASSISTANT_ROLE_RE", "line"), "ASSISTANT_ROLE_RE");

    const zaiCtx = vm.createContext({
        SCRIPT: { name: "4ndr0tools - Zai Exporter", version: "1.0.0", tag: "[Ψ-ZaiExporter]" },
        /* r17 (F08): the canon's OWN constants — extracted, never copied. */
        CANDIDATE_SELECTORS: zaiCandidateSelectors,
        REGION_SELECTORS: zaiRegionSelectors,
        USER_ROLE_RE: zaiUserRoleRe,
        ASSISTANT_ROLE_RE: zaiAssistantRoleRe,
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

    // Red Control 1D (WO-01 round-1, 2-a F4 — the previous control asserted a
    // local literal `.includes("unknown")`, vacuously true: it validated
    // Array.prototype.includes, not the pipeline). Real control: classifyAll
    // must (a) REPAIR an unknown gap sandwiched between known roles and
    // (b) stay HONEST on an unrepairable pure-unknown run — a repair pass
    // that fabricated roles for the unrepairable case, or failed to repair
    // the repairable case, fails this assertion.
    const rcRepairable = [
        new MockEl("DIV", { attrs: { "data-message-id": "rc1", "data-role": "user" }, text: "known user" }),
        new MockEl("DIV", { attrs: { "data-message-id": "rc2" }, text: "sandwiched gap" }),
        new MockEl("DIV", { attrs: { "data-message-id": "rc3", "data-role": "user" }, text: "known user again" }),
    ];
    const rcRepaired = zaiCtx.__zai.classifyAll(rcRepairable);
    const rcUnrepairable = [
        new MockEl("DIV", { attrs: { "data-message-id": "uc1" }, text: "gap one" }),
        new MockEl("DIV", { attrs: { "data-message-id": "uc2" }, text: "gap two" }),
    ];
    const rcHonest = zaiCtx.__zai.classifyAll(rcUnrepairable);
    assert("Zai Exporter red control: alternation repair fixes sandwiched gaps AND leaves un-repairable runs honestly unknown",
        rcRepaired[1] === "assistant" && rcHonest.every((r) => r === "unknown"));

    // 1Z. r17 (F08): THE CONSTANT-EXTRACTION PIN — a node discoverable ONLY
    // by a canon selector the stale hand-copy lacked still exports (the
    // extracted 11-selector ladder queries '[data-testid^="message" i]';
    // the stale 2-selector copy never does).
    const testidNode = new MockEl("DIV", { attrs: { "data-testid": "message-7" }, text: "testid-only harvest" });
    testidNode.order = 4;
    queryAllHook = (sel) => (sel === '[data-testid^="message" i]' ? [testidNode] : []);
    queryOneHook = () => null;
    treeWalkerTexts = [];
    const convZ = zaiCtx.__zai.extractConversation();
    const zTxt = zaiCtx.__zai.compose(convZ, "txt", true);
    const extractionLive = zTxt.includes("testid-only harvest");

    // 1Z-red. The stale hand-copied constants in a copied context MISS the
    // node — the extraction is load-bearing (this control fails if anyone
    // reverts the constants to a hand-copy).
    const staleCtx = vm.createContext({
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
            createTreeWalker: () => { let idx = 0; return { nextNode: () => (idx < treeWalkerTexts.length ? { nodeValue: treeWalkerTexts[idx++] } : null) }; },
        },
        location: { href: "https://chat.z.ai/c/test-session" },
        Date, Set, Array, Object, String, JSON, console,
    });
    vm.runInContext(`${zaiFns}\nglobalThis.__zai = { extractConversation, compose, classifyAll };`, staleCtx);
    const convZRed = staleCtx.__zai.extractConversation();
    /* The stale ladder may legitimately degrade to null (no attributes, no
     * region, no fallback texts) — the MISS is the point, not a crash. */
    const zTxtRed = convZRed ? staleCtx.__zai.compose(convZRed, "txt", true) : "";
    assert(
        "1Z. the constant-extraction pin (r17 F08): the extracted 11-selector ladder exports a testid-only node the stale hand-copied 2-selector constants MISS — the fixture's constants are the canon's own, and the 1Z-red control proves the extraction load-bearing",
        extractionLive && !zTxtRed.includes("testid-only harvest")
    );

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

    /* ── 3. GUP v7.0.0 Stepwise Gap Mitigation Fixtures (suite v1.7.1) ───── */
    // 3A. Youtube Removed Video Revealer: extractIDsFullView + createRestoreButton + ButtonClickActionFullView
    const yrvrSrc = fs.readFileSync(
        path.join(root, "canon", "_sovereign", "4ndr0tools - Youtube Removed Video Revealer.user.js"),
        "utf8"
    );
    const yrvrFns = [
        "createRestoreButton",
        "extractIDsFullView",
        "ButtonClickActionFullView",
    ].map((fn) => extractFn(yrvrSrc, fn)).join("\n\n");

    let createdBtn = null;
    let processClickCalls = [];
    const mockPlaylistDom = {
        getElementById: (id) => (id === "TitleRestoredBtn" ? createdBtn : null),
        querySelectorAll: () => [{
            offsetParent: {},
            checkVisibility: () => true,
            firstChild: null,
            insertBefore: () => {},
        }],
        createElement: (tag) => {
            const el = {
                tagName: tag.toUpperCase(),
                id: "",
                style: {},
                textContent: "",
                children: [],
                listeners: {},
                appendChild(c) { this.children.push(c); if (c && c.id === "TitleRestoredBtn") createdBtn = c; },
                addEventListener(ev, fn) { this.listeners[ev] = fn; },
            };
            return el;
        },
    };
    const fakeCash = (sel) => {
        if (sel && sel._isItem) return sel;
        if (sel === "h3.ytd-playlist-video-renderer") {
            const item = {
                _isItem: true,
                attr: (k) => (k === "aria-label" ? null : null),
                parents: () => ({ length: 1, append: () => {} }),
                children: () => ({
                    length: 1,
                    attr: function (k, v) {
                        if (v !== undefined) { this._chk = v; return this; }
                        if (k === "href") return "/watch?v=dQw4w9WgXcQ&list=PL123";
                        if (k === "filmot_chk") return this._chk || null;
                        return null;
                    },
                }),
            };
            return {
                filter: () => ({
                    each: (cb) => cb.call(item),
                }),
            };
        }
        const chain = {
            addClass: () => chain,
            attr: () => chain,
            css: () => chain,
            one: () => chain,
            append: () => chain,
            find: () => ({ text: () => chain }),
            text: () => chain,
        };
        return chain;
    };
    const yrvrCtx = vm.createContext({
        ArchivedIDS: {},
        RecoveredIDS: {},
        DetectedIDS: {},
        deletedIDs: "",
        deletedIDCnt: 0,
        document: mockPlaylistDom,
        window: { location: { href: "https://www.youtube.com/playlist?list=PL123" } },
        $: fakeCash,
        processClick: (fmt, nTry) => processClickCalls.push({ fmt, nTry }),
        waybackTimestampToDateString: () => "01.01.2025",
        fetchWaybackData: async () => [],
        getWaybackVideoAvailabilityCheckURL: () => "",
        Array, Object, String, console,
    });
    vm.runInContext(`${yrvrFns}\nglobalThis.__yrvr = { extractIDsFullView, ButtonClickActionFullView, getDeleted: () => ({ deletedIDs, deletedIDCnt }) };`, yrvrCtx);
    yrvrCtx.__yrvr.extractIDsFullView();
    const yrvrState = yrvrCtx.__yrvr.getDeleted();
    assert("Youtube Removed Video Revealer extractIDsFullView populates script-scope deletedIDs without TDZ crash", yrvrState.deletedIDs === "dQw4w9WgXcQ" && yrvrState.deletedIDCnt === 1 && processClickCalls.length === 1 && processClickCalls[0].fmt === 1);
    if (createdBtn && createdBtn.listeners && typeof createdBtn.listeners.click === "function") {
        createdBtn.listeners.click({ preventDefault() {} });
    }
    assert("Youtube Removed Video Revealer #TitleRestoredBtn wires ButtonClickActionFullView & dispatches format=1 on playlist view", processClickCalls.length === 2 && processClickCalls[1].fmt === 1);

    // 3B. HostWarp Gemini forceImmediateAnswer on contenteditable div[role="textbox"]
    const hwSrc = fs.readFileSync(path.join(root, "modules", "hostwarp", "body.js"), "utf8");
    const fiaStart = hwSrc.indexOf("const forceImmediateAnswer = () => {");
    const fiaEnd = hwSrc.indexOf("    const createAnswerNowButton = () => {");
    const fiaCode = hwSrc.slice(fiaStart, fiaEnd);
    const mockEditableDiv = {
        textContent: "Explain quantum entanglement",
        dispatched: [],
        dispatchEvent(ev) { this.dispatched.push(ev.type); },
    };
    const hwCtx = vm.createContext({
        GEMINI_SELECTORS: { input: 'div[role="textbox"]', sendButton: "button.send", stopButton: "button.stop" },
        document: {
            querySelector: () => mockEditableDiv,
            querySelectorAll: () => [],
        },
        Event: class { constructor(type) { this.type = type; } },
        setTimeout: () => {},
        Ψ: { glass: { toast: () => {} } },
    });
    vm.runInContext(`${fiaCode}
forceImmediateAnswer();`, hwCtx);
    assert("HostWarp Gemini forceImmediateAnswer appends immediate-response prompt to contenteditable div[role=textbox]", mockEditableDiv.textContent.includes("Explain quantum entanglement") && mockEditableDiv.textContent.includes("Answer immediately. No thinking steps.") && mockEditableDiv.dispatched.includes("input"));

    // 3B-2. HostWarp searxng default pattern (WO-01 round-2, 6-b F1): the
    // default must be a DELIMITER-FREE RegExp source that compiles and
    // matches the default origin form. The round-1 default wrapped a regex
    // literal in String(...), carrying the regex delimiters into
    // new RegExp(...), producing a pattern with a literal leading "/" and a
    // mid-pattern "^" that could never match — the module was dead under
    // default configuration. The literal is EVALUATED (not raw-extracted) so
    // JS escape sequences resolve exactly as the runtime sees them.
    assert("HostWarp searxng pattern default is the single SEARXNG_PATTERN_DEFAULT constant (no delimited regex-literal copies remain)",
        hwSrc.includes("SEARXNG_PATTERN_DEFAULT = ") && !hwSrc.includes("String(/^http"));
    const searxDefaultLit = hwSrc.match(/SEARXNG_PATTERN_DEFAULT = ('[^']*')/)[1];
    const searxDefaultSrc = new Function("return " + searxDefaultLit)();   /* evaluate the literal — escapes resolve as the runtime resolves them */
    const searxDefaultRe = new RegExp(searxDefaultSrc);
    assert("HostWarp searxng default pattern matches the default host (port and portless) and rejects foreign hosts",
        searxDefaultRe.test("http://192.168.1.1/") && searxDefaultRe.test("http://192.168.1.1:8080/") && !searxDefaultRe.test("http://example.com/"));

    /* 3C. REMOVED with plugins/candidshiny.user.js retirement (WO-01
     * round-1, 2-b F-05): the plugin's only consumer was the retired
     * LinkMasterΨ2 — its scanAllMedia redirect-unwrapping fixture tested an
     * orphan artifact that ran a 3333ms full-document scan interval forever,
     * outside every census scope. The redirect-unwrapping capability
     * survives in HostWarp (hosts engine) and Forum Link Xtractor
     * (candidshiny link aggregation), which carry their own fixtures above. */

    // 3D. Red control: verify TDZ self-shadowing (`const isFF = isFF;`) throws ReferenceError in VM
    let tdzCaught = false;
    try {
        vm.runInNewContext("(function() { const isFF = true; { const isFF = isFF; return isFF; } })()");
    } catch (e) {
        tdzCaught = e instanceof ReferenceError || (e && e.name === "ReferenceError");
    }
    assert("TDZ self-shadowing red control: `const isFF = isFF` throws ReferenceError and is absent from suite", tdzCaught);

    /* ── 4. GUP v7.0.1 Stepwise Gap Mitigation Fixtures (suite v1.7.2) ───── */
    // 4A. sink-census codeOnly template literal delimiter + interpolation token separation
    const { codeOnly } = await import("./sink-census.mjs");
    const tplView = codeOnly("const tag = `✓ Done (${result.mode} · ${formatDuration(elapsed)})`;\nsetTimeout(`alert(1)`, 10);");
    assert(
        "sink-census codeOnly preserves token separation across adjacent ${...} interpolations and emits template backtick delimiters",
        tplView.includes("` result.mode  formatDuration(elapsed) `") && /setTimeout\s*\(\s*`/.test(tplView)
    );

    // 4B. Pixeldrain++ v1.2.1: Pending Jobs modal builds real DOM nodes (not raw HTML string) & escapeHTML is pure string sanitizer
    const pdSrc = fs.readFileSync(
        path.join(root, "canon", "_sovereign", "4ndr0tools - Pixeldrain++.user.js"),
        "utf8"
    );
    const pdEscapeCode = extractFn(pdSrc, "escapeHTML");
    const pdDebounceCode = extractFn(pdSrc, "debounce");
    const pdCtx = vm.createContext({ String, clearTimeout, setTimeout });
    vm.runInContext(`${pdEscapeCode}\n${pdDebounceCode}\nglobalThis.__pd = { escapeHTML, debounce };`, pdCtx);
    const escapedSample = pdCtx.__pd.escapeHTML('<img src=x onerror="1">');
    assert(
        "Pixeldrain++ v1.2.1 escapeHTML sanitizes HTML special characters purely without DOM innerHTML sinks and Pending Jobs uses el() DOM nodes",
        escapedSample === "&lt;img src=x onerror=&quot;1&quot;&gt;" &&
        pdSrc.includes("const list = el('div', null, jobs.map(j =>") &&
        pdSrc.includes("Modal.open({ title: `Pending Jobs (${jobs.length})`, body: list });") &&
        pdSrc.includes("const runNavRefresh = debounce(() => {") &&
        pdSrc.includes("GM_registerMenuCommand('★ Premium: active', openSettingsPanel);")
    );

    // 4C. Forums++ v1.10.2: gofile.io/d status check + trailing slash, cyberfile lookbehind + public folder gate, cyberdrop http param, GM_download Blob URL, interval cleanup
    const fppSrc = fs.readFileSync(
        path.join(root, "canon", "_sovereign", "4ndr0tools - Forums++.user.js"),
        "utf8"
    );
    const cyberfileMatch = [..."func('folder', 'cf98765')".matchAll(/(?<='folder',\s').*?(?=')/gis)].map((m) => m[0])[0];
    assert(
        "Forums++ v1.12.0 keeps the gofile status gate null-safe (the v1.10.2 precedence fix, strengthened in the round-6 API rewrite), cyberfile nodeId lookbehind ('cf98765') & public-folder gate, GM_download Blob URL, and downloadPost interval cleanup",
        cyberfileMatch === "cf98765" &&
        fppSrc.includes("if (!props || props.status !== 'ok' || !props.data)") &&
        fppSrc.includes("const id = String(urlOrId).includes('gofile.io/d/') ? String(urlOrId).split('/').reverse()[0] : String(urlOrId);") &&
        fppSrc.includes("if (requiredPassword && !unlocked)") &&
        fppSrc.includes("async (url, http) => {") &&
        fppSrc.includes("URL.createObjectURL(response.response)") &&
        fppSrc.includes("if (progress.intervalId) clearInterval(progress.intervalId);")
    );

    // 4D. LinkMasterΨ v6.3.2: jpg6.su non-destructive spoiler candidates, cyberdrop single-scheme rewrite, cyberfile null-safe folderId regex
    const lmSrc = fs.readFileSync(
        path.join(root, "canon", "_merged", "4ndr0tools - LinkMasterΨ.user.js"),
        "utf8"
    );
    const sampleSpoilers = ["postSecret123"];
    const spoilerCandidates = [...(Array.isArray(sampleSpoilers) ? sampleSpoilers : []), ...((Array.isArray(sampleSpoilers) && sampleSpoilers.includes("ramona")) ? [] : ["ramona"])];
    const cdRewritten = "https://cyberdrop.me/f/abcXYZ".replace(/^(?:https?:\/\/)?cyberdrop\.me\/(f|e)\//i, "https://cyberdrop.me/api/f/");
    const cfAltHtml = '<input type="hidden" value="4242" name="folderId">';
    const cfMatches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(cfAltHtml);
    const cfFolderId = cfMatches?.[1] || cfMatches?.[2] || null;
    assert(
        "LinkMasterΨ v6.3.2 preserves post spoilers before fallback ('postSecret123' -> 'ramona'), rewrites cyberdrop API without double-scheme, and extracts cyberfile group-2 folderId safely",
        spoilerCandidates[0] === "postSecret123" &&
        spoilerCandidates[1] === "ramona" &&
        cdRewritten === "https://cyberdrop.me/api/f/abcXYZ" &&
        cfFolderId === "4242" &&
        lmSrc.includes("const spoilerCandidates =") &&
        lmSrc.includes("const folderId = matches?.[1] || matches?.[2] || null;") &&
        lmSrc.includes("hasRedirectLink(n)")
    );

    /* ── 5. Hailuo++ 6.2.0 BlobSanitizer Fixtures (round 12) ────────────── */
    // 5A. The SHIPPED sanitizer executes against the operator's REAL round-12
    // attack-sample head (512 mangled bytes, base64-embedded) — the exact
    // bytes from the field report — plus a synthetic full roundtrip, the
    // negative controls, and the vault wiring tripwires.
    const hailuoSrc = fs.readFileSync(
        path.join(root, "canon", "_promoted", "4ndr0tools - Hailuo++.user.js"),
        "utf8"
    );
    const bsStart = hailuoSrc.indexOf("const BlobSanitizer = {");
    if (bsStart < 0) throw new Error("BlobSanitizer not found in Hailuo++ canon");
    let bsDepth = 0, bsEnd = -1;
    for (let i = hailuoSrc.indexOf("{", bsStart); i < hailuoSrc.length; i++) {
        if (hailuoSrc[i] === "{") bsDepth++;
        else if (hailuoSrc[i] === "}") { bsDepth--; if (bsDepth === 0) { bsEnd = i + 1; break; } }
    }
    /* The extracted object's free `Logger` reference must resolve in THIS
     * scope or every repair silently no-ops into its catch — a silent-`null`
     * trap the fail-visible discipline exists to prevent. */
    const Logger = { debug() {}, info() {}, warn() {}, error() {} };
    const BlobSanitizer = eval("(" + hailuoSrc.slice(bsStart, bsEnd).replace(/^const BlobSanitizer = /, "") + ")");

    const R12_SAMPLE_HEAD_B64 =
        "w7/DmMO/w6AAEEpGSUYAAQEAAAEAAQAAw7/DogHDmElDQ19QUk9GSUxFAAEBAAABw4gAAAAABDAAAG1udHJSR0IgWFlaIAfDoAABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAw7bDlgABAAAAAMOTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAAw7AAAAAkclhZWgAAARQAAAAUZ1hZWgAAASgAAAAUYlhZWgAAATwAAAAUd3RwdAAAAVAAAAAUclRSQwAAAWQAAAAoZ1RSQwAAAWQAAAAoYlRSQwAAAWQAAAAoY3BydAAAAcWSAAAAPG1sdWMAAAAAAAAAAQAAAAxlblVTAAAACAAAABwAcwBSAEcAQlhZWiAAAAAAAABvwqIAADjDtQAAA8KQWFlaIAAAAAAAAGLihKIAAMK34oCmAAAYw5pYWVogAAAAAAAAJMKgAAAP4oCeAADCtsOPWFlaIAAAAAAAAMO2w5YAAQAAAADDky1wYXJhAAAAAAAEAAAAAmZmAADDssKnAAANWQAAE8OQAAAKWwAAAAAAAAAAbWx1YwAAAAAAAAABAAAADGVuVVMAAAAgAAAAHABHAG8AbwBnAGwAZQAgAEk=";
    const r12Head = Buffer.from(R12_SAMPLE_HEAD_B64, "base64");
    const EXPECTED_CLEAN_HEAD = Buffer.from("ffd8ffe000104a46494600010100000100010000ffe201d8", "hex");
    const r12Repaired = await BlobSanitizer.repairBlob(new Blob([r12Head], { type: "image/png" }));
    let r12Bytes = null;
    if (r12Repaired) r12Bytes = Buffer.from(await r12Repaired.arrayBuffer());
    assert(
        "5A. Hailuo++ BlobSanitizer repairs the operator's REAL round-12 attack-sample head (Windows-1252-then-UTF-8 double-encoded JPEG; ffd8ffe0 magic + clean prefix byte-exact + corrected MIME)",
        !!r12Repaired && r12Bytes.subarray(0, EXPECTED_CLEAN_HEAD.length).equals(EXPECTED_CLEAN_HEAD) && r12Repaired.type === "image/jpeg",
        r12Repaired ? `size=${r12Bytes.length} mime=${r12Repaired.type}` : "repair returned null"
    );

    // 5B. Synthetic full roundtrip: an "original" binary with a JPEG magic and
    // every byte value present, mangled through the standard cp1252 decoder +
    // UTF-8 encoder (the exact corruption pipeline), then repaired — the
    // result must be byte-identical to the original.
    const syntheticOriginal = Buffer.alloc(4096);
    for (let i = 0; i < syntheticOriginal.length; i++) syntheticOriginal[i] = (i * 7 + 13) & 0xff;
    syntheticOriginal[0] = 0xff; syntheticOriginal[1] = 0xd8; syntheticOriginal[2] = 0xff;
    const mangledViaCp1252 = Buffer.from(new TextDecoder("windows-1252").decode(syntheticOriginal), "utf8");
    const syntheticRepaired = await BlobSanitizer.repairBlob(new Blob([mangledViaCp1252], { type: "" }));
    let syntheticBytes = null;
    if (syntheticRepaired) syntheticBytes = Buffer.from(await syntheticRepaired.arrayBuffer());
    assert(
        "5B. BlobSanitizer synthetic full roundtrip: original binary (all 256 byte values, JPEG magic) -> cp1252/UTF-8 mangle -> repair -> BYTE-IDENTICAL to the original",
        !!syntheticRepaired && syntheticBytes.equals(syntheticOriginal) && syntheticRepaired.type === "image/jpeg",
        syntheticRepaired ? `size=${syntheticBytes.length}` : "repair returned null"
    );

    // 5C. Negative controls — the sanitizer never touches what it must not.
    const cleanJpegHead = Buffer.from("ffd8ffe000104a4649460001010000010001", "hex");
    const cleanBlob = new Blob([cleanJpegHead], { type: "image/jpeg" });
    const cleanResult = await BlobSanitizer.repairBlob(cleanBlob);
    const asciiResult = await BlobSanitizer.repairBlob(new Blob([Buffer.from("plain ascii text, not media")]));
    const wideResult = await BlobSanitizer.repairBlob(new Blob([Buffer.from("héllo ✓ wörld — em-dash", "utf8")]));
    const randomResult = await BlobSanitizer.repairBlob(new Blob([crypto.randomBytes(256)]));
    assert(
        "5C. BlobSanitizer negative controls: clean JPEG / ASCII / wide-char UTF-8 (✓) / random binary are ALL returned untouched (null — never worse)",
        cleanResult === null && asciiResult === null && wideResult === null && randomResult === null
    );

    // 5D. Vault wiring tripwires — the sanitizer is live at both boundaries.
    assert(
        "5D. Hailuo++ 6.2.0 vault wiring tripwires: the wrap repairs the registry entry (async, post-URL), SAVE sanitizes before filename/mint, and the version surfaces are stamped",
        hailuoSrc.includes("BlobSanitizer.repairBlob(rawClone)") &&
        hailuoSrc.includes("repairRegistryEntry(url, repaired)") &&
        hailuoSrc.includes("blobPayload = await BlobSanitizer.ensureClean(blobPayload);") &&
        hailuoSrc.includes("window.__andr0HailuoIntercept = '6.2.0';") &&
        /^\/\/ @version\s+6\.2\.0/m.test(hailuoSrc)
    );

    /* ── 6. The round-15 field settlement (Forums++ 1.13.8 + CB 4.1.5) ───────
     * The operator's 2026-10-30 battery (userscript_battery.md): three tests
     * died at the quick-download guard (`postId is not defined`), Bunkr
     * albums ended "FOUND 0 RESOURCE(S)" with zero diagnostics, a bare
     * turbo.cr/embed link died generically — and Maximize_Any_Media's iframe
     * control tokens were being embedded into the open editor by CB's upload
     * receiver. Every contract below pins its fix; every red control
     * reconstructs the shipped defect in a copied source and proves this
     * battery rejects it. */
    // 6A. The quick-download re-entry guard is qualified (15a F01) — the
    // v1.13.1 (7d F05) guard read a bare `postId` that never existed in the
    // per-post button's closure, so EVERY click died as a ReferenceError
    // before downloadPostGuarded ran; the Download-Page sibling was always
    // qualified. Static + sabotage red control.
    const r15GuardOk =
        fppSrc.includes("p.postId === parsedPost.postId && p.processing") &&
        !fppSrc.includes("p.postId === postId && p.processing");
    assert(
        "6A. Forums++ 1.13.8 quick-download guard reads parsedPost.postId (15a F01) — the bare-postId ReferenceError class is gone and no sibling guard regressed",
        r15GuardOk
    );
    const r15Sabotaged = fppSrc.replace(
        "p.postId === parsedPost.postId && p.processing",
        "p.postId === postId && p.processing"
    );
    const r15SabotagedContractOk =
        r15Sabotaged.includes("p.postId === parsedPost.postId && p.processing") &&
        !r15Sabotaged.includes("p.postId === postId && p.processing");
    assert(
        "6A-red. sabotage control: the r14 bare-postId guard reconstructed in a copied source is REJECTED by the same contract (a battery that cannot fail is a liar)",
        !r15SabotagedContractOk && r15Sabotaged !== fppSrc
    );

    // 6B. The turbo/saint2 malformed-link contracts, EXECUTED against the
    // shipped resolver code (the norm-symmetry extraction precedent — the
    // code under test is the canon, not an inline copy). Stubs carry the
    // free references; the no-id branches return before touching any of
    // the network machinery.
    // 16a F01: the v1.13.8 contracts were correct but UNREACHABLE — the
    // fixture called the resolver directly while the pipeline's walker
    // strips the trailing slash the TABLE regex demanded (6B3 pins the
    // reachability now; the recovery ladder lands in 6B4).
    const r15Errors = [];
    const log = { host: { error: (...a) => r15Errors.push(a), info() {}, warn() {} } };
    const turboIdBySignedUrl = new Map();
    const xfpdTurboOrigin = () => "https://turbo.cr";
    const xfpdTurboSignUrlWithTimeout = async () => null;
    const r15Http = { get: async () => ({ dom: { querySelector: () => null } }) };
    const extractSaintResolver = marker => {
        const idx = fppSrc.indexOf(marker);
        if (idx === -1) throw new Error(`saint resolver marker missing: ${marker}`);
        const fnIdx = fppSrc.indexOf("async (url", idx);
        if (fnIdx === -1 || fnIdx - idx > 600) throw new Error("resolver function not adjacent to marker");
        const bodyOpen = fppSrc.indexOf("{", fnIdx);
        let depth = 1;
        for (let i = bodyOpen + 1; i < fppSrc.length; i++) {
            if (fppSrc[i] === "{") depth++;
            else if (fppSrc[i] === "}") { depth--; if (depth === 0) return fppSrc.slice(fnIdx, i + 1); }
        }
        throw new Error("unbalanced saint resolver body");
    };
    const VD_MARKER = "[/(([\\w-]+\\.)?(saint2.(su|pk|cr)|turbo\\.cr))\\/(v|d)(\\/|$|\\?|#)/],";
    const EMBED_MARKER = "[/(([\\w-]+\\.)?(saint2.(su|pk|cr)|turbo\\.cr))\\/embed(\\/|$|\\?|#)/],";
    const ALBUM_MARKER = "[/(([\\w-]+\\.)?(saint2.(su|pk|cr)|turbo\\.cr))\\/a(\\/|$|\\?|#)/],";
    /* 16a F01: the recovery helper is the SHIPPED code too — extracted and
     * executed, never stubbed, so the no-id refusals below run the real
     * ladder against the dead-route mock. */
    const REC_MARKER = "const xfpdTurboRecoverBareRoute = async (http, url) => {";
    const recIdx = fppSrc.indexOf(REC_MARKER);
    if (recIdx === -1) throw new Error("bare-route recovery helper not found in canon");
    const recFnIdx = fppSrc.indexOf("async (http, url) => {", recIdx);
    const recBodyOpen = fppSrc.indexOf("{", recFnIdx);
    let recDepth = 1;
    let recEnd = -1;
    for (let i = recBodyOpen + 1; i < fppSrc.length; i++) {
        if (fppSrc[i] === "{") recDepth++;
        else if (fppSrc[i] === "}") { recDepth--; if (recDepth === 0) { recEnd = i + 1; break; } }
    }
    const xfpdTurboRecoverBareRoute = eval("(" + fppSrc.slice(recFnIdx, recEnd) + ")");
    const vdResolver = eval("(" + extractSaintResolver(VD_MARKER) + ")");
    const embedResolver = eval("(" + extractSaintResolver(EMBED_MARKER) + ")");
    const albumResolver = eval("(" + extractSaintResolver(ALBUM_MARKER) + ")");

    const embedNoId = await embedResolver("https://turbo.cr/embed", r15Http, [], "POST-T1");
    const vdNoId = await vdResolver("https://turbo.cr/v", r15Http, [], "POST-T2");
    const namedEmbed = r15Errors.some(a => String(a[1]).includes("Malformed turbo/saint2 embed link") && a[2] === "turbo.cr");
    const namedVd = r15Errors.some(a => String(a[1]).includes("Malformed turbo/saint2 link (no id)") && a[2] === "turbo.cr");
    assert(
        "6B. the shipped saint resolvers refuse malformed no-id links with NAMED host errors (15a F02/F03): bare /embed -> null + 'Malformed turbo/saint2 embed link', bare /v -> null + 'Malformed turbo/saint2 link (no id)' — never a generic could-not-resolve, never the page URL as media",
        embedNoId === null && vdNoId === null && namedEmbed && namedVd
    );
    const vdQueryLegacy = await vdResolver("https://turbo.cr/d?id=x", r15Http, [], "POST-T3");
    const vdRealId = await vdResolver("https://turbo.cr/v/abc123", r15Http, [], "POST-T4");
    assert(
        "6B2. superset guard: the /v|d resolver's legacy query passthrough ('https://turbo.cr/d?id=x' returned verbatim) and the real-id ladder (sign miss -> embed DOM miss -> the /d/{id} direct-route fallback 'https://turbo.cr/d/abc123') are intact",
        vdQueryLegacy === "https://turbo.cr/d?id=x" && vdRealId === "https://turbo.cr/d/abc123"
    );

    // 6B3. THE PIPELINE-REACHABILITY PIN (16a F01) — the r15 defect class:
    // the walker strips the trailing slash (parseHosts' stripTrailingSlash
    // has no <keep_ts> on the Saint matchers), so the bare href
    // 'https://turbo.cr/embed/' presents as 'https://turbo.cr/embed' — and
    // the v1.13.8 table regexes demanded the stripped slash, so the named
    // refusals NEVER fired through the real dispatch (the operator's r16
    // re-run still got the generic 'Could not resolve' + 'FOUND 0
    // RESOURCE(S)'). The table and harvest patterns are rebuilt from the
    // canon and tested against the PIPELINE-NORMALIZED forms.
    const mkTable = marker => new RegExp(marker.slice(2, marker.lastIndexOf("/],")), "is");
    const vdTable = mkTable(VD_MARKER);
    const embedTable = mkTable(EMBED_MARKER);
    const albumTable = mkTable(ALBUM_MARKER);
    /* 16a F01 (r16a amendment): the harvest patterns are EXTRACTED from the
     * canon too — an inline copy would re-open the exact fixture-bypass
     * class this assertion closes (a later revert of the canon's boundary
     * would leave the fixture green, lying about reachability). */
    const harvestSrcOf = hostMarker => {
        const i = fppSrc.indexOf(hostMarker);
        if (i === -1) throw new Error(`harvest marker missing: ${hostMarker}`);
        const open = fppSrc.indexOf("[/", i);
        const close = fppSrc.indexOf("/]]", open);
        if (open === -1 || close === -1 || close - open > 400) throw new Error(`harvest pattern not adjacent to marker: ${hostMarker}`);
        /* the pipeline's own placeholder substitution (parseHosts): ~an@ -> a
         * class, the <no_qs>/<keep_ts> options stripped — the extracted form
         * must be the one the walker actually compiles. */
        return fppSrc.slice(open + 2, close).replace(/<no_qs>|<keep_ts>|~an@/g, mm => (mm === "~an@" ? "[a-zA-Z0-9]" : ""));
    };
    const harvestBoundary = new RegExp(harvestSrcOf("['Saint:video', ["), "i");
    const harvestAlbumBoundary = new RegExp(harvestSrcOf("['Saint:albums', ["), "i");
    assert(
        "6B3. table+harvest reachability for the walker-stripped forms (16a F01): bare '/embed', '/v', '/d' and '/a' MATCH their resolvers through the real dispatch; id-carrying and query forms still match; '/videos', '/api/sign?v=x', '/embedx', '/about' stay out (no false positives); the harvest boundary accepts slashless bare hrefs while rejecting route-lookalikes",
        vdTable.test("https://turbo.cr/v") && vdTable.test("https://turbo.cr/d") &&
        embedTable.test("https://turbo.cr/embed") && albumTable.test("https://turbo.cr/a") &&
        embedTable.test("https://turbo.cr/embed/abc123") && vdTable.test("https://turbo.cr/v/abc123") && albumTable.test("https://turbo.cr/a/slug1") &&
        vdTable.test("https://turbo.cr/d?id=x") && embedTable.test("https://turbo.cr/embed?x=1") &&
        !vdTable.test("https://turbo.cr/videos") && !vdTable.test("https://turbo.cr/api/sign?v=x") &&
        !embedTable.test("https://turbo.cr/embedx") && !albumTable.test("https://turbo.cr/about") &&
        harvestBoundary.test("https://turbo.cr/embed") && harvestBoundary.test("https://turbo.cr/embed/") &&
        !harvestBoundary.test("https://turbo.cr/embedx") && !harvestBoundary.test("https://turbo.cr/videos") &&
        harvestAlbumBoundary.test("https://turbo.cr/a") && !harvestAlbumBoundary.test("https://turbo.cr/about")
    );

    // 6B4. THE BARE-ROUTE RECOVERY, EXECUTED (16a F01) — the shipped helper
    // decides the bare link's fate: exactly ONE id named by the route -> the
    // normal ladder resolves it; a direct <source>/<video> on an id-free
    // page -> the direct URL; a listing (many ids) -> the named refusal
    // carries the count; an unreachable route -> the named refusal carries
    // the fetch failure. The operator's 'FOUND 0 RESOURCE(S)' gets a WHY in
    // every branch — and a site-side move of the id still downloads.
    const singleIdHttp = { get: async () => ({ dom: { querySelector: () => null }, source: '<a href="/embed/abc123">v</a>' }) };
    const listingHttp = { get: async () => ({ dom: { querySelector: () => null }, source: '<a href="/embed/aaa111">1</a><a href="/embed/bbb222">2</a><a href="/v/ccc333">3</a>' }) };
    const directHttp = { get: async () => ({ dom: { querySelector: () => ({ getAttribute: () => "https://cdn.turbo.cr/v/xyz.mp4" }) }, source: "<p>no route links</p>" }) };
    const throwHttp = { get: async () => { throw new Error("403 CF"); } };
    const embedRecovered = await embedResolver("https://turbo.cr/embed", singleIdHttp, [], "POST-T5");
    const vdRecovered = await vdResolver("https://turbo.cr/v", singleIdHttp, [], "POST-T6");
    const embedDirect = await embedResolver("https://turbo.cr/embed", directHttp, [], "POST-T7");
    r15Errors.length = 0;
    const embedListing = await embedResolver("https://turbo.cr/embed", listingHttp, [], "POST-T8");
    const listingRefusal = r15Errors.some(a => String(a[1]).includes("route names 3 videos (a listing)"));
    r15Errors.length = 0;
    const embedUnreachable = await embedResolver("https://turbo.cr/embed", throwHttp, [], "POST-T9");
    const unreachableRefusal = r15Errors.some(a => String(a[1]).includes("route fetch failed"));
    assert(
        "6B4. the bare-route recovery ladder, EXECUTED from the shipped helper (16a F01): single-id route -> recovered -> the /d/{id} direct route (both resolvers); id-free page with <source> -> the direct media URL; listing -> null + 'route names N videos (a listing)'; unreachable -> null + 'route fetch failed' — every no-id branch names its WHY, and a site-side move of the id still resolves",
        embedRecovered === "https://turbo.cr/d/abc123" && vdRecovered === "https://turbo.cr/d/abc123" &&
        embedDirect === "https://cdn.turbo.cr/v/xyz.mp4" &&
        embedListing === null && listingRefusal &&
        embedUnreachable === null && unreachableRefusal
    );

    // 6B5. THE FAMILY SYMMETRY (16a F01) — the bare /a route refuses NAMED
    // ('no slug') BEFORE any fetch (the site's album INDEX can never be
    // walked as one album), and the embed resolver now ends at the /d/{id}
    // direct route like BOTH its siblings — the round-6 family contract
    // ('then the /d/ route as the last resort') finally holds for all
    // three resolvers.
    let albumFetches = 0;
    const albumHttp = { get: async () => { albumFetches += 1; return { dom: { querySelectorAll: () => [] }, source: "" }; } };
    r15Errors.length = 0;
    const albumBare = await albumResolver("https://turbo.cr/a", albumHttp, [], "POST-T10");
    const albumRefusal = r15Errors.some(a => String(a[1]).includes("Malformed turbo/saint2 album link (no slug)"));
    assert(
        "6B5. family symmetry: bare '/a' -> null + 'Malformed turbo/saint2 album link (no slug)' with ZERO fetches, and the embed resolver's real-id ladder now ends at the /d/{id} last resort (sign miss + DOM miss -> 'https://turbo.cr/d/abc123') exactly like its /v|d and album siblings",
        albumBare === null && albumFetches === 0 && albumRefusal &&
        (await embedResolver("https://turbo.cr/embed/abc123", r15Http, [], "POST-T11")) === "https://turbo.cr/d/abc123"
    );

    // 6C. The Bunkr fail-visible floor (15a F04/F05/F06): the fallback anchor
    // sweep (container-agnostic — a markup redesign cannot orphan the album),
    // the two named silent-empty exits, and the uniform consumer-level floor.
    assert(
        "6C. Bunkr album fail-visible floor: the /f|v|d anchor fallback sweep, 'Bunkr album unreachable on every mirror', 'Bunkr album page yielded no file links', and the uniform 'Album resolved 0 file(s)' consumer floor are all live in the canon",
        fppSrc.includes('a[href*="/f/"], a[href*="/v/"], a[href*="/d/"]') &&
        fppSrc.includes("Bunkr album unreachable on every mirror") &&
        fppSrc.includes("Bunkr album page yielded no file links") &&
        fppSrc.includes("Album resolved 0 file(s)") &&
        fppSrc.includes("if (url.includes('?')) return url;")
    );

    // 6D. The upload-channel synergy gate (15a F07), EXECUTED: CB's turbo.cr
    // receiver embedded MAM's control tokens into the open editor (the
    // operator's battery log shows 'Media payload embedded: iframeVideo'
    // firing on every hover). The gate pair: a live upload session + the
    // control-token refusal.
    const cbSrc = fs.readFileSync(
        path.join(root, "canon", "_promoted", "4ndr0tools - Confirmation Bypass.user.js"),
        "utf8"
    );
    const CB_RECV_MARKER = "const receivePostMessage = (e) => {";
    const cbIdx = cbSrc.indexOf(CB_RECV_MARKER);
    if (cbIdx === -1) throw new Error("receivePostMessage not found in CB canon");
    let cbDepth = 1;
    let cbEnd = -1;
    for (let i = cbIdx + CB_RECV_MARKER.length; i < cbSrc.length; i++) {
        if (cbSrc[i] === "{") cbDepth++;
        else if (cbSrc[i] === "}") { cbDepth--; if (cbDepth === 0) { cbEnd = i + 1; break; } }
    }
    const cbRecvSrc = cbSrc.slice(cbIdx, cbEnd);

    const cbLog = [];
    const cbCloseCalls = [];
    const makeCbSandbox = () => {
        /* ONE stable textarea object per sandbox — the receiver appends to
         * the object it queried, so the readback must see THAT object, not a
         * freshly constructed one per querySelectorAll call. */
        const textarea = { value: "" };
        const sandbox = {
            URL,
            ALLOWED_MESSAGE_HOSTS: new Set(["turbo.cr"]),
            MAM_CONTROL_TOKENS: new Set(["iframeVideo", "iframePicInPic", "parentFull", "parentSmall", "innerFull", "innerSmall"]),
            /* r17 (F02): the receiver's exactly-once latch rides the sandbox
             * (the closure dependency the extracted function needs). */
            embeddedPayloads: new Set(),
            console: { log: (s) => cbLog.push(String(s)) },
            document: {
                getElementsByClassName: (cls) =>
                    cls === "fr-element" ? [{}] : (cls === "fr-wrapper" ? [{ style: { display: "none" } }] : []),
                querySelectorAll: (sel) => (sel.includes("Rich text box") ? [textarea] : []),
            },
            window: { __turboUploadWin: null },
        };
        return { sandbox, textarea };
    };
    const runReceiver = (recvSrc, uploadWin, origin, data) => {
        cbLog.length = 0;
        cbCloseCalls.length = 0;
        const { sandbox, textarea } = makeCbSandbox();
        if (uploadWin) sandbox.window.__turboUploadWin = uploadWin;
        const ctx = vm.createContext(sandbox);
        vm.runInContext(`${recvSrc}\nglobalThis.__recv = receivePostMessage;`, ctx);
        ctx.__recv({ origin, data });
        return {
            textarea: textarea.value,
            logs: [...cbLog],
            closed: cbCloseCalls.length,
        };
    };
    const liveWin = { closed: false, close: () => cbCloseCalls.push(1) };

    const t1 = runReceiver(cbRecvSrc, null, "https://turbo.cr", "iframeVideo");
    const t2 = runReceiver(cbRecvSrc, liveWin, "https://turbo.cr", "iframeVideo");
    const t3 = runReceiver(cbRecvSrc, liveWin, "https://turbo.cr", "https://turbo.cr/v/abc123");
    const t4 = runReceiver(cbRecvSrc, { closed: true }, "https://turbo.cr", "some-payload");
    const t5 = runReceiver(cbRecvSrc, liveWin, "https://turbo.cr", "close");
    const t6 = runReceiver(cbRecvSrc, liveWin, "https://evil.example", "https://turbo.cr/v/abc123");
    /* r17 (F02): the hardened receiver — 'done-close' is a PAYLOAD now (the
     * close token is exact), an object payload is refused, and a duplicate
     * post embeds exactly once (same context, two posts). */
    const t7 = runReceiver(cbRecvSrc, liveWin, "https://turbo.cr", "done-close");
    const t8 = runReceiver(cbRecvSrc, liveWin, "https://turbo.cr", { token: "iframeVideo" });
    cbLog.length = 0;
    cbCloseCalls.length = 0;
    const { sandbox: dedupeSandbox, textarea: dedupeTextarea } = makeCbSandbox();
    dedupeSandbox.window.__turboUploadWin = liveWin;
    const dedupeCtx = vm.createContext(dedupeSandbox);
    vm.runInContext(`${cbRecvSrc}\nglobalThis.__recv = receivePostMessage;`, dedupeCtx);
    dedupeCtx.__recv({ origin: "https://turbo.cr", data: "dup-payload" });
    dedupeCtx.__recv({ origin: "https://turbo.cr", data: "dup-payload" });
    const t9 = { textarea: dedupeTextarea.value, logs: [...cbLog] };
    assert(
        "6D. the shipped upload receiver gates the channel (15a F07 + r17 F02): MAM's 'iframeVideo' token embeds NOTHING with or without a session, a REAL payload embeds only when the upload window is live ('[MEDIA=saint_vid]…[/MEDIA]' + the console line), a dead session is ignored, the EXACT 'close' token fires only on the live window, a foreign origin is refused, 'done-close' is a payload (never a close — the substring trap), an object payload is refused outright, and a duplicate post embeds exactly once",
        t1.textarea === "" && t1.logs.length === 0 &&
        t2.textarea === "" && t2.logs.length === 0 &&
        t3.textarea === "[MEDIA=saint_vid]https://turbo.cr/v/abc123[/MEDIA]" && t3.logs.length === 1 &&
        t4.textarea === "" && t4.logs.length === 0 &&
        t5.closed === 1 && t5.textarea === "" &&
        t6.textarea === "" && t6.logs.length === 0 &&
        t7.closed === 0 && t7.textarea === "[MEDIA=saint_vid]done-close[/MEDIA]" &&
        t8.textarea === "" && t8.logs.length === 0 &&
        t9.textarea === "[MEDIA=saint_vid]dup-payload[/MEDIA]" && t9.logs.length === 1
    );

    // 6D-red. Both gates stripped from a copied source reproduces the r14
    // field defect (the token embeds as garbage) — the battery sees it.
    const cbSabotaged = cbRecvSrc
        .replace("if (!uploadSessionLive) return;", "")
        .replace("if (MAM_CONTROL_TOKENS.has(e.data)) return;", "");
    const tRed = runReceiver(cbSabotaged, null, "https://turbo.cr", "iframeVideo");
    assert(
        "6D-red. sabotage control: with both gates stripped, 'iframeVideo' embeds as [MEDIA=saint_vid]iframeVideo[/MEDIA] garbage — the exact r14 field defect this round closes (the gate pair is load-bearing)",
        tRed.textarea.includes("iframeVideo") && cbSabotaged !== cbRecvSrc
    );

    // 6E. Version stamps + the CB static contract surface.
    assert(
        "6E. the round-17 stamps: Forums++ canon at 1.14.0, Confirmation Bypass canon at 4.1.7 (header AND banner), and CB carries the MAM_CONTROL_TOKENS vocabulary + the uploadSessionLive gate verbatim",
        /^\/\/ @version\s+1\.14\.0/m.test(fppSrc) &&
        /^\/\/ @version\s+4\.1\.7/m.test(cbSrc) &&
        cbSrc.includes("Confirmation Bypass v4.1.7") &&
        cbSrc.includes("MAM_CONTROL_TOKENS") &&
        cbSrc.includes("uploadSessionLive")
    );

    // 6F. THE CAPTCHA-AWARE CLICK TIMING (16a F02), EXECUTED against the
    // shipped initializeDownloadTrigger in a stub-DOM/timer sandbox: the
    // operator's r16 field report — the fixed 300 ms grace is tuned for the
    // no-captcha page (their successful log: trigger ~370 ms after boot)
    // but a page whose Altcha is still solving can swallow the click (the
    // button enables before the PoW verifies; the handler gates on the
    // captcha state; both MAX_CLICKS are spent into the closed gate).
    // Scenarios: (1) no captcha -> the legacy fast click; (2) solving ->
    // DEFERRED with one evidence line; (3) the verified flip lands the
    // click; (4) a never-verifying widget -> the bounded cap still delivers
    // the legacy click (never worse than 4.1.5).
    const TRIG_MARKER = "function initializeDownloadTrigger() {";
    const trigIdx = cbSrc.indexOf(TRIG_MARKER);
    if (trigIdx === -1) throw new Error("initializeDownloadTrigger not found in CB canon");
    let trigDepth = 1;
    let trigEnd = -1;
    for (let i = trigIdx + TRIG_MARKER.length; i < cbSrc.length; i++) {
        if (cbSrc[i] === "{") trigDepth++;
        else if (cbSrc[i] === "}") { trigDepth--; if (trigDepth === 0) { trigEnd = i + 1; break; } }
    }
    const trigSrc = cbSrc.slice(trigIdx, trigEnd);

    const bootTrigger = (altchaState, src = trigSrc) => {
        const logs = [];
        const timers = [];
        const observers = [];
        /* r17 (F02): the button is a FACTORY + a swappable current pointer
         * (the budget scenario swaps the node the way an SPA re-render
         * does), the observer stub honors observe()/disconnect() (the
         * re-arm semantics are only testable when a disconnected observer
         * stops firing), and clearTimeout actually cancels (the cap-timer
         * clear must be visible to the virtual clock). */
        const makeBtn = () => ({
            disabled: false,
            attrs: {},
            hasAttribute(a) { return a in this.attrs; },
            getAttribute(a) { return a in this.attrs ? this.attrs[a] : null; },
            setAttribute(a, v) { this.attrs[a] = String(v); },
            removeAttribute(a) { delete this.attrs[a]; },
            get textContent() { return "Download File"; },
            get className() { return ""; },
            dispatchEvent: () => true,
        });
        let currentBtn = makeBtn();
        let state = altchaState;
        const doc = {
            setAltcha: s => { state = s; observers.forEach(o => { if (o._observing) o._cb(); }); },
            swapButton: () => { currentBtn = makeBtn(); },
            querySelector: sel => {
                if (sel === "#downloadBtn") return currentBtn;
                if (sel.includes(".altcha")) return (state === "unverified" || state === "verifying") ? { getAttribute: () => state } : null;
                return null;
            },
            querySelectorAll: () => [],
            addEventListener: () => {},
        };
        const win = {
            location: { href: "https://turbo.cr/d/abc" },
            setTimeout: (fn, ms) => { const t = { fn, ms, fired: false }; timers.push(t); return t; },
            clearTimeout: (t) => { if (t) t.fired = true; },
            addEventListener: () => {},
            MutationObserver: class {
                constructor(cb) { this._cb = cb; this._observing = false; observers.push(this); }
                observe() { this._observing = true; }
                disconnect() { this._observing = false; }
            },
        };
        const fakeConsole = { log: s => logs.push(String(s)), debug: () => {}, error: () => {} };
        const fn = new Function("window", "document", "console", "MouseEvent", "MutationObserver", `'use strict'; return (${src})();`);
        fn(win, doc, fakeConsole, class MouseEvent {}, win.MutationObserver);
        const drain = maxSimMs => {
            for (;;) {
                const pending = timers.filter(t => !t.fired).sort((a, b) => a.ms - b.ms);
                if (!pending.length || pending[0].ms > maxSimMs) break;
                pending[0].fired = true;
                pending[0].fn();
            }
        };
        return { logs, btn: currentBtn, doc, drain };
    };

    const s1 = bootTrigger(null);
    s1.drain(10000);
    const noCaptcha = s1.btn.attrs["data-cb4-dl-clicked"] === "true" &&
        s1.logs.some(l => l.includes("Download button triggered.")) &&
        !s1.logs.some(l => l.includes("deferred"));

    const s2 = bootTrigger("unverified");
    s2.drain(5000);
    const deferred = s2.btn.attrs["data-cb4-dl-clicked"] === undefined &&
        s2.logs.some(l => l.includes("Download click deferred")) &&
        !s2.logs.some(l => l.includes("Download button triggered."));

    const s3 = bootTrigger("unverified");
    s3.drain(5000);
    s3.doc.setAltcha("verified");
    s3.drain(2000);
    const verifiedLands = s3.btn.attrs["data-cb4-dl-clicked"] === "true" &&
        s3.logs.some(l => l.includes("Download button triggered."));
    /* r17 (F02): the solved page's cap timer DIES with the landed click —
     * draining past 15 s must NOT print the false 'captcha gate expired'
     * evidence line the 4.1.6 machine logged on every successfully solved
     * page that stayed open. */
    s3.drain(20000);
    const noFalseCapLine = !s3.logs.some(l => l.includes("captcha gate expired"));

    const s4 = bootTrigger("unverified");
    s4.drain(20000);
    const capDelivers = s4.logs.some(l => l.includes("captcha gate expired")) &&
        s4.btn.attrs["data-cb4-dl-clicked"] === "true";

    assert(
        "6F. captcha-aware click timing, EXECUTED from the shipped trigger (16a F02 + r17 F02): no-captcha page keeps the legacy fast click (trigger line, zero deferral); a solving Altcha DEFERS the click (guard unset + the evidence line); the verified flip lands the click; a never-verifying widget still gets the legacy click via the bounded cap — never worse than 4.1.5; and the solved page logs NO false 'gate expired' line past the cap window (the timer dies with the landed click)",
        noCaptcha && deferred && verifiedLands && capDelivers && noFalseCapLine
    );

    // 6F2 (r17 F02): THE RE-ARMED CAPTCHA, WIRED — the 4.1.6 comment
    // promised the gated retry would route through the observer path, but
    // the observer was already disconnected at click #1's success; the
    // observer is re-armed on that path now, so the re-verified flip lands
    // click #2 within ~720 ms of the flip — not at the stale 15 s cap.
    // (The captcha re-arms BETWEEN click #1 and the rearm timer, so the
    // rearm's re-click is gated and takes the re-observe path.)
    const s5 = bootTrigger("unverified");
    s5.drain(5000);
    s5.doc.setAltcha("verified");
    s5.drain(1000);
    const clicksAfterFirst = s5.logs.filter(l => l.includes("Download button triggered.")).length;
    /* The captcha re-arms AFTER the 1.5 s reaction window closes (a re-arm
     * inside the window legitimately trips the reaction observer and
     * suppresses the re-click — the page reacted). Only the between-windows
     * re-arm reaches the gated re-click path this fixture pins. */
    s5.drain(1500);
    s5.doc.setAltcha("unverified");
    s5.drain(1600);
    s5.doc.setAltcha("verified");
    s5.drain(1000);
    const s5Triggers = s5.logs.filter(l => l.includes("Download button triggered.")).length;
    const s5Deferrals = s5.logs.filter(l => l.includes("Download click deferred")).length;
    const s5NoFalseCap = !s5.logs.some(l => l.includes("captcha gate expired"));
    assert(
        "6F2. the re-armed captcha, wired (r17 F02): after click #1 and a captcha re-arm, the gated re-click re-arms the OBSERVER and the re-verified flip lands click #2 (2 trigger lines, 2 deferral lines — the second deferral is NEW evidence, the log-once flag re-arms), with no false cap line",
        clicksAfterFirst === 1 && s5Triggers === 2 && s5Deferrals === 2 && s5NoFalseCap
    );

    // 6F3 (r17 F02): THE BUDGET AT THE CHOKE POINT — a node swap plus the
    // original cap timer cannot spend click #3 with MAX_CLICKS = 2 (the
    // 4.1.6 machine enforced the budget only when scheduling the rearm).
    const s6 = bootTrigger("unverified");
    s6.drain(5000);
    s6.doc.setAltcha("verified");
    s6.drain(2000);
    s6.drain(2500);
    s6.doc.swapButton();
    s6.drain(16000);
    const s6Triggers = s6.logs.filter(l => l.includes("Download button triggered.")).length;
    assert(
        "6F3. the click budget at the choke point (r17 F02): with both MAX_CLICKS spent and the page re-rendering a fresh control, the original cap timer's attempt is refused — exactly 2 trigger lines, never a third",
        s6Triggers === 2
    );

    // 6F3-red. Both budget mitigations stripped from a copied source
    // reconstruct the 4.1.6 defect: the never-cleared cap fires at 15 s on
    // a swapped node and spends click #3.
    const trigSabotagedBudget = trigSrc
        .replace("if (captchaCapTimer) { window.clearTimeout(captchaCapTimer); captchaCapTimer = null; }", "")
        .replace("if (clicks >= MAX_CLICKS) return true;", "");
    const s6Red = bootTrigger("unverified", trigSabotagedBudget);
    s6Red.drain(5000);
    s6Red.doc.setAltcha("verified");
    s6Red.drain(2000);
    s6Red.drain(2500);
    s6Red.doc.swapButton();
    s6Red.drain(16000);
    const s6RedTriggers = s6Red.logs.filter(l => l.includes("Download button triggered.")).length;
    assert(
        "6F3-red. sabotage control: with the cap-clear and the budget guard both stripped, the stale cap timer fires on the swapped node and spends click #3 (3 trigger lines) — the exact 4.1.6 defect the pair closes (the mitigations are load-bearing)",
        s6RedTriggers === 3 && trigSabotagedBudget !== trigSrc
    );

    // 6G. THE HARVEST ALTERNATION SPLIT, SETTLED (r17 F01) — the composed
    // wrapper is EXTRACTED from the canon (the `const pat` line inside
    // execMatcher) and composed with the EXTRACTED Saint:video, Cyberdrop
    // and Pixeldrain matchers exactly the way parseHosts compiles them:
    // id-carrying turbo/saint2 links must harvest WITH their ids (the
    // resolver ladder the r15/r16 fixtures certified was
    // pipeline-unreachable before), Cyberdrop fs- links keep their path,
    // bare forms stay bare, boundary false-positives stay out, and
    // single-branch matchers are unaffected (the grouping is match-neutral).
    const patTemplate = (() => {
        const m = fppSrc.match(/^ *const pat = `.*`;\s*$/m);
        if (!m) throw new Error("wrapper template (const pat) not found in Forums++ canon");
        return m[0].trim().replace("const pat = `", "").replace("`;", "");
    })();
    const matcherSrcOf = marker => {
        const i = fppSrc.indexOf(marker);
        if (i === -1) throw new Error(`matcher marker missing: ${marker}`);
        const open = fppSrc.indexOf("[/", i);
        const close = fppSrc.indexOf("/]", open);
        if (open === -1 || close === -1) throw new Error(`matcher pattern not adjacent to marker: ${marker}`);
        return fppSrc.slice(open + 2, close);
    };
    const composeHarvest = (matcherSrc, template = patTemplate) => {
        let patternStr = String(matcherSrc);
        patternStr = patternStr.replace(/<no_qs>|<keep_ts>|~an@/g, mm => (mm === "~an@" ? "[a-zA-Z0-9]" : ""));
        return new RegExp(template.replaceAll("${h.re.toString(patternStr)}", patternStr), "igs");
    };
    const harvestOf = (matcherSrc, post, template) => {
        const pattern = composeHarvest(matcherSrc, template);
        const raw = [...post.matchAll(pattern)].map(m => m[0].trim());
        return [...new Set(raw.map(u => (u.endsWith("/") ? u.slice(0, -1) : u)))];
    };
    const saintMatcher = matcherSrcOf("['Saint:video', [");
    const cyberMatcher = matcherSrcOf("['Cyberdrop:', [");
    const pdMatcher = matcherSrcOf("['Pixeldrain:', [");
    const g1 = harvestOf(saintMatcher, `<a href="https://turbo.cr/v/abc123">v</a>`);
    const g2 = harvestOf(saintMatcher, `<a href="https://turbo.cr/embed/abc123">v</a>`);
    const g3 = harvestOf(saintMatcher, `<a href="https://saint2.su/d/xyz789">v</a>`);
    const g4 = harvestOf(saintMatcher, `<a href="https://turbo.cr/embed/">v</a>`);
    const g5 = harvestOf(saintMatcher, `<a href="https://turbo.cr/videosx">v</a><a href="https://turbo.cr/embedx">v</a><a href="https://turbo.cr/about">v</a>`);
    const g6 = harvestOf(cyberMatcher, `<a href="https://fs-1.cyberdrop.to/file.jpg">x</a>`);
    const g7 = harvestOf(pdMatcher, `<a href="https://pixeldrain.com/u/abc123">x</a>`);
    assert(
        "6G. the harvest alternation split, settled (r17 F01): through the REAL composed wrapper, id-carrying /v, /embed and /d links harvest WITH their ids; the bare /embed/ form harvests bare (walker-stripped parity); /videosx, /embedx and /about stay out; Cyberdrop fs- keeps its full path; and the single-branch Pixeldrain control is byte-identical (the grouping is match-neutral where it must be)",
        JSON.stringify(g1) === '["https://turbo.cr/v/abc123"]' &&
        JSON.stringify(g2) === '["https://turbo.cr/embed/abc123"]' &&
        JSON.stringify(g3) === '["https://saint2.su/d/xyz789"]' &&
        JSON.stringify(g4) === '["https://turbo.cr/embed"]' &&
        JSON.stringify(g5) === "[]" &&
        JSON.stringify(g6) === '["https://fs-1.cyberdrop.to/file.jpg"]' &&
        JSON.stringify(g7) === '["https://pixeldrain.com/u/abc123"]'
    );

    // 6G-red. The r16 composition (no grouping) reconstructed in a copied
    // template strips the id — the pin is load-bearing (a revert of the
    // grouping ships silently otherwise).
    const r16Template = patTemplate.replaceAll(`(?:${"${h.re.toString(patternStr)}"})`, "${h.re.toString(patternStr)}");
    const gRed = harvestOf(saintMatcher, `<a href="https://turbo.cr/v/abc123">v</a>`, r16Template);
    assert(
        "6G-red. sabotage control: the un-grouped r16 composition strips the id from the id-carrying href ('https://turbo.cr/v' — the defect this round settles) — the grouping is load-bearing",
        JSON.stringify(gRed) === '["https://turbo.cr/v"]' && r16Template !== patTemplate
    );

    // 6H. THE HOVER-ANNOUNCEMENT DEDUPE (r17 F03), EXECUTED from the shipped
    // setButton.init + handle.leavePlayer: one announcement per hover-ENTRY
    // (the r15 field's console storm), re-armed by leavePlayer, immediate
    // for a different player — the first announcement and the re-entry
    // contract preserved.
    const mamSrc = fs.readFileSync(
        path.join(root, "canon", "_sovereign", "4ndr0tools - Maximize_Any_Media.user.js"),
        "utf8"
    );
    const sliceBraceBlock = (src, marker) => {
        const i = src.indexOf(marker);
        if (i === -1) throw new Error(`marker missing in MAM canon: ${marker}`);
        let depth = 0, start = -1, end = -1, inStr = null;
        for (let j = i; j < src.length; j++) {
            const c = src[j];
            if (inStr) { if (c === inStr && src[j - 1] !== "\\") inStr = null; continue; }
            if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
            if (c === "{") { depth++; if (start === -1) start = j; }
            else if (c === "}") { depth--; if (depth === 0) { end = j + 1; break; } }
        }
        if (end === -1) throw new Error(`block unterminated: ${marker}`);
        return src.slice(i, end);
    };
    const mamSetButtonSrc = sliceBraceBlock(mamSrc, "const setButton = {");
    const mamLeaveSrc = sliceBraceBlock(mamSrc, "    leavePlayer() {");
    const mamSent = [];
    const mamGv = { isIframe: true, player: null, iframeVideoAnnounced: null, controlBtn: { style: { visibility: "" } }, picinpicBtn: null };
    const mamCtx = vm.createContext({
        gv: mamGv,
        tool: { isHalfFullClient: () => true },
        init: () => {},
        window: { parent: { postMessage: m => mamSent.push(m) } },
        document: { getElementById: () => ({}) },
    });
    vm.runInContext(`${mamSetButtonSrc}\nconst handle = { ${mamLeaveSrc} };\nglobalThis.__setInit = setButton.init; globalThis.__leave = handle.leavePlayer;`, mamCtx);
    const playerA = { nodeName: "VIDEO" };
    const playerB = { nodeName: "VIDEO" };
    mamGv.player = playerA;
    mamCtx.__setInit();
    mamCtx.__setInit();
    mamCtx.__setInit();
    const afterStorm = mamSent.length;
    mamCtx.__leave();
    mamCtx.__setInit();
    const afterReentry = mamSent.length;
    mamGv.player = playerB;
    mamCtx.__setInit();
    const afterNewPlayer = mamSent.length;
    assert(
        "6H. the hover-announcement dedupe, EXECUTED from the shipped setButton.init + leavePlayer (r17 F03): a three-mouseover storm on one player posts 'iframeVideo' exactly ONCE; leavePlayer re-arms and the re-entry posts again; a different player posts immediately — the first-announcement handshake and the re-entry re-show contract preserved",
        afterStorm === 1 && afterReentry === 2 && afterNewPlayer === 3 && mamSent.every(m => m === "iframeVideo")
    );

    // 6F-red. The PoW gate stripped from a copied source reproduces the
    // 4.1.5 timing defect: the with-captcha page spends its clicks while
    // the Altcha is still solving — the battery sees it.
    const trigSabotaged = trigSrc.split("if (captchaGated()) return false;").join("");
    const sRed = bootTrigger("unverified", trigSabotaged);
    sRed.drain(5000);
    assert(
        "6F-red. sabotage control: with the captchaGated() checks stripped, the solving page clicks immediately (guard set inside the 5 s window) — the exact 4.1.5 timing defect this round closes (the gate is load-bearing)",
        sRed.btn.attrs["data-cb4-dl-clicked"] === "true" && trigSabotaged !== trigSrc
    );

    /* ── 7. THE ROUND-18 CROSS-TRAINING CONTRACTS ───────────────────────────
     * The cross-trainee ledger (R18-F01…F18), every fix pinned with an
     * EXECUTED proof from the shipped source plus a red control that
     * reconstructs the exact defect — the 6G/6H/6F-red precedent. */

    // 7A (R18-F01): the hosts retry contract, EXECUTED from kernel/hosts.js —
    // a handler returning false at document-start is NOT latched and the
    // DOMContentLoaded re-dispatch reaches it; undefined-return handlers keep
    // the settle-on-first-dispatch superset; a throwing handler is retried,
    // bounded by the boot pair; a handler calling hosts.run() re-enters
    // safely (the guard no-ops); the hostwarp body propagates the signal.
    const hostsSrc = fs.readFileSync(path.join(root, "kernel", "hosts.js"), "utf8");
    const hostsCtx = vm.createContext({ console: { debug: () => {} }, location: { hostname: "imagetwist.com" } });
    vm.runInContext("globalThis.Ψ = { core: { uid: (() => { let n = 0; return (p) => p + '-' + (++n); })() } };" + hostsSrc, hostsCtx);
    const hostsApi = hostsCtx.Ψ.hosts;
    let hostDomReady = false, hostDispatches = 0;
    hostsApi.on("imagetwist.com", () => { hostDispatches++; return hostDomReady; }, { id: "retry-me" });
    const hostsFirst = hostsApi.run();
    hostDomReady = true;
    const hostsSecond = hostsApi.run();
    const hostsThird = hostsApi.run();
    let settleDispatches = 0;
    hostsApi.on("imagetwist.com", () => { settleDispatches++; }, { id: "settle-once" });
    hostsApi.run(); hostsApi.run();
    let throwDispatches = 0, throwLatched = false;
    hostsApi.on("imagetwist.com", () => { throwDispatches++; if (!throwLatched) { throwLatched = true; throw new Error("boom"); } }, { id: "thrower" });
    hostsApi.run(); hostsApi.run();
    let reentered = 0;
    hostsApi.on("imagetwist.com", () => { reentered++; const inner = hostsApi.run(); if (inner !== 0) throw new Error("re-entry returned handlers"); }, { id: "reentrant" });
    hostsApi.run();
    const hwR18Src = fs.readFileSync(path.join(root, "modules", "hostwarp", "body.js"), "utf8");
    assert(
        "7A. the hosts retry contract (r18 R18-F01), EXECUTED from kernel/hosts.js: the document-start dispatch of a DOM-incomplete handler (returns false) does NOT latch it — the DOMContentLoaded re-run re-dispatches and completes it (first=0, second=1, third=0 with exactly 2 dispatches); an undefined-return handler settles on FIRST dispatch (the superset); a throwing handler is retried on the next run (2 dispatches, never latched); a handler calling hosts.run() re-enters through the guard (no loop); and the hostwarp body propagates the signal (return handler()) with the sync click-through shapes",
        hostsFirst === 0 && hostsSecond === 1 && hostsThird === 0 && hostDispatches === 2 &&
        settleDispatches === 1 && throwDispatches === 2 && reentered === 1 &&
        hostsSrc.includes("complete = result !== false;") && hostsSrc.includes("if (dispatching) return 0;") &&
        hwR18Src.includes("return handler();") && hwR18Src.includes("if (redirectToImage('.pic')) return true;") &&
        hwR18Src.includes("if (!submitButton) return redirectToImage('.centred');")
    );

    // 7A-red: the pre-r18 latch (executed.add BEFORE the handler runs)
    // reconstructed in a copied kernel — the no-op document-start dispatch
    // consumes the handler and the DOMContentLoaded re-run is a no-op.
    const sFixStart = hostsSrc.indexOf("let complete = true;");
    const sFixEndMark = "if (complete) { executed.add(entry.id); ran++; }";
    const sFixEnd = hostsSrc.indexOf(sFixEndMark);
    const oldHostsBlock = `executed.add(entry.id);
                try {
                    entry.handler({ hostname: location.hostname, domain: hit.domain });
                    ran++;
                } catch (e) {
                    console.debug(\`[a4/hosts] handler "\${entry.id}" failed:\`, (e && e.message) || e);
                }`;
    const hostsSabotaged = hostsSrc.slice(0, sFixStart) + oldHostsBlock + hostsSrc.slice(sFixEnd + sFixEndMark.length);
    const hostsRedCtx = vm.createContext({ console: { debug: () => {} }, location: { hostname: "imagetwist.com" } });
    vm.runInContext("globalThis.Ψ = { core: { uid: (() => { let n = 0; return (p) => p + '-' + (++n); })() } };" + hostsSabotaged, hostsRedCtx);
    const hostsRedApi = hostsRedCtx.Ψ.hosts;
    let redDomReady = false, redDispatches = 0;
    hostsRedApi.on("imagetwist.com", () => { redDispatches++; return redDomReady; }, { id: "retry-me" });
    hostsRedApi.run();
    redDomReady = true;
    const redSecond = hostsRedApi.run();
    assert(
        "7A-red. sabotage control: with the pre-r18 latch reconstructed (executed.add BEFORE the handler runs), the document-start no-op consumes the handler — the DOMContentLoaded re-run reports 0 handlers and 1 total dispatch (the URL stays interstitial — the gate is load-bearing)",
        redDispatches === 1 && redSecond === 0 && hostsSabotaged !== hostsSrc
    );

    // 7B (R18-F02): the shared-namespace watcher registry, EXECUTED from
    // kernel/store.js under storage refusal — two facades of ONE namespace
    // hear each other's writes; same-facade notifications hold (v1.3.0);
    // different namespaces stay isolated.
    const storeSrc = fs.readFileSync(path.join(root, "kernel", "store.js"), "utf8");
    const makeStoreCtx = (src) => {
        const ctx = vm.createContext({
            console: { debug: () => {} },
            GM_getValue: () => undefined,
            GM_setValue: () => { throw new Error("refused"); },
        });
        vm.runInContext("globalThis.Ψ = {};" + src, ctx);
        return ctx;
    };
    const storeCtx = makeStoreCtx(storeSrc);
    const facadeA = storeCtx.Ψ.store.ns("pagecraft");
    const facadeB = storeCtx.Ψ.store.ns("pagecraft");
    let bodyNotifications = 0;
    facadeA.watch("collapse", () => { bodyNotifications++; });
    facadeB.set("collapse", true);            // the console-side write under refusal
    const viaB = bodyNotifications;
    facadeA.set("collapse", false);           // same-facade control (v1.3.0)
    const viaA = bodyNotifications;
    const otherNs = storeCtx.Ψ.store.ns("hostwarp");
    let otherNotifications = 0;
    otherNs.watch("mod:imagehosts", () => { otherNotifications++; });
    facadeB.set("mod:imagehosts", true);      // different namespace — isolated
    const savedValue = facadeA.get("collapse", null);
    assert(
        "7B. the shared-namespace watcher registry (r18 R18-F02), EXECUTED from kernel/store.js under GM write refusal: the settings-console facade's set() notifies the module body's watcher through the OTHER facade (1 notification — live-apply alive exactly when storage refuses); the same-facade control fires too; a DIFFERENT namespace's watcher hears nothing (isolation held); and the refused write still lands in the shared memory snapshot",
        viaB === 1 && viaA === 2 && otherNotifications === 0 && savedValue === false
    );

    // 7B-red: the per-facade watcher arrays (the v1.3.0 shape) reconstructed
    // in a copied kernel — the body watcher receives ZERO notifications.
    const regStart = storeSrc.indexOf("let reg = nsRegistries.get(prefix);");
    const regEndMark = "const gmListenerKeys = reg.gmListenerKeys;";
    const regEnd = storeSrc.indexOf(regEndMark);
    const storeSabotaged = storeSrc.slice(0, regStart) + "const watchers = [];\n        const gmListenerKeys = new Set();" + storeSrc.slice(regEnd + regEndMark.length);
    const storeRedCtx = makeStoreCtx(storeSabotaged);
    const redA = storeRedCtx.Ψ.store.ns("pagecraft");
    const redB = storeRedCtx.Ψ.store.ns("pagecraft");
    let redBodyNotifications = 0;
    redA.watch("collapse", () => { redBodyNotifications++; });
    redB.set("collapse", true);
    assert(
        "7B-red. sabotage control: with the per-facade watcher arrays reconstructed (the pre-r18 shape), the console facade's write notifies only its OWN watchers — the module body's watcher receives 0 notifications (live-apply dead under storage refusal — the registry sharing is load-bearing)",
        redBodyNotifications === 0 && storeSabotaged !== storeSrc
    );

    // 7C (R18-F03): the LinkMasterΨ harvest composition, EXECUTED through
    // the REAL wrapper template + the REAL Cyberdrop matcher extracted from
    // the canon — an fs- link harvests WITH its full path and the harvested
    // form passes the resolver gate; the un-grouped composition strips it
    // and the gate drops the resource (the r17-F01 twin).
    const lmPatStart = lmSrc.indexOf("const pat = `");
    const lmPatEnd = lmSrc.indexOf("`;", lmPatStart);
    if (lmPatStart < 0 || lmPatEnd < 0) throw new Error("LinkMasterΨ wrapper template not found");
    const lmTemplate = lmSrc.slice(lmPatStart + "const pat = `".length, lmPatEnd);
    const lmMatcherSrcOf = (marker) => {
        const i = lmSrc.indexOf(marker);
        if (i === -1) throw new Error(`matcher marker missing in LinkMasterΨ: ${marker}`);
        const open = lmSrc.indexOf("[/", i);
        /* the SINGLE matcher is the first regex literal in the hosts array —
         * its body ends at the earliest of `/,` (another matcher follows) or
         * `/]` (array closes). */
        const endA = lmSrc.indexOf("/,", open);
        const endB = lmSrc.indexOf("/]", open);
        const end = Math.min(endA === -1 ? Infinity : endA, endB === -1 ? Infinity : endB);
        if (open === -1 || end === Infinity) throw new Error(`matcher pattern not adjacent to marker: ${marker}`);
        return lmSrc.slice(open + 2, end);
    };
    const composeLm = (matcherSrc, template) => {
        let p = String(matcherSrc).replace(/~an@/g, "a-zA-Z0-9").replace("<no_qs>", "").replace("<keep_ts>", "");
        let pat = template.split("${h.re.toString(pattern)}").join(p);
        pat = pat.replace(/\$\{h\.re\.toString\(\s*pattern\s*\)\}/g, p);
        return new RegExp(pat, "igs");
    };
    const lmHarvestOf = (matcherSrc, post, template) => {
        const pattern = composeLm(matcherSrc, template);
        const raw = [...post.matchAll(pattern)].map((m) => m[0].trim());
        return [...new Set(raw.map((u) => (u.endsWith("/") ? u.slice(0, -1) : u)))];
    };
    const lmCyberMatcher = lmMatcherSrcOf('["Cyberdrop:", [');
    const lmCyberPost = `<a href="https://fs-01.cyberdrop.me/AbCdEf12/full-name.mp4">x</a>`;
    const lmGrouped = lmHarvestOf(lmCyberMatcher, lmCyberPost, lmTemplate);
    const lmUngroupedTemplate = lmTemplate
        .replace(/\(\?:\$\{h\.re\.toString\(pattern\)\}\)/g, "${h.re.toString(pattern)}")
        .replace(/\(\?:\$\{h\.re\.toString\(\s*pattern\s*\)\}\)/g, "${h.re.toString(pattern)}");
    const lmUngrouped = lmHarvestOf(lmCyberMatcher, lmCyberPost, lmUngroupedTemplate);
    const lmGateIdx = lmSrc.indexOf("[/fs-\\d+.cyberdrop.(me|to|cc|nl)\\/");
    const lmGateFirstRegexOf = (idx) => {
        /* the resolver gate's FIRST matcher — same first-regex-literal logic
         * as the matcher extraction. */
        const open = lmSrc.indexOf("[/", idx);
        const endA = lmSrc.indexOf("/,", open);
        const endB = lmSrc.indexOf("/]", open);
        const end = Math.min(endA === -1 ? Infinity : endA, endB === -1 ? Infinity : endB);
        if (open === -1 || end === Infinity) throw new Error("resolver gate matcher not found");
        return lmSrc.slice(open + 2, end);
    };
    const lmGate = new RegExp(lmGateFirstRegexOf(lmGateIdx), "i");
    assert(
        "7C. the LinkMasterΨ harvest alternation settlement (r18 R18-F03), EXECUTED through the REAL wrapper + matcher: the grouped composition harvests the FULL fs- URL (path intact) and the harvested form PASSES the resolver gate's own pattern (pipeline-reachable); the un-grouped r17-shape composition strips it to the bare origin which the gate REJECTS (the resource silently dropped — the twin of the Forums++ r17 F01, closed here)",
        JSON.stringify(lmGrouped) === '["https://fs-01.cyberdrop.me/AbCdEf12/full-name.mp4"]' &&
        lmGate.test(lmGrouped[0]) === true &&
        JSON.stringify(lmUngrouped) === '["https://fs-01.cyberdrop.me"]' &&
        lmGate.test(lmUngrouped[0]) === false &&
        lmUngroupedTemplate !== lmTemplate
    );

    // 7D (R18-F04): the ZIP name allocation, EXECUTED from the shipped
    // allocation block with a JSZip-shaped add-or-replace stub — distinct
    // Unicode names that sanitize to the same key allocate DIFFERENT final
    // paths (both entries survive), the folder separator survives
    // (!flatten), log.txt/links.txt are reserved against replacement, and
    // same-name pairs still dedupe.
    const lmAllocStart = lmSrc.indexOf("let fn = sanitizeSegment(");
    const lmAllocEndMark = "usedPaths.add(fn);";
    const lmAllocEnd = lmSrc.indexOf(lmAllocEndMark, lmAllocStart);
    if (lmAllocStart < 0 || lmAllocEnd < 0) throw new Error("LinkMasterΨ allocation block not found");
    const lmAllocBody = lmSrc.slice(lmAllocStart, lmAllocEnd + lmAllocEndMark.length);
    const lmSanStart = lmSrc.indexOf("const sanitizeSegment = (s) =>");
    const lmSanEnd = lmSrc.indexOf("\n", lmSanStart);
    const lmSanitizeDef = lmSrc.slice(lmSanStart, lmSanEnd) + ";";
    const lmExtStart = lmSrc.indexOf("    ext: (path) => {");
    const lmExtEnd = lmSrc.indexOf("},", lmExtStart);
    const lmFnNoExtStart = lmSrc.indexOf("    fnNoExt: (path) => {");
    const lmFnNoExtEnd = lmSrc.indexOf("    },", lmFnNoExtStart) + 5;
    const lmHelpers = "const __h = {" + lmSrc.slice(lmExtStart + 4, lmExtEnd + 1) + ",\n" + lmSrc.slice(lmFnNoExtStart + 4, lmFnNoExtEnd) + "};";
    const runAllocShipped = (resources, opts) => {
        const zipStub = { files: {}, file(n, d) { this.files[n] = d; } };
        const ctx = vm.createContext({ console: { debug: () => {} } });
        const reserved = [];
        if (opts && opts.generateLog) reserved.push("log.txt");
        if (opts && opts.generateLinks) reserved.push("links.txt");
        const runnerSrc = `(function makeAlloc() {
${lmSanitizeDef}
${lmHelpers}
    const h = { generateFilename: (u) => u, ext: __h.ext, fnNoExt: __h.fnNoExt };
    const postSettings = ${JSON.stringify({ flatten: !!(opts && opts.flatten), generateLog: !!(opts && opts.generateLog), generateLinks: !!(opts && opts.generateLinks) })};
    const zip = globalThis.__zip;
    const usedPaths = new Set(${JSON.stringify(reserved)});
    return function alloc(url, folderName, response) {
${lmAllocBody}
        zip.file(fn, "payload:" + url);
        return fn;
    };
})()`;
        ctx.__zip = zipStub;
        vm.runInContext("globalThis.__alloc = " + runnerSrc + ";", ctx);
        const allocated = [];
        for (const r of resources) allocated.push(ctx.__alloc(r.url, r.folderName, { responseHeaders: "" }));
        return { zipStub, allocated };
    };
    const zipCollide = runAllocShipped([
        { url: "café.jpg", folderName: null },
        { url: "cafè.jpg", folderName: null },
        { url: "log.txt", folderName: null },
    ], { generateLog: true });
    const zipFolder = runAllocShipped([{ url: "name.jpg", folderName: "album/sub" }], {});
    const zipLegacyDedupe = runAllocShipped([
        { url: "same.jpg", folderName: null },
        { url: "same.jpg", folderName: null },
    ], {});
    assert(
        "7D. the ZIP name allocation (r18 R18-F04), EXECUTED from the shipped block with a JSZip-shaped add-or-replace stub: café.jpg and cafè.jpg (distinct raw names, one sanitized key) allocate DISTINCT final paths — both entries survive in the archive (3 files, not 2); a reserved log.txt pushes the downloaded log.txt to 'log (2).txt' (generated artifacts can never replace downloaded bytes); the !flatten folder separator SURVIVES sanitization (album/sub/name.jpg — the in-zip structure preserved); and a same-name pair still dedupes (same.jpg + same (2).jpg)",
        Object.keys(zipCollide.zipStub.files).length === 3 &&
        zipCollide.allocated[0] === "caf_.jpg" && zipCollide.allocated[1] === "caf_ (2).jpg" && zipCollide.allocated[2] === "log (2).txt" &&
        zipFolder.allocated[0] === "album/sub/name.jpg" &&
        zipLegacyDedupe.allocated[0] === "same.jpg" && zipLegacyDedupe.allocated[1] === "same (2).jpg"
    );

    // 7D-red: the pre-r18 order (dedupe the RAW basename, sanitize the whole
    // path AFTER) reconstructed — both Unicode names collide onto one entry
    // and the folder separator is eaten.
    const runAllocOld = (resources) => {
        const zipStub = { files: {}, file(n, d) { this.files[n] = d; } };
        const ctx = vm.createContext({});
        const oldBody = `(function makeAllocOld() {
    const h = { generateFilename: (u) => u, ext: (p) => { const i = String(p).lastIndexOf("."); return i < 0 ? null : String(p).slice(i + 1).toLowerCase(); }, fnNoExt: (p) => { const i = String(p).lastIndexOf("."); return i < 0 ? String(p) : String(p).slice(0, i); } };
    const postSettings = { flatten: false };
    const zip = globalThis.__zip;
    return function alloc(url, folderName) {
        const filenames = [];
        let basename = h.generateFilename(url);
        const originalBase = basename;
        let count = 2;
        while (filenames.includes(basename)) {
            const ext = h.ext(originalBase);
            basename = h.fnNoExt(originalBase) + " (" + (count++) + ")" + (ext ? "." + ext : "");
        }
        filenames.push(basename);
        let fn = basename;
        if (!postSettings.flatten && folderName) fn = folderName.replace(/[^\\u0000-\\u007f]/g, "_").replace(/[<>:"\\/|?*]/g, "_") + "/" + basename;
        fn = fn.replace(/[\\u0000-\\u001f\\u007f-\\uffff<>:"\\\\/|?*]/g, "_");
        return fn;
    };
})()`;
        ctx.__zip = zipStub;
        vm.runInContext("globalThis.__allocOld = " + oldBody + ";", ctx);
        const allocated = [];
        for (const r of resources) allocated.push(ctx.__allocOld(r.url, r.folderName));
        return { zipStub, allocated };
    };
    const zipRed = runAllocOld([
        { url: "café.jpg", folderName: null },
        { url: "cafè.jpg", folderName: null },
        { url: "name.jpg", folderName: "album" },
    ]);
    assert(
        "7D-red. sabotage control: the pre-r18 order reconstructed (dedupe the raw basename, sanitize the whole path after) — café.jpg and cafè.jpg both allocate caf_.jpg (JSZip's same-name write REPLACES the first entry: one file where two were downloaded) and the folder separator is eaten (album_name.jpg) — the sanitize-then-dedupe order is load-bearing",
        zipRed.allocated[0] === "caf_.jpg" && zipRed.allocated[1] === "caf_.jpg" && zipRed.allocated[2] === "album_name.jpg"
    );

    // 7E (R18-F05): the popup safe-media filter, EXECUTED from the shipped
    // getSafeMediaSrc — the transport's own data:image/video URLs are
    // admitted; data:text/html and javascript: stay refused; http/https/blob
    // hold (the redirect-safety contract unchanged).
    const igpSrc = fs.readFileSync(path.join(root, "canon", "_merged", "4ndr0tools - Images++.user.js"), "utf8");
    const gsmStart = igpSrc.indexOf("  getSafeMediaSrc(src) {");
    let gsmDepth = 0, gsmEnd = -1;
    for (let i = igpSrc.indexOf("{", gsmStart); i < igpSrc.length; i++) {
        if (igpSrc[i] === "{") gsmDepth++;
        else if (igpSrc[i] === "}") { gsmDepth--; if (gsmDepth === 0) { gsmEnd = i; break; } }
    }
    if (gsmStart < 0 || gsmEnd < 0) throw new Error("getSafeMediaSrc not found in Images++");
    const gsmMethod = igpSrc.slice(gsmStart, gsmEnd + 1).trim();
    const gsmFnSrc = "(" + gsmMethod.replace(/^getSafeMediaSrc\(src\)\s*\{/, "function (src) {").replace(/,\s*$/, "") + ")";
    const gsmCtx = vm.createContext({ URL, location: { href: "https://host.page/x" } });
    const gsm = vm.runInContext(gsmFnSrc, gsmCtx);
    assert(
        "7E. the popup safe-media admission (r18 R18-F05), EXECUTED from the shipped getSafeMediaSrc: the privileged transport's data:image/png and data:video/webm URLs are admitted (the popup can render its OWN xhr-fetched content — the pre-fix filter blocked every xhr-mode preview); data:text/html and javascript: stay REFUSED (the redirect-safety contract the filter was built for); http/https/blob hold",
        gsm("data:image/png;base64,iVBORw0KGgo=") === "data:image/png;base64,iVBORw0KGgo=" &&
        gsm("data:video/webm;codecs=vp8") === "data:video/webm;codecs=vp8" &&
        gsm("data:text/html;base64,PHNjcmlwdD4=") === null &&
        gsm("javascript:alert(1)") === null &&
        gsm("https://cdn.example/img.png") === "https://cdn.example/img.png" &&
        gsm("blob:https://host.page/uuid") === "blob:https://host.page/uuid"
    );

    // 7E-red: the pre-fix filter (https?/blob only) reconstructed — the
    // transport's own data URL is blocked.
    const gsmRedCtx = vm.createContext({ URL, location: { href: "https://host.page/x" } });
    vm.runInContext("globalThis.__gsmOld = function (src) { try { const u = new URL(`${src}`, location.href); return /^(https?:|blob:)$/i.test(u.protocol) ? u.href : null; } catch { return null; } };", gsmRedCtx);
    assert(
        "7E-red. sabotage control: the pre-fix filter reconstructed (https?/blob only) rejects the transport's own data:image URL (null — 'Blocked unsafe popup URL' on every xhr-mode preview) — the validated-media admission is load-bearing",
        gsmRedCtx.__gsmOld("data:image/png;base64,iVBORw0KGgo=") === null
    );

    // 7F (R18-F06): the canvas serializer stability, EXECUTED from the
    // shipped Akasha seed/perturb/blindedScratch — repeated serializes of
    // the SAME canvas produce byte-identical perturbed pixels; distinct
    // canvases diverge; the scratch-keyed seed reconstructed diverges.
    const akSrc = fs.readFileSync(path.join(root, "canon", "_merged", "4ndr0tools - Akasha Silence.user.js"), "utf8");
    const akSliceFn = (name) => {
        const i = akSrc.indexOf("function " + name + "(");
        if (i < 0) throw new Error("Akasha fn missing: " + name);
        let dd = 0, start = akSrc.indexOf("{", i);
        for (let j = start; j < akSrc.length; j++) {
            if (akSrc[j] === "{") dd++;
            else if (akSrc[j] === "}") { dd--; if (dd === 0) return akSrc.slice(i, j + 1); }
        }
        throw new Error("unbalanced " + name);
    };
    const akMulberryIdx = akSrc.indexOf("function mulberry32(");
    let akMulberryFn = "";
    if (akMulberryIdx >= 0) {
        let dd = 0, s = akSrc.indexOf("{", akMulberryIdx);
        for (let j = s; j < akSrc.length; j++) {
            if (akSrc[j] === "{") dd++;
            else if (akSrc[j] === "}") { dd--; if (dd === 0) { akMulberryFn = akSrc.slice(akMulberryIdx, j + 1); break; } }
        }
    } else throw new Error("mulberry32 not found in Akasha");
    const akCtxBase = () => {
        const scratchPuts = [];
        const mkCanvas = (w, h) => {
            const ctx2 = {
                __canvasPixels: null,
                drawImage(src) { this.__canvasPixels = src.__canvasPixels; },
                putImageData(img) { scratchPuts.push(Array.from(img.data)); },
            };
            return { width: w, height: h, __canvasPixels: null, getContext: () => ctx2 };
        };
        return vm.createContext({
            document: { createElement: () => mkCanvas(2, 1) },
            console: { debug: () => {} },
            __scratchPuts: scratchPuts,
            __originalGetImageData: { call: (ctx2, x, y, w, h) => ({ data: ctx2.__canvasPixels.slice() }) },
        });
    };
    const akRunSrc = (scratchSrc) =>
        akMulberryFn + "\nconst canvasSeeds = new WeakMap();\n" + akSliceFn("canvasSeed") + "\n" + akSliceFn("perturbImageData") +
        "\nconst originalGetImageData = globalThis.__originalGetImageData;\n" + scratchSrc +
        "\nglobalThis.__run = (srcCanvas) => blindedScratch(srcCanvas);";
    const akCtx = akCtxBase();
    vm.runInContext(akRunSrc(akSliceFn("blindedScratch")), akCtx);
    const akPixelsA = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 255]);
    const akPixelsB = new Uint8ClampedArray([99, 20, 30, 255, 40, 50, 60, 255]);
    const akSource = { width: 2, height: 1, __canvasPixels: akPixelsA };
    akCtx.__run(akSource);
    const akPutA1 = akCtx.__scratchPuts[akCtx.__scratchPuts.length - 1];
    akCtx.__run(akSource);
    const akPutA2 = akCtx.__scratchPuts[akCtx.__scratchPuts.length - 1];
    akCtx.__run({ width: 2, height: 1, __canvasPixels: akPixelsB });
    const akPutB = akCtx.__scratchPuts[akCtx.__scratchPuts.length - 1];
    const akScratchSabotaged = akSliceFn("blindedScratch").split("perturbImageData(source, img.data);").join("perturbImageData(scratch, img.data);");
    const akRedCtx = akCtxBase();
    vm.runInContext(akRunSrc(akScratchSabotaged), akRedCtx);
    const akRedSource = { width: 2, height: 1, __canvasPixels: akPixelsA };
    akRedCtx.__run(akRedSource);
    const akRedPut1 = akRedCtx.__scratchPuts[akRedCtx.__scratchPuts.length - 1];
    akRedCtx.__run(akRedSource);
    const akRedPut2 = akRedCtx.__scratchPuts[akRedCtx.__scratchPuts.length - 1];
    assert(
        "7F. the canvas serializer stability (r18 R18-F06), EXECUTED from the shipped seed/perturb/blindedScratch: repeated serializes of the SAME canvas produce byte-identical perturbed pixels (the read-twice-compare detector sees a stable canvas); a distinct canvas diverges; the scratch-keyed seed reconstructed (the pre-r18 shape) makes the same canvas's serializes DIVERGE — the source-keyed seed is load-bearing",
        JSON.stringify(akPutA1) === JSON.stringify(akPutA2) &&
        JSON.stringify(akPutA1) !== JSON.stringify(akPutB) &&
        JSON.stringify(akRedPut1) !== JSON.stringify(akRedPut2) &&
        akSrc.includes("perturbImageData(source, img.data);")
    );

    // 7G-1 (R18-F07): the individual-export import gate, EXECUTED from the
    // shipped processAndSavePrompts — a single exported prompt OBJECT
    // imports; an array imports; garbage still refuses.
    const pmSrc = fs.readFileSync(path.join(root, "canon", "_sovereign", "4ndr0tools - Prompt Master.user.js"), "utf8");
    const pmProcessStart = pmSrc.indexOf("async function processAndSavePrompts(e) {");
    let pmDepth = 0, pmProcessEnd = -1;
    for (let j = pmSrc.indexOf("{", pmProcessStart); j < pmSrc.length; j++) {
        if (pmSrc[j] === "{") pmDepth++;
        else if (pmSrc[j] === "}") { pmDepth--; if (pmDepth === 0) { pmProcessEnd = j; break; } }
    }
    const pmProcessFn = pmSrc.slice(pmProcessStart, pmProcessEnd + 1);
    const pmImportCtx = vm.createContext({
        console: { debug: () => {}, log: () => {} },
        getAll: async () => [{ id: "fixed1", isFixed: true }],
        resolveCollectionPathToId: async () => "col0",
        generatePromptId: () => "pid",
        normalizePositions: () => {},
        saveRawPrompts: async () => {},
        promptsToStorage: (t) => t,
        refreshMenu: async () => {},
    });
    vm.runInContext(pmProcessFn + "\nglobalThis.__import = processAndSavePrompts;", pmImportCtx);
    const singleObjectImport = await vm.runInContext("globalThis.__import({ title: 'Solo', text: 'hello' }).then(n => n).catch(e => 'THREW:' + e.message)", pmImportCtx);
    const arrayImport = await vm.runInContext("globalThis.__import([{ title: 'A' }, { title: 'B' }]).then(n => n).catch(e => 'THREW:' + e.message)", pmImportCtx);
    const garbageImport = await vm.runInContext("globalThis.__import('garbage').then(() => 'NO-THROW').catch(e => 'THREW')", pmImportCtx);
    assert(
        "7G-1. the individual-export import gate (r18 R18-F07), EXECUTED from the shipped processAndSavePrompts: a single exported prompt OBJECT imports (1 record — the separate-files export round-trips); an array imports as before (2); a non-object non-array still refuses (THREW)",
        singleObjectImport === 1 && arrayImport === 2 && garbageImport === "THREW"
    );

    // 7G-2 (R18-F08): the Gist truncated branch, EXECUTED from the shipped
    // block — a truncated:true payload falls to raw_url; a complete inline
    // content parses directly; a null content still fetches raw (v28.1.0).
    const pmGistStart = pmSrc.indexOf("const parseAndResolve = (text) => {");
    const pmGistEndMark = 'return void reject(new Error("Gist has no backup file"));';
    const pmGistEnd = pmSrc.indexOf(pmGistEndMark, pmGistStart);
    const pmGistBlock = pmSrc.slice(pmGistStart, pmGistEnd + pmGistEndMark.length);
    const runGistBranch = (file, rawStatus) => new Promise((outerResolve) => {
        const requests = [];
        const ctx = vm.createContext({
            pat: "test-token",
            resolve: (v) => outerResolve({ resolved: v, rawRequests: requests.length }),
            reject: (e) => outerResolve({ rejected: e.message, rawRequests: requests.length }),
            GM_xmlhttpRequest: (opts) => {
                requests.push(opts.url);
                opts.onload({ status: rawStatus, responseText: '{"data":{"full":1},"meta":{}}' });
            },
        });
        vm.runInContext("globalThis.__try = (file) => { try { " + pmGistBlock + "\n; } catch (err) { reject(new Error('Failed to parse Gist content')); } };", ctx);
        ctx.__try(file);
    });
    const gistTruncated = await runGistBranch({ content: '{"data":{"par', truncated: true, raw_url: "https://gist/raw/backup.json" }, 200);
    const gistComplete = await runGistBranch({ content: '{"data":{"ok":1},"meta":{}}', truncated: false }, 200);
    const gistNullContent = await runGistBranch({ content: null, raw_url: "https://gist/raw/backup.json" }, 200);
    assert(
        "7G-2. the Gist truncated branch (r18 R18-F08), EXECUTED from the shipped block: a truncated:true response with PARTIAL content falls to the raw_url arm (1 raw request, resolves with the full payload); a complete inline content parses directly (0 raw requests); a null content still fetches raw (the v28.1.0 case preserved)",
        gistTruncated.rawRequests === 1 && gistTruncated.resolved && gistTruncated.resolved.data && gistTruncated.resolved.data.full === 1 &&
        gistComplete.rawRequests === 0 && gistComplete.resolved && gistComplete.resolved.data && gistComplete.resolved.data.ok === 1 &&
        gistNullContent.rawRequests === 1 && gistNullContent.resolved && gistNullContent.resolved.data && gistNullContent.resolved.data.full === 1
    );

    // 7G-2-red: the old branch (content-presence only) reconstructed — the
    // truncated payload throws with ZERO raw requests.
    const pmGistOld = pmGistBlock.split("if (file.content != null && !file.truncated) {").join("if (file.content != null) {");
    const runGistOld = (file) => new Promise((outerResolve) => {
        let raws = 0;
        const ctx = vm.createContext({
            pat: "test-token",
            resolve: (v) => outerResolve({ resolved: v, raws }),
            reject: (e) => outerResolve({ rejected: e.message, raws }),
            GM_xmlhttpRequest: () => { raws++; },
        });
        vm.runInContext("globalThis.__try = (file) => { try { " + pmGistOld + "\n; } catch (err) { reject(new Error('Failed to parse Gist content')); } };", ctx);
        ctx.__try(file);
    });
    const gistRed = await runGistOld({ content: '{"data":{"par', truncated: true, raw_url: "https://gist/raw/backup.json" });
    assert(
        "7G-2-red. sabotage control: with the pre-r18 branch reconstructed (content-presence only), the truncated payload's parse throws and ZERO raw requests fire (the restore aborts) — the truncated flag is load-bearing",
        gistRed.rejected === "Failed to parse Gist content" && gistRed.raws === 0 && pmGistOld !== pmGistBlock
    );

    // 7H (R18-F09): the short-206 contract, EXECUTED from the shipped
    // single_host_ranged fetchChunk — a short body writes what arrived,
    // advances the resume cursor, and the retry fetches the REMAINDER; a
    // stuck-short server exhausts the attempts and fails VISIBLY; the
    // completeness gate stands in all three strategies.
    const pdR18Src = fs.readFileSync(path.join(root, "canon", "_sovereign", "4ndr0tools - Pixeldrain++.user.js"), "utf8");
    const pdFetchChunkStart = pdR18Src.indexOf("const fetchChunk = async (idx) => {", pdR18Src.indexOf("async single_host_ranged("));
    let pdDepth = 0, pdFetchChunkEnd = -1;
    for (let j = pdR18Src.indexOf("{", pdFetchChunkStart); j < pdR18Src.length; j++) {
        if (pdR18Src[j] === "{") pdDepth++;
        else if (pdR18Src[j] === "}") { pdDepth--; if (pdDepth === 0) { pdFetchChunkEnd = j; break; } }
    }
    const pdFetchChunkSrc = pdR18Src.slice(pdFetchChunkStart, pdFetchChunkEnd + 1);
    const runPdChunk = async (scriptBodies) => {
        const writes = [];
        const callLog = [];
        const script = [...scriptBodies];
        const ctx = vm.createContext({
            console: { debug: () => {} },
            SPOOF_HEADERS: {},
            SETTINGS: { chunkRetry: 2, downloadTimeoutMs: 5000, retryBackoffMs: 0, retryBackoffMultiplier: 1 },
            gmXHR: async (opts) => {
                callLog.push(opts.headers.Range);
                const body = script.length > 1 ? script.shift() : script[0];
                return { status: 206, response: new Uint8Array(body).buffer };
            },
            writable: { write: async (w) => writes.push({ position: w.position, bytes: Array.from(new Uint8Array(w.data)) }), abort: async () => {}, close: async () => {} },
            sleep: async () => {},
            performance: { now: () => 0 },
            onProgress: null,
            signal: null,
            url: "https://proxy/u/id",
            size: 16,
            chunkSize: 8,
            loadedArr: [0, 0],
            start: 0,
        });
        vm.runInContext("globalThis.__fetchChunk = (function () { " + pdFetchChunkSrc + "\n return fetchChunk; })();", ctx);
        const err = await vm.runInContext("globalThis.__fetchChunk(0).then(() => null).catch(e => e.message)", ctx);
        return { writes, callLog, loadedArr: ctx.loadedArr, err };
    };
    /* short 3-byte body then the 5-byte remainder for bytes=3-7 → the chunk completes via retry */
    const pdShort = await runPdChunk([[1, 2, 3], [4, 5, 6, 7, 8]]);
    /* a 1-byte-always server cannot fill an 8-byte span in chunkRetry+1
     * attempts → the attempts exhaust and the chunk fails VISIBLY */
    const pdAlwaysShort = await runPdChunk([[1]]);
    assert(
        "7H. the short-206 contract (r18 R18-F09), EXECUTED from the shipped single_host_ranged fetchChunk: a short 206 body writes what arrived, advances the resume cursor, and the retry fetches the REMAINDER (bytes=0-7 → bytes=3-7 — the chunk completes with 3+5 bytes at the right offsets, loadedArr=8); an always-short body exhausts the attempts and fails with the NAMED error (ok:true is never committed on an incomplete file); the completeness gate stands in all three strategies and the overshoot slice is present",
        pdShort.err === null &&
        pdShort.callLog[0] === "bytes=0-7" && pdShort.callLog[1] === "bytes=3-7" &&
        pdShort.loadedArr[0] === 8 &&
        pdShort.writes.length === 2 && pdShort.writes[0].position === 0 && pdShort.writes[0].bytes.length === 3 && pdShort.writes[1].position === 3 && pdShort.writes[1].bytes.length === 5 &&
        pdAlwaysShort.err !== null && /short 206 body/.test(pdAlwaysShort.err) &&
        (pdR18Src.match(/receivedTotal !== size/g) || []).length === 3 &&
        pdR18Src.includes("const chunkData = data.byteLength > span ? data.subarray(0, span) : data;")
    );

    // 7H-red: the pre-r18 acceptance (write + return on ANY 206) reconstructed.
    const pdOldChunk = pdFetchChunkSrc
        .replace(/\/\* v1\.2\.7 \(r18 R18-F09\): THE SHORT-206 CONTRACT[\s\S]*?span = to - from \+ 1;/, "const span = to - from + 1;")
        .split("if (!data.byteLength) throw new Error(`empty body (0 of ${span} bytes at offset ${from})`);").join("")
        .split("const chunkData = data.byteLength > span ? data.subarray(0, span) : data;").join("const chunkData = data;")
        .replace(/if \(chunkData\.byteLength >= span\) return;\n\s*throw new Error\(`short 206 body[^`]*`\);/, "return;");
    const runPdOld = async () => {
        const writes = [];
        const ctx = vm.createContext({
            console: { debug: () => {} },
            SPOOF_HEADERS: {},
            SETTINGS: { chunkRetry: 2, downloadTimeoutMs: 5000, retryBackoffMs: 0, retryBackoffMultiplier: 1 },
            gmXHR: async () => ({ status: 206, response: new Uint8Array([1, 2, 3]).buffer }),
            writable: { write: async (w) => writes.push({ position: w.position }), abort: async () => {}, close: async () => {} },
            sleep: async () => {},
            performance: { now: () => 0 },
            onProgress: null, signal: null, url: "u",
            size: 16, chunkSize: 8, loadedArr: [0, 0], start: 0,
        });
        vm.runInContext("globalThis.__oldChunk = (function () { " + pdOldChunk + "\n return fetchChunk; })();", ctx);
        const err = await vm.runInContext("globalThis.__oldChunk(0).then(() => null).catch(e => e.message)", ctx);
        return { err, writes, loadedArr: ctx.loadedArr };
    };
    const pdRed = await runPdOld();
    assert(
        "7H-red. sabotage control: with the pre-r18 acceptance reconstructed (no span validation, return on any 206), the 3-byte short body COMPLETES the chunk silently (no error, loadedArr=3 of 8 — the incomplete download committed as successful) — the span contract is load-bearing",
        pdRed.err === null && pdRed.loadedArr[0] === 3 && pdOldChunk !== pdFetchChunkSrc
    );

    // 7I (R18-F10): the rebased verifier, EXECUTED from the shipped
    // runAndVerifyBatch with YouTube-dedupe semantics — a duplicate-add
    // batch reports HONESTLY; the stale-baseline reconstruction overcounts.
    const ytSrc = fs.readFileSync(path.join(root, "canon", "_sovereign", "4ndr0tools - YouTube Playlist Master.user.js"), "utf8");
    const ytVerifyStart = ytSrc.indexOf("async function runAndVerifyBatch(");
    let ytDepth = 0, ytVerifyEnd = -1;
    for (let j = ytSrc.indexOf("{", ytVerifyStart); j < ytSrc.length; j++) {
        if (ytSrc[j] === "{") ytDepth++;
        else if (ytSrc[j] === "}") { ytDepth--; if (ytDepth === 0) { ytVerifyEnd = j; break; } }
    }
    const ytVerifySrc = ytSrc.slice(ytVerifyStart, ytVerifyEnd + 1);
    const ytCtxBase = () => {
        const playlist = [];
        const ctx = vm.createContext({
            console: { debug: () => {}, warn: () => {} },
            CFG: { MAX_BATCH_RETRIES: 3, BATCH_SIZE: 100 },
            READER: { loadPlaylist: async () => ({ items: playlist.map((v) => ({ videoId: v })) }) },
            INNERTUBE: { playlistEdit: async ({ actions }) => { for (const a of actions) if (!playlist.includes(a.addedVideoId)) playlist.push(a.addedVideoId); } },
            PACING: { sleep: async () => {} },
            LOG: { debug: () => {}, warn: () => {} },
        });
        return { ctx, playlist };
    };
    const ytFixedRun = ytCtxBase();
    vm.runInContext(ytVerifySrc + "\nglobalThis.__verify = runAndVerifyBatch;", ytFixedRun.ctx);
    {
        const result = { applied: 0, failed: [], retried: 0 };
        const meta = { mode: "add" };
        const batch = [{ action: "ACTION_ADD_VIDEO", addedVideoId: "A" }, { action: "ACTION_ADD_VIDEO", addedVideoId: "A" }];
        ytFixedRun.ctx.__batch = batch; ytFixedRun.ctx.__meta = meta; ytFixedRun.ctx.__result = result;
        await vm.runInContext("globalThis.__verify('pl', __batch, __meta, __result)", ytFixedRun.ctx);
        ytFixedRun.result = result;
    }
    const ytEntryStart = ytVerifySrc.indexOf("let pre = new Map();");
    const ytEntryEndMark = "for (const i of preItems) pre.set(i.videoId, (pre.get(i.videoId) || 0) + 1);\n            }";
    const ytEntryEnd = ytVerifySrc.indexOf(ytEntryEndMark);
    const ytOldVerify = ytVerifySrc.slice(0, ytEntryStart) + "const pre = meta.preCount || new Map();" + ytVerifySrc.slice(ytEntryEnd + ytEntryEndMark.length);
    const ytRedRun = ytCtxBase();
    vm.runInContext(ytOldVerify + "\nglobalThis.__verifyOld = runAndVerifyBatch;", ytRedRun.ctx);
    {
        const result = { applied: 0, failed: [], retried: 0 };
        const meta = { mode: "add", preCount: new Map([["A", 0]]) };
        const batch = [{ action: "ACTION_ADD_VIDEO", addedVideoId: "A" }, { action: "ACTION_ADD_VIDEO", addedVideoId: "A" }];
        ytRedRun.ctx.__batch = batch; ytRedRun.ctx.__meta = meta; ytRedRun.ctx.__result = result;
        await vm.runInContext("globalThis.__verifyOld('pl', __batch, __meta, __result)", ytRedRun.ctx);
        ytRedRun.result = result;
    }
assert(
        "7I. the rebased verifier (r18 R18-F10), EXECUTED from the shipped runAndVerifyBatch with YouTube-dedupe semantics: a duplicate-add batch ([A, A]) lands ONE copy and the verifier reports it HONESTLY (applied=1, the unlandable second copy fails by name); the stale-baseline reconstruction reports applied=2, failed=[] with ONE copy in the playlist (the exact overcount this round closes)",
        ytFixedRun.result.applied === 1 && ytFixedRun.result.failed.length === 1 && ytFixedRun.playlist.length === 1 &&
        ytRedRun.result.applied === 2 && ytRedRun.result.failed.length === 0 && ytRedRun.playlist.length === 1 &&
        ytOldVerify !== ytVerifySrc
    );

    // 7J (R18-F11): the Yandex same-tranche viewer replacement, EXECUTED
    // from the shipped checkViewer — removals before additions + the
    // reconciliation pass keep the controller alive across a swap.
    const ydxSrc = fs.readFileSync(path.join(root, "canon", "_sovereign", "4ndr0tools - YandexImageSearch++.user.js"), "utf8");
    const ydxCheckStart = ydxSrc.indexOf("const checkViewer = () => {");
    let ydxDepth = 0, ydxCheckEnd = -1;
    for (let j = ydxSrc.indexOf("{", ydxCheckStart); j < ydxSrc.length; j++) {
        if (ydxSrc[j] === "{") ydxDepth++;
        else if (ydxSrc[j] === "}") { ydxDepth--; if (ydxDepth === 0) { ydxCheckEnd = j; break; } }
    }
    const ydxCheckSrc = ydxSrc.slice(ydxCheckStart, ydxCheckEnd + 1);
    const runYdx = (src, tranches) => {
        let constructed = 0, destroyed = 0;
        class SlideshowController {
            constructor() { constructed++; this.id = constructed; }
            destroy() { destroyed++; }
        }
        let liveViewer = null;
        const ctx = vm.createContext({
            Node: { ELEMENT_NODE: 1 },
            CONFIG: { viewerContainerSelector: ".MMViewer" },
            document: {
                querySelector: (sel) => (liveViewer && liveViewer.matches ? liveViewer : null),
            },
            console: { debug: () => {} },
        });
        vm.runInContext("let activeController = null;\nconst pendingAdded = [];\nconst pendingRemoved = [];\n" + src + "\nglobalThis.__flush = () => checkViewer();", ctx);
        ctx.SlideshowController = SlideshowController;
        for (const t of tranches) {
            ctx.__pendingAdded = t.added || [];
            ctx.__pendingRemoved = t.removed || [];
            if (t.live) liveViewer = t.live;
            vm.runInContext("pendingAdded.push(...globalThis.__pendingAdded); pendingRemoved.push(...globalThis.__pendingRemoved);", ctx);
            ctx.__flush();
        }
        return { constructed, destroyed, active: vm.runInContext("activeController", ctx) };
    };
    const mkYdxViewer = () => ({ nodeType: 1, matches: () => true, querySelector: () => null });
    const ydxSwap = runYdx(ydxCheckSrc, [
        { added: [mkYdxViewer()], removed: [], live: mkYdxViewer() },
        /* the SAME tranche: old viewer removed + new viewer added (replaceChild) */
        { added: [mkYdxViewer()], removed: [mkYdxViewer()], live: mkYdxViewer() },
    ]);
    /* 7J-red: the pre-r18 shape reconstructed — additions before removals
     * and NO reconciliation pass (the exact v0.4.3 function). */
    const ydxRemovedLoop = ydxCheckSrc.slice(ydxCheckSrc.indexOf("for (const node of removed)"), ydxCheckSrc.indexOf("for (const node of added)"));
    const ydxAddedLoop = ydxCheckSrc.slice(ydxCheckSrc.indexOf("for (const node of added)"), ydxCheckSrc.indexOf("// v0.4.4 (r18 R18-F11): the reconciliation pass"));
    const ydxOldLoops = ydxCheckSrc.slice(0, ydxCheckSrc.indexOf("for (const node of removed)")) + ydxAddedLoop + ydxRemovedLoop + "\n        };";
    const ydxOldSwap = runYdx(ydxOldLoops, [
        { added: [mkYdxViewer()], removed: [], live: mkYdxViewer() },
        { added: [mkYdxViewer()], removed: [mkYdxViewer()], live: mkYdxViewer() },
    ]);
    assert(
        "7J. the same-tranche viewer replacement (r18 R18-F11), EXECUTED from the shipped checkViewer: the swap tranche destroys the stale controller and mounts a fresh one for the connected viewer (constructed=2, destroyed=1, a live controller remains — badge + keybind survive the swap); the adds-first pre-r18 shape reconstructed loses the controller entirely (constructed=1, destroyed=1, activeController=null — the live viewer unmanaged)",
        ydxSwap.constructed === 2 && ydxSwap.destroyed === 1 && ydxSwap.active !== null && ydxSwap.active.id === 2 &&
        ydxOldSwap.constructed === 1 && ydxOldSwap.destroyed === 1 && ydxOldSwap.active === null
    );

    // 7K (R18-F12): the Recon message hook identity contract, EXECUTED from
    // the shipped hook against a native-dedup EventTarget — one wrapper per
    // (listener, capture), receiver forwarded, removal complete.
    const rcnSrc = fs.readFileSync(path.join(root, "canon", "_sovereign", "4ndr0tools - Recon.user.js"), "utf8");
    const rcnHookStart = rcnSrc.indexOf("hookPostMessage() {");
    let rcnDepth = 0, rcnHookEnd = -1;
    for (let j = rcnSrc.indexOf("{", rcnHookStart); j < rcnSrc.length; j++) {
        if (rcnSrc[j] === "{") rcnDepth++;
        else if (rcnSrc[j] === "}") { rcnDepth--; if (rcnDepth === 0) { rcnHookEnd = j; break; } }
    }
    const rcnHookBody = rcnSrc.slice(rcnHookStart + "hookPostMessage() {".length, rcnHookEnd);
    const runRcnHook = (bodySrc) => {
        const registrations = [];
        const capOf = (o) => (typeof o === "boolean" ? o : !!(o && o.capture));
        const window_ = {
            addEventListener(type, fn, options) {
                const cap = capOf(options);
                if (registrations.some((r) => r.type === type && r.fn === fn && r.cap === cap)) return;   /* native dedup */
                registrations.push({ type, fn, options, cap });
            },
            removeEventListener(type, fn, options) {
                const cap = capOf(options);
                const i = registrations.findIndex((r) => r.type === type && r.fn === fn && r.cap === cap);
                if (i >= 0) registrations.splice(i, 1);
            },
        };
        const ctx = vm.createContext({
            _window: window_,
            seenMessages: new WeakSet(),
            Hook: { recordBridge: () => {} },
            console: { debug: () => {} },
        });
        vm.runInContext("const hookPostMessage = function () {" + bodySrc + "}; hookPostMessage();", ctx);
        const fire = () => {
            let calls = 0;
            for (const r of registrations.filter((r) => r.type === "message")) {
                r.fn.call(window_, { data: "x" + Math.random() });
                calls++;
            }
            return calls;
        };
        return { ctx: window_, registrations, fire };
    };
    const rcnFixed = runRcnHook(rcnHookBody);
    let rcnLastThis = null, rcnHostFires = 0;
    const rcnListener = function () { rcnHostFires++; rcnLastThis = this; };
    rcnFixed.ctx.addEventListener("message", rcnListener, undefined);
    rcnFixed.ctx.addEventListener("message", rcnListener, undefined);          /* duplicate registration */
    const dupRegs = rcnFixed.registrations.filter((r) => r.type === "message").length;   /* passive bridge + ONE host wrapper */
    rcnFixed.fire();
    const firedOnceThis = rcnLastThis;
    const firedOnceCount = rcnHostFires;
    rcnFixed.ctx.removeEventListener("message", rcnListener, undefined);
    rcnFixed.fire();
    const firedAfterRemove = rcnHostFires - firedOnceCount;
    const rcnCap = runRcnHook(rcnHookBody);
    rcnCap.ctx.addEventListener("message", rcnListener, { capture: true });
    rcnCap.ctx.addEventListener("message", rcnListener, undefined);
    const capPairCount = rcnCap.registrations.filter((r) => r.type === "message").length;   /* passive + capture + bubble */
    rcnCap.ctx.removeEventListener("message", rcnListener, { capture: true });
    const capAfterRemove = rcnCap.registrations.filter((r) => r.type === "message").length; /* passive + bubble */
    /* 7K-red: the pre-r18 hook reconstructed (fresh closure per add, listener-only unwrap key) */
    const rcnOldBody = "\n            _window.addEventListener('message', (e) => { if (seenMessages.has(e)) return; seenMessages.add(e); Hook.recordBridge(e); });\n            const origAdd = _window.addEventListener;\n            const origRemove = _window.removeEventListener;\n            const unwrap = new WeakMap();\n            _window.addEventListener = function(type, listener, options) {\n                if (type === 'message' && typeof listener === 'function') {\n                    const wrapped = (e) => {\n                        if (!seenMessages.has(e)) { seenMessages.add(e); Hook.recordBridge(e); }\n                        return listener(e);\n                    };\n                    unwrap.set(listener, wrapped);\n                    return origAdd.call(this, type, wrapped, options);\n                }\n                return origAdd.apply(this, arguments);\n            };\n            _window.removeEventListener = function(type, listener, options) {\n                const wrappedListener = (type === 'message' && typeof listener === 'function') ? unwrap.get(listener) : undefined;\n                if (wrappedListener) { unwrap.delete(listener); return origRemove.call(this, type, wrappedListener, options); }\n                return origRemove.apply(this, arguments);\n            };\n";
    const rcnOld = runRcnHook(rcnOldBody);
    let oldFires = 0;
    const oldListener = function () { oldFires++; };
    rcnOld.ctx.addEventListener("message", oldListener, undefined);
    rcnOld.ctx.addEventListener("message", oldListener, undefined);
    const oldDupRegs = rcnOld.registrations.filter((r) => r.type === "message").length;   /* passive + TWO wrappers */
    rcnOld.fire();
    const oldFired = oldFires;   /* host-listener invocations: BOTH wrappers fired it */
    rcnOld.ctx.removeEventListener("message", oldListener, undefined);
    rcnOld.fire();
    const oldFiredAfterRemove = oldFires;
    assert(
        "7K. the message hook identity contract (r18 R18-F12), EXECUTED from the shipped hook against a native-dedup EventTarget: a duplicate registration resolves to ONE live host wrapper (fires ONCE with the receiver FORWARDED — this === the target window); removeEventListener removes it completely (0 fires after); the capture-pair discipline holds (3 registrations; the capture remove leaves exactly the passive + bubble pair); the pre-r18 hook reconstructed (fresh closure per add) keeps TWO wrappers (double fire) and one callback SURVIVES the removal — the exact double-fire/leak defect",
        dupRegs === 2 && firedOnceThis === rcnFixed.ctx && firedOnceCount === 1 && firedAfterRemove === 0 &&
        capPairCount === 3 && capAfterRemove === 2 &&
        oldDupRegs === 3 && oldFired === 2 && oldFiredAfterRemove === 3
    );


/* ── 7L (R18-F13/F14): MPC vnode retention + identity ────────────────── */
const mpcSrc = fs.readFileSync(path.join(root, "canon", "_promoted", "4ndr0tools - Media Player Controller.user.js"), "utf8");
const mpcBlockStart = mpcSrc.indexOf("const nodeNonces = new WeakMap();");
const mpcBlockEnd = mpcSrc.indexOf("function purgeOrphanVNodes()");
const mpcBlock = mpcSrc.slice(mpcBlockStart, mpcBlockEnd);
const runMpc = (blockSrc, storageThrows) => {
    const storage = new Map();
    const ctx = vm.createContext({
        console: { debug: () => {} },
        isFinite,
        VNODE_PREFIX: "psi_vnode_",
        document: { querySelectorAll: () => [] },
        window: { scrollY: 0, scrollX: 0 },
        localStorage: {
            getItem: (k) => { if (storageThrows) throw new Error("refused"); return storage.has(k) ? storage.get(k) : null; },
            setItem: (k, v) => { if (storageThrows) throw new Error("refused"); storage.set(k, v); },
            removeItem: (k) => { if (storageThrows) throw new Error("refused"); storage.delete(k); },
        },
    });
    vm.runInContext(blockSrc + "\nglobalThis.__fns = { getStableId, persistVNode, loadVNode, purgeVNode };", ctx);
    return { ctx, storage };
};
const mkVideo = (src, t) => ({ currentSrc: src, currentTime: t || 0, muted: false, volume: 1, loop: false, getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 50 }) });
const mpcOk = runMpc(mpcBlock, false);
const vA = mkVideo("https://cdn-one.test/video.mp4", 10);
const vB = mkVideo("https://cdn-two.test/video.mp4", 20);
const idA = mpcOk.ctx.__fns.getStableId(vA);
const idA2 = mpcOk.ctx.__fns.getStableId(vA);
const idB = mpcOk.ctx.__fns.getStableId(vB);
const vA2 = mkVideo("https://cdn-one.test/video.mp4", 30);   /* same src, DIFFERENT element */
const idA2el = mpcOk.ctx.__fns.getStableId(vA2);
const persistedOk = mpcOk.ctx.__fns.persistVNode(vA);
const recOk = mpcOk.ctx.__fns.loadVNode(idA);
mpcOk.ctx.__fns.purgeVNode(idA);
const afterPurge = mpcOk.ctx.__fns.loadVNode(idA);
/* F13: storage refusal — the in-memory fallback answers */
const mpcRefused = runMpc(mpcBlock, true);
const vRef = mkVideo("https://cdn-ref.test/x.mp4", 42);
const persistedRef = mpcRefused.ctx.__fns.persistVNode(vRef);
const idRef = mpcRefused.ctx.__fns.getStableId(vRef);
const recRef = mpcRefused.ctx.__fns.loadVNode(idRef);
/* 7L-red (F14): the pre-r18 identity reconstructed — the origin-dropping lossy key */
const mpcOldIdentity = `
    function getStableId(video) {
        const src = video.currentSrc || video.src || '';
        if (src) {
            try {
                const u = new URL(src);
                return 'src_' + (u.pathname + u.search).slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_');
            } catch (_) {
                return 'raw_' + src.slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '_');
            }
        }
        return 'idx_0';
    }
`;
const mpcRedCtx = vm.createContext({ URL });
vm.runInContext(mpcOldIdentity + "globalThis.__oldId = getStableId;", mpcRedCtx);
const oldIdA = mpcRedCtx.__oldId(vA);
const oldIdB = mpcRedCtx.__oldId(vB);
assert("7L. MPC vnode retention + identity (r18 R18-F13/F14), EXECUTED from the shipped block: the identity is collision-resistant (cdn-one vs cdn-two map to DIFFERENT keys; the same element is stable; a same-src sibling element gets its own key) and INJECTIVE-escaped; persistence under storage REFUSAL still leaves the record recoverable through the in-memory fallback (persistVNode reports false, loadVNode answers with the src); a clean persist round-trips and purge clears both layers; the pre-r18 identity reconstructed collides cdn-one and cdn-two onto ONE key (src__video_mp4 — the overwrite that restored the WRONG source)",
    idA === idA2 && idA !== idB && idA !== idA2el &&
    persistedOk === true && recOk && recOk.src === "https://cdn-one.test/video.mp4" && recOk.currentTime === 10 && afterPurge === null &&
    persistedRef === false && recRef && recRef.src === "https://cdn-ref.test/x.mp4" && recRef.currentTime === 42 &&
    oldIdA === oldIdB && oldIdA === "src__video_mp4");

/* ── 7M (R18-F15): FLX aggregation ───────────────────────────────────── */
const flxSrc = fs.readFileSync(path.join(root, "canon", "_promoted", "4ndr0tools - Forum Link Xtractor.user.js"), "utf8");
const flxThreadStart = flxSrc.indexOf("function currentThreadName() {");
let d = 0, flxThreadEnd = -1;
for (let j = flxSrc.indexOf("{", flxThreadStart); j < flxSrc.length; j++) {
    if (flxSrc[j] === "{") d++;
    else if (flxSrc[j] === "}") { d--; if (d === 0) { flxThreadEnd = j; break; } }
}
const flxThreadFn = flxSrc.slice(flxThreadStart, flxThreadEnd + 1);
const flxSaveFn = (() => {
    const i = flxSrc.indexOf("function saveLinksToBuffer(");
    let d = 0, e = -1;
    for (let j = flxSrc.indexOf("{", i); j < flxSrc.length; j++) {
        if (flxSrc[j] === "{") d++;
        else if (flxSrc[j] === "}") { d--; if (d === 0) { e = j; break; } }
    }
    return flxSrc.slice(i, e + 1);
})();
const flxFilterBlock = (() => {
    const i = flxSrc.indexOf("const threadKeys = Object.keys(savedLinks).filter(key => {");
    let d = 0, e = -1;
    for (let j = flxSrc.indexOf("{", i); j < flxSrc.length; j++) {
        if (flxSrc[j] === "{") d++;
        else if (flxSrc[j] === "}") { d--; if (d === 0) { e = j; break; } }
    }
    /* the filter's closing is `});` after the arrow body's closing brace */
    return flxSrc.slice(i, flxSrc.indexOf(");", e) + 2);
})();
const runFlx = () => {
    const store = new Map();
    const ctx = vm.createContext({
        console: { warn: () => {} },
        localStorage: {
            getItem: (k) => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => store.set(k, v),
            removeItem: (k) => store.delete(k),
        },
    });
    vm.runInContext(
        "globalThis.ON_CANDIDSHINY = false; globalThis.window = { location: { pathname: globalThis.__path } };\n" +
        "globalThis.__setPath = (p) => { globalThis.window = { location: { pathname: p } }; };\n" +
        flxThreadFn + "\n" + flxSaveFn + "\n" +
        "globalThis.__threadName = () => currentThreadName();\n" +
        "globalThis.__save = (u, l, t) => saveLinksToBuffer(u, l, t);\n" +
        "globalThis.__filter = (savedLinks, threadName) => { " + flxFilterBlock + " return threadKeys; };",
        ctx
    );
    return ctx;
};
const flxCtx = runFlx();
const threadOfThreadPage = vm.runInContext("globalThis.__setPath('/threads/my-thread.123/page-2'); globalThis.__threadName()", flxCtx);
const threadOfNonThread = vm.runInContext("globalThis.__setPath('/start.me/dashboard'); globalThis.__threadName()", flxCtx);
flxCtx.__save("https://forum/threads/my-thread.123/", ["l1", "l2"], "my-thread.123");
flxCtx.__save("https://forum/threads/foobar.9/", ["l3"], "foobar.9");
flxCtx.__save("https://start.me/dashboard", ["l4"], "extracted_links");
const buffer = JSON.parse(flxCtx.localStorage.getItem("psi_link_buffer"));
const threadMatch = vm.runInContext("globalThis.__filter(JSON.parse(globalThis.__bufferStr), 'my-thread.123')", Object.assign(flxCtx, { __bufferStr: flxCtx.localStorage.getItem("psi_link_buffer") }));
const nonThreadMatch = vm.runInContext("globalThis.__filter(JSON.parse(globalThis.__bufferStr), 'extracted_links')", flxCtx);
const legacyMatch = vm.runInContext("globalThis.__filter({'https://forum/threads/my-thread.123/?page=3': ['l5'], 'https://forum/threads/foobar.9/': ['l6']}, 'my-thread.123')", flxCtx);
const unionIdx = flxSrc.indexOf("currentLinks.forEach(link => finalLinksSet.add(link));");
const filterIdx = flxSrc.indexOf("const threadKeys = Object.keys(savedLinks).filter");
assert("7M. FLX aggregation (r18 R18-F15), EXECUTED from the shipped currentThreadName + saveLinksToBuffer + the aggregation filter: the thread identity derives from the path (/threads/slug → slug; a non-thread page → 'extracted_links'); buffer entries carry their EXPLICIT thread identity ({thread, links}); the aggregation matches the same thread's explicit entries and legacy URL-substring entries but NOT the cross-thread slug (foobar ≠ my-thread) and NOT the non-thread default; and the always-union line sits AFTER the aggregation block in the canon (current-page links can never be dropped again)",
    threadOfThreadPage === "my-thread.123" && threadOfNonThread === "extracted_links" &&
    buffer["https://forum/threads/my-thread.123/"] && buffer["https://forum/threads/my-thread.123/"].thread === "my-thread.123" &&
    JSON.stringify(buffer["https://forum/threads/my-thread.123/"].links) === '["l1","l2"]' &&
    JSON.stringify(threadMatch) === '["https://forum/threads/my-thread.123/"]' &&
    JSON.stringify(nonThreadMatch) === "[]" &&
    JSON.stringify(legacyMatch) === '["https://forum/threads/my-thread.123/?page=3"]' &&
    unionIdx > filterIdx);

/* ── 7N (R18-F16): m3u8 facade decode ────────────────────────────────── */
const m3u8Src = fs.readFileSync(path.join(root, "canon", "_promoted", "4ndr0tools - m3u8++.user.js"), "utf8");
const m3u8DecodeStart = m3u8Src.indexOf("const decodeText = () => {");
const m3u8ResolveEnd = m3u8Src.indexOf("});", m3u8DecodeStart);
const m3u8Block = m3u8Src.slice(m3u8DecodeStart, m3u8ResolveEnd + 3);
const runM3u8 = (r) => new Promise((res) => {
    const ctx = vm.createContext({
        resolve: (v) => res(v),
        TextDecoder,
        Blob,
        Headers: class { constructor() {} },
    });
    ctx.__gmResponse = r;
    /* the block is `const decodeText = ...; resolve({...});` — wrap it: */
    vm.runInContext("(function (r) { " + m3u8Block + " })(globalThis.__gmResponse);", ctx);
});
const m3u8JsonBytes = new TextEncoder().encode('{"a":1,"b":"x"}');
const m3u8Facade = await runM3u8({ status: 200, response: m3u8JsonBytes.buffer, responseHeaders: "x: y\n", responseText: undefined });
const m3u8Text = await m3u8Facade.text();
const m3u8Json = await m3u8Facade.json();
const m3u8Ab = await m3u8Facade.arrayBuffer();
const m3u8Blob = await m3u8Facade.blob();
const m3u8Edge = await runM3u8({ status: 200, response: null, responseHeaders: "x: y\n", responseText: "edge-text" });
const m3u8EdgeText = await m3u8Edge.text();
assert("7N. m3u8 facade decode (r18 R18-F16), EXECUTED from the shipped onload facade: an arraybuffer-only GM response yields text() === the decoded JSON string, json() === the parsed object, arrayBuffer() === the same bytes, and blob() a Blob carrying them; a responseText-populated edge (streaming managers) still returns the string verbatim — the pre-fix shape returned undefined/threw on every JSON-parsing webapp call",
    m3u8Text === '{"a":1,"b":"x"}' && m3u8Json && m3u8Json.a === 1 && m3u8Json.b === "x" &&
    new Uint8Array(m3u8Ab).length === m3u8JsonBytes.length && m3u8Blob instanceof Blob && m3u8Blob.size === m3u8JsonBytes.length &&
    m3u8EdgeText === "edge-text");

/* ── 7O (R18-F17): ingest provenance ─────────────────────────────────── */
const { ingestOperatorReport } = await import(path.join(root, "tools", "operator-battery.mjs"));
const resultsBefore = fs.readFileSync(path.join(root, "tools", "operator-battery", "results.json"), "utf8");
const mkReport = (over) => {
    const base = {
        header: "## OPERATOR BATTERY REPORT — suite 1.26.0 @ 050e7bd7b770969fb2ac48cc408df95c5d16f07b",
        env: "ENV: Chrome 130 / Tampermonkey 5.5 / Win11 / dist @ 050e7bd7b770969fb2ac48cc408df95c5d16f07b / date 2026-11-04",
        ...(over || {}),
    };
    return [
        base.header,
        base.env,
        "",
        "| test | status (PASS/FAIL/BLOCKED) | evidence (link/inline) | note (failure mode if FAIL/BLOCKED) |",
        "|---|---|---|---|",
        "| FPP-RES-09 | PASS | inline | |",
        "",
        "FREE-FORM FINDINGS:",
        "- none",
    ].join("\n");
};
const tmpReports = [];
const writeReport = (text) => { const p = path.join("/home/z", "r18-report-" + tmpReports.length + ".md"); fs.writeFileSync(p, text); tmpReports.push(p); return p; };
const ingNoHeader = ingestOperatorReport(writeReport(mkReport({ header: "## OPERATOR BATTERY REPORT" })), {});
const ingZeroSha = ingestOperatorReport(writeReport(mkReport({ header: "## OPERATOR BATTERY REPORT — suite 1.26.0 @ 0000000000000000000000000000000000000000" })), {});
const ingNoEnv = ingestOperatorReport(writeReport(mkReport({ env: "" })), {});
const ingNoDate = ingestOperatorReport(writeReport(mkReport({ env: "ENV: Chrome 130 / TM 5.5 / Win11 / dist @ 050e7bd / " })), {});
const ingWrongSuite = ingestOperatorReport(writeReport(mkReport({ header: "## OPERATOR BATTERY REPORT — suite 9.9.9 @ 050e7bd7b770969fb2ac48cc408df95c5d16f07b" })), {});
const resultsAfter = fs.readFileSync(path.join(root, "tools", "operator-battery", "results.json"), "utf8");
for (const p of tmpReports) { try { fs.unlinkSync(p); } catch {} }
assert("7O. ingest provenance (r18 R18-F17), EXECUTED against the shipped ingestOperatorReport: a report with NO suite header is refused by name; an all-zero git sha (the unfilled template placeholder) is refused; a missing ENV line is refused; a missing stated date is refused (never machine-fabricated); a wrong suite still refuses (the 10a-F06b contract); and every refusal left results.json BYTE-IDENTICAL (refusals never write)",
    ingNoHeader.problems.length > 0 && /suite <version> @ <git sha>/.test(ingNoHeader.problems.join(" ")) &&
    ingZeroSha.problems.length > 0 && /all zeros/.test(ingZeroSha.problems.join(" ")) &&
    ingNoEnv.problems.length > 0 && /no ENV line/.test(ingNoEnv.problems.join(" ")) &&
    ingNoDate.problems.length > 0 && /date YYYY-MM-DD/.test(ingNoDate.problems.join(" ")) &&
    ingWrongSuite.problems.length > 0 && /suite 9\.9\.9/.test(ingWrongSuite.problems.join(" ")) &&
    resultsBefore === resultsAfter);

/* ── 7P (R18-F18): the score writes last ─────────────────────────────── */
const vSrc = fs.readFileSync(path.join(root, "tools", "validate.mjs"), "utf8");
const scoreWriteIdx = vSrc.indexOf("const score = runProductionScore(ROOT, scoreCtx);");
const scoreCtxIdx = vSrc.indexOf("const scoreCtx = {");
const lastGateIdx = vSrc.indexOf("MIGRATION.md successor table verified");
const lateGateFailures = [
    vSrc.indexOf("canon-kernel wiring:"),
    vSrc.indexOf("kernel-boundary smoke:"),
    vSrc.indexOf("family-fixture smoke:"),
    vSrc.indexOf("norm-symmetry smoke:"),
    vSrc.indexOf("tt browser smoke:"),
];
const orderingHolds = scoreWriteIdx > lastGateIdx && scoreCtxIdx > lastGateIdx && lateGateFailures.every((i) => i < scoreCtxIdx);
/* 7P-red: the pre-r18 order reconstructed — the score block moved BEFORE
 * the canon-kernel gate trips the ordering check. */
const scoreBlockStart = vSrc.indexOf("/* r18 (R18-F18): the production score — computed and persisted HERE,");
const scoreBlockEnd = vSrc.indexOf("score determinism check failed:", scoreBlockStart);
const scoreBlockEndFull = vSrc.indexOf("}", vSrc.indexOf("}", scoreBlockEnd) + 1) + 1;
const scoreBlock = vSrc.slice(scoreBlockStart, scoreBlockEndFull);
const vSabotaged = vSrc.slice(0, scoreBlockStart) + vSrc.slice(scoreBlockEndFull);
const canonKernelIdx = vSabotaged.indexOf("// Canon-kernel wiring (suite v1.4.3)");
const vOldOrder = vSabotaged.slice(0, canonKernelIdx) + scoreBlock + "\n" + vSabotaged.slice(canonKernelIdx);
const oldScoreIdx = vOldOrder.indexOf("const score = runProductionScore(ROOT, scoreCtx);");
const oldLastGateIdx = vOldOrder.indexOf("MIGRATION.md successor table verified");
assert("7P. the score writes last (r18 R18-F18), machine-checked against the shipped validate.mjs: the score computation+write AND its ctx sit AFTER the final gate (MIGRATION) and after every late gate's failure site (canon-kernel, kernel-boundary, family-fixture, norm-symmetry, tt) — a late failure is priced into otherGateFailures and can never leave an unqualified 100/100 on disk; the pre-r18 order reconstructed (score block before canon-kernel) fails the same ordering check — the position is load-bearing",
    orderingHolds && oldScoreIdx < oldLastGateIdx && vOldOrder !== vSrc);

    return { problems, passed, total };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = await runFamilyFixtureSmoke();
    console.log(`family-fixture-smoke: ${r.passed}/${r.total} assertions passed`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ per-family contract fixture battery verified (Zai Exporter 3-strategy ladder with the r17 constant-extraction pin, NetHook v6 veto/respond/traffic/onNode/gmFetch, red controls, Hailuo++ BlobSanitizer real-sample repair, the round-15 Forums++/CB field-settlement contracts with sabotage red controls, the round-16 saint pipeline-reachability + bare-route recovery + family-symmetry contracts, the round-16 captcha-aware click timing with its sabotage red control, the round-17 unseen-pipeline contracts: the harvest alternation split, the finished CB timing state machine, the hardened upload receiver, the MAM hover-announcement dedupe, and the round-18 cross-training contracts: the hosts retry contract, the shared-namespace watcher registry, the LinkMasterΨ harvest grouping + ZIP name allocation, the popup data:-media admission, the canvas serializer stability, the PM import gate + Gist truncated branch, the short-206 contract, the rebased YTPM verifier, the Yandex tranche ordering, the Recon message-hook identity, the MPC vnode retention + collision-resistant identity, the FLX aggregation, the m3u8 facade decode, the ingest provenance refusals, and the score-writes-last ordering — each with its red control)");
}
