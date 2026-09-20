// ==UserScript==
// @name         4ndr0tools - AlwaysNewWindow 
// @namespace    http://www.github.com/4ndr0666/userscripts
// @description  Open all links into new windows (optional force mode), auto-expand collapsed content, hide banners and consent overlays, neon-glow overlay scrollbar, and right-click scroll-to-top/bottom.
// @version      1.0.0
// @author       4ndr0666
// @match        *://*/*
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AlwaysNewWindow.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20AlwaysNewWindow.user.js
// @license      UNLICENSED - RED TEAM USE ONLY
// ==/UserScript==

/* Paradigm: Event-Driven Userscript Toolkit — one IIFE, module registry with
 * independent enable/disable lifecycles, one MutationObserver per module,
 * zero floating UI, options exposed exclusively via GM menu commands. */

(function () {
    'use strict';

    // ====================================================================
    // SHARED CORE
    // ====================================================================
    const DEBUG_TAG = '[4ndr0tools]';
    // Sandboxed grant mode: reach the real page window for window.open hooks.
    const PAGE_WIN = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';
    const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
    const $root = () => document.scrollingElement || document.documentElement;

    const Store = {
        get(k, d) {
            try {
                if (typeof GM_getValue === 'function') return GM_getValue(k, d);
            } catch (e) { console.debug(DEBUG_TAG + ' GM_getValue unavailable, using localStorage:', e); }
            try {
                const v = localStorage.getItem(k);
                return v !== null ? v : d;
            } catch (e) { console.debug(DEBUG_TAG + ' localStorage read failed:', e); return d; }
        },
        set(k, v) {
            try {
                if (typeof GM_setValue === 'function') { GM_setValue(k, v); return; }
            } catch (e) { console.debug(DEBUG_TAG + ' GM_setValue unavailable, using localStorage:', e); }
            try { localStorage.setItem(k, v); } catch (e) { console.debug(DEBUG_TAG + ' localStorage write failed:', e); }
        }
    };

    // Style injection that keeps element references so modules can fully
    // remove their CSS when toggled off (native scrollbar restore, etc.).
    const addStyle = (css, id) => {
        const st = document.createElement('style');
        if (id) st.id = id;
        st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
        return st;
    };

    const whenReady = (fn) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => fn(), { once: true });
        } else {
            fn();
        }
    };

    // Persisted option registry: key, storage key, default value.
    const OPT = {
        always:    { key: 'anw-always-new-window', def: true  },
        force:     { key: 'anw-force-links',       def: false },
        expand:    { key: 'anw-expand-everything', def: true  },
        hide:      { key: 'anw-hide-banners',      def: true  },
        scrollbar: { key: 'anw-neon-scrollbar',    def: true  },
        smooth:    { key: 'anw-scrollbar-smooth',  def: false },
        rcnav:     { key: 'anw-right-click-nav',   def: true  }
    };
    const state = {};
    for (const k of Object.keys(OPT)) {
        state[k] = toBool(Store.get(OPT[k].key, OPT[k].def));
    }

    // Loud-failure boot wrapper: a module that cannot start is marked OFF in
    // state so the menu reflects reality and the user can retry via toggle.
    const safe = (key, fn) => {
        try {
            fn();
        } catch (e) {
            console.error(DEBUG_TAG + ' module failed to start: ' + key, e);
            state[key] = false;
        }
    };

    // ====================================================================
    // MODULE: Always New Window
    // ====================================================================
    const AlwaysNewWindow = (() => {
        let active = false;
        let observer = null;
        // anchor -> { target, rel } captured before first modification so the
        // toggle can restore the page-author state exactly (reversible).
        const originals = new Map();

        const processAnchor = (anchor) => {
            if (anchor && anchor.tagName === 'A') {
                if (!originals.has(anchor)) {
                    originals.set(anchor, { target: anchor.target, rel: anchor.rel });
                }
                // target=_blank opens in a new window/tab; rel prevents the new
                // page from accessing window.opener and from sending referrer.
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
            }
        };

        const processNode = (node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                processAnchor(node);
                const childAnchors = node.querySelectorAll('a');
                childAnchors.forEach(processAnchor);
            }
        };

        const scanAll = () => {
            try {
                const initialElements = document.querySelectorAll('a');
                initialElements.forEach(processAnchor);
            } catch (error) {
                console.error(DEBUG_TAG + ' Always New Window (initial scan) error:', error);
            }
        };

        const enable = () => {
            if (active) return;
            active = true;
            // Observing documentElement document.body observation works from document-start.
            observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(processNode);
                    }
                }
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            scanAll();
            whenReady(scanAll); // re-scan after parse completes (idempotent)
        };

        const disable = () => {
            if (!active) return;
            if (observer) { observer.disconnect(); observer = null; }
            originals.forEach((orig, anchor) => {
                if (anchor.isConnected) {
                    anchor.target = orig.target;
                    anchor.rel = orig.rel;
                }
            });
            originals.clear();
            active = false;
        };

        return { enable, disable };
    })();

    // ====================================================================
    // MODULE: Force Links
    // Aggressive mode: capture-phase click interception + window.open remap.
    // ====================================================================
    const ForceLinks = (() => {
        let active = false;
        let originalOpen = null;

        const forceOpen = function (url, target = '_blank', features) {
            if (['_self', '_parent', '_top'].includes(target)) {
                target = '_blank';
            }
            return originalOpen.call(PAGE_WIN, url, target, features);
        };

        const onDocumentClick = (event) => {
            const t = event.target;
            if (!t || typeof t.closest !== 'function') return;
            const anchor = t.closest('a');
            if (anchor && anchor.href) {
                event.preventDefault();
                // noopener/noreferrer security.
                PAGE_WIN.open(anchor.href, '_blank', 'noopener,noreferrer');
            }
        };

        const enable = () => {
            if (active) return;
            // Upstream excludes greasyfork.org (protects script update pages).
            if (/(^|\.)greasyfork\.org$/i.test(window.location.hostname)) return;
            active = true;
            document.addEventListener('click', onDocumentClick, true);
            originalOpen = PAGE_WIN.open;
            PAGE_WIN.open = forceOpen;
        };

        const disable = () => {
            if (!active) return;
            document.removeEventListener('click', onDocumentClick, true);
            if (originalOpen && PAGE_WIN.open === forceOpen) {
                PAGE_WIN.open = originalOpen;
            }
            originalOpen = null;
            active = false;
        };

        return { enable, disable };
    })();

    // ====================================================================
    // MODULE: Hide Banners 
    // Site rulebook + universal curated consent-banner layer.
    // Hiding is reversible; generic layer never auto-clicks consent buttons.
    // ====================================================================
    const HideBanner = (() => {
        let active = false;
        let observer = null;
        let pending = 0;

        const domainSelectors = {
            'pansci.asia': {
                hide: ['#main_navbar', '#s-progress-wrap'],
                click: [],
                scrollTo: 'h1'
            },
            'www.infoq.cn': {
                hide: [
                    'div.audioPlayer.AudioPlayer_main_HiF3z',
                    'div.header',
                    'div.sub-nav-wrap',
                    '.geo-banner.fixed'
                ],
                click: [],
                scrollTo: '.article-title'
            },
            'www.inside.com.tw': {
                hide: [],
                click: ['#article_content'],
                scrollTo: 'picture'
            },
            'www.latimes.com': {
                hide: ['nav', '.modality-content'],
                click: [
                    // 'shadow:modality-custom-element .met-button' triggers 403 upstream; kept off.
                    'shadow:modality-custom-element .met-flyout-close'
                ],
                scrollTo: '.head-line'
            },
            'whatisintelligence.antikythera.org': {
                hide: [
                    'shadow:antikythera-menu article',
                    '#chapter-header',
                    '.toc-btn'
                ],
                click: [],
                scrollTo: null
            },
            'tam.gov.taipei': {
                path: '/News_Content.aspx',
                hide: [
                    '.group.base-mobile',
                    '.simple-text.major-logo',
                    '#CCMS_Content .area-customize.ai-wrapper'
                ],
                click: [],
                scrollTo: [
                    '#CCMS_Content .area-essay.page-caption-p strong[id]',
                    '#CCMS_Content .simple-text.title h3'
                ]
            }
        };

        // Universal consent/banner layer: curated high-signal selectors,
        // hide-only. Never clicks accept/close on the user's behalf: no
        // consent is ever granted, banners are simply removed from view.
        const genericHideSelectors = [
            '#onetrust-consent-sdk', '#onetrust-banner-sdk',        // OneTrust
            '#CybotCookieDialog',                                    // Cookiebot
            '#cookiescript_injected', '#cookiescript_main-wrapper', // CookieScript
            '#cookie-law-info-bar', '.cookie-law-info-bar',         // Cookie Law Info (WP)
            '.cky-consent', '.cky-banner',                           // CookieYes
            '.cc-banner', '.cc-window', '.cc_container',             // cookieconsent variants
            '#cookie-banner', '.cookie-banner', '#cookieBar', '.cookieBar',
            '#cookie-bar', '.cookie-bar', '#cookieBanner',
            '.cookie-consent', '#cookie-consent', '.cookie-consent-banner',
            '#cookie-notice', '.cookie-notice', '#cookie_notice',
            '.cookie-notification', '#cookieNotification',
            '#cookieModal', '.cookie-message', '#cookie-message',
            '#gdpr-banner', '.gdpr-banner', '#gdpr-bar', '.gdpr-box',
            '.eu-cookie-compliance-banner', '#sliding-popup',
            '.js-cookie-consent', '.consent-banner', '#consent-banner',
            '.cookie-disclaimer', '[data-testid="cookie-consent-banner"]'
        ];

        function getCurrentConfig() {
            const config = domainSelectors[window.location.hostname];
            if (!config) return { hide: [], click: [], scrollTo: null };
            if (config.path && window.location.pathname !== config.path) {
                return { hide: [], click: [], scrollTo: null };
            }
            return config;
        }

        let currentConfig = { hide: [], click: [], scrollTo: null };

        // Track clicked elements to avoid repeated clicks.
        const clickedElements = new WeakSet();
        // element -> original inline display value, captured before hiding so
        // the module toggle can restore the page state exactly.
        const hiddenElements = new Map();

        // Support selectors inside a single shadow host via "shadow:<host-selector> <descendant>".
        function queryAll(selector) {
            const shadowMatch = selector.match(/^shadow:([^ ]+)\s+(.+)$/);
            if (shadowMatch) {
                const host = document.querySelector(shadowMatch[1]);
                if (!host || !host.shadowRoot) return [];
                return host.shadowRoot.querySelectorAll(shadowMatch[2]);
            }
            return document.querySelectorAll(selector);
        }

        function hideElement(element) {
            if (!hiddenElements.has(element)) {
                hiddenElements.set(element, element.style.display);
            }
            element.style.display = 'none';
        }

        function hideElements() {
            currentConfig.hide.forEach(selector => {
                queryAll(selector).forEach(hideElement);
            });
            genericHideSelectors.forEach(selector => {
                queryAll(selector).forEach(hideElement);
            });
        }

        function clickElements() {
            currentConfig.click.forEach(selector => {
                const elements = queryAll(selector);
                elements.forEach(element => {
                    if (!clickedElements.has(element)) {
                        console.log('HideBanner clicking element:', element);
                        element.click();
                        clickedElements.add(element);
                    }
                });
            });
        }

        function scrollToElement() {
            if (!currentConfig.scrollTo) return;
            const selectors = Array.isArray(currentConfig.scrollTo) ? currentConfig.scrollTo : [currentConfig.scrollTo];
            const element = selectors.flatMap(selector => Array.from(queryAll(selector)))[0];
            if (!element) return;
            const elementRect = element.getBoundingClientRect();
            // Only scroll when the target element is below the current viewport.
            if (elementRect.top > 0) {
                console.log('HideBanner scrolling to element:', element);
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function processPage() {
            hideElements();
            clickElements();
            scrollToElement();
        }

        // Coalesce mutation bursts into one trailing scan (<=100ms latency,
        // identical outcome, bounded query cost on heavy dynamic pages).
        const processPageDebounced = () => {
            if (pending) return;
            pending = setTimeout(() => { pending = 0; processPage(); }, 100);
        };

        const enable = () => {
            if (active) return;
            active = true;
            whenReady(() => {
                if (!active) return;
                currentConfig = getCurrentConfig();
                processPage();
                observer = new MutationObserver(processPageDebounced);
                observer.observe(document.body, { childList: true, subtree: true });
            });
        };

        const disable = () => {
            if (!active) return;
            if (observer) { observer.disconnect(); observer = null; }
            if (pending) { clearTimeout(pending); pending = 0; }
            hiddenElements.forEach((display, element) => {
                if (element.isConnected) element.style.display = display;
            });
            hiddenElements.clear();
            active = false;
        };

        return { enable, disable };
    })();

    // ====================================================================
    // MODULE: Expand Everything 
    // Multi-registration engine via one shared observer;
    // per-rule caps, SPA navigation reset, and a universal generic
    // "show more" heuristic on top of the site rulebook.
    // ====================================================================
    const ExpandEverything = (() => {
        let active = false;
        const logPrefix = 'Expand Everything: ';
        let observer = null;          // single shared MutationObserver
        const registrations = [];     // {selectors, callback, maxMutations, mutations, raw}
        let pageCounter = 0;          // IMDb "load more" safety cap
        let alreadyClicked = new WeakMap();
        let lastHref = location.href;
        let locationInterval = null;
        let onVisibilityChange = null;
        let onNavigate = null;

        const resetAlreadyClicked = () => { alreadyClicked = new WeakMap(); };
        resetAlreadyClicked();

        // Click on something if it hasn't already been clicked.
        function clickIfUnclicked(el) {
            if (alreadyClicked.get(el)) return;
            alreadyClicked.set(el, true);
            el.click();
        }

        function queryElements(selector, callback) {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => callback(element));
        }

        // register(maxMutations, selectors, callback): selector-driven group.
        const register = (maxMutations, selectors, callback) => {
            registrations.push({ selectors, callback, maxMutations, mutations: 0, raw: false });
        };
        // registerRaw(maxMutations, callback): called once per mutation batch.
        const registerRaw = (maxMutations, callback) => {
            registrations.push({ selectors: null, callback, maxMutations, mutations: 0, raw: true });
        };

        const runGroup = (reg) => {
            if (reg.raw) { reg.callback(); return; }
            for (const selector of reg.selectors) queryElements(selector, reg.callback);
        };

        // Process all live groups once (upstream reobserve semantics).
        const runAll = () => {
            for (const reg of registrations) {
                if (reg.mutations >= reg.maxMutations) continue;
                runGroup(reg);
            }
        };

        const ensureObserver = () => {
            if (observer !== null) return;
            observer = new MutationObserver(() => {
                if (observer === null) return;
                let live = 0;
                for (const reg of registrations) {
                    if (reg.mutations >= reg.maxMutations) continue;
                    reg.mutations++;
                    live++;
                    if (reg.mutations >= reg.maxMutations) {
                        console.log(`${logPrefix}disconnecting rule group after ${reg.mutations} mutations to avoid slowing down the page`);
                    }
                    runGroup(reg);
                }
                if (live === 0 && registrations.length > 0) {
                    // All groups exhausted: full disconnect (upstream semantics).
                    observer.disconnect();
                }
            });
        };

        const reobserve = () => {
            runAll();
            observer.observe(document.documentElement, { childList: true, subtree: true });
        };

        function navigated() {
            if (observer === null) return;
            console.log(`${logPrefix}navigated, resetting alreadyClicked and MutationObserver`);
            observer.disconnect();
            resetAlreadyClicked();
            for (const reg of registrations) reg.mutations = 0;
            pageCounter = 0;
            reobserve();
        }

        function startPollingLocation() {
            if (locationInterval !== null) {
                throw new Error(`locationInterval already exists: ${locationInterval}`);
            }
            locationInterval = setInterval(() => {
                if (location.href !== lastHref) {
                    lastHref = location.href;
                    navigated();
                }
            }, 1000);
        }

        function stopPollingLocation() {
            if (locationInterval === null) {
                throw new Error(`locationInterval === null`);
            }
            clearInterval(locationInterval);
            locationInterval = null;
        }

        const bindNavigationWatch = () => {
            if (window.navigation && navigation.addEventListener) {
                // Navigation API: ignore same-location events or Firefox loops infinitely.
                console.log(`${logPrefix}using Navigation API to detect location changes`);
                onNavigate = (ev) => {
                    if (ev.destination.url === window.location.href) {
                        console.log(`${logPrefix}ignoring navigation event to the same location`);
                        return;
                    }
                    navigated();
                };
                navigation.addEventListener('navigate', onNavigate);
            } else {
                console.log(`${logPrefix}using setInterval(..., 1000) to detect location changes`);
                startPollingLocation();
                // Save power: stop polling while the page is hidden.
                onVisibilityChange = function () {
                    if (document.hidden) {
                        console.log(`${logPrefix}page has become hidden, stopping setInterval`);
                        stopPollingLocation();
                    } else {
                        console.log(`${logPrefix}page has become visible, starting setInterval`);
                        startPollingLocation();
                    }
                };
                document.addEventListener('visibilitychange', onVisibilityChange);
            }
        };

        // --- Universal generic "show more" heuristic ---
        // Exact-label matching on interactive elements; bounded by the shared
        // alreadyClicked WeakMap, a 250ms throttle, and conservative skips.
        const GENERIC_LABELS = new Set([
            'show more', 'show more...', 'show more\u2026', 'read more', 'read more\u2026',
            'see more', 'see more...', 'see more\u2026', 'continue reading', 'view more',
            'view more replies', 'load more', 'load more\u2026', 'load more comments',
            'show more comments', 'show more replies', 'show replies',
            'expand full comment'
        ]);
        const GENERIC_SELECTOR = 'button, a, summary, [role="button"]';
        const GENERIC_THROTTLE_MS = 250;
        let lastGenericScan = 0;

        const genericCandidate = (el) => {
            if (el.hidden || el.disabled) return;
            if (el.getAttribute('aria-hidden') === 'true') return;
            if (el.getAttribute('aria-expanded') === 'true') return;
            if (el.isContentEditable) return;
            if (typeof el.closest === 'function' &&
                el.closest('nav, header, [role="navigation"], .bs-bar')) return;
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            if (text.length === 0 || text.length > 32) return;
            if (GENERIC_LABELS.has(text)) clickIfUnclicked(el);
        };

        const throttledGenericScan = () => {
            const now = Date.now();
            if (now - lastGenericScan < GENERIC_THROTTLE_MS) return;
            lastGenericScan = now;
            document.querySelectorAll(GENERIC_SELECTOR).forEach(genericCandidate);
        };

        // --- Site rulebook ---
        const activateRules = () => {
            const loc = window.location.href;

            // goodreads book pages: expand lengthy reviews and author blurbs
            if (loc.startsWith('https://www.goodreads.com/book/show/')) {
                register(1000, [
                    'button[aria-label="Tap to show more review"]',
                    'button[aria-label="Tap to show more about the author"]',
                ], el => clickIfUnclicked(el));
            }

            // goodreads review list pages
            if (loc.startsWith('https://www.goodreads.com/review/list/')) {
                register(100, [
                    'a[data-text-id^="review"][href="#"][onclick="swapContent($(this));; return false;"]',
                ], el => clickIfUnclicked(el));
            }

            // imdb reviews: expand long reviews, "load more" capped at 5 pages
            if (loc.startsWith('https://www.imdb.com/title/')) {
                register(100, [
                    '.ipl-expander:not(.ipl-expander--expanded) > div > div',
                    'button.ipl-load-more__button',
                ], el => {
                    if (el.tagName == 'BUTTON') {
                        if (pageCounter < 5) {
                            pageCounter++;
                            console.log(`${logPrefix}page counter: ${pageCounter}`);
                            el.click();
                        }
                    } else {
                        // imdb adds .ipl-expander--expanded only some time after
                        // the click; avoid MutationObserver loop via WeakMap.
                        clickIfUnclicked(el);
                    }
                });
            }

            // youtube: video description + comments show-more + replies
            if (loc.startsWith('https://www.youtube.com/')) {
                register(200, [
                    'div#description > div#description-inner > #description-inline-expander > .button.ytd-text-inline-expander#expand',
                    'div.ytd-comment-replies-renderer#expander .more-button#more-replies',
                ], el => {
                    // Click only when not hidden (YouTube sets hidden when done;
                    // unconditional clicks make menus/modals lose focus).
                    if (!el.hidden) el.click();
                });
            }

            // linkedin: "...see more" on posts and profile sections
            if (loc.startsWith('https://www.linkedin.com/')) {
                register(100, [
                    'button.feed-shared-inline-show-more-text__see-more-less-toggle.see-more',
                ], el => el.click());
            }

            // substack-family sites: dismiss subscribe modal, expand comments,
            // load more comments
            if (
                window.location.host.endsWith('.substack.com') ||
                window.location.host === 'www.platformer.news' ||
                window.location.host === 'www.henrikkarlsson.xyz' ||
                window.location.host === 'www.experimental-history.com' ||
                window.location.host === 'www.astralcodexten.com' ||
                window.location.host === 'www.computerenhance.com' ||
                window.location.host === 'www.tracingwoodgrains.com' ||
                window.location.host === 'www.theintrinsicperspective.com' ||
                window.location.host === 'www.noahpinion.blog'
            ) {
                register(100, [
                    'button.maybe-later',
                    'div.comment-body:not(.expanded) > div.show-all-toggle > div.show-all-toggle-label',
                    'button.button.collapsed-reply',
                ], el => el.click());
            }

            // substack.com: "See more..." on notes
            if (loc.startsWith('https://substack.com/')) {
                register(100, [
                    'div.pencraft[class*=_seeMoreText_] > span.pencraft > a.pencraft',
                ], el => {
                    if (el.innerText === 'See more...') el.click();
                });
            }

            // tvtropes: "open/close all folders"
            if (loc.startsWith('https://tvtropes.org/')) {
                register(10, [
                    '.toggle-all-folders-button:not(.is-open)',
                ], el => clickIfUnclicked(el));
            }

            // news.ycombinator: show collapsed "[N more]" comments (no observer)
            if (loc.startsWith('https://news.ycombinator.com/')) {
                queryElements('a.togg.clicky', el => {
                    if (el.innerText.endsWith(' more]')) el.click();
                });
            }

            // github: hidden items, minimized/outdated comments, similar
            // comments, resolved threads, timeline and commit comment load-more
            if (loc.startsWith('https://github.com/')) {
                register(1000, [
                    'button[data-testid="issue-timeline-load-more-load-top"]',
                    '#js-progressive-timeline-item-container button.ajax-pagination-btn',
                    '#all_commit_comments button.ajax-pagination-btn',
                    'summary.pagination-loader-container > .Details-content--closed',
                    'div.minimized-comment > details:not([open]) > summary > div > .Details-content--closed',
                    'summary[role="button"] > div > span.Details-content--closed',
                ], el => clickIfUnclicked(el));
            }

            // gist: "Load earlier comments..." after onload (avoid /load_comments nav)
            if (loc.startsWith('https://gist.github.com/')) {
                const startGist = () => {
                    register(5000, [
                        'form.ajax-pagination-form.js-ajax-pagination-form[action$="/load_comments"] > button.ajax-pagination-btn',
                    ], el => clickIfUnclicked(el));
                    if (observer !== null) runAll();
                };
                if (document.readyState === 'complete') startGist();
                else window.addEventListener('load', startGist, { once: true });
            }

            // StackExchange network: "Show N more comments"
            // (window.StackExchange may be defined after DOMContentLoaded at
            // document-start; bounded re-probe preserves upstream behavior.)
            {
                const seSelectors = [
                    'a.js-show-link:not(.dno)',
                    'div.d-flex > button.comments-link',
                ];
                const seCallback = el => {
                    if (el.tagName === 'BUTTON') {
                        if (el.innerText.includes('more comment')) el.click();
                    } else {
                        el.click();
                    }
                };
                if (window.StackExchange) {
                    register(100, seSelectors, seCallback);
                } else {
                    let attempts = 0;
                    const iv = setInterval(() => {
                        attempts++;
                        if (window.StackExchange) {
                            register(100, seSelectors, seCallback);
                            if (observer !== null) runAll();
                            clearInterval(iv);
                        } else if (attempts >= 20) {
                            clearInterval(iv);
                        }
                    }, 250);
                }
            }

            // quora: "Continue Reading"
            if (loc.startsWith('https://www.quora.com/')) {
                register(100, [
                    '.puppeteer_test_read_more_button',
                ], el => clickIfUnclicked(el));
            }

            // old.reddit: expand collapsed "[+]" comments
            if (loc.startsWith('https://old.reddit.com/')) {
                register(200, [
                    'a.expand[href="javascript:void(0)"][onclick="return togglecomment(this)"]',
                ], el => {
                    if (el.innerText == '[+]') clickIfUnclicked(el);
                });
            }

            // lesswrong: truncated highlights, collapsed and downvoted
            // comments, load more
            if (loc.startsWith('https://www.lesswrong.com/')) {
                register(2000, [
                    '.SingleLineComment-truncatedHighlight',
                    'a.CommentsItemMeta-collapse',
                    'span.CommentsItemMeta-collapseCharacter',
                    'a.LoadMore-root',
                ], el => {
                    if (el.classList.contains('CommentsItemMeta-collapse')) {
                        if (el.innerText == '[+]') clickIfUnclicked(el); // only [+] (not [-])
                    } else {
                        clickIfUnclicked(el);
                    }
                });
            }

            // cohost: "read more" on long posts
            if (loc.startsWith('https://cohost.org/')) {
                register(100, [
                    'div.overflow-hidden[data-testid="post-body"] > div > a.cursor-pointer.font-bold.text-cherry',
                ], el => {
                    if (el.innerText == 'read more') clickIfUnclicked(el);
                });
            }

            // nextdoor: "See N more comments", "See more" on posts and comments
            if (loc.startsWith('https://nextdoor.com/')) {
                register(200, [
                    'button.see-previous-comments-button-paged',
                    'button.truncate-view-more-link',
                    'a.truncate-view-more-link',
                ], el => clickIfUnclicked(el));
            }

            // steam store: "READ MORE" on reviews and Early Access info
            if (loc.startsWith('https://store.steampowered.com/')) {
                register(200, [
                    'a.morebutton[href="#"][onclick]',
                    'div.view_more > a[href="#"][onclick]',
                ], el => clickIfUnclicked(el));
            }

            // hwinfo forum (XenForo): "Click to expand..."
            if (loc.startsWith('https://www.hwinfo.com/forum/')) {
                register(10, [
                    'div.js-expandLink > a[role="button"]',
                ], el => el.click());
            }

            // patreon: "Continue reading" on posts
            if (loc.startsWith('https://www.patreon.com/')) {
                register(10, [
                    'div[class][data-tag="post-content-collapse"] > div[class] > button[class]',
                ], el => el.click());
            }

            // mastodon: "SHOW MORE" spoilers
            if (
                window.location.host === 'mastodon.social' ||
                window.location.host === 'social.pixie.town'
            ) {
                register(20, [
                    'div[data-spoiler="folded"] button.status__content__spoiler-link',
                ], el => clickIfUnclicked(el));
            }

            // twitter/x: show replies, probable spam, sensitive content, long tweets
            if (loc.startsWith('https://twitter.com/') || loc.startsWith('https://x.com/')) {
                register(1000, [
                    'button[role="button"] > div > div > div[style][dir] > span[class^="css-"]',
                    'button[class][role="button"][type="button"] > div > div[dir="ltr"][style] > span[class^="css-"]',
                    'button > div[style^="text-overflow: unset;"] > span[class][style="text-overflow: unset;"] > span[class][style="text-overflow: unset;"]',
                    'button[data-testid="tweet-text-show-more-link"][type="button"] > span[class]',
                    'button > div > div > span > span[class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3"]',
                ], el => {
                    if (el.innerText === 'Show replies' || el.innerText === 'Show probable spam' || el.innerText === 'Show' || el.innerText === 'Show more' || el.innerText === 'View') {
                        el.click();
                    }
                });
            }

            // google search: " More" on reviews
            if (loc.startsWith('https://www.google.com/search')) {
                register(200, [
                    'div[class][jscontroller] > a[class][role="button"][tabindex="0"][aria-label^="Read more of "][jsaction][data-ved]',
                ], el => {
                    if (el.innerText === ' More') el.click();
                });
            }

            // nytimes live pages: "Show more" on mini articles
            if (loc.startsWith('https://www.nytimes.com/')) {
                register(20, [
                    'button[class][data-testid="Show-More"][type="button"][aria-hidden="true"]',
                ], el => clickIfUnclicked(el));
            }

            // bloomberg author pages: "Load More Stories"
            if (loc.startsWith('https://www.bloomberg.com/')) {
                register(1000, [
                    'button[type="button"][data-component="outlined-button"][aria-label="more stories"]',
                ], el => el.click());
            }

            // criticker: "More" on minireviews
            if (loc.startsWith('https://www.criticker.com/')) {
                register(20, [
                    'div.ratingcard_compact_more.tiny > a.textlink[href="#"]',
                ], el => {
                    if (el.innerText === 'More') clickIfUnclicked(el);
                });
            }

            // claude.ai: reasoning traces and "Show more" on prompts
            if (loc.startsWith('https://claude.ai/chat/')) {
                register(20, [
                    'button[aria-expanded="false"][class="group/status flex items-center gap-2 py-1 text-sm transition-colors cursor-pointer text-left text-text-500 hover:text-text-300 flex-1 min-w-0"]',
                    'button[class="text-xs text-text-500/80 hover:text-text-100 transition opacity-0 group-hover/timeline-text:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"]',
                    'button[class="pb-3 pt-1 text-xs text-text-500/80 hover:text-text-100 transition w-3/4 text-left rounded-lg"]',
                ], el => clickIfUnclicked(el));
            }

            // Universal generic heuristic (applies on every site).
            registerRaw(2000, throttledGenericScan);
        };

        const enable = () => {
            if (active) return;
            active = true;
            resetAlreadyClicked();
            // Rules activate at DOMContentLoaded: static content is fully
            // present and initial-parse mutations do not burn rule caps
            // preserving document-idle runtime semantics).
            whenReady(() => {
                if (!active) return;
                activateRules();
                ensureObserver();
                reobserve();
                bindNavigationWatch();
            });
        };

        const disable = () => {
            if (!active) return;
            active = false;
            if (observer) { observer.disconnect(); observer = null; }
            if (locationInterval !== null) { clearInterval(locationInterval); locationInterval = null; }
            if (onVisibilityChange) {
                document.removeEventListener('visibilitychange', onVisibilityChange);
                onVisibilityChange = null;
            }
            if (onNavigate && window.navigation && navigation.removeEventListener) {
                navigation.removeEventListener('navigate', onNavigate);
                onNavigate = null;
            }
            registrations.length = 0;
        };

        return { enable, disable };
    })();

    // ====================================================================
    // MODULE: Neon Scrollbar 
    // Overlay scrollbar engine. Any init failure removes all injected CSS, 
    // restoring the native scrollbar.
    // ====================================================================
    const Scrollbar = (() => {
        const MIN_THUMB = 30, RATIO = 0.95, Z = 9999999;
        const IDLE_DELAY = 1000; // ms — wait before collapsing to thin indicator

        // Overlay bar element -> its scroll container. Lets RightClickNav
        // resolve clicks on the custom bar independently of neon glow.
        const BAR_CONTAINER = new WeakMap();

        let active = false;
        let MGR = null;
        let styleEls = [];
        let SMOOTH_BAR = false;

        const isScrollable = (el) => {
            if (!el || !el.nodeType) return false;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            return /auto|scroll|overlay/.test((cs.overflowY || cs.overflow || '').toLowerCase())
                && el.scrollHeight > el.clientHeight + 1;
        };

        const findScrollable = (t) => {
            if (!t) return $root();
            if (t.closest('.bs-bar')) return null;
            for (let el = t; el && el !== document.documentElement; el = el.parentElement) {
                if (el === document.body) return $root();
                if (isScrollable(el)) return el;
            }
            return $root();
        };

        class SB {
            constructor(container) {
                this.c = container;
                this.r = container === $root();
                this.el = document.createElement('div');
                this.el.className = 'bs-bar';
                this.thumb = document.createElement('div');
                this.thumb.className = 'bs-thumb';
                this.el.appendChild(this.thumb);
                document.body.appendChild(this.el);
                BAR_CONTAINER.set(this.el, container);
                this.raf = 0;
                this._anim = 0;
                this._idleTO = 0;
                this.isHover = false;
                if (!this.r && this.c && this.c.classList) this.c.classList.add('bs-hide-v');

                this.onScroll = () => {
                    this.req();
                    this.awake();
                    this.scheduleIdle();
                };

                this.bind();
                this.update();
                this.scheduleIdle(); // start collapsed after a delay if untouched
            }

            _setScroll(v) {
                (this.r ? $root() : this.c).scrollTop = v;
            }
            cancelSmooth() {
                if (this._anim) cancelAnimationFrame(this._anim);
                this._anim = 0;
            }
            to(y) { // instant
                this.cancelSmooth();
                const m = this.m(), v = clamp(y, 0, m.max);
                this._setScroll(v);
            }
            smoothTo(y, dur = 180) {
                this.cancelSmooth();
                const m = this.m(), start = m.scroll, end = clamp(y, 0, m.max);
                if (Math.abs(end - start) < 2) { this.to(end); return; }
                const t0 = performance.now();
                const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
                const step = (now) => {
                    const t = clamp((now - t0) / dur, 0, 1);
                    this._setScroll(start + (end - start) * ease(t));
                    if (t < 1) this._anim = requestAnimationFrame(step);
                    else this._anim = 0;
                };
                this._anim = requestAnimationFrame(step);
            }
            go(y) { // obey smooth toggle for bar actions
                if (SMOOTH_BAR) this.smoothTo(y);
                else this.to(y);
            }

            // Idle/Active state
            awake() {
                clearTimeout(this._idleTO);
                this._idleTO = 0;
                this.el.classList.remove('idle');
            }
            scheduleIdle() {
                if (!this.el) return;
                if (this.isHover || this.el.classList.contains('drag')) return;
                clearTimeout(this._idleTO);
                this._idleTO = setTimeout(() => {
                    if (this.el && !this.isHover && !this.el.classList.contains('drag')) {
                        this.el.classList.add('idle');
                    }
                }, IDLE_DELAY);
            }

            bind() {
                // Track click -> jump
                this.el.addEventListener('click', (e) => {
                    if (e.target !== this.el) return;
                    // any click is activity
                    this.awake();
                    this.scheduleIdle();

                    const rect = this.el.getBoundingClientRect();
                    const th = this.thumb.offsetHeight, space = rect.height - th;
                    if (space <= 0) return;
                    const p = clamp((e.clientY - rect.top - th / 2) / space, 0, 1);
                    const m = this.m(); this.go(m.max * p);
                });

                // Touch tap on track -> jump
                this.el.addEventListener('touchstart', (e) => {
                    if (e.target !== this.el) return;
                    const t = e.touches && e.touches[0]; if (!t) return;
                    this.awake();
                    this.scheduleIdle();
                    const rect = this.el.getBoundingClientRect();
                    const th = this.thumb.offsetHeight, space = rect.height - th; if (space <= 0) return;
                    const p = clamp((t.clientY - rect.top - th / 2) / space, 0, 1);
                    const m = this.m(); this.go(m.max * p);
                }, { passive: true });

                // Hover state for idle logic
                this.el.addEventListener('mouseenter', () => { this.isHover = true; this.awake(); });
                this.el.addEventListener('mouseleave', () => { this.isHover = false; this.scheduleIdle(); });

                // Drag thumb (always direct)
                this.thumb.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return; e.preventDefault();
                    const startY = e.clientY, start = this.m().scroll;
                    this.el.classList.add('drag');
                    this.awake(); // expand immediately
                    this.cancelSmooth();
                    const mm = (ev) => {
                        ev.preventDefault();
                        const m = this.m(), rect = this.el.getBoundingClientRect();
                        const th = this.thumb.offsetHeight, space = rect.height - th; if (space <= 0) return;
                        this.to(start + ((ev.clientY - startY) / space) * m.max);
                    };
                    const mu = () => {
                        this.el.classList.remove('drag');
                        document.removeEventListener('mousemove', mm);
                        document.removeEventListener('mouseup', mu);
                        this.scheduleIdle(); // collapse after delay when drag ends
                    };
                    document.addEventListener('mousemove', mm);
                    document.addEventListener('mouseup', mu);
                });

                // Touch drag on thumb
                this.thumb.addEventListener('touchstart', (e) => {
                    const t = e.touches && e.touches[0]; if (!t) return;
                    const startY = t.clientY, start = this.m().scroll;
                    this.el.classList.add('drag');
                    this.awake();
                    this.cancelSmooth();
                    const mm = (ev) => {
                        const tt = ev.touches && ev.touches[0]; if (!tt) return;
                        const m = this.m(), rect = this.el.getBoundingClientRect();
                        const th = this.thumb.offsetHeight, space = rect.height - th; if (space <= 0) return;
                        this.to(start + ((tt.clientY - startY) / space) * m.max);
                        ev.preventDefault();
                    };
                    const mu = () => {
                        this.el.classList.remove('drag');
                        document.removeEventListener('touchmove', mm);
                        document.removeEventListener('touchend', mu);
                        document.removeEventListener('touchcancel', mu);
                        this.scheduleIdle();
                    };
                    document.addEventListener('touchmove', mm, { passive: false });
                    document.addEventListener('touchend', mu);
                    document.addEventListener('touchcancel', mu);
                });

                (this.r ? window : this.c).addEventListener('scroll', this.onScroll, { passive: true });
            }

            m() {
                if (this.r) {
                    const rootEl = $root();
                    const scroll = window.pageYOffset || rootEl.scrollTop;
                    const vh = window.innerHeight;
                    const sh = Math.max(rootEl.scrollHeight || 0, document.body ? document.body.scrollHeight : 0, vh);
                    return { scroll, vh, sh, max: Math.max(0, sh - vh) };
                }
                const scroll = this.c.scrollTop, vh = this.c.clientHeight, sh = this.c.scrollHeight;
                return { scroll, vh, sh, max: Math.max(0, sh - vh) };
            }

            update() {
                if (!this.el) return;
                const m = this.m();
                let vis = m.max > 0 ? 1 : 0;
                let top = 0, h = window.innerHeight, right = 0;

                if (!this.r) {
                    const rect = this.c.getBoundingClientRect();
                    if (rect.height <= 0 || rect.bottom <= 0 || rect.top >= window.innerHeight) vis = 0;
                    else {
                        top = Math.max(0, rect.top);
                        h = Math.min(rect.bottom, window.innerHeight) - top;
                        right = Math.max(0, window.innerWidth - rect.right);
                    }
                }

                this.el.style.opacity = String(vis);
                this.el.style.pointerEvents = vis ? 'auto' : 'none';
                this.el.style.top = top + 'px';
                this.el.style.height = h + 'px';
                this.el.style.right = right + 'px';
                if (!vis) return;

                const barH = this.el.offsetHeight || h;
                const th = Math.max(MIN_THUMB, Math.min(barH * RATIO, barH * (m.vh / Math.max(m.sh, 1))));
                const p = m.max ? (m.scroll / m.max) : 0;
                const y = (barH - th) * p;
                this.thumb.style.height = Math.round(th) + 'px';
                this.thumb.style.transform = `translateY(${Math.round(y)}px)`;
            }

            req() { cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(() => this.update()); }

            destroy() {
                this.cancelSmooth();
                clearTimeout(this._idleTO);
                cancelAnimationFrame(this.raf);
                (this.r ? window : this.c).removeEventListener('scroll', this.onScroll);
                this.el?.remove();
                BAR_CONTAINER.delete(this.el);
                if (!this.r && this.c && this.c.classList) this.c.classList.remove('bs-hide-v');
                this.el = this.thumb = this.c = null;
            }
        }

        // Manager (tracks the active scroll container)
        class Manager {
            constructor() {
                this.map = new Map();
                this.rootInst = this.get($root());
                this.active = this.rootInst;
                this._mo = null;
                this._handlers = null;
                this.bind();
                this.observe();
            }
            get(c) { if (!this.map.has(c)) this.map.set(c, new SB(c)); return this.map.get(c); }
            setActiveFrom(evtOrTarget) {
                const target = evtOrTarget?.target || evtOrTarget;
                if (target?.closest?.('.bs-bar')) return;
                let path = evtOrTarget?.composedPath?.();
                if (Array.isArray(path) && path.length) {
                    for (const el of path) {
                        if (!el || !el.nodeType || el === document || el === window) continue;
                        if (typeof el.closest === 'function' && el.closest('.bs-bar')) continue;
                        if (isScrollable(el)) { this.active = this.get(el); return; }
                        const rn = el.getRootNode?.();
                        if (rn && rn.host && isScrollable(rn.host)) { this.active = this.get(rn.host); return; }
                    }
                }
                const c = findScrollable(target);
                if (c) this.active = this.get(c);
            }
            bind() {
                const onEvt = (e) => this.setActiveFrom(e);
                const onResize = () => this.updateAll();
                this._handlers = { onEvt, onResize };
                document.addEventListener('mouseover', onEvt);
                document.addEventListener('wheel', onEvt, { passive: true });
                document.addEventListener('focusin', onEvt);
                window.addEventListener('resize', onResize, { passive: true });
            }
            updateAll() { this.map.forEach(i => i.req()); }
            clean() {
                this.map.forEach((inst, el) => {
                    if (el !== $root() && !el?.isConnected) { inst.destroy(); this.map.delete(el); }
                });
            }
            observe() {
                this._moScheduled = false;
                const schedule = () => {
                    if (this._moScheduled) return;
                    this._moScheduled = true;
                    requestAnimationFrame(() => { this._moScheduled = false; this.clean(); this.updateAll(); });
                };
                this._mo = new MutationObserver(schedule);
                this._mo.observe(document.documentElement, { childList: true, subtree: true });
            }
            destroy() {
                this.map.forEach(inst => inst.destroy());
                this.map.clear();
                if (this._mo) { this._mo.disconnect(); this._mo = null; }
                if (this._handlers) {
                    document.removeEventListener('mouseover', this._handlers.onEvt);
                    document.removeEventListener('wheel', this._handlers.onEvt);
                    document.removeEventListener('focusin', this._handlers.onEvt);
                    window.removeEventListener('resize', this._handlers.onResize);
                    this._handlers = null;
                }
                this.active = this.rootInst = null;
            }
        }

        // Neon Glow Theme
        const injectStyles = () => {
            const css = `
    :root{
      /* Neon Glow theme (hardcoded) */
      --bs-track: rgba(0,0,0,0.15);
      --bs-thumb: linear-gradient(180deg,#00f5ff,#0ea5e9);
      --bs-thumb-hover: linear-gradient(180deg,#22d3ee,#06b6d4);
      --bs-radius: 8px;
      --bs-width: 9px;
      --bs-glow: 0 0 12px rgba(6,182,212,.6);
      /* Idle indicator tuning */
      --bs-indicator-width: 3px;
      --bs-thin-thumb: 2px;
      --bs-idle-opacity: .6;
    }
    html::-webkit-scrollbar:vertical, body::-webkit-scrollbar:vertical, .bs-hide-v::-webkit-scrollbar:vertical { width:0!important; display:none!important; }
    html, body { scrollbar-width: none!important; -ms-overflow-style: none!important; }
    .bs-hide-v { scrollbar-width: none!important; -ms-overflow-style: none!important; }

    .bs-bar{
      position:fixed; right:0; top:0; width:var(--bs-width); height:100vh;
      background:var(--bs-track);
      border-radius:var(--bs-radius) 0 0 var(--bs-radius);
      z-index:${Z}; transition:opacity .2s,width .15s, background .15s;
      opacity:0; pointer-events:none;
    }
    .bs-bar:hover{ width:calc(var(--bs-width) + 3px); }
    .bs-thumb{
      position:absolute; left:0; right:0; top:0;
      min-height:${MIN_THUMB}px;
      background:var(--bs-thumb);
      border-radius:var(--bs-radius);
      box-shadow:var(--bs-glow);
      cursor:grab; will-change:transform;
      transition:background .15s, box-shadow .2s, opacity .15s;
      touch-action: none;
    }
    .bs-bar:hover .bs-thumb{ background:var(--bs-thumb-hover); box-shadow:var(--bs-glow), 0 2px 8px rgba(0,0,0,.25); }
    .bs-bar.drag .bs-thumb{ cursor:grabbing; }

    /* Idle collapse to thin indicator */
    .bs-bar.idle{
      width: var(--bs-indicator-width);
      background: transparent;
    }
    .bs-bar.idle .bs-thumb{
      opacity: var(--bs-idle-opacity);
      box-shadow: none;
      background: var(--bs-thumb);
      clip-path: inset(0 calc(50% - (var(--bs-thin-thumb) / 2)) 0 calc(50% - (var(--bs-thin-thumb) / 2)));
    }

    @media (prefers-reduced-motion: reduce){
      .bs-bar, .bs-thumb { transition:none!important; }
    }
  `;
            styleEls.push(addStyle(css));
        };

        const start = () => {
            injectStyles();
            SMOOTH_BAR = toBool(Store.get(OPT.smooth.key, '0'));
            MGR = new Manager();
        };

        // Fallback-to-native guarantee: any scrollbar failure removes every
        // injected style and instance, restoring the page's native scrollbar.
        const failNative = (e) => {
            console.error(DEBUG_TAG + ' Neon Scrollbar init failed, falling back to native scrollbar:', e);
            state.scrollbar = false;
            disable();
        };

        const enable = () => {
            if (active) return;
            active = true;
            try {
                if (document.body) start();
                else if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        if (!active) return;
                        try { start(); } catch (e) { failNative(e); }
                    }, { once: true });
                } else {
                    setTimeout(() => {
                        if (!active) return;
                        try { start(); } catch (e) { failNative(e); }
                    }, 30);
                }
            } catch (e) { failNative(e); }
        };

        const disable = () => {
            const running = active || MGR !== null || styleEls.length > 0;
            if (!running) return;
            active = false;
            try {
                if (MGR) { MGR.destroy(); MGR = null; }
            } catch (e) {
                console.error(DEBUG_TAG + ' scrollbar manager destroy error:', e);
            }
            styleEls.forEach(st => st.remove());
            styleEls = [];
        };

        const setSmooth = (on) => {
            SMOOTH_BAR = !!on;
            Store.set(OPT.smooth.key, SMOOTH_BAR ? '1' : '0');
        };

        const barContainer = (el) => (el ? (BAR_CONTAINER.get(el) || null) : null);

        return { enable, disable, setSmooth, barContainer };
    })();

    // ====================================================================
    // MODULE: Right-Click Scrollbar Navigation
    // Global and independent of the Neon Scrollbar and operational by default.
    // Right-click in the TOP half of the scrollbar zone -> scroll to top;
    // right-click in the BOTTOM half -> scroll to bottom.
    // ====================================================================
    const RightClickNav = (() => {
        let active = false;
        let scrollBarWidth = 15;

        // Get width of page's right-hand scrollbar（default 15）
        const getScrollBarWidth = () => {
            const div = document.createElement('div');
            div.style.overflow = 'scroll';   // Force scrollbar
            div.style.visibility = 'hidden'; // Do not display
            div.style.width = '100px';
            div.style.height = '100px';
            document.body.appendChild(div);

            const innerDiv = document.createElement('div');
            innerDiv.style.width = '100%';
            innerDiv.style.height = '100%';
            div.appendChild(innerDiv);

            const width = div.offsetWidth - innerDiv.offsetWidth;
            div.parentNode.removeChild(div);
            return width;
        };

        // Scroll a window or element to the requested extreme.
        const scrollToEdge = (el, toTop) => {
            if (!el) return;
            if (toTop) { el.scrollTo(0, 0); return; }
            let max;
            if (el === PAGE_WIN) {
                const r = $root();
                max = Math.max(r ? r.scrollHeight : 0, document.body ? document.body.scrollHeight : 0);
            } else {
                max = el.scrollHeight;
            }
            el.scrollTo(0, max); // browsers clamp overshoot to the real max
        };

        const onContextMenu = (e) => {
            // x-coordinate of right-click position is greater then（webpage width - scrollbar width - a 10-pixel margin）
            const isScrollbar = e.clientX > window.innerWidth - scrollBarWidth - 10;
            if (!isScrollbar) return;

            // Multidirectional: top half of the viewport -> top, bottom -> bottom.
            const toTop = e.clientY < window.innerHeight / 2;
            const t = e.target;

            if (t && t.tagName === 'HTML') {
                // Target HTML means the click landed on the scrollbar itself.
                scrollToEdge(PAGE_WIN, toTop);
            } else if (t && typeof t.closest === 'function' && t.closest('.bs-bar')) {
                // Click on the custom overlay bar: resolve its scroll
                // container (root or nested) and navigate that container.
                const bar = t.closest('.bs-bar');
                const container = Scrollbar.barContainer(bar);
                if (container === $root()) scrollToEdge(PAGE_WIN, toTop);
                else if (container) scrollToEdge(container, toTop);
            } else if (t && t.tagName === 'BODY') {
                // Supresses menu only. Right of viewport but target is BODY: the
                // click hit the page background just left of the scrollbar. 
            } else if (t && typeof t.scrollTo === 'function') {
                // Nested scrollable element: the click passed through its own
                // scrollbar onto the scroll container; navigate that element.
                scrollToEdge(t, toTop);
            }
            e.preventDefault();  // supress context menu opening
            e.stopPropagation(); // stop bubbling up further
        };

        const enable = () => {
            if (active) return;
            active = true;
            document.addEventListener('contextmenu', onContextMenu);
            whenReady(() => {
                if (!active) return;
                try {
                    scrollBarWidth = getScrollBarWidth() || 15;
                } catch (e) {
                    scrollBarWidth = 15;
                    console.debug(DEBUG_TAG + ' scrollbar width probe failed, using default:', e);
                }
            });
        };

        const disable = () => {
            if (!active) return;
            document.removeEventListener('contextmenu', onContextMenu);
            active = false;
        };

        return { enable, disable };
    })();

    // ====================================================================
    // CONTEXT MENU OPTIONS (GM menu commands)
    // ====================================================================
    const Menu = (() => {
        const canRegister = (typeof GM_registerMenuCommand === 'function');
        const canUnregister = (typeof GM_unregisterMenuCommand === 'function');
        const commandIds = [];
        let registeredOnce = false;

        const MENU_ITEMS = [
            { key: 'always',    label: () => 'Always New Window: ' + (state.always ? 'ON' : 'OFF') },
            { key: 'force',     label: () => 'Force Links (window.open): ' + (state.force ? 'ON' : 'OFF') },
            { key: 'expand',    label: () => 'Expand Everything: ' + (state.expand ? 'ON' : 'OFF') },
            { key: 'hide',      label: () => 'Hide Banners: ' + (state.hide ? 'ON' : 'OFF') },
            { key: 'scrollbar', label: () => 'Neon Scrollbar: ' + (state.scrollbar ? 'ON' : 'OFF') },
            { key: 'smooth',    label: () => 'Scrollbar Smooth Jumps: ' + (state.smooth ? 'ON' : 'OFF') },
            { key: 'rcnav',     label: () => 'Right-Click Scrollbar Nav: ' + (state.rcnav ? 'ON' : 'OFF') },
            { key: 'reset',     label: () => 'Reset All Options' }
        ];

        const dispatch = (key, on) => {
            switch (key) {
                case 'always': if (on) AlwaysNewWindow.enable(); else AlwaysNewWindow.disable(); break;
                case 'force': if (on) ForceLinks.enable(); else ForceLinks.disable(); break;
                case 'expand': if (on) ExpandEverything.enable(); else ExpandEverything.disable(); break;
                case 'hide': if (on) HideBanner.enable(); else HideBanner.disable(); break;
                case 'scrollbar': if (on) Scrollbar.enable(); else Scrollbar.disable(); break;
                case 'smooth': Scrollbar.setSmooth(on); break;
                case 'rcnav': if (on) RightClickNav.enable(); else RightClickNav.disable(); break;
            }
        };

        const applyOption = (key, on) => {
            state[key] = !!on;
            Store.set(OPT[key].key, state[key] ? '1' : '0');
            dispatch(key, state[key]);
            refresh();
        };

        const onItemClick = (item) => () => {
            if (item.key === 'reset') {
                for (const k of Object.keys(OPT)) applyOption(k, OPT[k].def);
            } else {
                applyOption(item.key, !state[item.key]);
            }
        };

        function refresh() {
            if (!canRegister) return;
            if (!canUnregister) {
                // Without unregister support, register once; state still
                // toggles correctly, only the label text stays frozen.
                if (registeredOnce) return;
                registeredOnce = true;
                MENU_ITEMS.forEach(item => {
                    try { GM_registerMenuCommand(item.label(), onItemClick(item)); } catch (e) {
                        console.debug(DEBUG_TAG + ' menu command registration failed:', e);
                    }
                });
                return;
            }
            // Full refresh pattern: drop old commands and re-register with
            // fresh labels (unregister prevents duplicate menu entries).
            commandIds.forEach(id => {
                try { GM_unregisterMenuCommand(id); } catch (e) {
                    console.debug(DEBUG_TAG + ' menu command unregistration failed:', e);
                }
            });
            commandIds.length = 0;
            MENU_ITEMS.forEach(item => {
                try {
                    const id = GM_registerMenuCommand(item.label(), onItemClick(item));
                    if (id !== undefined) commandIds.push(id);
                } catch (e) {
                    console.debug(DEBUG_TAG + ' menu command registration failed:', e);
                }
            });
        }

        return { refresh };
    })();

    // ====================================================================
    // INIT
    // ====================================================================
    const boot = () => {
        if (state.always) safe('always', () => AlwaysNewWindow.enable());
        if (state.force) safe('force', () => ForceLinks.enable());
        if (state.expand) safe('expand', () => ExpandEverything.enable());
        if (state.hide) safe('hide', () => HideBanner.enable());
        if (state.scrollbar) safe('scrollbar', () => Scrollbar.enable());
        if (state.rcnav) safe('rcnav', () => RightClickNav.enable());
        Menu.refresh();
    };
    boot();
})();
