#!/usr/bin/env node
/* Auto-update README Script Catalog from *.user.js files */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/\/tools$/, "");
const readmePath = path.join(repoRoot, "README.md");

// 1) Collect scripts
const entries = fs
  .readdirSync(repoRoot, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith(".user.js"))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b));

// 2) Extract summaries from @description (fallback: em dash)
function summaryFor(file) {
  try {
    const head = fs.readFileSync(path.join(repoRoot, file), "utf8").split("\n").slice(0, 80).join("\n");
    const m = head.match(/@description\s+(.+)\s*$/m);
    if (m && m[1]) return m[1].trim();
  } catch { /* noop */ }
  return "—";
}

// 3) Build table
const rows = entries.map((f) => {
  const display = f.replace(/^4ndr0tools\s*-\s*/i, "").replace(/\.user\.js$/i, "").replace(/%20/g, " ");
  const href = "./" + encodeURI(f).replace(/#/g, "%23");
  return `| ${display} | [${f}](${href}) | ${summaryFor(f)} |`;
});

const table = [
  "| Script | File | Summary |",
  "|---|---|---|",
  ...rows
].join("\n");

// 4) Inject between markers
const md = fs.readFileSync(readmePath, "utf8");
const start = "<!-- BEGIN_CATALOG -->";
const end = "<!-- END_CATALOG -->";
if (!md.includes(start) || !md.includes(end)) {
  console.error("Catalog markers not found in README.md. Aborting.");
  process.exit(2);
}
const updated = md.replace(
  new RegExp(`${start}[\\s\\S]*?${end}`),
  `${start}\n${table}\n${end}`
);

// 5) Write back only if changed
if (updated !== md) {
  fs.writeFileSync(readmePath, updated);
  console.log("README.md catalog updated.");
} else {
  console.log("README.md catalog already current.");
}
