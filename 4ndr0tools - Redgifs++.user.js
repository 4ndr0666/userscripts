// ==UserScript==
// @name            4ndr0tools - Redgifs++
// @namespace       https://github.com/4ndr0666/userscripts
// @author          4ndr0666 
// @version         4.0
// @description     Intercepts Redgifs links on Reddit to open them in an enhanced, cinematic overlay. Cleans up the Redgifs site itself for a focused viewing experience.
// @downloadURL     https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @updateURL       https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @match           https://*.reddit.com/*
// @match           https://*.redgifs.com/watch/*
// @match           https://*.redgifs.com/ifr/*
// @grant           GM_addElement
// @grant           GM_addStyle
// @run-at          document-start
// @license         MIT
// ==/UserScript==

'use strict';

(() => {
    const currentHostname = window.location.hostname;

    /**
     * =================================================================
     * Reddit-Side Logic: Create and manage the iframe overlay.
     * =================================================================
     */
    if (currentHostname.includes('reddit.com')) {
        // --- Configuration ---
        const MODAL_BG_COLOR = 'rgba(0, 0, 0, 0.85)';
        const SPINNER_COLOR = '#d96946';
        const TRANSITION_SPEED = '0.25s';

        // --- UI Element Creation ---
        const container = GM_addElement(document.body, 'div', { id: 'rgpp-container', class: 'rgpp-hidden' });
        const spinner = GM_addElement(container, 'div', { class: 'rgpp-spinner' });
        const closeButton = GM_addElement(container, 'div', { id: 'rgpp-close-btn', textContent: '✕' });
        const iframe = GM_addElement(container, 'iframe', { 'data-rgpp-iframe': '', allowfullscreen: 'true', sandbox: 'allow-scripts allow-same-origin allow-presentation' });

        // --- Core Functions ---

        /**
         * Converts a Redgifs 'watch' URL to its 'ifr' embed equivalent.
         * @param {string} url The original URL.
         * @returns {string} The converted /ifr/ URL.
         */
        const toIfr = (url) => url.replace('/watch/', '/ifr/');

        /**
         * Hides the modal and cleans up the state.
         */
        const hideModal = () => {
            container.classList.add('rgpp-hidden');
            document.body.style.overflow = ''; // Restore background scrolling
        };

        /**
         * Shows the modal with the specified URL.
         * @param {string} url The Redgifs URL to load.
         */
        const showModal = (url) => {
            // // Show spinner immediately by ensuring iframe src is empty
            iframe.src = '';
            // // Set the new src, which will trigger the CSS to hide the spinner on load
            iframe.src = toIfr(url);
            container.classList.remove('rgpp-hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        };

        // --- Event Listeners ---

        // // Handles clicks on the modal container (for closing)
        container.addEventListener('click', (e) => {
            // // Close if clicking the container backdrop or the close button, but not the iframe itself.
            if (e.target === container || e.target === closeButton) {
                hideModal();
            }
        });

        // // After the fade-out transition ends, clear the iframe src to stop playback.
        container.addEventListener('transitionend', () => {
            if (container.classList.contains('rgpp-hidden')) {
                iframe.src = 'about:blank'; // More robust than empty string for stopping playback
            }
        });

        // // Global click listener to intercept Redgifs links.
        // // Using capture phase ensures we catch the click before Reddit's own handlers.
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="redgifs.com/watch/"]');
            if (link) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showModal(link.href);
            }
        }, true);

        // // Global keydown listener for the 'Escape' key.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !container.classList.contains('rgpp-hidden')) {
                hideModal();
            }
        });

        // --- Styles ---
        GM_addStyle(`
            :root {
                --rgpp-bg-color: ${MODAL_BG_COLOR};
                --rgpp-spinner-color: ${SPINNER_COLOR};
                --rgpp-transition-speed: ${TRANSITION_SPEED};
            }
            #rgpp-container {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; justify-content: center; align-items: center;
                background-color: var(--rgpp-bg-color);
                backdrop-filter: blur(5px);
                transition: opacity var(--rgpp-transition-speed) ease, visibility var(--rgpp-transition-speed) ease;
                opacity: 1; visibility: visible;
            }
            #rgpp-container.rgpp-hidden {
                pointer-events: none;
                opacity: 0; visibility: hidden;
            }
            #rgpp-container iframe {
                width: 95vw; height: 95vh;
                max-width: 1800px;
                border: none; border-radius: 8px;
                background-color: #000;
                /* // Fade in the iframe content once it's loaded */
                opacity: 0;
                transition: opacity 0.3s ease 0.1s;
            }
            /* // When iframe has a valid src, fade it in */
            #rgpp-container iframe[src]:not([src="about:blank"]):not([src=""]) {
                opacity: 1;
            }
            #rgpp-close-btn {
                position: absolute; top: 10px; right: 15px;
                width: 32px; height: 32px;
                display: flex; justify-content: center; align-items: center;
                background-color: rgba(0,0,0,0.6); color: white;
                border-radius: 50%; font-family: 'Arial Black', sans-serif; font-size: 16px;
                cursor: pointer; user-select: none;
                z-index: 1;
                transition: transform 0.2s ease, background-color 0.2s ease;
            }
            #rgpp-close-btn:hover {
                transform: scale(1.1);
                background-color: rgba(255,0,0,0.7);
            }
            .rgpp-spinner {
                position: absolute; display: block;
                width: 80px; height: 80px; color: var(--rgpp-spinner-color);
            }
            .rgpp-spinner:after {
                content: " "; display: block;
                width: 64px; height: 64px; margin: 8px;
                border-radius: 50%; border: 6px solid currentColor;
                border-color: currentColor transparent currentColor transparent;
                animation: rgpp-spin 1.2s linear infinite;
            }
            /* // Hide spinner once the iframe has a real src and starts loading */
            #rgpp-container iframe[src]:not([src="about:blank"]):not([src=""]) ~ .rgpp-spinner {
                display: none;
            }
            @keyframes rgpp-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `);
    }

    /**
     * =================================================================
     * Redgifs-Side Logic: Clean up the watch/ifr page.
     * =================================================================
     */
    else if (currentHostname.includes('redgifs.com')) {
        const VIDEO_ONLY_CLASS = 'rgpp-video-only-mode';
        const PLAYER_CLASS = `${VIDEO_ONLY_CLASS}-player`;
        const PLAYER_CONTAINER_SELECTOR = '.player-container';
        const BLUR_BACKGROUND_SELECTOR = '.player-container > img';

        const inIframe = window.self !== window.top;
        let originalParent = null;
        let videoPlayerContainer = null;

        const addStyles = () => {
            GM_addStyle(`
                ${inIframe ? `
                /* When in iframe, make background transparent to see the Reddit overlay */
                body, .player-wrapper, .player-container { background: transparent !important; }
                ` : `
                /* When viewed directly, create a cinematic blurred background */
                body.${VIDEO_ONLY_CLASS}::before {
                    content: ''; position: fixed; inset: 0;
                    z-index: 9998;
                    background-image: var(--rgpp-blur-bg-url);
                    background-size: cover; background-position: center;
                    filter: blur(80px); transform: scale(1.15);
                    opacity: 0.7;
                }
                `}

                body.${VIDEO_ONLY_CLASS} { overflow: hidden; background-color: #000; }
                /* // Hide everything except our moved player container */
                body.${VIDEO_ONLY_CLASS} > *:not(.${PLAYER_CLASS}) { display: none !important; }

                .${PLAYER_CLASS} {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%); z-index: 9999;
                    width: 100%; height: 100%;
                    display: flex; justify-content: center; align-items: center;
                }
                /* // Ensure the video inside scales correctly */
                .${PLAYER_CLASS} video {
                    max-height: 100vh; max-width: 100vw;
                    border-radius: 8px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
                }
            `);
        };

        const enterVideoOnlyMode = () => {
            if (!videoPlayerContainer || document.body.classList.contains(VIDEO_ONLY_CLASS)) return;

            // // Set blurred background only if not in iframe
            if (!inIframe) {
                const backgroundImage = document.querySelector(BLUR_BACKGROUND_SELECTOR);
                if (backgroundImage) {
                    document.body.style.setProperty('--rgpp-blur-bg-url', `url(${backgroundImage.src})`);
                }
            }

            originalParent = videoPlayerContainer.parentElement;
            document.body.appendChild(videoPlayerContainer);
            videoPlayerContainer.classList.add(PLAYER_CLASS);
            document.body.classList.add(VIDEO_ONLY_CLASS);

            // // Only add exit listeners if NOT in an iframe. The parent page handles closing.
            if (!inIframe) {
                const exit = () => exitVideoOnlyMode(); // Create a stable function reference
                document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { exit(); this.removeEventListener('keydown', onKey); } });
                document.body.addEventListener('click', function onClick(e) { if (!e.target.closest('video')) { exit(); this.removeEventListener('click', onClick); } });
            }
        };

        const exitVideoOnlyMode = () => {
            if (!videoPlayerContainer || !document.body.classList.contains(VIDEO_ONLY_CLASS)) return;
            if (originalParent) originalParent.appendChild(videoPlayerContainer);
            videoPlayerContainer.classList.remove(PLAYER_CLASS);
            document.body.classList.remove(VIDEO_ONLY_CLASS);
            document.body.style.removeProperty('--rgpp-blur-bg-url');
            // // Event listeners are self-removing, no need to manage them here.
        };

        const initialize = () => {
            // // First, try to find the player container directly in case it's already loaded.
            videoPlayerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
            if (videoPlayerContainer) {
                enterVideoOnlyMode();
                return; // Found it, no need for an observer.
            }

            // // If not found, set up an observer to wait for it to be added to the DOM.
            const observer = new MutationObserver((mutations, obs) => {
                videoPlayerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
                if (videoPlayerContainer) {
                    enterVideoOnlyMode();
                    obs.disconnect(); // Clean up the observer once our job is done.
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        };

        addStyles();
        initialize();
    }
})();
