// ==UserScript==
// @name        4ndr0tools - BrokenImgFixer
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @description Part of 4ndr0tools - Shows and reloads broken images
// downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BrokenImgFixer.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BrokenImgFixer.user.js
// @match       http*://*.*/*
// @license     MIT
// @grant       none
// ==/UserScript==

/* eslint-env browser, violentmonkey */

/**
 * Forces a reload of broken images by appending a hash to their src.
 * Checks for `img.complete` (standard) and `:-moz-broken` (Firefox-specific).
 */
function reloadImages() {
  for (const img of document.images) {
    // Check if the image has failed to load completely or is marked as broken by Firefox.
    // `!img.complete` checks if the image has not finished loading or failed.
    // `img.matches("[src]:-moz-broken")` is a Firefox-specific pseudo-class
    // that identifies images that failed to load.
    if (!img.complete || img.matches("[src]:-moz-broken")) {
      // Appending '#' to the src forces the browser to re-request the image,
      // as it considers it a new URL, without changing the actual resource path.
      img.src += "#";
    }
  }
}

/**
 * Broadcasts a message to all frames (including iframes) to trigger image reloading.
 * Uses try...catch to safely handle cross-origin frame access, which can throw SecurityError.
 */
function broadcastEvent() {
  for (const win of window.frames) {
    try {
      // Post a message to the frame. The '*' target origin is used for simplicity
      // in userscripts to communicate across different origins.
      win.postMessage("RELOAD_BROKEN_IMAGES", "*");
    } catch (error) {
      // Catch SecurityError which occurs when trying to access or post messages
      // to cross-origin iframes. Log a warning but continue the broadcast.
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.warn("BrokenImgFixer: Could not post message to a cross-origin frame.", win, error);
      } else {
        // Log any other unexpected errors.
        console.error("BrokenImgFixer: An unexpected error occurred while broadcasting.", win, error);
      }
    }
  }
}

/**
 * Initializes the script by setting up event listeners for keyboard input
 * and incoming messages from other frames.
 */
function init() {
  // Listen for the 'keyup' event to detect keyboard shortcuts.
  window.addEventListener("keyup", e => {
    // Trigger reload if Alt + R (case-insensitive) is pressed.
    // Using e.key is more modern and readable than e.keyCode.
    if ((e.key === "r" || e.key === "R") && e.altKey) {
      reloadImages();
      broadcastEvent();
    }
  });

  // Listen for messages from other frames or the parent window.
  window.addEventListener("message", e => {
    // If the message data is our specific reload command, trigger reload.
    if (e.data === "RELOAD_BROKEN_IMAGES") {
      reloadImages();
      // Re-broadcast the event to ensure nested iframes also receive the command.
      broadcastEvent();
    }
  });
}

// Initialize the script when the DOM is ready.
// The unnecessary outer block has been removed.
init();
