#!/usr/bin/env node
/**
 * tools/flow-chip-browser-smoke.mjs — Live Headless Chromium (click, wait, get)
 * Proof-of-Possession Battery for Prompt Master v28.7.3 Google Flow Token/Credit Chip Counter.
 *
 * Paradigm: Ephemeral State Machine (D2/D4) — spawns an isolated Chromium instance
 * with a mkdtemp /tmp profile, serves http://flow.google.com:<port>/fx/tools/flow/edit/live
 * via --host-resolver-rules, drives real CDP/DOM (click, wait, get) interactions,
 * verifies computed flexbox styles, bounding-box geometry, ResizeObserver reflows,
 * shared-pool math, limit-notice wall reconciliation, and kernel-less parity,
 * and unconditionally reclaims the browser process and temp directory on exit.
 */

import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_PM = path.join(ROOT, "dist", "4ndr0tools - Prompt Master.user.js");
const CANON_PM = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Prompt Master.user.js");

/* v1.7.4 (WO-02 round 2): the probe used to be a fixed 3-path list, which
 * meant hosts that DO have a Chromium — via the Playwright browser cache —
 * silently ran the structural fallback instead of the live PoP. The probe
 * now also derives the newest Playwright-managed Chromium (chrome-linux64
 * and legacy chrome-linux layouts). Same binaries, strictly more live proof. */
function probeChromium() {
  const fixed = [
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ];
  for (const p of fixed) if (fs.existsSync(p)) return p;
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(process.env.HOME || os.homedir(), ".cache", "ms-playwright");
  try {
    const dirs = fs.readdirSync(cache)
      .filter((d) => /^chromium-\d+$/.test(d))
      .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
    for (const d of dirs) {
      for (const sub of ["chrome-linux64", "chrome-linux"]) {
        const bin = path.join(cache, d, sub, "chrome");
        if (fs.existsSync(bin)) return bin;
      }
    }
  } catch (_) { /* no cache dir — fall through */ }
  return null;
}

const CHROMIUM_BIN = probeChromium();

function buildFlowFixtureHtml(scriptSource) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Google Flow — Workspace</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #0b0f14;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }
    #flow-result-grid {
      position: absolute;
      top: 24px;
      left: 24px;
      right: 24px;
      height: 360px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    #flow-composer {
      position: fixed;
      left: 120px;
      bottom: 28px;
      width: 760px;
      min-height: 84px;
      padding: 12px;
      box-sizing: border-box;
      background: #141c24;
      border: 1px solid #263340;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #PINHOLE_TEXT_AREA_ELEMENT_ID {
      width: 720px;
      height: 56px;
      box-sizing: border-box;
      background: #0f161d;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      resize: none;
    }
    #flow-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    #flow-model-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border-radius: 6px;
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #475569;
      font-size: 12px;
      cursor: pointer;
    }
    #flow-start-gen {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 34px;
      padding: 0 16px;
      border-radius: 6px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    #toast-host {
      position: fixed;
      bottom: 140px;
      left: 160px;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="flow-result-grid"></div>
  <div id="toast-host"></div>
  <div id="flow-composer" class="flow-composer-bar">
    <textarea id="PINHOLE_TEXT_AREA_ELEMENT_ID" placeholder="Describe your scene...">A cinematic neon cyber-samurai</textarea>
    <div id="flow-toolbar">
      <button id="flow-model-chip" type="button" aria-label="Nano Banana 2 x4">🍌 Nano Banana 2 crop_16_9 x4</button>
      <button id="flow-start-gen" type="button" aria-label="Start generation">Create</button>
    </div>
  </div>
  <script>
    window.__gmStore = {};
    window.__gmMenu = {};
    window.__lastClipboard = "";
    window.unsafeWindow = window;
    window.GM_info = { script: { version: "28.7.3" } };
    window.GM_getValue = async function(k, defVal) {
      return Object.prototype.hasOwnProperty.call(window.__gmStore, k)
        ? window.__gmStore[k]
        : defVal;
    };
    window.GM_setValue = async function(k, v) {
      window.__gmStore[k] = v;
    };
    window.GM_listValues = async function() {
      return Object.keys(window.__gmStore);
    };
    window.GM_deleteValue = async function(k) {
      delete window.__gmStore[k];
    };
    window.GM_registerMenuCommand = function(label, fn) {
      window.__gmMenu[label] = fn;
      return label;
    };
    window.GM_setClipboard = function(text) {
      window.__lastClipboard = String(text || "");
    };
    window.GM_xmlhttpRequest = function(opts) {
      if (opts && typeof opts.onload === "function") {
        setTimeout(function() {
          opts.onload({ status: 200, responseText: "{}" });
        }, 5);
      }
      return { abort: function() {} };
    };
  </script>
  <script>${scriptSource}</script>
</body>
</html>`;
}

// Minimal RFC 6455 WebSocket client for Chrome DevTools Protocol (CDP)
function connectCDP(wsUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString("base64");
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Key": key,
        "Sec-WebSocket-Version": "13",
      },
    });
    req.on("error", reject);
    req.on("upgrade", (res, socket, head) => {
      let buf = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
      let nextId = 1;
      const pending = new Map();

      function processBuffer() {
        while (buf.length >= 2) {
          const b0 = buf[0];
          const b1 = buf[1];
          const opcode = b0 & 0x0f;
          const masked = (b1 & 0x80) !== 0;
          let len = b1 & 0x7f;
          let offset = 2;
          if (len === 126) {
            if (buf.length < 4) return;
            len = buf.readUInt16BE(2);
            offset = 4;
          } else if (len === 127) {
            if (buf.length < 10) return;
            len = Number(buf.readBigUInt64BE(2));
            offset = 10;
          }
          const maskLen = masked ? 4 : 0;
          if (buf.length < offset + maskLen + len) return;
          let payload = buf.subarray(offset + maskLen, offset + maskLen + len);
          if (masked) {
            const mask = buf.subarray(offset, offset + 4);
            payload = Buffer.from(payload);
            for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
          }
          buf = buf.subarray(offset + maskLen + len);
          if (opcode === 0x01) {
            const msg = JSON.parse(payload.toString("utf8"));
            if (msg.id && pending.has(msg.id)) {
              const { resolve: resFn, reject: rejFn } = pending.get(msg.id);
              pending.delete(msg.id);
              if (msg.error) rejFn(new Error(JSON.stringify(msg.error)));
              else resFn(msg.result);
            }
          } else if (opcode === 0x09) {
            // Ping -> send Pong
            sendFrame(0x0a, payload);
          }
        }
      }

      function sendFrame(opcode, dataBuf) {
        const mask = crypto.randomBytes(4);
        const len = dataBuf.length;
        let header;
        if (len < 126) {
          header = Buffer.alloc(6);
          header[0] = 0x80 | opcode;
          header[1] = 0x80 | len;
          mask.copy(header, 2);
        } else if (len < 65536) {
          header = Buffer.alloc(8);
          header[0] = 0x80 | opcode;
          header[1] = 0x80 | 126;
          header.writeUInt16BE(len, 2);
          mask.copy(header, 4);
        } else {
          header = Buffer.alloc(14);
          header[0] = 0x80 | opcode;
          header[1] = 0x80 | 127;
          header.writeBigUInt64BE(BigInt(len), 2);
          mask.copy(header, 10);
        }
        const maskedPayload = Buffer.alloc(len);
        for (let i = 0; i < len; i++) maskedPayload[i] = dataBuf[i] ^ mask[i & 3];
        socket.write(Buffer.concat([header, maskedPayload]));
      }

      socket.on("data", (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        processBuffer();
      });

      function send(method, params = {}) {
        return new Promise((resFn, rejFn) => {
          const id = nextId++;
          pending.set(id, { resolve: resFn, reject: rejFn });
          const payload = Buffer.from(JSON.stringify({ id, method, params }), "utf8");
          sendFrame(0x01, payload);
        });
      }

      resolve({
        send,
        close() {
          try {
            socket.destroy();
          } catch (_) {}
        },
      });
      processBuffer();
    });
    req.end();
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

// v28.8.0 (WO-01 round 3): margin-aware form — margin inflates b on
// every side, so boxesOverlap(chip, forbidden, 6) is true when the chip
// is INSIDE forbidden or within 6px of it (the no-occlusion contract's
// clearance). Default 0 keeps the v28.7.5 two-arg red-control behavior
// byte-identical.
function boxesOverlap(a, b, margin = 0) {
  return !(
    a.right <= b.left - margin ||
    a.left >= b.right + margin ||
    a.bottom <= b.top - margin ||
    a.top >= b.bottom + margin
  );
}

export async function runFlowChipBrowserBattery() {
  const distSource = fs.readFileSync(DIST_PM, "utf8");
  const canonSource = fs.readFileSync(CANON_PM, "utf8");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-flow-cdp-"));
  let server = null;
  let browser = null;
  let cdp = null;

  const checks = [];
  function assert(name, cond, detail = "") {
    checks.push({ name, pass: Boolean(cond), detail: String(detail || "") });
  }

  if (!CHROMIUM_BIN) {
    // Structural/contract fallback on hosts without a local Chromium binary.
    // v28.7.5 (suite v1.7.3, WO-02): this fallback used to return
    // `clean: true, failed: []` UNCONDITIONALLY — a lying gate. Its own
    // assertion 1 was RED at the time of discovery (it pinned the literal
    // dist version 28.7.3 while the dist had already moved to 28.7.4 in a
    // later round), yet the battery reported green and the suite check
    // printed "11/11 verified". Two repairs, per the battery law
    // (expectations derive from the artifact, never hardcode; a battery
    // that cannot fail is not a battery):
    // (1) the version pin is DERIVED from the dist's own @version header
    //     and cross-checked for canon/dist parity — it can never go stale
    //     again;
    // (2) the return object reports the REAL pass/fail counts and clean
    //     flag, byte-identical contract to the live-Chromium path below,
    //     so a red assertion fails the suite check fail-closed.
    const distVersion =
      (distSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
    const canonVersion =
      (canonSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
    assert("1. Prompt Master version header present & canon/dist parity & FLOW_CREDIT_CSS flexbox contract",
      !!distVersion &&
        distVersion === canonVersion &&
        distSource.includes("box-sizing:border-box;overflow:hidden") &&
        distSource.includes("flex:0 1 auto;min-width:44px;max-width:240px") &&
        distSource.includes("flex:0 0 auto;font-variant-numeric:tabular-nums") &&
        distSource.includes("min-width:20px;height:4px;border-radius:2px;background:rgba(0,229,255,.14);overflow:hidden;flex:0 1 40px"),
      `dist=${distVersion}, canon=${canonVersion}`);
    assert("2. ResizeObserver anchor & dock synchronization present",
      distSource.includes("flowCreditResizeObserver = new ResizeObserver(scheduleFlowCreditPosition)") &&
      distSource.includes("flowCreditResizeObserver.observe(flowCreditResizeEl)"));
    assert("3. positionFlowCreditChip re-resolves invisible anchor & dynamic maxWidth clamping",
      distSource.includes("chip.style.maxWidth =") &&
      distSource.includes("const vwMax = Math.max(140, vw - 16);") &&
      distSource.includes("chip.style.maxWidth = Math.min(vwMax, Math.round(avail2)) + \"px\";") &&
      distSource.includes("chip.style.maxWidth = Math.min(vwMax, Math.round(avail3)) + \"px\";"));
    assert("4. no-occlusion contract: measured forbidden rects + berth ladder + hide fallback (WO-01 round 3)",
      distSource.includes("flowCreditRectsOverlap") &&
      distSource.includes("const occluded = function (x, y, w, h)") &&
      distSource.includes("flowCreditEditorEl && flowCreditEditorEl.isConnected") &&
      distSource.includes("flowCreditComposerEl && flowCreditComposerEl.isConnected") &&
      distSource.includes("chip.classList.add(\"mp-credit-hidden\")"));
    assert("4b. parked mode retired: no parkAtFlowDock code, no parked class toggle, hide-when-needed verbatim",
      !distSource.includes("function parkAtFlowDock(") &&
      !distSource.includes("flowCreditChipHasContent()") &&
      !distSource.includes("classList.add(\"mp-credit-parked\")") &&
      !distSource.includes("mp-credit-parked{box-shadow"),
      "the v28.2.0 parked berth was the grid/input obstruction the operator reported");
    assert("5. flowCreditTurnsLeft reconnects learned capTurns ceiling & fallback",
      distSource.includes("src: \"learned cap\"") &&
      distSource.includes("left = Math.min(left, Math.max(0, e.capTurns - (e.turnsDay || 0)))"));
    assert("6. flowCreditScanLimitNotice prioritizes explicit model name in notice text",
      distSource.includes("const namedHits = FLOW_CREDIT_MODELS.filter(function (m) {"));
    assert("7. renderFlowCreditChip & resetFlowCreditTracker trigger scheduleFlowCreditPosition",
      distSource.includes("const effLeft = Math.min(left5h, leftWk);") &&
      distSource.includes("chip.title = title;\n    scheduleFlowCreditPosition();"));
    assert("8. findFlowAnchorButton & findFlowComposerContainer & findPlatformEditor fallbacks",
      distSource.includes("type: \"gen-button-fallback\"") &&
      distSource.includes("return r.width >= 160 && r.height >= 28 && r.top + r.height / 2 > vh * 0.4;"));
    assert("9. canon & dist parity on Flow chip counter logic",
      canonSource.includes("flowCreditResizeObserver = new ResizeObserver(scheduleFlowCreditPosition)"));
    assert("10. GM_registerMenuCommand returns exportFlowCreditLedger promise",
      distSource.includes("GM_registerMenuCommand(\"📋 Flow Credits: Export Ledger\", () =>\n        exportFlowCreditLedger()"));
    assert("11. red-control: synthetic left-edge model-chip collision is detected and rejected",
      boxesOverlap({ left: 8, top: 720, right: 240, bottom: 742 }, { left: 20, top: 716, right: 180, bottom: 748 }) === true);
    // v28.7.5 (WO-02): the fallback previously returned
    // { passed: checks.length, total: checks.length, clean: true, failed: [] }
    // — a hollow green that ignored its own checks. The contract now
    // matches the live-Chromium path exactly (see the end of this
    // function): clean === (failed.length === 0), fail-closed.
    const failedStructural = checks.filter((c) => !c.pass);
    return {
      passed: checks.length - failedStructural.length,
      total: checks.length,
      clean: failedStructural.length === 0,
      mode: "structural-fallback",
      checks,
      failed: failedStructural,
    };
  }
  try {
    // 1. Start local HTTP fixture server
    let mode = "dist";
    server = http.createServer((req, res) => {
      if (req.url && req.url.startsWith("/fx/tools/flow/")) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(buildFlowFixtureHtml(mode === "canon" ? canonSource : distSource));
        return;
      }
      if (req.url && req.url.startsWith("/gen/")) {
        // 1x1 transparent PNG
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          "base64"
        );
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(png);
        return;
      }
      res.writeHead(404);
      res.end("Not found");
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    // 2. Spawn Headless Chromium with --host-resolver-rules mapping flow.google.com -> 127.0.0.1
    const targetUrl = `http://flow.google.com:${port}/fx/tools/flow/edit/live-po-test`;
    browser = spawn(
      CHROMIUM_BIN,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-default-browser-check",
        `--user-data-dir=${path.join(tmpDir, "ud")}`,
        `--host-resolver-rules=MAP flow.google.com 127.0.0.1`,
        "--window-size=1280,800",
        "--remote-debugging-port=0",
        targetUrl,
      ],
      {
        env: {
          ...process.env,
          HOME: tmpDir,
          XDG_CONFIG_HOME: tmpDir,
          XDG_CACHE_HOME: tmpDir,
        },
      }
    );

    const wsBrowserUrl = await new Promise((resolve, reject) => {
      // v1.7.4: 10s -> 30s (cold-start jitter under back-to-back battery load).
      const timer = setTimeout(
        () => reject(new Error("Timed out waiting for Chromium DevTools port")),
        30000
      );
      browser.stderr.on("data", (chunk) => {
        const s = chunk.toString();
        const m = /DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)\/[^\s]+)/.exec(s);
        if (m) {
          clearTimeout(timer);
          resolve({ url: m[1], port: Number(m[2]) });
        }
      });
      browser.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Chromium exited prematurely with code ${code}`));
      });
    });

    // Wait for page target
    let pageWsUrl = null;
    for (let i = 0; i < 120; i++) {
      const targets = await fetchJson(`http://127.0.0.1:${wsBrowserUrl.port}/json/list`);
      const pageTarget = targets.find(
        (t) => t.type === "page" && t.url.includes("flow.google.com")
      );
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        pageWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!pageWsUrl) throw new Error("Could not attach to flow.google.com page target");

    cdp = await connectCDP(pageWsUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    async function evalInPage(expr) {
      const res = await cdp.send("Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(
          `Page evaluation error: ${JSON.stringify(res.exceptionDetails)}`
        );
      }
      return res.result ? res.result.value : undefined;
    }

    // Wait for #pm-flow-credit-chip to mount and render
    const bootState = await evalInPage(`(async function() {
      for (let i = 0; i < 50; i++) {
        const chip = document.getElementById("pm-flow-credit-chip");
        if (chip && chip.querySelector(".mp-credit-model") && chip.querySelector(".mp-credit-model").textContent !== "—") {
          break;
        }
        await new Promise(r => setTimeout(r, 50));
      }
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      const modelEl = chip.querySelector(".mp-credit-model");
      const valEl = chip.querySelector(".mp-credit-values");
      const poolEl = chip.querySelector(".mp-credit-pool");
      const fillEl = chip.querySelector(".mp-credit-pool-fill");
      const csChip = getComputedStyle(chip);
      const csModel = getComputedStyle(modelEl);
      const csVal = getComputedStyle(valEl);
      const csPool = getComputedStyle(poolEl);
      const exportFn = window.__gmMenu["📋 Flow Credits: Export Ledger"];
      const ledger = exportFn ? await exportFn() : null;
      return {
        hostname: location.hostname,
        chipPresent: !!chip,
        role: chip.getAttribute("role"),
        ariaLive: chip.getAttribute("aria-live"),
        modelText: modelEl.textContent,
        valText: valEl.textContent,
        poolFillWidth: fillEl.style.width,
        pending: chip.classList.contains("mp-credit-pending"),
        hidden: chip.classList.contains("mp-credit-hidden"),
        styles: {
          display: csChip.display,
          boxSizing: csChip.boxSizing,
          overflowX: csChip.overflowX,
          modelFlexShrink: csModel.flexShrink,
          modelMinWidth: csModel.minWidth,
          modelTextOverflow: csModel.textOverflow,
          valFlexShrink: csVal.flexShrink,
          poolFlexShrink: csPool.flexShrink,
          poolMinWidth: csPool.minWidth,
        },
        chipRect: chip.getBoundingClientRect().toJSON(),
        editorRect: document.getElementById("PINHOLE_TEXT_AREA_ELEMENT_ID").getBoundingClientRect().toJSON(),
        composerRect: document.getElementById("flow-composer").getBoundingClientRect().toJSON(),
        dockRect: (function () {
          const d = document.getElementById("pm-flow-dock");
          return d ? d.getBoundingClientRect().toJSON() : null;
        })(),
        ledger,
      };
    })()`);

    assert(
      "1. real Chromium origin + boot mount on flow.google.com",
      bootState.hostname === "flow.google.com" &&
        bootState.chipPresent &&
        bootState.role === "status" &&
        bootState.ariaLive === "polite" &&
        bootState.ledger &&
        bootState.ledger.engine.anchor === "editor",
      `host=${bootState.hostname}, anchor=${bootState.ledger?.engine?.anchor}`
    );

    assert(
      "2. computed flexbox contract (box-sizing, min-width:44px, flex-shrink discipline)",
      (bootState.styles.display === "flex" || (bootState.styles.display === "flex" || bootState.styles.display === "inline-flex")) &&
        bootState.styles.boxSizing === "border-box" &&
        bootState.styles.overflowX === "hidden" &&
        bootState.styles.modelFlexShrink === "1" &&
        bootState.styles.modelMinWidth === "44px" &&
        bootState.styles.modelTextOverflow === "ellipsis" &&
        bootState.styles.valFlexShrink === "0" &&
        bootState.styles.poolFlexShrink === "1" &&
        bootState.styles.poolMinWidth === "20px",
      JSON.stringify(bootState.styles)
    );

    assert(
      "3. clean-state NB2 pool cap (200/200 turns left, 100% pool bar, not pending)",
      bootState.modelText === "NB2 · 200/200 turns left" &&
        bootState.valText === "0 img today" &&
        bootState.poolFillWidth === "100%" &&
        !bootState.pending &&
        !bootState.hidden,
      `${bootState.modelText} | ${bootState.valText} | fill=${bootState.poolFillWidth}`
    );

    // v28.8.0 (WO-01 round 3): the no-occlusion contract at boot — the
    // chip's placed rect must clear the editor (the text field), the
    // composer (the prompt box) AND the dock (with the 6px contract
    // margin) on the live Chromium layout. This is the machine proof of
    // the operator's "obstructs the prompt input itself" report staying
    // closed.
    const bootNoOcclusion =
      !boxesOverlap(bootState.chipRect, bootState.editorRect, 6) &&
      !boxesOverlap(bootState.chipRect, bootState.composerRect, 6) &&
      (bootState.dockRect
        ? !boxesOverlap(bootState.chipRect, bootState.dockRect, 6)
        : true);
    assert(
      "3b. no-occlusion contract at boot: chip clears editor, composer and dock rects (6px margin)",
      bootNoOcclusion,
      `chip=${JSON.stringify(bootState.chipRect)} editor=${JSON.stringify(bootState.editorRect)} composer=${JSON.stringify(bootState.composerRect)} dock=${bootState.dockRect ? JSON.stringify(bootState.dockRect) : "none"}`
    );

    // Step 2: (click, wait, get) — Click #flow-start-gen with x4 batch hint + append 4 images
    const afterGen1 = await evalInPage(`(async function() {
      const btn = document.getElementById("flow-start-gen");
      btn.click();
      const grid = document.getElementById("flow-result-grid");
      for (let i = 1; i <= 4; i++) {
        const img = document.createElement("img");
        img.src = "/gen/nb2-shot-" + i + ".png";
        img.style.width = "180px";
        img.style.height = "180px";
        grid.appendChild(img);
      }
      await new Promise(r => setTimeout(r, 380));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      return {
        modelText: chip.querySelector(".mp-credit-model").textContent,
        valText: chip.querySelector(".mp-credit-values").textContent,
        poolFillWidth: chip.querySelector(".mp-credit-pool-fill").style.width,
      };
    })()`);

    assert(
      "4. (click, wait, get) NB2 x4 generation click deducts 48u -> 196/200 turns left & 4 img today",
      afterGen1.modelText === "NB2 · 196/200 turns left" &&
        afterGen1.valText === "4 img today" &&
        afterGen1.poolFillWidth === "98%",
      `${afterGen1.modelText} | ${afterGen1.valText} | fill=${afterGen1.poolFillWidth}`
    );

    // Step 3: (click, wait, get) — Click model chip to switch to Nano Banana Pro x1
    const afterSwitchPro = await evalInPage(`(async function() {
      const mChip = document.getElementById("flow-model-chip");
      mChip.setAttribute("aria-label", "Nano Banana Pro x1");
      mChip.textContent = "🍌 Nano Banana Pro crop_16_9 x1";
      mChip.click();
      await new Promise(r => setTimeout(r, 320));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      return {
        modelText: chip.querySelector(".mp-credit-model").textContent,
        valText: chip.querySelector(".mp-credit-values").textContent,
        poolFillWidth: chip.querySelector(".mp-credit-pool-fill").style.width,
      };
    })()`);

    assert(
      "5. (click, wait, get) model switch to Nano Banana Pro divides shared 2,352u pool -> 49/50 turns left",
      afterSwitchPro.modelText === "Pro · 49/50 turns left" &&
        afterSwitchPro.valText === "0 img today" &&
        afterSwitchPro.poolFillWidth === "98%",
      `${afterSwitchPro.modelText} | ${afterSwitchPro.valText}`
    );

    // Step 4: (click, wait, get) — Dynamic flexbox & ResizeObserver test (expand editor height to 180px, shrink width to 210px)
    // v28.8.0 (WO-01 round 3): the step now proves the no-occlusion
    // contract through a layout change — the editor grows to 180px tall
    // (the composer follows) and the ResizeObserver must re-place the
    // chip into a berth that still clears the editor, composer and dock
    // rects within 120ms, with maxWidth derived from the BERTH (the
    // right shoulder's measured available width), not the editor width.
    const afterResize = await evalInPage(`(async function() {
      const ed = document.getElementById("PINHOLE_TEXT_AREA_ELEMENT_ID");
      ed.style.width = "210px";
      ed.style.height = "180px";
      // Wait only 120ms (< 1s poll) to prove ResizeObserver + rAF repositions immediately
      await new Promise(r => setTimeout(r, 120));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      const modelEl = chip.querySelector(".mp-credit-model");
      const valEl = chip.querySelector(".mp-credit-values");
      const cr = chip.getBoundingClientRect();
      const er = ed.getBoundingClientRect();
      const comp = document.getElementById("flow-composer");
      const cor = comp.getBoundingClientRect();
      const dock = document.getElementById("pm-flow-dock");
      const dr = dock ? dock.getBoundingClientRect() : null;
      // The B2 right-shoulder berth the contract should have chosen:
      // x from composer.right+10 to min(vw-8, vw-dock.offsetWidth-10).
      const vw = window.innerWidth;
      const rightLim = dock ? Math.min(vw - 8, vw - dock.offsetWidth - 10) : vw - 8;
      const berthAvail = Math.round(rightLim - (cor.right + 10));
      return {
        maxWidthStyle: chip.style.maxWidth,
        hidden: chip.classList.contains("mp-credit-hidden"),
        chipRect: cr.toJSON(),
        editorRect: er.toJSON(),
        composerRect: cor.toJSON(),
        dockRect: dr ? dr.toJSON() : null,
        berthAvail: berthAvail >= 140 ? berthAvail : null,
        chipWidth: Math.round(cr.width),
        modelClientW: modelEl.clientWidth,
        modelScrollW: modelEl.scrollWidth,
        valClientW: valEl.clientWidth,
        valScrollW: valEl.scrollWidth,
      };
    })()`);

    // v28.8.0 (WO-01 round 3): the reposition proof is the CONTRACT —
    // within 120ms of the editor resize the chip's placed rect clears
    // the editor (text field), the composer (prompt box) and the dock by
    // the 6px margin, and it is VISIBLE (a lawful berth existed: the
    // right shoulder). "Obstructs the prompt input itself" stays closed
    // by machine, not by ladder arithmetic.
    assert(
      "6. (click, wait, get) ResizeObserver reposition within 120ms: chip holds a lawful berth, zero overlap with editor/composer/dock",
      !afterResize.hidden &&
        !boxesOverlap(afterResize.chipRect, afterResize.editorRect, 6) &&
        !boxesOverlap(afterResize.chipRect, afterResize.composerRect, 6) &&
        (afterResize.dockRect
          ? !boxesOverlap(afterResize.chipRect, afterResize.dockRect, 6)
          : true),
      `chip=${JSON.stringify(afterResize.chipRect)} editor=${JSON.stringify(afterResize.editorRect)} composer=${JSON.stringify(afterResize.composerRect)} hidden=${afterResize.hidden}`
    );

    // v28.8.0 (WO-01 round 3): maxWidth derives from the BERTH, not the
    // editor — the chip flexes into the right shoulder's measured width
    // (maxWidth === the shoulder's available width clamped to vwMax) and
    // the values slot never clips (clientWidth === scrollWidth) while the
    // model slot carries the ellipsis burden (scrollWidth > clientWidth
    // proves the flexbox actually squeezed rather than overflowed).
    assert(
      "7. (click, wait, get) dynamic flexbox berth clamping (maxWidth = right-shoulder width, values unclipped, model ellipsized)",
      afterResize.berthAvail !== null &&
        afterResize.maxWidthStyle === afterResize.berthAvail + "px" &&
        afterResize.chipWidth <= afterResize.berthAvail &&
        afterResize.valClientW === afterResize.valScrollW &&
        afterResize.valClientW > 0 &&
        afterResize.modelScrollW > afterResize.modelClientW,
      JSON.stringify({
        maxWidthStyle: afterResize.maxWidthStyle,
        berthAvail: afterResize.berthAvail,
        chipWidth: afterResize.chipWidth,
        modelClientW: afterResize.modelClientW,
        modelScrollW: afterResize.modelScrollW,
        valClientW: afterResize.valClientW,
        valScrollW: afterResize.valScrollW,
      })
    );

    // Restore editor size and test model-chip anchor cascade near left viewport edge
    const afterModelChipAnchor = await evalInPage(`(async function() {
      const ed = document.getElementById("PINHOLE_TEXT_AREA_ELEMENT_ID");
      const comp = document.getElementById("flow-composer");
      const mChip = document.getElementById("flow-model-chip");
      // Move model chip out as standalone bottom-left bar element and hide editor/composer
      document.body.appendChild(mChip);
      mChip.style.position = "fixed";
      mChip.style.left = "20px";
      mChip.style.bottom = "36px";
      ed.style.display = "none";
      comp.style.display = "none";
      await new Promise(r => setTimeout(r, 320));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      const exportFn = window.__gmMenu["📋 Flow Credits: Export Ledger"];
      const ledger = exportFn ? await exportFn() : null;
      return {
        anchor: ledger ? ledger.engine.anchor : null,
        chipRect: chip.getBoundingClientRect().toJSON(),
        modelChipRect: mChip.getBoundingClientRect().toJSON(),
      };
    })()`);

    assert(
      "8. (click, wait, get) model-chip anchor cascade + left-edge non-occlusion guard",
      afterModelChipAnchor.anchor === "model-chip" &&
        !boxesOverlap(afterModelChipAnchor.chipRect, afterModelChipAnchor.modelChipRect) &&
        afterModelChipAnchor.chipRect.left >= afterModelChipAnchor.modelChipRect.right + 8,
      `anchor=${afterModelChipAnchor.anchor}, chipLeft=${afterModelChipAnchor.chipRect.left}, modelRight=${afterModelChipAnchor.modelChipRect.right}`
    );

    // Step 4b: (wait, get) — v28.8.0 (WO-01 round 3) hide-when-needed
    // proof: with the model chip hidden too, NOTHING anchorable remains
    // on the page — the retired parked mode would have kept the chip
    // visible above the dock ("remains present overlayed on the grid at
    // times"); the no-occlusion contract HIDES it instead. Wait past the
    // 1s poll so the hide is proven on the engine's own cadence.
    const afterAllAnchorsGone = await evalInPage(`(async function() {
      const mChip = document.getElementById("flow-model-chip");
      mChip.style.display = "none";
      await new Promise(r => setTimeout(r, 1400));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      const exportFn = window.__gmMenu["\ud83d\udccb Flow Credits: Export Ledger"];
      const ledger = exportFn ? await exportFn() : null;
      return {
        hidden: chip.classList.contains("mp-credit-hidden"),
        parkedClass: chip.classList.contains("mp-credit-parked"),
        chipHiddenField: ledger ? ledger.engine.chipHidden : null,
        anchor: ledger ? ledger.engine.anchor : null,
      };
    })()`);

    assert(
      "8b. (wait, get) hide-when-needed: no anchor on page -> chip hidden (parked mode retired), export reports chipHidden=true",
      afterAllAnchorsGone.hidden === true &&
        afterAllAnchorsGone.parkedClass === false &&
        afterAllAnchorsGone.chipHiddenField === true,
      JSON.stringify(afterAllAnchorsGone)
    );

    // Step 5: Restore composer, trigger limit-notice toast, and verify wall charge + learned capTurns + reset reposition
    const afterLimitNotice = await evalInPage(`(async function() {
      const ed = document.getElementById("PINHOLE_TEXT_AREA_ELEMENT_ID");
      const comp = document.getElementById("flow-composer");
      const toolbar = document.getElementById("flow-toolbar");
      const mChip = document.getElementById("flow-model-chip");
      mChip.style.position = "";
      mChip.style.left = "";
      mChip.style.bottom = "";
      mChip.style.display = "";
      toolbar.insertBefore(mChip, toolbar.firstChild);
      comp.style.display = "flex";
      ed.style.display = "block";
      ed.style.width = "720px";
      ed.style.height = "56px";
      await new Promise(r => setTimeout(r, 320));

      // Inject limit notice toast
      const toastHost = document.getElementById("toast-host");
      const alertEl = document.createElement("div");
      alertEl.setAttribute("role", "alert");
      alertEl.style.width = "360px";
      alertEl.style.height = "48px";
      alertEl.textContent = "Daily limit reached for Nano Banana Pro. Will not reset until 11:30 PM.";
      toastHost.appendChild(alertEl);

      await new Promise(r => setTimeout(r, 350));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const chip = document.getElementById("pm-flow-credit-chip");
      const modelEl = chip.querySelector(".mp-credit-model");
      const fillEl = chip.querySelector(".mp-credit-pool-fill");
      const exportFn = window.__gmMenu["📋 Flow Credits: Export Ledger"];
      const ledger = exportFn ? await exportFn() : null;
      return {
        modelText: modelEl.textContent,
        hasZeroClass: modelEl.classList.contains("mp-credit-zero"),
        poolFillWidth: fillEl.style.width,
        integrityFails: ledger ? ledger.integrity.fails.length : -1,
        integrityTotal: ledger ? ledger.integrity.n : 0,
        limitNoticeModel: ledger && ledger.session.limitNotice ? ledger.session.limitNotice.model : null,
      };
    })()`);

    assert(
      "9. (click, wait, get) limit-notice wall charge -> Pro · 0/50 turns left · at the limit, 0% pool bar, 7/7 integrity",
      afterLimitNotice.modelText === "Pro · 0/50 turns left · at the limit" &&
        afterLimitNotice.hasZeroClass === true &&
        afterLimitNotice.poolFillWidth === "0%" &&
        afterLimitNotice.integrityFails === 0 &&
        afterLimitNotice.integrityTotal === 7 &&
        afterLimitNotice.limitNoticeModel === "pro",
      JSON.stringify(afterLimitNotice)
    );

    // Step 6: Test canon kernel-less parity in live Chromium
    mode = "canon";
    await cdp.send("Page.reload", { ignoreCache: true });
    const canonState = await evalInPage(`(async function() {
      for (let i = 0; i < 50; i++) {
        const chip = document.getElementById("pm-flow-credit-chip");
        if (chip && chip.querySelector(".mp-credit-model") && chip.querySelector(".mp-credit-model").textContent !== "—") {
          break;
        }
        await new Promise(r => setTimeout(r, 50));
      }
      const chip = document.getElementById("pm-flow-credit-chip");
      const exportFn = window.__gmMenu["📋 Flow Credits: Export Ledger"];
      const ledger = exportFn ? await exportFn() : null;
      return {
        modelText: chip ? chip.querySelector(".mp-credit-model").textContent : "",
        netObserver: ledger ? ledger.engine.netObserver : "",
        integrityFails: ledger ? ledger.integrity.fails.length : -1,
      };
    })()`);

    assert(
      "10. canon kernel-less live Chromium parity (renders NB2 · 200/200 turns left, netObserver=kernel-less)",
      canonState.modelText === "NB2 · 200/200 turns left" &&
        canonState.netObserver === "kernel-less" &&
        canonState.integrityFails === 0,
      JSON.stringify(canonState)
    );

    // Step 7: Red Control — synthetic overlapping boxes must be caught by boxesOverlap
    const syntheticOverlap = boxesOverlap(
      { left: 8, top: 720, right: 240, bottom: 742 },
      { left: 20, top: 716, right: 180, bottom: 748 }
    );
    assert(
      "11. red-control: synthetic left-edge model-chip collision is detected and rejected",
      syntheticOverlap === true,
      `overlapDetected=${syntheticOverlap}`
    );
  } finally {
    if (cdp) cdp.close();
    if (browser) {
      try {
        browser.kill("SIGKILL");
      } catch (_) {}
    }
    if (server) {
      try {
        server.close();
      } catch (_) {}
    }
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (_) {}
  }

  const failed = checks.filter((c) => !c.pass);
  return {
    passed: checks.length - failed.length,
    total: checks.length,
    clean: failed.length === 0,
    /* WO-01 round-3 (3-a F12): the live run discloses its mode — dist +
     * canon-parity reload (validate.mjs prints it; a structural fallback
     * must never present as live browser proof). */
    mode: "dist+canon",
    checks,
    failed,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runFlowChipBrowserBattery()
    .then((res) => {
      for (const c of res.checks) {
        console.log(`  ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      }
      console.log(
        `\nFlow Chip Browser Proof-of-Possession Battery: ${res.passed}/${res.total} passed`
      );
      if (!res.clean) process.exit(1);
    })
    .catch((err) => {
      console.error("Flow Chip Browser Battery Error:", err);
      process.exit(1);
    });
}
