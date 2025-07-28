// ==UserScript==
// @name        4ndr0tools_PixVerseBeta
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.1.3
// @description Pixverse bypass & toolkit: credits patch, video/status unlock, robust download, prompt NSFW bypass, API override, anti-blockers, minimal toast UI. Future-proofed, DRY, modular.
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://app.pixverse.ai/*
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  "use strict";
  if (window._pixverseToolkitInitialized) return;
  window._pixverseToolkitInitialized = true;

  //────── CONSTANTS & CONFIG ──────//
  const DEBUG_PREFIX = '[Pixverse++]';
  const MAX_ATTEMPTS = 30;
  let savedMediaPath = null;
  let isInitialized  = false;
  let btnAttached    = false;

  // Feature: List of trigger words for prompt obfuscation (zero-width space bypass)
  const TRIGGER_WORDS = [
    "anal","asshole","anus","areola","areolas","blowjob","boobs","bounce","bouncing","breast","breasts",
    "bukake","buttcheeks","butt","cheeks","climax","clit","cleavage","cock","corridas","crotch","cum","cums","culo",
    "deep","deepthroat","ddick","dick","esperma","fat ass","fellatio","fingering","fuck","fucked","horny","lick","masterbate",
    "masterbating","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
    "pussy","rump","semen","slut","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
    "tits","titfuck","titties","tittydrop","tittyfuck","titfuck","vagina","wiener","whore","creampie","cumshot","cunnilingus",
    "doggystyle","ejaculate","ejaculation","handjob","jerk off","labia","nude","orgy","porn","prolapse",
    "rectum","rimjob","sesual","stripper","submissive","teabag","threesome","vibrator","voyeur"
  ];

  // Endpoint regex map
  const API_ENDPOINTS = {
    credits:        /\/user\/credits(?:\?|$)/,
    videoList:      /\/video\/list\/personal/,
    batchUpload:    /\/media\/batch_upload_media/,
    singleUpload:   /\/media\/upload/,
    creativePrompt: /\/creative_platform\/video\//
  };
  function matchesEndpoint(url, key) {
    return API_ENDPOINTS[key]?.test(url);
  }

  //────── HELPERS ──────//
  function log(...args)   { console.log(DEBUG_PREFIX, ...args); }
  function error(...args) { console.error(DEBUG_PREFIX, ...args); }

  function parseBody(body) {
    if (body instanceof FormData) {
      try { return Object.fromEntries(body); }
      catch { return null; }
    }
    if (typeof body === "string") {
      try { return JSON.parse(body); }
      catch { return null; }
    }
    return null;
  }

  function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function obfuscatePrompt(prompt) {
    let mod = prompt;
    for (const w of TRIGGER_WORDS) {
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`,"gi");
      mod = mod.replace(re, m => m.split('').join('\u200B'));
    }
    return mod;
  }

  //────── API RESPONSE PATCHERS ──────//
  function extractMediaPath(data, url) {
    if (!data || typeof data !== "object") return null;
    if (matchesEndpoint(url, "batchUpload") && Array.isArray(data.images)) {
      return data.images[0]?.path || null;
    }
    if (matchesEndpoint(url, "singleUpload")) {
      if (typeof data.path === "string")       return data.path;
      if (typeof data.media_path === "string") return data.media_path;
      for (const k in data) {
        if (typeof data[k] === "string" && /\.mp4$/i.test(data[k])) return data[k];
      }
    }
    return null;
  }

  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data);
      clone.Resp.credits = 100;
      log('Credits restored to 100');
      return clone;
    }
    return null;
  }

  function modifyVideoList(data) {
    if (!data?.Resp?.data) return null;
    const clone = structuredClone(data);
    clone.Resp.data.forEach(item => {
      if (item.video_status === 7) item.video_status = 1;
      if (item.customer_paths?.customer_video_last_frame_url)
        item.first_frame = item.customer_paths.customer_video_last_frame_url;
      if (item.video_path)
        item.url = `https://media.pixverse.ai/${item.video_path}`;
    });
    log('Video list patched');
    return clone;
  }

  function modifyBatchUpload(data) {
    if ([400,403,401].includes(data?.ErrCode) && savedMediaPath) {
      const id   = Date.now();
      const name = savedMediaPath.split('/').pop() || 'uploaded_media';
      return { ErrCode:0, ErrMsg:"success", Resp:{ result:[{ id, category:0, err_msg:"",
                name, path:savedMediaPath, size:0,
                url:`https://media.pixverse.ai/${savedMediaPath}` }] } };
    }
    return null;
  }

  function modifySingleUpload(data) {
    if ([400040,500063,403,401].includes(data?.ErrCode) && savedMediaPath) {
      return { ErrCode:0, ErrMsg:"success", Resp:{
        path:savedMediaPath,
        url:`https://media.pixverse.ai/${savedMediaPath}`,
        name: savedMediaPath.split('/').pop()||'uploaded_media',
        type:1
      }};
    }
    return null;
  }

  function modifyResponse(data, url) {
    if (!data || typeof data !== "object") return null;
    if (matchesEndpoint(url, "credits"))      return tryModifyCredits(data);
    if (matchesEndpoint(url, "videoList"))    return modifyVideoList(data);
    if (matchesEndpoint(url, "batchUpload"))  return modifyBatchUpload(data);
    if (matchesEndpoint(url, "singleUpload")) return modifySingleUpload(data);
    return null;
  }

  //────── XHR OVERRIDE ──────//
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open;
    const oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m,u) {
      this._url    = u;
      this._method = m;
      return oOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      const url    = this._url    || "";
      const method = (this._method||"").toUpperCase();

      // Obfuscate creative prompts
      if (matchesEndpoint(url,"creativePrompt") && method==="POST" && body) {
        try {
          let obj = (typeof body==="string")?JSON.parse(body):body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            body = JSON.stringify(obj);
          }
        } catch{}
      }

      // **parseBody** for upload media path extraction
      if ((matchesEndpoint(url,"batchUpload")||matchesEndpoint(url,"singleUpload")) && body) {
        const data = parseBody(body);
        const p = extractMediaPath(data,url);
        if (p) savedMediaPath = p;
      }

      this.addEventListener("load", () => {
        if (this.status>=200 && this.status<300) {
          let resp;
          try {
            resp = this.responseType==="json"? this.response : JSON.parse(this.responseText||"{}");
          } catch{ resp=null; }
          if (resp!==null) {
            const m = modifyResponse(resp,url);
            if (m) {
              Object.defineProperties(this,{
                response:     { value: m, writable:false, configurable:true },
                responseText: { value: JSON.stringify(m), writable:false, configurable:true }
              });
            }
          }
        }
      }, { once:true });

      return oSend.apply(this, arguments);
    };
    log('XHR override initialized');
  }

  //────── FETCH OVERRIDE ──────//
  function overrideFetch() {
    const orig = window.fetch;
    window.fetch = async function(...args) {
      const url    = typeof args[0]==="string" ? args[0] : args[0]?.url||"";
      const init   = args[1];
      const method = (init?.method||"GET").toUpperCase();
      let   body   = init?.body;

      // Obfuscate creative prompts
      if (matchesEndpoint(url,"creativePrompt") && method==="POST" && body) {
        try {
          let obj = (typeof body==="string")?JSON.parse(body):body;
          if (obj.prompt) {
            obj.prompt = obfuscatePrompt(obj.prompt);
            args[1] = { ...init, body: JSON.stringify(obj) };
            body    = args[1].body;
          }
        } catch{}
      }

      // **parseBody** for upload media path extraction
      if ((matchesEndpoint(url,"batchUpload")||matchesEndpoint(url,"singleUpload")) && body) {
        const data = parseBody(body);
        const p    = extractMediaPath(data,url);
        if (p) savedMediaPath = p;
      }

      try {
        const res = await orig.apply(this, args);
        const ct  = res.headers.get("content-type")||"";
        if (ct.includes("application/json")) {
          const clone = res.clone();
          let json;
          try { json = await clone.json(); } catch{ json=null; }
          if (json!==null) {
            const m = modifyResponse(json,url);
            if (m) {
              const s = JSON.stringify(m);
              const h = new Headers(res.headers);
              h.set("Content-Type","application/json");
              return new Response(s, {
                status:     res.status,
                statusText: res.statusText,
                headers:    h
              });
            }
          }
        }
        return res;
      } catch(err) {
        error("Fetch error for",url,err);
        throw err;
      }
    };
    log('Fetch override initialized');
  }

  //────── CANONICAL DOWNLOAD BUTTON (NO DRIFT) ──────//
  function setupWatermarkButton() {
    if (btnAttached) return;
    let attemptCount = 0;

    function tryAttachButton() {
      // Uses working canonical logic: Look for button with a nested div whose text is exactly 'Download'
      // This is what works on Pixverse as of your latest test!
      let allBtns = document.querySelectorAll("button");
      for (let btn of allBtns) {
        // Look for a nested <div> with text "Download" (exact match, case-sensitive, as on the site)
        let labelDiv = Array.from(btn.querySelectorAll("div")).find(d => d.textContent && d.textContent.trim() === "Download");
        if (labelDiv && !btn.dataset.injected) {
          // Patch once only!
          btn.addEventListener("click", e => {
            e.stopPropagation();
            const v = document.querySelector(".component-video>video,video");
            if (v?.src) {
              const url = v.currentSrc || v.src;
              const a   = document.createElement("a");
              a.href    = url;
              a.download = url.split("/").pop() || "video.mp4";
              document.body.appendChild(a);
              a.click();
              a.remove();
              showToast("Download started!");
            } else showToast("No video found to download.");
          }, true);
          btn.dataset.injected = "1";
          btnAttached = true;
          log('[Pixverse++] Canonical Download button injected');
          break;
        }
      }
      // Retry up to MAX_ATTEMPTS for SPA navigations
      if (!btnAttached && attemptCount < MAX_ATTEMPTS) {
        attemptCount++;
        setTimeout(tryAttachButton, 350);
      }
    }

    tryAttachButton();
    // Also patch for React/SPAs by observing main content area:
    new MutationObserver(() => { if (!btnAttached) tryAttachButton(); })
      .observe(document.body, { childList:true, subtree:true });
  }

  //────── TOAST UI ──────//
  function showToast(msg,d=3500) {
    document.querySelectorAll(".pv-toast").forEach(e=>e.remove());
    const el = document.createElement("div");
    el.className="pv-toast"; el.textContent=msg;
    Object.assign(el.style,{
      position:"fixed",bottom:"22px",left:"50%",transform:"translateX(-50%)",
      background:"rgba(20,40,48,0.94)",color:"#15FFFF",padding:"8px 20px",
      borderRadius:"6px",font:"15px/1.2 sans-serif",zIndex:"299999",
      opacity:"0",transition:"opacity .25s",pointerEvents:"none"
    });
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.style.opacity="1");
    setTimeout(()=>{ el.style.opacity="0"; el.addEventListener("transitionend",()=>el.remove(),{once:true}); },d);
  }

  //────── ANTI-CONTEXTMENU ──────//
  function overrideContextMenuBlockers() {
    const o = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(t,h,o2){
      if (t==="contextmenu") return;
      return o.apply(this,arguments);
    };
    new MutationObserver(muts=>{
      muts.forEach(mu=>mu.addedNodes.forEach(n=>{
        if (n.nodeType===1) {
          if (n.hasAttribute("oncontextmenu")) n.removeAttribute("oncontextmenu");
          n.querySelectorAll("[oncontextmenu]").forEach(e=>e.removeAttribute("oncontextmenu"));
        }
      }));
    }).observe(document.documentElement,{childList:true,subtree:true});
    document.querySelectorAll("[oncontextmenu]").forEach(e=>e.removeAttribute("oncontextmenu"));
    log('Anti-contextmenu enabled');
  }

  //────── INITIALIZE ──────//
  function initialize() {
    if (isInitialized) return;
    try {
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      setupWatermarkButton();
      isInitialized = true;
      log('Pixverse++ initialized');
      showToast('Pixverse++ Toolkit loaded ✓');
    } catch(e) {
      error('Initialization failed',e);
      showToast('Pixverse++ init error');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once:true });
  } else {
    initialize();
  }

  // inject minimal toast CSS
  (function(){
    if (document.getElementById("pv-toast-css")) return;
    const s = document.createElement("style");
    s.id = "pv-toast-css";
    s.textContent = `.pv-toast{box-sizing:border-box;user-select:none;pointer-events:none;}`;
    document.head.appendChild(s);
  })();

})();
