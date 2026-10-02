// ==UserScript==
// @name         4ndr0tools - Forum Link Xtractor
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.1.0
// @description  Link xtractor, Invisitext revealer, and inline post reply viewer.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @author       4ndr0666
// @match        *://forums.socialmediagirls.com/*
// @match        *://simpcity.su/*
// @match        *://*.simpcity.su/*
// @match        *://simpcity.cr/*
// @match        *://*.simpcity.cr/*
// @match        *://start.me/*
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @connect      *
// @license      MIT
// ==/UserScript==


/* ═══ SUITE PROMOTION 3.0.0 ═══════════════════════════════════════════
 * Forum Link Xtractor BETA v2.1.0 promoted: XenForo Enhancer superset — extraction w/ download+copy radio flows, invisi-text revealer, inline reply viewer, optimized regex precompile; supersedes stable v1.0.
 * Retired duplicate: 4ndr0tools - Forum Link Xtractor.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    console.log('%c[4NDR0666OS] XenForo Enhancer v1.0.0-Ψ — INITIATING SEQUENCE', 'color:#00E5FF; font-family:monospace; font-weight:bold;');

    // =========================================================================
    // MODULE 0: GLOBAL CONFIGURATION & OPTIMIZED REGEX
    // =========================================================================
    const CONFIG = {
        accentColor: '#00E5FF',
        yellowColor: '#FFD700',
        redColor: '#FF3366',
        bgColor: 'rgba(10, 15, 26, 0.95)',
        excludeTerms: [
            'adglare.net', 'adtng', 'chatsex.xxx', 'cambb.xxx', 'comments',
            'customers.addonslab.com', 'energizeio.com', 'escortsaffair.com',
            'instagram.com', 'masturbate2gether.com', 'member', 'nudecams.xxx',
            'onlyfans.com', 'porndiscounts.com', 'posts', 'reddit.com',
            'stylesfactory.pl', 'theporndude.com', 'thread', 'twitter.com',
            'tiktok.com', 'data:image/svg+xml', 'xenforo.com', 'xentr.net',
            'youtube.com', 'youtu.be', 'x.com', 'google.com/chrome',
            'login', 'register', 'search', 'whats-new', window.location.hostname
        ],
        siteTerms: ['.badge', '.reaction', '.bookmark', '.comment', '.nav-link', '.p-navEl']
    };

    // Pre-compile Regex for O(1) high-speed matching during scans
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const EXCLUDE_REGEX = new RegExp(CONFIG.excludeTerms.map(escapeRegExp).join('|'), 'i');

    const MAIN_STYLES = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

        /* --- 4ndr0tools UI --- */
        #psi-container {
            position: fixed; top: 20px; right: 20px; z-index: 999999;
            display: flex; flex-direction: column; align-items: flex-end;
            font-family: 'JetBrains Mono', monospace; pointer-events: none;
        }
        #psi-container > * { pointer-events: auto; }

        #psi-toggle-btn {
            background: none; border: none; cursor: pointer; padding: 0;
            width: 56px; height: 56px; transition: filter 0.3s ease, transform 0.2s ease;
            filter: drop-shadow(0 0 8px ${CONFIG.accentColor});
        }
        #psi-toggle-btn:hover { filter: drop-shadow(0 0 18px ${CONFIG.accentColor}); transform: scale(1.05); }
        #psi-toggle-btn:active { transform: scale(0.95); }

        /* Panel */
        #psi-panel {
            background: ${CONFIG.bgColor}; border: 1px solid ${CONFIG.accentColor};
            border-radius: 6px; padding: 15px; margin-top: 10px; width: 280px;
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.2); backdrop-filter: blur(5px);
            color: ${CONFIG.accentColor}; display: none; opacity: 0;
            transform: translateY(-10px); transition: opacity 0.3s ease, transform 0.3s ease;
        }
        #psi-panel.visible { display: block; opacity: 1; transform: translateY(0); }
        .psi-row { display: flex; align-items: center; margin-bottom: 10px; gap: 10px; font-size: 11px; font-weight: bold; }
        .psi-row:last-child { margin-bottom: 0; }

        .psi-btn {
            background: rgba(0, 229, 255, 0.1); border: 1px solid ${CONFIG.accentColor};
            color: ${CONFIG.accentColor}; padding: 8px 12px; cursor: pointer;
            font-family: inherit; text-transform: uppercase; font-weight: bold;
            font-size: 11px; transition: all 0.2s; flex: 1; text-align: center; border-radius: 4px;
        }
        .psi-btn:hover { background: ${CONFIG.accentColor}; color: #000; box-shadow: 0 0 10px ${CONFIG.accentColor}; }

        /* Form Elements */
        label { cursor: pointer; user-select: none; }
        input[type="radio"], input[type="checkbox"] { accent-color: ${CONFIG.accentColor}; cursor: pointer; }
        select { background: #000; color: ${CONFIG.accentColor}; border: 1px solid ${CONFIG.accentColor}; padding: 2px; font-family: inherit; outline: none; }

        /* Toast */
        #psi-toast-container {
            position: fixed; bottom: 20px; right: 20px; display: flex;
            flex-direction: column; gap: 10px; z-index: 1000000; pointer-events: none;
        }
        .psi-toast {
            background: rgba(10, 15, 26, 0.95); border-left: 3px solid ${CONFIG.accentColor};
            border-right: 1px solid ${CONFIG.accentColor}; border-top: 1px solid ${CONFIG.accentColor}; border-bottom: 1px solid ${CONFIG.accentColor};
            color: ${CONFIG.accentColor}; padding: 12px 20px; border-radius: 4px;
            font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: bold;
            box-shadow: 0 5px 15px rgba(0,229,255,0.2); animation: slideIn 0.3s ease-out forwards;
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        /* SVG Animations */
        @keyframes spin-cw { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .glyph-ring-1 { transform-origin: center; animation: spin-cw 20s linear infinite; }
        .glyph-ring-2 { transform-origin: center; animation: spin-ccw 15s linear infinite; opacity: 0.7; }
        .glyph-hex { stroke-dasharray: 300; stroke-dashoffset: 0; transition: all 0.5s ease; }
        #psi-toggle-btn:hover .glyph-hex { stroke: #fff; filter: drop-shadow(0 0 5px #fff); }

        /* --- MODULE: INVISITEXT --- */
        span[style*="Transparent"], span[style*="transparent"], span[style*="TRANSPARENT"] {
            border: 1px dotted #99CC00; background: #000000; color: rgba(153, 204, 0, 0.5) !important;
            transition: color 0.3s;
        }
        span[style*="Transparent"]:hover, span[style*="transparent"]:hover, span[style*="TRANSPARENT"]:hover {
            color: #99CC00 !important;
        }

        /* --- MODULE: REPLIES UI --- */
        .sc-replies-button {
            margin-top: 10px; cursor: pointer; padding: 6px 12px; font-weight: bold;
            border: 1px solid ${CONFIG.accentColor}; background-color: rgba(0, 229, 255, 0.05);
            color: ${CONFIG.accentColor}; border-radius: 4px; font-size: 11px;
            font-family: 'JetBrains Mono', monospace; transition: all 0.2s;
        }
        .sc-replies-button:hover { background-color: ${CONFIG.accentColor}; color: #000; box-shadow: 0 0 8px ${CONFIG.accentColor}; }
        .sc-replies-container {
            margin-top: 10px; border: 1px solid ${CONFIG.accentColor}; padding: 10px;
            background-color: rgba(10, 15, 26, 0.8); border-radius: 4px;
        }
        .sc-replies-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; color: #ddd; }
        .sc-replies-table th, .sc-replies-table td { padding: 8px; border: 1px solid #333; text-align: left; }
        .sc-replies-table th { background: rgba(0, 229, 255, 0.1); text-align: center; color: ${CONFIG.accentColor}; }
        .sc-replies-table tr:nth-child(even) { background-color: rgba(255, 255, 255, 0.02); }
        .sc-replies-table a { color: ${CONFIG.accentColor}; text-decoration: none; font-weight: bold; }
        .sc-replies-table a:hover { text-decoration: underline; color: ${CONFIG.yellowColor}; }
    `;

    GM_addStyle(MAIN_STYLES);

    // =========================================================================
    // MODULE 1: LINK XTRACTOR & STORAGE MANAGER
    // =========================================================================
    function decodeBase64Url(base64String) {
        try {
            return decodeURIComponent(atob(base64String).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        } catch { return null; }
    }

    function saveLinksToBuffer(pageURL, linksArray) {
        if (!linksArray || linksArray.length === 0) return;
        try {
            let saved = JSON.parse(localStorage.getItem('psi_link_buffer') || '{}');

            // FIFO Pruning: Max 50 pages stored to prevent QuotaExceededError
            const keys = Object.keys(saved);
            if (keys.length > 50) {
                delete saved[keys[0]];
            }

            saved[pageURL] = linksArray;
            localStorage.setItem('psi_link_buffer', JSON.stringify(saved));
        } catch (e) {
            console.warn('[Ψ-4NDR0666] Storage quota exceeded. Buffer save aborted.', e);
        }
    }

    function scanPage() {
        const selectors = [
            'img[class*=bbImage]', 'video source', 'iframe[class*=saint-iframe]',
            'iframe', 'section[class*=message-attachments] a', 'a',
            'span[data-s9e-mediaembed-iframe]'
        ].join(', ');

        const rawLinks = new Set();

        document.querySelectorAll(selectors).forEach(link => {
            let href = link.href || link.src;
            if (!href) return;

            // EAFP Decode
            if (href.includes('goto/link-confirmation?url=')) {
                try {
                    const urlObj = new URL(href);
                    const encodedUrl = urlObj.searchParams.get('url');
                    const decoded = decodeBase64Url(encodedUrl);
                    if (decoded) href = decoded;
                } catch { /* Ignore malformed */ }
            }

            if (href.startsWith('http')) {
                // O(1) exclusion regex evaluation
                if (EXCLUDE_REGEX.test(href)) return;

                // DOM closeness evaluation
                const isSiteTerm = CONFIG.siteTerms.some(term => link.closest(term));
                if (!isSiteTerm || href.includes('attachment')) {
                    rawLinks.add(href);
                }
            }
        });

        return Array.from(rawLinks);
    }

    function initLinkXtractor() {
        const container = document.createElement('div');
        container.id = 'psi-container';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'psi-toggle-btn';
        toggleBtn.title = 'Initialize Extraction Protocol';
        toggleBtn.innerHTML = `
            <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${CONFIG.accentColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
                <path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" />
                <path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
                <text x="64" y="70" text-anchor="middle" dominant-baseline="middle" fill="${CONFIG.accentColor}" stroke="none" font-size="48" font-weight="700" style="font-family: 'Cinzel Decorative', serif;">Ψ</text>
            </svg>
        `;

        const panel = document.createElement('div');
        panel.id = 'psi-panel';

        function createUIElement(type, id, name, value, checked, labelText) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex'; wrapper.style.alignItems = 'center';
            const input = document.createElement('input');
            input.type = type; input.id = id; input.checked = checked;
            if (name) input.name = name;
            if (value) input.value = value;
            const label = document.createElement('label');
            label.htmlFor = id; label.textContent = labelText; label.style.marginLeft = '5px';
            wrapper.appendChild(input); wrapper.appendChild(label);
            return { wrapper, input };
        }

        // GUI Rows
        const row1 = document.createElement('div'); row1.className = 'psi-row';
        const rDownload = createUIElement('radio', 'opt-dl', 'extract-action', 'download', true, 'Download');
        const rCopy = createUIElement('radio', 'opt-cp', 'extract-action', 'copy', false, 'Copy');
        row1.append(rDownload.wrapper, rCopy.wrapper);

        const row2 = document.createElement('div'); row2.className = 'psi-row';
        const cCurrent = createUIElement('checkbox', 'opt-cur', null, null, false, 'Current Page Only');
        const cSort = createUIElement('checkbox', 'opt-sort', null, null, true, 'Sort Links');
        row2.append(cCurrent.wrapper, cSort.wrapper);

        const row3 = document.createElement('div'); row3.className = 'psi-row';
        row3.id = 'row-separator'; row3.style.display = 'none';
        const sepLabel = document.createElement('span'); sepLabel.textContent = 'Separator: ';
        const sepSelect = document.createElement('select');
        sepSelect.innerHTML = `<option value="\\n">New Line</option><option value=" ">Space</option>`;
        row3.append(sepLabel, sepSelect);

        const row4 = document.createElement('div'); row4.className = 'psi-row';
        const execBtn = document.createElement('button');
        execBtn.className = 'psi-btn'; execBtn.textContent = 'EXECUTE EXTRACTION';
        row4.appendChild(execBtn);

        panel.append(row1, row2, row3, row4);
        container.append(toggleBtn, panel);
        document.body.appendChild(container);

        const toastContainer = document.createElement('div');
        toastContainer.id = 'psi-toast-container';
        document.body.appendChild(toastContainer);

        function showToast(msg, duration = 3000) {
            const toast = document.createElement('div');
            toast.className = 'psi-toast'; toast.textContent = `>> ${msg}`;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        // GUI Listeners
        toggleBtn.addEventListener('click', () => panel.classList.toggle('visible'));
        [rDownload.input, rCopy.input].forEach(input => {
            input.addEventListener('change', () => row3.style.display = rCopy.input.checked ? 'flex' : 'none');
        });

        execBtn.addEventListener('click', () => {
            const pathSegments = window.location.pathname.split('#')[0].split('/');
            const threadName = pathSegments.includes("threads") ? pathSegments[pathSegments.indexOf("threads") + 1] : "extracted_links";
            const pageURL = window.location.href.split('#')[0];

            // Real-time scan and save
            const currentLinks = scanPage();
            saveLinksToBuffer(pageURL, currentLinks);

            let finalLinksSet = new Set();

            if (cCurrent.input.checked) {
                currentLinks.forEach(link => finalLinksSet.add(link));
            } else {
                try {
                    const savedLinks = JSON.parse(localStorage.getItem('psi_link_buffer') || '{}');
                    const threadKeys = Object.keys(savedLinks).filter(key => key.includes(threadName));
                    threadKeys.forEach(key => {
                        savedLinks[key].forEach(link => finalLinksSet.add(link));
                    });
                    showToast(`Aggregated ${threadKeys.length} pages.`);
                } catch {
                    showToast('Error reading buffer. Falling back to current page.', 4000);
                    currentLinks.forEach(link => finalLinksSet.add(link));
                }
            }

            let finalLinks = Array.from(finalLinksSet);
            if (cSort.input.checked) finalLinks.sort();

            if (finalLinks.length === 0) {
                showToast('No links found.', 4000);
                return;
            }

            if (rCopy.input.checked) {
                const sep = sepSelect.value === '\\n' ? '\n' : ' ';
                const payload = finalLinks.join(sep);

                if (typeof GM_setClipboard !== 'undefined') {
                    GM_setClipboard(payload);
                    showToast(`Copied ${finalLinks.length} links.`);
                } else if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(payload)
                        .then(() => showToast(`Copied ${finalLinks.length} links.`))
                        .catch(() => showToast('Clipboard Error'));
                }
            } else {
                const blob = new Blob([finalLinks.join('\n')], { type: 'text/plain' });
                const tempLink = document.createElement('a');
                tempLink.href = URL.createObjectURL(blob);
                tempLink.download = `${threadName}.txt`;
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
                URL.revokeObjectURL(tempLink.href);
                showToast(`Downloaded ${finalLinks.length} links.`);
            }
        });

        // Silent Buffer on Load
        const initialLinks = scanPage();
        saveLinksToBuffer(window.location.href.split('#')[0], initialLinks);
        console.log(`[Ψ-4NDR0666] Background index complete. Buffered ${initialLinks.length} entities.`);
    }

    // =========================================================================
    // MODULE 2: REPLY VIEWER (Promisified & Hardened)
    // =========================================================================

    /** Async wrapper for GM_xmlhttpRequest using the manager's native
     *  timeout — actually aborts the underlying connection (the previous
     *  AbortController shim only rejected the promise late; the request
     *  itself kept running). */
    function fetchAnswersAsync(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                timeout: 12000,
                onerror: (err) => reject(err),
                ontimeout: () => reject(new Error('Request timed out')),
                onabort: () => reject(new Error('Request aborted')),
                onload: (res) => {
                    if (res.status >= 200 && res.status < 300) {
                        resolve(res.responseText);
                    } else {
                        reject(new Error(`HTTP ${res.status}`));
                    }
                }
            });
        });
    }

    function injectReplyButtons() {
        const fullDomain = window.location.hostname;
        const mainDomain = fullDomain.split('.').slice(-2).join('.'); // Extracts simpcity.su from www.simpcity.su

        const posts = document.querySelectorAll(".message.message--post .message-inner");

        posts.forEach(postElement => {
            const mainContainer = postElement.querySelector('.message-main.js-quickEditTarget') || postElement;
            if (!mainContainer || mainContainer.querySelector('.sc-replies-button')) return;

            const btn = document.createElement('button');
            btn.textContent = "View Replies";
            btn.className = "sc-replies-button";
            mainContainer.appendChild(btn);

            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                let repliesContainer = postElement.querySelector('.sc-replies-container');

                if (repliesContainer) {
                    const isHidden = repliesContainer.style.display === 'none';
                    repliesContainer.style.display = isHidden ? 'block' : 'none';
                    btn.textContent = isHidden ? "Hide Replies" : "View Replies";
                    return;
                }

                // Create container
                repliesContainer = document.createElement('div');
                repliesContainer.className = 'sc-replies-container';
                repliesContainer.innerHTML = `<strong style="color: ${CONFIG.yellowColor}">Hunting replies...</strong>`;
                mainContainer.appendChild(repliesContainer);
                btn.textContent = "Hide Replies";

                // EAFP ID Extraction
                try {
                    const messageContent = postElement.closest('.message[data-content]');
                    const postId = messageContent?.getAttribute('data-content')?.replace('post-', '');
                    const headerLink = postElement.querySelector('.message-attribution-main a[href*="/threads/"]');
                    const threadIdMatch = headerLink?.getAttribute("href")?.match(/\.([0-9]+)\/post-/);
                    const threadId = threadIdMatch ? threadIdMatch[1] : null;

                    if (!postId || !threadId) throw new Error("ID resolution failed.");

                    const searchURL = `https://${mainDomain}/search/1/?q=post-${postId}&t=post&c[thread]=${threadId}&o=date`;

                    const htmlText = await fetchAnswersAsync(searchURL);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlText, "text/html");
                    const answerBlocks = doc.querySelectorAll("li.block-row.block-row--separated.js-inlineModContainer[data-author]");

                    if (!answerBlocks || answerBlocks.length === 0) {
                        repliesContainer.innerHTML = "<strong>No replies found.</strong>";
                        return;
                    }

                    repliesContainer.innerHTML = "";
                    const table = document.createElement("table");
                    table.className = "sc-replies-table";
                    table.innerHTML = `<thead><tr><th>Post #</th><th>Date</th><th>Reply Snippet</th></tr></thead>`;
                    const tbody = document.createElement("tbody");

                    answerBlocks.forEach((block) => {
                        const postLink = block.querySelector('.contentRow-main a[href*="/post-"]');
                        const postTime = block.querySelector('time.u-dt');
                        const contentSnippet = block.querySelector('.contentRow-snippet');

                        if (postLink?.href && postTime && contentSnippet) {
                            const row = document.createElement("tr");
                            const postIdMatch = postLink.href.match(/\/post-(\d+)/);
                            const postIdText = postIdMatch ? `#${postIdMatch[1]}` : 'Link';

                            row.innerHTML = `
                                <td style="text-align:center"><a href="${postLink.href}" target="_blank">${postIdText}</a></td>
                                <td style="text-align:center; white-space:nowrap">${postTime.textContent.trim()}</td>
                                <td>${contentSnippet.textContent.trim()}</td>
                            `;
                            tbody.appendChild(row);
                        }
                    });
                    table.appendChild(tbody);
                    repliesContainer.appendChild(table);

                } catch (err) {
                    console.error('[Ψ-4NDR0666] Reply fetch error:', err);
                    repliesContainer.innerHTML = `<strong style="color:${CONFIG.redColor}">Fetch Error: ${err.message}</strong>`;
                }
            });
        });
    }

    // =========================================================================
    // MODULE 3: DEFENSIVE ORCHESTRATION (Dynamic Injection)
    // =========================================================================
    let _debounceTimer = null;

    function bootstrap() {
        if (!document.body) {
            setTimeout(bootstrap, 50);
            return;
        }

        // Init isolated core modules
        initLinkXtractor();

        // Initial synchronous DOM pass
        setTimeout(injectReplyButtons, 800);

        // Bounded structural observer for lazy-loaded posts/pages
        const observer = new MutationObserver((mutations) => {
            const structural = mutations.some(m => m.addedNodes.length > 0);
            if (!structural) return;

            clearTimeout(_debounceTimer);
            _debounceTimer = setTimeout(injectReplyButtons, 400);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Garbage collection
        window.addEventListener('beforeunload', () => observer.disconnect(), { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

})();
