// ==UserScript==
// @name        4ndr0tools - BrokenImgFixer
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.1
// @description Detect and reload failed images gracefully with robust cache-busting.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BrokenImgFixer.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20BrokenImgFixer.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*/*
// @license     MIT
// @grant       none
// ==/UserScript==

/* eslint-env browser, violentmonkey */

/**
 * Forces a reload of broken images using a robust cache-busting technique.
 * It appends a unique timestamp as a query parameter to the image src.
 * Checks for `img.complete` (standard) and `:-moz-broken` (Firefox-specific).
 */
function reloadImages() {
  for (const img of document.images) {
    // Check if the image has failed to load completely or is marked as broken by Firefox.
    // `!img.complete` checks if the image has not finished loading or failed.
    // `img.matches("[src]:-moz-broken")` is a Firefox-specific pseudo-class
    // that identifies images that failed to load.
    if (!img.complete || img.matches("[src]:-moz-broken")) {
      try {
        // Use the URL API for robust and safe URL manipulation. This correctly handles
        // URLs that already have query parameters or fragments.
        // The second argument provides a base URL for resolving relative image paths.
        const url = new URL(img.src, window.location.href);

        // Set a unique query parameter using the current timestamp. This is a standard
        // cache-busting technique that forces the browser to re-fetch the resource.
        url.searchParams.set('_cache_bust', Date.now());

        // Assign the newly constructed URL back to the image's src attribute.
        img.src = url.toString();
      } catch (error) {
        // If the src is not a valid URL (e.g., malformed data URI), the URL constructor will fail.
        // In this edge case, we fall back to the original, simpler hash-append method.
        console.warn("BrokenImgFixer: Could not parse image src. Falling back to hash append.", { src: img.src, error });
        // Avoid appending multiple hashes if the script is run repeatedly on a failing URL.
        if (!img.src.endsWith('#')) {
          img.src += "#";
        }
      }
    }
  }
}

/**
 * Broadcasts a message to all frames (including iframes) to trigger image reloading.
 * Uses try...catch to safely handle cross-origin frame access, which can throw SecurityError.
 */
function broadcastEvent() {
  // window.frames includes all immediate child frames of the current window.
  for (const win of window.frames) {
    try {
      // Post a message to the frame. The '*' target origin allows communication
      // across different origins, which is necessary for a userscript like this.
      win.postMessage("RELOAD_BROKEN_IMAGES", "*");
    } catch (error) {
      // Catch SecurityError which occurs when trying to access or post messages
      // to cross-origin iframes. This is expected behavior in a sandboxed environment.
      if (error instanceof DOMException && error.name === 'SecurityError') {
        console.warn("BrokenImgFixer: Could not post message to a cross-origin frame. This is expected and can be ignored.", error.message);
      } else {
        // Log any other unexpected errors for debugging purposes.
        console.error("BrokenImgFixer: An unexpected error occurred while broadcasting.", { frame: win, error });
      }
    }
  }
}

/**
 * Initializes the script by setting up event listeners for keyboard input
 * and incoming messages from other frames.
 */
function init() {
  // Listen for the 'keyup' event to detect the keyboard shortcut.
  window.addEventListener("keyup", e => {
    // Trigger reload if Alt + R (case-insensitive) is pressed.
    // Using e.key is the modern and recommended approach over deprecated keyCode.
    if (e.altKey && e.key.toLowerCase() === "r") {
      console.log("BrokenImgFixer: Alt+R detected. Reloading broken images...");
      reloadImages();
      broadcastEvent();
    }
  });

  // Listen for messages from other frames or the parent window.
  window.addEventListener("message", e => {
    // Ensure the message data is our specific reload command to avoid acting on other messages.
    if (e.data === "RELOAD_BROKEN_IMAGES") {
      console.log("BrokenImgFixer: Received RELOAD_BROKEN_IMAGES message. Reloading...");
      reloadImages();
      // Re-broadcast the event to ensure nested iframes also receive the command.
      broadcastEvent();
    }
  });
}

// Initialize the script.
init();
