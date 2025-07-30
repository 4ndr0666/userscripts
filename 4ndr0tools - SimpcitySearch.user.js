// ==UserScript==
// @name         4ndr0tools - Simpcity Search
// @namespace    https://www.github.com/4ndr0666/userscripts
// @author       4ndr0666
// @description  Small omnibox to quickly search the simpcity forums.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SimpcitySearch.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SimpcitySearch.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @version      1.2
// @icon         https://img.icons8.com/?size=30&id=44045&format=png
// @license      MIT
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration Variables ---
    // Adjust these values to position the trigger as needed.
    const TRIGGER_TOP = 8;       // Distance from the top of the viewport
    const TRIGGER_LEFT = -200;    // Distance from the left side (adjust to align under "Chrome Web Store")
    const CONTAINER_TOP = 60;    // Vertical position of the popout container
    const CONTAINER_LEFT = -170;  // Horizontal position of the popout container

    // --- UI Behavior Control ---
    let collapsed = true;  // Flag tracking whether the popout is hidden

    // --- Style Injection ---
    GM_addStyle(`
        /* Trigger button: a transparent black box with #15FFFF text */
        scrbutton.script-button {
            position: fixed;
            top: ${TRIGGER_TOP}px;
            left: ${TRIGGER_LEFT}px;
            padding: 8px 14px;
            font-size: 14px;
            border: 1px solid #15FFFF;
            border-radius: 4px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #15FFFF;
            cursor: pointer;
            transition: left 0.3s;
            z-index: 9999;
        }
        scrbutton.script-button:hover {
            /* On hover, slide slightly further right */
            left: ${TRIGGER_LEFT + 10}px;
        }
        /* Popout container: transparent black with #15FFFF text */
        div.info-container {
            display: none;
            position: fixed;
            top: ${CONTAINER_TOP}px;
            left: ${CONTAINER_LEFT}px;
            width: 400px;
            padding: 12px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #15FFFF;
            border: 1px solid #15FFFF;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 9999;
            max-height: 80vh;
            overflow-y: auto;
        }
        div.info-container.show {
            display: block;
            opacity: 1;
        }
        /* Search input styling: transparent black box with #15FFFF text */
        input.script-search-input {
            width: 90%;
            padding: 10px;
            font-size: 14px;
            border: 1px solid #15FFFF;
            border-radius: 4px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #15FFFF;
            margin-bottom: 15px;
            margin-top: 10px;
        }
        button.search-button {
            padding: 5px 10px;
            cursor: pointer;
            font-size: 14px;
            border: 1px solid #15FFFF;
            border-radius: 4px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #15FFFF;
        }
        /* Close button for popout container */
        .lookup-close {
            position: absolute;
            top: 5px;
            right: 10px;
            cursor: pointer;
            font-size: 16px;
            color: #15FFFF;
        }
    `);

    // --- UI Creation Functions ---
    function createLookupButton() {
        const button = document.createElement('scrbutton');
        button.className = 'script-button';
        // Use simple text instead of an icon
        button.innerText = 'Simpcity Search';
        button.addEventListener('click', toggleSearchContainer);
        document.body.appendChild(button);
    }

    function createSearchContainer() {
        const container = document.createElement('div');
        container.className = 'info-container';

        // Close button for the container
        const closeBtn = document.createElement('span');
        closeBtn.className = 'lookup-close';
        closeBtn.innerText = 'X';
        closeBtn.addEventListener('click', () => {
            hideSearchContainer(container);
        });
        container.appendChild(closeBtn);

        // Search input field
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Enter topic keyword...';
        searchInput.className = 'script-search-input';
        container.appendChild(searchInput);

        // Search button
        const searchBtn = document.createElement('button');
        searchBtn.className = 'search-button';
        searchBtn.innerText = 'Search';
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                openSimpcitySearch(query);
                hideSearchContainer(container);
            }
        });
        container.appendChild(searchBtn);

        return container;
    }

    // --- UI Toggle Functions ---
    function toggleSearchContainer() {
        let container = document.querySelector('.info-container');
        if (!container) {
            container = createSearchContainer();
            document.body.appendChild(container);
        }
        if (collapsed) {
            container.classList.add('show');
        } else {
            container.classList.remove('show');
        }
        collapsed = !collapsed;
    }

    function hideSearchContainer(container) {
        container.classList.remove('show');
        collapsed = true;
    }

    // --- Search Functionality ---
    function openSimpcitySearch(query) {
        const url = `https://simpcity.su/search/2490947/?q=${encodeURIComponent(query)}&o=date`;
        GM_openInTab(url, { active: true });
    }

    // --- Initialization ---
    function initUI() {
        createLookupButton();
    }

    // Initialize on DOMContentLoaded to ensure elements exist
    document.addEventListener('DOMContentLoaded', initUI);
})();
