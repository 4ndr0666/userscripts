// ==UserScript==
// @name         4ndr0tools - PageCraft
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @description  All-sites page utility belt: bulk checkbox control with range/alt-hover selection (de-jQueryed), broken-image auto-repair with cache-busting + frame broadcast, hover-collapse image I/O governor, and Brave infinite scroll — one engine, glass settings console, zero runtime dependencies.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20PageCraft.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20PageCraft.user.js
// ==/UserScript==

/* 4ndr0tools - PageCraft v1.0.0 — built from modules/pagecraft + kernel {brand, core, glass, store, hotkeys}
 * All-sites page utility belt: bulk checkbox control with range/alt-hover selection (de-jQueryed), broken-image auto-repair with cache-busting + frame broadcast, hover-collapse image I/O governor, and Brave infinite scroll — one engine, glass settings console, zero runtime dependencies.
 * This is a generated file; edit modules/ and run `npm run build`.
 */

(function () {
    'use strict';
    const Ψ = {};
    /* ══ kernel/brand.js ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/brand.js — 4ndr0666tools canonical brand constants
 * ----------------------------------------------------------------------------
 * Single source of truth for the Ψ glyph, the 3lectric-Glass palette, and
 * suite-wide identity. Every dist script inlines this at build time; editing
 * it here re-brands the entire suite in one commit.
 *
 * Sources of truth:
 *   - Glyph:      glm/resources/4ndr0666_glyph.txt (Ψ hexagon + dashed rings)
 *   - Palette:    glm/resources/3lectric_6lass-spec.md §2.1 (GTK3 paradigm,
 *                 translated verbatim to web CSS custom properties)
 *   - Typography: 3lectric_6lass-spec.md §3.0
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.brand = (() => {
    'use strict';

    const SUITE = '4ndr0666tools';
    const KERNEL_VERSION = '1.0.0';

    /* Ψ branding glyph — inline SVG element factory + data-URI for @icon. */
    const GLYPH_SVG =
        '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="none" ' +
        'stroke="#00E5FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2"/>' +
        '<path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/>' +
        '<path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/>' +
        '<text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="#00E5FF" ' +
        'stroke="none" font-size="56" font-weight="700" font-family="Cinzel Decorative, serif">Ψ</text>' +
        '</svg>';

    /** Minimal URI-encoded glyph for userscript @icon headers. */
    const GLYPH_ICON_URI =
        'data:image/svg+xml,' + encodeURIComponent(GLYPH_SVG).replace(/%20/g, '%20');

    /* 3lectric-Glass colorimetry matrix — 3lectric_6lass-spec.md §2.1.
     * Names mirror the spec's functional roles so audits map 1:1. */
    const PALETTE = Object.freeze({
        matrixDeepBase: 'rgba(10, 19, 26, 1.0)',
        glassL1Window: 'rgba(10, 19, 26, 0.72)',
        glassL2MenuPopup: 'rgba(10, 19, 26, 0.65)',
        glassL3PanelInput: 'rgba(10, 19, 26, 0.55)',
        solidHeader: 'rgba(10, 19, 26, 0.95)',
        accentPrimary: '#00E5FF',     // Electric Cyan
        accentSecondary: '#67E8F9',   // hover / highlights
        destructive: '#ff0055',       // Neon Pink/Red
        absoluteLight: '#ffffff',
        accentSoftBorder: 'rgba(0, 229, 255, 0.2)',
        accentMidBorder: 'rgba(0, 229, 255, 0.3)',
        accentStrongBorder: 'rgba(0, 229, 255, 0.4)',
        accentWash: 'rgba(0, 229, 255, 0.2)',
        accentWashDeep: 'rgba(0, 229, 255, 0.3)',
        glowAura: 'rgba(0, 229, 255, 0.15)',
        glowMid: 'rgba(0, 229, 255, 0.5)',
        switchTrough: '#050A0F',
        scrollbarVoid: 'rgba(0, 0, 0, 0.4)',
        textDim: 'rgba(0, 229, 255, 0.7)',
    });

    /* Typography schematics — spec §3.0. */
    const FONTS = Object.freeze({
        system: '"JetBrains Mono", "Cascadia Mono", ui-monospace, monospace',
        display: '"Orbitron", "JetBrains Mono", sans-serif',
    });

    /* Global transition contract — spec §2.2. */
    const TRANSITION = 'all 150ms ease-in-out';

    /* CSS custom properties derived from the palette. Injected once per
     * document by Ψ.glass.inject() and consumed by every glass surface. */
    const cssVars = () =>
        `:root{` +
        `--a4-base-0:${PALETTE.matrixDeepBase};` +
        `--a4-glass-1:${PALETTE.glassL1Window};` +
        `--a4-glass-2:${PALETTE.glassL2MenuPopup};` +
        `--a4-glass-3:${PALETTE.glassL3PanelInput};` +
        `--a4-header:${PALETTE.solidHeader};` +
        `--a4-cyan:${PALETTE.accentPrimary};` +
        `--a4-cyan-2:${PALETTE.accentSecondary};` +
        `--a4-destructive:${PALETTE.destructive};` +
        `--a4-light:${PALETTE.absoluteLight};` +
        `--a4-brd-soft:${PALETTE.accentSoftBorder};` +
        `--a4-brd-mid:${PALETTE.accentMidBorder};` +
        `--a4-brd-strong:${PALETTE.accentStrongBorder};` +
        `--a4-wash:${PALETTE.accentWash};` +
        `--a4-wash-deep:${PALETTE.accentWashDeep};` +
        `--a4-glow-aura:${PALETTE.glowAura};` +
        `--a4-glow-mid:${PALETTE.glowMid};` +
        `--a4-text-dim:${PALETTE.textDim};` +
        `--a4-font:${FONTS.system};` +
        `--a4-font-display:${FONTS.display};` +
        `--a4-transition:${TRANSITION};` +
        `}`;

    return Object.freeze({ SUITE, KERNEL_VERSION, GLYPH_SVG, GLYPH_ICON_URI, PALETTE, FONTS, TRANSITION, cssVars });
})();
    /* ══ kernel/core.js ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/core.js — deterministic DOM + language primitives
 * ----------------------------------------------------------------------------
 * The canonical helper family ($, $$, $new, …) unified from the helper sets
 * that were hand-copied across Images++, LinkMaster, Confirmation Bypass,
 * MPC, and 19 other scripts. One definition, suite-wide.
 *
 * GUP B.1 compliance: O(1) registries via Set/Map; bounded polling; no
 * window pollution; every observer returns its own disconnect handle.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.core = (() => {
    'use strict';

    const doc = () => document;

    /** querySelector — single element. */
    const $ = (sel, root) => (root || doc()).querySelector(sel);

    /** querySelectorAll → real Array (iterable, mappable). */
    const $$ = (sel, root) => Array.from((root || doc()).querySelectorAll(sel));

    /**
     * Element factory. attrs applied via direct property assignment where
     * possible (style, dataset keys via `data-*`, event handlers via `on*`).
     * Children may be Nodes or strings (text nodes).
     */
    function $new(tag, attrs, children) {
        const el = doc().createElement(tag);
        if (attrs) {
            for (const key of Object.keys(attrs)) {
                const val = attrs[key];
                if (val == null) continue;
                if (key === 'style' && typeof val === 'object') {
                    Object.assign(el.style, val);
                } else if (key.startsWith('data-')) {
                    el.setAttribute(key, String(val));
                } else if (key.startsWith('on') && typeof val === 'function') {
                    el.addEventListener(key.slice(2), val);
                } else if (key in el && typeof val !== 'string') {
                    el[key] = val;
                } else {
                    el.setAttribute(key, String(val));
                }
            }
        }
        if (children != null) {
            for (const child of Array.isArray(children) ? children : [children]) {
                el.append(child instanceof Node ? child : doc().createTextNode(String(child)));
            }
        }
        return el;
    }

    /** Read a dataset property up the ancestor chain (event delegation aid). */
    const $dataset = (el, key) => {
        for (let n = el; n && n !== doc(); n = n.parentElement) {
            if (n.dataset && n.dataset[key] !== undefined) return n.dataset[key];
        }
        return undefined;
    };

    /** Locate the nearest ancestor matching `sel` (self-inclusive). */
    const $propUp = (el, sel) => {
        for (let n = el; n && n !== doc(); n = n.parentElement) {
            if (n.matches && n.matches(sel)) return n;
        }
        return null;
    };

    /* ── Language primitives ─────────────────────────────────────────────── */

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /** Trailing-edge debounce. Returns a cancelable wrapped function. */
    function debounce(fn, wait = 150) {
        let t = null;
        const wrapped = (...args) => {
            if (t !== null) clearTimeout(t);
            t = setTimeout(() => { t = null; fn(...args); }, wait);
        };
        wrapped.cancel = () => { if (t !== null) { clearTimeout(t); t = null; } };
        return wrapped;
    }

    /** Leading-edge throttle with trailing flush. */
    function throttle(fn, wait = 150) {
        let last = 0, t = null, pending = null;
        const wrapped = (...args) => {
            const now = Date.now();
            if (now - last >= wait) {
                last = now;
                fn(...args);
            } else {
                pending = args;
                if (t === null) {
                    t = setTimeout(() => {
                        t = null;
                        last = Date.now();
                        if (pending) fn(...pending);
                        pending = null;
                    }, wait - (now - last));
                }
            }
        };
        wrapped.cancel = () => { if (t !== null) { clearTimeout(t); t = null; } pending = null; };
        return wrapped;
    }

    /** Run `fn` exactly once, memoizing result or thrown error. */
    function once(fn) {
        let done = false, result;
        return (...args) => {
            if (done) return result;
            done = true;
            result = fn(...args);
            return result;
        };
    }

    /** Monotonic-ish unique id: base36 timestamp + counter. */
    const uid = (() => {
        let n = 0;
        return (prefix = 'a4') => `${prefix}-${Date.now().toString(36)}-${(n++).toString(36)}`;
    })();

    /* ── Bounded caches (GUP B.1: FIFO eviction, O(1) ops) ───────────────── */

    class FIFOCache {
        constructor(max = 512) {
            this.max = max;
            this.map = new Map();
        }
        get(key) {
            if (!this.map.has(key)) return undefined;
            const v = this.map.get(key);
            this.map.delete(key);      // refresh recency
            this.map.set(key, v);
            return v;
        }
        set(key, value) {
            if (this.map.has(key)) this.map.delete(key);
            this.map.set(key, value);
            if (this.map.size > this.max) {
                this.map.delete(this.map.keys().next().value);
            }
            return this;
        }
        has(key) { return this.map.has(key); }
        delete(key) { return this.map.delete(key); }
        get size() { return this.map.size; }
        clear() { this.map.clear(); }
    }

    /* ── Safe text ───────────────────────────────────────────────────────── */

    const ESCAPE_MAP = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' });

    /** HTML-escape untrusted text for innerHTML interpolation (defense-in-depth). */
    const escapeHTML = (s) => String(s).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);

    /* ── DOM observation (bounded, self-cleaning) ────────────────────────── */

    /**
     * Wait for an element matching `sel` via MutationObserver restricted to
     * structural changes (childList + subtree), replacing legacy 100 ms
     * polling loops (HDImgsOnly lineage). Resolves with the element, or
     * rejects with a TimeoutError after `timeout` ms.
     *
     * @param {string} sel CSS selector.
     * @param {{timeout?: number, root?: ParentNode, signal?: AbortSignal}} [opts]
     * @returns {Promise<Element>} element — call `.dispose()` no; nothing to dispose on success.
     */
    function waitFor(sel, { timeout = 10000, root, signal } = {}) {
        return new Promise((resolve, reject) => {
            const scope = root || doc();
            const existing = scope.querySelector(sel);
            if (existing) { resolve(existing); return; }

            let observer = null, timer = null;
            const cleanup = () => {
                if (timer !== null) clearTimeout(timer);
                if (observer) observer.disconnect();
                if (signal) signal.removeEventListener('abort', onAbort);
            };
            const onAbort = () => { cleanup(); reject(new DOMException('waitFor aborted', 'AbortError')); };

            observer = new MutationObserver(() => {
                const el = scope.querySelector(sel);
                if (el) { cleanup(); resolve(el); }
            });
            observer.observe(scope, { childList: true, subtree: true });
            if (signal) {
                if (signal.aborted) { onAbort(); return; }
                signal.addEventListener('abort', onAbort, { once: true });
            }
            timer = setTimeout(() => {
                cleanup();
                reject(new Error(`waitFor: "${sel}" not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Scoped, debounced structural watcher. Auto-debounces handler to prevent
     * self-triggering loops (GUP B.1 MutationObserver filtering).
     * Returns a disposer that also cancels the debounce timer.
     */
    function watchDOM(root, handler, { debounceMs = 100, subtree = true } = {}) {
        const fire = debounce(handler, debounceMs);
        const observer = new MutationObserver((muts) => {
            for (const m of muts) {
                if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
                    fire(muts, observer);
                    return;
                }
            }
        });
        observer.observe(root || doc(), { childList: true, subtree });
        return () => { observer.disconnect(); fire.cancel(); };
    }

    /** Escape hatch for Trusted Types CSP: build DOM without innerHTML. */
    const trustedAppend = (parent, nodes) => {
        for (const n of Array.isArray(nodes) ? nodes : [nodes]) {
            parent.append(n instanceof Node ? n : doc().createTextNode(String(n)));
        }
        return parent;
    };

    return Object.freeze({
        $, $$, $new, $dataset, $propUp,
        sleep, debounce, throttle, once, uid,
        FIFOCache, escapeHTML,
        waitFor, watchDOM, trustedAppend,
    });
})();
    /* ══ kernel/glass.js ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/glass.js — the 3lectric-Glass UI system (web translation)
 * ----------------------------------------------------------------------------
 * Canonical implementation of glm/resources/3lectric_6lass-spec.md for
 * userscript surfaces. Replaces the palette/style fragments that were
 * hand-copied across 29 scripts (148+ duplicated constants).
 *
 * Translation rules (GTK3 → hostile host page):
 *   - Never style bare widget names (button, menu, …): every selector is
 *     scoped under `.a4-` classes (spec §1.2 universal-selector ban, web-side).
 *   - All DOM construction uses createElement/textContent only — Trusted
 *     Types-immune on require-trusted-types pages (no innerHTML anywhere).
 *   - CSS custom properties live on `.a4-scope` (each glass surface), never
 *     on :root — zero leakage into the host document.
 *   - Optional closed-Shadow-DOM mounting for maximally hostile pages.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.glass = (() => {
    'use strict';

    const { PALETTE, FONTS, TRANSITION, GLYPH_SVG } = Ψ.brand;
    const { $, $new, escapeHTML } = Ψ.core;

    const STYLE_ID = 'a4-glass-stylesheet-v1';

    /* Scoped component stylesheet. Every rule nests under .a4-scope so the
     * payload can never bleed into the host page. Spec §5.0 payload mapped
     * 1:1: panels §4.2/.glass-panel, buttons §4.4–4.5, switches §4.6,
     * popovers §4.7, scrollbars §4.8, notifications §5.0. */
    const COMPONENT_CSS = `
.a4-scope{--a4-glass-1:${PALETTE.glassL1Window};--a4-glass-2:${PALETTE.glassL2MenuPopup};--a4-glass-3:${PALETTE.glassL3PanelInput};--a4-header:${PALETTE.solidHeader};--a4-cyan:${PALETTE.accentPrimary};--a4-cyan-2:${PALETTE.accentSecondary};--a4-destructive:${PALETTE.destructive};--a4-light:${PALETTE.absoluteLight};--a4-brd-soft:${PALETTE.accentSoftBorder};--a4-brd-mid:${PALETTE.accentMidBorder};--a4-brd-strong:${PALETTE.accentStrongBorder};--a4-wash:${PALETTE.accentWash};--a4-wash-deep:${PALETTE.accentWashDeep};--a4-glow-aura:${PALETTE.glowAura};--a4-glow-mid:${PALETTE.glowMid};--a4-text-dim:${PALETTE.textDim};--a4-font:${FONTS.system};--a4-font-display:${FONTS.display};--a4-transition:${TRANSITION};}
.a4-scope *,.a4-scope *::before,.a4-scope *::after{box-sizing:border-box;font-family:var(--a4-font);transition:var(--a4-transition);}
/* Main window / HUD frame — spec §4.2 */
.a4-window{background:var(--a4-glass-1);border:1px solid var(--a4-brd-soft);box-shadow:0 0 40px var(--a4-glow-aura);color:var(--a4-cyan);position:fixed;z-index:2147483646;display:flex;flex-direction:column;min-width:220px;}
/* Headerbar — spec §4.3 */
.a4-header{background:var(--a4-header);border-bottom:2px solid var(--a4-cyan);padding:10px;display:flex;align-items:center;gap:10px;cursor:move;user-select:none;color:var(--a4-cyan);}
.a4-title{font-family:var(--a4-font-display);font-size:14pt;font-weight:700;color:var(--a4-cyan-2);letter-spacing:1px;margin:0;}
.a4-subtitle{font-family:var(--a4-font);font-size:9pt;color:var(--a4-text-dim);margin:0;}
/* Glass panel — spec .glass-panel */
.a4-panel{background:var(--a4-glass-3);border:1px solid var(--a4-brd-mid);border-radius:4px;margin:5px;padding:8px;color:var(--a4-cyan);}
/* Buttons — spec §4.4/4.5 (strict rectangular brutalism) */
.a4-btn{background:var(--a4-glass-2);border:1px solid var(--a4-brd-strong);color:var(--a4-cyan);border-radius:0;padding:10px 20px;font-weight:bold;font-size:12px;cursor:pointer;font-family:var(--a4-font);}
.a4-btn:hover{background:var(--a4-wash);border-color:var(--a4-cyan);box-shadow:0 0 20px var(--a4-glow-mid);color:var(--a4-cyan-2);}
.a4-btn:active{background:var(--a4-wash-deep);color:var(--a4-light);}
.a4-btn--destructive{border-color:var(--a4-destructive);color:var(--a4-destructive);}
.a4-btn--destructive:hover{background:rgba(255,0,85,0.3);box-shadow:0 0 25px var(--a4-destructive);color:var(--a4-light);}
.a4-btn--sm{padding:4px 10px;font-size:11px;}
/* Switch — spec §4.6 */
.a4-switch{display:inline-flex;align-items:center;gap:8px;cursor:pointer;}
.a4-switch input{position:absolute;opacity:0;pointer-events:none;}
.a4-switch .a4-trough{width:34px;height:18px;background:var(--a4-void,#050A0F);border:1px solid var(--a4-cyan);position:relative;flex:none;}
.a4-switch .a4-node{position:absolute;top:1px;left:1px;width:14px;height:14px;background:var(--a4-cyan);box-shadow:0 0 12px rgba(0,229,255,0.8);transition:transform 150ms ease-in-out;}
.a4-switch input:checked + .a4-trough{background:var(--a4-wash);}
.a4-switch input:checked + .a4-trough .a4-node{transform:translateX(16px);}
.a4-switch .a4-label{font-size:11px;color:var(--a4-cyan);}
/* Popover / menu — spec §4.7 */
.a4-menu{background:var(--a4-glass-2);border:1px solid var(--a4-brd-mid);box-shadow:0 0 20px var(--a4-glow-aura);color:var(--a4-cyan);padding:4px;min-width:140px;}
.a4-menuitem{color:var(--a4-cyan);padding:5px;cursor:pointer;font-size:12px;}
.a4-menuitem:hover{background:var(--a4-wash);color:var(--a4-light);}
/* Scrollbars — spec §4.8 (minimized, non-intrusive) */
.a4-scroll{overflow:auto;scrollbar-width:thin;scrollbar-color:var(--a4-cyan) rgba(0,0,0,0.4);}
.a4-scroll::-webkit-scrollbar{width:6px;height:6px;}
.a4-scroll::-webkit-scrollbar-track{background:rgba(0,0,0,0.4);}
.a4-scroll::-webkit-scrollbar-thumb{background:var(--a4-cyan);border-radius:0;}
.a4-scroll::-webkit-scrollbar-thumb:hover{background:var(--a4-cyan-2);}
/* Inputs — glass level 3 */
.a4-input{background:var(--a4-glass-3);border:1px solid var(--a4-brd-strong);color:var(--a4-cyan);padding:6px 8px;font-family:var(--a4-font);font-size:12px;border-radius:0;outline:none;}
.a4-input:focus{border-color:var(--a4-cyan);box-shadow:0 0 10px var(--a4-glow-aura);}
.a4-input::placeholder{color:var(--a4-text-dim);}
/* Notification — spec .notification-label */
.a4-toast{position:fixed;right:14px;z-index:2147483647;background:var(--a4-glass-2);border:1px solid var(--a4-brd-mid);border-left:3px solid var(--a4-cyan);color:var(--a4-cyan);padding:10px 14px;font-family:var(--a4-font);font-size:12px;max-width:340px;box-shadow:0 0 20px var(--a4-glow-aura);transition:opacity 150ms ease-in-out,transform 150ms ease-in-out;}
.a4-toast--success{border-left-color:#35c759;}
.a4-toast--error{border-left-color:#ff453a;}
.a4-toast--destructive{border-left-color:var(--a4-destructive);}
.a4-toast .a4-toast-text{color:var(--a4-light);font-weight:bold;}
/* Tabs */
.a4-tabs{display:flex;gap:2px;padding:6px 6px 0;background:transparent;}
.a4-tab{background:var(--a4-glass-3);border:1px solid var(--a4-brd-soft);border-bottom:none;color:var(--a4-cyan);padding:5px 12px;font-size:11px;cursor:pointer;font-family:var(--a4-font);}
.a4-tab:hover{background:var(--a4-wash);color:var(--a4-cyan-2);}
.a4-tab.a4-tab--active{background:var(--a4-wash);color:var(--a4-light);border-color:var(--a4-brd-strong);}
.a4-tabbar{border-bottom:1px solid var(--a4-brd-soft);}
.a4-content{padding:8px;overflow:auto;flex:1;}
`;

    /** Idempotent stylesheet injection. Safe at document-start (falls back
     * to documentElement when <head> is absent). Returns the <style> node. */
    function injectStyles() {
        const existing = document.getElementById(STYLE_ID);
        if (existing) return existing;
        const style = $new('style', { id: STYLE_ID });
        style.textContent = COMPONENT_CSS;
        (document.head || document.documentElement).append(style);
        return style;
    }

    /** Branding glyph as a live SVG Element (clonable, stylable). */
    function glyphEl(size = 20) {
        const wrap = $new('span', { class: 'a4-glyph', style: { display: 'inline-flex', width: size + 'px', height: size + 'px', flex: 'none' } });
        const host = document.createElement('div'); // parse isolated constant, TT-safe via DOMParser
        const parsed = new DOMParser().parseFromString(GLYPH_SVG, 'image/svg+xml');
        const svg = document.importNode(parsed.documentElement, true);
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        wrap.append(svg);
        return wrap;
    }

    /* ── Toasts ──────────────────────────────────────────────────────────── */

    const MAX_TOASTS = 5;
    const toastStack = [];

    /**
     * Fire a 3lectric-Glass toast. Auto-stacks bottom-right with FIFO
     * eviction past MAX_TOASTS (bounded surfaces, GUP B.1).
     * @param {string} text
     * @param {{type?: 'info'|'success'|'error'|'destructive', duration?: number}} [opts]
     */
    function toast(text, { type = 'info', duration = 3500 } = {}) {
        const host = document.body || document.documentElement;
        const el = $new('div', { class: `a4-toast a4-toast--${type}`, role: 'status' },
            $new('span', { class: 'a4-toast-text' }, String(text)));
        el.style.opacity = '0';
        el.style.transform = 'translateX(12px)';
        host.append(el);
        toastStack.push(el);
        while (toastStack.length > MAX_TOASTS) {
            const gone = toastStack.shift();
            if (gone.isConnected) gone.remove();
        }
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateX(0)';
        });
        const die = () => {
            const i = toastStack.indexOf(el);
            if (i >= 0) toastStack.splice(i, 1);
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 200);
        };
        if (duration > 0) setTimeout(die, duration);
        el.addEventListener('click', die, { once: true });
        return die;
    }

    /* ── HUD frame (draggable, tabbed, optionally shadow-isolated) ──────── */

    /**
     * Build a draggable glass HUD. Spec §4.2 window + §4.3 headerbar.
     *
     * @param {object} opts
     * @param {string} opts.id              stable id (used for position persistence key)
     * @param {string} [opts.title]         headerbar title (Orbitron display)
     * @param {string} [opts.subtitle]      headerbar subtitle
     * @param {Array<{id:string,label:string,render:(content:Element)=>void}>} [opts.tabs]
     * @param {{x:number,y:number}} [opts.position]   initial px position
     * @param {number} [opts.width]         px width (default 380)
     * @param {number} [opts.height]        content max-height px (default 420)
     * @param {boolean} [opts.shadow]       mount inside closed shadow root (hostile pages)
     * @param {(hudApi:object)=>void} [opts.onReady]
     * @returns {object} hudApi {root, show, hide, toggle, collapse, isCollapsed,
     *                           addTab, selectTab, content, destroy, toast}
     */
    function hud(opts) {
        const {
            id, title = '4NDR0666', subtitle = '', tabs = [],
            position = null, width = 380, height = 420,
            shadow = false, onReady = null,
        } = opts;

        injectStyles();

        /* Mount strategy: closed shadow root (hostile pages) or light DOM. */
        let mountRoot;
        const frame = $new('div', { class: 'a4-window a4-scope', style: { width: width + 'px' } });
        frame.dataset.a4Hud = id;
        if (shadow) {
            mountRoot = $new('div', { id: `a4-hud-host-${id}` });
            const sr = mountRoot.attachShadow({ mode: 'closed' });
            const innerStyle = document.createElement('style');
            innerStyle.textContent = COMPONENT_CSS;
            sr.append(innerStyle, frame);
        } else {
            mountRoot = frame;
        }

        /* Headerbar — spec §4.3 */
        const collapseBtn = $new('button', { class: 'a4-btn a4-btn--sm', title: 'Collapse (double-click header)' }, '–');
        const header = $new('div', { class: 'a4-header' },
            glyphEl(18),
            $new('div', { style: { flex: '1', display: 'flex', flexDirection: 'column', gap: '2px' } },
                $new('h1', { class: 'a4-title' }, title),
                subtitle ? $new('p', { class: 'a4-subtitle' }, subtitle) : null),
            collapseBtn);
        header.addEventListener('dblclick', () => api.toggleCollapse());

        const tabbar = $new('div', { class: 'a4-tabbar' });
        const tabsRow = $new('div', { class: 'a4-tabs' });
        tabbar.append(tabsRow);
        const content = $new('div', { class: 'a4-content a4-scroll', style: { maxHeight: height + 'px' } });
        const bodyWrap = $new('div', { style: { display: 'flex', flexDirection: 'column' } }, tabbar, content);

        let collapsed = false;
        frame.append(header, bodyWrap);

        /* Tabs */
        const tabDefs = new Map();
        function selectTab(tabId) {
            for (const [tid, def] of tabDefs) {
                def.btn.classList.toggle('a4-tab--active', tid === tabId);
            }
            content.replaceChildren();
            const def = tabDefs.get(tabId);
            if (def) def.render(content);
        }
        function addTab(def) {
            if (tabDefs.has(def.id)) throw new Error(`glass.hud: duplicate tab id "${def.id}"`);
            const btn = $new('button', { class: 'a4-tab' }, def.label);
            btn.addEventListener('click', () => selectTab(def.id));
            tabsRow.append(btn);
            tabDefs.set(def.id, { ...def, btn });
            if (tabDefs.size === 1) selectTab(def.id);
        }

        /* Drag — pointer capture, viewport-clamped, position persisted. */
        let dragState = null;
        header.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || e.target.closest('button')) return;
            dragState = { dx: e.clientX - frame.getBoundingClientRect().left, dy: e.clientY - frame.getBoundingClientRect().top };
            header.setPointerCapture(e.pointerId);
        });
        header.addEventListener('pointermove', (e) => {
            if (!dragState) return;
            const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragState.dx));
            const y = Math.max(0, Math.min(window.innerHeight - 24, e.clientY - dragState.dy));
            frame.style.left = x + 'px';
            frame.style.top = y + 'px';
            frame.style.right = 'auto';
        });
        const endDrag = () => { dragState = null; };
        header.addEventListener('pointerup', endDrag);
        header.addEventListener('pointercancel', endDrag);

        /* Position: persisted store or bottom-right default. */
        const saved = Ψ.store ? Ψ.store.getJson(`hud:pos:${id}`, null) : null;
        const pos = position || saved || { x: Math.max(8, window.innerWidth - width - 16), y: 64 };
        frame.style.left = pos.x + 'px';
        frame.style.top = pos.y + 'px';

        const persistPos = Ψ.core.debounce(() => {
            const r = frame.getBoundingClientRect();
            if (Ψ.store) Ψ.store.setJson(`hud:pos:${id}`, { x: r.left, y: r.top });
        }, 400);

        const api = {
            root: mountRoot,
            frame,
            content,
            addTab,
            selectTab,
            show() { (document.body || document.documentElement).append(mountRoot); return api; },
            hide() { if (mountRoot.isConnected) mountRoot.remove(); return api; },
            toggle() { mountRoot.isConnected ? api.hide() : api.show(); return api; },
            toggleCollapse() {
                collapsed = !collapsed;
                bodyWrap.style.display = collapsed ? 'none' : 'flex';
                collapseBtn.textContent = collapsed ? '+' : '–';
                return api;
            },
            isCollapsed: () => collapsed,
            destroy() {
                api.hide();
                persistPos.cancel();
                frame.replaceChildren();
            },
        };
        header.addEventListener('pointerup', persistPos);

        for (const t of tabs) addTab(t);
        if (onReady) onReady(api);
        return api;
    }

    /* ── Settings console (schema-driven, switch toggles) ───────────────── */

    /**
     * Render a settings console into `rootEl`.
     * Schema: [{ key, type: 'bool'|'text'|'number'|'select', label, default,
     *            options?: [{value,label}], min?, max?, hint? }]
     * Values persist through Ψ.store under `ns`. Calls onChange(changedKey).
     */
    function settingsConsole(rootEl, ns, schema, onChange) {
        const get = (k, d) => Ψ.store.get(`${ns}:${k}`, d);
        const set = (k, v) => Ψ.store.set(`${ns}:${k}`, v);

        const rows = schema.map((field) => {
            const row = $new('div', { class: 'a4-panel', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' } });

            const labelBlock = $new('div', { style: { flex: '1' } },
                $new('div', { style: { fontSize: '12px', color: 'var(--a4-cyan)' } }, field.label),
                field.hint ? $new('div', { style: { fontSize: '10px', color: 'var(--a4-text-dim)' } }, field.hint) : null);

            let control;
            if (field.type === 'bool') {
                const input = $new('input', { type: 'checkbox' });
                input.checked = Boolean(get(field.key, field.default));
                control = $new('label', { class: 'a4-switch' }, input,
                    $new('span', { class: 'a4-trough' }, $new('span', { class: 'a4-node' })));
                input.addEventListener('change', () => {
                    set(field.key, input.checked);
                    if (onChange) onChange(field.key, input.checked);
                });
            } else if (field.type === 'select') {
                control = $new('select', { class: 'a4-input' });
                for (const opt of field.options || []) {
                    control.append($new('option', { value: opt.value }, opt.label));
                }
                control.value = String(get(field.key, field.default));
                control.addEventListener('change', () => {
                    set(field.key, control.value);
                    if (onChange) onChange(field.key, control.value);
                });
            } else {
                control = $new('input', { class: 'a4-input', type: field.type === 'number' ? 'number' : 'text', style: { width: '120px' } });
                if (field.min != null) control.min = field.min;
                if (field.max != null) control.max = field.max;
                control.value = String(get(field.key, field.default));
                control.addEventListener('change', () => {
                    let v = control.value;
                    if (field.type === 'number') {
                        v = Number(v);
                        if (!Number.isFinite(v)) v = field.default;
                        if (field.min != null) v = Math.max(field.min, v);
                        if (field.max != null) v = Math.min(field.max, v);
                        control.value = String(v);
                    }
                    set(field.key, v);
                    if (onChange) onChange(field.key, v);
                });
            }
            row.append(labelBlock, control);
            return row;
        });
        rootEl.replaceChildren(...rows);
        return { refresh: () => settingsConsole(rootEl, ns, schema, onChange) };
    }

    /* ── Floating glass console (log sink) ──────────────────────────────── */

    /**
     * A small draggable console pane with a bounded log ring buffer.
     * Returns {log, warn, error, debug, show, hide, toggle, clear, destroy}.
     */
    function consolePane({ title = 'Ψ console', capacity = 200 } = {}) {
        const lines = [];
        let box = null, listEl = null;

        const render = () => {
            if (!listEl) return;
            listEl.replaceChildren(...lines.slice(-50).map((l) =>
                $new('div', { style: { fontSize: '11px', padding: '2px 0', borderBottom: '1px solid rgba(0,229,255,0.08)', color: l.level === 'error' ? 'var(--a4-destructive)' : l.level === 'warn' ? '#FFD700' : 'var(--a4-cyan)' } },
                    `[${l.ts}] ${l.text}`)));
            listEl.scrollTop = listEl.scrollHeight;
        };

        const push = (level, text) => {
            lines.push({ level, text: String(text), ts: new Date().toLocaleTimeString() });
            if (lines.length > capacity) lines.splice(0, lines.length - capacity);
            render();
        };

        const api = {
            log: (t) => push('log', t),
            warn: (t) => push('warn', t),
            error: (t) => push('error', t),
            debug: (t) => push('debug', t),
            show() {
                if (!box) {
                    box = hud({
                        id: 'console',
                        title,
                        subtitle: Ψ.brand.SUITE + ' kernel ' + Ψ.brand.KERNEL_VERSION,
                        width: 420, height: 300,
                        tabs: [{
                            id: 'log', label: 'LOG',
                            render: (contentEl) => { listEl = contentEl; render(); },
                        }],
                    });
                }
                box.show();
                return api;
            },
            hide: () => { if (box) box.hide(); return api; },
            toggle: () => { if (box) box.toggle(); else api.show(); return api; },
            clear: () => { lines.length = 0; render(); return api; },
            destroy: () => { if (box) box.destroy(); box = null; listEl = null; },
        };
        return api;
    }

    return Object.freeze({ injectStyles, glyphEl, toast, hud, settingsConsole, consolePane, COMPONENT_CSS });
})();
    /* ══ kernel/store.js ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/store.js — resilient, namespaced, collision-free persistence
 * ----------------------------------------------------------------------------
 * GUP B.1 "Storage Resilience" institutionalized: values are ingested into
 * an in-memory snapshot once on boot; all writes are quota-guarded; every
 * key is namespaced per script so co-installed suite members can never
 * stomp each other's settings (a real interference class found in audit —
 * three scripts all using the bare key "settings").
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.store = (() => {
    'use strict';

    const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

    /* In-memory snapshot — the single boot-time ingest (GUP B.1). */
    const memory = new Map();
    const booted = false;

    const fullKey = (ns, key) => `${ns}::${key}`;

    function readRaw(key) {
        if (memory.has(key)) return memory.get(key);
        let v = undefined;
        if (hasGM) {
            try { v = GM_getValue(key, undefined); } catch (e) { console.debug('[a4/store] read failed:', key, e.message); }
        }
        if (v === undefined) {
            try {
                const raw = localStorage.getItem('a4:' + key);
                if (raw !== null) v = JSON.parse(raw);
            } catch (e) { /* quota/private-mode — memory store remains authoritative */ }
        }
        memory.set(key, v === undefined ? null : v);
        return v;
    }

    function writeRaw(key, value) {
        memory.set(key, value);
        if (hasGM) {
            try { GM_setValue(key, value); return; } catch (e) { console.debug('[a4/store] gm write failed:', key, e.message); }
        }
        try { localStorage.setItem('a4:' + key, JSON.stringify(value)); }
        catch (e) { console.debug('[a4/store] localStorage write failed (quota?):', key, e.message); }
    }

    /** Create a namespaced store facade. */
    function ns(prefix) {
        if (!prefix || typeof prefix !== 'string') throw new Error('store.ns: prefix required');
        const watchers = [];
        let valueListenerBound = false;
        const bindValueListener = () => {
            if (valueListenerBound || typeof GM_addValueChangeListener !== 'function') return;
            valueListenerBound = true;
            GM_addValueChangeListener(`${prefix}::*`, (name, oldV, newV, remote) => {
                // Cross-tab/cross-script sync for this namespace's keys.
                const key = name.slice(prefix.length + 2);
                const full = fullKey(prefix, key);
                memory.set(full, newV);
                for (const w of watchers) {
                    if (w.key === key) {
                        try { w.cb(newV, oldV, remote); }
                        catch (e) { console.debug('[a4/store] watcher failed:', key, e.message); }
                    }
                }
            });
        };

        return {
            /** Get with default. */
            get(key, dflt = null) {
                const v = readRaw(fullKey(prefix, key));
                return v === null || v === undefined ? dflt : v;
            },
            /** Quota-guarded set. */
            set(key, value) { writeRaw(fullKey(prefix, key), value); return value; },
            /** JSON get with default (objects/arrays). */
            getJson(key, dflt) {
                const v = this.get(key, null);
                if (v === null) return dflt;
                if (typeof v === 'string') {
                    try { return JSON.parse(v); } catch (e) { return dflt; }
                }
                return v;
            },
            /** JSON set. */
            setJson(key, value) { return this.set(key, JSON.stringify(value)); },
            /** Remove key. */
            remove(key) {
                memory.delete(fullKey(prefix, key));
                if (hasGM) {
                    try { GM_deleteValue(fullKey(prefix, key)); } catch (e) { console.debug('[a4/store] delete failed:', key, e.message); }
                }
                try { localStorage.removeItem('a4:' + fullKey(prefix, key)); } catch (e) { /* non-fatal */ }
            },
            /** Subscribe to key changes (local + cross-tab when supported). */
            watch(key, cb) {
                const entry = { key, cb };
                watchers.push(entry);
                bindValueListener();
                return () => {
                    const i = watchers.indexOf(entry);
                    if (i >= 0) watchers.splice(i, 1);
                };
            },
            /** Export entire namespace as a JSON string (settings migration). */
            export() {
                const out = {};
                const gmKeys = (hasGM && typeof GM_listValues === 'function') ? GM_listValues() : [];
                const seen = new Set();
                const scan = (keys, strip) => {
                    for (const k of keys) {
                        if (!k.startsWith(strip)) continue;
                        const shortKey = k.slice(strip.length);
                        if (shortKey.includes('::')) continue; // other namespaces
                        if (!seen.has(shortKey)) { seen.add(shortKey); out[shortKey] = readRaw(k); }
                    }
                };
                scan(gmKeys, `${prefix}::`);
                try {
                    scan(Object.keys(localStorage)
                        .filter((k) => k.startsWith('a4:'))
                        .map((k) => k.slice(3)), `${prefix}::`);
                } catch (e) { /* private mode */ }
                return JSON.stringify(out);
            },
            /** Import a namespace export (merge, non-destructive). */
            import(json) {
                let obj;
                try { obj = JSON.parse(json); } catch (e) { throw new Error('store.import: invalid JSON payload'); }
                for (const k of Object.keys(obj)) this.set(k, obj[k]);
                return true;
            },
        };
    }

    return Object.freeze({ ns, hasGM });
})();
    /* ══ kernel/hotkeys.js ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/hotkeys.js — collision-aware keybind registry
 * ----------------------------------------------------------------------------
 * Audit finding (real-world interference): Maximize_Any_Media's console and
 * ModelSearchBETA's overlay BOTH bind Alt+S — co-installed, both fire. This
 * registry fixes the class of bug:
 *
 *   - one keydown listener per script (module-scoped, capture phase);
 *   - built-in editable-context guard (typing never triggers — the
 *     ModelSearchBETA BUG-2 fix, generalized);
 *   - cross-script collision detection through a shared GM-storage ledger:
 *     every registration is recorded with its owning script; a conflicting
 *     registration from a different script logs a visible warning and
 *     registers a manager menu command listing the conflict.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hotkeys = (() => {
    'use strict';

    const LEDGER_KEY = 'a4::hotkeys::ledger';
    const LEDGER_MAX_AGE_MS = 45 * 24 * 3600 * 1000; // prune stale entries (uninstalled scripts)

    const bindings = new Map();       // combo -> [{id, handler, opts, script}]
    let listenerInstalled = false;
    let menuCommandRegistered = false;

    const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

    const isEditable = (target) => {
        if (!target) return false;
        if (EDITABLE_TAGS.has(target.tagName)) return true;
        return !!(target.isContentEditable);
    };

    /** Normalize a combo string: "alt+shift+s" ≡ "Shift+Alt+S" ≡ "s+alt+shift". */
    function normalizeCombo(combo) {
        const parts = String(combo).split('+').map((p) => p.trim()).filter(Boolean);
        if (parts.length === 0) throw new Error('hotkeys: empty combo');
        const mods = new Set();
        let key = '';
        for (const p of parts) {
            const up = p.toUpperCase();
            if (up === 'CTRL') mods.add('Ctrl');
            else if (up === 'CONTROL') mods.add('Ctrl');
            else if (up === 'ALT') mods.add('Alt');
            else if (up === 'SHIFT') mods.add('Shift');
            else if (up === 'META' || up === 'CMD' || up === 'SUPER') mods.add('Meta');
            else if (key) throw new Error(`hotkeys: combo "${combo}" has multiple non-modifier keys`);
            else key = up;
        }
        if (!key) throw new Error(`hotkeys: combo "${combo}" has no trigger key`);
        return [...mods].sort().join('+') + (mods.size ? '+' : '') + key;
    }

    const comboFromEvent = (e) => {
        const mods = [];
        if (e.ctrlKey) mods.push('Ctrl');
        if (e.altKey) mods.push('Alt');
        if (e.shiftKey) mods.push('Shift');
        if (e.metaKey) mods.push('Meta');
        const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        return mods.sort().join('+') + (mods.length ? '+' : '') + key;
    };

    /* ── Shared cross-script ledger (GM storage, synchronous) ───────────── */

    function readLedger() {
        let raw = null;
        try { raw = GM_getValue(LEDGER_KEY, null); } catch (e) { return {}; }
        if (!raw) return {};
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            // Prune entries from uninstalled scripts (age threshold).
            const now = Date.now();
            const out = {};
            for (const combo of Object.keys(parsed)) {
                out[combo] = (parsed[combo] || []).filter((entry) =>
                    now - (entry.ts || 0) < LEDGER_MAX_AGE_MS);
                if (out[combo].length === 0) delete out[combo];
            }
            return out;
        } catch (e) {
            console.debug('[a4/hotkeys] ledger unreadable — resetting');
            return {};
        }
    }

    function writeLedger(ledger) {
        try { GM_setValue(LEDGER_KEY, JSON.stringify(ledger)); }
        catch (e) { console.debug('[a4/hotkeys] ledger write failed:', e.message); }
    }

    function ledgerAdd(combo, script, id) {
        const ledger = readLedger();
        const list = ledger[combo] || [];
        if (!list.some((e) => e.script === script && e.id === id)) {
            list.push({ script, id, ts: Date.now() });
            ledger[combo] = list;
            writeLedger(ledger);
        }
        return ledger;
    }

    function ledgerRemove(combo, script, id) {
        const ledger = readLedger();
        if (!ledger[combo]) return;
        ledger[combo] = ledger[combo].filter((e) => !(e.script === script && e.id === id));
        if (ledger[combo].length === 0) delete ledger[combo];
        writeLedger(ledger);
    }

    function conflictReport(script, combo) {
        const ledger = readLedger();
        const others = (ledger[combo] || []).filter((e) => e.script !== script);
        return others;
    }

    /* ── Public API ──────────────────────────────────────────────────────── */

    /**
     * Register a hotkey.
     * @param {string} combo e.g. "Alt+Shift+S", "Ctrl+E", "F9"
     * @param {function(e:KeyboardEvent): void} handler
     * @param {{id?: string, script?: string, description?: string,
     *          allowInEditable?: boolean, preventDefault?: boolean}} [opts]
     * @returns {function()} unregister
     */
    function register(combo, handler, opts = {}) {
        const { id = 'anonymous', script = 'unknown', description = '',
                allowInEditable = false, preventDefault = true } = opts;
        const norm = normalizeCombo(combo);

        installListener();

        const entry = { id, handler, opts: { allowInEditable, preventDefault }, script };
        if (!bindings.has(norm)) bindings.set(norm, []);
        bindings.get(norm).push(entry);
        ledgerAdd(norm, script, id);

        const conflicts = conflictReport(script, norm);
        if (conflicts.length > 0) {
            console.warn(
                `[a4/hotkeys] CONFLICT: "${norm}" is also bound by ` +
                conflicts.map((c) => `${c.script}#${c.id}`).join(', ') +
                ' — only the first handler to call stopPropagation will win. Rebind one of them.');
            registerConflictMenu();
        }

        return () => {
            const list = bindings.get(norm);
            if (!list) return;
            const i = list.indexOf(entry);
            if (i >= 0) list.splice(i, 1);
            if (list.length === 0) bindings.delete(norm);
            ledgerRemove(norm, script, id);
        };
    }

    function installListener() {
        if (listenerInstalled) return;
        listenerInstalled = true;
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const norm = comboFromEvent(e);
            const list = bindings.get(norm);
            if (!list || list.length === 0) return;
            if (!list[0].opts.allowInEditable && isEditable(e.target)) return;
            try {
                if (list[0].opts.preventDefault) { e.preventDefault(); e.stopPropagation(); }
                list[0].handler(e);
            } catch (err) {
                console.debug('[a4/hotkeys] handler failed:', (err && err.message) || err);
            }
        }, true);
    }

    function registerConflictMenu() {
        if (menuCommandRegistered || typeof GM_registerMenuCommand !== 'function') return;
        menuCommandRegistered = true;
        GM_registerMenuCommand('Ψ Hotkey conflicts (suite-wide)', () => {
            const ledger = readLedger();
            const lines = [];
            for (const combo of Object.keys(ledger).sort()) {
                const owners = ledger[combo].map((e) => `${e.script}#${e.id}`);
                if (owners.length > 1) lines.push(`${combo} → ${owners.join(' vs ')}`);
            }
            const report = lines.length ? lines.join('\n') : 'No suite-wide hotkey conflicts detected.';
            console.log('[a4/hotkeys]\n' + report);
            if (Ψ.glass) Ψ.glass.toast(lines.length ? `${lines.length} hotkey conflict(s) — see console` : 'No hotkey conflicts', { type: lines.length ? 'error' : 'success' });
        });
    }

    /** Introspection: current in-script bindings. */
    function listBindings() {
        const out = [];
        for (const [combo, list] of bindings) {
            for (const e of list) out.push({ combo, id: e.id, script: e.script });
        }
        return out;
    }

    return Object.freeze({ register, listBindings, normalizeCombo });
})();

    /* ══ feature body ══ */
/* ═══════════════════════════════════════════════════════════════════════════
 * PageCraft — consolidated all-sites utility belt (superset of 4 legacy scripts)
 * ----------------------------------------------------------------------------
 * Absorbs, with zero feature loss (GUP superset gate):
 *   • SelectAllCheckboxes v1.2     → checkboxes module. The jQuery @require
 *     (the suite's ONLY runtime dependency) is eliminated: selection,
 *     range-selection via common-ancestor indices, and alt-hover activation
 *     are re-implemented natively with identical interaction semantics.
 *   • BrokenImgFixer v1.2          → imgfix module. The :-moz-broken feature
 *     probe, cache-bust idempotency (delete-then-set), hash-append
 *     fallback, and one-hop frame broadcast are preserved verbatim.
 *   • Collapse All Images v1.2.0   → collapse module. The hover-expand CSS
 *     (200px → 100% on hover) is preserved; now toggleable without reload
 *     and with a configurable thumbnail size (additive).
 *   • InfiniteBrave v1.0           → brave module. Offset paging, snippet
 *     cloning, insertion-point strategy, and hasMore detection preserved.
 *
 * New capabilities (additive): glass settings console; per-module toggles;
 * Alt+R wired through the collision-aware hotkey registry.
 * ═══════════════════════════════════════════════════════════════════════ */

const store = Ψ.store.ns('pagecraft');
const { $, $$, $new } = Ψ.core;

const MODULES = [
    { key: 'checkboxes', label: 'Bulk checkbox control', dflt: true,
      hint: 'Ctrl+Alt+Click = select all · Shift+Click = range · Alt+Hover = paint' },
    { key: 'imgfix', label: 'Broken-image auto-repair', dflt: true,
      hint: 'Detects failed images, reloads with cache-bust (Alt+R)' },
    { key: 'collapse', label: 'Collapse images (I/O governor)', dflt: false,
      hint: 'Thumbnails at 200px, full-size on hover — reduces page I/O' },
    { key: 'brave', label: 'Brave infinite scroll', dflt: true,
      hint: 'Auto-appends search result pages while scrolling' },
];

const enabled = (key) => store.get(`mod:${key}`, MODULES.find((m) => m.key === key).dflt);

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: checkboxes — superset of SelectAllCheckboxes v1.2 (de-jQueryed)
 * ═══════════════════════════════════════════════════════════════════════ */

(function checkboxesModule() {
    const CHECKBOX_SELECTOR = 'input[type="checkbox"]:enabled, .checkbox';
    let previousElement = null;

    const isCheckboxInput = (el) => el.tagName === 'INPUT' && el.type === 'checkbox';

    /** Click an element if it is an unchecked native checkbox or a custom
     *  checkbox-like node — a native .click() triggers all host listeners. */
    function checkElementIfNeeded(element) {
        try {
            if (isCheckboxInput(element) && element.checked) return;
            element.click();
        } catch (error) {
            console.error('[PageCraft] check element failed:', error, element);
        }
    }

    function selectAll() {
        try {
            for (const el of document.querySelectorAll(CHECKBOX_SELECTOR)) {
                checkElementIfNeeded(el);
            }
        } catch (error) {
            console.error('[PageCraft] selectAll failed:', error);
        }
    }

    /** Nearest common ancestor of two elements — native replacement for the
     *  legacy jQuery closest(parents().add().get().reverse()) construct. */
    function commonAncestor(a, b) {
        const seen = new Set();
        for (let n = a; n; n = n.parentElement) seen.add(n);
        for (let n = b; n; n = n.parentElement) {
            if (seen.has(n)) return n;
        }
        return null;
    }

    function selectRange(startElem, endElem) {
        if (!startElem || !endElem || startElem === endElem) return;

        const parent = commonAncestor(startElem, endElem);
        if (!parent) {
            console.warn('[PageCraft] no common parent — checking endpoints only.');
            checkElementIfNeeded(startElem);
            checkElementIfNeeded(endElem);
            return;
        }

        const inScope = Array.from(parent.querySelectorAll(CHECKBOX_SELECTOR));
        const startIndex = inScope.indexOf(startElem);
        const endIndex = inScope.indexOf(endElem);
        if (startIndex === -1 || endIndex === -1) {
            console.warn('[PageCraft] range markers not found in common parent.');
            return;
        }
        const lo = Math.min(startIndex, endIndex), hi = Math.max(startIndex, endIndex);
        for (const el of inScope.slice(lo, hi + 1)) checkElementIfNeeded(el);
    }

    /* Delegated mousedown — capture interaction semantics from the legacy
     * jQuery handlers exactly (primary button only, same modifier gates). */
    document.addEventListener('mousedown', (event) => {
        if (!enabled('checkboxes')) return;
        const target = event.target.closest ? event.target.closest(CHECKBOX_SELECTOR) : null;
        if (!target || event.button !== 0) return;

        try {
            if (event.ctrlKey && event.altKey && !event.shiftKey) {
                event.preventDefault();
                selectAll();
            } else if (event.shiftKey && !event.ctrlKey && !event.altKey && previousElement) {
                event.preventDefault();
                selectRange(previousElement, target);
            }
        } catch (error) {
            console.error('[PageCraft] mousedown handler failed:', error);
        }
        previousElement = target;
    }, true);

    /* Alt+hover paint (mouseenter ≈ pointerover with pointer-type mouse). */
    document.addEventListener('mouseover', (event) => {
        if (!enabled('checkboxes')) return;
        if (!(event.altKey && !event.shiftKey && !event.ctrlKey)) return;
        const target = event.target.closest ? event.target.closest(CHECKBOX_SELECTOR) : null;
        if (!target) return;
        try { checkElementIfNeeded(target); }
        catch (error) { console.error('[PageCraft] hover activation failed:', error); }
    }, true);

    if (typeof GM_registerMenuCommand === 'function') {
        const userLang = navigator.language || 'en';
        GM_registerMenuCommand(userLang.startsWith('zh') ? 'Ψ PageCraft — 全选' : 'Ψ PageCraft — Select All', selectAll);
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: imgfix — superset of BrokenImgFixer v1.2
 * ═══════════════════════════════════════════════════════════════════════ */

(function imgfixModule() {
    /* Debug hook (legacy BrokenImgFixer capability preserved): ship silent;
     * toggle in DevTools console — `window.__BIF_DEBUG = true` (legacy name
     * honored) or `window.__PAGECRAFT_DEBUG = true`. */
    const dbg = (...args) => {
        if (window.__BIF_DEBUG || window.__PAGECRAFT_DEBUG) {
            console.log('[PageCraft]', ...args);
        }
    };

    /* Feature-detect: `:-moz-broken` throws SyntaxError in Chromium. */
    let MOZ_BROKEN_SUPPORTED = false;
    try {
        document.querySelectorAll('[src]:-moz-broken');
        MOZ_BROKEN_SUPPORTED = true;
    } catch (e) {
        MOZ_BROKEN_SUPPORTED = false;
    }

    function isBroken(img) {
        if (!img.hasAttribute('src') || img.src === '') return false;
        if (img.complete && img.naturalWidth === 0) return true;
        if (MOZ_BROKEN_SUPPORTED) {
            try { if (img.matches('[src]:-moz-broken')) return true; }
            catch (e) { /* feature-detect false positive — suppressed */ }
        }
        return false;
    }

    function reloadImages() {
        const bustValue = String(Date.now());
        let count = 0;
        for (const img of document.images) {
            if (!isBroken(img)) continue;
            try {
                const url = new URL(img.src, window.location.href);
                url.searchParams.delete('_cache_bust');   // idempotent bust
                url.searchParams.set('_cache_bust', bustValue);
                img.src = url.toString();
                count++;
            } catch (error) {
                console.warn('[PageCraft] src parse failed; hash-append fallback.',
                    { src: img.src, error: error.message });
                const stripped = img.src.replace(/#.*$/, '');
                if (stripped) { img.src = stripped + '#'; count++; }
            }
        }
        dbg(`reloadImages: repaired ${count} broken image(s)`);
        return count;
    }

    function broadcastEvent() {
        for (const win of window.frames) {
            try {
                win.postMessage('RELOAD_BROKEN_IMAGES', '*');
            } catch (error) {
                if (error instanceof DOMException) {
                    if (error.name !== 'SecurityError') {
                        console.warn('[PageCraft] frame broadcast DOMException:', error.name, error.message);
                    }
                } else {
                    console.error('[PageCraft] unexpected frame broadcast error:', error);
                }
            }
        }
    }

    const initialScan = () => {
        dbg(`imgfix initial scan starting`);
        if (enabled('imgfix')) reloadImages();
    };

    /* Alt+R manual retrigger — now through the collision-aware registry
     * (legacy hard-bind collided with Recon's Alt+R when co-installed). */
    Ψ.hotkeys.register('Alt+R', () => {
        if (!enabled('imgfix')) return;
        const n = reloadImages();
        broadcastEvent();
        Ψ.glass.toast(n > 0 ? `Repaired ${n} broken image(s)` : 'No broken images found', { type: 'info' });
    }, { id: 'imgfix-reload', script: 'PageCraft' });

    window.addEventListener('message', (e) => {
        if (e.data === 'RELOAD_BROKEN_IMAGES' && enabled('imgfix')) {
            reloadImages();
            broadcastEvent();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialScan, { once: true });
    } else {
        initialScan();
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: collapse — superset of Collapse All Images v1.2.0
 * Legacy behavior: fixed 200px thumbnails expanding to full size on hover.
 * Additive: size configurable (100–480px), live toggle without reload.
 * ═══════════════════════════════════════════════════════════════════════ */

(function collapseModule() {
    const STYLE_ID = 'a4-pagecraft-collapse';

    function applyCollapse() {
        document.getElementById(STYLE_ID)?.remove();
        if (!enabled('collapse')) return;
        const size = store.get('collapse:size', 200);
        const style = $new('style', { id: STYLE_ID });
        style.textContent = `
img {
    transition: max-width 0.4s ease-in-out, max-height 0.4s ease-in-out;
    max-width: ${Number(size) || 200}px;
    max-height: ${Number(size) || 200}px;
    object-fit: contain;
}
img:hover { max-width: 100%; max-height: 100%; }`;
        (document.head || document.documentElement).append(style);
    }

    store.watch('mod:collapse', applyCollapse);
    store.watch('collapse:size', applyCollapse);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyCollapse, { once: true });
    } else {
        applyCollapse();
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: brave — superset of InfiniteBrave v1.0
 * ═══════════════════════════════════════════════════════════════════════ */

(function braveModule() {
    if (!/^(www\.)?search\.brave\.com$/.test(window.location.hostname)) return;

    const currentUrlParams = new URLSearchParams(window.location.search);
    const currentOffset = parseInt(currentUrlParams.get('offset') || '0', 10);
    let pageNumber = currentOffset + 1;
    let isLoading = false;
    let hasMore = true;

    const fetchNextPage = async () => {
        const baseUrl = new URL(window.location.href);
        baseUrl.searchParams.set('offset', pageNumber);
        try {
            const response = await fetch(baseUrl.toString());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            const newDoc = new DOMParser().parseFromString(text, 'text/html');

            const container = $new('div', { id: `page-${pageNumber}`, style: { marginTop: '20px' } });
            const results = newDoc.querySelectorAll('#results > .snippet');
            if (results.length === 0) { hasMore = false; return; }
            for (const result of results) container.append(result.cloneNode(true));

            const insertionPoint = document.querySelector('#pagination-snippet') ||
                (document.querySelector('#results') || {}).lastElementChild;
            if (insertionPoint) {
                insertionPoint.before(container);
            } else {
                const resultsContainer = document.querySelector('#results');
                if (resultsContainer) resultsContainer.append(container);
            }

            hasMore = !!newDoc.querySelector('a[href*="offset="]:not([disabled])');
            if (hasMore) pageNumber++;
        } catch (error) {
            console.error('[PageCraft] next page fetch failed:', error);
            hasMore = false;
        }
    };

    const onScroll = Ψ.core.throttle(async () => {
        if (!enabled('brave')) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) return;
        const scrollThreshold = 1000;
        const scrollPosition = window.innerHeight + window.scrollY;
        const scrollMax = document.documentElement.scrollHeight - scrollThreshold;
        if (!isLoading && hasMore && scrollPosition >= scrollMax) {
            isLoading = true;
            try { await fetchNextPage(); } finally { isLoading = false; }
        }
    }, 200);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', onScroll.cancel, { once: true });
})();

/* ═══════════════════════════════════════════════════════════════════════
 * Settings console (3lectric-Glass) + manager menu
 * ═══════════════════════════════════════════════════════════════════════ */

function openSettings() {
    Ψ.glass.injectStyles();
    const hud = Ψ.glass.hud({
        id: 'pagecraft-settings',
        title: 'PAGECRAFT',
        subtitle: 'page utility belt — ' + Ψ.brand.SUITE,
        width: 420, height: 380,
        tabs: [
            {
                id: 'modules', label: 'MODULES',
                render: (contentEl) => {
                    const schema = MODULES.map((m) => ({
                        key: `mod:${m.key}`, type: 'bool', label: m.label, default: m.dflt, hint: m.hint,
                    }));
                    schema.push({
                        key: 'collapse:size', type: 'number', label: 'Collapse thumbnail size (px)',
                        default: 200, min: 100, max: 480, hint: 'Applies live',
                    });
                    Ψ.glass.settingsConsole(contentEl, 'pagecraft', schema, (key) => {
                        if (key.startsWith('mod:')) {
                            Ψ.glass.toast(`${key.slice(4)} toggled`, { type: 'info' });
                        }
                    });
                },
            },
            {
                id: 'hotkeys', label: 'KEYS',
                render: (contentEl) => {
                    const rows = Ψ.hotkeys.listBindings()
                        .map((b) => $new('div', { class: 'a4-panel', style: { fontSize: '12px' } },
                            `${b.combo}  →  ${b.id} (${b.script})`));
                    contentEl.append(...(rows.length ? rows
                        : [$new('div', { class: 'a4-panel' }, 'No hotkeys registered on this page.')]));
                },
            },
        ],
    });
    hud.show();
}

if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Ψ PageCraft — settings console', openSettings);
}

})();
