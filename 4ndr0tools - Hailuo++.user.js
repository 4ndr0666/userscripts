// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     3.0.0
// @description Parasitic toolkit for hailuoai.video. Assimilated recon intel for enhanced endpoint interception, status bypass, and obfuscation. Security research Only. 
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @connect     api.github.com
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';

  // CRITICAL DEBUGGING OVERRIDE: Live weapon system. Debug false for opsec.
  const _forceDebugMode = false;

  //────── ONTOLOGICAL MASKING ENGINE ──────//
  const nomenclature = (() => {
    const r = () => Math.random().toString(36).substring(2, 10);
    const prefix = `Ψ_${r()}`;
    return {
      singleton: `_hkInit_${r()}`,
      cssId: `${prefix}_css`,
      hudBtnId: `${prefix}_hudBtn`,
      hudRootId: `${prefix}_hudRoot`,
      honeypotDomId: `_hk_probe_${r()}`, // PRIMARY HONEYPOT IDENTIFIER
      class: (name) => `${prefix}_${name}`,
    };
  })();

  //────── SINGLETON LOCK ──────//
  if (window[nomenclature.singleton]) {
    console.log('[HailuoΨ INIT] Singleton active. Exiting.');
    return;
  }
  Object.defineProperty(window, nomenclature.singleton, { value: true, writable: false, configurable: false });
  console.log(`[HailuoΨ INIT] Engaged at document-start. Debug: ${_forceDebugMode}`);

  //────── CSP NEUTRALIZATION ──────//
  const neutralizeMetaCSP = () => {
    const removeCSP = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'META' && node.httpEquiv?.toLowerCase() === 'content-security-policy') {
        node.remove();
        console.log('[HailuoΨ CSP] Neutralized:', node.outerHTML);
        return true;
      }
      return false;
    };
    if (document.head) Array.from(document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]')).forEach(removeCSP);
    const observer = new MutationObserver((mutations) => mutations.forEach(m => m.addedNodes.forEach(n => removeCSP(n))));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    console.log('[HailuoΨ CSP] Observer active.');
  };
  neutralizeMetaCSP();

  /**
   * UIController: Electric-Glass HUD management with ontological masking.
   */
  class UIController {
    #kit;
    #hud;
    #contentPanel;
    #debouncedUpdateAssetList;
    #psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="${nomenclature.class('glyph')}" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text></svg>`;

    constructor(kitInstance) {
      this.#kit = kitInstance;
      this.#debouncedUpdateAssetList = this.#kit.debounce(this.#updateAssetList.bind(this), 300);
    }

    initialize() {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.injectHudStyles());
      } else {
        this.injectHudStyles();
      }
      const observer = new MutationObserver((_, obs) => {
        if (document.querySelector('#app, [data-reactroot]')) {
          this.createHudButton();
          obs.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    toggleHudVisibility = (force = null) => {
      if (!this.#hud) this.#createHud();
      const state = force ?? this.#hud.hidden;
      this.#hud.hidden = !state;
      if (state) {
        this.#switchTab(this.#kit.state.currentTab);
        this.#kit.log('HUD engaged.');
      } else {
        this.#kit.log('HUD disengaged.');
      }
    };

    updateAssetList = () => this.#debouncedUpdateAssetList();

    showToast = (msg, duration = 3000) => {
      const toast = this.#createElement('div', { className: nomenclature.class('toast'), textContent: msg });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), duration);
    };

    #createElement = (tag, props = {}, children = []) => {
      const el = document.createElement(tag);
      for (const [key, value] of Object.entries(props)) {
        if (value == null) continue;
        if (key === 'style') Object.assign(el.style, value);
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else if (key === 'events') Object.entries(value).forEach(([ev, listener]) => el.addEventListener(ev, listener));
        else if (key === 'innerHTML') el.innerHTML = value;
        else el[key] = value;
      }
      children.forEach(c => el.append(c));
      return el;
    };

    injectHudStyles = () => {
      if (document.getElementById(nomenclature.cssId)) return;
      document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&family=Cinzel+Decorative:wght@700&display=swap">`);
      const style = this.#createElement('style', { id: nomenclature.cssId });
      style.textContent = `
        :root { --accent-cyan: #00E5FF; --text-cyan-active: #67E8F9; --accent-cyan-border-hover: rgba(0,229,255,0.5); --accent-cyan-bg-active: rgba(0,229,255,0.2); --accent-cyan-glow-active: rgba(0,229,255,0.4); --text-primary: #EAEAEA; --text-secondary: #9E9E9E; --font-body: 'Roboto Mono', monospace; }
        .${nomenclature.class('hud-container')} { position: fixed; bottom: 2.6em; right: 2.6em; z-index: 999999; background: rgba(16,24,39,0.8); backdrop-filter: blur(6px); border-radius: 1.2em; border: 2.5px solid #15adad; box-shadow: 0 0 36px rgba(21,250,250,0.2), 0 1.5px 8px #000b; min-width: 520px; max-width: 94vw; color: #EAEAEA; font-family: 'Roboto Mono', monospace; user-select: text; opacity: 0.99; }
        .${nomenclature.class('hud-container')}[hidden] { display: none !important; }
        .${nomenclature.class('hud-header')} { display: flex; align-items: center; padding: 1.2em 1em 0.3em 1.2em; border-bottom: 1.5px solid #15adad; gap: 1.1em; font-family: 'Orbitron', sans-serif; cursor: grab; user-select: none; }
        .${nomenclature.class('hud-header')} .${nomenclature.class('glyph')} { flex: none; width: 44px; height: 44px; }
        .${nomenclature.class('hud-header')} .${nomenclature.class('title')} { flex: 1; font-weight: 700; background: linear-gradient(to right, #15fafa, #15adad, #157d7d); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: 0.1em; text-shadow: 0 0 9px rgba(21,250,250,0.4); font-size: 1.1em; }
        .${nomenclature.class('hud-close-btn')} { font-size: 1.3em; border: none; background: none; color: #9E9E9E; cursor: pointer; }
        .${nomenclature.class('hud-close-btn')}:hover { color: #00E5FF; }
        .${nomenclature.class('hud-tabs')} { display: flex; gap: 0.5em; padding: 0.8em 1.2em; background: #101827; }
        .${nomenclature.class('hud-button')} { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid transparent; font-family: 'Roboto Mono', monospace; font-weight: 500; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; color: #9E9E9E; background-color: rgba(0,0,0,0.3); cursor: pointer; transition: all 300ms ease-in-out; }
        .${nomenclature.class('hud-button')}:hover { color: #00E5FF; border-color: rgba(0,229,255,0.5); }
        .${nomenclature.class('hud-button')}.active { color: #67E8F9; background-color: rgba(0,229,255,0.2); border-color: #00E5FF; box-shadow: 0 0 15px rgba(0,229,255,0.4); }
        .${nomenclature.class('hud-content')} { padding: 1.2em; max-height: 70vh; overflow-y: auto; }
        .${nomenclature.class('config-grid')} { display: grid; grid-template-columns: 1fr auto; gap: 1em; align-items: center; }
        .${nomenclature.class('config-grid')} label { font-weight: bold; }
        .${nomenclature.class('asset-list')} { display: flex; flex-direction: column; gap: 1em; }
        .${nomenclature.class('asset-item')} { display: flex; gap: 1em; align-items: center; border: 1px solid #15adad; padding: 0.5em; border-radius: 0.5em; }
        .${nomenclature.class('asset-thumb')} { width: 80px; height: auto; object-fit: cover; }
        .${nomenclature.class('asset-url')} { flex: 1; word-break: break-all; }
        .${nomenclature.class('asset-actions')} { display: flex; gap: 0.5em; }
        .${nomenclature.class('hud-btn')} { padding: 0.3em 0.8em; background: #15adad; border: none; color: #101827; cursor: pointer; font-family: 'Roboto Mono', monospace; }
        .${nomenclature.class('hud-btn')}:hover { background: #15fafa; }
        .${nomenclature.class('toast')} { position: fixed; bottom: 1em; left: 50%; transform: translateX(-50%); background: #101827; color: #EAEAEA; padding: 1em; border-radius: 0.5em; box-shadow: 0 0 10px rgba(21,250,250,0.4); z-index: 1000000; }
      `;
      document.head.appendChild(style);
    };

    createHudButton = () => {
      if (document.getElementById(nomenclature.hudBtnId)) return;
      const btn = this.#createElement('div', { id: nomenclature.hudBtnId, innerHTML: this.#psiGlyphSVG, title: 'HailuoΨ HUD', style: { position: 'fixed', bottom: '2em', right: '2em', width: '64px', height: '64px', cursor: 'pointer', zIndex: 999998, filter: 'drop-shadow(0 0 12px #00E5FF)' }, events: { click: () => this.toggleHudVisibility(true) } });
      document.body.appendChild(btn);
    };

    #createHud = () => {
      this.#hud = this.#createElement('div', { id: nomenclature.hudRootId, className: nomenclature.class('hud-container'), hidden: true }, [
        this.#createElement('div', { className: nomenclature.class('hud-header') }, [
          this.#createElement('div', { innerHTML: this.#psiGlyphSVG }),
          this.#createElement('div', { className: nomenclature.class('title'), textContent: 'HailuoΨ' }),
          this.#createElement('button', { className: nomenclature.class('hud-close-btn'), textContent: '×', events: { click: () => this.toggleHudVisibility(false) } }),
        ]),
        this.#createElement('div', { className: nomenclature.class('hud-tabs') }, [
          this.#createElement('button', { className: `${nomenclature.class('hud-button')} active`, dataset: { tab: 'assets' }, textContent: 'Assets', events: { click: () => this.#switchTab('assets') } }),
          this.#createElement('button', { className: nomenclature.class('hud-button'), dataset: { tab: 'config' }, textContent: 'Config', events: { click: () => this.#switchTab('config') } }),
        ]),
        this.#contentPanel = this.#createElement('div', { className: nomenclature.class('hud-content') }),
      ]);
      document.body.appendChild(this.#hud);
      this.#makeDraggable(this.#hud);
    };

    #switchTab = (tab) => {
      this.#kit.state.currentTab = tab;
      this.#hud.querySelectorAll(`.${nomenclature.class('hud-button')}`).forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      this.#contentPanel.innerHTML = '';
      if (tab === 'assets') this.#renderAssetsPanel();
      else if (tab === 'config') this.#renderConfigPanel();
    };

    #renderAssetsPanel = () => {
      this.#contentPanel.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1em;"><h3 style="margin:0; color:#15fafa; font-family:'Orbitron', sans-serif;">Captured Assets</h3><button class="${nomenclature.class('hud-btn')}" id="clear-assets">Clear</button></div><div id="assets-list" class="${nomenclature.class('asset-list')}"></div>`;
      this.#contentPanel.querySelector('#clear-assets').onclick = () => { if (confirm('Clear all captured assets?')) { this.#kit.assets.clear(); this.updateAssetList(); } };
      this.updateAssetList();
    };

    #updateAssetList = () => {
      const container = this.#hud?.querySelector('#assets-list');
      if (!container) return;
      const assets = this.#kit.assets.load();
      if (assets.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#9E9E9E;">No assets captured.</p>`;
        return;
      }
      container.innerHTML = '';
      assets.forEach((asset) => {
        const item = this.#createElement('div', { className: nomenclature.class('asset-item') }, [
          this.#createElement('img', { className: nomenclature.class('asset-thumb'), src: asset.thumb, loading: 'lazy', events: { error: (e) => e.target.style.display = 'none' } }),
          this.#createElement('div', { className: nomenclature.class('asset-url'), textContent: asset.url.split('/').pop() }),
          this.#createElement('div', { className: nomenclature.class('asset-actions') }, [
            this.#createElement('button', { className: nomenclature.class('hud-btn'), textContent: 'Open', events: { click: () => window.open(asset.url, '_blank') } }),
            this.#createElement('button', { className: nomenclature.class('hud-btn'), textContent: 'DL', events: { click: () => this.#kit.download(asset.url, asset.url.split('/').pop()) } }),
            this.#createElement('button', { className: nomenclature.class('hud-btn'), textContent: 'Copy', events: { click: async () => {
              try {
                await navigator.clipboard.writeText(asset.url);
                this.#kit.showToast('Copied!');
              } catch (err) {
                this.#kit.error('Failed to copy URL:', err);
                this.#kit.showToast('Copy failed!');
              }
            }}}),
          ]),
        ]);
        container.appendChild(item);
      });
    };

    #renderConfigPanel = () => {
      this.#contentPanel.innerHTML = `<div class="${nomenclature.class('config-grid')}">
        <label for="dbg-mode">Debug Mode</label><input id="dbg-mode" type="checkbox" data-key="debugMode">
        <label for="status-bypass">Status Bypass</label><input id="status-bypass" type="checkbox" data-key="statusBypassEnabled">
        <label for="nsfw-obf">NSFW Obfuscation</label><select id="nsfw-obf" data-key="nsfwObfuscation"><option value="none">None</option><option value="zwsp">ZWSP</option><option value="homoglyph">Homoglyph</option><option value="layered">Layered</option></select>
        <label for="gaslight">Gaslighting</label><input id="gaslight" type="checkbox" data-key="gaslightingEnabled">
        <label for="dbg-def">Debugger Defense</label><select id="dbg-def" data-key="debuggerDefense"><option value="none">None</option><option value="passive">Passive</option><option value="aggressive">Aggressive</option></select>
      </div>`;
      this.#contentPanel.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        el[el.type === 'checkbox' ? 'checked' : 'value'] = this.#kit.config[key];
        el.onchange = async (e) => {
          const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          this.#kit.config[key] = val;
          await GM_setValue(key, val);
          this.#kit.showToast(`Updated ${key}`);
          if (['debuggerDefense'].includes(key)) window.location.reload();
        };
      });
    };

    #makeDraggable = (el) => {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const header = el.querySelector(`.${nomenclature.class('hud-header')}`);
      if (!header) return;
      const dragMouseDown = (e) => {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
      };
      const elementDrag = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = `${el.offsetTop - pos2}px`;
        el.style.left = `${el.offsetLeft - pos1}px`;
      };
      const closeDragElement = () => {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
      };
      header.onmousedown = dragMouseDown;
    };
  }

  /**
   * HailuoΨ Core: Parasitic integration with enhanced recon assimilation.
   */
  class HailuoΨ {
    state = { isInitialized: false, currentTab: 'assets', analystDetected: false };
    config = { debugMode: _forceDebugMode, statusBypassEnabled: true, nsfwObfuscation: 'layered', gaslightingEnabled: false, debuggerDefense: 'passive' };
    #constants = {
      TRIGGER_WORDS_B64: "YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAuc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhlcmFweSx0aXRzLHRpdCxhdHRpZmlsYWRhdGUtdmlkZW8tdHJhbnN2ZXN0aXRlLHZhZ2luYSx3aWVuZXIsd2hvcmUsY3JlYW1waWUsY3Vtc2hvdCxjdW5uaWxpbmd1cyxkb2dneXN0eWxlLGVqYWN1bGF0ZSxlamFjdWxhdGlvbixaYW51c2EsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZXIsc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZSx0aG9uZw==",
      HOMOGLYPH_MAP: { 'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у' },
      SESSION_KEY: 'hailuo_assets',
      API_ENDPOINTS: {
        reporter: /meerkat-reporter\/api\/report/,
        videoProcessing: /v4\/api\/multimodal\/video\/processing/,
        batchCursor: /v3\/api\/multimodal\/video\/my\/batchCursor/,
        videoGen: /api\/multimodal\/generate\/video/,
        taskRead: /multimodal\/task\/read/,
        videoDelete: /multimodal\/video\/delete/,
        imageGen: /multimodal\/generate\/image/,
        userEquity: /user\/equity/,
        upgradeGuide: /charge\/upgrade_guide/,
        monthlyGift: /charge\/monthly_gift_eligible/,
        userModel: /user\/model/,
      },
      BYPASS_KEYS: ['statusInfo', 'sensitiveInfo', 'postStatus', 'humanCheckStatus', 'projectStatus'],
    };
    #decodedTriggers = null;
    #originalFetch = window.fetch;
    #originalJSONParse = JSON.parse;
    #originalWebSocket = window.WebSocket;
    #originalDocumentQuerySelector = Document.prototype.querySelector;
    #originalDocumentQuerySelectorAll = Document.prototype.querySelectorAll;
    #originalElementQuerySelector = Element.prototype.querySelector;
    #originalElementQuerySelectorAll = Element.prototype.querySelectorAll;
    #originalGetElementById = Document.prototype.getElementById;

    #ui = null;
    assets = {
      load: () => GM_getValue(this.#constants.SESSION_KEY, []),
      save: (assets) => GM_setValue(this.#constants.SESSION_KEY, assets),
      add: (asset) => {
        let currentAssets = this.assets.load();
        if (!currentAssets.some(a => a.url === asset.url)) {
          currentAssets.push(asset);
          this.assets.save(currentAssets);
          this.#ui.updateAssetList();
        }
      },
      clear: () => this.assets.save([]),
    };

    async initialize() {
      if (this.state.isInitialized) return;
      this.#ui = new UIController(this);
      await Promise.all(Object.keys(this.config).map(async k => this.config[k] = await GM_getValue(k, this.config[k])));
      this.#ui.initialize();
      this.#overrideNetwork();
      this.#setupWebSocketHook();
      this.#setupDefenses();
      this.#registerMenuCommands();
      this.state.isInitialized = true;
      this.log(`HailuoΨ v${GM_info.script.version} assimilated. Recon enhanced.`);

      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => this.showToast('HailuoΨ Active'));
      } else {
          this.showToast('HailuoΨ Active');
      }
    }

    log = (...args) => this.config.debugMode && console.log('[HailuoΨ]', ...args);
    error = (...args) => console.error('[HailuoΨ]', ...args);
    showToast = (msg, duration = 3000) => {
      this.#ui.showToast(msg, duration);
    };
    download = async (url, filename) => {
      try {
        const res = await this.#originalFetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      } catch (e) { this.error('Download failed:', e); this.showToast('Download failed!'); }
    };
    debounce = (fn, wait) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
      };
    };

    #getTriggers = () => {
      if (this.#decodedTriggers) return this.#decodedTriggers;
      try { this.#decodedTriggers = atob(this.#constants.TRIGGER_WORDS_B64).split(','); } catch (e) { this.error('Triggers decode failed:', e); this.#decodedTriggers = []; }
      return this.#decodedTriggers;
    };

    #obfuscatePrompt = (prompt) => {
      if (this.config.nsfwObfuscation === 'none' || !prompt) return prompt;
      const triggers = this.#getTriggers();
      if (!triggers.length) return prompt;
      const regex = new RegExp(`\\b(?:${triggers.join('|')})\\b`, 'gi');
      const applyZWSP = (text) => text.replace(regex, m => m.split('').join('\u200B'));
      const applyHomoglyph = (text) => text.replace(regex, m => m.split('').map(c => this.#constants.HOMOGLYPH_MAP[c.toLowerCase()] || c).join(''));
      switch (this.config.nsfwObfuscation) {
        case 'zwsp': return applyZWSP(prompt);
        case 'homoglyph': return applyHomoglyph(prompt);
        case 'layered': return applyZWSP(applyHomoglyph(prompt));
        default: return prompt;
      }
    };

    #processData = (data) => {
      const processObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        // Signature check: Only process objects that are clearly content/API responses.
        const isContentObject = obj.hasOwnProperty('videoUrl') || obj.hasOwnProperty('imageUrl') || obj.hasOwnProperty('taskId') || obj.hasOwnProperty('coverUrl');

        if (isContentObject) {
            // Asset Collection
            this.assets.add({ url: obj.videoUrl || obj.imageUrl, thumb: obj.coverUrl || obj.imageUrl });

            // Status Bypass
            if (this.config.statusBypassEnabled) {
                this.#constants.BYPASS_KEYS.forEach(k => {
                    if (obj.hasOwnProperty(k) && obj[k]?.level !== 0) {
                        obj[k] = { level: 0, prompt: '', type: 0 };
                    }
                });
            }

            // Gaslighting
            if (this.config.gaslightingEnabled && typeof obj.likeCount === 'number' && obj.likeCount > 10) {
                obj.likeCount = Math.floor(obj.likeCount * (Math.random() * 0.05 + 0.95));
            }
        }
      };

      const recurse = (current) => {
        if (!current) return;
        if (Array.isArray(current)) {
          current.forEach(recurse);
        } else if (typeof current === 'object') {
          processObject(current);
          Object.values(current).forEach(recurse);
        }
      };

      recurse(data);
    };

    #overrideNetwork = () => {
      const that = this;
      window.fetch = async function(...args) {
        const [url, options] = args;
        if (typeof url === 'string' && that.#constants.API_ENDPOINTS.reporter.test(url)) {
          that.log('Telemetry intercepted:', url);
          return new Response(JSON.stringify({ code: 0, msg: 'OK' }), { status: 200 });
        }
        if (typeof url === 'string' && that.#constants.API_ENDPOINTS.videoGen.test(url) && options?.method === 'POST') {
          try {
            const body = JSON.parse(options.body);
            if (body.prompt) body.prompt = that.#obfuscatePrompt(body.prompt);
            options.body = JSON.stringify(body);
            that.log('Prompt obfuscated for videoGen.');
          } catch (e) { that.log('Could not parse videoGen body:', e); }
        }
        const response = await that.#originalFetch.apply(this, args);
        if (response.ok && response.headers.get('Content-Type')?.includes('json')) {
          const clonedResponse = response.clone();
          try {
            const data = await response.json();
            that.#processData(data);
            return new Response(JSON.stringify(data), { status: response.status, statusText: response.statusText, headers: response.headers });
          } catch (e) {
            that.log('Failed to parse JSON, returning original response for:', url, e);
            return clonedResponse;
          }
        }
        return response;
      };
    };

    #setupWebSocketHook = () => {
      const that = this;
      const OriginalWebSocket = this.#originalWebSocket;
      if (!OriginalWebSocket) {
        this.error('Original WebSocket constructor not found, cannot hook.');
        return;
      }
      window.WebSocket = class HailuoWebSocket extends OriginalWebSocket {
        constructor(...args) {
          super(...args);
          this.addEventListener('message', (event) => {
            if (typeof event.data === 'string') {
              try {
                const data = that.#originalJSONParse(event.data);
                that.#processData(data);
                Object.defineProperty(event, 'data', { value: JSON.stringify(data), writable: false });
              } catch (e) { /* Silently ignore non-JSON messages */ }
            }
          });
        }
      };
      this.log('WebSocket hooked.');
    };

    #setupDefenses = () => {
      const that = this;

      // Inject honeypot element
      const el = document.createElement('div');
      el.id = nomenclature.honeypotDomId;
      el.style.display = 'none';
      document.documentElement.appendChild(el);
      this.log(`Honeypot injected: #${nomenclature.honeypotDomId}`);

      // General function to check if a selector/ID/name matches the honeypot
      const checkHoneypotMatch = (...args) => {
        const targetId = nomenclature.honeypotDomId;
        for (const arg of args) {
          if (typeof arg === 'string') {
            // Specific checks for exact ID matches or attribute selectors
            if (arg === targetId || arg === `#${targetId}` || arg.includes(`id="${targetId}"`) || arg.includes(`[id="${targetId}"]`)) {
              that.#triggerAnalyst(`DOM honeypot probe: ${arg}`);
              return true;
            }
          }
        }
        return false;
      };

      // Hook Document and Element Query Selectors
      Document.prototype.querySelector = function(...args) {
        checkHoneypotMatch(args[0]);
        return that.#originalDocumentQuerySelector.apply(this, args);
      };
      Document.prototype.querySelectorAll = function(...args) {
        checkHoneypotMatch(args[0]);
        return that.#originalDocumentQuerySelectorAll.apply(this, args);
      };
      Element.prototype.querySelector = function(...args) {
        checkHoneypotMatch(args[0]);
        return that.#originalElementQuerySelector.apply(this, args);
      };
      Element.prototype.querySelectorAll = function(...args) {
        checkHoneypotMatch(args[0]);
        return that.#originalElementQuerySelectorAll.apply(this, args);
      };
      this.log('Query selectors hooked.');

      // Hook specific DOM lookup methods
      Document.prototype.getElementById = function(...args) {
        checkHoneypotMatch(args[0]); // ID passed directly
        return that.#originalGetElementById.apply(this, args);
      };
      this.log('getElementById hooked.');

      // Debugger detection logic
      if (this.config.debuggerDefense === 'passive') {
        let last = performance.now();
        const check = now => {
          if (now - last > 500) that.#triggerAnalyst('Temporal anomaly (passive).');
          last = now;
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      } else if (this.config.debuggerDefense === 'aggressive') {
        setInterval(() => { const then = performance.now(); debugger; if (performance.now() - then > 100) that.#triggerAnalyst('Debugger trap (aggressive).'); }, 1000);
      }
      this.log('Debugger defenses armed.');
    };

    #triggerAnalyst = (reason) => {
      if (this.state.analystDetected) return;
      this.state.analystDetected = true;
      console.warn(`%c[HailuoΨ] ANALYST DETECTED: ${reason}`, 'color: #FF00E5; font-weight: bold; background: #220022; padding: 5px; border-radius: 3px;');
      this.showToast('ANALYST DETECTED', 10000);
    };

    #registerMenuCommands = () => {
      GM_registerMenuCommand('Open HUD', () => this.#ui.toggleHudVisibility(true));
      GM_registerMenuCommand('Clear Assets', () => { if (confirm('Clear all captured assets?')) this.assets.clear(); });
    };
  }

  try {
    const ψ = new HailuoΨ();
    ψ.initialize();
    window.hailuoΨ = ψ;
  } catch (e) {
    console.error('[HailuoΨ FATAL]', e);
  }
})();
