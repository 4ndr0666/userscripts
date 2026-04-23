// ==UserScript==
// @name         4ndr0tools - 4ndr0Purge
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @author       4ndr0666
// @description  Universal one-click session reset. Nukes Cookies, Storage, IDB, and SW on ANY site.
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         data:image/png;base64,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
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
      §0  Core Configuration & Global Stealth
     ═══════════════════════════════════════════════════════════ */
  const RESET_ON = GM_getValue('mod_reset', true);

  GM_registerMenuCommand(
    `${RESET_ON ? '✅' : '❌'} Universal Purge`,
    () => {
      GM_setValue('mod_reset', !RESET_ON);
      location.reload();
    }
  );

  if (!RESET_ON) return;

  // Global Stealth: Spoof WebDriver before any site scripts load
  try {
    Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true });
  } catch (e) {
    console.error("[Ψ] Stealth Hook Failed");
  }

  /* ═══════════════════════════════════════════════════════════
      §1  Shared Utilities
     ═══════════════════════════════════════════════════════════ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const onReady = fn => document.body ? fn() : document.addEventListener('DOMContentLoaded', fn, { once: true });

  /* ═══════════════════════════════════════════════════════════
      §2  The Purge Engine (Universal Implementation)
     ═══════════════════════════════════════════════════════════ */
  function getDomains() {
    const h = location.hostname;
    const parts = h.split('.').filter(Boolean);
    const ds = new Set(['', h, '.' + h]);
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts.slice(i).join('.');
      if (p.split('.').length < 2) continue;
      ds.add(p);
      ds.add('.' + p);
    }
    return [...ds];
  }

  function getPaths() {
    const parts = location.pathname.split('/').filter(Boolean);
    const ps = new Set(['/']);
    let cur = '';
    for (const part of parts) {
      cur += '/' + part;
      ps.add(cur);
    }
    return [...ps];
  }

  function nukeCookie(name) {
    const exp = '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    const paths = getPaths();
    const domains = getDomains();
    for (const p of paths) {
      for (const d of domains) {
        const base = `${name}${exp};path=${p}${d ? ';domain=' + d : ''}`;
        document.cookie = base;
        document.cookie = base + ';Secure';
        document.cookie = base + ';SameSite=None;Secure';
        document.cookie = base + ';SameSite=Lax';
        document.cookie = base + ';SameSite=Strict';
      }
    }
  }

  async function clearIDB() {
    if (typeof indexedDB?.databases !== 'function') return;
    try {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map(db => new Promise(res => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = req.onerror = req.onblocked = res;
      })));
    } catch (e) { console.warn("[Ψ] IDB Wipe Interrupted"); }
  }

  async function clearCaches() {
    if (!('caches' in self)) return;
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) { console.warn("[Ψ] Cache Wipe Interrupted"); }
  }

  async function unregSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    } catch (e) { console.warn("[Ψ] SW Unreg Interrupted"); }
  }

  /* ═══════════════════════════════════════════════════════════
      §3  3LECTRIC GLASS UI (Design Spec 1.5.0-Ψ)
     ═══════════════════════════════════════════════════════════ */
  GM_addStyle(`
    :root {
      --bg-dark-base: #050A0F;
      --bg-glass-panel: rgba(10, 19, 26, 0.75);
      --accent-cyan: #00E5FF;
      --text-cyan-active: #67E8F9;
      --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
      --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
      --glow-cyan-active: rgba(0, 229, 255, 0.4);
      --text-primary: #EAEAEA;
      --font-body: 'Roboto Mono', monospace;
    }

    #omni-purge-dock {
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

    #omni-purge-dock:hover {
      transform: translateX(0);
    }

    .purge-btn {
      display: flex; align-items: center; white-space: nowrap;
      background: transparent; border: none; color: var(--text-primary);
      padding: 12px 20px 12px 10px; font: 500 13px var(--font-body);
      text-transform: uppercase; letter-spacing: 0.05em;
      cursor: pointer; transition: all 300ms ease-in-out;
    }

    .purge-icon {
      width: 24px; height: 24px;
      color: var(--accent-cyan);
      margin-right: 8px; flex-shrink: 0;
      transition: filter 300ms, color 300ms;
    }

    .purge-btn:hover {
      color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.05);
    }

    .purge-btn:hover .purge-icon {
      filter: drop-shadow(0 0 8px var(--glow-cyan-active));
    }

    .purge-btn:active {
      background: rgba(0, 229, 255, 0.2);
      box-shadow: inset 0 0 10px var(--glow-cyan-active);
    }

    #purge-status-float {
      position: fixed; bottom: 85px; right: 24px; z-index: 2147483646;
      width: 280px; max-height: 200px; overflow-y: auto;
      background: var(--bg-glass-panel); border-radius: 6px;
      border: 1px solid var(--accent-cyan-border-idle);
      backdrop-filter: blur(12px); padding: 12px;
      color: var(--text-cyan-active); font: 11px var(--font-body);
      display: none; box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }

    .log-entry { margin-bottom: 4px; border-left: 2px solid var(--accent-cyan); padding-left: 8px; opacity: 0; animation: fadeIn 0.3s forwards; }
    @keyframes fadeIn { to { opacity: 1; } }
  `);

  /* ═══════════════════════════════════════════════════════════
      §4  Orchestration
     ═══════════════════════════════════════════════════════════ */
  const runPurge = async () => {
    const statusBox = $('#purge-status-float');
    const log = (msg) => {
      const e = document.createElement('div');
      e.className = 'log-entry';
      e.textContent = `[Ψ] ${msg}`;
      statusBox.appendChild(e);
      statusBox.scrollTop = statusBox.scrollHeight;
    };

    statusBox.style.display = 'block';
    log("INITIALIZING SCORCHED EARTH...");

    // Clear Storage
    localStorage.clear();
    sessionStorage.clear();
    log("LOCALSTORAGE/SESSION: NULLIFIED");

    // Clear Cookies
    const cookies = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);
    cookies.forEach(nukeCookie);
    log(`COOKIES: ${cookies.length} PURGED`);

    // Clear Heavy Artifacts
    await Promise.allSettled([clearIDB(), clearCaches(), unregSW()]);
    log("IDB/CACHE/SW: TERMINATED");

    log("REBOOTING SYSTEM...");
    await sleep(1000);
    location.reload();
  };

  onReady(() => {
    const dock = document.createElement('div');
    dock.id = 'omni-purge-dock';

    const btn = document.createElement('button');
    btn.className = 'purge-btn';

    // Self-contained inline SVG Glyph
    const svgGlyph = `
      <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="purge-icon" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
        <path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
        <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
        <text x="64" y="68" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="serif">Ψ</text>
      </svg>
    `;

    btn.innerHTML = `${svgGlyph}<span class="purge-text">4ndr0Purge</span>`;
    btn.onclick = runPurge;

    const float = document.createElement('div');
    float.id = 'purge-status-float';

    dock.appendChild(btn);
    document.body.appendChild(dock);
    document.body.appendChild(float);
  });

})();
