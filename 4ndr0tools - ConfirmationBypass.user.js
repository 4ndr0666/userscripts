// ==UserScript==
// @name         4ndr0tools - Confirmation bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @description  Part of 4ndr0tools: Silently accepts the “warning: you are leaving this site” warning page and always opens true external links in a new tab.
// @version      2.0.0
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ConfirmationBypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ConfirmationBypass.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
//
// ------ WARNING: ONLY use a specific url --------------
// @match        https://forums.socialmediagirls.com/goto/link-confirmation*
// ------ WARNING ------------------------------------
//
// @license      MIT
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /* ------------------------------------------------------------------
     1.  Click the “OK / Continue” button as soon as it exists.
     ------------------------------------------------------------------ */
  const BTN_SELECTOR = '.button--cta, .button--cta .button-text';

  /** try to click; return true if successful */
  const clickConfirm = () => {
    const btn = document.querySelector(BTN_SELECTOR);
    if (btn) {
      btn.dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true })
      );
      return true;
    }
    return false;
  };

  // First quick attempt (page may already be ready)
  if (!clickConfirm()) {
    /* Fallback: monitor the DOM until the button appears, then click */
    const mo = new MutationObserver(() => {
      if (clickConfirm()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------
     2.  On the *origin* forum pages, force external links to open safely
     ------------------------------------------------------------------ */
  const ownOrigin = 'https://forum.example.com'; // change to forum origin

  document.body.addEventListener(
    'click',
    (ev) => {
      const a = ev.target.closest('a[href]');
      if (!a) return;

      // Skip internal links
      const dest = new URL(a.href, location.href);
      if (dest.origin === ownOrigin) return;

      // Ensure safety: new tab + noopener/noreferrer
      a.target = '_blank';
      a.rel = `${a.rel || ''} noopener noreferrer`.trim();
    },
    true /* capture – fires before site JS */
  );
})();
