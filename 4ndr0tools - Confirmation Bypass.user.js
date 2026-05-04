// ==UserScript==
// @name         4ndr0tools - Confirmation Bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      3.0.0
// @description  Full turbo.cr bypass suite: Confirmation auto-skip + force /embed/ redirect + XenForo "Upload videos" injector + direct URL overlay on embed + xcandid/vidara URL overlay + external link safety.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @icon         data:image/png;base64,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
// @match        *://forums.socialmediagirls.com/*
// @match        *://forums.socialmediagirls.com/goto/link-confirmation*
// @match        *://simpcity.cr/redirect/*
// @match        *://turbo.cr/*
// @match        *://turbo.cr/embed/*
// @match        *://*.xcandid.vip/*
// @license      UNLICENSED - RED TEAM USE ONLY
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    console.log('%c[4ndr0tools] TurboBypass v3.0.0 — INITIATING SEQUENCE', 'color:#15FFFF; font-family:monospace; font-weight:bold;');

    const currentUrl  = window.location.href;
    const currentHost = window.location.hostname;

    // =========================================================================
    // MODULE 0: GLOBAL STYLES
    // =========================================================================
    // GM_addStyle is granted; apply consistently across all matched sites.
    GM_addStyle(`
        :root {
            --tb-cyan:   #15FFFF;
            --tb-yellow: #FFD700;
            --tb-glass:  rgba(10, 15, 26, 0.93);
        }
        .tb-url-overlay {
            position:     absolute;
            top:          12px;
            right:        12px;
            background:   var(--tb-glass);
            color:        var(--tb-cyan);
            padding:      6px 10px;
            font-size:    12px;
            font-family:  ui-monospace, monospace;
            border:       1px solid var(--tb-cyan);
            border-radius: 4px;
            z-index:      999999;
            cursor:       pointer;
            user-select:  none;
            max-width:    380px;
            word-break:   break-all;
            box-shadow:   0 0 12px rgba(21, 255, 255, 0.35);
            transition:   background 0.2s, color 0.2s;
        }
        .tb-url-overlay:hover {
            background: var(--tb-cyan);
            color: #000;
        }
    `);

    // =========================================================================
    // MODULE 1: UTILITIES
    // =========================================================================

    /**
     * Copies `text` to the clipboard.
     * Primary path: modern Clipboard API.
     * Fallback: execCommand (works in restricted / non-secure contexts).
     * Visual feedback is applied directly to `overlayEl`.
     *
     * @param {string}      text
     * @param {HTMLElement} overlayEl
     */
    function robustCopy(text, overlayEl) {
        const original = overlayEl.textContent;

        const onSuccess = () => {
            overlayEl.textContent      = 'COPIED ✓';
            overlayEl.style.color      = 'var(--tb-yellow)';
            overlayEl.style.borderColor = 'var(--tb-yellow)';
            setTimeout(() => {
                overlayEl.textContent      = original;
                overlayEl.style.color      = '';
                overlayEl.style.borderColor = '';
            }, 1400);
            console.log(`[4ndr0tools] Copied: ${text}`);
        };

        const onFailure = (err) => {
            overlayEl.textContent = 'FAILED ✗';
            setTimeout(() => { overlayEl.textContent = original; }, 1500);
            console.error('[4ndr0tools] Copy failed:', err);
        };

        const legacyCopy = () => {
            const ta = Object.assign(document.createElement('textarea'), {
                value: text,
            });
            Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px', opacity: '0' });
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                if (document.execCommand('copy')) { onSuccess(); }
                else                              { onFailure(new Error('execCommand returned false')); }
            } catch (e) {
                onFailure(e);
            } finally {
                ta.remove();
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(legacyCopy);
        } else {
            legacyCopy();
        }
    }

    // =========================================================================
    // MODULE 2: CONFIRMATION PAGE BYPASS
    // Targets: /goto/link-confirmation, /redirect
    // =========================================================================

    function initializeConfirmationBypass() {
        console.log('[4ndr0tools] Confirmation gateway detected. Hunting bypass vector…');

        // Covers XenForo CTA button, button-text child, and SimpCity proxy link.
        const SELECTOR = '.button--cta, .button--cta .button-text, .simpLinkProxy-continue';

        const tryClick = () => {
            const btn = document.querySelector(SELECTOR);
            if (!btn) return false;
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            console.log('[4ndr0tools] Confirmation button triggered.');
            return true;
        };

        // Immediate attempt (page may already be ready).
        if (tryClick()) return;

        // DOM-aware fallback — bounded by MAX_ATTEMPTS to prevent leaks.
        let attempts = 0;
        const MAX    = 60; // 30 s @ 500 ms
        const iv     = setInterval(() => {
            attempts++;
            if (tryClick() || attempts >= MAX) {
                clearInterval(iv);
                if (attempts >= MAX) {
                    console.warn('[4ndr0tools] Confirmation button not found after 30 s. Aborting.');
                }
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(iv), { once: true });
    }

    // =========================================================================
    // MODULE 3: TURBO.CR ROUTING
    // Redirects non-embed turbo.cr pages to the clean /embed/ player.
    // =========================================================================

    function initializeTurboRedirect() {
        const path    = window.location.pathname;
        // Matches /v/ID and bare /ID, including IDs with hyphens and underscores.
        const idMatch = path.match(/^\/(?:v\/)?([\w-]+)$/);

        if (idMatch && idMatch[1] && !path.startsWith('/embed/')) {
            const target = `https://turbo.cr/embed/${idMatch[1]}`;
            console.log(`[4ndr0tools] Canonical routing: → ${target}`);
            window.location.replace(target);
        }
    }

    // =========================================================================
    // MODULE 4: VIDEO URL OVERLAY
    // Creates a click-to-copy overlay on top of a video element.
    // Supports: #main-video (turbo.cr), vidara iframes/sources (xcandid).
    // =========================================================================

    /** Tracks URLs that already have an overlay so we never double-inject. */
    const _overlaidUrls = new Set();

    /**
     * Attaches a copy overlay to the nearest positioned ancestor of `videoEl`.
     * The overlay auto-removes after `ttl` ms (default 20 s) to keep the UI clean.
     *
     * @param {Element} videoEl   - The source video/iframe/source element.
     * @param {string}  url       - The URL to display and copy.
     * @param {number}  [ttl]     - Auto-remove timeout in ms (0 = never).
     */
    function attachOverlay(videoEl, url, ttl = 20000) {
        if (!url || _overlaidUrls.has(url)) return;
        _overlaidUrls.add(url);

        // Build overlay element.
        const el       = document.createElement('div');
        el.id          = `tb-overlay-${Math.random().toString(36).slice(2, 8)}`;
        el.className   = 'tb-url-overlay';
        el.textContent = url.length > 65 ? url.slice(0, 62) + '…' : url;
        el.title       = url; // full URL on hover

        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            robustCopy(url, el);
        });

        // Walk upward until we find a positioned container.
        let container = videoEl.parentElement;
        while (container && getComputedStyle(container).position === 'static') {
            container = container.parentElement;
        }
        if (!container) container = document.body;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(el);
        console.log(`[4ndr0tools] Overlay attached: ${url}`);

        if (ttl > 0) {
            setTimeout(() => { el.remove(); _overlaidUrls.delete(url); }, ttl);
        }
    }

    /**
     * Polls for #main-video on turbo.cr embed pages, then attaches the overlay.
     */
    function addVideoUrlOverlay() {
        console.log('[4ndr0tools] Embed context — polling for #main-video…');
        let attempts = 0;
        const MAX    = 30; // 15 s @ 500 ms

        const iv = setInterval(() => {
            attempts++;
            const video = document.querySelector('#main-video');
            if (video && video.src) {
                clearInterval(iv);
                attachOverlay(video, video.src, 0); // permanent on embed page
            } else if (attempts >= MAX) {
                clearInterval(iv);
                console.warn('[4ndr0tools] #main-video not found after 15 s. Aborting overlay.');
            }
        }, 500);

        window.addEventListener('beforeunload', () => clearInterval(iv), { once: true });
    }

    /**
     * Scans for vidara/xcandid video sources and attaches overlays.
     * Called on load and via a lightweight MutationObserver.
     */
    function scanForVideos() {
        // vidara iframes, <video>, and <source> elements
        document.querySelectorAll(
            'iframe[src*="vidara.to"], video[src*="vidara.to"], source[src*="vidara.to"]'
        ).forEach(el => {
            const src = el.src || el.getAttribute('src') || '';
            if (src) attachOverlay(el, src, 20000);
        });

        // Also pick up #main-video if somehow present on xcandid
        const mv = document.querySelector('#main-video');
        if (mv && mv.src) attachOverlay(mv, mv.src, 0);
    }

    function initializeXcandidOverlay() {
        setTimeout(scanForVideos, 800);
        setTimeout(scanForVideos, 2500);

        const obs = new MutationObserver(scanForVideos);
        obs.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // =========================================================================
    // MODULE 5: FORUM ENHANCEMENTS (XenForo)
    // Injects "Upload videos" button and handles postMessage from turbo.cr upload.
    // =========================================================================

    function initializeForumEnhancements() {
        // --- Upload button injection via bounded MutationObserver ---
        const btnObserver = new MutationObserver((_, obs) => {
            const groups = document.getElementsByClassName('formButtonGroup-extra');
            if (groups.length > 0 && !document.getElementById('turbo-video-upload-btn')) {
                groups[0].insertAdjacentHTML('beforeend', `
                    <div class="formButtonGroup">
                        <button id="turbo-video-upload-btn"
                                type="button" tabindex="-1" role="button"
                                title="Upload videos to turbo.cr"
                                class="button--link js-attachmentUpload button button--icon button--icon--upload fa--xf rippleButton"
                                onclick="window.__turboPrepareTurboFrame()">
                            <span class="button-text">Upload videos</span>
                        </button>
                    </div>
                `);
                console.log('[4ndr0tools] XenForo upload button injected.');
                obs.disconnect(); // single-use; release immediately
            }
        });
        btnObserver.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => btnObserver.disconnect(), { once: true });

        // Expose via namespaced global to avoid collisions with other scripts.
        window.__turboPrepareTurboFrame = function () {
            const features = 'screenX=0,screenY=0,top=0,left=0,scrollbars,width=100,height=100';
            const win      = window.open('https://turbo.cr/upload/api', 'turboUpload', features);
            if (win) win.resizeBy(400, 600);
            window.__turboUploadFrame = win;
        };

        // --- postMessage handler: inject BBCode / rich-text after upload ---
        const onMessage = (event) => {
            if (!event.origin.startsWith('https://turbo.cr')) return;

            if (String(event.data).includes('close')) {
                window.__turboUploadFrame?.close();
                return;
            }

            const frElements = document.getElementsByClassName('fr-element');
            if (frElements.length === 0) return;

            const bbCode  = `[MEDIA=saint_vid]${event.data}[/MEDIA]`;
            const wrappers = document.getElementsByClassName('fr-wrapper');

            if (wrappers.length > 0 && wrappers[0].style.display === 'none') {
                // BBCode mode: find the plain-text rich-text box
                const boxes = document.querySelectorAll('[aria-label="Rich text box"]');
                if (boxes.length > 0) boxes[0].value += bbCode;
            } else {
                // WYSIWYG (Froala) mode
                frElements[0].insertAdjacentHTML('beforeend', `<p>${bbCode}</p>`);
            }
            console.log(`[4ndr0tools] Media ID injected: ${event.data}`);
        };

        window.addEventListener('message', onMessage);
        window.addEventListener('beforeunload', () => window.removeEventListener('message', onMessage), { once: true });
    }

    // =========================================================================
    // MODULE 6: EXTERNAL LINK SAFETY (forum pages)
    // Forces external links to open in new tabs with noopener + noreferrer.
    // =========================================================================

    function initializeExternalLinkSafety() {
        const internalOrigin = location.origin;

        const secureLink = (event) => {
            const anchor = event.target.closest('a[href]');
            if (!anchor) return;

            try {
                const dest = new URL(anchor.href, location.href);
                if (dest.origin === internalOrigin) return; // internal — leave alone

                anchor.target = '_blank';
                const relSet  = new Set((anchor.rel || '').split(/\s+/).filter(Boolean));
                relSet.add('noopener');
                relSet.add('noreferrer');
                anchor.rel = [...relSet].join(' ');
            } catch (e) {
                // Silently ignore unparseable hrefs (data:, javascript:, etc.)
            }
        };

        document.body.addEventListener('click', secureLink, true);
    }

    // =========================================================================
    // ORCHESTRATOR
    // Single decision point — exactly one branch executes per page load.
    // =========================================================================

    function orchestrate() {
        // --- Confirmation / redirect gateway ---
        if (currentUrl.includes('/goto/link-confirmation') || currentUrl.includes('/redirect')) {
            initializeConfirmationBypass();
            return;
        }

        // --- turbo.cr ---
        if (currentHost.includes('turbo.cr')) {
            if (currentUrl.includes('/embed/')) {
                addVideoUrlOverlay();   // overlay on clean embed page
            } else {
                initializeTurboRedirect(); // force redirect to /embed/
            }
            return;
        }

        // --- xcandid / vidara ---
        if (currentHost.includes('xcandid.vip')) {
            initializeXcandidOverlay();
            return;
        }

        // --- Forum pages (socialmediagirls, etc.) ---
        initializeForumEnhancements();
        initializeExternalLinkSafety();
    }

    orchestrate();

})();
