// ==UserScript==
// @name         4ndr0tools - AutoTranslate
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.0.0-Ψ
// @author       Ψ-4NDR0666OS
// @description  Automatically translates any non-English page to English via translate.goog redirect. No broken Element API. No cookies. No banners.
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @license      UNLICENSED
// @match        *://*/*
// @exclude      *://translate.google.com/*
// @exclude      *://translate.googleapis.com/*
// @noframes
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AutoTranslate.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AutoTranslate.user.js
// ==/UserScript==

(function () {
    "use strict";

    // ─── CONSTANTS ────────────────────────────────────────────────────────────
    const TARGET_LANG        = "en";
    const UI_LANG            = "en";
    const SOURCE_LANG        = "auto";
    const TRANSLATE_SUFFIX   = "translate.goog";
    const STORAGE_KEY_ORIG   = "psi-at-original-url";   // original URL before redirect
    const STORAGE_KEY_SKIP   = "psi-at-skip-hosts";     // JSON array of skipped hostnames
    const STORAGE_KEY_AUTO   = "psi-at-auto-enabled";   // master auto-translate toggle

    // ─── GUARD: already on translate.goog — only hide the nav banner ─────────
    if (window.location.hostname.endsWith(TRANSLATE_SUFFIX)) {
        hideBanner();
        addReturnButton();
        return;
    }

    // ─── GUARD: skip iframe contexts ─────────────────────────────────────────
    if (window !== window.top) return;

    // ─── SETTINGS ────────────────────────────────────────────────────────────
    let autoEnabled = GM_getValue(STORAGE_KEY_AUTO, true);
    let skipHosts   = GM_getValue(STORAGE_KEY_SKIP, []);
    if (!Array.isArray(skipHosts)) skipHosts = [];

    const currentHost = window.location.hostname;

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    function buildTranslateUrl(originalUrl) {
        const url  = new URL(originalUrl);
        const tHost = url.hostname.replace(/\./g, "-") + "." + TRANSLATE_SUFFIX;
        const tUrl  = new URL(url.toString());
        tUrl.hostname = tHost;
        tUrl.searchParams.set("_x_tr_sl", SOURCE_LANG);
        tUrl.searchParams.set("_x_tr_tl", TARGET_LANG);
        tUrl.searchParams.set("_x_tr_hl", UI_LANG);
        tUrl.searchParams.set("_x_tr_pto", "wapp");
        return tUrl.toString();
    }

    function redirectToTranslation() {
        GM_setValue(STORAGE_KEY_ORIG, window.location.href);
        window.location.replace(buildTranslateUrl(window.location.href));
    }

    // Detect page language from multiple sources, most reliable first.
    // Returns a lowercase BCP-47 string or null if unknown.
    function detectPageLang() {
        // 1. <html lang="...">  — most reliable
        const htmlLang = (document.documentElement.lang || "").trim().toLowerCase();
        if (htmlLang) return htmlLang;

        // 2. <meta http-equiv="Content-Language" content="...">
        const metaHTTP = document.querySelector('meta[http-equiv="Content-Language"]');
        if (metaHTTP) return metaHTTP.content.trim().toLowerCase();

        // 3. <meta name="language" content="...">
        const metaName = document.querySelector('meta[name="language"]');
        if (metaName) return metaName.content.trim().toLowerCase();

        // 4. Open Graph locale  <meta property="og:locale" content="en_US">
        const ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale) return ogLocale.content.trim().toLowerCase().replace("_", "-");

        return null;
    }

    function isEnglish(lang) {
        if (!lang) return null;          // null = unknown
        return lang === "en" || lang.startsWith("en-");
    }

    // ─── MAIN AUTO-TRANSLATE LOGIC ────────────────────────────────────────────
    //
    // Strategy:
    //   • run-at document-start so we can redirect before the page renders,
    //     but <html lang> may not be stamped yet — so we do a two-phase check.
    //   • Phase 1 (document-start): check whatever is available right now.
    //   • Phase 2 (DOMContentLoaded): recheck if phase 1 was inconclusive.
    //   • If the lang is conclusively non-English → redirect immediately.
    //   • If the lang is conclusively English or unknown → inject HUD button.

    function attemptAutoTranslate(phase) {
        if (!autoEnabled) return;
        if (skipHosts.includes(currentHost)) return;

        const lang       = detectPageLang();
        const englishQ   = isEnglish(lang);

        if (englishQ === false) {
            // Definitely not English — redirect now.
            console.log(`[Ψ-AutoTranslate] Phase ${phase}: lang="${lang}" → redirecting.`);
            redirectToTranslation();
            return;
        }

        if (englishQ === null && phase === 1) {
            // Lang unknown at document-start; defer to DOMContentLoaded.
            return;
        }

        // englishQ === true, or phase 2 and still unknown → inject HUD only.
        if (phase === 2) {
            injectHUD();
        }
    }

    // Phase 1 — fires at document-start
    attemptAutoTranslate(1);

    // Phase 2 — fires after DOM is available
    function phase2() {
        // If a redirect already fired, page will unload; this is a no-op.
        attemptAutoTranslate(2);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", phase2, { once: true });
    } else {
        phase2();
    }

    // ─── HUD BUTTON (manual override) ────────────────────────────────────────
    function injectHUD() {
        if (document.getElementById("psi-at-hud")) return;

        GM_addStyle(`
            #psi-at-hud {
                position: fixed;
                bottom: 18px;
                right: 18px;
                z-index: 2147483647;
                display: flex;
                align-items: center;
                gap: 6px;
                background: rgba(10,15,26,0.92);
                border: 1px solid #00E5FF;
                border-radius: 8px;
                padding: 6px 10px;
                font: bold 12px 'Roboto Mono', monospace;
                color: #00E5FF;
                cursor: pointer;
                backdrop-filter: blur(4px);
                box-shadow: 0 0 12px rgba(0,229,255,0.25);
                user-select: none;
                transition: all 0.15s ease;
            }
            #psi-at-hud:hover {
                background: #00E5FF;
                color: #000;
                box-shadow: 0 0 18px #00E5FF;
            }
            #psi-at-hud:active { transform: scale(0.95); }
        `);

        const btn = document.createElement("div");
        btn.id = "psi-at-hud";
        btn.title = "Force-translate this page to English";
        btn.innerHTML = "文/A&nbsp;Translate";
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            redirectToTranslation();
        });
        document.body.appendChild(btn);
    }

    // ─── MENU COMMANDS ────────────────────────────────────────────────────────

    GM_registerMenuCommand("🌐 Translate this page → English", () => {
        redirectToTranslation();
    });

    GM_registerMenuCommand(
        autoEnabled ? "⏸ Disable auto-translate" : "▶ Enable auto-translate",
        () => {
            autoEnabled = !autoEnabled;
            GM_setValue(STORAGE_KEY_AUTO, autoEnabled);
            alert(`Auto-translate is now ${autoEnabled ? "ENABLED" : "DISABLED"}. Reload the page.`);
        }
    );

    GM_registerMenuCommand(
        skipHosts.includes(currentHost)
            ? `✅ Remove "${currentHost}" from skip list`
            : `🚫 Skip "${currentHost}" (never translate)`,
        () => {
            if (skipHosts.includes(currentHost)) {
                skipHosts = skipHosts.filter(h => h !== currentHost);
            } else {
                skipHosts.push(currentHost);
            }
            GM_setValue(STORAGE_KEY_SKIP, skipHosts);
            alert(`"${currentHost}" skip list updated. Reload to apply.`);
        }
    );

    // ─── BANNER HIDER (runs on translate.goog pages) ──────────────────────────
    function hideBanner() {
        function tryHide() {
            // The Google Translate nav frame injected at the top of translated pages
            const frame = document.getElementById("gt-nvframe")
                       || document.querySelector(".goog-te-banner-frame");
            if (frame) {
                frame.style.setProperty("display", "none", "important");
                if (document.body) {
                    document.body.style.setProperty("margin-top", "0", "important");
                    document.body.style.setProperty("top", "0", "important");
                }
                return true;
            }
            return false;
        }

        if (!tryHide()) {
            const obs = new MutationObserver(() => {
                if (tryHide()) obs.disconnect();
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
        }

        GM_addStyle(`
            .goog-te-banner-frame,
            #gt-nvframe,
            .skiptranslate > iframe { display:none !important; }
            body { top: 0 !important; margin-top: 0 !important; }
        `);
    }

    // ─── RETURN BUTTON (on translate.goog pages) ──────────────────────────────
    function addReturnButton() {
        const originalUrl = GM_getValue(STORAGE_KEY_ORIG, null);
        if (!originalUrl) return;

        GM_addStyle(`
            #psi-at-return {
                position: fixed;
                bottom: 18px;
                right: 18px;
                z-index: 2147483647;
                background: rgba(10,15,26,0.92);
                border: 1px solid #FFD700;
                border-radius: 8px;
                padding: 6px 10px;
                font: bold 12px 'Roboto Mono', monospace;
                color: #FFD700;
                cursor: pointer;
                backdrop-filter: blur(4px);
                box-shadow: 0 0 12px rgba(255,215,0,0.25);
                user-select: none;
                transition: all 0.15s ease;
            }
            #psi-at-return:hover {
                background: #FFD700;
                color: #000;
            }
        `);

        function mountReturn() {
            if (!document.body || document.getElementById("psi-at-return")) return;
            const btn = document.createElement("div");
            btn.id = "psi-at-return";
            btn.title = "Return to original page";
            btn.textContent = "← Original";
            btn.addEventListener("click", () => {
                GM_setValue(STORAGE_KEY_ORIG, null);
                window.location.assign(originalUrl);
            });
            document.body.appendChild(btn);
        }

        if (document.body) {
            mountReturn();
        } else {
            document.addEventListener("DOMContentLoaded", mountReturn, { once: true });
        }

        GM_registerMenuCommand("↩ Return to original page", () => {
            GM_setValue(STORAGE_KEY_ORIG, null);
            window.location.assign(originalUrl);
        });
    }

})();
