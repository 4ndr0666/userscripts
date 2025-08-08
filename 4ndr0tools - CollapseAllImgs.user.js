// ==UserScript==
// @name         4ndr0tools - Collapse All Images
// @namespace    http://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2.0
// @description  Minimizes all images on a site and restores then with a mouse hover for reducing excessive I/O.
// @match        http*://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @license      AGPL-v3.0
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Define the collapsed size for images.
    // Changed from 'let' to 'const' as the value is not reassigned,
    // indicating it's a constant and improving code clarity.
    const size = "200px";

    // Inject CSS rules to collapse images and expand them on hover.
    // GM_addStyle is the recommended and safest way to inject styles in UserScripts.
    GM_addStyle(`
    img {
       /* Smooth transition for size changes */
       transition: max-width 0.4s ease-in-out, max-height 0.4s ease-in-out;
       /* Collapse images to the defined size */
       max-width : ${size};
       max-height : ${size};
       /* Ensure image content is contained within the new dimensions without distortion */
       object-fit: contain;
    }
    img:hover{
       /* Restore images to their natural size (or 100% of their container) on hover */
       max-width : 100%;
       max-height : 100%;
    }
    `);

})();
