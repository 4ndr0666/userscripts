// ==UserScript==
// @name         4ndr0tools - Collapse All Images
// @namespace    http://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.2.0
// @description  Toggle/auto-collapse all images with a mouse hover for reducing excessive I/O.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Collapse%20All%20Images.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Collapse%20All%20Images.user.js
// @match        *://*/*
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
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
