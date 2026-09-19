// ==UserScript==
// @name         4ndr0tools - Anti-detection
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1
// @description  Sanitize environment for userscripts to execute properly.
// @author       4ndr0666
// @match        *://*/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @grant        none
// @run-at       document-start
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Anti-detection.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Anti-detection.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_TEXT_FILTER = ['DisableDevtool', 'DevtoolsDetector', 'adblock', 'devtool', 'contextmenu', '_ads'];
    const SCRIPT_SRC_FILTER = ['disable-devtool', 'devtools-detector', 'detect2'];

    function defuseScript(script) {
        const text = script.innerHTML || '';
        const src = script.src || '';

        const matchesText = SCRIPT_TEXT_FILTER.some(word => text.includes(word));
        const matchesSrc = SCRIPT_SRC_FILTER.some(word => src.includes(word));

        if (matchesText || matchesSrc) {
            console.log('[Ψ-4NDR0666] Anti-analysis script intercepted and neutralized.', script);
            script.type = 'javascript/blocked'; // Neutralize before engine compilation
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            return true;
        }
        return false;
    }

    // 1. Gecko-specific interceptor (Firefox)
    window.addEventListener('beforescriptexecute', (e) => {
        if (defuseScript(e.target)) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);

    // 2. Blink/WebKit prototype interception for dynamically appended scripts (Chrome/Edge/Safari)
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function() {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalAppendChild.apply(this, arguments);
    };

    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function() {
        if (arguments[0] && arguments[0].tagName === 'SCRIPT') {
            if (defuseScript(arguments[0])) return arguments[0];
        }
        return originalInsertBefore.apply(this, arguments);
    };

    // 3. Fast synchronous observer for statically parsed HTML inline scripts
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'SCRIPT') defuseScript(node);
                if (node.querySelectorAll) {
                    node.querySelectorAll('script').forEach(defuseScript);
                }
            }
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
