// ==UserScript==
// @name         4ndr0tools - Google Photos and Drive++  
// @namespace    https://github.com/4ndr0666
// @version      1.2
// @description  Restores context menus, exposes direct links, adds reverse image search, and enhances security for Google Photos and Drive.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
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
     * This targets Google's URL-based image resizing parameters (e.g., w1920-h1080-rw-no) and replaces them with '=s0' for the original, full-resolution file.
     */
    const getDirectPhotoLink = () => {
        try {
            const currentUrl = window.location.href;
            // This regex finds image dimension parameters like "w1920-h1080" and any subsequent flags like "-rw-no".
            // It's designed to work on both path-based and parameter-based resizing URLs.
            const sizeParamRegex = /(w\d+\-h\d+|s\d+)(?:-c|-k)?((?:\-[a-z]+)+)?/i;
            const urlParts = currentUrl.split('=');

            let newUrl = null;

            // Scenario 1: URL has a size parameter in the query string (e.g., .../photo.jpg=w1920-h1080).
            if (urlParts.length > 1 && urlParts[1] !== 's0') {
                newUrl = `${urlParts[0]}=s0`;
            // Scenario 2: URL uses the path-based resizing format (e.g., .../w1920-h1080/photo.jpg).
            } else if (sizeParamRegex.test(urlParts[0])) {
                newUrl = urlParts[0].replace(sizeParamRegex, 's0');
            }

            // Redirect only if a change is needed to avoid unnecessary page loads.
            if (newUrl && currentUrl !== newUrl) {
                window.location.href = newUrl;
            }
        } catch (error) {
            logError('getDirectPhotoLink', error);
        }
    };

    /**
     * Module 2: Context Menu Integration (Right-click Blocker Neutralizer)
     * Proactively removes 'oncontextmenu' attributes and stops event propagation for 'contextmenu' events.
     * This ensures the native browser context menu is always available on sites that try to disable it.
     */
    const removeContextMenuBlockers = () => {
        try {
            // This is the first line of defense. By listening in the "capture" phase (the `true` argument),
            // this event listener runs *before* any listeners on the target elements.
            // `stopImmediatePropagation` prevents any other 'contextmenu' listeners from running, effectively neutralizing the block.
            document.addEventListener('contextmenu', (event) => {
                event.stopImmediatePropagation();
            }, true);

            // This is the second line of defense. It watches for any JavaScript that tries to dynamically
            // add an 'oncontextmenu' attribute to elements (e.g., `<div oncontextmenu="return false;">`).
            // The observer immediately removes the attribute upon detection.
            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'oncontextmenu' && mutation.target.hasAttribute('oncontextmenu')) {
                        mutation.target.removeAttribute('oncontextmenu');
                    }
                }
            });

            // The observer is configured for maximum efficiency. It only watches the DOM subtree for changes
            // to the specific 'oncontextmenu' attribute, ignoring all other DOM mutations.
            observer.observe(document.documentElement, {
                subtree: true,
                attributes: true,
                attributeFilter: ['oncontextmenu']
            });
        } catch (error) {
            logError('removeContextMenuBlockers', error);
        }
    };

    /**
     * Module 3: Display Direct Links in Google Photos
     * Injects a floating box with reverse image search links.
     * This version programmatically creates DOM elements to prevent any potential XSS vulnerabilities from `innerHTML`.
     */
    const displaySearchLinks = () => {
        try {
            // Idempotency check: prevent adding duplicate blocks if the script runs multiple times.
            if (document.getElementById('image-search-links-4ndr0')) {
                return;
            }

            const src = window.location.href;
            const encodedSrc = encodeURIComponent(src);

            const linkBlock = document.createElement('div');
            linkBlock.id = 'image-search-links-4ndr0';
            Object.assign(linkBlock.style, {
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px',
                position: 'fixed',
                zIndex: '2147483647', // Max z-index
                left: '10px',
                top: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                fontFamily: 'sans-serif',
                fontSize: '12px',
            });

            // Create and append the Google search link
            const googleLink = document.createElement('a');
            googleLink.href = `https://www.google.com/searchbyimage?image_url=${encodedSrc}`;
            googleLink.target = '_blank';
            googleLink.textContent = 'Search Google';
            Object.assign(googleLink.style, {
                color: '#1a0dab',
                textDecoration: 'none',
            });
            linkBlock.appendChild(googleLink);

            // Add a line break
            linkBlock.appendChild(document.createElement('br'));

            // Create and append the Yandex search link
            const yandexLink = document.createElement('a');
            yandexLink.href = `https://yandex.com/images/search?rpt=imageview&img_url=${encodedSrc}`;
            yandexLink.target = '_blank';
            yandexLink.textContent = 'Search Yandex';
            Object.assign(yandexLink.style, {
                color: '#1a0dab',
                textDecoration: 'none',
                marginTop: '4px',
                display: 'inline-block',
            });
            linkBlock.appendChild(yandexLink);

            document.body.appendChild(linkBlock);
        } catch (error) {
            logError('displaySearchLinks', error);
        }
    };

    /**
     * Module 4: Notification System (Non-blocking)
     * Displays a small, temporary notification to confirm the script is active.
     * @param {string} message - The message to display.
     */
    const showNotification = (message) => {
        try {
            const notification = document.createElement('div');
            Object.assign(notification.style, {
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                padding: '12px 18px',
                backgroundColor: 'rgba(17, 17, 17, 0.85)',
                color: '#fff',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                zIndex: '2147483647', // Max z-index
                borderRadius: '5px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                opacity: '0',
                transition: 'opacity 0.5s ease-in-out',
            });
            notification.textContent = message;

            document.body.appendChild(notification);

            // Fade in, wait, then fade out for a smooth user experience.
            setTimeout(() => { notification.style.opacity = '1'; }, 100);
            setTimeout(() => {
                notification.style.opacity = '0';
                // Remove the element from the DOM after the fade-out transition completes to prevent clutter.
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

        // This is a global enhancement and should run on all matched pages.
        removeContextMenuBlockers();

        // These features are specific to direct image view URLs.
        if (currentHost.includes('googleusercontent.com')) {
            getDirectPhotoLink();
            displaySearchLinks();
        }

        // Notify the user that the script is active on any of the target domains.
        if (currentHost.includes('google.com') || currentHost.includes('googleusercontent.com')) {
            showNotification('4ndr0tools++ Activated');
        }
    };

    // Defer script execution until the initial DOM is ready.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // The DOM is already ready, so we can execute immediately.
        initialize();
    }

})();
