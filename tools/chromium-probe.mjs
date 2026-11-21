#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/chromium-probe.mjs — Shared Chromium-family binary discovery (v2.0.0)
 * ---------------------------------------------------------------------------
 * Single source of truth for all headless browser smoke drivers:
 *   1. Explicit env overrides: CHROME_BIN, CHROMIUM_BIN, BROWSER_BIN
 *   2. Standard Linux / Arch / Debian / macOS Chromium-family binary paths
 *   3. Playwright-managed Chromium cache (~/.cache/ms-playwright)
 * Returns the first existing executable path, or null when none is installed.
 * ═══════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function discoverChromium() {
  for (const envVar of ["CHROME_BIN", "CHROMIUM_BIN", "BROWSER_BIN"]) {
    const candidate = process.env[envVar];
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  const fixed = [
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/brave",
    "/usr/bin/brave-browser",
    "/usr/bin/vivaldi",
    "/usr/bin/vivaldi-stable",
    "/usr/bin/ungoogled-chromium",
    "/usr/bin/microsoft-edge-stable",
    "/usr/bin/microsoft-edge",
    "/usr/bin/thorium-browser",
    "/usr/local/bin/chromium",
  ];
  for (const p of fixed) {
    if (fs.existsSync(p)) return p;
  }

  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(process.env.HOME || os.homedir(), ".cache", "ms-playwright");
  try {
    const dirs = fs
      .readdirSync(cache)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const d of dirs) {
      for (const sub of ["chrome-linux64", "chrome-linux"]) {
        const bin = path.join(cache, d, sub, "chrome");
        if (fs.existsSync(bin)) return bin;
      }
    }
  } catch (_) {}

  return null;
}
