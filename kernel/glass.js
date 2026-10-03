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

    /* v1.3.0 facade repair: Ψ.store is a namespaced-store FACTORY
     * ({ns, hasGM}) — the get/set/getJson/setJson methods live on the
     * ns() facades, not on the factory. hud()/settingsConsole() previously
     * called Ψ.store.getJson(...) directly → TypeError inside hud()
     * construction → every glass settings console (HostWarp, PageCraft)
     * opened to nothing. All glass persistence now goes through one
     * glass-owned facade. */
    const glassStore = (Ψ.store && typeof Ψ.store.ns === 'function') ? Ψ.store.ns('a4:glass') : null;

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

    /* Live HUD registry per script instance — reopening the same console id
     * reuses the existing frame instead of stacking a duplicate window
     * (menu-click spam previously piled identical HUDs on top of each other). */
    const hudInstances = new Map();

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

        /* Reopen = show existing (dedup, v1.3.0). */
        const existing = hudInstances.get(id);
        if (existing) {
            existing.show();
            return existing;
        }

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

        /* Position: persisted store or bottom-right default. innerWidth can
         * be undefined in exotic contexts (stubbed windows, some iframes) —
         * the || fallbacks keep the default position a real number instead
         * of NaN (NaNpx leaves the HUD invisible/unrecoverable). */
        const saved = glassStore ? glassStore.getJson(`hud:pos:${id}`, null) : null;
        const vw = Number(window.innerWidth) || 1024;
        const vh = Number(window.innerHeight) || 768;
        const pos = position || saved || { x: Math.max(8, vw - width - 16), y: 64 };
        frame.style.left = pos.x + 'px';
        frame.style.top = pos.y + 'px';

        const persistPos = Ψ.core.debounce(() => {
            const r = frame.getBoundingClientRect();
            if (glassStore) glassStore.setJson(`hud:pos:${id}`, { x: r.left, y: r.top });
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
                hudInstances.delete(id);
                frame.replaceChildren();
            },
        };
        header.addEventListener('pointerup', persistPos);

        hudInstances.set(id, api);
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
        /* v1.3.0: same facade repair as hud() — keys are written through the
         * module's OWN namespace (Ψ.store.ns(ns)) so `mod:<key>` values read
         * by the module body (`store.get('mod:xyz')`) and values written by
         * this console land on the identical storage key. The previous
         * direct Ψ.store.get/set calls not only crashed — they built keys
         * in a different scheme than any reader. */
        const store = (Ψ.store && typeof Ψ.store.ns === 'function') ? Ψ.store.ns(ns) : null;
        const get = (k, d) => (store ? store.get(k, d) : d);
        const set = (k, v) => { if (store) store.set(k, v); };

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
