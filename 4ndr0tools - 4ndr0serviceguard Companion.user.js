// ==UserScript==
// @name         4ndr0tools - 4ndr0serviceguard Companion
// @namespace    https://github.com/4ndr0666/userscripts
// @version      6.0.0
// @author       4ndr0666
// @description  Ghost Protocol for Violentmonkey — Default-deny Service Worker & WebSocket control with whitelist
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%204ndr0purge.user.js
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
