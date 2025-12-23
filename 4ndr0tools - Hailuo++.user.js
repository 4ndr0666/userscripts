// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     37.0
// @description UI non-functional but the script will work in the background and allow moderated content to generate and download.Status bypass, bracket obfuscation, bug-immune. Security research only.
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';

  //────── ONTOLOGICAL MASKING & SINGLETON ──────//
  const nomenclature = (() => {
    const r = () => Math.random().toString(36).substring(2, 10);
    const prefix = `Ψ_${r()}`;
    return {
      singleton: `_hkInit_${r()}`,
      cssId: `${prefix}_css`,
      hudBtnId: `${prefix}_hudBtn`,
      hudRootId: `${prefix}_hudRoot`,
      class: (name) => `${prefix}_${name}`,
    };
  })();

  if (window[nomenclature.singleton]) return;
  Object.defineProperty(window, nomenclature.singleton, { value: true, writable: false, configurable: false });

  //────── CORE STATE & CONFIG ──────//
  let CONFIG = {
    debugMode: false,
    promptObfuscation: 'bracket',
  };
  let ASSETS = [];
  const originalFetch = window.fetch;
  const originalJSONParse = JSON.parse;
  const originalWebSocket = window.WebSocket;

  const BYPASS_KEYS = [ 'statusInfo', 'sensitiveInfo', 'postStatus', 'humanCheckStatus', 'projectStatus', 'status' ];

  //────── UTILITIES ──────//
  function el(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (key === 'class') element.className = value;
      else if (key === 'style') Object.assign(element.style, value);
      else if (key === 'on' && typeof value === 'object')
        Object.entries(value).forEach(([ev, fn]) => element.addEventListener(ev, fn));
      else if (key === 'dataset' && value && typeof value === 'object')
        Object.entries(value).forEach(([dk, dv]) => element.dataset[dk] = dv);
      else element[key] = value;
    }
    // Flatten children and append as Node or text
    ([].concat(...children)).forEach(child => {
      if (!child && child !== 0) return;
      if (child instanceof Node) element.append(child);
      else if (typeof child === 'string' || typeof child === 'number') element.append(document.createTextNode(child));
      // Ignore false/null/undefined
    });
    return element;
  }

  //────── PERSISTENT STORAGE ──────//
  const storage = {
    _key: 'hailuo_assets_v10',
    async load() { return await GM_getValue(storage._key, []); },
    async save(data) { await GM_setValue(storage._key, data); }
  };

  //────── UI CONTROLLER ──────//
  let ui;
  const createUIController = () => {
    let hud;
    const psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="${nomenclature.class('glyph')}" fill="none" stroke="currentColor" stroke-width="3"><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700">Ψ</text></svg>`;

    const updateAssetList = () => {
      const container = hud?.querySelector('#assets-list');
      if (!container) return;
      container.innerHTML = '';
      if (!Array.isArray(ASSETS) || ASSETS.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#888;">Awaiting assets...</p>`;
        return;
      }
      ASSETS.slice().reverse().forEach(asset => {
        container.append(
          el('div', { class: nomenclature.class('asset-item') },
            el('img', { class: nomenclature.class('asset-thumb'), src: asset.thumb, loading: 'lazy', on: { error: (e) => (e.target.style.display = 'none') } }),
            el('div', { class: nomenclature.class('asset-url'), textContent: asset.url.split('/').pop(), title: asset.url }),
            el('div', { class: nomenclature.class('asset-actions') },
              el('button', { textContent: 'Open', on: { click: () => window.open(asset.url, '_blank') } }),
              el('button', { textContent: 'Copy', on: { click: () => { navigator.clipboard.writeText(asset.url); showToast('Copied!'); } } }),
              el('button', { textContent: 'DL', on: { click: () => downloadAsset(asset.url) } })
            )
          )
        );
      });
    };

    const showToast = (msg, duration = 2000) => {
      const toast = el('div', { class: nomenclature.class('toast'), textContent: msg });
      document.body.append(toast);
      setTimeout(() => toast.remove(), duration);
    };

    const downloadAsset = async (url) => {
      try {
        const response = await originalFetch(url, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const a = el('a', { href: URL.createObjectURL(blob), download: url.split('/').pop() || 'download' });
        document.body.append(a); a.click(); a.remove();
        URL.revokeObjectURL(a.href);
      } catch (e) { showToast('Download Failed!'); }
    };

    // Optional: Dragging support for the HUD
    let offsetX = 0, offsetY = 0, isDragging = false;
    function enableDrag(elem) {
      const header = elem.querySelector(`.${nomenclature.class('hud-header')}`);
      if (!header) return;
      header.onmousedown = function(e) {
        isDragging = true;
        offsetX = e.clientX - elem.offsetLeft;
        offsetY = e.clientY - elem.offsetTop;
        document.onmousemove = function(ev) {
          if (!isDragging) return;
          elem.style.left = (ev.clientX - offsetX) + 'px';
          elem.style.top = (ev.clientY - offsetY) + 'px';
          elem.style.right = 'auto'; // disable right anchor while dragging
        };
        document.onmouseup = function() {
          isDragging = false;
          document.onmousemove = null;
          document.onmouseup = null;
        };
      };
    }

    return {
      toggle: (force = null) => {
        if (!hud) {
          hud = el('div', { id: nomenclature.hudRootId, class: nomenclature.class('hud-container'), hidden: true }, [
            el('div', { class: nomenclature.class('hud-header') },
              el('div', { innerHTML: psiGlyphSVG }),
              el('div', { class: nomenclature.class('hud-title'), textContent: 'HailuoΨ Extractor' }),
              el('button', { class: nomenclature.class('hud-close-btn'), textContent: '×', on: { click: () => ui.toggle(false) } })
            ),
            el('div', { class: nomenclature.class('hud-content') },
              el('div', { class: nomenclature.class('panel-header') },
                el('h3', { textContent: 'Captured Assets' }),
                el('button', { textContent: 'Clear', on: { click: async () => { if (confirm('Clear all captured assets?')) { ASSETS = []; await storage.save(ASSETS); updateAssetList(); } } } })
              ),
              el('div', { id: 'assets-list', class: nomenclature.class('asset-list') })
            )
          ]);
          document.body.append(hud);
          enableDrag(hud);
        }
        hud.hidden = force !== null ? !force : !hud.hidden;
        if (!hud.hidden) updateAssetList();
      },
      updateAssetList,
      inject: () => {
        if (document.getElementById(nomenclature.cssId)) return;
        document.head.append(el('style', { id: nomenclature.cssId, textContent: `
          :root { --accent: #00E5FF; --bg1: #101827; --bg2: rgba(16,24,39,0.8); --text1: #EAEAEA; --text2: #9E9E9E; }
          .${nomenclature.class('hud-btn')} { position:fixed; bottom:20px; right:20px; width:50px; height:50px; background:var(--bg1); border:2px solid var(--accent); border-radius:50%; z-index:999998; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--accent); box-shadow:0 0 15px var(--accent); }
          .${nomenclature.class('glyph')} { width: 60%; height: 60%; }
          .${nomenclature.class('hud-container')} { position:fixed; top:100px; right:20px; z-index:999999; background:var(--bg2); backdrop-filter:blur(8px); border:2px solid var(--accent); border-radius:12px; box-shadow:0 0 25px rgba(0,229,255,0.2); width:500px; color:var(--text1); font-family:sans-serif; }
          .${nomenclature.class('hud-header')} { display:flex; align-items:center; padding:8px; background:var(--bg1); cursor:move; border-bottom:1px solid var(--accent); }
          .${nomenclature.class('hud-header')} .${nomenclature.class('glyph')} { width:30px; height:30px; margin-right:10px; }
          .${nomenclature.class('hud-title')} { font-weight:bold; flex-grow:1; }
          .${nomenclature.class('hud-close-btn')} { background:0; border:0; color:var(--text2); font-size:20px; cursor:pointer; }
          .${nomenclature.class('hud-content')} { padding:15px; max-height:60vh; overflow-y:auto; }
          .${nomenclature.class('panel-header')} { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
          .${nomenclature.class('panel-header')} h3 { margin:0; }
          .${nomenclature.class('asset-list')} { display:flex; flex-direction:column; gap:10px; }
          .${nomenclature.class('asset-item')} { display:grid; grid-template-columns:60px 1fr auto; gap:10px; align-items:center; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; }
          .${nomenclature.class('asset-thumb')} { width:60px; height:40px; object-fit:cover; border-radius:3px; }
          .${nomenclature.class('asset-url')} { word-break:break-all; font-size:0.9em; }
          .${nomenclature.class('asset-actions')} { display:flex; gap:5px; }
          .${nomenclature.class('asset-actions')} button, .${nomenclature.class('panel-header')} button { background:var(--accent); color:var(--bg1); border:0; padding:4px 8px; cursor:pointer; border-radius:3px; font-weight:bold; }
          .${nomenclature.class('toast')} { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--accent); color:var(--bg1); padding:10px 20px; border-radius:5px; z-index:1000000; font-weight:bold; }
        `}));
        document.body.append(el('button', { id: nomenclature.hudBtnId, className: nomenclature.class('hud-btn'), innerHTML: psiGlyphSVG, on: { click: () => ui.toggle() } }));
      },
    };
  };

  //────── NETWORK & DATA PROCESSING ──────//
  const obfuscatePrompt = (p) => {
    if (CONFIG.promptObfuscation === 'bracket' && p) {
      return p.split('').map(c => `[${c}]`).join('');
    }
    return p;
  };

  const processData = (data, depth = 0) => {
    if (!data || typeof data !== 'object' || depth > 50) return;
    if (Array.isArray(data)) {
      data.forEach(child => processData(child, depth + 1));
      return;
    }
    BYPASS_KEYS.forEach(key => {
      if (data[key] && typeof data[key] === 'object' && data[key].level && data[key].level !== 0) {
        data[key].level = 0;
      }
    });
    const url = data.downloadURLWithoutWatermark || data.videoUrl || data.imageUrl;
    if (url && typeof url === 'string' && url.startsWith('http')) {
      const newAsset = { url, thumb: data.coverUrl || data.feedURL || url };
      if (!ASSETS.some(a => a.url === newAsset.url)) {
        ASSETS.push(newAsset);
        storage.save(ASSETS);
        ui?.updateAssetList();
        GM_notification({ title: 'Asset Captured!', text: newAsset.url, timeout: 10000, onclick: () => window.open(newAsset.url, '_blank')});
      }
    }
    Object.values(data).forEach(child => processData(child, depth + 1));
  };

  const overrideNetwork = () => {
    window.fetch = async function(...args) {
      let [url, options] = args;
      if (typeof url === 'string') {
        if (url.includes('identitytoolkit.googleapis.com') || url.includes('/default_avatar.png')) {
          return new Response(null, { status: 404, statusText: 'Blocked by HailuoΨ' });
        }
        if (url.includes('/api/multimodal/generate/') && options?.method === 'POST') {
          try {
            const body = originalJSONParse(options.body);
            if (body.prompt) {
              body.prompt = obfuscatePrompt(body.prompt);
              options.body = JSON.stringify(body);
            }
          } catch (e) { }
        }
      }
      const response = await originalFetch.apply(this, args);
      if (response.ok && response.headers.get('Content-Type')?.includes('json')) {
        const clone = response.clone();
        try {
          const data = await response.json();
          processData(data);
          return new Response(JSON.stringify(data), {
            status: response.status, statusText: response.statusText, headers: response.headers,
          });
        } catch (e) { return clone; }
      }
      return response;
    };
    if (originalWebSocket) {
      window.WebSocket = class extends originalWebSocket {
        constructor(...args) {
          super(...args);
          this.addEventListener('message', (event) => {
            if (typeof event.data === 'string') {
              try {
                const data = originalJSONParse(event.data);
                processData(data);
              } catch (err) { }
            }
          });
        }
      };
    }
  };

  //────── INITIALIZATION ──────//
  async function initialize() {
    ASSETS = await storage.load();
    ui = createUIController();
    overrideNetwork();
    const observer = new MutationObserver((_, obs) => {
      const targetNode = document.querySelector('#app, #root, main');
      if (targetNode) { ui.inject(); obs.disconnect(); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    GM_registerMenuCommand('Open Asset HUD', () => ui.toggle(true));
    GM_registerMenuCommand(`Toggle Obfuscation: [${CONFIG.promptObfuscation}]`, async () => {
      CONFIG.promptObfuscation = CONFIG.promptObfuscation === 'bracket' ? 'none' : 'bracket';
      await GM_setValue('hailuo_config_v1', CONFIG);
    });
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', initialize);
  else initialize();

})();
