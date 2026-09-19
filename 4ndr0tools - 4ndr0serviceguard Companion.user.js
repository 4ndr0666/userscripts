// ==UserScript==
// @name         4ndr0tools - 4ndr0serviceguard Companion
// @namespace    https://github.com/4ndr0666/userscripts
// @version      6.0.0
// @author       4ndr0666
// @description  Part of 4ndr0tools 4ndr0serviceguard — Default-deny Service Worker & WebSocket control with whitelist
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0serviceguard%20Companion.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0serviceguard%20Companion.user.js
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// ==/UserScript==


(function () {
  'use strict';

  const WHITELIST_KEY = '4ndr0guard_whitelist_v6';
  let whitelist = GM_getValue(WHITELIST_KEY, []);

  function isWhitelisted(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return whitelist.some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch (e) {
      return false;
    }
  }

  function addToWhitelist(domain) {
    const clean = domain.toLowerCase().trim();
    if (!whitelist.includes(clean)) {
      whitelist.push(clean);
      GM_setValue(WHITELIST_KEY, whitelist);
      GM_notification(`Added to whitelist: ${clean}`);
    }
  }

  // === Ghost Protocol Core (adapted from ghost_core_v6.js) ===
  const origin = window.location.origin;

  const createFakeRegistration = (scriptURL = origin + '/service-worker-fake.js') => ({
    scope: origin + '/',
    scriptURL,
    installing: null,
    waiting: null,
    active: {
      state: 'activated',
      scriptURL,
      onstatechange: null,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    unregister: () => Promise.resolve(true),
    update: () => Promise.resolve(createFakeRegistration(scriptURL))
  });

  // Service Worker Gatekeeper
  if (navigator.serviceWorker) {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      get: () => ({
        register: async (scriptURL) => {
          if (isWhitelisted(window.location.href)) {
            return navigator.serviceWorker.register(scriptURL);
          }
          return Promise.resolve(createFakeRegistration(scriptURL));
        },
        getRegistration: () => Promise.resolve(undefined),
        getRegistrations: () => Promise.resolve([]),
        controller: null,
        ready: Promise.resolve(createFakeRegistration())
      })
    });
  }

  // WebSocket Gatekeeper (with DDoS-Guard fast path)
  const OrigWebSocket = window.WebSocket;
  if (OrigWebSocket) {
    window.WebSocket = function (url, protocols) {
      const isDDoS = url.toLowerCase().includes('ddos-guard');

      if (isDDoS || isWhitelisted(window.location.href)) {
        return protocols ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
      }

      // Blocked — return phantom
      const phantom = this;
      phantom.readyState = 3;
      setTimeout(() => {
        if (typeof phantom.onerror === 'function') phantom.onerror(new Event('error'));
        if (typeof phantom.onclose === 'function') phantom.onclose(new CloseEvent('close'));
      }, 30);
      return phantom;
    };
    window.WebSocket.prototype = OrigWebSocket.prototype;
  }

  // Menu Commands
  GM_registerMenuCommand('Add current domain to whitelist', () => {
    const domain = location.hostname;
    addToWhitelist(domain);
  });

  GM_registerMenuCommand('View / Edit Whitelist', () => {
    const current = whitelist.join('\n');
    const input = prompt('Current whitelist (one domain per line):', current);
    if (input !== null) {
      whitelist = input.split('\n').map(l => l.trim()).filter(Boolean);
      GM_setValue(WHITELIST_KEY, whitelist);
      GM_notification('Whitelist updated');
    }
  });

  GM_registerMenuCommand('Clear Whitelist', () => {
    if (confirm('Clear entire whitelist?')) {
      whitelist = [];
      GM_setValue(WHITELIST_KEY, whitelist);
      GM_notification('Whitelist cleared');
    }
  });

})();
