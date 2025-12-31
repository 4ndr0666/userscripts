// ==UserScript==
// @name         LinkMasterΨ2 - CandidShiny Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @description  Extract all images/videos/attachments from forum.candidshiny.com posts
// @match        *://forum.candidshiny.com/*
// @grant        none
// ==/UserScript==

(() => {
    "use strict";

    const plugin = {
        name: "CandidShiny",
        hosts: [
            [
                "CandidShiny:Attachments",
                [] // Will populate dynamically
            ]
        ],
        resolvers: [
            [
                /.+/,
                async (url) => url // No special resolving needed, just report the URL
            ]
        ]
    };

    function scanPosts() {
        const posts = document.querySelectorAll("div.message-body, div.bbWrapper, article.message"); // catch common post containers
        const mediaUrls = [];

        posts.forEach(post => {
            // Attachments as <a class="attachment">
            post.querySelectorAll("a.attachment[href]").forEach(a => mediaUrls.push(a.href));

            // Inline images
            post.querySelectorAll("img[src]").forEach(img => {
                if (img.src.includes("/uploads/")) mediaUrls.push(img.src);
            });

            // Inline videos
            post.querySelectorAll("video, video source[src]").forEach(v => {
                const src = v.src || v.getAttribute("src");
                if (src) mediaUrls.push(src);
            });
        });

        plugin.hosts[0][1] = mediaUrls.map(url => ({ url }));
    }

    scanPosts();
    window.LinkMasterPlugin = plugin;

})();