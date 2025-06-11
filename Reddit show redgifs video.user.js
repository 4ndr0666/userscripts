// ==UserScript==
// @name                Reddit show redgifs video
// @namespace           https://greasyfork.org/users/821661
// @match               https://www.reddit.com/*
// @match               https://new.reddit.com/*
// @match               https://sh.reddit.com/*
// @match               https://www.redgifs.com/watch/*?inreddit*
// @match               https://www.redgifs.com/ifr/*?inreddit*
// @match               https://www.redgifs.com/ifr/*
// @grant               none
// @version             1.3.5
// @author              hdyzen
// @description         show redgifs video in reddit post
// @license             MIT
// @require             https://update.greasyfork.org/scripts/492879/1362452/pause-videos-when-not-visible.js
// @downloadURL https://update.greasyfork.org/scripts/492799/Reddit%20show%20redgifs%20video.user.js
// @updateURL https://update.greasyfork.org/scripts/492799/Reddit%20show%20redgifs%20video.meta.js
// ==/UserScript==
'use strict';

const domain = window.location.hostname;
const hasInReddit = window.location.search.includes('inreddit');
const originalParse = JSON.parse;

function addCSS(text) {
    document.documentElement.insertAdjacentHTML('beforeend', `<style rel="stylesheet">${text}</style>`);
}

function getUrlGif(json) {
    if (typeof json === 'string' && json.includes('"gif"')) {
        const parsed = originalParse(json);
        window.top.postMessage({ url: window.location.href, src: parsed.gif.urls.hd || parsed.gif.urls.sd }, '*');
    }
}

function videoWithSource(src) {
    return `<video class="redgifs_video" controls src="${src}"></video>`;
}

if (domain.includes('redgifs.com')) {
    JSON.parse = function (json, ...args) {
        getUrlGif(json);
        return originalParse(json, ...args);
    };

    window.addEventListener('message', e => {
        const { origin, data } = e;

        if (origin.includes('reddit.com')) {
            document.body.innerHTML = data;
        }
    });

    if (hasInReddit) {
        addCSS(`body::after { content: 'Loading...'; position: fixed; inset: 0; background-color: #000; z-index: 999; display: flex; justify-content: center; align-items: center; }`);
    } else {
        addCSS(`* { background: #000 !important; height: 100% !important; width: 100% !important; }`);
        observerIt('video[src]', 0.75);
    }
}

if (domain.includes('reddit.com')) {
    window.addEventListener('message', e => {
        const origin = e.origin,
            { url, src } = e.data;

        if (origin !== 'https://www.redgifs.com') return;
        const idGif = url?.split('/')[4];

        if (url.includes('inreddit')) {
            document.querySelector(`iframe[src$="${idGif}"]`).outerHTML = videoWithSource(src);
        } else {
            document.querySelector(`shreddit-embed[html*="${idGif}"]`).shadowRoot.firstElementChild.contentWindow.postMessage(videoWithSource(src), '*');
        }
    });

    if (!document.querySelector('shreddit-app')) {
        const observer = new MutationObserver(() => {
            const linksRedgifs = document.querySelectorAll(':is(article, ._2n04GrCyhhQf-Kshn7akmH._19FzInkloQSdrf0rh3Omen):not(:has(.redgifs-iframe, video[src*="redgifs.com"])) a:is([href*="redgifs.com/watch/"], [href*="redgifs.com/ifr/"])[data-testid="outbound-link"]:not([class])');

            linksRedgifs.forEach(link => {
                link.closest('article, ._2n04GrCyhhQf-Kshn7akmH._19FzInkloQSdrf0rh3Omen').firstChild.insertAdjacentHTML('beforeend', `<iframe class="redgifs-iframe" src="${link.href[link.href.length - 1] === '/' ? link.href.slice(0, -1) : link.href}?inreddit"></iframe>`);
            });
        });

        observer.observe(document.body, { childList: true });

        observerIt('.redgifs_video', 0.75);

        addCSS(`.redgifs-iframe { height: 512px; background: #000; } video[src*="redgifs.com"] { height: 512px; width: 100%; background: #000; } :is(article, ._32pB7ODBwG3OSx1u_17g58):has(video[src*="redgifs.com"], .redgifs-iframe) { padding-bottom: 0 !important; } :is(article, ._2n04GrCyhhQf-Kshn7akmH._19FzInkloQSdrf0rh3Omen):has(a[href*="redgifs.com"]) ._17nmfaMf1Rq20sVfEmle0O  { display: none !important; } ._2i5O0KNpb9tDq0bsNOZB_Q { width: 100% !important; }`);
    }
}
