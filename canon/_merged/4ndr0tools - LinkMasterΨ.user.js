// ==UserScript==
// @name           4ndr0tools - LinkMasterΨ
// @namespace      https://github.com/4ndr0666/userscripts
// @author         4ndr0666
// @version      6.3.0
// @description    Accurately decodes, previews, exports, validates and scrapes all links. (Dual MPV Support + Ψ IG Harvester + sexyforums premium-link unwrap + GitHub raw-URL harvest + Ψ2 forum deep-scrape engine)
// @downloadURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @updateURL      https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
//
// ── HOSTING RULES ─────────────────────────────────────────────────────────────
//  General:    any http(s) page — the dock/HUD/listeners now render in the TOP
//              FRAME only (v5.0.0 injected a full HUD into every iframe).
//  Instagram:  *://*.instagram.com/* — the Ψ IG harvester arms in EVERY IG frame
//              at document-start (fetch/XHR net-hook wraps page transports
//              before page code fires) + JSON-script/DOM/video routes feed a
//              500-entry dedupe vault surfaced as a dedicated HUD tab.
//  SexyForums: *://sexyforums.com/* — premium-link unwrap module rewrites
//              /redirect?to= wrappers to the parent unfurl block's data-url.
//  Forum:      XenForo-style threads (any host) — Ψ2-lineage deep-scrape
//              engine: post detection in every frame, per-host resolver
//              chain, configure-and-download packaging; surfaced as the
//              HUD's Forum tab (top frame).
//  GitHub:     github.com repo/tree views — "Copy All Raw URLs" harvest
//              button (raw.githubusercontent.com URL list to clipboard).
// @match          *://*/*
// @match          *://*.instagram.com/*
// @run-at         document-start
// @license        UNLICENSED - RED TEAM USE ONLY
// @require      https://unpkg.com/@popperjs/core@2
// @require      https://unpkg.com/tippy.js@6
// @require      https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require      https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_deleteValue
// @grant          GM_xmlhttpRequest
// @grant          GM_registerMenuCommand
// @grant          GM_setClipboard
// @grant          GM_download
// @grant          unsafeWindow
// @connect        *
// @connect        127.0.0.1
// @connect        cdninstagram.com
// @connect        fbcdn.net
// @connect        instagram.com
// ==/UserScript==
// 6.2.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
// · OPSEC: remote display fonts now default OFF (Settings toggle remains; local stacks always degrade).

/* ═══ v6.0.0 — SUITE CONSOLIDATION MERGE (GUP superset gate) ════════════════
   Base:      LinkMasterBETA v5.1.1 (verified superset of LinkMasterΨ v5.0.0
              per its embedded GUP audit pass; additionally contains the
              paste-to-check bulk panel absorbed from the LinkMasterΨ2 v3.1.0
              parallel lineage — rendering Ψ2 fully subsumed).
   Absorbed:  • Premium Link Revealer v1.2 (sexyforums.com) — unfurl-block
                data-url unwrap, MutationObserver-driven, styling preserved.
              • Git Raw URL File List Parser v4.0.0 (github.com) — raw URL
                harvest button. BUG FIXED during absorption: the legacy
                rewrite produced malformed
                raw.githubusercontent.com/githubusercontent.com/... URLs
                (double-domain); the correct github.com →
                raw.githubusercontent.com mapping + /blob/ strip is now used.
   Retired:   LinkMasterΨ (v5.0.0), LinkMasterΨ2 (v3.1.0), LinkMasterBETA
              (v5.1.1), Premium Link Revealer (v1.2), Git Raw URL File List
              Parser (v4.0.0). Uninstall all five; this script is their
              superset. Built by the 4ndr0666tools consolidation.
   ═════════════════════════════════════════════════════════════════════════ */

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

  // ──[B5] Trusted-Types-safe parsing (suite v1.4.2 class fix) ─────────────
  // DOMParser.parseFromString is a TT sink under require-trusted-types-for
  // 'script' — and LinkMasterΨ runs on EVERY host (YouTube, Google, GitHub…).
  // Mint one identity policy (co-install-aware multi-name probe), wrap the
  // parses, and fall back to the raw string where no policy can be minted
  // (locked-allowlist hosts — the surrounding error paths already degrade
  // those features gracefully instead of throwing an uncaught TypeError).
  const TTparse = (() => {
    let policy = null, tried = false;
    const wrap = (s) => {
      if (!tried) {
        tried = true;
        try {
          const TT = window.trustedTypes;
          if (TT && typeof TT.createPolicy === "function") {
            for (const name of ["4ndr0666tools#lm", "4ndr0666tools#lm.2", "4ndr0666tools#lm.3"]) {
              try { policy = TT.createPolicy(name, { createHTML: (v) => v }); break; } catch (_) {}
            }
          }
        } catch (_) { policy = null; }
      }
      return policy ? policy.createHTML(s) : s;
    };
    return {
      html: (s) => new DOMParser().parseFromString(wrap(s), "text/html"),
      xml: (s) => new DOMParser().parseFromString(wrap(s), "application/xml"),
    };
  })();

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
  let remoteFonts = getUserPref("remoteFonts", false);
  let currentTab = IS_IG ? "ig" : "scrape"; // [C2] IG pages open straight onto the vault

  const hudStyle = `
    :root {
      --bg-glass-panel: rgba(10, 19, 26, 0.75);
      --accent-cyan: #00E5FF;
      --text-cyan-active: #67E8F9;
      --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
      --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
      --glow-cyan-active: rgba(0, 229, 255, 0.4);
      --text-primary: #67E8F9;
      --text-secondary: rgba(0,229,255,0.7);
      --font-body: 'JetBrains Mono', monospace;
      --font-hud: 'Orbitron', sans-serif;
      --font-heading: 'Orbitron', sans-serif;
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
      transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), background 150ms ease-in-out;
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
      cursor: pointer; transition: all 150ms ease-in-out;
    }

    .dock-icon {
      width: 24px; height: 24px;
      color: var(--accent-cyan);
      margin-right: 8px; flex-shrink: 0;
      transition: filter 150ms ease-in-out, color 150ms ease-in-out;
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
      color: #ff0055; opacity: 1; filter: drop-shadow(0 0 8px rgba(255, 77, 77, 0.4));
    }

    .hud-tabs {
      display: flex; gap: 8px; padding: 8px 16px 0 16px;
      border-bottom: 1px solid var(--accent-cyan-border-idle); background: transparent;
    }
    .hud-tabs .hud-button {
      font-family: var(--font-heading); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;
      font-weight: 700; background: transparent; padding: 10px 16px;
      border-radius: 6px 6px 0 0; border: 1px solid transparent; border-bottom: none;
      color: var(--text-secondary); cursor: pointer; transition: all 150ms ease-in-out; box-shadow: none;
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
      letter-spacing: 0.05em; transition: all 150ms ease-in-out; box-shadow: none; outline: none;
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
      color: #ff0055; border-color: rgba(255, 77, 77, 0.5);
      background: rgba(255, 77, 77, 0.05);
    }
    .chip.unknown {
      color: #67E8F9; border-color: rgba(103,232,249,0.5);
      background: rgba(255, 234, 0, 0.05);
    }
    .chip.favicon { background: rgba(10,19,26,0.85); color: var(--text-cyan-active); padding: 0; display: inline-flex; justify-content: center; align-items: center; }

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

  /* v6.2.3 (suite v1.4.3): element-built twin of getPsiGlyphSVG — the dock
   * button's innerHTML render was the script's BOOT-BLOCKER on
   * require-trusted-types-for hosts (tt-smoke live proof: the whole script
   * died at createDock before anything else ran). Same geometry, same
   * currentColor stroke; the HUD panel's string render stays ledgered in
   * tools/sink-census.mjs as the next burn-down (27 sites). */
  const buildPsiGlyphEl = (className) => {
    const NS = 'http://www.w3.org/2000/svg';
    const svgEl = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
      return n;
    };
    const svg = svgEl('svg', { viewBox: '0 0 128 128', xmlns: NS, class: className, fill: 'none',
      stroke: 'currentColor', 'stroke-width': '3', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.appendChild(svgEl('path', { d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z', 'stroke-dasharray': '21.78 21.78', 'stroke-width': '2' }));
    svg.appendChild(svgEl('path', { d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z', 'stroke-dasharray': '10 10', 'stroke-width': '1.5', opacity: '0.7' }));
    svg.appendChild(svgEl('path', { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z' }));
    const psi = svgEl('text', { x: '64', y: '68', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: 'currentColor', stroke: 'none', 'font-size': '56', 'font-weight': '700', 'font-family': "'Cinzel Decorative', serif" });
    psi.textContent = '\u03A8';
    svg.appendChild(psi);
    return svg;
  };

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

  // [G11] v6.2.0 — VIDEO-GRID PARITY. Media sites present videos as PLAYER
  // PAGES (/watch/123, /v/abc, /embed/xyz, /video/…) wrapped around poster
  // thumbs, not as direct .mp4 files — the extension gate in isMediaFile()
  // silently dropped every grid item, so "All Media" mode only ever
  // propagated image thumbnails. Two predicates close the gap:
  function isVideoPageLink(url) {
    if (!url) return false;
    try {
      const u = new URL(url, location.origin);
      if (!/^https?:$/.test(u.protocol)) return false;
      if (/^\/(?:v|video|videos|embed|clip|watch|play|stream|movie|film)\//i.test(u.pathname)) return true;
      if (/[?&](?:v|video|clip|watch)=/i.test(u.search)) return true;
      // extensionless CDN paths that carry an explicit media hint
      if (/\/(?:manifest|playlist|playback)\//i.test(u.pathname)) return true;
      return false;
    } catch { return false; }
  }

  // A video-page href only counts when the anchor presents like a media
  // tile (embedded player/poster/thumbnail, or a tile-classified container)
  // — plain nav links to /watch/live in a header menu stay out of the list.
  function looksLikeMediaTile(a) {
    try {
      if (a.querySelector('video, [poster], iframe[src*="embed"]')) return true;
      if (a.querySelector('img[src], img[data-src], source[src]')) return true;
      const cls = (typeof a.className === 'string' && a.className) || '';
      return /(?:^|[\s_-])(?:video|thumb|tile|card|poster|clip|media|item)(?:[\s_-]|$)/i.test(cls);
    } catch { return false; }
  }

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
      // [G11] v6.2.0: video-grid pass — anchors that point at player pages
      // (watch/embed/video/…) and present like media tiles propagate their
      // hrefs. Previously only the thumbnail IMAGES inside the grid were
      // captured while every video link was dropped by the extension gate.
      if (!isMediaFile(url) && isVideoPageLink(url) && !isJunkMedia(url) && looksLikeMediaTile(a)) {
        links.add(url);
      }
    });
    document.querySelectorAll("img[src]").forEach(img => {
      // [G12] v6.2.0: currentSrc first (srcset-aware — the browser-resolved
      // candidate, not the placeholder), then the attribute fallbacks.
      const url = (img.currentSrc || img.src || "").trim();
      if (isMediaFile(url) && !isJunkMedia(url)) links.add(url);
    });
    // [G12] lazy-loaded grids keep the real thumb in data-* attributes while
    // src holds a 1×1 placeholder — those placeholders were all "All Media"
    // mode ever saw on lazy sites.
    document.querySelectorAll("img[data-src], img[data-original], img[data-lazy-src], img[data-srcset]").forEach(img => {
      const candidates = [
        img.getAttribute("data-src"),
        img.getAttribute("data-original"),
        img.getAttribute("data-lazy-src"),
        (img.getAttribute("data-srcset") || "").split(",")[0].trim().split(/\s+/)[0]
      ];
      for (const c of candidates) {
        const url = (c || "").trim();
        if (url && isMediaFile(url) && !isJunkMedia(url)) { links.add(url); break; }
      }
    });
    // [G12] <a> wrappers that carry the media in data-video/data-file (custom
    // players) instead of the href.
    document.querySelectorAll("a[data-video], a[data-file]").forEach(a => {
      for (const attr of ["data-video", "data-file"]) {
        const url = (a.getAttribute(attr) || "").trim();
        if (url && isMediaFile(url) && !isJunkMedia(url)) links.add(url);
      }
    });
    document.querySelectorAll("video, audio").forEach(el => {
      if (el.src && isMediaFile(el.src.trim()) && !isJunkMedia(el.src.trim())) links.add(el.src.trim());
      el.querySelectorAll("source[src]").forEach(src => {
const url = src.src.trim();
        if (isMediaFile(url) && !isJunkMedia(url)) links.add(url);
      });
    });
    // [G12] poster frames — frequently the only media-bearing attribute on
    // click-to-play tiles.
    document.querySelectorAll("video[poster]").forEach(v => {
      const url = (v.getAttribute("poster") || "").trim();
      if (url && isMediaFile(url) && !isJunkMedia(url)) links.add(url);
    });
    return Array.from(links);
  }

  // ===========================================================================
  // HUD PANEL SHELL & DOCK
  // ===========================================================================

  /* [R3 createElement migration — suite v1.4.4] Local element builder:
   * every innerHTML template below is retired. Same contract as the
   * kernel's Ψ.core.$new (variadic form): style accepts a string OR an
   * object, data-* / aria-* / role go through setAttribute, on* keys bind
   * listeners, null children are skipped. Zero HTML-string sinks — the
   * HUD now renders identically on require-trusted-types-for hosts
   * (no policy needed, no silent fallback). */
  function hudEl(tag, attrs, ...rest) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const key of Object.keys(attrs)) {
        const val = attrs[key];
        if (val == null) continue;
        if (key === "style" && typeof val === "object") Object.assign(el.style, val);
        else if (key.startsWith("data-") || key.startsWith("aria-") || key === "role") el.setAttribute(key, String(val));
        else if (key.startsWith("on") && typeof val === "function") el.addEventListener(key.slice(2), val);
        else if (key in el && typeof val !== "string") el[key] = val;
        else el.setAttribute(key, String(val));
      }
    }
    const kids = [];
    for (const c of rest) { if (Array.isArray(c)) kids.push(...c); else kids.push(c); }
    for (const c of kids) {
      if (c == null) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function createDock() {
    if (document.getElementById("linkmaster-dock")) return;
    const dock = document.createElement('div');
    dock.id = 'linkmaster-dock';

    const btn = document.createElement('button');
    btn.className = 'dock-btn';
    /* v6.2.3: element-built glyph + label (was the TT boot-blocker) */
    btn.appendChild(buildPsiGlyphEl('dock-icon'));
    const label = document.createElement('span');
    label.className = 'dock-text';
    label.textContent = 'LinkMaster';
    btn.appendChild(label);
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
      const hudTab = (tab, label, active) => hudEl("button",
        { class: "hud-button" + (active ? " active" : ""), "data-tab": tab, role: "tab",
          "aria-selected": String(active), tabindex: "0" }, label);
      hudPanel.append(
        hudEl("div", { class: "hud-header" },
          buildPsiGlyphEl("glyph"),
          hudEl("span", { class: "title" }, "LinkMaster"),
          hudEl("button", { class: "hud-close-btn", title: "Close HUD", tabindex: "0" }, "\u00D7")),
        hudEl("nav", { class: "hud-tabs", role: "tablist" },
          hudTab("scrape", "Scrape", true),
          hudTab("forum", "Forum", false),
          hudTab("check", "Check", false),
          IS_IG ? hudTab("ig", "Instagram", false) : null,
          hudTab("settings", "Settings", false)),
        hudEl("main", { class: "hud-content", tabindex: "0", id: "hud-content-panel" }));
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
    contentPanel.replaceChildren();
    if (tab === "forum")         ForumEngine.renderForumPanel(contentPanel);
    if (tab === "scrape")        renderScrapePanel(contentPanel);
    else if (tab === "check")    renderCheckPanel(contentPanel);
    else if (tab === "ig")       renderIGPanel(contentPanel);
    else if (tab === "settings") renderSettingsPanel(contentPanel);
  }

  // ===========================================================================
  // SCRAPE PANEL
  // ===========================================================================
  function renderScrapePanel(root) {
    root.replaceChildren(
      hudEl("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap;" },
        hudEl("button", { class: "hud-btn", id: "hud-scan-btn" }, "Scan"),
        hudEl("button", { class: "hud-btn" + (extractionMode === "host" ? " active" : ""), id: "hud-host-mode-btn" }, "Host Mode"),
        hudEl("button", { class: "hud-btn" + (extractionMode === "media" ? " active" : ""), id: "hud-media-mode-btn" }, "Media Mode"),
        hudEl("span", { id: "hud-scrape-status", class: "hud-status-text", style: "color:var(--text-secondary);" })),
      hudEl("div", { id: "hud-media-table-root", style: "margin-top:12px;" }),
      hudEl("div", { style: "color:var(--text-cyan-active); margin-top:12px;", class: "hud-status-text" },
        hudEl("b", null, "Mode:"),
        " ",
        hudEl("span", { id: "hud-current-mode" },
          extractionMode === "host" ? "External Host Links (decoded, deproxied)" : "All Media (images/videos/audio on page)")));
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
        tableRoot.replaceChildren(hudEl("div", { class: "hud-status-text", style: "color:var(--text-secondary);padding:16px 0;" },
          `No links found (${extractionMode === "host" ? "External Host Mode" : "Media Mode"}).`));
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
      root.replaceChildren(hudEl("div", { class: "hud-status-text", style: "color:var(--text-secondary);padding:16px 0;" }, "No links found on this page."));
      return;
    }
    const th = (label) => hudEl("th", { style: "padding:8px 4px;" }, label);
    const table = hudEl("table", { style: "width:100%;border-collapse:collapse; text-align:left;" },
      hudEl("thead", null, hudEl("tr", { style: "border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);" },
        th("Preview"), th("File"), th("Host"), th("Actions"), th("Status"))),
      hudEl("tbody", null, links.map((url, idx) => {
        const fileRaw  = url.split("/").pop().split("?")[0].slice(0, 40) || "(index)";
        const hostRaw  = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
        const heuristics = analyzeThreatHeuristics(url);
        const isBunkr  = isBunkrUrl(url);
        const actionBtn = (action, label, title) => hudEl("button", Object.assign(
          { class: "hud-btn", "data-idx": String(idx), "data-action": action }, title ? { title } : {}), label);

        const fileCell = hudEl("td", { style: "max-width:200px;overflow-x:auto;padding:8px 4px;" }, fileRaw);
        for (const t of heuristics) fileCell.append(" ", hudEl("span", { class: "chip dead" }, t));

        return hudEl("tr", { style: "border-bottom: 1px solid rgba(255,255,255,0.05);", "data-url": encodeURIComponent(url) },
          hudEl("td", { id: "media-preview-" + idx, style: "min-width:72px;max-width:80px;padding:8px 4px;" }),
          fileCell,
          hudEl("td", { style: "color:var(--text-cyan-active);max-width:140px;overflow-x:auto;padding:8px 4px;" }, hostRaw),
          hudEl("td", { class: "hud-action-cell", style: "padding:8px 4px;" },
            actionBtn("copy", "Copy"),
            actionBtn("open", "Open"),
            isBunkr ? actionBtn("stream", "Stream", "Resolve direct CDN link via DOM-first acquisition") : null,
            actionBtn("mpv-uri", "MPV (URI)", "Stream via OS protocol handler"),
            actionBtn("mpv-bridge", "MPV (Brdg)", "Stream via local HTTP bridge")),
          hudEl("td", { id: "media-check-" + idx, style: "padding:8px 4px;" },
            hudEl("span", { class: "chip unknown" }, "\u2026")));
      })));
    root.replaceChildren(table);

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
        const doc = TTparse.html(resp.responseText);
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
    td.replaceChildren(chip);
  }

  // ===========================================================================
  // CHECK PANEL (BULK)
  // ===========================================================================
  let bulkEpoch = 0;
  function renderCheckPanel(root) {
    root.replaceChildren(
      hudEl("div", { style: "margin-bottom:16px;" },
        hudEl("textarea", { id: "hud-bulk-links", class: "hud-input", placeholder: "Paste links to check (one per line)", rows: "7" })),
      hudEl("div", { style: "display:flex; align-items:center; gap:12px;" },
        hudEl("button", { class: "hud-btn", id: "hud-bulk-check-btn" }, "Check Links"),
        hudEl("span", { id: "hud-bulk-check-status", class: "hud-status-text", style: "color:var(--text-secondary);" })),
      hudEl("div", { id: "hud-bulk-table-root", style: "margin-top:16px;" }));
    root.querySelector("#hud-bulk-check-btn").onclick = function () {
      const input = root.querySelector("#hud-bulk-links").value;
      const urls  = input.split(/[\n\r\s]+/).map(x => x.trim()).filter(Boolean);
      if (urls.length === 0) { showToast("No links to check."); return; }
      renderBulkCheckTable(urls, root.querySelector("#hud-bulk-table-root"));
    };
    ForumEngine.renderCheckSection(root);
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
    const th = (label) => hudEl("th", { style: "padding:8px 4px;" }, label);
    const table = hudEl("table", { style: "width:100%;border-collapse:collapse; text-align:left;" },
      hudEl("thead", null, hudEl("tr", { style: "border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);" },
        th("Link"), th("Status"), th("Actions"))),
      hudEl("tbody", null, urls.map((url, idx) => {
        const isBunkr  = isBunkrUrl(url);
        const heuristics = analyzeThreatHeuristics(url);
        const actionBtn = (action, label, title) => hudEl("button", Object.assign(
          { class: "hud-btn", "data-bulk-idx": String(idx), "data-action": action }, title ? { title } : {}), label);

        const urlCell = hudEl("td", { style: "max-width:300px;overflow-x:auto;padding:8px 4px;" }, url);
        for (const t of heuristics) urlCell.append(" ", hudEl("span", { class: "chip dead" }, t));

        return hudEl("tr", { style: "border-bottom: 1px solid rgba(255,255,255,0.05);" },
          urlCell,
          hudEl("td", { id: "bulk-check-" + idx, style: "padding:8px 4px;" },
            hudEl("span", { class: "chip unknown" }, "\u2026")),
          hudEl("td", { class: "hud-action-cell", style: "padding:8px 4px;" },
            actionBtn("copy", "Copy"),
            isBunkr ? actionBtn("stream", "Stream") : null,
            actionBtn("mpv-uri", "MPV (URI)", "Stream via OS protocol handler"),
            actionBtn("mpv-bridge", "MPV (Brdg)", "Stream via local HTTP bridge")));
      })));
    root.replaceChildren(table);

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

  /* [R3] String entity decoder — replaces the textarea innerHTML decode
   * idiom in IG.clean() (a TrustedHTML sink under enforcement). Port of
   * the Blob2URL v7.2.0 decoder: named set covers the entities IG payloads
   * actually carry; numeric dec/hex covers the rest. */
  const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0',
      copy: '\u00A9', reg: '\u00AE', hellip: '\u2026', mdash: '\u2014', ndash: '\u2013',
      lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D', deg: '\u00B0',
      middot: '\u00B7', bull: '\u2022', dagger: '\u2020', permil: '\u2030',
      lsaquo: '\u2039', rsaquo: '\u203A', euro: '\u20AC', pound: '\u00A3', yen: '\u00A5',
      cent: '\u00A2', sect: '\u00A7', para: '\u00B6', plusmn: '\u00B1', times: '\u00D7',
      divide: '\u00F7', frac12: '\u00BD', sup2: '\u00B2', sup3: '\u00B3', micro: '\u00B5' };
  const decodeEntities = (str) => String(str).replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, e) => {
      if (e[0] === '#') {
          const code = (e[1] === 'x' || e[1] === 'X') ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
          if (!Number.isFinite(code) || code <= 0 || code > 0x10FFFF) return m;
          try { return String.fromCodePoint(code); } catch (_) { return m; }
      }
      return NAMED_ENTITIES[e] || m;
  });

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

    // Page-context response sniffing (v6.2.3: shared NetHook). The
    // per-script __lm_ig wraps stacked with Blob2URL's vault wraps on
    // instagram.com — every response body read twice. Both consumers now
    // subscribe to the build-inlined kernel/net.js singleton: one wrap
    // per realm, one body read, fanned out to every suite subscriber.
    installNetHook() {
      if (typeof __4NDR0_NET_API__ !== "undefined" && __4NDR0_NET_API__ && typeof __4NDR0_NET_API__.onBody === "function") {
        try {
          __4NDR0_NET_API__.onBody((t) => IG.ingest(t));
          dbg("IG net route ONLINE — shared NetHook subscriber (single body read)");
          return;
        } catch (e) {
          dbg("IG net-hook idle — " + ((e && e.message) || e));
        }
      } else {
        dbg("IG net-hook idle — NetHook module unavailable (DOM routes only)");
      }
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
            const doc = TTparse.xml(manifest);
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
      text = decodeEntities(text);
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
    root.replaceChildren(
      hudEl("div", { style: "display:flex;align-items:center;gap:12px;flex-wrap:wrap;" },
        hudEl("button", { class: "hud-btn", id: "ig-rescan-btn" }, "Rescan"),
        hudEl("button", { class: "hud-btn", id: "ig-copyall-btn" }, "Copy All"),
        hudEl("span", { id: "ig-status", class: "hud-status-text", style: "color:var(--text-secondary);" },
          `${IG.entries.length} unique URL(s) — newest first (net-hook + DOM routes, 500 cap).`)),
      hudEl("div", { id: "ig-table-root", style: "margin-top:12px;" }));
    root.querySelector("#ig-rescan-btn").onclick = () => { IG.rescan(); setHudTab("ig"); };
    root.querySelector("#ig-copyall-btn").onclick = () => IG.copyAll();
    renderIGTable(IG.entries.slice(0, 100), root.querySelector("#ig-table-root"), epoch);
  }

  function renderIGTable(entries, root, epoch) {
    if (!entries.length) {
      root.replaceChildren(hudEl("div", { class: "hud-status-text", style: "color:var(--text-secondary);padding:16px 0;" },
        "No IG media harvested yet — scroll the feed, open posts/reels, then Rescan. (login wall = empty vault)"));
      return;
    }
    const th = (label) => hudEl("th", { style: "padding:8px 4px;" }, label);
    const table = hudEl("table", { style: "width:100%;border-collapse:collapse;text-align:left;" },
      hudEl("thead", null, hudEl("tr", { style: "border-bottom: 1px solid var(--accent-cyan-border-idle); color:var(--text-cyan-active);" },
        th("Type"), th("Code"), th("Link"), th("Actions"), th("Status"))),
      hudEl("tbody", null, entries.map((e, idx) => {
        const tag = e.kind === "progressive" ? `progressive type ${e.type} — video+audio`
          : e.kind === "dash" ? `dash ${e.label} — video-only`
          : "fallback net";
        const short = e.url.length > 96 ? e.url.slice(0, 96) + "..." : e.url;
        const actionBtn = (action, label, title) => hudEl("button", Object.assign(
          { class: "hud-btn", "data-ig-idx": String(idx), "data-action": action }, title ? { title } : {}), label);

        return hudEl("tr", { style: "border-bottom: 1px solid rgba(255,255,255,0.05);" },
          hudEl("td", { style: "color:var(--text-cyan-active);padding:8px 4px;white-space:nowrap;" }, tag),
          hudEl("td", { style: "padding:8px 4px;" },
            e.code ? hudEl("span", { class: "chip" }, e.code) : null),
          hudEl("td", { style: "max-width:260px;overflow-x:auto;padding:8px 4px;", title: e.url }, short),
          hudEl("td", { class: "hud-action-cell", style: "padding:8px 4px;" },
            actionBtn("copy", "Copy"),
            actionBtn("open", "Open"),
            actionBtn("mpv-uri", "MPV (URI)", "Stream via OS protocol handler"),
            actionBtn("mpv-bridge", "MPV (Brdg)", "Stream via local HTTP bridge")),
          hudEl("td", { id: "ig-check-" + idx, style: "padding:8px 4px;" },
            hudEl("span", { class: "chip unknown" }, "\u2026")));
      })));
    root.replaceChildren(table);

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
    root.replaceChildren(
      hudEl("div", { style: "margin-bottom:16px;display:flex;flex-wrap:wrap;gap:12px;" },
        hudEl("button", { class: "hud-btn", id: "hud-export-btn" }, "Export Current Links"),
        hudEl("button", { class: "hud-btn", id: "hud-mode-toggle-btn2" }, `Switch to ${extractionMode === "host" ? "Media" : "Host"} Mode`),
        hudEl("button", { class: "hud-btn", id: "hud-hostlist-btn" }, "Show Host Patterns"),
        hudEl("button", { class: "hud-btn", id: "hud-fonts-btn", title: "Load display fonts from Google on HUD open (OPSEC: third-party font CDN)" }, `Remote Fonts: ${remoteFonts ? "ON" : "OFF"}`),
        hudEl("button", { class: "hud-btn", id: "hud-clear-prefs-btn", style: "border-color:rgba(255, 77, 77, 0.5);color:#ff0055;" }, "Reset Prefs")),
      hudEl("div", { style: "margin-bottom:16px;" },
        hudEl("textarea", { id: "hud-export-area", class: "hud-input", rows: "8", readonly: true, placeholder: "Exported links or pattern list will appear here." })),
      hudEl("div", { class: "hud-status-text", style: "color:var(--text-secondary);" },
        "Current mode: ",
        hudEl("b", { style: "color:var(--text-cyan-active);" }, extractionMode === "host" ? "External Host" : "Media"),
        IG.active ? [" · IG harvester: ", hudEl("b", { style: "color:var(--text-cyan-active);" }, `ONLINE (${IG.entries.length} URLs)`)] : null));
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
    ForumEngine.renderSettingsSection(root);
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


/* ═══ v6.2.0 — CAPTURE-ROBUSTNESS PASS (suite v1.3.0) ══════════════════════
   [G11] VIDEO-GRID PARITY: media sites present videos as PLAYER PAGES
         (/watch/123, /v/abc, /embed/xyz) wrapped around poster thumbs —
         the file-extension gate dropped every one of them, so "All Media"
         mode only ever propagated image links on video-grid sites. Anchors
         that target a video-page pattern AND present like a media tile
         (embedded player/poster/thumbnail or tile-classified container)
         now propagate their hrefs; plain header/nav links stay out.
   [G12] DOM-SCRAPE DEPTH: img collection is srcset-aware (currentSrc first
         — the browser-resolved candidate, not the attribute placeholder);
         lazy-loaded grids (data-src / data-original / data-lazy-src /
         data-srcset) are swept — previously a 1×1 placeholder was all the
         scan ever saw on lazy sites; anchors carrying the media in
         data-video / data-file (custom players) are harvested; video
         poster frames are harvested.
   ═════════════════════════════════════════════════════════════════════════ */


/* ═══ v6.1.0 — SUPERSET COMPLETION (LinkMasterΨ2 v3.1.0 engine port) ════════
   The v6.0.0 merge carried Ψ2's paste-to-check panel via the BETA lineage,
   but Ψ2's forum deep-scrape engine was not yet ported — a Gate-B
   verification failure under the consolidation's superset contract. This
   revision ports the engine in full:
     • "Forum" HUD tab: post-scoped scrape panel with per-post host filters,
       hover previews, configure-and-download (zip / flatten / skip-dupes /
       links.txt / log.txt), batch download, post-reaction automation.
     • Resolver chain: 30+ per-host deep resolvers (bunkr API, coomer
       profiles, gofile albums, cyberdrop/cyberfile folders, pixhost/imgbox/
       ibb/jpg6 albums, yandex disk, box.com, redgifs API, pornhub /
       spankbang / noodlemagazine streams, and more) with album recursion
       and password-protected album unlock via thread spoilers.
     • Check tab: "Check Scraped Posts" resolves selected posts through the
       chain, then HEAD-probes every resolved URL (content-type + size).
     • Settings: GoFile token + forum defaults, persisted under Ψ2's
       `linkmaster_settings` key (settings migrate transparently).
     • General mode: whole-page host inventory as a virtual post.
   Adaptations (behavior-preserving): Array.prototype.unique prototype
   pollution replaced with inline dedupe; engine logs kept closure-local;
   Ψ2's float-button HUD replaced by the shared LinkMaster dock.
   ═════════════════════════════════════════════════════════════════════════ */
  // ===========================================================================
  // Ψ ABSORBED MODULES (v6.0.0 consolidation) — both self-gating, run in
  // every frame exactly like their standalone predecessors.
  // ===========================================================================
  const AbsorbedPLR = (() => {
    // [Premium Link Revealer v1.2 — sexyforums.com unfurl unwrap]
    // Reveal true URLs hidden as "premium" link wrappers via the parent
    // bbCodeBlock--unfurl block's data-url attribute. Logic preserved
    // verbatim; observer unchanged.
    if (!/(^|\.)sexyforums\.com$/.test(location.hostname)) return { init() {} };

    const hasRedirectLink = (node) =>
      node.querySelector ? node.querySelector('a[href*="/redirect?to="]') : false;

    const rewriteRedirectLinks = (root = document) => {
      const links = root.querySelectorAll('a[href*="/redirect?to="].link--external.fauxBlockLink-blockLink');
      for (const link of links) {
        const block = link.closest('.bbCodeBlock--unfurl');
        if (!block) continue;
        const realUrl = block.getAttribute('data-url');
        if (!realUrl) continue;
        let parsedUrl;
        try { parsedUrl = new URL(realUrl, window.location.href); }
        catch (_) { continue; }
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') continue;
        link.href = parsedUrl.href;
        link.title = "Direct link restored";
        link.classList.add("real-link-restored");
        link.style.color = "#00E5FF";
        link.style.fontWeight = "bold";
      }
    };

    return {
      init() {
        rewriteRedirectLinks();
        const observer = new MutationObserver(muts => {
          for (const mut of muts) {
            for (const node of mut.addedNodes) {
              if (node.nodeType !== 1) continue;
              if (hasRedirectLink(node)) rewriteRedirectLinks(node);
            }
          }
        });
        const start = () => {
          rewriteRedirectLinks();
          observer.observe(document.body, { childList: true, subtree: true });
        };
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start, { once: true });
      },
    };
  })();

  const AbsorbedGitRaw = (() => {
    // [Git Raw URL File List Parser v4.0.0 — github.com raw-URL harvest]
    // "Copy All Raw URLs" button on repo/tree views. ABSORPTION FIX: the
    // legacy href rewrite emitted raw.githubusercontent.com/githubusercontent
    // .com/... (double-domain) — corrected to the proper github.com →
    // raw.githubusercontent.com mapping. Observer debounced (legacy ran a
    // raw querySelector pass on every mutation).
    if (!/(^|\.)github\.com$/.test(location.hostname)) return { init() {} };

    const STYLE = `
  #raw-harvest-btn {
    position: relative; display: inline-flex; align-items: center; justify-content: center;
    padding: 6px 14px !important;
    font-family: var(--font-body, 'JetBrains Mono', monospace);
    font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--accent-cyan, #00E5FF) !important;
    background: rgba(0, 0, 0, 0.35) !important;
    border: 2px solid var(--accent-cyan, #00E5FF) !important;
    border-radius: 2px !important;
    box-shadow: 0 0 12px rgba(0, 229, 255, 0.7), 0 0 22px rgba(0, 229, 255, 0.45), inset 0 0 6px rgba(0, 229, 255, 0.25);
    clip-path: polygon(0% 0%, calc(100% - 10px) 0%, 100% 10px, 100% 100%, 0% 100%);
    cursor: pointer; transition: 200ms ease all; z-index: 9999;
  }
  #raw-harvest-btn:hover {
    color: var(--text-cyan-active, #67E8F9) !important;
    border-color: var(--text-cyan-active, #67E8F9) !important;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.9), 0 0 30px rgba(0, 229, 255, 0.55), inset 0 0 8px rgba(0, 229, 255, 0.35);
  }
  #raw-harvest-btn:active { transform: scale(0.97); }
  #raw-harvest-btn.copied {
    background: rgba(0, 255, 157, 0.15) !important;
    border-color: #67E8F9 !important; color: #67E8F9 !important;
    box-shadow: 0 0 12px #67E8F9, 0 0 24px #67E8F9 !important;
  }`;

    const getFileRows = () => {
      const links = new Set();
      document.querySelectorAll('a.js-navigation-open, a[data-testid="listitem-title-link"], div[role="rowheader"] a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.includes('/tree/') && !href.endsWith('/..')) links.add(a);
      });
      document.querySelectorAll('tr, div[role="row"], div.Box-row').forEach(row => {
        const link = row.querySelector('a');
        if (link && link.getAttribute('href') && /\/blob\//.test(link.getAttribute('href'))) links.add(link);
      });
      return Array.from(links);
    };

    const generateRawUrls = () => {
      const links = getFileRows();
      if (links.length === 0) return '';
      // ABSORPTION FIX (v6.0.0): correct github → raw mapping. The legacy
      // script produced raw.githubusercontent.com/githubusercontent.com/<...>
      // — a malformed double-domain URL for every harvested file.
      const rawUrls = links.map(link =>
        link.href
          .replace('https://github.com/', 'https://raw.githubusercontent.com/')
          .replace('/blob/', '/'));
      return rawUrls.join('\n');
    };

    const injectButton = () => {
      if (document.getElementById('raw-harvest-btn')) return;
      if (getFileRows().length === 0) return; // self-gate: repo/tree views only

      const targets = [
        '.file-navigation',
        '[data-testid="repository-actions-container"]',
        '.d-flex.flex-justify-between.flex-items-center',
        '.Layout-sidebar + .Layout-main .d-flex',
        'header div.d-flex',
      ];
      let container = null;
      for (const sel of targets) {
        container = document.querySelector(sel);
        if (container) break;
      }
      if (!container) container = document.body;

      const btn = document.createElement('button');
      btn.id = 'raw-harvest-btn';
      btn.textContent = 'Copy All Raw URLs';
      btn.onclick = () => {
        const urls = generateRawUrls();
        if (!urls) {
          showToast('No file rows detected on this view.');
          return;
        }
        copyText(urls);
        const count = urls.split('\n').length;
        btn.textContent = `Copied ${count} URLs!`;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy All Raw URLs';
          btn.classList.remove('copied');
        }, 3000);
      };
      container.appendChild(btn);
    };

    return {
      init() {
        const style = document.createElement('style');
        style.textContent = STYLE;
        (document.head || document.documentElement).appendChild(style);
        const tryInject = () => { if (document.readyState !== 'loading') injectButton(); };
        setTimeout(tryInject, 500);
        setTimeout(tryInject, 1500);
        setTimeout(tryInject, 3000);
        setTimeout(tryInject, 6000);
        let queued = false;
        const observer = new MutationObserver(() => {
          if (queued) return;
          queued = true;
          setTimeout(() => { queued = false; tryInject(); }, 250); // debounced
        });
        const start = () => observer.observe(document.body, { childList: true, subtree: true });
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start, { once: true });
        window.addEventListener('load', () => setTimeout(tryInject, 1000));
        window.addEventListener('popstate', () => setTimeout(tryInject, 1000));
      },
    };
  })();


  // ===========================================================================
  // Ψ FORUM DEEP-SCRAPE ENGINE (v6.1.0 — LinkMasterΨ2 v3.1.0 superset port)
  // Post-scoped deep resolution: parses XenForo-style thread posts, inventories
  // per-host resources, then resolves each through the per-host resolver chain
  // (album recursion, full-size upgrades, API endpoints, password-protected
  // album unlock via thread spoilers) and packages downloads (GM_download /
  // JSZip). Settings persist under Ψ2's `linkmaster_settings` key — user
  // settings migrate transparently. Frame policy: post detection runs in
  // every frame (Ψ2 parity); the HUD stays top-frame only (v5.x policy).
  // ===========================================================================
  const ForumEngine = (() => {
    const http = GM_xmlhttpRequest;
    const isFF = typeof InstallTrigger !== "undefined";
    let logs = [];
    const globalConfig = {};

  const settings = {
    naming: {
      allowEmojis: false,
      invalidCharSubstitute: "-"
    },
    extensions: {
      documents: ["txt", "doc", "docx", "pdf"],
      compressed: ["zip", "rar", "7z", "tar", "bz2", "gzip"],
      image: ["jpg", "jpeg", "png", "gif", "webp", "jpe", "svg", "tif", "tiff", "jif"],
      video: ["mp4", "mov", "avi", "wmv", "mkv", "flv", "webm", "mpeg", "mpg", "m4v"]
    }
  };

  const log = {
    separator: (postId) => logs.push({ postId, message: "-".repeat(175) }),
    write: (postId, str, type, toConsole = true) => {
      const date = new Date();
      const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
        .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
        .replace(/::/g, "");
      logs.push({ postId, message });
      if (toConsole) {
        if (type.toLowerCase() === "info") {
          console.info(message);
        } else if (type.toLowerCase() === "warn") {
          console.warn(message);
        } else {
          console.error(message);
        }
      }
    },
    info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "INFO"),
    warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "WARNING"),
    error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "ERROR"),
    post: {
      info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
      error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`)
    },
    host: {
      info: (postId, str, host) => log.info(postId, str, host),
      error: (postId, str, host) => log.error(postId, str, host)
    }
  };

  const h = {
    isArray: (v) => Array.isArray(v),
    isObject: (v) => typeof v === "object",
    isNullOrUndef: (v) => v === null || v === undefined || typeof v === "undefined",
    basename: (path) =>
      path
        .replace(/(\s+)?$/, "")
        .split("/")
        .reverse()[0],
    fnNoExt: (path) => path.trim().split(".").reverse().slice(1).reverse().join("."),
    ext: (path) => {
      if (!path || path.indexOf(".") < 0) return null;
      const parts = path.split(".").reverse()[0].split("?")[0];
      return parts.toLowerCase();
    },
    show: (element) => (element.style.display = "block"),
    hide: (element) => (element.style.display = "none"),
    promise: (executor) => new Promise(executor),
    delayedResolve: async (ms) => await h.promise((resolve) => setTimeout(resolve, ms)),
    stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?</${tag}>`, "igs"), ""),
    stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
    limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
    element: (selector, container = document) => container.querySelector(selector),
    elements: (selector, container = document) => container.querySelectorAll(selector),
    contains: (needle, haystack, ignoreCase = true) =>
      (ignoreCase ? haystack.toLowerCase().indexOf(needle.toLowerCase()) : haystack.indexOf(needle)) > -1,
    ucFirst: (str) => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
    unique: (items, cb) => {
      if (cb) {
        return items.reduce((acc, item) => (!acc.find((i) => i[cb] === item[cb]) ? acc.concat(item) : acc), []);
      }
      return items.reduce((acc, item) => (acc.indexOf(item) < 0 ? acc.concat(item) : acc), []);
    },
    generateFilename: (url, responseHeaders = "") => {
      let basename;
      let dispositionMatch;

      dispositionMatch = responseHeaders.match(/(?<=filename=")([^"]+)|(?<=filename=)([^;]+)/i);
      if (dispositionMatch) {
        return decodeURI(dispositionMatch[1] || dispositionMatch[2]);
      }

      if (url.includes("pixeldrain.com")) {
        basename = h.basename(url.split("?")[0]);
      } else if (url.includes("https://simpcity.su/attachments/")) {
        basename = h.basename(url).replace(/(.*)-(.{3,4})\.\d*$/i, "$1.$2");
      } else if (url.includes("kemono.su")) {
        basename = new URL(url).searchParams.get("f") || h.basename(url);
      } else if (url.includes("cyberdrop")) {
        basename = decodeURI(h.basename(url));
        const extMatch = basename.match(/\.\w{3,6}$/);
        if (extMatch) {
          basename = basename.replace(extMatch[0], "").replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/, "") + extMatch[0];
        }
      } else {
        basename = h.basename(url).replace(/\?.*/, "").replace(/#.*/, "");
      }
      return decodeURI(basename);
    },
    prettyBytes: (number) => {
      const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      if (!Number.isFinite(number)) return "N/A";
      if (number === 0) return "0 B";
      const isNegative = number < 0;
      if (isNegative) number = -number;
      const exponent = Math.min(Math.floor(Math.log10(number) / 3), BYTE_UNITS.length - 1);
      const numberString = Number((number / 1000 ** exponent).toPrecision(3));
      return `${isNegative ? "-" : ""}${numberString} ${BYTE_UNITS[exponent]}`;
    },
    ui: {
      setText: (element, text) => {
        element.textContent = text;
      },
      setElProps: (element, props) => {
        for (const prop in props) {
          element.style[prop] = props[prop];
        }
      }
    },
    http: {
      gm_promise: (args) => new Promise((resolve, reject) => {
        // v6.3.0: hard 20 s default bound — no caller ever passed a timeout,
        // so the whole promise family was unbounded before.
        GM_xmlhttpRequest({ ...args, timeout: args.timeout || 20000, onload: resolve, onerror: reject, ontimeout: reject });
      }),
      base: (method, url, callbacks = {}, headers = {}, data = {}, responseType = "document") => h.promise((resolve, reject) => {
        let responseHeaders = null;
        const request = http({
          url,
          method,
          responseType,
          data,
          // v6.3.0: hard 20 s default bound — the core document transport used
          // to be unbounded (a stalled host could hang the resolver forever).
          timeout: 20000,
          headers: { Referer: url, ...headers },
          onreadystatechange: (response) => {
            if (response.readyState === 2) {
              responseHeaders = response.responseHeaders;
              if (callbacks.onResponseHeadersReceieved) {
                callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });
                request.abort();
                resolve({ request, response, status: response.status, responseHeaders });
              }
            }
            if (callbacks.onStateChange) callbacks.onStateChange({ request, response });
          },
          onprogress: (response) => {
            if (callbacks.onProgress) callbacks.onProgress({ request, response });
          },
          onload: (response) => {
            resolve({ source: response.responseText, request, status: response.status, dom: response.response, responseHeaders });
          },
          onerror: (error) => {
            if (callbacks.onError) callbacks.onError(error);
            reject(error);
          },
          ontimeout: () => reject(new Error("Request timed out (20s)"))
        });
      }),
      get: (url, callbacks = {}, headers = {}, responseType = "document") => h.http.base("GET", url, callbacks, headers, null, responseType),
      post: (url, data = {}, callbacks = {}, headers = {}) => h.http.base("POST", url, callbacks, headers, data)
    },

    re: {
      stripFlags: (pattern) => {
        if (!h.contains("/", pattern)) return pattern;
        const s = pattern.split("").reverse().join("");
        const index = s.indexOf("/");
        return s.substring(index).split("").reverse().join("");
      },
      toString: (pattern) => {
        let stringified = h.re.stripFlags(pattern.toString());
        if (stringified.startsWith("/")) stringified = stringified.substring(1);
        if (stringified.endsWith("/")) stringified = stringified.slice(0, -1);
        return stringified;
      },
      toRegExp: (pattern, flags) => new RegExp(pattern, flags),
      matchAll: (pattern, subject) => {
        const matches = [];
        let m;
        while ((m = pattern.exec(subject)) !== null) {
          if (m.index === pattern.lastIndex) pattern.lastIndex++;
          matches.push(m[0]);
        }
        return matches;
      }
    }
  };

  const parsers = {
    thread: {
      parseTitle: () => {
        const emojisPattern = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
        let titleElement = h.element(".p-title-value") || h.element("title");
        if (!titleElement) return "Untitled";
        let parsed = h.stripTags(["a", "span"], titleElement.innerHTML).replace(/\n/g, "");
        return !settings.naming.allowEmojis
          ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim()
          : parsed.trim();
      },
      parsePost: (post) => {
        const messageContent = post.parentNode.parentNode.querySelector(".message-content > .message-userContent");
        if (!messageContent) return null;

        const footer = post.parentNode.parentNode.querySelector("footer");
        const messageContentClone = messageContent.cloneNode(true);

        const postIdAnchor = post.querySelector("li:last-of-type > a");
        if (!postIdAnchor) return null;

        const href = postIdAnchor.getAttribute("href");
        if (!href) return null;

        const postIdMatch = /(?<=post-).*/i.exec(href);
        if (!postIdMatch || !postIdMatch[0]) return null;
        const postId = postIdMatch[0];

        const postNumber = postIdAnchor.textContent ? postIdAnchor.textContent.replace("#", "").trim() : null;
        if (!postNumber) return null;

        [".contentRow-figure", ".js-unfurl-favicon", "blockquote", ".button-text > span"]
          .flatMap((i) => [...messageContentClone.querySelectorAll(i)])
          .forEach((i) => {
            if (i.tagName === "BLOCKQUOTE" && i.querySelector(".bbCodeBlock-title")) i.remove();
            else if (i.tagName !== "BLOCKQUOTE") i.remove();
          });
        [...messageContentClone.querySelectorAll('.contentRow-header > a[href^="https://simpcity.su/threads"]')]
          .map((a) => a.parentNode.parentNode.parentNode.parentNode).forEach((i) => i.remove());

        const spoilers = [...messageContentClone.querySelectorAll(".bbCodeBlock--spoiler > .bbCodeBlock-content"), ...messageContentClone.querySelectorAll(".bbCodeInlineSpoiler")]
          .filter((s) => !s.querySelector(".bbCodeBlock--unfurl"))
          .map((s) => s.innerText)
          .concat(h.re.matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?/,;.]+/gis, messageContentClone.innerText).map((s) => s.trim()))
          .map((s) => s.trim().replace(/^:|^\bp:\b|^\bpw:\b|^\bkey:\b/i, "").trim())
          .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

        const postContent = messageContentClone.innerHTML;
        const postTextContent = messageContentClone.innerText;
        const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);
        const pageNumber = matches && matches.length ? Number(matches[0]) : 1;
        return {
          post,
          postId,
          postNumber,
          pageNumber,
          spoilers,
          footer,
          content: postContent,
          textContent: postTextContent,
          contentContainer: messageContent
        };
      }
    },
    hosts: {
      parseHosts: (postContent) => {
        let parsed = [];
        for (const host of hosts) {
          if (host.length < 2) continue;
          const signature = host[0].split(":");
          const matchers = host[1];
          if (!h.isArray(matchers) || !matchers.length) continue;
          const name = signature[0];
          let category = signature.length > 1 ? signature[1] : "misc";
          let singleMatcherPattern = matchers[0];
          let albumMatcherPattern = matchers.length > 1 ? matchers[1] : null;
          const execMatcher = (matcher) => {
            let pattern = matcher.toString().replace(/~an@/g, "a-zA-Z0-9");
            const stripQueryString = h.contains("<no_qs>", pattern.toString());
            const stripTrailingSlash = !h.contains("<keep_ts>", pattern.toString());
            pattern = pattern.replace("<no_qs>", "").replace("<keep_ts>", "");
            if (h.contains("!!", pattern)) {
              pattern = pattern.replace("!!", "");
              pattern = h.re.toRegExp(h.re.toString(pattern), "igs");
            } else {
              const pat = `(?<=data-url="|src="|href=")${h.re.toString(pattern)}.*?(?=")|https?://(www.)?${h.re.toString(
                              pattern
                          )}.*?(?=("|<|$|]|'))`;
              pattern = h.re.toRegExp(pat, "igs");
            }
            let matches = h.re.matchAll(pattern, postContent).filter((v, i, a) => a.indexOf(v) === i);
            matches = matches.map((url) => {
              if (stripQueryString && h.contains("?", url)) url = url.substring(0, url.indexOf("?"));
              if (stripTrailingSlash && url.endsWith("/")) url = url.slice(0, -1);
              return url.trim();
            });
            return h.unique(matches);
          };
          const categories = category.split(",");
          if (singleMatcherPattern) {
            let singleCategory = [categories[0]].map((c) => {
              if (c === "image" || c === "video") return `${h.ucFirst(c)}s`;
              if (c.trim() !== "") return h.ucFirst(c);
              return "Links";
            })[0];
            parsed.push({
              name,
              type: "single",
              category: singleCategory,
              resources: execMatcher(singleMatcherPattern)
            });
          }
          if (albumMatcherPattern) {
            let albumCategory = categories.length > 1 ? categories[1] : categories[0];
            albumCategory = `${h.ucFirst(albumCategory)} Albums`;
            parsed.push({
              name,
              type: "album",
              category: albumCategory,
              resources: execMatcher(albumMatcherPattern)
            });
          }
        }
        return parsed
          .map((p) => ({ ...p, enabled: true, id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER) }))
          .filter((p) => p.resources.length);
      }
    }
  };

  const styles = {
    tippy: {
      theme:
        ".tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:0 7px 7px;border-bottom-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:rgba(0,229,255,0.35)}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:gainsboro}"
    }
  };

  const ui = {
    getTooltipBackgroundColor: () => {
      const theme = document.body.innerHTML.indexOf("__&s=11") > -1 ? "purple" : "classic";
      return theme === "purple" ? "#30204f" : "#2a2929";
    },
    tooltip: (target, content, options = {}) => tippy(target, { arrow: true, theme: "transparent", allowHTML: true, content: content, appendTo: () => document.body, placement: "left", interactive: true, ...options }),
    pBars: {
      base: (color, height = "3px", width = "0%") => {
        const pb = document.createElement("div");
        pb.style.cssText = `height:${height}; background:${color}; width:${width}; transition: width 200ms;`;
        return pb;
      },
      createFileProgressBar: (color = "#46658b") => {
        const pb = ui.pBars.base(color);
        pb.style.marginBottom = "1px";
        return pb;
      },
      createTotalProgressBar: (color = "#545454") => {
        const pb = ui.pBars.base(color);
        pb.style.marginBottom = "10px";
        return pb;
      }
    },
    labels: {
      status: {
        createStatusLabel: (initialText = "") => {
          const container = document.createElement("div");
          container.style.cssText = "color: #959595; font-size: 12px; margin-bottom: 3px;";
          const span = document.createElement("span");
          if (initialText) span.textContent = initialText;
          container.appendChild(span);
          return { el: span, container };
        }
      }
    },
    forms: {
      createCheckbox: (id, label, checked) => `<div class="menu-row" style="margin-top:-5px;"><label class="iconic" style="user-select:none"><input type="checkbox" ${checked ? 'checked="checked"' : ""} id="${id}"/><i aria-hidden="true"></i><span class="iconic-label" style="font-weight:bold;margin-left:-7px"><span id="${id}-label">${label}</span></span></label></div>`,
      config: {
        post: {
          createForm: (postId, backgroundColor, innerHTML) => `<form id="download-config-form-${postId}" class="menu-content" style="user-select:none;padding:5px 10px;background:${backgroundColor};width:300px;min-width:300px;">${innerHTML}</form>`,
          createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => `<div class="menu-row"><div style="font-weight:bold;margin-top:5px;margin-bottom:8px;color:dodgerblue;">File / Archive Name</div><input id="filename-input-${postId}" type="text" style="background:${backgroundColor};" class="archive-name input" autocomplete="off" name="keywords" placeholder="${placeholder}" value="${currentValue}"/></div>`,
          createZippedCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-zipped`, "Zipped", checked),
          createFlattenCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-flatten`, "Flatten", checked),
          createSkipDownloadCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-download`, "Skip Download", checked),
          createVerifyBunkrLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, "Verify Bunkr Links", checked),
          createGenerateLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-links`, "Generate Links", checked),
          createGenerateLogCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-log`, "Generate Log", checked),
          createSkipDuplicatesCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, "Skip Duplicates", checked),
          createFilterLabel: (hosts, getTotalDownloadableResourcesCB) => `<div style="font-weight:bold;margin:5px 0 8px 8px;color:dodgerblue;">Filter <span id="filtered-count-${hosts[0] ? hosts[0].id : ""}">${getTotalDownloadableResourcesCB(hosts)}</span></div>`,
          createToggleAllCheckbox: (postId) => ui.forms.createCheckbox(`settings-toggle-all-hosts-${postId}`, "Toggle All Hosts", true),
          createHostCheckbox: (postId, host) => ui.forms.createCheckbox(`downloader-host-${host.id}-${postId}`, `${host.name} ${host.category} (${host.resources.length})`, host.enabled),
          createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAll) => `<div>${filterLabel}${createToggleAll ? ui.forms.config.post.createToggleAllCheckbox(postId) : ""}${hostsHtml}</div>`,
          createPostConfigForm: (
            parsedPost, parsedHosts, defaultFilename, settings, onSubmitFormCB, totalDownloadableResourcesForPostCB, btnDownloadPost
          ) => {
            const { postId } = parsedPost;
            const color = ui.getTooltipBackgroundColor();
            let hostsHtml = "<div>";
            parsedHosts.forEach(host => hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host));
            hostsHtml += "</div>";
            const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB);
            const settingsHeading = `<div class="menu-row"><div style="font-weight:bold;margin:3px 0 4px;color:dodgerblue;">Settings</div></div>`;

            let formHtml = [
              isFF ? ui.forms.config.post.createFilenameInput(settings.output.find(o => o.postId === postId)?.value || "", postId, color, defaultFilename) : null,
              settingsHeading,
              !isFF ? ui.forms.config.post.createZippedCheckbox(postId, settings.zipped) : null,
              ui.forms.config.post.createFlattenCheckbox(postId, settings.flatten),
              ui.forms.config.post.createSkipDuplicatesCheckbox(postId, settings.skipDuplicates),
              ui.forms.config.post.createGenerateLinksCheckbox(postId, settings.generateLinks),
              ui.forms.config.post.createGenerateLogCheckbox(postId, settings.generateLog),
              ui.forms.config.post.createSkipDownloadCheckbox(postId, settings.skipDownload),
              ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, settings.verifyBunkrLinks),
              ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
            ].filter(Boolean);

            const configForm = ui.forms.config.post.createForm(postId, color, formHtml.join(""));
            ui.tooltip(btnDownloadPost, configForm, {
              onShown: (instance) => {
                const inputEl = h.element(`#filename-input-${postId}`);
                if (inputEl) inputEl.oninput = e => {
                  let o = settings.output.find(o => o.postId === postId);
                  if (o) o.value = e.target.value;
                  else settings.output.push({ postId, value: e.target.value });
                };

                const updateCheckbox = (id, key) => {
                  const el = h.element(id);
                  if (el) el.onchange = e => {
                    settings[key] = e.target.checked;
                  };
                };
                updateCheckbox(`#settings-${postId}-generate-links`, "generateLinks");
                updateCheckbox(`#settings-${postId}-generate-log`, "generateLog");
                updateCheckbox(`#settings-${postId}-flatten`, "flatten");
                updateCheckbox(`#settings-${postId}-skip-duplicates`, "skipDuplicates");
                updateCheckbox(`#settings-${postId}-verify-bunkr-links`, "verifyBunkrLinks");
                if (!isFF) updateCheckbox(`#settings-${postId}-zipped`, "zipped");

                const skipDownloadEl = h.element(`#settings-${postId}-skip-download`);
                if (skipDownloadEl) skipDownloadEl.onchange = e => {
                  const checked = e.target.checked;
                  settings.skipDownload = checked;
                  const dependentElems = ["flatten", "skip-duplicates"];
                  dependentElems.forEach(key => {
                    const el = h.element(`#settings-${postId}-${key}`);
                    if (el) {
                      el.checked = false;
                      el.disabled = checked;
                    }
                  });
                  const genLinks = h.element(`#settings-${postId}-generate-links`);
                  if (genLinks) {
                    genLinks.checked = true;
                    genLinks.disabled = checked;
                  }
                };

                const formEl = h.element(`#download-config-form-${postId}`);
                if (formEl) formEl.onsubmit = e => {
                  e.preventDefault();
                  onSubmitFormCB({ tippyInstance: instance });
                };

                if (parsedHosts.length > 1) {
                  const toggleAllHostsEl = h.element(`#settings-toggle-all-hosts-${postId}`);
                  if (toggleAllHostsEl) toggleAllHostsEl.onchange = e => {
                    const checked = e.target.checked;
                    parsedHosts.forEach(host => {
                      const cb = h.element(`#downloader-host-${host.id}-${postId}`);
                      if (cb && cb.checked !== checked) cb.click();
                    });
                  };
                }

                parsedHosts.forEach(host => {
                  const hostCheckbox = h.element(`#downloader-host-${host.id}-${postId}`);
                  if (hostCheckbox) hostCheckbox.onchange = e => {
                    host.enabled = e.target.checked;
                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                    const countEl = document.querySelector(`#filtered-count-${parsedHosts[0].id}`); // Use querySelector for broader scope if needed
                    if (countEl) countEl.textContent = `(${filteredCount})`;

                    const totalResources = parsedHosts.reduce((acc, h) => acc + h.resources.length, 0);
                    const btnTextSpan = btnDownloadPost.querySelector("span") || btnDownloadPost;
                    btnTextSpan.textContent = `🡳 Configure & Download (${filteredCount}/${totalResources})`;

                    if (parsedHosts.length > 1) {
                      const checkedLength = parsedHosts.filter(h => h.enabled).length;
                      const toggleAll = h.element(`#settings-toggle-all-hosts-${postId}`);
                      if (toggleAll) toggleAll.checked = checkedLength === parsedHosts.length;
                    }
                  };
                });
              }
            });
          }
        }
      }
    }
  };

  let processing = [];

  const hosts = [
    ["Simpcity:Attachments", [/(\/attachments\/|\/data\/video\/)/]],
    ["Coomer:Profiles", [/coomer.su\/[~an@._-]+\/user/]],
    ["Coomer:image", [/(\w+\.)?coomer.su\/(data|thumbnail)/]],
    [
      "JPGX:image",
      [
        /(simp\d+\.)?(selti-delivery\.ru|jpg\d?\.(church|fish|fishing|pet|su|cr))\/(?!(img\/|a\/|album\/))/,
        /jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/
      ]
    ],
    ["kemono:direct link", [/.{2,6}\.kemono.su\/data\//]],
    ["Postimg:image", [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]],
    [
      "Ibb:image",
      [
        /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
        /ibb.co\/album\/[~an@_.-]+/
      ]
    ],
    [
      "Ibb:direct link",
      [
        /!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/
      ]
    ],
    ["Imagevenue:image", [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
    ["Imgvb:image", [/imgvb.com\/images\//, /imgvb.com\/album/]],
    ["Imgbox:image", [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
    ["Onlyfans:image", [/public.onlyfans.com\/files/]],
    ["Reddit:image", [/(\w+)?.redd.it/]],
    ["Pomf2:File", [/pomf2.lain.la/]],
    ["Nitter:image", [/nitter\.(.{1,20})\/pic/]],
    ["Twitter:image", [/([~an@.]+)?twimg.com\//]],
    ["Pixhost:image", [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
    ["Imagebam:image", [/imagebam.com\/(view|gallery)/]],
    ["Imagebam:full embed", [/images\d.imagebam.com/]],
    ["Saint:video", [/(saint2.(su|pk|cr)\/embed\/|([~an@]+\.)?saint2.(su|pk|cr)\/videos)/]],
    ["Redgifs:video", [/!!redgifs.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
    [
      "Bunkr:",
      [
        /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/
      ]
    ],
    [
      "Bunkr:Albums",
      [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]
    ],
    ["Give.xxx:Profiles", [/give.xxx\/[~an@_-]+/]],
    ["Pixeldrain:", [/(focus\.)?pixeldrain.com\/[lu]\//]],
    ["Gofile:", [/gofile.io\/d/]],
    ["Box.com:", [/m\.box\.com\//]],
    ["Yandex:", [/(disk\.)?yandex\.[a-z]+/]],
    ["Cyberfile:", [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
    ["Cyberdrop:", [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /cyberdrop.(me|to|cc|nl)\/a\//]],
    ["Pornhub:video", [/([~an@]+\.)?pornhub.com\/view_video/]],
    ["Noodlemagazine:video", [/(adult.)?noodlemagazine.com\/watch\//]],
    ["Spankbang:video", [/spankbang.com\/.*?\/video/]]
  ];

  const resolvers = [
    [
      [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
      (url) =>
        url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, "https://pbs.twimg.com/media/$3")
    ],
    [
      [/imagevenue.com/],
      async (url, http) => {
        const { dom } = await http.get(url);
        return dom.querySelector(".col-md-12 > a > img").getAttribute("src");
      }
    ],
    [[/pomf2.lain.la/], (url) => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, "pomf2.lain.la/f/$1.$2")],
    [[/coomer.su\/(data|thumbnail)/], (url) => url],
    [
      [/coomer.su/, /:!coomer.su\/(data|thumbnail)/],
      async (url, http) => {
        const host = "https://coomer.su";
        const profileId = url.replace(/\?.*/, "").split("/").reverse()[0];
        let finalURL = url.replace(/\?.*/, "");
        let nextPage = null;
        const posts = [];
        log.host.info(0, `Resolving profile: ${profileId}`, "coomer.su");
        let page = 1;
        do {
          const { dom } = await http.get(finalURL);
          const links = [...dom.querySelectorAll(".card-list__items > article")]
            .map((a) => a.querySelector(".post-card__heading > a"))
            .map((a) => {
              return {
                link: `${host}${a.getAttribute("href")}`,
                id: a.getAttribute("href").split("/").reverse()[0]
              };
            });
          posts.push(...links);
          nextPage = dom.querySelector('a[title="Next page"]');
          if (nextPage) {
            finalURL = `${host}${nextPage.getAttribute("href")}`;
          }
          log.host.info(0, `Resolved page: ${page}`, "coomer.su");
          page++;
        } while (nextPage);
        const resolved = [];
        let index = 1;
        for (const post of posts) {
          const { dom } = await http.get(post.link);
          const filesContainer = dom.querySelector(".post__files");
          if (filesContainer) {
            const images = filesContainer.querySelectorAll(".post__thumbnail > .fileThumb");
            if (images.length) {
              resolved.push(
                ...[...images].map((a) => ({ url: `${host}${a.getAttribute("href")}`, folderName: post.id }))
              );
            }
          }
          const attachments = dom.querySelectorAll(".post__attachments > .post__attachment > .post__attachment-link");
          if (attachments.length) {
            resolved.push(
              ...[...attachments].map((a) => {
                const url = `${host}${a.getAttribute("href")}`;
                let folder = "Images";
                const ext = h.ext(url.replace(/\?.*/, ""));
                if (settings.extensions.video.includes(ext)) {
                  folder = "Videos";
                }
                return { url, folderName: `${post.id}/${folder}` };
              })
            );
          }
          log.host.info(0, `Resolved post ${index} / ${posts.length}`, "coomer.su");
          index++;
        }
        return { folderName: profileId, resolved };
      }
    ],
    [
      [/(postimg|pixxxels).cc/],
      async (url, http) => {
        url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, "https://postimg.cc/$3");
        const { dom } = await http.get(url);
        return dom.querySelector(".controls > nobr > a").getAttribute("href");
      }
    ],
    [[/kemono.su\/data/], (url) => url],
    [
      [
        /(jpg\d\.(church|fish|fishing|pet|su|cr))|selti-delivery\.ru\//i,
        /:!jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i
      ],
      (url) => url.replace(".th.", ".").replace(".md.", ".")
    ],
    [
      [/jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
      async (url, http, spoilers, postId) => {
        url = url.replace(/\?.*/, "");
        let reFetch = false;
        let { source, dom } = await http.get(url, {
          onStateChange: (response) => {
            if (response.readyState === 2 && response.finalUrl !== url) {
              url = response.finalUrl;
              reFetch = true;
            }
          }
        });
        if (reFetch) {
          const { source: src, dom: d } = await http.get(url);
          source = src;
          dom = d;
        }
        if (h.contains("Please enter your password to continue", source)) {
          const authTokenNode = dom.querySelector('input[name="auth_token"]');
          const authToken = !authTokenNode ? null : authTokenNode.getAttribute("value");
          if (!authToken || !spoilers || !spoilers.length) return null;
          const attemptWithPassword = async (password) => {
            const { source, dom } = await http.post(
              url,
              `auth_token=${authToken}&content-password=${password}`,
              {},
              {
                Referer: url,
                Origin: "https://jpg6.su",
                "Content-Type": "application/x-www-form-urlencoded"
              }
            );
            return { source, dom };
          };
          let authenticated = false;
          spoilers = ["ramona"];
          for (const spoiler of spoilers) {
            const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
            if (!h.contains("Please enter your password to continue", src)) {
              authenticated = true;
              source = src;
              dom = d;
              break;
            }
          }
          if (!authenticated) {
            log.host.error(postId, `::Could not resolve password protected album::: ${url}`, "jpg6.su");
            return null;
          }
        }
        const resolvePageImages = async (dom) => {
          const images = [...dom.querySelectorAll(".list-item-image > a > img")]
            .map((img) => img.getAttribute("src"))
            .map((url) => url.replace(".md.", ".").replace(".th.", "."));
          const nextPage = dom.querySelector('a[data-pagination="next"]');
          if (nextPage && nextPage.hasAttribute("href")) {
            const { dom } = await http.get(nextPage.getAttribute("href"));
            images.push(...(await resolvePageImages(dom)));
          }
          return images;
        };
        const resolved = await resolvePageImages(dom);
        return { dom, source, folderName: dom.querySelector('meta[property="og:title"]').content.trim(), resolved };
      }
    ],
    [
      [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
      async (url, http) => {
        try {
          const { dom } = await http.get(url);
          return dom.querySelector(".header-content-right > a").getAttribute("href");
        } catch {
          return url;
        }
      }
    ],
    [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], (url) => url],
    [
      [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
      async (url, http) => {
        const albumId = url.replace(/\?.*/, "").split("/").reverse()[0];
        const { source, dom } = await http.get(url);
        const imageCount = Number(dom.querySelector('span[data-text="image-count"]').innerText);
        const pageCount = Math.ceil(imageCount / 32);
        const authToken = h.re.matchAll(/(?<=auth_token=").*?(?=")/i, source)[0];
        const fetchPageData = async (albumId, page, seekEnd, authToken) => {
          const seek = seekEnd || "";
          const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albumId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albumId}&auth_token=${authToken}&seek=${seek}&items_per_page=32`;
          const { source: response } = await http.post(
            "https://ibb.co/json",
            data,
            {},
            { "Content-Type": "application/x-www-form-urlencoded" }
          );
          let parsed;
          try {
            parsed = JSON.parse(response);
            if (parsed && parsed.status_code && parsed.status_code === 200) {
              const html = parsed.html.replace('"', '"');
              return {
                urls: h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html).map((o) => JSON.parse(decodeURIComponent(o)).url),
                parsed
              };
            }
            return { urls: [], parsed };
          } catch {
            return { urls: [], parsed };
          }
        };
        const resolved = [];
        let seekEnd = "";
        for (let i = 1; i <= pageCount; i++) {
          const data = await fetchPageData(albumId, i, seekEnd, authToken);
          seekEnd = data.parsed.seekEnd;
          resolved.push(...data.urls);
        }
        return { dom, source, folderName: dom.querySelector('meta[property="og:title"]').content.trim(), resolved };
      }
    ],
    [
      [/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//],
      (url) => url.replace(/\/t(\d+)\./gi, "img$1.").replace(/thumbs\//i, "images/")
    ],
    [
      [/pixhost.to\/gallery\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        let imageLinksInput = dom ? dom.querySelector(".share > div:nth-child(2) > input") : null;
        if (h.isNullOrUndef(imageLinksInput)) {
          imageLinksInput = dom ? dom.querySelector(".share > input:nth-child(2)") : null;
        }
        const valueAttr = imageLinksInput ? imageLinksInput.getAttribute("value") : "";
        const resolved = h.re
          .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, valueAttr)
          .map((url) => url.replace(/t(\d+)\./gi, "img$1.").replace(/thumbs\//i, "images/"));
        let folderName = "";
        if (dom) {
          const h2 = dom.querySelector(".link > h2");
          folderName = h2 && h2.innerText ? h2.innerText.trim() : "";
        }
        return { dom, source, folderName, resolved };
      }
    ],
    [
      [
        /((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/(v\/)?/i,
        /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//
      ],
      async (url, http) => {
        try {
          const { pathname } = new URL(url);
          const segments = pathname.split("/").filter(Boolean);
          const index = segments.findIndex((s) => ["f", "v", "d"].includes(s));
          const id = index > -1 ? segments.slice(index + 1).join("/") : segments.pop();
          const response = await http.post(
            "https://bunkr.cr/api/vs",
            JSON.stringify({ slug: id }),
            {},
            { "Content-Type": "application/json" }
          );
          const data = JSON.parse(response.source);
          if (!data.encrypted) return data.url;
          const binaryString = atob(data.url);
          const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
          return Array.from(binaryString)
            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
            .join("");
        } catch (error) {
          console.error(error.message);
          return null;
        }
      }
    ],
    [
      [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//],
      async (url, http) => {
        const { dom, source } = await http.get(url);
        const containers = dom.querySelectorAll(".grid-images > div");
        const files = [];
        for (const f of containers) {
          const a = f.querySelector('a[class="after:absolute after:z-10 after:inset-0"]');
          if (!a) continue;
          const href = a.getAttribute("href");
          if (!href || !href.includes("/f/")) continue;
          const id = href.split("/f/")[1];
          const response = await http.post(
            "https://bunkr.cr/api/vs",
            JSON.stringify({ slug: id }),
            {},
            { "Content-Type": "application/json" }
          );
          const data = JSON.parse(response.source);
          let finalURL;
          if (!data.encrypted) {
            finalURL = data.url;
          } else {
            const binaryString = atob(data.url);
            const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
            finalURL = Array.from(binaryString)
              .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
              .join("");
          }
          files.push(finalURL);
        }
        const infoContainer = dom.querySelector("h1");
        const textContent = infoContainer?.outerText || "";
        const parts = textContent.split("\n").map((t) => t.trim()).filter((t) => t !== "");
        const OrigAlbumName = parts.length ? parts[0].trim() : url.split("/").reverse()[0];
        const albumName = OrigAlbumName.replaceAll("/", "-").replace("&amp;", "");
        return { dom, source, folderName: albumName, resolved: files.filter((file) => file) };
      }
    ],
    [
      [/give.xxx\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        const profileId = h.re.matchAll(/(?<=profile-id=")\d+/g, source)[0];
        if (!profileId) return null;
        const resolved = [];
        let username = null,
          firstMediaId = null,
          mediaId = 1,
          iteration = 1;
        while (true) {
          let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
          endpoint += iteration === 1 ? "&min_id=1" : `&max_id=${mediaId}`;
          const { source: apiSource } = await http.get(endpoint);
          if (h.contains("_v", apiSource)) {
            const parsed = JSON.parse(apiSource);
            if (!parsed || parsed.length === 0) break;
            if (username === null) username = parsed[0].account.username;
            if (firstMediaId === null) firstMediaId = parsed[0].id;
            else if (firstMediaId === parsed[0].id) break;
            resolved.push(
              ...parsed.flatMap((i) =>
                i.media_attachments.map((a) => a.sizes).map((s) => s.large || s.normal || s.small)
              )
            );
            mediaId = parsed[parsed.length - 1].id;
          } else {
            break;
          }
          iteration++;
        }
        return { dom, source, folderName: username, resolved };
      }
    ],
    [
      [/pixeldrain.com\/[ul]/],
      (url) => {
        let resolved = url.replace("/u/", "/api/file/").replace("/l/", "/api/list/");
        resolved = h.contains("/api/list", resolved) ? `${resolved}/zip` : resolved;
        resolved = h.contains("/api/file", resolved) ? `${resolved}?download` : resolved;
        return resolved;
      }
    ],
    [
      [/([~an@]+\.)?pornhub.com\/view_video/],
      async (url, http, spoilers, postId) => {
        url = url.replace(/([a-zA-Z0-9]+\.)?pornhub/, "pornhub");
        const resolvePH = async (url) => {
          const { dom } = await http.get(
            url,
            {},
            { referer: url, cookie: "age-verified: 1; platform=tv; cookiesBannerSeen=1; hasVisited=1" }
          );
          const script = [...dom.querySelectorAll("script")]
            .map((s) => s.innerText)
            .find((s) => /var\smedia_\d+/gis.test(s));
          if (!script) return null;
          const mediaVars = h.re.matchAll(/var\smedia_\d+=.*?;/gis, script);
          return mediaVars
            .map((m) => {
              const cleaned = m.replace(/\/\*.*?\*\//gis, "").replace(/var\smedia_\d+=/i, "").replace(";", "");
              return cleaned
                .split("+")
                .map((s) => s.trim())
                .map((s) => {
                  let value = new RegExp(`var ${s}=".*?"`, "isg").exec(script)[0];
                  const match = value.match(/^[^"]*"([^"]*)"/s);
                  return match ? match[1] : "";
                })
                .join("");
            })
            .find((u) => u.includes("pornhub.com/video/get_media?s="));
        };
        let parsed = null,
          tries = 0;
        do {
          const infoURL = await resolvePH(url);
          if (!infoURL) {
            log.host.warn(postId, "Could not find media info URL. Retrying...", "Pornhub");
            await h.delayedResolve(1500);
            tries++;
            continue;
          }
          try {
            const { source } = await h.http.get(infoURL, {}, {}, "text");
            const json = JSON.parse(source);
            const fetchedFormats = json.reverse();
            const qualities = ["1080", "720", "480", "320", "240"];
            for (const q of qualities) {
              const f = fetchedFormats.find((f) => f.quality === q);
              if (f && f.videoUrl) {
                parsed = f.videoUrl;
                break;
              }
            }
          } catch (e) {
            log.host.error(postId, `Pornhub resolution error: ${e}. Retrying...`, "Pornhub");
          }
          await h.delayedResolve(1000);
          tries++;
        } while (!parsed && tries < 5);
        return parsed;
      }
    ],
    [
      [/gofile.io\/d/],
      async (url, http, spoilers, postId) => {
        const resolveAlbum = async (url, spoilers) => {
          const contentId = url.split("/").reverse()[0];
          const apiUrl = `https://api.gofile.io/contents/${contentId}?wt=4fd6sg89d7s6`;
          let { source } = await http.get(apiUrl, {}, { Authorization: `Bearer ${globalConfig.goFileToken}` });
          if (h.contains("error-notFound", source)) {
            log.host.error(postId, `::Album not found::: ${url}`, "gofile.io");
            return null;
          }
          if (h.contains("error-notPublic", source)) {
            log.host.error(postId, `::Album not public::: ${url}`, "gofile.io");
            return null;
          }
          let props = JSON.parse(source?.toString());
          if (h.contains("error-passwordRequired", source) && spoilers.length) {
            log.host.info(postId, `::Album requires password. Trying with ${spoilers.length} password(s)::`, "gofile.io");
            for (const spoiler of spoilers) {
              const hash = sha256(spoiler);
              const { source: passSource } = await http.get(`${apiUrl}&password=${hash}`);
              props = JSON.parse(passSource?.toString());
              if (props && props.status === "ok") {
                log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, "gofile.io");
                break;
              }
            }
          }
          return props;
        };
        const props = await resolveAlbum(url, spoilers);
        let folderName = h.basename(url);
        if (!props || props.status !== "ok") {
          log.host.error(postId, `::Unable to resolve album::: ${url}`, "gofile.io");
          return { dom: null, source: null, folderName, resolved: [] };
        }
        const resolved = [];
        const getChildAlbums = async (props, spoilers) => {
          if (!props || props.status !== "ok" || !props.data || !props.data.children) return [];
          const resolvedChildren = [];
          folderName = props.data.name;
          const files = props.data.children;
          for (const file in files) {
            const obj = files[file];
            if (obj.type === "file") {
              resolvedChildren.push(files[file].link);
            } else {
              const folderProps = await resolveAlbum(obj.code, spoilers);
              resolvedChildren.push(...(await getChildAlbums(folderProps, spoilers)));
            }
          }
          return resolvedChildren;
        };
        resolved.push(...(await getChildAlbums(props, spoilers)));
        if (!resolved.length) log.host.warn(postId, `::Empty album::: ${url}`, "gofile.io");
        return { dom: null, source: null, folderName, resolved };
      }
    ],
    [
      [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
      async (url, http, spoilers) => {
        const { source } = await http.get(url);
        const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
        const getFileInfo = async () => {
          const { source } = await http.post(
            "https://cyberfile.me/account/ajax/file_details",
            `u=${u}`,
            {},
            { "Content-Type": "application/x-www-form-urlencoded" }
          );
          return source;
        };
        let response = await getFileInfo();
        let requiredPassword = false,
          unlocked = false;
        if ((h.contains("albumPasswordModel", response) || h.contains("This folder requires a password", response)) && spoilers.length) {
          const html = JSON.parse(response).html;
          const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html);
          const folderId = matches.length ? matches[1] : null;
          if (!folderId) return null;
          requiredPassword = true;
          for (const password of spoilers) {
            const { source: passSource } = await http.post("https://cyberfile.me/ajax/folder_password_process", `submitme=1&folderId=${folderId}&folderPassword=${password}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
            if (h.contains("success", passSource) && JSON.parse(passSource).success === true) {
              unlocked = true;
              break;
            }
          }
        }
        if (requiredPassword && unlocked) response = await getFileInfo();
        return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\/gi, "/");
      }
    ],
    [
      [/cyberfile.(su|me)\/folder\//],
      async (url, http, spoilers) => {
        const { source, dom } = await http.get(url);
        const script = [...dom.querySelectorAll("script")].map((s) => s.innerText).find((s) => h.contains('data-toggle="tab"', s));
        const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script)[0];
        const loadFiles = async () => {
          const { source } = await http.post("https://cyberfile.me/account/ajax/load_files", `pageType=folder&nodeId=${nodeId}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
          return source;
        };
        let response = await loadFiles();
        let requiredPassword = false,
          unlocked = false;
        if ((h.contains("albumPasswordModel", response) || h.contains("This folder requires a password", response)) && spoilers.length) {
          requiredPassword = true;
          for (const password of spoilers) {
            const { source: passSource } = await http.post("https://cyberfile.me/ajax/folder_password_process", `submitme=1&folderId=${nodeId}&folderPassword=${password}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
            if (h.contains("success", passSource) && JSON.parse(passSource).success === true) {
              unlocked = true;
              break;
            }
          }
        }
        if (requiredPassword && !unlocked) return null;
        if (requiredPassword && unlocked) response = await loadFiles();
        const resolved = [];
        let folderName = h.basename(url);
        const props = JSON.parse(response);
        if (props && props.html) {
          folderName = props.page_title || folderName;
          const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);
          for (const fileUrl of urls) {
            const { source } = await http.get(fileUrl);
            const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
            const { source: fileDetails } = await http.post("https://cyberfile.me/account/ajax/file_details", `u=${u}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
            resolved.push(h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, fileDetails)[0]?.replace(/\\/gi, "/"));
          }
        }
        return { dom, source, folderName, resolved };
      }
    ],
    [[/([~an@]+\.)?saint2.(su|pk|cr)\/videos/], async (url) => url],
    [[/public.onlyfans.com\/files/], async (url) => url],
    [
      [/saint2.(su|pk|cr)\/embed/], async (url, http) => {
        const { dom } = await http.get(url);
        return dom.querySelector("source")?.getAttribute("src");
      }
    ],
    [
      [/redgifs.com(\/|\\\/)ifr/],
      async (url) => {
        const id = url.split("/").reverse()[0];
        url = `https://api.redgifs.com/v2/gifs/${id}`;
        const token = GM_getValue("redgifs_token", null);
        const { source } = await h.http.get(url, {}, { Authorization: `Bearer ${token}` });
        if (h.contains("urls", source)) {
          const urls = JSON.parse(source).gif.urls;
          return urls.hd || urls.sd;
        }
        return null;
      }
    ],
    [
      [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /:!cyberdrop.(me|to|cc|nl)\/a\//],
      async (url, http) => {
        if (url.includes("fs-")) {
          url = url.replace(/(fs|img)-\d+/i, "").replace(/(to|cc|nl)-\d+/i, "me");
          let { finalUrl } = await http.get(url, {
            onStateChange: (response) => {
              if (response.readyState === 2 && response.finalUrl !== url) url = response.finalUrl;
            }
          });
          url = finalUrl || url;
        }
        url = url.replace("cyberdrop.me/f", "https://cyberdrop.me/api/f").replace("cyberdrop.me/e", "https://cyberdrop.me/api/f");
        try {
          const response = await h.http.gm_promise({ method: "GET", url: url });
          const webData = JSON.parse(response.responseText);
          return webData.url;
        } catch (error) {
          console.error("Failed to resolve cyberdrop link:", error);
          return null;
        }
      }
    ],
    [
      [/cyberdrop.me\/a\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        const files = [...(dom ? dom.querySelectorAll("#file") : [])].map((file) => "https://cyberdrop.me/api" + file.getAttribute("href"));
        const resolveFile = async (fileUrl) => {
          try {
            return await cyberdrop_helper(fileUrl);
          } catch {
            console.error(`Failed to resolve ${fileUrl}, retrying...`);
            await h.delayedResolve(1000);
            return await cyberdrop_helper(fileUrl);
          }
        };
        const resolved = (await Promise.all(files.map(resolveFile))).filter(Boolean);
        return { dom, source, folderName: dom.querySelector("#title").innerText.trim(), resolved };
      }
    ],
    [
      [/noodlemagazine.com\/watch\//],
      async (url, http) => {
        const { dom } = await http.get(url);
        let playerIFrameUrl = dom.querySelector("#iplayer")?.getAttribute("src");
        if (!playerIFrameUrl) return null;
        playerIFrameUrl = playerIFrameUrl.replace("/player/", "https://noodlemagazine.com/playlist/");
        const { source } = await http.get(playerIFrameUrl);
        const props = JSON.parse(source || "[]");
        if (props.sources && props.sources.length) return props.sources[0].file;
        return null;
      }
    ],
    [
      [/spankbang.com\/.*?\/video/],
      async (url, http) => {
        const { source } = await http.get(url);
        let streamData = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)[0].replace(/'/g, '"');
        streamData = JSON.parse(streamData);
        const qualities = ["4k", "1080p", "720p", "480p", "320p", "240p"];
        for (const quality of qualities) {
          if (streamData[quality] && streamData[quality].length) return streamData[quality][0];
        }
        return null;
      }
    ],
    [
      [/imagebam.com\/(view|gallery)/],
      async (url, http) => {
        const date = new Date();
        date.setTime(date.getTime() + 6 * 60 * 60 * 1000);
        const expires = "; expires=" + date.toUTCString();
        const { source, dom } = await http.get(url, {}, { cookie: "nsfw_inter=1" + expires + "; path=/" });
        if (h.contains("gallery-name", source)) {
          const imageLinksInput = dom.querySelector(".links.gallery > div:nth-child(2) > div > input");
          const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput.getAttribute("value"));
          const resolved = [];
          for (const link of rawImageLinks) {
            const { dom: linkDom } = await http.get(link);
            resolved.push(linkDom?.querySelector(".main-image")?.getAttribute("src"));
          }
          return { dom, source, folderName: dom?.querySelector("#gallery-name")?.innerText.trim(), resolved };
        } else {
          return dom?.querySelector(".main-image")?.getAttribute("src");
        }
      }
    ],
    [[/images\d.imagebam.com/], (url) => url],
    [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], (url) => url.replace(".th.", ".").replace(".md.", ".")],
    [
      [/imgvb.com\/album\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        const resolved = [...dom.querySelectorAll(".image-container > img")].map((i) => i.getAttribute("src")).map((u) => u.replace(".th.", ".").replace(".md.", "."));
        return { dom, source, folderName: dom?.querySelector('meta[property="og:title"]')?.content.trim(), resolved };
      }
    ],
    [
      [/(\/attachments\/|\/data\/video\/)/], async (url) => url.startsWith("http") ? url : `https://simpcity.su${url}`
    ],
    [
      [/(thumbs|images)(\d+)?.imgbox.com\//, /:!imgbox.com\/g\//], (url) => url.replace(/_t\./gi, "_o.").replace(/thumbs/i, "images")
    ],
    [
      [/imgbox.com\/g\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        let resolved = dom ? [...dom.querySelectorAll("#gallery-view-content > a > img")].map((img) => img.getAttribute("src")).map((u) => u.replace(/(thumbs|t)(\d+)\./gis, "images$2.").replace("_b.", "_o.")) : [];
        let folderName = dom?.querySelector("#gallery-view > h1")?.innerText.trim() || "";
        return { dom, source, folderName, resolved };
      }
    ],
    [
      [/m\.box\.com\//],
      async (url, http) => {
        const { source, dom } = await http.get(url);
        const files = [...dom.querySelectorAll(".files-item-anchor")].map((el) => `https://m.box.com${el.getAttribute("href")}`);
        const resolved = [];
        for (const fileUrl of files) {
          const { source: fileSource, dom: fileDom } = await http.get(fileUrl);
          if (h.contains("image-preview", fileSource)) {
            resolved.push(fileDom.querySelector(".image-preview").getAttribute("src"));
          } else {
            resolved.push(fileDom.querySelector(".mtl > a").getAttribute("href"));
          }
        }
        return { source, dom, folderName: dom.querySelector(".folder-nav-title")?.innerText?.trim(), resolved: resolved.map((u) => `https://m.box.com${u}`) };
      }
    ],
    [
      [/twimg.com\//], (url) => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, "https://pbs.twimg.com/media/$1.$3")
    ],
    [
      [/(disk\.)?yandex\.[a-z]+/],
      async (url, http) => {
        const { dom } = await http.get(url);
        const script = dom.querySelector('script[id="store-prefetch"]');
        if (!script) return null;
        const json = JSON.parse(script.innerText);
        let sk, hash = null;
        if (json && json.environment && json.resources) {
          sk = json.environment.sk;
          const resourcesKeys = Object.keys(json.resources);
          hash = json.resources[resourcesKeys[0]]?.hash;
        }
        if (!sk || !hash) return null;
        const data = JSON.stringify({ hash, sk });
        const { source } = await http.post("https://disk.yandex.ru/public/api/download-url", data, {}, { "Content-Type": "text/plain" });
        const response = JSON.parse(source);
        if (response && response.error !== "true" && response.data) return response.data.url;
        return null;
      }
    ],
    [[/(\w+)?.redd.it/], (url) => url.replace(/&amp;/g, "&")]
  ];

  const setProcessing = (isProcessing, postId) => {
    const p = processing.find((p) => p.postId === postId);
    if (p) {
      p.processing = isProcessing;
    } else {
      processing.push({ postId, processing: isProcessing });
    }
  };

  async function resolvePostLinks(postData, statusLabel) {
    const { parsedPost, parsedHosts, resolvers, getSettingsCB, enabledHostsCB } = postData;
    const { postId, postNumber } = parsedPost;
    const postSettings = getSettingsCB();
    const enabledHosts = enabledHostsCB(parsedHosts);
    const allResolved = [];

    for (const host of enabledHosts.filter(h => h.resources.length)) {
      for (const resource of host.resources) {
        if (statusLabel) h.ui.setText(statusLabel, `Resolving: ${h.limit(resource, 80)}`);
        for (const resolver of resolvers) {
          const [patterns, resolverCB] = resolver;
          let matched = patterns.every(pattern => {
            let strPattern = pattern.toString();
            const shouldMatch = !strPattern.startsWith(":!");
            strPattern = strPattern.replace(":!", "");
            const re = h.re.toRegExp(h.re.toString(strPattern), "is");
            return shouldMatch ? re.test(resource) : !re.test(resource);
          });

          if (matched) {
            try {
              const passwords = [...parsedPost.spoilers, ...parsedPost.spoilers.map(s => s.toLowerCase())].filter((v, i, a) => a.indexOf(v) === i);
              const r = await Promise.resolve(resolverCB(resource, h.http, passwords, postId, postSettings));
              if (h.isNullOrUndef(r)) continue;

              const addResolved = (url, folderName) => {
                const item = h.isObject(url) ? { ...url, host, original: resource } : { url, host, original: resource, folderName };
                allResolved.push(item);
                if (statusLabel) log.post.info(postId, `::Resolved::: ${item.url}`, postNumber);
              };

              if (r && h.isArray(r.resolved)) {
                r.resolved.forEach(url => addResolved(url, r.folderName));
              } else {
                addResolved(r, null);
              }
            } catch (err) {
              log.post.error(postId, `::Error resolving ${resource}::: ${err}`, postNumber);
            }
            break;
          }
        }
      }
    }
    return allResolved;
  }

  const downloadPost = async (postData, statusContainerElement) => {
    const { parsedPost, getSettingsCB, postDownloadCallbacks } = postData;
    const { postId, postNumber } = parsedPost;
    const postSettings = getSettingsCB();

    statusContainerElement.replaceChildren();
    const { el: statusLabel, container } = ui.labels.status.createStatusLabel();
    const filePB = ui.pBars.createFileProgressBar();
    const totalPB = ui.pBars.createTotalProgressBar();
    statusContainerElement.append(totalPB, filePB, container);

    logs = logs.filter((l) => l.postId !== postId);
    log.separator(postId);
    log.post.info(postId, "::Preparing download::", postNumber);

    let completed = 0;
    const zip = new JSZip();

    h.ui.setText(statusLabel, "Resolving links...");
    let resolved = await resolvePostLinks(postData, statusLabel);

    if (postSettings.skipDuplicates) {
      resolved = h.unique(resolved, 'url');
    }

    let totalDownloadable = resolved.filter((r) => r.url).length;

    h.ui.setElProps(statusLabel, { color: "#67E8F9", fontWeight: "bold" });
    h.ui.setText(statusLabel, `Resolved ${totalDownloadable} unique links. Starting download...`);

    if (totalDownloadable === 0) {
      h.ui.setText(statusLabel, "No downloadable links found after resolution.");
      return;
    }

    setProcessing(true, postId);
    log.separator(postId);
    log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
    log.separator(postId);

    const threadTitle = parsers.thread.parseTitle();
    let customFilename = postSettings.output.find((o) => o.postId === postId)?.value;
    if (customFilename) {
      customFilename = customFilename.replace(/:title:/g, threadTitle).replace(/:#:/g, postNumber).replace(/:id:/g, postId);
    }

    const isFF = isFF;

    if (!postSettings.skipDownload) {
      const resources = resolved.filter((r) => r.url);
      const filenames = []; // To track filenames and avoid duplicates
      const downloadPromises = resources.map(({ url, host, original, folderName }) => new Promise(async (resolve) => {
        const ellipsedUrl = h.limit(url, 60);
        try {
          const response = await h.http.gm_promise({
            method: 'GET',
            url,
            headers: { Referer: original },
            responseType: "blob",
            onprogress: (e) => {
              h.ui.setText(statusLabel, `${completed}/${totalDownloadable} | ${h.prettyBytes(e.loaded)} / ${e.total ? h.prettyBytes(e.total) : '?'} | ${ellipsedUrl}`);
              if (e.total > 0) h.ui.setElProps(filePB, { width: `${(e.loaded / e.total) * 100}%` });
            }
          });

          let basename = h.generateFilename(url, response.responseHeaders);
          const originalBase = basename;
          let count = 2;
          while (filenames.includes(basename)) {
            const ext = h.ext(originalBase);
            basename = `${h.fnNoExt(originalBase)} (${count++})${ext ? '.' + ext : ''}`;
          }
          filenames.push(basename);

          let fn = basename;
          if (!postSettings.flatten && folderName) fn = `${folderName.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_')}/${basename}`;
          fn = fn.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_');

          if (isFF || postSettings.zipped) {
            zip.file(fn, response.response);
          } else {
            const blobUrl = URL.createObjectURL(response.response);
            GM_download({ url: blobUrl, name: `${threadTitle.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_')}/${fn}`, onload: () => URL.revokeObjectURL(blobUrl) });
          }
        } catch (error) {
          log.post.error(postId, `Failed to download ${url}: ${error}`, postNumber);
        } finally {
          completed++;
          h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
          resolve();
        }
      }));
      await Promise.all(downloadPromises);

    } else {
      log.post.info(postId, "::Skipping download as per settings::", postNumber);
    }

    h.ui.setText(statusLabel, "Finalizing package...");

    if (totalDownloadable > 0 && (postSettings.zipped || postSettings.generateLinks || postSettings.generateLog)) {
      let title = threadTitle.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_');
      const filename = customFilename || `${title} #${postNumber}.zip`;
      if (postSettings.generateLog) zip.file("log.txt", logs.filter((l) => l.postId === postId).map((l) => l.message).join("\n"));
      if (postSettings.generateLinks) zip.file("links.txt", resolved.filter((r) => r.url).map((r) => r.url).join("\n"));

      const zipFileCount = Object.keys(zip.files).length;
      if (zipFileCount > 0) {
        let blob = await zip.generateAsync({ type: "blob" });
        if (isFF || postSettings.zipped) {
          saveAs(blob, filename);
        } else if (!postSettings.zipped) { // for generated files when not zipping main download
          const blobUrl = URL.createObjectURL(blob);
          GM_download({ url: blobUrl, name: `${title}/#${postNumber}/generated.zip`, onload: () => URL.revokeObjectURL(blobUrl) });
        }
      }
    }

    setProcessing(false, postId);
    h.ui.setText(statusLabel, `Download for post #${postNumber} complete!`);
    h.ui.setElProps(statusLabel, { color: "#67E8F9" }); // Use setElProps to set style
    postDownloadCallbacks?.onComplete?.(totalDownloadable, completed);
  };

  const registerPostReaction = (postFooter) => {
    if (!postFooter) return;
    const hasReaction = postFooter.querySelector(".has-reaction");
    if (!hasReaction) {
      const reactionAnchor = postFooter.querySelector(".reaction--imageHidden");
      if (reactionAnchor) {
        reactionAnchor.setAttribute("href", reactionAnchor.getAttribute("href").replace("_id=1", "_id=33"));
        reactionAnchor.click();
      }
    }
  };

  async function cyberdrop_helper(file) {
    try {
      const response = await h.http.gm_promise({ method: "GET", url: file });
      if (response.status === 200) {
        const webData = JSON.parse(response.responseText);
        return webData.url;
      }
      return null;
    } catch (error) {
      console.log(`Failed to resolve ${file}: ${error}.`);
      return null;
    }
  }

  const init = {
    injectCustomStyles: () => {
      const style = document.createElement("style");
      style.textContent = styles.tippy.theme;
      document.head.appendChild(style);
    }
  };
  // ── HUD integration ──────────────────────────────────────────────────────
  // Psi2's float-button HUD is replaced by the shared LinkMaster dock: the
  // engine renders a "Forum" tab plus Check/Settings sections. Post detection
  // runs in every frame (Psi2 parity); the HUD itself stays top-frame only
  // (v5.x frame policy).
  let parsedPosts = [];

  function renderForumPanel(contentPanel) {
    if (parsedPosts.length === 0) {
      contentPanel.replaceChildren(hudEl("div", { class: "hud-status-text", style: "color:var(--text-secondary);padding:16px 0;" },
        "No posts with downloadable content found. Forum mode watches XenForo-style threads; switch to General Mode in Settings for a whole-page host inventory."));
      return;
    }
    contentPanel.replaceChildren(
      hudEl("div", { style: "display: flex; gap: 1em; align-items: center; margin-bottom: 1em; padding-bottom: 1em; border-bottom: 1.5px solid var(--accent-cyan-border-idle);" },
        hudEl("button", { id: "scrape-select-all", class: "hud-button" }, "Select All"),
        hudEl("button", { id: "scrape-select-none", class: "hud-button" }, "Select None"),
        hudEl("button", { id: "scrape-download-selected", class: "hud-btn active", style: "margin-left: auto;" }, "Download Selected")),
      hudEl("div", { id: "posts-container" }));
    const postsContainer = contentPanel.querySelector("#posts-container");

    parsedPosts.forEach((postData) => {
      const { parsedPost, parsedHosts, settings: localSettings } = postData;
      const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
      const totalDownloadable = () => parsedHosts.filter((h) => h.enabled).reduce((acc, h) => acc + h.resources.length, 0);
      const postEntryDiv = document.createElement("div");
      postEntryDiv.id = `hud-post-${parsedPost.postId}`;
      postEntryDiv.style.cssText = "border-bottom: 1.5px solid var(--accent-cyan-border-idle); padding: 1em 0.5em; margin-bottom: 1em;";
      const statusArea = hudEl("div", { id: `status-area-${parsedPost.postId}`, style: "margin-top: 0.8em;" });
      postEntryDiv.append(
        hudEl("div", { style: "display: flex; align-items: center; gap: 1em; margin-bottom: 0.8em;" },
          hudEl("input", { type: "checkbox", class: "scrape-post-select", "data-post-id": String(parsedPost.postId), style: "transform: scale(1.2);" }),
          hudEl("label", { style: "font-family: var(--font-hud); font-weight: 700; font-size: 1.1em;" },
            "Post ",
            hudEl("a", { href: `#post-${parsedPost.postId}`, style: "color: var(--text-cyan-active); text-decoration: none;" }, `#${parsedPost.postNumber}`)),
          hudEl("span", { class: "chip", style: "margin-left:auto;" }, `${totalResources} links`)),
        statusArea);

      const btnDownloadPost = document.createElement("button");
      btnDownloadPost.className = "hud-btn";
      btnDownloadPost.append(hudEl("span", null, `🡳 Configure & Download (${totalDownloadable()}/${totalResources})`));
      postEntryDiv.insertBefore(btnDownloadPost, statusArea);

      postsContainer.appendChild(postEntryDiv);

      // Attach hover-preview tooltip (lazy media thumbs per post)
      const postLink = postEntryDiv.querySelector(`a[href="#post-${parsedPost.postId}"]`);
      if (postLink) {
        const previewContent = document.createElement('div');
        previewContent.style.cssText = "display:flex; flex-wrap:wrap; gap:10px; padding:10px; max-width: 520px; max-height: 400px; overflow-y: auto; background: rgba(10,19,26,0.95); border-radius: 8px; border: 1px solid var(--accent-cyan-border-idle);";

        const generatePreviewContent = () => {
          if (previewContent.children.length === 0) { // Lazy populate
            const allResources = postData.parsedHosts.flatMap(h => h.resources);
            allResources.forEach(url => {
              const ext = h.ext(url);
              let elem = null;
              if (settings.extensions.image.includes(ext)) {
                elem = document.createElement('img');
                elem.loading = 'lazy';
                elem.style.cssText = "max-width:120px; max-height:120px; border:2px solid var(--accent-cyan-border-idle); border-radius:4px; object-fit:cover;";
              } else if (settings.extensions.video.includes(ext)) {
                elem = document.createElement('video');
                elem.controls = false;
                elem.muted = true;
                elem.autoplay = true;
                elem.loop = true;
                elem.style.cssText = "max-width:120px; max-height:120px; border:2px solid var(--accent-cyan-border-idle); border-radius:4px; object-fit:cover;";
              }
              if (elem) {
                elem.src = url;
                previewContent.appendChild(elem);
              }
            });
            if (previewContent.children.length === 0) {
              previewContent.replaceChildren(hudEl("span", { style: "color: var(--text-secondary);" }, "No image/video previews available."));
            }
          }
          return previewContent;
        };
        ui.tooltip(postLink, 'Loading previews...', {
          allowHTML: true,
          interactive: true,
          placement: 'right',
          onShow(instance) {
            instance.setContent(generatePreviewContent());
          },
          zIndex: 1000001, // Higher than HUD
        });
      }

      ui.forms.config.post.createPostConfigForm(parsedPost, parsedHosts, `#${parsedPost.postNumber}.zip`, localSettings,
        (data) => data.tippyInstance.hide(), totalDownloadable, btnDownloadPost);

      btnDownloadPost.addEventListener("click", (e) => {
        if (!e.target.closest(".tippy-box")) {
          const statusArea = h.element(`#status-area-${parsedPost.postId}`);
          downloadPost(postData, statusArea);
        }
      });
    });

    contentPanel.querySelector('#scrape-select-all').onclick = () => contentPanel.querySelectorAll('.scrape-post-select').forEach(cb => cb.checked = true);
    contentPanel.querySelector('#scrape-select-none').onclick = () => contentPanel.querySelectorAll('.scrape-post-select').forEach(cb => cb.checked = false);
    contentPanel.querySelector('#scrape-download-selected').onclick = async () => {
      const selected = [...contentPanel.querySelectorAll('.scrape-post-select:checked')];
      if (selected.length === 0) {
        showToast("No posts selected.");
        return;
      }
      showToast(`Starting batch download for ${selected.length} post(s).`);
      for (const cb of selected) {
        const postData = parsedPosts.find(p => p.parsedPost.postId === cb.dataset.postId);
        if (postData) await downloadPost(postData, h.element(`#status-area-${postData.parsedPost.postId}`));
      }
    };
  }

  function renderCheckSection(root) {
    const sec = document.createElement("div");
    sec.style.cssText = "margin-top:20px;padding-top:16px;border-top:1.5px solid var(--accent-cyan-border-idle);";
    const inner = hudEl("div", null,
      hudEl("h3", { style: "font-family:var(--font-hud);" }, "Deep-Resolved Link Check"),
      hudEl("div", { style: "margin-bottom: 1em; display:flex; gap:1em; align-items:center;" },
        hudEl("h4", { style: "font-family:var(--font-hud);color:var(--text-cyan-active);" }, "Check scraped posts (deep-resolved):"),
        hudEl("div", null,
          hudEl("button", { id: "check-select-all", class: "hud-button" }, "All"),
          hudEl("button", { id: "check-select-none", class: "hud-button" }, "None"))));
    if (parsedPosts.length > 0) {
      for (const p of parsedPosts) {
        inner.append(hudEl("label", { style: "display: block; margin-bottom:0.5em;" },
          hudEl("input", { type: "checkbox", class: "check-post-select", value: String(p.parsedPost.postId) }),
          ` Post #${p.parsedPost.postNumber}`));
      }
      inner.append(hudEl("button", { id: "check-scraped-btn", class: "hud-btn active" }, "Check Scraped Links"));
    } else {
      inner.append(hudEl("p", { class: "hud-status-text", style: "color:var(--text-secondary);" },
        "No posts scraped from page (Forum mode detects XenForo-style posts)."));
    }
    sec.append(inner, hudEl("div", { id: "check-results", style: "margin-top: 1.5em; word-break: break-all;" }));
    root.appendChild(sec);
    if (parsedPosts.length > 0) {
      sec.querySelector('#check-select-all').onclick = () => sec.querySelectorAll('.check-post-select').forEach(cb => cb.checked = true);
      sec.querySelector('#check-select-none').onclick = () => sec.querySelectorAll('.check-post-select').forEach(cb => cb.checked = false);
      sec.querySelector('#check-scraped-btn').onclick = startLinkCheck;
    }
  }

  async function startLinkCheck(event) {
    const resultsPanel = document.getElementById('check-results');
    resultsPanel.textContent = 'Resolving links...';
    let linksToCheck = [];
    const selected = [...document.querySelectorAll('.check-post-select:checked')];
    if (selected.length === 0) {
      resultsPanel.textContent = 'Please select at least one post.';
      return;
    }
    let resolvedLinks = [];
    for (const cb of selected) {
      const postData = parsedPosts.find(p => p.parsedPost.postId === cb.value);
      if (postData) resolvedLinks.push(...await resolvePostLinks(postData));
    }
    linksToCheck = h.unique(resolvedLinks, 'url').map(l => l.url);

    if (linksToCheck.length === 0) {
      resultsPanel.textContent = 'No links to check.';
      return;
    }
    resultsPanel.textContent = `Checking ${linksToCheck.length} unique links...`;

    const results = await Promise.all(linksToCheck.map(url => checkLinkStatus(url)));
    renderCheckResults(results);
  }

  async function checkLinkStatus(url) {
    try {
      const response = await h.http.gm_promise({ method: 'HEAD', url: url, headers: { 'Referer': window.location.origin } });
      const contentType = response.responseHeaders.match(/content-type:\s*(.*)/i)?.[1] || 'N/A';
      const contentLength = response.responseHeaders.match(/content-length:\s*(\d+)/i)?.[1];
      return { url, status: response.status, contentType, size: contentLength ? h.prettyBytes(Number(contentLength)) : 'N/A' };
    } catch (error) {
      return { url, status: 'Error', error: error.toString() };
    }
  }

  function renderCheckResults(results) {
    const resultsPanel = document.getElementById('check-results');
    const rows = [hudEl('h3', null, 'Check Complete')];
    results.forEach(res => {
      let chip;
      if (res.status === 'Error') chip = hudEl('span', { class: 'chip dead' }, 'Error');
      else if (res.status >= 200 && res.status < 300) chip = hudEl('span', { class: 'chip ok' }, `${res.status} OK`);
      else if (res.status >= 400) chip = hudEl('span', { class: 'chip dead' }, `${res.status} Error`);
      else chip = hudEl('span', { class: 'chip unknown' }, String(res.status));
      const details = res.status !== 'Error' ? ` | ${res.contentType} | ${res.size}` : '';
      rows.push(hudEl('div', { style: 'margin-bottom: 0.5em;' },
        chip, ' ',
        hudEl('a', { href: res.url, target: '_blank', style: 'color: var(--text-secondary);' }, h.limit(res.url, 80)),
        hudEl('span', { style: 'font-size: 0.9em; color: var(--text-secondary);' }, details)));
    });
    resultsPanel.replaceChildren(...rows);
  }

  function renderSettingsSection(root) {
    const sec = document.createElement("div");
    sec.style.cssText = "margin-top:20px;padding-top:16px;border-top:1.5px solid var(--accent-cyan-border-idle);";
    const passwordInputStyle = "width: 100%; background: #0A131A; border: 1.5px solid var(--accent-cyan-border-idle); color: var(--text-primary); padding: 0.5em; border-radius: 0.4em;";
    const checkRow = (id, checked, label) => hudEl("label", null,
      hudEl("input", { type: "checkbox", id, checked }), ` ${label}`);
    sec.append(
      hudEl("h3", { style: "font-family:var(--font-hud);color:var(--text-cyan-active);margin-bottom:0.8em;" }, "Forum Deep-Scrape Engine (Ψ2 lineage)"),
      hudEl("div", { style: "display: flex; flex-direction: column; gap: 1.5em;" },
        hudEl("div", null,
          hudEl("label", { style: "display:block; margin-bottom: 0.5em;" }, "Application Mode"),
          hudEl("select", { id: "app-mode", style: passwordInputStyle },
            hudEl("option", { value: "forum", selected: globalConfig.appMode === 'forum' }, "Forum Mode (Detects posts)"),
            hudEl("option", { value: "general", selected: globalConfig.appMode === 'general' }, "General Mode (Scrapes entire page)"))),
        hudEl("div", null,
          hudEl("label", { for: "gofile-token", style: "display:block; margin-bottom: 0.5em;" }, "GoFile Token (Optional)"),
          hudEl("input", { type: "password", id: "gofile-token", value: String(globalConfig.goFileToken), style: passwordInputStyle })),
        hudEl("div", { style: "display: grid; grid-template-columns: 1fr 1fr; gap: 1em;" },
          checkRow("setting-zipped", globalConfig.defaultZipped, "Default to Zipped"),
          checkRow("setting-flatten", globalConfig.defaultFlatten, "Default to Flatten"),
          checkRow("setting-gen-links", globalConfig.defaultGenerateLinks, "Default to Generate links.txt"),
          checkRow("setting-gen-log", globalConfig.defaultGenerateLog, "Default to Generate log.txt"),
          checkRow("setting-skip-dupes", globalConfig.defaultSkipDuplicates, "Default to Skip Duplicates")),
        hudEl("button", { id: "save-settings-btn", class: "hud-btn active" }, "Save Forum Settings & Reload")));
    root.appendChild(sec);
    sec.querySelector('#save-settings-btn').onclick = () => {
      globalConfig.appMode = sec.querySelector('#app-mode').value;
      globalConfig.goFileToken = sec.querySelector('#gofile-token').value.trim();
      globalConfig.defaultZipped = sec.querySelector('#setting-zipped').checked;
      globalConfig.defaultFlatten = sec.querySelector('#setting-flatten').checked;
      globalConfig.defaultGenerateLinks = sec.querySelector('#setting-gen-links').checked;
      globalConfig.defaultGenerateLog = sec.querySelector('#setting-gen-log').checked;
      globalConfig.defaultSkipDuplicates = sec.querySelector('#setting-skip-dupes').checked;
      saveSettings();
    };
  }

  function saveSettings() {
    GM_setValue('linkmaster_settings', JSON.stringify(globalConfig));
    showToast('Settings Saved! Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  }

  function loadSettings() {
    const saved = GM_getValue('linkmaster_settings', null);
    const defaults = {
      appMode: 'forum',
      goFileToken: '',
      defaultZipped: true,
      defaultFlatten: false,
      defaultGenerateLinks: false,
      defaultGenerateLog: false,
      defaultSkipDuplicates: true,
    };
    Object.assign(globalConfig, defaults, saved ? JSON.parse(saved) : {});
  }

  const processPost = (post) => {
    if (post.dataset.linkmasterProcessed) return false;
    post.dataset.linkmasterProcessed = "true";
    const parsedPost = parsers.thread.parsePost(post);
    if (!parsedPost) return false;
    const parsedHosts = parsers.hosts.parseHosts(parsedPost.content);
    if (!parsedHosts.length) return false;
    const localSettings = { ...globalConfig, zipped: globalConfig.defaultZipped, flatten: globalConfig.defaultFlatten, generateLinks: globalConfig.defaultGenerateLinks, generateLog: globalConfig.defaultGenerateLog, skipDuplicates: globalConfig.defaultSkipDuplicates, skipDownload: false, verifyBunkrLinks: false, output: [] };
    parsedPosts.push({
      parsedPost,
      parsedHosts,
      settings: localSettings,
      getSettingsCB: () => localSettings,
      enabledHostsCB: (hosts) => hosts.filter((h) => h.enabled),
      resolvers,
      postDownloadCallbacks: {
        onComplete: (total, completed) => {
          if (total > 0 && completed > 0 && parsedPost.footer) registerPostReaction(parsedPost.footer);
        }
      }
    });
    return true;
  };

  const boot = () => {
    loadSettings();
    init.injectCustomStyles();
    const begin = () => {
      if (globalConfig.appMode === 'forum') {
        const observer = new MutationObserver((mutations) => {
          let newPostsProcessed = false;
          mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                  const posts = node.querySelectorAll(".message-attribution-opposite");
                  posts.forEach((p) => {
                    if (processPost(p)) newPostsProcessed = true;
                  });
                  if (node.matches && node.matches(".message-attribution-opposite")) {
                    if (processPost(node)) newPostsProcessed = true;
                  }
                }
              });
            }
          });
          if (newPostsProcessed) {
            const hudPanel = document.getElementById("hud-panel-root");
            if (hudPanel && !hudPanel.hidden) {
              setHudTab(currentTab);
            }
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        let initialPostsFound = 0;
        document.querySelectorAll(".message-attribution-opposite").forEach((p) => {
          if (processPost(p)) initialPostsFound++;
        });
        if (initialPostsFound > 0) showToast(`${initialPostsFound} post(s) with media found!`);
      } else { // General Mode
        const allHosts = parsers.hosts.parseHosts(document.body.innerHTML);
        if (allHosts.length > 0) {
          const virtualPost = { postId: 'general-mode-post', postNumber: 'Page', content: document.body.innerHTML, spoilers: [] };
          const localSettings = { ...globalConfig, zipped: globalConfig.defaultZipped, flatten: globalConfig.defaultFlatten, generateLinks: globalConfig.defaultGenerateLinks, generateLog: globalConfig.defaultGenerateLog, skipDuplicates: globalConfig.defaultSkipDuplicates, skipDownload: false, verifyBunkrLinks: false, output: [] };
          parsedPosts.push({
            parsedPost: virtualPost,
            parsedHosts: allHosts,
            settings: localSettings,
            getSettingsCB: () => localSettings,
            enabledHostsCB: (hosts) => hosts.filter((h) => h.enabled),
            resolvers,
            postDownloadCallbacks: {}
          });
          showToast(`${allHosts.reduce((acc, h) => acc + h.resources.length, 0)} links found on page.`);
        }
      }
    };
    if (document.body) begin();
    else document.addEventListener('DOMContentLoaded', begin, { once: true });
    // Redgifs temporary token bootstrap (best-effort; resolver reads it lazily)
    h.http.get("https://api.redgifs.com/v2/auth/temporary").then(({ source }) => {
      if (h.contains("token", source)) GM_setValue("redgifs_token", JSON.parse(source).token);
    }).catch((e) => console.error("Error getting temporary redgifs auth token:", e));
    window.addEventListener("beforeunload", (e) => {
      if (processing.some((p) => p.processing)) {
        const message = "Downloads are in progress. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    });
  };

  return { boot, renderForumPanel, renderCheckSection, renderSettingsSection };
  })();

  ForumEngine.boot();

  AbsorbedPLR.init();
  AbsorbedGitRaw.init();

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
