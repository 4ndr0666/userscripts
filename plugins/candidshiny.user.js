// ==UserScript==
// @name         LinkMasterΨ2 Plugin - CandidShiny
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @description  Adds CandidShiny forum support for LinkMasterΨ2
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
                [
                    // Match attachment links ending with common media extensions
                    /https?:\/\/forum\.candidshiny\.com\/uploads\/.*?\.(?:mp4|webm|jpg|jpeg|png|gif)/i
                ]
            ]
        ],
        resolvers: [
            [
                // Resolve matched URLs
                /https?:\/\/forum\.candidshiny\.com\/uploads\/.*?\.(?:mp4|webm|jpg|jpeg|png|gif)/i,
                async (url, http, spoilers, postId) => {
                    // Simple HEAD check to ensure URL exists
                    try {
                        const response = await http.gm_promise({ method: "HEAD", url });
                        if (response.status >= 200 && response.status < 400) return url;
                        return null;
                    } catch {
                        return null;
                    }
                }
            ]
        ]
    };

    // Expose plugin globally for LinkMasterΨ2
    window.LinkMasterPlugin = plugin;
})();