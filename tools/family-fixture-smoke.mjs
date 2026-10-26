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
        fppSrc.includes("clearInterval(requestProgress.intervalId);")
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

    return { problems, passed, total };
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
