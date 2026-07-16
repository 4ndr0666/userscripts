// ==UserScript==
// @name         4ndr0tools - Confirmation Bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.5.2
// @author       4ndr0666
// @description  Forum enhancements: reveal invisi text, view all replies, Download Gate: bypasses all confirm btns, context overlay to copy URL, auto resolve captcha, right-click scrollbar to-top.
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://forums.socialmediagirls.com/*
// @match        *://forums.socialmediagirls.com/goto/link-confirmation*
// @match        *://simpcity.cr/redirect/*
// @match        *://turbo.cr/*
// @match        *://turbo.cr/embed/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    const currentUrl  = window.location.href;
    const currentHost = window.location.hostname;
    const params      = new URLSearchParams(window.location.search);
    const _overlaidUrls = new Set();

    console.log('%c[4ndr0tools] Unified Pipeline v3.5.2 — SECURED', 'color:#00E5FF; font-family:"Roboto Mono",monospace; font-weight:bold;');

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Global_Styles ] — Electric-Glass Design Spec v1.5.0-Ψ
    // Selectors prefixed cb4- to prevent host-site bleed (§4 §2).
    // Tokens on :root with cb4-- prefix — unique enough not to clash.
    // ══════════════════════════════════════════════════════════════════════════
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Cinzel+Decorative:wght@700&display=swap');

        :root {
            --cb4-bg-dark-base:   #050A0F;
            --cb4-bg-glass-panel: rgba(10, 19, 26, 0.25);
            --cb4-accent-cyan:    #00E5FF;
            --cb4-text-active:    #67E8F9;
            --cb4-border-idle:    rgba(0, 229, 255, 0.2);
            --cb4-border-hover:   rgba(0, 229, 255, 0.5);
            --cb4-bg-hover:       rgba(0, 229, 255, 0.05);
            --cb4-bg-active:      rgba(0, 229, 255, 0.2);
            --cb4-glow:           rgba(0, 229, 255, 0.4);
            --cb4-shadow-base:    0 8px 32px 0 rgba(0, 0, 0, 0.37);
            --cb4-shadow-glow:    0 8px 32px 0 rgba(0, 229, 255, 0.15);
            --cb4-edge-top:       rgba(255, 255, 255, 0.1);
            --cb4-edge-left:      rgba(255, 255, 255, 0.1);
            --cb4-text-primary:   #EAEAEA;
            --cb4-text-secondary: #9E9E9E;
            --cb4-font-body:      'Roboto Mono', monospace;
        }

        /* ── URL CONTEXT OVERLAY — Glass Engine §2 ──────────────────────── */
        .cb4-url-overlay {
            position:              absolute;
            top:                   12px;
            right:                 12px;
            background:            var(--cb4-bg-glass-panel);
            backdrop-filter:       blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border:                1px solid var(--cb4-border-idle);
            border-top:            1px solid var(--cb4-edge-top);
            border-left:           1px solid var(--cb4-edge-left);
            box-shadow:            var(--cb4-shadow-base), var(--cb4-shadow-glow);
            border-radius:         6px;
            color:                 var(--cb4-accent-cyan);
            font-size:             11px;
            font-family:           var(--cb4-font-body);
            padding:               10px 14px;
            z-index:               2147483647;
            cursor:                pointer;
            user-select:           none;
            max-width:             440px;
            word-break:            break-all;
            transition:            all 300ms ease-in-out;
        }

        /* Fallback: no backdrop-filter support §4 §1 */
        @supports not (backdrop-filter: blur(1px)) {
            .cb4-url-overlay { background: rgba(10, 19, 26, 0.95); }
        }

        .cb4-url-overlay:hover {
            color:        var(--cb4-bg-dark-base);
            background:   var(--cb4-accent-cyan);
            border-color: var(--cb4-accent-cyan);
            box-shadow:   0 0 25px var(--cb4-glow);
            transform:    translateY(-2px);
        }

        .cb4-copy-hint {
            display:        block;
            font-size:      8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            opacity:        0.7;
            margin-top:     6px;
            padding-top:    4px;
            border-top:     1px solid var(--cb4-border-idle);
        }

        /* ── UPLOAD BUTTON — Interactive Topology §3 ─────────────────────── */
        #cb4-upload-btn {
            display:         inline-flex;
            align-items:     center;
            justify-content: center;
            padding:         0.5rem 1rem;
            font-family:     var(--cb4-font-body);
            font-size:       0.875rem;
            font-weight:     500;
            letter-spacing:  0.05em;
            text-transform:  uppercase;
            cursor:          pointer;
            color:           var(--cb4-text-secondary);
            background:      rgba(0, 0, 0, 0.3);
            border:          1px solid transparent;
            border-radius:   6px;
            transition:      all 300ms ease-in-out;
            text-decoration: none;
        }
        #cb4-upload-btn:hover {
            color:            var(--cb4-accent-cyan);
            border-color:     var(--cb4-border-hover);
            background-color: var(--cb4-bg-hover);
        }
        #cb4-upload-btn:active {
            color:            var(--cb4-text-active);
            background-color: var(--cb4-bg-active);
            border-color:     var(--cb4-accent-cyan);
            box-shadow:       0 0 15px var(--cb4-glow);
        }
        #cb4-upload-btn:focus-visible {
            outline:        2px solid var(--cb4-accent-cyan);
            outline-offset: 2px;
        }

        /* ── ALTCHA PROCESSING INDICATOR §3 active ───────────────────────── */
        .cb4-altcha-processing .altcha-checkbox input[type="checkbox"] {
            outline:        2px solid var(--cb4-accent-cyan) !important;
            outline-offset: 2px !important;
            box-shadow:     0 0 8px var(--cb4-glow) !important;
            transition:     all 300ms ease-in-out !important;
        }
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Robust_Copy ]
    // Source: A (primary) + C onFailure path cherry-picked.
    // Saves innerHTML+color+border+background+shadow; restores all on timeout.
    // legacyCopy: try/catch/finally with execCommand return-value check.
    // ══════════════════════════════════════════════════════════════════════════
    function robustCopy(text, overlayEl) {
        const originalHTML   = overlayEl.innerHTML;
        const originalColor  = overlayEl.style.color;
        const originalBorder = overlayEl.style.borderColor;
        const originalBg     = overlayEl.style.background;
        const originalShadow = overlayEl.style.boxShadow;

        const restore = () => {
            overlayEl.innerHTML        = originalHTML;
            overlayEl.style.color      = originalColor;
            overlayEl.style.borderColor = originalBorder;
            overlayEl.style.background  = originalBg;
            overlayEl.style.boxShadow   = originalShadow;
        };

        const onSuccess = () => {
            overlayEl.textContent       = 'COPIED TO CLIPBOARD ✓';
            // Literal values — var() is inert on inline style
            overlayEl.style.color       = '#67E8F9';
            overlayEl.style.borderColor = '#00E5FF';
            overlayEl.style.background  = 'rgba(0, 229, 255, 0.2)';
            overlayEl.style.boxShadow   = '0 0 15px rgba(0, 229, 255, 0.4)';
            setTimeout(restore, 1400);
            console.log(`[4ndr0tools] Payload buffered: ${text}`);
        };

        // Cherry-picked from C: explicit failure feedback
        const onFailure = (err) => {
            overlayEl.textContent = 'COPY FAILED ✗';
            overlayEl.style.color = '#FF4444';
            setTimeout(restore, 1500);
            console.error('[4ndr0tools] Copy failed:', err);
        };

        const legacyCopy = () => {
            const ta = Object.assign(document.createElement('textarea'), { value: text });
            Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px', opacity: '0' });
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                // Cherry-picked from C: check return value
                if (document.execCommand('copy')) { onSuccess(); }
                else { onFailure(new Error('execCommand returned false')); }
            } catch (err) {
                onFailure(err);
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

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Confirmation_Bypass ]
    // Source: A canonical. MutationObserver + static pre-check + dispatchEvent.
    // B's plain btn.click() dropped (less faithful to real user interaction).
    // C's setInterval polling dropped (§4.6 LBYL fail).
    // ══════════════════════════════════════════════════════════════════════════
    function initializeConfirmationBypass() {
        const SELECTOR = '.button--cta, .button--cta .button-text, .simpLinkProxy-continue';

        const triggerExecution = (element) => {
            if (!element) return false;
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            console.log('[4ndr0tools] Gateway validation signal bypassed.');
            return true;
        };

        const staticCheck = document.querySelector(SELECTOR);
        if (staticCheck && triggerExecution(staticCheck)) return;

        const observer = new MutationObserver((_, obs) => {
            const targetNode = document.querySelector(SELECTOR);
            if (targetNode && triggerExecution(targetNode)) { obs.disconnect(); }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Turbo_Redirect ]
    // Source: A canonical. Matches /v/, /d/, and bare IDs. bypass=0 guard kept.
    // B's narrowed regex (dropped /d/) is a regression — kept A's.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeTurboRedirect() {
        if (params.get('bypass') === '0') {
            console.log('[4ndr0tools] Direct diagnostic land verified. Redirection bypassed.');
            return;
        }
        const path    = window.location.pathname;
        const idMatch = path.match(/^\/(?:v\/|d\/)?([\w-]+)$/);
        if (idMatch && idMatch[1] && !path.startsWith('/embed/')) {
            window.location.replace(`https://turbo.cr/embed/${idMatch[1]}`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Attach_Overlay ]
    // Source: A canonical. stopImmediatePropagation on click kept (B dropped it).
    // ══════════════════════════════════════════════════════════════════════════
    function attachOverlay(videoEl, url, ttl = 20000) {
        if (!url || _overlaidUrls.has(url)) return;
        _overlaidUrls.add(url);

        const el = document.createElement('div');
        el.className = 'cb4-url-overlay';
        const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
        el.innerHTML = `${displayUrl}<span class="cb4-copy-hint">Click: Copy URL \u2502 Right-Click: Download</span>`;
        el.title = url;

        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            robustCopy(url, el);
        });

        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (currentHost.includes('turbo.cr')) {
                const idMatch = window.location.pathname.match(/^\/(?:v\/|d\/|embed\/)?([\w-]+)$/);
                if (idMatch && idMatch[1]) {
                    window.open(`https://turbo.cr/d/${idMatch[1]}?bypass=0`, '_blank');
                    return;
                }
            }
            const dlUrlFallback = url.replace('/embed/', '/d/').split('?')[0] + '?bypass=0';
            window.open(dlUrlFallback, '_blank');
        });

        let container = videoEl.parentElement;
        while (container && getComputedStyle(container).position === 'static') {
            container = container.parentElement;
        }
        if (!container) container = document.body;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(el);

        if (ttl > 0) {
            setTimeout(() => { el.remove(); _overlaidUrls.delete(url); }, ttl);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Turbo_Embed_Scan ]
    // Source: A canonical. Static pre-check before observer (B dropped this).
    // Observer disconnects on match (B leaked indefinitely).
    // ══════════════════════════════════════════════════════════════════════════
    function addVideoUrlOverlay() {
        const staticTarget = document.querySelector('#main-video');
        if (staticTarget && staticTarget.src) {
            attachOverlay(staticTarget, staticTarget.src, 0);
            return;
        }
        const obs = new MutationObserver((_, observerInstance) => {
            const video = document.querySelector('#main-video');
            if (video && video.src) {
                attachOverlay(video, video.src, 0);
                observerInstance.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Altcha_Solver ]
    // Source: A canonical — verbatim from the provided reference implementation.
    // CONFIG.lockAttr kept as data-cb4-lock (namespaced).
    // cb4-altcha-processing class adds Electric-Glass glow during solve.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeAltchaSolver() {
        const CONFIG = {
            debounceMs: 50,
            lockoutMs:  3000,
            lockAttr:   'data-cb4-lock',
        };

        function interactWithCaptcha(container, checkbox) {
            const label         = container.querySelector(`label[for="${checkbox.id}"]`);
            const targetElement = label || checkbox;

            container.classList.add('cb4-altcha-processing');
            checkbox.setAttribute(CONFIG.lockAttr, 'true');
            console.log('[4ndr0tools] Solving Altcha...');

            targetElement.focus();

            // view: window throws in GM sandboxes — the sandbox proxy is not a
            // real Window and WebIDL rejects it. Resolve the page's actual
            // Window via the element's ownerDocument.defaultView (null is valid).
            const view = targetElement.ownerDocument?.defaultView ?? null;
            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
                targetElement.dispatchEvent(new MouseEvent(eventType, {
                    view, bubbles: true, cancelable: true, buttons: 1,
                }));
            });

            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('input',  { bubbles: true }));
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            setTimeout(() => {
                if (checkbox.hasAttribute(CONFIG.lockAttr)) {
                    checkbox.removeAttribute(CONFIG.lockAttr);
                }
                container.classList.remove('cb4-altcha-processing');
            }, CONFIG.lockoutMs);
        }

        function scanAndSolve() {
            try {
                document.querySelectorAll('.altcha[data-state="unverified"]').forEach(container => {
                    const checkbox = container.querySelector('.altcha-checkbox input[type="checkbox"]');
                    if (checkbox && !checkbox.hasAttribute(CONFIG.lockAttr)) {
                        interactWithCaptcha(container, checkbox);
                    }
                });
            } catch (error) {
                console.error('[4ndr0tools] Altcha scan error:', error);
            }
        }

        let debounceTimer;
        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(scanAndSolve, CONFIG.debounceMs);
        });

        const targetNode = document.body || document.documentElement;
        if (targetNode) {
            observer.observe(targetNode, {
                childList:       true,
                subtree:         true,
                attributes:      true,
                attributeFilter: ['data-state'],
            });
        }

        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });

        scanAndSolve();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Forum_Enhancements ]
    // Source: A DOM construction + cleanup (retained).
    // Cherry-picked from C: tabindex="-1", role="button", title attr for ARIA;
    // __cb4OpenUpload namespace (avoids collision); index-safe fr-element access;
    // postMessage listener torn down in beforeunload.
    // B's insertAdjacentHTML string approach dropped (no ARIA, no cleanup).
    // ══════════════════════════════════════════════════════════════════════════
    function initializeForumEnhancements() {
        const btnObs = new MutationObserver((_, obs) => {
            const group = document.querySelector('.formButtonGroup-extra');
            if (group && !document.getElementById('cb4-upload-btn')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'formButtonGroup';

                const btn = document.createElement('button');
                btn.id        = 'cb4-upload-btn';
                btn.type      = 'button';
                btn.tabIndex  = -1;
                btn.setAttribute('role',  'button');
                btn.setAttribute('title', 'Upload videos to turbo.cr');
                btn.setAttribute('aria-label', 'Upload video via Turbo');
                btn.className = 'button--link button button--icon button--icon--upload';
                btn.textContent = 'Upload Video';
                btn.addEventListener('click', () => window.__cb4OpenUpload?.());

                wrapper.appendChild(btn);
                group.appendChild(wrapper);
                obs.disconnect();
            }
        });
        btnObs.observe(document.documentElement, { childList: true, subtree: true });

        // Cherry-picked from C: namespaced global, resizeBy for better UX
        window.__cb4OpenUpload = () => {
            const features = 'screenX=0,screenY=0,top=0,left=0,scrollbars,width=100,height=100';
            const win = window.open('https://turbo.cr/upload/api', 'turboUpload', features);
            if (win) win.resizeBy(400, 600);
            window.__turboUploadWin = win;
        };

        const receivePostMessage = (e) => {
            if (!e.origin.startsWith('https://turbo.cr')) return;
            if (String(e.data).includes('close')) {
                window.__turboUploadWin?.close();
                return;
            }
            // Cherry-picked from C: index-safe access (frElements[0], boxes[0])
            const frElements = document.getElementsByClassName('fr-element');
            if (frElements.length === 0) return;

            const bb       = `[MEDIA=saint_vid]${e.data}[/MEDIA]`;
            const wrappers = document.getElementsByClassName('fr-wrapper');

            if (wrappers.length > 0 && wrappers[0].style.display === 'none') {
                const boxes = document.querySelectorAll('[aria-label="Rich text box"]');
                if (boxes.length > 0) boxes[0].value += bb;
            } else {
                frElements[0].insertAdjacentHTML('beforeend', `<p>${bb}</p>`);
            }
            console.log(`[4ndr0tools] Media payload embedded: ${e.data}`);
        };

        window.addEventListener('message', receivePostMessage);
        window.addEventListener('beforeunload', () => {
            btnObs.disconnect();
            window.removeEventListener('message', receivePostMessage);
        }, { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_External_Link_Safety ]
    // Source: A Set-based rel handling (superset of B's string assignment).
    // Cherry-picked from C: try/catch around new URL() parse to silently
    // ignore javascript:, data:, and other non-parseable href schemes.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeExternalLinkSafety() {
        const internalOrigin = location.origin;

        const secureLink = (e) => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            try {
                const dest = new URL(a.href, location.href);
                if (dest.origin === internalOrigin) return;
            } catch {
                return; // silently ignore javascript:, data:, etc.
            }
            a.target = '_blank';
            const relSet = new Set((a.rel || '').split(/\s+/).filter(Boolean));
            relSet.add('noopener');
            relSet.add('noreferrer');
            a.rel = [...relSet].join(' ');
        };

        document.body.addEventListener('click', secureLink, true);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Scrollbar_Top ] — NEW in v3.5.0
    // Source: right-click snippet, verbatim logic.
    // Detects right-click on scrollbar track via clientX vs innerWidth heuristic.
    // HTML tag → page top; nested element tag → element top; BODY → ignored.
    // Suppresses context menu only when scrollbar is the target.
    // ══════════════════════════════════════════════════════════════════════════
    function getScrollBarWidth() {
        const div = document.createElement('div');
        Object.assign(div.style, {
            overflow:   'scroll',
            visibility: 'hidden',
            width:      '100px',
            height:     '100px',
        });
        document.body.appendChild(div);

        const innerDiv = document.createElement('div');
        Object.assign(innerDiv.style, { width: '100%', height: '100%' });
        div.appendChild(innerDiv);

        const width = div.offsetWidth - innerDiv.offsetWidth;
        div.parentNode.removeChild(div);
        return width;
    }

    function initializeScrollbarContextMenu() {
        const scrollBarWidth = getScrollBarWidth() || 15;

        document.addEventListener('contextmenu', (e) => {
            const isScrollbar = e.clientX > window.innerWidth - scrollBarWidth - 10;
            if (!isScrollbar) return;

            if (e.target.tagName === 'HTML') {
                window.scrollTo(0, 0);
            } else if (e.target.tagName !== 'BODY') {
                e.target.scrollTo(0, 0);
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Download_Trigger ]
    // Fires after Altcha resolves on the turbo.cr download landing page.
    // Watches for #downloadBtn to appear (it may render after the captcha
    // state change) then clicks it programmatically.
    // Uses ownerDocument.defaultView for the MouseEvent view to avoid the
    // GM sandbox proxy rejection (same fix as U_Altcha_Solver).
    // A 300 ms grace delay lets the page re-enable the button after the
    // captcha completes before the click fires.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeDownloadTrigger() {
        const SELECTOR = '#downloadBtn';
        const GRACE_MS = 300; // allow page to re-enable btn after captcha

        const clickDownload = (btn) => {
            if (btn.hasAttribute('data-cb4-dl-clicked')) return;
            btn.setAttribute('data-cb4-dl-clicked', 'true');
            console.log('[4ndr0tools] Download button triggered.');
            const view = btn.ownerDocument?.defaultView ?? null;
            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
                btn.dispatchEvent(new MouseEvent(type, {
                    view, bubbles: true, cancelable: true, buttons: 1,
                }));
            });
        };

        const attempt = () => {
            const btn = document.querySelector(SELECTOR);
            if (btn) {
                setTimeout(() => clickDownload(btn), GRACE_MS);
                return true;
            }
            return false;
        };

        if (attempt()) return;

        // Button may not exist yet — watch for it
        const obs = new MutationObserver((_, observerInstance) => {
            if (attempt()) observerInstance.disconnect();
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Orchestrator ]
    // Altcha runs only where captchas can actually appear:
    //   - confirmation/redirect pages (before bypass fires)
    //   - turbo.cr download landing (bypass=0, opened via right-click)
    //   - forum pages (login/registration flows)
    // Scrollbar right-click-to-top runs on every matched page unconditionally.
    // ══════════════════════════════════════════════════════════════════════════
    function orchestrate() {
        // Scrollbar context-menu is UI utility — runs everywhere
        initializeScrollbarContextMenu();

        // ── Confirmation / redirect gate ──────────────────────────────────────
        if (currentUrl.includes('/goto/link-confirmation') || currentUrl.includes('/redirect')) {
            initializeAltchaSolver();
            initializeConfirmationBypass();
            return;
        }

        // ── turbo.cr ──────────────────────────────────────────────────────────
        if (currentHost.includes('turbo.cr')) {
            if (currentUrl.includes('/embed/')) {
                // Embed player: overlay shows URL; right-click opens download landing
                addVideoUrlOverlay();
            } else if (params.get('bypass') === '0') {
                // Download landing (opened via right-click on overlay).
                // Altcha solves first; once it resolves the download button
                // appears/enables and U_Download_Trigger clicks it.
                initializeAltchaSolver();
                initializeDownloadTrigger();
            } else {
                // All other turbo.cr paths → canonical redirect to /embed/
                initializeTurboRedirect();
            }
            return;
        }


        // ── Forum pages (SMG / Simpcity) ──────────────────────────────────────
        initializeAltchaSolver();
        initializeForumEnhancements();
        initializeExternalLinkSafety();
    }

    orchestrate();

})();
