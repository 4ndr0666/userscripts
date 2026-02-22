// ==UserScript==
// @name         4ndr0tools - Anti-telemetry (Intelligent Cloud Computing)
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.5.0
// @description  Wan AI shifted infrastructure from Alibaba to ICC (South Korea) to exploit jurisdictional arbitrage and circumvent US privacy laws. It creates persistent, hardware-linked endpoint fingerprints (Layer 1/2 MAC/UDID mapping) that survive OS/browser wipes via low-level telemetry beacons. This data is brokered for predictive behavioral profiling and Global Endpoint Graph construction. This script enforces absolute surveillance countermeasures: aggressive DOM sinkholing, WebRTC/network nullification, synthetic identifier poisoning, and secure context escape prevention targeting Wan.video, Kuaishou, Aliyun, and ICC telemetry nodes.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Anti-telemetry%20(Intelligent%20Cloud%20Computing).user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Anti-telemetry%20(Intelligent%20Cloud%20Computing).user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*.wan.video/*
// @match        *://*.kuaishou.com/*
// @match        *://*.aliyun.com/*
// @match        *://*.icc-cloud.kr/*
// @license      UNLICENSED - RED TEAM USE ONLY
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    /**
     * !DEADBEEF | HEX_CORRUPTION_LAYER
     */
    const DEADBEEF = () => {
        return '0xDEADBEEF-' + Math.random().toString(16).slice(2, 12).toUpperCase();
    };

    /**
     * !MYCELIUM | DISTRIBUTED_RECURSION
     */
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

    // --- EXECUTION: !P (Production-Ready Counter-Surveillance) ---

    // 1. Hardware Fingerprinting Nullification (Corrected Datatypes)
    MYCELIUM.shroud(navigator, 'hardwareConcurrency', () => [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)]);
    MYCELIUM.shroud(navigator, 'deviceMemory', () => [4, 8, 16, 32][Math.floor(Math.random() * 4)]);
    MYCELIUM.shroud(navigator, 'platform', () => 'Win32'); // Blend into noise
    MYCELIUM.shroud(navigator, 'languages', () => ['en-US', 'en']);

    // 2. Intercept SPM Tracking Beacons
    const originalPushState = history.pushState;
    history.pushState = function() {
        if (arguments[2] && typeof arguments[2] === 'string' && arguments[2].includes('spm=')) {
            arguments[2] = arguments[2].replace(/spm=[^&]*/, `spm=4NDR0666.${Math.random()}`);
        }
        return originalPushState.apply(this, arguments);
    };

    // 3. !QUANTUM Canvas/WebGL Blinding
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

    // 4. Expanded Threat Matrix (Heuristics)
    const TELEMETRY_BLOCKLIST = [
        'log.aliyuncs.com',
        '/track',
        '/progress/count',
        'fireyejs',
        'tracker-plugin',
        'aplus',
        'alidt.alicdn.com',
        'fourier.taobao.com',
        'g.alicdn.com',
        'awsc.js',
        'sufei_data',
        'stat-',
        'icc-cloud.kr',
        '/telemetry'
    ];

    const isTracker = (url) => {
        if (!url || typeof url !== 'string') return false;
        const normalizedUrl = url.toLowerCase();
        return TELEMETRY_BLOCKLIST.some(domain => normalizedUrl.includes(domain));
    };

    const poisonData = (data) => {
        const keysToPoison = ['device_id', 'install_id', 'fingerprint', 'uuid', 'did', 'mac'];
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

    // 5. !DOM_SINKHOLE: Dynamic Script Injection Nullification
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.apply(this, arguments);
        if (tagName && tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name.toLowerCase() === 'src' && isTracker(value)) {
                    console.log(`%c [💀] DOM SINKHOLE ENGAGED: Blocked dynamic injection of ${value}`, "color: #ffaa00;");
                    value = 'data:application/javascript,console.log("[AKASHA_SILENCE] Tracker Neutered");';
                }
                return originalSetAttribute.call(this, name, value);
            };

            Object.defineProperty(element, 'src', {
                set: function(value) {
                    if (isTracker(value)) {
                        console.log(`%c [💀] DOM SINKHOLE ENGAGED: Blocked direct property injection of ${value}`, "color: #ffaa00;");
                        this.setAttribute('src', 'data:application/javascript,console.log("[AKASHA_SILENCE] Tracker Neutered");');
                    } else {
                        this.setAttribute('src', value);
                    }
                },
                get: function() { return this.getAttribute('src'); }
            });
        }
        return element;
    };

    // 6. Universal Hooking Function (Applies to window and iframe contexts)
    const applyNetworkHooks = (targetWindow) => {
        if (!targetWindow || targetWindow._akashaHooked) return;
        targetWindow._akashaHooked = true;

        // Fetch Proxy
        if (targetWindow.fetch) {
            targetWindow.fetch = new Proxy(targetWindow.fetch, {
                apply: function(target, that, args) {
                    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
                    if (isTracker(url)) {
                        console.log(`%c [💀] FETCH NULLIFIED (MOCKED 200 OK): ${url}`, "color: #ff0055;");
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
                    console.log(`%c [💀] XHR NULLIFIED (MOCKED 200 OK): ${url}`, "color: #ff0055;");
                    // Intercept getters to prevent application crash
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

        // --- MITIGATION 1: WebSocket Interception ---
        if (targetWindow.WebSocket) {
            const OrigWebSocket = targetWindow.WebSocket;
            targetWindow.WebSocket = function(url, protocols) {
                if (isTracker(url)) {
                    console.log(`%c [💀] WEBSOCKET CONNECTION NULLIFIED: ${url}`, "color: #ffaa00; font-weight: bold;");
                    // Return a phantom socket to prevent crashes
                    return {
                        readyState: 3, // CLOSED
                        send: function() {},
                        close: function() {},
                        addEventListener: function() {}
                    };
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

        // --- MITIGATION 2: WebRTC Nullification ---
        if (targetWindow.RTCPeerConnection) {
            const OrigRTC = targetWindow.RTCPeerConnection;
            targetWindow.RTCPeerConnection = function(...args) {
                console.log("%c [💀] WEBRTC PEER CONNECTION BLOCKED: IP LEAK PREVENTED", "color: #00ffff; font-weight: bold;");
                const pc = new OrigRTC(...args);
                pc.createDataChannel = function() { return {}; };
                pc.createOffer = function() { return Promise.reject(new Error("WebRTC Disabled by 4ndr0guard")); };
                return pc;
            };
            targetWindow.RTCPeerConnection.prototype = OrigRTC.prototype;
        }

        // --- MITIGATION 3: ServiceWorker & SharedWorker Pacifier ---
        if (targetWindow.navigator && targetWindow.navigator.serviceWorker) {
            Object.defineProperty(targetWindow.navigator, 'serviceWorker', {
                get: function() {
                    return {
                        register: function() { 
                            console.log("%c [💀] SERVICE WORKER REGISTRATION SILENTLY DROPPED", "color: #ffaa00;");
                            return Promise.reject(new Error("SW Disabled by 4ndr0guard")); 
                        },
                        getRegistration: () => Promise.resolve(undefined),
                        getRegistrations: () => Promise.resolve([]),
                        controller: null
                    };
                },
                set: () => false
            });
        }

        if (targetWindow.SharedWorker) {
            Object.defineProperty(targetWindow, 'SharedWorker', {
                get: () => function() {
                    console.log("%c [💀] SHARED WORKER BLOCKED", "color: #ffaa00;");
                    throw new DOMException('SharedWorker disabled by security policy', 'SecurityError');
                },
                set: () => false
            });
        }
    };

    // Apply hooks to main window
    applyNetworkHooks(window);

    // 7. Context Escape Prevention (Iframe Injection)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName && node.tagName.toLowerCase() === 'iframe') {
                    console.log("%c [💀] IFRAME DETECTED. INJECTING AKASHA_SILENCE HOOKS...", "color: #ffaa00;");
                    try {
                        if (node.contentWindow) {
                            applyNetworkHooks(node.contentWindow);
                        }
                        node.addEventListener('load', () => {
                            if (node.contentWindow) {
                                applyNetworkHooks(node.contentWindow);
                            }
                        });
                    } catch (e) {}
                }
            });
        });
    });

    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    console.log("%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: AKASHA_SILENCE v3.5.0 ACTIVE. ABSOLUTE SURVEILLANCE COUNTERMEASURES DEPLOYED. ", "background: #000; color: #00ff00; font-weight: bold; font-family: monospace; padding: 4px; border: 1px solid #00ff00;");
})();
