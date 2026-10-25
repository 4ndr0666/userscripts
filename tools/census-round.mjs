/* ═══════════════════════════════════════════════════════════════════════════
 * tools/census-round.mjs — the suite-round derivation shared by all censuses
 * ----------------------------------------------------------------------------
 * WO-01 round-1 (2-a F1, CRITICAL): eight census tools hardcoded
 * CURRENT_ROUND = "v1.7.2" while the suite moved to v1.8.2 — every G9
 * expiry check silently passed ("v1.7.2" < "v1.8.0") and all 50 adjudication
 * entries whose re-adjudication round (v1.8.0) had ALREADY passed were
 * never flagged. The documented fail-closed gate ("expiry passed without
 * re-adjudication → fail") was inert across v1.8.0→v1.8.2.
 *
 * The round now derives from package.json's version — the same value the
 * score record and the build identity carry — so a suite-version bump can
 * never again leave the censuses certifying a stale round. Re-adjudication
 * (rolling entries forward) remains an explicit, reviewable act: when this
 * value advances past an entry's expiry, the gate fires CLOSED until the
 * entry is re-verified and re-stamped.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgVersion = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

export const CURRENT_ROUND = `v${pkgVersion}`;

/* WO-01 round-4 (4-a F02): the version comparison itself is single-sourced
 * here too — nine byte-identical copies lived across the censuses (the
 * port-drift class round-2's scan-kit unification closed for scanners: a
 * future semantic change — pre-release tags, 2-segment rounds — must reach
 * ONE site, not nine). Strict component-wise compare; equality is NOT
 * less-than (the G9 gates fire AT expiry via `roundLt(round, expiry) ===
 * false`). */
export function roundLt(a, b) {
    const pa = a.replace(/^v/, "").split(".").map(Number);
    const pb = b.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x !== y) return x < y;
    }
    return false;
}
