// ==UserScript==
// @name         4ndr0tools - Website Control Panel (Unified Superset)
// @namespace    https://github.com/4ndr0666/userscripts
// @description  Draggable Cyberdeck HUD, DOM Zapper, Ad suppression, validated-selector compiled deep-cleaning.
// @version      5.1.0-Ψ
// @author       Ψ-4NDR0666OS
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadUrl  https
// @updateUrl    
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('%c[4NDR0666OS] WCP v5.1.0-Ψ — INITIATING CYBERDECK HUD', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

  // ==========================================
  // MODULE 1: ELECTRIC-GLASS AESTHETICS & STATE
  // ==========================================
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');
    :root {
      --bg-dark: rgba(10, 15, 26, 0.95); --accent-cyan: #00E5FF; --text-cyan-active: #e0ffff;
      --accent-cyan-bg-active: rgba(0, 229, 255, 0.15); --accent-cyan-glow-active: rgba(0, 229, 255, 0.4);
      --text-secondary: #70c0c0; --font-body: 'Roboto Mono', monospace; --zapper-red: #FF0055;
    }

    #psi-control-panel {
      position: fixed; z-index: 9999999; background: var(--bg-dark);
      backdrop-filter: blur(8px); border: 1px solid var(--accent-cyan); border-radius: 8px; padding: 12px;
      box-shadow: 0 8px 32px rgba(0, 229, 255, 0.2); font-family: var(--font-body); color: var(--text-cyan-active);
      width: 150px; user-select: none;
    }

    #psi-cp-header {
      font-size: 0.75rem; color: var(--accent-cyan); padding-bottom: 8px; border-bottom: 1px solid rgba(0, 229, 255, 0.3);
      margin-bottom: 8px; cursor: grab; text-align: center; font-weight: bold; letter-spacing: 1px;
    }
    #psi-cp-header:active { cursor: grabbing; }

    .hud-button {
      display: flex; justify-content: center; align-items: center; width: 100%; padding: 6px;
      border: 1px solid transparent; font-family: var(--font-body); font-weight: bold; font-size: 0.75rem;
      text-transform: uppercase; color: var(--text-secondary); background-color: rgba(0,0,0,0.4);
      cursor: pointer; transition: all 0.2s ease-in-out; margin-bottom: 6px; border-radius: 4px;
    }
    .hud-button:last-child { margin-bottom: 0; }
    .hud-button:hover { color: var(--accent-cyan); border-color: rgba(0, 229, 255, 0.5); }
    .hud-button.active {
      color: #000; background-color: var(--accent-cyan);
      border-color: var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan-glow-active);
    }

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
  // MODULE 3: HUD INJECTION & DRAG LOGIC
  // ==========================================
  let zapperActive = false;

  const createPanel = () => {
    if (document.getElementById('psi-control-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'psi-control-panel';

    // Load saved coordinates or default to bottom-right
    const savedX = GM_getValue('hud_x', null);
    const savedY = GM_getValue('hud_y', null);

    if (savedX && savedY) {
        panel.style.left = savedX;
        panel.style.top = savedY;
    } else {
        panel.style.right = '20px';
        panel.style.bottom = '20px';
    }

    panel.innerHTML = `
      <div id="psi-cp-header">Ψ-WCP : HUD</div>
      <button id="toggle-adblock" class="hud-button">Ad Block</button>
      <button id="toggle-autoskip" class="hud-button">Auto Skip</button>
      <button id="toggle-ageskip" class="hud-button">Age Bypass</button>
      <button id="toggle-deepclean" class="hud-button">Deep Clean</button>
      <button id="toggle-killnags" class="hud-button">Kill Nags</button>
      <button id="toggle-zapper" class="hud-button" title="Point & click to obliterate DOM elements.">DOM Zapper</button>
    `;
    document.body.appendChild(panel);

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

    // Draggable Logic
    const header = document.getElementById('psi-cp-header');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialX = rect.left; initialY = rect.top;

      // Detach from right/bottom anchoring to absolute positioning
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = `${initialX}px`;
      panel.style.top = `${initialY}px`;
      e.preventDefault(); // prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panel.style.left = `${initialX + dx}px`;
      panel.style.top = `${initialY + dy}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        // Persist location
        GM_setValue('hud_x', panel.style.left);
        GM_setValue('hud_y', panel.style.top);
      }
    });
  };

  // ==========================================
  // MODULE 4: CORE PURIFICATION ROUTINES
  // ==========================================
  const blockAds = () => {
    if (!GM_getValue('adblock', true)) return;
    document.querySelectorAll('video').forEach(v => {
      if (v.duration < 12 || /doubleclick\.net|ads/.test(v.src)) {
          v.pause(); v.removeAttribute('src'); v.load(); v.remove();
      }
    });
  };

  const autoSkip = () => {
    if (!GM_getValue('autoskip', false)) return;
    const skipBtns = document.querySelectorAll('.ytp-ad-skip-button, .skip-button, [class*="skip-ad"], button[aria-label="Skip Ad"]');
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

  const toggleZapper = () => {
      zapperActive = !zapperActive;
      const btn = document.getElementById('toggle-zapper');
      btn.classList.toggle('active', zapperActive);

      if (zapperActive) {
          document.body.classList.add('psi-zapper-mode');
          document.addEventListener('mouseover', zapperHover, true);
          document.addEventListener('click', zapperClick, true);
          document.addEventListener('contextmenu', zapperCancel, true);
          console.log('[Ψ-4NDR0666] DOM Zapper Armed. Left-click to obliterate. Right-click to disarm.');
      } else {
          document.body.classList.remove('psi-zapper-mode');
          document.removeEventListener('mouseover', zapperHover, true);
          document.removeEventListener('click', zapperClick, true);
          document.removeEventListener('contextmenu', zapperCancel, true);
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

  init();
})();
