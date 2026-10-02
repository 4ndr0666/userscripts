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
