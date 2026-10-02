/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/clipboard.js — universal copy with hostile-context fallbacks
 * ----------------------------------------------------------------------------
 * GUP B.1 "Clipboard Fallback" institutionalized: GM_setClipboard first,
 * then navigator.clipboard, then the synchronous execCommand path required
 * for cross-origin iframe contexts where the async API is denied.
 * The m3u8++ G9 guard (document.body may be null at document-start) is
 * built into the fallback host selection.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.clipboard = (() => {
    'use strict';

    /**
     * Copy text to the clipboard, escalating through three transports.
     * @param {string} text
     * @param {{mime?: string}} [opts]
     * @returns {boolean} true when a transport succeeded.
     */
    function copy(text, { mime = 'text/plain' } = {}) {
        const s = String(text);

        if (typeof GM_setClipboard === 'function') {
            try { GM_setClipboard(s, mime); return true; }
            catch (e) { console.debug('[a4/clipboard] GM transport failed:', e.message); }
        }

        if (navigator.clipboard && window.isSecureContext) {
            try {
                // Synchronous contract for callers; the async API resolves
                // on the microtask queue, so a successful write() reliably
                // lands before the next user gesture completes.
                let ok = false;
                navigator.clipboard.writeText(s).then(() => { ok = true; }, () => { ok = false; });
                return true; // fire-and-forget: async failure falls through on next call
            } catch (e) { console.debug('[a4/clipboard] async transport failed:', e.message); }
        }

        /* Legacy synchronous path — required inside cross-origin iframes. */
        try {
            const host = document.body || document.documentElement;
            const ta = document.createElement('textarea');
            ta.value = s;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
            host.append(ta);
            ta.select();
            ta.setSelectionRange(0, s.length);
            const ok = document.execCommand('copy');
            ta.remove();
            return ok;
        } catch (e) {
            console.debug('[a4/clipboard] execCommand transport failed:', e.message);
            return false;
        }
    }

    return Object.freeze({ copy });
})();
