// ==UserScript==
// @name         4ndr0tools - Yandex Image Search++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      0.2.0
// @description  Yandex reverse-image fullscreen preview, slideshow and on-screen status.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-YandexImageSearch++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-YandexImageSearch++.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        http*://*yandex.com/images/*
// @match        http*://*yandex.ru/images/*
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /** ◾ Configuration */
  const CONFIG = {
    css: `
      .MMImageContainer, .MMImage-Preview {
        width: 100% !important;
        height: 100% !important;
        background: black !important;
        margin: 0; padding: 0;
      }
      #slideshow-indicator {
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0,0,0,0.6);
        color: #15FFFF;
        font-size: 18px;
        padding: 4px 8px;
        border-radius: 4px;
        z-index: 99999;
        pointer-events: none;
        font-family: sans-serif;
      }
    `,
    toggleKey: 'ArrowDown',       // key to start/stop
    intervalMs: 1500,             // slideshow delay
    nextButtonSelector: '.CircleButton_type_next',
    maxWaitForButton: 5000        // ms before giving up
  };

  /** ◾ Inject CSS into <head> */
  const style = document.createElement('style');
  style.textContent = CONFIG.css;
  document.head.appendChild(style);

  /** ◾ Slideshow State */
  let playing = false;
  let slideTimer = null;

  /** ◾ On-screen status badge */
  const badge = document.createElement('div');
  badge.id = 'slideshow-indicator';
  badge.textContent = '';
  document.body.appendChild(badge);

  /** ◾ Safely click the “next” button if it exists */
  function clickNext() {
    const btn = document.querySelector(CONFIG.nextButtonSelector);
    if (btn) btn.click();
  }

  /** ◾ Update on-screen badge */
  function updateBadge() {
    badge.textContent = playing ? '▶ Slideshow' : '';
  }

  /** ◾ Toggle slideshow on/off */
  function toggleSlideshow() {
    playing = !playing;
    if (playing) {
      clickNext(); // advance immediately
      slideTimer = setInterval(clickNext, CONFIG.intervalMs);
    } else {
      clearInterval(slideTimer);
      slideTimer = null;
    }
    updateBadge();
  }

  /** ◾ Keydown handler (won’t clobber others) */
  window.addEventListener('keydown', e => {
    if (e.key === CONFIG.toggleKey && !e.repeat) {
      toggleSlideshow();
    }
  });

  /** ◾ Wait once for the next-button to appear (optional) */
  const start = Date.now();
  const tryButtonObserver = new MutationObserver(() => {
    if (document.querySelector(CONFIG.nextButtonSelector)) {
      // Found it — stop observing
      tryButtonObserver.disconnect();
    } else if (Date.now() - start > CONFIG.maxWaitForButton) {
      // Give up after timeout
      tryButtonObserver.disconnect();
    }
  });
  tryButtonObserver.observe(document.documentElement, { childList: true, subtree: true });

  // Initial badge state
  updateBadge();
})();
