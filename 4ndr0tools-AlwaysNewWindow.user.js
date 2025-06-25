// ==UserScript==
// @name         4ndr0tools - Always New Window
// @namespace    http://www.github.com/4ndr0666/userscripts
// @description  Part of 4ndr0tools - Force all links to be opened in a new window.
// @version      0.2 // Increment version as code changes
// @author       4ndr0666
// @include      *
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        none
// ==/UserScript==

(function() {
    'use strict'; // Good practice to enable strict mode

    // Select all anchor elements on the page
    const elements = document.querySelectorAll("a");

    // Iterate over each link and set target and rel attributes
    elements.forEach(item => {
        // Set target to _blank to open in a new window/tab
        item.target = '_blank';

        // Add rel="noopener noreferrer" for security best practice
        // noopener prevents the new page from accessing window.opener
        // noreferrer prevents sending the referrer header
        item.rel = 'noopener noreferrer';
    });

    // Note: This script runs once on page load.
    // It will not affect links added dynamically after the initial page load.

})();
