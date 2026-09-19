// ==UserScript==
// @name         4ndr0tools - Mega.nz Embed Redirector
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.0.0
// @description  Bypass to the embedded URL and autoplays.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20MegaEmbedRedirector.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20MegaEmbedRedirector.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        https://mega.nz/*
// @icon         https://avatars.githubusercontent.com/u/4920706?s=200&v=4
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Function to redirect standard file URLs to embed URLs
    function redirectToEmbed() {
        const url = window.location.href;
        const fileRegex = /^https:\/\/mega\.nz\/file\/([a-zA-Z0-9_-]+)(#[\w-]+)?$/;
        if (fileRegex.test(url)) {
            // Extract the file ID and hash
            const match = url.match(fileRegex);
            const fileId = match[1];
            const fileHash = match[2] || '';
            // Construct the embed URL
            const embedUrl = `https://mega.nz/embed/${fileId}${fileHash}`;
            // Redirect to the embed URL
            window.location.replace(embedUrl);
        }
    }

    // Function to enhance video playback on embed pages
    function enhanceVideoPlayback() {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            // Ensure the video metadata is loaded
            videoElement.addEventListener('loadedmetadata', function() {
                // Attempt to autoplay the video
                const playPromise = videoElement.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Autoplay succeeded, attempt to enter fullscreen
                        if (videoElement.requestFullscreen) {
                            videoElement.requestFullscreen();
                        } else if (videoElement.mozRequestFullScreen) { // Firefox
                            videoElement.mozRequestFullScreen();
                        } else if (videoElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
                            videoElement.webkitRequestFullscreen();
                        } else if (videoElement.msRequestFullscreen) { // IE/Edge
                            videoElement.msRequestFullscreen();
                        }
                    }).catch(() => {
                        // Autoplay failed, user interaction may be required
                    });
                }
            });
        }
    }

    // Check if we're on a standard file URL and redirect
    redirectToEmbed();

    // If we're on an embed page, enhance the video playback
    if (window.location.href.startsWith('https://mega.nz/embed/')) {
        // Wait for the DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', enhanceVideoPlayback);

        // Observe changes in the DOM in case the video element is added dynamically
        const observer = new MutationObserver((mutationsList, observer) => {
            if (document.querySelector('video')) {
                enhanceVideoPlayback();
                observer.disconnect(); // Stop observing once we've found the video element
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
