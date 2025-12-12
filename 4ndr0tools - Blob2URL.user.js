// ==UserScript==
// @name         4ndr0tools - Blob2URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0
// @description  Finds blob URLs in links, images, and videos (including dynamic ones), and adds a stateful button to download their contents with intelligent filename generation.
// @author       4ndr0666
// @downloadURL  https://raw.githubusercontent.com/4ndr0666/userscripts/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://raw.githubusercontent.com/4ndr0666/userscripts/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_NAME = '4ndr0tools - Blob2URL';
    const log = (message) => console.log(`[${SCRIPT_NAME}] ${message}`);

    // --- Centralized Configuration ---
    const CONFIG = {
        buttonText: {
            initial: (id) => `Generate #${id}`,
            loading: 'Generating...',
            success: 'Success!',
            failure: 'Failed!',
        },
        buttonColors: {
            initial: '#8A2BE2', // BlueViolet
            loading: '#5A6268', // Muted Grey
            success: '#28A745', // Success Green
            failure: '#DC3545', // Failure Red
        },
        buttonStyle: {
            marginLeft: '10px',
            padding: '2px 8px',
            color: 'white',
            border: '1px solid #4B0082',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: '9999',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            fontSize: '12px',
        },
        resetDelay: 3000, // ms
    };

    // --- Helper Functions ---

    /**
     * Guesses a file extension from a MIME type.
     * @param {string} mimeType The MIME type (e.g., "video/mp4").
     * @returns {string} A file extension (e.g., ".mp4") or an empty string.
     */
    const getExtensionFromMimeType = (mimeType) => {
        if (typeof mimeType !== 'string' || !mimeType.includes('/')) return '';
        const subtype = mimeType.split('/')[1]?.split('+')[0]; // Handles "svg+xml"
        const commonExtensions = {
            'mp4': 'mp4', 'webm': 'webm', 'ogg': 'ogv', 'mpeg': 'mp3', 'wav': 'wav',
            'jpeg': 'jpg', 'png': 'png', 'gif': 'gif', 'svg': 'svg', 'webp': 'webp',
            'pdf': 'pdf', 'zip': 'zip', 'json': 'json',
            'plain': 'txt', 'html': 'html', 'css': 'css', 'javascript': 'js',
        };
        return commonExtensions[subtype] ? `.${commonExtensions[subtype]}` : '';
    };

    /**
     * Creates and styles a download button.
     * @param {string} text The initial text for the button.
     * @returns {HTMLButtonElement} The styled button element.
     */
    const createDownloadButton = (text) => {
        const button = document.createElement('button');
        button.textContent = text;
        Object.assign(button.style, CONFIG.buttonStyle, {
            backgroundColor: CONFIG.buttonColors.initial,
        });
        return button;
    };

    /**
     * Asynchronously handles the blob download lifecycle.
     * @param {MouseEvent} event The click event from the button.
     * @param {HTMLElement} targetElement The element with the blob URL.
     * @param {string} uniqueId The unique ID for this download instance.
     */
    const handleDownload = async (event, targetElement, uniqueId) => {
        event.preventDefault();
        event.stopPropagation();

        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = CONFIG.buttonText.loading;
        button.style.backgroundColor = CONFIG.buttonColors.loading;
        button.title = ''; // Clear any previous error tooltips

        const blobUrl = targetElement.href || targetElement.src;
        log(`Initiating fetch for ${blobUrl}`);

        try {
            const response = await fetch(blobUrl);
            if (!response.ok) {
                throw new Error(`Network response error: ${response.status} ${response.statusText}`);
            }
            const extractedBlob = await response.blob();
            const fileExtension = getExtensionFromMimeType(extractedBlob.type);

            // Intelligently determine the base filename
            const baseFilename = targetElement.download || targetElement.title || targetElement.alt || `generated_blob_${uniqueId}`;
            // Ensure filename has the correct extension without duplication
            const filename = baseFilename.endsWith(fileExtension) ? baseFilename : `${baseFilename.replace(/\.[^/.]+$/, "")}${fileExtension}`;

            const newUrl = URL.createObjectURL(extractedBlob);
            const forceDownloadLink = document.createElement('a');
            forceDownloadLink.href = newUrl;
            forceDownloadLink.download = filename;

            document.body.appendChild(forceDownloadLink);
            forceDownloadLink.click();
            document.body.removeChild(forceDownloadLink);

            URL.revokeObjectURL(newUrl); // Memory cleanup

            log(`Successfully downloaded payload as "${filename}".`);
            button.textContent = CONFIG.buttonText.success;
            button.style.backgroundColor = CONFIG.buttonColors.success;
        } catch (error) {
            console.error(`[${SCRIPT_NAME}] Download failed:`, error);
            button.textContent = CONFIG.buttonText.failure;
            button.style.backgroundColor = CONFIG.buttonColors.failure;
            button.title = error.message; // Add error details on hover
        } finally {
            // Revert button to its initial state after a delay
            setTimeout(() => {
                button.disabled = false;
                button.textContent = CONFIG.buttonText.initial(uniqueId);
                button.style.backgroundColor = CONFIG.buttonColors.initial;
                button.title = '';
            }, CONFIG.resetDelay);
        }
    };

    // --- Main Execution & Observation Logic ---

    /**
     * Scans the DOM for unprocessed elements with blob URLs and instruments them.
     */
    const processElements = () => {
        const selector = 'a[href^="blob:"], img[src^="blob:"], video[src^="blob:"], iframe[src^="blob:"]';
        const elements = document.querySelectorAll(`${selector}:not([data-blob2url-processed])`);

        if (elements.length === 0) return;

        log(`${elements.length} new blob target(s) acquired.`);

        elements.forEach((el, index) => {
            el.dataset.blob2urlProcessed = 'true'; // Mark immediately to prevent race conditions
            const uniqueId = `${Date.now()}-${index}`;
            const button = createDownloadButton(CONFIG.buttonText.initial(uniqueId));

            button.addEventListener('click', (e) => handleDownload(e, el, uniqueId));

            el.parentNode?.insertBefore(button, el.nextSibling);
        });
    };

    // Initial scan on script injection
    log('Armed and performing initial scan.');
    processElements();

    // Establish a MutationObserver to dominate dynamic content
    const observer = new MutationObserver(() => {
        // Re-scan for any new blob-based elements
        processElements();
    });

    log('MutationObserver deployed to monitor for dynamic targets.');
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
