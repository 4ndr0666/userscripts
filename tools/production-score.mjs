#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/production-score.mjs — §3.5 production rubric, machine-scored (v1.5.0)
 * ----------------------------------------------------------------------------
 * Round mandate (workorder G5): the 7-dimension 0–100 rubric has NEVER been
 * machine-recorded in any round. This tool computes it from census outputs
 * and gate results — no narrative inputs — records tools/score.json, and
 * fails certification below 90 (escalated from §3.5's nominal 85 per the
 * v1.5.0 round contract).
 *
 * INPUT COVERAGE POLICY (honest, recorded in score.json): every dimension
 * lists its machine inputs. Dimensions whose full input surface is not yet
 * censused are scored at their measured coverage fraction with the gap named
 * — Error Handling's non-kernel catch-site census (G11) is the one partial
 * input this round; its 0.6 coverage is a recorded limitation, not a guess.
 *
 * Dimension mapping (weights per §3.5):
 *   Correctness 20 — kernel-smoke battery + zero failing check gates
 *   Security 10 — sink / transport / global / hotkey / connect / OPSEC
 *   Performance 15 — polling / observer / cache / size-budget censuses
 *   Scalability 15 — boundedness family (transport, polling, cache, global,
 *                        observer) + NetHook single-wrap sharing + inventory
 *   Error Handling 10 — kernel typed-error battery + non-kernel catch
 *                        census (G11, full input since v1.5.1)
 *   Maintainability 20 — style audit + docs truthfulness + inventory
 *                        determinism + identity-ledger evidence coverage
 *   DX 10 — QR verification + docs coverage + dist README coverage
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runErrorCensus } from "./error-census.mjs";
import { runPollingCensus } from "./polling-census.mjs";
import { runObserverCensus } from "./observer-census.mjs";
import { runCacheCensus } from "./cache-census.mjs";

const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const SCORE_THRESHOLD = 90;

export function runProductionScore(root = DEFAULT_ROOT, ctx = {}, opts = {}) {
    const problems = [];
    const dims = [];

    /* ── Correctness (20) ─────────────────────────────────────────────────── */
    const smokePass = ctx.smoke?.pass !== false;
    const smokeCount = ctx.smoke?.count ?? 0;
    const smokeFloor = ctx.smoke?.floor ?? 138;
    const otherGateFailures = ctx.otherGateFailures ?? 0;
    let correctness = 0;
    correctness += smokePass ? 12 : 0;                                  /* the battery is pass/fail */
    correctness += Math.min(8, Math.round((smokeCount / Math.max(1, smokeFloor)) * 8)); /* battery size vs floor */
    correctness -= Math.min(correctness, otherGateFailures * 2);        /* failing check gates */
    dims.push({ dimension: "Correctness", weight: 20, score: correctness,
        inputs: [`kernel-smoke: ${smokeCount}/${smokeFloor} ${smokePass ? "ALL PASS" : "FAIL"}`, `check-gate failures: ${otherGateFailures}`] });

    /* ── Security (10) ────────────────────────────────────────────────────── */
    const sink = ctx.censuses?.sink ?? { clean: false };
    const transport = ctx.censuses?.transport ?? { clean: false };
    const globalC = ctx.censuses?.global ?? { clean: false };
    const hotkey = ctx.censuses?.hotkey ?? { clean: false };
    const connect = ctx.censuses?.connect ?? { clean: false };
    const domainC = ctx.censuses?.domain ?? { clean: false };
    const opsec = ctx.opsec !== false;
    let security = 0;
    security += sink.clean ? 2 : 0;
    security += transport.clean ? 2 : 0;
    security += globalC.clean ? 2 : 0;
    security += hotkey.clean ? 1 : 0;
    security += connect.clean ? 2 : 0;
    security += opsec ? 1 : 0;
    dims.push({ dimension: "Security", weight: 10, score: security,
        inputs: [`sink census clean: ${sink.clean}`, `transport census clean: ${transport.clean}`, `global census clean: ${globalC.clean}`, `hotkey census clean: ${hotkey.clean}`, `connect census clean: ${connect.clean}`, `domain co-install ledger clean: ${domainC.clean}`, `OPSEC remote-asset ban: ${opsec}`] });

    /* ── Performance (15) ─────────────────────────────────────────────────── */
    const polling = ctx.censuses?.polling ?? { clean: false };
    const observer = ctx.censuses?.observer ?? { clean: false };
    const cache = ctx.censuses?.cache ?? { clean: false };
    const size = ctx.censuses?.size ?? { clean: false };
    let performance = 0;
    performance += polling.clean ? 5 : 0;
    performance += observer.clean ? 3 : 0;
    performance += cache.clean ? 4 : 0;
    performance += size.clean ? 3 : 0;
    dims.push({ dimension: "Performance", weight: 15, score: performance,
        inputs: [`polling census clean: ${polling.clean} (${polling.sites ?? "?"} sites)`, `observer census clean: ${observer.clean} (${observer.sites ?? "?"} sites)`, `cache census clean: ${cache.clean} (${cache.registries ?? "?"} registries)`, `size budget clean: ${size.clean}`] });

    /* ── Scalability (15) ─────────────────────────────────────────────────── */
    const netHook = ctx.netHook ?? { consumers: 0 };
    const inventoryDeterministic = ctx.inventoryDeterministic !== false;
    let scalability = 0;
    const family = [transport.clean, polling.clean, cache.clean, globalC.clean, observer.clean].filter(Boolean).length;
    scalability += Math.round(family * 1.8);                            /* 5 clean censuses → 9 */
    scalability += netHook.consumers >= 10 ? 3 : 1;                      /* one shared page-realm wrap */
    scalability += inventoryDeterministic ? 3 : 0;
    dims.push({ dimension: "Scalability", weight: 15, score: Math.min(scalability, 15),
        inputs: [`boundedness family clean: ${family}/5 (transport, polling, cache, global, observer)`, `domain co-install ledger: ${domainC.clean}`, `NetHook consumers sharing one wrap: ${netHook.consumers}`, `inventory deterministic: ${inventoryDeterministic}`] });

    /* ── Error Handling (10) — full input since v1.5.1 (G11 built) ───────── */
    const errCensus = ctx.censuses?.error ?? { clean: false, silent: -1, typed: 0, debug: 0, handled: 0, catchSites: 0 };
    let errorHandling = 0;
    errorHandling += smokePass ? 4 : 0;                                 /* kernel typed NetError family + abort/settle paths, battery-proven */
    errorHandling += errCensus.clean && errCensus.silent === 0 ? 6 : 0; /* non-kernel catch census: 0 true swallows */
    dims.push({ dimension: "ErrorHandling", weight: 10, score: errorHandling,
        inputs: [`kernel typed-error family (NetError/NetTimeoutError/NetHttpError) — smoke battery: ${smokePass}`, `non-kernel catch census: ${errCensus.catchSites} sites — ${errCensus.typed} typed, ${errCensus.debug} debug-logged, ${errCensus.handled} handled, ${errCensus.silent} silent (clean: ${errCensus.clean})`],
        coverage: 1 });

    /* ── Maintainability (20) ─────────────────────────────────────────────── */
    const stylePass = ctx.style !== false;
    /* v1.6.2: the label is derived from the live audit counts — was hardcoded
     * "37/37", which kept misreporting the moment the 38th script landed
     * (the operator's score record said 37/37 on a 38/38 tree). */
    const styleCounts = ctx.styleCounts ?? { pass: "?", total: "?" };
    const docsTruthful = ctx.docsTruthful !== false;
    const ledger = ctx.ledger ?? { units: 0, evidenced: 0 };
    let maintainability = 0;
    maintainability += stylePass ? 6 : 0;
    maintainability += docsTruthful ? 5 : 0;
    maintainability += inventoryDeterministic ? 3 : 0;
    const evidenceRatio = ledger.units ? ledger.evidenced / ledger.units : 0;
    maintainability += Math.round(6 * evidenceRatio);
    dims.push({ dimension: "Maintainability", weight: 20, score: maintainability,
        inputs: [`style audit ${styleCounts.pass}/${styleCounts.total}: ${stylePass}`, `docs truthfulness (0 drift): ${docsTruthful}`, `identity-ledger evidence coverage: ${ledger.evidenced}/${ledger.units}`] });

    /* ── DX (10) ──────────────────────────────────────────────────────────── */
    const qrPass = ctx.qr !== false;
    const docsCoverage = ctx.docsCoverage ?? { readmes: 0, scripts: 0 };
    const docRatio = docsCoverage.scripts ? docsCoverage.readmes / docsCoverage.scripts : 0;
    let dx = 0;
    dx += qrPass ? 3 : 0;
    dx += docRatio >= 1 ? 7 : Math.round(7 * docRatio);
    dims.push({ dimension: "DX", weight: 10, score: dx,
        inputs: [`qr-verify green: ${qrPass}`, `documentation README coverage: ${docsCoverage.readmes}/${docsCoverage.scripts}`] });

    /* ── total + record ──────────────────────────────────────────────────── */
    const total = dims.reduce((a, d) => a + d.score, 0);
    const round = ctx.round ?? "v1.5.1";
    /* v1.6.2 determinism contract (same class as the v1.4.3 inventory fix):
     * the record is round-addressed, NEVER wall-clock-addressed — a
     * `generatedAt: new Date()` here made every `npm run check` rewrite
     * tools/score.json, so a post-apply re-verification always left the
     * staged canon drifted (operator field report, v1.6.1 apply). With a
     * stable schema, regeneration is byte-identical and validate.mjs
     * pins it with its own determinism gate. */
    const record = { round, total, threshold: SCORE_THRESHOLD, dimensions: dims };
    const scorePath = path.join(root, "tools", "score.json");
    /* WO-01 round-1 (2-a F6): the write is opt-out — validate.mjs (the
     * authoritative caller that actually ran every gate) writes by default;
     * the standalone CLI NEVER writes, because its unverified snapshot
     * inputs (browser batteries, style/size/ledger/docs freshness) could
     * otherwise stamp a false CERTIFIED record onto a broken tree. */
    if (opts.write !== false) {
        try {
            fs.writeFileSync(scorePath, JSON.stringify(record, null, 2) + "\n");
        } catch (e) {
            problems.push(`score recording failed: ${e.message}`);
        }
    }
    if (total < SCORE_THRESHOLD) {
        problems.push(`production score ${total}/100 < ${SCORE_THRESHOLD} (§3.5 escalated threshold) — dimensions: ${dims.map((d) => `${d.dimension}=${d.score}/${d.weight}`).join(", ")}`);
    }
    return { problems, total, dims, scorePath, wrote: opts.write !== false };
}

/* CLI: node tools/production-score.mjs — recompute from the standing censuses */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
    const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
    /* standalone mode: green-census snapshot of the v1.6.2 state
     * (validate.mjs is the authoritative caller — it derives every value
     * fresh; this snapshot is refreshed each round so standalone reruns
     * do not cite stale counts. v1.6.1: 38 scripts (Zai Exporter lands
     * gate-born), error census 839 sites (+27, all debug/handled), cache
     * 133 registries (one call-scoped Set; the live count is derived at
     * runtime — the snapshot comment cites the v1.6.2 state), docs
     * coverage derived 38/38.
     * v1.6.2: counts unchanged — the round is the determinism contract
     * itself: score.json round-addressed, style label 38/38.) */
    const liveErr = runErrorCensus(root);
    const livePoll = runPollingCensus(root);
    const liveObs = runObserverCensus(root);
    const liveCache = runCacheCensus(root);
    const pkgRound = "v" + JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
    const r = runProductionScore(root, {
        otherGateFailures: 0,
        censuses: {
            sink: { clean: true },
            transport: { clean: true },
            global: { clean: true },
            hotkey: { clean: true },
            polling: { clean: !livePoll.problems.length, sites: livePoll.sites },
            observer: { clean: !liveObs.problems.length, sites: liveObs.sites },
            cache: { clean: !liveCache.problems.length, registries: liveCache.registries },
            size: { clean: true },
            connect: { clean: true },
            domain: { clean: true },
            error: { clean: !liveErr.problems.length, catchSites: liveErr.catchSites, typed: liveErr.typed, debug: liveErr.debug, handled: liveErr.handled, silent: liveErr.silent },
        },
        opsec: true, netHook: { consumers: 16 }, inventoryDeterministic: true, style: true, styleCounts: { pass: 38, total: 38 }, docsTruthful: true,
        ledger: { units: 61, evidenced: 61 },
        qr: true, docsCoverage: { readmes: 38, scripts: 38 },
        round: pkgRound,
    }, { write: false }); /* WO-01 round-1 (2-a F6): standalone mode NEVER writes
     * tools/score.json — the snapshot inputs below are assumptions, not
     * verified facts, and stamping them into the record on a broken tree
     * was a false-certification vector. validate.mjs (which runs every
     * gate for real) is the only legitimate writer. */
    for (const d of r.dims) console.log(`  ${d.dimension.padEnd(15)} ${d.score}/${d.weight}  [${d.inputs.join("; ")}]`);
    console.log(`TOTAL: ${r.total}/100 (threshold ${SCORE_THRESHOLD})`);
    if (r.problems.length) { for (const p of r.problems) console.log(`  ✗ ${p}`); process.exit(1); }
    console.log("  ✓ standalone report only — tools/score.json NOT written (validate.mjs via `npm run check` is the sole writer; snapshot inputs: smoke/style/size/sink/transport/global/hotkey/connect/domain/ledger/qr/docs are assumed green here, only error/polling/observer/cache ran live)");
}
