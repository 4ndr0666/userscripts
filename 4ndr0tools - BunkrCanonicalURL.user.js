// ==UserScript==
// @name         4ndr0tools - Bunkr Canonical URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1.0
// @description  Part of 4ndr0tools for "ease-of-life". Redirects
//               every bunkr* url to the true canonical host
//               without losing path, query or sub-domain.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-AlwaysNewWindow.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-AlwaysNewWindow.user.js
// @include      *
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        http*://*.bunkr.*/*
// @match        http*://bunkr.*/*
// @match        http*://*.bunker.*/*
// @match        http*://bunker.*/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  /** Change this single line if the canonical domain ever changes. */
  const CANONICAL_HOST = 'bunkr.ws';

  /* 1. quick exit if we are already on the right host */
  if (location.hostname === CANONICAL_HOST) return;

  /* 2. basic pattern:  (optional subDomain.)  (bunkr|bunker)  . anyTLD */
  const pattern = /^(?<sub>.*\.)?(bunkr|bunker)\.[a-z0-9-]{2,}$/i;

  const current = location.hostname;

  if (!pattern.test(current)) return;          // nothing to do

  /* 3. keep sub-domain (if any) in front of canonical host */
  const { groups: { sub = '' } = {} } = current.match(pattern) ?? {};
  const newHost = `${sub}${CANONICAL_HOST}`.replace(/^\./, ''); // strip leading dot if no sub

  /* 4. build final URL, preserving everything else */
  const target = new URL(location.href);
  target.hostname = newHost;

  /* 5. guard against loops – only redirect once per tab */
  if (target.hostname !== location.hostname) {
    /* replace() avoids an extra history entry */
    location.replace(target.href);
  }
})();
