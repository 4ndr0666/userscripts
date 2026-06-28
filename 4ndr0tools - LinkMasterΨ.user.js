// ==UserScript==
// @name           4ndr0tools - LinkMaster
// @namespace      https://github.com/4ndr0666/userscripts
// @author         4ndr0666
// @version        4.1.0
// @description    Accurately decodes, previews, exports, validates and scrapes all links.
// @downloadURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @updateURL      https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @icon           https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @include        *
// @license        UNLICENSED - RED TEAM USE ONLY
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_xmlhttpRequest
// @grant          GM_registerMenuCommand
// @grant          GM_addStyle
// @connect        *
// ==/UserScript==

(() => {
  "use strict";

  // ===========================================================================
  // PHASE 1: THEME, BOOTSTRAP, IMMEDIATE BUTTON
  // ===========================================================================
  (() => {
    if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
      const preconnectAPI = document.createElement("link");
      preconnectAPI.rel = "preconnect";
      preconnectAPI.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnectAPI);

      const preconnectGstatic = document.createElement("link");
      preconnectGstatic.rel = "preconnect";
      preconnectGstatic.href = "https://fonts.gstatic.com";
      preconnectGstatic.crossOrigin = "anonymous";
      document.head.appendChild(preconnectGstatic);

      const gfLink = document.createElement("link");
      gfLink.rel = "stylesheet";
      gfLink.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Orbitron:wght@500;700&family=Roboto+Mono:wght@500&display=swap";
      document.head.appendChild(gfLink);
    }
  })();

  const hudStyle = `
    :root {
      --bg-dark-base: #050A0F;
      --bg-glass-panel: rgba(10, 19, 26, 0.75);
      --accent-cyan: #00E5FF;
      --text-cyan-active: #67E8F9;
      --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
      --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
      --glow-cyan-active: rgba(0, 229, 255, 0.4);
      --text-primary: #EAEAEA;
      --text-secondary: #9E9E9E;
      --font-body: 'Roboto Mono', monospace;
      --font-hud: 'Orbitron', sans-serif;
      --font-heading: 'Cinzel Decorative', serif;
      --hud-z: 2147483646;
    }

    /* ═══════════════════════════════════════════════════════════
       THE SLIDING DOCK (Design Spec 1.5.0-Ψ)
       ═══════════════════════════════════════════════════════════ */
    #linkmaster-dock {
      position: fixed; bottom: 24px; right: 0; z-index: 2147483647;
      display: flex; border-radius: 6px 0 0 6px; overflow: hidden;
      background: var(--bg-glass-panel);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--accent-cyan-border-idle);
      border-right: none;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-left: 1px solid rgba(255,255,255,0.1);
      box-shadow: -4px 8px 32px 0 rgba(0, 0, 0, 0.37);
      transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms ease;
      transform: translateX(calc(100% - 22px));
    }

    #linkmaster-dock:hover {
      transform: translateX(0);
    }

    .dock-btn {
      display: flex; align-items: center; white-space: nowrap;
      background: transparent; border: none; color: var(--text-primary);
      padding: 12px 20px 12px 10px; font: 500 13px var(--font-body);
      text-transform: uppercase; letter-spacing: 0.05em;
      cursor: pointer; transition: all 300ms ease-in-out;
    }

    .dock-icon {
      width: 24px; height: 24px;
      color: var(--accent-cyan);
      margin-right: 8px; flex-shrink: 0;
      transition: filter 300ms, color 300ms;
    }

    .dock-btn:hover {
      color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.05);
    }

    .dock-btn:hover .dock-icon {
      filter: drop-shadow(0 0 8px var(--glow-cyan-active));
    }

    .dock-btn:active {
      background: rgba(0, 229, 255, 0.2);
      box-shadow: inset 0 0 10px var(--glow-cyan-active);
    }

    /* ═══════════════════════════════════════════════════════════
       HUD MAIN PANEL
       ═══════════════════════════════════════════════════════════ */
    .hud-container {
      position: fixed; bottom: 85px; right: 24px; z-index: var(--hud-z);
      background: var(--bg-glass-panel);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-radius: 6px; border: 1px solid var(--accent-cyan-border-idle);
      box-shadow: 0 0 32px rgba(0, 0, 0, 0.5);
      min-width: 540px; max-width: 94vw; min-height: 340px;
      color: var(--text-primary); font-family: var(--font-body);
      transition: all 280ms cubic-bezier(.45, .05, .55, .95);
      user-select: text; overflow: visible; opacity: 0.99;
    }
    .hud-container[hidden] { display: none !important; }

    .hud-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--accent-cyan-border-idle);
      background: transparent; user-select: none; position: relative;
    }
    .hud-header .glyph { flex: none; width: 32px; height: 32px; display: block; color: var(--accent-cyan); z-index: 2; }
    .hud-header .title {
      position: absolute; left: 50%; transform: translateX(-50%);
      font-family: var(--font-heading); font-weight: 700; font-size: 1.4em;
      color: var(--text-cyan-active); text-transform: uppercase;
      letter-spacing: 0.1em; text-shadow: 0 0 8px var(--glow-cyan-active);
      text-align: center; white-space: nowrap; margin: 0 10px; z-index: 1;
    }
    .hud-header .hud-close-btn {
      font-family: var(--font-hud); font-size: 1.4em; border: none;
      background: transparent; color: var(--accent-cyan); cursor: pointer;
      opacity: 0.7; transition: all 300ms ease; flex-shrink: 0; z-index: 2;
    }
    .hud-header .hud-close-btn:hover {
      color: #ff4d4d; opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.4));
    }

    .hud-tabs {
      display: flex; gap: 8px; padding: 8px 16px 0 16px;
      border-bottom: 1px solid var(--accent-cyan-border-idle); background: transparent;
    }
    .hud-tabs .hud-button {
      font-family: var(--font-heading); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
      font-weight: 700; background: transparent; padding: 10px 16px;
      border-radius: 6px 6px 0 0; border: 1px solid transparent; border-bottom: none;
      color: var(--text-secondary); cursor: pointer; transition: all 300ms ease-in-out; box-shadow: none;
    }
    .hud-tabs .hud-button.active {
      color: var(--text-cyan-active); border-color: var(--accent-cyan-border-idle);
      background: rgba(0, 229, 255, 0.05); box-shadow: inset 0 4px 10px -4px var(--glow-cyan-active);
    }
    .hud-tabs .hud-button:hover:not(.active) {
      color: var(--accent-cyan); border-color: var(--accent-cyan-border-hover);
      background: rgba(0, 229, 255, 0.05);
    }

    .hud-content {
      padding: 16px; min-height: 220px; max-height: 60vh;
      overflow-y: auto; font-size: 13px; color: var(--text-primary); background: transparent;
    }
    .hud-content::-webkit-scrollbar { width: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; }
    .hud-content::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.3); border-radius: 4px; }
    .hud-content::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.6); }

    .hud-status-text {
      font-family: var(--font-hud);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    .hud-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 6px 12px; border-radius: 4px; border: 1px solid var(--accent-cyan-border-idle);
      font-family: var(--font-hud); font-weight: 500; font-size: 11px; text-transform: uppercase;
      background: transparent; color: var(--text-primary); cursor: pointer;
      letter-spacing: 0.05em; transition: all 300ms ease-in-out; box-shadow: none; outline: none;
    }
    .hud-btn.active, .hud-btn:active {
      color: var(--text-cyan-active); border-color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.2); box-shadow: inset 0 0 10px var(--glow-cyan-active);
    }
    .hud-btn:hover:not(.active) {
      color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05);
      border-color: var(--accent-cyan-border-hover); box-shadow: 0 0 8px var(--glow-cyan-active);
    }

    .chip {
      display: inline-block; border-radius: 4px; padding: 2px 8px; font-size: 11px;
      font-family: var(--font-body); font-weight: 500; text-transform: uppercase;
      background: rgba(0, 229, 255, 0.05); color: var(--text-cyan-active);
      border: 1px solid var(--accent-cyan-border-idle);
    }
    .chip.dead {
      color: #ff4d4d; border-color: rgba(255, 77, 77, 0.5);
      background: rgba(255, 77, 77, 0.05);
    }
    .chip.unknown {
      color: #ffea00; border-color: rgba(255, 234, 0, 0.5);
      background: rgba(255, 234, 0, 0.05);
    }
    .chip.favicon { background: #111; color: var(--text-cyan-active); padding: 0; display: inline-flex; justify-content: center; align-items: center; }

    .hud-toast {
      position: fixed; z-index: calc(var(--hud-z) + 2000); bottom: 85px; right: 580px;
      background: var(--bg-glass-panel); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      color: var(--text-cyan-active); font-family: var(--font-body); font-size: 13px;
      border-radius: 6px; border: 1px solid var(--accent-cyan-border-idle);
      box-shadow: 0 0 16px var(--glow-cyan-active); padding: 12px 20px;
      opacity: 0.97; pointer-events: none; transition: opacity 220ms; user-select: none;
    }

    textarea.hud-input {
      width: 100%; background: rgba(0, 0, 0, 0.3); color: var(--text-primary);
      border-radius: 4px; border: 1px solid var(--accent-cyan-border-idle);
      padding: 10px; font-size: 13px; font-family: var(--font-body); resize: vertical;
      box-shadow: inset 0 0 8px rgba(0,0,0,0.5); transition: border-color 300ms ease;
    }
    textarea.hud-input:focus {
      outline: none; border-color: var(--accent-cyan); box-shadow: inset 0 0 8px var(--glow-cyan-active);
    }

    /* Table Typography Hardening */
    .hud-content th {
      font-family: var(--font-hud);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .hud-action-cell {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  `;

  const getPsiGlyphSVG = (className) => `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="68" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text></svg>`;

  if (!document.getElementById("eglass-hud-css")) {
    const style = document.createElement("style");
    style.id = "eglass-hud-css";
    style.textContent = hudStyle;
    document.head.appendChild(style);
  }

  // ===========================================================================
  // STATE & CONSTANTS
  // ===========================================================================
  let extractionMode = getUserPref("extractionMode", "host");
  let currentTab = "scrape";

  const HOSTER_PATTERNS = [
    /:\/\/([a-z0-9-]+\.)?bunkr\.(ac|cr|pk|ru|ws|la|to|is|bz|sx|re|co|sh|pl|gg|mn|yt|site|si|red|org|su|io|net)/i,
    /:\/\/([a-z0-9-]+\.)?gofile\.io/i,
    /:\/\/([a-z0-9-]+\.)?1fichier\.com/i,
    /:\/\/([a-z0-9-]+\.)?motherless\.com/i,
    /:\/\/([a-z0-9-]+\.)?motherlessmedia\.com/i,
    /:\/\/([a-z0-9-]+\.)?bunkrrr\.org/i,
    /:\/\/([a-z0-9-]+\.)?pixeldrain\.com/i,
    /:\/\/([a-z0-9-]+\.)?pixhost\.to/i,
    /:\/\/([a-z0-9-]+\.)?imgbox\.com/i,
    /:\/\/([a-z0-9-]+\.)?imagevenue\.com/i,
    /:\/\/([a-z0-9-]+\.)?imagetwist\.com/i,
    /:\/\/([a-z0-9-]+\.)?nudbay\.com/i,
    /:\/\/([a-z0-9-]+\.)?spankbang\.com/i,
    /:\/\/([a-z0-9-]+\.)?thothub\.vip/i,
    /:\/\/([a-z0-9-]+\.)?vimeo\.com/i,
    /:\/\/([a-z0-9-]+\.)?youtube\.com/i,
    /:\/\/([a-z0-9-]+\.)?simpcity\.su/i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.site/i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.si/i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.red/i,
    /:\/\/([a-z0-9-]+\.)?bilibili\.com/i,
  ];

  const MEDIA_TYPES = [
    "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg",
    "mp4", "webm", "mkv", "mov", "avi", "flv", "wmv", "3gp",
    "mp3", "ogg", "wav", "flac", "aac", "m4a"
  ];

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  function setUserPref(key, val) { GM_setValue(key, val); }
  function getUserPref(key, def) { const v = GM_getValue(key, null); return v == null ? def : v; }

  let previewThumbMap = null;
  function buildPreviewThumbMap() {
    previewThumbMap = {};
    document.querySelectorAll('.bbCodeBlock--unfurl[data-unfurl][data-url]').forEach(unfurl => {
      const url = unfurl.getAttribute('data-url');
      let thumb = "";
      const imgs = unfurl.querySelectorAll('.contentRow-figure img[src]');
      if (imgs && imgs.length) {
        const found = Array.from(imgs).find(img => img.src.endsWith('.png') || img.src.match(/thumbs\//));
        thumb = found ? found.src : imgs[0].src;
      }
      if (!thumb) {
        const fav = unfurl.querySelector('.js-unfurl-favicon img[src]');
        if (fav) thumb = fav.src;
      }
      if (url && thumb) previewThumbMap[url] = thumb;
    });
  }

  function showToast(msg, timeout = 3300) {
    const t = document.createElement("div");
    t.className = "hud-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = "0.1"; setTimeout(() => t.remove(), 600); }, timeout);
  }

  function decodeConfirmationHref(a) {
    try {
      const u = new URL(a.href, location.origin);
      if (!/\/goto\/link-confirmation/.test(u.pathname) || !u.searchParams.has('url')) return null;
      const raw = u.searchParams.get('url');
      const candidates = [];
      try { candidates.push(decodeURIComponent(raw)); } catch { /* ignore */ }
      try { candidates.push(atob(raw)); } catch { /* ignore */ }
      try { candidates.push(atob(decodeURIComponent(raw))); } catch { /* ignore */ }
      for (const c of candidates) {
        if (isExternalHoster(c) || isMediaFile(c) || /^https?:\/\//.test(c)) return c;
      }
      return candidates[0] ?? null;
    } catch {
      return null;
    }
  }

  function isExternalHoster(url) {
    return HOSTER_PATTERNS.some(re => re.test(url));
  }

  function isMediaFile(url) {
    const u = url.split("?")[0].split("#")[0].toLowerCase();
    return MEDIA_TYPES.some(ext => u.endsWith("." + ext));
  }

  function isBunkrUrl(url) {
    try {
      const host = new URL(url).hostname;
      return host.startsWith("bunkr.") || host.includes(".bunkr.");
    } catch { return false; }
  }

  function copyText(txt) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).catch(() => copyTextLegacy(txt));
    } else {
      copyTextLegacy(txt);
    }
  }

  function copyTextLegacy(txt) {
    const ta = document.createElement("textarea");
    ta.value = txt;
    ta.setAttribute("readonly", "");
    Object.assign(ta.style, { position: "absolute", left: "-9999px" });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }

  // ===========================================================================
  // EXTRACTION ENGINE
  // ===========================================================================
  function extractExternalHostLinks() {
    if (!previewThumbMap) buildPreviewThumbMap();
    const links = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      let url = a.href.trim();
      const deprox = decodeConfirmationHref(a);
      if (deprox) url = deprox.trim();
      if (isExternalHoster(url)) links.add(url);
    });
    return Array.from(links);
  }

  function extractMediaLinks() {
    if (!previewThumbMap) buildPreviewThumbMap();
    const links = new Set();
    document.querySelectorAll("a[href]").forEach(a => {
      let url = a.href.trim();
      const deprox = decodeConfirmationHref(a);
      if (deprox) url = deprox.trim();
      if (isMediaFile(url)) links.add(url);
    });
    document.querySelectorAll("img[src]").forEach(img => {
      const url = img.src.trim();
      if (isMediaFile(url)) links.add(url);
    });
    document.querySelectorAll("video, audio").forEach(el => {
      if (el.src && isMediaFile(el.src.trim())) links.add(el.src.trim());
      el.querySelectorAll("source[src]").forEach(src => {
        const url = src.src.trim();
        if (isMediaFile(url)) links.add(url);
      });
    });
    return Array.from(links);
  }

  // ===========================================================================
  // HUD PANEL SHELL & DOCK
  // ===========================================================================
  if (!document.getElementById("linkmaster-dock")) {
    const dock = document.createElement('div');
    dock.id = 'linkmaster-dock';

    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    btn.innerHTML = `${getPsiGlyphSVG('dock-icon')}<span class="dock-text">LinkMaster</span>`;
    btn.onclick = () => { showHudPanel(); };

    dock.appendChild(btn);
    document.body.appendChild(dock);
  }

  function showHudPanel() {
    let hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) {
      hudPanel = document.createElement("div");
      hudPanel.id = "hud-panel-root";
      hudPanel.className = "hud-container";
      hudPanel.innerHTML = `
        <div class="hud-header">
          ${getPsiGlyphSVG('glyph')}
          <span class="title">LinkMaster</span>
          <button class="hud-close-btn" title="Close HUD" tabindex="0">&times;</button>
        </div>
        <nav class="hud-tabs" role="tablist">
          <button class="hud-button active" data-tab="scrape" role="tab" aria-selected="true" tabindex="0">Scrape</button>
          <button class="hud-button" data-tab="check" role="tab" aria-selected="false" tabindex="0">Check</button>
          <button class="hud-button" data-tab="settings" role="tab" aria-selected="false" tabindex="0">Settings</button>
        </nav>
        <main class="hud-content" tabindex="0" id="hud-content-panel"></main>
      `;
      document.body.appendChild(hudPanel);
      hudPanel.querySelector(".hud-close-btn").onclick = () => {
        hudPanel.setAttribute("hidden", "true");
      };
      hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
        btn.onclick = function () { setHudTab(this.getAttribute("data-tab")); };
      });
    }
    hudPanel.removeAttribute("hidden");
    setHudTab(currentTab);
  }

  function setHudTab(tab) {
    currentTab = tab;
    const hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) return;
    hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
      const isActive = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
    const contentPanel = hudPanel.querySelector("#hud-content-panel");
    contentPanel.innerHTML = "";
    if (tab === "scrape")        renderScrapePanel(contentPanel);
    else if (tab === "check")    renderCheckPanel(contentPanel);
    else if (tab === "settings") renderSettingsPanel(contentPanel);
  }

  // ===========================================================================
  // SCRAPE PANEL
  // ===========================================================================
  function renderScrapePanel(root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <button class="hud-btn" id="hud-scan-btn">Scan</button>
        <button class="hud-btn${extractionMode === "host" ? " active" : ""}" id="hud-host-mode-btn">Host Mode</button>
        <button class="hud-btn${extractionMode === "media" ? " active" : ""}" id="hud-media-mode-btn">Media Mode</button>
        <span id="hud-scrape-status" class="hud-status-text" style="color:var(--text-secondary);"></span>
      </div>
      <div id="hud-media-table-root" style="margin-top:12px;"></div>
      <div style="color:var(--text-cyan-active); margin-top:12px;" class="hud-status-text">
        <b>Mode:</b> <span id="hud-current-mode">${extractionMode === "host" ? "External Host Links (decoded, deproxied)" : "All Media (images/videos/audio on page)"}</span>
      </div>
    `;
    root.querySelector("#hud-scan-btn").onclick = runScrapeAndRender;
    root.querySelector("#hud-host-mode-btn").onclick = function () {
      setExtractionMode("host");
      root.querySelector("#hud-host-mode-btn").classList.add("active");
      root.querySelector("#hud-media-mode-btn").classList.remove("active");
      root.querySelector("#hud-current-mode").textContent = "External Host Links (decoded, deproxied)";
    };
    root.querySelector("#hud-media-mode-btn").onclick = function () {
      setExtractionMode("media");
      root.querySelector("#hud-host-mode-btn").classList.remove("active");
      root.querySelector("#hud-media-mode-btn").classList.add("active");
      root.querySelector("#hud-current-mode").textContent = "All Media (images/videos/audio on page)";
    };
    runScrapeAndRender();
  }

  function setExtractionMode(mode) {
    extractionMode = mode;
    setUserPref("extractionMode", extractionMode);
    showToast("Extraction mode: " + (mode === "media" ? "Media" : "External Host"));
    runScrapeAndRender();
  }

  function runScrapeAndRender() {
    previewThumbMap = null;
    const statusEl  = document.getElementById("hud-scrape-status");
    const tableRoot = document.getElementById("hud-media-table-root");
    if (!statusEl || !tableRoot) return;
    statusEl.textContent = "Scanning...";
    setTimeout(() => {
      const links = extractionMode === "host"
        ? extractExternalHostLinks()
        : extractMediaLinks();
      if (links.length === 0) {
        tableRoot.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);padding:16px 0;">No links found (${extractionMode === "host" ? "External Host Mode" : "Media Mode"}).</div>`;
        statusEl.textContent = "No links found.";
        return;
      }
      statusEl.textContent = `${links.length} ${extractionMode === "host" ? "external host" : "media"} link${links.length !== 1 ? "s" : ""} found.`;
      renderMediaTable(links, tableRoot);
    }, 80);
  }

  // ===========================================================================
  // MEDIA PREVIEW & TABLE
  // ===========================================================================
  function createMediaPreview(url) {
    if (extractionMode === "host" && previewThumbMap) {
      if (previewThumbMap[url]) {
        const img = document.createElement("img");
        img.src = previewThumbMap[url];
        img.alt = "Preview";
        Object.assign(img.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)" });
        img.loading = "lazy";
        return img;
      }
      try {
        const host = new URL(url).hostname;
        let favicon = null;
        document.querySelectorAll('.bbCodeBlock--unfurl[data-unfurl][data-url]').forEach(unfurl => {
          const h = unfurl.getAttribute('data-host');
          const favimg = unfurl.querySelector('.js-unfurl-favicon img[src]');
          if (h && favimg && h.toLowerCase() === host.toLowerCase()) favicon = favimg.src;
        });
        if (favicon) {
          const img = document.createElement("img");
          img.src = favicon;
          img.alt = "Favicon";
          img.className = "chip favicon";
          Object.assign(img.style, { width: "20px", height: "20px", borderRadius: "4px" });
          return img;
        }
      } catch { /* ignore */ }
    }
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    if (["jpg","jpeg","png","webp","gif","bmp","svg"].includes(ext)) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      Object.assign(img.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)" });
      img.loading = "lazy";
      return img;
    }
    if (["mp4","webm","mkv","mov","avi","flv","wmv","3gp"].includes(ext)) {
      const vid = document.createElement("video");
      vid.src = url;
      vid.controls = false;
      vid.muted = true;
      vid.preload = "none";
      Object.assign(vid.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)", cursor: "pointer" });
      vid.addEventListener("mouseenter", () => { if (vid.preload === "none") vid.preload = "metadata"; }, { once: true });
      return vid;
    }
    return null;
  }

  function renderMediaTable(links, root) {
    if (!Array.isArray(links) || links.length === 0) {
      root.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);padding:16px 0;">No links found on this page.</div>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse; text-align:left;"><thead>
      <tr style="border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);">
        <th style="padding:8px 4px;">Preview</th>
        <th style="padding:8px 4px;">File</th>
        <th style="padding:8px 4px;">Host</th>
        <th style="padding:8px 4px;">Actions</th>
        <th style="padding:8px 4px;">Status</th>
      </tr>
    </thead><tbody>`;
    links.forEach((url, idx) => {
      const file     = url.split("/").pop().split("?")[0].slice(0, 40) || "(index)";
      const host     = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
      const isBunkr  = isBunkrUrl(url);
      const streamBtn = isBunkr
        ? `<button class="hud-btn" data-idx="${idx}" data-action="stream" title="Resolve direct CDN link via DOM-first acquisition">Stream</button>`
        : "";
      html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" data-url="${encodeURIComponent(url)}">
        <td id="media-preview-${idx}" style="min-width:72px;max-width:80px;padding:8px 4px;"></td>
        <td style="max-width:200px;overflow-x:auto;padding:8px 4px;">${file}</td>
        <td style="color:var(--text-cyan-active);max-width:140px;overflow-x:auto;padding:8px 4px;">${host}</td>
        <td class="hud-action-cell" style="padding:8px 4px;">
          <button class="hud-btn" data-idx="${idx}" data-action="copy">Copy</button>
          <button class="hud-btn" data-idx="${idx}" data-action="open">Open</button>
          ${streamBtn}
        </td>
        <td id="media-check-${idx}" style="padding:8px 4px;"><span class="chip unknown">…</span></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;

    links.forEach((url, idx) => {
      const prev   = createMediaPreview(url);
      const prevTd = document.getElementById("media-preview-" + idx);
      if (prevTd && prev) prevTd.appendChild(prev);
    });

    root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function () {
        const idx    = +this.getAttribute("data-idx");
        const action = this.getAttribute("data-action");
        const url    = links[idx];
        if (action === "copy") {
          copyText(url);
          showToast("Copied to clipboard.");
        } else if (action === "open") {
          window.open(url, "_blank", "noopener");
        } else if (action === "stream") {
          resolveBunkrStreamLink(url, this);
        }
      };
    });

    checkLinksQueued(links);
  }

  function checkLinksQueued(links) {
    const MAX_CONCURRENT = 6;
    let active = 0;
    let idx    = 0;
    function next() {
      while (active < MAX_CONCURRENT && idx < links.length) {
        const i   = idx++;
        const url = links[i];
        active++;
        checkMediaLink(url, (status, info) => {
          const td = document.getElementById("media-check-" + i);
          if (td) renderCheckResult(status, info, td);
          active--;
          next();
        });
      }
    }
    next();
  }

  // ===========================================================================
  // BUNKR DOM-FIRST STREAM RESOLUTION
  // ===========================================================================
  function resolveBunkrStreamLink(bunkrUrl, btnEl) {
    const origText = btnEl.textContent;
    btnEl.textContent = "…";
    btnEl.disabled    = true;

    GM_xmlhttpRequest({
      method:  "GET",
      url:     bunkrUrl,
      headers: {
        "Referer":          bunkrUrl,
        "Accept":           "text/html,application/xhtml+xml",
        "Accept-Language":  "en-US,en;q=0.9",
      },
      timeout: 12000,
      onload: (resp) => {
        btnEl.textContent = origText;
        btnEl.disabled    = false;
        if (resp.status < 200 || resp.status >= 300) {
          showToast(`Stream resolve failed: HTTP ${resp.status}`);
          return;
        }
        const doc = new DOMParser().parseFromString(resp.responseText, "text/html");
        const anchor = doc.querySelector([
          "a[href*='get.bunkr']",
          "a.ic-download-01",
          "a[href*='/file/']",
          "a[href*='cdn'][href$='.mp4']",
          "a[href*='cdn'][href$='.zip']",
          "a[download][href]",
        ].join(", "));
        if (anchor?.href) {
          copyText(anchor.href);
          showToast("⦒ █▓░ CDN link copied.");
          return;
        }
        const ogVideo = doc.querySelector("meta[property='og:video']");
        if (ogVideo?.content) {
          copyText(ogVideo.content);
          showToast("⦒ █▓░ OG stream link copied.");
          return;
        }
        const src = doc.querySelector("source[src], video[src]");
        if (src) {
          const s = src.getAttribute("src") || src.src;
          if (s && !s.startsWith("blob:")) {
            copyText(s);
            showToast("⦒ █▓░ Video source link copied.");
            return;
          }
        }
        showToast("Stream resolve: no CDN anchor found in page DOM.");
      },
      onerror:   () => { btnEl.textContent = origText; btnEl.disabled = false; showToast("Stream resolve: network error."); },
      ontimeout: () => { btnEl.textContent = origText; btnEl.disabled = false; showToast("Stream resolve: timed out (12s)."); },
    });
  }

  // ===========================================================================
  // LINK CHECKER ENGINE
  // ===========================================================================
  const hosterHealthCheckers = {
    "bunkr":       { type: "gm_head" },
    "1fichier.com":{ type: "fetch",   method: "HEAD" },
    "gofile.io":   { type: "fetch",   method: "HEAD" },
    "motherless.com": { type: "fetch", method: "HEAD" },
  };

  function getHosterChecker(url) {
    try {
      const host = new URL(url).hostname;
      if (host.startsWith("bunkr.") || host.includes(".bunkr.")) {
        return hosterHealthCheckers["bunkr"];
      }
      for (const k in hosterHealthCheckers) {
        if (k === "bunkr") continue;
        if (host.includes(k)) return hosterHealthCheckers[k];
      }
    } catch { /* ignore */ }
    return null;
  }

  function checkMediaLink(url, cb) {
    const checker = getHosterChecker(url);

    if (checker && checker.type === "gm_head") {
      GM_xmlhttpRequest({
        method:  "HEAD",
        url,
        headers: {
          "Referer": (() => { try { const u = new URL(url); return `${u.protocol}//${u.host}/`; } catch { return url; } })(),
          "Accept":  "*/*",
        },
        timeout: 10000,
        onload: (resp) => {
          let status = "unknown";
          if (resp.status === 200 || resp.status === 206)          status = "alive";
          else if ([403, 404, 410, 451].includes(resp.status))     status = "dead";
          cb(status, `HTTP ${resp.status}`);
        },
        onerror:   () => cb("unknown", "Network error"),
        ontimeout: () => cb("unknown", "Timeout"),
      });
      return;
    }

    if (checker && checker.type === "fetch") {
      fetch(url, { method: checker.method, mode: "no-cors", cache: "no-store" })
        .then(resp => {
          let status = "unknown";
          if (resp.status === 200)                                  status = "alive";
          else if ([403, 404, 410].includes(resp.status))          status = "dead";
          cb(status, resp.status ? `${resp.status} ${resp.statusText}` : "opaque");
        })
        .catch(() => cb("unknown", "CORS/network error"));
      return;
    }

    fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" })
      .then(resp => {
        let status = "unknown";
        if (resp.status === 200)                                    status = "alive";
        else if ([403, 404, 410].includes(resp.status))            status = "dead";
        cb(status, resp.status ? `${resp.status} ${resp.statusText}` : "opaque");
      })
      .catch(() => {
        fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" })
          .then(resp => {
            let status = "unknown";
            if (resp.status === 200)                                status = "alive";
            else if ([403, 404, 410].includes(resp.status))        status = "dead";
            cb(status, resp.status ? `${resp.status} ${resp.statusText}` : "opaque");
          })
          .catch(() => cb("unknown", "All probes failed"));
      });
  }

  function renderCheckResult(status, info, td) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = status === "alive" ? "Alive" : status === "dead" ? "Dead" : "Unknown";
    if (status === "dead")    chip.classList.add("dead");
    if (status === "unknown") chip.classList.add("unknown");
    if (info) chip.title = info;
    td.innerHTML = "";
    td.appendChild(chip);
  }

  // ===========================================================================
  // CHECK PANEL (BULK)
  // ===========================================================================
  function renderCheckPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:16px;">
        <textarea id="hud-bulk-links" class="hud-input" placeholder="Paste links to check (one per line)" rows="7"></textarea>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="hud-btn" id="hud-bulk-check-btn">Check Links</button>
        <span id="hud-bulk-check-status" class="hud-status-text" style="color:var(--text-secondary);"></span>
      </div>
      <div id="hud-bulk-table-root" style="margin-top:16px;"></div>
    `;
    root.querySelector("#hud-bulk-check-btn").onclick = function () {
      const input = root.querySelector("#hud-bulk-links").value;
      const urls  = input.split(/[\n\r\s]+/).map(x => x.trim()).filter(Boolean);
      if (urls.length === 0) { showToast("No links to check."); return; }
      renderBulkCheckTable(urls, root.querySelector("#hud-bulk-table-root"));
    };
  }

  function renderBulkCheckTable(urls, root) {
    root.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);margin-bottom:8px;">Checking ${urls.length} links...</div>`;
    let html = `<table style="width:100%;border-collapse:collapse; text-align:left;"><thead>
      <tr style="border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);">
        <th style="padding:8px 4px;">Link</th>
        <th style="padding:8px 4px;">Status</th>
        <th style="padding:8px 4px;">Actions</th>
      </tr>
    </thead><tbody>`;
    urls.forEach((url, idx) => {
      const isBunkr  = isBunkrUrl(url);
      const streamBtn = isBunkr
        ? `<button class="hud-btn" data-bulk-idx="${idx}" data-action="stream">Stream</button>`
        : "";
      html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="max-width:300px;overflow-x:auto;padding:8px 4px;">${url}</td>
        <td id="bulk-check-${idx}" style="padding:8px 4px;"><span class="chip unknown">…</span></td>
        <td class="hud-action-cell" style="padding:8px 4px;">
          <button class="hud-btn" data-bulk-idx="${idx}" data-action="copy">Copy</button>
          ${streamBtn}
        </td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;

    root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function () {
        const idx    = +this.getAttribute("data-bulk-idx");
        const action = this.getAttribute("data-action");
        if (action === "copy") { copyText(urls[idx]); showToast("Copied."); }
        else if (action === "stream") { resolveBunkrStreamLink(urls[idx], this); }
      };
    });

    const MAX_CONCURRENT = 6;
    let active = 0, qi = 0;
    function nextBulk() {
      while (active < MAX_CONCURRENT && qi < urls.length) {
        const i   = qi++;
        const url = urls[i];
        active++;
        checkMediaLink(url, (status, info) => {
          const td = document.getElementById("bulk-check-" + i);
          if (td) renderCheckResult(status, info, td);
          active--;
          nextBulk();
        });
      }
    }
    nextBulk();
  }

  // ===========================================================================
  // SETTINGS PANEL
  // ===========================================================================
  function renderSettingsPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;">
        <button class="hud-btn" id="hud-export-btn">Export Current Links</button>
        <button class="hud-btn" id="hud-mode-toggle-btn2">Switch to ${extractionMode === "host" ? "Media" : "Host"} Mode</button>
        <button class="hud-btn" id="hud-hostlist-btn">Show Host Patterns</button>
        <button class="hud-btn" id="hud-clear-prefs-btn" style="border-color:rgba(255, 77, 77, 0.5);color:#ff4d4d;">Reset Prefs</button>
      </div>
      <div style="margin-bottom:16px;">
        <textarea id="hud-export-area" class="hud-input" rows="8" readonly placeholder="Exported links or pattern list will appear here."></textarea>
      </div>
      <div class="hud-status-text" style="color:var(--text-secondary);">
        Current mode: <b style="color:var(--text-cyan-active);">${extractionMode === "host" ? "External Host" : "Media"}</b>
      </div>
    `;
    const modeBtn = root.querySelector("#hud-mode-toggle-btn2");
    root.querySelector("#hud-export-btn").onclick = function () {
      const links = extractionMode === "host" ? extractExternalHostLinks() : extractMediaLinks();
      root.querySelector("#hud-export-area").value = links.join("\n");
      showToast(`${links.length} links exported.`);
    };
    modeBtn.onclick = function () {
      if (extractionMode === "host") {
        setExtractionMode("media");
        modeBtn.textContent = "Switch to Host Mode";
      } else {
        setExtractionMode("host");
        modeBtn.textContent = "Switch to Media Mode";
      }
    };
    root.querySelector("#hud-hostlist-btn").onclick = function () {
      root.querySelector("#hud-export-area").value = HOSTER_PATTERNS.map(r => r.toString()).join("\n");
      showToast("Host pattern list loaded.");
    };
    root.querySelector("#hud-clear-prefs-btn").onclick = function () {
      if (window.confirm("Reset all LinkMasterΨ preferences to defaults?")) {
        GM_deleteValue("extractionMode");
        extractionMode = "host";
        showToast("Preferences reset.");
        setHudTab("settings");
      }
    };
  }

  // ===========================================================================
  // DRAGGABLE HUD + KEYBOARD NAV
  // ===========================================================================
  (() => {
    let drag = { x: 0, y: 0, active: false, el: null };
    document.addEventListener("mousedown", function (e) {
      const hud = document.getElementById("hud-panel-root");
      if (!hud) return;
      if (e.target.closest(".hud-header")) {
        drag.el     = hud;
        drag.x      = e.clientX - hud.offsetLeft;
        drag.y      = e.clientY - hud.offsetTop;
        drag.active = true;
        document.body.style.userSelect = "none";
      }
    });
    document.addEventListener("mousemove", function (e) {
      if (!drag.active || !drag.el) return;
      drag.el.style.left     = (e.clientX - drag.x) + "px";
      drag.el.style.top      = (e.clientY - drag.y) + "px";
      drag.el.style.right    = "auto";
      drag.el.style.bottom   = "auto";
      drag.el.style.position = "fixed";
    });
    document.addEventListener("mouseup", function () {
      drag.active = false;
      document.body.style.userSelect = "";
    });
  })();

  document.addEventListener("keydown", function (e) {
    const hud = document.getElementById("hud-panel-root");
    if (!hud || hud.hasAttribute("hidden")) return;
    if (e.key === "Escape") { hud.setAttribute("hidden", "true"); return; }
    if (e.key === "Tab") {
      const focusables = Array.from(hud.querySelectorAll("button, [tabindex='0'], textarea, input"));
      if (!focusables.length) return;
      let idx = focusables.indexOf(document.activeElement);
      if (e.shiftKey) idx = idx <= 0 ? focusables.length - 1 : idx - 1;
      else            idx = (idx + 1) % focusables.length;
      focusables[idx].focus();
      e.preventDefault();
    }
  });

  // ===========================================================================
  // GM MENU COMMAND
  // ===========================================================================
  GM_registerMenuCommand("Show 4ndr0666 Electric Media HUD", () => showHudPanel());

})();
