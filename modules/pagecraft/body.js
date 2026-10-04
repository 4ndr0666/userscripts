/* ═══════════════════════════════════════════════════════════════════════════
 * PageCraft — consolidated all-sites utility belt (superset of 4 legacy scripts)
 * ----------------------------------------------------------------------------
 * Absorbs, with zero feature loss (GUP superset gate):
 *   • SelectAllCheckboxes v1.2     → checkboxes module. The jQuery @require
 *     (the suite's ONLY runtime dependency) is eliminated: selection,
 *     range-selection via common-ancestor indices, and alt-hover activation
 *     are re-implemented natively with identical interaction semantics.
 *   • BrokenImgFixer v1.2          → imgfix module. The :-moz-broken feature
 *     probe, cache-bust idempotency (delete-then-set), hash-append
 *     fallback, and one-hop frame broadcast are preserved verbatim.
 *   • Collapse All Images v1.2.0   → collapse module. The hover-expand CSS
 *     (200px → 100% on hover) is preserved; now toggleable without reload
 *     and with a configurable thumbnail size (additive).
 *   • InfiniteBrave v1.0           → brave module. Offset paging, snippet
 *     cloning, insertion-point strategy, and hasMore detection preserved.
 *
 * New capabilities (additive): glass settings console; per-module toggles;
 * Alt+R wired through the collision-aware hotkey registry.
 * ═══════════════════════════════════════════════════════════════════════ */

const store = Ψ.store.ns('pagecraft');
const { $, $$, $new } = Ψ.core;

const MODULES = [
    { key: 'checkboxes', label: 'Bulk checkbox control', dflt: true,
      hint: 'Ctrl+Alt+Click = select all · Shift+Click = range · Alt+Hover = paint' },
    { key: 'imgfix', label: 'Broken-image auto-repair', dflt: true,
      hint: 'Detects failed images, reloads with cache-bust (Alt+R)' },
    { key: 'collapse', label: 'Collapse images (I/O governor)', dflt: false,
      hint: 'Thumbnails at 200px, full-size on hover — reduces page I/O' },
    { key: 'brave', label: 'Brave infinite scroll', dflt: true,
      hint: 'Auto-appends search result pages while scrolling' },
];

const enabled = (key) => store.get(`mod:${key}`, MODULES.find((m) => m.key === key).dflt);

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: checkboxes — superset of SelectAllCheckboxes v1.2 (de-jQueryed)
 * ═══════════════════════════════════════════════════════════════════════ */

(function checkboxesModule() {
    const CHECKBOX_SELECTOR = 'input[type="checkbox"]:enabled, .checkbox';
    let previousElement = null;

    const isCheckboxInput = (el) => el.tagName === 'INPUT' && el.type === 'checkbox';

    /** Click an element if it is an unchecked native checkbox or a custom
     *  checkbox-like node — a native .click() triggers all host listeners. */
    function checkElementIfNeeded(element) {
        try {
            if (isCheckboxInput(element) && element.checked) return;
            element.click();
        } catch (error) {
            console.error('[PageCraft] check element failed:', error, element);
        }
    }

    function selectAll() {
        try {
            for (const el of document.querySelectorAll(CHECKBOX_SELECTOR)) {
                checkElementIfNeeded(el);
            }
        } catch (error) {
            console.error('[PageCraft] selectAll failed:', error);
        }
    }

    /** Nearest common ancestor of two elements — native replacement for the
     *  legacy jQuery closest(parents().add().get().reverse()) construct. */
    function commonAncestor(a, b) {
        const seen = new Set();
        for (let n = a; n; n = n.parentElement) seen.add(n);
        for (let n = b; n; n = n.parentElement) {
            if (seen.has(n)) return n;
        }
        return null;
    }

    function selectRange(startElem, endElem) {
        if (!startElem || !endElem || startElem === endElem) return;

        const parent = commonAncestor(startElem, endElem);
        if (!parent) {
            console.warn('[PageCraft] no common parent — checking endpoints only.');
            checkElementIfNeeded(startElem);
            checkElementIfNeeded(endElem);
            return;
        }

        const inScope = Array.from(parent.querySelectorAll(CHECKBOX_SELECTOR));
        const startIndex = inScope.indexOf(startElem);
        const endIndex = inScope.indexOf(endElem);
        if (startIndex === -1 || endIndex === -1) {
            console.warn('[PageCraft] range markers not found in common parent.');
            return;
        }
        const lo = Math.min(startIndex, endIndex), hi = Math.max(startIndex, endIndex);
        for (const el of inScope.slice(lo, hi + 1)) checkElementIfNeeded(el);
    }

    /* Delegated mousedown — capture interaction semantics from the legacy
     * jQuery handlers exactly (primary button only, same modifier gates). */
    document.addEventListener('mousedown', (event) => {
        if (!enabled('checkboxes')) return;
        const target = event.target.closest ? event.target.closest(CHECKBOX_SELECTOR) : null;
        if (!target || event.button !== 0) return;

        try {
            if (event.ctrlKey && event.altKey && !event.shiftKey) {
                event.preventDefault();
                selectAll();
            } else if (event.shiftKey && !event.ctrlKey && !event.altKey && previousElement) {
                event.preventDefault();
                selectRange(previousElement, target);
            }
        } catch (error) {
            console.error('[PageCraft] mousedown handler failed:', error);
        }
        previousElement = target;
    }, true);

    /* Alt+hover paint (mouseenter ≈ pointerover with pointer-type mouse). */
    document.addEventListener('mouseover', (event) => {
        if (!enabled('checkboxes')) return;
        if (!(event.altKey && !event.shiftKey && !event.ctrlKey)) return;
        const target = event.target.closest ? event.target.closest(CHECKBOX_SELECTOR) : null;
        if (!target) return;
        try { checkElementIfNeeded(target); }
        catch (error) { console.error('[PageCraft] hover activation failed:', error); }
    }, true);

    if (typeof GM_registerMenuCommand === 'function') {
        const userLang = navigator.language || 'en';
        GM_registerMenuCommand(userLang.startsWith('zh') ? 'Ψ PageCraft — 全选' : 'Ψ PageCraft — Select All', selectAll);
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: imgfix — superset of BrokenImgFixer v1.2
 * ═══════════════════════════════════════════════════════════════════════ */

(function imgfixModule() {
    /* Debug hook (legacy BrokenImgFixer capability preserved): ship silent;
     * toggle in DevTools console — `window.__BIF_DEBUG = true` (legacy name
     * honored) or `window.__PAGECRAFT_DEBUG = true`. */
    const dbg = (...args) => {
        if (window.__BIF_DEBUG || window.__PAGECRAFT_DEBUG) {
            console.log('[PageCraft]', ...args);
        }
    };

    /* Feature-detect: `:-moz-broken` throws SyntaxError in Chromium. */
    let MOZ_BROKEN_SUPPORTED = false;
    try {
        document.querySelectorAll('[src]:-moz-broken');
        MOZ_BROKEN_SUPPORTED = true;
    } catch (e) {
        MOZ_BROKEN_SUPPORTED = false;
    }

    function isBroken(img) {
        if (!img.hasAttribute('src') || img.src === '') return false;
        if (img.complete && img.naturalWidth === 0) return true;
        if (MOZ_BROKEN_SUPPORTED) {
            try { if (img.matches('[src]:-moz-broken')) return true; }
            catch (e) { /* feature-detect false positive — suppressed */ }
        }
        return false;
    }

    function reloadImages() {
        const bustValue = String(Date.now());
        let count = 0;
        for (const img of document.images) {
            if (!isBroken(img)) continue;
            try {
                const url = new URL(img.src, window.location.href);
                url.searchParams.delete('_cache_bust');   // idempotent bust
                url.searchParams.set('_cache_bust', bustValue);
                img.src = url.toString();
                count++;
            } catch (error) {
                console.warn('[PageCraft] src parse failed; hash-append fallback.',
                    { src: img.src, error: error.message });
                const stripped = img.src.replace(/#.*$/, '');
                if (stripped) { img.src = stripped + '#'; count++; }
            }
        }
        dbg(`reloadImages: repaired ${count} broken image(s)`);
        return count;
    }

    function broadcastEvent() {
        for (const win of window.frames) {
            try {
                win.postMessage('RELOAD_BROKEN_IMAGES', '*');
            } catch (error) {
                if (error instanceof DOMException) {
                    if (error.name !== 'SecurityError') {
                        console.warn('[PageCraft] frame broadcast DOMException:', error.name, error.message);
                    }
                } else {
                    console.error('[PageCraft] unexpected frame broadcast error:', error);
                }
            }
        }
    }

    const initialScan = () => {
        dbg(`imgfix initial scan starting`);
        if (enabled('imgfix')) reloadImages();
    };

    /* Alt+R manual retrigger — now through the collision-aware registry
     * (legacy hard-bind collided with Recon's Alt+R when co-installed). */
    Ψ.hotkeys.register('Alt+R', () => {
        if (!enabled('imgfix')) return;
        const n = reloadImages();
        broadcastEvent();
        Ψ.glass.toast(n > 0 ? `Repaired ${n} broken image(s)` : 'No broken images found', { type: 'info' });
    }, { id: 'imgfix-reload', script: 'PageCraft' });

    window.addEventListener('message', (e) => {
        if (e.data === 'RELOAD_BROKEN_IMAGES' && enabled('imgfix')) {
            reloadImages();
            broadcastEvent();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialScan, { once: true });
    } else {
        initialScan();
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: collapse — superset of Collapse All Images v1.2.0
 * Legacy behavior: fixed 200px thumbnails expanding to full size on hover.
 * Additive: size configurable (100–480px), live toggle without reload.
 * ═══════════════════════════════════════════════════════════════════════ */

(function collapseModule() {
    const STYLE_ID = 'a4-pagecraft-collapse';

    function applyCollapse() {
        document.getElementById(STYLE_ID)?.remove();
        if (!enabled('collapse')) return;
        const size = store.get('collapse:size', 200);
        const style = $new('style', { id: STYLE_ID });
        style.textContent = `
img {
    transition: max-width 0.4s ease-in-out, max-height 0.4s ease-in-out;
    max-width: ${Number(size) || 200}px;
    max-height: ${Number(size) || 200}px;
    object-fit: contain;
}
img:hover { max-width: 100%; max-height: 100%; }`;
        (document.head || document.documentElement).append(style);
    }

    store.watch('mod:collapse', applyCollapse);
    store.watch('collapse:size', applyCollapse);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyCollapse, { once: true });
    } else {
        applyCollapse();
    }
})();

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: brave — superset of InfiniteBrave v1.0
 * ═══════════════════════════════════════════════════════════════════════ */

(function braveModule() {
    if (!/^(www\.)?search\.brave\.com$/.test(window.location.hostname)) return;

    const currentUrlParams = new URLSearchParams(window.location.search);
    const currentOffset = parseInt(currentUrlParams.get('offset') || '0', 10);
    let pageNumber = currentOffset + 1;
    let isLoading = false;
    let hasMore = true;

    const fetchNextPage = async () => {
        const baseUrl = new URL(window.location.href);
        baseUrl.searchParams.set('offset', pageNumber);
        try {
            const response = await fetch(baseUrl.toString());
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            /* v1.4.2: TT-safe parse — Ψ.core.parseHTML policy-wraps the
             * string when the host enforces require-trusted-types-for. */
            const newDoc = Ψ.core.parseHTML(text);

            const container = $new('div', { id: `page-${pageNumber}`, style: { marginTop: '20px' } });
            const results = newDoc.querySelectorAll('#results > .snippet');
            if (results.length === 0) { hasMore = false; return; }
            for (const result of results) container.append(result.cloneNode(true));

            const insertionPoint = document.querySelector('#pagination-snippet') ||
                (document.querySelector('#results') || {}).lastElementChild;
            if (insertionPoint) {
                insertionPoint.before(container);
            } else {
                const resultsContainer = document.querySelector('#results');
                if (resultsContainer) resultsContainer.append(container);
            }

            hasMore = !!newDoc.querySelector('a[href*="offset="]:not([disabled])');
            if (hasMore) pageNumber++;
        } catch (error) {
            console.error('[PageCraft] next page fetch failed:', error);
            hasMore = false;
        }
    };

    const onScroll = Ψ.core.throttle(async () => {
        if (!enabled('brave')) return;
        if (document.documentElement.scrollHeight <= window.innerHeight) return;
        const scrollThreshold = 1000;
        const scrollPosition = window.innerHeight + window.scrollY;
        const scrollMax = document.documentElement.scrollHeight - scrollThreshold;
        if (!isLoading && hasMore && scrollPosition >= scrollMax) {
            isLoading = true;
            try { await fetchNextPage(); } finally { isLoading = false; }
        }
    }, 200);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('beforeunload', onScroll.cancel, { once: true });
})();

/* ═══════════════════════════════════════════════════════════════════════
 * Settings console (3lectric-Glass) + manager menu
 * ═══════════════════════════════════════════════════════════════════════ */

function openSettings() {
    /* v1.1.0: fail-loud console opens (see the hostwarp twin + kernel
     * glass.js v1.3.0 facade repair for why this used to be dead). */
    try {
        Ψ.glass.injectStyles();
        const hud = Ψ.glass.hud({
            id: 'pagecraft-settings',
            title: 'PAGECRAFT',
            subtitle: 'page utility belt — ' + Ψ.brand.SUITE,
            width: 420, height: 380,
            tabs: [
            {
                id: 'modules', label: 'MODULES',
                render: (contentEl) => {
                    const schema = MODULES.map((m) => ({
                        key: `mod:${m.key}`, type: 'bool', label: m.label, default: m.dflt, hint: m.hint,
                    }));
                    schema.push({
                        key: 'collapse:size', type: 'number', label: 'Collapse thumbnail size (px)',
                        default: 200, min: 100, max: 480, hint: 'Applies live',
                    });
                    Ψ.glass.settingsConsole(contentEl, 'pagecraft', schema, (key) => {
                        if (key.startsWith('mod:')) {
                            Ψ.glass.toast(`${key.slice(4)} toggled`, { type: 'info' });
                        }
                    });
                },
            },
            {
                id: 'hotkeys', label: 'KEYS',
                render: (contentEl) => {
                    const rows = Ψ.hotkeys.listBindings()
                        .map((b) => $new('div', { class: 'a4-panel', style: { fontSize: '12px' } },
                            `${b.combo}  →  ${b.id} (${b.script})`));
                    contentEl.append(...(rows.length ? rows
                        : [$new('div', { class: 'a4-panel' }, 'No hotkeys registered on this page.')]));
                },
            },
        ],
    });
        hud.show();
    } catch (e) {
        console.error('[Ψ PageCraft] settings console failed:', e);
        try { Ψ.glass.toast(`Settings console error: ${e && e.message ? e.message : e}`, { type: 'error' }); }
        catch (_) { alert(`Ψ PageCraft — settings console error:\n${e && e.message ? e.message : e}`); }
    }
}

if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Ψ PageCraft — settings console', openSettings);
}
