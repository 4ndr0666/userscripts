// ==UserScript==
// @name         4ndr0tools - Telegram_Web_Version_Redirect
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0
// @author       4ndr0666
// @description  This script allows you to open t.me links in Web Telegram A on Firefox, Chrome, and Safari
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        https://t.me/*
// @match        https://www.google.com/url?q=https://t.me/*
// @match        https://duckduckgo.com/l/?uddg=https://t.me/*
// @match        https://www.bing.com/search?q=https://t.me/*
// @match        https://search.brave.com/search?q=https://t.me/*
// @match        https://search.yahoo.com/search?p=https://t.me/*//
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Telegram_Web_Version_Redirect.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Telegram_Web_Version_Redirect.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /**
     * Extracts the channel/invite slug from a t.me URL, including links
     * that arrive wrapped inside a search-engine redirect query string.
     * Handles plain channels (t.me/name), invite links (t.me/+hash),
     * and preview paths (t.me/s/name).
     */
    function getChannelId(url) {
        let decodedUrl;
        try {
            decodedUrl = decodeURIComponent(url);
        } catch (e) {
            // Malformed percent-encoding (e.g. a stray '%' from a double-wrapped
            // redirect link) — fall back to the raw string rather than throwing
            // and aborting the whole script.
            decodedUrl = url;
        }

        const match = decodedUrl.match(/t\.me\/(?:s\/)?(\+?[^&?]+)/);
        return match ? match[1] : null;
    }

    const currentUrl = window.location.href;
    const channelId = getChannelId(currentUrl);

    if (!channelId) {
        return; // Exit if no channel ID is found
    }

    /* Find the button that takes you to the desktop client */
    const desktopClient = document.querySelector('.tgme_page_action');

    /* Add a new button below to go to the web client */
    if (desktopClient) {
        const webClient = document.createElement('div');
        webClient.classList.add('tgme_page_action', 'tgme_page_web_action');

        const link = document.createElement('a');
        link.classList.add('tgme_action_button_new', 'tgme_action_web_button');
        link.setAttribute('href', `https://web.telegram.org/a/#@${encodeURIComponent(channelId)}`);

        const label = document.createElement('span');
        label.classList.add('tgme_action_button_label');
        label.textContent = 'Open in Web';

        link.appendChild(label);
        webClient.appendChild(link);
        desktopClient.insertAdjacentElement('afterend', webClient);
    }

    /* Hide channel preview link in t.me */
    const previewLink = document.querySelector('.tgme_page_context_link_wrap');
    if (previewLink) {
        previewLink.style.display = 'none';
    }
})();
