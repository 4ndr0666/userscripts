// ==UserScript==
// @name         4ndr0tools - Hailuo++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      5.0.0
// @author       4ndr0666
// @description  Enterprise-grade, idempotent automation engine for HailuoAI featuring image/video processing, advanced mutation defense, comprehensive telemetry, prompt queuing, Spintax, and bulk operations.
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        https://hailuoai.com/video
// @match        https://hailuoai.video/*
// @match        https://hailuoai.video/create*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        GM_getValue
// @grant        GM_setValue
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Hailuo++.user.js
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

    class EngineConfiguration {
        constructor() {
            this.selectors = {
                navBarClass: "origin-right",
                videoCardQueries: [
                    ".grid-video-card",
                    ".media-card-wrapper",
                    "div[data-card-id]",
                    "div[data-feed-id]"
                ],
                createButton: "pink-gradient-btn",
                deleteButton: "absolute right-[10px] top-3 z-[4] cursor-pointer",
                deleteConfirmButton: "ant-btn-color-primary",
                modalContent: "ant-modal-content",
                queueText: "relative h-full w-full content-center text-center text-[13px] font-medium",
                promptTextarea: '[data-slate-editor="true"], #video-create-textarea, textarea',
                submitBtn: '.min-w-\\[110px\\] button, button:last-of-type',
                uploadInput: '.create-bar-main input[type="file"], .ant-upload input[type="file"], input[type="file"]',
                uploadedImage: 'img[alt="uploaded image"]',
                progressBars: '[role="progressbar"]'
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
                "Generation failed because content violated Community Guidelines."
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
        }

        init(orchestratorInstance) {
            if (document.getElementById('andr0666-ui-root')) {
                Logger.warn("UI Root initialization intercepted: component already rendered.");
                return;
            }
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
                    <div style="font-size: 0.6rem; color: var(--accent-cyan); font-weight: bold;">v4.4.0-Ψ</div>
                </div>
                <div class="telemetry-row">
                    <span>TRACKED ARCHIVE SIZE:</span>
                    <span id="telemetry-tracker">0 ASSETS</span>
                </div>
                <div class="action-matrix">
                    <div class="mechanical-switch" id="sw-gen" data-tooltip="Monitors the generation queue slots. Automatically pushes the primary creation click triggers whenever free space opens up."><span>Auto Queue Click</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-dl" data-tooltip="Scans completed video cards and directly hooks site asset downloader download pipelines. Cross-checks track storage states to preserve bandwidth."><span>Auto Fetch Asset</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-notif" data-tooltip="Issues system-level alerts when generation tracking markers cross 90% parameters on inactive browser configurations."><span>Notify Completion</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-del" data-tooltip="Hard-deletes generation instances that have triggered site guidelines or structural processing anomalies instantly via native API simulation vectors."><span>API Hard Purge</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-dom" data-tooltip="Masks failed cards from your layout locally without throwing trace signals, preserving screen estate context."><span>Mask Fail Cards</span><div class="switch-indicator"></div></div>
                    <div class="mechanical-switch" id="sw-notif-hov" data-tooltip="Injects non-destructive asset address anchor triggers onto processing matrix modules. Hovering handles automatic floating video view cache playback."><span>Interactive Links</span><div class="switch-indicator"></div></div>
                    <button class="sys-btn help-btn" id="sys-help">Usage Guide (--help)</button>
                    <button class="sys-btn" id="sys-clear">Purge Database Cache</button>
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
                            Idempotently scans completed video nodes to click downloads, routing raw download anchors if local triggers are blocked.
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
        }

        bindDragMechanics() {
            const container = this.hudContainer;
            const handle = this.shadow.getElementById('hud-drag-handle');
            let active = false;
            let startX = 0, startY = 0;
            let initialX = 0, initialY = 0;
            const storedLeft = localStorage.getItem('4ndr0_pro_hud_left');
            const storedTop = localStorage.getItem('4ndr0_pro_hud_top');
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
                    localStorage.setItem('4ndr0_pro_hud_left', container.style.left);
                    localStorage.setItem('4ndr0_pro_hud_top', container.style.top);
                    document.removeEventListener('mousemove', dragHUD);
                    document.removeEventListener('mouseup', dropHUD);
                }
            };
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
            Logger.info("Bootstrapping core orchestration parameters.");
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
            this.observer = new MutationObserver((mutations) => {
                let dynamicTriggerNeeded = false;
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        dynamicTriggerNeeded = true;
                        break;
                    }
                }
                if (dynamicTriggerNeeded) {
                    this.executeLoopIteration();
                }
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
            const progressNodes = Array.from(document.querySelectorAll(".ant-progress-text"));
            if (!progressNodes.length) {
                document.title = "Ready";
                return;
            }
            const activePercentages = progressNodes.map(node => {
                const check = node.innerText?.match(/(\d+)/);
                return check ? Number(check[1]) : 0;
            }).filter(num => !isNaN(num));
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

        safelyFetchQueueMetrics() {
            const el = document.getElementsByClassName(config.selectors.queueText)?.[0];
            if (!el) return false;
            const contextText = el.textContent?.trim();
            return contextText === `${config.constants.maxQueueSize}` || contextText === '6';
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
                const targetBtn = document.querySelector(`.${config.selectors.createButton}`);
                if (targetBtn && !this.safelyFetchQueueMetrics() && !targetBtn.parentElement?.classList.contains('opacity-60')) {
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
                const patternMatchA = config.violationStrings.includes(textLines[0]) || config.violationStrings.includes(textLines[1]);
                const patternMatchB = config.censoredStrings.includes(textLines[0]) || config.censoredStrings.includes(textLines[1]);
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
                            const nativeBtn = card.querySelector('button svg path[d*="5.24473"]')?.closest('button');
                            if (nativeBtn) {
                                nativeBtn.click();
                                stateManager.add(assetObj.src);
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
                        videoElement.play().then(() => {
                            setTimeout(() => { try { videoElement.pause(); } catch(e) {} }, 1500);
                        }).catch(() => {});
                    }
                }
                if (runtimeSwitches.autoGrab && !stateManager.has(assetObj.src)) {
                    const directDownloadBtn = card.querySelector('button svg path[d*="5.24473"]')?.closest('button');
                    if (directDownloadBtn) {
                        directDownloadBtn.click();
                        stateManager.add(assetObj.src);
                    } else if (assetObj.src.startsWith('http')) {
                        const fallbackAnchor = document.createElement('a');
                        fallbackAnchor.href = assetObj.src;
                        fallbackAnchor.download = `${assetObj.type}-${Date.now()}` + (assetObj.type === 'image' ? '.png' : '.mp4');
                        document.body.appendChild(fallbackAnchor);
                        fallbackAnchor.click();
                        document.body.removeChild(fallbackAnchor);
                        stateManager.add(assetObj.src);
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
