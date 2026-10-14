#!/usr/bin/env node
/* xref-adjudicate.mjs — for each flagged (file, name), print every line
 * where the name occurs, so missing definitions are visually obvious. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const targets = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const [rel, names] of Object.entries(targets)) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) { console.log(`!! missing ${rel}`); continue; }
    const lines = fs.readFileSync(file, "utf8").split("\n");
    console.log(`\n════ ${path.basename(rel)} ════`);
    for (const name of names) {
        const re = new RegExp(`[\\w$.]${name}\\b|\\b${name}\\b`);
        const hits = [];
        lines.forEach((ln, i) => { if (re.test(ln)) hits.push(`  L${i + 1}: ${ln.trim().slice(0, 150)}`); });
        console.log(`── ${name} (${hits.length} occurrence${hits.length === 1 ? "" : "s"})`);
        for (const h of hits.slice(0, 8)) console.log(h);
        if (hits.length > 8) console.log(`  … +${hits.length - 8} more`);
    }
}
