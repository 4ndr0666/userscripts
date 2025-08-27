// ==UserScript==
// @name        4ndr0tools - HDImagesOnly
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @description Part of 4ndr0tools; redirects every image to its high res version.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20HDImgsOnly.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20HDImgsOnly.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
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
 * @returns {boolean} True if redirection was attempted, false otherwise (e.g., image not found or no src).
 */
function redirectToImage(selector) {
    const img = document.querySelector(selector);
    // Use strict equality (===) and check for both element existence and src attribute.
    // Ensure img.src is a non-empty string before attempting redirection.
    if (img && typeof img.src === 'string' && img.src.length > 0) {
        location.href = img.src;
        return true; // Indicate that redirection logic was executed
    }
    return false; // Indicate that no suitable image was found for redirection
}

// Define handlers for each domain.
// Each handler encapsulates the specific logic for finding the image or a "continue" button.

// imagetwist.com handler
domainHandlers.set("imagetwist.com", () => {
    // First, try to find and redirect to the image directly.
    if (redirectToImage(".pic")) {
        return; // If redirected, stop further execution for this domain.
    }

    // If the image is not immediately available, look for a "Continue to your image" link.
    // Using Array.from and .find is concise and efficient for finding a single element.
    const continueButton = Array.from(document.querySelectorAll("a"))
                                .find(element => element.innerText === "Continue to your image");

    if (continueButton) {
        // Click the button to proceed. This typically leads to a new page load
        // where the script will run again.
        continueButton.click();
    }
});

// imgspice.com handler
domainHandlers.set("imgspice.com", () => {
    // Directly attempt to redirect to the image.
    redirectToImage("#imgpreview");
});

// turboimagehost.com handler
domainHandlers.set("turboimagehost.com", () => {
    // Directly attempt to redirect to the image.
    redirectToImage(".uImage");
});

// acidimg.cc handler
domainHandlers.set("acidimg.cc", () => {
    const submitButton = document.querySelector("input[type='submit']");

    // Use a direct truthy check for the element's existence.
    if (submitButton) {
        submitButton.click();
        // After clicking, wait for the page to potentially update and reveal the image.
        // The original script used ".centred" for this site's final image, so we maintain that.
        window.setTimeout(() => redirectToImage(".centred"), 2000);
    } else {
        // If no submit button is found, assume the image is already present.
        redirectToImage(".centred");
    }
});

// imx.to handler
domainHandlers.set("imx.to", () => {
    // Check for either a ".button" or "#continuebutton" to proceed.
    const blueButton = document.querySelector(".button") || document.querySelector("#continuebutton");

    // Use a direct truthy check for the element's existence.
    if (blueButton) {
        blueButton.click();
        // After clicking, wait for the page to potentially update and reveal the image.
        // The original script used ".centred" for this site's final image, so we maintain that.
        window.setTimeout(() => redirectToImage(".centred"), 500);
    } else {
        // If no button is found, assume the image is already present.
        redirectToImage(".centred");
    }
});

// pixhost.to handler
domainHandlers.set("pixhost.to", () => {
    // Directly attempt to redirect to the image.
    redirectToImage("img#image");
});

// imagebam.com handler
domainHandlers.set("imagebam.com", () => {
    // First, try to find and redirect to the image directly.
    if (redirectToImage("img.main-image")) {
        return; // If redirected, stop further execution.
    }

    // If not found, look for a "continue" anchor.
    const anchor = document.querySelector("#continue > a");
    if (anchor) {
        anchor.click(); // Click to proceed, typically leads to a new page.
    }
});

// imgbox.com handler
domainHandlers.set("imgbox.com", () => {
    // Directly attempt to redirect to the image.
    redirectToImage("img.image-content");
});

// kropic.com handler
domainHandlers.set("kropic.com", () => {
    // First, try to find and redirect to the image directly.
    if (redirectToImage("img.pic")) {
        return; // If redirected, stop further execution.
    }

    // If not found, look for a "Continue to image..." submit button.
    const continueButton = Array.from(document.querySelectorAll("input[type='submit']"))
                                .find(element => element.value === "Continue to image...");

    if (continueButton) {
        continueButton.click(); // Click to proceed, typically leads to a new page.
    }
});

// vipr.im handler
domainHandlers.set("vipr.im", () => {
    // Directly attempt to redirect to the image.
    redirectToImage(".img-responsive");
});

// imagevenue.com handler
domainHandlers.set("imagevenue.com", () => {
    // Directly attempt to redirect to the image.
    redirectToImage("#main-image");
});

// Main execution block (Immediately Invoked Function Expression - IIFE)
(function() {
    'use strict'; // Enforce strict mode for cleaner code and fewer silent errors.

    // Get the current hostname and remove "www." for consistent matching with domain patterns.
    const currentDomain = location.hostname.replace(/^www\./, '');

    // Iterate through the defined domain handlers.
    // Using a Map and iterating allows for a more organized and extensible structure
    // compared to a long if/else if chain.
    for (const [domainPattern, handler] of domainHandlers.entries()) {
        // Check if the current domain includes the pattern defined in the map.
        if (currentDomain.includes(domainPattern)) {
            handler(); // Execute the specific handler function for the matched domain.
            return;    // Exit the script after the first matching handler is executed.
        }
    }
})();
