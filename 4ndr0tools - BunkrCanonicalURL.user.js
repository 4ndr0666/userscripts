// ==UserScript==
// @name         4ndr0tools - Bunkr Canonical URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.2.0
// @description  Normalize Bunkr links to a canonical host without losing the path, query, or sub-domain.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BunkrCanonicalURL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BunkrCanonicalURL.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://bunkr.*/*
// @match        *://*.bunkr.*/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  try {
    /**
     * Define the single source of truth for the canonical domain.
     * This ensures easy updates if the target domain ever changes.
     */
    const CANONICAL_HOST = 'bunkr.ws';

    // 1. Quick exit if we are already on the correct canonical host.
    // This is the most common case and prevents unnecessary processing.
    if (location.hostname === CANONICAL_HOST) {
      return;
    }

    // 2. Define a regex to capture the optional subdomain and match known domain variations.
    // Pattern: (optional subDomain.)(bunkr|bunker).anyTLD
    // The '$' anchor ensures the pattern matches the entire hostname.
    const pattern = /^(?<sub>[a-z0-9-]+\.)?(?:bunkr|bunker)\.[a-z0-9-]{2,}$/i;
    const currentHost = location.hostname;

    const match = currentHost.match(pattern);

    // 3. Exit if the current hostname doesn't match the expected pattern.
    if (!match) {
      return;
    }

    // 4. Extract the subdomain, defaulting to an empty string if it doesn't exist.
    // The optional chaining (?.) is a safeguard in case 'groups' is undefined.
    const subDomain = match.groups?.sub || '';
    const newHost = `${subDomain}${CANONICAL_HOST}`;

    // 5. Construct the final URL, preserving the protocol, path, query, and hash.
    const targetUrl = new URL(location.href);
    targetUrl.hostname = newHost;

    // 6. Guard against redirection loops and perform the redirection.
    // This check ensures we only redirect if a change is actually needed.
    // location.replace() is used to avoid creating a new entry in the browser's history.
    if (targetUrl.hostname !== location.hostname) {
      location.replace(targetUrl.href);
    }
  } catch (error) {
    // Log any unexpected errors to the console for debugging, but don't disrupt the user.
    console.error('[Bunkr Canonical URL] Script failed:', error);
  }
})();
