// ==UserScript==
// @name         4ndr0tools - Git Raw URL File List Parser 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      2.0.0
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
      margin-left: 12px !important;
      background: linear-gradient(135deg, #ff006e, #8338ec) !important;
      border: none !important;
      color: white !important;
      font-weight: bold !important;
      padding: 6px 12px !important;
      border-radius: 6px !important;
      cursor: pointer;
    }
    #raw-harvest-btn:hover { opacity: 0.9; }
    #raw-harvest-btn.copied {
      background: #00ff9d !important;
      animation: pulse 1.5s;
    }
    @keyframes pulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `);

  const waitFor = (selector, timeout = 10000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el) resolve(el);
      else if (Date.now() - start > timeout) reject(new Error('Timeout waiting for ' + selector));
      else requestAnimationFrame(check);
    };
    check();
  });

  const getAllFileRows = () => {
    // New 2024-2025 GitHub layout uses <tr[role="row"]inside tbody
    return [...document.querySelectorAll('table[aria-labelledby] tr[js-navigation-item], div[role="row"][data-href]')];
  };

  const generateRawUrls = async () => {
    const rows = getAllFileRows();
    if (rows.length === 0) return '';

    const rawUrls = [];

    // Extract repo + branch once
    const pathParts = location.pathname.split('/').filter(Boolean);
    const user = pathParts[0];
    const repo = pathParts[1];
    let branch = pathParts[3] === 'tree' ? pathParts[4] : pathParts[3] || 'main';

    // Fallback: read visible branch name
    const branchEl = document.querySelector('[data-testid="branch-select-menu"] span, summary[aria-label*="branch"] span, #branch-select-menu .css-truncate-target');
    if (branchEl) branch = branchEl.textContent.trim();

    const baseRaw = `https://raw.githubusercontent.com/${user}/${repo}/${branch}`;

    for (const row of rows) {
      let link = row.querySelector('a[data-testid="listitem-title-link"], a.js-navigation-open, div[role="rowheader"] a');
      if (!link) continue;

      let href = link.getAttribute('href');
      if (!href) continue;

      // Skip parent directory
      if (link.title === '..' || link.textContent.trim() === '..') continue;

      // If it's a directory → /tree/, skip (we only want files)
      const isDir = !!row.querySelector('svg.octicon-directory, svg[aria-label="Directory"]');
      if (isDir) continue;

      // Build raw URL
      const rawUrl = href.replace(`/blob/`, `/`).replace(`https://github.com/`, `https://raw.githubusercontent.com/`);
      rawUrls.push(rawUrl);
    }

    return rawUrls.join('\n');
  };

  const createButton = async () => {
    if (document.getElementById('raw-harvest-btn')) return;

    try {
      // Wait for the top bar where "Code", "Issues", etc. live
      const header = await waitFor('.file-navigation, [data-testid="repository-actions-container"], .Layout-sidebar + .Layout-main .d-flex.flex-items-center');
      
      const btn = document.createElement('button');
      btn.id = 'raw-harvest-btn';
      btn.innerHTML = 'Copy All Raw URLs';
      btn.title = 'Copies raw.githubusercontent.com links for every file in this folder';

      btn.onclick = async () => {
        const urls = await generateRawUrls();
        if (!urls) {
          alert('No files detected. Are you on a human or a CAPTCHA?');
          return;
        }

        GM_setClipboard(urls);
        btn.innerHTML = 'Copied ' + urls.split('\n').length + ' URLs!';
        btn.classList.add('copied');

        setTimeout(() => {
          btn.innerHTML = 'Copy All Raw URLs';
          btn.classList.remove('copied');
        }, 3000);
      };

      header.appendChild(btn);
    } catch (e) {
      console.error('[4ndr0tools] Button injection failed:', e);
    }
  };

  // Run on load + every navigation
  const init = () => setTimeout(createButton, 800);
  init();

  // Turbo / pjax / React navigation
  new MutationObserver(init).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('popstate', init);
})();
