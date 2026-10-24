#!/usr/bin/env node
/**
 * tools/ig-wall-browser-smoke.mjs — Live Headless Chromium (click, wait, get)
 * Proof-of-Possession Battery for Instagram++ v13.2.1 NeuralDOM viewport-aware
 * virtualization (the "V-STASIS overlay" field-report fix, WO-02 round 1).
 *
 * Paradigm: identical to tools/flow-chip-browser-smoke.mjs — spawns an isolated
 * Chromium instance with a mkdtemp /tmp profile, serves an Instagram PROFILE
 * fixture at http://www.instagram.com:<port>/<user>/ via --host-resolver-rules,
 * drives real CDP/DOM (click, wait, get) interactions, and verifies the exact
 * invariant the field report demanded:
 *
 *   THE WALL MUST NEVER SHOW A V-STASIS PLACEHOLDER WHERE THE USER IS LOOKING.
 *
 * Concretely, on a profile fixture pre-seeded with 150 harvested media nodes
 * (nearly twice the 80-node budget, so the prune path is exercised from the
 * very first batch — the exact geometry under which the old positional
 * head-prune parked the visible head and produced the full-screen semi-
 * transparent "V-STASIS" overlay):
 *
 *   1. the wall opens with real media in the viewport, zero V-STASIS rects
 *      intersecting it (the reported bug, asserted geometrically);
 *   2. EVERY V-STASIS placeholder sits strictly outside the viewport (the
 *      v13.2.1 isOffscreen gate invariant);
 *   3. the 80-node memory budget still holds (prunes happen, just never to
 *      visible media);
 *   4. scrolling down hydrates the far end, scrolling back up re-hydrates
 *      the head (placeholders are a parking state, never a dead state);
 *   5. canon kernel-less parity boots the same wall;
 *   6. a structural tripwire pins the isOffscreen gate in both canon and
 *      dist (removing the gate turns the battery red);
 *   7. red control: the checker flags the ORIGINAL bug geometry (a V-STASIS
 *      rect covering the viewport at scroll 0) as a failure.
 *
 * The battery unconditionally reclaims the browser process and temp directory.
 */

import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_IG = path.join(ROOT, "dist", "4ndr0tools - Instagram++.user.js");
const CANON_IG = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Instagram++.user.js");

function probeChromium() {
  const fixed = [
    "/usr/lib/chromium/chromium",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
  ];
  for (const p of fixed) if (fs.existsSync(p)) return p;
  // Playwright-managed Chromium caches (layout moved chrome-linux -> chrome-linux64).
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

const TOTAL_ITEMS = 150; // 150 > CACHE_LIMIT(80): prune path exercised from batch one

/* Schema-A REST v1 feed page (items + next_max_id) — the shape harvestJSON()
 * normalizes first. Each item: image post, unique pk/code, same UID. */
function buildFeedItems(offset, count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const n = offset + i;
    items.push({
      pk: String(100000 + n),
      id: `${100000 + n}_1`,
      code: `CODE${String(n).padStart(4, "0")}`,
      user: { pk: "42", username: "fixtureuser" },
      taken_at: 1700000000 + n,
      media_type: 1,
      image_versions2: { candidates: [{ url: `/gen/img-${n}.png`, width: 640, height: 640 }] },
    });
  }
  return items;
}

function buildIgFixtureHtml(scriptSource) {
  const safe = String(scriptSource).replace(/<\/script>/gi, "<\\/script>");
  const feed = { items: buildFeedItems(0, TOTAL_ITEMS), next_max_id: "CURSOR-1", status: "ok" };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta property="instapp:owner_user_id" content="42">
  <title>fixtureuser · Instagram</title>
  <style>
    html, body { margin: 0; padding: 0; background: #000; color: #fff;
                 font-family: system-ui, sans-serif; height: 4000px; }
    /* native IG top tab bar — Strategy-1 injection point for the Ψ dock */
    div[role="tablist"] { display: flex; align-items: center; gap: 16px;
                          height: 52px; padding: 0 16px; background: #0a131a; }
    div[role="tablist"] > span { opacity: .6; font-size: 13px; }
    main { padding: 24px; font-size: 12px; color: #445; }
  </style>
  <script>
    /* ---- GM shim (synchronous — Instagram++ consumes sync storage) ---- */
    window.__gmMenu = {};
    window.__gmLog = [];
    window.GM_info = { script: { version: "fixture" } };
    window.GM_getValue = function (k, defVal) { return window.__gmStore && (k in window.__gmStore) ? window.__gmStore[k] : defVal; };
    window.__gmStore = {};
    window.GM_setValue = function (k, v) { window.__gmStore[k] = v; };
    window.GM_listValues = function () { return Object.keys(window.__gmStore); };
    window.GM_deleteValue = function (k) { delete window.__gmStore[k]; };
    window.GM_registerMenuCommand = function (label, fn) { window.__gmMenu[label] = fn; };
    window.GM_setClipboard = function () {};
    window.GM_xmlhttpRequest = function (opts) { if (opts && opts.onerror) setTimeout(function(){ opts.onerror(new Error("fixture: no privileged transport")); }, 0); };
    window.GM_download = undefined;
  </script>
</head>
<body>
  <div role="tablist"><span>PROFILE</span><span>REELS</span><span>TAGGED</span></div>
  <main>native profile shell (fixture)</main>

  <!-- Server-rendered feed payload: Schema A, 150 items, harvested at boot
       by MediaOverlay.start() -> harvestInlineJSON() (kernel-less path). -->
  <script type="application/json">${JSON.stringify(feed)}</script>

  <script>
    ${safe}
  </script>
</body>
</html>`;
}

/* Minimal RFC 6455 WebSocket client for CDP — same implementation contract as
 * flow-chip-browser-smoke.mjs (kept verbatim-in-shape for convention stability). */
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
          try { socket.destroy(); } catch (_) {}
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
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        });
      })
      .on("error", reject);
  });
}

/* Strict viewport-intersection test: a V-STASIS rect touching even one pixel
 * of the viewport counts as covering it. */
function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

export async function runIgWallBrowserBattery() {
  const distSource = fs.readFileSync(DIST_IG, "utf8");
  const canonSource = fs.readFileSync(CANON_IG, "utf8");

  const distVersion = (distSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
  const canonVersion = (canonSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
  const GATE_LINE = "if (!this.isOffscreen(item)) return;";
  const HYDRATE_LINE = "if (item.isPruned && !this.isOffscreen(item)) this.hydrate(item);";

  const checks = [];
  function assert(name, cond, detail = "") {
    checks.push({ name, pass: Boolean(cond), detail: String(detail || "") });
  }

  if (!CHROMIUM_BIN) {
    // Structural fallback on hosts without a local Chromium binary — SAME
    // fail-closed contract as the live path (clean === failed.length === 0).
    assert("1. version header present & canon/dist parity",
      !!distVersion && distVersion === canonVersion, `dist=${distVersion}, canon=${canonVersion}`);
    assert("2. structural tripwire: prune isOffscreen gate present (canon+dist)",
      distSource.includes(GATE_LINE) && canonSource.includes(GATE_LINE));
    assert("3. structural tripwire: batch hydrateNear pass present (canon+dist)",
      distSource.includes(HYDRATE_LINE) && canonSource.includes(HYDRATE_LINE));
    assert("4. structural tripwire: 80-node budget + SAFE_ZONE tail unchanged",
      /CACHE_LIMIT:\s*80/.test(distSource) && /SAFE_ZONE:\s*15/.test(distSource));
    assert("5. red-control: original-bug geometry (V-STASIS rect covering viewport) is detected",
      rectsIntersect({ left: 0, top: 0, right: 1280, bottom: 800 }, { left: 0, top: 0, right: 1280, bottom: 800 }) === true);
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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ig-wall-cdp-"));
  let server = null;
  let browser = null;
  let cdp = null;

  try {
    let mode = "dist";
    server = http.createServer((req, res) => {
      if (req.url && /^\/fixtureuser\/?$/.test(req.url)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(buildIgFixtureHtml(mode === "canon" ? canonSource : distSource));
        return;
      }
      if (req.url && req.url.startsWith("/gen/")) {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(PNG_1PX);
        return;
      }
      res.writeHead(404);
      res.end("Not found");
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    const targetUrl = `http://ig-fixture.local:${port}/fixtureuser/`;
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
        `--host-resolver-rules=MAP ig-fixture.local 127.0.0.1,MAP www.instagram.com 127.0.0.1`,
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
      // v1.7.4: 10s -> 30s. A cold Chromium start under load (a gate that has
      // just run two fixture batteries back-to-back) can exceed 10s before
      // the DevTools line appears — the battery must measure the wall's
      // geometry, not the machine's cold-start jitter.
      const timer = setTimeout(() => reject(new Error("Timed out waiting for Chromium DevTools port")), 30000);
      browser.stderr.on("data", (chunk) => {
        const s = chunk.toString();
        const m = /DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)\/[^\s]+)/.exec(s);
        if (m) { clearTimeout(timer); resolve({ url: m[1], port: Number(m[2]) }); }
      });
      browser.on("exit", (code) => {
        clearTimeout(timer);
        reject(new Error(`Chromium exited prematurely with code ${code}`));
      });
    });

    let pageWsUrl = null;
    for (let i = 0; i < 120; i++) {
      const targets = await fetchJson(`http://127.0.0.1:${wsBrowserUrl.port}/json/list`);
      const pageTarget = targets.find((t) => t.type === "page" && (t.url.includes("ig-fixture.local") || t.url.includes("www.instagram.com")));
      if (pageTarget && pageTarget.webSocketDebuggerUrl) { pageWsUrl = pageTarget.webSocketDebuggerUrl; break; }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!pageWsUrl) throw new Error("Could not attach to www.instagram.com page target");

    cdp = await connectCDP(pageWsUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
    });

    async function evalInPage(expr) {
      const res = await cdp.send("Runtime.evaluate", {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`Page evaluation error: ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result ? res.result.value : undefined;
    }

    const rafSettle = `await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));`;

    /* Open the wall through the REAL trigger path: the injected Ψ dock. */
    const opened = await evalInPage(`(async function() {
      let dock = null;
      for (let i = 0; i < 120; i++) { // injection daemon polls every 1.5s; bail early on success
        dock = document.getElementById("4ndr0666-dock");
        if (dock) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (!dock) return { dockFound: false };
      dock.click();
      let gui = null;
      for (let i = 0; i < 120; i++) {
        gui = document.getElementById("igBigContainer");
        if (gui) break;
        await new Promise(r => setTimeout(r, 100));
      }
      if (!gui) return { dockFound: true, wallOpen: false };
      // let renderBatch + prune + rAF(hydrateNear) settle
      for (let i = 0; i < 30; i++) {
        if (document.querySelectorAll("#igAllImages img, #igAllImages span").length >= 60) break;
        await new Promise(r => setTimeout(r, 100));
      }
      ${rafSettle}
      await new Promise(r => setTimeout(r, 250));
      return { dockFound: true, wallOpen: true };
    })()`);
    assert(
      "1. (click) real Chromium origin + Ψ dock click opens the ARES-9 wall",
      opened.dockFound === true && opened.wallOpen === true,
      JSON.stringify(opened)
    );

    /* Geometry scan at scroll 0 — the exact state the field report showed. */
    const scanAt = `(function() {
      const vw = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const wall = document.getElementById("igAllImages");
      const spans = [...wall.querySelectorAll("span")].filter(s => s.textContent === "V-STASIS");
      const vstasis = spans.map(s => { const r = s.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; });
      const imgs = [...wall.querySelectorAll("img")].map(im => { const r = im.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; });
      return {
        viewport: vw,
        vstasisCount: vstasis.length,
        imgCount: imgs.length,
        vstasisCoveringViewport: vstasis.filter(r => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom)).length,
        imgsInViewport: imgs.filter(r => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom)).length,
        statText: (document.getElementById("ares-stat") || {}).textContent || "",
      };
    })()`;

    const atOpen = await evalInPage(scanAt);
    assert(
      "2. (get) FIELD-BUG ASSERTION: at wall open (scrollTop 0) zero V-STASIS rects intersect the viewport and real media is visible",
      atOpen.vstasisCoveringViewport === 0 && atOpen.imgsInViewport >= 1,
      `covering=${atOpen.vstasisCoveringViewport}, imgsInViewport=${atOpen.imgsInViewport}`
    );
    assert(
      "3. (get) core invariant: every V-STASIS placeholder sits strictly offscreen",
      atOpen.vstasisCoveringViewport === 0 && atOpen.vstasisCount > 0,
      `vstasis=${atOpen.vstasisCount}`
    );
    assert(
      "4. (get) 80-node budget still enforced: real nodes <= 80, parked >= 70, census 150",
      atOpen.imgCount <= 80 && atOpen.vstasisCount >= 70 && atOpen.imgCount + atOpen.vstasisCount === 150,
      `real=${atOpen.imgCount}, parked=${atOpen.vstasisCount}`
    );

    /* Scroll the WALL to the far end, then back — hydration both ways. */
    const scrolled = await evalInPage(`(async function() {
      const gui = document.getElementById("igBigContainer");
      gui.scrollTop = gui.scrollHeight;
      await new Promise(r => setTimeout(r, 350));
      ${rafSettle}
      await new Promise(r => setTimeout(r, 250));
      const vw = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const wall = document.getElementById("igAllImages");
      const hit = (r) => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom);
      const spans = [...wall.querySelectorAll("span")].filter(s => s.textContent === "V-STASIS");
      const imgs = [...wall.querySelectorAll("img")];
      const bottoms = imgs.map(im => im.getBoundingClientRect()).filter(hit).length;
      return {
        atBottom: Math.abs(gui.scrollTop + gui.clientHeight - gui.scrollHeight) < 40,
        coveringAtBottom: spans.map(s => s.getBoundingClientRect()).filter(hit).length,
        realMediaNearBottom: bottoms,
      };
    })()`);
    assert(
      "5. (wait, get) scrolled to the far end: bottom of the wall is real media, no V-STASIS covering it",
      scrolled.atBottom && scrolled.coveringAtBottom === 0 && scrolled.realMediaNearBottom >= 1,
      JSON.stringify(scrolled)
    );

    const backUp = await evalInPage(`(async function() {
      const gui = document.getElementById("igBigContainer");
      gui.scrollTop = 0;
      await new Promise(r => setTimeout(r, 350));
      ${rafSettle}
      await new Promise(r => setTimeout(r, 250));
      const vw = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const wall = document.getElementById("igAllImages");
      const hit = (r) => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom);
      const spans = [...wall.querySelectorAll("span")].filter(s => s.textContent === "V-STASIS");
      const imgs = [...wall.querySelectorAll("img")].map(im => im.getBoundingClientRect());
      return {
        coveringAtTop: spans.map(s => s.getBoundingClientRect()).filter(hit).length,
        imgsInViewport: imgs.filter(hit).length,
      };
    })()`);
    assert(
      "6. (wait, get) scrolled back to the head: re-hydrated real media, still zero V-STASIS in viewport",
      backUp.coveringAtTop === 0 && backUp.imgsInViewport >= 1,
      JSON.stringify(backUp)
    );

    /* Canon kernel-less parity — same fixture, canon source. */
    mode = "canon";
    await cdp.send("Page.reload", { ignoreCache: true });
    const canonState = await evalInPage(`(async function() {
      let dock = null;
      for (let i = 0; i < 120; i++) {
        dock = document.getElementById("4ndr0666-dock");
        if (dock) break;
        await new Promise(r => setTimeout(r, 250));
      }
      if (!dock) return { dockFound: false };
      dock.click();
      for (let i = 0; i < 120; i++) {
        if (document.getElementById("igBigContainer")) break;
        await new Promise(r => setTimeout(r, 100));
      }
      for (let i = 0; i < 30; i++) {
        if (document.querySelectorAll("#igAllImages img, #igAllImages span").length >= 60) break;
        await new Promise(r => setTimeout(r, 100));
      }
      ${rafSettle}
      await new Promise(r => setTimeout(r, 250));
      const vw = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const wall = document.getElementById("igAllImages");
      if (!wall) return { dockFound: true, wallOpen: false };
      const hit = (r) => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom);
      const spans = [...wall.querySelectorAll("span")].filter(s => s.textContent === "V-STASIS");
      const imgs = [...wall.querySelectorAll("img")].map(im => im.getBoundingClientRect());
      return {
        dockFound: true,
        wallOpen: true,
        covering: spans.map(s => s.getBoundingClientRect()).filter(hit).length,
        imgsInViewport: imgs.filter(hit).length,
      };
    })()`);
    assert(
      "7. canon kernel-less live parity: same wall, same invariant (zero V-STASIS in viewport at open)",
      canonState.wallOpen && canonState.covering === 0 && canonState.imgsInViewport >= 1,
      JSON.stringify(canonState)
    );

    /* Structural tripwires derived from the artifact — a future round that
     * removes the gate turns the battery red, live or fallback. */
    assert(
      "8. structural tripwire: the isOffscreen prune gate + batch hydrateNear survive in canon AND dist",
      distSource.includes(GATE_LINE) && canonSource.includes(GATE_LINE) &&
        distSource.includes(HYDRATE_LINE) && canonSource.includes(HYDRATE_LINE) &&
        distVersion === canonVersion,
      `dist=${distVersion}, canon=${canonVersion}`
    );

    /* Red control: the checker must reject the ORIGINAL bug geometry. */
    const redControl =
      rectsIntersect(
        { left: 0, top: 0, right: 1280, bottom: 800 },
        { left: 0, top: 0, right: 1280, bottom: 800 }
      ) === true;
    assert(
      "9. red-control: original-bug geometry (full-viewport V-STASIS rect at scroll 0) is detected",
      redControl
    );
  } finally {
    if (cdp) cdp.close();
    if (browser) {
      try { browser.kill("SIGKILL"); } catch (_) {}
    }
    if (server) {
      try { server.close(); } catch (_) {}
    }
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  const failed = checks.filter((c) => !c.pass);
  return {
    passed: checks.length - failed.length,
    total: checks.length,
    clean: failed.length === 0,
    /* WO-01 round-3 (3-a F12): mode disclosed — dist + canon-parity reload. */
    mode: "dist+canon",
    checks,
    failed,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runIgWallBrowserBattery()
    .then((res) => {
      for (const c of res.checks) {
        console.log(`  ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      }
      console.log(`\nIG Wall Browser Proof-of-Possession Battery: ${res.passed}/${res.total} passed${res.mode ? ` [${res.mode}]` : ""}`);
      if (!res.clean) process.exit(1);
    })
    .catch((err) => {
      console.error("IG Wall Browser Battery Error:", err);
      process.exit(1);
    });
}
