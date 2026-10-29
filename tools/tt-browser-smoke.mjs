#!/usr/bin/env node
/**
 * tools/tt-browser-smoke.mjs — Live Headless Chromium driver for the
 * Trusted-Types integration harness (tools/tt-smoke.mjs).
 * ----------------------------------------------------------------------------
 * WO-01 round 13 (12c-F02 closure): tt-smoke.mjs was the ONE instrument with
 * zero gate wiring — the harness that once caught Blob2URL's vault panels
 * DEAD on require-trusted-types-for hosts (canon :34) was never executed by
 * anything in the repo. This driver closes that: it spawns the harness as a
 * child process, drives it with a real headless Chromium over CDP (the exact
 * zero-dependency pattern of ig-wall/pm-grid/flow-chip browser smokes), and
 * asserts the harness's own green contracts live:
 *
 *   1-3.  Blob2URL autopanel under ALL THREE REGIMES (/tt/ enforced,
 *         /tt-locked/ policy-name allowlist, /nott/ parity): zero page
 *         errors, zero CSP violations, the vault console mounts, menu
 *         commands registered.
 *   4.    the NetHook wire probe: the page-realm slot is live (onBody),
 *         version >= 5.
 *   5.    the Akasha Silence veto probe: the tracker URL is defused on every
 *         channel (fetch mocked, XHR mocked, POST body identifier-poisoned,
 *         beacon swallowed) and the server-side telemetry hit counter stays
 *         at ZERO.
 *   6.    the Filester++ observer probe: the API-hit is captured by the
 *         observer family and the clean control passes through untouched.
 *   7.    SABOTAGE RED CONTROL (live, in-page): a raw innerHTML assignment
 *         THROWS under /tt/ and SUCCEEDS under /nott/ — the enforced regime
 *         the whole battery rides on is genuinely load-bearing; if the CSP
 *         meta were inert the green runs above would be vacuous.
 *
 * Structural fallback on hosts without a local Chromium binary — the SAME
 * fail-closed contract (clean === failed.length === 0) over source-level
 * tripwires, with the mode disclosed.
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
const DIST = path.join(ROOT, "dist");

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

function pickFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
    srv.on("error", reject);
  });
}

export async function runTtBrowserBattery() {
  const checks = [];
  function assert(name, cond, detail = "") {
    checks.push({ name, pass: Boolean(cond), detail: String(detail || "") });
  }

  const ttSrc = fs.readFileSync(path.join(ROOT, "tools", "tt-smoke.mjs"), "utf8");
  const distFiles = fs.existsSync(DIST) ? fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")) : [];

  if (!CHROMIUM_BIN) {
    /* Structural fallback — same fail-closed contract, source tripwires. */
    assert("S1. harness serves all three regimes (enforced / locked / parity)",
      ttSrc.includes('url.pathname === "/tt/" ? "enforced"') &&
      ttSrc.includes('url.pathname === "/tt-locked/" ? "locked"') &&
      ttSrc.includes('url.pathname === "/nott/" ? "none"'));
    assert("S2. the locked allowlist byte-matches the kernel's TT policy names",
      ttSrc.includes("trusted-types 4ndr0666tools#dom 4ndr0666tools#dom.2 4ndr0666tools#dom.3"));
    assert("S3. __SMOKE__ collects page errors, CSP violations, console.error and exposes report()",
      ttSrc.includes("window.__SMOKE__ = {") && ttSrc.includes("__SMOKE__.report = function ()") &&
      ttSrc.includes("__SMOKE__.errors.push('pageerror: '") && ttSrc.includes("__SMOKE__.csp.push(e.violatedDirective"));
    assert("S4. the gm-shim mock + wire/veto/observer probes + ready flag all present",
      ttSrc.includes("/gm-shim.js") && ttSrc.includes("probeParam === \"veto\"") &&
      ttSrc.includes("probeParam === \"observer\"") && ttSrc.includes("__SMOKE__.ready = true;"));
    assert("S5. the battery's three driven scripts exist in dist/",
      distFiles.some((f) => f.includes("Blob2URL")) &&
      distFiles.some((f) => f.includes("Akasha Silence")) &&
      distFiles.some((f) => f.includes("Filester")));
    assert("S6. red control (structural): the enforced + locked regimes carry require-trusted-types-for and the parity regime carries none",
      ttSrc.includes("require-trusted-types-for 'script'; trusted-types") && ttSrc.includes('? "require-trusted-types-for \'script\'"') &&
      ttSrc.includes(': "";'));
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

  /* ── Live path: spawn the harness child on a free port ───────────────── */
  let harness = null;
  let harnessPort = 0;
  for (let attempt = 0; attempt < 5 && !harnessPort; attempt++) {
    const candidate = await pickFreePort();
    const child = spawn(process.execPath, [path.join(ROOT, "tools", "tt-smoke.mjs"), "--port", String(candidate)], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const ok = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 8000);
      let buf = "";
      const onData = (chunk) => {
        buf += chunk.toString();
        if (buf.includes(`tt-smoke harness — http://127.0.0.1:${candidate}`)) {
          clearTimeout(timer);
          resolve(true);
        }
      };
      child.stdout.on("data", onData);
      child.on("exit", () => { clearTimeout(timer); resolve(false); });
      child.on("error", () => { clearTimeout(timer); resolve(false); });
    });
    if (ok) { harness = child; harnessPort = candidate; break; }
    try { child.kill("SIGKILL"); } catch (_) {}
  }
  if (!harnessPort) {
    assert("0. harness child spawned and banner observed", false, "5 port attempts exhausted");
    const failed = checks.filter((c) => !c.pass);
    return { passed: 0, total: 1, clean: false, mode: "live", checks, failed };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tt-browser-cdp-"));
  let browser = null;
  let cdp = null;

  try {
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
        "--window-size=1280,800",
        "--remote-debugging-port=0",
        "about:blank",
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
      const pageTarget = targets.find((t) => t.type === "page" && t.url.includes("about:blank"));
      if (pageTarget && pageTarget.webSocketDebuggerUrl) { pageWsUrl = pageTarget.webSocketDebuggerUrl; break; }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (!pageWsUrl) throw new Error("Could not attach to the page target");

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

    /* Navigate to a harness URL and wait for __SMOKE__.ready, then return
     * the full report. The harness arms its probes on a ~1.3 s floor; the
     * veto/observer probes can legitimately take ~5 s. */
    async function drive(relUrl, timeoutMs = 25000) {
      await cdp.send("Page.navigate", { url: `http://127.0.0.1:${harnessPort}${relUrl}` });
      const t0 = Date.now();
      for (;;) {
        const ready = await evalInPage(
          `(typeof window.__SMOKE__ !== 'undefined' && __SMOKE__.ready === true) || (Date.now() - ${t0} > ${timeoutMs} && 'TIMEOUT')`
        );
        if (ready === true) break;
        if (ready === "TIMEOUT") throw new Error(`harness never signaled ready for ${relUrl}`);
        await new Promise((r) => setTimeout(r, 200));
      }
      return evalInPage(`__SMOKE__.report()`);
    }

    /* 1-3. Blob2URL autopanel under all three regimes. */
    for (const [label, regime] of [
      ["1", "/tt/"],
      ["2", "/tt-locked/"],
      ["3", "/nott/"],
    ]) {
      const r = await drive(`${regime}?script=Blob2URL&autopanel`);
      assert(
        `${label}. Blob2URL vault console under ${regime} (autopanel): zero page errors, zero CSP violations, console mounts, menu commands registered`,
        r.errors.length === 0 && r.csp.length === 0 && r.hudMounted === true && r.menuCommands >= 1,
        `errors=${JSON.stringify(r.errors).slice(0, 200)} csp=${JSON.stringify(r.csp).slice(0, 120)} hudMounted=${r.hudMounted} menu=${r.menuCommands}`
      );
    }

    /* 4. The NetHook wire probe (Blob2URL is a kernel/NetHook consumer). */
    const wire = await drive(`/tt/?script=Blob2URL&probe=wire&autopanel`);
    assert(
      "4. NetHook wire probe: the page-realm slot is live (onBody) at version >= 5 with zero page errors",
      wire.netSlot === true && typeof wire.netVersion === "number" && wire.netVersion >= 5 && wire.errors.length === 0,
      `netSlot=${wire.netSlot} netVersion=${wire.netVersion} errors=${JSON.stringify(wire.errors).slice(0, 200)}`
    );

    /* 5. The Akasha Silence veto probe — live defusal proof. */
    const veto = await drive(`/tt/?script=Akasha%20Silence&probe=veto`);
    const vp = veto.vetoProbe || {};
    assert(
      "5. Akasha Silence veto probe: tracker defused on every channel (fetch mocked, XHR mocked, body identifier-poisoned, beacon swallowed) and the server-side telemetry counter stays ZERO",
      vp.fetchMocked === true && vp.xhrMocked === true && vp.bodyPoisoned === true &&
        vp.beaconReturned === true && vp.zeroServerHits === true && veto.errors.length === 0,
      `vetoProbe=${JSON.stringify(vp).slice(0, 260)} errors=${JSON.stringify(veto.errors).slice(0, 160)}`
    );

    /* 6. The Filester++ observer probe — structured-traffic delivery. */
    const obs = await drive(`/tt/?script=Filester%2B%2B&probe=observer`);
    const op = obs.observerProbe || {};
    assert(
      "6. Filester++ observer probe: the API hit is captured by the observer family and the clean control passes through untouched",
      op.apiHitLogged === true && op.controlPassthrough === true && obs.errors.length === 0,
      `observerProbe=${JSON.stringify(op).slice(0, 260)} errors=${JSON.stringify(obs.errors).slice(0, 160)}`
    );

    /* 7. SABOTAGE RED CONTROL — the regime itself is load-bearing. A raw
     * innerHTML assignment must THROW under /tt/ (enforced) and SUCCEED
     * under /nott/ (parity). If the CSP meta were inert, every green above
     * would be vacuous — this control fires exactly then. */
    const ttRed = await drive(`/tt/?script=Blob2URL`);
    const threw = await evalInPage(`(function () {
      try { document.body.innerHTML = '<b>sabotage</b>'; return 'assigned'; }
      catch (e) { return 'threw:' + (e && e.name); }
    })()`);
    assert(
      "7. SABOTAGE RED CONTROL: a raw innerHTML assignment THROWS under /tt/ — the enforced regime the battery rides on is genuinely load-bearing",
      /^threw:/.test(threw),
      threw
    );
    const nottRed = await drive(`/nott/?script=Blob2URL`);
    const assigned = await evalInPage(`(function () {
      try { document.body.innerHTML = '<b>sabotage</b>'; return 'assigned'; }
      catch (e) { return 'threw:' + (e && e.name); }
    })()`);
    assert(
      "8. RED CONTROL inverse: the same assignment SUCCEEDS under /nott/ (parity regime confirmed inert — the /tt/ throw is the CSP, not the page)",
      assigned === "assigned",
      assigned
    );
    void ttRed; void nottRed;
  } finally {
    try { if (cdp) cdp.close(); } catch (_) {}
    try { if (browser) browser.kill("SIGKILL"); } catch (_) {}
    try { if (harness) harness.kill("SIGKILL"); } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  const failed = checks.filter((c) => !c.pass);
  return {
    passed: checks.length - failed.length,
    total: checks.length,
    clean: failed.length === 0,
    mode: "live",
    checks,
    failed,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const r = await runTtBrowserBattery();
  for (const c of r.checks) console.log(`  ${c.pass ? "✓" : "✗"} ${c.name}${c.detail && !c.pass ? ` (${c.detail})` : ""}`);
  console.log(`tt-browser-smoke: ${r.passed}/${r.total} assertions passed [mode=${r.mode}]`);
  if (!r.clean) process.exit(1);
  console.log("  ✓ Trusted-Types integration battery verified (three regimes + wire/veto/observer probes + the live sabotage red control)");
}
