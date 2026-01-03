// ==UserScript==
// @name        4ndr0tools - AutoTranslate
// @description Automatically switches the target language to English for most languages, and to another language (e.g., Spanish) when the source is English.
// @namespace   https://github.com/4ndr0666/userscripts
// @version     2.1.0
// @author      4ndr0666
// @license     Unlicense
// @match       *://translate.google.com/*
// @match       *://translate.google.cn/*
// @grant       none
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/378166/Google%20Translate%20Auto%20Languages.user.js
// @updateURL https://update.greasyfork.org/scripts/378166/Google%20Translate%20Auto%20Languages.meta.js
// ==/UserScript==
"use strict";

// --- Configuration ---
// The language to translate everything INTO.
// This fulfills the request to translate Chinese, Spanish, Russian, German, and French to English.
const PRIMARY_TARGET_LANG = "en"; // English

// When the source language IS the primary target language (e.g., English),
// this will be the new target language.
const SECONDARY_TARGET_LANG = "es"; // Spanish
// Other common options: "zh-CN" (Chinese), "ru" (Russian), "de" (German), "fr" (French)
// --- End Configuration ---

/**
 * Safely finds and returns the "Detect language" tab element.
 * @returns {HTMLElement|null}
 */
function getDetectTab() {
    return document.querySelector('div[data-language-code="auto"][role="tab"]');
}

/**
 * Safely finds and returns the target language container element.
 * @returns {HTMLElement|null}
 */
function getTargetLangContainer() {
    return document.querySelector('div[jsname="sgblj"]');
}

/**
 * Stepwise gap mitigation - ensure all elements exist and log detailed errors if missing.
 */
function validateCoreElements() {
    const detectTab = getDetectTab();
    if (!detectTab) {
        console.error("[4ndr0tools AutoTranslate] ERROR: Could not locate 'Detect language' tab. Retrying...");
        return false;
    }
    const targetLangContainer = getTargetLangContainer();
    if (!targetLangContainer) {
        console.error("[4ndr0tools AutoTranslate] ERROR: Could not locate target language container. Retrying...");
        return false;
    }
    return true;
}

/**
 * Initialization function with gap mitigation and superset feature preservation.
 */
function init() {
    // Step 1: Validation of required DOM elements.
    if (!validateCoreElements()) {
        setTimeout(init, 500);
        return;
    }

    const detectTab = getDetectTab();
    const targetLangContainer = getTargetLangContainer();

    // Step 2: Prepare observer only if parent tablist is available.
    const sourceTabList = detectTab.closest('[role="tablist"]');
    if (!sourceTabList) {
        console.error("[4ndr0tools AutoTranslate] ERROR: Could not locate source language tablist. Retrying...");
        setTimeout(init, 500);
        return;
    }

    // Step 3: MutationObserver logic for language detection.
    const observer = new MutationObserver(() => {
        const detectedLangCode = sourceTabList.getAttribute('data-detected-language-code');
        if (!detectedLangCode) {
            // Language not detected yet; do not proceed.
            return;
        }

        // Determine the desired target language based on our rules.
        const targetLang = (detectedLangCode === PRIMARY_TARGET_LANG)
            ? SECONDARY_TARGET_LANG
            : PRIMARY_TARGET_LANG;

        // Find the button/tab for the desired target language.
        const targetTab = targetLangContainer.querySelector(`[data-language-code="${targetLang}"][role="tab"]`);

        if (!targetTab) {
            console.error(`[4ndr0tools AutoTranslate] ERROR: Target language tab for "${targetLang}" not found.`);
            return;
        }

        // Click the target language tab only if it's not already the active one.
        if (targetTab.getAttribute("aria-selected") !== "true") {
            targetTab.click();
        }
    });

    // Step 4: Observe the sourceTabList for attribute changes (for language detection).
    observer.observe(sourceTabList, { attributes: true, attributeFilter: ["data-detected-language-code"] });

    // Step 5: Ensure "Detect language" is selected on script start.
    if (detectTab.getAttribute("aria-selected") !== "true") {
        detectTab.click();
    }
}

// Step 6: Hard initialization with gap mitigation (ensures only one invocation, no duplicate observers).
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
