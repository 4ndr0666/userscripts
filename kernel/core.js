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
     *
     * v1.4.4 VARIADIC REPAIR (live field report: "settings tabs do nothing,
     * console body empty"): the signature accepted exactly ONE child, but
     * glass.js and module bodies pass multiple children as EXTRA ARGUMENTS
     * (`$new('div', {style}, tabbar, content)`). JavaScript silently drops
     * surplus arguments — the 4th+ children vanished at construction time.
     * Blast radius: every glass HUD lost its title block + collapse button
     * (header: glyph, titleBlock, collapseBtn), every console lost its
     * `.a4-content` render target (bodyWrap: tabbar, content) so tab clicks
     * rendered into a DETACHED node — "nothing happens when clicked", the
     * exact operator report. Caught by live per-site integration testing,
     * missed by every static gate and the render-only smoke.
     *
     * Children now accept: any number of extra arguments, one or more
     * arrays (flattened one level deep per argument), null/undefined
     * entries skipped (conditional slots like `subtitle ? el : null`).
     */
    function $new(tag, attrs, ...rest) {
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
        const children = [];
        for (const c of rest) {
            if (Array.isArray(c)) children.push(...c);
            else children.push(c);
        }
        for (const child of children) {
            if (child == null) continue;
            el.append(child instanceof Node ? child : doc().createTextNode(String(child)));
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

    /* ── Trusted-Types-safe parsing (v1.4.2) ─────────────────────────── */

    /* DOMParser.parseFromString is a Trusted Types sink under
     * `require-trusted-types-for 'script'` enforcement — including the
     * image/svg+xml and application/xml MIME branches (field-proven:
     * YTPM v1.4.0's 54 uncaught TypeErrors on YouTube; HostWarp/PageCraft
     * settings-console deaths on TT hosts). Sites that enforce TT but do
     * NOT publish a `trusted-types` name allowlist accept any policy
     * name; sites WITH an allowlist reject ours — there the probe fails,
     * we fall back to the raw string, and the caller's existing try/catch
     * degrades the feature gracefully (parsing remote HTML on a locked
     * host is impossible by design; our own DOM building never needs it).
     *
     * Multi-name probe: co-installed suite scripts on the same page each
     * create their OWN policy (createPolicy throws on a taken name), so
     * the second and third suite instances walk down this list instead
     * of collapsing to the raw fallback. */
    const TT_POLICY_NAMES = ['4ndr0666tools#dom', '4ndr0666tools#dom.2', '4ndr0666tools#dom.3'];
    const tt = (() => {
        let policy = null, tried = false;
        const wrap = (s) => {
            if (!tried) {
                tried = true;
                try {
                    const TT = typeof trustedTypes !== 'undefined' && trustedTypes;
                    if (TT && typeof TT.createPolicy === 'function') {
                        for (const name of TT_POLICY_NAMES) {
                            try { policy = TT.createPolicy(name, { createHTML: (v) => v }); break; }
                            catch (e) { /* name taken (co-installed suite script) or CSP-blocked */ }
                        }
                    }
                } catch (e) { policy = null; }
            }
            return policy ? policy.createHTML(s) : s;
        };
        return Object.freeze({
            createHTML: wrap,
            /** Probe result: true when a TrustedHTML can be minted here. */
            available: () => { wrap(''); return policy !== null; },
        });
    })();

    /** Parse an HTML string into an inert Document — TT-safe on
     *  enforcing hosts (policy-wrapped when a policy can be minted).
     *  @param {string} str */
    function parseHTML(str) {
        return new DOMParser().parseFromString(tt.createHTML(str), 'text/html');
    }

    /** Parse an XML string (manifests, SVG sources) into a Document —
     *  TT-safe for the same reason. @param {string} str */
    function parseXML(str) {
        return new DOMParser().parseFromString(tt.createHTML(str), 'application/xml');
    }

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
        FIFOCache, escapeHTML, tt, parseHTML, parseXML,
        waitFor, watchDOM, trustedAppend,
    });
})();
