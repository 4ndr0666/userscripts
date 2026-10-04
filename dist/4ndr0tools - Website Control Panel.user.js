// ==UserScript==
// @name         4ndr0tools - Website Control Panel
// @namespace    https://github.com/4ndr0666/userscripts
// @description  Draggable Cyberdeck HUD, DOM Zapper, Ad suppression, validated-selector compiled deep-cleaning, per-site HUD suppression + Alt+Shift+H hotkey.
// @version      5.3.0
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Website%20Control%20Panel.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Website%20Control%20Panel.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

/* ═══ v5.3.0 — HUD SOVEREIGNTY PASS (suite v1.3.0) ═════════════════════
 * The v5.2 HUD was welded onto every page with no way to dismiss it short
 * of disabling the whole script. This pass gives the operator HUD
 * sovereignty:
 *   W1  × (close) and – (collapse) controls on the headerbar; Alt+Shift+H
 *       toggles the HUD from any page (collision-checked across the suite:
 *       Recon=R, MAM=S, YTPM=U/S/X — H was free); GM menu commands for
 *       show/hide and per-site suppression.
 *   W2  PER-SITE SUPPRESSION: "Hide HUD on this site" persists the hostname
 *       — banking, webmail, printing views stay clean while the zapper and
 *       cleaners keep working everywhere else (and re-arm the moment the
 *       menu command is used again on that site).
 *   W3  OFF-SCREEN CLAMP: saved drag coordinates are clamped into the live
 *       viewport on load — a panel dragged away on a big monitor (or before
 *       a window resize) used to become permanently unreachable.
 *   W4  Remote Google-Fonts @import REMOVED: it phoned fonts.googleapis.com
 *       from every page on the internet (OPSEC noise + CSP-blockable) and
 *       violated the 3lectric-Glass local-stack doctrine the rest of the
 *       suite follows (Bunkr++ v7.4 made remote fonts opt-in for exactly
 *       this reason). Local monospace stack only.
 *   W5  Boot banner is opt-in via localStorage psi_wcp_debug (was an
 *       unconditional console.log on every page); version string drift
 *       (log said 5.1.0 while shipping 5.2.0) fixed — banner now derives
 *       from one constant.
 *   W6  Drag uses Pointer Events (touch + pen + mouse) and ESC disarms the
 *       DOM Zapper in addition to right-click.
 * Every v5.2 feature (validated-selector compilation, five cleaners,
 * zapper, position memory) is intact — this is a strict superset.
 * ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const WCP_VERSION = '5.3.0';
  const DEBUG = (() => { try { return localStorage.getItem('psi_wcp_debug') === '1'; } catch (e) { return false; } })();
  const dbg = (...args) => { if (DEBUG) console.log('%c[4NDR0666OS] WCP v' + WCP_VERSION, 'color:#00E5FF;font-family:monospace;font-weight:bold;', ...args); };
  dbg('CYBERDECK HUD INITIATING');

  // ==========================================
  // MODULE 1: ELECTRIC-GLASS AESTHETICS & STATE
  // ==========================================
  // v5.3 (W4): remote font @import removed — local spec stack only.
  GM_addStyle(`
    :root {
      --bg-dark: rgba(10, 19, 26, 0.95); --accent-cyan: #00E5FF; --text-cyan-active: #67E8F9;
      --accent-cyan-bg-active: rgba(0, 229, 255, 0.15); --accent-cyan-glow-active: rgba(0, 229, 255, 0.4);
      --text-secondary: rgba(0,229,255,0.7);
      --font-body: "JetBrains Mono", "Cascadia Mono", "Fira Code", Consolas, "Roboto Mono", monospace;
      --zapper-red: #FF0055;
      --a4-transition: all 150ms ease-in-out;
    }

    #psi-control-panel {
      position: fixed; z-index: 9999999; background: var(--bg-dark);
      backdrop-filter: blur(8px); border: 1px solid var(--accent-cyan); border-radius: 8px; padding: 12px;
      box-shadow: 0 8px 32px rgba(0, 229, 255, 0.2); font-family: var(--font-body); color: var(--text-cyan-active);
      width: 150px; user-select: none; transition: var(--a4-transition);
    }
    #psi-control-panel.hidden { display: none; }

    #psi-cp-header {
      font-size: 0.75rem; color: var(--accent-cyan); padding-bottom: 8px; border-bottom: 1px solid rgba(0, 229, 255, 0.3);
      margin-bottom: 8px; cursor: grab; text-align: center; font-weight: bold; letter-spacing: 1px;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    #psi-cp-header:active { cursor: grabbing; }
    #psi-cp-header.dragging { cursor: grabbing; }

    .hud-button {
      display: flex; justify-content: center; align-items: center; width: 100%; padding: 6px;
      border: 1px solid transparent; font-family: var(--font-body); font-weight: bold; font-size: 0.75rem;
      text-transform: uppercase; color: var(--text-secondary); background-color: rgba(0,0,0,0.4);
      cursor: pointer; transition: var(--a4-transition); margin-bottom: 6px; border-radius: 4px;
    }
    .hud-button:last-child { margin-bottom: 0; }
    .hud-button:hover { color: var(--accent-cyan); border-color: rgba(0, 229, 255, 0.5); }
    .hud-button.active {
      color: #000; background-color: var(--accent-cyan);
      border-color: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan-glow-active);
    }

    /* Headerbar mini-controls (W1) */
    .cp-mini {
      border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
      font-family: var(--font-body); font-size: 0.8rem; font-weight: bold; line-height: 1;
      padding: 0 2px; transition: var(--a4-transition);
    }
    .cp-mini:hover { color: var(--accent-cyan); }
    #psi-cp-close:hover { color: var(--zapper-red); }

    /* Zapper Button specific styles */
    #toggle-zapper.active { background-color: var(--zapper-red); border-color: var(--zapper-red); color: #fff; box-shadow: 0 0 10px rgba(255, 0, 85, 0.6); }

    /* DOM Zapper Mode Styles */
    body.psi-zapper-mode * { cursor: crosshair !important; }
    .psi-zapper-target { outline: 2px dashed var(--zapper-red) !important; outline-offset: -2px !important; background-color: rgba(255, 0, 85, 0.1) !important; }
  `);

  // ==========================================
  // MODULE 2: VALIDATED SELECTOR COMPILATION
  // ------------------------------------------
  // GOLDEN-UNIT FIX (v4 -> v5 §3 regression repair):
  // A single comma-joined querySelectorAll() call is O(1) at the native/C++
  // layer, but it is all-or-nothing: ONE invalid selector in the joined
  // string throws a DOMException for the ENTIRE batch, silently zeroing out
  // every other (valid) selector in that call. v4 avoided this by iterating
  // selectors one-by-one with a try/catch per selector -- safe, but O(n)
  // discrete native calls.
  //
  // compileSelectorList() gets both properties: it validates each candidate
  // selector exactly ONCE (at init, via a cheap matches() probe), drops any
  // that throw, logs what was dropped, and joins only the survivors into one
  // batchable string. Steady-state operation is still a single native call
  // per pass; a malformed selector degrades gracefully instead of nuking the
  // whole feature.
  // ==========================================
  const compileSelectorList = (rawSelectors, label) => {
    const valid = [];
    const dropped = [];
    for (const sel of rawSelectors) {
      try {
        // matches() against a throwaway element validates CSS grammar
        // without requiring the selector to match anything real.
        document.documentElement.matches(sel);
        valid.push(sel);
      } catch (e) {
        dropped.push(sel);
      }
    }
    if (dropped.length > 0) {
      console.warn(`[Ψ-4NDR0666] ${label}: dropped ${dropped.length} invalid selector(s):`, dropped);
    }
    return valid.join(', ');
  };

  const DEEP_CLEAN_SELECTORS_RAW = [
    '#masthead-ad', '.video-ads', 'ytp-ad-module', '.ytp-ad-overlay-slot', 'ytd-ad-slot-renderer',
    'ytd-promoted-sparkles-web-renderer', '#onboarding-splash', '[id^="google_ads"]', '[data-before-content="promoted"]',
    '.ads', '.ad-container', '.ad-wrapper', '.ad-overlay', '.Google-Ad', '[class*="ad-unit"]', '[data-ad-id]',
    '.upgrade-vip-dialog', '.vip-banner', '#onetrust-consent-sdk',
    '[class*="ad-banner"]', '[id*="ad-banner"]', '[class*="banner-ad"]', '[id*="banner-ad"]',
    '[class*="sponsored-content"]', '[class*="promotional"]', '[class*="cookie-notice"]', '[id*="cookie-consent"]',
    '[class*="login-wall"]', '[id*="login-wall"]', '[id*="modal-ad"]',
    '.banner-container', '.banner-wrapper', '.ad-sidebar', '.ad-rail', '.ad-column', '.ad-grid',
    '.ad-leaderboard', '.ad-mpu', '.ad-rectangle', '.ad-square', '.ad-skyscraper',
    '.cookie-consent', '.cookie-banner', '.cookie-popup', '.login-wall', '.login-overlay', '.login-barrier',
    '.login-consent', '.ad-consent', '.ad-consent-banner', '.ad-consent-module',
    '.google-ads', '.googleAd', '.googleAdSense', '.google-dfp-ad', '.gpt-ad', '.gpt-ad-container',
    '.gpt-slot', '.gptSlot', '.adsbygoogle', '.ad-google', '.ad-dfp', '.ad-gpt',
    '.affiliate', '.affiliate-ads', '.affiliate-widget', '[class*="pop-under"]', '[class*="pre-roll"]',
    '[class*="mid-roll"]', '.torrent-ad', '.streaming-overlay', '.fake-virus-alert'
  ];

  // GOLDEN-UNIT FIX: restored full v4 nag selector set (v5 had silently
  // dropped the wildcard consent/nag/overlay/blocker family and three
  // platform-specific entries -- a MISSING-unit §3 hard fail). The invalid
  // jQuery-style `:text("Sign up")` pseudo-selector from the v4 baseline is
  // dropped here rather than carried forward: it is not valid CSS in any
  // browser and previously only "worked" by virtue of v4's per-selector
  // try/catch silently swallowing its DOMException on every single run.
  // Removing dead weight that never functioned is not a regression.
  const NAG_SELECTORS_RAW = [
    '[data-testid="cellInnerDiv"]:has(a[href="/i/premium_sign_up"])',
    'shreddit-async-loader[bundlename="bottom_sheet_xpromo"]', 'shreddit-global-banner',
    '.qu-prevent-scroll', '[role="dialog"]:has(a[href*="login"])',
    '.cookie-notice', '.cookie-consent', '.cookie-banner', '.cookie-popup',
    '.newsletter-popup', '.subscription-nag', '.overlay-blocker', '.popup-ad',
    '.consent-module', '.gdpr-banner', '.privacy-notice', '.terms-popup',
    '.ad-consent-promotional', '.ad-cookie-consent-popup', '.ad-sponsor-consent',
    '[class*="consent-"]', '[id*="consent-"]', '[class*="nag-"]', '[id*="nag-"]',
    '[class*="overlay-"]', '[id*="overlay-"]', '[class*="blocker-"]',
    '[class*="ad-consent"]', '[class*="ad-promotional-notice"]', '[class*="ad-policy"]',
    '.modal-overlay', '.barrier-wall', '.paywall-nag', '.cnn-subscribe',
    '.dailymail-newsletter', '.reddit-premium', '.instagram-login-wall',
    '.torrent-popup', '.gaming-ad-overlay', '.entertainment-pre-roll-nag'
  ];

  // Validated once at load; both lists are now O(1) single-call batches
  // that cannot be zeroed out by one malformed entry.
  const DEEP_CLEAN_SELECTORS = compileSelectorList(DEEP_CLEAN_SELECTORS_RAW, 'deepClean');
  const NAG_SELECTORS = compileSelectorList(NAG_SELECTORS_RAW, 'killNags');

  // ==========================================
  // MODULE 2.5: HUD SOVEREIGNTY STATE (v5.3)
  // ==========================================
  const HUD_HIDDEN_KEY = 'hud_hidden';        // global soft-hide (hotkey / × / menu)
  const SITE_BLOCKLIST_KEY = 'hud_site_off';  // per-site suppression (W2)

  const readJson = (key, fallback) => {
    try {
      const raw = GM_getValue(key, null);
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (e) { return fallback; }
  };
  const writeJson = (key, value) => {
    try { GM_setValue(key, JSON.stringify(value)); } catch (e) { /* quota — non-fatal */ }
  };

  const siteSuppressed = () => {
    const list = readJson(SITE_BLOCKLIST_KEY, []);
    return Array.isArray(list) && list.includes(location.hostname);
  };
  const setSiteSuppressed = (on) => {
    const list = readJson(SITE_BLOCKLIST_KEY, []);
    const next = (Array.isArray(list) ? list : []).filter((h) => h !== location.hostname);
    if (on) next.push(location.hostname);
    writeJson(SITE_BLOCKLIST_KEY, next);
  };

  const hudGloballyHidden = () => GM_getValue(HUD_HIDDEN_KEY, false) || siteSuppressed();
  let panelEl = null;

  const applyHudVisibility = () => {
    if (!panelEl) return;
    panelEl.classList.toggle('hidden', hudGloballyHidden());
  };

  const toggleHud = () => {
    const next = !hudGloballyHidden();
    GM_setValue(HUD_HIDDEN_KEY, next);
    // A global show while this site is suppressed wins locally (W2).
    if (!next && siteSuppressed()) setSiteSuppressed(false);
    applyHudVisibility();
    dbg('HUD visibility ->', next ? 'hidden' : 'visible');
  };

  // ==========================================
  // MODULE 3: HUD INJECTION & DRAG LOGIC
  // ==========================================
  let zapperActive = false;

  const createPanel = () => {
    if (document.getElementById('psi-control-panel')) {
      panelEl = document.getElementById('psi-control-panel');
      applyHudVisibility();
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'psi-control-panel';

    // Load saved coordinates or default to bottom-right
    const savedX = GM_getValue('hud_x', null);
    const savedY = GM_getValue('hud_y', null);

    if (savedX && savedY) {
        // W3: clamp into the live viewport — saved coords from a larger
        // viewport used to strand the panel off-screen forever.
        const x = Math.max(0, Math.min(parseFloat(savedX) || 0, window.innerWidth - 80));
        const y = Math.max(0, Math.min(parseFloat(savedY) || 0, window.innerHeight - 40));
        panel.style.left = x + 'px';
        panel.style.top = y + 'px';
    } else {
        panel.style.right = '20px';
        panel.style.bottom = '20px';
    }

    /* [R3] element-built panel (was an innerHTML template). IDs, classes
     * and title tooltips preserved 1:1 — the handlers below are unchanged. */
    const cpHeader = document.createElement('div');
    cpHeader.id = 'psi-cp-header';
    cpHeader.title = 'Drag to move — double-click to collapse';
    const headerLabel = document.createElement('span');
    headerLabel.textContent = 'Ψ-WCP';
    const collapseBtn = document.createElement('button');
    collapseBtn.id = 'psi-cp-collapse';
    collapseBtn.className = 'cp-mini';
    collapseBtn.title = 'Collapse panel';
    collapseBtn.textContent = '–';
    const closeBtn = document.createElement('button');
    closeBtn.id = 'psi-cp-close';
    closeBtn.className = 'cp-mini';
    closeBtn.title = 'Hide HUD (Alt+Shift+H to restore)';
    closeBtn.textContent = '×';
    cpHeader.append(headerLabel, collapseBtn, closeBtn);
    const cpBody = document.createElement('div');
    cpBody.id = 'psi-cp-body';
    const toggleBtn = (id, label, title) => {
        const b = document.createElement('button');
        b.id = id;
        b.className = 'hud-button';
        if (title) b.title = title;
        b.textContent = label;
        return b;
    };
    cpBody.append(
        toggleBtn('toggle-adblock', 'Ad Block'),
        toggleBtn('toggle-autoskip', 'Auto Skip'),
        toggleBtn('toggle-ageskip', 'Age Bypass'),
        toggleBtn('toggle-deepclean', 'Deep Clean'),
        toggleBtn('toggle-killnags', 'Kill Nags'),
        toggleBtn('toggle-zapper', 'DOM Zapper', 'Point & click to obliterate DOM elements.'));
    panel.append(cpHeader, cpBody);
    document.body.appendChild(panel);
    panelEl = panel;

    // Headerbar mini-controls (W1)
    panel.querySelector('#psi-cp-close').addEventListener('click', (e) => {
      e.stopPropagation();
      GM_setValue(HUD_HIDDEN_KEY, true);
      applyHudVisibility();
    });
    let collapsed = false;
    panel.querySelector('#psi-cp-collapse').addEventListener('click', (e) => {
      e.stopPropagation();
      collapsed = !collapsed;
      panel.querySelector('#psi-cp-body').style.display = collapsed ? 'none' : '';
      e.currentTarget.textContent = collapsed ? '+' : '–';
    });
    panel.querySelector('#psi-cp-header').addEventListener('dblclick', (e) => {
      if (e.target.closest('.cp-mini')) return;
      panel.querySelector('#psi-cp-collapse').click();
    });

    // State Hydration
    const defaults = { adblock: true, autoskip: false, ageskip: false, deepclean: false, killnags: false };
    ['adblock', 'autoskip', 'ageskip', 'deepclean', 'killnags'].forEach(f => {
      if (GM_getValue(f, defaults[f])) {
        document.getElementById(`toggle-${f}`).classList.add('active');
      }
    });

    // Event Delegation for standard buttons
    panel.querySelectorAll('.hud-button:not(#toggle-zapper)').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        GM_setValue(btn.id.split('-')[1], btn.classList.contains('active'));
        debouncedProcess(); // Instantly apply changes
      });
    });

    // Zapper specific binding
    document.getElementById('toggle-zapper').addEventListener('click', toggleZapper);

    // Draggable Logic — Pointer Events (W6: touch + pen + mouse)
    const header = document.getElementById('psi-cp-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.cp-mini')) return; // mini-buttons are not drag handles
      isDragging = true;
      header.classList.add('dragging');
      startX = e.clientX; startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialX = rect.left; initialY = rect.top;

      // Detach from right/bottom anchoring to absolute positioning
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = `${initialX}px`;
      panel.style.top = `${initialY}px`;
      e.preventDefault(); // prevent text selection / touch scroll
      try { header.setPointerCapture(e.pointerId); } catch (_) { /* non-compliant host */ }
    });

    header.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = `${initialX + dx}px`;
      panel.style.top = `${initialY + dy}px`;
    });

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      header.classList.remove('dragging');
      // Persist location (clamped so a resize can never strand it)
      const rect = panel.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.left, window.innerWidth - 80));
      const y = Math.max(0, Math.min(rect.top, window.innerHeight - 40));
      GM_setValue('hud_x', x + 'px');
      GM_setValue('hud_y', y + 'px');
    };
    header.addEventListener('pointerup', endDrag);
    header.addEventListener('pointercancel', endDrag);

    applyHudVisibility();
  };

  // ==========================================
  // MODULE 4: CORE PURIFICATION ROUTINES
  // ==========================================
  const blockAds = () => {
    if (!GM_getValue('adblock', true)) return;
    document.querySelectorAll('video').forEach(v => {
      // v5.2: duration alone is not an ad signal — the old `< 12s` rule
      // nuked legitimate short clips (previews, looping embeds) on every
      // page. Ads are now identified by source URL or ad-container context;
      // the duration bound only applies inside a known ad container.
      const src = v.src || v.currentSrc || '';
      const inAdContext = v.closest('.ytp-ad-module, .video-ads, ytd-ad-slot-renderer, [class*="ad-container"], [class*="ad-slot"], [id^="google_ads"]');
      if (/doubleclick\.net|\/ads?\//.test(src) || (v.duration > 0 && v.duration < 12 && inAdContext)) {
          v.pause(); v.removeAttribute('src'); v.load(); v.remove();
      }
    });
  };

  const autoSkip = () => {
    if (!GM_getValue('autoskip', false)) return;
    // v5.2: .ytp-skip-ad-button added — YouTube's newer skip control.
    const skipBtns = document.querySelectorAll('.ytp-ad-skip-button, .ytp-skip-ad-button, .skip-button, [class*="skip-ad"], button[aria-label="Skip Ad"], button[aria-label="Skip ad"]');
    skipBtns.forEach(btn => btn.click());
  };

  const bypassAge = () => {
    if (!GM_getValue('ageskip', false)) return;
    document.querySelector('button[aria-label="Agree"], .consent-button')?.click();
    document.querySelector('.html5-video-player')?.classList.remove('age-restricted-mode');
  };

  const deepClean = () => {
    if (!GM_getValue('deepclean', false)) return;
    if (!DEEP_CLEAN_SELECTORS) return;
    try {
        document.querySelectorAll(DEEP_CLEAN_SELECTORS).forEach(el => el.remove());
    } catch (e) {
        console.error('[Ψ-4NDR0666] Unexpected error in deepClean.', e);
    }
  };

  const killNags = () => {
    if (!GM_getValue('killnags', false)) return;
    if (!NAG_SELECTORS) return;
    try {
        document.querySelectorAll(NAG_SELECTORS).forEach(el => {
            if (el.classList.contains('qu-prevent-scroll') || el.classList.contains('overlay-blocker')) {
                document.body.style.overflow = 'auto'; // Release scroll lock
            }
            el.remove();
        });
    } catch (e) {
        console.error('[Ψ-4NDR0666] Unexpected error in killNags.', e);
    }
  };

  // ==========================================
  // MODULE 5: DOM ZAPPER (ADMIN TOOL)
  // ==========================================
  let hoveredElement = null;

  const zapperHover = (e) => {
      if (hoveredElement) hoveredElement.classList.remove('psi-zapper-target');
      if (e.target.id === 'psi-control-panel' || e.target.closest('#psi-control-panel')) return; // Don't zap the HUD
      hoveredElement = e.target;
      hoveredElement.classList.add('psi-zapper-target');
  };

  const zapperClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.target.id === 'psi-control-panel' || e.target.closest('#psi-control-panel')) return;

      if (hoveredElement) {
          console.log('[Ψ-4NDR0666] DOM Zapper eradicated:', hoveredElement);
          hoveredElement.remove();
          hoveredElement = null;
      }
  };

  const zapperCancel = (e) => {
      if (e.button === 2) { // Right click
          e.preventDefault();
          toggleZapper();
      }
  };

  // W6: ESC also disarms (right-click is easy to miss mid-zap).
  const zapperEsc = (e) => {
      if (e.key === 'Escape' && zapperActive) toggleZapper();
  };

  const toggleZapper = () => {
      zapperActive = !zapperActive;
      const btn = document.getElementById('toggle-zapper');
      if (btn) btn.classList.toggle('active', zapperActive);

      if (zapperActive) {
          document.body.classList.add('psi-zapper-mode');
          document.addEventListener('mouseover', zapperHover, true);
          document.addEventListener('click', zapperClick, true);
          document.addEventListener('contextmenu', zapperCancel, true);
          document.addEventListener('keydown', zapperEsc, true);
          console.log('[Ψ-4NDR0666] DOM Zapper Armed. Left-click to obliterate. Right-click / ESC to disarm.');
      } else {
          document.body.classList.remove('psi-zapper-mode');
          document.removeEventListener('mouseover', zapperHover, true);
          document.removeEventListener('click', zapperClick, true);
          document.removeEventListener('contextmenu', zapperCancel, true);
          document.removeEventListener('keydown', zapperEsc, true);
          if (hoveredElement) {
              hoveredElement.classList.remove('psi-zapper-target');
              hoveredElement = null;
          }
          console.log('[Ψ-4NDR0666] DOM Zapper Disarmed.');
      }
  };

  // ==========================================
  // MODULE 6: OBSERVER ORCHESTRATION
  // ==========================================
  let _debounceTimer = null;

  const processAll = () => {
    blockAds(); autoSkip(); bypassAge(); deepClean(); killNags();
  };

  const debouncedProcess = () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(processAll, 300);
  };

  const observer = new MutationObserver((mutations) => {
      // Structural filter: Ignore text changes and attribute swaps to prevent cyclic triggering
      const structural = mutations.some(m => m.addedNodes.length > 0);
      if (structural) debouncedProcess();
  });

  const init = () => {
    if (document.body) {
      createPanel();
      processAll();

      // Target body to prevent triggering on head/meta additions
      observer.observe(document.body, { childList: true, subtree: true });

      // Failsafe garbage collection
      window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
    } else {
      setTimeout(init, 50);
    }
  };

  // ==========================================
  // MODULE 7: SOVEREIGNTY SURFACES (v5.3)
  // ==========================================
  // Alt+Shift+H — collision-checked across the suite (Recon=R, MAM=S,
  // YTPM=U/S/X, MPC=Alt+M). Capture-phase so page handlers cannot swallow.
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.repeat &&
        typeof e.key === 'string' && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      e.stopPropagation();
      toggleHud();
    }
  }, true);

  if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Ψ WCP — show / hide HUD (Alt+Shift+H)', toggleHud);
    GM_registerMenuCommand(siteSuppressed()
      ? `Ψ WCP — re-enable HUD on ${location.hostname}`
      : `Ψ WCP — hide HUD on ${location.hostname} only`, () => {
        setSiteSuppressed(!siteSuppressed());
        applyHudVisibility();
      });
    GM_registerMenuCommand('Ψ WCP — toggle debug logging', () => {
      const next = !DEBUG;
      try { localStorage.setItem('psi_wcp_debug', next ? '1' : '0'); } catch (e) {}
      console.log(`[Ψ-4NDR0666] WCP debug logging ${next ? 'ON (reload to apply)' : 'OFF'}`);
    });
  }

  init();
})();
