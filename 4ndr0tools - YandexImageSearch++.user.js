// ==UserScript==
// @name         4ndr0tools - Yandex Image Search++ 
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666 
// @version      0.3.0
// @description  Robust, event-driven slideshow, fullscreen preview, and on-screen status for Yandex reverse-image search.
// @downloadURL  https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools%20-%20YandexImageSearch%2B%2B.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools%20-%20YandexImageSearch%2B%2B.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        http*://yandex.com/images/*
// @match        http*://yandex.ru/images/*
// @license      MIT
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /**
     * Configuration
     * Encapsulates all selectors and settings for easier maintenance.
     */
    const CONFIG = {
        // The main container for the image viewer modal. The script's logic activates when this appears.
        viewerContainerSelector: '.MMViewer',
        // The button to advance to the next image.
        nextButtonSelector: '.CircleButton_type_next',
        // Key to toggle the slideshow on and off.
        toggleKey: 'ArrowDown',
        // Slideshow delay in milliseconds.
        intervalMs: 1500,
        // Injected CSS for fullscreen mode and the status badge.
        css: `
            .MMImageContainer, .MMImage-Preview {
                width: 100% !important;
                height: 100% !important;
                background: black !important;
                margin: 0;
                padding: 0;
            }
            #slideshow-indicator-4ndr0 {
                position: fixed;
                bottom: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.7);
                color: #00FFFF; /* Cyan */
                font-size: 16px;
                padding: 5px 10px;
                border-radius: 5px;
                z-index: 2147483647; /* Max z-index */
                pointer-events: none;
                font-family: 'Segoe UI', sans-serif;
                text-shadow: 0 0 5px #00FFFF;
                opacity: 0;
                transition: opacity 0.3s ease-in-out;
            }
            #slideshow-indicator-4ndr0.visible {
                opacity: 1;
            }
        `
    };

    /**
     * A centralized error logging utility.
     * @param {string} module - The name of the function/module where the error occurred.
     * @param {Error} error - The error object caught.
     */
    const logError = (module, error) => {
        console.error(`[YandexImageSearch++ Error] in ${module}:`, error.message);
    };

    /**
     * Injects the script's CSS into the document's <head>.
     * This is done once when the script first loads.
     */
    const injectCSS = () => {
        try {
            const style = document.createElement('style');
            style.id = 'yandex-slideshow-styles';
            style.textContent = CONFIG.css;
            document.head.appendChild(style);
        } catch (error) {
            logError('injectCSS', error);
        }
    };

    /**
     * Controls the slideshow functionality for an active image viewer instance.
     */
    class SlideshowController {
        constructor() {
            this.isPlaying = false;
            this.slideTimer = null;
            this.badgeElement = null;

            // Bind the context of 'this' for the event handler, ensuring it refers to the class instance.
            this.handleKeyDown = this.handleKeyDown.bind(this);

            this.init();
        }

        /**
         * Initializes the controller by creating the UI and attaching event listeners.
         */
        init() {
            this.createBadge();
            window.addEventListener('keydown', this.handleKeyDown);
        }

        /**
         * Creates and appends the on-screen status badge to the DOM.
         */
        createBadge() {
            if (document.getElementById('slideshow-indicator-4ndr0')) return;
            this.badgeElement = document.createElement('div');
            this.badgeElement.id = 'slideshow-indicator-4ndr0';
            document.body.appendChild(this.badgeElement);
        }

        /**
         * Updates the badge's text and visibility based on the slideshow state.
         */
        updateBadge() {
            if (!this.badgeElement) return;
            if (this.isPlaying) {
                this.badgeElement.textContent = '▶ Slideshow Active';
                this.badgeElement.classList.add('visible');
            } else {
                this.badgeElement.classList.remove('visible');
            }
        }

        /**
         * Safely finds and clicks the "next" image button if it exists and is visible.
         */
        clickNext() {
            try {
                const nextButton = document.querySelector(CONFIG.nextButtonSelector);
                // Ensure the button exists before attempting to click it.
                if (nextButton instanceof HTMLElement) {
                    nextButton.click();
                }
            } catch (error) {
                logError('clickNext', error);
                this.stop(); // Stop the slideshow if clicking fails.
            }
        }

        /**
         * Starts the slideshow interval.
         */
        start() {
            if (this.isPlaying) return;
            this.isPlaying = true;
            this.clickNext(); // Advance to the next slide immediately.
            this.slideTimer = setInterval(() => this.clickNext(), CONFIG.intervalMs);
            this.updateBadge();
        }

        /**
         * Stops the slideshow interval.
         */
        stop() {
            if (!this.isPlaying) return;
            this.isPlaying = false;
            clearInterval(this.slideTimer);
            this.slideTimer = null;
            this.updateBadge();
        }

        /**
         * Toggles the slideshow state between playing and stopped.
         */
        toggle() {
            this.isPlaying ? this.stop() : this.start();
        }

        /**
         * Handles the keydown event to toggle the slideshow.
         * @param {KeyboardEvent} event - The keyboard event.
         */
        handleKeyDown(event) {
            // Check for the toggle key, ensure it's not a repeated event from holding the key down,
            // and that no input fields are focused.
            if (event.key === CONFIG.toggleKey && !event.repeat && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) {
                event.preventDefault();
                this.toggle();
            }
        }

        /**
         * Cleans up all resources created by this controller instance.
         * Removes the badge and event listeners to prevent memory leaks.
         */
        destroy() {
            this.stop();
            window.removeEventListener('keydown', this.handleKeyDown);
            if (this.badgeElement) {
                this.badgeElement.remove();
            }
        }
    }

    /**
     * Main execution logic.
     * Sets up a MutationObserver to watch for when the Yandex image viewer is opened or closed.
     */
    function main() {
        injectCSS();
        let activeController = null;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    // When the viewer container is added to the DOM, create a new controller.
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches(CONFIG.viewerContainerSelector)) {
                        if (!activeController) {
                            activeController = new SlideshowController();
                        }
                        return; // Exit after finding the container.
                    }
                }
                for (const node of mutation.removedNodes) {
                    // When the viewer container is removed, destroy the active controller to clean up.
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches(CONFIG.viewerContainerSelector)) {
                        if (activeController) {
                            activeController.destroy();
                            activeController = null;
                        }
                        return; // Exit after finding the container.
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: false // We only need to watch direct children of the body for the modal.
        });
    }

    // Run the main script logic.
    main();

})();
