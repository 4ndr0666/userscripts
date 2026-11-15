#!/usr/bin/env node
// Paired wall-time workload for 4ndr0_perf.py: the gallery poll-tick render path.
//
// Boots the userscript under test in jsdom, seeds JOBS pending gallery jobs through
// the panel's real Generate flow (same-chat mode), then fires the script's own
// pollGallery callback TICKS times back-to-back. The backend mock resolves each
// conversation with a still-generating thread, so every tick ends in
// onGalleryChange with unchanged observable state — the exact workload the
// v1.1.0+ re-render suppression targets (v1.0.0 rebuilds the full tile grid on
// every tick). The printed fingerprint (gallery counter + serialized grid)
// proves behavioral parity between baseline and candidate.
//
// Seeding uses a virtual-time speedup for the script's internal sleeps only
// (waitFor steps, inter-send delay, stop-button pulse); the measured region
// contains no scaled timers. Both sides run the identical driver.
//
// Usage: node tests/perf_driver.mjs <path-to-userscript> <ticks> <jobs>
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const [, , scriptPath, ticksArg = '600', jobsArg = '40'] = process.argv;
const CODE = fs.readFileSync(path.resolve(scriptPath), 'utf8');
const TICKS = parseInt(ticksArg, 10);
const JOBS = parseInt(jobsArg, 10);
const SPEED = 0.02; // virtual-time speedup for seeding waits only

const dom = new JSDOM(`<!doctype html><html><body>
  <div class="ProseMirror" contenteditable="true" id="prompt-textarea" data-test-visible></div>
  <button aria-label="Send" data-test-visible>Send</button></body></html>`,
  { url: 'https://chatgpt.com/', pretendToBeVisual: true, runScripts: 'outside-only' });
const { window } = dom;
window.Element.prototype.getClientRects = function () { return this.hasAttribute && this.hasAttribute('data-test-visible') ? [{}] : []; };
// jsdom has no execCommand; emulate the two commands the composer path uses so BOTH
// baseline and candidate run their real code paths (real browsers have execCommand).
window.document.execCommand = function (cmd, _ui, value) {
  if (cmd === 'insertText' && value != null) { const el = window.document.activeElement; if (el) el.textContent = value; return true; }
  if (cmd === 'selectAll' || cmd === 'delete') return true;
  return false;
};

// Controllable timers: scale the script's internal sleeps for fast seeding and
// capture the poll/attach interval callbacks so the measured region is pure.
const realSetTimeout = window.setTimeout.bind(window);
const realSetInterval = window.setInterval.bind(window);
const realClearInterval = window.clearInterval.bind(window);
window.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, Math.max(0, (ms || 0) * SPEED), ...a);
let pollCb = null, pollId = null, attachId = null;
window.setInterval = (fn, ms, ...a) => {
  const id = realSetInterval(fn, Math.max(0, (ms || 0) * SPEED), ...a);
  if (ms === 4000 && !pollCb) { pollCb = fn; pollId = id; }
  if (ms === 2000) attachId = id;
  return id;
};

// Backend mock: one shared conversation whose thread grows with each send and
// never finishes (every job stays pending across all ticks).
const state = { sent: 0 };
const CONV = '11111111-2222-4222-8222-333333333333';
const threadOf = () => {
  const mapping = {}; let prev = null;
  for (let i = 0; i < state.sent; i++) {
    const u = `u${i}`, a = `a${i}`;
    mapping[u] = { ...(prev ? { parent: prev } : {}), message: { author: { role: 'user' }, content: { parts: ['perf prompt'] } } };
    mapping[a] = { parent: u, message: { author: { role: 'assistant' }, status: 'in_progress', content: { parts: ['...'] } } };
    prev = a;
  }
  return { current_node: prev || null, mapping };
};
window.fetch = async (input) => {
  const u = new window.URL(String(typeof input === 'string' ? input : input.url), window.location.href);
  const json = (payload) => ({ ok: true, status: 200, json: async () => payload });
  if (u.pathname === '/api/auth/session') return json({ accessToken: 'perf-tok' });
  if (u.pathname === '/backend-api/models') return json({ versions: [] });
  if (u.pathname === '/backend-api/conversation/init') return json({ limits_progress: [{ feature_name: 'image_gen', remaining: 999 }], model_limits: [], blocked_features: [] });
  if (u.pathname === '/backend-api/conversation/' + CONV) return json(threadOf());
  return json({});
};

// ChatGPT-side behavior: Send posts, pulses a visible Stop button, navigates.
window.document.querySelector('button[aria-label="Send"]').addEventListener('click', () => {
  state.sent++;
  const stop = window.document.createElement('button');
  stop.setAttribute('aria-label', 'Stop'); stop.setAttribute('data-test-visible', '');
  window.document.body.appendChild(stop);
  window.history.pushState({}, '', '/c/' + CONV);
  window.setTimeout(() => stop.remove(), 300); // page-side timer: runs on the scaled clock
});

window.eval(CODE);
const host = window.document.getElementById('bulkimg-host');
const p = (s) => host.shadowRoot.querySelector(s);
p('.fab').click(); // open the panel (renders limits, populates selects)

// Seed JOBS pending jobs through the panel's real Generate flow (same-chat mode).
p('#p').value = 'perf prompt';
p('#n').value = String(JOBS);
p('#d').value = '0';
p('#m').value = 'same';
p('.go').click();
await new Promise((resolve) => {
  const t0 = Date.now();
  const iv = realSetInterval(() => {
    const m = p('#galTitle').textContent.match(/(\d+)\/(\d+)$/);
    if ((m && Number(m[2]) === JOBS) || Date.now() - t0 > 60000) { realClearInterval(iv); resolve(); }
  }, 10);
});

// Freeze the real intervals so the measured region contains only the tick loop.
if (pollId !== null) realClearInterval(pollId);
if (attachId !== null) realClearInterval(attachId);

for (let t = 0; t < TICKS; t++) {
  await pollCb();
  await new Promise((r) => realSetTimeout(r, 0));
}

// Observable-output fingerprint: gallery counter + serialized tile grid.
const grid = p('.grid');
const fingerprint = JSON.stringify({
  title: p('#galTitle').textContent,
  tiles: [...grid.children].map((c) => `${c.className}|${c.querySelector('.n') ? c.querySelector('.n').textContent : ''}`),
  sent: state.sent,
});
console.log(fingerprint);
window.close();
process.exit(0);
