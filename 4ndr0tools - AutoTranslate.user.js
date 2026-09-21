// ==UserScript==
// @name         4ndr0tools - AutoTranslate
// @namespace    https://github.com/4ndr0666/userscripts
// @version      6.0.0
// @author       4ndr0666
// @description  Automatically translates any non-English page into English via translate.goog redirect — layered metadata + text language detection, SPA route watching, session back-loop guard, Ψ glass console. No broken Element API. No cookies. No banners.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @exclude      *://translate.google.com/*
// @exclude      *://translate.googleapis.com/*
// @noframes
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @downloadURL  https://raw.githubusercontent.com/4ndr0666/glm/main/autotranslate.user.js
// @updateURL    https://raw.githubusercontent.com/4ndr0666/glm/main/autotranslate.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

// Paradigm: Event-Driven Redirect Orchestrator — passive document/history listeners drive a
// layered language-decision pipeline (metadata -> script-range -> Latin n-gram scoring);
// zero polling loops, zero host-global mutation beyond the script's own overlay DOM, and
// every observer/timer is bound to an unconditional teardown clause.

(function () {
    "use strict";

    // ─── SCRIPT META ──────────────────────────────────────────────────────────
    const SCRIPT = { name: "4ndr0tools - AutoTranslate", version: "5.0.0-Ψ", spec: "3lectric-Glass" };

    // ─── CONSTANTS ────────────────────────────────────────────────────────────
    const TARGET_LANG        = "en";
    const UI_LANG            = "en";
    const SOURCE_LANG        = "auto";
    const TRANSLATE_SUFFIX   = "translate.goog";
    const STORAGE_KEY_ORIG   = "psi-at-original-url";   // original URL before redirect (JSON {url,host,ts}; legacy v4 = plain string)
    const STORAGE_KEY_SKIP   = "psi-at-skip-hosts";     // JSON array of skipped hostnames
    const STORAGE_KEY_AUTO   = "psi-at-auto-enabled";   // master auto-translate toggle
    const SESSION_KEY        = "psi-at-redirected";     // sessionStorage back-loop guard {href,ts}

    // Detection engine bounds (every wait is bounded — GUP D4 / B.1)
    const MIN_SAMPLE_LETTERS = 120;      // aligns the Latin 25-word floor (~120 letters) with CJK logographic density
    const PHASE3_WAIT_MS     = 4000;     // max wait for SPA content before deciding
    const OBSERVER_BAIL_MS   = 15000;    // banner-hider observer hard ceiling
    const LANG_WATCH_MS      = 10000;    // html[lang] attribute watcher hard ceiling
    const RECHECK_DELAY_MS   = 600;      // debounce for SPA history re-checks
    const MAX_RECHECKS       = 20;       // re-check budget per page load
    const STORE_STALE_MS     = 86400000; // 24h staleness for stored original URL / session marker

    // Unicode script ranges for conclusive non-Latin detection: [lo, hi, lang]
    const SCRIPT_RANGES = [
        [0x3040, 0x30FF, "ja"], [0x31F0, 0x31FF, "ja"], [0x3190, 0x319F, "ja"],
        [0xAC00, 0xD7AF, "ko"], [0x1100, 0x11FF, "ko"], [0x3130, 0x318F, "ko"],
        [0x4E00, 0x9FFF, "zh"], [0x3400, 0x4DBF, "zh"], [0xF900, 0xFAFF, "zh"],
        [0x0E00, 0x0E7F, "th"], [0x0E80, 0x0EFF, "lo"], [0x1780, 0x17FF, "kh"],
        [0x1000, 0x109F, "my"],
        [0x0590, 0x05FF, "he"],
        [0x0600, 0x06FF, "ar"], [0x0750, 0x077F, "ar"], [0xFB50, 0xFDFF, "ar"], [0xFE70, 0xFEFF, "ar"],
        [0x0400, 0x04FF, "ru"], [0x0500, 0x052F, "ru"],
        [0x0370, 0x03FF, "el"],
        [0x0900, 0x097F, "hi"], [0x0980, 0x09FF, "bn"], [0x0A00, 0x0A7F, "pa"],
        [0x0A80, 0x0AFF, "gu"], [0x0B00, 0x0B7F, "or"], [0x0B80, 0x0BFF, "ta"],
        [0x0C00, 0x0C7F, "te"], [0x0C80, 0x0CFF, "kn"], [0x0D00, 0x0D7F, "ml"],
        [0x0D80, 0x0DFF, "si"], [0x0F00, 0x0FFF, "bo"],
        [0x10A0, 0x10FF, "ka"], [0x0530, 0x058F, "hy"], [0x1200, 0x137F, "am"]
    ];

    // Top English function/content words — high hit-rate on real English prose.
    const ENGLISH_TOP = new Set([
        "the", "of", "and", "to", "in", "is", "it", "you", "that", "he", "was", "for", "on",
        "are", "with", "as", "his", "they", "at", "be", "this", "have", "from", "or", "one",
        "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can",
        "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if",
        "will", "up", "about", "out", "many", "then", "them", "these", "so", "some", "her",
        "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write",
        "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "water",
        "been", "call", "who", "oil", "its", "now", "find", "long", "down", "day", "did",
        "get", "come", "made", "may", "part"
    ]);

    // Non-English Latin-script function words per language.
    const FOREIGN_TOP = {
        fr: new Set(["le", "la", "les", "des", "une", "du", "et", "est", "en", "que", "pas",
                     "pour", "qui", "dans", "sur", "avec", "plus", "ce", "cette", "sont",
                     "nous", "vous", "mais", "leur", "aux", "au", "se", "son"]),
        es: new Set(["el", "la", "los", "las", "de", "que", "y", "en", "un", "una", "por",
                     "con", "para", "es", "son", "del", "como", "pero", "sus", "al", "lo",
                     "fue", "muy", "sin", "sobre", "entre", "cuando"]),
        de: new Set(["der", "die", "das", "und", "ist", "nicht", "mit", "für", "auf", "den",
                     "dem", "ein", "eine", "als", "auch", "von", "war", "wir", "sie", "ich",
                     "man", "dass", "sich", "beim", "nach", "über"]),
        it: new Set(["il", "lo", "la", "che", "di", "per", "con", "non", "sono", "le", "un",
                     "una", "del", "della", "gli", "nel", "alla", "più", "questa", "questo",
                     "come", "anche", "anno"]),
        pt: new Set(["o", "a", "os", "as", "de", "que", "em", "um", "para", "com", "não",
                     "por", "do", "da", "dos", "das", "uma", "mais", "como", "mas", "já",
                     "ao", "seu", "sua"]),
        nl: new Set(["de", "het", "een", "en", "van", "is", "niet", "met", "voor", "op",
                     "zijn", "aan", "ook", "maar", "om", "dan", "zich", "dat", "deze",
                     "worden"]),
        sv: new Set(["och", "att", "det", "som", "en", "på", "är", "för", "med", "inte",
                     "har", "den", "så", "till", "av", "men", "vi"]),
        da: new Set(["og", "det", "som", "en", "på", "til", "med", "har", "ikke", "den",
                     "så", "for", "af", "vi", "der", "kan"]),
        pl: new Set(["nie", "jest", "tak", "jak", "czy", "oraz", "przez", "dla", "ale",
                     "tego", "jego", "tym", "być", "się"])
    };

    // Diacritic letters that mark non-English Latin text (Vietnamese, Turkish, Polish,
    // Romanian, Nordic etc. fall back to this signal when word-lists miss them).
    const DIACRITIC_CHARS = "àáâãäåæçèéêëìíîïñòóôõöøùúûüýþßœąćęłńőśźżăîșțşţğışç";

    // ─── CSS PAYLOADS (3lectric-Glass tokens: glass L2/L3, #00E5FF/#67E8F9/#ff0055,
    //     JetBrains Mono / Orbitron, 0px button radius, 150ms ease-in-out) ─────────
    const HUD_CSS = `
        #psi-at-hud {
            position: fixed;
            bottom: 18px;
            right: 18px;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            gap: 6px;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            padding: 6px 10px;
            font: bold 12px "JetBrains Mono", ui-monospace, Consolas, monospace;
            color: #00E5FF;
            cursor: pointer;
            backdrop-filter: blur(6px);
            box-shadow: 0 0 12px rgba(0,229,255,0.15);
            user-select: none;
            transition: all 150ms ease-in-out;
        }
        #psi-at-hud:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        #psi-at-hud:active {
            background: rgba(0,229,255,0.3);
            color: #ffffff;
        }
        #psi-at-hud:focus-visible { outline: 1px solid #67E8F9; }
        .psi-at-badge {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            border: 1px solid rgba(0,229,255,0.3);
            padding: 1px 4px;
        }
        #psi-at-toast {
            position: fixed;
            bottom: 58px;
            right: 18px;
            z-index: 2147483647;
            max-width: 340px;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.3);
            border-radius: 4px;
            padding: 8px 12px;
            font: bold 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            color: #ffffff;
            box-shadow: 0 0 20px rgba(0,229,255,0.15);
            pointer-events: none;
            opacity: 0;
            transition: all 150ms ease-in-out;
        }
        #psi-at-toast.psi-on { opacity: 1; }
    `;

    const RETURN_CSS = `
        #psi-at-return {
            position: fixed;
            bottom: 18px;
            right: 18px;
            z-index: 2147483647;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            padding: 6px 10px;
            font: bold 12px "JetBrains Mono", ui-monospace, Consolas, monospace;
            color: #67E8F9;
            cursor: pointer;
            backdrop-filter: blur(6px);
            box-shadow: 0 0 12px rgba(0,229,255,0.15);
            user-select: none;
            transition: all 150ms ease-in-out;
        }
        #psi-at-return:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        #psi-at-return:active {
            background: rgba(0,229,255,0.3);
            color: #ffffff;
        }
        #psi-at-return:focus-visible { outline: 1px solid #67E8F9; }
    `;

    const BANNER_CSS = `
        .goog-te-banner-frame,
        #gt-nvframe,
        .skiptranslate > iframe { display:none !important; }
        body { top: 0 !important; margin-top: 0 !important; }
    `;

    const CONSOLE_CSS = `
        #psi-at-backdrop {
            position: fixed;
            inset: 0;
            z-index: 2147483646;
            background: rgba(5,10,15,0.45);
        }
        #psi-at-console {
            position: fixed;
            bottom: 64px;
            right: 18px;
            z-index: 2147483647;
            width: 320px;
            max-height: 70vh;
            overflow: hidden auto;
            display: flex;
            flex-direction: column;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.3);
            border-radius: 4px;
            box-shadow: 0 0 40px rgba(0,229,255,0.15);
            color: #00E5FF;
            font: 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            transition: all 150ms ease-in-out;
        }
        .psi-hd {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(10,19,26,0.95);
            border-bottom: 2px solid #00E5FF;
            padding: 10px;
        }
        .psi-hd-glyph { flex: 0 0 auto; }
        .psi-hd-titles { flex: 1 1 auto; min-width: 0; }
        .psi-title {
            font-family: "Orbitron", "JetBrains Mono", sans-serif;
            font-size: 13px;
            font-weight: 700;
            color: #67E8F9;
            letter-spacing: 1px;
        }
        .psi-sub { font-size: 9px; color: rgba(0,229,255,0.7); }
        .psi-close {
            flex: 0 0 auto;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #00E5FF;
            cursor: pointer;
            font: bold 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 4px 8px;
            transition: all 150ms ease-in-out;
        }
        .psi-close:hover {
            background: rgba(255,0,85,0.3);
            border-color: #ff0055;
            box-shadow: 0 0 25px #ff0055;
            color: #ffffff;
        }
        .psi-bd { padding: 10px; display: flex; flex-direction: column; gap: 10px; }
        .psi-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .psi-lab { color: #00E5FF; }
        .psi-host { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px; }
        .psi-sw {
            position: relative;
            width: 44px;
            height: 22px;
            display: inline-block;
            background: #050A0F;
            border: 1px solid #00E5FF;
            cursor: pointer;
            transition: all 150ms ease-in-out;
        }
        .psi-sw input { display: none; }
        .psi-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 16px;
            height: 16px;
            background: #00E5FF;
            box-shadow: 0 0 12px rgba(0,229,255,0.8);
            transition: all 150ms ease-in-out;
        }
        .psi-sw input:checked + .psi-knob { left: 24px; }
        .psi-sw:has(input:checked) { background: rgba(0,229,255,0.2); }
        .psi-btn {
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #00E5FF;
            cursor: pointer;
            font: bold 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 6px 10px;
            transition: all 150ms ease-in-out;
        }
        .psi-btn:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        .psi-btn:active { background: rgba(0,229,255,0.3); color: #ffffff; }
        .psi-destructive { border-color: #ff0055; color: #ff0055; }
        .psi-destructive:hover {
            background: rgba(255,0,85,0.3);
            border-color: #ff0055;
            box-shadow: 0 0 25px #ff0055;
            color: #ffffff;
        }
        .psi-block { display: flex; flex-direction: column; gap: 6px; }
        .psi-cap {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .psi-list {
            max-height: 160px;
            overflow: auto;
            background: rgba(10,19,26,0.55);
            border: 1px solid rgba(0,229,255,0.3);
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .psi-empty { font-size: 10px; color: rgba(0,229,255,0.7); }
        .psi-chip {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            font-size: 10px;
        }
        .psi-chip-x {
            background: none;
            border: 1px solid #ff0055;
            border-radius: 0px;
            color: #ff0055;
            cursor: pointer;
            font: bold 9px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 1px 4px;
            transition: all 150ms ease-in-out;
        }
        .psi-chip-x:hover {
            background: rgba(255,0,85,0.3);
            color: #ffffff;
            box-shadow: 0 0 25px #ff0055;
        }
        .psi-status {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            line-height: 1.5;
            word-break: break-all;
        }
        .psi-actions { display: flex; gap: 6px; }
        .psi-actions .psi-btn { flex: 1 1 auto; }
    `;

    // ─── GUARD: already on translate.goog — only hide the nav banner ─────────
    if (window.location.hostname.endsWith(TRANSLATE_SUFFIX)) {
        hideBanner();
        addReturnButton();
        return;
    }

    // ─── GUARD: skip iframe contexts ─────────────────────────────────────────
    if (window !== window.top) return;

    // ─── SETTINGS (ingested once at boot; writes go through storeSet) ────────
    let autoEnabled = storeGet(STORAGE_KEY_AUTO, true);
    let skipHosts   = storeGet(STORAGE_KEY_SKIP, []);
    if (!Array.isArray(skipHosts)) skipHosts = [];

    // ─── SESSION / PIPELINE STATE ─────────────────────────────────────────────
    let engaged            = false;   // user typed or clicked into the page
    let lastRedirectHref   = null;    // in-memory back-loop marker fallback
    let recheckTimer       = null;    // SPA re-check debounce timer
    let recheckCount       = 0;       // SPA re-check budget
    let phase3Fired        = false;   // one bounded late-content wait per decision round
    let langBailTimer      = null;    // html[lang] watcher ceiling timer
    let menuIds            = [];      // registered menu command ids
    let menusRegisteredOnce = false;  // one-shot latch for managers without unregister
    let toastTimer         = null;    // toast auto-dismiss timer
    let redirecting        = false;   // suppresses HUD flash during unload

    const currentHost = window.location.hostname;

    // ─── SAFE STORAGE (GM first, localStorage fallback, guarded writes) ──────

    function storeGet(key, fallback) {
        try {
            if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            return JSON.parse(raw);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] storeGet failed for", key, err);
            return fallback;
        }
    }

    function storeSet(key, value) {
        try {
            if (typeof GM_setValue === "function") { GM_setValue(key, value); return; }
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] storeSet failed for", key, err);
        }
    }

    function storeDelete(key) {
        try {
            if (typeof GM_deleteValue === "function") { GM_deleteValue(key); return; }
            localStorage.removeItem(key);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] storeDelete failed for", key, err);
        }
    }

    // ─── SESSION BACK-LOOP GUARD ──────────────────────────────────────────────
    // Without this, Back from translate.goog reloads the original page, which
    // auto-redirects again — trapping the user in an infinite back-loop.

    function markRedirected(href) {
        lastRedirectHref = href;
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ href: href, ts: Date.now() }));
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] sessionStorage unavailable — in-memory marker only:", err);
        }
    }

    function wasRedirected(href) {
        if (href && lastRedirectHref === href) return true;
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            const entry = JSON.parse(raw);
            return Boolean(entry && entry.href === href && Date.now() - (Number(entry.ts) || 0) < STORE_STALE_MS);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] session marker read failed:", err);
            return false;
        }
    }

    // ─── ENGAGEMENT TRACKING (self-removing capture listeners) ────────────────
    // A late text-derived redirect must never yank a page out from under a user
    // who is already typing or clicking into it.

    function markEngaged(e) {
        if (e && e.type === "keydown" && (e.ctrlKey || e.metaKey || e.altKey)) return;
        engaged = true;
        try {
            document.removeEventListener("keydown", markEngaged, true);
            document.removeEventListener("pointerdown", markEngaged, true);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] engagement listener removal failed:", err);
        }
    }

    function isUserEngaged() { return engaged; }

    // ─── URL ENGINE ───────────────────────────────────────────────────────────

    function buildTranslateUrl(originalUrl) {
        try {
            const url = new URL(originalUrl);
            if (!/^https?:$/.test(url.protocol) || !url.hostname) return null;
            if (url.hostname.endsWith(TRANSLATE_SUFFIX)) return null;   // never re-wrap
            const tHost = url.hostname.replace(/\./g, "-") + "." + TRANSLATE_SUFFIX;
            const tUrl = new URL(url.toString());
            tUrl.hostname = tHost;
            tUrl.searchParams.set("_x_tr_sl", SOURCE_LANG);
            tUrl.searchParams.set("_x_tr_tl", TARGET_LANG);
            tUrl.searchParams.set("_x_tr_hl", UI_LANG);
            tUrl.searchParams.set("_x_tr_pto", "wapp");
            return tUrl.toString();
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] buildTranslateUrl rejected:", originalUrl, err);
            return null;
        }
    }

    // Best-effort reverse of the translate.goog host mangling. Dashes were
    // formerly dots, so hyphenated original hosts are ambiguous — this is a
    // FALLBACK only; the stored original (authoritative) is preferred.
    function deriveOriginalFromTranslated(href) {
        try {
            const url = new URL(href);
            if (!url.hostname.endsWith("." + TRANSLATE_SUFFIX)) return null;
            const labels = url.hostname.slice(0, url.hostname.length - (TRANSLATE_SUFFIX.length + 1)).split("-");
            if (!labels.length || labels.some((l) => !l)) return null;
            const oUrl = new URL(url.toString());
            oUrl.hostname = labels.join(".");
            oUrl.searchParams.delete("_x_tr_sl");
            oUrl.searchParams.delete("_x_tr_tl");
            oUrl.searchParams.delete("_x_tr_hl");
            oUrl.searchParams.delete("_x_tr_pto");
            return oUrl.toString();
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] deriveOriginalFromTranslated rejected:", href, err);
            return null;
        }
    }

    // Reads the stored original URL; accepts the legacy v4 plain-string format,
    // validates host match (kills the cross-tab clobber bug) and 24h staleness.
    function readStoredOriginal() {
        const raw = storeGet(STORAGE_KEY_ORIG, null);
        if (raw === null || raw === undefined) return null;
        let entry = null;
        if (typeof raw === "string") {
            try {
                entry = JSON.parse(raw);
            } catch (err) {
                entry = null;
            }
            if (!entry || typeof entry !== "object" || typeof entry.url !== "string") {
                entry = { url: raw, host: "", ts: 0 };   // legacy v4 plain string
            }
        } else if (typeof raw === "object" && typeof raw.url === "string") {
            entry = raw;
        }
        if (!entry) return null;
        let host = String(entry.host || "");
        if (!host) {
            try { host = new URL(entry.url).hostname; } catch (err) { host = ""; }
        }
        if (host) {
            const expected = host.replace(/\./g, "-") + "." + TRANSLATE_SUFFIX;
            if (window.location.hostname !== expected) return null;    // stale entry from another tab
        }
        const ts = Number(entry.ts) || 0;
        if (ts > 0 && Date.now() - ts > STORE_STALE_MS) return null;   // older than 24h
        return { url: entry.url, ts: ts };
    }

    function redirectToTranslation() {
        const translated = buildTranslateUrl(window.location.href);
        if (!translated) {
            console.debug("[Ψ-AutoTranslate] translation skipped: unsupported URL.");
            showToast("Cannot translate this URL");
            return false;
        }
        markRedirected(window.location.href);
        redirecting = true;
        storeSet(STORAGE_KEY_ORIG, JSON.stringify({ url: window.location.href, host: currentHost, ts: Date.now() }));
        try {
            window.location.replace(translated);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] navigation blocked:", err);
            redirecting = false;
            showToast("Translation blocked by the page");
        }
        return true;
    }

    // ─── LANGUAGE ENGINE ──────────────────────────────────────────────────────

    // Normalizes an arbitrary language tag: trim, lowercase, underscores to
    // hyphens, ISO 639-2/B "eng" mapped to "en".
    function normalizeLangTag(raw) {
        const tag = String(raw || "").trim().toLowerCase();
        if (!tag) return "";
        const primary = tag.split(/[-_]/)[0];
        if (primary === "eng") return "en";
        return tag.replace(/_/g, "-");
    }

    // Detect page language from metadata sources, most reliable first.
    // Returns a lowercase BCP-47 string or null if unknown.
    function detectPageLang() {
        const de = document.documentElement;
        if (!de) return null;                     // pre-document injection timing

        // 1. <html lang="...">  — most reliable
        const htmlLang = (de.lang || "").trim().toLowerCase();
        if (htmlLang) return htmlLang;

        // 1b. <html xml:lang="..."> — legacy XHTML attribute
        const xmlLang = (de.getAttribute("xml:lang") || "").trim().toLowerCase();
        if (xmlLang) return xmlLang;

        // 2. <meta http-equiv="Content-Language" content="...">
        const metaHTTP = document.querySelector('meta[http-equiv="Content-Language"]');
        if (metaHTTP && metaHTTP.content) return metaHTTP.content.trim().toLowerCase();

        // 3. <meta name="language" content="...">
        const metaName = document.querySelector('meta[name="language"]');
        if (metaName && metaName.content) return metaName.content.trim().toLowerCase();

        // 4. Open Graph locale  <meta property="og:locale" content="en_US">
        const ogLocale = document.querySelector('meta[property="og:locale"]');
        if (ogLocale && ogLocale.content) return ogLocale.content.trim().toLowerCase().replace(/_/g, "-");

        return null;
    }

    function isEnglish(lang) {
        if (!lang) return null;          // null = unknown
        const tag = normalizeLangTag(lang);
        if (!tag) return null;
        if (tag === "und" || tag === "zxx" || tag === "mul") return null;  // undetermined/silent/multiple
        return tag === "en" || tag.startsWith("en-");
    }

    // Walks visible text nodes (capped) — the sample the text engine scores.
    function sampleVisibleText() {
        const body = document.body;
        if (!body) return null;
        const SKIP_SEL = "script,style,noscript,template,code,pre,textarea,#psi-at-hud,#psi-at-console,#psi-at-return,#psi-at-toast";
        const MAX_NODES = 400;
        const MAX_CHARS = 6000;
        const parts = [];
        let nodeCount = 0;
        let charCount = 0;
        try {
            const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
            let node = walker.nextNode();
            while (node && nodeCount < MAX_NODES && charCount < MAX_CHARS) {
                const parent = node.parentElement;
                if (parent && !parent.closest(SKIP_SEL)) {
                    const t = node.nodeValue;
                    if (t && t.trim()) {
                        parts.push(t);
                        charCount += t.length;
                        nodeCount++;
                    }
                }
                node = walker.nextNode();
            }
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] text sampling failed:", err);
            return null;
        }
        if (!parts.length) return null;
        const text = parts.join(" ").slice(0, 4000);
        let letters = 0;
        try {
            letters = (text.match(/\p{L}/gu) || []).length;
        } catch (err) {
            letters = (text.match(/[a-zA-Z]/g) || []).length;
        }
        return { text: text, letters: letters };
    }

    // Conclusive non-Latin detection via Unicode script-range histogram.
    function classifyByScript(text, letterTotal) {
        const counts = new Map();
        const slice = text.slice(0, 4000);
        for (let i = 0; i < slice.length; i++) {
            const cp = slice.codePointAt(i);
            if (cp > 0xFFFF) { i++; continue; }              // skip surrogate pairs / emoji
            for (const range of SCRIPT_RANGES) {
                if (cp >= range[0] && cp <= range[1]) {
                    counts.set(range[2], (counts.get(range[2]) || 0) + 1);
                    break;
                }
            }
        }
        let best = null;
        let bestCount = 0;
        for (const pair of counts.entries()) {
            if (pair[1] > bestCount) { best = pair[0]; bestCount = pair[1]; }
        }
        if (best && bestCount >= 12 && letterTotal > 0 && bestCount >= letterTotal * 0.15) {
            return { lang: best, foreign: true, script: true };
        }
        return null;
    }

    // Latin-script disambiguation: English function-word rate vs foreign
    // function-word rate vs diacritic density. Deliberately conservative —
    // a false redirect on an English page is costly, a missed one is one
    // HUD click away.
    function classifyLatinText(text, letterTotal) {
        let tokens = null;
        try {
            tokens = text.toLowerCase().match(/\p{L}+/gu);
        } catch (err) {
            tokens = text.toLowerCase().match(/[a-zà-öø-ÿ]+/g);
        }
        if (!tokens || tokens.length < 25) return null;
        const words = tokens.length;
        let english = 0;
        const foreign = new Map();
        for (const w of tokens) {
            if (w.length < 2) continue;
            if (ENGLISH_TOP.has(w)) english++;
            for (const lang in FOREIGN_TOP) {
                if (FOREIGN_TOP[lang].has(w)) {
                    foreign.set(lang, (foreign.get(lang) || 0) + 1);
                    break;
                }
            }
        }
        let diacritics = 0;
        for (const ch of text) {
            if (DIACRITIC_CHARS.indexOf(ch) !== -1) diacritics++;
        }
        const eScore = english / words;
        let fLang = null;
        let fCount = 0;
        for (const pair of foreign.entries()) {
            if (pair[1] > fCount) { fLang = pair[0]; fCount = pair[1]; }
        }
        const fScore = fCount / words;
        const dRatio = letterTotal > 0 ? diacritics / letterTotal : 0;
        if (fScore >= 0.05 && fScore >= eScore * 1.3) return { lang: fLang, foreign: true, script: false };
        if (dRatio >= 0.04 && eScore < 0.04) return { lang: "und", foreign: true, script: false };
        if (eScore >= 0.08 && fScore <= eScore * 0.8 && dRatio < 0.02) return { lang: "en", foreign: false, script: false };
        return null;
    }

    // Fusion used by the console status line: best-effort language + source.
    function detectContentLanguage() {
        const meta = detectPageLang();
        if (meta) return { lang: meta, source: "meta" };
        const sample = sampleVisibleText();
        if (sample && sample.letters >= MIN_SAMPLE_LETTERS) {
            const cls = classifyByScript(sample.text, sample.letters) || classifyLatinText(sample.text, sample.letters);
            if (cls) return { lang: cls.lang, source: "text" };
        }
        return { lang: null, source: "?" };
    }

    // ─── MAIN AUTO-TRANSLATE LOGIC ────────────────────────────────────────────
    //
    // Strategy:
    //   • run-at document-start so we can redirect before the page renders,
    //     but <html lang> may not be stamped yet — so we do a two-phase check.
    //   • Phase 1 (document-start): check whatever metadata is available right now.
    //   • Phase 2 (DOMContentLoaded): recheck metadata; if still inconclusive,
    //     score the ACTUAL visible text (script ranges, then Latin word rates).
    //   • Phase 3 (bounded 4s wait): if the body was still thin at phase 2 (SPA
    //     client-side render), wait for content, then decide.
    //   • If conclusively non-English (metadata or text) → redirect immediately.
    //   • If conclusively English or still unknown → HUD only.

    function attemptAutoTranslate(phase) {
        if (!autoEnabled) return;
        if (skipHosts.includes(currentHost)) return;
        if (wasRedirected(window.location.href)) {           // Back from translate.goog?
            if (phase >= 2) injectHUD();                     // manual override stays available
            return;
        }

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

        if (englishQ === true) {
            // englishQ === true → inject HUD only.
            if (phase >= 2) { injectHUD(); updateHudBadge("en"); }
            return;
        }

        // englishQ === null and phase >= 2 → text-based decision.
        const sample = sampleVisibleText();
        if (!sample || sample.letters < MIN_SAMPLE_LETTERS) {
            if (phase === 2) {
                injectHUD();                                 // manual surface up immediately
                phase3();                                    // bounded wait for late SPA content
            }
            return;
        }
        decideFromText(sample, phase);
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

    // Phase 3 — bounded wait for late SPA content, then a final decision.
    function phase3() {
        if (phase3Fired) return;
        phase3Fired = true;
        waitForBodyText(PHASE3_WAIT_MS)
            .then((sample) => {
                if (sample) attemptAutoTranslate(3);
            })
            .catch((err) => {
                console.debug("[Ψ-AutoTranslate] phase3 wait failed:", err);
            });
    }

    // Bounded MutationObserver wait: resolves as soon as the body carries a
    // usable text sample, or null at the deadline. Every resource reclaimed.
    function waitForBodyText(timeoutMs) {
        return new Promise((resolve) => {
            let settled = false;
            let obs = null;
            let timer = null;
            let lastProbe = 0;
            const finish = (value) => {
                if (settled) return;
                settled = true;
                if (obs) obs.disconnect();
                if (timer !== null) clearTimeout(timer);
                resolve(value);
            };
            const probe = () => {
                const now = Date.now();
                if (now - lastProbe < 120) return;          // throttle observer callbacks
                lastProbe = now;
                const sample = sampleVisibleText();
                if (sample && sample.letters >= MIN_SAMPLE_LETTERS) finish(sample);
            };
            probe();
            if (settled) return;
            if (typeof MutationObserver === "function" && document.body) {
                obs = new MutationObserver(probe);
                obs.observe(document.body, { childList: true, subtree: true, characterData: true });
            }
            timer = setTimeout(() => {
                const sample = sampleVisibleText();
                finish(sample && sample.letters >= MIN_SAMPLE_LETTERS ? sample : null);
            }, timeoutMs);
        });
    }

    // Text-derived decision. Phase 3 redirects are engagement-gated: never yank
    // a page out from under a user who is already typing or clicking into it.
    function decideFromText(sample, phase) {
        const cls = classifyByScript(sample.text, sample.letters) || classifyLatinText(sample.text, sample.letters);
        console.debug(`[Ψ-AutoTranslate] Phase ${phase}: text engine → ${cls ? (cls.foreign ? "foreign:" + cls.lang : "english") : "unknown"}.`);
        if (cls && cls.foreign) {
            if (phase === 3 && isUserEngaged()) {
                injectHUD();
                updateHudBadge(cls.lang);
                showToast("Auto-translate paused — page in use. Click Ψ to translate.");
                return;
            }
            console.log(`[Ψ-AutoTranslate] Phase ${phase}: text="${cls.lang}" → redirecting.`);
            redirectToTranslation();
            return;
        }
        injectHUD();
        updateHudBadge(cls && cls.lang === "en" ? "en" : null);
    }

    // Watches <html lang> writes by SPA frameworks after route mounts — the
    // most common way late language evidence appears. Bounded to LANG_WATCH_MS.
    function watchLangAttribute() {
        try {
            const install = (root) => {
                const obs = new MutationObserver((records) => {
                    for (const record of records) {
                        if (record.attributeName !== "lang" && record.attributeName !== "xml:lang") continue;
                        const lang = normalizeLangTag(root.getAttribute("lang") || root.getAttribute("xml:lang") || "");
                        if (lang && isEnglish(lang) === false) {
                            obs.disconnect();
                            if (langBailTimer !== null) { clearTimeout(langBailTimer); langBailTimer = null; }
                            if (autoEnabled && !skipHosts.includes(currentHost) && !wasRedirected(window.location.href)) {
                                console.log(`[Ψ-AutoTranslate] lang attribute → "${lang}" → redirecting.`);
                                redirectToTranslation();
                            }
                            return;
                        }
                    }
                });
                langBailTimer = setTimeout(() => {
                    obs.disconnect();
                    langBailTimer = null;
                }, LANG_WATCH_MS);
                obs.observe(root, { attributes: true, attributeFilter: ["lang", "xml:lang"] });
            };
            const root = document.documentElement;
            if (root) install(root);
            else document.addEventListener("DOMContentLoaded", () => {
                if (document.documentElement) install(document.documentElement);
            }, { once: true });
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] lang attribute watch unavailable:", err);
        }
    }

    // SPA route changes: composed single-layer history patches + popstate,
    // debounced, with a hard re-check budget per page load.
    function watchNavigation() {
        try {
            if (!window.history || typeof window.history.pushState !== "function") return;
            const patchHistory = (name) => {
                const original = window.history[name];
                if (typeof original !== "function") return;
                window.history[name] = function (...args) {
                    const result = original.apply(this, args);
                    scheduleRecheck();
                    return result;
                };
            };
            patchHistory("pushState");
            patchHistory("replaceState");
            window.addEventListener("popstate", scheduleRecheck);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] history watch unavailable:", err);
        }
    }

    function scheduleRecheck() {
        if (recheckTimer !== null) clearTimeout(recheckTimer);
        if (recheckCount >= MAX_RECHECKS) {
            console.debug("[Ψ-AutoTranslate] re-check budget exhausted; HUD-only from here.");
            return;
        }
        recheckTimer = setTimeout(() => {
            recheckTimer = null;
            if (wasRedirected(window.location.href)) return;
            recheckCount++;
            phase3Fired = false;                              // allow one fresh late-content wait per route
            attemptAutoTranslate(2);
        }, RECHECK_DELAY_MS);
    }

    // ─── STYLE INJECTION ──────────────────────────────────────────────────────

    // Id-deduplicated <style> injection (safe at document-start: falls back to
    // documentElement when <head> does not exist yet).
    function injectStyle(css, id) {
        try {
            let style = id ? document.getElementById(id) : null;
            if (style) { style.textContent = css; return style; }
            style = document.createElement("style");
            if (id) style.id = id;
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
            return style;
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] style injection failed:", err);
            return null;
        }
    }

    // Baseline-compatible GM_addStyle path with manual fallback.
    function addCss(css) {
        if (typeof GM_addStyle === "function") {
            try { return GM_addStyle(css); } catch (err) {
                console.debug("[Ψ-AutoTranslate] GM_addStyle failed:", err);
            }
        }
        return injectStyle(css);
    }

    // ─── DOM UTILITIES ────────────────────────────────────────────────────────

    function whenBody(fn) {
        if (document.body) { fn(); return; }
        document.addEventListener("DOMContentLoaded", fn, { once: true });
    }

    // Ψ branding glyph (4ndr0666_glyph.txt geometry) built via createElementNS.
    function buildGlyph(size) {
        const NS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(NS, "svg");
        svg.setAttribute("viewBox", "0 0 128 128");
        svg.setAttribute("width", String(size));
        svg.setAttribute("height", String(size));
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "#00E5FF");
        svg.setAttribute("stroke-width", "3");
        svg.setAttribute("stroke-linecap", "round");
        svg.setAttribute("stroke-linejoin", "round");
        svg.style.display = "block";
        const rings = [
            { d: "M 64,12 A 52,52 0 1 1 63.9,12 Z", dash: "21.78 21.78", w: "2", op: null },
            { d: "M 64,20 A 44,44 0 1 1 63.9,20 Z", dash: "10 10", w: "1.5", op: "0.7" },
            { d: "M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z", dash: null, w: null, op: null }
        ];
        for (const ring of rings) {
            const path = document.createElementNS(NS, "path");
            path.setAttribute("d", ring.d);
            if (ring.dash) path.setAttribute("stroke-dasharray", ring.dash);
            if (ring.w) path.setAttribute("stroke-width", ring.w);
            if (ring.op) path.setAttribute("opacity", ring.op);
            svg.appendChild(path);
        }
        const core = document.createElementNS(NS, "text");
        core.setAttribute("x", "64");
        core.setAttribute("y", "67");
        core.setAttribute("text-anchor", "middle");
        core.setAttribute("dominant-baseline", "middle");
        core.setAttribute("fill", "#00E5FF");
        core.setAttribute("stroke", "none");
        core.setAttribute("font-size", "56");
        core.setAttribute("font-weight", "700");
        core.setAttribute("font-family", "'Cinzel Decorative', serif");
        core.textContent = "Ψ";
        svg.appendChild(core);
        return svg;
    }

    // Non-blocking status toast (replaces the baseline's blocking alert()).
    function showToast(text) {
        whenBody(() => {
            let el = document.getElementById("psi-at-toast");
            if (!el) {
                el = document.createElement("div");
                el.id = "psi-at-toast";
                el.setAttribute("role", "status");
                injectStyle(HUD_CSS, "psi-at-hud-style");
                document.body.appendChild(el);
            }
            el.textContent = text;
            el.classList.add("psi-on");
            if (toastTimer !== null) clearTimeout(toastTimer);
            toastTimer = setTimeout(() => {
                el.classList.remove("psi-on");
                toastTimer = null;
            }, 2600);
        });
    }

    // ─── HUD BUTTON (manual override) ────────────────────────────────────────
    function injectHUD() {
        if (redirecting) return;                              // page is unloading to translate.goog
        if (document.getElementById("psi-at-hud")) return;
        injectStyle(HUD_CSS, "psi-at-hud-style");
        whenBody(() => {
            if (redirecting) return;
            if (document.getElementById("psi-at-hud")) return;

            const btn = document.createElement("div");
            btn.id = "psi-at-hud";
            btn.title = "Force-translate this page to English · right-click for Ψ settings";
            btn.setAttribute("role", "button");
            btn.setAttribute("tabindex", "0");
            btn.appendChild(buildGlyph(14));

            const label = document.createElement("span");
            label.textContent = "Translate";
            btn.appendChild(label);

            const badge = document.createElement("span");
            badge.id = "psi-at-lang";
            badge.className = "psi-at-badge";
            badge.textContent = "—";
            btn.appendChild(badge);

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                redirectToTranslation();
            });
            btn.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    redirectToTranslation();
                }
            });
            btn.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openConsole();
            });
            document.body.appendChild(btn);
        });
    }

    function updateHudBadge(lang) {
        const badge = document.getElementById("psi-at-lang");
        if (!badge) return;
        badge.textContent = lang || "—";
    }

    // ─── Ψ SETTINGS CONSOLE ───────────────────────────────────────────────────

    function openConsole() {
        if (document.getElementById("psi-at-console")) return;
        injectStyle(CONSOLE_CSS, "psi-at-console-style");
        whenBody(() => {
            if (document.getElementById("psi-at-console")) return;

            const detection = detectContentLanguage();

            const backdrop = document.createElement("div");
            backdrop.id = "psi-at-backdrop";

            const panel = document.createElement("div");
            panel.id = "psi-at-console";
            panel.setAttribute("role", "dialog");

            const hd = document.createElement("div");
            hd.className = "psi-hd";
            const hdGlyph = buildGlyph(20);
            hdGlyph.classList.add("psi-hd-glyph");
            const titles = document.createElement("div");
            titles.className = "psi-hd-titles";
            const title = document.createElement("div");
            title.className = "psi-title";
            title.textContent = "Ψ AUTOTRANSLATE";
            const subtitle = document.createElement("div");
            subtitle.className = "psi-sub";
            subtitle.textContent = SCRIPT.version + " · " + SCRIPT.spec;
            titles.appendChild(title);
            titles.appendChild(subtitle);
            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "psi-close";
            closeBtn.textContent = "✕";
            closeBtn.title = "Close";
            closeBtn.addEventListener("click", closeConsole);
            hd.appendChild(hdGlyph);
            hd.appendChild(titles);
            hd.appendChild(closeBtn);

            const bd = document.createElement("div");
            bd.className = "psi-bd";

            const rowAuto = document.createElement("div");
            rowAuto.className = "psi-row";
            const labAuto = document.createElement("span");
            labAuto.className = "psi-lab";
            labAuto.textContent = "Auto-translate";
            const sw = document.createElement("label");
            sw.className = "psi-sw";
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.id = "psi-at-auto";
            cb.checked = autoEnabled;
            cb.addEventListener("change", () => {
                autoEnabled = cb.checked;
                storeSet(STORAGE_KEY_AUTO, autoEnabled);
                refreshMenus();
                renderStatus();
            });
            const knob = document.createElement("span");
            knob.className = "psi-knob";
            sw.appendChild(cb);
            sw.appendChild(knob);
            rowAuto.appendChild(labAuto);
            rowAuto.appendChild(sw);

            const rowHost = document.createElement("div");
            rowHost.className = "psi-row";
            const labHost = document.createElement("span");
            labHost.className = "psi-lab psi-host";
            labHost.textContent = currentHost;
            labHost.title = currentHost;
            const hostBtn = document.createElement("button");
            hostBtn.type = "button";
            hostBtn.className = "psi-btn";
            hostBtn.textContent = skipHosts.includes(currentHost) ? "Remove from skip" : "Skip this host";
            hostBtn.addEventListener("click", () => {
                toggleSkipHost(currentHost);
                hostBtn.textContent = skipHosts.includes(currentHost) ? "Remove from skip" : "Skip this host";
                renderList();
            });
            rowHost.appendChild(labHost);
            rowHost.appendChild(hostBtn);

            const block = document.createElement("div");
            block.className = "psi-block";
            const cap = document.createElement("div");
            cap.className = "psi-cap";
            cap.textContent = "Skipped hosts";
            const list = document.createElement("div");
            list.id = "psi-at-skiplist";
            list.className = "psi-list";
            block.appendChild(cap);
            block.appendChild(list);

            const status = document.createElement("div");
            status.id = "psi-at-status";
            status.className = "psi-status";

            const actions = document.createElement("div");
            actions.className = "psi-actions";
            const goBtn = document.createElement("button");
            goBtn.type = "button";
            goBtn.className = "psi-btn";
            goBtn.textContent = "Translate now";
            goBtn.addEventListener("click", () => { redirectToTranslation(); });
            const resetBtn = document.createElement("button");
            resetBtn.type = "button";
            resetBtn.className = "psi-btn psi-destructive";
            resetBtn.textContent = "Reset";
            resetBtn.title = "Reset all Ψ AutoTranslate settings";
            resetBtn.addEventListener("click", () => {
                storeDelete(STORAGE_KEY_AUTO);
                storeDelete(STORAGE_KEY_SKIP);
                storeDelete(STORAGE_KEY_ORIG);
                autoEnabled = true;
                skipHosts = [];
                cb.checked = true;
                refreshMenus();
                renderList();
                renderStatus();
                showToast("Ψ AutoTranslate settings reset");
            });
            const closeBtn2 = document.createElement("button");
            closeBtn2.type = "button";
            closeBtn2.className = "psi-btn";
            closeBtn2.textContent = "Close";
            closeBtn2.addEventListener("click", closeConsole);
            actions.appendChild(goBtn);
            actions.appendChild(resetBtn);
            actions.appendChild(closeBtn2);

            bd.appendChild(rowAuto);
            bd.appendChild(rowHost);
            bd.appendChild(block);
            bd.appendChild(status);
            bd.appendChild(actions);
            panel.appendChild(hd);
            panel.appendChild(bd);
            document.body.appendChild(backdrop);
            document.body.appendChild(panel);

            function renderList() {
                while (list.firstChild) list.removeChild(list.firstChild);
                if (!skipHosts.length) {
                    const empty = document.createElement("div");
                    empty.className = "psi-empty";
                    empty.textContent = "No skipped hosts.";
                    list.appendChild(empty);
                    return;
                }
                for (const host of skipHosts.slice()) {
                    const chip = document.createElement("span");
                    chip.className = "psi-chip";
                    const name = document.createElement("span");
                    name.textContent = host;
                    const x = document.createElement("button");
                    x.type = "button";
                    x.className = "psi-chip-x";
                    x.textContent = "✕";
                    x.title = "Remove " + host;
                    x.addEventListener("click", () => {
                        skipHosts = skipHosts.filter((h) => h !== host);
                        storeSet(STORAGE_KEY_SKIP, skipHosts);
                        refreshMenus();
                        renderList();
                        if (host === currentHost) hostBtn.textContent = "Skip this host";
                    });
                    chip.appendChild(name);
                    chip.appendChild(x);
                    list.appendChild(chip);
                }
            }

            function renderStatus() {
                status.textContent = "detected: " + (detection.lang ? detection.lang : "?") +
                    " · source: " + detection.source +
                    " · auto: " + (autoEnabled ? "on" : "off") +
                    " · skip: " + (skipHosts.includes(currentHost) ? "yes" : "no");
            }

            renderList();
            renderStatus();

            backdrop.addEventListener("click", closeConsole);
            document.addEventListener("keydown", consoleKeyHandler);
        });
    }

    function consoleKeyHandler(e) {
        if (e.key === "Escape") closeConsole();
    }

    function closeConsole() {
        try {
            document.removeEventListener("keydown", consoleKeyHandler);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] console listener removal failed:", err);
        }
        const backdrop = document.getElementById("psi-at-backdrop");
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        const panel = document.getElementById("psi-at-console");
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    }

    // ─── MENU COMMANDS ────────────────────────────────────────────────────────

    function addMenuCommand(label, fn) {
        try {
            if (typeof GM_registerMenuCommand === "function") return GM_registerMenuCommand(label, fn);
        } catch (err) {
            console.debug("[Ψ-AutoTranslate] menu registration failed:", err);
        }
        return null;
    }

    function toggleSkipHost(host) {
        if (skipHosts.includes(host)) {
            skipHosts = skipHosts.filter((h) => h !== host);
        } else {
            skipHosts.push(host);
        }
        storeSet(STORAGE_KEY_SKIP, skipHosts);
        refreshMenus();
        showToast(`"${host}" ${skipHosts.includes(host) ? "added to" : "removed from"} skip list`);
    }

    function registerMenus() {
        refreshMenus();
    }

    // Re-registers menu commands so toggle labels reflect live state on managers
    // that support GM_unregisterMenuCommand; otherwise registers once with
    // state-neutral labels that can never go stale.
    function refreshMenus() {
        if (typeof GM_registerMenuCommand !== "function") return;
        const canUnregister = typeof GM_unregisterMenuCommand === "function";
        if (!canUnregister && menusRegisteredOnce) return;
        if (canUnregister && menuIds.length) {
            for (const id of menuIds) {
                try { GM_unregisterMenuCommand(id); }
                catch (err) { console.debug("[Ψ-AutoTranslate] menu unregister failed:", err); }
            }
        }
        menuIds = [];
        const push = (label, fn) => {
            const id = addMenuCommand(label, fn);
            if (id !== null && id !== undefined) menuIds.push(id);
        };
        push("🌐 Translate this page → English", () => {
            redirectToTranslation();
        });
        const autoLabel = canUnregister
            ? (autoEnabled ? "⏸ Disable auto-translate" : "▶ Enable auto-translate")
            : "⏯ Toggle auto-translate";
        push(autoLabel, () => {
            autoEnabled = !autoEnabled;
            storeSet(STORAGE_KEY_AUTO, autoEnabled);
            refreshMenus();
            showToast(`Auto-translate ${autoEnabled ? "ENABLED" : "DISABLED"} — reload to apply`);
        });
        const skipLabel = canUnregister
            ? (skipHosts.includes(currentHost)
                ? `✅ Remove "${currentHost}" from skip list`
                : `🚫 Skip "${currentHost}" (never translate)`)
            : `🚫 Toggle skip for "${currentHost}"`;
        push(skipLabel, () => {
            toggleSkipHost(currentHost);
        });
        push("⚙ Ψ AutoTranslate settings", () => {
            openConsole();
        });
        menusRegisteredOnce = true;
    }

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

        const attach = () => {
            if (!tryHide()) {
                let hidden = false;
                const obs = new MutationObserver(() => {
                    if (tryHide()) {
                        hidden = true;
                        obs.disconnect();
                    }
                });
                obs.observe(document.documentElement, { childList: true, subtree: true });
                setTimeout(() => {
                    if (!hidden) obs.disconnect();           // D4: bounded observer lifetime
                }, OBSERVER_BAIL_MS);
            }
        };
        if (document.documentElement) attach();
        else document.addEventListener("DOMContentLoaded", attach, { once: true });

        addCss(BANNER_CSS);
    }

    // ─── RETURN BUTTON (on translate.goog pages) ──────────────────────────────
    function addReturnButton() {
        const stored  = readStoredOriginal();
        const derived = stored ? null : deriveOriginalFromTranslated(window.location.href);
        const originalUrl = stored ? stored.url : derived;
        if (!originalUrl) return;
        const viaStorage = Boolean(stored);

        injectStyle(RETURN_CSS, "psi-at-return-style");

        function mountReturn() {
            if (!document.body || document.getElementById("psi-at-return")) return;
            if (!document.getElementById("psi-at-return-style")) {
                injectStyle(RETURN_CSS, "psi-at-return-style");   // self-heal pre-DOM injection failure
            }
            const btn = document.createElement("div");
            btn.id = "psi-at-return";
            btn.title = "Return to original page" + (viaStorage ? "" : " (derived from this URL)");
            btn.setAttribute("role", "button");
            btn.setAttribute("tabindex", "0");
            btn.textContent = "← Original";
            btn.addEventListener("click", () => {
                storeDelete(STORAGE_KEY_ORIG);
                window.location.assign(originalUrl);
            });
            btn.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    storeDelete(STORAGE_KEY_ORIG);
                    window.location.assign(originalUrl);
                }
            });
            document.body.appendChild(btn);
        }

        if (document.body) {
            mountReturn();
        } else {
            document.addEventListener("DOMContentLoaded", mountReturn, { once: true });
        }

        addMenuCommand("↩ Return to original page", () => {
            storeDelete(STORAGE_KEY_ORIG);
            window.location.assign(originalUrl);
        });
    }

    // ─── BOOT ─────────────────────────────────────────────────────────────────
    watchNavigation();        // SPA route changes re-run the decision pipeline
    watchLangAttribute();     // late <html lang> writes by SPA frameworks
    whenBody(injectHUD);      // manual override surface, always available
    registerMenus();          // GM menu commands (state-refreshing labels)

    document.addEventListener("keydown", markEngaged, { capture: true, passive: true });
    document.addEventListener("pointerdown", markEngaged, { capture: true, passive: true });

})();
