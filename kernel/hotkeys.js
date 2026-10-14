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
