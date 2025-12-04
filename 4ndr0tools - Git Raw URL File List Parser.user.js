// ==UserScript==
// @name         4ndr0tools - Git Raw URL File List Parser 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.0.0
// @description  Adds a "Copy All Raw URLs" button on any GitHub repo/tree view. Copies a clean, delimited list of raw.githubusercontent.com URLs (one per line) directly to clipboard.
// @author       4ndr0666
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Git%20Raw%20URL%20File%20List%20Parser.user.js
// @updateURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Git%20Raw%20URL%20File%20List%20Parser.user.js
// @match        https://github.com/*/*
// @exclude      https://github.com/*/*/issues*
// @exclude      https://github.com/*/*/pull*
// @exclude      https://github.com/*/*/blob/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  // Inject Google Fonts + Full HUD Theme
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&display=swap');

    :root {
      --bg-dark: #0A131A;
      --accent-cyan: #00E5FF;
      --text-cyan-active: #67E8F9;
      --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
      --accent-cyan-bg-active: rgba(0, 229, 255, 0.2);
      --accent-cyan-glow-active: rgba(0, 229, 255, 0.4);
      --text-primary: #EAEAEA;
      --text-secondary: #9E9E9E;
      --font-body: 'Roboto Mono', monospace;
    }

    #raw-harvest-btn {
      display: inline-flex !important;
      align-items: center !important;
      padding: 0.65rem 1.4rem !important;
      margin-left: 16px !important;
      border: 1px solid transparent !important;
      font-family: var(--font-body) !important;
      font-weight: 500 !important;
      font-size: 0.875rem !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
      color: var(--text-secondary) !important;
      background-color: rgba(0, 0, 0, 0.4) !important;
      backdrop-filter: blur(10px) !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      transition: all 300ms cubic-bezier(0.23, 1, 0.32, 1) !important;
      position: relative !important;
      overflow: hidden !important;
      z-index: 9999 !important;
    }

    #raw-harvest-btn .icon {
      width: 1.25rem;
      height: 1.25rem;
      margin-right: 0.6rem;
      transition: all 300ms ease;
    }

    #raw-harvest-btn:hover {
      color: var(--accent-cyan) !important;
      border-color: var(--accent-cyan-border-hover) !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 229, 255, 0.3) !important;
    }

    #raw-harvest-btn.active,
    #raw-harvest-btn.copied {
      color: var(--text-cyan-active) !important;
      background-color: var(--accent-cyan-bg-active) !important;
      border-color: var(--accent-cyan) !important;
      box-shadow: 
        0 0 20px var(--accent-cyan-glow-active),
        inset 0 0 20px rgba(0, 229, 255, 0.1) !important;
      animation: pulseGlow 2s infinite alternate;
    }

    @keyframes pulseGlow {
      from { box-shadow: 0 0 20px var(--accent-cyan-glow-active), inset 0 0 20px rgba(0,229,255,0.1); }
      to   { box-shadow: 0 0 35px var(--accent-cyan-glow-active), inset 0 0 30px rgba(0,229,255,0.2); }
    }

    #raw-harvest-btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0,229,255,0.15), transparent);
      transition: 0.7s;
    }

    #raw-harvest-btn:hover::before {
      left: 100%;
    }
  `);

  // Ultimate file row detector – covers ALL current & future GitHub layouts
  const getFileRows = () => {
    const selectors = [
      'tr.js-navigation-item',
      'tr[role="row"]',
      'div[role="row"].ReactVirtualized__List div[role="row"]',
      'div[data-testid="listitem"]',
      'div.Box-row',
      'a.js-navigation-open',
      'div[role="rowheader"] a'
    ];

    const links = new Set();

    // Method 1: Direct <a> with title/href (most reliable)
    document.querySelectorAll('a.js-navigation-open, a[data-testid="listitem-title-link"], div[role="rowheader"] a').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.includes('/tree/') && !href.endsWith('/..')) {
        links.add(a);
      }
    });

    // Method 2: Fallback via parent rows
    document.querySelectorAll('tr, div[role="row"], div.Box-row').forEach(row => {
      const link = row.querySelector('a');
      if (link && link.getAttribute('href')?.match(/\/blob\//)) {
        links.add(link);
      }
    });

    return Array.from(links);
  };

  const generateRawUrls = () => {
    const links = getFileRows();
    if (links.length === 0) return '';

    const rawUrls = links.map(link => {
      return link.href.replace('https://github.com/', 'https://raw.githubusercontent.com/githubusercontent.com/').replace('/blob/', '/');
    });

    return rawUrls.join('\n');
  };

  const injectButton = () => {
    if (document.getElementById('raw-harvest-btn')) return;

    // Find the top bar (works on old + new + future layout)
    const targets = [
      '.file-navigation',
      '[data-testid="repository-actions-container"]',
      '.d-flex.flex-justify-between.flex-items-center',
      '.Layout-sidebar + .Layout-main .d-flex',
      'header div.d-flex'
    ];

    let container = null;
    for (const sel of targets) {
      container = document.querySelector(sel);
      if (container) break;
    }
    if (!container) container = document.body;

    const btn = document.createElement('button');
    btn.id = 'raw-harvest-btn';
    btn.innerHTML = 'Copy All Raw URLs';
    btn.onclick = () => {
      const urls = generateRawUrls();
      if (!urls) {
        alert('Still no files? You might be on a directory landing page with zero files.\n\nTry going into a folder that actually has files.');
        return;
      }
      GM_setClipboard(urls);
      const count = urls.split('\n').length;
      btn.innerHTML = `Copied ${count} URLs!`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = 'Copy All Raw URLs';
        btn.classList.remove('copied');
      }, 3000);
    };

    container.appendChild(btn);
  };

  // Hammer it until it works
  const tryInject = () => {
    if (document.readyState === 'loading') return;
    injectButton();
  };

  // Multiple injection strategies
  setTimeout(tryInject, 500);
  setTimeout(tryInject, 1500);
  setTimeout(tryInject, 3000);
  setTimeout(tryInject, 6000);

  new MutationObserver(tryInject).observe(document, { childList: true, subtree: true });
  window.addEventListener('load', () => setTimeout(tryInject, 1000));
  window.addEventListener('popstate', () => setTimeout(tryInject, 1000));
})();
