// ==UserScript==
// @name         4ndr0tools - YouTube Embed Redirect Button
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.3
// @description  Part of 4ndr0tools for "ease-of-life". Offers semi-transparent
//               and draggable button in top right corner. Right click it to
//               set a keybind (default Ctrl+E).
// @author       4ndr0666
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// license       MIT
// @run-at       document-end
// @noframes
// ==/UserScript==

(function() {
  'use strict';

  /* —————————— Config Storage —————————— */
  const STORAGE_KEY = 'ytEmbedRedirectHotkey';
  function getHotkey() {
    return localStorage.getItem(STORAGE_KEY) || 'Control+E';
  }
  function setHotkey(hk) {
    localStorage.setItem(STORAGE_KEY, hk);
    alert(`Hotkey set to ${hk}`);
    menu.querySelector('#setHotkey').textContent = `Set Hotkey (${getHotkey()})`;
  }

  /* —————————— Core Redirect —————————— */
  function embedNow() {
    const url = location.href;
    if (!/\/watch/.test(url)) {
      alert('Not on a watch page');
      return;
    }
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    if (!m) return alert('ID not found');
    location.href = `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1`;
  }

  /* —————————— Build Shadow Host —————————— */
  const host = document.createElement('div');
  host.style.cssText = `
    position: fixed;
    top: 40px; /* under the bookmark bar */
    right: 10px;
    z-index: 2147483647;
    user-select: none;
  `;
  document.documentElement.appendChild(host);
  const sd = host.attachShadow({mode:'open'});

  /* —————————— Styles —————————— */
  const css = `
    #btn {
      padding: 6px 12px;
      background: rgba(0,0,0,0.7);
      color: #15FFFF;
      border-radius: 4px;
      font: 14px sans-serif;
      cursor: pointer;
      transition: background .2s;
    }
    #btn:hover { background: rgba(0,0,0,0.9); }
    #menu {
      position: absolute;
      display: none;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: #000;
      border: 1px solid #15FFFF;
      border-radius: 4px;
      min-width: 140px;
      font: 13px sans-serif;
      color: #15FFFF;
    }
    #menu ul { margin:0; padding:4px 0; list-style:none; }
    #menu li {
      padding: 6px 12px;
      cursor: pointer;
    }
    #menu li:hover { background: rgba(21,255,255,0.1); }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  sd.appendChild(style);

  /* —————————— Button + Menu —————————— */
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
      <li id="setHotkey">Set Hotkey (${getHotkey()})</li>
    </ul>
  `;
  sd.appendChild(menu);

  // Menu event wiring
  sd.getElementById('doEmbed').addEventListener('click', () => {
    embedNow();
    menu.style.display = 'none';
  });
  sd.getElementById('setHotkey').addEventListener('click', () => {
    const ans = prompt('Enter new hotkey (e.g. Control+E or Alt+M):', getHotkey());
    if (ans) setHotkey(ans.trim());
    menu.style.display = 'none';
  });

  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    menu.style.left = e.offsetX + 'px';
    menu.style.top  = (btn.offsetHeight + 4) + 'px';
    menu.style.display = 'block';
  });
  // hide on outside click
  document.addEventListener('click', () => menu.style.display = 'none');

  /* —————————— Dragging —————————— */
  let drag = false, dx = 0, dy = 0;
  btn.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    drag = true;
    const rect = host.getBoundingClientRect();
    dx = e.clientX - rect.left;
    dy = e.clientY - rect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!drag) return;
    host.style.left = (e.clientX - dx) + 'px';
    host.style.top  = (e.clientY - dy) + 'px';
  });
  document.addEventListener('mouseup', () => { drag = false; });

  /* —————————— Hotkey —————————— */
  document.addEventListener('keydown', e => {
    const parts = getHotkey().split('+');
    const key = parts.pop().toLowerCase();
    const mods = parts.map(m=>m.toLowerCase());
    if (
      (!mods.includes('ctrl')   || e.ctrlKey) &&
      (!mods.includes('control')|| e.ctrlKey) &&
      (!mods.includes('alt')    || e.altKey)  &&
      (!mods.includes('shift')  || e.shiftKey) &&
      e.key.toLowerCase() === key
    ) {
      embedNow();
    }
  });

  /* —————————— Click Handler —————————— */
  btn.addEventListener('click', embedNow);

})();
