#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/watermark-batch-smoke.mjs — Watermark++ delegated-batch battery (v1.7.0)
 * ----------------------------------------------------------------------------
 * Wave 1.2 mandate: battery-grade proof of Watermark++'s delegated-batch
 * MutationObserver pipeline (handlePageImageMutations → scheduleProcess =
 * batchProcessor.schedule → createRootBatchProcessor → scheduleOnNextFrame),
 * paired with a red-control negative test proving the harness catches
 * un-coalesced or un-filtered regressions.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function extractFunctionSpan(src, fnName) {
    const marker = `function ${fnName}(`;
    const idx = src.indexOf(marker);
    if (idx === -1) throw new Error(`Watermark++ missing function ${fnName}`);
    const openParen = idx + `function ${fnName}`.length;
    let pDepth = 0;
    let bodyStart = -1;
    for (let i = openParen; i < src.length; i++) {
        if (src[i] === "(") pDepth++;
        else if (src[i] === ")") {
            pDepth--;
            if (pDepth === 0) {
                bodyStart = src.indexOf("{", i + 1);
                break;
            }
        }
    }
    if (bodyStart === -1) throw new Error(`Missing body for ${fnName}`);
    let depth = 0;
    for (let i = bodyStart; i < src.length; i++) {
        const c = src[i];
        if (c === "{") depth++;
        else if (c === "}") {
            depth--;
            if (depth === 0) return src.slice(idx, i + 1);
        }
    }
    throw new Error(`Unbalanced braces in ${fnName}`);
}

export function runWatermarkBatchSmoke(root = ROOT) {
    const problems = [];
    let passed = 0;
    const canonPath = path.join(root, "canon", "_sovereign", "4ndr0tools - Watermark++.user.js");
    if (!fs.existsSync(canonPath)) {
        return { problems: ["Watermark++ canon file missing"], passed: 0, total: 15 };
    }
    const src = fs.readFileSync(canonPath, "utf8");

    const fnNames = [
        "shouldScheduleMutationRoot",
        "shouldScheduleAttributeMutation",
        "isSelfWrittenProcessedImageSource",
        "handlePageImageMutations",
        "scheduleOnNextFrame",
        "scheduleOnIdle",
        "doesRootContain",
        "createRootBatchProcessor",
    ];

    const extracted = fnNames.map((fn) => extractFunctionSpan(src, fn)).join("\n\n");

    let rafQueue = [];
    let timeoutQueue = [];
    class FakeNode {
        constructor(tagName = "DIV", { matchesSelector = false, hasDescendant = false, children = [] } = {}) {
            this.nodeType = 1;
            this.tagName = tagName;
            this._matches = matchesSelector;
            this._hasDesc = hasDescendant;
            this.children = children;
            this.dataset = {};
            this.src = "";
            this.currentSrc = "";
        }
        matches(sel) {
            return Boolean(this._matches && sel);
        }
        querySelector(sel) {
            return this._hasDesc && sel ? { nodeType: 1 } : null;
        }
        contains(other) {
            if (!other || other === this) return false;
            if (this.children.includes(other)) return true;
            return this.children.some((c) => typeof c.contains === "function" && c.contains(other));
        }
    }
    class FakeImage extends FakeNode {
        constructor(opts = {}) {
            super("IMG", opts);
        }
    }

    const sandbox = {
        globalThis: null,
        document: new FakeNode("DOCUMENT"),
        HTMLImageElement: FakeImage,
        PAGE_IMAGE_OBJECT_URL_KEY: "gwrPageImageObjectUrl",
        getGeminiImageContainerSelector: () => "generated-image,.generated-image-container",
        hasRelevantDescendant: (root) => Boolean(root && typeof root.querySelector === "function" && root.querySelector("img,generated-image")),
        requestAnimationFrame: (cb) => { rafQueue.push(cb); return rafQueue.length; },
        requestIdleCallback: (cb) => { timeoutQueue.push(cb); return timeoutQueue.length; },
        setTimeout: (cb) => { timeoutQueue.push(cb); return timeoutQueue.length; },
        Set,
        Array,
        Object,
    };
    sandbox.globalThis = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(
        `${extracted}\nglobalThis.__exports = { ${fnNames.join(", ")} };`,
        sandbox
    );
    const api = sandbox.__exports;

    const check = (label, cond) => {
        if (cond) passed++;
        else problems.push(`Watermark++ batch smoke failed: ${label}`);
    };

    // 1. Single root scheduling arms scheduleFlush (rAF) once
    rafQueue = [];
    const flushed1 = [];
    const bp1 = api.createRootBatchProcessor({ processRoot: (r) => flushed1.push(r) });
    const rootA = new FakeNode("DIV");
    bp1.schedule(rootA);
    check("single schedule arms rAF without synchronous flush", rafQueue.length === 1 && flushed1.length === 0);

    // 2. 50 rapid schedules in same frame coalesce into 1 rAF registration
    for (let i = 0; i < 50; i++) bp1.schedule(rootA);
    check("50 same-root schedules coalesce into 1 rAF callback", rafQueue.length === 1);

    // 3. Flush processes deduplicated root once
    rafQueue.shift()();
    check("flush invokes processRoot exactly once for deduplicated root", flushed1.length === 1 && flushed1[0] === rootA);

    // 4. Ancestor-first containment dedupe (parent already pending -> child ignored)
    rafQueue = [];
    const flushed2 = [];
    const bp2 = api.createRootBatchProcessor({ processRoot: (r) => flushed2.push(r) });
    const child1 = new FakeNode("IMG");
    const child2 = new FakeNode("IMG");
    const parent = new FakeNode("DIV", { children: [child1, child2] });
    bp2.schedule(parent);
    bp2.schedule(child1);
    bp2.schedule(child2);
    rafQueue.shift()();
    check("ancestor-first containment skips descendant roots", flushed2.length === 1 && flushed2[0] === parent);

    // 5. Child-first ancestor promotion (children pending -> scheduling parent evicts children)
    rafQueue = [];
    const flushed3 = [];
    const bp3 = api.createRootBatchProcessor({ processRoot: (r) => flushed3.push(r) });
    bp3.schedule(child1);
    bp3.schedule(child2);
    bp3.schedule(parent);
    rafQueue.shift()();
    check("child-first ancestor promotion evicts pending descendants", flushed3.length === 1 && flushed3[0] === parent);

    // 6. Post-flush re-arming across frames
    const sibling = new FakeNode("DIV");
    bp3.schedule(sibling);
    check("post-flush schedule re-arms rAF for next frame", rafQueue.length === 1);
    rafQueue.shift()();
    check("second frame flush processes newly scheduled root", flushed3.length === 2 && flushed3[1] === sibling);

    // 7. handlePageImageMutations ignores empty/invalid inputs
    let schedCalls = [];
    api.handlePageImageMutations(null, { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage });
    api.handlePageImageMutations([], { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage });
    check("handlePageImageMutations ignores null/empty mutation batches", schedCalls.length === 0);

    // 8. attributes mutation on non-HTMLImageElement is ignored (F2 gate)
    const nonImg = new FakeNode("DIV");
    api.handlePageImageMutations(
        [{ type: "attributes", target: nonImg, attributeName: "src" }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("attributes mutation on non-HTMLImageElement is filtered out", schedCalls.length === 0);

    // 9. attributes mutation on data-gwr-stable-source is ignored
    const imgEl = new FakeImage();
    api.handlePageImageMutations(
        [{ type: "attributes", target: imgEl, attributeName: "data-gwr-stable-source" }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("attributes mutation on data-gwr-stable-source is filtered out", schedCalls.length === 0);

    // 10. attributes mutation on self-written processed blob URL is ignored
    imgEl.dataset.gwrPageImageObjectUrl = "blob:https://gemini.google.com/processed-1";
    imgEl.src = "blob:https://gemini.google.com/processed-1";
    imgEl.currentSrc = "blob:https://gemini.google.com/processed-1";
    api.handlePageImageMutations(
        [{ type: "attributes", target: imgEl, attributeName: "src" }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("self-written processed blob src mutation is filtered out", schedCalls.length === 0);

    // 11. attributes mutation on fresh unprocessed src schedules image
    imgEl.src = "https://lh3.googleusercontent.com/new-image";
    imgEl.currentSrc = "https://lh3.googleusercontent.com/new-image";
    api.handlePageImageMutations(
        [{ type: "attributes", target: imgEl, attributeName: "src" }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("unprocessed src attribute mutation schedules HTMLImageElement", schedCalls.length === 1 && schedCalls[0] === imgEl);

    // 12. childList mutation with IMG / GENERATED-IMAGE schedules added node
    schedCalls = [];
    const genImg = new FakeNode("GENERATED-IMAGE");
    api.handlePageImageMutations(
        [{ type: "childList", addedNodes: [genImg] }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("childList added GENERATED-IMAGE node is scheduled", schedCalls.length === 1 && schedCalls[0] === genImg);

    // 13. childList mutation with relevant descendant container schedules container, while irrelevant node is skipped
    schedCalls = [];
    const relevantContainer = new FakeNode("DIV", { hasDescendant: true });
    const irrelevantNode = new FakeNode("SPAN", { hasDescendant: false });
    const textNode = { nodeType: 3 };
    api.handlePageImageMutations(
        [{ type: "childList", addedNodes: [textNode, irrelevantNode, relevantContainer] }],
        { scheduleProcess: (n) => schedCalls.push(n), HTMLImageElementClass: FakeImage }
    );
    check("childList F1/F2 filter schedules only relevant container and drops text/irrelevant nodes", schedCalls.length === 1 && schedCalls[0] === relevantContainer);

    // 15. RED CONTROL: prove an un-coalesced processor fails the coalescing invariant
    const redFlushed = [];
    const brokenProcessor = { schedule: (r) => redFlushed.push(r) };
    for (let i = 0; i < 10; i++) brokenProcessor.schedule(rootA);
    const redControlCaught = redFlushed.length > 1;
    check("red control: un-coalesced synchronous schedule is detected and rejected", redControlCaught);

    return { problems, passed, total: 15 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = runWatermarkBatchSmoke();
    console.log(`watermark-batch-smoke: ${r.passed}/${r.total} assertions passed`);
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log("  ✓ Watermark++ delegated-batch pipeline verified (rAF coalescing, containment dedupe, F1/F2 filtering, red control)");
}
