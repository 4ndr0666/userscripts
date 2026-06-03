// ==UserScript==
// @name         4ndr0tools - Anti-detection
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1
// @description  Sanitize environment for userscripts to execute properly.
// @author       4ndr0666
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        none
// @run-at       document-start
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
