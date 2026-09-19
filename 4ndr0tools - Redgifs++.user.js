// ==UserScript==
// @name            4ndr0tools - Redgifs++
// @namespace       https://github.com/4ndr0666/userscripts
// @author          4ndr0666 
// @version         5.0
// @description     Intercepts Redgifs links on Reddit for a cinematic overlay. On Redgifs itself, enters focused video-only mode. Falls back to JSON.parse intercept for direct /watch/ loads before SPA hydration.
// @downloadURL     https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @updateURL       https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Redgifs++.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
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
    if (HOST === 'reddit.com' || HOST.endsWith('.reddit.com')) {
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
