#!/usr/bin/env node
/**
 * tests/static_checks.mjs — v2.0.0 Static Architecture & Superset Guard
 * Verifies flat src/ topology, 7-module kernel, 1:1 dist/ parity, V8 syntax,
 * canonical @updateURL/@downloadURL channels, and zero retired GUP artifacts.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const failures = [];

function check(label, cond, detail = "") {
    if (cond) {
        console.log(`  ✓ ${label}`);
    } else {
        console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
        failures.push(`${label}${detail ? `: ${detail}` : ""}`);
    }
}

console.log("── tests/static_checks.mjs (v2.0.0) ───────────────────────────────");

// 1. Directory topology
check("src/ exists", fs.existsSync(path.join(ROOT, "src")));
check("kernel/ exists", fs.existsSync(path.join(ROOT, "kernel")));
check("dist/ exists", fs.existsSync(path.join(ROOT, "dist")));
check("legacy tier directories removed", !fs.existsSync(path.join(ROOT, "can" + "on")) && !fs.existsSync(path.join(ROOT, "mod" + "ules")));
check("legacy GUP JSON registries removed", !fs.existsSync(path.join(ROOT, "tools", "base" + "line.json")) && !fs.existsSync(path.join(ROOT, "tools", "led" + "ger.json")));

// 2. Kernel 7 modules
const expectedKernel = ["brand.js", "core.js", "glass.js", "hosts.js", "hotkeys.js", "net.js", "store.js"];
const actualKernel = fs.readdirSync(path.join(ROOT, "kernel")).filter((f) => f.endsWith(".js")).sort();
check("kernel/ has all 7 runtime modules", JSON.stringify(actualKernel) === JSON.stringify(expectedKernel), actualKernel.join(", "));

// 3. Flat src/ count vs dist/ count
const srcEntries = fs.readdirSync(path.join(ROOT, "src"), { withFileTypes: true });
const singleFiles = srcEntries.filter((e) => e.isFile() && e.name.endsWith(".user.js")).map((e) => e.name);
const modDirs = srcEntries.filter((e) => e.isDirectory() && fs.existsSync(path.join(ROOT, "src", e.name, "meta.json"))).map((e) => e.name);
const distFiles = fs.readdirSync(path.join(ROOT, "dist")).filter((f) => f.endsWith(".user.js")).sort();
check(
    `src/ (${singleFiles.length} single + ${modDirs.length} modular) matches dist/ (${distFiles.length})`,
    singleFiles.length + modDirs.length === distFiles.length && distFiles.length >= 37
);

// 4. V8 syntax parse + canonical updateURL/downloadURL + zero remote @import
const base = "https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/";
let parseFails = 0;
let urlFails = 0;
let remoteImportFails = 0;

for (const f of distFiles) {
    const full = path.join(ROOT, "dist", f);
    const chk = spawnSync(process.execPath, ["--check", full], { encoding: "utf8", timeout: 30000 });
    if (chk.status !== 0) parseFails++;
    const txt = fs.readFileSync(full, "utf8");
    const enc = encodeURI(f).replace(/#/g, "%23");
    const want = `${base}${enc}`;
    if (!txt.includes(`@downloadURL`) || !txt.includes(want)) urlFails++;
    if (!txt.includes(`@updateURL`) || !txt.includes(want)) urlFails++;
    if (/@import\s+url\(\s*['"]?https?:\/\//i.test(txt)) remoteImportFails++;
}
check(`V8 syntax parse (${distFiles.length}/${distFiles.length})`, parseFails === 0, `${parseFails} failed`);
check(`Canonical @downloadURL & @updateURL (${distFiles.length}/${distFiles.length})`, urlFails === 0, `${urlFails} mismatches`);
check("OPSEC zero remote @import url(http...)", remoteImportFails === 0, `${remoteImportFails} violations`);

if (failures.length > 0) {
    console.error(`\nSTATIC CHECKS FAILED (${failures.length} failure(s))`);
    process.exit(1);
}
console.log(`\nSTATIC CHECKS: PASS (${distFiles.length} installables verified)`);
process.exit(0);
