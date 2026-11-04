/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/hosts.js — longest-suffix domain resolver (the HostWarp engine)
 * ----------------------------------------------------------------------------
 * Generalizes the domain-handler pattern proven in HDImgsOnly: handlers
 * registered per registrable domain, dispatched by longest-suffix match so
 * `forum.candidshiny.com` resolves to the `candidshiny.com` handler and
 * never to an unrelated suffix. Every handler executes inside an isolated
 * try/catch (GUP D6): a broken host module can never take down the page or
 * its sibling modules.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hosts = (() => {
    'use strict';

    const handlers = new Map();   // "candidshiny.com" -> [{ id, handler, script }, …] (arrays: several modules may share a registrable domain)
    const executed = new Set();   // idempotency: one execution per page load

    /**
     * Register a host handler.
     * @param {string|string[]} domains registrable domains, e.g. "t.me" or ["simpcity.cr", "simpcity.su"]
     * @param {function(ctx:{hostname:string, domain:string}): void} handler
     * WO-01 round-2 (6-b F10): the JSDoc promised ctx.enabled — run() passes
     * {hostname, domain} (the registrable domain that matched).
     * @param {{id?: string, script?: string}} [opts]
     * @returns {function()} unregister
     */
    function on(domains, handler, opts = {}) {
        const id = opts.id || Ψ.core.uid('host');
        const list = Array.isArray(domains) ? domains : [domains];
        const entries = list.map((d) => {
            const key = String(d).toLowerCase().replace(/^www\./, '').replace(/^\.+|\.+$/g, '');
            const entry = { id, handler, script: opts.script || 'unknown' };
            if (!handlers.has(key)) handlers.set(key, []);
            handlers.get(key).push(entry);
            return [key, entry];
        });
        return () => {
            for (const [key, entry] of entries) {
                const arr = handlers.get(key);
                if (!arr) continue;
                const i = arr.indexOf(entry);
                if (i >= 0) arr.splice(i, 1);
                if (arr.length === 0) handlers.delete(key);
            }
        };
    }

    /** Longest-suffix match against location.hostname. WO-01 round-1
     * (F-08): `take >= 1` — single-label hostnames (localhost, intranet
     * names) were structurally unreachable under the old `take >= 2` floor.
     * TLD-length probes are harmless: a handler registered on "com" would
     * be an explicit registration, not an accident this resolver creates. */
    function resolve(hostname = location.hostname) {
        const host = String(hostname).toLowerCase().replace(/^www\./, '');
        const labels = host.split('.');
        for (let take = labels.length; take >= 1; take--) {
            const candidate = labels.slice(labels.length - take).join('.');
            if (handlers.has(candidate)) return { domain: candidate, entries: handlers.get(candidate) };
        }
        return null;
    }

    /**
     * Dispatch every handler whose domain matches the current hostname.
     * Idempotent per handler id (safe to call from document-start AND
     * document-idle bootstrap paths). Returns the number of handlers that
     * completed.
     *
     * WO-01 round-18 (R18-F01) — the retry-signal contract: the once-only
     * `executed` latch used to engage BEFORE the handler ran, so the
     * document-start dispatch consumed DOM-dependent handlers on pages
     * whose content only exists after the parse (every image-host
     * interstitial: run #1 found no `.pic` — nothing in the DOM yet —
     * latched the id, and the DOMContentLoaded re-run was a no-op;
     * retryHandlersRun=0, the URL stayed interstitial forever). A handler
     * may now return `false` to signal "incomplete — re-dispatch me on the
     * next run()"; a THROWN handler is equally not latched. Re-dispatch is
     * bounded by the boot contract itself (run() is only invoked from the
     * document-start + DOMContentLoaded pair in the hostwarp body, and the
     * re-entrancy guard below keeps a handler that calls hosts.run()
     * from looping). Handlers that return undefined (every handler that
     * predates the contract) keep the exact settle-on-first-dispatch
     * semantics they shipped with — the superset holds.
     */
    let dispatching = false;
    function run() {
        if (dispatching) return 0;
        const hit = resolve();
        if (!hit) return 0;
        let ran = 0;
        dispatching = true;
        try {
            for (const entry of [...hit.entries]) {
                if (executed.has(entry.id)) continue;
                let complete = true;
                try {
                    const result = entry.handler({ hostname: location.hostname, domain: hit.domain });
                    complete = result !== false;
                } catch (e) {
                    complete = false;
                    console.debug(`[a4/hosts] handler "${entry.id}" failed:`, (e && e.message) || e);
                }
                if (complete) { executed.add(entry.id); ran++; }
            }
        } finally {
            dispatching = false;
        }
        return ran;
    }

    /** Introspection for the settings console: registered domains. */
    function listDomains() {
        return [...handlers.keys()].sort();
    }

    return Object.freeze({ on, resolve, run, listDomains });
})();
