// ==UserScript==
// @name         4ndr0tools - GooglePhotosandDrive++
// @namespace    https://github.com/4ndr0666
// @version      1.5.0
// @description  Restores context menus, exposes direct links, adds reverse image search.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
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
     * Diagnostic uplink: Centralized error telemetry.
     */
    const logError = (module, error) => {
        console.error(`[💀 Ψ-4ndr0666] Exception in ${module}:`, error.message, error.stack);
    };

    /**
     * Module 0: Inject CSS for Electric-Glass morphism
     * Defines the root variables and typography required for the HUD.
     */
    const injectStyles = () => {
        if (document.getElementById('4ndr0-glass-styles')) return;

        const style = document.createElement('style');
        style.id = '4ndr0-glass-styles';
        // The design relies on CSS custom properties for easy theming and specific fonts for the aesthetic.
        // This style uses the Roboto Mono font from Google Fonts.
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');

            :root {
                --bg-dark: rgba(10, 19, 26, 0.25); /* Adjusted for true glassmorphism */
                --accent-cyan: #00E5FF;
                --text-cyan-active: #67E8F9;
                --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
                --accent-cyan-bg-active: rgba(0, 229, 255, 0.2);
                --accent-cyan-glow-active: rgba(0, 229, 255, 0.4);
                --text-primary: #EAEAEA;
                --text-secondary: #9E9E9E;
                --font-body: 'Roboto Mono', monospace;
            }

            #osint-links-4ndr0 {
                background: var(--bg-dark);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(0, 229, 255, 0.2);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                border-left: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                padding: 16px;
                position: fixed;
                z-index: 2147483647;
                left: 20px;
                top: 20px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                min-width: 180px;
                transition: all 0.3s ease-in-out;
            }

            #osint-links-4ndr0:hover {
                border-color: rgba(0, 229, 255, 0.5);
                box-shadow: 0 8px 32px 0 rgba(0, 229, 255, 0.15);
            }

            /* --- Base Button Style --- */
            .hud-button {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem 1rem;
                border: 1px solid transparent;
                font-family: var(--font-body);
                font-weight: 500;
                font-size: 0.875rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: var(--text-secondary);
                background-color: rgba(0, 0, 0, 0.3);
                cursor: pointer;
                transition: all 300ms ease-in-out;
                text-decoration: none;
                border-radius: 4px;
            }

            /* --- Hover State --- */
            .hud-button:hover {
                color: var(--accent-cyan);
                border-color: var(--accent-cyan-border-hover);
                background-color: rgba(0, 229, 255, 0.05);
            }

            /* --- Active/Selected State --- */
            .hud-button.active {
                color: var(--text-cyan-active);
                background-color: var(--accent-cyan-bg-active);
                border-color: var(--accent-cyan);
                box-shadow: 0 0 15px var(--accent-cyan-glow-active);
            }

            .hud-button:focus-visible {
                outline: 2px solid var(--accent-cyan);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * Module 1: Direct Photo Link Enhancement
     */
    const getDirectPhotoLink = () => {
        try {
            const currentUrl = window.location.href;
            const urlObj = new URL(currentUrl);

            const basePath = urlObj.origin + urlObj.pathname;
            const searchAndHash = urlObj.search + urlObj.hash;

            const sizeParamRegex = /(w\d+\-h\d+|s\d+)(?:-c|-k)?((?:\-[a-z]+)+)?/i;
            let newBasePath = basePath;

            const baseParts = basePath.split('=');

            if (baseParts.length > 1) {
                const lastPart = baseParts[baseParts.length - 1];
                if (!lastPart.startsWith('s0')) {
                    baseParts.pop();
                    newBasePath = baseParts.join('=') + '=s0';
                }
            } else if (sizeParamRegex.test(basePath)) {
                newBasePath = basePath.replace(sizeParamRegex, 's0');
            }

            const newUrl = newBasePath + searchAndHash;

            if (newUrl !== currentUrl) {
                window.location.replace(newUrl);
            }
        } catch (error) {
            logError('getDirectPhotoLink', error);
        }
    };

    /**
     * Module 2: Context Menu Integration
     */
    const removeContextMenuBlockers = () => {
        try {
            const enforceContext = (event) => {
                event.stopImmediatePropagation();
            };

            window.addEventListener('contextmenu', enforceContext, true);
            document.addEventListener('contextmenu', enforceContext, true);

            const observer = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'oncontextmenu') {
                        mutation.target.removeAttribute('oncontextmenu');
                    }
                }
            });

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
     * Module 3: OSINT Reverse Search HUD + Glassmorphism Styling
     */
    const displaySearchLinks = () => {
        try {
            if (document.getElementById('osint-links-4ndr0')) return;

            const src = window.location.href;
            const encodedSrc = encodeURIComponent(src);

            const linkBlock = document.createElement('div');
            linkBlock.id = 'osint-links-4ndr0';

            // Injecting the 4NDR0666 Glyph directly as inline SVG
            const glyphWrapper = document.createElement('div');
            glyphWrapper.style.marginBottom = '10px';
            glyphWrapper.style.display = 'flex';
            glyphWrapper.style.justifyContent = 'center';
            glyphWrapper.innerHTML = `
              <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style="width: 48px; height: 48px;" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
                <path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
                <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" fill="rgba(0, 0, 0, 0.4)" />
                <text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="46" font-weight="700" font-family="sans-serif">Ψ</text>
              </svg>
            `;
            linkBlock.appendChild(glyphWrapper);

            // Divider
            const divider = document.createElement('div');
            Object.assign(divider.style, {
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan-border-hover), transparent)',
                marginBottom: '5px'
            });
            linkBlock.appendChild(divider);

            // Using the requested button structure.
            const createLink = (text, targetUrl) => {
                const btn = document.createElement('a');
                btn.className = 'hud-button';
                btn.href = targetUrl;
                btn.target = '_blank';

                const span = document.createElement('span');
                span.textContent = text;
                btn.appendChild(span);

                return btn;
            };

            // Recon / Search array
            linkBlock.appendChild(createLink('[>] Google Lens', `https://lens.google.com/uploadbyurl?url=${encodedSrc}`));
            linkBlock.appendChild(createLink('[>] Yandex Recon', `https://yandex.com/images/search?rpt=imageview&img_url=${encodedSrc}`));
            linkBlock.appendChild(createLink('[>] TinEye Scan', `https://tineye.com/search?url=${encodedSrc}`));

            // Manipulation array
            linkBlock.appendChild(createLink('[+] ImgOps Triage', `https://imgops.com/${src}`));
            linkBlock.appendChild(createLink('[+] LunaPic Editor', `https://www.lunapic.com/editor/?action=url&url=${encodedSrc}`));

            document.body.appendChild(linkBlock);
        } catch (error) {
            logError('displaySearchLinks', error);
        }
    };

    /**
     * Module 4: 4NDR0666OS Notification Overlay (Electric-Glass styled)
     */
    const showNotification = (message) => {
        try {
            const notification = document.createElement('div');
            Object.assign(notification.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                padding: '16px 24px',
                background: 'var(--bg-dark)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan-border-hover)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                fontFamily: "var(--font-body)",
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '2147483647',
                borderRadius: '6px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                opacity: '0',
                transition: 'all 0.4s cubic-bezier(0.1, 0.7, 0.1, 1)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            });

            notification.innerHTML = `
                <svg viewBox="0 0 128 128" style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="4">
                    <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" />
                    <text x="64" y="70" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="60" font-weight="700">Ψ</text>
                </svg>
                <span>[ KERNEL ]: ${message}</span>
            `;

            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(-10px)';
            });

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(10px)';
                notification.addEventListener('transitionend', () => notification.remove());
            }, 4000);
        } catch (error) {
            logError('showNotification', error);
        }
    };

    /**
     * Initialization Vector
     */
    const initialize = () => {
        injectStyles();

        const currentHost = window.location.hostname;

        removeContextMenuBlockers();

        const isImage = document.contentType && document.contentType.startsWith('image/');

        if (currentHost.includes('googleusercontent.com') && isImage) {
            getDirectPhotoLink();
            displaySearchLinks();
        }

        if (currentHost.includes('google.com') || currentHost.includes('googleusercontent.com')) {
            showNotification('GLASSMORPHISM OVERRIDE ENGAGED');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
