// ==UserScript==
// @name         4ndr0tools - Blob2URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0
// @description  Finds all blob links on a page and adds a button to download their contents.
// @author       4ndr0666
// @downloadURL  https://raw.githubusercontent.com/4ndr0666/userscripts/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://raw.githubusercontent.com/4ndr0666/userscripts/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Ψ-Anarch] Blob Liberator armed.');

    // Find all links on the page whose href starts with "blob:"
    const blobLinks = document.querySelectorAll('a[href^="blob:"]');

    if (blobLinks.length === 0) {
        console.log('[Ψ-Anarch] No blob targets found on this page.');
        return;
    }

    console.log(`[Ψ-Anarch] ${blobLinks.length} blob targets acquired.`);

    blobLinks.forEach((link, index) => {
        // --- Create a custom button for each blob link ---
        const liberationButton = document.createElement('button');
        liberationButton.textContent = `Liberate #${index + 1}`;
        
        // Style the button to be visible and usable
        liberationButton.style.marginLeft = '10px';
        liberationButton.style.padding = '2px 8px';
        liberationButton.style.backgroundColor = '#8A2BE2'; // BlueViolet
        liberationButton.style.color = 'white';
        liberationButton.style.border = '1px solid #4B0082';
        liberationButton.style.borderRadius = '4px';
        liberationButton.style.cursor = 'pointer';
        liberationButton.style.zIndex = '9999';

        // --- Attach the extraction logic to the button's click event ---
        liberationButton.onclick = (e) => {
            e.preventDefault(); // Stop the original link from being followed
            e.stopPropagation(); // Stop the event from bubbling up

            const blobUrl = link.href;
            console.log(`[ATTACK] Initiating liberation for ${blobUrl}`);

            fetch(blobUrl)
                .then(response => response.blob())
                .then(extractedBlob => {
                    const newUrl = URL.createObjectURL(extractedBlob);
                    const forceDownloadLink = document.createElement('a');
                    forceDownloadLink.href = newUrl;
                    forceDownloadLink.download = link.download || `liberated_blob_${index + 1}`;

                    document.body.appendChild(forceDownloadLink);
                    forceDownloadLink.click();
                    document.body.removeChild(forceDownloadLink);

                    URL.revokeObjectURL(newUrl); // Clean up
                    console.log(`[SUCCESS] Payload liberated as "${forceDownloadLink.download}".`);
                })
                .catch(err => {
                    console.error('[FAILURE] Liberation failed:', err);
                });
        };

        // Insert the button right after the original blob link in the page
        link.parentNode.insertBefore(liberationButton, link.nextSibling);
    });
})();
