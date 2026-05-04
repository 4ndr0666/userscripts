// ==UserScript==
// @name         4ndr0tools - AutoTranslate
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.0-Ψ
// @description  Automates Google Translate portal (EN/ES) & forces in-place global page translation, bypassing native browser engines.
// @author       Ψ-4NDR0666OS
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://translate.google.com/*
// @match        *://*/*
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @icon         data:image/png;base64,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
// ==/UserScript==

(function () {
    "use strict";

    console.log('%c[4NDR0666OS] AutoTranslate v3.0.0-Ψ — INITIATING SEQUENCE', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // ==========================================
    // GLOBAL CONFIGURATION
    // ==========================================
    const CONFIG = {
        PRIMARY_TARGET_LANG: "en",
        SECONDARY_TARGET_LANG: "es",
        MAX_POLL_ATTEMPTS: 40 // 20 seconds hard ceiling for DOM hunting
    };

    const isTranslatorPortal = window.location.hostname.includes("translate.google");

    // ==========================================
    // MODULE 1: SYSTEM STYLING (3LECTRIC GLASS)
    // ==========================================
    GM_addStyle(`
        :root { --cyan: #00E5FF; --bg-glass: rgba(10, 15, 26, 0.95); }

        #psi-translate-glyph {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: var(--bg-glass);
            border: 1px solid var(--cyan);
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            z-index: 2147483647;
            color: var(--cyan);
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
            font-family: 'Roboto Mono', monospace;
            font-weight: bold;
            font-size: 16px;
            user-select: none;
        }
        #psi-translate-glyph:hover {
            background: var(--cyan);
            color: #000;
            box-shadow: 0 0 15px var(--cyan);
            transform: scale(1.05);
        }
        #psi-translate-glyph:active { transform: scale(0.95); }

        /* Hide the ugly native Google Translate top banner if injected */
        .skiptranslate iframe, .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
    `);

    // ==========================================
    // MODULE 2: GOOGLE TRANSLATE PORTAL AUTOMATION
    // Sandboxed strictly to translate.google.com to prevent memory leaks.
    // ==========================================
    function initPortalAutomation() {
        console.log("[Ψ-4NDR0666] Translator Portal detected. Hunting DOM nodes...");
        let attempts = 0;

        const huntInterval = setInterval(() => {
            attempts++;
            const detectTab = document.querySelector('div[data-language-code="auto"][role="tab"]');
            const targetLangContainer = document.querySelector('div[jsname="sgblj"]');

            if (detectTab && targetLangContainer) {
                clearInterval(huntInterval);
                console.log("[Ψ-4NDR0666] UI Nodes acquired. Binding automation observer.");
                bindLanguageObserver(detectTab, targetLangContainer);
            } else if (attempts >= CONFIG.MAX_POLL_ATTEMPTS) {
                clearInterval(huntInterval);
                console.warn("[Ψ-4NDR0666] Translator UI not found after 20s. Aborting to preserve memory.");
            }
        }, 500);

        // Garbage collection on navigate
        window.addEventListener('beforeunload', () => clearInterval(huntInterval), { once: true });
    }

    function bindLanguageObserver(detectTab, targetLangContainer) {
        const sourceTabList = detectTab.closest('[role="tablist"]');
        if (!sourceTabList) return;

        const observer = new MutationObserver(() => {
            const detectedLangCode = sourceTabList.getAttribute('data-detected-language-code');
            if (!detectedLangCode) return;

            // Route determination logic
            const targetLang = (detectedLangCode === CONFIG.PRIMARY_TARGET_LANG)
                ? CONFIG.SECONDARY_TARGET_LANG
                : CONFIG.PRIMARY_TARGET_LANG;

            const targetTab = targetLangContainer.querySelector(`[data-language-code="${targetLang}"][role="tab"]`);

            if (targetTab && targetTab.getAttribute("aria-selected") !== "true") {
                console.log(`[Ψ-4NDR0666] Auto-routing translation target to: ${targetLang}`);
                targetTab.click();
            }
        });

        observer.observe(sourceTabList, { attributes: true, attributeFilter: ["data-detected-language-code"] });

        // Ensure "Detect language" is selected on script start
        if (detectTab.getAttribute("aria-selected") !== "true") {
            detectTab.click();
        }
    }

    // ==========================================
    // MODULE 3: GLOBAL IN-PLACE TRANSLATION ENGINE
    // Bypasses failing native browser engines by summoning the Google API.
    // ==========================================
    function forcePageTranslation(targetLang = CONFIG.PRIMARY_TARGET_LANG) {
        if (document.getElementById('psi-google-translate-script')) {
            console.log('[Ψ-4NDR0666] Translation engine already summoned on this page.');
            return;
        }

        console.log(`[Ψ-4NDR0666] Summoning Google Translation API. Target: ${targetLang}`);

        // 1. Inject the hidden target div required by the API
        const translateDiv = document.createElement('div');
        translateDiv.id = 'google_translate_element';
        translateDiv.style.display = 'none';
        document.body.appendChild(translateDiv);

        // 2. Define the execution callback globally
        window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({
                pageLanguage: 'auto',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: true
            }, 'google_translate_element');
        };

        // 3. Inject the googtrans cookie to force autonomous translation without UI interaction
        const domain = window.location.hostname.replace(/^www\./, '');
        document.cookie = `googtrans=/auto/${targetLang}; path=/; domain=.${domain}`;
        document.cookie = `googtrans=/auto/${targetLang}; path=/`;

        // 4. Inject and execute the API script
        const script = document.createElement('script');
        script.id = 'psi-google-translate-script';
        script.type = 'text/javascript';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);
    }

    function initGlobalTranslation() {
        const htmlLang = document.documentElement.lang ? document.documentElement.lang.toLowerCase() : '';
        const isEnglish = htmlLang.startsWith('en');

        // Autonomous Execution: If the page declares itself as non-English, fire the API immediately.
        if (htmlLang && !isEnglish) {
            console.log(`[Ψ-4NDR0666] Foreign language detected (${htmlLang}). Auto-translating...`);
            forcePageTranslation(CONFIG.PRIMARY_TARGET_LANG);
        } else {
            // Manual Override: Inject a HUD glyph if auto-detect fails or lang attribute is missing/wrong.
            const glyph = document.createElement('div');
            glyph.id = 'psi-translate-glyph';
            glyph.title = 'Force Translate to English';
            glyph.innerHTML = '文/A';

            glyph.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                glyph.style.transform = 'scale(0.8)';
                glyph.style.color = '#FFD700'; // Yellow loading state
                glyph.style.borderColor = '#FFD700';

                forcePageTranslation(CONFIG.PRIMARY_TARGET_LANG);

                setTimeout(() => {
                    glyph.style.display = 'none'; // Remove button once activated
                }, 1000);
            });

            document.body.appendChild(glyph);
        }

        GM_registerMenuCommand("🌐 Force Translate Page", () => forcePageTranslation(CONFIG.PRIMARY_TARGET_LANG));
    }

    // ==========================================
    // MODULE 4: DEFENSIVE ORCHESTRATION
    // ==========================================
    function bootstrap() {
        if (!document.body) {
            setTimeout(bootstrap, 50);
            return;
        }

        if (isTranslatorPortal) {
            // Scope A: User is pasting text into the Google Translate web portal
            initPortalAutomation();
        } else {
            // Scope B: User is reading a foreign website and needs an in-place translation bypass
            initGlobalTranslation();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }

})();
