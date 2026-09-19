// ==UserScript==
// @name         4ndr0tools - Premium Link Revealer 
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.2
// @author       4ndr0666
// @description  Reveal true URLs hidden as "premium" link wrappers using the parent bbCodeBlock--unfurl block's data-url attribute.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Premium%20Link%20Revealer.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Premium%20Link%20Revealer.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://sexyforums.com/*
// @match        *://*.sexyforums.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Does this node (or its children) contain relevant links? Fast filter.
    function hasRedirectLink(node) {
        return node.querySelector
            ? node.querySelector('a[href*="/redirect?to="]')
            : false;
    }

    // Core logic: swap href with the parent data-url
    function rewriteRedirectLinks(root=document) {
        const links = root.querySelectorAll('a[href*="/redirect?to="].link--external.fauxBlockLink-blockLink');
        for (const link of links) {
            const block = link.closest('.bbCodeBlock--unfurl');
            if (!block) continue;
            const realUrl = block.getAttribute('data-url');
            if (!realUrl) continue;

            let parsedUrl;
            try {
                parsedUrl = new URL(realUrl, window.location.href);
            } catch (_) {
                continue;
            }
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') continue;

            // Patch href with validated, normalized URL
            link.href = parsedUrl.href;
            // Optional: visually style or annotate the link
            link.title = "Direct link restored";
            link.classList.add("real-link-restored");
            link.style.color = "#15FFFF";
            link.style.fontWeight = "bold";
        }
    }

    // Initial run
    rewriteRedirectLinks();

    // Observe for dynamic (ajax/spa) content changes
    const observer = new MutationObserver(muts => {
        for (const mut of muts) {
            for (const node of mut.addedNodes) {
                if (node.nodeType !== 1) continue;
                if (hasRedirectLink(node)) {
                    rewriteRedirectLinks(node);
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Optional: custom style for visually confirmed links
    const style = document.createElement('style');
    style.textContent = `
      .real-link-restored {
        color: #15FFFF !important;
        font-weight: bold !important;
        background: rgba(21,255,255,0.07) !important;
        border-radius: 2px;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
})();
