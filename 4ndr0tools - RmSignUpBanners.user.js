// ==UserScript==
// @name         4ndr0tools - RmSignUpBanners
// @namespace    http://github.com/4ndr0666/userscripts
// @author       4ndr0666 
// @version      2.0
// @description  A configurable and performant solution to hide nagging sign-up/login overlays, cookie banners, and other visual noise.
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
     * Configuration array for targeted removals.
     * Each object represents a set of rules for a specific site or pattern.
     * This modular approach allows for easy expansion and maintenance without altering core logic.
     *
     * @property {string} name - A descriptive name for the rule set.
     * @property {RegExp} host - A regular expression to match against the window's hostname.
     * @property {string[]} selectors - An array of CSS selectors for elements to be removed.
     * @property {Function} [action] - An optional custom function to execute for more complex logic.
     */
    const removalConfig = [
        {
            name: 'X.com (Twitter) Premium Banner',
            host: /^(www\.)?x\.com$/,
            // This maintains the original script's functionality as a baseline (superset check).
            selectors: [
                '[data-testid="cellInnerDiv"]:has(a[href="/i/premium_sign_up"])'
            ]
        },
        {
            name: 'Reddit Nag Banners',
            host: /^(www\.)?reddit\.com$/,
            selectors: [
                'shreddit-async-loader[bundlename="bottom_sheet_xpromo"]', // "See Reddit in..." banner
                'shreddit-global-banner' // Top promo banner
            ]
        },
        {
            name: 'Quora Sign-Up Wall',
            host: /^(www\.)?quora\.com$/,
            // Quora uses a class on the body to hide content. This rule removes the overlay
            // and restores scrolling, demonstrating a more advanced action.
            action: () => {
                const overlay = document.querySelector('.qu-prevent-scroll');
                if (overlay) {
                    overlay.remove();
                    document.body.style.overflow = 'auto'; // Restore scrolling
                }
            }
        },
        {
            name: 'Generic Cookie Banners',
            host: /.*/, // Matches all sites
            selectors: [
                '[id*="cookie"]',
                '[class*="cookie"]',
                '[id*="consent"]',
                '[class*="consent"]',
                '#onetrust-consent-sdk'
            ]
        }
    ];

    /**
     * A utility function to debounce function execution.
     * This prevents the removal logic from firing excessively on highly dynamic pages,
     * significantly improving performance by waiting for a pause in DOM mutations.
     * @param {Function} func - The function to debounce.
     * @param {number} delay - The debounce delay in milliseconds.
     * @returns {Function} - The debounced function.
     */
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * The core logic for processing the page and removing targeted elements.
     * It iterates through the configuration, applying rules that match the current site.
     */
    function processPage() {
        const currentHost = window.location.hostname;

        for (const rule of removalConfig) {
            // Test if the current host matches the rule's host regex.
            if (rule.host.test(currentHost)) {
                // Handle selector-based removals
                if (rule.selectors) {
                    for (const selector of rule.selectors) {
                        try {
                            // Use querySelectorAll to find all matching elements.
                            const elements = document.querySelectorAll(selector);
                            // This loop is robust; it continues even if an element is already gone.
                            elements.forEach(el => el.remove());
                        } catch (error) {
                            // This ensures that a single invalid CSS selector in the config
                            // doesn't break the entire script.
                            console.error(`[Ψ-Anarch Script] Error with selector "${selector}" for rule "${rule.name}":`, error);
                        }
                    }
                }

                // Handle custom action functions for complex scenarios.
                if (typeof rule.action === 'function') {
                    try {
                        rule.action();
                    } catch (error) {
                        console.error(`[Ψ-Anarch Script] Error executing action for rule "${rule.name}":`, error);
                    }
                }
            }
        }
    }

    // Create a debounced version of the processing function for the observer.
    // A 300ms delay is a sensible default, balancing responsiveness with performance.
    const debouncedProcessPage = debounce(processPage, 300);

    // Run the function once on initial script execution to catch any elements
    // present at page load.
    processPage();

    // Set up a MutationObserver to handle dynamically loaded content in SPAs.
    const observer = new MutationObserver(() => {
        // Call the debounced function to avoid performance bottlenecks.
        debouncedProcessPage();
    });

    // Observe the entire document body for subtree and child list modifications.
    // This is necessary to detect dynamically injected banners and overlays.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
