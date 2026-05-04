// ==UserScript==
// @name            4ndr0tools - Redgifs++
// @namespace       https://github.com/4ndr0666/userscripts
// @author          4ndr0666 
// @version         5.0
// @description     Intercepts Redgifs links on Reddit for a cinematic overlay. On Redgifs itself, enters focused video-only mode. Falls back to JSON.parse intercept for direct /watch/ loads before SPA hydration.
// @downloadURL     https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @updateURL       https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @icon            data:image/png;base64,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
// @license         UNLICENSED - RED TEAM USE ONLY
// @match           *://*.redgifs.com/watch/*
// @match           *://*.redgifs.com/ifr/*
// @match           *://*.redgifs.com/*
// @match           *://redgifs.com/*
// @match           *://*.reddit.com/*
// @run-at          document-start
// @grant           GM_addElement
// @grant           GM_addStyle
// ==/UserScript==

'use strict';

(() => {
    const HOST = window.location.hostname;
    const PATH = window.location.pathname;

    // ─────────────────────────────────────────────────────────────────────────
    // BRANCH A — Reddit side: cinematic iframe overlay
    // ─────────────────────────────────────────────────────────────────────────
    if (HOST.includes('reddit.com')) {
        const MODAL_BG_COLOR    = 'rgba(0, 0, 0, 0.85)';
        const SPINNER_COLOR     = '#d96946';
        const TRANSITION_SPEED  = '0.25s';

        // Build DOM
        const container   = GM_addElement(document.body, 'div',    { id: 'rgpp-container', class: 'rgpp-hidden' });
        const spinner     = GM_addElement(container,    'div',    { class: 'rgpp-spinner' });
        const closeButton = GM_addElement(container,    'div',    { id: 'rgpp-close-btn', textContent: '✕' });
        const iframe      = GM_addElement(container,    'iframe', {
            'data-rgpp-iframe': '',
            allowfullscreen: 'true',
            sandbox: 'allow-scripts allow-same-origin allow-presentation'
        });

        // Suppress unused-variable lint: spinner is inserted for CSS targeting only.
        void spinner;

        /** Convert a /watch/ URL to its /ifr/ embed equivalent. */
        const toIfr = (url) => url.replace('/watch/', '/ifr/');

        const hideModal = () => {
            container.classList.add('rgpp-hidden');
            document.body.style.overflow = '';
        };

        const showModal = (url) => {
            iframe.src = '';
            iframe.src = toIfr(url);
            container.classList.remove('rgpp-hidden');
            document.body.style.overflow = 'hidden';
        };

        // Close on backdrop or close-button click
        container.addEventListener('click', (e) => {
            if (e.target === container || e.target === closeButton) hideModal();
        });

        // After fade-out ends, hard-stop playback
        container.addEventListener('transitionend', () => {
            if (container.classList.contains('rgpp-hidden')) {
                iframe.src = 'about:blank';
            }
        });

        // Intercept every Redgifs /watch/ link on the page (capture phase)
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="redgifs.com/watch/"]');
            if (link) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showModal(link.href);
            }
        }, true);

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !container.classList.contains('rgpp-hidden')) hideModal();
        });

        GM_addStyle(`
            :root {
                --rgpp-bg-color:         ${MODAL_BG_COLOR};
                --rgpp-spinner-color:    ${SPINNER_COLOR};
                --rgpp-transition-speed: ${TRANSITION_SPEED};
            }
            #rgpp-container {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; justify-content: center; align-items: center;
                background-color: var(--rgpp-bg-color);
                backdrop-filter: blur(5px);
                transition: opacity var(--rgpp-transition-speed) ease,
                            visibility var(--rgpp-transition-speed) ease;
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
                opacity: 0;
                transition: opacity 0.3s ease 0.1s;
            }
            #rgpp-container iframe[src]:not([src="about:blank"]):not([src=""]) {
                opacity: 1;
            }
            #rgpp-close-btn {
                position: absolute; top: 10px; right: 15px;
                width: 32px; height: 32px;
                display: flex; justify-content: center; align-items: center;
                background-color: rgba(0,0,0,0.6); color: white;
                border-radius: 50%; font-family: 'Arial Black', sans-serif;
                font-size: 16px; cursor: pointer; user-select: none;
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
            .rgpp-spinner::after {
                content: " "; display: block;
                width: 64px; height: 64px; margin: 8px;
                border-radius: 50%; border: 6px solid currentColor;
                border-color: currentColor transparent currentColor transparent;
                animation: rgpp-spin 1.2s linear infinite;
            }
            /* Hide spinner once iframe is loading a real src */
            #rgpp-container iframe[src]:not([src="about:blank"]):not([src=""]) ~ .rgpp-spinner {
                display: none;
            }
            @keyframes rgpp-spin {
                0%   { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `);

        return; // Reddit branch is complete; do not fall through.
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BRANCH B — Redgifs side
    // ─────────────────────────────────────────────────────────────────────────
    if (!HOST.includes('redgifs.com')) return; // Guard: irrelevant host.

    const inIframe = window.self !== window.top;

    // ── SUB-BRANCH B1: JSON.parse intercept for direct /watch/ loads ────────
    // Catches the moment the SPA bootstrap JSON is parsed and renders a clean
    // video page before React ever hydrates. Runs on /watch/ when NOT in iframe.
    if (!inIframe && (PATH.startsWith('/watch/') || PATH.startsWith('/ifr/'))) {
        const originalParse = JSON.parse;

        /**
         * Fires once on the first JSON payload that contains a "gif" key.
         * Builds a minimal, self-contained video page and tears down the hook.
         * @param {string} json
         */
        const handleGifJson = (json) => {
            if (typeof json !== 'string' || !json.includes('"gif"')) return;

            let parsed;
            try { parsed = originalParse(json); } catch { return; }
            if (!parsed || !parsed.gif || !parsed.gif.urls) return;

            const { hd, sd, poster } = parsed.gif.urls;
            const videoSrc = hd || sd;
            if (!videoSrc) return;

            // Restore original JSON.parse immediately — single-fire intercept.
            JSON.parse = originalParse;

            document.body.innerHTML = `
                <img
                    src="${poster}"
                    aria-hidden="true"
                    style="position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;filter:blur(90px);transform:scale(1.1);"
                >
                <video
                    controls
                    autoplay
                    loop
                    playsinline
                    src="${videoSrc}"
                    poster="${poster}"
                    style="max-height:calc(100vh - 20px);max-width:calc(100vw - 20px);border-radius:10px;cursor:pointer;"
                ></video>
            `;
            document.body.style.cssText =
                'margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#000;overflow:hidden;';
        };

        JSON.parse = function (json, ...args) {
            handleGifJson(json);
            return originalParse(json, ...args);
        };
        // JSON.parse hook is live; the MutationObserver path below also runs in
        // parallel so whichever fires first wins cleanly.
    }

    // ── SUB-BRANCH B2: MutationObserver / DOM-reparenting path ─────────────
    // Handles SPA navigation and cases where the player DOM is already present.

    const VIDEO_ONLY_CLASS           = 'rgpp-video-only-mode';
    const PLAYER_CLASS               = `${VIDEO_ONLY_CLASS}-player`;
    const PLAYER_CONTAINER_SELECTOR  = '.player-container';
    const BLUR_BACKGROUND_SELECTOR   = '.player-container > img';

    let originalParent        = null;
    let videoPlayerContainer  = null;
    let observerRef           = null; // Keep reference so navigation cleanup is possible.

    const addStyles = () => {
        GM_addStyle(`
            ${inIframe ? `
                /* Transparent background when embedded in the Reddit overlay */
                body, .player-wrapper, .player-container {
                    background: transparent !important;
                }
            ` : `
                /* Cinematic blurred background for direct-view */
                body.${VIDEO_ONLY_CLASS}::before {
                    content: ''; position: fixed; inset: 0; z-index: 9998;
                    background-image: var(--rgpp-blur-bg-url);
                    background-size: cover; background-position: center;
                    filter: blur(80px); transform: scale(1.15);
                    opacity: 0.7;
                }
            `}

            body.${VIDEO_ONLY_CLASS} {
                overflow: hidden;
                background-color: #000;
            }
            /* Hide every top-level element except our relocated player */
            body.${VIDEO_ONLY_CLASS} > *:not(.${PLAYER_CLASS}) {
                display: none !important;
            }
            .${PLAYER_CLASS} {
                position: fixed; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
            }
            .${PLAYER_CLASS} video {
                max-height: 100vh; max-width: 100vw;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
            }
        `);
    };

    const enterVideoOnlyMode = () => {
        if (!videoPlayerContainer || document.body.classList.contains(VIDEO_ONLY_CLASS)) return;

        if (!inIframe) {
            const bgImg = document.querySelector(BLUR_BACKGROUND_SELECTOR);
            if (bgImg) {
                document.body.style.setProperty('--rgpp-blur-bg-url', `url(${bgImg.src})`);
            }
        }

        originalParent = videoPlayerContainer.parentElement;
        document.body.appendChild(videoPlayerContainer);
        videoPlayerContainer.classList.add(PLAYER_CLASS);
        document.body.classList.add(VIDEO_ONLY_CLASS);

        // Exit listeners only needed when the user is viewing directly (not via iframe).
        // They are self-removing to avoid listener accumulation across SPA navigations.
        if (!inIframe) {
            const onKey = (e) => {
                if (e.key === 'Escape') { exitVideoOnlyMode(); document.removeEventListener('keydown', onKey); }
            };
            const onClick = (e) => {
                if (!e.target.closest('video')) { exitVideoOnlyMode(); document.body.removeEventListener('click', onClick); }
            };
            document.addEventListener('keydown', onKey);
            document.body.addEventListener('click', onClick);
        }
    };

    const exitVideoOnlyMode = () => {
        if (!videoPlayerContainer || !document.body.classList.contains(VIDEO_ONLY_CLASS)) return;
        if (originalParent) originalParent.appendChild(videoPlayerContainer);
        videoPlayerContainer.classList.remove(PLAYER_CLASS);
        document.body.classList.remove(VIDEO_ONLY_CLASS);
        document.body.style.removeProperty('--rgpp-blur-bg-url');
    };

    const disconnectObserver = () => {
        if (observerRef) { observerRef.disconnect(); observerRef = null; }
    };

    const initialize = () => {
        // Reset state for SPA re-navigation.
        exitVideoOnlyMode();
        disconnectObserver();
        videoPlayerContainer = null;
        originalParent       = null;

        // Fast path: player already in DOM.
        videoPlayerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
        if (videoPlayerContainer) {
            enterVideoOnlyMode();
            return;
        }

        // Slow path: wait for SPA to inject the player.
        observerRef = new MutationObserver((_mutations, obs) => {
            videoPlayerContainer = document.querySelector(PLAYER_CONTAINER_SELECTOR);
            if (videoPlayerContainer) {
                enterVideoOnlyMode();
                obs.disconnect();
                observerRef = null;
            }
        });
        observerRef.observe(document.documentElement, { childList: true, subtree: true });
    };

    addStyles();
    initialize();

    // ── SPA navigation guard ─────────────────────────────────────────────────
    // Redgifs uses client-side routing; re-run initialize on URL changes so the
    // video-only mode activates on every /watch/ navigation without a hard reload.
    let lastPath = PATH;
    const navObserver = new MutationObserver(() => {
        const newPath = window.location.pathname;
        if (newPath !== lastPath) {
            lastPath = newPath;
            // Only activate on watch/ifr routes; exit cleanly on other routes.
            if (newPath.startsWith('/watch/') || newPath.startsWith('/ifr/')) {
                initialize();
            } else {
                exitVideoOnlyMode();
                disconnectObserver();
            }
        }
    });
    navObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
