// ==UserScript==
// @name        4ndr0tools - HDImagesOnly
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.1 
// @description Prefer high-resolution assets when available.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20HDImgsOnly.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20HDImgsOnly.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://*.deviantart.com
// @match       https://*.simp6.jp5.su
// @match       https://*.jp5.su
// @match       https://*.jp6.su
// @match       https://*.googleusercontent.com
// @match       https://*.imgur.com
// @match       https://*.instagr.am
// @match       https://*.instagram.com
// @match       https://*.imagetwist.com/*
// @match       https://*.imgspice.com/*
// @match       https://*.turboimagehost.com/*.html
// @match       https://*.acidimg.cc/*
// @match       https://*.imx.to/*
// @match       https://*.pixhost.to/*
// @match       https://*.imagebam.com/view/*
// @match       https://*.imgbox.com/*
// @match       https://*.kropic.com/*
// @match       https://*.vipr.im/*
// @match       https://*.imagevenue.com/*
// @grant       none
// @run-at      document-idle
// @license     MIT
// ==/UserScript==

// Map to store domain-specific logic handlers.
// This improves modularity and makes it easier to add or modify logic for different sites.
const domainHandlers = new Map();

/**
 * Attempts to redirect the browser to the source of an image element identified by a CSS selector.
 * @param {string} selector - The CSS selector for the image element.
 * @returns {boolean} True if redirection was attempted, false otherwise.
 */
function redirectToImage(selector) {
    const img = document.querySelector(selector);
    // Use strict equality and ensure img.src is a non-empty string before redirecting.
    if (img && typeof img.src === 'string' && img.src.length > 0) {
        window.location.href = img.src;
        return true;
    }
    return false;
}

/**
 * Waits for a DOM element to appear using a polling mechanism.
 * This is far more robust than a fixed setTimeout.
 * @param {string} selector - The CSS selector for the element to find.
 * @param {number} [timeout=5000] - The maximum time to wait in milliseconds.
 * @returns {Promise<Element>} A promise that resolves with the element when found, or rejects on timeout.
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const intervalTime = 100; // Check every 100ms
        const endTime = Date.now() + timeout;

        const timer = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(timer);
                resolve(element);
            } else if (Date.now() > endTime) {
                clearInterval(timer);
                reject(new Error(`Element "${selector}" not found within ${timeout}ms.`));
            }
        }, intervalTime);
    });
}


// --- Domain Handlers ---
// Each handler encapsulates the specific logic for its domain.
// Handlers that perform actions and then wait for a result are marked as `async`.

domainHandlers.set("imagetwist.com", () => {
    if (redirectToImage(".pic")) return;
    const continueButton = Array.from(document.querySelectorAll("a"))
                                .find(element => element.innerText === "Continue to your image");
    if (continueButton) continueButton.click();
});

domainHandlers.set("imgspice.com", () => {
    redirectToImage("#imgpreview");
});

domainHandlers.set("turboimagehost.com", () => {
    redirectToImage(".uImage");
});

// This handler now uses async/await to robustly wait for the image after a click.
domainHandlers.set("acidimg.cc", async () => {
    const submitButton = document.querySelector("input[type='submit']");
    if (submitButton) {
        submitButton.click();
        try {
            // Wait for the image element to appear in the DOM instead of using a blind timeout.
            await waitForElement(".centred", 3000);
            redirectToImage(".centred");
        } catch (error) {
            console.error('Ψ-Anarch:', error.message); // Log error if element doesn't appear.
        }
    } else {
        redirectToImage(".centred");
    }
});

// This handler is also upgraded to use the robust async waiting mechanism.
domainHandlers.set("imx.to", async () => {
    const blueButton = document.querySelector(".button") || document.querySelector("#continuebutton");
    if (blueButton) {
        blueButton.click();
        try {
            // Wait for the image element to appear, which is more reliable than a short timeout.
            await waitForElement(".centred", 3000);
            redirectToImage(".centred");
        } catch (error) {
            console.error('4ndr0666:', error.message);
        }
    } else {
        redirectToImage(".centred");
    }
});

domainHandlers.set("pixhost.to", () => {
    redirectToImage("img#image");
});

domainHandlers.set("imagebam.com", () => {
    if (redirectToImage("img.main-image")) return;
    const anchor = document.querySelector("#continue > a");
    if (anchor) anchor.click();
});

domainHandlers.set("imgbox.com", () => {
    redirectToImage("img.image-content");
});

domainHandlers.set("kropic.com", () => {
    if (redirectToImage("img.pic")) return;
    const continueButton = Array.from(document.querySelectorAll("input[type='submit']"))
                                .find(element => element.value === "Continue to image...");
    if (continueButton) continueButton.click();
});

domainHandlers.set("vipr.im", () => {
    redirectToImage(".img-responsive");
});

domainHandlers.set("imagevenue.com", () => {
    redirectToImage("#main-image");
});

// --- Main Execution Block (IIFE) ---
(function() {
    'use strict';

    // Get the current hostname, stripping "www." for consistent matching.
    const currentDomain = window.location.hostname.replace(/^www\./, '');

    // Iterate through the defined domain handlers to find a match.
    for (const [domainPattern, handler] of domainHandlers.entries()) {
        if (currentDomain.includes(domainPattern)) {
            // Execute the handler for the matched domain.
            // The handler itself will manage any asynchronous operations.
            handler();
            // Stop searching once the correct handler is found and executed.
            return;
        }
    }
})();
