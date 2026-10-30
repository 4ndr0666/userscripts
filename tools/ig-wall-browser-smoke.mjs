#!/usr/bin/env node
/**
 * tools/ig-wall-browser-smoke.mjs — Live Headless Chromium (click, wait, get)
 * Proof-of-Possession Battery for Instagram++ NeuralDOM viewport-aware
 * virtualization (the "V-STASIS overlay" field-report fix, WO-02 round 1)
 * AND the v13.2.4 NATIVE RETIREMENT VEIL (the "persistent center overlay
 * that scrolls like a live feed down the center and never hides" field
 * report, WO-01 round 12).
 *
 * Paradigm: identical to tools/flow-chip-browser-smoke.mjs — spawns an isolated
 * Chromium instance with a mkdtemp /tmp profile, serves an Instagram PROFILE
 * fixture at http://www.instagram.com:<port>/<user>/ via --host-resolver-rules,
 * drives real CDP/DOM (click, wait, get) interactions, and verifies the exact
 * invariants the field reports demanded:
 *
 *   THE WALL MUST NEVER SHOW A V-STASIS PLACEHOLDER WHERE THE USER IS LOOKING.
 *   THE NATIVE PAGE MUST NEVER GHOST THROUGH — OR DIE UNDER — THE WALL.
 *
 * Concretely, on a profile fixture pre-seeded with 150 harvested media nodes
 * (nearly twice the 80-node budget, so the prune path is exercised from the
 * very first batch — the exact geometry under which the old positional
 * head-prune parked the visible head and produced the full-screen semi-
 * transparent "V-STASIS" overlay) PLUS one video post and an adversarial
 * bright 12000px native center column with a genuinely PLAYING native
 * video (canvas-captured stream — no media file needed):
 *
 *   1. the wall opens with real media in the viewport, zero V-STASIS rects
 *      intersecting it (the reported bug, asserted geometrically);
 *   2. EVERY V-STASIS placeholder sits strictly outside the viewport (the
 *      v13.2.1 isOffscreen gate invariant);
 *   3. the 80-node memory budget still holds (prunes happen, just never to
 *      visible media);
 *   4. scrolling down hydrates the far end, scrolling back up re-hydrates
 *      the head (placeholders are a parking state, never a dead state);
 *   5. THE VEIL: the wall background computes OPAQUE rgb(10, 19, 26) — the
 *      0.85-alpha pane that let the native center column ghost through is
 *      gone (asserted against the live computed style);
 *   6. THE VEIL: #ares-veil exists and body computes visibility:hidden —
 *      the native column and the native video are retired from painting;
 *   7. GEOMETRY SURVIVES the veil (the anti-display:none tripwire): the
 *      native main/column rects keep real height, the document stays
 *      taller than the viewport — IG's own IO sentinels and lazy-load
 *      geometry live on under the veil;
 *   8. DRIVER VIABILITY under the veil: NativeScrollDriver still moves the
 *      real document scroll (scrollY > 0 after a tick) — the pagination
 *      heartbeat the veil must never kill;
 *   9. the pause rider is BODY-SCOPED: the genuinely-playing NATIVE video
 *      is paused by the rider while a genuinely-playing WALL video is
 *      never touched;
 *  10. a wall download badge under the veil delivers a REAL FILE to disk
 *      (the saveBlob anchor rides the hidden body — click() fires
 *      programmatically regardless of visibility);
 *  11. canon kernel-less parity boots the same wall with the same veil
 *      contract;
 *  12. structural tripwires pin the isOffscreen gate AND the veil tokens
 *      in both canon and dist (removing either turns the battery red);
 *  13. red control: a SABOTAGED source (the 0.85-alpha background restored
 *      + the veil inert) must reproduce the pre-fix red values the live
 *      assertions reject — the checker flags the ORIGINAL bug state; plus
 *      the geometric red control (a full-viewport V-STASIS rect at scroll 0).
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
const TOTAL_MEDIA = 151; // 150 image posts + 1 video post (the pause-rider target)

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
  /* One VIDEO post at the tail (SAFE_ZONE-protected, so it stays a live
   * <video> node in the wall): the pause-rider assertion needs a genuinely
   * playing WALL video that the body-scoped rider must never touch. */
  feed.items.push({
    pk: String(100000 + TOTAL_ITEMS),
    id: `${100000 + TOTAL_ITEMS}_1`,
    code: `CODE${String(TOTAL_ITEMS).padStart(4, "0")}`,
    user: { pk: "42", username: "fixtureuser" },
    taken_at: 1700000000 + TOTAL_ITEMS,
    media_type: 2,
    video_versions: [{ url: `/gen/img-${TOTAL_ITEMS}.png`, width: 640, height: 640, type: 101 }],
  });
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
    /* v13.2.4 veil fixture: the adversarial bright NATIVE CENTER COLUMN —
     * exactly the ghost the 0.85-alpha wall let through (it must read as
     * retired-from-painting under the veil, while its geometry survives). */
    #native-feed-column { width: 630px; height: 12000px; margin: 0 auto;
                          background: repeating-linear-gradient(180deg,
                          #ff0055 0 40px, #00E5FF 40px 80px); }
    #native-video { display: block; width: 320px; height: 180px;
                    margin: 12px auto; background: #111; }
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
  <main>native profile shell (fixture)
    <div id="native-feed-column">
      <video id="native-video" muted autoplay playsinline></video>
    </div>
  </main>

  <!-- Server-rendered feed payload: Schema A, 150 items, harvested at boot
       by MediaOverlay.start() -> harvestInlineJSON() (kernel-less path). -->
  <script type="application/json">${JSON.stringify(feed)}</script>

  <!-- The native feed video: a canvas-captured stream — GENUINELY PLAYING
       before the wall opens (no media file needed). The v13.2.4 pause rider
       must pause exactly this one and never the wall's own videos. -->
  <script>
    (function () {
      try {
        var c = document.createElement('canvas'); c.width = 8; c.height = 8;
        var x = c.getContext('2d'); x.fillStyle = '#ff0055'; x.fillRect(0, 0, 8, 8);
        var v = document.getElementById('native-video');
        v.srcObject = c.captureStream(10);
        var p = v.play(); if (p && p.catch) p.catch(function () {});
      } catch (e) { /* assertion 11 surfaces a never-playing video below */ }
    })();
  </script>

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
  /* v13.2.4 veil tripwires — removing any of these turns the battery red
   * (live or structural fallback): the opaque palette token, the veil
   * stylesheet injection, the visibility rule itself, the reload exit, and
   * the operator-directed header labels. */
  const VEIL_ID_LINE = "veil.id = 'ares-veil';";
  const VEIL_RULE_LINE = "veil.textContent = 'body { visibility: hidden !important; }';";
  const OPAQUE_BG_RE = /BG:\s*'rgb\(10,19,26\)'/;
  const RELOAD_EXIT_LINE = "window.location.reload();";
  const FEED_BTN_LINE = "mkBtn('ares-feed', 'SHOW FEED'";
  const DUMP_LABEL_LINE = "mkBtn('ares-dump', 'DUMP HTML'";
  const DLALL_LABEL_LINE = "mkBtn('ares-dlall', '⭳ SAVE ALL MEDIA'";
  /* v13.3.0 round-14 tripwires — removing any of these turns the battery
   * red (live or structural fallback): the grid wall statement (the r13
   * single-column default is the obstruction the operator reported), the
   * layout toggle, the wall snapshot (key + restore call), the sentinel
   * factoring, and the retired ghost-view state. */
  const GRID_WALL_STMT =
    "imgWall.style.cssText =\n            `padding:24px 24px 300px;display:grid;grid-template-columns:repeat(auto-fill,minmax(${CFG.GRID_MIN_PX}px,1fr));gap:14px;align-items:start;justify-items:center;`;";
  const FEED_WALL_STMT =
    "imgWall.style.cssText = 'padding:80px 0 300px;display:flex;flex-direction:column;align-items:center;';";
  const APPLY_LAYOUT_LINE = "function applyWallLayout(mode) {";
  const SNAPSHOT_KEY_LINE = "SNAPSHOT_KEY:        'igpp_wall_snapshot_v1',";
  const SNAPSHOT_RESTORE_LINE = "const seededPks = WallSnapshot.restore();";
  const ARM_SENTINEL_LINE = "function armSentinel(cursor) {";
  const VEILENGAGED_ABSENT =
    !/STATE\.veilEngaged/.test(distSource) && !/STATE\.veilEngaged/.test(canonSource);

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
    assert("6. structural tripwire: OPAQUE wall palette token (canon+dist)",
      OPAQUE_BG_RE.test(distSource) && OPAQUE_BG_RE.test(canonSource));
    assert("7. structural tripwire: #ares-veil injection + visibility rule + reload exit (canon+dist)",
      distSource.includes(VEIL_ID_LINE) && canonSource.includes(VEIL_ID_LINE) &&
        distSource.includes(VEIL_RULE_LINE) && canonSource.includes(VEIL_RULE_LINE) &&
        distSource.includes(RELOAD_EXIT_LINE) && canonSource.includes(RELOAD_EXIT_LINE));
    assert("8. structural tripwire: operator-directed header labels (canon+dist)",
      distSource.includes(FEED_BTN_LINE) && canonSource.includes(FEED_BTN_LINE) &&
        distSource.includes(DUMP_LABEL_LINE) && canonSource.includes(DUMP_LABEL_LINE) &&
        distSource.includes(DLALL_LABEL_LINE) && canonSource.includes(DLALL_LABEL_LINE));
    assert("8b. structural tripwire: the round-14 GRID WALL contract (canon+dist)",
      distSource.includes(GRID_WALL_STMT) && canonSource.includes(GRID_WALL_STMT) &&
        distSource.includes(APPLY_LAYOUT_LINE) && canonSource.includes(APPLY_LAYOUT_LINE) &&
        distSource.includes(SNAPSHOT_KEY_LINE) && canonSource.includes(SNAPSHOT_KEY_LINE) &&
        distSource.includes(SNAPSHOT_RESTORE_LINE) && canonSource.includes(SNAPSHOT_RESTORE_LINE) &&
        distSource.includes(ARM_SENTINEL_LINE) && canonSource.includes(ARM_SENTINEL_LINE) &&
        VEILENGAGED_ABSENT,
      `gridStmt=${distSource.includes(GRID_WALL_STMT)}/${canonSource.includes(GRID_WALL_STMT)}, applyLayout=${distSource.includes(APPLY_LAYOUT_LINE)}, snapKey=${distSource.includes(SNAPSHOT_KEY_LINE)}, restore=${distSource.includes(SNAPSHOT_RESTORE_LINE)}, sentinel=${distSource.includes(ARM_SENTINEL_LINE)}, veilEngagedAbsent=${VEILENGAGED_ABSENT}`);
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
    /* v13.2.4 sabotage red-control source: the pre-fix ghost state — the
     * 0.85-alpha pane restored + the veil rule emptied (inert). Derived from
     * the DIST source at battery start; served only for the final phase. */
    const sabotageSource = distSource
      .replace("BG:          'rgb(10,19,26)',", "BG:          'rgba(10,19,26,0.85)',")
      .replace("veil.textContent = 'body { visibility: hidden !important; }';", "veil.textContent = '';");
    /* v13.3.0 layout sabotage red-control source: the r13 SINGLE-COLUMN
     * default — the exact obstruction the operator reported (one centered
     * full-size media card at a time instead of the grid wall). Both the
     * wall statement AND the card layout default revert; the snapshot and
     * everything else stays live so the revert is isolated to the layout. */
    const sabotageLayoutSource = distSource
      .replace(GRID_WALL_STMT, FEED_WALL_STMT)
      .replace("wallLayout:     'grid',", "wallLayout:     'feed',");
    server = http.createServer((req, res) => {
      if (req.url && /^\/fixtureuser\/?$/.test(req.url)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        const source = mode === "canon" ? canonSource : (mode === "sabotage" ? sabotageSource : (mode === "sabotage-layout" ? sabotageLayoutSource : distSource));
        res.end(buildIgFixtureHtml(source));
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

    /* ── v13.2.4 THE NATIVE RETIREMENT VEIL — live assertions ─────────────── */

    const veilState = await evalInPage(`(function() {
      const gui = document.getElementById('igBigContainer');
      const veil = document.getElementById('ares-veil');
      const nativeCol = document.getElementById('native-feed-column');
      const main = document.querySelector('main');
      return {
        wallBg: gui ? getComputedStyle(gui).backgroundColor : null,
        veilPresent: !!veil,
        bodyVisibility: getComputedStyle(document.body).visibility,
        mainVisibility: main ? getComputedStyle(main).visibility : null,
        mainRectHeight: main ? main.getBoundingClientRect().height : 0,
        nativeColRectHeight: nativeCol ? nativeCol.getBoundingClientRect().height : 0,
        docTallerThanViewport: document.documentElement.scrollHeight > window.innerHeight,
      };
    })()`);
    assert(
      "7. (get) VEIL: the wall computes OPAQUE rgb(10,19,26) — the 0.85-alpha pane that ghosted the native feed is gone",
      veilState.wallBg === "rgb(10, 19, 26)",
      JSON.stringify(veilState.wallBg)
    );
    assert(
      "8. (get) VEIL: #ares-veil live and body retired from painting (the native center column + sidebars no longer ghost through)",
      veilState.veilPresent === true && veilState.bodyVisibility === "hidden" && veilState.mainVisibility === "hidden",
      JSON.stringify({ veil: veilState.veilPresent, body: veilState.bodyVisibility, main: veilState.mainVisibility })
    );
    assert(
      "9. (get) GEOMETRY SURVIVES the veil (the anti-display:none tripwire): native rects keep real height, document stays scrollable-tall",
      veilState.mainRectHeight > 0 && veilState.nativeColRectHeight > 0 && veilState.docTallerThanViewport === true,
      JSON.stringify({ mainH: veilState.mainRectHeight, colH: veilState.nativeColRectHeight, tall: veilState.docTallerThanViewport })
    );

    /* Driver viability + the body-scoped pause rider — needs >2 driver ticks
     * (1500 ms cadence) after the wall opened. */
    const driverState = await evalInPage(`(async function() {
      await new Promise(r => setTimeout(r, 3400));
      const native = document.getElementById('native-video');
      const wallVid = document.querySelector('#igAllImages video');
      let wallPlaying = false;
      if (wallVid) {
        try {
          const c = document.createElement('canvas'); c.width = 8; c.height = 8;
          const x = c.getContext('2d'); x.fillStyle = '#00E5FF'; x.fillRect(0, 0, 8, 8);
          wallVid.muted = true;
          wallVid.srcObject = c.captureStream(10);
          await wallVid.play().catch(function(){});
          wallPlaying = !wallVid.paused;
          await new Promise(r => setTimeout(r, 1700)); /* one more rider tick */
          wallPlaying = !wallVid.paused;
        } catch (e) { wallPlaying = false; }
      }
      return {
        scrollY: Math.round(window.scrollY),
        scrollHeight: document.documentElement.scrollHeight,
        nativeFound: !!native,
        nativePaused: native ? native.paused : null,
        wallOutsideBody: wallVid ? !document.body.contains(wallVid) : false,
        wallStillPlaying: wallPlaying,
      };
    })()`);
    assert(
      "10. (wait, get) DRIVER VIABILITY under the veil: NativeScrollDriver still moves the real document scroll",
      driverState.scrollY > 0 && driverState.scrollHeight > 800,
      JSON.stringify({ scrollY: driverState.scrollY, scrollHeight: driverState.scrollHeight })
    );
    assert(
      "11. (wait, get) PAUSE RIDER is body-scoped: the genuinely-playing NATIVE video is paused by the rider; the genuinely-playing WALL video is never touched (it lives outside body by construction)",
      driverState.nativeFound === true && driverState.nativePaused === true &&
        driverState.wallOutsideBody === true && driverState.wallStillPlaying === true,
      JSON.stringify(driverState)
    );

    /* Operator-directed header labels (round-12 + round-14 transmissions). */
    const labels = await evalInPage(`(function() {
      const dump = document.getElementById('ares-dump');
      const dlall = document.getElementById('ares-dlall');
      const feed = document.getElementById('ares-feed');
      return {
        dump: dump ? dump.textContent : null,
        dlall: dlall ? dlall.textContent : null,
        feed: feed ? feed.textContent : null,
      };
    })()`);
    assert(
      "12. (get) HEADER LABELS: the whole-grid artifact is DUMP HTML (the r14 directive — the truthful name back); the media-file downloader is ⭳ SAVE ALL MEDIA; the layout toggle is SHOW FEED (grid default)",
      labels.dump === "DUMP HTML" && labels.dlall === "⭳ SAVE ALL MEDIA" && labels.feed === "SHOW FEED",
      JSON.stringify(labels)
    );

    /* v13.3.0 THE LAYOUT TOGGLE — the operator's \"hide feed\" button aimed at
     * the wall's own layout: grid (default, the main function) ↔ the feed
     * column (the opt-in addition). The r12 veil-ghost view is retired: the
     * body stays retired and the wall stays opaque through the whole cycle. */
    const layoutToggle = await evalInPage(`(async function() {
      const btn = document.getElementById('ares-feed');
      if (!btn) return { found: false };
      const gui = document.getElementById('igBigContainer');
      const wall = document.getElementById('igAllImages');
      const snap = () => ({
        display: getComputedStyle(wall).display,
        flexDirection: getComputedStyle(wall).flexDirection,
        tracks: (getComputedStyle(wall).gridTemplateColumns || '').split(' ').filter(x => /px$/.test(x)).length,
        label: btn.textContent,
        bodyVisibility: getComputedStyle(document.body).visibility,
        wallBg: getComputedStyle(gui).backgroundColor,
      });
      const before = snap();
      btn.click();
      ${rafSettle}
      const feed = snap();
      btn.click();
      ${rafSettle}
      const restored = snap();
      return { found: true, before, feed, restored };
    })()`);
    assert(
      "13. (click, get) LAYOUT TOGGLE: default GRID (display:grid, multi-track, SHOW FEED) → FEED column (flex+column, HIDE FEED) → GRID restored — and the veil never lifts through the cycle",
      layoutToggle.found === true &&
        layoutToggle.before.display === "grid" && layoutToggle.before.tracks >= 4 && layoutToggle.before.label === "SHOW FEED" &&
        layoutToggle.feed.display === "flex" && layoutToggle.feed.flexDirection === "column" && layoutToggle.feed.label === "HIDE FEED" &&
        layoutToggle.restored.display === "grid" && layoutToggle.restored.tracks >= 4 && layoutToggle.restored.label === "SHOW FEED" &&
        layoutToggle.before.bodyVisibility === "hidden" && layoutToggle.feed.bodyVisibility === "hidden" && layoutToggle.restored.bodyVisibility === "hidden" &&
        layoutToggle.before.wallBg === "rgb(10, 19, 26)" && layoutToggle.feed.wallBg === "rgb(10, 19, 26)" && layoutToggle.restored.wallBg === "rgb(10, 19, 26)",
      JSON.stringify(layoutToggle)
    );

    /* v13.3.0 THE GRID FILLS THE WALL — the lineage contract's geometry:
     * multiple cards per row, edge-to-edge. The r13 single centered column
     * is exactly what this rejects. */
    const gridGeometry = await evalInPage(`(function() {
      const wall = document.getElementById('igAllImages');
      const cards = [...wall.querySelectorAll('[data-ares-card]')];
      const rects = cards.slice(0, 12).map(c => c.getBoundingClientRect());
      const rowTop = rects.length ? rects[0].top : -1;
      const sameRow = rects.filter(r => Math.abs(r.top - rowTop) < 40).length;
      const lefts = rects.map(r => r.left), rights = rects.map(r => r.right);
      return {
        cardCount: cards.length,
        leftmost: lefts.length ? Math.min(...lefts) : null,
        rightmost: rights.length ? Math.max(...rights) : null,
        firstRowCards: sameRow,
        vw: window.innerWidth,
      };
    })()`);
    assert(
      "13b. (get) THE GRID FILLS THE WALL: multiple cards per row, edge-to-edge — the single centered column is NOT the default",
      gridGeometry.cardCount >= 8 && gridGeometry.firstRowCards >= 3 &&
        gridGeometry.leftmost !== null && gridGeometry.leftmost < 80 &&
        gridGeometry.rightmost !== null && gridGeometry.rightmost > 1200,
      JSON.stringify(gridGeometry)
    );

    /* v13.3.0 THE WALL SNAPSHOT — write path: scroll past the lineage's
     * \"certain distance\", the debounced patch stores the precise position
     * alongside the offloaded catalog. */
    const snapWrite = await evalInPage(`(async function() {
      const gui = document.getElementById('igBigContainer');
      gui.scrollTop = 4000;
      await new Promise(r => setTimeout(r, 1100));
      ${rafSettle}
      let rec = null;
      try { rec = JSON.parse(localStorage.getItem('igpp_wall_snapshot_v1') || 'null'); } catch (e) { rec = null; }
      return {
        scrollTop: Math.round(gui.scrollTop),
        stored: !!rec,
        kids: rec && Array.isArray(rec.kids) ? rec.kids.length : 0,
        storedScroll: rec ? Math.round(rec.scrollTop || 0) : null,
        loc: rec ? rec.loc : null,
        path: location.pathname,
      };
    })()`);
    assert(
      "14. (get) WALL SNAPSHOT WRITE: scrolling past the threshold offloads the catalog + the precise scroll position (the lineage contract)",
      snapWrite.scrollTop >= 3900 && snapWrite.stored === true && snapWrite.kids >= 100 &&
        snapWrite.storedScroll >= 3900 && snapWrite.loc === snapWrite.path,
      JSON.stringify(snapWrite)
    );

    /* v13.3.0 THE WALL SNAPSHOT — restore path: a reload (the accidental-
     * navigation case) reopens the wall AT THE SNAPSHOT POSITION, instantly,
     * with the seeded catalog and zero duplicates. */
    await cdp.send("Page.reload", { ignoreCache: true });
    const snapRestore = await evalInPage(`(async function() {
      let dock = null;
      for (let i = 0; i < 120; i++) {
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
      await new Promise(r => setTimeout(r, 900));
      ${rafSettle}
      await new Promise(r => setTimeout(r, 400));
      const wall = document.getElementById('igAllImages');
      const vw = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
      const hit = (r) => !(r.right <= vw.left || r.left >= vw.right || r.bottom <= vw.top || r.top >= vw.bottom);
      const spans = [...wall.querySelectorAll("span")].filter(s => s.textContent === "V-STASIS");
      const imgs = [...wall.querySelectorAll("img")];
      let rec = null;
      try { rec = JSON.parse(localStorage.getItem('igpp_wall_snapshot_v1') || 'null'); } catch (e) { rec = null; }
      return {
        dockFound: true, wallOpen: true,
        scrollTop: Math.round(gui.scrollTop),
        cards: wall.querySelectorAll('[data-ares-card]').length,
        vstasisCovering: spans.map(s => s.getBoundingClientRect()).filter(hit).length,
        imgsInViewport: imgs.map(im => im.getBoundingClientRect()).filter(hit).length,
        storedKids: rec && Array.isArray(rec.kids) ? rec.kids.length : 0,
      };
    })()`);
    assert(
      "15. (reload, click, get) WALL SNAPSHOT RESTORE: after a reload the wall reopens AT THE SNAPSHOT POSITION — seeded catalog, restored scroll, hydrated viewport, zero duplicates",
      snapRestore.wallOpen === true && snapRestore.scrollTop >= 3000 &&
        snapRestore.cards >= 60 && snapRestore.vstasisCovering === 0 &&
        snapRestore.imgsInViewport >= 1 && snapRestore.storedKids >= 100,
      JSON.stringify(snapRestore)
    );

    /* Real-file downloads under the veil: a wall badge AND the data-driven
     * grid artifact. CDP download behavior + a real click on each control. */
    const dlDir = path.join(tmpDir, "dl");
    fs.mkdirSync(dlDir, { recursive: true });
    try {
      await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    } catch (_) {
      await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
    }
    async function waitForDownload(predicate, timeoutMs) {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const files = fs.existsSync(dlDir) ? fs.readdirSync(dlDir) : [];
        const hit = files.find(predicate);
        if (hit) return path.join(dlDir, hit);
        await new Promise(r => setTimeout(r, 250));
      }
      return null;
    }
    await evalInPage(`(async function() {
      const badge = document.querySelector('#igAllImages .ares-dl-badge');
      if (!badge) return false;
      badge.click();
      return true;
    })()`);
    const badgeFile = await waitForDownload(f => /^42_CODE\d+_1of1\.(jpg|png)$/.test(f), 20000);
    assert(
      "16. (click, wait) a wall download badge under the veil delivers a REAL FILE to disk (saveBlob anchor rides the hidden body)",
      !!badgeFile,
      badgeFile || "no file matched ^42_CODE\\d+_1of1\\.(jpg|png)$ within 20s"
    );
    await evalInPage("document.getElementById('ares-dump').click();");
    const dumpFile = await waitForDownload(f => /^4ndr0666_dump_42\.html$/.test(f), 20000);
    let dumpCells = 0;
    let dumpPlaceholders = 0;
    if (dumpFile) {
      const dumpText = fs.readFileSync(dumpFile, "utf8");
      dumpCells = (dumpText.match(/<div class="cell">/g) || []).length;
      dumpPlaceholders = (dumpText.match(/V-STASIS/g) || []).length;
    }
    assert(
      "17. (click, wait, get) DUMP HTML delivers the DATA-DRIVEN grid artifact: every known media item, zero V-STASIS placeholders",
      !!dumpFile && dumpCells >= 100 && dumpPlaceholders === 0,
      dumpFile ? `cells=${dumpCells}, placeholders=${dumpPlaceholders}` : "no 4ndr0666_dump_42.html within 20s"
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
        wallBg: getComputedStyle(document.getElementById("igBigContainer")).backgroundColor,
        wallDisplay: wall ? getComputedStyle(wall).display : null,
        bodyVisibility: getComputedStyle(document.body).visibility,
        mainRectHeight: (document.querySelector("main") || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height,
        feedLabel: (document.getElementById("ares-feed") || {}).textContent || null,
      };
    })()`);
    assert(
      "18. canon kernel-less live parity: same wall, same invariant, SAME VEIL + SAME GRID (zero V-STASIS in viewport; opaque wall; body retired; geometry alive; display:grid)",
      canonState.wallOpen && canonState.covering === 0 && canonState.imgsInViewport >= 1 &&
        canonState.wallBg === "rgb(10, 19, 26)" && canonState.bodyVisibility === "hidden" &&
        canonState.wallDisplay === "grid" &&
        canonState.mainRectHeight > 0 && canonState.feedLabel === "SHOW FEED",
      JSON.stringify(canonState)
    );

    /* Structural tripwires derived from the artifact — a future round that
     * removes the gate turns the battery red, live or fallback. */
    assert(
      "19. structural tripwire: the isOffscreen prune gate + batch hydrateNear + the veil tokens + the round-14 grid-wall tokens survive in canon AND dist",
      distSource.includes(GATE_LINE) && canonSource.includes(GATE_LINE) &&
        distSource.includes(HYDRATE_LINE) && canonSource.includes(HYDRATE_LINE) &&
        distSource.includes(VEIL_ID_LINE) && canonSource.includes(VEIL_ID_LINE) &&
        distSource.includes(VEIL_RULE_LINE) && canonSource.includes(VEIL_RULE_LINE) &&
        OPAQUE_BG_RE.test(distSource) && OPAQUE_BG_RE.test(canonSource) &&
        distSource.includes(RELOAD_EXIT_LINE) && canonSource.includes(RELOAD_EXIT_LINE) &&
        distSource.includes(GRID_WALL_STMT) && canonSource.includes(GRID_WALL_STMT) &&
        distSource.includes(SNAPSHOT_KEY_LINE) && canonSource.includes(SNAPSHOT_KEY_LINE) &&
        distSource.includes(DUMP_LABEL_LINE) && canonSource.includes(DUMP_LABEL_LINE) &&
        VEILENGAGED_ABSENT &&
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
      "20. red-control: original-bug geometry (full-viewport V-STASIS rect at scroll 0) is detected",
      redControl
    );

    /* v13.2.4 SABOTAGE RED CONTROL — the pre-fix ghost state must be exactly
     * what the new assertions reject: the CFG.BG restored to the 0.85-alpha
     * pane and the veil rule emptied (inert). This is the operator's field
     * report reconstructed on purpose: the native feed ghosting through a
     * translucent wall, never hidden. */
    mode = "sabotage";
    await cdp.send("Page.reload", { ignoreCache: true });
    const sabotageState = await evalInPage(`(async function() {
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
      ${rafSettle}
      await new Promise(r => setTimeout(r, 250));
      const gui = document.getElementById("igBigContainer");
      if (!gui) return { dockFound: true, wallOpen: false };
      const main = document.querySelector("main");
      return {
        dockFound: true,
        wallOpen: true,
        wallBg: getComputedStyle(gui).backgroundColor,
        bodyVisibility: getComputedStyle(document.body).visibility,
        nativeColVisibility: (document.getElementById("native-feed-column") || {}).computedStyleMap ? getComputedStyle(document.getElementById("native-feed-column")).visibility : null,
        mainRectHeight: main ? main.getBoundingClientRect().height : 0,
      };
    })()`);
    /* The pre-fix bug state, characterized exactly: a TRANSLUCENT wall and a
     * VISIBLE body — the assertions above (7/8) reject precisely this pair. */
    const preFixBugReproduced =
      sabotageState.wallOpen === true &&
      /^rgba\(10, 19, 26, 0\.85\)$/.test(sabotageState.wallBg || "") &&
      sabotageState.bodyVisibility === "visible";
    assert(
      "21. red-control (sabotage load): the PRE-FIX ghost state (translucent wall + visible body) is reproduced and REJECTED by assertions 7/8",
      preFixBugReproduced === true,
      JSON.stringify(sabotageState)
    );

    /* v13.3.0 LAYOUT SABOTAGE RED CONTROL — the r13 SINGLE-COLUMN default
     * (the operator's obstruction) reconstructed on purpose: the wall
     * statement reverted to the flex column AND the card default to feed.
     * Assertions 13/13b are exactly what reject this state; the guard also
     * fails closed if the sabotage replace ever stops matching the source. */
    mode = "sabotage-layout";
    await cdp.send("Page.reload", { ignoreCache: true });
    const layoutSabState = await evalInPage(`(async function() {
      let dock = null;
      for (let i = 0; i < 120; i++) {
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
      await new Promise(r => setTimeout(r, 900));
      ${rafSettle}
      const wall = document.getElementById('igAllImages');
      const first = wall ? wall.querySelector('[data-ares-card] img, [data-ares-card] video') : null;
      const r = first ? first.getBoundingClientRect() : null;
      return {
        dockFound: true, wallOpen: true,
        display: wall ? getComputedStyle(wall).display : null,
        flexDirection: wall ? getComputedStyle(wall).flexDirection : null,
        firstMediaLeft: r ? Math.round(r.left) : null,
        firstMediaWidth: r ? Math.round(r.width) : null,
        vw: window.innerWidth,
      };
    })()`);
    const layoutBugReproduced =
      layoutSabState.wallOpen === true &&
      layoutSabState.display === "flex" && layoutSabState.flexDirection === "column" &&
      layoutSabState.firstMediaLeft !== null && layoutSabState.firstMediaLeft > 200;
    assert(
      "22. red-control (layout sabotage load): the r13 SINGLE-COLUMN default (the obstruction) is reproduced and REJECTED by assertions 13/13b",
      layoutBugReproduced === true && sabotageLayoutSource !== distSource,
      JSON.stringify({ ...layoutSabState, replaceMatched: sabotageLayoutSource !== distSource })
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
    /* WO-01 round-3 (3-a F12): mode disclosed — dist + canon-parity reload
     * + the round-12 sabotage red control + the round-14 layout red control. */
    mode: "dist+canon+sabotage+layout-red-control",
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
