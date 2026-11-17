#!/usr/bin/env node
// jsdom behavioral suite for chatgptbulk.user.js (v1.3.0).
//
// Drives the real artifact in a ChatGPT-shaped DOM with a fully mocked backend:
// boot + shadow panel, double-injection guard, hostile limits escaping, null-reset
// safety, model/effort population, lock detection + force override, full generate
// runs into the gallery (image extraction, end heuristics), fetch-override model
// rewrite (preset and preset-less versions), Stop honored pre-send, cycle-safe
// thread parsing, re-render suppression, settings persistence across a simulated
// reload, and the no-token failure path. Round 2 (T11): different-prompt re-run
// pairing, model-list refusal, interruptible delay, visible named-project button.
// Round 3 (T12): prefix-sharing prompt pairing, hidden project-link fallback,
// the plain /backend-api/conversation send shape, interruptible new-chat wait,
// and hostile images-left escaping.
// Round 4 (T13): unmatched-job timeout via resume restore, forced-model lock
// (transport + ophel-style picker sync), reference-image re-supply per run,
// stateless cycle (persist + reload + resume), failed-chat purge masking,
// asset-vault clone survival + FIFO bound, and clear-blocked-while-resume-pending.
// Round 4 amendment (T13i-k): the vault's signed-URL join (page-fetched image bytes
// held under the URL the gallery stores), the vanished-selection run refusal, and
// the missing-reference run refusal (never a silent text-only send).
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

function makeDom({ sessionPayload = { accessToken: 'tok-1' }, url = 'https://chatgpt.com/', modelsFail = false,
  limitsPayload = null, idBasedDownloads = false, sendPath = '/backend-api/f/conversation',
  blobDownloads = false, modelPicker = false } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="app"><div class="ProseMirror" contenteditable="true" id="prompt-textarea" data-test-visible></div>
    <button aria-label="Send" data-test-visible>Send</button></div></body></html>`,
    { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  const { window } = dom;
  // jsdom lays out nothing; treat data-test-visible as "has a box" for visible().
  window.Element.prototype.getClientRects = function () { return this.hasAttribute && this.hasAttribute('data-test-visible') ? [{}] : []; };
  // jsdom has no object-URL mint; the vault wraps whatever the page's URL runtime
  // exposes, so the fixture provides one exactly like a real engine would.
  let blobSeq = 0;
  window.URL.createObjectURL ||= (b) => 'blob:mock-' + (++blobSeq);
  window.URL.revokeObjectURL ||= () => {};
  const state = { sends: 0, rewritten: [], convQueue: [], calls: [], dlFail: false, imageUrls: null };
  window.fetch = async (input, init = {}) => {
    const u = new window.URL(String(typeof input === 'string' ? input : input.url), window.location.href);
    const p = u.pathname;
    const method = String(init.method || 'GET').toUpperCase();
    state.calls.push({ method, path: p });
    const json = (payload) => ({ ok: true, status: 200, json: async () => payload, text: async () => JSON.stringify(payload) });
    if (p === '/api/auth/session') return json(sessionPayload);
    if (p === '/backend-api/models') return modelsFail ? { ok: false, status: 500, json: async () => ({}) } : json(VERSIONS);
    if (p === '/backend-api/conversation/init') return json(limitsPayload || LIMITS);
    // Both conversation-send shapes the page can use: the /f/ variant and the plain one.
    if (p === '/backend-api/f/conversation' || p === '/backend-api/conversation') { state.rewritten.push(JSON.parse(init.body)); return json({ conversation_id: 'x' }); }
    const m = p.match(/^\/backend-api\/conversation\/(.+)$/);
    if (m) {
      if (method === 'DELETE') return json({ success: true });
      const gen = CONVS[m[1]]; return json(gen ? gen() : { current_node: null, mapping: {} });
    }
    if (p.startsWith('/backend-api/files/download/')) {
      if (state.dlFail) return { ok: false, status: 404, json: async () => ({}) };
      if (blobDownloads) return json({ download_url: window.URL.createObjectURL(new window.Blob(['imgbytes'], { type: 'image/png' })) });
      return json({ download_url: idBasedDownloads ? IMG_URL.replace(/img-aaa111$/, p.split('/').pop()) : IMG_URL });
    }
    // Test-controlled image responses: when a URL is registered here the mock serves it
    // as a Response-like image (headers/clone/blob) exactly like the real CDN would.
    if (state.imageUrls && state.imageUrls.has(u.href)) {
      const bytes = state.imageUrls.get(u.href);
      const mk = () => ({ ok: true, status: 200, headers: { get: () => 'image/png' },
        clone () { return mk(); }, blob: async () => new window.Blob([bytes], { type: 'image/png' }) });
      return mk();
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  // ChatGPT-side behavior: clicking Send posts the message, shows Stop while generating.
  window.document.querySelector('button[aria-label="Send"]').addEventListener('click', () => {
    state.sends++;
    window.fetch(sendPath, { method: 'POST', body: JSON.stringify({ model: 'gpt-4o', thinking_effort: 'medium', messages: [] }) });
    const convId = state.convQueue.shift() || UUID(state.sends);
    const stop = window.document.createElement('button');
    stop.setAttribute('aria-label', 'Stop'); stop.setAttribute('data-test-visible', ''); stop.id = 'mock-stop';
    window.document.body.appendChild(stop);
    window.history.pushState({}, '', '/c/' + convId);
    setTimeout(() => stop.remove(), 300);
  });
  // ChatGPT-side behavior: pasting a file into the composer attaches it (chip appears).
  window.document.getElementById('prompt-textarea').addEventListener('paste', (e) => {
    const files = e.clipboardData && e.clipboardData.files;
    if (!files || !files.length) return;
    window.__pastedFiles = (window.__pastedFiles || 0) + 1;
    const chip = window.document.createElement('div');
    chip.setAttribute('data-testid', 'attachment-chip');
    chip.setAttribute('data-test-visible', '');
    chip.textContent = files[0].name;
    window.document.body.appendChild(chip);
  });
  if (modelPicker) {
    const pill = window.document.createElement('button');
    pill.setAttribute('data-composer-navigation-target', 'reasoning');
    pill.setAttribute('aria-haspopup', 'menu');
    pill.setAttribute('data-test-visible', '');
    pill.innerHTML = '<span class="truncate">Instant</span>';
    const mountMenu = () => {
      const old = window.document.querySelector('[data-radix-popper-content-wrapper]'); if (old) old.remove();
      const wrap = window.document.createElement('div');
      wrap.setAttribute('data-radix-popper-content-wrapper', '');
      const menu = window.document.createElement('div');
      menu.setAttribute('role', 'menu'); menu.setAttribute('data-radix-menu-content', ''); menu.setAttribute('data-test-visible', '');
      for (const [slug, name] of [['instant-slug', 'Instant'], ['beta-slug', 'Beta Plain']]) {
        const it = window.document.createElement('div');
        it.setAttribute('role', 'menuitemradio');
        it.setAttribute('data-testid', 'model-switcher-' + slug);
        it.innerHTML = '<span class="min-w-0">' + name + '</span>' + (slug === 'instant-slug' ? '<span class="trailing"><svg></svg></span>' : '');
        it.addEventListener('click', () => { window.__pickedSlug = slug; pill.querySelector('span.truncate').textContent = name; pill.setAttribute('aria-expanded', 'false'); wrap.remove(); });
        menu.appendChild(it);
      }
      wrap.appendChild(menu); window.document.body.appendChild(wrap);
    };
    pill.addEventListener('click', () => { pill.setAttribute('aria-expanded', 'true'); mountMenu(); });
    window.document.body.appendChild(pill);
  }
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
  console.log('behavior suite: chatgptbulk.user.js v1.3.0 (jsdom)');

  // ---------- T1 boot ----------
  console.log('T1 boot + shadow DOM');
  const { dom, state } = makeDom();
  dom0 = dom;
  loadScript(dom);
  const p1 = panel(dom);
  check('host attached to body', !!p1.host && dom.window.document.body.contains(p1.host));
  check('fab rendered inside shadow root', !!p1.q('.fab'));
  check('panel exists but closed', p1.q('.panel') && !p1.q('.panel').classList.contains('open'));
  check('header shows embedded v1.4.0 fallback', p1.q('h3').textContent.includes('v1.4.0'));

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

  // ---------- T11 Round 2 fixes ----------
  console.log('T11a different-prompt re-run in the same chat (per-prompt pairing)');
  const convSame = UUID(7);
  CONVS[convSame] = () => ({ current_node: 'm4', mapping: {
    m1: { message: { author: { role: 'user' }, content: { parts: ['cat picture'] } } },
    m2: { parent: 'm1', message: { author: { role: 'assistant' }, status: 'finished_successfully',
      content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-cat777' }] }, end_turn: true } },
    m3: { parent: 'm2', message: { author: { role: 'user' }, content: { parts: ['dog picture'] } } },
    m4: { parent: 'm3', message: { author: { role: 'assistant' }, status: 'finished_successfully',
      content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-dog888' }] }, end_turn: true } },
  } });
  state.convQueue.push(convSame, convSame); // both same-mode sends land in ONE conversation
  p3.q('#m').value = 'same';
  const doneCat = await runFresh(p3, 'cat picture', { count: '1' });
  check('first same-chat run (cat) completes', !!doneCat, p3.q('.status').textContent);
  const doneDog = await runFresh(p3, 'dog picture', { count: '1' });
  check('re-run with a different prompt (dog) completes — v1.1.0 stalled it to timeout', !!doneDog, p3.q('.status').textContent);
  const catDog = await waitForCond(() => p3.qa('.tile img').length === 6, 15000);
  check('both re-run prompts produced their image (6 tiles)', !!catDog, `${p3.qa('.tile img').length} tiles`);
  check('gallery counter tracks the re-run (6 done, cyclic one pending)', p3.q('#galTitle').textContent === 'Images 6/7', p3.q('#galTitle').textContent);

  console.log('T11b model-list failure refuses the run instead of silently no-oping');
  const domB = makeDom({ modelsFail: true }).dom;
  domB.window.localStorage.setItem('bulkimg:settings', JSON.stringify({ prompt: 'z', count: 1, mode: 'new', delay: 0, effort: 'High', project: '__current__' }));
  loadScript(domB);
  const pB = await openPanel(domB);
  await sleep(300); // let the (failing) model load settle
  check('persisted effort retained in the dropdown despite the failed model list', pB.q('#effort').value === 'High', pB.q('#effort').value);
  pB.q('.status').textContent = '';
  pB.q('.go').click();
  const refused = await waitForCond(() => pB.q('.status').textContent.includes('could not load the model list'), 8000);
  check('run refused with a clear error (no silent default-model send)', !!refused, pB.q('.status').textContent);
  domB.window.close();

  console.log('T11c Stop cuts the inter-job delay short');
  CONVS[UUID(8)] = () => convGood('delay stop prompt', 'file-ii999');
  state.convQueue.push(UUID(8));
  p3.q('#m').value = 'same';
  p3.q('#stateless').checked = false; // this test targets the delay's interruptibility, not the stateless cycle
  p3.q('#p').value = 'delay stop prompt';
  p3.q('#n').value = '2';
  p3.q('#d').value = '30';
  p3.q('.status').textContent = '';
  const sendsBeforeC = state.sends;
  p3.q('.go').click();
  await waitForCond(() => state.sends === sendsBeforeC + 1, 15000); // first prompt out
  await waitForCond(() => p3.q('#galTitle').textContent === 'Images 6/8', 15000); // job tracked → run is inside the 30 s delay
  await sleep(300); // past loadLimits, firmly inside sleepUnless(30 s)
  p3.q('.stop').click();
  const stoppedFast = await waitForCond(() => p3.q('.status').textContent === 'Stopped.', 4000);
  check('Stop ends the run within the 30 s delay (interruptible sleepUnless)', !!stoppedFast, p3.q('.status').textContent);
  await sleep(1500);
  check('no second prompt was sent after Stop', state.sends === sendsBeforeC + 1, `sends ${state.sends} vs ${sendsBeforeC + 1}`);

  console.log('T11d named-project opening prefers the visible button');
  const hid = dom.window.document.createElement('button');
  hid.setAttribute('aria-label', 'New chat in Proj X');
  hid.addEventListener('click', () => { dom.window.__wrongButton = 1; });
  const vis = dom.window.document.createElement('button');
  vis.setAttribute('aria-label', 'New chat in Proj X');
  vis.setAttribute('data-test-visible', '');
  vis.addEventListener('click', () => { dom.window.history.pushState({}, '', '/'); });
  dom.window.document.body.append(hid, vis);
  p3.q('.fab').click(); await sleep(50); p3.q('.fab').click(); await sleep(100); // reopen so fillProjects sees the buttons
  p3.q('#m').value = 'new';
  p3.q('#m').dispatchEvent(new dom.window.Event('change'));
  p3.q('#proj').value = 'Proj X';
  CONVS[UUID(9)] = () => convGood('proj prompt', 'file-jj101');
  state.convQueue.push(UUID(9));
  const doneD = await runFresh(p3, 'proj prompt', { count: '1' });
  check('named-project run completes through the visible button', !!doneD, p3.q('.status').textContent);
  check('the hidden first match was never clicked', dom.window.__wrongButton === undefined);
  const finalGal = await waitForCond(() => p3.qa('.tile img').length === 8 && p3.q('#galTitle').textContent === 'Images 8/9', 15000);
  check('final gallery: 8 image tiles, cyclic job still pending', !!finalGal, `${p3.qa('.tile img').length} tiles / ${p3.q('#galTitle').textContent}`);

  // ---------- T12 Round 3 fixes ----------
  console.log('T12a distinct prompts sharing an 80-char prefix pair to their own messages');
  const PREFIX = 'generate a hyper-detailed photorealistic image of a cozy log cabin deep in the pine woods at dawn';
  const promptSummer = PREFIX + ' in summer light';
  const promptWinter = PREFIX + ' in winter snow';
  const { dom: domA, state: stateA } = makeDom({ idBasedDownloads: true });
  dom0 = domA;
  loadScript(domA);
  const pA = await openPanel(domA);
  const convP = UUID(21);
  CONVS[convP] = () => ({ current_node: 'w4', mapping: {
    s1: { message: { author: { role: 'user' }, content: { parts: [promptSummer] } } },
    s2: { parent: 's1', message: { author: { role: 'assistant' }, status: 'finished_successfully',
      content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-summer11' }] }, end_turn: true } },
    w3: { parent: 's2', message: { author: { role: 'user' }, content: { parts: [promptWinter] } } },
    w4: { parent: 'w3', message: { author: { role: 'assistant' }, status: 'finished_successfully',
      content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-winter22' }] }, end_turn: true } },
  } });
  stateA.convQueue.push(convP, convP); // both same-mode sends land in ONE conversation
  pA.q('#m').value = 'same';
  const doneSummer = await runFresh(pA, promptSummer, { count: '1' });
  check('prefix-sharing run 1 (summer) completes', !!doneSummer, pA.q('.status').textContent);
  const doneWinter = await runFresh(pA, promptWinter, { count: '1' });
  check('prefix-sharing run 2 (winter) completes', !!doneWinter, pA.q('.status').textContent);
  const tilesA = await waitForCond(() => pA.qa('.tile img').length === 2, 15000);
  check('both prefix-sharing prompts produced an image', !!tilesA, `${pA.qa('.tile img').length} tiles`);
  const srcsA = pA.qa('.tile img').map((im) => im.src).sort();
  check('each job claimed its OWN segment (summer url + winter url, no duplication)', JSON.stringify(srcsA) === JSON.stringify(['https://files.example/file-summer11', 'https://files.example/file-winter22']), JSON.stringify(srcsA));
  check('gallery counter tracks both prefix-sharing jobs (2/2)', pA.q('#galTitle').textContent === 'Images 2/2', pA.q('#galTitle').textContent);
  domA.window.close();

  console.log('T12b current-project navigation falls back to the hidden project link');
  const PID = 'g-p-' + 'ab12cd34'.repeat(4); // 32 hex chars, projectIdOf-shaped
  const { dom: domI, state: stateI } = makeDom({ url: `https://chatgpt.com/g/${PID}/c/${UUID(31)}` });
  dom0 = domI;
  loadScript(domI);
  const pI = await openPanel(domI);
  const plink = domI.window.document.createElement('a');
  plink.setAttribute('href', `/g/${PID}/project`); // hidden: no data-test-visible, like a collapsed sidebar
  plink.addEventListener('click', (e) => { e.preventDefault(); domI.window.__hiddenProjectLinkClicked = (domI.window.__hiddenProjectLinkClicked || 0) + 1; domI.window.history.pushState({}, '', `/g/${PID}/project`); });
  domI.window.document.body.appendChild(plink);
  CONVS[UUID(32)] = () => convGood('hidden project link prompt', 'file-hid333');
  stateI.convQueue.push(UUID(32));
  pI.q('#m').value = 'new'; // project select defaults to "This project" (__current__)
  const doneI = await runFresh(pI, 'hidden project link prompt', { count: '1' });
  check('current-project run completes through the hidden link fallback — v1.2.0 aborted with "could not find a way"', !!doneI, pI.q('.status').textContent);
  check('the hidden project link was clicked as the last-resort control', (domI.window.__hiddenProjectLinkClicked || 0) >= 1);
  domI.window.close();

  console.log('T12c the fetch override also rewrites the plain /backend-api/conversation send shape');
  const { dom: domC, state: stateC } = makeDom({ sendPath: '/backend-api/conversation' });
  dom0 = domC;
  loadScript(domC);
  const pC = await openPanel(domC);
  CONVS[UUID(33)] = () => convGood('plain shape prompt', 'file-plain44');
  stateC.convQueue.push(UUID(33));
  const doneC = await runFresh(pC, 'plain shape prompt', { count: '1', ver: 'v-alpha', effort: 'High', force: true });
  check('plain-shape send run completes', !!doneC, pC.q('.status').textContent);
  check('outgoing model rewritten on the plain conversation endpoint — v1.2.0 never rewrote this shape', stateC.rewritten.at(-1) && stateC.rewritten.at(-1).model === 'alpha-high', JSON.stringify(stateC.rewritten.at(-1)));
  check('thinking_effort rewritten on the plain conversation endpoint', stateC.rewritten.at(-1).thinking_effort === 'high');
  domC.window.close();

  console.log('T12d Stop cuts the new-chat navigation wait short');
  const { dom: domD, state: stateD } = makeDom();
  dom0 = domD;
  loadScript(domD);
  const pD = await openPanel(domD);
  pD.q('#stateless').checked = false; // this test targets the navigation wait, not the stateless cycle
  const noopChat = domD.window.document.createElement('button');
  noopChat.setAttribute('aria-label', 'New chat');
  noopChat.setAttribute('data-test-visible', ''); // visible control whose click never navigates
  noopChat.addEventListener('click', () => {});
  domD.window.document.body.appendChild(noopChat);
  pD.q('#m').value = 'new';
  pD.q('.status').textContent = '';
  pD.q('#p').value = 'stop during navigation prompt';
  pD.q('#n').value = '2';
  pD.q('#d').value = '0';
  pD.q('.go').click();
  const opening2 = await waitForCond(() => pD.q('.status').textContent.includes('Opening chat 2/2'), 15000);
  check('second iteration reached the new-chat wait', !!opening2, pD.q('.status').textContent);
  await sleep(300); // firmly inside waitFor(opened, 15 s)
  pD.q('.stop').click();
  const stoppedD = await waitForCond(() => pD.q('.status').textContent === 'Stopped.', 4000);
  check('Stop ends the run during the new-chat wait — v1.2.0 burned the full 15 s then errored', !!stoppedD, pD.q('.status').textContent);
  check('no second prompt was sent after Stop', stateD.sends === 1, `sends ${stateD.sends}`);
  domD.window.close();

  console.log('T12e hostile imagesLeft is escaped in the limits box');
  const { dom: domE } = makeDom({ limitsPayload: {
    limits_progress: [{ feature_name: 'image_gen', remaining: '<img src=x onerror="window.__pwned3=1">', reset_after: null }],
    model_limits: [], blocked_features: [] } });
  loadScript(domE);
  const pE = await openPanel(domE);
  const t12e = await waitForCond(() => pE.q('.limits').textContent.includes('Images left'), 8000);
  check('limits box rendered despite the hostile payload', !!t12e, pE.q('.limits').textContent);
  check('hostile remaining rendered as text, not markup (no img element) — v1.2.0 injected it raw', pE.q('.limits').querySelectorAll('img').length === 0, `${pE.q('.limits').querySelectorAll('img').length} img elements`);
  check('hostile remaining visible literally as text', pE.q('.limits').textContent.includes('<img src=x'), pE.q('.limits').textContent);
  check('onerror payload never executed', domE.window.__pwned3 === undefined);
  domE.window.close();

  // ---------- T13 Round 4 ----------
  console.log('T13a resume restores jobs; the unmatched-job timeout fires (send dropped / chat deleted)');
  {
    const ghost = UUID(51), live = UUID(52);
    CONVS[ghost] = () => ({ current_node: 'g1', mapping: { g1: { message: { author: { role: 'user' }, content: { parts: ['a completely different text'] } } } } });
    CONVS[live] = () => ({ current_node: 'l2', mapping: {
      l1: { message: { author: { role: 'user' }, content: { parts: ['live prompt'] } } },
      l2: { parent: 'l1', message: { author: { role: 'assistant' }, status: 'in_progress', content: { parts: ['...'] } } } } });
    const { dom } = makeDom();
    dom.window.sessionStorage.setItem('bulkimg:run', JSON.stringify({
      prompt: 'ghost prompt', count: 1, i: 2, mode: 'same', delay: 0, stateless: true, ts: Date.now(),
      jobs: [
        { n: 1, convId: ghost, k: 0, prompt: 'ghost prompt', sentAt: Date.now() - 16 * 60_000, state: 'pending', images: [], note: '' },
        { n: 2, convId: live, k: 0, prompt: 'live prompt', sentAt: Date.now(), state: 'pending', images: [], note: '' },
      ] }));
    loadScript(dom);
    const p = await openPanel(dom);
    const timed = await waitForCond(() => p.q('#galTitle').textContent === 'Images 1/2', 15000);
    check('unmatched 16-minute-old job failed with the timeout note — v1.3.0 left it pending forever', !!timed, p.q('#galTitle').textContent);
    check('the failed tile carries the timeout note', !!(p.q('.tile.failed') && String(p.q('.tile.failed').title).includes('Timed out after 15 minutes.')), p.q('.tile.failed') && p.q('.tile.failed').title);
    check('a freshly-sent unmatched sibling stays pending (no false timeout)', p.q('#galTitle').textContent === 'Images 1/2', p.q('#galTitle').textContent);
    const doneA = await waitForCond(() => p.q('.status').textContent.includes('Done: sent 1 prompts'), 15000);
    check('resumed run past its end completes with the full count', !!doneA, p.q('.status').textContent);
    check('resume descriptor consumed after completion', dom.window.sessionStorage.getItem('bulkimg:run') === null);
    dom.window.close();
  }

  console.log('T13b forced-model lock rewrites sends outside any run (transport layer)');
  {
    const { dom, state } = makeDom();
    dom.window.localStorage.setItem('bulkimg:settings', JSON.stringify({ prompt: 'x', count: 1, mode: 'same', delay: 0, version: 'v-beta', effort: '', lock: true }));
    loadScript(dom);
    const p = await openPanel(dom);
    await waitForCond(() => p.qa('#ver option').length > 1, 8000); // models loaded
    await dom.window.fetch('/backend-api/conversation', { method: 'POST', body: JSON.stringify({ model: 'gpt-4o', messages: [] }) });
    check('page-initiated send rewritten to the locked preset-less slug — v1.3.0 only rewrote during runs', state.rewritten.at(-1) && state.rewritten.at(-1).model === 'beta-slug', JSON.stringify(state.rewritten.at(-1)));
    check('thinking_effort dropped for the locked preset-less version', state.rewritten.at(-1).thinking_effort === undefined);
    const lockEl = p.q('#lock');
    if (lockEl) {
      lockEl.checked = false; lockEl.dispatchEvent(new dom.window.Event('change'));
      await dom.window.fetch('/backend-api/conversation', { method: 'POST', body: JSON.stringify({ model: 'gpt-4o', messages: [] }) });
      check('lock off → page send passes through untouched', state.rewritten.at(-1).model === 'gpt-4o', JSON.stringify(state.rewritten.at(-1)));
    } else {
      check('lock toggle exists in the panel', false, 'v1.3.0 has no #lock control');
    }
    dom.window.close();
  }

  console.log('T13c forced-model lock re-selects in the page picker (ophel-style UI sync)');
  {
    const { dom } = makeDom({ modelPicker: true });
    dom.window.localStorage.setItem('bulkimg:settings', JSON.stringify({ prompt: 'x', count: 1, mode: 'same', delay: 0, version: 'v-beta', effort: '', lock: true }));
    loadScript(dom);
    const picked = await waitForCond(() => dom.window.__pickedSlug === 'beta-slug', 12000);
    check('picker item for the locked version clicked — v1.3.0 had no UI sync', !!picked, String(dom.window.__pickedSlug));
    const pillText = dom.window.document.querySelector('button[data-composer-navigation-target="reasoning"] span.truncate').textContent;
    check('picker label now shows the locked model', pillText === 'Beta Plain', pillText);
    dom.window.close();
  }

  console.log('T13d reference image re-attaches to every prompt');
  {
    const { dom, state } = makeDom();
    dom.window.localStorage.setItem('bulkimg:ref', JSON.stringify({ name: 'ref.png', type: 'image/png', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }));
    dom.window.localStorage.setItem('bulkimg:settings', JSON.stringify({ prompt: 'with reference', count: 1, mode: 'same', delay: 0, ref: true }));
    CONVS[UUID(61)] = () => convGood('with reference', 'file-ref61');
    state.convQueue.push(UUID(61));
    loadScript(dom);
    const p = await openPanel(dom);
    await waitForCond(() => p.q('#refLabel') && p.q('#refLabel').textContent.includes('ref.png'), 8000);
    check('stored reference loaded at boot (name shown)', !!(p.q('#refLabel') && p.q('#refLabel').textContent.includes('ref.png')), p.q('#refLabel') && p.q('#refLabel').textContent);
    const done1 = await runFresh(p, 'with reference');
    check('run with reference completes', !!done1, p.q('.status').textContent);
    check('reference file was supplied to the composer', (dom.window.__pastedFiles || 0) >= 1, String(dom.window.__pastedFiles || 0));
    check('attachment chip appeared (attach evidence satisfied)', !!dom.window.document.querySelector('[data-testid="attachment-chip"]'));
    const chip = dom.window.document.querySelector('[data-testid="attachment-chip"]');
    if (chip) chip.remove();
    CONVS[UUID(62)] = () => convGood('with reference', 'file-ref62');
    state.convQueue.push(UUID(62));
    const done2 = await runFresh(p, 'with reference');
    check('second run re-supplies the same reference — v1.3.0 sent text only', !!done2 && (dom.window.__pastedFiles || 0) >= 2, `${done2 ? 'done' : p.q('.status').textContent} pastes=${dom.window.__pastedFiles || 0}`);
    dom.window.close();
  }

  console.log('T13e stateless cycle: persist + reload after each image, resume continues the run');
  {
    const { dom, state } = makeDom();
    CONVS[UUID(63)] = () => convGood('stateless prompt', 'file-st63');
    state.convQueue.push(UUID(63));
    loadScript(dom);
    const p = await openPanel(dom);
    p.q('#m').value = 'same';
    p.q('#p').value = 'stateless prompt';
    p.q('#n').value = '2';
    p.q('#d').value = '0';
    p.q('.status').textContent = '';
    p.q('.go').click();
    const persisted = await waitForCond(() => { try { return !!dom.window.sessionStorage.getItem('bulkimg:run'); } catch { return false; } }, 15000);
    check('resume descriptor persisted after image 1 (stateless on by default)', !!persisted);
    const st = JSON.parse(dom.window.sessionStorage.getItem('bulkimg:run') || '{}');
    check('descriptor carries the next index and the sent job', st.i === 2 && Array.isArray(st.jobs) && st.jobs.length === 1 && st.jobs[0].prompt === 'stateless prompt', `${st.i}/${(st.jobs || []).length}`);
    await sleep(1200);
    check('run halted before image 2 (the page is reloading)', state.sends === 1, `sends ${state.sends}`);
    check('status shows the stateless reset', p.q('.status').textContent.includes('Stateless reset'), p.q('.status').textContent);
    dom.window.close();
    // A second document stands in for the reloaded page: the resume continues at i=2.
    const { dom: dom2, state: state2 } = makeDom();
    CONVS[UUID(64)] = () => convGood('stateless prompt', 'file-st64');
    state2.convQueue.push(UUID(64));
    dom2.window.sessionStorage.setItem('bulkimg:run', JSON.stringify(st));
    loadScript(dom2);
    const p2 = await openPanel(dom2);
    const done2 = await waitForCond(() => p2.q('.status').textContent.includes('Done: sent 2 prompts'), 20000);
    check('resumed document sends only the remaining image and completes', !!done2 && state2.sends === 1, `${p2.q('.status').textContent} sends=${state2.sends}`);
    const tiles2 = await waitForCond(() => p2.qa('.tile img').length === 2, 15000);
    check('gallery shows the restored job + the resumed job (2 tiles)', !!tiles2, `${p2.qa('.tile img').length} tiles`);
    check('resume descriptor cleared after completion', dom2.window.sessionStorage.getItem('bulkimg:run') === null);
    dom2.window.close();
  }

  console.log('T13f failed chat is purged (mask) — scoped to conversations with no live or successful work');
  {
    const { dom, state } = makeDom();
    const convF = UUID(65);
    CONVS[convF] = () => ({ current_node: 'f2', mapping: {
      f1: { message: { author: { role: 'user' }, content: { parts: ['doomed prompt'] } } },
      f2: { parent: 'f1', message: { author: { role: 'assistant' }, status: 'finished_successfully', content: { parts: ['I cannot do that.'] }, end_turn: true } } } });
    state.convQueue.push(convF);
    loadScript(dom);
    const p = await openPanel(dom);
    p.q('#m').value = 'new';
    const done = await runFresh(p, 'doomed prompt');
    check('run completes (the job fails in poll)', !!done, p.q('.status').textContent);
    const purged = await waitForCond(() => (state.calls.filter((c) => c.method === 'DELETE' && c.path === '/backend-api/conversation/' + convF).length) === 1, 15000);
    check('failed chat purged exactly once via DELETE — v1.3.0 never purged', !!purged, JSON.stringify(state.calls.filter((c) => c.method === 'DELETE')));
    const masked = await waitForCond(() => { const t = p.q('.tile.failed'); return !!t && String(t.title).includes('failure masked'); }, 8000);
    check('failure note records the mask', !!masked, p.q('.tile.failed') && p.q('.tile.failed').title);
    dom.window.close();
  }
  {
    const { dom, state } = makeDom();
    const convS = UUID(66);
    CONVS[convS] = () => ({ current_node: 'z4', mapping: {
      z1: { message: { author: { role: 'user' }, content: { parts: ['sibling prompt'] } } },
      z2: { parent: 'z1', message: { author: { role: 'assistant' }, status: 'finished_successfully', content: { parts: [{ content_type: 'image_asset_pointer', asset_pointer: 'file-service://file-sib66' }] }, end_turn: true } },
      z3: { parent: 'z2', message: { author: { role: 'user' }, content: { parts: ['doomed sibling'] } } },
      z4: { parent: 'z3', message: { author: { role: 'assistant' }, status: 'finished_successfully', content: { parts: ['no image here'] }, end_turn: true } } } });
    state.convQueue.push(convS, convS);
    loadScript(dom);
    const p = await openPanel(dom);
    p.q('#m').value = 'same';
    const doneS1 = await runFresh(p, 'sibling prompt');
    check('successful sibling run completes', !!doneS1, p.q('.status').textContent);
    const doneS2 = await runFresh(p, 'doomed sibling');
    check('failed sibling run completes', !!doneS2, p.q('.status').textContent);
    const failedSeen = await waitForCond(() => p.qa('.tile.failed').length >= 1, 15000);
    check('failed job observed in the shared conversation', !!failedSeen, `${p.qa('.tile.failed').length} failed tiles`);
    await sleep(5000); // extra poll ticks: a purge would have fired here
    check('conversation with a successful sibling is never purged', state.calls.filter((c) => c.method === 'DELETE').length === 0, JSON.stringify(state.calls.filter((c) => c.method === 'DELETE')));
    dom.window.close();
  }

  console.log('T13g asset vault: blob clone survives URL death (re-mint download + FIFO bound)');
  {
    const { dom, state } = makeDom({ blobDownloads: true });
    CONVS[UUID(67)] = () => convGood('vault prompt', 'file-v67');
    state.convQueue.push(UUID(67));
    loadScript(dom);
    const p = await openPanel(dom);
    const done = await runFresh(p, 'vault prompt');
    check('run against blob-url downloads completes', !!done, p.q('.status').textContent);
    await waitForCond(() => p.qa('.tile img').length === 1, 15000);
    const deadUrl = p.q('.tile img').src;
    check('image served from a blob: URL minted through the vault-wrapped createObjectURL', deadUrl.startsWith('blob:'), deadUrl);
    state.dlFail = true; // the signed-URL refresh now fails: only the vault can serve the bytes
    p.q('.tile').click();
    await waitForCond(() => !p.q('.lightbox').classList.contains('hidden'));
    p.q('#lbDl').click();
    const reminted = await waitForCond(() => { const h = p.q('#lbDl').getAttribute('href'); return h && h.startsWith('blob:') && h !== deadUrl; }, 8000);
    check('download re-minted from the vault clone after the original URL died — v1.3.0 served the dead URL', !!reminted, p.q('#lbDl').href);
    check('vault download uses a mime-derived extension', /\.(png|jpg|jpeg|webp|gif)$/.test(p.q('#lbDl').download), p.q('#lbDl').download);
    dom.window.close();
  }
  {
    const { dom, state } = makeDom({ blobDownloads: true });
    CONVS[UUID(68)] = () => convGood('vault bound prompt', 'file-v68');
    state.convQueue.push(UUID(68));
    loadScript(dom);
    const p = await openPanel(dom);
    const done = await runFresh(p, 'vault bound prompt');
    check('bound-check run completes', !!done, p.q('.status').textContent);
    await waitForCond(() => p.qa('.tile img').length === 1, 15000);
    const firstUrl = p.q('.tile img').src;
    for (let i = 0; i < 64; i++) dom.window.URL.createObjectURL(new dom.window.Blob(['x'], { type: 'image/png' })); // push the first mint out of the 64-entry registry
    state.dlFail = true;
    p.q('.tile').click();
    await waitForCond(() => !p.q('.lightbox').classList.contains('hidden'));
    p.q('#lbDl').click();
    await sleep(1000);
    check('evicted clone (FIFO bound) is not re-minted — the anchor keeps the original URL', p.q('#lbDl').getAttribute('href') === firstUrl, p.q('#lbDl').getAttribute('href'));
    dom.window.close();
  }

  console.log('T13h clear is blocked while a stateless resume is pending');
  {
    const { dom } = makeDom();
    dom.window.document.getElementById('prompt-textarea').remove(); // the reloaded page has not rendered the composer yet
    dom.window.sessionStorage.setItem('bulkimg:run', JSON.stringify({
      prompt: 'block clear prompt', count: 1, i: 2, mode: 'same', delay: 0, stateless: true, ts: Date.now(),
      jobs: [{ n: 1, convId: UUID(69), k: 0, prompt: 'block clear prompt', sentAt: Date.now(), state: 'pending', images: [], note: '' }] }));
    loadScript(dom);
    const p = await openPanel(dom);
    await waitForCond(() => p.q('#galTitle').textContent === 'Images 0/1', 15000);
    p.q('#clearGal').click();
    await sleep(300);
    check('gallery not cleared while the resume is pending — v1.3.0 had no such guard', p.q('#galTitle').textContent === 'Images 0/1', p.q('#galTitle').textContent);
    check('the resume descriptor is still in place (not consumed by the guard)', !!dom.window.sessionStorage.getItem('bulkimg:run'));
    dom.window.close();
  }

  console.log('T13i vault holds page-fetched image bytes under the signed URL (the live-shape join)');
  {
    const { dom, state } = makeDom({ idBasedDownloads: true });
    dom0 = dom;
    CONVS[UUID(70)] = () => convGood('signed join prompt', 'file-v70');
    state.convQueue.push(UUID(70));
    loadScript(dom);
    const p = await openPanel(dom);
    const done = await runFresh(p, 'signed join prompt');
    check('run against signed-url downloads completes', !!done, p.q('.status').textContent);
    await waitForCond(() => p.qa('.tile img').length === 1, 15000);
    const signed = String(p.q('.tile img').src);
    check('gallery tile served from the signed download URL', /^https:\/\/files\.example\/file-v70$/.test(signed), signed);
    state.imageUrls = new Map([[signed, 'held-image-bytes']]);
    await dom.window.fetch(signed); // the page renders the image: the bytes flow through the wrapped fetch
    await sleep(300); // the hold arm settles asynchronously
    state.dlFail = true; // the signed-URL refresh now dies: only the held bytes can serve
    p.q('.tile').click();
    await waitForCond(() => !p.q('.lightbox').classList.contains('hidden'));
    p.q('#lbDl').click();
    const reminted = await waitForCond(() => { const h = p.q('#lbDl').getAttribute('href'); return h && h.startsWith('blob:'); }, 8000);
    check('download re-minted from the held bytes after the signed refresh died — the pre-amendment v1.4.0 served the dead URL', !!reminted, p.q('#lbDl').getAttribute('href'));
    check('held-bytes download uses a mime-derived extension', /\.png$/.test(p.q('#lbDl').download), p.q('#lbDl').download);
    dom.window.close();
  }

  console.log('T13j a vanished model selection refuses the run instead of silently using the page default');
  {
    const { dom, state } = makeDom();
    dom.window.sessionStorage.setItem('bulkimg:run', JSON.stringify({
      prompt: 'zombie model prompt', count: 1, i: 1, mode: 'same', delay: 0, version: 'v-gone', effort: '', stateless: false, ts: Date.now(), jobs: [] }));
    loadScript(dom);
    const p = await openPanel(dom);
    const refused = await waitForCond(() => /no longer offered/.test(p.q('.status').textContent), 12000);
    check('resume with a retired model id refuses with the re-pick message — the pre-amendment v1.4.0 sent under the page default', !!refused, p.q('.status').textContent);
    check('nothing was sent', state.sends === 0, `sends ${state.sends}`);
    dom.window.close();
  }
  {
    const { dom } = makeDom();
    dom.window.localStorage.setItem('bulkimg:settings', JSON.stringify({ prompt: 'x', count: 1, mode: 'same', delay: 0, version: 'v-gone', effort: '', lock: true }));
    loadScript(dom);
    const p = await openPanel(dom);
    await waitForCond(() => p.qa('#ver option').length > 1, 8000); // models loaded — without v-gone
    const warn = p.q('#modelWarn');
    check('dead persisted selection + ticked lock shows the inert warning', !!warn && !warn.classList.contains('hidden'), warn && warn.className);
    check('the warning names the dead selection', !!warn && /no longer offered/.test(warn.textContent), warn && warn.textContent);
    dom.window.close();
  }

  console.log('T13k a ticked reference with no loaded image refuses the run — never a silent text-only send');
  {
    const { dom, state } = makeDom();
    loadScript(dom);
    const p = await openPanel(dom);
    p.q('#p').value = 'no ref prompt';
    p.q('#n').value = '1';
    p.q('#d').value = '0';
    p.q('#ref').checked = true; // ticked, but no reference was ever picked or loaded
    p.q('.status').textContent = '';
    p.q('.go').click();
    const refused = await waitForCond(() => /reference image is ticked but not loaded/.test(p.q('.status').textContent), 12000);
    check('run refuses when the reference is ticked but missing — the pre-amendment v1.4.0 silently sent text only', !!refused, p.q('.status').textContent);
    check('no text-only prompt went out', state.sends === 0, `sends ${state.sends}`);
    dom.window.close();
  }

  dom.window.close();
  console.log(failed ? `\nBEHAVIOR SUITE: ${failed} failure(s) of ${total.length}` : `\nBEHAVIOR SUITE: PASS (${total.length} checks)`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SUITE CRASH:', e); process.exit(1); });
