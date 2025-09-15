// ==UserScript==
// @name        4ndr0tools - Ytdlc:// Protocol
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.1
// @description Personal `ytdl://`-style protocol trigger for using yt-dlp with cookies.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-YtdlcProtocol.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-YtdlcProtocol.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.youtube.*/*
// @match       *://*.youtu.be/*
// @license     MIT
// @grant       none
// @run-at      document-end
// ==/UserScript==

(() => {
  'use strict';

  /* ──── CONSTANTS ─────────────────────────────────────────────── */
  const BTN_ID   = 'ytdlc-floating-btn';
  const Z        = 2_147_483_646;               // keep it on top
  const DEF_KEY  = 'KeyP';                      // Alt+P launcher
  /* ────────────────────────────────────────────────────────────── */

  // don’t double-inject
  if (document.getElementById(BTN_ID)) return;

  /* ──── Badge Creation ─────────────────────────────────────────── */
  const btn = Object.assign(document.createElement('div'), {
    id: BTN_ID,
    textContent: 'Ytdlc:// ⇩',
    style: `
      position:fixed; top:12px; right:12px;
      background:rgba(0,0,0,.8); color:#15FFFF;
      padding:6px 10px; font:14px/14px sans-serif;
      border-radius:4px; cursor:grab; user-select:none;
      box-shadow:0 0 5px #0008; z-index:${Z};
    `,
  });
  document.documentElement.appendChild(btn);

	/* -----------------------------------------------
	     Move badge into masthead (shadow-DOM aware)
	------------------------------------------------- */
  (function () {

    /** Reset floating styles so the badge behaves like a normal toolbar item */
    const dockStyle = () => Object.assign(btn.style, {
      position:   'relative',
      top:        'auto',
      left:       'auto',
      right:      'auto',
      margin:     '0 8px 0 0',          // gap before the search box
      zIndex:     'auto',
      boxShadow:  'none',
      cursor:     'pointer'
    });

    function tryDock () {
      const masthead = document.querySelector('ytd-masthead');
      if (!masthead || !masthead.shadowRoot) return false;

      /** Inside the masthead’s shadow-root: #center → ytd-searchbox */
      const center    = masthead.shadowRoot.querySelector('#center');
      const searchBox = center?.querySelector('ytd-searchbox');

      if (!center || !searchBox) return false;       // still loading

      dockStyle();
      center.insertBefore(btn, searchBox);           // badge → [badge][search box]
      return true;
    }

    /* attempt immediately … */
    if (tryDock()) return;

    /* … otherwise observe until Polymer has finished rendering */
    new MutationObserver((_, obs) => {
      if (tryDock()) obs.disconnect();
    }).observe(document.body, { childList: true, subtree: true });

  })();

  /* ──── Dragging Logic ────────────────────────────────────────── */
  let dragging = false, offsetX = 0, offsetY = 0;
  btn.addEventListener('mousedown', e => {
    dragging = true;
    btn.style.cursor = 'grabbing';
    offsetX = e.clientX - btn.offsetLeft;
    offsetY = e.clientY - btn.offsetTop;
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    btn.style.left  = (e.clientX - offsetX) + 'px';
    btn.style.top   = (e.clientY - offsetY) + 'px';
    btn.style.right = 'auto';
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    btn.style.cursor = 'grab';
  });

  /* ──── Hot-key Handler ────────────────────────────────────────── */
  const hotKey = localStorage.getItem('ytdlcHotkey') || DEF_KEY;
  window.addEventListener('keydown', e => {
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === hotKey) {
      e.preventDefault();
      launch();
    }
  });

  /* ──── Click / Context / Dbl-click ───────────────────────────── */
  btn.addEventListener('click',      () => launch() );
  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    const manual = prompt('YTDLC – manual URL (blank to cancel):', location.href);
    if (manual) launch(manual.trim());
  });
  btn.addEventListener('dblclick',   () => {
    const code = prompt('New hot-key (KeyboardEvent.code, e.g. KeyL for Alt+L):', hotKey);
    if (code) localStorage.setItem('ytdlcHotkey', code.trim());
  });

  /* ──── Core Launcher ──────────────────────────────────────────── */
  function launch(rawUrl) {
    const u = rawUrl || findYouTubeURL();
    if (!u || !/^https?:/.test(u)) {
      alert('❌ Bad or no URL to send');
      return;
    }
    // your one-liner via location.href
    location.href = `ytdl://${encodeURIComponent(u)}`;
  }

  /* ──── URL Finder ─────────────────────────────────────────────── */
  function findYouTubeURL() {
    // if on youtube.com/watch…
    if (/youtube\.com\/watch/.test(location.href)) {
      return location.href;
    }
    // otherwise first <a href="…watch?v=…">
    const a = document.querySelector('a[href*="youtube.com/watch?v="]');
    return a?.href || null;
  }

})();
