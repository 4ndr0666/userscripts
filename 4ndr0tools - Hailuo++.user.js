// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666 
// @version     36
// @description Enhanced endpoint interception, status bypass, and obfuscation. Fortified with active anti-analysis and perception warfare modules. Security research only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @connect     api.github.com
// @connect     gist.githubusercontent.com
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';

  // CRITICAL DEBUGGING OVERRIDE: Live weapon system. Debug false for opsec.
  const _forceDebugMode = false;
  // OPERATOR CONFIG: Change this key for deployment to avoid static signature.
  const _storageEncryptionKey = 'default_opsec_key_change_me';
  // OPERATOR CONFIG: Default URL for remote configuration. Can be a Gist raw URL.
  const _defaultRemoteConfigUrl = '';

  //────── ONTOLOGICAL MASKING ENGINE ──────//
  const nomenclature = (() => {
    const r = () => Math.random().toString(36).substring(2, 10);
    const prefix = `Ψ_${r()}`;
    return {
      singleton: `_hkInit_${r()}`,
      cssId: `${prefix}_css`,
      hudBtnId: `${prefix}_hudBtn`,
      hudRootId: `${prefix}_hudRoot`,
      honeypotDomId: `_hk_probe_${r()}`,
      class: (name) => `${prefix}_${name}`,
    };
  })();

  //────── SINGLETON LOCK ──────//
  if (window[nomenclature.singleton]) {
    console.log('[HailuoΨ INIT] Singleton active. Exiting.');
    return;
  }
  Object.defineProperty(window, nomenclature.singleton, {
    value: true,
    writable: false,
    configurable: false,
  });
  console.log(
    `[HailuoΨ INIT] Engaged at document-start. Debug: ${_forceDebugMode}`
  );

  //────── OBFUSCATED STRINGS & INDIRECTS ──────//
  const S = {
    csp: atob('Y29udGVudC1zZWN1cml0eS1wb2xpY3k='),
    meta: atob('TUVUQQ=='),
    httpEquiv: atob('aHR0cC1lcXVpdg=='),
    contentType: atob('Q29udGVudC1UeXBl'),
    json: atob('anNvbg=='),
    getElementById: atob('Z2V0RWxlbWVudEJ5SWQ='),
    querySelector: atob('cXVlcnlTZWxlY3Rvcg=='),
    querySelectorAll: atob('cXVlcnlTZWxlY3RvckFsbA=='),
    appendChild: atob('YXBwZW5kQ2hpbGQ='),
    insertBefore: atob('aW5zZXJ0QmVmb3Jl'),
  };

  //────── CSP NEUTRALIZATION ──────//
  const neutralizeMetaCSP = () => {
    const removeCSP = (node) => {
      if (
        node?.nodeType === Node.ELEMENT_NODE &&
        node.tagName === S.meta &&
        node[S.httpEquiv]?.toLowerCase() === S.csp
      ) {
        node.remove();
        console.log('[HailuoΨ CSP] Neutralized:', node.outerHTML);
        return true;
      }
      return false;
    };
    if (document.head)
      Array.from(
        document.head.querySelectorAll(`meta[http-equiv="${S.csp}" i]`)
      ).forEach(removeCSP);
    const observer = new MutationObserver((mutations) =>
      mutations.forEach((m) => m.addedNodes.forEach((n) => removeCSP(n)))
    );
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    console.log('[HailuoΨ CSP] Observer active.');
  };
  // Call is deferred to DOMContentLoaded to prevent race conditions.

  /**
   * UIController Factory: Manages the Electric-Glass HUD.
   * @param {object} kitInstance - The core HailuoΨ instance.
   * @returns {object} The UI controller public interface.
   */
  const createUIController = (kitInstance) => {
    let hud;
    let contentPanel;
    const psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="${nomenclature.class(
      'glyph'
    )}" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text></svg>`;

    const createElement = (tag, props = {}, children = []) => {
      const el = document.createElement(tag);
      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === undefined) continue;
        if (key === 'style') Object.assign(el.style, value);
        else if (key === 'dataset') Object.assign(el.dataset, value);
        else if (key === 'events')
          Object.entries(value).forEach(([ev, listener]) =>
            el.addEventListener(ev, listener)
          );
        else if (key === 'innerHTML') el.innerHTML = value;
        else el[key] = value;
      }
      children.forEach((c) => el.append(c));
      return el;
    };

    const makeDraggable = (el) => {
      let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
      const header = el?.[S.querySelector](
        `.${nomenclature.class('hud-header')}`
      );
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

    const renderConfigPanel = () => {
      contentPanel.innerHTML = `<div class="${nomenclature.class(
        'config-grid'
      )}">
        <label for="dbg-mode">Debug Mode</label><input id="dbg-mode" type="checkbox" data-key="debugMode">
        <label for="status-bypass">Status Bypass</label><input id="status-bypass" type="checkbox" data-key="statusBypassEnabled">
        <label for="credit-spoof">Credit Spoofing</label><input id="credit-spoof" type="checkbox" data-key="creditSpoofingEnabled">
        <label for="status-elevate">Status Elevation</label><input id="status-elevate" type="checkbox" data-key="statusElevationEnabled">
        <label for="gaslight">Gaslighting (Likes)</label><input id="gaslight" type="checkbox" data-key="gaslightingEnabled">
        <label for="cog-dissonance">Cognitive Dissonance</label><input id="cog-dissonance" type="checkbox" data-key="cognitiveDissonanceEnabled">
        <label for="nsfw-obf">NSFW Obfuscation</label><select id="nsfw-obf" data-key="nsfwObfuscation"><option value="none">None</option><option value="zwsp">ZWSP</option><option value="homoglyph">Homoglyph</option><option value="layered">Layered</option></select>
        <label for="dbg-def">Debugger Defense</label><select id="dbg-def" data-key="debuggerDefense"><option value="none">None</option><option value="passive">Passive</option><option value="aggressive">Aggressive</option><option value="catastrophic">Catastrophic</option></select>
        <label for="honeypot">DOM Honeypot</label><input id="honeypot" type="checkbox" data-key="honeypotEnabled">
        <hr><hr>
        <label for="remote-cfg">Remote Config</label><input id="remote-cfg" type="checkbox" data-key="remoteConfigEnabled">
        <label for="remote-cfg-url">Config URL</label><input id="remote-cfg-url" type="text" data-key="remoteConfigUrl" style="background:#0a0e17;color:#eaeaea;border:1px solid #15adad;padding:0.3em;">
      </div>`;
      contentPanel[S.querySelectorAll]('[data-key]').forEach((el) => {
        const key = el.dataset.key;
        el[el.type === 'checkbox' ? 'checked' : 'value'] =
          kitInstance.config[key];
        el.onchange = async (e) => {
          const val =
            e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          kitInstance.config[key] = val;
          try {
            await GM_setValue(key, val);
            kitInstance.showToast(`Updated ${key}`);
            if (
              [
                'debuggerDefense',
                'honeypotEnabled',
                'remoteConfigEnabled',
                'remoteConfigUrl',
              ].includes(key)
            ) {
              kitInstance.showToast('Reloading to apply changes...');
              setTimeout(() => window.location.reload(), 1500);
            }
          } catch (err) {
            kitInstance.error(`Failed to save config key '${key}':`, err);
            kitInstance.showToast('Config save failed!');
          }
        };
      });
    };

    const updateAssetListInternal = () => {
      const container = hud?.[S.querySelector]('#assets-list');
      if (!container) return;
      const assets = kitInstance.assets.load();
      if (assets.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-secondary);">No assets captured.</p>`;
        return;
      }
      container.innerHTML = '';
      assets.forEach((asset) => {
        const item = createElement(
          'div',
          { className: nomenclature.class('asset-item') },
          [
            createElement('img', {
              className: nomenclature.class('asset-thumb'),
              src: asset.thumb,
              loading: 'lazy',
              events: { error: (e) => (e.target.style.display = 'none') },
            }),
            createElement('div', {
              className: nomenclature.class('asset-url'),
              textContent: asset.url.split('/').pop(),
            }),
            createElement(
              'div',
              { className: nomenclature.class('asset-actions') },
              [
                createElement('button', {
                  className: nomenclature.class('hud-btn'),
                  textContent: 'Open',
                  events: { click: () => window.open(asset.url, '_blank') },
                }),
                createElement('button', {
                  className: nomenclature.class('hud-btn'),
                  textContent: 'DL',
                  events: {
                    click: () =>
                      kitInstance.download(
                        asset.url,
                        asset.url.split('/').pop()
                      ),
                  },
                }),
                createElement('button', {
                  className: nomenclature.class('hud-btn'),
                  textContent: 'Copy',
                  events: {
                    click: async () => {
                      try {
                        await navigator.clipboard.writeText(asset.url);
                        kitInstance.showToast('Copied!');
                      } catch (err) {
                        kitInstance.error('Failed to copy URL:', err);
                        kitInstance.showToast('Copy failed!');
                      }
                    },
                  },
                }),
              ]
            ),
          ]
        );
        container[S.appendChild](item);
      });
    };

    const renderAssetsPanel = () => {
      contentPanel.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1em;"><h3 style="margin:0; color:#15fafa; font-family:'Orbitron', sans-serif;">Captured Assets</h3><button class="${nomenclature.class(
        'hud-btn'
      )}" id="clear-assets">Clear</button></div><div id="assets-list" class="${nomenclature.class(
        'asset-list'
      )}"></div>`;
      contentPanel[S.querySelector]('#clear-assets').onclick = () => {
        if (confirm('Clear all captured assets?')) {
          kitInstance.assets.clear();
          updateAssetListInternal();
        }
      };
      updateAssetListInternal();
    };

    const switchTab = (tab) => {
      kitInstance.state.currentTab = tab;
      hud?.[S.querySelectorAll](`.${nomenclature.class('hud-button')}`).forEach(
        (b) => b.classList.toggle('active', b.dataset.tab === tab)
      );
      contentPanel.innerHTML = '';
      if (tab === 'assets') renderAssetsPanel();
      else if (tab === 'config') renderConfigPanel();
    };

    const createHud = () => {
      hud = createElement(
        'div',
        {
          id: nomenclature.hudRootId,
          className: nomenclature.class('hud-container'),
          hidden: true,
        },
        [
          createElement(
            'div',
            { className: nomenclature.class('hud-header') },
            [
              createElement('div', { innerHTML: psiGlyphSVG }),
              createElement('div', {
                className: nomenclature.class('title'),
                textContent: 'HailuoΨ',
              }),
              createElement('button', {
                className: nomenclature.class('hud-close-btn'),
                textContent: '×',
                events: { click: () => self.toggleHudVisibility(false) },
              }),
            ]
          ),
          createElement('div', { className: nomenclature.class('hud-tabs') }, [
            createElement('button', {
              className: `${nomenclature.class('hud-button')} active`,
              dataset: { tab: 'assets' },
              textContent: 'Assets',
              events: { click: () => switchTab('assets') },
            }),
            createElement('button', {
              className: nomenclature.class('hud-button'),
              dataset: { tab: 'config' },
              textContent: 'Config',
              events: { click: () => switchTab('config') },
            }),
          ]),
          (contentPanel = createElement('div', {
            className: nomenclature.class('hud-content'),
          })),
        ]
      );
      document.body[S.appendChild](hud);
      makeDraggable(hud);
    };

    const debouncedUpdateAssetList = kitInstance.debounce(
      updateAssetListInternal,
      300
    );

    const self = {
      initialize: () => {
        const inject = () => {
          self.injectHudStyles();
          const observer = new MutationObserver((_, obs) => {
            if (document[S.querySelector]('#app, [data-reactroot]')) {
              self.createHudButton();
              obs.disconnect();
            }
          });
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
          });
        };
        if (document.readyState === 'loading')
          document.addEventListener('DOMContentLoaded', inject);
        else inject();
      },
      toggleHudVisibility: (force = null) => {
        if (!hud) createHud();
        const state = force ?? hud.hidden;
        hud.hidden = !state;
        if (state) {
          switchTab(kitInstance.state.currentTab);
          kitInstance.log('HUD engaged.');
        } else {
          kitInstance.log('HUD disengaged.');
        }
      },
      updateAssetList: () => debouncedUpdateAssetList(),
      showToast: (msg, duration = 3000) => {
        const toast = createElement('div', {
          className: nomenclature.class('toast'),
          textContent: msg,
        });
        document.body[S.appendChild](toast);
        setTimeout(() => toast.remove(), duration);
      },
      injectHudStyles: () => {
        if (document[S.getElementById](nomenclature.cssId)) return;
        document.head.insertAdjacentHTML(
          'beforeend',
          `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&family=Cinzel+Decorative:wght@700&display=swap">`
        );
        const style = createElement('style', { id: nomenclature.cssId });
        style.textContent = `
          :root { --accent-cyan: #00E5FF; --text-cyan-active: #67E8F9; --accent-cyan-border-hover: rgba(0,229,255,0.5); --accent-cyan-bg-active: rgba(0,229,255,0.2); --accent-cyan-glow-active: rgba(0,229,255,0.4); --text-primary: #EAEAEA; --text-secondary: #9E9E9E; --font-body: 'Roboto Mono', monospace; }
          .${nomenclature.class(
            'hud-container'
          )} { position: fixed; bottom: 2.6em; right: 2.6em; z-index: 999999; background: rgba(16,24,39,0.8); backdrop-filter: blur(6px); border-radius: 1.2em; border: 2.5px solid #15adad; box-shadow: 0 0 36px rgba(21,250,250,0.2), 0 1.5px 8px #000b; min-width: 520px; max-width: 94vw; color: var(--text-primary); font-family: var(--font-body); user-select: text; opacity: 0.99; }
          .${nomenclature.class(
            'hud-container'
          )}[hidden] { display: none !important; }
          .${nomenclature.class(
            'hud-header'
          )} { display: flex; align-items: center; padding: 1.2em 1em 0.3em 1.2em; border-bottom: 1.5px solid #15adad; gap: 1.1em; font-family: 'Orbitron', sans-serif; cursor: grab; user-select: none; }
          .${nomenclature.class('hud-header')} .${nomenclature.class(
          'glyph'
        )} { flex: none; width: 44px; height: 44px; }
          .${nomenclature.class('hud-header')} .${nomenclature.class(
          'title'
        )} { flex: 1; font-weight: 700; background: linear-gradient(to right, #15fafa, #15adad, #157d7d); -webkit-background-clip: text; background-clip: text; color: transparent; letter-spacing: 0.1em; text-shadow: 0 0 9px rgba(21,250,250,0.4); font-size: 1.1em; }
          .${nomenclature.class(
            'hud-close-btn'
          )} { font-size: 1.3em; border: none; background: none; color: var(--text-secondary); cursor: pointer; }
          .${nomenclature.class(
            'hud-close-btn'
          )}:hover { color: var(--accent-cyan); }
          .${nomenclature.class(
            'hud-tabs'
          )} { display: flex; gap: 0.5em; padding: 0.8em 1.2em; background: #101827; }
          .${nomenclature.class(
            'hud-button'
          )} { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid transparent; font-family: var(--font-body); font-weight: 500; font-size: 0.875rem; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-secondary); background-color: rgba(0,0,0,0.3); cursor: pointer; transition: all 300ms ease-in-out; }
          .${nomenclature.class(
            'hud-button'
          )}:hover { color: var(--accent-cyan); border-color: var(--accent-cyan-border-hover); }
          .${nomenclature.class(
            'hud-button'
          )}.active { color: var(--text-cyan-active); background-color: var(--accent-cyan-bg-active); border-color: var(--accent-cyan); box-shadow: 0 0 15px var(--accent-cyan-glow-active); }
          .${nomenclature.class(
            'hud-content'
          )} { padding: 1.2em; max-height: 70vh; overflow-y: auto; }
          .${nomenclature.class(
            'config-grid'
          )} { display: grid; grid-template-columns: auto 1fr; gap: 1em 1.5em; align-items: center; }
          .${nomenclature.class(
            'config-grid'
          )} label { font-weight: bold; text-align: right; }
          .${nomenclature.class(
            'config-grid'
          )} hr { grid-column: 1 / -1; border: 1px solid #15adad; border-top: none; }
          .${nomenclature.class(
            'asset-list'
          )} { display: flex; flex-direction: column; gap: 1em; }
          .${nomenclature.class(
            'asset-item'
          )} { display: flex; gap: 1em; align-items: center; border: 1px solid #15adad; padding: 0.5em; border-radius: 0.5em; }
          .${nomenclature.class(
            'asset-thumb'
          )} { width: 80px; height: auto; object-fit: cover; }
          .${nomenclature.class(
            'asset-url'
          )} { flex: 1; word-break: break-all; }
          .${nomenclature.class('asset-actions')} { display: flex; gap: 0.5em; }
          .${nomenclature.class(
            'hud-btn'
          )} { padding: 0.3em 0.8em; background: #15adad; border: none; color: #101827; cursor: pointer; font-family: var(--font-body); }
          .${nomenclature.class('hud-btn')}:hover { background: #15fafa; }
          .${nomenclature.class(
            'toast'
          )} { position: fixed; bottom: 1em; left: 50%; transform: translateX(-50%); background: #101827; color: var(--text-primary); padding: 1em; border-radius: 0.5em; box-shadow: 0 0 10px rgba(21,250,250,0.4); z-index: 1000000; }
        `;
        document.head[S.appendChild](style);
      },
      createHudButton: () => {
        if (document[S.getElementById](nomenclature.hudBtnId)) return;
        const btn = createElement('div', {
          id: nomenclature.hudBtnId,
          innerHTML: psiGlyphSVG,
          title: 'HailuoΨ HUD',
          style: {
            position: 'fixed',
            bottom: '2em',
            right: '2em',
            width: '64px',
            height: '64px',
            cursor: 'pointer',
            zIndex: 999998,
            filter: 'drop-shadow(0 0 12px var(--accent-cyan))',
          },
          events: { click: () => self.toggleHudVisibility(true) },
        });
        document.body[S.appendChild](btn);
      },
    };
    return self;
  };

  /**
   * HailuoΨ Core Factory: Parasitic integration and tradecraft.
   * @returns {object} The core toolkit public interface.
   */
  const createHailuoCore = () => {
    let ui = null;
    let decodedTriggers = null;

    const originalFetch = window.fetch;
    const originalJSONParse = JSON.parse;
    const originalWebSocket = window.WebSocket;
    const originalPrototypes = {
      docQuery: Document.prototype[S.querySelector],
      docQueryAll: Document.prototype[S.querySelectorAll],
      elQuery: Element.prototype[S.querySelector],
      elQueryAll: Element.prototype[S.querySelectorAll],
      getElById: Document.prototype[S.getElementById],
    };

    const self = {
      state: {
        isInitialized: false,
        currentTab: 'assets',
        analystDetected: false,
      },
      config: {
        debugMode: _forceDebugMode,
        statusBypassEnabled: true,
        creditSpoofingEnabled: true,
        statusElevationEnabled: true,
        nsfwObfuscation: 'layered',
        gaslightingEnabled: false,
        cognitiveDissonanceEnabled: false,
        debuggerDefense: 'passive',
        honeypotEnabled: false,
        remoteConfigEnabled: false,
        remoteConfigUrl: _defaultRemoteConfigUrl,
      },
      constants: {
        TRIGGER_WORDS_B64:
          'YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vbnMsYm9vbmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAuc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhlcmFweSx0aXRzLHRpdCxhdHRpZmlsYWRhdGUtdmlkZW8tdHJhbnN2ZXN0aXRlLHZhZ2luYSx3aWVuZXIsd2hvcmUsY3JlYW1waWUsY3Vtc2hvdCxjdW5uaWxpbmd1cyxkb2dneXN0eWxlLGVqYWN1bGF0ZSxlamFjdWxhdGlvbixaYW51c2EsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZXIsc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZSx0aG9uZw==',
        HOMOGLYPH_MAP: {
          a: 'а',
          c: 'с',
          e: 'е',
          i: 'і',
          o: 'о',
          p: 'р',
          s: 'ѕ',
          x: 'х',
          y: 'у',
        },
        ASSETS_KEY: 'hailuo_assets_v2',
        API_ENDPOINTS: {
          reporter: /meerkat-reporter\/api\/report/,
          videoProcessing: /\/api\/multimodal\/video\/processing/,
          batchCursor: /\/api\/multimodal\/video\/my\/batchCursor/,
          videoGen: /\/api\/multimodal\/generate\/video/,
          taskRead: /\/api\/multimodal\/task\/read/,
          videoDelete: /\/api\/multimodal\/video\/delete/,
          imageGen: /\/api\/multimodal\/generate\/image/,
          userEquity: /\/api\/user\/equity/,
          upgradeGuide: /\/api\/charge\/upgrade_guide/,
          monthlyGift: /\/api\/charge\/monthly_gift_eligible/,
          userModel: /\/api\/user\/model/,
        },
        BYPASS_KEYS: [
          'statusInfo',
          'sensitiveInfo',
          'postStatus',
          'humanCheckStatus',
          'projectStatus',
          'status',
        ],
        CREDIT_SPOOF_KEYS: ['totalCredits', 'credit', 'debitCredit'],
        CREDIT_SPOOF_STR_KEYS: ['totalCreditsStr', 'creditStr'],
        SPOOF_CREDIT_AMOUNT: 99999,
        ELEVATION_KEYS: { isPaidSubscription: true },
        CONFIG_KEYS_BLACKLIST: [
          'landing_page_json_url',
          'tools_footer_config',
          'seo_config',
          'common_config',
          'tools_pages_json_url',
        ],
        TIMESTAMP_KEYS: [
          'createdAt',
          'updatedAt',
          'creationTime',
          'updateTime',
        ],
      },
      log: (...args) =>
        self.config.debugMode && console.log('[HailuoΨ]', ...args),
      error: (...args) => console.error('[HailuoΨ]', ...args),
      showToast: (msg, duration = 3000) => ui.showToast(msg, duration),
      debounce: (fn, wait) => {
        let t;
        return (...a) => {
          clearTimeout(t);
          t = setTimeout(() => fn.apply(self, a), wait);
        };
      },
      download: async (url, filename) => {
        try {
          const r = await originalFetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const b = await r.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = filename;
          document.body[S.appendChild](a);
          a.click();
          a.remove();
          URL.revokeObjectURL(a.href);
        } catch (e) {
          self.error('Download failed:', e);
          self.showToast('Download failed!');
        }
      },
      assets: {
        _cipher: (d, k) =>
          d
            .split('')
            .map((c, i) =>
              String.fromCharCode(c.charCodeAt(0) ^ k.charCodeAt(i % k.length))
            )
            .join(''),
        load: () => {
          const e = GM_getValue(self.constants.ASSETS_KEY, null);
          if (!e) return [];
          try {
            return originalJSONParse(
              self.assets._cipher(atob(e), _storageEncryptionKey)
            );
          } catch (err) {
            self.error('Asset decryption failed, clearing.', err);
            self.assets.clear();
            return [];
          }
        },
        save: (a) => {
          try {
            GM_setValue(
              self.constants.ASSETS_KEY,
              btoa(
                self.assets._cipher(JSON.stringify(a), _storageEncryptionKey)
              )
            );
          } catch (err) {
            self.error('Asset encryption failed.', err);
          }
        },
        add: (a) => {
          let c = self.assets.load();
          if (!c.some((i) => i.url === a.url)) {
            c.push(a);
            self.assets.save(c);
            ui.updateAssetList();
          }
        },
        clear: () => self.assets.save([]),
      },
    };

    const getTriggers = () => {
      if (decodedTriggers) return decodedTriggers;
      try {
        decodedTriggers = atob(self.constants.TRIGGER_WORDS_B64).split(',');
      } catch (e) {
        self.error('Triggers decode failed:', e);
        decodedTriggers = [];
      }
      return decodedTriggers;
    };
    const obfuscatePrompt = (p) => {
      if (self.config.nsfwObfuscation === 'none' || !p) return p;
      const t = getTriggers();
      if (!t.length) return p;
      const r = new RegExp(`\\b(?:${t.join('|')})\\b`, 'gi');
      const z = (s) => s.replace(r, (m) => m.split('').join('\u200B'));
      const h = (s) =>
        s.replace(r, (m) =>
          m
            .split('')
            .map((c) => self.constants.HOMOGLYPH_MAP[c.toLowerCase()] || c)
            .join('')
        );
      switch (self.config.nsfwObfuscation) {
        case 'zwsp':
          return z(p);
        case 'homoglyph':
          return h(p);
        case 'layered':
          return z(h(p));
        default:
          return p;
      }
    };

    const processData = (data, depth = 0) => {
      const MAX_DEPTH = 50;
      if (depth > MAX_DEPTH) return;

      const processNode = (node) => {
        try {
          if (!node || typeof node !== 'object') return;
          if (Array.isArray(node)) {
            node.forEach((child) => processData(child, depth + 1));
            return;
          }
          if (
            self.constants.CONFIG_KEYS_BLACKLIST.some((key) =>
              node.hasOwnProperty(key)
            )
          ) {
            self.log('Config object detected, skipping modification.', node);
            return;
          }

          const isMediaObject =
            node.hasOwnProperty('videoUrl') ||
            node.hasOwnProperty('imageUrl') ||
            node.hasOwnProperty('projectStatus');
          const isUserObject =
            node.hasOwnProperty('totalCredits') ||
            node.hasOwnProperty('isPaidSubscription') ||
            node.hasOwnProperty('creditStr');

          if (isMediaObject) {
            const url = node.videoUrl || node.imageUrl;
            if (url) self.assets.add({ url, thumb: node.coverUrl || url });
            if (self.config.statusBypassEnabled)
              self.constants.BYPASS_KEYS.forEach((key) => {
                if (
                  node[key]?.level &&
                  typeof node[key].level === 'number' &&
                  node[key].level !== 0
                )
                  node[key].level = 0;
              });
            if (
              self.config.gaslightingEnabled &&
              typeof node.likeCount === 'number' &&
              node.likeCount > 10
            )
              node.likeCount = Math.floor(
                node.likeCount * (Math.random() * 0.05 + 0.95)
              );
          }
          if (isUserObject) {
            if (self.config.creditSpoofingEnabled) {
              self.constants.CREDIT_SPOOF_KEYS.forEach((k) => {
                if (typeof node[k] === 'number')
                  node[k] = self.constants.SPOOF_CREDIT_AMOUNT;
              });
              self.constants.CREDIT_SPOOF_STR_KEYS.forEach((k) => {
                if (typeof node[k] === 'string')
                  node[k] = `${self.constants.SPOOF_CREDIT_AMOUNT}`;
              });
            }
            if (self.config.statusElevationEnabled) {
              for (const [k, v] of Object.entries(
                self.constants.ELEVATION_KEYS
              )) {
                if (node.hasOwnProperty(k)) node[k] = v;
              }
            }
          }
          if (self.config.cognitiveDissonanceEnabled) {
            self.constants.TIMESTAMP_KEYS.forEach((key) => {
              if (typeof node[key] === 'number' && node[key] > 1000000)
                node[key] -= Math.floor(Math.random() * 3600 * 1000);
            });
          }

          if (!isMediaObject && !isUserObject)
            Object.values(node).forEach((child) =>
              processData(child, depth + 1)
            );
        } catch (err) {
          self.error(
            'Error during data node processing. This node will be skipped.',
            err,
            node
          );
        }
      };
      processNode(data);
    };

    const overrideNetwork = () => {
      window.fetch = async function (...args) {
        const [url, options] = args;
        if (typeof url === 'string') {
          if (self.constants.API_ENDPOINTS.reporter.test(url)) {
            self.log('Telemetry intercepted:', url);
            return new Response('{"code":0,"msg":"OK"}', { status: 200 });
          }
          if (
            self.constants.API_ENDPOINTS.videoGen.test(url) &&
            options?.method === 'POST'
          ) {
            try {
              const body = originalJSONParse(options.body);
              if (body.prompt) body.prompt = obfuscatePrompt(body.prompt);
              options.body = JSON.stringify(body);
              self.log('Prompt obfuscated.');
            } catch (e) {
              self.error('Failed to parse/obfuscate prompt body.', e);
            }
          }
        }
        const response = await originalFetch.apply(this, args);
        if (
          response.ok &&
          response.headers.get(S.contentType)?.includes(S.json)
        ) {
          const clone = response.clone();
          try {
            const data = await response.json();
            processData(data);
            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          } catch (e) {
            self.error('Response processing failed, returning original.', e);
            return clone;
          }
        }
        return response;
      };
    };

    const setupWebSocketHook = () => {
      if (!originalWebSocket) return self.error('WS hook failed.');
      window.WebSocket = class extends originalWebSocket {
        constructor(...args) {
          super(...args);
          this.addEventListener('message', (event) => {
            if (typeof event.data === 'string') {
              try {
                const data = originalJSONParse(event.data);
                processData(data);
                Object.defineProperty(event, 'data', {
                  value: JSON.stringify(data),
                  writable: false,
                  configurable: true,
                });
              } catch (err) {
                self.error('WS message processing failed.', err);
              }
            }
          });
        }
      };
      self.log('WebSocket hooked.');
    };
    const triggerAnalyst = (reason) => {
      if (self.state.analystDetected) return;
      self.state.analystDetected = true;
      console.warn(
        `%c[HailuoΨ] ANALYST DETECTED: ${reason}`,
        'color:#FF00E5;font-weight:bold;background:#220022;padding:5px;'
      );
      self.showToast('ANALYST DETECTED', 10000);
    };

    const setupDefenses = () => {
      if (self.config.honeypotEnabled) {
        const honeypotEl = document.createElement('div');
        honeypotEl.id = nomenclature.honeypotDomId;
        honeypotEl.style.display = 'none';
        document.documentElement[S.appendChild](honeypotEl);
        self.log(`Honeypot injected: #${honeypotEl.id}`);
        const checkResult = (res, method) => {
          if (
            res === honeypotEl ||
            (res?.constructor?.name === 'NodeList' &&
              Array.from(res).includes(honeypotEl))
          )
            triggerAnalyst(`DOM honeypot access via ${method}`);
          return res;
        };
        Document.prototype[S.querySelector] = function (...a) {
          return checkResult(
            originalPrototypes.docQuery.apply(this, a),
            'querySelector'
          );
        };
        Document.prototype[S.querySelectorAll] = function (...a) {
          return checkResult(
            originalPrototypes.docQueryAll.apply(this, a),
            'querySelectorAll'
          );
        };
        Element.prototype[S.querySelector] = function (...a) {
          return checkResult(
            originalPrototypes.elQuery.apply(this, a),
            'querySelector'
          );
        };
        Element.prototype[S.querySelectorAll] = function (...a) {
          return checkResult(
            originalPrototypes.elQueryAll.apply(this, a),
            'querySelectorAll'
          );
        };
        Document.prototype[S.getElementById] = function (...a) {
          return checkResult(
            originalPrototypes.getElById.apply(this, a),
            'getElementById'
          );
        };
        self.log('DOM access hooked.');
      }

      if (self.config.debuggerDefense === 'passive') {
        let last = performance.now();
        const tick = (now) => {
          if (now - last > 500) triggerAnalyst('Temporal anomaly.');
          last = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        self.log('Passive debugger defense armed.');
      } else if (self.config.debuggerDefense === 'aggressive') {
        setInterval(() => {
          const t = performance.now();
          debugger;
          if (performance.now() - t > 100) triggerAnalyst('Debugger trap.');
        }, 1000);
        self.log('Aggressive debugger defense armed.');
      } else if (self.config.debuggerDefense === 'catastrophic') {
        const workerCode = `postMessage('primed'); while(true){}`;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = () =>
          triggerAnalyst('Resource starvation initiated.');
        self.log('Catastrophic debugger defense armed.');
      }
    };

    const registerMenuCommands = () => {
      GM_registerMenuCommand('Open HUD', () => ui.toggleHudVisibility(true));
      GM_registerMenuCommand('Clear Assets', () => {
        if (confirm('Clear all captured assets?')) self.assets.clear();
      });
    };

    const deepMerge = (target, source) => {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceVal = source[key];
          const targetVal = target[key];
          if (
            targetVal &&
            typeof targetVal === 'object' &&
            !Array.isArray(targetVal) &&
            sourceVal &&
            typeof sourceVal === 'object' &&
            !Array.isArray(sourceVal)
          ) {
            deepMerge(targetVal, sourceVal);
          } else {
            target[key] = sourceVal;
          }
        }
      }
      return target;
    };
    const fetchRemoteConfig = () =>
      new Promise((resolve) => {
        if (!self.config.remoteConfigEnabled || !self.config.remoteConfigUrl)
          return resolve();
        self.log(`Fetching remote config from: ${self.config.remoteConfigUrl}`);
        GM_xmlhttpRequest({
          method: 'GET',
          url: self.config.remoteConfigUrl,
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) {
              try {
                const remote = originalJSONParse(res.responseText);
                if (remote.config) deepMerge(self.config, remote.config);
                if (remote.constants)
                  deepMerge(self.constants, remote.constants);
                self.log('Remote config successfully applied.');
                self.showToast('Remote Config Loaded', 2000);
              } catch (e) {
                self.error('Failed to parse remote config.', e);
              }
            } else {
              self.error(
                `Failed to fetch remote config. Status: ${res.status}`
              );
            }
            resolve();
          },
          onerror: (e) => {
            self.error('Network error fetching remote config.', e);
            resolve();
          },
        });
      });

    const runFullInitialization = async () => {
      if (self.state.isInitialized) return;
      neutralizeMetaCSP();
      await Promise.all(
        Object.keys(self.config).map(
          async (k) => (self.config[k] = await GM_getValue(k, self.config[k]))
        )
      );
      await fetchRemoteConfig();
      ui = createUIController(self);
      ui.initialize();
      overrideNetwork();
      setupWebSocketHook();
      setupDefenses();
      registerMenuCommands();
      self.state.isInitialized = true;
      self.log(
        `HailuoΨ v${GM_info.script.version} assimilated. Config loaded.`
      );
      self.showToast('HailuoΨ Active');
    };

    self.initialize = () => {
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', runFullInitialization);
      else runFullInitialization();
    };

    return self;
  };

  try {
    const ψ = createHailuoCore();
    ψ.initialize();
    window.hailuoΨ = ψ; // Expose for operator debugging if needed
  } catch (e) {
    console.error('[HailuoΨ FATAL]', e);
  }
})();
