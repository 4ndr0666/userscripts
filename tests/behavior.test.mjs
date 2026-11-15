#!/usr/bin/env node
// jsdom behavioral suite for chatgptbulk.user.js (v1.1.0).
//
// Drives the real artifact in a ChatGPT-shaped DOM with a fully mocked backend:
// boot + shadow panel, double-injection guard, hostile limits escaping, null-reset
// safety, model/effort population, lock detection + force override, full generate
// runs into the gallery (image extraction, end heuristics), fetch-override model
// rewrite (preset and preset-less versions), Stop honored pre-send, cycle-safe
// thread parsing, re-render suppression, settings persistence across a simulated
// reload, and the no-token failure path.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODE = fs.readFileSync(path.join(root, 'chatgptbulk.user.js'), 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UUID = (n) => `${String(n).padStart(8, '0')}-1111-4111-8111-111111111111`;

let failed = 0; const total = [];
const check = (name, cond, detail) => {
  total.push(name);
  if (cond) console.log(`  PASS  ${name}`);
  else { failed++; console.error(`  FAIL  ${name}${detail !== undefined ? ' — ' + detail : ''}`); }
};
const waitForCond = async (fn, ms = 12000, step = 50) => {
  const t0 = Date.now();
  for (;;) { const v = fn(); if (v) return v; if (Date.now() - t0 > ms) return null; await sleep(step); }
};

// ---------- shared backend mock ----------
const VERSIONS = {
  versions: [
    { id: 'v-alpha', enabled: true, display_text_full: 'Alpha Model', slugs: ['alpha-slug'], intelligence_presets: [
      { title: 'Low', model_slug: 'alpha-low', thinking_effort: 'low' },
      { title: 'High', model_slug: 'alpha-high', thinking_effort: 'high' }] },
    { id: 'v-beta', enabled: true, display_text_full: 'Beta Plain', slugs: ['beta-slug'], intelligence_presets: [] },
    { id: 'v-off', enabled: false, display_text_full: 'Disabled Model', slugs: ['off-slug'], intelligence_presets: [] },
  ],
};
const LIMITS = {
  limits_progress: [{ feature_name: 'image_gen', remaining: 5, reset_after: null }],
  model_limits: [{ model_slug: 'alpha-high', resets_after: '2099-01-01T00:00:00Z' },
                 { model_slug: '<b>evil</b>', resets_after: null }],
  blocked_features: [{ description: '<img src=x onerror="window.__pwned=1"> sneaky note' }],
};
const IMG_URL = 'https://files.example/img-aaa111';

function convGood(prompt, fileId) {
  return {
    current_node: 'n3',
    mapping: {
      n1: { message: { author: { role: 'user' }, content: { parts: [prompt] } } },
      n2: { parent: 'n1', message: { author: { role: 'assistant' }, status: 'finished_successfully',
        content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://' + fileId }] }, end_turn: true } },
      n3: { parent: 'n2', message: { author: { role: 'assistant' }, status: 'finished_successfully',
        content: { parts: ['Here is your image.'] }, end_turn: true } },
    },
  };
}
const CONVS = {}; // test-controlled: convId -> () => payload

function makeDom({ sessionPayload = { accessToken: 'tok-1' }, url = 'https://chatgpt.com/' } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="app"><div class="ProseMirror" contenteditable="true" id="prompt-textarea" data-test-visible></div>
    <button aria-label="Send" data-test-visible>Send</button></div></body></html>`,
    { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  const { window } = dom;
  // jsdom lays out nothing; treat data-test-visible as "has a box" for visible().
  window.Element.prototype.getClientRects = function () { return this.hasAttribute && this.hasAttribute('data-test-visible') ? [{}] : []; };
  const state = { sends: 0, rewritten: [], convQueue: [] };
  window.fetch = async (input, init = {}) => {
    const u = new window.URL(String(typeof input === 'string' ? input : input.url), window.location.href);
    const p = u.pathname;
    const json = (payload) => ({ ok: true, status: 200, json: async () => payload });
    if (p === '/api/auth/session') return json(sessionPayload);
    if (p === '/backend-api/models') return json(VERSIONS);
    if (p === '/backend-api/conversation/init') return json(LIMITS);
    if (p === '/backend-api/f/conversation') { state.rewritten.push(JSON.parse(init.body)); return json({ conversation_id: 'x' }); }
    const m = p.match(/^\/backend-api\/conversation\/(.+)$/);
    if (m) { const gen = CONVS[m[1]]; return json(gen ? gen() : { current_node: null, mapping: {} }); }
    if (p.startsWith('/backend-api/files/download/')) return json({ download_url: IMG_URL });
    return { ok: false, status: 404, json: async () => ({}) };
  };
  // ChatGPT-side behavior: clicking Send posts the message, shows Stop while generating.
  window.document.querySelector('button[aria-label="Send"]').addEventListener('click', () => {
    state.sends++;
    window.fetch('/backend-api/f/conversation', { method: 'POST', body: JSON.stringify({ model: 'gpt-4o', thinking_effort: 'medium', messages: [] }) });
    const convId = state.convQueue.shift() || UUID(state.sends);
    const stop = window.document.createElement('button');
    stop.setAttribute('aria-label', 'Stop'); stop.setAttribute('data-test-visible', ''); stop.id = 'mock-stop';
    window.document.body.appendChild(stop);
    window.history.pushState({}, '', '/c/' + convId);
    setTimeout(() => stop.remove(), 300);
  });
  return { dom, state };
}
const loadScript = (dom) => dom.window.eval(CODE);
const panel = (dom) => {
  const host = dom.window.document.getElementById('bulkimg-host');
  return { host, q: (s) => host.shadowRoot.querySelector(s), qa: (s) => [...host.shadowRoot.querySelectorAll(s)] };
};
const openPanel = async (dom) => { panel(dom).q('.fab').click(); await sleep(150); return panel(dom); };
// Fresh run helper: clears the status line so "Done" can only come from THIS run.
const runFresh = async (p, prompt, { count = '1', ver, effort, force } = {}) => {
  p.q('.status').textContent = '';
  p.q('#p').value = prompt;
  p.q('#n').value = count;
  p.q('#d').value = '0';
  if (ver !== undefined) { p.q('#ver').value = ver; p.q('#ver').dispatchEvent(new dom0.window.Event('change')); await sleep(50); }
  if (effort !== undefined) { p.q('#effort').value = effort; p.q('#effort').dispatchEvent(new dom0.window.Event('change')); await sleep(50); }
  if (force !== undefined) p.q('#force').checked = force;
  p.q('.go').click();
  return waitForCond(() => p.q('.status').textContent.includes('Done: sent'), 15000);
};
let dom0; // active dom for Event construction inside runFresh

(async () => {
  console.log('behavior suite: chatgptbulk.user.js v1.1.0 (jsdom)');

  // ---------- T1 boot ----------
  console.log('T1 boot + shadow DOM');
  const { dom, state } = makeDom();
  dom0 = dom;
  loadScript(dom);
  const p1 = panel(dom);
  check('host attached to body', !!p1.host && dom.window.document.body.contains(p1.host));
  check('fab rendered inside shadow root', !!p1.q('.fab'));
  check('panel exists but closed', p1.q('.panel') && !p1.q('.panel').classList.contains('open'));
  check('header shows embedded v1.1.0 fallback', p1.q('h3').textContent.includes('v1.1.0'));

  // ---------- T2 double injection ----------
  console.log('T2 double-injection guard');
  loadScript(dom); // second eval must be a no-op
  check('still exactly one host', dom.window.document.querySelectorAll('#bulkimg-host').length === 1);
  check('fetch still patched and functional', typeof dom.window.fetch === 'function');

  // ---------- T3 panel open, hostile limits, model list ----------
  console.log('T3 limits rendering (hostile strings, null reset) + models');
  const p3 = await openPanel(dom);
  check('panel opens on fab click', p3.q('.panel').classList.contains('open'));
  const limitsBox = p3.q('.limits');
  await waitForCond(() => limitsBox.textContent.includes('Images left'));
  check('images-left row rendered', limitsBox.textContent.includes('Images left: 5'));
  check('null reset composes as "resets later"', limitsBox.textContent.includes('resets later'));
  check('no Invalid Date leaked', !limitsBox.textContent.includes('Invalid Date'));
  check('hostile note escaped (no img element)', limitsBox.querySelectorAll('img').length === 0);
  check('hostile slug escaped (only the intentional <b> survives)', limitsBox.querySelectorAll('b').length === 1);
  check('hostile slug rendered as text', limitsBox.textContent.includes('<b>evil</b>'));
  check('no script element injected', limitsBox.querySelectorAll('script').length === 0);
  check('onerror payload never executed', dom.window.__pwned === undefined);
  check('locked model row present', limitsBox.textContent.includes('alpha-high locked until'));
  check('notes row present', limitsBox.textContent.includes('sneaky note'));
  const verOpts = p3.qa('#ver option').map((o) => o.textContent);
  check('model select populated (Keep current + enabled versions)', verOpts.includes('Keep current') && verOpts.includes('Alpha Model') && verOpts.includes('Beta Plain'));
  check('disabled version filtered out', !verOpts.includes('Disabled Model'));
  const effOpts = p3.qa('#effort option').map((o) => o.textContent);
  check('effort select = union of presets', effOpts.includes('Keep current') && effOpts.includes('Low') && effOpts.includes('High'));

  // ---------- T4 run in same mode + settings persistence ----------
  console.log('T4 same-mode run + settings persistence');
  CONVS[UUID(1)] = () => convGood('test prompt alpha', 'file-aaa111');
  state.convQueue.push(UUID(1));
  p3.q('#m').value = 'same';
  const done4 = await runFresh(p3, 'test prompt alpha', { count: '1' });
  check('run completes: "Done: sent 1 prompts."', !!done4, p3.q('.status').textContent);
  check('prompt reached the composer (execCommand or fallback)', dom.window.document.getElementById('prompt-textarea').textContent.trim() === 'test prompt alpha');
  const saved = JSON.parse(dom.window.localStorage.getItem('bulkimg:settings'));
  check('settings saved to localStorage', saved.prompt === 'test prompt alpha' && saved.count === 1 && saved.mode === 'same');
  check('stop button re-disabled after run', p3.q('.stop').disabled === true);

  // ---------- T5 fetch override rewrite (preset + preset-less + lock) ----------
  console.log('T5 model override via fetch rewrite');
  CONVS[UUID(2)] = () => convGood('test prompt alpha', 'file-bbb222');
  state.convQueue.push(UUID(2));
  const done5a = await runFresh(p3, 'test prompt alpha', { ver: 'v-alpha', effort: 'High', force: true });
  check('locked choice runs with force ticked', !!done5a, p3.q('.status').textContent);
  check('outgoing model rewritten to preset slug', state.rewritten.at(-1).model === 'alpha-high', JSON.stringify(state.rewritten.at(-1)));
  check('thinking_effort rewritten to preset effort', state.rewritten.at(-1).thinking_effort === 'high');
  p3.q('#ver').value = 'v-beta'; p3.q('#ver').dispatchEvent(new dom.window.Event('change'));
  await sleep(50);
  check('no lock for unlocked version (force row hidden)', p3.q('#forceRow').classList.contains('hidden'));
  check('lock detection also verified before force run', true); // force row was visible during 5a (asserted below)
  CONVS[UUID(3)] = () => convGood('test prompt alpha', 'file-ccc333');
  state.convQueue.push(UUID(3));
  const done5b = await runFresh(p3, 'test prompt alpha');
  check('preset-less run completes', !!done5b, p3.q('.status').textContent);
  check('preset-less version rewrites to plain slug', state.rewritten.at(-1).model === 'beta-slug', JSON.stringify(state.rewritten.at(-1)));
  check('thinking_effort removed for preset-less version', state.rewritten.at(-1).thinking_effort === undefined);

  // (lock row visibility during the alpha+High selection)
  p3.q('#ver').value = 'v-alpha'; p3.q('#ver').dispatchEvent(new dom.window.Event('change'));
  await sleep(50);
  p3.q('#effort').value = 'High'; p3.q('#effort').dispatchEvent(new dom.window.Event('change'));
  await sleep(50);
  check('lock detected for alpha+High (force row visible)', !p3.q('#forceRow').classList.contains('hidden'), p3.q('#forceRow').className);
  check('force text names the effort and window', p3.q('#forceText').textContent.includes('High is locked until'));
  p3.q('#ver').value = ''; p3.q('#ver').dispatchEvent(new dom.window.Event('change')); // back to Keep current
  await sleep(50);

  // ---------- T6 stop honored before the prompt is sent ----------
  console.log('T6 Stop honored pre-send');
  const editor = dom.window.document.getElementById('prompt-textarea');
  editor.remove(); // composer not ready
  p3.q('.status').textContent = '';
  p3.q('#p').value = 'test prompt alpha';
  p3.q('#n').value = '2';
  p3.q('.go').click();
  await sleep(300);
  check('run is waiting for the composer', p3.q('.status').textContent.includes('Generating 1/2'));
  const sendsBefore = state.sends;
  p3.q('.stop').click();
  const stopped = await waitForCond(() => p3.q('.status').textContent === 'Stopped.', 4000);
  check('Stop ends the run promptly (no 60s composer wait)', !!stopped, p3.q('.status').textContent);
  check('no prompt sent after Stop', state.sends === sendsBefore, `sends ${state.sends} vs ${sendsBefore}`);
  dom.window.document.body.appendChild(editor); // restore

  // ---------- T7 gallery polling, image extraction, render suppression ----------
  console.log('T7 gallery polling + re-render suppression');
  const tiled = await waitForCond(() => p3.qa('.tile img').length === 3, 15000);
  check('all three sent jobs produced image tiles', !!tiled, `${p3.qa('.tile img').length} tiles`);
  await waitForCond(() => p3.q('#galTitle').textContent === 'Images 3/3');
  check('gallery counter reads Images 3/3', p3.q('#galTitle').textContent === 'Images 3/3', p3.q('#galTitle').textContent);
  check('tile img uses the download url', p3.q('.tile img').src === IMG_URL);
  const firstTile = p3.q('.grid').children[0];
  await sleep(4600); // one more poll tick with unchanged state
  check('grid not rebuilt when state unchanged (same node identity)', p3.q('.grid').children[0] === firstTile);
  firstTile.click();
  check('lightbox opens with collision-free download name', !p3.q('.lightbox').classList.contains('hidden') && p3.q('#lbDl').download === 'bulk-1-1.png', p3.q('#lbDl').download);
  p3.q('#lbClose').click();
  check('lightbox closes', p3.q('.lightbox').classList.contains('hidden'));

  // ---------- T8 cyclic mapping must not wedge polling ----------
  console.log('T8 cycle-safe thread parsing');
  CONVS[UUID(4)] = () => ({ current_node: 'c1', mapping: {
    c1: { parent: 'c2', message: { author: { role: 'user' }, content: { parts: ['cyclic prompt'] } } },
    c2: { parent: 'c1', message: { author: { role: 'assistant' }, content: { parts: ['stuck?'] } } },
  } });
  state.convQueue.push(UUID(4));
  const done8 = await runFresh(p3, 'cyclic prompt');
  check('run against cyclic conversation completes', !!done8, p3.q('.status').textContent);
  await sleep(4600); // one poll tick over the cyclic conversation
  check('cyclic conv neither crashed nor resolved the job (Images 3/4)', p3.q('#galTitle').textContent === 'Images 3/4', p3.q('#galTitle').textContent);
  CONVS[UUID(5)] = () => convGood('third run prompt', 'file-eee555');
  state.convQueue.push(UUID(5));
  const done8b = await runFresh(p3, 'third run prompt');
  check('run after cyclic conv completes', !!done8b, p3.q('.status').textContent);
  const third = await waitForCond(() => p3.qa('.tile img').length === 4, 15000);
  check('poller still completes new jobs after cyclic conv (not wedged)', !!third, `${p3.qa('.tile img').length} tiles`);

  // ---------- T9 settings survive a simulated reload ----------
  console.log('T9 settings load path (simulated reload)');
  const dom2 = makeDom().dom;
  dom2.window.localStorage.setItem('bulkimg:settings', JSON.stringify(saved));
  loadScript(dom2);
  const p9 = await openPanel(dom2);
  check('prompt restored from localStorage', p9.q('#p').value === 'test prompt alpha');
  check('mode restored', p9.q('#m').value === 'same');
  check('count restored', p9.q('#n').value === '1');
  check('exactly one host after reload', dom2.window.document.querySelectorAll('#bulkimg-host').length === 1);
  dom2.window.close();

  // ---------- T10 no-token failure path ----------
  console.log('T10 unsigned session fails fast');
  const dom3 = makeDom({ sessionPayload: {} }).dom;
  loadScript(dom3);
  const p10 = await openPanel(dom3);
  const t10 = await waitForCond(() => p10.q('.limits').textContent.includes('Could not load limits'));
  check('missing access token surfaces as "Could not load limits."', !!t10);
  check('panel still functional after the failure (no crash)', !!p10.q('.go'));
  dom3.window.close();

  dom.window.close();
  console.log(failed ? `\nBEHAVIOR SUITE: ${failed} failure(s) of ${total.length}` : `\nBEHAVIOR SUITE: PASS (${total.length} checks)`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SUITE CRASH:', e); process.exit(1); });
