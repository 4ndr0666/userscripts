// ==UserScript==
// @name         4ndr0tools - Git Raw URL File List Parser 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.0.0
// @description  Adds a "Copy All Raw URLs" button on any GitHub repo/tree view. Copies a clean, delimited list of raw.githubusercontent.com URLs (one per line) directly to clipboard.
// @author       4ndr0666
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Git%20Raw%20URL%20File%20List%20Parser.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Git%20Raw%20URL%20File%20List%20Parser.user.js
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

GM_addStyle(`
  #raw-harvest-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 6px 14px !important;
    font-family: var(--font-body, 'Roboto Mono', monospace);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    color: var(--accent-cyan, #00E5FF) !important;
    background: rgba(0, 0, 0, 0.35) !important;

    border: 2px solid var(--accent-cyan, #00E5FF) !important;
    border-radius: 2px !important;

    /* MUCH STRONGER CYAN GLOW */
    box-shadow:
      0 0 12px rgba(0, 229, 255, 0.7),
      0 0 22px rgba(0, 229, 255, 0.45),
      inset 0 0 6px rgba(0, 229, 255, 0.25);

    clip-path: polygon(
      0% 0%, calc(100% - 10px) 0%, 100% 10px,
      100% 100%, 0% 100%
    );

    cursor: pointer;
    transition: 200ms ease all;
    z-index: 9999;
  }

  #raw-harvest-btn::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(transparent 95%, rgba(0, 229, 255, 0.15) 100%),
      linear-gradient(90deg, transparent 95%, rgba(0, 229, 255, 0.10) 100%);
    background-size: 100% 6px, 6px 100%;
    pointer-events: none;
  }

  #raw-harvest-btn:hover {
    color: var(--text-cyan-active, #67E8F9) !important;
    border-color: var(--text-cyan-active, #67E8F9) !important;
    box-shadow:
      0 0 15px rgba(0, 229, 255, 0.9),
      0 0 30px rgba(0, 229, 255, 0.55),
      inset 0 0 8px rgba(0, 229, 255, 0.35);
  }

  #raw-harvest-btn:active {
    transform: scale(0.97);
    box-shadow:
      0 0 8px rgba(0, 229, 255, 0.45),
      0 0 18px rgba(0, 229, 255, 0.35),
      inset 0 0 5px rgba(0, 229, 255, 0.25);
  }

  #raw-harvest-btn.copied {
    background: rgba(0, 255, 157, 0.15) !important;
    border-color: #00ff9d !important;
    color: #00ff9d !important;
    box-shadow: 0 0 12px #00ff9d, 0 0 24px #00ff9d !important;
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
