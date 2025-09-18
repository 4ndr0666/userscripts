// ==UserScript==
// @name         4ndr0tools - Google Photos and Drive++  
// @namespace    https://github.com/4ndr0666
// @version      1.1
// @description  Restore context menus, expose direct links, and add reverse image search for Google Photos and Drive.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ConfirmationBypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ConfirmationBypass.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*.googleusercontent.com/*
// @match        *://photos.google.com/*
// @match        *://drive.google.com/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    /**
     * A centralized error logging utility for the script.
     * @param {string} module - The name of the function/module where the error occurred.
     * @param {Error} error - The error object caught.
     */
    const logError = (module, error) => {
        console.error(`[4ndr0tools Error] in ${module}:`, error.message, error.stack);
    };

    /**
     * Module 1: Direct Photo Link Enhancement
     * Identifies and redirects to the highest resolution version of a Google User Content image.
     * The regex targets Google's URL-based image resizing parameters (e.g., w1920-h1080-rw-no).
     */
    const getDirectPhotoLink = () => {
        try {
            const currentUrl = window.location.href;
            // This regex finds image dimension parameters like "w1920-h1080" and any subsequent flags like "-rw-no".
            const sizeParamRegex = /(w\d+\-h\d+)((?:\-[a-z]+)+)?/i;
            const urlParts = currentUrl.split('=');

            // Scenario 1: URL has a size parameter that is not the max resolution ('s0').
            if (urlParts.length > 1 && urlParts[1] !== 's0') {
                const newUrl = `${urlParts[0]}=s0`;
                if (currentUrl !== newUrl) {
                    window.location.href = newUrl;
                }
            // Scenario 2: URL uses the path-based resizing format.
            } else if (sizeParamRegex.test(urlParts[0])) {
                const newUrl = urlParts[0].replace(sizeParamRegex, 's0');
                if (currentUrl !== newUrl) {
                    window.location.href = newUrl;
                }
            }
        } catch (error) {
            logError('getDirectPhotoLink', error);
        }
    };

    /**
     * Module 2: Context Menu Integration (Right-click Blocker Neutralizer)
     * Proactively removes 'oncontextmenu' attributes and stops event propagation for 'contextmenu' events.
     * This ensures the native browser context menu is always available.
     */
    const removeContextMenuBlockers = () => {
        try {
            // Immediately stop any attempts to block the context menu.
            // Using capture phase to ensure this runs before any other listeners on the page.
            document.addEventListener('contextmenu', (event) => {
                event.stopImmediatePropagation();
            }, true); // The 'true' enables capture phase.

            // MutationObserver to handle any dynamically added contextmenu blockers.
            // This is more performant than observing the entire body for all changes.
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'oncontextmenu' && mutation.target.hasAttribute('oncontextmenu')) {
                        mutation.target.removeAttribute('oncontextmenu');
                    }
                }
            });

            observer.observe(document.documentElement, {
                subtree: true,
                attributes: true,
                attributeFilter: ['oncontextmenu'] // Only watch for changes to this specific attribute.
            });
        } catch (error) {
            logError('removeContextMenuBlockers', error);
        }
    };

    /**
     * Module 3: Display Direct Links in Google Photos
     * Injects a floating box with reverse image search links.
     */
    const displaySearchLinks = () => {
        try {
            // Prevent adding duplicate blocks.
            if (document.getElementById('image-search-links-4ndr0')) {
                return;
            }

            const src = window.location.href;
            const encodedSrc = encodeURIComponent(src);

            const linkBlock = document.createElement('div');
            linkBlock.id = 'image-search-links-4ndr0';
            linkBlock.style.cssText = `
                background: rgba(255, 255, 255, 0.9);
                padding: 8px;
                position: fixed;
                z-index: 2147483647; /* Max z-index */
                left: 10px;
                top: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                font-family: sans-serif;
                font-size: 12px;
            `;

            linkBlock.innerHTML = `
                <a href="https://www.google.com/searchbyimage?image_url=${encodedSrc}" target="_blank" style="color: #1a0dab; text-decoration: none;">Search Google</a><br>
                <a href="https://yandex.com/images/search?rpt=imageview&img_url=${encodedSrc}" target="_blank" style="color: #1a0dab; text-decoration: none; margin-top: 4px; display: inline-block;">Search Yandex</a>
            `;

            document.body.appendChild(linkBlock);
        } catch (error) {
            logError('displaySearchLinks', error);
        }
    };

    /**
     * Module 4: Notification System (Non-blocking)
     * Displays a small notification to confirm the script is active.
     * @param {string} message - The message to display.
     */
    const showNotification = (message) => {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 12px 18px;
                background-color: rgba(17, 17, 17, 0.85);
                color: #fff;
                font-family: sans-serif;
                font-size: 14px;
                z-index: 2147483647; /* Max z-index */
                border-radius: 5px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            // Fade in and out for a smoother experience.
            setTimeout(() => { notification.style.opacity = '1'; }, 100);
            setTimeout(() => {
                notification.style.opacity = '0';
                // Remove from DOM after transition completes.
                notification.addEventListener('transitionend', () => notification.remove());
            }, 3000);
        } catch (error) {
            logError('showNotification', error);
        }
    };

    /**
     * Main execution block.
     * Determines which functions to run based on the current URL.
     */
    const initialize = () => {
        const currentHost = window.location.hostname;

        // Always enable the context menu restoration.
        removeContextMenuBlockers();

        // Specific logic for Google User Content URLs (direct image views).
        if (currentHost.includes('googleusercontent.com')) {
            getDirectPhotoLink();
            displaySearchLinks();
        }

        // Notify user of script activation on relevant domains.
        if (currentHost.includes('google.com') || currentHost.includes('googleusercontent.com')) {
            showNotification('4ndr0tools++ Activated');
        }
    };

    // Run the script after the initial page content has loaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
