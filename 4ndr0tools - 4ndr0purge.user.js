// ==UserScript==
// @name         4ndr0tools - 4ndr0Purge
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.0Ψ-4NDR0666OS
// @description  Universal one-click session reset. Nukes Cookies, Storage, IDB, and SW on ANY site.
// @author       4ndr0666
// @match        *://*/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
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
