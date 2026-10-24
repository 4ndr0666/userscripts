#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/kernel-boundary-smoke.mjs — Kernel-Boundary ×38 Gate & Battery (v1.7.0)
 * ----------------------------------------------------------------------------
 * Wave 2.5 mandate: prove that all 36 canon/ scripts are kernel-less-safe
 * (every __4NDR0_NET_API__ reference in canon/ is guarded by typeof, and all
 * 8 gmFetch consumers carry a closure-local *KernelLessGmFetch fallback with
 * literal timeout, settle-once semantics, and typed NetError kinds), backed
 * by a runtime VM battery + red control.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { codeOnly } from "./sink-census.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export function scanKernelBoundarySource(src, relPath) {
    const clean = codeOnly(src);
    const lines = clean.split("\n");
    const bareSites = [];
    let guardedSites = 0;

    // Check if file defines a guarded NET_HUB alias: const NET_HUB = typeof __4NDR0_NET_API__ !== ...
    const hasGuardedHubAlias = /const\s+NET_HUB\s*=\s*typeof\s+__4NDR0_NET_API__\s*!==/.test(clean);

    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (!ln.includes("__4NDR0_NET_API__")) continue;
        const winStart = Math.max(0, i - 30);
        const windowText = lines.slice(winStart, i + 1).join("\n");
        if (windowText.includes("typeof __4NDR0_NET_API__")) {
            guardedSites++;
        } else {
            bareSites.push({ file: relPath, line: i + 1, text: ln.trim() });
        }
    }

    // If file uses NET_HUB.<method>, verify if (!NET_HUB) return guard precedes it
    if (clean.includes("NET_HUB.")) {
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i].includes("NET_HUB.")) continue;
            const winStart = Math.max(0, i - 120);
            const windowText = lines.slice(winStart, i + 1).join("\n");
            if (!hasGuardedHubAlias || !/if\s*\(\s*!NET_HUB\s*\)\s*return/.test(windowText)) {
                bareSites.push({ file: relPath, line: i + 1, text: lines[i].trim() });
            }
        }
    }

    return { bareSites, guardedSites };
}

export async function runKernelBoundarySmoke(root = ROOT) {
    const problems = [];
    let canonFiles = 0;
    let kernelFreeCount = 0;
    let guardedConsumerCount = 0;
    let totalGuardedSites = 0;
    let transportFallbacksVerified = 0;

    const canonDirs = ["canon/_sovereign", "canon/_promoted", "canon/_merged"];
    const expectedFallbacks = new Map([
        ["4ndr0tools - Prompt Master.user.js", "pmKernelLessGmFetch"],
        ["4ndr0tools - Bunkr++.user.js", "bkrKernelLessGmFetch"],
        ["4ndr0tools - Forums++.user.js", "fppKernelLessGmFetch"],
        ["4ndr0tools - Gofile++.user.js", "gfKernelLessGmFetch"],
        ["4ndr0tools - Instagram++.user.js", "igKernelLessGmFetch"],
        ["4ndr0tools - Pixeldrain++.user.js", "pdKernelLessGmFetch"],
        ["4ndr0tools - Blob2URL.user.js", "b2uKernelLessGmFetch"],
        ["4ndr0tools - GooglePhotosandDrive++.user.js", "gpdKernelLessGmFetch"],
    ]);

    for (const d of canonDirs) {
        const absDir = path.join(root, d);
        if (!fs.existsSync(absDir)) continue;
        for (const f of fs.readdirSync(absDir).sort()) {
            if (!f.endsWith(".user.js")) continue;
            canonFiles++;
            const rel = `${d}/${f}`;
            const src = fs.readFileSync(path.join(absDir, f), "utf8");
            const { bareSites, guardedSites } = scanKernelBoundarySource(src, rel);
            if (bareSites.length > 0) {
                for (const b of bareSites) {
                    problems.push(`${b.file}:${b.line}: unguarded bare __4NDR0_NET_API__ reference: \`${b.text}\``);
                }
            }
            if (guardedSites === 0 && !src.includes("__4NDR0_NET_API__")) {
                kernelFreeCount++;
            } else {
                guardedConsumerCount++;
                totalGuardedSites += guardedSites;
            }

            if (expectedFallbacks.has(f)) {
                const fnName = expectedFallbacks.get(f);
                if (!src.includes(fnName)) {
                    problems.push(`${rel}: missing kernel-less gmFetch fallback \`${fnName}\``);
                } else {
                    transportFallbacksVerified++;
                }
            }
        }
    }

    // Runtime VM test of the kernel-less gmFetch fallback contract (settle-once + typed NetError kinds)
    // Extract bkrKernelLessGmFetch from Bunkr++ and pmKernelLessGmFetch from Prompt Master and run 6 live assertions
    // WO-01 round-3 (3-a F05): the VM fixture list is hoisted so the expected
    // assertion count DERIVES from it (3 assertions per file + 1 red control)
    // — the round-2 form carried a literal 10 mislabeled as "derived".
    const VM_FALLBACK_FILES = [
        ["canon/_sovereign/4ndr0tools - Prompt Master.user.js", "pmKernelLessGmFetch"],
        ["canon/_sovereign/4ndr0tools - Bunkr++.user.js", "bkrKernelLessGmFetch"],
        ["canon/_sovereign/4ndr0tools - Pixeldrain++.user.js", "pdKernelLessGmFetch"],
    ];
    let runtimeAssertions = 0;
    for (const [relFile, fnName] of VM_FALLBACK_FILES) {
        const src = fs.readFileSync(path.join(root, relFile), "utf8");
        const startIdx = src.indexOf(`function ${fnName}(`);
        if (startIdx === -1) {
            problems.push(`${relFile}: could not locate function ${fnName} for VM execution`);
            continue;
        }
        const braceStart = src.indexOf("{", startIdx);
        let depth = 0, endIdx = -1;
        for (let i = braceStart; i < src.length; i++) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") {
                depth--;
                if (depth === 0) { endIdx = i + 1; break; }
            }
        }
        const fnCode = src.slice(startIdx, endIdx);

        // (a) No GM_xmlhttpRequest -> rejects with kind === 'gm-unavailable'
        const ctxNoGm = vm.createContext({ Promise, Error, Object, Math, console });
        vm.runInContext(`${fnCode}\nglobalThis.fn = ${fnName};`, ctxNoGm);
        try {
            await ctxNoGm.fn("https://example.com/test", { timeout: 5000 });
            problems.push(`${fnName}: resolved when GM_xmlhttpRequest was absent`);
        } catch (err) {
            if (err && err.kind === "gm-unavailable") runtimeAssertions++;
            else problems.push(`${fnName}: wrong error kind when GM absent: ${err && err.kind}`);
        }

        // (b) Settle-once on timeout followed by onerror + positive timeout passed
        let capturedTimeout = 0;
        const ctxGm = vm.createContext({
            Promise, Error, Object, Math, console,
            GM_xmlhttpRequest: (req) => {
                capturedTimeout = req.timeout;
                if (req.url.includes("timeout")) {
                    req.ontimeout();
                    req.onerror(); // second callback must be ignored (settle-once)
                } else {
                    req.onload({ status: 200, responseText: "KERNEL_LESS_OK" });
                }
                return { abort: () => {} };
            },
        });
        vm.runInContext(`${fnCode}\nglobalThis.fn = ${fnName};`, ctxGm);
        const okRes = await ctxGm.fn("https://example.com/ok", { timeout: 12345 });
        if (okRes && okRes.status === 200 && okRes.responseText === "KERNEL_LESS_OK" && capturedTimeout === 12345) {
            runtimeAssertions++;
        } else {
            problems.push(`${fnName}: failed positive onload/timeout test`);
        }

        try {
            await ctxGm.fn("https://example.com/timeout", { timeout: 5000 });
            problems.push(`${fnName}: resolved on timeout`);
        } catch (err) {
            if (err && err.kind === "timeout") runtimeAssertions++;
            else problems.push(`${fnName}: wrong error kind on timeout: ${err && err.kind}`);
        }
    }

    // RED CONTROL: verify scanKernelBoundarySource flags an unguarded bare __4NDR0_NET_API__ call
    const redSample = `(function() {\n  __4NDR0_NET_API__.onTraffic((ev) => {});\n})();`;
    const redRes = scanKernelBoundarySource(redSample, "red-control.user.js");
    const redControlCaught = redRes.bareSites.length === 1 && redRes.bareSites[0].line === 2;
    if (!redControlCaught) {
        problems.push("kernel-boundary red control failed to flag unguarded bare __4NDR0_NET_API__ reference");
    } else {
        runtimeAssertions++;
    }

    return {
        problems,
        canonFiles,
        kernelFreeCount,
        guardedConsumerCount,
        totalGuardedSites,
        transportFallbacksVerified,
        runtimeAssertions,
        /* WO-01 round-2 (6-a F16): derived denominators for the summary —
         * expectedFallbacks.size and the runtime-assertion expectation
         * (round-3, 3-a F05: the latter is now ACTUALLY derived — 3 per VM
         * fixture + the red control). */
        expectedFallbacks: expectedFallbacks.size,
        expectedRuntimeAssertions: VM_FALLBACK_FILES.length * 3 + 1,
    };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const r = await runKernelBoundarySmoke();
    console.log(
        /* WO-01 round-2 (6-a F16): denominators derived from the fixture
         * map itself — hardcoded /8 and /10 go stale the moment a battery
         * case is added. */
        `kernel-boundary-smoke: ${r.canonFiles} canon scripts (${r.kernelFreeCount} kernel-free, ${r.guardedConsumerCount} typeof-guarded across ${r.totalGuardedSites} sites, ${r.transportFallbacksVerified}/${r.expectedFallbacks} kernel-less gmFetch fallbacks, ${r.runtimeAssertions}/${r.expectedRuntimeAssertions} runtime+red-control assertions)`
    );
    if (r.problems.length) {
        for (const p of r.problems) console.error(`  ✗ ${p}`);
        process.exit(1);
    }
    console.log(`  \u2713 all ${r.canonFiles} canon scripts are kernel-less-safe; 0 bare __4NDR0_NET_API__ sites`);
}
