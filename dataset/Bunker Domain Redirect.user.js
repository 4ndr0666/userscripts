// ==UserScript==
// @name         Bunker Domain Redirect
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Redirects bunker.** domains to bunker.ws
// @author       Your Name
// @match        http*://*.bunkr.*/*
// @match        http*://bunkr.*/*
// @grant        none
// @run-at       document-start
// @license n
// ==/UserScript==
(function() {
    'use strict';
    const oldHost = window.location.hostname;
    const newDomain = 'bunker.ws';
    // Регулярное выражение для определения bunker.**
    const bunkerPattern = /^bunker\.[a-z]{2,}$/i;
    if (bunkerPattern.test(oldHost) && oldHost !== newDomain) {
        const newURL = new URL(window.location.href);
        newURL.hostname = newDomain;
        window.location.replace(newURL.href);
    }
})();