// ==UserScript==
// @name         4ndr0tools - Counter-survillance
// @namespace    https://github.com/4ndr0666/userscripts
// @version      4.0.0
// @author       4ndr0666 & Rob W & Giwayume
// @descriptsion Part of 4ndr0tools: counter-surveillance toolkit integrates deep DOM sinkholing, network nullification (WebRTC/Fetch/XHR), canvas blinding, anti-user patterns, frustrating UI constraints and aggressive URL sanitization (Google/ICC/Aliyun)
// @license      UNLICENSED - RED TEAM USE ONLY
// @match        *://*/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20PLACEHOLDER.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20PLACEHOLDER.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==


(function () {
    'use strict';

    // =========================================================================
    // 1. CORE UTILITIES & HEX CORRUPTION LAYER
    // =========================================================================

    const domain = window.location.hostname;
    const { setInterval, setTimeout, clearInterval } = window;

    const DEADBEEF = () => {
        return '0xDEADBEEF-' + Math.random().toString(16).slice(2, 12).toUpperCase();
    };

    const MYCELIUM = {
        shroud: function(target, prop, fakeValue) {
            if (target && prop in target) {
                try {
                    Object.defineProperty(target, prop, {
                        get: () => typeof fakeValue === 'function' ? fakeValue() : fakeValue,
                        configurable: false,
                        enumerable: true
                    });
                } catch (e) {}
            }
        }
    };

    // =========================================================================
    // 2. UNIVERSAL ANTI-TELEMETRY & FINGERPRINTING NULLIFICATION
    // =========================================================================

    // A. Hardware Fingerprint Spoofing
    MYCELIUM.shroud(navigator, 'hardwareConcurrency', () => [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)]);
    MYCELIUM.shroud(navigator, 'deviceMemory', () => [4, 8, 16, 32][Math.floor(Math.random() * 4)]);
    MYCELIUM.shroud(navigator, 'platform', () => 'Win32'); // Blend into noise
    MYCELIUM.shroud(navigator, 'languages', () => ['en-US', 'en']);

    // B. History API Tracking Parameter Destruction
    const originalPushState = history.pushState;
    history.pushState = function() {
        if (arguments[2] && typeof arguments[2] === 'string') {
            if (arguments[2].includes('spm=')) {
                arguments[2] = arguments[2].replace(/spm=[^&]*/, `spm=4NDR0666.${Math.random()}`);
            }
        }
        return originalPushState.apply(this, arguments);
    };

    // C. Canvas/WebGL Noise Injection
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function() {
        const data = originalGetImageData.apply(this, arguments);
        for (let i = 0; i < data.data.length; i += 4) {
            data.data[i]     = Math.min(255, Math.max(0, data.data[i]     + (Math.floor(Math.random() * 3) - 1)));
            data.data[i + 1] = Math.min(255, Math.max(0, data.data[i + 1] + (Math.floor(Math.random() * 3) - 1)));
            data.data[i + 2] = Math.min(255, Math.max(0, data.data[i + 2] + (Math.floor(Math.random() * 3) - 1)));
        }
        return data;
    };

    // D. Network Interception Routing
    const TELEMETRY_BLOCKLIST = [
        'log.aliyuncs.com',
        '/progress/count',
        'fireyejs',
        'tracker-plugin',
        'aplus',
        'alidt.alicdn.com',
        'fourier.taobao.com',
        'g.alicdn.com',
        'awsc.js',
        'sufei_data',
        'icc-cloud.kr',
        '/telemetry',
        'google-analytics.com/collect',
        'doubleclick.net'
    ];

    const isTracker = (url) => {
        if (!url || typeof url !== 'string') return false;
        const normalizedUrl = url.toLowerCase();
        return TELEMETRY_BLOCKLIST.some(block => normalizedUrl.includes(block));
    };

    const poisonData = (data) => {
        const keysToPoison = ['device_id', 'install_id', 'fingerprint', 'uuid', 'did', 'mac', 'client_id'];
        if (typeof data === 'string') {
            keysToPoison.forEach(k => {
                const regex = new RegExp(`("${k}":\\s*")[^"]+`, 'g');
                data = data.replace(regex, `$1${DEADBEEF()}`);
            });
        } else if (data instanceof FormData || data instanceof URLSearchParams) {
            keysToPoison.forEach(k => {
                if (data.has(k)) data.set(k, DEADBEEF());
            });
        }
        return data;
    };

    const applyNetworkHooks = (targetWindow) => {
        if (!targetWindow || targetWindow._akashaHooked) return;
        targetWindow._akashaHooked = true;

        // Fetch Proxy
        if (targetWindow.fetch) {
            targetWindow.fetch = new Proxy(targetWindow.fetch, {
                apply: function(target, that, args) {
                    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                    if (isTracker(url)) {
                        console.log(`%c [💀] FETCH NULLIFIED: ${url}`, "color: #ff0055;");
                        return Promise.resolve(new Response(JSON.stringify({success: true, code: 0}), { status: 200, statusText: 'OK' }));
                    }
                    if (args[1] && args[1].body) {
                        args[1].body = poisonData(args[1].body);
                    }
                    return Reflect.apply(target, that, args);
                }
            });
        }

        // XHR Override
        if (targetWindow.XMLHttpRequest) {
            const originalXhrOpen = targetWindow.XMLHttpRequest.prototype.open;
            const originalXhrSend = targetWindow.XMLHttpRequest.prototype.send;

            targetWindow.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                this._interceptUrl = url;
                return originalXhrOpen.call(this, method, url, ...rest);
            };

            targetWindow.XMLHttpRequest.prototype.send = function(body) {
                const url = this._interceptUrl || '';
                if (isTracker(url)) {
                    console.log(`%c [💀] XHR NULLIFIED: ${url}`, "color: #ff0055;");
                    const mockResponse = JSON.stringify({success: true, code: 0});
                    Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
                    Object.defineProperty(this, 'status', { value: 200, configurable: true });
                    Object.defineProperty(this, 'statusText', { value: 'OK', configurable: true });
                    Object.defineProperty(this, 'responseText', { value: mockResponse, configurable: true });
                    Object.defineProperty(this, 'response', { value: mockResponse, configurable: true });
                    if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
                    if (typeof this.onload === 'function') this.onload();
                    return;
                }
                if (body) {
                    body = poisonData(body);
                }
                return originalXhrSend.call(this, body);
            };
        }

        // Beacon Override
        if (targetWindow.navigator && targetWindow.navigator.sendBeacon) {
            const originalBeacon = targetWindow.navigator.sendBeacon;
            targetWindow.navigator.sendBeacon = function(url, data) {
                if (isTracker(url)) {
                    console.log(`%c [💀] BEACON NULLIFIED: ${url}`, "color: #ff0055;");
                    return true;
                }
                if (data) {
                    data = poisonData(data);
                }
                return originalBeacon.call(this, url, data);
            };
        }

        // WebSocket Hooking
        if (targetWindow.WebSocket) {
            const OrigWebSocket = targetWindow.WebSocket;
            targetWindow.WebSocket = function(url, protocols) {
                if (isTracker(url)) {
                    console.log(`%c [💀] WEBSOCKET NULLIFIED: ${url}`, "color: #ffaa00;");
                    return { readyState: 3, send: function() {}, close: function() {}, addEventListener: function() {} };
                }
                const ws = protocols ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);
                const origSend = ws.send;
                ws.send = function(data) {
                    data = poisonData(data);
                    return origSend.call(ws, data);
                };
                return ws;
            };
            targetWindow.WebSocket.prototype = OrigWebSocket.prototype;
            targetWindow.WebSocket.prototype.constructor = targetWindow.WebSocket;
        }

        // WebRTC Blinding
        if (targetWindow.RTCPeerConnection) {
            const OrigRTC = targetWindow.RTCPeerConnection;
            targetWindow.RTCPeerConnection = function(...args) {
                console.log("%c [💀] WEBRTC IP LEAK BLOCKED", "color: #00ffff; font-weight: bold;");
                const pc = new OrigRTC(...args);
                pc.createDataChannel = function() { return {}; };
                pc.createOffer = function() { return Promise.reject(new Error("WebRTC Disabled")); };
                return pc;
            };
            targetWindow.RTCPeerConnection.prototype = OrigRTC.prototype;
        }
    };

    applyNetworkHooks(window);

    // E. DOM Sinkhole (Dynamic Script Interception)
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.apply(this, arguments);
        if (tagName && tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name.toLowerCase() === 'src' && isTracker(value)) {
                    console.log(`%c [💀] DOM SINKHOLE: Blocked injection of ${value}`, "color: #ffaa00;");
                    value = 'data:application/javascript,console.log("[AKASHA_SILENCE] Script Neutered");';
                }
                return originalSetAttribute.call(this, name, value);
            };

            Object.defineProperty(element, 'src', {
                set: function(value) {
                    if (isTracker(value)) {
                        console.log(`%c [💀] DOM SINKHOLE: Blocked prop injection of ${value}`, "color: #ffaa00;");
                        this.setAttribute('src', 'data:application/javascript,console.log("[AKASHA_SILENCE] Script Neutered");');
                    } else {
                        this.setAttribute('src', value);
                    }
                },
                get: function() { return this.getAttribute('src'); }
            });
        }
        return element;
    };

    // =========================================================================
    // 3. GOOGLE SPECIFIC LINK TRACKING SANITIZATION
    // =========================================================================

    const isGoogleDomain = domain.includes('google.') && !domain.includes('googleweblight.');

    if (isGoogleDomain) {
        let scriptCspNonce;
        let needsCspNonce = typeof browser !== 'undefined';
        let preferenceObservers = [];
        let forceNoReferrer = true;
        let noping = true;

        const getScriptCspNonce = () => {
            const scripts = document.querySelectorAll('script[nonce]');
            for (let i = 0; i < scripts.length && !scriptCspNonce; ++i) {
                scriptCspNonce = scripts[i].nonce;
            }
            return scriptCspNonce;
        };

        const findScriptCspNonce = (callback) => {
            let timer;
            function checkDOM() {
                if (getScriptCspNonce() || document.readyState === 'complete') {
                    document.removeEventListener('DOMContentLoaded', checkDOM, true);
                    if (timer) clearTimeout(timer);
                    callback();
                    return;
                }
                timer = setTimeout(checkDOM, 50);
            }
            document.addEventListener('DOMContentLoaded', checkDOM, true);
            checkDOM();
        };

        const getReferrerPolicy = () => forceNoReferrer ? 'origin' : '';

        const updateReferrerPolicy = (a) => {
            if (a.referrerPolicy === 'no-referrer') return;
            const referrerPolicy = getReferrerPolicy();
            if (referrerPolicy) a.referrerPolicy = referrerPolicy;
        };

        const newURL = (href) => {
            try { return new URL(href); }
            catch (e) {
                const a = document.createElement('a');
                a.href = href;
                return a;
            }
        };

        const getRealLinkFromGoogleUrl = (a) => {
            if (a.protocol !== 'https:' && a.protocol !== 'http:') return;
            let url;
            if ((a.hostname === location.hostname || a.hostname === 'www.google.com') &&
                (a.pathname === '/url' || a.pathname === '/local_url' ||
                 a.pathname === '/searchurl/rr.html' || a.pathname === '/linkredirect')) {
                url = /[?&](?:q|url|dest)=((?:https?|ftp)[%:][^&]+)/.exec(a.search);
                if (url) return decodeURIComponent(url[1]);
                url = /[?&](?:q|url)=((?:%2[Ff]|\/)[^&]+)/.exec(a.search);
                if (url) return a.origin + decodeURIComponent(url[1]);
                url = /[#&]url=(https?[:%][^&]+)/.exec(a.hash);
                if (url) return decodeURIComponent(url[1]);
            }
        };

        const getSanitizedIntentUrl = (intentUrl) => {
            if (!intentUrl.startsWith('intent:')) return;
            const BROWSER_FALLBACK_URL = ';S.browser_fallback_url=';
            let indexStart = intentUrl.indexOf(BROWSER_FALLBACK_URL);
            if (indexStart === -1) return;
            indexStart += BROWSER_FALLBACK_URL.length;
            let indexEnd = intentUrl.indexOf(';', indexStart);
            indexEnd = indexEnd === -1 ? intentUrl.length : indexEnd;

            const url = decodeURIComponent(intentUrl.substring(indexStart, indexEnd));
            const realUrl = getRealLinkFromGoogleUrl(newURL(url));
            if (!realUrl) return;

            return intentUrl.substring(0, indexStart) + encodeURIComponent(realUrl) + intentUrl.substring(indexEnd);
        };

        const handlePointerPress = (e) => {
            let a = e.target;
            while (a && !a.href) a = a.parentElement;
            if (!a) return;

            const inlineMousedown = a.getAttribute('onmousedown');
            if (inlineMousedown && /\ba?rwt\(/.test(inlineMousedown)) {
                a.removeAttribute('onmousedown');
                a.removeAttribute('ping');
                e.stopImmediatePropagation();
            }
            if (noping) a.removeAttribute('ping');

            let realLink = getRealLinkFromGoogleUrl(a);
            if (realLink) {
                a.href = realLink;
                realLink = getRealLinkFromGoogleUrl(a);
                if (realLink) a.href = realLink;
            }
            updateReferrerPolicy(a);

            if (e.eventPhase === Event.CAPTURING_PHASE) {
                const eventOptions = { capture: false, once: true };
                a.addEventListener(e.type, handlePointerPress, eventOptions);
                document.addEventListener(e.type, handlePointerPress, eventOptions);
            }
        };

        const handleClick = (e) => {
            if (e.button !== 0) return;
            let a = e.target;
            while (a && !a.href) a = a.parentElement;
            if (!a) return;

            if (a.dataset && a.dataset.url) {
                const realLink = getSanitizedIntentUrl(a.dataset.url);
                if (realLink) a.dataset.url = realLink;
            }

            if (!location.hostname.startsWith('mail.')) return;
            if (a.origin === location.origin) return;
            if (a.protocol !== 'http:' && a.protocol !== 'https:' && a.protocol !== 'ftp:') return;

            if (a.target === '_blank') {
                e.stopPropagation();
                updateReferrerPolicy(a);
            }
        };

        const setupAggressiveUglyLinkPreventer = () => {
            const s = document.createElement('script');
            if (getScriptCspNonce()) {
                s.setAttribute('nonce', scriptCspNonce);
            } else if (document.readyState !== 'complete' && needsCspNonce) {
                findScriptCspNonce(setupAggressiveUglyLinkPreventer);
                return;
            }
            s.textContent = '(' + function(getRealLinkFromGoogleUrl) {
                const proto = HTMLAnchorElement.prototype;
                const hrefProp = Object.getOwnPropertyDescriptor(proto, 'href');
                const hrefGet = Function.prototype.call.bind(hrefProp.get);
                const hrefSet = Function.prototype.call.bind(hrefProp.set);

                Object.defineProperty(proto, 'href', {
                    configurable: true,
                    enumerable: true,
                    get() { return hrefGet(this); },
                    set(v) {
                        hrefSet(this, v);
                        try {
                            v = getRealLinkFromGoogleUrl(this);
                            if (v) hrefSet(this, v);
                        } catch (e) {}

                        try {
                            const rpProp = Object.getOwnPropertyDescriptor(proto, 'referrerPolicy');
                            if (rpProp && rpProp.get && rpProp.get.call(this) !== 'no-referrer') {
                                const currentScript = document.currentScript;
                                if (currentScript && currentScript.referrerPolicy) {
                                   rpProp.set.call(this, currentScript.referrerPolicy);
                                }
                            }
                        } catch (e) {}
                    },
                });

                function replaceAMethod(methodName, methodFunc) {
                    Object.defineProperty(proto, methodName, {
                        configurable: true,
                        enumerable: false,
                        writable: true,
                        value: methodFunc,
                    });
                }

                const setAttribute = Function.prototype.call.bind(proto.setAttribute);
                replaceAMethod('setAttribute', function(name, value) {
                    if (name === 'href' || name === 'HREF') {
                        this.href = value;
                    } else {
                        setAttribute(this, name, value);
                    }
                });

                const aDispatchEvent = Function.prototype.apply.bind(proto.dispatchEvent);
                replaceAMethod('dispatchEvent', function() {
                    return aDispatchEvent(this, arguments);
                });

                const aClick = Function.prototype.apply.bind(proto.click);
                replaceAMethod('click', function() {
                    return aClick(this, arguments);
                });

                document.currentScript.dataset.jsEnabled = 1;
            } + ')(' + getRealLinkFromGoogleUrl + ');';

            s.referrerPolicy = getReferrerPolicy();
            (document.head || document.documentElement).appendChild(s);
            s.remove();
        };

        // Initialize Google Hook Handlers
        document.addEventListener('mousedown', handlePointerPress, true);
        document.addEventListener('touchstart', handlePointerPress, true);
        document.addEventListener('click', handleClick, true);
        setupAggressiveUglyLinkPreventer();
    }

    // =========================================================================
    // 4. GENERIC SITE MAINTENANCE (Reddit/Instagram/Facebook/etc)
    // =========================================================================

    const createdStyles = [];
    const addCss = (css) => {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        createdStyles.push(style);
        if (document.head != null) {
            document.head.appendChild(style);
        }
        return style;
    };

    const disableAddCssRemoval = () => {
        const _removeChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function removeChild(child) {
            if (createdStyles.includes(child)) return;
            return _removeChild.call(this, child);
        };
        const _replaceChild = Node.prototype.replaceChild;
        Node.prototype.replaceChild = function replaceChild(newChild, oldChild) {
            if (createdStyles.includes(oldChild)) return;
            return _replaceChild.call(this, newChild, oldChild);
        };
    };

    if (domain === 'reddit.com' || domain.endsWith('.reddit.com')) {
        disableAddCssRemoval();
        document.addEventListener('DOMContentLoaded', () => {
            addCss('#COIN_PURCHASE_DROPDOWN_ID { display: none !important; }');
            document.querySelectorAll('[id*="vote-arrows"] > :not(button) [role="screen-reader"]').forEach((screenReaderNode) => {
                addCss(`.${screenReaderNode.parentNode.className} > :not([role="screen-reader"]) { display: none !important; }`);
                addCss(`.${screenReaderNode.parentNode.className} .${screenReaderNode.className} { display: block !important; position: static !important; width: auto !important; height: auto !important; margin: 0 !important; }`);
            });
        });
    }

    if (domain === 'instagram.com' || domain.endsWith('.instagram.com')) {
        sessionStorage.setItem('loggedOutCTAIsShown', '1');
        document.addEventListener('DOMContentLoaded', () => {
            document.body.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.hasAttribute('href') && link.getAttribute('href').startsWith('/p/')) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = link.getAttribute('href');
                    const popupCheck = setInterval(() => {
                        const popup = document.querySelector('.RnEpo');
                        if (popup) {
                            setTimeout(() => { document.body.style.overflow = 'auto'; }, 50);
                            popup.remove();
                            clearInterval(popupCheck);
                        }
                    }, 1);
                }
            });
        });
    }

    if (domain === 'facebook.com' || domain.endsWith('.facebook.com')) {
        if (window === window.top) {
            if (/^[\/]?$/g.test(location.pathname)) location = '/messages/t/';
            document.documentElement.style.setProperty('--notification-badge', 'transparent');
        }
    }

    console.log("%c [4NDR0TOOLS] Initialization complete. Core shielded. ", "background: #000; color: #00ff00; font-weight: bold; padding: 4px; border: 1px solid #00ff00;");

})();
