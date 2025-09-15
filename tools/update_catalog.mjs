#!/usr/bin/env node
/**
 * update_catalog.mjs
 *
 * Auto-update README Script Catalog from *.user.js files.
 * Scopes replacement strictly between <!-- BEGIN_CATALOG --> and <!-- END_CATALOG -->.
 * Ensures newlines before/after markers for clean rendering.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.dirname(__filename).replace(/\/tools$/, "");
const readmePath = path.join(repoRoot, "README.md");

// 1) Collect *.user.js scripts from repo root
const entries = fs
  .readdirSync(repoRoot, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith(".user.js"))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b));

// 2) Extract summaries from @description
function summaryFor(file) {
  try {
    const head = fs
      .readFileSync(path.join(repoRoot, file), "utf8")
      .split("\n")
      .slice(0, 80)
      .join("\n");
    const m = head.match(/@description\s+(.+)\s*$/m);
    if (m && m[1]) return m[1].trim();
  } catch {
    // ignore
  }
  return "—";
}

// 3) Build markdown table
const rows = entries.map((f) => {
  const href = "./" + encodeURI(f).replace(/#/g, "%23");
  const display = f.replace(/^4ndr0tools\s*-\s*/i, "").replace(/\.user\.js$/i, "");
  return `| ${display} | [${f}](${href}) | ${summaryFor(f)} |`;
});

const table = [
  "| Script | File | Summary |",
  "|---|---|---|",
  ...rows,
].join("\n");

// 4) Read README
const md = fs.readFileSync(readmePath, "utf8");

const start = "<!-- BEGIN_CATALOG -->";
const end = "<!-- END_CATALOG -->";

// 5) Ensure markers exist
if (!md.includes(start) || !md.includes(end)) {
  console.error("Catalog markers not found in README.md. Aborting.");
  process.exit(2);
}

// 6) Replace catalog content with padding
const newBlock = `${start}\n\n${table}\n\n${end}`;
const updated = md.replace(
  new RegExp(`${start}[\\s\\S]*?${end}`),
  newBlock
);

// 7) Write if changed
if (updated !== md) {
  fs.writeFileSync(readmePath, updated);
  console.log("README.md catalog updated.");
} else {
  console.log("README.md catalog already current.");
}
