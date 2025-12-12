/* global JSZip, tippy, sha256, saveAs, GM_xmlhttpRequest, GM_download, GM_setValue, GM_getValue */
// ==UserScript==
// @name         4ndr0tools - LinkMasterΨ2
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.1.0
// @description  A fully-integrated HUD for scraping, previewing, checking, and downloading links from any website. Features dual modes for targeted forum scraping or aggressive general-purpose link discovery, a standalone link checker with paste support, and persistent user settings.
// @author       4ndr0666, SkyCloudDev, and The Akashic Collective
// @license      MIT, WTFPL
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match        *://*.*/*
// @require      https://unpkg.com/@popperjs/core@2
// @require      https://unpkg.com/tippy.js@6
// @require      https://unpkg.com/file-saver@2.0.4/dist/FileSaver.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js
// @require      https://raw.githubusercontent.com/geraintluff/sha256/gh-pages/sha256.min.js
// @require      https://cdn.jsdelivr.net/npm/m3u8-parser@4.7.1/dist/m3u8-parser.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_log
// @grant        GM_openInTab
// @grant        unsafeWindow
// ==/UserScript==

/* FINAL INTEGRATION — PRODUCTION READY */

// ========== GLOBALS & UTILITY ==========

const http = window.GM_xmlhttpRequest;
window.isFF = typeof InstallTrigger !== "undefined";
window.logs = [];
const globalConfig = {}; // Populated by loadSettings()

const settings = {
  naming: {
    allowEmojis: false,
    invalidCharSubstitute: "-"
  },
  extensions: {
    documents: ["txt", "doc", "docx", "pdf"],
    compressed: ["zip", "rar", "7z", "tar", "bz2", "gzip"],
    image: ["jpg", "jpeg", "png", "gif", "webp", "jpe", "svg", "tif", "tiff", "jif"],
    video: ["mp4", "mov", "avi", "wmv", "mkv", "flv", "webm", "mpeg", "mpg", "m4v"]
  }
};
const log = {
  separator: (postId) => window.logs.push({ postId, message: "-".repeat(175) }),
  write: (postId, str, type, toConsole = true) => {
    const date = new Date();
    const message = `[${date.toDateString()} ${date.toLocaleTimeString()}] [${type}] ${str}`
      .replace(/(::.*?::)/gi, (match, g) => g.toUpperCase())
      .replace(/::/g, "");
    window.logs.push({ postId, message });
    if (toConsole) {
      if (type.toLowerCase() === "info") {
        console.info(message);
      } else if (type.toLowerCase() === "warn") {
        console.warn(message);
      } else {
        console.error(message);
      }
    }
  },
  info: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "INFO"),
  warn: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "WARNING"),
  error: (postId, str, scope) => log.write(postId, `[${scope}] ${str}`, "ERROR"),
  post: {
    info: (postId, str, postNumber) => log.info(postId, str, `POST #${postNumber}`),
    error: (postId, str, postNumber) => log.error(postId, str, `POST #${postNumber}`)
  },
  host: {
    info: (postId, str, host) => log.info(postId, str, host),
    error: (postId, str, host) => log.error(postId, str, host)
  }
};

// ========== HELPERS ==========

const h = {
  isArray: (v) => Array.isArray(v),
  isObject: (v) => typeof v === "object",
  isNullOrUndef: (v) => v === null || v === undefined || typeof v === "undefined",
  basename: (path) =>
    path
      .replace(/(\s+)?$/, "")
      .split("/")
      .reverse()[0],
  fnNoExt: (path) => path.trim().split(".").reverse().slice(1).reverse().join("."),
  ext: (path) => {
    if (!path || path.indexOf(".") < 0) return null;
    const parts = path.split(".").reverse()[0].split("?")[0];
    return parts.toLowerCase();
  },
  show: (element) => (element.style.display = "block"),
  hide: (element) => (element.style.display = "none"),
  promise: (executor) => new Promise(executor),
  delayedResolve: async (ms) => await h.promise((resolve) => setTimeout(resolve, ms)),
  stripTag: (tag, content) => content.replace(new RegExp(`<${tag}.*?</${tag}>`, "igs"), ""),
  stripTags: (tags, content) => tags.reduce((stripped, tag) => h.stripTag(tag, stripped), content),
  limit: (string, maxLength = 20) => (string.length > maxLength ? `${string.substring(0, maxLength - 1)}...` : string),
  element: (selector, container = document) => container.querySelector(selector),
  elements: (selector, container = document) => container.querySelectorAll(selector),
  contains: (needle, haystack, ignoreCase = true) =>
    (ignoreCase ? haystack.toLowerCase().indexOf(needle.toLowerCase()) : haystack.indexOf(needle)) > -1,
  ucFirst: (str) => (!str ? str : `${str[0].toUpperCase()}${str.substring(1)}`),
  unique: (items, cb) => {
    if (cb) {
      return items.reduce((acc, item) => (!acc.find((i) => i[cb] === item[cb]) ? acc.concat(item) : acc), []);
    }
    return items.reduce((acc, item) => (acc.indexOf(item) < 0 ? acc.concat(item) : acc), []);
  },
  generateFilename: (url, responseHeaders = "") => {
    let basename;
    let dispositionMatch;

    dispositionMatch = responseHeaders.match(/(?<=filename=")([^"]+)|(?<=filename=)([^;]+)/i);
    if (dispositionMatch) {
      return decodeURI(dispositionMatch[1] || dispositionMatch[2]);
    }

    if (url.includes("pixeldrain.com")) {
      basename = h.basename(url.split("?")[0]);
    } else if (url.includes("https://simpcity.su/attachments/")) {
      basename = h.basename(url).replace(/(.*)-(.{3,4})\.\d*$/i, "$1.$2");
    } else if (url.includes("kemono.su")) {
      basename = new URL(url).searchParams.get("f") || h.basename(url);
    } else if (url.includes("cyberdrop")) {
      basename = decodeURI(h.basename(url));
      const extMatch = basename.match(/\.\w{3,6}$/);
      if (extMatch) {
        basename = basename.replace(extMatch[0], "").replace(/(\.\w{3,6}-\w{8}$)|(-\w{8}$)/, "") + extMatch[0];
      }
    } else {
      basename = h.basename(url).replace(/\?.*/, "").replace(/#.*/, "");
    }
    return decodeURI(basename);
  },
  prettyBytes: (number) => {
    const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    if (!Number.isFinite(number)) return "N/A";
    if (number === 0) return "0 B";
    const isNegative = number < 0;
    if (isNegative) number = -number;
    const exponent = Math.min(Math.floor(Math.log10(number) / 3), BYTE_UNITS.length - 1);
    const numberString = Number((number / 1000 ** exponent).toPrecision(3));
    return `${isNegative ? "-" : ""}${numberString} ${BYTE_UNITS[exponent]}`;
  },
  ui: {
    setText: (element, text) => {
      element.textContent = text;
    },
    setElProps: (element, props) => {
      for (const prop in props) {
        element.style[prop] = props[prop];
      }
    }
  },
  http: {
    gm_promise: (args) => new Promise((resolve, reject) => {
      GM_xmlhttpRequest({ ...args, onload: resolve, onerror: reject, ontimeout: reject });
    }),
    base: (method, url, callbacks = {}, headers = {}, data = {}, responseType = "document") => h.promise((resolve, reject) => {
      let responseHeaders = null;
      const request = http({
        url,
        method,
        responseType,
        data,
        headers: { Referer: url, ...headers },
        onreadystatechange: (response) => {
          if (response.readyState === 2) {
            responseHeaders = response.responseHeaders;
            if (callbacks.onResponseHeadersReceieved) {
              callbacks.onResponseHeadersReceieved({ request, response, status: response.status, responseHeaders });
              request.abort();
              resolve({ request, response, status: response.status, responseHeaders });
            }
          }
          if (callbacks.onStateChange) callbacks.onStateChange({ request, response });
        },
        onprogress: (response) => {
          if (callbacks.onProgress) callbacks.onProgress({ request, response });
        },
        onload: (response) => {
          resolve({ source: response.responseText, request, status: response.status, dom: response.response, responseHeaders });
        },
        onerror: (error) => {
          if (callbacks.onError) callbacks.onError(error);
          reject(error);
        }
      });
    }),
    get: (url, callbacks = {}, headers = {}, responseType = "document") => h.http.base("GET", url, callbacks, headers, null, responseType),
    post: (url, data = {}, callbacks = {}, headers = {}) => h.http.base("POST", url, callbacks, headers, data)
  },

  re: {
    stripFlags: (pattern) => {
      if (!h.contains("/", pattern)) return pattern;
      const s = pattern.split("").reverse().join("");
      const index = s.indexOf("/");
      return s.substring(index).split("").reverse().join("");
    },
    toString: (pattern) => {
      let stringified = h.re.stripFlags(pattern.toString());
      if (stringified.startsWith("/")) stringified = stringified.substring(1);
      if (stringified.endsWith("/")) stringified = stringified.slice(0, -1);
      return stringified;
    },
    toRegExp: (pattern, flags) => new RegExp(pattern, flags),
    matchAll: (pattern, subject) => {
      const matches = [];
      let m;
      while ((m = pattern.exec(subject)) !== null) {
        if (m.index === pattern.lastIndex) pattern.lastIndex++;
        matches.push(m[0]);
      }
      return matches;
    }
  }
};

Array.prototype.unique = function (cb) {
  return h.unique(this, cb);
};

const parsers = {
  thread: {
    parseTitle: () => {
      const emojisPattern = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
      let titleElement = h.element(".p-title-value") || h.element("title");
      if (!titleElement) return "Untitled";
      let parsed = h.stripTags(["a", "span"], titleElement.innerHTML).replace(/\n/g, "");
      return !settings.naming.allowEmojis
        ? parsed.replace(emojisPattern, settings.naming.invalidCharSubstitute).trim()
        : parsed.trim();
    },
    parsePost: (post) => {
      const messageContent = post.parentNode.parentNode.querySelector(".message-content > .message-userContent");
      if (!messageContent) return null;

      const footer = post.parentNode.parentNode.querySelector("footer");
      const messageContentClone = messageContent.cloneNode(true);

      const postIdAnchor = post.querySelector("li:last-of-type > a");
      if (!postIdAnchor) return null;

      const href = postIdAnchor.getAttribute("href");
      if (!href) return null;

      const postIdMatch = /(?<=post-).*/i.exec(href);
      if (!postIdMatch || !postIdMatch[0]) return null;
      const postId = postIdMatch[0];

      const postNumber = postIdAnchor.textContent ? postIdAnchor.textContent.replace("#", "").trim() : null;
      if (!postNumber) return null;

      [".contentRow-figure", ".js-unfurl-favicon", "blockquote", ".button-text > span"]
        .flatMap((i) => [...messageContentClone.querySelectorAll(i)])
        .forEach((i) => {
          if (i.tagName === "BLOCKQUOTE" && i.querySelector(".bbCodeBlock-title")) i.remove();
          else if (i.tagName !== "BLOCKQUOTE") i.remove();
        });
      [...messageContentClone.querySelectorAll('.contentRow-header > a[href^="https://simpcity.su/threads"]')]
        .map((a) => a.parentNode.parentNode.parentNode.parentNode).forEach((i) => i.remove());

      const spoilers = [...messageContentClone.querySelectorAll(".bbCodeBlock--spoiler > .bbCodeBlock-content"), ...messageContentClone.querySelectorAll(".bbCodeInlineSpoiler")]
        .filter((s) => !s.querySelector(".bbCodeBlock--unfurl"))
        .map((s) => s.innerText)
        .concat(h.re.matchAll(/(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?/,;.]+/gis, messageContentClone.innerText).map((s) => s.trim()))
        .map((s) => s.trim().replace(/^:|^\bp:\b|^\bpw:\b|^\bkey:\b/i, "").trim())
        .filter(Boolean).unique();

      const postContent = messageContentClone.innerHTML;
      const postTextContent = messageContentClone.innerText;
      const matches = /(?<=\/page-)\d+/is.exec(document.location.pathname);
      const pageNumber = matches && matches.length ? Number(matches[0]) : 1;
      return {
        post,
        postId,
        postNumber,
        pageNumber,
        spoilers,
        footer,
        content: postContent,
        textContent: postTextContent,
        contentContainer: messageContent
      };
    }
  },
  hosts: {
    parseHosts: (postContent) => {
      let parsed = [];
      for (const host of hosts) {
        if (host.length < 2) continue;
        const signature = host[0].split(":");
        const matchers = host[1];
        if (!h.isArray(matchers) || !matchers.length) continue;
        const name = signature[0];
        let category = signature.length > 1 ? signature[1] : "misc";
        let singleMatcherPattern = matchers[0];
        let albumMatcherPattern = matchers.length > 1 ? matchers[1] : null;
        const execMatcher = (matcher) => {
          let pattern = matcher.toString().replace(/~an@/g, "a-zA-Z0-9");
          const stripQueryString = h.contains("<no_qs>", pattern.toString());
          const stripTrailingSlash = !h.contains("<keep_ts>", pattern.toString());
          pattern = pattern.replace("<no_qs>", "").replace("<keep_ts>", "");
          if (h.contains("!!", pattern)) {
            pattern = pattern.replace("!!", "");
            pattern = h.re.toRegExp(h.re.toString(pattern), "igs");
          } else {
            const pat = `(?<=data-url="|src="|href=")${h.re.toString(pattern)}.*?(?=")|https?://(www.)?${h.re.toString(
                            pattern
                        )}.*?(?=("|<|$|]|'))`;
            pattern = h.re.toRegExp(pat, "igs");
          }
          let matches = h.re.matchAll(pattern, postContent).unique();
          matches = matches.map((url) => {
            if (stripQueryString && h.contains("?", url)) url = url.substring(0, url.indexOf("?"));
            if (stripTrailingSlash && url.endsWith("/")) url = url.slice(0, -1);
            return url.trim();
          });
          return h.unique(matches);
        };
        const categories = category.split(",");
        if (singleMatcherPattern) {
          let singleCategory = [categories[0]].map((c) => {
            if (c === "image" || c === "video") return `${h.ucFirst(c)}s`;
            if (c.trim() !== "") return h.ucFirst(c);
            return "Links";
          })[0];
          parsed.push({
            name,
            type: "single",
            category: singleCategory,
            resources: execMatcher(singleMatcherPattern)
          });
        }
        if (albumMatcherPattern) {
          let albumCategory = categories.length > 1 ? categories[1] : categories[0];
          albumCategory = `${h.ucFirst(albumCategory)} Albums`;
          parsed.push({
            name,
            type: "album",
            category: albumCategory,
            resources: execMatcher(albumMatcherPattern)
          });
        }
      }
      return parsed
        .map((p) => ({ ...p, enabled: true, id: Math.round(Math.random() * Number.MAX_SAFE_INTEGER) }))
        .filter((p) => p.resources.length);
    }
  }
};

const styles = {
  tippy: {
    theme:
      ".tippy-box[data-theme~=transparent]{background-color:transparent}.tippy-box[data-theme~=transparent]>.tippy-arrow{width:14px;height:14px}.tippy-box[data-theme~=transparent][data-placement^=top]>.tippy-arrow:before{border-width:7px 7px 0;border-top-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=bottom]>.tippy-arrow:before{border-width:0 7px 7px;border-bottom-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=left]>.tippy-arrow:before{border-width:7px 0 7px 7px;border-left-color:#3f3f3f}.tippy-box[data-theme~=transparent][data-placement^=right]>.tippy-arrow:before{border-width:7px 7px 7px 0;border-right-color:#3f3f3f}.tippy-box[data-theme~=transparent]>.tippy-backdrop{background-color:transparent;}.tippy-box[data-theme~=transparent]>.tippy-svg-arrow{fill:gainsboro}"
  }
};

const ui = {
  getTooltipBackgroundColor: () => {
    const theme = document.body.innerHTML.indexOf("__&s=11") > -1 ? "purple" : "classic";
    return theme === "purple" ? "#30204f" : "#2a2929";
  },
  tooltip: (target, content, options = {}) => tippy(target, { arrow: true, theme: "transparent", allowHTML: true, content: content, appendTo: () => document.body, placement: "left", interactive: true, ...options }),
  pBars: {
    base: (color, height = "3px", width = "0%") => {
      const pb = document.createElement("div");
      pb.style.cssText = `height:${height}; background:${color}; width:${width}; transition: width 200ms;`;
      return pb;
    },
    createFileProgressBar: (color = "#46658b") => {
      const pb = ui.pBars.base(color);
      pb.style.marginBottom = "1px";
      return pb;
    },
    createTotalProgressBar: (color = "#545454") => {
      const pb = ui.pBars.base(color);
      pb.style.marginBottom = "10px";
      return pb;
    }
  },
  labels: {
    status: {
      createStatusLabel: (initialText = "") => {
        const container = document.createElement("div");
        container.style.cssText = "color: #959595; font-size: 12px; margin-bottom: 3px;";
        const span = document.createElement("span");
        if (initialText) span.textContent = initialText;
        container.appendChild(span);
        return { el: span, container };
      }
    }
  },
  forms: {
    createCheckbox: (id, label, checked) => `<div class="menu-row" style="margin-top:-5px;"><label class="iconic" style="user-select:none"><input type="checkbox" ${checked ? 'checked="checked"' : ""} id="${id}"/><i aria-hidden="true"></i><span class="iconic-label" style="font-weight:bold;margin-left:-7px"><span id="${id}-label">${label}</span></span></label></div>`,
    config: {
      post: {
        createForm: (postId, backgroundColor, innerHTML) => `<form id="download-config-form-${postId}" class="menu-content" style="user-select:none;padding:5px 10px;background:${backgroundColor};width:300px;min-width:300px;">${innerHTML}</form>`,
        createFilenameInput: (currentValue, postId, backgroundColor, placeholder) => `<div class="menu-row"><div style="font-weight:bold;margin-top:5px;margin-bottom:8px;color:dodgerblue;">File / Archive Name</div><input id="filename-input-${postId}" type="text" style="background:${backgroundColor};" class="archive-name input" autocomplete="off" name="keywords" placeholder="${placeholder}" value="${currentValue}"/></div>`,
        createZippedCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-zipped`, "Zipped", checked),
        createFlattenCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-flatten`, "Flatten", checked),
        createSkipDownloadCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-download`, "Skip Download", checked),
        createVerifyBunkrLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-verify-bunkr-links`, "Verify Bunkr Links", checked),
        createGenerateLinksCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-links`, "Generate Links", checked),
        createGenerateLogCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-generate-log`, "Generate Log", checked),
        createSkipDuplicatesCheckbox: (postId, checked) => ui.forms.createCheckbox(`settings-${postId}-skip-duplicates`, "Skip Duplicates", checked),
        createFilterLabel: (hosts, getTotalDownloadableResourcesCB) => `<div style="font-weight:bold;margin:5px 0 8px 8px;color:dodgerblue;">Filter <span id="filtered-count-${hosts[0] ? hosts[0].id : ""}">${getTotalDownloadableResourcesCB(hosts)}</span></div>`,
        createToggleAllCheckbox: (postId) => ui.forms.createCheckbox(`settings-toggle-all-hosts-${postId}`, "Toggle All Hosts", true),
        createHostCheckbox: (postId, host) => ui.forms.createCheckbox(`downloader-host-${host.id}-${postId}`, `${host.name} ${host.category} (${host.resources.length})`, host.enabled),
        createHostCheckboxes: (postId, filterLabel, hostsHtml, createToggleAll) => `<div>${filterLabel}${createToggleAll ? ui.forms.config.post.createToggleAllCheckbox(postId) : ""}${hostsHtml}</div>`,
        createPostConfigForm: (
          parsedPost, parsedHosts, defaultFilename, settings, onSubmitFormCB, totalDownloadableResourcesForPostCB, btnDownloadPost
        ) => {
          const { postId } = parsedPost;
          const color = ui.getTooltipBackgroundColor();
          let hostsHtml = "<div>";
          parsedHosts.forEach(host => hostsHtml += ui.forms.config.post.createHostCheckbox(postId, host));
          hostsHtml += "</div>";
          const filterLabel = ui.forms.config.post.createFilterLabel(parsedHosts, totalDownloadableResourcesForPostCB);
          const settingsHeading = `<div class="menu-row"><div style="font-weight:bold;margin:3px 0 4px;color:dodgerblue;">Settings</div></div>`;

          let formHtml = [
            window.isFF ? ui.forms.config.post.createFilenameInput(settings.output.find(o => o.postId === postId)?.value || "", postId, color, defaultFilename) : null,
            settingsHeading,
            !window.isFF ? ui.forms.config.post.createZippedCheckbox(postId, settings.zipped) : null,
            ui.forms.config.post.createFlattenCheckbox(postId, settings.flatten),
            ui.forms.config.post.createSkipDuplicatesCheckbox(postId, settings.skipDuplicates),
            ui.forms.config.post.createGenerateLinksCheckbox(postId, settings.generateLinks),
            ui.forms.config.post.createGenerateLogCheckbox(postId, settings.generateLog),
            ui.forms.config.post.createSkipDownloadCheckbox(postId, settings.skipDownload),
            ui.forms.config.post.createVerifyBunkrLinksCheckbox(postId, settings.verifyBunkrLinks),
            ui.forms.config.post.createHostCheckboxes(postId, filterLabel, hostsHtml, parsedHosts.length > 1),
          ].filter(Boolean);

          const configForm = ui.forms.config.post.createForm(postId, color, formHtml.join(""));
          ui.tooltip(btnDownloadPost, configForm, {
            onShown: (instance) => {
              const inputEl = h.element(`#filename-input-${postId}`);
              if (inputEl) inputEl.oninput = e => {
                let o = settings.output.find(o => o.postId === postId);
                if (o) o.value = e.target.value;
                else settings.output.push({ postId, value: e.target.value });
              };

              const updateCheckbox = (id, key) => {
                const el = h.element(id);
                if (el) el.onchange = e => {
                  settings[key] = e.target.checked;
                };
              };
              updateCheckbox(`#settings-${postId}-generate-links`, "generateLinks");
              updateCheckbox(`#settings-${postId}-generate-log`, "generateLog");
              updateCheckbox(`#settings-${postId}-flatten`, "flatten");
              updateCheckbox(`#settings-${postId}-skip-duplicates`, "skipDuplicates");
              updateCheckbox(`#settings-${postId}-verify-bunkr-links`, "verifyBunkrLinks");
              if (!window.isFF) updateCheckbox(`#settings-${postId}-zipped`, "zipped");

              const skipDownloadEl = h.element(`#settings-${postId}-skip-download`);
              if (skipDownloadEl) skipDownloadEl.onchange = e => {
                const checked = e.target.checked;
                settings.skipDownload = checked;
                const dependentElems = ["flatten", "skip-duplicates"];
                dependentElems.forEach(key => {
                  const el = h.element(`#settings-${postId}-${key}`);
                  if (el) {
                    el.checked = false;
                    el.disabled = checked;
                  }
                });
                const genLinks = h.element(`#settings-${postId}-generate-links`);
                if (genLinks) {
                  genLinks.checked = true;
                  genLinks.disabled = checked;
                }
              };

              const formEl = h.element(`#download-config-form-${postId}`);
              if (formEl) formEl.onsubmit = e => {
                e.preventDefault();
                onSubmitFormCB({ tippyInstance: instance });
              };

              if (parsedHosts.length > 1) {
                const toggleAllHostsEl = h.element(`#settings-toggle-all-hosts-${postId}`);
                if (toggleAllHostsEl) toggleAllHostsEl.onchange = e => {
                  const checked = e.target.checked;
                  parsedHosts.forEach(host => {
                    const cb = h.element(`#downloader-host-${host.id}-${postId}`);
                    if (cb && cb.checked !== checked) cb.click();
                  });
                };
              }

              parsedHosts.forEach(host => {
                const hostCheckbox = h.element(`#downloader-host-${host.id}-${postId}`);
                if (hostCheckbox) hostCheckbox.onchange = e => {
                  host.enabled = e.target.checked;
                  const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                  const countEl = document.querySelector(`#filtered-count-${parsedHosts[0].id}`); // Use querySelector for broader scope if needed
                  if (countEl) countEl.textContent = `(${filteredCount})`;

                  const totalResources = parsedHosts.reduce((acc, h) => acc + h.resources.length, 0);
                  const btnTextSpan = btnDownloadPost.querySelector("span") || btnDownloadPost;
                  btnTextSpan.textContent = `🡳 Configure & Download (${filteredCount}/${totalResources})`;

                  if (parsedHosts.length > 1) {
                    const checkedLength = parsedHosts.filter(h => h.enabled).length;
                    const toggleAll = h.element(`#settings-toggle-all-hosts-${postId}`);
                    if (toggleAll) toggleAll.checked = checkedLength === parsedHosts.length;
                  }
                };
              });
            }
          });
        }
      }
    }
  }
};
// Holds the posts that are processing downloads.
let processing = [];

const hosts = [
  ["Simpcity:Attachments", [/(\/attachments\/|\/data\/video\/)/]],
  ["Coomer:Profiles", [/coomer.su\/[~an@._-]+\/user/]],
  ["Coomer:image", [/(\w+\.)?coomer.su\/(data|thumbnail)/]],
  [
    "JPGX:image",
    [
      /(simp\d+\.)?(selti-delivery\.ru|jpg\d?\.(church|fish|fishing|pet|su|cr))\/(?!(img\/|a\/|album\/))/,
      /jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)[~an@-_.]+<no_qs>/
    ]
  ],
  ["kemono:direct link", [/.{2,6}\.kemono.su\/data\//]],
  ["Postimg:image", [/!!https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})/]],
  [
    "Ibb:image",
    [
      /!!(?<=href=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/,
      /ibb.co\/album\/[~an@_.-]+/
    ]
  ],
  [
    "Ibb:direct link",
    [
      /!!(?<=data-src=")https?:\/\/(www.)?([a-z](\d+)?\.)?ibb\.co\/([a-zA-Z0-9_.-]){7}((?=")|\/)(([a-zA-Z0-9_.-])+(?="))?/
    ]
  ],
  ["Imagevenue:image", [/!!https?:\/\/(www.)?imagevenue\.com\/(.{8})/]],
  ["Imgvb:image", [/imgvb.com\/images\//, /imgvb.com\/album/]],
  ["Imgbox:image", [/(thumbs|images)(\d+)?.imgbox.com\//, /imgbox.com\/g\//]],
  ["Onlyfans:image", [/public.onlyfans.com\/files/]],
  ["Reddit:image", [/(\w+)?.redd.it/]],
  ["Pomf2:File", [/pomf2.lain.la/]],
  ["Nitter:image", [/nitter\.(.{1,20})\/pic/]],
  ["Twitter:image", [/([~an@.]+)?twimg.com\//]],
  ["Pixhost:image", [/(t|img)(\d+)?\.pixhost.to\//, /pixhost.to\/gallery\//]],
  ["Imagebam:image", [/imagebam.com\/(view|gallery)/]],
  ["Imagebam:full embed", [/images\d.imagebam.com/]],
  ["Saint:video", [/(saint2.(su|pk|cr)\/embed\/|([~an@]+\.)?saint2.(su|pk|cr)\/videos)/]],
  ["Redgifs:video", [/!!redgifs.com(\/|\\\/)ifr.*?(?="|&quot;)/]],
  [
    "Bunkr:",
    [
      /!!(?<=href=")https:\/\/((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/)).*?(?=")|(?<=(href=")|(src="))https:\/\/((i|cdn|i-pizza|big-taco-1img)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)(?!(\/a\/))\/(v\/)?.*?(?=")/
    ]
  ],
  [
    "Bunkr:Albums",
    [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//]
  ],
  ["Give.xxx:Profiles", [/give.xxx\/[~an@_-]+/]],
  ["Pixeldrain:", [/(focus\.)?pixeldrain.com\/[lu]\//]],
  ["Gofile:", [/gofile.io\/d/]],
  ["Box.com:", [/m\.box\.com\//]],
  ["Yandex:", [/(disk\.)?yandex\.[a-z]+/]],
  ["Cyberfile:", [/!!https:\/\/cyberfile.(su|me)\/\w+(\/)?(?=")/, /cyberfile.(su|me)\/folder\//]],
  ["Cyberdrop:", [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /cyberdrop.(me|to|cc|nl)\/a\//]],
  ["Pornhub:video", [/([~an@]+\.)?pornhub.com\/view_video/]],
  ["Noodlemagazine:video", [/(adult.)?noodlemagazine.com\/watch\//]],
  ["Spankbang:video", [/spankbang.com\/.*?\/video/]]
];

const resolvers = [
  [
    [/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i],
    (url) =>
      url.replace(/https?:\/\/nitter\.(.{1,20})\/pic\/(orig\/)?media%2F(.{1,15})/i, "https://pbs.twimg.com/media/$3")
  ],
  [
    [/imagevenue.com/],
    async (url, http) => {
      const { dom } = await http.get(url);
      return dom.querySelector(".col-md-12 > a > img").getAttribute("src");
    }
  ],
  [[/pomf2.lain.la/], (url) => url.replace(/pomf2.lain.la\/f\/(.*)\.(\w{3,4})(\?.*)?/, "pomf2.lain.la/f/$1.$2")],
  [[/coomer.su\/(data|thumbnail)/], (url) => url],
  [
    [/coomer.su/, /:!coomer.su\/(data|thumbnail)/],
    async (url, http) => {
      const host = "https://coomer.su";
      const profileId = url.replace(/\?.*/, "").split("/").reverse()[0];
      let finalURL = url.replace(/\?.*/, "");
      let nextPage = null;
      const posts = [];
      log.host.info(0, `Resolving profile: ${profileId}`, "coomer.su");
      let page = 1;
      do {
        const { dom } = await http.get(finalURL);
        const links = [...dom.querySelectorAll(".card-list__items > article")]
          .map((a) => a.querySelector(".post-card__heading > a"))
          .map((a) => {
            return {
              link: `${host}${a.getAttribute("href")}`,
              id: a.getAttribute("href").split("/").reverse()[0]
            };
          });
        posts.push(...links);
        nextPage = dom.querySelector('a[title="Next page"]');
        if (nextPage) {
          finalURL = `${host}${nextPage.getAttribute("href")}`;
        }
        log.host.info(0, `Resolved page: ${page}`, "coomer.su");
        page++;
      } while (nextPage);
      const resolved = [];
      let index = 1;
      for (const post of posts) {
        const { dom } = await http.get(post.link);
        const filesContainer = dom.querySelector(".post__files");
        if (filesContainer) {
          const images = filesContainer.querySelectorAll(".post__thumbnail > .fileThumb");
          if (images.length) {
            resolved.push(
              ...[...images].map((a) => ({ url: `${host}${a.getAttribute("href")}`, folderName: post.id }))
            );
          }
        }
        const attachments = dom.querySelectorAll(".post__attachments > .post__attachment > .post__attachment-link");
        if (attachments.length) {
          resolved.push(
            ...[...attachments].map((a) => {
              const url = `${host}${a.getAttribute("href")}`;
              let folder = "Images";
              const ext = h.ext(url.replace(/\?.*/, ""));
              if (settings.extensions.video.includes(ext)) {
                folder = "Videos";
              }
              return { url, folderName: `${post.id}/${folder}` };
            })
          );
        }
        log.host.info(0, `Resolved post ${index} / ${posts.length}`, "coomer.su");
        index++;
      }
      return { folderName: profileId, resolved };
    }
  ],
  [
    [/(postimg|pixxxels).cc/],
    async (url, http) => {
      url = url.replace(/https?:\/\/(www.)?i\.?(postimg|pixxxels).cc\/(.{8})(.*)/, "https://postimg.cc/$3");
      const { dom } = await http.get(url);
      return dom.querySelector(".controls > nobr > a").getAttribute("href");
    }
  ],
  [[/kemono.su\/data/], (url) => url],
  [
    [
      /(jpg\d\.(church|fish|fishing|pet|su|cr))|selti-delivery\.ru\//i,
      /:!jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i
    ],
    (url) => url.replace(".th.", ".").replace(".md.", ".")
  ],
  [
    [/jpe?g\d\.(church|fish|fishing|pet|su|cr)(\/a\/|\/album\/)/i],
    async (url, http, spoilers, postId) => {
      url = url.replace(/\?.*/, "");
      let reFetch = false;
      let { source, dom } = await http.get(url, {
        onStateChange: (response) => {
          if (response.readyState === 2 && response.finalUrl !== url) {
            url = response.finalUrl;
            reFetch = true;
          }
        }
      });
      if (reFetch) {
        const { source: src, dom: d } = await http.get(url);
        source = src;
        dom = d;
      }
      if (h.contains("Please enter your password to continue", source)) {
        const authTokenNode = dom.querySelector('input[name="auth_token"]');
        const authToken = !authTokenNode ? null : authTokenNode.getAttribute("value");
        if (!authToken || !spoilers || !spoilers.length) return null;
        const attemptWithPassword = async (password) => {
          const { source, dom } = await http.post(
            url,
            `auth_token=${authToken}&content-password=${password}`,
            {},
            {
              Referer: url,
              Origin: "https://jpg6.su",
              "Content-Type": "application/x-www-form-urlencoded"
            }
          );
          return { source, dom };
        };
        let authenticated = false;
        spoilers = ["ramona"];
        for (const spoiler of spoilers) {
          const { source: src, dom: d } = await attemptWithPassword(spoiler.trim());
          if (!h.contains("Please enter your password to continue", src)) {
            authenticated = true;
            source = src;
            dom = d;
            break;
          }
        }
        if (!authenticated) {
          log.host.error(postId, `::Could not resolve password protected album::: ${url}`, "jpg6.su");
          return null;
        }
      }
      const resolvePageImages = async (dom) => {
        const images = [...dom.querySelectorAll(".list-item-image > a > img")]
          .map((img) => img.getAttribute("src"))
          .map((url) => url.replace(".md.", ".").replace(".th.", "."));
        const nextPage = dom.querySelector('a[data-pagination="next"]');
        if (nextPage && nextPage.hasAttribute("href")) {
          const { dom } = await http.get(nextPage.getAttribute("href"));
          images.push(...(await resolvePageImages(dom)));
        }
        return images;
      };
      const resolved = await resolvePageImages(dom);
      return { dom, source, folderName: dom.querySelector('meta[property="og:title"]').content.trim(), resolved };
    }
  ],
  [
    [/\/\/ibb.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
    async (url, http) => {
      try {
        const { dom } = await http.get(url);
        return dom.querySelector(".header-content-right > a").getAttribute("href");
      } catch {
        return url;
      }
    }
  ],
  [[/i\.ibb\.co\/[a-zA-Z0-9-_.]+/, /:!([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/], (url) => url],
  [
    [/([a-z](\d+)?\.)?ibb.co\/album\/[a-zA-Z0-9_.-]+/],
    async (url, http) => {
      const albumId = url.replace(/\?.*/, "").split("/").reverse()[0];
      const { source, dom } = await http.get(url);
      const imageCount = Number(dom.querySelector('span[data-text="image-count"]').innerText);
      const pageCount = Math.ceil(imageCount / 32);
      const authToken = h.re.matchAll(/(?<=auth_token=").*?(?=")/i, source)[0];
      const fetchPageData = async (albumId, page, seekEnd, authToken) => {
        const seek = seekEnd || "";
        const data = `action=list&list=images&sort=date_desc&page=${page}&from=album&albumid=${albumId}&params_hidden%5Blist%5D=images&params_hidden%5Bfrom%5D=album&params_hidden%5Balbumid%5D=${albumId}&auth_token=${authToken}&seek=${seek}&items_per_page=32`;
        const { source: response } = await http.post(
          "https://ibb.co/json",
          data,
          {},
          { "Content-Type": "application/x-www-form-urlencoded" }
        );
        let parsed;
        try {
          parsed = JSON.parse(response);
          if (parsed && parsed.status_code && parsed.status_code === 200) {
            const html = parsed.html.replace('"', '"');
            return {
              urls: h.re.matchAll(/(?<=data-object=').*?(?=')/gi, html).map((o) => JSON.parse(decodeURIComponent(o)).url),
              parsed
            };
          }
          return { urls: [], parsed };
        } catch {
          return { urls: [], parsed };
        }
      };
      const resolved = [];
      let seekEnd = "";
      for (let i = 1; i <= pageCount; i++) {
        const data = await fetchPageData(albumId, i, seekEnd, authToken);
        seekEnd = data.parsed.seekEnd;
        resolved.push(...data.urls);
      }
      return { dom, source, folderName: dom.querySelector('meta[property="og:title"]').content.trim(), resolved };
    }
  ],
  [
    [/(t|img)(\d+)?\.pixhost.to\//, /:!pixhost.to\/gallery\//],
    (url) => url.replace(/\/t(\d+)\./gi, "img$1.").replace(/thumbs\//i, "images/")
  ],
  [
    [/pixhost.to\/gallery\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      let imageLinksInput = dom ? dom.querySelector(".share > div:nth-child(2) > input") : null;
      if (h.isNullOrUndef(imageLinksInput)) {
        imageLinksInput = dom ? dom.querySelector(".share > input:nth-child(2)") : null;
      }
      const valueAttr = imageLinksInput ? imageLinksInput.getAttribute("value") : "";
      const resolved = h.re
        .matchAll(/(?<=\[img])https:\/\/t\d+.*?(?=\[\/img])/gis, valueAttr)
        .map((url) => url.replace(/t(\d+)\./gi, "img$1.").replace(/thumbs\//i, "images/"));
      let folderName = "";
      if (dom) {
        const h2 = dom.querySelector(".link > h2");
        folderName = h2 && h2.innerText ? h2.innerText.trim() : "";
      }
      return { dom, source, folderName, resolved };
    }
  ],
  [
    [
      /((stream|cdn(\d+)?)\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org).*?\.|((i|cdn)(\d+)?\.)?bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/(v\/)?/i,
      /:!bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//
    ],
    async (url, http) => {
      try {
        const { pathname } = new URL(url);
        const segments = pathname.split("/").filter(Boolean);
        const index = segments.findIndex((s) => ["f", "v", "d"].includes(s));
        const id = index > -1 ? segments.slice(index + 1).join("/") : segments.pop();
        const response = await http.post(
          "https://bunkr.cr/api/vs",
          JSON.stringify({ slug: id }),
          {},
          { "Content-Type": "application/json" }
        );
        const data = JSON.parse(response.source);
        if (!data.encrypted) return data.url;
        const binaryString = atob(data.url);
        const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
        return Array.from(binaryString)
          .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
          .join("");
      } catch (error) {
        console.error(error.message);
        return null;
      }
    }
  ],
  [
    [/bunkrr?r?\.(ac|ax|black|cat|ci|cr|fi|is|media|nu|pk|ph|ps|red|ru|se|si|site|sk|ws|ru|su|org)\/a\//],
    async (url, http) => {
      const { dom, source } = await http.get(url);
      const containers = dom.querySelectorAll(".grid-images > div");
      const files = [];
      for (const f of containers) {
        const a = f.querySelector('a[class="after:absolute after:z-10 after:inset-0"]');
        if (!a) continue;
        const href = a.getAttribute("href");
        if (!href || !href.includes("/f/")) continue;
        const id = href.split("/f/")[1];
        const response = await http.post(
          "https://bunkr.cr/api/vs",
          JSON.stringify({ slug: id }),
          {},
          { "Content-Type": "application/json" }
        );
        const data = JSON.parse(response.source);
        let finalURL;
        if (!data.encrypted) {
          finalURL = data.url;
        } else {
          const binaryString = atob(data.url);
          const keyBytes = new TextEncoder().encode(`SECRET_KEY_${Math.floor(data.timestamp / 3600)}`);
          finalURL = Array.from(binaryString)
            .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ keyBytes[i % keyBytes.length]))
            .join("");
        }
        files.push(finalURL);
      }
      const infoContainer = dom.querySelector("h1");
      const textContent = infoContainer?.outerText || "";
      const parts = textContent.split("\n").map((t) => t.trim()).filter((t) => t !== "");
      const OrigAlbumName = parts.length ? parts[0].trim() : url.split("/").reverse()[0];
      const albumName = OrigAlbumName.replaceAll("/", "-").replace("&amp;", "");
      return { dom, source, folderName: albumName, resolved: files.filter((file) => file) };
    }
  ],
  [
    [/give.xxx\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      const profileId = h.re.matchAll(/(?<=profile-id=")\d+/g, source)[0];
      if (!profileId) return null;
      const resolved = [];
      let username = null,
        firstMediaId = null,
        mediaId = 1,
        iteration = 1;
      while (true) {
        let endpoint = `https://give.xxx/api/web/v1/accounts/${profileId}/statuses?only_media=true`;
        endpoint += iteration === 1 ? "&min_id=1" : `&max_id=${mediaId}`;
        const { source: apiSource } = await http.get(endpoint);
        if (h.contains("_v", apiSource)) {
          const parsed = JSON.parse(apiSource);
          if (!parsed || parsed.length === 0) break;
          if (username === null) username = parsed[0].account.username;
          if (firstMediaId === null) firstMediaId = parsed[0].id;
          else if (firstMediaId === parsed[0].id) break;
          resolved.push(
            ...parsed.flatMap((i) =>
              i.media_attachments.map((a) => a.sizes).map((s) => s.large || s.normal || s.small)
            )
          );
          mediaId = parsed[parsed.length - 1].id;
        } else {
          break;
        }
        iteration++;
      }
      return { dom, source, folderName: username, resolved };
    }
  ],
  [
    [/pixeldrain.com\/[ul]/],
    (url) => {
      let resolved = url.replace("/u/", "/api/file/").replace("/l/", "/api/list/");
      resolved = h.contains("/api/list", resolved) ? `${resolved}/zip` : resolved;
      resolved = h.contains("/api/file", resolved) ? `${resolved}?download` : resolved;
      return resolved;
    }
  ],
  [
    [/([~an@]+\.)?pornhub.com\/view_video/],
    async (url, http, spoilers, postId) => {
      url = url.replace(/([a-zA-Z0-9]+\.)?pornhub/, "pornhub");
      const resolvePH = async (url) => {
        const { dom } = await http.get(
          url,
          {},
          { referer: url, cookie: "age-verified: 1; platform=tv; cookiesBannerSeen=1; hasVisited=1" }
        );
        const script = [...dom.querySelectorAll("script")]
          .map((s) => s.innerText)
          .find((s) => /var\smedia_\d+/gis.test(s));
        if (!script) return null;
        const mediaVars = h.re.matchAll(/var\smedia_\d+=.*?;/gis, script);
        return mediaVars
          .map((m) => {
            const cleaned = m.replace(/\/\*.*?\*\//gis, "").replace(/var\smedia_\d+=/i, "").replace(";", "");
            return cleaned
              .split("+")
              .map((s) => s.trim())
              .map((s) => {
                let value = new RegExp(`var ${s}=".*?"`, "isg").exec(script)[0];
                return value.replace(/.*?"/i, "").replace(/"/i, "");
              })
              .join("");
          })
          .find((u) => u.includes("pornhub.com/video/get_media?s="));
      };
      let parsed = null,
        tries = 0;
      do {
        const infoURL = await resolvePH(url);
        if (!infoURL) {
          log.host.warn(postId, "Could not find media info URL. Retrying...", "Pornhub");
          await h.delayedResolve(1500);
          tries++;
          continue;
        }
        try {
          const { source } = await h.http.get(infoURL, {}, {}, "text");
          const json = JSON.parse(source);
          const fetchedFormats = json.reverse();
          const qualities = ["1080", "720", "480", "320", "240"];
          for (const q of qualities) {
            const f = fetchedFormats.find((f) => f.quality === q);
            if (f && f.videoUrl) {
              parsed = f.videoUrl;
              break;
            }
          }
        } catch (e) {
          log.host.error(postId, `Pornhub resolution error: ${e}. Retrying...`, "Pornhub");
        }
        await h.delayedResolve(1000);
        tries++;
      } while (!parsed && tries < 5);
      return parsed;
    }
  ],
  [
    [/gofile.io\/d/],
    async (url, http, spoilers, postId) => {
      const resolveAlbum = async (url, spoilers) => {
        const contentId = url.split("/").reverse()[0];
        const apiUrl = `https://api.gofile.io/contents/${contentId}?wt=4fd6sg89d7s6`;
        let { source } = await http.get(apiUrl, {}, { Authorization: `Bearer ${globalConfig.goFileToken}` });
        if (h.contains("error-notFound", source)) {
          log.host.error(postId, `::Album not found::: ${url}`, "gofile.io");
          return null;
        }
        if (h.contains("error-notPublic", source)) {
          log.host.error(postId, `::Album not public::: ${url}`, "gofile.io");
          return null;
        }
        let props = JSON.parse(source?.toString());
        if (h.contains("error-passwordRequired", source) && spoilers.length) {
          log.host.info(postId, `::Album requires password. Trying with ${spoilers.length} password(s)::`, "gofile.io");
          for (const spoiler of spoilers) {
            const hash = sha256(spoiler);
            const { source: passSource } = await http.get(`${apiUrl}&password=${hash}`);
            props = JSON.parse(passSource?.toString());
            if (props && props.status === "ok") {
              log.host.info(postId, `::Successfully authenticated with:: ${spoiler}`, "gofile.io");
              break;
            }
          }
        }
        return props;
      };
      const props = await resolveAlbum(url, spoilers);
      let folderName = h.basename(url);
      if (!props || props.status !== "ok") {
        log.host.error(postId, `::Unable to resolve album::: ${url}`, "gofile.io");
        return { dom: null, source: null, folderName, resolved: [] };
      }
      const resolved = [];
      const getChildAlbums = async (props, spoilers) => {
        if (!props || props.status !== "ok" || !props.data || !props.data.children) return [];
        const resolvedChildren = [];
        folderName = props.data.name;
        const files = props.data.children;
        for (const file in files) {
          const obj = files[file];
          if (obj.type === "file") {
            resolvedChildren.push(files[file].link);
          } else {
            const folderProps = await resolveAlbum(obj.code, spoilers);
            resolvedChildren.push(...(await getChildAlbums(folderProps, spoilers)));
          }
        }
        return resolvedChildren;
      };
      resolved.push(...(await getChildAlbums(props, spoilers)));
      if (!resolved.length) log.host.warn(postId, `::Empty album::: ${url}`, "gofile.io");
      return { dom: null, source: null, folderName, resolved };
    }
  ],
  [
    [/cyberfile.(su|me)\//, /:!cyberfile.(su|me)\/folder\//],
    async (url, http, spoilers) => {
      const { source } = await http.get(url);
      const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
      const getFileInfo = async () => {
        const { source } = await http.post(
          "https://cyberfile.me/account/ajax/file_details",
          `u=${u}`,
          {},
          { "Content-Type": "application/x-www-form-urlencoded" }
        );
        return source;
      };
      let response = await getFileInfo();
      let requiredPassword = false,
        unlocked = false;
      if ((h.contains("albumPasswordModel", response) || h.contains("This folder requires a password", response)) && spoilers.length) {
        const html = JSON.parse(response).html;
        const matches = /value="(\d+)"\sid="folderId"|value="(\d+)"\sname="folderId"/is.exec(html);
        const folderId = matches.length ? matches[1] : null;
        if (!folderId) return null;
        requiredPassword = true;
        for (const password of spoilers) {
          const { source: passSource } = await http.post("https://cyberfile.me/ajax/folder_password_process", `submitme=1&folderId=${folderId}&folderPassword=${password}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
          if (h.contains("success", passSource) && JSON.parse(passSource).success === true) {
            unlocked = true;
            break;
          }
        }
      }
      if (requiredPassword && unlocked) response = await getFileInfo();
      return h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, response)[0]?.replace(/\\/gi, "/");
    }
  ],
  [
    [/cyberfile.(su|me)\/folder\//],
    async (url, http, spoilers) => {
      const { source, dom } = await http.get(url);
      const script = [...dom.querySelectorAll("script")].map((s) => s.innerText).find((s) => h.contains('data-toggle="tab"', s));
      const nodeId = h.re.matchAll(/(?<='folder',\s').*?(?=')/gis, script)[0];
      const loadFiles = async () => {
        const { source } = await http.post("https://cyberfile.me/account/ajax/load_files", `pageType=folder&nodeId=${nodeId}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
        return source;
      };
      let response = await loadFiles();
      let requiredPassword = false,
        unlocked = false;
      if ((h.contains("albumPasswordModel", response) || h.contains("This folder requires a password", response)) && spoilers.length) {
        requiredPassword = true;
        for (const password of spoilers) {
          const { source: passSource } = await http.post("https://cyberfile.me/ajax/folder_password_process", `submitme=1&folderId=${nodeId}&folderPassword=${password}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
          if (h.contains("success", passSource) && JSON.parse(passSource).success === true) {
            unlocked = true;
            break;
          }
        }
      }
      if (requiredPassword && !unlocked) return null;
      if (requiredPassword && unlocked) response = await loadFiles();
      const resolved = [];
      let folderName = h.basename(url);
      const props = JSON.parse(response);
      if (props && props.html) {
        folderName = props.page_title || folderName;
        const urls = h.re.matchAll(/(?<=dtfullurl=").*?(?=")/gis, props.html);
        for (const fileUrl of urls) {
          const { source } = await http.get(fileUrl);
          const u = h.re.matchAll(/(?<=showFileInformation\()\d+(?=\))/gis, source)[0];
          const { source: fileDetails } = await http.post("https://cyberfile.me/account/ajax/file_details", `u=${u}`, {}, { "Content-Type": "application/x-www-form-urlencoded" });
          resolved.push(h.re.matchAll(/(?<=openUrl\(').*?(?=')/gi, fileDetails)[0]?.replace(/\\/gi, "/"));
        }
      }
      return { dom, source, folderName, resolved };
    }
  ],
  [[/([~an@]+\.)?saint2.(su|pk|cr)\/videos/], async (url) => url],
  [[/public.onlyfans.com\/files/], async (url) => url],
  [
    [/saint2.(su|pk|cr)\/embed/], async (url, http) => {
      const { dom } = await http.get(url);
      return dom.querySelector("source")?.getAttribute("src");
    }
  ],
  [
    [/redgifs.com(\/|\\\/)ifr/],
    async (url) => {
      const id = url.split("/").reverse()[0];
      url = `https://api.redgifs.com/v2/gifs/${id}`;
      const token = GM_getValue("redgifs_token", null);
      const { source } = await h.http.get(url, {}, { Authorization: `Bearer ${token}` });
      if (h.contains("urls", source)) {
        const urls = JSON.parse(source).gif.urls;
        return urls.hd || urls.sd;
      }
      return null;
    }
  ],
  [
    [/fs-\d+.cyberdrop.(me|to|cc|nl)\/|cyberdrop.me\/(f|e)\//, /:!cyberdrop.(me|to|cc|nl)\/a\//],
    async (url, http) => {
      if (url.includes("fs-")) {
        url = url.replace(/(fs|img)-\d+/i, "").replace(/(to|cc|nl)-\d+/i, "me");
        let { finalUrl } = await http.get(url, {
          onStateChange: (response) => {
            if (response.readyState === 2 && response.finalUrl !== url) url = response.finalUrl;
          }
        });
        url = finalUrl || url;
      }
      url = url.replace("cyberdrop.me/f", "https://cyberdrop.me/api/f").replace("cyberdrop.me/e", "https://cyberdrop.me/api/f");
      try {
        const response = await h.http.gm_promise({ method: "GET", url: url });
        const webData = JSON.parse(response.responseText);
        return webData.url;
      } catch (error) {
        console.error("Failed to resolve cyberdrop link:", error);
        return null;
      }
    }
  ],
  [
    [/cyberdrop.me\/a\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      const files = [...(dom ? dom.querySelectorAll("#file") : [])].map((file) => "https://cyberdrop.me/api" + file.getAttribute("href"));
      const resolveFile = async (fileUrl) => {
        try {
          return await cyberdrop_helper(fileUrl);
        } catch {
          console.error(`Failed to resolve ${fileUrl}, retrying...`);
          await h.delayedResolve(1000);
          return await cyberdrop_helper(fileUrl);
        }
      };
      const resolved = (await Promise.all(files.map(resolveFile))).filter(Boolean);
      return { dom, source, folderName: dom.querySelector("#title").innerText.trim(), resolved };
    }
  ],
  [
    [/noodlemagazine.com\/watch\//],
    async (url, http) => {
      const { dom } = await http.get(url);
      let playerIFrameUrl = dom.querySelector("#iplayer")?.getAttribute("src");
      if (!playerIFrameUrl) return null;
      playerIFrameUrl = playerIFrameUrl.replace("/player/", "https://noodlemagazine.com/playlist/");
      const { source } = await http.get(playerIFrameUrl);
      const props = JSON.parse(source || "[]");
      if (props.sources && props.sources.length) return props.sources[0].file;
      return null;
    }
  ],
  [
    [/spankbang.com\/.*?\/video/],
    async (url, http) => {
      const { source } = await http.get(url);
      let streamData = h.re.matchAll(/(?<=stream_data\s=\s){.*?}.*?(?=;)/gis, source)[0].replace(/'/g, '"');
      streamData = JSON.parse(streamData);
      const qualities = ["4k", "1080p", "720p", "480p", "320p", "240p"];
      for (const quality of qualities) {
        if (streamData[quality] && streamData[quality].length) return streamData[quality][0];
      }
      return null;
    }
  ],
  [
    [/imagebam.com\/(view|gallery)/],
    async (url, http) => {
      const date = new Date();
      date.setTime(date.getTime() + 6 * 60 * 60 * 1000);
      const expires = "; expires=" + date.toUTCString();
      const { source, dom } = await http.get(url, {}, { cookie: "nsfw_inter=1" + expires + "; path=/" });
      if (h.contains("gallery-name", source)) {
        const imageLinksInput = dom.querySelector(".links.gallery > div:nth-child(2) > div > input");
        const rawImageLinks = h.re.matchAll(/(?<=\[URL=).*?(?=])/gis, imageLinksInput.getAttribute("value"));
        const resolved = [];
        for (const link of rawImageLinks) {
          const { dom: linkDom } = await http.get(link);
          resolved.push(linkDom?.querySelector(".main-image")?.getAttribute("src"));
        }
        return { dom, source, folderName: dom?.querySelector("#gallery-name")?.innerText.trim(), resolved };
      } else {
        return dom?.querySelector(".main-image")?.getAttribute("src");
      }
    }
  ],
  [[/images\d.imagebam.com/], (url) => url],
  [[/imgvb.com\/images\//, /:!imgvb.com\/album\//], (url) => url.replace(".th.", ".").replace(".md.", ".")],
  [
    [/imgvb.com\/album\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      const resolved = [...dom.querySelectorAll(".image-container > img")].map((i) => i.getAttribute("src")).map((u) => u.replace(".th.", ".").replace(".md.", "."));
      return { dom, source, folderName: dom?.querySelector('meta[property="og:title"]')?.content.trim(), resolved };
    }
  ],
  [
    [/(\/attachments\/|\/data\/video\/)/], async (url) => url.startsWith("http") ? url : `https://simpcity.su${url}`
  ],
  [
    [/(thumbs|images)(\d+)?.imgbox.com\//, /:!imgbox.com\/g\//], (url) => url.replace(/_t\./gi, "_o.").replace(/thumbs/i, "images")
  ],
  [
    [/imgbox.com\/g\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      let resolved = dom ? [...dom.querySelectorAll("#gallery-view-content > a > img")].map((img) => img.getAttribute("src")).map((u) => u.replace(/(thumbs|t)(\d+)\./gis, "images$2.").replace("_b.", "_o.")) : [];
      let folderName = dom?.querySelector("#gallery-view > h1")?.innerText.trim() || "";
      return { dom, source, folderName, resolved };
    }
  ],
  [
    [/m\.box\.com\//],
    async (url, http) => {
      const { source, dom } = await http.get(url);
      const files = [...dom.querySelectorAll(".files-item-anchor")].map((el) => `https://m.box.com${el.getAttribute("href")}`);
      const resolved = [];
      for (const fileUrl of files) {
        const { source: fileSource, dom: fileDom } = await http.get(fileUrl);
        if (h.contains("image-preview", fileSource)) {
          resolved.push(fileDom.querySelector(".image-preview").getAttribute("src"));
        } else {
          resolved.push(fileDom.querySelector(".mtl > a").getAttribute("href"));
        }
      }
      return { source, dom, folderName: dom.querySelector(".folder-nav-title")?.innerText?.trim(), resolved: resolved.map((u) => `https://m.box.com${u}`) };
    }
  ],
  [
    [/twimg.com\//], (url) => url.replace(/https?:\/\/pbs.twimg\.com\/media\/(.{1,15})(\?format=)?(.*)&amp;name=(.*)/, "https://pbs.twimg.com/media/$1.$3")
  ],
  [
    [/(disk\.)?yandex\.[a-z]+/],
    async (url, http) => {
      const { dom } = await http.get(url);
      const script = dom.querySelector('script[id="store-prefetch"]');
      if (!script) return null;
      const json = JSON.parse(script.innerText);
      let sk, hash = null;
      if (json && json.environment && json.resources) {
        sk = json.environment.sk;
        const resourcesKeys = Object.keys(json.resources);
        hash = json.resources[resourcesKeys[0]]?.hash;
      }
      if (!sk || !hash) return null;
      const data = JSON.stringify({ hash, sk });
      const { source } = await http.post("https://disk.yandex.ru/public/api/download-url", data, {}, { "Content-Type": "text/plain" });
      const response = JSON.parse(source);
      if (response && response.error !== "true" && response.data) return response.data.url;
      return null;
    }
  ],
  [[/(\w+)?.redd.it/], (url) => url.replace(/&amp;/g, "&")]
];

const setProcessing = (isProcessing, postId) => {
  const p = processing.find((p) => p.postId === postId);
  if (p) {
    p.processing = isProcessing;
  } else {
    processing.push({ postId, processing: isProcessing });
  }
};

async function resolvePostLinks(postData, statusLabel) {
  const { parsedPost, parsedHosts, resolvers, getSettingsCB, enabledHostsCB } = postData;
  const { postId, postNumber } = parsedPost;
  const postSettings = getSettingsCB();
  const enabledHosts = enabledHostsCB(parsedHosts);
  const allResolved = [];

  for (const host of enabledHosts.filter(h => h.resources.length)) {
    for (const resource of host.resources) {
      if (statusLabel) h.ui.setText(statusLabel, `Resolving: ${h.limit(resource, 80)}`);
      for (const resolver of resolvers) {
        const [patterns, resolverCB] = resolver;
        let matched = patterns.every(pattern => {
          let strPattern = pattern.toString();
          const shouldMatch = !strPattern.startsWith(":!");
          strPattern = strPattern.replace(":!", "");
          const re = h.re.toRegExp(h.re.toString(strPattern), "is");
          return shouldMatch ? re.test(resource) : !re.test(resource);
        });

        if (matched) {
          try {
            const passwords = [...parsedPost.spoilers, ...parsedPost.spoilers.map(s => s.toLowerCase())].unique();
            const r = await Promise.resolve(resolverCB(resource, h.http, passwords, postId, postSettings));
            if (h.isNullOrUndef(r)) continue;

            const addResolved = (url, folderName) => {
              const item = h.isObject(url) ? { ...url, host, original: resource } : { url, host, original: resource, folderName };
              allResolved.push(item);
              if (statusLabel) log.post.info(postId, `::Resolved::: ${item.url}`, postNumber);
            };

            if (r && h.isArray(r.resolved)) {
              r.resolved.forEach(url => addResolved(url, r.folderName));
            } else {
              addResolved(r, null);
            }
          } catch (err) {
            log.post.error(postId, `::Error resolving ${resource}::: ${err}`, postNumber);
          }
          break;
        }
      }
    }
  }
  return allResolved;
}

const downloadPost = async (postData, statusContainerElement) => {
  const { parsedPost, getSettingsCB, postDownloadCallbacks } = postData;
  const { postId, postNumber } = parsedPost;
  const postSettings = getSettingsCB();

  statusContainerElement.innerHTML = '';
  const { el: statusLabel, container } = ui.labels.status.createStatusLabel();
  const filePB = ui.pBars.createFileProgressBar();
  const totalPB = ui.pBars.createTotalProgressBar();
  statusContainerElement.append(totalPB, filePB, container);

  window.logs = window.logs.filter((l) => l.postId !== postId);
  log.separator(postId);
  log.post.info(postId, "::Preparing download::", postNumber);

  let completed = 0;
  const zip = new JSZip();

  h.ui.setText(statusLabel, "Resolving links...");
  let resolved = await resolvePostLinks(postData, statusLabel);

  if (postSettings.skipDuplicates) {
    resolved = h.unique(resolved, 'url');
  }

  let totalDownloadable = resolved.filter((r) => r.url).length;

  h.ui.setElProps(statusLabel, { color: "#47ba24", fontWeight: "bold" });
  h.ui.setText(statusLabel, `Resolved ${totalDownloadable} unique links. Starting download...`);

  if (totalDownloadable === 0) {
    h.ui.setText(statusLabel, "No downloadable links found after resolution.");
    return;
  }

  setProcessing(true, postId);
  log.separator(postId);
  log.post.info(postId, `::Found ${totalDownloadable} resource(s)::`, postNumber);
  log.separator(postId);

  const threadTitle = parsers.thread.parseTitle();
  let customFilename = postSettings.output.find((o) => o.postId === postId)?.value;
  if (customFilename) {
    customFilename = customFilename.replace(/:title:/g, threadTitle).replace(/:#:/g, postNumber).replace(/:id:/g, postId);
  }

  const isFF = window.isFF;

  if (!postSettings.skipDownload) {
    const resources = resolved.filter((r) => r.url);
    const filenames = []; // To track filenames and avoid duplicates
    const downloadPromises = resources.map(({ url, host, original, folderName }) => new Promise(async (resolve) => {
      const ellipsedUrl = h.limit(url, 60);
      try {
        const response = await h.http.gm_promise({
          method: 'GET',
          url,
          headers: { Referer: original },
          responseType: "blob",
          onprogress: (e) => {
            h.ui.setText(statusLabel, `${completed}/${totalDownloadable} | ${h.prettyBytes(e.loaded)} / ${e.total ? h.prettyBytes(e.total) : '?'} | ${ellipsedUrl}`);
            if (e.total > 0) h.ui.setElProps(filePB, { width: `${(e.loaded / e.total) * 100}%` });
          }
        });

        let basename = h.generateFilename(url, response.responseHeaders);
        const originalBase = basename;
        let count = 2;
        while (filenames.includes(basename)) {
          const ext = h.ext(originalBase);
          basename = `${h.fnNoExt(originalBase)} (${count++})${ext ? '.' + ext : ''}`;
        }
        filenames.push(basename);

        let fn = basename;
        if (!postSettings.flatten && folderName) fn = `${folderName.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_')}/${basename}`;
        fn = fn.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_');

        if (isFF || postSettings.zipped) {
          zip.file(fn, response.response);
        } else {
          const blobUrl = URL.createObjectURL(response.response);
          GM_download({ url: blobUrl, name: `${threadTitle.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_')}/${fn}`, onload: () => URL.revokeObjectURL(blobUrl) });
        }
      } catch (error) {
        log.post.error(postId, `Failed to download ${url}: ${error}`, postNumber);
      } finally {
        completed++;
        h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
        resolve();
      }
    }));
    await Promise.all(downloadPromises);

  } else {
    log.post.info(postId, "::Skipping download as per settings::", postNumber);
  }

  h.ui.setText(statusLabel, "Finalizing package...");

  if (totalDownloadable > 0 && (postSettings.zipped || postSettings.generateLinks || postSettings.generateLog)) {
    let title = threadTitle.replace(/[\x00-\x1F\x7F-\uFFFF<>:"/\\|?*]/g, '_');
    const filename = customFilename || `${title} #${postNumber}.zip`;
    if (postSettings.generateLog) zip.file("log.txt", window.logs.filter((l) => l.postId === postId).map((l) => l.message).join("\n"));
    if (postSettings.generateLinks) zip.file("links.txt", resolved.filter((r) => r.url).map((r) => r.url).join("\n"));

    const zipFileCount = Object.keys(zip.files).length;
    if (zipFileCount > 0) {
      let blob = await zip.generateAsync({ type: "blob" });
      if (isFF || postSettings.zipped) {
        saveAs(blob, filename);
      } else if (!postSettings.zipped) { // for generated files when not zipping main download
        const blobUrl = URL.createObjectURL(blob);
        GM_download({ url: blobUrl, name: `${title}/#${postNumber}/generated.zip`, onload: () => URL.revokeObjectURL(blobUrl) });
      }
    }
  }

  setProcessing(false, postId);
  h.ui.setText(statusLabel, `Download for post #${postNumber} complete!`);
  h.ui.setElProps(statusLabel, { color: "#47ba24" }); // Use setElProps to set style
  postDownloadCallbacks?.onComplete?.(totalDownloadable, completed);
};

const registerPostReaction = (postFooter) => {
  if (!postFooter) return;
  const hasReaction = postFooter.querySelector(".has-reaction");
  if (!hasReaction) {
    const reactionAnchor = postFooter.querySelector(".reaction--imageHidden");
    if (reactionAnchor) {
      reactionAnchor.setAttribute("href", reactionAnchor.getAttribute("href").replace("_id=1", "_id=33"));
      reactionAnchor.click();
    }
  }
};

async function cyberdrop_helper(file) {
  try {
    const response = await h.http.gm_promise({ method: "GET", url: file });
    if (response.status === 200) {
      const webData = JSON.parse(response.responseText);
      return webData.url;
    }
    return null;
  } catch (error) {
    console.log(`Failed to resolve ${file}: ${error}.`);
    return null;
  }
}

const init = {
  injectCustomStyles: () => {
    const style = document.createElement("style");
    style.textContent = styles.tippy.theme;
    document.head.appendChild(style);
  }
};

(function () {
  "use strict";

  const parsedPosts = [];
  let currentTab = "scrape";

  const hudStyle = `
  :root { --bg-dark:#0A131A; --accent-cyan:#00E5FF; --text-cyan-active:#67E8F9; --accent-cyan-border-hover:rgba(0,229,255,0.5); --accent-cyan-bg-active:rgba(0,229,255,0.2); --accent-cyan-glow-active:rgba(0,229,255,0.4); --text-primary:#EAEAEA; --text-secondary:#9E9E9E; --font-body:'Roboto Mono',monospace; --font-hud:'Orbitron',sans-serif; --panel-bg:#101827cc; --panel-bg-solid:#101827; --panel-border:#15adad; --panel-border-bright:#15fafa; --panel-glow:rgba(21,250,250,0.2); --panel-glow-intense:rgba(21,250,250,0.4); --primary-cyan:#15fafa; --scrollbar-thumb:#157d7d; --scrollbar-thumb-hover:#15fafa; --hud-z:999999; }
  .hud-container { position:fixed; bottom:2.6em; right:2.6em; z-index:var(--hud-z); background:var(--panel-bg); backdrop-filter:blur(6px); border-radius:1.2em; border:2.5px solid var(--panel-border); box-shadow:0 0 36px var(--panel-glow), 0 1.5px 8px #000b; min-width:520px; max-width:94vw; min-height:340px; color:var(--text-primary); font-family:var(--font-body); transition:all 280ms cubic-bezier(.45,.05,.55,.95); user-select:text; overflow:visible; opacity:0.99; }
  .hud-container[hidden]{display:none!important;}
  .hud-header{display:flex;align-items:center;padding:1.2em 1em 0.3em 1.2em;border-bottom:1.5px solid var(--panel-border);gap:1.1em;font-family:var(--font-hud);font-size:1.36em;letter-spacing:0.07em;background:transparent;user-select:none;}
  .hud-header .glyph{flex:none;width:44px;height:44px;display:block;}
  .hud-header .title{flex:1;font-weight:700;background:linear-gradient(to right,#15fafa,#15adad,#157d7d);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:0.14em;text-shadow:0 0 9px var(--panel-glow-intense);font-family:var(--font-hud);font-size:1.19em;}
  .hud-header .hud-close-btn{font-family:var(--font-hud);font-size:1.3em;border:none;background:transparent;color:var(--primary-cyan);cursor:pointer;margin-left:0.7em;opacity:0.8;transition:color 150ms;}
  .hud-header .hud-close-btn:hover{color:#e06;opacity:1;}
  .hud-tabs{display:flex;gap:0.7em;padding:0.6em 1.3em 0.1em 1.3em;border-bottom:1.5px solid var(--panel-border);background:transparent;}
  .hud-tabs .hud-button{font-family:var(--font-hud);font-size:1em;letter-spacing:0.08em;font-weight:700;background:none;padding:0.45em 1.1em;border-radius:0.8em;border:2px solid transparent;color:var(--text-secondary);cursor:pointer;transition:all 200ms;box-shadow:none;}
  .hud-tabs .hud-button.active{color:var(--primary-cyan);border-color:var(--primary-cyan);background:var(--accent-cyan-bg-active);box-shadow:0 0 15px var(--panel-glow-intense);}
  .hud-tabs .hud-button:hover:not(.active){border-color:var(--panel-border-bright);color:var(--panel-border-bright);background:var(--accent-cyan-bg-active);box-shadow:0 0 10px var(--panel-glow);}
  .hud-content{padding:1.35em 1.9em 1.2em 1.9em;min-height:220px;max-height:68vh;overflow-y:auto;font-size:1em;color:var(--text-primary);background:transparent;}
  .hud-content::-webkit-scrollbar{width:12px;background:var(--panel-bg-solid);}
  .hud-content::-webkit-scrollbar-thumb{background:var(--scrollbar-thumb);border-radius:8px;}
  .hud-content::-webkit-scrollbar-thumb:hover{background:var(--scrollbar-thumb-hover);}
  .hud-btn, .hud-button{display:inline-flex;align-items:center;gap:0.5em;padding:0.45em 1.05em;border-radius:0.6em;border:1.5px solid transparent;font-family:var(--font-hud);font-weight:700;font-size:1em;background:rgba(0,0,0,0.24);color:var(--text-secondary);cursor:pointer;letter-spacing:0.08em;transition:all 200ms;box-shadow:none;outline:none;}
  .hud-btn.active,.hud-button.active{color:var(--primary-cyan);border-color:var(--primary-cyan);background:var(--accent-cyan-bg-active);box-shadow:0 0 10px var(--panel-glow-intense);}
  .hud-btn:focus-visible,.hud-button:focus-visible{outline:2.5px solid var(--panel-border-bright);outline-offset:1.5px;}
  .chip{display:inline-block;border-radius:1.3em;padding:0.1em 0.8em;font-size:0.94em;font-family:var(--font-body);font-weight:600;background:#121c24;color:#67E8F9;border:1.5px solid #15fafa;box-shadow:0 0 7px var(--panel-glow);margin-right:0.35em;margin-bottom:0.1em;}
  .chip.dead{color:#ffc2c2;border-color:#e06;background:#390a18;} .chip.ok{color:#c2ffc2; border-color:#00e02b; background:#0a3915;}
  .chip.unknown{color:#fffbe6;border-color:#b5b500;background:#4c4b12;}
  .hud-toast{position:fixed;z-index:calc(var(--hud-z)+2000);bottom:3.4em;right:3.1em;background:#111b1bcc;color:var(--primary-cyan);font-family:var(--font-hud);font-size:1em;border-radius:0.8em;border:2px solid var(--panel-border-bright);box-shadow:0 0 18px var(--panel-glow-intense);padding:1.15em 2.2em;opacity:0.97;pointer-events:none;transition:opacity 220ms;user-select:none;}
  .previews-container{display:none; flex-wrap:wrap; gap:10px; margin-top:10px; padding-top:10px; border-top:1px solid var(--panel-border);}
  .previews-container img, .previews-container video { max-width:120px; max-height:120px; border:2px solid var(--panel-border); border-radius:4px; object-fit:cover; }
  `;
  const psiGlyphSVG = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" class="glyph" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="glyph-ring-1" d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2" /><path class="glyph-ring-2" d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7" /><path class="glyph-hex" d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z" /><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-cyan)" stroke="none" font-size="56" font-weight="700" font-family="'Cinzel Decorative', serif" class="glyph-core-psi">Ψ</text></svg>`;

  function showHudPanel() {
    let hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) {
      hudPanel = document.createElement("div");
      hudPanel.id = "hud-panel-root";
      hudPanel.className = "hud-container";
      hudPanel.innerHTML = `
        <div class="hud-header"> ${psiGlyphSVG} <span class="title">LinkMasterΨ2</span> <button class="hud-close-btn" title="Close HUD" tabindex="0">&times;</button> </div>
        <nav class="hud-tabs" role="tablist">
          <button class="hud-button" data-tab="scrape" role="tab"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a1 1 0 1 1 0 2H5v14h14v-5a1 1 0 1 1 2 0v5a2 2 0 0 1-2 2z"/><path d="M21 3v6a1 1 0 1 1-2 0V6.41l-9.29 9.3a1 1 0 1 1-1.42-1.42L17.59 5H15a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1z"/></svg><span>Scrape</span></button>
          <button class="hud-button" data-tab="check" role="tab"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg><span>Check</span></button>
          <button class="hud-button" data-tab="settings" role="tab"><svg class="icon" viewBox="0 0 24 24" fill="currentColor" style="width:1em;height:1em;"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l-.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg><span>Settings</span></button>
        </nav>
        <main class="hud-content" tabindex="0" id="hud-content-panel"></main>
      `;
      document.body.appendChild(hudPanel);
      hudPanel.querySelector(".hud-close-btn").onclick = () => hudPanel.setAttribute("hidden", "true");
      hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
        btn.onclick = () => setHudTab(btn.dataset.tab);
      });
      setHudTab(currentTab);
    }
    hudPanel.removeAttribute("hidden");
  }

  function setHudTab(tab) {
    currentTab = tab;
    const hudPanel = document.getElementById("hud-panel-root");
    if (!hudPanel) return;
    hudPanel.querySelectorAll(".hud-tabs .hud-button").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
      btn.setAttribute("aria-selected", btn.dataset.tab === tab);
    });
    const contentPanel = hudPanel.querySelector("#hud-content-panel");
    contentPanel.innerHTML = "";
    if (tab === "scrape") renderScrapePanel(contentPanel);
    else if (tab === "check") renderCheckPanel(contentPanel);
    else if (tab === "settings") renderSettingsPanel(contentPanel);
  }

  function showToast(msg, timeout = 3300) {
    let t = document.createElement("div");
    t.className = "hud-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = 0.1;
      setTimeout(() => t.remove(), 600);
    }, timeout);
  }

  function renderScrapePanel(contentPanel) {
    if (parsedPosts.length === 0) {
      contentPanel.innerHTML = "<p>No posts with downloadable content found.</p>";
      return;
    }
    const headerHTML = `
      <div style="display: flex; gap: 1em; align-items: center; margin-bottom: 1em; padding-bottom: 1em; border-bottom: 1.5px solid var(--panel-border);">
          <button id="scrape-select-all" class="hud-button">Select All</button>
          <button id="scrape-select-none" class="hud-button">Select None</button>
          <button id="scrape-download-selected" class="hud-btn active" style="margin-left: auto;">Download Selected</button>
      </div>
      <div id="posts-container"></div>`;
    contentPanel.innerHTML = headerHTML;
    const postsContainer = contentPanel.querySelector("#posts-container");

    parsedPosts.forEach((postData) => {
      const { parsedPost, parsedHosts, settings: localSettings } = postData;
      const totalResources = parsedHosts.reduce((acc, host) => acc + host.resources.length, 0);
      const totalDownloadable = () => parsedHosts.filter((h) => h.enabled).reduce((acc, h) => acc + h.resources.length, 0);
      const postEntryDiv = document.createElement("div");
      postEntryDiv.id = `hud-post-${parsedPost.postId}`;
      postEntryDiv.style.cssText = "border-bottom: 1.5px solid var(--panel-border); padding: 1em 0.5em; margin-bottom: 1em;";
      postEntryDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1em; margin-bottom: 0.8em;">
          <input type="checkbox" class="scrape-post-select" data-post-id="${parsedPost.postId}" style="transform: scale(1.2);">
          <label style="font-family: var(--font-hud); font-weight: 700; font-size: 1.1em;">
              Post <a href="#post-${parsedPost.postId}" style="color: var(--primary-cyan); text-decoration: none;">#${parsedPost.postNumber}</a>
          </label>
          <span class="chip" style="margin-left:auto;">${totalResources} links</span>
        </div>
        <div id="status-area-${parsedPost.postId}" style="margin-top: 0.8em;"></div>`;

      const btnDownloadPost = document.createElement("button");
      btnDownloadPost.className = "hud-btn";
      btnDownloadPost.innerHTML = `<span>🡳 Configure & Download (${totalDownloadable()}/${totalResources})</span>`;
      postEntryDiv.insertBefore(btnDownloadPost, postEntryDiv.querySelector(`#status-area-${parsedPost.postId}`));

      postsContainer.appendChild(postEntryDiv);

      // Attach hover-preview tooltip
      const postLink = postEntryDiv.querySelector(`a[href="#post-${parsedPost.postId}"]`);
      if (postLink) {
        const previewContent = document.createElement('div');
        previewContent.style.cssText = "display:flex; flex-wrap:wrap; gap:10px; padding:10px; max-width: 520px; max-height: 400px; overflow-y: auto; background: var(--panel-bg-solid); border-radius: 8px; border: 1px solid var(--panel-border);";

        const generatePreviewContent = () => {
          if (previewContent.children.length === 0) { // Lazy populate
            const allResources = postData.parsedHosts.flatMap(h => h.resources);
            allResources.forEach(url => {
              const ext = h.ext(url);
              let elem = null;
              if (settings.extensions.image.includes(ext)) {
                elem = document.createElement('img');
                elem.loading = 'lazy';
                elem.style.cssText = "max-width:120px; max-height:120px; border:2px solid var(--panel-border); border-radius:4px; object-fit:cover;";
              } else if (settings.extensions.video.includes(ext)) {
                elem = document.createElement('video');
                elem.controls = false;
                elem.muted = true;
                elem.autoplay = true;
                elem.loop = true;
                elem.style.cssText = "max-width:120px; max-height:120px; border:2px solid var(--panel-border); border-radius:4px; object-fit:cover;";
              }
              if (elem) {
                elem.src = url;
                previewContent.appendChild(elem);
              }
            });
            if (previewContent.children.length === 0) {
              previewContent.innerHTML = '<span style="color: var(--text-secondary);">No image/video previews available.</span>';
            }
          }
          return previewContent;
        };
        ui.tooltip(postLink, 'Loading previews...', {
          allowHTML: true,
          interactive: true,
          placement: 'right',
          onShow(instance) {
            instance.setContent(generatePreviewContent());
          },
          zIndex: 1000001, // Higher than HUD
        });
      }


      ui.forms.config.post.createPostConfigForm(parsedPost, parsedHosts, `#${parsedPost.postNumber}.zip`, localSettings,
        (data) => data.tippyInstance.hide(), totalDownloadable, btnDownloadPost);

      btnDownloadPost.addEventListener("click", (e) => {
        if (!e.target.closest(".tippy-box")) {
          const statusArea = h.element(`#status-area-${parsedPost.postId}`);
          downloadPost(postData, statusArea);
        }
      });
    });

    contentPanel.querySelector('#scrape-select-all').onclick = () => contentPanel.querySelectorAll('.scrape-post-select').forEach(cb => cb.checked = true);
    contentPanel.querySelector('#scrape-select-none').onclick = () => contentPanel.querySelectorAll('.scrape-post-select').forEach(cb => cb.checked = false);
    contentPanel.querySelector('#scrape-download-selected').onclick = async () => {
      const selected = [...contentPanel.querySelectorAll('.scrape-post-select:checked')];
      if (selected.length === 0) {
        showToast("No posts selected.");
        return;
      }
      showToast(`Starting batch download for ${selected.length} post(s).`);
      for (const cb of selected) {
        const postData = parsedPosts.find(p => p.parsedPost.postId === cb.dataset.postId);
        if (postData) await downloadPost(postData, h.element(`#status-area-${postData.parsedPost.postId}`));
      }
    };
  }

  function renderCheckPanel(contentPanel) {
    let selectionHTML = `<div style="margin-bottom: 1em; display:flex; gap:1em; align-items:center;"><h4>Select posts:</h4><div><button id="check-select-all" class="hud-button">All</button><button id="check-select-none" class="hud-button">None</button></div></div>`;
    if (parsedPosts.length > 0) {
      parsedPosts.forEach(p => {
        selectionHTML += `<label style="display: block; margin-bottom:0.5em;"><input type="checkbox" class="check-post-select" value="${p.parsedPost.postId}"> Post #${p.parsedPost.postNumber}</label>`;
      });
    } else {
      selectionHTML += `<p>No posts scraped from page.</p>`;
    }
    contentPanel.innerHTML = `
        <div style="border-bottom: 1.5px solid var(--panel-border); padding-bottom: 1em; margin-bottom: 1em;">
            <h3>Check Scraped Links</h3>
            ${selectionHTML}
            <button id="check-scraped-btn" class="hud-btn active">Check Scraped Links</button>
        </div>
        <div>
            <h3>Check Pasted Links</h3>
            <textarea id="check-paste-area" style="width: 100%; height: 100px; background: #0A131A; border: 1.5px solid var(--panel-border); color: var(--text-primary); padding: 0.5em; border-radius: 0.4em; margin-bottom: 1em;" placeholder="Paste links here, one per line..."></textarea>
            <button id="check-pasted-btn" class="hud-btn active">Check Pasted Links</button>
        </div>
        <div id="check-results" style="margin-top: 1.5em; word-break: break-all;"></div>`;

    if (parsedPosts.length > 0) {
      contentPanel.querySelector('#check-select-all').onclick = () => contentPanel.querySelectorAll('.check-post-select').forEach(cb => cb.checked = true);
      contentPanel.querySelector('#check-select-none').onclick = () => contentPanel.querySelectorAll('.check-post-select').forEach(cb => cb.checked = false);
      contentPanel.querySelector('#check-scraped-btn').onclick = startLinkCheck;
    }
    contentPanel.querySelector('#check-pasted-btn').onclick = startLinkCheck;
  }

  async function startLinkCheck(event) {
    const resultsPanel = document.getElementById('check-results');
    resultsPanel.innerHTML = 'Resolving links...';
    let linksToCheck = [];
    const isPasted = event.target.id === 'check-pasted-btn';

    if (isPasted) {
      const pastedText = h.element('#check-paste-area').value;
      linksToCheck = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
    } else {
      const selected = [...document.querySelectorAll('.check-post-select:checked')];
      if (selected.length === 0) {
        resultsPanel.innerHTML = 'Please select at least one post.';
        return;
      }
      let resolvedLinks = [];
      for (const cb of selected) {
        const postData = parsedPosts.find(p => p.parsedPost.postId === cb.value);
        if (postData) resolvedLinks.push(...await resolvePostLinks(postData));
      }
      linksToCheck = h.unique(resolvedLinks, 'url').map(l => l.url);
    }

    if (linksToCheck.length === 0) {
      resultsPanel.innerHTML = 'No links to check.';
      return;
    }
    resultsPanel.innerHTML = `Checking ${linksToCheck.length} unique links...`;

    const results = await Promise.all(linksToCheck.map(url => checkLinkStatus(url)));
    renderCheckResults(results);
  }

  async function checkLinkStatus(url) {
    try {
      const response = await h.http.gm_promise({ method: 'HEAD', url: url, headers: { 'Referer': window.location.origin } });
      const contentType = response.responseHeaders.match(/content-type:\s*(.*)/i)?.[1] || 'N/A';
      const contentLength = response.responseHeaders.match(/content-length:\s*(\d+)/i)?.[1];
      return { url, status: response.status, contentType, size: contentLength ? h.prettyBytes(Number(contentLength)) : 'N/A' };
    } catch (error) {
      return { url, status: 'Error', error: error.toString() };
    }
  }

  function renderCheckResults(results) {
    const resultsPanel = document.getElementById('check-results');
    let html = '<h3>Check Complete</h3>';
    results.forEach(res => {
      let statusChip;
      if (res.status === 'Error') statusChip = `<span class="chip dead">Error</span>`;
      else if (res.status >= 200 && res.status < 300) statusChip = `<span class="chip ok">${res.status} OK</span>`;
      else if (res.status >= 400) statusChip = `<span class="chip dead">${res.status} Error</span>`;
      else statusChip = `<span class="chip unknown">${res.status}</span>`;
      const details = res.status !== 'Error' ? ` | ${res.contentType} | ${res.size}` : '';
      html += `<div style="margin-bottom: 0.5em;">${statusChip} <a href="${res.url}" target="_blank" style="color: var(--text-secondary);">${h.limit(res.url, 80)}</a><span style="font-size: 0.9em; color: var(--text-secondary);">${details}</span></div>`;
    });
    resultsPanel.innerHTML = html;
  }

  function renderSettingsPanel(contentPanel) {
    contentPanel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.5em;">
            <div>
              <label style="display:block; margin-bottom: 0.5em; font-family: var(--font-hud);">Application Mode</label>
              <select id="app-mode" style="width: 100%; background: #0A131A; border: 1.5px solid var(--panel-border); color: var(--text-primary); padding: 0.5em; border-radius: 0.4em;">
                <option value="forum" ${globalConfig.appMode === 'forum' ? 'selected' : ''}>Forum Mode (Detects posts)</option>
                <option value="general" ${globalConfig.appMode === 'general' ? 'selected' : ''}>General Mode (Scrapes entire page)</option>
              </select>
            </div>
            <div>
              <label for="gofile-token" style="display:block; margin-bottom: 0.5em; font-family: var(--font-hud);">GoFile Token (Optional)</label>
              <input type="password" id="gofile-token" value="${globalConfig.goFileToken}" style="width: 100%; background: #0A131A; border: 1.5px solid var(--panel-border); color: var(--text-primary); padding: 0.5em; border-radius: 0.4em;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em;">
                <label><input type="checkbox" id="setting-zipped" ${globalConfig.defaultZipped ? 'checked' : ''}> Default to Zipped</label>
                <label><input type="checkbox" id="setting-flatten" ${globalConfig.defaultFlatten ? 'checked' : ''}> Default to Flatten</label>
                <label><input type="checkbox" id="setting-gen-links" ${globalConfig.defaultGenerateLinks ? 'checked' : ''}> Default to Generate links.txt</label>
                <label><input type="checkbox" id="setting-gen-log" ${globalConfig.defaultGenerateLog ? 'checked' : ''}> Default to Generate log.txt</label>
                <label><input type="checkbox" id="setting-skip-dupes" ${globalConfig.defaultSkipDuplicates ? 'checked' : ''}> Default to Skip Duplicates</label>
            </div>
            <button id="save-settings-btn" class="hud-btn active">Save Settings & Reload</button>
        </div>`;
    contentPanel.querySelector('#save-settings-btn').onclick = () => {
      globalConfig.appMode = contentPanel.querySelector('#app-mode').value;
      globalConfig.goFileToken = contentPanel.querySelector('#gofile-token').value.trim();
      globalConfig.defaultZipped = contentPanel.querySelector('#setting-zipped').checked;
      globalConfig.defaultFlatten = contentPanel.querySelector('#setting-flatten').checked;
      globalConfig.defaultGenerateLinks = contentPanel.querySelector('#setting-gen-links').checked;
      globalConfig.defaultGenerateLog = contentPanel.querySelector('#setting-gen-log').checked;
      globalConfig.defaultSkipDuplicates = contentPanel.querySelector('#setting-skip-dupes').checked;
      saveSettings();
    };
  }

  function saveSettings() {
    GM_setValue('linkmaster_settings', JSON.stringify(globalConfig));
    showToast('Settings Saved! Reloading...');
    setTimeout(() => window.location.reload(), 1500);
  }

  function loadSettings() {
    const saved = GM_getValue('linkmaster_settings', null);
    const defaults = {
      appMode: 'forum',
      goFileToken: '',
      defaultZipped: true,
      defaultFlatten: false,
      defaultGenerateLinks: false,
      defaultGenerateLog: false,
      defaultSkipDuplicates: true,
    };
    Object.assign(globalConfig, defaults, saved ? JSON.parse(saved) : {});
  }

  const processPost = (post) => {
    if (post.dataset.linkmasterProcessed) return false;
    post.dataset.linkmasterProcessed = "true";
    const parsedPost = parsers.thread.parsePost(post);
    if (!parsedPost) return false;
    const parsedHosts = parsers.hosts.parseHosts(parsedPost.content);
    if (!parsedHosts.length) return false;
    const localSettings = { ...globalConfig, zipped: globalConfig.defaultZipped, flatten: globalConfig.defaultFlatten, generateLinks: globalConfig.defaultGenerateLinks, generateLog: globalConfig.defaultGenerateLog, skipDuplicates: globalConfig.defaultSkipDuplicates, skipDownload: false, verifyBunkrLinks: false, output: [] };
    parsedPosts.push({
      parsedPost,
      parsedHosts,
      settings: localSettings,
      getSettingsCB: () => localSettings,
      enabledHostsCB: (hosts) => hosts.filter((h) => h.enabled),
      resolvers,
      postDownloadCallbacks: {
        onComplete: (total, completed) => {
          if (total > 0 && completed > 0 && parsedPost.footer) registerPostReaction(parsedPost.footer);
        }
      }
    });
    return true;
  };

  const start = async () => {
    loadSettings();
    init.injectCustomStyles();
    if (!document.getElementById("eglass-hud-css")) {
      const style = document.createElement("style");
      style.id = "eglass-hud-css";
      style.textContent = hudStyle;
      document.head.appendChild(style);
    }

    if (!document.getElementById("hud-float-btn")) {
      const floatBtn = document.createElement("button");
      floatBtn.id = "hud-float-btn";
      floatBtn.className = "hud-btn";
      floatBtn.innerHTML = psiGlyphSVG + `<span style="font-family: var(--font-hud); font-weight: 800; margin-left: 0.6em;">HUD</span>`;
      floatBtn.style.cssText = "position: fixed; bottom: 2em; right: 2em; z-index: 999998; padding: 0.6em 1.3em; background: rgba(10,19,26,0.85); border-radius: 0.9em; border: 2.5px solid var(--panel-border); box-shadow: 0 0 16px var(--panel-glow); color: var(--primary-cyan); font-size: 1.08em; cursor: pointer; outline: none; transition: all 220ms;";
      document.body.appendChild(floatBtn);
      floatBtn.onclick = showHudPanel;
    }

    if (globalConfig.appMode === 'forum') {
      const observer = new MutationObserver((mutations) => {
        let newPostsProcessed = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const posts = node.querySelectorAll(".message-attribution-opposite");
                posts.forEach((p) => {
                  if (processPost(p)) newPostsProcessed = true;
                });
                if (node.matches && node.matches(".message-attribution-opposite")) {
                  if (processPost(node)) newPostsProcessed = true;
                }
              }
            });
          }
        });
        if (newPostsProcessed) {
          const hudPanel = document.getElementById("hud-panel-root");
          if (hudPanel && !hudPanel.hidden) {
            setHudTab(currentTab);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      let initialPostsFound = 0;
      document.querySelectorAll(".message-attribution-opposite").forEach((p) => {
        if (processPost(p)) initialPostsFound++;
      });
      if (initialPostsFound > 0) showToast(`${initialPostsFound} post(s) with media found!`);

    } else { // General Mode
      const allHosts = parsers.hosts.parseHosts(document.body.innerHTML);
      if (allHosts.length > 0) {
        const virtualPost = { postId: 'general-mode-post', postNumber: 'Page', content: document.body.innerHTML, spoilers: [] };
        const localSettings = { ...globalConfig, zipped: globalConfig.defaultZipped, flatten: globalConfig.defaultFlatten, generateLinks: globalConfig.defaultGenerateLinks, generateLog: globalConfig.defaultGenerateLog, skipDuplicates: globalConfig.defaultSkipDuplicates, skipDownload: false, verifyBunkrLinks: false, output: [] };
        parsedPosts.push({
          parsedPost: virtualPost,
          parsedHosts: allHosts,
          settings: localSettings,
          getSettingsCB: () => localSettings,
          enabledHostsCB: (hosts) => hosts.filter((h) => h.enabled),
          resolvers,
          postDownloadCallbacks: {}
        });
        showToast(`${allHosts.reduce((acc, h) => acc + h.resources.length, 0)} links found on page.`);
      }
    }

    try {
      const { source } = await h.http.get("https://api.redgifs.com/v2/auth/temporary");
      if (h.contains("token", source)) GM_setValue("redgifs_token", JSON.parse(source).token);
    } catch (e) {
      console.error("Error getting temporary redgifs auth token:", e);
    }
  };

  window.addEventListener("beforeunload", (e) => {
    if (processing.some((p) => p.processing)) {
      const message = "Downloads are in progress. Are you sure you want to leave?";
      e.returnValue = message;
      return message;
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
