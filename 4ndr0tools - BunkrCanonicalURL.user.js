// ==UserScript==
// @name         4ndr0tools - Bunkr Canonical URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.3.0
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

  // Use a try...catch block to gracefully handle any unexpected runtime errors,
  // preventing the script from crashing the user's page.
  try {
    /**
     * Define the single source of truth for the canonical domain.
     * This ensures easy updates if the target domain ever changes.
     */
    const CANONICAL_HOST = 'bunkr.ws';
    const currentHost = location.hostname;

    // 1. Performance Optimization: Quick exit if we are already on the correct canonical host.
    // This is the most common case and prevents all further processing.
    if (currentHost === CANONICAL_HOST) {
      return;
    }

    // 2. Define a robust regex to capture the optional subdomain and match known domain variations.
    // Pattern: (optional subDomain.)(bunkr|bunker).anyTLD
    // - `^` and `$` anchors ensure the pattern matches the *entire* hostname.
    // - `(?<sub>[a-z0-9-]+\.)?` is a named capture group for an optional subdomain.
    // - `(?:bunkr|bunker)` is a non-capturing group for the main domain name variations.
    // - `\.[a-z0-9-]{2,}` matches the TLD.
    // - The `i` flag makes the match case-insensitive.
    const pattern = /^(?<sub>[a-z0-9-]+\.)?(?:bunkr|bunker)\.[a-z0-9-]{2,}$/i;
    const match = currentHost.match(pattern);

    // 3. Validation: Exit if the current hostname doesn't match the expected pattern.
    // This acts as a safeguard against incorrect @match directives or unexpected domains.
    if (!match) {
      return;
    }

    // 4. Construct the new hostname.
    // Extract the subdomain from the named capture group, defaulting to an empty string
    // if it doesn't exist (e.g., for 'bunkr.cc'). The nullish coalescing operator `??`
    // provides a concise and safe default.
    const subDomain = match.groups?.sub ?? '';
    const newHost = `${subDomain}${CANONICAL_HOST}`;

    // 5. Guard against redundant or looped redirections.
    // This check is crucial to ensure we only redirect if a change is actually needed,
    // preventing potential infinite redirect loops.
    if (newHost === currentHost) {
      return;
    }

    // 6. Perform the redirection.
    // A new URL object is constructed from the current location.href.
    // This is a safe and reliable way to parse and modify URL components.
    const targetUrl = new URL(location.href);
    targetUrl.hostname = newHost;

    // location.replace() is used to change the URL without creating a new entry
    // in the browser's session history, so the user's "back" button works as expected.
    location.replace(targetUrl.href);

  } catch (error) {
    // Log any unexpected errors to the console for debugging purposes.
    // This ensures script failures are visible to developers without disrupting the user experience.
    console.error('[Bunkr Canonical URL] An unexpected error occurred:', error);
  }
})();
