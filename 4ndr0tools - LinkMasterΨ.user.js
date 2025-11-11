// ==UserScript==
// @name         4ndr0tools - LinkMasterΨ
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      2025.11.11.Ψ3
// @description  Ψ Electric-Glass HUD: Accurately decodes, previews, exports, and validates real external host links.
// @downloadurl https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @updateurl https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @license      MIT
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_registerMenuCommand
// ==/UserScript==

(() => {
  "use strict";

  // ===== PHASE 1: THEME, BOOTSTRAP, IMMEDIATE BUTTON =====
  (() => {
    if (!document.querySelector('link[href*="Roboto+Mono"]')) {
      const gfRoboto = document.createElement("link");
      gfRoboto.rel = "stylesheet";
      gfRoboto.href = "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&display=swap";
      document.head.appendChild(gfRoboto);
    }
  })();

  const hudStyle = `
  :root {
    --bg-dark: #0A131A; --accent-cyan: #00E5FF; --text-cyan-active: #67E8F9;
    --accent-cyan-border-hover: rgba(0,229,255,0.5); --accent-cyan-bg-active: rgba(0,229,255,0.2);
    --accent-cyan-glow-active: rgba(0,229,255,0.4); --text-primary: #EAEAEA;
    --text-secondary: #9E9E9E; --font-body: 'Roboto Mono', monospace;
    --font-hud: 'Orbitron', sans-serif; --panel-bg: #101827cc; --panel-bg-solid: #101827;
    --panel-border: #15adad; --panel-border-bright: #15fafa;
    --panel-glow: rgba(21,250,250,0.2); --panel-glow-intense: rgba(21,250,250,0.4);
    --primary-cyan: #15fafa; --scrollbar-thumb: #157d7d; --scrollbar-thumb-hover: #15fafa; --hud-z: 999999;
  }
  .hud-container {
    position:fixed; bottom:2.6em; right:2.6em; z-index:var(--hud-z); background:var(--panel-bg);
    backdrop-filter:blur(6px); border-radius:1.2em; border:2.5px solid var(--panel-border);
    box-shadow:0 0 36px var(--panel-glow), 0 1.5px 8px #000b; min-width:420px; max-width:94vw; min-height:340px;
    color:var(--text-primary); font-family:var(--font-body); transition:all 280ms cubic-bezier(.45,.05,.55,.95);
    user-select:text; overflow:visible; opacity:0.99;
  }
  .hud-container[hidden]{display:none!important;}
  .hud-header{display:flex;align-items:center;padding:1.2em 1em 0.3em 1.2em;border-bottom:1.5px solid var(--panel-border);gap:1.1em;font-family:var(--font-hud);font-size:1.36em;letter-spacing:0.07em;background:transparent;user-select:none;}
  .hud-header .glyph{flex:none;width:44px;height:44px;display:block;}
  .hud-header .title{flex:1;font-weight:700;background:linear-gradient(to right,#15fafa,#15adad,#157d7d);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:0.14em;text-shadow:0 0 9px var(--panel-glow-intense);font-family:var(--font-hud);font-size:1.19em;}
  .hud-header .hud-close-btn{font-family:var(--font-hud);font-size:1.3em;border:none;background:transparent;color:var(--primary-cyan);cursor:pointer;margin-left:0.7em;opacity:0.8;transition:color 150ms;}
  .hud-header .hud-close-btn:hover{color:#e06;opacity:1;}
  .hud-tabs{display:flex;gap:0.7em;padding:0.6em 1.3em 0.1em 1.3em;border-bottom:1.5px solid var(--panel-border);background:transparent;}
  .hud-tabs .hud-button{font-family:var(--font-hud);font-size:1em;letter-spacing:0.08em;font-weight:700;background:none;padding:0.45em 1.1em;border-radius:0.8em;border:2px solid transparent;color:var(--text-secondary);cursor:pointer;transition:all 200ms;box-shadow:none;}
  .hud-tabs .hud-button.active{color:var(--primary-cyan);border-color:var(--primary-cyan);background:var(--accent-cyan-bg-active);box-shadow:0 0 15px var(--panel-glow-intense);}
  .hud-tabs .hud-button:hover:not(.active){border-color:var(--panel-border-bright);color:var(--panel-border-bright);background:var(--accent-cyan-bg-active);box-shadow:0 0 10px var(--panel-glow);}
  .hud-content{padding:1.35em 1.9em 1.2em 1.9em;min-height:220px;max-height:68vh;overflow-y:auto;font-size:1em;color:var(--text-primary);background:transparent;}
  .hud-content::-webkit-scrollbar{width:12px;background:var(--panel-bg-solid);}
  .hud-content::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:8px;}
  .hud-content::-webkit-scrollbar-thumb:hover{background:var(--scrollbar-thumb-hover);}
  .hud-btn, .hud-button{display:inline-flex;align-items:center;gap:0.5em;padding:0.45em 1.05em;border-radius:0.6em;border:1.5px solid transparent;font-family:var(--font-hud);font-weight:700;font-size:1em;background:rgba(0,0,0,0.24);color:var(--text-secondary);cursor:pointer;letter-spacing:0.08em;transition:all 200ms;box-shadow:none;outline:none;}
  .hud-btn.active,.hud-button.active{color:var(--primary-cyan);border-color:var(--primary-cyan);background:var(--accent-cyan-bg-active);box-shadow:0 0 10px var(--panel-glow-intense);}
  .hud-btn:focus-visible,.hud-button:focus-visible{outline:2.5px solid var(--panel-border-bright);outline-offset:1.5px;}
  .chip{display:inline-block;border-radius:1.3em;padding:0.1em 0.8em;font-size:0.94em;font-family:var(--font-body);font-weight:600;background:#121c24;color:#67E8F9;border:1.5px solid #15fafa;box-shadow:0 0 7px var(--panel-glow);margin-right:0.35em;margin-bottom:0.1em;}
  .chip.dead{color:#fff3;border-color:#e06;background:#390a18;}
  .chip.unknown{color:#fffbe6;border-color:#b5b500;background:#4c4b12;}
  .chip.favicon{background:#23262b;color:#d0ffff;border:1.5px solid #0af;}
  .hud-toast{position:fixed;z-index:calc(var(--hud-z)+2000);bottom:3.4em;right:3.1em;background:#111b1bcc;color:var(--primary-cyan);font-family:var(--font-hud);font-size:1em;border-radius:0.8em;border:2px solid var(--panel-border-bright);box-shadow:0 0 18px var(--panel-glow-intense);padding:1.15em 2.2em;opacity:0.97;pointer-events:none;transition:opacity 220ms;user-select:none;}
  `;

  const psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="glyph" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif" class="glyph-core-psi">Ψ</text></svg>`;

  if (!document.getElementById("eglass-hud-css")) {
    const style = document.createElement("style");
    style.id = "eglass-hud-css";
    style.textContent = hudStyle;
    document.head.appendChild(style);
  }

  if (!document.getElementById("hud-float-btn")) {
    const floatBtn = document.createElement("button");
    floatBtn.id = "hud-float-btn";
    floatBtn.className = "hud-btn";
    floatBtn.innerHTML = psiGlyphSVG + `<span style="font-family: var(--font-hud); font-weight: 800; margin-left: 0.6em;">HUD</span>`;
    Object.assign(floatBtn.style, {
      position: "fixed", bottom: "2em", right: "2em", zIndex: "999998",
      padding: "0.6em 1.3em", background: "rgba(10,19,26,0.85)",
      borderRadius: "0.9em", border: "2.5px solid var(--panel-border)",
      boxShadow: "0 0 16px var(--panel-glow)", color: "var(--primary-cyan)",
      fontSize: "1.08em", cursor: "pointer", outline: "none", transition: "all 220ms"
    });
    document.body.appendChild(floatBtn);
    floatBtn.addEventListener("click", () => { showHudPanel(); });
  }

  let extractionMode = getUserPref("extractionMode", "host");
  let currentTab = "scrape";

  const HOSTER_PATTERNS = [
    /:\/\/([a-z0-9-]+\.)?bunkr\.(ac|cr|pk|ru|ws|la|to|is|bz|sx|re|co|sh|pl|gg|mn|yt|site|si|red|org)\//i,
    /:\/\/([a-z0-9-]+\.)?gofile\.io\//i,
    /:\/\/([a-z0-9-]+\.)?1fichier\.com\//i,
    /:\/\/([a-z0-9-]+\.)?motherless\.com\//i,
    /:\/\/([a-z0-9-]+\.)?motherlessmedia\.com\//i,
    /:\/\/([a-z0-9-]+\.)?bunkrrr\.org\//i,
    /:\/\/([a-z0-9-]+\.)?pixeldrain\.com\//i,
    /:\/\/([a-z0-9-]+\.)?pixhost\.to\//i,
    /:\/\/([a-z0-9-]+\.)?imgbox\.com\//i,
    /:\/\/([a-z0-9-]+\.)?imagevenue\.com\//i,
    /:\/\/([a-z0-9-]+\.)?imagetwist\.com\//i,
    /:\/\/([a-z0-9-]+\.)?nudbay\.com\//i,
    /:\/\/([a-z0-9-]+\.)?spankbang\.com\//i,
    /:\/\/([a-z0-9-]+\.)?thothub\.vip\//i,
    /:\/\/([a-z0-9-]+\.)?vimeo\.com\//i,
    /:\/\/([a-z0-9-]+\.)?youtube\.com\//i,
    /:\/\/([a-z0-9-]+\.)?simpcity\.su\//i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.site\//i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.si\//i,
    /:\/\/([a-z0-9-]+\.)?bunkr\.red\//i
  ];

  const MEDIA_TYPES = [
    "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg",
    "mp4", "webm", "mkv", "mov", "avi", "flv", "wmv", "3gp",
    "mp3", "ogg", "wav", "flac", "aac", "m4a"
  ];

  function setUserPref(key, val) { GM_setValue(key, val); }
  function getUserPref(key, def) { let v = GM_getValue(key, null); return v == null ? def : v; }

  // ---- BBUnfurl/Preview Map (improved: handles display:none + favicon fallback) ----
  let previewThumbMap = null;
  function buildPreviewThumbMap() {
    previewThumbMap = {};
    document.querySelectorAll('.bbCodeBlock--unfurl[data-unfurl][data-url]').forEach(unfurl => {
      const url = unfurl.getAttribute('data-url');
      let thumb = "";
      // Try ALL images under unfurl, even display:none
      const imgs = unfurl.querySelectorAll('.contentRow-figure img[src]');
      if (imgs && imgs.length) {
        // Use .png thumb if possible, fallback to first image
        let found = Array.from(imgs).find(img => img.src.endsWith('.png') || img.src.match(/thumbs\//));
        thumb = found ? found.src : imgs[0].src;
      }
      // If no "figure" image found, fallback to favicon (host logo)
      if (!thumb) {
        const fav = unfurl.querySelector('.js-unfurl-favicon img[src]');
        if (fav) thumb = fav.src;
      }
      if (url && thumb) previewThumbMap[url] = thumb;
    });
  }

  function showHudPanel() {
    let hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) {
      hudPanel = document.createElement("div");
      hudPanel.id = "hud-panel-root";
      hudPanel.className = "hud-container";
      hudPanel.innerHTML = `
        <div class="hud-header">
          ${psiGlyphSVG}
          <span class="title">Electric Media Scraper & Checker HUD</span>
          <button class="hud-close-btn" title="Close HUD" tabindex="0">&times;</button>
        </div>
        <nav class="hud-tabs" role="tablist">
          <button class="hud-button active" data-tab="scrape" role="tab" aria-selected="true" tabindex="0">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a1 1 0 1 1 0 2H5v14h14v-5a1 1 0 1 1 2 0v5a2 2 0 0 1-2 2z"/><path d="M21 3v6a1 1 0 1 1-2 0V6.41l-9.29 9.3a1 1 0 1 1-1.42-1.42L17.59 5H15a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1z"/></svg>
            <span>Scrape</span>
          </button>
          <button class="hud-button" data-tab="check" role="tab" aria-selected="false" tabindex="0">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M9 2a7 7 0 1 1 0 14A7 7 0 0 1 9 2zm0 2a5 5 0 1 0 0 10A5 5 0 0 0 9 4zm.75 3.75V9.5H11a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1 0-1.5h.75V7.75a.75.75 0 0 1 1.5 0z"/></svg>
            <span>Check</span>
          </button>
          <button class="hud-button" data-tab="settings" role="tab" aria-selected="false" tabindex="0">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M10 2a2 2 0 0 1 2 2v1.28A2 2 0 0 1 13.6 7.2l.9.51A2 2 0 0 1 15 9.4v1.19a2 2 0 0 1-1.3 1.89l-.9.51A2 2 0 0 1 12 15.72V17a2 2 0 1 1-4 0v-1.28a2 2 0 0 1-1.6-1.92l-.9-.51A2 2 0 0 1 5 10.6V9.41a2 2 0 0 1 1.3-1.89l.9-.51A2 2 0 0 1 8 4.28V3a2 2 0 0 1 2-2z"/></svg>
            <span>Settings</span>
          </button>
        </nav>
        <main class="hud-content" tabindex="0" id="hud-content-panel"></main>
      `;
      document.body.appendChild(hudPanel);
      hudPanel.querySelector(".hud-close-btn").onclick = () => { hudPanel.setAttribute("hidden", "true"); };
      hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
        btn.onclick = function () { setHudTab(this.getAttribute("data-tab")); };
      });
      setHudTab(currentTab);
    }
    hudPanel.removeAttribute("hidden");
  }

  function setHudTab(tab) {
    currentTab = tab;
    const hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) return;
    hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
      if (btn.getAttribute("data-tab") === tab) { btn.classList.add("active"); btn.setAttribute("aria-selected", "true"); }
      else { btn.classList.remove("active"); btn.setAttribute("aria-selected", "false"); }
    });
    const contentPanel = hudPanel.querySelector("#hud-content-panel");
    contentPanel.innerHTML = "";
    if (tab === "scrape")      renderScrapePanel(contentPanel);
    else if (tab === "check")  renderCheckPanel(contentPanel);
    else if (tab === "settings") renderSettingsPanel(contentPanel);
  }

  function showToast(msg, timeout = 3300) {
    let t = document.createElement("div");
    t.className = "hud-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = 0.1; setTimeout(() => t.remove(), 600); }, timeout);
  }

  // === CONFIRMATION BYPASS (DEPROX LOGIC, NATIVE) ===
  function decodeConfirmationHref(a) {
    try {
      const u = new URL(a.href, location.origin);
      if (/\/goto\/link-confirmation/.test(u.pathname) && u.searchParams.has('url')) {
        let real = u.searchParams.get('url');
        try { real = decodeURIComponent(real); } catch {}
        try { real = atob(real); } catch {}
        return real;
      }
    } catch {}
    return null;
  }

  function isExternalHoster(url) {
    return HOSTER_PATTERNS.some(re => re.test(url));
  }
  function isMediaFile(url) {
    const u = url.split("?")[0].split("#")[0].toLowerCase();
    return MEDIA_TYPES.some(ext => u.endsWith("." + ext));
  }

  // === SUPPORTED SCRAPE LOGIC ===

  function extractExternalHostLinks() {
    if (!previewThumbMap) buildPreviewThumbMap();
    const links = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      let url = a.href.trim();
      let deprox = decodeConfirmationHref(a);
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
      let deprox = decodeConfirmationHref(a);
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

  // === SCRAPE PANEL ===
  function renderScrapePanel(root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.1em;">
        <button class="hud-btn" id="hud-scan-btn" style="margin-bottom:1.2em;">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a1 1 0 1 1 0 2H5v14h14v-5a1 1 0 1 1 2 0v5a2 2 0 0 1-2 2z"/><path d="M21 3v6a1 1 0 1 1-2 0V6.41l-9.29 9.3a1 1 0 1 1-1.42-1.42L17.59 5H15a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1z"/></svg>
          <span>Scan</span>
        </button>
        <button class="hud-btn${extractionMode==="host"?" active":""}" id="hud-host-mode-btn" style="margin-bottom:1.2em;">Host Mode</button>
        <button class="hud-btn${extractionMode==="media"?" active":""}" id="hud-media-mode-btn" style="margin-bottom:1.2em;">Media Mode</button>
        <span id="hud-scrape-status" style="color:var(--text-secondary);font-size:1em;"></span>
      </div>
      <div id="hud-media-table-root"></div>
      <div style="color:#9ef;font-size:0.93em;margin-top:0.9em;">
        <b>Mode:</b> <span id="hud-current-mode">${extractionMode === "host" ? "External Host Links (decoded, no images/videos on page)" : "All Media (images/videos/audio on page)"}</span>
      </div>
    `;
    root.querySelector("#hud-scan-btn").onclick = runScrapeAndRender;
    root.querySelector("#hud-host-mode-btn").onclick = function() {
      setExtractionMode("host");
      document.getElementById("hud-host-mode-btn").classList.add("active");
      document.getElementById("hud-media-mode-btn").classList.remove("active");
      document.getElementById("hud-current-mode").textContent = "External Host Links (decoded, no images/videos on page)";
      runScrapeAndRender();
    };
    root.querySelector("#hud-media-mode-btn").onclick = function() {
      setExtractionMode("media");
      document.getElementById("hud-host-mode-btn").classList.remove("active");
      document.getElementById("hud-media-mode-btn").classList.add("active");
      document.getElementById("hud-current-mode").textContent = "All Media (images/videos/audio on page)";
      runScrapeAndRender();
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
    previewThumbMap = null; // Always rebuild for dynamic pages
    const statusEl = document.getElementById("hud-scrape-status");
    const tableRoot = document.getElementById("hud-media-table-root");
    statusEl.textContent = "Scanning...";
    setTimeout(() => {
      let links;
      if (extractionMode === "host") {
        links = extractExternalHostLinks();
      } else {
        links = extractMediaLinks();
      }
      if (links.length === 0) {
        tableRoot.innerHTML = `<div style="color:var(--text-secondary);padding:1.2em 0 1em 0;">No links found (${extractionMode === "host" ? "External Host Mode" : "Media Mode"}).<br>${extractionMode === "host" ? "If nothing appears, check the host allowlist or try a media-rich post." : "Try another page with images/videos/links."}</div>`;
        statusEl.textContent = "No links found.";
        return;
      }
      statusEl.textContent = `${links.length} ${extractionMode === "host" ? "external host" : "media"} link${links.length !== 1 ? "s" : ""} found.`;
      renderMediaTable(links, tableRoot);
    }, 80);
  }

  function createMediaPreview(url) {
    // Host mode: use BBUnfurl thumbnail if available, fallback to favicon (host logo)
    if (extractionMode === "host" && previewThumbMap) {
      if (previewThumbMap[url]) {
        const img = document.createElement("img");
        img.src = previewThumbMap[url];
        img.alt = "Preview";
        img.style.maxWidth = "64px";
        img.style.maxHeight = "54px";
        img.loading = "lazy";
        img.style.borderRadius = "6px";
        img.style.boxShadow = "0 0 8px #15fafa44";
        return img;
      } else {
        // Fallback: use generic favicon for host if present in map
        try {
          const host = (new URL(url)).hostname;
          // Try to extract .js-unfurl-favicon img for this host from any unfurl block
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
            img.style.maxWidth = "22px";
            img.style.maxHeight = "22px";
            img.style.borderRadius = "5px";
            img.style.verticalAlign = "middle";
            img.style.margin = "3px 0 2px 0";
            return img;
          }
        } catch (e) {}
      }
    }
    // Media mode: standard preview logic
    const ext = url.split(".").pop().split("?")[0].toLowerCase();
    if (["jpg","jpeg","png","webp","gif","bmp","svg"].includes(ext)) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.style.maxWidth = "64px";
      img.style.maxHeight = "54px";
      img.loading = "lazy";
      img.style.borderRadius = "6px";
      img.style.boxShadow = "0 0 8px #15fafa44";
      return img;
    }
    if (["mp4","webm","mkv","mov","avi","flv","wmv","3gp"].includes(ext)) {
      const vid = document.createElement("video");
      vid.src = url;
      vid.controls = false;
      vid.muted = true;
      vid.style.maxWidth = "64px";
      vid.style.maxHeight = "54px";
      vid.style.borderRadius = "6px";
      vid.style.boxShadow = "0 0 8px #15fafa44";
      vid.preload = "metadata";
      return vid;
    }
    return null;
  }

  function renderMediaTable(links, root) {
    if (!Array.isArray(links) || links.length === 0) {
      root.innerHTML = `<div style="color:var(--text-secondary);padding:1.4em 0 1em 0;">No links found on this page.</div>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:separate;border-spacing:0 0.34em;"><thead>
      <tr style="font-family:var(--font-hud);font-size:1.08em;color:var(--primary-cyan);">
        <th style="text-align:left;padding:0.4em;">Preview</th>
        <th style="text-align:left;padding:0.4em;">File</th>
        <th style="text-align:left;padding:0.4em;">Host</th>
        <th style="text-align:left;padding:0.4em;">Actions</th>
        <th style="text-align:left;padding:0.4em;">Check</th>
      </tr>
    </thead><tbody>`;
    links.forEach((url, idx) => {
      const previewId = "media-preview-" + idx;
      const file = url.split("/").pop().split("?")[0].slice(0,40);
      const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
      html += `<tr data-url="${encodeURIComponent(url)}">
        <td id="${previewId}" style="min-width:72px;max-width:80px;padding:0.3em 0.2em;"></td>
        <td style="max-width:256px;overflow-x:auto;padding:0.2em 0.3em;">${file}</td>
        <td style="color:#15fafa;max-width:140px;overflow-x:auto;padding:0.2em 0.3em;">${host}</td>
        <td style="padding:0.2em 0.3em;">
          <button class="hud-btn" data-idx="${idx}" data-action="copy">Copy</button>
          <button class="hud-btn" data-idx="${idx}" data-action="open">Open</button>
        </td>
        <td id="media-check-${idx}" style="padding:0.2em 0.3em;"></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;
    links.forEach((url, idx) => {
      const prev = createMediaPreview(url);
      const prevTd = document.getElementById("media-preview-"+idx);
      if (prevTd && prev) prevTd.appendChild(prev);
    });
    root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function() {
        const idx = +this.getAttribute("data-idx");
        const action = this.getAttribute("data-action");
        const url = links[idx];
        if (action === "copy") {
          copyText(url);
          showToast("Copied to clipboard.");
        } else if (action === "open") {
          window.open(url, "_blank", "noopener");
        }
      };
    });
    links.forEach((url, idx) => {
      checkMediaLink(url, function(status, info) {
        const checkTd = document.getElementById("media-check-"+idx);
        if (checkTd) renderCheckResult(status, info, checkTd);
      });
    });
  }

  function copyText(txt) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt);
    } else {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  // === ADVANCED HOSTER LINK CHECKER ===

  // Heuristic map for hosters that don't respond to HEAD/GET (or block CORS)
  const hosterHealthCheckers = {
    "motherless.com": { type: "fetch", method: "HEAD" },
    "bunkr.": { type: "urlfetch", method: "HEAD" }, // match bunkr domains, including .si, .red, .ac, etc.
    "1fichier.com": { type: "fetch", method: "HEAD" },
    "gofile.io": { type: "fetch", method: "HEAD" }
    // More can be added with custom logic as needed
  };

  function getHosterChecker(url) {
    try {
      const host = (new URL(url)).hostname;
      for (let k in hosterHealthCheckers) {
        if (host.includes(k.replace(/\.$/, ""))) return hosterHealthCheckers[k];
      }
    } catch {}
    return null;
  }

  function checkMediaLink(url, cb) {
    const checker = getHosterChecker(url);
    if (checker && checker.type === "urlfetch") {
      // For Bunkr, do "GET" request to file/folder url and infer alive/dead based on redirected location or document content
      // But due to CORS, in browser userscripts: fallback to favicon probe as pseudo-status
      const host = (new URL(url)).hostname;
      // Fallback: try to GET favicon and if loads, consider "alive" (better than always "unknown")
      let favicon = `https://${host}/favicon.ico`;
      fetch(favicon, { method: "GET", mode: "no-cors", cache: "no-store" })
        .then(resp => {
          let status = "unknown";
          if (resp && (resp.status === 200 || resp.type === "opaque")) status = "alive";
          cb(status, "Favicon fetch: " + status);
        })
        .catch(() => cb("unknown", "Favicon unreachable"));
    } else if (checker && checker.type === "fetch") {
      fetch(url, { method: checker.method, mode: "no-cors", cache: "no-store" })
        .then(resp => {
          let status = "unknown", info = "";
          if (resp && resp.status) {
            if (resp.status === 200) status = "alive";
            else if ([403,404,410].includes(resp.status)) status = "dead";
            else status = "unknown";
            info = resp.status + " " + resp.statusText;
          }
          cb(status, info);
        })
        .catch(() => cb("unknown", ""));
    } else {
      // Default (legacy): attempt HEAD then fallback GET (may fail on most hosts, yields "unknown" for strict-CORS)
      fetch(url, { method: "HEAD", mode: "no-cors", cache: "no-store" })
        .then(resp => {
          let status = "unknown", info = "";
          if (resp && resp.status) {
            if (resp.status === 200) status = "alive";
            else if ([403,404,410].includes(resp.status)) status = "dead";
            else status = "unknown";
            info = resp.status + " " + resp.statusText;
          }
          cb(status, info);
        })
        .catch(() => {
          fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" })
            .then(resp => {
              let status = "unknown", info = "";
              if (resp && resp.status) {
                if (resp.status === 200) status = "alive";
                else if ([403,404,410].includes(resp.status)) status = "dead";
                else status = "unknown";
                info = resp.status + " " + resp.statusText;
              }
              cb(status, info);
            })
            .catch(() => { cb("unknown", ""); });
        });
    }
  }

  function renderCheckResult(status, info, td) {
    let chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = status === "alive" ? "Alive" : status === "dead" ? "Dead" : "Unknown";
    if (status === "dead") chip.classList.add("dead");
    if (status === "unknown") chip.classList.add("unknown");
    if (info) chip.title = info;
    td.innerHTML = "";
    td.appendChild(chip);
  }

  function renderCheckPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:1em;">
        <textarea id="hud-bulk-links" placeholder="Paste links to check (one per line, external hosters or direct media)" rows="7" style="width:100%;background:#101827;color:#e0ffff;border-radius:0.7em;border:1.5px solid #15adad;padding:0.8em;font-size:1em;font-family:var(--font-body);resize:vertical;box-shadow:0 0 8px #15fafa22;"></textarea>
      </div>
      <div>
        <button class="hud-btn" id="hud-bulk-check-btn">Check Links</button>
        <span id="hud-bulk-check-status" style="color:var(--text-secondary);margin-left:1em;"></span>
      </div>
      <div id="hud-bulk-table-root" style="margin-top:1em;"></div>
    `;
    root.querySelector("#hud-bulk-check-btn").onclick = function() {
      const input = root.querySelector("#hud-bulk-links").value;
      const urls = input.split(/\s+/).map(x=>x.trim()).filter(Boolean);
      if (urls.length === 0) {
        showToast("No links to check.");
        return;
      }
      renderBulkCheckTable(urls, root.querySelector("#hud-bulk-table-root"));
    };
  }

  function renderBulkCheckTable(urls, root) {
    root.innerHTML = `<div style="color:var(--text-secondary);margin-bottom:0.6em;">Checking ${urls.length} links...</div>`;
    let html = `<table style="width:100%;border-collapse:separate;border-spacing:0 0.34em;"><thead>
      <tr style="font-family:var(--font-hud);font-size:1.08em;color:var(--primary-cyan);">
        <th style="text-align:left;padding:0.4em;">Link</th>
        <th style="text-align:left;padding:0.4em;">Status</th>
      </tr>
    </thead><tbody>`;
    urls.forEach((url, idx) => {
      html += `<tr data-url="${encodeURIComponent(url)}">
        <td style="max-width:440px;overflow-x:auto;padding:0.2em 0.3em;">${url}</td>
        <td id="bulk-check-${idx}" style="padding:0.2em 0.3em;"></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;
    urls.forEach((url, idx) => {
      checkMediaLink(url, function(status, info) {
        const td = document.getElementById("bulk-check-"+idx);
        renderCheckResult(status, info, td);
      });
    });
  }

  // === SETTINGS PANEL, EXPORT/IMPORT, ALLOWLIST DISPLAY ===

  function renderSettingsPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:1.3em;">
        <button class="hud-btn" id="hud-export-btn">Export Current Links</button>
        <button class="hud-btn" id="hud-mode-toggle-btn2">Switch Mode (${extractionMode === "host" ? "Media" : "Host"})</button>
        <button class="hud-btn" id="hud-hostlist-btn">Show Host Patterns</button>
      </div>
      <div style="margin-bottom:1.2em;">
        <textarea id="hud-export-area" rows="8" style="width:100%;background:#101827;color:#e0ffff;border-radius:0.7em;border:1.5px solid #15adad;padding:0.8em;font-size:1em;font-family:var(--font-body);resize:vertical;box-shadow:0 0 8px #15fafa22;" readonly placeholder="Exported links will appear here"></textarea>
      </div>
    `;
    root.querySelector("#hud-export-btn").onclick = function() {
      let links = extractionMode === "host" ? extractExternalHostLinks() : extractMediaLinks();
      root.querySelector("#hud-export-area").value = links.join("\n");
      showToast(`${links.length} links exported.`);
    };
    root.querySelector("#hud-mode-toggle-btn2").onclick = function() {
      if (extractionMode === "host") {
        setExtractionMode("media");
        this.textContent = "Switch Mode (Host)";
      } else {
        setExtractionMode("host");
        this.textContent = "Switch Mode (Media)";
      }
    };
    root.querySelector("#hud-hostlist-btn").onclick = function() {
      showToast("Host patterns loaded below.");
      root.querySelector("#hud-export-area").value = HOSTER_PATTERNS.map(r => r.toString()).join('\n');
    };
  }

  // === DRAGGABLE HUD PANEL, KEYBOARD NAV, ACCESSIBILITY ===
  (() => {
    let drag = { x: 0, y: 0, is: false, el: null };
    document.addEventListener("mousedown", function(e) {
      const hud = document.getElementById("hud-panel-root");
      if (!hud) return;
      if (e.target.classList.contains("hud-header") || e.target.closest(".hud-header")) {
        drag.el = hud;
        drag.x = e.clientX - hud.offsetLeft;
        drag.y = e.clientY - hud.offsetTop;
        drag.is = true;
        document.body.style.userSelect = "none";
      }
    });
    document.addEventListener("mousemove", function(e) {
      if (drag.is && drag.el) {
        drag.el.style.left = (e.clientX - drag.x) + "px";
        drag.el.style.top = (e.clientY - drag.y) + "px";
        drag.el.style.right = "auto";
        drag.el.style.bottom = "auto";
        drag.el.style.position = "fixed";
      }
    });
    document.addEventListener("mouseup", function() {
      drag.is = false;
      document.body.style.userSelect = "";
    });
  })();

  document.addEventListener("keydown", function(e) {
    const hud = document.getElementById("hud-panel-root");
    if (!hud || hud.hasAttribute("hidden")) return;
    if (e.key === "Escape") hud.setAttribute("hidden", "true");
    if (e.key === "Tab") {
      const focusables = hud.querySelectorAll("button, [tabindex='0'], textarea, input");
      if (!focusables.length) return;
      let idx = Array.from(focusables).indexOf(document.activeElement);
      if (e.shiftKey) idx = idx <= 0 ? focusables.length - 1 : idx - 1;
      else idx = (idx + 1) % focusables.length;
      focusables[idx].focus();
      e.preventDefault();
    }
  });

  // === GM MENU COMMAND: SHOW HUD ===
  GM_registerMenuCommand("Show 4ndr0666 Electric Media HUD", () => showHudPanel());

})(); // End main closure
