// ==UserScript==
// @name        Forum external-links confirmation bypass
// @author       4ndr0666
// @namespace   links
// @description   Automatically confirms redirection on external links. and always opens all links in a new window.
// @include         *
// @version       1.4
// @license       Public domain / no rights reserved
// @downloadURL https://update.greasyfork.org/scripts/483919/Forum%20external-links%20confirmation%20bypass.user.js
// @updateURL https://update.greasyfork.org/scripts/483919/Forum%20external-links%20confirmation%20bypass.meta.js
// ==/UserScript==

window.addEventListener('load', function() {
     // Select the confirmation button once the page is fully loaded
    var confirmButton = document.querySelector('.button--cta > .button-text');
    // If the button is present, emulate a click on it
    if (confirmButton) confirmButton.click();
}, false);
