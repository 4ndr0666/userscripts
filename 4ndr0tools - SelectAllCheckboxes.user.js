// ==UserScript==
// @name         4ndr0tools - Select All Checkboxes
// @namespace    https://www.github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.1
// @description  Check/Uncheck a fuckload of checkboxes at once.
// @match        *://*/*
// @require      http://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.3/jquery.min.js
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SelectAllCheckboxes.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-SelectAllCheckboxes.user.js
// @icon         https://img.icons8.com/?size=30&id=48178&format=png
// @license      MIT
// @grant        GM_registerMenuCommand
// @grant        GM.registerMenuCommand
// @contributionAmount 1
// ==/UserScript==

(function() {
    "use strict";

    // ============================================================================
    // Language Detection and GM Command Registration
    // ============================================================================
    var browserName = navigator.appName;
    var userLang = (browserName === "Netscape") ? navigator.language : navigator.userLanguage;
    var langKey = userLang.substr(0,2) === "zh" ? "全选" : "SelectAll";

    var GMCommandHandler;
    if (typeof GM_registerMenuCommand !== "undefined") {
        GMCommandHandler = GM_registerMenuCommand;
    } else if (typeof GM !== "undefined" && typeof GM.registerMenuCommand !== "undefined") {
        GMCommandHandler = GM.registerMenuCommand;
    } else {
        GMCommandHandler = function(s, f) {};
    }

    // ============================================================================
    // Global Selector and State Variables
    // ============================================================================
    var checkboxSelector = "input:checkbox:enabled, .checkbox";
    var previousElement = null; // Used for shift-based range selection

    // ============================================================================
    // Utility Functions
    // ============================================================================

    /**
     * Safely invokes a native click event.
     * This function generates a trusted click so that attached listeners are triggered.
     * @param {HTMLElement} element - The element to click.
     */
    function invokeNativeClick(element) {
        try {
            // For input checkboxes, only click if not already checked to prevent toggling off.
            if (element.matches("input:checkbox")) {
                if (!element.checked) {
                    element.click();
                }
            } else {
                element.click();
            }
        } catch (error) {
            console.error("Error invoking native click:", error, element);
        }
    }

    /**
     * Iterates through all elements matching the selector and activates them.
     * This function complements the original code by ensuring that each checkbox
     * is only activated if not already checked.
     */
    function selectAll() {
        try {
            $(checkboxSelector).each(function() {
                // Check if element is an input checkbox and whether it's unchecked; else, proceed as defined.
                if ($(this).is("input:checkbox")) {
                    if (!this.checked) {
                        invokeNativeClick(this);
                    }
                } else {
                    invokeNativeClick(this);
                }
            });
        } catch (error) {
            console.error("Error during selectAll execution:", error);
        }
    }

    /**
     * Processes range selection between two markers (previous and current checkboxes).
     * It traverses up to five levels to find a common parent container and then activates
     * each checkbox between the markers if not already checked.
     * @param {HTMLElement} startElem - The previously marked checkbox element.
     * @param {HTMLElement} endElem - The current checkbox element.
     */
    function selectRange(startElem, endElem) {
        if (!startElem || !endElem) {
            console.warn("Range selection skipped due to missing markers.");
            return;
        }
        var startParent = startElem;
        var endParent = endElem;
        var commonParent = null;

        // Traverse up to 5 levels to locate a common parent.
        for (var i = 0; i < 5; i++) {
            startParent = startParent.parentNode;
            endParent = endParent.parentNode;
            if (!startParent || !endParent) {
                break;
            }
            if (startParent === endParent) {
                commonParent = startParent;
                break;
            }
        }
        if (!commonParent) {
            console.warn("No common parent found for range selection.");
            return;
        }
        var inRange = false;
        // Iterate over checkboxes within the common parent.
        $(commonParent).find(checkboxSelector).each(function() {
            // Toggle the inRange flag when encountering a marker.
            if (this === startElem || this === endElem) {
                inRange = !inRange;
                // Ensure the marker is activated.
                if ($(this).is("input:checkbox") && !this.checked) {
                    invokeNativeClick(this);
                }
            } else if (inRange) {
                // Activate checkboxes in between if not already activated.
                if ($(this).is("input:checkbox")) {
                    if (!this.checked) {
                        invokeNativeClick(this);
                    }
                } else {
                    invokeNativeClick(this);
                }
            }
        });
    }

    // ============================================================================
    // Event Handlers for User Interactions
    // ============================================================================

    /**
     * Handles mousedown events on elements matching the checkbox selector.
     * Implements:
     * - Full selection on ctrl+alt+leftclick.
     * - Range selection on shift+leftclick.
     */
    $(document).on("mousedown", checkboxSelector, function(event) {
        try {
            // Only respond to left mouse clicks.
            if (event.button !== 0) return;

            // Retrieve the current element using the selector.
            var currentElem = event.currentTarget;
            // Full selection: ctrl + alt pressed, shift NOT pressed.
            if (event.ctrlKey && event.altKey && !event.shiftKey) {
                selectAll();
                // Provide immediate visual feedback.
                invokeNativeClick(currentElem);
            }
            // Range selection: shift pressed without ctrl or alt.
            else if (event.shiftKey && !event.altKey && !event.ctrlKey && previousElement) {
                selectRange(previousElement, currentElem);
            }
            // Update previous element reference.
            previousElement = currentElem;
        } catch (error) {
            console.error("Error in mousedown handler:", error, event);
        }
    });

    /**
     * Handles mouseenter events for alt+hover activation.
     * When the alt key is held during hover, the targeted checkbox is activated.
     */
    $(document).on("mouseenter", checkboxSelector, function(event) {
        try {
            // Only proceed if alt is pressed and neither ctrl nor shift is active.
            if (event.altKey && !event.shiftKey && !event.ctrlKey) {
                // For input checkboxes, only click if not already checked.
                if ($(this).is("input:checkbox")) {
                    if (!this.checked) {
                        invokeNativeClick(this);
                    }
                } else {
                    invokeNativeClick(this);
                }
            }
        } catch (error) {
            console.error("Error in mouseenter handler:", error, event);
        }
    });

    // ============================================================================
    // GM Menu Command Registration for Manual Trigger
    // ============================================================================
    GMCommandHandler(langKey, selectAll);

    // ============================================================================
    // Self-Validation Logging
    // ============================================================================
    (function selfValidate() {
        try {
            if (!$(checkboxSelector).length) {
                console.warn("Self-validation: No checkboxes detected with selector:", checkboxSelector);
            } else {
                console.info("Self-validation: Script initialized successfully. Checkboxes detected.");
            }
        } catch (error) {
            console.error("Self-validation encountered an error:", error);
        }
    })();

})();
