// ==UserScript==
// @name         4ndr0tools - Blob2URL
// @namespace    https://github.com/4ndr0666/userscripts
// @version      6.3
// @author       4ndr0666
// @description  Universal blob exfiltration, interactive asset sniffing, CSP/CORS bypass.
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Blob2URL.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        unsafeWindow
// @connect      *
// ==/UserScript==

/* ═══ v6.2/v6.3 — superset gap mitigation + IG auto-extract (strictly additive; zero regressions) ═══
   01  Per-document injection sentinel: a second copy of the script (dual install, re-exec)
       aborts before registering any UI, hotkeys, or observers.
   02  hardenedFetch error surface completed: onerror/ontimeout/onabort wired, 45s timeout,
       HTTP status validation (status 0 tolerated for opaque blob: responses), and a
       page-context fetch() fallback transport — the privileged transport stays first, so
       the CSP/CORS bypass is preserved and only failure escalates to the fallback.
   03  GM_download lifecycle completed: onerror/ontimeout handlers, 60s timeout, object-URL
       revocation on every terminal path (v6.1 leaked the URL on failure), anchor-click
       fallback for managers without GM_download.
   04  MIME map extended 6 → 50 types; unknown types derive an extension from the subtype;
       untyped blobs go through a magic-byte sniffer (PNG/JPG/GIF/PDF/WEBP/WAV/AVI/MP4/MOV/
       M4A/AVIF/HEIC/MKV/MP3/OGG/FLAC/ZIP/GZ/BMP/ICO/SVG) before the .bin terminal fallback.
   05  Filenames salted with 4 random chars — rapid extractions can no longer collide.
   06  Extract buttons hardened: type="button" (cannot submit an ancestor form), in-flight
       click lock, self-reverting state labels, safe insertion with appendChild fallback,
       and <source> elements now mount their control after the host <video|audio|picture>
       so it is actually visible and clickable (v6.1 dropped it inside the container).
   07  deploy(): selector extended with iframe/embed/object; supplementary sweep catches
       currentSrc blob URLs that attribute selectors cannot see (MSE-style sources);
       observer re-scans debounced 100ms so mutation-storm SPAs stop thrashing; bootstrap
       is body-ready so document-start execution also survives.
   08  URL resolution unified in resolveMediaUrl(): currentSrc → href → src → data → first
       srcset entry → computed background-image, with non-string candidates filtered
       (v6.1 could throw on SVG anchors exposing SVGAnimatedString).
   09  Sniffer hardened: self-healing mask when host pages rewrite <body>, passive
       mousemove, ESC exits, Enter no longer hijacks editable contexts (v6.1 broke form
       submission while sniffing), blob: captures also drive the full extraction pipeline
       (a raw blob: URL pasted off-page is inert — the file is the actionable artifact),
       clipboard writes fall back to navigator.clipboard/execCommand.
   10  Hotkeys: Alt+S is case-insensitive with modifier/IME/repeat guards and listens in
       the capture phase so page handlers cannot swallow it first.
   11  Manager portability guards for GM_addStyle/GM_setClipboard/GM_download/
       GM_registerMenuCommand with in-page fallbacks — graceful degradation instead of a
       crash on managers lacking the grants.
   12  New command "Ψ: Copy All Discovered Blob URLs" (deduped, newline-joined).
   13  Instagram auto-extract module — faithful JS port of ig_extract.py (FINAL REVISION):
       Route 1 structural walk (video_versions progressive with min-type dedupe;
       video_dash_manifest DASH BaseURLs + FBQualityLabel via DOMParser) and Route 2
       regex fallback net over the surrogate-safe clean() chain (entity decode →
       surrogate pairs → \u singles → \/ \" unescape). Ordering + dedupe semantics
       preserved 1:1 (progressive sorted by type, labeled dash, fallback net).
   14  Live sources the CLI could never reach: best-effort page-context fetch/XHR
       response sniffing (unsafeWindow property wrap — no inline script, CSP-safe,
       fingerprint-masked toString), script[type="application/json"] scanning on every
       debounced re-scan, and a one-shot full-DOM Route 2 sweep. The session is already
       authenticated, so cookies/login-wall juggling is moot; --save maps to the vault
       SAVE/AUTOSAVE actions.
   15  Ψ IG VAULT panel (Alt+I / menu, instagram.com only): newest-first entries with
       per-URL SAVE/COPY, URL dedupe index, 500-entry cap, XSS-escaped rendering,
       RESCAN and AUTOSAVE toggle (auto-downloads the best progressive URL of each
       new capture, once per URL).
   16  IG CDN <video> elements get direct extract controls with click-time URL
       re-resolution (survives React element reuse); runExtraction/buildFileName gain
       an optional filename prefix — v6.2 default naming unchanged. Alt+I only binds
       on instagram.com so page shortcuts elsewhere are untouched.
   Superset check: every v6.1 feature — privileged fetch, button UX (labels/states/styles),
   mimeExt table, sniffer (mask/track/capture/toggle), deploy + MutationObserver + lock,
   both menu commands, Alt+S / Enter hotkeys, per-frame operation, metadata — is intact.
*/

(function() {
    'use strict';

    // ──[01] Duplicate-injection sentinel (DOM-based: shared truth across sandbox modes) ──
    const SENTINEL = 'data-psi-blob2url-instance';
    const root = document.documentElement;
    if (!root || (root.hasAttribute && root.hasAttribute(SENTINEL))) return;
    try { root.setAttribute(SENTINEL, String(Date.now())); } catch (_) {}

    const SCRIPT_ID = 'Ψ-blob2url';
    const log = (m) => console.log(`%c[${SCRIPT_ID}] %c${m}`, "color: #00ff41; font-weight: bold;", "color: #bbb;");

    const CONFIG = {
        styles: `
            .psi-btn { margin-left:8px; padding:3px 10px; color:#00ff41; background:#000; border:1px solid #00ff41; border-radius:2px; cursor:crosshair; z-index:2147483647; font-family:monospace; font-size:10px; text-transform:uppercase; box-shadow:0 0 5px #00ff41; transition:0.2s; white-space:nowrap; }
            .psi-btn:hover { background:#00ff41; color:#000; }
            .psi-btn.loading { background:#555; color:#ccc; border-color:#555; box-shadow:none; }
            .psi-btn.success { background:#004400; color:#00ff41; box-shadow:0 0 10px #00ff41; }
            .psi-btn.fail { background:#440000; color:#ff0000; border-color:#ff0000; box-shadow:0 0 10px #ff0000; }
            .psi-sniff-mask { background:rgba(0,255,65,0.1); border:1px solid #00ff41; position:fixed; z-index:10000; pointer-events:none; }
            .psi-ig-panel { position:fixed; right:12px; bottom:12px; max-width:440px; max-height:46vh; overflow-y:auto; background:#000; border:1px solid #00ff41; color:#00ff41; font-family:monospace; font-size:10px; z-index:2147483647; box-shadow:0 0 12px rgba(0,255,65,0.55); }
            .psi-ig-head { position:sticky; top:0; background:#000; padding:5px 7px; border-bottom:1px solid #00ff41; font-weight:bold; }
            .psi-ig-entry { border-bottom:1px solid #0a3a1a; padding:4px 7px; }
            .psi-ig-tag { font-weight:bold; color:#00ff41; }
            .psi-ig-code { color:#0f0; margin-left:6px; }
            .psi-ig-url { color:#bbb; word-break:break-all; margin:2px 0 3px 0; }
            .psi-ig-act { margin-right:4px; margin-top:1px; padding:2px 7px; color:#00ff41; background:#000; border:1px solid #00ff41; border-radius:2px; cursor:pointer; font-family:monospace; font-size:9px; text-transform:uppercase; }
            .psi-ig-act:hover { background:#00ff41; color:#000; }
        `,
        labels: { init: "Ψ_EXTRACT", load: "Ψ_PROC...", win: "Ψ_DONE", fail: "Ψ_ERR" },
        mimeExt: {
            // v6.1 set (preserved)
            'video/mp4':'.mp4', 'video/webm':'.webm',
            'image/png':'.png', 'image/jpeg':'.jpg', 'image/webp':'.webp',
            'application/pdf':'.pdf',
            // v6.2 coverage
            'video/quicktime':'.mov', 'video/x-matroska':'.mkv', 'video/x-msvideo':'.avi',
            'video/ogg':'.ogv', 'video/mp2t':'.ts', 'video/3gpp':'.3gp', 'video/x-flv':'.flv',
            'image/gif':'.gif', 'image/svg+xml':'.svg', 'image/bmp':'.bmp', 'image/tiff':'.tiff',
            'image/avif':'.avif', 'image/apng':'.png', 'image/x-icon':'.ico',
            'image/vnd.microsoft.icon':'.ico', 'image/heic':'.heic', 'image/heif':'.heif',
            'audio/mpeg':'.mp3', 'audio/mp4':'.m4a', 'audio/x-m4a':'.m4a', 'audio/aac':'.aac',
            'audio/ogg':'.ogg', 'audio/wav':'.wav', 'audio/x-wav':'.wav', 'audio/webm':'.weba',
            'audio/flac':'.flac',
            'text/plain':'.txt', 'text/csv':'.csv', 'text/html':'.html', 'text/css':'.css',
            'text/javascript':'.js', 'application/json':'.json', 'application/xml':'.xml',
            'application/rtf':'.rtf', 'application/zip':'.zip', 'application/gzip':'.gz',
            'application/x-tar':'.tar', 'application/x-7z-compressed':'.7z',
            'application/wasm':'.wasm',
            'font/woff':'.woff', 'font/woff2':'.woff2', 'font/ttf':'.ttf', 'font/otf':'.otf'
        }
    };

    // ──[11] Style injection with manager fallback ──
    const injectStyles = (css) => {
        try {
            if (typeof GM_addStyle === 'function') { GM_addStyle(css); return; }
        } catch (_) {}
        try {
            const s = document.createElement('style');
            s.textContent = css;
            (document.head || document.documentElement).appendChild(s);
        } catch (_) {}
    };
    injectStyles(CONFIG.styles);

    // ──[11] Clipboard with escalation chain (GM → async API → execCommand) ──
    const fallbackCopy = (text) => {
        try {
            const ta = document.createElement('textarea');
            ta.value = String(text);
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            ta.remove();
            return !!ok;
        } catch (_) { return false; }
    };
    const copyText = (text) => new Promise((resolve) => {
        try {
            if (typeof GM_setClipboard === 'function') { GM_setClipboard(String(text)); resolve(true); return; }
        } catch (_) {}
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(String(text)).then(() => resolve(true), () => resolve(fallbackCopy(text)));
            return;
        }
        resolve(fallbackCopy(text));
    });

    // ──[08] Unified, type-safe URL resolution (superset of every v6.1 path) ──
    const firstSrcsetUrl = (el) => {
        try {
            const ss = el.getAttribute && el.getAttribute('srcset');
            if (!ss) return '';
            const first = ss.split(',')[0].trim();
            return first ? first.split(/\s+/)[0] : '';
        } catch (_) { return ''; }
    };
    const resolveMediaUrl = (el) => {
        try {
            if (!el || el.nodeType !== 1) return '';
            const candidates = [el.currentSrc, el.href, el.src, el.data, firstSrcsetUrl(el)];
            for (let i = 0; i < candidates.length; i++) {
                const c = candidates[i];
                if (typeof c === 'string' && c) return c;
            }
            const bg = getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none') {
                const m = bg.match(/url\(["']?(.*?)["']?\)/);
                if (m && m[1]) return m[1];
            }
        } catch (_) {}
        return '';
    };

    // ──[02] Transports: privileged first (CSP/CORS bypass), page-context fallback second ──
    const gmFetch = (url) => new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== 'function') { reject(new Error('GM_xmlhttpRequest unavailable')); return; }
        let settled = false;
        const fail = (msg) => { if (!settled) { settled = true; reject(new Error(msg)); } };
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                timeout: 45000,
                onload: (res) => {
                    if (settled) return;
                    const status = res && typeof res.status === 'number' ? res.status : -1;
                    const body = res && res.response;
                    const statusOk = (status >= 200 && status < 300) || status === 0; // 0 = opaque blob:/file: on some managers
                    if (statusOk && body) { settled = true; resolve(body); }
                    else if (status >= 400) fail(`HTTP ${status} via privileged transport`);
                    else if (!body) fail(`empty response body (HTTP ${status})`);
                    else fail(`unexpected HTTP status ${status}`);
                },
                onerror: (err) => fail(`network error${err && err.error ? ': ' + err.error : ''}`),
                ontimeout: () => fail('privileged transport timeout (45s)'),
                onabort: () => fail('privileged transport aborted')
            });
        } catch (err) { fail('GM_xmlhttpRequest threw: ' + (err && err.message ? err.message : err)); }
    });
    const pageFetch = (url) => new Promise((resolve, reject) => {
        if (typeof fetch !== 'function') { reject(new Error('page transport unavailable')); return; }
        fetch(url).then((r) => {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' via page transport');
            return r.blob();
        }).then(resolve, (err) => reject(new Error(err && err.message ? err.message : 'page transport failed')));
    });
    const hardenedFetch = (url) => gmFetch(url).catch((gmErr) =>
        pageFetch(url).catch((pageErr) => {
            throw new Error('all transports failed — ' + gmErr.message + ' | ' + pageErr.message);
        })
    );

    // ──[04] Extension resolution: MIME table → subtype → magic bytes → .bin ──
    const extForMime = (type) => {
        const t = String(type || '').split(';')[0].trim().toLowerCase();
        if (CONFIG.mimeExt[t]) return CONFIG.mimeExt[t];
        if (t && t !== 'application/octet-stream') {
            const sub = t.split('/')[1];
            if (sub) {
                const cleaned = sub.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8);
                if (cleaned) return '.' + cleaned;
            }
        }
        return '';
    };
    const sniffExt = async (blob) => {
        try {
            if (!blob || typeof blob.size !== 'number' || !blob.size || typeof blob.slice !== 'function') return '';
            const head = new Uint8Array(await blob.slice(0, 32).arrayBuffer());
            if (head.length < 4) return '';
            const eq = (i, s) => { for (let j = 0; j < s.length; j++) if (head[i + j] !== s.charCodeAt(j)) return false; return true; };
            if (eq(0, '\x89PNG')) return '.png';
            if (eq(0, '\xFF\xD8\xFF')) return '.jpg';
            if (eq(0, 'GIF8')) return '.gif';
            if (eq(0, '%PDF')) return '.pdf';
            if (eq(0, 'RIFF')) {
                if (eq(8, 'WEBP')) return '.webp';
                if (eq(8, 'WAVE')) return '.wav';
                if (eq(8, 'AVI ')) return '.avi';
            }
            if (eq(4, 'ftyp') && head.length >= 12) {
                const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
                if (/^(avif|avis)/i.test(brand)) return '.avif';
                if (/^(heic|heix|hevc|mif1|msf1)/i.test(brand)) return '.heic';
                if (eq(8, 'qt  ')) return '.mov';
                if (/^M4[AB]/.test(brand)) return '.m4a';
                if (/^3gp/i.test(brand)) return '.3gp';
                return '.mp4';
            }
            if (eq(0, '\x1A\x45\xDF\xA3')) return '.mkv';
            if (eq(0, 'ID3')) return '.mp3';
            if (head[0] === 0xFF && (head[1] & 0xE0) === 0xE0) return '.mp3';
            if (eq(0, 'OggS')) return '.ogg';
            if (eq(0, 'fLaC') || eq(0, 'FLAC')) return '.flac';
            if (eq(0, 'PK\x03\x04') || eq(0, 'PK\x05\x06') || eq(0, 'PK\x07\x08')) return '.zip';
            if (eq(0, '\x1F\x8B')) return '.gz';
            if (eq(0, 'BM')) return '.bmp';
            if (eq(0, '\x00\x00\x01\x00')) return '.ico';
            if (eq(0, '<svg') || eq(0, '<?xml') || eq(0, '<SVG')) return '.svg';
            return '';
        } catch (_) { return ''; }
    };

    // ──[03] Download lifecycle: leak-free on every terminal path + manager fallback ──
    const downloadBlob = (blob, name) => new Promise((resolve, reject) => {
        let dlUrl = '';
        try { dlUrl = URL.createObjectURL(blob); }
        catch (err) { reject(new Error('createObjectURL failed: ' + (err && err.message ? err.message : err))); return; }
        let done = false;
        const finish = (ok, msg) => {
            if (done) return;
            done = true;
            // Grace period lets the downloader drain the URL, then it is always reclaimed.
            setTimeout(() => { try { URL.revokeObjectURL(dlUrl); } catch (_) {} }, 10000);
            if (ok) resolve();
            else reject(new Error(msg || 'download failed'));
        };
        if (typeof GM_download === 'function') {
            try {
                GM_download({
                    url: dlUrl,
                    name: name,
                    timeout: 60000,
                    onload: () => finish(true),
                    onerror: (err) => finish(false, 'GM_download error' + (err && err.error ? ': ' + err.error : err && err.message ? ': ' + err.message : '')),
                    ontimeout: () => finish(false, 'GM_download timeout (60s)')
                });
                return;
            } catch (_) { /* fall through to anchor transport */ }
        }
        try {
            const a = document.createElement('a');
            a.href = dlUrl;
            a.download = name;
            a.rel = 'noopener';
            a.style.display = 'none';
            (document.body || document.documentElement).appendChild(a);
            a.click();
            setTimeout(() => { try { a.remove(); } catch (_) {} }, 0);
            finish(true); // anchor transport is fire-and-forget: no synchronous error channel
        } catch (err) { finish(false, 'anchor fallback failed: ' + (err && err.message ? err.message : err)); }
    });

    // ──[05] Shared extraction pipeline (buttons and sniffer converge here) ──
    const buildFileName = (ext, prefix) =>
        `${prefix || 'exfiltrated'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext || '.bin'}`;

    const runExtraction = async (url, opts) => {
        try {
            const blob = await hardenedFetch(url);
            if (!blob || typeof blob.size !== 'number') throw new Error('transport returned a non-blob payload');
            const ext = extForMime(blob.type) || (await sniffExt(blob)) || '.bin';
            const name = buildFileName(ext, opts && opts.namePrefix);
            await downloadBlob(blob, name);
            log(`EXTRACTED → ${name} (${(blob.size / 1024).toFixed(1)} KiB)`);
            return true;
        } catch (err) {
            log(`Extraction failed: ${err && err.message ? err.message : err}`);
            return false;
        }
    };

    // Core blob hooking (v6.1 engine, hardened)
    const hookAsset = (el, opts) => {
        const url = resolveMediaUrl(el);
        if (!url) return;
        const isBlob = url.indexOf('blob:') === 0;
        // Direct (non-blob) hooking is reserved for IG CDN media under opts.allowDirect.
        if (!isBlob && !(opts && opts.allowDirect && IG.isIgVideoUrl(url))) return; // no lock set → element re-checked on later scans

        // [06] <source> lives inside <video|audio|picture> where sibling buttons never
        // render — mount the control after the host media element instead.
        const host = (el.tagName === 'SOURCE') ? (el.closest('video, audio, picture') || el) : el;
        const lock = (node) => { try { node.setAttribute('data-psi-locked', 'true'); } catch (_) {} };
        if (host.hasAttribute('data-psi-locked')) { lock(el); return; } // one control per hook target
        lock(host);
        if (el !== host) lock(el);

        const btn = document.createElement('button');
        btn.type = 'button'; // [06] never submits an ancestor <form> (default type is "submit")
        btn.className = 'psi-btn';
        btn.textContent = CONFIG.labels.init;
        btn.title = `Ψ extract: ${url.slice(0, 80)}${url.length > 80 ? '...' : ''}`;

        btn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (btn.dataset.busy === '1') return; // in-flight guard: idempotent clicks
            btn.dataset.busy = '1';
            btn.textContent = CONFIG.labels.load;
            btn.classList.add('loading');
            // Click-time re-resolution survives React-style element reuse (src swap).
            const ok = await runExtraction(resolveMediaUrl(el) || url, opts);
            btn.textContent = ok ? CONFIG.labels.win : CONFIG.labels.fail;
            btn.classList.remove('loading');
            btn.classList.add(ok ? 'success' : 'fail');
            btn.dataset.busy = '0';
            // Terminal states auto-revert so the control visibly signals re-clickability.
            setTimeout(() => {
                if (btn.dataset.busy !== '1') {
                    btn.textContent = CONFIG.labels.init;
                    btn.classList.remove('success', 'fail');
                }
            }, 2500);
        };

        try {
            host.insertAdjacentElement('afterend', btn);
        } catch (_) {
            try { (host.parentNode || document.body).appendChild(btn); } catch (_) { return; }
        }
    };

    // ──[07] Heuristic DOM engine ──
    const DEPLOY_SELECTOR = 'a[href^="blob:"], img[src^="blob:"], video[src^="blob:"], audio[src^="blob:"], source[src^="blob:"], iframe[src^="blob:"], embed[src^="blob:"], object[data^="blob:"]';
    const deploy = () => {
        try {
            document.querySelectorAll(DEPLOY_SELECTOR).forEach((el) => hookAsset(el));
            // Attribute selectors cannot see MSE-selected currentSrc (property-only change).
            document.querySelectorAll('video, audio, img').forEach((el) => {
                const cs = el.currentSrc;
                if (typeof cs === 'string' && cs.indexOf('blob:') === 0) hookAsset(el);
            });
            if (IG.active) { IG.scanNewScripts(); IG.sweep(); }
        } catch (err) { log('scan error: ' + (err && err.message ? err.message : err)); }
    };
    let deployTimer = null;
    const scheduleDeploy = () => {
        if (deployTimer !== null) return;
        deployTimer = setTimeout(() => { deployTimer = null; deploy(); }, 100);
    };
    const observer = new MutationObserver(scheduleDeploy);
    try { observer.observe(document.documentElement, { childList: true, subtree: true }); } catch (_) {}

    // Interactive sniffer (v6.1 engine, hardened)
    let sniffMode = false;
    const sniffer = {
        mask: document.createElement('div'),
        activeEl: null,
        init() {
            this.mask.className = 'psi-sniff-mask';
            this.mask.style.display = 'none';
            this.ensureMask();
        },
        ensureMask() {
            // [09] Host pages that rewrite <body> can orphan the mask — self-heal on demand.
            if (!this.mask.isConnected) {
                try { (document.body || document.documentElement).appendChild(this.mask); } catch (_) {}
            }
            return this.mask;
        },
        toggle() {
            sniffMode = !sniffMode;
            log(`Sniffer ${sniffMode ? 'ACTIVE // MOVE CURSOR + ENTER TO CAPTURE (ESC exits)' : 'OFF'}`);
            this.ensureMask().style.display = sniffMode ? 'block' : 'none';
            if (sniffMode) document.addEventListener('mousemove', this.track, { passive: true });
            else {
                document.removeEventListener('mousemove', this.track);
                this.activeEl = null;
            }
        },
        track: (e) => {
            let el = null;
            try { el = document.elementFromPoint(e.clientX, e.clientY); } catch (_) { return; }
            if (!el || el === document.body || el === document.documentElement || el === sniffer.mask) return;
            const rect = el.getBoundingClientRect();
            Object.assign(sniffer.mask.style, {
                width: `${rect.width + 4}px`,
                height: `${rect.height + 4}px`,
                left: `${rect.left - 2}px`,
                top: `${rect.top - 2}px`
            });
            sniffer.activeEl = el;
        },
        capture() {
            if (!sniffer.activeEl) return;
            const url = resolveMediaUrl(sniffer.activeEl);
            if (!url) { log('No URL detected'); return; }
            copyText(url).then((ok) => {
                log(ok
                    ? `CAPTURED → clipboard: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`
                    : `CAPTURED (clipboard blocked) — URL: ${url}`);
            });
            // [09] blob: URLs are page-scoped: pasted anywhere else they are inert. Route
            // them through the full extraction pipeline so Enter yields the actual file.
            if (url.indexOf('blob:') === 0) runExtraction(url);
            // Sniffer stays active after capture (v6.1 semantics preserved)
        }
    };

    // ═══[13–16] IG AUTO-EXTRACT MODULE — JS port of ig_extract.py (FINAL REVISION) ═══
    const MP4_RE = /https:\/\/[^\s"'<>\\]+?\.mp4(?:\?[^\s"'<>\\]*)?/g;
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const IG = {
        active: false,
        autoSave: false,
        entries: [],          // newest-first: {kind, type, label, url, code}
        index: new Set(),     // URL dedupe
        autoSaved: new Set(), // URLs already auto-downloaded
        inFlight: new Set(),
        panel: null,
        renderTimer: null,

        init() {
            const host = String((location && location.hostname) || '').toLowerCase();
            this.active = /(^|\.)instagram\.com$/.test(host);
            if (!this.active) return;
            log('IG module ONLINE — net-hook + DOM routes armed (Alt+I vault)');
            this.installNetHook();
            this.scanNewScripts();
            // One-shot Route 2 over the full DOM (deferred until the initial render settles).
            setTimeout(() => { try { this.route2(document.documentElement.outerHTML || ''); } catch (_) {} }, 1500);
        },

        // ──[14] Page-context response sniffing (property wrap: CSP-safe, no inline script) ──
        installNetHook() {
            let page = null;
            try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow) page = unsafeWindow; } catch (_) {}
            if (!page) { log('IG net-hook idle — unsafeWindow unavailable (DOM routes only)'); return; }
            try {
                const origFetch = page.fetch;
                if (typeof origFetch === 'function' && !origFetch.__psi_ig) {
                    const wrapped = function (...args) {
                        const p = origFetch.apply(this, args);
                        try {
                            p.then((res) => {
                                if (res && res.ok && typeof res.clone === 'function') {
                                    res.clone().text().then((t) => IG.ingest(t)).catch(() => {});
                                }
                            }).catch(() => {});
                        } catch (_) {}
                        return p;
                    };
                    try { wrapped.toString = function () { return String(origFetch); }; } catch (_) {} // fingerprint masking
                    wrapped.__psi_ig = true;
                    page.fetch = wrapped;
                }
            } catch (_) {}
            try {
                const xo = page.XMLHttpRequest && page.XMLHttpRequest.prototype;
                if (xo && typeof xo.send === 'function' && !xo.__psi_ig) {
                    xo.__psi_ig = true;
                    const origSend = xo.send;
                    xo.send = function () {
                        try {
                            this.addEventListener('load', function () {
                                try {
                                    let t = '';
                                    if (this.responseType === '' || this.responseType === 'text') t = this.responseText;
                                    else if (this.responseType === 'json' && this.response) t = JSON.stringify(this.response);
                                    if (t) IG.ingest(t);
                                } catch (_) {}
                            });
                        } catch (_) {}
                        return origSend.apply(this, arguments);
                    };
                    try { xo.send.toString = function () { return String(origSend); }; } catch (_) {}
                }
            } catch (_) {}
        },

        // ──[13] Route 1 walk (video_versions progressive + video_dash_manifest DASH) ──
        walk(node, prog, dash) {
            try {
                if (!node || typeof node !== 'object') return;
                if (Array.isArray(node)) { for (const v of node) this.walk(v, prog, dash); return; }
                const vv = node.video_versions;
                if (Array.isArray(vv)) {
                    for (const entry of vv) {
                        if (entry && typeof entry.url === 'string' && entry.url) {
                            const t = entry.type || 999;
                            prog.set(entry.url, Math.min(prog.has(entry.url) ? prog.get(entry.url) : 999, t));
                        }
                    }
                }
                const manifest = node.video_dash_manifest;
                if (typeof manifest === 'string' && manifest) {
                    try {
                        const doc = new DOMParser().parseFromString(manifest, 'application/xml');
                        const reps = doc.getElementsByTagName('Representation');
                        for (let i = 0; i < reps.length; i++) {
                            const bases = reps[i].getElementsByTagName('BaseURL');
                            if (bases.length && bases[0].textContent) {
                                const label = reps[i].getAttribute('FBQualityLabel') || '?';
                                const url = bases[0].textContent.trim().replace(/&amp;/g, '&');
                                if (url) dash.push([label, url]);
                            }
                        }
                    } catch (_) {}
                }
                for (const key in node) this.walk(node[key], prog, dash);
            } catch (_) {}
        },

        // Shortcode hunt for human-friendly filenames (additive, no effect on extraction).
        findCode(node) {
            try {
                if (!node || typeof node !== 'object') return '';
                if (Array.isArray(node)) { for (const v of node) { const c = this.findCode(v); if (c) return c; } return ''; }
                const c = node.shortcode || node.code;
                if (typeof c === 'string' && /^[A-Za-z0-9_-]{4,32}$/.test(c)) return c;
                for (const key in node) { const r = this.findCode(node[key]); if (r) return r; }
            } catch (_) {}
            return '';
        },

        // ──[13] Route 2 clean chain: entities → surrogate pairs → \u singles → \/ \"
        clean(text) {
            try {
                const ta = document.createElement('textarea');
                ta.innerHTML = text;
                text = ta.value;
            } catch (_) {}
            text = text.replace(/\\u(d[89ab][0-9a-f]{2})\\u(d[cdef][0-9a-f]{2})/gi, (m, hi, lo) =>
                String.fromCodePoint(0x10000 + ((parseInt(hi, 16) - 0xD800) << 10) + (parseInt(lo, 16) - 0xDC00)));
            text = text.replace(/\\u([0-9a-fA-F]{4})/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
            return text.replace(/\\\//g, '/').replace(/\\"/g, '"');
        },

        // ── Entry point: text → vault (Route 1 structural, then Route 2 fallback net) ──
        ingest(text) {
            try {
                if (typeof text !== 'string' || !text) return;
                if (text.indexOf('video_versions') === -1 && text.indexOf('video_dash_manifest') === -1 && text.indexOf('.mp4') === -1) return;
                const prog = new Map();
                const dash = [];
                let parsed = null, code = '';
                try { parsed = JSON.parse(text); } catch (_) {}
                if (parsed != null) {
                    this.walk(parsed, prog, dash);
                    code = this.findCode(parsed);
                }
                const seen = new Set([...prog.keys()]);
                for (const [, u] of dash) seen.add(u);
                const extra = [];
                if (text.indexOf('.mp4') !== -1) {
                    const cleaned = this.clean(text);
                    for (const raw of (cleaned.match(MP4_RE) || [])) {
                        const url = raw.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
                        if (!url || seen.has(url)) continue;
                        seen.add(url);
                        extra.push(url);
                    }
                }
                if (!prog.size && !dash.length && !extra.length) return;
                // Batch in ig_extract.py print order: progressive (type asc) → dash → fallback net.
                const batch = [];
                for (const [url, t] of [...prog].sort((a, b) => a[1] - b[1])) batch.push({ kind: 'progressive', type: t, label: '', url, code });
                for (const [label, url] of dash) batch.push({ kind: 'dash', type: 999, label, url, code });
                for (const url of extra) batch.push({ kind: 'extra', type: 999, label: '', url, code: '' });
                this.merge(batch);
            } catch (_) {}
        },

        merge(batch) {
            const fresh = batch.filter((e) => !this.index.has(e.url));
            if (!fresh.length) return;
            for (const e of fresh) this.index.add(e.url);
            this.entries.unshift(...fresh);
            while (this.entries.length > 500) { const drop = this.entries.pop(); this.index.delete(drop.url); }
            if (this.autoSave) {
                let best = null;
                for (const e of fresh) if (e.kind === 'progressive' && (!best || e.type < best.type)) best = e;
                if (best && !this.autoSaved.has(best.url)) {
                    this.autoSaved.add(best.url);
                    this.saveUrl(best.url, best.code);
                }
            }
            this.renderSoon();
        },

        // ──[15] Vault panel ──
        togglePanel() {
            if (!this.active) { log('IG module idle — instagram.com only'); return; }
            if (!this.panel) this.buildPanel();
            if (!this.panel.isConnected) { try { (document.body || document.documentElement).appendChild(this.panel); } catch (_) {} }
            const show = this.panel.style.display === 'none';
            this.panel.style.display = show ? 'block' : 'none';
            if (show) this.render();
        },
        buildPanel() {
            const p = document.createElement('div');
            p.className = 'psi-ig-panel';
            p.style.display = 'none';
            p.addEventListener('click', (e) => {
                const b = e.target && e.target.closest ? e.target.closest('button[data-psi-act]') : null;
                if (!b) return;
                e.preventDefault();
                e.stopPropagation();
                const act = b.getAttribute('data-psi-act');
                if (act === 'close') { this.panel.style.display = 'none'; return; }
                if (act === 'autosave') {
                    this.autoSave = !this.autoSave;
                    this.render();
                    log(`IG auto-save ${this.autoSave ? 'ON — best progressive of each new capture downloads automatically' : 'OFF'}`);
                    return;
                }
                if (act === 'rescan') {
                    this.scanNewScripts(true);
                    try { this.route2(document.documentElement.outerHTML || ''); } catch (_) {}
                    this.render();
                    log(`IG re-scan → ${this.entries.length} unique URL(s)`);
                    return;
                }
                const url = b.getAttribute('data-psi-url');
                if (!url) return;
                if (act === 'copy') {
                    copyText(url).then((ok) => log(ok
                        ? `CAPTURED → clipboard: ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`
                        : `Clipboard blocked — URL: ${url}`));
                    return;
                }
                if (act === 'save') this.saveUrl(url, b.getAttribute('data-psi-code') || '');
            });
            (document.body || document.documentElement).appendChild(p);
            this.panel = p;
        },
        render() {
            if (!this.panel) return;
            const rows = this.entries.slice(0, 100).map((e) => {
                const tag = e.kind === 'progressive' ? `progressive type ${e.type} — video+audio`
                    : e.kind === 'dash' ? `dash ${e.label} — video-only`
                    : 'fallback net';
                const safe = esc(e.url);
                const short = e.url.length > 96 ? esc(e.url.slice(0, 96)) + '...' : safe;
                return `<div class="psi-ig-entry"><span class="psi-ig-tag">[${esc(tag)}]</span><span class="psi-ig-code">${esc(e.code || '')}</span><div class="psi-ig-url">${short}</div><button class="psi-ig-act" data-psi-act="save" data-psi-url="${safe}" data-psi-code="${esc(e.code || '')}">SAVE</button><button class="psi-ig-act" data-psi-act="copy" data-psi-url="${safe}">COPY</button></div>`;
            }).join('');
            const empty = this.entries.length ? '' :
                '<div class="psi-ig-entry">no mp4 captured — login wall? scroll the feed or open a post, then RESCAN</div>';
            this.panel.innerHTML = `<div class="psi-ig-head">Ψ IG VAULT — ${this.entries.length} URL(s) <button class="psi-ig-act" data-psi-act="autosave">AUTOSAVE: ${this.autoSave ? 'ON' : 'OFF'}</button><button class="psi-ig-act" data-psi-act="rescan">RESCAN</button><button class="psi-ig-act" data-psi-act="close">×</button></div>${empty}${rows}`;
        },
        renderSoon() {
            if (this.renderTimer !== null) return;
            this.renderTimer = setTimeout(() => {
                this.renderTimer = null;
                if (this.panel && this.panel.style.display !== 'none') this.render();
            }, 400);
        },

        saveUrl(url, code) {
            if (this.inFlight.has(url)) return;
            this.inFlight.add(url);
            const safeCode = String(code || '').replace(/[^A-Za-z0-9_-]/g, '');
            const prefix = safeCode ? `ig_${safeCode}` : 'ig_video';
            runExtraction(url, { namePrefix: prefix }).then(() => { this.inFlight.delete(url); });
        },

        // ──[16] IG CDN <video> sweep (click-time URL re-resolution lives in hookAsset) ──
        isIgVideoUrl(url) {
            return typeof url === 'string' && /\.mp4(\?|$)/i.test(url) && /(cdninstagram|fbcdn)\./i.test(url);
        },
        sweep() {
            document.querySelectorAll('video').forEach((el) => {
                if (el.hasAttribute('data-psi-locked')) return;
                const u = resolveMediaUrl(el);
                if (u && this.isIgVideoUrl(u)) hookAsset(el, { allowDirect: true });
            });
        },

        // ──[14] DOM routes: script[type=application/json] + full-DOM Route 2 ──
        scanNewScripts(force) {
            document.querySelectorAll('script[type="application/json"]').forEach((s) => {
                if (!force && s.hasAttribute('data-psi-ig-scanned')) return;
                try { s.setAttribute('data-psi-ig-scanned', 'true'); } catch (_) {}
                const t = s.textContent;
                if (t) this.ingest(t);
            });
        },
        route2(text) {
            if (typeof text !== 'string' || text.indexOf('.mp4') === -1) return;
            const cleaned = this.clean(text);
            const batch = [];
            for (const raw of (cleaned.match(MP4_RE) || [])) {
                const url = raw.replace(/&amp;/g, '&').replace(/[.,;]+$/, '');
                if (url && !this.index.has(url)) batch.push({ kind: 'extra', type: 999, label: '', url, code: '' });
            }
            if (batch.length) this.merge(batch);
        },
    };

    // ──[12] Tradecraft controls ──
    const copyAllBlobUrls = () => {
        const urls = new Set();
        document.querySelectorAll('[data-psi-locked]').forEach((el) => {
            const u = resolveMediaUrl(el);
            if (u && u.indexOf('blob:') === 0) urls.add(u);
        });
        if (!urls.size) { log('No blob URLs discovered on this page'); return; }
        const list = Array.from(urls).join('\n');
        copyText(list).then((ok) => log(ok
            ? `CAPTURED → clipboard: ${urls.size} unique blob URL(s)`
            : `Clipboard blocked — ${urls.size} URL(s) logged only:\n${list}`));
    };
    const registerMenus = () => {
        if (typeof GM_registerMenuCommand !== 'function') return; // hotkeys + auto-scan remain fully operational
        GM_registerMenuCommand("Ψ: Toggle Universal Sniffer", () => sniffer.toggle());
        GM_registerMenuCommand("Ψ: Force DOM Re-scan", deploy);
        GM_registerMenuCommand("Ψ: Copy All Discovered Blob URLs", copyAllBlobUrls);
        GM_registerMenuCommand("Ψ: IG Vault Panel", () => IG.togglePanel());
    };

    // ──[10] Hotkeys (capture phase so page handlers cannot swallow them first) ──
    const onKeydown = (e) => {
        if (e.isComposing) return; // IME composition safety
        if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.repeat && typeof e.key === 'string') {
            const k = e.key.toLowerCase();
            if (k === 's') { e.preventDefault(); sniffer.toggle(); return; }
            if (k === 'i' && IG.active) { e.preventDefault(); IG.togglePanel(); return; } // [15] IG vault
        }
        if (sniffMode && e.key === 'Escape') { sniffer.toggle(); return; } // [09] one-key exit
        if (sniffMode && e.key === 'Enter' && !e.repeat) {
            // [09] Don't hijack typing contexts (v6.1 swallowed Enter inside inputs mid-sniff).
            const t = e.target;
            const editing = !!(t && (t.isContentEditable || (t.tagName && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))));
            if (!editing) { e.preventDefault(); sniffer.capture(); }
        }
    };
    document.addEventListener('keydown', onKeydown, true);

    // ──[07] Body-ready bootstrap (document-start safe) ──
    const whenBodyReady = (fn) => {
        if (document.body) { fn(); return; }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
        else fn();
    };
    whenBodyReady(() => {
        sniffer.init();
        registerMenus();
        IG.init();
        deploy(); // Initial scan
    });

    log("Ψ-4ndr0tools - blob2url_v6.3_ONLINE");
})();
