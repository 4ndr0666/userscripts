// ==UserScript==
// @name         ChatGPT Bulk Images
// @namespace    local.chatgpt-scripts.easier-image-gen
// @version      1.4.0
// @description  Send one image prompt to ChatGPT many times (fresh chat each time, optionally in a project), pick model/effort, force the model on every send, re-attach a reference image to each prompt, run statelessly (cache dump + reload between images), purge failed chats to mask failed generations, watch usage limits, and collect images through a blob-cloning asset vault into a live gallery.
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  // Double-injection guard: a second copy (two userscript managers, or a re-inject)
  // would stack a second panel and double-patch window.fetch.
  if (window.__bulkimgLoaded) return;
  window.__bulkimgLoaded = true;

  const TAG = '[BulkImg]';
  const VERSION = '1.4.0';
  const STORE_KEY = 'bulkimg:settings';
  const RESUME_KEY = 'bulkimg:run';
  const REF_KEY = 'bulkimg:ref';
  const KEEP = '';
  const CURRENT_PROJECT = '__current__';
  // A stateless resume older than this is discarded: every signed download URL inside
  // it has long expired and the run it described is ancient history.
  const RESUME_TTL = 6 * 60 * 60_000;
  const VAULT_MAX_ENTRIES = 64;
  const VAULT_MAX_BYTES = 192 * 1024 * 1024;
  const PICKER_COOLDOWN = 3000;

  // ---------- small helpers ----------
  const SEL = {
    editor: 'div.ProseMirror[contenteditable="true"], #prompt-textarea',
    send: 'button[aria-label="Send"], button[data-testid="send-button"]',
    stop: 'button[aria-label="Stop"], button[data-testid="stop-button"]',
  };
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const visible = (el) => !!el && el.getClientRects().length > 0;
  const firstVisible = (s) => $$(s).find(visible);
  // Sleep that a Stop press can cut short: the inter-job delay must never hold the run
  // hostage for its full duration (the input allows up to 600 s).
  const sleepUnless = async (ms, isCancelled) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (isCancelled()) return;
      await sleep(Math.min(250, end - Date.now()));
    }
  };
  // ChatGPT leaves a hidden Stop button in the DOM after a reply ends, so only a visible one means "generating".
  const generating = () => $$(SEL.stop).some(visible);
  const projectIdOf = (path) => (path.match(/\/g\/(g-p-[0-9a-f]{32})/) || [])[1] || null;
  const convIdOf = (path) => (path.match(/\/c\/([0-9a-f]{8}-[0-9a-f-]{27})/) || [])[1] || null;
  // API-derived strings reach a couple of innerHTML templates; escape them so a hostile or
  // malformed backend payload can never inject markup into the panel.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function waitFor(fn, timeoutMs, stepMs = 250) {
    const t0 = Date.now();
    for (;;) {
      const v = fn();
      if (v) return v;
      if (Date.now() - t0 > timeoutMs) return null;
      await sleep(stepMs);
    }
  }

  function rel(iso) {
    if (!iso) return '';
    const ms = new Date(iso) - Date.now();
    if (ms <= 0) return 'now';
    const m = Math.round(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d >= 1 ? `in ${d}d ${h % 24}h` : h >= 1 ? `in ${h}h ${m % 60}m` : `in ${m}m`;
  }
  const when = (iso) => {
    if (!iso) return 'an unknown time';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso); // never render "Invalid Date" into the panel
    return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };
  // "resets in 2h 05m" / "resets now" / "resets later" — composes cleanly even when the API omits the timestamp.
  const resets = (iso) => (!iso ? 'later' : rel(iso));

  // ---------- settings ----------
  const defaults = { prompt: '', count: 4, mode: 'new', delay: 3, version: KEEP, effort: KEEP, project: CURRENT_PROJECT, wait: false, force: false, lock: false, ref: false, stateless: true, purge: true };
  const loadJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = () => {
    const s = { ...defaults, ...loadJSON(STORE_KEY, {}) };
    if (s.mode !== 'same' && s.mode !== 'new') s.mode = 'new';
    return s;
  };
  // Live snapshot of the run settings: poll-time decisions (the purge policy) read this,
  // because pollGallery runs outside any run() call frame.
  let runOpts = load();

  // ---------- ChatGPT backend (read-only calls, same ones the page makes) ----------
  const pageFetch = window.fetch.bind(window);
  let tok = { t: null, at: 0 };
  async function api(path, reqOpts = {}) {
    if (!tok.t || Date.now() - tok.at > 4 * 60_000) {
      const s = await pageFetch('/api/auth/session').then((r) => r.json());
      if (!s || !s.accessToken) throw new Error('not signed in (no access token from /api/auth/session)');
      tok = { t: s.accessToken, at: Date.now() };
    }
    const r = await pageFetch(path, { ...reqOpts, headers: { ...(reqOpts.headers || {}), Authorization: `Bearer ${tok.t}`, ...(reqOpts.body ? { 'Content-Type': 'application/json' } : {}) } });
    if (r.status === 401) tok.t = null;
    if (!r.ok) throw new Error(`${path.split('?')[0]} → ${r.status}`);
    const text = await r.text(); // a DELETE can answer 204 with an empty body
    return text ? JSON.parse(text) : {};
  }

  // Model versions and their effort presets ({ title, model_slug, thinking_effort }).
  let versions = null;
  async function loadVersions() {
    const m = await api('/backend-api/models?history_and_training_disabled=false');
    versions = (m.versions || []).filter((v) => v.enabled !== false).map((v) => ({
      id: v.id,
      name: v.display_text_full || v.display_text || v.id,
      slugs: v.slugs || [],
      presets: (v.intelligence_presets || []).map((p) => ({ title: p.title, model: p.model_slug, effort: p.thinking_effort || null })),
    }));
    return versions;
  }

  // Usage limits from the same call ChatGPT makes when it opens a chat.
  async function loadLimits() {
    const j = await api('/backend-api/conversation/init', {
      method: 'POST',
      body: JSON.stringify({ gizmo_id: null, requested_default_model: null, conversation_id: null, timezone_offset_min: new Date().getTimezoneOffset() }),
    });
    const img = (j.limits_progress || []).find((x) => x.feature_name === 'image_gen');
    return {
      imagesLeft: img ? img.remaining : null,
      imagesReset: img?.reset_after || null,
      lockedModels: (j.model_limits || []).map((x) => ({ slug: x.model_slug, until: x.resets_after })),
      notes: (j.blocked_features || []).map((b) => b.description).filter(Boolean),
    };
  }

  // The lock (if any) covering the preset a version/effort choice resolves to. KEEP version = any version.
  function lockFor(versionId, effort) {
    if (!versions || !limits) return null;
    if (effort) {
      const vers = versionId ? versions.filter((v) => v.id === versionId) : versions;
      const slugs = vers.flatMap((v) => v.presets.filter((p) => p.title === effort).map((p) => p.model));
      return limits.lockedModels.find((l) => slugs.includes(l.slug)) || null;
    }
    if (versionId) {
      // Model-only choice: the lock may sit on the version's plain slug or on any of its presets.
      const slugs = versions.filter((v) => v.id === versionId).flatMap((v) => [...v.slugs, ...v.presets.map((p) => p.model)]);
      return limits.lockedModels.find((l) => slugs.includes(l.slug)) || null;
    }
    return null;
  }

  // ---------- asset vault: clone every image blob the page mints ----------
  // Generated images live behind blob: URLs the page revokes and signed URLs that
  // expire; the vault holds the underlying bytes at mint time (the Hailuo++
  // interception pattern), so a late download never dies with the URL.
  const vault = (() => {
    const nativeCreate = typeof URL.createObjectURL === 'function' ? URL.createObjectURL.bind(URL) : null;
    const entries = new Map(); // minted URL -> { blob, mime, size }
    let bytes = 0;
    const isBlobLike = (b) => !!b && typeof b.size === 'number' && typeof b.slice === 'function'; // cross-realm safe
    const admit = (url, blob) => {
      if (!url || !isBlobLike(blob) || !/^image\//.test(String(blob.type || ''))) return; // image assets only
      if (entries.has(url)) return;
      entries.set(url, { blob, mime: blob.type, size: blob.size });
      bytes += blob.size;
      while (entries.size > VAULT_MAX_ENTRIES || bytes > VAULT_MAX_BYTES) {
        const oldest = entries.keys().next().value; // FIFO: the oldest mint is evicted first
        if (oldest === undefined) break;
        const e = entries.get(oldest);
        entries.delete(oldest);
        bytes -= e.size;
      }
    };
    if (nativeCreate) {
      try {
        URL.createObjectURL = function (blobOrMediaSource) {
          const url = nativeCreate(blobOrMediaSource);
          try { admit(url, blobOrMediaSource); } catch {}
          return url;
        };
      } catch (e) { console.warn(TAG, 'vault: createObjectURL is not interceptable', e); }
    }
    return {
      // Serve the cloned bytes for a (possibly dead) URL: the blob outlives its URL.
      cloneOf: (url) => (url ? entries.get(url) || null : null),
      // Admit bytes fetched against an explicit URL (the response-interception arm below).
      // The gallery stores signed download URLs, which the page's own blob: mints can
      // never match — holding the fetched bytes under the requested URL closes that join.
      hold: (url, blob) => { try { admit(String(url), blob); } catch {} },
    };
  })();

  // ---------- model/effort: rewrite the page's own send request (no menu clicking) ----------
  let override = null; // { version, effort } while a run is active or the forced-model lock is engaged
  let runOverride = null; // the active run's own selection
  const lockActive = (s) => !!(s && s.lock && (s.version || s.effort));
  function applyOverride() {
    // During a run the run's selection wins; otherwise a ticked lock keeps forcing
    // every send on the page (the ophel forced-model contract).
    if (runOverride) { override = runOverride; return; }
    const s = load();
    override = lockActive(s) ? { version: s.version, effort: s.effort } : null;
  }
  function rewriteBody(b) {
    if (typeof b.model !== 'string' || !versions) return false;
    const cur = versions.find((v) => v.slugs.includes(b.model) || v.presets.some((p) => p.model === b.model));
    const curPreset = cur?.presets.find((p) => p.model === b.model && (p.effort || null) === (b.thinking_effort || null));
    const ver = override.version ? versions.find((v) => v.id === override.version) : cur;
    const title = override.effort || curPreset?.title;
    // Versions without intelligence presets select by their plain slug; without this fallback
    // picking such a model silently sent the page's default model instead.
    const p = ver?.presets.find((x) => x.title === title) || ver?.presets[0] ||
      (ver?.slugs.length ? { model: ver.slugs[0], effort: null } : null);
    if (!p) return false;
    b.model = p.model;
    if (p.effort) b.thinking_effort = p.effort; else delete b.thinking_effort;
    return true;
  }
  window.fetch = function (input, init) {
    let myInit = init;
    try {
      if (override && myInit && typeof myInit.body === 'string' && (myInit.method || '').toUpperCase() === 'POST') {
        const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
        // ChatGPT sends conversations through two shapes — /backend-api/f/conversation and the
        // plain /backend-api/conversation. The rewrite must catch both: matching only the /f/
        // shape made the model override a silent no-op whenever the page used the other.
        if (path.startsWith('/backend-api/f/conversation') || path === '/backend-api/conversation') {
          const b = JSON.parse(myInit.body);
          if (rewriteBody(b)) {
            myInit = { ...myInit, body: JSON.stringify(b) };
            console.log(TAG, 'request model →', b.model, b.thinking_effort || '');
          }
        }
      }
    } catch (e) { console.warn(TAG, 'rewrite skipped', e); }
    const pr = pageFetch(input, myInit);
    try {
      // Asset vault, response arm: when the page itself fetches an image (rendering a
      // generated one through its signed URL), clone the bytes into the vault under the
      // exact URL the gallery stores. The createObjectURL arm alone cannot serve the
      // signed-URL world — the page's blob: keys never equal the stored download_url.
      // Passive (zero extra requests), GET-only, and silently tolerant of engines whose
      // Response objects cannot be cloned.
      const url = String(typeof input === 'string' ? input : (input && input.url) || '');
      const method = String((myInit && myInit.method) || 'GET').toUpperCase();
      if (url && method === 'GET') {
        pr.then((res) => {
          try {
            const mime = String((res && res.headers && res.headers.get && res.headers.get('content-type')) || '');
            if (res && res.ok && /^image\//.test(mime) && typeof res.clone === 'function') {
              res.clone().blob().then((b) => vault.hold(url, b)).catch(() => {});
            }
          } catch {}
        }).catch(() => {});
      }
    } catch {}
    return pr;
  };

  // ---------- forced model: ophel-style picker sync (the UI layer) ----------
  // The transport rewrite above is the hard guarantee; this keeps the page's own picker
  // honest so the visible selection, the new-chat default, and the sent body all agree.
  // Selector families follow the current chatgpt.com app shell (composer pill + the
  // reasoning trigger + the Radix model menu with model-switcher-* test ids).
  const PICKER = {
    buttons: [
      'button[class*="__composer-pill"][aria-haspopup="menu"]',
      'button[data-composer-navigation-target="reasoning"][aria-haspopup="menu"]',
      'button[data-codex-intelligence-trigger="true"][aria-haspopup="menu"]',
      'button[aria-label*="Model" i][aria-haspopup="menu"]',
      'button[aria-label*="模型"][aria-haspopup="menu"]',
    ],
    menu: '[data-radix-popper-content-wrapper] [role="menu"][data-radix-menu-content]',
    item: '[data-testid^="model-switcher-"]',
  };
  const picker = (() => {
    let startTimer = null, verifyTimer = null, debounceTimer = null;
    let lastAttempt = 0, relocks = 0;
    const clearTimers = () => {
      if (startTimer) { clearTimeout(startTimer); startTimer = null; }
      if (verifyTimer) { clearInterval(verifyTimer); verifyTimer = null; }
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    };
    const lockTarget = () => {
      const s = load();
      if (!lockActive(s) || !versions) return null;
      const names = [];
      const slugs = new Set();
      if (s.version) {
        const ver = versions.find((v) => v.id === s.version);
        if (ver) {
          ver.slugs.forEach((x) => slugs.add(x));
          ver.presets.forEach((p) => { if (!s.effort || p.title === s.effort) { slugs.add(p.model); names.push(p.title); } });
          names.push(ver.name);
        }
      }
      if (s.effort) versions.forEach((v) => v.presets.forEach((p) => { if (p.title === s.effort) { slugs.add(p.model); names.push(p.title); } }));
      return slugs.size ? { slugs, names } : null;
    };
    const readSignals = () => {
      const sig = [];
      const btn = PICKER.buttons.map((b) => $(b)).find(visible);
      if (btn) {
        const label = btn.querySelector('span.truncate, span[class*="truncate"]');
        if (label) sig.push(label.textContent);
      }
      const slugEls = $$('[data-message-model-slug]');
      const lastSlug = slugEls.length ? slugEls[slugEls.length - 1].getAttribute('data-message-model-slug') : null;
      if (lastSlug) sig.push(lastSlug);
      const menu = $(PICKER.menu);
      if (menu && visible(menu)) {
        $$(PICKER.item).forEach((it) => {
          const selected = !!it.querySelector('.trailing svg, .trailing use') ||
            it.getAttribute('data-state') === 'checked' || it.getAttribute('aria-checked') === 'true' || it.getAttribute('aria-selected') === 'true';
          if (!selected) return;
          const slug = (it.getAttribute('data-testid') || '').replace(/^model-switcher-/, '');
          if (slug) sig.push(slug);
          const nameSpan = it.querySelector('.min-w-0');
          sig.push(nameSpan ? nameSpan.textContent : it.textContent);
        });
      }
      return sig.map((x) => String(x || '').toLowerCase().trim()).filter(Boolean);
    };
    const matchesTarget = (signals, tgt) => signals.some((sg) =>
      tgt.slugs.has(sg) || tgt.names.some((n) => String(n).toLowerCase().trim() === sg));
    const findItem = (tgt) => {
      const menu = $(PICKER.menu);
      if (!menu) return null;
      return $$(PICKER.item).find((it) => {
        const slug = (it.getAttribute('data-testid') || '').replace(/^model-switcher-/, '');
        if (tgt.slugs.has(slug)) return true;
        const nameSpan = it.querySelector('.min-w-0');
        const name = String((nameSpan ? nameSpan.textContent : it.textContent) || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return tgt.names.some((n) => String(n).toLowerCase().trim() === name);
      }) || null;
    };
    const openMenu = () => {
      const btn = PICKER.buttons.map((b) => $(b)).find(visible);
      if (!btn) return false;
      const before = btn.getAttribute('aria-expanded');
      btn.click();
      if (btn.getAttribute('aria-expanded') !== before) return true;
      // The newer menus are pointer-event driven; the native click alone can be a no-op.
      try {
        btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true }));
      } catch (e) { console.warn(TAG, 'picker pointer fallback rejected', e); }
      return true;
    };
    const attempt = () => {
      if (!lockActive(load()) || !versions) return;
      const tgt = lockTarget();
      if (!tgt) return;
      if (matchesTarget(readSignals(), tgt)) { relocks = 0; return; } // already forced
      if (Date.now() - lastAttempt < PICKER_COOLDOWN) return; // re-entry cooldown
      lastAttempt = Date.now();
      if (!openMenu()) return;
      startTimer = setTimeout(() => {
        startTimer = null;
        const item = findItem(tgt);
        if (item) item.click();
        let ticks = 0, consec = 0;
        if (verifyTimer) clearInterval(verifyTimer);
        verifyTimer = setInterval(() => {
          ticks++;
          if (matchesTarget(readSignals(), tgt)) {
            consec++;
            if (consec >= 2 || ticks >= 3) { clearInterval(verifyTimer); verifyTimer = null; relocks = 0; }
          } else {
            consec = 0;
            clearInterval(verifyTimer); verifyTimer = null;
            if (relocks < 2) { relocks++; attempt(); } // the page reset it — force again, bounded
          }
        }, 1500);
      }, 500); // menu render delay
    };
    return {
      schedule: (delay = 1500) => { clearTimers(); startTimer = setTimeout(() => { startTimer = null; attempt(); }, delay); },
      debounce: () => { if (debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { debounceTimer = null; attempt(); }, 500); },
      stop: clearTimers,
    };
  })();
  // A route change can reset the picker to the site default — relock shortly after.
  (() => {
    const fire = () => { if (lockActive(load())) picker.schedule(300); };
    try {
      const orig = history.pushState.bind(history);
      history.pushState = function (...args) { const r = orig(...args); fire(); return r; };
    } catch (e) { console.warn(TAG, 'pushState hook not installed', e); }
    window.addEventListener('popstate', fire);
  })();

  // A persisted selection can outlive the live list (a model retired server-side, or a
  // stale stateless-resume descriptor): rewriteBody would silently no-op and every send
  // would leave under the page default — the R2-2 failure class at a new entry point.
  // The panel dropdowns sanitize what they display, but the resume path and the lock
  // (which reads the store directly) bypass that, so every run entry refuses here.
  function selectionResolves(versionId, effort) {
    if (!versions) return true; // the list-failure refusal is separate (R2-2)
    if (versionId && !versions.some((v) => v.id === versionId)) return false;
    if (effort && !versions.some((v) => v.presets.some((p) => p.title === effort))) return false;
    return true;
  }

  // ---------- reference image: the same image with every prompt ----------
  let refBlob = null;
  let refMeta = null;
  const refFile = () => (refBlob ? new File([refBlob], refMeta.name, { type: refMeta.type }) : null);
  async function loadRef() {
    const raw = loadJSON(REF_KEY, null);
    if (!raw || !raw.data) return;
    try {
      const b64 = String(raw.data).split(',')[1] || '';
      const bin = atob(b64);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      refBlob = new Blob([buf], { type: raw.type || 'image/png' });
      refMeta = { name: raw.name || 'reference', type: raw.type || 'image/png' };
    } catch (e) {
      console.warn(TAG, 'stored reference unreadable; ignoring it', e);
      refBlob = refMeta = null;
    }
  }
  async function saveRef(file) {
    refBlob = file;
    refMeta = { name: file.name || 'reference', type: file.type || 'image/png' };
    try {
      const data = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = () => reject(fr.error);
        fr.readAsDataURL(file);
      });
      saveJSON(REF_KEY, { name: refMeta.name, type: refMeta.type, data });
      return true;
    } catch (e) {
      console.warn(TAG, 'reference too large to persist — kept for this page only', e);
      return false;
    }
  }
  function clearRef() {
    refBlob = refMeta = null;
    try { localStorage.removeItem(REF_KEY); } catch {}
  }
  // ChatGPT consumes an attachment once, so every send re-supplies a FRESH File built
  // from the stored bytes. Three attach strategies, each verified by attach evidence.
  const ATTACH_HINTS = ['[data-testid="attachment-chip"]', '[data-testid*="attachment"]', 'form img[src^="blob:"]', 'form [data-testid="composer-upload"]'];
  const attachEvidence = () => ATTACH_HINTS.some((h) => { try { return !!$(h); } catch { return false; } });
  const transferOf = (file) => {
    if (typeof DataTransfer === 'function') {
      try { const dt = new DataTransfer(); dt.items.add(file); return dt; } catch (e) { console.warn(TAG, 'DataTransfer construction rejected', e); }
    }
    // Engines without a DataTransfer constructor still deliver files through the
    // duck-typed shape every paste/drop handler reads.
    return { files: [file], items: [{ getAsFile: () => file }] };
  };
  const fireTransferEvent = (target, type, prop, dt) => {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    try { Object.defineProperty(ev, prop, { value: dt }); } catch { ev[prop] = dt; }
    target.dispatchEvent(ev);
  };
  async function attachReference(file) {
    const ed = $(SEL.editor);
    if (!ed) throw new Error('composer not found');
    const dt = transferOf(file);
    // Strategy 1: the composer's own (possibly hidden) file input.
    const inp = $$('input[type="file"]').find(visible) || $('input[type="file"]');
    if (inp) {
      try {
        inp.files = dt.files;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        if (await waitFor(attachEvidence, 8000)) return true;
      } catch (e) { console.warn(TAG, 'file-input attach rejected', e); }
    }
    // Strategy 2: a paste carrying the file (the composer's own attach path).
    try {
      ed.focus();
      fireTransferEvent(ed, 'paste', 'clipboardData', dt);
      if (await waitFor(attachEvidence, 8000)) return true;
    } catch (e) { console.warn(TAG, 'paste attach rejected', e); }
    // Strategy 3: a drop onto the composer.
    try {
      fireTransferEvent(ed, 'dragover', 'dataTransfer', dt);
      fireTransferEvent(ed, 'drop', 'dataTransfer', dt);
      if (await waitFor(attachEvidence, 8000)) return true;
    } catch (e) { console.warn(TAG, 'drop attach rejected', e); }
    return false;
  }

  // ---------- composer + navigation ----------
  function setPrompt(text) {
    const ed = $(SEL.editor);
    if (!ed) throw new Error('composer not found');
    ed.focus();
    let ok = false;
    try {
      document.execCommand('selectAll');
      ok = document.execCommand('insertText', false, text);
    } catch { ok = false; }
    if (!ok) {
      // Fallback for engines/extensions that block execCommand: write the text directly and
      // notify the editor framework (ProseMirror) through its own input event.
      ed.textContent = text;
      ed.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    }
  }

  // Sends one prompt through the page (so ChatGPT attaches its own anti-abuse tokens) and returns the
  // conversation id, or null when the user pressed Stop before the prompt went out.
  // waitForFinish: resolve when the reply ends; otherwise as soon as the chat is saved server-side.
  async function sendPrompt(text, isCancelled, waitForFinish, hasReference) {
    if (!(await waitFor(() => isCancelled() || ($(SEL.editor) && !generating()), 60_000))) throw new Error('composer never became ready');
    if (isCancelled()) return null; // Stop pressed while the composer was still settling
    setPrompt(text);
    // An attachment upload keeps the send button disabled longer than a bare prompt.
    const send = await waitFor(() => isCancelled() || $$(SEL.send).find((b) => visible(b) && !b.disabled), hasReference ? 30_000 : 10_000);
    if (isCancelled()) return null; // Stop pressed while waiting for the send button
    if (!send) throw new Error('send button not available');
    send.click();
    await waitFor(generating, 15_000); // a very fast reply can start+finish between polls; the conv-id wait below still catches it
    if (!(await waitFor(() => convIdOf(location.pathname), 30_000))) throw new Error('chat was not created');
    const convId = convIdOf(location.pathname);
    if (waitForFinish) {
      if (!(await waitFor(() => isCancelled() || !generating(), 10 * 60_000, 1000))) throw new Error('timed out waiting for response');
    } else {
      await sleep(500);
    }
    return convId;
  }

  const projectNames = () => $$('button[aria-label^="New chat in "]').map((b) => b.getAttribute('aria-label').slice('New chat in '.length));

  // Opens a fresh conversation in this tab. target: null = no project, or { id } / { name } of a project.
  // isCancelled: the run's Stop flag — cuts the navigation wait short instead of holding the
  // run hostage for the full 15 s window (the last uninterruptible segment after Rounds 1–2
  // made the pre-send waits and the inter-job delay cancellable).
  async function newChat(target, isCancelled = () => false) {
    if (isCancelled()) return; // Stop pressed: do not open another chat at all
    const path = location.pathname;
    const onBlankPage = !path.includes('/c/');
    let btn;
    if (!target) {
      if (path === '/') return;
      btn = firstVisible('button[aria-label="New chat"], a[aria-label="New chat"], [data-testid="create-new-chat-button"]') ||
        $$('button, a').find((b) => visible(b) && b.textContent.trim() === 'New chat');
    } else if (target.id) {
      if (onBlankPage && projectIdOf(path) === target.id) return;
      // Same hidden-control fallback as the by-name path: a collapsed sidebar hides the
      // project link entirely, and v1.2.0 aborted the whole run here with "could not find
      // a way to open a new chat there" — prefer a visible link, fall back to any match.
      btn = firstVisible(`a[href="/g/${target.id}/project"]`) ||
        $(`a[href="/g/${target.id}/project"]`);
    } else {
      // Prefer a visible control: a collapsed sidebar leaves a hidden match first in the DOM,
      // and clicking it does nothing (v1.1.0 could stall to "new chat did not open").
      btn = firstVisible(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`) ||
        $(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`);
    }
    if (!btn) throw new Error('could not find a way to open a new chat there');
    btn.click();
    await sleep(1000);
    // From a blank page the click may legitimately keep the same path (e.g. already on that project's page).
    const opened = () => !location.pathname.includes('/c/') && (onBlankPage || location.pathname !== path) && $(SEL.editor) && !generating();
    if (!(await waitFor(() => isCancelled() || opened(), 15_000))) throw new Error('new chat did not open');
    if (isCancelled()) return; // skip the settle sleep; the runner breaks before any prompt goes out
    await sleep(500);
  }

  // ---------- stateless runs + failed-run masking ----------
  function resumeState() {
    try { return JSON.parse(sessionStorage.getItem(RESUME_KEY)); } catch { return null; }
  }
  function persistResume(st) {
    try { sessionStorage.setItem(RESUME_KEY, JSON.stringify(st)); } catch (e) { console.warn(TAG, 'resume state not persisted', e); }
  }
  function clearResume() { try { sessionStorage.removeItem(RESUME_KEY); } catch {} }
  async function statelessReload() {
    // Cache dump: drop every Cache Storage entry and the service worker so the reload
    // boots the app from scratch (the operator's cache-dump + hard-reload regime —
    // a stateless run each time survives the API's failure blacklisting far better).
    try {
      if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
    } catch (e) { console.warn(TAG, 'cache dump skipped', e); }
    try {
      const regs = await navigator.serviceWorker?.getRegistrations();
      if (regs) await Promise.all(regs.map((r) => r.unregister()));
    } catch (e) { console.warn(TAG, 'service-worker deregister skipped', e); }
    location.reload();
    await sleepUnless(15000, () => cancelled); // if the reload is delayed the run stays parked; the state is already durable
  }
  async function purgeIfFailed(job) {
    // Mask failed generations the Hailuo++ way: a failed chat is removed from the
    // account so repeated failures do not stack up against the next runs. Only ever
    // applied to conversations this script owns exclusively — never one that still
    // holds pending or successful work.
    if (!runOpts.purge || !job || job.state !== 'failed' || job.purged) return;
    const conv = job.convId;
    if (jobs.some((j) => j.convId === conv && j.purged)) return; // one DELETE per conversation
    if (jobs.some((j) => j.convId === conv && j !== job && (j.state === 'pending' || j.state === 'done'))) return;
    job.purged = true; // set before the call: idempotent even when the DELETE itself fails
    try {
      await api(`/backend-api/conversation/${conv}`, { method: 'DELETE' });
      job.note = `${job.note} (chat purged — failure masked)`;
      console.log(TAG, 'purged failed chat', conv);
    } catch (e) {
      console.warn(TAG, 'purge failed for', conv, e);
    }
  }

  // ---------- gallery: read each chat's images from the API ----------
  const jobs = []; // { n, convId, k, prompt, sentAt, state: 'pending'|'done'|'failed', images: [{ id, url }], note }
  let pollTimer = null;
  let polling = false;
  let onGalleryChange = () => {};

  function thread(conv) {
    const out = [];
    const seen = new Set(); // a malformed/cyclic mapping must never wedge the poll loop
    for (let id = conv.current_node; id && !seen.has(id); id = conv.mapping[id]?.parent) {
      seen.add(id);
      const m = conv.mapping[id]?.message;
      if (m) out.unshift(m);
    }
    return out;
  }
  const textOf = (m) => (m.content?.parts || []).filter((p) => typeof p === 'string').join('').trim();
  // Whitespace-normalized comparison key for prompt→message matching: identical text
  // modulo formatting collapses to one key on both sides.
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

  async function pollGallery() {
    if (polling) return;
    polling = true;
    try {
      const pending = jobs.filter((j) => j.state === 'pending');
      for (const convId of new Set(pending.map((j) => j.convId))) {
        let conv;
        try { conv = await api(`/backend-api/conversation/${convId}`); } catch (e) { console.warn(TAG, e); continue; }
        const msgs = thread(conv);
        const userIdx = msgs.map((m, i) => (m.author?.role === 'user' ? i : -1)).filter((i) => i >= 0);
        const convJobs = jobs.filter((j) => j.convId === convId && j.state === 'pending');
        for (const job of convJobs) {
          // The timeout owns the TOP of the loop: a send that never appears in the thread
          // (dropped server-side, chat deleted, or the text came back altered) must fail
          // on schedule — v1.3.0 sat this check after the match continue, so an unmatched
          // job stayed pending forever.
          if (Date.now() - job.sentAt > 15 * 60_000) {
            job.state = 'failed'; job.note = 'Timed out after 15 minutes.';
            await purgeIfFailed(job);
            continue;
          }
          // Match each send to its user message. Our sends are the newest user messages whose
          // text matches the prompt EXACTLY (modulo whitespace normalization): a manual message
          // typed in the same chat is skipped by the text check, an older identical prompt from
          // a previous run is outranked by the tail selection, and — the v1.2.0 defect — two
          // DISTINCT prompts sharing an 80-char prefix can no longer cross-pair (v1.2.0 matched
          // on the first 80 characters only, so each could claim the other's segment).
          // The offset arithmetic counts only this conversation's jobs that SHARE the prompt
          // (any state) — exactly the sends matchIdx counts. v1.1.0 mixed all prompts into one
          // k-sequence, so re-running the same chat with a new prompt pushed k out of range and
          // stalled those jobs to the 15-minute timeout.
          const matchIdx = userIdx.filter((i) => norm(textOf(msgs[i])) === norm(job.prompt));
          const siblings = jobs.filter((j) => j.convId === convId && j.prompt === job.prompt).sort((a, b) => a.k - b.k);
          const off = matchIdx.length >= siblings.length ? matchIdx.length - siblings.length + job.k : job.k;
          const ui = off >= 0 && off < matchIdx.length ? matchIdx[off] : undefined;
          if (ui === undefined) continue; // this send is not in the thread yet; other prompt groups may still match
          try {
            const nextUser = userIdx.find((i) => i > ui) ?? msgs.length;
            const seg = msgs.slice(ui + 1, nextUser);
            const ids = seg
              .filter((m) => m.status === 'finished_successfully')
              .flatMap((m) => (m.content?.parts || []).filter((p) => p && p.content_type === 'image_asset_pointer'))
              .map((p) => String(p.asset_pointer || '').replace(/^[a-z-]+:\/\//, ''))
              .filter(Boolean);
            for (const id of ids) {
              if (job.images.some((x) => x.id === id)) continue;
              try {
                const d = await api(`/backend-api/files/download/${id}?conversation_id=${convId}&inline=false`);
                if (d.download_url) job.images.push({ id, url: d.download_url });
              } catch (e) { console.warn(TAG, e); }
            }
            // Image chats never flag their closing message as finished, so "done" = images exist and the
            // assistant has moved on past the last tool output; a no-image reply that finished counts as failed.
            const last = seg[seg.length - 1];
            const lastImg = seg.map((m, i) => ((m.content?.parts || []).some((p) => p?.content_type === 'image_asset_pointer') ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
            const movedOn = lastImg >= 0 && seg.slice(lastImg + 1).some((m) => m.author?.role === 'assistant');
            const finishedWithout = lastImg < 0 && last?.author?.role === 'assistant' && textOf(last) && (last.end_turn === true || last.status === 'finished_successfully');
            const ended = movedOn || finishedWithout || seg.some((m) => m.author?.role === 'assistant' && m.end_turn === true);
            if (ended) {
              job.state = job.images.length ? 'done' : 'failed';
              if (!job.images.length) {
                job.note = textOf([...seg].reverse().find((m) => m.author?.role === 'assistant' && textOf(m)) || { content: {} }).slice(0, 300) || 'No image returned.';
                await purgeIfFailed(job);
              }
            }
          } catch (e) { console.warn(TAG, 'poll failed for job #' + job.n, e); }
        }
      }
    } catch (e) {
      console.warn(TAG, 'gallery poll error', e); // one malformed conversation must never kill the poll loop
    } finally {
      polling = false;
      onGalleryChange();
      if (!jobs.some((j) => j.state === 'pending')) { clearInterval(pollTimer); pollTimer = null; }
    }
  }
  function trackJob(job) {
    jobs.push(job);
    onGalleryChange();
    if (!pollTimer) pollTimer = setInterval(pollGallery, 4000);
  }

  // ---------- runner ----------
  let running = false;
  let cancelled = false;
  let limits = null;

  async function executeRun(s, ui, startAt) {
    running = true; cancelled = false; ui.setRunning(true);
    runOpts = s;
    let count = s.count;
    let reloaded = false;
    try {
      if (!versions) await loadVersions().catch(() => null);
      // A picked model/effort that cannot be resolved would silently send the page's default
      // model instead — refuse the run rather than generate with the wrong model.
      if ((s.version || s.effort) && !versions) throw new Error('could not load the model list — pick "Keep current" or retry');
      if ((s.version || s.effort) && !selectionResolves(s.version, s.effort)) throw new Error('the selected model or effort is no longer offered — re-pick it (or "Keep current")');
      limits = await loadLimits().catch(() => limits);
      ui.renderLimits(limits);

      // A model/effort is locked when ChatGPT lists its slug under model_limits.
      const lock = lockFor(s.version, s.effort);
      if (lock && !s.force) throw new Error(`${s.effort || 'That model'} is locked until ${when(lock.until)}. Tick "Send anyway" to try regardless.`);
      if (limits?.imagesLeft === 0) throw new Error(`Image limit reached. Resets ${resets(limits.imagesReset)}.`);
      if (limits?.imagesLeft != null && limits.imagesLeft < count) count = limits.imagesLeft;

      runOverride = s.version || s.effort ? { version: s.version, effort: s.effort } : null;
      applyOverride();
      let target = null;
      if (s.mode === 'new') {
        if (s.project === CURRENT_PROJECT) {
          const id = projectIdOf(location.pathname);
          target = id ? { id } : null;
        } else if (s.project) {
          target = { name: s.project };
        }
      }
      const refOn = !!(s.ref && refBlob);
      // The reference contract is refuse-not-degrade: a ticked reference with no loaded
      // bytes (never picked, unreadable, or too large to survive a stateless reload)
      // must stop the run — a silent text-only send is exactly what this feature exists
      // to prevent.
      if (s.ref && !refBlob) throw new Error('reference image is ticked but not loaded — pick it again or untick "Attach reference"');
      for (let i = startAt; i <= count && !cancelled; i++) {
        if (s.mode === 'new') {
          ui.status(`Opening chat ${i}/${count}…`);
          await newChat(target, () => cancelled);
          if (target?.name) target = { id: projectIdOf(location.pathname) }; // later chats return to the project by id
        }
        // In one chat ChatGPT can't take a new message mid-reply, so "same" mode always waits.
        const wait = s.mode === 'same' || s.wait;
        if (refOn) {
          ui.status(`Attaching reference ${i}/${count}…`);
          const file = refFile();
          if (!file || !(await attachReference(file))) throw new Error('reference image did not attach — run stopped (no text-only send)');
        }
        ui.status(wait ? `Generating ${i}/${count}…` : `Sending ${i}/${count}…`);
        const sentAt = Date.now();
        const convId = await sendPrompt(s.prompt, () => cancelled, wait, refOn);
        if (!convId) break; // Stop was pressed before this prompt went out
        // k = this prompt's send ordinal within the conversation, so re-runs with a different
        // prompt in the same chat cannot push it out of the match list's range.
        trackJob({ n: jobs.length + 1, convId, k: jobs.filter((j) => j.convId === convId && j.prompt === s.prompt).length, prompt: s.prompt, sentAt, state: 'pending', images: [], note: '' });
        if (s.stateless) persistResume({ ...s, count, i, jobs, ts: Date.now() }); // durable even if the page dies mid-run

        limits = await loadLimits().catch(() => limits);
        ui.renderLimits(limits);
        if (limits?.imagesLeft === 0 && i < count) { ui.status(`Image limit reached after ${i}. Resets ${resets(limits.imagesReset)}.`); return; }
        if (i < count && !cancelled) {
          await sleepUnless(s.delay * 1000, () => cancelled); // pace the API even in stateless mode
          if (s.stateless) {
            // Stateless cycle: dump the caches and reload; the next document resumes at
            // i+1 with a pristine app state (the operator's anti-blacklisting regime).
            ui.status(`Stateless reset ${i}/${count}…`);
            persistResume({ ...s, count, i: i + 1, jobs, ts: Date.now() });
            reloaded = true;
            await statelessReload();
            return;
          }
        }
      }
      const capped = count < s.count ? ` (capped at ${count}: that's all the image limit allows)` : '';
      const tail = s.mode === 'new' && !s.wait ? ' Images keep generating in their chats.' : '';
      ui.status(cancelled ? 'Stopped.' : `Done: sent ${count} prompts${capped}.${tail}`);
    } catch (e) {
      console.error(TAG, e);
      ui.status(`Error: ${e.message}`);
    } finally {
      runOverride = null;
      if (!reloaded) clearResume();
      applyOverride();
      running = false; ui.setRunning(false);
    }
  }

  async function run(ui) {
    const s = ui.read();
    saveJSON(STORE_KEY, s);
    if (!s.prompt.trim()) return ui.status('Enter a prompt first.');
    await executeRun(s, ui, 1);
  }

  // The stateless cycle's other half: a fresh document picks the run back up.
  async function resumeRun(ui) {
    let st = null;
    try { st = resumeState(); } catch { st = null; }
    if (!st || typeof st !== 'object' || !st.prompt || typeof st.i !== 'number') return;
    if (st.ts && Date.now() - st.ts > RESUME_TTL) { clearResume(); return; }
    try {
      ui.status(`Resuming after stateless reset (${st.i}/${st.count || '?'})…`);
      const restored = Array.isArray(st.jobs) ? st.jobs : [];
      jobs.push(...restored);
      onGalleryChange();
      if (jobs.some((j) => j.state === 'pending') && !pollTimer) pollTimer = setInterval(pollGallery, 4000);
      await waitFor(() => $(SEL.editor), 60_000); // the reloaded page must render its composer
      await executeRun({ ...defaults, ...st }, ui, st.i);
    } catch (e) {
      console.error(TAG, 'resume failed', e);
      ui.status(`Resume failed: ${e.message}`);
      clearResume();
      running = false; ui.setRunning(false);
    }
  }

  // ---------- UI (shadow DOM so ChatGPT's CSS can't touch it) ----------
  function buildUI() {
    if (document.getElementById('bulkimg-host')) return; // a panel already exists; never stack a second one
    const host = document.createElement('div');
    host.id = 'bulkimg-host';
    host.style.cssText = 'position:fixed;right:16px;bottom:88px;z-index:2147483646;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font: 13px/1.4 system-ui, -apple-system, sans-serif; }
        .fab { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #444; background: #2b2b2b; color: #fff; cursor: pointer; font-size: 18px; box-shadow: 0 4px 14px rgba(0,0,0,.4); }
        .panel { display: none; width: 360px; max-height: calc(100vh - 160px); overflow-y: auto; margin-bottom: 8px; padding: 12px; border-radius: 12px; background: #1f1f1f; color: #eee; border: 1px solid #3a3a3a; box-shadow: 0 8px 28px rgba(0,0,0,.5); }
        .panel.open { display: block; }
        h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
        h4 { margin: 12px 0 6px; font-size: 12px; font-weight: 600; color: #aaa; display: flex; justify-content: space-between; align-items: center; }
        label { display: block; margin: 8px 0 4px; color: #aaa; font-size: 12px; }
        textarea, input, select { width: 100%; padding: 6px 8px; border-radius: 8px; border: 1px solid #444; background: #2b2b2b; color: #eee; }
        textarea { min-height: 80px; resize: vertical; }
        .row { display: flex; gap: 8px; align-items: flex-end; }
        .row > div { flex: 1; min-width: 0; }
        .check { display: flex; gap: 6px; align-items: center; margin: 8px 0 0; color: #ccc; cursor: pointer; }
        .check input { width: auto; margin: 0; }
        .actions { display: flex; gap: 8px; margin-top: 10px; }
        button.go, button.stop { flex: 1; padding: 8px; border-radius: 8px; border: 0; cursor: pointer; font-weight: 600; }
        button.go { background: #fff; color: #000; }
        button.stop { background: #444; color: #eee; }
        button:disabled { opacity: .4; cursor: default; }
        .link { background: none; border: 0; color: #9ad; cursor: pointer; padding: 0; font-size: 12px; }
        .hidden { display: none !important; }
        .status { margin-top: 8px; min-height: 18px; color: #9ad; font-size: 12px; }
        .limits { font-size: 12px; color: #ccc; background: #262626; border-radius: 8px; padding: 6px 8px; }
        .limits div { margin: 2px 0; }
        .warn { color: #f0b46c; }
        .note { margin: 4px 0 0; font-size: 12px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .tile { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #2b2b2b; display: flex; align-items: center; justify-content: center; color: #888; font-size: 12px; cursor: pointer; text-align: center; padding: 4px; }
        .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tile .n { position: absolute; left: 4px; top: 4px; background: rgba(0,0,0,.6); color: #fff; border-radius: 6px; padding: 0 5px; font-size: 11px; }
        .tile.failed { color: #f0b46c; }
        .spin { width: 18px; height: 18px; border: 2px solid #555; border-top-color: #ccc; border-radius: 50%; animation: s 1s linear infinite; }
        @keyframes s { to { transform: rotate(360deg); } }
        .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 1; }
        .lightbox img { max-width: 90vw; max-height: 80vh; border-radius: 8px; }
        .lightbox .bar { display: flex; gap: 8px; }
        .lightbox a, .lightbox button { background: #fff; color: #000; border: 0; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; text-decoration: none; }
      </style>
      <div class="panel">
        <h3>Bulk images <span style="color:#777;font-weight:400;font-size:11px">v${typeof GM_info !== 'undefined' ? GM_info.script.version : VERSION}</span></h3>
        <label for="p">Prompt</label>
        <textarea id="p" placeholder="create image of …"></textarea>
        <div class="row">
          <div><label for="n">How many</label><input id="n" type="number" min="1" max="50"></div>
          <div><label for="d">Delay (s)</label><input id="d" type="number" min="0" max="600"></div>
        </div>
        <div class="row">
          <div><label for="ver">Model</label><select id="ver"></select></div>
          <div><label for="effort">Effort</label><select id="effort"></select></div>
        </div>
        <label class="check hidden" id="forceRow"><input id="force" type="checkbox"> <span id="forceText">Send anyway (ChatGPT says this is locked)</span></label>
        <label class="check"><input id="lock" type="checkbox"> <span>Force model — lock ALL sends, not just bulk runs</span></label>
        <div class="warn note hidden" id="modelWarn">Model list unavailable — the forced model is inert until it loads.</div>
        <label for="refFile">Reference image</label>
        <input id="refFile" type="file" accept="image/*">
        <label class="check"><input id="ref" type="checkbox"> <span id="refLabel">Attach reference to every prompt</span> <button class="link hidden" id="refClear">remove</button></label>
        <label for="m">Mode</label>
        <select id="m">
          <option value="new">New chat for each image</option>
          <option value="same">All in this chat</option>
        </select>
        <div id="projRow">
          <label for="proj">Project</label>
          <select id="proj"></select>
          <label class="check"><input id="wait" type="checkbox"> Wait for each image before starting the next chat</label>
        </div>
        <h4>Between images</h4>
        <label class="check"><input id="stateless" type="checkbox"> <span>Stateless run — cache dump + reload between images</span></label>
        <label class="check"><input id="purge" type="checkbox"> <span>Purge failed chats (mask failed generations)</span></label>
        <div class="actions">
          <button class="go">Generate</button>
          <button class="stop" disabled>Stop</button>
        </div>
        <div class="status"></div>
        <h4>Usage limits <button class="link" id="refreshLimits">refresh</button></h4>
        <div class="limits">Loading…</div>
        <div id="gal" class="hidden">
          <h4><span id="galTitle">Images</span> <button class="link" id="clearGal">clear</button></h4>
          <div class="grid"></div>
        </div>
      </div>
      <div style="text-align:right"><button class="fab" title="Bulk images">🖼</button></div>
      <div class="lightbox hidden"><img alt=""><div class="bar"><button id="lbChat">Open chat</button><a id="lbDl" download>Download</a><button id="lbClose">Close</button></div></div>`;

    const q = (s) => root.querySelector(s);
    const panel = q('.panel');
    const s = load();

    const fill = (sel, options, value) => {
      sel.replaceChildren(...options.map(([v, t]) => new Option(t, v)));
      sel.value = options.some(([v]) => v === value) ? value : options[0][0];
    };
    const fillVersions = (value) => fill(q('#ver'), [[KEEP, 'Keep current'], ...(versions || []).map((v) => [v.id, v.name])], value);
    // Effort list = union of the presets ChatGPT offers for the chosen version (or all versions for "Keep current").
    const fillEfforts = (value) => {
      const vers = q('#ver').value ? (versions || []).filter((v) => v.id === q('#ver').value) : versions || [];
      const titles = [...new Set(vers.flatMap((v) => v.presets.map((p) => p.title)))];
      const opts = titles.length ? titles.map((t) => [t, t]) : value ? [[value, value]] : [];
      fill(q('#effort'), [[KEEP, 'Keep current'], ...opts], value);
      syncForce();
    };
    const syncForce = () => {
      const lock = lockFor(q('#ver').value, q('#effort').value);
      q('#forceRow').classList.toggle('hidden', !lock);
      if (lock) q('#forceText').textContent = `Send anyway (ChatGPT says ${q('#effort').value} is locked until ${when(lock.until)})`;
    };
    const fillProjects = (value) => {
      const inProject = !!projectIdOf(location.pathname);
      const opts = [[CURRENT_PROJECT, inProject ? 'This project' : 'Where I am (no project)'], ['', 'No project'], ...projectNames().map((p) => [p, p])];
      fill(q('#proj'), opts, value);
    };
    const syncMode = () => q('#projRow').classList.toggle('hidden', q('#m').value !== 'new');

    q('#p').value = s.prompt; q('#n').value = s.count; q('#d').value = s.delay; q('#m').value = s.mode;
    q('#wait').checked = !!s.wait; q('#force').checked = !!s.force;
    q('#lock').checked = !!s.lock; q('#ref').checked = !!s.ref;
    q('#stateless').checked = s.stateless !== false; q('#purge').checked = s.purge !== false;
    fillVersions(s.version); fillEfforts(s.effort); fillProjects(s.project); syncMode();

    const ui = {
      read: () => ({
        prompt: q('#p').value,
        count: Math.max(1, Math.min(50, parseInt(q('#n').value, 10) || 1)),
        delay: Math.max(0, Math.min(600, parseFloat(q('#d').value) || 0)),
        mode: q('#m').value,
        version: q('#ver').value,
        effort: q('#effort').value,
        project: q('#proj').value,
        wait: q('#wait').checked,
        force: q('#force').checked,
        lock: q('#lock').checked,
        ref: q('#ref').checked,
        stateless: q('#stateless').checked,
        purge: q('#purge').checked,
      }),
      status: (t) => { q('.status').textContent = t; console.log(TAG, t); },
      setRunning: (on) => { q('.go').disabled = on; q('.stop').disabled = !on; },
      renderLimits: (l) => {
        const box = q('.limits');
        if (!l) { box.textContent = 'Could not load limits.'; return; }
        const rows = [];
        if (l.imagesLeft != null) rows.push([`Images left: <b>${esc(l.imagesLeft)}</b> · resets ${esc(resets(l.imagesReset))}`, l.imagesLeft < 10]);
        for (const m of l.lockedModels) rows.push([`${esc(m.slug)} locked until ${esc(when(m.until))}${m.until ? ` (${esc(rel(m.until))})` : ''}`, true]);
        if (!l.lockedModels.length) rows.push(['No models locked.', false]);
        for (const n of l.notes) rows.push([esc(n), true]);
        box.innerHTML = rows.map(([t, w]) => `<div class="${w ? 'warn' : ''}">${t}</div>`).join('');
      },
      syncModelWarn: () => {
        // The lock acts on the persisted selection (applyOverride reads the store), so
        // the warn must judge the store too — the dropdowns sanitize what they display
        // and would otherwise mask a dead persisted selection entirely.
        const st = load();
        const dead = !selectionResolves(st.version, st.effort);
        q('#modelWarn').textContent = !versions
          ? 'Model list unavailable — the forced model is inert until it loads.'
          : 'That model or effort is no longer offered — the lock is inert. Re-pick it.';
        q('#modelWarn').classList.toggle('hidden', !(st.lock && (!versions || dead)));
      },
      syncRefUI: () => {
        const f = refFile();
        q('#refLabel').textContent = f ? `Attach reference (${f.name}, ${Math.max(1, Math.round((f.size || 0) / 1024))} KB) to every prompt` : 'Attach reference to every prompt';
        q('#refClear').classList.toggle('hidden', !f);
      },
    };

    // Gallery
    const lb = q('.lightbox');
    let lbJob = null;
    let lbImg = null;
    const openLightbox = (job, img) => { lbJob = job; lbImg = img; lb.querySelector('img').src = img.url; q('#lbDl').href = img.url; q('#lbDl').download = `bulk-${job.n}-${job.images.indexOf(img) + 1}.png`; lb.classList.remove('hidden'); };
    const closeLightbox = () => lb.classList.add('hidden');
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    q('#lbClose').addEventListener('click', closeLightbox);
    q('#lbChat').addEventListener('click', () => { if (lbJob) window.open(`/c/${lbJob.convId}`, '_blank'); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

    const extOf = (mime) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }[String(mime || '').toLowerCase()] || 'png');
    const triggerDownload = (href, fname) => {
      const a = document.createElement('a');
      a.href = href; a.download = fname;
      document.body.appendChild(a); a.click(); a.remove();
    };
    // Download chain: a fresh signed URL first, then the vault's cloned bytes, then the
    // original URL as the last resort. The vault arm is what survives revocation/expiry.
    const serveDownload = async (job, img) => {
      const name = (ext) => `bulk-${job.n}-${job.images.indexOf(img) + 1}.${ext}`;
      try {
        const d = await api(`/backend-api/files/download/${img.id}?conversation_id=${job.convId}&inline=false`);
        if (d && d.download_url) { q('#lbDl').href = d.download_url; q('#lbDl').download = name('png'); triggerDownload(d.download_url, name('png')); return; }
      } catch (e) { /* fall through to the vault */ }
      const clone = img.url ? vault.cloneOf(img.url) : null;
      if (clone) {
        const ext = extOf(clone.mime);
        const fresh = URL.createObjectURL(clone.blob);
        q('#lbDl').href = fresh; q('#lbDl').download = name(ext);
        triggerDownload(fresh, name(ext));
        setTimeout(() => { try { if (typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(fresh); } catch {} }, 60_000);
        return;
      }
      q('#lbDl').href = img.url; q('#lbDl').download = name('png');
    };
    q('#lbDl').addEventListener('click', (e) => { e.preventDefault(); if (lbJob && lbImg) serveDownload(lbJob, lbImg); });

    let galSnap = null;
    onGalleryChange = () => {
      q('#gal').classList.toggle('hidden', !jobs.length);
      const done = jobs.filter((j) => j.state !== 'pending').length;
      q('#galTitle').textContent = `Images ${done}/${jobs.length}`;
      // While any job is pending this fires every poll tick; rebuilding every tile each time
      // flickers the grid and discards layout work. Skip the DOM rebuild when nothing
      // observable (state, note, image ids) changed since the last render.
      const snap = JSON.stringify(jobs.map((j) => [j.state, j.note, j.images.map((i) => i.id)]));
      if (snap === galSnap) return;
      galSnap = snap;
      const grid = q('.grid');
      grid.replaceChildren(...jobs.flatMap((job) => {
        if (job.images.length) {
          return job.images.map((img) => {
            const t = document.createElement('div');
            t.className = 'tile';
            t.innerHTML = `<img alt="Image ${job.n}" loading="lazy"><span class="n">${job.n}</span>`;
            const im = t.querySelector('img');
            im.src = img.url;
            // A revoked blob: URL must not kill the tile: re-mint from the vault clone once.
            im.addEventListener('error', () => {
              if (t.dataset.remint) return;
              const clone = vault.cloneOf(img.url);
              if (!clone) return;
              t.dataset.remint = '1';
              try { im.src = URL.createObjectURL(clone.blob); } catch (e) { console.warn(TAG, 'tile re-mint rejected', e); }
            });
            t.addEventListener('click', () => openLightbox(job, img));
            return t;
          });
        }
        const t = document.createElement('div');
        t.className = `tile ${job.state}`;
        t.title = job.state === 'failed' ? job.note : 'Generating… click to open the chat';
        t.innerHTML = job.state === 'failed' ? `⚠︎ No image<span class="n">${job.n}</span>` : `<div class="spin"></div><span class="n">${job.n}</span>`;
        t.addEventListener('click', () => window.open(`/c/${job.convId}`, '_blank'));
        return [t];
      }));
    };
    q('#clearGal').addEventListener('click', () => { if (running || resumeState()) return; jobs.length = 0; galSnap = null; onGalleryChange(); });

    const refreshLimits = async () => { limits = await loadLimits().catch(() => null); ui.renderLimits(limits); syncForce(); };
    const refreshVersions = async () => {
      try { await loadVersions(); fillVersions(q('#ver').value); fillEfforts(q('#effort').value); } catch (e) { console.warn(TAG, e); }
      ui.syncModelWarn();
    };

    q('.fab').addEventListener('click', () => {
      const opening = !panel.classList.contains('open');
      panel.classList.toggle('open');
      if (!opening) return;
      fillProjects(q('#proj').value);
      if (!versions) refreshVersions();
      if (!running) refreshLimits();
      ui.syncRefUI();
    });
    q('#refreshLimits').addEventListener('click', refreshLimits);
    q('#ver').addEventListener('change', () => { fillEfforts(q('#effort').value); if (q('#lock').checked) { saveJSON(STORE_KEY, ui.read()); applyOverride(); picker.debounce(); } ui.syncModelWarn(); });
    q('#effort').addEventListener('change', () => { syncForce(); if (q('#lock').checked) { saveJSON(STORE_KEY, ui.read()); applyOverride(); picker.debounce(); } ui.syncModelWarn(); });
    q('#lock').addEventListener('change', () => {
      saveJSON(STORE_KEY, ui.read());
      applyOverride();
      ui.syncModelWarn();
      if (q('#lock').checked) picker.debounce(); else picker.stop();
    });
    q('#refFile').addEventListener('change', async () => {
      const f = q('#refFile').files && q('#refFile').files[0];
      if (!f) return;
      const persisted = await saveRef(f);
      q('#ref').checked = true;
      ui.syncRefUI();
      if (!persisted) ui.status('Reference kept for this page only — too large to persist across reloads.');
    });
    q('#refClear').addEventListener('click', () => { clearRef(); q('#ref').checked = false; ui.syncRefUI(); });
    q('#stateless').addEventListener('change', () => saveJSON(STORE_KEY, ui.read()));
    q('#purge').addEventListener('change', () => { runOpts = { ...runOpts, purge: q('#purge').checked }; saveJSON(STORE_KEY, ui.read()); });
    q('#m').addEventListener('change', syncMode);
    q('.go').addEventListener('click', () => { if (!running) run(ui); });
    q('.stop').addEventListener('click', () => { cancelled = true; clearResume(); ui.status('Stopping after the current one…'); });
    // Keep typing in the panel from leaking into ChatGPT's global shortcuts.
    root.addEventListener('keydown', (e) => e.stopPropagation());
    q('#p').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !running) run(ui); });

    const attach = () => { if (!document.body.contains(host)) document.body.appendChild(host); };
    attach();
    setInterval(attach, 2000); // ChatGPT is an SPA; re-attach if a re-render drops us.
    return ui;
  }

  const ui = buildUI();
  loadRef().then(() => ui.syncRefUI()).catch(() => {});
  (async () => {
    const s = load();
    if (lockActive(s)) {
      try { await loadVersions(); } catch (e) { console.warn(TAG, e); }
      applyOverride();
      picker.schedule(1500);
    }
    ui.syncModelWarn();
  })();
  resumeRun(ui);
})();
