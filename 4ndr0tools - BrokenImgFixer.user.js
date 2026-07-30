// ==UserScript==
// @name        4ndr0tools - BrokenImgFixer
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.2
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
 * Runtime version constant — mirrors @version for introspection and debugging.
 * Increment this alongside the @version header on every release.
 */
const SCRIPT_VERSION = "1.2";

/**
 * Set to true to enable verbose console output.
 * Ship as false; toggle in DevTools console: `window.__BIF_DEBUG = true`
 */
const DEBUG = false;

/** @param {...unknown} args */
function dbg(...args) {
  if (DEBUG || window.__BIF_DEBUG) console.log("[BrokenImgFixer]", ...args);
}

// ---------------------------------------------------------------------------
// Feature-detect: `:-moz-broken` is a Firefox-only pseudo-class that throws a
// SyntaxError in Chromium and other engines. We probe it once at startup so
// `reloadImages` can use it safely without try/catch on every image.
// ---------------------------------------------------------------------------
let MOZ_BROKEN_SUPPORTED = false;
try {
  // If the pseudo-class is unknown the browser may throw or silently return false.
  // We throw deliberately via `querySelectorAll` which is strict about syntax in
  // browsers that do not recognise the pseudo-class.
  document.querySelectorAll("[src]:-moz-broken");
  MOZ_BROKEN_SUPPORTED = true;
} catch (_) {
  MOZ_BROKEN_SUPPORTED = false;
}

// ---------------------------------------------------------------------------
// reloadImages
// ---------------------------------------------------------------------------

/**
 * Returns true when `img` is verifiably broken:
 *   • `img.complete` is true AND `img.naturalWidth === 0` — image finished
 *     loading but decoded nothing (the canonical cross-browser broken signal).
 *   • `!img.complete` — still in-flight; we skip these; a failed load will
 *     fire an `error` event and `complete` will become true with naturalWidth 0.
 *   • `:-moz-broken` — Firefox only; catches the edge-case where complete is
 *     true but the pseudo-class is set before naturalWidth updates.
 *
 * @param {HTMLImageElement} img
 * @returns {boolean}
 */
function isBroken(img) {
  // An image without a src attribute is intentionally empty — skip it.
  if (!img.hasAttribute("src") || img.src === "") return false;

  // Primary cross-browser signal: fully loaded but decoded nothing.
  if (img.complete && img.naturalWidth === 0) return true;

  // Firefox-specific fallback (only attempted when confirmed supported).
  if (MOZ_BROKEN_SUPPORTED) {
    try {
      if (img.matches("[src]:-moz-broken")) return true;
    } catch (_) {
      // Defensive: if the feature-detect was a false positive, suppress silently.
    }
  }

  return false;
}

/**
 * Forces a reload of every broken image in `document.images` using a
 * cache-busting query parameter.
 *
 * Invariants upheld:
 *   • `_cache_bust` timestamp is captured ONCE before the loop so that all
 *     images processed within the same millisecond receive distinct handling
 *     and none silently share a stale value from a prior bust cycle.
 *   • Any pre-existing `_cache_bust` param is deleted before setting the new
 *     one, keeping URLs from growing unboundedly across repeated invocations.
 *   • The hash-append fallback checks for an already-appended `#` to remain
 *     idempotent, then validates the resulting src is a non-empty string.
 */
function reloadImages() {
  // Capture once — all images in this pass share the same bust token.
  // This is intentional: uniqueness is guaranteed by page-load epoch, not
  // per-image; a shared token is fine and keeps cache-hit accounting coherent.
  const bustValue = String(Date.now());
  let count = 0;

  for (const img of document.images) {
    if (!isBroken(img)) continue;

    try {
      const url = new URL(img.src, window.location.href);

      // Remove any previously set bust param to prevent URL bloat across
      // repeated Alt+R presses or cascaded frame broadcasts.
      url.searchParams.delete("_cache_bust");
      url.searchParams.set("_cache_bust", bustValue);

      img.src = url.toString();
      count++;
    } catch (error) {
      // URL constructor throws TypeError for genuinely malformed src values
      // (e.g., bare `javascript:void(0)`, malformed data URIs, etc.).
      // Fall back to hash-append — idempotent: strip any existing bare hash first.
      console.warn(
        "[BrokenImgFixer] Could not parse src; falling back to hash-append.",
        { src: img.src, error }
      );

      // Strip trailing `#` (and any fragment) left by a prior fallback pass.
      const stripped = img.src.replace(/#.*$/, "");
      if (stripped) {
        img.src = stripped + "#";
        count++;
      }
    }
  }

  dbg(`reloadImages: processed ${count} broken image(s) with bust=${bustValue}`);
}

// ---------------------------------------------------------------------------
// broadcastEvent
// ---------------------------------------------------------------------------

/**
 * Posts `RELOAD_BROKEN_IMAGES` to all IMMEDIATE child frames.
 *
 * Architecture note: `window.postMessage` with targetOrigin `"*"` reaches only
 * direct children. Deeply nested cross-origin frames are unreachable at the
 * postMessage layer — they will only receive the broadcast if they are
 * same-origin with an ancestor that re-broadcasts (which this script's own
 * message listener does for frames that load this script).  This is a
 * fundamental browser security constraint, not a limitation of this script.
 *
 * Non-SecurityError DOMExceptions (e.g., `InvalidStateError` from a detached
 * or closed frame) are caught and logged distinctly from truly unexpected errors.
 */
function broadcastEvent() {
  for (const win of window.frames) {
    try {
      win.postMessage("RELOAD_BROKEN_IMAGES", "*");
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === "SecurityError") {
          // Expected: cross-origin frame sandbox restriction.
          dbg("broadcastEvent: SecurityError posting to cross-origin frame (expected).", error.message);
        } else {
          // e.g. InvalidStateError — frame detached or navigating away.
          console.warn(
            "[BrokenImgFixer] DOMException posting to frame; frame may be detached.",
            { name: error.name, message: error.message }
          );
        }
      } else {
        // Genuinely unexpected — surface it.
        console.error(
          "[BrokenImgFixer] Unexpected error broadcasting to frame.",
          { frame: win, error }
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// init
// ---------------------------------------------------------------------------

/**
 * Performs a single eager scan of the current document for broken images.
 * Called after the DOM is interactive so `document.images` is populated.
 * This handles images that were already broken before the script loaded —
 * the keyboard shortcut cannot help with those since the user may not know
 * to press it.
 */
function initialScan() {
  dbg(`v${SCRIPT_VERSION} initialScan starting.`);
  reloadImages();
  // Do NOT broadcast during initial scan: child frames will run their own
  // initialScan when this script loads inside them (if @match applies).
}

/**
 * Initializes all runtime event listeners:
 *   • Alt+R  — keyboard shortcut for manual retrigger
 *   • message — receives RELOAD_BROKEN_IMAGES from parent/sibling frames
 *
 * Also schedules an eager initial scan once the DOM is ready.
 */
function init() {
  // Alt+R: manual retrigger.
  window.addEventListener("keyup", (e) => {
    if (e.altKey && e.key.toLowerCase() === "r") {
      dbg("Alt+R detected — triggering reload.");
      reloadImages();
      broadcastEvent();
    }
  });

  // Cross-frame message handler.
  window.addEventListener("message", (e) => {
    if (e.data === "RELOAD_BROKEN_IMAGES") {
      dbg("Received RELOAD_BROKEN_IMAGES from", e.origin);
      reloadImages();
      // Re-broadcast to our own immediate children so the signal propagates
      // one hop deeper into the frame tree (same-origin frames that also carry
      // this script will repeat this step at their level).
      broadcastEvent();
    }
  });

  // Eager initial scan — deferred to ensure document.images is populated.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialScan, { once: true });
  } else {
    // Document is already interactive or complete.
    initialScan();
  }

  dbg(`v${SCRIPT_VERSION} initialized. MOZ_BROKEN_SUPPORTED=${MOZ_BROKEN_SUPPORTED}`);
}

// Entry point.
init();
