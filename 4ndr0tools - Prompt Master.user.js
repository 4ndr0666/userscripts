// ==UserScript==
// @name                4ndr0tools - Prompt Master
// @namespace           https://github.com/4ndr0666/userscripts
// @version             27.2.1
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
// @match               *://flow.google.com/*
// @match               *://*.google.com/search?*udm=50*
// @connect             generativelanguage.googleapis.com
// @connect             gist.githubusercontent.com
// @connect             raw.githubusercontent.com
// @connect             router.huggingface.co
// @connect             api.longcat.chat
// @connect             cdn.jsdelivr.net
// @connect             fonts.googleapis.com
// @connect             fonts.gstatic.com
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

(function () {
  "use strict";
  let isInitialized = !1,
    isInitializing = !1,
    currentPlatform = null,
    settingsModal = null,
    currentPlaceholderModal = null,
    currentModal = null,
    currentMenu = null,
    currentButton = null,
    pageObserver = null,
    scriptPolicy = null;
  const policyNames = ["MyPromptPolicy", "dompurify", "default", "cwm-policy"];
  if (window.trustedTypes && window.trustedTypes.createPolicy)
    for (const e of policyNames)
      try {
        scriptPolicy = window.trustedTypes.createPolicy(e, {
          createHTML: (e) => e,
        });
        break;
      } catch (e) {}
  function setSafeInnerHTML(e, t) {
    e && (e.innerHTML = scriptPolicy ? scriptPolicy.createHTML(t) : t);
  }
  const platformSelectors = {
      chatgpt: "#prompt-textarea",
      deepseek: "textarea.ds-scroll-area",
      googleaistudio:
        "rich-textarea div[contenteditable='true'], ms-prompt-chunk textarea, ms-chunk-editor textarea, div[contenteditable='true'][role='textbox'], div[contenteditable='true'], textarea",
      qwen: ".message-input-textarea",
      zai: "textarea#chat-input",
      gemini: 'div.ql-editor[contenteditable="true"]',
      arena: 'textarea[name="message"]',
      kimi: 'div.chat-input-editor[contenteditable="true"]',
      claude: 'div.ProseMirror[contenteditable="true"]',
      grok: 'div.tiptap.ProseMirror[contenteditable="true"], textarea',
      perplexity: "#ask-input",
      longcat: "div.tiptap.ProseMirror",
      mistral: ".ProseMirror",
      yuanbao: 'div.ql-editor[contenteditable="true"]',
      chatglm: "textarea.scroll-display-none",
      poe: 'textarea[class*="GrowingTextArea_textArea"]',
      googleModoIA: "textarea.ITIRGe",
      notebooklm:
        "textarea.query-box-input, textarea[aria-label*='prompt' i], textarea[placeholder*='Ask' i], textarea, div[contenteditable='true'], rich-textarea div[contenteditable='true'], .query-box textarea",
      doubao: 'textarea, [contenteditable="true"]',
      copilot: '#userInput, textarea[data-testid="composer-input"]',
      glmimage: "textarea.flex.w-full",
      // Flow (flow.google.com / labs.google/fx/tools/flow): Google rebuilt the prompt bar
      // across the domain move + unified-workspace redesign. Cascade covers:
      //  1. PINHOLE_TEXT_AREA_ELEMENT_ID - Flow's own prompt textarea id (internal "Pinhole" component)
      //  2. legacy Slate editor (data-slate-editor) used by the old UI
      //  3. generic rich-text boxes (role=textbox, Quill, ProseMirror, custom contenteditable)
      //  4. plain textarea fallback
      flow: "#PINHOLE_TEXT_AREA_ELEMENT_ID, div[role='textbox'][data-slate-editor='true'][contenteditable='true'], div[role='textbox'][contenteditable='true'], .ql-editor[contenteditable='true'], div.ProseMirror[contenteditable='true'], rich-textarea div[contenteditable='true'], div[contenteditable='true'][aria-label], textarea:not([hidden]):not([disabled])",
      ernie: 'div[data-slate-editor="true"][role="textbox"]',
      dreamina:
        'textarea.lv-textarea.textarea-xle6zp.prompt-textarea-zqvueo, [contenteditable="true"]',
      jimengJianying: 'textarea[class*="prompt-textarea"], div.ProseMirror',
      nvidiaNim:
        'textarea.nv-text-area-element[data-testid="nv-text-area-element"]',
      indicArena: 'textarea[data-testid="rt-input-component"]',
      qianwen:
        'div[role="textbox"][data-slate-editor="true"], [contenteditable="true"]',
      geminigen: "textarea.w-full.rounded-md",
      hunyuan: "textarea, .ql-editor",
      bing: "#gi_form_q, textarea.b_searchbox",
      meta: 'div[contenteditable="true"][data-testid="composer-input"]',
      manus: 'div[contenteditable="true"].tiptap.ProseMirror',
      xiaomi: "textarea, textarea.resize-none",
    };
  const GLOBAL_FILES_KEY = "GlobalFiles";
  let currentActiveFileIds = new Set();
  async function getGlobalFiles() {
    return await GM_getValue("GlobalFiles", []);
  }
  async function saveGlobalFile(e) {
    const t = await getGlobalFiles();
    return (
      t.find((t) => t.name === e.name && t.size === e.size) ||
        (t.push(e), await GM_setValue("GlobalFiles", t)),
      t
    );
  }
  async function deleteGlobalFile(e) {
    let t = await getGlobalFiles();
    ((t = t.filter((t) => t.id !== e)), await GM_setValue("GlobalFiles", t));
  }
  function dataURLtoFile(e, t) {
    for (
      var n = e.split(","),
        a = n[0].match(/:(.*?);/)[1],
        o = atob(n[1]),
        r = o.length,
        s = new Uint8Array(r);
      r--;
    )
      s[r] = o.charCodeAt(r);
    return new File([s], t, { type: a });
  }
  const TAGS_STORAGE_KEY = "PromptTags",
    DEFAULT_TAGS_CONFIG = { tags: {}, activeFilters: [], sortMode: "manual", tagOrder: [] };
  let currentTagsConfig = JSON.parse(JSON.stringify(DEFAULT_TAGS_CONFIG)),
    tagsModal = null,
    currentPromptTags = new Set();
  async function loadTagsConfig() {
    const e = await GM_getValue("PromptTags", null);
    currentTagsConfig = e
      ? { ...DEFAULT_TAGS_CONFIG, ...e }
      : JSON.parse(JSON.stringify(DEFAULT_TAGS_CONFIG));
  }
  async function saveTagsConfig() {
    await GM_setValue("PromptTags", currentTagsConfig);
  }
  function getTagStyle(e) {
    return {
      backgroundColor: e.bgColor || "#7071fc",
      color: e.textColor || "#ffffff",
    };
  }
  async function createOrUpdateTag(e) {
    const { name: t, bgColor: n, textColor: a, comment: o } = e;
    if (!t) return !1;
    const r = t.toLowerCase().trim();
    return (
      (currentTagsConfig.tags[r] = {
        name: t.trim(),
        bgColor: n || "#7071fc",
        textColor: a || "#ffffff",
        comment: o || "",
      }),
      await saveTagsConfig(),
      !0
    );
  }
  async function deleteTag(e) {
    const t = e.toLowerCase().trim();
    delete currentTagsConfig.tags[t];
    const n = await getAll();
    for (const e of n)
      e.tags &&
        e.tags.includes(t) &&
        ((e.tags = e.tags.filter((e) => e !== t)),
        await updateById(e.id, { tags: e.tags }));
    ((currentTagsConfig.activeFilters = currentTagsConfig.activeFilters.filter(
      (e) => e !== t,
    )),
      // v27.1.0: also drop the deleted tag from the persisted order array.
      Array.isArray(currentTagsConfig.tagOrder) &&
        (currentTagsConfig.tagOrder = currentTagsConfig.tagOrder.filter(
          (e) => e !== t,
        )),
      await saveTagsConfig());
  }
  function getTag(e) {
    const t = e.toLowerCase().trim();
    return currentTagsConfig.tags[t] || null;
  }
  function getAllTags() {
    const e = Object.values(currentTagsConfig.tags),
      t = currentTagsConfig.tagOrder;
    if (Array.isArray(t) && t.length > 0) {
      const n = new Map(t.map((e, t) => [e, t]));
      e.sort((a, o) => {
        const r = a.name.toLowerCase().trim(),
          s = o.name.toLowerCase().trim();
        return (n.has(r) ? n.get(r) : t.length) - (n.has(s) ? n.get(s) : t.length);
      });
    }
    return e;
  }
  async function toggleTagFilter(e) {
    const t = e.toLowerCase().trim(),
      n = currentTagsConfig.activeFilters.indexOf(t);
    (n > -1
      ? currentTagsConfig.activeFilters.splice(n, 1)
      : currentTagsConfig.activeFilters.push(t),
      await saveTagsConfig());
  }
  async function clearTagFilters() {
    ((currentTagsConfig.activeFilters = []),
      (currentTagsConfig.sortMode = "manual"),
      await saveTagsConfig());
  }
  function isTagFilterActive(e) {
    const t = e.toLowerCase().trim();
    return currentTagsConfig.activeFilters.includes(t);
  }
  async function moveTagOrder(e, t) {
    const n = e.toLowerCase().trim(),
      a = getAllTags().map((e) => e.name.toLowerCase().trim());
    if (!a.includes(n)) return !1;
    const o = a.indexOf(n),
      r = o + (t > 0 ? 1 : -1);
    if (r < 0 || r >= a.length) return !1;
    const s = a[o];
    (a[o] = a[r]), (a[r] = s);
    const i = {};
    return (
      a.forEach((e) => {
        currentTagsConfig.tags[e] && (i[e] = currentTagsConfig.tags[e]);
      }),
      Object.keys(currentTagsConfig.tags).forEach((e) => {
        i[e] || (i[e] = currentTagsConfig.tags[e]);
      }),
      (currentTagsConfig.tags = i),
      (currentTagsConfig.tagOrder = a),
      await saveTagsConfig(),
      !0
    );
  }
  function promptMatchesFilter(e) {
    if (0 === currentTagsConfig.activeFilters.length) return !0;
    if (!e.tags || 0 === e.tags.length) return !1;
    return currentTagsConfig.activeFilters.every((t) =>
      e.tags.some((e) => e.toLowerCase().trim() === t),
    );
  }
  const PROMPT_STORAGE_KEY = "Prompts";
  function generatePromptId() {
    const e = new Date(),
      t = (e, t = 2) => String(e).padStart(t, "0");
    return (
      [
        e.getFullYear(),
        t(e.getMonth() + 1),
        t(e.getDate()),
        t(e.getHours()),
        t(e.getMinutes()),
        t(e.getSeconds()),
        t(e.getMilliseconds(), 3),
      ].join("") +
      t(Math.floor((1e3 * performance.now()) % 1e3), 3) +
      t(Math.floor(1e3 * Math.random()), 3)
    );
  }
  function normalizePositions(e) {
    return (
      e.forEach((e, t) => {
        e.position = t + 1;
      }),
      e
    );
  }
  async function getRawPrompts() {
    return await GM_getValue("Prompts", {});
  }
  async function saveRawPrompts(e) {
    await GM_setValue("Prompts", e);
  }
  function promptsToStorage(e) {
    const t = {};
    return (
      e.forEach((e) => {
        const { id: n, ...a } = e;
        t[n] = a;
      }),
      t
    );
  }
  function waitFor(e, t = 8e3) {
    return new Promise((n, a) => {
      const o = document.querySelector(e);
      if (o) return void n(o);
      const r = setTimeout(() => {
          (s.disconnect(), a());
        }, t),
        s = new MutationObserver(() => {
          const t = document.querySelector(e);
          t && (clearTimeout(r), s.disconnect(), n(t));
        });
      document.body
        ? s.observe(document.body, { childList: !0, subtree: !0 })
        : document.addEventListener("DOMContentLoaded", () =>
            s.observe(document.body, { childList: !0, subtree: !0 }),
          );
    });
  }
  window.__apCustomShortcutsMap = [];
  const debounce = (e, t) => {
    let n;
    return (...a) => {
      (clearTimeout(n), (n = setTimeout(() => e.apply(this, a), t)));
    };
  };
  async function getAll() {
    let e = await getRawPrompts();
    if (Array.isArray(e)) {
      const t = {};
      (e.forEach((e, n) => {
        const a = e.id || generatePromptId() + String(n).padStart(3, "0"),
          { id: o, position: r, ...s } = e;
        t[a] = { ...s, position: n + 1 };
      }),
        await saveRawPrompts(t),
        (e = t));
    }
    const t = Object.entries(e).map(([e, t]) => ({ id: e, ...t }));
    return (
      t.sort((e, t) => (e.position || 0) - (t.position || 0)),
      normalizePositions(t),
      (window.__apCustomShortcutsMap = t
        .filter((e) => e.shortcut)
        .map((e) => ({ shortcut: e.shortcut, prompt: e }))),
      t
    );
  }
  async function addItem(e) {
    const t = await getAll(),
      n = generatePromptId(),
      a = document.querySelector("#__ap_title"),
      o = document.querySelector("#__ap_custom_shortcut_btn"),
      r = document.querySelector("#__ap_modal_overlay");
    r &&
      !r.classList.contains("mp-hidden") &&
      a &&
      ((e.color = a.dataset.promptColor || ""),
      o && (e.shortcut = o.dataset.shortcut || ""));
    const s = {
      id: n,
      title: e.title || "",
      color: e.color || "",
      text: e.text || "",
      usePlaceholders: e.usePlaceholders || !1,
      autoExecute: e.autoExecute || !1,
      isFixed: e.isFixed || !1,
      activeFileIds: e.activeFileIds || [],
      shortcut: e.shortcut || "",
      tags: e.tags || [],
      usageCount: e.usageCount || 0,
      isShared: e.isShared || !1,
      sharedUrl: e.sharedUrl || "",
      updateInterval: void 0 !== e.updateInterval ? e.updateInterval : 7,
      lastUpdateCheck: e.lastUpdateCheck || Date.now(),
      version: e.version || "1.0.0",
      author: e.author || "",
      summary: e.summary || "",
      changelogText: e.changelogText || "",
      position: 0,
    };
    let i = t.findIndex((e) => !e.isFixed);
    return (
      -1 === i && (i = t.length),
      t.splice(i, 0, s),
      normalizePositions(t),
      await saveRawPrompts(promptsToStorage(t)),
      s
    );
  }
  async function updateById(e, t) {
    const n = await getRawPrompts();
    if (Array.isArray(n)) return (await getAll(), updateById(e, t));
    if (!n[e]) return !1;
    const a = document.querySelector("#__ap_title"),
      o = document.querySelector("#__ap_custom_shortcut_btn"),
      r = document.querySelector("#__ap_modal_overlay");
    r &&
      !r.classList.contains("mp-hidden") &&
      r.dataset.promptId === e &&
      void 0 !== t.title &&
      ((t.color = a.dataset.promptColor || ""),
      o && (t.shortcut = o.dataset.shortcut || ""));
    const s = { ...t };
    return (
      delete s.id,
      delete s.position,
      (n[e] = { ...n[e], ...s }),
      await saveRawPrompts(n),
      !0
    );
  }
  async function removeById(e) {
    const t = (await getAll()).filter((t) => t.id !== e);
    (normalizePositions(t), await saveRawPrompts(promptsToStorage(t)));
  }
  const THEME_STORAGE_KEY = "Theme",
    IMPORTED_THEMES_KEY = "ImportedThemes",
    DEFAULT_THEME_CONFIG = { themeId: "electric-glass", mode: "auto" };
  let mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)"),
    currentThemeConfig = DEFAULT_THEME_CONFIG,
    importedThemes = {};
  const themeDefinitions = {
    "electric-glass": {
      name: "3lectric-Glass",
      light: {
        "--mp-bg-primary": "rgba(10, 19, 26, 0.72)",
        "--mp-bg-secondary": "rgba(10, 19, 26, 0.65)",
        "--mp-bg-tertiary": "rgba(10, 19, 26, 0.55)",
        "--mp-bg-overlay": "rgba(10, 19, 26, 0.85)",
        "--mp-bg-disabled": "rgba(10, 19, 26, 0.4)",
        "--mp-text-primary": "#00E5FF",
        "--mp-text-secondary": "#67E8F9",
        "--mp-text-tertiary": "rgba(0, 229, 255, 0.7)",
        "--mp-text-buttons": "#ffffff",
        "--mp-text-disabled": "rgba(0, 229, 255, 0.35)",
        "--mp-border-primary": "rgba(0, 229, 255, 0.4)",
        "--mp-border-secondary": "rgba(0, 229, 255, 0.2)",
        "--mp-focus-ring": "rgba(0, 229, 255, 0.5)",
        "--mp-accent-primary": "#00E5FF",
        "--mp-accent-primary-hover": "#67E8F9",
        "--mp-success": "#00E5FF",
        "--mp-warning": "#67E8F9",
        "--mp-error": "#ff0055",
        "--mp-info": "#00E5FF",
        "--mp-switch-knob": "#00E5FF",
        "--mp-shadow-sm": "0 0 8px rgba(0, 229, 255, 0.15)",
        "--mp-shadow-md": "0 0 20px rgba(0, 229, 255, 0.3)",
        "--mp-syntax-escape": "#ff0055",
        "--mp-syntax-ignore-fence": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-ignore-content": "rgba(0, 229, 255, 0.35)",
        "--mp-syntax-quote-fence": "#67E8F9",
        "--mp-syntax-quote-content": "#00E5FF",
        "--mp-syntax-var-keyword": "#67E8F9",
        "--mp-syntax-var-flag": "#00E5FF",
        "--mp-syntax-file-keyword": "#ff0055",
        "--mp-syntax-sel-fence": "#67E8F9",
        "--mp-syntax-sel-header": "#00E5FF",
        "--mp-syntax-sel-multi": "#67E8F9",
        "--mp-syntax-sel-single": "#ff0055",
        "--mp-syntax-sel-id": "#00E5FF",
        "--mp-syntax-sel-other": "#67E8F9",
        "--mp-syntax-sel-sep": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-free-bracket": "#67E8F9",
        "--mp-syntax-free-label": "#00E5FF",
        "--mp-syntax-in-bracket": "#ff0055",
        "--mp-syntax-in-label": "#ff0055",
        "--mp-syntax-in-eq": "#67E8F9",
        "--mp-syntax-sil-bracket": "#67E8F9",
        "--mp-syntax-sil-label": "#00E5FF",
        "--mp-syntax-sil-eq": "#67E8F9",
        "--mp-syntax-var": "#00E5FF",
        "--mp-syntax-context": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-def-sep": "#ff0055",
        "--mp-syntax-def-val": "#ff0055",
        "--mp-syntax-sel-checked": "#00E5FF",
        "--mp-syntax-caret": "#00E5FF",
        "--mp-syntax-selection": "color-mix(in srgb, #00E5FF 30%, transparent)",
      },
      dark: {
        "--mp-bg-primary": "rgba(10, 19, 26, 0.72)",
        "--mp-bg-secondary": "rgba(10, 19, 26, 0.65)",
        "--mp-bg-tertiary": "rgba(10, 19, 26, 0.55)",
        "--mp-bg-overlay": "rgba(10, 19, 26, 0.85)",
        "--mp-bg-disabled": "rgba(10, 19, 26, 0.4)",
        "--mp-text-primary": "#00E5FF",
        "--mp-text-secondary": "#67E8F9",
        "--mp-text-tertiary": "rgba(0, 229, 255, 0.7)",
        "--mp-text-buttons": "#ffffff",
        "--mp-text-disabled": "rgba(0, 229, 255, 0.35)",
        "--mp-border-primary": "rgba(0, 229, 255, 0.4)",
        "--mp-border-secondary": "rgba(0, 229, 255, 0.2)",
        "--mp-focus-ring": "rgba(0, 229, 255, 0.5)",
        "--mp-accent-primary": "#00E5FF",
        "--mp-accent-primary-hover": "#67E8F9",
        "--mp-success": "#00E5FF",
        "--mp-warning": "#67E8F9",
        "--mp-error": "#ff0055",
        "--mp-info": "#00E5FF",
        "--mp-switch-knob": "#00E5FF",
        "--mp-shadow-sm": "0 0 8px rgba(0, 229, 255, 0.15)",
        "--mp-shadow-md": "0 0 20px rgba(0, 229, 255, 0.3)",
        "--mp-syntax-escape": "#ff0055",
        "--mp-syntax-ignore-fence": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-ignore-content": "rgba(0, 229, 255, 0.35)",
        "--mp-syntax-quote-fence": "#67E8F9",
        "--mp-syntax-quote-content": "#00E5FF",
        "--mp-syntax-var-keyword": "#67E8F9",
        "--mp-syntax-var-flag": "#00E5FF",
        "--mp-syntax-file-keyword": "#ff0055",
        "--mp-syntax-sel-fence": "#67E8F9",
        "--mp-syntax-sel-header": "#00E5FF",
        "--mp-syntax-sel-multi": "#67E8F9",
        "--mp-syntax-sel-single": "#ff0055",
        "--mp-syntax-sel-id": "#00E5FF",
        "--mp-syntax-sel-other": "#67E8F9",
        "--mp-syntax-sel-sep": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-free-bracket": "#67E8F9",
        "--mp-syntax-free-label": "#00E5FF",
        "--mp-syntax-in-bracket": "#ff0055",
        "--mp-syntax-in-label": "#ff0055",
        "--mp-syntax-in-eq": "#67E8F9",
        "--mp-syntax-sil-bracket": "#67E8F9",
        "--mp-syntax-sil-label": "#00E5FF",
        "--mp-syntax-sil-eq": "#67E8F9",
        "--mp-syntax-var": "#00E5FF",
        "--mp-syntax-context": "rgba(0, 229, 255, 0.5)",
        "--mp-syntax-def-sep": "#ff0055",
        "--mp-syntax-def-val": "#ff0055",
        "--mp-syntax-sel-checked": "#00E5FF",
        "--mp-syntax-caret": "#00E5FF",
        "--mp-syntax-selection": "color-mix(in srgb, #00E5FF 30%, transparent)",
      },
    },
    default: {
      name: "default",
      light: {
        "--mp-bg-primary": "#ffffff",
        "--mp-bg-secondary": "#f8f9fa",
        "--mp-bg-tertiary": "#e2e4e6",
        "--mp-bg-overlay": "rgba(10, 10, 10, 0.5)",
        "--mp-bg-disabled": "#e9ecef",
        "--mp-text-primary": "#212529",
        "--mp-text-secondary": "#495057",
        "--mp-text-tertiary": "#868e96",
        "--mp-text-buttons": "#ffffff",
        "--mp-text-disabled": "#adb5bd",
        "--mp-border-primary": "#dee2e6",
        "--mp-border-secondary": "#ced4da",
        "--mp-focus-ring": "rgba(112, 113, 252, 0.4)",
        "--mp-accent-primary": "#7071fc",
        "--mp-accent-primary-hover": "#595ac9",
        "--mp-success": "#28a745",
        "--mp-warning": "#ffc107",
        "--mp-error": "#dc3545",
        "--mp-info": "#17a2b8",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.04)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.1)",
        "--mp-syntax-escape": "#ff6b6b",
        "--mp-syntax-ignore-fence": "#868e96",
        "--mp-syntax-ignore-content": "#adb5bd",
        "--mp-syntax-quote-fence": "#2b8a3e",
        "--mp-syntax-quote-content": "#40c057",
        "--mp-syntax-var-keyword": "#15aabf",
        "--mp-syntax-var-flag": "#0c8599",
        "--mp-syntax-file-keyword": "#e64980",
        "--mp-syntax-sel-fence": "#4c6ef5",
        "--mp-syntax-sel-header": "#3b5bdb",
        "--mp-syntax-sel-multi": "#339af0",
        "--mp-syntax-sel-single": "#ff8787",
        "--mp-syntax-sel-id": "#da77f2",
        "--mp-syntax-sel-other": "#fa7b05",
        "--mp-syntax-sel-sep": "#adb5bd",
        "--mp-syntax-free-bracket": "#fab005",
        "--mp-syntax-free-label": "#e67700",
        "--mp-syntax-in-bracket": "#d6336c",
        "--mp-syntax-in-label": "#a61e4d",
        "--mp-syntax-in-eq": "#f06595",
        "--mp-syntax-sil-bracket": "#845ef7",
        "--mp-syntax-sil-label": "#6741d9",
        "--mp-syntax-sil-eq": "#b197fc",
        "--mp-syntax-var": "#099268",
        "--mp-syntax-context": "#868e96",
        "--mp-syntax-def-sep": "#f03e3e",
        "--mp-syntax-def-val": "#ff8787",
        "--mp-syntax-sel-checked": "#20c997",
        "--mp-syntax-caret": "var(--mp-text-primary, #000000)",
        "--mp-syntax-selection":
          "color-mix(in srgb, var(--mp-accent-primary, #4c6ef5) 30%, transparent)",
      },
      dark: {
        "--mp-bg-primary": "#212529",
        "--mp-bg-secondary": "#2c2c30",
        "--mp-bg-tertiary": "#343a40",
        "--mp-bg-overlay": "rgba(0, 0, 0, 0.7)",
        "--mp-bg-disabled": "#3d4248",
        "--mp-text-primary": "#f8f9fa",
        "--mp-text-secondary": "#e9ecef",
        "--mp-text-tertiary": "#adb5bd",
        "--mp-text-buttons": "#ffffff",
        "--mp-text-disabled": "#6c757d",
        "--mp-border-primary": "#495057",
        "--mp-border-secondary": "#868e96",
        "--mp-focus-ring": "rgba(112, 113, 252, 0.6)",
        "--mp-accent-primary": "#7071fc",
        "--mp-accent-primary-hover": "#595ac9",
        "--mp-success": "#34c759",
        "--mp-warning": "#ff9f0a",
        "--mp-error": "#ff4d4f",
        "--mp-info": "#5ac8fa",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.15)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.25)",
        "--mp-syntax-escape": "#ff8787",
        "--mp-syntax-ignore-fence": "#adb5bd",
        "--mp-syntax-ignore-content": "#868e96",
        "--mp-syntax-quote-fence": "#69db7c",
        "--mp-syntax-quote-content": "#b2f2bb",
        "--mp-syntax-var-keyword": "#3bc9db",
        "--mp-syntax-var-flag": "#99e9f2",
        "--mp-syntax-file-keyword": "#f783ac",
        "--mp-syntax-sel-fence": "#91a7ff",
        "--mp-syntax-sel-header": "#bac8ff",
        "--mp-syntax-sel-multi": "#74c0fc",
        "--mp-syntax-sel-single": "#ffc9c9",
        "--mp-syntax-sel-id": "#e599f7",
        "--mp-syntax-sel-other": "#fa7b05",
        "--mp-syntax-sel-sep": "#868e96",
        "--mp-syntax-free-bracket": "#ffd43b",
        "--mp-syntax-free-label": "#fab005",
        "--mp-syntax-in-bracket": "#f06595",
        "--mp-syntax-in-label": "#fcc2d7",
        "--mp-syntax-in-eq": "#faa2c1",
        "--mp-syntax-sil-bracket": "#b197fc",
        "--mp-syntax-sil-label": "#d0bfff",
        "--mp-syntax-sil-eq": "#9775fa",
        "--mp-syntax-var": "#38d9a9",
        "--mp-syntax-context": "#ced4da",
        "--mp-syntax-def-sep": "#ff6b6b",
        "--mp-syntax-def-val": "#ffc9c9",
        "--mp-syntax-sel-checked": "#63e6be",
      },
    },
    dracula: {
      name: "Dracula",
      light: {
        "--mp-bg-primary": "#f8f8f2",
        "--mp-bg-secondary": "#e2e2e2",
        "--mp-bg-tertiary": "#d6d6d6",
        "--mp-bg-overlay": "rgba(40, 42, 54, 0.5)",
        "--mp-text-primary": "#282a36",
        "--mp-text-secondary": "#44475a",
        "--mp-text-tertiary": "#6272a4",
        "--mp-border-primary": "#bd93f9",
        "--mp-border-secondary": "#6272a4",
        "--mp-accent-primary": "#ff79c6",
        "--mp-accent-primary-hover": "#ff92d0",
        "--mp-accent-edit": "#f1fa8c",
        "--mp-accent-edit-hover": "#e6ee82",
        "--mp-accent-close": "#ff5555",
        "--mp-accent-close-hover": "#ff6e6e",
        "--mp-btn-export-bg": "rgba(139, 233, 253, 0.1)",
        "--mp-btn-export-color": "#8be9fd",
        "--mp-btn-add-bg": "rgba(80, 250, 123, 0.1)",
        "--mp-btn-add-color": "#50fa7b",
        "--mp-btn-import-bg": "rgba(255, 184, 108, 0.1)",
        "--mp-btn-import-color": "#ffb86c",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(98, 114, 164, 0.2)",
        "--mp-shadow-md": "0 4px 12px rgba(98, 114, 164, 0.2)",
        "--mp-syntax-escape": "#ff5555",
        "--mp-syntax-ignore-fence": "#6272a4",
        "--mp-syntax-ignore-content": "#9099b5",
        "--mp-syntax-quote-fence": "#2e8b57",
        "--mp-syntax-quote-content": "#3cb371",
        "--mp-syntax-var-keyword": "#0092a8",
        "--mp-syntax-var-flag": "#007a8c",
        "--mp-syntax-file-keyword": "#d8479a",
        "--mp-syntax-sel-fence": "#8b5fcf",
        "--mp-syntax-sel-header": "#7048b5",
        "--mp-syntax-sel-multi": "#0097a7",
        "--mp-syntax-sel-single": "#e65100",
        "--mp-syntax-sel-id": "#c040a0",
        "--mp-syntax-sel-other": "#1654ff",
        "--mp-syntax-sel-sep": "#6272a4",
        "--mp-syntax-free-bracket": "#d4a017",
        "--mp-syntax-free-label": "#b8860b",
        "--mp-syntax-in-bracket": "#d63384",
        "--mp-syntax-in-label": "#a02568",
        "--mp-syntax-in-eq": "#e04898",
        "--mp-syntax-sil-bracket": "#8b5fcf",
        "--mp-syntax-sil-label": "#6a40b0",
        "--mp-syntax-sil-eq": "#a882e8",
        "--mp-syntax-var": "#2e8b57",
        "--mp-syntax-context": "#6272a4",
        "--mp-syntax-def-sep": "#6200d1",
        "--mp-syntax-def-val": "#9604eb",
        "--mp-syntax-sel-checked": "#4b8500",
      },
      dark: {
        "--mp-bg-primary": "#282a36",
        "--mp-bg-secondary": "#44475a",
        "--mp-bg-tertiary": "#6272a4",
        "--mp-bg-overlay": "rgba(0, 0, 0, 0.7)",
        "--mp-text-primary": "#f8f8f2",
        "--mp-text-secondary": "#bfbfbf",
        "--mp-text-tertiary": "#6272a4",
        "--mp-border-primary": "#6272a4",
        "--mp-border-secondary": "#44475a",
        "--mp-accent-primary": "#bd93f9",
        "--mp-accent-primary-hover": "#caa9fa",
        "--mp-accent-edit": "#f1fa8c",
        "--mp-accent-edit-hover": "#ffffa5",
        "--mp-accent-close": "#ff5555",
        "--mp-accent-close-hover": "#ff6e6e",
        "--mp-btn-export-bg": "rgba(139, 233, 253, 0.15)",
        "--mp-btn-export-color": "#8be9fd",
        "--mp-btn-add-bg": "rgba(80, 250, 123, 0.15)",
        "--mp-btn-add-color": "#50fa7b",
        "--mp-btn-import-bg": "rgba(255, 184, 108, 0.15)",
        "--mp-btn-import-color": "#ffb86c",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.3)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.4)",
        "--mp-syntax-escape": "#ff5555",
        "--mp-syntax-ignore-fence": "#6272a4",
        "--mp-syntax-ignore-content": "#44475a",
        "--mp-syntax-quote-fence": "#50fa7b",
        "--mp-syntax-quote-content": "#8afc9f",
        "--mp-syntax-var-keyword": "#8be9fd",
        "--mp-syntax-var-flag": "#a6effd",
        "--mp-syntax-file-keyword": "#ff79c6",
        "--mp-syntax-sel-fence": "#bd93f9",
        "--mp-syntax-sel-header": "#caa9fa",
        "--mp-syntax-sel-multi": "#8be9fd",
        "--mp-syntax-sel-single": "#ffb86c",
        "--mp-syntax-sel-id": "#ff79c6",
        "--mp-syntax-sel-other": "#4c7cff",
        "--mp-syntax-sel-sep": "#6272a4",
        "--mp-syntax-free-bracket": "#f1fa8c",
        "--mp-syntax-free-label": "#e6ee82",
        "--mp-syntax-in-bracket": "#ff79c6",
        "--mp-syntax-in-label": "#ff92d0",
        "--mp-syntax-in-eq": "#ffa6da",
        "--mp-syntax-sil-bracket": "#bd93f9",
        "--mp-syntax-sil-label": "#d0b0fa",
        "--mp-syntax-sil-eq": "#a577f5",
        "--mp-syntax-var": "#50fa7b",
        "--mp-syntax-context": "#6272a4",
        "--mp-syntax-def-sep": "#f94aff",
        "--mp-syntax-def-val": "#e372ff",
        "--mp-syntax-sel-checked": "#46ff6e",
      },
    },
    coffee: {
      name: "Coffee",
      light: {
        "--mp-bg-primary": "#fffbf0",
        "--mp-bg-secondary": "#f3e5d0",
        "--mp-bg-tertiary": "#e6d0b3",
        "--mp-bg-overlay": "rgba(67, 40, 24, 0.3)",
        "--mp-text-primary": "#432818",
        "--mp-text-secondary": "#6f4e37",
        "--mp-text-tertiary": "#9c6644",
        "--mp-border-primary": "#d4a373",
        "--mp-border-secondary": "#e6ccb2",
        "--mp-accent-primary": "#bb9457",
        "--mp-accent-primary-hover": "#997b46",
        "--mp-accent-edit": "#e9c46a",
        "--mp-accent-edit-hover": "#deb045",
        "--mp-accent-close": "#bc4749",
        "--mp-accent-close-hover": "#a3393b",
        "--mp-btn-export-bg": "rgba(69, 123, 157, 0.1)",
        "--mp-btn-export-color": "#457b9d",
        "--mp-btn-add-bg": "rgba(106, 153, 78, 0.1)",
        "--mp-btn-add-color": "#6a994e",
        "--mp-btn-import-bg": "rgba(231, 111, 81, 0.1)",
        "--mp-btn-import-color": "#e76f51",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(67, 40, 24, 0.1)",
        "--mp-shadow-md": "0 4px 12px rgba(67, 40, 24, 0.15)",
        "--mp-syntax-escape": "#bc4749",
        "--mp-syntax-ignore-fence": "#9c6644",
        "--mp-syntax-ignore-content": "#b8977a",
        "--mp-syntax-quote-fence": "#386641",
        "--mp-syntax-quote-content": "#6a994e",
        "--mp-syntax-var-keyword": "#457b9d",
        "--mp-syntax-var-flag": "#2a6f97",
        "--mp-syntax-file-keyword": "#c44536",
        "--mp-syntax-sel-fence": "#8a5a44",
        "--mp-syntax-sel-header": "#6f4e37",
        "--mp-syntax-sel-multi": "#457b9d",
        "--mp-syntax-sel-single": "#e76f51",
        "--mp-syntax-sel-id": "#9c6644",
        "--mp-syntax-sel-other": "#b4581b",
        "--mp-syntax-sel-sep": "#b8977a",
        "--mp-syntax-free-bracket": "#c9a227",
        "--mp-syntax-free-label": "#a68b1f",
        "--mp-syntax-in-bracket": "#bc4749",
        "--mp-syntax-in-label": "#9b2226",
        "--mp-syntax-in-eq": "#d6595b",
        "--mp-syntax-sil-bracket": "#8a5a44",
        "--mp-syntax-sil-label": "#6f4e37",
        "--mp-syntax-sil-eq": "#a77357",
        "--mp-syntax-var": "#386641",
        "--mp-syntax-context": "#9c6644",
        "--mp-syntax-def-sep": "#2ea100",
        "--mp-syntax-def-val": "#00970d",
        "--mp-syntax-sel-checked": "#ff46ac",
      },
      dark: {
        "--mp-bg-primary": "#1a1412",
        "--mp-bg-secondary": "#2b211e",
        "--mp-bg-tertiary": "#3e312b",
        "--mp-bg-overlay": "rgba(0, 0, 0, 0.8)",
        "--mp-text-primary": "#ede0d4",
        "--mp-text-secondary": "#ddb892",
        "--mp-text-tertiary": "#b08968",
        "--mp-border-primary": "#7f5539",
        "--mp-border-secondary": "#5c3d2e",
        "--mp-accent-primary": "#d4a373",
        "--mp-accent-primary-hover": "#e6ccb2",
        "--mp-accent-edit": "#f4a261",
        "--mp-accent-edit-hover": "#fbc492",
        "--mp-accent-close": "#e76f51",
        "--mp-accent-close-hover": "#ff8a6e",
        "--mp-btn-export-bg": "rgba(168, 218, 220, 0.15)",
        "--mp-btn-export-color": "#a8dadc",
        "--mp-btn-add-bg": "rgba(144, 190, 109, 0.15)",
        "--mp-btn-add-color": "#90be6d",
        "--mp-btn-import-bg": "rgba(244, 162, 97, 0.15)",
        "--mp-btn-import-color": "#f4a261",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.5)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.6)",
        "--mp-syntax-escape": "#e76f51",
        "--mp-syntax-ignore-fence": "#b08968",
        "--mp-syntax-ignore-content": "#7f5539",
        "--mp-syntax-quote-fence": "#90be6d",
        "--mp-syntax-quote-content": "#a8d08d",
        "--mp-syntax-var-keyword": "#a8dadc",
        "--mp-syntax-var-flag": "#c4e7e8",
        "--mp-syntax-file-keyword": "#f4a261",
        "--mp-syntax-sel-fence": "#d4a373",
        "--mp-syntax-sel-header": "#e6ccb2",
        "--mp-syntax-sel-multi": "#a8dadc",
        "--mp-syntax-sel-single": "#f4a261",
        "--mp-syntax-sel-id": "#ddb892",
        "--mp-syntax-sel-other": "#e6ff59",
        "--mp-syntax-sel-sep": "#7f5539",
        "--mp-syntax-free-bracket": "#e9c46a",
        "--mp-syntax-free-label": "#d4a647",
        "--mp-syntax-in-bracket": "#e76f51",
        "--mp-syntax-in-label": "#f4a261",
        "--mp-syntax-in-eq": "#f5c28e",
        "--mp-syntax-sil-bracket": "#c99a65",
        "--mp-syntax-sil-label": "#d4a373",
        "--mp-syntax-sil-eq": "#a67c52",
        "--mp-syntax-var": "#90be6d",
        "--mp-syntax-context": "#b08968",
        "--mp-syntax-def-sep": "#7fff4c",
        "--mp-syntax-def-val": "#98ff7e",
        "--mp-syntax-sel-checked": "#388eff",
      },
    },
    cyberpunk: {
      name: "Cyberpunk",
      light: {
        "--mp-bg-primary": "#f0f0f5",
        "--mp-bg-secondary": "#e2e2ea",
        "--mp-bg-tertiary": "#d1d1db",
        "--mp-bg-overlay": "rgba(10, 10, 35, 0.4)",
        "--mp-text-primary": "#050505",
        "--mp-text-secondary": "#2e2e38",
        "--mp-text-tertiary": "#5a5a66",
        "--mp-border-primary": "#b8b8c2",
        "--mp-border-secondary": "#d1d1db",
        "--mp-accent-primary": "#b000b0",
        "--mp-accent-primary-hover": "#8a008a",
        "--mp-accent-edit": "#e6b800",
        "--mp-accent-edit-hover": "#c29b00",
        "--mp-accent-close": "#d90429",
        "--mp-accent-close-hover": "#a1031f",
        "--mp-btn-export-bg": "rgba(0, 168, 181, 0.1)",
        "--mp-btn-export-color": "#0097a7",
        "--mp-btn-add-bg": "rgba(0, 184, 92, 0.1)",
        "--mp-btn-add-color": "#008f47",
        "--mp-btn-import-bg": "rgba(245, 124, 0, 0.1)",
        "--mp-btn-import-color": "#ef6c00",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.15)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.2)",
        "--mp-syntax-escape": "#d90429",
        "--mp-syntax-ignore-fence": "#5a5a66",
        "--mp-syntax-ignore-content": "#8a8a96",
        "--mp-syntax-quote-fence": "#008f47",
        "--mp-syntax-quote-content": "#00a854",
        "--mp-syntax-var-keyword": "#0097a7",
        "--mp-syntax-var-flag": "#00838f",
        "--mp-syntax-file-keyword": "#b000b0",
        "--mp-syntax-sel-fence": "#7b00a0",
        "--mp-syntax-sel-header": "#5c0078",
        "--mp-syntax-sel-multi": "#0097a7",
        "--mp-syntax-sel-single": "#ef6c00",
        "--mp-syntax-sel-id": "#9c0090",
        "--mp-syntax-sel-other": "#b41b1b",
        "--mp-syntax-sel-sep": "#7a7a86",
        "--mp-syntax-free-bracket": "#b89600",
        "--mp-syntax-free-label": "#9a7d00",
        "--mp-syntax-in-bracket": "#d90429",
        "--mp-syntax-in-label": "#a50320",
        "--mp-syntax-in-eq": "#e83553",
        "--mp-syntax-sil-bracket": "#7b00a0",
        "--mp-syntax-sil-label": "#5c0078",
        "--mp-syntax-sil-eq": "#9a30c0",
        "--mp-syntax-var": "#008f47",
        "--mp-syntax-context": "#5a5a66",
        "--mp-syntax-def-sep": "#2e0077",
        "--mp-syntax-def-val": "#5100d4",
        "--mp-syntax-sel-checked": "#b3ff38",
      },
      dark: {
        "--mp-bg-primary": "#09090b",
        "--mp-bg-secondary": "#121217",
        "--mp-bg-tertiary": "#1c1c24",
        "--mp-bg-overlay": "rgba(0, 0, 0, 0.85)",
        "--mp-text-primary": "#ffffff",
        "--mp-text-secondary": "#e0e0e0",
        "--mp-text-tertiary": "#a1a1aa",
        "--mp-border-primary": "#272730",
        "--mp-border-secondary": "#3f3f46",
        "--mp-accent-primary": "#f700ff",
        "--mp-accent-primary-hover": "#d900df",
        "--mp-accent-edit": "#fcee0a",
        "--mp-accent-edit-hover": "#e6d805",
        "--mp-accent-close": "#ff2a6d",
        "--mp-accent-close-hover": "#e01655",
        "--mp-btn-export-bg": "rgba(0, 243, 255, 0.15)",
        "--mp-btn-export-color": "#00f3ff",
        "--mp-btn-add-bg": "rgba(0, 255, 65, 0.15)",
        "--mp-btn-add-color": "#00ff41",
        "--mp-btn-import-bg": "rgba(255, 153, 0, 0.15)",
        "--mp-btn-import-color": "#ff9900",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 4px rgba(0, 243, 255, 0.1)",
        "--mp-shadow-md": "0 4px 12px rgba(247, 0, 255, 0.15)",
        "--mp-syntax-escape": "#ff2a6d",
        "--mp-syntax-ignore-fence": "#a1a1aa",
        "--mp-syntax-ignore-content": "#52525b",
        "--mp-syntax-quote-fence": "#00ff41",
        "--mp-syntax-quote-content": "#66ff85",
        "--mp-syntax-var-keyword": "#00f3ff",
        "--mp-syntax-var-flag": "#66f8ff",
        "--mp-syntax-file-keyword": "#f700ff",
        "--mp-syntax-sel-fence": "#bf00ff",
        "--mp-syntax-sel-header": "#d966ff",
        "--mp-syntax-sel-multi": "#00f3ff",
        "--mp-syntax-sel-single": "#ff9900",
        "--mp-syntax-sel-id": "#f700ff",
        "--mp-syntax-sel-other": "#ff7474",
        "--mp-syntax-sel-sep": "#52525b",
        "--mp-syntax-free-bracket": "#fcee0a",
        "--mp-syntax-free-label": "#fdf45c",
        "--mp-syntax-in-bracket": "#ff2a6d",
        "--mp-syntax-in-label": "#ff6699",
        "--mp-syntax-in-eq": "#ff4d88",
        "--mp-syntax-sil-bracket": "#bf00ff",
        "--mp-syntax-sil-label": "#d147ff",
        "--mp-syntax-sil-eq": "#9900cc",
        "--mp-syntax-var": "#00ff41",
        "--mp-syntax-context": "#a1a1aa",
        "--mp-syntax-def-sep": "#ad7aff",
        "--mp-syntax-def-val": "#d579ff",
        "--mp-syntax-sel-checked": "#ff00d4",
      },
    },
    "full-dark": {
      name: "Full Dark",
      light: {
        "--mp-bg-primary": "#ffffff",
        "--mp-bg-secondary": "#f5f5f5",
        "--mp-bg-tertiary": "#e6e6e6",
        "--mp-bg-overlay": "rgba(0, 0, 0, 0.2)",
        "--mp-text-primary": "#000000",
        "--mp-text-secondary": "#404040",
        "--mp-text-tertiary": "#737373",
        "--mp-text-buttons": "#ffffff",
        "--mp-border-primary": "#000000",
        "--mp-border-secondary": "#cccccc",
        "--mp-accent-primary": "#000000",
        "--mp-accent-primary-hover": "#333333",
        "--mp-accent-edit": "#eab308",
        "--mp-accent-edit-hover": "#ca8a04",
        "--mp-accent-close": "#dc2626",
        "--mp-accent-close-hover": "#b91c1c",
        "--mp-btn-export-bg": "rgba(37, 99, 235, 0.1)",
        "--mp-btn-export-color": "#2563eb",
        "--mp-btn-add-bg": "rgba(5, 150, 105, 0.1)",
        "--mp-btn-add-color": "#059669",
        "--mp-btn-import-bg": "rgba(234, 88, 12, 0.1)",
        "--mp-btn-import-color": "#ea580c",
        "--mp-switch-knob": "#ffffff",
        "--mp-shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.1)",
        "--mp-shadow-md": "0 4px 12px rgba(0, 0, 0, 0.15)",
        "--mp-syntax-escape": "#dc2626",
        "--mp-syntax-ignore-fence": "#737373",
        "--mp-syntax-ignore-content": "#a3a3a3",
        "--mp-syntax-quote-fence": "#059669",
        "--mp-syntax-quote-content": "#10b981",
        "--mp-syntax-var-keyword": "#2563eb",
        "--mp-syntax-var-flag": "#1d4ed8",
        "--mp-syntax-file-keyword": "#ea580c",
        "--mp-syntax-sel-fence": "#7c3aed",
        "--mp-syntax-sel-header": "#6d28d9",
        "--mp-syntax-sel-multi": "#2563eb",
        "--mp-syntax-sel-single": "#ea580c",
        "--mp-syntax-sel-id": "#db2777",
        "--mp-syntax-sel-other": "#008080",
        "--mp-syntax-sel-sep": "#a3a3a3",
        "--mp-syntax-free-bracket": "#ca8a04",
        "--mp-syntax-free-label": "#a16207",
        "--mp-syntax-in-bracket": "#dc2626",
        "--mp-syntax-in-label": "#b91c1c",
        "--mp-syntax-in-eq": "#e11d48",
        "--mp-syntax-sil-bracket": "#7c3aed",
        "--mp-syntax-sil-label": "#6d28d9",
        "--mp-syntax-sil-eq": "#8b5cf6",
        "--mp-syntax-var": "#059669",
        "--mp-syntax-context": "#737373",
        "--mp-syntax-def-sep": "#ff0040",
        "--mp-syntax-def-val": "#ff0040",
        "--mp-syntax-sel-checked": "#ff0000",
      },
      dark: {
        "--mp-bg-primary": "#000000",
        "--mp-bg-secondary": "#0a0a0a",
        "--mp-bg-tertiary": "#141414",
        "--mp-bg-overlay": "rgba(255, 255, 255, 0.05)",
        "--mp-text-primary": "#ffffff",
        "--mp-text-secondary": "#e5e5e5",
        "--mp-text-tertiary": "#a3a3a3",
        "--mp-text-buttons": "#000000",
        "--mp-border-primary": "#333333",
        "--mp-border-secondary": "#262626",
        "--mp-accent-primary": "#ffffff",
        "--mp-accent-primary-hover": "#d4d4d4",
        "--mp-accent-edit": "#facc15",
        "--mp-accent-edit-hover": "#fde047",
        "--mp-accent-close": "#f87171",
        "--mp-accent-close-hover": "#fca5a5",
        "--mp-btn-export-bg": "rgba(59, 130, 246, 0.2)",
        "--mp-btn-export-color": "#3b82f6",
        "--mp-btn-add-bg": "rgba(34, 197, 94, 0.2)",
        "--mp-btn-add-color": "#22c55e",
        "--mp-btn-import-bg": "rgba(249, 115, 22, 0.2)",
        "--mp-btn-import-color": "#f97316",
        "--mp-switch-knob": "#000000",
        "--mp-shadow-sm": "none",
        "--mp-shadow-md": "0 0 0 1px #333333",
        "--mp-syntax-escape": "#f87171",
        "--mp-syntax-ignore-fence": "#a3a3a3",
        "--mp-syntax-ignore-content": "#525252",
        "--mp-syntax-quote-fence": "#22c55e",
        "--mp-syntax-quote-content": "#4ade80",
        "--mp-syntax-var-keyword": "#3b82f6",
        "--mp-syntax-var-flag": "#60a5fa",
        "--mp-syntax-file-keyword": "#f97316",
        "--mp-syntax-sel-fence": "#a855f7",
        "--mp-syntax-sel-header": "#c084fc",
        "--mp-syntax-sel-multi": "#3b82f6",
        "--mp-syntax-sel-single": "#f97316",
        "--mp-syntax-sel-id": "#ec4899",
        "--mp-syntax-sel-other": "#00fcfc",
        "--mp-syntax-sel-sep": "#525252",
        "--mp-syntax-free-bracket": "#facc15",
        "--mp-syntax-free-label": "#fde047",
        "--mp-syntax-in-bracket": "#f87171",
        "--mp-syntax-in-label": "#fca5a5",
        "--mp-syntax-in-eq": "#fb7185",
        "--mp-syntax-sil-bracket": "#a855f7",
        "--mp-syntax-sil-label": "#c084fc",
        "--mp-syntax-sil-eq": "#8b5cf6",
        "--mp-syntax-var": "#22c55e",
        "--mp-syntax-context": "#a3a3a3",
        "--mp-syntax-def-sep": "#ff0040",
        "--mp-syntax-def-val": "#ff0040",
        "--mp-syntax-sel-checked": "#ff0000",
      },
    },
  };
  function applyTheme(e) {
    if (!e) return;
    const t =
      importedThemes[e.themeId] ||
      themeDefinitions[e.themeId] ||
      themeDefinitions.default;
    if ((Object.assign(ICONS, DEFAULT_ICONS), t.icons)) {
      const e = {};
      (Object.keys(t.icons).forEach((n) => {
        DEFAULT_ICONS.hasOwnProperty(n) && (e[n] = t.icons[n]);
      }),
        Object.assign(ICONS, e));
    }
    let n = e.mode;
    "auto" === n && (n = mediaQueryList.matches ? "dark" : "light");
    const a = t[n] || themeDefinitions.default[n],
      o = [],
      r = (e) => {
        Array.isArray(e) ? e.forEach((e) => o.push(e)) : e && o.push(e);
      };
    (t["@import"] && r(t["@import"]),
      Object.keys(t).forEach((e) => {
        e.startsWith("@import") && "@import" !== e && r(t[e]);
      }),
      Object.entries(a).forEach(([e, t]) => {
        e.startsWith("@import") && r(t);
      }));
    const i = document.getElementById("mp-theme-override");
    i && i.remove();
    const l = document.createElement("style");
    l.id = "mp-theme-override";
    let c = ":root {";
    (Object.entries(t).forEach(([e, t]) => {
      e.startsWith("@import") ||
        "object" == typeof t ||
        (c += `${e}: ${t} !important;`);
    }),
      Object.entries(a).forEach(([e, t]) => {
        e.startsWith("@import") ||
          "object" == typeof t ||
          (c += `${e}: ${t} !important;`);
      }),
      (c += "}"),
      setSafeInnerHTML(l, c),
      document.head.appendChild(l),
      document.documentElement.setAttribute("data-mp-theme", n));
  }
  async function loadThemeConfig() {
    ((currentThemeConfig = { themeId: "electric-glass", mode: "auto" }),
      applyTheme(currentThemeConfig));
  }
  async function saveThemeConfig(e) {
    ((currentThemeConfig = { ...currentThemeConfig, ...e }),
      await GM_setValue("Theme", JSON.stringify(currentThemeConfig)),
      applyTheme(currentThemeConfig));
  }
  async function loadImportedThemes() {
    const e = await GM_getValue("ImportedThemes", "{}");
    try {
      importedThemes = JSON.parse(e);
    } catch (e) {
      (console.error(`${"Error loading imported themes:"} `, e),
        (importedThemes = {}));
    }
  }
  async function saveImportedThemesData() {
    await GM_setValue("ImportedThemes", JSON.stringify(importedThemes));
  }
  async function importThemesFromFile(e, t) {
    if (!e) return;
    const n = new FileReader();
    ((n.onload = async (e) => {
      try {
        const n = JSON.parse(e.target.result);
        let a = 0;
        for (const [e, t] of Object.entries(n))
          t.name &&
            (t.light || t.dark) &&
            "object" == typeof t.light &&
            "object" == typeof t.dark &&
            ((importedThemes[e] = t), a++);
        a > 0
          ? (await saveImportedThemesData(),
            showNotification(
              `Success! ${a} theme(s) imported.`,
            ),
            t && t())
          : showNotification("No valid themes found in file.", "error");
      } catch (e) {
        showNotification("Error reading JSON file. Check formatting.", "error");
      }
    }),
      n.readAsText(e));
  }
  async function deleteImportedTheme(e, t) {
    const n = importedThemes[e]?.name || e;
    if (
      await createDialogo({
        message: `Delete theme "${n}"?`,
        type: "confirm",
      })
    ) {
      const n = importedThemes[e];
      if (n) {
        const e = new Set(),
          t = (n) => {
            n &&
              (Array.isArray(n)
                ? n.forEach((e) => t(e))
                : "object" == typeof n && n.url
                  ? e.add(n.url)
                  : "string" == typeof n && e.add(n));
          };
        (n["@import"] && t(n["@import"]),
          Object.keys(n).forEach((e) => {
            e.startsWith("@import") && "@import" !== e && t(n[e]);
          }),
          ["light", "dark"].forEach((e) => {
            n[e] &&
              Object.entries(n[e]).forEach(([e, n]) => {
                e.startsWith("@import") && t(n);
              });
          }));
      }
      (delete importedThemes[e],
        currentThemeConfig.themeId === e &&
          ((currentThemeConfig.themeId = "default"),
          await saveThemeConfig(currentThemeConfig)),
        await saveImportedThemesData(),
        t && t());
    }
  }
  const MP_EMBEDDED_CSS =
    ":root{--mp-font-stack-i18n:\"Roboto Slab\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,\"Microsoft YaHei\",\"PingFang SC\",\"Hiragino Sans GB\",\"Heiti SC\",\"Apple SD Gothic Neo\",\"Noto Sans CJK SC\",sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\";--mp-font-family-base:var(--mp-font-stack-i18n);--mp-font-family-heading:var(--mp-font-stack-i18n);--mp-font-family-editor:\"JetBrains Mono\",var(--mp-font-stack-i18n);--mp-font-family-button:var(--mp-font-stack-i18n);--mp-bg-primary:#fff;--mp-bg-secondary:#f8f9fa;--mp-bg-tertiary:#e2e4e6;--mp-bg-overlay:rgba(10,10,10,0.5);--mp-text-primary:#212529;--mp-text-secondary:#495057;--mp-text-tertiary:#868e96;--mp-text-buttons:#fff;--mp-border-primary:#dee2e6;--mp-border-secondary:#ced4da;--mp-accent-primary:#7071fc;--mp-accent-primary-hover:#595ac9;--mp-accent-edit:#fab005;--mp-accent-edit-hover:#f08c00;--mp-accent-close:#f03e3e;--mp-accent-close-hover:#c92a2a;--mp-btn-export-bg:rgba(34,129,207,0.1);--mp-btn-export-color:#2281cf;--mp-btn-add-bg:rgba(32,201,97,0.1);--mp-btn-add-color:#20c961;--mp-btn-import-bg:rgba(253,126,20,0.1);--mp-btn-import-color:#fd7e14;--mp-switch-knob:#fff;--mp-shadow-sm:0 1px 2px rgba(0,0,0,0.04);--mp-shadow-md:0 4px 12px rgba(0,0,0,0.1);--mp-shadow-lg:0 10px 30px rgba(0,0,0,0.1);--mp-border-radius-sm:4px;--mp-border-radius-md:8px;--mp-border-radius-lg:16px;--mp-transition-fast:0.2s cubic-bezier(0.25,1,0.5,1);--mp-syntax-escape:#ff6b6b;--mp-syntax-ignore-fence:#868e96;--mp-syntax-ignore-content:#adb5bd;--mp-syntax-quote-fence:#2b8a3e;--mp-syntax-quote-content:#40c057;--mp-syntax-var-keyword:#15aabf;--mp-syntax-var-flag:#0c8599;--mp-syntax-file-keyword:#e64980;--mp-syntax-sel-fence:#4c6ef5;--mp-syntax-sel-header:#3b5bdb;--mp-syntax-sel-multi:#339af0;--mp-syntax-sel-single:#ff8787;--mp-syntax-sel-id:#da77f2;--mp-syntax-sel-other:#fa7b05;--mp-syntax-sel-sep:#adb5bd;--mp-syntax-free-bracket:#fab005;--mp-syntax-free-label:#e67700;--mp-syntax-in-bracket:#d6336c;--mp-syntax-in-label:#a61e4d;--mp-syntax-in-eq:#f06595;--mp-syntax-sil-bracket:#845ef7;--mp-syntax-sil-label:#6741d9;--mp-syntax-sil-eq:#b197fc;--mp-syntax-var:#099268;--mp-syntax-context:#868e96;--mp-syntax-def-sep:#f03e3e;--mp-syntax-def-val:#ff8787;--mp-syntax-sel-checked:#20c997;--mp-syntax-caret:var(--mp-text-primary,#000);--mp-syntax-selection:color-mix(in srgb,var(--mp-accent-primary,#4c6ef5) 30%,transparent)}@media (prefers-color-scheme:dark){:root{--mp-bg-primary:#212529;--mp-bg-secondary:#2c2c30;--mp-bg-tertiary:#343a40;--mp-bg-overlay:rgba(0,0,0,0.7);--mp-text-primary:#f8f9fa;--mp-text-secondary:#e9ecef;--mp-text-tertiary:#adb5bd;--mp-text-buttons:#fff;--mp-border-primary:#495057;--mp-border-secondary:#868e96;--mp-accent-primary:#8586ff;--mp-accent-primary-hover:#9fa0ff;--mp-accent-edit:#fcc419;--mp-accent-edit-hover:#ffe066;--mp-accent-close:#ff6b6b;--mp-accent-close-hover:#ff8787;--mp-btn-export-bg:rgba(116,192,252,0.15);--mp-btn-export-color:#74c0fc;--mp-btn-add-bg:rgba(105,219,124,0.15);--mp-btn-add-color:#69db7c;--mp-btn-import-bg:rgba(255,169,77,0.15);--mp-btn-import-color:#ffa94d;--mp-switch-knob:#fff;--mp-shadow-sm:0 1px 2px rgba(0,0,0,0.3);--mp-shadow-md:0 4px 12px rgba(0,0,0,0.4);--mp-shadow-lg:0 10px 30px rgba(0,0,0,0.5);--mp-syntax-escape:#ff8787;--mp-syntax-ignore-fence:#adb5bd;--mp-syntax-ignore-content:#868e96;--mp-syntax-quote-fence:#69db7c;--mp-syntax-quote-content:#b2f2bb;--mp-syntax-var-keyword:#3bc9db;--mp-syntax-var-flag:#99e9f2;--mp-syntax-file-keyword:#f783ac;--mp-syntax-sel-fence:#91a7ff;--mp-syntax-sel-header:#bac8ff;--mp-syntax-sel-multi:#74c0fc;--mp-syntax-sel-single:#ffc9c9;--mp-syntax-sel-id:#e599f7;--mp-syntax-sel-other:#fa7b05;--mp-syntax-sel-sep:#868e96;--mp-syntax-free-bracket:#ffd43b;--mp-syntax-free-label:#fab005;--mp-syntax-in-bracket:#f06595;--mp-syntax-in-label:#fcc2d7;--mp-syntax-in-eq:#faa2c1;--mp-syntax-sil-bracket:#b197fc;--mp-syntax-sil-label:#d0bfff;--mp-syntax-sil-eq:#9775fa;--mp-syntax-var:#38d9a9;--mp-syntax-context:#ced4da;--mp-syntax-def-sep:#ff6b6b;--mp-syntax-def-val:#ffc9c9;--mp-syntax-sel-checked:#63e6be}}.mp-prompt-wrapper{position:relative;width:36px;height:36px;margin:0 4px;display:inline-flex;vertical-align:middle;z-index:1000}.mp-sliding-pill-container{position:absolute;width:36px;height:36px;box-sizing:border-box;justify-content:space-between;background-color:var(--mp-bg-primary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-lg);box-shadow:var(--mp-shadow-sm);overflow:hidden;z-index:1000;transition:width var(--mp-transition-fast),height var(--mp-transition-fast),background-color var(--mp-transition-fast),border-color var(--mp-transition-fast)}.mp-btn-part,.mp-sliding-pill-container{display:flex;align-items:center;padding:0}.mp-btn-part{justify-content:center;flex:0 0 34px;width:34px;height:34px;background:transparent;border:none;margin:0;cursor:pointer;color:var(--mp-text-secondary);transition:color var(--mp-transition-fast)}.mp-btn-part svg{display:block;width:20px;height:20px;margin:0 auto;pointer-events:none;flex-shrink:0}.mp-btn-main{opacity:1}.mp-btn-ai,.mp-btn-paste{flex:0 0 0;width:0;height:0;opacity:0;overflow:hidden;transition:flex-basis var(--mp-transition-fast),width var(--mp-transition-fast),height var(--mp-transition-fast),opacity var(--mp-transition-fast),transform var(--mp-transition-fast)}.mp-sliding-pill-container:hover .mp-btn-ai,.mp-sliding-pill-container:hover .mp-btn-paste{flex:0 0 34px;width:34px;height:34px;opacity:1;transform:translate(0)}.mp-sliding-pill-container:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-accent-primary);box-shadow:var(--mp-shadow-md)}.mp-btn-part:hover{color:var(--mp-accent-primary)}.mp-sliding-pill-container:active{background-color:var(--mp-bg-secondary)}.mp-dir-top{bottom:0;left:0;flex-direction:column}.mp-dir-top:hover{height:112px}.mp-dir-top .mp-btn-ai,.mp-dir-top .mp-btn-paste{transform:translateY(10px)}.mp-dir-bottom{top:0;left:0;flex-direction:column-reverse}.mp-dir-bottom:hover{height:112px}.mp-dir-bottom .mp-btn-ai,.mp-dir-bottom .mp-btn-paste{transform:translateY(-10px)}.mp-dir-left{top:0;right:0;flex-direction:row}.mp-dir-left:hover{width:112px}.mp-dir-left .mp-btn-ai,.mp-dir-left .mp-btn-paste{transform:translateX(10px)}.mp-dir-right{top:0;left:0;flex-direction:row-reverse}.mp-dir-right:hover{width:112px}.mp-dir-right .mp-btn-ai,.mp-dir-right .mp-btn-paste{transform:translateX(-10px)}.mp-sliding-pill-container:after,.mp-sliding-pill-container:before{content:\"\";position:absolute;background-color:var(--mp-border-primary);opacity:0;transition:opacity var(--mp-transition-fast);pointer-events:none;z-index:1001}.mp-sliding-pill-container:hover:after,.mp-sliding-pill-container:hover:before{opacity:1}.mp-dir-bottom:before,.mp-dir-top:before{width:26px;height:1px;left:50%;transform:translateX(-50%);top:37px}.mp-dir-bottom:after,.mp-dir-top:after{width:26px;height:1px;left:50%;transform:translateX(-50%);top:75px}.mp-dir-left:before,.mp-dir-right:before{width:1px;height:26px;top:50%;transform:translateY(-50%);left:37px}.mp-dir-left:after,.mp-dir-right:after{width:1px;height:26px;top:50%;transform:translateY(-50%);left:75px}.mp-hidden{display:none!important}.mp-scroll-invisible{overflow-y:auto!important;scrollbar-width:none!important;-ms-overflow-style:none!important;scroll-behavior:smooth}.mp-scroll-invisible::-webkit-scrollbar{display:none;width:0;height:0}.mp-scroll-wrapper{position:relative;display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;max-width:100%;box-sizing:border-box}.mp-scroll-arrow{position:absolute;left:0;right:0;height:28px;display:flex;align-items:center;justify-content:center;color:var(--mp-text-tertiary);cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s ease,color .2s ease;z-index:10}.mp-scroll-arrow.up{top:0;background:linear-gradient(180deg,color-mix(in srgb,var(--mp-scroll-bg,var(--mp-bg-primary)),transparent 40%) 30%,transparent)}.mp-scroll-arrow.down{bottom:0;background:linear-gradient(0deg,color-mix(in srgb,var(--mp-scroll-bg,var(--mp-bg-primary)),transparent 40%) 30%,transparent)}.mp-scroll-arrow:hover{color:var(--mp-accent-primary)}.mp-scroll-arrow.visible{opacity:1;pointer-events:auto}.mp-scroll-arrow svg{width:20px;height:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.1))}#AB_modal_box_el #__ap_text,#prompt-menu-container #__ap_text,.mp-modal-box .form-group:has(#__ap_text) .form-textarea{border:none!important;box-shadow:none!important;background-color:transparent!important;padding:16px;width:100%;height:100%;font-family:var(--mp-font-family-editor)!important}.mp-modal-box .form-group:has(#__ap_text) .mp-scroll-wrapper{border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);background-color:var(--mp-bg-secondary);transition:border-color .2s,box-shadow .2s;overflow:hidden!important;display:flex;flex-direction:column;height:300px}.mp-modal-box .form-group:has(#__ap_text) .mp-scroll-wrapper:focus-within{border-color:var(--mp-accent-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--mp-accent-primary) 25%,transparent)}.mp-modal-box.mp-expanded .form-group:has(#__ap_text) .mp-scroll-wrapper{height:100%!important}.mp-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:var(--mp-bg-overlay);z-index:99990;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);opacity:0;visibility:hidden;transition:opacity var(--mp-transition-fast),visibility var(--mp-transition-fast)}.mp-overlay.visible{opacity:1;visibility:visible}.mp-modal-box{font-family:var(--mp-font-family-base)!important;background-color:var(--mp-bg-primary);border-radius:var(--mp-border-radius-lg);padding:24px!important;box-shadow:var(--mp-shadow-lg);width:min(93vw,800px)!important;border:1px solid var(--mp-border-primary)!important;transform:scale(.95) translateY(10px);opacity:0;transition:transform var(--mp-transition-fast),opacity var(--mp-transition-fast),width .3s cubic-bezier(.4,0,.2,1),height .3s cubic-bezier(.4,0,.2,1)!important;position:relative!important;display:flex!important;flex-direction:column!important;max-height:95vh!important}.modal-title,.mp-modal-box{color:var(--mp-text-primary)}.modal-title{font-family:var(--mp-font-family-heading)!important;font-size:18px;font-weight:600;margin:0 0 20px;text-align:center;flex-shrink:0}.modal-footer{display:flex;justify-content:center;margin-top:16px;flex-shrink:0}.mp-modal-box.mp-expanded{width:95vw!important;max-width:95vw!important;height:93vh!important;max-height:93vh!important;display:flex!important;flex-direction:column!important}.mp-modal-box.mp-expanded .form-group:has(#__ap_text){flex:1;display:flex;flex-direction:column;min-height:0;margin-bottom:15px}.mp-modal-box.mp-expanded .modal-title{display:block!important;visibility:visible!important;text-align:center;margin-bottom:20px;flex-shrink:0}.mp-modal-box.mp-expanded .form-group:has(.form-textarea){flex:1;display:flex;flex-direction:column;min-height:0;margin-bottom:24px}.mp-modal-box.mp-expanded .mp-scroll-wrapper{flex:1;height:100%!important}.mp-modal-box.mp-expanded .form-textarea{height:100%!important}.mp-modal-box.mp-expanded .mp-switch-container{padding-top:8px}.mp-overlay.visible .mp-modal-box{transform:scale(1) translateY(0);opacity:1}.mp-modal-close-btn,.mp-modal-info-btn,.mp-modal-shop-btn{position:absolute;top:12px;background:none;border:none;color:var(--mp-text-tertiary);cursor:pointer;width:32px;height:32px;border-radius:50%;transition:transform .3s ease,color .3s ease,background-color .3s ease;display:flex;justify-content:center;align-items:center;padding:0;z-index:20}.mp-modal-close-btn{right:12px}.mp-modal-info-btn{right:88px}.mp-modal-shop-btn{right:126px;cursor:default!important}.mp-modal-close-btn:hover{transform:rotate(90deg);color:var(--mp-accent-close);background-color:color-mix(in srgb,var(--mp-accent-close) 15%,transparent)}.mp-modal-info-btn:hover,.mp-modal-shop-btn:hover{transform:scale(1.1);color:var(--mp-accent-primary);background-color:color-mix(in srgb,var(--mp-accent-primary) 15%,transparent)}.mp-modal-close-btn svg,.mp-modal-info-btn svg,.mp-modal-shop-btn svg{width:20px;height:20px;stroke:currentColor;stroke-width:2.5;fill:none}.mp-modal-info-btn svg{stroke-width:0;fill:currentColor}.mp-modal-expand-btn{position:absolute;top:12px;right:50px;background:none;border:none;color:var(--mp-text-tertiary);cursor:pointer;width:32px;height:32px;border-radius:50%;transition:transform .3s ease,color .3s ease,background-color .3s ease;display:flex;justify-content:center;align-items:center;padding:0;z-index:20}.mp-modal-expand-btn:hover{transform:scale(1.1);color:var(--mp-accent-primary);background-color:color-mix(in srgb,var(--mp-accent-primary) 15%,transparent)}.mp-modal-expand-btn svg,.mp-modal-shop-btn svg{width:20px;height:20px;stroke:currentColor;stroke-width:2;fill:none}.mp-diff-modal-overlay .mp-modal-box{width:95vw!important;height:93vh!important;max-width:none!important;display:flex!important;flex-direction:column!important}.mp-diff-container{display:flex;flex-direction:column;gap:16px;flex:1;min-height:0;margin-bottom:0}@media (min-width:768px){.mp-diff-container{flex-direction:row}}.mp-diff-column{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;min-height:0}.mp-diff-label{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--mp-accent-primary);display:flex;align-items:center;gap:8px;flex-shrink:0;justify-content:space-around}.mp-diff-textarea{width:100%!important;flex:1!important;padding:16px!important;border-radius:var(--mp-border-radius-md)!important;border:1px solid var(--mp-border-primary)!important;background-color:var(--mp-bg-secondary)!important;color:var(--mp-text-primary)!important;font-family:var(--mp-font-family-editor)!important;font-size:15px!important;resize:none!important;line-height:1.6!important;box-sizing:border-box!important}.mp-diff-actions{display:flex;gap:12px;justify-content:space-around;margin-top:20px;flex-shrink:0}.mp-diff-actions button{padding:10px 20px;border-radius:var(--mp-border-radius-md);cursor:pointer;font-weight:500;display:inline-flex;align-items:center;justify-content:center}.mp-diff-actions .save-button{background:var(--mp-accent-primary);color:var(--mp-text-buttons);border:none}#__ap_enhance_loading{z-index:100000}.mp-loading-content{display:flex;flex-direction:column;align-items:center;gap:15px;color:var(--mp-accent-primary);font-family:var(--mp-font-family-editor)}.mp-loading-icon{width:50px;height:50px}.mp-loading-text{font-size:16px;font-weight:500}.mp-label-wrapper{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;gap:8px}.mp-label-left{display:flex;align-items:center;flex:1;min-width:0}.mp-label-right,.mp-modal-right-controls{display:flex;align-items:center;gap:4px;flex-shrink:0}.mp-label-wrapper .form-label{margin-bottom:0!important;white-space:normal;overflow:hidden;text-overflow:ellipsis}.mp-enhance-ai-btn,.mp-help-icon,.mp-link-btn,.mp-paste-btn{background:transparent;border:none;cursor:pointer;color:var(--mp-accent-primary);display:flex;align-items:center;justify-content:center;padding:4px;border-radius:var(--mp-border-radius-sm);transition:transform .2s ease,opacity .2s ease,background-color .2s ease;opacity:.8;outline:none;flex-shrink:0}.mp-enhance-ai-btn:hover,.mp-help-icon:hover,.mp-link-btn:hover,.mp-paste-btn:hover{transform:scale(1.1);opacity:1}.mp-enhance-ai-btn svg,.mp-help-icon svg,.mp-link-btn svg,.mp-paste-btn svg{width:16px;height:16px;fill:currentColor;display:block}.mp-enhance-ai-btn.loading{width:22px;height:22px;pointer-events:none}.mp-context-bubble{display:none;background-color:var(--mp-bg-tertiary);border-left:3px solid var(--mp-accent-primary);padding:8px 12px;margin-bottom:12px;font-size:13px;color:var(--mp-text-secondary);line-height:1.4;animation:mp-fade-in-down .2s ease-out forwards;width:100%;box-sizing:border-box;white-space:normal;overflow-wrap:break-word;word-break:break-word}.mp-context-bubble.visible{display:block}.mp-context-bubble strong{color:var(--mp-text-primary);font-weight:600}@keyframes mp-fade-in-down{0%{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}@keyframes mp-spin{to{transform:rotate(1turn)}}.prompt-menu{position:fixed;min-width:350px;max-width:450px;background-color:var(--mp-bg-primary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-lg);box-shadow:var(--mp-shadow-lg);z-index:99990;display:flex;flex-direction:column;user-select:none;color:var(--mp-text-primary)!important;font-family:var(--mp-font-family-base)!important;overflow:hidden;opacity:0;visibility:hidden;transform:scale(.95);transform-origin:top left;transition:opacity .2s ease,transform .2s ease,visibility 0s linear .2s}.prompt-menu.visible{opacity:1;visibility:visible;transform:scale(1);transition-delay:0s}.prompt-menu-list{max-height:350px;padding:4px;overflow-y:auto;overflow-x:hidden;position:relative}.prompt-item-row{position:relative;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--mp-border-radius-md);cursor:pointer;transition:background-color .15s ease-in-out;overflow:hidden}.prompt-item-row.drag-mode,.prompt-item-row:hover{background-color:var(--mp-bg-tertiary)}.prompt-item-row.drag-mode{border:1px dashed var(--mp-accent-primary);cursor:move}.prompt-item-row.drag-mode:active{cursor:grabbing}.prompt-title{font-family:var(--mp-font-family-heading)!important;font-size:14px;font-weight:500;flex:1;padding-right:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mp-text-secondary);transition:opacity .2s}.prompt-item-row:hover .prompt-title{color:var(--mp-accent-primary);mask-image:linear-gradient(90deg,#000 60%,transparent);-webkit-mask-image:linear-gradient(90deg,#000 60%,transparent)}.prompt-item-row.nav-selected{background-color:var(--mp-bg-tertiary)!important;border:1px solid var(--mp-accent-primary)!important}.prompt-item-row.nav-selected .prompt-title{color:var(--mp-accent-primary)!important}.prompt-actions{position:absolute;right:0;top:0;bottom:0;padding-left:20px;padding-right:8px;display:flex;align-items:center;gap:4px;background:linear-gradient(90deg,transparent 0,var(--mp-bg-tertiary) 20%,var(--mp-bg-tertiary));transform:translateX(110%);transition:transform .25s cubic-bezier(.25,1,.5,1);z-index:2}.prompt-item-row.drag-mode .prompt-actions,.prompt-item-row:hover .prompt-actions{transform:translateX(0)}.action-btn{background:transparent;border:none;cursor:pointer;width:28px;height:28px;border-radius:var(--mp-border-radius-sm);transition:all .15s ease;display:flex;align-items:center;justify-content:center;line-height:0;color:var(--mp-text-secondary);font-family:var(--mp-font-family-button)!important}.action-btn svg{width:16px;height:16px;display:block}.action-btn:hover{transform:scale(1.1)}.action-btn.edit:hover{color:var(--mp-accent-edit)}.action-btn.copy:hover{color:var(--mp-accent-primary)}.action-btn.delete:hover{color:var(--mp-accent-close)}.action-btn.pin:hover{color:var(--mp-accent-edit)}.action-btn.restore:hover{color:var(--mp-btn-add-color)}.action-btn.unpin{color:var(--mp-accent-primary)}.action-btn.drag:hover{color:var(--mp-btn-export-color)}.menu-footer-grid{display:grid;grid-template-columns:1fr 1fr 1fr;border-top:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);flex-shrink:0}.menu-footer-btn{display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:12px 0;color:var(--mp-text-secondary);transition:all .2s ease;height:auto;font-family:var(--mp-font-family-button)!important}.menu-footer-btn:not(:last-child){border-right:1px solid var(--mp-border-primary)}.menu-footer-btn svg{width:20px;height:20px;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}.menu-footer-btn:hover svg{transform:scale(1.2)}.menu-footer-btn.btn-export:hover{background-color:var(--mp-btn-export-bg);color:var(--mp-btn-export-color)}.menu-footer-btn.btn-add:hover{background-color:var(--mp-btn-add-bg);color:var(--mp-btn-add-color);transform:none}.menu-footer-btn.btn-add:hover svg{transform:scale(1.4)}.menu-footer-btn.btn-import:hover{background-color:var(--mp-btn-import-bg);color:var(--mp-btn-import-color)}.menu-header-grid{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);flex-shrink:0;position:relative;overflow:hidden}.menu-search-overlay{position:absolute;inset:0;background:var(--mp-bg-secondary);display:flex;align-items:center;padding:0 8px;gap:8px;transform:translateX(110%);transition:transform .25s cubic-bezier(.25,1,.5,1);z-index:5}.menu-search-input{flex:1;width:100%;padding:6px 12px;border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);font-family:var(--mp-font-family-base)!important;background:var(--mp-bg-primary);color:var(--mp-text-primary);outline:none;transition:border-color .2s}.menu-search-input:focus{border-color:var(--mp-accent-primary)}.menu-header-btn{display:flex;align-items:center;justify-content:center;background:transparent;border:none;cursor:pointer;padding:12px 0;color:var(--mp-text-secondary);transition:all .2s ease;font-family:var(--mp-font-family-button)!important}.menu-header-btn:not(:last-child):not(.btn-close-search){border-right:1px solid var(--mp-border-primary)}.menu-header-btn svg{width:20px;height:20px;transition:transform .2s cubic-bezier(.34,1.56,.64,1)}.menu-header-btn:hover{color:var(--mp-accent-primary)}.menu-header-btn:hover svg{transform:scale(1.2)}.menu-header-btn.active{color:var(--mp-accent-primary)}.mp-expanded-overlay{position:fixed;top:0;left:0;width:100vw;height:100vh;background:var(--mp-bg-overlay);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:mpFadeIn .2s ease}.mp-expanded-modal{width:93vw;height:93vh;background:var(--mp-bg-primary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-lg);box-shadow:var(--mp-shadow-lg);display:flex;flex-direction:column;overflow:hidden;position:relative;font-family:var(--mp-font-family-base)!important}.mp-expanded-header{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--mp-border-primary);background:var(--mp-bg-secondary);gap:16px;flex-shrink:0}.mp-expanded-search-container{flex:1;display:flex}.mp-expanded-search{width:100%;padding:8px 12px;border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);font-family:var(--mp-font-family-base)!important;background:var(--mp-bg-primary);color:var(--mp-text-primary);outline:none;transition:border-color .2s}.mp-expanded-search:focus{border-color:var(--mp-accent-primary)}.mp-expanded-actions-left{display:flex;align-items:center;gap:8px}.mp-pinned-action-btn.has-selection{background:rgba(240,62,62,.1);color:var(--mp-accent-close);border-color:var(--mp-accent-close)}.mp-expanded-list{flex:1;overflow-y:auto;overflow-x:hidden;padding:16px;display:grid;gap:12px;align-content:start;position:relative}.prompt-item-row.expanded-mode{border:1px solid var(--mp-border-primary);background:var(--mp-bg-secondary);align-items:center;padding:12px 16px;min-width:0;min-height:70px;height:auto}.prompt-item-row.expanded-mode:hover{border-color:var(--mp-accent-primary)}.prompt-item-row.expanded-mode .prompt-actions{position:relative;transform:none;background:transparent;padding-left:8px;opacity:1;flex-shrink:0}.prompt-item-row.expanded-mode .prompt-title{white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;word-break:break-word}.mp-expanded-filter-dropdown{position:fixed;z-index:100001}@keyframes mpFadeIn{0%{opacity:0}to{opacity:1}}.mp-pinned-action-btn.btn-close:hover,.mp-pinned-action-btn.btn-delete.active,.mp-pinned-action-btn.btn-delete:hover{background:var(--mp-accent-close)!important;border-color:var(--mp-accent-close-hover)!important;color:var(--mp-text-buttons)!important}.mp-pinned-action-btn.btn-cols:hover{background:var(--mp-accent-edit)!important;border-color:var(--mp-accent-edit-hover)!important;color:var(--mp-text-buttons)!important}.mp-pinned-action-btn.btn-add:hover{background:var(--mp-btn-add-color)!important;border-color:var(--mp-btn-add-color)!important;color:var(--mp-text-buttons)!important}.mp-pinned-action-btn.btn-export:hover{background:var(--mp-btn-export-color)!important;border-color:var(--mp-btn-export-color)!important;color:var(--mp-text-buttons)!important}.mp-pinned-action-btn.btn-import:hover{background:var(--mp-btn-import-color)!important;border-color:var(--mp-btn-import-color)!important;color:var(--mp-text-buttons)!important}.mp-pinned-action-btn.btn-save:hover,.mp-pinned-action-btn.btn-select-all.active{background:var(--mp-accent-primary)!important;border-color:var(--mp-accent-primary-hover,var(--mp-accent-primary))!important;color:var(--mp-text-buttons)!important}.form-group{display:flex;flex-direction:column;margin-bottom:15px;flex-shrink:0}.form-label{margin-bottom:8px;font-size:14px!important;font-weight:700!important;color:var(--mp-text-secondary);display:block;width:100%;white-space:normal;overflow-wrap:break-word;word-break:break-word}.form-input,.form-textarea{background-color:var(--mp-bg-secondary)!important;color:var(--mp-text-primary)!important;border:1px solid var(--mp-border-primary)!important;border-radius:var(--mp-border-radius-md);padding:10px;width:100%;box-sizing:border-box;transition:border-color .2s,box-shadow .2s;outline:0!important;font-family:var(--mp-font-family-editor)!important;font-size:14px!important}.form-textarea{height:300px!important;resize:none!important;display:block}.form-input:focus,.form-textarea:focus{border-color:var(--mp-accent-primary)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--mp-accent-primary) 25%,transparent)!important}.form-input::placeholder,.form-textarea::placeholder,.lang-search-input::placeholder,.menu-search-input::placeholder,.mp-search-input::placeholder{color:var(--mp-text-tertiary)!important;opacity:.7}.mp-switch-container{display:flex;justify-content:space-between;align-items:center;padding:8px 12px!important;margin:0 0 15px;flex-shrink:0;background-color:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);gap:10px}.mp-switch{display:flex;align-items:center;gap:8px}.mp-switch input[type=checkbox]{height:0;width:0;visibility:hidden;position:absolute}.mp-switch label{cursor:pointer;text-indent:-9999px;width:40px;height:22px;background:var(--mp-bg-tertiary);display:block;border-radius:100px;position:relative;transition:background-color var(--mp-transition-fast)}.mp-switch label:after{content:\"\";position:absolute;top:3px;left:3px;width:16px;height:16px;background:var(--mp-switch-knob);border-radius:90px;transition:.3s cubic-bezier(.25,1,.5,1);box-shadow:var(--mp-shadow-sm)}.mp-switch input:checked+label{background:var(--mp-accent-primary)}.mp-switch input:checked+label:after{left:calc(100% - 3px);transform:translateX(-100%)}.mp-switch .switch-text{font-size:13px;font-weight:500;color:var(--mp-text-secondary);cursor:pointer;user-select:none}.mp-prompt-shortcut{flex:1;max-width:140px;font-family:var(--mp-font-family-base);padding:4px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mp-prompt-shortcut[data-shortcut]:not([data-shortcut=\"\"]){color:var(--mp-accent-primary)}.mp-checkbox,.mp-filter-checkbox,.mp-option-item input[type=checkbox]{-webkit-appearance:none!important;appearance:none!important;width:18px!important;height:18px!important;border:1px solid var(--mp-border-primary)!important;border-radius:var(--mp-border-radius-sm)!important;background-color:var(--mp-bg-secondary)!important;cursor:pointer!important;margin:0!important;display:grid!important;place-content:center!important;transition:all .2s ease}.mp-checkbox:checked,.mp-filter-item.selected .mp-filter-checkbox,.mp-option-item input[type=checkbox]:checked{background-color:var(--mp-accent-primary)!important;border-color:var(--mp-accent-primary)!important}.mp-checkbox:before,.mp-filter-checkbox:before,.mp-option-item input[type=checkbox]:before{content:\"\";width:10px;height:10px;clip-path:polygon(14% 44%,0 65%,50% 100%,100% 16%,80% 0,43% 62%);background-color:var(--mp-text-buttons);transform:scale(0);transition:transform .15s ease-in-out}.mp-checkbox:checked:before,.mp-filter-item.selected .mp-filter-checkbox:before,.mp-option-item input[type=checkbox]:checked:before{transform:scale(1)}#__ap_placeholders_container{padding:4px;margin-top:15px;box-sizing:border-box;transition:padding-top .2s ease}.mp-option-group{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;padding:8px;border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);background-color:var(--mp-bg-tertiary);max-height:none!important;overflow:visible!important}.mp-option-item{display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;padding:8px 8px 8px 12px!important;border-radius:var(--mp-border-radius-sm);background-color:var(--mp-bg-primary);transition:background-color .2s;user-select:none;border-left:5px solid transparent;position:relative}.mp-option-item:hover{background-color:var(--mp-bg-secondary)}.mp-modal-box.mp-expanded #__ap_placeholders_container{max-height:none!important;height:100%!important;flex:1;display:flex;flex-direction:column;min-height:0}.mp-modal-box.mp-expanded #__ap_placeholders_container .mp-scroll-wrapper{height:100%!important;flex:1}.dynamic-input{min-height:45px!important;line-height:1.5;font-family:var(--mp-font-family-editor)!important}.mp-dynamic-dropzone{position:relative;min-height:90px;border:2px dashed var(--mp-border-primary);border-radius:var(--mp-border-radius-md);margin-bottom:12px;align-items:center;transition:border-color .2s ease;box-shadow:none!important;background-color:transparent}.mp-dynamic-dropzone.drag-over{border-color:var(--mp-accent-primary)}.mp-dynamic-grid-w100{width:100%}.mp-hidden-file-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1}.mp-empty-state-container{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px}.menu-search-container,.mp-search-container{position:sticky;top:0;z-index:10;display:flex;flex-direction:column;flex-shrink:0}.menu-search-container{padding:10px 12px;background-color:var(--mp-bg-secondary);border-bottom:1px solid var(--mp-border-primary)}.lang-search-input,.menu-search-input,.mp-search-input,.mp-system-prompt-search-input{width:100%;padding:10px 12px;border-radius:var(--mp-border-radius-md);border:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);color:var(--mp-text-primary);font-family:var(--mp-font-family-editor)!important;font-size:13px;box-sizing:border-box;outline:none;transition:border-color .2s}.menu-search-input{background-color:var(--mp-bg-primary)!important}.lang-search-input,.mp-system-prompt-search-input{margin-bottom:12px}.lang-search-input:focus,.menu-search-input:focus,.mp-search-input:focus,.mp-system-prompt-search-input:focus{border-color:var(--mp-accent-primary);outline:none!important}.mp-export-actions{display:flex;justify-content:space-between;align-items:center;margin-top:20px;margin-bottom:20px;font-size:13px;color:var(--mp-text-secondary);border-bottom:1px solid var(--mp-border-primary);padding-bottom:16px}.mp-checkbox-wrapper{display:flex;align-items:center;cursor:pointer;user-select:none}.mp-export-list{display:flex;flex-direction:column;gap:4px;margin:0 -8px;padding:0 8px}.mp-export-item{display:flex;align-items:center;padding:8px;border-radius:var(--mp-border-radius-md);transition:background .15s;cursor:pointer;border:1px solid transparent}.mp-export-item:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-border-primary)}.mp-item-content{display:flex;flex-direction:column;overflow:hidden;margin-left:12px}.mp-item-title{font-size:14px;font-weight:500;color:var(--mp-text-primary)}.mp-item-preview,.mp-item-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mp-item-preview{font-size:12px;color:var(--mp-text-tertiary);margin-top:2px}.mp-export-buttons{display:flex;gap:10px;margin-top:20px;justify-content:flex-end;border-top:1px solid var(--mp-border-primary);padding-top:16px;flex-shrink:0;font-family:var(--mp-font-family-button)!important}.lang-box,.mp-system-prompt-select-box{width:min(90vw,500px)!important}.mp-system-prompt-select-box{padding:20px!important}.lang-button,.mp-system-prompt-button{all:unset;box-sizing:border-box;display:block;width:100%;padding:12px 20px;border-radius:var(--mp-border-radius-md);background-color:var(--mp-bg-secondary);color:var(--mp-text-primary);border:1px solid var(--mp-border-primary);font-weight:500;cursor:pointer;text-align:center;transition:all .2s ease;font-family:var(--mp-font-family-button)!important;flex-shrink:0}.mp-system-prompt-button{display:flex!important;flex-direction:column;align-items:center;gap:4px}.mp-system-prompt-list-container{display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto}.mp-system-prompt-button-title{font-weight:600;font-size:14px}.mp-system-prompt-button-comment{font-weight:400;font-size:12px;color:var(--mp-text-secondary);display:block;width:100%;white-space:normal;overflow-wrap:break-word;word-break:break-word}.lang-button:hover,.mp-system-prompt-button:hover{transform:translateY(-2px);box-shadow:var(--mp-shadow-sm);background-color:var(--mp-bg-tertiary)}.lang-button.selected,.mp-system-prompt-button.is-focused{border-color:var(--mp-accent-primary);color:var(--mp-accent-primary);background-color:color-mix(in srgb,var(--mp-accent-primary) 5%,transparent);font-weight:600}.save-button{padding:10px 28px;border-radius:var(--mp-border-radius-md);background-color:var(--mp-accent-primary);color:var(--mp-text-buttons);border:none;font-weight:600;cursor:pointer;transition:all .2s ease-in-out;font-family:var(--mp-font-family-button)!important;margin-bottom:5px}.save-button:hover{background-color:var(--mp-accent-primary-hover)}.mp-btn-secondary{background:transparent;border:1px solid var(--mp-border-secondary);color:var(--mp-text-secondary)}.mp-btn-secondary:hover{background-color:var(--mp-bg-tertiary);color:var(--mp-text-primary)}.mp-info-table{display:flex;flex-direction:column;border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);overflow:hidden;margin-top:8px}.mp-info-row{display:flex}.mp-info-row:not(:last-child){border-bottom:1px solid var(--mp-border-primary)}.mp-info-col{padding:16px;display:flex;flex-direction:column;justify-content:center}.mp-info-col:not(:last-child){border-right:1px solid var(--mp-border-primary)}.mp-info-title-col{flex:0 0 35%}.mp-info-desc-col,.mp-info-title-col{background-color:var(--mp-bg-secondary);text-align:left}.mp-info-desc-col{flex:1}.mp-info-col h3{font-size:14px;font-weight:600;color:var(--mp-text-primary);margin:0;font-family:var(--mp-font-family-heading)!important}.mp-info-col p{font-size:13px;color:var(--mp-text-secondary);line-height:1.5;margin:0}.mp-inline-menu{position:fixed;width:500px;max-height:300px;background-color:var(--mp-bg-primary)!important;border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);box-shadow:var(--mp-shadow-lg);z-index:2147483647!important;display:flex;flex-direction:column;opacity:0;visibility:hidden;transform:translateY(10px);transition:opacity .1s,transform .1s,visibility 0s linear .1s;overflow:hidden;font-family:var(--mp-font-family-base)!important}.mp-inline-menu.visible{opacity:1;visibility:visible;transform:translateY(0);transition-delay:0s}.mp-inline-list{padding:4px;pointer-events:auto}.mp-inline-item,.mp-inline-list{display:flex;flex-direction:column}.mp-inline-item{padding:8px 12px;cursor:pointer;border-radius:var(--mp-border-radius-sm);font-size:13px;color:var(--mp-text-primary);align-items:flex-start;justify-content:center;gap:3px;transition:background-color .1s}.mp-inline-item:hover{background-color:var(--mp-bg-tertiary)}.mp-inline-item.selected{background-color:var(--mp-accent-primary);color:var(--mp-text-buttons)!important}.mp-inline-title{font-weight:500;line-height:1.3}.mp-inline-preview,.mp-inline-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-family:var(--mp-font-family-heading)!important}.mp-inline-preview{font-weight:400;font-size:12px;color:var(--mp-text-tertiary);line-height:1.2}.mp-inline-item.selected .mp-inline-preview{color:var(--mp-text-buttons)!important;opacity:.8}.mp-tooltip{position:fixed;z-index:2147483647;pointer-events:none;display:flex;flex-direction:column;align-items:center;opacity:0;transform:scale(.95) translateY(4px);transition:opacity .15s cubic-bezier(.4,0,.2,1),transform .15s cubic-bezier(.4,0,.2,1)}.mp-tooltip-interactive{pointer-events:auto}.mp-tooltip.visible{opacity:1;transform:scale(1) translateY(0)}.mp-tooltip-left,.mp-tooltip-right{flex-direction:row;align-items:center}.mp-tooltip-content{font-family:var(--mp-font-family-button)!important;background-color:var(--mp-text-primary);color:var(--mp-bg-primary);padding:0;border-radius:var(--mp-border-radius-sm);max-width:450px;width:max-content;white-space:normal;word-wrap:break-word;overflow-wrap:break-word;text-align:center;font-size:13px;font-weight:500;box-shadow:var(--mp-shadow-md);line-height:1.4;display:flex;flex-direction:column;overflow:hidden}.mp-tooltip-text{display:block;padding:10px 14px}.mp-tooltip-text+.mp-tooltip-actions{border-top:1px solid color-mix(in srgb,var(--mp-border-primary),transparent 70%)}.mp-tooltip-actions{display:flex;width:100%}.mp-tooltip-actions-row{flex-direction:row}.mp-tooltip-actions-column{flex-direction:column}.mp-tooltip-btn{font-family:var(--mp-font-family-button)!important;flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px;border:none;border-radius:0;background-color:transparent;color:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:var(--mp-transition-fast);white-space:nowrap}.mp-tooltip-actions-row .mp-tooltip-btn:not(:last-child){border-right:1px solid color-mix(in srgb,var(--mp-border-primary),transparent 70%)}.mp-tooltip-actions-column .mp-tooltip-btn:not(:last-child){border-bottom:1px solid color-mix(in srgb,var(--mp-border-primary),transparent 70%)}.mp-tooltip-btn:focus,.mp-tooltip-btn:hover{background-color:var(--mp-accent-primary);color:var(--mp-text-buttons)}.mp-tooltip-btn:focus{outline:none}.mp-tooltip-btn-icon{width:14px;height:14px;display:flex;align-items:center;justify-content:center}.mp-tooltip-btn-icon svg{width:100%;height:100%;fill:currentColor}.mp-tooltip-arrow{width:0;height:0;margin:0;flex-shrink:0;z-index:1}.mp-tooltip-top .mp-tooltip-arrow{border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid var(--mp-text-primary)}.mp-tooltip-bottom .mp-tooltip-arrow{border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:6px solid var(--mp-text-primary);order:-1}.mp-tooltip-left .mp-tooltip-arrow{border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:6px solid var(--mp-text-primary)}.mp-tooltip-right .mp-tooltip-arrow{border-top:6px solid transparent;border-bottom:6px solid transparent;border-right:6px solid var(--mp-text-primary);order:-1}.mp-tooltip-preview-container{padding:12px;width:320px;max-width:90vw;display:flex;flex-direction:column}.mp-tooltip-preview-text{max-height:200px;overflow-y:auto;background-color:color-mix(in srgb,var(--mp-bg-primary),transparent 85%);border:1px solid color-mix(in srgb,var(--mp-bg-primary),transparent 70%);border-radius:var(--mp-border-radius-sm);padding:13px;font-family:var(--mp-font-family-editor);font-size:12px;font-weight:300;color:var(--mp-bg-primary);line-height:1.5;white-space:pre-wrap;text-align:left;-webkit-hyphens:manual;hyphens:manual;overflow-wrap:break-word}.mp-tooltip-preview-container .mp-scroll-arrow.up{top:0;background:linear-gradient(180deg,color-mix(in srgb,var(--mp-text-primary),transparent 30%) 30%,transparent);color:var(--mp-bg-primary)}.mp-tooltip-preview-container .mp-scroll-arrow.down{bottom:0;background:linear-gradient(0deg,color-mix(in srgb,var(--mp-text-primary),transparent 30%) 30%,transparent);color:var(--mp-bg-primary)}@keyframes mp-fade-in-up{0%{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.mp-settings-container{display:flex;flex-direction:column;height:100%;overflow:hidden;font-family:var(--mp-font-family-base)!important}.mp-tabs-header{display:flex;justify-content:center;align-items:center;border-bottom:1px solid var(--mp-border-primary);padding:0 16px;margin-bottom:16px;flex-shrink:0;gap:8px}.mp-tab-btn{font-family:var(--mp-font-family-button)!important;flex:1;background:none;padding:12px 4px;font-size:14px;font-weight:600;color:var(--mp-text-secondary);cursor:pointer;border:none;border-bottom:2px solid transparent;transition:all .2s;text-align:center;border-radius:4px 4px 0 0}.mp-tab-btn:hover{color:var(--mp-text-primary);background-color:var(--mp-bg-tertiary)}.mp-tab-btn.active{color:var(--mp-accent-primary);border-bottom-color:var(--mp-accent-primary)}.mp-tab-content{display:none!important;flex-direction:column;gap:4px;animation:mp-fade-in-up .2s ease}.mp-tab-content.active{display:flex!important}.mp-form-group,.mp-label{margin-bottom:10px}.mp-label{font-size:14px;font-weight:600;color:var(--mp-text-primary);display:block}.mp-label-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}.mp-settings-switch-container{display:flex;justify-content:space-between;align-items:center;background:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);padding:12px;border-radius:var(--mp-border-radius-md);margin:0}#mp-nav-lbl,#mp-preview-prompt-lbl,#mp-smart-predict-lbl,#mp-syntax-lbl{font-size:13px;font-weight:400;color:var(--mp-text-primary);cursor:help;text-decoration:underline dotted;text-decoration-color:color-mix(in srgb,var(--mp-text-secondary) 60%,transparent);text-underline-offset:3px;text-decoration-thickness:1px}.mp-action-btn-full{width:100%;padding:12px 16px;background-color:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);color:var(--mp-text-tertiary);font-weight:500;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .2s;font-family:var(--mp-font-family-button)!important}.mp-action-btn-full:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-accent-primary);color:var(--mp-accent-primary)}.mp-btn-icon{display:flex;align-items:center;justify-content:center}.mp-segmented-control{display:flex;background-color:var(--mp-bg-tertiary);border-radius:var(--mp-border-radius-md);padding:4px;gap:4px;width:100%;box-sizing:border-box}.mp-segment-opt{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 4px;font-size:13px;font-weight:500;color:var(--mp-text-secondary);cursor:pointer;border-radius:var(--mp-border-radius-sm);transition:all .2s cubic-bezier(.25,1,.5,1);user-select:none;border:1px solid transparent}.mp-segment-opt:hover{color:var(--mp-accent-primary);background-color:rgba(0,0,0,.02)}.mp-segment-opt.selected{background-color:var(--mp-bg-primary);border-color:var(--mp-border-primary);box-shadow:0 1px 3px rgba(0,0,0,.08);font-weight:600}.mp-segment-opt.selected,.mp-segment-opt.selected svg{color:var(--mp-accent-primary)}.mp-shortcut-scroll-container,.mp-theme-scroll-container{padding:4px!important;border:none!important;margin:0!important;background:transparent!important;box-sizing:border-box!important;width:100%!important}.mp-shortcut-wrapper-fixed,.mp-theme-wrapper-fixed{flex:none!important;height:auto!important;max-height:165px!important;width:100%!important;box-sizing:border-box!important;margin-top:12px!important;overflow:hidden;position:relative}.mp-shortcut-option,.mp-shortcut-wrapper-fixed,.mp-theme-option,.mp-theme-wrapper-fixed{border:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-md)}.mp-shortcut-option,.mp-theme-option{flex-shrink:0;padding:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;font-size:13px;font-weight:500;color:var(--mp-text-secondary);transition:all .2s ease;box-sizing:border-box}@keyframes mp-pulse-recording{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--mp-accent-edit) 40%,transparent)}to{box-shadow:0 0 0 6px transparent}}.mp-shortcut-option.recording{border-color:var(--mp-accent-edit)!important;color:var(--mp-accent-edit)!important;background-color:color-mix(in srgb,var(--mp-accent-edit) 10%,var(--mp-bg-primary))!important;font-weight:700!important;animation:mp-pulse-recording 1.5s infinite}.mp-shortcut-option:last-child,.mp-theme-option:last-child{margin-bottom:0}.mp-shortcut-option:hover,.mp-theme-option:hover{background-color:var(--mp-bg-tertiary);color:var(--mp-text-primary);box-shadow:var(--mp-shadow-sm);border:1px solid var(--mp-accent-primary)}.mp-shortcut-option.selected,.mp-theme-option.selected{background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary));color:var(--mp-accent-primary);border-color:var(--mp-accent-primary);font-weight:700;box-shadow:var(--mp-shadow-md)}.mp-theme-option{margin:5px;width:auto}.mp-shortcut-option{margin:0 0 5px;width:100%;background-color:color-mix(in srgb,var(--mp-bg-primary) 45%,transparent)}.mp-shortcut-option:last-child{margin-bottom:0}.mp-settings-footer{display:flex;justify-content:center;align-items:center;padding-top:16px;margin-top:10px;border-top:1px solid var(--mp-border-primary);flex-shrink:0}.mp-settings-footer .save-button{min-width:160px}.mp-theme-action-row{display:flex;gap:8px;padding:0 5px;margin:5px 0 8px;flex-shrink:0;width:100%;box-sizing:border-box}.mp-theme-split-btn{flex:1;display:flex;align-items:center;justify-content:center;padding:10px;border-radius:var(--mp-border-radius-md);border:1px dashed var(--mp-border-primary);color:var(--mp-text-secondary);background-color:var(--mp-bg-secondary);cursor:pointer;transition:all .2s ease;font-size:13px;font-weight:500}.mp-theme-split-btn:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-accent-primary);color:var(--mp-accent-primary);box-shadow:var(--mp-shadow-sm)}.hide-api-key{-webkit-text-security:disc}#mp_ai_api_key_input{margin-bottom:8px}#mp_ai_sys_prompt_input{margin-top:8px;min-height:60px;resize:vertical;width:100%;box-sizing:border-box}.mp-form-hint{color:var(--mp-text-tertiary);font-size:11px;margin-top:4px;display:block}.mp-nav-switch{position:fixed;top:50%;right:20px;transform:translateY(-50%);display:flex;flex-direction:column;background-color:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);box-shadow:var(--mp-shadow-md);z-index:10000;padding:4px;gap:6px;transition:opacity .3s ease}.mp-nav-switch[style*=\"display: none\"]{pointer-events:none}.mp-nav-btn{width:32px;height:32px;display:flex;align-items:center;justify-content:center;color:var(--mp-text-secondary);border-radius:var(--mp-border-radius-sm);cursor:pointer;transition:all .2s ease;position:relative}.mp-nav-btn svg{width:20px;height:20px}.mp-nav-btn:hover{background-color:var(--mp-bg-tertiary);color:var(--mp-accent-primary);transform:scale(1.05)}.mp-nav-btn:active{transform:scale(.95)}.mp-nav-list-popup{position:absolute;right:45px;top:50%;transform:translateY(-50%) scale(.95);width:300px;max-height:500px;background-color:var(--mp-bg-primary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);box-shadow:var(--mp-shadow-lg);opacity:0;visibility:hidden;transition:all .2s cubic-bezier(.165,.84,.44,1);display:flex;flex-direction:column;z-index:10001;overflow:hidden}.mp-nav-list-popup.active{opacity:1;visibility:visible;transform:translateY(-50%) scale(1)}.mp-nav-header{display:flex;justify-content:space-between;background-color:var(--mp-bg-secondary);border-bottom:1px solid var(--mp-border-primary);padding:6px;gap:4px;flex-shrink:0}.mp-nav-tab{flex:1;display:flex;align-items:center;justify-content:center;padding:6px;border-radius:6px;cursor:pointer;color:var(--mp-text-secondary);transition:background .2s,color .2s}.mp-nav-tab:hover{background-color:var(--mp-bg-tertiary)}.mp-nav-tab.active{background-color:var(--mp-accent-primary);color:var(--mp-text-buttons)}.mp-nav-tab svg{width:18px;height:18px;pointer-events:none}.mp-nav-scroll-area{overflow-y:auto;flex:1;scrollbar-width:none;-ms-overflow-style:none}.mp-nav-scroll-area::-webkit-scrollbar{display:none}.mp-nav-item-wrapper{display:flex;flex-direction:column;border-bottom:1px solid var(--mp-bg-tertiary)}.mp-nav-item-wrapper:last-child{border-bottom:none}.mp-nav-list-item{padding:10px 12px;font-family:var(--mp-font-family-base);font-size:13px;color:var(--mp-text-secondary);cursor:pointer;display:flex;align-items:center;gap:10px;transition:background .1s;position:relative;overflow:hidden}.mp-nav-list-item.main-msg-item{border-bottom:none!important}.mp-nav-list-item.current-item,.mp-nav-list-item:hover{background-color:var(--mp-bg-tertiary)}.mp-nav-list-item.current-item{color:var(--mp-accent-primary);border-left:3px solid var(--mp-accent-primary);font-weight:500}.mp-nav-idx-badge{font-size:10px;background:var(--mp-bg-secondary);padding:0;border-radius:4px;min-width:24px;height:20px;display:flex;align-items:center;justify-content:center;color:var(--mp-text-primary);flex-shrink:0;position:relative;overflow:hidden}.mp-nav-idx-badge.has-topics{cursor:pointer;transition:background-color .2s,color .2s}.mp-nav-idx-badge.has-topics:hover,.mp-nav-item-wrapper.expanded .mp-nav-idx-badge.has-topics{background-color:var(--mp-accent-primary);color:var(--mp-text-buttons)}.mp-nav-idx-number{transition:opacity .2s,transform .2s}.mp-nav-expand-icon{position:absolute;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.5) rotate(0deg);transition:opacity .2s,transform .2s cubic-bezier(.165,.84,.44,1)}.mp-nav-expand-icon svg{width:16px;height:16px}.mp-nav-idx-badge.has-topics:hover .mp-nav-idx-number,.mp-nav-item-wrapper.expanded .mp-nav-idx-badge.has-topics .mp-nav-idx-number{opacity:0;transform:scale(.5)}.mp-nav-idx-badge.has-topics:hover .mp-nav-expand-icon{opacity:1;transform:scale(1) rotate(0deg)}.mp-nav-item-wrapper.expanded .mp-nav-idx-badge.has-topics .mp-nav-expand-icon{opacity:1;transform:scale(1) rotate(90deg)}.mp-nav-preview-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}.mp-nav-type-icon{width:13px!important;height:13px!important;flex-shrink:0!important;color:var(--mp-accent-primary)!important;margin-left:auto!important;opacity:1!important;display:flex!important;align-items:center!important}.mp-nav-submenu{font-family:var(--mp-font-family-base);display:none;flex-direction:column;background-color:var(--mp-bg-primary);border-left:2px solid var(--mp-bg-tertiary);margin-left:24px;margin-right:12px;margin-bottom:6px;border-bottom-left-radius:4px;overflow:hidden}.mp-nav-item-wrapper.expanded .mp-nav-submenu{display:flex;animation:mpFadeInDrop .2s ease forwards}.mp-nav-sub-item{padding:6px 8px;font-size:11.5px;color:var(--mp-text-secondary);cursor:pointer;display:flex;align-items:center;transition:background .1s,color .1s;position:relative;overflow:hidden}.mp-nav-sub-item:hover{background-color:var(--mp-bg-tertiary);color:var(--mp-text-primary)}.mp-nav-sub-item:before{content:\"\";position:absolute;left:-2px;top:50%;width:6px;height:2px;background-color:var(--mp-bg-tertiary)}.mp-nav-sub-item:hover:before{background-color:var(--mp-accent-primary)}.mp-nav-sub-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%}.mp-nav-sub-item.level-1{padding-left:8px;font-weight:500}.mp-nav-sub-item.level-2{padding-left:16px}.mp-nav-sub-item.level-3{padding-left:24px;font-size:11px;opacity:.9}.mp-nav-sub-item.level-4{padding-left:32px;font-size:10.5px;opacity:.8}.mp-nav-sub-item.level-5{padding-left:40px;font-size:10px;opacity:.7}.mp-nav-sub-item.level-6{padding-left:48px;font-size:10px;opacity:.6}.mp-nav-sub-item.current-item{background-color:var(--mp-bg-tertiary);color:var(--mp-accent-primary);font-weight:500}.mp-nav-sub-item.current-item:before{background-color:var(--mp-accent-primary)}.mp-nav-msg-actions{position:absolute;right:0;top:0;bottom:0;padding-left:24px;padding-right:12px;display:flex;align-items:center;gap:4px;background:linear-gradient(90deg,transparent 0,var(--mp-bg-tertiary) 30%,var(--mp-bg-tertiary));transform:translateX(110%);transition:transform .25s cubic-bezier(.25,1,.5,1);z-index:2}.mp-nav-list-item:hover .mp-nav-msg-actions,.mp-nav-sub-item:hover .mp-nav-msg-actions{transform:translateX(0)}.mp-pin-btn{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;color:var(--mp-text-secondary);cursor:pointer;transition:all .2s}.mp-pin-btn:hover{color:var(--mp-accent-edit)}.mp-pin-btn.is-pinned{color:var(--mp-accent-primary)}.mp-pin-btn svg{width:14px;height:14px}.mp-pinned-carousel-wrapper{position:fixed;top:15px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:8px;pointer-events:none;transition:opacity .3s}.mp-pinned-carousel-wrapper.mp-orient-h{flex-direction:column;padding-bottom:20px}.mp-pinned-carousel-wrapper.mp-orient-v{flex-direction:row;padding-right:20px;gap:15px!important}.mp-pinned-main-wrapper{display:flex;align-items:center;gap:10px;pointer-events:none;transition:opacity .3s ease}.mp-orient-v .mp-pinned-main-wrapper{flex-direction:column}.mp-pinned-carousel-wrapper.is-hidden .mp-pinned-main-wrapper{opacity:0;pointer-events:none}.mp-pinned-carousel-wrapper.is-hidden .mp-pinned-main-wrapper,.mp-pinned-carousel-wrapper.is-hidden .mp-pinned-main-wrapper *{pointer-events:none!important}.mp-orient-h .mp-pinned-viewport{max-width:80vw;overflow:hidden;display:flex;justify-content:center;padding:40px 10px;margin:-40px -10px;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent);min-height:fit-content}.mp-orient-v .mp-pinned-viewport{height:50vh;max-height:350px;width:fit-content;max-width:80vw;overflow:hidden;display:flex;align-items:center;padding:40px 28px;margin:-40px -28px;mask-image:linear-gradient(180deg,transparent,#000 10%,#000 90%,transparent);-webkit-mask-image:linear-gradient(180deg,transparent,#000 10%,#000 90%,transparent)}.mp-orient-h .mp-pinned-track{padding:10px 0}.mp-orient-h .mp-pinned-track,.mp-orient-v .mp-pinned-track{display:flex;align-items:center;gap:12px;transition:transform .4s cubic-bezier(.25,1,.5,1);pointer-events:auto}.mp-orient-v .mp-pinned-track{flex-direction:column;padding:0 10px}.mp-pinned-viewport.is-single-item{mask-image:none!important;-webkit-mask-image:none!important;overflow:visible}.mp-pinned-viewport.is-single-item .mp-pinned-card{opacity:1;transform:scale(1.1);background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary));border-color:var(--mp-accent-primary-hover);color:var(--mp-accent-primary);pointer-events:auto}.mp-pinned-card{background:var(--mp-accent-primary);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--mp-border-secondary);border-radius:var(--mp-border-radius-lg);padding:6px 16px;color:var(--mp-text-buttons);font-family:var(--mp-font-family-base);font-size:12px;white-space:nowrap;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .4s cubic-bezier(.25,1,.5,1);transform:scale(.85);box-shadow:0 4px 12px rgba(0,0,0,.15);min-width:140px;max-width:200px;box-sizing:border-box;flex-shrink:0}.mp-pinned-card:hover{background-color:var(--mp-accent-primary-hover)}.mp-pinned-card.active-center{opacity:1;transform:scale(1.2);background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary));border-color:var(--mp-accent-primary-hover);box-shadow:var(--mp-shadow-md);color:var(--mp-accent-primary)}.mp-drag-mode .mp-pinned-card{cursor:default;pointer-events:none}.mp-pinned-card-text{flex:1;overflow:hidden;text-overflow:ellipsis;text-align:center;user-select:none}.mp-pinned-card-unpin{display:flex;align-items:center;justify-content:center;opacity:.6;transition:all .2s}.mp-pinned-card-unpin:hover{opacity:1;color:var(--mp-accent-primary);transform:scale(1.1)}.mp-pinned-card-unpin svg{width:12px;height:12px;pointer-events:none}.mp-carousel-nav{pointer-events:auto;background:var(--mp-bg-secondary);backdrop-filter:blur(8px);color:var(--mp-text-secondary);border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;opacity:.6;z-index:2;border:1px solid var(--mp-text-secondary);flex-shrink:0}.mp-carousel-nav:hover{opacity:1;transform:scale(1.1);background:var(--mp-accent-primary);color:var(--mp-text-buttons)}.mp-carousel-nav.left svg{transform:rotate(180deg)}.mp-carousel-nav.up svg{transform:rotate(-90deg)}.mp-carousel-nav.down svg{transform:rotate(90deg)}.mp-carousel-nav.right svg{transform:rotate(0deg)}.mp-carousel-nav svg{width:14px;height:14px;pointer-events:none}.mp-pinned-actions-panel{display:flex;align-items:center;justify-content:center;gap:8px;opacity:0;transform:scale(.8);transition:all .3s cubic-bezier(.25,1,.5,1);pointer-events:auto;flex-shrink:0}.mp-orient-v .mp-pinned-actions-panel{flex-direction:column}.mp-pinned-carousel-wrapper.is-list-mode .mp-pinned-actions-panel,.mp-pinned-carousel-wrapper.mp-drag-mode .mp-pinned-actions-panel,.mp-pinned-carousel-wrapper:hover .mp-pinned-actions-panel{opacity:1;transform:scale(1)}.mp-pinned-action-btn{background:var(--mp-bg-secondary);backdrop-filter:blur(8px);color:var(--mp-text-secondary);border-radius:var(--mp-border-radius-lg);border:1px solid hsla(0,0%,100%,.1);border-color:var(--mp-text-secondary);width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0}.mp-pinned-action-btn.active,.mp-pinned-action-btn:hover{background:var(--mp-accent-primary);color:var(--mp-text-buttons);transform:scale(1.1)}.mp-pinned-action-btn.delete-btn:hover,.mp-pinned-action-btn.mp-reset-btn:hover{background:var(--mp-accent-close);border-color:var(--mp-accent-close-hover)}.mp-pinned-action-btn.mp-save-btn:hover{background:#22c55e;border-color:#006826;color:#fff}.mp-pinned-action-btn svg{width:16px;height:16px;display:block;margin:auto;pointer-events:none}.mp-pinned-carousel-wrapper.mp-drag-mode{cursor:grab}.mp-pinned-carousel-wrapper.mp-drag-mode.mp-is-being-dragged{cursor:grabbing}body.mp-dragging-active,body.mp-dragging-active *{cursor:grabbing!important;user-select:none!important}.mp-drag-crosshair{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:10;width:0;height:0}.mp-drag-ch-line{position:absolute;background:var(--mp-accent-primary);opacity:.5}.mp-drag-ch-h{width:48px;height:1px;top:0;left:50%;transform:translateX(-50%)}.mp-drag-ch-v{width:1px;height:48px;left:0;top:50%;transform:translateY(-50%)}.mp-drag-ch-dot{position:absolute;width:6px;height:6px;background:var(--mp-accent-primary);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 10px var(--mp-accent-primary),0 0 20px rgba(0,0,0,.3)}.mp-rulers-container{position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9998;pointer-events:none}.mp-ruler-screen-v{width:0;height:100vh;top:0;left:50vw;border-left:1px dashed color-mix(in sRGB,var(--mp-text-primary),transparent 50%);border-right:1px dashed color-mix(in sRGB,var(--mp-text-primary),transparent 50%)}.mp-ruler-screen-h,.mp-ruler-screen-v{position:absolute;background:var(--mp-bg-overlay)}.mp-ruler-screen-h{height:0;width:100vw;left:0;top:50vh;border-top:1px dashed color-mix(in sRGB,var(--mp-text-primary),transparent 50%);border-bottom:1px dashed color-mix(in sRGB,var(--mp-text-primary),transparent 50%)}.mp-ruler-carousel-v{width:1px;height:100vh;top:0;transition:left .04s linear,opacity .2s,box-shadow .2s}.mp-ruler-carousel-h,.mp-ruler-carousel-v{position:absolute;background:var(--mp-accent-primary);opacity:.3}.mp-ruler-carousel-h{height:1px;width:100vw;left:0;transition:top .04s linear,opacity .2s,box-shadow .2s}.mp-rulers-container.mp-snapped-x .mp-ruler-carousel-v,.mp-rulers-container.mp-snapped-y .mp-ruler-carousel-h{opacity:.85;box-shadow:0 0 14px var(--mp-accent-primary),0 0 4px var(--mp-accent-primary)}.mp-ruler-label{position:absolute;font-size:9px;font-weight:700;letter-spacing:.5px;color:hsla(0,0%,100%,.2);pointer-events:none;font-family:var(--mp-font-family-base),monospace}.mp-ruler-label-v{top:10px;transform:translateX(-50%)}.mp-ruler-label-h{left:10px;transform:translateY(-50%)}.mp-pinned-carousel-wrapper.is-list-mode .mp-pinned-viewport{mask-image:none!important;-webkit-mask-image:none!important;max-height:400px;min-height:auto;display:block;overflow-y:auto;overflow-x:hidden;width:300px;padding:10px 0;margin:0;scroll-behavior:smooth;-ms-overflow-style:none;scrollbar-width:none}.mp-pinned-carousel-wrapper.is-list-mode .mp-pinned-viewport::-webkit-scrollbar{display:none}.mp-pinned-carousel-wrapper.is-list-mode .mp-pinned-track{flex-direction:column!important;align-items:center;gap:8px;width:100%;padding:0}@keyframes mpHighlightPulse{0%{transform:scale(1);outline:2px solid transparent;box-shadow:none}20%{transform:scale(1.02);outline:2px solid var(--mp-accent-primary);box-shadow:0 0 15px var(--mp-accent-primary)}80%{transform:scale(1.02);outline:2px solid var(--mp-accent-primary);box-shadow:0 0 15px var(--mp-accent-primary)}to{transform:scale(1);outline:2px solid transparent;box-shadow:none}}.mp-highlight-anim{animation:mpHighlightPulse 2s ease-in-out forwards}@keyframes mpFadeInDrop{0%{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}.mp-backup-section{display:flex;flex-direction:column;gap:12px}.mp-backup-subtitle{font-size:14px;font-weight:600;color:var(--mp-text-primary);margin:0;display:flex;align-items:center;gap:8px}.mp-backup-subtitle svg{width:16px;height:16px;fill:var(--mp-text-secondary)}.mp-backup-divider{height:1px;background-color:var(--mp-border-primary);margin:20px 0}.mp-backup-list{display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;padding-right:4px}.mp-backup-item{display:flex;align-items:center;padding:10px 12px;background-color:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);cursor:pointer;transition:background-color .15s,border-color .15s}.mp-backup-item:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-accent-primary)}.mp-backup-item-content{margin-left:12px;display:flex;flex-direction:column}.mp-backup-item-title{font-size:13px;font-weight:500;color:var(--mp-text-primary)}.mp-backup-item-desc{font-size:11px;color:var(--mp-text-tertiary);margin-top:2px}.mp-backup-warning{font-size:11px;color:var(--mp-accent-close);background-color:rgba(240,62,62,.1);padding:8px 12px;border-radius:var(--mp-border-radius-sm);line-height:1.4;text-align:center;font-weight:600}.mp-backup-actions{display:flex;gap:10px;margin-top:12px;justify-content:flex-end}.mp-backup-actions .save-button{flex:1}.mp-form-row{display:flex;gap:12px!important;width:100%!important;margin-bottom:16px!important;font-size:13px!important}.mp-form-row>.mp-form-group{flex:1;margin-bottom:0}@media (max-width:400px){.mp-form-row{flex-direction:column;gap:16px}.mp-form-row>.mp-form-group{margin-bottom:0}}.mp-tag-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:var(--mp-border-radius-sm);font-family:var(--mp-font-family-base);font-size:11px;font-weight:500;line-height:1;white-space:nowrap;cursor:default;user-select:none;transition:transform .2s ease;color:var(--mp-text-buttons)}.prompt-tags-container{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.mp-tags-modal-content{display:flex;flex-direction:column;gap:16px;max-height:60vh;overflow:hidden;padding-right:4px;scrollbar-width:none}.mp-tags-modal-content::-webkit-scrollbar{display:none}.mp-tag-form{display:flex;flex-direction:column;gap:12px;padding:16px;background-color:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-md);border:1px solid var(--mp-border-primary)}.mp-tag-form-row{display:flex;gap:12px;align-items:flex-end;justify-content:space-around;width:100%;box-sizing:border-box}.mp-tag-color-group{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;max-width:160px;min-width:80px}.mp-tag-color-label{font-family:var(--mp-font-family-base);font-size:11px;color:var(--mp-text-secondary)}.mp-tag-color-input{width:100%;height:32px;padding:0;margin:0;border:2px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-sm);cursor:pointer;background:none;overflow:hidden;box-sizing:border-box;display:block}.mp-tag-color-input::-webkit-color-swatch-wrapper{padding:0}.mp-tag-color-input::-webkit-color-swatch{border:none;border-radius:2px}.mp-tag-color-input::-moz-color-swatch{border:none;border-radius:2px}.mp-tags-list{display:flex;flex-direction:column;gap:6px}.mp-tag-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background-color:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-md);border:1px solid var(--mp-border-primary);transition:background-color .2s ease,border-color .2s ease}.mp-tag-item:hover{background-color:var(--mp-bg-tertiary);border-color:var(--mp-border-secondary)}.mp-tag-item-info{gap:12px;flex:1;min-width:0}.mp-tag-item-info,.mp-tag-item-preview{display:flex;align-items:center}.mp-tag-item-details{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.mp-tag-item-comment{font-family:var(--mp-font-family-base);font-size:12px;color:var(--mp-text-tertiary);display:block;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mp-tag-item-actions{display:flex;gap:2px;flex-shrink:0}.mp-tag-action-btn{background:none;border:none;cursor:pointer;width:28px;height:28px;border-radius:var(--mp-border-radius-sm);transition:all .15s ease;display:flex;align-items:center;justify-content:center;color:var(--mp-text-secondary);font-family:var(--mp-font-family-button)}.mp-tag-action-btn:hover{background-color:rgba(0,0,0,.05);transform:scale(1.1)}.mp-tag-action-btn.edit:hover{color:var(--mp-accent-edit)}.mp-tag-action-btn.delete:hover{color:var(--mp-accent-close)}.mp-tag-action-btn svg{width:16px;height:16px}.mp-tags-empty{text-align:center;padding:32px;color:var(--mp-text-tertiary);font-family:var(--mp-font-family-base)}.mp-filter-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;width:28px;height:28px;border-radius:var(--mp-border-radius-sm);display:flex;align-items:center;justify-content:center;color:var(--mp-text-secondary);transition:all .2s ease;z-index:5;margin-right:5px}.mp-filter-btn:hover{background-color:rgba(0,0,0,.05);transform:translateY(-50%) scale(1.1)}.mp-filter-btn.active,.mp-filter-btn:hover{color:var(--mp-accent-primary)}.mp-filter-btn svg{width:16px;height:16px}.mp-filter-dropdown{position:fixed;min-width:100px;max-width:200px;background-color:var(--mp-bg-primary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);box-shadow:var(--mp-shadow-lg);display:none;flex-direction:column;max-height:280px;overflow:hidden}.mp-filter-dropdown.visible{display:flex;flex-direction:column}.mp-filter-header{display:flex;justify-content:space-around;flex-direction:row-reverse;align-items:center;padding:4px 6px;border-bottom:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);gap:2px}.mp-filter-manage-btn{background:none;border:none;cursor:pointer;width:28px;height:28px;border-radius:var(--mp-border-radius-sm);display:flex;align-items:center;justify-content:center;color:var(--mp-text-secondary);transition:all .2s ease}.mp-filter-manage-btn:hover{background-color:rgba(0,0,0,.05);transform:scale(1.1);color:var(--mp-accent-edit)}.mp-filter-manage-btn svg{width:16px;height:16px}.mp-filter-clear-btn{background:none;border:none;cursor:pointer;width:28px;height:28px;border-radius:var(--mp-border-radius-sm);display:flex;align-items:center;justify-content:center;color:var(--mp-text-secondary);transition:all .2s ease}.mp-filter-clear-btn:hover{background-color:rgba(0,0,0,.05);transform:scale(1.1);color:var(--mp-accent-close)}.mp-filter-clear-btn svg{width:16px;height:16px}.mp-filter-list{overflow-y:auto;padding:4px;flex:1;scrollbar-width:none}.mp-filter-list::-webkit-scrollbar{display:none}.mp-filter-item{display:flex;align-items:center;gap:10px;padding:7px 10px;cursor:pointer;border-radius:var(--mp-border-radius-sm);transition:background-color .15s ease,box-shadow .15s ease}.mp-filter-item+.mp-filter-item{margin-top:1px}.mp-filter-item.selected,.mp-filter-item:hover{background-color:var(--mp-bg-tertiary)}.mp-filter-tag-preview{flex:1;min-width:0}.mp-filter-empty{padding:24px 16px;text-align:center;color:var(--mp-text-tertiary);font-family:var(--mp-font-family-base);font-size:13px}.mp-accordions-row{display:flex;gap:10px;margin-bottom:15px;flex-shrink:0;align-items:flex-start}.mp-accordions-row>.mp-files-accordion,.mp-accordions-row>.mp-tags-accordion{flex:1;margin:0}.mp-files-accordion,.mp-tags-accordion{border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);background-color:var(--mp-bg-secondary);overflow:hidden;margin-top:10px;margin-bottom:20px;flex-shrink:0;transition:border-color .2s;display:flex;flex-direction:column}.mp-files-accordion:hover,.mp-tags-accordion:hover{border-color:var(--mp-accent-primary)}.mp-accordion-header{padding:8px 12px;background-color:var(--mp-bg-secondary);cursor:pointer;font-size:13px;font-weight:600;color:var(--mp-text-secondary);display:flex;justify-content:space-between;align-items:center;user-select:none;transition:background .2s;border-bottom:1px solid transparent;flex-shrink:0}.mp-accordion-header:hover{color:var(--mp-text-primary);background-color:var(--mp-bg-tertiary)}.mp-accordion-header svg{width:16px;height:16px;transition:transform .2s ease;opacity:.6}.mp-files-accordion.open .mp-accordion-header,.mp-tags-accordion.open .mp-accordion-header{border-bottom:1px solid var(--mp-border-primary);background-color:var(--mp-bg-tertiary)}.mp-files-accordion.open .mp-accordion-header svg:last-child,.mp-tags-accordion.open .mp-accordion-header svg:last-child{transform:rotate(180deg);opacity:1;color:var(--mp-accent-primary)}.mp-accordion-content{display:none;background-color:var(--mp-bg-primary);position:relative;flex-direction:column}.mp-files-accordion.open .mp-accordion-content,.mp-tags-accordion.open .mp-accordion-content{display:flex;flex-direction:column;height:190px}.mp-accordion-content .mp-scroll-wrapper{flex:1;display:flex;flex-direction:column;min-height:0}.mp-file-scroll-wrapper,.mp-tags-scroll-wrapper{flex:1;height:100%;overflow-y:auto;padding:12px 10px;scrollbar-width:none;-ms-overflow-style:none;box-sizing:border-box}.mp-dynamic-dropzone.empty-state,.mp-file-scroll-wrapper.empty-state,.mp-tags-scroll-wrapper.empty-state{height:100%;display:flex;justify-content:center;cursor:pointer;background:linear-gradient(135deg,color-mix(in srgb,var(--mp-accent-primary) 8%,transparent),color-mix(in srgb,var(--mp-accent-primary) 3%,transparent));box-shadow:0 8px 32px 0 rgba(0,0,0,.08),inset 0 1px 1px 0 hsla(0,0%,100%,.2)}.mp-file-scroll-wrapper.empty-state:hover,.mp-tags-scroll-wrapper.empty-state:hover{background:linear-gradient(135deg,color-mix(in srgb,var(--mp-accent-primary) 12%,transparent),color-mix(in srgb,var(--mp-accent-primary) 5%,transparent));border-color:var(--mp-accent-primary);box-shadow:0 12px 40px 0 rgba(0,0,0,.12),inset 0 1px 1px 0 hsla(0,0%,100%,.3)}.mp-file-grid.empty-state,.mp-tags-grid.empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;width:100%;pointer-events:none}.mp-file-empty-icon,.mp-tags-empty-icon{width:48px;height:48px;color:var(--mp-accent-primary);opacity:.8;display:flex;align-items:center;justify-content:center}.mp-file-empty-text,.mp-tags-empty-text{color:var(--mp-text-primary);font-size:14px;font-weight:600;text-align:center}.mp-file-empty-subtext,.mp-tags-empty-subtext{color:var(--mp-text-secondary);font-size:12px;text-align:center}.mp-file-scroll-wrapper::-webkit-scrollbar,.mp-tags-scroll-wrapper::-webkit-scrollbar{display:none}.mp-file-grid{display:grid;grid-template-columns:repeat(auto-fill,70px);gap:10px}.mp-file-grid,.mp-tags-grid{justify-content:center;width:100%}.mp-tags-grid{display:flex;flex-wrap:wrap;gap:8px}.mp-add-file-card,.mp-file-card{position:relative;width:100%;height:70px;border-radius:6px;flex-shrink:0;cursor:pointer;transition:all .2s ease;box-sizing:border-box}.mp-file-card{background:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);overflow:hidden}.mp-add-file-card,.mp-file-card{display:flex;align-items:center;justify-content:center}.mp-add-file-card{border:2px dashed var(--mp-border-primary);color:var(--mp-text-tertiary);background:transparent}.mp-add-file-card:hover,.mp-dynamic-dropzone:hover{border-color:var(--mp-accent-primary);color:var(--mp-accent-primary);background-color:color-mix(in srgb,var(--mp-accent-primary) 5%,transparent)}.mp-add-icon{width:24px;height:24px;stroke:currentColor;stroke-width:2}.mp-file-card.inactive{opacity:.5;filter:grayscale(100%)}.mp-file-card.inactive:hover{opacity:.9;filter:grayscale(0);border-color:var(--mp-text-tertiary)}.mp-file-card.active{opacity:1;border-color:var(--mp-accent-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--mp-accent-primary) 20%,transparent)}.mp-file-thumb{width:100%;height:100%;object-fit:cover}.mp-file-icon-gen{width:28px;height:28px;color:var(--mp-text-secondary)}.mp-file-delete-perm{position:absolute;top:2px;right:2px;width:16px;height:16px;background:rgba(0,0,0,.6);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;opacity:0;transition:opacity .2s;z-index:10}.mp-file-delete-perm:hover{background-color:var(--mp-accent-close)}.mp-file-card:hover .mp-file-delete-perm{opacity:1}.mp-tag-select-item{display:inline-flex;align-items:center;padding:6px 12px;border-radius:var(--mp-border-radius-sm);font-family:var(--mp-font-family-base);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s ease;background-color:var(--mp-bg-tertiary);color:var(--mp-text-tertiary);border:1px solid transparent}.mp-tag-select-item:hover{transform:scale(1.05);opacity:.9}.mp-tag-select-item.active{border-color:hsla(0,0%,100%,.3);box-shadow:0 2px 8px rgba(0,0,0,.15)}.mp-tags-accordion-footer{display:flex;justify-content:center;padding:8px;border-top:1px solid var(--mp-border-primary);background-color:var(--mp-bg-secondary);flex-shrink:0;position:relative;z-index:10}.mp-tags-manage-btn{display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--mp-accent-primary);font-family:var(--mp-font-family-button);font-size:12px;font-weight:500;padding:6px 12px;border-radius:var(--mp-border-radius-sm);transition:background-color .2s ease}.mp-tags-manage-btn:hover{background-color:color-mix(in srgb,var(--mp-accent-primary) 15%,transparent)}.mp-tags-manage-btn svg{width:14px;height:14px}.mp-icon-container{display:flex;align-items:center;justify-content:center;cursor:help;width:16px;height:16px;color:var(--mp-accent-primary)}.mp-syntax-container{position:relative!important;width:100%;height:100%}.mp-syntax-backdrop{position:absolute!important;top:0;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;z-index:0;font-family:var(--mp-font-family-editor)!important;font-size:inherit;font-weight:400!important;font-style:normal!important;line-height:inherit;letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0;text-shadow:none!important;text-decoration:none!important;white-space:pre-wrap;overflow-wrap:break-word;word-wrap:break-word;word-break:normal;padding:16px;margin:0;border:none;box-sizing:border-box;color:var(--mp-text-primary);background:transparent;user-select:none;-webkit-user-select:none}textarea.mp-syntax-enabled{position:relative!important;z-index:1;background:transparent!important;color:transparent!important;-webkit-text-fill-color:transparent!important;white-space:pre-wrap!important;overflow-wrap:break-word!important;word-wrap:break-word!important;word-break:normal!important;caret-color:var(--mp-syntax-caret)!important}textarea.mp-syntax-enabled::-moz-selection,textarea.mp-syntax-enabled::selection{background:var(--mp-syntax-selection)!important}.mp-syn-esc{color:var(--mp-syntax-escape)}.mp-syn-ign-f{color:var(--mp-syntax-ignore-fence);opacity:.8}.mp-syn-ign-c{color:var(--mp-syntax-ignore-content);opacity:.6}.mp-syn-qt-f{color:var(--mp-syntax-quote-fence)}.mp-syn-qt-c{color:var(--mp-syntax-quote-content)}.mp-syn-dt-f,.mp-syn-dt-k{color:var(--mp-syntax-var-keyword)}.mp-syn-fl-k,.mp-syn-fl-p,.mp-syn-fl-t{color:var(--mp-syntax-file-keyword)}.mp-syn-sl-f{color:var(--mp-syntax-sel-fence)}.mp-syn-sl-h,.mp-syn-sl-hh{color:var(--mp-syntax-sel-header)}.mp-syn-sl-sep{color:var(--mp-syntax-sel-sep);opacity:.7}.mp-syn-sl-p-multi{color:var(--mp-syntax-sel-multi)}.mp-syn-sl-p-single{color:var(--mp-syntax-sel-single)}.mp-syn-sl-p-id{color:var(--mp-syntax-sel-id)}.mp-syn-sl-p-other{color:var(--mp-syntax-sel-other)}.mp-syn-def-s{color:var(--mp-syntax-def-sep)}.mp-syn-def-v{color:var(--mp-syntax-def-val)}.mp-syn-sel-chk{color:var(--mp-syntax-sel-checked)}.mp-syn-free-b,.mp-syn-free-l{color:var(--mp-syntax-free-label);background-color:color-mix(in srgb,var(--mp-syntax-free-bracket) 25%,transparent)}.mp-syn-in-b{color:var(--mp-syntax-in-bracket)}.mp-syn-in-l{color:var(--mp-syntax-in-label)}.mp-syn-in-e{color:var(--mp-syntax-in-eq)}.mp-syn-sil-b{color:var(--mp-syntax-sil-bracket)}.mp-syn-sil-l{color:var(--mp-syntax-sil-label)}.mp-syn-sil-e{color:var(--mp-syntax-sil-eq)}.mp-syn-in-c{color:var(--mp-syntax-context);opacity:.7}.mp-syn-in-v,.mp-syn-sil-v,.mp-syn-var{color:var(--mp-syntax-var)}.mp-syn-var{border-bottom:1px dotted var(--mp-syntax-var)}.mp-syntax-backdrop,textarea.mp-syntax-enabled{tab-size:4;-moz-tab-size:4}.mp-syntax-backdrop span{font-weight:inherit;font-style:inherit}.mp-syntax-backdrop span[class*=mp-syn-]{text-decoration:none!important;text-shadow:none!important}.mp-gist-import-btn{display:inline-flex;align-items:center;justify-content:center;gap:.25rem;padding:.5rem;height:1.75rem;font-size:.75rem;font-weight:500;font-family:var(--mp-font-family-button);line-height:1.625;border-radius:6px;border:1px solid var(--mp-border-secondary);cursor:pointer;background-color:var(--mp-accent-primary);color:var(--mp-text-buttons);box-shadow:var(--mp-shadow-sm);transition:all var(--mp-transition-fast);margin-right:8px;vertical-align:middle;text-decoration:none}.mp-gist-import-btn:hover{background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary));color:var(--mp-accent-primary);border-color:var(--mp-accent-primary);box-shadow:var(--mp-shadow-md)}.mp-gist-import-btn:active{transform:scale(.98)}.file-actions{display:flex}.mp-gist-import-btn[data-state=imported],.mp-gist-import-btn[data-state=imported]:active,.mp-gist-import-btn[data-state=imported]:hover{background-color:var(--mp-bg-tertiary);color:var(--mp-text-secondary);box-shadow:none;transform:none;border-color:var(--mp-text-secondary);opacity:.7;cursor:not-allowed!important;pointer-events:auto!important}#mp-notification-container{position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;gap:12px;pointer-events:none;align-items:center}.mp-notification{background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary));color:var(--mp-accent-primary);border:1px solid var(--mp-accent-primary);padding:10px 20px;border-radius:var(--mp-border-radius-md);box-shadow:var(--mp-shadow-md);font-family:var(--mp-font-family-button);font-size:14px;font-weight:500;opacity:0;transform:translateY(-20px);transition:all var(--mp-transition-fast);display:flex;align-items:center;pointer-events:auto}.mp-notification.mp-show{opacity:1;transform:translateY(0)}.mp-notification.mp-error{background-color:color-mix(in srgb,var(--mp-accent-close) 10%,var(--mp-bg-primary));color:var(--mp-accent-close);border-color:var(--mp-accent-close);box-shadow:0 4px 12px color-mix(in srgb,var(--mp-accent-close) 25%,transparent)}.mp-prompt-meta-highlight{border:2px solid var(--mp-accent-primary)!important;border-radius:6px!important;padding:8px!important;background-color:color-mix(in srgb,var(--mp-accent-primary) 10%,var(--mp-bg-primary))!important;box-shadow:0 0 12px color-mix(in srgb,var(--mp-accent-primary) 40%,transparent)!important;transition:all var(--mp-transition-fast) ease-in-out;cursor:pointer}.mp-prompt-meta-highlight:hover{background-color:color-mix(in srgb,var(--mp-accent-primary) 15%,var(--mp-bg-primary))!important;box-shadow:0 0 16px color-mix(in srgb,var(--mp-accent-primary) 60%,transparent)!important}.mp-prompt-meta-highlight,.mp-prompt-meta-highlight a,.mp-prompt-meta-highlight li,.mp-prompt-meta-highlight span,.mp-prompt-meta-highlight strong,.mp-prompt-meta-highlight svg{color:var(--mp-accent-primary)!important}.mp-prompt-meta-highlight svg{fill:var(--mp-accent-primary)!important}.mp-patreon-button{background-color:#f96854!important;color:#fff!important;display:flex!important;justify-content:center;align-items:center;text-decoration:none;margin-top:8px;transition:filter .2s ease-in-out,transform .1s ease;border:none;cursor:pointer}.mp-patreon-button:hover{filter:brightness(1.1);text-decoration:none;color:#fff!important}.mp-patreon-button:active{filter:brightness(.9);transform:scale(.99)}.kfds-lyt-width-100.mp-patreon-button{box-sizing:border-box}.mp-expanded-filter-dropdown,.mp-filter-dropdown{z-index:100005!important}#__ap_settings_overlay{z-index:99990!important;position:fixed!important}#__ap_lang_modal_overlay{z-index:99999!important;position:fixed!important}#__ap_lang_modal_overlay .lang-box{z-index:100000!important;position:relative!important}.empty-state{padding:10px;text-align:center;color:var(--mp-text-tertiary);font-size:14px}.mp-dialogo-overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:var(--mp-bg-overlay);opacity:0;transition:opacity var(--mp-transition-fast);pointer-events:none;padding:16px}.mp-dialogo-overlay.mp-dialogo-visible{opacity:1;pointer-events:auto}.mp-dialogo{background:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-lg);box-shadow:var(--mp-shadow-lg);border:1px solid var(--mp-border-primary);width:100%;max-width:420px;display:flex;flex-direction:column;max-height:calc(100vh - 64px);transform:scale(.95) translateY(10px);opacity:0;transition:transform var(--mp-transition-fast),opacity var(--mp-transition-fast);font-family:var(--mp-font-family-base);outline:none}.mp-dialogo-overlay.mp-dialogo-visible .mp-dialogo{transform:scale(1) translateY(0);opacity:1}.mp-dialogo-header{display:flex;align-items:center;justify-content:space-between;padding:20px 20px 0}.mp-dialogo-title{font-family:var(--mp-font-family-heading);font-size:16px;font-weight:600;color:var(--mp-text-primary);margin:0;line-height:1.3}.mp-dialogo-body{padding:16px 20px;flex:1;overflow-y:auto;min-height:0}.mp-dialogo-message{font-size:14px;line-height:1.6;color:var(--mp-text-secondary);margin:0;overflow-wrap:break-word;word-break:break-word}.mp-dialogo-header:empty+.mp-dialogo-body{padding-top:20px}.mp-dialogo-body::-webkit-scrollbar{width:6px}.mp-dialogo-body::-webkit-scrollbar-track{background:transparent}.mp-dialogo-body::-webkit-scrollbar-thumb{background:var(--mp-border-primary);border-radius:10px}.mp-dialogo-body::-webkit-scrollbar-thumb:hover{background:var(--mp-text-tertiary)}.mp-dialogo-body{scrollbar-width:thin;scrollbar-color:var(--mp-border-primary) transparent}.mp-dialogo-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:4px 20px 20px}.mp-dialogo-footer:empty{display:none}.mp-dialogo-footer-checkbox{display:flex;align-items:center;margin-right:auto;font-size:12px;color:var(--mp-text-tertiary);user-select:none;cursor:pointer;line-height:1}.mp-dialogo-footer-checkbox .mp-checkbox{margin:0;width:14px;height:14px;flex-shrink:0}.mp-dialogo-footer-checkbox span{margin-left:6px}.mp-dialogo-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border:1px solid transparent;border-radius:var(--mp-border-radius-sm);font-family:var(--mp-font-family-button);font-size:13px;font-weight:500;cursor:pointer;transition:all var(--mp-transition-fast);white-space:nowrap;line-height:1.4}.mp-dialogo-btn:hover,.save-button:hover{box-shadow:4px 4px 0 0 var(--mp-text-primary);transform:translate(-2px,-2px)}.mp-dialogo-btn:active,.save-button:active{box-shadow:0 0 0 0 var(--mp-text-primary);transform:translate(0)}.mp-dialogo-btn:focus-visible{outline:2px solid var(--mp-accent-primary);outline-offset:2px}.mp-dialogo-btn-icon{display:flex;align-items:center;justify-content:center;width:16px;height:16px;flex-shrink:0}.mp-dialogo-btn-icon svg{width:100%;height:100%}.mp-dialogo-btn-primary{background:var(--mp-accent-primary);color:var(--mp-text-buttons);border-color:var(--mp-accent-primary)}.mp-dialogo-btn-primary:hover{background:var(--mp-accent-primary-hover);border-color:var(--mp-accent-primary-hover)}.mp-dialogo-btn-secondary{background:transparent;color:var(--mp-text-secondary);border-color:var(--mp-text-primary)}.mp-dialogo-btn-secondary:hover{background:var(--mp-bg-tertiary);color:var(--mp-text-primary);border-color:var(--mp-text-primary)}.mp-dialogo-btn-danger{background:var(--mp-accent-close);color:var(--mp-text-buttons);border-color:var(--mp-accent-close)}.mp-dialogo-btn-danger:hover{background:var(--mp-accent-close-hover);border-color:var(--mp-accent-close-hover)}.mp-dialogo-btn-edit{background:var(--mp-accent-edit);color:var(--mp-text-buttons);border-color:var(--mp-accent-edit)}.mp-dialogo-btn-edit:hover{background:var(--mp-accent-edit-hover);border-color:var(--mp-accent-edit-hover)}.mp-shared-changelog-btn{display:inline-block;font-size:13px;color:var(--mp-accent-primary);cursor:pointer;margin-bottom:10px;text-decoration:underline}.mp-shared-changelog-content{background:var(--mp-bg-secondary);border:1px solid var(--mp-border-primary);border-radius:var(--mp-border-radius-md);padding:10px;font-size:13px;color:var(--mp-text-secondary);max-height:250px;overflow-y:auto;margin-bottom:15px;white-space:pre-wrap;word-break:break-word;overflow-wrap:break-word}.mp-shared-changelog-content h1,.mp-shared-changelog-content h2,.mp-shared-changelog-content h3,.mp-shared-changelog-content h4,.mp-shared-changelog-content h5,.mp-shared-changelog-content h6{margin-top:0;margin-bottom:8px;color:var(--mp-text-primary)}.mp-shared-changelog-content p{margin:0 0 8px}.mp-shared-inline-code{background:var(--mp-bg-tertiary);padding:2px 4px;border-radius:3px;font-family:var(--mp-font-family-editor);color:var(--mp-accent-close)}.mp-shared-block-code{background:var(--mp-bg-tertiary);padding:10px;border-radius:var(--mp-border-radius-sm);overflow-x:auto;max-height:200px;white-space:pre-wrap;word-wrap:break-word;margin-bottom:8px;display:block}.mp-shared-block-code,.mp-shared-changelog-content code{font-family:var(--mp-font-family-editor)!important}.mp-shared-version-highlight{color:var(--mp-btn-add-color)}.mp-shared-info{margin-bottom:15px;padding:12px;background:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-md);border:1px solid var(--mp-border-primary)}.mp-shared-info-manager{margin-top:15px;margin-bottom:0;padding:10px}.mp-shared-info-header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.mp-shared-info-header.align-center{align-items:center}.mp-shared-info-list{font-size:13px;color:var(--mp-text-secondary);display:flex;flex-direction:column;gap:6px}.mp-shared-info-label{color:var(--mp-accent-primary)}.mp-shared-btn-secondary{background-color:var(--mp-bg-tertiary)!important;color:var(--mp-text-primary)!important;border:1px solid var(--mp-border-primary)!important}.mp-shared-btn-secondary:hover{background-color:var(--mp-bg-secondary)!important;opacity:.9}.mp-shared-btn-cancel{background:var(--mp-bg-secondary)!important;color:var(--mp-text-primary)!important;border:1px solid var(--mp-border-primary)!important}.mp-diff-column-full{width:100%!important}.mp-shared-cl-overlay{z-index:99995!important}.mp-shared-cl-box{max-width:600px!important;max-height:80vh!important;display:flex!important;flex-direction:column!important;cursor:default}.mp-shared-cl-title{flex-shrink:0;margin-bottom:15px}.mp-shared-cl-body{flex-grow:1;overflow-y:auto;max-height:none!important;margin-bottom:0!important;text-align:left}.mp-shared-intervals{display:flex;gap:10px;flex-wrap:wrap;padding:8px 12px;justify-content:space-between;align-items:center;background-color:var(--mp-bg-secondary);border-radius:var(--mp-border-radius-md);border:1px solid var(--mp-border-primary)}.mp-shared-interval-label{display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px;color:var(--mp-text-secondary)}.mp-shared-version-badge{color:var(--mp-btn-add-color);font-weight:600;font-size:14px}.mp-shared-info-subtext{font-size:12px;color:var(--mp-text-secondary);margin-top:5px}.mp-shared-info-actions{margin-top:10px;display:flex;gap:8px}.mp-shared-info-actions .flex-1{flex:1}.mp-shared-form-group{margin-top:15px}.mp-shared-modal-footer{margin-top:20px}.mp-diff-view{width:100%!important;flex:1!important;padding:16px!important;border-radius:var(--mp-border-radius-md)!important;border:1px solid var(--mp-border-primary)!important;background-color:var(--mp-bg-secondary)!important;color:var(--mp-text-primary)!important;font-family:var(--mp-font-family-editor)!important;font-size:15px!important;line-height:1.6!important;box-sizing:border-box!important;overflow-y:auto!important;white-space:pre-wrap!important;word-break:break-all!important}.mp-diff-line-unchanged{color:var(--mp-text-primary)}.mp-diff-line-removed{background-color:rgba(239,68,68,.15)!important;color:#ef4444!important;display:block;width:100%}.mp-diff-line-added{background-color:rgba(16,185,129,.15)!important;color:#10b981!important;display:block;width:100%}.mp-diff-line-empty{background-color:transparent;opacity:.3;user-select:none}.mp-diff-column{position:relative!important}.mp-diff-enhanced-edit-btn{position:absolute!important;bottom:12px;right:12px;z-index:10;opacity:.35;transition:opacity .2s ease,transform .2s ease}.mp-diff-enhanced-edit-btn.active,.mp-diff-enhanced-edit-btn:hover{opacity:1!important}.save-button:has(svg){display:inline-flex!important;align-items:center!important;justify-content:center!important}.save-button svg{width:18px!important;height:18px!important;display:block!important;margin:0!important;pointer-events:none}input#__ap_shared_url{color:var(--mp-accent-primary)!important;font-weight:300!important}\n";

  function injectGlobalStyles() {
    const e = "my-prompt-styles";
    if (document.getElementById(e)) return;
    const t = MP_EMBEDDED_CSS,
      n = document.createElement("style");
    ((n.id = e), setSafeInnerHTML(n, t), document.head.appendChild(n));
    if (!document.getElementById("mp-font-override")) {
      const f = document.createElement("style");
      f.id = "mp-font-override";
      f.textContent = `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@700&display=swap');:root{--mp-font-family-base:'JetBrains Mono',monospace;--mp-font-family-heading:'Orbitron',sans-serif;--mp-border-radius-sm:0px;--mp-border-radius-md:0px;}`;
      document.head.appendChild(f);
    }
    if (!document.getElementById("mp-electric-glass-override")) {
      const g = document.createElement("style");
      g.id = "mp-electric-glass-override";
      g.textContent = `.modal-title{font-family:'Orbitron',sans-serif;font-weight:700;color:var(--mp-text-secondary);}.mp-dialogo-title{font-family:'Orbitron',sans-serif;font-weight:700;}.save-button,button,.mp-action-btn-full,.mp-btn-part{border-radius:0!important;transition:all 150ms ease-in-out;}.save-button:hover,.mp-action-btn-full:hover,.mp-btn-part:hover{box-shadow:0 0 20px rgba(0,229,255,0.5);}.save-button.mp-btn-secondary.destructive,.mp-dialogo-btn-danger{border-color:var(--mp-error)!important;color:var(--mp-error)!important;}.save-button.mp-btn-secondary.destructive:hover,.mp-dialogo-btn-danger:hover{box-shadow:0 0 25px var(--mp-error);background:rgba(255,0,85,0.3)!important;}.mp-switch input:checked+label{box-shadow:0 0 12px rgba(0,229,255,0.8);}.mp-tooltip-content{background-color:rgba(10,19,26,0.65)!important;color:var(--mp-text-primary)!important;border:1px solid rgba(0,229,255,0.3)!important;box-shadow:0 0 20px rgba(0,229,255,0.15)!important;backdrop-filter:blur(6px);}.mp-tooltip-preview-text{background-color:rgba(10,19,26,0.4)!important;color:var(--mp-text-primary)!important;border:1px solid rgba(0,229,255,0.2)!important;}.mp-tooltip-top .mp-tooltip-arrow{border-top-color:rgba(10,19,26,0.65)!important;}.mp-tooltip-bottom .mp-tooltip-arrow{border-bottom-color:rgba(10,19,26,0.65)!important;}.mp-tooltip-left .mp-tooltip-arrow{border-left-color:rgba(10,19,26,0.65)!important;}.mp-tooltip-right .mp-tooltip-arrow{border-right-color:rgba(10,19,26,0.65)!important;}.mp-tooltip-btn:focus,.mp-tooltip-btn:hover{background-color:rgba(0,229,255,0.2)!important;color:var(--mp-text-secondary)!important;}`;
      document.head.appendChild(g);
    }
    if (!document.getElementById("mp-pill-copy-btn-style")) {
      const h = document.createElement("style");
      h.id = "mp-pill-copy-btn-style";
      h.textContent =
        ".mp-btn-copy{flex:0 0 0;width:0;height:0;opacity:0;overflow:hidden;transition:flex-basis var(--mp-transition-fast),width var(--mp-transition-fast),height var(--mp-transition-fast),opacity var(--mp-transition-fast),transform var(--mp-transition-fast);}.mp-sliding-pill-container:hover .mp-btn-copy{flex:0 0 34px;width:34px;height:34px;opacity:1;transform:translate(0);}.mp-dir-top .mp-btn-copy{transform:translateY(10px);}.mp-dir-bottom .mp-btn-copy{transform:translateY(-10px);}.mp-dir-left .mp-btn-copy{transform:translateX(10px);}.mp-dir-right .mp-btn-copy{transform:translateX(-10px);}";
      document.head.appendChild(h);
    }
  }
  function createCustomTooltip(e, t, n = "top", a = !0) {
    if (!e) return;
    e._removeTooltipEvents && e._removeTooltipEvents();
    let o = null,
      r = null;
    const s = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
    (e.setAttribute("aria-describedby", s), e.setAttribute("tabindex", "0"));
    const i = "string" == typeof t ? { text: t } : t || { text: "" },
      l = (i.actions && i.actions.length > 0) || i.previewMode,
      c = () => {
        if ((clearTimeout(r), !document.body.contains(e))) return;
        if ((window.clearAllCustomTooltips(), o)) return;
        ((o = document.createElement("div")),
          (o.className = `mp-tooltip mp-tooltip-${n}`),
          l && o.classList.add("mp-tooltip-interactive"),
          o.setAttribute("role", "tooltip"),
          o.setAttribute("id", s),
          (o.style.visibility = "hidden"),
          l &&
            (o.addEventListener("mouseenter", () => clearTimeout(r)),
            o.addEventListener("mouseleave", () => {
              r = setTimeout(() => d(!0), 150);
            })));
        const t = document.createElement("div");
        if (((t.className = "mp-tooltip-content"), i.previewMode && i.text)) {
          const e = document.createElement("div");
          e.className = "mp-tooltip-preview-container";
          const n = document.createElement("div");
          ((n.className = "mp-tooltip-preview-text"),
            (n.textContent = i.text),
            e.appendChild(n),
            t.appendChild(e),
            requestAnimationFrame(() => {
              if ("function" == typeof setupEnhancedScroll) {
                const e = setupEnhancedScroll(
                  n,
                  null,
                  "var(--mp-border-radius-sm)",
                );
                e && (e.style.overflow = "hidden");
              }
            }));
        } else if (i.text) {
          const e = document.createElement("div");
          ((e.className = "mp-tooltip-text"),
            (e.textContent = i.text),
            t.appendChild(e));
        }
        if (i.actions && i.actions.length > 0) {
          const e = document.createElement("div");
          ((e.className = `mp-tooltip-actions mp-tooltip-actions-${i.layout || "row"}`),
            i.actions.forEach((t) => {
              const n = document.createElement("button");
              if (((n.className = "mp-tooltip-btn"), t.icon)) {
                const e = document.createElement("span");
                ((e.className = "mp-tooltip-btn-icon"),
                  "string" == typeof t.icon
                    ? "function" == typeof setSafeInnerHTML
                      ? setSafeInnerHTML(e, t.icon)
                      : (e.innerHTML = t.icon)
                    : t.icon instanceof HTMLElement && e.appendChild(t.icon),
                  n.appendChild(e));
              }
              if (t.label) {
                const e = document.createElement("span");
                ((e.textContent = t.label), n.appendChild(e));
              }
              (t.style && Object.assign(n.style, t.style),
                n.addEventListener("click", (e) => {
                  (e.stopPropagation(),
                    "function" == typeof t.action && t.action(),
                    d(!0));
                }),
                e.appendChild(n));
            }),
            t.appendChild(e));
        }
        const a = document.createElement("div");
        ((a.className = "mp-tooltip-arrow"),
          o.appendChild(t),
          o.appendChild(a),
          document.body.appendChild(o),
          o.offsetWidth);
        const c = e.getBoundingClientRect(),
          p = o.offsetWidth,
          m = o.offsetHeight;
        let u, g;
        ("bottom" === n
          ? (u = c.bottom + 8 + window.scrollY)
          : "top" === n
            ? (u = c.top - m - 8 + window.scrollY)
            : "left" === n
              ? ((u = c.top + c.height / 2 - m / 2 + window.scrollY),
                (g = c.left - p - 8))
              : "right" === n &&
                ((u = c.top + c.height / 2 - m / 2 + window.scrollY),
                (g = c.right + 8)),
          ("top" !== n && "bottom" !== n) ||
            (g = c.left + c.width / 2 - p / 2));
        (g < 10
          ? (g = 10)
          : g + p > window.innerWidth - 10 && (g = window.innerWidth - p - 10),
          u < window.scrollY && (u = 10 + window.scrollY),
          (o.style.left = `${Math.round(g)}px`),
          (o.style.top = `${Math.round(u)}px`),
          requestAnimationFrame(() => {
            o && ((o.style.visibility = "visible"), o.classList.add("visible"));
          }));
      },
      d = (e = !1) => {
        if ((clearTimeout(r), !o)) return;
        const t = o;
        ((o = null), t.classList.remove("visible"));
        setTimeout(
          () => {
            document.body.contains(t) && document.body.removeChild(t);
          },
          e ? 0 : 150,
        );
      },
      p = () => c(),
      m = () => {
        r = setTimeout(() => d(!1), 100);
      },
      u = () => c(),
      g = () => d(!0),
      f = () => setTimeout(() => d(!0), 10),
      h = () => {
        a && window.clearAllCustomTooltips();
      };
    (e.addEventListener("mouseenter", p),
      e.addEventListener("mouseleave", m),
      e.addEventListener("focus", u),
      e.addEventListener("blur", g),
      e.addEventListener("mousedown", f),
      e.addEventListener("click", h),
      (e._removeTooltipEvents = () => {
        (e.removeEventListener("mouseenter", p),
          e.removeEventListener("mouseleave", m),
          e.removeEventListener("focus", u),
          e.removeEventListener("blur", g),
          e.removeEventListener("mousedown", f),
          e.removeEventListener("click", h),
          d(!0));
      }));
  }
  window.clearAllCustomTooltips = () => {
    document.querySelectorAll(".mp-tooltip").forEach((e) => {
      document.body.contains(e) && document.body.removeChild(e);
    });
  };
  const DSA_STORAGE_KEY = "DontShowAgain";
  async function getDontShowAgain(e) {
    try {
      const r = await GM_getValue("DontShowAgain", {});
      return !!r[e];
    } catch (e) {
      return !1;
    }
  }
  async function setDontShowAgain(e) {
    try {
      const t = await GM_getValue("DontShowAgain", {});
      ((t[e] = !0), await GM_setValue("DontShowAgain", t));
    } catch (e) {}
  }
  async function createDialogo(e) {
    const t = "string" == typeof e ? { type: "alert", message: e } : { ...e };
    t.title || (t.title = "Warning");
    const n = t.dontShowAgainId;
    return n && (await getDontShowAgain(n))
      ? Promise.resolve("dont_show_again")
      : new Promise((e) => {
          const a = "alert" === t.type && !t.actions,
            o = !1 !== t.closable && !a,
            r = document.createElement("div");
          ((r.className = "mp-dialogo-overlay"),
            r.setAttribute("role", "presentation"));
          const s = document.createElement("div");
          ((s.className = "mp-dialogo"),
            s.setAttribute("role", "dialog"),
            s.setAttribute("aria-modal", "true"),
            t.title && s.setAttribute("aria-label", t.title),
            t.width && (s.style.maxWidth = t.width),
            (s.onclick = (e) => e.stopPropagation()));
          const i = document.createElement("div");
          if (((i.className = "mp-dialogo-header"), t.title)) {
            const e = document.createElement("h3");
            ((e.className = "mp-dialogo-title"),
              (e.textContent = t.title),
              i.appendChild(e));
          }
          if (o) {
            const e = document.createElement("button");
            ((e.className = "mp-modal-close-btn"),
              setSafeInnerHTML(e, ICONS.close),
              e.addEventListener("click", () => g()),
              i.appendChild(e));
          }
          s.appendChild(i);
          const l = document.createElement("div");
          if (((l.className = "mp-dialogo-body"), t.message))
            if ("string" == typeof t.message) {
              const e = document.createElement("p");
              ((e.className = "mp-dialogo-message"),
                (e.textContent = t.message),
                l.appendChild(e));
            } else t.message instanceof HTMLElement && l.appendChild(t.message);
          (t.content instanceof HTMLElement && l.appendChild(t.content),
            s.appendChild(l));
          const c = document.createElement("div");
          c.className = "mp-dialogo-footer";
          let d = null;
          if (n) {
            const e = document.createElement("label");
            ((e.className = "mp-dialogo-footer-checkbox"),
              (d = document.createElement("input")),
              (d.type = "checkbox"),
              (d.className = "mp-checkbox"));
            const t = document.createElement("span");
            ((t.textContent = "Don't show again"),
              e.appendChild(d),
              e.appendChild(t),
              c.appendChild(e));
          }
          let p = t.actions;
          (p ||
            (p =
              "confirm" === t.type
                ? [
                    {
                      label: "Cancel",
                      style: "danger",
                      value: !1,
                    },
                    {
                      label: "Confirm",
                      style: "primary",
                      value: !0,
                    },
                  ]
                : [{ label: "OK", style: "primary", value: void 0 }]),
            p.forEach((e, t) => {
              const a = document.createElement("button");
              if (
                ((a.className = `mp-dialogo-btn mp-dialogo-btn-${e.style || "primary"}`),
                e.icon)
              ) {
                const t = document.createElement("span");
                ((t.className = "mp-dialogo-btn-icon"),
                  "string" == typeof e.icon
                    ? setSafeInnerHTML(t, e.icon)
                    : e.icon instanceof HTMLElement && t.appendChild(e.icon),
                  a.appendChild(t));
              }
              if (e.label) {
                const t = document.createElement("span");
                ((t.textContent = e.label), a.appendChild(t));
              }
              const o = void 0 !== e.value ? e.value : t;
              (a.addEventListener("click", (t) => {
                (t.stopPropagation(),
                  "function" == typeof e.action && e.action(),
                  n && d && d.checked && setDontShowAgain(n),
                  g(o));
              }),
                c.appendChild(a));
            }),
            s.appendChild(c),
            r.appendChild(s),
            document.body.appendChild(r),
            requestAnimationFrame(() => {
              r.classList.add("mp-dialogo-visible");
            }));
          let m = !1;
          const u = "confirm" !== t.type && void 0;
          function g(t = u) {
            m ||
              ((m = !0),
              r.classList.remove("mp-dialogo-visible"),
              setTimeout(() => {
                (document.body.contains(r) && document.body.removeChild(r),
                  e(t));
              }, 200));
          }
          setTimeout(() => {
            const e = c.querySelector("button");
            e && e.focus();
          }, 150);
        });
  }
  function showNotification(e, t = "success") {
    let n = document.getElementById("mp-notification-container");
    n ||
      ((n = document.createElement("div")),
      (n.id = "mp-notification-container"),
      document.body.appendChild(n));
    const a = document.createElement("div");
    ((a.className = `mp-notification mp-${t}`),
      setSafeInnerHTML(a, `<span>${e}</span>`),
      n.appendChild(a),
      requestAnimationFrame(() => {
        a.classList.add("mp-show");
      }),
      setTimeout(() => {
        (a.classList.remove("mp-show"), setTimeout(() => a.remove(), 300));
      }, 3e3));
  }
  const ICONS = {
      cloudFile:
        '<svg viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.913 7.029C7.751 5.772 9.626 4 12.5 4c2.13 0 3.65 1.08 4.607 2.33a7.1 7.1 0 0 1 1.285 2.745c.785.127 1.695.43 2.505 1.014C22.092 10.948 23 12.373 23 14.5s-.908 3.551-2.103 4.412C19.753 19.735 18.41 20 17.5 20H13v-6.586l1.293 1.293a1 1 0 0 0 1.414-1.414l-3-3a1 1 0 0 0-1.414 0l-3 3a1 1 0 1 0 1.414 1.414L11 13.414V20H7.5c-1.077 0-2.67-.315-4.022-1.288C2.075 17.701 1 16.026 1 13.5s1.075-4.201 2.478-5.212c1.124-.809 2.413-1.163 3.435-1.26z" fill="currentColor"/></svg>',
      monitor:
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
      plus: '<svg class="mp-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      sol: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
      lua: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
      close:
        '<svg viewBox="0 0 1024 1024"><path fill="currentColor" d="M195.2 195.2a64 64 0 0 1 90.5 0L512 421.5l226.3-226.3a64 64 0 0 1 90.5 90.5L602.5 512l226.3 226.3a64 64 0 0 1-90.5 90.5L512 602.5 285.7 828.8a64 64 0 0 1-90.5-90.5L421.5 512 195.2 285.7a64 64 0 0 1 0-90.5"/></svg>',
      file: '<svg class="mp-file-icon-gen" fill="none" viewBox="0 0 24 28"><path d="m16.5 0 7 7v15.6c0 2.25 0 3.38-.57 4.16a3 3 0 0 1-.67.67c-.79.57-1.91.57-4.16.57H5.9c-2.25 0-3.37 0-4.16-.57a3 3 0 0 1-.67-.67C.5 25.97.5 24.85.5 22.6V5.4c0-2.25 0-3.38.57-4.16a3 3 0 0 1 .67-.67C2.52 0 3.65 0 5.9 0z" fill="url(#a)"/><path d="m16.5 0 7 7h-3.8c-1.12 0-1.68 0-2.1-.22a2 2 0 0 1-.88-.87c-.22-.43-.22-.99-.22-2.11z" fill="var(--mp-switch-knob)" fill-opacity=".55"/><path d="M6 11.78c0-.43.35-.78.78-.78h10.44a.78.78 0 1 1 0 1.57H6.78a.8.8 0 0 1-.78-.79m0 4c0-.43.35-.78.78-.78h10.44a.78.78 0 1 1 0 1.57H6.78a.8.8 0 0 1-.78-.79m.11 4.04c0-.44.35-.79.79-.79h6.32a.78.78 0 1 1 0 1.57H6.9a.8.8 0 0 1-.79-.78" fill="var(--mp-switch-knob)"/><defs><linearGradient id="a" x1="1.5" y1="-1" x2="23.5" y2="28" gradientUnits="userSpaceOnUse"><stop stop-color="var(--mp-accent-primary)"/><stop offset="1" stop-color="var(--mp-accent-primary-hover)"/></linearGradient></defs></svg>',
      expand:
        '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
      collapse:
        '<svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>',
      folder:
        '<svg style="width:16px;height:16px;margin-right:8px;vertical-align:text-bottom;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
      chevron:
        '<svg class="mp-acc-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>',
      chevronR:
        '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 7 5 5-5 5m6-10 5 5-5 5"/></svg>',
      edit: '<svg viewBox="0 0 416 432"><path fill="currentColor" d="m366 237 45 35q7 6 3 14l-43 74q-4 8-13 4l-53-21q-18 13-36 21l-8 56q-1 9-11 9h-85q-9 0-11-9l-8-56q-19-8-36-21l-53 21q-9 3-13-4L1 286q-4-8 3-14l45-35q-1-12-1-21t1-21L4 160q-7-6-3-14l43-74q5-8 13-4l53 21q18-13 36-21l8-56q2-9 11-9h85q10 0 11 9l8 56q19 8 36 21l53-21q9-3 13 4l43 74q4 8-3 14l-45 35q2 12 2 21t-2 21m-158.5 54q30.5 0 52.5-22t22-53-22-53-52.5-22-52.5 22-22 53 22 53 52.5 22"/></svg>',
      delete:
        '<svg viewBox="0 0 304 384"><path fill="currentColor" d="M21 341V85h256v256q0 18-12.5 30.5T235 384H64q-18 0-30.5-12.5T21 341M299 21v43H0V21h75L96 0h107l21 21z"/></svg>',
      export:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M21 14a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 0-2 0v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4a1 1 0 0 0-1-1m-9.71 1.71a1 1 0 0 0 .33.21 1 1 0 0 0 .76 0 1 1 0 0 0 .33-.21l4-4a1 1 0 0 0-1.42-1.42L13 12.59V3a1 1 0 0 0-2 0v9.59l-2.29-2.3a1 1 0 1 0-1.42 1.42Z"/></svg>',
      add: '<svg viewBox="0 0 14 14"><path fill="currentColor" fill-rule="evenodd" d="M8 1a1 1 0 0 0-2 0v5H1a1 1 0 0 0 0 2h5v5a1 1 0 1 0 2 0V8h5a1 1 0 1 0 0-2H8z" clip-rule="evenodd"/></svg>',
      import:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.71 7.71 11 5.41V15a1 1 0 0 0 2 0V5.41l2.29 2.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-4-4a1 1 0 0 0-.33-.21 1 1 0 0 0-.76 0 1 1 0 0 0-.33.21l-4 4a1 1 0 1 0 1.42 1.42M21 14a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 0-2 0v4a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-4a1 1 0 0 0-1-1"/></svg>',
      info: '<svg viewBox="0 0 20 20"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12ZM9 5h2v2H9V5Zm0 4h2v6H9V9Z"/></svg>',
      drag: '<svg viewBox="0 0 512 512"><path fill="currentColor" d="M278.6 9.4a32 32 0 0 0-45.3 0l-64 64A32 32 0 0 0 192 128h32v96h-96v-32a32.1 32.1 0 0 0-54.7-22.7l-64 64a32 32 0 0 0 0 45.3l64 64A32 32 0 0 0 128 320v-32h96v96h-32a32.1 32.1 0 0 0-22.7 54.7l64 64a32 32 0 0 0 45.3 0l64-64A32 32 0 0 0 320 384h-32v-96h96v32a32.1 32.1 0 0 0 54.7 22.7l64-64a32 32 0 0 0 0-45.3l-64-64A32 32 0 0 0 384 192v32h-96v-96h32a32.1 32.1 0 0 0 22.7-54.7l-64-64z"/></svg>',
      pin: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>',
      save: '<svg viewBox="0 0 32 32"><path fill="currentColor" d="M11.5 12A2.5 2.5 0 0 1 9 9.5V3H7.5A4.5 4.5 0 0 0 3 7.5v17a4.5 4.5 0 0 0 4 4.47V18.5A2.5 2.5 0 0 1 9.5 16h13a2.5 2.5 0 0 1 2.5 2.5v10.47a4.5 4.5 0 0 0 4-4.47V10.45a4.5 4.5 0 0 0-1.32-3.18l-2.95-2.95A4.5 4.5 0 0 0 22 3.02V9.5a2.5 2.5 0 0 1-2.5 2.5zM20 3h-9v6.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5zm3 26H9V18.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5z"/></svg>',
      restore:
        '<svg viewBox="0 0 512 512"><path fill="currentColor" fill-rule="evenodd" d="M256 448A192 192 0 0 1 65.5 279.8l42.3-5.3a149.4 149.4 0 1 0 25.6-103.8h80v42.6H64V64h42.7v71.3A192 192 0 1 1 256 448" clip-rule="evenodd"/></svg>',
      magic:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
      loading:
        '<svg viewBox="0 0 50 50" style="width:100%;height:100%;display:block;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="20"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite" /></circle></svg>',
      prompts:
        '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M9.812 1.238a1 1 0 0 1 .73 1.11l-.023.115-3.106 11.591a1 1 0 0 1-1.956-.403l.024-.114L8.587 1.946a1 1 0 0 1 1.225-.708M4.707 4.293a1 1 0 0 1 0 1.414L2.414 8l2.293 2.293a1 1 0 1 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414l3-3a1 1 0 0 1 1.414 0m6.586 0a1 1 0 0 1 1.32-.083l.094.083 3 3a1 1 0 0 1 .083 1.32l-.083.094-3 3a1 1 0 0 1-1.497-1.32l.083-.094L13.586 8l-2.293-2.293a1 1 0 0 1 0-1.414"/></svg>',
      navUp:
        '<svg fill="none" viewBox="0 0 20 20"><path fill="currentColor" d="M9.3 5.7a1 1 0 0 1 1.4 0l5.8 5.7a1 1 0 0 1-1.4 1.5L10 7.8l-5 5a1 1 0 1 1-1.5-1.4z"/></svg>',
      navMenu:
        '<svg fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.1 5.5H15M5 10h10M5 14.4h10"/></svg>',
      navDown:
        '<svg fill="none" transform="rotate(180)" viewBox="0 0 20 20"><path fill="currentColor" d="M9.3 5.7a1 1 0 0 1 1.4 0l5.8 5.7a1 1 0 0 1-1.4 1.5L10 7.8l-5 5a1 1 0 1 1-1.5-1.4z"/></svg>',
      expImp:
        '<svg width="16" height="16" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 16-4 4-4-4m4 4V4M3 8l4-4 4 4M7 4v16"/></svg>',
      ai: '<svg viewBox="6 6 20 20"><path fill="currentColor" d="M17 11h3v10h-3v2h8v-2h-3V11h3V9h-8zm-4-2H9a2 2 0 0 0-2 2v12h2v-5h4v5h2V11a2 2 0 0 0-2-2m-4 7v-5h4v5z"/></svg>',
      user: '<svg viewBox="0 0 24 24"><g fill="none"><path d="M12.6 23.26h-.02l-.07.03h-.03l-.07-.03h-.03v.01l-.02.43v.02l.02.02.1.07h.02l.11-.07.01-.02v-.02l-.01-.42q0-.02-.02-.02m.27-.11-.19.09-.01.01v.01l.02.43v.02l.2.1.04-.01v-.02l-.03-.61q0-.02-.02-.02m-.72 0h-.02l-.01.02-.03.61.01.03h.02l.2-.1.01-.02.02-.43v-.01l-.01-.01z"/><path fill="currentColor" d="M12 13c2.4 0 4.58.7 6.18 1.67q1.21.75 1.98 1.7c.48.6.84 1.34.84 2.13a2.5 2.5 0 0 1-1 1.99c-.56.45-1.3.74-2.09.95-1.57.42-3.68.56-5.91.56s-4.33-.14-5.91-.56A5.5 5.5 0 0 1 4 20.49a2.5 2.5 0 0 1-1-1.99c0-.79.36-1.52.84-2.14q.77-.94 1.98-1.69C7.42 13.7 9.61 13 12 13m0-11a5 5 0 1 1 0 10 5 5 0 0 1 0-10"/></g></svg>',
      all: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 21q-.8 0-1.4-.6T13 19v-4q0-.8.6-1.4T15 13h4q.8 0 1.4.6T21 15v4q0 .8-.6 1.4T19 21zm0-10q-.8 0-1.4-.6T13 9V5q0-.8.6-1.4T15 3h4q.8 0 1.4.6T21 5v4q0 .8-.6 1.4T19 11zM5 11q-.8 0-1.4-.6T3 9V5q0-.8.6-1.4T5 3h4q.8 0 1.4.6T11 5v4q0 .8-.6 1.4T9 11zm0 10q-.8 0-1.4-.6T3 19v-4q0-.8.6-1.4T5 13h4q.8 0 1.4.6T11 15v4q0 .8-.6 1.4T9 21z"/></svg>',
      tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
      filter:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
      filterAct:
        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
      bot: '<svg viewBox="0 0 28 28"><path fill="currentColor" d="M14 1.5a.75.75 0 0 1 .75.75V3h4.5A2.75 2.75 0 0 1 22 5.75v5.5q0 .74-.35 1.34l-.16-.5a1.7 1.7 0 0 0-.6-.8 1.6 1.6 0 0 0-1.9 0 1.7 1.7 0 0 0-.57.78L18 13.62q-.06.2-.16.38H8.75A2.75 2.75 0 0 1 6 11.25v-5.5A2.75 2.75 0 0 1 8.75 3h4.5v-.75A.75.75 0 0 1 14 1.5m.3 14.59.07-.09H6.75A2.75 2.75 0 0 0 4 18.75v.75c0 1.98.96 3.64 2.72 4.78C8.44 25.4 10.92 26 14 26s5.56-.6 7.28-1.72l.27-.18a1 1 0 0 1-.3-.31A1.4 1.4 0 0 1 21 23q0-.2.06-.38l-.13.11a1.6 1.6 0 0 1-1.86 0 1.7 1.7 0 0 1-.59-.8l-.5-1.53a2 2 0 0 0-.34-.64l-.18-.21a2 2 0 0 0-.83-.52l-1.56-.5a1.6 1.6 0 0 1-.77-.59 1.6 1.6 0 0 1 0-1.85M11 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m7.5-1.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0m-.33 10.33a3 3 0 0 1 .76 1.24l.5 1.53a.6.6 0 0 0 1.14 0l.5-1.53a3.2 3.2 0 0 1 2-2l1.53-.5a.6.6 0 0 0 0-1.14h-.03l-1.53-.5a3.2 3.2 0 0 1-2-2l-.5-1.53a.6.6 0 0 0-1.14 0l-.5 1.53-.01.04a3.2 3.2 0 0 1-1.96 1.96l-1.53.5a.6.6 0 0 0 0 1.14l1.53.5q.72.23 1.24.76m8.65 3.53.92.3h.02a.36.36 0 0 1 0 .68l-.92.3a1.9 1.9 0 0 0-1.2 1.2l-.3.92a.36.36 0 0 1-.68 0l-.3-.92a1.9 1.9 0 0 0-1.2-1.2l-.92-.3a.36.36 0 0 1 0-.68l.92-.3a1.9 1.9 0 0 0 1.18-1.2l.3-.92a.36.36 0 0 1 .68 0l.3.92a1.9 1.9 0 0 0 1.2 1.2"/></svg>',
      paste:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.75 2c1.16 0 2.11.88 2.24 2h1.76A2.25 2.25 0 0 1 19 6.1v.15a.75.75 0 0 1-.65.74l-.1.01a.75.75 0 0 1-.74-.65l-.01-.1a.75.75 0 0 0-.65-.74l-.1-.01h-2.13a2.2 2.2 0 0 1-1.87 1h-3.5a2.2 2.2 0 0 1-1.87-1H5.25a.75.75 0 0 0-.74.65l-.01.1v13.5c0 .39.28.7.65.75h3.1a.75.75 0 0 1 .74.65l.01.1a.75.75 0 0 1-.75.75h-3a2.25 2.25 0 0 1-2.24-2.1L3 19.77V6.24A2.25 2.25 0 0 1 5.1 4h1.91a2.25 2.25 0 0 1 2.24-2zm6 6A2.25 2.25 0 0 1 21 10.1v9.65A2.25 2.25 0 0 1 18.9 22h-6.65a2.25 2.25 0 0 1-2.24-2.1l-.01-.15v-9.5a2.25 2.25 0 0 1 2.1-2.24l.15-.01zm-6-4.5h-3.5a.75.75 0 0 0 0 1.5h3.5a.75.75 0 1 0 0-1.5"/></svg>',
      gist: '<svg viewBox="0 0 24 24"><g fill="none"><g clip-path="url(#a)"><path fill="currentColor" fill-rule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12" clip-rule="evenodd"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath></defs></g></svg>',
      olho: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 9a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3m0-4.5c5 0 9.3 3.1 11 7.5a11.8 11.8 0 0 1-22 0c1.7-4.4 6-7.5 11-7.5M3.2 12a9.8 9.8 0 0 0 17.6 0 9.8 9.8 0 0 0-17.6 0"/></svg>',
      // v27.0.8: 'patreon' and 'kofi' icons removed together with every
      // storefront / donation touchpoint (theme-shop cart, prompt-shop and
      // AI-info link actions, ko-fi page helper, ko-fi platform detection).
      // 'cart' was removed above for the same reason. No remaining references.
      // v27.1.0: 'shop' was removed with the prompt-modal shop button (the
      // "Get More Prompts" gist-search funnel); no remaining references.
      flip: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22q-3.57 0-6.32-2.25T2.2 14h2.05q.7 2.65 2.85 4.33T12 20q2.15 0 4-1.06T18.9 16H16v-2h6v6h-2v-2q-1.42 1.9-3.52 2.95T12 22m0-7q-1.25 0-2.12-.87T9 12t.88-2.12T12 9t2.13.88T15 12t-.87 2.13T12 15M2 10V4h2v2q1.43-1.9 3.53-2.95T12 2q3.58 0 6.33 2.25T21.8 10h-2.05q-.7-2.65-2.85-4.32T12 4Q9.85 4 8 5.06T5.1 8H8v2z"/></svg>',
      reset:
        '<svg viewBox="0 0 512 512"><path fill="currentColor" fill-rule="evenodd" d="M256 448A192 192 0 0 1 65.5 279.8l42.3-5.3a149.4 149.4 0 1 0 25.6-103.8h80v42.6H64V64h42.7v71.3A192 192 0 1 1 256 448" clip-rule="evenodd"/></svg>',
      switchH:
        '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16 3 4 4-4 4m-6-4h10M8 13l-4 4 4 4m-4-4h9"/></svg>',
      switchV:
        '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m3 8 4-4 4 4M7 4v9m6 3 4 4 4-4m-4-6v10"/></svg>',
      search:
        '<svg viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M12.6 23.26h-.02l-.07.03h-.03l-.07-.03h-.03v.01l-.02.43v.02l.02.02.1.07h.02l.11-.07.01-.02v-.02l-.01-.42q0-.02-.02-.02m.27-.11-.19.09-.01.01v.01l.02.43v.02l.2.1.04-.01v-.02l-.03-.61q0-.02-.02-.02m-.72 0h-.02l-.01.02-.03.61.01.03h.02l.2-.1.01-.02.02-.43v-.01l-.01-.01z"/><path fill="currentColor" d="M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13M2 10.5a8.5 8.5 0 1 1 15.18 5.26l3.65 3.65a1 1 0 0 1-1.42 1.42l-3.65-3.65A8.5 8.5 0 0 1 2 10.5M9.5 7a1 1 0 0 1 1-1 4.5 4.5 0 0 1 4.5 4.5 1 1 0 1 1-2 0A2.5 2.5 0 0 0 10.5 8a1 1 0 0 1-1-1"/></g></svg>',
      expand2:
        '<svg viewBox="0 0 14 14"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8.74 12.96c-.27.04-1.06.12-2.08.12-1.25 0-2.47-.14-3.65-.27a2.1 2.1 0 0 1-1.83-1.84 32 32 0 0 1-.26-3.63c0-1.17.1-2.02.14-2.3"/><path d="M3.9 8.25a2.1 2.1 0 0 0 1.84 1.84q1.3.17 2.66.18c.91 0 1.8-.09 2.67-.18a2.1 2.1 0 0 0 1.83-1.84q.16-1.3.18-2.65c.02-1.35-.08-1.8-.18-2.65a2.1 2.1 0 0 0-1.83-1.84C10.2 1 9.3.9 8.4.9s-1.8.1-2.66.2a2.1 2.1 0 0 0-1.83 1.84q-.17 1.29-.18 2.65c-.01 1.36.08 1.79.18 2.65m2.82-.97 3.23-3.23"/><path d="M9.95 6.87c.53-.53.53-1.94 0-2.82-.88-.53-2.3-.53-2.82 0"/></g></svg>',
      grid2:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 2h6a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m10 0h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1"/></svg>',
      grid3:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 2h2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m5 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm9-1h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1"/></svg>',
      check:
        '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m7 12 4.95 4.95 10.6-10.6m-20.5 5.7L7 17M17.6 6.4l-5.3 5.3"/></svg>',
      copy: '<svg viewBox="0 0 512 512"><path d="M352 115h90a6 6 0 0 0 6-6 28 28 0 0 0-10-21.3l-77.1-64.2a37 37 0 0 0-20.6-7.4 7.4 7.4 0 0 0-7.4 7.4V96c.1 10.5 8.6 19 19.1 19" fill="currentColor"/><path d="M307 96V16H176a32 32 0 0 0-32 32v336a32 32 0 0 0 32 32h240a32 32 0 0 0 32-32V141h-96a45 45 0 0 1-45-45" fill="currentColor"/><path d="M116 412V80H96a32 32 0 0 0-32 32v352a32 32 0 0 0 32 32h256a32 32 0 0 0 32-32v-20H148a32 32 0 0 1-32-32" fill="currentColor"/></svg>',
      link: '<svg viewBox="0 0 20 20"><path fill="currentColor" d="M4.83 15h2.91a5 5 0 0 1-1.55-2H5a3 3 0 1 1 0-6h3a3 3 0 0 1 2.82 4h2.1a5 5 0 0 0 .08-.83v-.34A4.83 4.83 0 0 0 8.17 5H4.83A4.83 4.83 0 0 0 0 9.83v.34A4.83 4.83 0 0 0 4.83 15"/><path fill="currentColor" d="M15.17 5h-2.91a5 5 0 0 1 1.55 2H15a3 3 0 1 1 0 6h-3a3 3 0 0 1-2.82-4h-2.1a5 5 0 0 0-.08.83v.34A4.83 4.83 0 0 0 11.83 15h3.34A4.83 4.83 0 0 0 20 10.17v-.34A4.83 4.83 0 0 0 15.17 5"/></svg>',
      color:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 20H4c-1.1 0-2 .9-2 2s.9 2 2 2h16c1.1 0 2-.9 2-2s-.9-2-2-2M7.11 17c.48 0 .91-.3 1.06-.75l1.01-2.83h5.65l.99 2.82c.16.46.59.76 1.07.76.79 0 1.33-.79 1.05-1.52L13.69 4.17a1.8 1.8 0 0 0-3.38 0L6.06 15.48c-.28.73.27 1.52 1.05 1.52m4.83-11.4h.12l2.03 5.79H9.91z"/></svg>',
      settings:
        '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.488.488 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    },
    DEFAULT_ICONS = { ...ICONS };
  function createPromptButton(e = "top") {
    const t = document.createElement("div");
    t.className = "mp-prompt-wrapper";
    const n = document.createElement("div");
    n.className = `mp-sliding-pill-container mp-dir-${e}`;
    const a = "left" === e || "right" === e ? "top" : "left",
      o = document.createElement("button");
    ((o.type = "button"),
      (o.className = "mp-btn-part mp-btn-copy"),
      o.setAttribute("data-testid", "composer-button-copy"),
      setSafeInnerHTML(o, ICONS.copy),
      createCustomTooltip(o, "Copy", a),
      o.addEventListener("click", (e) => {
        (e.stopPropagation(), handleInstantPageCopy());
      }));
    const r = document.createElement("button");
    ((r.type = "button"),
      (r.className = "mp-btn-part mp-btn-paste"),
      r.setAttribute("data-testid", "composer-button-paste"),
      setSafeInnerHTML(r, ICONS.paste),
      createCustomTooltip(r, "Paste", a),
      r.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          let e = "";
          const t = [];
          try {
            const n = await navigator.clipboard.read();
            for (const a of n)
              for (const n of a.types)
                if ("text/plain" === n) {
                  const t = await a.getType(n);
                  e = await t.text();
                } else if (!n.startsWith("text/")) {
                  const e = await a.getType(n),
                    o = n.split("/")[1] || "bin",
                    r = new File([e], `clipboard-${Date.now()}.${o}`, {
                      type: n,
                    });
                  t.push(r);
                }
          } catch (t) {
            try {
              e = await navigator.clipboard.readText();
            } catch (e) {}
          }
          (e || t.length > 0) &&
            (await insertPrompt({ text: e, dynamicFiles: t }, !0, !0));
        } catch (e) {}
      }));
    const s = document.createElement("button");
    return (
      (s.type = "button"),
      (s.className = "mp-btn-part mp-btn-main"),
      s.setAttribute("data-testid", "composer-button-prompts"),
      setSafeInnerHTML(s, ICONS.prompts),
      createCustomTooltip(s, "Prompts", a),
      n.appendChild(o),
      n.appendChild(r),
      n.appendChild(s),
      t.appendChild(n),
      t
    );
  }
  function createDockSettingsButton() {
    const e = document.createElement("button");
    return (
      (e.type = "button"),
      (e.className = "mp-btn-part mp-btn-settings"),
      e.setAttribute("data-testid", "composer-button-settings"),
      setSafeInnerHTML(e, ICONS.settings),
      createCustomTooltip(e, "Settings", "top"),
      e.addEventListener("click", (t) => {
        (t.stopPropagation(), t.preventDefault());
        closeMenu();
        if (!settingsModal) {
          settingsModal = createSettingsModal();
          document.body.appendChild(settingsModal);
        }
        if (settingsModal.resetToCurrent) settingsModal.resetToCurrent();
        showModal(settingsModal);
      }),
      e
    );
  }
  const FLOW_DOCK_GLYPH =
    '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="mp-dock-glyph" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2"/>' +
    '<path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/>' +
    '<path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/>' +
    '<text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="currentColor" stroke="none" font-size="56" font-weight="700" font-family="serif">&#936;</text>' +
    "</svg>";
  const FLOW_DOCK_HIDE_DELAY_MS = 2750;
  const FLOW_DOCK_CSS =
    "#pm-flow-dock{position:fixed;right:0;bottom:24px;z-index:2147483646;display:flex;align-items:stretch;border-radius:6px 0 0 6px;overflow:hidden;background:linear-gradient(160deg,rgba(30,42,60,.58) 0%,rgba(16,23,34,.52) 55%,rgba(11,16,24,.60) 100%);backdrop-filter:blur(18px) saturate(1.5);-webkit-backdrop-filter:blur(18px) saturate(1.5);border:1px solid rgba(148,196,255,.30);border-right:none;box-shadow:inset 0 1px 0 rgba(200,230,255,.18),inset 0 -1px 0 rgba(0,0,0,.28),inset 1px 0 0 rgba(200,230,255,.10),-6px 10px 36px rgba(0,0,0,.50);transition:transform 400ms cubic-bezier(0.16,1,0.3,1),backdrop-filter 280ms ease,-webkit-backdrop-filter 280ms ease;transform:translateX(calc(100% - 22px));}" +
    "#pm-flow-dock:hover,#pm-flow-dock.mp-dock-open{transform:translateX(0);backdrop-filter:blur(22px) saturate(1.65);-webkit-backdrop-filter:blur(22px) saturate(1.65);}" +
    "#pm-flow-dock .mp-dock-trigger{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border:none;background:transparent;color:#e8eaf0;font:600 12.5px/1 ui-sans-serif,system-ui,Roboto,sans-serif;letter-spacing:.02em;cursor:pointer;transition:background .2s;}" +
    "#pm-flow-dock .mp-dock-trigger:hover{background:rgba(140,220,255,.08);}" +
    "#pm-flow-dock .mp-dock-trigger:active{background:rgba(140,220,255,.2);}" +
    "#pm-flow-dock .mp-dock-glyph{width:20px;height:20px;display:block;color:#7fd8ff;flex-shrink:0;}" +
    "#pm-flow-dock .mp-dock-text{white-space:nowrap;font-family:'Cinzel Decorative',Georgia,'Times New Roman',serif;font-weight:700;font-size:13px;line-height:1;letter-spacing:.07em;color:#e8eaf0;transition:color 250ms ease,text-shadow 250ms ease;}" +
    "#pm-flow-dock .mp-dock-trigger:hover .mp-dock-text{color:#7fd8ff;text-shadow:0 0 6px rgba(127,216,255,.55),0 0 16px rgba(127,216,255,.35),0 0 30px rgba(127,216,255,.18);}" +
    "#pm-flow-dock .mp-prompt-wrapper{position:static;width:auto;height:auto;flex:0 0 auto;margin:0;}" +
    "#pm-flow-dock .mp-sliding-pill-container{position:relative;top:auto;right:auto;}" +
    "#pm-flow-dock .mp-sliding-pill-container{height:100%;border-radius:0;border:none;box-shadow:none;background:rgba(148,190,235,.10);backdrop-filter:blur(2px) saturate(1.15);-webkit-backdrop-filter:blur(2px) saturate(1.15);transition:width var(--mp-transition-fast),height var(--mp-transition-fast),background-color var(--mp-transition-fast),border-color var(--mp-transition-fast),backdrop-filter 280ms ease,-webkit-backdrop-filter 280ms ease;}" +
    "#pm-flow-dock .mp-sliding-pill-container:hover{background:rgba(148,190,235,.17);border:none;box-shadow:none;backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);}" +
    "#pm-flow-dock .mp-sliding-pill-container:active{background:rgba(148,190,235,.24);}" +
    "#pm-flow-dock .mp-btn-part{height:100%;color:#aeb9c8;}" +
    "#pm-flow-dock .mp-btn-part:hover{color:#7fd8ff;}" +
    "#pm-flow-dock .mp-sliding-pill-container:after,#pm-flow-dock .mp-sliding-pill-container:before{background-color:rgba(150,175,205,.28);}" +
    "#pm-flow-dock .mp-btn-settings{flex:0 0 0;width:0;opacity:0;overflow:hidden;transition:flex-basis var(--mp-transition-fast),width var(--mp-transition-fast),height var(--mp-transition-fast),opacity var(--mp-transition-fast),transform var(--mp-transition-fast);}" +
    "#pm-flow-dock .mp-sliding-pill-container:hover .mp-btn-settings{flex:0 0 34px;width:34px;opacity:1;transform:translate(0);}" +
    "#pm-flow-dock .mp-dir-left .mp-btn-settings{transform:translateX(10px);}" +
    "#pm-flow-dock{--mp-pill-intent-ms:950ms;--mp-pill-reveal-ms:250ms;}" +
    "#pm-flow-dock .mp-sliding-pill-container:hover{transition:width var(--mp-transition-fast) var(--mp-pill-intent-ms,950ms),height var(--mp-transition-fast),background-color var(--mp-transition-fast) var(--mp-pill-reveal-ms,250ms),border-color var(--mp-transition-fast),backdrop-filter 280ms ease var(--mp-pill-reveal-ms,250ms),-webkit-backdrop-filter 280ms ease var(--mp-pill-reveal-ms,250ms);}" +
    "#pm-flow-dock .mp-sliding-pill-container:hover .mp-btn-copy," +
    "#pm-flow-dock .mp-sliding-pill-container:hover .mp-btn-paste," +
    "#pm-flow-dock .mp-sliding-pill-container:hover .mp-btn-settings{transition-delay:var(--mp-pill-intent-ms,950ms);}" +
    "#pm-flow-dock .mp-prompt-wrapper::before{content:'';position:absolute;z-index:1002;pointer-events:none;right:10px;top:50%;width:16px;height:16px;transform:translateY(-50%);background-color:#e8eaf0;background-image:linear-gradient(90deg,transparent 0%,transparent 42%,rgba(127,216,255,.95) 50%,transparent 58%,transparent 100%);background-size:280% 100%;animation:mp-chevron-flash 2.6s linear infinite;opacity:.9;transition:opacity var(--mp-transition-fast),background-color var(--mp-transition-fast),filter var(--mp-transition-fast);-webkit-mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M14.5 5.5 8 12 14.5 18.5' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-size:16px 16px;mask-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M14.5 5.5 8 12 14.5 18.5' fill='none' stroke='white' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");mask-position:center;mask-repeat:no-repeat;mask-size:16px 16px;}" +
    "#pm-flow-dock .mp-prompt-wrapper:has(.mp-sliding-pill-container:hover)::before{opacity:0;background-color:#7fd8ff;filter:drop-shadow(0 0 6px rgba(127,216,255,.85)) drop-shadow(0 0 14px rgba(127,216,255,.45));animation-play-state:paused;transition:opacity var(--mp-transition-fast) var(--mp-pill-intent-ms,950ms),background-color var(--mp-transition-fast),filter var(--mp-transition-fast);}" +
    "@keyframes mp-chevron-flash{0%{background-position:180% 0;}100%{background-position:-80% 0;}}" +
    "@media (prefers-reduced-motion:reduce){#pm-flow-dock .mp-prompt-wrapper::before{animation:none;}}";
  function ensureCinzelDecorativeFont() {
    if (document.getElementById("pm-cinzel-font-style")) return;
    const e =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const t = (t) => {
      if (document.getElementById("pm-cinzel-font-style")) return;
      const n = document.createElement("style");
      ((n.id = "pm-cinzel-font-style"),
        (n.textContent =
          "@font-face{font-family:'Cinzel Decorative';font-style:normal;font-weight:700;font-display:swap;src:url(data:font/woff2;base64," +
          t +
          ") format('woff2');}"),
        document.head.appendChild(n));
    };
    GM_xmlhttpRequest({
      method: "GET",
      url:
        "https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&text=" +
        encodeURIComponent("Prompt Master"),
      headers: { "User-Agent": e },
      timeout: 10000,
      onload: (n) => {
        if (n.status < 200 || n.status >= 300) return;
        const a =
          /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)\s*format\('woff2'\)/i.exec(
            n.responseText || "",
          );
        if (!a) return;
        GM_xmlhttpRequest({
          method: "GET",
          url: a[1],
          headers: { "User-Agent": e },
          responseType: "arraybuffer",
          timeout: 15000,
          onload: (n) => {
            if (n.status < 200 || n.status >= 300) return;
            try {
              const a = new Uint8Array(n.response);
              let o = "";
              for (let r = 0; r < a.length; r += 0x8000)
                o += String.fromCharCode.apply(null, a.subarray(r, r + 0x8000));
              t(btoa(o));
            } catch (e) {}
          },
          onerror: () => {},
          ontimeout: () => {},
        });
      },
      onerror: () => {},
      ontimeout: () => {},
    });
  }
  function createSettingsModal() {
    let e = { ...currentThemeConfig };
    const t = document.createElement("div");
    ((t.className = "mp-overlay mp-hidden"), (t.id = "__ap_settings_overlay"));
    t.onclick = (e) => {
      e.target === t && (applyTheme(currentThemeConfig), hideModal(t));
    };
    const n = document.createElement("div");
    ((n.className = "mp-modal-box"),
      (n.style.width = "420px !important"),
      (n.style.maxHeight = "85vh !important"),
      (n.onclick = (e) => e.stopPropagation()));
    const a = ` <div class="mp-settings-container"><div class="mp-tabs-header"><button class="mp-tab-btn active" data-tab="basic">${"Basic"}</button><button class="mp-tab-btn" data-tab="advanced">${"Advanced"}</button></div><div class="mp-scroll-wrapper" style="flex:1; overflow:hidden;"><div id="mp-settings-scroll-area" style="padding: 0 4px 12px 4px; overflow-y: auto;"><div class="mp-tab-content active" id="tab-basic" style="margin-bottom: 16px; margin-top: 16px;"><div class="mp-form-row"><div class="mp-form-group"><label class="mp-label">${"Backup"}</label><button id="mp-btn-open-backup" class="mp-action-btn-full"><span style="font-weight:600;">${"Export/Import"}</span><span class="mp-btn-icon">${ICONS.expImp}</span></button></div></div><div class="mp-form-group"><label class="mp-label">${"Color Mode"}</label><div class="mp-segmented-control"><div class="mp-segment-opt" data-val="auto">${ICONS.monitor} <span>${"Auto"}</span></div><div class="mp-segment-opt" data-val="light">${ICONS.sol} <span>${"Light"}</span></div><div class="mp-segment-opt" data-val="dark">${ICONS.lua} <span>${"Dark"}</span></div></div></div><div class="mp-form-group style=" style="margin-bottom: 0px;"><label class="mp-label">${"Theme"}</label><div class="mp-theme-scroll-container" id="mp-theme-list-container"></div></div></div><div class="mp-tab-content" id="tab-advanced" style="margin-bottom: 16px; margin-top: 16px;"><div class="mp-form-group"><label class="mp-label">${"Advanced Options"}</label><div class="mp-settings-switch-container" style="margin-bottom: 8px;"><span id="mp-preview-prompt-lbl">${"Prompt Preview"}</span><div style="display: flex; gap: 12px; align-items: center;"><div style="display: flex; align-items: center; gap: 6px;"><span style="font-size: 11px; color: var(--mp-text-secondary); font-family: var(--mp-font-family-base);">${"Normal List"}</span><div class="mp-switch"><input type="checkbox" id="mp_setting_preview_normal" /><label for="mp_setting_preview_normal">Toggle</label></div></div><div style="display: flex; align-items: center; gap: 6px;"><span style="font-size: 11px; color: var(--mp-text-secondary); font-family: var(--mp-font-family-base);">${"Expanded List"}</span><div class="mp-switch"><input type="checkbox" id="mp_setting_preview_expand" /><label for="mp_setting_preview_expand">Toggle</label></div></div></div></div><div class="mp-settings-switch-container" style="margin-bottom: 8px;"><span id="mp-smart-predict-lbl"> ${"Smart Predict"} </span><div class="mp-switch"><input type="checkbox" id="mp_setting_prediction" /><label for="mp_setting_prediction">Toggle</label></div></div><div class="mp-settings-switch-container" style="margin-bottom: 8px;"><span id="mp-nav-lbl"> ${"Quick Navigation"} </span><div class="mp-switch"><input type="checkbox" id="mp_setting_nav" ${currentNavConfig.enabled ? "checked" : ""} /><label for="mp_setting_nav">Toggle</label></div></div><div class="mp-settings-switch-container"><span id="mp-syntax-lbl"> ${"Syntax Highlighting"} </span><div style="display: flex; align-items: center; gap: 8px;"><div class="mp-switch"><span id="mp-syntax-info-icon" style="cursor: help !important;" class="mp-help-icon">${ICONS.info}</span><input type="checkbox" id="mp_setting_syntax" /><label for="mp_setting_syntax">Toggle</label></div></div></div></div><div class="mp-form-group"><label class="mp-label mp-label-row" style="display: flex; justify-content: space-between; align-items: center;"> ${"\"Enhance Prompt\" Settings"} <span id="mp-AI-info-icon" class="mp-help-icon">${ICONS.info}</span></label><input type="text" id="mp_ai_api_key_input" class="form-input hide-api-key" placeholder="${"Paste your API Key"}"><select id="mp_ai_model_select" class="form-input"><optgroup label="Google Gemini"><option value="gemini-3.5-flash" ${"gemini-3.5-flash" === currentAIConfig.model ? "selected" : ""}>Gemini 3.5 Flash</option><option value="gemini-3.1-pro-preview" ${"gemini-3.1-pro-preview" === currentAIConfig.model ? "selected" : ""}>Gemini 3.1 Pro Preview</option><option value="gemini-3.1-flash-lite" ${"gemini-3.1-flash-lite" === currentAIConfig.model ? "selected" : ""}>Gemini 3.1 Flash Lite</option><option value="gemini-3-flash-preview" ${"gemini-3-flash-preview" === currentAIConfig.model ? "selected" : ""}>Gemini 3 Flash Preview</option><option value="gemini-2.5-pro" ${"gemini-2.5-pro" === currentAIConfig.model ? "selected" : ""}>Gemini 2.5 Pro</option><option value="gemini-2.5-flash-lite" ${"gemini-2.5-flash-lite" === currentAIConfig.model ? "selected" : ""}>Gemini 2.5 Flash Lite</option><option value="gemini-pro-latest" ${"gemini-pro-latest" === currentAIConfig.model ? "selected" : ""}>Gemini Pro Latest</option><option value="gemini-flash-latest" ${"gemini-flash-latest" === currentAIConfig.model ? "selected" : ""}>Gemini Flash Latest</option><option value="gemini-flash-lite-latest" ${"gemini-flash-lite-latest" === currentAIConfig.model ? "selected" : ""}>Gemini Flash-Lite Latest</option><option value="gemma-4-26b-a4b-it" ${"gemma-4-26b-a4b-it" === currentAIConfig.model ? "selected" : ""}>Gemma 4 26B A4B IT</option><option value="gemma-4-31b-it" ${"gemma-4-31b-it" === currentAIConfig.model ? "selected" : ""}>Gemma 4 31B IT</option></optgroup><optgroup label="LongCat"><option value="LongCat-2.0-Preview" ${"LongCat-2.0-Preview" === currentAIConfig.model ? "selected" : ""}>LongCat 2.0 Preview</option><option value="LongCat-Flash-Thinking-2601" ${"LongCat-Flash-Thinking-2601" === currentAIConfig.model ? "selected" : ""}>LongCat Flash Thinking 2601</option><option value="LongCat-Flash-Chat" ${"LongCat-Flash-Chat" === currentAIConfig.model ? "selected" : ""}>LongCat Flash Chat</option><option value="LongCat-Flash-Lite" ${"LongCat-Flash-Lite" === currentAIConfig.model ? "selected" : ""}>LongCat Flash Lite</option></optgroup><optgroup label="Groq"><option value="openai/gpt-oss-120b" ${"openai/gpt-oss-120b" === currentAIConfig.model ? "selected" : ""}>GPT-OSS 120B</option><option value="openai/gpt-oss-20b" ${"openai/gpt-oss-20b" === currentAIConfig.model ? "selected" : ""}>GPT-OSS 20B</option><option value="openai/gpt-oss-safeguard-20b" ${"openai/gpt-oss-safeguard-20b" === currentAIConfig.model ? "selected" : ""}>GPT-OSS Safeguard 20B</option><option value="groq/compound" ${"groq/compound" === currentAIConfig.model ? "selected" : ""}>Groq Compound</option><option value="groq/compound-mini" ${"groq/compound-mini" === currentAIConfig.model ? "selected" : ""}>Groq Compound Mini</option><option value="qwen/qwen3-32b" ${"qwen/qwen3-32b" === currentAIConfig.model ? "selected" : ""}>Qwen3 32B</option><option value="llama-3.3-70b-versatile" ${"llama-3.3-70b-versatile" === currentAIConfig.model ? "selected" : ""}>Llama 3.3 70B</option><option value="llama-3.1-8b-instant" ${"llama-3.1-8b-instant" === currentAIConfig.model ? "selected" : ""}>Llama 3.1 8B</option><option value="meta-llama/llama-4-scout-17b-16e-instruct" ${"meta-llama/llama-4-scout-17b-16e-instruct" === currentAIConfig.model ? "selected" : ""}>Llama 4 Scout 17b-16e Instruct</option><option value="meta-llama/llama-prompt-guard-2-22m" ${"meta-llama/llama-prompt-guard-2-22m" === currentAIConfig.model ? "selected" : ""}>Llama Prompt Guard 2 22m</option><option value="meta-llama/llama-prompt-guard-2-86m" ${"meta-llama/llama-prompt-guard-2-86m" === currentAIConfig.model ? "selected" : ""}>Llama Prompt Guard 2 86m</option></optgroup><optgroup label="Hugging Face"><option value="hf|zai-org/GLM-5.1:zai-org" ${"hf|zai-org/GLM-5.1:zai-org" === currentAIConfig.model ? "selected" : ""}>HF: GLM 5.1</option><option value="hf|zai-org/GLM-5:zai-org" ${"hf|zai-org/GLM-5:zai-org" === currentAIConfig.model ? "selected" : ""}>HF: GLM 5</option><option value="hf|zai-org/zai-org/GLM-4.7:zai-org" ${"hf|zai-org/zai-org/GLM-4.7:zai-org" === currentAIConfig.model ? "selected" : ""}>HF: GLM 4.7</option><option value="hf|zai-org/GLM-4.7-Flash:zai-org" ${"hf|zai-org/GLM-4.7-Flash:zai-org" === currentAIConfig.model ? "selected" : ""}>HF: GLM 4.7 Fast</option><option value="hf|google/gemma-4-31B-it" ${"hf|google/gemma-4-31B-it" === currentAIConfig.model ? "selected" : ""}>HF: Gemma 4 31B IT</option><option value="hf|google/gemma-4-26B-A4B-it" ${"hf|google/gemma-4-26B-A4B-it" === currentAIConfig.model ? "selected" : ""}>HF: Gemma 4 26B A4B IT</option><option value="hf|Qwen/Qwen3.5-397B-A17B" ${"hf|Qwen/Qwen3.5-397B-A17B" === currentAIConfig.model ? "selected" : ""}>HF: Qwen3.5 397B A17B</option><option value="hf|Qwen/Qwen3.5-122B-A10B" ${"hf|Qwen/Qwen3.5-122B-A10B" === currentAIConfig.model ? "selected" : ""}>HF: Qwen3.5 122B A10B</option><option value="hf|Qwen/Qwen3.5-35B-A3B" ${"hf|Qwen/Qwen3.5-35B-A3B" === currentAIConfig.model ? "selected" : ""}>HF: Qwen3.5 35B A3B</option><option value="hf|deepseek-ai/DeepSeek-V4-Flash" ${"hf|deepseek-ai/DeepSeek-V4-Flash" === currentAIConfig.model ? "selected" : ""}>HF: DeepSeek V4 Flash</option><option value="hf|deepseek-ai/DeepSeek-R1" ${"hf|deepseek-ai/DeepSeek-R1" === currentAIConfig.model ? "selected" : ""}>HF: DeepSeek R1 </option><option value="hf|deepseek-ai/DeepSeek-V3" ${"hf|deepseek-ai/DeepSeek-V3" === currentAIConfig.model ? "selected" : ""}>HF: DeepSeek V3</option><option value="hf|deepseek-ai/DeepSeek-V3-0324" ${"hf|deepseek-ai/DeepSeek-V3-0324" === currentAIConfig.model ? "selected" : ""}>HF: DeepSeek V3 0324</option><option value="hf|openai/gpt-oss-120b" ${"hf|openai/gpt-oss-120b" === currentAIConfig.model ? "selected" : ""}>HF: GPT OSS 120B</option><option value="hf|openai/gpt-oss-20b" ${"hf|openai/gpt-oss-20b" === currentAIConfig.model ? "selected" : ""}>HF: GPT OSS 20B</option><option value="hf|MiniMaxAI/MiniMax-M2.7" ${"hf|MiniMaxAI/MiniMax-M2.7" === currentAIConfig.model ? "selected" : ""}>HF: MiniMax M2.7</option><option value="hf|meta-llama/Llama-3.1-8B-Instruct" ${"hf|meta-llama/Llama-3.1-8B-Instruct" === currentAIConfig.model ? "selected" : ""}>HF: Llama 3.1 8B Instruct</option></optgroup><optgroup label="OpenRouter"><option value="openrouter|openrouter/free" ${"openrouter|openrouter/free" === currentAIConfig.model ? "selected" : ""}>Free Models Router</option><option value="openrouter|nvidia/nemotron-3-super-120b-a12b:free" ${"openrouter|nvidia/nemotron-3-super-120b-a12b:free" === currentAIConfig.model ? "selected" : ""}>NVIDIA: Nemotron 3 Super (free)</option><option value="openrouter|nvidia/nvidia/nemotron-3-nano-30b-a3b:free" ${"openrouter|nvidia/nvidia/nemotron-3-nano-30b-a3b:free" === currentAIConfig.model ? "selected" : ""}>NVIDIA: Nemotron 3 Nano 30B A3B (free)</option><option value="openrouter|nvidia/nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" ${"openrouter|nvidia/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" === currentAIConfig.model ? "selected" : ""}>NVIDIA: Nemotron 3 Nano Omni (free)</option><option value="openrouter|nvidia/nvidia/nemotron-nano-9b-v2:free" ${"openrouter|nvidia/nemotron-nano-9b-v2:free" === currentAIConfig.model ? "selected" : ""}>NVIDIA: Nemotron Nano 9B V2 (free)</option><option value="openrouter|nvidia/nvidia/nemotron-nano-12b-v2-vl:free" ${"openrouter|nvidia/nemotron-nano-12b-v2-vl:free" === currentAIConfig.model ? "selected" : ""}>NVIDIA: Nemotron Nano 12B 2 VL (free)</option><option value="openrouter|poolside/laguna-m.1:free" ${"openrouter|poolside/laguna-m.1:free" === currentAIConfig.model ? "selected" : ""}>Poolside: Laguna M.1 (free)</option><option value="openrouter|poolside/laguna-xs.2:free" ${"openrouter|poolside/laguna-xs.2:free" === currentAIConfig.model ? "selected" : ""}>Poolside: Laguna XS.2 (free)</option><option value="openrouter|openai/gpt-oss-120b:free" ${"openrouter|openai/gpt-oss-120b:free" === currentAIConfig.model ? "selected" : ""}>OpenAI: gpt-oss-120b (free)</option><option value="openrouter|openai/gpt-oss-20b:free" ${"openrouter|openai/gpt-oss-20b:free" === currentAIConfig.model ? "selected" : ""}>OpenAI: gpt-oss-20b (free)</option><option value="openrouter|z-ai/glm-4.5-air:free" ${"openrouter|z-ai/glm-4.5-air:free" === currentAIConfig.model ? "selected" : ""}>Z.ai: GLM 4.5 Air (free)</option><option value="openrouter|google/gemma-4-31b-it:free" ${"openrouter|google/gemma-4-31b-it:free" === currentAIConfig.model ? "selected" : ""}>Google: Gemma 4 31B (free)</option><option value="openrouter|google/gemma-4-26b-a4b-it:free" ${"openrouter|google/gemma-4-26b-a4b-it:free" === currentAIConfig.model ? "selected" : ""}>Google: Gemma 4 26B A4B (free)</option><option value="openrouter|moonshotai/kimi-k2.6:free" ${"openrouter|moonshotai/kimi-k2.6:free" === currentAIConfig.model ? "selected" : ""}>MoonshotAI: Kimi K2.6 (free)</option><option value="openrouter|liquid/lfm-2.5-1.2b-thinking:free" ${"openrouter|liquid/lfm-2.5-1.2b-thinking:free" === currentAIConfig.model ? "selected" : ""}>LiquidAI: LFM2.5-1.2B-Thinking (free)</option><option value="openrouter|liquid/lfm-2.5-1.2b-instruct:free" ${"openrouter|liquid/lfm-2.5-1.2b-instruct:free" === currentAIConfig.model ? "selected" : ""}>LiquidAI: LFM2.5-1.2B-Instruct (free)</option><option value="openrouter|qwen/qwen3-next-80b-a3b-instruct:free" ${"openrouter|qwen/qwen3-next-80b-a3b-instruct:free" === currentAIConfig.model ? "selected" : ""}>Qwen: Qwen3 Next 80B A3B Instruct (free)</option><option value="openrouter|qwen/qwen3-coder:free" ${"openrouter|qwen/qwen3-coder:free" === currentAIConfig.model ? "selected" : ""}>Qwen: Qwen3 Coder 480B A35B (free)</option><option value="openrouter|meta-llama/llama-3.3-70b-instruct:free" ${"openrouter|meta-llama/llama-3.3-70b-instruct:free" === currentAIConfig.model ? "selected" : ""}>Meta: Llama 3.3 70B Instruct (free)</option><option value="openrouter|meta-llama/llama-3.2-3b-instruct:free" ${"openrouter|meta-llama/llama-3.2-3b-instruct:free" === currentAIConfig.model ? "selected" : ""}>Meta: Llama 3.2 3B Instruct (free)</option><option value="openrouter|cognitivecomputations/dolphin-mistral-24b-venice-edition:free" ${"openrouter|cognitivecomputations/dolphin-mistral-24b-venice-edition:free" === currentAIConfig.model ? "selected" : ""}>Venice: Uncensored (free)</option><option value="openrouter|nousresearch/hermes-3-llama-3.1-405b:free" ${"openrouter|nousresearch/hermes-3-llama-3.1-405b:free" === currentAIConfig.model ? "selected" : ""}>Nous: Hermes 3 405B Instruct (free)</option><option value="openrouter|google/gemini-3.5-flash" ${"openrouter|google/gemini-3.5-flash" === currentAIConfig.model ? "selected" : ""}>Google: Gemini 3.5 Flash</option><option value="openrouter|google/gemini-3.1-flash-lite" ${"openrouter|google/gemini-3.1-flash-lite" === currentAIConfig.model ? "selected" : ""}>Google: Gemini 3.1 Flash Lite</option><option value="openrouter|google/gemini-3.1-pro-preview" ${"openrouter|google/gemini-3.1-pro-preview" === currentAIConfig.model ? "selected" : ""}>Google: Gemini 3.1 Pro Preview</option><option value="openrouter|openai/gpt-chat-latest" ${"openrouter|openai/gpt-chat-latest" === currentAIConfig.model ? "selected" : ""}>OpenAI: GPT Chat Latest</option><option value="openrouter|openai/gpt-5.5-pro" ${"openrouter|openai/gpt-5.5-pro" === currentAIConfig.model ? "selected" : ""}>OpenAI: GPT-5.5 Pro</option><option value="openrouter|openai/gpt-5.5" ${"openrouter|openai/gpt-5.5" === currentAIConfig.model ? "selected" : ""}>OpenAI: GPT-5.5</option><option value="openrouter|anthropic/claude-opus-4.8-fast" ${"openrouter|anthropic/claude-opus-4.8-fast" === currentAIConfig.model ? "selected" : ""}>Anthropic: Claude Opus 4.8 (Fast)</option><option value="openrouter|anthropic/claude-opus-4.8" ${"openrouter|anthropic/claude-opus-4.8" === currentAIConfig.model ? "selected" : ""}>Anthropic: Claude Opus 4.8</option><option value="openrouter|anthropic/claude-opus-4.7" ${"openrouter|anthropic/claude-opus-4.7" === currentAIConfig.model ? "selected" : ""}>Anthropic: Claude Opus 4.7</option><option value="openrouter|x-ai/grok-4.3" ${"openrouter|x-ai/grok-4.3" === currentAIConfig.model ? "selected" : ""}>xAI: Grok 4.3</option><option value="openrouter|deepseek/deepseek-v4-flash" ${"openrouter|deepseek/deepseek-v4-flash" === currentAIConfig.model ? "selected" : ""}>DeepSeek: DeepSeek V4 Flash</option><option value="openrouter|deepseek/deepseek-v4-pro" ${"openrouter|deepseek/deepseek-v4-pro" === currentAIConfig.model ? "selected" : ""}>DeepSeek: DeepSeek V4 Pro</option><option value="openrouter|qwen/qwen3.7-max" ${"openrouter|qwen/qwen3.7-max" === currentAIConfig.model ? "selected" : ""}>Qwen: Qwen3.7 Max</option></optgroup></select><textarea id="mp_ai_sys_prompt_input" class="form-input" placeholder="${"Custom System Prompt (Optional)"}"></textarea></div><div class="mp-form-group" style="margin-bottom: 0px;"><label class="mp-label">${"Keyboard Shortcuts"}</label><div class="mp-shortcut-scroll-container" id="mp-shortcuts-list-container"></div></div><div class="mp-form-group" style="margin-bottom: 0px;"><label class="mp-label mp-label-row" style="display:flex;justify-content:space-between;align-items:center;">${"Gist Sync"}<span id="mp-gist-info-icon" class="mp-help-icon">${ICONS.gist}</span></label><input type="text" id="mp_gist_pat_input" class="form-input hide-api-key" placeholder="${"GitHub Personal Access Token (PAT)"}"><input type="text" id="mp_gist_id_input" class="form-input" placeholder="${"Gist ID (auto-filled after first sync)"}"></div></div></div></div></div><div class="mp-settings-footer"><button class="save-button" id="mp-settings-save">${"Save"}</button></div></div> `;
    (setSafeInnerHTML(n, a), t.appendChild(n));
    const o = n.querySelector("#mp-theme-list-container"),
      r = document.createElement("input");
    ((r.type = "file"),
      (r.accept = ".mp.theme.json"),
      (r.multiple = !0),
      (r.style.display = "none"),
      n.appendChild(r),
      (r.onchange = (e) => {
        const t = e.target.files;
        t &&
          t.length > 0 &&
          Array.from(t).forEach((e, n) => {
            importThemesFromFile(e, () => {
              n === t.length - 1 && (s(), (r.value = ""));
            });
          });
      }));
    const s = () => {
      setSafeInnerHTML(o, "");
      const t = document.createElement("div");
      t.className = "mp-theme-action-row";
      const a = document.createElement("div");
      ((a.className = "mp-theme-split-btn"),
        setSafeInnerHTML(a, ICONS.plus),
        (a.onclick = () => r.click()),
        createCustomTooltip(a, "Add Theme", "bottom"),
        t.appendChild(a),
        o.appendChild(t));
      const i = (t, n, a) => {
        const r = document.createElement("div");
        ((r.className = "mp-theme-option"),
          t === e.themeId && r.classList.add("selected"));
        const i = a
          ? `${n.name}`
          : "default" === n.name
            ? "Default"
            : n.name;
        ((r.textContent = i),
          (r.onclick = () => {
            ((e.themeId = t), s(), applyTheme(e));
          }),
          a &&
            createCustomTooltip(
              r,
              {
                layout: "column",
                actions: [
                  {
                    label: "Delete",
                    action: () => {
                      deleteImportedTheme(t, () => {
                        (e.themeId === t && (e.themeId = "default"), s());
                      });
                    },
                  },
                  {
                    label: "Backup",
                    action: () =>
                      ((e, t) => {
                        const n = { [e]: t },
                          a = JSON.stringify(n),
                          o = new Blob([a], { type: "application/json" }),
                          r = URL.createObjectURL(o),
                          s = document.createElement("a");
                        s.setAttribute("href", r);
                        const i = t.name || "theme";
                        (s.setAttribute("download", i + ".mp.theme.json"),
                          document.body.appendChild(s),
                          s.click(),
                          s.remove(),
                          URL.revokeObjectURL(r));
                      })(t, n),
                  },
                ],
              },
              "right",
            ),
          o.appendChild(r));
      };
      (Object.keys(themeDefinitions).forEach((e) =>
        i(e, themeDefinitions[e], !1),
      ),
        Object.keys(importedThemes).forEach((e) =>
          i(e, importedThemes[e], !0),
        ));
    };
    s();
    const i = setupEnhancedScroll(
      o,
      "var(--mp-bg-secondary)",
      "var(--mp-border-radius-md)",
    );
    i && i.classList.add("mp-theme-wrapper-fixed");
    const l = n.querySelector("#mp-shortcuts-list-container"),
      c = l.parentElement.querySelector(".mp-label");
    c && (c.textContent = "Keyboard Shortcuts");
    const d = () => {
      setSafeInnerHTML(l, "");
      const e = document.createElement("div");
      ((e.className = "mp-shortcut-option"),
        setSafeInnerHTML(e, ICONS.restore),
        (e.style.border = "1px dashed var(--mp-border-primary)"),
        (e.style.color = "var(--mp-accent-close)"),
        (e.style.backgroundColor = "transparent"));
      const t = e.querySelector("svg");
      (t &&
        ((t.style.width = "20px"),
        (t.style.height = "20px"),
        (t.style.display = "block")),
        (e.onmouseenter = () =>
          (e.style.borderColor = "var(--mp-accent-close)")),
        (e.onmouseleave = () =>
          (e.style.borderColor = "var(--mp-border-primary)")),
        (e.onclick = async () => {
          const e = await createDialogo({
            message: "Restore Default" + "?",
            type: "confirm",
            dontShowAgainId: "restore-shortcuts",
          });
          (!0 !== e && "dont_show_again" !== e) ||
            ((currentShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS))),
            d(),
            "function" == typeof showNotification &&
              showNotification("Restored Successfully!"));
        }),
        createCustomTooltip(e, "Restore Default", "right"),
        l.appendChild(e),
        Object.keys(currentShortcuts).forEach((e) => {
          const t = currentShortcuts[e],
            n = document.createElement("div");
          ((n.className = "mp-shortcut-option"),
            (n.textContent = t.keys),
            createCustomTooltip(
              n,
              {
                text: t.desc,
                actions: [
                  {
                    label: "Restore Default",
                    icon: ICONS.restore,
                    action: () => {
                      ((currentShortcuts[e].keys = DEFAULT_SHORTCUTS[e].keys),
                        d());
                    },
                  },
                ],
              },
              "right",
            ),
            (n.onclick = (t) => {
              t.stopPropagation();
              const a = n.textContent;
              ((n.textContent = "Press a key..."),
                n.classList.add("recording"),
                l.querySelectorAll(".recording").forEach((e) => {
                  e !== n && e.classList.remove("recording");
                }));
              const o = (t) => {
                  if (
                    (t.preventDefault(),
                    t.stopPropagation(),
                    ["Control", "Alt", "Shift", "Meta"].includes(t.key))
                  )
                    return;
                  const n = [];
                  (t.ctrlKey && n.push("Ctrl"),
                    t.altKey && n.push("Alt"),
                    t.shiftKey && n.push("Shift"));
                  let a = t.key.toUpperCase();
                  ("Space" === t.code && (a = "Space"),
                    " " === a && (a = "Space"),
                    n.push(a));
                  const o = n.join("+");
                  ((currentShortcuts[e].keys = o), r(), d());
                },
                r = () => {
                  (document.removeEventListener("keydown", o, !0),
                    document.removeEventListener("mousedown", s, !0),
                    n.classList.remove("recording"));
                },
                s = (e) => {
                  e.target !== n && (r(), (n.textContent = a));
                };
              (document.addEventListener("keydown", o, !0),
                document.addEventListener("mousedown", s, !0));
            }),
            l.appendChild(n));
        }));
    };
    if (
      (d(),
      l && !l.parentElement.classList.contains("mp-shortcut-wrapper-fixed"))
    ) {
      const e = setupEnhancedScroll(
        l,
        "var(--mp-bg-secondary)",
        "var(--mp-border-radius-md)",
      );
      e &&
        (e.classList.add("mp-shortcut-wrapper-fixed"),
        (l.style.border = "none"),
        (l.style.background = "transparent"),
        (l.style.boxShadow = "none"),
        (l.style.width = "100%"));
    }
    const p = n.querySelectorAll(".mp-tab-btn");
    p.forEach((e) => {
      e.onclick = () => {
        (p.forEach((e) => e.classList.remove("active")),
          n
            .querySelectorAll(".mp-tab-content")
            .forEach((e) => e.classList.remove("active")),
          e.classList.add("active"));
        const t = `tab-${e.getAttribute("data-tab")}`;
        n.querySelector(`#${t}`) &&
          n.querySelector(`#${t}`).classList.add("active");
      };
    });
    const m = n.querySelectorAll(".mp-segment-opt"),
      u = () => {
        m.forEach((t) =>
          t.classList.toggle("selected", t.getAttribute("data-val") === e.mode),
        );
      };
    (u(),
      m.forEach((t) => {
        t.onclick = () => {
          ((e.mode = t.getAttribute("data-val")), u(), applyTheme(e));
        };
      }),
      (n.querySelector("#mp-btn-open-backup").onclick = openBackupManager));
    const g = n.querySelector("#mp-smart-predict-lbl");
    g && createCustomTooltip(g, "Facilitates writing in Dynamic Prompt mode by completing syntax, closing symbols, and suggesting variables.", "left");
    const f = n.querySelector("#mp-preview-prompt-lbl");
    f && createCustomTooltip(f, "Displays the prompt preview when hovering over it in the Normal and Expanded prompt list.", "left");
    const h = n.querySelector("#mp-syntax-lbl");
    h && createCustomTooltip(h, "Enables or disables syntax highlighting in the prompt editor.", "left");
    const v = n.querySelector("#mp-syntax-info-icon");
    v &&
      createCustomTooltip(v, "Requires page reload to apply changes.", "right");
    const y = n.querySelector("#mp-nav-lbl");
    y && createCustomTooltip(y, "Locates and jumps to specific points in the conversation via message anchors.", "left");
    const b = n.querySelector("#mp-AI-info-icon");
    b &&
      createCustomTooltip(
        b,
        {
          layout: "column",
          actions: [
            {
              label: "Basic Guide",
              action: () => {
                window.open(
                  "https://github.com/0H4S/My-Prompt/blob/main/Guides/Enhance%20with%20AI.md",
                  "_blank",
                );
              },
            },
          ],
        },
        "right",
      );
    const x = n.querySelector("#mp_setting_syntax");
    x &&
      ((x.checked = currentSyntaxConfig.enabled),
      (x.onchange = () => {
        ((currentSyntaxConfig.enabled = x.checked),
          x.checked || SyntaxHighlighter.detach());
      }));
    const C = n.querySelector("#mp_setting_prediction");
    C &&
      ((C.checked = currentPredictionConfig.enabled),
      (C.onchange = () => {
        currentPredictionConfig.enabled = C.checked;
      }));
    const T = n.querySelector("#mp_setting_preview_normal");
    T &&
      ((T.checked = currentPreviewPromptConfig.normal),
      (T.onchange = () => {
        currentPreviewPromptConfig.normal = T.checked;
      }));
    const _ = n.querySelector("#mp_setting_preview_expand");
    _ &&
      ((_.checked = currentPreviewPromptConfig.expand),
      (_.onchange = () => {
        currentPreviewPromptConfig.expand = _.checked;
      }));
    const w = n.querySelector("#mp_ai_api_key_input"),
      S = n.querySelector("#mp_ai_model_select"),
      E = n.querySelector("#mp_ai_sys_prompt_input"),
      M = () => {
        const e = getProvider(S.value);
        w.value =
          "openrouter" === e
            ? currentAIConfig.apiKeyOpenRouter || ""
            : "longcat" === e
              ? currentAIConfig.apiKeyLongcat || ""
              : "huggingface" === e
                ? currentAIConfig.apiKeyHuggingFace || ""
                : "groq" === e
                  ? currentAIConfig.apiKeyGroq || ""
                  : currentAIConfig.apiKeyGemini || "";
      };
    const P = n.querySelector("#mp_gist_pat_input"),
      Q = n.querySelector("#mp_gist_id_input");
    P && (P.value = currentGistConfig.pat || "");
    Q && (Q.value = currentGistConfig.gistId || "");
    const gistInfoIcon = n.querySelector("#mp-gist-info-icon");
    gistInfoIcon &&
      createCustomTooltip(gistInfoIcon, "Sync your full backup to a private GitHub Gist. Create a PAT at github.com/settings/tokens with the 'gist' scope.", "left");
    return (
      S.addEventListener("change", M),
      w && S && ((E.value = currentAIConfig.systemPrompt || ""), M()),
      (n.querySelector("#mp-settings-save").onclick = async () => {
        (await saveThemeConfig(e),
          x && saveSyntaxConfig({ enabled: x.checked }),
          C && savePredictionConfig({ enabled: C.checked }),
          T &&
            _ &&
            savePreviewPromptConfig({ normal: T.checked, expand: _.checked }),
          saveShortcutsConfig());
        const a = n.querySelector("#mp_setting_nav");
        if (a) {
          const e = a.checked;
          (saveNavConfig({ enabled: e }),
            createNavInterface(),
            document.getElementById("mp-nav-container") &&
              (document.getElementById("mp-nav-container").style.display = e
                ? "flex"
                : "none"));
        }
        if (w && S && E) {
          const e = S.value,
            t = getProvider(e),
            n = {
              model: e,
              systemPrompt: E.value,
              keyIndexGemini: currentAIConfig.keyIndexGemini,
              keyIndexLongcat: currentAIConfig.keyIndexLongcat,
              keyIndexGroq: currentAIConfig.keyIndexGroq,
              keyIndexOpenRouter: currentAIConfig.keyIndexOpenRouter,
              keyIndexHuggingFace: currentAIConfig.keyIndexHuggingFace,
            };
          ("openrouter" === t
            ? ((n.apiKeyOpenRouter = w.value.trim()),
              (n.apiKeyLongcat = currentAIConfig.apiKeyLongcat || ""),
              (n.apiKeyGroq = currentAIConfig.apiKeyGroq || ""),
              (n.apiKeyGemini = currentAIConfig.apiKeyGemini || ""),
              (n.apiKeyHuggingFace = currentAIConfig.apiKeyHuggingFace || ""))
            : "longcat" === t
              ? ((n.apiKeyLongcat = w.value.trim()),
                (n.apiKeyOpenRouter = currentAIConfig.apiKeyOpenRouter || ""),
                (n.apiKeyGroq = currentAIConfig.apiKeyGroq || ""),
                (n.apiKeyGemini = currentAIConfig.apiKeyGemini || ""),
                (n.apiKeyHuggingFace = currentAIConfig.apiKeyHuggingFace || ""))
              : "huggingface" === t
                ? ((n.apiKeyHuggingFace = w.value.trim()),
                  (n.apiKeyOpenRouter = currentAIConfig.apiKeyOpenRouter || ""),
                  (n.apiKeyLongcat = currentAIConfig.apiKeyLongcat || ""),
                  (n.apiKeyGroq = currentAIConfig.apiKeyGroq || ""),
                  (n.apiKeyGemini = currentAIConfig.apiKeyGemini || ""))
                : "groq" === t
                  ? ((n.apiKeyGroq = w.value.trim()),
                    (n.apiKeyOpenRouter =
                      currentAIConfig.apiKeyOpenRouter || ""),
                    (n.apiKeyLongcat = currentAIConfig.apiKeyLongcat || ""),
                    (n.apiKeyGemini = currentAIConfig.apiKeyGemini || ""),
                    (n.apiKeyHuggingFace =
                      currentAIConfig.apiKeyHuggingFace || ""))
                  : ((n.apiKeyGemini = w.value.trim()),
                    (n.apiKeyOpenRouter =
                      currentAIConfig.apiKeyOpenRouter || ""),
                    (n.apiKeyLongcat = currentAIConfig.apiKeyLongcat || ""),
                    (n.apiKeyGroq = currentAIConfig.apiKeyGroq || ""),
                    (n.apiKeyHuggingFace =
                      currentAIConfig.apiKeyHuggingFace || "")),
            await saveAIConfig(n));
        }
        if (P && Q) {
          await saveGistConfig({ pat: P.value.trim(), gistId: Q.value.trim() });
        }
        hideModal(t);
      }),
      setupEnhancedScroll(n.querySelector("#mp-settings-scroll-area")),
      (t.resetToCurrent = () => {
        ((e = { ...currentThemeConfig }), s(), d(), u());
        p[0].click();
      }),
      t
    );
  }
  function parsePromptInternal(e) {
    if (!e)
      return {
        processedText: "",
        ignoreMap: new Map(),
        selectMap: new Map(),
        inputMap: new Map(),
        fileMap: new Map(),
      };
    let t = e;
    const n = new Map(),
      a = new Map(),
      o = new Map(),
      r = new Map();
    let s = 0,
      i = 0,
      l = 0,
      c = 0;
    const d = (e) => {
        if (!e) return "";
        let t = e.replace(/^[ \t]*\r?\n/, "");
        return ((t = t.replace(/\r?\n[ \t]*$/, "")), t);
      },
      p = (e) => {
        if ("string" != typeof e) return e;
        let t = e;
        return (
          n.forEach((e, n) => {
            n.startsWith("__ESC_CHAR_") && (t = t.split(n).join(e));
          }),
          t
        );
      };
    ((t = t.replace(
      /([ \t]*)(#+)ignore[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?[ \t]*\2end/g,
      (e, t, a, o) => {
        const r = `__IGNORE_BLK_${s++}__`;
        return (n.set(r, o), r);
      },
    )),
      (t = t.replace(/\\([#\[\]{}:])/g, (e, t) => {
        const a = `__ESC_CHAR_${s++}__`;
        return (n.set(a, t), a);
      })));
    ((t = t.replace(/('{2,})((?:(?!\1)[\s\S])*)\1/g, (e, t, a) => {
      const o = `__QUOTE_${s++}__`;
      return (n.set(o, a), o);
    })),
      (t = t.replace(
        /#(date|time)((?:-[YMDHS]{2})*)(?:\+(date|time)((?:-[YMDHS]{2})*))?/gi,
        (e, t, n, a, o) => {
          const r = new Date(),
            s = String(r.getDate()).padStart(2, "0"),
            i = String(r.getMonth() + 1).padStart(2, "0"),
            l = String(r.getFullYear()).slice(-2),
            c = String(r.getHours()).padStart(2, "0"),
            d = String(r.getMinutes()).padStart(2, "0"),
            p = String(r.getSeconds()).padStart(2, "0");
          function m(e, t) {
            if (!e) return "";
            const n = (t || "").toUpperCase();
            let a = [];
            return "date" === e.toLowerCase()
              ? (n.includes("-DD") || a.push(s),
                n.includes("-MM") || a.push(i),
                n.includes("-YY") || a.push(l),
                a.join("/"))
              : "time" === e.toLowerCase()
                ? (n.includes("-HH") || a.push(c),
                  n.includes("-MM") || a.push(d),
                  n.includes("-SS") || a.push(p),
                  a.join(":"))
                : "";
          }
          let u = m(t, n),
            g = m(a, o);
          return u && g ? `${u} - ${g}` : u || g || e;
        },
      )),
      (t = t.replace(/#file(?:\(([^)]+)\))?/gi, (e, t) => {
        const n = t ? t.trim() : "Add Files";
        let a = null;
        for (const [e, t] of r.entries())
          if (t.title === n) {
            a = e;
            break;
          }
        if (a) return a;
        const o = `__FILE_${c++}__`;
        return (r.set(o, { title: n }), o);
      })));
    return (
      (t = t.replace(
        /([ \t]*)(#+)start[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?[ \t]*\2end/g,
        (e, t, o, r) => {
          const s = `__SELECT_${i++}__`,
            l = [];
          let c = null;
          const m = !r.includes("\n"),
            u =
              /(?:#\s*(?!start|end)(.*?)(?:\(([^)]*)\))?\s*(?=\/\/|\r?\n|$))|(?:([+\-]|\d+)\s*\[([^\]]*)\](?:\(([^)]*)\))?)|(?:(\[#\])(?:\(([^)]*)\))?)|(?:(__QUOTE_\d+__)|'([^'\\]*(?:\\.[^'\\]*)*)')/g;
          let g;
          for (; null !== (g = u.exec(r));)
            if (void 0 !== g[1]) {
              const e = p(g[1].trim()),
                t = g[2] ? p(g[2]) : null;
              e &&
                (l.push({ type: "header", label: e, comment: t }), (c = null));
            } else if (g[3]) {
              const e = g[3];
              let t = p(g[4]),
                n = g[5] ? p(g[5]) : null,
                a = !1;
              const o = t.match(/(.*?)\s*::\s*x\s*$/i);
              o && ((t = o[1]), (a = !0));
              let r = "+" === e ? "multi" : "-" === e ? "sovereign" : "id";
              ((c = {
                label: t,
                value: t,
                type: r,
                id: "id" === r ? e : null,
                isDefault: a,
                comment: n,
              }),
                l.push(c));
            } else if (g[6]) {
              let e = g[7] ? p(g[7]) : null;
              ((c = {
                label: "Other",
                value: "",
                type: "other",
                id: null,
                comment: e,
              }),
                l.push(c));
            } else if (c) {
              let e = null;
              if (g[8]) {
                const t = g[8];
                n.has(t) && (e = d(n.get(t)));
              } else
                void 0 !== g[9] &&
                  ((e = d(g[9])), (e = e.replace(/\\'/g, "'")));
              null !== e &&
                ((c.inputs = []),
                (e = e.replace(/\[([^\]]+?)\]/g, (e, t) => {
                  if (t.startsWith("__") && t.endsWith("__")) return e;
                  let n = t,
                    a = "";
                  const o = t.indexOf("::");
                  -1 !== o &&
                    ((n = t.substring(0, o)), (a = t.substring(o + 2)));
                  const r = `__OPT_INPUT_${c.inputs.length}__`;
                  return (
                    c.inputs.push({
                      key: r,
                      label: p(n.trim()),
                      defaultValue: p(a.trim()),
                    }),
                    r
                  );
                })),
                (c.value = p(e)));
            }
          return (
            a.set(s, {
              title: "Select an option:",
              options: l,
              isInline: m,
              indent: t,
            }),
            s
          );
        },
      )),
      (t = t.replace(
        /\[([^\]=:]+?)\s*=\s*(\$[a-zA-Z0-9_]+)(?:\s*::\s*([^\]]*?))?\](?:\(([^)]*)\))?/g,
        (e, t, n, a, r) => {
          if (t.startsWith("__") && t.endsWith("__")) return e;
          const s = `__INPUT_${l++}__`;
          let i = r || "";
          return (
            o.set(s, {
              label: p(t.trim()),
              varName: n.trim(),
              defaultValue: a ? p(a.trim()) : "",
              context: p(i),
              silent: !1,
            }),
            s
          );
        },
      )),
      (t = t.replace(
        /\{([^}=:]+?)\s*=\s*(\$[a-zA-Z0-9_]+)(?:\s*::\s*([^}]*?))?\}(?:\(([^)]*)\))?/g,
        (e, t, n, a, r) => {
          if (t.startsWith("__") && t.endsWith("__")) return e;
          const s = `__INPUT_${l++}__`;
          let i = r || "";
          return (
            o.set(s, {
              label: p(t.trim()),
              varName: n.trim(),
              defaultValue: a ? p(a.trim()) : "",
              context: p(i),
              silent: !0,
            }),
            s
          );
        },
      )),
      (t = t.replace(/\[([^\]]+?)\](?:\(([^)]*)\))?/g, (e, t, n) => {
        if (t.startsWith("__") && t.endsWith("__")) return e;
        if (o.has(e)) return e;
        let a = t,
          r = "";
        const s = t.indexOf("::");
        -1 !== s && ((a = t.substring(0, s)), (r = t.substring(s + 2)));
        const i = `__INPUT_${l++}__`;
        let c = n || "";
        return (
          o.set(i, {
            label: p(a.trim()),
            varName: null,
            defaultValue: p(r.trim()),
            context: p(c),
            silent: !1,
          }),
          i
        );
      })),
      { processedText: t, ignoreMap: n, selectMap: a, inputMap: o, fileMap: r }
    );
  }
  function createPlaceholderModal() {
    const e = document.createElement("div");
    ((e.className = "mp-overlay mp-hidden"),
      (e.id = "__ap_placeholder_modal_overlay"));
    const t = document.createElement("div");
    ((t.className = "mp-modal-box"), (t.onclick = (e) => e.stopPropagation()));
    const n = ` <button id="__ap_ph_expand_btn" class="mp-modal-expand-btn">${ICONS.expand}</button><button id="__ap_close_placeholder" class="mp-modal-close-btn" aria-label="${"Close"}">${ICONS.close}</button><h2 class="modal-title" id="__ap_placeholder_modal_title">${"Fill in Information"}</h2><div id="__ap_placeholders_container"></div><div class="modal-footer"><button id="__ap_insert_prompt" class="save-button">${"Insert"}</button></div> `;
    (setSafeInnerHTML(t, n), e.appendChild(t));
    const a = t.querySelector("#__ap_placeholders_container");
    ((a.style.maxHeight = "450px"), setupEnhancedScroll(a));
    const o = t.querySelector("#__ap_ph_expand_btn");
    (createCustomTooltip(
      t.querySelector("#__ap_close_placeholder"),
      "Close",
      "bottom",
    ),
      createCustomTooltip(o, "Expand", "bottom"));
    let r = !1;
    return (
      (o.onclick = (e) => {
        (e.stopPropagation(),
          (r = !r),
          t.classList.toggle("mp-expanded", r),
          setSafeInnerHTML(o, r ? ICONS.collapse : ICONS.expand));
        const n = r ? "Collapse" : "Expand";
        (createCustomTooltip(o, n, "bottom"),
          setTimeout(() => {
            a.updateScrollArrows && a.updateScrollArrows();
          }, 350));
      }),
      e
    );
  }
  function createPromptMenu() {
    const e = document.createElement("div");
    return ((e.className = "prompt-menu"), (e.id = "prompt-menu-container"), e);
  }
  function createPromptModal() {
    const e = document.createElement("div");
    ((e.className = "mp-overlay mp-hidden"), (e.id = "__ap_modal_overlay"));
    const t = document.createElement("div");
    ((t.className = "mp-modal-box"),
      (t.id = "__ap_modal_box_el"),
      (t.style.cssText =
        "overflow: hidden; display: flex; flex-direction: column; position: relative;"),
      (t.onclick = (e) => e.stopPropagation()),
      setSafeInnerHTML(
        t,
        ` <button id="__ap_expand_btn" class="mp-modal-expand-btn">${ICONS.expand}</button><button id="__ap_close_prompt" class="mp-modal-close-btn">${ICONS.close}</button> `,
      ));
    const n = document.createElement("div");
    ((n.id = "__ap_inner_content_scroll"),
      (n.style.cssText =
        "height: 100%; width: 100%; display: flex; flex-direction: column;"),
      setSafeInnerHTML(
        n,
        ` <h2 class="modal-title" style="flex-shrink:0; margin-top: 10px;">${"New Prompt"}</h2><div class="form-group" style="flex-shrink:0;"><div class="mp-label-wrapper"><label for="__ap_title" class="form-label" style="margin-bottom:0;">${"Title"}</label><div class="mp-modal-right-controls"><button id="__ap_color_btn_modal" class="mp-link-btn"><span class="icon">${ICONS.color}</span></button></div></div><input id="__ap_title" class="form-input" /></div><div class="form-group" style="height: 400px;"><div class="mp-label-wrapper"><label for="__ap_text" class="form-label" style="margin-bottom:0;">${"Prompt"}</label><div class="mp-modal-right-controls"><button id="__ap_link_btn_modal" class="mp-link-btn"><span class="icon">${ICONS.link}</span></button><button id="__ap_enhance_btn" class="mp-enhance-ai-btn"><span class="icon">${ICONS.magic}</span></button><button id="__ap_paste_btn_modal" class="mp-paste-btn">${ICONS.paste}</button></div></div><textarea id="__ap_text" class="form-textarea" spellcheck="false" style="height:100% !important; resize:none;"></textarea></div><div class="mp-accordions-row"><div class="mp-files-accordion" id="__ap_files_accordion"><div class="mp-accordion-header" id="__ap_files_header"><div style="display:flex;align-items:center;gap:8px;">${ICONS.folder}<span id="__ap_files_label">${"Attachments"}</span></div> ${ICONS.chevron} </div><div class="mp-accordion-content" id="__ap_files_content"><div id="__ap_file_scroll_wrapper" class="mp-file-scroll-wrapper"><div id="__ap_file_grid" class="mp-file-grid"></div></div><input type="file" id="__ap_file_input" multiple style="display:none"></div></div><div class="mp-tags-accordion" id="__ap_tags_accordion"><div class="mp-accordion-header" id="__ap_tags_header"><div style="display:flex;align-items:center;gap:8px;">${ICONS.tag}<span id="__ap_tags_label">${"Tags"}</span></div> ${ICONS.chevron} </div><div class="mp-accordion-content" id="__ap_tags_content"><div id="__ap_tags_scroll_wrapper" class="mp-tags-scroll-wrapper"><div id="__ap_tags_grid" class="mp-tags-grid"></div></div><div class="mp-tags-accordion-footer"><button id="__ap_tags_manage" class="mp-tags-manage-btn">${ICONS.edit}<span>${"Manage Tags"}</span></button></div></div></div></div><div class="mp-switch-container"><div class="mp-switch" style="flex:1;"><input type="checkbox" id="__ap_use_placeholders" /><label for="__ap_use_placeholders">Toggle</label><span class="switch-text" onclick="document.getElementById('__ap_use_placeholders').click()">${"Dynamic Prompt"}</span></div><div class="mp-switch" style="flex:1;"><input type="checkbox" id="__ap_auto_execute" /><label for="__ap_auto_execute">Toggle</label><span class="switch-text" onclick="document.getElementById('__ap_auto_execute').click()">${"Auto Send"}</span></div><span id="shortcutInfo" style="cursor: help !important;" class="mp-help-icon">${ICONS.info}</span><div id="__ap_custom_shortcut_btn" class="mp-shortcut-option mp-prompt-shortcut" data-shortcut="">${"Shortcut"}</div></div><div class="modal-footer" style="flex-shrink:0; margin-top: auto;"><button id="__ap_save" class="save-button">${"Save"}</button></div> `,
      ),
      t.appendChild(n),
      e.appendChild(t));
    const a = t.querySelector("#__ap_files_accordion"),
      o = t.querySelector("#__ap_files_header"),
      r = t.querySelector("#__ap_file_scroll_wrapper"),
      s = t.querySelector("#__ap_file_input"),
      i = t.querySelector("#__ap_file_grid"),
      l = t.querySelector("#__ap_files_label"),
      c = t.querySelector("#__ap_tags_accordion"),
      d = t.querySelector("#__ap_tags_header"),
      p = t.querySelector("#__ap_tags_scroll_wrapper"),
      m = t.querySelector("#__ap_tags_grid"),
      u = t.querySelector("#__ap_tags_label"),
      g = t.querySelector("#__ap_tags_manage"),
      f = t.querySelector("#__ap_enhance_btn"),
      h = t.querySelector("#__ap_text"),
      v = t.querySelector("#__ap_paste_btn_modal"),
      y = t.querySelector("#__ap_link_btn_modal"),
      b = t.querySelector("#__ap_color_btn_modal"),
      x = t.querySelector("#__ap_title"),
      C = t.querySelector("#__ap_custom_shortcut_btn");
    (new MutationObserver(async () => {
      if (!e.classList.contains("mp-hidden")) {
        const t = e.dataset.promptId;
        if (t) {
          const e = (await getAll()).find((e) => e.id === t);
          (e && e.color
            ? (x.style.setProperty("color", e.color, "important"),
              (x.dataset.promptColor = e.color))
            : (x.style.removeProperty("color"), (x.dataset.promptColor = "")),
            e && e.shortcut
              ? ((C.dataset.shortcut = e.shortcut),
                (C.textContent = e.shortcut))
              : ((C.dataset.shortcut = ""),
                (C.textContent = "Shortcut")));
        } else
          (x.style.removeProperty("color"),
            (x.dataset.promptColor = ""),
            (C.dataset.shortcut = ""),
            (C.textContent = "Shortcut"));
      }
    }).observe(e, {
      attributes: !0,
      attributeFilter: ["data-prompt-id", "class"],
    }),
      createCustomTooltip(b, "Customize Color", "top"),
      b.addEventListener("click", async (e) => {
        (e.preventDefault(), e.stopPropagation());
        const t = await createDialogo({
          title: "Title Color",
          message: "Choose what you want to do with the title color of this prompt.",
          actions: [
            {
              label: "Change Color",
              value: "change",
              style: "primary",
            },
            {
              label: "Remove Color",
              value: "remove",
              style: "danger",
            },
            {
              label: "Cancel",
              value: "cancel",
              style: "secondary",
            },
          ],
        });
        if ("change" === t) {
          const e = document.createElement("input");
          ((e.type = "color"),
            (e.value = x.dataset.promptColor || "#cccccc"),
            (e.style.position = "absolute"),
            (e.style.opacity = "0"),
            (e.style.width = "1px"),
            (e.style.height = "1px"),
            document.body.appendChild(e),
            e.addEventListener("input", (e) => {
              const t = e.target.value;
              (x.style.setProperty("color", t, "important"),
                (x.dataset.promptColor = t));
            }),
            e.addEventListener("change", () => {
              e.parentNode && e.remove();
            }),
            setTimeout(() => {
              e.click();
            }, 10));
        } else
          "remove" === t &&
            (x.style.removeProperty("color"), (x.dataset.promptColor = ""));
      }),
      C &&
        C.addEventListener("click", (e) => {
          e.stopPropagation();
          C.textContent;
          ((C.textContent = "Press a key..."),
            C.classList.add("recording"));
          const t = (e) => {
              if (
                (e.preventDefault(),
                e.stopPropagation(),
                "Backspace" === e.key || "Delete" === e.key)
              )
                return (
                  (C.dataset.shortcut = ""),
                  (C.textContent = "Shortcut"),
                  void n()
                );
              if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
              const t = [];
              (e.ctrlKey && t.push("Ctrl"),
                e.altKey && t.push("Alt"),
                e.shiftKey && t.push("Shift"));
              let a = e.key.toUpperCase();
              ("Space" === e.code && (a = "Space"),
                " " === a && (a = "Space"),
                t.push(a));
              const o = t.join("+");
              ((C.dataset.shortcut = o), (C.textContent = o), n());
            },
            n = () => {
              (document.removeEventListener("keydown", t, !0),
                document.removeEventListener("mousedown", a, !0),
                C.classList.remove("recording"));
            },
            a = (e) => {
              e.target !== C &&
                (n(),
                (C.textContent =
                  C.dataset.shortcut || "Shortcut"));
            };
          (document.addEventListener("keydown", t, !0),
            document.addEventListener("mousedown", a, !0));
        }));
    const T = t.querySelector("#shortcutInfo");
    (T && createCustomTooltip(T, "Backspace/Delete to clear the Shortcut", "left"),
      createCustomTooltip(y, "External Prompt", "top"),
      y.addEventListener("click", (e) => {
        (e.preventDefault(),
          e.stopPropagation(),
          openSharedPromptManager(currentModal.dataset.promptId));
      }),
      o.addEventListener("click", (e) => {
        (e.stopPropagation(),
          a.classList.toggle("open"),
          a.classList.contains("open") &&
            r.updateScrollArrows &&
            setTimeout(() => r.updateScrollArrows(), 50));
      }),
      createCustomTooltip(o, "Files attached here are automatically uploaded into the AI input box when this prompt is inserted.", "bottom"),
      d.addEventListener("click", (e) => {
        (e.stopPropagation(),
          c.classList.toggle("open"),
          c.classList.contains("open") &&
            p.updateScrollArrows &&
            setTimeout(() => p.updateScrollArrows(), 50));
      }),
      g.addEventListener("click", (e) => {
        (e.stopPropagation(), openTagsManager());
      }),
      (t.renderTagsSelector = () => {
        const e = getAllTags(),
          n = currentPromptTags.size,
          a = e.length;
        if (
          ((u.textContent =
            0 === a
              ? "Tags"
              : "Tags ({active}/{total})"
                  .replace("{active}", n)
                  .replace("{total}", a)),
          setSafeInnerHTML(m, ""),
          0 === e.length)
        ) {
          (p.classList.add("empty-state"), m.classList.add("empty-state"));
          const e = document.createElement("div");
          ((e.className = "mp-tags-empty-icon"),
            setSafeInnerHTML(e, ICONS.tag));
          const t = document.createElement("div");
          return (
            (t.className = "mp-tags-empty-text"),
            (t.textContent = "Create new Tags"),
            m.appendChild(e),
            m.appendChild(t),
            void (p.onclick = (e) => {
              (e.stopPropagation(), openTagsManager());
            })
          );
        }
        (p.classList.remove("empty-state"),
          m.classList.remove("empty-state"),
          (p.onclick = null),
          e.forEach((e) => {
            const n = e.name.toLowerCase(),
              a = currentPromptTags.has(n),
              o = document.createElement("div");
            if (
              ((o.className = "mp-tag-select-item " + (a ? "active" : "")), a)
            ) {
              const t = getTagStyle(e);
              ((o.style.backgroundColor = t.backgroundColor),
                (o.style.color = t.color));
            } else ((o.style.backgroundColor = ""), (o.style.color = ""));
            ((o.textContent = e.name),
              e.comment && createCustomTooltip(o, e.comment, "bottom"),
              o.addEventListener("click", (e) => {
                (e.stopPropagation(),
                  currentPromptTags.has(n)
                    ? currentPromptTags.delete(n)
                    : currentPromptTags.add(n),
                  t.renderTagsSelector());
              }),
              m.appendChild(o));
          }));
      }),
      h.addEventListener("keydown", (e) => {
        isShortcutPressed(e, "enhancePrompt") &&
          (e.preventDefault(), e.stopPropagation(), f.click());
      }),
      createCustomTooltip(f, "Enhance Prompt", "top"),
      (f.onclick = () => {
        const e = h.value.trim();
        if (!e)
          return void showNotification(
            "Enter your prompt before trying to enhance it",
            "error",
          );
        triggerAIEnhancement(
          e,
          {
            get value() {
              return h.value;
            },
            set value(e) {
              ((h.value = e),
                h.dispatchEvent(
                  new Event("input", { bubbles: !0, composed: !0 }),
                ),
                h.dispatchEvent(new Event("change", { bubbles: !0 })),
                h.focus());
            },
            syntaxClear: () => {
              h.syntaxClear && h.syntaxClear();
            },
            syntaxUpdate: () => {
              h.syntaxUpdate && h.syntaxUpdate();
            },
          },
          f,
        );
      }),
      createCustomTooltip(v, "Paste", "top"),
      v.addEventListener("click", async (e) => {
        (e.preventDefault(), e.stopPropagation());
        try {
          const e = await navigator.clipboard.readText();
          if (e) {
            const t = h.selectionStart,
              n = h.selectionEnd,
              a = h.value;
            ((h.value = a.substring(0, t) + e + a.substring(n)),
              (h.selectionStart = h.selectionEnd = t + e.length),
              h.dispatchEvent(new Event("input", { bubbles: !0 })),
              h.focus());
          }
        } catch (e) {}
      }));
    const w = t.querySelector("#__ap_close_prompt");
    async function S(e) {
      for (const n of e) {
        if (n.size > 5242880) {
          const e = (n.size / 1024 / 1024).toFixed(1);
          if (
            !1 ===
            (await createDialogo({
              message: "Large file ({fileSizeMB}MB). Continue anyway?".replace(
                "{fileSizeMB}",
                e,
              ),
              type: "confirm",
              dontShowAgainId: "confirm-large-file",
            }))
          )
            continue;
        }
        const e = new FileReader();
        ((e.onload = async (e) => {
          const o = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            name: n.name,
            type: n.type,
            size: n.size,
            data: e.target.result,
          };
          (await saveGlobalFile(o),
            currentActiveFileIds.add(o.id),
            t.renderGlobalFiles &&
              (a.classList.contains("open") || a.classList.add("open"),
              t.renderGlobalFiles()));
        }),
          e.readAsDataURL(n));
      }
    }
    (createCustomTooltip(w, "Close", "bottom"),
      (w.onclick = () => {
        (SyntaxHighlighter.detach(),
          e.classList.add("mp-hidden"),
          setTimeout(() => e.remove(), 200));
      }),
      h.addEventListener("input", function () {
        setTimeout(() => {
          if (this.selectionEnd === this.value.length) {
            this.scrollTop = this.scrollHeight;
            const e = this.closest(".prompt-editor-scroll-wrapper");
            e && (e.scrollTop = e.scrollHeight);
          }
        }, 10);
      }),
      attachSmartEditorLogic(h),
      setTimeout(() => {
        const e = setupEnhancedScroll(h, null, "var(--mp-border-radius-md)");
        (e && e.classList.add("prompt-editor-scroll-wrapper"),
          setTimeout(() => SyntaxHighlighter.attach(h), 10),
          setupEnhancedScroll(r, null, "0"),
          setupEnhancedScroll(p, null, "0"));
        const t = setupEnhancedScroll(n);
        t &&
          ((t.style.height = "100%"),
          (t.style.width = "100%"),
          (t.style.borderRadius = "inherit"));
      }, 0),
      (t.renderGlobalFiles = async () => {
        const e = await getGlobalFiles();
        setSafeInnerHTML(i, "");
        let n = 0;
        if (
          (e.forEach((e) => {
            currentActiveFileIds.has(e.id) && n++;
          }),
          (l.textContent = "Files ({active}/{total})"
            .replace("{active}", n)
            .replace("{total}", e.length)),
          0 === e.length)
        ) {
          (r.classList.add("empty-state"), i.classList.add("empty-state"));
          const e = document.createElement("div");
          ((e.className = "mp-file-empty-icon"),
            setSafeInnerHTML(e, `${ICONS.cloudFile}`));
          const t = document.createElement("div");
          ((t.className = "mp-file-empty-text"),
            (t.textContent = "Add Files"));
          const n = document.createElement("div");
          return (
            (n.className = "mp-file-empty-subtext"),
            (n.textContent = "click to select or drag to add"),
            i.appendChild(e),
            i.appendChild(t),
            i.appendChild(n),
            void (r.onclick = (e) => {
              (e.stopPropagation(), s.click());
            })
          );
        }
        (r.classList.remove("empty-state"),
          i.classList.remove("empty-state"),
          (r.onclick = null));
        const a = document.createElement("div");
        ((a.className = "mp-add-file-card"),
          createCustomTooltip(a, "Add Files", "bottom"),
          setSafeInnerHTML(a, `${ICONS.plus}`),
          a.addEventListener("click", (e) => {
            (e.stopPropagation(), s.click());
          }),
          i.appendChild(a),
          e.forEach((e) => {
            const n = currentActiveFileIds.has(e.id),
              a = document.createElement("div");
            ((a.className = "mp-file-card " + (n ? "active" : "inactive")),
              createCustomTooltip(a, e.name, "bottom"),
              a.addEventListener("click", (n) => {
                (n.stopPropagation(),
                  currentActiveFileIds.has(e.id)
                    ? currentActiveFileIds.delete(e.id)
                    : currentActiveFileIds.add(e.id),
                  t.renderGlobalFiles());
              }));
            const o = document.createElement("div");
            ((o.className = "mp-file-delete-perm"),
              setSafeInnerHTML(o, `${ICONS.close}`),
              o.addEventListener("click", async (n) => {
                n.stopPropagation();
                (await createDialogo({
                  message: "Delete file from memory?",
                  type: "confirm",
                })) &&
                  (await deleteGlobalFile(e.id),
                  currentActiveFileIds.delete(e.id),
                  t.renderGlobalFiles(),
                  "function" == typeof showNotification &&
                    showNotification("Deleted Successfully!"));
              }));
            let r = "";
            ((r = e.type.startsWith("image/")
              ? `<img src="${e.data}" class="mp-file-thumb">`
              : `${ICONS.file}`),
              setSafeInnerHTML(a, r),
              a.appendChild(o),
              i.appendChild(a));
          }),
          r.updateScrollArrows && setTimeout(() => r.updateScrollArrows(), 50));
      }),
      r.addEventListener("dragover", (e) => {
        (e.preventDefault(), e.stopPropagation());
      }),
      r.addEventListener("drop", async (e) => {
        (e.preventDefault(), e.stopPropagation(), S(e.dataTransfer.files));
      }),
      s.addEventListener("change", (e) => {
        (S(e.target.files), (s.value = ""));
      }));
    const E = t.querySelector("#__ap_expand_btn");
    let M = !1;
    return (
      createCustomTooltip(E, "Expand", "bottom"),
      (E.onclick = (e) => {
        (e.stopPropagation(),
          (M = !M),
          M
            ? (t.classList.add("mp-expanded"),
              setSafeInnerHTML(E, `${ICONS.collapse}`),
              createCustomTooltip(E, "Collapse", "bottom"))
            : (t.classList.remove("mp-expanded"),
              setSafeInnerHTML(E, `${ICONS.expand}`),
              createCustomTooltip(E, "Expand", "bottom")),
          setTimeout(() => {
            h.updateScrollArrows && h.updateScrollArrows();
          }, 350));
      }),
      (t.loadPromptTags = (e) => {
        ((currentPromptTags = new Set(e || [])), t.renderTagsSelector());
      }),
      (t.getCurrentTags = () => Array.from(currentPromptTags)),
      e
    );
  }
  function diffLines(e, t) {
    const n = (e || "").split("\n"),
      a = (t || "").split("\n"),
      o = Array(n.length + 1)
        .fill(null)
        .map(() => Array(a.length + 1).fill(0));
    for (let e = 1; e <= n.length; e++)
      for (let t = 1; t <= a.length; t++)
        n[e - 1] === a[t - 1]
          ? (o[e][t] = o[e - 1][t - 1] + 1)
          : (o[e][t] = Math.max(o[e - 1][t], o[e][t - 1]));
    let r = n.length,
      s = a.length;
    const i = [];
    for (; r > 0 || s > 0;)
      r > 0 && s > 0 && n[r - 1] === a[s - 1]
        ? (i.unshift({ type: "unchanged", text: n[r - 1] }), r--, s--)
        : s > 0 && (0 === r || o[r][s - 1] >= o[r - 1][s])
          ? (i.unshift({ type: "added", text: a[s - 1] }), s--)
          : (i.unshift({ type: "removed", text: n[r - 1] }), r--);
    return i;
  }
  function getSideBySideDiff(e, t) {
    const n = diffLines(e, t),
      a = [],
      o = [],
      r = (e) =>
        e
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
    let s = 0;
    for (; s < n.length;)
      if ("unchanged" === n[s].type) {
        const e = r(n[s].text);
        (a.push(`<div class="mp-diff-line-unchanged">${e || "&nbsp;"}</div>`),
          o.push(`<div class="mp-diff-line-unchanged">${e || "&nbsp;"}</div>`),
          s++);
      } else {
        const e = [],
          t = [];
        for (; s < n.length && "unchanged" !== n[s].type;)
          ("removed" === n[s].type && e.push(n[s].text),
            "added" === n[s].type && t.push(n[s].text),
            s++);
        const i = Math.max(e.length, t.length);
        for (let n = 0; n < i; n++) {
          const s = e[n],
            i = t[n];
          (void 0 !== s
            ? a.push(
                `<div class="mp-diff-line-removed">${r(s) || "&nbsp;"}</div>`,
              )
            : a.push('<div class="mp-diff-line-empty">&nbsp;</div>'),
            void 0 !== i
              ? o.push(
                  `<div class="mp-diff-line-added">${r(i) || "&nbsp;"}</div>`,
                )
              : o.push('<div class="mp-diff-line-empty">&nbsp;</div>'));
        }
      }
    return { left: a.join(""), right: o.join("") };
  }
  function syncScroll(e, t) {
    if (!e || !t) return;
    let n = !1;
    ((e.onscroll = () => {
      n ||
        ((n = !0),
        (t.scrollTop = e.scrollTop),
        (t.scrollLeft = e.scrollLeft),
        (n = !1));
    }),
      (t.onscroll = () => {
        n ||
          ((n = !0),
          (e.scrollTop = t.scrollTop),
          (e.scrollLeft = t.scrollLeft),
          (n = !1));
      }));
  }
  function isValidWhiteListUrl(e, t) {
    try {
      const n = new URL(e);
      return (
        !![
          "raw.githubusercontent.com",
          "gist.githubusercontent.com",
          "cdn.jsdelivr.net",
          "gitlab.com",
        ].includes(n.hostname) && !(t && !n.pathname.endsWith(t))
      );
    } catch (e) {
      return !1;
    }
  }
  function compareVersions(e, t) {
    const n = (e || "0").split(".").map(Number),
      a = (t || "0").split(".").map(Number);
    for (let e = 0; e < Math.max(n.length, a.length); e++) {
      const t = n[e] || 0,
        o = a[e] || 0;
      if (t > o) return 1;
      if (t < o) return -1;
    }
    return 0;
  }
  function escapeHtmlText(e) {
    return e
      ? e
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
      : "";
  }
  function fetchImageBlob(e) {
    return new Promise((t, n) => {
      let a = e;
      try {
        const t = new URL(e);
        (t.searchParams.set("_t", Date.now()), (a = t.toString()));
      } catch (e) {}
      GM_xmlhttpRequest({
        method: "GET",
        url: a,
        responseType: "blob",
        nocache: !0,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        onload: (e) => {
          e.status >= 200 && e.status < 300 && e.response
            ? t(e.response)
            : n(new Error(""));
        },
        onerror: () => n(new Error("")),
      });
    });
  }
  async function simpleMarkdownToHtml(e) {
    if (!e) return "";
    e = escapeHtmlText(e);
    const t = [];
    e = e.replace(/```([\s\S]*?)```/gim, (e, n) => {
      let a = n.replace(/^[a-z0-9_-]*\n/i, "");
      return (
        t.push(`<pre class="mp-shared-block-code"><code>${a}</code></pre>`),
        `__CB${t.length - 1}__`
      );
    });
    const n = [];
    e = e.replace(
      /`([^`\n]+)`/g,
      (e, t) => (
        n.push(`<code class="mp-shared-inline-code">${t}</code>`),
        `__IC${n.length - 1}__`
      ),
    );
    const a = /!\[([^\]]*)\]\(([^)]+)\)/gim,
      o = [];
    let r;
    for (; null !== (r = a.exec(e));)
      o.push({ full: r[0], alt: r[1], url: r[2] });
    for (const t of o) {
      const n = t.url.replace(/&amp;/g, "&");
      if (isValidWhiteListUrl(n))
        try {
          const a = await fetchImageBlob(n),
            o =
              `<div class="mp-shared-img-container" style="display: flex; flex-direction: row; justify-content: center; align-items: center; width: 100%; clear: both; margin: 16px 0;"><img src="${URL.createObjectURL(a)}" alt="${escapeHtmlText(t.alt)}" style="max-width: 100%; max-height: 250px; object-fit: contain; border-radius: var(--mp-border-radius-sm); display: block; margin: 0 auto;" /></div>\n                    `.trim();
          e = e.split(t.full).join(o);
        } catch (n) {
          e = e
            .split(t.full)
            .join(
              `<div style="display: flex; justify-content: center; width: 100%; margin: 8px 0;"><span style="color: var(--mp-text-secondary);">[${"Image Unavailable: "}${escapeHtmlText(t.alt)}]</span></div>`,
            );
        }
      else
        e = e
          .split(t.full)
          .join(
            `<div style="display: flex; justify-content: center; width: 100%; margin: 8px 0;"><span style="color: red;">[${"Image Blocked: "}${escapeHtmlText(n)}]</span></div>`,
          );
    }
    const s = e.split(/\r?\n/);
    let i = !1;
    for (let e = 0; e < s.length; e++) {
      let t = s[e].trim();
      if ("---" !== t)
        if (t.startsWith("# ")) s[e] = `<h1>${t.substring(2)}</h1>`;
        else if (t.startsWith("## ")) s[e] = `<h2>${t.substring(3)}</h2>`;
        else if (t.startsWith("### ")) s[e] = `<h3>${t.substring(4)}</h3>`;
        else if (t.startsWith("#### ")) s[e] = `<h4>${t.substring(5)}</h4>`;
        else if (t.startsWith("##### ")) s[e] = `<h5>${t.substring(6)}</h5>`;
        else if (t.startsWith("###### ")) s[e] = `<h6>${t.substring(7)}</h6>`;
        else if (t.startsWith("- ") || t.startsWith("* ")) {
          let n = t.substring(2);
          i
            ? (s[e] = `<li>${n}</li>`)
            : ((s[e] = `<ul><li>${n}</li>`), (i = !0));
        } else i && ((s[e - 1] = s[e - 1] + "</ul>"), (i = !1));
      else
        s[e] =
          '<hr class="mp-shared-hr" style="border: 0; height: 1px; background: var(--mp-border-primary); margin: 16px 0;" />';
    }
    return (
      i && (s[s.length - 1] = s[s.length - 1] + "</ul>"),
      (e = (e = (e = (e = (e = (e = (e = s.join("\n")).replace(
        /\*\*(.*?)\*\*/gim,
        "<b>$1</b>",
      )).replace(
        /\*(.*?)\*/gim,
        '<em style="font-style: italic !important;">$1</em>',
      )).replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" target="_blank" style="color:var(--mp-accent-primary); text-decoration:underline;">$1</a>',
      )).replace(/\n/g, (e, t, n) => "<br>")).replace(
        /<br><(h[1-6]|hr|ul|ol|pre|div)/gim,
        "<$1",
      )).replace(/<\/(h[1-6]|hr|ul|ol|pre|div)><br>/gim, "</$1>")),
      n.forEach((t, n) => {
        e = e.split(`__IC${n}__`).join(t);
      }),
      t.forEach((t, n) => {
        e = (e = (e = e.split(`<br>__CB${n}__`).join(t))
          .split(`__CB${n}__<br>`)
          .join(t))
          .split(`__CB${n}__`)
          .join(t);
      }),
      e
    );
  }
  function fetchWithGM(e) {
    return new Promise((t, n) => {
      let a = e;
      try {
        const t = new URL(e);
        (t.searchParams.set("_t", Date.now()), (a = t.toString()));
      } catch (e) {}
      GM_xmlhttpRequest({
        method: "GET",
        url: a,
        nocache: !0,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        onload: (e) => {
          e.status >= 200 && e.status < 300
            ? t(e.responseText)
            : n(new Error(`${"Failed to fetch metadata: "}${e.status}`));
        },
        onerror: () => {
          n(new Error("Failed to fetch metadata: "));
        },
      });
    });
  }
  function sanitizeJSONString(e) {
    let t = e.replace(
      /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
      (e, t) => (t ? "" : e),
    );
    return ((t = t.replace(/,\s*([\]}])/g, "$1")), t);
  }
  async function fetchSharedPromptData(e) {
    let t;
    try {
      const n = await fetchWithGM(e);
      try {
        t = JSON.parse(sanitizeJSONString(n));
      } catch (e) {
        t = JSON.parse(n);
      }
    } catch (e) {
      throw new Error("Invalid JSON. title, version, and prompt are required.");
    }
    if (!t.title || !t.version || !t.prompt)
      throw new Error("Invalid JSON. title, version, and prompt are required.");
    t.title = escapeHtmlText(t.title.replace(/\n/g, "").substring(0, 50));
    const n = escapeHtmlText(
        (t.summary || "").replace(/\n/g, "").substring(0, 200),
      ),
      a = escapeHtmlText(t.author || "");
    if (
      !isValidWhiteListUrl(t.prompt, ".txt") &&
      !isValidWhiteListUrl(t.prompt, ".md")
    )
      throw new Error("Prompt URL must be .txt or .md from approved sources.");
    const o = await fetchWithGM(t.prompt).catch((e) => {
      throw new Error(`${"Failed to fetch prompt: "}${e.message}`);
    });
    let r = "";
    if (
      t.changelog &&
      (isValidWhiteListUrl(t.changelog, ".txt") ||
        isValidWhiteListUrl(t.changelog, ".md"))
    )
      try {
        r = await fetchWithGM(t.changelog);
      } catch (e) {}
    return {
      title: t.title,
      version: t.version,
      author: a,
      summary: n,
      promptText: o,
      changelogText: r,
      usePlaceholders: !0 === t.usePlaceholders,
      autoExecute: !0 === t.autoExecute,
    };
  }
  function showSharedPromptConfirmModal(e, t, n, a = null) {
    return new Promise((o) => {
      const r = document.createElement("div");
      ((r.className = "mp-overlay mp-diff-modal-overlay"),
        (r.id = "__ap_shared_update_overlay"));
      const s = document.createElement("div");
      s.className = "mp-modal-box";
      const i = !e || "0.0.0" === e.version,
        l = a || "Update Available";
      let c = "";
      c = i
        ? `<span class="mp-shared-version-highlight">${t.version}</span>`
        : `${e.version} &rarr; <span class="mp-shared-version-highlight">${t.version}</span>`;
      let d = "";
      if (i)
        d = ` <div class="mp-diff-column mp-diff-column-full"><div class="mp-diff-label">${"Prompt"}</div><div class="mp-diff-view">${t.promptText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div></div> `;
      else {
        const n = getSideBySideDiff(e.text, t.promptText);
        d = ` <div class="mp-diff-column"><div class="mp-diff-label">${"Current Version"}</div><div id="__ap_shared_diff_original" class="mp-diff-view">${n.left}</div></div><div class="mp-diff-column"><div class="mp-diff-label">${"New Version"}</div><div id="__ap_shared_diff_new" class="mp-diff-view">${n.right}</div></div> `;
      }
      (setSafeInnerHTML(
        s,
        ` <button id="__ap_diff_close" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${l}</h2><div class="mp-shared-info"><div class="mp-shared-info-header"><div class="mp-shared-info-list"><div><strong class="mp-shared-info-label">${"Title"}:</strong> ${t.title}</div><div><strong class="mp-shared-info-label">${"Version"}:</strong> ${c}</div><div><strong class="mp-shared-info-label">${"Author"}:</strong> ${t.author || "N/A"}</div> ${t.summary ? `<div><strong class="mp-shared-info-label">${"Summary"}:</strong> ${t.summary}</div>` : ""} </div> ${n ? `<button id="__ap_toggle_changelog" class="save-button mp-shared-btn-secondary">${"README"}</button>` : ""} </div></div><div class="mp-diff-container"> ${d} </div><div class="mp-diff-actions"><button id="__ap_diff_cancel" class="save-button mp-shared-btn-cancel">${"Cancel"}</button><button id="__ap_diff_accept" class="save-button">${i ? "Import Prompt" : "Update Now"}</button></div> `,
      ),
        r.appendChild(s),
        document.body.appendChild(r),
        i ||
          syncScroll(
            s.querySelector("#__ap_shared_diff_original"),
            s.querySelector("#__ap_shared_diff_new"),
          ),
        n &&
          (s.querySelector("#__ap_toggle_changelog").onclick = () => {
            const e = document.createElement("div");
            e.className = "mp-overlay mp-hidden mp-shared-cl-overlay";
            const a = document.createElement("div");
            ((a.className = "mp-modal-box mp-shared-cl-box"),
              setSafeInnerHTML(
                a,
                ` <button id="__ap_close_cl_update" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title mp-shared-cl-title">${t.title}</h2><div class="mp-shared-changelog-content mp-shared-cl-body"> ${n} </div> `,
              ),
              e.appendChild(a),
              document.body.appendChild(e));
            ((a.querySelector("#__ap_close_cl_update").onclick = (t) => {
              (t.stopPropagation(),
                e.classList.remove("visible"),
                setTimeout(() => e.remove(), 200));
            }),
              requestAnimationFrame(() => {
                (e.classList.remove("mp-hidden"), e.classList.add("visible"));
              }));
          }));
      const p = (e) => {
        (r.classList.remove("visible"),
          setTimeout(() => {
            (r.remove(), o(e));
          }, 200));
      };
      ((s.querySelector("#__ap_diff_close").onclick = () => p(!1)),
        (s.querySelector("#__ap_diff_cancel").onclick = () => p(!1)),
        (s.querySelector("#__ap_diff_accept").onclick = () => p(!0)),
        requestAnimationFrame(() => r.classList.add("visible")));
    });
  }
  async function openSharedPromptManager(e) {
    let t = (await getAll()).find((t) => t.id === e),
      n = t?.sharedUrl || "",
      a = void 0 !== t?.updateInterval ? t.updateInterval : 7;
    const o = ` <div class="mp-shared-intervals"><label class="mp-shared-interval-label"><input type="checkbox" class="mp-checkbox mp-interval-cb" value="1"> 1 ${"day"} </label><label class="mp-shared-interval-label"><input type="checkbox" class="mp-checkbox mp-interval-cb" value="3"> 3 ${"days"} </label><label class="mp-shared-interval-label"><input type="checkbox" class="mp-checkbox mp-interval-cb" value="7"> 7 ${"days"} </label><label class="mp-shared-interval-label"><input type="checkbox" class="mp-checkbox mp-interval-cb" value="30"> 30 ${"days"} </label><label class="mp-shared-interval-label"><input type="checkbox" class="mp-checkbox mp-interval-cb" value="0"> ${"Never Update"} </label></div> `;
    let r = "";
    t?.isShared &&
      (r = ` <div class="mp-shared-info mp-shared-info-manager"><div class="mp-shared-info-header align-center"><strong class="mp-shared-info-label">${t.title}</strong><span class="mp-shared-version-badge">v${t.version}</span></div><div class="mp-shared-info-subtext"><strong class="mp-shared-info-label">${"Author"}:</strong> ${t.author || "N/A"}<br><strong class="mp-shared-info-label">${"Summary"}:</strong> ${t.summary || "N/A"} </div><div class="mp-shared-info-actions"><button id="__ap_shared_update_now" class="save-button flex-1">${"Update Now"}</button> ${t.changelogText ? `<button id="__ap_shared_view_changelog" class="save-button mp-shared-btn-secondary flex-1">${"README"}</button>` : ""} </div></div> `);
    const s = document.createElement("div");
    ((s.className = "mp-overlay mp-hidden"), (s.id = "__ap_shared_overlay"));
    const i = document.createElement("div");
    ((i.className = "mp-modal-box"),
      setSafeInnerHTML(
        i,
        ` <button id="__ap_shared_close" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${"External Prompt"}</h2><div class="form-group mp-shared-form-group"><label class="form-label" style="display: flex; justify-content: space-between; align-items: center;"> ${"JSON Metadata URL"} <span id="mp-pe" class="mp-help-icon">${ICONS.info}</span></label><input id="__ap_shared_url" class="form-input" type="text" value="${n}" placeholder="https://raw.githubusercontent.com/&#42;/&#42;/main/&#42;/meta.json"></div><div class="form-group"><label class="form-label">${"Update Frequency"}</label> ${o} </div> ${r} <div class="modal-footer mp-shared-modal-footer"><button id="__ap_shared_apply" class="save-button">${"Apply"}</button></div> `,
      ),
      s.appendChild(i),
      document.body.appendChild(s));
    const l = () => {
      (s.classList.remove("visible"), setTimeout(() => s.remove(), 200));
    };
    i.querySelector("#__ap_shared_close").onclick = l;
    const c = i.querySelectorAll(".mp-interval-cb");
    c.forEach((e) => {
      (parseInt(e.value, 10) === a && (e.checked = !0),
        e.addEventListener("change", (e) => {
          e.target.checked
            ? c.forEach((t) => {
                t !== e.target && (t.checked = !1);
              })
            : (e.target.checked = !0);
        }));
    });
    const d = i.querySelector("#mp-pe");
    d &&
      createCustomTooltip(
        d,
        {
          layout: "column",
          actions: [
            {
              label: "Basic Guide",
              action: () => {
                window.open(
                  "https://github.com/0H4S/My-Prompt/blob/main/Guides/Shared%20External%20Prompt.md",
                  "_blank",
                );
              },
            },
          ],
        },
        "right",
      );
    const p = i.querySelector("#__ap_shared_apply");
    p.onclick = async () => {
      const e = i.querySelector("#__ap_shared_url").value.trim(),
        n = i.querySelector(".mp-interval-cb:checked"),
        a = n ? parseInt(n.value, 10) : 7;
      if (e)
        if (isValidWhiteListUrl(e, ".json"))
          try {
            ((p.disabled = !0), setSafeInnerHTML(p, ICONS.loading));
            const n = await fetchSharedPromptData(e),
              o = n.changelogText
                ? await simpleMarkdownToHtml(n.changelogText)
                : null,
              r = t && t.isShared,
              s = r ? t : t || { version: "0.0.0", text: "" };
            if (
              !(await showSharedPromptConfirmModal(
                s,
                n,
                o,
                r ? null : "Confirm Import",
              ))
            )
              return (
                (p.disabled = !1),
                void (p.textContent = "Apply")
              );
            if (t && t.isShared)
              (await updateById(t.id, {
                sharedUrl: e,
                updateInterval: a,
                title: n.title,
                text: n.promptText,
                usePlaceholders: n.usePlaceholders,
                autoExecute: n.autoExecute,
                version: n.version,
                author: n.author,
                summary: n.summary,
                changelogText: n.changelogText,
                lastUpdateCheck: Date.now(),
              }),
                showNotification("Prompt updated successfully!", "success"));
            else {
              if (t)
                await updateById(t.id, {
                  isShared: !0,
                  sharedUrl: e,
                  updateInterval: a,
                  title: n.title,
                  text: n.promptText,
                  usePlaceholders: n.usePlaceholders,
                  autoExecute: n.autoExecute,
                  version: n.version,
                  author: n.author,
                  summary: n.summary,
                  changelogText: n.changelogText,
                  lastUpdateCheck: Date.now(),
                });
              else {
                const o = await addItem({
                  title: n.title,
                  text: n.promptText,
                  usePlaceholders: n.usePlaceholders,
                  autoExecute: n.autoExecute,
                  isShared: !0,
                  sharedUrl: e,
                  updateInterval: a,
                  version: n.version,
                  author: n.author,
                  summary: n.summary,
                  changelogText: n.changelogText,
                  lastUpdateCheck: Date.now(),
                });
                ((t = o),
                  currentModal && (currentModal.dataset.promptId = o.id));
              }
              showNotification("Prompt imported and linked!", "success");
            }
            if ((l(), currentModal && currentModal.dataset.promptId)) {
              const e = (await getAll()).find(
                (e) => e.id === currentModal.dataset.promptId,
              );
              e && openPromptModal(e);
            }
          } catch (e) {
            (createDialogo({
              message: e.message,
              type: "alert",
              title: "Error",
            }),
              (p.disabled = !1),
              (p.textContent = "Apply"));
          }
        else
          createDialogo({
            message: "Invalid URL. Only Gist, GitHub, GitLab, or JSDelivr in .json format are accepted.",
            type: "alert",
            title: "Error",
          });
      else
        t?.isShared
          ? (await updateById(t.id, {
              isShared: !1,
              sharedUrl: "",
              updateInterval: 7,
            }),
            showNotification("Share link removed.", "success"),
            l(),
            currentModal &&
              currentModal.dataset.promptId === t.id &&
              openPromptModal(
                await getAll().then((e) => e.find((e) => e.id === t.id)),
              ))
          : l();
    };
    const m = i.querySelector("#__ap_shared_update_now");
    m &&
      (m.onclick = async () => {
        ((m.disabled = !0), setSafeInnerHTML(m, ICONS.loading));
        try {
          const e = await fetchSharedPromptData(t.sharedUrl);
          if (compareVersions(e.version, t.version) > 0) {
            const n = e.changelogText
              ? await simpleMarkdownToHtml(e.changelogText)
              : null;
            if (await showSharedPromptConfirmModal(t, e, n)) {
              (await updateById(t.id, {
                title: e.title,
                text: e.promptText,
                usePlaceholders: e.usePlaceholders,
                autoExecute: e.autoExecute,
                version: e.version,
                author: e.author,
                summary: e.summary,
                changelogText: e.changelogText,
                lastUpdateCheck: Date.now(),
              }),
                showNotification("Prompt updated successfully!", "success"),
                l());
              openPromptModal((await getAll()).find((e) => e.id === t.id));
            }
          } else
            (await updateById(t.id, { lastUpdateCheck: Date.now() }),
              showNotification("The prompt is already up to date.", "info"));
        } catch (e) {
          createDialogo({
            message: e.message,
            type: "alert",
            title: "Error",
          });
        }
        m &&
          ((m.disabled = !1), (m.textContent = "Update Now"));
      });
    const u = i.querySelector("#__ap_shared_view_changelog");
    (u &&
      (u.onclick = async () => {
        const e = await simpleMarkdownToHtml(t.changelogText || ""),
          n = document.createElement("div");
        n.className = "mp-overlay mp-hidden mp-shared-cl-overlay";
        const a = document.createElement("div");
        ((a.className = "mp-modal-box mp-shared-cl-box"),
          setSafeInnerHTML(
            a,
            `<button id="__ap_close_cl_modal" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title mp-shared-cl-title">${t.title}</h2><div class="mp-shared-changelog-content mp-shared-cl-body">${e}</div>`,
          ),
          n.appendChild(a),
          document.body.appendChild(n));
        ((a.querySelector("#__ap_close_cl_modal").onclick = (e) => {
          (e.stopPropagation(),
            n.classList.remove("visible"),
            a.querySelectorAll("img").forEach((e) => {
              e.src.startsWith("blob:") && URL.revokeObjectURL(e.src);
            }),
            setTimeout(() => n.remove(), 200));
        }),
          requestAnimationFrame(() => {
            (n.classList.remove("mp-hidden"), n.classList.add("visible"));
          }));
      }),
      requestAnimationFrame(() => {
        (s.classList.remove("mp-hidden"), s.classList.add("visible"));
      }));
  }
  async function checkAllSharedPromptsUpdates() {
    const e = await getAll(),
      t = Date.now();
    for (const n of e)
      if (n.isShared && n.updateInterval > 0) {
        const e = 24 * n.updateInterval * 60 * 60 * 1e3;
        if (t - (n.lastUpdateCheck || 0) >= e)
          try {
            const e = await fetchSharedPromptData(n.sharedUrl);
            if (compareVersions(e.version, n.version) > 0) {
              const a = e.changelogText
                ? await simpleMarkdownToHtml(e.changelogText)
                : null;
              (await showSharedPromptConfirmModal(n, e, a))
                ? (await updateById(n.id, {
                    title: e.title,
                    text: e.promptText,
                    usePlaceholders: e.usePlaceholders,
                    autoExecute: e.autoExecute,
                    version: e.version,
                    author: e.author,
                    summary: e.summary,
                    changelogText: e.changelogText,
                    lastUpdateCheck: t,
                  }),
                  "function" == typeof showNotification &&
                    showNotification(
                      "Prompt updated successfully!",
                      "success",
                    ))
                : await updateById(n.id, { lastUpdateCheck: t });
            } else await updateById(n.id, { lastUpdateCheck: t });
          } catch (e) {}
      }
  }
  function showAIDiffModal(e, t, n) {
    const a = document.createElement("div");
    ((a.className = "mp-overlay mp-diff-modal-overlay"),
      (a.id = "__ap_diff_overlay"));
    const o = document.createElement("div");
    o.className = "mp-modal-box";
    let r = !1,
      s = t;
    const i = () => {
        (setSafeInnerHTML(
          o,
          ` <button id="__ap_diff_close" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${"Compare Prompts"}</h2><div class="mp-diff-container"> ${(() => {
            if (r)
              return ` <div class="mp-diff-column"><div class="mp-diff-label">${"Original"}</div><textarea id="__ap_diff_original" class="mp-diff-textarea" readonly>${e}</textarea></div><div class="mp-diff-column"><div class="mp-diff-label">${"Enhanced Version"}</div><button id="__ap_diff_toggle_mode" class="mp-pinned-action-btn mp-diff-enhanced-edit-btn active" type="button"> ${ICONS.edit} </button><textarea id="__ap_diff_enhanced" class="mp-diff-textarea">${s}</textarea></div> `;
            {
              const t = getSideBySideDiff(e, s);
              return ` <div class="mp-diff-column"><div class="mp-diff-label">${"Original"}</div><div id="__ap_diff_original_view" class="mp-diff-view">${t.left}</div></div><div class="mp-diff-column"><div class="mp-diff-label">${"Enhanced Version"}</div><button id="__ap_diff_toggle_mode" class="mp-pinned-action-btn mp-diff-enhanced-edit-btn" type="button"> ${ICONS.edit} </button><div id="__ap_diff_enhanced_view" class="mp-diff-view">${t.right}</div></div> `;
            }
          })()} </div><div class="mp-diff-actions"><button id="__ap_diff_cancel" class="save-button mp-shared-btn-cancel">${"Keep Original"}</button><button id="__ap_diff_accept" class="save-button">${"Use Enhanced"}</button></div> `,
        ),
          (o.querySelector("#__ap_diff_close").onclick = l),
          (o.querySelector("#__ap_diff_cancel").onclick = l),
          (o.querySelector("#__ap_diff_accept").onclick = () => {
            const e = r ? o.querySelector("#__ap_diff_enhanced").value : s;
            ((n.value = e),
              n.syntaxClear && n.syntaxClear(),
              n.syntaxUpdate && n.syntaxUpdate(),
              l());
          }));
        const t = o.querySelector("#__ap_diff_toggle_mode");
        if (t) {
          (createCustomTooltip(
            t,
            r ? "View Differences" : "Edit Text",
            "left",
          ),
            (t.onclick = () => {
              (r
                ? ((s = o.querySelector("#__ap_diff_enhanced").value), (r = !1))
                : (r = !0),
                i());
            }));
        }
        r
          ? syncScroll(
              o.querySelector("#__ap_diff_original"),
              o.querySelector("#__ap_diff_enhanced"),
            )
          : syncScroll(
              o.querySelector("#__ap_diff_original_view"),
              o.querySelector("#__ap_diff_enhanced_view"),
            );
      },
      l = () => {
        (a.classList.remove("visible"), setTimeout(() => a.remove(), 200));
      };
    (i(),
      a.appendChild(o),
      document.body.appendChild(a),
      requestAnimationFrame(() => a.classList.add("visible")));
  }
  function openPromptModal(e = null) {
    if (!currentModal) return;
    const t = !!e,
      n = e?.isShared || !1;
    ((currentModal.dataset.promptId = e?.id || ""),
      (currentModal.dataset.originalTitle = e?.title || ""),
      (currentModal.dataset.originalText = e?.text || ""),
      (currentModal.querySelector(".modal-title").textContent = t ? "Edit" : "New Prompt"));
    const a = document.getElementById("__ap_title");
    ((a.value = e?.title || ""), (a.disabled = n));
    const o = document.getElementById("__ap_text");
    ((o.value = e?.text || ""),
      (o.disabled = n),
      o.syntaxClear && o.syntaxClear(),
      o.syntaxUpdate && o.syntaxUpdate(),
      o.dispatchEvent(new Event("input", { bubbles: !0 })));
    const r = document.getElementById("__ap_use_placeholders");
    ((r.checked = e?.usePlaceholders || !1), (r.disabled = n));
    const s = document.getElementById("__ap_auto_execute");
    ((s.checked = e?.autoExecute || !1), (s.disabled = !1));
    const i = document.getElementById("__ap_save");
    i && (i.style.display = "block");
    const l = document.getElementById("__ap_paste_btn_modal");
    l && (l.style.display = n ? "none" : "inline-flex");
    const c = document.getElementById("__ap_enhance_btn");
    (c && (c.style.display = n ? "none" : "inline-flex"),
      (currentActiveFileIds = new Set(e?.activeFileIds || [])));
    const d = currentModal.querySelector(".mp-modal-box"),
      p =
        d.querySelector("#__ap_files_accordion") ||
        d.querySelector("#__ap_accordion"),
      m = d.querySelector("#__ap_tags_accordion");
    (p && p.classList.remove("open"),
      m && m.classList.remove("open"),
      d && d.renderGlobalFiles && d.renderGlobalFiles(),
      d && d.loadPromptTags && d.loadPromptTags(e?.tags || []));
    const u = document.getElementById("__ap_tags_manage");
    (u && (u.style.display = "flex"),
      showModal(currentModal),
      n || setTimeout(() => a.focus(), 100));
  }
  function showModal(e) {
    e &&
      (e.classList.remove("mp-hidden"),
      setTimeout(() => e.classList.add("visible"), 10));
  }
  function hideModal(e) {
    e &&
      (e.classList.remove("visible"),
      setTimeout(() => e.classList.add("mp-hidden"), 200));
  }
  async function openBackupManager() {
    closeMenu();
    const e = document.createElement("div");
    ((e.className = "mp-overlay"), (e.id = "__ap_backup_overlay"));
    const t = document.createElement("div");
    ((t.className = "mp-modal-box"),
      (t.style.width = "450px !important"),
      (t.onclick = (e) => e.stopPropagation()));
    const n = [
      {
        key: "aiSettings",
        label: "AI Settings",
        desc: "API Keys, Selected Model, System Prompt",
        storageKey: AI_SETTINGS_KEY,
        defaultVal: DEFAULT_AI_CONFIG,
      },
      {
        key: "prompts",
        label: "Prompts",
        desc: "All saved prompts",
        storageKey: "Prompts",
        defaultVal: [],
      },
      {
        key: "globalFiles",
        label: "Global Files",
        desc: "Files or attachments saved globally",
        storageKey: "GlobalFiles",
        defaultVal: {},
      },
      {
        key: "tags",
        label: "Manage Tags",
        desc: "Tags in Use",
        storageKey: "PromptTags",
        defaultVal: DEFAULT_TAGS_CONFIG,
      },
      {
        key: "theme",
        label: "Theme",
        desc: "Current theme settings (Light/Dark mode)",
        storageKey: "Theme",
        defaultVal: DEFAULT_THEME_CONFIG,
      },
      {
        key: "importedThemes",
        label: "Custom Themes",
        desc: "Themes created or imported by the user",
        storageKey: "ImportedThemes",
        defaultVal: {},
      },
      {
        key: "shortcuts",
        label: "Shortcuts",
        desc: "Keyboard shortcut settings",
        storageKey: SHORTCUTS_STORAGE_KEY,
        defaultVal: DEFAULT_SHORTCUTS,
      },
      {
        key: "navConfig",
        label: "Quick Navigation",
        desc: "Locates and jumps to specific points in the conversation via message anchors.",
        storageKey: NAV_STORAGE_KEY,
        defaultVal: DEFAULT_NAV_CONFIG,
      },
      {
        key: "prediction",
        label: "Prediction",
        desc: "Text prediction settings",
        storageKey: PREDICTION_STORAGE_KEY,
        defaultVal: DEFAULT_PREDICTION_CONFIG,
      },
      {
        key: "syntaxHighlight",
        label: "Syntax Highlighting",
        desc: "Syntax highlighting settings.",
        storageKey: SYNTAX_STORAGE_KEY,
        defaultVal: DEFAULT_SYNTAX_CONFIG,
      },
      {
        key: "gistConfig",
        label: "Gist Sync",
        desc: "Sync your full backup to a private GitHub Gist. Create a PAT at github.com/settings/tokens with the 'gist' scope.",
        storageKey: GIST_CONFIG_KEY,
        defaultVal: DEFAULT_GIST_CONFIG,
      },
    ];
    (setSafeInnerHTML(
      t,
      ` <button id="__ap_close_backup" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${"Backup and Restore"}</h2><div class="mp-backup-section"><div class="mp-backup-subtitle"> ${ICONS.export} <span>${"Export Data"}</span></div><div class="mp-export-actions" style="border:none; margin-top:0; padding-bottom:0; margin-bottom: 8px;"><label class="mp-checkbox-wrapper" style="cursor:pointer; user-select:none;"><input type="checkbox" id="__ap_backup_select_all" class="mp-checkbox" checked><span style="margin-left:8px;">${"Select All"}</span></label></div><div class="mp-backup-list mp-scroll-wrapper" id="__ap_backup_list"></div><div class="mp-backup-actions"><button id="__ap_do_export_backup" class="save-button">${"Export File"}</button><button id="__ap_do_gist_sync" class="save-button mp-btn-secondary">${ICONS.gist} ${"Sync to Gist"}</button></div></div><div class="mp-backup-divider"></div><div class="mp-backup-section"><div class="mp-backup-subtitle"> ${ICONS.import} <span>${"Import Data"}</span></div><div class="mp-backup-warning">${"Warning: Importing settings will overwrite current data. It is recommended to make a backup first."}</div><div class="mp-backup-actions" style="justify-content: center;"><button id="__ap_do_import_backup" class="save-button mp-btn-secondary">${"Select File"}</button><button id="__ap_do_gist_restore" class="save-button mp-btn-secondary">${ICONS.gist} ${"Restore from Gist"}</button></div></div> `,
    ),
      e.appendChild(t),
      document.body.appendChild(e));
    const a = t.querySelector("#__ap_backup_list");
    ((a.style.maxHeight = "220px !important"),
      setupEnhancedScroll(a),
      n.forEach((e) => {
        const t = document.createElement("div");
        t.className = "mp-backup-item";
        const n = document.createElement("div");
        n.className = "mp-checkbox-wrapper";
        const o = document.createElement("input");
        ((o.type = "checkbox"),
          (o.className = "mp-checkbox backup-selector"),
          (o.dataset.key = e.key),
          (o.dataset.storageKey = e.storageKey),
          (o.checked = !0),
          n.appendChild(o));
        const s = document.createElement("div");
        s.className = "mp-backup-item-content";
        const i = document.createElement("div");
        ((i.className = "mp-backup-item-title"), (i.textContent = e.label));
        const l = document.createElement("div");
        ((l.className = "mp-backup-item-desc"),
          (l.textContent = e.desc),
          s.appendChild(i),
          s.appendChild(l),
          (t.onclick = (e) => {
            "checkbox" !== e.target.type && ((o.checked = !o.checked), r());
          }),
          (o.onchange = r),
          t.appendChild(n),
          t.appendChild(s),
          a.appendChild(t));
      }));
    const o = t.querySelector("#__ap_backup_select_all");
    function r() {
      const e = a.querySelectorAll(".backup-selector"),
        t = Array.from(e).every((e) => e.checked),
        n = Array.from(e).some((e) => e.checked);
      ((o.checked = t), (o.indeterminate = n && !t));
    }
    ((o.onchange = (e) => {
      a.querySelectorAll(".backup-selector").forEach(
        (t) => (t.checked = e.target.checked),
      );
    }),
      (t.querySelector("#__ap_do_export_backup").onclick = async () => {
        const t = Array.from(a.querySelectorAll(".backup-selector:checked"));
        if (0 === t.length)
          return void showNotification(
            "No category selected.",
            "error",
          );
        const n = {
          meta: {
            scriptName: "My Prompt",
            version: "26.1.1",
            exportDate: new Date().toISOString(),
          },
          data: {},
        };
        for (const e of t) {
          const t = e.dataset.storageKey,
            a = await GM_getValue(t);
          null != a && (n.data[t] = a);
        }
        const o = new Blob([JSON.stringify(n, null, 2)], {
            type: "application/json",
          }),
          r = document.createElement("a");
        r.href = URL.createObjectURL(o);
        const s = new Date(),
          i = s.toLocaleDateString(navigator.language).replace(/\//g, "-"),
          l = s
            .toLocaleTimeString(navigator.language, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
            .replace(/:/g, "-");
        ((r.download = `Backup_MyPrompt_${i}_${l}.mp.backup.json`),
          r.click(),
          URL.revokeObjectURL(r.href),
          closeModal(e));
      }),
      (t.querySelector("#__ap_do_import_backup").onclick = () => {
        const t = document.createElement("input");
        ((t.type = "file"),
          (t.accept = ".mp.backup.json"),
          (t.onchange = (t) => {
            const n = t.target.files[0];
            if (!n) return;
            const a = new FileReader();
            ((a.onload = async (t) => {
              try {
                const n = JSON.parse(t.target.result);
                if (!n || !n.data) throw new Error("Invalid format");
                const a = Object.keys(n.data);
                if (0 === a.length) throw new Error("Empty file");
                if (
                  !(await createDialogo({
                    message: `This will replace your current settings with those from the file. Do you want to continue? (${a.length} items)`,
                    type: "confirm",
                  }))
                )
                  return;
                for (const e of a) await GM_setValue(e, n.data[e]);
                (showNotification("Backup imported successfully! The page will reload."),
                  closeModal(e),
                  location.reload());
              } catch (e) {
                await createDialogo({
                  title: "Error",
                  message: `Error importing file: ${e.message}`,
                  type: "alert",
                });
              }
            }),
              a.readAsText(n));
          }),
          t.click());
      }),
      (t.querySelector("#__ap_do_gist_sync").onclick = async () => {
        const btn = t.querySelector("#__ap_do_gist_sync");
        const orig = btn.innerHTML;
        btn.disabled = true;
        setSafeInnerHTML(btn, ICONS.loading);
        try {
          const r = await pushBackupToGist();
          showNotification(
            r.created ? "Gist created: " + r.url : "Gist updated successfully",
            "success",
          );
        } catch (err) {
          await createDialogo({
            title: "Error",
            message: err.message,
            type: "alert",
          });
        } finally {
          btn.disabled = false;
          setSafeInnerHTML(btn, orig);
        }
      }),
      (t.querySelector("#__ap_do_gist_restore").onclick = async () => {
        const btn = t.querySelector("#__ap_do_gist_restore");
        const orig = btn.innerHTML;
        const openSettingsToAdvanced = async () => {
          closeModal(e);
          settingsModal ||
            ((settingsModal = createSettingsModal()),
            document.body.appendChild(settingsModal));
          settingsModal.resetToCurrent && settingsModal.resetToCurrent();
          showModal(settingsModal);
          setTimeout(() => {
            const tab = settingsModal.querySelector(
              '.mp-tab-btn[data-tab="advanced"]',
            );
            tab && tab.click();
            setTimeout(() => {
              const patInput =
                settingsModal.querySelector("#mp_gist_pat_input");
              patInput && patInput.focus();
            }, 100);
          }, 50);
        };
        const pat = currentGistConfig.pat.trim();
        if (!pat) {
          if (
            "go_to_settings" ===
            (await createDialogo({
              title: "GitHub PAT Required",
              message: "To restore from Gist, you need a GitHub Personal Access Token with 'gist' scope. Create one at github.com/settings/tokens, then paste it below.",
              actions: [
                {
                  label: "Open Settings",
                  style: "edit",
                  value: "go_to_settings",
                },
              ],
            }))
          ) {
            await openSettingsToAdvanced();
          }
          return;
        }
        const gistId = currentGistConfig.gistId.trim();
        if (!gistId) {
          if (
            "go_to_settings" ===
            (await createDialogo({
              title: "Gist ID Required",
              message: "No Gist ID is configured yet. Enter the ID of the Gist you want to restore from, or sync once first to create one.",
              actions: [
                {
                  label: "Open Settings",
                  style: "edit",
                  value: "go_to_settings",
                },
              ],
            }))
          ) {
            await openSettingsToAdvanced();
          }
          return;
        }
        btn.disabled = true;
        setSafeInnerHTML(btn, ICONS.loading);
        try {
          const pulled = await pullBackupFromGist();
          const keys = Object.keys(pulled.data);
          if (0 === keys.length) throw new Error("Backup contains no data");
          if (
            !(await createDialogo({
              message: `This will replace your current settings with those from the file. Do you want to continue? (${keys.length} items)`,
              type: "confirm",
            }))
          ) {
            btn.disabled = false;
            setSafeInnerHTML(btn, orig);
            return;
          }
          for (const k of keys) await GM_setValue(k, pulled.data[k]);
          showNotification("Backup imported successfully! The page will reload.");
          closeModal(e);
          location.reload();
        } catch (err) {
          await createDialogo({
            title: "Error",
            message: err.message,
            type: "alert",
          });
          btn.disabled = false;
          setSafeInnerHTML(btn, orig);
        }
      }),
      (t.querySelector("#__ap_close_backup").onclick = () => closeModal(e)),
      (e.onclick = (t) => {
        t.target === e && closeModal(e);
      }),
      setTimeout(() => e.classList.add("visible"), 10));
  }
  function closeModal(e) {
    (e.classList.remove("visible"), setTimeout(() => e.remove(), 200));
  }
  function createTagsManagerModal() {
    const e = document.createElement("div");
    ((e.className = "mp-overlay mp-hidden"), (e.id = "__mp_tags_overlay"));
    const t = document.createElement("div");
    ((t.className = "mp-modal-box"),
      (t.id = "__mp_tags_box"),
      (t.style.cssText = "max-width: 500px;"),
      (t.onclick = (e) => e.stopPropagation()));
    let n = null;
    const a = () => {
        const r = null !== n,
          s = r ? getTag(n) : null;
        setSafeInnerHTML(
          t,
          ` <button id="__mp_tags_close" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${"Manage Tags"}</h2><div class="mp-tags-modal-content" id="__mp_tags_content_scroll"><div class="mp-tag-form"><div class="form-group"><label for="__mp_tag_name" class="form-label">${"Tag Name"}</label><input id="__mp_tag_name" class="form-input" placeholder="${"Ex: img, video, txt..."}" value="${r ? s.name : ""}" ${r ? 'readonly style="opacity:0.6;cursor:not-allowed;"' : ""} /></div><div class="form-group" style="margin-bottom: 0px !important;"><label for="__mp_tag_comment" class="form-label">${"Comment (optional)"}</label><input id="__mp_tag_comment" class="form-input" placeholder="${"Ex: Image Generators"}" value="${(r && s.comment) || ""}" /></div><div class="mp-tag-form-row"><div class="mp-tag-color-group"><label class="mp-tag-color-label">${"Background Color"}</label><input id="__mp_tag_bg_color" type="color" class="mp-tag-color-input" value="${(r && s.bgColor) || "#7071fc"}" /></div><div class="mp-tag-color-group"><label class="mp-tag-color-label">${"Text Color"}</label><input id="__mp_tag_text_color" type="color" class="mp-tag-color-input" value="${(r && s.textColor) || "#ffffff"}" /></div></div><button id="__mp_create_tag" class="save-button">${r ? "Save" : "Create Tag"}</button></div><div id="__mp_tags_list" class="mp-tags-list"></div></div> `,
        );
        t.querySelector("#__mp_tags_close").onclick = () => {
          ((n = null), hideModal(e));
        };
        ((t.querySelector("#__mp_create_tag").onclick = async () => {
          const e = t.querySelector("#__mp_tag_name"),
            o = t.querySelector("#__mp_tag_bg_color"),
            r = t.querySelector("#__mp_tag_text_color"),
            s = t.querySelector("#__mp_tag_comment"),
            i = e.value.trim();
          if (!i)
            return void showNotification("Tag Name is required.", "error");
          const l = i.toLowerCase();
          if (!n && currentTagsConfig.tags[l])
            return void showNotification(
              "A tag with this name already exists",
              "error",
            );
          if (
            (await createOrUpdateTag({
              name: i,
              bgColor: o.value,
              textColor: r.value,
              comment: s.value.trim(),
            }),
            (n = null),
            a(),
            currentModal)
          ) {
            const e = currentModal.querySelector(".mp-modal-box");
            e && e.renderTagsSelector && e.renderTagsSelector();
          }
          const c = t.querySelector("#__mp_tag_name");
          c && c.focus();
        }),
          o(),
          setTimeout(() => {
            const e = t.querySelector("#__mp_tags_content_scroll");
            e && setupEnhancedScroll(e, null, "var(--mp-border-radius-md)");
          }, 0));
      },
      o = () => {
        const e = t.querySelector("#__mp_tags_list");
        if (!e) return;
        const r = getAllTags();
        0 !== r.length
          ? (setSafeInnerHTML(e, ""),
            r.forEach((t) => {
              const r = document.createElement("div");
              r.className = "mp-tag-item";
              const s = document.createElement("div");
              s.className = "mp-tag-item-info";
              const i = document.createElement("div");
              i.className = "mp-tag-item-preview";
              const l = createTagBadge(t);
              i.appendChild(l);
              const c = document.createElement("div");
              if (((c.className = "mp-tag-item-details"), t.comment)) {
                const e = document.createElement("div");
                ((e.className = "mp-tag-item-comment"),
                  (e.textContent = t.comment),
                  c.appendChild(e));
              }
              (s.appendChild(i), s.appendChild(c));
              const d = document.createElement("div");
              d.className = "mp-tag-item-actions";
              const p = document.createElement("button");
              ((p.className = "mp-tag-action-btn edit"),
                setSafeInnerHTML(p, ICONS.edit),
                createCustomTooltip(p, "Edit", "top"),
                (p.onclick = () => {
                  ((n = t.name.toLowerCase()), a());
                }),
                d.appendChild(p));
              const m = document.createElement("button");
              ((m.className = "mp-tag-action-btn delete"),
                setSafeInnerHTML(m, ICONS.delete),
                createCustomTooltip(m, "Delete", "top"),
                (m.onclick = async () => {
                  const e = await createDialogo({
                    message: "Delete the tag \"{name}\"? It will be removed from all prompts.".replace(
                      "{name}",
                      t.name,
                    ),
                    type: "confirm",
                    dontShowAgainId: "confirme-delete-tag",
                  });
                  if (
                    (!0 === e || "dont_show_again" === e) &&
                    (await deleteTag(t.name),
                    showNotification("Deleted Successfully!"),
                    o(),
                    currentMenu &&
                      currentMenu.classList.contains("visible") &&
                      refreshMenu(),
                    currentModal)
                  ) {
                    const e = currentModal.querySelector(".mp-modal-box");
                    e && e.renderTagsSelector && e.renderTagsSelector();
                  }
                }),
                d.appendChild(m),
                r.appendChild(s),
                r.appendChild(d),
                e.appendChild(r));
            }))
          : setSafeInnerHTML(
              e,
              `<div class="mp-tags-empty">${"Create new Tags"}</div>`,
            );
      };
    return ((t.renderContent = a), e.appendChild(t), e);
  }
  function createTagBadge(e) {
    const t = document.createElement("div");
    t.className = "mp-tag-badge";
    const n = getTagStyle(e);
    ((t.style.backgroundColor = n.backgroundColor), (t.style.color = n.color));
    const a = document.createElement("span");
    return (
      (a.textContent = e.name),
      t.appendChild(a),
      e.comment && createCustomTooltip(t, e.comment, "left"),
      t
    );
  }
  function openTagsManager() {
    tagsModal ||
      ((tagsModal = createTagsManagerModal()),
      document.body.appendChild(tagsModal));
    const e = tagsModal.querySelector("#__mp_tags_box");
    (e.renderContent && e.renderContent(),
      showModal(tagsModal),
      setTimeout(() => {
        const e = tagsModal.querySelector("#__mp_tag_name");
        e && e.focus();
      }, 100));
  }
  function setupEnhancedScroll(e, t = null, n = null) {
    if (!e) return;
    const a = window.getComputedStyle(e),
      o = a.marginBottom,
      r = a.marginTop;
    e.classList.add("mp-scroll-invisible");
    const s = document.createElement("div");
    ((s.className = "mp-scroll-wrapper"),
      t && s.style.setProperty("--mp-scroll-bg", t),
      n && (s.style.borderRadius = n),
      (s.style.marginBottom = o),
      (s.style.marginTop = r),
      (e.style.marginBottom = "0"),
      (e.style.marginTop = "0"),
      e.parentNode.insertBefore(s, e),
      s.appendChild(e));
    const i = (e) => {
        const t = document.createElement("div");
        return (
          (t.className = `mp-scroll-arrow ${e}`),
          setSafeInnerHTML(
            t,
            "up" === e ? `${ICONS.navUp}` : `${ICONS.navDown}`,
          ),
          t
        );
      },
      l = i("up"),
      c = i("down");
    (s.appendChild(l), s.appendChild(c));
    const d = () => {
      const { scrollTop: t, scrollHeight: n, clientHeight: a } = e;
      (t > 1 ? l.classList.add("visible") : l.classList.remove("visible"),
        n - t - a > 1
          ? c.classList.add("visible")
          : c.classList.remove("visible"));
    };
    ((l.onclick = (t) => {
      (t.stopPropagation(), e.scrollBy({ top: -100, behavior: "smooth" }));
    }),
      (c.onclick = (t) => {
        (t.stopPropagation(), e.scrollBy({ top: 100, behavior: "smooth" }));
      }),
      e.addEventListener("scroll", d));
    new MutationObserver(d).observe(e, { childList: !0, subtree: !0 });
    return (
      new ResizeObserver(d).observe(e),
      (e.updateScrollArrows = d),
      setTimeout(d, 0),
      s
    );
  }
  function positionMenu(e, t) {
    const n = t.getBoundingClientRect(),
      a = e.offsetHeight,
      o = e.offsetWidth,
      r = window.innerHeight,
      s = window.innerWidth;
    let i, l;
    const c = r - n.bottom - 8,
      d = n.top - 8;
    i = c >= a ? n.bottom + 8 : d >= a ? n.top - a - 8 : Math.max(8, r - a - 8);
    const p = s - n.left - 8,
      m = n.right - 8;
    ((l = p >= o ? n.left : m >= o ? n.right - o : (s - o) / 2),
      (e.style.top = `${Math.max(8, Math.min(i, r - a - 8))}px`),
      (e.style.left = `${Math.max(8, Math.min(l, s - o - 8))}px`));
  }
  setTimeout(checkAllSharedPromptsUpdates, 6e3);
  const PREVIEW_PROMPT_STORAGE_KEY = "PreviewPrompt",
    DEFAULT_PREVIEW_PROMPT_CONFIG = { normal: !0, expand: !0 };
  let currentPreviewPromptConfig = DEFAULT_PREVIEW_PROMPT_CONFIG;
  async function savePreviewPromptConfig(e) {
    currentPreviewPromptConfig = { ...currentPreviewPromptConfig, ...e };
    try {
      await GM_setValue(
        PREVIEW_PROMPT_STORAGE_KEY,
        JSON.stringify(currentPreviewPromptConfig),
      );
    } catch (e) {
      console.error(e);
    }
  }
  async function loadPreviewPromptConfig() {
    try {
      const e = await GM_getValue(PREVIEW_PROMPT_STORAGE_KEY);
      e &&
        (currentPreviewPromptConfig = {
          ...DEFAULT_PREVIEW_PROMPT_CONFIG,
          ...JSON.parse(e),
        });
    } catch (e) {}
  }
  function applyGlobalSortMode(e, t) {
    return t && "manual" !== t
      ? e.sort((e, n) => {
          if ("tags" === t) {
            const t =
                e.tags && e.tags.length
                  ? e.tags.slice().sort().join(",").toLowerCase()
                  : "zzzz",
              a =
                n.tags && n.tags.length
                  ? n.tags.slice().sort().join(",").toLowerCase()
                  : "zzzz";
            return t !== a
              ? t.localeCompare(a)
              : (e.title || "").localeCompare(n.title || "");
          }
          return "az" === t
            ? (e.title || "").localeCompare(n.title || "")
            : "za" === t
              ? (n.title || "").localeCompare(e.title || "")
              : "most_used" === t
                ? (n.usageCount || 0) - (e.usageCount || 0)
                : "least_used" === t
                  ? (e.usageCount || 0) - (n.usageCount || 0)
                  : "newest" === t
                    ? String(n.id || "").localeCompare(String(e.id || ""))
                    : "oldest" === t
                      ? String(e.id || "").localeCompare(String(n.id || ""))
                      : 0;
        })
      : e;
  }
  function buildSharedFilterDropdown({
    dropdownClass: e,
    selectId: t,
    onStateChange: n,
    onManageClick: a,
  }) {
    const o = document.createElement("div");
    ((o.className = e),
      o.addEventListener("click", (e) => e.stopPropagation()),
      o.addEventListener("mousedown", (e) => e.stopPropagation()));
    const r = document.createElement("div");
    r.className = "mp-filter-header";
    const s = document.createElement("button");
    ((s.className = "mp-filter-manage-btn"),
      setSafeInnerHTML(s, ICONS.edit),
      "function" == typeof createCustomTooltip &&
        createCustomTooltip(s, "Manage Tags", "top"),
      (s.onclick = (e) => {
        (e.stopPropagation(), o.classList.remove("visible"), a());
      }));
    const i = document.createElement("button");
    ((i.className = "mp-filter-clear-btn"),
      setSafeInnerHTML(i, ICONS.delete),
      "function" == typeof createCustomTooltip &&
        createCustomTooltip(i, "Clear Filters", "top"),
      (i.onclick = async (e) => {
        (e.stopPropagation(),
          await clearTagFilters(),
          (window.__mpSortMode = "manual"),
          o.rebuild(),
          n());
      }),
      r.appendChild(s),
      r.appendChild(i),
      o.appendChild(r));
    const l = document.createElement("div");
    setSafeInnerHTML(
      l,
      ` <div style="padding: 8px 12px; border-bottom: 1px solid var(--mp-border-primary);"><select id="${t}" style="width: 100%; padding: 6px; border-radius: var(--mp-border-radius-sm); background: var(--mp-bg-secondary); color: var(--mp-text-primary); border: 1px solid var( --mp-border-primary); cursor: pointer; outline: none;"><option value="manual">${"Manual Order"}</option><option value="az">${"Alphabetical Order (A-Z)"}</option><option value="za">${"Alphabetical Order (Z-A)"}</option><option value="most_used">${"Most Used"}</option><option value="least_used">${"Least Used"}</option><option value="newest">${"Newest"}</option><option value="oldest">${"Oldest"}</option><option value="tags">${"Group by Tags"}</option></select></div> `,
    );
    const c = l.querySelector(`#${t}`);
    o.appendChild(l);
    const d = document.createElement("div");
    return (
      (d.className = "mp-filter-list"),
      o.appendChild(d),
      "function" == typeof setupEnhancedScroll && setupEnhancedScroll(d),
      (o.rebuild = () => {
        const tagDropdown = o,
          scrollPos = d.scrollTop,
          makeMoveBtn = (tagKey, dir, icon, tipText, atEdge) => {
            // v27.1.0: per-tag up/down reorder control for the filter list
            // (both the dock window and the expanded full-view window share
            // this builder). The order is global (PromptTags.tagOrder) and
            // persists; end-of-list buttons render disabled. Clicks are
            // isolated (stopPropagation) so they never toggle the filter.
            const btn = document.createElement("button");
            return (
              (btn.type = "button"),
              (btn.className = "mp-filter-move-btn"),
              (btn.style.cssText =
                "display:flex;align-items:center;justify-content:center;width:18px;height:14px;padding:0;background:transparent;border:none;color:var(--mp-text-secondary);line-height:1;" +
                (atEdge
                  ? "opacity:.25;cursor:default;"
                  : "opacity:.8;cursor:pointer;")),
              setSafeInnerHTML(btn, icon),
              btn.firstElementChild &&
                ((btn.firstElementChild.style.width = "12px"),
                (btn.firstElementChild.style.height = "12px"),
                (btn.firstElementChild.style.display = "block")),
              btn.setAttribute("aria-label", tipText),
              "function" == typeof createCustomTooltip &&
                createCustomTooltip(btn, tipText, "left"),
              (btn.onmousedown = (e) => e.stopPropagation()),
              (btn.onclick = atEdge
                ? (e) => (e.stopPropagation(), e.preventDefault())
                : async (e) => {
                    (e.stopPropagation(), e.preventDefault()),
                      (await moveTagOrder(tagKey, dir)) &&
                        tagDropdown.rebuild();
                  }),
              atEdge || (btn.onmouseenter = () => (btn.style.opacity = "1")),
              atEdge || (btn.onmouseleave = () => (btn.style.opacity = "0.8")),
              btn
            );
          };
        (window.__mpSortMode ||
          (window.__mpSortMode = currentTagsConfig.sortMode || "manual"),
          (c.value = window.__mpSortMode),
          setSafeInnerHTML(d, ""));
        const e = getAllTags();
        if (0 === e.length) {
          const e = document.createElement("div");
          ((e.className = "mp-filter-empty"),
            (e.textContent = "Create new Tags"),
            d.appendChild(e));
        } else
          e.forEach((e, tagIndex, tagList) => {
            const t = e.name.toLowerCase(),
              a = isTagFilterActive(t),
              o = document.createElement("div");
            ((o.className = "mp-filter-item " + (a ? "selected" : "")),
              (o.dataset.tagName = t));
            const r = document.createElement("div");
            r.className = "mp-filter-checkbox";
            const s = document.createElement("div");
            ((s.className = "mp-filter-tag-preview"),
              s.appendChild(createTagBadge(e)),
              o.appendChild(s));
            const u = document.createElement("div");
            ((u.className = "mp-filter-move-btns"),
              (u.style.cssText =
                "display:flex;flex-direction:column;align-items:center;flex-shrink:0;"),
              u.appendChild(
                makeMoveBtn(t, -1, ICONS.navUp, "Move up", 0 === tagIndex),
              ),
              u.appendChild(
                makeMoveBtn(
                  t,
                  1,
                  ICONS.navDown,
                  "Move down",
                  tagIndex === tagList.length - 1,
                ),
              ),
              o.appendChild(u),
              o.appendChild(r),
              o.addEventListener("click", async (e) => {
                (e.stopPropagation(),
                  await toggleTagFilter(t),
                  o.classList.toggle("selected"),
                  n());
              }),
              d.appendChild(o));
          });
        d.scrollTop = scrollPos;
      }),
      (c.onchange = (e) => {
        ((window.__mpSortMode = e.target.value),
          (currentTagsConfig.sortMode = e.target.value),
          saveTagsConfig(),
          n());
      }),
      o.rebuild(),
      o
    );
  }
  let _abrirPesquisaComAtalho = !1;
  async function refreshMenu(e = null, t = !1) {
    if (!currentMenu) return;
    const n = currentMenu.querySelector("#prompt-menu-list-el"),
      a = n ? n.scrollTop : 0;
    setSafeInnerHTML(currentMenu, "");
    let o = -1;
    document.querySelectorAll(".mp-filter-dropdown").forEach((e) => e.remove());
    const r = await getAll(),
      s = document.createElement("div");
    s.className = "menu-header-grid";
    const i = (e, t, n, a) => {
        const o = document.createElement("button");
        return (
          (o.className = `menu-header-btn ${e}`),
          setSafeInnerHTML(o, t),
          "function" == typeof createCustomTooltip &&
            createCustomTooltip(o, n, "top"),
          (o.onclick = a),
          o
        );
      },
      l = document.createElement("div");
    l.className = "menu-search-overlay";
    const c = document.createElement("input");
    ((c.className = "menu-search-input"),
      (c.placeholder = "Search"),
      (c.type = "text"),
      (c.autocomplete = "off"),
      (c.onclick = (e) => e.stopPropagation()),
      (c.style.padding = "6.5px 12px"));
    const d = document.createElement("button");
    ((d.className = "menu-header-btn"),
      (d.style.border = "none"),
      (d.style.padding = "0 8px"),
      setSafeInnerHTML(d, ICONS.close),
      (d.onclick = (e) => {
        (e.stopPropagation(),
          (l.style.transform = "translateX(110%)"),
          (c.value = ""),
          c.dispatchEvent(new Event("input")));
      }),
      l.appendChild(c),
      l.appendChild(d));
    const p = i(
        "btn-search",
        ICONS.search,
        "Search",
        async (e) => {
          e.stopPropagation();
          const hadFilter =
            (currentTagsConfig &&
              currentTagsConfig.activeFilters &&
              currentTagsConfig.activeFilters.length > 0) ||
            (window.__mpSortMode && "manual" !== window.__mpSortMode);
          if (hadFilter) {
            ((window.__mpSortMode = "manual"),
              await clearTagFilters(),
              await refreshMenu(),
              (_abrirPesquisaComAtalho = !0));
          } else
            ((l.style.transform = "translateX(0)"),
              setTimeout(() => c.focus(), 50));
        },
      ),
      m = i("btn-expand", ICONS.expand2, "Expand", (e) => {
        (e.stopPropagation(), closeMenu(), openExpandedPromptMenu());
      }),
      u = i("btn-filter", ICONS.filter, "Filter", (e) => {
        (e.stopPropagation(),
          (v = !v),
          v
            ? (h(), f.classList.add("visible"))
            : f.classList.remove("visible"));
      }),
      g = () => {
        const e =
            void 0 !== currentTagsConfig &&
            currentTagsConfig.activeFilters &&
            currentTagsConfig.activeFilters.length > 0,
          t = window.__mpSortMode && "manual" !== window.__mpSortMode;
        e || t
          ? (u.classList.add("active"),
            setSafeInnerHTML(u, ICONS.filterAct || ICONS.filter))
          : (u.classList.remove("active"), setSafeInnerHTML(u, ICONS.filter));
      };
    (g(),
      s.appendChild(p),
      s.appendChild(m),
      s.appendChild(u),
      s.appendChild(l),
      currentMenu.appendChild(s));
    const f = buildSharedFilterDropdown({
      dropdownClass: "mp-filter-dropdown",
      selectId: "mp-sort-select-normal",
      onStateChange: () => {
        (g(), S());
      },
      onManageClick: () => {
        ((v = !1), openTagsManager());
      },
    });
    f.id = "__mp_filter_dropdown";
    const h = () => {
      const e = u.getBoundingClientRect();
      ((f.style.position = "fixed"), (f.style.top = `${e.bottom + 8}px`));
      let t = e.left;
      (t + 220 > window.innerWidth && (t = window.innerWidth - 228),
        (f.style.left = `${t}px`),
        (f.style.maxHeight = "280px"));
    };
    let v = !1;
    const y = (e) => {
      f.contains(e.target) ||
        e.target === u ||
        u.contains(e.target) ||
        (f.classList.remove("visible"), (v = !1));
    };
    (setTimeout(() => {
      document.addEventListener("click", y);
    }, 0),
      document.body.appendChild(f));
    const b = document.createElement("div");
    ((b.className = "prompt-menu-list"), (b.id = "prompt-menu-list-el"));
    const x = document.createElement("div");
    ((x.className = "empty-state"), b.appendChild(x));
    const C = () => {
        const e = Array.from(b.querySelectorAll(".prompt-item-row")).filter(
          (e) => "none" !== e.style.display,
        );
        if (
          (b
            .querySelectorAll(".prompt-item-row.nav-selected")
            .forEach((e) => e.classList.remove("nav-selected")),
          o >= 0 && o < e.length)
        ) {
          const t = e[o];
          (t.classList.add("nav-selected"),
            t.scrollIntoView({ block: "nearest", behavior: "smooth" }));
        }
      },
      T = (e, t, n, a) => {
        const o = document.createElement("button");
        return (
          (o.className = `action-btn ${e}`),
          setSafeInnerHTML(o, t),
          "function" == typeof createCustomTooltip &&
            createCustomTooltip(o, n, "top"),
          (o.onclick = (e) => {
            (e.stopPropagation(), a(e));
          }),
          o
        );
      },
      _ = (n, a, o) => {
        let r = n.querySelector(".prompt-actions");
        if (
          (r ||
            ((r = document.createElement("div")),
            (r.className = "prompt-actions"),
            n.appendChild(r)),
          setSafeInnerHTML(r, ""),
          o)
        ) {
          (n.classList.add("drag-mode"), (n.draggable = !0));
          const e = a.isFixed ? "Unpin" : "Pin",
            t = a.isFixed ? "unpin" : "pin";
          (r.appendChild(
            T(t, ICONS.pin, e, async () => {
              ((a.isFixed = !a.isFixed),
                await updateById(a.id, { isFixed: a.isFixed }),
                _(n, a, !0));
            }),
          ),
            r.appendChild(
              T("restore", ICONS.save, "Save", () => {
                _(n, a, !1);
              }),
            ));
        } else
          (n.classList.remove("drag-mode"),
            (n.draggable = !1),
            r.appendChild(
              T("edit", ICONS.edit, "Edit", () =>
                openPromptModal(a),
              ),
            ),
            r.appendChild(
              T("copy", ICONS.copy, "Copy", async () => {
                const n = await getRawPrompts(),
                  o = generatePromptId(),
                  {
                    id: r,
                    isShared: s,
                    sharedUrl: i,
                    updateInterval: l,
                    lastUpdateCheck: c,
                    version: d,
                    author: p,
                    summary: m,
                    changelogText: u,
                    ...g
                  } = a;
                ((n[o] = {
                  ...g,
                  title: a.title + " (Copy)",
                  usageCount: 0,
                  isFixed: !1,
                  isShared: !1,
                }),
                  await saveRawPrompts(n),
                  "function" == typeof showNotification &&
                    showNotification("Copied Successfully!", "success"),
                  await refreshMenu(e, t));
              }),
            ),
            r.appendChild(
              T("delete", ICONS.delete, "Delete", async () => {
                if (
                  await createDialogo({
                    message: `Delete prompt "${a.title}"?`,
                    type: "confirm",
                  })
                ) {
                  (await removeById(a.id),
                    "function" == typeof showNotification &&
                      showNotification("Deleted Successfully!"),
                    n.remove());
                  0 === b.querySelectorAll(".prompt-item-row").length &&
                    ((x.textContent = "No saved prompts."),
                    (x.style.display = "block"));
                }
              }),
            ),
            r.appendChild(
              T("drag", ICONS.drag, "Move", () => _(n, a, !0)),
            ),
            a.isFixed &&
              r.appendChild(
                T("unpin", ICONS.pin, "Unpin", async () => {
                  ((a.isFixed = !1),
                    await updateById(a.id, { isFixed: !1 }),
                    _(n, a, !1));
                }),
              ));
      },
      w = async (e, t) => {
        if (e === t) return;
        const n = b.querySelector(`[data-prompt-id="${e}"]`),
          a = b.querySelector(`[data-prompt-id="${t}"]`);
        if (!n || !a) return;
        const o = Array.from(b.querySelectorAll(".prompt-item-row"));
        (o.indexOf(n) < o.indexOf(a) ? a.after(n) : a.before(n),
          await (async () => {
            const e = b.querySelectorAll(".prompt-item-row"),
              t = await getRawPrompts();
            let n = 1;
            (e.forEach((e) => {
              const a = e.dataset.promptId;
              t[a] && (t[a].position = n++);
            }),
              await saveRawPrompts(t));
          })());
      },
      S = () => {
        b.querySelectorAll(".prompt-item-row").forEach((e) => e.remove());
        let t = r.filter((e) => promptMatchesFilter(e));
        t = applyGlobalSortMode(t, window.__mpSortMode || "manual");
        const n = c.value.toLowerCase();
        if (0 === t.length) {
          const e =
            void 0 !== currentTagsConfig &&
            currentTagsConfig.activeFilters &&
            currentTagsConfig.activeFilters.length > 0;
          return (
            (x.textContent = e ? "No prompts match search." : "No saved prompts."),
            void (x.style.display = "block")
          );
        }
        ((x.style.display = "none"),
          (x.textContent = "No prompts match search."));
        let a = 0;
        (t.forEach((t) => {
          const r = document.createElement("div");
          ((r.className = "prompt-item-row"),
            (r.dataset.searchText = (t.title + " " + t.text).toLowerCase()),
            (r.dataset.promptId = t.id),
            n && !r.dataset.searchText.includes(n)
              ? (r.style.display = "none")
              : ((r.style.display = "flex"), a++),
            r.addEventListener("dragstart", (e) => {
              (e.stopPropagation(),
                (e.dataTransfer.effectAllowed = "move"),
                e.dataTransfer.setData("text/plain", t.id),
                (r.style.opacity = "0.5"));
            }),
            r.addEventListener("dragover", (e) => {
              (e.preventDefault(),
                e.stopPropagation(),
                (e.dataTransfer.dropEffect = "move"),
                r.classList.add("nav-selected"));
              const t = b.getBoundingClientRect(),
                n = e.clientY - t.top;
              n < 40
                ? (b.scrollTop -= 10)
                : n > t.height - 40 && (b.scrollTop += 10);
            }),
            r.addEventListener("dragleave", (e) => {
              (e.stopPropagation(), r.classList.remove("nav-selected"));
            }),
            r.addEventListener("dragend", (e) => {
              (e.stopPropagation(),
                (r.style.opacity = "1"),
                b
                  .querySelectorAll(".prompt-item-row")
                  .forEach((e) => e.classList.remove("nav-selected")));
            }),
            r.addEventListener("drop", (e) => {
              (e.stopPropagation(),
                e.preventDefault(),
                r.classList.remove("nav-selected"));
              const n = e.dataTransfer.getData("text/plain");
              n && w(n, t.id);
            }),
            (r.onmouseenter = () => {
              b.querySelector(".drag-mode") || ((o = -1), C());
            }),
            void 0 !== currentPreviewPromptConfig &&
              currentPreviewPromptConfig.normal &&
              t.text &&
              createCustomTooltip(
                r,
                { previewMode: !0, text: t.text },
                "left",
              ));
          const s = document.createElement("div");
          s.style.cssText =
            "flex: 1; display: flex; flex-direction: column; overflow: hidden;";
          const i = document.createElement("div");
          ((i.className = "prompt-title"),
            (i.textContent = t.title),
            t.color && i.style.setProperty("color", t.color, "important"));
          const l = async () => {
            r.classList.contains("drag-mode") ||
              ((t.usageCount = (t.usageCount || 0) + 1),
              await updateById(t.id, { usageCount: t.usageCount }),
              void 0 !== currentPlaceholderModal &&
                currentPlaceholderModal &&
                (currentPlaceholderModal.dataset.fromInline = "false"),
              t.usePlaceholders ? openPlaceholderModal(t) : insertPrompt(t),
              closeMenu());
          };
          if (
            ((i.onclick = (e) => {
              (e.stopPropagation(), l());
            }),
            (r.executeItem = l),
            s.appendChild(i),
            t.tags && t.tags.length > 0)
          ) {
            const e = document.createElement("div");
            ((e.className = "prompt-tags-container"),
              t.tags.forEach((t) => {
                const n = getTag(t);
                n && e.appendChild(createTagBadge(n));
              }),
              s.appendChild(e));
          }
          r.appendChild(s);
          const c = t.id === e;
          (_(r, t, c), b.appendChild(r));
        }),
          0 === a && n && (x.style.display = "block"));
      };
    (S(),
      currentMenu.appendChild(b),
      setupEnhancedScroll(b),
      e
        ? a > 0
          ? (b.scrollTop = a)
          : setTimeout(() => {
              const t = b.querySelector(`[data-prompt-id="${e}"]`);
              t && t.scrollIntoView({ block: "nearest" });
            }, 50)
        : a > 0 && (b.scrollTop = a),
      (c.oninput = (e) => {
        const t = e.target.value.toLowerCase(),
          n = b.querySelectorAll(".prompt-item-row");
        let a = 0;
        ((o = -1),
          n.forEach((e) => {
            e.dataset.searchText && e.dataset.searchText.includes(t)
              ? ((e.style.display = "flex"), a++)
              : (e.style.display = "none");
          }),
          C(),
          (x.style.display = 0 === a ? "block" : "none"));
      }),
      (c.onkeydown = (e) => {
        if ("Escape" === e.key) return void closeMenu();
        const t = Array.from(b.querySelectorAll(".prompt-item-row")).filter(
          (e) => "none" !== e.style.display,
        );
        0 !== t.length &&
          ("ArrowDown" === e.key
            ? (e.preventDefault(), o++, o >= t.length && (o = 0), C())
            : "ArrowUp" === e.key
              ? (e.preventDefault(), o--, o < 0 && (o = t.length - 1), C())
              : "Enter" === e.key &&
                o >= 0 &&
                t[o].executeItem &&
                (e.preventDefault(), t[o].executeItem()));
      }));
    const E = document.createElement("div");
    E.className = "menu-footer-grid";
    const M = (e, t, n, a) => {
      const o = document.createElement("button");
      return (
        (o.className = `menu-footer-btn ${e}`),
        setSafeInnerHTML(o, t),
        "function" == typeof createCustomTooltip &&
          createCustomTooltip(o, n, "bottom"),
        (o.onclick = a),
        o
      );
    };
    (E.appendChild(
      M("btn-export", ICONS.export, "Export Prompt", (e) => {
        (e.stopPropagation(), exportPrompts());
      }),
    ),
      E.appendChild(
        M("btn-add", ICONS.add, "New Prompt", (e) => {
          (e.stopPropagation(), openPromptModal());
        }),
      ),
      E.appendChild(
        M("btn-import", ICONS.import, "Import Prompt", (e) => {
          (e.stopPropagation(), importPrompts());
        }),
      ),
      currentMenu.appendChild(E),
      _abrirPesquisaComAtalho &&
        ((l.style.transform = "translateX(0)"),
        setTimeout(() => c.focus(), 50),
        (_abrirPesquisaComAtalho = !1)),
      (currentMenu._filterCleanup = () => {
        (document.removeEventListener("click", y), f.parentNode && f.remove());
      }));
  }
  async function openExpandedPromptMenu() {
    const e = "Columns";
    let t = await getAll(),
      n = await GM_getValue(e, 3),
      a = !1,
      o = !1,
      r = new Set(),
      s = -1,
      i = -1,
      l = null,
      c = 0;
    const d = document.createElement("div");
    ((d.className = "mp-expanded-overlay"),
      (d.onclick = (e) => {
        e.target === d && z();
      }));
    const p = document.createElement("div");
    p.className = "mp-expanded-modal";
    const m = document.createElement("div");
    m.className = "mp-expanded-header";
    const u = document.createElement("div");
    u.className = "mp-expanded-actions-left";
    const g = document.createElement("div");
    g.className = "mp-expanded-search-container";
    const f = document.createElement("input");
    ((f.className = "mp-expanded-search"),
      (f.placeholder = "Search"),
      (f.type = "text"),
      g.appendChild(f));
    const h = document.createElement("div");
    ((h.className = "mp-expanded-list"),
      (h.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`));
    const v = (e, t, n, a) => {
        const o = document.createElement("button");
        return (
          (o.className = `mp-pinned-action-btn ${e}`),
          setSafeInnerHTML(o, t),
          "function" == typeof createCustomTooltip &&
            createCustomTooltip(o, n, "bottom"),
          (o.onclick = a),
          o
        );
      },
      y = () => {
        const e = a || o;
        if (
          ((A.style.display = e ? "none" : "flex"),
          (N.style.display = e ? "none" : "flex"),
          (I.style.display = e ? "none" : "flex"),
          (k.style.display = e ? "none" : "flex"),
          (x.style.display = e ? "none" : "flex"),
          (C.style.display = e ? "none" : "flex"),
          (b.style.display = e ? "none" : "flex"),
          (T.style.display = e ? "none" : "flex"),
          (_.style.display = o ? "flex" : "none"),
          (w.style.display = o ? "flex" : "none"),
          (S.style.display = o ? "flex" : "none"),
          (E.style.display = a ? "flex" : "none"),
          (M.style.display = a ? "flex" : "none"),
          o)
        ) {
          const e = Array.from(h.querySelectorAll(".prompt-item-row")).filter(
            (e) => "none" !== e.style.display,
          );
          (e.length > 0 && e.every((e) => r.has(e.dataset.promptId))
            ? _.classList.add("active")
            : _.classList.remove("active"),
            w.classList.toggle("has-selection", r.size > 0));
        }
      },
      b = v("btn-add", ICONS.add, "New Prompt", () => {
        (z(), openPromptModal());
      }),
      x = v("btn-export", ICONS.export, "Export Prompt", () => {
        (z(), exportPrompts());
      }),
      C = v("btn-import", ICONS.import, "Import Prompt", () => {
        (z(), importPrompts());
      }),
      T = v("btn-close", ICONS.close, "Close", () => z()),
      _ = v("btn-select-all", ICONS.check, "Select All", () => {
        const e = Array.from(h.querySelectorAll(".prompt-item-row")).filter(
          (e) => "none" !== e.style.display,
        );
        (e.length > 0 && e.every((e) => r.has(e.dataset.promptId))
          ? e.forEach((e) => r.delete(e.dataset.promptId))
          : e.forEach((e) => r.add(e.dataset.promptId)),
          y(),
          K());
      }),
      w = v("btn-delete", ICONS.delete, "Delete", async () => {
        r.size > 0 && (await L());
      }),
      S = v("btn-close", ICONS.close, "Close", () => {
        ((o = !1), r.clear(), y(), K());
      }),
      E = v("btn-save", ICONS.save, "Save", async () => {
        (await H(), (t = await getAll()), (a = !1), y(), K());
      }),
      M = v("btn-close", ICONS.close, "Close", async () => {
        ((a = !1), (t = await getAll()), y(), K());
      }),
      I = v("btn-move", ICONS.drag, "Move", () => {
        ((a = !0),
          document.querySelector(".mp-expanded-filter-dropdown") &&
            document
              .querySelector(".mp-expanded-filter-dropdown")
              .classList.remove("visible"),
          y(),
          K());
      }),
      k = v("btn-delete", ICONS.delete, "Delete", () => {
        ((o = !0),
          document.querySelector(".mp-expanded-filter-dropdown") &&
            document
              .querySelector(".mp-expanded-filter-dropdown")
              .classList.remove("visible"),
          y(),
          K());
      }),
      L = async () => {
        if (
          await createDialogo({
            message: `Delete ${r.size} prompts?`,
            type: "confirm",
          })
        ) {
          for (let e of r) await removeById(e);
          ("function" == typeof showNotification &&
            showNotification("Deleted Successfully!"),
            (t = await getAll()),
            (o = !1),
            r.clear(),
            (s = -1),
            y(),
            K());
        }
      },
      P = (e) =>
        1 === e ? ICONS.navMenu : 2 === e ? ICONS.grid2 : ICONS.grid3,
      N = v("btn-cols", P(n), "Columns", async () => {
        ((n = n >= 3 ? 1 : n + 1),
          setSafeInnerHTML(N, P(n)),
          await Promise.resolve(GM_setValue(e, n)),
          (h.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`));
      }),
      A = v("btn-filter", ICONS.filter, "Filter", (e) => {
        (e.stopPropagation(), O(A));
      }),
      q = () => {
        const e =
            void 0 !== currentTagsConfig &&
            currentTagsConfig.activeFilters &&
            currentTagsConfig.activeFilters.length > 0,
          t = window.__mpSortMode && "manual" !== window.__mpSortMode;
        e || t
          ? (A.classList.add("active"),
            setSafeInnerHTML(A, ICONS.filterAct || ICONS.filter))
          : (A.classList.remove("active"), setSafeInnerHTML(A, ICONS.filter));
      };
    (q(),
      u.appendChild(A),
      u.appendChild(N),
      u.appendChild(_),
      u.appendChild(w),
      u.appendChild(S),
      u.appendChild(E),
      u.appendChild(M),
      u.appendChild(I),
      u.appendChild(k),
      u.appendChild(x),
      u.appendChild(C),
      u.appendChild(b),
      u.appendChild(T),
      y(),
      m.appendChild(g),
      m.appendChild(u),
      p.appendChild(m));
    const $ = buildSharedFilterDropdown({
      dropdownClass: "mp-filter-dropdown mp-expanded-filter-dropdown",
      selectId: "mp-sort-select-expanded",
      onStateChange: () => {
        (q(), K());
      },
      onManageClick: () => {
        (z(), openTagsManager());
      },
    });
    document.body.appendChild($);
    const O = (e) => {
        if ($.classList.contains("visible")) $.classList.remove("visible");
        else {
          $.rebuild();
          const t = e.getBoundingClientRect();
          (($.style.position = "fixed"), ($.style.top = `${t.bottom + 8}px`));
          let n = t.left;
          (n + 220 > window.innerWidth && (n = window.innerWidth - 228),
            ($.style.left = `${n}px`),
            ($.style.maxHeight = "280px"),
            $.classList.add("visible"));
        }
      },
      D = (e) => {
        $.contains(e.target) ||
          A.contains(e.target) ||
          $.classList.remove("visible");
      };
    document.addEventListener("click", D);
    const F = document.createElement("div");
    ((F.className = "empty-state"),
      p.appendChild(h),
      p.appendChild(F),
      setupEnhancedScroll(h));
    const H = async () => {
        const e = h.querySelectorAll(".prompt-item-row"),
          t = await getRawPrompts();
        let n = 1;
        (e.forEach((e) => {
          const a = e.dataset.promptId;
          t[a] && (t[a].position = n++);
        }),
          await saveRawPrompts(t));
      },
      B = (e) => {
        c !== e &&
          ((c = e),
          l && clearInterval(l),
          (l = setInterval(() => {
            h.scrollTop += c;
          }, 20)));
      },
      R = () => {
        (l && (clearInterval(l), (l = null)), (c = 0));
      },
      G = (e) => {
        if (!e) return;
        const t = h.getBoundingClientRect();
        e >= t.top && e <= t.top + 80
          ? B(-15)
          : e <= t.bottom && e >= t.bottom - 80
            ? B(15)
            : R();
      };
    (h.addEventListener("dragover", (e) => {
      a && (e.preventDefault(), G(e.clientY));
    }),
      h.addEventListener("dragleave", (e) => {
        h.contains(e.relatedTarget) || R();
      }),
      h.addEventListener("drop", () => R()));
    const U = (e, t, n, a) => {
        const o = document.createElement("button");
        return (
          (o.className = `action-btn ${e}`),
          setSafeInnerHTML(o, t),
          "function" == typeof createCustomTooltip &&
            createCustomTooltip(o, n, "top"),
          (o.onclick = (e) => {
            (e.stopPropagation(), a(e));
          }),
          o
        );
      },
      K = () => {
        setSafeInnerHTML(h, "");
        let e = t.filter((e) => promptMatchesFilter(e));
        e = applyGlobalSortMode(e, window.__mpSortMode || "manual");
        const i = f.value.toLowerCase();
        if (0 === e.length) {
          const e =
            void 0 !== currentTagsConfig &&
            currentTagsConfig.activeFilters &&
            currentTagsConfig.activeFilters.length > 0;
          return (
            (F.textContent = e ? "No prompts match search." : "No saved prompts."),
            void (F.style.display = "block")
          );
        }
        ((F.style.display = "none"),
          (F.textContent = "No prompts match search."));
        let l = 0,
          c = 0;
        (e.forEach((e) => {
          const d = document.createElement("div");
          if (
            ((d.className = "prompt-item-row expanded-mode"),
            (d.dataset.searchText = (e.title + " " + e.text).toLowerCase()),
            (d.dataset.promptId = e.id),
            i && !d.dataset.searchText.includes(i)
              ? (d.style.display = "none")
              : ((d.style.display = "flex"), l++, c++),
            n > 1 && !o)
          ) {
            const e = document.createElement("div");
            ((e.className = "mp-prompt-index"),
              (e.style.cssText =
                "font-family: var(--mp-font-family-base); color: var(--mp-text-secondary); font-size: 11px; min-width: 20px; text-align: center; opacity: 0.6; font-weight: bold;"),
              (e.textContent = "none" === d.style.display ? "" : c),
              d.appendChild(e));
          }
          if (o) {
            d.style.cursor = "pointer";
            const t = document.createElement("div");
            ((t.style.paddingRight = "12px"),
              (t.style.display = "flex"),
              (t.style.alignItems = "center"));
            const n = document.createElement("input");
            ((n.type = "checkbox"),
              (n.className = "mp-checkbox"),
              (n.checked = r.has(e.id)),
              (n.style.pointerEvents = "none"),
              t.appendChild(n),
              d.appendChild(t));
          }
          const p = document.createElement("div");
          p.style.cssText =
            "flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; padding: 0 8px; justify-content: center;";
          const m = document.createElement("div");
          if (
            ((m.className = "prompt-title"),
            (m.textContent = e.title),
            e.color && m.style.setProperty("color", e.color, "important"),
            p.appendChild(m),
            e.tags && e.tags.length > 0)
          ) {
            const t = document.createElement("div");
            ((t.className = "prompt-tags-container"),
              e.tags.forEach((e) => {
                const n = getTag(e);
                n && t.appendChild(createTagBadge(n));
              }),
              p.appendChild(t));
          }
          d.appendChild(p);
          const u = document.createElement("div");
          if (((u.className = "prompt-actions"), a)) {
            (d.classList.add("drag-mode"),
              (d.draggable = !0),
              (d.style.border = "1px dashed var(--mp-accent-primary)"));
            const n = e.isFixed
                ? "Unpin"
                : "Pin",
              a = e.isFixed ? "unpin" : "pin",
              o = async (n) => {
                const a = n.currentTarget;
                ((e.isFixed = !e.isFixed),
                  await updateById(e.id, { isFixed: e.isFixed }));
                const r = t.find((t) => t.id === e.id);
                r && (r.isFixed = e.isFixed);
                const s = e.isFixed
                    ? "Unpin"
                    : "Pin",
                  i = e.isFixed ? "unpin" : "pin",
                  l = U(i, ICONS.pin, s, o);
                a.replaceWith(l);
              };
            (u.appendChild(U(a, ICONS.pin, n, o)),
              d.addEventListener("dragstart", (t) => {
                (t.stopPropagation(),
                  (t.dataTransfer.effectAllowed = "move"),
                  t.dataTransfer.setData("text/plain", e.id),
                  (d.style.opacity = "0.5"));
              }),
              d.addEventListener("drag", (e) => {
                e.clientY > 0 && G(e.clientY);
              }),
              d.addEventListener("dragover", (e) => {
                (e.preventDefault(),
                  e.stopPropagation(),
                  (e.dataTransfer.dropEffect = "move"),
                  d.classList.add("nav-selected"),
                  G(e.clientY));
              }),
              d.addEventListener("dragleave", (e) => {
                (e.stopPropagation(), d.classList.remove("nav-selected"));
              }),
              d.addEventListener("dragend", (e) => {
                (e.stopPropagation(),
                  (d.style.opacity = "1"),
                  h
                    .querySelectorAll(".prompt-item-row")
                    .forEach((e) => e.classList.remove("nav-selected")),
                  R());
              }),
              d.addEventListener("drop", (t) => {
                (t.stopPropagation(),
                  t.preventDefault(),
                  d.classList.remove("nav-selected"));
                const n = t.dataTransfer.getData("text/plain");
                (n &&
                  (async (e, t) => {
                    if (e === t) return;
                    const n = h.querySelector(`[data-prompt-id="${e}"]`),
                      a = h.querySelector(`[data-prompt-id="${t}"]`);
                    if (!n || !a) return;
                    const o = Array.from(
                      h.querySelectorAll(".prompt-item-row"),
                    );
                    o.indexOf(n) < o.indexOf(a) ? a.after(n) : a.before(n);
                  })(n, e.id),
                  R());
              }));
          } else
            o ||
              (u.appendChild(
                U("edit", ICONS.edit, "Edit", () => {
                  (z(), openPromptModal(e));
                }),
              ),
              u.appendChild(
                U("copy", ICONS.copy, "Copy", async () => {
                  const n = await getRawPrompts(),
                    a = generatePromptId(),
                    {
                      id: o,
                      isShared: r,
                      sharedUrl: s,
                      updateInterval: i,
                      lastUpdateCheck: l,
                      version: c,
                      author: d,
                      summary: p,
                      changelogText: m,
                      ...u
                    } = e;
                  ((n[a] = {
                    ...u,
                    title: e.title + " (Copy)",
                    usageCount: 0,
                    isFixed: !1,
                    isShared: !1,
                  }),
                    await saveRawPrompts(n),
                    "function" == typeof showNotification &&
                      showNotification(
                        "Copied Successfully!",
                        "success",
                      ),
                    (t = await getAll()),
                    K());
                }),
              ),
              u.appendChild(
                U(
                  "delete",
                  ICONS.delete,
                  "Delete",
                  async () => {
                    (await createDialogo({
                      message: `Delete prompt "${e.title}"?`,
                      type: "confirm",
                    })) &&
                      (await removeById(e.id),
                      "function" == typeof showNotification &&
                        showNotification("Deleted Successfully!"),
                      (t = await getAll()),
                      K());
                  },
                ),
              ),
              e.isFixed &&
                u.appendChild(
                  U("unpin", ICONS.pin, "Unpin", async () => {
                    ((e.isFixed = !1),
                      await updateById(e.id, { isFixed: !1 }),
                      (t = await getAll()),
                      K());
                  }),
                ));
          (d.appendChild(u), h.appendChild(d));
          const g = async () => {
            a ||
              o ||
              ((e.usageCount = (e.usageCount || 0) + 1),
              await updateById(e.id, { usageCount: e.usageCount }),
              void 0 !== currentPlaceholderModal &&
                currentPlaceholderModal &&
                (currentPlaceholderModal.dataset.fromInline = "false"),
              e.usePlaceholders ? openPlaceholderModal(e) : insertPrompt(e),
              z());
          };
          ((d.executeItem = g),
            void 0 !== currentPreviewPromptConfig &&
              currentPreviewPromptConfig.expand &&
              e.text &&
              !a &&
              !o &&
              createCustomTooltip(d, { previewMode: !0, text: e.text }, "left"),
            (d.onclick = (t) => {
              if ((t.stopPropagation(), o)) {
                const n = Array.from(
                    h.querySelectorAll(".prompt-item-row"),
                  ).filter((e) => "none" !== e.style.display),
                  a = n.indexOf(d),
                  o = !r.has(e.id);
                if (t.shiftKey && -1 !== s) {
                  const e = Math.min(a, s),
                    t = Math.max(a, s);
                  for (let a = e; a <= t; a++) {
                    const e = n[a].dataset.promptId;
                    o ? r.add(e) : r.delete(e);
                    const t = n[a].querySelector(".mp-checkbox");
                    t && (t.checked = r.has(e));
                  }
                } else {
                  o ? r.add(e.id) : r.delete(e.id);
                  const t = d.querySelector(".mp-checkbox");
                  t && (t.checked = r.has(e.id));
                }
                ((s = a), y());
              } else a || g();
            }));
        }),
          0 === l && i && (F.style.display = "block"));
      };
    K();
    const V = (e) => {
        e.forEach((e, t) => {
          t === i
            ? (e.classList.add("nav-selected"),
              e.scrollIntoView({ block: "nearest" }))
            : e.classList.remove("nav-selected");
        });
      },
      j = (e) => {
        if (!d.parentNode) return;
        const t = Array.from(h.querySelectorAll(".prompt-item-row")).filter(
          (e) => "none" !== e.style.display,
        );
        0 !== t.length &&
          ("ArrowDown" === e.key
            ? (e.preventDefault(),
              (i = -1 === i ? 0 : (i + 1) % t.length),
              V(t))
            : "ArrowUp" === e.key
              ? (e.preventDefault(),
                (i = -1 === i ? t.length - 1 : (i - 1 + t.length) % t.length),
                V(t))
              : "Enter" === e.key &&
                i >= 0 &&
                i < t.length &&
                (e.preventDefault(), t[i].executeItem && t[i].executeItem()));
      };
    (document.addEventListener("keydown", j),
      (f.oninput = () => {
        ((i = -1), (s = -1), K());
      }));
    const z = () => {
      (document.removeEventListener("keydown", j),
        document.removeEventListener("click", D),
        $.parentNode && $.remove());
      (d.querySelectorAll("button, [aria-describedby]").forEach((e) => {
        "function" == typeof e._removeTooltipEvents && e._removeTooltipEvents();
      }),
        d.parentNode && d.parentNode.removeChild(d));
    };
    (d.appendChild(p),
      document.body.appendChild(d),
      setTimeout(() => f.focus(), 50));
  }
  function closeMenu() {
    (currentMenu &&
      (currentMenu._filterCleanup && currentMenu._filterCleanup(),
      currentMenu.classList.contains("visible") &&
        currentMenu.classList.remove("visible")),
      document
        .querySelectorAll(".mp-filter-dropdown")
        .forEach((e) => e.remove()),
      window.__mpSortMode &&
        "manual" !== window.__mpSortMode &&
        (window.__mpSortMode = "manual"),
      currentTagsConfig &&
        currentTagsConfig.activeFilters &&
        currentTagsConfig.activeFilters.length > 0 &&
        clearTagFilters());
  }
  function openPlaceholderModal(e) {
    const {
      processedText: t,
      ignoreMap: n,
      selectMap: a,
      inputMap: o,
      fileMap: r,
    } = parsePromptInternal(e.text);
    if (0 === a.size && 0 === o.size && 0 === r.size) {
      let a = t;
      n.forEach((e, t) => {
        a = a.replace(t, e);
      });
      return void insertPrompt({ ...e, text: a });
    }
    if (!currentPlaceholderModal) return;
    const s = document.getElementById("__ap_placeholder_modal_title");
    s &&
      ((s.textContent = e.title || "Fill in Information"),
      e.color
        ? s.style.setProperty("color", e.color, "important")
        : s.style.removeProperty("color"));
    const i = document.getElementById("__ap_placeholders_container");
    (setSafeInnerHTML(i, ""),
      (currentPlaceholderModal.dataset.parseData = JSON.stringify({
        processedText: t,
        ignoreMap: Array.from(n.entries()),
        selectMap: Array.from(a.entries()),
        inputMap: Array.from(o.entries()),
        fileMap: Array.from(r.entries()),
      })),
      (currentPlaceholderModal.dataset.promptId = e.id || ""),
      (currentPlaceholderModal.dataset.originalItem = JSON.stringify(e)),
      currentPlaceholderModal._tempFiles ||
        (currentPlaceholderModal._tempFiles = new Map()),
      currentPlaceholderModal._tempFiles.clear());
    const l = t.match(/__(FILE|INPUT|SELECT)_\d+__/g) || [],
      c = new Set();
    (l.forEach((e) => {
      if (!c.has(e))
        if ((c.add(e), e.startsWith("__FILE_") && r.has(e))) {
          const t = r.get(e),
            n = document.createElement("div");
          ((n.className = "form-group"), (n.dataset.fileKey = e));
          const a = document.createElement("label");
          ((a.className = "form-label"),
            (a.textContent = t.title),
            n.appendChild(a));
          const o = document.createElement("div");
          o.className = "mp-file-scroll-wrapper mp-dynamic-dropzone";
          const s = document.createElement("div");
          ((s.className = "mp-file-grid mp-dynamic-grid-w100"),
            o.appendChild(s));
          const l = document.createElement("input");
          ((l.type = "file"),
            (l.multiple = !0),
            (l.className = "mp-hidden-file-input"),
            n.appendChild(o),
            n.appendChild(l));
          const c = () => {
            const t = currentPlaceholderModal._tempFiles.get(e) || [];
            if ((setSafeInnerHTML(s, ""), 0 === t.length)) {
              (s.classList.add("empty-state"), o.classList.add("empty-state"));
              const e = document.createElement("div");
              e.className = "mp-empty-state-container";
              const t = document.createElement("div");
              ((t.className = "mp-file-empty-icon"),
                setSafeInnerHTML(t, ICONS.cloudFile));
              const n = document.createElement("div");
              ((n.className = "mp-file-empty-subtext"),
                (n.textContent = "click to select or drag to add"),
                e.appendChild(t),
                e.appendChild(n),
                s.appendChild(e));
            } else {
              (s.classList.remove("empty-state"),
                o.classList.remove("empty-state"));
              const e = document.createElement("div");
              ((e.className = "mp-add-file-card"),
                setSafeInnerHTML(e, ICONS.plus),
                (e.onclick = (e) => {
                  (e.stopPropagation(), l.click());
                }),
                s.appendChild(e),
                t.forEach((e, n) => {
                  const a = document.createElement("div");
                  ((a.className = "mp-file-card active"),
                    createCustomTooltip(a, e.name, "bottom"));
                  const o = document.createElement("div");
                  if (
                    ((o.className = "mp-file-delete-perm"),
                    setSafeInnerHTML(o, ICONS.close),
                    (o.onclick = (e) => {
                      (e.stopPropagation(),
                        e.preventDefault(),
                        t.splice(n, 1),
                        c());
                    }),
                    e.type.startsWith("image/"))
                  ) {
                    const t = document.createElement("img");
                    ((t.className = "mp-file-thumb"),
                      (t.src = URL.createObjectURL(e)),
                      a.appendChild(t));
                  } else setSafeInnerHTML(a, ICONS.file);
                  (a.appendChild(o), s.appendChild(a));
                }));
            }
          };
          (currentPlaceholderModal._tempFiles.set(e, []),
            c(),
            (o.onclick = (e) => {
              e.target.closest(".mp-file-delete-perm") || l.click();
            }),
            (o.ondragover = (e) => {
              (e.preventDefault(), o.classList.add("drag-over"));
            }),
            (o.ondragleave = (e) => {
              (e.preventDefault(), o.classList.remove("drag-over"));
            }),
            (o.ondrop = (t) => {
              if (
                (t.preventDefault(),
                o.classList.remove("drag-over"),
                t.dataTransfer.files && t.dataTransfer.files.length > 0)
              ) {
                const n = Array.from(t.dataTransfer.files);
                ((currentPlaceholderModal._tempFiles.get(e) || []).push(...n),
                  c());
              }
            }),
            (l.onchange = (t) => {
              if (t.target.files && t.target.files.length > 0) {
                const n = Array.from(t.target.files);
                ((currentPlaceholderModal._tempFiles.get(e) || []).push(...n),
                  c(),
                  (l.value = ""));
              }
            }),
            i.appendChild(n));
        } else if (e.startsWith("__INPUT_") && o.has(e)) {
          const t = o.get(e),
            r = "string" == typeof t ? t : t.label;
          let s = "object" == typeof t && t.context ? t.context : null;
          s &&
            (o.forEach((e, t) => {
              if (s.includes(t)) {
                const n = "string" == typeof e ? e : e.label;
                s = s.split(t).join(`[${n}]`);
              }
            }),
            a.forEach((e, t) => {
              s.includes(t) && (s = s.split(t).join(`[List: ${e.title}]`));
            }),
            n.forEach((e, t) => {
              s.includes(t) && (s = s.split(t).join("[...Code/Block...]"));
            }));
          const l = document.createElement("div");
          ((l.className = "form-group"), (l.style.marginBottom = "12px"));
          const c = document.createElement("textarea");
          ((c.className = "form-input dynamic-input"),
            (c.dataset.key = e),
            (c.rows = 1),
            (c.style.resize = "vertical"),
            (c.style.height = "auto"),
            (c.placeholder = t.varName ? t.varName : ""),
            t.defaultValue && (c.value = t.defaultValue));
          const d = document.createElement("div");
          d.className = "mp-label-wrapper";
          const p = document.createElement("div");
          p.className = "mp-label-left";
          const m = document.createElement("label");
          ((m.className = "form-label"),
            (m.textContent = r),
            (m.style.marginBottom = "0"),
            p.appendChild(m),
            d.appendChild(p));
          const u = document.createElement("div");
          if (((u.className = "mp-label-right"), s)) {
            const e = document.createElement("button");
            ((e.className = "mp-help-icon"),
              (e.type = "button"),
              setSafeInnerHTML(e, `${ICONS.info}`),
              createCustomTooltip(e, "Description", "top"),
              (e.onclick = (e) => {
                (e.stopPropagation(),
                  l
                    .querySelector(".mp-context-bubble")
                    .classList.toggle("visible"));
              }),
              u.appendChild(e));
          }
          const g = document.createElement("button");
          ((g.className = "mp-enhance-ai-btn"),
            (g.type = "button"),
            setSafeInnerHTML(g, `${ICONS.magic}`),
            createCustomTooltip(g, "Enhance Prompt", "top"),
            g.addEventListener("click", (e) => {
              (e.preventDefault(),
                e.stopPropagation(),
                handleTextareaEnhancement(c, g));
            }),
            u.appendChild(g));
          const f = document.createElement("button");
          if (
            ((f.className = "mp-paste-btn"),
            (f.type = "button"),
            setSafeInnerHTML(f, `${ICONS.paste}`),
            createCustomTooltip(f, "Paste", "top"),
            f.addEventListener("click", async (e) => {
              (e.preventDefault(), e.stopPropagation());
              try {
                const e = await navigator.clipboard.readText();
                if (e) {
                  const t = c.selectionStart,
                    n = c.selectionEnd,
                    a = c.value;
                  ((c.value = a.substring(0, t) + e + a.substring(n)),
                    (c.selectionStart = c.selectionEnd = t + e.length),
                    c.dispatchEvent(new Event("input", { bubbles: !0 })),
                    c.focus());
                }
              } catch (e) {}
            }),
            u.appendChild(f),
            d.appendChild(u),
            l.appendChild(d),
            s)
          ) {
            const e = document.createElement("div");
            ((e.className = "mp-context-bubble"),
              (e.textContent = s),
              l.appendChild(e));
          }
          (c.addEventListener("keydown", (e) => {
            if (!e.isComposing && 229 !== e.keyCode) {
              if (isShortcutPressed(e, "lineBreak")) {
                (e.preventDefault(), e.stopPropagation());
                const t = c.selectionStart,
                  n = c.selectionEnd,
                  a = c.value;
                return (
                  (c.value = a.substring(0, t) + "\n" + a.substring(n)),
                  (c.selectionStart = c.selectionEnd = t + 1),
                  void c.dispatchEvent(new Event("input", { bubbles: !0 }))
                );
              }
              if (isShortcutPressed(e, "saveSend"))
                return (
                  e.preventDefault(),
                  e.stopPropagation(),
                  void document.getElementById("__ap_insert_prompt").click()
                );
              if (isShortcutPressed(e, "enhancePrompt"))
                return (
                  e.preventDefault(),
                  e.stopPropagation(),
                  void (
                    document.activeElement === c &&
                    handleTextareaEnhancement(c, g)
                  )
                );
              if ("Enter" === e.key) {
                if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;
                (e.preventDefault(),
                  e.stopPropagation(),
                  document.getElementById("__ap_insert_prompt").click());
              }
            }
          }),
            l.appendChild(c),
            i.appendChild(l));
        } else if (e.startsWith("__SELECT_") && a.has(e)) {
          const t = a.get(e),
            n = document.createElement("div");
          ((n.dataset.selectKey = e), (n.style.marginBottom = "16px"));
          let o = null;
          if (t.options.length > 0 && "header" !== t.options[0].type) {
            const e = document.createElement("label");
            ((e.className = "form-label"),
              (e.textContent = t.title),
              (e.style.marginBottom = "6px"),
              n.appendChild(e),
              (o = document.createElement("div")),
              (o.className = "mp-option-group"),
              n.appendChild(o));
          }
          (t.options.forEach((e) => {
            if ("header" === e.type) {
              if (n.children.length > 0) {
                const e = document.createElement("div");
                ((e.style.height = "8px"), n.appendChild(e));
              }
              const t = document.createElement("div");
              t.style.width = "100%";
              const a = document.createElement("div");
              a.className = "mp-label-wrapper";
              const r = document.createElement("div");
              r.className = "mp-label-left";
              const s = document.createElement("label");
              if (
                ((s.className = "form-label"),
                (s.textContent = e.label),
                r.appendChild(s),
                a.appendChild(r),
                e.comment)
              ) {
                const e = document.createElement("div");
                e.className = "mp-label-right";
                const n = document.createElement("button");
                ((n.className = "mp-help-icon"),
                  (n.type = "button"),
                  setSafeInnerHTML(n, `${ICONS.info}`),
                  createCustomTooltip(n, "Description", "top"),
                  (n.onclick = (e) => {
                    (e.stopPropagation(), e.preventDefault());
                    const n = t.querySelector(".mp-context-bubble");
                    n && n.classList.toggle("visible");
                  }),
                  e.appendChild(n),
                  a.appendChild(e));
              }
              if ((t.appendChild(a), e.comment)) {
                const n = document.createElement("div");
                ((n.className = "mp-context-bubble"),
                  (n.textContent = e.comment),
                  t.appendChild(n));
              }
              (n.appendChild(t),
                (o = document.createElement("div")),
                (o.className = "mp-option-group"),
                n.appendChild(o));
            } else {
              o ||
                ((o = document.createElement("div")),
                (o.className = "mp-option-group"),
                n.appendChild(o));
              const t = document.createElement("label");
              if (((t.className = "mp-option-item"), "id" === e.type && e.id)) {
                const n = getColorForId(e.id);
                t.style.cssText = `border-left: 5px solid ${n} !important; padding-left: 8px; flex-wrap: wrap;`;
              } else
                "sovereign" === e.type
                  ? ((t.style.cssText =
                      "border-left: 5px solid #FF4444 !important; padding-left: 8px; flex-wrap: wrap;"),
                    (t.style.color = "var(--mp-accent-close)"),
                    (t.style.fontWeight = "600"))
                  : "other" === e.type
                    ? ((t.style.cssText =
                        "border-left: 5px solid var(--mp-accent-primary) !important; padding-left: 8px; flex-wrap: wrap;"),
                      (t.style.color = "var(--mp-accent-primary)"),
                      (t.style.fontWeight = "600"))
                    : ((t.style.borderLeft = "5px solid transparent"),
                      (t.style.flexWrap = "wrap"));
              const a = document.createElement("input");
              ((a.type = "checkbox"),
                (a.className = "mp-checkbox"),
                (a.dataset.type = e.type),
                e.id && (a.dataset.id = e.id),
                (a.value = e.value),
                (a.onchange = function () {
                  const e = this.closest(".mp-option-group");
                  if (this.checked) {
                    const t = Array.from(
                        e.querySelectorAll('input[type="checkbox"]'),
                      ),
                      n = this.dataset.type,
                      a = this.dataset.id;
                    t.forEach((e) => {
                      e !== this &&
                        ("sovereign" === n
                          ? (e.checked = !1)
                          : "other" === n
                            ? "sovereign" === e.dataset.type && (e.checked = !1)
                            : ("sovereign" === e.dataset.type &&
                                (e.checked = !1),
                              "id" === n &&
                                "id" === e.dataset.type &&
                                e.dataset.id === a &&
                                (e.checked = !1)));
                    });
                  }
                  Array.from(
                    e.querySelectorAll('input[type="checkbox"]'),
                  ).forEach((e) => {
                    const t = e
                      .closest(".mp-option-item")
                      .querySelector(".mp-other-container");
                    if (t)
                      if (e.checked) {
                        t.style.display = "flex";
                        const e = t.querySelector(".mp-other-input");
                        e && setTimeout(() => e.focus(), 50);
                      } else {
                        t.style.display = "none";
                        t.querySelectorAll(".mp-other-input").forEach((e) => {
                          e.value = e.dataset.defValue || "";
                        });
                      }
                  });
                }),
                e.isDefault &&
                  ((a.checked = !0),
                  setTimeout(() => a.dispatchEvent(new Event("change")), 10)));
              const r = document.createElement("span");
              ((r.className = "mp-option-text"),
                (r.textContent = e.label),
                (r.style.flex = "1"));
              const s = document.createElement("div");
              if (
                ((s.style.cssText =
                  "display: flex; align-items: center; gap: 8px; width: 100%; white-space: normal; overflow-wrap: break-word; word-break: break-word;"),
                s.appendChild(a),
                s.appendChild(r),
                e.comment)
              ) {
                const e = document.createElement("button");
                ((e.className = "mp-help-icon"),
                  (e.type = "button"),
                  setSafeInnerHTML(e, `${ICONS.info}`),
                  createCustomTooltip(e, "Description", "top"),
                  (e.onclick = (e) => {
                    (e.preventDefault(), e.stopPropagation());
                    const n = t.querySelector(".mp-context-bubble");
                    n &&
                      (n.classList.toggle("visible"),
                      (n.style.marginBottom = "0"));
                  }),
                  s.appendChild(e));
              }
              if ((t.appendChild(s), e.comment)) {
                const n = document.createElement("div");
                ((n.className = "mp-context-bubble"),
                  (n.textContent = e.comment),
                  t.appendChild(n));
              }
              if ("other" === e.type || (e.inputs && e.inputs.length > 0)) {
                const n = document.createElement("div");
                ((n.className = "mp-other-container"),
                  (n.style.cssText =
                    "display: none; width: 100%; margin-top: 8px; flex-direction: column; gap: 8px;"),
                  (n.onclick = (e) => e.stopPropagation()),
                  (n.onkeydown = (e) => e.stopPropagation()));
                const a = (e, t, n, a) => {
                  const o = document.createElement("div");
                  o.style.cssText =
                    "display: flex; flex-direction: column; width: 100%;";
                  const r = document.createElement("div");
                  ((r.className = "mp-label-right"),
                    (r.style.cssText =
                      "display: flex; justify-content: flex-end; margin-bottom: 4px;"));
                  const s = document.createElement("button");
                  ((s.className = "mp-enhance-ai-btn"),
                    (s.type = "button"),
                    setSafeInnerHTML(s, `${ICONS.magic}`),
                    createCustomTooltip(
                      s,
                      "Enhance Prompt",
                      "top",
                    ));
                  const i = document.createElement("button");
                  ((i.className = "mp-paste-btn"),
                    (i.type = "button"),
                    setSafeInnerHTML(i, `${ICONS.paste}`),
                    createCustomTooltip(i, "Paste", "top"),
                    r.appendChild(s),
                    r.appendChild(i));
                  const l = document.createElement("textarea");
                  return (
                    (l.className = "form-input dynamic-input mp-other-input"),
                    (l.placeholder = e),
                    (l.dataset.defValue = t || ""),
                    t && (l.value = t),
                    n && (l.dataset.optInputKey = n),
                    a && (l.dataset.isOther = "true"),
                    (l.rows = 2),
                    (l.style.resize = "vertical"),
                    (l.style.height = "auto"),
                    s.addEventListener("click", (e) => {
                      (e.preventDefault(),
                        e.stopPropagation(),
                        handleTextareaEnhancement(l, s));
                    }),
                    i.addEventListener("click", async (e) => {
                      (e.preventDefault(), e.stopPropagation());
                      try {
                        const e = await navigator.clipboard.readText();
                        if (e) {
                          const t = l.selectionStart,
                            n = l.selectionEnd,
                            a = l.value;
                          ((l.value = a.substring(0, t) + e + a.substring(n)),
                            (l.selectionStart = l.selectionEnd = t + e.length),
                            l.dispatchEvent(
                              new Event("input", { bubbles: !0 }),
                            ),
                            l.focus());
                        }
                      } catch (e) {}
                    }),
                    l.addEventListener("keydown", (e) => {
                      if (!e.isComposing && 229 !== e.keyCode) {
                        if ("function" == typeof isShortcutPressed) {
                          if (isShortcutPressed(e, "lineBreak")) {
                            (e.preventDefault(), e.stopPropagation());
                            const t = l.selectionStart,
                              n = l.selectionEnd,
                              a = l.value;
                            return (
                              (l.value =
                                a.substring(0, t) + "\n" + a.substring(n)),
                              (l.selectionStart = l.selectionEnd = t + 1),
                              void l.dispatchEvent(
                                new Event("input", { bubbles: !0 }),
                              )
                            );
                          }
                          if (isShortcutPressed(e, "saveSend")) {
                            (e.preventDefault(), e.stopPropagation());
                            const t =
                              document.getElementById("__ap_insert_prompt");
                            return void (t && t.click());
                          }
                          if (isShortcutPressed(e, "enhancePrompt"))
                            return (
                              e.preventDefault(),
                              e.stopPropagation(),
                              void (
                                document.activeElement === l &&
                                "function" ==
                                  typeof handleTextareaEnhancement &&
                                handleTextareaEnhancement(l, s)
                              )
                            );
                        }
                        if ("Enter" === e.key) {
                          if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)
                            return;
                          (e.preventDefault(), e.stopPropagation());
                          const t =
                            document.getElementById("__ap_insert_prompt");
                          t && t.click();
                        }
                      }
                    }),
                    o.appendChild(r),
                    o.appendChild(l),
                    o
                  );
                };
                if ("other" === e.type) {
                  const e = a("Type here...", "", null, !0);
                  n.appendChild(e);
                }
                (e.inputs &&
                  e.inputs.length > 0 &&
                  e.inputs.forEach((e) => {
                    const t = a(e.label, e.defaultValue, e.key, !1);
                    n.appendChild(t);
                  }),
                  t.appendChild(n));
              }
              o.appendChild(t);
            }
          }),
            i.appendChild(n));
        }
    }),
      showModal(currentPlaceholderModal),
      setTimeout(
        () => i.querySelector('textarea, input:not([type="file"])')?.focus(),
        100,
      ));
  }
  const mpColorPalette = [
    "var(--mp-syntax-quote-fence)",
    "var(--mp-syntax-var-keyword)",
    "var(--mp-syntax-file-keyword)",
    "var(--mp-syntax-sel-fence)",
    "var(--mp-syntax-sel-multi)",
    "var(--mp-syntax-sel-single)",
    "var(--mp-syntax-sel-id)",
    "var(--mp-syntax-sel-other)",
    "var(--mp-syntax-free-bracket)",
  ];
  function getColorForId(e) {
    if (!e) return "transparent";
    let t = String(e),
      n = 0;
    for (let e = 0; e < t.length; e++) n = t.charCodeAt(e) + ((n << 5) - n);
    const a = Math.abs(n) % mpColorPalette.length;
    return mpColorPalette[a];
  }
  function applyChatGLMCustomStyles() {
    const e = "mp-chatglm-left-align";
    if (document.getElementById(e)) return;
    const t = document.createElement("style");
    t.id = e;
    (setSafeInnerHTML(t, "body {text-align: left !important;}"),
      document.head.appendChild(t));
  }
  function applyGrokCustomStyles() {
    const e = "my-prompt-grok-padding";
    if (document.getElementById(e)) return;
    const t = document.createElement("style");
    t.id = e;
    (setSafeInnerHTML(
      t,
      ".tiptap.ProseMirror { padding-right: 70px !important; }",
    ),
      document.head.appendChild(t));
  }
  let inlineMenu = null,
    inlineMenuCurrentItems = [],
    inlineMenuIndex = 0;
  function createInlineMenu() {
    if (inlineMenu) return inlineMenu;
    const e = document.createElement("div");
    return (
      (e.className = "mp-inline-menu"),
      document.body.appendChild(e),
      (inlineMenu = e),
      e
    );
  }
  function closeInlineMenu() {
    inlineMenu &&
      (inlineMenu.classList.remove("visible"),
      (inlineMenuCurrentItems = []),
      (inlineMenuIndex = 0));
  }
  function renderInlineList(e, t) {
    if (
      (inlineMenu || createInlineMenu(),
      setSafeInnerHTML(inlineMenu, ""),
      0 === e.length)
    )
      return void closeInlineMenu();
    const n = document.createElement("div");
    ((n.className = "mp-inline-list"),
      e.forEach((e, a) => {
        const o = document.createElement("div");
        ((o.className =
          "mp-inline-item " + (a === inlineMenuIndex ? "selected" : "")),
          (o.onmousedown = (n) => {
            (n.preventDefault(),
              n.stopPropagation(),
              completeInlinePrompt(e, t));
          }));
        const r = document.createElement("span");
        ((r.className = "mp-inline-title"), (r.textContent = e.title));
        const s = document.createElement("span");
        s.className = "mp-inline-preview";
        const i = (e.text || "").replace(/\s+/g, " ").trim();
        ((s.textContent = i
          ? i.substring(0, 150) + (i.length > 150 ? "…" : "")
          : ""),
          o.appendChild(r),
          s.textContent && o.appendChild(s),
          n.appendChild(o));
      }),
      inlineMenu.appendChild(n),
      setupEnhancedScroll(n));
    const a = n.children[inlineMenuIndex];
    a && a.scrollIntoView({ block: "nearest" });
  }
  function updateInlineVisuals() {
    if (!inlineMenu) return;
    const e = inlineMenu.querySelector(".mp-inline-list"),
      t = inlineMenu.querySelectorAll(".mp-inline-item");
    e &&
      t.forEach((n, a) => {
        a === inlineMenuIndex
          ? (n.classList.add("selected"),
            0 === a
              ? (e.scrollTop = 0)
              : a === t.length - 1
                ? (e.scrollTop = e.scrollHeight)
                : n.scrollIntoView({ block: "nearest", behavior: "auto" }))
          : n.classList.remove("selected");
      });
  }
  function positionInlineMenu(e) {
    if (!inlineMenu) return;
    const t = e.getBoundingClientRect(),
      n = window.innerHeight - t.top + 8,
      a = t.left;
    ((inlineMenu.style.bottom = `${n}px`),
      (inlineMenu.style.left = `${a}px`),
      a + 300 > window.innerWidth &&
        ((inlineMenu.style.left = "auto"), (inlineMenu.style.right = "20px")));
  }
  function getTextBeforeCaret(e) {
    if ("TEXTAREA" === e.tagName || "INPUT" === e.tagName)
      return e.value.substring(0, e.selectionEnd);
    const t = window.getSelection();
    if (t.rangeCount > 0) {
      const e = t.getRangeAt(0);
      return 3 === e.startContainer.nodeType
        ? e.startContainer.textContent.substring(0, e.startOffset)
        : "";
    }
    return "";
  }
  async function completeInlinePrompt(e, t) {
    const n =
      getEditableRoot(findPlatformEditor()) ||
      getEditableRoot(document.querySelector(platformSelectors[currentPlatform]));
    if (!n) return;
    n.focus();
    const a = getTextBeforeCaret(n).match(/(?:^|\s)(#[^\s]*)$/);
    let o = a && a[1] ? a[1].length : (t ? t.length : 0) + 1,
      r = null;
    if ("TEXTAREA" === n.tagName || "INPUT" === n.tagName) {
      if ("number" == typeof n.selectionEnd) {
        const e = Math.max(0, n.selectionEnd - o),
          t = n.selectionEnd;
        (n.setRangeText
          ? n.setRangeText("", e, t, "end")
          : ((n.value = n.value.slice(0, e) + n.value.slice(t)),
            (n.selectionEnd = e)),
          (r = { type: "input", start: n.selectionEnd, end: n.selectionEnd }));
      }
    } else {
      const e = window.getSelection();
      if (e.rangeCount > 0) {
        const t = e.getRangeAt(0);
        if (3 === t.startContainer.nodeType) {
          const e = t.startOffset,
            n = Math.max(0, e - o);
          (t.setStart(t.startContainer, n),
            t.setEnd(t.startContainer, e),
            t.deleteContents(),
            (r = {
              type: "contenteditable",
              node: t.startContainer,
              offset: t.startOffset,
            }));
        } else {
          for (let e = 0; e < o; e++) document.execCommand("delete", !1, null);
          try {
            const t = e.getRangeAt(0);
            r = {
              type: "contenteditable",
              node: t.startContainer,
              offset: t.startOffset,
            };
          } catch (e) {}
        }
      }
    }
    (closeInlineMenu(),
      e.usePlaceholders
        ? (currentPlaceholderModal &&
            ((currentPlaceholderModal.dataset.fromInline = "true"),
            (currentPlaceholderModal._savedCursor = r)),
          openPlaceholderModal(e, -1))
        : await insertPrompt(e, -1, !0, !0));
  }
  function setupInlineSuggestion(e) {
    if (e.dataset.mpInlineActive) return;
    e.dataset.mpInlineActive = "true";
    let t = !1;
    (e.addEventListener(
      "keydown",
      (n) => {
        if (inlineMenu && inlineMenu.classList.contains("visible"))
          if ("ArrowDown" === n.key)
            (n.preventDefault(),
              n.stopPropagation(),
              (inlineMenuIndex =
                (inlineMenuIndex + 1) % inlineMenuCurrentItems.length),
              updateInlineVisuals());
          else if ("ArrowUp" === n.key)
            (n.preventDefault(),
              n.stopPropagation(),
              (inlineMenuIndex =
                (inlineMenuIndex - 1 + inlineMenuCurrentItems.length) %
                inlineMenuCurrentItems.length),
              updateInlineVisuals());
          else if ("Enter" === n.key || "Tab" === n.key) {
            if (inlineMenuCurrentItems[inlineMenuIndex]) {
              (n.preventDefault(),
                n.stopPropagation(),
                n.stopImmediatePropagation(),
                (t = !0));
              const a = getTextBeforeCaret(e).match(/(?:^|\s)(#[^\s]*)$/),
                o = a ? a[1] : "";
              completeInlinePrompt(inlineMenuCurrentItems[inlineMenuIndex], o);
            }
          } else "Escape" === n.key && (n.preventDefault(), closeInlineMenu());
      },
      !0,
    ),
      e.addEventListener(
        "keypress",
        (e) => {
          !t ||
            ("Enter" !== e.key && "Tab" !== e.key) ||
            (e.preventDefault(),
            e.stopPropagation(),
            e.stopImmediatePropagation());
        },
        !0,
      ),
      e.addEventListener(
        "keyup",
        (e) => {
          !t ||
            ("Enter" !== e.key && "Tab" !== e.key) ||
            (e.preventDefault(),
            e.stopPropagation(),
            e.stopImmediatePropagation(),
            (t = !1));
        },
        !0,
      ),
      e.addEventListener(
        "input",
        debounce(async (t) => {
          const n = getTextBeforeCaret(e).match(/(?:^|\s)#([^\s]*)$/);
          if (n) {
            const t = n[1],
              a = t.toLowerCase().replace(/-/g, " "),
              o = await getAll();
            ((inlineMenuCurrentItems = o
              .filter((e) => e.title.toLowerCase().includes(a))
              .slice(0, 8)),
              inlineMenuCurrentItems.length > 0
                ? ((inlineMenuIndex = 0),
                  renderInlineList(inlineMenuCurrentItems, t),
                  positionInlineMenu(e),
                  inlineMenu && inlineMenu.classList.add("visible"))
                : closeInlineMenu());
          } else closeInlineMenu();
        }, 100),
      ),
      document.addEventListener("click", (t) => {
        inlineMenu &&
          inlineMenu.classList.contains("visible") &&
          !inlineMenu.contains(t.target) &&
          t.target !== e &&
          closeInlineMenu();
      }));
  }
  const PREDICTION_STORAGE_KEY = "Prediction",
    DEFAULT_PREDICTION_CONFIG = { enabled: !0 },
    TAG_MEMORY = { active: !1, list: [], index: 0, startPos: 0, typed: "" };
  let currentPredictionConfig = DEFAULT_PREDICTION_CONFIG,
    macroMemory = { active: !1, text: "", startIndex: 0, hashCount: 0 },
    varMemory = { active: !1, list: [], index: 0, startPos: 0, typed: "" };
  async function loadPredictionConfig() {
    currentPredictionConfig = await GM_getValue(
      PREDICTION_STORAGE_KEY,
      DEFAULT_PREDICTION_CONFIG,
    );
  }
  async function savePredictionConfig(e) {
    ((currentPredictionConfig = e),
      await GM_setValue(PREDICTION_STORAGE_KEY, e));
  }
  function attachSmartEditorLogic(e) {
    if (!e) return;
    const t = {
        "(": ")",
        "[": "]",
        "{": "}",
        '"': '"',
        "'": "'",
        "`": "`",
        "<": ">",
      },
      n = new Set(Object.values(t)),
      a = () => {
        ((varMemory.active = !1),
          (varMemory.list = []),
          (varMemory.typed = ""));
      },
      o = () => {
        ((TAG_MEMORY.active = !1),
          (TAG_MEMORY.list = []),
          (TAG_MEMORY.typed = ""));
      };
    (e.addEventListener("keydown", function (e) {
      if (!currentPredictionConfig.enabled) return;
      if (e.isComposing || 229 === e.keyCode) return;
      const r = this.selectionStart,
        s = this.selectionEnd,
        i = this.value,
        l = e.key,
        c = r !== s;
      if ("Backquote" === e.key && e.shiftKey) {
        if ((e.preventDefault(), c)) {
          const e = i.substring(r, s);
          (this.setRangeText("`" + e + "`", r, s, "select"),
            (this.selectionStart = r + 1),
            (this.selectionEnd = r + 1 + e.length));
        } else
          (this.setRangeText("``", r, s, "end"),
            (this.selectionStart = r + 1),
            (this.selectionEnd = r + 1));
        return;
      }
      const d = varMemory.active
        ? varMemory
        : TAG_MEMORY.active
          ? TAG_MEMORY
          : null;
      if (d)
        if (r < d.startPos) (varMemory.active && a(), TAG_MEMORY.active && o());
        else {
          if ("ArrowUp" === e.key || "ArrowDown" === e.key) {
            if ((e.preventDefault(), d.list.length <= 1)) return;
            "ArrowUp" === e.key
              ? (d.index = (d.index + 1) % d.list.length)
              : (d.index = (d.index - 1 + d.list.length) % d.list.length);
            const t = d.list[d.index],
              n = ("string" == typeof t ? t : t.label).substring(
                d.typed.length,
              );
            return void this.setRangeText(
              n,
              d.startPos + d.typed.length,
              s,
              "select",
            );
          }
          if (["Enter", "Tab", "ArrowRight"].includes(e.key)) {
            if ((e.preventDefault(), TAG_MEMORY.active)) {
              const e = TAG_MEMORY.list[TAG_MEMORY.index],
                t = "string" == typeof e ? e : e.label;
              this.setRangeText("", d.startPos, s, "select");
              let n = t,
                a = 0,
                o = 0;
              ("file" === e.type
                ? ((n = "#file"), (a = 0), (o = 0))
                : "file-title" === e.type
                  ? ((n = "#file(Title)"), (a = 6), (o = 5))
                  : "start-block" === e.type
                    ? ((n = "#start\n# Title\n+ []\n+ []\n+ []\n[#]\n#end"),
                      (a = 9),
                      (o = 5))
                    : "start-inline" === e.type &&
                      ((n =
                        "#start # Title // + [] // + [] // + [] // [#] #end"),
                      (a = 9),
                      (o = 5)),
                this.setRangeText(n, d.startPos, d.startPos, "end"),
                o > 0
                  ? ((this.selectionStart = d.startPos + a),
                    (this.selectionEnd = d.startPos + a + o))
                  : a > 0
                    ? ((this.selectionStart = d.startPos + a),
                      (this.selectionEnd = d.startPos + a))
                    : ((this.selectionStart = d.startPos + n.length),
                      (this.selectionEnd = d.startPos + n.length)));
            } else ((this.selectionStart = s), (this.selectionEnd = s));
            return (varMemory.active && a(), void (TAG_MEMORY.active && o()));
          }
          if ("Escape" === e.key)
            return (
              e.preventDefault(),
              this.setRangeText("", d.startPos + d.typed.length, s, "end"),
              varMemory.active && a(),
              void (TAG_MEMORY.active && o())
            );
        }
      if ("#" === l && c)
        return (
          (macroMemory.text = i.substring(r, s)),
          (macroMemory.startIndex = r),
          (macroMemory.active = !0),
          void (macroMemory.hashCount = 1)
        );
      if (macroMemory.active)
        if (r !== macroMemory.startIndex + macroMemory.hashCount)
          ((macroMemory.active = !1), (macroMemory.text = ""));
        else {
          if ("#" === l) return void macroMemory.hashCount++;
          const t = l ? l.toLowerCase() : "";
          if (["s", "i"].includes(t)) {
            e.preventDefault();
            const n = "#".repeat(macroMemory.hashCount);
            let a = "";
            return (
              "s" === t
                ? (a = `${n}start\n${macroMemory.text}\n${n}end`)
                : "i" === t && (a = `${n}ignore\n${macroMemory.text}\n${n}end`),
              this.setRangeText(a, macroMemory.startIndex, r, "select"),
              (macroMemory.active = !1),
              void (macroMemory.text = "")
            );
          }
          ["Shift", "Control", "Alt", "CapsLock", "Meta"].includes(e.key) ||
            ((macroMemory.active = !1), (macroMemory.text = ""));
        }
      if (c && t[l]) {
        e.preventDefault();
        const n = i.substring(r, s),
          a = l + n + t[l];
        return (
          this.setRangeText(a, r, s, "select"),
          (this.selectionStart = r + 1),
          void (this.selectionEnd = r + 1 + n.length)
        );
      }
      if (!c && n.has(l) && i[r] === l)
        return (
          e.preventDefault(),
          (this.selectionStart = r + 1),
          void (this.selectionEnd = r + 1)
        );
      if ("Backspace" === e.key && !c && r > 0)
        if (d);
        else {
          const n = i[r - 1],
            a = i[r];
          t[n] === a &&
            (e.preventDefault(), this.setRangeText("", r - 1, r + 1, "end"));
        }
      else if (!c && t[l]) {
        if (d) return;
        if ("`" === l && !e.shiftKey)
          return (
            e.preventDefault(),
            this.setRangeText("``", r, s, "end"),
            (this.selectionStart = r + 1),
            void (this.selectionEnd = r + 1)
          );
        if ("`" !== l)
          return (
            e.preventDefault(),
            this.setRangeText(l + t[l], r, s, "end"),
            (this.selectionStart = r + 1),
            void (this.selectionEnd = r + 1)
          );
      }
    }),
      e.addEventListener("input", function (e) {
        if (!currentPredictionConfig.enabled) return;
        if (
          e.isComposing ||
          (e.inputType && e.inputType.startsWith("insertComposition"))
        )
          return;
        if (macroMemory.active) return;
        const t = this.selectionStart,
          n = this.value,
          r = e.data;
        if ("$" === r || " " === r) {
          const e = n.substring(0, t),
            a = " " === r && /(?:\[[^\]]*?|\{[^\}]*?)=\s$/.test(e);
          if ("$" === r || a) {
            const n =
              /(?:\[[^\]]*?=\s*|\{[^\}]*?=\s*)(\$[\w]+)[^\]}]*?(?:\]|\})/g;
            let o;
            const s = [];
            for (; null !== (o = n.exec(e));) s.push(o[1]);
            if ("$" === r) {
              if (s.length > 0) {
                const e = [...new Set(s.reverse())];
                ((varMemory.active = !0),
                  (varMemory.list = e),
                  (varMemory.index = 0),
                  (varMemory.startPos = t - 1),
                  (varMemory.typed = "$"));
                const n = e[0];
                this.setRangeText(n.substring(1), t, t, "select");
              }
            } else if (a) {
              const e = s.length > 0 ? [...new Set(s.reverse())] : ["$"];
              (this.setRangeText("$", t, t, "end"),
                (varMemory.active = !0),
                (varMemory.list = e),
                (varMemory.index = 0),
                (varMemory.startPos = t),
                (varMemory.typed = "$"));
              const n = e[0];
              n.length > 1 &&
                this.setRangeText(n.substring(1), t + 1, t + 1, "select");
            }
            return;
          }
        }
        if ("#" === r) {
          const e = n.substring(0, t - 1);
          if ("" === e || /[\s\n]$/.test(e))
            return (
              (TAG_MEMORY.active = !0),
              (TAG_MEMORY.startPos = t - 1),
              (TAG_MEMORY.typed = "#"),
              void (TAG_MEMORY.list = [])
            );
        }
        if (varMemory.active || TAG_MEMORY.active) {
          const s = varMemory.active ? varMemory : TAG_MEMORY;
          if (
            "deleteContentBackward" === e.inputType ||
            "deleteContentForward" === e.inputType
          )
            return t <= s.startPos
              ? (varMemory.active && a(), void (TAG_MEMORY.active && o()))
              : ((s.typed = n.substring(s.startPos, t)),
                varMemory.active && a(),
                void (TAG_MEMORY.active && o()));
          if (!r) return;
          if (((s.typed += r), TAG_MEMORY.active)) {
            const e = s.typed.substring(1).toLowerCase();
            let t = [];
            (e.startsWith("d")
              ? (t = [
                  { label: "#date", type: "simple" },
                  { label: "#date-DD", type: "simple" },
                  { label: "#date-MM", type: "simple" },
                  { label: "#date-YY", type: "simple" },
                  { label: "#date+time", type: "simple" },
                ])
              : e.startsWith("t")
                ? (t = [
                    { label: "#time", type: "simple" },
                    { label: "#time-HH", type: "simple" },
                    { label: "#time-MM", type: "simple" },
                    { label: "#time-SS", type: "simple" },
                    { label: "#time+date", type: "simple" },
                  ])
                : e.startsWith("f")
                  ? (t = [
                      { label: "#file", type: "file" },
                      { label: "#file(Title)", type: "file-title" },
                    ])
                  : e.startsWith("s") &&
                    (t = [
                      { label: "#start (Block)", type: "start-block" },
                      { label: "#start (Inline)", type: "start-inline" },
                    ]),
              (s.list = t.filter((e) =>
                e.label.toLowerCase().startsWith(s.typed.toLowerCase()),
              )));
          } else if (varMemory.active) {
            const e = s.list.filter((e) => e.startsWith(s.typed));
            s.list = e;
          }
          if (s.list.length > 0) {
            s.index = 0;
            const e = s.list[0],
              n = ("string" == typeof e ? e : e.label).substring(
                s.typed.length,
              );
            return void this.setRangeText(n, t, t, "select");
          }
          (TAG_MEMORY.active && o(), varMemory.active && a());
        }
        const s = r ? r.toLowerCase() : "";
        if (["e", "i", "s"].includes(s)) {
          const e = n.substring(0, t).match(/(^|[\s\n])(#+)([eiEIsS])$/);
          if (e) {
            const n = e[2],
              a = e[3].toLowerCase();
            let o = "",
              r = t;
            const s = t - (n.length + 1);
            ("i" === a
              ? ((o = `${n}ignore\n\n${n}end`), (r = s + n.length + 7))
              : "s" === a
                ? ((o = `${n}start\n\n${n}end`), (r = s + n.length + 6))
                : "e" === a && ((o = `${n}end`), (r = s + o.length)),
              this.setRangeText(o, s, t, "select"),
              (this.selectionStart = r),
              (this.selectionEnd = r));
          }
        }
      }));
    const r = e.setRangeText.bind(e);
    e.setRangeText = function (...e) {
      (r(...e), this.syntaxUpdate && this.syntaxUpdate());
    };
  }
  const SHORTCUTS_STORAGE_KEY = "ShortcutsConfig",
    DEFAULT_SHORTCUTS = {
      newPrompt: { keys: "Alt+N", desc: "Opens New Prompt creation window" },
      listPrompts: { keys: "Alt+P", desc: "Opens Prompt List" },
      saveSend: { keys: "Ctrl+Enter", desc: "Save and Send current prompt" },
      saveEditor: {
        keys: "Ctrl+S",
        desc: "Save current prompt without closing the editor",
      },
      lineBreak: {
        keys: "Shift+Enter",
        desc: "Adds Line Break in Dynamic Prompt modal",
      },
      enhancePrompt: { keys: "Alt+E", desc: "Enhance Prompt with AI" },
      expandedMode: {
        keys: "Ctrl+Alt+P",
        desc: "Opens the Prompt List in Expanded Mode",
      },
    };
  let currentShortcuts = JSON.parse(JSON.stringify(DEFAULT_SHORTCUTS));
  async function loadShortcuts() {
    const e = await GM_getValue(SHORTCUTS_STORAGE_KEY);
    if (e)
      try {
        const t = JSON.parse(e);
        ((currentShortcuts = { ...DEFAULT_SHORTCUTS, ...t }),
          Object.keys(DEFAULT_SHORTCUTS).forEach((e) => {
            currentShortcuts[e] &&
              (currentShortcuts[e].desc = DEFAULT_SHORTCUTS[e].desc);
          }));
      } catch (e) {
        console.error(e);
      }
  }
  async function saveShortcutsConfig() {
    await GM_setValue(SHORTCUTS_STORAGE_KEY, JSON.stringify(currentShortcuts));
  }
  function isShortcutPressed(e, t) {
    if (!currentShortcuts[t]) return !1;
    const n = currentShortcuts[t].keys.toUpperCase().split("+"),
      a = n[n.length - 1],
      o = n.includes("CTRL"),
      r = n.includes("ALT"),
      s = n.includes("SHIFT");
    if (e.ctrlKey !== o) return !1;
    if (e.altKey !== r) return !1;
    if (e.shiftKey !== s) return !1;
    const i = e.code ? e.code.toUpperCase() : "",
      l = e.key ? e.key.toUpperCase() : "";
    return 1 === a.length
      ? l === a || i === `KEY${a}` || i === `DIGIT${a}`
      : l === a || i === a;
  }
  const AI_SETTINGS_KEY = "AISettings",
    DEFAULT_AI_CONFIG = {
      apiKeyGemini: "",
      apiKeyLongcat: "",
      apiKeyGroq: "",
      apiKeyOpenRouter: "",
      apiKeyHuggingFace: "",
      keyIndexGemini: 0,
      keyIndexLongcat: 0,
      keyIndexGroq: 0,
      keyIndexOpenRouter: 0,
      keyIndexHuggingFace: 0,
      model: "gemini-3.5-flash",
      systemPrompt:
        'You are an expert prompt engineer. Improve the user\'s prompt to be clearer, more detailed, and effective for an LLM. Respond ONLY with the improved prompt text, in the same language as the user. Do not add introductions like "Here is the improved prompt:".',
    };
  let currentAIConfig = JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG));
  function parseSystemPrompts(e) {
    if (!e || "string" != typeof e) return null;
    const t = /([^{()\n]+?)\s*(?:\(([^)]+)\))?\s*\{\{([\s\S]*?)\}\}/g,
      n = [];
    let a;
    for (; null !== (a = t.exec(e));)
      n.push({
        title: a[1].trim(),
        comment: a[2] ? a[2].trim() : null,
        prompt: a[3].trim(),
      });
    return n.length < 2 ? null : n;
  }
  function getProvider(e) {
    return e.startsWith("gemini") || e.startsWith("gemma")
      ? "gemini"
      : e.startsWith("openrouter|")
        ? "openrouter"
        : e.startsWith("hf|")
          ? "huggingface"
          : e.startsWith("LongCat")
            ? "longcat"
            : "groq";
  }
  function getOpenAIEndpoint(e) {
    switch (e) {
      case "openrouter":
        return "https://openrouter.ai/api/v1/chat/completions";
      case "longcat":
        return "https://api.longcat.chat/openai/v1/chat/completions";
      case "huggingface":
        return "https://router.huggingface.co/v1/chat/completions";
      case "groq":
        return "https://api.groq.com/openai/v1/chat/completions";
      default:
        throw new Error(`Unknown provider: ${e}`);
    }
  }
  function getRotatingApiKey(e) {
    let t, n;
    "openrouter" === e
      ? ((t = currentAIConfig.apiKeyOpenRouter), (n = "keyIndexOpenRouter"))
      : "longcat" === e
        ? ((t = currentAIConfig.apiKeyLongcat), (n = "keyIndexLongcat"))
        : "huggingface" === e
          ? ((t = currentAIConfig.apiKeyHuggingFace),
            (n = "keyIndexHuggingFace"))
          : "groq" === e
            ? ((t = currentAIConfig.apiKeyGroq), (n = "keyIndexGroq"))
            : ((t = currentAIConfig.apiKeyGemini), (n = "keyIndexGemini"));
    const a = t.split(/[,\s]+/).filter((e) => "" !== e.trim());
    if (0 === a.length) return null;
    let o = currentAIConfig[n] || 0;
    o >= a.length && (o = 0);
    const r = a[o],
      s = (o + 1) % a.length;
    return ((currentAIConfig[n] = s), saveAIConfig({ [n]: s }), r);
  }
  async function loadAIConfig() {
    const e = await GM_getValue(AI_SETTINGS_KEY, DEFAULT_AI_CONFIG);
    currentAIConfig = { ...DEFAULT_AI_CONFIG, ...e };
  }
  async function saveAIConfig(e) {
    ((currentAIConfig = { ...currentAIConfig, ...e }),
      await GM_setValue(AI_SETTINGS_KEY, currentAIConfig));
  }
  async function callAI_API(e, t = null) {
    const n = currentAIConfig.model,
      a = getProvider(n),
      o = getRotatingApiKey(a);
    let r = t;
    if (
      (r ||
        (r =
          "" !== currentAIConfig.systemPrompt.trim()
            ? currentAIConfig.systemPrompt
            : DEFAULT_AI_CONFIG.systemPrompt),
      !o)
    )
      throw new Error("API Key missing.");
    return new Promise(
      "gemini" === a
        ? (t, a) => {
            GM_xmlhttpRequest({
              method: "POST",
              url: `https://generativelanguage.googleapis.com/v1beta/models/${n}:generateContent?key=${o}`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify({
                contents: [{ parts: [{ text: e }] }],
                systemInstruction: { parts: [{ text: r }] },
              }),
              onload: (e) => {
                try {
                  const n = JSON.parse(e.responseText);
                  n.candidates && n.candidates[0] && n.candidates[0].content
                    ? t(n.candidates[0].content.parts[0].text.trim())
                    : a(
                        new Error(
                          n.error?.message || "Invalid response.",
                        ),
                      );
                } catch (e) {
                  a(new Error("Error processing response."));
                }
              },
              onerror: () => a(new Error("Connection error with API.")),
            });
          }
        : (t, s) => {
            const i = getOpenAIEndpoint(a);
            let l = n;
            "openrouter" === a
              ? (l = n.replace("openrouter|", ""))
              : "huggingface" === a && (l = n.replace("hf|", ""));
            const c = {
              "Content-Type": "application/json",
              Authorization: `Bearer ${o}`,
            };
            ("openrouter" === a && (c["HTTP-Referer"] = window.location.origin),
              GM_xmlhttpRequest({
                method: "POST",
                url: i,
                headers: c,
                data: JSON.stringify({
                  model: l,
                  messages: [
                    { role: "system", content: r },
                    { role: "user", content: e },
                  ],
                  temperature: 0.7,
                }),
                onload: (e) => {
                  if (200 === e.status)
                    try {
                      const n = JSON.parse(e.responseText);
                      n.choices && n.choices.length > 0 && n.choices[0].message
                        ? t(n.choices[0].message.content.trim())
                        : s(new Error("Invalid response."));
                    } catch (e) {
                      (console.error(e),
                        s(new Error("Error processing response.")));
                    }
                  else
                    try {
                      const t = JSON.parse(e.responseText);
                      s(
                        new Error(
                          `Error ${a} (${e.status}): ${t.error?.message || e.statusText}`,
                        ),
                      );
                    } catch (t) {
                      s(new Error(`Error ${a} (${e.status})`));
                    }
                },
                onerror: (e) => {
                  (console.error(e),
                    s(new Error("Connection error with API.")));
                },
              }));
          },
    );
  }
  function showEnhanceLoadingOverlay() {
    if (document.getElementById("__ap_enhance_loading")) return;
    const e = document.createElement("div");
    ((e.id = "__ap_enhance_loading"), (e.className = "mp-overlay"));
    const t = document.createElement("div");
    t.className = "mp-loading-content";
    const n = document.createElement("div");
    ((n.className = "mp-loading-icon"), setSafeInnerHTML(n, ICONS.loading));
    const a = document.createElement("div");
    ((a.className = "mp-loading-text"),
      (a.textContent = "Enhancing Prompt"),
      t.append(n, a),
      e.appendChild(t),
      document.body.appendChild(e),
      requestAnimationFrame(() => e.classList.add("visible")));
  }
  function hideEnhanceLoadingOverlay() {
    const e = document.getElementById("__ap_enhance_loading");
    e && (e.classList.remove("visible"), setTimeout(() => e.remove(), 300));
  }
  function showPromptSelectionModal(e, t) {
    const n = document.createElement("div");
    ((n.className = "mp-overlay mp-system-prompt-select-overlay"),
      (n.id = "__ap_prompt_modal_overlay"),
      (n.onclick = (e) => {
        e.target === n && l();
      }));
    const a = document.createElement("div");
    ((a.className = "mp-modal-box mp-system-prompt-select-box"),
      (a.onclick = (e) => e.stopPropagation()));
    const o = document.createElement("h3");
    ((o.style.cssText =
      "font-family: var(--mp-font-family-heading); font-size: 16px; font-weight: 600; text-align: center; margin: 0 0 12px 0; color: var(--mp-text-primary);"),
      (o.textContent = "Choose the Instruction"),
      a.appendChild(o));
    const r = document.createElement("input");
    ((r.className = "mp-system-prompt-search-input"),
      (r.placeholder = "Search"),
      (r.type = "text"),
      (r.autocomplete = "off"));
    const s = document.createElement("div");
    s.className = "mp-system-prompt-list-container";
    let i = -1;
    function l() {
      (n.classList.remove("visible"), setTimeout(() => n.remove(), 200));
    }
    function c() {
      s.querySelectorAll(".mp-system-prompt-button").forEach((e, t) => {
        t === i
          ? (e.classList.add("is-focused"),
            e.scrollIntoView({ block: "nearest", behavior: "smooth" }))
          : e.classList.remove("is-focused");
      });
    }
    function d(n = "") {
      setSafeInnerHTML(s, "");
      const a = n.toLowerCase();
      i = -1;
      e.filter((e) => {
        const t = (e.title + " " + (e.comment || "")).toLowerCase();
        return !a || t.includes(a);
      }).forEach((e, n) => {
        const a = document.createElement("button");
        a.className = "mp-system-prompt-button";
        let o = `<span class="mp-system-prompt-button-title">${e.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        if (e.comment) {
          o += `<span class="mp-system-prompt-button-comment">${e.comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
        }
        (setSafeInnerHTML(a, o),
          (a.style.animation = "mp-fade-in-up .3s ease forwards"),
          (a.style.animationDelay = `${Math.min(30 * n, 200)}ms`),
          (a.style.opacity = "0"),
          (a.onclick = () => {
            (l(), t(e.prompt));
          }),
          (a.onmouseenter = () => {
            ((i = n), c());
          }),
          s.appendChild(a));
      });
    }
    ((r.onkeydown = (e) => {
      const t = s.querySelectorAll(".mp-system-prompt-button");
      "ArrowDown" === e.key
        ? (e.preventDefault(), (i = (i + 1) % t.length), c())
        : "ArrowUp" === e.key
          ? (e.preventDefault(), (i = (i - 1 + t.length) % t.length), c())
          : "Enter" === e.key
            ? (e.preventDefault(),
              i >= 0 && t[i]
                ? t[i].click()
                : t.length > 0 && "" !== r.value && t[0].click())
            : "Escape" === e.key && l();
    }),
      d(),
      (r.oninput = (e) => d(e.target.value)),
      a.appendChild(r),
      a.appendChild(s),
      "function" == typeof setupEnhancedScroll && setupEnhancedScroll(s),
      n.appendChild(a),
      document.body.appendChild(n));
    (new MutationObserver(() => {
      n.classList.contains("visible") && setTimeout(() => r.focus(), 50);
    }).observe(n, { attributes: !0, attributeFilter: ["class"] }),
      requestAnimationFrame(() => n.classList.add("visible")));
  }
  function getEditableRoot(e) {
    if (!e || !e.isConnected) return null;
    const tag = e.tagName?.toLowerCase();
    if (tag === "rich-textarea")
      return e.querySelector('div[contenteditable="true"]') || e;
    if (e.isContentEditable) return e;
    const nested = e.querySelector?.('div[contenteditable="true"]');
    return nested || e;
  }

  function robustClearEditor(e) {
    const editor = getEditableRoot(e);
    if (!editor || !editor.isConnected) return false;
    editor.focus();
    if ("value" in editor && typeof editor.value === "string") {
      const setter = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(editor),
        "value",
      )?.set;
      setter ? setter.call(editor, "") : (editor.value = "");
      editor.dispatchEvent(
        new Event("input", { bubbles: true, composed: true }),
      );
      editor.dispatchEvent(
        new Event("change", { bubbles: true, composed: true }),
      );
      return true;
    }
    while (editor.firstChild) editor.removeChild(editor.firstChild);
    editor.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: "deleteContentBackward",
      }),
    );
    editor.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    return true;
  }

  function moveCursorToEnd(e) {
    const editor = getEditableRoot(e);
    if (!editor || !editor.isConnected) return false;
    editor.focus();

    if (
      (editor.tagName || "").toLowerCase() === "textarea" ||
      (editor.tagName || "").toLowerCase() === "input"
    ) {
      if (typeof editor.setSelectionRange !== "function") return false;
      const end = typeof editor.value === "string" ? editor.value.length : 0;
      editor.setSelectionRange(end, end);
      return true;
    }

    const selection = window.getSelection();
    if (!selection) return false;

    const range = document.createRange();
    let node = editor;

    while (node.lastChild) node = node.lastChild;

    if (node.nodeType === Node.TEXT_NODE) {
      range.setStart(node, node.nodeValue?.length || 0);
      range.collapse(true);
    } else {
      range.selectNodeContents(node);
      range.collapse(false);
    }

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  // ─── Flow hardening: resilient editor discovery + verified insertion ───────
  function isElementVisibleEl(el) {
    if (!el || !el.isConnected) return false;
    if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
    const rect = el.getBoundingClientRect();
    return !!(rect.width > 0 && rect.height > 0);
  }

  // Mirrors the initUI anchor logic (Add-media / arrow_forward buttons) that is
  // proven to still work on flow.google.com; used to locate the composer when
  // every static selector fails. Self-heals against future editor rewrites.
  // v27.0.3: Flow's inspected composer DOM renders icon ligatures as plain
  // text inside buttons (send button textContent is literally
  // "arrow_forwardCreate"; add-media is <i class="... google-symbols ...">add</i>).
  // The anchor matcher therefore keys off the button's own normalized
  // textContent first, then child icon elements, then aria-labels, and treats
  // the PINHOLE prompt textarea as the most stable last-resort hook.
  function flowBtnText(el) {
    return ((el && el.textContent) || "").replace(/\s+/g, "").toLowerCase();
  }
  function findFlowAnchorButton() {
    // Only consider live, visible buttons: display:none containers still
    // surface in querySelectorAll and would anchor the search on a stale
    // (e.g. cached view) composer instead of the active one.
    const buttons = Array.from(document.querySelectorAll("button")).filter(
      isElementVisibleEl,
    );
    const send =
      buttons.find((b) => flowBtnText(b).includes("arrow_forward")) ||
      buttons.find((b) => {
        const icon = b.querySelector("i, span, mat-icon");
        return icon && "arrow_forward" === flowBtnText(icon);
      });
    if (send) return { element: send, type: "send-fingerprint" };
    const add = buttons.find((b) => {
      const icon = b.querySelector(
        'i[class*="google-symbols"], span[class*="google-symbols"], i.material-icons, span.material-icons, mat-icon',
      );
      return icon && "add" === flowBtnText(icon);
    });
    if (add) return { element: add, type: "add-media-fingerprint" };
    const addAria = document.querySelector(
      'button[aria-label="Add media menu"], button[aria-label*="Add media" i]',
    );
    if (addAria && isElementVisibleEl(addAria))
      return { element: addAria, type: "add-media-aria-fallback" };
    const pinhole = document.querySelector("#PINHOLE_TEXT_AREA_ELEMENT_ID");
    if (pinhole && isElementVisibleEl(pinhole))
      return { element: pinhole, type: "pinhole-textarea" };
    return null;
  }
  function findFlowComposerContainer() {
    const anchor = findFlowAnchorButton();
    if (!anchor) return null;
    if ("pinhole-textarea" === anchor.type)
      return anchor.element.closest(
        'form, [class*="prompt"], [class*="composer"], [class*="input"]',
      );
    return (
      anchor.element.closest(
        'form, [class*="prompt"], [class*="composer"], [class*="input"], [class*="chat"], [class*="toolbar"], [role="textbox"], textarea',
      ) || anchor.element.closest("div")
    );
  }

  function pickVisibleEditable(list, requireVisible = false) {
    if (!list || !list.length) return null;
    for (const el of list) {
      const root = getEditableRoot(el);
      if (root && isElementVisibleEl(root)) return root;
    }
    // Legacy querySelector semantics (first match, even pre-layout) for
    // non-flow platforms; Flow must have a live, visible editor so the
    // anchor-based fallback below still gets a chance to run.
    return requireVisible ? null : getEditableRoot(list[0]);
  }

  // Resolves the active prompt editor for the current platform with cascading
  // fallbacks. Falls back to the legacy single selector for other platforms.
  function findPlatformEditor(platform = currentPlatform) {
    const selector = platformSelectors[platform];
    if (!selector) return null;
    const requireVisible = platform === "flow";
    let el = pickVisibleEditable(
      document.querySelectorAll(selector),
      requireVisible,
    );
    if (el) return el;
    if (platform === "flow") {
      // Anchor-based discovery: the composer lives around the Add-media/send
      // controls whose detection is already working (UI button mounts).
      const composer = findFlowComposerContainer();
      if (composer) {
        el = pickVisibleEditable(
          composer.querySelectorAll(
            'div[contenteditable="true"], textarea:not([hidden]):not([disabled])',
          ),
          true,
        );
        if (el) return el;
        // Last resort: any visible editable that sits near the bottom of the
        // viewport (Flow's prompt bar) instead of a stale hidden one.
        const editables = Array.from(
          document.querySelectorAll(
            'div[contenteditable="true"][role="textbox"], div[role="textbox"], textarea:not([hidden]):not([disabled])',
          ),
        ).filter(isElementVisibleEl);
        if (editables.length) {
          editables.sort(
            (a, b) =>
              b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom,
          );
          return getEditableRoot(editables[0]);
        }
      }
    }
    return null;
  }

  function editorContainsText(el, text) {
    if (!el) return false;
    const probe = (text || "").trim().split("\n").filter(Boolean)[0] || "";
    if (!probe) return true;
    if ("TEXTAREA" === el.tagName || "INPUT" === el.tagName)
      return (el.value || "").includes(probe);
    return ((el.innerText || el.textContent || "")).includes(probe);
  }

  // Verified, multi-strategy text insertion for Flow's rebuilt editor.
  // Order: trusted execCommand insertText -> synthetic beforeinput/paste (old
  // Slate path) -> direct DOM nodes + input event. Each step is verified.
  function insertTextIntoEditor(el, text) {
    const editor = getEditableRoot(el);
    if (!editor) return false;
    try {
      editor.focus();
    } catch (err) {}

    // TEXTAREA / INPUT: native value setter keeps Angular's control in sync.
    if ("TEXTAREA" === editor.tagName || "INPUT" === editor.tagName) {
      const before = editor.value || "";
      const proto =
        "TEXTAREA" === editor.tagName
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      const next = before ? before + (before.endsWith("\n") ? "" : "\n") + text : text;
      setter ? setter.call(editor, next) : (editor.value = next);
      editor.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      editor.dispatchEvent(new Event("change", { bubbles: true }));
      if (editor.setSelectionRange)
        editor.setSelectionRange(next.length, next.length);
      return editorContainsText(editor, text);
    }

    // Strategy 1: execCommand('insertText') - emits TRUSTED beforeinput/input
    // events; the most reliable path for Angular/React controlled editors.
    try {
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      document.execCommand("insertText", false, text);
    } catch (err) {}
    if (editorContainsText(editor, text)) return true;

    // Strategy 2: synthetic beforeinput + paste (legacy Slate-compatible path).
    try {
      editor.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: text,
        }),
      );
      const dt = new DataTransfer();
      dt.setData("text/plain", text);
      editor.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        }),
      );
      editor.dispatchEvent(new Event("input", { bubbles: true }));
    } catch (err) {}
    if (editorContainsText(editor, text)) return true;

    // Strategy 3: direct DOM insertion + input event (last resort).
    try {
      text.split("\n").forEach((line) => {
        const p = document.createElement("p");
        if ("" === line.trim()) p.appendChild(document.createElement("br"));
        else p.textContent = line;
        editor.appendChild(p);
      });
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      editor.dispatchEvent(
        new Event("input", { bubbles: true, composed: true }),
      );
    } catch (err) {}
    return editorContainsText(editor, text);
  }
  function hasApiKeyForProvider(e) {
    let t;
    return (
      (t =
        "openrouter" === e
          ? currentAIConfig.apiKeyOpenRouter
          : "longcat" === e
            ? currentAIConfig.apiKeyLongcat
            : "huggingface" === e
              ? currentAIConfig.apiKeyHuggingFace
              : "groq" === e
                ? currentAIConfig.apiKeyGroq
                : currentAIConfig.apiKeyGemini),
      t && "" !== t.trim()
    );
  }
  async function processAIEnhancementFlow(e, t, n, a = null) {
    let o = "";
    n
      ? ((o = n.innerHTML),
        n.classList.add("loading"),
        setSafeInnerHTML(n, ICONS.loading))
      : showEnhanceLoadingOverlay();
    try {
      const r = await callAI_API(e, a);
      (n
        ? (n.classList.remove("loading"), setSafeInnerHTML(n, o))
        : hideEnhanceLoadingOverlay(),
        showAIDiffModal(e, r, t));
    } catch (e) {
      if (
        (n
          ? (n.classList.remove("loading"), setSafeInnerHTML(n, o))
          : hideEnhanceLoadingOverlay(),
        e.message &&
          (e.message.includes("API Key") || e.message.includes("Missing")))
      ) {
        "go_to_settings" ===
          (await createDialogo({
            title: "API Key Required",
            message: "To configure your API Key and select the Model, go to advanced settings.",
            actions: [
              {
                label: "Open Settings",
                style: "edit",
                value: "go_to_settings",
              },
            ],
          })) &&
          (settingsModal ||
            ((settingsModal = createSettingsModal()),
            document.body.appendChild(settingsModal)),
          settingsModal.resetToCurrent && settingsModal.resetToCurrent(),
          showModal(settingsModal),
          setTimeout(() => {
            const e = settingsModal.querySelector(
              '.mp-tab-btn[data-tab="advanced"]',
            );
            e && e.click();
          }, 50));
      } else
        await createDialogo({
          title: "Error",
          message: e.message,
          type: "alert",
        });
    }
  }
  async function triggerAIEnhancement(e, t, n = null) {
    if (!e || 0 === e.trim().length)
      return void showNotification("Enter your prompt before trying to enhance it", "error");
    if (!hasApiKeyForProvider(getProvider(currentAIConfig.model))) {
      return void (
        "go_to_settings" ===
          (await createDialogo({
            title: "API Key Required",
            message: "To configure your API Key and select the Model, go to advanced settings.",
            actions: [
              {
                label: "Open Settings",
                style: "edit",
                value: "go_to_settings",
              },
            ],
          })) &&
        (settingsModal ||
          ((settingsModal = createSettingsModal()),
          document.body.appendChild(settingsModal)),
        settingsModal.resetToCurrent && settingsModal.resetToCurrent(),
        showModal(settingsModal),
        setTimeout(() => {
          const e = settingsModal.querySelector(
            '.mp-tab-btn[data-tab="advanced"]',
          );
          e && e.click();
        }, 50))
      );
    }
    const a = currentAIConfig.systemPrompt || DEFAULT_AI_CONFIG.systemPrompt,
      o = parseSystemPrompts(a);
    o && o.length >= 2
      ? showPromptSelectionModal(o, (a) => {
          processAIEnhancementFlow(e, t, n, a);
        })
      : processAIEnhancementFlow(e, t, n, a);
  }
  async function handleInstantPageEnhancement() {
    if (!currentPlatform || !platformSelectors[currentPlatform]) return;
    const e =
      getEditableRoot(findPlatformEditor()) ||
      getEditableRoot(document.querySelector(platformSelectors[currentPlatform]));
    if (!e) return;
    let t = "";
    t =
      "TEXTAREA" === e.tagName || "INPUT" === e.tagName
        ? e.value
        : e.innerText || e.textContent || "";
    triggerAIEnhancement(
      t,
      {
        get value() {
          return "";
        },
        set value(t) {
          (async () => {
            (await robustClearEditor(e),
              setTimeout(() => {
                (e.focus(), insertPrompt({ text: t }, -1, !0, !1));
              }, 200));
          })();
        },
      },
      null,
    );
  }
  // v27.0.8: Copy counterpart to the pill's Paste button (and to
  // handleInstantPageEnhancement's editor discovery above): reads the
  // current platform editor through the exact same cascade (dedicated
  // findPlatformEditor() -> platform selector fallback), then writes its
  // trimmed text to the system clipboard. Trims so transient whitespace
  // artifacts of contenteditable editors do not end up on the clipboard;
  // empty text and clipboard rejections surface as notifications instead
  // of failing silently.
  async function handleInstantPageCopy() {
    const e =
      currentPlatform && platformSelectors[currentPlatform]
        ? getEditableRoot(findPlatformEditor()) ||
          getEditableRoot(
            document.querySelector(platformSelectors[currentPlatform]),
          )
        : null;
    const t = e
        ? "TEXTAREA" === e.tagName || "INPUT" === e.tagName
          ? e.value
          : e.innerText || e.textContent || ""
        : "",
      n = (t || "").trim();
    if (!n)
      return void ("function" == typeof showNotification &&
        showNotification("Nothing to copy - the prompt box is empty", "error"));
    try {
      await navigator.clipboard.writeText(n);
      "function" == typeof showNotification &&
        showNotification("Copied Successfully!", "success");
    } catch (e) {
      "function" == typeof showNotification &&
        showNotification("Could not copy to the clipboard", "error");
    }
  }
  async function handleTextareaEnhancement(e, t) {
    triggerAIEnhancement(
      e.value,
      {
        get value() {
          return e.value;
        },
        set value(t) {
          (async () => {
            (await robustClearEditor(e),
              setTimeout(() => {
                ((e.value = t),
                  e.dispatchEvent(
                    new Event("input", { bubbles: !0, composed: !0 }),
                  ),
                  e.dispatchEvent(new Event("change", { bubbles: !0 })),
                  e.focus());
              }, 200));
          })();
        },
      },
      t,
    );
  }
  const NAV_STORAGE_KEY = "NavConfig",
    NAV_SESSION_KEY = "NavState",
    INDEXED_DB_NAME = "MyPrompt",
    NAV_STORE_NAME = "chatPins",
    DEFAULT_NAV_CONFIG = {
      enabled: !0,
      settings: {
        filterMode: "all",
        showCarousel: !0,
        carouselPosition: { left: null, top: 15 },
        carouselOrientation: "horizontal",
        carouselActionsSide: "bottom",
      },
    },
    NO_NAV_PLATFORMS = [
      "dreamina",
      "jimengJianying",
      "glmimage",
      "flow",
      "longcat",
      "geminigen",
      "hunyuan",
      "bing",
      "gist",
    ];
  let currentNavConfig = JSON.parse(JSON.stringify(DEFAULT_NAV_CONFIG)),
    navContainer = null,
    navListPopup = null,
    isPinnedListMode = !1,
    isDragMode = !1,
    isDragging = !1,
    dragState = { offsetX: 0, offsetY: 0, wW: 0, wH: 0 },
    rulersContainer = null,
    cachedMessages = [],
    navFilterMode = "all",
    savedPins = [],
    activePins = [],
    pinnedCarouselContainer = null,
    currentPinnedCenterIdx = 0,
    currentChatId = "",
    lastPinsHash = "",
    globalDomWatcherInterval = null,
    navLastDomCount = 0,
    currentNavIndex = -1;
  function getCurrentChatId() {
    return (
      window.location.pathname + window.location.search + window.location.hash
    );
  }
  function initDB() {
    return new Promise((e, t) => {
      const n = indexedDB.open("MyPrompt", 1);
      ((n.onupgradeneeded = (e) => {
        const t = e.target.result;
        t.objectStoreNames.contains("chatPins") ||
          t.createObjectStore("chatPins", { keyPath: "chatId" });
      }),
        (n.onsuccess = () => e(n.result)),
        (n.onerror = (e) => t(e)));
    });
  }
  async function loadPinsFromDB(e) {
    try {
      const t = await initDB();
      return new Promise((n) => {
        const a = t
          .transaction(["chatPins"], "readonly")
          .objectStore("chatPins")
          .get(e);
        ((a.onsuccess = () => n(a.result ? a.result.pins : [])),
          (a.onerror = () => n([])));
      });
    } catch (e) {
      return (console.error("Erro DB Load:", e), []);
    }
  }
  async function savePinsToDB(e, t) {
    try {
      const n = await initDB();
      return new Promise((a, o) => {
        const r = n
          .transaction(["chatPins"], "readwrite")
          .objectStore("chatPins");
        if (!t || 0 === t.length) {
          const t = r.delete(e);
          return ((t.onsuccess = () => a(!0)), void (t.onerror = (e) => o(e)));
        }
        const s = r.put({ chatId: e, pins: t });
        ((s.onsuccess = () => a(!0)), (s.onerror = (e) => o(e)));
      });
    } catch (e) {
      throw (console.error("Erro DB Save:", e), e);
    }
  }
  function isItemPinned(e, t = null) {
    if (!e) return !1;
    const n = t ? (t.innerText || t.textContent || "").trim() : e.preview,
      a = !!t;
    return savedPins.some(
      (t) =>
        t.isHeading === a &&
        t.text === n &&
        (!a || t.parentPreview === e.preview),
    );
  }
  function togglePinData(e, t = null) {
    if (!e) return !1;
    const n = t ? (t.innerText || t.textContent || "").trim() : e.preview,
      a = !!t,
      o = savedPins.findIndex(
        (t) =>
          t.isHeading === a &&
          t.text === n &&
          (!a || t.parentPreview === e.preview),
      );
    let r = !1;
    return (
      -1 !== o
        ? savedPins.splice(o, 1)
        : (savedPins.push({
            isHeading: a,
            text: n,
            parentPreview: e.preview,
            timestamp: Date.now(),
          }),
          (r = !0)),
      savePinsToDB(currentChatId, savedPins),
      updateActivePins(),
      r
    );
  }
  function startChatChangeWatcher() {
    setInterval(async () => {
      const e = getCurrentChatId();
      e !== currentChatId &&
        ((currentChatId = e),
        (savedPins = await loadPinsFromDB(currentChatId)),
        scanMessages(),
        updateActivePins(),
        navListPopup &&
          navListPopup.classList.contains("active") &&
          renderNavListItems());
    }, 500);
  }
  async function loadNavConfig() {
    const e = await GM_getValue(NAV_STORAGE_KEY);
    if (
      ((currentNavConfig = JSON.parse(JSON.stringify(DEFAULT_NAV_CONFIG))), e)
    )
      try {
        const t = JSON.parse(e);
        t.carouselPosition && !t.settings
          ? ((currentNavConfig.enabled = !1 !== t.enabled),
            (currentNavConfig.settings = {
              filterMode: t.filterMode || "all",
              showCarousel: !1 !== t.showCarousel,
              carouselPosition: t.carouselPosition || { left: null, top: 15 },
              carouselOrientation: t.carouselOrientation || "horizontal",
              carouselActionsSide: t.carouselActionsSide || "bottom",
            }))
          : ((currentNavConfig.enabled = !1 !== t.enabled),
            t.settings &&
              (currentNavConfig.settings = {
                ...currentNavConfig.settings,
                ...t.settings,
              }));
      } catch (e) {
        console.error(e);
      }
    (currentNavConfig.settings.filterMode &&
      (navFilterMode = currentNavConfig.settings.filterMode),
      (currentChatId = getCurrentChatId()),
      (savedPins = await loadPinsFromDB(currentChatId)),
      setTimeout(() => {
        (restoreNavState(),
          scanMessages(),
          updateActivePins(),
          startChatChangeWatcher(),
          startGlobalDomWatcher());
      }, 1500));
  }
  async function saveNavConfig(e) {
    (!e.settings &&
      currentNavConfig &&
      currentNavConfig.settings &&
      (e.settings = currentNavConfig.settings),
      (currentNavConfig = e),
      await GM_setValue(NAV_STORAGE_KEY, JSON.stringify(e)));
  }
  function saveNavState(e, t) {
    if (e < 0) return;
    let n = {};
    const a = sessionStorage.getItem("NavState");
    if (a)
      try {
        ((n = JSON.parse(a)), n.textPreview && !n[e] && (n = {}));
      } catch (e) {
        n = {};
      }
    ((n[e] = {
      index: e,
      textPreview: t ? t.substring(0, 50) : "",
      timestamp: Date.now(),
    }),
      sessionStorage.setItem("NavState", JSON.stringify(n)),
      (currentNavIndex = e));
  }
  function restoreNavState() {
    const e = sessionStorage.getItem("NavState");
    if (e)
      try {
        const t = JSON.parse(e);
        if ((scanMessages(), !cachedMessages || 0 === cachedMessages.length))
          return;
        let n = null,
          a = 0;
        if (
          (Object.values(t).forEach((e) => {
            e.timestamp > a && ((a = e.timestamp), (n = e));
          }),
          n)
        ) {
          let e = cachedMessages.findIndex(
            (e) =>
              e.fullText.includes(n.textPreview) ||
              n.textPreview.includes(e.preview),
          );
          (-1 === e && cachedMessages[n.index] && (e = n.index),
            -1 !== e && (currentNavIndex = e));
        }
      } catch (e) {}
  }
  function getMessageSelectors() {
    switch (currentPlatform) {
      case "googleaistudio":
        return {
          user: {
            item: 'div[data-turn-role="User"] .turn-content',
            text: "ms-prompt-chunk ms-text-chunk .user-chunk",
          },
          ai: {
            item: 'div[data-turn-role="Model"] ms-prompt-chunk:not(:has(ms-thought-chunk))',
            text: "ms-text-chunk",
          },
        };
      case "chatgpt":
        return {
          user: {
            item: 'div[class*="user-message-bubble"]',
            text: 'div[data-message-author-role="user"] .whitespace-pre-wrap',
          },
          ai: {
            item: 'div[data-message-author-role="assistant"]',
            text: ".markdown",
          },
        };
      case "gemini":
        return {
          user: {
            item: 'span[class^="user-query-bubble"]',
            text: ".horizontal-container .query-text p",
          },
          ai: { item: 'div[class^="markdown markdown-main-panel"]', text: "p" },
        };
      case "grok":
        return {
          user: { item: ".message-bubble.bg-surface-l1", text: ".break-words" },
          ai: {
            item: ".items-start .response-content-markdown",
            text: "p.break-words",
          },
        };
      case "qwen":
        return {
          user: {
            item: "div.chat-user-message",
            text: "p.user-message-content",
          },
          ai: {
            item: ".response-message-content.t2t",
            text: ".qwen-markdown-text",
          },
        };
      case "zai":
        return {
          user: {
            item: ".user-message div[data-expanded] > .rounded-xl",
            text: ".user-message div[data-expanded] > .rounded-xl",
          },
          ai: { item: ".chat-assistant", text: ".markdown-prose > p" },
        };
      case "deepseek":
        return {
          user: {
            item: ".ds-message:not(:has(.ds-markdown)) > div:first-child",
            text: ".ds-message:not(:has(.ds-markdown)) > div:first-child",
          },
          ai: { item: ".ds-message:has(.ds-markdown)", text: ".ds-markdown" },
        };
      case "kimi":
        return {
          user: {
            item: ".chat-content-item-user .segment-content",
            text: ".user-content",
          },
          ai: {
            item: ".segment-assistant .segment-content-box",
            text: ".markdown",
          },
        };
      case "claude":
        return {
          user: {
            item: 'div.inline-flex:has([data-testid="user-message"])',
            text: '[data-testid="user-message"] p',
          },
          ai: {
            item: ".font-claude-response:has(.standard-markdown)",
            text: ".standard-markdown",
          },
        };
      case "perplexity":
        return {
          user: { item: "div.group\\/title", text: "span.select-text" },
          ai: { item: '[id^="markdown-content-"]', text: ".prose" },
        };
      case "copilot":
        return {
          user: {
            item: 'div:has(> div[data-content="user-message"])',
            text: 'div[data-content="user-message"]',
          },
          ai: {
            item: 'div[data-testid="ai-message"]',
            text: 'div[id*="-content-"]',
          },
        };
      case "mistral":
        return {
          user: {
            item: 'div[data-message-author-role="user"] .rounded-3xl',
            text: ".select-text span",
          },
          ai: {
            item: 'div:has(>[data-testid="text-message-part"])',
            text: '[data-testid="text-message-part"]',
          },
        };
      case "googleModoIA":
        return {
          user: { item: ".tbIZh.wQN2Jd", text: 'span[role="heading"]' },
          ai: {
            item: 'div[data-subtree="aimc"]',
            text: 'div[data-subtree="aimfl"]',
          },
        };
      case "yuanbao":
        return {
          user: {
            item: ".agent-chat__bubble--human .agent-chat__bubble__content",
            text: ".hyc-content-text",
          },
          ai: {
            item: ".agent-chat__bubble--ai .agent-chat__bubble__content",
            text: ".hyc-common-markdown",
          },
        };
      case "poe":
        return {
          user: {
            item: ".Message_rightSideMessageBubble__ioa_i",
            text: ".Message_selectableText__SQ8WH p",
          },
          ai: {
            item: ".Message_leftSideMessageBubble__VPdk6",
            text: ".Message_selectableText__SQ8WH p",
          },
        };
      case "chatglm":
        return {
          user: { item: ".question .question-txt", text: ".question-txt span" },
          ai: { item: ".panel .answer-content", text: ".markdown-body" },
        };
      case "notebooklm":
        return {
          user: {
            item: ".from-user-container",
            text: ".message-text-content p",
          },
          ai: { item: ".to-user-container", text: ".message-text-content" },
        };
      case "doubao":
        return {
          user: {
            item: "div.bg-g-send-msg-bubble-bg.whitespace-pre-wrap",
            text: "div.bg-g-send-msg-bubble-bg.whitespace-pre-wrap",
          },
          ai: {
            item: "div.flow-markdown-body",
            text: "div.flow-markdown-body",
          },
        };
      case "arena":
        return {
          user: { item: ".bg-surface-raised", text: ".prose p" },
          ai: { item: "div.no-scrollbar.flex-1", text: ".prose p" },
        };
      case "ernie":
        return {
          user: { item: "#question_text_id", text: "#question_text_id span" },
          ai: { item: "#answer_text_id", text: ".custom-html p" },
        };
      case "indicArena":
        return {
          user: {
            item: "div.bg-orange-500.text-white.rounded-lg",
            text: "p.whitespace-pre-wrap",
          },
          ai: {
            item: "div.rounded-lg.bg-white.w-full.flex.flex-col.border",
            text: "div.prose",
          },
        };
      case "qianwen":
        return {
          user: { item: 'div[class*="bubble"]', text: 'div[class*="bubble"]' },
          ai: { item: ".markdown-pc-special-class", text: ".qk-markdown" },
        };
      case "meta":
        return {
          user: {
            item: 'div[data-message-type="user"] .bg-fill-secondary',
            text: 'div[data-message-type="user"] span[data-slot="text"].text-response',
          },
          ai: {
            item: "div.markdown-content:not(.mp-highlight-anim) .ur-markdown",
            text: "div.ur-markdown.prose p",
          },
        };
      case "manus":
        return {
          user: {
            item: 'div[class*="ltr\\:rounded-br-none"]',
            text: "span.whitespace-pre-wrap",
          },
          ai: {
            item: "div[data-event-id]:has(div.manus-markdown)",
            text: "div.manus-markdown",
          },
        };
      case "xiaomi":
        return {
          user: {
            item: 'div.relative.inline-block.bg-mimo-bg-message[dir="ltr"]',
            text: 'div.relative.inline-block.bg-mimo-bg-message[dir="ltr"]',
          },
          ai: {
            item: "div.group.flex.min-w-0.flex-1.gap-2.flex-row",
            text: ".markdown-prose p",
          },
        };
      case "nvidiaNim":
        return {
          user: {
            item: '[data-testid="chat-bubble-prompt"]',
            text: ".prose p",
          },
          ai: null,
        };
      default:
        return { user: null, ai: null, reverse: !1 };
    }
  }
  function getSafeText(e, t) {
    if (!e) return "";
    try {
      let n = null;
      if (Array.isArray(t)) {
        for (const a of t) if (((n = e.querySelector(a)), n)) break;
      } else n = e.querySelector(t);
      return n
        ? n.innerText || n.textContent || ""
        : e.innerText || e.textContent || "";
    } catch (e) {
      return "";
    }
  }
  function scanMessages() {
    if (NO_NAV_PLATFORMS.includes(currentPlatform)) return [];
    const e = getMessageSelectors(),
      t = [...(cachedMessages || [])];
    let n = [];
    (e.user &&
      document.querySelectorAll(e.user.item).forEach((t) => {
        n.push({
          element: t,
          type: "user",
          textSel: e.user.text,
          topPos: t.getBoundingClientRect().top + window.scrollY,
        });
      }),
      e.ai &&
        document.querySelectorAll(e.ai.item).forEach((t) => {
          n.push({
            element: t,
            type: "ai",
            textSel: e.ai.text,
            topPos: t.getBoundingClientRect().top + window.scrollY,
          });
        }),
      n.sort((e, t) => e.topPos - t.topPos),
      e.reverse && n.reverse());
    const a = n.filter(
      (e) => "all" === navFilterMode || e.type === navFilterMode,
    );
    return (
      (cachedMessages = a.map((e, n) => {
        let a = getSafeText(e.element, e.textSel).replace(/\s+/g, " ").trim();
        const o = t[n];
        (a && 0 !== a.length) ||
          !o ||
          !o.fullText ||
          o.type !== e.type ||
          (a = o.fullText);
        const r = a.length > 35 ? a.substring(0, 35) + "..." : a;
        return {
          element: e.element,
          index: n,
          preview: r,
          fullText: a,
          type: e.type,
        };
      })),
      cachedMessages
    );
  }
  function getVisualIndex() {
    if (!cachedMessages || 0 === cachedMessages.length) return -1;
    const e = window.scrollY + window.innerHeight / 2;
    let t = 0,
      n = 1 / 0;
    return (
      cachedMessages.forEach((a, o) => {
        const r = a.element.getBoundingClientRect();
        if (0 === r.height && 0 === r.width) return;
        const s = window.scrollY + r.top + r.height / 2,
          i = Math.abs(e - s);
        i < n && ((n = i), (t = o));
      }),
      t
    );
  }
  function getScrollParent(e) {
    if (!e) return document.documentElement;
    let t = e.parentElement;
    for (; t;) {
      const e = window.getComputedStyle(t);
      if (
        t.scrollHeight > t.clientHeight &&
        ("auto" === e.overflowY || "scroll" === e.overflowY)
      )
        return t;
      t = t.parentElement;
    }
    return document.documentElement;
  }
  function scrollToMessage(e, t = null) {
    const n = activePins.findIndex((n) =>
      t
        ? n.cacheIdx === e && !0 === n.isHeading && n.headingElement === t
        : n.cacheIdx === e && !1 === n.isHeading,
    );
    if (
      (-1 !== n && focusCarouselOn(n),
      !cachedMessages || 0 === cachedMessages.length)
    )
      return;
    (e < 0 && (e = 0),
      e >= cachedMessages.length && (e = cachedMessages.length - 1));
    const a = cachedMessages[e];
    if (a && a.element) {
      if (!document.body.contains(a.element)) {
        scanMessages();
        const e = cachedMessages.findIndex((e) => e.fullText === a.fullText);
        if (-1 !== e) return void scrollToMessage(e, t);
      }
      const n = t || a.element;
      try {
        if ("kimi" === currentPlatform)
          return (
            (n.style.scrollMarginTop = t ? "15vh" : "30vh"),
            n.scrollIntoView({
              behavior: "auto",
              block: "start",
              inline: "nearest",
            }),
            setTimeout(() => {
              highlightElement(n);
            }, 50),
            saveNavState(e, a.fullText),
            void (
              navListPopup &&
              navListPopup.classList.contains("active") &&
              updateMenuHighlight(e, t)
            )
          );
        const o = getScrollParent(n),
          r = n.getBoundingClientRect(),
          s = o.getBoundingClientRect(),
          i = o === document.documentElement ? window.scrollY : o.scrollTop,
          l = r.top - s.top,
          c = i + l - o.clientHeight * (t ? 0.15 : 0.3);
        (o === document.documentElement
          ? window.scrollTo({ top: c, behavior: "smooth" })
          : o.scrollTo({ top: c, behavior: "smooth" }),
          highlightElement(n),
          saveNavState(e, a.fullText),
          navListPopup &&
            navListPopup.classList.contains("active") &&
            updateMenuHighlight(e, t));
      } catch (e) {
        (n.scrollIntoView({ behavior: "smooth", block: "center" }),
          highlightElement(n));
      }
    }
  }
  function navigateToMessage(e) {
    scanMessages();
    const t = getVisualIndex();
    let n = currentNavIndex;
    ((-1 === n || (-1 !== t && Math.abs(t - n) > 2)) && (n = t),
      -1 === n && (n = 0));
    let a = n;
    ("prev" === e && (a = n - 1),
      "next" === e && (a = n + 1),
      scrollToMessage(a));
  }
  function updateMenuHighlight(e, t = null) {
    const n = navListPopup
      ? navListPopup.querySelector(".mp-nav-scroll-area")
      : null;
    if (!n) return;
    n.querySelectorAll(".current-item").forEach((e) =>
      e.classList.remove("current-item"),
    );
    const a = n.querySelectorAll(".mp-nav-item-wrapper")[e];
    if (a) {
      let e = null;
      if (t) {
        a.querySelectorAll(".mp-nav-sub-item").forEach((n) => {
          n.headingRef === t &&
            (n.classList.add("current-item"),
            (e = n),
            a.classList.add("expanded"));
        });
      }
      (e ||
        ((e = a.querySelector(".main-msg-item")),
        e && e.classList.add("current-item")),
        e && e.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
  }
  function highlightElement(e) {
    e &&
      (e.classList.remove("mp-highlight-anim"),
      e.offsetWidth,
      e.classList.add("mp-highlight-anim"));
  }
  function createNavInterface() {
    if (NO_NAV_PLATFORMS.includes(currentPlatform)) {
      const e = document.getElementById("mp-nav-container");
      e && e.remove();
      const t = document.getElementById("mp-pinned-carousel-wrapper");
      return void (t && t.remove());
    }
    createPinnedCarouselInterface();
    const e = document.getElementById("mp-nav-container");
    if (e)
      return (
        (e.style.display = currentNavConfig.enabled ? "flex" : "none"),
        void renderPinnedCarousel()
      );
    if (!currentNavConfig.enabled) return;
    ((navContainer = document.createElement("div")),
      (navContainer.id = "mp-nav-container"),
      (navContainer.className = "mp-nav-switch"));
    const t = createNavBtn(
        ICONS.navUp,
        () => navigateToMessage("prev"),
        "Previous",
      ),
      n = createNavBtn(ICONS.navMenu, () => toggleNavList(), "List"),
      a = createNavBtn(ICONS.navDown, () => navigateToMessage("next"), "Next");
    (navContainer.appendChild(t),
      navContainer.appendChild(n),
      navContainer.appendChild(a),
      (navListPopup = document.createElement("div")),
      (navListPopup.className = "mp-nav-list-popup"));
    const o = document.createElement("div");
    ((o.className = "mp-nav-header"),
      o.appendChild(createTab("all", ICONS.all, "All")),
      o.appendChild(createTab("user", ICONS.user, "User Prompts")),
      o.appendChild(createTab("ai", ICONS.bot, "AI Responses")),
      navListPopup.appendChild(o));
    const r = document.createElement("div");
    ((r.className = "mp-nav-scroll-area"),
      navListPopup.appendChild(r),
      setupEnhancedScroll(r, "transparent", "0px"),
      navContainer.appendChild(navListPopup),
      document.body.appendChild(navContainer),
      document.addEventListener("click", (e) => {
        navListPopup &&
          navListPopup.classList.contains("active") &&
          navContainer &&
          !navContainer.contains(e.target) &&
          closeNavList();
      }),
      setInterval(syncCarouselWithScroll, 300));
  }
  function createNavBtn(e, t, n) {
    const a = document.createElement("div");
    return (
      (a.className = "mp-nav-btn"),
      setSafeInnerHTML(a, e),
      (a.onclick = (e) => {
        (e.stopPropagation(), t(e));
      }),
      createCustomTooltip(a, n, "left"),
      a
    );
  }
  function createTab(e, t, n) {
    const a = document.createElement("div");
    return (
      (a.className = "mp-nav-tab " + (navFilterMode === e ? "active" : "")),
      setSafeInnerHTML(a, t),
      (a.onclick = (t) => {
        (t.stopPropagation(), setNavFilter(e));
      }),
      createCustomTooltip(a, n, "top"),
      a
    );
  }
  function setNavFilter(e) {
    ((navFilterMode = e),
      (currentNavConfig.filterMode = e),
      saveNavConfig(currentNavConfig));
    const t = navListPopup.querySelectorAll(".mp-nav-tab");
    (t.forEach((e) => e.classList.remove("active")),
      "all" === e && t[0].classList.add("active"),
      "user" === e && t[1].classList.add("active"),
      "ai" === e && t[2].classList.add("active"),
      renderNavListItems());
  }
  function toggleNavList() {
    navListPopup &&
      (navListPopup.classList.contains("active")
        ? closeNavList()
        : openNavList());
  }
  function openNavList() {
    if (
      (navListPopup.classList.add("active"),
      renderNavListItems(),
      -1 !== currentNavIndex)
    )
      updateMenuHighlight(currentNavIndex);
    else {
      const e = getVisualIndex();
      -1 !== e && updateMenuHighlight(e);
    }
  }
  function closeNavList() {
    navListPopup.classList.remove("active");
  }
  function startGlobalDomWatcher() {
    (globalDomWatcherInterval && clearInterval(globalDomWatcherInterval),
      (globalDomWatcherInterval = setInterval(() => {
        if (!currentNavConfig || !currentNavConfig.enabled) return;
        if (NO_NAV_PLATFORMS.includes(currentPlatform)) return;
        const e = document.getElementById("mp-nav-container"),
          t = document.getElementById("mp-pinned-carousel-wrapper");
        if (e && t) {
          if (activePins && activePins.length > 0) {
            const e = document.getElementById("mp-pinned-track");
            (e && 0 !== e.children.length) || renderPinnedCarousel();
          }
        } else (createNavInterface(), updateActivePins());
        const n = getMessageSelectors();
        if (!n) return;
        let a = 0;
        (n.user && (a += document.querySelectorAll(n.user.item).length),
          n.ai && (a += document.querySelectorAll(n.ai.item).length),
          a !== navLastDomCount &&
            ((navLastDomCount = a),
            scanMessages(),
            updateActivePins(),
            navListPopup &&
              navListPopup.classList.contains("active") &&
              renderNavListItems()));
      }, 1500)));
  }
  function escapeHtml(e) {
    if (!e) return e;
    const t = document.createElement("div");
    return ((t.textContent = e), t.innerHTML);
  }
  function createPinAction(e, t = null) {
    const n = document.createElement("div");
    n.className = "mp-nav-msg-actions";
    const a = isItemPinned(e, t),
      o = document.createElement("div");
    ((o.className = "mp-pin-btn " + (a ? "is-pinned" : "")),
      setSafeInnerHTML(o, ICONS.pin));
    const r = (e = !1) => {
      const t = o.classList.contains("is-pinned") ? "Unpin" : "Pin";
      (createCustomTooltip(o, t, "left"),
        e && o.dispatchEvent(new Event("mouseenter")));
    };
    return (
      r(),
      (o.onclick = (n) => {
        n.stopPropagation();
        (togglePinData(e, t)
          ? o.classList.add("is-pinned")
          : o.classList.remove("is-pinned"),
          r(!0));
      }),
      n.appendChild(o),
      n
    );
  }
  function renderNavListItems() {
    (scanMessages(), updateActivePins());
    const e = navListPopup.querySelector(".mp-nav-scroll-area");
    if (!e) return;
    if ((setSafeInnerHTML(e, ""), 0 === cachedMessages.length)) {
      const t = document.createElement("div");
      return (
        (t.className = "mp-nav-list-item"),
        (t.textContent = "No conversations"),
        (t.style.justifyContent = "center"),
        (t.style.opacity = "0.5"),
        void e.appendChild(t)
      );
    }
    let t = currentNavIndex;
    -1 === t && (t = getVisualIndex());
    const n = document.createDocumentFragment();
    (cachedMessages.forEach((e, a) => {
      const o = document.createElement("div");
      o.className = "mp-nav-item-wrapper";
      const r = document.createElement("div");
      ((r.className = "mp-nav-list-item main-msg-item"),
        a === t && r.classList.add("current-item"));
      const s =
          "all" === navFilterMode && "ai" === e.type
            ? `<div class="mp-nav-type-icon">${ICONS.ai}</div>`
            : "",
        i = escapeHtml(e.preview || "..."),
        l = Array.from(e.element.querySelectorAll("h1, h2, h3, h4, h5, h6")),
        c = l.length > 0;
      let d = "";
      d = c
        ? `<div class="mp-nav-idx-badge has-topics"><span class="mp-nav-idx-number">${a + 1}</span><div class="mp-nav-expand-icon">${ICONS.chevronR}</div></div>`
        : `<div class="mp-nav-idx-badge"><span class="mp-nav-idx-number">${a + 1}</span></div>`;
      if (
        (setSafeInnerHTML(
          r,
          `${d}<span class="mp-nav-preview-text">${i}</span>${s}`,
        ),
        r.appendChild(createPinAction(e)),
        c)
      ) {
        const e = r.querySelector(".mp-nav-idx-badge.has-topics");
        e && createCustomTooltip(e, "Topics", "left");
      }
      if (
        ((r.onclick = (e) => {
          (e.stopPropagation(),
            e.target.closest(".mp-nav-msg-actions") ||
              (e.target.closest(".mp-nav-idx-badge.has-topics")
                ? toggleSubMenu(o)
                : scrollToMessage(a)));
        }),
        o.appendChild(r),
        c)
      ) {
        const t = document.createElement("div");
        ((t.className = "mp-nav-submenu"),
          l.forEach((n) => {
            const o = parseInt(n.tagName.substring(1)),
              r = document.createElement("div");
            ((r.className = `mp-nav-sub-item level-${o}`), (r.headingRef = n));
            (setSafeInnerHTML(
              r,
              `<span class="mp-nav-sub-text">${escapeHtml(getSafeText(n, null) || "...")}</span>`,
            ),
              r.appendChild(createPinAction(e, n)),
              (r.onclick = (e) => {
                (e.stopPropagation(),
                  e.target.closest(".mp-nav-msg-actions") ||
                    scrollToMessage(a, n));
              }),
              t.appendChild(r));
          }),
          o.appendChild(t));
      }
      n.appendChild(o);
    }),
      e.appendChild(n));
    const a = e.querySelector(".current-item");
    a && setTimeout(() => a.scrollIntoView({ block: "nearest" }), 50);
    const o = getMessageSelectors();
    ((navLastDomCount = 0),
      o.user &&
        (navLastDomCount += document.querySelectorAll(o.user.item).length),
      o.ai && (navLastDomCount += document.querySelectorAll(o.ai.item).length));
  }
  function toggleSubMenu(e) {
    e.classList.toggle("expanded");
  }
  function getCarouselPosition() {
    const e = currentNavConfig.settings.carouselPosition;
    return e && "object" == typeof e
      ? "cx" in e
        ? e
        : (null === e.left || e.left,
          { cx: null, ty: null != e.top ? e.top : 15 })
      : { cx: null, ty: 15 };
  }
  function applyCarouselPosition() {
    if (!pinnedCarouselContainer) return;
    const e = getCarouselPosition();
    null === e.cx
      ? ((pinnedCarouselContainer.style.left = "50%"),
        (pinnedCarouselContainer.style.top = (e.ty || 15) + "px"),
        (pinnedCarouselContainer.style.transform = "translateX(-50%)"))
      : ((pinnedCarouselContainer.style.left = e.cx + "px"),
        (pinnedCarouselContainer.style.top = e.cy + "px"),
        (pinnedCarouselContainer.style.transform = "translate(-50%, -50%)"));
  }
  function constrainCenter(e, t, n, a) {
    return {
      cx: Math.max(n / 2 + 5, Math.min(e, window.innerWidth - n / 2 - 5)),
      cy: Math.max(a / 2 + 5, Math.min(t, window.innerHeight - a / 2 - 5)),
    };
  }
  function createRulers() {
    if (rulersContainer) return;
    ((rulersContainer = document.createElement("div")),
      (rulersContainer.id = "mp-rulers-container"),
      (rulersContainer.className = "mp-rulers-container"));
    ([
      { c: "mp-ruler-screen-v", t: "div" },
      { c: "mp-ruler-screen-h", t: "div" },
      { c: "mp-ruler-carousel-v", t: "div" },
      { c: "mp-ruler-carousel-h", t: "div" },
      { c: "mp-ruler-label mp-ruler-label-v", t: "span", x: "X" },
      { c: "mp-ruler-label mp-ruler-label-h", t: "span", x: "Y" },
    ].forEach((e) => {
      const t = document.createElement(e.t);
      ((t.className = e.c),
        e.x && (t.textContent = e.x),
        rulersContainer.appendChild(t));
    }),
      document.body.appendChild(rulersContainer));
  }
  function removeRulers() {
    rulersContainer && (rulersContainer.remove(), (rulersContainer = null));
  }
  function updateRulers() {
    if (!rulersContainer || !pinnedCarouselContainer) return;
    const e = pinnedCarouselContainer.getBoundingClientRect(),
      t = e.left + e.width / 2,
      n = e.top + e.height / 2,
      a = window.innerWidth / 2,
      o = window.innerHeight / 2,
      r = rulersContainer.querySelector(".mp-ruler-screen-v"),
      s = rulersContainer.querySelector(".mp-ruler-screen-h");
    (r && (r.style.left = a + "px"), s && (s.style.top = o + "px"));
    const i = rulersContainer.querySelector(".mp-ruler-carousel-v"),
      l = rulersContainer.querySelector(".mp-ruler-carousel-h");
    (i && (i.style.left = t + "px"), l && (l.style.top = n + "px"));
    const c = rulersContainer.querySelector(".mp-ruler-label-v"),
      d = rulersContainer.querySelector(".mp-ruler-label-h");
    (c && (c.style.left = a + "px"),
      d && (d.style.top = o + "px"),
      rulersContainer.classList.toggle("mp-snapped-x", Math.abs(t - a) < 10),
      rulersContainer.classList.toggle("mp-snapped-y", Math.abs(n - o) < 10));
  }
  function enterDragMode() {
    (!1 === currentNavConfig.settings.showCarousel &&
      ((currentNavConfig.settings.showCarousel = !0),
      saveNavConfig(currentNavConfig)),
      (isDragMode = !0),
      (isDragging = !1),
      createRulers(),
      renderPinnedCarousel(),
      requestAnimationFrame(() => updateRulers()));
  }
  function exitDragMode() {
    ((isDragMode = !1),
      (isDragging = !1),
      document.body.classList.remove("mp-dragging-active"),
      removeRulers(),
      renderPinnedCarousel());
  }
  function resetCarouselPosition() {
    ((isDragging = !1),
      (currentNavConfig.settings.carouselPosition = { cx: null, ty: 15 }),
      (currentNavConfig.settings.carouselOrientation = "horizontal"),
      (currentNavConfig.settings.carouselActionsSide = "bottom"),
      saveNavConfig(currentNavConfig),
      applyCarouselPosition(),
      renderPinnedCarousel(),
      requestAnimationFrame(() => updateRulers()));
  }
  function saveCarouselPosition() {
    const e = getCarouselPosition();
    if (null !== e.cx) {
      const t = window.innerWidth / 2;
      if (Math.abs(e.cx - t) < 8) {
        const e = pinnedCarouselContainer.getBoundingClientRect();
        currentNavConfig.settings.carouselPosition = { cx: null, ty: e.top };
      }
    }
    (saveNavConfig(currentNavConfig), exitDragMode());
  }
  function flipCarouselOrientation() {
    isDragging = !1;
    const e = currentNavConfig.settings.carouselOrientation || "horizontal";
    ((currentNavConfig.settings.carouselOrientation =
      "horizontal" === e ? "vertical" : "horizontal"),
      (currentNavConfig.settings.carouselActionsSide =
        "horizontal" === currentNavConfig.settings.carouselOrientation
          ? "bottom"
          : "right"),
      saveNavConfig(currentNavConfig),
      renderPinnedCarousel(),
      requestAnimationFrame(() => {
        if (!pinnedCarouselContainer) return;
        const e = pinnedCarouselContainer.getBoundingClientRect();
        const t = constrainCenter(
          e.left + e.width / 2,
          e.top + e.height / 2,
          e.width,
          e.height,
        );
        ((currentNavConfig.settings.carouselPosition = { cx: t.cx, cy: t.cy }),
          applyCarouselPosition(),
          saveNavConfig(currentNavConfig),
          isDragMode && updateRulers());
      }));
  }
  function switchActionsSide() {
    isDragging = !1;
    const e = currentNavConfig.settings.carouselOrientation || "horizontal",
      t =
        currentNavConfig.settings.carouselActionsSide ||
        ("horizontal" === e ? "bottom" : "right");
    ((currentNavConfig.settings.carouselActionsSide =
      "horizontal" === e
        ? "bottom" === t
          ? "top"
          : "bottom"
        : "right" === t
          ? "left"
          : "right"),
      saveNavConfig(currentNavConfig),
      renderPinnedCarousel(),
      requestAnimationFrame(() => {
        if (!pinnedCarouselContainer) return;
        const e = pinnedCarouselContainer.getBoundingClientRect();
        const t = constrainCenter(
          e.left + e.width / 2,
          e.top + e.height / 2,
          e.width,
          e.height,
        );
        ((currentNavConfig.settings.carouselPosition = { cx: t.cx, cy: t.cy }),
          applyCarouselPosition(),
          saveNavConfig(currentNavConfig),
          isDragMode && updateRulers());
      }));
  }
  function handleDragStart(e) {
    if (!isDragMode) return;
    if (e.target.closest(".mp-pinned-action-btn")) return;
    if (e.target.closest(".mp-pinned-card-unpin")) return;
    (e.preventDefault(),
      (isDragging = !0),
      document.body.classList.add("mp-dragging-active"));
    const t = e.touches ? e.touches[0].clientX : e.clientX,
      n = e.touches ? e.touches[0].clientY : e.clientY,
      a = pinnedCarouselContainer.getBoundingClientRect();
    ((dragState.offsetX = a.left + a.width / 2 - t),
      (dragState.offsetY = a.top + a.height / 2 - n),
      (dragState.wW = a.width),
      (dragState.wH = a.height),
      pinnedCarouselContainer.classList.add("mp-is-being-dragged"));
  }
  function handleDragMove(e) {
    if (!isDragging || !isDragMode) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0].clientX : e.clientX,
      n = e.touches ? e.touches[0].clientY : e.clientY;
    let a = t + dragState.offsetX,
      o = n + dragState.offsetY;
    const r = window.innerWidth / 2,
      s = window.innerHeight / 2;
    (Math.abs(a - r) < 8 && (a = r), Math.abs(o - s) < 8 && (o = s));
    const i = constrainCenter(a, o, dragState.wW, dragState.wH);
    ((currentNavConfig.settings.carouselPosition = { cx: i.cx, cy: i.cy }),
      applyCarouselPosition(),
      updateRulers());
  }
  function handleDragEnd() {
    isDragging &&
      ((isDragging = !1),
      document.body.classList.remove("mp-dragging-active"),
      pinnedCarouselContainer &&
        pinnedCarouselContainer.classList.remove("mp-is-being-dragged"),
      saveNavConfig(currentNavConfig));
  }
  function updateActivePins() {
    if (!cachedMessages) return;
    const e = [];
    cachedMessages.forEach((t, n) => {
      isItemPinned(t) &&
        e.push({ msg: t, cacheIdx: n, isHeading: !1, text: t.preview });
      Array.from(t.element.querySelectorAll("h1, h2, h3, h4, h5, h6")).forEach(
        (a) => {
          if (isItemPinned(t, a)) {
            const o = (a.innerText || a.textContent || "").trim();
            e.push({
              msg: t,
              cacheIdx: n,
              isHeading: !0,
              headingElement: a,
              text: o,
            });
          }
        },
      );
    });
    const t = e.map((e) => e.cacheIdx + "-" + e.text).join("|");
    ((activePins = e),
      t !== lastPinsHash && ((lastPinsHash = t), renderPinnedCarousel()));
  }
  function createPinnedCarouselInterface() {
    if (NO_NAV_PLATFORMS.includes(currentPlatform)) return;
    let e = document.getElementById("mp-pinned-carousel-wrapper");
    if (
      (e
        ? (pinnedCarouselContainer = e)
        : ((pinnedCarouselContainer = document.createElement("div")),
          (pinnedCarouselContainer.id = "mp-pinned-carousel-wrapper"),
          (pinnedCarouselContainer.className = "mp-pinned-carousel-wrapper"),
          document.body.appendChild(pinnedCarouselContainer)),
      applyCarouselPosition(),
      pinnedCarouselContainer.hasScrollNavListener ||
        (pinnedCarouselContainer.addEventListener(
          "wheel",
          (e) => {
            isDragMode ||
              isPinnedListMode ||
              activePins.length <= 1 ||
              (pinnedCarouselContainer.contains(e.target) &&
                (e.preventDefault(),
                e.stopPropagation(),
                moveCarousel(e.deltaY > 0 ? 1 : -1)));
          },
          { passive: !1 },
        ),
        (pinnedCarouselContainer.hasScrollNavListener = !0)),
      pinnedCarouselContainer.hasDragListeners ||
        (pinnedCarouselContainer.addEventListener("mousedown", handleDragStart),
        pinnedCarouselContainer.addEventListener(
          "touchstart",
          handleDragStart,
          { passive: !1 },
        ),
        document.addEventListener("mousemove", handleDragMove),
        document.addEventListener("touchmove", handleDragMove, { passive: !1 }),
        document.addEventListener("mouseup", handleDragEnd),
        document.addEventListener("touchend", handleDragEnd),
        (pinnedCarouselContainer.hasDragListeners = !0)),
      !pinnedCarouselContainer.hasResizeWatcher)
    ) {
      (new ResizeObserver(() => {
        if (!pinnedCarouselContainer || !currentNavConfig) return;
        const e = getCarouselPosition();
        if (null !== e.cx) {
          const t = pinnedCarouselContainer.getBoundingClientRect(),
            n = t.left + t.width / 2,
            a = t.top + t.height / 2;
          if (
            n < 0 ||
            n > window.innerWidth ||
            a < 0 ||
            a > window.innerHeight
          ) {
            const n = Math.max(
                t.width / 2 + 10,
                Math.min(e.cx, window.innerWidth - t.width / 2 - 10),
              ),
              a = Math.max(
                t.height / 2 + 10,
                Math.min(e.cy, window.innerHeight - t.height / 2 - 10),
              );
            ((pinnedCarouselContainer.style.left = n + "px"),
              (pinnedCarouselContainer.style.top = a + "px"));
          } else applyCarouselPosition();
        }
        isDragMode && updateRulers();
      }).observe(document.documentElement),
        (pinnedCarouselContainer.hasResizeWatcher = !0));
    }
  }
  function renderPinnedCarousel() {
    if (
      (document.getElementById("mp-pinned-carousel-wrapper") ||
        createPinnedCarouselInterface(),
      !pinnedCarouselContainer)
    )
      return;
    if (!currentNavConfig || !currentNavConfig.enabled)
      return (
        (pinnedCarouselContainer.style.display = "none"),
        void setSafeInnerHTML(pinnedCarouselContainer, "")
      );
    if (0 === activePins.length)
      return (
        (pinnedCarouselContainer.style.display = "none"),
        void setSafeInnerHTML(pinnedCarouselContainer, "")
      );
    const e = currentNavConfig.settings.carouselOrientation || "horizontal",
      t =
        currentNavConfig.settings.carouselActionsSide ||
        ("horizontal" === e ? "bottom" : "right"),
      n = "vertical" === e,
      a = !1 !== currentNavConfig.settings.showCarousel,
      o = !n && isPinnedListMode;
    if (
      ((pinnedCarouselContainer.className = "mp-pinned-carousel-wrapper"),
      pinnedCarouselContainer.classList.add(n ? "mp-orient-v" : "mp-orient-h"),
      isDragMode && pinnedCarouselContainer.classList.add("mp-drag-mode"),
      a || pinnedCarouselContainer.classList.add("is-hidden"),
      o && pinnedCarouselContainer.classList.add("is-list-mode"),
      (pinnedCarouselContainer.style.display = "flex"),
      setSafeInnerHTML(pinnedCarouselContainer, ""),
      applyCarouselPosition(),
      isDragMode)
    ) {
      const e = document.createElement("div");
      e.className = "mp-drag-crosshair";
      const t = document.createElement("div");
      t.className = "mp-drag-ch-line mp-drag-ch-h";
      const n = document.createElement("div");
      n.className = "mp-drag-ch-line mp-drag-ch-v";
      const a = document.createElement("div");
      ((a.className = "mp-drag-ch-dot"),
        e.appendChild(t),
        e.appendChild(n),
        e.appendChild(a),
        pinnedCarouselContainer.appendChild(e));
    }
    const r = document.createElement("div");
    if (((r.className = "mp-pinned-actions-panel"), isDragMode)) {
      const e = document.createElement("div");
      ((e.className = "mp-pinned-action-btn mp-reset-btn"),
        setSafeInnerHTML(e, ICONS.reset),
        createCustomTooltip(e, "Restore Default", t),
        (e.onclick = (e) => {
          (e.stopPropagation(), resetCarouselPosition());
        }));
      const a = document.createElement("div");
      ((a.className = "mp-pinned-action-btn mp-save-btn"),
        setSafeInnerHTML(a, ICONS.save),
        createCustomTooltip(a, "Save", t),
        (a.onclick = (e) => {
          (e.stopPropagation(), saveCarouselPosition());
        }));
      const o = document.createElement("div");
      ((o.className = "mp-pinned-action-btn"),
        setSafeInnerHTML(o, ICONS.flip),
        createCustomTooltip(
          o,
          n ? "Horizontal" : "Vertical",
          t,
        ),
        (o.onclick = (e) => {
          (e.stopPropagation(), flipCarouselOrientation());
        }));
      const s = document.createElement("div");
      ((s.className = "mp-pinned-action-btn"),
        setSafeInnerHTML(s, n ? ICONS.switchH : ICONS.switchV));
      (createCustomTooltip(
        s,
        n
            ? "right" === t
              ? "Left"
              : "Right"
            : "bottom" === t
              ? "Up"
              : "Down",
        t,
      ),
        (s.onclick = (e) => {
          (e.stopPropagation(), switchActionsSide());
        }),
        r.appendChild(e),
        r.appendChild(a),
        r.appendChild(o),
        r.appendChild(s));
    } else {
      const e = document.createElement("div");
      ((e.className = "mp-pinned-action-btn"),
        setSafeInnerHTML(e, ICONS.drag),
        createCustomTooltip(e, "Move", t),
        (e.onclick = (e) => {
          (e.stopPropagation(), enterDragMode());
        }));
      const o = document.createElement("div");
      if (
        ((o.className = "mp-pinned-action-btn"),
        setSafeInnerHTML(o, ICONS.olho),
        createCustomTooltip(o, a ? "Hide" : "Show", t),
        (o.onclick = (e) => {
          (e.stopPropagation(),
            (currentNavConfig.settings.showCarousel = !a),
            saveNavConfig(currentNavConfig),
            renderPinnedCarousel());
        }),
        r.appendChild(e),
        r.appendChild(o),
        !n)
      ) {
        const e = document.createElement("div");
        ((e.className =
          "mp-pinned-action-btn" + (isPinnedListMode ? " active" : "")),
          setSafeInnerHTML(e, ICONS.navMenu),
          createCustomTooltip(e, "List", t),
          (e.onclick = (e) => {
            (e.stopPropagation(),
              (isPinnedListMode = !isPinnedListMode),
              isPinnedListMode &&
                !a &&
                ((currentNavConfig.settings.showCarousel = !0),
                saveNavConfig(currentNavConfig)),
              renderPinnedCarousel());
          }),
          r.appendChild(e));
      }
      const s = document.createElement("div");
      ((s.className = "mp-pinned-action-btn delete-btn"),
        setSafeInnerHTML(s, ICONS.delete),
        createCustomTooltip(s, "Unpin All", t),
        (s.onclick = async (e) => {
          e.stopPropagation();
          const t = await createDialogo({
            message: "Unpin all pins from this conversation?",
            type: "confirm",
            dontShowAgainId: "confirm-unpin-all",
          });
          (!0 !== t && "dont_show_again" !== t) ||
            ((savedPins = []),
            await savePinsToDB(currentChatId, savedPins),
            updateActivePins(),
            navListPopup &&
              navListPopup.classList.contains("active") &&
              renderNavListItems());
        }),
        r.appendChild(s));
    }
    const s = document.createElement("div");
    s.className = "mp-pinned-main-wrapper";
    const i = activePins.length > 1 && !o;
    if (i) {
      const e = document.createElement("div");
      ((e.className = "mp-carousel-nav " + (n ? "up" : "left")),
        setSafeInnerHTML(e, ICONS.chevronR),
        (e.onclick = (e) => {
          (e.stopPropagation(), moveCarousel(-1));
        }),
        s.appendChild(e));
    }
    const l = document.createElement("div");
    ((l.className = "mp-pinned-viewport"),
      1 === activePins.length && l.classList.add("is-single-item"));
    const c = document.createElement("div");
    if (
      ((c.className = "mp-pinned-track"),
      (c.id = "mp-pinned-track"),
      activePins.forEach((e, t) => {
        const n = document.createElement("div");
        ((n.className = "mp-pinned-card"),
          (n.dataset.idx = t),
          o && (n.style.animationDelay = 0.05 * t + "s"));
        (setSafeInnerHTML(
          n,
          '<div class="mp-pinned-card-text">' +
            escapeHtml(e.text) +
            '</div><div class="mp-pinned-card-unpin">' +
            ICONS.pin +
            "</div>",
        ),
          (n.onclick = (n) => {
            isDragMode ||
              n.target.closest(".mp-pinned-card-unpin") ||
              (n.stopPropagation(),
              focusCarouselOn(t),
              scrollToMessage(e.cacheIdx, e.headingElement || null));
          }),
          (n.querySelector(".mp-pinned-card-unpin").onclick = (t) => {
            isDragMode ||
              (t.stopPropagation(),
              togglePinData(e.msg, e.headingElement || null),
              navListPopup &&
                navListPopup.classList.contains("active") &&
                renderNavListItems());
          }),
          c.appendChild(n));
      }),
      l.appendChild(c),
      s.appendChild(l),
      i)
    ) {
      const e = document.createElement("div");
      ((e.className = "mp-carousel-nav " + (n ? "down" : "right")),
        setSafeInnerHTML(e, ICONS.chevronR),
        (e.onclick = (e) => {
          (e.stopPropagation(), moveCarousel(1));
        }),
        s.appendChild(e));
    }
    (n
      ? "left" === t
        ? (pinnedCarouselContainer.appendChild(r),
          pinnedCarouselContainer.appendChild(s))
        : (pinnedCarouselContainer.appendChild(s),
          pinnedCarouselContainer.appendChild(r))
      : "top" === t
        ? (pinnedCarouselContainer.appendChild(r),
          pinnedCarouselContainer.appendChild(s))
        : (pinnedCarouselContainer.appendChild(s),
          pinnedCarouselContainer.appendChild(r)),
      o && setupEnhancedScroll(l, "transparent", "8px"),
      focusCarouselOn(currentPinnedCenterIdx),
      isDragMode && requestAnimationFrame(() => updateRulers()));
  }
  function moveCarousel(e) {
    if (isDragMode) return;
    let t = currentPinnedCenterIdx + e;
    (t < 0 && (t = 0),
      t >= activePins.length && (t = activePins.length - 1),
      focusCarouselOn(t),
      scrollToMessage(
        activePins[t].cacheIdx,
        activePins[t].headingElement || null,
      ));
  }
  function focusCarouselOn(e) {
    if (0 === activePins.length) return;
    (e < 0 && (e = 0),
      e >= activePins.length && (e = activePins.length - 1),
      (currentPinnedCenterIdx = e));
    const t = document.getElementById("mp-pinned-track");
    if (!t) return;
    const n = Array.from(t.children),
      a = "vertical" === currentNavConfig.settings.carouselOrientation,
      o = !a && isPinnedListMode;
    if (
      (n.forEach((t, n) => t.classList.toggle("active-center", n === e)), o)
    ) {
      t.style.transform = "none";
      const a = n[e],
        o = t.parentElement;
      return void (
        a &&
        o &&
        o.classList.contains("mp-pinned-viewport") &&
        o.scrollTo({
          top: a.offsetTop - o.clientHeight / 2 + a.clientHeight / 2,
          behavior: "smooth",
        })
      );
    }
    if (0 !== n.length)
      if (a) {
        const a = n[0].offsetHeight + 12,
          o = (n.length / 2 - 0.5 - e) * a;
        t.style.transform = "translateY(" + o + "px)";
      } else {
        const a = n[0].offsetWidth + 12,
          o = (n.length / 2 - 0.5 - e) * a;
        t.style.transform = "translateX(" + o + "px)";
      }
  }
  function syncCarouselWithScroll() {}
  const AUTO_BACKUP_KEY = "AutoBackup";
  const AUTO_BACKUP_KEYS = [
    "Prompts",
    "GlobalFiles",
    "PromptTags",
    "Theme",
    "ImportedThemes",
    "ShortcutsConfig",
    "NavConfig",
    "Prediction",
    "SyntaxHighlight",
    "PreviewPrompt",
    "DontShowAgain",
  ];
  const SCRIPT_VERSION =
    typeof GM_info !== "undefined" &&
    GM_info &&
    GM_info.script &&
    GM_info.script.version
      ? GM_info.script.version
      : "27.2.1";
  async function snapshotKeys(keys) {
    const snapshot = {};
    for (const k of keys) {
      const v = await GM_getValue(k);
      if (v != null) snapshot[k] = v;
    }
    return snapshot;
  }
  let _autoBackupTimer = null;
  async function takeAutoBackup() {
    try {
      const snapshot = await snapshotKeys(AUTO_BACKUP_KEYS);
      if (Object.keys(snapshot).length > 0) {
        await GM_setValue(AUTO_BACKUP_KEY, JSON.stringify(snapshot));
      }
    } catch (e) {}
  }
  function scheduleAutoBackup() {
    if (_autoBackupTimer) clearTimeout(_autoBackupTimer);
    _autoBackupTimer = setTimeout(takeAutoBackup, 1500);
  }
  async function restoreFromAutoBackup() {
    try {
      const existing = await GM_getValue("Prompts");
      const hasData =
        existing != null &&
        (typeof existing === "object"
          ? Object.keys(existing).length > 0
          : true);
      if (hasData) return false;
      const raw = await GM_getValue(AUTO_BACKUP_KEY);
      if (!raw) return false;
      const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!snapshot || typeof snapshot !== "object") return false;
      for (const [k, v] of Object.entries(snapshot)) {
        await GM_setValue(k, v);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  const GIST_CONFIG_KEY = "GistConfig";
  const DEFAULT_GIST_CONFIG = { pat: "", gistId: "" };
  let currentGistConfig = { ...DEFAULT_GIST_CONFIG };
  async function loadGistConfig() {
    try {
      const e = await GM_getValue(GIST_CONFIG_KEY);
      currentGistConfig = e
        ? {
            ...DEFAULT_GIST_CONFIG,
            ...(typeof e === "string" ? JSON.parse(e) : e),
          }
        : { ...DEFAULT_GIST_CONFIG };
    } catch (e) {
      currentGistConfig = { ...DEFAULT_GIST_CONFIG };
    }
  }
  async function saveGistConfig(e) {
    currentGistConfig = { ...currentGistConfig, ...e };
    await GM_setValue(GIST_CONFIG_KEY, JSON.stringify(currentGistConfig));
  }
  async function findExistingBackupGist(pat) {
    const filename = "MyPrompt_Backup.mp.backup.json";
    const MAX_GIST_PAGES = 40;
    const fetchPage = (page) =>
      new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "GET",
          url: `https://api.github.com/gists?per_page=100&page=${page}`,
          headers: {
            Authorization: `Bearer ${pat}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          onload: (e) => {
            if (e.status !== 200) {
              let msg = `GitHub API error ${e.status}`;
              try {
                const r = JSON.parse(e.responseText);
                if (r.message) msg += `: ${r.message}`;
              } catch (_) {}
              return void reject(new Error(msg));
            }
            try {
              resolve(JSON.parse(e.responseText));
            } catch (err) {
              reject(new Error("Failed to parse GitHub gist list"));
            }
          },
          onerror: () =>
            reject(new Error("Network error contacting GitHub API")),
        });
      });
    for (let page = 1; page <= MAX_GIST_PAGES; page++) {
      const list = await fetchPage(page);
      if (!Array.isArray(list)) return null;
      const match = list.find((g) => g.files && g.files[filename]);
      if (match) return match.id;
      if (list.length < 100) return null;
    }
    return null;
  }
  async function pushBackupToGist() {
    const pat = currentGistConfig.pat.trim();
    if (!pat)
      throw new Error(
        "No GitHub PAT configured. Add it in Settings → Advanced.",
      );
    let gistId = currentGistConfig.gistId.trim();
    if (!gistId) {
      // Don't blindly create a new gist: this token may already have a
      // backup from another device that just never got its ID carried
      // over locally. Find and reuse it instead of forking a duplicate.
      gistId = await findExistingBackupGist(pat);
      if (gistId) await saveGistConfig({ gistId });
    }
    const snapshot = await snapshotKeys(AUTO_BACKUP_KEYS);
    const content = JSON.stringify(
      {
        meta: {
          scriptName: "My Prompt",
          version: SCRIPT_VERSION,
          exportDate: new Date().toISOString(),
        },
        data: snapshot,
      },
      null,
      2,
    );
    const filename = "MyPrompt_Backup.mp.backup.json";
    const isUpdate = !!gistId;
    const url = isUpdate
      ? `https://api.github.com/gists/${gistId}`
      : "https://api.github.com/gists";
    const method = isUpdate ? "PATCH" : "POST";
    const body = isUpdate
      ? { files: { [filename]: { content } } }
      : {
          description: "My Prompt — automatic backup",
          public: false,
          files: { [filename]: { content } },
        };
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method,
        url,
        headers: {
          Authorization: `Bearer ${pat}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        data: JSON.stringify(body),
        onload: async (e) => {
          if (e.status === 200 || e.status === 201) {
            try {
              const r = JSON.parse(e.responseText);
              if (r.id && r.id !== gistId) {
                await saveGistConfig({ gistId: r.id });
              }
              resolve({ created: !isUpdate, url: r.html_url });
            } catch (err) {
              reject(new Error("Failed to parse GitHub response"));
            }
          } else {
            let msg = `GitHub API error ${e.status}`;
            try {
              const r = JSON.parse(e.responseText);
              if (r.message) msg += `: ${r.message}`;
            } catch (_) {}
            reject(new Error(msg));
          }
        },
        onerror: () => reject(new Error("Network error contacting GitHub API")),
      });
    });
  }
  async function pullBackupFromGist() {
    const pat = currentGistConfig.pat.trim();
    if (!pat)
      throw new Error(
        "No GitHub PAT configured. Add it in Settings → Advanced.",
      );
    let gistId = currentGistConfig.gistId.trim();
    if (!gistId) {
      gistId = await findExistingBackupGist(pat);
      if (!gistId)
        throw new Error(
          "No backup found on GitHub for this token. Sync from another device first, or paste a Gist ID manually in Settings → Advanced.",
        );
      await saveGistConfig({ gistId });
    }
    const filename = "MyPrompt_Backup.mp.backup.json";
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.github.com/gists/${gistId}`,
        headers: {
          Authorization: `Bearer ${pat}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        onload: (e) => {
          if (e.status === 200) {
            try {
              const r = JSON.parse(e.responseText);
              const file =
                r.files && (r.files[filename] || Object.values(r.files)[0]);
              if (!file || !file.content)
                return void reject(new Error("Gist has no backup file"));
              const parsed = JSON.parse(file.content);
              if (!parsed || !parsed.data)
                return void reject(new Error("Invalid backup format in Gist"));
              resolve({ data: parsed.data, meta: parsed.meta || {} });
            } catch (err) {
              reject(new Error("Failed to parse Gist content"));
            }
          } else {
            let msg = `GitHub API error ${e.status}`;
            try {
              const r = JSON.parse(e.responseText);
              if (r.message) msg += `: ${r.message}`;
            } catch (_) {}
            reject(new Error(msg));
          }
        },
        onerror: () => reject(new Error("Network error contacting GitHub API")),
      });
    });
  }
  function showFirstRunBanner() {
    if (document.getElementById("mp-first-run-banner")) return;
    const bar = document.createElement("div");
    bar.id = "mp-first-run-banner";
    bar.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 16px;background:var(--mp-accent-primary,#7071fc);color:#fff;font-family:var(--mp-font-family-base,sans-serif);font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.2);";
    const msg = document.createElement("span");
    msg.textContent = "No local data found. Restore from a previous backup?";
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = "Restore";
    restoreBtn.style.cssText =
      "padding:4px 12px;border:none;border-radius:4px;background:#fff;color:var(--mp-accent-primary,#7071fc);cursor:pointer;font-weight:600;";
    restoreBtn.onclick = () => {
      bar.remove();
      openBackupManager();
    };
    const dismissBtn = document.createElement("button");
    dismissBtn.textContent = "Start Fresh";
    dismissBtn.style.cssText =
      "padding:4px 12px;border:1px solid #fff;border-radius:4px;background:transparent;color:#fff;cursor:pointer;";
    dismissBtn.onclick = async () => {
      bar.remove();
      await GM_setValue("FirstRunDismissed", true);
    };
    bar.appendChild(msg);
    bar.appendChild(restoreBtn);
    bar.appendChild(dismissBtn);
    document.body.appendChild(bar);
  }
  async function checkFirstRun() {
    try {
      const dismissed = await GM_getValue("FirstRunDismissed", false);
      if (dismissed) return;
      const prompts = await GM_getValue("Prompts");
      const hasPrompts =
        prompts != null &&
        (typeof prompts === "object" ? Object.keys(prompts).length > 0 : true);
      const gistCfg = await GM_getValue(GIST_CONFIG_KEY);
      if (!hasPrompts && !gistCfg) {
        setTimeout(showFirstRunBanner, 1500);
      }
    } catch (e) {}
  }
  function installAutoBackupProxy() {
    const _orig = GM_setValue;
    GM_setValue = async function (key, value) {
      await _orig(key, value);
      if (key !== AUTO_BACKUP_KEY) scheduleAutoBackup();
    };
  }
  const SYNTAX_STORAGE_KEY = "SyntaxHighlight",
    DEFAULT_SYNTAX_CONFIG = { enabled: !0 };
  let currentSyntaxConfig = DEFAULT_SYNTAX_CONFIG;
  async function loadSyntaxConfig() {
    try {
      const e = await GM_getValue(SYNTAX_STORAGE_KEY);
      currentSyntaxConfig = e ? JSON.parse(e) : { ...DEFAULT_SYNTAX_CONFIG };
    } catch (e) {
      currentSyntaxConfig = { ...DEFAULT_SYNTAX_CONFIG };
    }
  }
  async function saveSyntaxConfig(e) {
    ((currentSyntaxConfig = e),
      await GM_setValue(SYNTAX_STORAGE_KEY, JSON.stringify(e)));
  }
  const SyntaxHighlighter = (function () {
    "use strict";
    let e = null,
      t = null,
      n = null,
      a = "",
      o = null,
      r = null;
    const s = () => {
        e && t && ((t.scrollTop = e.scrollTop), (t.scrollLeft = e.scrollLeft));
      },
      i = () => {
        if (!e || !t) return;
        const n = e.value;
        n !== a &&
          ((a = n),
          setSafeInnerHTML(
            t,
            ((e) => {
              if (!e) return "\n";
              let t = ((e) => {
                const t = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
                return e.replace(/[&<>]/g, (e) => t[e]);
              })(e);
              const n = [],
                a = (e) => {
                  const t = n.length;
                  return (n.push(e), `\0${t}\0`);
                };
              return (
                (t = t.replace(
                  /([ \t]*)(#+)(ignore)([ \t]*(?:\r?\n)?)([\s\S]*?)((?:\r?\n)?[ \t]*)(\2)(end)/gi,
                  (e, t, n, o, r, s, i, l, c) =>
                    a(
                      `<span class="mp-syn-ign-f">${t}${n}${o}</span>${r}<span class="mp-syn-ign-c">${s}</span>${i}<span class="mp-syn-ign-f">${l}${c}</span>`,
                    ),
                )),
                (t = t.replace(/\\([#\[\]{}':])/g, (e) =>
                  a(`<span class="mp-syn-esc">${e}</span>`),
                )),
                (t = t.replace(/('{2,})([\s\S]*?)\1/g, (e, t, n) =>
                  a(
                    `<span class="mp-syn-qt-f">${t}</span><span class="mp-syn-qt-c">${n}</span><span class="mp-syn-qt-f">${t}</span>`,
                  ),
                )),
                (t = t.replace(
                  /#(date|time)((?:-[YMDHS]{2})*)(?:\+(date|time)((?:-[YMDHS]{2})*))?/gi,
                  (e, t, n, o, r) => {
                    let s = `<span class="mp-syn-dt-k">#${t}</span>`;
                    return (
                      n && (s += `<span class="mp-syn-dt-f">${n}</span>`),
                      o &&
                        ((s += `<span class="mp-syn-dt-k">+${o}</span>`),
                        r && (s += `<span class="mp-syn-dt-f">${r}</span>`)),
                      a(s)
                    );
                  },
                )),
                (t = t.replace(/#file(?:\(([^)]*)\))?/gi, (e, t) => {
                  let n = '<span class="mp-syn-fl-k">#file</span>';
                  return (
                    void 0 !== t &&
                      ((n += '<span class="mp-syn-fl-p">(</span>'),
                      (n += `<span class="mp-syn-fl-t">${t}</span>`),
                      (n += '<span class="mp-syn-fl-p">)</span>')),
                    a(n)
                  );
                })),
                (t = t.replace(
                  /([ \t]*)(#+)(start)([ \t]*(?:\r?\n)?)([\s\S]*?)((?:\r?\n)?[ \t]*)(\2)(end)/gi,
                  (e, t, n, o, r, s, i, l, c) => {
                    let d = s;
                    return (
                      (d = d.replace(
                        /(^|\/\/)([ \t]*)(#)(\s*)([^#\n][^\n]*?)(?=\/\/|\r?\n|$)/gm,
                        (e, t, n, a, o, r) =>
                          `${t}${n}<span class="mp-syn-sl-hh">${a}</span>${o}<span class="mp-syn-sl-h">${r}</span>`,
                      )),
                      (d = d.replace(
                        /(\/\/)/g,
                        '<span class="mp-syn-sl-sep">$1</span>',
                      )),
                      (d = d.replace(
                        /([+\-]|\d+)(\s*)(\[)([^\]]*)(\])/g,
                        (e, t, n, a, o, r) => {
                          let s = "mp-syn-sl-p-id";
                          "+" === t
                            ? (s = "mp-syn-sl-p-multi")
                            : "-" === t && (s = "mp-syn-sl-p-single");
                          let i = o;
                          const l = o.match(/^([\s\S]*?)(::\s*[xX]\s*)$/);
                          return (
                            (i = l
                              ? `<span class="${s}">${l[1]}</span><span class="mp-syn-sel-chk">${l[2]}</span>`
                              : `<span class="${s}">${o}</span>`),
                            `<span class="${s}">${t}</span>${n}<span class="${s}">${a}</span>` +
                              i +
                              `<span class="${s}">${r}</span>`
                          );
                        },
                      )),
                      (d = d.replace(/(\[)(#)(\])/g, (e, t, n, a) => {
                        const o = "mp-syn-sl-p-other";
                        return `<span class="${o}">${t}</span><span class="${o}">${n}</span><span class="${o}">${a}</span>`;
                      })),
                      (d = d.replace(
                        /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
                        (e, t) =>
                          `<span class="mp-syn-qt-f">'</span><span class="mp-syn-qt-c">${t}</span><span class="mp-syn-qt-f">'</span>`,
                      )),
                      a(
                        `<span class="mp-syn-sl-f">${t}${n}${o}</span>${r}` +
                          d +
                          `${i}<span class="mp-syn-sl-f">${l}${c}</span>`,
                      )
                    );
                  },
                )),
                (t = t.replace(
                  /(\{)([^}=]+?)(\s*=\s*)(\$[a-zA-Z0-9_]+)([^}]*)(\})(?:\(([^)]*)\))?/g,
                  (e, t, n, o, r, s, i, l) => {
                    let c = `<span class="mp-syn-sil-b">${t}</span><span class="mp-syn-sil-l">${n}</span><span class="mp-syn-sil-e">${o}</span><span class="mp-syn-sil-v">${r}</span>`;
                    if (s) {
                      const e = s.match(/^([\s\S]*?)(::)([\s\S]*)$/);
                      c += e
                        ? e[1] +
                          `<span class="mp-syn-def-s">${e[2]}</span>` +
                          `<span class="mp-syn-def-v">${e[3]}</span>`
                        : s;
                    }
                    return (
                      (c += `<span class="mp-syn-sil-b">${i}</span>`),
                      void 0 !== l &&
                        (c += `<span class="mp-syn-in-c">(${l})</span>`),
                      a(c)
                    );
                  },
                )),
                (t = t.replace(
                  /(\[)([^\]=]+?)(\s*=\s*)(\$[a-zA-Z0-9_]+)([^\]]*)(\])(?:\(([^)]*)\))?/g,
                  (e, t, n, o, r, s, i, l) => {
                    let c = `<span class="mp-syn-in-b">${t}</span><span class="mp-syn-in-l">${n}</span><span class="mp-syn-in-e">${o}</span><span class="mp-syn-in-v">${r}</span>`;
                    if (s) {
                      const e = s.match(/^([\s\S]*?)(::)([\s\S]*)$/);
                      c += e
                        ? e[1] +
                          `<span class="mp-syn-def-s">${e[2]}</span>` +
                          `<span class="mp-syn-def-v">${e[3]}</span>`
                        : s;
                    }
                    return (
                      (c += `<span class="mp-syn-in-b">${i}</span>`),
                      void 0 !== l &&
                        (c += `<span class="mp-syn-in-c">(${l})</span>`),
                      a(c)
                    );
                  },
                )),
                (t = t.replace(
                  /(\[)([^\]]+?)(\])(?:\(([^)]*)\))?/g,
                  (e, t, n, o, r) => {
                    if (n.includes("\0")) return e;
                    let s = `<span class="mp-syn-free-b">${t}</span>`;
                    const i = n.match(/^([\s\S]*?)(::)([\s\S]*)$/);
                    return (
                      (s += i
                        ? `<span class="mp-syn-free-l">${i[1]}</span><span class="mp-syn-def-s">${i[2]}</span><span class="mp-syn-def-v">${i[3]}</span>`
                        : `<span class="mp-syn-free-l">${n}</span>`),
                      (s += `<span class="mp-syn-free-b">${o}</span>`),
                      void 0 !== r &&
                        (s += `<span class="mp-syn-in-c">(${r})</span>`),
                      a(s)
                    );
                  },
                )),
                (t = t.replace(/(\$[a-zA-Z0-9_]+)/g, (e, t) =>
                  a(`<span class="mp-syn-var">${t}</span>`),
                )),
                ((e) => {
                  for (let t = n.length - 1; t >= 0; t--)
                    e = e.split(`\0${t}\0`).join(n[t]);
                  return e;
                })(t) + "\n"
              );
            })(n),
          ),
          s());
      },
      l = () => {
        (o && cancelAnimationFrame(o), (o = requestAnimationFrame(i)));
      },
      c = () => l(),
      d = () => s(),
      p = () => {
        (o && (cancelAnimationFrame(o), (o = null)),
          r && (r.disconnect(), (r = null)),
          e &&
            (e.classList.remove("mp-syntax-enabled"),
            e.removeEventListener("input", c),
            e.removeEventListener("scroll", d),
            e.removeEventListener("keydown", c),
            delete e.syntaxUpdate,
            delete e.syntaxClear,
            n &&
              n.parentElement &&
              (n.parentElement.insertBefore(e, n), n.remove())),
          (e = null),
          (t = null),
          (n = null),
          (a = ""));
      };
    return {
      attach: (o) => {
        if (void 0 !== currentSyntaxConfig && !currentSyntaxConfig.enabled)
          return void p();
        if (!(o && o instanceof HTMLTextAreaElement)) return;
        if (e === o && t) return ((a = ""), void i());
        (p(), (e = o), (a = ""));
        const s = o.closest(".mp-scroll-content") || o.parentElement;
        if (!s) return;
        ((n = document.createElement("div")),
          (n.className = "mp-syntax-container"),
          (t = document.createElement("div")),
          (t.className = "mp-syntax-backdrop"),
          t.setAttribute("aria-hidden", "true"));
        const m = getComputedStyle(o);
        ((t.style.fontSize = m.fontSize),
          (t.style.lineHeight = m.lineHeight),
          (t.style.fontFamily = m.fontFamily),
          (t.style.padding = m.padding),
          s.insertBefore(n, o),
          n.appendChild(t),
          n.appendChild(o),
          o.classList.add("mp-syntax-enabled"),
          o.addEventListener("input", c),
          o.addEventListener("scroll", d),
          o.addEventListener("keydown", c),
          (r = new MutationObserver(() => {
            l();
          })),
          r.observe(o, { attributes: !0, attributeFilter: ["value"] }),
          (o.syntaxUpdate = () => {
            ((a = ""), i());
          }),
          (o.syntaxClear = () => {
            ((a = ""), t && setSafeInnerHTML(t, "\n"));
          }),
          i());
      },
      detach: p,
      refresh: () => {
        ((a = ""), i());
      },
    };
  })();
  function detectPlatform() {
    const e = window.location.hostname;
    return e.includes("chatgpt.com")
      ? "chatgpt"
      : e.includes("deepseek.com")
        ? "deepseek"
        : e.includes("aistudio.google.com")
          ? "googleaistudio"
          : e.includes("chat.qwen.ai")
            ? "qwen"
            : e.includes("chat.z.ai")
              ? "zai"
              : e.includes("gemini.google.com")
                ? "gemini"
                : e.includes("arena.ai4bharat.org")
                  ? "indicArena"
                  : e.includes("arena.ai")
                    ? "arena"
                    : e.includes("kimi.com")
                      ? "kimi"
                      : e.includes("claude.ai")
                        ? "claude"
                        : e.includes("grok.com")
                          ? "grok"
                          : e.includes("www.perplexity.ai")
                            ? "perplexity"
                            : e.includes("longcat.chat")
                              ? "longcat"
                              : e.includes("mistral.ai")
                                ? "mistral"
                                : e.includes("yuanbao.tencent.com")
                                  ? "yuanbao"
                                  : e.includes("chatglm.cn")
                                    ? "chatglm"
                                    : e.includes("poe.com")
                                      ? "poe"
                                      : e.includes("notebooklm.google.com")
                                        ? "notebooklm"
                                        : e.includes("doubao.com")
                                          ? "doubao"
                                          : e.includes("copilot.microsoft.com")
                                            ? "copilot"
                                            : e.includes("image.z.ai")
                                              ? "glmimage"
                                              : e.includes("ernie.baidu.com")
                                                ? "ernie"
                                                : e.includes(
                                                      "dreamina.capcut.com",
                                                    )
                                                  ? "dreamina"
                                                  : e.includes(
                                                        "jimeng.jianying.com",
                                                      )
                                                    ? "jimengJianying"
                                                    : e.includes(
                                                          "build.nvidia.com",
                                                        )
                                                      ? "nvidiaNim"
                                                      : e.includes("qianwen")
                                                        ? "qianwen"
                                                        : e.includes(
                                                              "geminigen.ai",
                                                            )
                                                          ? "geminigen"
                                                          : e.includes(
                                                                "aistudio.tencent.com",
                                                              )
                                                            ? "hunyuan"
                                                            : e.includes(
                                                                  "bing.com",
                                                                )
                                                              ? "bing"
                                                              : e.includes(
                                                                    "gist.github.com",
                                                                  )
                                                                ? "gist"
                                                                : e.includes(
                                                                      "meta.ai",
                                                                    )
                                                                  ? "meta"
                                                                  : e.includes(
                                                                        "manus.im",
                                                                      )
                                                                    ? "manus"
                                                                    : e.includes(
                                                                          "aistudio.xiaomimimo.com",
                                                                        )
                                                                      ? "xiaomi"
                                                                      : (e.includes(
                                                                            "labs.google",
                                                                          ) &&
                                                                          window.location.pathname.includes(
                                                                            "/tools/flow",
                                                                          )) ||
                                                                          e.includes(
                                                                            "flow.google",
                                                                          )
                                                                        ? "flow"
                                                                        : e.includes(
                                                                              "google.com",
                                                                            ) &&
                                                                            window.location.pathname.includes(
                                                                              "/search",
                                                                            ) &&
                                                                            window.location.search.includes(
                                                                              "udm=50",
                                                                            )
                                                                          ? "googleModoIA"
                                                                          : null;
  }
  function getSendButton() {
    switch (currentPlatform) {
      case "chatgpt":
        return (
          document.querySelector('[data-testid="send-button"]') ||
          document.querySelector("#composer-submit-button") ||
          document.querySelector(
            'button.composer-submit-btn:has(svg use[href*="sprites-core"])',
          )
        );
      case "deepseek":
        return (
          document.querySelector(
            'div[role="button"]:has(svg path[d^="M8.3125 0.981587"])',
          ) ||
          document.querySelector(
            'div[role="button"]:has(svg path[d^="M8.31"])',
          ) ||
          document.querySelector(".ds-icon-button:has(path)")
        );
      case "googleaistudio":
        return (
          document.querySelector('ms-run-button button[type="submit"]') ||
          document.querySelector("ms-run-button button.ms-button-primary") ||
          document.querySelector('button[aria-label*="Run" i]') ||
          document.querySelector("ms-run-button button")
        );
      case "qwen":
        return (
          document.querySelector("button.send-button") ||
          document.querySelector(
            'button.send-button:has(path[d^="M836.43"])',
          ) ||
          document.querySelector(".chat-prompt-send-button button")
        );
      case "zai":
        return (
          document.querySelector("#send-message-button") ||
          document.querySelector('button.sendMessageButton[type="submit"]') ||
          document.querySelector(
            'button:has(svg path[d^="M8 13.3333V2.66667M8 2.66667L4"])',
          )
        );
      case "gemini":
        return (
          document.querySelector("button.send-button.submit") ||
          document.querySelector(
            'button:has(mat-icon[data-mat-icon-name="send"])',
          ) ||
          document.querySelector(".send-button-container button")
        );
      case "arena":
        return (
          document.querySelector(
            'button[type="submit"]:has(svg path[d^="M3 12L21 12M21 12L12.5"]))',
          ) ||
          document.querySelector(
            'button[type="submit"]:has(svg path[d^="M3 12"])',
          ) ||
          document.querySelector(
            'button.active\\:bg-interactive-cta-active[type="submit"]',
          )
        );
      case "kimi":
        return (
          document.querySelector(
            '.send-button-container:has(svg path[d^="M705.536"])',
          ) ||
          document.querySelector(
            '.send-button-container:has(svg[name="Send"])',
          ) ||
          document.querySelector(".send-button-container .send-icon")
        );
      case "claude":
        return (
          document.querySelector('button:has(svg path[d^="M208.49,120.49"])') ||
          document.querySelector(
            'button[type="button"]:has(svg[viewBox="0 0 256 256"])',
          ) ||
          document.querySelector("div.shrink-0 > div > div > button:has(svg)")
        );
      case "grok":
        return (
          document.querySelector(
            'button[type="submit"]:has(path[d^="M6 11L12 5"]))',
          ) ||
          document.querySelector('button:has(svg path[d^="M6 11"])') ||
          document.querySelector('button[type="submit"]:has(svg)')
        );
      case "perplexity":
        return (
          document.querySelector(
            'button:has(use[xlink:href*="arrow-right"])',
          ) ||
          document.querySelector('button:has(svg use[href*="arrow-right"])') ||
          document.querySelector("button.bg-button-bg:has(svg)")
        );
      case "longcat":
        return (
          document.querySelector('.send-btn:has(use[href*="send"])') ||
          document.querySelector('.send-btn:has(path[d^="M13.6165"])') ||
          document.querySelector(".send-wrap .send-btn")
        );
      case "mistral":
        return (
          document.querySelector(
            'button[type="submit"]:has(svg path[d^="M12 18v4h4v-4h-4Z"])',
          ) ||
          document.querySelector('button[type="submit"]:has(svg.-rotate-90)') ||
          document.querySelector('button.bg-state-primary[type="submit"]')
        );
      case "yuanbao":
        return (
          document.querySelector("#yuanbao-send-btn") ||
          document.querySelector("a:has(span.icon-send)") ||
          document.querySelector("a.style__send-btn")
        );
      case "poe":
        return (
          document.querySelector('button[data-button-send="true"]') ||
          document.querySelector('button:has(svg path[d^="M11.293 4.293"])') ||
          document.querySelector('button:has(svg path[d^="M11.293"])')
        );
      case "googleModoIA":
        return (
          document.querySelector(
            'button[data-xid="input-plate-send-button"]',
          ) ||
          document.querySelector('button:has(svg path[d^="M440-160v-487"])') ||
          document.querySelector('button:has(svg path[d^="M440"])')
        );
      case "notebooklm":
        return (
          document.querySelector("button.submit-button") ||
          document.querySelector('button[type="submit"]:has(mat-icon)') ||
          document.querySelector('button[aria-label*="Submit" i]') ||
          document.querySelector("button:has(mat-icon)") ||
          Array.from(document.querySelectorAll("button")).find((b) => {
            const m = b.querySelector("mat-icon");
            return m && (m.textContent || "").trim() === "arrow_forward";
          })
        );
      case "doubao":
        return (
          document.querySelector("#flow-end-msg-send") ||
          document.querySelector('button:has(svg path[d^="m3.543 8.883"])') ||
          document.querySelector(".send-btn-wrapper button")
        );
      case "copilot":
        return (
          document.querySelector('button[data-testid="submit-button"]') ||
          document.querySelector(
            'button:has(svg path[d^="M4.20889 10.7327"])',
          ) ||
          document.querySelector('button:has(svg path[d^="M4.20889"])')
        );
      case "glmimage":
        return (
          document.querySelector('button:has(img[src*="generate-icon"])') ||
          document.querySelector('button:has(img[alt="generate"])') ||
          document.querySelector("button.bg-black:has(img)")
        );
      case "ernie":
        return (
          document.querySelector(
            'div[class^="send"] div[class^="btnContainer"] span:has(svg path[d^="M43,-63.43"]))',
          ) || document.querySelector('span[class*="sendBtnLottie"]')
        );
      case "dreamina":
        return (
          document.querySelector('button:has(svg path[d^="M12.002 3"])') ||
          document.querySelector("button.submit-button-6qXI49") ||
          document.querySelector(
            'button[type="button"]:has(path[data-follow-fill])',
          )
        );
      case "jimengJianying":
        return (
          document.querySelector('button:has(svg path[d^="M12.002 3"])') ||
          document.querySelector("button.submit-button-xdhu0e") ||
          document.querySelector("button:has(path[data-follow-fill])")
        );
      case "nvidiaNim":
        return (
          document.querySelector(
            'button:has(svg[data-icon-name="paperplane"]))',
          ) ||
          document.querySelector('button:has(svg path[d^="M0.747,1.623"])') ||
          document.querySelector(
            'button.btn-primary:has(use[href^="#paperplane"]))',
          )
        );
      case "indicArena":
        return (
          document.querySelector(
            'button[type="submit"]:has(svg path[d^="M14.536"]))',
          ) ||
          document.querySelector("button:has(svg.lucide-send)") ||
          document.querySelector('button[type="submit"]:has(svg)')
        );
      case "qianwen":
        return (
          document.querySelector('button:has(span[data-icon-type*="send"]))') ||
          document.querySelector(
            'button:has(svg use[*|href^="#qwpcicon-sendChat"]))',
          ) ||
          document.querySelector('button:has(path[d^="M554.24 85.76"])')
        );
      case "geminigen":
        return document.querySelector(
          'div.flex.justify-end.gap-2.items-center > button:not([disabled]):not([aria-disabled="true"])',
        );
      case "hunyuan":
        return (
          document.querySelector("button.ma-model-run-body__params-button") ||
          document.querySelector("a:has(span.icon-send)") ||
          document.querySelector(".sendBtn")
        );
      case "bing":
        return (
          document.querySelector("#create_btn_c") ||
          document.querySelector('#create_btn_wrapper [role="button"]') ||
          document.querySelector(".create_btn_wrapper a.linkBtn")
        );
      case "flow":
        return (
          Array.from(document.querySelectorAll("button")).find((b) => {
            const i = b.querySelector(
              "i.google-symbols, mat-icon.google-symbols, mat-icon, span.google-symbols",
            );
            return (
              i &&
              ["arrow_forward", "send"].includes((i.textContent || "").trim())
            );
          }) ||
          document
            .querySelector(
              "button i.google-symbols, button mat-icon.google-symbols",
            )
            ?.parentElement ||
          document.querySelector(
            'button[type="submit"]:not([disabled]), button[aria-label*="Generate" i]:not([disabled]), button[aria-label*="Create" i]:not([disabled])',
          ) ||
          document.querySelector('button:has(span[style*="clip"])')
        );
      case "meta":
        return (
          document.querySelector('button:has(svg path[d^="M16 6.125"])') ||
          document.querySelector('button[data-slot="button"]:has(svg)') ||
          document.querySelector('button:has(svg[viewBox="0 0 32 32"])')
        );
      case "manus":
        return document.querySelector(
          'button:has(svg path[d^="M7.91699 15.0642C7.53125 15.0642"])',
        );
      case "xiaomi":
        return (
          document.querySelector('button[data-track-id="home_send_btn"]') ||
          document.querySelector('button:has(svg path[d^="M.244 7.921"])')
        );
      default:
        return null;
    }
  }
  function isEditorEmpty(e) {
    if (!e || !e.isConnected) return !0;
    if ("RICH-TEXTAREA" === e.tagName) {
      const ri = e.querySelector('div[contenteditable="true"]');
      ri && (e = ri);
    }
    const t = e.tagName.toLowerCase();
    if ("textarea" === t || "input" === t)
      return (
        0 ===
        e.value.replace(/[\s\u200B\u00A0\uFEFF\u200C\u200D\r\n]/g, "").length
      );
    if (
      e.querySelector(
        'img, canvas, video, [type="file"], [class*="attachment"], [class*="file-item"]',
      )
    )
      return !1;
    const n = e.innerHTML.trim();
    if (
      "" === n ||
      "<p><br></p>" === n ||
      "<p></p>" === n ||
      "<br>" === n ||
      "<div><br></div>" === n
    )
      return !0;
    if (
      e.classList.contains("is-empty") ||
      e.classList.contains("ProseMirror-empty") ||
      e.classList.contains("ql-blank")
    )
      return !0;
    const a = e.cloneNode(!0);
    a.querySelectorAll(
      '[data-slate-placeholder], [data-placeholder], [class*="placeholder"]',
    ).forEach((e) => e.remove());
    let o = a.textContent || a.innerText || "";
    return (
      (o = o.replace(/[\s\u200B\u00A0\uFEFF\u200C\u200D\r\n]/g, "")),
      0 === o.length
    );
  }
  function waitForUploadAndClick(e, t = 12e4) {
    const n = Date.now(),
      a = setInterval(() => {
        if (Date.now() - n > t) return void clearInterval(a);
        if (isEditorEmpty(e)) return void clearInterval(a);
        const o = getSendButton();
        if (!o) return;
        const r = o.disabled || "true" === o.getAttribute("aria-disabled"),
          s = window.getComputedStyle(o),
          i = "not-allowed" === s.cursor || parseFloat(s.opacity) < 0.5,
          l = "none" === s.display || "hidden" === s.visibility;
        r || i || l || o.click();
      }, 800);
  }
  function forceUpload(e, t = 12e4) {
    const n = Date.now(),
      a = setInterval(() => {
        if (Date.now() - n > t || isEditorEmpty(e)) clearInterval(a);
        else
          try {
            e.isConnected && e.focus();
            const t = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              which: 13,
              keyCode: 13,
              bubbles: !0,
              cancelable: !0,
            });
            e.dispatchEvent(t);
          } catch (e) {}
      }, 800);
  }
  async function insertPrompt(e, t = !1, n = !1) {
    let a =
      getEditableRoot(findPlatformEditor()) ||
      getEditableRoot(document.querySelector(platformSelectors[currentPlatform]));
    if (!a) {
      "flow" === currentPlatform &&
        showNotification(
          "Flow prompt box not found. Click into the prompt input once, then retry.",
          "error",
        );
      return;
    }
    a.focus();
    const o = navigator.userAgent.toLowerCase().includes("firefox");
    let r = !1,
      s = 0;
    const i = [];
    if (e.activeFileIds && e.activeFileIds.length > 0) {
      (await getGlobalFiles()).forEach((t) => {
        e.activeFileIds.includes(t.id) &&
          ((s += t.size), i.push(dataURLtoFile(t.data, t.name)));
      });
    }
    if (
      (e.dynamicFiles &&
        e.dynamicFiles.length > 0 &&
        e.dynamicFiles.forEach((e) => {
          ((s += e.size), i.push(e));
        }),
      i.length > 0)
    ) {
      ((r = !0), (s = 1500 + (s / 1024 / 100) * 100));
      const e = new DataTransfer();
      if (
        (i.forEach((t) => e.items.add(t)),
        "gemini" === currentPlatform || "perplexity" === currentPlatform)
      )
        if (o) {
          let t =
            document.querySelector("[data-filedrop-id]") ||
            document.querySelector(".chat-window-input-container") ||
            a;
          ["dragenter", "dragover", "drop"].forEach((n) => {
            const a = new DragEvent(n, {
              bubbles: !0,
              cancelable: !0,
              dataTransfer: e,
            });
            t.dispatchEvent(a);
          });
        } else {
          const t = new ClipboardEvent("paste", {
            bubbles: !0,
            cancelable: !0,
            clipboardData: e,
          });
          a.dispatchEvent(t);
        }
      else {
        let t = !1;
        if (
          [
            "qwen",
            "longcat",
            "grok",
            "mistral",
            "googleaistudio",
            "yuanbao",
            "ernie",
            "indicArena",
            "googleModoIA",
            "kimi",
            "jimengJianying",
            "dreamina",
            "manus",
          ].includes(currentPlatform)
        ) {
          let n =
            document.querySelector(".chat-input-container") ||
            document.querySelector("form") ||
            a;
          (["dragenter", "dragover", "drop"].forEach((t) => {
            const a = new DragEvent(t, {
              bubbles: !0,
              cancelable: !0,
              dataTransfer: e,
            });
            n.dispatchEvent(a);
          }),
            (t = !0));
        }
        if (!t) {
          let t = document.querySelector('input[type="file"]');
          if (t)
            try {
              ((t.value = ""),
                (t.files = e.files),
                t.dispatchEvent(new Event("change", { bubbles: !0 })),
                t.dispatchEvent(new Event("input", { bubbles: !0 })));
            } catch (e) {}
          else
            ["dragenter", "dragover", "drop"].forEach((t) => {
              const n = new DragEvent(t, {
                bubbles: !0,
                cancelable: !0,
                dataTransfer: e,
              });
              a.dispatchEvent(n);
            });
        }
      }
    }
    if (
      (setTimeout(() => {
        const s = (t = !1) => {
          a.focus();
          const n = window.getSelection(),
            o = document.createRange();
          (o.selectNodeContents(a),
            o.collapse(!1),
            n.removeAllRanges(),
            n.addRange(o),
            t ||
              a.dispatchEvent(
                new InputEvent("beforeinput", {
                  bubbles: !0,
                  cancelable: !0,
                  inputType: "insertText",
                  data: e.text,
                }),
              ));
          const r = new DataTransfer();
          (r.setData("text/plain", e.text),
            a.dispatchEvent(
              new ClipboardEvent("paste", {
                clipboardData: r,
                bubbles: !0,
                cancelable: !0,
              }),
            ),
            a.dispatchEvent(new Event("input", { bubbles: !0 })));
        };
        if (
          "claude" === currentPlatform ||
          "grok" === currentPlatform ||
          "dreamina" === currentPlatform
        )
          if ((a.focus(), "TEXTAREA" === a.tagName || "INPUT" === a.tagName)) {
            const t = a.selectionStart || 0,
              n = a.selectionEnd || 0,
              o = a.value.substring(0, t) + e.text + a.value.substring(n),
              r = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value",
              ).set;
            (r ? r.call(a, o) : (a.value = o),
              setTimeout(() => {
                a.selectionStart = a.selectionEnd = t + e.text.length;
              }, 0),
              a.dispatchEvent(new Event("input", { bubbles: !0 })));
          } else {
            o && "" === a.textContent.trim() && robustClearEditor(a);
            const t = window.getSelection(),
              n = document.createRange();
            (n.selectNodeContents(a),
              n.collapse(!1),
              t.removeAllRanges(),
              t.addRange(n));
            const r = e.text.split("\n");
            let s = "";
            r.forEach((e) => {
              "" === e.trim() ? (s += "<p><br></p>") : (s += `<p>${e}</p>`);
            });
            if (!document.execCommand("insertHTML", !1, s)) {
              const t = new DataTransfer();
              (t.setData("text/html", s),
                t.setData("text/plain", e.text),
                a.dispatchEvent(
                  new ClipboardEvent("paste", {
                    clipboardData: t,
                    bubbles: !0,
                    cancelable: !0,
                  }),
                ));
            }
            a.dispatchEvent(new Event("input", { bubbles: !0 }));
          }
        else if (
          !o ||
          ("kimi" !== currentPlatform &&
            "perplexity" !== currentPlatform &&
            "qwen" !== currentPlatform &&
            "meta" !== currentPlatform)
        )
          if (
            !o ||
            ("chatgpt" !== currentPlatform &&
              "longcat" !== currentPlatform &&
              "mistral" !== currentPlatform &&
              "yuanbao" !== currentPlatform &&
              "jimengJianying" !== currentPlatform &&
              "manus" !== currentPlatform)
          )
            if ("gemini" === currentPlatform)
              if ((a.focus(), o)) {
                let t = a.querySelector("p") || document.createElement("p");
                ((t.textContent += e.text),
                  a.contains(t) || a.appendChild(t),
                  a.dispatchEvent(
                    new Event("input", { bubbles: !0, composed: !0 }),
                  ));
              } else {
                if (!document.execCommand("insertText", !1, e.text)) {
                  const t = document.createTextNode(e.text);
                  a.appendChild(t);
                }
                a.dispatchEvent(
                  new Event("input", { bubbles: !0, composed: !0 }),
                );
              }
            else if ("hunyuan" === currentPlatform) {
              if (
                a.isContentEditable &&
                (a.hasAttribute("data-slate-editor") ||
                  null !== a.querySelector("[data-slate-node]") ||
                  null !== a.closest("[data-slate-editor]"))
              )
                s();
              else if ((a.focus(), o)) {
                a.isContentEditable &&
                  "" === a.textContent.trim() &&
                  robustClearEditor(a);
                if (!document.execCommand("insertText", !1, e.text)) {
                  const t = new DataTransfer();
                  (t.setData("text/plain", e.text),
                    a.dispatchEvent(
                      new ClipboardEvent("paste", {
                        clipboardData: t,
                        bubbles: !0,
                        cancelable: !0,
                      }),
                    ));
                }
                a.dispatchEvent(
                  new Event("input", { bubbles: !0, composed: !0 }),
                );
              } else {
                const t = new DataTransfer();
                if (
                  (t.setData("text/plain", e.text),
                  a.dispatchEvent(
                    new ClipboardEvent("paste", {
                      clipboardData: t,
                      bubbles: !0,
                      cancelable: !0,
                    }),
                  ),
                  void 0 !== a.value && !a.value.includes(e.text))
                ) {
                  let t = a.value + e.text;
                  if (n && "number" == typeof a.selectionStart) {
                    const n = a.selectionStart;
                    ((t =
                      a.value.substring(0, n) +
                      e.text +
                      a.value.substring(a.selectionEnd)),
                      setTimeout(() => {
                        a.selectionStart = a.selectionEnd = n + e.text.length;
                      }, 0));
                  }
                  const o = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value",
                  ).set;
                  (o ? o.call(a, t) : (a.value = t),
                    a.dispatchEvent(new Event("input", { bubbles: !0 })));
                }
              }
            } else if ("doubao" === currentPlatform)
              if (a.isContentEditable) {
                s(!o);
              } else if ((a.focus(), o)) {
                if (!document.execCommand("insertText", !1, e.text)) {
                  const t = new DataTransfer();
                  (t.setData("text/plain", e.text),
                    a.dispatchEvent(
                      new ClipboardEvent("paste", {
                        clipboardData: t,
                        bubbles: !0,
                        cancelable: !0,
                      }),
                    ));
                }
                a.dispatchEvent(
                  new Event("input", { bubbles: !0, composed: !0 }),
                );
              } else {
                const t = new DataTransfer();
                if (
                  (t.setData("text/plain", e.text),
                  a.dispatchEvent(
                    new ClipboardEvent("paste", {
                      clipboardData: t,
                      bubbles: !0,
                      cancelable: !0,
                    }),
                  ),
                  void 0 !== a.value && !a.value.includes(e.text))
                ) {
                  let t = a.value + e.text;
                  if (n && "number" == typeof a.selectionStart) {
                    const n = a.selectionStart;
                    ((t =
                      a.value.substring(0, n) +
                      e.text +
                      a.value.substring(a.selectionEnd)),
                      setTimeout(() => {
                        a.selectionStart = a.selectionEnd = n + e.text.length;
                      }, 0));
                  }
                  const o = Object.getOwnPropertyDescriptor(
                    window.HTMLTextAreaElement.prototype,
                    "value",
                  ).set;
                  (o ? o.call(a, t) : (a.value = t),
                    a.dispatchEvent(new Event("input", { bubbles: !0 })));
                }
              }
            else if (
              "flow" === currentPlatform ||
              "qianwen" === currentPlatform ||
              "ernie" === currentPlatform
            ) {
              if ("flow" === currentPlatform) {
                // Google rebuilt Flow's prompt bar: try the verified
                // multi-strategy insertion first (textarea setter /
                // execCommand / synthetic events / DOM fallback), then keep
                // the legacy Slate-oriented path as a safety net.
                const ok = insertTextIntoEditor(a, e.text);
                if (!ok) {
                  s(
                    ("qianwen" === currentPlatform ||
                      "ernie" === currentPlatform) &&
                      !o,
                  );
                  editorContainsText(a, e.text) ||
                    showNotification(
                      "Could not write into Flow's prompt box. Please report the DOM structure so the selector can be updated.",
                      "error",
                    );
                }
              } else
                s(
                  ("qianwen" === currentPlatform ||
                    "ernie" === currentPlatform) &&
                    !o,
                );
            } else {
              const t = new DataTransfer();
              if (
                (t.setData("text/plain", e.text),
                a.dispatchEvent(
                  new ClipboardEvent("paste", {
                    clipboardData: t,
                    bubbles: !0,
                    cancelable: !0,
                  }),
                ),
                void 0 !== a.value && !a.value.includes(e.text))
              ) {
                let t = a.value + e.text;
                if (n && "number" == typeof a.selectionStart) {
                  const n = a.selectionStart;
                  ((t =
                    a.value.substring(0, n) +
                    e.text +
                    a.value.substring(a.selectionEnd)),
                    setTimeout(() => {
                      a.selectionStart = a.selectionEnd = n + e.text.length;
                    }, 0));
                }
                const o = Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype,
                  "value",
                ).set;
                (o ? o.call(a, t) : (a.value = t),
                  a.dispatchEvent(new Event("input", { bubbles: !0 })));
              }
            }
          else {
            "" === a.textContent.trim() && robustClearEditor(a);
            (e.text.split("\n").forEach((e) => {
              const t = document.createElement("p");
              ("" === e.trim()
                ? t.appendChild(document.createElement("br"))
                : (t.textContent = e),
                a.appendChild(t));
            }),
              a.dispatchEvent(
                new Event("input", { bubbles: !0, composed: !0 }),
              ),
              a.focus());
            const t = document.createRange();
            (t.selectNodeContents(a), t.collapse(!1));
            const n = window.getSelection();
            (n.removeAllRanges(), n.addRange(t));
          }
        else (a.focus(), document.execCommand("insertText", !1, e.text));
        (n || moveCursorToEnd(a),
          e.autoExecute &&
            !t &&
            ("chatglm" === currentPlatform ||
            "indicArena" === currentPlatform ||
            "grok" === currentPlatform ||
            "perplexity" === currentPlatform ||
            "nvidiaNim" === currentPlatform ||
            "ernie" === currentPlatform ||
            "jimengJianying" === currentPlatform ||
            "dreamina" === currentPlatform ||
            "arena" === currentPlatform
              ? forceUpload(a)
              : r
                ? waitForUploadAndClick(a)
                : setTimeout(() => {
                    let e = !1;
                    try {
                      const t = getSendButton();
                      if (t) {
                        t.disabled ||
                          "true" === t.getAttribute("aria-disabled") ||
                          (t.click(), (e = !0));
                      }
                    } catch (e) {}
                    if (!e)
                      try {
                        const e = new KeyboardEvent("keydown", {
                          key: "Enter",
                          code: "Enter",
                          which: 13,
                          keyCode: 13,
                          bubbles: !0,
                          cancelable: !0,
                        });
                        a.dispatchEvent(e);
                      } catch (e) {}
                  }, 150)));
      }, 100),
      e.id)
    ) {
      let t = await getAll();
      const n = t.findIndex((t) => t.id === e.id);
      if (-1 !== n && !t[n].isFixed) {
        const [e] = t.splice(n, 1);
        let a = t.findIndex((e) => !e.isFixed);
        (-1 === a && (a = t.length),
          t.splice(a, 0, e),
          normalizePositions(t),
          await saveRawPrompts(promptsToStorage(t)));
      }
    }
  }
  function insertIntoGistEditor(e, t, n) {
    const a = e.querySelector("input.js-gist-filename");
    a &&
      ((a.value = t),
      a.dispatchEvent(new Event("input", { bubbles: !0 })),
      a.dispatchEvent(new Event("change", { bubbles: !0 })));
    const o = e.querySelector('.CodeMirror-code[contenteditable="true"]');
    if (o) {
      o.focus();
      const e = document.createRange();
      e.selectNodeContents(o);
      const t = window.getSelection();
      (t.removeAllRanges(), t.addRange(e));
      if (!document.execCommand("insertText", !1, n)) {
        const e = new DataTransfer();
        e.setData("text/plain", n);
        const t = new ClipboardEvent("paste", {
          clipboardData: e,
          bubbles: !0,
          cancelable: !0,
        });
        o.dispatchEvent(t);
      }
    } else {
      const t = e.querySelector(".CodeMirror textarea"),
        a = e.querySelector("textarea.js-file-textarea"),
        o = t || a;
      o &&
        (o.focus(),
        (o.value = n),
        o.dispatchEvent(new Event("input", { bubbles: !0 })),
        o.dispatchEvent(new Event("change", { bubbles: !0 })));
    }
  }
  function exportJsonAsSingleFile(e) {
    const t = e.map((e) => ({
        title: e.title,
        text: e.text,
        usePlaceholders: e.usePlaceholders,
        autoExecute: e.autoExecute,
      })),
      n =
        1 === e.length
          ? `${(e[0].title || "Prompt").replace(/[<>:"/\\|?*]/g, "").trim()}.mp.prompt.json`
          : `Prompts_MyPrompt_${Date.now()}.mp.prompt.json`,
      a = document.createElement("a");
    ((a.href = URL.createObjectURL(
      new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }),
    )),
      (a.download = n),
      a.click(),
      URL.revokeObjectURL(a.href));
  }
  async function exportJsonAsMultipleFiles(e) {
    if (e.length > 1) {
      if (
        !(await createDialogo({
          title: "Confirm Download",
          message: `You are about to download ${e.length} individual files. Continue?`,
          dontShowAgainId: "confirm-export-download",
          type: "confirm",
        }))
      )
        return;
    }
    for (const t of e) {
      const e = {
          title: t.title,
          text: t.text,
          usePlaceholders: t.usePlaceholders,
          autoExecute: t.autoExecute,
        },
        n = document.createElement("a");
      n.href = URL.createObjectURL(
        new Blob([JSON.stringify(e, null, 2)], { type: "application/json" }),
      );
      const a = (t.title || "Prompt").replace(/[<>:"/\\|?*]/g, "").trim();
      ((n.download = `${a || "Prompt"}.mp.prompt.json`),
        (n.style.display = "none"),
        document.body.appendChild(n),
        n.click(),
        document.body.removeChild(n),
        await new Promise((e) => setTimeout(e, 200)));
    }
  }
  async function openExportMenu(e = null) {
    closeMenu();
    const t = document.createElement("div");
    ((t.className = "mp-overlay"), (t.id = "__ap_export_overlay"));
    const n = document.createElement("div");
    ((n.className = "mp-modal-box"), (n.onclick = (e) => e.stopPropagation()));
    const a = await getAll(),
      o = new Set(a.map((e) => e.id));
    let r = -1;
    const s = e
      ? `<button id="__ap_do_gist_insert" class="save-button" style="width:100%">${"Insert into Gist"}</button>`
      : `<button id="__ap_share_gist" class="save-button mp-btn-secondary" style="margin-right:auto">${"Share on GitHub Gist"}</button><button id="__ap_do_export_txt" class="save-button">TXT</button><button id="__ap_do_export_json" class="save-button">JSON</button>`;
    (setSafeInnerHTML(
      n,
      ` <button id="__ap_close_export" class="mp-modal-close-btn">${ICONS.close}</button><h2 class="modal-title">${e ? "Export to Gist" : "Export Prompt"}</h2><div class="mp-search-container"><input type="text" id="__ap_export_search" class="mp-search-input" placeholder="${"Search"}" autocomplete="off"><div class="mp-export-actions"><label class="mp-checkbox-wrapper" style="cursor:pointer; user-select:none;"><input type="checkbox" id="__ap_select_all" class="mp-checkbox" checked><span style="margin-left:8px;">${"Select All"}</span></label><span id="__ap_count_label"></span></div></div><div class="mp-export-list" id="__ap_export_list"></div><div class="mp-export-buttons"> ${s} </div> `,
    ),
      t.appendChild(n),
      document.body.appendChild(t),
      requestAnimationFrame(() => t.classList.add("visible")));
    const i = n.querySelector("#__ap_export_list");
    function l(e, t, n, a) {
      if (a && -1 !== r && r !== t) {
        const e = Array.from(i.querySelectorAll(".prompt-selector")),
          a = Math.min(r, t),
          s = Math.max(r, t);
        for (let t = a; t <= s; t++) {
          const a = e.find((e) => parseInt(e.dataset.idx) === t);
          a &&
            ((a.checked = n),
            n ? o.add(a.dataset.promptId) : o.delete(a.dataset.promptId));
        }
      } else n ? o.add(e) : o.delete(e);
      ((r = t), u(), c());
    }
    function c() {
      const e = Array.from(i.querySelectorAll(".prompt-selector")),
        t = e.length,
        n = e.filter((e) => e.checked).length,
        a = document.getElementById("__ap_count_label");
      a.textContent =
        0 === n
          ? `${t} prompts`
          : n === t
            ? `${t}/${t} ✓`
            : `${n}/${t}`;
    }
    function d(e = "") {
      ((i.textContent = ""), (r = -1));
      const t = e.toLowerCase();
      let n = 0;
      if (0 === a.length) {
        const e = document.createElement("div");
        return (
          (e.className = "empty-state"),
          (e.textContent = "No saved prompts."),
          i.appendChild(e),
          void c()
        );
      }
      (a.forEach((e) => {
        if (!(
          e.title.toLowerCase().includes(t) || e.text.toLowerCase().includes(t)
        ))
          return;
        const a = n;
        n++;
        const r = document.createElement("div");
        ((r.className = "mp-export-item"),
          (r.onclick = (t) => {
            if ("checkbox" !== t.target.type) {
              const n = r.querySelector("input"),
                o = !n.checked;
              ((n.checked = o), l(e.id, a, o, t.shiftKey));
            }
          }));
        const s = document.createElement("input");
        ((s.type = "checkbox"),
          (s.className = "mp-checkbox prompt-selector"),
          (s.checked = o.has(e.id)),
          (s.dataset.promptId = e.id),
          (s.dataset.idx = a),
          (s.onclick = (t) => {
            (t.stopPropagation(),
              l(
                e.id,
                parseInt(t.target.dataset.idx),
                t.target.checked,
                t.shiftKey,
              ));
          }));
        const c = document.createElement("div");
        c.className = "mp-item-content";
        const d = document.createElement("div");
        ((d.className = "mp-item-title"), (d.textContent = e.title));
        const p = document.createElement("div");
        ((p.className = "mp-item-preview"),
          (p.textContent =
            e.text.substring(0, 150).replace(/\n/g, " ") + "..."));
        const m = document.createElement("div");
        ((m.className = "mp-checkbox-wrapper"),
          m.appendChild(s),
          c.appendChild(d),
          c.appendChild(p),
          r.appendChild(m),
          r.appendChild(c),
          i.appendChild(r));
      }),
        c());
    }
    ((i.style.maxHeight = "300px"), setupEnhancedScroll(i), d());
    const p = document.getElementById("__ap_export_search"),
      m = document.getElementById("__ap_select_all");
    function u() {
      const e = Array.from(i.querySelectorAll(".prompt-selector"));
      if (0 === e.length) return;
      const t = e.every((e) => e.checked),
        n = e.some((e) => e.checked);
      ((m.checked = t), (m.indeterminate = n && !t));
    }
    ((p.oninput = (e) => {
      ((r = -1), d(e.target.value), u());
    }),
      (m.onchange = (e) => {
        r = -1;
        const t = e.target.checked;
        (i.querySelectorAll(".prompt-selector").forEach((e) => {
          ((e.checked = t),
            t ? o.add(e.dataset.promptId) : o.delete(e.dataset.promptId));
        }),
          c());
      }));
    const g = () =>
        a
          .filter((e) => o.has(e.id))
          .map((e) => {
            const { id: t, position: n, ...a } = e;
            return a;
          }),
      f = () => {
        (t.classList.remove("visible"), setTimeout(() => t.remove(), 200));
      };
    n.querySelector("#__ap_close_export").onclick = f;
    const h = (e) => {
      "Escape" === e.key && (f(), document.removeEventListener("keydown", h));
    };
    (document.addEventListener("keydown", h),
      e
        ? (document.getElementById("__ap_do_gist_insert").onclick = () => {
            const t = g();
            if (0 === t.length)
              return void showNotification(
                "No prompts to export.",
                "error",
              );
            const n = t.map((e) => ({
                title: e.title,
                text: e.text,
                usePlaceholders: e.usePlaceholders,
                autoExecute: e.autoExecute,
              })),
              a = JSON.stringify(n, null, 2);
            let o = "";
            if (1 === t.length)
              o = `${(t[0].title || "Prompt").replace(/[<>:"/\\|?*]/g, "").trim()}.mp.prompt.json`;
            else {
              const e = new Date();
              o = `Prompts_MyPrompt_${e.toLocaleDateString(navigator.language).replace(/\//g, "-")}_${e.toLocaleTimeString(navigator.language, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(/:/g, "-")}.mp.prompt.json`;
            }
            (insertIntoGistEditor(e.container, o, a), f());
          })
        : ((document.getElementById("__ap_do_export_json").onclick =
            async () => {
              const e = g();
              if (0 === e.length)
                return void showNotification(
                  "No prompts to export.",
                  "error",
                );
              if (1 === e.length) return void exportJsonAsSingleFile(e);
              const t = await createDialogo({
                title: "Export as JSON",
                message: `You have selected ${e.length} prompts. Do you want to export as a single file or as separate files?`,
                actions: [
                  {
                    label: "Separate Files",
                    style: "danger",
                    value: "multiple",
                  },
                  {
                    label: "Single File",
                    style: "primary",
                    value: "single",
                  },
                ],
              });
              "single" === t
                ? exportJsonAsSingleFile(e)
                : "multiple" === t && exportJsonAsMultipleFiles(e);
            }),
          (document.getElementById("__ap_do_export_txt").onclick = async () => {
            const e = g();
            if (0 !== e.length) {
              if (e.length > 1) {
                if (
                  !(await createDialogo({
                    title: "Confirm Download",
                    message: `You are about to download ${e.length} individual files. Continue?`,
                    dontShowAgainId: "confirm-export-download",
                    type: "confirm",
                  }))
                )
                  return;
              }
              for (const t of e) {
                const e = document.createElement("a");
                e.href = URL.createObjectURL(
                  new Blob([t.text], { type: "text/plain" }),
                );
                const n = (t.title || "prompt")
                  .replace(/[<>:"/\\|?*]/g, "")
                  .trim();
                ((e.download = `${n || "prompt"}.mp.prompt.txt`),
                  (e.style.display = "none"),
                  document.body.appendChild(e),
                  e.click(),
                  document.body.removeChild(e),
                  await new Promise((e) => setTimeout(e, 200)));
              }
            } else
              showNotification("No prompts to export.", "error");
          }),
          (document.getElementById("__ap_share_gist").onclick = () => {
            window.open("https://gist.github.com/", "_blank");
          })),
      setTimeout(() => p.focus(), 100));
  }
  function exportPrompts() {
    openExportMenu(null);
  }
  async function processAndSavePrompts(e) {
    if (!Array.isArray(e)) throw new Error("Error reading JSON file. Check formatting.");
    const t = await getAll(),
      n = e.map((e, t) => ({
        id: generatePromptId() + String(t).padStart(3, "0"),
        title: e.title || "No Title",
        text: e.text || "",
        usePlaceholders: e.usePlaceholders || !1,
        autoExecute: e.autoExecute || !1,
        isFixed: !1,
        activeFileIds: [],
        tags: e.tags || [],
        usageCount: e.usageCount || 0,
      }));
    let a = t.findIndex((e) => !e.isFixed);
    return (
      -1 === a && (a = t.length),
      t.splice(a, 0, ...n),
      normalizePositions(t),
      await saveRawPrompts(promptsToStorage(t)),
      await refreshMenu(),
      n.length
    );
  }
  function parseTextPrompt(e, t) {
    const n = e.split(/\r?\n/);
    if (0 === n.length) return [];
    if (!n[0].match(/^\s*\{\{(.*?)\}\}\s*$/)) {
      return [
        {
          title: t.replace(/\.mp\.prompt\.(txt|md|json)$/i, "").trim(),
          text: e.trim(),
          usePlaceholders: !1,
          autoExecute: !1,
        },
      ];
    }
    const a = [];
    let o = null,
      r = [];
    for (let e = 0; e < n.length; e++) {
      const t = n[e],
        s = t.match(/^\s*\{\{(.*?)\}\}\s*$/);
      if (s) {
        (o && ((o.text = r.join("\n").trim()), a.push(o)),
          (o = {
            title: "No Title",
            usePlaceholders: !1,
            autoExecute: !1,
            text: "",
          }),
          (r = []));
        s[1].split(";").forEach((e) => {
          const t = e.split(":");
          if (t.length >= 2) {
            const e = t[0].trim().toLowerCase(),
              n = t.slice(1).join(":").trim();
            ("title" === e && (o.title = n),
              "useplaceholders" === e &&
                (o.usePlaceholders = "true" === n.toLowerCase()),
              "autoexecute" === e &&
                (o.autoExecute = "true" === n.toLowerCase()));
          }
        });
      } else o && r.push(t);
    }
    return (o && ((o.text = r.join("\n").trim()), a.push(o)), a);
  }
  async function importPrompts() {
    // v27.1.0: the "GitHub Gist" browse action was removed — it opened the
    // gist.github.com `.mp.prompt.` community search, i.e. the same "more
    // prompts" funnel as the removed shop button. Local-file import is the
    // dialog's sole action now; dismissing the dialog still skips import.
    if (
      "local" ===
      (await createDialogo({
        title: "Import Prompt",
        message: "Select how you want to import your prompts.",
        actions: [
          {
            label: "Local File",
            style: "primary",
            value: "local",
          },
        ],
      }))
    ) {
      const e = document.createElement("input");
      ((e.type = "file"),
        (e.accept = ".mp.prompt.json, .mp.prompt.txt, .mp.prompt.md"),
        (e.onchange = (e) => {
          const t = e.target.files[0];
          if (!t) return;
          const n = new FileReader();
          ((n.onload = async (e) => {
            try {
              const n = e.target.result;
              let a;
              a = t.name.toLowerCase().endsWith(".json")
                ? JSON.parse(n)
                : parseTextPrompt(n, t.name);
              showNotification(
                `${await processAndSavePrompts(a)} prompts imported successfully!`,
                "success",
              );
            } catch (e) {
              showNotification(
                `Error importing file: ${e.message}`,
                "error",
              );
            }
          }),
            n.readAsText(t));
        }),
        e.click());
    }
    "function" == typeof closeMenu && closeMenu();
  }
  function injectGistExportEditorButtons() {
    document.querySelectorAll(".gist-file-actions").forEach((e) => {
      const t = `<span>${"Export Prompt"}</span>`,
        n = e.querySelector(".mp-gist-export-editor-btn");
      if (n) return void (n.innerHTML !== t && setSafeInnerHTML(n, t));
      const a = document.createElement("button");
      ((a.className =
        "mp-gist-import-btn mp-gist-export-editor-btn btn btn-sm"),
        (a.type = "button"),
        (a.style.marginRight = "2px"),
        setSafeInnerHTML(a, t),
        (a.onclick = (t) => {
          t.preventDefault();
          const n = e.closest(".js-gist-file");
          n && openExportMenu({ container: n });
        }),
        e.prepend(a));
    });
  }
  function extractContentFromGistFile(e) {
    const t = e.querySelector(".markdown-body");
    if (t) {
      const e = t.cloneNode(!0);
      e.querySelectorAll(".anchor, .octicon, .js-clipboard-copy").forEach((e) =>
        e.remove(),
      );
      let n = (function e(t) {
        if (t.nodeType === Node.TEXT_NODE) return t.textContent;
        if (t.nodeType !== Node.ELEMENT_NODE) return "";
        let n = "";
        const a = t.tagName.toLowerCase();
        switch (
          (Array.from(t.childNodes).forEach((t) => {
            n += e(t);
          }),
          a)
        ) {
          case "h1":
            return `# ${n.trim()}\n`;
          case "h2":
            return `## ${n.trim()}\n`;
          case "h3":
            return `### ${n.trim()}\n`;
          case "h4":
            return `#### ${n.trim()}\n`;
          case "h5":
            return `##### ${n.trim()}\n`;
          case "h6":
            return `###### ${n.trim()}\n`;
          case "strong":
          case "b":
            return `**${n}**`;
          case "em":
          case "i":
            return `*${n}*`;
          case "p":
            return `${n}\n`;
          case "blockquote":
            return `${n
              .trim()
              .split(/\r?\n/)
              .map((e) => `> ${e}`)
              .join("\n")}`;
          case "li": {
            const e = t.parentNode,
              a = n.trim();
            if (e && "OL" === e.tagName) {
              return `${
                Array.from(e.children)
                  .filter((e) => 1 === e.nodeType)
                  .indexOf(t) + 1
              }. ${a}`;
            }
            return `* ${a}`;
          }
          case "ul":
          case "ol":
            return `\n${n
              .split("\n")
              .map((e) => e.trim())
              .filter((e) => "" !== e)
              .join("\n")}\n`;
          case "hr":
            return "\n---\n";
          case "code":
            return t.parentNode && "PRE" === t.parentNode.tagName
              ? n
              : `\`${n}\``;
          case "pre":
            return `\n\`\`\`\n${n.trim()}\n\`\`\`\n`;
          case "a":
            return `[${n}](${t.getAttribute("href") || ""})`;
          case "br":
            return "\n";
          default:
            return n;
        }
      })(e);
      return n.replace(/\n{3,}/g, "\n\n").trim();
    }
    const n = e.querySelectorAll(".blob-code-inner");
    return n.length > 0
      ? Array.from(n)
          .map((e) => e.textContent.replace(/\r?\n$/, ""))
          .join("\n")
      : null;
  }
  async function handleGistImportClick(e, t, n) {
    (e.stopPropagation(), e.preventDefault());
    const a = e.currentTarget,
      o = a.innerHTML;
    a.disabled = !0;
    try {
      const e = extractContentFromGistFile(t);
      if (!e) throw new Error("Could not read file content");
      let o;
      ((o = n.toLowerCase().endsWith(".json")
        ? JSON.parse(e)
        : parseTextPrompt(e, n)),
        await processAndSavePrompts(o));
      const r = Array.isArray(o) ? o.length : 1;
      (showNotification(
        `${r} prompts imported successfully!`,
        "success",
      ),
        (a.dataset.state = "imported"),
        setSafeInnerHTML(a, `<span>${"Imported"}</span>`));
    } catch (e) {
      (showNotification(
        `Error importing file: ${e.message}`,
        "error",
      ),
        (a.disabled = !1),
        setSafeInnerHTML(a, o));
    }
  }
  function injectGistButtons() {
    document.querySelectorAll(".file").forEach((e) => {
      const t = e.querySelector(".file-actions");
      if (!t) return;
      const n = e.querySelector(".gist-blob-name"),
        a = n ? n.innerText.trim() : "";
      if (!a.match(/\.mp\.prompt\.(json|txt|md)$/i)) return;
      const o = `<span>${"Import Prompt"}</span>`,
        r = e.querySelector(".mp-gist-import-btn");
      if (r) {
        if ("imported" === r.dataset.state) return;
        return void (r.innerHTML !== o && setSafeInnerHTML(r, o));
      }
      const s = document.createElement("button");
      ((s.className = "mp-gist-import-btn btn btn-sm"),
        (s.type = "button"),
        setSafeInnerHTML(s, o),
        (s.onclick = (t) => handleGistImportClick(t, e, a)),
        t.prepend(s));
    });
  }
  function highlightPromptSnippetMeta() {
    document.querySelectorAll(".gist-snippet-meta").forEach((e) => {
      if (e.classList.contains("mp-prompt-meta-highlight")) return;
      const t = e.querySelector("strong.css-truncate-target");
      if (t) {
        if (t.textContent.trim().toLowerCase().includes(".mp.prompt.")) {
          e.classList.add("mp-prompt-meta-highlight");
          const n = t.closest("a"),
            a = n ? n.getAttribute("href") : null;
          e.addEventListener("click", (e) => {
            e.target.closest("a, button, input, img") ||
              window.getSelection().toString().trim().length > 0 ||
              (a && (window.location.href = a));
          });
        }
      }
    });
  }
  function initGistIntegration() {
    if ("gist.github.com" !== window.location.hostname) return;
    (injectGistButtons(),
      injectGistExportEditorButtons(),
      highlightPromptSnippetMeta());
    let e = location.href;
    new MutationObserver(() => {
      (location.href !== e &&
        ((e = location.href),
        setTimeout(() => {
          (injectGistButtons(),
            injectGistExportEditorButtons(),
            highlightPromptSnippetMeta());
        }, 200)),
        injectGistButtons(),
        injectGistExportEditorButtons(),
        highlightPromptSnippetMeta());
    }).observe(document.body, { subtree: !0, childList: !0 });
  }
  function cleanup() {
    (SyntaxHighlighter.detach(),
      currentButton && (currentButton.remove(), (currentButton = null)),
      currentMenu && (currentMenu.remove(), (currentMenu = null)),
      currentModal && (currentModal.remove(), (currentModal = null)),
      currentPlaceholderModal &&
        (currentPlaceholderModal.remove(), (currentPlaceholderModal = null)),
      (isInitialized = !1));
  }
  initGistIntegration();
  async function initUI() {
    if (pageObserver) pageObserver.disconnect();
    cleanup();
    currentPlatform = detectPlatform();
    if (!currentPlatform) return;
    createNavInterface();
    // v27.0.2: hoisted so the catch block can inspect whether the button had
    // already mounted before the error (previously scoped to the try block).
    let btn,
      elementToInsert,
      insertionPoint,
      insertionMethod = "before";
    try {
      if (currentPlatform === "chatgpt") {
        const findAnchor = () => {
          const anchor =
            document.getElementById("composer-plus-btn") ||
            document.querySelector('[data-testid="composer-plus-btn"]');
          if (anchor) {
            const hasIcon = anchor.querySelector('use[href*="6be74c"]');
            if (hasIcon || anchor.querySelector("svg")) {
              return { element: anchor, type: "fingerprint-id" };
            }
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const anchorBtn = anchorData.element;
        const container = anchorBtn.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("right");
          container.insertBefore(btn, anchorBtn);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "deepseek") {
        const findAnchor = () => {
          const SEND_ICON_PATH = "M8.3125 0.981587C8.66767";
          const STOP_ICON_PATH = "M2 4.88C2 3.68009";
          const candidates = Array.from(
            document.querySelectorAll('div[role="button"]'),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            const d = path?.getAttribute("d") || "";
            return d.startsWith(SEND_ICON_PATH) || d.startsWith(STOP_ICON_PATH);
          });
          if (target && target.parentElement) {
            return { element: target.parentElement, type: "icon-fingerprint" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          btn.style.marginRight = "15px";
          btn.style.display = "inline-flex";
          btn.style.alignItems = "center";
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "googleaistudio") {
        const isAppsPage = window.location.href.includes("/apps");
        const findAnchor = () => {
          let anchor =
            document.querySelector("ms-add-media-menu") ||
            document.querySelector(".add-media-container");
          if (anchor) {
            const icon = anchor.querySelector(".material-symbols-outlined");
            if (icon && icon.textContent?.trim() === "add_circle") {
              anchor = icon.closest(".button-wrapper") || anchor;
            }
          }
          if (!location.pathname.startsWith("/apps")) {
            anchor =
              document.querySelector('button[iconname="add_circle"]') ||
              document.querySelector("ms-run-button") ||
              anchor;
          }
          if (anchor) {
            anchor =
              anchor.closest(".button-wrapper") ||
              anchor.parentElement ||
              anchor;
          }
          if (!anchor) {
            anchor =
              document.querySelector(".button-wrapper") ||
              document.querySelector(".toolbar-actions");
          }
          if (anchor) return { element: anchor, type: "resolved-anchor" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(".mp-prompt-wrapper");
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
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "qwen") {
        const findAnchor = () => {
          const ANCHOR_IDS = [
            "#icon-line-waveform",
            "#icon-line-arrow-up",
            "#icon-fill-stop-011",
          ];
          const containerCandidate = document.querySelector(
            ".message-input-right-button-send",
          );
          if (!containerCandidate) return null;
          const hasValidIcon = containerCandidate.querySelector("use");
          const iconHref =
            hasValidIcon?.getAttribute("xlink:href") ||
            hasValidIcon?.getAttribute("href");
          if (iconHref && ANCHOR_IDS.includes(iconHref)) {
            return { element: containerCandidate, type: "svg-use-fingerprint" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const parentContainer = anchorData.element.parentElement;
        if (!parentContainer) return;
        let existingBtn = parentContainer.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          parentContainer.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = parentContainer;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "zai") {
        const findAnchor = () => {
          const SEND_ICON = "M7.99946 1.50005L2.29635 13.5283";
          const STOP_SELECTOR = "button span.block.bg-white.size-3";
          const sendBtn = document.getElementById("send-message-button");
          if (sendBtn) return { element: sendBtn, type: "id" };
          const pathTarget = Array.from(
            document.querySelectorAll("button svg path"),
          ).find((p) => p.getAttribute("d")?.startsWith(SEND_ICON));
          if (pathTarget)
            return {
              element: pathTarget.closest("button"),
              type: "fingerprint-send",
            };
          const stopBtn = document
            .querySelector(STOP_SELECTOR)
            ?.closest("button");
          if (stopBtn) return { element: stopBtn, type: "fingerprint-stop" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const container = anchorData.element.closest("div.flex.self-end");
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, container.firstChild);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "gemini") {
        const findAnchor = () => {
          const micIcon = document.querySelector(
            'mat-icon[data-mat-icon-name="mic"]',
          );
          if (micIcon) {
            return {
              element: micIcon.closest(".input-buttons-wrapper-bottom"),
              type: "mic-wrapper",
            };
          }
          const sendIcon = document.querySelector(
            'mat-icon[data-mat-icon-name="send"]',
          );
          if (sendIcon) {
            return {
              element: sendIcon.closest(".input-buttons-wrapper-bottom"),
              type: "send-wrapper",
            };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const bottomWrapper = anchorData.element;
        const container = bottomWrapper.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          btn.style.marginLeft = "20px";
          container.insertBefore(btn, bottomWrapper);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "arena") {
        const findAnchor = () => {
          const ANCHOR_FINGERPRINT = "M3 12L21 12M21 12L12.5 3.5";
          const candidates = Array.from(
            document.querySelectorAll(
              'button[type="submit"], div[role="button"], button',
            ),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            const hasFingerprint =
              path && path.getAttribute("d")?.includes(ANCHOR_FINGERPRINT);
            if (!hasFingerprint) return false;
            const safeContainer = btn.closest("div.flex.items-center.gap-2");
            return !!safeContainer;
          });
          if (target) return { element: target, type: "svg-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const anchorElement = anchorData.element;
        const container = anchorElement.parentElement;
        if (!container) return;
        let existingBtn =
          container.querySelector(".custom-prompt-btn-class") ||
          container.querySelector('[data-testid="composer-button-prompts"]');
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorElement);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "kimi") {
        const findAnchor = () => {
          const SEND_ICON_PATH =
            "M705.536 433.664a38.4 38.4 0 1 1-54.272 54.272L550.4";
          const STOP_ICON_PATH = "M331.946667 379.904";
          const candidates = Array.from(
            document.querySelectorAll(
              ".send-button-container, .send-icon, svg",
            ),
          );
          const targetIcon = candidates.find((el) => {
            const path = el.querySelector("path");
            const d = path?.getAttribute("d");
            return (
              d &&
              (d.startsWith(SEND_ICON_PATH) || d.startsWith(STOP_ICON_PATH))
            );
          });
          const sendContainer = targetIcon?.closest(".send-button-container");
          if (sendContainer) {
            return { element: sendContainer, type: "icon-fingerprint" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 2000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const container =
          anchorData.element.closest(".right-area") ||
          anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "claude") {
        const findAnchor = () => {
          const candidates = Array.from(document.querySelectorAll("button"));
          const voiceBtn = candidates.find((btn) => {
            const svg = btn.querySelector('svg[viewBox="0 0 21.2 21.2"]');
            if (!svg) return false;
            const rects = svg.querySelectorAll("rect");
            return rects.length === 6 && rects[0]?.getAttribute("x") === "0";
          });
          if (voiceBtn) return { element: voiceBtn, type: "voice-fingerprint" };
          const sendBtn = candidates.find((btn) => {
            const icon = btn.querySelector('span[data-cds="Icon"]');
            return icon && icon.textContent.trim() === "";
          });
          if (sendBtn) return { element: sendBtn, type: "send-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container =
          anchorData.element.closest("div.flex.items-center") ||
          anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.style.marginRight = "6px";
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "grok") {
        const findAnchor = () => {
          const idCandidate = document.getElementById("model-select-trigger");
          if (idCandidate) {
            return { element: idCandidate.parentElement, type: "model-id" };
          }
          const MODEL_SVG_PATH = "M6.5 12.5L11.5 17.5M6.5 12.5";
          const candidates = Array.from(document.querySelectorAll("button"));
          const svgCandidate = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(MODEL_SVG_PATH);
          });
          if (svgCandidate) {
            return { element: svgCandidate.parentElement, type: "model-svg" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const leftAnchor = anchorData.element;
        const container = leftAnchor.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
          if (btn.previousElementSibling !== leftAnchor) {
            container.insertBefore(btn, leftAnchor.nextElementSibling);
          }
        } else {
          btn = createPromptButton("left");
          btn.style.marginBottom = "2px";
          container.insertBefore(btn, leftAnchor.nextElementSibling);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "perplexity") {
        const findAnchor = () => {
          const PPLX_FINGERPRINTS = [
            "#pplx-icon-custom-perplexity-v2v",
            "#pplx-icon-player-stop-filled",
            "#pplx-icon-arrow-up",
            "#pplx-icon-arrow-right",
          ];
          const buttons = document.querySelectorAll('button[type="button"]');
          for (const btnEl of buttons) {
            const useTag = btnEl.querySelector("use");
            if (useTag) {
              const href =
                useTag.getAttribute("xlink:href") ||
                useTag.getAttribute("href");
              if (PPLX_FINGERPRINTS.includes(href)) {
                const anchorWrapper = btnEl.closest(".ml-2") || btnEl;
                return { element: anchorWrapper, type: "svg-use-fingerprint" };
              }
            }
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          for (let i = 0; i < 3; i++) {
            await new Promise((r) => setTimeout(r, 800));
            anchorData = findAnchor();
            if (anchorData) break;
          }
        }
        if (!anchorData) return;
        const container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (!existingBtn) {
          btn = createPromptButton("left");
          container.insertBefore(btn, anchorData.element);
        } else {
          btn = existingBtn;
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "longcat") {
        const findAnchor = () => {
          const ICON_HREFS = ["#icon-sikao", "#icon-lianwang", "#icon-upload"];
          const candidates = Array.from(document.querySelectorAll("use"));
          const targetIcon = ICON_HREFS.map((href) =>
            candidates.find((use) => use.getAttribute("href") === href),
          ).find((el) => el !== undefined);
          if (targetIcon) {
            const footer = targetIcon.closest(".chat-input-footer");
            if (footer) {
              const leftBox = footer.closest(".left-box");
              if (leftBox)
                return { element: leftBox, type: "structure-fingerprint" };
            }
          }
          const leftBoxEl = document.querySelector(".left-box");
          if (leftBoxEl) return { element: leftBoxEl, type: "class-selector" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.style.marginRight = "8px";
          container.prepend(btn);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "mistral") {
        const findAnchor = () => {
          const ANCHORICONPATH = "M12 19v3";
          const candidates = Array.from(
            document.querySelectorAll('button, [role="button"]'),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const micButton = anchorData.element;
        const wrapperDiv = micButton.parentElement;
        const outerContainer = wrapperDiv.parentElement;
        if (!outerContainer) return;
        let existingBtn = outerContainer.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          outerContainer.insertBefore(btn, wrapperDiv);
        }
        elementToInsert = btn;
        insertionPoint = outerContainer;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "yuanbao") {
        const findAnchor = () => {
          let target = document.querySelector('a[class*="style__send-btn"]');
          if (target) return { element: target, type: "class-prefix" };
          const iconSpan = document.querySelector("span.iconfont.icon-send");
          if (iconSpan && iconSpan.closest("a")) {
            return { element: iconSpan.closest("a"), type: "child-icon" };
          }
          const ANCHOR_RECT_X = "7.71448";
          const candidates = Array.from(document.querySelectorAll("a, button"));
          const svgTarget = candidates.find((btn) => {
            const rect = btn.querySelector('rect[x="' + ANCHOR_RECT_X + '"]');
            return rect;
          });
          if (svgTarget)
            return { element: svgTarget, type: "icon-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "chatglm") {
        let container = document.querySelector(
          "div.options-container.flex.flex-y-center",
        );
        let anchor = null;
        if (container) {
          anchor = container.querySelector(".upload-image-wrap");
        }
        if (!container || !anchor) {
          container = document.querySelector("div.options[data-v-7dc2591c]");
          if (container) {
            targetType = "element1";
            anchor = container.lastElementChild;
          }
        }
        if (!container || !anchor) {
          container = document.querySelector("div.options[data-v-7a34b085]");
          if (container) {
            targetType = "element2";
            anchor = container.lastElementChild;
          }
        }
        if (!container || !anchor) {
          container = await waitFor(".options, .options-container", 5000);
          if (!container) return;
          if (container.matches("[data-v-7dc2591c]")) {
            targetType = "element1";
            anchor = container.lastElementChild;
          } else if (container.matches("[data-v-7a34b085]")) {
            targetType = "element2";
            anchor = container.lastElementChild;
          } else {
            targetType = "original";
            anchor = container.querySelector(".upload-image-wrap");
          }
        }
        if (!container || !anchor) return;
        btn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (!btn) {
          btn = createPromptButton();
        }
        elementToInsert = btn;
        insertionPoint = anchor;
        insertionMethod = "after";
      } else if (currentPlatform === "poe") {
        const findAnchor = () => {
          const ANCHOR_ICON_SIG = "M13 4.5a1 1 0 1 0-2 0V11";
          const candidates = Array.from(
            document.querySelectorAll(
              'button[data-button-file-input="true"], button',
            ),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHOR_ICON_SIG);
          });
          if (target) {
            const actionContainer = target.closest(
              '[class*="actionContainerLeft"]',
            );
            return {
              element: actionContainer || target.parentElement,
              type: "icon-fingerprint",
            };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData || !anchorData.element) return;
        let container = anchorData.element;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
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
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "googleModoIA") {
        const findAnchor = () => {
          const ANCHOR_SVG_PATH =
            "M440-440H200v-80H440V-760h80v240H760v80H520v240H440V-440Z";
          const candidates = Array.from(
            document.querySelectorAll("button.uMMzHc, button[jsuid]"),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d") === ANCHOR_SVG_PATH;
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.style.marginTop = "6px";
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "notebooklm") {
        const findAnchor = () => {
          const candidates = document.querySelectorAll(
            "button.submit-button, button[aria-label], .query-box button",
          );
          let anchor = null;
          for (const button of candidates) {
            const svg = button.querySelector("svg");
            const path = svg?.querySelector("path");
            const icon = button.querySelector("mat-icon");
            if (
              path?.getAttribute("d")?.includes("M2 21") ||
              icon?.textContent?.trim() === "arrow_forward" ||
              button.classList.contains("submit-button")
            ) {
              anchor = button;
              break;
            }
          }
          anchor =
            anchor ||
            document.querySelector("button.submit-button") ||
            document.querySelector(".query-box");
          if (anchor) {
            anchor =
              anchor.closest(".button-wrapper") ||
              anchor.parentElement ||
              anchor;
            return { element: anchor, type: "notebooklm-anchor" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 2000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "doubao") {
        const findMicArea = () => {
          const micPath = Array.from(
            document.querySelectorAll("svg path"),
          ).find((p) => p.getAttribute("d")?.startsWith("M19.8628 9.29346"));
          if (micPath) {
            const micOuterWrapper = micPath.closest('[class*="items-end"]');
            if (micOuterWrapper && micOuterWrapper.parentElement) {
              return {
                container: micOuterWrapper.parentElement,
                referenceNode: micOuterWrapper,
              };
            }
          }
          return null;
        };
        const findStopButtonArea = () => {
          const stopPath = Array.from(
            document.querySelectorAll("svg path"),
          ).find((p) => p.getAttribute("d")?.startsWith("M21.1504 12C"));
          if (stopPath) {
            const stopButton =
              stopPath.closest(".break-btn-fISNgC") ||
              stopPath.closest('[class*="rounded-full"]');
            if (stopButton) {
              const stopOuterWrapper = stopButton.closest(
                '[class*="items-end"]',
              );
              if (stopOuterWrapper && stopOuterWrapper.parentElement) {
                return {
                  container: stopOuterWrapper.parentElement,
                  referenceNode: stopOuterWrapper,
                };
              }
            }
          }
          const stopContainer = document.querySelector(
            ".flex.items-end.empty\\:hidden.z-1",
          );
          if (stopContainer && stopContainer.parentElement) {
            const reference =
              stopContainer.querySelector(".break-btn-fISNgC") ||
              stopContainer.querySelector('[class*="rounded-full"]');
            if (reference) {
              return {
                container: stopContainer.parentElement,
                referenceNode: stopContainer,
              };
            }
          }
          return null;
        };
        const findRightArea = () => {
          const sendIcon = Array.from(
            document.querySelectorAll("span.semi-icon path"),
          ).find((p) => p.getAttribute("d")?.startsWith("m3.543 8.883"));
          if (sendIcon) {
            const r = sendIcon.closest('[class*="right-area"]');
            if (r) return { container: r.parentElement, referenceNode: r };
          }
          const stopIcon = Array.from(
            document.querySelectorAll("span.semi-icon path"),
          ).find((p) => p.getAttribute("d")?.startsWith("M12 23c6.075"));
          if (stopIcon) {
            const r = stopIcon.closest('[class*="right-area"]');
            if (r) return { container: r.parentElement, referenceNode: r };
          }
          const sendBtn = document.getElementById("flow-end-msg-send");
          if (sendBtn) {
            const r = sendBtn.closest('[class*="right-area"]');
            if (r) return { container: r.parentElement, referenceNode: r };
          }
          const fallbackRight = document.querySelector(
            '[class*="right-area-"]',
          );
          if (fallbackRight)
            return {
              container: fallbackRight.parentElement,
              referenceNode: fallbackRight,
            };
          return null;
        };
        let targetArea =
          findMicArea() || findStopButtonArea() || findRightArea();
        if (!targetArea) {
          await new Promise((r) => setTimeout(r, 1500));
          targetArea = findMicArea() || findStopButtonArea() || findRightArea();
        }
        if (!targetArea || !targetArea.container) return;
        if (
          !targetArea.referenceNode ||
          !targetArea.referenceNode.isConnected
        ) {
          targetArea = findMicArea() || findStopButtonArea() || findRightArea();
          if (
            !targetArea ||
            !targetArea.container ||
            !targetArea.referenceNode?.isConnected
          )
            return;
        }
        let existingBtn = targetArea.container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          btn.style.marginRight = "8px";
          targetArea.container.insertBefore(btn, targetArea.referenceNode);
        }
        elementToInsert = btn;
        insertionPoint = targetArea.container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "copilot") {
        const findAnchor = () => {
          const testIdEl = document.querySelector(
            'button[data-testid="composer-create-button"]',
          );
          if (testIdEl) {
            const wrapper = testIdEl.parentElement;
            return { element: testIdEl, wrapper: wrapper, type: "testid" };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 2000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const mainContainer = anchorData.wrapper.parentElement;
        if (!mainContainer) return;
        const trueContainer = mainContainer.parentElement;
        if (!trueContainer) return;
        let existingBtn = trueContainer.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("right");
          trueContainer.insertBefore(btn, mainContainer);
        }
        if (btn) {
          btn.style.setProperty("margin", "0", "important");
        }
        elementToInsert = btn;
        insertionPoint = trueContainer;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "glmimage") {
        const findAnchor = () => {
          const ANCHORICONPATH = "m6 9 6 6 6-6";
          const candidates = Array.from(
            document.querySelectorAll('button, [role="combobox"]'),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1000));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (container && !container.classList.contains("flex")) {
          container = container.closest(".flex.items-center.gap-4");
        }
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.prepend(btn);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "flow") {
        // v27.0.6: the dock is the sole, unconditional mount method on Flow
        // — no anchor hunt, no PINHOLE bar-walk, no promotion watcher. The
        // whole point of a body-level dock is that it does not depend on
        // finding a place in the composer's DOM, so hunting for one first
        // (and only falling back to the dock on failure) defeated that
        // purpose: whenever the hunt succeeded, the code took the inline
        // branch instead and the dock never mounted at all. Prompt
        // insertion is unaffected — findPlatformEditor() locates the
        // editor independently via findFlowComposerContainer() (anchor
        // cascade + PINHOLE + bottom-most visible editable), which this
        // branch no longer touches.
        const existingDock = document.getElementById("pm-flow-dock");
        if (existingDock) existingDock.remove();
        const pill = createPromptButton("left");
        const mainSlotBtn = pill.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        mainSlotBtn && mainSlotBtn.replaceWith(createDockSettingsButton());
        const dock = document.createElement("div");
        ((dock.id = "pm-flow-dock"),
          dock.setAttribute("data-testid", "pm-flow-dock"));
        const trigger = document.createElement("button");
        ((trigger.type = "button"),
          (trigger.className = "mp-dock-trigger"),
          trigger.setAttribute("data-testid", "pm-flow-dock-trigger"),
          (trigger.title = "Prompt Master"),
          setSafeInnerHTML(
            trigger,
            FLOW_DOCK_GLYPH + '<span class="mp-dock-text">Prompt Master</span>',
          ),
          (trigger.onclick = (e) => {
            e.stopPropagation();
            const panel = pill.querySelector(".mp-sliding-pill-container");
            panel && panel.click();
          }));
        dock.appendChild(trigger);
        dock.appendChild(pill);
        if (!document.getElementById("pm-flow-dock-style")) {
          const dockStyle = document.createElement("style");
          ((dockStyle.id = "pm-flow-dock-style"),
            (dockStyle.textContent = FLOW_DOCK_CSS),
            document.head.appendChild(dockStyle));
        }
        ensureCinzelDecorativeFont();
        document.body.appendChild(dock);
        let dockHideTimer = null;
        const scheduleDockHide = () => {
          if (dockHideTimer) clearTimeout(dockHideTimer);
          dockHideTimer = setTimeout(() => {
            dockHideTimer = null;
            if (!document.body.contains(dock)) return;
            if (
              (currentMenu && currentMenu.classList.contains("visible")) ||
              (settingsModal && settingsModal.classList.contains("visible"))
            ) {
              scheduleDockHide();
              return;
            }
            dock.classList.remove("mp-dock-open");
          }, FLOW_DOCK_HIDE_DELAY_MS);
        };
        dock.addEventListener("mouseenter", () => {
          dock.classList.add("mp-dock-open");
          if (dockHideTimer) {
            clearTimeout(dockHideTimer);
            dockHideTimer = null;
          }
        });
        dock.addEventListener("mouseleave", scheduleDockHide);
        btn = dock;
        elementToInsert = dock;
        insertionPoint = document.body;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "ernie") {
        const findAnchor = () => {
          const ANCHORICONPATH =
            " M43,-63.4379997253418 C43,-63.4379997253418 31,-59.6879997253418 31,-59.6879997253418";
          const path = Array.from(document.querySelectorAll("path")).find(
            (p) => {
              const d = p.getAttribute("d");
              return d && d.startsWith(ANCHORICONPATH);
            },
          );
          if (path) {
            const anchor = path.closest(".send__slzHSuja");
            if (anchor) return { element: anchor, type: "icon-fingerprint" };
          }
          const fallbackAnchor = document.querySelector(".send__slzHSuja");
          if (fallbackAnchor)
            return { element: fallbackAnchor, type: "class-fallback" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        const anchor = anchorData.element;
        const container = anchor.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.style.marginRight = "15px";
          container.insertBefore(btn, anchor);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (
        currentPlatform === "dreamina" ||
        currentPlatform === "jimengJianying"
      ) {
        const findAnchor = () => {
          const container = document.querySelector(
            'div[class*="toolbar-actions"]',
          );
          if (container) return { element: container, type: "container" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
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
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "nvidiaNim") {
        const findAnchor = () => {
          const ANCHORICONPATH = "M0.747,1.623l14.495,6.377";
          const candidates = Array.from(
            document.querySelectorAll('button, [role="button"]'),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          const textArea = document.querySelector(
            'textarea[data-testid="nv-text-area-element"]',
          );
          if (textArea && textArea.parentElement)
            return { element: textArea.parentElement, type: "fallback-parent" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element;
        if (anchorData.type === "icon-fingerprint") {
          container = anchorData.element.parentElement;
        }
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.style.marginBottom = "2px";
          btn.style.marginRight = "5px";
          btn.style.setProperty("padding", "revert", "important");
          if (anchorData.type === "icon-fingerprint") {
            container.insertBefore(btn, anchorData.element);
          } else {
            container.appendChild(btn);
          }
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "indicArena") {
        const findAnchor = () => {
          const ANCHOR_ICON_PATH = "M14.536 21.686a.5.5";
          const candidates = Array.from(
            document.querySelectorAll('button[type="submit"]'),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("svg path");
            return path && path.getAttribute("d")?.startsWith(ANCHOR_ICON_PATH);
          });
          if (target) return { element: target, type: "svg-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "qianwen") {
        const findAnchor = () => {
          const iconWrapper = document.querySelector(
            '[data-icon-type="qwpcicon-sendChat"]',
          );
          if (iconWrapper) {
            const buttonContainer = iconWrapper.closest("div");
            if (buttonContainer)
              return {
                element: buttonContainer,
                type: "data-icon-fingerprint",
              };
          }
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          btn.style.marginRight = "8px";
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "geminigen") {
        const findAnchor = () => {
          const candidates = Array.from(
            document.querySelectorAll(
              "div.flex.justify-end.gap-2.items-center",
            ),
          );
          const target = candidates.find((div) => {
            const hasButton = div.querySelector("button");
            const isVisible = div.offsetParent !== null;
            return hasButton && isVisible;
          });
          if (target) return { element: target, type: "action-container" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          const nativeButton = container.querySelector("button");
          if (nativeButton) {
            container.insertBefore(btn, nativeButton);
          } else {
            container.appendChild(btn);
          }
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "hunyuan") {
        const findAnchor = () => {
          const ANCHORICONPATH = "M7.68326";
          const candidates = Array.from(
            document.querySelectorAll(
              "div.hy-chat-input-send-btn, div.hy-chat-input-send-btn--disabled",
            ),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          const fallbackCandidates = Array.from(
            document.querySelectorAll(
              'button, [role="button"], div[class*="send"]',
            ),
          );
          const fallbackTarget = fallbackCandidates.find((el) => {
            const path = el.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (fallbackTarget)
            return {
              element: fallbackTarget,
              type: "icon-fingerprint-fallback",
            };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        container.style.display = "flex";
        container.style.alignItems = "center";
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "bing") {
        const findAnchor = () => {
          const anchorWrapper = document.getElementById("create_btn_wrapper");
          if (anchorWrapper) {
            return { element: anchorWrapper, type: "static-id" };
          }
          const classEl = document.querySelector("div.create_btn_wrapper");
          if (classEl) return { element: classEl, type: "class-name" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "meta") {
        const findAnchor = () => {
          const SEND_ICON_PATH = "M16 6.125a.89.89";
          const STOP_ICON_PATH = "M19.1 5.625c1.105 0";
          const candidates = Array.from(document.querySelectorAll("button"));
          let target = candidates.find((btn) => {
            const path = btn.querySelector("svg > path");
            return (
              btn.dataset.testid === "composer-send-button" ||
              (path && path.getAttribute("d")?.startsWith(SEND_ICON_PATH))
            );
          });
          if (!target) {
            target = candidates.find((btn) => {
              const path = btn.querySelector("svg > path");
              return (
                btn.dataset.testid === "composer-stop-button" ||
                (path && path.getAttribute("d")?.startsWith(STOP_ICON_PATH))
              );
            });
          }
          if (target) return { element: target, type: "dynamic-anchor" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton("left");
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "manus") {
        const findAnchor = () => {
          const ANCHOR_ICON_PATH = "M7.91699 15.0642C7.53125 15.0642";
          const candidates = Array.from(document.querySelectorAll("button"));
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHOR_ICON_PATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      } else if (currentPlatform === "xiaomi") {
        const findAnchor = () => {
          const ANCHORICONPATH = "M.244 7.921 18.202.03c.254-.111";
          const candidates = Array.from(
            document.querySelectorAll(
              'button, [role="button"], div[class*="button"]',
            ),
          );
          const target = candidates.find((btn) => {
            const path = btn.querySelector("path");
            return path && path.getAttribute("d")?.startsWith(ANCHORICONPATH);
          });
          if (target) return { element: target, type: "icon-fingerprint" };
          const trackIdEl = document.querySelector(
            'button[data-track-id="home_send_btn"]',
          );
          if (trackIdEl) return { element: trackIdEl, type: "trackid" };
          return null;
        };
        let anchorData = findAnchor();
        if (!anchorData) {
          await new Promise((r) => setTimeout(r, 1500));
          anchorData = findAnchor();
        }
        if (!anchorData) return;
        let container = anchorData.element.parentElement;
        if (!container) return;
        let existingBtn = container.querySelector(
          '[data-testid="composer-button-prompts"]',
        );
        if (existingBtn) {
          btn = existingBtn;
        } else {
          btn = createPromptButton();
          btn.setAttribute("data-testid", "composer-button-prompts");
          container.insertBefore(btn, anchorData.element);
        }
        elementToInsert = btn;
        insertionPoint = container;
        insertionMethod = "handled_manually";
      }
      if (!btn || !insertionPoint) return;
      try {
        const editorEl =
          getEditableRoot(findPlatformEditor()) ||
          getEditableRoot(
            document.querySelector(platformSelectors[currentPlatform]),
          );
        if (editorEl) {
          setupInlineSuggestion(editorEl);
        } else {
          setTimeout(() => {
            try {
              const retryEditor =
                getEditableRoot(findPlatformEditor()) ||
                getEditableRoot(
                  document.querySelector(platformSelectors[currentPlatform]),
                );
              if (retryEditor) setupInlineSuggestion(retryEditor);
            } catch (retryErr) {
              console.warn(
                "[Prompt Master] inline-suggestion retry failed:",
                retryErr,
              );
            }
          }, 1000);
        }
      } catch (inlineErr) {
        console.warn("[Prompt Master] inline-suggestion setup failed:", inlineErr);
      }
      currentButton = elementToInsert;
      const clickable = btn;
      if (insertionMethod === "append") {
        insertionPoint.appendChild(elementToInsert);
      } else if (insertionMethod === "before") {
        insertionPoint.parentNode.insertBefore(elementToInsert, insertionPoint);
      } else if (insertionMethod === "after") {
        insertionPoint.parentNode.insertBefore(
          elementToInsert,
          insertionPoint.nextSibling,
        );
      } else if (currentPlatform === "chatglm") {
        applyChatGLMCustomStyles();
      } else if (currentPlatform === "grok") {
        applyGrokCustomStyles();
      }
      currentMenu = createPromptMenu();
      currentModal = createPromptModal();
      currentPlaceholderModal = createPlaceholderModal();
      document.body.appendChild(currentMenu);
      document.body.appendChild(currentModal);
      document.body.appendChild(currentPlaceholderModal);
      clickable.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const menu = currentMenu;
        if (menu.classList.contains("visible")) {
          closeMenu();
          return;
        }
        refreshMenu().then(() => {
          positionMenu(menu, clickable);
          menu.classList.add("visible");
          setTimeout(() => {
            const list = menu.querySelector("#prompt-menu-list-el");
            if (list && list.updateScrollArrows) {
              list.updateScrollArrows();
            }
          }, 250);
        });
      });
      currentModal.querySelector("#__ap_save").onclick = async (e) => {
        e.stopPropagation();
        const promptId = currentModal.dataset.promptId;
        const title = document.getElementById("__ap_title").value.trim();
        const text = document.getElementById("__ap_text").value.trim();
        const usePlaceholders = document.getElementById(
          "__ap_use_placeholders",
        ).checked;
        const autoExecute =
          document.getElementById("__ap_auto_execute").checked;
        if (!title || !text) {
          showNotification("Title and Prompt are required.", "error");
          return;
        }
        const box = currentModal.querySelector(".mp-modal-box");
        const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
        const fields = {
          title,
          text,
          usePlaceholders,
          autoExecute,
          activeFileIds: Array.from(currentActiveFileIds),
          tags: tags,
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
        if (currentMenu) currentMenu.classList.add("visible");
      };
      const handleSaveAndExecute = async (e) => {
        if (!isShortcutPressed(e, "saveSend")) return;
        e.preventDefault();
        e.stopPropagation();
        const promptId = currentModal.dataset.promptId;
        const title = document.getElementById("__ap_title").value.trim();
        const text = document.getElementById("__ap_text").value.trim();
        const usePlaceholders = document.getElementById(
          "__ap_use_placeholders",
        ).checked;
        const autoExecute =
          document.getElementById("__ap_auto_execute").checked;
        if (!title || !text) {
          showNotification("Title and Prompt are required.", "error");
          return;
        }
        const box = currentModal.querySelector(".mp-modal-box");
        const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
        const fields = {
          title,
          text,
          usePlaceholders,
          autoExecute,
          activeFileIds: Array.from(currentActiveFileIds),
          tags: tags,
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
        if (savedItem.usePlaceholders) {
          openPlaceholderModal(savedItem);
        } else {
          insertPrompt(savedItem);
        }
      };
      document
        .getElementById("__ap_title")
        .addEventListener("keydown", handleSaveAndExecute);
      document
        .getElementById("__ap_text")
        .addEventListener("keydown", handleSaveAndExecute);
      const savePromptData = async () => {
        const title = document.getElementById("__ap_title").value.trim();
        const text = document.getElementById("__ap_text").value.trim();
        if (!title || !text) {
          showNotification("Title and Prompt are required.", "error");
          return false;
        }
        const promptId = currentModal.dataset.promptId;
        const usePlaceholders = document.getElementById(
          "__ap_use_placeholders",
        ).checked;
        const autoExecute =
          document.getElementById("__ap_auto_execute").checked;
        const box = currentModal.querySelector(".mp-modal-box");
        const tags = box && box.getCurrentTags ? box.getCurrentTags() : [];
        const fields = {
          title,
          text,
          usePlaceholders,
          autoExecute,
          activeFileIds: Array.from(currentActiveFileIds),
          tags: tags,
        };
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
        showNotification("Saved Successfully!");
        await refreshMenu();
        return true;
      };
      const handleSaveKeepOpen = async (e) => {
        if (!isShortcutPressed(e, "saveEditor")) return;
        e.preventDefault();
        e.stopPropagation();
        await savePromptData();
      };
      document
        .getElementById("__ap_title")
        .addEventListener("keydown", handleSaveKeepOpen);
      document
        .getElementById("__ap_text")
        .addEventListener("keydown", handleSaveKeepOpen);
      currentModal.querySelector("#__ap_close_prompt").onclick = async (e) => {
        e.stopPropagation();
        const currentTitle = document.getElementById("__ap_title").value;
        const currentText = document.getElementById("__ap_text").value;
        const origTitle = currentModal.dataset.originalTitle || "";
        const origText = currentModal.dataset.originalText || "";
        if (currentTitle !== origTitle || currentText !== origText) {
          const actionResult = await createDialogo({
            message: "You have unsaved changes. Exit without saving?",
            actions: [
              {
                label: "Cancel",
                style: "secondary",
                value: "cancel",
              },
              {
                label: "Confirm",
                style: "danger",
                value: "exit",
              },
              {
                label: "Save and Exit",
                style: "primary",
                value: "save",
              },
            ],
          });
          if (actionResult === "cancel" || actionResult === undefined) {
            return;
          }
          if (actionResult === "save") {
            const savedSuccessfully = await savePromptData();
            if (!savedSuccessfully) {
              return;
            }
          }
        }
        hideModal(currentModal);
      };
      currentPlaceholderModal.querySelector("#__ap_insert_prompt").onclick =
        async (e) => {
          e.stopPropagation();
          const isFromInline =
            currentPlaceholderModal.dataset.fromInline === "true";
          const parseData = JSON.parse(
            currentPlaceholderModal.dataset.parseData,
          );
          const originalItem = JSON.parse(
            currentPlaceholderModal.dataset.originalItem,
          );
          let finalText = parseData.processedText;
          const ignoreMap = new Map(parseData.ignoreMap);
          const selectMap = new Map(parseData.selectMap);
          const inputMap = new Map(parseData.inputMap);
          const fileMap = new Map(parseData.fileMap || []);
          const variablesToApply = [];
          const container = document.getElementById(
            "__ap_placeholders_container",
          );
          let dynamicFilesToAttach = [];
          const removeEmptyPlaceholder = (text, key) => {
            const emptyLineRegex = new RegExp(
              `^[ \\t]*${key}[ \\t]*\\r?\\n?`,
              "gm",
            );
            text = text.replace(emptyLineRegex, "");
            text = text.split(key).join("");
            return text;
          };
          fileMap.forEach((_data, key) => {
            finalText = removeEmptyPlaceholder(finalText, key);
            const files = currentPlaceholderModal._tempFiles.get(key) || [];
            dynamicFilesToAttach.push(...files);
          });
          inputMap.forEach((data, key) => {
            const inputEl = container.querySelector(
              `textarea[data-key="${key}"]`,
            );
            const val = inputEl ? inputEl.value : "";
            if (typeof data === "object" && data.silent) {
              finalText = removeEmptyPlaceholder(finalText, key);
            } else {
              if (val.trim() === "") {
                finalText = removeEmptyPlaceholder(finalText, key);
              } else {
                finalText = finalText.split(key).join(val);
              }
            }
            if (typeof data === "object" && data.varName) {
              variablesToApply.push({ name: data.varName, value: val });
            }
          });
          selectMap.forEach((data, key) => {
            const group = container.querySelector(
              `div[data-select-key="${key}"]`,
            );
            const checkedCheckboxes = Array.from(
              group.querySelectorAll('input[type="checkbox"]:checked'),
            );
            const joinChar = data.isInline ? " " : "\n";
            const selectedText = checkedCheckboxes
              .map((cb) => {
                const parent = cb.closest(".mp-option-item");
                if (cb.dataset.type === "other") {
                  const txtInput =
                    parent.querySelector(
                      '.mp-other-input[data-is-other="true"]',
                    ) || parent.querySelector(".mp-other-input");
                  return txtInput ? txtInput.value : "";
                }
                let val = cb.value;
                const inputs = parent.querySelectorAll(
                  ".mp-other-input[data-opt-input-key]",
                );
                if (inputs.length > 0) {
                  inputs.forEach((inp) => {
                    const inputKey = inp.dataset.optInputKey;
                    const inpValue = inp.value;
                    if (inpValue.trim() === "") {
                      const emptyLineRegex = new RegExp(
                        `^[ \\t]*${inputKey}[ \\t]*\\r?\\n?`,
                        "gm",
                      );
                      val = val.replace(emptyLineRegex, "");
                      val = val.split(inputKey).join("");
                    } else {
                      val = val.split(inputKey).join(inpValue);
                    }
                  });
                }
                return val;
              })
              .filter((val) => val.trim() !== "")
              .join(joinChar);
            if (selectedText.trim() === "") {
              finalText = removeEmptyPlaceholder(finalText, key);
            } else {
              finalText = finalText
                .split(key)
                .join((data.indent || "") + selectedText);
            }
          });
          const applyVariables = (text) => {
            if (!text) return text;
            let t = text;
            variablesToApply.forEach((v) => {
              const escapedVar = v.name.replace(/\$/g, "\\$");
              const varRegex = new RegExp(escapedVar, "g");
              t = t.replace(varRegex, v.value);
            });
            return t;
          };
          finalText = applyVariables(finalText);
          const reversedIgnoreEntries = Array.from(
            ignoreMap.entries(),
          ).reverse();
          for (const [key, content] of reversedIgnoreEntries) {
            if (key.startsWith("__QUOTE_")) {
              const contentWithVars = applyVariables(content);
              finalText = finalText.split(key).join(contentWithVars);
            } else {
              finalText = finalText.split(key).join(content);
            }
          }
          if (isFromInline && currentPlaceholderModal._savedCursor) {
            const saved = currentPlaceholderModal._savedCursor;
            const editor =
              getEditableRoot(findPlatformEditor()) ||
              getEditableRoot(document.querySelector(platformSelectors[currentPlatform]));
            if (editor) {
              editor.focus();
              try {
                if (saved.type === "input") {
                  if (typeof editor.setSelectionRange === "function") {
                    editor.setSelectionRange(saved.start, saved.end);
                  }
                } else if (saved.type === "contenteditable" && saved.node) {
                  const sel = window.getSelection();
                  const range = document.createRange();
                  range.setStart(saved.node, saved.offset);
                  range.setEnd(saved.node, saved.offset);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              } catch (err) {}
            }
          }
          const finalPrompt = {
            ...originalItem,
            text: finalText,
            dynamicFiles: dynamicFilesToAttach,
          };
          await insertPrompt(finalPrompt, isFromInline, isFromInline);
          currentPlaceholderModal.dataset.fromInline = "false";
          currentPlaceholderModal._savedCursor = null;
          hideModal(currentPlaceholderModal);
        };
      currentPlaceholderModal.querySelector("#__ap_close_placeholder").onclick =
        (e) => {
          e.stopPropagation();
          hideModal(currentPlaceholderModal);
        };
      isInitialized = true;
    } catch (error) {
      console.warn("[Prompt Master] initUI error:", error);
      if (btn && btn.isConnected) {
        currentButton = btn;
        btn.onclick = (ev) => {
          (ev.stopPropagation(), (isInitialized = !1), tryInit());
        };
      } else {
        cleanup();
      }
    } finally {
      setupPageObserver();
    }
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
    document.addEventListener("click", (ev) => {
      if (!currentMenu || !currentButton) return;
      if (
        ev.target.closest(
          '#prompt-menu-container, [data-testid="composer-button-prompts"], #pm-flow-dock',
        )
      )
        return;
      closeMenu();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (currentMenu && currentMenu.classList.contains("visible")) {
          closeMenu();
        }
        if (currentModal && currentModal.classList.contains("visible")) {
          currentModal.querySelector("#__ap_close_prompt").click();
        }
        if (
          currentPlaceholderModal &&
          currentPlaceholderModal.classList.contains("visible")
        )
          hideModal(currentPlaceholderModal);
      }
      if (
        window.__apCustomShortcutsMap &&
        window.__apCustomShortcutsMap.length > 0
      ) {
        const partsMatch = (ev, shortcutStr) => {
          if (!shortcutStr) return false;
          const parts = shortcutStr.split("+");
          const needsCtrl = parts.includes("Ctrl");
          const needsAlt = parts.includes("Alt");
          const needsShift = parts.includes("Shift");
          if (
            Boolean(ev.ctrlKey) !== needsCtrl ||
            Boolean(ev.altKey) !== needsAlt ||
            Boolean(ev.shiftKey) !== needsShift
          )
            return false;
          const mainKey = parts[parts.length - 1];
          let evKey = ev.key.toUpperCase();
          if (ev.code === "Space") evKey = "Space";
          if (evKey === " ") evKey = "Space";
          return evKey === mainKey;
        };
        const matchedItem = window.__apCustomShortcutsMap.find((item) =>
          partsMatch(ev, item.shortcut),
        );
        if (matchedItem) {
          ev.preventDefault();
          ev.stopPropagation();
          if (typeof closeMenu === "function") closeMenu();
          const p = matchedItem.prompt;
          p.usageCount = (p.usageCount || 0) + 1;
          updateById(p.id, { usageCount: p.usageCount });
          if (
            typeof currentPlaceholderModal !== "undefined" &&
            currentPlaceholderModal
          )
            currentPlaceholderModal.dataset.fromInline = "false";
          if (p.usePlaceholders && typeof openPlaceholderModal === "function")
            openPlaceholderModal(p);
          else if (typeof insertPrompt === "function") insertPrompt(p);
          return;
        }
      }
      if (isShortcutPressed(ev, "newPrompt")) {
        ev.preventDefault();
        ev.stopPropagation();
        closeMenu();
        openPromptModal();
      }
      if (isShortcutPressed(ev, "listPrompts")) {
        ev.preventDefault();
        ev.stopPropagation();
        if (currentMenu && currentMenu.classList.contains("visible")) {
          closeMenu();
        } else {
          _abrirPesquisaComAtalho = true;
          if (currentButton) currentButton.click();
        }
      }
      if (isShortcutPressed(ev, "enhancePrompt")) {
        ev.preventDefault();
        ev.stopPropagation();
        handleInstantPageEnhancement();
      }
      if (isShortcutPressed(ev, "expandedMode")) {
        ev.preventDefault();
        ev.stopPropagation();
        closeMenu();
        openExpandedPromptMenu();
      }
    });
    window.addEventListener(
      "resize",
      debounce(() => {
        if (currentMenu && currentMenu.classList.contains("visible")) {
          positionMenu(currentMenu, currentButton);
        }
      }, 100),
    );
  }
  function tryInit() {
    if (isInitializing) return;
    if (
      isInitialized &&
      currentButton &&
      document.body.contains(currentButton) &&
      currentPlatform === detectPlatform()
    ) {
      return;
    }
    isInitializing = true;
    initUI().finally(() => {
      isInitializing = false;
    });
  }
  async function start() {
    installAutoBackupProxy();
    const wasRestored = await restoreFromAutoBackup();
    checkFirstRun();
    await loadSyntaxConfig();
    await loadShortcuts();
    await loadPredictionConfig();
    await loadNavConfig();
    await loadPreviewPromptConfig();
    await loadTagsConfig();
    GM_registerMenuCommand(`⚙️ ${"Settings"}`, () => {
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
    console.log(
      `[Prompt Master] v${SCRIPT_VERSION} active — platform: ${detectPlatform() || "none (page not matched)"}`,
    );
    tryInit();
  }
  start();
})();
