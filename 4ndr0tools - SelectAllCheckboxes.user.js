// ==UserScript==
// @name         4ndr0tools - Select All Checkboxes
// @namespace    https://www.github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2
// @description  Check/Uncheck a fuckload of checkboxes at once with enhanced precision and modern code.
// @match        *://*/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SelectAllCheckboxes.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SelectAllCheckboxes.user.js
// @icon         https://img.icons8.com/?size=30&id=48178&format=png
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
