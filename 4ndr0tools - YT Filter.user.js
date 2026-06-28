// ==UserScript==
// @name         4ndr0tools - YouTube_Filter
// @namespace    https://github.com/4ndr0666/userscripts
// @version      2.3
// @author       4ndr0666
// @description  Electric-Glass YouTube video filter — views, date, duration
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*.youtube.com/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YT-Filter.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YT-Filter.user.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  // ---------- Config / state ----------
  const filters = {
    minViews:    0,
    maxViews:    Infinity,
    minDays:     0,
    maxDays:     Infinity,
    minDuration: 0,
    maxDuration: Infinity,
    enabled:     false,
  };

  // v5: bumped to invalidate stale selector-dependent state and enforce superset matrix
  const STORAGE_KEY = 'ytVideoFilter:v5';

  // Superset: original 4 + 2024/2025/2026 Polymer & Custom Elements additions
  const VIDEO_HOST_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-reel-item-renderer',
    'ytd-rich-item-renderer[is-slim-media]',
    'yt-lockup-view-model',
    'yt-reel-item-renderer',
    'ytd-shorts-lockup-view-model'
  ];

  // ---------- Styles ----------
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Orbitron:wght@700&display=swap');

    :root {
      --bg-panel:              #101827;
      --bg-input:              #070B14;
      --accent-cyan:           #15fafa;
      --accent-cyan-mid:       #15adad;
      --accent-cyan-dark:      #157d7d;
      --accent-cyan-glow:      rgba(21, 250, 250, 0.20);
      --accent-cyan-glow-hi:   rgba(21, 250, 250, 0.50);
      --accent-cyan-border:    rgba(21, 250, 250, 0.60);
      --accent-cyan-bg-active: rgba(21, 250, 250, 0.12);
      --text-primary:          #e0ffff;
      --text-secondary:        #a0f0f0;
      --text-muted:            #70c0c0;
      --text-inactive:         #9E9E9E;
      --error-bg:              rgba(255, 68, 68, 0.10);
      --error-border:          rgba(255, 68, 68, 0.80);
      --error-text:            #ff6b6b;
      --font-ui:               'Roboto Mono', monospace;
      --font-head:             'Orbitron', monospace;
      --transition-snap:       150ms ease-in-out;
      --transition-slide:      300ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Toggle button: fixed at right edge, translateX hides/reveals it ── */
    #yt-filter-toggle {
      position: fixed;
      top: 50%;
      right: 0;
      transform: translateY(-50%) translateX(42px);
      z-index: 10001;
      background: var(--bg-panel);
      color: var(--text-inactive);
      border: 1px solid var(--accent-cyan-mid);
      border-right: none;
      border-radius: 8px 0 0 8px;
      padding: 16px 10px;
      cursor: pointer;
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: -2px 0 12px rgba(21, 250, 250, 0.10);
      transition: transform var(--transition-slide),
                  color var(--transition-snap),
                  background var(--transition-snap),
                  border-color var(--transition-snap),
                  box-shadow var(--transition-snap);
      writing-mode: vertical-rl;
    }
    #yt-filter-toggle::before {
      content: '⚙';
      font-size: 14px;
      display: block;
      margin-bottom: 8px;
      writing-mode: horizontal-tb;
      color: var(--accent-cyan-dark);
      transition: color var(--transition-snap);
    }
    #yt-filter-toggle:hover {
      transform: translateY(-50%) translateX(0);
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      box-shadow: -4px 0 20px var(--accent-cyan-glow-hi);
    }
    #yt-filter-toggle:hover::before {
      color: var(--accent-cyan);
    }
    #yt-filter-toggle.active {
      transform: translateY(-50%) translateX(0);
      color: var(--accent-cyan);
      background: var(--accent-cyan-bg-active);
      border-color: var(--accent-cyan);
      box-shadow: -4px 0 24px var(--accent-cyan-glow-hi);
      z-index: 9999;
    }
    #yt-filter-toggle.active::before {
      color: var(--accent-cyan);
    }

    /* ── Slide panel: starts off-screen right, slides in via right property ── */
    #yt-filter-panel {
      position: fixed;
      top: 50%;
      right: -340px;
      transform: translateY(-50%);
      z-index: 10000;
      width: 320px;
      max-height: 85vh;
      overflow-y: auto;
      overflow-x: hidden;
      background: rgba(16, 24, 39, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      color: var(--text-primary);
      border: 1px solid var(--accent-cyan-mid);
      border-right: none;
      border-radius: 12px 0 0 12px;
      box-shadow: -4px 0 28px rgba(21, 250, 250, 0.15),
                  inset 0 0 0 1px rgba(21, 250, 250, 0.04);
      padding: 20px;
      transition: right var(--transition-slide);
      font-family: var(--font-ui);
      font-size: 13px;
      line-height: 1.4;
    }
    #yt-filter-panel.visible {
      right: 0;
    }
    #yt-filter-panel::-webkit-scrollbar { width: 6px; }
    #yt-filter-panel::-webkit-scrollbar-track  { background: var(--bg-panel); }
    #yt-filter-panel::-webkit-scrollbar-thumb  {
      background: var(--accent-cyan-dark);
      border-radius: 3px;
    }
    #yt-filter-panel::-webkit-scrollbar-thumb:hover { background: var(--accent-cyan); }

    /* ── Header ── */
    #yt-filter-panel h3 {
      margin: 0 0 16px;
      font-family: var(--font-head);
      font-size: 13px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      background: linear-gradient(90deg, var(--accent-cyan), var(--accent-cyan-mid), var(--accent-cyan-dark));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(21, 250, 250, 0.18);
      padding-bottom: 12px;
    }
    .ytf-close {
      cursor: pointer;
      font-size: 24px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid transparent;
      color: var(--text-muted);
      transition: all var(--transition-snap);
      background: transparent;
      flex-shrink: 0;
    }
    .ytf-close:hover {
      background: rgba(21, 250, 250, 0.10);
      border-color: var(--accent-cyan-border);
      color: var(--accent-cyan);
    }

    /* ── Field groups ── */
    .ytf-group {
      margin-bottom: 16px;
    }
    .ytf-group label {
      display: block;
      margin-bottom: 8px;
      color: var(--text-muted);
      font-size: 10px;
      font-family: var(--font-head);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .ytf-row {
      display: flex;
      gap: 8px;
      position: relative;
      z-index: 1;
    }
    .ytf-input-wrapper {
      flex: 1;
      position: relative;
    }

    /* ── Inputs ── */
    .ytf-input {
      width: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid rgba(21, 173, 173, 0.40);
      background: var(--bg-input);
      color: var(--text-primary);
      font-family: var(--font-ui);
      font-size: 12px;
      letter-spacing: 0.03em;
      transition: border-color var(--transition-snap),
                  box-shadow   var(--transition-snap);
      position: relative;
      z-index: 2;
    }
    .ytf-input::placeholder { color: var(--text-muted); }
    .ytf-input:focus {
      outline: none;
      border-color: var(--accent-cyan);
      z-index: 3;
      box-shadow: 0 0 0 2px rgba(21, 250, 250, 0.15),
                  0 0 10px rgba(21, 250, 250, 0.10);
    }
    .ytf-input.error {
      border-color: var(--error-border);
      background: var(--error-bg);
    }
    .ytf-input[type="date"] {
      appearance: none;
      -webkit-appearance: none;
      color-scheme: dark;
      position: relative;
      z-index: 2;
    }
    .ytf-input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(0.7) sepia(1) saturate(4) hue-rotate(148deg);
      cursor: pointer;
      position: relative;
      z-index: 4;
      opacity: 0.7;
      transition: opacity var(--transition-snap);
    }
    .ytf-input[type="date"]::-webkit-calendar-picker-indicator:hover { opacity: 1; }
    .ytf-input[type="number"]::-webkit-inner-spin-button,
    .ytf-input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }

    /* ── Inline errors ── */
    .ytf-error-msg {
      color: var(--error-text);
      font-size: 10px;
      margin-top: 4px;
      display: none;
      animation: ytfFadeIn 0.18s ease;
    }
    .ytf-error-msg.show { display: block; }
    @keyframes ytfFadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── HUD action buttons ── */
    .ytf-actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .ytf-btn {
      flex: 1;
      padding: 11px;
      border-radius: 8px;
      border: 1px solid rgba(21, 250, 250, 0.25);
      background: rgba(0, 0, 0, 0.30);
      color: var(--text-inactive);
      cursor: pointer;
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: all var(--transition-snap);
    }
    .ytf-btn:hover:not(:disabled) {
      color: var(--accent-cyan);
      border-color: rgba(21, 250, 250, 0.50);
      transform: translateY(-1px);
    }
    .ytf-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .ytf-btn:focus-visible { outline: 2px solid var(--accent-cyan); outline-offset: 2px; }

    .ytf-btn.primary {
      color: var(--text-secondary);
      border-color: var(--accent-cyan-mid);
      background: rgba(21, 173, 173, 0.08);
    }
    .ytf-btn.primary:hover:not(:disabled) {
      color: var(--accent-cyan);
      border-color: var(--accent-cyan);
      box-shadow: 0 0 15px var(--accent-cyan-glow);
    }
    .ytf-btn.primary.active {
      color: #67E8F9;
      border-color: var(--accent-cyan);
      background: var(--accent-cyan-bg-active);
      box-shadow: 0 0 18px var(--accent-cyan-glow);
    }
    .ytf-btn.primary.active:hover:not(:disabled) {
      box-shadow: 0 0 26px var(--accent-cyan-glow-hi);
    }

    /* ── Stats bar ── */
    .ytf-stats {
      margin-top: 16px;
      padding: 10px 12px;
      background: rgba(7, 11, 20, 0.80);
      border: 1px solid rgba(21, 173, 173, 0.25);
      border-radius: 6px;
      color: var(--text-muted);
      text-align: center;
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    .ytf-hidden { display: none !important; }
  `);

  // ---------- Utilities ----------
  const qs  = (root, sel) => root.querySelector(sel);
  const qsa = (root, sel) => root.querySelectorAll(sel);

  const byText = (nodes, pred) => {
    for (const n of nodes) {
      const t = (n.textContent || '').trim();
      if (t && pred(t)) return t;
    }
    return '';
  };

  const parseNumberWithSuffix = (txt) => {
    const m = (txt || '').replace(/[,\s]/g, '').match(/([\d.]+)\s*([KMBkmb])?/);
    if (!m) {
      const num = parseInt((txt || '').replace(/[^\d]/g, ''), 10);
      return Number.isFinite(num) ? num : 0;
    }
    let n = parseFloat(m[1]) || 0;
    const s = (m[2] || '').toUpperCase();
    if (s === 'K') n *= 1e3;
    else if (s === 'M') n *= 1e6;
    else if (s === 'B') n *= 1e9;
    return Math.floor(n);
  };

  const parseViews = (txt) =>
    parseNumberWithSuffix((txt || '').replace(/views?/i, '').trim());

  const parseDaysAgo = (txt) => {
    if (!txt) return Infinity;
    const s = txt.toLowerCase()
      .replace('streamed', '')
      .replace('premiered', '')
      .trim();
    const m = s.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?/);
    if (!m) return Infinity;
    const v = parseInt(m[1], 10);
    const mult = {
      second: 1 / 86400,
      minute: 1 / 1440,
      hour:   1 / 24,
      day:    1,
      week:   7,
      month:  30,
      year:   365,
    }[m[2]] || 1;
    return v * mult;
  };

  // LIVE → NaN; floor seconds → minutes
  const parseDuration = (txt) => {
    if (!txt) return NaN;
    const t = txt.trim();
    if (/^live$/i.test(t)) return NaN;
    const parts = t.split(':').map(x => parseInt(x, 10) || 0);
    let s = 0;
    if (parts.length === 3) s = parts[0] * 3600 + parts[1] * 60 + parts[2];
    else if (parts.length === 2) s = parts[0] * 60 + parts[1];
    else s = parts[0] || 0;
    return Math.floor(s / 60);
  };

  // Local ISO date — no UTC shift
  const toLocalISODate = (d) => {
    const y  = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  };

  // Normalize to local noon to avoid DST edge cases
  const daysAgoToDate = (days) => {
    if (!Number.isFinite(days) || days === Infinity) return '';
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - Math.floor(days));
    return toLocalISODate(d);
  };

  const dateToDaysAgo = (dateStr) => {
    if (!dateStr) return Infinity;
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return Infinity;
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.floor((now - d) / 86400000);
  };

  // ---------- Shorts detection ----------
  const isShorts = (host) => {
    if (qs(host, 'a[href*="/shorts/"]'))              return true;
    if (qs(host, '[is-shorts], [href^="/shorts/"]'))  return true;
    const tag = host.tagName?.toLowerCase();
    if (tag === 'ytd-reel-item-renderer' || tag === 'yt-reel-item-renderer' || tag === 'ytd-shorts-lockup-view-model') return true;
    return false;
  };

  // ---------- Metadata extraction (Updated Gap Mitigation for 2026 Polymer Integration) ----------
  const getVideoMeta = (host) => {
    // Gap Mitigation: Broaden textual scope across shadow barriers
    const metaElements = qsa(host, 'span, yt-formatted-string, #metadata-line span, .inline-metadata-item, .yt-content-metadata-view-model span');

    const viewsTxt = byText(metaElements, t => /view/i.test(t) && !/watching/i.test(t));
    const timeTxt  = byText(metaElements, t => /(ago|streamed|premiered)/i.test(t));

    // Duration: Extended 6-tier fallback chain ensuring absolute resolution
    let durationTxt = '';
    const durationSelectors = [
      '.yt-thumbnail-overlay-badge-view-model .yt-badge-shape__text',
      '.yt-thumbnail-overlay-badge-view-model span',
      'ytd-thumbnail-overlay-time-status-renderer #text',
      'ytd-thumbnail-overlay-time-status-renderer [id="text"]',
      'yt-thumbnail-overlay-badge-view-model span[class*="badge"]',
      'ytd-thumbnail-overlay-time-status-renderer badge-shape span'
    ];

    for (const sel of durationSelectors) {
      const el = qs(host, sel);
      if (el && el.textContent.trim()) {
        durationTxt = el.textContent.trim();
        break;
      }
    }

    // Deep attribute extraction fallback
    if (!durationTxt) {
      const thumb = qs(host, 'ytd-thumbnail[aria-label], a#thumbnail[aria-label], yt-image[aria-label], a.ytd-thumbnail[aria-label]');
      const m = (thumb?.getAttribute('aria-label') || '').match(/(\d+:\d+(?::\d+)?)/);
      if (m) durationTxt = m[1];
    }
    if (!durationTxt) {
      const m = (host.getAttribute('aria-label') || '').match(/(\d+:\d+(?::\d+)?)/);
      if (m) durationTxt = m[1];
    }

    // View count fallback: aria-label on deep title bindings
    let views = parseViews(viewsTxt);
    if (!views) {
      const link  = qs(host, 'a#video-title, a.yt-lockup-metadata-view-model__title');
      const mView = (link?.getAttribute('aria-label') || '').match(/([\d,.]+[KMB]?)\s*views?/i);
      if (mView) views = parseViews(mView[1]);
    }

    return {
      views,
      daysAgo:  parseDaysAgo(timeTxt),
      duration: parseDuration(durationTxt),
    };
  };

  // ---------- Filtering ----------
  const matches = (host) => {
    if (!filters.enabled) return true;
    if (isShorts(host))   return true;

    const { views, daysAgo, duration } = getVideoMeta(host);

    const dateFilterActive = filters.minDays > 0 || filters.maxDays < Infinity;
    if (daysAgo === Infinity && dateFilterActive) return false;

    if (views   < filters.minViews    || views   > filters.maxViews)    return false;
    if (daysAgo < filters.minDays     || daysAgo > filters.maxDays)     return false;

    const durationKnown = Number.isFinite(duration) && duration >= 0;
    if (durationKnown && (duration < filters.minDuration || duration > filters.maxDuration)) return false;

    return true;
  };

  const applyToAll = () => {
    const nodes = document.querySelectorAll(VIDEO_HOST_SELECTORS.join(','));
    let total = 0, hidden = 0;
    for (const host of nodes) {
      total++;
      if (matches(host)) {
        host.classList.remove('ytf-hidden');
      } else {
        host.classList.add('ytf-hidden');
        hidden++;
      }
    }
    const stats = document.getElementById('ytf-stats');
    if (stats) {
      stats.textContent = filters.enabled
        ? `Showing ${total - hidden} of ${total} videos`
        : 'Filter disabled';
    }
  };

  // ---------- Debounced scheduler (RAF + 100ms guard) ----------
  let raf = 0;
  let debounceTimer = 0;
  const scheduleApply = () => {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      raf = requestAnimationFrame(() => { applyToAll(); raf = 0; });
    }, 100);
  };

  // ---------- Storage (null ↔ Infinity round-trip safe) ----------
  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      minViews:    filters.minViews    || 0,
      maxViews:    Number.isFinite(filters.maxViews)    ? filters.maxViews    : null,
      minDays:     filters.minDays     || 0,
      maxDays:     Number.isFinite(filters.maxDays)     ? filters.maxDays     : null,
      minDuration: filters.minDuration || 0,
      maxDuration: Number.isFinite(filters.maxDuration) ? filters.maxDuration : null,
      enabled:     !!filters.enabled,
    }));
  };

  const load = () => {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      filters.minViews    = d.minViews    ?? 0;
      filters.maxViews    = d.maxViews    ?? Infinity;
      filters.minDays     = d.minDays     ?? 0;
      filters.maxDays     = d.maxDays     ?? Infinity;
      filters.minDuration = d.minDuration ?? 0;
      filters.maxDuration = d.maxDuration ?? Infinity;
      filters.enabled     = !!d.enabled;
    } catch { /* keep defaults */ }
  };

  // ---------- Validation ----------
  const validateNumber = (value, allowSuffix = false) => {
    if (value === '' || value == null) return { valid: true, value: null };
    const cleaned = value.replace(/[,\s]/g, '');
    if (allowSuffix) {
      if (!/^[\d.]+[KMBkmb]?$/.test(cleaned))
        return { valid: false, error: 'Format: 1.5K, 10M, or 1,234' };
      return { valid: true, value: parseNumberWithSuffix(value) };
    }
    const num = parseInt(cleaned, 10);
    if (!Number.isFinite(num) || num < 0)
      return { valid: false, error: 'Must be a positive number' };
    return { valid: true, value: num };
  };

  const validateDate = (value) => {
    if (value === '' || value == null) return { valid: true, value: null };
    const d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return { valid: false, error: 'Invalid date' };
    const now = new Date(); now.setHours(0, 0, 0, 0);
    if (new Date(value + 'T00:00:00') > now)
      return { valid: false, error: 'Date cannot be in the future' };
    return { valid: true, value };
  };

  const showError = (input, message) => {
    input.classList.add('error');
    const wrapper = input.closest('.ytf-input-wrapper');
    let msg = wrapper.querySelector('.ytf-error-msg');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'ytf-error-msg';
      wrapper.appendChild(msg);
    }
    msg.textContent = message;
    msg.classList.add('show');
  };

  const clearError = (input) => {
    input.classList.remove('error');
    input.closest('.ytf-input-wrapper')?.querySelector('.ytf-error-msg')?.classList.remove('show');
  };

  const validateAllInputs = (minViews, maxViews, minDate, maxDate, minDur, maxDur) => {
    const mvMin = validateNumber(minViews.value.trim(), true);
    const mvMax = validateNumber(maxViews.value.trim(), true);
    const dtMin = validateDate(minDate.value.trim());
    const dtMax = validateDate(maxDate.value.trim());
    const duMin = validateNumber(minDur.value.trim(), false);
    const duMax = validateNumber(maxDur.value.trim(), false);

    [minViews, maxViews, minDate, maxDate, minDur, maxDur].forEach(clearError);

    let hasError = false;
    if (!mvMin.valid) { showError(minViews, mvMin.error); hasError = true; }
    if (!mvMax.valid) { showError(maxViews, mvMax.error); hasError = true; }
    if (!dtMin.valid) { showError(minDate,  dtMin.error); hasError = true; }
    if (!dtMax.valid) { showError(maxDate,  dtMax.error); hasError = true; }
    if (!duMin.valid) { showError(minDur,   duMin.error); hasError = true; }
    if (!duMax.valid) { showError(maxDur,   duMax.error); hasError = true; }

    if (dtMin.valid && dtMax.valid && dtMin.value && dtMax.value) {
      if (new Date(dtMin.value) > new Date(dtMax.value)) {
        showError(minDate, 'From must be before To');
        hasError = true;
      }
    }

    return {
      valid: !hasError,
      minViews: mvMin.value, maxViews: mvMax.value,
      minDate:  dtMin.value, maxDate:  dtMax.value,
      minDur:   duMin.value, maxDur:   duMax.value,
    };
  };

  // ---------- UI ----------
  const createUI = () => {
    document.getElementById('yt-filter-toggle')?.remove();
    document.getElementById('yt-filter-panel')?.remove();

    // Toggle button — fixed at right:0, slides in/out via translateX
    const btn = document.createElement('button');
    btn.id          = 'yt-filter-toggle';
    btn.textContent = 'FILTER';
    document.body.appendChild(btn);

    // Panel — fixed at right:-340px, slides to right:0 when .visible
    const panel = document.createElement('div');
    panel.id = 'yt-filter-panel';

    const h = document.createElement('h3');
    h.textContent = 'YT Filter';
    const close = document.createElement('span');
    close.className   = 'ytf-close';
    close.title       = 'Close';
    close.textContent = '×';
    close.addEventListener('click', () => {
      panel.classList.remove('visible');
      btn.classList.remove('active');
    });
    h.appendChild(close);
    panel.appendChild(h);

    // Toggle wired here — single handler, no duplication
    btn.addEventListener('click', () => {
      const isVisible = panel.classList.toggle('visible');
      btn.classList.toggle('active', isVisible);
    });

    const makeGroup = (labelTxt, inputs) => {
      const g   = document.createElement('div');
      g.className = 'ytf-group';
      const l   = document.createElement('label');
      l.textContent = labelTxt;
      const row = document.createElement('div');
      row.className = 'ytf-row';
      inputs.forEach(input => {
        const wrap = document.createElement('div');
        wrap.className = 'ytf-input-wrapper';
        wrap.appendChild(input);
        row.appendChild(wrap);
      });
      g.appendChild(l);
      g.appendChild(row);
      return g;
    };

    const iText = (id, ph) => {
      const i = document.createElement('input');
      i.className = 'ytf-input'; i.id = id;
      i.type = 'text'; i.placeholder = ph;
      return i;
    };
    const iDate = (id, ph) => {
      const i = document.createElement('input');
      i.className = 'ytf-input'; i.id = id;
      i.type = 'date'; i.placeholder = ph;
      return i;
    };
    const iNum = (id, ph) => {
      const i = document.createElement('input');
      i.className = 'ytf-input'; i.id = id;
      i.type = 'number'; i.placeholder = ph;
      i.min = '0'; i.step = '1';
      return i;
    };

    const minViews = iText('ytf-minViews',   'Min (e.g. 10K)');
    const maxViews = iText('ytf-maxViews',   'Max (e.g. 10M)');
    const minDate  = iDate('ytf-minDate',    'From');
    const maxDate  = iDate('ytf-maxDate',    'To');
    const minDur   = iNum('ytf-minDuration', 'Min (mins)');
    const maxDur   = iNum('ytf-maxDuration', 'Max (mins)');

    [minViews, maxViews, minDate, maxDate, minDur, maxDur].forEach(inp =>
      inp.addEventListener('input', () => clearError(inp))
    );

    // Hydrate from stored state
    const setVal = (el, v) => { el.value = (v === Infinity || v === 0) ? '' : String(v); };
    setVal(minViews, filters.minViews);
    setVal(maxViews, filters.maxViews);
    // "From" (older date) → maxDays;  "To" (newer date) → minDays
    minDate.value = filters.maxDays !== Infinity ? daysAgoToDate(filters.maxDays) : '';
    maxDate.value = filters.minDays !== 0        ? daysAgoToDate(filters.minDays) : '';
    setVal(minDur, filters.minDuration);
    setVal(maxDur, filters.maxDuration);

    panel.appendChild(makeGroup('Views',              [minViews, maxViews]));
    panel.appendChild(makeGroup('Date Range',         [minDate,  maxDate]));
    panel.appendChild(makeGroup('Duration (minutes)', [minDur,   maxDur]));

    const actions  = document.createElement('div');
    actions.className = 'ytf-actions';

    const applyBtn = document.createElement('button');
    applyBtn.className   = 'ytf-btn primary';
    applyBtn.id          = 'ytf-apply';
    applyBtn.textContent = filters.enabled ? 'Disable Filter' : 'Apply Filter';
    if (filters.enabled) applyBtn.classList.add('active');

    applyBtn.addEventListener('click', () => {
      if (filters.enabled) {
        filters.enabled = false;
        applyBtn.textContent = 'Apply Filter';
        applyBtn.classList.remove('active');
        persist();
        scheduleApply();
        return;
      }
      const v = validateAllInputs(minViews, maxViews, minDate, maxDate, minDur, maxDur);
      if (!v.valid) return;

      filters.minViews    = v.minViews ?? 0;
      filters.maxViews    = v.maxViews ?? Infinity;
      // "From" = maxDays (older = larger daysAgo); "To" = minDays (newer = smaller daysAgo)
      filters.maxDays     = v.minDate ? dateToDaysAgo(v.minDate) : Infinity;
      filters.minDays     = v.maxDate ? dateToDaysAgo(v.maxDate) : 0;
      filters.minDuration = v.minDur ?? 0;
      filters.maxDuration = v.maxDur ?? Infinity;
      filters.enabled     = true;

      applyBtn.textContent = 'Disable Filter';
      applyBtn.classList.add('active');
      persist();
      scheduleApply();
    });

    const resetBtn = document.createElement('button');
    resetBtn.className   = 'ytf-btn';
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      [minViews, maxViews, minDate, maxDate, minDur, maxDur].forEach(i => {
        i.value = ''; clearError(i);
      });
      filters.minViews = filters.minDays = filters.minDuration = 0;
      filters.maxViews = filters.maxDays = filters.maxDuration = Infinity;
      filters.enabled  = false;
      applyBtn.textContent = 'Apply Filter';
      applyBtn.classList.remove('active');
      persist();
      scheduleApply();
    });

    actions.appendChild(applyBtn);
    actions.appendChild(resetBtn);
    panel.appendChild(actions);

    const stats = document.createElement('div');
    stats.className   = 'ytf-stats';
    stats.id          = 'ytf-stats';
    stats.textContent = filters.enabled ? 'Applying…' : 'Filter disabled';
    panel.appendChild(stats);

    document.body.appendChild(panel);
  };

  // ---------- Observers & navigation ----------
  const attachObservers = () => {
    const root = document.querySelector('ytd-app') || document.body;
    new MutationObserver(() => scheduleApply())
      .observe(root, { childList: true, subtree: true });

    window.addEventListener('yt-navigate-start',  () => scheduleApply(), true);
    window.addEventListener('yt-navigate-finish', () => {
      requestAnimationFrame(() => scheduleApply());
      setTimeout(scheduleApply, 300);
    }, true);
    window.addEventListener('load',       () => scheduleApply(), true);
    window.addEventListener('popstate',   () => scheduleApply(), true);
    window.addEventListener('hashchange', () => scheduleApply(), true);
  };

  // ---------- Init ----------
  const init = () => {
    load();
    createUI();
    attachObservers();
    setTimeout(scheduleApply, 600);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
