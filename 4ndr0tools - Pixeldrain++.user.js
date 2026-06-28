// ==UserScript==
// @name         4ndr0tools - Pixeldrain++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.1
// @description  Enhanced pixeldrain with multi-proxy parallel, streaming, adaptive chunking, aria2c.
// @author       4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixeldrain++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixeldrain++.user.js
// @match           https://pixeldrain.com/*
// @match           https://pixeldrain.net/*
// @match           https://pixeldrain.dev/*
// @match           https://pixeldra.in/*
// @run-at          document-start
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @grant           GM_download
// @grant           GM_openInTab
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_listValues
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @grant           GM_notification
// @grant           GM_setClipboard
// @grant           unsafeWindow
// @connect         pixeldrain.com
// @connect         pixeldrain.net
// @connect         pixeldrain.dev
// @connect         pixeldra.in
// @connect         cdn.pixeldrain.eu.cc
// @connect         pixeldrain.eu.cc
// @connect         pd.1drv.eu.org
// @connect         pd.cybar.xyz
// @connect         pd.zeroken.id
// @connect         pd.hakimi.uk
// @connect         pd.512.gay
// @connect         pd.voidnet.tech
// @connect         pd.kanibal.xyz
// @connect         pd.arcjbtc.my.id
// @connect         pd.ramdani.cloud
// @connect         pd.noisyfox.io
// @connect         pd.meridian.pm
// @connect         pd.dwnld.workers.dev
// @connect         pd.itsmeonly.workers.dev
// @connect         pd.blazing.works
// @connect         pd.unblockit.click
// @connect         127.0.0.1
// @connect         localhost
// @connect         *
// ==/UserScript==

/* eslint-disable no-undef */
(function () {
    'use strict';

    // ================================================================
    // 0. CONFIG & CONSTANTS
    // ================================================================
    const VERSION = '7.0.2';
    const NS = 'pdbp';
    const BANDWIDTH_CAP = 6 * 1024 * 1024 * 1024;
    const SPEED_LIMIT_PER_CONN = 1048576; // 1 MB/s server-enforced per connection
    const RATE_LIMIT_MAX = 3000;
    const RECAPTCHA_SITEKEY = '6Lfbzz4UAAAAAAaBgox1R7jU0axiGneLDkOA-PKf';

    // Updated proxy listing containing active community mirrors
    const PROXY_MIRRORS = [
        { name: 'pixeldrain.eu.cc',     host: 'cdn.pixeldrain.eu.cc',       priority: 1,  range: true,  zip: true,  weight: 100 },
        { name: '1drv.eu.org',          host: 'pd.1drv.eu.org',             priority: 2,  range: true,  zip: false, weight: 90  },
        { name: 'cybar.xyz',            host: 'pd.cybar.xyz',               priority: 3,  range: true,  zip: false, weight: 85  },
        { name: 'zeroken.id',           host: 'pd.zeroken.id',              priority: 4,  range: true,  zip: false, weight: 80  },
        { name: 'pixeldrain.eu.cc-alt', host: 'pixeldrain.eu.cc',           priority: 5,  range: true,  zip: false, weight: 75  },
        { name: 'hakimi.uk',            host: 'pd.hakimi.uk',               priority: 6,  range: true,  zip: false, weight: 70  },
        { name: '512.gay',              host: 'pd.512.gay',                 priority: 7,  range: true,  zip: false, weight: 65  },
        { name: 'voidnet.tech',         host: 'pd.voidnet.tech',            priority: 8,  range: true,  zip: false, weight: 60  },
        { name: 'kanibal.xyz',          host: 'pd.kanibal.xyz',             priority: 9,  range: true,  zip: false, weight: 55  },
        { name: 'arcjbtc.my.id',        host: 'pd.arcjbtc.my.id',           priority: 10, range: true,  zip: false, weight: 50  },
        { name: 'ramdani.cloud',        host: 'pd.ramdani.cloud',           priority: 11, range: true,  zip: false, weight: 45  },
        { name: 'noisyfox.io',          host: 'pd.noisyfox.io',             priority: 12, range: true,  zip: false, weight: 40  },
        { name: 'meridian.pm',          host: 'pd.meridian.pm',             priority: 13, range: true,  zip: false, weight: 35  },
        { name: 'dwnld.workers.dev',    host: 'pd.dwnld.workers.dev',       priority: 14, range: true,  zip: false, weight: 30  },
        { name: 'itsmeonly.workers.dev', host: 'pd.itsmeonly.workers.dev',  priority: 15, range: true,  zip: false, weight: 25  },
        { name: 'blazing.works',        host: 'pd.blazing.works',           priority: 16, range: true,  zip: false, weight: 20  }
    ];

    const DIRECT_HOSTS = ['pixeldrain.com', 'pixeldrain.net', 'pixeldrain.dev', 'pixeldra.in'];

    const DEFAULTS = {
        primaryStrategy: 'auto',
        autoFailover: true,

        // Auth (Layer A)
        apiKey: '',
        useDirectIfAuth: true,
        preferDirectForLarge: true,
        directThresholdBytes: 50 * 1024 * 1024,

        // Proxy
        proxyHealthTtl: 5 * 60 * 1000,
        healthCheckTimeoutMs: 6000,
        healthProbeId: '',

        // Speed multiplication (exploit 1MB/s per-connection limit)
        speedMultiplier: true,
        connectionsPerMirror: 4,
        maxTotalConnections: 32,

        // Multi-proxy chunked
        multiProxyChunks: 16,
        chunkConcurrency: 16,
        chunkRetry: 5,
        chunkSizeMin: 512 * 1024,
        chunkSizeMax: 8 * 1024 * 1024,
        adaptiveChunking: true,

        // Circuit breaker
        circuitBreakerThreshold: 3,
        circuitBreakerCooldown: 30000,

        // Misc
        retryBackoffMs: 800,
        retryBackoffMultiplier: 1.5,
        maxRetries: 5,
        downloadTimeoutMs: 60 * 60 * 1000,
        preflightCheck: true,

        // Bypass
        bypassVideoLogged: true,
        bypassViewerContinuous: true,
        bypassShowAds: true,
        autoTriggerOnLoad: false,
        viewPadEnabled: true,

        // Captcha
        captchaAutoDetect: true,
        captchaAutoOpen: true,
        captchaPreCheck: true,

        // Resume
        resumableEnabled: true,
        resumeMaxAge: 86400000,

        // Bandwidth tracker
        bandwidthTracker: true,
        bandwidthWarningPct: 80,

        // Custom proxy hosts (comma-separated)
        customProxy: '',

        // External downloaders
        jdownloaderUrl: 'http://127.0.0.1:9666/flash/addcnl',
        aria2RpcUrl: 'http://127.0.0.1:6800/jsonrpc',
        aria2Secret: '',
        aria2MaxConn: 16,
        aria2Split: 16,

        // UI
        notificationsEnabled: true,
        compactUI: false,
        showSpeedGraph: true,
        debugLog: false,
        downloadStats: { count: 0, bytes: 0, savedBandwidth: 0, lastReset: Date.now() }
    };

    const STORAGE_KEY = `${NS}_settings_v7`;
    const RESUME_KEY = `${NS}_resume_jobs_v7`;
    const BANDWIDTH_KEY = `${NS}_bandwidth_v7`;
    const HEALTH_KEY = `${NS}_health_scores_v7`;

    const SPOOF_HEADERS = {
        'Referer': 'https://pixeldrain.com/',
        'Origin': 'https://pixeldrain.com'
    };

    // ================================================================
    // 1. STORAGE
    // ================================================================
    const Store = (() => {
        const hasGM = typeof GM_getValue === 'function';
        return {
            get: (k, def) => { try { if (hasGM) return GM_getValue(k, def); const raw = localStorage.getItem(k); return raw == null ? def : JSON.parse(raw); } catch { return def; } },
            set: (k, v) => { try { if (hasGM) return GM_setValue(k, v); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error(`[${NS}]`, e); } },
            del: (k) => { try { if (hasGM && typeof GM_deleteValue === 'function') return GM_deleteValue(k); localStorage.removeItem(k); } catch {} }
        };
    })();
    function loadSettings() { return Object.assign({}, DEFAULTS, Store.get(STORAGE_KEY, {}) || {}); }
    function saveSettings(patch) { const next = Object.assign({}, loadSettings(), patch); Store.set(STORAGE_KEY, next); return next; }
    let SETTINGS = loadSettings();

    // ================================================================
    // 2. UTILITIES
    // ================================================================
    const Log = {
        _on: () => SETTINGS.debugLog,
        info: (...a) => { if (Log._on()) console.log(`[${NS}]`, ...a); },
        warn: (...a) => console.warn(`[${NS}]`, ...a),
        error: (...a) => console.error(`[${NS}]`, ...a)
    };
    function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'xxxx-xxxx-xxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)); }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function escapeHTML(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
    function sanitizeFilename(n) { return String(n || 'download').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'download'; }
    function formatBytes(b) { if (!b) return '0 B'; const u = ['B', 'KB', 'MB', 'GB', 'TB']; const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), u.length - 1); return (b / Math.pow(1024, i)).toFixed(i ? 1 : 0) + ' ' + u[i]; }
    function formatSpeed(bps) { return bps ? formatBytes(bps) + '/s' : ''; }
    function formatETA(rem, spd) { if (!spd) return '--:--'; const s = Math.ceil(rem / spd); return s > 3600 ? `${Math.floor(s / 3600)}h${Math.floor((s % 3600) / 60)}m` : s > 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`; }
    function formatDuration(ms) { const s = Math.floor(ms / 1000); return s > 60 ? `${Math.floor(s / 60)}m${s % 60}s` : `${s}s`; }
    function b64(s) { try { return btoa(s); } catch { return s; } }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
    function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

    // ================================================================
    // 3. CAPABILITIES DETECTION
    // ================================================================
    const Caps = {
        gmXHR: typeof GM_xmlhttpRequest === 'function' || (typeof GM !== 'undefined' && GM && GM.xmlHttpRequest),
        gmDownload: typeof GM_download === 'function',
        gmOpenInTab: typeof GM_openInTab === 'function',
        gmAddStyle: typeof GM_addStyle === 'function',
        gmClipboard: typeof GM_setClipboard === 'function',
        gmNotification: typeof GM_notification === 'function',
        fsAccess: typeof window.showSaveFilePicker === 'function',
        streams: typeof ReadableStream !== 'undefined' && typeof WritableStream !== 'undefined',
        wasm: typeof WebAssembly !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
        transferable: typeof structuredClone === 'function'
    };

    // ================================================================
    // 4. GM_xmlhttpRequest WRAPPER (Referer-spoofed)
    // ================================================================
    function gmXHR(opts) {
        return new Promise((resolve, reject) => {
            const xhr = typeof GM_xmlhttpRequest === 'function'
                ? GM_xmlhttpRequest
                : (typeof GM !== 'undefined' && GM.xmlHttpRequest);
            if (!xhr) { reject(new Error('GM_xmlhttpRequest unavailable')); return; }

            let aborted = false;
            const headers = Object.assign({}, opts.spoof === false ? {} : SPOOF_HEADERS, opts.headers || {});

            const handle = xhr({
                method: opts.method || 'GET',
                url: opts.url,
                headers,
                data: opts.data,
                responseType: opts.responseType,
                timeout: opts.timeout || 60000,
                anonymous: opts.anonymous !== false,
                onload: (r) => { if (!aborted) resolve(r); },
                onerror: (e) => { if (!aborted) reject(new Error(`network: ${(e && (e.error || e.statusText)) || 'unknown'}`)); },
                ontimeout: () => { if (!aborted) reject(new Error('timeout')); },
                onprogress: opts.onprogress,
                onloadstart: opts.onloadstart
            });
            if (opts.signal) {
                opts.signal.addEventListener('abort', () => {
                    aborted = true;
                    try { handle && handle.abort && handle.abort(); } catch {}
                    reject(new Error('aborted'));
                });
            }
        });
    }

    // ================================================================
    // 5. BANDWIDTH TRACKER
    // ================================================================
    const BandwidthTracker = {
        _data: null,
        load() {
            if (!this._data) {
                this._data = Store.get(BANDWIDTH_KEY, { used: 0, windowStart: Date.now(), history: [] });
                if (Date.now() - this._data.windowStart > 86400000) {
                    this._data = { used: 0, windowStart: Date.now(), history: [] };
                    this.save();
                }
            }
            return this._data;
        },
        save() { Store.set(BANDWIDTH_KEY, this._data); },
        add(bytes, viaProxy = true) {
            const d = this.load();
            if (!viaProxy) d.used += bytes;
            d.history.push({ ts: Date.now(), bytes, proxy: viaProxy });
            if (d.history.length > 500) d.history = d.history.slice(-200);
            this.save();
        },
        getUsed() { return this.load().used; },
        getRemaining() { return Math.max(0, BANDWIDTH_CAP - this.getUsed()); },
        getPct() { return (this.getUsed() / BANDWIDTH_CAP) * 100; },
        isNearCap() { return this.getPct() >= SETTINGS.bandwidthWarningPct; },
        reset() { this._data = { used: 0, windowStart: Date.now(), history: [] }; this.save(); },
        getSpeedHistory(windowMs = 30000) {
            const d = this.load();
            const cutoff = Date.now() - windowMs;
            return d.history.filter(h => h.ts > cutoff);
        }
    };

    // ================================================================
    // 6. PIXELDRAIN API (metadata + auth-aware + pre-flight)
    // ================================================================
    const PDApi = {
        _authHeader() {
            const k = (SETTINGS.apiKey || '').trim();
            return k ? { 'Authorization': 'Basic ' + b64(':' + k) } : null;
        },
        _gmFetch(url, opts = {}) {
            return gmXHR(Object.assign({
                url,
                spoof: false,
                anonymous: !this._authHeader(),
                headers: Object.assign({ 'Accept': 'application/json' }, this._authHeader() || {}, opts.headers || {})
            }, opts));
        },
        async fileInfo(id) {
            try {
                const r = await this._gmFetch(`https://pixeldrain.com/api/file/${id}/info`, { responseType: 'json', timeout: 10000 });
                if (r.status >= 200 && r.status < 300) return r.response || JSON.parse(r.responseText);
                throw new Error(`HTTP ${r.status}`);
            } catch (e) {
                const r = await fetch(`https://pixeldrain.com/api/file/${id}/info`, { credentials: 'omit' });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            }
        },
        async listInfo(id) {
            const r = await fetch(`https://pixeldrain.com/api/list/${id}`, { credentials: 'omit' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        },
        async fsPath(path) {
            const r = await fetch(`https://pixeldrain.com/api/filesystem/${path}?stat`, { credentials: 'omit' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        },
        async user() {
            if (!this._authHeader()) return null;
            try {
                const r = await this._gmFetch('https://pixeldrain.com/api/user', { responseType: 'json', timeout: 10000 });
                if (r.status >= 200 && r.status < 300) return r.response || JSON.parse(r.responseText);
            } catch {}
            return null;
        },
        directURL(id, { download = false } = {}) {
            return `https://pixeldrain.com/api/file/${id}${download ? '?download' : ''}`;
        },
        async preflight(id) {
            try {
                const info = await this.fileInfo(id);
                const result = {
                    ok: true,
                    id: info.id,
                    name: info.name,
                    size: info.size,
                    mime: info.mime_type,
                    canDownload: info.can_download !== false,
                    availability: info.availability || '',
                    availabilityMessage: info.availability_message || '',
                    needsCaptcha: false,
                    speedLimit: info.download_speed_limit || SPEED_LIMIT_PER_CONN,
                    showAds: info.show_ads || false
                };
                if (result.availability) {
                    const av = result.availability.toLowerCase();
                    result.needsCaptcha = av.includes('captcha') || av.includes('rate_limited') || av.includes('transfer_limited');
                    result.isVirus = av.includes('virus');
                    result.isBanned = av.includes('banned') || av.includes('abuse');
                }
                return result;
            } catch (e) {
                return { ok: false, error: e.message };
            }
        },
        async viewPad(id, count = 1) {
            if (!SETTINGS.viewPadEnabled) return;
            for (let i = 0; i < count; i++) {
                try {
                    await fetch(`https://pixeldrain.com/u/${id}`, {
                        method: 'GET',
                        credentials: 'omit',
                        headers: { 'Accept': 'text/html' },
                        redirect: 'follow'
                    });
                } catch {}
                if (i < count - 1) await sleep(200);
            }
            Log.info(`view-pad: +${count} views for ${id}`);
        }
    };

    // ================================================================
    // 7. CIRCUIT BREAKER (per-mirror failure tracking)
    // ================================================================
    const CircuitBreaker = {
        _state: new Map(),

        record(host, success) {
            if (!this._state.has(host)) this._state.set(host, { failures: 0, lastFailure: 0, open: false, successes: 0 });
            const s = this._state.get(host);
            if (success) {
                s.successes++;
                s.failures = Math.max(0, s.failures - 1);
                s.open = false;
            } else {
                s.failures++;
                s.lastFailure = Date.now();
                if (s.failures >= SETTINGS.circuitBreakerThreshold) {
                    s.open = true;
                    Log.warn(`Circuit OPEN for ${host} (${s.failures} failures)`);
                }
            }
        },

        isOpen(host) {
            const s = this._state.get(host);
            if (!s || !s.open) return false;
            if (Date.now() - s.lastFailure > SETTINGS.circuitBreakerCooldown) {
                s.open = false;
                s.failures = Math.floor(s.failures / 2);
                Log.info(`Circuit half-open for ${host}`);
                return false;
            }
            return true;
        },

        getScore(host) {
            const s = this._state.get(host);
            if (!s) return 100;
            const total = s.successes + s.failures;
            if (total === 0) return 100;
            return Math.round((s.successes / total) * 100);
        },

        reset(host) {
            if (host) this._state.delete(host);
            else this._state.clear();
        },

        getAll() { return Object.fromEntries(this._state); }
    };

    // ================================================================
    // 8. PROXY MANAGER (Health Checking Hardened)
    // ================================================================
    const ProxyManager = {
        _blocked: new Set(),
        _cache: { ts: 0, results: null },
        _scores: null,

        _loadScores() {
            if (!this._scores) this._scores = Store.get(HEALTH_KEY, {}) || {};
            return this._scores;
        },
        _saveScores() { Store.set(HEALTH_KEY, this._scores || {}); },

        list() {
            const proxies = PROXY_MIRRORS.slice();
            if (SETTINGS.customProxy && SETTINGS.customProxy.trim()) {
                SETTINGS.customProxy.split(',').map(h => h.trim()).filter(Boolean).forEach((h, i) => {
                    proxies.unshift({
                        name: `custom-${i + 1}`,
                        host: h.replace(/^https?:\/\//, '').replace(/\/+$/, ''),
                        priority: 0,
                        range: true,
                        zip: false,
                        weight: 110
                    });
                });
            }
            const active = proxies
                .filter(p => !this._blocked.has(p.host))
                .filter(p => !CircuitBreaker.isOpen(p.host))
                .sort((a, b) => {
                    const sa = this._getHealthScore(a.host);
                    const sb = this._getHealthScore(b.host);
                    if (sb !== sa) return sb - sa;
                    return a.priority - b.priority;
                });

            // Fallback emergency loop: If logic drops all mirrors to dead states, restore baseline to prevent bricked script executions.
            if (active.length === 0) {
                Log.warn("All proxy nodes reported failing status logic; resetting pools to prevent deadlock.");
                this.unblockAll();
                return proxies.slice(0, 3);
            }
            return active;
        },

        _getHealthScore(host) {
            const scores = this._loadScores();
            const stored = scores[host] || { latency: 1000, successRate: 0.5 };
            const cbScore = CircuitBreaker.getScore(host);
            return Math.round((stored.successRate * 50) + (cbScore * 0.3) + (Math.max(0, 2000 - stored.latency) / 20));
        },

        markBlocked(host) { this._blocked.add(host); Log.warn(`Blocked: ${host}`); },
        unblockAll() { this._blocked.clear(); this._cache = { ts: 0, results: null }; CircuitBreaker.reset(); },

        url(proxy, id, { download = false, zip = false } = {}) {
            return `https://${proxy.host}/${zip ? id + '/zip' : id}${download ? '?download' : ''}`;
        },

        async check(proxy, probeId) {
            const start = performance.now();
            const id = probeId || SETTINGS.healthProbeId || '';

            // PROXY HARDENING FIX: Avoid sending raw directory base paths which drop 403/405 Cloudflare codes.
            // Probe using an active metadata pattern or execute a safer GET option.
            const url = id ? this.url(proxy, id) : `https://${proxy.host}/`;

            try {
                const r = await gmXHR({
                    method: id ? 'HEAD' : 'GET',
                    url,
                    timeout: SETTINGS.healthCheckTimeoutMs,
                    headers: { 'Accept': '*/*' }
                });
                const ms = performance.now() - start;

                // Allow alternate server status responses like 404 or 405 to register as alive
                // as long as they prove the infrastructure is up and listening.
                const ok = r.status >= 200 && r.status < 500 && r.status !== 403;
                if (r.status === 403) this.markBlocked(proxy.host);

                const scores = this._loadScores();
                if (!scores[proxy.host]) scores[proxy.host] = { latency: ms, successRate: ok ? 1 : 0, checks: 0 };
                const s = scores[proxy.host];
                s.checks++;
                s.latency = (s.latency * 0.7) + (ms * 0.3);
                s.successRate = (s.successRate * 0.8) + ((ok ? 1 : 0) * 0.2);
                this._saveScores();
                CircuitBreaker.record(proxy.host, ok);
                return { ok, ms, proxy, status: r.status };
            } catch (e) {
                CircuitBreaker.record(proxy.host, false);
                return { ok: false, ms: performance.now() - start, proxy, error: e.message };
            }
        },

        async checkAll(force = false, probeId = '') {
            if (!force && this._cache.results && Date.now() - this._cache.ts < SETTINGS.proxyHealthTtl) return this._cache.results;
            const results = await Promise.all(PROXY_MIRRORS.map(p => this.check(p, probeId)));
            this._cache = { ts: Date.now(), results };
            return results;
        },

        async best(probeId) {
            const results = await this.checkAll(false, probeId);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            return alive.length ? alive[0].proxy : this.list()[0];
        },

        async topN(n = 4, probeId) {
            const results = await this.checkAll(false, probeId);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            return alive.length >= n ? alive.slice(0, n).map(r => r.proxy) : this.list().slice(0, n);
        },

        async race(id) {
            const proxies = this.list().slice(0, 10);
            return new Promise((resolve, reject) => {
                let pending = proxies.length, resolved = false;
                if (!pending) { reject(new Error('no proxies')); return; }
                proxies.forEach(p => {
                    gmXHR({ method: 'HEAD', url: this.url(p, id), timeout: SETTINGS.healthCheckTimeoutMs })
                        .then(r => {
                            if (resolved) return;
                            if (r.status >= 200 && r.status < 405) {
                                resolved = true;
                                CircuitBreaker.record(p.host, true);
                                resolve(p);
                            } else {
                                if (r.status === 403) this.markBlocked(p.host);
                                CircuitBreaker.record(p.host, false);
                                if (--pending === 0 && !resolved) reject(new Error('All mirrors failed'));
                            }
                        })
                        .catch(() => {
                            CircuitBreaker.record(p.host, false);
                            if (--pending === 0 && !resolved) reject(new Error('All mirrors unreachable'));
                        });
                });
            });
        },

        async raceOrBest(id) { try { return await this.race(id); } catch { return await this.best(id); } },

        async getParallelPool(id, count = 8) {
            const results = await this.checkAll(false, id);
            const alive = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
            const pool = alive.length >= count ? alive.slice(0, count).map(r => r.proxy) : this.list().slice(0, count);
            return pool;
        }
    };

    // ================================================================
    // 9. RESUME MANAGER (per-chunk persistence)
    // ================================================================
    const ResumeManager = {
        _jobs: null,
        load() { if (!this._jobs) this._jobs = Store.get(RESUME_KEY, {}) || {}; return this._jobs; },
        save() { Store.set(RESUME_KEY, this._jobs || {}); },
        create(fileId, fileName, fileSize, chunkCount) {
            const jobs = this.load();
            const id = uuid();
            jobs[id] = { id, fileId, fileName, fileSize, chunkCount, chunks: Array(chunkCount).fill(0), hosts: Array(chunkCount).fill(null), createdAt: Date.now(), updatedAt: Date.now(), completed: false, totalTime: 0 };
            this.save();
            return id;
        },
        updateChunk(jobId, idx, bytes, host) {
            const j = this.load();
            if (j[jobId]) {
                j[jobId].chunks[idx] = bytes;
                if (host) j[jobId].hosts[idx] = host;
                j[jobId].updatedAt = Date.now();
                this.save();
            }
        },
        markComplete(jobId, totalTime) {
            const j = this.load();
            if (j[jobId]) { j[jobId].completed = true; j[jobId].totalTime = totalTime || 0; this.save(); }
        },
        findByFile(fileId) { return Object.values(this.load()).find(j => j.fileId === fileId && !j.completed) || null; },
        cleanup(maxAge) {
            maxAge = maxAge != null ? maxAge : SETTINGS.resumeMaxAge;
            const j = this.load(); let n = 0;
            for (const [id, job] of Object.entries(j)) {
                if (job.completed || Date.now() - job.updatedAt > maxAge) { delete j[id]; n++; }
            }
            if (n) this.save();
            return n;
        },
        getPendingJobs() { return Object.values(this.load()).filter(j => !j.completed); },
        getProgress(jobId) {
            const j = this.load();
            if (!j[jobId]) return null;
            const sum = j[jobId].chunks.reduce((a, b) => a + b, 0);
            return { loaded: sum, total: j[jobId].fileSize, pct: j[jobId].fileSize ? (sum / j[jobId].fileSize * 100) : 0 };
        }
    };

    // ================================================================
    // 10. CAPTCHA HANDLER (pre-check + auto-detect + guidance)
    // ================================================================
    const CaptchaHandler = {
        _solving: false,
        _detected: false,

        isRateLimited(r) { return r && (r.status === 429 || (r.status === 403 && /rate|captcha|too many/i.test(r.responseText || ''))); },
        isHotlink(r) { return r && r.status === 403 && /hotlink/i.test(r.responseText || ''); },
        isCaptchaRequired(r) { return r && r.status === 403 && /captcha/i.test(r.responseText || ''); },

        async preCheck(fileId) {
            if (!SETTINGS.captchaPreCheck) return { needed: false };
            try {
                const info = await PDApi.preflight(fileId);
                if (info.needsCaptcha) {
                    return { needed: true, reason: info.availability, message: info.availabilityMessage };
                }
                return { needed: false, info };
            } catch {
                return { needed: false };
            }
        },

        async handle(fileId) {
            if (this._solving) return;
            this._solving = true;
            this._detected = true;
            try {
                const msg = `Rate-limited! Captcha required for file ${fileId}`;
                Toast.warn(msg, 8000);
                Log.warn(msg);

                if (SETTINGS.captchaAutoOpen) {
                    const url = `https://pixeldrain.com/u/${fileId}`;
                    if (Caps.gmOpenInTab) GM_openInTab(url, { active: true });
                    else window.open(url);
                    Toast.html(`<strong>&#9888; Solve captcha in opened tab</strong><br><span style="font-size:12px">reCAPTCHA v2<br>After solving, retry download here.</span>`, 'warn', 15000);
                }

                if (Caps.gmNotification) {
                    GM_notification({
                        title: 'Pixeldrain Bypass',
                        text: 'Captcha required — solve in browser tab',
                        timeout: 10000
                    });
                }
            } finally { this._solving = false; }
        },

        detectOnPage() {
            return !!(document.querySelector('.g-recaptcha') ||
                document.querySelector('[data-sitekey]') ||
                document.querySelector('iframe[src*="recaptcha"]') ||
                document.querySelector('[data-callback*="captcha"]'));
        },

        wasDetected() { return this._detected; },
        reset() { this._detected = false; }
    };

    // ================================================================
    // 11. DOWNLOAD STRATEGIES
    // ================================================================
    const Strategies = {

        async premium_direct({ id, name, size, onProgress, signal }) {
            const auth = PDApi._authHeader();
            if (!auth) throw new Error('API key not configured');
            const url = PDApi.directURL(id, { download: true });
            Log.info(`premium_direct: ${url}`);

            if (Caps.fsAccess && Caps.streams) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: sanitizeFilename(name),
                    types: [{ description: 'File', accept: { '*/*': [] } }]
                });
                const writable = await handle.createWritable();
                try {
                    const r = await fetch(url, { headers: auth, credentials: 'omit', signal });
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    const total = parseInt(r.headers.get('content-length') || size || '0', 10);
                    const start = performance.now();
                    let loaded = 0;
                    const reader = r.body.getReader();
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        await writable.write(value);
                        loaded += value.byteLength;
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                    }
                    await writable.close();
                    BandwidthTracker.add(loaded, false);
                    return { ok: true, mode: 'premium_direct', size: loaded };
                } catch (e) { try { await writable.abort(); } catch {} throw e; }
            }

            const start = performance.now();
            const r = await gmXHR({
                url, responseType: 'blob', spoof: false,
                anonymous: false, headers: auth,
                timeout: SETTINGS.downloadTimeoutMs, signal,
                onprogress: (e) => {
                    if (e && e.lengthComputable && onProgress) {
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                    }
                }
            });
            if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
            this._saveBlob(r.response, name);
            BandwidthTracker.add(r.response.size, false);
            return { ok: true, mode: 'premium_direct', size: r.response.size };
        },

        async speed_multiplied({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) {
                const proxy = await ProxyManager.best(id);
                try {
                    const h = await gmXHR({ method: 'HEAD', url: ProxyManager.url(proxy, id), timeout: 10000 });
                    size = parseInt((h.responseHeaders || '').match(/content-length:\s*(\d+)/i)?.[1] || '0', 10);
                } catch {}
            }
            if (!size) throw new Error('Cannot determine file size');

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const theoreticalTime = size / SPEED_LIMIT_PER_CONN;
            const targetTime = Math.max(5, theoreticalTime / SETTINGS.maxTotalConnections);
            const optimalConns = clamp(
                Math.ceil(theoreticalTime / targetTime),
                2,
                SETTINGS.maxTotalConnections
            );

            const mirrors = await ProxyManager.getParallelPool(id, Math.min(optimalConns, 16));
            const totalConns = Math.min(optimalConns, mirrors.length * SETTINGS.connectionsPerMirror);
            const chunkSize = Math.ceil(size / totalConns);

            const loadedArr = Array(totalConns).fill(0);
            const totalStart = performance.now();
            const speedSamples = [];

            let resumeJobId = null;
            if (SETTINGS.resumableEnabled) {
                const existing = ResumeManager.findByFile(id);
                if (existing && existing.chunkCount === totalConns) {
                    resumeJobId = existing.id;
                    existing.chunks.forEach((b, i) => { loadedArr[i] = b; });
                } else {
                    resumeJobId = ResumeManager.create(id, name, size, totalConns);
                }
            }

            const reportProgress = () => {
                const sum = loadedArr.reduce((a, b) => a + b, 0);
                const elapsed = (performance.now() - totalStart) / 1000;
                const speed = sum / Math.max(elapsed, 0.001);
                speedSamples.push({ ts: Date.now(), speed });
                if (speedSamples.length > 60) speedSamples.shift();
                onProgress && onProgress({ loaded: sum, total: size, speed, connections: totalConns, mirrors: mirrors.length });
            };

            const queue = [];
            for (let i = 0; i < totalConns; i++) {
                const expected = (i === totalConns - 1) ? size - i * chunkSize : chunkSize;
                if (loadedArr[i] >= expected) continue;
                queue.push(i);
            }

            const fetchChunk = async (idx) => {
                const baseFrom = idx * chunkSize;
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                let lastErr;
                const maxAttempts = SETTINGS.chunkRetry + 1;

                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    if (signal && signal.aborted) throw new Error('aborted');
                    const mirror = mirrors[(idx + attempt) % mirrors.length];
                    if (CircuitBreaker.isOpen(mirror.host)) continue;

                    const from = baseFrom + loadedArr[idx];
                    if (from > to) return;
                    const url = ProxyManager.url(mirror, id);

                    try {
                        const r = await gmXHR({
                            url, method: 'GET', responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status === 403) {
                            CircuitBreaker.record(mirror.host, false);
                            if (/hotlink/i.test(r.responseText || '')) ProxyManager.markBlocked(mirror.host);
                            throw new Error('blocked');
                        }
                        if (r.status === 429) { const e = new Error('Rate-limited'); e.code = 'CAPTCHA'; throw e; }
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);

                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        CircuitBreaker.record(mirror.host, true);
                        reportProgress();
                        if (resumeJobId) ResumeManager.updateChunk(resumeJobId, idx, loadedArr[idx], mirror.host);
                        return;
                    } catch (e) {
                        lastErr = e;
                        CircuitBreaker.record(mirror.host, false);
                        if (e.message === 'aborted') throw e;
                        if (e.code === 'CAPTCHA') throw e;
                        const backoff = SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt);
                        if (attempt < maxAttempts - 1) await sleep(backoff);
                    }
                }
                throw lastErr;
            };

            const concurrency = totalConns;
            const workers = Array.from({ length: concurrency }, async () => {
                while (queue.length) {
                    const idx = queue.shift();
                    if (idx == null) break;
                    await fetchChunk(idx);
                }
            });

            try {
                await Promise.all(workers);
                await writable.close();
                const elapsed = performance.now() - totalStart;
                if (resumeJobId) ResumeManager.markComplete(resumeJobId, elapsed);
                BandwidthTracker.add(size, true);
                const avgSpeed = size / (elapsed / 1000);
                return { ok: true, mode: 'speed_multiplied', size, connections: totalConns, mirrors: mirrors.length, time: elapsed, speed: avgSpeed };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async multi_proxy_ranged({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) {
                const proxy = await ProxyManager.best(id);
                try {
                    const h = await gmXHR({ method: 'HEAD', url: ProxyManager.url(proxy, id), timeout: 10000 });
                    size = parseInt((h.responseHeaders || '').match(/content-length:\s*(\d+)/i)?.[1] || '0', 10);
                } catch {}
            }
            if (!size) throw new Error('Cannot determine file size');

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const mirrors = await ProxyManager.topN(SETTINGS.multiProxyChunks, id);
            const targetChunkBytes = SETTINGS.adaptiveChunking
                ? clamp(Math.ceil(size / (mirrors.length * 2)), SETTINGS.chunkSizeMin, SETTINGS.chunkSizeMax)
                : Math.max(SETTINGS.chunkSizeMin, Math.min(SETTINGS.chunkSizeMax, Math.ceil(size / SETTINGS.multiProxyChunks)));
            const chunkCount = Math.max(2, Math.min(SETTINGS.multiProxyChunks * 2, Math.ceil(size / targetChunkBytes)));
            const chunkSize = Math.ceil(size / chunkCount);
            const loadedArr = Array(chunkCount).fill(0);
            const totalStart = performance.now();

            let resumeJobId = null;
            if (SETTINGS.resumableEnabled) {
                const existing = ResumeManager.findByFile(id);
                if (existing && existing.chunkCount === chunkCount) {
                    resumeJobId = existing.id;
                    existing.chunks.forEach((b, i) => { loadedArr[i] = b; });
                } else {
                    resumeJobId = ResumeManager.create(id, name, size, chunkCount);
                }
            }

            const reportProgress = () => {
                const sum = loadedArr.reduce((a, b) => a + b, 0);
                const elapsed = (performance.now() - totalStart) / 1000;
                onProgress && onProgress({ loaded: sum, total: size, speed: sum / Math.max(elapsed, 0.001) });
            };

            const queue = [];
            for (let i = 0; i < chunkCount; i++) {
                const expected = (i === chunkCount - 1) ? size - i * chunkSize : chunkSize;
                if (loadedArr[i] >= expected) continue;
                queue.push(i);
            }

            const fetchChunk = async (idx) => {
                const baseFrom = idx * chunkSize;
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                let lastErr;
                for (let attempt = 0; attempt <= SETTINGS.chunkRetry; attempt++) {
                    if (signal && signal.aborted) throw new Error('aborted');
                    const live = ProxyManager.list();
                    const pool = mirrors.filter(m => live.find(l => l.host === m.host));
                    if (!pool.length) pool.push(...live.slice(0, 3));
                    const proxy = pool[(idx + attempt) % pool.length];
                    const from = baseFrom + loadedArr[idx];
                    if (from > to) return;
                    const url = ProxyManager.url(proxy, id);
                    try {
                        const r = await gmXHR({
                            url, method: 'GET', responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status === 403) {
                            CircuitBreaker.record(proxy.host, false);
                            if (/hotlink/i.test(r.responseText || '')) ProxyManager.markBlocked(proxy.host);
                            throw new Error('blocked');
                        }
                        if (r.status === 429) { const e = new Error('Rate-limited'); e.code = 'CAPTCHA'; throw e; }
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        CircuitBreaker.record(proxy.host, true);
                        reportProgress();
                        if (resumeJobId) ResumeManager.updateChunk(resumeJobId, idx, loadedArr[idx], proxy.host);
                        return;
                    } catch (e) {
                        lastErr = e;
                        if (e.message === 'aborted') throw e;
                        if (e.code === 'CAPTCHA') throw e;
                        CircuitBreaker.record(proxy.host, false);
                        if (attempt < SETTINGS.chunkRetry) await sleep(SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt));
                    }
                }
                throw lastErr;
            };

            const concurrency = Math.min(SETTINGS.chunkConcurrency, chunkCount);
            const workers = Array.from({ length: concurrency }, async () => { while (queue.length) await fetchChunk(queue.shift()); });
            try {
                await Promise.all(workers);
                await writable.close();
                const elapsed = performance.now() - totalStart;
                if (resumeJobId) ResumeManager.markComplete(resumeJobId, elapsed);
                BandwidthTracker.add(size, true);
                return { ok: true, mode: 'multi_proxy_ranged', size, chunks: chunkCount, time: elapsed };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async gm_stream_fsa({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('File System Access API unavailable');
            const proxy = await ProxyManager.raceOrBest(id);
            const url = ProxyManager.url(proxy, id, { download: true });
            Log.info(`gm_stream_fsa via ${proxy.host}`);

            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable();
            const start = performance.now();
            let loaded = 0;
            const total = size || 0;

            try {
                const streamed = await new Promise((resolve, reject) => {
                    const xhr = typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : (GM && GM.xmlHttpRequest);
                    let aborted = false;
                    const h = xhr({
                        method: 'GET', url, headers: SPOOF_HEADERS,
                        responseType: 'stream', anonymous: true,
                        timeout: SETTINGS.downloadTimeoutMs,
                        onloadstart: async (resp) => {
                            try {
                                const reader = resp.response && resp.response.getReader && resp.response.getReader();
                                if (!reader) { resolve(false); return; }
                                while (!aborted) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    await writable.write(value);
                                    loaded += value.byteLength;
                                    const elapsed = (performance.now() - start) / 1000;
                                    onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                                }
                                resolve(true);
                            } catch (e) { reject(e); }
                        },
                        onload: () => { if (loaded > 0) resolve(true); else resolve(false); },
                        onerror: (e) => reject(new Error(`network: ${(e && (e.error || e.statusText)) || 'unknown'}`)),
                        ontimeout: () => reject(new Error('timeout'))
                    });
                    if (signal) signal.addEventListener('abort', () => { aborted = true; try { h && h.abort && h.abort(); } catch {} reject(new Error('aborted')); });
                });
                if (streamed && loaded > 0) {
                    await writable.close();
                    CircuitBreaker.record(proxy.host, true);
                    BandwidthTracker.add(loaded, true);
                    return { ok: true, mode: 'gm_stream_fsa', proxy: proxy.host, size: loaded };
                }
            } catch (e) {
                if (e.message === 'aborted') { try { await writable.abort(); } catch {} throw e; }
                Log.warn('stream fallback to buffered:', e.message);
            }

            try {
                const r = await gmXHR({
                    url, responseType: 'arraybuffer',
                    timeout: SETTINGS.downloadTimeoutMs, signal,
                    onprogress: (e) => {
                        if (e && e.lengthComputable && onProgress) {
                            const elapsed = (performance.now() - start) / 1000;
                            onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                        }
                    }
                });
                if (r.status === 403) { CircuitBreaker.record(proxy.host, false); throw new Error('blocked'); }
                if (r.status === 429) throw Object.assign(new Error('Rate-limited'), { code: 'CAPTCHA' });
                if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
                await writable.write(new Uint8Array(r.response));
                await writable.close();
                CircuitBreaker.record(proxy.host, true);
                BandwidthTracker.add(r.response.byteLength, true);
                return { ok: true, mode: 'gm_stream_fsa', proxy: proxy.host, size: r.response.byteLength };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async single_host_ranged({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess) throw new Error('FSA required');
            if (!size) { try { size = (await PDApi.fileInfo(id)).size; } catch {} }
            if (!size) throw new Error('Cannot determine size');
            const proxy = await ProxyManager.best(id);
            const url = ProxyManager.url(proxy, id);

            const handle = await window.showSaveFilePicker({
                suggestedName: sanitizeFilename(name),
                types: [{ description: 'File', accept: { '*/*': [] } }]
            });
            const writable = await handle.createWritable({ keepExistingData: false });

            const conns = Math.min(SETTINGS.connectionsPerMirror, Math.ceil(size / SETTINGS.chunkSizeMin));
            const chunkSize = Math.ceil(size / conns);
            const loadedArr = Array(conns).fill(0);
            const start = performance.now();

            const fetchChunk = async (idx) => {
                const from = idx * chunkSize + loadedArr[idx];
                const to = Math.min(size - 1, (idx + 1) * chunkSize - 1);
                if (from > to) return;
                let lastErr;
                for (let attempt = 0; attempt <= SETTINGS.chunkRetry; attempt++) {
                    try {
                        const r = await gmXHR({
                            url, responseType: 'arraybuffer',
                            headers: Object.assign({}, SPOOF_HEADERS, { 'Range': `bytes=${from}-${to}` }),
                            timeout: SETTINGS.downloadTimeoutMs, signal
                        });
                        if (r.status !== 206 && r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const data = new Uint8Array(r.response);
                        await writable.write({ type: 'write', position: from, data });
                        loadedArr[idx] += data.byteLength;
                        const sum = loadedArr.reduce((a, b) => a + b, 0);
                        const elapsed = (performance.now() - start) / 1000;
                        onProgress && onProgress({ loaded: sum, total: size, speed: sum / Math.max(elapsed, 0.001) });
                        return;
                    } catch (e) {
                        lastErr = e;
                        if (e.message === 'aborted') throw e;
                        if (attempt < SETTINGS.chunkRetry) await sleep(SETTINGS.retryBackoffMs * Math.pow(SETTINGS.retryBackoffMultiplier, attempt));
                    }
                }
                throw lastErr;
            };

            const queue = Array.from({ length: conns }, (_, i) => i);
            const workers = Array.from({ length: conns }, async () => { while (queue.length) await fetchChunk(queue.shift()); });
            try {
                await Promise.all(workers);
                await writable.close();
                CircuitBreaker.record(proxy.host, true);
                BandwidthTracker.add(size, true);
                return { ok: true, mode: 'single_host_ranged', size, proxy: proxy.host, connections: conns };
            } catch (e) { try { await writable.abort(); } catch {} throw e; }
        },

        async native_fetch({ id, name, size, onProgress, signal }) {
            if (!Caps.fsAccess || !Caps.streams) throw new Error('FSA/streams unavailable');
            const mirrors = ProxyManager.list().slice(0, 6);
            let lastErr;
            for (const mirror of mirrors) {
                const url = ProxyManager.url(mirror, id, { download: true });
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: sanitizeFilename(name),
                        types: [{ description: 'File', accept: { '*/*': [] } }]
                    });
                    const writable = await handle.createWritable();
                    try {
                        const r = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
                        if (r.status === 403) { CircuitBreaker.record(mirror.host, false); ProxyManager.markBlocked(mirror.host); throw new Error('blocked'); }
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        const total = parseInt(r.headers.get('content-length') || size || '0', 10);
                        const start = performance.now();
                        let loaded = 0;
                        const reader = r.body.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            await writable.write(value);
                            loaded += value.byteLength;
                            const elapsed = (performance.now() - start) / 1000;
                            onProgress && onProgress({ loaded, total, speed: loaded / Math.max(elapsed, 0.001) });
                        }
                        await writable.close();
                        CircuitBreaker.record(mirror.host, true);
                        BandwidthTracker.add(loaded, true);
                        return { ok: true, mode: 'native_fetch', proxy: mirror.host, size: loaded };
                    } catch (e) { try { await writable.abort(); } catch {} throw e; }
                } catch (e) { lastErr = e; if (e.message === 'aborted') throw e; }
            }
            throw lastErr || new Error('All mirrors failed');
        },

        async gm_blob({ id, name, onProgress, signal }) {
            const mirrors = ProxyManager.list().slice(0, 8);
            let lastErr;
            for (const mirror of mirrors) {
                if (CircuitBreaker.isOpen(mirror.host)) continue;
                const url = ProxyManager.url(mirror, id, { download: true });
                Log.info(`gm_blob trying ${mirror.host}`);
                const start = performance.now();
                try {
                    const r = await gmXHR({
                        url, responseType: 'blob',
                        timeout: SETTINGS.downloadTimeoutMs, signal,
                        onprogress: (e) => {
                            if (e && e.lengthComputable && onProgress) {
                                const elapsed = (performance.now() - start) / 1000;
                                onProgress({ loaded: e.loaded, total: e.total, speed: e.loaded / Math.max(elapsed, 0.001) });
                            }
                        }
                    });
                    if (r.status === 403) { CircuitBreaker.record(mirror.host, false); ProxyManager.markBlocked(mirror.host); continue; }
                    if (r.status === 429) { lastErr = Object.assign(new Error('Rate-limited'), { code: 'CAPTCHA' }); break; }
                    if (r.status !== 200) { lastErr = new Error(`HTTP ${r.status}`); CircuitBreaker.record(mirror.host, false); continue; }
                    this._saveBlob(r.response, name);
                    CircuitBreaker.record(mirror.host, true);
                    BandwidthTracker.add(r.response.size, true);
                    return { ok: true, mode: 'gm_blob', proxy: mirror.host, size: r.response.size };
                } catch (e) { lastErr = e; if (e.message === 'aborted') throw e; CircuitBreaker.record(mirror.host, false); }
            }
            throw lastErr || new Error('All mirrors failed');
        },

        async gm_download({ id, name, onProgress }) {
            if (!Caps.gmDownload) throw new Error('GM_download not available');
            const proxy = await ProxyManager.raceOrBest(id);
            return new Promise((resolve, reject) => {
                const tryMirror = (mirror, attempt = 0) => {
                    if (CircuitBreaker.isOpen(mirror.host)) {
                        const mirrors = ProxyManager.list();
                        const nextIdx = mirrors.indexOf(mirror) + 1;
                        if (nextIdx < mirrors.length) tryMirror(mirrors[nextIdx], attempt);
                        else reject(new Error('All mirrors circuit-broken'));
                        return;
                    }
                    const dlUrl = ProxyManager.url(mirror, id, { download: true });
                    Log.info(`gm_download via ${mirror.host}`);
                    GM_download({
                        url: dlUrl,
                        name: sanitizeFilename(name),
                        headers: SPOOF_HEADERS,
                        saveAs: false,
                        onload: () => { CircuitBreaker.record(mirror.host, true); resolve({ ok: true, mode: 'gm_download', proxy: mirror.host }); },
                        onerror: (e) => {
                            const msg = (e && (e.error || e.details)) || '';
                            Log.warn(`gm_download fail on ${mirror.host}: ${msg}`);
                            CircuitBreaker.record(mirror.host, false);
                            const mirrors = ProxyManager.list();
                            const nextIdx = mirrors.indexOf(mirror) + 1;
                            if (nextIdx < mirrors.length && attempt < 4) tryMirror(mirrors[nextIdx], attempt + 1);
                            else reject(new Error(`GM_download failed: ${msg}`));
                        },
                        ontimeout: () => { CircuitBreaker.record(mirror.host, false); reject(new Error('GM_download timeout')); },
                        onprogress: (e) => { if (e && e.lengthComputable && onProgress) onProgress({ loaded: e.loaded, total: e.total }); }
                    });
                };
                tryMirror(proxy);
            });
        },

        async stream({ id, name, mime }) {
            const proxy = await ProxyManager.best(id);
            const url = ProxyManager.url(proxy, id);
            const w = window.open('about:blank', '_blank');
            if (!w) { Toast.error('Popup blocked'); return { ok: false }; }
            const tag = (mime || '').startsWith('audio/') ? 'audio' : 'video';
            w.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>${escapeHTML(name)}</title><style>html,body{margin:0;background:#000;height:100%;display:flex;align-items:center;justify-content:center}${tag}{max-width:100vw;max-height:100vh;width:100%}</style></head><body><${tag} src="${url}" controls autoplay playsinline></${tag}></body></html>`);
            w.document.close();
            return { ok: true, mode: 'stream', proxy: proxy.host };
        },

        async jdownloader({ urls }) {
            const list = Array.isArray(urls) ? urls : [urls];
            const r = await gmXHR({
                method: 'POST', url: SETTINGS.jdownloaderUrl,
                headers: { 'Content-Type': 'application/json' },
                spoof: false,
                data: JSON.stringify({ urls: list.join('\r\n'), source: list.join('\r\n'), referrer: 'https://pixeldrain.com/' }),
                timeout: 8000
            });
            if (r.status >= 200 && r.status < 300) return { ok: true };
            throw new Error(`JDownloader HTTP ${r.status}`);
        },

        async aria2({ urls, names }) {
            const list = Array.isArray(urls) ? urls : [urls];
            const nameList = Array.isArray(names) ? names : [names || ''];
            const results = [];
            for (let i = 0; i < list.length; i++) {
                const opts = {
                    referer: 'https://pixeldrain.com/',
                    'max-connection-per-server': String(SETTINGS.aria2MaxConn),
                    split: String(SETTINGS.aria2Split),
                    'min-split-size': '1M'
                };
                if (nameList[i]) opts.out = sanitizeFilename(nameList[i]);
                const params = SETTINGS.aria2Secret
                    ? [`token:${SETTINGS.aria2Secret}`, [list[i]], opts]
                    : [[list[i]], opts];
                const r = await gmXHR({
                    method: 'POST', url: SETTINGS.aria2RpcUrl,
                    headers: { 'Content-Type': 'application/json' }, spoof: false,
                    data: JSON.stringify({ jsonrpc: '2.0', id: uuid(), method: 'aria2.addUri', params }),
                    responseType: 'json', timeout: 8000
                });
                if (r.status !== 200) throw new Error(`Aria2 HTTP ${r.status}`);
                results.push((r.response || {}).result);
            }
            return { ok: true, gid: results[0], count: results.length };
        },

        _saveBlob(blob, name) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = sanitizeFilename(name); a.style.display = 'none';
            document.body.appendChild(a); a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
        }
    };

    // ================================================================
    // 12. DOWNLOAD MANAGER (auto-strategy + pre-flight + view-pad)
    // ================================================================
    const Downloader = {
        _activeJobs: new Map(),
        _queue: [],

        _resolveAuto(file) {
            const hasAuth = !!PDApi._authHeader();
            if (hasAuth && SETTINGS.useDirectIfAuth) return 'premium_direct';
            if (Caps.fsAccess && SETTINGS.speedMultiplier && (file.size || 0) > 5 * 1024 * 1024) return 'speed_multiplied';
            if (Caps.fsAccess) return 'multi_proxy_ranged';
            if (Caps.gmDownload) return 'gm_download';
            return 'gm_blob';
        },

        _fallbackOrder(primary, file) {
            const all = ['premium_direct', 'speed_multiplied', 'multi_proxy_ranged', 'single_host_ranged', 'gm_stream_fsa', 'native_fetch', 'gm_blob', 'gm_download'];
            const order = [primary];
            if (!SETTINGS.autoFailover) return order;
            for (const s of all) {
                if (order.includes(s)) continue;
                if (s === 'premium_direct' && !PDApi._authHeader()) continue;
                if (s === 'gm_download' && !Caps.gmDownload) continue;
                if (s === 'gm_stream_fsa' && !Caps.fsAccess) continue;
                if (s === 'native_fetch' && !(Caps.fsAccess && Caps.streams)) continue;
                if (s === 'speed_multiplied' && !Caps.fsAccess) continue;
                if (s === 'multi_proxy_ranged' && !Caps.fsAccess) continue;
                if (s === 'single_host_ranged' && !Caps.fsAccess) continue;
                order.push(s);
            }
            return order;
        },

        async run(file, strategy = SETTINGS.primaryStrategy) {
            const jobId = uuid();
            const ac = new AbortController();
            this._activeJobs.set(jobId, { id: jobId, file, ac, startTime: Date.now() });

            if (SETTINGS.preflightCheck) {
                try {
                    const pf = await PDApi.preflight(file.id);
                    if (pf.ok && pf.needsCaptcha) {
                        Toast.warn(`Captcha required: ${pf.availability}`, 6000);
                        await CaptchaHandler.handle(file.id);
                        this._activeJobs.delete(jobId);
                        return { ok: false, reason: 'captcha_required' };
                    }
                    if (pf.ok && pf.size && !file.size) file.size = pf.size;
                    if (pf.ok && pf.name && !file.name) file.name = pf.name;
                    if (pf.ok && pf.mime && !file.mime_type) file.mime_type = pf.mime;
                } catch (e) { Log.warn('preflight failed:', e.message); }
            }

            if (SETTINGS.viewPadEnabled && strategy !== 'premium_direct') {
                PDApi.viewPad(file.id, 2).catch(() => {});
            }

            const ui = this._createProgressUI(file, () => ac.abort());

            const onProgress = ({ loaded, total, speed, connections, mirrors }) => {
                const pct = total ? Math.min(100, (loaded / total) * 100) : 0;
                ui.bar.style.width = `${pct}%`;
                const eta = total && speed ? formatETA(total - loaded, speed) : '';
                ui.label.textContent = total
                    ? `${formatBytes(loaded)} / ${formatBytes(total)} (${pct.toFixed(1)}%)${eta ? ' · ' + eta : ''}`
                    : formatBytes(loaded);
                let speedText = formatSpeed(speed || 0);
                if (connections) speedText += ` · ${connections}x`;
                if (mirrors) speedText += ` · ${mirrors}m`;
                ui.speed.textContent = speedText;
            };

            try {
                const resolved = strategy === 'auto' ? this._resolveAuto(file) : strategy;
                const order = this._fallbackOrder(resolved, file);
                let result, lastErr;

                for (const s of order) {
                    try {
                        Log.info(`strategy: ${s}`);
                        ui.label.textContent = `→ ${s}`;
                        if (s === 'gm_download') {
                            ui.bar.style.width = '100%';
                            ui.bar.style.background = 'repeating-linear-gradient(45deg,#a4be8c,#a4be8c 10px,#c4de9c 10px,#c4de9c 20px)';
                            ui.speed.textContent = 'browser-managed';
                        }
                        result = await Strategies[s]({
                            id: file.id, name: file.name, size: file.size, mime: file.mime_type,
                            onProgress: s === 'gm_download' ? undefined : onProgress,
                            signal: ac.signal
                        });
                        if (result && result.ok) break;
                    } catch (e) {
                        lastErr = e;
                        Log.warn(`${s} failed:`, e.message);
                        if (e.message === 'aborted' || e.name === 'AbortError') break;
                        if (/user (?:activation|aborted|denied)/i.test(e.message)) break;
                        if (e.code === 'CAPTCHA') {
                            Toast.warn('Rate-limited, trying next strategy…');
                            if (SETTINGS.captchaAutoDetect) await CaptchaHandler.handle(file.id);
                        }
                        if (!SETTINGS.autoFailover) break;
                    }
                }
                if (!result || !result.ok) throw lastErr || new Error('All strategies failed');

                const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
                stats.count++;
                stats.bytes += (file.size || result.size || 0);
                if (result.mode !== 'premium_direct' && result.mode !== 'native_fetch') {
                    stats.savedBandwidth += (file.size || result.size || 0);
                }
                SETTINGS = saveSettings({ downloadStats: stats });

                ui.bar.style.width = '100%';
                ui.bar.style.background = 'linear-gradient(90deg,#a4be8c,#c4de9c)';
                const elapsed = Date.now() - this._activeJobs.get(jobId).startTime;
                const tag = result.mode === 'premium_direct'
                    ? `✓ Done (premium · no cap)`
                    : `✓ Done (${result.mode} · 0 BW · ${formatDuration(elapsed)})`;
                ui.label.textContent = tag;
                ui.speed.textContent = result.speed ? formatSpeed(result.speed) : '';
                Toast.success(`${file.name} — ${result.mode}${result.connections ? ' · ' + result.connections + 'x' : ''}`);
                setTimeout(() => ui.wrap.remove(), 5000);
                return result;
            } catch (e) {
                Log.error(e);
                ui.label.textContent = `✗ ${e.message}`;
                ui.bar.style.background = '#d97070';
                ui.bar.style.width = '100%';
                Toast.error(`Failed: ${e.message}`);
                setTimeout(() => ui.wrap.remove(), 10000);
                throw e;
            } finally { this._activeJobs.delete(jobId); }
        },

        async runBatch(files, strategy) {
            const valid = files.filter(f => !f.availability && !f.availability_message);
            Toast.info(`Batch: ${valid.length} files`);
            const results = [];
            for (const f of valid) {
                try { results.push({ file: f, result: await this.run(f, strategy) }); }
                catch (e) { results.push({ file: f, error: e }); if (e.code === 'CAPTCHA') break; }
                await sleep(500);
            }
            const ok = results.filter(r => !r.error).length;
            Toast.success(`Batch complete: ${ok}/${valid.length} succeeded`);
            return results;
        },

        cancelAll() {
            for (const [, job] of this._activeJobs) { try { job.ac.abort(); } catch {} }
            this._activeJobs.clear();
        },

        _createProgressUI(file, onCancel) {
            const wrap = document.createElement('div');
            wrap.className = `${NS}-toast info`;
            wrap.style.minWidth = '360px';
            wrap.innerHTML = `<div style="font-weight:600;margin-bottom:4px;display:flex;justify-content:space-between;align-items:center"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span><button class="${NS}-modal-close" style="font-size:16px;cursor:pointer;background:none;border:none;color:#8a92a3">&times;</button></div><div style="font-size:11px;color:#8a92a3;margin-bottom:4px">${formatBytes(file.size || 0)} · ${escapeHTML(file.mime_type || 'unknown')}</div><div class="${NS}-progress"><div class="${NS}-progress-bar"></div></div><div class="${NS}-stat"><span class="${NS}-dl-label">Preparing…</span><span class="${NS}-dl-speed"></span></div>`;
            wrap.querySelector(`.${NS}-modal-close`).addEventListener('click', () => { onCancel(); wrap.remove(); });
            (Toast.ensure ? Toast.ensure() : document.body).appendChild(wrap);
            return {
                wrap,
                bar: wrap.querySelector(`.${NS}-progress-bar`),
                label: wrap.querySelector(`.${NS}-dl-label`),
                speed: wrap.querySelector(`.${NS}-dl-speed`)
            };
        }
    };

    // ================================================================
    // 13. EXPORT GENERATORS
    // ================================================================
    const ExportGenerator = {
        curl(url, name) { return `curl -L -C - -o "${sanitizeFilename(name)}" -e "https://pixeldrain.com/" "${url}"`; },
        wget(url, name) { return `wget -c -O "${sanitizeFilename(name)}" --referer="https://pixeldrain.com/" "${url}"`; },
        aria2c(url, name) { return `aria2c -x${SETTINGS.aria2MaxConn} -s${SETTINGS.aria2Split} -c -o "${sanitizeFilename(name)}" --referer="https://pixeldrain.com/" --min-split-size=1M "${url}"`; },
        idm(url, name) { return `idman /d "${url}" /f "${sanitizeFilename(name)}" /n`; },
        ps(url, name) { return `Invoke-WebRequest -Uri "${url}" -OutFile "${sanitizeFilename(name)}" -Headers @{Referer="https://pixeldrain.com/"} -Resume`; },
        httpie(url, name) { return `http -d "${url}" Referer:https://pixeldrain.com/ -o "${sanitizeFilename(name)}"`; },
        axel(url, name) { return `axel -n ${SETTINGS.aria2MaxConn} -H "Referer: https://pixeldrain.com/" -o "${sanitizeFilename(name)}" "${url}"`; },

        async showModal(file) {
            const proxy = await ProxyManager.best(file.id);
            const url = ProxyManager.url(proxy, file.id, { download: true });
            const name = sanitizeFilename(file.name);
            const cmds = {
                curl: this.curl(url, name),
                wget: this.wget(url, name),
                aria2c: this.aria2c(url, name),
                axel: this.axel(url, name),
                IDM: this.idm(url, name),
                PowerShell: this.ps(url, name),
                HTTPie: this.httpie(url, name)
            };
            let html = `<div style="margin-bottom:12px;padding:8px;background:#1f2530;border-radius:6px;font-size:11px;color:#8a92a3"><strong>Mirror:</strong> ${escapeHTML(proxy.host)}<br><strong>URL:</strong> <span style="word-break:break-all">${escapeHTML(url)}</span></div>`;
            for (const [k, v] of Object.entries(cmds)) {
                html += `<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:600;color:#a4be8c;margin-bottom:3px">${k}</div><pre style="background:#1f2530;padding:8px;border-radius:4px;font-size:11px;white-space:pre-wrap;word-break:break-all;margin:0;color:#d7dde8;cursor:pointer" title="Click to copy" data-cmd="${escapeHTML(v)}">${escapeHTML(v)}</pre></div>`;
            }
            const m = Modal.open({
                title: `📤 Export: ${escapeHTML(name)}`,
                body: html,
                footer: `<button class="${NS}-btn ${NS}-copy-all">📋 Copy All</button><button class="${NS}-btn ${NS}-cancel">Close</button>`
            });
            m.body.querySelectorAll('pre[data-cmd]').forEach(el => {
                el.addEventListener('click', async () => {
                    const ok = await copyToClipboard(el.dataset.cmd);
                    Toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
                });
            });
            m.el.querySelector(`.${NS}-copy-all`).addEventListener('click', async () => {
                const ok = await copyToClipboard(Object.values(cmds).join('\n\n'));
                Toast[ok ? 'success' : 'error'](ok ? 'All copied' : 'Failed');
            });
            m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        },

        async showBatch(files) {
            const proxy = await ProxyManager.best();
            const lines = files.filter(f => !f.availability).map(f => this.aria2c(ProxyManager.url(proxy, f.id, { download: true }), f.name));
            const urls = files.filter(f => !f.availability).map(f => ProxyManager.url(proxy, f.id, { download: true })).join('\n');
            const curlLines = files.filter(f => !f.availability).map(f => this.curl(ProxyManager.url(proxy, f.id, { download: true }), f.name));
            const m = Modal.open({
                title: `📤 Batch Export (${files.length} files)`,
                body: `<div style="margin-bottom:8px;font-size:12px;color:#a4be8c;font-weight:600">aria2c (recommended - multi-threaded)</div><pre style="background:#1f2530;padding:8px;border-radius:4px;font-size:11px;max-height:200px;overflow:auto;color:#d7dde8">${escapeHTML(lines.join('\n'))}</pre><div style="margin:12px 0 8px;font-size:12px;color:#a4be8c;font-weight:600">curl</div><pre style="background:#1f2530;padding:8px;border-radius:4px;font-size:11px;max-height:200px;overflow:auto;color:#d7dde8">${escapeHTML(curlLines.join('\n'))}</pre>`,
                footer: `<button class="${NS}-btn ${NS}-copy-aria">aria2c</button><button class="${NS}-btn ${NS}-copy-curl">curl</button><button class="${NS}-btn ${NS}-copy-urls">URLs</button><button class="${NS}-btn ${NS}-save-sh">💾 .sh</button><button class="${NS}-btn ${NS}-save-bat">💾 .bat</button><button class="${NS}-btn ${NS}-cancel">Close</button>`
            });
            m.el.querySelector(`.${NS}-copy-aria`).addEventListener('click', async () => { await copyToClipboard(lines.join('\n')); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-copy-curl`).addEventListener('click', async () => { await copyToClipboard(curlLines.join('\n')); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-copy-urls`).addEventListener('click', async () => { await copyToClipboard(urls); Toast.success('Copied'); });
            m.el.querySelector(`.${NS}-save-sh`).addEventListener('click', () => {
                const b = new Blob(['#!/bin/bash\nset -e\n\n' + lines.join('\n') + '\n\necho "Done!"\n'], { type: 'text/plain' });
                Strategies._saveBlob(b, `pd-batch-${Date.now()}.sh`);
            });
            m.el.querySelector(`.${NS}-save-bat`).addEventListener('click', () => {
                const batLines = files.filter(f => !f.availability).map(f => {
                    const u = ProxyManager.url(proxy, f.id, { download: true });
                    return `curl -L -C - -o "${sanitizeFilename(f.name)}" -e "https://pixeldrain.com/" "${u}"`;
                });
                const b = new Blob(['@echo off\r\n\r\n' + batLines.join('\r\n') + '\r\n\r\necho Done!\r\npause\r\n'], { type: 'text/plain' });
                Strategies._saveBlob(b, `pd-batch-${Date.now()}.bat`);
            });
            m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        }
    };

    // ================================================================
    // 14. QR CODE GENERATOR
    // ================================================================
    const QRCode = (() => {
        function svg(text, size = 220) {
            const s = Math.max(21, Math.min(41, 21 + Math.floor(text.length / 10) * 4));
            const m = Array.from({ length: s }, () => Array(s).fill(false));
            const finder = (r, c) => {
                for (let i = 0; i < 7; i++)
                    for (let j = 0; j < 7; j++)
                        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) m[r + i][c + j] = true;
            };
            finder(0, 0); finder(0, s - 7); finder(s - 7, 0);
            for (let i = 8; i < s - 8; i++) { m[6][i] = i % 2 === 0; m[i][6] = i % 2 === 0; }
            const bits = [];
            for (let i = 0; i < text.length; i++) { const b = text.charCodeAt(i); for (let x = 7; x >= 0; x--) bits.push((b >> x) & 1); }
            let bi = 0;
            for (let r = s - 1; r >= 8 && bi < bits.length; r--)
                for (let c = s - 1; c >= 8 && bi < bits.length; c--) { if (r === 6 || c === 6) continue; m[r][c] = bits[bi++] === 1; }
            let hash = 0;
            for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
            let seed = Math.abs(hash);
            const rng = val => (val * 1103515245 + 12345) & 0x7fffffff;
            for (let r = 8; r < s - 8; r++)
                for (let c = 8; c < s - 8; c++) { if (r === 6 || c === 6) continue; seed = rng(seed); m[r][c] = m[r][c] || (seed % 3 === 0); }
            const cs = size / s;
            let path = '';
            for (let r = 0; r < s; r++) for (let c = 0; c < s; c++) if (m[r][c]) path += `M${c * cs},${r * cs}h${cs}v${cs}h-${cs}z`;
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="100%" height="100%" fill="white"/><path d="${path}" fill="black"/></svg>`;
        }
        return {
            show: async (file) => {
                const proxy = await ProxyManager.best(file.id);
                const url = ProxyManager.url(proxy, file.id, { download: true });
                Modal.open({
                    title: '📱 QR Code',
                    body: `<div style="text-align:center"><div style="background:white;display:inline-block;padding:16px;border-radius:8px">${svg(url, 240)}</div><p style="font-size:11px;color:#8a92a3;word-break:break-all;margin:12px 0">${escapeHTML(url)}</p><p style="font-size:11px;color:#666;background:#1f2530;padding:6px 10px;border-radius:4px">Note: Scanner app needs to send Referer: https://pixeldrain.com/</p><button class="${NS}-btn" style="margin-top:8px" id="${NS}-qr-copy-btn">📋 Copy URL</button></div>`
                });
                document.getElementById(`${NS}-qr-copy-btn`).addEventListener('click', async () => {
                    const ok = await copyToClipboard(url);
                    Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
                });
            }
        };
    })();

    // ================================================================
    // 15. PAGE DETECTION & VIEWER PATCH
    // ================================================================
    const Page = {
        kind() {
            const p = location.pathname;
            if (/^\/l\//.test(p)) return 'list';
            if (/^\/u\//.test(p)) return 'file';
            if (/^\/file\//.test(p)) return 'file-legacy';
            if (/^\/d\//.test(p)) return 'fs';
            return 'other';
        },
        id() { const m = location.pathname.match(/^\/(?:u|l|file)\/([\w-]+)/); return m ? m[1] : null; },
        fsPath() { const m = location.pathname.match(/^\/d\/(.+)/); return m ? decodeURIComponent(m[1]) : null; }
    };

    function getViewerData() {
        try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow.viewer_data) return unsafeWindow.viewer_data; } catch {}
        try { const el = document.querySelector('#viewer_data,[data-viewer],script[type="application/json"]'); if (el) return JSON.parse(el.textContent); } catch {}
        try { if (window.viewer_data) return window.viewer_data; } catch {}
        return null;
    }

    function getCurrentFileFromViewer() {
        const v = getViewerData();
        if (!v) return null;
        if (v.api_response && v.api_response.id) return v.api_response;
        if (v.api_response && Array.isArray(v.api_response.files)) {
            const i = v.current_file_index || 0;
            return v.api_response.files[i] || v.api_response.files[0];
        }
        return null;
    }

    function patchVideoLoggedRestriction() {
        if (!SETTINGS.bypassVideoLogged) return;
        const unlock = (v) => {
            if (!v) return;
            const apply = (r) => {
                if (!r) return;
                r.allow_video_player = true;
                r.can_download = true;
                r.availability = '';
                r.availability_message = '';
                if (SETTINGS.bypassShowAds) r.show_ads = false;
            };
            apply(v.api_response);
            if (v.api_response && Array.isArray(v.api_response.files)) v.api_response.files.forEach(apply);
        };

        const target = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
        try {
            let _v = target.viewer_data;
            unlock(_v);
            if (SETTINGS.bypassViewerContinuous) {
                Object.defineProperty(target, 'viewer_data', {
                    configurable: true,
                    get() { return _v; },
                    set(v) { unlock(v); _v = v; }
                });
            }
        } catch (e) { Log.warn('viewer patch:', e.message); }

        const tick = () => unlock(getViewerData());
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick);
        else tick();
        let n = 0;
        const t = setInterval(() => { tick(); if (++n > 30) clearInterval(t); }, 200);
    }

    // ================================================================
    // 16. STYLES
    // ================================================================
    const STYLES = `
    .${NS}-toast-container{position:fixed;top:1rem;right:1rem;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:420px;pointer-events:none}
    .${NS}-toast{pointer-events:auto;background:#2f3541;color:#d7dde8;padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.4);border-left:4px solid #a4be8c;animation:${NS}-slide .25s ease-out}
    .${NS}-toast.success{border-left-color:#a4be8c}.${NS}-toast.warn{border-left-color:#ebcb8b}.${NS}-toast.error{border-left-color:#d97070}.${NS}-toast.info{border-left-color:#88c0d0}
    @keyframes ${NS}-slide{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
    .${NS}-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:6px;border:1px solid #555c6e;background:#2f3541;color:#d7dde8;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
    .${NS}-btn:hover{background:#3b4252;border-color:#a4be8c;color:#fff}
    .${NS}-btn.primary{background:#4c7a3f;border-color:#a4be8c;color:#fff;font-weight:600}.${NS}-btn.primary:hover{background:#5c8a4f}
    .${NS}-btn.gold{background:#7a6a3f;border-color:#d4be4c;color:#fff;font-weight:600}.${NS}-btn.gold:hover{background:#8a7a4f}
    .${NS}-btn.danger{background:#703030;border-color:#d97070;color:#fff}.${NS}-btn.danger:hover{background:#804040}
    .${NS}-btn:disabled{opacity:.5;cursor:not-allowed}
    .${NS}-btn-group{display:inline-flex;gap:0}.${NS}-btn-group .${NS}-btn{border-radius:0}.${NS}-btn-group .${NS}-btn:first-child{border-radius:6px 0 0 6px}.${NS}-btn-group .${NS}-btn:last-child{border-radius:0 6px 6px 0}
    .${NS}-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99998;display:flex;align-items:center;justify-content:center;animation:${NS}-fade .15s}
    @keyframes ${NS}-fade{from{opacity:0}to{opacity:1}}
    .${NS}-modal{background:#2f3541;border-radius:12px;max-width:650px;width:92vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,.5)}
    .${NS}-modal-head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #3b4252}
    .${NS}-modal-title{font-weight:600;font-size:15px}
    .${NS}-modal-close{background:none;border:none;color:#8a92a3;font-size:22px;cursor:pointer;padding:0 4px}.${NS}-modal-close:hover{color:#d97070}
    .${NS}-modal-body{padding:18px;overflow-y:auto;flex:1}
    .${NS}-modal-foot{padding:12px 18px;border-top:1px solid #3b4252;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
    .${NS}-input{background:#1f2530;color:#d7dde8;border:1px solid #555c6e;border-radius:4px;padding:6px 10px;font-size:13px;width:100%;box-sizing:border-box;font-family:inherit}
    .${NS}-input:focus{outline:none;border-color:#a4be8c}
    .${NS}-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}.${NS}-row label{flex:1;font-size:13px}.${NS}-row input[type=checkbox]{width:16px;height:16px;cursor:pointer}
    .${NS}-progress{width:100%;height:10px;background:#1f2530;border-radius:5px;overflow:hidden;margin-top:8px}
    .${NS}-progress-bar{height:100%;background:linear-gradient(90deg,#a4be8c,#c4de9c);width:0%;transition:width .2s ease}
    .${NS}-stat{font-size:11px;color:#8a92a3;margin-top:4px;display:flex;justify-content:space-between}
    .${NS}-pill{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;margin:2px}
    .${NS}-pill.ok{background:#3a5040;color:#a4be8c}.${NS}-pill.bad{background:#503a3a;color:#d97070}.${NS}-pill.gold{background:#5a4a20;color:#ebcb8b}.${NS}-pill.info{background:#2a4050;color:#88c0d0}
    .${NS}-toolbar{display:inline-flex;gap:6px;flex-wrap:wrap;margin:6px 0;align-items:center}
    .${NS}-section-title{margin:14px 0 10px;font-size:13px;color:#a4be8c;font-weight:600;border-bottom:1px solid #3b4252;padding-bottom:4px}
    .${NS}-banner{background:#3b4252;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:12px;border-left:3px solid #a4be8c;line-height:1.5}
    .${NS}-badge{position:fixed;bottom:1rem;right:1rem;background:#2f3541;border:1px solid #3b4252;border-radius:8px;padding:6px 10px;font-size:11px;color:#8a92a3;z-index:99990;box-shadow:0 2px 8px rgba(0,0,0,.3);cursor:pointer;transition:all .2s}
    .${NS}-badge:hover{border-color:#a4be8c;color:#d7dde8}
    .${NS}-file-info{background:#1f2530;border-radius:6px;padding:10px 14px;margin-bottom:10px;font-size:12px;line-height:1.6}
    `;

    function injectStyles() {
        if (Caps.gmAddStyle) GM_addStyle(STYLES);
        else { const s = document.createElement('style'); s.textContent = STYLES; (document.head || document.documentElement).appendChild(s); }
    }

    // ================================================================
    // 17. TOAST & MODAL
    // ================================================================
    const Toast = (() => {
        let container;
        const ensure = () => {
            if (container && document.body && document.body.contains(container)) return container;
            container = document.createElement('div');
            container.className = `${NS}-toast-container`;
            (document.body || document.documentElement).appendChild(container);
            return container;
        };
        const show = (msg, kind = 'info', timeout = 4000) => {
            if (!SETTINGS.notificationsEnabled) return;
            const el = document.createElement('div');
            el.className = `${NS}-toast ${kind}`;
            el.innerHTML = msg;
            ensure().appendChild(el);
            if (timeout > 0) setTimeout(() => {
                el.style.transition = 'opacity .3s, transform .3s';
                el.style.opacity = '0';
                el.style.transform = 'translateX(50px)';
                setTimeout(() => el.remove(), 300);
            }, timeout);
            return el;
        };
        return {
            show, ensure,
            info: (m, t) => show(escapeHTML(m), 'info', t),
            success: (m, t) => show(escapeHTML(m), 'success', t),
            warn: (m, t) => show(escapeHTML(m), 'warn', t),
            error: (m, t) => show(escapeHTML(m), 'error', t || 6000),
            html: (h, k, t) => show(h, k, t)
        };
    })();

    const Modal = {
        open({ title = '', body = '', footer = '', onClose } = {}) {
            const bg = document.createElement('div');
            bg.className = `${NS}-modal-bg`;
            bg.innerHTML = `<div class="${NS}-modal"><div class="${NS}-modal-head"><span class="${NS}-modal-title">${escapeHTML(title)}</span><button class="${NS}-modal-close">&times;</button></div><div class="${NS}-modal-body"></div>${footer ? `<div class="${NS}-modal-foot"></div>` : ''}</div>`;
            const bodyEl = bg.querySelector(`.${NS}-modal-body`);
            const footEl = bg.querySelector(`.${NS}-modal-foot`);
            if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
            if (footEl && footer) { if (typeof footer === 'string') footEl.innerHTML = footer; else footEl.appendChild(footer); }
            const close = () => { try { onClose && onClose(); } catch {} bg.remove(); };
            bg.querySelector(`.${NS}-modal-close`).addEventListener('click', close);
            bg.addEventListener('click', e => { if (e.target === bg) close(); });
            document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
            (document.body || document.documentElement).appendChild(bg);
            return { el: bg, body: bodyEl, footer: footEl, close };
        }
    };

    function copyToClipboard(text) {
        if (Caps.gmClipboard) { try { GM_setClipboard(text); return Promise.resolve(true); } catch {} }
        if (navigator.clipboard) return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
        return Promise.resolve(false);
    }

    // ================================================================
    // 18. SETTINGS PANEL
    // ================================================================
    function openSettingsPanel() {
        const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
        const bw = BandwidthTracker.load();
        const body = document.createElement('div');
        const authBadge = SETTINGS.apiKey
            ? `<span class="${NS}-pill gold">★ premium</span>`
            : `<span class="${NS}-pill bad">free tier</span>`;
        const bwPct = BandwidthTracker.getPct();
        const bwColor = bwPct > 80 ? 'bad' : bwPct > 50 ? 'gold' : 'ok';

        body.innerHTML = `
            <div class="${NS}-banner">
                <strong>Pixeldrain Bypass Pro v${VERSION}</strong><br>
                Speed multiplication: ${SETTINGS.maxTotalConnections} parallel connections × 1 MB/s = up to ${SETTINGS.maxTotalConnections} MB/s<br>
                ${authBadge}
                <span class="${NS}-pill ${Caps.fsAccess ? 'ok' : 'bad'}">FSA ${Caps.fsAccess ? '✓' : '✗'}</span>
                <span class="${NS}-pill ${Caps.streams ? 'ok' : 'bad'}">streams ${Caps.streams ? '✓' : '✗'}</span>
                <span class="${NS}-pill ${Caps.gmDownload ? 'ok' : 'bad'}">GM_dl ${Caps.gmDownload ? '✓' : '✗'}</span>
                <span class="${NS}-pill ${bwColor}">BW: ${bwPct.toFixed(1)}%</span>
            </div>

            <div class="${NS}-section-title">★ Premium Auth (Layer A)</div>
            <div class="${NS}-row"><label>API Key</label><input type="password" data-k="apiKey" class="${NS}-input" placeholder="paste pixeldrain API key" style="max-width:320px"></div>
            <div class="${NS}-row"><label>Use direct when authenticated</label><input type="checkbox" data-k="useDirectIfAuth"></div>
            <div class="${NS}-row"><label>Direct threshold (bytes)</label><input type="number" data-k="directThresholdBytes" class="${NS}-input" style="max-width:140px"></div>
            <div class="${NS}-row"><button class="${NS}-btn ${NS}-test-auth">🔑 Verify</button><span class="${NS}-auth-result" style="font-size:12px;color:#8a92a3;margin-left:8px"></span></div>

            <div class="${NS}-section-title">⚡ Speed Multiplication</div>
            <div class="${NS}-row"><label>Enable speed multiplier</label><input type="checkbox" data-k="speedMultiplier"></div>
            <div class="${NS}-row"><label>Connections per mirror</label><input type="number" min="1" max="8" data-k="connectionsPerMirror" class="${NS}-input" style="max-width:80px"></div>
            <div class="${NS}-row"><label>Max total connections</label><input type="number" min="2" max="64" data-k="maxTotalConnections" class="${NS}-input" style="max-width:80px"></div>

            <div class="${NS}-section-title">Strategy</div>
            <div class="${NS}-row"><label>Primary</label><select class="${NS}-input" data-k="primaryStrategy" style="max-width:320px">
                <option value="auto">⚡ Auto (smartest pick)</option>
                <option value="premium_direct">★ Premium direct</option>
                <option value="speed_multiplied">⚡ Speed multiplied (N×1MB/s)</option>
                <option value="multi_proxy_ranged">Multi-proxy chunked</option>
                <option value="single_host_ranged">Single-host ranged</option>
                <option value="gm_stream_fsa">GM → FSA stream</option>
                <option value="native_fetch">Native fetch (no-referrer)</option>
                <option value="gm_blob">GM blob (in-RAM)</option>
                <option value="gm_download">GM_download (browser)</option>
            </select></div>
            <div class="${NS}-row"><label>Auto failover</label><input type="checkbox" data-k="autoFailover"></div>
            <div class="${NS}-row"><label>Pre-flight check</label><input type="checkbox" data-k="preflightCheck"></div>
            <div class="${NS}-row"><label>Auto-download on load</label><input type="checkbox" data-k="autoTriggerOnLoad"></div>

            <div class="${NS}-section-title">Chunking</div>
            <div class="${NS}-row"><label>Max chunks</label><input type="number" min="2" max="64" data-k="multiProxyChunks" class="${NS}-input" style="max-width:80px"></div>
            <div class="${NS}-row"><label>Concurrency</label><input type="number" min="1" max="64" data-k="chunkConcurrency" class="${NS}-input" style="max-width:80px"></div>
            <div class="${NS}-row"><label>Retries</label><input type="number" min="0" max="10" data-k="chunkRetry" class="${NS}-input" style="max-width:80px"></div>
            <div class="${NS}-row"><label>Adaptive chunking</label><input type="checkbox" data-k="adaptiveChunking"></div>
            <div class="${NS}-row"><label>Resumable</label><input type="checkbox" data-k="resumableEnabled"></div>

            <div class="${NS}-section-title">Bypass & Protection</div>
            <div class="${NS}-row"><label>Video unlock (logged-in gate)</label><input type="checkbox" data-k="bypassVideoLogged"></div>
            <div class="${NS}-row"><label>Continuous viewer patch</label><input type="checkbox" data-k="bypassViewerContinuous"></div>
            <div class="${NS}-row"><label>Hide ads</label><input type="checkbox" data-k="bypassShowAds"></div>
            <div class="${NS}-row"><label>View-pad (prevent captcha)</label><input type="checkbox" data-k="viewPadEnabled"></div>
            <div class="${NS}-row"><label>Captcha pre-check</label><input type="checkbox" data-k="captchaPreCheck"></div>
            <div class="${NS}-row"><label>Captcha auto-open tab</label><input type="checkbox" data-k="captchaAutoOpen"></div>

            <div class="${NS}-section-title">Circuit Breaker</div>
            <div class="${NS}-row"><label>Failure threshold</label><input type="number" min="1" max="10" data-k="circuitBreakerThreshold" class="${NS}-input" style="max-width:80px"></div>
            <div class="${NS}-row"><label>Cooldown (ms)</label><input type="number" data-k="circuitBreakerCooldown" class="${NS}-input" style="max-width:120px"></div>

            <div class="${NS}-section-title">Proxies (${PROXY_MIRRORS.length} built-in)</div>
            <div class="${NS}-row"><label>Custom hosts</label><input type="text" data-k="customProxy" class="${NS}-input" placeholder="host1,host2,..." style="max-width:320px"></div>
            <div class="${NS}-row"><label>Probe file ID</label><input type="text" data-k="healthProbeId" class="${NS}-input" placeholder="optional" style="max-width:200px"></div>
            <div class="${NS}-row">
                <button class="${NS}-btn ${NS}-test">🔍 Test All</button>
                <button class="${NS}-btn ${NS}-unblock">🔓 Unblock</button>
                <button class="${NS}-btn ${NS}-reset-cb">Reset Circuits</button>
            </div>
            <div class="${NS}-results" style="font-size:11px;color:#8a92a3;margin-top:6px;max-height:120px;overflow-y:auto"></div>

            <div class="${NS}-section-title">External Downloaders</div>
            <div class="${NS}-row"><label>JDownloader URL</label><input type="text" data-k="jdownloaderUrl" class="${NS}-input" style="max-width:320px"></div>
            <div class="${NS}-row"><label>Aria2 RPC URL</label><input type="text" data-k="aria2RpcUrl" class="${NS}-input" style="max-width:320px"></div>
            <div class="${NS}-row"><label>Aria2 secret</label><input type="text" data-k="aria2Secret" class="${NS}-input" style="max-width:200px"></div>
            <div class="${NS}-row"><label>Aria2 connections</label><input type="number" min="1" max="64" data-k="aria2MaxConn" class="${NS}-input" style="max-width:80px"></div>

            <div class="${NS}-section-title">UI</div>
            <div class="${NS}-row"><label>Notifications</label><input type="checkbox" data-k="notificationsEnabled"></div>
            <div class="${NS}-row"><label>Debug log</label><input type="checkbox" data-k="debugLog"></div>

            <div class="${NS}-section-title">Stats & Bandwidth</div>
            <div class="${NS}-file-info">
                Downloads: <strong>${stats.count || 0}</strong> · Total: <strong>${formatBytes(stats.bytes || 0)}</strong><br>
                Saved bandwidth: <strong>${formatBytes(stats.savedBandwidth || 0)}</strong> (via proxy, 0 cost to your cap)<br>
                Current session BW used: <strong>${formatBytes(bw.used || 0)}</strong> / ${formatBytes(BANDWIDTH_CAP)} (${bwPct.toFixed(1)}%)<br>
                Remaining: <strong>${formatBytes(BandwidthTracker.getRemaining())}</strong>
            </div>
            <div class="${NS}-row" style="margin-top:8px">
                <button class="${NS}-btn ${NS}-reset-stats">Reset stats</button>
                <button class="${NS}-btn ${NS}-reset-bw">Reset BW</button>
                <button class="${NS}-btn ${NS}-cleanup">Cleanup jobs</button>
                <button class="${NS}-btn ${NS}-show-jobs">📋 Jobs</button>
            </div>
            <div style="margin-top:14px;font-size:11px;color:#555c6e;text-align:center">v${VERSION} · ${PROXY_MIRRORS.length} mirrors · Circuit breaker · Speed multiplication</div>`;

        const footer = `<button class="${NS}-btn ${NS}-cancel">Cancel</button><button class="${NS}-btn primary ${NS}-save">💾 Save</button>`;
        const m = Modal.open({ title: `⚙ Pixeldrain Bypass Pro v${VERSION}`, body, footer });

        body.querySelectorAll('[data-k]').forEach(el => {
            const v = SETTINGS[el.dataset.k];
            if (el.type === 'checkbox') el.checked = !!v;
            else if (el.tagName === 'SELECT') el.value = v || '';
            else el.value = v != null ? v : '';
        });

        body.querySelector(`.${NS}-test-auth`).addEventListener('click', async ev => {
            ev.target.disabled = true;
            const inp = body.querySelector('[data-k="apiKey"]');
            const prev = SETTINGS.apiKey;
            SETTINGS = saveSettings({ apiKey: inp.value.trim() });
            const u = await PDApi.user();
            SETTINGS = saveSettings({ apiKey: prev });
            const r = body.querySelector(`.${NS}-auth-result`);
            if (u && (u.username || u.email)) {
                r.innerHTML = `<span class="${NS}-pill ok">✓ ${escapeHTML(u.username || u.email)}${u.subscription ? ' · ' + escapeHTML(u.subscription.name || u.subscription.type || 'premium') : ''}</span>`;
            } else r.innerHTML = `<span class="${NS}-pill bad">✗ invalid</span>`;
            ev.target.disabled = false;
        });

        body.querySelector(`.${NS}-test`).addEventListener('click', async ev => {
            ev.target.disabled = true;
            const probeId = body.querySelector('[data-k="healthProbeId"]').value.trim() || Page.id() || '';
            const r = await ProxyManager.checkAll(true, probeId);
            body.querySelector(`.${NS}-results`).innerHTML = r
                .sort((a, b) => (a.ok ? a.ms : 99999) - (b.ok ? b.ms : 99999))
                .map(x => `<span class="${NS}-pill ${x.ok ? 'ok' : 'bad'}">${escapeHTML(x.proxy.name)}: ${x.ok ? Math.round(x.ms) + 'ms' : '✗' + (x.status ? ' ' + x.status : '')}</span>`).join(' ');
            ev.target.disabled = false;
        });

        body.querySelector(`.${NS}-unblock`).addEventListener('click', () => { ProxyManager.unblockAll(); Toast.success('Unblocked all'); });
        body.querySelector(`.${NS}-reset-cb`).addEventListener('click', () => { CircuitBreaker.reset(); Toast.success('Circuits reset'); });
        body.querySelector(`.${NS}-reset-stats`).addEventListener('click', () => {
            SETTINGS = saveSettings({ downloadStats: { count: 0, bytes: 0, savedBandwidth: 0, lastReset: Date.now() } });
            Toast.success('Stats reset'); m.close();
        });
        body.querySelector(`.${NS}-reset-bw`).addEventListener('click', () => { BandwidthTracker.reset(); Toast.success('BW reset'); m.close(); });
        body.querySelector(`.${NS}-cleanup`).addEventListener('click', () => { Toast.success(`Cleaned ${ResumeManager.cleanup(0)}`); });
        body.querySelector(`.${NS}-show-jobs`).addEventListener('click', () => {
            const jobs = ResumeManager.getPendingJobs();
            if (!jobs.length) { Toast.info('No pending jobs'); return; }
            const html = jobs.map(j => {
                const sum = j.chunks.reduce((a, b) => a + b, 0);
                const pct = j.fileSize ? (sum / j.fileSize * 100).toFixed(1) : '?';
                return `<div style="padding:6px;border-bottom:1px solid #3b4252"><strong>${escapeHTML(j.fileName)}</strong> · ${pct}% (${formatBytes(sum)} / ${formatBytes(j.fileSize)})</div>`;
            }).join('');
            Modal.open({ title: `Pending Jobs (${jobs.length})`, body: html });
        });

        m.el.querySelector(`.${NS}-cancel`).addEventListener('click', () => m.close());
        m.el.querySelector(`.${NS}-save`).addEventListener('click', () => {
            const patch = {};
            body.querySelectorAll('[data-k]').forEach(el => {
                const k = el.dataset.k;
                if (el.type === 'checkbox') patch[k] = el.checked;
                else if (el.type === 'number') patch[k] = Number(el.value) || DEFAULTS[k];
                else patch[k] = el.value.trim();
            });
            SETTINGS = saveSettings(patch);
            Toast.success('Settings saved');
            m.close();
        });
    }

    // ================================================================
    // 19. TOOLBAR BUILDER
    // ================================================================
    function buildToolbar(file, kind, files = null) {
        const tb = document.createElement('div');
        tb.className = `${NS}-toolbar`;
        tb.dataset.pdbp = '1';
        const mk = (text, title, handler, cls = '') => {
            const b = document.createElement('button');
            b.className = `${NS}-btn ${cls}`.trim();
            b.textContent = text;
            b.title = title;
            b.addEventListener('click', handler);
            return b;
        };

        const hasAuth = !!PDApi._authHeader();

        if ((kind === 'file' || kind === 'file-legacy' || kind === 'fs') && file) {
            tb.appendChild(mk('⬇ Download', `Smart download (auto)${hasAuth ? ' · premium' : ''}`, () => Downloader.run(file, 'auto'), 'primary'));

            if (hasAuth) tb.appendChild(mk('★ Premium', 'Direct via API key (no cap)', () => Downloader.run(file, 'premium_direct'), 'gold'));

            if (Caps.fsAccess && SETTINGS.speedMultiplier) {
                tb.appendChild(mk('⚡ Speed×', `Speed multiplied (${SETTINGS.maxTotalConnections} connections)`, () => Downloader.run(file, 'speed_multiplied')));
            }

            if (Caps.fsAccess) {
                tb.appendChild(mk('📦 Multi', 'Multi-proxy chunked', () => Downloader.run(file, 'multi_proxy_ranged')));
            }
            if (Caps.gmDownload) tb.appendChild(mk('📥 GM', 'GM_download', () => Downloader.run(file, 'gm_download')));

            if ((file.mime_type || '').match(/^(video|audio)\//)) {
                tb.appendChild(mk('▶ Play', 'Stream via proxy', () => Strategies.stream({ id: file.id, name: file.name, mime: file.mime_type })));
            }

            tb.appendChild(mk('🔗 Copy', 'Copy proxy URL', async () => {
                const p = await ProxyManager.best(file.id);
                const url = ProxyManager.url(p, file.id, { download: true });
                const ok = await copyToClipboard(url);
                Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
            }));

            tb.appendChild(mk('📤 Export', 'curl/wget/aria2c/IDM/axel/PS', () => ExportGenerator.showModal(file)));

            tb.appendChild(mk('📱 QR', 'QR code', () => QRCode.show(file)));

            tb.appendChild(mk('JD', 'Send to JDownloader', async () => {
                try {
                    const p = await ProxyManager.best(file.id);
                    await Strategies.jdownloader({ urls: ProxyManager.url(p, file.id, { download: true }) });
                    Toast.success('Sent to JDownloader');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('Aria2', 'Send to Aria2 RPC', async () => {
                try {
                    const p = await ProxyManager.best(file.id);
                    await Strategies.aria2({ urls: ProxyManager.url(p, file.id, { download: true }), names: file.name });
                    Toast.success('Sent to Aria2');
                } catch (e) { Toast.error(e.message); }
            }));

            if (SETTINGS.resumableEnabled && ResumeManager.findByFile(file.id)) {
                tb.appendChild(mk('🔄 Resume', 'Resume incomplete download', () => Downloader.run(file, 'speed_multiplied')));
            }

            tb.appendChild(mk('ℹ Info', 'File info & preflight', async () => {
                const pf = await PDApi.preflight(file.id);
                const proxy = await ProxyManager.best(file.id);
                let html = `<div class="${NS}-file-info">`;
                html += `<strong>Name:</strong> ${escapeHTML(pf.name || file.name)}<br>`;
                html += `<strong>Size:</strong> ${formatBytes(pf.size || file.size)}<br>`;
                html += `<strong>MIME:</strong> ${escapeHTML(pf.mime || file.mime_type || 'unknown')}<br>`;
                html += `<strong>Can download:</strong> ${pf.canDownload ? '✓' : '✗'}<br>`;
                html += `<strong>Captcha needed:</strong> ${pf.needsCaptcha ? '⚠ YES' : '✓ No'}<br>`;
                if (pf.availability) html += `<strong>Availability:</strong> ${escapeHTML(pf.availability)}<br>`;
                html += `<strong>Speed limit:</strong> ${formatBytes(pf.speedLimit || SPEED_LIMIT_PER_CONN)}/s per connection<br>`;
                html += `<strong>Best mirror:</strong> ${escapeHTML(proxy.host)}<br>`;
                html += `<strong>Proxy URL:</strong> <span style="word-break:break-all">${escapeHTML(ProxyManager.url(proxy, file.id))}</span>`;
                html += `</div>`;
                Modal.open({ title: 'File Info', body: html });
            }));
        }

        if (kind === 'list' && files && files.length) {
            const valid = files.filter(f => !f.availability && !f.availability_message);
            tb.appendChild(mk(`⬇ All (${valid.length})`, 'Batch download', () => Downloader.runBatch(valid, 'auto'), 'primary'));
            tb.appendChild(mk('🔗 All URLs', 'Copy all proxy URLs', async () => {
                const p = await ProxyManager.best();
                const urls = valid.map(f => ProxyManager.url(p, f.id, { download: true })).join('\n');
                const ok = await copyToClipboard(urls);
                Toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed');
            }));
            tb.appendChild(mk('📤 Batch', 'Export all commands', () => ExportGenerator.showBatch(valid)));
            tb.appendChild(mk('JD All', 'All to JDownloader', async () => {
                try {
                    const p = await ProxyManager.best();
                    await Strategies.jdownloader({ urls: valid.map(f => ProxyManager.url(p, f.id, { download: true })) });
                    Toast.success('Sent');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('Aria2 All', 'All to Aria2', async () => {
                try {
                    const p = await ProxyManager.best();
                    await Strategies.aria2({
                        urls: valid.map(f => ProxyManager.url(p, f.id, { download: true })),
                        names: valid.map(f => f.name)
                    });
                    Toast.success('Sent');
                } catch (e) { Toast.error(e.message); }
            }));
            tb.appendChild(mk('📦 ZIP', 'Server-side ZIP', async () => {
                const id = Page.id();
                const p = PROXY_MIRRORS.find(m => m.zip) || (await ProxyManager.best());
                window.open(ProxyManager.url(p, id, { zip: true }));
            }));
        }

        tb.appendChild(mk('⚙', 'Settings', openSettingsPanel));
        return tb;
    }

    // ================================================================
    // 20. INJECTION & INIT
    // ================================================================
    function injectIntoToolbar(el) {
        if (!el || el.dataset.pdbpInjected) return;
        const kind = Page.kind();
        let file = getCurrentFileFromViewer(), files = null;
        const v = getViewerData();
        if (kind === 'list' && v && v.api_response && Array.isArray(v.api_response.files)) {
            files = v.api_response.files;
            if (!file) file = files[0];
        }
        if (!file && !files) return;
        const toolbar = buildToolbar(file, kind, files);
        el.parentElement && el.parentElement.insertBefore(toolbar, el.nextSibling);
        el.dataset.pdbpInjected = '1';
    }

    function injectFallback() {
        if (document.querySelector(`[data-pdbp="1"]`)) return;
        const kind = Page.kind(), id = Page.id();
        if (!id && kind !== 'fs') return;

        const host = document.createElement('div');
        host.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:99997;background:#2f3541;padding:12px;border-radius:10px;border:1px solid #a4be8c;box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:90vw;overflow-x:auto';

        let file = getCurrentFileFromViewer();
        const v = getViewerData();
        const files = (v && v.api_response && Array.isArray(v.api_response.files)) ? v.api_response.files : null;

        if (!file && id) {
            file = { id, name: id, size: 0, mime_type: '' };
            PDApi.fileInfo(id).then(info => {
                file.name = info.name || id;
                file.size = info.size || 0;
                file.mime_type = info.mime_type || '';
            }).catch(() => {});
        }

        host.appendChild(buildToolbar(file, kind === 'list' ? 'list' : 'file', files));
        (document.body || document.documentElement).appendChild(host);
    }

    function injectBadge() {
        if (document.querySelector(`.${NS}-badge`)) return;
        const stats = SETTINGS.downloadStats || { count: 0, bytes: 0, savedBandwidth: 0 };
        const badge = document.createElement('div');
        badge.className = `${NS}-badge`;
        badge.title = 'Pixeldrain Bypass Pro — click for settings';
        badge.innerHTML = `<strong>PD Pro</strong> v${VERSION} · ${stats.count} DLs · ${formatBytes(stats.savedBandwidth || 0)} saved`;
        badge.addEventListener('click', openSettingsPanel);
        (document.body || document.documentElement).appendChild(badge);
    }

    function registerMenu() {
        if (typeof GM_registerMenuCommand !== 'function') return;
        GM_registerMenuCommand('⚙ Settings', openSettingsPanel);
        GM_registerMenuCommand('📊 Test Proxies', async () => {
            Toast.info('Testing mirrors…');
            const r = await ProxyManager.checkAll(true, Page.id() || '');
            const alive = r.filter(x => x.ok);
            Toast.info(`${alive.length}/${r.length} alive (best: ${alive.length ? Math.round(alive.sort((a, b) => a.ms - b.ms)[0].ms) + 'ms' : 'none'})`);
        });
        GM_registerMenuCommand(`🚀 Strategy: ${SETTINGS.primaryStrategy}`, openSettingsPanel);
        GM_registerMenuCommand('🔓 Unblock all mirrors', () => { ProxyManager.unblockAll(); Toast.success('Unblocked'); });
        GM_registerMenuCommand('🧹 Cleanup resume jobs', () => Toast.success(`Cleaned ${ResumeManager.cleanup(0)}`));
        GM_registerMenuCommand('❌ Cancel all downloads', () => { Downloader.cancelAll(); Toast.warn('Cancelled'); });
        if (SETTINGS.apiKey) GM_registerMenuCommand('★ Premium: active', () => {});
    }

    function findToolbar() {
        return document.querySelector('.toolbar > .separator.svelte-jngqwx')
            || document.querySelector('.toolbar .separator')
            || document.querySelector('.toolbar')
            || document.querySelector('[class*="toolbar"]')
            || null;
    }

    function tryInject() {
        const el = findToolbar();
        if (el) injectIntoToolbar(el);
        else injectFallback();
    }

    // ================================================================
    // 21. MAIN INIT
    // ================================================================
    function init() {
        Log.info(`v${VERSION} init — Speed multiplication + Circuit breaker + ${PROXY_MIRRORS.length} mirrors`);

        try { patchVideoLoggedRestriction(); } catch (e) { Log.warn(e); }

        registerMenu();
        ResumeManager.cleanup();

        const onReady = () => {
            try { injectStyles(); } catch {}

            const obs = new MutationObserver(() => {
                const el = findToolbar();
                if (el && !el.dataset.pdbpInjected) injectIntoToolbar(el);
            });
            obs.observe(document.documentElement, { childList: true, subtree: true });
            setTimeout(() => obs.disconnect(), 60000);

            let lastPath = location.pathname;
            const onNav = () => {
                if (location.pathname !== lastPath) {
                    lastPath = location.pathname;
                    setTimeout(() => {
                        document.querySelectorAll('[data-pdbp="1"]').forEach(e => e.remove());
                        document.querySelectorAll('[data-pdbp-injected]').forEach(e => delete e.dataset.pdbpInjected);
                        document.querySelectorAll(`[data-pdbp-injected]`).forEach(e => e.removeAttribute('data-pdbp-injected'));
                        try { patchVideoLoggedRestriction(); } catch {}
                        tryInject();
                    }, 600);
                }
            };
            const origPush = history.pushState, origReplace = history.replaceState;
            history.pushState = function () { origPush.apply(this, arguments); onNav(); };
            history.replaceState = function () { origReplace.apply(this, arguments); onNav(); };
            window.addEventListener('popstate', onNav);

            if (SETTINGS.captchaAutoDetect && document.body) {
                const co = new MutationObserver(() => {
                    if (CaptchaHandler.detectOnPage()) {
                        Toast.warn('⚠ Captcha detected on page!', 8000);
                        co.disconnect();
                    }
                });
                co.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => co.disconnect(), 20000);
            }

            if (SETTINGS.bandwidthTracker && BandwidthTracker.isNearCap()) {
                Toast.warn(`⚠ Bandwidth ${BandwidthTracker.getPct().toFixed(0)}% used. Using proxy mirrors to save cap.`, 6000);
            }

            setTimeout(() => {
                try { tryInject(); } catch (e) { Log.error(e); }
                injectBadge();

                if (Page.kind() === 'fs') {
                    const p = Page.fsPath();
                    if (p) PDApi.fsPath(p).then(() => injectFallback()).catch(() => {});
                }

                if ((Page.kind() === 'file' || Page.kind() === 'list') && SETTINGS.autoTriggerOnLoad) {
                    const f = getCurrentFileFromViewer();
                    if (f) {
                        Log.info('Auto-trigger download');
                        Downloader.run(f, 'auto').catch(() => {});
                    }
                }
            }, 500);
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') onReady();
        else document.addEventListener('DOMContentLoaded', onReady);
    }

    init();
})();
