// ==UserScript==
// @name         LinkMasterΨ2 - CandidShiny Full Autopsy Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1.0
// @description  Scans ALL possible links, images, videos, attachments, even shadow roots, on CandidShiny.
// @match        *://forum.candidshiny.com/*
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    function scanAllMedia() {
        const urls = new Set();

        // Standard anchors and media (full page, not just post bodies)
        document.querySelectorAll('a[href]').forEach(a => urls.add(a.href));
        document.querySelectorAll('img[src]').forEach(img => urls.add(img.src));
        document.querySelectorAll('video[src]').forEach(vid => urls.add(vid.src));
        document.querySelectorAll('source[src]').forEach(src => urls.add(src.src));
        // Look for lazy-loads
        document.querySelectorAll('img[data-src]').forEach(img => urls.add(img.dataset.src));
        // Look for attachments (XenForo, IPS, etc)
        document.querySelectorAll('a.attachment[href]').forEach(a => urls.add(a.href));
        // Attachments rendered as icons with data-download-url
        document.querySelectorAll('[data-download-url]').forEach(el => urls.add(el.dataset.downloadUrl));
        // Look for possible inline media in <template> tags
        document.querySelectorAll('template').forEach(tpl => {
            try {
                const d = tpl.content || tpl;
                d.querySelectorAll('a[href]').forEach(a => urls.add(a.href));
                d.querySelectorAll('img[src]').forEach(img => urls.add(img.src));
            } catch (e) { /* shadow dom could throw */ }
        });
        // Inspect shadow roots (cursed, but thorough)
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                el.shadowRoot.querySelectorAll('a[href],img[src],video[src]').forEach(n => {
                    if(n.href) urls.add(n.href);
                    if(n.src) urls.add(n.src);
                });
            }
        });
        // Maybe base64-encoded images?
        document.querySelectorAll('img').forEach(img => {
            if(img.src && img.src.startsWith('data:')) urls.add(img.src);
        });

        // Anything that "looks" like a file: direct uploads (heuristic)
        Array.from(urls).forEach(url => {
            // Add additional transformations if needed
            // (e.g., resolve redirects, decode percent-encodings, etc.)
        });

        return Array.from(urls).filter(Boolean);
    }

    // Populate plugin for LinkMasterΨ2
    window.LinkMasterPlugin = {
        name: "CandidShiny (Full Autopsy)",
        hosts: [
            ["CandidShiny:AllMedia", scanAllMedia()]
        ],
        resolvers: [
            [[/.+/], url => url]
        ]
    };

    // Optional: live update as new content is loaded
    let lastCount = 0;
    setInterval(() => {
        const urls = scanAllMedia();
        if (urls.length !== lastCount) {
            window.LinkMasterPlugin.hosts[0][1] = urls;
            lastCount = urls.length;
        }
    }, 3333);

})();
