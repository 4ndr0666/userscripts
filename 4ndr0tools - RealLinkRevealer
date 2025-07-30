// ==UserScript==
// @name         4ndr0tools - Real Link Revealer (data-url block)
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.2
// @description  Replace forum redirect links with their actual destination using the parent bbCodeBlock--unfurl block's data-url attribute.
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
            if (!realUrl || !/^https?:\/\//.test(realUrl)) continue;
            // Patch href
            link.href = realUrl;
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
