// ==UserScript==
// @name         4ndr0tools - m3u8++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.0.1
// @author       4ndr0666
// @description  Automatically displays the m3u8 url for ANY video playing in the top right corner of the video. Click url to copy or click download to use the webapp "tools.thatwind.com". Also injects Play buttons next to magnet links on every page, relaying them to www.diancigaoshou.com.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20m3u8++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20m3u8++.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*/*
// @exclude      *://www.diancigaoshou.com/*
// @require      https://cdn.jsdelivr.net/npm/m3u8-parser@4.7.1/dist/m3u8-parser.min.js
// @connect      *
// @grant        unsafeWindow
// @grant        GM_openInTab
// @grant        GM.openInTab
// @grant        GM_getValue
// @grant        GM.getValue
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM_deleteValue
// @grant        GM.deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_download
// @run-at       document-start
// ==/UserScript==
// 5.0.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.


/* ═══ SUITE PROMOTION 5.0.0 ═══════════════════════════════════════════
 * m3u8++BETA v4.5 promoted: G1–G10 GUP gap-mitigation set + magnet-play relays are a strict superset of stable v4.4 (verified by diff + embedded changelog).
 * Retired duplicate: 4ndr0tools - m3u8++.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

/*
 * CHANGELOG v4.5 (GUP v5.3 audit — stepwise gap mitigation, superset over v4.4):
 *  G1  doM3U: resolve XHR-supplied relative and root-relative playlist URLs against
 *      location.href — previously threw "Invalid URL" (unhandled rejection) and silently
 *      dropped those playlists from the aggregator.
 *  G2  doM3U: fire-and-forget async capture now resolves internally (scoped console.debug)
 *      and the content-fetch fallback carries a 15s AbortController timeout.
 *  G3  doM3U: explicit typeof guard + one-time console.warn when the m3u8-parser @require
 *      failed to load, instead of a silent ReferenceError per capture.
 *  G4  thatwind proxy: GM_xmlhttpRequest transport now carries a hard 300s timeout plus
 *      ontimeout/onabort rejection handlers — the proxied fetch() promise can no longer
 *      hang forever.
 *  G5  thatwind proxy: synthetic Response gains .ok and .json() (fetch-compat surface).
 *  G6  mgmapi.message: optional type parameter ("success"/"error" accent border) — the
 *      "Link copied" call site already passed 'success', which was silently discarded.
 *  G7  mgmapi.download: openInTab fallback branch now returns the tab handle.
 *  G8  showVideo: all runtime interpolations into the item template are HTML-escaped
 *      (defense-in-depth; display byte-identical for normal URLs).
 *  G9  mgmapi.copyText: guarded host (document.body may be null at document-start).
 *  G10 XHR sniff interceptor: empty catch replaced with scoped console.debug logging.
 */

(function () {
    'use strict';
    const mgmapi = {
        addStyle(s) {
            let style = document.createElement("style");
            style.innerHTML = s;
            document.documentElement.appendChild(style);
        },
        async getValue(name, defaultVal) {
            return await ((typeof GM_getValue === "function") ? GM_getValue : GM.getValue)(name, defaultVal);
        },
        async setValue(name, value) {
            return await ((typeof GM_setValue === "function") ? GM_setValue : GM.setValue)(name, value);
        },
        async deleteValue(name) {
            return await ((typeof GM_deleteValue === "function") ? GM_deleteValue : GM.deleteValue)(name);
        },
        openInTab(url, open_in_background = false) {
            return ((typeof GM_openInTab === "function") ? GM_openInTab : GM.openInTab)(url, open_in_background);
        },
        xmlHttpRequest(details) {
            return ((typeof GM_xmlhttpRequest === "function") ? GM_xmlhttpRequest : GM.xmlHttpRequest)(details);
        },
        download(details) {

            if (typeof GM_download === "function") {
                this.message("\nDownloading, pay attention to the browser's download pop-up.", 3000);
                return GM_download(details);
            } else {
                // G7 (audit v4.5): return the fallback result — the GM_download branch returns its
                // control object, so the openInTab branch must not silently swallow its handle.
                return this.openInTab(details.url);
            }
        },
        copyText(text) {
            copyTextToClipboard(text);
            function copyTextToClipboard(text) {
                var copyFrom = document.createElement("textarea");
                copyFrom.textContent = text;
                // G9 (audit v4.5): the script runs at document-start where document.body may be
                // null — mirror message()'s guarded host so clipboard fallback never throws on boot.
                const host = document.body || document.documentElement;
                host.appendChild(copyFrom);
                copyFrom.select();
                document.execCommand('copy');
                copyFrom.blur();
                host.removeChild(copyFrom);
            }
        },
        message(text, disappearTime = 5000, type = "info") {
            const id = "f8243rd238-gm-message-panel";
            let p = document.querySelector(`#${id}`);
            if (!p) {
                p = document.createElement("div");
                p.id = id;
                p.style = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: end;
                    z-index: 999999999999999;
                `;
                (document.body || document.documentElement).appendChild(p);
            }
            let mdiv = document.createElement("div");
            mdiv.innerText = text;
            mdiv.style = `
                padding: 3px 8px;
                border-radius: 5px;
                background: black;
                box-shadow: #000 1px 2px 5px;
                margin-top: 10px;
                font-size: small;
                color: #fff;
                text-align: right;
            `;
            // G6 (audit v4.5): the "Link copied" call site already passed a 'success' type that the
            // old signature silently discarded. Type is now consumed: success/error get an accent
            // border; every pre-existing 2-arg call renders byte-identically (default "info").
            if (type === "success") {
                mdiv.style.borderLeft = "3px solid #00E5FF";
            } else if (type === "error") {
                mdiv.style.borderLeft = "3px solid #ff0055";
            }
            p.appendChild(mdiv);
            setTimeout(() => {
                p.removeChild(mdiv);
            }, disappearTime);
        }
    };

    if (location.host === "tools.thatwind.com" || location.host === "localhost:3000") {
        mgmapi.addStyle("#userscript-tip{display:none !important;}");

        const _fetch = unsafeWindow.fetch;
        unsafeWindow.fetch = async function (...args) {
            try {
                let response = await _fetch(...args);
                if (response.status !== 200) throw new Error(response.status);
                return response;
            } catch (e) {
                if (args.length == 1) {
                    console.log(`Proxy request: ${args[0]}`);
                    return await new Promise((resolve, reject) => {
                        let referer = new URLSearchParams(location.hash.slice(1)).get("referer");
                        let headers = {};
                        if (referer) {
                            referer = new URL(referer);
                            headers = {
                                "origin": referer.origin,
                                "referer": referer.href
                            };
                        }
                        mgmapi.xmlHttpRequest({
                            method: "GET",
                            url: args[0],
                            responseType: 'arraybuffer',
                            headers,
                            // G4 (audit v4.5): hard timeout (D2/4.2) + terminal handlers for every
                            // transport outcome — previously a timed-out or aborted request left the
                            // proxied fetch() promise pending forever. 300s is deliberately generous
                            // because the webapp streams large media segments through this channel.
                            timeout: 300000,
                            onload(r) {
                                resolve({
                                    status: r.status,
                                    // G5 (audit v4.5): fetch-compat surface — .ok and .json() were
                                    // absent from the synthetic response, breaking webapp code that
                                    // branches on response.ok or parses JSON bodies.
                                    ok: r.status >= 200 && r.status < 300,
                                    headers: new Headers(r.responseHeaders.split("\n").filter(n => n).map(s => s.split(/:\s*/)).reduce((all, [a, b]) => { all[a] = b; return all; }, {})),
                                    async text() {
                                        return r.responseText;
                                    },
                                    async json() {
                                        return JSON.parse(r.responseText);
                                    },
                                    async arrayBuffer() {
                                        return r.response;
                                    }
                                });
                            },
                            onerror() {
                                reject(new Error());
                            },
                            ontimeout() {
                                reject(new Error("proxy request timed out"));
                            },
                            onabort() {
                                reject(new Error("proxy request aborted"));
                            }
                        });
                    });
                } else {
                    throw e;
                }
            }
        }

        return;
    }


    window.addEventListener("message", async (e) => {
        if (e.data === "3j4t9uj349-gm-get-title") {
            let name = `top-title-${Date.now()}`;
            await mgmapi.setValue(name, document.title);
            e.source.postMessage(`3j4t9uj349-gm-top-title-name:${name}`, "*");
        }
    });

    function getTopTitle() {
        return new Promise(resolve => {
            window.addEventListener("message", async function l(e) {
                if (typeof e.data === "string") {
                    if (e.data.startsWith("3j4t9uj349-gm-top-title-name:")) {
                        let name = e.data.slice("3j4t9uj349-gm-top-title-name:".length);
                        await new Promise(r => setTimeout(r, 5));
                        resolve(await mgmapi.getValue(name));
                        mgmapi.deleteValue(name);
                        window.removeEventListener("message", l);
                    }
                }
            });
            window.top.postMessage("3j4t9uj349-gm-get-title", "*");
        });
    }


    {
        const _r_text = unsafeWindow.Response.prototype.text;
        unsafeWindow.Response.prototype.text = function () {
            return new Promise((resolve, reject) => {
                _r_text.call(this).then((text) => {
                    resolve(text);
                    if (checkContent(text)) doM3U({ url: this.url, content: text });
                }).catch(reject);
            });
        }

        const _open = unsafeWindow.XMLHttpRequest.prototype.open;
        unsafeWindow.XMLHttpRequest.prototype.open = function (...args) {
            this.addEventListener("load", () => {
                try {
                    let content = this.responseText;
                    if (checkContent(content)) doM3U({ url: args[1], content });
                } catch (e) {
                    // G10 (audit v4.5): D6 deliberate-interception pattern — sniffing failures must
                    // never break the host page's XHR, but they are logged for diagnosis instead of
                    // being silently swallowed (e.g. responseType-locked XHRs throw on responseText).
                    console.debug("[m3u8++] XHR sniff skipped:", (e && e.message) || e);
                }
            });
            return _open.apply(this, args);
        }

        function checkContent(content) {
            if (content.trim().startsWith("#EXTM3U")) {
                return true;
            }
        }


        setInterval(doVideos, 1000);

    }

    const rootDiv = document.createElement("div");
    rootDiv.style = `
        position: fixed;
        z-index: 9999999999999999;
        opacity: 0.9;
    `;
    rootDiv.style.display = "none";
    document.documentElement.appendChild(rootDiv);

    const shadowDOM = rootDiv.attachShadow({ mode: 'open' });
    const wrapper = document.createElement("div");
    shadowDOM.appendChild(wrapper);


    const bar = document.createElement("div");
    bar.style = `
        text-align: right;
    `;
    bar.innerHTML = `
        <span
            class="number-indicator"
            data-number="0"
            style="
                display: inline-flex;
                width: 50px;
                height: 50px;
                background: transparent;
                padding: 0;
                border-radius: 100px;
                margin-bottom: 5px;
                cursor: pointer;
                border: none;
            "
        >
            <svg
                viewBox="0 0 128 128"
                xmlns="http://www.w3.org/2000/svg"
                style="width: 100%; height: 100%;"
                fill="none"
                stroke="var(--accent-cyan, #00E5FF)"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
                <path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
                <path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
                <text
                    x="64"
                    y="67"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="var(--accent-cyan, #00E5FF)"
                    stroke="none"
                    font-size="56"
                    font-weight="700"
                    font-family="'Cinzel Decorative', serif"
                >
                    Ψ
                </text>
            </svg>
        </span>
    `;

    wrapper.appendChild(bar);

    const style = document.createElement("style");
    style.innerHTML = `
        .number-indicator{
            position:relative;
        }

        .number-indicator::after{
            content: attr(data-number);
            position: absolute;
            bottom: 0;
            right: 0;
            color: #00E5FF;
            font-size: 14px;
            font-weight: bold;
            background: rgba(10, 19, 26, 0.95);
            border-radius: 10px;
            padding: 3px 5px;
        }

        .copy-link:active{
            color: #67E8F9;
        }

        .download-btn:hover{
            text-decoration: underline;
        }
        .download-btn:active{
            opacity: 0.9;
        }

        .m3u8-item{
            color: white;
            margin-bottom: 5px;
            display: flex;
            flex-direction: row;
            background: black;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 14px;
            user-select: none;
        }

        [data-shown="false"] {
            opacity: 0.8;
            zoom: 0.8;
        }

        [data-shown="false"]:hover{
            opacity: 1;
        }

        [data-shown="false"] .m3u8-item{
            display: none;
        }

    `;

    wrapper.appendChild(style);

    const barBtn = bar.querySelector(".number-indicator");

    (async function () {

        let shown = await mgmapi.getValue("shown", true);
        wrapper.setAttribute("data-shown", shown);


        let x = await mgmapi.getValue("x", 10);
        let y = await mgmapi.getValue("y", 10);

        x = Math.min(innerWidth - 50, x);
        y = Math.min(innerHeight - 50, y);

        if (x < 0) x = 0;
        if (y < 0) y = 0;

        rootDiv.style.top = `${y}px`;
        rootDiv.style.right = `${x}px`;

        barBtn.addEventListener("mousedown", e => {
            let startX = e.pageX;
            let startY = e.pageY;

            let moved = false;

            let mousemove = e => {
                let offsetX = e.pageX - startX;
                let offsetY = e.pageY - startY;
                if (moved || (Math.abs(offsetX) + Math.abs(offsetY)) > 5) {
                    moved = true;
                    rootDiv.style.top = `${y + offsetY}px`;
                    rootDiv.style.right = `${x - offsetX}px`;
                }
            };
            let mouseup = e => {

                let offsetX = e.pageX - startX;
                let offsetY = e.pageY - startY;

                if (moved) {
                    x -= offsetX;
                    y += offsetY;
                    mgmapi.setValue("x", x);
                    mgmapi.setValue("y", y);
                } else {
                    shown = !shown;
                    mgmapi.setValue("shown", shown);
                    wrapper.setAttribute("data-shown", shown);
                }
                removeEventListener("mousemove", mousemove);
                removeEventListener("mouseup", mouseup);
            }
            addEventListener("mousemove", mousemove);
            addEventListener("mouseup", mouseup);
        });
    })();

    let count = 0;
    let shownUrls = [];

    function doVideos() {
        for (let v of Array.from(document.querySelectorAll("video"))) {
            if (v.duration && v.src && v.src.startsWith("http") && (!shownUrls.includes(v.src))) {
                const src = v.src;

                shownUrls.push(src);
                showVideo({
                    type: "video",
                    url: new URL(src),
                    duration: `${Math.ceil(v.duration * 10 / 60) / 10} mins`,
                    download() {
                        const details = {
                            url: src,
                            name: (() => {
                                let name = new URL(src).pathname.split("/").slice(-1)[0];
                                if (!/\.\w+$/.test(name)) {
                                    if (name.match(/^\s*$/)) name = Date.now();
                                    name = name + ".mp4";
                                }
                                return name;
                            })(),
                            headers: {
                                origin: location.origin
                            },
                            onerror(e) {
                                mgmapi.openInTab(src);
                            }
                        };
                        mgmapi.download(details);
                    }
                })
            }
        }
    }

    async function doM3U({ url, content }) {

        // G3 (audit v4.5): explicit failure surface if the m3u8-parser @require failed to load —
        // previously a silent ReferenceError killed every capture with no diagnostic.
        if (typeof m3u8Parser === "undefined") {
            console.warn("[m3u8++] m3u8-parser library unavailable (@require failed to load); m3u8 capture disabled.");
            return;
        }

        try {

            // G1 (audit v4.5): resolve against the document base — XHR open() receives relative
            // ("hls/x.m3u8") and root-relative ("/hls/x.m3u8") URLs, which previously threw
            // "Invalid URL" as unhandled rejections and silently dropped those playlists.
            url = new URL(url, location.href);

            if (shownUrls.includes(url.href)) return;

            // G2 (audit v4.5): network fallback now carries a hard timeout (D2) — previously an
            // unbounded fetch could hang the capture forever.
            if (!content) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 15000);
                try {
                    const response = await fetch(url, { signal: controller.signal });
                    content = await response.text();
                } finally {
                    clearTimeout(timer);
                }
            }

            const parser = new m3u8Parser.Parser();
            parser.push(content);
            parser.end();
            const manifest = parser.manifest;

            if (manifest.segments) {
                let duration = 0;
                manifest.segments.forEach((segment) => {
                    duration += segment.duration;
                });
                manifest.duration = duration;
            }

            showVideo({
                type: "M3u8 URL:",
                url,

                duration: manifest.duration ? `${Math.ceil(manifest.duration * 10 / 60) / 10} mins` : manifest.playlists ? `Streams(${manifest.playlists.length})` : "unknown",


                async download() {
                    mgmapi.openInTab(
                        `https://tools.thatwind.com/tool/m3u8downloader#${new URLSearchParams({
                            m3u8: url.href,
                            referer: location.href,
                            filename: (await getTopTitle()) || ""
                        })}`
                    );
                }
            })

        } catch (e) {
            // G2 (audit v4.5): scoped interceptor logging — doM3U is fire-and-forget at both sniff
            // call sites, so any failure must resolve here (never an unhandled rejection) while
            // remaining visible for diagnosis (D6 deliberate-interception pattern).
            console.debug("[m3u8++] m3u8 capture skipped:", (e && e.message) || e);
        }

    }

    // G8 (audit v4.5): HTML-escape every runtime value interpolated into the item template.
    // URL normalization already percent-encodes the dangerous characters for http(s) URLs, so this
    // is defense-in-depth for non-special-scheme or future call paths — display is byte-identical
    // for all normal URLs (verified by the A3/A5/A6/A7 exact-path assertions).
    const escapeHtml = (s) => String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    async function showVideo({
        type,
        url,
        duration,
        download
    }) {
        let div = document.createElement("div");
        div.className = "m3u8-item";
        div.innerHTML = `
            <span>${escapeHtml(type)}</span>
            <span
                class="copy-link"
                title="${escapeHtml(url)}"
                style="
                    max-width: 200px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                    margin-left: 10px;
                "
            >${escapeHtml(url.pathname)}</span>
            <span
                style="
                    margin-left: 10px;
                    flex-grow: 1;
                "
            >${escapeHtml(duration)}</span>
            <span
                class="download-btn"
                style="
                    margin-left: 10px;
                    cursor: pointer;
            ">[Download]</span>
        `;

        div.querySelector(".copy-link").addEventListener("click", () => {
            mgmapi.copyText(url.href);
            mgmapi.message("Link copied", 2000, 'success');
        });

        div.querySelector(".download-btn").addEventListener("click", download);

        rootDiv.style.display = "block";

        count++;

        shownUrls.push(url.href);

        bar.querySelector(".number-indicator").setAttribute("data-number", count);

        wrapper.appendChild(div);
    }

})();

(function () {
    'use strict';

    const reg = /magnet:\?xt=urn:btih:\w{10,}([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

    let l = "en";

    const T = {
        "en": {
            play: "Play"
        }
    }[l];

    whenDOMReady(() => {
        addStyle(`
            button[data-wtmzjk-mag-url]{
                all: initial;
                border: none;
                outline: none;
                background: none;
                background: #67E8F9;
                background: #00E5FF;
                margin: 2px 8px;
                border-radius: 3px;
                font-family: 'JetBrains Mono', monospace;
                color: white;
                cursor: pointer;
                display: inline-flex;
                height: 1.6em;
                padding: 0 .8em;
                align-items: center;
                justify-content: center;
                transition: background 150ms ease-in-out;
                text-decoration: none;
                border-radius: 0.8em;
                font-size: small;
            }
            button[data-wtmzjk-mag-url]>svg{
                height: 60%;
                fill: white;
                pointer-events: none;
            }
            button[data-wtmzjk-mag-url]:hover{
                background: #67E8F9;
                background: #67E8F9;
            }
            button[data-wtmzjk-mag-url]:active{
                background: #67E8F9;
                background: #67E8F9;
            }
            button[data-wtmzjk-mag-url]>span{
                pointer-events: none;
                font-size: small;margin-right: .5em;font-weight:bold;color:white !important;
            }
        `);
        window.addEventListener("click", onEvents, true);
        window.addEventListener("mousedown", onEvents, true);
        window.addEventListener("mouseup", onEvents, true);

        watchBodyChange(work);
    });

    function onEvents(e) {
        if (e.target.hasAttribute('data-wtmzjk-mag-url')) {
            e.preventDefault();
            e.stopPropagation();
            if (e.type == "click") {
                let a = document.createElement('a');
                a.href = 'https://www.diancigaoshou.com/#' + new URLSearchParams({ url: e.target.getAttribute('data-wtmzjk-mag-url') });
                a.target = "_blank";
                a.click();
            }
        }
    }



    function createWatchButton(url, isForPlain = false) {
        let button = document.createElement("button");
        button.setAttribute('data-wtmzjk-mag-url', url);
        if (isForPlain) button.setAttribute('data-wtmzjk-button-for-plain', '');
        button.innerHTML = `<span>${T.play}</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>`;
        return button;
    }

    function hasPlainMagUrlThatNotHandled() {
        let m = document.body.textContent.match(new RegExp(reg, 'g'));
        return document.querySelectorAll(`[data-wtmzjk-button-for-plain]`).length != (m ? m.length : 0);
    }

    function work() {
        if (!document.body) return;
        if (hasPlainMagUrlThatNotHandled()) {
            for (let node of getAllTextNodes(document.body)) {
                if (node.nextSibling && node.nextSibling.hasAttribute && node.nextSibling.hasAttribute('data-wtmzjk-mag-url')) continue;
                let text = node.nodeValue;
                if (!reg.test(text)) continue;
                let match = text.match(reg);
                if (match) {
                    let url = match[0];
                    let p = node.parentNode;
                    p.insertBefore(document.createTextNode(text.slice(0, match.index + url.length)), node);
                    p.insertBefore(createWatchButton(url, true), node);
                    p.insertBefore(document.createTextNode(text.slice(match.index + url.length)), node);
                    p.removeChild(node);
                }
            }
        }
        for (let a of Array.from(document.querySelectorAll(
            ['href', 'value', 'data-clipboard-text', 'data-value', 'title', 'alt', 'data-url', 'data-magnet', 'data-copy'].map(n => `[${n}*="magnet:?xt=urn:btih:"]`).join(',')
        ))) {
            if (a.nextSibling && a.nextSibling.hasAttribute && a.nextSibling.hasAttribute('data-wtmzjk-mag-url')) continue;
            if (reg.test(a.textContent)) continue;
            for (let attr of a.getAttributeNames()) {
                let val = a.getAttribute(attr);
                if (!reg.test(val)) continue;
                let url = val.match(reg)[0];
                a.parentNode.insertBefore(createWatchButton(url), a.nextSibling);
            }
        }
    }


    function watchBodyChange(onchange) {
        let timeout;
        let observer = new MutationObserver(() => {
            if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    onchange();
                }, 200);
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

    }

    function getAllTextNodes(parent) {
        var re = [];
        if (["STYLE", "SCRIPT", "BASE", "COMMAND", "LINK", "META", "TITLE", "XTRANS-TXT", "XTRANS-TXT-GROUP", "XTRANS-POPUP"].includes(parent.tagName)) return re;
        for (let node of parent.childNodes) {
            if (node.childNodes.length) re = re.concat(getAllTextNodes(node));
            else if (Text.prototype.isPrototypeOf(node) && (!node.nodeValue.match(/^\s*$/))) re.push(node);
        }
        return re;
    }

    function whenDOMReady(f) {
        if (document.body) f();
        else window.addEventListener("DOMContentLoaded", f);
    }

    function addStyle(s) {
        let style = document.createElement("style");
        style.innerHTML = s;
        document.documentElement.appendChild(style);
    }

})();
