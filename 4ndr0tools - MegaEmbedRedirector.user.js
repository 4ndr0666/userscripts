// ==UserScript==
// @name         4ndr0tools - Mega.nz Embed Redirector
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.0.0
// @description  Bypass to the embedded URL and autoplays.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-MegaEmbedRedirector.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-MegaEmbedRedirector.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
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
