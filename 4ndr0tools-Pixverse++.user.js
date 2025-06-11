// ==UserScript==
// @name        4ndr0tools-Pixverse++
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @description Bypass Pixverse video blocks, auto-reveal download, and intercept all API methods (XHR+fetch).
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       none
// @license     MIT
// @downloadURL https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools-Pixverse%2B%2B.user.js
// @updateURL https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools-Pixverse%2B%2B.user.js
// ==/UserScript==

(() => {
  'use strict';

  /* ───────────────────────────── CONSTANTS & STATE ────────────────────────────── */
  const DEBUG_PREFIX = '[Pixverse Bypass]';
  const MAX_ATTEMPTS = 30;
  let savedMediaPath = null;
  let isInitialized  = false;
  let btnAttached    = false;

  /* ──────────────────────────────── LOGGING HELPERS ───────────────────────────── */
  function log(...args)   { console.log(`${DEBUG_PREFIX}`, ...args); }
  function error(...args) { console.error(`${DEBUG_PREFIX}`, ...args); }

  /* ──────────────── API RESPONSE MODIFICATION CORE ───────────────── */

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
        return originalOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function (body) {
        const url = this._pixverseRequestUrl || '';

        // Capture media path
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

        // Pass through, then patch the response if necessary
        let res = await originalFetch.apply(this, args);
        let cloned = res.clone();

        try {
          if (cloned.headers.get('content-type')?.includes('application/json')) {
            let json = await cloned.json();
            let modified = modifyResponse(json, url);
            if (modified) {
              // Construct a new Response with the modified body, preserve headers/status
              let newRes = new Response(JSON.stringify(modified), {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers,
              });
              // Patch .json() and .text() on the returned Response object for transparency
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

  /* ────────────────────────────────────────────────────────────── */

  // Watermark-free download button logic (robust/SPA-aware)
  function setupWatermarkButton() {
    if (btnAttached) return;
    function tryAttachButton(attempts = 0) {
      // Try to find the watermark-free element in several common places
      let watermarkDiv = Array.from(document.querySelectorAll('div,button')).find(
        el => (el.textContent.trim() === 'Watermark-free')
      );
      if (!watermarkDiv) {
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(() => tryAttachButton(attempts + 1), 350);
        }
        return;
      }

      // Don't double-inject or attach multiple times
      if (watermarkDiv.dataset.ytdlcInjected) return;

      const newButton = document.createElement('button');
      newButton.textContent = 'Watermark-free';
      // Attempt to inherit basic style
      const computed = window.getComputedStyle(watermarkDiv);
      newButton.style.cssText = computed.cssText || '';
      newButton.style.background = '#142830'; // Custom style for visibility
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

    // Initial attach and also when UI changes (SPA/React re-renders)
    tryAttachButton();
    const mo = new MutationObserver(() => tryAttachButton());
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ────────────── INITIALIZATION ────────────── */
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

  // Run as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

})();
