// ==UserScript==
// @name         LinkMasterΨ2 Plugin - CandidShiny Forum
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1.0
// @description  Support for forum.candidshiny.com posts and attachments in LinkMasterΨ2
// @match        *://forum.candidshiny.com/*
// @grant        none
// ==/UserScript==

(() => {
    "use strict";

    const plugin = {
        name: "CandidShiny",
        hosts: [
            [
                "CandidShiny:Post Media",
                [
                    /https?:\/\/forum\.candidshiny\.com\/uploads\/.*\.(mp4|webm|jpg|jpeg|png|gif)/i
                ]
            ]
        ],
        resolvers: [
            [
                /https?:\/\/forum\.candidshiny\.com\/uploads\/.*\.(mp4|webm|jpg|jpeg|png|gif)/i,
                async (url, http, spoilers, postId) => {
                    try {
                        // Simple HEAD request to verify existence
                        const res = await http.gm_promise({ method: "HEAD", url });
                        if (res.status >= 200 && res.status < 400) return url;
                        return null;
                    } catch {
                        return null;
                    }
                }
            ]
        ]
    };

    // Auto-scan posts and collect media
    const scanPosts = () => {
        const posts = document.querySelectorAll("article.message, div.message-content");
        posts.forEach(post => {
            const container = post.querySelector(".message-content") || post;
            const mediaUrls = [];

            container.querySelectorAll("img, video, a[href]").forEach(el => {
                let url = el.src || el.getAttribute("href");
                if (!url) return;
                if (/forum\.candidshiny\.com\/uploads/.test(url)) mediaUrls.push(url);
            });

            if (mediaUrls.length) {
                plugin.hosts[0][1].resources = mediaUrls;
            }
        });
    };

    // Expose globally for LinkMasterΨ2
    window.LinkMasterPlugin = plugin;
    scanPosts();
})();