// ==UserScript==
// @name         4ndr0tools - Confirmation bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @description  Part of my 4ndr0tools suite of utilites for "quality-of-life".
//               Silently accepts the “warning: you are leaving this site”
//               warning page and always opens true external links in a new tab.
// @version      2.0.0
// @license      MIT
//
// ---------- WRITE DOMAIN HERE ----------
// For security **only** run this on a specific URL:
// @match        https://forums.socialmediagirls.com/goto/link-confirmation*
// -----------------------------------
//
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
