// ==UserScript==
// @name        4ndr0tools-Pixverse++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.1
// @description Pixverse toolkit: bypass blocks, auto-download, prompt NSFW bypass, robust API overrides, settings UI.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-Pixverse++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-Pixverse++.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';

  /* ───────────── CONSTANTS & STATE ───────────── */
  const DEBUG_PREFIX = '[Pixverse Bypass]';
  const MAX_ATTEMPTS = 30;
  let savedMediaPath = null;
  let isInitialized  = false;
  let btnAttached    = false;

  // --- Trigger Words (NSFW bypass, insert zero-width spaces) ---
  const TRIGGER_WORDS = [
    "asshole","anus","areola","areolas","blowjob","cock","crotch","ddick","member",
    "oral","penis","phallus","pussy","suck","throat","vagina","wiener","tits","fuck",
    "bukake","corridas","esperma","culo","nsfw","deep","boobs","sucking","throating",
    "cum","meco","semen","deepthroat","buttcheeks","titties","breast","breasts","titfuck",
    "tittydrop","tittyfuck","swallow","splooge","slut","whore","horny","masterbate",
    "masterbating","pleasure","fingering","clit","orgasm","climax","moan","moaning",
    "cock","cleavage","nipple","lick","squeeze","bounce","bouncing","rump","buttcheeks"
  ];
  // Optional: enable/disable prompt obfuscation
  const ENABLE_PROMPT_OBFUSCATION = true;

  /* ───────────── LOGGING HELPERS ───────────── */
  function log(...args)   { console.log(`${DEBUG_PREFIX}`, ...args); }
  function error(...args) { console.error(`${DEBUG_PREFIX}`, ...args); }

  /* ────── REGEX ENDPOINTS (future proofing, not required, fallback is .includes) ────── */
  // (Commented for future extension)
  // const API_ENDPOINTS = {
  //   credits:      /\/user\/credits(?:\?|$)/,
  //   videoList:    /\/video\/list\/personal/,
  //   batchUpload:  /\/media\/batch_upload_media/,
  //   singleUpload: /\/media\/upload/,
  //   creativePrompt: /\/creative_platform\/video\//
  // };
  // function matchesEndpoint(url, endpointKey) {
  //   return API_ENDPOINTS[endpointKey]?.test(url);
  // }

  /* ────────── API RESPONSE MODIFICATION ────────── */
  function extractMediaPath(data, url) {
    if (!data) return null;
    if (url.includes('/media/batch_upload_media')) {
      return data?.images?.[0]?.path || null;
    } else if (url.includes('/media/upload')) {
      return data?.path || null;
    }
    return null;
  }

  function modifyVideoList(data) {
    if (!data?.Resp?.data) return data;
    return {
      ...data,
      Resp: {
        ...data.Resp,
        data: data.Resp.data.map(item => ({
          ...item,
          video_status: item.video_status === 7 ? 1 : item.video_status,
          first_frame: (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url) ||
                      item.customer_paths?.customer_img_url || '',
          url: item.video_path ? `https://media.pixverse.ai/${item.video_path}` : ''
        }))
      }
    };
  }

  function modifyBatchUpload(data) {
    if (data?.ErrCode === 400 && savedMediaPath) {
      const imageId   = Date.now();
      const imageName = savedMediaPath.split('/').pop() || 'uploaded_media';
      return {
        ErrCode: 0,
        ErrMsg: "success",
        Resp: {
          result: [{
            id: imageId,
            category: 0,
            err_msg: "",
            name: imageName,
            path: savedMediaPath,
            size: 0,
            url: `https://media.pixverse.ai/${savedMediaPath}`
          }]
        }
      };
    }
    return data;
  }

  function modifySingleUpload(data) {
    if (data?.ErrCode === 400040 && savedMediaPath) {
      return {
        ErrCode: 0,
        ErrMsg: "success",
        Resp: {
          path: savedMediaPath,
          url: `https://media.pixverse.ai/${savedMediaPath}`
        }
      };
    }
    return data;
  }

  function modifyResponse(data, url) {
    if (!data || typeof data !== 'object') return null;
    if (url.includes('/video/list/personal'))      return modifyVideoList(data);
    else if (url.includes('/media/batch_upload_media')) return modifyBatchUpload(data);
    else if (url.includes('/media/upload'))        return modifySingleUpload(data);
    return null;
  }

  /* ────── PROMPT NSFW BYPASS ────── */
  function obfuscatePrompt(prompt) {
    let newPrompt = prompt;
    for (const w of TRIGGER_WORDS) {
      // Insert zero-width space (\u200B) between each character for matches
      newPrompt = newPrompt.replace(
        new RegExp(`\\b${w}\\b`, "gi"),
        m => m.split('').join('\u200B')
      );
    }
    return newPrompt;
  }

  /* ────────────── XHR INTERCEPTOR ────────────── */
  function overrideXHR() {
    if (!window.XMLHttpRequest) {
      error('XMLHttpRequest not supported');
      return;
    }
    try {
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function (method, url) {
        this._pixverseRequestUrl = url;
        this._pixverseRequestMethod = method;
        return originalOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function (body) {
        const url = this._pixverseRequestUrl || '';
        const method = (this._pixverseRequestMethod || '').toUpperCase();

        // PROMPT OBFUSCATION (XHR variant) for /creative_platform/video/
        if (
          ENABLE_PROMPT_OBFUSCATION &&
          url.includes('/creative_platform/video/') &&
          method === 'POST' &&
          body
        ) {
          try {
            let bodyObj = typeof body === 'string' ? JSON.parse(body) : body;
            if (bodyObj && typeof bodyObj.prompt === 'string') {
              bodyObj.prompt = obfuscatePrompt(bodyObj.prompt);
              arguments[0] = JSON.stringify(bodyObj);
            }
          } catch (e) { /* Ignore; not all POSTs need parsing */ }
        }

        // Capture media path for uploads
        if ((url.includes('/media/batch_upload_media') || url.includes('/media/upload')) && body) {
          try {
            let data = body;
            if (body instanceof FormData) {
              data = Object.fromEntries(body);
            } else if (typeof body === 'string') {
              data = JSON.parse(body || '{}');
            }
            savedMediaPath = extractMediaPath(data, url);
            log('Captured media path:', savedMediaPath);
          } catch (e) {
            error('Error parsing request body:', e);
          }
        }

        const self = this;
        const loadHandler = function () {
          if (self.status >= 200 && self.status < 300) {
            try {
              let response = (self.responseType === 'json' ? self.response : JSON.parse(self.responseText || '{}'));
              let modified = modifyResponse(response, url);
              if (modified) {
                Object.defineProperties(self, {
                  response:     { value: modified, writable: true, configurable: true },
                  responseText: { value: JSON.stringify(modified), writable: true, configurable: true }
                });
                log('XHR response modified:', url);
              }
            } catch (e) {
              error('XHR response processing error:', e);
            }
          }
        };
        self.addEventListener('load', loadHandler, { once: true });

        return originalSend.apply(self, arguments);
      };
      log('XHR overrides initialized');
    } catch (e) {
      error('XHR override failed:', e);
    }
  }

  /* ────────────── FETCH INTERCEPTOR ────────────── */
  function overrideFetch() {
    if (!window.fetch) {
      error('Fetch API not supported');
      return;
    }
    try {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        let [input, init] = args;
        let url = typeof input === 'string' ? input : (input?.url || '');
        let reqBody = init?.body || '';

        // PROMPT OBFUSCATION (fetch variant) for /creative_platform/video/
        if (
          ENABLE_PROMPT_OBFUSCATION &&
          url.includes('/creative_platform/video/') &&
          (init?.method || '').toUpperCase() === 'POST' &&
          reqBody
        ) {
          try {
            let bodyObj = typeof reqBody === 'string' ? JSON.parse(reqBody) : reqBody;
            if (bodyObj && typeof bodyObj.prompt === 'string') {
              bodyObj.prompt = obfuscatePrompt(bodyObj.prompt);
              init.body = JSON.stringify(bodyObj);
            }
          } catch (e) { /* Ignore if parse fails */ }
        }

        // Capture media path if uploading
        if ((url.includes('/media/batch_upload_media') || url.includes('/media/upload')) && reqBody) {
          try {
            let data = reqBody;
            if (reqBody instanceof FormData) {
              data = Object.fromEntries(reqBody);
            } else if (typeof reqBody === 'string') {
              data = JSON.parse(reqBody || '{}');
            }
            savedMediaPath = extractMediaPath(data, url);
            log('FETCH: Captured media path:', savedMediaPath);
          } catch (e) {
            error('FETCH: Error parsing request body:', e);
          }
        }

        let res = await originalFetch.apply(this, args);
        let cloned = res.clone();

        try {
          if (cloned.headers.get('content-type')?.includes('application/json')) {
            let json = await cloned.json();
            let modified = modifyResponse(json, url);
            if (modified) {
              let newRes = new Response(JSON.stringify(modified), {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
              });
              Object.defineProperties(newRes, {
                json: {
                  value: () => Promise.resolve(modified),
                  writable: false,
                  configurable: true
                },
                text: {
                  value: () => Promise.resolve(JSON.stringify(modified)),
                  writable: false,
                  configurable: true
                }
              });
              log('FETCH: Response modified:', url);
              return newRes;
            }
          }
        } catch (e) {
          error('FETCH: Response handling error:', e);
        }
        return res;
      };
      log('Fetch override initialized');
    } catch (e) {
      error('Fetch override failed:', e);
    }
  }

  /* ───────── WATERMARK-FREE DOWNLOAD BUTTON (robust/SPA-aware) ───────── */
  function setupWatermarkButton() {
    if (btnAttached) return;
    function tryAttachButton(attempts = 0) {
      let watermarkDiv = Array.from(document.querySelectorAll('div,button')).find(
        el => (el.textContent.trim() === 'Watermark-free')
      );
      if (!watermarkDiv) {
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(() => tryAttachButton(attempts + 1), 350);
        }
        return;
      }
      if (watermarkDiv.dataset.ytdlcInjected) return;

      const newButton = document.createElement('button');
      newButton.textContent = 'Watermark-free';
      // Style: Inherit & custom
      const computed = window.getComputedStyle(watermarkDiv);
      newButton.style.cssText = computed.cssText || '';
      newButton.style.background = '#142830';
      newButton.style.color      = '#15FFFF';
      newButton.style.fontWeight = 'bold';
      newButton.style.cursor     = 'pointer';
      newButton.style.borderRadius = '6px';
      newButton.style.marginLeft = '8px';
      newButton.style.padding    = '6px 12px';

      newButton.onclick = function (event) {
        event.stopPropagation();
        const videoElement = document.querySelector(".component-video > video, video");
        if (videoElement && videoElement.src) {
          const videoUrl = videoElement.src;
          log('[Watermark-free] Video URL:', videoUrl);

          // Download the video
          const link = document.createElement('a');
          link.href = videoUrl;
          link.download = videoUrl.split('/').pop() || 'video.mp4';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          log('[Watermark-free] Download triggered for:', videoUrl);
        } else {
          error('[Watermark-free] Video element not found or no src attribute');
          alert('Could not find the video to download. Please ensure a video is loaded.');
        }
      };

      watermarkDiv.parentNode.replaceChild(newButton, watermarkDiv);
      newButton.dataset.ytdlcInjected = '1';
      btnAttached = true;
      log('[Watermark-free] Button replaced and listener attached');
    }
    tryAttachButton();
    const mo = new MutationObserver(() => tryAttachButton());
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ────────── INITIALIZATION ────────── */
  function initialize() {
    if (isInitialized) return;
    try {
      overrideXHR();
      overrideFetch();
      setupWatermarkButton();
      isInitialized = true;
      log('Script initialized successfully');
    } catch (e) {
      error('Initialization failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();