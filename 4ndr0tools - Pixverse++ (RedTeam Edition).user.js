// ==UserScript==
// @name        4ndr0tools - Pixverse++ (RedTeam Edition)
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.3.3
// @description Redteam pentesting bypass & toolkit: credits patch, video/status unlock, robust download, NSFW bypass, anti-blockers, stealth mode, and inline uBO bullshit filters. For future-proofing and minimal footprint simply right-click and save your media.
// @match       https://app.pixverse.ai/*
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

(() => {
  'use strict';
  if (window._pixverseToolkitInitialized) return;
  window._pixverseToolkitInitialized = true;

  //────── CONFIG & CONSTANTS ──────//
  const API_ENDPOINTS = {
    credits:        /\/user\/credits(?:\?|$)/,
    videoList:      /\/video\/list\/personal/,
    batchUpload:    /\/media\/batch_upload_media/,
    singleUpload:   /\/media\/upload/,
    creativePrompt: /\/creative_platform\/video\//
  };
  const TRIGGER_WORDS = [
    "anal","asshole","anus","areola","areolas","blowjob","boobs","bounce","bouncing","breast","breasts",
    "bukake","buttcheeks","butt","cheeks","climax","clit","cleavage","cock","corridas","crotch","cum","cums","culo","cunt",
    "deep","deepthroat","ddick","dick","esperma","fat ass","fellatio","fingering","fuck","fucking","fucked","horny","lick","masturbate",
    "masterbating","member","meco","moan","moaning","nipple","nsfw","oral","orgasm","penis","phallus","pleasure",
    "pussy","rump","semen","slut","slutty","splooge","squeezing","squeeze","suck","sucking","swallow","throat","throating",
    "tits","tit","titty","titfuck","titties","tittydrop","tittyfuck","titfuck","vagina","wiener","whore","creampie","cumshot","cunnilingus",
    "doggystyle","ejaculate","ejaculation","handjob","jerk off","labia","nude","orgy","porn","prolapse",
    "rectum","rimjob","sesual","stripper","submissive","teabag","threesome","vibrator","voyeur"
  ];
  const NSFW_PROMPT_REGEX = new RegExp(
    `\\b(?:${TRIGGER_WORDS.map(str =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, "gi"
  );
  function obfuscatePrompt(prompt) {
    return prompt.replace(NSFW_PROMPT_REGEX, m => m.split('').join('\u200B'));
  }

  //────── HELPERS ──────//
  let savedMediaPath = null;
  let isInitialized  = false;
  function parseBody(body) {
    if (body instanceof FormData) { try { return Object.fromEntries(body); } catch { return null; } }
    if (typeof body === "string") { try { return JSON.parse(body); } catch { return null; } }
    return null;
  }
  function matchesEndpoint(url, key) { return API_ENDPOINTS[key]?.test(url); }
  function extractMediaPath(data, url) {
    if (!data || typeof data !== "object") return null;
    if (matchesEndpoint(url, "batchUpload") && Array.isArray(data.images))
      return data.images[0]?.path || null;
    if (matchesEndpoint(url, "singleUpload")) {
      if (typeof data.path === "string") return data.path;
      if (typeof data.media_path === "string") return data.media_path;
      for (const k in data) if (typeof data[k] === "string" && /\.mp4$/i.test(data[k])) return data[k];
    }
    return null;
  }

  //────── API PATCHERS ──────//
  function tryModifyCredits(data) {
    if (data?.Resp?.credits !== undefined) {
      const clone = structuredClone(data); clone.Resp.credits = 100;
      return clone;
    }
    return null;
  }
  function modifyVideoList(data) {
    if (!data?.Resp?.data) return data;
    const NSFW_PLACEHOLDERS = [
      "/nsfw", "/forbidden", "placeholder", "blocked", "ban", "pixverse-ban"
    ];
    function isNSFW(url) { if (!url) return false; return NSFW_PLACEHOLDERS.some(p => url.includes(p)); }
    const clone = structuredClone(data);
    clone.Resp.data = clone.Resp.data.map(item => {
      if (item.video_status === 7) item.video_status = 1;
      let preview =
        (item.extended === 1 && item.customer_paths?.customer_video_last_frame_url)
        || item.customer_paths?.customer_img_url || '';
      if (!isNSFW(preview) && preview)
        item.first_frame = preview;
      else if (item.video_path)
        item.first_frame = `https://media.pixverse.ai/${item.video_path}#t=0.2`;
      else
        item.first_frame = preview;
      item.url = item.video_path ? `https://media.pixverse.ai/${item.video_path}` : '';
      return item;
    });
    return clone;
  }
  function modifyBatchUpload(data) {
    if ([400,403,401].includes(data?.ErrCode) && savedMediaPath) {
      const id = Date.now(), name = savedMediaPath.split('/').pop() || 'uploaded_media';
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

  //────── INTERCEPTORS (STEALTH) ──────//
  function overrideXHR() {
    const oOpen = XMLHttpRequest.prototype.open, oSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(m,u) { this._url=u; this._method=m; return oOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function(body) {
      const url = this._url || "", method = (this._method||"GET").toUpperCase();
      if (matchesEndpoint(url,"creativePrompt") && method==="POST" && body) {
        try { let obj = (typeof body==="string")?JSON.parse(body):body;
          if (obj.prompt) { obj.prompt = obfuscatePrompt(obj.prompt); body = JSON.stringify(obj); }
        } catch{}
      }
      if ((matchesEndpoint(url,"batchUpload")||matchesEndpoint(url,"singleUpload")) && body) {
        const data = parseBody(body), p = extractMediaPath(data,url);
        if (p) savedMediaPath = p;
      }
      this.addEventListener("load", () => {
        if (this.status>=200 && this.status<300) {
          let resp;
          try { resp = this.responseType==="json"? this.response : JSON.parse(this.responseText||"{}"); } catch{ resp=null; }
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
  }
  function overrideFetch() {
    const orig = window.fetch;
    window.fetch = async function(...args) {
      const url = typeof args[0]==="string" ? args[0] : args[0]?.url||"", init = args[1], method = (init?.method||"GET").toUpperCase();
      let body = init?.body;
      if (matchesEndpoint(url,"creativePrompt") && method==="POST" && body) {
        try { let obj = (typeof body==="string")?JSON.parse(body):body;
          if (obj.prompt) { obj.prompt = obfuscatePrompt(obj.prompt); args[1] = { ...init, body: JSON.stringify(obj) }; body = args[1].body; }
        } catch{}
      }
      if ((matchesEndpoint(url,"batchUpload")||matchesEndpoint(url,"singleUpload")) && body) {
        const data = parseBody(body), p = extractMediaPath(data,url);
        if (p) savedMediaPath = p;
      }
      try {
        const res = await orig.apply(this, args), ct = res.headers.get("content-type")||"";
        if (ct.includes("application/json")) {
          const clone = res.clone();
          let json; try { json = await clone.json(); } catch{ json=null; }
          if (json!==null) {
            const m = modifyResponse(json,url);
            if (m) {
              const s = JSON.stringify(m), h = new Headers(res.headers);
              h.set("Content-Type","application/json");
              return new Response(s, { status: res.status, statusText: res.statusText, headers: h });
            }
          }
        }
        return res;
      } catch(err) { throw err; }
    };
  }

  //────── ANTI-BLOCKER: Context Menu ──────//
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
  }

  //────── UBO CSS FILTER INJECTION ──────//
  function injectUboCssFilters() {
    const cssRules = [
      ".top-14.gap-1.items-center.flex.bg-background-primary.py-2.px-4.sticky.z-20",
      ".overflow-hidden.rounded-xl.aspect-video.w-full",
      ".gap-9.flex-col.flex.max-lg\\:p-4.p-6.w-full",
      ".relative.cursor-pointer.flex-row.rounded-full.px-3.gap-1\\.5.text-xs.h-8.hover\\:text-text-white-primary.hover\\:bg-button-secondary-hover.border-border-third.border-solid.border-t.text-text-white-secondary.backdrop-blur-\\[32px\\].bg-button-secondary-normal.items-center.justify-center.flex.border-0.text-nowrap.font-medium.group\\/button",
      "#radix-\\:r1a\\:", "#radix-\\:r1g\\:", "#radix-\\:r1h\\:", "#radix-\\:r1b\\:",
      ".intercom-lightweight-app-launcher-icon-open.intercom-lightweight-app-launcher-icon",
      ".intercom-launcher.intercom-lightweight-app-launcher",
      ".absolute.top-0.left-0.right-0.bg-black.bg-opacity-30.pointer-events-none",
      ".fixed.z-50.inset-0.flex.items-center.justify-center",
      ".bg-primary-50", ".bg-secondary-50",
      ".gap-2.flex-col.flex.py-2",
      ".flex-col.flex.w-full.flex-1 > .gap-2.flex-col.flex.w-full",
      "#image_text-advanced > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative",
      "#image_text-quality > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative"
    ];
    const assetRules = [
      'img[src*="media.pixverse.ai/asset/media/footer_earned_bg.png?x-oss-process=style/cover-webp-small"]'
    ];
    const style = document.createElement("style");
    style.id = "ubo-pixverse-css";
    style.textContent = [
      ...cssRules.map(sel => `:root ${sel}{display:none!important;}`),
      ...assetRules.map(sel => `${sel}{display:none!important;}`)
    ].join("\n");
    document.head.appendChild(style);
  }

  //────── INITIALIZATION ──────//
  function initialize() {
    if (isInitialized) return;
    try {
      overrideContextMenuBlockers();
      overrideXHR();
      overrideFetch();
      injectUboCssFilters();
      isInitialized = true;
    } catch(e) {/*fail silently for stealth*/}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once:true });
  } else {
    initialize();
  }
})();
