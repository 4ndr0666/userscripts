// ==UserScript==
// @name         LinkMasterΨ2 – CandidShiny Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.1
// @description  CandidShiny forum support for LinkMasterΨ2
// ==/UserScript==

(function () {
    "use strict";

    const plugin = {
        name: "CandidShiny",
        hosts: [
            ["CandidShiny:Attachments", [ /https?:\/\/forum\.candidshiny\.com\/attachments\/.+/i ]],
            ["CandidShiny:Images", [ /https?:\/\/forum\.candidshiny\.com\/attachments\/.*\.(jpg|png|gif|webp)/i ]]
        ],
        resolvers: [
            [
                [ /https?:\/\/forum\.candidshiny\.com\/attachments\/.+/i ],
                async (url, http) => {
                    try {
                        const { status } = await http.gm_promise({ method: "HEAD", url });
                        return status < 400 ? url : null;
                    } catch {
                        return null;
                    }
                }
            ]
        ],
        parsePosts: (root = document) => {
            const posts = [];
            const postEls = root.querySelectorAll("article.message, .message");
            postEls.forEach(el => {
                const postId = el.dataset.postId || el.id;
                if (!postId) return;
                const postNumber = el.querySelector(".message-number")?.innerText.replace("#", "").trim() || postId;
                const contentContainer = el.querySelector(".bbWrapper, .message-content") || el;
                const spoilers = [...el.querySelectorAll(".spoiler")].map(s => s.innerText.trim());
                posts.push({ post: el, postId, postNumber, content: contentContainer.innerHTML, textContent: contentContainer.innerText, spoilers, contentContainer });
            });
            return posts;
        }
    };

    // Expose plugin for LinkMasterΨ2 to detect
    window.LinkMasterPlugin = plugin;

})();