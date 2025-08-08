// ==UserScript==
// @name         4ndr0tools - ModelSearch
// @namespace    https://www.github.com/4ndr0666/userscripts
// @version      1.7 // Version incremented for IIFE 'async' removal and clarity
// @description  Adds a floating button to search models on Simpcity.su directly from any website.
// @match        *://*/*
// @icon         https://img.icons8.com/?size=30&id=44045&format=png
// @grant        GM_openInTab
// @grant        GM_addStyle
// ==/UserScript==

/*
================================================================================
HOW TO USE THIS SCRIPT (For Novice Users)
--------------------------------------------------------------------------------
Overview:
This userscript adds a floating search button to any webpage. Clicking it opens
a simple overlay where you can enter a model name. Upon searching, it opens
a new tab directly to the search results page on Simpcity.su.

Interface:
1. Search Button – A stylized magnifying glass appears fixed at the top-right.
   Click it to open the search input overlay.
2. Search Overlay – Contains:
   • A text input field for entering keywords.
   • A search button to trigger the search on Simpcity.su.

Important Note:
This version does NOT index pages. It performs a direct search on Simpcity.su
using their built-in search functionality, opening the results in a new tab.
================================================================================
*/

(function() { // Wrapped in an IIFE for scope isolation. 'async' is no longer needed
              // as there are no top-level 'await' calls in this simplified version.
    'use strict';

    /* ============================================================================
       CONFIGURATION & CONSTANTS
       ========================================================================== */

    // Base URL for the XenForo search endpoint on Simpcity.su.
    // This is derived from the "canonical source" script you provided.
    // The structure is: BASE_URL + ?q=YOUR_QUERY&o=date
    const SEARCH_URL_BASE = "https://simpcity.su/search/14138808/";

    /* ============================================================================
       UI MODULE
       ========================================================================== */

    /**
     * injectCSS
     * Injects CSS styles for the search overlay and button using GM_addStyle.
     */
    function injectCSS() {
        GM_addStyle(`
            #xenforo-search-button {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                /* --- START: Electric Glass Theme Changes --- */
                background-color: transparent; /* Make background transparent */
                color: #00FFFF; /* Cyan icon color */
                border: 2px solid #00FFFF; /* Cyan outline */
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.6); /* Cyan glow effect */
                transition: all 0.3s ease; /* Smooth transition for all properties on hover */
                /* --- END: Electric Glass Theme Changes --- */
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            #xenforo-search-button:hover {
                /* --- START: Electric Glass Theme Hover Changes --- */
                background-color: rgba(0, 255, 255, 0.1); /* Slight cyan fill on hover */
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.9); /* Enhanced glow on hover */
                /* --- END: Electric Glass Theme Hover Changes --- */
            }
            #xenforo-search-overlay {
                display: none; /* Hidden by default */
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            #xenforo-search-modal {
                background-color: #fff;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                width: 90%;
                max-width: 400px; /* Smaller modal for simple search */
                max-height: 90vh;
                position: relative;
                color: #333;
                font-family: Arial, sans-serif;
            }
            #xenforo-search-modal h2 {
                margin-top: 0;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                text-align: center;
            }
            #xenforo-search-modal .close-button {
                position: absolute;
                top: 10px;
                right: 15px;
                font-size: 28px;
                cursor: pointer;
                color: #aaa;
            }
            #xenforo-search-modal .close-button:hover {
                color: #555;
            }
            #xenforo-search-form {
                display: flex;
                flex-direction: column; /* Stack input and button */
                gap: 15px; /* Space between elements */
                margin-top: 20px;
            }
            #xenforo-search-input {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 16px;
                width: 100%; /* Full width */
                box-sizing: border-box; /* Include padding/border in width */
            }
            #xenforo-search-form button {
                padding: 10px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.3s ease;
                font-size: 16px;
            }
            #xenforo-search-form button:hover {
                background-color: #0056b3;
            }
        `);
    }

    /**
     * createUI
     * Creates and appends the search button and overlay to the DOM.
     * Sets up event listeners for UI interactions.
     */
    function createUI() {
        // Search Button
        const searchButton = document.createElement('button');
        searchButton.id = 'xenforo-search-button';
        searchButton.innerHTML = '&#128269;'; // Magnifying glass icon
        document.body.appendChild(searchButton);

        // Search Overlay
        const overlay = document.createElement('div');
        overlay.id = 'xenforo-search-overlay';
        overlay.style.display = 'none'; // Initially hidden
        overlay.style.alignItems = 'center'; // Center content
        overlay.style.justifyContent = 'center'; // Center content

        const modal = document.createElement('div');
        modal.id = 'xenforo-search-modal';
        // Using innerHTML for static, trusted content.
        modal.innerHTML = `
            <span class="close-button">&times;</span>
            <h2>Search Simpcity Models</h2>
            <form id="xenforo-search-form">
                <input type="text" id="xenforo-search-input" placeholder="Enter model name or keywords" autocomplete="off">
                <button type="submit">Search</button>
            </form>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Event Listeners
        searchButton.addEventListener('click', () => {
            overlay.style.display = 'flex'; // Show overlay
            document.getElementById('xenforo-search-input').focus();
        });

        modal.querySelector('.close-button').addEventListener('click', () => {
            overlay.style.display = 'none'; // Hide overlay
        });

        // Close when clicking outside the modal content
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });

        const searchInput = document.getElementById('xenforo-search-input');
        const searchForm = document.getElementById('xenforo-search-form');

        // Handle form submission (when user presses Enter or clicks Search button)
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission behavior
            const query = searchInput.value.trim();
            if (query) {
                // Construct the search URL using encodeURIComponent for safety
                const searchUrl = `${SEARCH_URL_BASE}?q=${encodeURIComponent(query)}&o=date`;
                GM_openInTab(searchUrl, { active: true }); // Open in a new active tab
                overlay.style.display = 'none'; // Hide the search overlay after search
                searchInput.value = ''; // Clear the input field for next use
            }
        });
    }

    /* ============================================================================
       INITIALIZATION
       ========================================================================== */

    // Main execution flow
    injectCSS(); // Inject custom styles
    createUI(); // Create and append UI elements

})(); // End of IIFE
