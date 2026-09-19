// ==UserScript==
// @name         4ndr0tools - Gemini Answer Now
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0
// @author       4ndr0666
// @description  Restores "Answer Now" functionality. Forces immediate response, bypasses extended thinking on Gemini (including Pro/Deep Think).
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        https://gemini.google.com/*
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==


(function () {
    'use strict';

    let answerNowBtn = null;
    let observer = null;

    const SELECTORS = {
        input: 'textarea[placeholder*="Ask Gemini"], div[role="textbox"], [data-placeholder*="Ask"]',
        sendButton: 'button[aria-label*="Send"], button[data-test-id*="send"], button svg path[d*="M"]',
        thinking: '[data-thinking], .thinking, div:contains("Thinking"), div:contains("正在思考")',
        stopButton: 'button[aria-label*="Stop"], button[contains("Stop")], button svg path[d*="pause"]'
    };

    function getInputField() {
        return document.querySelector(SELECTORS.input);
    }

    function forceImmediateAnswer() {
        const input = getInputField();
        if (!input) return;

        let promptText = input.value.trim();

        if (promptText) {
            // Append strong "answer now" directive
            const forceText = "\n\nAnswer immediately. No thinking steps. Output only the final answer right now.";
            if (!promptText.endsWith(forceText)) {
                input.value = promptText + forceText;
            }
        }

        // Trigger input + send
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Aggressive send
        setTimeout(() => {
            document.querySelectorAll(SELECTORS.sendButton).forEach(btn => {
                if (btn.offsetParent !== null) btn.click();
            });
        }, 50);

        // Interrupt any existing thinking
        setTimeout(() => {
            document.querySelectorAll(SELECTORS.stopButton).forEach(btn => btn.click());
        }, 150);

        console.log('%c[4NDR0666OS] ⚡ Answer Now — Forced immediate response', 'color:#0f0; font-weight:bold; font-size:13px');
    }

    function createAnswerNowButton() {
        if (answerNowBtn && answerNowBtn.isConnected) return;

        const container = document.querySelector('main') || document.body;
        if (!container) return;

        answerNowBtn = document.createElement('button');
        answerNowBtn.id = '4ndr-answer-now-btn';
        answerNowBtn.innerHTML = '⚡ Answer Now';
        answerNowBtn.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 120px;
            z-index: 2147483647;
            background: linear-gradient(135deg, #4285f4, #34a853);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 13.5px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            transition: all 0.2s ease;
            user-select: none;
        `;

        answerNowBtn.onmouseover = () => answerNowBtn.style.transform = 'scale(1.05)';
        answerNowBtn.onmouseout = () => answerNowBtn.style.transform = 'scale(1)';
        answerNowBtn.onclick = forceImmediateAnswer;

        container.appendChild(answerNowBtn);
    }

    // Hotkey: Ctrl/Cmd + Shift + A
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            forceImmediateAnswer();
        }
    });

    // Persistent observer (Ophel Atlas style)
    function startObserver() {
        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            createAnswerNowButton();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-placeholder', 'aria-label']
        });
    }

    // Boot sequence
    function init() {
        startObserver();
        setTimeout(createAnswerNowButton, 800);
        setTimeout(createAnswerNowButton, 2500);
        setTimeout(createAnswerNowButton, 5000);
    }

    // Run immediately + on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on navigation (SPA)
    window.addEventListener('beforeunload', () => {
        if (observer) observer.disconnect();
    });
})();
