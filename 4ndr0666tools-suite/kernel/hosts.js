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

    const handlers = new Map();   // "candidshiny.com" -> { id, match, handler, script }
    const executed = new Set();   // idempotency: one execution per page load

    /**
     * Register a host handler.
     * @param {string|string[]} domains registrable domains, e.g. "t.me" or ["simpcity.cr", "simpcity.su"]
     * @param {function(ctx:{hostname:string, enabled:function():boolean}): void} handler
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

    /** Longest-suffix match against location.hostname. */
    function resolve(hostname = location.hostname) {
        const host = String(hostname).toLowerCase().replace(/^www\./, '');
        const labels = host.split('.');
        for (let take = labels.length; take >= 2; take--) {
            const candidate = labels.slice(labels.length - take).join('.');
            if (handlers.has(candidate)) return { domain: candidate, entries: handlers.get(candidate) };
        }
        return null;
    }

    /**
     * Dispatch every handler whose domain matches the current hostname.
     * Idempotent per handler id (safe to call from document-start AND
     * document-idle bootstrap paths). Returns the number of handlers run.
     */
    function run() {
        const hit = resolve();
        if (!hit) return 0;
        let ran = 0;
        for (const entry of [...hit.entries]) {
            if (executed.has(entry.id)) continue;
            executed.add(entry.id);
            try {
                entry.handler({ hostname: location.hostname, domain: hit.domain });
                ran++;
            } catch (e) {
                console.debug(`[a4/hosts] handler "${entry.id}" failed:`, (e && e.message) || e);
            }
        }
        return ran;
    }

    /** Introspection for the settings console: registered domains. */
    function listDomains() {
        return [...handlers.keys()].sort();
    }

    return Object.freeze({ on, resolve, run, listDomains });
})();
