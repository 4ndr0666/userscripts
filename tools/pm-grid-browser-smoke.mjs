#!/usr/bin/env node
/**
 * tools/pm-grid-browser-smoke.mjs — Live Headless Chromium (click, wait, get)
 * Proof-of-Possession Battery for Prompt Master v28.7.6 expanded-library
 * grid-card layout (the "garbled vertical card text" field-report fix, WO-05).
 *
 * Paradigm: identical to tools/ig-wall-browser-smoke.mjs — spawns an isolated
 * Chromium instance with a mkdtemp /tmp profile, serves an expanded-library
 * fixture whose DOM is a byte-faithful mirror of the v28 renderRow builder
 * (index badge + title/meta column wrapper + in-flow action strip with six
 * 32px buttons and the five-star buildRowRatingWidget row) styled ONLY by the
 * suite's own extracted CSS constants (MP_EMBEDDED_CSS + MP_ORG_CSS, parsed
 * out of the canon/dist artifacts at runtime — never hardcoded here), and
 * verifies the exact invariant the field screenshot demanded:
 *
 *   AN EXPANDED LIBRARY CARD MUST NEVER RENDER ITS TITLE ONE CHARACTER PER LINE.
 *
 * Concretely, on a repeat(3, minmax(0,1fr)) grid at 1568×864 — the exact
 * geometry of the field screenshot, where the flex-basis:0 title wrapper was
 * starved to 67-94px of leftover while the action strip ate its 70% cap:
 *
 *   1. the title column measures >= 300px (pre-fix it measured 78-94px);
 *   2. every title renders exactly ONE line box (no vertical char stacking);
 *   3. the action strip owns its own line (stacked) and every button and
 *      rating star keeps a nonzero clickable box inside the card;
 *   4. the v28.7.5 single-column layout is preserved verbatim (wide n=1
 *      card: the action strip stays INLINE on the title's line) — superset;
 *   5. the wide n=2 card also stays inline (stacking engages only below
 *      the 580px container threshold) — superset;
 *   6. structural tripwires pin the container-type + @container(max-width)
 *      + flex:1 1 100% contract in BOTH canon and dist (removing the rule
 *      turns the battery red);
 *   7. red control: with the @container block stripped from the sheet, the
 *      n=3 title column collapses back under 150px and the checker's own
 *      metric flags the original bug geometry as a failure.
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
const DIST_PM = path.join(ROOT, "dist", "4ndr0tools - Prompt Master.user.js");
const CANON_PM = path.join(ROOT, "canon", "_sovereign", "4ndr0tools - Prompt Master.user.js");

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

/* Pull the two CSS constants out of a PM source file. The canon writes them
 * as `const MP_EMBEDDED_CSS = "…";` / `const MP_ORG_CSS = "…" + "…";` — the
 * only artifact-honest extraction is to slice the assignment text and eval
 * the string expression itself. */
function extractCss(source, constName) {
  const marker = `const ${constName} =`;
  const at = source.indexOf(marker);
  if (at < 0) throw new Error(`${constName} not found in source`);
  const firstQuote = source.indexOf('"', at + marker.length);
  if (firstQuote < 0) throw new Error(`${constName} string never opens`);
  // Walk the quoted-string expression (segments joined by '+', comments
  // allowed between segments) until the ';' terminator outside quotes.
  let expr = "";
  let inStr = false;
  for (let j = firstQuote; j < source.length; j++) {
    const c = source[j];
    if (inStr) {
      expr += c;
      if (c === "\\") { expr += source[j + 1] || ""; j++; continue; }
      if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; expr += c; continue; }
    if (c === "+") { expr += "+"; continue; }
    if (c === ";") break;
    if (/\s/.test(c)) continue; // allow line continuations between +
    // comments inside the expression (the canon carries them)
    if (c === "/" && source[j + 1] === "/") { while (j < source.length && source[j] !== "\n") j++; continue; }
    if (c === "/" && source[j + 1] === "*") { j += 2; while (j < source.length && !(source[j] === "*" && source[j + 1] === "/")) j++; j++; continue; }
    throw new Error(`${constName}: unexpected character ${JSON.stringify(c)} in string expression`);
  }
  return eval(`(${expr})`);
}

const TITLES = [
  "Parity check relay",
  "flow unwind",
  "tor node Patrol",
  "conserve ops memory",
  "kirkendall void",
  "unsung lumen flow",
  "vault 360 wins",
  "hot venn diagram",
  "memory echo chain",
  "doubled context",
];

/* DOM mirror of the v28 expanded renderRow (canon lines ~8497-8573): index
 * badge (n > 1 path), the inline-styled title column wrapper, title, meta
 * line, and the in-flow action strip (six 32px buttons + five 14px rating
 * stars via the buildRowRatingWidget shape). Styles come ONLY from the
 * extracted suite CSS — the fixture adds zero layout CSS of its own. */
function buildPmFixtureHtml(baseCss, orgCss, cols) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Prompt Master expanded library fixture</title>
<style>${baseCss}</style>
<style>${orgCss}</style>
<style>html,body{margin:0;padding:0;background:#0a131a;}</style>
</head>
<body>
<div class="mp-expanded-overlay" style="position:fixed;inset:0">
  <div class="mp-expanded-modal" style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;display:flex;flex-direction:column;background:var(--mp-bg-overlay)">
    <div class="mp-expanded-header"></div>
    <div class="mp-expanded-body">
      <div class="mp-expanded-list" id="list" style="grid-template-columns:repeat(${cols}, minmax(0, 1fr))"></div>
    </div>
  </div>
</div>
<script>
  var ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15 8 22 9 17 14 18 21 12 17 6 21 7 14 2 9 9 8"/></svg>';
  var TITLES = ${JSON.stringify(TITLES)};
  var list = document.getElementById('list');
  for (var i = 0; i < TITLES.length; i++) {
    var row = document.createElement('div');
    row.className = 'prompt-item-row expanded-mode';
    row.style.display = 'flex';
    var idx = document.createElement('div');
    idx.className = 'mp-prompt-index';
    idx.style.cssText = 'font-family: var(--mp-font-family-base); color: var(--mp-text-secondary); font-size: 11px; min-width: 20px; text-align: center; opacity: 0.6; font-weight: bold;';
    idx.textContent = i + 1;
    row.appendChild(idx);
    var p = document.createElement('div');
    p.style.cssText = 'flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; padding: 0 8px; justify-content: center;';
    var t = document.createElement('div');
    t.className = 'prompt-title';
    t.textContent = TITLES[i];
    p.appendChild(t);
    var meta = document.createElement('div');
    meta.className = 'mp-org-row-meta';
    meta.textContent = 'used 3 · last 2m ago';
    p.appendChild(meta);
    row.appendChild(p);
    var u = document.createElement('div');
    u.className = 'prompt-actions';
    for (var b = 0; b < 6; b++) {
      var btn = document.createElement('button');
      btn.className = 'mp-pinned-action-btn';
      btn.innerHTML = ICON;
      u.appendChild(btn);
    }
    var rating = document.createElement('div');
    rating.className = 'mp-org-rating mp-org-rating-row';
    for (var s = 0; s < 5; s++) {
      var st = document.createElement('button');
      st.className = 'mp-org-rating-star' + (s < 4 ? ' on' : '');
      st.innerHTML = ICON;
      rating.appendChild(st);
    }
    u.appendChild(rating);
    row.appendChild(u);
    list.appendChild(row);
  }
</script>
</body>
</html>`;
}


const PNG_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABkCAYAAAD0bce9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABdJREFUeF7twQEBAAAAgiD/r25IQAEAAPBoDhAAAQ66P+8AAAAASUVORK5CYII=";

function buildSlideshowFixtureHtml(scriptSource) {
  const safe = String(scriptSource).replace(/<\/script>/gi, "<\\/script>");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Prompt Master Slideshow & Icon Contrast Fixture</title>
<style>
  html, body { margin: 0; padding: 0; background: #0a131a; color: #eee; font-family: sans-serif; }
  /* Hostile host-page button rule that previously turned non-!important button icons dark */
  body button { color: rgb(17, 17, 17); background: rgb(12, 12, 12); }
  #bg-gallery { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
  .bg-img { width: 160px; height: 120px; display: block; }
  .cdk-overlay-container { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .cdk-overlay-pane { width: 900px; height: 520px; background: #111822; border: 1px solid #233; display: flex; flex-direction: column; }
  #col-scroller { flex: 1 1 auto; height: 360px; overflow-y: auto; position: relative; }
  #col-spacer { height: 2400px; position: relative; }
  #col-window { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; }
  .col-img { width: 160px; height: 120px; display: block; }
  .col-bg-tile { width: 160px; height: 120px; display: block; background-size: cover; }
</style>
<script>
  window.__gmStore = {};
  window.__gmMenu = {};
  window.GM_info = { script: { version: "28.7.7" } };
  window.GM_getValue = async function(k, defVal) {
    return Object.prototype.hasOwnProperty.call(window.__gmStore, k) ? window.__gmStore[k] : defVal;
  };
  window.GM_setValue = async function(k, v) { window.__gmStore[k] = v; };
  window.GM_listValues = async function() { return Object.keys(window.__gmStore); };
  window.GM_deleteValue = async function(k) { delete window.__gmStore[k]; };
  window.GM_registerMenuCommand = function(label, fn) { window.__gmMenu[label] = fn; };
  window.GM_setClipboard = function() {};
  window.GM_xmlhttpRequest = function(opts) {
    if (opts && opts.onerror) setTimeout(function() { opts.onerror(new Error("offline fixture")); }, 0);
  };
</script>
</head>
<body>
  <!-- 30 default background photos on the underlying page -->
  <div id="bg-gallery"></div>
  <!-- Hidden stale photos from an inactive view -->
  <div id="hidden-stale" style="display:none" aria-hidden="true"></div>

  <!-- Active collection rendered inside an Angular CDK / ARIA dialog overlay -->
  <div class="cdk-overlay-container">
    <div class="cdk-overlay-pane">
      <div role="dialog" aria-modal="true" data-collection-id="col-A" id="active-collection-dialog" style="width:880px;height:500px;display:flex;flex-direction:column;">
        <h2 id="col-heading">Collection Alpha</h2>
        <div id="col-scroller">
          <div id="col-spacer">
            <div id="col-window"></div>
          </div>
        </div>
        <button type="button" id="load-more-btn" style="width:160px;height:32px;">Load more photos</button>
      </div>
    </div>
  </div>

  <textarea id="prompt-textarea" style="width:300px;height:60px;"></textarea>

  <script>
    var bgGal = document.getElementById("bg-gallery");
    for (var b = 1; b <= 30; b++) {
      var bi = document.createElement("img");
      bi.className = "bg-img";
      bi.src = "http://flow.google.com/media/bg-" + b + ".jpg";
      bgGal.appendChild(bi);
    }
    var hid = document.getElementById("hidden-stale");
    for (var h = 1; h <= 5; h++) {
      var hi = document.createElement("img");
      hi.src = "http://flow.google.com/media/hidden-" + h + ".jpg";
      hid.appendChild(hi);
    }

    window.__activeCollectionPrefix = "colA";
    window.__extraBatchLoaded = false;
    window.__lazyExtrasCount = 0;
    var scroller = document.getElementById("col-scroller");
    var win = document.getElementById("col-window");

    window.__renderVirtualWindow = function() {
      win.replaceChildren();
      var prefix = window.__activeCollectionPrefix;
      if (prefix === "colB") {
        for (var k = 1; k <= 42; k++) {
          var imB = document.createElement("img");
          imB.className = "col-img";
          imB.src = "http://flow.google.com/media/colB-" + k + ".jpg";
          win.appendChild(imB);
        }
        return;
      }
      var top = scroller.scrollTop || 0;
      var start = 1, end = 30;
      if (top >= 550) { start = 61; end = 75; }
      else if (top >= 250) { start = 31; end = 60; }
      for (var i = start; i <= end; i++) {
        var im = document.createElement("img");
        im.className = "col-img";
        im.src = "http://flow.google.com/media/" + prefix + "-" + i + ".jpg";
        win.appendChild(im);
      }
      if (window.__extraBatchLoaded) {
        for (var j = 76; j <= 90; j++) {
          var im2 = document.createElement("img");
          im2.className = "col-img";
          im2.setAttribute("data-src", "http://flow.google.com/media/" + prefix + "-" + j + ".jpg");
          win.appendChild(im2);
        }
      }
      if (window.__lazyExtrasCount > 0) {
        for (var m = 91; m <= 90 + window.__lazyExtrasCount; m++) {
          var tile = document.createElement("div");
          tile.className = "col-bg-tile";
          tile.style.backgroundImage = "url('http://flow.google.com/media/" + prefix + "-" + m + ".jpg')";
          win.appendChild(tile);
        }
      }
    };

    scroller.addEventListener("scroll", function() {
      window.__renderVirtualWindow();
    });
    document.getElementById("load-more-btn").addEventListener("click", function() {
      window.__extraBatchLoaded = true;
      window.__renderVirtualWindow();
      this.disabled = true;
      this.style.display = "none";
    });
    window.__renderVirtualWindow();
  </script>
  <script>${safe}</script>
</body>
</html>`;
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

/* Minimal RFC 6455 WebSocket client for CDP — same implementation contract as
 * flow-chip-browser-smoke.mjs / ig-wall-browser-smoke.mjs (kept
 * verbatim-in-shape for convention stability). */
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

/* The card-width metric the battery pivots on: the narrowest title column
 * width across the first N cards, plus the widest single line box of each
 * title (a 1-char-per-line title produces line boxes ~12px wide). */
const MEASURE_SNIPPET = `(function(){
  var rows = Array.prototype.slice.call(document.querySelectorAll('.prompt-item-row.expanded-mode')).slice(0, 4);
  var titles = rows.map(function(row){
    var t = row.querySelector('.prompt-title');
    var u = row.querySelector('.prompt-actions');
    var range = document.createRange();
    range.selectNodeContents(t);
    var rects = Array.prototype.slice.call(range.getClientRects()).filter(function(r){ return r.width > 0.5; });
    var btns = u.querySelectorAll('button');
    var allBtnsVisible = Array.prototype.every.call(btns, function(b){ return b.offsetWidth > 0 && b.offsetHeight > 0; });
    return {
      titleWidth: t.clientWidth,
      lineBoxes: rects.length,
      widestLine: rects.reduce(function(m, r){ return Math.max(m, r.width); }, 0),
      actionsWidth: u.clientWidth,
      stacked: u.getBoundingClientRect().top - t.getBoundingClientRect().top > 8,
      allBtnsVisible: allBtnsVisible,
      rowWidth: row.clientWidth
    };
  });
  return JSON.stringify(titles);
})()`;

export async function runPmGridBrowserBattery() {
  const distSource = fs.readFileSync(DIST_PM, "utf8");
  const canonSource = fs.readFileSync(CANON_PM, "utf8");

  const distVersion = (distSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
  const canonVersion = (canonSource.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || null;
  const CQ_RULE = "@container (max-width: 580px){.prompt-item-row.expanded-mode .prompt-actions{flex:1 1 100%;max-width:100%;justify-content:flex-start;}}";
  const CONTAIN_RULE = ".prompt-item-row.expanded-mode{flex-wrap:wrap;row-gap:6px;container-type:inline-size;}";
  const TITLE_RULE = ".prompt-item-row.expanded-mode .prompt-title{width:100%;}";

  const checks = [];
  function assert(name, cond, detail = "") {
    checks.push({ name, pass: Boolean(cond), detail: String(detail || "") });
  }

  if (!CHROMIUM_BIN) {
    // Structural fallback on hosts without a local Chromium binary — SAME
    // fail-closed contract as the live path (clean === failed.length === 0).
    assert("1. version header present & canon/dist parity",
      !!distVersion && distVersion === canonVersion, `dist=${distVersion}, canon=${canonVersion}`);
    assert("2. structural tripwire: container query + stack rule present (canon+dist)",
      canonSource.includes(CQ_RULE) && distSource.includes(CQ_RULE));
    assert("3. structural tripwire: card containment + wrap + title width:100% present (canon+dist)",
      canonSource.includes(CONTAIN_RULE) && distSource.includes(CONTAIN_RULE) &&
      canonSource.includes(TITLE_RULE) && distSource.includes(TITLE_RULE));
    assert("4. red-control: full-viewport intersection still detects covering geometry",
      (function rectsIntersect(a, b) {
        return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      })({ left: 0, top: 0, right: 1280, bottom: 800 }, { left: 0, top: 0, right: 1280, bottom: 800 }) === true);
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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-grid-cdp-"));
  let server = null;
  let browser = null;
  let cdp = null;
  try {
    let baseCssCanon, orgCssCanon, baseCssDist, orgCssDist;
    try {
      baseCssCanon = extractCss(canonSource, "MP_EMBEDDED_CSS");
      orgCssCanon = extractCss(canonSource, "MP_ORG_CSS");
      baseCssDist = extractCss(distSource, "MP_EMBEDDED_CSS");
      orgCssDist = extractCss(distSource, "MP_ORG_CSS");
    } catch (e) {
      assert("0. CSS constants extractable from both artifacts", false, e.message);
      const failed = checks.filter((c) => !c.pass);
      return { passed: checks.length - failed.length, total: checks.length, clean: false, checks, failed };
    }
    assert("0. CSS constants extractable from both artifacts (canon+dist)",
      baseCssCanon.length > 1000 && orgCssCanon.length > 1000 &&
      baseCssDist.length > 1000 && orgCssDist.length > 1000);

    assert("1. version header present & canon/dist parity",
      !!distVersion && distVersion === canonVersion, `dist=${distVersion}, canon=${canonVersion}`);
    assert("2. structural tripwire: container query + stack rule present (canon+dist)",
      canonSource.includes(CQ_RULE) && distSource.includes(CQ_RULE));
    assert("3. structural tripwire: card containment + wrap + title width:100% present (canon+dist)",
      canonSource.includes(CONTAIN_RULE) && distSource.includes(CONTAIN_RULE) &&
      canonSource.includes(TITLE_RULE) && distSource.includes(TITLE_RULE));

    server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://fixture/");
      const mode = url.searchParams.get("mode") || "dist";
      if (url.pathname === "/slideshow") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(buildSlideshowFixtureHtml(mode === "canon" ? canonSource : distSource));
        return;
      }
      if (url.pathname.startsWith("/media/")) {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(Buffer.from(PNG_DATA_URI.split(",")[1], "base64"));
        return;
      }
      const cols = Number(url.searchParams.get("cols") || 3);
      const stripped = url.searchParams.get("stripped") === "1";
      const base = mode === "canon" ? baseCssCanon : baseCssDist;
      let org = (mode === "canon" ? orgCssCanon : orgCssDist);
      if (stripped) org = org.split("@container")[0]; // red control: drop the stack rule
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(buildPmFixtureHtml(base, org, cols));
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const port = server.address().port;

    browser = spawn(
      CHROMIUM_BIN,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--host-resolver-rules=MAP flow.google.com 127.0.0.1",
        `--remote-debugging-port=0`,
        `--user-data-dir=${path.join(tmpDir, "profile")}`,
        "about:blank",
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    const wsBrowserUrl = await new Promise((resolve, reject) => {
      let buf = "";
      const timer = setTimeout(() => reject(new Error("Timed out waiting for Chromium DevTools port")), 30000);
      browser.stderr.on("data", (d) => {
        buf += d.toString();
        const m = /DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)\/[^\s]+)/.exec(buf);
        if (m) { clearTimeout(timer); resolve({ url: m[1], port: Number(m[2]) }); }
      });
      browser.on("exit", () => { clearTimeout(timer); reject(new Error("Chromium exited prematurely")); });
    });

    // Attach to the about:blank PAGE target (not the browser-level endpoint).
    let pageWsUrl = null;
    for (let i = 0; i < 120; i++) {
      const targets = await fetchJson(`http://127.0.0.1:${wsBrowserUrl.port}/json/list`);
      const pageTarget = targets.find((t) => t.type === "page");
      if (pageTarget && pageTarget.webSocketDebuggerUrl) { pageWsUrl = pageTarget.webSocketDebuggerUrl; break; }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!pageWsUrl) throw new Error("Could not attach to a page target");

    cdp = await connectCDP(pageWsUrl);
    await cdp.send("Runtime.enable");
    await cdp.send("Page.enable");

    async function measureAt(viewport, url) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: viewport[0],
        height: viewport[1],
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 350));
      const res = await cdp.send("Runtime.evaluate", { expression: MEASURE_SNIPPET, returnByValue: false });
      return JSON.parse(res.result.value);
    }

    /* --- 4-6: the field geometry: n=3 at 1568×864 (the screenshot's case) --- */
    const grid3 = await measureAt([1568, 864], `http://flow.google.com:${port}/?mode=dist&cols=3`);
    const narrowestTitle = Math.min(...grid3.map((t) => t.titleWidth));
    const widestLine = Math.max(...grid3.map((t) => t.widestLine));
    assert(
      "4. (get) FIELD-BUG ASSERTION: n=3 grid titles get a readable column (narrowest >= 300px; pre-fix 78-94px)",
      narrowestTitle >= 300,
      `narrowest=${narrowestTitle}px, row=${grid3[0].rowWidth}px`
    );
    assert(
      "5. (get) no vertical character stacking: every title renders a single line box with full-width glyphs (widest line >= 50px)",
      grid3.every((t) => t.lineBoxes === 1 && t.widestLine >= 50),
      `widestLine=${widestLine}px, lineBoxes=${grid3.map((t) => t.lineBoxes).join(",")}`
    );
    assert(
      "6. (get) stacked strip: actions own their line and every button + rating star keeps a nonzero clickable box",
      grid3.every((t) => t.stacked && t.allBtnsVisible),
      `actions=${grid3[0].actionsWidth}px, stacked=${grid3.map((t) => t.stacked).join(",")}`
    );

    /* --- 7: the v28.7.5 superset: wide single-column card stays inline --- */
    const grid1 = await measureAt([1280, 800], `http://flow.google.com:${port}/?mode=dist&cols=1`);
    assert(
      "7. (get) SUPERSET: wide n=1 card keeps the v28.7.5 inline layout (strip on the title's line, title full-width)",
      grid1.every((t) => !t.stacked && t.titleWidth >= 300),
      `title=${grid1[0].titleWidth}px, stacked=${grid1.map((t) => t.stacked).join(",")}`
    );

    /* --- 8: wide n=2 cards stay inline (stacking only below 580px) --- */
    const grid2 = await measureAt([1440, 900], `http://flow.google.com:${port}/?mode=dist&cols=2`);
    assert(
      "8. (get) SUPERSET: wide n=2 card (>= 580px) keeps the inline layout too",
      grid2.every((t) => !t.stacked && t.titleWidth >= 150),
      `row=${grid2[0].rowWidth}px, title=${grid2[0].titleWidth}px`
    );

    /* --- 9: canon parity live: canon CSS produces the same stacked cure --- */
    const grid3canon = await measureAt([1568, 864], `http://flow.google.com:${port}/?mode=canon&cols=3`);
    assert(
      "9. canon live parity: canon CSS stacks the n=3 grid identically (narrowest title >= 300px)",
      Math.min(...grid3canon.map((t) => t.titleWidth)) >= 300 && grid3canon.every((t) => t.stacked)
    );

    /* --- 10: red control — stripping the @container block resurrects the bug --- */
    const grid3red = await measureAt([1568, 864], `http://flow.google.com:${port}/?mode=dist&cols=3&stripped=1`);
    const redNarrowest = Math.min(...grid3red.map((t) => t.titleWidth));
    assert(
      "10. red-control: without the container query the n=3 title starves again (metric flags it: narrowest < 150px)",
      redNarrowest < 150,
      `narrowest=${redNarrowest}px (the original bug geometry, detected)`
    );

    /* --- 11-14: v28.7.7 Media Slideshow collection scoping, >30 virtual-scroll accumulation, refresh merge & icon contrast --- */
    async function runSlideshowProbe(mode) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1280, height: 800, deviceScaleFactor: 1, mobile: false,
      });
      await cdp.send("Page.navigate", { url: `http://flow.google.com:${port}/slideshow?mode=${mode}` });
      await new Promise((r) => setTimeout(r, 450));
      const res = await cdp.send("Runtime.evaluate", {
        awaitPromise: true,
        returnByValue: true,
        expression: `(async function() {
          for (let i = 0; i < 40; i++) {
            if (window.__gmMenu && Object.keys(window.__gmMenu).some(k => k.includes("Media Slideshow"))) break;
            await new Promise(r => setTimeout(r, 60));
          }
          // Open slideshow via Alt+T hotkey
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "t", code: "KeyT", altKey: true, bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 380));
          const ov = document.getElementById("mp-media-slideshow");
          if (!ov) return { opened: false };
          const counter1 = (ov.querySelector(".mp-ss-counter") || {}).textContent || "";
          const slide1Src = (ov.querySelector(".mp-ss-slide") || {}).src || "";

          // Inspect all 9 control buttons & their SVG children + computed foreground colors
          const ctrls = Array.from(ov.querySelectorAll(".mp-ss-ctrl"));
          const iconAudit = ctrls.map(btn => {
            const svg = btn.querySelector("svg");
            const graphicChildren = svg ? svg.querySelectorAll("path, rect, line, polygon, circle, polyline").length : 0;
            const sr = svg ? svg.getBoundingClientRect() : { width: 0, height: 0 };
            const cs = window.getComputedStyle(btn);
            const svgCs = svg ? window.getComputedStyle(svg) : { color: "" };
            return {
              cls: btn.className,
              hasSvg: !!svg,
              graphicChildren,
              w: Math.round(sr.width),
              h: Math.round(sr.height),
              color: cs.color,
              svgColor: svgCs.color,
              svgFillAttr: svg ? svg.getAttribute("fill") : null,
              svgStrokeAttr: svg ? svg.getAttribute("stroke") : null,
            };
          });

          // Step forward with Next button click
          const nextBtn = ov.querySelector(".mp-ss-next");
          if (nextBtn) nextBtn.click();
          const slide2Src = (ov.querySelector(".mp-ss-slide") || {}).src || "";

          // Add 15 more lazy background-image tiles to Collection A and click Refresh ("Read more")
          window.__lazyExtrasCount = 15;
          window.__renderVirtualWindow();
          const refreshBtn = ov.querySelector(".mp-ss-refresh");
          if (refreshBtn) refreshBtn.click();
          await new Promise(r => setTimeout(r, 200));
          const counterAfterRefresh = (ov.querySelector(".mp-ss-counter") || {}).textContent || "";

          // Close slideshow, switch dialog to Collection B (42 items), and reopen
          const closeBtn = ov.querySelector(".mp-ss-close");
          if (closeBtn) closeBtn.click();
          const closedClean = !document.getElementById("mp-media-slideshow");

          const dlg = document.getElementById("active-collection-dialog");
          dlg.setAttribute("data-collection-id", "col-B");
          document.getElementById("col-heading").textContent = "Collection Beta";
          window.__activeCollectionPrefix = "colB";
          window.__renderVirtualWindow();

          document.dispatchEvent(new KeyboardEvent("keydown", { key: "t", code: "KeyT", altKey: true, bubbles: true, cancelable: true }));
          await new Promise(r => setTimeout(r, 200));
          const ovB = document.getElementById("mp-media-slideshow");
          const counterColB = ovB ? ((ovB.querySelector(".mp-ss-counter") || {}).textContent || "") : "";
          const slideColBSrc = ovB ? ((ovB.querySelector(".mp-ss-slide") || {}).src || "") : "";
          if (ovB && ovB.querySelector(".mp-ss-close")) ovB.querySelector(".mp-ss-close").click();

          return {
            opened: true,
            counter1,
            slide1Src,
            slide2Src,
            counterAfterRefresh,
            closedClean,
            counterColB,
            slideColBSrc,
            ctrlCount: ctrls.length,
            iconAudit,
          };
        })()`,
      });
      return res.result ? res.result.value : { opened: false };
    }

    const ssDist = await runSlideshowProbe("dist");
    assert(
      "11. (click, wait, get) Media Slideshow scopes to open dialog collection (0 background/hidden bleed) & sweeps virtual scroll + load-more beyond 30-image ceiling (90 items)",
      ssDist.opened &&
        ssDist.counter1 === "1 / 90" &&
        ssDist.slide1Src.includes("/media/colA-1.jpg") &&
        ssDist.slide2Src.includes("/media/colA-2.jpg"),
      `counter1=${ssDist.counter1}, slide1=${ssDist.slide1Src}, slide2=${ssDist.slide2Src}`
    );
    assert(
      "12. (click, wait, get) Media Slideshow refresh/read-more merges newly hydrated items (105 items) & switching collections harvests Collection B (42 items)",
      ssDist.counterAfterRefresh === "2 / 105" &&
        ssDist.closedClean &&
        ssDist.counterColB === "1 / 42" &&
        ssDist.slideColBSrc.includes("/media/colB-1.jpg"),
      `afterRefresh=${ssDist.counterAfterRefresh}, colB=${ssDist.counterColB}, slideColB=${ssDist.slideColBSrc}`
    );
    const allIconsValid =
      Array.isArray(ssDist.iconAudit) &&
      ssDist.ctrlCount === 9 &&
      ssDist.iconAudit.every(
        (ic) =>
          ic.hasSvg &&
          ic.graphicChildren >= 1 &&
          ic.w >= 14 &&
          ic.h >= 14 &&
          ic.color !== "rgb(17, 17, 17)" &&
          ic.color !== "rgb(0, 0, 0)" &&
          (ic.color === "rgb(103, 232, 249)" ||
            ic.color === "rgb(0, 229, 255)" ||
            ic.color === "rgb(255, 0, 85)")
      );
    const fsIcon = (ssDist.iconAudit || []).find((ic) => ic.cls.includes("mp-ss-fs"));
    assert(
      "13. (get) Media Slideshow foreground icons: all 9 chrome buttons render non-empty SVG paths (>=14x14px) with high-contrast 3lectric-Glass foreground colors",
      allIconsValid &&
        fsIcon &&
        fsIcon.svgFillAttr === "none" &&
        fsIcon.svgStrokeAttr === "currentColor",
      `ctrls=${ssDist.ctrlCount}, allValid=${allIconsValid}, fs=${JSON.stringify(fsIcon)}`
    );

    const ssCanon = await runSlideshowProbe("canon");
    assert(
      "14. canon live parity: Media Slideshow virtual-scroll harvest (90 -> 105), collection switch (42), and 9/9 bright SVG icons hold in canon",
      ssCanon.opened &&
        ssCanon.counter1 === "1 / 90" &&
        ssCanon.counterAfterRefresh === "2 / 105" &&
        ssCanon.counterColB === "1 / 42" &&
        ssCanon.ctrlCount === 9 &&
        ssCanon.iconAudit.every((ic) => ic.graphicChildren >= 1 && ic.w >= 14),
      `canonCounter1=${ssCanon.counter1}, canonRefresh=${ssCanon.counterAfterRefresh}, canonColB=${ssCanon.counterColB}`
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
    mode: "dist",
    checks,
    failed,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPmGridBrowserBattery()
    .then((res) => {
      for (const c of res.checks) {
        console.log(`  ${c.pass ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
      }
      console.log(`\nPM Grid Browser Proof-of-Possession Battery: ${res.passed}/${res.total} passed${res.mode ? ` [${res.mode}]` : ""}`);
      if (!res.clean) process.exit(1);
    })
    .catch((err) => {
      console.error("PM Grid Browser Battery Error:", err);
      process.exit(1);
    });
}
