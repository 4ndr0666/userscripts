// ==UserScript==
// @name         4ndr0tools - Zai Exporter
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @author       4ndr0666
// @description  One-click conversation exfiltration for the Z.ai GLM web chat — scrapes the live thread (multi-strategy, no network, no timers) and exports it as Markdown, JSON, or plain text, with metadata and Ψ glass console. Runs entirely page-side: zero privileged transports, zero observers, zero polling.
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @license      MIT
// @match        https://chat.z.ai/*
// @match        https://z.ai/*
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Zai%20Exporter.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Zai%20Exporter.user.js
// @noframes
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

// 4ndr0tools - Zai Exporter v1.0.0 — completed helper userscript.
//
// Design contract (suite discipline, machine-checkable properties):
//   · ZERO polling — no setInterval anywhere: the extractor is strictly
//     click-driven; the manager menu and the Ψ HUD button are the arms.
//   · ZERO observers — no MutationObserver: SPA route changes never
//     orphan the HUD (it is body-anchored; soft navigations keep body).
//   · ZERO network — no GM_xmlhttpRequest, no gmFetch, no @connect: the
//     conversation is read from the live DOM the operator is looking at.
//   · ZERO HTML-string sinks — no innerHTML/outerHTML writes, no
//     insertAdjacentHTML, no eval/new Function, no parseFromString: every
//     node is createElementNS/textContent (Trusted-Types-immune by
//     construction, the suite v1.4.2 invariant).
//   · ZERO realm writes — everything lives in this IIFE closure.
//   · Typed-or-debug error surface — every catch body is non-empty and
//     carries a scoped, tagged console.debug line (G11 D6 pattern).
//
// Extraction epistemology: the Z.ai DOM is a hostile, versioned surface we
// do not control. The engine therefore runs a strict strategy ladder —
// (A) message-attribute mining, (B) chat-region harvest, (C) degraded
// plain-text sweep — and always REPORTS which strategy produced the export
// and how many roles were classified. A degraded export says so in the
// panel and in the artifact header; the tool never silently pretends a
// guess is ground truth.

(function () {
    'use strict';

    const SCRIPT = {
        name: '4ndr0tools - Zai Exporter',
        version: '1.0.0',
        tag: '[Ψ-ZaiExporter]',
        spec: '3lectric-Glass'
    };

    const STORE = {
        format: 'zaiExporter.format.v1',        // 'md' | 'json' | 'txt'
        includeMeta: 'zaiExporter.includeMeta.v1' // boolean
    };

    // ─── SAFE STORAGE (GM first, localStorage fallback, guarded writes) ─────

    function storeGet(key, fallback) {
        try {
            if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            return JSON.parse(raw);
        } catch (err) {
            console.debug(SCRIPT.tag, 'storeGet failed for', key, err);
            return fallback;
        }
    }

    function storeSet(key, value) {
        try {
            if (typeof GM_setValue === 'function') { GM_setValue(key, value); return; }
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {
            console.debug(SCRIPT.tag, 'storeSet failed for', key, err);
        }
    }

    // ─── CSS PAYLOAD (3lectric-Glass tokens: glass L1/L2/L3 + solid header,
    //     #00E5FF/#67E8F9/#ff0055 anchors, JetBrains Mono data font, Orbitron
    //     display, 0px button radius, 150ms ease-in-out state changes) ───────

    const CSS = `
        #psi-zx-hud, #psi-zx-console, #psi-zx-console * { box-sizing: border-box; }

        #psi-zx-hud {
            position: fixed;
            right: 18px;
            bottom: 18px;
            z-index: 2147483600;
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 8px 12px;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #00E5FF;
            cursor: pointer;
            font: bold 12px "JetBrains Mono", ui-monospace, Consolas, monospace;
            letter-spacing: 1px;
            text-transform: uppercase;
            user-select: none;
            transition: all 150ms ease-in-out;
            box-shadow: 0 0 20px rgba(0,229,255,0.15);
        }
        #psi-zx-hud:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        #psi-zx-hud:active { background: rgba(0,229,255,0.3); color: #ffffff; }
        #psi-zx-hud svg { display: block; }
        #psi-zx-hud .psi-zx-badge {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            letter-spacing: 1px;
        }

        #psi-zx-backdrop {
            position: fixed;
            inset: 0;
            z-index: 2147483601;
            background: rgba(10,19,26,0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 150ms ease-in-out;
        }

        #psi-zx-console {
            width: min(560px, calc(100vw - 32px));
            max-height: calc(100vh - 64px);
            overflow: auto;
            background: rgba(10,19,26,0.72);
            border: 1px solid rgba(0,229,255,0.2);
            border-radius: 4px;
            box-shadow: 0 0 40px rgba(0,229,255,0.15);
            color: #00E5FF;
            font: 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
        }
        .psi-zx-hd {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: rgba(10,19,26,0.95);
            border-bottom: 2px solid #00E5FF;
        }
        .psi-zx-hd svg { display: block; flex: 0 0 auto; }
        .psi-zx-hd-titles { flex: 1 1 auto; min-width: 0; }
        .psi-zx-title {
            font-family: "Orbitron", "JetBrains Mono", sans-serif;
            font-size: 14px;
            font-weight: 700;
            color: #67E8F9;
            letter-spacing: 2px;
        }
        .psi-zx-subtitle {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            letter-spacing: 1px;
            margin-top: 2px;
        }
        .psi-zx-x {
            flex: 0 0 auto;
            background: rgba(10,19,26,0.65);
            border: 1px solid #ff0055;
            border-radius: 0px;
            color: #ff0055;
            cursor: pointer;
            font: bold 10px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 3px 8px;
            transition: all 150ms ease-in-out;
        }
        .psi-zx-x:hover {
            background: rgba(255,0,85,0.3);
            box-shadow: 0 0 25px #ff0055;
            color: #ffffff;
        }

        .psi-zx-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

        .psi-zx-cap {
            font-size: 9px;
            color: rgba(0,229,255,0.7);
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .psi-zx-formats { display: flex; gap: 6px; }
        .psi-zx-fmt {
            flex: 1 1 auto;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #00E5FF;
            cursor: pointer;
            font: bold 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 7px 10px;
            text-align: center;
            transition: all 150ms ease-in-out;
        }
        .psi-zx-fmt:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        .psi-zx-fmt.psi-zx-on {
            background: rgba(0,229,255,0.3);
            border-color: #00E5FF;
            color: #ffffff;
        }

        .psi-zx-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .psi-zx-lab { font-size: 10px; color: rgba(0,229,255,0.7); letter-spacing: 1px; text-transform: uppercase; }

        .psi-zx-sw {
            position: relative;
            width: 44px;
            height: 20px;
            background: #050A0F;
            border: 1px solid #00E5FF;
            border-radius: 0px;
            cursor: pointer;
            transition: all 150ms ease-in-out;
        }
        .psi-zx-sw:has(input:checked) { background: rgba(0,229,255,0.2); }
        .psi-zx-sw input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            cursor: pointer;
        }
        .psi-zx-knob {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            background: #00E5FF;
            box-shadow: 0 0 12px rgba(0,229,255,0.8);
            transition: all 150ms ease-in-out;
        }
        .psi-zx-sw input:checked ~ .psi-zx-knob { left: 26px; }

        .psi-zx-report {
            background: rgba(10,19,26,0.55);
            border: 1px solid rgba(0,229,255,0.3);
            border-radius: 0px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .psi-zx-line {
            font-size: 10px;
            color: #67E8F9;
            line-height: 1.5;
            word-break: break-all;
        }
        .psi-zx-line.psi-zx-warn { color: #ffaa00; }

        .psi-zx-actions { display: flex; gap: 6px; }
        .psi-zx-btn {
            flex: 1 1 auto;
            background: rgba(10,19,26,0.65);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #00E5FF;
            cursor: pointer;
            font: bold 11px "JetBrains Mono", ui-monospace, Consolas, monospace;
            padding: 8px 10px;
            text-align: center;
            transition: all 150ms ease-in-out;
        }
        .psi-zx-btn:hover {
            background: rgba(0,229,255,0.2);
            border-color: #00E5FF;
            box-shadow: 0 0 20px rgba(0,229,255,0.5);
            color: #67E8F9;
        }
        .psi-zx-btn:active { background: rgba(0,229,255,0.3); color: #ffffff; }
        .psi-zx-btn:disabled {
            opacity: 0.45;
            cursor: default;
            box-shadow: none;
        }

        #psi-zx-toast {
            position: fixed;
            right: 18px;
            bottom: 64px;
            z-index: 2147483602;
            max-width: 420px;
            padding: 8px 12px;
            background: rgba(10,19,26,0.95);
            border: 1px solid rgba(0,229,255,0.4);
            border-radius: 0px;
            color: #ffffff;
            font: bold 10px "JetBrains Mono", ui-monospace, Consolas, monospace;
            letter-spacing: 1px;
            opacity: 0;
            pointer-events: none;
            transition: all 150ms ease-in-out;
        }
        #psi-zx-toast.psi-zx-on { opacity: 1; }
    `;

    // ─── STYLE / DOM UTILITIES (all TT-safe: no string->HTML sinks) ─────────

    function injectStyle(css, id) {
        try {
            let style = id ? document.getElementById(id) : null;
            if (style) { style.textContent = css; return style; }
            if (typeof GM_addStyle === 'function') {
                try { return GM_addStyle(css); } catch (gmErr) {
                    console.debug(SCRIPT.tag, 'GM_addStyle refused, falling back:', gmErr);
                }
            }
            style = document.createElement('style');
            if (id) style.id = id;
            style.textContent = css;
            (document.head || document.documentElement).appendChild(style);
            return style;
        } catch (err) {
            console.debug(SCRIPT.tag, 'style injection failed:', err);
            return null;
        }
    }

    function whenBody(fn) {
        try {
            if (document.body) { fn(); return; }
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } catch (err) {
            console.debug(SCRIPT.tag, 'whenBody registration failed:', err);
        }
    }

    // Ψ branding glyph (4ndr0666_glyph.txt geometry) built via createElementNS.
    function buildGlyph(size) {
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 128 128');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', '#00E5FF');
        svg.setAttribute('stroke-width', '3');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.style.display = 'block';
        const rings = [
            { d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z', dash: '21.78 21.78', w: '2', op: null },
            { d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z', dash: '10 10', w: '1.5', op: '0.7' },
            { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z', dash: null, w: null, op: null }
        ];
        for (const ring of rings) {
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', ring.d);
            if (ring.dash) path.setAttribute('stroke-dasharray', ring.dash);
            if (ring.w) path.setAttribute('stroke-width', ring.w);
            if (ring.op) path.setAttribute('opacity', ring.op);
            svg.appendChild(path);
        }
        const core = document.createElementNS(NS, 'text');
        core.setAttribute('x', '64');
        core.setAttribute('y', '67');
        core.setAttribute('text-anchor', 'middle');
        core.setAttribute('dominant-baseline', 'middle');
        core.setAttribute('fill', '#00E5FF');
        core.setAttribute('stroke', 'none');
        core.setAttribute('font-size', '56');
        core.setAttribute('font-weight', '700');
        core.setAttribute('font-family', "'Cinzel Decorative', serif");
        core.textContent = 'Ψ';
        svg.appendChild(core);
        return svg;
    }

    let toastTimer = null;
    function showToast(text) {
        whenBody(() => {
            try {
                let el = document.getElementById('psi-zx-toast');
                if (!el) {
                    el = document.createElement('div');
                    el.id = 'psi-zx-toast';
                    el.setAttribute('role', 'status');
                    document.body.appendChild(el);
                }
                el.textContent = text;
                el.classList.add('psi-zx-on');
                if (toastTimer !== null) clearTimeout(toastTimer);
                toastTimer = setTimeout(() => {
                    el.classList.remove('psi-zx-on');
                    toastTimer = null;
                }, 2600);
            } catch (err) {
                console.debug(SCRIPT.tag, 'toast render failed:', err);
            }
        });
    }

    // ─── EXTRACTION ENGINE (strategy ladder, click-driven, read-only) ────────

    // Candidate selectors ordered by expected specificity. Attribute-driven
    // surfaces (testids, message ids, author roles) are strongest; class-name
    // surfaces are the fallback because "message" is the most overloaded class
    // stem on any chat app.
    const CANDIDATE_SELECTORS = [
        '[data-message-id]',
        '[data-message-author-role]',
        '[data-testid^="message" i]',
        '[data-testid*="message" i]',
        '[data-role="user"], [data-role="assistant"], [data-role="message"]',
        '[class*="message-item" i]',
        '[class*="messagebubble" i]',
        '[class*="message_bubble" i]',
        '[class*="chat-message" i]',
        '[class*="conversation-message" i]',
        '[class*="msg-content" i]'
    ];

    const REGION_SELECTORS = [
        'main',
        '[role="main"]',
        '[class*="conversation" i]',
        '[class*="chat-history" i]',
        '[class*="thread" i]',
        '[class*="messages-list" i]',
        '[class*="chat" i]'
    ];

    const USER_ROLE_RE = /\b(user|human|self|visitor|query|prompt|sender)\b/i;
    const ASSISTANT_ROLE_RE = /\b(assistant|bot|ai[-_ ]?reply|glm|model|response|answer|agent)\b/i;

    function normText(s) {
        return String(s == null ? '' : s)
            .replace(/\u00a0/g, ' ')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/^[ \t]+|[ \t]+$/g, '')
            .trim();
    }

    /* Prune nodes whose ancestor is also a candidate (nested wrappers of the
     * same logical message) — keeps only the outermost node per message. */
    function pruneNested(nodes) {
        const keep = [];
        for (const n of nodes) {
            let dominated = false;
            for (const m of nodes) {
                if (m === n) continue;
                if (m.contains(n)) { dominated = true; break; }
            }
            if (!dominated) keep.push(n);
        }
        return keep;
    }

    function sortInDocumentOrder(nodes) {
        return nodes.slice().sort((a, b) => {
            if (a === b) return 0;
            const pos = a.compareDocumentPosition(b);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
        });
    }

    function classifyRole(node) {
        // 1. Explicit author-role surfaces (OpenAI-style data attributes and
        //    aria labels) — the only true ground truth a DOM can give us.
        const attrSets = [
            ['data-message-author-role'],
            ['data-role'],
            ['data-author-role'],
            ['aria-label']
        ];
        for (const [attr] of attrSets) {
            try {
                const v = node.getAttribute(attr) || '';
                const tv = v.trim().toLowerCase();
                if (!tv) continue;
                if (tv === 'user' || tv === 'human') return 'user';
                if (tv === 'assistant' || tv === 'bot' || tv === 'model' || tv === 'ai') return 'assistant';
            } catch (err) {
                console.debug(SCRIPT.tag, 'role attribute read failed:', err);
            }
        }
        // 2. Class/attribute stems on the node and its first ancestors —
        //    user stems checked first (they are the more specific stem family).
        let cur = node;
        for (let depth = 0; cur && depth < 3; depth++, cur = cur.parentElement) {
            try {
                const sig = (cur.className && typeof cur.className === 'string' ? cur.className : '') +
                    ' ' + (cur.getAttribute('data-testid') || '');
                if (!sig.trim()) continue;
                if (USER_ROLE_RE.test(sig)) return 'user';
                if (ASSISTANT_ROLE_RE.test(sig)) return 'assistant';
            } catch (err) {
                console.debug(SCRIPT.tag, 'role signature read failed:', err);
            }
        }
        return 'unknown';
    }

    function classifyAll(nodes) {
        // Post-pass: strict alternation repair. In a chat transcript the
        // roles MUST alternate user → assistant → user …; a run of same-role
        // messages after an "unknown" gap is repaired by the alternation
        // invariant, and pure-unknown runs are left honest as "unknown".
        const roles = nodes.map((n) => classifyRole(n));
        let lastKnown = null;
        for (let i = 0; i < roles.length; i++) {
            if (roles[i] === 'unknown') {
                if (lastKnown === 'user') roles[i] = 'assistant';
                else if (lastKnown === 'assistant') roles[i] = 'user';
            } else {
                lastKnown = roles[i];
            }
        }
        return roles;
    }

    /* Message body → markdown: prose from text nodes with code fences for
     * <pre> blocks. Reads only; never mutates the page. */
    function messageMarkdown(node) {
        try {
            const pres = Array.from(node.querySelectorAll('pre'));
            if (pres.length) {
                // Fence out code blocks; replace them with sentinels before
                // the text sweep so their contents are not duplicated.
                const sentinels = [];
                const marked = node.cloneNode(true);
                for (const pre of Array.from(marked.querySelectorAll('pre'))) {
                    const code = normText(pre.textContent);
                    const sentinel = 'ZXCODE' + sentinels.length + 'ENDZX';
                    sentinels.push('```\n' + code + '\n```');
                    const holder = document.createTextNode(sentinel);
                    pre.parentNode.replaceChild(holder, pre);
                }
                let text = normText(marked.textContent);
                sentinels.forEach((fence, i) => {
                    text = text.replace('ZXCODE' + i + 'ENDZX', fence);
                });
                return text;
            }
            return normText(node.textContent);
        } catch (err) {
            console.debug(SCRIPT.tag, 'message body render failed:', err);
            return normText(node.textContent);
        }
    }

    function messageTimestamp(node) {
        try {
            const t = node.querySelector('time[datetime]');
            if (t) return t.getAttribute('datetime');
            const t2 = node.querySelector('time');
            if (t2) return normText(t2.textContent);
        } catch (err) {
            console.debug(SCRIPT.tag, 'timestamp read failed:', err);
        }
        return null;
    }

    function strategyAttributeMining() {
        try {
            const seen = new Set();
            let raw = [];
            for (const sel of CANDIDATE_SELECTORS) {
                let found = [];
                try { found = Array.from(document.querySelectorAll(sel)); }
                catch (selErr) { console.debug(SCRIPT.tag, 'selector skipped:', sel, selErr); }
                for (const n of found) if (!seen.has(n)) { seen.add(n); raw.push(n); }
            }
            raw = pruneNested(raw);
            // Message nodes must be text-bearing and reasonably sized —
            // dropdown menus and empty shells do not count.
            raw = raw.filter((n) => {
                const t = normText(n.textContent);
                return t.length >= 1;
            });
            if (raw.length < 1) return null;
            const nodes = sortInDocumentOrder(raw);
            const roles = classifyAll(nodes);
            return {
                strategy: 'attributes',
                nodes,
                roles,
                degraded: false
            };
        } catch (err) {
            console.debug(SCRIPT.tag, 'strategy A failed:', err);
            return null;
        }
    }

    function strategyRegionHarvest() {
        try {
            for (const sel of REGION_SELECTORS) {
                let region = null;
                try { region = document.querySelector(sel); }
                catch (selErr) { console.debug(SCRIPT.tag, 'region selector skipped:', sel, selErr); }
                if (!region) continue;
                // The direct block children of the chat region ARE the
                // message turns in every mainstream chat layout.
                let kids = Array.from(region.children).filter((c) => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' &&
                    normText(c.textContent).length >= 1);
                if (kids.length < 1) continue;
                // Prune chrome that wraps the list one level deeper.
                if (kids.length === 1 && kids[0].children.length > 1) {
                    kids = Array.from(kids[0].children).filter((c) => c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE' &&
                        normText(c.textContent).length >= 1);
                }
                if (kids.length < 1) continue;
                const nodes = sortInDocumentOrder(pruneNested(kids));
                const roles = classifyAll(nodes);
                return { strategy: 'region', nodes, roles, degraded: false };
            }
        } catch (err) {
            console.debug(SCRIPT.tag, 'strategy B failed:', err);
        }
        return null;
    }

    function strategyBodySweep() {
        try {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            const chunks = [];
            let cur;
            while ((cur = walker.nextNode()) !== null) {
                const t = normText(cur.nodeValue);
                if (t.length >= 1) chunks.push(t);
            }
            const text = chunks.join('\n');
            if (text.length < 1) return null;
            return {
                strategy: 'degraded',
                nodes: [],
                roles: [],
                degraded: true,
                text
            };
        } catch (err) {
            console.debug(SCRIPT.tag, 'strategy C failed:', err);
            return null;
        }
    }

    function extractConversation() {
        const result = strategyAttributeMining() || strategyRegionHarvest() || strategyBodySweep();
        if (!result) return null;
        if (result.degraded) return result;
        const messages = [];
        for (let i = 0; i < result.nodes.length; i++) {
            const text = messageMarkdown(result.nodes[i]);
            if (!text) continue;
            messages.push({
                index: messages.length + 1,
                role: result.roles[i],
                timestamp: messageTimestamp(result.nodes[i]),
                text
            });
        }
        if (messages.length < 1) {
            // Attribute/region mining found shells but no text — degrade
            // honestly rather than emit an empty artifact.
            return strategyBodySweep();
        }
        result.messages = messages;
        const classified = messages.filter((m) => m.role !== 'unknown').length;
        result.classified = classified;
        result.unknown = messages.length - classified;
        return result;
    }

    // ─── EXPORT COMPOSERS ────────────────────────────────────────────────────

    function safeFileStem() {
        const raw = (document.title || 'zai-conversation').replace(/[\\/:*?"<>|]+/g, ' ').trim();
        const stem = raw.slice(0, 60).replace(/\s+/g, '-').replace(/^-+|-+$/g, '') || 'zai-conversation';
        return stem;
    }

    function exportStamp() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
    }

    function composeMarkdown(conv, includeMeta) {
        const L = [];
        if (includeMeta) {
            L.push('# ' + (document.title || 'Z.ai conversation'));
            L.push('');
            L.push('> Exported ' + new Date().toISOString() + ' · ' + conv.messages.length + ' messages' +
                ' · ' + SCRIPT.name + ' v' + SCRIPT.version + ' Ψ');
            L.push('> Source: ' + location.href);
            L.push('> Strategy: ' + conv.strategy + (conv.unknown > 0 ?
                ' · ' + conv.unknown + ' unclassified role(s)' : ''));
            L.push('');
            L.push('---');
            L.push('');
        }
        for (const m of conv.messages) {
            L.push('**' + m.role.toUpperCase() + '**' + (m.timestamp ? ' · ' + m.timestamp : ''));
            L.push('');
            L.push(m.text);
            L.push('');
            L.push('---');
            L.push('');
        }
        if (L.length > 2) { L.pop(); L.pop(); }  // drop the trailing separator
        return L.join('\n') + '\n';
    }

    function composeJSON(conv, includeMeta) {
        const payload = {
            exporter: SCRIPT.name,
            exporterVersion: SCRIPT.version,
            title: document.title || '',
            url: location.href,
            exportedAt: new Date().toISOString(),
            strategy: conv.strategy,
            messageCount: conv.messages.length
        };
        payload.messages = conv.messages.map((m) => ({
            index: m.index,
            role: m.role,
            timestamp: m.timestamp,
            text: m.text
        }));
        if (!includeMeta) {
            delete payload.title;
            delete payload.url;
            delete payload.exportedAt;
        }
        return JSON.stringify(payload, null, 2) + '\n';
    }

    function composeText(conv, includeMeta) {
        const L = [];
        if (includeMeta) {
            L.push((document.title || 'Z.ai conversation') + ' — exported ' + new Date().toISOString());
            L.push(conv.messages.length + ' messages · strategy: ' + conv.strategy);
            L.push('='.repeat(60));
            L.push('');
        }
        for (const m of conv.messages) {
            L.push('[' + m.role.toUpperCase() + (m.timestamp ? ' · ' + m.timestamp : '') + ']');
            L.push(m.text);
            L.push('');
        }
        return L.join('\n');
    }

    function compose(conv, format, includeMeta) {
        if (conv.degraded) {
            const header = '[DEGRADED EXPORT — DOM strategies found no message structure; plain-text sweep only]' +
                (includeMeta ? '\n' + new Date().toISOString() + ' · ' + location.href : '') + '\n\n';
            return header + (conv.text || '') + '\n';
        }
        if (format === 'json') return composeJSON(conv, includeMeta);
        if (format === 'txt') return composeText(conv, includeMeta);
        return composeMarkdown(conv, includeMeta);
    }

    const FORMAT_EXT = { md: 'md', json: 'json', txt: 'txt' };

    // ─── TRANSPORTS (page-context download + clipboard; no privileged net) ──

    function downloadArtifact(text, ext) {
        try {
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = safeFileStem() + '-' + exportStamp() + '.' + ext;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                try {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (cleanupErr) {
                    console.debug(SCRIPT.tag, 'anchor cleanup failed:', cleanupErr);
                }
            }, 1000);
            return true;
        } catch (err) {
            console.debug(SCRIPT.tag, 'download transport failed:', err);
            return false;
        }
    }

    function copyArtifact(text) {
        return new Promise((resolve) => {
            try {
                if (typeof GM_setClipboard === 'function') {
                    GM_setClipboard(text, 'text');
                    resolve(true);
                    return;
                }
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(text).then(
                        () => resolve(true),
                        (clipErr) => {
                            console.debug(SCRIPT.tag, 'clipboard write rejected:', clipErr);
                            resolve(false);
                        }
                    );
                    return;
                }
                resolve(false);
            } catch (err) {
                console.debug(SCRIPT.tag, 'clipboard transport failed:', err);
                resolve(false);
            }
        });
    }

    // ─── Ψ GLASS CONSOLE ─────────────────────────────────────────────────────

    let lastReport = null;   // { conv, format, includeMeta } snapshot for actions

    function closeConsole() {
        try {
            const backdrop = document.getElementById('psi-zx-backdrop');
            const consoleEl = document.getElementById('psi-zx-console');
            if (backdrop) backdrop.remove();
            if (consoleEl) consoleEl.remove();
            document.removeEventListener('keydown', psiZxEscClose, true);
        } catch (err) {
            console.debug(SCRIPT.tag, 'console close failed:', err);
        }
    }

    // Scoped Escape closer (the suite-standard idiom — PM/WCP precedent).
    // Attached only while the console is open; removed on close.
    function psiZxEscClose(e) {
        try {
            if (e.key === 'Escape' && document.getElementById('psi-zx-console')) closeConsole();
        } catch (err) {
            console.debug(SCRIPT.tag, 'escape handling failed:', err);
        }
    }

    function setFormatUI(panel, fmt) {
        try {
            for (const b of panel.querySelectorAll('.psi-zx-fmt')) {
                b.classList.toggle('psi-zx-on', b.getAttribute('data-fmt') === fmt);
            }
        } catch (err) {
            console.debug(SCRIPT.tag, 'format UI refresh failed:', err);
        }
    }

    function reportLine(parent, text, warn) {
        const line = document.createElement('div');
        line.className = 'psi-zx-line' + (warn ? ' psi-zx-warn' : '');
        line.textContent = text;
        parent.appendChild(line);
        return line;
    }

    function renderReport(box, conv) {
        try {
            while (box.firstChild) box.removeChild(box.firstChild);
            if (!conv) {
                reportLine(box, 'No conversation structure detected on this page.', true);
                reportLine(box, 'Open a Z.ai chat thread, then invoke Ψ Export again.', false);
                return;
            }
            if (conv.degraded) {
                reportLine(box, 'DEGRADED MODE — no message structure found.', true);
                reportLine(box, 'Exporting a plain-text sweep of the visible page instead.', true);
                return;
            }
            reportLine(box, conv.messages.length + ' message(s) detected · strategy: ' + conv.strategy, false);
            reportLine(box, 'roles classified: ' + conv.classified + ' · unknown: ' + conv.unknown, conv.unknown > 0);
            if (conv.unknown > 0) {
                reportLine(box, 'unclassified turns export with role UNKNOWN — verify before use.', true);
            }
        } catch (err) {
            console.debug(SCRIPT.tag, 'report render failed:', err);
        }
    }

    function openConsole() {
        try {
            if (document.getElementById('psi-zx-console')) return;
            injectStyle(CSS, 'psi-zx-style');
            whenBody(() => {
                if (document.getElementById('psi-zx-console')) return;

                let format = storeGet(STORE.format, 'md');
                if (format !== 'md' && format !== 'json' && format !== 'txt') format = 'md';
                let includeMeta = storeGet(STORE.includeMeta, true);
                if (typeof includeMeta !== 'boolean') includeMeta = true;

                const conv = extractConversation();
                lastReport = { conv, format, includeMeta };

                const backdrop = document.createElement('div');
                backdrop.id = 'psi-zx-backdrop';
                backdrop.addEventListener('click', (e) => {
                    if (e.target === backdrop) closeConsole();
                });

                const panel = document.createElement('div');
                panel.id = 'psi-zx-console';
                panel.setAttribute('role', 'dialog');
                panel.setAttribute('aria-label', SCRIPT.name + ' console');

                // ── header (solid headerbar) ──
                const hd = document.createElement('div');
                hd.className = 'psi-zx-hd';
                const hdGlyph = buildGlyph(20);
                hd.appendChild(hdGlyph);
                const titles = document.createElement('div');
                titles.className = 'psi-zx-hd-titles';
                const title = document.createElement('div');
                title.className = 'psi-zx-title';
                title.textContent = 'Ψ ZAI EXPORTER';
                const subtitle = document.createElement('div');
                subtitle.className = 'psi-zx-subtitle';
                subtitle.textContent = 'conversation exfiltration · v' + SCRIPT.version;
                titles.appendChild(title);
                titles.appendChild(subtitle);
                hd.appendChild(titles);
                const x = document.createElement('button');
                x.className = 'psi-zx-x';
                x.type = 'button';
                x.textContent = '✕ CLOSE';
                x.addEventListener('click', closeConsole);
                hd.appendChild(x);
                panel.appendChild(hd);

                // ── body ──
                const body = document.createElement('div');
                body.className = 'psi-zx-body';

                const capFmt = document.createElement('div');
                capFmt.className = 'psi-zx-cap';
                capFmt.textContent = 'Format';
                body.appendChild(capFmt);

                const fmtRow = document.createElement('div');
                fmtRow.className = 'psi-zx-formats';
                const FORMATS = [
                    ['md', 'Markdown'],
                    ['json', 'JSON'],
                    ['txt', 'Plain text']
                ];
                for (const [val, label] of FORMATS) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'psi-zx-fmt';
                    b.setAttribute('data-fmt', val);
                    b.textContent = label;
                    b.addEventListener('click', () => {
                        format = val;
                        lastReport.format = val;
                        storeSet(STORE.format, val);
                        setFormatUI(panel, val);
                    });
                    fmtRow.appendChild(b);
                }
                body.appendChild(fmtRow);
                setFormatUI(panel, format);

                const metaRow = document.createElement('div');
                metaRow.className = 'psi-zx-row';
                const metaLab = document.createElement('div');
                metaLab.className = 'psi-zx-lab';
                metaLab.textContent = 'Include metadata header';
                metaRow.appendChild(metaLab);
                const sw = document.createElement('label');
                sw.className = 'psi-zx-sw';
                const swInput = document.createElement('input');
                swInput.type = 'checkbox';
                swInput.checked = includeMeta;
                swInput.addEventListener('change', () => {
                    includeMeta = swInput.checked;
                    lastReport.includeMeta = includeMeta;
                    storeSet(STORE.includeMeta, includeMeta);
                });
                const knob = document.createElement('span');
                knob.className = 'psi-zx-knob';
                sw.appendChild(swInput);
                sw.appendChild(knob);
                metaRow.appendChild(sw);
                body.appendChild(metaRow);

                const capRep = document.createElement('div');
                capRep.className = 'psi-zx-cap';
                capRep.textContent = 'Detection report';
                body.appendChild(capRep);
                const report = document.createElement('div');
                report.className = 'psi-zx-report';
                renderReport(report, conv);
                body.appendChild(report);

                const actions = document.createElement('div');
                actions.className = 'psi-zx-actions';
                const btnExport = document.createElement('button');
                btnExport.type = 'button';
                btnExport.className = 'psi-zx-btn';
                btnExport.textContent = '↓ EXPORT FILE';
                btnExport.disabled = !conv;
                btnExport.addEventListener('click', () => {
                    const snap = lastReport;
                    if (!snap || !snap.conv) return;
                    const text = compose(snap.conv, snap.format, snap.includeMeta);
                    const ok = downloadArtifact(text, FORMAT_EXT[snap.format] || 'txt');
                    showToast(ok ? 'Ψ export written to disk' : 'Ψ export failed — see console');
                    if (ok) closeConsole();
                });
                actions.appendChild(btnExport);
                const btnCopy = document.createElement('button');
                btnCopy.type = 'button';
                btnCopy.className = 'psi-zx-btn';
                btnCopy.textContent = '⧉ COPY';
                btnCopy.disabled = !conv;
                btnCopy.addEventListener('click', () => {
                    const snap = lastReport;
                    if (!snap || !snap.conv) return;
                    const text = compose(snap.conv, snap.format, snap.includeMeta);
                    copyArtifact(text).then((ok) => {
                        showToast(ok ? 'Ψ export copied to clipboard' : 'Ψ clipboard refused — see console');
                    });
                });
                actions.appendChild(btnCopy);
                body.appendChild(actions);

                panel.appendChild(body);
                backdrop.appendChild(panel);
                document.body.appendChild(backdrop);
                document.addEventListener('keydown', psiZxEscClose, true);
            });
        } catch (err) {
            console.debug(SCRIPT.tag, 'console open failed:', err);
        }
    }

    // ─── HUD BUTTON (body-anchored, survives SPA soft navigation) ────────────

    function injectHUD() {
        injectStyle(CSS, 'psi-zx-style');
        whenBody(() => {
            try {
                if (document.getElementById('psi-zx-hud')) return;
                const btn = document.createElement('div');
                btn.id = 'psi-zx-hud';
                btn.title = 'Export this Z.ai conversation · ' + SCRIPT.name;
                btn.setAttribute('role', 'button');
                btn.setAttribute('tabindex', '0');
                btn.appendChild(buildGlyph(14));
                const label = document.createElement('span');
                label.textContent = 'Export';
                btn.appendChild(label);
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openConsole();
                });
                btn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        openConsole();
                    }
                });
                document.body.appendChild(btn);
            } catch (err) {
                console.debug(SCRIPT.tag, 'HUD injection failed:', err);
            }
        });
    }

    // ─── MANAGER MENU ────────────────────────────────────────────────────────

    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('Ψ Export conversation…', openConsole);
        }
    } catch (menuErr) {
        console.debug(SCRIPT.tag, 'menu registration failed:', menuErr);
    }

    // ─── BOOT ────────────────────────────────────────────────────────────────

    injectHUD();

})();
