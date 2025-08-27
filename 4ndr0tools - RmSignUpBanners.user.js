// ==UserScript==
// @name         4ndr0tools - RmSignUpBanners
// @namespace    http://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.1
// @description  Part of 4ndr0tools - Remove the Premium Sign Up element on x.com websites
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20RmSignUpBanners.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20RmSignUpBanners.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Attempts to remove the Premium Sign Up banner from the page.
     * It looks for the specific link and then tries to remove its containing module.
     */
    function removePremiumSignUpBanner() {
        // Find the anchor tag that links to the premium sign-up page.
        // This 'href' attribute is generally stable across X.com updates.
        const premiumLink = document.querySelector('a[href="/i/premium_sign_up"]');

        if (premiumLink) {
            // The premium sign-up link is typically embedded within a larger "card" or "module"
            // on X.com (formerly Twitter). These modules often have a data-testid="cellInnerDiv".
            // We use .closest() to find this stable ancestor and remove the entire module.
            const bannerContainer = premiumLink.closest('[data-testid="cellInnerDiv"]');

            if (bannerContainer) {
                // If the specific container is found, remove it.
                bannerContainer.remove();
                // console.log('4ndr0tools: Premium sign-up banner removed successfully.'); // Optional: for debugging
            } else {
                // Fallback: If the data-testid container pattern changes or is not found,
                // remove the immediate parent of the link. This might not remove the
                // entire visual banner but is a robust fallback.
                premiumLink.parentNode.remove();
                // console.log('4ndr0tools: Premium sign-up link immediate parent removed (fallback).'); // Optional: for debugging
            }
        }
    }

    // Run the function immediately to remove any banners present on the initial page load.
    removePremiumSignUpBanner();

    // Set up a MutationObserver to handle dynamically loaded content.
    // X.com is a Single-Page Application (SPA), so content frequently changes
    // without a full page reload. This observer ensures the banner is removed
    // even if it appears later.
    const observer = new MutationObserver(() => {
        // Re-run the removal function whenever DOM changes are detected.
        removePremiumSignUpBanner();
    });

    // Start observing the entire document body for changes in its children and descendants.
    // This provides broad coverage for all dynamic content loading scenarios.
    observer.observe(document.body, { childList: true, subtree: true });

    // Optional: For very long-running scripts, you might consider disconnecting
    // the observer after a certain period if you are confident all elements
    // have been processed, to save resources. For this simple script, it's
    // generally not necessary as the overhead is minimal.
    // Example: setTimeout(() => observer.disconnect(), 5 * 60 * 1000); // Disconnect after 5 minutes
})();
