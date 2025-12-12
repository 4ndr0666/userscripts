// ==UserScript==
// @name        4ndr0tools - Searxng Sticky Settings
// @namespace   https://github.com/4ndr0666/userscripts
// @version     1.1
// @description Always load your preferred SearXNG settings hash/bookmarklet on every visit
// @author      4ndr0666
// @downloadURL https://github.com/4ndr0666/userscripts
// @updateURL   https://github.com/4ndr0666/userscripts
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       http*://*/*
// @grant       none
// @license     MIT
// ==/UserScript==

// ---- USER CONFIG ----
const searxngHostPattern = /^http:\/\/192\.168\.1\.1(:\d+)?\/?$/; // <-- Set to your host/IP regex if needed
const settingsHash = "PLACEHOLDER";

(function() {
    'use strict';
    // Only trigger on *your* SearXNG root
    if (searxngHostPattern.test(window.location.origin + "/") &&
        !window.location.hash.startsWith('#/preferences?preferences=')) {
        window.location.hash = settingsHash;
        window.location.reload();
    }
})();
