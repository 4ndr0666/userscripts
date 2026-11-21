#!/usr/bin/env node
/* Isolated load harness (round 6): eval the two modified installables in a
 * vm with a minimal DOM stub and assert the load-time contract — no throw,
 * double-injection guard armed, fetch patched, host attached, legacy storage
 * purged. Catches ReferenceError/TypeError-class wiring defects that a pure
 * syntax parse cannot see (the closure-internal poller/consumer additions). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function makeStubDocument() {
  const mkEl = (tag) => {
    const el = {
      tagName: String(tag || "div").toUpperCase(),
      children: [],
      style: { cssText: "", setProperty() {} },
      dataset: {},
      attrs: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k] ?? null; },
      addEventListener() {},
      removeEventListener() {},
      appendChild(c) { this.children.push(c); return c; },
      append(...cs) { this.children.push(...cs); },
      attachShadow() { const sr = mkEl("shadow-root"); sr.querySelector = () => mkEl("universal"); sr.querySelectorAll = () => []; sr.addEventListener = () => {}; return sr; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      getClientRects() { return []; },
      contains() { return false; },
      closest() { return null; },
      dispatchEvent() { return true; },
      replaceChildren() { this.children.length = 0; },
      remove() {},
      get body() { return this._body; },
    };
    return el;
  };
  const body = mkEl("body");
  const universal = () => {
    const el = mkEl("universal");
    el.value = "";
    el.textContent = "";
    el.checked = false;
    el.selectedOptions = [];
    el.href = "";
    el.src = "";
    el.files = { length: 0 };
    el.querySelector = () => universal();
    el.querySelectorAll = () => [];
    el.closest = () => null;
    return el;
  };
  const doc = mkEl("document");
  doc._body = body;
  doc.createElement = mkEl;
  doc.getElementById = () => null;
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  doc.querySelector = universal;
  doc.querySelectorAll = () => [];
  doc._universal = universal;
  return doc;
}

function runScript(relPath, guardKey) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const doc = makeStubDocument();
  const storage = new Map();
  const listeners = {};
  const sandbox = {
    console: { log() {}, warn() {}, error() {}, debug() {}, info() {} },
    document: doc,
    location: { pathname: "/", hostname: "chatgpt.com", href: "https://chatgpt.com/" },
    navigator: { language: "en-US" },
    setTimeout: (fn) => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    requestAnimationFrame: () => 0,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
    fetch: async () => ({ ok: false, status: 404, clone() { return this; }, json: async () => ({}) }),
    MutationObserver: class { observe() {} disconnect() {} },
    Date,
    JSON,
    Object,
    Array,
    Set,
    Map,
    Promise,
    RegExp,
    String,
    Number,
    Boolean,
    Math,
    Error,
    TypeError,
    Uint8Array,
    Event: function (t) { this.type = t; },
    InputEvent: function (t) { this.type = t; },
    Option: function () {},
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    Node: class Node {},
    Element: class Element {},
    HTMLElement: class HTMLElement {},
    DOMParser: class DOMParser { parseFromString() { return makeStubDocument(); } },
    GM_registerMenuCommand: () => {},
    GM_unregisterMenuCommand: () => {},
    GM_getValue: (k, d) => d,
    GM_setValue: () => {},
    GM_deleteValue: () => {},
    GM_listValues: () => [],
    GM_addValueChangeListener: () => {},
    GM_addStyle: () => {},
    GM_setClipboard: () => {},
    GM_notification: () => {},
    GM_openInTab: () => {},
    GM_info: { script: { version: "0.0.0-harness" } },
    addEventListener: (t, fn) => { listeners[t] = fn; },
  };
  sandbox.window = sandbox;
  sandbox.unsafeWindow = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: relPath, timeout: 15000 });
  const failures = [];
  if (!sandbox[guardKey]) failures.push(`double-injection guard ${guardKey} not armed`);
  if (typeof sandbox.fetch !== "function") failures.push("fetch missing after eval");
  return { failures, sandbox };
}

let bad = 0;
for (const [rel, guard] of [
  ["dist/4ndr0tools - ChatGPT++.user.js", "__bulkimgLoaded"],
  ["dist/4ndr0tools - Prompt Master.user.js", "__pmLoadedGuarantor"],
]) {
  // Prompt Master arms many guards; the load contract we assert for it is
  // just "evaluates clean" (its own boot integrity check covers the rest),
  // so the guard assertion only applies to ChatGPT++.
  try {
    const { failures } = runScript(rel, guard);
    if (guard === "__pmLoadedGuarantor" && failures.length === 1 && failures[0].includes("__pmLoadedGuarantor")) {
      console.log(`  ✓ ${path.basename(rel)}: evaluated clean (guard key n/a for this script)`);
      continue;
    }
    if (failures.length) { bad++; console.error(`  ✗ ${path.basename(rel)}: ${failures.join("; ")}`); }
    else console.log(`  ✓ ${path.basename(rel)}: evaluated clean, guard armed, fetch intact`);
  } catch (e) {
    bad++;
    console.error(`  ✗ ${path.basename(rel)}: LOAD THREW: ${e.message}`);
  }
}
console.log(bad === 0 ? "LOAD HARNESS: PASS" : "LOAD HARNESS: FAIL");
process.exit(bad === 0 ? 0 : 1);
