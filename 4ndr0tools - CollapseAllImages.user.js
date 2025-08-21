// ==UserScript==
// @name         4ndr0tools - Collapse All Images
// @namespace    http://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2.0
// @description  Minimizes all images on a site and restores then with a mouse hover for reducing excessive I/O.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20CollapseAllImages.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20CollapseAllImages.user.js
// @match        http*://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @license      AGPL-v3.0
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let size = "200px";

    GM_addStyle(`
    img {
       transition: max-width 0.4s ease-in-out, max-height 0.4s ease-in-out;
       max-width : ${size};
       max-height : ${size};
       object-fit: contain;
    }
    img:hover{
       max-width : 100%;
       max-height : 100%;
    }
    `)

})();
