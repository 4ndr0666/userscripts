// ==UserScript==
// @name         4ndr0tools - ModelSearch BETA
// @namespace    https://www.github.com/4ndr0666/userscripts
// @version      3.2.0-Ψ
// @description  Covert SimpCity search UI directly from any website. (Electric-Glass + Alt+S Hotkey Only)
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
// @match        *://*/*
// @icon         https://img.icons8.com/?size=30&id=44045&format=png
// @grant        GM_openInTab
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

/*
================================================================================
HOW TO USE
--------------------------------------------------------------------------------
Press  Alt + S  on any page to surface the overlay.
Type a model name and press Enter (or click "Execute Uplink").
Press  Escape  or click outside the modal to dismiss.

Changelog:
  v3.2.0-Ψ — Superset Protocol engineering audit pass (v3.1.0-Ψ → v3.2.0-Ψ).
    [BUG-1 FIXED]   #hideOverlay(): optional-chain guard on activeElement.shadowRoot
                    prevents TypeError on elements with no shadow root.
    [BUG-2 FIXED]   Alt+S handler: editable-element guard added — overlay will not
                    fire when user is typing in an INPUT, TEXTAREA, or
                    contenteditable element on the host page.
    [BUG-3 FIXED]   Font injection: GM_addStyle @import replaced with a programmatic
                    <link> element — reliable at document-start; @import inside
                    injected <style> tags is deprecated and silently dropped by
                    most browsers.
    [NOTE-2 FIXED]  Escape / visibility check: replaced style.display string
                    comparison with a private #isVisible boolean state flag —
                    robust against future CSS-class-based show/hide changes.
    [NOTE-1 KEPT]   title.innerHTML SVG: hardcoded static markup, zero XSS surface.
                    Documented as future watch-point in manifest.
================================================================================
*/

(function () {
    'use strict';

    /**
     * @class ModelSearchTool
     * @description Covert model-search UI via Shadow DOM + Alt+S hotkey.
     *
     * Architecture:
     *   - Closed Shadow DOM on a zero-size host div — fully isolated from host CSS/JS.
     *   - No persistent floating button. Alt+S is the exclusive trigger.
     *   - All state managed as private class fields; no global scope pollution.
     */
    class ModelSearchTool {

        // === CONFIGURATION ===
        static #SEARCH_URL_BASE = 'https://simpcity.su/search/14138808/';
        static #MAX_Z_INDEX     = '2147483647';
        static #FONT_URL        = 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Roboto+Mono:wght@400;500&display=swap';

        // === PRIVATE DOM REFERENCES ===
        #shadowHost      = null;
        #shadowRoot      = null;
        #overlayElement  = null;
        #inputElement    = null;
        #modalElement    = null;

        // === PRIVATE STATE ===
        // [v3.2.0] Boolean flag replaces style.display string comparison for
        // overlay visibility checks — resilient to CSS-class-based toggling.
        #isVisible = false;

        /**
         * Initializes the tool: fonts → UI → event bindings.
         */
        constructor() {
            try {
                this.#injectFonts();
                this.#createUI();
                this.#bindEvents();
            } catch (error) {
                console.error('[4NDR0666OS] Matrix Initialization Failure:', error);
            }
        }

        /**
         * Injects the Google Fonts stylesheet via a <link> element.
         *
         * [v3.2.0 BUG-3 FIX] GM_addStyle(@import) is deprecated inside injected
         * <style> tags and silently dropped by most browsers at document-start.
         * A programmatic <link> element is reliable at any document readyState.
         * @private
         */
        #injectFonts() {
            const link = document.createElement('link');
            link.rel  = 'stylesheet';
            link.href = ModelSearchTool.#FONT_URL;
            (document.head || document.documentElement).appendChild(link);
        }

        /**
         * Builds the entire UI inside an isolated closed Shadow DOM.
         * Host element is zero-size with pointer-events: none so it never
         * interferes with host page layout or interaction.
         * @private
         */
        #createUI() {
            if (!document.body && !document.documentElement) {
                throw new Error('[4NDR0666OS] Critical Failure: No viable host attachment point found.');
            }

            // === Shadow Host ===
            this.#shadowHost = document.createElement('div');
            this.#shadowHost.id = '4ndr0-glass-host';
            this.#shadowHost.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 0; height: 0;
                z-index: ${ModelSearchTool.#MAX_Z_INDEX} !important;
                overflow: visible;
                pointer-events: none;
            `;
            (document.body || document.documentElement).appendChild(this.#shadowHost);
            this.#shadowRoot = this.#shadowHost.attachShadow({ mode: 'closed' });

            // === Shadow Styles ===
            const style = document.createElement('style');
            style.textContent = `
                :host {
                    --bg-glass-panel:           rgba(10, 19, 26, 0.75);
                    --accent-cyan:              #00E5FF;
                    --text-cyan-active:         #67E8F9;
                    --accent-cyan-border-idle:  rgba(0, 229, 255, 0.2);
                    --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
                    --accent-cyan-bg-hover:     rgba(0, 229, 255, 0.05);
                    --accent-cyan-bg-active:    rgba(0, 229, 255, 0.2);
                    --glow-cyan-active:         rgba(0, 229, 255, 0.4);
                    --shadow-glass-base:        0 8px 32px 0 rgba(0, 0, 0, 0.37);
                    --edge-light-top:           rgba(255, 255, 255, 0.1);
                    --edge-light-left:          rgba(255, 255, 255, 0.1);
                    --text-primary:             #EAEAEA;
                    --text-secondary:           #9E9E9E;
                    --font-body:                'Roboto Mono', monospace;
                }

                * { box-sizing: border-box; pointer-events: auto; }

                #xenforo-search-overlay {
                    display: none;
                    position: fixed;
                    top: 0; left: 0;
                    width: 100vw; height: 100vh;
                    background-color: rgba(10, 19, 26, 0.4);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    justify-content: center;
                    align-items: center;
                }

                #xenforo-search-modal {
                    background: var(--bg-glass-panel);
                    border: 1px solid var(--accent-cyan-border-idle);
                    border-top: 1px solid var(--edge-light-top);
                    border-left: 1px solid var(--edge-light-left);
                    border-radius: 8px;
                    box-shadow: var(--shadow-glass-base);
                    padding: 25px;
                    width: 90%;
                    max-width: 400px;
                    font-family: var(--font-body);
                    color: var(--text-primary);
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }

                h2 {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: var(--accent-cyan);
                    margin: 0 0 20px 0;
                    border-bottom: 1px solid var(--accent-cyan-border-idle);
                    padding-bottom: 10px;
                    font-size: 1rem;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .title-glyph {
                    width: 28px;
                    height: 28px;
                    filter: drop-shadow(0 0 5px var(--glow-cyan-active));
                }

                .close-button {
                    position: absolute;
                    top: 10px; right: 15px;
                    font-size: 24px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: color 300ms ease-in-out;
                    line-height: 1;
                }
                .close-button:hover { color: var(--accent-cyan); }

                #xenforo-search-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                input {
                    background: #070B14;
                    color: var(--text-primary);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    padding: 12px;
                    border-radius: 6px;
                    font-family: var(--font-body);
                    font-size: 0.875rem;
                    transition: all 300ms ease-in-out;
                    outline: none;
                    width: 100%;
                }
                input::placeholder { color: var(--text-secondary); }
                input:focus {
                    border-color: var(--accent-cyan);
                    background-color: var(--accent-cyan-bg-active);
                    box-shadow: 0 0 15px var(--glow-cyan-active);
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                button[type="submit"] {
                    background: rgba(0, 0, 0, 0.3);
                    color: var(--text-secondary);
                    border: 1px solid transparent;
                    padding: 0.75rem 1rem;
                    border-radius: 6px;
                    font-family: var(--font-body);
                    font-weight: 500;
                    font-size: 0.875rem;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 300ms ease-in-out;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                button[type="submit"]:hover {
                    color: var(--accent-cyan);
                    border-color: var(--accent-cyan-border-hover);
                    background-color: var(--accent-cyan-bg-hover);
                }
                button[type="submit"]:active {
                    color: var(--text-cyan-active);
                    border-color: var(--accent-cyan);
                    background-color: var(--accent-cyan-bg-active);
                    box-shadow: 0 0 15px var(--glow-cyan-active);
                }
                button[type="submit"]:focus {
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                @supports not (backdrop-filter: blur(1px)) {
                    #xenforo-search-modal   { background: rgba(10, 19, 26, 0.95); }
                    #xenforo-search-overlay { background-color: rgba(10, 19, 26, 0.98); }
                }
            `;
            this.#shadowRoot.appendChild(style);

            // === DOM Nodes ===
            this.#overlayElement = document.createElement('div');
            this.#overlayElement.id = 'xenforo-search-overlay';
            this.#overlayElement.setAttribute('role', 'dialog');
            this.#overlayElement.setAttribute('aria-modal', 'true');
            this.#overlayElement.setAttribute('aria-labelledby', 'xenforo-modal-title');

            this.#modalElement = document.createElement('div');
            this.#modalElement.id = 'xenforo-search-modal';

            const closeButton = document.createElement('span');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '&times;'; // Static HTML entity — no XSS surface.
            closeButton.setAttribute('role', 'button');
            closeButton.setAttribute('aria-label', 'Close uplink');
            closeButton.setAttribute('tabindex', '0');

            // title.innerHTML: 100% hardcoded static SVG + text — no dynamic data,
            // zero XSS surface. Documented as future watch-point per NOTE-1.
            const title = document.createElement('h2');
            title.id = 'xenforo-modal-title';
            title.innerHTML = `
                <span>TARGET</span>
                <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="title-glyph" aria-hidden="true">
                    <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
                    <path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
                    <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
                    <text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text>
                </svg>
                <span>INITIALIZATION</span>
            `;

            const form = document.createElement('form');
            form.id = 'xenforo-search-form';

            this.#inputElement = document.createElement('input');
            this.#inputElement.type = 'text';
            this.#inputElement.id = 'xenforo-search-input';
            this.#inputElement.placeholder = 'Define parameters...';
            this.#inputElement.autocomplete = 'off';
            this.#inputElement.setAttribute('aria-label', 'Search query parameters');

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Execute Uplink';

            form.append(this.#inputElement, submitButton);
            this.#modalElement.append(closeButton, title, form);
            this.#overlayElement.appendChild(this.#modalElement);
            this.#shadowRoot.appendChild(this.#overlayElement);
        }

        /**
         * Binds all event listeners.
         *
         * Alt+S: surfaces overlay — guarded against firing inside editable host elements.
         * Escape: dismisses overlay — uses #isVisible flag, not style.display string.
         * Backdrop click, close-button click/keyboard: all close paths call #hideOverlay().
         * @private
         */
        #bindEvents() {
            const closeButton = this.#modalElement.querySelector('.close-button');
            const searchForm  = this.#modalElement.querySelector('#xenforo-search-form');

            // Close via × button (mouse)
            closeButton.addEventListener('click', () => this.#hideOverlay());

            // Close via × button (keyboard — Enter or Space)
            closeButton.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.#hideOverlay();
                }
            });

            // Close via backdrop click
            this.#overlayElement.addEventListener('click', (event) => {
                if (event.target === this.#overlayElement) {
                    this.#hideOverlay();
                }
            });

            // Global keydown: Alt+S open / Escape close
            document.addEventListener('keydown', (event) => {

                // === Alt+S — open overlay ===
                if (event.altKey && (event.key === 's' || event.key === 'S')) {
                    // [v3.2.0 BUG-2 FIX] Do not hijack Alt+S when the user is
                    // actively typing inside any editable element on the host page.
                    const tag      = document.activeElement?.tagName;
                    const editable = document.activeElement?.isContentEditable;
                    if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;

                    event.preventDefault();
                    this.#showOverlay();
                    return;
                }

                // === Escape — close overlay ===
                // [v3.2.0 NOTE-2 FIX] #isVisible flag replaces style.display === 'flex'
                // comparison — robust regardless of how display is toggled in future.
                if (event.key === 'Escape' && this.#isVisible) {
                    this.#hideOverlay();
                }
            });

            // Search form submission
            searchForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#performSearch();
            });
        }

        /**
         * Surfaces the overlay and focuses + selects the input.
         * focus() deferred via rAF — guarantees element is painted before focus attempt.
         * @private
         */
        #showOverlay() {
            this.#overlayElement.style.display = 'flex';
            this.#isVisible = true;
            requestAnimationFrame(() => {
                this.#inputElement.focus();
                this.#inputElement.select();
            });
        }

        /**
         * Hides the overlay and releases focus from the shadow tree gracefully.
         *
         * [v3.2.0 BUG-1 FIX] Optional chaining (?.) on activeElement.shadowRoot
         * prevents TypeError on elements that have no shadowRoot (the common case
         * for host-page inputs, body, etc.).
         * @private
         */
        #hideOverlay() {
            this.#overlayElement.style.display = 'none';
            this.#isVisible = false;
            // Release focus if it is still inside the shadow tree.
            if (document.activeElement?.shadowRoot === this.#shadowRoot) {
                document.activeElement.blur();
            }
        }

        /**
         * Constructs the search URL and opens it in a new tab.
         * Clears input and hides overlay on successful dispatch.
         * @private
         */
        #performSearch() {
            const query = this.#inputElement.value.trim();
            if (query) {
                const searchUrl = `${ModelSearchTool.#SEARCH_URL_BASE}?q=${encodeURIComponent(query)}&o=date`;
                GM_openInTab(searchUrl, { active: true });
                this.#hideOverlay();
                this.#inputElement.value = '';
            }
        }
    }

    // === INITIATION SEQUENCE ===
    // DOMContentLoaded guard ensures document.body exists before UI construction,
    // even when @run-at document-start fires before the parser reaches <body>.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new ModelSearchTool(), { once: true });
    } else {
        new ModelSearchTool();
    }

})();
