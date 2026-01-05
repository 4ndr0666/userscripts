// ==UserScript==
// @name         4ndr0tool - Website Control Panel
// @description  Ultimate ad suppression, age-restriction bypass, nag removal, deep DOM purification, visual noise elimination, and uBlock-inspired filter integration with cyberdeck HUD.
// @version      4.0.666
// @author       4ndr0666
// @namespace    https://github.com/4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // === Electric-Glass Theme (unchanged + extended) ===
  GM_addStyle(`
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&display=swap');
    :root {
      --bg-dark: #0A0F1A; --accent-cyan: #15fafa; --text-cyan-active: #e0ffff;
      --accent-cyan-border-hover: rgba(21,250,250,0.5); --accent-cyan-bg-active: rgba(21,250,250,0.15);
      --accent-cyan-glow-active: rgba(21,250,250,0.4); --text-primary: #e0ffff; --text-secondary: #70c0c0;
      --font-body: 'Roboto Mono', monospace;
    }
    #psi-control-panel { position: fixed; bottom: 20px; right: 20px; z-index: 999999; background: #101827ee;
      backdrop-filter: blur(8px); border: 1px solid #15adad88; border-radius: 12px; padding: 12px;
      box-shadow: 0 8px 32px rgba(21,250,250,0.2); font-family: var(--font-body); color: var(--text-primary); }
    .hud-button { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid transparent;
      font-family: var(--font-body); font-weight: 500; font-size: 0.875rem; letter-spacing: 0.05em;
      text-transform: uppercase; color: var(--text-secondary); background-color: rgba(0,0,0,0.3);
      cursor: pointer; transition: all 300ms ease-in-out; margin: 4px; border-radius: 6px; }
    .hud-button:hover { color: var(--accent-cyan); border-color: var(--accent-cyan-border-hover); }
    .hud-button.active { color: var(--text-cyan-active); background-color: var(--accent-cyan-bg-active);
      border-color: var(--accent-cyan); box-shadow: 0 0 15px var(--accent-cyan-glow-active); }
  `);

  // === Control Panel ===
  const createPanel = () => {
    const panel = document.createElement('div');
    panel.id = 'psi-control-panel';
    panel.innerHTML = `
      <div style="margin-bottom:8px; font-size:0.8rem; opacity:0.8;">Ψ-4ndr0666 Control Panel</div>
      <button id="toggle-adblock" class="hud-button">Ad Block</button>
      <button id="toggle-autoskip" class="hud-button">Auto Skip</button>
      <button id="toggle-ageskip" class="hud-button">Age Bypass</button>
      <button id="toggle-deepclean" class="hud-button">Deep Clean</button>
      <button id="toggle-killnags" class="hud-button">Kill Nags</button>
    `;
    document.body.appendChild(panel);

    // Default states: only Ad Block enabled
    const defaults = { adblock: true, autoskip: false, ageskip: false, deepclean: false, killnags: false };
    ['adblock', 'autoskip', 'ageskip', 'deepclean', 'killnags'].forEach(f => {
      if (GM_getValue(f, defaults[f])) {
        document.getElementById(`toggle-${f}`).classList.add('active');
      }
    });

    panel.querySelectorAll('.hud-button').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        GM_setValue(btn.id.split('-')[1], btn.classList.contains('active'));
      });
    });
  };

  // === Core Functions ===
  const blockAds = () => {
    if (!GM_getValue('adblock', true)) return;
    document.querySelectorAll('video').forEach(v => {
      if (v.duration < 12 || /doubleclick\.net|ads/.test(v.src)) { v.pause(); v.src = ''; v.remove(); }
    });
  };

  const autoSkip = () => {
    if (!GM_getValue('autoskip', false)) return;
    ['.ytp-ad-skip-button', '.skip-button', '[class*="skip-ad"]', 'button[aria-label="Skip Ad"]']
      .forEach(sel => { document.querySelector(sel)?.click(); });
  };

  const bypassAge = () => {
    if (!GM_getValue('ageskip', false)) return;
    document.querySelector('button[aria-label="Agree"], .consent-button')?.click();
    document.querySelector('.html5-video-player')?.classList.remove('age-restricted-mode');
  };

  // === Deep Clean: uBlock-inspired universal selectors ===
  const deepCleanSelectors = [
    '#masthead-ad', '.video-ads', 'ytp-ad-module', '.ytp-ad-overlay-slot', 'ytd-ad-slot-renderer', 'ytd-promoted-sparkles-web-renderer',
    '#onboarding-splash', '[id^="google_ads"]', '[data-before-content="promoted"]',
    '.ads', '.ad-container', '.ad-wrapper', '.ad-overlay', '.Google-Ad', '[class*="ad-unit"]', '[data-ad-id]',
    '.upgrade-vip-dialog', '.vip-banner',
    '[id*="cookie"]', '[class*="cookie"]', '[id*="consent"]', '[class*="consent"]', '#onetrust-consent-sdk',
    '[class*="ad-"]', '[id*="ad"]', '[class*="ad-banner"]', '[id*="ad-banner"]',
    '[class*="banner"]', '[id*="banner"]', '[class*="banner-ad"]', '[id*="banner-ad"]',
    '[class*="sponsored"]', '[id*="sponsor"]', '[class*="sponsored-content"]',
    '[class*="promo"]', '[id*="promo"]', '[class*="promotional"]',
    '[class*="advert"]', '[id*="advert"]', '[class*="ad-slot"]', '[id*="ad-slot"]',
    '[class*="cookie"]', '[id*="cookie"]', '[class*="cookie-notice"]', '[id*="cookie-consent"]',
    '[class*="login"]', '[id*="login"]', '[class*="login-wall"]', '[id*="login-wall"]',
    '[class*="popup"]', '[id*="popup"]', '[class*="modal"]', '[id*="modal-ad"]',
    '.ad-container', '.ad-wrapper', '.ad-slot', '.ad-unit', '.ad-block',
    '.banner-container', '.banner-wrapper', '.ad-banner', '.banner-ad',
    '.ad-sidebar', '.ad-rail', '.ad-column', '.ad-grid',
    '.ad-leaderboard', '.ad-mpu', '.ad-rectangle', '.ad-square', '.ad-skyscraper',
    '.ad-video', '.ad-audio', '.ad-interactive', '.ad-native', '.ad-display',
    '.ad-inline', '.ad-sticky', '.ad-fixed', '.ad-overlay', '.ad-popup', '.ad-modal',
    '.sponsored', '.sponsored-content', '.sponsored-ad', '.sponsored-banner',
    '.promo', '.promo-ad', '.promoted', '.promotional-content',
    '.ad-sponsor', '.ad-partner', '.ad-affiliate', '.ad-commercial',
    '.cookie-notice', '.cookie-consent', '.cookie-banner', '.cookie-popup',
    '.login-wall', '.login-overlay', '.login-barrier', '.login-consent',
    '.ad-consent', '.ad-consent-banner', '.ad-consent-module',
    '.google-ads', '.googleAd', '.googleAdSense', '.google-dfp-ad',
    '.gpt-ad', '.gpt-ad-container', '.gpt-slot', '.gptSlot',
    '.adsbygoogle', '.ad-google', '.ad-dfp', '.ad-gpt',
    '.affiliate', '.affiliate-ads', '.affiliate-widget',
    '.ad-affiliate', '.ad-partner', '.ad-sponsored', '.ad-promotion',
    '.ad-hidden', '.ad-visible', '.ad-above', '.ad-below', '.ad-before', '.ad-after',
    '.news-ad', '.entertainment-ad', '.health-ad',
    '[class*="pop-under"]', '[class*="pre-roll"]', '[class*="mid-roll"]',
    '.torrent-ad', '.streaming-overlay', '.fake-virus-alert',
    '.casino-banner', '.dating-ad', '.ecommerce-promo',
    '.cnn-ad', '.dailymail-sponsored', '.thesun-banner',
    '.instagram-ad', '.reddit-promo', '.facebook-sponsored',
    '[class*="ad-recovery"]', '[class*="ad-transparency"]', '[class*="ad-preferences"]'
  ];

  const deepClean = () => {
    if (!GM_getValue('deepclean', false)) return;
    deepCleanSelectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => el.remove());
      } catch (e) {}
    });
  };

  // === Kill Nags ===
  const killNags = () => {
    if (!GM_getValue('killnags', false)) return;
    const nagSelectors = [
      '[data-testid="cellInnerDiv"]:has(a[href="/i/premium_sign_up"])',
      'shreddit-async-loader[bundlename="bottom_sheet_xpromo"]', 'shreddit-global-banner',
      '.qu-prevent-scroll',
      '[role="dialog"]:has(a[href*="login"]), [role="dialog"]:has(button:text("Sign up"))',
      '.cookie-notice', '.cookie-consent', '.cookie-banner', '.cookie-popup',
      '.newsletter-popup', '.subscription-nag', '.overlay-blocker', '.popup-ad',
      '.consent-module', '.gdpr-banner', '.privacy-notice', '.terms-popup',
      '.ad-consent-promotional', '.ad-cookie-consent-popup', '.ad-sponsor-consent',
      '[class*="consent-"]', '[id*="consent-"]', '[class*="nag-"]', '[id*="nag-"]',
      '[class*="overlay-"]', '[id*="overlay-"]', '[class*="blocker-"]',
      '[class*="ad-consent"]', '[class*="ad-promotional-notice"]', '[class*="ad-policy"]',
      '.pop-up', '.modal-overlay', '.barrier-wall', '.paywall-nag',
      '.cnn-subscribe', '.dailymail-newsletter', '.reddit-premium', '.instagram-login-wall',
      '.torrent-popup', '.gaming-ad-overlay', '.entertainment-pre-roll-nag'
    ];
    nagSelectors.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(el => {
          el.remove();
          if (el.classList.contains('qu-prevent-scroll') || el.classList.contains('overlay-blocker')) {
            document.body.style.overflow = 'auto';
          }
        });
      } catch (e) {}
    });
  };

  // === Unified Observer ===
  let timeout;
  const debounce = (func, delay) => {
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const processAll = () => {
    blockAds(); autoSkip(); bypassAge(); deepClean(); killNags();
  };

  const debouncedProcess = debounce(processAll, 300);

  const observer = new MutationObserver(debouncedProcess);

  // === Initialization ===
  const init = () => {
    if (document.body) {
      createPanel();
      observer.observe(document, { childList: true, subtree: true });
      processAll();
      setInterval(processAll, 2000);
    } else {
      setTimeout(init, 100);
    }
  };

  init();
})();
