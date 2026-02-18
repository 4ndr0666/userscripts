// ==UserScript==
// @name         4ndr0tools - Forum Link Xtractor
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0
// @author       4ndr0666
// @description  Extracts links from forum threads, handles redirects, and offers copy/download options with persistent local storage.
// @match        https://simpcity.cr/threads/*
// @match        https://forums.socialmediagirls.com/threads/*
// @grant        GM_addStyle
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Forum%20Link%20Xtractor.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Forum%20Link%20Xtractor.user.js
// @run-at       document-idle
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

(function () {
    'use strict';

    // --- Configuration & Constants ---
    const CONFIG = {
        accentColor: '#00f3ff', // Cyan accent
        bgColor: 'rgba(10, 10, 16, 0.95)', // Dark background
        fontFamily: "'Cinzel Decorative', serif, monospace",
        excludeTerms: [
            'adglare.net', 'adtng', 'chatsex.xxx', 'cambb.xxx', 'comments',
            'customers.addonslab.com', 'energizeio.com', 'escortsaffair.com',
            'instagram.com', 'masturbate2gether.com', 'member', 'nudecams.xxx',
            'onlyfans.com', 'porndiscounts.com', 'posts', 'reddit.com',
            'simpcity.su', 'simpcity.cr', 'forums.socialmediagirls.com',
            'stylesfactory.pl', 'theporndude.com', 'thread', 'twitter.com',
            'tiktok.com', 'data:image/svg+xml', 'xenforo.com', 'xentr.net',
            'youtube.com', 'youtu.be', 'x.com', "google.com/chrome"
        ],
        siteTerms: ['.badge', '.reaction', '.bookmark', '.comment']
    };

    // --- Inject Styles ---
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        #psi-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            font-family: 'JetBrains Mono', monospace;
        }

        #psi-toggle-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            width: 64px;
            height: 64px;
            transition: filter 0.3s ease;
            filter: drop-shadow(0 0 5px ${CONFIG.accentColor});
        }

        #psi-toggle-btn:hover {
            filter: drop-shadow(0 0 15px ${CONFIG.accentColor});
        }

        #psi-toggle-btn:active {
            transform: scale(0.95);
        }

        /* SVG Animations */
        @keyframes spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes pulse-opacity { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.3; } }

        .glyph-ring-1 { transform-origin: center; animation: spin-cw 20s linear infinite; }
        .glyph-ring-2 { transform-origin: center; animation: spin-ccw 15s linear infinite; opacity: 0.7; }
        .glyph-hex { stroke-dasharray: 300; stroke-dashoffset: 0; transition: all 0.5s ease; }
        #psi-toggle-btn:hover .glyph-hex { stroke: #fff; filter: drop-shadow(0 0 5px #fff); }

        /* Panel Styles */
        #psi-panel {
            background: ${CONFIG.bgColor};
            border: 1px solid ${CONFIG.accentColor};
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
            width: 280px;
            box-shadow: 0 0 20px rgba(0, 243, 255, 0.2);
            backdrop-filter: blur(5px);
            color: ${CONFIG.accentColor};
            display: none; /* Hidden by default */
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        #psi-panel.visible {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }

        .psi-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 10px;
            font-size: 12px;
        }

        .psi-row:last-child { margin-bottom: 0; }

        .psi-btn {
            background: rgba(0, 243, 255, 0.1);
            border: 1px solid ${CONFIG.accentColor};
            color: ${CONFIG.accentColor};
            padding: 8px 12px;
            cursor: pointer;
            font-family: 'JetBrains Mono', monospace;
            text-transform: uppercase;
            font-size: 11px;
            transition: all 0.2s;
            flex: 1;
            text-align: center;
        }

        .psi-btn:hover {
            background: ${CONFIG.accentColor};
            color: #000;
            box-shadow: 0 0 10px ${CONFIG.accentColor};
        }

        /* Form Elements */
        label { cursor: pointer; user-select: none; }
        input[type="radio"], input[type="checkbox"] { accent-color: ${CONFIG.accentColor}; }

        select {
            background: #000;
            color: ${CONFIG.accentColor};
            border: 1px solid ${CONFIG.accentColor};
            padding: 2px;
            font-family: inherit;
        }

        /* Toast */
        #psi-toast-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 10000;
        }

        .psi-toast {
            background: rgba(0, 0, 0, 0.9);
            border-left: 3px solid ${CONFIG.accentColor};
            color: #fff;
            padding: 12px 20px;
            border-radius: 4px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `;

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // --- DOM Construction ---

    // 1. Create Main Container
    const container = document.createElement('div');
    container.id = 'psi-container';

    // 2. Create SVG Glyph Button (The "4ndr0666_glyph" implementation)
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'psi-toggle-btn';
    toggleBtn.title = 'Initialize Extraction Protocol';

    // SVG Content derived from 4ndr0666_glyph.txt
    toggleBtn.innerHTML = `
        <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${CONFIG.accentColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
            <path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" />
            <path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
            <text x="64" y="70" text-anchor="middle" dominant-baseline="middle" fill="${CONFIG.accentColor}" stroke="none" font-size="48" font-weight="700" style="font-family: 'Cinzel Decorative', serif;">Ψ</text>
        </svg>
    `;

    // 3. Create Options Panel
    const panel = document.createElement('div');
    panel.id = 'psi-panel';

    // Row 1: Actions (Download / Copy)
    const row1 = document.createElement('div');
    row1.className = 'psi-row';

    const rDownload = createRadio('extract-action', 'download', true, 'Download');
    const rCopy = createRadio('extract-action', 'copy', false, 'Copy');

    row1.appendChild(rDownload.wrapper);
    row1.appendChild(rCopy.wrapper);

    // Row 2: Settings (Current Page / Sort)
    const row2 = document.createElement('div');
    row2.className = 'psi-row';

    const cCurrent = createCheckbox('only-current-page', false, 'Current Page Only');
    const cSort = createCheckbox('sort-links', true, 'Sort Links');

    row2.appendChild(cCurrent.wrapper);
    row2.appendChild(cSort.wrapper);

    // Row 3: Separator (Hidden unless Copy is selected)
    const row3 = document.createElement('div');
    row3.className = 'psi-row';
    row3.id = 'row-separator';
    row3.style.display = 'none';

    const sepLabel = document.createElement('span');
    sepLabel.textContent = 'Separator: ';
    const sepSelect = document.createElement('select');
    sepSelect.innerHTML = `<option value="\\n">New Line</option><option value=" ">Space</option>`;

    row3.appendChild(sepLabel);
    row3.appendChild(sepSelect);

    // Row 4: Execute Button
    const row4 = document.createElement('div');
    row4.className = 'psi-row';
    const execBtn = document.createElement('button');
    execBtn.className = 'psi-btn';
    execBtn.textContent = 'EXECUTE EXTRACTION';
    row4.appendChild(execBtn);

    // Assemble Panel
    panel.appendChild(row1);
    panel.appendChild(row2);
    panel.appendChild(row3);
    panel.appendChild(row4);

    // Assemble Container
    container.appendChild(toggleBtn);
    container.appendChild(panel);
    document.body.appendChild(container);

    // Toast Container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'psi-toast-container';
    document.body.appendChild(toastContainer);

    // --- Helpers & Logic ---

    function createRadio(name, value, checked, labelText) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = name;
        input.value = value;
        input.checked = checked;
        input.id = `opt-${value}`;

        const label = document.createElement('label');
        label.htmlFor = `opt-${value}`;
        label.textContent = labelText;
        label.style.marginLeft = '5px';

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        return { wrapper, input };
    }

    function createCheckbox(id, checked, labelText) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        input.checked = checked;

        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
        label.style.marginLeft = '5px';

        wrapper.appendChild(input);
        wrapper.appendChild(label);
        return { wrapper, input };
    }

    function showToast(msg, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'psi-toast';
        toast.textContent = `>> ${msg}`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function decodeBase64Url(base64String) {
        try {
            return decodeURIComponent(atob(base64String).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (e) {
            console.error('Error decoding Base64 URL:', e);
            return null;
        }
    }

    // --- Logic ---

    // Toggle Panel
    toggleBtn.addEventListener('click', () => {
        const isVisible = panel.classList.contains('visible');
        if (isVisible) {
            panel.classList.remove('visible');
        } else {
            panel.classList.add('visible');
        }
    });

    // Toggle Separator Row visibility
    [rDownload.input, rCopy.input].forEach(input => {
        input.addEventListener('change', () => {
            row3.style.display = rCopy.input.checked ? 'flex' : 'none';
        });
    });

    // Extraction Logic
    execBtn.addEventListener('click', () => {
        const pathSegments = window.location.pathname.split('#')[0].split('/');
        const threadsIndex = pathSegments.indexOf("threads");

        // Define filenames based on URL structure
        let threadName = "extracted_links";
        let threadPage = "";

        if (threadsIndex !== -1 && threadsIndex < pathSegments.length - 1) {
            threadName = pathSegments[threadsIndex + 1];
            if (threadsIndex < pathSegments.length - 2) {
                threadPage = pathSegments[threadsIndex + 2];
            }
        }

        // Determine effective scope (Current Page vs Thread)
        const onlyCurrent = cCurrent.input.checked;
        const pageURL = window.location.href.split('#')[0];

        // Scrape current page
        const selectors = [
            'img[class*=bbImage]', 'video source', 'iframe[class=saint-iframe]',
            'iframe', 'section[class=message-attachments] a', 'a',
            'span[data-s9e-mediaembed-iframe]'
        ].join(', ');

        let currentLinks = [];
        document.querySelectorAll(selectors).forEach(link => {
            let href = link.href || link.src;

            // Handle redirects
            if (href && href.includes('goto/link-confirmation?url=')) {
                try {
                    const urlObj = new URL(href);
                    const encodedUrl = urlObj.searchParams.get('url');
                    const decoded = decodeBase64Url(encodedUrl);
                    if (decoded) href = decoded;
                } catch (e) { console.error(e); }
            }

            // Validate
            if (href && href.includes('http')) {
                const isExcluded = CONFIG.excludeTerms.some(term => href.includes(term));
                const isSiteTerm = CONFIG.siteTerms.some(term => link.closest(term));

                if ((!isExcluded && !isSiteTerm) || href.includes('attachment')) {
                    currentLinks.push(href);
                }
            }
        });

        // Store current page links
        currentLinks = [...new Set(currentLinks)]; // Unique
        const savedLinks = JSON.parse(localStorage.getItem('saved_links')) || {};
        savedLinks[pageURL] = currentLinks;
        localStorage.setItem('saved_links', JSON.stringify(savedLinks));

        // Aggregate links based on selection
        let finalLinks = [];
        if (onlyCurrent) {
            finalLinks = currentLinks;
        } else {
            // Aggregate all pages for this thread
            const threadKeys = Object.keys(savedLinks).filter(key => key.includes(threadName));
            finalLinks = threadKeys.flatMap(key => savedLinks[key]);
            showToast(`Aggregated ${threadKeys.length} pages from memory.`);
        }

        // Final Dedupe & Sort
        finalLinks = [...new Set(finalLinks)];
        if (cSort.input.checked) finalLinks.sort();

        if (finalLinks.length === 0) {
            showToast('No links found in buffer.', 4000);
            return;
        }

        // Action: Copy or Download
        const action = document.querySelector('input[name="extract-action"]:checked').value;

        if (action === 'copy') {
            const sep = sepSelect.value === '\\n' ? '\n' : ' ';
            navigator.clipboard.writeText(finalLinks.join(sep)).then(() => {
                showToast(`Copied ${finalLinks.length} links to clipboard.`);
            }).catch(err => showToast('Clipboard Error'));
        } else {
            const blob = new Blob([finalLinks.join('\n')], { type: 'text/plain' });
            const tempLink = document.createElement('a');
            tempLink.href = URL.createObjectURL(blob);
            tempLink.download = `${threadName}${onlyCurrent ? '_' + threadPage : ''}.txt`;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            showToast(`Downloaded ${finalLinks.length} links.`);
        }
    });

    // Auto-scan on load
    // (We reuse the click logic's scanning part for storage updates without triggering action)
    // For efficiency, we just run the scan logic briefly or rely on the user clicking "Execute" which scans first.
    // The original script scanned on load. Let's do a silent scan.
    function silentScan() {
         const selectors = [
            'img[class*=bbImage]', 'video source', 'iframe[class=saint-iframe]',
            'iframe', 'section[class=message-attachments] a', 'a',
            'span[data-s9e-mediaembed-iframe]'
        ].join(', ');

        const pageURL = window.location.href.split('#')[0];
        let links = [];
         document.querySelectorAll(selectors).forEach(link => {
            let href = link.href || link.src;
            if (href && href.includes('goto/link-confirmation?url=')) {
                try {
                    const urlObj = new URL(href);
                    const encodedUrl = urlObj.searchParams.get('url');
                    const decoded = decodeBase64Url(encodedUrl);
                    if (decoded) href = decoded;
                } catch (e) { }
            }
            if (href && href.includes('http')) {
                const isExcluded = CONFIG.excludeTerms.some(term => href.includes(term));
                const isSiteTerm = CONFIG.siteTerms.some(term => link.closest(term));
                if ((!isExcluded && !isSiteTerm) || href.includes('attachment')) {
                    links.push(href);
                }
            }
        });
        links = [...new Set(links)];
        let savedLinks = JSON.parse(localStorage.getItem('saved_links')) || {};
        savedLinks[pageURL] = links;
        localStorage.setItem('saved_links', JSON.stringify(savedLinks));
        console.log(`[4NDR0666] Buffered ${links.length} links.`);
    }

    silentScan();

})();
