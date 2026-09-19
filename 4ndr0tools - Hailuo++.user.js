// ==UserScript==
// @name         4ndr0tools - Hailuo++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.3.0
// @author       4ndr0666
// @description  Enterprise-grade, idempotent automation engine for HailuoAI featuring automated queue management, asset fetching with tracked-download deduplication, an in-HUD Asset Bay thumbnail gallery (click-to-new-window, hover-playable previews, blob downloads that never navigate the session window), completion notifications, failure-card masking, API hard purge, and interactive asset links — hardened for the 2026-09 MiniMax H3 site generation and the hailuoai.video/agent chat surface.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        https://hailuoai.com/video*
// @match        https://hailuoai.video/*
// @match        https://hailuoai.video/create*
// @match        https://hailuoai.video/agent*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      cdn.hailuoai.video
// @connect      hailuoai.video
// @connect      hailuoai.com
// @connect      cdn.hailuo.com
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

(function() {
    'use strict';

    class Logger {
        static debug(msg, data = '') { console.debug(`[4ndr0tools][DEBUG] ${msg}`, data); }
        static info(msg, data = '') { console.info(`[4ndr0tools][INFO] ${msg}`, data); }
        static warn(msg, data = '') { console.warn(`[4ndr0tools][WARN] ${msg}`, data); }
        static error(msg, err = '') { console.error(`[4ndr0tools][ERROR] ${msg}`, err); }
    }

    class PersistentState {
        constructor() {
            this.storageKey = "downloadedAssets";
            this.cache = this.load();
        }
        load() {
            try {
                const stored = GM_getValue(this.storageKey, []);
                return new Set(Array.isArray(stored) ? stored : []);
            } catch (e) {
                Logger.error("Failed to safely initialize storage state. Falling back to ephemeral cache.", e);
                return new Set();
            }
        }
        has(id) {
            if (!id) return false;
            return this.cache.has(id);
        }
        add(id) {
            if (!id || this.cache.has(id)) return false;
            this.cache.add(id);
            try {
                GM_setValue(this.storageKey, Array.from(this.cache));
                return true;
            } catch (e) {
                Logger.error(`Write regression error during serialization for token: ${id}`, e);
                return false;
            }
        }
        clear() {
            this.cache.clear();
            try {
                GM_setValue(this.storageKey, []);
                return true;
            } catch (e) {
                Logger.error("Failed to clear baseline persistent data.", e);
                return false;
            }
        }
        get size() {
            return this.cache.size;
        }
    }

    class AssetBayStore {
        constructor() {
            this.items = [];
            this.capturedIndex = new Set();
        }
        has(src) {
            return Boolean(src) && this.capturedIndex.has(src);
        }
        capture(assetObj) {
            if (!assetObj || !assetObj.src || !assetObj.src.startsWith('http')) return null;
            if (this.capturedIndex.has(assetObj.src)) return null;
            const item = {
                src: assetObj.src,
                type: assetObj.type === 'video' ? 'video' : 'image',
                capturedAt: Date.now()
            };
            this.items.push(item);
            this.capturedIndex.add(assetObj.src);
            return item;
        }
        remove(src) {
            this.capturedIndex.delete(src);
            this.items = this.items.filter(item => item.src !== src);
        }
        clear() {
            this.items = [];
            this.capturedIndex.clear();
        }
        get size() {
            return this.items.length;
        }
        latest(count) {
            return this.items.slice(-count);
        }
    }

    class EngineConfiguration {
        constructor() {
            this.scriptVersion = "5.3.0";
            this.selectors = {
                videoCardQueries: [
                    "div[class*='group/video-card']",
                    ".grid-video-card",
                    ".media-card-wrapper",
                    "div[data-card-id]",
                    "div[data-feed-id]",
                    "div.relative:has(> div[style*='padding-top'])",
                    "div.mb-2.flex.w-max.max-w-full"
                ],
                createButtonQueries: [
                    ".new-color-btn-bg",
                    ".pink-gradient-btn"
                ],
                queueTextQueries: [
                    "div[class*='content-center'][class*='text-center'][class*='font-medium']",
                    ".relative.h-full.w-full.content-center.text-center.text-\\[13px\\].font-medium"
                ],
                progressTextQueries: [
                    ".ant-progress-text",
                    "[role='progressbar']",
                    "div.loading-text-animation"
                ],
                deleteButton: "absolute right-[10px] top-3 z-[4] cursor-pointer",
                deleteConfirmButton: "ant-btn-color-primary",
                modalContent: "ant-modal-content"
            };
            this.constants = {
                maxQueueSize: 5,
                executionInterval: 2000,
                baseNotificationIcon: "https://registry.npmmirror.com/@lobehub/icons-static-png/1.5.0/files/dark/hailuo-color.png"
            };
            this.violationStrings = [
                "The video generation failed as it does not comply with community policies.",
                "Content generation error, please regenerate",
                "There is an issue with the text content, try using different content",
                "It might not meet our community guidelines, please try a different content.",
                "Text content violated Community Guidelines, please revise and try again.",
                "Generation failed because video content violated Community Guidelines.",
                "Generation failed because content violated Community Guidelines.",
                "Image Generation unknown error"
            ];
            this.censoredStrings = [
                "Failure to pass the review.",
                "This video is not available because it violated Community Guidelines.",
                "This content is not available because it violated Community Guidelines."
            ];
        }
    }

    const config = new EngineConfiguration();
    const stateManager = new PersistentState();

    const runtimeSwitches = {
        autoGen: false,
        autoGrab: false,
        alertCompletion: false,
        purgeAccount: false,
        hideFail: false,
        hoverLinks: false
    };

    class UIComponentFactory {
        constructor() {
            this.host = null;
            this.shadow = null;
            this.hudContainer = null;
            this.orchestrator = null;
            this.assetBayStore = new AssetBayStore();
            this.activeBayHoverPreview = null;
        }

        init(orchestratorInstance) {
            if (document.getElementById('andr0666-ui-root')) {
                Logger.warn("UI Root initialization intercepted: component already rendered.");
                return;
            }
            this.orchestrator = orchestratorInstance;
            try {
                this.host = document.createElement('div');
                this.host.id = 'andr0666-ui-root';
                document.body.appendChild(this.host);
                this.shadow = this.host.attachShadow({ mode: 'closed' });
                this.injectGlobalStyles();
                this.buildHUD(orchestratorInstance);
                this.bindDragMechanics();
                Logger.info("Encapsulated execution HUD injected successfully.");
            } catch (e) {
                Logger.error("Fatal exception during layout construction matrix execution.", e);
            }
        }

        injectGlobalStyles() {
            const style = document.createElement('style');
            style.textContent = `
                :host {
                  --bg-dark-base: #050A0F;
                  --bg-glass-panel: rgba(10, 19, 26, 0.9);
                  --accent-cyan: #00E5FF;
                  --text-cyan-active: #67E8F9;
                  --accent-cyan-border-idle: rgba(0, 229, 255, 0.2);
                  --accent-cyan-border-hover: rgba(0, 229, 255, 0.5);
                  --accent-cyan-bg-hover: rgba(0, 229, 255, 0.05);
                  --accent-cyan-bg-active: rgba(0, 229, 255, 0.2);
                  --glow-cyan-active: rgba(0, 229, 255, 0.4);
                  --shadow-glass-base: 0 12px 40px 0 rgba(0, 0, 0, 0.6);
                  --edge-light-top: rgba(255, 255, 255, 0.15);
                  --edge-light-left: rgba(255, 255, 255, 0.15);
                  --text-primary: #EAEAEA;
                  --text-secondary: #9E9E9E;
                  --font-body: 'Roboto Mono', monospace;
                }
                #glass-hud-container {
                  position: fixed;
                  bottom: 25px;
                  right: 25px;
                  z-index: 2147483647;
                  font-family: var(--font-body);
                  width: 350px;
                  background: var(--bg-glass-panel);
                  backdrop-filter: blur(20px);
                  -webkit-backdrop-filter: blur(20px);
                  border: 1px solid var(--accent-cyan-border-idle);
                  border-top: 1px solid var(--edge-light-top);
                  border-left: 1px solid var(--edge-light-left);
                  border-radius: 12px;
                  box-shadow: var(--shadow-glass-base);
                  padding: 16px;
                  color: var(--text-primary);
                  user-select: none;
                }
                .hud-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  border-bottom: 1px solid var(--accent-cyan-border-idle);
                  padding-bottom: 10px;
                  margin-bottom: 12px;
                  cursor: move;
                }
                .hud-title {
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                  color: var(--accent-cyan);
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  font-weight: bold;
                }
                .telemetry-row {
                  display: flex;
                  justify-content: space-between;
                  font-size: 0.7rem;
                  color: var(--text-secondary);
                  margin-bottom: 10px;
                  border-bottom: 1px dashed rgba(0, 229, 255, 0.15);
                  padding-bottom: 8px;
                }
                .action-matrix {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 8px;
                  margin-top: 12px;
                }
                .mechanical-switch {
                  display: inline-flex;
                  align-items: center;
                  justify-content: space-between;
                  background: rgba(0, 0, 0, 0.6);
                  border: 1px solid var(--accent-cyan-border-idle);
                  border-radius: 6px;
                  padding: 8px 12px;
                  font-size: 0.68rem;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  color: var(--text-secondary);
                  cursor: pointer;
                  transition: all 200ms ease;
                  position: relative;
                }
                .mechanical-switch:hover {
                  color: var(--accent-cyan);
                  border-color: var(--accent-cyan-border-hover);
                  background-color: var(--accent-cyan-bg-hover);
                }
                .mechanical-switch.active {
                  color: var(--text-cyan-active);
                  background-color: var(--accent-cyan-bg-active);
                  border-color: var(--accent-cyan);
                  box-shadow: 0 0 12px var(--glow-cyan-active);
                }
                .switch-indicator {
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background: #ff4444;
                  box-shadow: 0 0 6px #ff4444;
                  transition: background 200ms ease, box-shadow 200ms ease;
                }
                .mechanical-switch.active .switch-indicator {
                  background: var(--accent-cyan);
                  box-shadow: 0 0 8px var(--accent-cyan);
                }
                .sys-btn {
                  background: rgba(255, 170, 0, 0.1);
                  border: 1px solid rgba(255, 170, 0, 0.3);
                  color: #ffaa00;
                  font-size: 0.68rem;
                  text-transform: uppercase;
                  padding: 8px;
                  border-radius: 6px;
                  cursor: pointer;
                  text-align: center;
                  letter-spacing: 0.06em;
                  font-weight: bold;
                  transition: all 200ms ease;
                }
                .sys-btn:hover {
                  background: rgba(255, 170, 0, 0.25);
                  border-color: #ffaa00;
                  color: #ffffff;
                }
                .help-btn {
                  background: rgba(0, 229, 255, 0.1);
                  border: 1px solid rgba(0, 229, 255, 0.3);
                  color: var(--accent-cyan);
                }
                .help-btn:hover {
                  background: rgba(0, 229, 255, 0.25);
                  color: #ffffff;
                }
                .mechanical-switch::after {
                  content: attr(data-tooltip);
                  position: absolute;
                  bottom: 135%;
                  left: 50%;
                  transform: translateX(-50%);
                  background: rgba(5, 10, 15, 0.98);
                  border: 1px solid var(--accent-cyan);
                  color: var(--text-primary);
                  padding: 8px 12px;
                  font-size: 0.65rem;
                  border-radius: 6px;
                  white-space: normal;
                  width: 240px;
                  line-height: 1.4;
                  opacity: 0;
                  pointer-events: none;
                  transition: opacity 200ms ease;
                  z-index: 100000;
                  box-shadow: 0 6px 24px rgba(0,0,0,0.9);
                  text-transform: none;
                  letter-spacing: normal;
                }
                .mechanical-switch:hover::after {
                  opacity: 1;
                }
                #help-modal-overlay {
                  position: fixed;
                  top: 0; left: 0; right: 0; bottom: 0;
                  background: rgba(3, 5, 8, 0.85);
                  backdrop-filter: blur(6px);
                  z-index: 2147483646;
                  display: none;
                  align-items: center;
                  justify-content: center;
                }
                .help-card {
                  background: #0A131A;
                  border: 1px solid var(--accent-cyan);
                  border-radius: 12px;
                  width: 440px;
                  max-width: 90vw;
                  padding: 20px;
                  box-shadow: var(--shadow-glass-base);
                  font-family: var(--font-body);
                  color: var(--text-primary);
                }
                .help-card h3 {
                  margin-top: 0;
                  color: var(--accent-cyan);
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  border-bottom: 1px solid var(--accent-cyan-border-idle);
                  padding-bottom: 8px;
                }
                .help-content {
                  font-size: 0.72rem;
                  line-height: 1.5;
                  color: var(--text-secondary);
                  max-height: 300px;
                  overflow-y: auto;
                  margin-bottom: 16px;
                }
                .help-item {
                  margin-bottom: 12px;
                }
                .help-item strong {
                  color: var(--text-primary);
                  display: block;
                  margin-bottom: 2px;
                }
                .close-help-btn {
                  width: 100%;
                  background: rgba(0, 229, 255, 0.15);
                  border: 1px solid var(--accent-cyan);
                  color: #ffffff;
                  padding: 8px;
                  border-radius: 6px;
                  cursor: pointer;
                  text-transform: uppercase;
                  font-weight: bold;
                  transition: all 200ms ease;
                }
                .close-help-btn:hover {
                  background: var(--accent-cyan);
                  color: var(--bg-dark-base);
                }
                #asset-bay-bar {
                  display: none;
                  flex-direction: column;
                  gap: 6px;
                  margin-bottom: 12px;
                  border: 1px solid var(--accent-cyan-border-idle);
                  border-radius: 8px;
                  padding: 8px;
                  background: rgba(0, 0, 0, 0.35);
                }
                #asset-bay-bar.captured-flash {
                  animation: bayCaptureFlash 900ms ease;
                }
                @keyframes bayCaptureFlash {
                  0%, 100% { box-shadow: none; border-color: var(--accent-cyan-border-idle); }
                  30% { box-shadow: 0 0 16px var(--glow-cyan-active); border-color: var(--accent-cyan); }
                }
                .bay-bar-head {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                }
                .bay-bar-title {
                  font-size: 0.62rem;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                  color: var(--accent-cyan);
                  font-weight: bold;
                }
                #bay-toggle-btn {
                  background: rgba(0, 229, 255, 0.1);
                  border: 1px solid rgba(0, 229, 255, 0.3);
                  color: var(--accent-cyan);
                  font-size: 0.62rem;
                  font-weight: bold;
                  border-radius: 5px;
                  padding: 2px 8px;
                  cursor: pointer;
                  font-family: var(--font-body);
                }
                #bay-toggle-btn:hover {
                  background: rgba(0, 229, 255, 0.25);
                  color: #ffffff;
                }
                .bay-strip {
                  display: flex;
                  gap: 6px;
                  overflow-x: auto;
                  padding-bottom: 2px;
                }
                .bay-strip::-webkit-scrollbar { height: 4px; }
                .bay-strip::-webkit-scrollbar-thumb { background: var(--accent-cyan-border-hover); border-radius: 2px; }
                .bay-thumb {
                  position: relative;
                  flex: 0 0 auto;
                  width: 56px;
                  height: 56px;
                  border-radius: 6px;
                  overflow: hidden;
                  cursor: pointer;
                  border: 1px solid var(--accent-cyan-border-idle);
                  background: #050A0F;
                  transition: border-color 200ms ease, box-shadow 200ms ease;
                }
                .bay-thumb:hover {
                  border-color: var(--accent-cyan);
                  box-shadow: 0 0 10px var(--glow-cyan-active);
                }
                .bay-thumb img, .bay-thumb video {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  display: block;
                }
                .bay-type-badge {
                  position: absolute;
                  bottom: 2px;
                  right: 2px;
                  font-size: 0.5rem;
                  font-weight: bold;
                  letter-spacing: 0.05em;
                  color: var(--text-primary);
                  background: rgba(5, 10, 15, 0.85);
                  border: 1px solid var(--accent-cyan-border-idle);
                  border-radius: 3px;
                  padding: 1px 3px;
                  pointer-events: none;
                }
                .bay-expired img, .bay-expired video { visibility: hidden; }
                .bay-expired::after {
                  content: 'EXPIRED';
                  position: absolute;
                  inset: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 0.55rem;
                  letter-spacing: 0.08em;
                  color: var(--text-secondary);
                  background: repeating-linear-gradient(45deg, rgba(158, 158, 158, 0.08) 0 6px, transparent 6px 12px);
                }
                #asset-bay-panel {
                  display: none;
                  margin-top: 12px;
                  border: 1px solid var(--accent-cyan-border-idle);
                  border-radius: 8px;
                  padding: 10px;
                  background: rgba(0, 0, 0, 0.4);
                }
                #asset-bay-panel.open { display: block; }
                .bay-panel-header {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  margin-bottom: 8px;
                  gap: 8px;
                }
                .bay-panel-title {
                  font-size: 0.62rem;
                  text-transform: uppercase;
                  letter-spacing: 0.12em;
                  color: var(--accent-cyan);
                  font-weight: bold;
                }
                .bay-panel-tools { display: flex; gap: 6px; }
                .bay-tool-btn {
                  background: rgba(255, 170, 0, 0.1);
                  border: 1px solid rgba(255, 170, 0, 0.3);
                  color: #ffaa00;
                  font-size: 0.6rem;
                  font-weight: bold;
                  text-transform: uppercase;
                  letter-spacing: 0.06em;
                  border-radius: 5px;
                  padding: 3px 8px;
                  cursor: pointer;
                  font-family: var(--font-body);
                }
                .bay-tool-btn:hover {
                  background: rgba(255, 170, 0, 0.25);
                  border-color: #ffaa00;
                  color: #ffffff;
                }
                .bay-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 8px;
                  max-height: 38vh;
                  overflow-y: auto;
                }
                .bay-card {
                  position: relative;
                  aspect-ratio: 1 / 1;
                  border-radius: 8px;
                  overflow: hidden;
                  cursor: pointer;
                  border: 1px solid var(--accent-cyan-border-idle);
                  background: #050A0F;
                  transition: border-color 200ms ease, box-shadow 200ms ease;
                }
                .bay-card:hover {
                  border-color: var(--accent-cyan);
                  box-shadow: 0 0 10px var(--glow-cyan-active);
                }
                .bay-card img, .bay-card video {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                  display: block;
                }
                .bay-card-actions {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  display: flex;
                  opacity: 0;
                  transition: opacity 200ms ease;
                }
                .bay-card:hover .bay-card-actions, .bay-card-actions:focus-within { opacity: 1; }
                .bay-action {
                  flex: 1;
                  text-align: center;
                  font-size: 0.58rem;
                  font-weight: bold;
                  letter-spacing: 0.05em;
                  padding: 4px 0;
                  color: var(--text-primary);
                  background: rgba(5, 10, 15, 0.88);
                  border: none;
                  border-top: 1px solid var(--accent-cyan-border-idle);
                  cursor: pointer;
                  font-family: var(--font-body);
                }
                .bay-action:hover { color: var(--accent-cyan); background: rgba(0, 229, 255, 0.12); }
                .bay-empty-note {
                  font-size: 0.62rem;
                  line-height: 1.5;
                  color: var(--text-secondary);
                  display: none;
                }
                .bay-hover-preview {
                  position: fixed;
                  z-index: 2147483646;
                  border: 2px solid var(--accent-cyan);
                  border-radius: 8px;
                  overflow: hidden;
                  background: #050A0F;
                  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.9);
                  pointer-events: none;
                }
                .bay-hover-preview img, .bay-hover-preview video {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  display: block;
                }
            `;
            this.shadow.appendChild(style);

            const documentStyle = document.createElement("style");
            documentStyle.textContent = `
                .linkElClass { color: #00E5FF; position: absolute; top: 10px; left: 10px; height: 18px; width: 48px; font-size: 10px; background-color: rgba(5, 10, 15, 0.9); font-family: 'Roboto Mono', monospace; font-weight: bold; text-align: center; line-height: 18px; border-radius: 4px; border: 1px solid rgba(0, 229, 255, 0.4); opacity: 0.8; z-index: 50; transition: all 200ms ease; text-decoration: none; display: block; }
                .linkElClass:hover { opacity: 1.0; border-color: #00E5FF; box-shadow: 0 0 10px rgba(0, 229, 255, 0.6); background-color: #050A0F; }
                .linkElClass a { color: inherit; text-decoration: none; display: block; width: 100%; height: 100%; }
                .videoPreviewElClass { position: absolute; top: 35px; left: 10px; width: 260px; max-width: 480px; max-height: 260px; z-index: 100; border: 2px solid #00E5FF; border-radius: 8px; box-shadow: 0 12px 36px rgba(0,0,0,0.9); background: #050A0F; pointer-events: none; }
                .imagePreviewElClass { position: absolute; top: 35px; left: 10px; width: 260px; max-width: 480px; max-height: 260px; z-index: 100; border: 2px solid #00E5FF; border-radius: 8px; box-shadow: 0 12px 36px rgba(0,0,0,0.9); object-fit: contain; background: #050A0F; pointer-events: none; }
            `;
            document.head.appendChild(documentStyle);
        }

        buildHUD(orchestratorInstance) {
            this.hudContainer = document.createElement('div');
            this.hudContainer.id = 'glass-hud-container';
            this.hudContainer.innerHTML = `
                <div class="hud-header" id="hud-drag-handle">
                    <div class="hud-title">
                        <svg viewBox="0 0 128 128" style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="6">
                            <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="6 6" />
                            <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" />
                        </svg>
                        <span>4ndr0tools PRO</span>
                    </div>
                    <div style="font-size: 0.6rem; color: var(--accent-cyan); font-weight: bold;">v${config.scriptVersion}</div>
                </div>
                <div class="telemetry-row">
                    <span>TRACKED ARCHIVE SIZE:</span>
                    <span id="telemetry-tracker">0 ASSETS</span>
                </div>
                <div id="asset-bay-bar">
                    <div class="bay-bar-head">
                        <span class="bay-bar-title">Asset Bay</span>
                        <button id="bay-toggle-btn" title="Expand / collapse the captured asset gallery">0</button>
                    </div>
                    <div class="bay-strip" id="bay-strip"></div>
                </div>
                <div class="action-matrix">
                    <div class="mechanical-switch" id="sw-gen" data-tooltip="Monitors the generation queue slots. Automatically pushes the primary creation click triggers whenever free space opens up."><span>Auto Queue Click</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-dl" data-tooltip="Scans completed media and hooks native site download pipelines where present; assets without a native control (agent chat) are captured into the Asset Bay as clickable thumbnails. The active session window is never navigated away."><span>Auto Fetch Asset</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-notif" data-tooltip="Issues system-level alerts when generation tracking markers cross 90% parameters on inactive browser configurations."><span>Notify Completion</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-del" data-tooltip="Hard-deletes generation instances that have triggered site guidelines or structural processing anomalies instantly via native API simulation vectors."><span>API Hard Purge</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-dom" data-tooltip="Masks failed cards from your layout locally without throwing trace signals, preserving screen estate context."><span>Mask Fail Cards</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-notif-hov" data-tooltip="Injects non-destructive asset address anchor triggers onto processing matrix modules. Hovering handles automatic floating video view cache playback."><span>Interactive Links</span><div class="switch-indicator"></div></div>
                    <button class="sys-btn help-btn" id="sys-help">Usage Guide (--help)</button>
                    <button class="sys-btn" id="sys-clear">Purge Database Cache</button>
                </div>
                <div id="asset-bay-panel">
                    <div class="bay-panel-header">
                        <span class="bay-panel-title">Captured Assets</span>
                        <div class="bay-panel-tools">
                            <button id="bay-download-all" class="bay-tool-btn" title="Download every bay asset via the blob pipeline (never navigates this window)">Save All</button>
                            <button id="bay-clear" class="bay-tool-btn" title="Clear the bay gallery">Clear</button>
                        </div>
                    </div>
                    <div class="bay-grid" id="bay-grid"></div>
                    <div class="bay-empty-note" id="bay-empty-note">No captures yet. Enable Auto Fetch Asset; completed media will populate here as clickable thumbnails.</div>
                </div>
            `;
            this.shadow.appendChild(this.hudContainer);

            const helpModal = document.createElement('div');
            helpModal.id = 'help-modal-overlay';
            helpModal.innerHTML = `
                <div class="help-card">
                    <h3>Operational Manual (--help)</h3>
                    <div class="help-content">
                        <div class="help-item">
                            <strong>[Auto Queue Click]</strong>
                            Safely loops and triggers asset creation generation execution paths when tracking metrics confirm vacancy slots.
                        </div>
                        <div class="help-item">
                            <strong>[Auto Fetch Asset]</strong>
                            Idempotently scans completed media. Where the page exposes a native download control it is clicked directly; otherwise the asset is captured into the Asset Bay as a clickable thumbnail that opens in a new window. The active session window is never navigated away.
                        </div>
                        <div class="help-item">
                            <strong>[Asset Bay]</strong>
                            In-HUD thumbnail gallery of auto-captured assets. Click a thumbnail to open the asset in a new window; hover for a playable preview; expand the bay for SAVE (blob download, zero navigation), COPY URL, and SAVE ALL actions.
                        </div>
                        <div class="help-item">
                            <strong>[Notify Completion]</strong>
                            Requests background system permissions. Dispatches explicit notification packets once asset processing ticks hit 90%.
                        </div>
                        <div class="help-item">
                            <strong>[API Hard Purge]</strong>
                            Triggers structural actions to clean failed generation indices entirely from account indexes.
                        </div>
                        <div class="help-item">
                            <strong>[Mask Fail Cards]</strong>
                            Hides workspace modules that match failure conditions to preserve layout clarity.
                        </div>
                        <div class="help-item">
                            <strong>[Interactive Links]</strong>
                            Overlays hover-reactive video data triggers, implementing live viewport preview engines safely.
                        </div>
                    </div>
                    <button class="close-help-btn" id="close-help">Acknowledge Directive</button>
                </div>
            `;
            this.shadow.appendChild(helpModal);
            this.bindInteractiveEvents(orchestratorInstance);
        }

        bindInteractiveEvents(orchestratorInstance) {
            const bindSwitch = (id, startState, setter) => {
                const el = this.shadow.getElementById(id);
                if (startState) el.classList.add('active');
                el.addEventListener('click', () => {
                    const active = el.classList.toggle('active');
                    setter(active);
                    orchestratorInstance.executeLoopIteration();
                });
            };
            bindSwitch('sw-gen', runtimeSwitches.autoGen, (v) => { runtimeSwitches.autoGen = v; });
            bindSwitch('sw-dl', runtimeSwitches.autoGrab, (v) => { runtimeSwitches.autoGrab = v; });
            bindSwitch('sw-notif', runtimeSwitches.alertCompletion, (v) => { runtimeSwitches.alertCompletion = v; if (v) orchestratorInstance.requestNotificationAccess(); });
            bindSwitch('sw-del', runtimeSwitches.purgeAccount, (v) => { runtimeSwitches.purgeAccount = v; });
            bindSwitch('sw-dom', runtimeSwitches.hideFail, (v) => { runtimeSwitches.hideFail = v; });
            bindSwitch('sw-notif-hov', runtimeSwitches.hoverLinks, (v) => { runtimeSwitches.hoverLinks = v; });

            this.shadow.getElementById('sys-clear').addEventListener('click', () => {
                if (confirm("Are you sure you want to clear the entire tracked history cache?")) {
                    stateManager.clear();
                    orchestratorInstance.syncTelemetryDisplay();
                    Logger.info("Persistent operational database cleared.");
                }
            });

            const overlay = this.shadow.getElementById('help-modal-overlay');
            this.shadow.getElementById('sys-help').addEventListener('click', () => { overlay.style.display = 'flex'; });
            this.shadow.getElementById('close-help').addEventListener('click', () => { overlay.style.display = 'none'; });

            this.shadow.getElementById('bay-toggle-btn').addEventListener('click', () => {
                this.renderAssetBay(true);
                this.shadow.getElementById('asset-bay-panel').classList.toggle('open');
            });
            this.shadow.getElementById('bay-clear').addEventListener('click', () => {
                this.assetBayStore.clear();
                this.renderAssetBay();
                Logger.info("Asset bay gallery cleared by operator directive.");
            });
            this.shadow.getElementById('bay-download-all').addEventListener('click', async () => {
                const pending = this.assetBayStore.items.filter(item => !stateManager.has(item.src));
                if (!pending.length) {
                    Logger.info("Save All directive skipped: every bay asset is already present in the tracked archive.");
                    return;
                }
                Logger.info(`Save All directive accepted for ${pending.length} bay asset(s); dispatching sequential blob downloads.`);
                for (const item of pending) {
                    await this.orchestrator.downloadAssetViaBlob(item);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            });
        }

        bindDragMechanics() {
            const container = this.hudContainer;
            const handle = this.shadow.getElementById('hud-drag-handle');
            const safeStorageGet = (key) => {
                try {
                    return localStorage.getItem(key);
                } catch (e) {
                    Logger.warn("HUD persisted geometry unavailable in this storage context.", e);
                    return null;
                }
            };
            const safeStorageSet = (key, value) => {
                try {
                    localStorage.setItem(key, value);
                } catch (e) {
                    Logger.warn("HUD geometry persistence rejected by storage quota policy.", e);
                }
            };
            let active = false;
            let startX = 0, startY = 0;
            let initialX = 0, initialY = 0;
            const storedLeft = safeStorageGet('4ndr0_pro_hud_left');
            const storedTop = safeStorageGet('4ndr0_pro_hud_top');
            if (storedLeft && storedTop) {
                container.style.bottom = 'auto';
                container.style.right = 'auto';
                container.style.left = storedLeft;
                container.style.top = storedTop;
            }
            handle.addEventListener('mousedown', (e) => {
                active = true;
                container.style.transition = 'none';
                const box = container.getBoundingClientRect();
                startX = e.clientX;
                startY = e.clientY;
                initialX = box.left;
                initialY = box.top;
                document.addEventListener('mousemove', dragHUD);
                document.addEventListener('mouseup', dropHUD);
                e.preventDefault();
            });
            const dragHUD = (e) => {
                if (!active) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                let targetLeft = initialX + dx;
                let targetTop = initialY + dy;
                const boundsX = window.innerWidth - container.offsetWidth;
                const boundsY = window.innerHeight - container.offsetHeight;
                if (targetLeft < 0) targetLeft = 0;
                if (targetLeft > boundsX) targetLeft = boundsX;
                if (targetTop < 0) targetTop = 0;
                if (targetTop > boundsY) targetTop = boundsY;
                container.style.bottom = 'auto';
                container.style.right = 'auto';
                container.style.left = `${targetLeft}px`;
                container.style.top = `${targetTop}px`;
            };
            const dropHUD = () => {
                if (active) {
                    active = false;
                    container.style.transition = 'border-color 200ms ease, box-shadow 200ms ease';
                    safeStorageSet('4ndr0_pro_hud_left', container.style.left);
                    safeStorageSet('4ndr0_pro_hud_top', container.style.top);
                    document.removeEventListener('mousemove', dragHUD);
                    document.removeEventListener('mouseup', dropHUD);
                }
            };
        }

        captureAssetIntoBay(assetObj) {
            const item = this.assetBayStore.capture(assetObj);
            if (!item) return false;
            this.renderAssetBay();
            const bar = this.shadow.getElementById('asset-bay-bar');
            if (bar) {
                bar.classList.remove('captured-flash');
                void bar.offsetWidth;
                bar.classList.add('captured-flash');
            }
            Logger.info(`Asset captured into bay (clickable thumbnail ready; opens in a new window): ${item.src}`);
            return true;
        }

        renderAssetBay(expandPanel) {
            const bar = this.shadow.getElementById('asset-bay-bar');
            const strip = this.shadow.getElementById('bay-strip');
            const grid = this.shadow.getElementById('bay-grid');
            const toggle = this.shadow.getElementById('bay-toggle-btn');
            const emptyNote = this.shadow.getElementById('bay-empty-note');
            const panel = this.shadow.getElementById('asset-bay-panel');
            if (!bar || !strip || !grid) return;
            const store = this.assetBayStore;
            bar.style.display = store.size ? 'flex' : 'none';
            if (toggle) toggle.textContent = String(store.size);
            strip.innerHTML = '';
            for (const item of store.latest(12)) strip.appendChild(this.createBayThumbNode(item, false));
            grid.innerHTML = '';
            for (const item of store.items) grid.appendChild(this.createBayThumbNode(item, true));
            if (emptyNote) emptyNote.style.display = store.size ? 'none' : 'block';
            if (!store.size && panel) panel.classList.remove('open');
            if (expandPanel && store.size && panel) panel.classList.add('open');
        }

        createBayThumbNode(item, isLargeCard) {
            const thumb = document.createElement('div');
            thumb.className = isLargeCard ? 'bay-card' : 'bay-thumb';
            thumb.title = `${item.type === 'video' ? 'Video' : 'Image'} asset - click opens in a new window${isLargeCard ? '; hover reveals SAVE and COPY' : ''}`;
            let mediaNode;
            if (item.type === 'video') {
                mediaNode = document.createElement('video');
                mediaNode.src = item.src;
                mediaNode.muted = true;
                mediaNode.preload = 'metadata';
                mediaNode.playsInline = true;
                mediaNode.setAttribute('disablepictureinpicture', '');
            } else {
                mediaNode = document.createElement('img');
                mediaNode.src = item.src;
                mediaNode.alt = 'captured asset thumbnail';
                mediaNode.loading = 'lazy';
            }
            mediaNode.addEventListener('error', () => { thumb.classList.add('bay-expired'); });
            thumb.appendChild(mediaNode);
            const badge = document.createElement('span');
            badge.className = 'bay-type-badge';
            badge.textContent = item.type === 'video' ? 'MP4' : 'IMG';
            thumb.appendChild(badge);
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAssetInNewWindow(item.src);
            });
            if (isLargeCard) {
                const actions = document.createElement('div');
                actions.className = 'bay-card-actions';
                const saveBtn = document.createElement('button');
                saveBtn.type = 'button';
                saveBtn.className = 'bay-action';
                saveBtn.textContent = 'SAVE';
                saveBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    saveBtn.textContent = '····';
                    const dispatched = await this.orchestrator.downloadAssetViaBlob(item);
                    saveBtn.textContent = dispatched ? 'SAVED' : 'NEW WIN';
                    setTimeout(() => { saveBtn.textContent = 'SAVE'; }, 2500);
                });
                const copyBtn = document.createElement('button');
                copyBtn.type = 'button';
                copyBtn.className = 'bay-action';
                copyBtn.textContent = 'COPY';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.copyAssetUrl(item.src, copyBtn);
                });
                actions.appendChild(saveBtn);
                actions.appendChild(copyBtn);
                thumb.appendChild(actions);
            }
            thumb.addEventListener('mouseenter', () => { this.showBayHoverPreview(thumb, item); });
            thumb.addEventListener('mouseleave', () => { this.hideBayHoverPreview(); });
            return thumb;
        }

        showBayHoverPreview(thumb, item) {
            this.hideBayHoverPreview();
            const preview = document.createElement('div');
            preview.className = 'bay-hover-preview';
            const rect = thumb.getBoundingClientRect();
            const previewWidth = Math.min(320, window.innerWidth - 40);
            const previewHeight = Math.min(240, window.innerHeight - 40);
            let left = rect.left - previewWidth - 12;
            if (left < 10) left = Math.min(rect.right + 12, Math.max(10, window.innerWidth - previewWidth - 10));
            const top = Math.max(10, Math.min(rect.top, window.innerHeight - previewHeight - 10));
            preview.style.left = `${left}px`;
            preview.style.top = `${top}px`;
            preview.style.width = `${previewWidth}px`;
            preview.style.height = `${previewHeight}px`;
            if (item.type === 'video') {
                const videoEl = document.createElement('video');
                videoEl.src = item.src;
                videoEl.autoplay = true;
                videoEl.muted = true;
                videoEl.loop = true;
                videoEl.playsInline = true;
                preview.appendChild(videoEl);
            } else {
                const imgEl = document.createElement('img');
                imgEl.src = item.src;
                imgEl.alt = 'captured asset preview';
                preview.appendChild(imgEl);
            }
            this.shadow.appendChild(preview);
            this.activeBayHoverPreview = preview;
        }

        hideBayHoverPreview() {
            if (this.activeBayHoverPreview) {
                this.activeBayHoverPreview.remove();
                this.activeBayHoverPreview = null;
            }
        }

        openAssetInNewWindow(src) {
            if (!src || !src.startsWith('http')) {
                Logger.warn("Bay dispatch rejected: asset source is not an HTTP location context.");
                return;
            }
            const opened = window.open(src, '_blank', 'noopener');
            if (!opened) Logger.warn("New-window dispatch was blocked by the popup policy; focus the page and click the thumbnail again.");
        }

        copyAssetUrl(src, sourceButton) {
            const reflectResult = (label) => {
                if (sourceButton) {
                    const originalLabel = sourceButton.textContent;
                    sourceButton.textContent = label;
                    setTimeout(() => { sourceButton.textContent = originalLabel; }, 2000);
                }
            };
            const fallbackCopy = () => {
                try {
                    const scratch = document.createElement('textarea');
                    scratch.value = src;
                    scratch.style.position = 'fixed';
                    scratch.style.opacity = '0';
                    document.body.appendChild(scratch);
                    scratch.select();
                    const copied = document.execCommand('copy');
                    document.body.removeChild(scratch);
                    reflectResult(copied ? 'COPIED' : 'BLOCKED');
                } catch (e) {
                    reflectResult('BLOCKED');
                    Logger.warn("Clipboard fallback transcription rejected by the document context.", e);
                }
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(src).then(() => reflectResult('COPIED')).catch(fallbackCopy);
            } else {
                fallbackCopy();
            }
        }

        updateTelemetryTracker(value) {
            const el = this.shadow.getElementById('telemetry-tracker');
            if (el) el.innerText = `${value} ASSETS`;
        }
    }

    class AutomationOrchestrator {
        constructor() {
            this.uiFactory = new UIComponentFactory();
            this.hasRequestedNotifications = false;
            this.observer = null;
        }

        bootstrap() {
            Logger.info(`Bootstrapping core orchestration parameters. Build ${config.scriptVersion}.`);
            this.uiFactory.init(this);
            this.syncTelemetryDisplay();
            this.initMutationDefense();
            setInterval(() => {
                try {
                    this.executeLoopIteration();
                } catch (e) {
                    Logger.error("Uncaught exception captured inside primary operational orchestration frame.", e);
                }
            }, config.constants.executionInterval);
        }

        initMutationDefense() {
            if (this.observer) this.observer.disconnect();
            if (this.observerDebounceTimer) {
                clearTimeout(this.observerDebounceTimer);
                this.observerDebounceTimer = null;
            }
            this.observer = new MutationObserver((mutations) => {
                let dynamicTriggerNeeded = false;
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        dynamicTriggerNeeded = true;
                        break;
                    }
                }
                if (!dynamicTriggerNeeded) return;
                if (this.observerDebounceTimer) clearTimeout(this.observerDebounceTimer);
                this.observerDebounceTimer = setTimeout(() => {
                    this.observerDebounceTimer = null;
                    this.executeLoopIteration();
                }, 250);
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
            Logger.info("MutationObserver tracking matrix activated.");
        }

        syncTelemetryDisplay() {
            this.uiFactory.updateTelemetryTracker(stateManager.size);
        }

        requestNotificationAccess() {
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission().then(perm => {
                    Logger.info(`Native alert status clearance level resolved to: ${perm}`);
                });
            }
        }

        dispatchNativeAlert() {
            if (runtimeSwitches.alertCompletion && "Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification("Automated Generation Complete", {
                        body: "A queued asset pipeline thread has verified 90%+ target parameters.",
                        icon: config.constants.baseNotificationIcon
                    });
                } catch (e) {
                    Logger.error("Failed to safely dispatch operational system alert packet.", e);
                }
            }
        }

        inspectDocumentTitleState() {
            const progressNodes = new Set();
            for (const selector of config.selectors.progressTextQueries) {
                document.querySelectorAll(selector).forEach(node => progressNodes.add(node));
            }
            if (!progressNodes.size) {
                document.title = "Ready";
                return;
            }
            const activePercentages = Array.from(progressNodes).map(node => {
                const ariaValue = Number(node.getAttribute('aria-valuenow'));
                if (!isNaN(ariaValue) && ariaValue > 0) return ariaValue;
                const check = node.textContent?.match(/(\d+)/);
                return check ? Number(check[1]) : null;
            }).filter(num => num !== null && !isNaN(num));
            const maxProgress = activePercentages.sort((a, b) => b - a)[0];
            if (maxProgress !== undefined && !isNaN(maxProgress)) {
                document.title = `[${maxProgress}%]`;
                if (maxProgress >= 90 && !this.hasRequestedNotifications) {
                    this.dispatchNativeAlert();
                    this.hasRequestedNotifications = true;
                } else if (maxProgress < 90) {
                    this.hasRequestedNotifications = false;
                }
            } else {
                document.title = "Standby";
            }
        }

        resolveCreateControl() {
            for (const selector of config.selectors.createButtonQueries) {
                const btn = document.querySelector(selector);
                if (btn) return btn;
            }
            const byLabel = Array.from(document.querySelectorAll('button')).find(btn => {
                const label = (btn.innerText || '').trim().toLowerCase();
                return label === 'create' || label === 'generate';
            });
            return byLabel || null;
        }

        isCreateControlDisabled(btn) {
            if (!btn) return true;
            if (btn.disabled === true) return true;
            if (btn.getAttribute('aria-disabled') === 'true') return true;
            if (btn.classList.contains('opacity-60')) return true;
            if (btn.parentElement && btn.parentElement.classList.contains('opacity-60')) return true;
            try {
                if (getComputedStyle(btn).pointerEvents === 'none') return true;
            } catch (e) {
                Logger.debug("Computed style probe rejected by rendering context.", e);
            }
            return false;
        }

        safelyFetchQueueMetrics() {
            for (const selector of config.selectors.queueTextQueries) {
                const el = document.querySelector(selector);
                if (!el) continue;
                const contextText = el.textContent?.trim();
                if (!contextText) continue;
                const match = contextText.match(/(\d+)\s*(?:\/\s*(\d+))?/);
                if (!match) continue;
                const used = Number(match[1]);
                if (match[2] !== undefined) {
                    if (used >= Number(match[2])) return true;
                } else if (used >= config.constants.maxQueueSize) {
                    return true;
                }
            }
            return false;
        }

        composeAssetFilename(assetObj) {
            const defaultExtension = assetObj.type === 'video' ? '.mp4' : '.png';
            let stem = assetObj.type ? String(assetObj.type) : 'asset';
            try {
                const parsed = new URL(assetObj.src, location.href);
                const segments = parsed.pathname.split('/').filter(Boolean);
                if (segments.length) {
                    const rawStem = segments[segments.length - 1].replace(/\.[^.]+$/, '');
                    if (rawStem) stem = rawStem;
                }
                const extensionMatch = parsed.pathname.match(/\.(jpe?g|png|webp|gif|mp4|webm|mov)$/i);
                const extension = extensionMatch ? extensionMatch[0].toLowerCase() : defaultExtension;
                stem = stem.replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 48) || 'asset';
                return `hailuo-${stem}-${Date.now()}${extension}`;
            } catch (e) {
                Logger.debug("Filename derivation rejected; using timestamped generic stem.", e);
                return `hailuo-${stem}-${Date.now()}${defaultExtension}`;
            }
        }

        async downloadAssetViaBlob(assetObj) {
            const filename = this.composeAssetFilename(assetObj);
            try {
                let blobPayload = null;
                if (typeof GM_xmlhttpRequest === 'function') {
                    blobPayload = await new Promise((resolve, reject) => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: assetObj.src,
                            responseType: 'blob',
                            timeout: 60000,
                            onload: (response) => {
                                if (response.status >= 200 && response.status < 300 && response.response instanceof Blob) {
                                    resolve(response.response);
                                } else {
                                    reject(new Error(`GM transport returned HTTP ${response.status}`));
                                }
                            },
                            onerror: () => reject(new Error('GM transport errored (blocked or offline)')),
                            ontimeout: () => reject(new Error('GM transport timed out'))
                        });
                    });
                } else {
                    const response = await fetch(assetObj.src, { mode: 'cors', credentials: 'omit' });
                    if (!response.ok) throw new Error(`Fetch returned HTTP ${response.status}`);
                    blobPayload = await response.blob();
                }
                const objectUrl = URL.createObjectURL(blobPayload);
                const downloadAnchor = document.createElement('a');
                downloadAnchor.href = objectUrl;
                downloadAnchor.download = filename;
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                document.body.removeChild(downloadAnchor);
                setTimeout(() => { URL.revokeObjectURL(objectUrl); }, 30000);
                stateManager.add(assetObj.src);
                this.syncTelemetryDisplay();
                Logger.info(`Bay asset download dispatched via blob pipeline (zero navigation): ${filename}`);
                return true;
            } catch (transportError) {
                Logger.warn('Blob download pipeline rejected; escalating asset to a new window instead (the active session window is never navigated).', { src: assetObj.src, reason: String((transportError && transportError.message) || transportError) });
                window.open(assetObj.src, '_blank', 'noopener');
                return false;
            }
        }

        resolveDownloadControl(card) {
            if (!card) return null;
            const legacyPathBtn = card.querySelector('button svg path[d*="5.24473"]')?.closest('button');
            if (legacyPathBtn) return legacyPathBtn;
            const candidates = Array.from(card.querySelectorAll('button, [role="button"]'));
            const labeledBtn = candidates.find(el => {
                const label = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.dataset.tooltip || ''}`.toLowerCase();
                return label.includes('download');
            });
            if (labeledBtn) return labeledBtn;
            const textBtn = candidates.find(el => (el.textContent || '').trim().toLowerCase() === 'download');
            if (textBtn) return textBtn;
            const classedBtn = candidates.find(el => (el.className || '').toString().toLowerCase().includes('download'));
            return classedBtn || null;
        }

        processAccountTargetPurge(videoCard) {
            if (!runtimeSwitches.purgeAccount) return;
            const targetDeleteBtn = videoCard.getElementsByClassName(config.selectors.deleteButton)?.[0];
            if (targetDeleteBtn) {
                targetDeleteBtn.click();
                setTimeout(() => {
                    const modal = document.querySelector(`.${config.selectors.modalContent}`);
                    if (modal) {
                        const confirmBtn = document.getElementsByClassName(config.selectors.deleteConfirmButton)?.[0];
                        if (confirmBtn) confirmBtn.click();
                    }
                }, document.hidden ? 12000 : 200);
            }
        }

        executeLoopIteration() {
            this.syncTelemetryDisplay();
            this.inspectDocumentTitleState();
            if (runtimeSwitches.autoGen) {
                const targetBtn = this.resolveCreateControl();
                if (targetBtn && !this.safelyFetchQueueMetrics() && !this.isCreateControlDisabled(targetBtn)) {
                    targetBtn.click();
                    Logger.info("Automated queue click transaction triggered successfully.");
                }
            }
            const cardSelectorString = config.selectors.videoCardQueries.join(', ');
            const cards = Array.from(document.querySelectorAll(cardSelectorString));
            let eliminationEventLock = false;
            cards.forEach(card => {
                if (!card || !(card instanceof HTMLElement)) return;
                const textLines = card.innerText ? card.innerText.split("\n").map(l => l.trim()) : ["", ""];
                const patternMatchA = config.violationStrings.some(v => textLines.includes(v));
                const patternMatchB = config.censoredStrings.some(c => textLines.includes(c));
                if (patternMatchA) {
                    if (runtimeSwitches.purgeAccount && !eliminationEventLock && !document.querySelector(`.${config.selectors.modalContent}`)) {
                        this.processAccountTargetPurge(card);
                        eliminationEventLock = true;
                    } else if (runtimeSwitches.hideFail && card.style.display !== "none") {
                        card.style.setProperty('display', 'none', 'important');
                    }
                    return;
                }
                const getAssetIdentifier = (mediaCard) => {
                    const video = mediaCard.querySelector('video');
                    if (video && video.src) return { src: video.src, type: 'video' };
                    const imgNode = mediaCard.querySelector('img');
                    if (imgNode && imgNode.src) return { src: imgNode.src, type: 'image' };
                    if (mediaCard.dataset.cardId || mediaCard.getAttribute('data-card-id')) return { src: `card-id-${mediaCard.dataset.cardId || mediaCard.getAttribute('data-card-id')}`, type: 'unknown' };
                    if (mediaCard.dataset.feedId || mediaCard.getAttribute('data-feed-id')) return { src: `feed-id-${mediaCard.dataset.feedId || mediaCard.getAttribute('data-feed-id')}`, type: 'unknown' };
                    return null;
                };
                if (card.dataset.linkSet === "true") {
                    if (runtimeSwitches.autoGrab) {
                        const assetObj = getAssetIdentifier(card);
                        if (assetObj && assetObj.src && !stateManager.has(assetObj.src)) {
                            const nativeBtn = this.resolveDownloadControl(card);
                            if (nativeBtn) {
                                nativeBtn.click();
                                stateManager.add(assetObj.src);
                            } else if (assetObj.src.startsWith('http')) {
                                this.uiFactory.captureAssetIntoBay(assetObj);
                            } else {
                                Logger.warn("Auto Fetch active but no download control resolved for asset; deferring to next sweep.", assetObj.src);
                            }
                        }
                    }
                    const existingOverlay = card.querySelector(".linkElClass");
                    if (existingOverlay) {
                        existingOverlay.style.display = runtimeSwitches.hoverLinks ? "block" : "none";
                    }
                } else {
                    this.bindIdempotentLinkAnchors(card, patternMatchB, getAssetIdentifier);
                }
            });
        }

        bindIdempotentLinkAnchors(card, isCensored, idExtractionFunction) {
            const assetObj = idExtractionFunction(card);
            if (!assetObj || !assetObj.src) return;
            const targetMountContainer = card.querySelector('.relative.isolate') || card.querySelector('.relative') || card.firstElementChild || card;
            if (!targetMountContainer || card.dataset.linkSet === "true") return;
            card.dataset.linkSet = "true";
            try {
                if (assetObj.type === 'video') {
                    const videoElement = card.querySelector("video");
                    if (videoElement) {
                        const previousMutedState = videoElement.muted;
                        videoElement.muted = true;
                        videoElement.play().then(() => {
                            setTimeout(() => {
                                try { videoElement.pause(); videoElement.muted = previousMutedState; } catch(e) {}
                            }, 1500);
                        }).catch(() => { videoElement.muted = previousMutedState; });
                    }
                }
                if (runtimeSwitches.autoGrab && !stateManager.has(assetObj.src)) {
                    const directDownloadBtn = this.resolveDownloadControl(card);
                    if (directDownloadBtn) {
                        directDownloadBtn.click();
                        stateManager.add(assetObj.src);
                    } else if (assetObj.src.startsWith('http')) {
                        this.uiFactory.captureAssetIntoBay(assetObj);
                    }
                }
                const interactiveSpan = document.createElement("span");
                interactiveSpan.classList.add("linkElClass");
                interactiveSpan.style.display = runtimeSwitches.hoverLinks ? "block" : "none";
                const customAnchor = document.createElement("a");
                customAnchor.innerText = "LINK";
                customAnchor.href = assetObj.src.startsWith('http') ? assetObj.src : '#';
                interactiveSpan.appendChild(customAnchor);
                targetMountContainer.appendChild(interactiveSpan);
                interactiveSpan.addEventListener("click", (e) => {
                    e.preventDefault();
                    if (assetObj.src.startsWith('http')) {
                        window.open(assetObj.src, "_blank");
                    } else {
                        Logger.warn("Target asset source link does not resolve to an HTTP location context.");
                    }
                });
                interactiveSpan.addEventListener("mouseenter", () => {
                    if (runtimeSwitches.hoverLinks && assetObj.src.startsWith('http')) {
                        let floatingCachePreview;
                        if (assetObj.type === 'video') {
                            floatingCachePreview = document.createElement("video");
                            floatingCachePreview.classList.add("videoPreviewElClass");
                            floatingCachePreview.autoplay = true;
                            floatingCachePreview.muted = true;
                            floatingCachePreview.loop = true;
                            floatingCachePreview.src = assetObj.src;
                        } else {
                            floatingCachePreview = document.createElement("img");
                            floatingCachePreview.classList.add("imagePreviewElClass");
                            floatingCachePreview.src = assetObj.src;
                        }
                        interactiveSpan.appendChild(floatingCachePreview);
                    }
                });
                interactiveSpan.addEventListener("mouseleave", () => {
                    const floatingCachePreview = interactiveSpan.querySelector(".videoPreviewElClass, .imagePreviewElClass");
                    if (floatingCachePreview) floatingCachePreview.remove();
                });
            } catch (err) {
                Logger.error("Error encountered inside target anchor verification compiler pipeline.", err);
                card.dataset.linkSet = "false";
            }
        }
    }

    const applicationAgent = new AutomationOrchestrator();
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(() => { applicationAgent.bootstrap(); }, 1500);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => { applicationAgent.bootstrap(); }, 1500);
        });
    }
})();
