// ==UserScript==
// @name         4ndr0tools - AlwaysNewWindow 
// @namespace    http://www.github.com/4ndr0666/userscripts
// @description  Force every single link, including dynamically loaded ones, to open in a new window/tab.
// @version      0.3
// @author       4ndr0666
// @match        *://*/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @grant        none
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AlwaysNewWindow.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AlwaysNewWindow.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Applies the necessary attributes to a single anchor element to force it
     * to open in a new tab with security best practices.
     * @param {HTMLAnchorElement} anchor - The anchor element to process.
     */
    const processAnchor = (anchor) => {
        // Use strict equality to ensure we are only modifying anchor elements.
        if (anchor && anchor.tagName === 'A') {
            // Set target to _blank to open in a new window/tab.
            anchor.target = '_blank';

            // Add rel="noopener noreferrer" for security.
            // noopener prevents the new page from accessing window.opener.
            // noreferrer prevents sending the referrer header.
            anchor.rel = 'noopener noreferrer';
        }
    };

    /**
     * Processes a node to find and modify all anchor tags within it.
     * It also checks if the node itself is an anchor tag.
     * @param {Node} node - The DOM node to process.
     */
    const processNode = (node) => {
        // Ensure the node is an element node before querying it.
        if (node.nodeType === Node.ELEMENT_NODE) {
            // Process the node itself if it's an anchor tag.
            processAnchor(node);

            // Find and process all descendant anchor tags.
            const childAnchors = node.querySelectorAll('a');
            childAnchors.forEach(processAnchor);
        }
    };

    // --- Initial Execution ---
    // Process all links that are present on the page when the script initially runs.
    // This ensures coverage for static content.
    try {
        const initialElements = document.querySelectorAll("a");
        initialElements.forEach(processAnchor);
    } catch (error) {
        console.error("Always New Window Script (Initial Scan) Error:", error);
    }


    // --- Dynamic Content Handling ---
    // Use MutationObserver to watch for new elements being added to the DOM.
    // This is the modern, performant way to handle dynamically loaded content.
    const observer = new MutationObserver((mutationsList) => {
        // A mutation record represents a single DOM change.
        for (const mutation of mutationsList) {
            // We only care about nodes that have been added to the DOM.
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Iterate over each node that was added.
                mutation.addedNodes.forEach(processNode);
            }
        }
    });

    // Configuration for the observer:
    // childList: true - observe additions and removals of child nodes.
    // subtree: true - extend observations to the entire subtree of the target.
    const observerConfig = {
        childList: true,
        subtree: true
    };

    // Start observing the entire document body for changes.
    // Using document.body is a robust target that exists early in the page lifecycle.
    observer.observe(document.body, observerConfig);

})();
