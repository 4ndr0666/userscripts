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
        const gmListenerKeys = new Set();

        /* v1.3.0 watch() repair — two defects fixed:
         *   (a) the GM cross-tab listener was registered ONCE on the literal
         *       key `${prefix}::*` — GM_addValueChangeListener matches EXACT
         *       keys, the `*` is not a wildcard, so remote changes never fired
         *       any watcher;
         *   (b) set() never notified local watchers at all, so even same-tab
         *       live-apply (PageCraft's collapse governor) was dead.
         * Listeners are now bound per exact key, and set() notifies local
         * watchers synchronously (remote=false) before returning. */
        const notifyLocal = (key, newV, oldV) => {
            for (const w of watchers) {
                if (w.key === key) {
                    try { w.cb(newV, oldV, false); }
                    catch (e) { console.debug('[a4/store] watcher failed:', key, e.message); }
                }
            }
        };
        const bindValueListener = (fullK) => {
            if (typeof GM_addValueChangeListener !== 'function' || gmListenerKeys.has(fullK)) return;
            gmListenerKeys.add(fullK);
            GM_addValueChangeListener(fullK, (name, oldV, newV, remote) => {
                memory.set(fullK, newV);
                const key = name.slice(prefix.length + 2);
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
            /** Quota-guarded set. Notifies local watchers (v1.3.0). */
            set(key, value) {
                const full = fullKey(prefix, key);
                const oldV = readRaw(full);
                writeRaw(full, value);
                notifyLocal(key, value, oldV);
                return value;
            },
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
                bindValueListener(fullKey(prefix, key));
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
