// ==UserScript==
// @name            Open redgifs links on reddit
// @namespace       https://greasyfork.org/users/821661
// @match           https://*.reddit.com/*
// @grant           GM_addElement
// @grant           GM_addStyle
// @version         1.1.3
// @author          hdyzen
// @description     Open redgifs links in iframe on reddit
// @license         MIT
// @downloadURL https://update.greasyfork.org/scripts/485522/Open%20redgifs%20links%20on%20reddit.user.js
// @updateURL https://update.greasyfork.org/scripts/485522/Open%20redgifs%20links%20on%20reddit.meta.js
// ==/UserScript==
'use strict';

// Container with iframe
const container = GM_addElement(document.body, 'div', {
    'id': 'redgifs-container',
    'class': 'src-empty',
});

// Spinner
const loading = GM_addElement(container, 'div', {
    'class': 'lds-dual-ring',
});

// IFrame
const iframe = GM_addElement(container, 'iframe', {
    'data-redgifs': '',
});

// Onclick: hide container
container.onclick = e => {
    container.classList.add('src-empty');
};

// Remove src when close viewer
container.ontransitionend = e => {
    if (container.classList.contains('src-empty')) {
        iframe.src = '';
    }
};

// Replace watch to ifr in link
function toIfr(url) {
    return url.replace('/watch/', '/ifr/');
}

// Click: make container visible, set iframe src
document.addEventListener('click', e => {
    const link = e.target.closest('a[href*="redgifs.com/watch/"]');
    console.log(e);
    if (!link) return;
    console.log(e);
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    container.classList.remove('src-empty');
    iframe.src = toIfr(link.href);
});

// Styles
GM_addStyle(`
#redgifs-container {
    position: fixed;
    inset: 0;
    z-index: 999;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.15);
    transition: .2s ease;
    color-scheme: light;
    display: flex;
    & [data-redgifs] {
        height: 95%;
        width: 50%;
        border-radius: 10px;
        z-index: 0;
        border: none;
    }
}
.src-empty {
    pointer-events: none;
    visibility: hidden;
    opacity: 0;
}
.lds-dual-ring,
.lds-dual-ring:after {
    box-sizing: border-box;
}
.lds-dual-ring {
    position: absolute;
    display: inline-block;
    width: 80px;
    height: 80px;
    color: #d96946;
}
.lds-dual-ring:after {
    content: " ";
    display: block;
    width: 64px;
    height: 64px;
    margin: 8px;
    border-radius: 50%;
    border: 4.4px solid currentColor;
    border-color: currentColor transparent currentColor transparent;
    animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
}
body:has(#redgifs-container iframe[src^="https"]) {
    overflow-y: hidden;
}
a:not([class])[href*="redgifs.com/watch/"][data-testid="outbound-link"] {
    /* pointer-events: none; */
}
`);
