/* ═══════════════════════════════════════════════════════════════════════════
 * HostWarp — consolidated per-host enhancer (superset of 6 legacy scripts)
 * ----------------------------------------------------------------------------
 * Absorbs, with zero feature loss (GUP superset gate):
 *   • HDImgsOnly v1.1              → imageHosts module (selectors preserved)
 *   • MegaEmbedRedirector v1.0.0   → mega module (regex + autoplay kept)
 *   • PlanetsuzyMobileSkinRedirect v1.2.0 → planetsuzy module
 *   • Telegram Web Redirect v1.0.0 → telegram module (glass CSS preserved)
 *   • Searxng Sticky Settings v1.1 → searxng module (PLACEHOLDER fixed into
 *     a real persisted setting — the legacy constant was literally
 *     "PLACEHOLDER", so the module never worked out of the box)
 *   • Gemini Answer Now v1.0       → gemini module (invalid CSS selectors
 *     `button[contains("Stop")]` / `div:contains(...)` removed — they threw
 *     SyntaxError on every invocation; updateURL no longer points at
 *     Blob2URL.user.js)
 *
 * New capability (additive): 3lectric-Glass settings console; per-module
 * enable/disable persisted through the kernel store; module registry
 * surfaces in the manager menu.
 * ═══════════════════════════════════════════════════════════════════════ */

const store = Ψ.store.ns('hostwarp');
const { $, $$, $new, waitFor } = Ψ.core;

const MODULES = [
    { key: 'imagehosts', label: 'Image-host interstitial bypass', dflt: true,
      hint: 'imagetwist, imgspice, turboimagehost, acidimg, imx.to, pixhost, imagebam, imgbox, kropic, vipr.im, imagevenue' },
    { key: 'mega', label: 'MEGA embed redirect + autoplay', dflt: true,
      hint: 'mega.nz/file → /embed with autoplay + fullscreen' },
    { key: 'planetsuzy', label: 'PlanetSuzy mobile skin', dflt: true,
      hint: 'Forces styleid=4 (faster skin)' },
    { key: 'telegram', label: 't.me "Open in Web" button', dflt: true,
      hint: 'Glass button + hides desktop-only banner' },
    { key: 'searxng', label: 'SearXNG sticky preferences', dflt: true,
      hint: 'Applies your preferences hash on every visit' },
    { key: 'gemini', label: 'Gemini Answer Now', dflt: true,
      hint: 'Restores immediate-response control (Ctrl+Shift+A)' },
];

const enabled = (key) => store.get(`mod:${key}`, MODULES.find((m) => m.key === key).dflt);

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: imagehosts — superset of HDImgsOnly v1.1
 * Every selector and click-through flow preserved verbatim; the 100 ms
 * polling `waitForElement` is replaced by the kernel's MutationObserver-
 * based `waitFor` (identical 3 s budget, zero idle CPU).
 * ═══════════════════════════════════════════════════════════════════════ */

/** Redirect to the raw image behind an interstitial selector. */
function redirectToImage(selector) {
    const img = document.querySelector(selector);
    if (img && typeof img.src === 'string' && img.src.length > 0) {
        window.location.href = img.src;
        return true;
    }
    return false;
}

const IMAGE_HOST_HANDLERS = [
    ['imagetwist.com', () => {
        if (redirectToImage('.pic')) return;
        const continueButton = $$('a').find((el) => el.innerText === 'Continue to your image');
        if (continueButton) continueButton.click();
    }],
    ['imgspice.com', () => { redirectToImage('#imgpreview'); }],
    ['turboimagehost.com', () => { redirectToImage('.uImage'); }],
    ['acidimg.cc', async () => {
        const submitButton = $('input[type=\'submit\']');
        if (submitButton) {
            submitButton.click();
            try {
                await waitFor('.centred', { timeout: 3000 });
                redirectToImage('.centred');
            } catch (error) {
                console.error('Ψ-HostWarp:', error.message);
            }
        } else {
            redirectToImage('.centred');
        }
    }],
    ['imx.to', async () => {
        const blueButton = $('.button') || $('#continuebutton');
        if (blueButton) {
            blueButton.click();
            try {
                await waitFor('.centred', { timeout: 3000 });
                redirectToImage('.centred');
            } catch (error) {
                console.error('Ψ-HostWarp:', error.message);
            }
        } else {
            redirectToImage('.centred');
        }
    }],
    ['pixhost.to', () => { redirectToImage('img#image'); }],
    ['imagebam.com', () => {
        if (redirectToImage('img.main-image')) return;
        const anchor = $('#continue > a');
        if (anchor) anchor.click();
    }],
    ['imgbox.com', () => { redirectToImage('img.image-content'); }],
    ['kropic.com', () => {
        if (redirectToImage('img.pic')) return;
        const continueButton = $$('input[type=\'submit\']').find((el) => el.value === 'Continue to image...');
        if (continueButton) continueButton.click();
    }],
    ['vipr.im', () => { redirectToImage('.img-responsive'); }],
    ['imagevenue.com', () => { redirectToImage('#main-image'); }],
];

for (const [domain, handler] of IMAGE_HOST_HANDLERS) {
    Ψ.hosts.on(domain, () => {
        if (!enabled('imagehosts')) return;
        handler();
    }, { id: `imagehosts:${domain}`, script: 'HostWarp' });
}

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: mega — superset of MegaEmbedRedirector v1.0.0
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hosts.on('mega.nz', () => {
    if (!enabled('mega')) return;

    /* Redirect standard file URLs to embed URLs (regex preserved). */
    const url = window.location.href;
    const fileRegex = /^https:\/\/mega\.nz\/file\/([a-zA-Z0-9_-]+)(#[\w-]+)?$/;
    const match = url.match(fileRegex);
    if (match) {
        window.location.replace(`https://mega.nz/embed/${match[1]}${match[2] || ''}`);
        return;
    }

    if (!url.startsWith('https://mega.nz/embed/')) return;

    /* Enhance playback on embed pages: autoplay + cross-vendor fullscreen. */
    const enhance = () => {
        const video = document.querySelector('video');
        if (!video) return false;
        video.addEventListener('loadedmetadata', () => {
            const playPromise = video.play();
            if (playPromise === undefined) return;
            playPromise.then(() => {
                if (video.requestFullscreen) video.requestFullscreen();
                else if (video.mozRequestFullScreen) video.mozRequestFullScreen();
                else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
                else if (video.msRequestFullscreen) video.msRequestFullscreen();
            }).catch(() => { /* autoplay needs a gesture — acceptable */ });
        });
        return true;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!enhance()) waitFor('video', { timeout: 15000 }).then(enhance, () => {});
        }, { once: true });
    } else if (!enhance()) {
        waitFor('video', { timeout: 15000 }).then(enhance, () => {});
    }
}, { id: 'mega', script: 'HostWarp' });

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: planetsuzy — superset of PlanetsuzyMobileSkinRedirect v1.2.0
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hosts.on('planetsuzy.org', () => {
    if (!enabled('planetsuzy')) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('styleid') !== '4') {
        url.searchParams.set('styleid', '4');
        window.location.replace(url.toString());
    }
}, { id: 'planetsuzy', script: 'HostWarp' });

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: telegram — superset of Telegram Web Redirect v1.0.0
 * The legacy glass button CSS is preserved (it predates the kernel and is
 * already 3lectric-Glass compliant); the channel-id parser, the fragment
 * encoding bug-fix, and the observer flow are carried over verbatim.
 * ═══════════════════════════════════════════════════════════════════════ */

const TELEGRAM_CSS = `
.tg4-web-action { margin-top: 12px; }
.tg4-web-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.55rem 1.4rem; gap: 8px;
    font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; font-weight: 500;
    letter-spacing: 0.05em; text-transform: uppercase; text-decoration: none; cursor: pointer;
    background: rgba(10, 19, 26, 0.25);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 8px 32px 0 rgba(0, 229, 255, 0.15);
    color: rgba(0,229,255,0.7);
    transition: all 300ms ease-in-out;
}
@supports not (backdrop-filter: blur(1px)) { .tg4-web-btn { background: rgba(10, 19, 26, 0.92); } }
.tg4-web-btn:hover {
    color: #00E5FF; border-color: rgba(0, 229, 255, 0.5);
    background-color: rgba(0, 229, 255, 0.05);
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.4), 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
.tg4-web-btn:active {
    color: #67E8F9; background-color: rgba(0, 229, 255, 0.2);
    border-color: #00E5FF; box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
}
.tg4-web-btn:focus-visible { outline: 2px solid #00E5FF; outline-offset: 2px; }
.tg4-web-btn svg { width: 16px; height: 16px; flex-shrink: 0; stroke: currentColor; fill: none;
    stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
`;

function telegramChannelId(url) {
    let decoded;
    try { decoded = decodeURIComponent(url); } catch (e) { decoded = url; }
    const m = decoded.match(/t\.me\/(?:s\/)?(\+?[^&?/]+)/);
    return m ? m[1] : null;
}

Ψ.hosts.on('t.me', () => {
    if (!enabled('telegram')) return;

    Ψ.glass.injectStyles();
    const style = $new('style');
    style.textContent = TELEGRAM_CSS;
    (document.head || document.documentElement).append(style);

    const channelId = telegramChannelId(window.location.href);
    if (!channelId) return;

    const injectWebButton = () => {
        const desktopCta = document.querySelector('.tgme_page_action');
        if (!desktopCta) return false;
        if (document.querySelector('.tg4-web-action')) return true;

        const wrapper = $new('div', { class: 'tgme_page_action tg4-web-action' });
        /* Fragment content is never percent-decoded by Telegram Web's router
         * (legacy bug-fix preserved): pass channelId as-is after the anchor. */
        const anchor = channelId.startsWith('+')
            ? `https://web.telegram.org/a/#${channelId}`
            : `https://web.telegram.org/a/#@${channelId}`;
        const link = $new('a', {
            class: 'tg4-web-btn', href: anchor, target: '_blank',
            rel: 'noopener noreferrer', 'aria-label': 'Open channel in Telegram Web',
        });
        const NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '9');
        const p1 = document.createElementNS(NS, 'path');
        p1.setAttribute('d', 'M12 3 C9 7 9 17 12 21 M12 3 C15 7 15 17 12 21');
        const p2 = document.createElementNS(NS, 'path');
        p2.setAttribute('d', 'M3 12 h18');
        const p3 = document.createElementNS(NS, 'path');
        p3.setAttribute('d', 'M4.5 7.5 h15 M4.5 16.5 h15');
        svg.append(circle, p1, p2, p3);
        link.append(svg, $new('span', null, 'Open in Web'));
        wrapper.append(link);
        desktopCta.insertAdjacentElement('afterend', wrapper);

        const banner = document.querySelector('.tgme_page_context_link_wrap');
        if (banner) banner.style.display = 'none';
        return true;
    };

    if (injectWebButton()) return;
    waitFor('.tgme_page_action', { timeout: 15000 }).then(injectWebButton, () => {});
}, { id: 'telegram', script: 'HostWarp' });

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: searxng — superset of Searxng Sticky Settings v1.1
 * The legacy script shipped `const settingsHash = "PLACEHOLDER"` — a hard
 * gap. HostWarp promotes both the host pattern and the preferences hash to
 * first-class persisted settings, editable from the glass console.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hosts.on(window.location.hostname, () => {
    if (!enabled('searxng')) return;
    const patternSrc = store.get('searxng:pattern', String(/^http:\/\/192\.168\.1\.1(:\d+)?\/?$/));
    const hash = store.get('searxng:hash', '');
    if (!hash) return; // nothing configured — module dormant
    let pattern;
    try {
        pattern = new RegExp(patternSrc);
    } catch (e) {
        console.debug('[HostWarp] searxng pattern invalid:', e.message);
        return;
    }
    if (pattern.test(window.location.origin + '/') &&
        !window.location.hash.startsWith('#/preferences?preferences=')) {
        window.location.hash = hash;
        window.location.reload();
    }
}, { id: 'searxng', script: 'HostWarp' });

/* ═══════════════════════════════════════════════════════════════════════
 * MODULE: gemini — superset of Gemini Answer Now v1.0
 * Fixes carried in: (1) `button[contains("Stop")]` and `div:contains(...)`
 * are invalid CSS that threw SyntaxError on every invocation — replaced
 * with valid selectors only; (2) dead `thinking` selector removed;
 * (3) hotkey now runs through the collision-aware registry.
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.hosts.on('gemini.google.com', () => {
    if (!enabled('gemini')) return;

    const GEMINI_SELECTORS = {
        input: 'textarea[placeholder*="Ask Gemini"], div[role="textbox"], [data-placeholder*="Ask"]',
        sendButton: 'button[aria-label*="Send"], button[data-test-id*="send"]',
        stopButton: 'button[aria-label*="Stop"], button svg path[d*="pause"]',
    };

    let answerNowBtn = null;

    const forceImmediateAnswer = () => {
        const input = document.querySelector(GEMINI_SELECTORS.input);
        if (!input) return;

        const promptText = (input.value || '').trim();
        if (promptText) {
            const forceText = '\n\nAnswer immediately. No thinking steps. Output only the final answer right now.';
            if (!promptText.endsWith(forceText)) input.value = promptText + forceText;
        }

        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            for (const btn of document.querySelectorAll(GEMINI_SELECTORS.sendButton)) {
                if (btn.offsetParent !== null) btn.click();
            }
        }, 50);

        setTimeout(() => {
            for (const btn of document.querySelectorAll(GEMINI_SELECTORS.stopButton)) {
                btn.click();
            }
        }, 150);

        Ψ.glass.toast('⚡ Answer Now — immediate response forced', { type: 'success' });
    };

    const createAnswerNowButton = () => {
        if (answerNowBtn && answerNowBtn.isConnected) return;
        const container = document.querySelector('main') || document.body;
        if (!container) return;

        Ψ.glass.injectStyles();
        answerNowBtn = $new('button', { class: 'a4-btn', id: 'a4-answer-now-btn' }, '⚡ Answer Now');
        Object.assign(answerNowBtn.style, {
            position: 'fixed', bottom: '24px', right: '120px', zIndex: '2147483647',
        });
        answerNowBtn.classList.add('a4-scope');
        answerNowBtn.addEventListener('click', forceImmediateAnswer);
        container.append(answerNowBtn);
    };

    /* Ctrl/Cmd+Shift+A — registered through the collision-aware registry. */
    Ψ.hotkeys.register('Ctrl+Shift+A', forceImmediateAnswer, {
        id: 'gemini-answer-now', script: 'HostWarp',
        allowInEditable: true, // the whole point is firing from the prompt box
    });

    const stopWatch = Ψ.core.watchDOM(document.documentElement, createAnswerNowButton, { debounceMs: 400 });
    window.addEventListener('beforeunload', stopWatch, { once: true });
    setTimeout(createAnswerNowButton, 800);
    setTimeout(createAnswerNowButton, 2500);
}, { id: 'gemini', script: 'HostWarp' });

/* ═══════════════════════════════════════════════════════════════════════
 * Settings console (3lectric-Glass) + manager menu
 * ═══════════════════════════════════════════════════════════════════════ */

function openSettings() {
    /* v1.1.0: console opens are fail-loud now. The original launch shipped
     * a dead console (kernel glass.js called Ψ.store.getJson on the store
     * FACTORY — TypeError swallowed by the menu dispatcher, nothing opened,
     * nothing logged). Any future failure surfaces as a glass toast +
     * console.error instead of silence. */
    try {
        Ψ.glass.injectStyles();
        const hud = Ψ.glass.hud({
            id: 'hostwarp-settings',
            title: 'HOSTWARP',
            subtitle: 'per-host warp drive — ' + Ψ.brand.SUITE,
            width: 420, height: 380,
            tabs: [
            {
                id: 'modules', label: 'MODULES',
                render: (contentEl) => {
                    const schema = MODULES.map((m) => ({
                        key: `mod:${m.key}`, type: 'bool', label: m.label, default: m.dflt, hint: m.hint,
                    }));
                    Ψ.glass.settingsConsole(contentEl, 'hostwarp', schema, (key) => {
                        Ψ.glass.toast(`${key.replace('mod:', '')} — reload page to apply`, { type: 'info' });
                    });
                },
            },
            {
                id: 'searxng', label: 'SEARXNG',
                render: (contentEl) => {
                    Ψ.glass.settingsConsole(contentEl, 'hostwarp', [
                        { key: 'searxng:pattern', type: 'text', label: 'Host pattern (RegExp source)',
                          default: String(/^http:\/\/192\.168\.1\.1(:\d+)?\/?$/),
                          hint: 'Tested against location.origin + "/"' },
                        { key: 'searxng:hash', type: 'text', label: 'Preferences hash',
                          default: '', hint: 'e.g. #/preferences?preferences=…' },
                    ], () => Ψ.glass.toast('SearXNG settings saved', { type: 'success' }));
                },
            },
            {
                id: 'about', label: 'Ψ',
                render: (contentEl) => {
                    contentEl.append($new('div', { class: 'a4-panel' },
                        $new('p', { style: { fontSize: '11px', lineHeight: '1.6' } },
                            'HostWarp consolidates six legacy micro-tools into one engine. ' +
                            'Active modules on this page: ' + (Ψ.hosts.resolve()
                                ? 'matched — ' + Ψ.hosts.listDomains().filter((d) => location.hostname.endsWith(d)).join(', ')
                                : 'none') +
                            '.')));
                },
            },
        ],
        });
        hud.show();
    } catch (e) {
        console.error('[Ψ HostWarp] settings console failed:', e);
        try { Ψ.glass.toast(`Settings console error: ${e && e.message ? e.message : e}`, { type: 'error' }); }
        catch (_) { alert(`Ψ HostWarp — settings console error:\n${e && e.message ? e.message : e}`); }
    }
}

if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand('Ψ HostWarp — settings console', openSettings);
}

/* Boot: dispatch at document-start, retry once at DOMContentLoaded for
 * late-registered handlers. Ψ.hosts.run() is idempotent per handler. */
Ψ.hosts.run();
document.addEventListener('DOMContentLoaded', () => Ψ.hosts.run(), { once: true });
