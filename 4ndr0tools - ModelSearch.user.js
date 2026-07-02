// ==UserScript==
// @name         4ndr0tools - ModelSearch
// @namespace    https://www.github.com/4ndr0666/userscripts
// @version      2.1
// @description  Electric-Glass UI — direct SimpCity model search from any page.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        GM_openInTab
// @grant        GM_addStyle
// ==/UserScript==

/*
================================================================================
HOW TO USE THIS SCRIPT
--------------------------------------------------------------------------------
A floating Ψ trigger button is fixed at the top-right of every page.
Click it to open the Electric-Glass search overlay. Type a model name and
press Enter or click SEARCH — results open in a new tab on Simpcity.cr.

Click outside the modal or press Escape to dismiss.
================================================================================
*/

(function () {
    'use strict';

    /* ──────────────────────────────────────────────────────────────────────────
       ELECTRIC-GLASS CSS (§4 DOM Clashes: all selectors namespaced to #ms4-*)
       Shadow DOM is used for the modal to prevent host CSS bleed.
       GM_addStyle covers the floating trigger button only (lives in main DOM).
    ────────────────────────────────────────────────────────────────────────── */
    GM_addStyle(`
        /* Google Fonts — Roboto Mono (body) + Cinzel Decorative (glyph Ψ core) */
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Cinzel+Decorative:wght@700&display=swap');

        /* ── FLOATING TRIGGER BUTTON ─────────────────────────────────────── */
        #ms4-trigger {
            all: unset;
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            z-index: 2147483647 !important;

            /* Glass Engine — §2 */
            background: rgba(10, 19, 26, 0.25) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(0, 229, 255, 0.2) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
            border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37),
                        0 8px 32px 0 rgba(0, 229, 255, 0.15) !important;
            border-radius: 8px !important;

            /* Layout — 52px gives the 128-viewBox glyph breathing room */
            width: 52px !important;
            height: 52px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;

            /* Interactive Topology — §3 base */
            color: #9E9E9E !important;
            transition: all 300ms ease-in-out !important;
        }

        #ms4-trigger:hover {
            color: #00E5FF !important;
            border-color: rgba(0, 229, 255, 0.5) !important;
            background-color: rgba(0, 229, 255, 0.05) !important;
            box-shadow: 0 0 15px rgba(0, 229, 255, 0.4),
                        0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
        }

        #ms4-trigger:focus-visible {
            outline: 2px solid #00E5FF !important;
            outline-offset: 2px !important;
        }

        #ms4-trigger svg {
            width: 34px !important;
            height: 34px !important;
            pointer-events: none !important;
        }

        /* ── OVERLAY BACKDROP ────────────────────────────────────────────── */
        #ms4-host {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483646 !important;
            display: none;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(5, 10, 15, 0.72) !important;
        }

        #ms4-host.ms4-visible {
            display: flex !important;
        }
    `);

    /* ──────────────────────────────────────────────────────────────────────────
       SHADOW DOM STYLES (isolated; host site CSS cannot bleed in — §4)
    ────────────────────────────────────────────────────────────────────────── */
    const SHADOW_CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&family=Cinzel+Decorative:wght@700&display=swap');

        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        /* ── MODAL PANEL — Glass Engine §2 ─────────────────────────────── */
        .modal {
            position: relative;
            width: 90%;
            max-width: 420px;
            padding: 28px 28px 24px;
            border-radius: 8px;

            /* Glass core */
            background: rgba(10, 19, 26, 0.25);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);

            /* Borders */
            border: 1px solid rgba(0, 229, 255, 0.2);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-left: 1px solid rgba(255, 255, 255, 0.1);

            /* Shadow */
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37),
                        0 8px 32px 0 rgba(0, 229, 255, 0.15);

            /* Typography */
            font-family: 'Roboto Mono', monospace;
            color: #EAEAEA;
        }

        /* Fallback when backdrop-filter unavailable — §4 §1 */
        @supports not (backdrop-filter: blur(1px)) {
            .modal {
                background: rgba(10, 19, 26, 0.95);
            }
        }

        /* ── HEADER ─────────────────────────────────────────────────────── */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0, 229, 255, 0.15);
        }

        .title {
            font-family: 'Roboto Mono', monospace;
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #00E5FF;
        }

        /* ── CLOSE BUTTON ───────────────────────────────────────────────── */
        .close-btn {
            all: unset;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            color: #9E9E9E;
            font-size: 1.2rem;
            border: 1px solid transparent;
            transition: all 300ms ease-in-out;
        }

        .close-btn:hover {
            color: #00E5FF;
            border-color: rgba(0, 229, 255, 0.5);
            background-color: rgba(0, 229, 255, 0.05);
        }

        .close-btn:focus-visible {
            outline: 2px solid #00E5FF;
            outline-offset: 2px;
        }

        /* ── SEARCH INPUT ───────────────────────────────────────────────── */
        .search-input {
            width: 100%;
            padding: 10px 14px;
            margin-bottom: 14px;
            font-family: 'Roboto Mono', monospace;
            font-size: 0.875rem;
            color: #EAEAEA;
            caret-color: #00E5FF;

            background: rgba(10, 19, 26, 0.5);
            border: 1px solid rgba(0, 229, 255, 0.2);
            border-radius: 6px;
            outline: none;
            transition: all 300ms ease-in-out;
        }

        .search-input::placeholder {
            color: #9E9E9E;
            letter-spacing: 0.03em;
        }

        .search-input:hover {
            border-color: rgba(0, 229, 255, 0.5);
            background-color: rgba(0, 229, 255, 0.03);
        }

        .search-input:focus {
            border-color: #00E5FF;
            background-color: rgba(0, 229, 255, 0.05);
            box-shadow: 0 0 12px rgba(0, 229, 255, 0.25);
            outline: 2px solid #00E5FF;
            outline-offset: 2px;
        }

        /* ── SUBMIT BUTTON — Interactive Topology §3 ────────────────────── */
        .submit-btn {
            all: unset;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            padding: 0.5rem 1rem;

            font-family: 'Roboto Mono', monospace;
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            cursor: pointer;

            /* Base state */
            color: #9E9E9E;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid transparent;
            border-radius: 6px;
            transition: all 300ms ease-in-out;
        }

        .submit-btn:hover {
            color: #00E5FF;
            border-color: rgba(0, 229, 255, 0.5);
            background-color: rgba(0, 229, 255, 0.05);
        }

        .submit-btn:active {
            color: #67E8F9;
            background-color: rgba(0, 229, 255, 0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 15px rgba(0, 229, 255, 0.4);
        }

        .submit-btn:focus-visible {
            outline: 2px solid #00E5FF;
            outline-offset: 2px;
        }
    `;

    /* ──────────────────────────────────────────────────────────────────────────
       4ndr0666 BRANDED GLYPH — inline SVG (§4 §3: vector paths, currentColor).
       Translated from SplashScreenGlyphIcon React component:
         • glyph-ring-1  : outer dashed orbit ring
         • glyph-ring-2  : inner dotted ring (0.7 opacity)
         • glyph-hex     : hexagon frame
         • glyph-core-psi: Cinzel Decorative Ψ text core
       stroke="currentColor" ensures it recolors with every CSS state transition.
    ────────────────────────────────────────────────────────────────────────── */
    const PSI_SVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"
             fill="none" stroke="currentColor" stroke-width="3"
             stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true" focusable="false">
            <!-- Outer dashed orbit ring -->
            <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z"
                  stroke-dasharray="21.78 21.78" stroke-width="2"/>
            <!-- Inner dotted ring -->
            <path d="M 64,20 A 44,44 0 1 1 63.9,20 Z"
                  stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/>
            <!-- Hexagon frame -->
            <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/>
            <!-- Ψ core — Cinzel Decorative; fill matches stroke (currentColor), no separate stroke -->
            <text x="64" y="67"
                  text-anchor="middle" dominant-baseline="middle"
                  fill="currentColor" stroke="none"
                  font-size="56" font-weight="700"
                  font-family="'Cinzel Decorative', serif">Ψ</text>
        </svg>`;

    /* ──────────────────────────────────────────────────────────────────────────
       ModelSearchTool class
    ────────────────────────────────────────────────────────────────────────── */
    class ModelSearchTool {
        SEARCH_URL_BASE = 'https://simpcity.cr/search/14138808/';

        #hostEl    = null;   // overlay backdrop (main DOM)
        #shadowRoot = null;  // isolated shadow DOM for modal
        #inputEl   = null;   // reference into shadow DOM

        constructor() {
            try {
                this.#buildTrigger();
                this.#buildOverlay();
                this.#bindGlobalKeys();
            } catch (err) {
                console.error('[ModelSearchTool] init failed:', err);
            }
        }

        /* ── TRIGGER BUTTON ────────────────────────────────────────────── */
        #buildTrigger() {
            const btn = document.createElement('button');
            btn.id = 'ms4-trigger';
            btn.setAttribute('aria-label', 'Open Simpcity model search');
            btn.innerHTML = PSI_SVG;
            btn.addEventListener('click', () => this.#open());
            document.body.appendChild(btn);
        }

        /* ── OVERLAY + SHADOW DOM MODAL ────────────────────────────────── */
        #buildOverlay() {
            // Backdrop host
            this.#hostEl = document.createElement('div');
            this.#hostEl.id = 'ms4-host';
            this.#hostEl.setAttribute('role', 'dialog');
            this.#hostEl.setAttribute('aria-modal', 'true');
            this.#hostEl.setAttribute('aria-label', 'Simpcity model search dialog');

            // Close backdrop on outside-click
            this.#hostEl.addEventListener('click', (e) => {
                if (e.target === this.#hostEl) this.#close();
            });

            document.body.appendChild(this.#hostEl);

            // Shadow root for CSS isolation
            this.#shadowRoot = this.#hostEl.attachShadow({ mode: 'open' });

            // Inject scoped styles
            const style = document.createElement('style');
            style.textContent = SHADOW_CSS;
            this.#shadowRoot.appendChild(style);

            // Modal panel
            const modal = document.createElement('div');
            modal.className = 'modal';

            // Header row
            const header = document.createElement('div');
            header.className = 'header';

            const title = document.createElement('span');
            title.className = 'title';
            title.textContent = 'Model Search // Simpcity';

            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.setAttribute('aria-label', 'Close search dialog');
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => this.#close());

            header.append(title, closeBtn);

            // Input
            this.#inputEl = document.createElement('input');
            this.#inputEl.type = 'text';
            this.#inputEl.className = 'search-input';
            this.#inputEl.placeholder = 'Enter model name or keywords...';
            this.#inputEl.autocomplete = 'off';
            this.#inputEl.setAttribute('aria-label', 'Model name or search keywords');
            this.#inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.#search();
            });

            // Submit button
            const submitBtn = document.createElement('button');
            submitBtn.className = 'submit-btn';
            submitBtn.type = 'button';
            submitBtn.textContent = 'Search';
            submitBtn.setAttribute('aria-label', 'Execute search on Simpcity');
            submitBtn.addEventListener('click', () => this.#search());

            modal.append(header, this.#inputEl, submitBtn);
            this.#shadowRoot.appendChild(modal);
        }

        /* ── GLOBAL KEYBOARD EVENTS ────────────────────────────────────── */
        #bindGlobalKeys() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.#close();
            });
        }

        /* ── STATE HELPERS ─────────────────────────────────────────────── */
        #open() {
            this.#hostEl.classList.add('ms4-visible');
            // Defer focus into shadow DOM
            requestAnimationFrame(() => this.#inputEl.focus());
        }

        #close() {
            this.#hostEl.classList.remove('ms4-visible');
            this.#inputEl.value = '';
        }

        /* ── SEARCH LOGIC ──────────────────────────────────────────────── */
        #search() {
            const query = this.#inputEl.value.trim();
            if (!query) return;
            const url = `${this.SEARCH_URL_BASE}?q=${encodeURIComponent(query)}&o=date`;
            GM_openInTab(url, { active: true });
            this.#close();
        }
    }

    // -- BOOT --
    if (document.body) {
        new ModelSearchTool();
    } else {
        document.addEventListener('DOMContentLoaded', () => new ModelSearchTool());
    }

})();
