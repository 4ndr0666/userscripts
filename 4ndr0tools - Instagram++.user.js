// ==UserScript==
// @name        4ndr0tools - Instagram++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @license     UNLICENSED - RED TEAM USE ONLY
// @version     1.0.0
// @description Entire profile media is DOM-orchestrated with memory sanitation and saves your scrolling spot.
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.instagram.com/*
// @grant       none
// @run-at      document-start
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Instagram++.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Configuration for the Virtual Cache
    const CACHE_LIMIT = 50; // Maximum number of media elements to keep in DOM
    const IMAGES_PER_QUERY = 12;
    const VID_VOLUME = 0.02;
    const HEIGHT_PCT = 0.8;
    const WIDTH_PCT = 0.49;

    let mediaBuffer = []; // Tracking array for DOM elements
    let MODE = 'profile';
    let userId = window.userId;
    let notLoaded = true;
    const tempDiv = document.createElement('div');
    const win = window;

    // Trusted Types Policy for modern browser security
    if (win.trustedTypes && win.trustedTypes.createPolicy) {
        win.trustedTypes.createPolicy('default', {
            createHTML: (str) => str
        });
    }

    /**
     * CORE OPTIMIZATION: DOM Virtualization/Pruning
     * This function monitors the number of media items in the DOM.
     * When the limit is reached, it removes the oldest items to free up memory (I/O).
     * To prevent losing position, we replace removed items with a placeholder 
     * that maintains the height of the original content.
     */
    function pruneCache() {
        const container = document.querySelector('#igAllImages');
        if (!container) return;

        // While we exceed the cache limit, remove the oldest (first) elements
        while (mediaBuffer.length > CACHE_LIMIT) {
            const oldItem = mediaBuffer.shift();
            if (oldItem && oldItem.parentNode) {
                // Get height before removal to prevent layout shift
                const rect = oldItem.getBoundingClientRect();
                const placeholder = document.createElement('div');
                placeholder.style.height = `${rect.height}px`;
                placeholder.className = 'media-placeholder';
                
                oldItem.parentNode.replaceChild(placeholder, oldItem);
                console.log('Cache Pruned: Removed element to prevent crash.');
            }
        }
    }

    function addMedia(media, container) {
        let shortcode = media?.shortcode || media?.code;
        let medias = media?.edge_sidecar_to_children?.edges?.map(n => n.node) ||
                    media?.carousel_media ||
                    [media];

        for (let i = 0; i < medias.length; i++) {
            let m = medias[i];
            let wrapper = document.createElement('div');
            wrapper.className = 'media-wrapper';
            wrapper.style.display = 'inline-block';

            let a = document.createElement('a');
            a.href = `https://www.instagram.com/p/${shortcode}/`;
            let un = media?.user?.username || media?.owner?.username;
            let caption = media?.caption?.text || media?.edge_media_to_caption?.edges?.[0]?.node?.text;
            a.title = `${media?.user?.full_name || ''} (${un}) ${caption} [${i + 1}]`;

            if (m?.is_video || m?.is_unified_video || m?.video_duration) {
                let vidDiv = document.createElement('div');
                vidDiv.className = 'vidDiv';
                let vid = document.createElement('video');
                vid.src = m?.video_url || m?.video_versions?.reduce((a, b) => Math.max(a.width, a.height) > Math.max(b.width, b.height) ? a : b)?.url;
                vid.controls = true;
                vid.volume = VID_VOLUME;
                vid.loading = "lazy"; // Native browser optimization
                
                a.textContent = 'Link';
                vidDiv.appendChild(vid);
                vidDiv.appendChild(a);
                wrapper.appendChild(vidDiv);
            } else if (m?.ad_id || m?.label === 'Sponsored') {
                continue;
            } else {
                let img = document.createElement('img');
                img.src = getBestImage(m);
                img.loading = "lazy"; // Native browser optimization
                a.appendChild(img);
                wrapper.appendChild(a);
            }

            container.appendChild(wrapper);
            mediaBuffer.push(wrapper); // Add to our cache tracker
            pruneCache(); // Check if we need to dump old media
        }
    }

    // --- RE-IMPLEMENTING NECESSARY HELPERS FROM YOUR SCRIPT ---

    function getBestImage(media) {
        let bestUrl = null;
        let bestSize = 0;
        let list = media?.display_resources || media?.image_versions2?.candidates;
        if (!list) return '';
        for (let m of list) {
            let w = m?.width || m?.config_width || 0;
            let h = m?.height || m?.config_height || 0;
            let size = Math.max(w, h);
            if (size > bestSize) {
                bestSize = size;
                bestUrl = m?.url || m?.src;
            }
        }
        return bestUrl;
    }

    function loadImages(query_id = 0, query_hash = 0, doc_id = 0, app_id = 936619743392459, asbd_id = 129477, after = null) {
        notLoaded = false;
        app_id = app_id || 936619743392459;
        asbd_id = asbd_id || 129477;

        let imageListQueryUrl;
        let init = { responseType: 'json', credentials: 'include', referrerPolicy: 'no-referrer' };

        if (MODE === 'profile') {
            if (!userId) return;
            imageListQueryUrl = `https://i.instagram.com/api/v1/feed/user/${userId}/?count=12${after ? `&max_id=${after}` : ''}`;
            init.headers = {
                'X-IG-App-ID': app_id,
                'X-ASBD-ID': asbd_id,
                'X-CSRFToken': win._sharedData?.config?.csrf_token
            };
        }

        fetch(imageListQueryUrl, init)
            .then(resp => resp.json())
            .then(json => {
                let timelineMedia = json.data?.user.edge_owner_to_timeline_media;
                let end_cursor = timelineMedia?.page_info.end_cursor || json.next_max_id;
                let mediaList = timelineMedia?.edges.map(n => n.node) || json.items || json.feed_items?.map(n => n.media_or_ad).filter(n => n);

                let bigContainer = document.querySelector('#igBigContainer');
                if (!bigContainer) {
                    document.body.innerHTML = '<div id="igBigContainer" style="background:#112;width:100%;height:100%;z-index:999;position:fixed;top:0;left:0;overflow:scroll;"><div id="igAllImages" style="display:block;text-align:center;"></div></div>';
                    bigContainer = document.querySelector('#igBigContainer');
                    styleIt();
                }

                const innerContainer = document.querySelector('#igAllImages');
                for (let media of mediaList) {
                    addMedia(media, innerContainer);
                }

                if (end_cursor) {
                    bigContainer.onscroll = () => {
                        if (bigContainer.scrollHeight - bigContainer.scrollTop - bigContainer.clientHeight < 1000) {
                            bigContainer.onscroll = null;
                            loadImages(query_id, query_hash, doc_id, app_id, asbd_id, end_cursor);
                        }
                    };
                }
            });
    }

    function styleIt() {
        let style = document.createElement('style');
        style.innerHTML = `
            #igAllImages img, #igAllImages video {
                max-height: 80vh;
                max-width: 45vw;
                margin: 10px;
                border: 1px solid #333;
            }
            .vidDiv { border: 2px solid green; display: inline-block; }
            .media-placeholder { 
                background: #1a1a2e; 
                margin: 10px; 
                display: inline-block; 
                width: 40vw;
            }
        `;
        document.body.appendChild(style);
    }

    function pickMode() {
        if (document.location.href.includes('/tagged/')) MODE = 'tagged';
        else MODE = 'profile';
        
        userId = userId || document.body.innerHTML.match(/profilePage_(\d+)/)?.[1];
        if (userId) loadImages();
        else console.error("User ID not found.");
    }

    // Initialize the "Load" button
    const btn = document.createElement('button');
    btn.innerText = "FORCE LOAD CACHE-SAFE";
    btn.style = "position:fixed;top:10px;right:10px;z-index:10000;padding:10px;background:red;color:white;border:none;cursor:pointer;";
    btn.onclick = pickMode;
    document.body.appendChild(btn);

})();
