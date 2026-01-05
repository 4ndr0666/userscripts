// ==UserScript==
// @name         4ndr0tools - Confirmation bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @description  Unfucks the "Are you sure?" bullshit when opening links.
// @version      2.1.0
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ConfirmationBypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ConfirmationBypass.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
//
// ------ WARNING: ONLY use a specific url --------------
// @match        https://forums.socialmediagirls.com/*
// @match        https://forums.socialmediagirls.com/goto/link-confirmation*
// ------ WARNING ------------------------------------
//
// @license      MIT
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // =================================================================================
  // SCRIPT ROUTER
  // Determines which functionality to run based on the current page URL.
  // =================================================================================

  const currentUrl = window.location.href;

  if (currentUrl.includes('/goto/link-confirmation')) {
    // We are on the confirmation page, so we run the bypass logic.
    initializeConfirmationBypass();
  } else {
    // We are on a regular forum page, so we set up the external link handler.
    initializeExternalLinkSafety();
  }

  // =================================================================================
  // 1. CONFIRMATION PAGE BYPASS LOGIC
  // Clicks the “OK / Continue” button as soon as it appears in the DOM.
  // =================================================================================

  /**
   * Sets up the logic to find and click the confirmation button.
   */
  function initializeConfirmationBypass() {
    const CONFIRM_BUTTON_SELECTOR = '.button--cta, .button--cta .button-text';

    /**
     * Attempts to find and click the confirmation button.
     * @returns {boolean} - True if the button was found and clicked, otherwise false.
     */
    const clickConfirmButton = () => {
      const buttonElement = document.querySelector(CONFIRM_BUTTON_SELECTOR);
      if (buttonElement) {
        // Dispatch a synthetic mouse event, which is more reliable than .click()
        // for elements with complex event listeners.
        buttonElement.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true })
        );
        return true;
      }
      return false;
    };

    // Attempt an immediate click in case the page is already fully loaded.
    if (!clickConfirmButton()) {
      // If the button isn't ready, observe the DOM for changes.
      // This is a robust fallback for pages that load content dynamically.
      const observer = new MutationObserver(() => {
        if (clickConfirmButton()) {
          // Once the button is clicked, we no longer need to observe.
          observer.disconnect();
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }

  // =================================================================================
  // 2. EXTERNAL LINK SAFETY LOGIC
  // On origin forum pages, intercepts clicks on external links to ensure they
  // open safely in a new tab.
  // =================================================================================

  /**
   * Sets up a global click listener to handle external links securely.
   */
  function initializeExternalLinkSafety() {
    // Use location.origin to dynamically and correctly identify the host site.
    // This removes the need for a hardcoded, potentially incorrect placeholder.
    const internalOrigin = location.origin;

    /**
     * Handles click events to secure external links.
     * @param {MouseEvent} event - The click event.
     */
    const secureExternalLink = (event) => {
      // Use .closest() to find the nearest parent anchor tag from the click target.
      const anchorTag = event.target.closest('a[href]');
      if (!anchorTag) {
        return; // The click was not on or within a link.
      }

      try {
        // Resolve the link's href relative to the current page's location.
        const destinationUrl = new URL(anchorTag.href, location.href);

        // If the link's origin is the same as the current site, do nothing.
        if (destinationUrl.origin === internalOrigin) {
          return;
        }

        // For all external links, enforce security best practices.
        anchorTag.target = '_blank'; // Always open in a new tab.

        // Robustly add 'noopener' and 'noreferrer' to the rel attribute.
        // Using a Set prevents duplicates if the attributes are already present.
        const relValues = new Set(anchorTag.rel ? anchorTag.rel.split(/\s+/) : []);
        relValues.add('noopener');
        relValues.add('noreferrer');
        anchorTag.rel = Array.from(relValues).join(' ');

      } catch (error) {
        // Add robust error handling in case of an invalid `href` attribute.
        console.error('4ndr0tools-ConfirmationBypass: Failed to process link.', {
          href: anchorTag.href,
          error: error,
        });
      }
    };

    // Add the event listener to the document body in the capture phase.
    // The capture phase (true) ensures this script runs *before* the site's
    // own JavaScript, preventing potential conflicts or overrides.
    document.body.addEventListener('click', secureExternalLink, true);
  }
})();
