// ==UserScript==
// @name         4ndr0tools - PlanetSuzy Mobile Skin Redirect
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2.0
// @description  Part of 4ndr0tools for "ease-of-life". Redirects
//               all PlanetSuzy.org traffic to use the mobile
//               version instead. (styleid=4).
// @match        http://www.planetsuzy.org/*
// @match        https://www.planetsuzy.org/*
// @icon         http://www.planetsuzy.org/favicon.ico
// @run-at       document-start
// @grant        none
// @noframes
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Function to check and redirect to the mobile skin
    function redirectToMobileSkin() {
        const url = new URL(window.location.href);

        // Check if 'styleid' parameter is already set to '4'
        if (url.searchParams.get('styleid') !== '4') {
            // Set 'styleid' parameter to '4'
            url.searchParams.set('styleid', '4');

            // Redirect to the new URL
            window.location.replace(url.toString());
        }
    }

    // Execute the redirection function
    redirectToMobileSkin();
})();
