// ==UserScript==
// @name         4ndr0tools - ModelSearch
// @namespace    https://www.github.com/4ndr0666/userscripts
// @version      1.8
// @description  Direct SimpCity search UI to search models on Simpcity.su directly from any website.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20ModelSearch.user.js
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

(function() {
    'use strict';

    /**
     * @class ModelSearchTool
     * @description Encapsulates all functionality for the ModelSearch userscript
     * to prevent global scope pollution and improve organization.
     */
    class ModelSearchTool {
        // == CONFIGURATION ==
        // Base URL for the XenForo search endpoint.
        SEARCH_URL_BASE = "https://simpcity.su/search/14138808/";

        // == DOM ELEMENT REFERENCES ==
        // Using private class fields for better encapsulation.
        #overlayElement = null;
        #inputElement = null;

        /**
         * Initializes the tool by injecting CSS and creating the UI.
         */
        constructor() {
            // Revision: Added a try...catch block for robust error handling during initialization.
            try {
                this.#injectCSS();
                this.#createUI();
                this.#bindEvents();
            } catch (error) {
                console.error('ModelSearchTool failed to initialize:', error);
            }
        }

        /**
         * Injects all necessary CSS into the page using GM_addStyle.
         * @private
         */
        #injectCSS() {
            // Revision: No functional change, but confirms GM_addStyle is the correct tool.
            // The CSS itself is preserved from the previous version.
            GM_addStyle(`
                #xenforo-search-button {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    /* --- START: Electric Glass Theme Changes --- */
                    background-color: transparent;
                    color: #00FFFF;
                    border: 2px solid #00FFFF;
                    box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
                    transition: all 0.3s ease;
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
                    background-color: rgba(0, 255, 255, 0.1);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.9);
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
                    max-width: 400px;
                    max-height: 90vh;
                    position: relative;
                    color: #333;
                    font-family: Arial, sans-serif;
                    display: flex; /* Revision: Using flexbox for better internal alignment */
                    flex-direction: column;
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
                    line-height: 1; /* Revision: Improved vertical alignment of the 'x' */
                }
                #xenforo-search-modal .close-button:hover {
                    color: #555;
                }
                #xenforo-search-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-top: 20px;
                }
                #xenforo-search-input {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                    width: 100%;
                    box-sizing: border-box;
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
         * Creates and appends all UI elements to the DOM.
         * @private
         */
        #createUI() {
            // Revision: Check for document.body to prevent errors on pages that load scripts in <head>.
            if (!document.body) {
                throw new Error("document.body is not available. Cannot create UI.");
            }

            // --- Search Button ---
            const searchButton = document.createElement('button');
            searchButton.id = 'xenforo-search-button';
            searchButton.innerHTML = '&#128269;'; // Magnifying glass icon
            document.body.appendChild(searchButton);

            // --- Overlay ---
            this.#overlayElement = document.createElement('div');
            this.#overlayElement.id = 'xenforo-search-overlay';

            // --- Modal ---
            // Revision: Programmatically creating elements instead of using innerHTML.
            // This is a safer and more maintainable practice, preventing potential XSS if content were ever dynamic.
            const modal = document.createElement('div');
            modal.id = 'xenforo-search-modal';

            const closeButton = document.createElement('span');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '&times;';

            const title = document.createElement('h2');
            title.textContent = 'Search Simpcity Models';

            const form = document.createElement('form');
            form.id = 'xenforo-search-form';

            this.#inputElement = document.createElement('input');
            this.#inputElement.type = 'text';
            this.#inputElement.id = 'xenforo-search-input';
            this.#inputElement.placeholder = 'Enter model name or keywords';
            this.#inputElement.autocomplete = 'off';

            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = 'Search';

            form.append(this.#inputElement, submitButton);
            modal.append(closeButton, title, form);
            this.#overlayElement.appendChild(modal);
            document.body.appendChild(this.#overlayElement);
        }

        /**
         * Binds all necessary event listeners for the UI.
         * @private
         */
        #bindEvents() {
            const searchButton = document.getElementById('xenforo-search-button');
            const modal = document.getElementById('xenforo-search-modal');
            const closeButton = modal.querySelector('.close-button');
            const searchForm = document.getElementById('xenforo-search-form');

            // Open the search overlay
            searchButton.addEventListener('click', () => this.#showOverlay());

            // Close the overlay via the 'x' button
            closeButton.addEventListener('click', () => this.#hideOverlay());

            // Close the overlay by clicking on the background
            this.#overlayElement.addEventListener('click', (event) => {
                // Revision: Using strict equality for clarity and safety.
                if (event.target === this.#overlayElement) {
                    this.#hideOverlay();
                }
            });

            // Handle the search submission
            searchForm.addEventListener('submit', (event) => {
                event.preventDefault(); // Always prevent default form action
                this.#performSearch();
            });
        }

        /**
         * Shows the search overlay and focuses the input field.
         * @private
         */
        #showOverlay() {
            this.#overlayElement.style.display = 'flex';
            this.#inputElement.focus();
        }

        /**
         * Hides the search overlay.
         * @private
         */
        #hideOverlay() {
            this.#overlayElement.style.display = 'none';
        }

        /**
         * Executes the search logic based on the input field's value.
         * @private
         */
        #performSearch() {
            const query = this.#inputElement.value.trim();
            // Revision: Using truthiness check remains the most idiomatic way here.
            if (query) {
                // Construct the search URL using encodeURIComponent for safety.
                const searchUrl = `${this.SEARCH_URL_BASE}?q=${encodeURIComponent(query)}&o=date`;
                GM_openInTab(searchUrl, { active: true });
                this.#hideOverlay();
                this.#inputElement.value = ''; // Clear input for next use
            }
        }
    }

    // -- INITIALIZATION --
    // Instantiate the class to run the script.
    new ModelSearchTool();

})();
