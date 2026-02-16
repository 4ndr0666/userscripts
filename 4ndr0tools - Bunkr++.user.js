// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.1
// @description  Absolute canonical routing, auto-sort largest->smallest.
// @author       4ndr0666
// @match        *://bunkr.*/*
// @match        *://*.bunkr.*/*
// @match        *://bunker.*/*
// @match        *://*.bunker.*/*
// @match        *://bunkrr.*/*
// @match        *://*.bunkrr.*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TARGET_DOMAIN = 'bunkr.ws';
    const currentHost = window.location.hostname;

    if (currentHost !== TARGET_DOMAIN) {
        const targetPattern = /(?:^|\.)(bunkr|bunker|bunkrr)\.[a-z0-9-]{2,}$/i;
        if (targetPattern.test(currentHost)) {
            const newTrajectory = new URL(window.location.href);
            newTrajectory.hostname = TARGET_DOMAIN;

            window.location.replace(newTrajectory.href);
            return; // Terminate execution on the legacy origin
        }
    }

    function engageAutoSort() {
        const sizeBtn = document.querySelector('.btnSize');
        if (!sizeBtn) {
            console.log("[Ψ-4NDR0666] Target node '.btnSize' missing. Aborting strike.");
            return;
        }

        console.log("[Ψ-4NDR0666] Acquired target node. Initiating synthetic strike.");

        sizeBtn.click();

        setTimeout(() => {
            const state = (sizeBtn.className || '') + (sizeBtn.textContent || '');

            if (!state.toLowerCase().includes('desc') && !state.includes('↓')) {
                console.log("[Ψ-4NDR0666] Confirming descent payload. Secondary strike initiated.");
                sizeBtn.click();
            } else {
                console.log("[Ψ-4NDR0666] Descent confirmed.");
            }
        }, 350);
    }

    if (document.readyState === 'complete') {
        setTimeout(engageAutoSort, 500);
    } else {
        window.addEventListener('load', () => setTimeout(engageAutoSort, 500));
    }

})();
