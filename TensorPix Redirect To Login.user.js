// ==UserScript==
// @name         TensorPix Register Redirect
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0
// @description  Automatically redirect the TensorPix register page to the login page
// @match        https://app.tensorpix.ai/register
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    // Replace the register URL with the login URL immediately
    window.location.replace('https://app.tensorpix.ai/login');
})();
