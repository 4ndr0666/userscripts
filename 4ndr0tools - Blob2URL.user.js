// ==UserScript==
// @name         4ndr0tools - Blob2URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      6.1
// @author       4ndr0666
// @description  Universal blob exfiltration, interactive asset sniffing, CSP/CORS bypass.
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png      
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_ID = 'Ψ-blob2url';
    const log = (m) => console.log(`%c[${SCRIPT_ID}] %c${m}`, "color: #00ff41; font-weight: bold;", "color: #bbb;");

    // Privileged blob fetcher — bypasses CORS/CSP
    const hardenedFetch = (url) => new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: "blob",
            onload: (res) => resolve(res.response),
            onerror: (err) => reject(err)
        });
    });

    const CONFIG = {
        styles: `
            .psi-btn { margin-left:8px; padding:3px 10px; color:#00ff41; background:#000; border:1px solid #00ff41; border-radius:2px; cursor:crosshair; z-index:2147483647; font-family:monospace; font-size:10px; text-transform:uppercase; box-shadow:0 0 5px #00ff41; transition:0.2s; }
            .psi-btn:hover { background:#00ff41; color:#000; }
            .psi-btn.loading { background:#555; color:#ccc; border-color:#555; box-shadow:none; }
            .psi-btn.success { background:#004400; color:#00ff41; box-shadow:0 0 10px #00ff41; }
            .psi-btn.fail { background:#440000; color:#ff0000; border-color:#ff0000; box-shadow:0 0 10px #ff0000; }
            .psi-sniff-mask { background:rgba(0,255,65,0.1); border:1px solid #00ff41; position:fixed; z-index:10000; pointer-events:none; }
        `,
        labels: { init: "Ψ_EXTRACT", load: "Ψ_PROC...", win: "Ψ_DONE", fail: "Ψ_ERR" },
        mimeExt: {
            'video/mp4':'.mp4', 'video/webm':'.webm',
            'image/png':'.png', 'image/jpeg':'.jpg', 'image/webp':'.webp',
            'application/pdf':'.pdf'
        }
    };
    GM_addStyle(CONFIG.styles);

    // Core blob hooking with GM_download (stealthier than DOM injection)
    const hookAsset = async (el) => {
        const url = el.href || el.src || el.currentSrc;
        if (!url || !url.startsWith('blob:')) return;

        const btn = document.createElement('button');
        btn.className = 'psi-btn';
        btn.textContent = CONFIG.labels.init;

        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();

            btn.textContent = CONFIG.labels.load;
            btn.classList.add('loading');

            try {
                const blob = await hardenedFetch(url);
                const ext = CONFIG.mimeExt[blob.type] || '.bin';
                const name = `exfiltrated_${Date.now()}${ext}`;
                const dlUrl = URL.createObjectURL(blob);

                GM_download({
                    url: dlUrl,
                    name: name,
                    onload: () => {
                        URL.revokeObjectURL(dlUrl);
                        btn.textContent = CONFIG.labels.win;
                        btn.classList.remove('loading');
                        btn.classList.add('success');
                    }
                });
            } catch (err) {
                btn.textContent = CONFIG.labels.fail;
                btn.classList.remove('loading');
                btn.classList.add('fail');
                log(`Extraction failed: ${err}`);
            }
        };

        el.insertAdjacentElement('afterend', btn);
    };

    // Interactive sniffer — GAP MITIGATION: explicit sniffer references (lexical scope hardened)
    let sniffMode = false;
    const sniffer = {
        mask: document.createElement('div'),
        activeEl: null,
        init() {
            this.mask.className = 'psi-sniff-mask';
            document.body.appendChild(this.mask);
            this.mask.style.display = 'none';
        },
        toggle() {
            sniffMode = !sniffMode;
            log(`Sniffer ${sniffMode ? 'ACTIVE // MOVE CURSOR + ENTER TO CAPTURE' : 'OFF'}`);
            this.mask.style.display = sniffMode ? 'block' : 'none';
            if (sniffMode) document.addEventListener('mousemove', this.track);
            else {
                document.removeEventListener('mousemove', this.track);
                this.activeEl = null;
            }
        },
        track: (e) => {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (!el || el === document.body || el === sniffer.mask) return;
            const rect = el.getBoundingClientRect();
            Object.assign(sniffer.mask.style, {
                width: `${rect.width + 4}px`,
                height: `${rect.height + 4}px`,
                left: `${rect.left - 2}px`,
                top: `${rect.top - 2}px`
            });
            sniffer.activeEl = el;
        },
        capture() {
            if (!sniffer.activeEl) return;
            let url = sniffer.activeEl.src || sniffer.activeEl.href;
            if (!url) {
                const bg = getComputedStyle(sniffer.activeEl).backgroundImage;
                url = bg.match(/url\(["']?(.*?)["']?\)/)?.[1];
            }
            if (url) {
                GM_setClipboard(url);
                log(`CAPTURED → clipboard: ${url.substring(0,100)}${url.length > 100 ? '...' : ''}`);
            } else {
                log('No URL detected');
            }
            // Keep sniffer active after capture
        }
    };
    sniffer.init();

    // Heuristic DOM engine
    const deploy = () => {
        const selector = 'a[href^="blob:"], img[src^="blob:"], video[src^="blob:"], audio[src^="blob:"], source[src^="blob:"]';
        document.querySelectorAll(selector).forEach(el => {
            if (el.hasAttribute('data-psi-locked')) return;
            el.setAttribute('data-psi-locked', 'true');
            hookAsset(el);
        });
    };

    const observer = new MutationObserver(deploy);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    deploy(); // Initial scan

    // Tradecraft controls
    GM_registerMenuCommand("Ψ: Toggle Universal Sniffer", () => sniffer.toggle());
    GM_registerMenuCommand("Ψ: Force DOM Re-scan", deploy);

    document.addEventListener('keydown', (e) => {
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            sniffer.toggle();
        }
        if (sniffMode && e.key === 'Enter') {
            e.preventDefault();
            sniffer.capture();
        }
    });

    log("Ψ-4ndr0tools - blob2url_v6.1_ONLINE");
})();
