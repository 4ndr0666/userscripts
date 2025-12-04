// ==UserScript==
// @name         4ndr0tools - Git Raw URL File List Parser 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.0
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

  GM_addStyle(`
    #raw-harvest-btn {
      position: relative;
      background: linear-gradient(45deg, #ff006e, #fb5607, #ffbe0b, #8338ec) !important;
      background-size: 300% 300% !important;
      animation: ;
      animation: gradient 6s ease infinite, glow 2s ease-in-out infinite alternate;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 8px !important;
      font-weight: bold !important;
      box-shadow: 0 0 20px rgba(255,0,110,0.6);
      z-index: 9999;
    }
    @keyframes gradient { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes glow { from {box-shadow: 0 0 20px rgba(255,0,110,0.6);} to {box-shadow: 0 0 30px rgba(131,56,236,0.9);} }
    #raw-harvest-btn.copied { background: #00ff9d !important; animation: none; box-shadow: 0 0 30px #00ff9d; }
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
