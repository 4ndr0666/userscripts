// ==UserScript==
// @name         4ndr0tools - Instagram++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @version      11.0.0
// @description  Tab-Bar Integration. Neural Virtualization. Ad-Blocking. Deep-Stack Recovery.
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @match        *://*.instagram.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- [OMNISCIENCE CONFIGURATION] ---
    const CONFIG = {
        VIRTUAL: {
            CACHE_LIMIT: 80,           // High buffer for smooth scrolling
            SAFE_ZONE: 15,             // Sentinel Guard (Prevents stall)
            HYDRATION_RANGE: 3000,     // Pre-render distance
            PRUNE_RANGE: 6000          // Memory sanitation distance
        },
        NETWORK: {
            BATCH_SIZE: 12,
            TIMEOUT: 15000
        },
        DISPLAY: {
            H_PCT: 0.88,
            W_PCT: 0.58,
            VOLUME: 0.03,
            ACCENT: '#00ffff', // Cyan
            BG: '#050505',
            ERROR: '#ff3e3e'
        }
    };

    // --- [GLOBAL STATE] ---
    const STATE = {
        MODE: 'profile',
        targetId: null,
        isFetching: false,
        totalLoaded: 0,
        domNodes: [],
        query: { hash: null, appId: '936619743392459', asbd: '129477' }
    };

    const log = (msg) => console.log(`%c[ARES-9 V11.0] %c${msg}`, `color:${CONFIG.DISPLAY.ACCENT}; font-weight:bold;`, `color:#ccc;`);

    // --- [NETWORK INTERCEPTOR] ---
    const Interceptor = {
        getHeaders() {
            return {
                'X-IG-App-ID': STATE.query.appId,
                'X-ASBD-ID': STATE.query.asbd,
                'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '',
                'X-Requested-With': 'XMLHttpRequest',
                'X-IG-WWW-Claim': window.localStorage.getItem('ig_claim') || '0',
                'Accept': '*/*',
                'Sec-Fetch-Site': 'same-origin'
            };
        },

        async request(url, options = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url: url,
                    headers: { ...this.getHeaders(), ...(options.headers || {}) },
                    data: options.body,
                    timeout: CONFIG.NETWORK.TIMEOUT,
                    onload: (res) => {
                        try {
                            const clean = res.responseText.replace(/^for\s*\(\s*;\s*;\s*\)\s*;/, '');
                            resolve(JSON.parse(clean));
                        } catch (e) { resolve(res.responseText); }
                    },
                    onerror: reject
                });
            });
        }
    };

    // --- [IDENTITY & ENTROPY RESOLUTION] ---
    async function resolveIdentity() {
        let id = document.body.innerHTML.match(/profilePage_(\d+)/)?.[1] ||
                 document.body.innerHTML.match(/author_id="(\d+)"/)?.[1] ||
                 document.querySelector('meta[property="instapp:owner_user_id"]')?.content;

        // Redux DB Fallback
        if (!id) {
            try {
                id = await new Promise((res) => {
                    const req = indexedDB.open('redux');
                    req.onsuccess = () => {
                        const tx = req.result.transaction("paths", "readonly");
                        const get = tx.objectStore("paths").get('users.usernameToId');
                        get.onsuccess = () => res(get.result?.[document.location.href.match(/instagram\.com\/([^\/]{3,})/)?.[1]]);
                    };
                    req.onerror = () => res(null);
                });
            } catch (e) {}
        }

        // API Fallback
        if (!id) {
            const user = document.location.href.match(/instagram\.com\/([^\/]{3,})/)?.[1];
            if (user) {
                const resp = await Interceptor.request(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${user}`);
                id = resp?.data?.user?.id || resp?.graphql?.user?.id;
            }
        }
        STATE.targetId = id;
        return id;
    }

    async function extractEntropy() {
        const scripts = Array.from(document.getElementsByTagName('script')).filter(s => s.src && /Consumer|ProfilePageContainer|LibCommons|miOdM842jTv/.test(s.src));
        for (const s of scripts) {
            try {
                const text = await Interceptor.request(s.src, { responseType: 'text' });
                STATE.query.hash = text.match(/queryId:"([a-f0-9]+)"/)?.[1] || STATE.query.hash;
                STATE.query.appId = text.match(/instagramWebDesktopFBAppId='(\d+)'/)?.[1] || STATE.query.appId;
            } catch (e) {}
        }
        if (!STATE.query.hash) await fallbackPolaris();
    }

    async function fallbackPolaris() {
        return new Promise((resolve) => {
            let attempts = 0;
            const timer = setInterval(async () => {
                const api = window?.require?.('PolarisAPI');
                const info = api?.fetchFBInfo ? api.fetchFBInfo('ping') : null;
                let path = info?._value?.fileName || info?._value?.stack?.match(/\((https[^\)]+)\)/)?.[1];

                if (!path && window.pldmp) {
                    path = Object.values(Object.values(window.pldmp)?.[0] || {}).find(o =>
                        o.url && o.url.match(/rsrc\.php.*\/[a-z]{2,3}_[A-Z]{2,3}\/[^\/.]{9,15}\.js/)
                    )?.url;
                }

                if (path) {
                    clearInterval(timer);
                    const text = await Interceptor.request(path, { responseType: 'text' });
                    STATE.query.hash = text.match(/,"regeneratorRuntime"\],\(function\(.*h="([a-f0-9]+)"/)?.[1];
                    resolve();
                } else if (attempts++ > 15) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    }

    // --- [NEURAL VIRTUALIZATION] ---
    const NeuralDOM = {
        prune(item) {
            const idx = STATE.domNodes.indexOf(item);
            if (idx >= STATE.domNodes.length - CONFIG.VIRTUAL.SAFE_ZONE) return;
            if (item.isPruned) return;

            const rect = item.node.getBoundingClientRect();
            item.height = rect.height || item.height;

            const proxy = document.createElement('div');
            proxy.style = `height:${item.height}px; width:100%; margin-bottom:80px; background:#050505; border:1px solid #111; display:flex; align-items:center; justify-content:center;`;
            proxy.innerHTML = `<span style="color:#222; font-family:monospace; font-size:10px;">V-STASIS</span>`;

            item.node.querySelectorAll('video').forEach(v => { v.pause(); v.src = ""; });
            if (item.node.parentNode) {
                item.node.parentNode.replaceChild(proxy, item.node);
                item.node = proxy;
                item.isPruned = true;
            }
        },

        hydrate(item) {
            if (!item.isPruned) return;
            const realNode = createComponent(item.data, item.parent, item.meta.cur, item.meta.total);
            if (item.node.parentNode) {
                item.node.parentNode.replaceChild(realNode, item.node);
                item.node = realNode;
                item.isPruned = false;
            }
        },

        observe(container) {
            container.addEventListener('scroll', () => {
                window.requestAnimationFrame(() => {
                    const viewportTop = container.scrollTop;
                    STATE.domNodes.forEach(item => {
                        const dist = Math.abs(item.node.offsetTop - viewportTop);
                        if (dist > CONFIG.VIRTUAL.PRUNE_RANGE && !item.isPruned) this.prune(item);
                        else if (dist < CONFIG.VIRTUAL.HYDRATION_RANGE && item.isPruned) this.hydrate(item);
                    });
                });
            });
        }
    };

    // --- [ORCHESTRATION] ---
    async function load(cursor = null) {
        if (STATE.isFetching) return;
        STATE.isFetching = true;

        let url, body, method = 'GET';
        const { targetId, MODE } = STATE;

        if (MODE === 'profile') {
            url = `https://i.instagram.com/api/v1/feed/user/${targetId}/?count=${CONFIG.NETWORK.BATCH_SIZE}`;
            if (cursor) url += `&max_id=${cursor}`;
        } else if (MODE === 'home') {
            url = 'https://i.instagram.com/api/v1/feed/timeline/';
            method = 'POST';
            const fd = new URLSearchParams();
            fd.set('is_async_ads_rti', 0);
            fd.set('device_id', window.localStorage.getItem('ig_did') || '0');
            if (cursor) fd.set('max_id', cursor);
            body = fd.toString();
        } else if (MODE === 'tagged') {
            url = `https://i.instagram.com/api/v1/usertags/${targetId}/feed/?count=${CONFIG.NETWORK.BATCH_SIZE}`;
            if (cursor) url += `&max_id=${cursor}`;
        }

        try {
            const json = await Interceptor.request(url, { method, body });
            const timeline = json.data?.user?.edge_owner_to_timeline_media;
            const items = timeline?.edges.map(e => e.node) || json.items || json.feed_items?.map(i => i.media_or_ad).filter(Boolean);
            const nextCursor = timeline?.page_info?.end_cursor || json.next_max_id;

            if (items?.length) processBatch(items, nextCursor);
            else STATE.isFetching = false;
        } catch (e) { STATE.isFetching = false; }
    }

    function processBatch(items, nextCursor) {
        const root = document.querySelector('#igBigContainer') || buildUI();
        const wall = document.querySelector('#igAllImages');
        const fragment = document.createDocumentFragment();

        items.forEach(item => {
            const children = item.edge_sidecar_to_children?.edges?.map(e => e.node) || item.carousel_media || [item];
            children.forEach((child, idx) => {
                if (child.ad_id || child.label === 'Sponsored') return;

                const node = createComponent(child, item, idx + 1, children.length);
                fragment.appendChild(node);

                STATE.domNodes.push({
                    data: child,
                    parent: item,
                    node: node,
                    isPruned: false,
                    height: 800,
                    meta: { cur: idx + 1, total: children.length, code: child.code || item.code }
                });
                STATE.totalLoaded++;
            });
        });

        wall.appendChild(fragment);

        if (STATE.domNodes.length > CONFIG.VIRTUAL.CACHE_LIMIT) {
            STATE.domNodes.slice(0, STATE.domNodes.length - CONFIG.VIRTUAL.CACHE_LIMIT).forEach(item => NeuralDOM.prune(item));
        }

        STATE.isFetching = false;

        if (nextCursor) {
            const triggerIdx = STATE.domNodes.length - CONFIG.VIRTUAL.SAFE_ZONE;
            const trigger = STATE.domNodes[triggerIdx]?.node || wall.lastElementChild;
            if (trigger) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        observer.disconnect();
                        load(nextCursor);
                    }
                }, { root: root, rootMargin: '1500px' });
                observer.observe(trigger);
            }
        }
    }

    function createComponent(media, parent, cur, total) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ares-media-wrap';
        wrapper.style = "margin-bottom: 80px; display: flex; flex-direction: column; align-items: center; width: 100%; transition: opacity 0.3s; pointer-events: auto;";

        const code = media.code || parent.code || 'recon';
        const link = `https://www.instagram.com/p/${code}/`;

        if (media.is_video || media.video_versions) {
            const vid = document.createElement('video');
            const variants = media.video_versions || [];
            vid.src = variants.length ? variants.reduce((a, b) => (a.width > b.width ? a : b)).url : media.video_url;
            vid.controls = true;
            vid.volume = CONFIG.DISPLAY.VOLUME;
            vid.preload = "metadata";
            vid.style = `max-height:${window.innerHeight * CONFIG.DISPLAY.H_PCT}px; max-width:${window.innerWidth * CONFIG.DISPLAY.W_PCT}px; border:2px solid ${CONFIG.DISPLAY.ACCENT}; pointer-events: auto;`;
            wrapper.appendChild(vid);
        } else {
            const img = document.createElement('img');
            const res = media.display_resources || media.image_versions2?.candidates || [];
            const src = res.length ? res.reduce((a, b) => (a.width > b.width ? a : b)).url : (media.url || media.src);
            img.src = src;
            img.loading = "lazy";
            img.style = `max-height:${window.innerHeight * CONFIG.DISPLAY.H_PCT}px; max-width:${window.innerWidth * CONFIG.DISPLAY.W_PCT}px; border:1px solid #222; cursor: pointer; pointer-events: auto;`;

            const a = document.createElement('a');
            a.href = link; a.target = "_blank"; a.appendChild(img);
            wrapper.appendChild(a);
        }

        const info = document.createElement('a');
        info.href = link;
        info.target = "_blank";
        info.style = `margin-top:12px; font-family:monospace; font-size:11px; color:${CONFIG.DISPLAY.ACCENT}; opacity:0.6; text-decoration:none; pointer-events: auto; z-index: 10;`;
        info.innerHTML = `[ID: ${code}] [${cur}/${total}]`;
        wrapper.appendChild(info);

        return wrapper;
    }

    // --- [UI ENGINE] ---
    function buildUI() {
        // HIDE THE GLYPH WHEN UI IS ACTIVE
        const dock = document.getElementById('ares-glyph-dock');
        if (dock) dock.style.display = 'none';

        document.body.style.overflow = 'hidden';
        const gui = document.createElement('div');
        gui.id = 'igBigContainer';
        gui.style = `background:${CONFIG.DISPLAY.BG}; width:100vw; height:100vh; z-index:99999999; position:fixed; top:0; left:0; overflow-y:auto; color:#fff;`;

        gui.innerHTML = `
            <div style="position:sticky; top:0; background:rgba(0,0,0,0.95); padding:15px; border-bottom:1px solid #111; display:flex; justify-content:space-between; align-items:center; z-index:100000; backdrop-filter:blur(10px);">
                <div style="display:flex; flex-direction:column;">
                    <span style="color:${CONFIG.DISPLAY.ACCENT}; font-family:'Cinzel Decorative', monospace; font-weight:900; letter-spacing:1px;">ARES-9 // HORIZON V11.0</span>
                    <span id="ares-stat" style="color:#666; font-family:monospace; font-size:10px;">INITIALIZING TELEMETRY...</span>
                </div>
                <div style="display:flex; gap:15px;">
                     <button id="ares-dump" style="background:transparent; color:#aaa; border:1px solid #333; padding:5px 15px; cursor:pointer; font-family:monospace;">DUMP</button>
                     <button id="ares-kill" style="background:transparent; color:${CONFIG.DISPLAY.ERROR}; border:1px solid #500; padding:5px 15px; cursor:pointer; font-family:monospace; font-weight:bold;">EXIT</button>
                </div>
            </div>
            <div id="igAllImages" style="padding-top:80px; padding-bottom:300px; display:flex; flex-direction:column; align-items:center;"></div>
        `;

        document.documentElement.appendChild(gui);
        document.getElementById('ares-kill').onclick = () => window.location.assign(window.location.href.split('?')[0]);
        document.getElementById('ares-dump').onclick = () => {
            const blob = new Blob([document.querySelector('#igAllImages').innerHTML], {type: 'text/html'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ares_dump_${STATE.targetId}.html`;
            a.click();
        };

        NeuralDOM.observe(gui);
        setInterval(() => {
            const active = STATE.domNodes.filter(n => !n.isPruned).length;
            const stat = document.getElementById('ares-stat');
            if (stat) stat.textContent = `ACT: ${active} | TOT: ${STATE.totalLoaded} | UID: ${STATE.targetId} | MODE: ${STATE.MODE.toUpperCase()}`;
        }, 1000);
        return gui;
    }

    const GLYPH_SVG = `
    <svg viewBox="0 0 128 128" style="width: 24px; height: 24px; filter: drop-shadow(0 0 6px ${CONFIG.DISPLAY.ACCENT});">
        <style>
            .g-r1 { transform-origin: center; animation: sp 10s linear infinite; }
            .g-r2 { transform-origin: center; animation: sp 15s linear infinite reverse; }
            @keyframes sp { 100% { transform: rotate(360deg); } }
        </style>
        <path class="g-r1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" fill="none" stroke="${CONFIG.DISPLAY.ACCENT}" stroke-dasharray="21.78 21.78" stroke-width="2" />
        <path class="g-r2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" fill="none" stroke="${CONFIG.DISPLAY.ACCENT}" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
        <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" fill="none" stroke="${CONFIG.DISPLAY.ACCENT}" stroke-width="3" />
        <text x="64" y="76" text-anchor="middle" dominant-baseline="middle" fill="${CONFIG.DISPLAY.ACCENT}" font-size="46" font-weight="700" font-family="monospace">Ψ</text>
    </svg>`;

    // --- [INIT: TAB-BAR INJECTION] ---
    async function executeRecon() {
        log("Booting Kernel...");
        const loc = document.location.href;
        if (loc.match(/https:\/\/(www\.)?instagram.com\/?(\?|$|#)/)) STATE.MODE = 'home';
        else if (loc.includes('/tagged/')) STATE.MODE = 'tagged';
        else if (loc.includes('/p/')) STATE.MODE = 'post';

        await resolveIdentity();
        await extractEntropy();
        load();
    }

    function init() {
        // 1. Context Menu Failsafe
        GM_registerMenuCommand("Ψ Initialize ARES-9", executeRecon);

        // 2. Tab Bar Injection Loop
        const daemon = setInterval(() => {
            if (document.getElementById('ares-glyph-dock')) return;

            // Strategy: Profile Tab List (Posts | Reels | Tagged | [Ψ])
            const tablist = document.querySelector('div[role="tablist"]');

            // Fallback for non-profile pages (Sidebar/Header)
            const fallback = document.querySelector('div.fx7hk, main header section, ._aak6');

            if (tablist) {
                const dock = document.createElement('div');
                dock.id = 'ares-glyph-dock';
                dock.innerHTML = GLYPH_SVG;
                dock.title = "Initialize ARES-9";
                dock.style = `
                    cursor: pointer;
                    margin-left: 20px;
                    display: flex;
                    align-items: center;
                    opacity: 0.7;
                    transition: transform 0.2s, opacity 0.2s;
                    height: 52px; /* Matches IG tabs */
                `;

                dock.onmouseover = () => { dock.style.opacity = '1'; dock.style.transform = 'scale(1.1)'; };
                dock.onmouseout = () => { dock.style.opacity = '0.7'; dock.style.transform = 'scale(1)'; };

                dock.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    executeRecon();
                };

                // Append to end of tablist
                tablist.appendChild(dock);
            } else if (fallback && STATE.MODE !== 'profile') {
                // Subtle fallback for Home/Explore if Tablist is missing
                const dock = document.createElement('div');
                dock.id = 'ares-glyph-dock';
                dock.innerHTML = GLYPH_SVG;
                dock.style = "position:fixed; bottom:25px; left:90px; z-index:999999; cursor:pointer; opacity:0.6;";
                dock.onclick = (e) => { e.preventDefault(); executeRecon(); };
                document.body.appendChild(dock);
            }

        }, 1500);
    }

    log("V11.0 Horizon Active.");
    if (document.body) init();
    else window.addEventListener('DOMContentLoaded', init);

})();
