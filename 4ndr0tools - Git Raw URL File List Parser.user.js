// ==UserScript==
// @name         4ndr0tools - Git Raw URL File List Parser 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.3.37
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
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  GM_addStyle(`
    .raw-list-btn {
      margin-left: 8px !important;
      background: linear-gradient(180deg, #28a745, #218838) !important;
      border-color: #1e7e34 !important;
      color: white !important;
    }
    .raw-list-btn:hover {
      background: linear-gradient(180deg, #218838, #1e7e34) !important;
    }
    .raw-list-success {
      background: #2da44e !important;
      animation: flash 1.5s ease-out;
    }
    @keyframes flash {
      0%   { opacity: 1; }
      50%  { opacity: 0.6; }
      100% { opacity: 1; }
    }
  `);

  const generateRawUrls = () => {
    const rows = document.querySelectorAll('div[role="row"].js-navigation-item');
    const rawUrls = [];

    const base = location.href
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace(/\/$/, '');

    const currentBranch = document.querySelector('summary[title="Switch branches or tags"] span')?.textContent.trim()
      || document.querySelector('#branch-select-menu span.css-truncate-target')?.textContent.trim()
      || 'main';

    for (const row of rows) {
      const link = row.querySelector('a.js-navigation-open');
      if (!link) continue;

      const path = link.getAttribute('title') || link.textContent.trim();
      if (!path || path === '..') continue;

      const icon = row.querySelector('svg[aria-label="Directory"]') || row.querySelector('svg[aria-label="File"]');
      const isDir = icon?.getAttribute('aria-label') === 'Directory';

      // Full path from repo root
      const relativePath = link.getAttribute('href').split('/').slice(3).join('/');
      const rawUrl = `https://raw.githubusercontent.com${link.getAttribute('href').replace('/blob/', '/')}`;

      rawUrls.push(rawUrl);
    }

    return rawUrls.join('\n');
  };

  const copyToClipboard = (text) => {
    if (typeof GM_setClipboard === 'function') {
      GM_setClipboard(text);
    } else {
      navigator.clipboard.writeText(text).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      });
    }
  };

  const createButton = () => {
    if (document.getElementById('raw-list-btn')) return;

    const container = document.querySelector('.file-navigation') || document.querySelector('.d-flex.flex-items-center');
    if (!container) return;

    const btn = document.createElement('button');
    btn.id = 'raw-list-btn';
    btn.className = 'btn btn-sm raw-list-btn';
    btn.innerHTML = `Copy All Raw URLs`;
    btn.type = 'button';

    btn.onclick = () => {
      const urls = generateRawUrls();
      if (!urls) {
        alert('No files found in current directory.');
        return;
      }

      copyToClipboard(urls);
      btn.textContent = 'Copied!';
      btn.classList.add('raw-list-success');

      setTimeout(() => {
        btn.innerHTML = `Copy All Raw URLs`;
        btn.classList.remove('raw-list-success');
      }, 2000);
    };

    // Insert after "Code" button or similar
    const insertAfter = container.querySelector('get-repo') || container.querySelector('.BtnGroup');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(btn, insertAfter.nextSibling);
    } else {
      container.appendChild(btn);
    }
  };

  // Initial run
  setTimeout(createButton, 1000);

  // Observe dynamic navigation (pjax, turbo, etc.)
  const observer = new MutationObserver((mutations) => {
    if (!document.getElementById('raw-list-btn')) {
      setTimeout(createButton, 800);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Re-inject on full page loads (fallback
  window.addEventListener('popstate', () => setTimeout(createButton, 1000));
})();
