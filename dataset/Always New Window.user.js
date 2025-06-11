// ==UserScript==
// @name         Always New Window
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Open all links in a new windown.
// @author       4ndr0666
// @include        *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

    // Always open in new windown
(function() {
    let elements = document.querySelectorAll("a")
    elements.forEach(item=>{
        item.target = '_blank'
    })
})();
