// ==UserScript==
// @name         4ndr0tools - Sora Toolkit
// @namespace    https://github.com/4ndr0666/userscripts
// @description  Auto-refreshes stuck Sora generation jobs after a configurable timeout to help you get your assets faster.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Sora%20Toolkit.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Sora%20Toolkit.user.js
// @version      4.0.0
// @author       4ndr0666
// @license      GPL-3.0-only
// @match        *://sora.com/*
// @match        *://sora.chatgpt.com/*
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

/* global GM_registerMenuCommand, GM_getValue, GM_setValue */
(function () {
  "use strict";

  /*************************************************************************
   * 1 · Configuration (persistent, JSON-editable)                          *
   *************************************************************************/
  const DEFAULT_CFG = Object.freeze({
    showToast: true,
    autoRefresh: {
      enabled: true,
      timeout: 20_000, // ms to wait before reloading a stuck job
    },
  });

  // A simple deep merge utility to robustly combine default and saved settings.
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }
    return { ...target, ...source };
  };

  let CFG = deepMerge(DEFAULT_CFG, GM_getValue("cfg") || {});

  const saveCfg = (newCfg) => {
    try {
      const parsed = typeof newCfg === 'string' ? JSON.parse(newCfg) : newCfg;
      CFG = deepMerge(DEFAULT_CFG, parsed);
      GM_setValue("cfg", CFG);
      toast("Settings saved ✓");
    } catch (error) {
      console.error("Sora Toolkit: Failed to parse settings.", error);
      toast("Invalid JSON – settings unchanged.");
    }
  };

  /*************************************************************************
   * 2 · Utilities                                                         *
   *************************************************************************/
  const toast = (msg, duration = 3000) => {
    if (!CFG.showToast) return;
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position:         'fixed',
      bottom:           '14px',
      left:             '50%',
      transform:        'translateX(-50%)',
      background:       '#222',
      color:            '#fff',
      padding:          '8px 12px',
      borderRadius:     '6px',
      font:             '13px/1 sans-serif',
      zIndex:           '10001',
      boxShadow:        '0 2px 6px #000a',
      userSelect:       'none',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
  };

  /*************************************************************************
   * 3 · Auto-refresh “stuck” job                                          *
   *************************************************************************/
  const SPINNER_SEL = '.animate-spin, [role="progressbar"], svg[aria-label="Loading"]';
  const SUBMIT_SEL = 'button[type="submit"], button:has(svg[data-icon="sparkle"]), button:has(svg[aria-label="Generate"]), button:contains("Generate")';
  let jobTimeoutId = null;

  // This approach uses a single timeout and a MutationObserver to cancel it if the job finishes.
  const monitorJob = () => {
    clearTimeout(jobTimeoutId); // Clear any previous timer.

    const spinner = document.querySelector(SPINNER_SEL);
    if (!spinner) return; // No job is running.

    // Set a deadline to reload the page.
    jobTimeoutId = setTimeout(() => {
      toast("Job appears stuck — refreshing…");
      jobObserver.disconnect(); // Clean up observer before reload.
      location.reload();
    }, CFG.autoRefresh.timeout);

    // Watch for the spinner to be removed from the DOM.
    const jobObserver = new MutationObserver(() => {
      if (!document.querySelector(SPINNER_SEL)) {
        clearTimeout(jobTimeoutId); // Job finished, cancel the refresh.
        jobObserver.disconnect(); // Stop observing.
      }
    });

    // Observe the document for changes.
    jobObserver.observe(document.body, { childList: true, subtree: true });
  };

  const attachJobListener = () => {
    if (!CFG.autoRefresh.enabled) return;
    // Use event capturing to reliably catch clicks on submit buttons.
    document.addEventListener("click", (event) => {
      if (event.target.closest(SUBMIT_SEL)) {
        // Wait a moment for the spinner to appear before starting the monitor.
        setTimeout(monitorJob, 500);
      }
    }, true);
  };

  /*************************************************************************
   * 4 · Menu Commands                                                    *
   *************************************************************************/
  const openSettings = () => {
    const json = prompt("Edit config as JSON (cancel to abort):", JSON.stringify(CFG, null, 2));
    if (json === null) return; // User cancelled.
    saveCfg(json);
  };

  const registerMenuCommands = () => {
    GM_registerMenuCommand("⚙️ Settings (JSON)", openSettings);
  };

  /*************************************************************************
   * 5 · Init                                                              *
   *************************************************************************/
  function main() {
    attachJobListener();
    registerMenuCommands();
    toast("Sora Toolkit 4.0.0 loaded ✓");
  }

  // Defer execution until the page is fully idle.
  if (document.readyState === 'complete') {
    main();
  } else {
    window.addEventListener('load', main);
  }
})();
