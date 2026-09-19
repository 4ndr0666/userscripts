// ==UserScript==
// @name         4ndr0tools - YouTube Embed Redirect Button
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.4
// @description  Floating button for redirects to embedded version. Right click it to set a keybind (default Ctrl+E).
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YouTubeEmbedRedirectButton.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20YouTubeEmbedRedirectButton.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @author       4ndr0666
// @match        https://*.youtube.com/*
// @grant        none
// license       MIT
// @run-at       document-end
// @noframes
// ==/UserScript==

(function() {
  'use strict';

  // —————————— Constants ——————————
  const STORAGE_KEY_HOTKEY = 'ytEmbedRedirectHotkey';
  const STORAGE_KEY_POSITION = 'ytEmbedRedirectButtonPos';
  const DEFAULT_HOTKEY = 'control+e'; // Stored in lowercase, 'control' instead of 'ctrl'
  const DEFAULT_TOP_OFFSET = 40; // Initial top position from viewport
  const DEFAULT_RIGHT_OFFSET = 10; // Initial right position from viewport
  const Z_INDEX = 2147483647; // Max z-index to ensure button is always on top

  // —————————— Utility Functions ——————————

  /**
   * Formats a hotkey string for display (e.g., "control+e" -> "Control+E").
   * @param {string} hk - The hotkey string.
   * @returns {string} The formatted hotkey string.
   */
  function formatHotkeyForDisplay(hk) {
    return hk.split('+')
             .map(part => part.charAt(0).toUpperCase() + part.slice(1))
             .join('+');
  }

  /**
   * Normalizes and retrieves the stored hotkey.
   * Normalizes 'ctrl' to 'control' for internal consistency.
   * @returns {string} The normalized hotkey string.
   */
  function getHotkey() {
    const stored = localStorage.getItem(STORAGE_KEY_HOTKEY) || DEFAULT_HOTKEY;
    return stored.split('+')
                 .map(part => {
                   const lowerPart = part.trim().toLowerCase();
                   return lowerPart === 'ctrl' ? 'control' : lowerPart;
                 })
                 .join('+');
  }

  /**
   * Sets and normalizes the hotkey in local storage.
   * @param {string} hk - The hotkey string to set.
   */
  function setHotkey(hk) {
    const normalizedHotkey = hk.split('+')
                               .map(part => {
                                 const lowerPart = part.trim().toLowerCase();
                                 return lowerPart === 'ctrl' ? 'control' : lowerPart;
                               })
                               .join('+');
    localStorage.setItem(STORAGE_KEY_HOTKEY, normalizedHotkey);
    alert(`Hotkey set to ${formatHotkeyForDisplay(normalizedHotkey)}`);
    // Update the menu item text to reflect the new hotkey
    menu.querySelector('#setHotkey').textContent = `Set Hotkey (${formatHotkeyForDisplay(getHotkey())})`;
  }

  /**
   * Retrieves the stored button position from local storage.
   * Falls back to default if no valid position is stored.
   * @returns {{top: string, left?: string, right?: string}} The position object.
   */
  function getButtonPosition() {
    try {
      const storedPos = localStorage.getItem(STORAGE_KEY_POSITION);
      if (storedPos) {
        const parsed = JSON.parse(storedPos);
        // Ensure both top and left are present for a valid stored position
        if (parsed.top && parsed.left) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('4ndr0tools: Failed to parse button position from localStorage:', e);
    }
    // Default position if nothing valid is stored or parsing failed
    return { top: `${DEFAULT_TOP_OFFSET}px`, right: `${DEFAULT_RIGHT_OFFSET}px` };
  }

  /**
   * Saves the current button position (top and left) to local storage.
   * @param {string} top - The 'top' CSS value.
   * @param {string} left - The 'left' CSS value.
   */
  function setButtonPosition(top, left) {
    localStorage.setItem(STORAGE_KEY_POSITION, JSON.stringify({ top, left }));
  }

  // —————————— Core Redirect Logic ——————————
  function embedNow() {
    const url = location.href;
    // Check if it's a YouTube watch page
    if (!/\/watch/.test(url)) {
      alert('Not on a YouTube watch page.');
      return;
    }
    // Extract video ID from URL (supports standard and youtu.be links)
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    if (!match || !match[1]) {
      alert('Video ID not found in URL.');
      return;
    }
    // Redirect to the embed URL with autoplay and mute
    location.href = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
  }

  // —————————— Build Shadow Host ——————————
  const host = document.createElement('div');
  const initialPos = getButtonPosition();
  host.style.cssText = `
    position: fixed;
    top: ${initialPos.top};
    ${initialPos.left ? `left: ${initialPos.left};` : `right: ${initialPos.right};`} /* Use left if stored, else right */
    z-index: ${Z_INDEX};
    user-select: none;
  `;
  document.documentElement.appendChild(host);
  const sd = host.attachShadow({mode:'open'}); // Use open mode for easier debugging if needed

  // —————————— Styles ——————————
  const css = `
    #btn {
      padding: 6px 12px;
      background: rgba(0,0,0,0.7);
      color: #15FFFF;
      border-radius: 4px;
      font: 14px sans-serif;
      cursor: grab; /* Indicates draggable */
      transition: background .2s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3); /* Subtle shadow for depth */
    }
    #btn:hover {
      background: rgba(0,0,0,0.9);
    }
    #menu {
      position: absolute;
      display: none;
      top: 100%; /* Position below the button */
      right: 0;  /* Align to the right edge of the button's container */
      margin-top: 4px;
      background: #000;
      border: 1px solid #15FFFF;
      border-radius: 4px;
      min-width: 140px;
      font: 13px sans-serif;
      color: #15FFFF;
      box-shadow: 0 2px 8px rgba(0,0,0,0.6); /* More prominent shadow for menu */
    }
    #menu ul {
      margin: 0;
      padding: 4px 0;
      list-style: none;
    }
    #menu li {
      padding: 6px 12px;
      cursor: pointer;
    }
    #menu li:hover {
      background: rgba(21,255,255,0.1);
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  sd.appendChild(style);

  // —————————— Button + Menu Elements ——————————
  const btn = document.createElement('div');
  btn.id = 'btn';
  btn.textContent = 'Embed';
  btn.title = 'Click or hotkey; drag to move; right-click for menu';
  sd.appendChild(btn);

  const menu = document.createElement('div');
  menu.id = 'menu';
  menu.innerHTML = `
    <ul>
      <li id="doEmbed">Embed Now</li>
      <li id="setHotkey">Set Hotkey (${formatHotkeyForDisplay(getHotkey())})</li>
    </ul>
  `;
  sd.appendChild(menu);

  // —————————— Menu Event Wiring ——————————
  sd.getElementById('doEmbed').addEventListener('click', () => {
    embedNow();
    menu.style.display = 'none'; // Hide menu after action
  });

  sd.getElementById('setHotkey').addEventListener('click', () => {
    const ans = prompt('Enter new hotkey (e.g. Control+E or Alt+M):', formatHotkeyForDisplay(getHotkey()));
    if (ans) { // Only set if user provides input (not null or empty string)
      setHotkey(ans.trim());
    }
    menu.style.display = 'none'; // Hide menu after action
  });

  btn.addEventListener('contextmenu', e => {
    e.preventDefault(); // Prevent default right-click context menu
    // Menu is already positioned with right:0 in CSS, no need for e.offsetX
    menu.style.display = 'block'; // Show the custom menu
  });

  // Hide menu when clicking anywhere outside the shadow DOM
  document.addEventListener('click', e => {
    if (!sd.contains(e.target)) { // Check if the click target is NOT within the shadow DOM
      menu.style.display = 'none';
    }
  });

  // —————————— Dragging Functionality ——————————
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  btn.addEventListener('mousedown', e => {
    if (e.button !== 0) return; // Only respond to left-click for dragging
    isDragging = true;
    btn.style.cursor = 'grabbing'; // Change cursor to indicate active drag
    const rect = host.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault(); // Prevent default browser drag behavior (e.g., text selection)
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    // Calculate new position relative to the viewport
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;

    // Optional: Constrain button within viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const hostWidth = host.offsetWidth;
    const hostHeight = host.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - hostWidth));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - hostHeight));

    host.style.left = newLeft + 'px';
    host.style.top  = newTop + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      btn.style.cursor = 'grab'; // Reset cursor
      // Save the final position after dragging ends
      setButtonPosition(host.style.top, host.style.left);
    }
  });

  // —————————— Hotkey Functionality ——————————
  document.addEventListener('keydown', e => {
    // Ignore key presses if focus is on input fields or editable elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const hotkey = getHotkey(); // Get the normalized hotkey (e.g., "control+e")
    const parts = hotkey.split('+');
    const requiredKey = parts.pop(); // The main key (e.g., 'e')
    const requiredMods = new Set(parts); // Set of required modifiers (e.g., {'control'})

    // Check if the main key pressed matches the required key
    if (e.key.toLowerCase() !== requiredKey) {
      return;
    }

    // Determine actual modifiers pressed
    const actualMods = new Set();
    if (e.ctrlKey) actualMods.add('control');
    if (e.altKey) actualMods.add('alt');
    if (e.shiftKey) actualMods.add('shift');

    // Check if the number of actual modifiers matches the number of required modifiers
    if (requiredMods.size !== actualMods.size) {
      return;
    }

    // Check if all required modifiers are present in the actual modifiers
    for (const mod of requiredMods) {
      if (!actualMods.has(mod)) {
        return;
      }
    }

    // If all checks pass, trigger the action and prevent default browser behavior
    e.preventDefault();
    embedNow();
  });

  // —————————— Button Click Handler ——————————
  btn.addEventListener('click', embedNow);

})();
