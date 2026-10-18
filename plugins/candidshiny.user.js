// ==UserScript==
// @name         LinkMasterΨ2 - CandidShiny Full Autopsy Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1.2
// @description  Scans ALL possible links, images, videos, attachments, even shadow roots, on CandidShiny. v1.1.1: fixed three invalid selectors ('a[href]', 'a.attachment[href]') that threw SyntaxError and silently killed every scan.
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
            } catch (e) { console.debug('[CandidShiny] template scan skipped:', e); }
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

        // Unwrap redirector query parameters and normalize relative/percent-encoded URLs
        Array.from(urls).forEach(rawUrl => {
            if (!rawUrl || typeof rawUrl !== 'string') return;
            try {
                const resolved = new URL(rawUrl, window.location.href);
                urls.add(resolved.href);
                for (const key of ['url', 'to', 'u', 'target', 'dest']) {
                    const param = resolved.searchParams.get(key);
                    if (param) {
                        const decoded = decodeURIComponent(param);
                        if (/^https?:\/\//i.test(decoded)) urls.add(decoded);
                    }
                }
            } catch (e) {
                console.debug('[CandidShiny] URL normalization skipped:', e);
            }
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

    // Live update as new content is loaded (visibility-guarded, error-isolated)
    let lastCount = 0;
    setInterval(() => {
        if (document.hidden) return;
        try {
            const urls = scanAllMedia();
            if (urls.length !== lastCount) {
                window.LinkMasterPlugin.hosts[0][1] = urls;
                lastCount = urls.length;
            }
        } catch (e) {
            console.debug('[CandidShiny] live scan error:', e);
        }
    }, 3333);

})();
