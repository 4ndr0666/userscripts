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

const CHROMIUM_BIN = fs.existsSync("/usr/lib/chromium/chromium")
  ? "/usr/lib/chromium/chromium"
  : fs.existsSync("/usr/bin/chromium")
    ? "/usr/bin/chromium"
    : fs.existsSync("/usr/bin/google-chrome")
      ? "/usr/bin/google-chrome"
      : null;

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

function boxesOverlap(a, b) {
  return !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
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
      distSource.includes("sideBudget >= 140 ? Math.round(sideBudget) : vwMax"));
    assert("4. model-chip left/right/above non-occlusion guard present",
      distSource.includes("else if (r.right + 10 + w <= window.innerWidth - 8)") &&
      distSource.includes("y = r.top - h - 6 >= 8 ? r.top - h - 6 : r.bottom + 6"));
    assert("4b. editor/composer anchors ride ABOVE the text field (WO-02: chip never mounts inside the input rect)",
      distSource.includes("y = r.top - h - 6 >= 8 ? r.top - h - 6 : r.bottom + 6;") &&
      !distSource.includes("y = r.top + 7;") &&
      !/r\.height >= 160/.test(distSource),
      "above/below ladder shared with model-chip branch; inside-editor placements removed");
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
      const timer = setTimeout(
        () => reject(new Error("Timed out waiting for Chromium DevTools port")),
        10000
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
    for (let i = 0; i < 40; i++) {
      const targets = await fetchJson(`http://127.0.0.1:${wsBrowserUrl.port}/json/list`);
      const pageTarget = targets.find(
        (t) => t.type === "page" && t.url.includes("flow.google.com")
      );
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        pageWsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
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
      return {
        maxWidthStyle: chip.style.maxWidth,
        chipTop: Math.round(cr.top),
        chipBottom: Math.round(cr.bottom),
        editorTop: Math.round(er.top),
        editorBottom: Math.round(er.bottom),
        chipWidth: Math.round(cr.width),
        modelClientW: modelEl.clientWidth,
        modelScrollW: modelEl.scrollWidth,
        valClientW: valEl.clientWidth,
        valScrollW: valEl.scrollWidth,
      };
    })()`);

    // v28.7.5 (WO-02): the chip rides ABOVE the editor's top edge (its
    // bottom sits 6px clear of the editor top) — it may never intersect
    // the editor rect again (the "chip obstructs the input" field
    // report). ResizeObserver + rAF must still reposition within 120ms.
    assert(
      "6. (click, wait, get) ResizeObserver reposition: chip floats ABOVE the editor, zero overlap, within 120ms",
      Math.abs(afterResize.chipBottom - (afterResize.editorTop - 6)) <= 2 &&
        afterResize.chipBottom <= afterResize.editorTop,
      `chipBottom=${afterResize.chipBottom}, editorTop=${afterResize.editorTop}`
    );

    assert(
      "7. (click, wait, get) dynamic flexbox width clamping (210px editor -> maxWidth 194px, values unclipped)",
      afterResize.maxWidthStyle === "194px" &&
        afterResize.chipWidth <= 194 &&
        afterResize.valClientW === afterResize.valScrollW &&
        afterResize.valClientW > 0,
      JSON.stringify(afterResize)
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

    // Step 5: Restore composer, trigger limit-notice toast, and verify wall charge + learned capTurns + reset reposition
    const afterLimitNotice = await evalInPage(`(async function() {
      const ed = document.getElementById("PINHOLE_TEXT_AREA_ELEMENT_ID");
      const comp = document.getElementById("flow-composer");
      const toolbar = document.getElementById("flow-toolbar");
      const mChip = document.getElementById("flow-model-chip");
      mChip.style.position = "";
      mChip.style.left = "";
      mChip.style.bottom = "";
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
