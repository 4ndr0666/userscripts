// ==UserScript==
// @name                4ndr0tools - Prompt Master
// @namespace           https://github.com/4ndr0666/userscripts
// @version             26.1.1
// @author              4ndr0666
// @icon                https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @license             UNLICENSED - RED TEAM USE ONLY
// @description         Universal Prompt Manager.
// @match               *://grok.com/*
// @match               *://claude.ai/*
// @match               *://chatgpt.com/*
// @match               *://geminigen.ai/*
// @match               *://*.perplexity.ai/*
// @match               *://gist.github.com/*
// @match               *://gemini.google.com/*
// @match               *://aistudio.google.com/*
// @match               *://notebooklm.google.com/*
// @match               *://labs.google/fx/*
// @match               *://*.google.com/search?*udm=50*
// @exclude             *://ko-fi.com/summary/*
// @resource            CSS https://cdn.jsdelivr.net/gh/0H4S/My-Prompt@26.1.0/Files/style.min.css
// @resource            IDIOMAS https://cdn.jsdelivr.net/gh/0H4S/My-Prompt@26.1.0/Files/languages.min.json
// @connect             generativelanguage.googleapis.com
// @connect             gist.githubusercontent.com
// @connect             raw.githubusercontent.com
// @connect             router.huggingface.co
// @connect             api.longcat.chat
// @connect             cdn.jsdelivr.net
// @connect             gist.github.com
// @connect             api.github.com
// @connect             openrouter.ai
// @connect             api.groq.com
// @connect             gitlab.com
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_listValues
// @grant               GM_deleteValue
// @grant               GM_xmlhttpRequest
// @grant               GM_getResourceText
// @grant               GM_registerMenuCommand
// @run-at              document-end
// @noframes
// @compatible          chrome
// @compatible          firefox
// @compatible          edge
// @compatible          brave
// @compatible          opera
// @downloadURL         https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Prompt%20Master.user.js
// @updateURL           https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Prompt%20Master.user.js
// ==/UserScript==

(function() {
    'use strict';
    let isInitialized=!1,isInitializing=!1,currentPlatform=null,settingsModal=null,currentPlaceholderModal=null,infoModal=null,currentModal=null,currentMenu=null,currentButton=null,pageObserver=null,scriptPolicy=null;const policyNames=["MyPromptPolicy","dompurify","default","cwm-policy"];if(window.trustedTypes&&window.trustedTypes.createPolicy)for(const e of policyNames)try{scriptPolicy=window.trustedTypes.createPolicy(e,{createHTML:e=>e});break}catch(e){}function setSafeInnerHTML(e,t){e&&(e.innerHTML=scriptPolicy?scriptPolicy.createHTML(t):t)}const platformSelectors={chatgpt:"#prompt-textarea",deepseek:"textarea.ds-scroll-area",googleaistudio:"textarea",qwen:".message-input-textarea",zai:"textarea#chat-input",gemini:'div.ql-editor[contenteditable="true"]',arena:'textarea[name="message"]',kimi:'div.chat-input-editor[contenteditable="true"]',claude:'div.ProseMirror[contenteditable="true"]',grok:'div.tiptap.ProseMirror[contenteditable="true"], textarea',perplexity:"#ask-input",longcat:"div.tiptap.ProseMirror",mistral:".ProseMirror",yuanbao:'div.ql-editor[contenteditable="true"]',chatglm:"textarea.scroll-display-none",poe:'textarea[class*="GrowingTextArea_textArea"]',googleModoIA:"textarea.ITIRGe",notebooklm:"textarea.query-box-input",doubao:'textarea, [contenteditable="true"]',copilot:'#userInput, textarea[data-testid="composer-input"]',glmimage:"textarea.flex.w-full",flow:'div[role="textbox"][data-slate-editor="true"][contenteditable="true"]',ernie:'div[data-slate-editor="true"][role="textbox"]',dreamina:'textarea.lv-textarea.textarea-xle6zp.prompt-textarea-zqvueo, [contenteditable="true"]',jimengJianying:'textarea[class*="prompt-textarea"], div.ProseMirror',nvidiaNim:'textarea.nv-text-area-element[data-testid="nv-text-area-element"]',indicArena:'textarea[data-testid="rt-input-component"]',qianwen:'div[role="textbox"][data-slate-editor="true"], [contenteditable="true"]',geminigen:"textarea.w-full.rounded-md",hunyuan:"textarea, .ql-editor",bing:"#gi_form_q, textarea.b_searchbox",meta:'div[contenteditable="true"][data-testid="composer-input"]',manus:'div[contenteditable="true"].tiptap.ProseMirror',xiaomi:"textarea, textarea.resize-none"},LANG_STORAGE_KEY="UserScriptLang";let currentLang="en",languageModal=null,translations={};try{const e=GM_getResourceText("IDIOMAS");e&&(translations=JSON.parse(e))}catch(e){}
if(!translations.en)translations.en={};
const _gistStubs={gistSyncSettings:"Gist Sync",gistPatPlaceholder:"GitHub Personal Access Token (PAT)",gistIdPlaceholder:"Gist ID (auto-filled after first sync)",gistSyncDesc:"Sync your full backup to a private GitHub Gist. Create a PAT at github.com/settings/tokens with the 'gist' scope.",syncToGist:"Sync to Gist"};
8uC5jF+FHCCgfzK03
    const btn=t.querySelector("#__ap_do_gist_sync");
    const orig=btn.innerHTML;
    btn.disabled=true;
    setSafeInnerHTML(btn,ICONS.loading);
    try{
        const r=await pushBackupToGist();
        showNotification(r.created?"Gist created: "+r.url:"Gist updated successfully","success");
    }catch(err){
        await createDialogo({title:getTranslation("error"),message:err.message,type:"alert"});
    }finally{
        btn.disabled=false;
        setSafeInnerHTML(btn,orig);
    }
8uC5jF+FHCCgfzK04
const AUTO_BACKUP_KEY="AutoBackup";
const AUTO_BACKUP_KEYS=["AISettings","Prompts","GlobalFiles","PromptTags","Theme","ImportedThemes","ShortcutsConfig","NavConfig","Prediction","SyntaxHighlight","PreviewPrompt","UserScriptLang","DontShowAgain","GistConfig"];
let _autoBackupTimer=null;
async function takeAutoBackup(){
    try{
        const snapshot={};
        for(const k of AUTO_BACKUP_KEYS){
            const v=await GM_getValue(k);
            if(v!=null)snapshot[k]=v;
        }
        if(Object.keys(snapshot).length>0){
            await GM_setValue(AUTO_BACKUP_KEY,JSON.stringify(snapshot));
        }
    }catch(e){}
}
function scheduleAutoBackup(){
    if(_autoBackupTimer)clearTimeout(_autoBackupTimer);
    _autoBackupTimer=setTimeout(takeAutoBackup,1500);
}
async function restoreFromAutoBackup(){
    try{
        const existing=await GM_getValue("Prompts");
        const hasData=existing!=null&&(typeof existing==="object"?Object.keys(existing).length>0:true);
        if(hasData)return false;
        const raw=await GM_getValue(AUTO_BACKUP_KEY);
        if(!raw)return false;
        const snapshot=typeof raw==="string"?JSON.parse(raw):raw;
        if(!snapshot||typeof snapshot!=="object")return false;
        for(const[k,v]of Object.entries(snapshot)){
            await GM_setValue(k,v);
        }
        return true;
    }catch(e){return false;}
}

const GIST_CONFIG_KEY="GistConfig";
const DEFAULT_GIST_CONFIG={pat:"",gistId:""};
let currentGistConfig={...DEFAULT_GIST_CONFIG};
async function loadGistConfig(){
    try{
        const e=await GM_getValue(GIST_CONFIG_KEY);
        currentGistConfig=e?{...DEFAULT_GIST_CONFIG,...(typeof e==="string"?JSON.parse(e):e)}:{...DEFAULT_GIST_CONFIG};
    }catch(e){currentGistConfig={...DEFAULT_GIST_CONFIG};}
}
async function saveGistConfig(e){
    currentGistConfig={...currentGistConfig,...e};
    await GM_setValue(GIST_CONFIG_KEY,JSON.stringify(currentGistConfig));
}
async function pushBackupToGist(){
    const pat=currentGistConfig.pat.trim();
    if(!pat)throw new Error("No GitHub PAT configured. Add it in Settings → Advanced.");
    const snapshot={};
    for(const k of AUTO_BACKUP_KEYS){
        const v=await GM_getValue(k);
        if(v!=null)snapshot[k]=v;
    }
    const content=JSON.stringify({meta:{scriptName:"My Prompt",version:"26.1.1",exportDate:new Date().toISOString()},data:snapshot},null,2);
    const filename="MyPrompt_Backup.mp.backup.json";
    const isUpdate=!!currentGistConfig.gistId;
    const url=isUpdate
        ?`https://api.github.com/gists/${currentGistConfig.gistId}`
        :"https://api.github.com/gists";
    const method=isUpdate?"PATCH":"POST";
    const body=isUpdate
        ?{files:{[filename]:{content}}}
        :{description:"My Prompt — automatic backup",public:false,files:{[filename]:{content}}};
    return new Promise((resolve,reject)=>{
        GM_xmlhttpRequest({
            method,
            url,
            headers:{
                "Authorization":`Bearer ${pat}`,
                "Content-Type":"application/json",
                "Accept":"application/vnd.github+json",
                "X-GitHub-Api-Version":"2022-11-28"
            },
            data:JSON.stringify(body),
            onload:async e=>{
                if(e.status===200||e.status===201){
                    try{
                        const r=JSON.parse(e.responseText);
                        if(r.id&&r.id!==currentGistConfig.gistId){
                            await saveGistConfig({gistId:r.id});
                        }
                        resolve({created:!isUpdate,url:r.html_url});
                    }catch(err){reject(new Error("Failed to parse GitHub response"));}
                }else{
                    let msg=`GitHub API error ${e.status}`;
                    try{const r=JSON.parse(e.responseText);if(r.message)msg+=`: ${r.message}`;}catch(_){}
                    reject(new Error(msg));
                }
            },
            onerror:()=>reject(new Error("Network error contacting GitHub API"))
        });
    });
}
function installAutoBackupProxy(){
    const _orig=GM_setValue;
    GM_setValue=async function(key,value){
        await _orig(key,value);
        if(key!==AUTO_BACKUP_KEY)scheduleAutoBackup();
    };
}
const SYNTAX_STORAGE_KEY="SyntaxHighlight",DEFAULT_SYNTAX_CONFIG={enabled:!0};let currentSyntaxConfig=DEFAULT_SYNTAX_CONFIG;async function loadSyntaxConfig(){try{const e=await GM_getValue(SYNTAX_STORAGE_KEY);currentSyntaxConfig=e?JSON.parse(e):{...DEFAULT_SYNTAX_CONFIG}}catch(e){currentSyntaxConfig={...DEFAULT_SYNTAX_CONFIG}}}async function saveSyntaxConfig(e){currentSyntaxConfig=e,await GM_setValue(SYNTAX_STORAGE_KEY,JSON.stringify(e))}const SyntaxHighlighter=function(){"use strict";let e=null,t=null,n=null,a="",o=null,r=null;const s=()=>{e&&t&&(t.scrollTop=e.scrollTop,t.scrollLeft=e.scrollLeft)},i=()=>{if(!e||!t)return;const n=e.value;n!==a&&(a=n,setSafeInnerHTML(t,(e=>{if(!e)return"\n";let t=(e=>{const t={"&":"&amp;","<":"&lt;",">":"&gt;"};return e.replace(/[&<>]/g,e=>t[e])})(e);const n=[],a=e=>{const t=n.length;return n.push(e),`\0${t}\0`};return t=t.replace(/([ \t]*)(#+)(ignore)([ \t]*(?:\r?\n)?)([\s\S]*?)((?:\r?\n)?[ \t]*)(\2)(end)/gi,(e,t,n,o,r,s,i,l,c)=>a(`<span class="mp-syn-ign-f">${t}${n}${o}</span>${r}<span class="mp-syn-ign-c">${s}</span>${i}<span class="mp-syn-ign-f">${l}${c}</span>`)),t=t.replace(/\\([#\[\]{}':])/g,e=>a(`<span class="mp-syn-esc">${e}</span>`)),t=t.replace(/('{2,})([\s\S]*?)\1/g,(e,t,n)=>a(`<span class="mp-syn-qt-f">${t}</span><span class="mp-syn-qt-c">${n}</span><span class="mp-syn-qt-f">${t}</span>`)),t=t.replace(/#(date|time)((?:-[YMDHS]{2})*)(?:\+(date|time)((?:-[YMDHS]{2})*))?/gi,(e,t,n,o,r)=>{let s=`<span class="mp-syn-dt-k">#${t}</span>`;return n&&(s+=`<span class="mp-syn-dt-f">${n}</span>`),o&&(s+=`<span class="mp-syn-dt-k">+${o}</span>`,r&&(s+=`<span class="mp-syn-dt-f">${r}</span>`)),a(s)}),t=t.replace(/#file(?:\(([^)]*)\))?/gi,(e,t)=>{let n='<span class="mp-syn-fl-k">#file</span>';return void 0!==t&&(n+='<span class="mp-syn-fl-p">(</span>',n+=`<span class="mp-syn-fl-t">${t}</span>`,n+='<span class="mp-syn-fl-p">)</span>'),a(n)}),t=t.replace(/([ \t]*)(#+)(start)([ \t]*(?:\r?\n)?)([\s\S]*?)((?:\r?\n)?[ \t]*)(\2)(end)/gi,(e,t,n,o,r,s,i,l,c)=>{let d=s;return d=d.replace(/(^|\/\/)([ \t]*)(#)(\s*)([^#\n][^\n]*?)(?=\/\/|\r?\n|$)/gm,(e,t,n,a,o,r)=>`${t}${n}<span class="mp-syn-sl-hh">${a}</span>${o}<span class="mp-syn-sl-h">${r}</span>`),d=d.replace(/(\/\/)/g,'<span class="mp-syn-sl-sep">$1</span>'),d=d.replace(/([+\-]|\d+)(\s*)(\[)([^\]]*)(\])/g,(e,t,n,a,o,r)=>{let s="mp-syn-sl-p-id";"+"===t?s="mp-syn-sl-p-multi":"-"===t&&(s="mp-syn-sl-p-single");let i=o;const l=o.match(/^([\s\S]*?)(::\s*[xX]\s*)$/);return i=l?`<span class="${s}">${l[1]}</span><span class="mp-syn-sel-chk">${l[2]}</span>`:`<span class="${s}">${o}</span>`,`<span class="${s}">${t}</span>${n}<span class="${s}">${a}</span>`+i+`<span class="${s}">${r}</span>`}),d=d.replace(/(\[)(#)(\])/g,(e,t,n,a)=>{const o="mp-syn-sl-p-other";return`<span class="${o}">${t}</span><span class="${o}">${n}</span><span class="${o}">${a}</span>`}),d=d.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g,(e,t)=>`<span class="mp-syn-qt-f">'</span><span class="mp-syn-qt-c">${t}</span><span class="mp-syn-qt-f">'</span>`),a(`<span class="mp-syn-sl-f">${t}${n}${o}</span>${r}`+d+`${i}<span class="mp-syn-sl-f">${l}${c}</span>`)}),t=t.replace(/(\{)([^}=]+?)(\s*=\s*)(\$[a-zA-Z0-9_]+)([^}]*)(\})(?:\(([^)]*)\))?/g,(e,t,n,o,r,s,i,l)=>{let c=`<span class="mp-syn-sil-b">${t}</span><span class="mp-syn-sil-l">${n}</span><span class="mp-syn-sil-e">${o}</span><span class="mp-syn-sil-v">${r}</span>`;if(s){const e=s.match(/^([\s\S]*?)(::)([\s\S]*)$/);c+=e?e[1]+`<span class="mp-syn-def-s">${e[2]}</span>`+`<span class="mp-syn-def-v">${e[3]}</span>`:s}return c+=`<span class="mp-syn-sil-b">${i}</span>`,void 0!==l&&(c+=`<span class="mp-syn-in-c">(${l})</span>`),a(c)}),t=t.replace(/(\[)([^\]=]+?)(\s*=\s*)(\$[a-zA-Z0-9_]+)([^\]]*)(\])(?:\(([^)]*)\))?/g,(e,t,n,o,r,s,i,l)=>{let c=`<span class="mp-syn-in-b">${t}</span><span class="mp-syn-in-l">${n}</span><span class="mp-syn-in-e">${o}</span><span class="mp-syn-in-v">${r}</span>`;if(s){const e=s.match(/^([\s\S]*?)(::)([\s\S]*)$/);c+=e?e[1]+`<span class="mp-syn-def-s">${e[2]}</span>`+`<span class="mp-syn-def-v">${e[3]}</span>`:s}return c+=`<span class="mp-syn-in-b">${i}</span>`,void 0!==l&&(c+=`<span class="mp-syn-in-c">(${l})</span>`),a(c)}),t=t.replace(/(\[)([^\]]+?)(\])(?:\(([^)]*)\))?/g,(e,t,n,o,r)=>{if(n.includes("\0"))return e;let s=`<span class="mp-syn-free-b">${t}</span>`;const i=n.match(/^([\s\S]*?)(::)([\s\S]*)$/);return s+=i?`<span class="mp-syn-free-l">${i[1]}</span><span class="mp-syn-def-s">${i[2]}</span><span class="mp-syn-def-v">${i[3]}</span>`:`<span class="mp-syn-free-l">${n}</span>`,s+=`<span class="mp-syn-free-b">${o}</span>`,void 0!==r&&(s+=`<span class="mp-syn-in-c">(${r})</span>`),a(s)}),t=t.replace(/(\$[a-zA-Z0-9_]+)/g,(e,t)=>a(`<span class="mp-syn-var">${t}</span>`)),(e=>{for(let t=n.length-1;t>=0;t--)e=e.split(`\0${t}\0`).join(n[t]);return e})(t)+"\n"})(n)),s())},l=()=>{o&&cancelAnimationFrame(o),o=requestAnimationFrame(i)},c=()=>l(),d=()=>s(),p=()=>{o&&(cancelAnimationFrame(o),o=null),r&&(r.disconnect(),r=null),e&&(e.classList.remove("mp-syntax-enabled"),e.removeEventListener("input",c),e.removeEventListener("scroll",d),e.removeEventListener("keydown",c),delete e.syntaxUpdate,delete e.syntaxClear,n&&n.parentElement&&(n.parentElement.insertBefore(e,n),n.remove())),e=null,t=null,n=null,a=""};return{attach:o=>{if(void 0!==currentSyntaxConfig&&!currentSyntaxConfig.enabled)return void p();if(!(o&&o instanceof HTMLTextAreaElement))return;if(e===o&&t)return a="",void i();p(),e=o,a="";const s=o.closest(".mp-scroll-content")||o.parentElement;if(!s)return;n=document.createElement("div"),n.className="mp-syntax-container",t=document.createElement("div"),t.className="mp-syntax-backdrop",t.setAttribute("aria-hidden","true");const m=getComputedStyle(o);t.style.fontSize=m.fontSize,t.style.lineHeight=m.lineHeight,t.style.fontFamily=m.fontFamily,t.style.padding=m.padding,s.insertBefore(n,o),n.appendChild(t),n.appendChild(o),o.classList.add("mp-syntax-enabled"),o.addEventListener("input",c),o.addEventListener("scroll",d),o.addEventListener("keydown",c),r=new MutationObserver(()=>{l()}),r.observe(o,{attributes:!0,attributeFilter:["value"]}),o.syntaxUpdate=()=>{a="",i()},o.syntaxClear=()=>{a="",t&&setSafeInnerHTML(t,"\n")},i()},detach:p,refresh:()=>{a="",i()}}}();function initKofiPatreonFeature(){if(!window.location.hostname.includes("ko-fi.com"))return;const e=()=>{const e=getTranslation("buyPatreon"),t=document.querySelector(".mp-patreon-button");if(t)return void(t.innerText!==e&&(t.innerText=e));const n=document.getElementById("addToCartButton"),a=document.querySelector(".kfds-c-word-wrap");if(!n||!a)return;const o=a.innerHTML.match(/Patreon:\s*<a[^>]*href="(https?:\/\/(?:www\.)?patreon\.com\/[^"]+)"/i);if(o&&o[1]){const t=o[1],a=n.parentElement,r=document.createElement("a");r.href=t,r.target="_blank",r.rel="nofollow noreferrer",r.innerText=e,r.className="kfds-lyt-width-100 kfds-c-btn-primary kfds-font-bold kfds-srf-rounded kfds-font-size-20 kfds-btm-mrgn-16 mp-patreon-button",a.appendChild(r)}};new MutationObserver(()=>{e()}).observe(document.body,{childList:!0,subtree:!0}),e()}function detectPlatform(){const e=window.location.hostname;return e.includes("chatgpt.com")?"chatgpt":e.includes("deepseek.com")?"deepseek":e.includes("aistudio.google.com")?"googleaistudio":e.includes("chat.qwen.ai")?"qwen":e.includes("chat.z.ai")?"zai":e.includes("gemini.google.com")?"gemini":e.includes("arena.ai4bharat.org")?"indicArena":e.includes("arena.ai")?"arena":e.includes("kimi.com")?"kimi":e.includes("claude.ai")?"claude":e.includes("grok.com")?"grok":e.includes("www.perplexity.ai")?"perplexity":e.includes("longcat.chat")?"longcat":e.includes("mistral.ai")?"mistral":e.includes("yuanbao.tencent.com")?"yuanbao":e.includes("chatglm.cn")?"chatglm":e.includes("poe.com")?"poe":e.includes("notebooklm.google.com")?"notebooklm":e.includes("doubao.com")?"doubao":e.includes("copilot.microsoft.com")?"copilot":e.includes("image.z.ai")?"glmimage":e.includes("ernie.baidu.com")?"ernie":e.includes("dreamina.capcut.com")?"dreamina":e.includes("jimeng.jianying.com")?"jimengJianying":e.includes("build.nvidia.com")?"nvidiaNim":e.includes("qianwen")?"qianwen":e.includes("geminigen.ai")?"geminigen":e.includes("aistudio.tencent.com")?"hunyuan":e.includes("bing.com")?"bing":e.includes("gist.github.com")?"gist":e.includes("ko-fi.com")?"kofi":e.includes("meta.ai")?"meta":e.includes("manus.im")?"manus":e.includes("aistudio.xiaomimimo.com")?"xiaomi":e.includes("labs.google")&&window.location.pathname.includes("/tools/flow")?"flow":e.includes("google.com")&&window.location.pathname.includes("/search")&&window.location.search.includes("udm=50")?"googleModoIA":null}function getSendButton(){switch(currentPlatform){case"chatgpt":return document.querySelector('[data-testid="send-button"]')||document.querySelector("#composer-submit-button")||document.querySelector('button.composer-submit-btn:has(svg use[href*="sprites-core"])');case"deepseek":return document.querySelector('div[role="button"]:has(svg path[d^="M8.3125 0.981587"])')||document.querySelector('div[role="button"]:has(svg path[d^="M8.31"])')||document.querySelector(".ds-icon-button:has(path)");case"googleaistudio":return document.querySelector('ms-run-button button[type="submit"]')||document.querySelector("ms-run-button button.ms-button-primary")||document.querySelector("ms-run-button button:has(.material-symbols-outlined)");case"qwen":return document.querySelector("button.send-button")||document.querySelector('button.send-button:has(path[d^="M836.43"])')||document.querySelector(".chat-prompt-send-button button");case"zai":return document.querySelector("#send-message-button")||document.querySelector('button.sendMessageButton[type="submit"]')||document.querySelector('button:has(svg path[d^="M8 13.3333V2.66667M8 2.66667L4"])');case"gemini":return document.querySelector("button.send-button.submit")||document.querySelector('button:has(mat-icon[data-mat-icon-name="send"])')||document.querySelector(".send-button-container button");case"arena":return document.querySelector('button[type="submit"]:has(svg path[d^="M3 12L21 12M21 12L12.5"]))')||document.querySelector('button[type="submit"]:has(svg path[d^="M3 12"])')||document.querySelector('button.active\\:bg-interactive-cta-active[type="submit"]');case"kimi":return document.querySelector('.send-button-container:has(svg path[d^="M705.536"])')||document.querySelector('.send-button-container:has(svg[name="Send"])')||document.querySelector(".send-button-container .send-icon");case"claude":return document.querySelector('button:has(svg path[d^="M208.49,120.49"])')||document.querySelector('button[type="button"]:has(svg[viewBox="0 0 256 256"])')||document.querySelector("div.shrink-0 > div > div > button:has(svg)");case"grok":return document.querySelector('button[type="submit"]:has(path[d^="M6 11L12 5"]))')||document.querySelector('button:has(svg path[d^="M6 11"])')||document.querySelector('button[type="submit"]:has(svg)');case"perplexity":return document.querySelector('button:has(use[xlink:href*="arrow-right"])')||document.querySelector('button:has(svg use[href*="arrow-right"])')||document.querySelector("button.bg-button-bg:has(svg)");case"longcat":return document.querySelector('.send-btn:has(use[href*="send"])')||document.querySelector('.send-btn:has(path[d^="M13.6165"])')||document.querySelector(".send-wrap .send-btn");case"mistral":return document.querySelector('button[type="submit"]:has(svg path[d^="M12 18v4h4v-4h-4Z"])')||document.querySelector('button[type="submit"]:has(svg.-rotate-90)')||document.querySelector('button.bg-state-primary[type="submit"]');case"yuanbao":return document.querySelector("#yuanbao-send-btn")||document.querySelector("a:has(span.icon-send)")||document.querySelector("a.style__send-btn");case"poe":return document.querySelector('button[data-button-send="true"]')||document.querySelector('button:has(svg path[d^="M11.293 4.293"])')||document.querySelector('button:has(svg path[d^="M11.293"])');case"googleModoIA":return document.querySelector('button[data-xid="input-plate-send-button"]')||document.querySelector('button:has(svg path[d^="M440-160v-487"])')||document.querySelector('button:has(svg path[d^="M440"])');case"notebooklm":return document.querySelector("button.submit-button")||document.querySelector('button[type="submit"]:has(mat-icon)')||document.querySelector('button:has(mat-icon:contains("arrow_forward"))');case"doubao":return document.querySelector("#flow-end-msg-send")||document.querySelector('button:has(svg path[d^="m3.543 8.883"])')||document.querySelector(".send-btn-wrapper button");case"copilot":return document.querySelector('button[data-testid="submit-button"]')||document.querySelector('button:has(svg path[d^="M4.20889 10.7327"])')||document.querySelector('button:has(svg path[d^="M4.20889"])');case"glmimage":return document.querySelector('button:has(img[src*="generate-icon"])')||document.querySelector('button:has(img[alt="generate"])')||document.querySelector("button.bg-black:has(img)");case"ernie":return document.querySelector('div[class^="send"] div[class^="btnContainer"] span:has(svg path[d^="M43,-63.43"]))')||document.querySelector('span[class*="sendBtnLottie"]');case"dreamina":return document.querySelector('button:has(svg path[d^="M12.002 3"])')||document.querySelector("button.submit-button-6qXI49")||document.querySelector('button[type="button"]:has(path[data-follow-fill])');case"jimengJianying":return document.querySelector('button:has(svg path[d^="M12.002 3"])')||document.querySelector("button.submit-button-xdhu0e")||document.querySelector("button:has(path[data-follow-fill])");case"nvidiaNim":return document.querySelector('button:has(svg[data-icon-name="paperplane"]))')||document.querySelector('button:has(svg path[d^="M0.747,1.623"])')||document.querySelector('button.btn-primary:has(use[href^="#paperplane"]))');case"indicArena":return document.querySelector('button[type="submit"]:has(svg path[d^="M14.536"]))')||document.querySelector("button:has(svg.lucide-send)")||document.querySelector('button[type="submit"]:has(svg)');case"qianwen":return document.querySelector('button:has(span[data-icon-type*="send"]))')||document.querySelector('button:has(svg use[*|href^="#qwpcicon-sendChat"]))')||document.querySelector('button:has(path[d^="M554.24 85.76"])');case"geminigen":return document.querySelector('div.flex.justify-end.gap-2.items-center > button:not([disabled]):not([aria-disabled="true"])');case"hunyuan":return document.querySelector("button.ma-model-run-body__params-button")||document.querySelector("a:has(span.icon-send)")||document.querySelector(".sendBtn");case"bing":return document.querySelector("#create_btn_c")||document.querySelector('#create_btn_wrapper [role="button"]')||document.querySelector(".create_btn_wrapper a.linkBtn");case"flow":return document.querySelector('button:has(i.google-symbols:contains("arrow_forward"))')||document.querySelector("button i.google-symbols").parentElement||document.querySelector('button:has(span[style*="clip"])');case"meta":return document.querySelector('button:has(svg path[d^="M16 6.125"])')||document.querySelector('button[data-slot="button"]:has(svg)')||document.querySelector('button:has(svg[viewBox="0 0 32 32"])');case"manus":return document.querySelector('button:has(svg path[d^="M7.91699 15.0642C7.53125 15.0642"])');case"xiaomi":return document.querySelector('button[data-track-id="home_send_btn"]')||document.querySelector('button:has(svg path[d^="M.244 7.921"])');default:return null}}function isEditorEmpty(e){if(!e||!e.isConnected)return!0;const t=e.tagName.toLowerCase();if("textarea"===t||"input"===t)return 0===e.value.replace(/[\s\u200B\u00A0\uFEFF\u200C\u200D\r\n]/g,"").length;if(e.querySelector('img, canvas, video, [type="file"], [class*="attachment"], [class*="file-item"]'))return!1;const n=e.innerHTML.trim();if(""===n||"<p><br></p>"===n||"<p></p>"===n||"<br>"===n||"<div><br></div>"===n)return!0;if(e.classList.contains("is-empty")||e.classList.contains("ProseMirror-empty")||e.classList.contains("ql-blank"))return!0;const a=e.cloneNode(!0);a.querySelectorAll('[data-slate-placeholder], [data-placeholder], [class*="placeholder"]').forEach(e=>e.remove());let o=a.textContent||a.innerText||"";return o=o.replace(/[\s\u200B\u00A0\uFEFF\u200C\u200D\r\n]/g,""),0===o.length}function waitForUploadAndClick(e,t=12e4){const n=Date.now(),a=setInterval(()=>{if(Date.now()-n>t)return void clearInterval(a);if(isEditorEmpty(e))return void clearInterval(a);const o=getSendButton();if(!o)return;const r=o.disabled||"true"===o.getAttribute("aria-disabled"),s=window.getComputedStyle(o),i="not-allowed"===s.cursor||parseFloat(s.opacity)<.5,l="none"===s.display||"hidden"===s.visibility;r||i||l||o.click()},800)}function forceUpload(e,t=12e4){const n=Date.now(),a=setInterval(()=>{if(Date.now()-n>t||isEditorEmpty(e))clearInterval(a);else try{e.isConnected&&e.focus();const t=new KeyboardEvent("keydown",{key:"Enter",code:"Enter",which:13,keyCode:13,bubbles:!0,cancelable:!0});e.dispatchEvent(t)}catch(e){}},800)}async function insertPrompt(e,t=!1,n=!1){let a=document.querySelector(platformSelectors[currentPlatform]);if(!a)return;a.focus();const o=navigator.userAgent.toLowerCase().includes("firefox");let r=!1,s=0;const i=[];if(e.activeFileIds&&e.activeFileIds.length>0){(await getGlobalFiles()).forEach(t=>{e.activeFileIds.includes(t.id)&&(s+=t.size,i.push(dataURLtoFile(t.data,t.name)))})}if(e.dynamicFiles&&e.dynamicFiles.length>0&&e.dynamicFiles.forEach(e=>{s+=e.size,i.push(e)}),i.length>0){r=!0,s=1500+s/1024/100*100;const e=new DataTransfer;if(i.forEach(t=>e.items.add(t)),"gemini"===currentPlatform||"perplexity"===currentPlatform)if(o){let t=document.querySelector("[data-filedrop-id]")||document.querySelector(".chat-window-input-container")||a;["dragenter","dragover","drop"].forEach(n=>{const a=new DragEvent(n,{bubbles:!0,cancelable:!0,dataTransfer:e});t.dispatchEvent(a)})}else{const t=new ClipboardEvent("paste",{bubbles:!0,cancelable:!0,clipboardData:e});a.dispatchEvent(t)}else{let t=!1;if(["qwen","longcat","grok","mistral","googleaistudio","yuanbao","ernie","indicArena","googleModoIA","kimi","jimengJianying","dreamina","manus"].includes(currentPlatform)){let n=document.querySelector(".chat-input-container")||document.querySelector("form")||a;["dragenter","dragover","drop"].forEach(t=>{const a=new DragEvent(t,{bubbles:!0,cancelable:!0,dataTransfer:e});n.dispatchEvent(a)}),t=!0}if(!t){let t=document.querySelector('input[type="file"]');if(t)try{t.value="",t.files=e.files,t.dispatchEvent(new Event("change",{bubbles:!0})),t.dispatchEvent(new Event("input",{bubbles:!0}))}catch(e){}else["dragenter","dragover","drop"].forEach(t=>{const n=new DragEvent(t,{bubbles:!0,cancelable:!0,dataTransfer:e});a.dispatchEvent(n)})}}}if(setTimeout(()=>{const s=(t=!1)=>{a.focus();const n=window.getSelection(),o=document.createRange();o.selectNodeContents(a),o.collapse(!1),n.removeAllRanges(),n.addRange(o),t||a.dispatchEvent(new InputEvent("beforeinput",{bubbles:!0,cancelable:!0,inputType:"insertText",data:e.text}));const r=new DataTransfer;r.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:r,bubbles:!0,cancelable:!0})),a.dispatchEvent(new Event("input",{bubbles:!0}))};if("claude"===currentPlatform||"grok"===currentPlatform||"dreamina"===currentPlatform)if(a.focus(),"TEXTAREA"===a.tagName||"INPUT"===a.tagName){const t=a.selectionStart||0,n=a.selectionEnd||0,o=a.value.substring(0,t)+e.text+a.value.substring(n),r=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;r?r.call(a,o):a.value=o,setTimeout(()=>{a.selectionStart=a.selectionEnd=t+e.text.length},0),a.dispatchEvent(new Event("input",{bubbles:!0}))}else{o&&""===a.textContent.trim()&&(a.innerHTML="");const t=window.getSelection(),n=document.createRange();n.selectNodeContents(a),n.collapse(!1),t.removeAllRanges(),t.addRange(n);const r=e.text.split("\n");let s="";r.forEach(e=>{""===e.trim()?s+="<p><br></p>":s+=`<p>${e}</p>`});if(!document.execCommand("insertHTML",!1,s)){const t=new DataTransfer;t.setData("text/html",s),t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0}))}a.dispatchEvent(new Event("input",{bubbles:!0}))}else if(!o||"kimi"!==currentPlatform&&"perplexity"!==currentPlatform&&"qwen"!==currentPlatform&&"meta"!==currentPlatform)if(!o||"chatgpt"!==currentPlatform&&"longcat"!==currentPlatform&&"mistral"!==currentPlatform&&"yuanbao"!==currentPlatform&&"jimengJianying"!==currentPlatform&&"manus"!==currentPlatform)if("gemini"===currentPlatform)if(a.focus(),o){let t=a.querySelector("p")||document.createElement("p");t.textContent+=e.text,a.contains(t)||a.appendChild(t),a.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}else{if(!document.execCommand("insertText",!1,e.text)){const t=document.createTextNode(e.text);a.appendChild(t)}a.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}else if("hunyuan"===currentPlatform){if(a.isContentEditable&&(a.hasAttribute("data-slate-editor")||null!==a.querySelector("[data-slate-node]")||null!==a.closest("[data-slate-editor]")))s();else if(a.focus(),o){a.isContentEditable&&""===a.textContent.trim()&&(a.innerHTML="");if(!document.execCommand("insertText",!1,e.text)){const t=new DataTransfer;t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0}))}a.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}else{const t=new DataTransfer;if(t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0})),void 0!==a.value&&!a.value.includes(e.text)){let t=a.value+e.text;if(n&&"number"==typeof a.selectionStart){const n=a.selectionStart;t=a.value.substring(0,n)+e.text+a.value.substring(a.selectionEnd),setTimeout(()=>{a.selectionStart=a.selectionEnd=n+e.text.length},0)}const o=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;o?o.call(a,t):a.value=t,a.dispatchEvent(new Event("input",{bubbles:!0}))}}}else if("doubao"===currentPlatform)if(a.isContentEditable){s(!o)}else if(a.focus(),o){if(!document.execCommand("insertText",!1,e.text)){const t=new DataTransfer;t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0}))}a.dispatchEvent(new Event("input",{bubbles:!0,composed:!0}))}else{const t=new DataTransfer;if(t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0})),void 0!==a.value&&!a.value.includes(e.text)){let t=a.value+e.text;if(n&&"number"==typeof a.selectionStart){const n=a.selectionStart;t=a.value.substring(0,n)+e.text+a.value.substring(a.selectionEnd),setTimeout(()=>{a.selectionStart=a.selectionEnd=n+e.text.length},0)}const o=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;o?o.call(a,t):a.value=t,a.dispatchEvent(new Event("input",{bubbles:!0}))}}else if("flow"===currentPlatform||"qianwen"===currentPlatform||"ernie"===currentPlatform){s(("qianwen"===currentPlatform||"ernie"===currentPlatform)&&!o)}else{const t=new DataTransfer;if(t.setData("text/plain",e.text),a.dispatchEvent(new ClipboardEvent("paste",{clipboardData:t,bubbles:!0,cancelable:!0})),void 0!==a.value&&!a.value.includes(e.text)){let t=a.value+e.text;if(n&&"number"==typeof a.selectionStart){const n=a.selectionStart;t=a.value.substring(0,n)+e.text+a.value.substring(a.selectionEnd),setTimeout(()=>{a.selectionStart=a.selectionEnd=n+e.text.length},0)}const o=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,"value").set;o?o.call(a,t):a.value=t,a.dispatchEvent(new Event("input",{bubbles:!0}))}}else{""===a.textContent.trim()&&(a.innerHTML="");e.text.split("\n").forEach(e=>{const t=document.createElement("p");""===e.trim()?t.appendChild(document.createElement("br")):t.textContent=e,a.appendChild(t)}),a.dispatchEvent(new Event("input",{bubbles:!0,composed:!0})),a.focus();const t=document.createRange();t.selectNodeContents(a),t.collapse(!1);const n=window.getSelection();n.removeAllRanges(),n.addRange(t)}else a.focus(),document.execCommand("insertText",!1,e.text);n||moveCursorToEnd(a),e.autoExecute&&!t&&("chatglm"===currentPlatform||"indicArena"===currentPlatform||"grok"===currentPlatform||"perplexity"===currentPlatform||"nvidiaNim"===currentPlatform||"ernie"===currentPlatform||"jimengJianying"===currentPlatform||"dreamina"===currentPlatform||"arena"===currentPlatform?forceUpload(a):r?waitForUploadAndClick(a):setTimeout(()=>{let e=!1;try{const t=getSendButton();if(t){t.disabled||"true"===t.getAttribute("aria-disabled")||(t.click(),e=!0)}}catch(e){}if(!e)try{const e=new KeyboardEvent("keydown",{key:"Enter",code:"Enter",which:13,keyCode:13,bubbles:!0,cancelable:!0});a.dispatchEvent(e)}catch(e){}},150))},100),e.id){let t=await getAll();const n=t.findIndex(t=>t.id===e.id);if(-1!==n&&!t[n].isFixed){const[e]=t.splice(n,1);let a=t.findIndex(e=>!e.isFixed);-1===a&&(a=t.length),t.splice(a,0,e),normalizePositions(t),await saveRawPrompts(promptsToStorage(t))}}}function insertIntoGistEditor(e,t,n){const a=e.querySelector("input.js-gist-filename");a&&(a.value=t,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0})));const o=e.querySelector('.CodeMirror-code[contenteditable="true"]');if(o){o.focus();const e=document.createRange();e.selectNodeContents(o);const t=window.getSelection();t.removeAllRanges(),t.addRange(e);if(!document.execCommand("insertText",!1,n)){const e=new DataTransfer;e.setData("text/plain",n);const t=new ClipboardEvent("paste",{clipboardData:e,bubbles:!0,cancelable:!0});o.dispatchEvent(t)}}else{const t=e.querySelector(".CodeMirror textarea"),a=e.querySelector("textarea.js-file-textarea"),o=t||a;o&&(o.focus(),o.value=n,o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0})))}}function exportJsonAsSingleFile(e){const t=e.map(e=>({title:e.title,text:e.text,usePlaceholders:e.usePlaceholders,autoExecute:e.autoExecute})),n=1===e.length?`${(e[0].title||"Prompt").replace(/[<>:"/\\|?*]/g,"").trim()}.mp.prompt.json`:`Prompts_MyPrompt_${Date.now()}.mp.prompt.json`,a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(t,null,2)],{type:"application/json"})),a.download=n,a.click(),URL.revokeObjectURL(a.href)}async function exportJsonAsMultipleFiles(e){if(e.length>1){if(!await createDialogo({title:getTranslation("confirmDownload"),message:getTranslation("confirmDownloads",{count:e.length}),dontShowAgainId:"confirm-export-download",type:"confirm"}))return}for(const t of e){const e={title:t.title,text:t.text,usePlaceholders:t.usePlaceholders,autoExecute:t.autoExecute},n=document.createElement("a");n.href=URL.createObjectURL(new Blob([JSON.stringify(e,null,2)],{type:"application/json"}));const a=(t.title||"Prompt").replace(/[<>:"/\\|?*]/g,"").trim();n.download=`${a||"Prompt"}.mp.prompt.json`,n.style.display="none",document.body.appendChild(n),n.click(),document.body.removeChild(n),await new Promise(e=>setTimeout(e,200))}}async function openExportMenu(e=null){closeMenu();const t=document.createElement("div");t.className="mp-overlay",t.id="__ap_export_overlay";const n=document.createElement("div");n.className="mp-modal-box",n.onclick=e=>e.stopPropagation();const a=await getAll(),o=new Set(a.map(e=>e.id));let r=-1;const s=e?`<button id="__ap_do_gist_insert" class="save-button" style="width:100%">${getTranslation("inserirGist")}</button>`:`<button id="__ap_share_gist" class="save-button mp-btn-secondary" style="margin-right:auto">${getTranslation("shareGist")}</button><button id="__ap_do_export_txt" class="save-button">TXT</button><button id="__ap_do_export_json" class="save-button">JSON</button>`;setSafeInnerHTML(n,` <button id="__ap_close_export" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${getTranslation(e?"exportGist":"export")}</h2><div class="mp-search-container"><input type="text" id="__ap_export_search" class="mp-search-input" placeholder="${getTranslation("search")}" autocomplete="off"><div class="mp-export-actions"><label class="mp-checkbox-wrapper" style="cursor:pointer; user-select:none;"><input type="checkbox" id="__ap_select_all" class="mp-checkbox" checked><span style="margin-left:8px;">${getTranslation("selectAll")}</span></label><span id="__ap_count_label"></span></div></div><div class="mp-export-list" id="__ap_export_list"></div><div class="mp-export-buttons"> ${s} </div> `),t.appendChild(n),document.body.appendChild(t),requestAnimationFrame(()=>t.classList.add("visible"));const i=n.querySelector("#__ap_export_list");function l(e,t,n,a){if(a&&-1!==r&&r!==t){const e=Array.from(i.querySelectorAll(".prompt-selector")),a=Math.min(r,t),s=Math.max(r,t);for(let t=a;t<=s;t++){const a=e.find(e=>parseInt(e.dataset.idx)===t);a&&(a.checked=n,n?o.add(a.dataset.promptId):o.delete(a.dataset.promptId))}}else n?o.add(e):o.delete(e);r=t,u(),c()}function c(){const e=Array.from(i.querySelectorAll(".prompt-selector")),t=e.length,n=e.filter(e=>e.checked).length,a=document.getElementById("__ap_count_label");a.textContent=0===n?getTranslation("countPrompts",{count:t}):n===t?`${t}/${t} ✓`:`${n}/${t}`}function d(e=""){i.textContent="",r=-1;const t=e.toLowerCase();let n=0;if(0===a.length){const e=document.createElement("div");return e.className="empty-state",e.textContent=getTranslation("noSavedPrompts"),i.appendChild(e),void c()}a.forEach(e=>{if(!(e.title.toLowerCase().includes(t)||e.text.toLowerCase().includes(t)))return;const a=n;n++;const r=document.createElement("div");r.className="mp-export-item",r.onclick=t=>{if("checkbox"!==t.target.type){const n=r.querySelector("input"),o=!n.checked;n.checked=o,l(e.id,a,o,t.shiftKey)}};const s=document.createElement("input");s.type="checkbox",s.className="mp-checkbox prompt-selector",s.checked=o.has(e.id),s.dataset.promptId=e.id,s.dataset.idx=a,s.onclick=t=>{t.stopPropagation(),l(e.id,parseInt(t.target.dataset.idx),t.target.checked,t.shiftKey)};const c=document.createElement("div");c.className="mp-item-content";const d=document.createElement("div");d.className="mp-item-title",d.textContent=e.title;const p=document.createElement("div");p.className="mp-item-preview",p.textContent=e.text.substring(0,150).replace(/\n/g," ")+"...";const m=document.createElement("div");m.className="mp-checkbox-wrapper",m.appendChild(s),c.appendChild(d),c.appendChild(p),r.appendChild(m),r.appendChild(c),i.appendChild(r)}),c()}i.style.maxHeight="300px",setupEnhancedScroll(i),d();const p=document.getElementById("__ap_export_search"),m=document.getElementById("__ap_select_all");function u(){const e=Array.from(i.querySelectorAll(".prompt-selector"));if(0===e.length)return;const t=e.every(e=>e.checked),n=e.some(e=>e.checked);m.checked=t,m.indeterminate=n&&!t}p.oninput=e=>{r=-1,d(e.target.value),u()},m.onchange=e=>{r=-1;const t=e.target.checked;i.querySelectorAll(".prompt-selector").forEach(e=>{e.checked=t,t?o.add(e.dataset.promptId):o.delete(e.dataset.promptId)}),c()};const g=()=>a.filter(e=>o.has(e.id)).map(e=>{const{id:t,position:n,...a}=e;return a}),f=()=>{t.classList.remove("visible"),setTimeout(()=>t.remove(),200)};n.querySelector("#__ap_close_export").onclick=f;const h=e=>{"Escape"===e.key&&(f(),document.removeEventListener("keydown",h))};document.addEventListener("keydown",h),e?document.getElementById("__ap_do_gist_insert").onclick=()=>{const t=g();if(0===t.length)return void showNotification(getTranslation("noPromptsToExport"),"error");const n=t.map(e=>({title:e.title,text:e.text,usePlaceholders:e.usePlaceholders,autoExecute:e.autoExecute})),a=JSON.stringify(n,null,2);let o="";if(1===t.length)o=`${(t[0].title||"Prompt").replace(/[<>:"/\\|?*]/g,"").trim()}.mp.prompt.json`;else{const e=new Date;o=`Prompts_MyPrompt_${e.toLocaleDateString(navigator.language).replace(/\//g,"-")}_${e.toLocaleTimeString(navigator.language,{hour:"2-digit",minute:"2-digit",second:"2-digit"}).replace(/:/g,"-")}.mp.prompt.json`}insertIntoGistEditor(e.container,o,a),f()}:(document.getElementById("__ap_do_export_json").onclick=async()=>{const e=g();if(0===e.length)return void showNotification(getTranslation("noPromptsToExport"),"error");if(1===e.length)return void exportJsonAsSingleFile(e);const t=await createDialogo({title:getTranslation("exportJsonTitle"),message:getTranslation("exportJsonChoice",{count:e.length}),actions:[{label:getTranslation("exportSeparateFiles"),style:"danger",value:"multiple"},{label:getTranslation("exportSingleFile"),style:"primary",value:"single"}]});"single"===t?exportJsonAsSingleFile(e):"multiple"===t&&exportJsonAsMultipleFiles(e)},document.getElementById("__ap_do_export_txt").onclick=async()=>{const e=g();if(0!==e.length){if(e.length>1){if(!await createDialogo({title:getTranslation("confirmDownload"),message:getTranslation("confirmDownloads",{count:e.length}),dontShowAgainId:"confirm-export-download",type:"confirm"}))return}for(const t of e){const e=document.createElement("a");e.href=URL.createObjectURL(new Blob([t.text],{type:"text/plain"}));const n=(t.title||"prompt").replace(/[<>:"/\\|?*]/g,"").trim();e.download=`${n||"prompt"}.mp.prompt.txt`,e.style.display="none",document.body.appendChild(e),e.click(),document.body.removeChild(e),await new Promise(e=>setTimeout(e,200))}}else showNotification(getTranslation("noPromptsToExport"),"error")},document.getElementById("__ap_share_gist").onclick=()=>{window.open("https://gist.github.com/","_blank")}),setTimeout(()=>p.focus(),100)}function exportPrompts(){openExportMenu(null)}async function processAndSavePrompts(e){if(!Array.isArray(e))throw new Error(getTranslation("errorReadingJSON"));const t=await getAll(),n=e.map((e,t)=>({id:generatePromptId()+String(t).padStart(3,"0"),title:e.title||"No Title",text:e.text||"",usePlaceholders:e.usePlaceholders||!1,autoExecute:e.autoExecute||!1,isFixed:!1,activeFileIds:[],tags:e.tags||[],usageCount:e.usageCount||0}));let a=t.findIndex(e=>!e.isFixed);return-1===a&&(a=t.length),t.splice(a,0,...n),normalizePositions(t),await saveRawPrompts(promptsToStorage(t)),await refreshMenu(),n.length}function parseTextPrompt(e,t){const n=e.split(/\r?\n/);if(0===n.length)return[];if(!n[0].match(/^\s*\{\{(.*?)\}\}\s*$/)){return[{title:t.replace(/\.mp\.prompt\.(txt|md|json)$/i,"").trim(),text:e.trim(),usePlaceholders:!1,autoExecute:!1}]}const a=[];let o=null,r=[];for(let e=0;e<n.length;e++){const t=n[e],s=t.match(/^\s*\{\{(.*?)\}\}\s*$/);if(s){o&&(o.text=r.join("\n").trim(),a.push(o)),o={title:"No Title",usePlaceholders:!1,autoExecute:!1,text:""},r=[];s[1].split(";").forEach(e=>{const t=e.split(":");if(t.length>=2){const e=t[0].trim().toLowerCase(),n=t.slice(1).join(":").trim();"title"===e&&(o.title=n),"useplaceholders"===e&&(o.usePlaceholders="true"===n.toLowerCase()),"autoexecute"===e&&(o.autoExecute="true"===n.toLowerCase())}})}else o&&r.push(t)}return o&&(o.text=r.join("\n").trim(),a.push(o)),a}async function importPrompts(){if("local"===await createDialogo({title:getTranslation("import"),message:getTranslation("localImport"),actions:[{label:"GitHub Gist",style:"secondary",action:()=>{window.open('https://gist.github.com/search?o=desc&q=".mp.prompt."&s=updated',"_blank")}},{label:getTranslation("localFile"),style:"primary",value:"local"}]})){const e=document.createElement("input");e.type="file",e.accept=".mp.prompt.json, .mp.prompt.txt, .mp.prompt.md",e.onchange=e=>{const t=e.target.files[0];if(!t)return;const n=new FileReader;n.onload=async e=>{try{const n=e.target.result;let a;a=t.name.toLowerCase().endsWith(".json")?JSON.parse(n):parseTextPrompt(n,t.name);showNotification(getTranslation("promptsImported",{count:await processAndSavePrompts(a)}),"success")}catch(e){showNotification(getTranslation("errorImporting",{error:e.message}),"error")}},n.readAsText(t)},e.click()}"function"==typeof closeMenu&&closeMenu()}function injectGistExportEditorButtons(){document.querySelectorAll(".gist-file-actions").forEach(e=>{const t=`<span>${getTranslation("export")}</span>`,n=e.querySelector(".mp-gist-export-editor-btn");if(n)return void(n.innerHTML!==t&&setSafeInnerHTML(n,t));const a=document.createElement("button");a.className="mp-gist-import-btn mp-gist-export-editor-btn btn btn-sm",a.type="button",a.style.marginRight="2px",setSafeInnerHTML(a,t),a.onclick=t=>{t.preventDefault();const n=e.closest(".js-gist-file");n&&openExportMenu({container:n})},e.prepend(a)})}function extractContentFromGistFile(e){const t=e.querySelector(".markdown-body");if(t){const e=t.cloneNode(!0);e.querySelectorAll(".anchor, .octicon, .js-clipboard-copy").forEach(e=>e.remove());let n=function e(t){if(t.nodeType===Node.TEXT_NODE)return t.textContent;if(t.nodeType!==Node.ELEMENT_NODE)return"";let n="";const a=t.tagName.toLowerCase();switch(Array.from(t.childNodes).forEach(t=>{n+=e(t)}),a){case"h1":return`# ${n.trim()}\n`;case"h2":return`## ${n.trim()}\n`;case"h3":return`### ${n.trim()}\n`;case"h4":return`#### ${n.trim()}\n`;case"h5":return`##### ${n.trim()}\n`;case"h6":return`###### ${n.trim()}\n`;case"strong":case"b":return`**${n}**`;case"em":case"i":return`*${n}*`;case"p":return`${n}\n`;case"blockquote":return`${n.trim().split(/\r?\n/).map(e=>`> ${e}`).join("\n")}`;case"li":{const e=t.parentNode,a=n.trim();if(e&&"OL"===e.tagName){return`${Array.from(e.children).filter(e=>1===e.nodeType).indexOf(t)+1}. ${a}`}return`* ${a}`}case"ul":case"ol":return`\n${n.split("\n").map(e=>e.trim()).filter(e=>""!==e).join("\n")}\n`;case"hr":return"\n---\n";case"code":return t.parentNode&&"PRE"===t.parentNode.tagName?n:`\`${n}\``;case"pre":return`\n\`\`\`\n${n.trim()}\n\`\`\`\n`;case"a":return`[${n}](${t.getAttribute("href")||""})`;case"br":return"\n";default:return n}}(e);return n.replace(/\n{3,}/g,"\n\n").trim()}const n=e.querySelectorAll(".blob-code-inner");return n.length>0?Array.from(n).map(e=>e.textContent.replace(/\r?\n$/,"")).join("\n"):null}async function handleGistImportClick(e,t,n){e.stopPropagation(),e.preventDefault();const a=e.currentTarget,o=a.innerHTML;a.disabled=!0;try{const e=extractContentFromGistFile(t);if(!e)throw new Error("Could not read file content");let o;o=n.toLowerCase().endsWith(".json")?JSON.parse(e):parseTextPrompt(e,n),await processAndSavePrompts(o);const r=Array.isArray(o)?o.length:1;showNotification(getTranslation("promptsImported",{count:r}),"success"),a.dataset.state="imported",setSafeInnerHTML(a,`<span>${getTranslation("imported")}</span>`)}catch(e){showNotification(getTranslation("errorImporting",{error:e.message}),"error"),a.disabled=!1,setSafeInnerHTML(a,o)}}function injectGistButtons(){document.querySelectorAll(".file").forEach(e=>{const t=e.querySelector(".file-actions");if(!t)return;const n=e.querySelector(".gist-blob-name"),a=n?n.innerText.trim():"";if(!a.match(/\.mp\.prompt\.(json|txt|md)$/i))return;const o=`<span>${getTranslation("import")}</span>`,r=e.querySelector(".mp-gist-import-btn");if(r){if("imported"===r.dataset.state)return;return void(r.innerHTML!==o&&setSafeInnerHTML(r,o))}const s=document.createElement("button");s.className="mp-gist-import-btn btn btn-sm",s.type="button",setSafeInnerHTML(s,o),s.onclick=t=>handleGistImportClick(t,e,a),t.prepend(s)})}function highlightPromptSnippetMeta(){document.querySelectorAll(".gist-snippet-meta").forEach(e=>{if(e.classList.contains("mp-prompt-meta-highlight"))return;const t=e.querySelector("strong.css-truncate-target");if(t){if(t.textContent.trim().toLowerCase().includes(".mp.prompt.")){e.classList.add("mp-prompt-meta-highlight");const n=t.closest("a"),a=n?n.getAttribute("href"):null;e.addEventListener("click",e=>{e.target.closest("a, button, input, img")||window.getSelection().toString().trim().length>0||a&&(window.location.href=a)})}}})}function initGistIntegration(){if("gist.github.com"!==window.location.hostname)return;injectGistButtons(),injectGistExportEditorButtons(),highlightPromptSnippetMeta();let e=location.href;new MutationObserver(()=>{location.href!==e&&(e=location.href,setTimeout(()=>{injectGistButtons(),injectGistExportEditorButtons(),highlightPromptSnippetMeta()},200)),injectGistButtons(),injectGistExportEditorButtons(),highlightPromptSnippetMeta()}).observe(document.body,{subtree:!0,childList:!0})}function cleanup(){SyntaxHighlighter.detach(),currentButton&&(currentButton.remove(),currentButton=null),currentMenu&&(currentMenu.remove(),currentMenu=null),currentModal&&(currentModal.remove(),currentModal=null),currentPlaceholderModal&&(currentPlaceholderModal.remove(),currentPlaceholderModal=null),isInitialized=!1}initKofiPatreonFeature(),initGistIntegration();
    async function initUI() {
        if (pageObserver) pageObserver.disconnect();
        cleanup();
        currentPlatform = detectPlatform();
        if (!currentPlatform) return;
        createNavInterface();
        try {
            let btn, elementToInsert, insertionPoint, insertionMethod = 'before';
            if (currentPlatform === 'chatgpt') {
                const findAnchor = () => {
                    const anchor = document.getElementById('composer-plus-btn') || document.querySelector('[data-testid="composer-plus-btn"]');
                    if (anchor) {
                        const hasIcon = anchor.querySelector('use[href*="6be74c"]');
                        if (hasIcon || anchor.querySelector('svg')) {
                            return { element: anchor, type: 'fingerprint-id' };
                        }
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const anchorBtn = anchorData.element;
                const container = anchorBtn.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('right');
                    container.insertBefore(btn, anchorBtn);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'deepseek') {
                const findAnchor = () => {
                    const SEND_ICON_PATH = "M8.3125 0.981587C8.66767"; const STOP_ICON_PATH = "M2 4.88C2 3.68009";
                    const candidates = Array.from(document.querySelectorAll('div[role="button"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        const d = path?.getAttribute('d') || "";
                        return d.startsWith(SEND_ICON_PATH) || d.startsWith(STOP_ICON_PATH);
                    });
                    if (target && target.parentElement) {
                        return { element: target.parentElement, type: 'icon-fingerprint' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    btn.style.marginRight = "15px";
                    btn.style.display = "inline-flex";
                    btn.style.alignItems = "center";
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'googleaistudio') {
                const isAppsPage = window.location.href.includes('/apps');
                const findAnchor = () => {
                    if (isAppsPage) {
                        const mediaMenu = document.querySelector('ms-add-media-menu');
                        if (mediaMenu) return { element: mediaMenu, type: 'apps-component' };
                        const addIcon = Array.from(document.querySelectorAll('.material-symbols-outlined')) .find(el => el.textContent.trim() === 'add_circle');
                        if (addIcon) {
                            const wrapper = addIcon.closest('div');
                            return { element: wrapper, type: 'apps-icon' };
                        }
                    } else {
                        const mediaBtn = document.querySelector('button[iconname="add_circle"]');
                        if (mediaBtn) {
                            const wrapper = mediaBtn.closest('.button-wrapper');
                            if (wrapper) return { element: wrapper, type: 'attribute-fingerprint' };
                        }
                        const wrapper = document.querySelector('.button-wrapper');
                        if (wrapper) return { element: wrapper, type: 'class-fallback' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('.mp-prompt-wrapper');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    if (isAppsPage) {
                        if (container.firstChild) {
                            container.insertBefore(btn, container.firstChild);
                        } else {
                            container.appendChild(btn);
                        }
                    } else {
                        container.insertBefore(btn, anchorData.element);
                    }
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'qwen') {
                const findAnchor = () => {
                    const ANCHOR_IDS = ['#icon-line-waveform', '#icon-line-arrow-up', '#icon-fill-stop-011'];
                    const containerCandidate = document.querySelector('.message-input-right-button-send');
                    if (!containerCandidate) return null;
                    const hasValidIcon = containerCandidate.querySelector('use');
                    const iconHref = hasValidIcon?.getAttribute('xlink:href') || hasValidIcon?.getAttribute('href');
                    if (iconHref && ANCHOR_IDS.includes(iconHref)) {
                        return { element: containerCandidate, type: 'svg-use-fingerprint' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const parentContainer = anchorData.element.parentElement;
                if (!parentContainer) return;
                let existingBtn = parentContainer.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    parentContainer.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = parentContainer;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'zai') {
                const findAnchor = () => {
                    const SEND_ICON = "M7.99946 1.50005L2.29635 13.5283"; const STOP_SELECTOR = "button span.block.bg-white.size-3";
                    const sendBtn = document.getElementById('send-message-button');
                    if (sendBtn) return { element: sendBtn, type: 'id' };
                    const pathTarget = Array.from(document.querySelectorAll('button svg path'))
                        .find(p => p.getAttribute('d')?.startsWith(SEND_ICON));
                    if (pathTarget) return { element: pathTarget.closest('button'), type: 'fingerprint-send' };
                    const stopBtn = document.querySelector(STOP_SELECTOR)?.closest('button');
                    if (stopBtn) return { element: stopBtn, type: 'fingerprint-stop' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const container = anchorData.element.closest('div.flex.self-end');
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, container.firstChild);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'gemini') {
                const findAnchor = () => {
                    const micIcon = document.querySelector('mat-icon[data-mat-icon-name="mic"]');
                    if (micIcon) {
                        return { element: micIcon.closest('.input-buttons-wrapper-bottom'), type: 'mic-wrapper' };
                    }
                    const sendIcon = document.querySelector('mat-icon[data-mat-icon-name="send"]');
                    if (sendIcon) {
                        return { element: sendIcon.closest('.input-buttons-wrapper-bottom'), type: 'send-wrapper' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const bottomWrapper = anchorData.element;
                const container = bottomWrapper.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    btn.style.marginLeft = '20px';
                    container.insertBefore(btn, bottomWrapper);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'arena') {
                const findAnchor = () => {
                    const ANCHOR_FINGERPRINT = "M3 12L21 12M21 12L12.5 3.5";
                    const candidates = Array.from(document.querySelectorAll('button[type="submit"], div[role="button"], button'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        const hasFingerprint = path && path.getAttribute('d')?.includes(ANCHOR_FINGERPRINT);
                        if (!hasFingerprint) return false;
                        const safeContainer = btn.closest('div.flex.items-center.gap-2');
                        return !!safeContainer;
                    });
                    if (target) return { element: target, type: 'svg-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const anchorElement = anchorData.element;
                const container = anchorElement.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('.custom-prompt-btn-class') || container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorElement);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'kimi') {
                const findAnchor = () => {
                    const SEND_ICON_PATH = "M705.536 433.664a38.4 38.4 0 1 1-54.272 54.272L550.4"; const STOP_ICON_PATH = "M331.946667 379.904";
                    const candidates = Array.from(document.querySelectorAll('.send-button-container, .send-icon, svg'));
                    const targetIcon = candidates.find(el => {
                        const path = el.querySelector('path');
                        const d = path?.getAttribute('d');
                        return d && (d.startsWith(SEND_ICON_PATH) || d.startsWith(STOP_ICON_PATH));
                    });
                    const sendContainer = targetIcon?.closest('.send-button-container');
                    if (sendContainer) {
                        return { element: sendContainer, type: 'icon-fingerprint' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 2000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const container = anchorData.element.closest('.right-area') || anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'claude') {
                const findAnchor = () => {
                    const candidates = Array.from(document.querySelectorAll('button'));
                    const voiceBtn = candidates.find(btn => {
                        const svg = btn.querySelector('svg[viewBox="0 0 21.2 21.2"]');
                        if (!svg) return false;
                        const rects = svg.querySelectorAll('rect');
                        return rects.length === 6 && rects[0]?.getAttribute('x') === '0';
                    });
                    if (voiceBtn) return { element: voiceBtn, type: 'voice-fingerprint' };
                    const sendBtn = candidates.find(btn => {
                        const icon = btn.querySelector('span[data-cds="Icon"]');
                        return icon && icon.textContent.trim() === '';
                    });
                    if (sendBtn) return { element: sendBtn, type: 'send-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.closest('div.flex.items-center') || anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.style.marginRight = '6px';
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'grok') {
                const findAnchor = () => {
                    const idCandidate = document.getElementById('model-select-trigger');
                    if (idCandidate) {
                        return { element: idCandidate.parentElement, type: 'model-id' };
                    }
                    const MODEL_SVG_PATH = "M6.5 12.5L11.5 17.5M6.5 12.5";
                    const candidates = Array.from(document.querySelectorAll('button'));
                    const svgCandidate = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(MODEL_SVG_PATH);
                    });
                    if (svgCandidate) {
                        return { element: svgCandidate.parentElement, type: 'model-svg' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const leftAnchor = anchorData.element;
                const container = leftAnchor.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                    if (btn.previousElementSibling !== leftAnchor) {
                        container.insertBefore(btn, leftAnchor.nextElementSibling);
                    }
                } else {
                    btn = createPromptButton('left');
                    btn.style.marginBottom = '2px';
                    container.insertBefore(btn, leftAnchor.nextElementSibling);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'perplexity') {
                const findAnchor = () => {
                    const PPLX_FINGERPRINTS = ['#pplx-icon-custom-perplexity-v2v', '#pplx-icon-player-stop-filled', '#pplx-icon-arrow-up', '#pplx-icon-arrow-right'];
                    const buttons = document.querySelectorAll('button[type="button"]');
                    for (const btnEl of buttons) {
                        const useTag = btnEl.querySelector('use');
                        if (useTag) {
                            const href = useTag.getAttribute('xlink:href') || useTag.getAttribute('href');
                            if (PPLX_FINGERPRINTS.includes(href)) {
                                const anchorWrapper = btnEl.closest('.ml-2') || btnEl;
                                return { element: anchorWrapper, type: 'svg-use-fingerprint' };
                            }
                        }
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    for (let i = 0; i < 3; i++) {
                        await new Promise(r => setTimeout(r, 800));
                        anchorData = findAnchor();
                        if (anchorData) break;
                    }
                }
                if (!anchorData) return;
                const container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (!existingBtn) {
                    btn = createPromptButton('left');
                    container.insertBefore(btn, anchorData.element);
                } else {
                    btn = existingBtn;
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'longcat') {
                const findAnchor = () => {
                    const ICON_HREFS = ["#icon-sikao", "#icon-lianwang", "#icon-upload"];
                    const candidates = Array.from(document.querySelectorAll('use'));
                    const targetIcon = ICON_HREFS.map(href =>
                        candidates.find(use => use.getAttribute('href') === href)
                    ).find(el => el !== undefined);
                    if (targetIcon) {
                        const footer = targetIcon.closest('.chat-input-footer');
                        if (footer) {
                            const leftBox = footer.closest('.left-box');
                            if (leftBox) return { element: leftBox, type: 'structure-fingerprint' };
                        }
                    }
                    const leftBoxEl = document.querySelector('.left-box');
                    if (leftBoxEl) return { element: leftBoxEl, type: 'class-selector' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.style.marginRight = '8px';
                    container.prepend(btn);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'mistral') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "M12 19v3";
                    const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const micButton = anchorData.element;
                const wrapperDiv = micButton.parentElement;
                const outerContainer = wrapperDiv.parentElement;
                if (!outerContainer) return;
                let existingBtn = outerContainer.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    outerContainer.insertBefore(btn, wrapperDiv);
                }
                elementToInsert = btn;
                insertionPoint = outerContainer;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'yuanbao') {
                const findAnchor = () => {
                    let target = document.querySelector('a[class*="style__send-btn"]');
                    if (target) return { element: target, type: 'class-prefix' };
                    const iconSpan = document.querySelector('span.iconfont.icon-send');
                    if (iconSpan && iconSpan.closest('a')) {
                        return { element: iconSpan.closest('a'), type: 'child-icon' };
                    }
                    const ANCHOR_RECT_X = "7.71448";
                    const candidates = Array.from(document.querySelectorAll('a, button'));
                    const svgTarget = candidates.find(btn => {
                        const rect = btn.querySelector('rect[x="' + ANCHOR_RECT_X + '"]');
                        return rect;
                    });
                    if (svgTarget) return { element: svgTarget, type: 'icon-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'chatglm') {
                let container = document.querySelector('div.options-container.flex.flex-y-center');
                let anchor = null;
                if (container) {
                    anchor = container.querySelector('.upload-image-wrap');
                }
                if (!container || !anchor) {
                    container = document.querySelector('div.options[data-v-7dc2591c]');
                    if (container) {
                        targetType = 'element1';
                        anchor = container.lastElementChild;
                    }
                }
                if (!container || !anchor) {
                    container = document.querySelector('div.options[data-v-7a34b085]');
                    if (container) {
                        targetType = 'element2';
                        anchor = container.lastElementChild;
                    }
                }
                if (!container || !anchor) {
                    container = await waitFor('.options, .options-container', 5000);
                    if (!container) return;
                    if (container.matches('[data-v-7dc2591c]')) {
                         targetType = 'element1';
                         anchor = container.lastElementChild;
                    } else if (container.matches('[data-v-7a34b085]')) {
                         targetType = 'element2';
                         anchor = container.lastElementChild;
                    } else {
                         targetType = 'original';
                         anchor = container.querySelector('.upload-image-wrap');
                    }
                }
                if (!container || !anchor) return;
                btn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (!btn) {
                    btn = createPromptButton();
                }
                elementToInsert = btn;
                insertionPoint = anchor;
                insertionMethod = 'after';
            }
            else if (currentPlatform === 'poe') {
                const findAnchor = () => {
                    const ANCHOR_ICON_SIG = "M13 4.5a1 1 0 1 0-2 0V11";
                    const candidates = Array.from(document.querySelectorAll('button[data-button-file-input="true"], button'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHOR_ICON_SIG);
                    });
                    if (target) {
                        const actionContainer = target.closest('[class*="actionContainerLeft"]');
                        return {
                            element: actionContainer || target.parentElement,
                            type: 'icon-fingerprint'
                        };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData || !anchorData.element) return;
                let container = anchorData.element;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    if (container.firstChild) {
                        container.insertBefore(btn, container.firstChild);
                    } else {
                        container.appendChild(btn);
                    }
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'googleModoIA') {
                const findAnchor = () => {
                    const ANCHOR_SVG_PATH = "M440-440H200v-80H440V-760h80v240H760v80H520v240H440V-440Z";
                    const candidates = Array.from(document.querySelectorAll('button.uMMzHc, button[jsuid]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d') === ANCHOR_SVG_PATH;
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.style.marginTop = "6px";
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'notebooklm') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l7 7Z";
                    const candidates = Array.from(document.querySelectorAll('button.submit-button, button[aria-label]'));
                    const target = candidates.find(btn => {
                        const svgPath = btn.querySelector('path');
                        const dAttribute = svgPath?.getAttribute('d');
                        const isArrow = dAttribute && dAttribute.includes(ANCHORICONPATH.substring(0, 4));
                        const isNamed = btn.querySelector('mat-icon')?.textContent.trim() === 'arrow_forward';
                        return isArrow || isNamed;
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    const fallback = document.querySelector('button.submit-button');
                    if (fallback) return { element: fallback, type: 'class-selector' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 2000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'doubao') {
                const findMicArea = () => {
                    const micPath = Array.from(document.querySelectorAll('svg path')).find(
                        p => p.getAttribute('d')?.startsWith("M19.8628 9.29346")
                    );
                    if (micPath) {
                        const micOuterWrapper = micPath.closest('[class*="items-end"]');
                        if (micOuterWrapper && micOuterWrapper.parentElement) {
                            return {
                                container: micOuterWrapper.parentElement,
                                referenceNode: micOuterWrapper
                            };
                        }
                    }
                    return null;
                };
                const findStopButtonArea = () => {
                    const stopPath = Array.from(document.querySelectorAll('svg path')).find(
                        p => p.getAttribute('d')?.startsWith("M21.1504 12C")
                    );
                    if (stopPath) {
                        const stopButton = stopPath.closest('.break-btn-fISNgC') || stopPath.closest('[class*="rounded-full"]');
                        if (stopButton) {
                            const stopOuterWrapper = stopButton.closest('[class*="items-end"]');
                            if (stopOuterWrapper && stopOuterWrapper.parentElement) {
                                return {
                                    container: stopOuterWrapper.parentElement,
                                    referenceNode: stopOuterWrapper
                                };
                            }
                        }
                    }
                    const stopContainer = document.querySelector('.flex.items-end.empty\\:hidden.z-1');
                    if (stopContainer && stopContainer.parentElement) {
                        const reference = stopContainer.querySelector('.break-btn-fISNgC') || stopContainer.querySelector('[class*="rounded-full"]');
                        if (reference) {
                            return {
                                container: stopContainer.parentElement,
                                referenceNode: stopContainer
                            };
                        }
                    }
                    return null;
                };
                const findRightArea = () => {
                    const sendIcon = Array.from(document.querySelectorAll('span.semi-icon path')).find(
                        p => p.getAttribute('d')?.startsWith("m3.543 8.883")
                    );
                    if (sendIcon) {
                        const r = sendIcon.closest('[class*="right-area"]');
                        if (r) return { container: r.parentElement, referenceNode: r };
                    }
                    const stopIcon = Array.from(document.querySelectorAll('span.semi-icon path')).find(p => p.getAttribute('d')?.startsWith("M12 23c6.075"));
                    if (stopIcon) {
                        const r = stopIcon.closest('[class*="right-area"]');
                        if (r) return { container: r.parentElement, referenceNode: r };
                    }
                    const sendBtn = document.getElementById('flow-end-msg-send');
                    if (sendBtn) {
                        const r = sendBtn.closest('[class*="right-area"]');
                        if (r) return { container: r.parentElement, referenceNode: r };
                    }
                    const fallbackRight = document.querySelector('[class*="right-area-"]');
                    if (fallbackRight) return { container: fallbackRight.parentElement, referenceNode: fallbackRight };
                    return null;
                };
                let targetArea = findMicArea() || findStopButtonArea() || findRightArea();
                if (!targetArea) {
                    await new Promise(r => setTimeout(r, 1500));
                    targetArea = findMicArea() || findStopButtonArea() || findRightArea();
                }
                if (!targetArea || !targetArea.container) return;
                if (!targetArea.referenceNode || !targetArea.referenceNode.isConnected) {
                    targetArea = findMicArea() || findStopButtonArea() || findRightArea();
                    if (!targetArea || !targetArea.container || !targetArea.referenceNode?.isConnected) return;
                }
                let existingBtn = targetArea.container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    btn.style.marginRight = '8px';
                    targetArea.container.insertBefore(btn, targetArea.referenceNode);
                }
                elementToInsert = btn;
                insertionPoint = targetArea.container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'copilot') {
                const findAnchor = () => {
                    const testIdEl = document.querySelector('button[data-testid="composer-create-button"]');
                    if (testIdEl) {
                        const wrapper = testIdEl.parentElement;
                        return { element: testIdEl, wrapper: wrapper, type: 'testid' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 2000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const mainContainer = anchorData.wrapper.parentElement;
                if (!mainContainer) return;
                const trueContainer = mainContainer.parentElement;
                if (!trueContainer) return;
                let existingBtn = trueContainer.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('right');
                    trueContainer.insertBefore(btn, mainContainer);
                }
                if (btn) {
                    btn.style.setProperty('margin', '0', 'important');
                }
                elementToInsert = btn;
                insertionPoint = trueContainer;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'glmimage') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "m6 9 6 6 6-6";
                    const candidates = Array.from(document.querySelectorAll('button, [role="combobox"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1000));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (container && !container.classList.contains('flex')) {
                    container = container.closest('.flex.items-center.gap-4');
                }
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.prepend(btn);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'flow') {
                const findAnchor = () => {
                    const candidates = Array.from(document.querySelectorAll('button'));
                    const target = candidates.find(btn => {
                        const icon = btn.querySelector('i.google-symbols');
                        return icon && icon.textContent.trim() === 'arrow_forward';
                    });
                    if (target) return { element: target, type: 'symbol-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'ernie') {
                const findAnchor = () => {
                    const ANCHORICONPATH = " M43,-63.4379997253418 C43,-63.4379997253418 31,-59.6879997253418 31,-59.6879997253418";
                    const path = Array.from(document.querySelectorAll('path')).find(p => {
                        const d = p.getAttribute('d');
                        return d && d.startsWith(ANCHORICONPATH);
                    });
                    if (path) {
                        const anchor = path.closest('.send__slzHSuja');
                        if (anchor) return { element: anchor, type: 'icon-fingerprint' };
                    }
                    const fallbackAnchor = document.querySelector('.send__slzHSuja');
                    if (fallbackAnchor) return { element: fallbackAnchor, type: 'class-fallback' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                const anchor = anchorData.element;
                const container = anchor.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.style.marginRight = '15px';
                    container.insertBefore(btn, anchor);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'dreamina' || currentPlatform === 'jimengJianying') {
                const findAnchor = () => {
                    const container = document.querySelector('div[class*="toolbar-actions"]');
                    if (container) return { element: container, type: 'container' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    if (container.firstChild) {
                        container.insertBefore(btn, container.firstChild);
                    } else {
                        container.appendChild(btn);
                    }
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'nvidiaNim') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "M0.747,1.623l14.495,6.377";
                    const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    const textArea = document.querySelector('textarea[data-testid="nv-text-area-element"]');
                    if (textArea && textArea.parentElement) return { element: textArea.parentElement, type: 'fallback-parent' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element;
                if (anchorData.type === 'icon-fingerprint') {
                    container = anchorData.element.parentElement;
                }
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.style.marginBottom = "2px";
                    btn.style.marginRight = "5px";
                    btn.style.setProperty('padding', 'revert', 'important');
                    if (anchorData.type === 'icon-fingerprint') {
                        container.insertBefore(btn, anchorData.element);
                    } else {
                        container.appendChild(btn);
                    }
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'indicArena') {
                const findAnchor = () => {
                    const ANCHOR_ICON_PATH = "M14.536 21.686a.5.5";
                    const candidates = Array.from(document.querySelectorAll('button[type="submit"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('svg path');
                        return path && path.getAttribute('d')?.startsWith(ANCHOR_ICON_PATH);
                    });
                    if (target) return { element: target, type: 'svg-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'qianwen') {
                const findAnchor = () => {
                    const iconWrapper = document.querySelector('[data-icon-type="qwpcicon-sendChat"]');
                    if (iconWrapper) {
                        const buttonContainer = iconWrapper.closest('div');
                        if (buttonContainer) return { element: buttonContainer, type: 'data-icon-fingerprint' };
                    }
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    btn.style.marginRight = '8px';
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'geminigen') {
                const findAnchor = () => {
                    const candidates = Array.from(document.querySelectorAll('div.flex.justify-end.gap-2.items-center'));
                    const target = candidates.find(div => {
                        const hasButton = div.querySelector('button');
                        const isVisible = div.offsetParent !== null;
                        return hasButton && isVisible;
                    });
                    if (target) return { element: target, type: 'action-container' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    const nativeButton = container.querySelector('button');
                    if (nativeButton) {
                        container.insertBefore(btn, nativeButton);
                    } else {
                        container.appendChild(btn);
                    }
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'hunyuan') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "M7.68326";
                    const candidates = Array.from(document.querySelectorAll('div.hy-chat-input-send-btn, div.hy-chat-input-send-btn--disabled'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    const fallbackCandidates = Array.from(document.querySelectorAll('button, [role="button"], div[class*="send"]'));
                    const fallbackTarget = fallbackCandidates.find(el => {
                        const path = el.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (fallbackTarget) return { element: fallbackTarget, type: 'icon-fingerprint-fallback' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'bing') {
                const findAnchor = () => {
                    const anchorWrapper = document.getElementById('create_btn_wrapper');
                    if (anchorWrapper) {
                        return { element: anchorWrapper, type: 'static-id' };
                    }
                    const classEl = document.querySelector('div.create_btn_wrapper');
                    if (classEl) return { element: classEl, type: 'class-name' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'meta') {
                const findAnchor = () => {
                    const SEND_ICON_PATH = "M16 6.125a.89.89";
                    const STOP_ICON_PATH = "M19.1 5.625c1.105 0";
                    const candidates = Array.from(document.querySelectorAll('button'));
                    let target = candidates.find(btn => {
                        const path = btn.querySelector('svg > path');
                        return (btn.dataset.testid === 'composer-send-button') || (path && path.getAttribute('d')?.startsWith(SEND_ICON_PATH));
                    });
                    if (!target) {
                        target = candidates.find(btn => {
                            const path = btn.querySelector('svg > path');
                            return (btn.dataset.testid === 'composer-stop-button') || (path && path.getAttribute('d')?.startsWith(STOP_ICON_PATH));
                        });
                    }
                    if (target) return { element: target, type: 'dynamic-anchor' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton('left');
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'manus') {
                const findAnchor = () => {
                    const ANCHOR_ICON_PATH = "M7.91699 15.0642C7.53125 15.0642";
                    const candidates = Array.from(document.querySelectorAll('button'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHOR_ICON_PATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            else if (currentPlatform === 'xiaomi') {
                const findAnchor = () => {
                    const ANCHORICONPATH = "M.244 7.921 18.202.03c.254-.111";
                    const candidates = Array.from(document.querySelectorAll('button, [role="button"], div[class*="button"]'));
                    const target = candidates.find(btn => {
                        const path = btn.querySelector('path');
                        return path && path.getAttribute('d')?.startsWith(ANCHORICONPATH);
                    });
                    if (target) return { element: target, type: 'icon-fingerprint' };
                    const trackIdEl = document.querySelector('button[data-track-id="home_send_btn"]');
                    if (trackIdEl) return { element: trackIdEl, type: 'trackid' };
                    return null;
                };
                let anchorData = findAnchor();
                if (!anchorData) {
                    await new Promise(r => setTimeout(r, 1500));
                    anchorData = findAnchor();
                }
                if (!anchorData) return;
                let container = anchorData.element.parentElement;
                if (!container) return;
                let existingBtn = container.querySelector('[data-testid="composer-button-prompts"]');
                if (existingBtn) {
                    btn = existingBtn;
                } else {
                    btn = createPromptButton();
                    btn.setAttribute('data-testid', 'composer-button-prompts');
                    container.insertBefore(btn, anchorData.element);
                }
                elementToInsert = btn;
                insertionPoint = container;
                insertionMethod = 'handled_manually';
            }
            if (!btn || !insertionPoint) return;
            const editorEl = document.querySelector(platformSelectors[currentPlatform]);
            if (editorEl) {
                setupInlineSuggestion(editorEl);
            } else {
                setTimeout(() => {
                    const retryEditor = document.querySelector(platformSelectors[currentPlatform]);
                    if (retryEditor) setupInlineSuggestion(retryEditor);
                }, 1000);
            }
            currentButton   = elementToInsert;
            const clickable = btn;
            if      (insertionMethod === 'append'){insertionPoint.appendChild(elementToInsert);}
            else if (insertionMethod === 'before'){insertionPoint.parentNode.insertBefore(elementToInsert, insertionPoint);}
            else if (insertionMethod === 'after' ){insertionPoint.parentNode.insertBefore(elementToInsert, insertionPoint.nextSibling);}
            else if (currentPlatform === 'chatglm'){applyChatGLMCustomStyles();}
            else if (currentPlatform === 'grok'){applyGrokCustomStyles();}
            currentMenu = createPromptMenu();
            currentModal = createPromptModal();
            languageModal = createLanguageModal();
            currentPlaceholderModal = createPlaceholderModal();
            infoModal = createInfoModal();
            document.body.appendChild(currentMenu);
            document.body.appendChild(currentModal);
            document.body.appendChild(languageModal);
            document.body.appendChild(currentPlaceholderModal);
            document.body.appendChild(infoModal);
            clickable.addEventListener('click', e => {
                e.stopPropagation();
                e.preventDefault();
                const menu = currentMenu;
                if (menu.classList.contains('visible')) {
                    closeMenu();
                    return;
                }
                refreshMenu().then(() => {
                    positionMenu(menu, clickable);
                    menu.classList.add('visible');
                    setTimeout(() => {
                        const list = menu.querySelector('#prompt-menu-list-el');
                        if (list && list.updateScrollArrows) {
                            list.updateScrollArrows();
                        }
                    }, 250);
                });
            });
            currentModal.querySelector('#__ap_save').onclick = async (e) => {
                e.stopPropagation();
                const promptId = currentModal.dataset.promptId;
                const title = document.getElementById('__ap_title').value.trim();
                const text = document.getElementById('__ap_text').value.trim();
                const usePlaceholders = document.getElementById('__ap_use_placeholders').checked;
                const autoExecute = document.getElementById('__ap_auto_execute').checked;
                if (!title || !text) { showNotification(getTranslation('requiredFields'), 'error'); return; }
                const box = currentModal.querySelector('.mp-modal-box');
                const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
                const fields = {
                    title,
                    text,
                    usePlaceholders,
                    autoExecute,
                    activeFileIds: Array.from(currentActiveFileIds),
                    tags: tags
                };
                if (promptId) {
                    const success = await updateById(promptId, fields);
                    if (!success) await addItem({ ...fields, isFixed: false });
                } else {
                    await addItem({ ...fields, isFixed: false });
                }
                hideModal(currentModal);
                currentActiveFileIds.clear();
                await refreshMenu();
                if (currentMenu) currentMenu.classList.add('visible');
            };
            const handleSaveAndExecute = async (e) => {
                if (!isShortcutPressed(e, 'saveSend')) return;
                e.preventDefault();
                e.stopPropagation();
                const promptId = currentModal.dataset.promptId;
                const title = document.getElementById('__ap_title').value.trim();
                const text = document.getElementById('__ap_text').value.trim();
                const usePlaceholders = document.getElementById('__ap_use_placeholders').checked;
                const autoExecute = document.getElementById('__ap_auto_execute').checked;
                if (!title || !text) {
                    showNotification(getTranslation('requiredFields'), 'error');
                    return;
                }
                const box = currentModal.querySelector('.mp-modal-box');
                const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
                const fields = {
                    title,
                    text,
                    usePlaceholders,
                    autoExecute,
                    activeFileIds: Array.from(currentActiveFileIds),
                    tags: tags
                };
                let savedItem;
                if (promptId) {
                    const success = await updateById(promptId, fields);
                    if (success) {
                        const allPrompts = await getAll();
                        savedItem = findById(allPrompts, promptId);
                    } else {
                        savedItem = { ...fields, isFixed: false };
                        await addItem(savedItem);
                    }
                } else {
                    savedItem = { ...fields, isFixed: false };
                    await addItem(savedItem);
                }
                hideModal(currentModal);
                currentActiveFileIds.clear();
                refreshMenu();
                if (savedItem.usePlaceholders) { openPlaceholderModal(savedItem); }
                else { insertPrompt(savedItem); }
            };
            document.getElementById('__ap_title').addEventListener('keydown', handleSaveAndExecute);
            document.getElementById('__ap_text').addEventListener('keydown', handleSaveAndExecute);
            const savePromptData = async () => {
                const title = document.getElementById('__ap_title').value.trim();
                const text = document.getElementById('__ap_text').value.trim();
                if (!title || !text) {
                    showNotification(getTranslation('requiredFields'), 'error');
                    return false;
                }
                const promptId = currentModal.dataset.promptId;
                const usePlaceholders = document.getElementById('__ap_use_placeholders').checked;
                const autoExecute = document.getElementById('__ap_auto_execute').checked;
                const box = currentModal.querySelector('.mp-modal-box');
                const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
                const fields = { title, text, usePlaceholders, autoExecute, activeFileIds: Array.from(currentActiveFileIds), tags: tags };
                if (promptId) {
                    const success = await updateById(promptId, fields);
                    if (!success) {
                        const saved = await addItem({ ...fields, isFixed: false });
                        currentModal.dataset.promptId = saved.id;
                    }
                } else {
                    const saved = await addItem({ ...fields, isFixed: false });
                    currentModal.dataset.promptId = saved.id;
                }
                currentModal.dataset.originalTitle = title;
                currentModal.dataset.originalText = text;
                showNotification(getTranslation('saveSuccess'));
                await refreshMenu();
                return true;
            };
            const handleSaveKeepOpen = async (e) => {
                if (!isShortcutPressed(e, 'saveEditor')) return;
                e.preventDefault();
                e.stopPropagation();
                await savePromptData();
            };
            document.getElementById('__ap_title').addEventListener('keydown', handleSaveKeepOpen);
            document.getElementById('__ap_text').addEventListener('keydown', handleSaveKeepOpen);
            currentModal.querySelector('#__ap_close_prompt').onclick = async (e) => {
                e.stopPropagation();
                const currentTitle = document.getElementById('__ap_title').value;
                const currentText = document.getElementById('__ap_text').value;
                const origTitle = currentModal.dataset.originalTitle || '';
                const origText = currentModal.dataset.originalText || '';
                if (currentTitle !== origTitle || currentText !== origText) {
                    const actionResult = await createDialogo({
                        message: getTranslation('confirmUnsaved'),
                        actions: [
                            { label: getTranslation('cancel'), style: 'secondary', value: 'cancel' },
                            { label: getTranslation('confirm'), style: 'danger', value: 'exit' },
                            { label: getTranslation('saveAndExit'), style: 'primary', value: 'save' }
                        ]
                    });
                    if (actionResult === 'cancel' || actionResult === undefined) {
                        return;
                    }
                    if (actionResult === 'save') {
                        const savedSuccessfully = await savePromptData();
                        if (!savedSuccessfully) {
                            return;
                        }
                    }
                }
                hideModal(currentModal);
            };
            currentPlaceholderModal.querySelector('#__ap_insert_prompt').onclick = async (e) => {
                e.stopPropagation();
                const isFromInline = currentPlaceholderModal.dataset.fromInline === "true";
                const parseData = JSON.parse(currentPlaceholderModal.dataset.parseData);
                const originalItem = JSON.parse(currentPlaceholderModal.dataset.originalItem);
                let finalText = parseData.processedText;
                const ignoreMap = new Map(parseData.ignoreMap);
                const selectMap = new Map(parseData.selectMap);
                const inputMap = new Map(parseData.inputMap);
                const fileMap = new Map(parseData.fileMap || []);
                const variablesToApply =[];
                const container = document.getElementById('__ap_placeholders_container');
                let dynamicFilesToAttach =[];
                const removeEmptyPlaceholder = (text, key) => {
                    const emptyLineRegex = new RegExp(`^[ \\t]*${key}[ \\t]*\\r?\\n?`, 'gm');
                    text = text.replace(emptyLineRegex, '');
                    text = text.split(key).join('');
                    return text;
                };
                fileMap.forEach((_data, key) => {
                    finalText = removeEmptyPlaceholder(finalText, key);
                    const files = currentPlaceholderModal._tempFiles.get(key) ||[];
                    dynamicFilesToAttach.push(...files);
                });
                inputMap.forEach((data, key) => {
                    const inputEl = container.querySelector(`textarea[data-key="${key}"]`);
                    const val = inputEl ? inputEl.value : '';
                    if (typeof data === 'object' && data.silent) {finalText = removeEmptyPlaceholder(finalText, key);}
                    else {if (val.trim() === '') {finalText = removeEmptyPlaceholder(finalText, key);} else {finalText = finalText.split(key).join(val);}}
                    if (typeof data === 'object' && data.varName) {variablesToApply.push({ name: data.varName, value: val });}
                });
                selectMap.forEach((data, key) => {
                    const group = container.querySelector(`div[data-select-key="${key}"]`);
                    const checkedCheckboxes = Array.from(group.querySelectorAll('input[type="checkbox"]:checked'));
                    const joinChar = data.isInline ? ' ' : '\n';
                    const selectedText = checkedCheckboxes.map(cb => {
                        const parent = cb.closest('.mp-option-item');
                        if (cb.dataset.type === 'other') {
                            const txtInput = parent.querySelector('.mp-other-input[data-is-other="true"]') || parent.querySelector('.mp-other-input');
                            return txtInput ? txtInput.value : '';
                        }
                        let val = cb.value;
                        const inputs = parent.querySelectorAll('.mp-other-input[data-opt-input-key]');
                        if (inputs.length > 0) {
                            inputs.forEach(inp => {
                                const inputKey = inp.dataset.optInputKey;
                                const inpValue = inp.value;
                                if (inpValue.trim() === '') {
                                    const emptyLineRegex = new RegExp(`^[ \\t]*${inputKey}[ \\t]*\\r?\\n?`, 'gm');
                                    val = val.replace(emptyLineRegex, '');
                                    val = val.split(inputKey).join('');
                                } else {
                                    val = val.split(inputKey).join(inpValue);
                                }
                            });
                        }
                        return val;
                    }).filter(val => val.trim() !== '').join(joinChar);
                    if (selectedText.trim() === '') {finalText = removeEmptyPlaceholder(finalText, key);}
                    else {finalText = finalText.split(key).join((data.indent || '') + selectedText);}
                });
                const applyVariables = (text) => {
                    if (!text) return text;
                    let t = text;
                    variablesToApply.forEach(v => {
                        const escapedVar = v.name.replace(/\$/g, '\\$');
                        const varRegex = new RegExp(escapedVar, 'g');
                        t = t.replace(varRegex, v.value);
                    });
                    return t;
                };
                finalText = applyVariables(finalText);
                const reversedIgnoreEntries = Array.from(ignoreMap.entries()).reverse();
                for (const [key, content] of reversedIgnoreEntries) {
                    if (key.startsWith('__QUOTE_')) {
                        const contentWithVars = applyVariables(content);
                        finalText = finalText.split(key).join(contentWithVars);
                    }
                    else {
                        finalText = finalText.split(key).join(content);
                    }
                }
                if (isFromInline && currentPlaceholderModal._savedCursor) {
                    const saved = currentPlaceholderModal._savedCursor;
                    const editor = document.querySelector(platformSelectors[currentPlatform]);
                    if (editor) {
                        editor.focus();
                        try {
                            if (saved.type === 'input') {
                                if (typeof editor.setSelectionRange === 'function') {
                                    editor.setSelectionRange(saved.start, saved.end);
                                }
                            } else if (saved.type === 'contenteditable' && saved.node) {
                                const sel = window.getSelection();
                                const range = document.createRange();
                                range.setStart(saved.node, saved.offset);
                                range.setEnd(saved.node, saved.offset);
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        } catch(err) {}
                    }
                }
                const finalPrompt = { ...originalItem, text: finalText, dynamicFiles: dynamicFilesToAttach };
                await insertPrompt(finalPrompt, isFromInline, isFromInline);
                currentPlaceholderModal.dataset.fromInline = "false";
                currentPlaceholderModal._savedCursor = null;
                hideModal(currentPlaceholderModal);
            };
            currentPlaceholderModal.querySelector('#__ap_close_placeholder').onclick = (e) => {
                e.stopPropagation();
                hideModal(currentPlaceholderModal);
            };
            currentModal.querySelector('#__ap_info_btn').onclick = (e) => {
                e.stopPropagation();
                showModal(infoModal);
            };
            infoModal.querySelector('#__ap_close_info').onclick = (e) => {
                e.stopPropagation();
                hideModal(infoModal);
            };
            isInitialized = true;
        }
        catch (error) {cleanup();}
        finally {setupPageObserver();}
    }
    const debouncedTryInit = debounce(tryInit, 500);
    function setupPageObserver() {
        if (pageObserver) pageObserver.disconnect();
        pageObserver = new MutationObserver(() => {
            if (!document.body.contains(currentButton)) {
                debouncedTryInit();
            }
        });
        pageObserver.observe(document.body, { childList: true, subtree: true });
    }
    function setupGlobalEventListeners() {
        document.addEventListener('click', ev => {
            if (!currentMenu || !currentButton) return;
            if (ev.target.closest('#prompt-menu-container, [data-testid="composer-button-prompts"]')) return;
            closeMenu();
        });
        document.addEventListener('keydown', ev => {
            if (ev.key === 'Escape') {
                if (currentMenu && currentMenu.classList.contains('visible')) {
                    closeMenu();
                }
                if (currentModal && currentModal.classList.contains('visible')) {
                    currentModal.querySelector('#__ap_close_prompt').click();
                }
                if (languageModal && languageModal.classList.contains('visible')) hideModal(languageModal);
                if (currentPlaceholderModal && currentPlaceholderModal.classList.contains('visible')) hideModal(currentPlaceholderModal);
            }
            if (window.__apCustomShortcutsMap && window.__apCustomShortcutsMap.length > 0) {
                const partsMatch = (ev, shortcutStr) => {
                    if (!shortcutStr) return false;
                    const parts = shortcutStr.split('+');
                    const needsCtrl = parts.includes('Ctrl');
                    const needsAlt = parts.includes('Alt');
                    const needsShift = parts.includes('Shift');
                    if (Boolean(ev.ctrlKey) !== needsCtrl || Boolean(ev.altKey) !== needsAlt || Boolean(ev.shiftKey) !== needsShift) return false;
                    const mainKey = parts[parts.length - 1];
                    let evKey = ev.key.toUpperCase();
                    if (ev.code === 'Space') evKey = 'Space';
                    if (evKey === ' ') evKey = 'Space';
                    return evKey === mainKey;
                };
                const matchedItem = window.__apCustomShortcutsMap.find(item => partsMatch(ev, item.shortcut));
                if (matchedItem) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (typeof closeMenu === 'function') closeMenu();
                    const p = matchedItem.prompt;
                    p.usageCount = (p.usageCount || 0) + 1;
                    updateById(p.id, { usageCount: p.usageCount });
                    if (typeof currentPlaceholderModal !== 'undefined' && currentPlaceholderModal) currentPlaceholderModal.dataset.fromInline = "false";
                    if (p.usePlaceholders && typeof openPlaceholderModal === 'function') openPlaceholderModal(p);
                    else if (typeof insertPrompt === 'function') insertPrompt(p);
                    return;
                }
            }
            if (isShortcutPressed(ev, 'newPrompt')) {
                ev.preventDefault();
                ev.stopPropagation();
                closeMenu();
                openPromptModal();
            }
            if (isShortcutPressed(ev, 'listPrompts')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (currentMenu && currentMenu.classList.contains('visible')) {
                    closeMenu();
                } else {
                    _abrirPesquisaComAtalho = true;
                    if (currentButton) currentButton.click();
                }
            }
            if (isShortcutPressed(ev, 'enhancePrompt')) {
                ev.preventDefault();
                ev.stopPropagation();
                handleInstantPageEnhancement();
            }
            if (isShortcutPressed(ev, 'expandedMode')) {
                ev.preventDefault();
                ev.stopPropagation();
                closeMenu();
                openExpandedPromptMenu();
            }
        });
        window.addEventListener('resize', debounce(() => {
            if (currentMenu && currentMenu.classList.contains('visible')) {
                positionMenu(currentMenu, currentButton);
            }
        }, 100));
    }
    function tryInit() {
        if (isInitializing) return;
        if (isInitialized && currentButton && document.body.contains(currentButton) && currentPlatform === detectPlatform()) {
            return;
        }
        isInitializing = true;
        initUI().finally(() => { isInitializing = false; });
    }
    async function start() {
        installAutoBackupProxy();
        const wasRestored=await restoreFromAutoBackup();
        await determineLanguage();
        await loadSyntaxConfig();
        await loadShortcuts();
        await loadPredictionConfig();
        await loadNavConfig();
        await loadPreviewPromptConfig();
        await loadTagsConfig();
        GM_registerMenuCommand(`⚙️ ${getTranslation('settings')}`, () => {
            if (!settingsModal) {
                settingsModal = createSettingsModal();
                document.body.appendChild(settingsModal);
            }
            if (settingsModal.resetToCurrent) settingsModal.resetToCurrent();
            showModal(settingsModal);
        });
        await loadAIConfig();
        await loadGistConfig();
        await loadImportedThemes();
        await loadThemeConfig();
        injectGlobalStyles();
        setupGlobalEventListeners();
        tryInit();
    }
    start();
})();
