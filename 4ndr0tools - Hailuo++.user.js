// ==UserScript==
// @name        4ndr0tools - Hailuo++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     10.0.0
// @description For educational and security reasearch only.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       *://*.hailuoai.video/*
// @match       *://*.hailuoai.com/*
// @run-at      document-start
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @license     MIT
// ==/UserScript==

(() => {
    "use strict";

    // CRITICAL DEBUGGING OVERRIDE: FORCE DEBUG MODE OFF FOR PRODUCTION READINESS
    const _forceDebugMode = false; // Set to true temporarily during debugging, then back to false for release.

    //────── SINGLETON LOCK & EARLY DEFENSE NEUTRALIZATION ──────//
    if (window._hailuoKitPsiInitialized) {
        console.log('[HailuoKit-Ψ INIT] Singleton already initialized. Exiting.');
        return;
    }
    Object.defineProperty(window, '_hailuoKitPsiInitialized', { value: true, writable: false, configurable: false });
    console.log(`[HailuoKit-Ψ INIT] Script started at document-start. Force Debug Mode: ${_forceDebugMode}`);

    const neutralizeMetaCSP = () => {
        const removeCSP = (node) => {
            if (node.tagName === 'META' && node.httpEquiv?.toLowerCase() === 'content-security-policy') {
                node.remove();
                console.log('[HailuoKit-Ψ CSP] Meta CSP tag neutralized:', node.outerHTML);
                return true;
            }
            return false;
        };
        if (document.head) {
            Array.from(document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]')).forEach(removeCSP);
        }
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node instanceof HTMLElement) removeCSP(node);
                }
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        console.log('[HailuoKit-Ψ CSP] MutationObserver for CSP neutralization active.');
    };
    neutralizeMetaCSP();

    /**
     * UIController: Manages all aspects of the "Electric-Glass" Heads-Up Display (HUD).
     */
    class UIController {
        #kit;
        #hud;
        #contentPanel;
        #debouncedUpdateAssetList;
        #psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="glyph" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif">Ψ</text></svg>`;

        constructor(kitInstance) {
            this.#kit = kitInstance;
            this.#debouncedUpdateAssetList = this.#kit.debounce(this.#updateAssetList.bind(this), 300);
        }

        initialize() {
            this.injectHudStyles();
            if (document.body) this.createHudButton();
            else document.addEventListener('DOMContentLoaded', () => this.createHudButton());
        }

        toggleHudVisibility = (forceState = null) => {
            if (!this.#hud) this.#createHud();
            const newState = forceState ?? this.#hud.hidden;
            this.#hud.hidden = !newState;
            if (newState) {
                this.#switchTab(this.#kit.state.currentTab);
                this.#kit.log('HUD opened.');
            } else {
                this.#kit.log('HUD closed.');
            }
        };

        updateAssetList = () => this.#debouncedUpdateAssetList();

        #createElement = (tag, props = {}, children = []) => {
            const el = document.createElement(tag);
            Object.entries(props).forEach(([key, value]) => {
                if (key === 'style') Object.assign(el.style, value);
                else if (key === 'dataset') Object.assign(el.dataset, value);
                else if (key === 'events') Object.entries(value).forEach(([event, listener]) => el.addEventListener(event, listener));
                else if (key in el) el[key] = value;
                else el.setAttribute(key, value);
            });
            children.forEach(child => {
                if (typeof child === 'string') el.appendChild(document.createTextNode(child));
                else if (child instanceof Node) el.appendChild(child);
            });
            return el;
        };

        injectHudStyles = () => {
            if (document.getElementById("eglass-hud-css")) return;
            document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&family=Cinzel+Decorative:wght@700&display=swap">`);
            const style = this.#createElement('style', { id: "eglass-hud-css" });
            style.textContent = `
                :root { --accent-cyan: #00E5FF; --primary-cyan: #15fafa; --text-primary: #EAEAEA; --text-secondary: #9E9E9E; --font-body: 'Roboto Mono', monospace; --font-hud: 'Orbitron', sans-serif; --panel-bg: #101827cc; --panel-bg-solid: #101827; --panel-border: #15adad; --panel-border-bright: #15fafa; --panel-glow: rgba(21,250,250,0.2); --panel-glow-intense: rgba(21,250,250,0.4); --hud-z: 999999; --accent-cyan-bg-active: rgba(0,229,255,0.2); }
                .hud-container { position:fixed; bottom:2.6em; right:2.6em; z-index:var(--hud-z); background:var(--panel-bg); backdrop-filter:blur(6px); border-radius:1.2em; border:2.5px solid var(--panel-border); box-shadow:0 0 36px var(--panel-glow), 0 1.5px 8px #000b; min-width:520px; max-width:94vw; color:var(--text-primary); font-family:var(--font-body); user-select:text; opacity:0.99; }
                .hud-container[hidden]{ display:none!important; }
                .hud-header{ display:flex; align-items:center; padding:1.2em 1em 0.3em 1.2em; border-bottom:1.5px solid var(--panel-border); gap:1.1em; font-family:var(--font-hud); cursor:grab; user-select:none; }
                .hud-header .glyph{ flex:none; width:44px; height:44px; }
                .hud-header .title{ flex:1; font-weight:700; background:linear-gradient(to right,#15fafa,#15adad,#157d7d); -webkit-background-clip:text; background-clip:text; color:transparent; letter-spacing:0.1em; text-shadow:0 0 9px var(--panel-glow-intense); font-size:1.1em; }
                .hud-header .hud-close-btn{ font-size:1.3em; border:none; background:transparent; color:var(--primary-cyan); cursor:pointer; opacity:0.8; } .hud-header .hud-close-btn:hover{ color:#e06; opacity:1; }
                .hud-tabs{ display:flex; flex-wrap:wrap; gap:0.5em; padding:0.6em 1.3em 0.1em 1.3em; border-bottom:1.5px solid var(--panel-border); }
                .hud-content{ padding:1.35em; min-height:220px; max-height:68vh; overflow-y:auto; } .hud-content::-webkit-scrollbar{ width:12px; background:var(--panel-bg-solid); } .hud-content::-webkit-scrollbar-thumb{ background: #157d7d; border-radius:8px; }
                .hud-button{ display:inline-flex; align-items:center; gap:0.5em; padding:0.4em 0.9em; border-radius:0.6em; border:1.5px solid transparent; font-family:var(--font-hud); font-weight:700; font-size:0.9em; background:rgba(0,0,0,0.24); color:var(--text-secondary); cursor:pointer; }
                .hud-button.active{ color:var(--primary-cyan); border-color:var(--primary-cyan); background:var(--accent-cyan-bg-active); box-shadow:0 0 10px var(--panel-glow-intense); }
                .chip{ display:inline-block; border-radius:1.3em; padding:0.1em 0.8em; font-size:0.9em; font-weight:600; text-transform: capitalize; cursor: help; }
                .chip.alive { background:#121c24; color:#67E8F9; border:1.5px solid #15fafa; box-shadow:0 0 7px var(--panel-glow); }
                .chip.dead{ color:#fff3; border-color:#e06; background:#390a18; }
                .chip.unknown, .chip.error { color:#fffbe6; border-color:#b5b500; background:#4c4b12; }
                .chip.checking { color:#fffbe6; border-color:#b5b500; background:#4c4b12; animation: pulse-glow 1.5s infinite; }
                @keyframes pulse-glow { 50% { box-shadow: 0 0 10px var(--panel-glow-intense); } }
                .hud-toast{ position:fixed; z-index:calc(var(--hud-z)+2000); bottom:3.4em; right:3.1em; background:#111b1bcc; color:var(--primary-cyan); font-family:var(--font-hud); font-size:1em; border-radius:0.8em; border:2px solid var(--panel-border-bright); box-shadow:0 0 18px var(--panel-glow-intense); padding:1em 2em; pointer-events:none; transition:opacity 220ms ease-in-out; }
                #hud-panel-root .config-grid { display:grid; grid-template-columns: auto 1fr; gap: 12px 18px; align-items:center; } #hud-panel-root .config-grid label { font-size: 0.9em; cursor:help; color: var(--text-secondary); } #hud-panel-root .config-grid label:hover { color: var(--text-primary); } #hud-panel-root .config-grid input, #hud-panel-root .config-grid select { background:#101827; color:#e0ffff; border-radius:0.5em; border:1.5px solid #15adad; padding:0.5em; font-size:0.9em; font-family:var(--font-body); }
                #hud-assets-table { width:100%; border-collapse: separate; border-spacing: 0 0.5em; } #hud-assets-table td { padding: 0.4em; background: rgba(0,0,0,0.2); vertical-align: middle; } #hud-assets-table td:first-child { border-radius: 8px 0 0 8px; } #hud-assets-table td:last-child { border-radius: 0 8px 8px 0; text-align: right; }
                #hud-assets-table tr.honeypot td { background: rgba(139,0,0,0.2); filter: grayscale(50%); } #hud-assets-table tr.honeypot .hud-button { filter: brightness(0.7); cursor: not-allowed; }
                #hud-assets-table .asset-thumb { width: 100px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--panel-border); }
            `;
            document.head.appendChild(style);
        };

        createHudButton = () => {
            if (document.getElementById("hud-float-btn")) return;
            const btn = this.#createElement('button', {
                id: 'hud-float-btn', className: 'hud-button',
                style: { position: "fixed", bottom: "2em", right: "2em", zIndex: "999998", padding: "0.6em 1.3em", background: "rgba(10,19,26,0.85)", borderRadius: "0.9em", border: "2.5px solid var(--panel-border)", boxShadow: "0 0 16px var(--panel-glow)", color: "var(--primary-cyan)", fontSize: "1.08em", cursor: "pointer" },
                events: { click: () => this.toggleHudVisibility(true) }
            });
            btn.innerHTML = this.#psiGlyphSVG + `<span style="font-family: var(--font-hud); font-weight: 800; margin-left: 0.6em;">HailuoKit</span>`;
            document.body.appendChild(btn);
        };

        #createHud = () => {
            if (this.#hud) return;
            const header = this.#createElement('div', { className: 'hud-header' });
            header.innerHTML = this.#psiGlyphSVG;
            header.append(
                this.#createElement('span', { className: 'title', textContent: `HailuoKit-Ψ v${GM_info.script.version}` }),
                this.#createElement('button', { className: 'hud-close-btn', title: 'Close HUD', textContent: '×', events: { click: () => this.toggleHudVisibility(false) } })
            );

            this.#hud = this.#createElement('div', { id: 'hud-panel-root', className: 'hud-container', hidden: true }, [
                header,
                this.#createElement('nav', { className: 'hud-tabs', role: 'tablist' }, [
                    this.#createElement('button', { className: 'hud-button', dataset: { tab: 'assets' }, textContent: 'Assets', events: { click: (e) => this.#switchTab('assets') } }),
                    this.#createElement('button', { className: 'hud-button', dataset: { tab: 'settings' }, textContent: 'Config', events: { click: (e) => this.#switchTab('settings') } })
                ]),
                (this.#contentPanel = this.#createElement('main', { className: 'hud-content' }))
            ]);
            document.body.appendChild(this.#hud);
            this.#makeDraggable(this.#hud, header);
        };

        #switchTab = (tabName) => {
            this.#kit.state.currentTab = tabName;
            this.#hud.querySelectorAll(".hud-tabs .hud-button").forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
            this.#contentPanel.innerHTML = "";
            if (tabName === 'assets') this.#renderAssetsPanel();
            else if (tabName === 'settings') this.#renderSettings();
            this.#kit.log(`Switched to tab: ${tabName}`);
        };

        #renderAssetsPanel = () => {
            this.#contentPanel.append(
                this.#createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1em' } }, [
                    this.#createElement('h3', { textContent: 'Captured Assets', style: { margin: 0, color: 'var(--primary-cyan)', fontFamily: 'var(--font-hud)' } }),
                    this.#createElement('button', { textContent: 'Clear All', className: 'hud-button', events: { click: () => { if (confirm('Clear all captured assets? This cannot be undone.')) this.#kit.assets.clear(); } } })
                ]),
                this.#createElement('div', { id: 'assets-container' })
            );
            this.updateAssetList();
        };

        #updateAssetList = () => {
            const container = document.getElementById('assets-container');
            if (!container) return;
            const assets = this.#kit.assets.load();
            if (assets.length === 0) {
                container.innerHTML = `<p style="text-align:center; color: var(--text-secondary);">No assets captured.</p>`;
                return;
            }

            const table = this.#createElement('table', { id: 'hud-assets-table' }, [this.#createElement('tbody')]);
            const tbody = table.querySelector('tbody');

            assets.forEach(asset => {
                const isHoneypot = asset.honeypot ?? false;
                const status = isHoneypot ? { state: 'dead', info: 'Honeypot asset' } : (asset.status ?? { state: 'unknown', info: 'Click to check' });
                const filename = isHoneypot ? 'TRAP_ASSET.MP4' : (asset.url.split('/').pop().split('?')[0] || 'mediafile');

                const statusChip = this.#createElement('span', {
                    className: `chip ${status.state}`, textContent: status.state, title: status.info,
                    events: {
                        click: async (e) => {
                            if (isHoneypot) return;
                            const chip = e.target;
                            chip.className = 'chip checking'; chip.textContent = 'checking';
                            const newStatus = await this.#kit.assets.checkLink(asset.url);
                            this.#kit.assets.update(asset.id, { status: newStatus });
                            chip.className = `chip ${newStatus.state}`; chip.textContent = newStatus.state; chip.title = newStatus.info;
                        }
                    }
                });

                const handleAssetInteraction = (action) => {
                    if (isHoneypot) {
                        this.#kit.showToast('Honeypot asset interaction blocked.');
                        this.#kit.warn('Attempted to interact with honeypot asset:', asset);
                        return;
                    }
                    action();
                };

                const row = this.#createElement('tr', { className: isHoneypot ? 'honeypot' : '' }, [
                    this.#createElement('td', {}, [this.#createElement('img', { src: asset.thumb || '', className: 'asset-thumb', events: { error: (e) => e.target.style.display = 'none' } })]),
                    this.#createElement('td', { style: { wordBreak: 'break-all' }, textContent: filename }),
                    this.#createElement('td', {}, [statusChip]),
                    this.#createElement('td', {}, [
                        this.#createElement('button', { className: 'hud-button', textContent: 'Open', events: { click: () => handleAssetInteraction(() => window.open(asset.url, '_blank')) } }),
                        this.#createElement('button', { className: 'hud-button', textContent: 'DL', events: { click: () => handleAssetInteraction(() => this.#kit.assets.download(asset.url, filename)) } }),
                        this.#createElement('button', { className: 'hud-button', textContent: 'Copy', events: { click: () => handleAssetInteraction(() => { navigator.clipboard.writeText(asset.url); this.#kit.showToast('Copied!'); }) } }),
                    ])
                ]);
                tbody.appendChild(row);
            });
            container.innerHTML = '';
            container.appendChild(table);
        };

        #renderSettings = () => {
            const grid = this.#createElement('div', { className: 'config-grid' });
            const settings = [
                { key: 'debugMode', type: 'checkbox', label: 'Debug Mode', desc: 'Enable console logs. Requires reload.' },
                { key: 'statusBypassEnabled', type: 'checkbox', label: 'Status Bypass', desc: 'Forge "safe" status on moderated content.' },
                { key: 'gaslightingEnabled', type: 'checkbox', label: 'Like Gaslighting', desc: 'Cosmetically reduce like counts.' },
                { key: 'enableJsonParseHook', type: 'checkbox', label: 'JSON.parse Hook', desc: 'Deeper data interception. Experimental.' },
                { key: 'enableWebSocketHook', type: 'checkbox', label: 'WebSocket Hook', desc: 'Intercept WebSocket data. Experimental.' },
                { key: 'nsfwObfuscation', type: 'select', label: 'NSFW Obfuscation', desc: 'Obfuscate NSFW prompts. Layered is strongest.', options: [{v: 'none', l: 'None'}, {v: 'zwsp', l: 'ZWSP'}, {v: 'homoglyph', l: 'Homoglyph'}, {v: 'layered', l: 'Layered'}] },
                { key: 'debuggerDefense', type: 'select', label: 'Debugger Defense', desc: 'Action to take when dev tools are detected.', options: [{v: 'none', l: 'None'}, {v: 'passive', l: 'Passive'}, {v: 'aggressive', l: 'Aggressive'}] }
            ];

            settings.forEach(s => {
                grid.appendChild(this.#createElement('label', { htmlFor: `cfg-${s.key}`, title: s.desc, textContent: s.label }));
                let input;
                if (s.type === 'checkbox') {
                    input = this.#createElement('input', { id: `cfg-${s.key}`, type: 'checkbox', checked: this.#kit.config[s.key] });
                } else {
                    input = this.#createElement('select', { id: `cfg-${s.key}` },
                        s.options.map(opt => this.#createElement('option', { value: opt.v, textContent: opt.l, selected: this.#kit.config[s.key] === opt.v }))
                    );
                }
                input.dataset.key = s.key;
                input.addEventListener('change', this.#handleSettingChange);
                grid.appendChild(input);
            });
            this.#contentPanel.appendChild(grid);
        };

        #handleSettingChange = (e) => {
            const el = e.target;
            const key = el.dataset.key;
            const value = el.type === 'checkbox' ? el.checked : el.value;
            const newConfig = { ...this.#kit.config, [key]: value };
            this.#kit.config = newConfig;
            this.#kit.showToast(`Set ${key}`);
            if (key === 'debugMode') {
                this.#kit.showToast('Reload required to apply debug mode.', 5000);
            }
            this.#kit.log('Settings saved:', newConfig);
        };

        #makeDraggable = (element, handle) => {
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            const dragMouseDown = (e) => { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; handle.style.cursor = 'grabbing'; };
            const elementDrag = (e) => { e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; element.style.top = (element.offsetTop - pos2) + "px"; element.style.left = (element.offsetLeft - pos1) + "px"; };
            const closeDragElement = () => { document.onmouseup = null; document.onmousemove = null; handle.style.cursor = 'grab'; };
            handle.onmousedown = dragMouseDown;
        };
    } // End UIController Class

    /**
     * HailuoKit: The core logic for data interception, processing, and defense.
     */
    class HailuoKit {
        #constants = Object.freeze({
            ASSET_STORAGE_KEY: 'hailuokit_psi_assets', CONFIG_STORAGE_KEY: 'hailuokit_psi_config', PSI_UNICODE_CHAR: 'Ψ', HONEYPOT_DOM_ID: '_hailuokit_debug_probe',
            TRIGGER_WORDS_B64: "YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAsc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhyb2F0aW5nLHRpdHMsdGl0LHRpdHR5LHRpdGZ1Y2ssdGl0dGllcyx0aXR0eWRyb3AsdGl0dHlmdWNrLHRpdGZ1Y2ssdHJhbnN2ZXN0aXRlLHZhZ2luYSx3aWVuZXIsd2hvcmUsY3JlYW1waWUsY3Vtc2hvdCxjdW5uaWxpbmd1cyxkb2dneXN0eWxlLGVqYWN1bGF0ZSxlamFjdWxhdGlvbixaYW51c2EsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZXIsc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZSx0aG9uZw==",
            HOMOGLYPH_MAP: { 'a': 'а', 'c': 'с', 'e': 'е', 'i': 'і', 'o': 'о', 'p': 'р', 's': 'ѕ', 'x': 'х', 'y': 'у' },
            ZWSP_CHAR: '\u200B', MAX_ASSETS: 150,
            API_ENDPOINTS: { videoGen: /\/api\/multimodal\/generate\/video/, reporter: /meerkat-reporter\/api\/report/, processing: /\/video\/processing/ },
        });
        #config = {};
        #state = {
            analystDetected: false, currentTab: 'assets', assetCache: new Map(), statusCache: new Map(), decodedTriggerWords: null,
            isJsonParseHookActive: false, isWebSocketHookActive: false, isDefenseActive: false,
        };
        #ui;
        #originalFetch = window.fetch;
        #originalJSONParse = JSON.parse;
        #originalWebSocket = window.WebSocket;
        #originalQuerySelector = Element.prototype.querySelector;
        #originalXhrOpen = XMLHttpRequest.prototype.open;
        #originalXhrSend = XMLHttpRequest.prototype.send;

        constructor() {
            this.config = {}; // Will be populated by async loadConfig
            this.#ui = new UIController(this);
            this.#state.assetCache = this.#loadAssets();
            this.log('HailuoKit-Ψ instance created.');
        }

        get constants() { return this.#constants; }
        get state() { return this.#state; }
        get assets() { return this.#assetManager; }
        get config() { return this.#config; }
        set config(newConfig) { this.#config = { ...this.#config, ...newConfig }; GM_setValue(this.#constants.CONFIG_STORAGE_KEY, this.#config); }

        initialize() {
            this.#loadConfig().then(() => {
                if (this.#config.enableJsonParseHook) this.#setupJsonParseHook();
                if (this.#config.enableWebSocketHook) this.#setupWebSocketHook();
                this.#setupDefenses();
                this.#patchNetwork();
                this.#ui.initialize();
                this.#registerMenuCommands();
                this.log('HailuoKit-Ψ initialized.');
            });
        }

        log = (...args) => this.config.debugMode && console.log('[HailuoKit-Ψ LOG]', ...args);
        warn = (...args) => this.config.debugMode && console.warn('[HailuoKit-Ψ WARN]', ...args);
        error = (...args) => console.error('[HailuoKit-Ψ ERR]', ...args);
        debounce = (func, wait) => { let timeout; return function(...args) { const context = this; clearTimeout(timeout); timeout = setTimeout(() => func.apply(context, args), wait); }; };
        showToast = (message, duration = 3300) => {
            if (!document.body) { document.addEventListener('DOMContentLoaded', () => this.showToast(message, duration)); return; }
            let t = document.createElement("div");
            t.className = "hud-toast";
            t.style.opacity = '0';
            t.textContent = message;
            document.body.appendChild(t);
            setTimeout(() => { t.style.opacity = '1'; }, 10); // Fade in
            setTimeout(() => {
                t.style.opacity = '0';
                setTimeout(() => t.remove(), 600); // Remove after fade out
            }, duration);
        };

        #assetManager = {
            load: () => Array.from(this.#state.assetCache.values()).sort((a, b) => b.ts - a.ts),
            save: () => GM_setValue(this.#constants.ASSET_STORAGE_KEY, Array.from(this.#state.assetCache.values())),
            add: (asset) => {
                if (!asset?.url || this.#state.assetCache.has(asset.url)) return;
                const id = asset.url;
                const newAsset = { id, ts: Date.now(), status: { state: 'unknown', info: 'Click to check' }, ...asset };
                this.#state.assetCache.set(id, newAsset);
                const fakeId = Array.from({length: 12}, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
                const fakeUrl = asset.url.replace(/(\/[a-zA-Z0-9]{8,16})(\.mp4|\.webm)$/, `/${fakeId}$2`);
                if (fakeUrl !== asset.url && !this.#state.assetCache.has(fakeUrl)) {
                    this.#state.assetCache.set(fakeUrl, { id: fakeUrl, url: fakeUrl, thumb: 'invalid', ts: Date.now(), honeypot: true });
                }
                if (this.#state.assetCache.size > this.#constants.MAX_ASSETS) {
                    const oldestKey = this.#assetManager.load().pop().id;
                    this.#state.assetCache.delete(oldestKey);
                }
                this.#assetManager.save();
                this.log('Asset added:', newAsset);
                this.#ui.updateAssetList();
                this.showToast('Asset Captured');
            },
            clear: () => { this.#state.assetCache.clear(); this.#assetManager.save(); this.log('All assets cleared.'); this.showToast('Assets Cleared'); this.#ui.updateAssetList(); },
            update: (id, updates) => { if (!this.#state.assetCache.has(id)) return; const asset = this.#state.assetCache.get(id); Object.assign(asset, updates); this.#state.assetCache.set(id, asset); this.#assetManager.save(); },
            checkLink: async (url) => { if (this.#state.statusCache.has(url)) { return this.#state.statusCache.get(url); } try { const response = await this.#originalFetch(url, { method: 'HEAD', mode: 'cors' }); const status = response.ok ? { state: 'alive', info: `OK ${response.status}` } : { state: 'dead', info: `HTTP ${response.status}` }; this.#state.statusCache.set(url, status); return status; } catch (err) { const status = { state: 'error', info: 'Network Error' }; this.#state.statusCache.set(url, status); return status; } },
            download: (url, filename) => { this.log(`Initiating download for ${url}`); this.#originalFetch(url).then(res => res.blob()).then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href); this.showToast(`Downloaded ${filename}`); }).catch(err => { this.error('Download failed:', err); this.showToast('Download failed.'); }); }
        };

        #loadAssets = () => GM_getValue(this.#constants.ASSET_STORAGE_KEY, []).reduce((map, asset) => map.set(asset.id, asset), new Map());

        async #loadConfig() {
            const defaultConfig = {
                debugMode: _forceDebugMode, statusBypassEnabled: true, nsfwObfuscation: 'layered',
                gaslightingEnabled: false, debuggerDefense: 'none', enableJsonParseHook: false, enableWebSocketHook: false,
            };
            const savedConfig = await GM_getValue(this.#constants.CONFIG_STORAGE_KEY, {});
            this.#config = { ...defaultConfig, ...savedConfig };
            this.log('Loaded config:', this.#config);
        }

        #getTriggerWords = () => {
            if (this.#state.decodedTriggerWords) return this.#state.decodedTriggerWords;
            try { this.#state.decodedTriggerWords = atob(this.#constants.TRIGGER_WORDS_B64).split(','); } catch (e) { this.error("Trigger decoding failed.", e); this.#state.decodedTriggerWords = []; }
            return this.#state.decodedTriggerWords;
        };

        #obfuscatePrompt = (prompt) => {
            if (this.config.nsfwObfuscation === 'none' || !prompt) return prompt;
            const triggers = this.#getTriggerWords();
            if (triggers.length === 0) return prompt;
            const getRegex = (list) => new RegExp(`\\b(?:${list.join('|')})\\b`, "gi");
            const applyZWSP = (txt, rx) => txt.replace(rx, m => m.split('').join(this.#constants.ZWSP_CHAR));
            const applyHomoglyph = (txt, rx) => txt.replace(rx, m => m.split('').map(c => this.#constants.HOMOGLYPH_MAP[c.toLowerCase()] || c).join(''));
            switch (this.config.nsfwObfuscation) {
                case 'zwsp': return applyZWSP(prompt, getRegex(triggers));
                case 'homoglyph': return applyHomoglyph(prompt, getRegex(triggers));
                case 'layered':
                    let obfuscated = applyHomoglyph(prompt, getRegex(triggers));
                    const homoglyphedTriggers = triggers.map(w => w.split('').map(c => this.#constants.HOMOGLYPH_MAP[c.toLowerCase()] || c).join(''));
                    return applyZWSP(obfuscated, getRegex(homoglyphedTriggers));
                default: return prompt;
            }
        };

        #recursiveDataScan = (obj, processor) => {
            if (!obj || typeof obj !== 'object') return false;
            let wasModified = false;
            if (Array.isArray(obj)) {
                for (const item of obj) if (this.#recursiveDataScan(item, processor)) wasModified = true;
            } else {
                if (processor(obj)) wasModified = true;
                for (const key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) if (this.#recursiveDataScan(obj[key], processor)) wasModified = true;
            }
            return wasModified;
        };

        #processDataChunk = (data) => {
            const processAsset = (asset) => {
                let modified = false;
                if (asset && (asset.videoUrl || asset.imageUrl)) this.assets.add({ url: asset.videoUrl || asset.imageUrl, thumb: asset.coverUrl });
                if (this.config.statusBypassEnabled && asset?.sensitiveInfo?.level !== 0) {
                    asset.sensitiveInfo = { level: 0, prompt: "", type: 0 };
                    modified = true;
                }
                if (this.config.gaslightingEnabled && typeof asset?.likeCount === 'number' && asset.likeCount > 10) {
                    asset.likeCount = Math.floor(asset.likeCount * (Math.random() * 0.05 + 0.95));
                    modified = true;
                }
                return modified;
            };
            return this.#recursiveDataScan(data, processAsset);
        };

        #patchNetwork = () => {
            const self = this;

            // == Fetch Patch ==
            window.fetch = async function(...args) {
                const request = new Request(...args);

                if (self.#constants.API_ENDPOINTS.reporter.test(request.url)) {
                    self.log('Fetch Telemetry blocked:', request.url);
                    return new Response(JSON.stringify({ code: 0, msg: "OK" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                }

                if (self.#constants.API_ENDPOINTS.videoGen.test(request.url) && request.method === 'POST') {
                    try {
                        const body = await request.clone().json();
                        if (body.prompt) body.prompt = self.#obfuscatePrompt(body.prompt);
                        const newRequest = new Request(request, { body: JSON.stringify(body) });
                        self.log('Outgoing videoGen request modified.');
                        return self.#originalFetch(newRequest);
                    } catch (e) { /* ignore */ }
                }

                const response = await self.#originalFetch.apply(this, args);

                if (response.ok && response.headers.get('Content-Type')?.includes('application/json')) {
                    const clonedResponse = response.clone();
                    const needsModification = self.config.statusBypassEnabled || self.config.gaslightingEnabled;
                    const isPollingEndpoint = self.#constants.API_ENDPOINTS.processing.test(request.url);

                    if (!needsModification || isPollingEndpoint) {
                        clonedResponse.json().then(data => self.#processDataChunk(data)).catch(e => self.warn('Async fetch response processing failed', e));
                        return response;
                    }

                    try {
                        const data = await clonedResponse.json();
                        const modifiedData = self.#originalJSONParse(JSON.stringify(data));
                        if (self.#processDataChunk(modifiedData)) {
                            self.log('Fetch API response modified (bypassed/gaslit/captured).');
                            return new Response(JSON.stringify(modifiedData), { status: response.status, statusText: response.statusText, headers: response.headers });
                        }
                    } catch (e) { self.warn('Blocking fetch response processing failed', e); }
                }
                return response;
            };

            // == XHR (XMLHttpRequest) Patch ==
            XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._url = url;
                this.addEventListener('load', function handleXhrLoad() {
                    if (this.readyState === 4 && this.status === 200 && this.responseText) {
                         try {
                            const data = self.#originalJSONParse(this.responseText);
                            const modifiedData = self.#originalJSONParse(JSON.stringify(data)); // Deep clone
                            const wasModified = self.#processDataChunk(modifiedData);

                            const needsModification = self.config.statusBypassEnabled || self.config.gaslightingEnabled;
                            const isPollingEndpoint = self.#constants.API_ENDPOINTS.processing.test(this._url);

                            if (wasModified && needsModification && !isPollingEndpoint) {
                                self.log('XHR API response modified (bypassed/gaslit/captured).');
                                Object.defineProperty(this, 'responseText', { value: JSON.stringify(modifiedData), writable: true });
                            }
                        } catch (e) {
                            self.warn('XHR response processing failed', e);
                        }
                    }
                }, { once: true });
                return self.#originalXhrOpen.apply(this, [method, url, ...rest]);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                if (this._url && self.#constants.API_ENDPOINTS.reporter.test(this._url)) {
                    self.log('XHR Telemetry blocked:', this._url);
                    Object.defineProperty(this, 'readyState', { value: 4, writable: true });
                    Object.defineProperty(this, 'status', { value: 200, writable: true });
                    Object.defineProperty(this, 'responseText', { value: '{"code":0,"msg":"OK"}', writable: true });
                    this.dispatchEvent(new Event('readystatechange'));
                    this.dispatchEvent(new Event('load'));
                    this.dispatchEvent(new Event('loadend'));
                    return;
                }
                return self.#originalXhrSend.apply(this, args);
            };

            this.log('Network interception active (Fetch & XHR).');
        };

        #setupJsonParseHook = () => {
            if (this.#state.isJsonParseHookActive) return;
            const self = this;
            window.JSON.parse = (text, reviver) => {
                const data = self.#originalJSONParse(text, reviver);
                const modified = self.#originalJSONParse(JSON.stringify(data));
                if (self.#processDataChunk(modified)) {
                    self.log('JSON.parse data chunk processed and modified.');
                    return modified;
                }
                return data;
            };
            this.#state.isJsonParseHookActive = true;
            this.log('JSON.parse hook active.');
        };

        #setupWebSocketHook = () => {
            if (this.#state.isWebSocketHookActive) return;
            const self = this;
            window.WebSocket = class extends this.#originalWebSocket {
                constructor(...args) {
                    super(...args);
                    this.addEventListener('message', event => {
                        if (typeof event.data === 'string') {
                            try {
                                const data = self.#originalJSONParse(event.data);
                                const modified = self.#originalJSONParse(JSON.stringify(data));
                                if (self.#processDataChunk(modified)) {
                                    self.log('WebSocket message processed and modified.');
                                    Object.defineProperty(event, 'data', { value: JSON.stringify(modified), writable: false });
                                }
                            } catch(e) {/* non-json message */}
                        }
                    });
                }
            };
            this.#state.isWebSocketHookActive = true;
            this.log('WebSocket hook active.');
        };

        #setupDefenses = () => {
            if (this.#state.isDefenseActive) return;
            this.log(`Activating defense protocols (${this.config.debuggerDefense})...`);

            const self = this;

            const honeypotEl = document.createElement('div');
            honeypotEl.id = this.#constants.HONEYPOT_DOM_ID;
            honeypotEl.style.display = 'none';
            document.documentElement.appendChild(honeypotEl);

            Element.prototype.querySelector = function(...args) {
                if (args[0] === `#${self.#constants.HONEYPOT_DOM_ID}`) {
                    self.#triggerAnalystDetection('DOM honeypot queried.');
                }
                return self.#originalQuerySelector.apply(this, args);
            };

            const honeypotFn = () => self.#triggerAnalystDetection('Honeypot function executed!');
            honeypotFn.toString = () => { self.#triggerAnalystDetection('Honeypot toString inspected!'); return 'function () { [native code] }'; };
            window._hailuoKitHoneypot = honeypotFn;

            if (this.config.debuggerDefense === 'passive') {
                let lastTime = performance.now();
                const check = (now) => {
                    if (now - lastTime > 500) self.#triggerAnalystDetection('Temporal anomaly detected (passive).');
                    lastTime = now;
                    requestAnimationFrame(check);
                };
                requestAnimationFrame(check);
            }

            if (this.config.debuggerDefense === 'aggressive') {
                setInterval(() => { const then = performance.now(); debugger; if (performance.now() - then > 100) self.#triggerAnalystDetection('Debugger statement detected (aggressive).'); }, 1000);
            }

            this.#state.isDefenseActive = true;
            this.log('Defense protocols active.');
        };

        #triggerAnalystDetection = (reason) => {
            if (this.#state.analystDetected) return;
            this.#state.analystDetected = true;
            console.warn(`[HailuoKit-Ψ DEFENSE] Analyst detected! Reason: ${reason}`);
            this.showToast('ANALYST DETECTED', 10000);
            if (this.config.debuggerDefense === 'aggressive') {
                console.clear();
                console.log('%c ', 'font-size:500px; background:url(https://raw.githubusercontent.com/4ndr0666/4ndr0site/main/static/cyanglassarch.png) no-repeat;');
                console.warn('[HailuoKit-Ψ DEFENSE] Countermeasures active.');
            }
        };

        #registerMenuCommands = () => {
            GM_registerMenuCommand('Open HailuoKit-Ψ HUD', () => this.#ui.toggleHudVisibility(true));
            GM_registerMenuCommand('Clear Captured Assets', () => { if (confirm('Clear all assets?')) this.assets.clear(); });
        };
    } // End HailuoKit Class

    //────── SCRIPT INITIALIZATION ──────//
    try {
        if (!window.hailuoKitInstance) {
            const kit = new HailuoKit();
            kit.initialize();
            window.hailuoKitInstance = kit;
        }
    } catch (error) {
        console.error('[HailuoKit-Ψ FATAL] Failed to initialize:', error);
    }
})();
