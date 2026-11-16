// ==UserScript==
// @name         ChatGPT Bulk Images
// @namespace    local.chatgpt-scripts.easier-image-gen
// @version      1.3.0
// @description  Send one image prompt to ChatGPT many times (fresh chat each time, optionally in a project), pick model/effort, watch usage limits, and see the images in a live gallery.
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
  const VERSION = '1.3.0';
  const STORE_KEY = 'bulkimg:settings';
  const KEEP = '';
  const CURRENT_PROJECT = '__current__';

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

  // ---------- ChatGPT backend (read-only calls, same ones the page makes) ----------
  const pageFetch = window.fetch.bind(window);
  let tok = { t: null, at: 0 };
  async function api(path, opts = {}) {
    if (!tok.t || Date.now() - tok.at > 4 * 60_000) {
      const s = await pageFetch('/api/auth/session').then((r) => r.json());
      if (!s || !s.accessToken) throw new Error('not signed in (no access token from /api/auth/session)');
      tok = { t: s.accessToken, at: Date.now() };
    }
    const r = await pageFetch(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${tok.t}`, ...(opts.body ? { 'Content-Type': 'application/json' } : {}) } });
    if (r.status === 401) tok.t = null;
    if (!r.ok) throw new Error(`${path.split('?')[0]} → ${r.status}`);
    return r.json();
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

  // ---------- model/effort: rewrite the page's own send request (no menu clicking) ----------
  let override = null; // { version, effort } while a run is active
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
    try {
      if (override && init && typeof init.body === 'string' && (init.method || '').toUpperCase() === 'POST') {
        const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname;
        // ChatGPT sends conversations through two shapes — /backend-api/f/conversation and the
        // plain /backend-api/conversation. The rewrite must catch both: matching only the /f/
        // shape made the model override a silent no-op whenever the page used the other.
        if (path.startsWith('/backend-api/f/conversation') || path === '/backend-api/conversation') {
          const b = JSON.parse(init.body);
          if (rewriteBody(b)) {
            init = { ...init, body: JSON.stringify(b) };
            console.log(TAG, 'request model →', b.model, b.thinking_effort || '');
          }
        }
      }
    } catch (e) { console.warn(TAG, 'rewrite skipped', e); }
    return pageFetch(input, init);
  };

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
  async function sendPrompt(text, isCancelled, waitForFinish) {
    if (!(await waitFor(() => isCancelled() || ($(SEL.editor) && !generating()), 60_000))) throw new Error('composer never became ready');
    if (isCancelled()) return null; // Stop pressed while the composer was still settling
    setPrompt(text);
    const send = await waitFor(() => isCancelled() || $$(SEL.send).find((b) => visible(b) && !b.disabled), 10_000);
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
              if (!job.images.length) job.note = textOf([...seg].reverse().find((m) => m.author?.role === 'assistant' && textOf(m)) || { content: {} }).slice(0, 300) || 'No image returned.';
            } else if (Date.now() - job.sentAt > 15 * 60_000) {
              job.state = 'failed'; job.note = 'Timed out after 15 minutes.';
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

  // ---------- settings ----------
  const defaults = { prompt: '', count: 4, mode: 'new', delay: 3, version: KEEP, effort: KEEP, project: CURRENT_PROJECT, wait: false, force: false };
  const loadJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = () => {
    const s = { ...defaults, ...loadJSON(STORE_KEY, {}) };
    if (s.mode !== 'same' && s.mode !== 'new') s.mode = 'new';
    return s;
  };

  // ---------- runner ----------
  let running = false;
  let cancelled = false;
  let limits = null;

  async function run(ui) {
    const s = ui.read();
    saveJSON(STORE_KEY, s);
    if (!s.prompt.trim()) return ui.status('Enter a prompt first.');
    running = true; cancelled = false; ui.setRunning(true);
    let count = s.count;
    try {
      if (!versions) await loadVersions().catch(() => null);
      // A picked model/effort that cannot be resolved would silently send the page's default
      // model instead — refuse the run rather than generate with the wrong model.
      if ((s.version || s.effort) && !versions) throw new Error('could not load the model list — pick "Keep current" or retry');
      limits = await loadLimits().catch(() => limits);
      ui.renderLimits(limits);

      // A model/effort is locked when ChatGPT lists its slug under model_limits.
      const lock = lockFor(s.version, s.effort);
      if (lock && !s.force) throw new Error(`${s.effort || 'That model'} is locked until ${when(lock.until)}. Tick "Send anyway" to try regardless.`);
      if (limits?.imagesLeft === 0) throw new Error(`Image limit reached. Resets ${resets(limits.imagesReset)}.`);
      if (limits?.imagesLeft != null && limits.imagesLeft < count) count = limits.imagesLeft;

      override = s.version || s.effort ? { version: s.version, effort: s.effort } : null;
      let target = null;
      if (s.mode === 'new') {
        if (s.project === CURRENT_PROJECT) {
          const id = projectIdOf(location.pathname);
          target = id ? { id } : null;
        } else if (s.project) {
          target = { name: s.project };
        }
      }
      for (let i = 1; i <= count && !cancelled; i++) {
        if (s.mode === 'new') {
          ui.status(`Opening chat ${i}/${count}…`);
          await newChat(target, () => cancelled);
          if (target?.name) target = { id: projectIdOf(location.pathname) }; // later chats return to the project by id
        }
        // In one chat ChatGPT can't take a new message mid-reply, so "same" mode always waits.
        const wait = s.mode === 'same' || s.wait;
        ui.status(wait ? `Generating ${i}/${count}…` : `Sending ${i}/${count}…`);
        const sentAt = Date.now();
        const convId = await sendPrompt(s.prompt, () => cancelled, wait);
        if (!convId) break; // Stop was pressed before this prompt went out
        // k = this prompt's send ordinal within the conversation, so re-runs with a different
        // prompt in the same chat cannot push it out of the match list's range.
        trackJob({ n: jobs.length + 1, convId, k: jobs.filter((j) => j.convId === convId && j.prompt === s.prompt).length, prompt: s.prompt, sentAt, state: 'pending', images: [], note: '' });

        limits = await loadLimits().catch(() => limits);
        ui.renderLimits(limits);
        if (limits?.imagesLeft === 0 && i < count) { ui.status(`Image limit reached after ${i}. Resets ${resets(limits.imagesReset)}.`); return; }
        if (i < count && !cancelled) await sleepUnless(s.delay * 1000, () => cancelled);
      }
      const capped = count < s.count ? ` (capped at ${count}: that's all the image limit allows)` : '';
      const tail = s.mode === 'new' && !s.wait ? ' Images keep generating in their chats.' : '';
      ui.status(cancelled ? 'Stopped.' : `Done: sent ${count} prompts${capped}.${tail}`);
    } catch (e) {
      console.error(TAG, e);
      ui.status(`Error: ${e.message}`);
    } finally {
      override = null;
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
    };

    // Gallery
    const lb = q('.lightbox');
    let lbJob = null;
    const openLightbox = (job, img) => { lbJob = job; lb.querySelector('img').src = img.url; q('#lbDl').href = img.url; q('#lbDl').download = `bulk-${job.n}-${job.images.indexOf(img) + 1}.png`; lb.classList.remove('hidden'); };
    const closeLightbox = () => lb.classList.add('hidden');
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    q('#lbClose').addEventListener('click', closeLightbox);
    q('#lbChat').addEventListener('click', () => { if (lbJob) window.open(`/c/${lbJob.convId}`, '_blank'); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

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
            t.querySelector('img').src = img.url;
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
    q('#clearGal').addEventListener('click', () => { if (running) return; jobs.length = 0; galSnap = null; onGalleryChange(); });

    const refreshLimits = async () => { limits = await loadLimits().catch(() => null); ui.renderLimits(limits); syncForce(); };
    const refreshVersions = async () => {
      try { await loadVersions(); fillVersions(q('#ver').value); fillEfforts(q('#effort').value); } catch (e) { console.warn(TAG, e); }
    };

    q('.fab').addEventListener('click', () => {
      const opening = !panel.classList.contains('open');
      panel.classList.toggle('open');
      if (!opening) return;
      fillProjects(q('#proj').value);
      if (!versions) refreshVersions();
      if (!running) refreshLimits();
    });
    q('#refreshLimits').addEventListener('click', refreshLimits);
    q('#ver').addEventListener('change', () => fillEfforts(q('#effort').value));
    q('#effort').addEventListener('change', syncForce);
    q('#m').addEventListener('change', syncMode);
    q('.go').addEventListener('click', () => { if (!running) run(ui); });
    q('.stop').addEventListener('click', () => { cancelled = true; ui.status('Stopping after the current one…'); });
    // Keep typing in the panel from leaking into ChatGPT's global shortcuts.
    root.addEventListener('keydown', (e) => e.stopPropagation());
    q('#p').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !running) run(ui); });

    const attach = () => { if (!document.body.contains(host)) document.body.appendChild(host); };
    attach();
    setInterval(attach, 2000); // ChatGPT is an SPA; re-attach if a re-render drops us.
  }

  buildUI();
})();
