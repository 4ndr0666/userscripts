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

  // Ultimate bulletproof file detector (works on every GitHub layout ever made)
  const getAllFileLinks = () => {
    const selectors = [
      'a.js-navigation-open[href*="/blob/"]',
      'a[data-testid="listitem-title-link"][href*="/blob/"]',
      'div[role="rowheader"] a[href*="/blob/"]',
      'table tr a[href*="/blob/"]',
      'div.Box-row a[href*="/blob/"]'
    ];

    const set = new Set();
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(a => {
        if (a.href && !a.href.includes('/tree/') && !a.textContent.includes('..')) {
          set.add(a.href);
        }
      });
    });
    return Array.from(set);
  };

  const generateRawUrls = () => {
    const blobUrls = getAllFileLinks();
    if (blobUrls.length === 0) return '';

    return blobUrls
      .map(url => url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('/blob/', '/'))
      .join('\n');
  };

  const injectElectricButton = () => {
    if (document.getElementById('raw-harvest-btn')) return;

    const container = document.querySelector('[data-testid="repository-actions-container"], .file-navigation, .d-flex.flex-justify-between, header .d-flex') || document.body;

    const btn = document.createElement('button');
    btn.id = 'raw-harvest-btn';
    btn.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
        <path d="M9 12h6v2H9zm0 4h6v2H9z"/>
      </svg>
      <span>Copy All Raw URLs</span>
    `;

    btn.onclick = () => {
      const urls = generateRawUrls();
      if (!urls) {
        alert('No files in this folder — or GitHub is being GitHub again.');
        return;
      }
      GM_setClipboard(urls);
      const count = urls.split('\n').length;
      btn.classList.add('copied');
      btn.querySelector('span').textContent = `Copied ${count} URLs!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('span').textContent = 'Copy All Raw URLs';
      }, 3000);
    };

    container.appendChild(btn);
  };

  // Deploy on all possible load states
  const deploy = () => setTimeout(injectElectric, 600);
  ['DOMContentLoaded', 'load', 'turbo:render', 'pjax:end'].forEach(ev => window.addEventListener(ev, deploy));
  new MutationObserver(deploy).observe(document, {childList: true, subtree: true});
  deploy();
})();
