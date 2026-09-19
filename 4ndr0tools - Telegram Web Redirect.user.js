// ==UserScript==
// @name         4ndr0tools - Telegram Web Redirect
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @author       4ndr0666
// @description  Injects an "Open in Web" button on t.me preview pages linking directly to Telegram Web (web.telegram.org). Hides the desktop-only preview link.
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://t.me/*
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Telegram%20Web%20Redirect.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Telegram%20Web%20Redirect.user.js
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    console.log('%c[4ndr0tools] Telegram Web Redirect v1.0.0', 'color:#00E5FF; font-family:"Roboto Mono",monospace; font-weight:bold;');

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Global_Styles ] — Electric-Glass Design Spec v1.5.0-Ψ
    // Scoped to .tg4- prefix to isolate from t.me host styles.
    // ══════════════════════════════════════════════════════════════════════════
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500&display=swap');

        :root {
            --tg4-accent-cyan:   #00E5FF;
            --tg4-text-active:   #67E8F9;
            --tg4-border-idle:   rgba(0, 229, 255, 0.2);
            --tg4-border-hover:  rgba(0, 229, 255, 0.5);
            --tg4-bg-glass:      rgba(10, 19, 26, 0.25);
            --tg4-bg-hover:      rgba(0, 229, 255, 0.05);
            --tg4-bg-active:     rgba(0, 229, 255, 0.2);
            --tg4-glow:          rgba(0, 229, 255, 0.4);
            --tg4-shadow-base:   0 8px 32px 0 rgba(0, 0, 0, 0.37);
            --tg4-shadow-glow:   0 8px 32px 0 rgba(0, 229, 255, 0.15);
            --tg4-edge-top:      rgba(255, 255, 255, 0.1);
            --tg4-edge-left:     rgba(255, 255, 255, 0.1);
            --tg4-text-secondary:#9E9E9E;
            --tg4-font-body:     'Roboto Mono', monospace;
        }

        /* ── WEB BUTTON — Glass Engine §2 + Interactive Topology §3 ─────── */
        .tg4-web-action {
            margin-top: 12px;
        }

        .tg4-web-btn {
            display:         inline-flex;
            align-items:     center;
            justify-content: center;
            padding:         0.55rem 1.4rem;
            gap:             8px;

            font-family:     var(--tg4-font-body);
            font-size:       0.875rem;
            font-weight:     500;
            letter-spacing:  0.05em;
            text-transform:  uppercase;
            text-decoration: none;
            cursor:          pointer;

            /* Glass core */
            background:      var(--tg4-bg-glass);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);

            /* Borders + edge lighting */
            border:          1px solid var(--tg4-border-idle);
            border-top:      1px solid var(--tg4-edge-top);
            border-left:     1px solid var(--tg4-edge-left);
            border-radius:   6px;

            /* Shadow */
            box-shadow:      var(--tg4-shadow-base), var(--tg4-shadow-glow);

            /* Typography */
            color:           var(--tg4-text-secondary);

            transition:      all 300ms ease-in-out;
        }

        @supports not (backdrop-filter: blur(1px)) {
            .tg4-web-btn { background: rgba(10, 19, 26, 0.92); }
        }

        .tg4-web-btn:hover {
            color:            var(--tg4-accent-cyan);
            border-color:     var(--tg4-border-hover);
            background-color: var(--tg4-bg-hover);
            box-shadow:       0 0 15px var(--tg4-glow),
                              var(--tg4-shadow-base);
        }

        .tg4-web-btn:active {
            color:            var(--tg4-text-active);
            background-color: var(--tg4-bg-active);
            border-color:     var(--tg4-accent-cyan);
            box-shadow:       0 0 20px var(--tg4-glow);
        }

        .tg4-web-btn:focus-visible {
            outline:        2px solid var(--tg4-accent-cyan);
            outline-offset: 2px;
        }

        /* Inline SVG icon inherits color */
        .tg4-web-btn svg {
            width:           16px;
            height:          16px;
            flex-shrink:     0;
            stroke:          currentColor;
            fill:            none;
            stroke-width:    1.75;
            stroke-linecap:  round;
            stroke-linejoin: round;
        }
    `);

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Channel_Id ]
    // Extracts the channel slug or invite hash from a t.me URL.
    // Handles three t.me URL shapes:
    //   t.me/channelname          → "channelname"
    //   t.me/s/channelname        → "channelname"  (preview path)
    //   t.me/+InviteHash          → "+InviteHash"  (invite link)
    // Also unwraps URLs that arrive double-encoded inside a search-engine
    // redirect query string (decodeURIComponent before matching).
    // Returns null if no valid slug is found — caller exits cleanly.
    // ══════════════════════════════════════════════════════════════════════════
    function getChannelId(url) {
        let decoded;
        try {
            decoded = decodeURIComponent(url);
        } catch {
            // Malformed percent-encoding (stray '%' in double-wrapped redirect)
            // — fall back to the raw string rather than aborting.
            decoded = url;
        }
        const m = decoded.match(/t\.me\/(?:s\/)?(\+?[^&?/]+)/);
        return m ? m[1] : null;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Web_Button ]
    // Injects the "Open in Web" Glass button after the existing desktop CTA.
    //
    // Bug fixed vs source: the original used encodeURIComponent(channelId) in
    // the href fragment. Fragment content (#...) is never percent-decoded by
    // Telegram Web's router — encoding '+' to '%2B' breaks invite-link routing.
    // Plain channel names are safe unencoded in a fragment too.
    // Solution: pass channelId as-is after the '#@' anchor.
    // ══════════════════════════════════════════════════════════════════════════
    function injectWebButton(channelId) {
        const desktopCta = document.querySelector('.tgme_page_action');
        if (!desktopCta) return;

        // Guard: don't inject twice
        if (document.querySelector('.tg4-web-action')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'tgme_page_action tg4-web-action';

        const link = document.createElement('a');
        link.className = 'tg4-web-btn';
        // Fragment is not sent to the server; no encoding needed.
        // Invite links start with '+'; plain slugs start with '@'.
        const anchor = channelId.startsWith('+')
            ? `https://web.telegram.org/a/#${channelId}`
            : `https://web.telegram.org/a/#@${channelId}`;
        link.href   = anchor;
        link.target = '_blank';
        link.rel    = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Open channel in Telegram Web');

        // Inline SVG — external globe icon (§4 §3: vector, currentColor)
        link.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 3 C9 7 9 17 12 21 M12 3 C15 7 15 17 12 21"/>
                <path d="M3 12 h18"/>
                <path d="M4.5 7.5 h15 M4.5 16.5 h15"/>
            </svg>
            <span>Open in Web</span>`;

        wrapper.appendChild(link);
        desktopCta.insertAdjacentElement('afterend', wrapper);
        console.log(`[4ndr0tools] Web button injected for: ${channelId}`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Preview_Hide ]
    // Hides the .tgme_page_context_link_wrap element (the "View in Telegram"
    // banner that only works with the desktop client installed).
    // ══════════════════════════════════════════════════════════════════════════
    function hidePreviewBanner() {
        const banner = document.querySelector('.tgme_page_context_link_wrap');
        if (banner) banner.style.display = 'none';
    }

    // ══════════════════════════════════════════════════════════════════════════
    // [ U_Orchestrator ]
    // ══════════════════════════════════════════════════════════════════════════
    function orchestrate() {
        const channelId = getChannelId(window.location.href);
        if (!channelId) {
            console.log('[4ndr0tools] No channel ID found — exiting.');
            return;
        }

        // Elements may not be in the DOM yet at document-idle on slow pages;
        // try immediately then fall back to a single MutationObserver pass.
        const tryInject = () => {
            const ready = !!document.querySelector('.tgme_page_action');
            if (ready) {
                injectWebButton(channelId);
                hidePreviewBanner();
                return true;
            }
            return false;
        };

        if (tryInject()) return;

        const obs = new MutationObserver((_, observerInstance) => {
            if (tryInject()) observerInstance.disconnect();
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => obs.disconnect(), { once: true });
    }

    orchestrate();

})();
