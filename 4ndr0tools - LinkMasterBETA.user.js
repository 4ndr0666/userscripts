// ==UserScript==
// @name           4ndr0tools - LinkMasterBETA
// @namespace      https://github.com/4ndr0666/userscripts
// @author         4ndr0666
// @version        5.1.1
// @description    Accurately decodes, previews, exports, validates and scrapes all links. (Dual MPV Support + Ψ IG Harvester)
// @downloadURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @updateURL      https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
//
// ── HOSTING RULES ─────────────────────────────────────────────────────────────
//  General:    any http(s) page — the dock/HUD/listeners now render in the TOP
//              FRAME only (v5.0.0 injected a full HUD into every iframe).
//  Instagram:  *://*.instagram.com/* — the Ψ IG harvester arms in EVERY IG frame
//              at document-start (fetch/XHR net-hook wraps page transports
//              before page code fires) + JSON-script/DOM/video routes feed a
//              500-entry dedupe vault surfaced as a dedicated HUD tab.
// @match          *://*/*
// @match          *://*.instagram.com/*
// @run-at         document-start
// @license        UNLICENSED - RED TEAM USE ONLY
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_registerMenuCommand
// @grant          unsafeWindow
// @connect        *
// @connect        127.0.0.1
// @connect        cdninstagram.com
// @connect        fbcdn.net
// @connect        instagram.com
// ==/UserScript==

/* ═══ v5.1.1 — GUP AUDIT PASS (gap mitigation, zero regressions) ═══
   Executed under Golden Unit Protocol v5.3 against the v5.0.0 upstream
   stable baseline (CSoT md5 bdbf1d3a, 1093 lines). Static cross-reference
   analysis + Playwright functional battery (47 assertions, mocked Tamper-
   monkey surface, generic + instagram.com route-intercepted pages) isolated
   eight gaps; each was mitigated additively and re-verified:
   G1  Check-panel status span (#hud-bulk-check-status) existed in markup but
       no code path ever wrote to it — the "Checking…" div the old code
       painted into the table root was overwritten in the same synchronous
       turn (never visible). runCheckQueue gained an optional onComplete
       tally ({total, alive, dead, unknown}); the bulk table now reports
       live progress and a final summary through the span.
   G2  Remote Fonts OFF kept its promise only on the NEXT page load: the
       already-injected #lm-psi-fonts stylesheet survived the toggle.
       unloadHudFonts() now evicts it immediately (session-scoped OPSEC) and
       resets the injection flag so a later ON re-attempts cleanly.
   G3  @grant GM_listValues — zero consumers in v5.0.0 and v5.1.0 (grep-
       verified); orphaned declaration removed.
   G4  @grant GM_addStyle — zero consumers (styles inject via the head-less-
       tolerant injectHudStyles); orphaned declaration removed.
   G5  --bg-dark-base CSS custom property defined, never consumed — removed.
   G6  resolveBunkrStreamLink GM transport lacked onabort: an aborted request
       left the Stream button permanently disabled ("…") with no feedback.
       Abort now restores the button and toasts.
   G7  checkMediaLink's 405→ranged-GET follow-up lacked onabort: a silent
       abort leaked the concurrency slot and stalled the entire check queue
       (remaining links stuck on "…"). Abort now settles the probe.
   G8  Bunkr resolver selector chain could never match CDN URLs carrying
       query strings (a[href*='cdn'][href$='.mp4'] requires a .mp4 suffix);
       real bunkr CDN links carry token query strings. Added .mp4?/.zip?
       variants — strictly additive widening, first-match-in-document-order
       semantics unchanged.
   Superset check (v5.0.0 → v5.1.1): every capability — dock, HUD tabs
   (Scrape/Check/Settings/Instagram), host/media modes, deproxy/decode,
   previews+thumbs, bunkr stream resolve, dual MPV dispatch, bulk checker,
   export, drag, focus trap, menu — is intact or strictly improved. The four
   baseline units retired in v5.1.0 (checkLinksQueued, next, nextBulk,
   getHosterChecker) are superseded by the generalized epoch-guarded
   runCheckQueue and the GM-transport-first checker; their removal is
   documented in the semantic review record as authorized.
*/

/* ═══ v5.1.0 — AUDIT MITIGATIONS + Ψ IG HARVESTER (engines hardened, UI additive) ═══
   [SECURITY / OPSEC]
   A1  Duplicate-injection sentinel (DOM-based, shared across sandbox modes): a
       re-executed copy aborts before binding drag/keydown/menu listeners or
       stacking docks. (v5.0.0 double-bound document listeners on re-exec.)
   A2  Frame policy: dock/HUD/scrape UI is top-frame only — v5.0.0 injected a
       full HUD into EVERY iframe on every page (dock spam, duplicate listeners,
       wasted scans). IG harvesting still arms in all instagram.com frames.
   A3  @include wildcard retired → scheme-scoped @match patterns (http/https
       only) + explicit Instagram hosting rule; @run-at document-start so the
       IG net-hook wraps page fetch/XHR BEFORE page scripts execute (superset
       of Blob2URL v6.3, which arms at body-ready).
   A4  OPSEC font fix: Google Fonts were preconnected+loaded on EVERY page — a
       silent third-party beacon (fingerprint leak) and guaranteed CSP
       violations on strict sites. Fonts now load lazily at first HUD open and
       are toggleable in Settings (REMOTE FONTS: ON/OFF); stacks degrade
       gracefully to local families when off.
   A5  MPV URI dispatch no longer navigates the host page (hidden iframe, with
       location fallback); window.open gains noreferrer alongside noopener.
   A6  decodeConfirmationHref: final candidate gate accepts only http(s) URLs
       (v5.0.0 could return arbitrary atob/decodeURIComponent output).
   [FUNCTIONAL]
   B1  Link checker reworked — the v5.0.0 fetch/no-cors probes were permanently
       opaque (cross-origin status is unreadable), so every non-bunkr check
       returned "Unknown". All checks now go through the privileged GM
       transport first (HEAD; 405 → zero-byte ranged GET; page opaque-probe as
       last resort) with timeout/abort coverage. hosterHealthCheckers table
       removed (its fetch branch was the dead path).
   B2  Scan/check race fixed: re-scanning while probes are in flight let stale
       callbacks write results into the NEW table at mismatched rows. Every
       queue now carries a generation token; stale callbacks are dropped and
       the td must still be connected.
   B3  Bunkr family unified: isBunkrUrl now hostname-anchored and covers every
       bunkr/bunkrr/bunkrrr TLD (v5.0.0 missed bunkrrr.org Stream buttons);
       the DOM-first resolver resolves relative hrefs/og:video/src against the
       bunkr page URL (DOMParser documents resolve against about:blank, so
       relative CDN links were being mangled).
   B4  Manager portability guards for GM_setValue/GM_getValue/GM_deleteValue/
       GM_xmlhttpRequest/GM_registerMenuCommand (localStorage fallback for
       prefs, graceful toasts instead of a boot-time crash on managers lacking
       grants); style/font injection tolerates missing <head>.
   [INSTAGRAM]
   C1  Ψ IG harvester: CSP-safe property-wrap net-hook on fetch/XHR
       (fingerprint-masked toString, __lm_ig markers — composes cleanly beside
       Blob2URL's __psi_ig wraps), script[type=application/json] sweep on a
       debounced MutationObserver, one-shot full-DOM Route 2, <video> src
       sweep. Extraction is the proven Blob2URL engine: Route 1 structural
       walk (video_versions progressive + video_dash_manifest DASH) then the
       Route 2 fallback net over the surrogate-safe clean() chain; shortcode
       hunt; 500-entry URL-dedupe vault.
   C2  Seamless UI: an "Instagram" tab appears only on instagram.com (default
       tab there), newest-first entries with Copy/Open/MPV (URI)/MPV (Brdg) +
       health chips, RESCAN and COPY ALL; debounced re-render on new captures.
       Aggregation stays link-pure — downloads remain Blob2URL's domain.
   C3  IG hosting rules: cdninstagram/fbcdn CDNs + path-scoped IG media links
       (p|reel|reels|tv|stories|share) added to HOSTER_PATTERNS (Host Mode and
       "Show Host Patterns" pick them up); @connect documentation entries;
       Alt+L HUD hotkey (capture phase, IME/repeat-guarded — no collision with
       Blob2URL's Alt+S/Alt+I); menu commands for the vault + copy-all.
   Superset check: every v5.0.0 capability — dock, HUD tabs (Scrape/Check/
   Settings), host/media modes, deproxy/decode, previews+thumbs, bunkr stream
   resolve, dual MPV dispatch, bulk checker, export, drag, focus trap, menu —
   is intact or strictly improved.
*/

(() => {
  "use strict";

  // ──[A1] Duplicate-injection sentinel (per-document, sandbox-agnostic) ──
  const SENTINEL = "data-lm-psi-instance";
  const rootEl = document.documentElement;
  if (!rootEl || (rootEl.hasAttribute && rootEl.hasAttribute(SENTINEL))) return;
  try { rootEl.setAttribute(SENTINEL, String(Date.now())); } catch (_) {}

  // ──[A2] Frame policy: harvest IG anywhere; render UI in the top frame only ──
  const isTopFrame = (() => { try { return window.top === window.self; } catch (_) { return false; } })();
  const IG_HOST = /(^|\.)instagram\.com$/i;
  const IS_IG = IG_HOST.test(String((location && location.hostname) || "").toLowerCase());

  // ──[B4] Manager portability layer (graceful degradation, never a boot crash) ──
  const GMapi = {
    setValue(key, val) {
      try { if (typeof GM_setValue === "function") { GM_setValue(key, val); return; } } catch (_) {}
      try { localStorage.setItem("lm-psi-" + key, JSON.stringify(val)); } catch (_) {}
    },
    getValue(key, def) {
      try {
        if (typeof GM_getValue === "function") { const v = GM_getValue(key, null); return v == null ? def : v; }
      } catch (_) {}
      try { const raw = localStorage.getItem("lm-psi-" + key); return raw == null ? def : JSON.parse(raw); } catch (_) { return def; }
    },
    deleteValue(key) {
      try { if (typeof GM_deleteValue === "function") GM_deleteValue(key); } catch (_) {}
      try { localStorage.removeItem("lm-psi-" + key); } catch (_) {}
    },
    xhrSupported() { try { return typeof GM_xmlhttpRequest === "function"; } catch (_) { return false; } },
    xhr(opts) { try { return GM_xmlhttpRequest(opts); } catch (_) { return null; } },
    menu(label, fn) {
      try { if (typeof GM_registerMenuCommand === "function") { GM_registerMenuCommand(label, fn); return true; } } catch (_) {}
      return false;
    },
  };

  const dbg = (m) => { try { console.debug(`%c[LinkMasterΨ] %c${m}`, "color:#00E5FF; font-weight:bold;", "color:#67E8F9;"); } catch (_) {} };

  function setUserPref(key, val) { GMapi.setValue(key, val); }
  function getUserPref(key, def) { return GMapi.getValue(key, def); }

  // ──[A4] Lazy Google Fonts: loaded at FIRST HUD OPEN, not on every page load.
  // OPSEC: v5.0.0 preconnected+fetched fonts.googleapis.com on every site —
  // a passive third-party beacon. Toggleable in Settings; stacks degrade to
  // local families when off or when the request fails (strict CSP).
  // [G2] unloadHudFonts() makes the Settings toggle symmetric: OFF now evicts
  // the stylesheet immediately (the "local font stacks only" promise is kept
  // within the session, not just on the next page load) and resets the
  // injection flag so a later ON re-attempts the load.
  let fontsInjected = false;
  function ensureHudFonts() {
    if (fontsInjected || !remoteFonts) return;
    fontsInjected = true;
    try {
      if (!document.getElementById("lm-psi-fonts")) {
        const gf = document.createElement("link");
        gf.id = "lm-psi-fonts";
        gf.rel = "stylesheet";
        gf.href = "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Orbitron:wght@500;700&family=Roboto+Mono:wght@500&display=swap";
        (document.head || document.documentElement).appendChild(gf);
      }
    } catch (_) {}
  }
  function unloadHudFonts() {
    fontsInjected = false;
    try { const el = document.getElementById("lm-psi-fonts"); if (el) el.remove(); } catch (_) {}
  }

  // ===========================================================================
  // STATE & CONSTANTS
  // ===========================================================================
  let extractionMode = getUserPref("extractionMode", "host");
  let remoteFonts = getUserPref("remoteFonts", true);
  let currentTab = IS_IG ? "ig" : "scrape"; // [C2] IG pages open straight onto the vault

  const hudStyle = `
    :root {
      --bg-glass-panel: rgba(10, 19, 26, 0.75);
      --accent-cyan: #00E5FF;
      --text-cyan-active: #67E8F9;
      --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
      --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
      --glow-cyan-active: rgba(0, 229, 255, 0.4);
      --text-primary: #EAEAEA;
      --text-secondary: #9E9E9E;
      --font-body: 'Roboto Mono', monospace;
      --font-hud: 'Orbitron', sans-serif;
      --font-heading: 'Cinzel Decorative', serif;
      --hud-z: 2147483646;
    }

    /* ═══════════════════════════════════════════════════════════
       THE SLIDING DOCK (Design Spec 1.5.0-Ψ)
       ═══════════════════════════════════════════════════════════ */
    #linkmaster-dock {
      position: fixed; bottom: 24px; right: 0; z-index: 2147483647;
      display: flex; border-radius: 6px 0 0 6px; overflow: hidden;
      background: var(--bg-glass-panel);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--accent-cyan-border-idle);
      border-right: none;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-left: 1px solid rgba(255,255,255,0.1);
      box-shadow: -4px 8px 32px 0 rgba(0, 0, 0, 0.37);
      transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), background 300ms ease;
      transform: translateX(calc(100% - 22px));
    }

#linkmaster-dock:hover {
      transform: translateX(0);
    }

    .dock-btn {
      display: flex; align-items: center; white-space: nowrap;
      background: transparent; border: none; color: var(--text-primary);
      padding: 12px 20px 12px 10px; font: 500 13px var(--font-body);
      text-transform: uppercase; letter-spacing: 0.05em;
      cursor: pointer; transition: all 300ms ease-in-out;
    }

    .dock-icon {
      width: 24px; height: 24px;
      color: var(--accent-cyan);
      margin-right: 8px; flex-shrink: 0;
      transition: filter 300ms, color 300ms;
    }

    .dock-btn:hover {
      color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.05);
    }

    .dock-btn:hover .dock-icon {
      filter: drop-shadow(0 0 8px var(--glow-cyan-active));
    }

    .dock-btn:active {
      background: rgba(0, 229, 255, 0.2);
      box-shadow: inset 0 0 10px var(--glow-cyan-active);
    }

    /* ═══════════════════════════════════════════════════════════
       HUD MAIN PANEL
       ═══════════════════════════════════════════════════════════ */
    .hud-container {
      position: fixed; bottom: 85px; right: 24px; z-index: var(--hud-z);
      background: var(--bg-glass-panel);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-radius: 6px; border: 1px solid var(--accent-cyan-border-idle);
      box-shadow: 0 0 32px rgba(0, 0, 0, 0.5);
      min-width: 540px; max-width: 94vw; min-height: 340px;
      color: var(--text-primary); font-family: var(--font-body);
      transition: all 280ms cubic-bezier(.45, .05, .55, .95);
      user-select: text; overflow: visible; opacity: 0.99;
    }
    .hud-container[hidden] { display: none !important; }

    .hud-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--accent-cyan-border-idle);
      background: transparent; user-select: none; position: relative;
    }
    .hud-header .glyph { flex: none; width: 32px; height: 32px; display: block; color: var(--accent-cyan); z-index: 2; }
    .hud-header .title {
      position: absolute; left: 50%; transform: translateX(-50%);
      font-family: var(--font-heading); font-weight: 700; font-size: 1.4em;
      color: var(--text-cyan-active); text-transform: uppercase;
      letter-spacing: 0.1em; text-shadow: 0 0 8px var(--glow-cyan-active);
      text-align: center; white-space: nowrap; margin: 0 10px; z-index: 1;
    }
    .hud-header .hud-close-btn {
      font-family: var(--font-hud); font-size: 1.4em; border: none;
      background: transparent; color: var(--accent-cyan); cursor: pointer;
      opacity: 0.7; transition: all 300ms ease; flex-shrink: 0; z-index: 2;
    }
    .hud-header .hud-close-btn:hover {
      color: #ff4d4d; opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.4));
    }

    .hud-tabs {
      display: flex; gap: 8px; padding: 8px 16px 0 16px;
      border-bottom: 1px solid var(--accent-cyan-border-idle); background: transparent;
    }
    .hud-tabs .hud-button {
      font-family: var(--font-heading); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
      font-weight: 700; background: transparent; padding: 10px 16px;
      border-radius: 6px 6px 0 0; border: 1px solid transparent; border-bottom: none;
      color: var(--text-secondary); cursor: pointer; transition: all 300ms ease-in-out; box-shadow: none;
    }
.hud-tabs .hud-button.active {
      color: var(--text-cyan-active); border-color: var(--accent-cyan-border-idle);
      background: rgba(0, 229, 255, 0.05); box-shadow: inset 0 4px 10px -4px var(--glow-cyan-active);
    }
    .hud-tabs .hud-button:hover:not(.active) {
      color: var(--accent-cyan); border-color: var(--accent-cyan-border-hover);
      background: rgba(0, 229, 255, 0.05);
    }

    .hud-content {
      padding: 16px; min-height: 220px; max-height: 60vh;
      overflow-y: auto; font-size: 13px; color: var(--text-primary); background: transparent;
    }
    .hud-content::-webkit-scrollbar { width: 8px; background: rgba(0,0,0,0.2); border-radius: 4px; }
    .hud-content::-webkit-scrollbar-thumb { background: rgba(0, 229, 255, 0.3); border-radius: 4px; }
    .hud-content::-webkit-scrollbar-thumb:hover { background: rgba(0, 229, 255, 0.6); }

    .hud-status-text {
      font-family: var(--font-hud);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }

    .hud-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 6px 12px; border-radius: 4px; border: 1px solid var(--accent-cyan-border-idle);
      font-family: var(--font-hud); font-weight: 500; font-size: 11px; text-transform: uppercase;
      background: transparent; color: var(--text-primary); cursor: pointer;
      letter-spacing: 0.05em; transition: all 300ms ease-in-out; box-shadow: none; outline: none;
    }
    .hud-btn.active, .hud-btn:active {
      color: var(--text-cyan-active); border-color: var(--accent-cyan);
      background: rgba(0, 229, 255, 0.2); box-shadow: inset 0 0 10px var(--glow-cyan-active);
    }
    .hud-btn:hover:not(.active) {
      color: var(--accent-cyan); background: rgba(0, 229, 255, 0.05);
      border-color: var(--accent-cyan-border-hover); box-shadow: 0 0 8px var(--glow-cyan-active);
    }

    .chip {
      display: inline-block; border-radius: 4px; padding: 2px 8px; font-size: 11px;
      font-family: var(--font-body); font-weight: 500; text-transform: uppercase;
      background: rgba(0, 229, 255, 0.05); color: var(--text-cyan-active);
      border: 1px solid var(--accent-cyan-border-idle);
    }
    .chip.dead {
      color: #ff4d4d; border-color: rgba(255, 77, 77, 0.5);
      background: rgba(255, 77, 77, 0.05);
    }
    .chip.unknown {
      color: #ffea00; border-color: rgba(255, 234, 0, 0.5);
      background: rgba(255, 234, 0, 0.05);
    }
    .chip.favicon { background: #111; color: var(--text-cyan-active); padding: 0; display: inline-flex; justify-content: center; align-items: center; }

    .hud-toast {
      position: fixed; z-index: calc(var(--hud-z) + 2000); bottom: 85px; right: 580px;
      background: var(--bg-glass-panel); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      color: var(--text-cyan-active); font-family: var(--font-body); font-size: 13px;
      border-radius: 6px; border: 1px solid var(--accent-cyan-border-idle);
      box-shadow: 0 0 16px var(--glow-cyan-active); padding: 12px 20px;
      opacity: 0.97; pointer-events: none; transition: opacity 220ms; user-select: none;
    }

    textarea.hud-input {
      width: 100%; background: rgba(0, 0, 0, 0.3); color: var(--text-primary);
      border-radius: 4px; border: 1px solid var(--accent-cyan-border-idle);
      padding: 10px; font-size: 13px; font-family: var(--font-body); resize: vertical;
      box-shadow: inset 0 0 8px rgba(0,0,0,0.5); transition: border-color 300ms ease;
    }
    textarea.hud-input:focus {
      outline: none; border-color: var(--accent-cyan); box-shadow: inset 0 0 8px var(--glow-cyan-active);
    }

/* Table Typography Hardening */
    .hud-content th {
      font-family: var(--font-hud);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .hud-action-cell {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  `;

  const getPsiGlyphSVG = (className) => `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="${className}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="68" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text></svg>`;

  function injectHudStyles() {
    try {
      if (document.getElementById("eglass-hud-css")) return;
      const style = document.createElement("style");
      style.id = "eglass-hud-css";
      style.textContent = hudStyle;
      (document.head || document.documentElement).appendChild(style);
    } catch (_) {}
  }

  const HOSTER_PATTERNS = [
    // [B3] bunkr family consolidated: bunkr|bunkrr|bunkrrr across every known TLD
    /:\/\/([a-z0-9-]+\.)*bunkr{1,3}\.(ac|cr|pk|ru|ws|la|to|is|bz|sx|re|co|sh|pl|gg|mn|yt|site|si|red|org|su|io|net|black)/i,
    /:\/\/([a-z0-9-]+\.)?cyberdrop\.(me|cc|nl|to|xyz)/i,
    /:\/\/([a-z0-9-]+\.)?gofile\.io/i,
    /:\/\/([a-z0-9-]+\.)?1fichier\.com/i,
    /:\/\/([a-z0-9-]+\.)?motherless(media)?\.com/i,
    /:\/\/([a-z0-9-]+\.)?pixeldrain\.com/i,
    /:\/\/([a-z0-9-]+\.)?pixhost\.to/i,
    /:\/\/([a-z0-9-]+\.)?imgbox\.com/i,
    /:\/\/([a-z0-9-]+\.)?imagevenue\.com/i,
    /:\/\/([a-z0-9-]+\.)?imagetwist\.com/i,
    /:\/\/([a-z0-9-]+\.)?nudbay\.com/i,
    /:\/\/([a-z0-9-]+\.)?spankbang\.com/i,
    /:\/\/([a-z0-9-]+\.)?thothub\.(vip|to|is)/i,
    /:\/\/([a-z0-9-]+\.)?vimeo\.com/i,
    /:\/\/([a-z0-9-]+\.)?youtube\.com/i,
    /:\/\/([a-z0-9-]+\.)?simpcity\.su/i,
    /:\/\/([a-z0-9-]+\.)?bilibili\.com/i,
    /:\/\/([a-z0-9-]+\.)?erome\.com/i,
    /:\/\/([a-z0-9-]+\.)?coomer\.(party|su)/i,
    /:\/\/([a-z0-9-]+\.)?kemono\.(party|su)/i,
    /:\/\/([a-z0-9-]+\.)?streamtape\.com/i,
    /:\/\/([a-z0-9-]+\.)?voe\.sx/i,
    /:\/\/([a-z0-9-]+\.)?fapello\.com/i,
    // [C3] Instagram hosting rules — media CDNs (any label depth) + media-bearing
    // IG path scopes only, so Host Mode never floods with IG navigation links.
    /:\/\/([a-z0-9-]+\.)*cdninstagram\.com/i,
    /:\/\/([a-z0-9-]+\.)*fbcdn\.net/i,
    /:\/\/([a-z0-9-]+\.)?instagram\.com\/(p|reel|reels|tv|stories|share)\//i
  ];

  const MEDIA_TYPES = [
    "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg",
    "mp4", "webm", "mkv", "mov", "avi", "flv", "wmv", "3gp",
    "mp3", "ogg", "wav", "flac", "aac", "m4a"
  ];

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================
  function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, (match) => {
const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
      return escape[match];
    });
  }

  function analyzeThreatHeuristics(url) {
    const tags = [];
    if (/javascript:/i.test(url)) tags.push("XSS");
    if (/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.test(url)) tags.push("IP-HOST");
    if (url.length > 2000) tags.push("ANOMALY");
    return tags;
  }

  let previewThumbMap = null;
  function buildPreviewThumbMap() {
    previewThumbMap = {};
    document.querySelectorAll('.bbCodeBlock--unfurl[data-unfurl][data-url]').forEach(unfurl => {
      const url = unfurl.getAttribute('data-url');
      let thumb = "";
      const imgs = unfurl.querySelectorAll('.contentRow-figure img[src]');
      if (imgs && imgs.length) {
        const found = Array.from(imgs).find(img => img.src.endsWith('.png') || img.src.match(/thumbs\//));
        thumb = found ? found.src : imgs[0].src;
      }
      if (!thumb) {
        const fav = unfurl.querySelector('.js-unfurl-favicon img[src]');
        if (fav) thumb = fav.src;
      }
      if (url && thumb) previewThumbMap[url] = thumb;
    });
  }

  function showToast(msg, timeout = 3300) {
    try {
      const t = document.createElement("div");
      t.className = "hud-toast";
      t.textContent = msg;
      (document.body || document.documentElement).appendChild(t);
      setTimeout(() => { t.style.opacity = "0.1"; setTimeout(() => t.remove(), 600); }, timeout);
    } catch (_) {}
  }

  // [A6] Confirmation-href decoder — only http(s) candidates are ever returned.
  function decodeConfirmationHref(a) {
    try {
      const u = new URL(a.href, location.origin);
      if (!/\/goto\/link-confirmation/.test(u.pathname) || !u.searchParams.has('url')) return null;
      const raw = u.searchParams.get('url');
      const candidates = [];
      try { candidates.push(decodeURIComponent(raw)); } catch { /* ignore */ }
      try { candidates.push(atob(raw)); } catch { /* ignore */ }
      try { candidates.push(atob(decodeURIComponent(raw))); } catch { /* ignore */ }
      for (const c of candidates) {
        const cc = String(c).trim();
        if (/^https?:\/\//i.test(cc)) return cc;
      }
      return null;
    } catch {
      return null;
    }
  }

  function isExternalHoster(url) {
    return HOSTER_PATTERNS.some(re => re.test(url));
  }

  function isMediaFile(url) {
    const u = url.split("?")[0].split("#")[0].toLowerCase();
    return MEDIA_TYPES.some(ext => u.endsWith("." + ext));
  }

  function isJunkMedia(url) {
    const u = url.toLowerCase();
    const path = u.split("?")[0];
    // Filter common UI vectors and static delivery networks to reduce HUD noise
    if (path.endsWith(".svg")) return true;
    if (u.includes("static.scdn.st")) return true;
    if (u.includes("favicon")) return true;
    if (/\/(icon|logo|avatar|banner)s?\//i.test(u)) return true;
    if (/^(icon|logo|avatar|banner)[-_]/i.test(path.split("/").pop())) return true;
    return false;
  }

  // [B3] Hostname-anchored bunkr family test (bunkr / bunkrr / bunkrrr, all TLDs).
  const BUNKR_HOST_RE = /(^|\.)bunkr{1,3}\.(ac|cr|pk|ru|ws|la|to|is|bz|sx|re|co|sh|pl|gg|mn|yt|site|si|red|org|su|io|net|black)$/i;
  function isBunkrUrl(url) {
    try { return BUNKR_HOST_RE.test(new URL(url).hostname); } catch { return false; }
  }

  function copyText(txt) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt).catch(() => copyTextLegacy(txt));
    } else {
      copyTextLegacy(txt);
    }
  }

  function copyTextLegacy(txt) {
    try {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.setAttribute("readonly", "");
      Object.assign(ta.style, { position: "absolute", left: "-9999px" });
      (document.body || document.documentElement).appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    } catch (_) {}
  }

  // [A5] MPV protocol dispatch via a hidden iframe — the host page is no longer
  // navigated (v5.0.0 used location.href, firing beforeunload on every dispatch).
  function launchMpvProtocol(url) {
    const uri = `mpv://${encodeURIComponent(url)}`;
    try {
      const f = document.createElement("iframe");
      f.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden;";
      f.src = uri;
      (document.body || document.documentElement).appendChild(f);
      setTimeout(() => { try { f.remove(); } catch (_) {} }, 4000);
    } catch (_) {
      window.location.href = uri; // last-resort transport
    }
  }

  function streamToLocalMpv(url, btnEl) {
    const origText = btnEl.textContent;
    const restore = () => { btnEl.textContent = origText; btnEl.disabled = false; };
    if (!GMapi.xhrSupported()) { showToast("MPV bridge unavailable (no GM transport)."); return; }
    btnEl.textContent = "…";
    btnEl.disabled = true;
    GMapi.xhr({
      method: "POST",
      url: "http://127.0.0.1:19999",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: `url=${encodeURIComponent(url)}`,
      timeout: 5000,
      onload: (resp) => {
        restore();
        if (resp.status === 200) showToast("⦒ █▓░ Stream dispatched to MPV bridge.");
        else showToast(`MPV bridge error: HTTP ${resp.status}`);
      },
      onerror: () => { restore(); showToast("MPV bridge unavailable (127.0.0.1:19999)."); },
      ontimeout: () => { restore(); showToast("MPV bridge timed out."); },
      onabort: () => { restore(); showToast("MPV bridge aborted."); }
    });
  }

  // ===========================================================================
  // EXTRACTION ENGINE
  // ===========================================================================
  function extractExternalHostLinks() {
    if (!previewThumbMap) buildPreviewThumbMap();
    const links = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      let url = a.href.trim();
      const deprox = decodeConfirmationHref(a);
      if (deprox) url = deprox.trim();
      if (isExternalHoster(url)) links.add(url);
    });
    return Array.from(links);
  }

  function extractMediaLinks() {
    if (!previewThumbMap) buildPreviewThumbMap();
    const links = new Set();
    document.querySelectorAll("a[href]").forEach(a => {
      let url = a.href.trim();
      const deprox = decodeConfirmationHref(a);
      if (deprox) url = deprox.trim();
      if (isMediaFile(url) && !isJunkMedia(url)) links.add(url);
    });
    document.querySelectorAll("img[src]").forEach(img => {
      const url = img.src.trim();
      if (isMediaFile(url) && !isJunkMedia(url)) links.add(url);
    });
    document.querySelectorAll("video, audio").forEach(el => {
      if (el.src && isMediaFile(el.src.trim()) && !isJunkMedia(el.src.trim())) links.add(el.src.trim());
      el.querySelectorAll("source[src]").forEach(src => {
const url = src.src.trim();
        if (isMediaFile(url) && !isJunkMedia(url)) links.add(url);
      });
    });
    return Array.from(links);
  }

  // ===========================================================================
  // HUD PANEL SHELL & DOCK
  // ===========================================================================
  function createDock() {
    if (document.getElementById("linkmaster-dock")) return;
    const dock = document.createElement('div');
    dock.id = 'linkmaster-dock';

    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    btn.innerHTML = `${getPsiGlyphSVG('dock-icon')}<span class="dock-text">LinkMaster</span>`;
    btn.onclick = () => { showHudPanel(); };

    dock.appendChild(btn);
    (document.body || document.documentElement).appendChild(dock);
  }

  function showHudPanel() {
    ensureHudFonts(); // [A4] fonts load on first HUD open only, never at page load
    let hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) {
      hudPanel = document.createElement("div");
      hudPanel.id = "hud-panel-root";
      hudPanel.className = "hud-container";
      hudPanel.innerHTML = `
        <div class="hud-header">
          ${getPsiGlyphSVG('glyph')}
          <span class="title">LinkMaster</span>
          <button class="hud-close-btn" title="Close HUD" tabindex="0">&times;</button>
        </div>
        <nav class="hud-tabs" role="tablist">
          <button class="hud-button active" data-tab="scrape" role="tab" aria-selected="true" tabindex="0">Scrape</button>
          <button class="hud-button" data-tab="check" role="tab" aria-selected="false" tabindex="0">Check</button>
          ${IS_IG ? `<button class="hud-button" data-tab="ig" role="tab" aria-selected="false" tabindex="0">Instagram</button>` : ""}
          <button class="hud-button" data-tab="settings" role="tab" aria-selected="false" tabindex="0">Settings</button>
        </nav>
        <main class="hud-content" tabindex="0" id="hud-content-panel"></main>
      `;
      (document.body || document.documentElement).appendChild(hudPanel);
      hudPanel.querySelector(".hud-close-btn").onclick = () => {
        hudPanel.setAttribute("hidden", "true");
      };
      hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
        btn.onclick = function () { setHudTab(this.getAttribute("data-tab")); };
      });
    }
    hudPanel.removeAttribute("hidden");
    setHudTab(currentTab);
  }

  function setHudTab(tab) {
    currentTab = tab;
    const hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) return;
    hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
      const isActive = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
    const contentPanel = hudPanel.querySelector("#hud-content-panel");
    contentPanel.innerHTML = "";
    if (tab === "scrape")        renderScrapePanel(contentPanel);
    else if (tab === "check")    renderCheckPanel(contentPanel);
    else if (tab === "ig")       renderIGPanel(contentPanel);
    else if (tab === "settings") renderSettingsPanel(contentPanel);
  }

  // ===========================================================================
  // SCRAPE PANEL
  // ===========================================================================
  function renderScrapePanel(root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <button class="hud-btn" id="hud-scan-btn">Scan</button>
        <button class="hud-btn${extractionMode === "host" ? " active" : ""}" id="hud-host-mode-btn">Host Mode</button>
        <button class="hud-btn${extractionMode === "media" ? " active" : ""}" id="hud-media-mode-btn">Media Mode</button>
        <span id="hud-scrape-status" class="hud-status-text" style="color:var(--text-secondary);"></span>
      </div>
<div id="hud-media-table-root" style="margin-top:12px;"></div>
      <div style="color:var(--text-cyan-active); margin-top:12px;" class="hud-status-text">
        <b>Mode:</b> <span id="hud-current-mode">${extractionMode === "host" ? "External Host Links (decoded, deproxied)" : "All Media (images/videos/audio on page)"}</span>
      </div>
    `;
    root.querySelector("#hud-scan-btn").onclick = runScrapeAndRender;
    root.querySelector("#hud-host-mode-btn").onclick = function () {
      setExtractionMode("host");
      root.querySelector("#hud-host-mode-btn").classList.add("active");
      root.querySelector("#hud-media-mode-btn").classList.remove("active");
      root.querySelector("#hud-current-mode").textContent = "External Host Links (decoded, deproxied)";
    };
    root.querySelector("#hud-media-mode-btn").onclick = function () {
      setExtractionMode("media");
      root.querySelector("#hud-host-mode-btn").classList.remove("active");
      root.querySelector("#hud-media-mode-btn").classList.add("active");
      root.querySelector("#hud-current-mode").textContent = "All Media (images/videos/audio on page)";
    };
    runScrapeAndRender();
  }

  function setExtractionMode(mode) {
    extractionMode = mode;
    setUserPref("extractionMode", extractionMode);
    showToast("Extraction mode: " + (mode === "media" ? "Media" : "External Host"));
    runScrapeAndRender();
  }

  // [B2] Every scan carries a generation token; stale callbacks are dropped so
  // a re-scan mid-probe can never write results into the new table's rows.
  let scanEpoch = 0;
  function runScrapeAndRender() {
    const epoch = ++scanEpoch;
    previewThumbMap = null;
    const statusEl  = document.getElementById("hud-scrape-status");
    const tableRoot = document.getElementById("hud-media-table-root");
    if (!statusEl || !tableRoot) return;
    statusEl.textContent = "Scanning...";
    setTimeout(() => {
      if (epoch !== scanEpoch) return; // superseded by a newer scan
      const links = extractionMode === "host"
        ? extractExternalHostLinks()
        : extractMediaLinks();
      if (links.length === 0) {
        tableRoot.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);padding:16px 0;">No links found (${extractionMode === "host" ? "External Host Mode" : "Media Mode"}).</div>`;
        statusEl.textContent = "No links found.";
        return;
      }
      statusEl.textContent = `${links.length} ${extractionMode === "host" ? "external host" : "media"} link${links.length !== 1 ? "s" : ""} found.`;
      renderMediaTable(links, tableRoot, epoch);
    }, 80);
  }

  // ===========================================================================
  // MEDIA PREVIEW & TABLE
  // ===========================================================================
  function createMediaPreview(url) {
    if (extractionMode === "host" && previewThumbMap) {
      if (previewThumbMap[url]) {
        const img = document.createElement("img");
        img.src = previewThumbMap[url];
        img.alt = "Preview";
        Object.assign(img.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)" });
        img.loading = "lazy";
        return img;
      }
      try {
        const host = new URL(url).hostname;
        let favicon = null;
        document.querySelectorAll('.bbCodeBlock--unfurl[data-unfurl][data-url]').forEach(unfurl => {
          const h = unfurl.getAttribute('data-host');
          const favimg = unfurl.querySelector('.js-unfurl-favicon img[src]');
          if (h && favimg && h.toLowerCase() === host.toLowerCase()) favicon = favimg.src;
        });
        if (favicon) {
          const img = document.createElement("img");
          img.src = favicon;
          img.alt = "Favicon";
          img.className = "chip favicon";
          Object.assign(img.style, { width: "20px", height: "20px", borderRadius: "4px" });
          return img;
        }
      } catch { /* ignore */ }
    }
const ext = url.split(".").pop().split("?")[0].toLowerCase();
    if (["jpg","jpeg","png","webp","gif","bmp","svg"].includes(ext)) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      Object.assign(img.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)" });
      img.loading = "lazy";
      return img;
    }
    if (["mp4","webm","mkv","mov","avi","flv","wmv","3gp"].includes(ext)) {
      const vid = document.createElement("video");
      vid.src = url;
      vid.controls = false;
      vid.muted = true;
      vid.preload = "none";
      Object.assign(vid.style, { maxWidth: "64px", maxHeight: "54px", borderRadius: "4px", border: "1px solid var(--accent-cyan-border-idle)", cursor: "pointer" });
      vid.addEventListener("mouseenter", () => { if (vid.preload === "none") vid.preload = "metadata"; }, { once: true });
      return vid;
    }
    return null;
  }

  function renderMediaTable(links, root, epoch) {
    if (!Array.isArray(links) || links.length === 0) {
      root.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);padding:16px 0;">No links found on this page.</div>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse; text-align:left;"><thead>
      <tr style="border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);">
        <th style="padding:8px 4px;">Preview</th>
        <th style="padding:8px 4px;">File</th>
        <th style="padding:8px 4px;">Host</th>
        <th style="padding:8px 4px;">Actions</th>
        <th style="padding:8px 4px;">Status</th>
      </tr>
    </thead><tbody>`;
    links.forEach((url, idx) => {
      const fileRaw  = url.split("/").pop().split("?")[0].slice(0, 40) || "(index)";
      const hostRaw  = (() => { try { return new URL(url).hostname; } catch { return ""; } })();

      const fileSafe = escapeHTML(fileRaw);
      const hostSafe = escapeHTML(hostRaw);
      const urlSafe  = encodeURIComponent(url);

      const heuristics = analyzeThreatHeuristics(url);
      const threatChips = heuristics.length > 0 ? ' ' + heuristics.map(h => `<span class="chip dead">${h}</span>`).join(" ") : "";

      const isBunkr  = isBunkrUrl(url);
      const streamBtn = isBunkr
        ? `<button class="hud-btn" data-idx="${idx}" data-action="stream" title="Resolve direct CDN link via DOM-first acquisition">Stream</button>`
        : "";
      const mpvUriBtn = `<button class="hud-btn" data-idx="${idx}" data-action="mpv-uri" title="Stream via OS protocol handler">MPV (URI)</button>`;
      const mpvBridgeBtn = `<button class="hud-btn" data-idx="${idx}" data-action="mpv-bridge" title="Stream via local HTTP bridge">MPV (Brdg)</button>`;

      html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);" data-url="${urlSafe}">
        <td id="media-preview-${idx}" style="min-width:72px;max-width:80px;padding:8px 4px;"></td>
        <td style="max-width:200px;overflow-x:auto;padding:8px 4px;">${fileSafe}${threatChips}</td>
        <td style="color:var(--text-cyan-active);max-width:140px;overflow-x:auto;padding:8px 4px;">${hostSafe}</td>
        <td class="hud-action-cell" style="padding:8px 4px;">
          <button class="hud-btn" data-idx="${idx}" data-action="copy">Copy</button>
          <button class="hud-btn" data-idx="${idx}" data-action="open">Open</button>
          ${streamBtn}
          ${mpvUriBtn}
          ${mpvBridgeBtn}
        </td>
        <td id="media-check-${idx}" style="padding:8px 4px;"><span class="chip unknown">…</span></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;

    links.forEach((url, idx) => {
      const prev   = createMediaPreview(url);
      const prevTd = document.getElementById("media-preview-" + idx);
      if (prevTd && prev) prevTd.appendChild(prev);
    });

root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function () {
        const idx    = +this.getAttribute("data-idx");
        const action = this.getAttribute("data-action");
        const url    = links[idx];
        if (!url) return;
        if (action === "copy") {
          copyText(url);
          showToast("Copied to clipboard.");
        } else if (action === "open") {
          window.open(url, "_blank", "noopener,noreferrer"); // [A5]
        } else if (action === "stream") {
          resolveBunkrStreamLink(url, this);
        } else if (action === "mpv-uri") {
          launchMpvProtocol(url);
          showToast("Dispatched via MPV URI.");
        } else if (action === "mpv-bridge") {
          streamToLocalMpv(url, this);
        }
      };
    });

    runCheckQueue(links, () => epoch === scanEpoch, "media-check-");
  }

  // [B2] Generalized probe queue: isFresh() gates stale writes; the td must
  // still be connected so removed panels never receive ghost results.
  // [G1] Optional onComplete receives {total, alive, dead, unknown} tallies
  // when the queue drains — fired only while the queue is still fresh, so a
  // superseded run can never write the new run's status line.
  function runCheckQueue(links, isFresh, idPrefix, onComplete) {
    const MAX_CONCURRENT = 6;
    let active = 0;
    let idx    = 0;
    const tally = { total: links.length, alive: 0, dead: 0, unknown: 0 };
    if (links.length === 0) {
      if (isFresh() && onComplete) onComplete(tally);
      return;
    }
    (function next() {
      while (active < MAX_CONCURRENT && idx < links.length) {
        const i   = idx++;
        const url = links[i];
        active++;
        checkMediaLink(url, (status, info) => {
          if (isFresh()) {
            const td = document.getElementById(idPrefix + i);
            if (td && td.isConnected) renderCheckResult(status, info, td);
          }
          active--;
          if (Object.prototype.hasOwnProperty.call(tally, status)) tally[status]++;
          if (active === 0 && idx >= links.length) {
            if (isFresh() && onComplete) onComplete(tally);
            return;
          }
          next();
        });
      }
    })();
  }

  // ===========================================================================
  // BUNKR DOM-FIRST STREAM RESOLUTION
  // ===========================================================================
  // [B3] All extracted targets are resolved against the bunkr page URL —
  // DOMParser documents resolve against about:blank, so relative hrefs were
  // previously mangled into unusable pseudo-URLs.
  function resolveBunkrStreamLink(bunkrUrl, btnEl) {
    const origText = btnEl.textContent;
    const restore = () => { btnEl.textContent = origText; btnEl.disabled = false; };
    if (!GMapi.xhrSupported()) { showToast("Stream resolve unavailable (no GM transport)."); return; }
    btnEl.textContent = "…";
    btnEl.disabled    = true;

    const absResolve = (raw) => {
      try { return new URL(String(raw), bunkrUrl).href; } catch { return null; }
    };
    const copyResolved = (raw, okMsg) => {
      const abs = absResolve(raw);
      if (abs) { copyText(abs); showToast(okMsg); return true; }
      return false;
    };

    GMapi.xhr({
      method:  "GET",
      url:     bunkrUrl,
      headers: {
        "Referer":          bunkrUrl,
        "Accept":           "text/html,application/xhtml+xml",
        "Accept-Language":  "en-US,en;q=0.9",
      },
      timeout: 12000,
      onload: (resp) => {
        restore();
        if (resp.status < 200 || resp.status >= 300) {
          showToast(`Stream resolve failed: HTTP ${resp.status}`);
          return;
        }
        const doc = new DOMParser().parseFromString(resp.responseText, "text/html");
        const anchor = doc.querySelector([
          "a[href*='get.bunkr']",
          "a.ic-download-01",
          "a[href*='/file/']",
          "a[href*='cdn'][href$='.mp4']",
          "a[href*='cdn'][href$='.zip']",
          "a[href*='cdn'][href*='.mp4?']", // [G8] token/query-string CDN links (href$='.mp4' can never match these)
          "a[href*='cdn'][href*='.zip?']", // [G8]
          "a[download][href]",
        ].join(", "));
        const anchorHref = anchor ? anchor.getAttribute("href") : null;
        if (anchorHref && copyResolved(anchorHref, "⦒ █▓░ CDN link copied.")) return;
        const ogVideo = doc.querySelector("meta[property='og:video']");
        if (ogVideo && ogVideo.content && copyResolved(ogVideo.content, "⦒ █▓░ OG stream link copied.")) return;
        const src = doc.querySelector("source[src], video[src]");
        const srcRaw = src ? (src.getAttribute("src") || "") : "";
        if (srcRaw && !srcRaw.startsWith("blob:") && copyResolved(srcRaw, "⦒ █▓░ Video source link copied.")) return;
        showToast("Stream resolve: no CDN anchor found in page DOM.");
      },
      onerror:   () => { restore(); showToast("Stream resolve: network error."); },
      ontimeout: () => { restore(); showToast("Stream resolve: timed out (12s)."); },
      onabort:   () => { restore(); showToast("Stream resolve: aborted."); }, // [G6] abort left the button stuck on "…" forever
    });
  }

  // ===========================================================================
  // LINK CHECKER ENGINE — [B1] privileged transport first
  // ===========================================================================
  // v5.0.0 probes used fetch(no-cors): cross-origin responses are OPAQUE, so
  // every status read as 0/unknown — the checker was functionally dead outside
  // GM-backed bunkr HEADs. GM_xmlhttpRequest is the only channel here that can
  // actually read cross-origin statuses, so it now leads every probe; a zero-
  // byte ranged GET confirms servers that reject HEAD (405); an opaque page
  // fetch remains as a reachability-only last resort.
  function pageProbe(url, cb) {
    fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" })
      .then(() => cb("unknown", "reachable (opaque)"))
      .catch(() => cb("unknown", "unreachable"));
  }

  function checkMediaLink(url, cb) {
    if (typeof url !== "string" || !/^https?:\/\//i.test(url)) { cb("unknown", "non-http link"); return; }

    let settled = false; // guards against double-fire on transport edge cases
    const done = (status, info) => { if (!settled) { settled = true; cb(status, info); } };

    const finishFromStatus = (s) => {
      if (s >= 200 && s < 300) return done("alive", `HTTP ${s}`);
      if (s === 403 || s === 404 || s === 410 || s === 451) return done("dead", `HTTP ${s}`);
      return done("unknown", `HTTP ${s}`);
    };

    if (!GMapi.xhrSupported()) { pageProbe(url, done); return; }

    GMapi.xhr({
      method: "HEAD",
      url,
      headers: {
        "Referer": (() => { try { const u = new URL(url); return `${u.protocol}//${u.host}/`; } catch { return url; } })(),
        "Accept":  "*/*",
      },
      timeout: 10000,
      onload: (resp) => {
        const s = resp && typeof resp.status === "number" ? resp.status : -1;
        if (s === 405) {
          // Server rejects HEAD — confirm existence with a zero-byte ranged GET.
          GMapi.xhr({
            method: "GET",
            url,
            headers: { "Range": "bytes=0-0", "Accept": "*/*" },
            timeout: 12000,
            onload: (r2) => finishFromStatus(r2 && typeof r2.status === "number" ? r2.status : -1),
            onerror:   () => pageProbe(url, done),
            ontimeout: () => done("unknown", "Timeout"),
            onabort:   () => done("unknown", "Aborted"), // [G7] a silent abort leaked the concurrency slot and stalled the whole queue
          });
          return;
        }
        finishFromStatus(s);
      },
      onerror:   () => pageProbe(url, done),
      ontimeout: () => done("unknown", "Timeout"),
      onabort:   () => done("unknown", "Aborted"),
    });
  }

  function renderCheckResult(status, info, td) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = status === "alive" ? "Alive" : status === "dead" ? "Dead" : "Unknown";
    if (status === "dead")    chip.classList.add("dead");
    if (status === "unknown") chip.classList.add("unknown");
    if (info) chip.title = info;
    td.innerHTML = "";
    td.appendChild(chip);
  }

  // ===========================================================================
  // CHECK PANEL (BULK)
  // ===========================================================================
  let bulkEpoch = 0;
  function renderCheckPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:16px;">
        <textarea id="hud-bulk-links" class="hud-input" placeholder="Paste links to check (one per line)" rows="7"></textarea>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="hud-btn" id="hud-bulk-check-btn">Check Links</button>
        <span id="hud-bulk-check-status" class="hud-status-text" style="color:var(--text-secondary);"></span>
      </div>
      <div id="hud-bulk-table-root" style="margin-top:16px;"></div>
    `;
    root.querySelector("#hud-bulk-check-btn").onclick = function () {
      const input = root.querySelector("#hud-bulk-links").value;
      const urls  = input.split(/[\n\r\s]+/).map(x => x.trim()).filter(Boolean);
      if (urls.length === 0) { showToast("No links to check."); return; }
      renderBulkCheckTable(urls, root.querySelector("#hud-bulk-table-root"));
    };
  }

  function renderBulkCheckTable(urls, root) {
    const epoch = ++bulkEpoch; // [B2] stale probes from a previous check run are dropped
    // [G1] The panel's status span is now live: its markup existed in
    // v5.0.0/v5.1.0 but no code path ever wrote to it, and the transient
    // "Checking" div the old code painted into the table root was overwritten
    // in the same synchronous turn (never visible). The span now shows progress
    // AND the final alive/dead/unknown summary once the queue drains.
    const statusEl = document.getElementById("hud-bulk-check-status");
    if (statusEl) statusEl.textContent = `Checking ${urls.length} link${urls.length !== 1 ? "s" : ""}...`;
    let html = `<table style="width:100%;border-collapse:collapse; text-align:left;"><thead>
<tr style="border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);">
        <th style="padding:8px 4px;">Link</th>
        <th style="padding:8px 4px;">Status</th>
        <th style="padding:8px 4px;">Actions</th>
      </tr>
    </thead><tbody>`;
    urls.forEach((url, idx) => {
      const urlSafe  = escapeHTML(url);
      const isBunkr  = isBunkrUrl(url);
      const heuristics = analyzeThreatHeuristics(url);
      const threatChips = heuristics.length > 0 ? ' ' + heuristics.map(h => `<span class="chip dead">${h}</span>`).join(" ") : "";

      const streamBtn = isBunkr
        ? `<button class="hud-btn" data-bulk-idx="${idx}" data-action="stream">Stream</button>`
        : "";
      const mpvUriBtn = `<button class="hud-btn" data-bulk-idx="${idx}" data-action="mpv-uri" title="Stream via OS protocol handler">MPV (URI)</button>`;
      const mpvBridgeBtn = `<button class="hud-btn" data-bulk-idx="${idx}" data-action="mpv-bridge" title="Stream via local HTTP bridge">MPV (Brdg)</button>`;

      html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="max-width:300px;overflow-x:auto;padding:8px 4px;">${urlSafe}${threatChips}</td>
        <td id="bulk-check-${idx}" style="padding:8px 4px;"><span class="chip unknown">…</span></td>
        <td class="hud-action-cell" style="padding:8px 4px;">
          <button class="hud-btn" data-bulk-idx="${idx}" data-action="copy">Copy</button>
          ${streamBtn}
          ${mpvUriBtn}
          ${mpvBridgeBtn}
        </td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;

    root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function () {
        const idx    = +this.getAttribute("data-bulk-idx");
        const action = this.getAttribute("data-action");
        const url    = urls[idx];
        if (!url) return;
        if (action === "copy") { copyText(url); showToast("Copied."); }
        else if (action === "stream") { resolveBunkrStreamLink(url, this); }
        else if (action === "mpv-uri") { launchMpvProtocol(url); showToast("Dispatched via MPV URI."); }
        else if (action === "mpv-bridge") { streamToLocalMpv(url, this); }
      };
    });

    runCheckQueue(urls, () => epoch === bulkEpoch, "bulk-check-", (t) => {
      // [G1] re-query at drain time: the panel may have been re-rendered since
      // the queue started; writing into a stale node would be a ghost update.
      const el = document.getElementById("hud-bulk-check-status");
      if (el) el.textContent = `${t.total} checked — ${t.alive} alive / ${t.dead} dead / ${t.unknown} unknown.`;
    });
  }

  // ===========================================================================
  // [C1] Ψ IG HARVESTER — proven Blob2URL v6.3 engine, composition-safe renames
  // ===========================================================================
  const MP4_RE = /https:\/\/[^\s"'<>\\]+?\.mp4(?:\?[^\s"'<>\\]*)?/g;

  function isIgCdnUrl(url) {
    return typeof url === "string" && /\.mp4(\?|$)/i.test(url) && /(cdninstagram|fbcdn)\./i.test(url);
  }

  const IG = {
    active: false,
    entries: [],          // newest-first: {kind, type, label, url, code}
    index: new Set(),     // URL dedupe
    renderTimer: null,
    observer: null,
    observerTimer: null,

    init() {
      this.active = IS_IG;
      if (!this.active) return;
      dbg("IG harvester armed — net-hook + DOM routes (document-start).");
      this.installNetHook();
      this.installObserver();
      // One-shot Route 2 over the full DOM once the initial render settles.
      setTimeout(() => {
        try { this.route2(document.documentElement.outerHTML || ""); } catch (_) {}
        this.videoSweep();
      }, 1500);
    },

    // Page-context response sniffing (property wrap: CSP-safe, no inline
    // script). Markers are __lm_ig so the wrap composes cleanly alongside
    // Blob2URL's __psi_ig wraps when both scripts run on instagram.com.
    installNetHook() {
      let page = null;
      try { if (typeof unsafeWindow !== "undefined" && unsafeWindow) page = unsafeWindow; } catch (_) {}
      if (!page) { dbg("IG net-hook idle — unsafeWindow unavailable (DOM routes only)"); return; }
      try {
        const origFetch = page.fetch;
        if (typeof origFetch === "function" && !origFetch.__lm_ig) {
          const wrapped = function (...args) {
            const p = origFetch.apply(this, args);
            try {
              p.then((res) => {
                if (res && res.ok && typeof res.clone === "function") {
                  res.clone().text().then((t) => IG.ingest(t)).catch(() => {});
                }
              }).catch(() => {});
            } catch (_) {}
            return p;
          };
          try { wrapped.toString = function () { return String(origFetch); }; } catch (_) {} // fingerprint masking
          wrapped.__lm_ig = true;
          page.fetch = wrapped;
        }
      } catch (_) {}
      try {
        const xo = page.XMLHttpRequest && page.XMLHttpRequest.prototype;
        if (xo && typeof xo.send === "function" && !xo.__lm_ig) {
          xo.__lm_ig = true;
          const origSend = xo.send;
          xo.send = function () {
            try {
              this.addEventListener("load", function () {
                try {
                  let t = "";
                  if (this.responseType === "" || this.responseType === "text") t = this.responseText;
                  else if (this.responseType === "json" && this.response) t = JSON.stringify(this.response);
                  if (t) IG.ingest(t);
                } catch (_) {}
              });
            } catch (_) {}
            return origSend.apply(this, arguments);
          };
          try { xo.send.toString = function () { return String(origSend); }; } catch (_) {}
        }
      } catch (_) {}
    },

    // Debounced DOM route: script[type=application/json] payloads on mutation.
    installObserver() {
      try {
        this.observer = new MutationObserver(() => {
          if (this.observerTimer !== null) return;
          this.observerTimer = setTimeout(() => {
            this.observerTimer = null;
            this.scanNewScripts();
          }, 300);
        });
        this.observer.observe(document.documentElement, { childList: true, subtree: true });
      } catch (_) {}
    },

    // Route 1 walk (video_versions progressive + video_dash_manifest DASH).
    walk(node, prog, dash) {
      try {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) { for (const v of node) this.walk(v, prog, dash); return; }
        const vv = node.video_versions;
        if (Array.isArray(vv)) {
          for (const entry of vv) {
            if (entry && typeof entry.url === "string" && entry.url) {
              const t = entry.type || 999;
              prog.set(entry.url, Math.min(prog.has(entry.url) ? prog.get(entry.url) : 999, t));
            }
          }
        }
        const manifest = node.video_dash_manifest;
        if (typeof manifest === "string" && manifest) {
          try {
            const doc = new DOMParser().parseFromString(manifest, "application/xml");
            const reps = doc.getElementsByTagName("Representation");
            for (let i = 0; i < reps.length; i++) {
              const bases = reps[i].getElementsByTagName("BaseURL");
              if (bases.length && bases[0].textContent) {
                const label = reps[i].getAttribute("FBQualityLabel") || "?";
                const url = bases[0].textContent.trim().replace(/&amp;/g, "&");
                if (url) dash.push([label, url]);
              }
            }
          } catch (_) {}
        }
        for (const key in node) this.walk(node[key], prog, dash);
      } catch (_) {}
    },

    // Shortcode hunt for human-friendly identifiers (additive).
    findCode(node) {
      try {
        if (!node || typeof node !== "object") return "";
        if (Array.isArray(node)) { for (const v of node) { const c = this.findCode(v); if (c) return c; } return ""; }
        const c = node.shortcode || node.code;
        if (typeof c === "string" && /^[A-Za-z0-9_-]{4,32}$/.test(c)) return c;
        for (const key in node) { const r = this.findCode(node[key]); if (r) return r; }
      } catch (_) {}
      return "";
    },

    // Route 2 clean chain: entities → surrogate pairs → \u singles → \/ \"
    clean(text) {
      try {
        const ta = document.createElement("textarea");
        ta.innerHTML = text;
        text = ta.value;
      } catch (_) {}
      text = text.replace(/\\u(d[89ab][0-9a-f]{2})\\u(d[cdef][0-9a-f]{2})/gi, (m, hi, lo) =>
        String.fromCodePoint(0x10000 + ((parseInt(hi, 16) - 0xD800) << 10) + (parseInt(lo, 16) - 0xDC00)));
      text = text.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
      return text.replace(/\\\//g, '/').replace(/\\"/g, '"');
    },

    // Entry point: text → vault (Route 1 structural, then Route 2 fallback net).
    ingest(text) {
      try {
        if (typeof text !== "string" || !text) return;
        if (text.indexOf("video_versions") === -1 && text.indexOf("video_dash_manifest") === -1 && text.indexOf(".mp4") === -1) return;
        const prog = new Map();
        const dash = [];
        let parsed = null, code = "";
        try { parsed = JSON.parse(text); } catch (_) {}
        if (parsed != null) {
          this.walk(parsed, prog, dash);
          code = this.findCode(parsed);
        }
        const seen = new Set([...prog.keys()]);
        for (const [, u] of dash) seen.add(u);
        const extra = [];
        if (text.indexOf(".mp4") !== -1) {
          const cleaned = this.clean(text);
          for (const raw of (cleaned.match(MP4_RE) || [])) {
            const url = raw.replace(/&amp;/g, "&").replace(/[.,;]+$/, "");
            if (!url || seen.has(url)) continue;
            seen.add(url);
            extra.push(url);
          }
        }
        if (!prog.size && !dash.length && !extra.length) return;
        // Batch order: progressive (type asc) → dash → fallback net.
        const batch = [];
        for (const [url, t] of [...prog].sort((a, b) => a[1] - b[1])) batch.push({ kind: "progressive", type: t, label: "", url, code });
        for (const [label, url] of dash) batch.push({ kind: "dash", type: 999, label, url, code });
        for (const url of extra) batch.push({ kind: "extra", type: 999, label: "", url, code: "" });
        this.merge(batch);
      } catch (_) {}
    },

    merge(batch) {
      const fresh = batch.filter((e) => !this.index.has(e.url));
      if (!fresh.length) return;
      for (const e of fresh) this.index.add(e.url);
      this.entries.unshift(...fresh);
      while (this.entries.length > 500) { const drop = this.entries.pop(); this.index.delete(drop.url); }
      dbg(`IG +${fresh.length} URL(s) → vault: ${this.entries.length}`);
      this.renderSoon();
    },

    // [C2] Debounced HUD refresh — only while the IG tab is the visible tab.
    renderSoon() {
      if (this.renderTimer !== null) return;
      this.renderTimer = setTimeout(() => {
        this.renderTimer = null;
        const panel = document.getElementById("hud-panel-root");
        if (panel && !panel.hasAttribute("hidden") && currentTab === "ig") setHudTab("ig");
      }, 400);
    },

    copyAll() {
      if (!this.entries.length) { showToast("IG vault empty — open posts / scroll the feed, then Rescan."); return; }
      copyText(this.entries.map((e) => e.url).join("\n"));
      showToast(`${this.entries.length} IG URL(s) copied.`);
    },

    rescan() {
      this.scanNewScripts(true);
      try { this.route2(document.documentElement.outerHTML || ""); } catch (_) {}
      this.videoSweep();
      showToast(`IG re-scan → ${this.entries.length} unique URL(s).`);
    },

    // DOM route: script[type=application/json] sweep (own scan markers).
    scanNewScripts(force) {
      document.querySelectorAll('script[type="application/json"]').forEach((s) => {
        if (!force && s.hasAttribute("data-lm-ig-scanned")) return;
        try { s.setAttribute("data-lm-ig-scanned", "true"); } catch (_) {}
        const t = s.textContent;
        if (t) this.ingest(t);
      });
    },

    // DOM route: full-document Route 2 sweep.
    route2(text) {
      if (typeof text !== "string" || text.indexOf(".mp4") === -1) return;
      const cleaned = this.clean(text);
      const batch = [];
      for (const raw of (cleaned.match(MP4_RE) || [])) {
        const url = raw.replace(/&amp;/g, "&").replace(/[.,;]+$/, "");
        if (url && !this.index.has(url)) batch.push({ kind: "extra", type: 999, label: "", url, code: "" });
      }
      if (batch.length) this.merge(batch);
    },

    // DOM route: <video> elements playing straight off the IG CDNs.
    videoSweep() {
      try {
        document.querySelectorAll("video").forEach((el) => {
          const raw = (typeof el.currentSrc === "string" && el.currentSrc) || el.getAttribute("src") || "";
          if (raw && isIgCdnUrl(raw) && !this.index.has(raw)) {
            this.merge([{ kind: "extra", type: 999, label: "", url: raw, code: "" }]);
          }
        });
      } catch (_) {}
    },
  };

  // ===========================================================================
  // [C2] INSTAGRAM VAULT PANEL
  // ===========================================================================
  let igRenderEpoch = 0;
  function renderIGPanel(root) {
    const epoch = ++igRenderEpoch;
    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <button class="hud-btn" id="ig-rescan-btn">Rescan</button>
        <button class="hud-btn" id="ig-copyall-btn">Copy All</button>
        <span id="ig-status" class="hud-status-text" style="color:var(--text-secondary);">${IG.entries.length} unique URL(s) — newest first (net-hook + DOM routes, 500 cap).</span>
      </div>
      <div id="ig-table-root" style="margin-top:12px;"></div>
    `;
    root.querySelector("#ig-rescan-btn").onclick = () => { IG.rescan(); setHudTab("ig"); };
    root.querySelector("#ig-copyall-btn").onclick = () => IG.copyAll();
    renderIGTable(IG.entries.slice(0, 100), root.querySelector("#ig-table-root"), epoch);
  }

  function renderIGTable(entries, root, epoch) {
    if (!entries.length) {
      root.innerHTML = `<div class="hud-status-text" style="color:var(--text-secondary);padding:16px 0;">No IG media harvested yet — scroll the feed, open posts/reels, then Rescan. (login wall = empty vault)</div>`;
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse;text-align:left;"><thead>
      <tr style="border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);">
        <th style="padding:8px 4px;">Type</th>
        <th style="padding:8px 4px;">Code</th>
        <th style="padding:8px 4px;">Link</th>
        <th style="padding:8px 4px;">Actions</th>
        <th style="padding:8px 4px;">Status</th>
      </tr>
    </thead><tbody>`;
    entries.forEach((e, idx) => {
      const tag = e.kind === "progressive" ? `progressive type ${e.type} — video+audio`
        : e.kind === "dash" ? `dash ${e.label} — video-only`
        : "fallback net";
      const short = e.url.length > 96 ? e.url.slice(0, 96) + "..." : e.url;
      html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <td style="color:var(--text-cyan-active);padding:8px 4px;white-space:nowrap;">${escapeHTML(tag)}</td>
        <td style="padding:8px 4px;">${e.code ? `<span class="chip">${escapeHTML(e.code)}</span>` : ""}</td>
        <td style="max-width:260px;overflow-x:auto;padding:8px 4px;" title="${escapeHTML(e.url)}">${escapeHTML(short)}</td>
        <td class="hud-action-cell" style="padding:8px 4px;">
          <button class="hud-btn" data-ig-idx="${idx}" data-action="copy">Copy</button>
          <button class="hud-btn" data-ig-idx="${idx}" data-action="open">Open</button>
          <button class="hud-btn" data-ig-idx="${idx}" data-action="mpv-uri" title="Stream via OS protocol handler">MPV (URI)</button>
          <button class="hud-btn" data-ig-idx="${idx}" data-action="mpv-bridge" title="Stream via local HTTP bridge">MPV (Brdg)</button>
        </td>
        <td id="ig-check-${idx}" style="padding:8px 4px;"><span class="chip unknown">…</span></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    root.innerHTML = html;

    root.querySelectorAll("button.hud-btn[data-action]").forEach(btn => {
      btn.onclick = function () {
        const idx    = +this.getAttribute("data-ig-idx");
        const action = this.getAttribute("data-action");
        const url    = entries[idx] && entries[idx].url;
        if (!url) return;
        if (action === "copy") { copyText(url); showToast("Copied to clipboard."); }
        else if (action === "open") { window.open(url, "_blank", "noopener,noreferrer"); }
        else if (action === "mpv-uri") { launchMpvProtocol(url); showToast("Dispatched via MPV URI."); }
        else if (action === "mpv-bridge") { streamToLocalMpv(url, this); }
      };
    });

    runCheckQueue(entries.map((e) => e.url), () => epoch === igRenderEpoch, "ig-check-");
  }

  // ===========================================================================
  // SETTINGS PANEL
  // ===========================================================================
  function renderSettingsPanel(root) {
    root.innerHTML = `
      <div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;">
        <button class="hud-btn" id="hud-export-btn">Export Current Links</button>
        <button class="hud-btn" id="hud-mode-toggle-btn2">Switch to ${extractionMode === "host" ? "Media" : "Host"} Mode</button>
        <button class="hud-btn" id="hud-hostlist-btn">Show Host Patterns</button>
        <button class="hud-btn" id="hud-fonts-btn" title="Load display fonts from Google on HUD open (OPSEC: third-party font CDN)">Remote Fonts: ${remoteFonts ? "ON" : "OFF"}</button>
        <button class="hud-btn" id="hud-clear-prefs-btn" style="border-color:rgba(255, 77, 77, 0.5);color:#ff4d4d;">Reset Prefs</button>
      </div>
<div style="margin-bottom:16px;">
        <textarea id="hud-export-area" class="hud-input" rows="8" readonly placeholder="Exported links or pattern list will appear here."></textarea>
      </div>
      <div class="hud-status-text" style="color:var(--text-secondary);">
        Current mode: <b style="color:var(--text-cyan-active);">${extractionMode === "host" ? "External Host" : "Media"}</b>${IG.active ? ` · IG harvester: <b style="color:var(--text-cyan-active);">ONLINE (${IG.entries.length} URLs)</b>` : ""}
      </div>
    `;
    const modeBtn = root.querySelector("#hud-mode-toggle-btn2");
    root.querySelector("#hud-export-btn").onclick = function () {
      const links = extractionMode === "host" ? extractExternalHostLinks() : extractMediaLinks();
      root.querySelector("#hud-export-area").value = links.join("\n");
      showToast(`${links.length} links exported.`);
    };
    modeBtn.onclick = function () {
      if (extractionMode === "host") {
        setExtractionMode("media");
        modeBtn.textContent = "Switch to Host Mode";
      } else {
        setExtractionMode("host");
        modeBtn.textContent = "Switch to Media Mode";
      }
    };
    root.querySelector("#hud-hostlist-btn").onclick = function () {
      root.querySelector("#hud-export-area").value = HOSTER_PATTERNS.map(r => r.toString()).join("\n");
      showToast("Host pattern list loaded.");
    };
    root.querySelector("#hud-fonts-btn").onclick = function () {
      remoteFonts = !remoteFonts;
      setUserPref("remoteFonts", remoteFonts);
      this.textContent = `Remote Fonts: ${remoteFonts ? "ON" : "OFF"}`;
      if (remoteFonts) ensureHudFonts();
      else unloadHudFonts(); // [G2] evict the stylesheet — OFF means local stacks now, not next load
      showToast(`Remote fonts ${remoteFonts ? "ON — lazy load on HUD open (font CDN visible to network)" : "OFF — local font stacks only (OPSEC-quiet)"}.`);
    };
    root.querySelector("#hud-clear-prefs-btn").onclick = function () {
      if (window.confirm("Reset all LinkMasterΨ preferences to defaults?")) {
        GMapi.deleteValue("extractionMode");
        GMapi.deleteValue("remoteFonts");
        extractionMode = "host";
        remoteFonts = true;
        showToast("Preferences reset.");
        setHudTab("settings");
      }
    };
  }

  // ===========================================================================
  // DRAGGABLE HUD + KEYBOARD NAV
  // ===========================================================================
  function bindDrag() {
    let drag = { x: 0, y: 0, active: false, el: null };
    document.addEventListener("mousedown", function (e) {
      const hud = document.getElementById("hud-panel-root");
      if (!hud) return;
      if (e.target.closest(".hud-header")) {
        drag.el     = hud;
        drag.x      = e.clientX - hud.offsetLeft;
        drag.y      = e.clientY - hud.offsetTop;
        drag.active = true;
        document.body.style.userSelect = "none";
      }
    });
    document.addEventListener("mousemove", function (e) {
      if (!drag.active || !drag.el) return;
      drag.el.style.left     = (e.clientX - drag.x) + "px";
      drag.el.style.top      = (e.clientY - drag.y) + "px";
      drag.el.style.right    = "auto";
      drag.el.style.bottom   = "auto";
      drag.el.style.position = "fixed";
    });
    document.addEventListener("mouseup", function () {
      drag.active = false;
      document.body.style.userSelect = "";
    });
  }

  function bindKeys() {
    document.addEventListener("keydown", function (e) {
      if (e.isComposing) return; // IME composition safety
      // [C3] Alt+L — HUD toggle (capture phase so page handlers cannot swallow
      // it first; no collision with Blob2URL's Alt+S / Alt+I).
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.repeat && typeof e.key === "string" && e.key.toLowerCase() === "l") {
        e.preventDefault();
        const hud = document.getElementById("hud-panel-root");
        if (hud && !hud.hasAttribute("hidden")) hud.setAttribute("hidden", "true");
        else showHudPanel();
        return;
      }
      const hud = document.getElementById("hud-panel-root");
      if (!hud || hud.hasAttribute("hidden")) return;
      if (e.key === "Escape") { hud.setAttribute("hidden", "true"); return; }
      if (e.key === "Tab") {
        const focusables = Array.from(hud.querySelectorAll("button, [tabindex='0'], textarea, input"));
        if (!focusables.length) return;
        let idx = focusables.indexOf(document.activeElement);
        if (e.shiftKey) idx = idx <= 0 ? focusables.length - 1 : idx - 1;
        else            idx = (idx + 1) % focusables.length;
        focusables[idx].focus();
        e.preventDefault();
      }
    }, true);
  }

  // ===========================================================================
  // GM MENU COMMANDS
  // ===========================================================================
  function registerMenus() {
    GMapi.menu("Show 4ndr0666 Electric Media HUD", () => showHudPanel());
    GMapi.menu("Ψ: Instagram Vault", () => {
      if (!IG.active) { showToast("IG harvester idle — instagram.com only."); return; }
      showHudPanel();
      setHudTab("ig");
    });
    GMapi.menu("Ψ: Copy All Instagram Links", () => IG.copyAll());
  }

  // ===========================================================================
  // BOOTSTRAP — [A2]/[A3] IG arms at document-start in every frame; the UI
  // waits for <body> and renders in the top frame only.
  // ===========================================================================
  function whenBodyReady(fn) {
    if (document.body) { fn(); return; }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  IG.init();

  if (!isTopFrame) return; // dock/HUD/listeners are top-frame only

  whenBodyReady(() => {
    injectHudStyles();
    createDock();
    bindDrag();
    bindKeys();
    registerMenus();
    if (IG.active) IG.scanNewScripts();
  });

})();
