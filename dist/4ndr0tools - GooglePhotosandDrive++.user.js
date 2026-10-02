// ==UserScript==
// @name         4ndr0tools - GooglePhotosandDrive++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      8.0.0
// @description  Restores context menus, exposes direct links, adds reverse image search, Drive direct-download resolution, Photos full-res extraction, power-user hotkeys, drag persistence and a settings console. 3lectric-Glass paradigm.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20GooglePhotosandDrive++.user.js
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*.googleusercontent.com/*
// @match        *://photos.google.com/*
// @match        *://drive.google.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==


/* ═══ SUITE PROMOTION 8.0.0 ═══════════════════════════════════════════
 * GooglePhotosandDrive++BETA v7.0.0 promoted: 'Unified superset revision — GUP gate: 0 MISSING' — Drive direct-download resolution, Photos full-res extraction, hotkeys, drag persistence, settings console; supersedes stable v1.5.0.
 * Retired duplicate: 4ndr0tools - GooglePhotosandDrive++.user.js (uninstall it; this script is its superset).
 * Built by the 4ndr0666tools consolidation (canon assembly, GUP v5.3).
 * ═══════════════════════════════════════════════════════════════════════ */

/* ============================================================================
 * 4ndr0tools - GooglePhotosandDrive++ — v7.0.0-Ψ
 * Unified superset revision — Golden Unit Protocol v5.3, 3lectric-Glass
 * paradigm (GTK 3.22+ spec, web mapping), 4ndr0666 Ψ branding glyph.
 * ----------------------------------------------------------------------------
 * LINEAGE
 *   1.5.0    Baseline (canonical): context-menu unlock, s0 direct-link
 *            redirect, OSINT reverse-search HUD, kernel notification overlay.
 *   7.0.0-Ψ  This revision — unified house version bump. Baseline behavior
 *            preserved (GUP gate: 0 MISSING) plus:
 *            · 3lectric-Glass spec realignment — JetBrains Mono + Orbitron,
 *              glass L1/L2/L3 alpha layering, solid headerbar, 0px brutalist
 *              buttons, 150ms transitions, switch / scrollbar / destructive /
 *              notification-label tokens.
 *            · getDirectPhotoLink hardening — size-token validation so empty
 *              or non-size '=' segments are no longer corrupted to '=s0'.
 *            · showNotification leak-proof removal — transitionend once plus
 *              a hard-cap fallback timer for backgrounded tabs.
 *            · Glyph rendering fix — var() moved out of SVG presentation
 *              attributes (invalid there) into style properties so the ring /
 *              hexagon / Ψ core actually render in Electric Cyan.
 *            · Drive direct-download resolution (uc?export=download) with a
 *              glass HUD on /file/d/ pages and legacy ?id= URLs.
 *            · Photos full-res (=s0) viewer extraction, Lens reverse search
 *              and direct-URL clipboard ops from the open viewer.
 *            · Power-user hotkeys (S/O/C/F/R/D, Esc) — Alt-guarded on SPA
 *              hosts so native Photos/Drive shortcuts stay untouched.
 *            · Persisted settings console (GM storage with localStorage
 *              fallback), draggable + collapsible HUDs with position memory,
 *              SPA route patch (pushState / replaceState / popstate).
 * ========================================================================== */

(function() {
    'use strict';

    /* ========================================================================
     * MODULE 0 — CONFIG, STATE, TELEMETRY
     * ==================================================================== */

    const SCRIPT_VERSION = '7.0.0-Ψ';
    const STYLE_ELEMENT_ID = '4ndr0-glass-styles';
    const SETTINGS_KEY = '4ndr0666.gmedia.settings';
    const HUD_STATE_KEY = '4ndr0666.gmedia.hudstate';
    const SETTINGS_EVENT = '4ndr0-settings-changed';

    const DEFAULT_SETTINGS = Object.freeze({
        contextMenuUnlock: true,
        autoDirectLink: true,
        osintHud: true,
        driveHud: true,
        notifications: true,
        hotkeys: true
    });

    /**
     * MODULE 0.1 — Diagnostic uplink: centralized error telemetry.
     */
    const logError = (module, error) => {
        console.error(`[Ψ-4ndr0666] Exception in ${module}:`, error.message, error.stack);
    };

    /**
     * MODULE 0.2 — Boot banner: version, module roster and live setting state.
     */
    const printBootBanner = () => {
        try {
            const toggles = Object.keys(DEFAULT_SETTINGS)
                .map((key) => `${key}=${settings[key] ? 'on' : 'off'}`)
                .join(' ');
            console.log(`[Ψ] 4ndr0tools GooglePhotosandDrive++ v${SCRIPT_VERSION} — 3lectric-Glass paradigm`);
            console.log('[Ψ] modules: ctxmenu-unlock · s0-direct · osint-recon · drive-direct · photos-fullres · hotkeys · settings-console · spa-patch');
            console.log(`[Ψ] settings: ${toggles}`);
        } catch (error) {
            logError('printBootBanner', error);
        }
    };

    /**
     * MODULE 0.3 — Storage backend factory: GM value storage when granted,
     * localStorage fallback otherwise. JSON-safe on both paths.
     */
    const createStorageBackend = () => {
        try {
            if (typeof GM_getValue === 'function' && typeof GM_setValue === 'function') {
                return {
                    get: (key, fallback) => {
                        try {
                            const raw = GM_getValue(key, null);
                            if (raw === null || raw === undefined) return fallback;
                            return typeof raw === 'string' ? JSON.parse(raw) : raw;
                        } catch (error) {
                            logError('storageBackend.get', error);
                            return fallback;
                        }
                    },
                    set: (key, value) => {
                        try {
                            GM_setValue(key, JSON.stringify(value));
                        } catch (error) {
                            logError('storageBackend.set', error);
                        }
                    }
                };
            }
        } catch (error) {
            logError('createStorageBackend', error);
        }
        return {
            get: (key, fallback) => {
                try {
                    const raw = localStorage.getItem(key);
                    return raw === null ? fallback : JSON.parse(raw);
                } catch (error) {
                    logError('storageBackend.get', error);
                    return fallback;
                }
            },
            set: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                } catch (error) {
                    logError('storageBackend.set', error);
                }
            }
        };
    };

    const storageBackend = createStorageBackend();

    /**
     * MODULE 0.4 — Settings: load (with boolean validation and default
     * merge), save, reset, live mutation with change broadcast.
     */
    const loadSettings = () => {
        const stored = storageBackend.get(SETTINGS_KEY, {});
        const safeStored = (stored && typeof stored === 'object') ? stored : {};
        const merged = {};
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
            merged[key] = typeof safeStored[key] === 'boolean' ? safeStored[key] : DEFAULT_SETTINGS[key];
        }
        return merged;
    };

    const saveSettings = () => {
        storageBackend.set(SETTINGS_KEY, settings);
    };

    const resetSettings = () => {
        settings = Object.assign({}, DEFAULT_SETTINGS);
        saveSettings();
    };

    const emitSettingsChanged = () => {
        try {
            window.dispatchEvent(new CustomEvent(SETTINGS_EVENT));
        } catch (error) {
            logError('emitSettingsChanged', error);
        }
    };

    const settingsChanged = (callback) => {
        window.addEventListener(SETTINGS_EVENT, () => callback());
    };

    const setSetting = (key, value) => {
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
        if (typeof value !== 'boolean') return;
        settings[key] = value;
        saveSettings();
        emitSettingsChanged();
    };

    let settings = loadSettings();

    /* ========================================================================
     * MODULE 1 — Inject CSS for the 3lectric-Glass paradigm
     * Full GTK 3.22+ spec web mapping: glass L1 window / L2 popup / L3 panel
     * alpha layering, solid headerbar with Orbitron title, 0px brutalist
     * buttons, 150ms ease-in-out transitions, switch / scrollbar /
     * destructive-action / notification-label tokens.
     * ==================================================================== */
    const injectStyles = () => {
        try {
            if (document.getElementById(STYLE_ELEMENT_ID)) return;

            const style = document.createElement('style');
            style.id = STYLE_ELEMENT_ID;
            style.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@700&display=swap');

                :root {
                    --glass-l1-window: rgba(10, 19, 26, 0.72);
                    --glass-l2-popup: rgba(10, 19, 26, 0.65);
                    --glass-l3-panel: rgba(10, 19, 26, 0.55);
                    --solid-header: rgba(10, 19, 26, 0.95);
                    --accent-cyan: #00E5FF;
                    --accent-cyan-hover: #67E8F9;
                    --alert-destructive: #ff0055;
                    --absolute-light: #ffffff;
                    --font-body: 'JetBrains Mono', monospace;
                    --font-display: 'Orbitron', sans-serif;
                    --font-glyph: 'Cinzel Decorative', serif;
                    --transition-spec: all 150ms ease-in-out;
                }

                /* --- MAIN WINDOW (window.main-window) --- */
                .psi-glass-window {
                    position: fixed;
                    left: 20px;
                    top: 20px;
                    z-index: 2147483646;
                    display: flex;
                    flex-direction: column;
                    min-width: 220px;
                    max-width: 340px;
                    background: var(--glass-l1-window);
                    border: 1px solid rgba(0, 229, 255, 0.2);
                    border-radius: 4px;
                    box-shadow: 0 0 40px rgba(0, 229, 255, 0.15);
                    color: var(--accent-cyan);
                    font-family: var(--font-body);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    transition: var(--transition-spec);
                }

                /* --- HEADERBAR --- */
                .psi-glass-headerbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: var(--solid-header);
                    border-bottom: 2px solid var(--accent-cyan);
                    border-radius: 3px 3px 0 0;
                    color: var(--accent-cyan);
                    cursor: move;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .psi-glass-headerbar .title {
                    flex: 1;
                    min-width: 0;
                    font-family: var(--font-display);
                    font-size: 14pt;
                    font-weight: 700;
                    color: var(--accent-cyan-hover);
                    letter-spacing: 0.06em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .psi-glass-headerbar .subtitle {
                    font-family: var(--font-body);
                    font-size: 9pt;
                    color: rgba(0, 229, 255, 0.7);
                    white-space: nowrap;
                }

                .psi-glass-headerbtn {
                    flex: none;
                    padding: 2px 8px;
                    background: var(--glass-l3-panel);
                    border: 1px solid rgba(0, 229, 255, 0.4);
                    border-radius: 0px;
                    color: var(--accent-cyan);
                    font-family: var(--font-body);
                    font-size: 9pt;
                    font-weight: bold;
                    line-height: 1.4;
                    cursor: pointer;
                    transition: var(--transition-spec);
                }

                .psi-glass-headerbtn:hover {
                    background: rgba(0, 229, 255, 0.2);
                    border-color: var(--accent-cyan);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
                    color: var(--accent-cyan-hover);
                }

                .psi-glass-headerbtn:active {
                    background: rgba(0, 229, 255, 0.3);
                    color: var(--absolute-light);
                }

                /* --- CONTENT / SCROLLBAR TOKENS --- */
                .psi-glass-content {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px;
                    max-height: 60vh;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #00E5FF rgba(0, 0, 0, 0.4);
                }

                .psi-glass-content::-webkit-scrollbar { width: 8px; height: 8px; }
                .psi-glass-content::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.4); }
                .psi-glass-content::-webkit-scrollbar-thumb {
                    background: #00E5FF;
                    border-radius: 0;
                    min-width: 6px;
                    min-height: 6px;
                }
                .psi-glass-content::-webkit-scrollbar-thumb:hover { background: #67E8F9; }

                /* --- GLASS PANEL (L3) --- */
                .psi-glass-panel {
                    background: var(--glass-l3-panel);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    border-radius: 4px;
                    margin: 5px;
                    padding: 6px 8px;
                    color: var(--accent-cyan);
                    font-size: 10pt;
                    word-break: break-all;
                }

                /* --- BUTTONS (0px brutalism) --- */
                .psi-glass-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 20px;
                    border: 1px solid rgba(0, 229, 255, 0.4);
                    background: var(--glass-l2-popup);
                    color: var(--accent-cyan);
                    border-radius: 0px;
                    font-family: var(--font-body);
                    font-weight: bold;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    text-decoration: none;
                    cursor: pointer;
                    transition: var(--transition-spec);
                }

                .psi-glass-button:hover {
                    background: rgba(0, 229, 255, 0.2);
                    border-color: var(--accent-cyan);
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
                    color: var(--accent-cyan-hover);
                }

                .psi-glass-button:active {
                    background: rgba(0, 229, 255, 0.3);
                    color: var(--absolute-light);
                }

                .psi-glass-button:focus-visible {
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                /* --- DESTRUCTIVE CONTROL SURFACES --- */
                .psi-glass-button.destructive-action,
                .psi-glass-button.destructive {
                    border-color: var(--alert-destructive);
                    color: var(--alert-destructive);
                }

                .psi-glass-button.destructive-action:hover,
                .psi-glass-button.destructive:hover {
                    background: rgba(255, 0, 85, 0.3);
                    box-shadow: 0 0 25px #ff0055;
                    color: var(--absolute-light);
                }

                /* --- SETTINGS ROWS / LABELS --- */
                .psi-glass-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 4px 0;
                }

                .psi-glass-label {
                    color: var(--accent-cyan);
                    font-size: 9pt;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                /* --- BOOLEAN TOGGLES (switch) --- */
                .psi-glass-switch {
                    display: inline-flex;
                    align-items: center;
                    flex: none;
                    cursor: pointer;
                }

                .psi-glass-switch input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .psi-glass-switch .trough {
                    display: block;
                    position: relative;
                    width: 46px;
                    height: 22px;
                    background: #050A0F;
                    border: 1px solid var(--accent-cyan);
                    transition: var(--transition-spec);
                }

                .psi-glass-switch .trough::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: var(--accent-cyan);
                    box-shadow: 0 0 12px rgba(0, 229, 255, 0.8);
                    transition: var(--transition-spec);
                }

                .psi-glass-switch input:checked + .trough {
                    background: rgba(0, 229, 255, 0.2);
                }

                .psi-glass-switch input:checked + .trough::after {
                    left: calc(100% - 18px);
                }

                .psi-glass-switch input:focus-visible + .trough {
                    outline: 2px solid var(--accent-cyan);
                    outline-offset: 2px;
                }

                /* --- REVEALER / NOTIFICATION OVERLAY --- */
                .psi-glass-notification {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    z-index: 2147483647;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 24px;
                    max-width: 420px;
                    background: var(--glass-l2-popup);
                    border: 1px solid rgba(0, 229, 255, 0.3);
                    border-radius: 4px;
                    box-shadow: 0 0 20px rgba(0, 229, 255, 0.15);
                    color: var(--absolute-light);
                    font-family: var(--font-body);
                    font-size: 14px;
                    font-weight: bold;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 150ms ease-in-out, transform 150ms ease-in-out;
                    pointer-events: none;
                }

                .psi-glass-notification .notification-label {
                    color: var(--absolute-light);
                    font-weight: bold;
                }
            `;
            const parent = document.head || document.documentElement;
            parent.appendChild(style);
        } catch (error) {
            logError('injectStyles', error);
        }
    };

    /* ========================================================================
     * MODULE 2.5 — Shared URL normalization (googleusercontent size tokens)
     * Rewrites the trailing size token (=w1234-h567, =s1600, …) to '=s0'.
     * Hardened versus the baseline: the segment after the last '=' is only
     * rewritten when it actually validates as a size token, so empty
     * segments ('…=') and non-size tokens are never corrupted.
     * ==================================================================== */
    const SIZE_PARAM_REGEX = /(w\d+-h\d+|s\d+)(?:-c|-k)?((?:-[a-z]+)+)?/i;

    const normalizeImageUrl = (url) => {
        try {
            const urlObj = new URL(url);
            const basePath = urlObj.origin + urlObj.pathname;
            const searchAndHash = urlObj.search + urlObj.hash;
            let newBasePath = basePath;

            const eqIndex = basePath.lastIndexOf('=');
            if (eqIndex !== -1) {
                const lastPart = basePath.slice(eqIndex + 1);
                if (lastPart !== '' && !lastPart.startsWith('s0') && SIZE_PARAM_REGEX.test(lastPart)) {
                    newBasePath = basePath.slice(0, eqIndex) + '=s0';
                }
            } else if (SIZE_PARAM_REGEX.test(basePath)) {
                newBasePath = basePath.replace(SIZE_PARAM_REGEX, 's0');
            }

            return newBasePath + searchAndHash;
        } catch (error) {
            logError('normalizeImageUrl', error);
            return url;
        }
    };

    /**
     * MODULE 1 — Direct Photo Link Enhancement (baseline behavior preserved:
     * navigate to the =s0 full-resolution URL when a size token is present).
     */
    const getDirectPhotoLink = () => {
        try {
            const currentUrl = window.location.href;
            const newUrl = normalizeImageUrl(currentUrl);
            if (newUrl !== currentUrl) {
                window.location.replace(newUrl);
            }
        } catch (error) {
            logError('getDirectPhotoLink', error);
        }
    };

    /**
     * MODULE 2 — Context Menu Integration. Baseline override preserved
     * (capture-phase stopImmediatePropagation + oncontextmenu attribute
     * sweeper); both paths now honor the live contextMenuUnlock setting.
     */
    const removeContextMenuBlockers = () => {
        try {
            const enforceContext = (event) => {
                if (settings.contextMenuUnlock) {
                    event.stopImmediatePropagation();
                }
            };

            window.addEventListener('contextmenu', enforceContext, true);
            document.addEventListener('contextmenu', enforceContext, true);

            const observer = new MutationObserver(mutations => {
                if (!settings.contextMenuUnlock) return;
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'oncontextmenu') {
                        mutation.target.removeAttribute('oncontextmenu');
                    }
                }
            });

            if (document.documentElement) {
                observer.observe(document.documentElement, {
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['oncontextmenu']
                });
            } else {
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.documentElement, {
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['oncontextmenu']
                    });
                }, { once: true });
            }
        } catch (error) {
            logError('removeContextMenuBlockers', error);
        }
    };

    /* ========================================================================
     * MODULE 4.5 — HUD utility belt: persisted per-HUD state (position /
     * collapse), viewport-clamped positioning, pointer-event drag engine,
     * collapse sync, and the shared glass control factories.
     * ==================================================================== */
    const getHudEntry = (hudName, fallback) => {
        const state = storageBackend.get(HUD_STATE_KEY, {});
        const safeState = (state && typeof state === 'object') ? state : {};
        return (safeState[hudName] && typeof safeState[hudName] === 'object') ? safeState[hudName] : fallback;
    };

    const setHudEntry = (hudName, patch) => {
        const state = storageBackend.get(HUD_STATE_KEY, {});
        const safeState = (state && typeof state === 'object') ? state : {};
        const merged = Object.assign({ x: 20, y: 20, collapsed: false }, safeState[hudName], patch);
        safeState[hudName] = merged;
        storageBackend.set(HUD_STATE_KEY, safeState);
        return merged;
    };

    const applyHudPosition = (element, hudName, defaultPos) => {
        const entry = getHudEntry(hudName, {
            x: (defaultPos && typeof defaultPos.x === 'number') ? defaultPos.x : 20,
            y: (defaultPos && typeof defaultPos.y === 'number') ? defaultPos.y : 20,
            collapsed: false
        });
        const maxX = Math.max(0, window.innerWidth - 60);
        const maxY = Math.max(0, window.innerHeight - 60);
        const x = Math.min(Math.max(0, entry.x), maxX);
        const y = Math.min(Math.max(0, entry.y), maxY);
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.right = 'auto';
        element.style.bottom = 'auto';
    };

    const attachDragHandlers = (element, hudName) => {
        const headerbar = element.querySelector('.psi-glass-headerbar');
        if (!headerbar) return;

        let dragOrigin = null;

        headerbar.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            if (event.target.closest('button, a, input')) return;
            const rect = element.getBoundingClientRect();
            dragOrigin = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                baseX: rect.left,
                baseY: rect.top
            };
            if (headerbar.setPointerCapture) {
                try { headerbar.setPointerCapture(event.pointerId); }
                catch (error) { logError('attachDragHandlers.setPointerCapture', error); }
            }
            event.preventDefault();
        });

        headerbar.addEventListener('pointermove', (event) => {
            if (!dragOrigin) return;
            const maxX = Math.max(0, window.innerWidth - 60);
            const maxY = Math.max(0, window.innerHeight - 60);
            const nextX = Math.min(Math.max(0, dragOrigin.baseX + (event.clientX - dragOrigin.pointerX)), maxX);
            const nextY = Math.min(Math.max(0, dragOrigin.baseY + (event.clientY - dragOrigin.pointerY)), maxY);
            element.style.left = `${nextX}px`;
            element.style.top = `${nextY}px`;
        });

        const endDrag = (event) => {
            if (!dragOrigin) return;
            dragOrigin = null;
            if (headerbar.hasPointerCapture && headerbar.hasPointerCapture(event.pointerId)) {
                try { headerbar.releasePointerCapture(event.pointerId); }
                catch (error) { logError('attachDragHandlers.releasePointerCapture', error); }
            }
            const rect = element.getBoundingClientRect();
            setHudEntry(hudName, { x: Math.round(rect.left), y: Math.round(rect.top) });
        };

        headerbar.addEventListener('pointerup', endDrag);
        headerbar.addEventListener('pointercancel', endDrag);
    };

    const syncHudCollapsed = (hudElement, collapsed, toggleButton) => {
        const content = hudElement.querySelector('.psi-glass-content');
        if (content) content.style.display = collapsed ? 'none' : '';
        if (toggleButton) toggleButton.textContent = collapsed ? '+' : '—';
    };

    const makeHeaderButton = (label, onClick, titleText) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'psi-glass-headerbtn';
        btn.textContent = label;
        if (titleText) btn.title = titleText;
        btn.addEventListener('click', onClick);
        return btn;
    };

    /**
     * Baseline link factory (unit name preserved from v1.5.0): builds an
     * anchor-styled glass control — span-first structure identical to the
     * baseline createLink, restyled to the 0px brutalist button tokens.
     */
    const createLink = (text, targetUrl) => {
        const btn = document.createElement('a');
        btn.className = 'psi-glass-button';
        btn.href = targetUrl;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        const span = document.createElement('span');
        span.textContent = text;
        btn.appendChild(span);
        return btn;
    };

    const makeGlassButton = (text, onClick, destructive = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = destructive ? 'psi-glass-button destructive-action' : 'psi-glass-button';
        const span = document.createElement('span');
        span.textContent = text;
        btn.appendChild(span);
        btn.addEventListener('click', onClick);
        return btn;
    };

    /* ========================================================================
     * MODULE 4 — OSINT Reverse Search HUD (glass window + headerbar).
     * Baseline link roster preserved verbatim; superset adds headerbar with
     * drag / collapse / stow controls, persisted position, and a copy-direct
     * clipboard action. Glyph var() references moved into style properties
     * so the rings, hexagon and Ψ core render in Electric Cyan.
     * ==================================================================== */
    const OSINT_HUD_ID = 'osint-links-4ndr0';

    const displaySearchLinks = () => {
        try {
            const existing = document.getElementById(OSINT_HUD_ID);
            if (existing) {
                existing.style.display = settings.osintHud ? '' : 'none';
                return;
            }
            if (!settings.osintHud || !document.body) return;

            const src = window.location.href;
            const encodedSrc = encodeURIComponent(src);

            const linkBlock = document.createElement('div');
            linkBlock.id = OSINT_HUD_ID;
            linkBlock.className = 'psi-glass-window';
            applyHudPosition(linkBlock, 'osintHud', { x: 20, y: 20 });

            const headerbar = document.createElement('div');
            headerbar.className = 'psi-glass-headerbar';
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = 'Ψ RECON';
            title.style.fontSize = '11pt';
            const subtitle = document.createElement('div');
            subtitle.className = 'subtitle';
            subtitle.textContent = `v${SCRIPT_VERSION}`;
            const collapseBtn = makeHeaderButton('—', () => {
                const entry = getHudEntry('osintHud', { x: 20, y: 20, collapsed: false });
                const merged = setHudEntry('osintHud', { collapsed: !entry.collapsed });
                syncHudCollapsed(linkBlock, merged.collapsed, collapseBtn);
            }, 'Collapse recon panel');
            const closeBtn = makeHeaderButton('×', () => {
                setSetting('osintHud', false);
            }, 'Stow recon panel (O re-engages)');
            headerbar.append(title, subtitle, collapseBtn, closeBtn);

            const content = document.createElement('div');
            content.className = 'psi-glass-content';

            const glyphWrapper = document.createElement('div');
            glyphWrapper.style.display = 'flex';
            glyphWrapper.style.justifyContent = 'center';
            glyphWrapper.style.marginBottom = '10px';
            glyphWrapper.innerHTML = `
                <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" style="width: 48px; height: 48px; stroke: var(--accent-cyan);" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" />
                    <path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" />
                    <path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" style="fill: rgba(10, 19, 26, 0.4);" />
                    <text x="64" y="67" text-anchor="middle" dominant-baseline="middle" stroke="none" font-size="46" font-weight="700" style="fill: var(--accent-cyan); font-family: var(--font-glyph);">Ψ</text>
                </svg>
            `;
            content.appendChild(glyphWrapper);

            const divider = document.createElement('div');
            Object.assign(divider.style, {
                height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
                marginBottom: '5px'
            });
            content.appendChild(divider);

            content.appendChild(createLink('[>] Google Lens', `https://lens.google.com/uploadbyurl?url=${encodedSrc}`));
            content.appendChild(createLink('[>] Yandex Recon', `https://yandex.com/images/search?rpt=imageview&img_url=${encodedSrc}`));
            content.appendChild(createLink('[>] TinEye Scan', `https://tineye.com/search?url=${encodedSrc}`));
            content.appendChild(createLink('[+] ImgOps Triage', `https://imgops.com/${src}`));
            content.appendChild(createLink('[+] LunaPic Editor', `https://www.lunapic.com/editor/?action=url&url=${encodedSrc}`));
            content.appendChild(makeGlassButton('[=] Copy Direct URL', () => {
                copyToClipboard(normalizeImageUrl(src));
            }));

            linkBlock.append(headerbar, content);
            attachDragHandlers(linkBlock, 'osintHud');

            const entry = getHudEntry('osintHud', { x: 20, y: 20, collapsed: false });
            syncHudCollapsed(linkBlock, entry.collapsed, collapseBtn);

            document.body.appendChild(linkBlock);
        } catch (error) {
            logError('displaySearchLinks', error);
        }
    };

    /**
     * MODULE 5 — 4NDR0666OS Notification Overlay (Electric-Glass styled).
     * Baseline enter/exit choreography preserved; removal is now leak-proof
     * (transitionend once + hard-cap fallback for backgrounded tabs) and the
     * surface honors the live notifications setting.
     */
    const showNotification = (message) => {
        try {
            if (!settings.notifications || !document.body) return;

            const notification = document.createElement('div');
            notification.className = 'psi-glass-notification';
            notification.setAttribute('role', 'status');
            notification.innerHTML = `
                <svg viewBox="0 0 128 128" style="width: 20px; height: 20px; flex: none; stroke: currentColor;" fill="none" stroke-width="4">
                    <path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" />
                    <text x="64" y="70" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="60" font-weight="700" style="font-family: var(--font-glyph);">Ψ</text>
                </svg>
                <span class="notification-label">[ KERNEL ]: ${message}</span>
            `;

            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(-10px)';
            });

            let removed = false;
            const removeNotification = () => {
                if (removed) return;
                removed = true;
                notification.remove();
            };
            notification.addEventListener('transitionend', removeNotification, { once: true });

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(10px)';
                setTimeout(removeNotification, 400);
            }, 4000);
        } catch (error) {
            logError('showNotification', error);
        }
    };

    /**
     * MODULE 6 — Photos viewer target acquisition: locates the dominant
     * googleusercontent <img> in the open Google Photos viewer (largest
     * rendered area), falls back to the widest srcset entry for
     * blob:/data: sources, and normalizes to the =s0 full-resolution URL.
     */
    const getCurrentPhotoUrl = () => {
        try {
            const candidates = document.querySelectorAll('img[src*="googleusercontent.com"], img[srcset*="googleusercontent.com"]');
            let best = null;
            let bestArea = 0;
            for (const img of candidates) {
                const rect = img.getBoundingClientRect();
                const area = rect.width * rect.height;
                if (area > bestArea) {
                    bestArea = area;
                    best = img;
                }
            }
            if (!best) return null;

            let url = best.currentSrc || best.src || '';
            if ((!url || url.startsWith('blob:') || url.startsWith('data:')) && best.srcset) {
                const parts = best.srcset.split(',');
                let widest = 0;
                let chosen = '';
                for (const part of parts) {
                    const seg = part.trim().split(/\s+/);
                    const width = parseInt((seg[1] || '').replace(/\D/g, ''), 10) || 0;
                    if (width >= widest) {
                        widest = width;
                        chosen = seg[0] || '';
                    }
                }
                url = chosen;
            }
            if (!url || !url.includes('googleusercontent.com')) return null;
            return normalizeImageUrl(url);
        } catch (error) {
            logError('getCurrentPhotoUrl', error);
            return null;
        }
    };

    /* ========================================================================
     * MODULE 7 — Drive direct-download resolution. Recognizes both the
     * modern /file/d/{id}/ grammar and the legacy ?id= form, builds the
     * uc?export=download direct link, and mounts a glass HUD on file pages
     * with clipboard and direct-download actions.
     * ==================================================================== */
    const DRIVE_HUD_ID = '4ndr0-drive-hud';

    const detectDriveFileId = (url) => {
        try {
            const pathMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
            if (pathMatch) return pathMatch[1];
            const idParam = new URL(url).searchParams.get('id');
            if (idParam && /^[a-zA-Z0-9_-]{10,}$/.test(idParam)) return idParam;
            return null;
        } catch (error) {
            logError('detectDriveFileId', error);
            return null;
        }
    };

    const buildDriveDirectLink = (fileId) => `https://drive.google.com/uc?export=download&id=${fileId}`;

    const displayDriveLinks = () => {
        try {
            const fileId = detectDriveFileId(window.location.href);
            const existing = document.getElementById(DRIVE_HUD_ID);

            if (!fileId) {
                if (existing) existing.remove();
                return;
            }
            if (existing) {
                existing.style.display = settings.driveHud ? '' : 'none';
                return;
            }
            if (!settings.driveHud || !document.body) return;

            const directLink = buildDriveDirectLink(fileId);

            const hud = document.createElement('div');
            hud.id = DRIVE_HUD_ID;
            hud.className = 'psi-glass-window';
            applyHudPosition(hud, 'driveHud', { x: 20, y: 20 });

            const headerbar = document.createElement('div');
            headerbar.className = 'psi-glass-headerbar';
            const title = document.createElement('div');
            title.className = 'title';
            title.textContent = 'Ψ DRIVE DIRECT';
            title.style.fontSize = '11pt';
            const subtitle = document.createElement('div');
            subtitle.className = 'subtitle';
            subtitle.textContent = `v${SCRIPT_VERSION}`;
            const collapseBtn = makeHeaderButton('—', () => {
                const entry = getHudEntry('driveHud', { x: 20, y: 20, collapsed: false });
                const merged = setHudEntry('driveHud', { collapsed: !entry.collapsed });
                syncHudCollapsed(hud, merged.collapsed, collapseBtn);
            }, 'Collapse drive panel');
            const closeBtn = makeHeaderButton('×', () => {
                setSetting('driveHud', false);
            }, 'Stow drive panel (settings re-engage)');
            headerbar.append(title, subtitle, collapseBtn, closeBtn);

            const content = document.createElement('div');
            content.className = 'psi-glass-content';

            const idPanel = document.createElement('div');
            idPanel.className = 'psi-glass-panel';
            idPanel.textContent = `ID ${fileId}`;
            idPanel.title = 'Google Drive file id';
            content.appendChild(idPanel);

            content.appendChild(makeGlassButton('[=] Copy Direct URL', () => {
                copyToClipboard(directLink);
            }));

            const downloadBtn = makeGlassButton('[>] Direct Download', () => {
                window.open(directLink, '_blank', 'noopener');
            });
            downloadBtn.title = 'Opens uc?export=download — large files may hit a Google confirm interstitial';
            content.appendChild(downloadBtn);

            hud.append(headerbar, content);
            attachDragHandlers(hud, 'driveHud');

            const entry = getHudEntry('driveHud', { x: 20, y: 20, collapsed: false });
            syncHudCollapsed(hud, entry.collapsed, collapseBtn);

            document.body.appendChild(hud);
        } catch (error) {
            logError('displayDriveLinks', error);
        }
    };

    /**
     * MODULE 8 — Clipboard bridge: navigator.clipboard when available,
     * execCommand fallback otherwise; kernel feedback on both outcomes.
     */
    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '-1000px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
            }
            const preview = text.length > 48 ? `${text.slice(0, 45)}...` : text;
            showNotification(`CLIPBOARD ← ${preview}`);
            return true;
        } catch (error) {
            logError('copyToClipboard', error);
            showNotification('CLIPBOARD WRITE DENIED');
            return false;
        }
    };

    /* ========================================================================
     * MODULE 10 — Ψ CONTROL settings console: spec switch toggles for every
     * live setting, destructive reset surface, hotkey legend, Esc-to-close.
     * State changes broadcast through the settings event bus so every HUD
     * re-syncs without a reload.
     * ==================================================================== */
    const SETTINGS_HUD_ID = '4ndr0-settings-console';

    const SETTINGS_SCHEMA = [
        { key: 'contextMenuUnlock', label: 'CTX MENU UNLOCK' },
        { key: 'autoDirectLink', label: 'AUTO s0 DIRECT' },
        { key: 'osintHud', label: 'OSINT RECON HUD' },
        { key: 'driveHud', label: 'DRIVE DIRECT HUD' },
        { key: 'notifications', label: 'KERNEL NOTICES' },
        { key: 'hotkeys', label: 'POWER HOTKEYS' }
    ];

    const closeSettingsConsole = () => {
        const consoleEl = document.getElementById(SETTINGS_HUD_ID);
        if (!consoleEl) return false;
        consoleEl.remove();
        return true;
    };

    const buildSettingsConsole = () => {
        const panel = document.createElement('div');
        panel.id = SETTINGS_HUD_ID;
        panel.className = 'psi-glass-window';
        applyHudPosition(panel, 'settingsConsole', { x: Math.max(20, window.innerWidth - 340), y: 80 });

        const headerbar = document.createElement('div');
        headerbar.className = 'psi-glass-headerbar';
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = 'Ψ CONTROL';
        title.style.fontSize = '11pt';
        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle';
        subtitle.textContent = `v${SCRIPT_VERSION}`;
        const closeBtn = makeHeaderButton('×', () => {
            closeSettingsConsole();
        }, 'Close control console (Esc)');
        headerbar.append(title, subtitle, closeBtn);

        const content = document.createElement('div');
        content.className = 'psi-glass-content';

        for (const schema of SETTINGS_SCHEMA) {
            const row = document.createElement('div');
            row.className = 'psi-glass-row';

            const label = document.createElement('span');
            label.className = 'psi-glass-label';
            label.textContent = schema.label;

            const switchLabel = document.createElement('label');
            switchLabel.className = 'psi-glass-switch';
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.dataset.key = schema.key;
            input.checked = settings[schema.key];
            input.addEventListener('change', () => {
                setSetting(schema.key, input.checked);
            });
            const trough = document.createElement('span');
            trough.className = 'trough';
            switchLabel.append(input, trough);

            row.append(label, switchLabel);
            content.appendChild(row);
        }

        content.appendChild(makeGlassButton('[X] RESET DEFAULTS', () => {
            resetSettings();
            syncSettingsConsole();
            showNotification('SETTINGS PURGED TO DEFAULTS');
        }, true));

        const hint = document.createElement('div');
        hint.className = 'psi-glass-label';
        hint.style.opacity = '0.7';
        hint.textContent = 'S console · O hud · C copy · F full-res · R lens · D drive-dl';
        content.appendChild(hint);

        panel.append(headerbar, content);
        attachDragHandlers(panel, 'settingsConsole');
        return panel;
    };

    const toggleSettingsConsole = () => {
        try {
            if (closeSettingsConsole()) return;
            if (!document.body) return;
            document.body.appendChild(buildSettingsConsole());
        } catch (error) {
            logError('toggleSettingsConsole', error);
        }
    };

    const syncSettingsConsole = () => {
        const panel = document.getElementById(SETTINGS_HUD_ID);
        if (!panel) return;
        for (const schema of SETTINGS_SCHEMA) {
            const input = panel.querySelector(`input[data-key="${schema.key}"]`);
            if (input) input.checked = settings[schema.key];
        }
    };

    /* ========================================================================
     * MODULE 9 — Power-user hotkey engine. Plain keys on static
     * googleusercontent image pages; Alt-combos on Photos/Drive so native
     * app shortcuts are never shadowed. Esc always closes the console.
     *   S console · O osint hud · C copy direct · F full-res · R lens · D dl
     * ==================================================================== */
    const isEditableTarget = (target) => {
        if (!target || !target.tagName) return false;
        const tag = target.tagName.toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true;
    };

    const activeDirectUrl = () => {
        const host = window.location.hostname;
        if (isAllowedHost(host, 'googleusercontent.com')) {
            return normalizeImageUrl(window.location.href);
        }
        if (host === 'photos.google.com') {
            return getCurrentPhotoUrl();
        }
        if (isAllowedHost(host, 'drive.google.com')) {
            const fileId = detectDriveFileId(window.location.href);
            if (fileId) return buildDriveDirectLink(fileId);
        }
        return null;
    };

    const openCurrentPhotoFullRes = () => {
        const photoUrl = getCurrentPhotoUrl();
        if (photoUrl) {
            window.open(photoUrl, '_blank', 'noopener');
            showNotification('FULL RESOLUTION VECTORED');
        } else {
            showNotification('NO VIEWER TARGET ACQUIRED');
        }
    };

    const reverseSearchCurrent = () => {
        const host = window.location.hostname;
        let targetUrl = null;
        if (isAllowedHost(host, 'googleusercontent.com')) {
            targetUrl = normalizeImageUrl(window.location.href);
        } else if (host === 'photos.google.com') {
            targetUrl = getCurrentPhotoUrl();
        }
        if (targetUrl) {
            window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(targetUrl)}`, '_blank', 'noopener');
            showNotification('LENS RECON VECTORED');
        } else {
            showNotification('NO RECON TARGET ACQUIRED');
        }
    };

    const triggerDriveDirect = () => {
        const fileId = detectDriveFileId(window.location.href);
        if (fileId) {
            window.open(buildDriveDirectLink(fileId), '_blank', 'noopener');
            showNotification('DRIVE DIRECT DOWNLOAD VECTORED');
        } else {
            showNotification('NO DRIVE FILE TARGET — OPEN A /file/d/ PAGE');
        }
    };

    const hotkeyEngine = () => {
        try {
            window.addEventListener('keydown', (event) => {
                if (!settings.hotkeys) return;

                if (event.key === 'Escape') {
                    if (closeSettingsConsole()) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                    }
                    return;
                }
                if (event.ctrlKey || event.metaKey) return;
                if (isEditableTarget(event.target)) return;

                const host = window.location.hostname;
                const isImagePage = Boolean(document.contentType && document.contentType.startsWith('image/'));
                const plainKeysAllowed = isAllowedHost(host, 'googleusercontent.com') && isImagePage;
                if (plainKeysAllowed ? event.altKey : !event.altKey) return;

                const key = event.key.toLowerCase();
                let handled = false;

                if (key === 's') {
                    toggleSettingsConsole();
                    handled = true;
                } else if (key === 'o') {
                    if (plainKeysAllowed) {
                        setSetting('osintHud', !settings.osintHud);
                        showNotification(`OSINT HUD ${settings.osintHud ? 'ENGAGED' : 'STOWED'}`);
                        handled = true;
                    }
                } else if (key === 'c') {
                    const directUrl = activeDirectUrl();
                    if (directUrl) {
                        copyToClipboard(directUrl);
                        handled = true;
                    }
                } else if (key === 'f') {
                    if (host === 'photos.google.com') {
                        openCurrentPhotoFullRes();
                        handled = true;
                    }
                } else if (key === 'r') {
                    if (host === 'photos.google.com' || plainKeysAllowed) {
                        reverseSearchCurrent();
                        handled = true;
                    }
                } else if (key === 'd') {
                    if (isAllowedHost(host, 'drive.google.com')) {
                        triggerDriveDirect();
                        handled = true;
                    }
                }

                if (handled) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }
            }, true);
        } catch (error) {
            logError('hotkeyEngine', error);
        }
    };

    /**
     * MODULE 10.7 — Tampermonkey menu surface (granted managers only).
     */
    const registerMenuCommands = () => {
        try {
            if (typeof GM_registerMenuCommand !== 'function') return;
            GM_registerMenuCommand('Ψ Settings console [S / Alt+S]', () => {
                toggleSettingsConsole();
            });
            GM_registerMenuCommand('Ψ Toggle OSINT HUD [O]', () => {
                setSetting('osintHud', !settings.osintHud);
                showNotification(`OSINT HUD ${settings.osintHud ? 'ENGAGED' : 'STOWED'}`);
            });
            GM_registerMenuCommand('Ψ Reset settings', () => {
                resetSettings();
                syncSettingsConsole();
                showNotification('SETTINGS PURGED TO DEFAULTS');
            });
        } catch (error) {
            logError('registerMenuCommands', error);
        }
    };

    /**
     * MODULE 10.5 — SPA route patch: wraps history.pushState/replaceState
     * and listens to popstate so Drive's client-side navigation re-syncs
     * the Drive HUD (mount on /file/d/ routes, unmount on departure).
     */
    const initSpaNavigationPatch = () => {
        try {
            let hudSyncTimer = null;
            const scheduleHudSync = () => {
                if (hudSyncTimer) clearTimeout(hudSyncTimer);
                hudSyncTimer = setTimeout(() => {
                    hudSyncTimer = null;
                    try {
                        displayDriveLinks();
                    } catch (error) {
                        logError('initSpaNavigationPatch.hudSync', error);
                    }
                }, 250);
            };

            const wrapHistoryMethod = (methodName) => {
                const native = history[methodName];
                if (typeof native !== 'function') return;
                history[methodName] = function (...args) {
                    const result = native.apply(this, args);
                    scheduleHudSync();
                    return result;
                };
            };

            wrapHistoryMethod('pushState');
            wrapHistoryMethod('replaceState');
            window.addEventListener('popstate', scheduleHudSync);
        } catch (error) {
            logError('initSpaNavigationPatch', error);
        }
    };

    /* ========================================================================
     * MODULE 11 — Initialization vector: phased boot (document-start safe
     * listener attachment, body-gated DOM surfaces), baseline dispatch
     * order preserved, settings event bus wiring.
     * ==================================================================== */
    const isAllowedHost = (host, domain) => host === domain || host.endsWith(`.${domain}`);

    const initialize = () => {
        try {
            injectStyles();
            printBootBanner();
            removeContextMenuBlockers();
            initSpaNavigationPatch();
            hotkeyEngine();
            registerMenuCommands();

            const currentHost = window.location.hostname;
            const isImage = Boolean(document.contentType && document.contentType.startsWith('image/'));
            const onGusercontent = isAllowedHost(currentHost, 'googleusercontent.com');
            const onGoogle = isAllowedHost(currentHost, 'google.com');

            const mountDomSurfaces = () => {
                try {
                    if (onGusercontent && isImage) {
                        if (settings.autoDirectLink) {
                            getDirectPhotoLink();
                        }
                        displaySearchLinks();
                    }
                    if (isAllowedHost(currentHost, 'drive.google.com')) {
                        displayDriveLinks();
                    }
                    if (onGoogle || onGusercontent) {
                        showNotification(`3LECTRIC-GLASS OVERRIDE ENGAGED · v${SCRIPT_VERSION}`);
                    }
                } catch (error) {
                    logError('mountDomSurfaces', error);
                }
            };

            if (document.body) {
                mountDomSurfaces();
            } else {
                document.addEventListener('DOMContentLoaded', mountDomSurfaces, { once: true });
            }

            settingsChanged(() => {
                displaySearchLinks();
                displayDriveLinks();
                syncSettingsConsole();
            });
        } catch (error) {
            logError('initialize', error);
        }
    };

    initialize();
})();
