// ==UserScript==
// @name         4ndr0tools - ChatGPT++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.8.1
// @description  Send one image prompt (with held reference images, smart stop, auto-model alternation, auto-clarification, failed-thread cleanup, and accurate live usage limits) to ChatGPT many times, pick model/effort, watch usage limits, and see the images in a live gallery.
// @icon         data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20128%20128%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20ChatGPT++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20ChatGPT++.user.js
// @match        https://chatgpt.com/*
// @grant        none
// @inject-into  page
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const pageWin = typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;

  // Double-injection guard: a second copy (two userscript managers, or a re-inject)
  // would stack a second panel and double-patch window.fetch.
  if (pageWin.__bulkimgLoaded) return;
  pageWin.__bulkimgLoaded = true;

  const TAG = '[BulkImg]';
  const VERSION = '1.8.1';
  const STORE_KEY = 'bulkimg:settings';
  const HELD_ATTACH_KEY = 'bulkimg:held-attachments';
  const HELD_FILES_KEY = 'bulkimg:held-files';
  const KEEP = '';
  const CURRENT_PROJECT = '__current__';
  const MAX_DL_RETRIES = 3;
  const MAX_HELD_IMAGES = 10;
  const MAX_CLARIFY_RETRIES = 2;
  const DEFAULT_CLARIFY_REPLY = 'Use a 4-panel (2x2) grid composite layout and your best creative judgment. Proceed immediately and generate the image now without asking further questions.';

  // ---------- small helpers ----------
  const SEL = {
    editor: 'div.ProseMirror[contenteditable="true"], #prompt-textarea, textarea[data-id="root"]',
    send: 'button[data-testid="send-button"], button[aria-label="Send prompt"], button[aria-label="Send"], button[aria-label^="Send"]',
    stop: 'button[data-testid="stop-button"], button[aria-label="Stop streaming"], button[aria-label="Stop generating"], button[aria-label="Stop"], button[aria-label^="Stop"]',
    fileInput: 'form input[type="file"], main input[type="file"], input[type="file"][accept*="image"], input[type="file"]',
    uploading: 'form [role="progressbar"], form [data-testid*="upload"], main [role="progressbar"]',
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
  // ChatGPT project URLs include an optional slug suffix after the 32-hex ID
  // (e.g. /g/g-p-6af8b01abd548191a09277a2c3a6f0bc-images/c/...). Preserve the full
  // segment while also providing baseProjectIdOf() for prefix matching against sidebar links.
  const projectIdOf = (path) => (String(path || '').match(/\/g\/(g-p-[0-9a-f]{32}(?:-[a-zA-Z0-9_-]+)*)/i) || [])[1] || null;
  const baseProjectIdOf = (idOrPath) => (String(idOrPath || '').match(/(g-p-[0-9a-f]{32})/i) || [])[1] || null;
  const convIdOf = (path) => (String(path || '').match(/\/c\/([0-9a-f]{8}-[0-9a-f-]{27})/i) || [])[1] || null;
  // API-derived strings reach a couple of innerHTML templates; escape them so a hostile or
  // malformed backend payload can never inject markup into the panel.
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);

  async function waitFor(fn, timeoutMs, stepMs = 250) {
    const t0 = Date.now();
    for (;;) {
      const v = fn();
      if (v) return v;
      if (Date.now() - t0 > timeoutMs) return null;
      await sleep(stepMs);
    }
  }

  // Normalizes any backend reset timestamp (ISO-8601 string, Unix epoch seconds, Unix epoch ms,
  // or relative duration in seconds) into a valid ISO-8601 string or epoch-ms Date.
  function normalizeResetIso(raw) {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'number' && isFinite(raw)) {
      if (raw <= 0) return new Date(Date.now()).toISOString();
      if (raw < 1e9) return new Date(Date.now() + raw * 1000).toISOString();
      if (raw < 1e11) return new Date(raw * 1000).toISOString();
      return new Date(raw).toISOString();
    }
    const str = String(raw).trim();
    if (!str) return null;
    if (/^\d+(?:\.\d+)?$/.test(str)) {
      return normalizeResetIso(parseFloat(str));
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
    return str;
  }

  function rel(iso) {
    if (!iso) return '';
    const normIso = normalizeResetIso(iso);
    const d = new Date(normIso || iso);
    if (isNaN(d.getTime())) return String(iso);
    const ms = d.getTime() - Date.now();
    if (ms <= 0) return 'now';
    const m = Math.round(ms / 60000), h = Math.floor(m / 60), days = Math.floor(h / 24);
    return days >= 1 ? `in ${days}d ${h % 24}h` : h >= 1 ? `in ${h}h ${m % 60}m` : `in ${m}m`;
  }
  const when = (iso) => {
    if (!iso) return 'an unknown time';
    const normIso = normalizeResetIso(iso);
    const d = new Date(normIso || iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  };
  const resets = (iso) => (!iso ? 'later' : rel(iso));
  // (R6-3) Signed asset URLs carry an extension; derive it honestly instead
  // of hardcoding .png (webp/jpeg assets used to download named *.png).
  const assetExt = (url, fallback = 'png') => {
    const m = String(url || '').split('?')[0].match(/\.(jpe?g|png|webp|gif|bmp|avif)$/i);
    return m ? m[1].toLowerCase() : fallback;
  };

  // ---------- settings & persistent JSON helpers ----------
  const defaults = {
    prompt: '',
    count: 4,
    mode: 'new',
    delay: 3,
    version: KEEP,
    effort: KEEP,
    project: CURRENT_PROJECT,
    wait: false,
    force: false,
    holdImages: true,
    smartStop: true,
    autoAltModel: true,
    autoCleanFailed: true,
    autoClarify: true,
    clarifyReply: DEFAULT_CLARIFY_REPLY,
  };
  const loadJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = () => {
    const s = { ...defaults, ...loadJSON(STORE_KEY, {}) };
    if (s.mode !== 'same' && s.mode !== 'new') s.mode = 'new';
    if (typeof s.holdImages !== 'boolean') s.holdImages = true;
    if (typeof s.smartStop !== 'boolean') s.smartStop = true;
    if (typeof s.autoAltModel !== 'boolean') s.autoAltModel = true;
    if (typeof s.autoCleanFailed !== 'boolean') s.autoCleanFailed = true;
    if (typeof s.autoClarify !== 'boolean') s.autoClarify = true;
    if (typeof s.clarifyReply !== 'string' || !s.clarifyReply.trim()) s.clarifyReply = DEFAULT_CLARIFY_REPLY;
    return s;
  };

  // ---------- Stateless Held Input Images (zero cross-session / library snowballing) ----------
  function purgeLegacyHeldStorage() {
    try {
      if (typeof localStorage.removeItem === 'function') {
        localStorage.removeItem(HELD_ATTACH_KEY);
        localStorage.removeItem(HELD_FILES_KEY);
      } else {
        localStorage.setItem(HELD_ATTACH_KEY, 'null');
        localStorage.setItem(HELD_FILES_KEY, 'null');
      }
    } catch {}
  }
  purgeLegacyHeldStorage();

  const heldFiles = []; // [{ key, name, type, size, file, dataUrl }]
  let heldAttachments = { pointers: [], attachments: [] }; // locked to the single user-input batch
  let isInternalAttach = false;
  let holdEnabled = load().holdImages !== false;
  let onHeldChange = () => {};
  let running = false;
  let cancelled = false;
  let limits = null;
  let onLimitsUpdated = () => {};
  const sessionStats = { promptsSent: 0, imagesGenerated: 0 };

  function findComposerFileInput() {
    const ed = $(SEL.editor);
    const form = ed && typeof ed.closest === 'function' ? ed.closest('form') : null;
    if (form && typeof form.querySelector === 'function') {
      const formInp = form.querySelector('input[type="file"]');
      if (formInp) return formInp;
    }
    const candidates = $$(SEL.fileInput).filter((inp) => {
      if (!inp || inp.id === 'refInput') return false;
      const aria = String(inp.getAttribute?.('aria-label') || '').toLowerCase();
      if (aria.includes('project') || aria.includes('library') || aria.includes('knowledge')) return false;
      return true;
    });
    return candidates[candidates.length - 1] || null;
  }

  function dataUrlToFile(dataUrl, name, mimeType) {
    try {
      const parts = String(dataUrl || '').split(',');
      if (parts.length < 2) return null;
      const mime = mimeType || (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
      const bin = typeof atob === 'function' ? atob(parts[1]) : '';
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      if (typeof File === 'function') {
        return new File([arr], name || 'held-image.png', { type: mime });
      }
      return { name: name || 'held-image.png', type: mime, size: arr.length, dataUrl };
    } catch {
      return null;
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      if (!file) return resolve('');
      if (typeof file.dataUrl === 'string' && file.dataUrl) return resolve(file.dataUrl);
      if (typeof FileReader !== 'function') return resolve('');
      try {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      } catch {
        resolve('');
      }
    });
  }

  async function ingestHeldFiles(fileList, replaceExisting = false) {
    if (!fileList || isInternalAttach) return;
    const items = [...fileList].filter((f) => f && (!f.type || String(f.type).startsWith('image/') || /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(f.name || '')));
    if (!items.length) return;
    if (replaceExisting) {
      heldFiles.length = 0;
    }
    let changed = false;
    for (const f of items) {
      if (heldFiles.length >= MAX_HELD_IMAGES) break;
      const name = f.name || `image-${heldFiles.length + 1}.png`;
      const size = Number(f.size) || 0;
      const type = f.type || 'image/png';
      const key = `${name}:${size}:${type}`;
      if (heldFiles.some((x) => x.key === key)) continue;
      const dataUrl = await fileToDataUrl(f);
      heldFiles.push({ key, name, type, size, file: f, dataUrl });
      changed = true;
    }
    if (changed) {
      heldAttachments = { pointers: [], attachments: [] };
      purgeLegacyHeldStorage();
      onHeldChange();
    }
  }

  function capturePageComposerFiles() {
    if (running || isInternalAttach) return;
    const inp = findComposerFileInput();
    if (inp && inp.files && inp.files.length > 0) {
      ingestHeldFiles(inp.files, false);
    }
  }

  function clearComposerFileInputs() {
    for (const inp of $$(SEL.fileInput)) {
      if (!inp) continue;
      try { inp.value = ''; } catch {}
      try { inp.files = []; } catch {}
    }
  }

  function clearHeldImages() {
    heldFiles.length = 0;
    heldAttachments = { pointers: [], attachments: [] };
    clearComposerFileInputs();
    purgeLegacyHeldStorage();
    onHeldChange();
  }

  function removeHeldImageAt(index) {
    const hadFiles = index >= 0 && index < heldFiles.length;
    const removedFile = hadFiles ? heldFiles.splice(index, 1)[0] : null;
    if (removedFile && heldAttachments.attachments.length) {
      const matchIdx = heldAttachments.attachments.findIndex((a) => a && a.name === removedFile.name);
      if (matchIdx >= 0) {
        const matchAtt = heldAttachments.attachments.splice(matchIdx, 1)[0];
        if (matchAtt && matchAtt.id) {
          heldAttachments.pointers = heldAttachments.pointers.filter((p) => !String(p.asset_pointer || '').includes(matchAtt.id));
        } else if (matchIdx < heldAttachments.pointers.length) {
          heldAttachments.pointers.splice(matchIdx, 1);
        }
      } else if (index < heldAttachments.pointers.length) {
        heldAttachments.pointers.splice(index, 1);
        heldAttachments.attachments.splice(index, 1);
      }
    } else if (!hadFiles && index >= 0 && index < heldAttachments.pointers.length) {
      heldAttachments.pointers.splice(index, 1);
      if (index < heldAttachments.attachments.length) {
        heldAttachments.attachments.splice(index, 1);
      }
    }
    if (heldFiles.length === 0 && (!hadFiles ? heldAttachments.pointers.length === 0 : true)) {
      heldAttachments = { pointers: [], attachments: [] };
      clearComposerFileInputs();
    }
    purgeLegacyHeldStorage();
    onHeldChange();
  }

  // (R6-5) The stateless v1.6+ design keeps held images in memory only; the
  // legacy persistence shims (persistHeldState / restoreHeldFilesFromStorage /
  // hasHeldImages) were removed — the first two were no-op stubs whose names
  // lied about the design, the third had zero callers.

  function captureAttachmentsFromBody(b) {
    if (!holdEnabled || !b || !Array.isArray(b.messages) || !b.messages.length) return false;
    if (heldAttachments.pointers.length > 0) return false;

    const userMsgs = b.messages.filter((m) => m && (!m.author?.role || m.author.role === 'user'));
    const msg = userMsgs[userMsgs.length - 1];
    if (!msg) return false;

    const parts = Array.isArray(msg.content?.parts) ? msg.content.parts : [];
    const pointers = parts.filter((p) => p && typeof p === 'object' && p.content_type === 'image_asset_pointer' && p.asset_pointer);
    const atts = Array.isArray(msg.metadata?.attachments)
      ? msg.metadata.attachments.filter((a) => a && (String(a.mime_type || a.mimeType || '').startsWith('image/') || a.width || a.height || /\.(?:png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(a.name || '')))
      : [];

    if (!pointers.length && !atts.length) return false;

    const maxBatch = heldFiles.length > 0
      ? Math.min(MAX_HELD_IMAGES, heldFiles.length)
      : Math.min(MAX_HELD_IMAGES, Math.max(pointers.length, atts.length));

    heldAttachments = {
      pointers: pointers.slice(0, maxBatch).map((p) => JSON.parse(JSON.stringify(p))),
      attachments: atts.slice(0, maxBatch).map((a) => JSON.parse(JSON.stringify(a))),
    };
    onHeldChange();
    return true;
  }

  function injectHeldAttachmentsIntoBody(b) {
    if (!holdEnabled || !b || !Array.isArray(b.messages) || !b.messages.length) return false;
    if (!heldAttachments.pointers.length && !heldAttachments.attachments.length) return false;
    const userMsgs = b.messages.filter((m) => m && (!m.author?.role || m.author.role === 'user'));
    const msg = userMsgs[userMsgs.length - 1] || b.messages[b.messages.length - 1];
    if (!msg) return false;

    const currentParts = Array.isArray(msg.content?.parts) ? msg.content.parts : [];
    const existingPtrCount = currentParts.filter((p) => p && typeof p === 'object' && p.content_type === 'image_asset_pointer').length;
    if (existingPtrCount > 0) return false;

    let mutated = false;
    const cap = heldFiles.length > 0 ? Math.min(MAX_HELD_IMAGES, heldFiles.length) : MAX_HELD_IMAGES;

    if (heldAttachments.pointers.length > 0) {
      if (!msg.content || typeof msg.content !== 'object') {
        msg.content = { content_type: 'multimodal_text', parts: [] };
      }
      if (!Array.isArray(msg.content.parts)) {
        msg.content.parts = [];
      }
      const ptrsToInject = heldAttachments.pointers
        .slice(0, cap)
        .map((p) => JSON.parse(JSON.stringify(p)));
      if (ptrsToInject.length > 0) {
        msg.content.content_type = 'multimodal_text';
        msg.content.parts = [...ptrsToInject, ...msg.content.parts];
        mutated = true;
      }
    }

    if (heldAttachments.attachments.length > 0) {
      if (!msg.metadata || typeof msg.metadata !== 'object') {
        msg.metadata = {};
      }
      if (!Array.isArray(msg.metadata.attachments)) {
        msg.metadata.attachments = [];
      }
      if (msg.metadata.attachments.length === 0) {
        const attsToInject = heldAttachments.attachments
          .slice(0, cap)
          .map((a) => JSON.parse(JSON.stringify(a)));
        if (attsToInject.length > 0) {
          msg.metadata.attachments = attsToInject;
          mutated = true;
        }
      }
    }

    return mutated;
  }

  async function attachHeldImagesToComposer(isCancelled = () => false) {
    if (!holdEnabled || !heldFiles.length || isCancelled()) return false;
    const filesToAttach = heldFiles
      .slice(0, MAX_HELD_IMAGES)
      .map((entry) => entry.file || dataUrlToFile(entry.dataUrl, entry.name, entry.type))
      .filter(Boolean);
    if (!filesToAttach.length) return false;

    let attached = false;
    isInternalAttach = true;
    try {
      const fileInput = findComposerFileInput();
      if (fileInput) {
        if (fileInput.files && fileInput.files.length === filesToAttach.length) {
          return true;
        }
        if (typeof DataTransfer === 'function') {
          const dt = new DataTransfer();
          for (const f of filesToAttach) {
            try { dt.items.add(f); } catch {}
          }
          try { fileInput.files = dt.files; } catch {
            Object.defineProperty(fileInput, 'files', { configurable: true, value: dt.files });
          }
        } else {
          try { fileInput.files = filesToAttach; } catch {
            Object.defineProperty(fileInput, 'files', { configurable: true, value: filesToAttach });
          }
        }
        const Evt = typeof Event === 'function' ? Event : function (type) { this.type = type; };
        fileInput.dispatchEvent(new Evt('change', { bubbles: true }));
        attached = true;
      } else {
        const ed = $(SEL.editor);
        if (ed && typeof DataTransfer === 'function' && typeof ClipboardEvent === 'function') {
          const dt = new DataTransfer();
          for (const f of filesToAttach) {
            try { dt.items.add(f); } catch {}
          }
          ed.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
          attached = true;
        }
      }
    } catch (e) {
      console.warn(TAG, 'composer image attach fallback to fetch replay', e);
    } finally {
      isInternalAttach = false;
    }

    if (attached) {
      await sleep(300);
      await waitFor(() => isCancelled() || !$$(SEL.uploading).some(visible), 30_000, 250);
    }
    return attached;
  }

  // Global passive capture listeners: only capture user-initiated composer uploads while idle (!running)
  try {
    document.addEventListener('change', (e) => {
      const t = e && e.target;
      if (!isInternalAttach && !running && t && t.tagName === 'INPUT' && t.type === 'file' && t.files && t.files.length) {
        const composerInput = findComposerFileInput();
        if (!composerInput || t === composerInput) {
          ingestHeldFiles(t.files, true);
        }
      }
    }, true);
    document.addEventListener('paste', (e) => {
      if (!isInternalAttach && !running && e && e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
        ingestHeldFiles(e.clipboardData.files, false);
      }
    }, true);
    document.addEventListener('drop', (e) => {
      if (!isInternalAttach && !running && e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        ingestHeldFiles(e.dataTransfer.files, false);
      }
    }, true);
  } catch {}

  // ---------- ChatGPT backend (with header harvesting, device-id injection & multi-schema usage limits) ----------
  const pageFetch = pageWin.fetch.bind(pageWin);
  let tok = { t: null, at: 0 };
  const capturedOaiHeaders = {};

  function getDeviceId() {
    if (capturedOaiHeaders['oai-device-id']) return capturedOaiHeaders['oai-device-id'];
    try {
      const lsDid = localStorage.getItem('oai-did');
      if (lsDid) return lsDid.replace(/^"|"$/g, '');
    } catch {}
    try {
      const m = String(document.cookie || '').match(/(?:^|;\s*)oai-did=([^;]+)/);
      if (m && m[1]) return decodeURIComponent(m[1]);
    } catch {}
    return '';
  }

  function harvestHeadersFromInit(init) {
    if (!init || !init.headers) return;
    try {
      const entries = typeof init.headers.entries === 'function'
        ? [...init.headers.entries()]
        : Array.isArray(init.headers)
          ? init.headers
          : Object.entries(init.headers);
      for (const [rawK, rawV] of entries) {
        if (!rawK || rawV == null) continue;
        const k = String(rawK).toLowerCase();
        const v = String(rawV);
        if (k === 'authorization' && /^Bearer\s+\S+/i.test(v)) {
          const bearer = v.replace(/^Bearer\s+/i, '').trim();
          if (bearer) tok = { t: bearer, at: Date.now() };
        } else if (k.startsWith('oai-')) {
          capturedOaiHeaders[k] = v;
        }
      }
    } catch {}
  }

  async function api(path, opts = {}) {
    if (!tok.t || Date.now() - tok.at > 4 * 60_000) {
      try {
        const s = await pageFetch('/api/auth/session', { credentials: 'same-origin' }).then((r) => r.json());
        const access = s && (s.accessToken || s.access_token || s.user?.accessToken);
        if (access) {
          tok = { t: access, at: Date.now() };
        }
      } catch (e) {
        if (!tok.t) console.warn(TAG, 'session fetch fallback', e);
      }
      if (!tok.t) throw new Error('not signed in (no access token from /api/auth/session)');
    }
    const did = getDeviceId();
    const oaiExtra = {
      ...capturedOaiHeaders,
      ...(did ? { 'oai-device-id': did } : {}),
      'oai-language': capturedOaiHeaders['oai-language'] || (typeof navigator !== 'undefined' && navigator.language) || 'en-US',
    };
    const r = await pageFetch(path, {
      credentials: 'same-origin',
      ...opts,
      headers: {
        ...oaiExtra,
        ...(opts.headers || {}),
        ...(tok.t ? { Authorization: `Bearer ${tok.t}` } : {}),
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (r.status === 401) tok.t = null;
    if (!r.ok) throw new Error(`${path.split('?')[0]} → ${r.status}`);
    return r.json();
  }

  // Model versions and their effort presets ({ title, model_slug, thinking_effort }).
  let versions = null;
  async function loadVersions() {
    const m = await api('/backend-api/models?history_and_training_disabled=false');
    versions = (m.versions || m.models || []).filter((v) => v && v.enabled !== false).map((v) => ({
      id: v.id || v.slug,
      name: v.display_text_full || v.display_text || v.title || v.id || v.slug,
      slugs: v.slugs || (v.slug ? [v.slug] : []),
      presets: (v.intelligence_presets || []).map((p) => ({ title: p.title, model: p.model_slug, effort: p.thinking_effort || null })),
    }));
    return versions;
  }

  // ---------- Accurate Multi-Schema Usage Limits Parser & Passive Live Sniffer ----------
  const IMG_FEATURE_RE = /^(?:image_gen|image_generation|dalle|dall[-_]?e|images?|multimedia|gpt4o_image|oai_image)$/i;
  const IMG_PARTIAL_RE = /image|img|dall[-_]?e/i;

  function extractImageQuotaEntry(j) {
    if (!j || typeof j !== 'object') return null;
    const listCandidates = [
      ...(Array.isArray(j.limits_progress) ? j.limits_progress : []),
      ...(Array.isArray(j.rate_limits) ? j.rate_limits : []),
      ...(Array.isArray(j.feature_limits) ? j.feature_limits : []),
      ...(Array.isArray(j.quotas) ? j.quotas : []),
      ...(Array.isArray(j.usage_limits) ? j.usage_limits : []),
    ];
    let hit = listCandidates.find((x) => x && IMG_FEATURE_RE.test(String(x.feature_name || x.feature || x.name || x.type || x.slug || '')));
    if (!hit) {
      hit = listCandidates.find((x) => x && IMG_PARTIAL_RE.test(String(x.feature_name || x.feature || x.name || x.type || x.slug || '')));
    }
    if (hit) return hit;

    for (const mapObj of [j.limits_progress, j.rate_limits, j.feature_limits, j.quotas, j.usage_limits, j.image_limits]) {
      if (mapObj && typeof mapObj === 'object' && !Array.isArray(mapObj)) {
        if ('remaining' in mapObj || 'max' in mapObj || 'limit' in mapObj) return mapObj;
        for (const [k, v] of Object.entries(mapObj)) {
          if (v && typeof v === 'object' && (IMG_FEATURE_RE.test(k) || IMG_PARTIAL_RE.test(k))) {
            return { feature_name: k, ...v };
          }
        }
      }
    }
    if (typeof j.image_gen_remaining === 'number' || typeof j.remaining_images === 'number') {
      return {
        remaining: j.image_gen_remaining ?? j.remaining_images,
        reset_after: j.image_gen_reset_after ?? j.cap_expires_at ?? null,
      };
    }
    return null;
  }

  function computeRemainingFromEntry(entry) {
    if (!entry || typeof entry !== 'object') return { remaining: null, max: null, reset: null };
    let remaining = entry.remaining ?? entry.remaining_count ?? entry.quota_remaining ?? entry.left ?? entry.available ?? null;
    const max = entry.max ?? entry.max_quota ?? entry.limit ?? entry.quota ?? entry.total ?? null;
    const used = entry.used ?? entry.used_quota ?? entry.count ?? entry.consumed ?? null;
    if (remaining == null && typeof max === 'number' && typeof used === 'number') {
      remaining = Math.max(0, max - used);
    }
    if (typeof remaining === 'string' && /^\d+$/.test(remaining)) {
      remaining = parseInt(remaining, 10);
    }
    const rawReset = entry.reset_after ?? entry.resets_after ?? entry.reset_at ?? entry.resets_at ??
      entry.next_reset_at ?? entry.clears_at ?? entry.clears_in ?? entry.retry_after ?? entry.until ?? null;
    return {
      remaining: typeof remaining === 'number' && isFinite(remaining) ? Math.max(0, remaining) : null,
      max: typeof max === 'number' && isFinite(max) ? max : null,
      reset: normalizeResetIso(rawReset),
    };
  }

  function parseLimitsPayload(j, baseLimits = null) {
    const prev = baseLimits || limits || { imagesLeft: null, imagesMax: null, imagesReset: null, lockedModels: [], notes: [], planTier: null, checkedOk: false };
    if (!j || typeof j !== 'object') return prev;

    const imgEntry = extractImageQuotaEntry(j);
    const imgParsed = computeRemainingFromEntry(imgEntry);

    const lockedMap = new Map();
    const rawModelLimits = Array.isArray(j.model_limits)
      ? j.model_limits
      : (j.model_limits && typeof j.model_limits === 'object')
        ? Object.entries(j.model_limits).map(([k, v]) => (typeof v === 'object' ? { model_slug: k, ...v } : { model_slug: k, resets_after: v }))
        : [];
    for (const x of rawModelLimits) {
      if (!x) continue;
      const slug = x.model_slug || x.slug || x.model || x.feature_name;
      if (!slug) continue;
      const until = normalizeResetIso(x.resets_after ?? x.reset_after ?? x.resets_at ?? x.reset_at ?? x.until ?? x.clears_in ?? null);
      lockedMap.set(slug, { slug, until });
    }
    for (const lp of (Array.isArray(j.limits_progress) ? j.limits_progress : [])) {
      if (lp && lp.remaining === 0 && (lp.model_slug || (lp.feature_name && !IMG_PARTIAL_RE.test(lp.feature_name)))) {
        const slug = lp.model_slug || lp.feature_name;
        const until = normalizeResetIso(lp.reset_after ?? lp.resets_after ?? null);
        if (!lockedMap.has(slug)) lockedMap.set(slug, { slug, until });
      }
    }

    const noteSet = new Set();
    for (const list of [j.blocked_features, j.banners, j.system_hints, j.warnings]) {
      if (!Array.isArray(list)) continue;
      for (const b of list) {
        const text = typeof b === 'string' ? b : (b && (b.description || b.message || b.text || b.title));
        if (text) noteSet.add(String(text).trim());
        if (b && typeof b === 'object' && IMG_PARTIAL_RE.test(String(b.feature_name || b.feature || ''))) {
          if (imgParsed.remaining == null) imgParsed.remaining = 0;
          if (!imgParsed.reset) imgParsed.reset = normalizeResetIso(b.reset_after ?? b.resets_after ?? b.until ?? null);
        }
      }
    }
    if (j.banner_info && typeof j.banner_info === 'object') {
      const bText = j.banner_info.description || j.banner_info.message || j.banner_info.text || j.banner_info.title;
      if (bText) noteSet.add(String(bText).trim());
    }

    let planTier = prev.planTier || null;
    try {
      const acctOrd = j.account_ordering?.[0];
      const acct = (acctOrd && j.accounts?.[acctOrd]) || j.accounts?.default || j.account;
      const rawPlan = acct?.entitlement?.subscription_plan || acct?.plan_type || j.plan_type || j.subscription_plan;
      if (rawPlan) planTier = String(rawPlan).replace(/_/g, ' ');
    } catch {}

    const hasInitFields = ('limits_progress' in j) || ('model_limits' in j) || ('blocked_features' in j) ||
      ('rate_limits' in j) || ('feature_limits' in j) || (imgEntry != null);

    return {
      imagesLeft: imgParsed.remaining !== null ? imgParsed.remaining : (hasInitFields ? null : prev.imagesLeft),
      imagesMax: imgParsed.max !== null ? imgParsed.max : prev.imagesMax,
      imagesReset: imgParsed.reset !== null ? imgParsed.reset : (hasInitFields && imgParsed.remaining === null ? null : prev.imagesReset),
      lockedModels: hasInitFields ? [...lockedMap.values()] : (lockedMap.size ? [...lockedMap.values()] : prev.lockedModels),
      notes: hasInitFields ? [...noteSet] : (noteSet.size ? [...new Set([...prev.notes, ...noteSet])] : prev.notes),
      planTier,
      checkedOk: true,
    };
  }

  function applyRateLimitErrorToLimits(errPayload, status) {
    if (!errPayload || typeof errPayload !== 'object') return;
    const d = errPayload.detail && typeof errPayload.detail === 'object' ? errPayload.detail : errPayload;
    const msg = String(d.message || d.description || (typeof errPayload.detail === 'string' ? errPayload.detail : '') || '').trim();
    const rawReset = d.resets_after ?? d.reset_after ?? d.clears_in ?? d.retry_after ?? d.until ?? null;
    const normReset = normalizeResetIso(rawReset);
    if (!limits) {
      limits = { imagesLeft: null, imagesMax: null, imagesReset: null, lockedModels: [], notes: [], planTier: null, checkedOk: true };
    }
    if (status === 429 || /rate_limit|usage_cap|limit_reached|too many/i.test(String(d.type || d.code || msg))) {
      if (IMG_PARTIAL_RE.test(msg) || IMG_PARTIAL_RE.test(String(d.type || d.feature_name || ''))) {
        limits.imagesLeft = 0;
        if (normReset) limits.imagesReset = normReset;
      }
      if (d.model_slug && !limits.lockedModels.some((m) => m.slug === d.model_slug)) {
        limits.lockedModels.push({ slug: d.model_slug, until: normReset });
      }
      if (msg && !limits.notes.includes(msg)) {
        limits.notes.push(msg);
      }
      onLimitsUpdated(limits);
    }
  }

  async function loadLimits() {
    const tz = new Date().getTimezoneOffset();
    const gizmoId = baseProjectIdOf(location.pathname) || null;
    const convId = convIdOf(location.pathname) || null;
    const reqModel = (override && override.version) || (versions && versions[0]?.slugs?.[0]) || null;

    let initJson = null;
    try {
      initJson = await api('/backend-api/conversation/init', {
        method: 'POST',
        body: JSON.stringify({
          gizmo_id: gizmoId,
          requested_default_model: reqModel,
          conversation_id: convId,
          timezone_offset_min: tz,
        }),
      });
    } catch (firstErr) {
      if (gizmoId || convId || reqModel) {
        try {
          initJson = await api('/backend-api/conversation/init', {
            method: 'POST',
            body: JSON.stringify({
              gizmo_id: null,
              requested_default_model: null,
              conversation_id: null,
              timezone_offset_min: tz,
            }),
          });
        } catch {}
      }
    }

    if (initJson) {
      limits = parseLimitsPayload(initJson, limits);
    } else {
      const acctJson = await api('/backend-api/accounts/check/v4-2023-04-27');
      limits = parseLimitsPayload(acctJson, limits);
    }
    return limits;
  }

  function lockFor(versionId, effort) {
    if (!versions || !limits) return null;
    if (effort) {
      const vers = versionId ? versions.filter((v) => v.id === versionId) : versions;
      const slugs = vers.flatMap((v) => v.presets.filter((p) => p.title === effort).map((p) => p.model));
      return limits.lockedModels.find((l) => slugs.includes(l.slug)) || null;
    }
    if (versionId) {
      const slugs = versions.filter((v) => v.id === versionId).flatMap((v) => [...v.slugs, ...v.presets.map((p) => p.model)]);
      return limits.lockedModels.find((l) => slugs.includes(l.slug)) || null;
    }
    return null;
  }

  // ---------- Nuance 1: Automatic Model Selector Alternation on Failed Run ----------
  let modelAltCursor = 0;
  const failedModelIds = new Set();

  function selectAlternateModel(currentVerId, currentEffort) {
    const avail = (versions || []).filter((v) => v && v.id);
    if (!avail.length) return null;
    const activeVerId = currentVerId || avail[0].id;
    failedModelIds.add(activeVerId);

    const isUnlocked = (v) => !lockFor(v.id, '');
    let pool = avail.filter((v) => v.id !== activeVerId && !failedModelIds.has(v.id) && isUnlocked(v));
    if (!pool.length) {
      failedModelIds.clear();
      failedModelIds.add(activeVerId);
      pool = avail.filter((v) => v.id !== activeVerId && isUnlocked(v));
    }
    if (!pool.length) {
      pool = avail.filter((v) => v.id !== activeVerId);
    }
    if (!pool.length) {
      const only = avail[0];
      const presets = (only.presets || []).map((p) => p.title).filter(Boolean);
      if (presets.length > 1) {
        const curIdx = presets.indexOf(currentEffort);
        const nextEffort = presets[(curIdx + 1) % presets.length];
        return { version: only.id, name: only.name || only.id, effort: nextEffort };
      }
      return { version: only.id, name: only.name || only.id, effort: currentEffort || KEEP };
    }
    const chosen = pool[modelAltCursor % pool.length];
    modelAltCursor += 1;
    const effortStillValid = currentEffort && (chosen.presets || []).some((p) => p.title === currentEffort);
    return {
      version: chosen.id,
      name: chosen.name || chosen.id,
      effort: effortStillValid ? currentEffort : KEEP,
    };
  }

  async function alternateModelOnFailure(s = null, ui = null) {
    if (!versions || !versions.length) {
      await loadVersions().catch(() => null);
    }
    const curVer = (override && override.version) || (s && s.version) || '';
    const curEffort = (override && override.effort) || (s && s.effort) || '';
    const next = selectAlternateModel(curVer, curEffort);
    if (!next) return null;
    override = { version: next.version, effort: next.effort };
    if (s) {
      s.version = next.version;
      s.effort = next.effort;
    }
    if (ui && typeof ui.setModelSelection === 'function') {
      ui.setModelSelection(next.version, next.effort);
    }
    console.log(TAG, `auto-alternated model → ${next.name}${next.effort ? ' (' + next.effort + ')' : ''}`);
    return next;
  }

  // ---------- Nuance 3: Auto-Answer Assistant Clarification / Open-Ended Questions ----------
  const CLARIFY_RE = /\?|clarif|how\s+many\s+panel|panel\s+amount|grid\s+composite|layout|aspect\s+ratio|which\s+(?:one|style|version|option|layout)|would\s+you\s+(?:like|prefer)|do\s+you\s+(?:want|prefer)|please\s+(?:specify|confirm|let\s+me\s+know)|before\s+I\s+(?:generate|create|draw)|should\s+I\s+(?:use|make|include)/i;
  const HARD_REFUSAL_RE = /\b(?:violates?\s+our\s+(?:content\s+)?polic(?:y|ies)|cannot\s+generate\s+(?:explicit|nsfw|harmful)|against\s+my\s+safety\s+guidelines)\b/i;

  function isAssistantClarificationQuestion(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return false;
    if (HARD_REFUSAL_RE.test(t) && !t.includes('?')) return false;
    return CLARIFY_RE.test(t);
  }

  function buildClarificationReply(questionText, customTemplate) {
    const base = (typeof customTemplate === 'string' && customTemplate.trim())
      ? customTemplate.trim()
      : DEFAULT_CLARIFY_REPLY;
    if (/panel|grid|composite/i.test(String(questionText || '')) && !/\b\d+\s*-?\s*panel/i.test(base)) {
      return `Use a 4-panel (2x2) grid composite layout. ${base}`;
    }
    return base;
  }

  // ---------- model/effort + held image attachments: rewrite the page's own send request ----------
  let override = null; // { version, effort } while a run is active
  function rewriteBody(b) {
    if (!b || typeof b !== 'object') return false;
    let mutated = false;

    captureAttachmentsFromBody(b);

    if (injectHeldAttachmentsIntoBody(b)) {
      mutated = true;
    }

    if (override && typeof b.model === 'string' && versions) {
      const cur = versions.find((v) => v.slugs.includes(b.model) || v.presets.some((p) => p.model === b.model));
      const curPreset = cur?.presets.find((p) => p.model === b.model && (p.effort || null) === (b.thinking_effort || null));
      const ver = override.version ? versions.find((v) => v.id === override.version) : cur;
      const title = override.effort || curPreset?.title;
      const p = ver?.presets.find((x) => x.title === title) || ver?.presets[0] ||
        (ver?.slugs.length ? { model: ver.slugs[0], effort: null } : null);
      if (p) {
        b.model = p.model;
        if (p.effort) b.thinking_effort = p.effort; else delete b.thinking_effort;
        mutated = true;
      }
    }
    return mutated;
  }

  const patchedFetch = async function (input, init) {
    harvestHeadersFromInit(init);
    let originalInit = init;
    let wasRewritten = false;
    let path = '';
    try {
      const method = ((init && init.method) || (typeof input === 'object' && input && input.method) || 'GET').toUpperCase();
      const rawUrl = typeof input === 'string' ? input : (input && typeof input.url === 'string' ? input.url : String(input));
      path = new URL(rawUrl, location.href).pathname;
      if (init && typeof init.body === 'string' && method === 'POST') {
        if (path.startsWith('/backend-api/f/conversation') || path === '/backend-api/conversation') {
          const b = JSON.parse(init.body);
          if (rewriteBody(b)) {
            wasRewritten = true;
            init = { ...init, body: JSON.stringify(b) };
            console.log(TAG, 'request rewritten →', b.model, b.thinking_effort || '', `held_imgs=${heldAttachments.pointers.length}`);
          }
        }
      }
    } catch (e) { console.warn(TAG, 'rewrite skipped', e); }

    try {
      const res = await pageFetch(input, init);
      if (res && res.ok && (path === '/backend-api/conversation/init' || path.startsWith('/backend-api/accounts/check/'))) {
        try {
          if (typeof res.clone === 'function') {
            res.clone().json().then((j) => {
              limits = parseLimitsPayload(j, limits);
              onLimitsUpdated(limits);
            }).catch(() => {});
          }
        } catch {}
      } else if (res && !res.ok && res.status === 429 && (path.startsWith('/backend-api/f/conversation') || path === '/backend-api/conversation')) {
        try {
          if (typeof res.clone === 'function') {
            res.clone().json().then((errJson) => applyRateLimitErrorToLimits(errJson, 429)).catch(() => {});
          }
        } catch {}
      }
      if (wasRewritten && res && !res.ok && res.status >= 400) {
        console.warn(TAG, `masked failed rewritten POST (${res.status}); retrying statelessly with base payload`);
        heldAttachments = { pointers: [], attachments: [] };
        onHeldChange();
        return await pageFetch(input, originalInit);
      }
      return res;
    } catch (fetchErr) {
      if (wasRewritten) {
        console.warn(TAG, 'masked fetch exception on rewritten POST; retrying statelessly', fetchErr);
        return await pageFetch(input, originalInit);
      }
      throw fetchErr;
    }
  };
  pageWin.fetch = patchedFetch;
  if (pageWin !== window) window.fetch = patchedFetch;

  // ---------- composer + navigation ----------
  function setPrompt(text) {
    const ed = $(SEL.editor);
    if (!ed) throw new Error('composer not found');
    ed.focus();
    if (ed.tagName === 'TEXTAREA' || ed.tagName === 'INPUT') {
      const proto = ed.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement?.prototype : window.HTMLInputElement?.prototype;
      const setter = proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(ed, text); else ed.value = text;
      ed.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
      return;
    }
    let ok = false;
    try {
      document.execCommand('selectAll');
      ok = document.execCommand('insertText', false, text);
    } catch { ok = false; }
    if (!ok) {
      ed.textContent = text;
      ed.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
    }
  }

  function resetComposerStateless() {
    try {
      const inp = findComposerFileInput();
      if (inp) {
        try { inp.value = ''; } catch {}
      }
    } catch {}
  }

  async function sendPrompt(text, isCancelled, waitForFinish, skipHeldAttach = false) {
    if (!(await waitFor(() => isCancelled() || ($(SEL.editor) && !generating()), 60_000))) throw new Error('composer never became ready');
    if (isCancelled()) return null;
    if (!skipHeldAttach && holdEnabled && heldFiles.length > 0) {
      await attachHeldImagesToComposer(isCancelled);
      if (isCancelled()) return null;
    }
    setPrompt(text);
    const send = await waitFor(() => isCancelled() || $$(SEL.send).find((b) => visible(b) && !b.disabled), 10_000);
    if (isCancelled()) return null;
    if (!send) throw new Error('send button not available');
    send.click();
    await waitFor(generating, 15_000);
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

  async function newChat(target, isCancelled = () => false) {
    if (isCancelled()) return;
    const path = location.pathname;
    const onBlankPage = !path.includes('/c/');
    let btn;
    if (!target) {
      if (path === '/') return;
      btn = firstVisible('button[aria-label="New chat"], a[aria-label="New chat"], [data-testid="create-new-chat-button"]') ||
        $$('button, a').find((b) => visible(b) && b.textContent.trim() === 'New chat');
    } else if (target.id) {
      const baseId = baseProjectIdOf(target.id) || target.id;
      if (onBlankPage && (projectIdOf(path) === target.id || baseProjectIdOf(path) === baseId)) return;
      const exactSel = `a[href="/g/${CSS.escape(target.id)}/project"], a[href="/g/${CSS.escape(target.id)}"]`;
      const prefixSel = `a[href^="/g/${CSS.escape(baseId)}"][href$="/project"], a[href^="/g/${CSS.escape(baseId)}"]`;
      btn = firstVisible(exactSel) || firstVisible(prefixSel) || $(exactSel) || $(prefixSel);
      if (!btn && target.name) {
        btn = firstVisible(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`) ||
          $(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`);
      }
    } else if (target.name) {
      btn = firstVisible(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`) ||
        $(`button[aria-label="New chat in ${CSS.escape(target.name)}"]`);
    }
    if (!btn) throw new Error('could not find a way to open a new chat there');
    btn.click();
    await sleep(1000);
    const opened = () => !location.pathname.includes('/c/') && (onBlankPage || location.pathname !== path) && $(SEL.editor) && !generating();
    if (!(await waitFor(() => isCancelled() || opened(), 15_000))) throw new Error('new chat did not open');
    if (isCancelled()) return;
    await sleep(500);
  }

  // ---------- gallery: read each chat's images from the API ----------
  const jobs = []; // { n, convId, k, prompt, sentAt, state: 'pending'|'done'|'failed', images: [{ id, url }], dlRetries, clarifyCount, clarifyNorms, pendingClarification, cleanedUp, note }
  let pollTimer = null;
  let polling = false;
  let onGalleryChange = () => {};

  // ---------- Nuance 4: Automatic Cleanup of Failed Run's Thread ----------
  async function cleanupFailedConversation(convId, job = null) {
    if (!convId) return false;
    if (job && job.cleanedUp) return true;
    if (jobs.some((j) => j.convId === convId && (j.state === 'done' || (j.images && j.images.length > 0)))) {
      return false;
    }
    try {
      await api(`/backend-api/conversation/${convId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_visible: false }),
      });
      if (job) {
        job.cleanedUp = true;
        if (job.note && !job.note.includes('[thread cleaned]')) {
          job.note = `${job.note} [thread cleaned]`;
        }
      }
      console.log(TAG, 'auto-cleaned failed thread →', convId);
      return true;
    } catch (e) {
      console.warn(TAG, 'failed thread cleanup skipped for', convId, e);
      return false;
    }
  }

  function thread(conv) {
    const out = [];
    const seen = new Set();
    if (!conv || !conv.mapping) return out;
    for (let id = conv.current_node; id && !seen.has(id); id = conv.mapping[id]?.parent) {
      seen.add(id);
      const m = conv.mapping[id]?.message;
      if (m) out.unshift(m);
    }
    return out;
  }
  const textOf = (m) => (m?.content?.parts || []).filter((p) => typeof p === 'string').join('').trim();
  const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

  function extractPointerIdsFromMessage(m) {
    if (!m) return [];
    const out = [];
    const collectPart = (p) => {
      if (!p || typeof p !== 'object') return;
      if (p.content_type === 'image_asset_pointer' && p.asset_pointer) {
        out.push(String(p.asset_pointer).replace(/^[a-z-]+:\/\//i, ''));
      }
      if (Array.isArray(p.parts)) {
        for (const sub of p.parts) collectPart(sub);
      }
    };
    for (const p of m.content?.parts || []) collectPart(p);
    for (const att of m.metadata?.attachments || []) {
      if (att?.id && (att.mime_type || att.mimeType || '').startsWith('image/')) {
        out.push(String(att.id).replace(/^[a-z-]+:\/\//i, ''));
      }
    }
    return [...new Set(out.filter(Boolean))];
  }

  async function pollGallery() {
    if (polling) return;
    polling = true;
    try {
      const cfg = load();
      const pending = jobs.filter((j) => j.state === 'pending');
      for (const convId of new Set(pending.map((j) => j.convId))) {
        let conv;
        try { conv = await api(`/backend-api/conversation/${convId}`); } catch (e) { console.warn(TAG, e); continue; }
        const msgs = thread(conv);
        const userIdx = [];
        const userNormByIdx = new Map();
        for (let i = 0; i < msgs.length; i++) {
          if (msgs[i].author?.role === 'user') {
            userIdx.push(i);
            userNormByIdx.set(i, norm(textOf(msgs[i])));
          }
        }
        const convJobs = jobs.filter((j) => j.convId === convId && j.state === 'pending');
        for (const job of convJobs) {
          const jobNorm = norm(job.prompt);
          const matchIdx = userIdx.filter((i) => userNormByIdx.get(i) === jobNorm);
          const siblings = jobs.filter((j) => j.convId === convId && norm(j.prompt) === jobNorm).sort((a, b) => a.k - b.k);
          const off = matchIdx.length >= siblings.length ? matchIdx.length - siblings.length + job.k : job.k;
          const ui = off >= 0 && off < matchIdx.length ? matchIdx[off] : undefined;
          if (ui === undefined) continue;
          try {
            const nextUser = userIdx.find((i) => i > ui && !(job.clarifyNorms && job.clarifyNorms.has(userNormByIdx.get(i)))) ?? msgs.length;
            const seg = msgs.slice(ui + 1, nextUser);
            let activeSeg = seg;
            for (let sIdx = seg.length - 1; sIdx >= 0; sIdx--) {
              if (seg[sIdx]?.author?.role === 'user') {
                activeSeg = seg.slice(sIdx + 1);
                break;
              }
            }
            const ids = [
              ...new Set(
                activeSeg
                  .filter((m) => m.status === 'finished_successfully' || m.end_turn === true)
                  .flatMap(extractPointerIdsFromMessage)
              ),
            ];
            let dlFailed = false;
            for (const id of ids) {
              if (job.images.some((x) => x.id === id)) continue;
              try {
                const d = await api(`/backend-api/files/download/${id}?conversation_id=${convId}&inline=false`);
                if (d && d.download_url) {
                  job.images.push({ id, url: d.download_url });
                  sessionStats.imagesGenerated += 1;
                } else {
                  dlFailed = true;
                }
              } catch (e) {
                dlFailed = true;
                console.warn(TAG, e);
              }
            }
            const last = activeSeg[activeSeg.length - 1];
            const lastImg = activeSeg.map((m, i) => (extractPointerIdsFromMessage(m).length > 0 ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
            const movedOn = lastImg >= 0 && activeSeg.slice(lastImg + 1).some((m) => m.author?.role === 'assistant');
            const finishedWithout = lastImg < 0 && last?.author?.role === 'assistant' && textOf(last) && (last.end_turn === true || last.status === 'finished_successfully');
            const ended = movedOn || finishedWithout || activeSeg.some((m) => m.author?.role === 'assistant' && m.end_turn === true);
            if (ended) {
              if (job.images.length > 0 && !dlFailed) {
                job.state = 'done';
                job.pendingClarification = null;
              } else if (ids.length > 0 && job.images.length === 0) {
                job.dlRetries = (job.dlRetries || 0) + 1;
                if (job.dlRetries >= MAX_DL_RETRIES) {
                  job.state = 'failed';
                  job.note = 'Image asset generated, but signed download URL request was blocked or failed.';
                }
              } else if (job.images.length > 0) {
                // (R6-4) Partial download failure: MAX_DL_RETRIES exists for
                // exactly this window, but the old branch required
                // images.length === 0 to arm it — a job that fetched 1 of 2
                // images went straight to done with the second silently
                // missing. Stay pending while the retry budget lasts so the
                // next tick re-fetches only the missing ids.
                if (dlFailed && (job.dlRetries || 0) < MAX_DL_RETRIES) {
                  job.dlRetries = (job.dlRetries || 0) + 1;
                } else {
                  job.state = 'done';
                  job.pendingClarification = null;
                }
              } else {
                const assistantText = textOf([...activeSeg].reverse().find((m) => m.author?.role === 'assistant' && textOf(m)) || { content: {} });
                if (
                  cfg.autoClarify !== false &&
                  (job.clarifyCount || 0) < MAX_CLARIFY_RETRIES &&
                  isAssistantClarificationQuestion(assistantText)
                ) {
                  job.pendingClarification = assistantText;
                  // (R6-1) The poller is the only consumer left standing in
                  // the default non-wait mode — evaluateJobAfterSend's loop
                  // has long returned by the time the question lands.
                  maybeAnswerPendingClarification(job, cfg);
                } else {
                  job.state = 'failed';
                  job.note = assistantText.slice(0, 300) || 'No image returned.';
                  if (cfg.autoCleanFailed !== false && !job.cleanedUp) {
                    await cleanupFailedConversation(convId, job);
                  }
                }
              }
            } else if (Date.now() - job.sentAt > 15 * 60_000) {
              if (job.pendingClarification) {
                // (R6-1) An unanswered clarification is a recoverable
                // thread, not a dead one — report it honestly and NEVER
                // auto-delete it out from under the operator.
                job.state = 'failed';
                job.note = `Clarification needed (unanswered — open the chat to reply): ${String(job.pendingClarification).slice(0, 200)}`;
              } else {
                job.state = 'failed'; job.note = 'Timed out after 15 minutes.';
                if (cfg.autoCleanFailed !== false && !job.cleanedUp) {
                  await cleanupFailedConversation(convId, job);
                }
              }
            }
          } catch (e) { console.warn(TAG, 'poll failed for job #' + job.n, e); }
        }
      }
    } catch (e) {
      console.warn(TAG, 'gallery poll error', e);
    } finally {
      polling = false;
      onGalleryChange();
      if (limits) onLimitsUpdated(limits);
      if (!jobs.some((j) => j.state === 'pending')) { clearInterval(pollTimer); pollTimer = null; }
    }
  }
  function trackJob(job) {
    jobs.push({ dlRetries: 0, clarifyCount: 0, clarifyNorms: new Set(), pendingClarification: null, cleanedUp: false, ...job });
    onGalleryChange();
    if (!pollTimer) pollTimer = setInterval(pollGallery, 4000);
    return jobs[jobs.length - 1];
  }

  // ---------- (R6-1) asynchronous clarification consumer ----------
  // evaluateJobAfterSend's clarify loop only lives while the run loop is
  // still standing on the job's chat. In the default non-wait mode ("New
  // chat for each image" + no wait) the page moves on within ~1 s, the
  // question lands tens of seconds later, and the poller used to set
  // job.pendingClarification that nothing ever consumed: a 15-minute spin
  // ending in a failure whose auto-clean then DELETED a perfectly
  // recoverable thread — while "Auto-answer clarification questions" was
  // ticked on. The poller now answers asynchronously whenever the page is
  // actually sitting on the question's conversation and no run owns the
  // composer (the run loop's own evaluateJobAfterSend covers the in-run
  // window); every other case resolves through the timeout branch's honest
  // clarify note with the thread left alive.
  const clarifyInFlight = new Set();
  function maybeAnswerPendingClarification(job, cfg) {
    if (!job || !job.pendingClarification) return;
    if (running || clarifyInFlight.has(job.n)) return;
    if (cfg && cfg.autoClarify === false) return;
    if ((job.clarifyCount || 0) >= MAX_CLARIFY_RETRIES) return;
    if (convIdOf(location.pathname) !== job.convId) return; // not on this chat — cannot use the composer
    clarifyInFlight.add(job.n);
    (async () => {
      let lastQuestion = null;
      try {
        while (
          !running &&
          job.state === 'pending' &&
          job.pendingClarification &&
          (cfg || load()).autoClarify !== false &&
          (job.clarifyCount || 0) < MAX_CLARIFY_RETRIES
        ) {
          const question = job.pendingClarification;
          lastQuestion = question;
          job.pendingClarification = null;
          job.clarifyCount = (job.clarifyCount || 0) + 1;
          const reply = buildClarificationReply(question, (cfg || load()).clarifyReply);
          if (!job.clarifyNorms) job.clarifyNorms = new Set();
          job.clarifyNorms.add(norm(reply));
          console.log(TAG, `auto-answering clarification (${job.clarifyCount}/${MAX_CLARIFY_RETRIES}) on job #${job.n} (async)`);
          await sendPrompt(reply, () => false, true, true);
          await pollGallery();
        }
      } catch (e) {
        // The question was consumed but not answered — put it back so the
        // timeout branch reports a clarify-pending thread (and keeps it).
        if (job.state === 'pending' && !job.pendingClarification && lastQuestion) {
          job.pendingClarification = lastQuestion;
        }
        console.warn(TAG, 'async clarification failed for job #' + job.n, e);
      } finally {
        clarifyInFlight.delete(job.n);
        onGalleryChange();
      }
    })();
  }

  // ---------- runner (with Smart Stop, Auto-Clarify, Auto-Alternate Model & Failed Thread Cleanup) ----------
  function maskFailedRunStep(stepIndex, totalCount, err) {
    console.warn(TAG, `Masked failed generation/API run ${stepIndex}/${totalCount}:`, err);
    resetComposerStateless();
  }

  async function evaluateJobAfterSend(job, s, ui, isCancelled, stepIdx, totalCount) {
    if (!job || isCancelled()) return;
    await pollGallery();
    while (
      !isCancelled() &&
      job.state === 'pending' &&
      job.pendingClarification &&
      s.autoClarify !== false &&
      (job.clarifyCount || 0) < MAX_CLARIFY_RETRIES
    ) {
      const question = job.pendingClarification;
      job.pendingClarification = null;
      job.clarifyCount = (job.clarifyCount || 0) + 1;
      const reply = buildClarificationReply(question, s.clarifyReply);
      if (!job.clarifyNorms) job.clarifyNorms = new Set();
      job.clarifyNorms.add(norm(reply));
      ui.status(`Auto-answering clarification (${job.clarifyCount}/${MAX_CLARIFY_RETRIES}) on ${stepIdx}/${totalCount}…`);
      await sendPrompt(reply, isCancelled, true, true);
      if (isCancelled()) return;
      await pollGallery();
    }
  }

  async function run(ui) {
    const s = ui.read();
    holdEnabled = !!s.holdImages;
    saveJSON(STORE_KEY, s);
    if (!s.prompt.trim()) return ui.status('Enter a prompt first.');
    capturePageComposerFiles();
    running = true; cancelled = false; ui.setRunning(true);
    let count = s.count;
    let sentOk = 0;
    let maskedFailures = 0;
    let smartStoppedAt = 0;
    const runJobNumbers = new Set();
    try {
      if (!versions) await loadVersions().catch(() => null);
      if ((s.version || s.effort) && !versions) {
        console.warn(TAG, 'masked loadVersions failure; continuing with Keep current');
      }
      limits = await loadLimits().catch(() => limits);
      ui.renderLimits(limits);

      const lock = lockFor(s.version, s.effort);
      if (lock && !s.force) {
        if (s.autoAltModel !== false && versions && versions.length > 1) {
          await alternateModelOnFailure(s, ui);
        } else {
          throw new Error(`${s.effort || lock.slug || 'That model'} is locked until ${when(lock.until)}. Tick "Send anyway" to try regardless.`);
        }
      }
      if (limits?.imagesLeft === 0) throw new Error(`Image limit reached. Resets ${resets(limits.imagesReset)}.`);
      if (limits?.imagesLeft != null && limits.imagesLeft < count) count = limits.imagesLeft;

      override = (s.version || s.effort) && versions ? { version: s.version, effort: s.effort } : null;
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
        if (s.smartStop !== false && jobs.some((j) => runJobNumbers.has(j.n) && j.images.length > 0)) {
          smartStoppedAt = i - 1;
          break;
        }
        try {
          if (s.mode === 'new') {
            ui.status(`Opening chat ${i}/${count}…`);
            await newChat(target, () => cancelled);
            if (target?.name) {
              const pid = projectIdOf(location.pathname);
              if (pid) target = { id: pid, name: target.name };
            }
          }
          const wait = s.mode === 'same' || s.wait;
          const heldCount = heldFiles.length || heldAttachments.pointers.length;
          const heldTag = holdEnabled && heldCount > 0 ? ` (+${heldCount} held img)` : '';
          ui.status(wait ? `Generating ${i}/${count}${heldTag}…` : `Sending ${i}/${count}${heldTag}…`);
          const sentAt = Date.now();
          const convId = await sendPrompt(s.prompt, () => cancelled, wait);
          if (!convId) {
            if (cancelled) break;
            maskedFailures += 1;
            maskFailedRunStep(i, count, new Error('no conversation ID created'));
            if (s.autoAltModel !== false) await alternateModelOnFailure(s, ui);
            continue;
          }
          sentOk += 1;
          sessionStats.promptsSent += 1;
          const trackedJob = trackJob({ n: jobs.length + 1, convId, k: jobs.filter((j) => j.convId === convId && norm(j.prompt) === norm(s.prompt)).length, prompt: s.prompt, sentAt, state: 'pending', images: [], note: '' });
          runJobNumbers.add(trackedJob.n);

          if (s.smartStop !== false || s.autoClarify !== false || s.autoAltModel !== false || s.autoCleanFailed !== false) {
            await evaluateJobAfterSend(trackedJob, s, ui, () => cancelled, i, count);
          }

          if (trackedJob.state === 'failed') {
            maskedFailures += 1;
            if (s.autoCleanFailed !== false && !trackedJob.cleanedUp) {
              await cleanupFailedConversation(convId, trackedJob);
            }
            if (s.autoAltModel !== false) {
              const alt = await alternateModelOnFailure(s, ui);
              if (alt) ui.status(`Run ${i}/${count} failed → alternated model to ${alt.name}`);
            }
          } else if (
            s.smartStop !== false &&
            (trackedJob.images.length > 0 || jobs.some((j) => runJobNumbers.has(j.n) && j.images.length > 0))
          ) {
            smartStoppedAt = i;
            break;
          }

          limits = await loadLimits().catch(() => limits);
          ui.renderLimits(limits);
          if (limits?.imagesLeft === 0 && i < count) { ui.status(`Image limit reached after ${i}. Resets ${resets(limits.imagesReset)}.`); return; }
        } catch (iterErr) {
          if (cancelled) break;
          maskedFailures += 1;
          maskFailedRunStep(i, count, iterErr);
          const failedConvId = convIdOf(location.pathname);
          if (s.mode === 'new' && failedConvId && s.autoCleanFailed !== false) {
            await cleanupFailedConversation(failedConvId);
          }
          if (s.autoAltModel !== false) {
            await alternateModelOnFailure(s, ui);
          }
          if (count === 1) throw iterErr;
        }
        if (i < count && !cancelled) await sleepUnless(s.delay * 1000, () => cancelled);
      }
      if (smartStoppedAt > 0) {
        ui.status(`Smart stop engaged: image generated on run ${smartStoppedAt}/${count}.`);
      } else {
        const capped = count < s.count ? ` (capped at ${count}: that's all the image limit allows)` : '';
        const maskedNote = maskedFailures > 0 ? ` (${maskedFailures} failed run${maskedFailures > 1 ? 's' : ''} masked)` : '';
        const tail = s.mode === 'new' && !s.wait ? ' Images keep generating in their chats.' : '';
        ui.status(cancelled ? 'Stopped.' : `Done: sent ${sentOk || count} prompts${capped}${maskedNote}.${tail}`);
      }
    } catch (e) {
      console.error(TAG, e);
      ui.status(`Error: ${e.message}`);
    } finally {
      override = null;
      resetComposerStateless();
      running = false; ui.setRunning(false);
    }
  }

  // ---------- UI (shadow DOM so ChatGPT's CSS can't touch it) ----------
  function buildUI() {
    if (document.getElementById('bulkimg-host')) return;
    const host = document.createElement('div');
    host.id = 'bulkimg-host';
    host.style.cssText = 'position:fixed;right:16px;bottom:88px;z-index:2147483646;';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { all: initial; }
        * { box-sizing: border-box; font: 13px/1.4 'JetBrains Mono', system-ui, -apple-system, sans-serif; }
        .fab { width: 44px; height: 44px; border-radius: 50%; border: 1px solid #00E5FF; background: rgba(10,19,26,0.92); color: #00E5FF; cursor: pointer; font-size: 18px; box-shadow: 0 4px 14px rgba(0,0,0,.4); transition: all 150ms ease; }
        .panel { display: none; width: 360px; max-height: calc(100vh - 160px); overflow-y: auto; margin-bottom: 8px; padding: 12px; border-radius: 12px; background: rgba(10,19,26,0.94); color: #eee; border: 1px solid #00E5FF; box-shadow: 0 8px 28px rgba(0,0,0,.5); transition: all 150ms ease; }
        .panel.open { display: block; }
        h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #00E5FF; }
        h4 { margin: 12px 0 6px; font-size: 12px; font-weight: 600; color: #aaa; display: flex; justify-content: space-between; align-items: center; }
        label { display: block; margin: 8px 0 4px; color: #aaa; font-size: 12px; }
        textarea, input, select { width: 100%; padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(0,229,255,0.35); background: rgba(10,19,26,0.85); color: #eee; transition: all 150ms ease; }
        textarea { min-height: 80px; resize: vertical; }
        .row { display: flex; gap: 8px; align-items: flex-end; }
        .row > div { flex: 1; min-width: 0; }
        .check { display: flex; gap: 6px; align-items: center; margin: 8px 0 0; color: #ccc; cursor: pointer; }
        .check input { width: auto; margin: 0; }
        .actions { display: flex; gap: 8px; margin-top: 10px; }
        button.go, button.stop { flex: 1; padding: 8px; border-radius: 8px; border: 0; cursor: pointer; font-weight: 600; transition: all 150ms ease; }
        button.go { background: #00E5FF; color: #0a131a; }
        button.stop { background: #2a343d; color: #eee; }
        button:disabled { opacity: .4; cursor: default; }
        .link { background: none; border: 0; color: #00E5FF; cursor: pointer; padding: 0; font-size: 12px; }
        .hidden { display: none !important; }
        .status { margin-top: 8px; min-height: 18px; color: #00E5FF; font-size: 12px; }
        .limits { font-size: 12px; color: #ccc; background: rgba(10,19,26,0.75); border: 1px solid rgba(0,229,255,0.2); border-radius: 8px; padding: 6px 8px; }
        .limits div { margin: 2px 0; }
        .warn { color: #f0b46c; }
        .ref-box { margin-top: 8px; padding: 8px; border-radius: 8px; border: 1px dashed rgba(0,229,255,0.35); background: rgba(10,19,26,0.7); }
        .ref-head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #bbb; }
        .ref-actions { display: flex; gap: 8px; align-items: center; }
        .ref-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .ref-chip { position: relative; width: 48px; height: 48px; border-radius: 6px; overflow: hidden; border: 1px solid rgba(0,229,255,0.35); background: #0a131a; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #aaa; text-align: center; padding: 2px; }
        .ref-chip img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ref-rm { position: absolute; right: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; border: 0; background: rgba(0,0,0,.75); color: #fff; font-size: 11px; line-height: 16px; padding: 0; cursor: pointer; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .tile { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: rgba(10,19,26,0.85); border: 1px solid rgba(0,229,255,0.2); display: flex; align-items: center; justify-content: center; color: #888; font-size: 12px; cursor: pointer; text-align: center; padding: 4px; }
        .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .tile .n { position: absolute; left: 4px; top: 4px; background: rgba(0,0,0,.6); color: #fff; border-radius: 6px; padding: 0 5px; font-size: 11px; }
        .tile.failed { color: #f0b46c; }
        .spin { width: 18px; height: 18px; border: 2px solid #2a343d; border-top-color: #00E5FF; border-radius: 50%; animation: s 1s linear infinite; }
        @keyframes s { to { transform: rotate(360deg); } }
        .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,.85); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 1; }
        .lightbox img { max-width: 90vw; max-height: 80vh; border-radius: 8px; }
        .lightbox .bar { display: flex; gap: 8px; }
        .lightbox a, .lightbox button { background: #00E5FF; color: #0a131a; border: 0; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; text-decoration: none; }
      </style>
      <div class="panel">
        <h3>Ψ Bulk images <span style="color:#777;font-weight:400;font-size:11px">v${typeof GM_info !== 'undefined' ? GM_info.script.version : VERSION}</span></h3>
        <label for="p">Prompt</label>
        <textarea id="p" placeholder="create image of …"></textarea>
        <div class="ref-box" id="refBox">
          <div class="ref-head">
            <span id="refTitle">Held input images (0)</span>
            <div class="ref-actions">
              <button type="button" class="link" id="addRefBtn">+ add images</button>
              <button type="button" class="link hidden" id="clearRef">clear</button>
            </div>
          </div>
          <input id="refInput" type="file" accept="image/*" multiple class="hidden">
          <div class="ref-grid hidden" id="refGrid"></div>
          <label class="check"><input id="holdImages" type="checkbox"> Hold input images for every chat &amp; repeated runs</label>
        </div>
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
        <label class="check"><input id="smartStop" type="checkbox"> Smart stop once an image is generated</label>
        <label class="check"><input id="autoAltModel" type="checkbox"> Auto-alternate model on failed run</label>
        <label class="check"><input id="autoCleanFailed" type="checkbox"> Auto-delete failed run threads</label>
        <label class="check"><input id="autoClarify" type="checkbox"> Auto-answer assistant clarification questions</label>
        <div id="clarifyRow">
          <label for="clarifyReply">Auto-clarification reply</label>
          <input id="clarifyReply" type="text" placeholder="Use a 4-panel (2x2) grid layout and generate now…">
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
      <div style="text-align:right"><button class="fab" title="Ψ Bulk images">🖼</button></div>
      <div class="lightbox hidden"><img alt=""><div class="bar"><button id="lbChat">Open chat</button><a id="lbDl" download>Download</a><button id="lbClose">Close</button></div></div>`;

    const q = (s) => root.querySelector(s);
    const panel = q('.panel');
    const s = load();

    const fill = (sel, options, value) => {
      sel.replaceChildren(...options.map(([v, t]) => new Option(t, v)));
      sel.value = options.some(([v]) => v === value) ? value : options[0][0];
    };
    const fillVersions = (value) => fill(q('#ver'), [[KEEP, 'Keep current'], ...(versions || []).map((v) => [v.id, v.name])], value);
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
      if (lock) {
        const verOpt = q('#ver').selectedOptions && q('#ver').selectedOptions[0];
        const label = q('#effort').value || (q('#ver').value && verOpt ? verOpt.textContent : '') || lock.slug || 'this model';
        q('#forceText').textContent = `Send anyway (ChatGPT says ${label} is locked until ${when(lock.until)})`;
      }
    };
    const fillProjects = (value) => {
      const inProject = !!projectIdOf(location.pathname);
      const opts = [[CURRENT_PROJECT, inProject ? 'This project' : 'Where I am (no project)'], ['', 'No project'], ...projectNames().map((p) => [p, p])];
      fill(q('#proj'), opts, value);
    };
    const syncMode = () => q('#projRow').classList.toggle('hidden', q('#m').value !== 'new');
    const syncClarify = () => q('#clarifyRow').classList.toggle('hidden', !q('#autoClarify').checked);

    q('#p').value = s.prompt; q('#n').value = s.count; q('#d').value = s.delay; q('#m').value = s.mode;
    q('#wait').checked = !!s.wait; q('#force').checked = !!s.force;
    q('#holdImages').checked = s.holdImages !== false;
    q('#smartStop').checked = s.smartStop !== false;
    q('#autoAltModel').checked = s.autoAltModel !== false;
    q('#autoCleanFailed').checked = s.autoCleanFailed !== false;
    q('#autoClarify').checked = s.autoClarify !== false;
    q('#clarifyReply').value = s.clarifyReply || DEFAULT_CLARIFY_REPLY;
    holdEnabled = q('#holdImages').checked;
    fillVersions(s.version); fillEfforts(s.effort); fillProjects(s.project); syncMode(); syncClarify();

    // Render held reference images tray (every chip includes an active × remove button)
    onHeldChange = () => {
      const fileCount = heldFiles.length;
      const ptrCount = heldAttachments.pointers.length;
      const totalHeld = fileCount > 0 ? fileCount : ptrCount;
      q('#refTitle').textContent = `Held input images (${totalHeld})`;
      q('#clearRef').classList.toggle('hidden', totalHeld === 0);
      const refGrid = q('#refGrid');
      refGrid.classList.toggle('hidden', totalHeld === 0);
      if (fileCount > 0) {
        refGrid.replaceChildren(...heldFiles.map((item, idx) => {
          const chip = document.createElement('div');
          chip.className = 'ref-chip';
          chip.title = item.name;
          if (item.dataUrl) {
            chip.innerHTML = `<img alt="${esc(item.name)}"><button type="button" class="ref-rm" title="Remove">×</button>`;
            chip.querySelector('img').src = item.dataUrl;
          } else {
            chip.innerHTML = `<span>${esc(item.name.slice(0, 8))}</span><button type="button" class="ref-rm" title="Remove">×</button>`;
          }
          const rmBtn = chip.querySelector('.ref-rm');
          if (rmBtn) rmBtn.addEventListener('click', (e) => { e.stopPropagation(); removeHeldImageAt(idx); });
          return chip;
        }));
      } else if (ptrCount > 0) {
        refGrid.replaceChildren(...heldAttachments.pointers.map((ptr, idx) => {
          const att = heldAttachments.attachments[idx];
          const label = (att && att.name) ? att.name.slice(0, 8) : `img #${idx + 1}`;
          const chip = document.createElement('div');
          chip.className = 'ref-chip';
          chip.title = (att && att.name) || String(ptr.asset_pointer || '');
          chip.innerHTML = `<span>${esc(label)}</span><button type="button" class="ref-rm" title="Remove">×</button>`;
          const rmBtn = chip.querySelector('.ref-rm');
          if (rmBtn) rmBtn.addEventListener('click', (e) => { e.stopPropagation(); removeHeldImageAt(idx); });
          return chip;
        }));
      } else {
        refGrid.replaceChildren();
      }
    };
    onHeldChange();

    q('#addRefBtn').addEventListener('click', () => q('#refInput').click());
    q('#refInput').addEventListener('change', (e) => {
      if (e.target && e.target.files && e.target.files.length) {
        ingestHeldFiles(e.target.files, false);
        e.target.value = '';
      }
    });
    q('#clearRef').addEventListener('click', () => clearHeldImages());
    q('#holdImages').addEventListener('change', () => {
      holdEnabled = q('#holdImages').checked;
      saveJSON(STORE_KEY, ui.read());
    });
    q('#autoClarify').addEventListener('change', () => {
      syncClarify();
      saveJSON(STORE_KEY, ui.read());
    });
    q('#refBox').addEventListener('dragover', (e) => { e.preventDefault(); });
    q('#refBox').addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        ingestHeldFiles(e.dataTransfer.files, false);
      }
    });

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
        holdImages: q('#holdImages').checked,
        smartStop: q('#smartStop').checked,
        autoAltModel: q('#autoAltModel').checked,
        autoCleanFailed: q('#autoCleanFailed').checked,
        autoClarify: q('#autoClarify').checked,
        clarifyReply: q('#clarifyReply').value.trim() || DEFAULT_CLARIFY_REPLY,
      }),
      setModelSelection: (verId, effortTitle) => {
        fillVersions(verId);
        fillEfforts(effortTitle);
      },
      status: (t) => { q('.status').textContent = t; console.log(TAG, t); },
      setRunning: (on) => { q('.go').disabled = on; q('.stop').disabled = !on; },
      renderLimits: (l) => {
        const box = q('.limits');
        if (!l) {
          if (sessionStats.promptsSent > 0 || sessionStats.imagesGenerated > 0) {
            box.innerHTML = `<div>Session usage: <b>${esc(sessionStats.imagesGenerated)}</b> generated · <b>${esc(sessionStats.promptsSent)}</b> sent</div>`;
          } else {
            box.textContent = 'Could not load limits.';
          }
          return;
        }
        const rows = [];
        if (l.imagesLeft != null) {
          const maxPart = l.imagesMax != null ? ` / ${esc(l.imagesMax)}` : '';
          rows.push([`Images left: <b>${esc(l.imagesLeft)}</b>${maxPart} · resets ${esc(resets(l.imagesReset))}`, l.imagesLeft < 10]);
        } else if (l.checkedOk) {
          const planTag = l.planTier ? ` · ${esc(l.planTier)}` : '';
          rows.push([`Images left: <b>Available</b> (no active cap${planTag})`, false]);
        }
        if (sessionStats.promptsSent > 0 || sessionStats.imagesGenerated > 0) {
          rows.push([`Session usage: <b>${esc(sessionStats.imagesGenerated)}</b> generated · <b>${esc(sessionStats.promptsSent)}</b> sent`, false]);
        }
        for (const m of (l.lockedModels || [])) rows.push([`${esc(m.slug)} locked until ${esc(when(m.until))}${m.until ? ` (${esc(rel(m.until))})` : ''}`, true]);
        if (!l.lockedModels || !l.lockedModels.length) rows.push(['No models locked.', false]);
        for (const n of (l.notes || [])) rows.push([esc(n), true]);
        box.innerHTML = rows.map(([t, w]) => `<div class="${w ? 'warn' : ''}">${t}</div>`).join('');
      },
    };
    onLimitsUpdated = (newLimits) => {
      ui.renderLimits(newLimits);
      syncForce();
    };

    // Gallery
    const lb = q('.lightbox');
    let lbJob = null;
    let lbImg = null;
    const resignLightboxUrl = async () => {
      if (!lbJob || !lbImg) return;
      try {
        const d = await api(`/backend-api/files/download/${lbImg.id}?conversation_id=${lbJob.convId}&inline=false`);
        if (d && d.download_url && d.download_url !== lbImg.url) {
          lbImg.url = d.download_url;
          q('#lbDl').href = d.download_url;
          const shown = lb.querySelector('img');
          if (shown && !lb.classList.contains('hidden')) shown.src = d.download_url;
        }
      } catch (err) { console.warn(TAG, 'signed-URL refresh failed; using last known URL', err); }
    };
    const openLightbox = (job, img) => {
      lbJob = job; lbImg = img;
      const shown = lb.querySelector('img');
      shown.dataset.retried = '';
      shown.onerror = async () => {
        if (shown.dataset.retried === '1') return;
        shown.dataset.retried = '1';
        await resignLightboxUrl();
        if (lbImg && lbImg.url) shown.src = lbImg.url;
      };
      shown.src = img.url;
      q('#lbDl').href = img.url;
      q('#lbDl').download = `bulk-${job.n}-${job.images.indexOf(img) + 1}.${assetExt(img.url)}`;
      lb.classList.remove('hidden');
    };
    const closeLightbox = () => lb.classList.add('hidden');
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    q('#lbClose').addEventListener('click', closeLightbox);
    q('#lbChat').addEventListener('click', () => { if (lbJob) window.open(`/c/${lbJob.convId}`, '_blank'); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    // (R6-3) The download anchor used to navigate with whatever signed URL
    // the tile happened to capture — open a gallery hours later and the
    // browser just fails on an expired link (the v1.4 asset-vault
    // "downloads never die" guarantee, weakened by the v1.6 rewrite).
    // The click now re-signs first, then navigates on the fresh URL.
    q('#lbDl').addEventListener('click', async (e) => {
      if (!lbImg) return;
      if (q('#lbDl').dataset.resigned === '1') { delete q('#lbDl').dataset.resigned; return; }
      e.preventDefault();
      await resignLightboxUrl();
      q('#lbDl').dataset.resigned = '1';
      q('#lbDl').click();
    });

    let galSnap = null;
    onGalleryChange = () => {
      q('#gal').classList.toggle('hidden', !jobs.length);
      const done = jobs.filter((j) => j.state !== 'pending').length;
      q('#galTitle').textContent = `Images ${done}/${jobs.length}`;
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
            const imgEl = t.querySelector('img');
            imgEl.src = img.url;
            imgEl.addEventListener('error', async () => {
              if (imgEl.dataset.retried === '1') return;
              imgEl.dataset.retried = '1';
              try {
                const d = await api(`/backend-api/files/download/${img.id}?conversation_id=${job.convId}&inline=false`);
                if (d && d.download_url) {
                  img.url = d.download_url;
                  imgEl.src = d.download_url;
                }
              } catch (err) { console.warn(TAG, 'image refresh failed', err); }
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
    q('#clearGal').addEventListener('click', () => { jobs.length = 0; galSnap = null; onGalleryChange(); });

    const refreshLimits = async () => { limits = await loadLimits().catch(() => limits); ui.renderLimits(limits); syncForce(); };
    const refreshVersions = async () => {
      try { await loadVersions(); fillVersions(q('#ver').value); fillEfforts(q('#effort').value); } catch (e) { console.warn(TAG, e); }
    };

    q('.fab').addEventListener('click', () => {
      const opening = !panel.classList.contains('open');
      panel.classList.toggle('open');
      if (!opening) return;
      capturePageComposerFiles();
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
    root.addEventListener('keydown', (e) => e.stopPropagation());
    q('#p').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !running) run(ui); });

    const attach = () => {
      try {
        if (document.body && !document.body.contains(host)) document.body.appendChild(host);
      } catch (e) { console.warn(TAG, 'attach deferred', e); }
    };
    attach();
    setInterval(attach, 2000);
  }

  buildUI();
})();
