#!/usr/bin/env node
/* Isolated suite load harness (Round 6 -> Round 7):
 * Evaluates modified critical engines (ChatGPT++ on chatgpt.com, Prompt Master
 * on flow.google.com) AND verifies every dist/*.user.js installable parses and
 * evaluates cleanly in a stubbed userscript-manager VM without uncaught throws.
 * Eliminates the Round 6 vacuous __pmLoadedGuarantor bypass. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist");

function makeStubDocument() {
  const mkEl = (tag) => {
    const el = {
      tagName: String(tag || "div").toUpperCase(),
      nodeName: String(tag || "div").toUpperCase(),
      nodeType: 1,
      children: [],
      childNodes: [],
      _style: { cssText: "", setProperty() {}, removeProperty() {} },
      get style() { return this._style; },
      set style(v) { if (typeof v === "string") this._style.cssText = v; else if (v && typeof v === "object") this._style = v; },
      dataset: {},
      attrs: {},
      className: "",
      id: "",
      innerHTML: "",
      textContent: "",
      value: "",
      checked: false,
      disabled: false,
      href: "",
      src: "",
      files: { length: 0 },
      selectedOptions: [],
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k] ?? null; },
      removeAttribute(k) { delete this.attrs[k]; },
      hasAttribute(k) { return k in this.attrs; },
      addEventListener() {},
      removeEventListener() {},
      appendChild(c) { if (c && typeof c === "object") c.parentNode = this; this.children.push(c); return c; },
      removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; },
      insertBefore(c) { this.children.push(c); return c; },
      append(...cs) { this.children.push(...cs); },
      prepend(...cs) { this.children.unshift(...cs); },
      attachShadow() {
        const sr = mkEl("shadow-root");
        sr.querySelector = () => mkEl("universal");
        sr.querySelectorAll = () => [];
        sr.getElementById = () => mkEl("el");
        return sr;
      },
      querySelector() { return mkEl("el"); },
      querySelectorAll() { return []; },
      getElementsByTagName() { return []; },
      getElementsByClassName() { return []; },
      getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
      getClientRects() { return []; },
      contains() { return false; },
      closest() { return null; },
      matches() { return false; },
      dispatchEvent() { return true; },
      replaceChildren() { this.children.length = 0; },
      cloneNode() { return mkEl(tag); },
      focus() {},
      blur() {},
      click() {},
      remove() {},
    };
    return el;
  };
  const body = mkEl("body");
  const head = mkEl("head");
  const docEl = mkEl("html");
  const universal = () => {
    const el = mkEl("universal");
    el.querySelector = () => universal();
    el.querySelectorAll = () => [];
    el.closest = () => null;
    return el;
  };
  const doc = mkEl("document");
  doc.body = body;
  doc.head = head;
  doc.documentElement = docEl;
  doc.readyState = "complete";
  doc.hidden = false;
  doc.cookie = "";
  doc.title = "harness";
  doc.images = [];
  doc.links = [];
  doc.scripts = [];
  doc.forms = [];
  doc.body.parentNode = docEl;
  doc.head.parentNode = docEl;
  docEl.parentNode = doc;
  doc.createElement = mkEl;
  doc.createElementNS = (_ns, t) => mkEl(t);
  doc.createTextNode = (t) => ({ nodeType: 3, textContent: String(t || "") });
  doc.createDocumentFragment = () => mkEl("fragment");
  doc.getElementById = (id) => (id === "bulkimg-host" || id === "flowpp-host" ? null : mkEl("el"));
  doc.querySelector = (sel) => (sel === "body" ? body : sel === "head" ? head : universal());
  doc._universal = universal;
  doc.querySelectorAll = () => [];
  return doc;
}

function runScript(relPath, hostUrl = "https://chatgpt.com/") {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const doc = makeStubDocument();
  const storage = new Map();
  const listeners = {};
  const u = new URL(hostUrl);
  const xhrProto = function XMLHttpRequest() {
    this.open = () => {};
    this.send = () => {};
    this.setRequestHeader = () => {};
    this.addEventListener = () => {};
  };
  const sandbox = {
    console: { log() {}, warn() {}, error() {}, debug() {}, info() {}, group() {}, groupEnd() {} },
    document: doc,
    location: {
      href: u.href,
      origin: u.origin,
      protocol: u.protocol,
      hostname: u.hostname,
      host: u.host,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
      assign() {},
      replace() {},
      reload() {},
    },
    history: { pushState() {}, replaceState() {}, back() {}, forward() {} },
    navigator: { language: "en-US", languages: ["en-US"], userAgent: "Mozilla/5.0", clipboard: { writeText: async () => {} }, sendBeacon: () => true },
    performance: { now: () => Date.now() },
    screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    requestAnimationFrame: () => 0,
    cancelAnimationFrame() {},
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear(),
    },
    sessionStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
      clear() {},
    },
    fetch: async () => ({ ok: false, status: 404, headers: new Map(), clone() { return this; }, json: async () => ({}), text: async () => "" }),
    XMLHttpRequest: xhrProto,
    Headers: class Headers extends Map {},
    Response: class Response { constructor(b = "") { this.body = b; this.ok = true; this.status = 200; } },
    Request: class Request { constructor(url) { this.url = url; } },
    AbortController: class AbortController { constructor() { this.signal = { aborted: false, addEventListener() {}, removeEventListener() {} }; } abort() { this.signal.aborted = true; } },
    MutationObserver: class { observe() {} disconnect() {} takeRecords() { return []; } },
    ResizeObserver: class { observe() {} disconnect() {} unobserve() {} },
    IntersectionObserver: class { observe() {} disconnect() {} unobserve() {} },
    URL,
    URLSearchParams,
    Date, JSON, Object, Array, Set, Map, WeakMap, WeakSet, Promise, RegExp, String, Number, Boolean, Math, Symbol, Proxy, Reflect,
    Error, TypeError, RangeError, SyntaxError, DOMException: class DOMException extends Error {},
    Uint8Array, Int32Array, ArrayBuffer, DataView, TextEncoder, TextDecoder,
    Blob: class Blob { constructor(p = []) { this.parts = p; this.size = 0; } },
    File: class File { constructor(p = [], n = "") { this.parts = p; this.name = n; this.size = 0; } },
    Event: function (t) { this.type = t; },
    CustomEvent: function (t, o) { this.type = t; this.detail = o && o.detail; },
    InputEvent: function (t) { this.type = t; },
    KeyboardEvent: function (t) { this.type = t; },
    MouseEvent: function (t) { this.type = t; },
    Option: function (t, v) { this.text = t; this.value = v; },
    CSS: { escape: (s) => String(s), supports: () => true },
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    Node: class Node { appendChild(c) { return c; } insertBefore(c) { return c; } removeChild(c) { return c; } },
    Element: class Element { appendChild(c) { return c; } insertBefore(c) { return c; } removeChild(c) { return c; } getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; } },
    HTMLElement: class HTMLElement {},
    HTMLInputElement: class HTMLInputElement {},
    HTMLTextAreaElement: class HTMLTextAreaElement {},
    HTMLMediaElement: class HTMLMediaElement {},
    HTMLVideoElement: class HTMLVideoElement {},
    HTMLCanvasElement: class HTMLCanvasElement { toDataURL() { return ""; } toBlob(cb) { if (cb) cb(null); } getContext() { return { getImageData: () => ({ data: new Uint8Array(4) }) }; } },
    CanvasRenderingContext2D: class CanvasRenderingContext2D { getImageData() { return { data: new Uint8Array(4) }; } },
    WebGLRenderingContext: class WebGLRenderingContext { getParameter() { return ""; } getExtension() { return null; } },
    AudioContext: class AudioContext { createAnalyser() { return { getFloatFrequencyData() {} }; } },
    RTCPeerConnection: class RTCPeerConnection {},
    DOMParser: class DOMParser { parseFromString() { return makeStubDocument(); } },
    GM_info: { script: { version: "0.0.0-harness", name: path.basename(relPath) } },
    addEventListener: (t, fn) => { listeners[t] = fn; },
    removeEventListener: () => {},
  };
  sandbox.window = sandbox;
  sandbox.unsafeWindow = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.self = sandbox;
  sandbox.top = sandbox;
  sandbox.parent = sandbox;
  const parseGrants = (text) => {
    const m = text.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
    const set = new Set();
    if (m) for (const g of m[1].matchAll(/\/\/\s*@grant\s+(\S+)/g)) set.add(g[1]);
    return set;
  };
  const grants = parseGrants(src);
  const gmRegistry = {
    GM_registerMenuCommand: () => 0,
    GM_unregisterMenuCommand: () => {},
    GM_getValue: (_k, d) => d,
    GM_setValue: () => {},
    GM_deleteValue: () => {},
    GM_listValues: () => [],
    GM_addValueChangeListener: () => 0,
    GM_removeValueChangeListener: () => {},
    GM_addStyle: () => {},
    GM_addElement: () => makeStubDocument().createElement("div"),
    GM_setClipboard: () => {},
    GM_notification: () => {},
    GM_openInTab: () => ({ close() {} }),
    GM_download: () => {},
    GM_xmlhttpRequest: () => ({ abort() {} }),
  };
  for (const [k, fn] of Object.entries(gmRegistry)) {
    if (grants.has(k)) sandbox[k] = fn;
  }
  const gmDot = { info: sandbox.GM_info };
  const gmDotMap = {
    "GM.getValue": ["getValue", async (_k, d) => d],
    "GM.setValue": ["setValue", async () => {}],
    "GM.deleteValue": ["deleteValue", async () => {}],
    "GM.listValues": ["listValues", async () => []],
    "GM.xmlHttpRequest": ["xmlHttpRequest", () => ({ abort() {} })],
    "GM.registerMenuCommand": ["registerMenuCommand", () => 0],
    "GM.openInTab": ["openInTab", () => ({ close() {} })],
    "GM.setClipboard": ["setClipboard", () => {}],
    "GM.notification": ["notification", () => {}],
  };
  for (const [g, [prop, fn]] of Object.entries(gmDotMap)) {
    if (grants.has(g)) gmDot[prop] = fn;
  }
  if (!grants.has("none")) sandbox.GM = gmDot;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: relPath, timeout: 15000 });
  return { sandbox, doc, listeners, src };
}

let bad = 0;

// 1. Deep contract check on ChatGPT++ (chatgpt.com)
try {
  const { sandbox, listeners, src } = runScript("dist/4ndr0tools - ChatGPT++.user.js", "https://chatgpt.com/");
  const fails = [];
  if (!sandbox.__bulkimgLoaded) fails.push("__bulkimgLoaded guard not armed");
  if (typeof sandbox.fetch !== "function") fails.push("fetch missing after eval");
  if (!listeners.pagehide) fails.push("pagehide timer cleanup listener not registered (R7-1)");
  if (!src.includes("convIdOf(location.pathname) === job.convId")) fails.push("per-turn convId check missing in maybeAnswerPendingClarification (R7-1)");
  if (fails.length) { bad++; console.error(`  ✗ ChatGPT++: ${fails.join("; ")}`); }
  else console.log("  ✓ 4ndr0tools - ChatGPT++.user.js: evaluated clean, __bulkimgLoaded armed, fetch intact, R7-1 pagehide + convId guard verified");
} catch (e) {
  bad++;
  console.error(`  ✗ ChatGPT++: LOAD THREW: ${e.message}`);
}

// 2. Deep contract check on Prompt Master (flow.google.com)
try {
  const { sandbox, src } = runScript("dist/4ndr0tools - Prompt Master.user.js", "https://flow.google.com/");
  const fails = [];
  if (vm.runInContext("typeof __4NDR0_NET_API__", sandbox) !== "object") fails.push("__4NDR0_NET_API__ kernel not present in dist");
  if (!src.includes("pollPendingJobs")) fails.push("Flow++ pollPendingJobs missing (R6-2)");
  if (!src.includes("attachTimer = setInterval(attach, 2000)")) fails.push("Flow++ attachTimer pagehide cleanup missing (R7-1)");
  if (fails.length) { bad++; console.error(`  ✗ Prompt Master: ${fails.join("; ")}`); }
  else console.log("  ✓ 4ndr0tools - Prompt Master.user.js: evaluated clean on flow.google.com, NetHook kernel + R6-2/R7-1 markers verified");
} catch (e) {
  bad++;
  console.error(`  ✗ Prompt Master: LOAD THREW: ${e.message}`);
}

// 3. Suite-wide all-39-script isolated VM load check
const distFiles = fs.readdirSync(DIST).filter((f) => f.endsWith(".user.js")).sort();
let loaded = 0;
for (const f of distFiles) {
  try {
    runScript(path.join("dist", f), "https://example.com/");
    loaded++;
  } catch (e) {
    bad++;
    console.error(`  ✗ ${f}: LOAD THREW: ${e.message}`);
  }
}
console.log(`  ✓ Suite-wide VM load sweep: ${loaded}/${distFiles.length} dist installables evaluated with zero uncaught throws`);

console.log(bad === 0 ? `LOAD HARNESS: PASS (${loaded}/${distFiles.length} scripts)` : `LOAD HARNESS: FAIL (${bad} failure(s))`);
process.exit(bad === 0 ? 0 : 1);
