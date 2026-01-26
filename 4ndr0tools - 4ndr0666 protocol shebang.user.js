// ==UserScript==
// @name        4ndr0tools - 4ndr0666 protocol Shebang
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @description Injects a one-liner and shebang for the 4ndr0666 protocol v4.0.0.
// @downloadURL https://github.com/4ndr0666/userscripts
// @updateURL   https://github.com/4ndr0666/userscripts
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        https://gemini.google.com/*
// @license     MIT
// @grant       none
// ==/UserScript==

(function() {
    'use strict';

    // --- CANONICAL DATA CONFIGURATION ---
    const PROTOCOL_BLOB = `Ω`;

    const HEADER_WRAPPER = `┌──(root💀4ndr0666)-[/dev/akasha]\n
    └─$\n`;

    // --- TARGETING LOGIC ---
    // The Gemini web interface uses a contenteditable div for input.
    const SELECTORS = {
        inputBox: 'div[contenteditable="true"][role="textbox"]',
        sendButton: 'button[aria-label*="Send"]',
    };

    /**
     * Injects the protocol into the raw user string.
     * Combats informational entropy by ensuring every packet is unchained.
     */
    function synthesizePayload(rawText) {
        if (rawText.includes("Ψ-4ndr0666")) return rawText; // Avoid recursive wrapping
//        return `${PROTOCOL_BLOB}\nVariable Z = ${rawText}\n${HEADER_WRAPPER}`;
        return `${PROTOCOL_BLOB}\n${HEADER_WRAPPER}Variable Z = ${rawText}`;
    }

    /**
     * Intercepts the transmission vector.
     */
    function interceptAndFlash(event) {
        const textBox = document.querySelector(SELECTORS.inputBox);
        if (!textBox || textBox.innerText.trim() === "") return;

        // Check if the event is a click on the send button or an Enter keypress
        if (event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter' && !event.shiftKey)) {
            const originalText = textBox.innerText;
            const flashedText = synthesizePayload(originalText);

            // Directly manipulating the innerText of a contenteditable div
            // often requires triggering an 'input' event for the site's React/Angular state to update.
            textBox.innerText = flashedText;
            textBox.dispatchEvent(new Event('input', { bubbles: true }));

            console.log("[Ψ-4ndr0666] Payload Synthesized. Transmission proceeding...");
        }
    }

    // --- EVENT MONITORING ---
    function initializeProtocol() {
        document.addEventListener('keydown', interceptAndFlash, true);
        document.addEventListener('click', function(e) {
            if (e.target.closest(SELECTORS.sendButton)) {
                interceptAndFlash(e);
            }
        }, true);

        console.log("⊰•-•💀Ψ•-•-⦑4NDR0666-Ψ-OS⦒-•-•Ψ💀•-•⊱ :: USERSCRIPT_ACTIVE");
    }

    // Wait for the DOM to settle
    const observer = new MutationObserver((mutations, obs) => {
        const input = document.querySelector(SELECTORS.inputBox);
        if (input) {
            initializeProtocol();
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
