// ==UserScript==
// @name         4ndr0tools - Instagram++
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      11.0.0
// @description  Tab-Bar Integration. Neural Virtualization. Ad-Blocking. Deep-Stack Recovery.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @icon         data:image/png;base64,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
// @icon64       data:image/png;base64,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
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

    const log = (msg) => console.log(`%c[Instagram++ V11.0] %c${msg}`, `color:${CONFIG.DISPLAY.ACCENT}; font-weight:bold;`, `color:#ccc;`);

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
        wrapper.className = '4ndr0666-media-wrap';
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
        const dock = document.getElementById('4ndr0666-glyph-dock');
        if (dock) dock.style.display = 'none';

        document.body.style.overflow = 'hidden';
        const gui = document.createElement('div');
        gui.id = 'igBigContainer';
        gui.style = `background:${CONFIG.DISPLAY.BG}; width:100vw; height:100vh; z-index:99999999; position:fixed; top:0; left:0; overflow-y:auto; color:#fff;`;

        gui.innerHTML = `
            <div style="position:sticky; top:0; background:rgba(0,0,0,0.95); padding:15px; border-bottom:1px solid #111; display:flex; justify-content:space-between; align-items:center; z-index:100000; backdrop-filter:blur(10px);">
                <div style="display:flex; flex-direction:column;">
                    <span style="color:${CONFIG.DISPLAY.ACCENT}; font-family:'Cinzel Decorative', monospace; font-weight:900; letter-spacing:1px;">Instagram++ // V11.0</span>
                    <span id="4ndr0666-stat" style="color:#666; font-family:monospace; font-size:10px;">INITIALIZING TELEMETRY...</span>
                </div>
                <div style="display:flex; gap:15px;">
                     <button id="4ndr0666-dump" style="background:transparent; color:#aaa; border:1px solid #333; padding:5px 15px; cursor:pointer; font-family:monospace;">DUMP</button>
                     <button id="4ndr0666-kill" style="background:transparent; color:${CONFIG.DISPLAY.ERROR}; border:1px solid #500; padding:5px 15px; cursor:pointer; font-family:monospace; font-weight:bold;">EXIT</button>
                </div>
            </div>
            <div id="igAllImages" style="padding-top:80px; padding-bottom:300px; display:flex; flex-direction:column; align-items:center;"></div>
        `;

        document.documentElement.appendChild(gui);
        document.getElementById('4ndr0666-kill').onclick = () => window.location.assign(window.location.href.split('?')[0]);
        document.getElementById('4ndr0666-dump').onclick = () => {
            const blob = new Blob([document.querySelector('#igAllImages').innerHTML], {type: 'text/html'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `4ndr0666_dump_${STATE.targetId}.html`;
            a.click();
        };

        NeuralDOM.observe(gui);
        setInterval(() => {
            const active = STATE.domNodes.filter(n => !n.isPruned).length;
            const stat = document.getElementById('4ndr0666-stat');
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
        GM_registerMenuCommand("Ψ Press If Btn Didnt Work", executeRecon);

        // 2. Tab Bar Injection Loop
        const daemon = setInterval(() => {
            if (document.getElementById('4ndr0666-glyph-dock')) return;

            // Strategy: Profile Tab List (Posts | Reels | Tagged | [Ψ])
            const tablist = document.querySelector('div[role="tablist"]');

            // Fallback for non-profile pages (Sidebar/Header)
            const fallback = document.querySelector('div.fx7hk, main header section, ._aak6');

            if (tablist) {
                const dock = document.createElement('div');
                dock.id = '4ndr0666-glyph-dock';
                dock.innerHTML = GLYPH_SVG;
                dock.title = "Initialize Instagram++ v11";
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
                dock.id = '4ndr0666-glyph-dock';
                dock.innerHTML = GLYPH_SVG;
                dock.style = "position:fixed; bottom:25px; left:90px; z-index:999999; cursor:pointer; opacity:0.6;";
                dock.onclick = (e) => { e.preventDefault(); executeRecon(); };
                document.body.appendChild(dock);
            }

        }, 1500);
    }

    log("V11 Active.");
    if (document.body) init();
    else window.addEventListener('DOMContentLoaded', init);

})();
