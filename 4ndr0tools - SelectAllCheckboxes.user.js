// ==UserScript==
// @name         4ndr0tools - Select All Checkboxes
// @namespace    https://www.github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2
// @description  Check/Uncheck a fuckload of checkboxes at once with enhanced precision and modern code.
// @match        *://*/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20SelectAllCheckboxes.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20SelectAllCheckboxes.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @license      MIT
// @grant        GM_registerMenuCommand
// @grant        GM.registerMenuCommand
// @contributionAmount 1
// ==/UserScript==

(function() {
    'use strict';

    // ============================================================================
    // Configuration & State
    // ============================================================================

    // Use const for values that do not change.
    const CHECKBOX_SELECTOR = 'input:checkbox:enabled, .checkbox';
    // Use let for state that needs to be reassigned.
    let previousElement = null;

    // ============================================================================
    // Greasemonkey API Compatibility
    // ============================================================================

    // Determine the correct GM command function once and store it in a constant.
    const GMCommandHandler = (() => {
        if (typeof GM_registerMenuCommand !== 'undefined') {
            return GM_registerMenuCommand;
        }
        if (typeof GM !== 'undefined' && typeof GM.registerMenuCommand !== 'undefined') {
            return GM.registerMenuCommand;
        }
        // Return a no-op function if the API is not available, preventing errors.
        return (s, f) => {
            console.warn('UserScript menu command API not found.');
        };
    })();

    // Detect user language for menu command localization.
    const userLang = navigator.language || navigator.userLanguage;
    const langKey = userLang.startsWith('zh') ? '全选' : 'Select All';

    // ============================================================================
    // Core Utility Functions
    // ============================================================================

    /**
     * Checks an element if it's a selectable item that is not already selected.
     * This centralizes the logic for activating a checkbox-like element.
     * @param {HTMLElement} element - The DOM element to potentially check.
     */
    function checkElementIfNeeded(element) {
        try {
            // Use a jQuery object for consistent methods.
            const $el = $(element);
            // The logic is simple: if it's an input checkbox, it must be unchecked.
            // For other elements (like custom divs), we assume a click is always desired.
            if ($el.is('input:checkbox') && element.checked) {
                return; // Do nothing if it's an already checked native checkbox.
            }
            // A native, trusted click event is dispatched to trigger all attached listeners.
            element.click();
        } catch (error) {
            console.error('Error attempting to check element:', error, element);
        }
    }

    /**
     * Iterates through all matching elements on the page and checks them.
     */
    function selectAll() {
        try {
            // Use native querySelectorAll for performance and convert to array for iteration.
            const elements = document.querySelectorAll(CHECKBOX_SELECTOR);
            elements.forEach(checkElementIfNeeded);
        } catch (error) {
            console.error('Error during selectAll execution:', error);
        }
    }

    /**
     * Processes range selection between two elements.
     * This revised version is more robust by finding a common ancestor and then
     * operating on the indices of the elements within that scope.
     * @param {HTMLElement} startElem - The previously marked checkbox element.
     * @param {HTMLElement} endElem - The current checkbox element.
     */
    function selectRange(startElem, endElem) {
        if (!startElem || !endElem || startElem === endElem) {
            return;
        }

        // Find the closest common ancestor of the two elements.
        const commonParent = $(startElem).closest($(endElem).parents().add(endElem.parentNode).get().reverse());
        if (!commonParent.length) {
            console.warn('No common parent found for range selection. Falling back to global selection.');
            // As a fallback, just check the two endpoints.
            checkElementIfNeeded(startElem);
            checkElementIfNeeded(endElem);
            return;
        }

        // Get all checkboxes within the common parent's scope.
        const checkboxesInScope = Array.from(commonParent[0].querySelectorAll(CHECKBOX_SELECTOR));
        const startIndex = checkboxesInScope.indexOf(startElem);
        const endIndex = checkboxesInScope.indexOf(endElem);

        // If either element isn't in the list, something is wrong.
        if (startIndex === -1 || endIndex === -1) {
            console.warn('Range selection markers could not be found within the common parent.');
            return;
        }

        // Determine the slice of elements to select.
        const lowerBound = Math.min(startIndex, endIndex);
        const upperBound = Math.max(startIndex, endIndex);
        const elementsToSelect = checkboxesInScope.slice(lowerBound, upperBound + 1);

        // Activate each element in the calculated range.
        elementsToSelect.forEach(checkElementIfNeeded);
    }

    // ============================================================================
    // Event Handlers for User Interactions
    // ============================================================================

    /**
     * Handles mousedown events to trigger selection logic.
     * - Ctrl+Alt+LeftClick: Selects all checkboxes on the page.
     * - Shift+LeftClick: Selects a range of checkboxes.
     */
    $(document).on('mousedown', CHECKBOX_SELECTOR, function(event) {
        // Only respond to the primary mouse button (left-click).
        if (event.button !== 0) return;

        const currentElem = event.currentTarget;

        try {
            // Full selection: Ctrl + Alt pressed, Shift NOT pressed.
            if (event.ctrlKey && event.altKey && !event.shiftKey) {
                event.preventDefault(); // Prevent default click behavior to avoid double-toggling.
                selectAll();
            }
            // Range selection: Shift pressed, without Ctrl or Alt.
            else if (event.shiftKey && !event.ctrlKey && !event.altKey && previousElement) {
                event.preventDefault(); // Prevent default browser text selection during shift-click.
                selectRange(previousElement, currentElem);
            }
        } catch (error) {
            console.error('Error in mousedown handler:', error, event);
        }

        // Always update the last clicked element for the next range selection.
        previousElement = currentElem;
    });

    /**
     * Handles mouseenter events for alt+hover activation.
     */
    $(document).on('mouseenter', CHECKBOX_SELECTOR, function(event) {
        // Only proceed if Alt is pressed and no other modifiers are active.
        if (event.altKey && !event.shiftKey && !event.ctrlKey) {
            try {
                checkElementIfNeeded(event.currentTarget);
            } catch (error) {
                console.error('Error in mouseenter handler:', error, event);
            }
        }
    });

    // ============================================================================
    // Initialization
    // ============================================================================

    // Register the menu command for manual activation.
    GMCommandHandler(langKey, selectAll);

    // Self-validation log to confirm script is active and can find elements.
    console.info(`[4ndr0tools-SelectAllCheckboxes v1.2] Initialized. Found ${document.querySelectorAll(CHECKBOX_SELECTOR).length} selectable elements.`);

})();
