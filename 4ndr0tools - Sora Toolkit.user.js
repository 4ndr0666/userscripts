// ==UserScript==
// @name         4ndr0tools - Sora Toolkit
// @namespace    https://github.com/4ndr0666/userscripts
// @description  Sora utils such as single-key hot-keys, batch-downloads, auto-refreshes a stuck job after 20s and more.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Sora%20Toolkit.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Sora%20Toolkit.user.js
// @version      3.5.0
// @author       4ndr0666
// @license      GPL-3.0-only
// @match        *://sora.com/*
// @match        *://sora.chatgpt.com/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        GM_registerMenuCommand
// @grant        GM_download
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

/* global GM_registerMenuCommand, GM_download, GM_openInTab, GM_getValue, GM_setValue */
(function () {
  "use strict";

  /*************************************************************************
   * 1 · Configuration (persistent, JSON-editable)                          *
   *************************************************************************/
  const DEFAULT_CFG = Object.freeze({
    inlineButton:    true,
    filenamePattern: "{title}_{timestamp}_{rand4}.mp4",
    showToast:       true,
    autoFocusNewTab: true,

    /* hot-keys */
    hotkeys: { download: "d", copy: "c", batch: "b" },

    /* NEW — auto-refresh stuck job */
    autoRefresh: { enabled: true, timeout: 20_000 }, // ms
  });

  /* deep-merge user settings */
  const saved             = GM_getValue("cfg") || {};
  const cfgHot            = { ...DEFAULT_CFG.hotkeys, ...(saved.hotkeys || {}) };
  const cfgAR             = { ...DEFAULT_CFG.autoRefresh, ...(saved.autoRefresh || {}) };
  let   CFG               = { ...DEFAULT_CFG, ...saved, hotkeys: cfgHot, autoRefresh: cfgAR };

  const saveCfg = (obj) => { CFG = { ...CFG, ...obj }; GM_setValue("cfg", CFG); toast("Settings saved ✓"); };

  /*************************************************************************
   * 2 · Utilities                                                         *
   *************************************************************************/
  const toast = (msg, ms = 3000) => {
    if (!CFG.showToast) return;
    const el = Object.assign(document.createElement("div"), { textContent: msg });
    el.style.cssText = "position:fixed;bottom:14px;left:50%;transform:translateX(-50%);" +
      "background:#222;color:#fff;padding:8px 12px;border-radius:6px;font:13px/1 sans-serif;" +
      "z-index:10000;box-shadow:0 2px 6px #000a";
    document.body.appendChild(el); setTimeout(() => el.remove(), ms);
  };

  const getVideoURL = (v) => v?.currentSrc || v?.src || null;

  const buildName = (url) => {
    const rand4 = Math.random().toString(36).slice(-4);
    const ts    = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    const raw   = url.split("/").pop()?.split("?")[0] || `sora_${rand4}.mp4`;
    const title = (document.title || "sora").replace(/\s+/g, "_");
    return CFG.filenamePattern
      .replace("{title}",     title)
      .replace("{timestamp}", ts)
      .replace("{rand4}",     rand4)
      .replace("{raw}",       raw);
  };

  const downloadFile = (url) => {
    if (!url) return toast("No downloadable video found.");
    const name = buildName(url);
    if (typeof GM_download === "function") {
      GM_download({ url, name, saveAs: true,
        onload:  () => toast(`Downloading ${name}`),
        onerror: (e) => { console.error(e); GM_openInTab(url, { active: true, insert: true, pinned: false }); } },
      () => {});
    } else GM_openInTab(url, { active: CFG.autoFocusNewTab, insert: true, pinned: false });
  };

  const copyClip = (t) => navigator.clipboard.writeText(t)
      .then(() => toast("Video URL copied ✓"))
      .catch((e) => { console.error(e); toast("Clipboard write failed."); });

  /*************************************************************************
   * 3 · Inline ⬇️ button                                                  *
   *************************************************************************/
  const addCSS = () => {
    if (document.getElementById("soraDlBtnCSS")) return;
    const s = document.createElement("style"); s.id = "soraDlBtnCSS";
    s.textContent = ".sora-dl-btn{position:absolute;top:6px;right:6px;z-index:9999;padding:4px 6px;font:600 11px/1 sans-serif;background:rgba(0,0,0,.7);color:#fff;border:1px solid #fff4;border-radius:4px;cursor:pointer;user-select:none}.sora-dl-btn:hover{background:rgba(0,0,0,.85)}";
    document.head.appendChild(s);
  };

  const addBtn = (v) => {
    if (v.dataset.soraBtn) return;
    const b = Object.assign(document.createElement("button"), { className: "sora-dl-btn", textContent: "⬇️", title: "Download this video" });
    b.onclick = (e) => { e.stopPropagation(); downloadFile(getVideoURL(v)); };
    const p = v.parentElement; if (p && getComputedStyle(p).position === "static") p.style.position = "relative";
    (p || v).appendChild(b); v.dataset.soraBtn = "1";
  };

  const watchVideos = () => {
    addCSS();
    document.querySelectorAll("video").forEach(v => CFG.inlineButton && addBtn(v));
    new MutationObserver(muts => muts.forEach(mu => mu.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.tagName === "VIDEO") { if (CFG.inlineButton) addBtn(n); }
      else n.querySelectorAll?.("video").forEach(v => CFG.inlineButton && addBtn(v));
    }))).observe(document.documentElement, { childList: true, subtree: true });
  };

  /*************************************************************************
   * 4 · Auto-refresh “stuck” job                                          *
   *************************************************************************/
  const SPINNER_SEL   = '.animate-spin, [role="progressbar"], svg[aria-label="Loading"]';
  const SUBMIT_SEL    = 'button[type="submit"], button:has(svg[data-icon="sparkle"]),' +
                        'button:has(svg[aria-label="Generate"]), button:contains("Generate")';
  let   jobTimer      = null;

  const startWatch = () => {
    clearTimeout(jobTimer);
    const deadline = Date.now() + CFG.autoRefresh.timeout;
    jobTimer = setInterval(() => {
      const stillSpinning = document.querySelector(SPINNER_SEL);
      if (!stillSpinning) return clearInterval(jobTimer);
      if (Date.now() >= deadline) {
        clearInterval(jobTimer);
        toast("Job looks stuck — refreshing …");
        location.reload();
      }
    }, 1000);
  };

  const attachJobObserver = () => {
    if (!CFG.autoRefresh.enabled) return;
    document.addEventListener("click", (ev) => {
      if (ev.target.closest(SUBMIT_SEL)) startWatch();
    }, true);
  };

  /*************************************************************************
   * 5 · Commands & hot-keys                                               *
   *************************************************************************/
  const dlCur   = () => downloadFile(getVideoURL(document.querySelector("video")));
  const cpCur   = () => { const u = getVideoURL(document.querySelector("video")); u ? copyClip(u) : toast("No video found."); };
  const batchDl = () => {
    const vids = [...document.querySelectorAll("video")];
    if (!vids.length) return toast("No videos to batch download.");
    vids.forEach((v,i)=>setTimeout(()=>downloadFile(getVideoURL(v)), i*1000));
  };

  const openSettings = () => {
    const js = prompt("Edit config as JSON (cancel to abort):", JSON.stringify(CFG, null, 2));
    if (!js) return;
    try { saveCfg(JSON.parse(js)); } catch { toast("Invalid JSON – settings unchanged."); }
  };

  const menu = () => {
    GM_registerMenuCommand("⬇️ Download current video",    dlCur);
    GM_registerMenuCommand("📋 Copy video URL",            cpCur);
    GM_registerMenuCommand("📥 Batch-download all videos", batchDl);
    GM_registerMenuCommand("⚙️ Settings (JSON)",           openSettings);
  };

  const hotkeys = () =>
    document.addEventListener("keydown", (e) => {
      if (e.target.isContentEditable || ["INPUT","TEXTAREA"].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if      (k === CFG.hotkeys.download) dlCur();
      else if (k === CFG.hotkeys.copy)     cpCur();
      else if (k === CFG.hotkeys.batch)    batchDl();
    });

  /*************************************************************************
   * 6 · Init                                                              *
   *************************************************************************/
  watchVideos();
  attachJobObserver();
  menu();
  hotkeys();
  toast("Sora Video Toolkit 3.5.0 loaded ✓");
})();
