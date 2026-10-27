// ==UserScript==
// @name         4ndr0tools - Confirmation Bypass
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.1.3
// @author       4ndr0666
// @description  Reveals forum invisi-text, view all replies, rewrite redirect links. Download Gate: bypass all confirmation pages on all sites, glass overlay copy/download URL (incl. vidara embeds on xcandid), auto-solve Altcha, auto-click download. Turbo: embed routing, upload injector. Util: external link safety, right-click scrollbar to top.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://forums.socialmediagirls.com/*
// @match        *://forums.socialmediagirls.com/goto/link-confirmation*
// @match        *://simpcity.cr/*
// @match        *://simpcity.cr/redirect/*
// @match        *://turbo.cr/*
// @match        *://turbo.cr/embed/*
// @match        *://*.xcandid.vip/*
// @match        *://*/*
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      socialmediagirls.com
// @connect      simpcity.cr
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Confirmation%20Bypass.user.js
// @license      MIT
// ==/UserScript==
// 4.1.3 (suite v1.16.0, WO-01 round 9): the reaction window's arming
// order (9a F01/F04). The 4.1.2 window armed AFTER the five-event dispatch
// loop — but dispatchEvent runs page click handlers SYNCHRONOUSLY, so a
// handler-side DOM touch (toast/progress appended outside the button: no
// btn-local class/label/aria change) committed inside the listener BEFORE
// the window opened was never recorded — pageReacted stayed false and the
// re-arm still double-dispatched at ~1.9 s for exactly the handler-side
// class the window was built to catch. The window now arms BEFORE the
// dispatch loop (our own data-cb4 write precedes it; synthetic events
// generate no records). The self-disconnect timer also closes over the
// observer INSTANCE it was created with (the shared variable would
// disconnect whatever observer is current when the timer fires — safe
// today only because click #2 postdates click #1's window, but any future
// overlapping window would disconnect the wrong observer early).
// 4.1.2 (suite v1.15.0, WO-01 round 8): the re-arm made node-true (8b
// F07/F16/F17/F08). The 4.1.1 idle-heuristics re-click was a reduction,
// not the claimed kill: a non-navigating download (Content-Disposition /
// fetch→blob) on a control that never swaps label/class/aria still passed
// every check and double-dispatched at ~1.9 s. The re-click now requires
// the SAME element we clicked (an SPA node-swap means the page REACTED to
// click #1 — a fresh node is a different control whose state we never
// observed; the old label comparison was safe-by-accident there) AND zero
// DOM reaction inside a 1.5 s observation window opened at click time (a
// page that mutated anything in response to the click had its handler
// fire — the re-arm exists ONLY for the silent handler-not-ready case).
// The anchored fallback tolerates trailing icon glyphs ('Download File ↓')
// — the prose false-positive fix had traded real recall. The pending
// attempt debounce is cleared at every observer disconnect (the 'observer
// disconnected' invariant briefly violated otherwise).
// 4.1.1 (suite v1.15.0, WO-01 round 7): the download-gate trigger's own
// audit pass (7b F16-F18). The boot-path observer hole: when the button was
// found ENABLED at boot the early return never armed the G6 observer — if
// the button re-disabled inside the grace window the comment 're-armed by
// the observer' was false in that path (nothing ever called attempt again —
// silent death, the exact class G6 was built to prevent); the observer now
// ALWAYS arms (the WeakSet makes re-attempts harmless). The re-arm
// double-dispatch: a Content-Disposition / <a download> / fetch→blob save
// NEVER changes location.href, so the 'href unchanged = handler not ready'
// heuristic fired click #2 on an already-downloading button — the re-click
// now requires the button to still look IDLE (not disabled, not aria-busy,
// no loading/spinner class, and an UNCHANGED label — a downloading control
// usually swaps its text or spins). The text fallback: the unanchored
// containment test matched footer prose like 'How to download files' and
// could pick an ad link ahead of the real control when #downloadBtn was
// absent — the label is now anchored short whole-text (≤40 chars), and the
// observer's attempt() is debounced 120 ms (every document mutation ran a
// full-document anchor-text sweep: countdown timers, spinners).
// 4.1.0 (suite v1.14.0, WO-01 round 6): turbo.cr landing download-gate sleep
// restored (2-b F03/F04) — the v3.6.2 G6 rework dropped the legacy 300 ms
// grace, so the boot-time click fired into a button whose async handler was
// not bound yet and the data-cb4-dl-clicked guard then suppressed every
// retry (the download never initiated). The trigger now schedules the click
// after a 300 ms grace (re-checking the disabled state inside the timeout),
// keeps the G6 armed observer, adds a 'download file' text fallback for
// #downloadBtn markup drift, and re-arms once if the page has not navigated
// 1.6 s after the click (a handler that was not ready can swallow click #1).
// 4.0.4 (suite v1.12.0, WO-01 round 4): banner-truth sync — the BETA-era
// 'Unified Pipeline v3.6.2 — SECURED' duplicate boot line removed (two
// identities in one console since promotion; 4-c F04); the v4.0.4 suite
// banner at boot is the single identity.
// 4.0.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Confirmation Bypass v4.1.3 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px');


/* ═══ SUITE PROMOTION 4.0.0 ═══════════════════════════════════════════
 * Confirmation Bypass BETA v3.6.2 promoted: GUP v5.3 stepwise gap mitigation over v3.6.1 (Set-based rel handling superset, xcandid overlay init fix).
 * Retired duplicate: 4ndr0tools - Confirmation Bypass.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

    /* ══════════════════════════════════════════════════════════════════════════════
       v3.6.2 — GUP v5.3 stepwise gap mitigation (silent superset audit)
       G1  restored the xcandid.vip / vidara.to overlay module lost from the
           v3.6.1 working copy (initializeXcandidOverlay + orchestrator
           dispatch + @match line) — a validated feature may never silently
           vanish between revisions (superset protocol).
       G2  convertLinks: literal backspace (U+0008) in the URL regex replaced
           with the intended \b word boundary — URL hyperlinking in the View
           Replies table was silently dead.
       G3  redirect rewrite: decoded/plain ?to= targets are validated as
           http/https before being written into link.href (javascript: and
           other schemes are rejected — stored-XSS vector closed).
       G5  /redirect/ landing bypass now also observes late-rendered
           .simpLinkProxy-targetLink nodes (async/SPA pages) instead of
           probing once at boot.
       G6  download trigger observes the #downloadBtn disabled attribute and
           dispatches only on an enabled button (the old fixed 300 ms grace
           click fired while the Altcha proof-of-work was still running and
           never re-attempted).
       G7  View Replies / upload-button / redirect-rewrite observers
           debounced (120 ms) — this script matches all sites, so busy SPAs
           no longer pay a querySelectorAll per mutation burst.
       G8  robustCopy ignores re-clicks while a copy cycle is in flight (the
           double-click race used to leave a permanent 'COPIED' overlay).
       G9  @connect socialmediagirls.com + simpcity.cr added for the
           GM_xmlhttpRequest search fetch (Tampermonkey no longer prompts).
       ══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    const currentUrl  = window.location.href;
    const currentHost = window.location.hostname;
    const params      = new URLSearchParams(window.location.search);
    const _overlaidUrls = new Set();

    // v4.0.4 (WO-01 round 4, 4-c F04): the legacy 'Unified Pipeline v3.6.2 —
    // SECURED' boot line that used to live here was removed — the suite
    // banner above is the script's single boot identity.

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Global_Styles ] — Electric-Glass Design Spec v1.5.0-Ψ
    // Selectors prefixed cb4- to prevent host-site bleed (§4 §2).
    // Tokens on :root with cb4-- prefix — unique enough not to clash.
    // ══════════════════════════════════════════════════════════════════════════
    GM_addStyle(`

        :root {
            --cb4-bg-dark-base:   #050A0F;
            --cb4-bg-glass-panel: rgba(10, 19, 26, 0.25);
            --cb4-accent-cyan:    #00E5FF;
            --cb4-text-active:    #67E8F9;
            --cb4-border-idle:    rgba(0, 229, 255, 0.2);
            --cb4-border-hover:   rgba(0, 229, 255, 0.5);
            --cb4-bg-hover:       rgba(0, 229, 255, 0.05);
            --cb4-bg-active:      rgba(0, 229, 255, 0.2);
            --cb4-glow:           rgba(0, 229, 255, 0.4);
            --cb4-shadow-base:    0 8px 32px 0 rgba(0, 0, 0, 0.37);
            --cb4-shadow-glow:    0 8px 32px 0 rgba(0, 229, 255, 0.15);
            --cb4-edge-top:       rgba(255, 255, 255, 0.1);
            --cb4-edge-left:      rgba(255, 255, 255, 0.1);
            --cb4-text-primary:   #67E8F9;
            --cb4-text-secondary: rgba(0,229,255,0.7);
            --cb4-font-body:      'JetBrains Mono', monospace;
        }

        /* ── URL CONTEXT OVERLAY — Glass Engine §2 ──────────────────────── */
        .cb4-url-overlay {
            position:              absolute;
            top:                   12px;
            right:                 12px;
            background:            var(--cb4-bg-glass-panel);
            backdrop-filter:       blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border:                1px solid var(--cb4-border-idle);
            border-top:            1px solid var(--cb4-edge-top);
            border-left:           1px solid var(--cb4-edge-left);
            box-shadow:            var(--cb4-shadow-base), var(--cb4-shadow-glow);
            border-radius:         6px;
            color:                 var(--cb4-accent-cyan);
            font-size:             11px;
            font-family:           var(--cb4-font-body);
            padding:               10px 14px;
            z-index:               2147483647;
            cursor:                pointer;
            user-select:           none;
            max-width:             440px;
            word-break:            break-all;
            transition:            all 150ms ease-in-out;
        }

        /* Fallback: no backdrop-filter support §4 §1 */
        @supports not (backdrop-filter: blur(1px)) {
            .cb4-url-overlay { background: rgba(10, 19, 26, 0.95); }
        }

        .cb4-url-overlay:hover {
            color:        var(--cb4-bg-dark-base);
            background:   var(--cb4-accent-cyan);
            border-color: var(--cb4-accent-cyan);
            box-shadow:   0 0 25px var(--cb4-glow);
            transform:    translateY(-2px);
        }

        .cb4-copy-hint {
            display:        block;
            font-size:      8px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            opacity:        0.7;
            margin-top:     6px;
            padding-top:    4px;
            border-top:     1px solid var(--cb4-border-idle);
        }

        /* ── UPLOAD BUTTON — Interactive Topology §3 ─────────────────────── */
        #67E8F9-upload-btn {
            display:         inline-flex;
            align-items:     center;
            justify-content: center;
            padding:         0.5rem 1rem;
            font-family:     var(--cb4-font-body);
            font-size:       0.875rem;
            font-weight:     500;
            letter-spacing:  0.05em;
            text-transform:  uppercase;
            cursor:          pointer;
            color:           var(--cb4-text-secondary);
            background:      rgba(0, 0, 0, 0.3);
            border:          1px solid transparent;
            border-radius:   6px;
            transition:      all 150ms ease-in-out;
            text-decoration: none;
        }
        #67E8F9-upload-btn:hover {
            color:            var(--cb4-accent-cyan);
            border-color:     var(--cb4-border-hover);
            background-color: var(--cb4-bg-hover);
        }
        #67E8F9-upload-btn:active {
            color:            var(--cb4-text-active);
            background-color: var(--cb4-bg-active);
            border-color:     var(--cb4-accent-cyan);
            box-shadow:       0 0 15px var(--cb4-glow);
        }
        #67E8F9-upload-btn:focus-visible {
            outline:        2px solid var(--cb4-accent-cyan);
            outline-offset: 2px;
        }


        /* ── INVISIBLE TEXT REVEALER ─────────────────────────────────────── */
        span[style*="Transparent"],
        span[style*="transparent"],
        span[style*="TRANSPARENT"] {
            border:     1px dotted #00E5FF !important;
            background: #000000 !important;
        }
        span[style*="Transparent"]:hover,
        span[style*="transparent"]:hover,
        span[style*="TRANSPARENT"]:hover {
            color: #00E5FF !important;
        }

        /* ── VIEW REPLIES ────────────────────────────────────────────────── */
        .cb4-replies-btn {
            margin-top:       10px;
            cursor:           pointer;
            padding:          5px 10px;
            border:           1px solid var(--cb4-border-idle);
            background:       var(--cb4-bg-glass-panel);
            backdrop-filter:  blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color:            var(--cb4-accent-cyan);
            border-radius:    6px;
            font-family:      var(--cb4-font-body);
            font-size:        0.8rem;
            letter-spacing:   0.05em;
            text-transform:   uppercase;
            transition:       all 150ms ease-in-out;
        }
        .cb4-replies-btn:hover {
            background-color: var(--cb4-bg-hover);
            border-color:     var(--cb4-border-hover);
            color:            var(--cb4-accent-cyan);
        }
        .cb4-replies-container {
            margin-top:  10px;
            border:      1px solid var(--cb4-border-idle);
            border-top:  1px solid var(--cb4-edge-top);
            border-left: 1px solid var(--cb4-edge-left);
            padding:     10px;
            background:  var(--cb4-bg-glass-panel);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 6px;
            box-shadow:  var(--cb4-shadow-base), var(--cb4-shadow-glow);
        }
        @supports not (backdrop-filter: blur(1px)) {
            .cb4-replies-container { background: rgba(10, 19, 26, 0.95); }
        }
        .cb4-replies-loading-dots::after {
            display:   inline-block;
            animation: cb4-ellipsis 1.25s infinite;
            content:   ".";
            width:     1em;
            text-align: left;
        }
        @keyframes cb4-ellipsis {
            0%  { content: ".";   }
            33% { content: "..";  }
            66% { content: "..."; }
        }
        .cb4-replies-table {
            width:           100%;
            border-collapse: collapse;
            margin-top:      10px;
            font-family:     var(--cb4-font-body);
            font-size:       0.8rem;
            color:           var(--cb4-text-primary);
        }
        .cb4-replies-table th,
        .cb4-replies-table td {
            padding: 8px;
            border:  1px solid var(--cb4-border-idle);
            text-align: left;
        }
        .cb4-replies-table th {
            background:  var(--cb4-bg-active);
            color:       var(--cb4-accent-cyan);
            text-align:  center;
            font-weight: bold;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .cb4-replies-table tr:nth-child(even) td {
            background: rgba(0, 229, 255, 0.03);
        }
        .cb4-replies-table td:nth-child(1),
        .cb4-replies-table td:nth-child(2) {
            text-align:  center;
            white-space: nowrap;
        }
        .cb4-replies-table th:nth-child(1),
        .cb4-replies-table th:nth-child(2) { width: 12%; }
        .cb4-replies-table th:nth-child(3)  { width: 76%; text-align: left; }
        .cb4-replies-table a               { color: var(--cb4-accent-cyan); }
        .cb4-replies-table a:hover         { text-decoration: underline; }
        /* ── ALTCHA PROCESSING INDICATOR §3 active ───────────────────────── */
        .cb4-altcha-processing .altcha-checkbox input[type="checkbox"] {
            outline:        2px solid var(--cb4-accent-cyan) !important;
            outline-offset: 2px !important;
            box-shadow:     0 0 8px var(--cb4-glow) !important;
            transition:     all 150ms ease-in-out !important;
        }
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Robust_Copy ]
    // Source: A (primary) + C onFailure path cherry-picked.
    // Saves innerHTML+color+border+background+shadow; restores all on timeout.
    // legacyCopy: try/catch/finally with execCommand return-value check.
    // ══════════════════════════════════════════════════════════════════════════
    function robustCopy(text, overlayEl) {
        // G8 (v3.6.2): a second click inside the restore window used to
        // capture the transient 'COPIED' state as the “original” and
        // restore it forever. Ignore re-clicks while a cycle is in flight.
        if (overlayEl.dataset.cb4Copying === '1') return;
        overlayEl.dataset.cb4Copying = '1';
        /* v4.0.3 (suite v1.4.3 TT class fix): capture the live child NODES
         * (cloned) instead of an innerHTML string — restoring via
         * innerHTML is a TrustedHTML sink under enforcement, and the
         * node-clone snapshot is strictly more faithful (attribute
         * exactness preserved; no re-parse round-trip). */
        const originalNodes = Array.from(overlayEl.childNodes).map((n) => n.cloneNode(true));
        const originalColor  = overlayEl.style.color;
        const originalBorder = overlayEl.style.borderColor;
        const originalBg     = overlayEl.style.background;
        const originalShadow = overlayEl.style.boxShadow;

        const restore = () => {
            overlayEl.replaceChildren(...originalNodes);
            overlayEl.style.color      = originalColor;
            overlayEl.style.borderColor = originalBorder;
            overlayEl.style.background  = originalBg;
            overlayEl.style.boxShadow   = originalShadow;
            delete overlayEl.dataset.cb4Copying;
        };

        const onSuccess = () => {
            overlayEl.textContent       = 'COPIED TO CLIPBOARD ✓';
            // Literal values — var() is inert on inline style
            overlayEl.style.color       = '#67E8F9';
            overlayEl.style.borderColor = '#00E5FF';
            overlayEl.style.background  = 'rgba(0, 229, 255, 0.2)';
            overlayEl.style.boxShadow   = '0 0 15px rgba(0, 229, 255, 0.4)';
            setTimeout(restore, 1400);
            console.log(`[4ndr0tools] Payload buffered: ${text}`);
        };

        // Cherry-picked from C: explicit failure feedback
        const onFailure = (err) => {
            overlayEl.textContent = 'COPY FAILED ✗';
            overlayEl.style.color = '#ff0055';
            setTimeout(restore, 1500);
            console.error('[4ndr0tools] Copy failed:', err);
        };

        const legacyCopy = () => {
            const ta = Object.assign(document.createElement('textarea'), { value: text });
            Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px', opacity: '0' });
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                // Cherry-picked from C: check return value
                if (document.execCommand('copy')) { onSuccess(); }
                else { onFailure(new Error('execCommand returned false')); }
            } catch (err) {
                onFailure(err);
            } finally {
                ta.remove();
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(legacyCopy);
        } else {
            legacyCopy();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Confirmation_Bypass ]
    // Source: A canonical. MutationObserver + static pre-check + dispatchEvent.
    // B's plain btn.click() dropped (less faithful to real user interaction).
    // C's setInterval polling dropped (§4.6 LBYL fail).
    // ══════════════════════════════════════════════════════════════════════════
    function initializeConfirmationBypass() {
        const SELECTOR = '.button--cta, .button--cta .button-text, .simpLinkProxy-continue';

        const triggerExecution = (element) => {
            if (!element) return false;
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            console.log('[4ndr0tools] Gateway validation signal bypassed.');
            return true;
        };

        const staticCheck = document.querySelector(SELECTOR);
        if (staticCheck && triggerExecution(staticCheck)) return;

        const observer = new MutationObserver((_, obs) => {
            const targetNode = document.querySelector(SELECTOR);
            if (targetNode && triggerExecution(targetNode)) { obs.disconnect(); }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Turbo_Redirect ]
    // Source: A canonical. Matches /v/, /d/, and bare IDs. bypass=0 guard kept.
    // B's narrowed regex (dropped /d/) is a regression — kept A's.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeTurboRedirect() {
        if (params.get('bypass') === '0') {
            console.log('[4ndr0tools] Direct diagnostic land verified. Redirection bypassed.');
            return;
        }
        const path    = window.location.pathname;
        const idMatch = path.match(/^\/(?:v\/|d\/)?([\w-]+)$/);
        if (idMatch && idMatch[1] && !path.startsWith('/embed/')) {
            window.location.replace(`https://turbo.cr/embed/${idMatch[1]}`);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Attach_Overlay ]
    // Source: A canonical. stopImmediatePropagation on click kept (B dropped it).
    // ══════════════════════════════════════════════════════════════════════════
    function attachOverlay(videoEl, url, ttl = 20000) {
        if (!url || _overlaidUrls.has(url)) return;
        _overlaidUrls.add(url);

        const el = document.createElement('div');
        el.className = 'cb4-url-overlay';

        // url is sourced from video/iframe .src — potentially attacker-
        // controlled if the host page is compromised. Build with textContent
        // instead of interpolating into innerHTML to prevent DOM XSS.
        const displayUrl = url.length > 60 ? url.substring(0, 57) + '...' : url;
        const urlText  = document.createTextNode(displayUrl);
        const hint     = document.createElement('span');
        hint.className = 'cb4-copy-hint';
        hint.textContent = 'Click: Copy URL \u2502 Right-Click: Download';

        el.appendChild(urlText);
        el.appendChild(hint);
        el.title = url;

        el.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            robustCopy(url, el);
        });

        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (currentHost.includes('turbo.cr')) {
                const idMatch = window.location.pathname.match(/^\/(?:v\/|d\/|embed\/)?([\w-]+)$/);
                if (idMatch && idMatch[1]) {
                    window.open(`https://turbo.cr/d/${idMatch[1]}?bypass=0`, '_blank');
                    return;
                }
            }
            const dlUrlFallback = url.replace('/embed/', '/d/').split('?')[0] + '?bypass=0';
            window.open(dlUrlFallback, '_blank');
        });

        let container = videoEl.parentElement;
        while (container && getComputedStyle(container).position === 'static') {
            container = container.parentElement;
        }
        if (!container) container = document.body;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        container.appendChild(el);

        if (ttl > 0) {
            setTimeout(() => { el.remove(); _overlaidUrls.delete(url); }, ttl);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Turbo_Embed_Scan ]
    // Source: A canonical. Static pre-check before observer (B dropped this).
    // Observer disconnects on match (B leaked indefinitely).
    // ══════════════════════════════════════════════════════════════════════════
    function addVideoUrlOverlay() {
        const staticTarget = document.querySelector('#main-video');
        if (staticTarget && staticTarget.src) {
            attachOverlay(staticTarget, staticTarget.src, 0);
            return;
        }
        const obs = new MutationObserver((_, observerInstance) => {
            const video = document.querySelector('#main-video');
            if (video && video.src) {
                attachOverlay(video, video.src, 0);
                observerInstance.disconnect();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Xcandid_Scan ]
    // Source: A canonical. Null-guard on sourceUrl kept (B dropped it).
    // C's double-setTimeout warm-up not carried: MutationObserver + initial
    // scan() call is sufficient and cleaner.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeXcandidOverlay() {
        const scanTargets = () => {
            document.querySelectorAll('iframe[src*="vidara.to"], video[src*="vidara.to"], source[src*="vidara.to"]')
                .forEach(el => {
                    const sourceUrl = el.src || el.getAttribute('src');
                    if (sourceUrl) attachOverlay(el, sourceUrl, 20000);
                });
        };
        let scanTargetsTimer;
        const obs = new MutationObserver(() => {
            // v1.5.1 observer discipline: coalesced re-scan — same idempotent
            // overlay attach, bounded to one pass per 150 ms of DOM churn.
            clearTimeout(scanTargetsTimer);
            scanTargetsTimer = setTimeout(scanTargets, 150);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        scanTargets();
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Altcha_Solver ]
    // Source: A canonical — verbatim from the provided reference implementation.
    // CONFIG.lockAttr kept as data-cb4-lock (namespaced).
    // cb4-altcha-processing class adds Electric-Glass glow during solve.
    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Altcha_Solver ]
    // Source: A canonical — verbatim from the provided reference implementation.
    // CONFIG.lockAttr kept as data-cb4-lock (namespaced).
    // cb4-altcha-processing class adds Electric-Glass glow during solve.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeAltchaSolver() {
        const CONFIG = {
            debounceMs: 50,
            lockoutMs:  3000,
            lockAttr:   'data-cb4-lock',
        };

        function interactWithCaptcha(container, checkbox) {
            const label         = container.querySelector(`label[for="${checkbox.id}"]`);
            const targetElement = label || checkbox;

            container.classList.add('cb4-altcha-processing');
            checkbox.setAttribute(CONFIG.lockAttr, 'true');
            console.log('[4ndr0tools] Solving Altcha...');

            targetElement.focus();

            // view: window throws in GM sandboxes — the sandbox proxy is not a
            // real Window and WebIDL rejects it. Resolve the page's actual
            // Window via the element's ownerDocument.defaultView (null is valid).
            const view = targetElement.ownerDocument?.defaultView ?? null;
            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
                targetElement.dispatchEvent(new MouseEvent(eventType, {
                    view, bubbles: true, cancelable: true, buttons: 1,
                }));
            });

            if (!checkbox.checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('input',  { bubbles: true }));
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }

            setTimeout(() => {
                if (checkbox.hasAttribute(CONFIG.lockAttr)) {
                    checkbox.removeAttribute(CONFIG.lockAttr);
                }
                container.classList.remove('cb4-altcha-processing');
            }, CONFIG.lockoutMs);
        }

        function scanAndSolve() {
            try {
                document.querySelectorAll('.altcha[data-state="unverified"]').forEach(container => {
                    const checkbox = container.querySelector('.altcha-checkbox input[type="checkbox"]');
                    if (checkbox && !checkbox.hasAttribute(CONFIG.lockAttr)) {
                        interactWithCaptcha(container, checkbox);
                    }
                });
            } catch (error) {
                console.error('[4ndr0tools] Altcha scan error:', error);
            }
        }

        let debounceTimer;
        const observer = new MutationObserver(() => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(scanAndSolve, CONFIG.debounceMs);
        });

        const targetNode = document.body || document.documentElement;
        if (targetNode) {
            observer.observe(targetNode, {
                childList:       true,
                subtree:         true,
                attributes:      true,
                attributeFilter: ['data-state'],
            });
        }

        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });

        scanAndSolve();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Forum_Enhancements ]
    // Source: A DOM construction + cleanup (retained).
    // Cherry-picked from C: tabindex="-1", role="button", title attr for ARIA;
    // __cb4OpenUpload namespace (avoids collision); index-safe fr-element access;
    // postMessage listener torn down in beforeunload.
    // B's insertAdjacentHTML string approach dropped (no ARIA, no cleanup).
    // ══════════════════════════════════════════════════════════════════════════
    function initializeForumEnhancements() {
        // G7 (v3.6.2): debounced like the other hot observers.
        let btnTimer;
        const btnObs = new MutationObserver(() => {
            clearTimeout(btnTimer);
            btnTimer = setTimeout(() => {
            const group = document.querySelector('.formButtonGroup-extra');
            if (group && !document.getElementById('cb4-upload-btn')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'formButtonGroup';

                const btn = document.createElement('button');
                btn.id        = 'cb4-upload-btn';
                btn.type      = 'button';
                btn.tabIndex  = -1;
                btn.setAttribute('role',  'button');
                btn.setAttribute('title', 'Upload videos to turbo.cr');
                btn.setAttribute('aria-label', 'Upload video via Turbo');
                btn.className = 'button--link button button--icon button--icon--upload';
                btn.textContent = 'Upload Video';
                btn.addEventListener('click', () => window.__cb4OpenUpload?.());

                wrapper.appendChild(btn);
                group.appendChild(wrapper);
                btnObs.disconnect();
            }
            }, 120);
        });
        btnObs.observe(document.documentElement, { childList: true, subtree: true });

        // Cherry-picked from C: namespaced global, resizeBy for better UX
        window.__cb4OpenUpload = () => {
            const features = 'screenX=0,screenY=0,top=0,left=0,scrollbars,width=100,height=100';
            const win = window.open('https://turbo.cr/upload/api', 'turboUpload', features);
            if (win) win.resizeBy(400, 600);
            window.__turboUploadWin = win;
        };

        // Exact-hostname allowlist — startsWith('https://turbo.cr') would also
        // match an attacker origin like https://turbo.cr.evil.com. Parse the
        // origin and compare the real hostname instead.
        const ALLOWED_MESSAGE_HOSTS = new Set(['turbo.cr']);

        const receivePostMessage = (e) => {
            let originHost;
            try {
                originHost = new URL(e.origin).hostname;
            } catch {
                return; // unparseable origin — reject
            }
            if (!ALLOWED_MESSAGE_HOSTS.has(originHost)) return;

            if (String(e.data).includes('close')) {
                window.__turboUploadWin?.close();
                return;
            }
            // Cherry-picked from C: index-safe access (frElements[0], boxes[0])
            const frElements = document.getElementsByClassName('fr-element');
            if (frElements.length === 0) return;

            // e.data is cross-origin postMessage input — never trusted as HTML.
            const bb       = `[MEDIA=saint_vid]${e.data}[/MEDIA]`;
            const wrappers = document.getElementsByClassName('fr-wrapper');

            if (wrappers.length > 0 && wrappers[0].style.display === 'none') {
                const boxes = document.querySelectorAll('[aria-label="Rich text box"]');
                if (boxes.length > 0) boxes[0].value += bb; // textarea .value — not parsed as HTML
            } else {
                // Build the node and assign textContent instead of parsing bb
                // as HTML — BBCode is plain text and must never be interpreted
                // as markup, regardless of what e.data contains.
                const p = document.createElement('p');
                p.textContent = bb;
                frElements[0].appendChild(p);
            }
            console.log(`[4ndr0tools] Media payload embedded: ${e.data}`);
        };

        window.addEventListener('message', receivePostMessage);
        window.addEventListener('beforeunload', () => {
            btnObs.disconnect();
            window.removeEventListener('message', receivePostMessage);
        }, { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_External_Link_Safety ]
    // Source: A Set-based rel handling (superset of B's string assignment).
    // Cherry-picked from C: try/catch around new URL() parse to silently
    // ignore javascript:, data:, and other non-parseable href schemes.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeExternalLinkSafety() {
        const internalOrigin = location.origin;

        const secureLink = (e) => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            try {
                const dest = new URL(a.href, location.href);
                if (dest.origin === internalOrigin) return;
            } catch {
                return; // silently ignore javascript:, data:, etc.
            }
            a.target = '_blank';
            const relSet = new Set((a.rel || '').split(/\s+/).filter(Boolean));
            relSet.add('noopener');
            relSet.add('noreferrer');
            a.rel = [...relSet].join(' ');
        };

        document.body.addEventListener('click', secureLink, true);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Scrollbar_Top ] — NEW in v3.5.0
    // Source: right-click snippet, verbatim logic.
    // Detects right-click on scrollbar track via clientX vs innerWidth heuristic.
    // HTML tag → page top; nested element tag → element top; BODY → ignored.
    // Suppresses context menu only when scrollbar is the target.
    // ══════════════════════════════════════════════════════════════════════════
    function getScrollBarWidth() {
        const div = document.createElement('div');
        Object.assign(div.style, {
            overflow:   'scroll',
            visibility: 'hidden',
            width:      '100px',
            height:     '100px',
        });
        document.body.appendChild(div);

        const innerDiv = document.createElement('div');
        Object.assign(innerDiv.style, { width: '100%', height: '100%' });
        div.appendChild(innerDiv);

        const width = div.offsetWidth - innerDiv.offsetWidth;
        div.parentNode.removeChild(div);
        return width;
    }

    function initializeScrollbarContextMenu() {
        const scrollBarWidth = getScrollBarWidth() || 15;

        document.addEventListener('contextmenu', (e) => {
            const isScrollbar = e.clientX > window.innerWidth - scrollBarWidth - 10;
            if (!isScrollbar) return;

            if (e.target.tagName === 'HTML') {
                window.scrollTo(0, 0);
            } else if (e.target.tagName !== 'BODY') {
                e.target.scrollTo(0, 0);
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Download_Trigger ]
    // Fires after Altcha resolves on the turbo.cr download landing page.
    // Watches for #downloadBtn (or a 'download file' labelled control, for
    // markup drift) to appear — it may render after the captcha state
    // change — then clicks it programmatically.
    // Uses ownerDocument.defaultView for the MouseEvent view to avoid the
    // GM sandbox proxy rejection (same fix as U_Altcha_Solver).
    // G6 (v3.6.2): the watcher observes the button's disabled attribute and
    // dispatches only on an ENABLED button; the data-cb4-dl-clicked guard
    // keeps the click idempotent.
    // 4.1.0 (round 6, 2-b F03/F04): the legacy 300 ms grace is RESTORED as a
    // superset of both eras — the click is scheduled after the grace (with
    // the disabled state re-checked inside the timeout) so the page can
    // bind its async handler and re-enable the button after the Altcha PoW
    // resolves; the G6 armed observer is kept for absent/born-disabled
    // buttons; and if the page has not navigated REARM_MS after the click,
    // the trigger re-arms exactly once (a handler that was not ready in
    // time can swallow click #1 — MAX_CLICKS bounds the loop).
    // ══════════════════════════════════════════════════════════════════════════
    function initializeDownloadTrigger() {
        const SELECTOR  = '#downloadBtn';
        /* v4.1.1 (7b F18): anchored short whole-text — the unanchored
         * containment test matched footer/help prose ('How to download
         * files') and could pick an ad link ahead of the real control.
         * v4.1.2 (8b F08): 'file\b[\s\W]*$' tolerates trailing icon glyphs
         * ('Download File ↓', 'Download file…') — word characters still end
         * the match, so prose tails ('…file and more') stay excluded. */
        const TEXT_FALLBACK = /^\s*download\s+(the\s+)?file\b[\s\W]*$/i;
        const GRACE_MS  = 300;  // legacy v3.5.2 grace — restored 4.1.0 (2-b F03)
        const REARM_MS  = 1600; // swallow window before the single re-arm
        const MAX_CLICKS = 2;

        const landingHref = window.location.href;
        const scheduled = new WeakSet();
        let clicks = 0;
        let obs = null;
        let rearmLabel = ''; // 7b F17: the label at click time — a busy control usually swaps it
        let clickedNode = null; // 8b F07/F16: element identity of click #1
        let pageReacted = false; // 8b F07: any DOM mutation since click #1
        let reactionObs = null; // 8b F07: the 1.5 s reaction window observer
        let attemptDebounce = null; // 8b F18: 120 ms coalescer (hoisted for the disconnect cleanup)

        const findButton = () => {
            const btn = document.querySelector(SELECTOR);
            if (btn) return btn;
            // Markup drift fallback: any SHORT-labelled 'download file' control
            // (v4.1.1 7b F18: long-text elements are prose, not controls).
            for (const el of document.querySelectorAll('button, a[role="button"], a')) {
                const label = (el.textContent || '').trim();
                if (label.length <= 40 && TEXT_FALLBACK.test(label)) return el;
            }
            return null;
        };

        const clickDownload = (btn) => {
            if (btn.hasAttribute('data-cb4-dl-clicked')) return true;
            if (btn.disabled) return false; // captcha still solving — stay armed
            btn.setAttribute('data-cb4-dl-clicked', 'true');
            clicks += 1;
            clickedNode = btn; // 8b F07/F16: identity, not visual state
            rearmLabel = (btn.textContent || '').trim(); // 7b F17: label at click time
            console.log('[4ndr0tools] Download button triggered.');
            const view = btn.ownerDocument?.defaultView ?? null;
            /* v4.1.3 (9a F01): the reaction window arms BEFORE the dispatch
             * loop — dispatchEvent runs page click handlers SYNCHRONOUSLY,
             * and handler-side DOM mutations (a toast/progress node appended
             * outside the button: no btn-local class/label/aria change)
             * committed inside the listener were invisible to a window armed
             * after the loop, leaving pageReacted false and the re-arm
             * double-dispatching exactly the handler-side-touch class the
             * window exists to catch. Our own attribute write happened
             * before this line, and synthetic event dispatch generates no
             * records of its own — only page-code reactions land here. */
            pageReacted = false;
            try {
                reactionObs = new MutationObserver(() => { pageReacted = true; });
                /* 9a F04: the self-disconnect timer closes over THIS instance —
                 * the shared variable would disconnect whatever observer is
                 * current when the timer fires (safe today only because
                 * click #2 postdates click #1's window; any future overlapping
                 * window would disconnect the wrong observer early). */
                const ro = reactionObs;
                reactionObs.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
                window.setTimeout(() => {
                    ro.disconnect();
                    if (reactionObs === ro) reactionObs = null;
                }, REARM_MS - 100);
            } catch (reactionError) {
                console.debug('[4ndr0tools] reaction window unavailable:', reactionError && reactionError.message);
            }
            ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
                btn.dispatchEvent(new MouseEvent(type, {
                    view, bubbles: true, cancelable: true, buttons: 1,
                }));
            });
            /* v4.1.2 (8b F07): the reaction window — any DOM mutation within
             * 1.5 s of the click proves the page's handler fired (attribute
             * flips, label swaps, handler-side DOM touches: spinners, progress
             * elements, gating UI). The re-arm exists ONLY for the silent
             * handler-not-ready case, so a reacted page suppresses click #2
             * even when the button looks idle. Conservative by design:
             * unrelated churn (an ad rotor) suppressing one re-click trades
             * toward the LEGACY single-click behavior — the duplicate-download
             * direction is the regression. */
            return true;
        };

        // The swallow guard: if the click landed but the page never started
        // navigating, the handler was not ready — clear the guard and allow
        // exactly one re-click (MAX_CLICKS bounds the loop).
        const scheduleRearm = () => {
            window.setTimeout(() => {
                if (window.location.href === landingHref) {
                    const btn = findButton();
                    /* v4.1.2 (8b F07/F16): node identity + the reaction window
                     * — the visual-state heuristics alone still double-dispatched
                     * on a label-static non-navigating download (the 4.1.0 re-arm
                     * regression class), and an SPA node-swap made them
                     * accidentally-safe (the stale rearmLabel comparison could
                     * only read 'changed'). The re-click requires the SAME node
                     * we clicked AND zero page reaction since. */
                    if (btn && btn === clickedNode && !pageReacted && !btn.disabled) {
                        /* v4.1.1 (7b F17): a Content-Disposition / <a download>
                         * / fetch→blob save NEVER changes location.href — the
                         * old re-arm treated that as 'handler not ready' and
                         * double-dispatched a second download. The re-click
                         * now requires the button to still look IDLE: not
                         * aria-busy, no loading/spinner class, and an
                         * UNCHANGED label (a downloading control usually
                         * swaps its text or spins). */
                        const busy = btn.getAttribute('aria-busy') === 'true'
                            || /\b(loading|spinner|busy|progress)\b/i.test(String(btn.className || ''))
                            || (btn.textContent || '').trim() !== rearmLabel;
                        if (busy) return;
                        btn.removeAttribute('data-cb4-dl-clicked');
                        window.setTimeout(() => { clickDownload(btn); }, GRACE_MS);
                    }
                }
            }, REARM_MS);
        };

        const attempt = () => {
            const btn = findButton();
            if (!btn) return false;
            if (btn.disabled) return false; // G6: stay armed for the flip
            if (scheduled.has(btn)) return false;
            scheduled.add(btn);
            // The restored grace sleep: dispatch after GRACE_MS so the
            // page's own async handler binding and captcha re-enable land
            // first — the legacy behavior the G6 rework dropped.
            window.setTimeout(() => {
                if (clickDownload(btn)) {
                    if (obs) obs.disconnect();
                    /* v4.1.2 (8b F17): the pending coalescer dies with the
                     * observer — a scheduled attempt firing up to 120 ms
                     * after disconnect briefly violated the invariant. */
                    if (attemptDebounce) { window.clearTimeout(attemptDebounce); attemptDebounce = null; }
                    if (clicks < MAX_CLICKS) scheduleRearm();
                } else {
                    scheduled.delete(btn); // disabled at grace time — the ALWAYS-armed observer below re-attempts (7b F16)
                }
            }, GRACE_MS);
            return true;
        };

        /* v4.1.1 (7b F16): the observer ALWAYS arms — the old early return
         * (button found enabled at boot) left the G6 observer disarmed, and
         * a button re-disabled inside the grace window died silently (the
         * 're-armed by the observer' comment was false in that path). The
         * WeakSet makes re-attempts harmless while a grace is pending. */
        attempt();

        // Button may not exist yet — and may be born disabled: watch for
        // both its insertion and its disabled-attribute flip.
        /* v4.1.1 (7b F18): debounced — every document mutation ran a
         * full-document anchor-text sweep (countdown timers, spinners); the
         * 120 ms coalescer matches the suite's observer idiom. (Hoisted at
         * v4.1.2 so the disconnect cleanups can clear it — 8b F17.) */
        obs = new MutationObserver(() => {
            if (attemptDebounce) return;
            attemptDebounce = window.setTimeout(() => {
                attemptDebounce = null;
                attempt();
            }, 120);
        });
        obs.observe(document.documentElement, {
            childList:       true,
            subtree:         true,
            attributes:      true,
            attributeFilter: ['disabled'],
        });
        window.addEventListener('beforeunload', () => {
            if (obs) obs.disconnect();
            if (attemptDebounce) { window.clearTimeout(attemptDebounce); attemptDebounce = null; } // 8b F17
            if (reactionObs) { reactionObs.disconnect(); reactionObs = null; } // 8b F07
        }, { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Invis_Text ]
    // Reveals forum posts that hide spoiler/answer text by setting color to
    // Transparent. CSS handles the reveal on hover; this unit is pure style
    // (no JS needed beyond the GM_addStyle block above). Unit kept as a
    // named placeholder so it appears in the manifest and can be toggled.
    // ══════════════════════════════════════════════════════════════════════════
    // (Implemented entirely in U_Global_Styles — no runtime JS required.)

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_View_Replies ]
    // Injects a "View Replies" button under each XenForo post. On click,
    // fetches the search endpoint for posts quoting/replying to this post,
    // parses results, and renders them in a glass-panel table inline.
    // Toggle hides/shows without re-fetching. Uses GM_xmlhttpRequest to
    // bypass same-origin restrictions on the search API.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeViewReplies() {
        const BUTTON_TEXT_VIEW = 'View Replies';
        const BUTTON_TEXT_HIDE = 'Hide Replies';
        const LOADING_TEXT     = 'Loading replies';
        /* v4.0.3: the reply view renders through createElement (TT sink
         * class fix); the two HTML-string constants it used are gone. */
        const strongEl = (text, color) => {
            const el = document.createElement('strong');
            if (color) el.style.color = color;
            el.textContent = text;
            return el;
        };

        const mainDomain = window.location.hostname.split('.').slice(-2).join('.');

        const extractThreadId = (href) => {
            const m = href?.match(/\.([0-9]+)\/post-/);
            return m ? m[1] : null;
        };

        // Safe text → anchor conversion (no raw-HTML injection).
        // G2 (v3.6.2): the pattern originally contained a literal backspace
        // (U+0008) where \b was intended — URLs could never match.
        // v4.0.3 (suite v1.4.3): builder form — text segments and anchors
        // are appended as nodes, so no HTML string is ever assembled and
        // href goes through the property (entity round-trips are gone).
        const appendLinks = (host, text) => {
            if (!text) return;
            const URL_RE = /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
            let last = 0, m;
            while ((m = URL_RE.exec(text)) !== null) {
                if (m.index > last) host.appendChild(document.createTextNode(text.slice(last, m.index)));
                const a = document.createElement('a');
                a.href = m[0];
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = m[0];
                host.appendChild(a);
                last = m.index + m[0].length;
            }
            if (last < text.length) host.appendChild(document.createTextNode(text.slice(last)));
        };

        const showError = (container, msg) => {
            container.replaceChildren(strongEl('Error:', '#ff0055'), document.createTextNode(` ${msg}`));
            delete container.dataset.loading;
        };

        /* v4.0.2 (suite v1.4.2 TT class fix): parseFromString is a Trusted
         * Types sink under require-trusted-types-for 'script'. Mint an
         * identity policy where the host allows it; raw fallback otherwise
         * (the answer-parse call below is inside onload — a TT throw would
         * strand the loading state, hence the wrap). */
        const TTwrap = (() => {
            let policy = null, tried = false;
            return (s) => {
                if (!tried) {
                    tried = true;
                    try {
                        const TT = window.trustedTypes;
                        if (TT && typeof TT.createPolicy === 'function')
                            policy = TT.createPolicy('4ndr0666tools#cbp', { createHTML: (v) => v });
                    } catch (e) { policy = null; }
                }
                return policy ? policy.createHTML(s) : s;
            };
        })();

        const fetchReplies = (searchURL, container) => {
            GM_xmlhttpRequest({
                method:  'GET',
                url:     searchURL,
                timeout: 15000,
                onload: (res) => {
                    delete container.dataset.loading;
                    if (res.status < 200 || res.status >= 300) {
                        showError(container, `Status ${res.status}`);
                        return;
                    }
                    const doc = new DOMParser().parseFromString(TTwrap(res.responseText), 'text/html');
                    const blocks = doc.querySelectorAll(
                        'li.block-row.block-row--separated.js-inlineModContainer[data-author]'
                    );
                    if (!blocks.length) { container.replaceChildren(strongEl('No replies found.')); return; }

                    container.replaceChildren();
                    const table = document.createElement('table');
                    table.className = 'cb4-replies-table';
                    const thead = document.createElement('thead');
                    const headRow = document.createElement('tr');
                    for (const h of ['Post #', 'Date', 'Reply']) {
                        const th = document.createElement('th');
                        th.textContent = h;
                        headRow.appendChild(th);
                    }
                    thead.appendChild(headRow);
                    table.appendChild(thead);
                    const tbody   = document.createElement('tbody');
                    const frag    = document.createDocumentFragment();

                    blocks.forEach(block => {
                        const postLink   = block.querySelector('.contentRow-main a[href*="/post-"]');
                        const postTime   = block.querySelector('time.u-dt');
                        const snippet    = block.querySelector('.contentRow-snippet');
                        if (!postLink?.href || !postTime || !snippet) return;

                        const idMatch = postLink.href.match(/\/post-(\d+)/);
                        const postNum = idMatch ? `#${idMatch[1]}` : 'N/A';

                        const row = document.createElement('tr');

                        const tdNum = document.createElement('td');
                        const a = document.createElement('a');
                        a.href = postLink.href; a.textContent = postNum;
                        a.target = '_blank'; a.rel = 'noopener noreferrer';
                        tdNum.appendChild(a);

                        const tdDate = document.createElement('td');
                        tdDate.textContent = postTime.textContent.trim();
                        tdDate.title = postTime.getAttribute('datetime') || '';

                        const tdContent = document.createElement('td');
                        appendLinks(tdContent, snippet.textContent.trim());

                        row.append(tdNum, tdDate, tdContent);
                        frag.appendChild(row);
                    });

                    tbody.appendChild(frag);
                    table.appendChild(tbody);
                    container.appendChild(table);
                },
                onerror:   () => showError(container, 'Network error.'),
                ontimeout: () => showError(container, 'Request timed out.'),
            });
        };

        const addReplyButton = (postEl) => {
            const anchor = postEl.querySelector('.message-main.js-quickEditTarget') || postEl;
            if (!anchor || anchor.querySelector('.cb4-replies-btn')) return;

            const btn = document.createElement('button');
            btn.textContent = BUTTON_TEXT_VIEW;
            btn.className   = 'cb4-replies-btn';
            anchor.appendChild(btn);

            btn.addEventListener('click', () => {
                let box = postEl.querySelector('.cb4-replies-container');
                if (box) {
                    const hidden = box.style.display === 'none';
                    box.style.display   = hidden ? 'block' : 'none';
                    btn.textContent     = hidden ? BUTTON_TEXT_HIDE : BUTTON_TEXT_VIEW;
                    return;
                }

                // Build loading container
                box = document.createElement('div');
                box.className       = 'cb4-replies-container';
                box.dataset.loading = 'true';
                const spinner = document.createElement('strong');
                spinner.textContent = LOADING_TEXT;
                spinner.className   = 'cb4-replies-loading-dots';
                box.appendChild(spinner);
                anchor.appendChild(box);
                btn.textContent = BUTTON_TEXT_HIDE;

                // Resolve post ID
                const msgEl  = postEl.closest('.message[data-content]');
                const postId = msgEl?.getAttribute('data-content')?.replace('post-', '')
                            || postEl.querySelector('[data-lb-id]')?.getAttribute('data-lb-id')?.replace('post-', '');
                if (!postId) { showError(box, 'Could not determine Post ID.'); btn.textContent = BUTTON_TEXT_VIEW; return; }

                // Resolve thread ID
                const hrefEl   = postEl.querySelector('.message-attribution-main a[href*="/threads/"]');
                const threadId = extractThreadId(hrefEl?.getAttribute('href'));
                if (!threadId) { showError(box, 'Could not determine Thread ID.'); btn.textContent = BUTTON_TEXT_VIEW; return; }

                const searchURL = `https://${mainDomain}/search/1/?q=post-${postId}&t=post&c[thread]=${threadId}&o=date`;
                fetchReplies(searchURL, box);
            });
        };

        // Initial pass + observer for dynamically loaded posts
        const processPosts = () =>
            document.querySelectorAll('.message.message--post .message-inner').forEach(addReplyButton);

        processPosts();

        // G7 (v3.6.2): this script matches every site (@match *) — debounce
        // the subtree observer so busy SPAs don't pay a querySelectorAll
        // per mutation burst (same pattern as U_Altcha_Solver's debounceMs).
        let postsTimer;
        const obs = new MutationObserver(() => {
            clearTimeout(postsTimer);
            postsTimer = setTimeout(processPosts, 120);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Redirect_Rewrite ]
    // Two complementary redirect-bypass strategies for simpcity.cr:
    //
    // 1. INLINE REWRITE — Intercepts anchor elements whose href contains
    //    /redirect/?to= before the user clicks them. Decodes base64 (m=b64)
    //    or plain-text targets and rewrites the href directly, removing proxy
    //    handler attributes. MutationObserver picks up lazily-rendered links.
    //
    // 2. LANDING PAGE BYPASS — If the user lands on a /redirect/ page directly
    //    (e.g. opened in a new tab), extracts the true destination from
    //    .simpLinkProxy-targetLink and replaces the current location.
    //
    // Note: the existing U_Confirmation_Bypass handles /goto/link-confirmation
    // pages by clicking the CTA button. This unit handles a different class of
    // redirect (the ?to= query-string pattern) and is additive, not redundant.
    // ══════════════════════════════════════════════════════════════════════════
    function initializeRedirectRewrite() {
        // Strategy 2: already on a /redirect/ landing page
        if (currentUrl.includes('/redirect/')) {
            const attemptLandingBypass = () => {
                const target = document.querySelector('.simpLinkProxy-targetLink');
                if (target?.href) {
                    window.location.replace(target.href);
                    return true; // navigation imminent
                }
                return false;
            };
            if (attemptLandingBypass()) {
                return; // navigation imminent; no point setting up observer
            }
            // G5 (v3.6.2): the target often renders after us (async/SPA)
            // — watch for it instead of probing once at boot.
            const landingObs = new MutationObserver((_, oi) => {
                if (attemptLandingBypass()) oi.disconnect();
            });
            landingObs.observe(document.documentElement, { childList: true, subtree: true });
            window.addEventListener('beforeunload', () => landingObs.disconnect(), { once: true });
        }

        // Strategy 1: rewrite ?to= links inline
        const decodeTarget = (str) => {
            try {
                return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
            } catch {
                return null;
            }
        };

        // G3 (v3.6.2): only http/https targets may be written into link.href.
        // A crafted ?to= / m=b64 payload decoding to javascript: (or any
        // other scheme) must never reach link.href — stored-XSS vector.
        const isSafeHttpTarget = (str) => {
            try {
                const u = new URL(str);
                return u.protocol === 'https:' || u.protocol === 'http:';
            } catch {
                return false;
            }
        };

        const processLinks = () => {
            document.querySelectorAll('a[href*="/redirect/?to="]:not([data-cb4-bypassed])').forEach(link => {
                link.dataset.cb4Bypassed = 'true';
                try {
                    const url    = new URL(link.href, window.location.origin);
                    let target   = url.searchParams.get('to');
                    const mode   = url.searchParams.get('m');
                    if (target && mode === 'b64') target = decodeTarget(target);
                    if (target && !isSafeHttpTarget(target)) target = null;
                    if (target) {
                        link.href = target;
                        link.removeAttribute('data-proxy-handler');
                        link.removeAttribute('data-blank-handler');
                        link.removeAttribute('data-proxy-href');
                    }
                } catch { console.debug('CB interceptor: unbound'); /* silently ignore unparseable hrefs */ }
            });
        };

        // G7 (v3.6.2): debounced like the other hot observers.
        let linksTimer;
        const obs = new MutationObserver(() => {
            clearTimeout(linksTimer);
            linksTimer = setTimeout(processLinks, 120);
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processLinks);
        } else {
            processLinks();
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Orchestrator ]
    // Altcha runs only where captchas can actually appear:
    //   - confirmation/redirect pages (before bypass fires)
    //   - turbo.cr download landing (bypass=0, opened via right-click)
    //   - forum pages (login/registration flows)
    // Scrollbar right-click-to-top runs on every matched page unconditionally.
    // ══════════════════════════════════════════════════════════════════════════
    function orchestrate() {
        // Scrollbar context-menu is UI utility — runs everywhere
        initializeScrollbarContextMenu();

        // ── Confirmation / redirect gate ──────────────────────────────────────
        if (currentUrl.includes('/goto/link-confirmation') || currentUrl.includes('/redirect')) {
            initializeRedirectRewrite(); // handles /redirect/?to= landing-page bypass
            initializeAltchaSolver();
            initializeConfirmationBypass();
            return;
        }

        // ── turbo.cr ──────────────────────────────────────────────────────────
        if (currentHost.includes('turbo.cr')) {
            if (currentUrl.includes('/embed/')) {
                // Embed player: overlay shows URL; right-click opens download landing
                addVideoUrlOverlay();
            } else if (params.get('bypass') === '0') {
                // Download landing (opened via right-click on overlay).
                // Altcha solves first; once it resolves the download button
                // appears/enables and U_Download_Trigger clicks it.
                initializeAltchaSolver();
                initializeDownloadTrigger();
            } else {
                // All other turbo.cr paths → canonical redirect to /embed/
                initializeTurboRedirect();
            }
            return;
        }

        // ── xcandid.vip ──────────────────────────────────────────────────────
        if (currentHost.includes('xcandid.vip')) {
            initializeXcandidOverlay();
            return;
        }

        // ── Forum pages (SMG / Simpcity) ──────────────────────────────────────
        initializeRedirectRewrite();
        initializeViewReplies();
        initializeAltchaSolver();
        initializeForumEnhancements();
        initializeExternalLinkSafety();
    }

    orchestrate();

})();
