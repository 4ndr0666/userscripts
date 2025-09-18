// ==UserScript==
// @name            4ndr0tools - Redgifs++
// @namespace       https://github.com/4ndr0666/userscripts
// @author          4ndr0666
// @version         3.0
// @description Intercepts Redgifs links on Reddit to open them in an enhanced, cinematic overlay. Cleans up the Redgifs site itself.
// @downloadURL     https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++
// @updateURL       https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++
// @match       https://*.reddit.com/*
// @match       https://*.redgifs.com/watch/*
// @match       https://*.redgifs.com/ifr/*
// @grant       GM_addElement
// @grant       GM_addStyle
// @run-at      document-start
// @license     MIT
// ==/UserScript==

'use strict';

// This script contains logic for two different domains.
// We use the hostname to determine which part of the script to run.

const currentHostname = window.location.hostname;

/**
 * =================================================================
 * Reddit-Side Logic: Create and manage the iframe overlay.
 * =================================================================
 */
if (currentHostname.includes('reddit.com')) {
    // --- UI Elements ---
    const container = GM_addElement(document.body, 'div', { 'id': 'redgifs-container', 'class': 'src-empty' });
    const spinner = GM_addElement(container, 'div', { 'class': 'lds-dual-ring' });
    const closeButton = GM_addElement(container, 'div', { 'id': 'redgifs-close-btn', 'textContent': 'X' });
    const iframe = GM_addElement(container, 'iframe', { 'data-redgifs': '', 'allowfullscreen': '' });

    // --- Functions ---
    const toIfr = (url) => url.replace('/watch/', '/ifr/');
    const hideModal = () => container.classList.add('src-empty');

    const showModal = (url) => {
        iframe.src = toIfr(url);
        container.classList.remove('src-empty');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    // --- Event Listeners ---
    container.addEventListener('click', (e) => {
        // Close if clicking the container backdrop or the close button, but not the iframe itself.
        if (e.target === container || e.target === closeButton) {
            hideModal();
        }
    });

    container.addEventListener('transitionend', () => {
        if (container.classList.contains('src-empty')) {
            iframe.src = ''; // Clear src to stop video playback
            document.body.style.overflow = ''; // Restore scrolling
        }
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href*="redgifs.com/watch/"]');
        if (!link) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        showModal(link.href);
    }, true); // Use capture phase to catch the event early

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !container.classList.contains('src-empty')) {
            hideModal();
        }
    });

    // --- Styles ---
    GM_addStyle(`
        #redgifs-container {
            position: fixed; inset: 0; z-index: 9999;
            display: flex; justify-content: center; align-items: center;
            background-color: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            transition: opacity 0.2s ease, visibility 0.2s ease;
            opacity: 1; visibility: visible;
        }
        #redgifs-container.src-empty {
            pointer-events: none;
            opacity: 0; visibility: hidden;
        }
        #redgifs-container iframe {
            width: 90vw; height: 90vh;
            max-width: 1600px;
            border: none; border-radius: 8px;
            background-color: #000;
        }
        #redgifs-close-btn {
            position: absolute; top: 10px; right: 15px;
            width: 30px; height: 30px;
            display: flex; justify-content: center; align-items: center;
            background-color: rgba(0,0,0,0.5); color: white;
            border-radius: 50%; font-family: sans-serif; font-weight: bold;
            cursor: pointer; user-select: none;
            z-index: 1;
        }
        .lds-dual-ring {
            position: absolute; display: inline-block;
            width: 80px; height: 80px; color: #d96946;
        }
        .lds-dual-ring:after {
            content: " "; display: block;
            width: 64px; height: 64px; margin: 8px;
            border-radius: 50%; border: 5px solid currentColor;
            border-color: currentColor transparent currentColor transparent;
            animation: lds-dual-ring 1.2s linear infinite;
        }
        #redgifs-container.src-empty .lds-dual-ring { display: none; }
        iframe:not([src=""]) + .lds-dual-ring { display: none; }
        @keyframes lds-dual-ring {
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
    const VIDEO_ONLY_CLASS = 'video-only-mode';
    const PLAYER_CONTAINER_SELECTOR = '.player-container';
    const BLUR_BACKGROUND_SELECTOR = '.player-container > img';

    const inIframe = window.self !== window.top;
    let originalParent = null;
    let videoPlayer = null;

    const addStyles = () => {
        GM_addStyle(`
            ${inIframe ? `
            /* When in iframe, make background transparent to see the Reddit overlay */
            body, .player-wrapper, .player-container { background-color: transparent !important; }
            ` : ''}

            body.${VIDEO_ONLY_CLASS} { overflow: hidden; }
            body.${VIDEO_ONLY_CLASS}::before {
                content: ''; position: fixed; top: 0; left: 0;
                width: 100vw; height: 100vh; z-index: 9998;
                background-image: var(--blur-bg-url); background-size: cover;
                filter: blur(80px); transform: scale(1.1);
            }
            body.${VIDEO_ONLY_CLASS} > *:not(.${VIDEO_ONLY_CLASS}-player) { display: none !important; }
            .${VIDEO_ONLY_CLASS}-player {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%); z-index: 9999;
                max-height: 98vh; max-width: 98vw;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
        `);
    };

    const enterVideoOnlyMode = () => {
        if (!videoPlayer || document.body.classList.contains(VIDEO_ONLY_CLASS)) return;

        const backgroundImage = document.querySelector(BLUR_BACKGROUND_SELECTOR);
        if (backgroundImage) {
            document.body.style.setProperty('--blur-bg-url', `url(${backgroundImage.src})`);
        }

        originalParent = videoPlayer.parentElement;
        document.body.appendChild(videoPlayer);
        videoPlayer.classList.add(`${VIDEO_ONLY_CLASS}-player`);
        document.body.classList.add(VIDEO_ONLY_CLASS);

        // Only add exit listeners if NOT in an iframe. The parent page will handle closing.
        if (!inIframe) {
            document.addEventListener('keydown', handleExitKeys);
            document.body.addEventListener('click', handleBodyClick);
        }
    };

    const exitVideoOnlyMode = () => {
        if (!videoPlayer || !document.body.classList.contains(VIDEO_ONLY_CLASS)) return;
        if (originalParent) originalParent.appendChild(videoPlayer);
        videoPlayer.classList.remove(`${VIDEO_ONLY_CLASS}-player`);
        document.body.classList.remove(VIDEO_ONLY_CLASS);
        document.body.style.removeProperty('--blur-bg-url');
        document.removeEventListener('keydown', handleExitKeys);
        document.body.removeEventListener('click', handleBodyClick);
    };

    const handleBodyClick = (event) => {
        if (!event.target.closest(`.${VIDEO_ONLY_CLASS}-player`)) exitVideoOnlyMode();
    };

    const handleExitKeys = (event) => {
        if (event.key === 'Escape') exitVideoOnlyMode();
    };

    const initObserver = () => {
        const observer = new MutationObserver((mutations, obs) => {
            const playerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
            if (playerContainer) {
                videoPlayer = playerContainer.querySelector('video');
                if (videoPlayer) {
                    enterVideoOnlyMode();
                    obs.disconnect();
                }
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    };

    addStyles();
    initObserver();
}
