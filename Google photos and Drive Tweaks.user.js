// ==UserScript==
// @name         Google photos and Drive Tweaks
// @namespace    https://greasyfork.org/
// @version      1.0
// @description  Combines multiple functionalities such as image direct links, context menu removal, and non-intrusive UI integration for Google Photos and Drive.
// @author       4ndr0666
// @match        *://*.googleusercontent.com/*
// @match        *://*google.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/30580/Google%20Album%20Archive%20Direct%20Photo%20Link.user.js
// @updateURL https://update.greasyfork.org/scripts/30580/Google%20Album%20Archive%20Direct%20Photo%20Link.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Module 1: Direct Photo Link Enhancement
    const getDirectPhotoLink = () => {
        let linkSplit = window.location.href.split("=");
        let param = linkSplit[0].match(/(w\d+\-h\d+)((?:\-[rw|p|no]+)+)/);

        if (linkSplit[1] !== "s0-tmp.jpg" && linkSplit.length > 1) {
            linkSplit[0] = linkSplit[0] + "=s0-tmp.jpg";
            window.location.href = linkSplit[0]; // Redirect to updated link
        } else if (param) {
            linkSplit[0] = linkSplit[0].replace(param[0], "s0");
            window.location.href = linkSplit[0]; // Redirect to updated link
        }
    };

    // Module 2: Context Menu Integration (Right-click Blocker Neutralizer)
    const removeContextMenuBlockers = () => {
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });

        // MutationObserver to handle any dynamically added contextmenu blockers
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.target.removeAttribute('oncontextmenu'); // Remove inline event handlers
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    // Module 3: Display Direct Links in Google Photos
    const displaySearchLinks = () => {
        let src = window.location.href;
        let block = `
            <div style="background:#fff;padding:0 5px;position: fixed;z-index: 10000;left: 10px;top: 10px;">
                <a href="https://www.google.com/searchbyimage?image_url=${src}" target="_blank">Search in Google</a><br>
                <a href="https://yandex.ru/images/search?rpt=imageview&cbird=1&img_url=${encodeURIComponent(src).replace(/%20/g, '+')}" target="_blank">Search in Yandex</a>
            </div>
        `;

        $('body').append(block);
    };

    // Module 4: Notification System (Non-blocking)
    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.bottom = '20px';
        notification.style.left = '20px';
        notification.style.padding = '10px';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        notification.style.color = '#fff';
        notification.style.fontSize = '14px';
        notification.style.zIndex = '10001';
        notification.style.borderRadius = '5px';
        notification.innerText = message;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    // Initialize the functions
    try {
        // Check if it is a Google Photo URL and handle it accordingly
        if (window.location.href.includes('googleusercontent.com')) {
            getDirectPhotoLink();
            displaySearchLinks();
        }

        // Block right-click context menu from being added dynamically
        removeContextMenuBlockers();

        // Notify user of script activation
        showNotification('Google Photo Direct Link Script Activated');
    } catch (error) {
        console.error('Error occurred in the script: ', error);
    }
})();
