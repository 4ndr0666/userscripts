// ==UserScript==
// @name         4ndr0tools - LinkMasterΨ2
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.1.0
// @description  A fully-integrated HUD for scraping, previewing, checking, and downloading links from any website. Features dual modes for targeted forum scraping or aggressive general-purpose link discovery, a standalone link checker with paste support, and persistent user settings.
// @author       4ndr0666, SkyCloudDev, and The Akashic Collective
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A82.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20LinkMaster%CE%A82.user.js
// @license      MIT, WTFPL
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
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
const HUD_TAG = "[Ψ-4ndr0666]";
const LOG_TAGS = {
  copyAll: "[Ψ-4ndr0666:CopyAll]",
  brokenFix: "[Ψ-4ndr0666:BrokenFix]",
  m3u8: "[Ψ-4ndr0666:M3U8]",
};

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
const statusUtils = {
  categorize: (status) => {
    if (status === "Error") return "bad";
    if (typeof status === "number") {
      if (status >= 400) return "bad";
      if (status >= 200) return "good";
    }
    return "unknown";
  }
};

const buildStatusChip = (status) => {
  const category = statusUtils.categorize(status);
  let label = "Unknown";
  if (category === "good") label = `${status} OK`;
  else if (category === "bad") label = status === "Error" ? "Error" : `${status} Error`;
  const cls = category === "good" ? "ok" : category === "bad" ? "dead" : "unknown";
  return `<span class="chip ${cls}">${label}</span>`;
};

const cacheLinkStatusesForPosts = (postIds) => {
  postIds.forEach((postId) => updatePostStatusChip(postId));
};

const cacheResolvedLinks = (postId, links) => {
  resolvedCache.set(postId, links);
  cachedResolvedLinks = Array.from(resolvedCache.values()).flat();
};

const resetResolvedCache = () => {
  resolvedCache.clear();
  cachedResolvedLinks = null;
};

const summarizePostStatus = (postId) => {
  const links = resolvedCache.get(postId) || [];
  if (!links.length) return null;
  const summary = { good: 0, bad: 0, unknown: 0 };
  links.forEach((link) => {
    const cached = linkStatusCache.get(link.url);
    const category = cached ? statusUtils.categorize(cached.status) : "unknown";
    summary[category] += 1;
  });
  return { ...summary, total: links.length };
};

const updatePostStatusChip = (postId) => {
  const chip = document.getElementById(`status-chip-${postId}`);
  if (!chip) return;
  const summary = summarizePostStatus(postId);
  let category = "unknown";
  if (summary) {
    if (summary.bad > 0) category = "bad";
    else if (summary.good === summary.total) category = "good";
  }
  postStatusSummary.set(postId, summary || { good: 0, bad: 0, unknown: 0, total: 0 });
  chip.textContent = `${h.ucFirst(category)}${summary?.total ? ` (${summary.good}/${summary.total})` : ""}`;
  chip.className = `chip ${category === "good" ? "ok" : category === "bad" ? "dead" : "unknown"}`;
};

const cacheLinkStatus = (url, result, postIds = []) => {
  const existing = linkStatusCache.get(url) || {};
  const mergedPosts = h.unique([...(existing.postIds || []), ...postIds]);
  linkStatusCache.set(url, { ...existing, ...result, postIds: mergedPosts });
  cacheLinkStatusesForPosts(mergedPosts);
};

const matchesStatusFilter = (filter, status) => {
  const category = statusUtils.categorize(status);
  return filter === "any" || filter === category;
};

const parseSizeInput = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)(\s*[kKmMgGtTpP]?)(?:[bB])?$/);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase().replace(/\s/g, "");
  const multipliers = { k: 1_000, m: 1_000_000, g: 1_000_000_000, t: 1_000_000_000_000, p: 1_000_000_000_000_000 };
  const multiplier = unit && multipliers[unit[0]] ? multipliers[unit[0]] : 1;
  return amount * multiplier;
};

const determineLinkType = (url) => {
  const ext = h.ext(url);
  if (!ext) return "other";
  if (settings.extensions.image.includes(ext)) return "images";
  if (settings.extensions.video.includes(ext)) return "videos";
  if (settings.extensions.documents.includes(ext)) return "documents";
  if (settings.extensions.compressed.includes(ext)) return "compressed";
  return "other";
};

const getAggregatedResolved = () => {
  if (cachedResolvedLinks) return cachedResolvedLinks;
  cachedResolvedLinks = Array.from(resolvedCache.values()).flat();
  return cachedResolvedLinks;
};

const resolvedCache = new Map();
let cachedResolvedLinks = null;
const linkStatusCache = new Map();
const postStatusSummary = new Map();
let lastCheckResults = [];
const parsedPosts = [];
const pluginFixers = [];
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
      const parsePageNumber = (permalink, postNumber) => {
        const parseFromUrl = (url) => {
          try {
            const parsedUrl = new URL(url, document.location.href);
            const pathName = parsedUrl.pathname;
            const pathMatch = /(?<=\/page-)\d+/is.exec(pathName);
            if (pathMatch?.[0]) return Number(pathMatch[0]);

            const queryPage = new URLSearchParams(parsedUrl.search).get("page");
            if (queryPage && !Number.isNaN(Number(queryPage))) return Number(queryPage);

            const segments = pathName.split("/").filter(Boolean);
            if (segments.length >= 3 && segments[0] === "d") {
              const lastSegment = segments[segments.length - 1];
              if (/^\d+$/.test(lastSegment)) return Number(lastSegment);
            }
          } catch (error) {
            log.warn?.("page", `${HUD_TAG} Failed to parse page number from ${url}: ${error.message}`, "HUD");
          }
          return null;
        };

        const resolvedFromPermalink = permalink ? parseFromUrl(permalink) : null;
        if (resolvedFromPermalink) return resolvedFromPermalink;

        const resolvedFromLocation = parseFromUrl(document.location.href);
        if (resolvedFromLocation) return resolvedFromLocation;

        const parsePostsPerPage = () => {
          const candidates = [
            document.querySelector('meta[name="flarum::posts-per-page"]')?.getAttribute("content"),
            typeof window.app?.forum?.attribute === "function" ? window.app.forum.attribute("postsPerPage") : null,
          ]
            .map((val) => Number(val))
            .filter((val) => Number.isFinite(val) && val > 0);
          return candidates[0] || 20;
        };

        const numericPost = Number(postNumber);
        if (!Number.isNaN(numericPost) && numericPost > 0) {
          const postsPerPage = parsePostsPerPage();
          return Math.max(1, Math.ceil(numericPost / postsPerPage));
        }

        return 1;
      };

      const collectSpoilers = (contentNode) => {
        const textContent = contentNode?.innerText || "";
        const spoilers = [
          ...contentNode.querySelectorAll(".bbCodeBlock--spoiler > .bbCodeBlock-content, .bbCodeInlineSpoiler, [class*='spoiler' i], details"),
        ]
          .filter((s) => !s.querySelector?.(".bbCodeBlock--unfurl"))
          .map((s) => s.innerText)
          .concat(
            h.re
              .matchAll(
                /(?<=pw|pass|passwd|password)(\s:|:)?\s+?[a-zA-Z0-9~!@#$%^&*()_+{}|:'"<>?/,;.]+/gis,
                textContent,
              )
              .map((s) => s.trim()),
          )
          .map((s) => s.trim().replace(/^:|^\bp:\b|^\bpw:\b|^\bkey:\b/i, "").trim())
          .filter(Boolean)
          .unique();
        return spoilers;
      };

      const parseFlarumPost = (article) => {
        const messageContent = article.querySelector(".Post-body");
        if (!messageContent) return null;

        const footer = article.querySelector(".Post-footer");
        const messageContentClone = messageContent.cloneNode(true);

        const permalink =
          article.querySelector("a.PostPermalink, a.Post-permalink, a.Post-permalinkButton, a.PostHeader-permalink") ||
          article.querySelector(".Post-header a[href]");
        const href = permalink?.getAttribute("href") || "";
        const hrefNumberMatch = href.match(/(\d+)(?!.*\d)/);

        const postId =
          article.getAttribute("data-id") || article.id || hrefNumberMatch?.[1] || article.getAttribute("data-number") || null;
        const postNumber =
          article.getAttribute("data-number") ||
          (permalink?.textContent ? permalink.textContent.replace("#", "").trim() : null) ||
          hrefNumberMatch?.[1] ||
          postId;

        if (!postId || !postNumber) return null;

        const spoilers = collectSpoilers(messageContentClone);
        const postContent = messageContentClone.innerHTML;
        const postTextContent = messageContentClone.innerText;

        return {
          post: article,
          postId,
          postNumber,
          pageNumber: parsePageNumber(href, postNumber),
          spoilers,
          footer,
          actions: article.querySelector(".Post-actions") || null,
          content: postContent,
          textContent: postTextContent,
          contentContainer: messageContent,
        };
      };

      const parseLegacyPost = (legacyPost) => {
        const messageContent = legacyPost.parentNode?.parentNode?.querySelector?.(".message-content > .message-userContent");
        if (!messageContent) return null;

        const footer = legacyPost.parentNode?.parentNode?.querySelector?.("footer");
        const messageContentClone = messageContent.cloneNode(true);

        const postIdAnchor = legacyPost.querySelector("li:last-of-type > a");
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
          .map((a) => a.parentNode.parentNode.parentNode.parentNode)
          .forEach((i) => i.remove());

        const spoilers = collectSpoilers(messageContentClone);

        const postContent = messageContentClone.innerHTML;
        const postTextContent = messageContentClone.innerText;
        return {
          post: legacyPost,
          postId,
          postNumber,
          pageNumber: parsePageNumber(href, postNumber),
          spoilers,
          footer,
          content: postContent,
          textContent: postTextContent,
          contentContainer: messageContent,
        };
      };

      const flarumPost = post.matches("article.CommentPost.Post") ? post : post.closest("article.CommentPost.Post");
      if (flarumPost) return parseFlarumPost(flarumPost);
      return parseLegacyPost(post);
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
              if (inputEl) {
                inputEl.oninput = (e) => {
                  let o = settings.output.find(o => o.postId === postId);
                  if (o) o.value = e.target.value;
                  else settings.output.push({ postId, value: e.target.value });
                };
              }

              const updateCheckbox = (id, key) => {
                const el = h.element(id);
                if (el) {
                  el.onchange = (e) => {
                    settings[key] = e.target.checked;
                  };
                }
              };
              updateCheckbox(`#settings-${postId}-generate-links`, "generateLinks");
              updateCheckbox(`#settings-${postId}-generate-log`, "generateLog");
              updateCheckbox(`#settings-${postId}-flatten`, "flatten");
              updateCheckbox(`#settings-${postId}-skip-duplicates`, "skipDuplicates");
              updateCheckbox(`#settings-${postId}-verify-bunkr-links`, "verifyBunkrLinks");
              if (!window.isFF) updateCheckbox(`#settings-${postId}-zipped`, "zipped");

              const skipDownloadEl = h.element(`#settings-${postId}-skip-download`);
              if (skipDownloadEl) {
                skipDownloadEl.onchange = (e) => {
                  const checked = e.target.checked;
                  settings.skipDownload = checked;
                  const dependentElems = ["flatten", "skip-duplicates"];
                  dependentElems.forEach((key) => {
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
              }

              const formEl = h.element(`#download-config-form-${postId}`);
              if (formEl) {
                formEl.onsubmit = (e) => {
                  e.preventDefault();
                  onSubmitFormCB({ tippyInstance: instance });
                };
              }

              if (parsedHosts.length > 1) {
                const toggleAllHostsEl = h.element(`#settings-toggle-all-hosts-${postId}`);
                if (toggleAllHostsEl) {
                  toggleAllHostsEl.onchange = (e) => {
                    const checked = e.target.checked;
                    parsedHosts.forEach((host) => {
                      const cb = h.element(`#downloader-host-${host.id}-${postId}`);
                      if (cb && cb.checked !== checked) cb.click();
                    });
                  };
                }
              }

              parsedHosts.forEach((host) => {
                const hostCheckbox = h.element(`#downloader-host-${host.id}-${postId}`);
                if (hostCheckbox) {
                  hostCheckbox.onchange = (e) => {
                    host.enabled = e.target.checked;
                    const filteredCount = totalDownloadableResourcesForPostCB(parsedHosts);
                    const countEl = document.querySelector(`#filtered-count-${parsedHosts[0].id}`); // Use querySelector for broader scope if needed
                    if (countEl) countEl.textContent = `(${filteredCount})`;

                    const totalResources = parsedHosts.reduce((acc, h) => acc + h.resources.length, 0);
                    const btnTextSpan = btnDownloadPost.querySelector("span") || btnDownloadPost;
                    btnTextSpan.textContent = `🡳 Configure & Download (${filteredCount}/${totalResources})`;

                    if (parsedHosts.length > 1) {
                      const checkedLength = parsedHosts.filter((h) => h.enabled).length;
                      const toggleAll = h.element(`#settings-toggle-all-hosts-${postId}`);
                      if (toggleAll) toggleAll.checked = checkedLength === parsedHosts.length;
                    }
                  };
                }
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

const normalizePlugin = (plugin, sourceLabel) => {
  if (!plugin || typeof plugin !== "object") return null;
  const hostsDef = Array.isArray(plugin.hosts) ? plugin.hosts : [];
  const resolversDef = Array.isArray(plugin.resolvers) ? plugin.resolvers : [];
  const fixersDef = Array.isArray(plugin.fixers) ? plugin.fixers.filter((fn) => typeof fn === "function") : [];
  return { name: plugin.name || sourceLabel || "External Plugin", hosts: hostsDef, resolvers: resolversDef, fixers: fixersDef };
};

const parsePluginDefinition = (definition, sourceLabel = "external plugin") => {
  try {
    if (typeof definition === "string") {
      const trimmed = definition.trim();
      try {
        const json = JSON.parse(trimmed);
        return normalizePlugin(json, sourceLabel);
      } catch {
        const factoryBody = trimmed.startsWith("(") ? `return ${trimmed};` : trimmed;
        const factory = new Function(
          "helpers",
          `"use strict"; const exports = {}; const module = { exports }; ${factoryBody}; return typeof LinkMasterPlugin !== "undefined" ? LinkMasterPlugin : (module.exports || exports);`
        );
        const plugin = factory({ h, log });
        return normalizePlugin(plugin, sourceLabel);
      }
    }
    return normalizePlugin(definition, sourceLabel);
  } catch (error) {
    log.warn?.("plugin", `${HUD_TAG} Failed to parse plugin from ${sourceLabel}: ${error}`, "HUD");
    return null;
  }
};

const loadPluginFromUrl = async (url) => {
  try {
    const response = await h.http.gm_promise({ method: "GET", url, responseType: "text" });
    return parsePluginDefinition(response.responseText, url);
  } catch (error) {
    log.warn?.("plugin", `${HUD_TAG} Failed to load plugin ${url}: ${error}`, "HUD");
    return null;
  }
};

const registerPlugin = (plugin) => {
  if (!plugin) return;
  if (plugin.hosts?.length) hosts.push(...plugin.hosts);
  if (plugin.resolvers?.length) resolvers.push(...plugin.resolvers);
  if (plugin.fixers?.length) pluginFixers.push(...plugin.fixers.filter((fn) => typeof fn === "function"));
  log.info("plugin", `${HUD_TAG} Loaded plugin: ${plugin.name}`, "HUD");
};

const initPlugins = async () => {
  const pluginObjects = [];
  const manualSources = Array.isArray(globalConfig.pluginSources) ? globalConfig.pluginSources.filter(Boolean) : [];
  for (const source of manualSources) {
    const plugin = await loadPluginFromUrl(source);
    if (plugin) pluginObjects.push(plugin);
  }

  const inlinePlugins = [...(window.LinkMasterPlugins || []), ...(window.linkmasterPlugins || [])];
  inlinePlugins.forEach((plugin, idx) => {
    const parsed = parsePluginDefinition(plugin, `inline-${idx + 1}`);
    if (parsed) pluginObjects.push(parsed);
  });

  const scriptPlugins = document.querySelectorAll('script[data-linkmaster-plugin], script[type="application/linkmaster-plugin"]');
  let scriptIndex = 0;
  for (const script of scriptPlugins) {
    const label = script.dataset.linkmasterPlugin || script.getAttribute("src") || `script-${++scriptIndex}`;
    const inlineDefinition = script.textContent?.trim();
    if (inlineDefinition) {
      const parsed = parsePluginDefinition(inlineDefinition, label);
      if (parsed) pluginObjects.push(parsed);
    } else if (script.getAttribute("src")) {
      const loaded = await loadPluginFromUrl(script.getAttribute("src"));
      if (loaded) pluginObjects.push(loaded);
    }
  }

  pluginObjects.forEach(registerPlugin);
};

const buildGenericMediaHost = (postId, resources) => ({
  name: "Generic Media",
  type: "single",
  category: "Links",
  resources,
  enabled: true,
  id: `generic-${postId}-${Math.round(Math.random() * Number.MAX_SAFE_INTEGER)}`
});

const collectGenericMediaResources = (root = document) => {
  if (!root?.querySelectorAll) return [];

  const mediaExtensions = new Set(["mp4", "webm", "mkv", "mp3", "m4v", "m4a", "aac", "wav", "flac", "ogg", "ogv", "oga", "opus"]);
  const collected = [];

  const normalizeUrl = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    try {
      const sanitized = trimmed.split("#")[0].split("?")[0];
      return sanitized;
    } catch (e) {
      log.info("generic", `${HUD_TAG} Error normalizing media url ${url}: ${e.message}`, "HUD");
      return null;
    }
  };

  const pushIfValid = (url) => {
    const normalized = normalizeUrl(url);
    const ext = normalized ? h.ext(normalized)?.toLowerCase() : null;
    if (normalized && ext && mediaExtensions.has(ext)) {
      collected.push(normalized);
    }
  };

  root
    .querySelectorAll("video[src], audio[src], video[data-src], audio[data-src], source[src], source[data-src], video source[src], video source[data-src], audio source[src], audio source[data-src]")
    .forEach((el) => {
      pushIfValid(el.getAttribute("src"));
      pushIfValid(el.dataset?.src);
    });

  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const ext = href ? h.ext(href)?.toLowerCase() : null;
    if (ext && mediaExtensions.has(ext)) pushIfValid(href);
  });

  return h.unique(collected);
};

async function resolveAllPosts(postDatas, statusLabel, totalPB, options = {}) {
  const { respectSkipDuplicates = true } = options;
  const aggregate = [];
  const totalTargets = postDatas.reduce((acc, postData) => acc + postData.enabledHostsCB(postData.parsedHosts).reduce((sum, hst) => sum + hst.resources.length, 0), 0) || 1;
  let processed = 0;

  for (const postData of postDatas) {
    const resolved = await resolvePostLinks(postData, statusLabel);
    const postSettings = typeof postData.getSettingsCB === "function" ? postData.getSettingsCB() : null;
    const sanitized = respectSkipDuplicates && postSettings?.skipDuplicates ? h.unique(resolved, "url") : resolved;

    aggregate.push(...sanitized);
    processed += sanitized.length || 0;
    if (totalPB) totalPB.style.width = `${Math.min(100, Math.round((processed / totalTargets) * 100))}%`;
  }

  return aggregate;
}

async function scanAndRepairLink(url) {
  const buildCandidates = (target) => {
    const withoutQuery = target.split(/[?#]/)[0];
    const swappedProtocol = target.startsWith("https://") ? target.replace("https://", "http://") : target.replace("http://", "https://");
    const candidates = [target, withoutQuery, swappedProtocol];

    const applyTrivialRewrites = (candidate) => {
      const rewrites = [];
      if (/\.(su)(?=\/|$)/i.test(candidate)) rewrites.push(candidate.replace(/\.(su)(?=\/|$)/i, ".cr"));
      if (/\.(cr)(?=\/|$)/i.test(candidate)) rewrites.push(candidate.replace(/\.(cr)(?=\/|$)/i, ".su"));
      if (/https?:\/\/cdn(\d+)?\./i.test(candidate)) {
        rewrites.push(candidate.replace(/https?:\/\/cdn(\d+)?\./i, (_m, digits) => `https://stream${digits || ""}.`));
      }
      if (/https?:\/\/stream(\d+)?\./i.test(candidate)) {
        rewrites.push(candidate.replace(/https?:\/\/stream(\d+)?\./i, (_m, digits) => `https://cdn${digits || ""}.`));
      }
      if (/cyberdrop\./i.test(candidate) && candidate.includes("/a/")) {
        rewrites.push(candidate.replace("/a/", "/e/"));
      }
      if (/bunkrr?r?\./i.test(candidate) && candidate.includes("/v/")) {
        rewrites.push(candidate.replace("/v/", "/d/"));
      }
      pluginFixers.forEach((fixer) => {
        try {
          const result = fixer(candidate);
          if (Array.isArray(result)) rewrites.push(...result);
          else if (result) rewrites.push(result);
        } catch (error) {
          log.warn?.("plugin", `${HUD_TAG} Plugin fixer failed: ${error}`, "HUD");
        }
      });
      return rewrites;
    };

    for (const candidate of [...candidates]) {
      candidates.push(...applyTrivialRewrites(candidate));
    }

    return h.unique(candidates.filter(Boolean));
  };

  const tryHead = async (target) => {
    try {
      const response = await h.http.gm_promise({ method: "HEAD", url: target, headers: { Referer: window.location.origin } });
      const contentLength = response.responseHeaders?.match(/content-length:\s*(\d+)/i)?.[1];
      return { ok: response.status < 400, status: response.status, url: target, sizeBytes: contentLength ? Number(contentLength) : null };
    } catch (error) {
      return { ok: false, status: "Error", error: error.toString(), url: target };
    }
  };

  const candidates = buildCandidates(url);
  for (const candidate of candidates) {
    const result = await tryHead(candidate);
    if (result.ok) {
      const cachedResult = { url, status: result.status, sizeBytes: result.sizeBytes, size: result.sizeBytes ? h.prettyBytes(result.sizeBytes) : null };
      cacheLinkStatus(url, cachedResult, []);
      cacheLinkStatus(candidate, { ...cachedResult, url: candidate }, []);
      return { original: url, repaired: candidate, status: result.status };
    }
  }
  const finalResult = await tryHead(url);
  cacheLinkStatus(url, { url, status: finalResult.status, error: finalResult.error, sizeBytes: finalResult.sizeBytes, size: finalResult.sizeBytes ? h.prettyBytes(finalResult.sizeBytes) : null }, []);
  return { original: url, repaired: null, status: finalResult.status, error: finalResult.error };
}

const createBulkStatus = () => {
  const { el: statusLabel, container } = ui.labels.status.createStatusLabel();
  const totalPB = ui.pBars.createTotalProgressBar();
  const filePB = ui.pBars.createFileProgressBar("#15fafa");
  const wrapper = document.createElement("div");
  wrapper.append(totalPB, filePB, container);
  return { statusLabel, totalPB, filePB, wrapper };
};

const getResourceType = (url) => {
  const ext = h.ext(url);
  if (!ext) return "other";
  if (settings.extensions.image.includes(ext)) return "image";
  if (settings.extensions.video.includes(ext)) return "video";
  if (settings.extensions.documents.includes(ext)) return "document";
  if (settings.extensions.compressed.includes(ext)) return "compressed";
  return "other";
};

const getFilterLabel = (filter) => {
  const labels = {
    all: "all",
    images: "image",
    videos: "video",
    documents: "document",
    compressed: "compressed",
  };
  return labels[filter] || filter;
};

async function copyAllResolvedUrls(statusContainer, options = {}) {
  const { filter = "all", format = "text" } = options;
  if (!parsedPosts.length) {
    showToast("No posts available to resolve.");
    return;
  }
  statusContainer.innerHTML = "";
  const { statusLabel, totalPB, wrapper } = createBulkStatus();
  statusContainer.appendChild(wrapper);
  h.ui.setText(statusLabel, "Resolving links for clipboard...");

  const resolved = await resolveAllPosts(parsedPosts, statusLabel, totalPB, { respectSkipDuplicates: true });
  const unique = h.unique(resolved.filter((r) => r.url), "url");

  const filtered = unique.filter((r) => {
    const type = getResourceType(r.url);
    if (filter === "all") return true;
    if (filter === "images") return type === "image";
    if (filter === "videos") return type === "video";
    if (filter === "documents") return type === "document";
    if (filter === "compressed") return type === "compressed";
    return true;
  });

  if (!filtered.length) {
    h.ui.setText(statusLabel, `No ${getFilterLabel(filter)} URLs resolved to copy.`);
    log.info("bulk", `${LOG_TAGS.copyAll} No URLs available to copy for filter: ${filter}.`, "HUD");
    return;
  }

  let clipboardPayload = filtered.map((r) => r.url).join("\n");
  const formatLabel = format === "json" ? "JSON" : format === "markdown" ? "Markdown" : "plaintext";

  if (format === "json") {
    clipboardPayload = JSON.stringify(
      filtered.map((r) => ({
        url: r.url,
        type: getResourceType(r.url),
        host: r.host?.name || r.host || null,
        folderName: r.folderName || null,
        original: r.original || null,
      })),
      null,
      2
    );
  } else if (format === "markdown") {
    clipboardPayload = filtered.map((r) => `[${h.basename(r.url)}](${r.url})`).join("\n");
  }

  GM_setClipboard(clipboardPayload);
  h.ui.setText(statusLabel, `Copied ${filtered.length} ${getFilterLabel(filter)} URL(s) as ${formatLabel}.`);
  showToast(`Copied ${filtered.length} URL(s)!`);
  log.info(
    "bulk",
    `${LOG_TAGS.copyAll} Copied ${filtered.length} ${getFilterLabel(filter)} resolved URL(s) as ${formatLabel}`,
    "HUD"
  );
}

const exportModalState = { instance: null };

function closeExportModal() {
  exportModalState.instance?.remove();
  exportModalState.instance = null;
}

function showExportModal(statusContainer) {
  closeExportModal();
  const backdrop = document.createElement("div");
  backdrop.className = "hud-modal-backdrop";
  const modal = document.createElement("div");
  modal.className = "hud-modal";
  modal.innerHTML = `
    <h3>Export Resolved Links</h3>
    <div class="hud-form-row">
      <label for="export-filter">Filter by type</label>
      <select id="export-filter">
        <option value="all">All</option>
        <option value="images">Images only</option>
        <option value="videos">Videos only</option>
        <option value="documents">Documents only</option>
        <option value="compressed">Compressed only</option>
      </select>
    </div>
    <div class="hud-form-row">
      <label for="export-detail">Include</label>
      <select id="export-detail">
        <option value="links">Links only</option>
        <option value="context">Links + Context</option>
        <option value="thumbnails">Links + Thumbnails</option>
      </select>
    </div>
    <div class="hud-form-row">
      <label for="export-format">Format</label>
      <select id="export-format">
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
        <option value="markdown">Markdown</option>
      </select>
    </div>
    <div class="hud-modal-actions">
      <button class="hud-button" id="export-cancel">Cancel</button>
      <button class="hud-btn active" id="export-confirm">Export</button>
    </div>
  `;
  backdrop.appendChild(modal);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeExportModal();
  });
  modal.querySelector("#export-cancel").onclick = closeExportModal;
  modal.querySelector("#export-confirm").onclick = () => {
    const filter = modal.querySelector("#export-filter").value;
    const format = modal.querySelector("#export-format").value;
    const detail = modal.querySelector("#export-detail").value;
    closeExportModal();
    exportResolvedUrls(statusContainer, { filter, format, detail });
  };

  exportModalState.instance = backdrop;
  document.body.appendChild(backdrop);
}

function buildExportRows(resolved, detail) {
  const includeContext = detail !== "links";
  const includeThumbs = detail === "thumbnails";
  return resolved.map((r) => ({
    url: r.url,
    host: includeContext ? r.host?.name || r.host?.id || r.host || null : null,
    postNumber: includeContext ? r.postNumber ?? null : null,
    folderName: includeContext ? r.folderName || null : null,
    original: includeContext ? r.original || null : null,
    thumbnail: includeThumbs ? r.thumbnail || r.thumb || null : null
  }));
}

function exportAsCsv(rows, detail) {
  const includeContext = detail !== "links";
  const includeThumbs = detail === "thumbnails";
  const headers = ["url"];
  if (includeContext) headers.push("host", "postNumber", "folderName", "original");
  if (includeThumbs) headers.push("thumbnail");
  const escapeCell = (cell) => {
    if (cell === null || cell === undefined) return "";
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((key) => escapeCell(row[key] ?? ""));
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

function exportAsMarkdown(rows, detail) {
  const includeContext = detail !== "links";
  const includeThumbs = detail === "thumbnails";
  return rows
    .map((row) => {
      const title = h.basename(row.url) || row.url;
      const thumb = includeThumbs && row.thumbnail ? `![thumb](${row.thumbnail}) ` : "";
      const context = includeContext
        ? ` — host: ${row.host || "unknown"}${row.postNumber ? ` | post #${row.postNumber}` : ""}${
            row.folderName ? ` | folder: ${row.folderName}` : ""
          }`
        : "";
      return `${thumb}- [${title}](${row.url})${context}`;
    })
    .join("\n");
}

function exportAsJson(rows) {
  return JSON.stringify(rows, null, 2);
}

async function exportResolvedUrls(statusContainer, options = {}) {
  const { filter = "all", format = "csv", detail = "links" } = options;
  if (!parsedPosts.length) {
    showToast("No posts available to resolve.");
    return;
  }
  statusContainer.innerHTML = "";
  const { statusLabel, totalPB, wrapper } = createBulkStatus();
  statusContainer.appendChild(wrapper);
  h.ui.setText(statusLabel, "Resolving links for export...");

  const resolved = await resolveAllPosts(parsedPosts, statusLabel, totalPB, { respectSkipDuplicates: true });
  const unique = h.unique(resolved.filter((r) => r.url), "url");

  const filtered = unique.filter((r) => {
    const type = getResourceType(r.url);
    if (filter === "all") return true;
    if (filter === "images") return type === "image";
    if (filter === "videos") return type === "video";
    if (filter === "documents") return type === "document";
    if (filter === "compressed") return type === "compressed";
    return true;
  });

  if (!filtered.length) {
    h.ui.setText(statusLabel, `No ${getFilterLabel(filter)} URLs resolved to export.`);
    log.info("bulk", `${HUD_TAG} No URLs available to export for filter: ${filter}.`, "HUD");
    return;
  }

  const rows = buildExportRows(filtered, detail);
  let payload = "";
  let extension = "txt";
  if (format === "csv") {
    payload = exportAsCsv(rows, detail);
    extension = "csv";
  } else if (format === "markdown") {
    payload = exportAsMarkdown(rows, detail);
    extension = "md";
  } else {
    payload = exportAsJson(rows);
    extension = "json";
  }

  const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
  const filename = `linkmaster-export-${Date.now()}.${extension}`;
  saveAs(blob, filename);
  h.ui.setText(statusLabel, `Exported ${rows.length} ${getFilterLabel(filter)} URL(s) to ${filename}.`);
  showToast("Export complete.");
  log.info("bulk", `${HUD_TAG} Exported ${rows.length} entries as ${format}`, "HUD");
}

async function scanAndRepairResolvedUrls(statusContainer) {
  if (!parsedPosts.length) {
    showToast("No posts available to scan.");
    return;
  }
  statusContainer.innerHTML = "";
  const { statusLabel, totalPB, filePB, wrapper } = createBulkStatus();
  statusContainer.appendChild(wrapper);
  h.ui.setText(statusLabel, "Resolving links for scan...");

  const resolved = await resolveAllPosts(parsedPosts, statusLabel, totalPB, { respectSkipDuplicates: true });
  const unique = h.unique(resolved.filter((r) => r.url), "url");
  if (!unique.length) {
    h.ui.setText(statusLabel, "No URLs found for scanning.");
    log.info("bulk", `${LOG_TAGS.brokenFix} No URLs available to scan.`, "HUD");
    return;
  }

  const repaired = [];
  if (totalPB) totalPB.style.width = "0%";
  for (let i = 0; i < unique.length; i++) {
    const link = unique[i];
    h.ui.setText(statusLabel, `Scanning (${i + 1}/${unique.length}): ${h.limit(link.url, 80)}`);
    const result = await scanAndRepairLink(link.url);
    repaired.push({ ...link, repairedUrl: result.repaired, status: result.status, error: result.error });
    filePB.style.width = `${Math.round(((i + 1) / unique.length) * 100)}%`;
    if (totalPB) totalPB.style.width = `${Math.round(((i + 1) / unique.length) * 100)}%`;
  }

  const successful = repaired.filter((r) => r.repairedUrl);
  if (successful.length) {
    GM_setClipboard(successful.map((r) => r.repairedUrl).join("\n"));
  }
  h.ui.setText(statusLabel, `Scan complete. ${successful.length} repaired / ${unique.length} checked.`);
  showToast(`Scan complete. ${successful.length} fixed link(s).`);
  log.info("bulk", `${LOG_TAGS.brokenFix} Scan/Repair complete: ${successful.length} repaired of ${unique.length}`, "HUD");
  return repaired;
}

function buildVariantLabel(variant) {
  const res = variant.attributes?.RESOLUTION;
  const bandwidth = variant.attributes?.BANDWIDTH;
  const resolution = res ? `${res.width}x${res.height}` : "unknown";
  return `${resolution} @ ${bandwidth ? Math.round(bandwidth / 1000) + "kbps" : "?"}`;
}

function buildFfmpegCommand(url, streamUrl) {
  return `ffmpeg -i "${streamUrl}" -c copy -map 0 -f mp4 "${h.basename(url).replace(/\.m3u8.*/, "") || "stream"}.mp4"`;
}

async function scanM3u8Streams(statusContainer) {
  if (!parsedPosts.length) {
    showToast("No posts available to scan.");
    return;
  }
  statusContainer.innerHTML = "";
  const { statusLabel, totalPB, filePB, wrapper } = createBulkStatus();
  statusContainer.appendChild(wrapper);
  h.ui.setText(statusLabel, "Resolving links for m3u8 scan...");

  const resolved = await resolveAllPosts(parsedPosts, statusLabel, totalPB, { respectSkipDuplicates: true });
  const unique = h.unique(resolved.filter((r) => r.url && r.url.includes(".m3u8")), "url");
  if (!unique.length) {
    h.ui.setText(statusLabel, "No m3u8 URLs found.");
    log.info("bulk", `${LOG_TAGS.m3u8} No m3u8 streams discovered.`, "HUD");
    return;
  }

  const resultsPanel = document.createElement("div");
  resultsPanel.style.marginTop = "0.8em";
  statusContainer.appendChild(resultsPanel);

  for (let i = 0; i < unique.length; i++) {
    const link = unique[i];
    h.ui.setText(statusLabel, `Analyzing (${i + 1}/${unique.length}): ${h.limit(link.url, 80)}`);
    filePB.style.width = `${Math.round(((i + 1) / unique.length) * 100)}%`;
    if (totalPB) totalPB.style.width = `${Math.round(((i + 1) / unique.length) * 100)}%`;

    const entry = document.createElement("div");
    entry.style.border = "1px solid var(--panel-border)";
    entry.style.padding = "0.7em";
    entry.style.borderRadius = "0.7em";
    entry.style.marginBottom = "0.6em";
    entry.innerHTML = `<div style="font-weight:700; font-family: var(--font-hud); margin-bottom: 0.4em;">${h.limit(link.url, 120)}</div>`;

    try {
      const { responseText } = await h.http.gm_promise({ method: "GET", url: link.url, responseType: "text" });
      const Parser = window.m3u8Parser?.Parser || (typeof m3u8Parser !== "undefined" ? m3u8Parser.Parser : null);
      if (!Parser) throw new Error("m3u8 parser unavailable");
      const parser = new Parser();
      parser.push(responseText);
      parser.end();
      const manifest = parser.manifest;
      const playlists = manifest?.playlists || [];
      if (!playlists.length) {
        entry.innerHTML += `<div>No variants found; copied base URL.</div>`;
        const baseCommand = buildFfmpegCommand(link.url, link.url);
        const copyBtn = document.createElement("button");
        copyBtn.className = "hud-btn";
        copyBtn.textContent = "Copy ffmpeg";
        copyBtn.onclick = () => {
          GM_setClipboard(baseCommand);
          showToast("ffmpeg command copied.");
        };
        entry.appendChild(copyBtn);
        resultsPanel.appendChild(entry);
        continue;
      }

      playlists.sort((a, b) => (b.attributes?.BANDWIDTH || 0) - (a.attributes?.BANDWIDTH || 0));
      const defaultVariant = playlists[0];

      const select = document.createElement("select");
      select.style.background = "var(--panel-bg)";
      select.style.color = "var(--text-primary)";
      select.style.border = "1px solid var(--panel-border)";
      select.style.borderRadius = "0.4em";
      select.style.padding = "0.3em";
      select.style.marginRight = "0.5em";

      playlists.forEach((variant, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.textContent = buildVariantLabel(variant);
        select.appendChild(option);
      });

      const copyBtn = document.createElement("button");
      copyBtn.className = "hud-btn";
      copyBtn.textContent = "Copy ffmpeg";

      const updateCommand = () => {
        const chosen = playlists[Number(select.value)] || defaultVariant;
        const streamUrl = new URL(chosen.uri, link.url).toString();
        const cmd = buildFfmpegCommand(link.url, streamUrl);
        copyBtn.onclick = () => {
          GM_setClipboard(cmd);
          showToast("ffmpeg command copied.");
          log.info("bulk", `${LOG_TAGS.m3u8} Copied ffmpeg for ${streamUrl}`, "HUD");
        };
      };

      updateCommand();
      entry.appendChild(select);
      entry.appendChild(copyBtn);
      resultsPanel.appendChild(entry);
    } catch (error) {
      entry.innerHTML += `<div style="color:#ffb3b3;">Error parsing playlist: ${error}</div>`;
      log.warn?.("bulk", `${LOG_TAGS.m3u8} Failed to parse ${link.url}: ${error}`, "HUD");
      resultsPanel.appendChild(entry);
    }
  }

  h.ui.setText(statusLabel, `Analyzed ${unique.length} m3u8 stream(s).`);
  log.info("bulk", `${LOG_TAGS.m3u8} Completed stream analysis for ${unique.length} URLs`, "HUD");
}

async function resolvePostLinks(postData, statusLabel) {
  const { parsedPost, parsedHosts, resolvers, getSettingsCB, enabledHostsCB } = postData;
  const { postId, postNumber } = parsedPost;
  const postSettings = getSettingsCB();
  const enabledHosts = enabledHostsCB(parsedHosts);
  const allResolved = [];

  let hostsToProcess = [...enabledHosts];
  if (globalConfig.enableGenericMediaDetection) {
    const contentRoot = parsedPost.contentContainer || parsedPost.post || document;
    const genericResources = collectGenericMediaResources(contentRoot);
    const hasGenericHost = hostsToProcess.some((host) => host.name === "Generic Media");
    if (genericResources.length && !hasGenericHost) {
      hostsToProcess = hostsToProcess.concat(buildGenericMediaHost(postId, genericResources));
      log.info(postId, `${HUD_TAG} Added ${genericResources.length} generic media source(s)`, "HUD");
    }
  }

  for (const host of hostsToProcess.filter(h => h.resources.length)) {
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
              const baseItem = h.isObject(url) ? url : { url, folderName };
              const item = {
                ...baseItem,
                host,
                original: baseItem.original || resource,
                folderName: baseItem.folderName ?? folderName ?? null,
                postId,
                postNumber
              };
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
    cacheResolvedLinks(postId, allResolved);
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
  const sanitizePath = (value) => value.replace(/[\p{Cc}\p{Cs}<>:"/\\|?*]/gu, "_");

  if (!postSettings.skipDownload) {
    const resources = resolved.filter((r) => r.url);
    const filenames = []; // To track filenames and avoid duplicates
    const downloadPromises = resources.map(async ({ url, original, folderName }) => {
      const ellipsedUrl = h.limit(url, 60);
        try {
          const response = await h.http.gm_promise({
            method: "GET",
            url,
            headers: { Referer: original },
            responseType: "blob",
            onprogress: (e) => {
              h.ui.setText(statusLabel, `${completed}/${totalDownloadable} | ${h.prettyBytes(e.loaded)} / ${e.total ? h.prettyBytes(e.total) : "?"} | ${ellipsedUrl}`);
              if (e.total > 0) h.ui.setElProps(filePB, { width: `${(e.loaded / e.total) * 100}%` });
            }
          });

          let basename = h.generateFilename(url, response.responseHeaders);
          const originalBase = basename;
          let count = 2;
          while (filenames.includes(basename)) {
            const ext = h.ext(originalBase);
            basename = `${h.fnNoExt(originalBase)} (${count++})${ext ? `.${ext}` : ""}`;
          }
          filenames.push(basename);

          let fn = basename;
          if (!postSettings.flatten && folderName) fn = `${sanitizePath(folderName)}/${basename}`;
          fn = sanitizePath(fn);

          if (isFF || postSettings.zipped) {
            zip.file(fn, response.response);
          } else {
            const blobUrl = URL.createObjectURL(response.response);
            GM_download({ url: blobUrl, name: `${sanitizePath(threadTitle)}/${fn}`, onload: () => URL.revokeObjectURL(blobUrl) });
          }
        } catch (error) {
          log.post.error(postId, `Failed to download ${url}: ${error}`, postNumber);
        } finally {
          completed++;
          h.ui.setElProps(totalPB, { width: `${(completed / totalDownloadable) * 100}%` });
        }
      });
      await Promise.all(downloadPromises);

    } else {
    log.post.info(postId, "::Skipping download as per settings::", postNumber);
  }

  h.ui.setText(statusLabel, "Finalizing package...");

  if (totalDownloadable > 0 && (postSettings.zipped || postSettings.generateLinks || postSettings.generateLog)) {
    const title = sanitizePath(threadTitle);
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

(function () {
  "use strict";
  let currentTab = "scrape";
  const quickFilterState = { query: "", regex: false, type: "all", status: "any", minSize: null };

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
    .hud-modal-backdrop{position:fixed;inset:0;z-index:calc(var(--hud-z)+500);background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;}
    .hud-modal{background:var(--panel-bg-solid);border:2px solid var(--panel-border);box-shadow:0 0 24px var(--panel-glow-intense);border-radius:1em;padding:1.4em;min-width:360px;max-width:90vw;color:var(--text-primary);font-family:var(--font-body);}
    .hud-modal h3{margin:0 0 0.9em 0;font-family:var(--font-hud);letter-spacing:0.08em;color:var(--primary-cyan);}
    .hud-modal .hud-form-row{display:flex;flex-direction:column;gap:0.35em;margin-bottom:0.9em;font-size:0.95em;}
    .hud-modal label{color:var(--text-secondary);}
    .hud-modal select{background:var(--panel-bg);color:var(--text-primary);border:1.5px solid var(--panel-border);border-radius:0.5em;padding:0.45em;}
    .hud-modal .hud-modal-actions{display:flex;gap:0.6em;justify-content:flex-end;margin-top:0.4em;}
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

  const renderQuickFilterResults = async () => {
    const resultsPanel = document.getElementById("quick-filter-results");
    if (!resultsPanel) return;
    const summaryEl = document.getElementById("quick-filter-count");
    let resolved = getAggregatedResolved();
    if (!resolved.length && parsedPosts.length) {
      resultsPanel.innerHTML = "";
      const { statusLabel, totalPB, wrapper } = createBulkStatus();
      resultsPanel.appendChild(wrapper);
      await resolveAllPosts(parsedPosts, statusLabel, totalPB, { respectSkipDuplicates: true });
      resolved = getAggregatedResolved();
    }

    if (!resolved.length) {
      resultsPanel.innerHTML = "<p style=\"color: var(--text-secondary);\">No resolved links available yet.</p>";
      if (summaryEl) summaryEl.textContent = "0 matches";
      return;
    }

    let regex = null;
    if (quickFilterState.regex && quickFilterState.query) {
      try {
        regex = new RegExp(quickFilterState.query, "i");
      } catch (error) {
        resultsPanel.innerHTML = `<div style="color:#ffb3b3;">Invalid regex: ${error.message}</div>`;
        if (summaryEl) summaryEl.textContent = "0 matches";
        return;
      }
    }

    const minBytes = quickFilterState.minSize;
    const filtered = resolved.filter((entry) => {
      const cached = linkStatusCache.get(entry.url);
      if (!matchesStatusFilter(quickFilterState.status, cached?.status ?? "unknown")) return false;
      if (quickFilterState.type !== "all" && determineLinkType(entry.url) !== quickFilterState.type) return false;
      if (quickFilterState.query) {
        if (regex && !regex.test(entry.url)) return false;
        if (!regex && !entry.url.toLowerCase().includes(quickFilterState.query.toLowerCase())) return false;
      }
      if (minBytes && (!cached?.sizeBytes || cached.sizeBytes < minBytes)) return false;
      return true;
    });

    if (summaryEl) summaryEl.textContent = `${filtered.length} match${filtered.length === 1 ? "" : "es"}`;
    if (!filtered.length) {
      resultsPanel.innerHTML = "<p style=\"color: var(--text-secondary);\">No links match the current filters.</p>";
      return;
    }

    const rows = filtered.slice(0, 150).map((entry) => {
      const cached = linkStatusCache.get(entry.url);
      const statusChip = buildStatusChip(cached?.status ?? "unknown");
      const typeLabel = determineLinkType(entry.url);
      const sizeLabel = cached?.size || (cached?.sizeBytes ? h.prettyBytes(cached.sizeBytes) : "N/A");
      return `<div style="margin-bottom:0.4em;">${statusChip} <span class="chip">${typeLabel}</span> <a href="${entry.url}" target="_blank" style="color: var(--text-secondary);">${h.limit(entry.url, 120)}</a> <span style="color: var(--text-secondary); font-size:0.9em;">${sizeLabel}</span></div>`;
    });

    if (filtered.length > 150) {
      rows.push(`<div style="color: var(--text-secondary);">Showing first 150 of ${filtered.length} results.</div>`);
    }
    resultsPanel.innerHTML = rows.join("");
  };

  const bindQuickFilterHandlers = (contentPanel) => {
    const queryInput = contentPanel.querySelector('#quick-filter-query');
    const regexToggle = contentPanel.querySelector('#quick-filter-regex');
    const typeSelect = contentPanel.querySelector('#quick-filter-type');
    const statusSelect = contentPanel.querySelector('#quick-filter-status');
    const sizeInput = contentPanel.querySelector('#quick-filter-size');

    const handler = () => {
      quickFilterState.query = queryInput?.value || "";
      quickFilterState.regex = !!regexToggle?.checked;
      quickFilterState.type = typeSelect?.value || "all";
      quickFilterState.status = statusSelect?.value || "any";
      quickFilterState.minSize = parseSizeInput(sizeInput?.value || "");
      renderQuickFilterResults();
    };

    [queryInput, regexToggle, typeSelect, statusSelect, sizeInput].forEach((el) => {
      if (!el) return;
      el.oninput = handler;
      el.onchange = handler;
    });
    handler();
  };

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
      <div style="display: flex; gap: 0.8em; align-items: center; margin: -0.4em 0 0.9em 0; flex-wrap: wrap;">
          <button id="copy-all-urls" class="hud-btn">📋 Copy All URLs</button>
          <label style="display:flex; align-items:center; gap:6px; font-size: 0.9em; color: var(--text-secondary);">
            Filter:
            <select id="copy-filter" style="background: var(--panel-bg-solid); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 6px; padding: 0.3em 0.5em;">
              <option value="all">All</option>
              <option value="images">Images only</option>
              <option value="videos">Videos only</option>
              <option value="documents">Documents only</option>
              <option value="compressed">Compressed only</option>
            </select>
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size: 0.9em; color: var(--text-secondary);">
            Format:
            <select id="copy-format" style="background: var(--panel-bg-solid); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 6px; padding: 0.3em 0.5em;">
              <option value="text">Plaintext</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
          <button id="export-resolved" class="hud-btn">📤 Export</button>
          <button id="scan-repair-urls" class="hud-btn">🔧 Scan/Repair URLs</button>
          <button id="scan-streams" class="hud-btn">📡 Scan Streams</button>
          <div id="bulk-status" style="flex:1; min-height: 32px;"></div>
      </div>
      <div id="quick-filter-bar" style="display:flex; gap:0.6em; align-items:center; flex-wrap:wrap; padding:0.75em 0.9em; background: rgba(16,24,39,0.65); border:1px solid var(--panel-border); border-radius:0.9em; margin-bottom:0.7em;">
          <strong style="font-family: var(--font-hud); letter-spacing:0.05em;">Quick Filter</strong>
          <input id="quick-filter-query" type="text" placeholder="Substring or regex" style="flex:1; min-width:140px; background: var(--panel-bg-solid); border:1px solid var(--panel-border); border-radius:0.5em; color: var(--text-primary); padding:0.45em;" />
          <label style="display:flex; align-items:center; gap:5px; color:var(--text-secondary); font-size:0.92em;"><input type="checkbox" id="quick-filter-regex">Regex</label>
          <label style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:0.92em;">Type
            <select id="quick-filter-type" style="background: var(--panel-bg-solid); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 6px; padding: 0.3em 0.5em;">
              <option value="all">All</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="documents">Documents</option>
              <option value="compressed">Compressed</option>
            </select>
          </label>
          <label style="display:flex; align-items:center; gap:6px; color:var(--text-secondary); font-size:0.92em;">Status
            <select id="quick-filter-status" style="background: var(--panel-bg-solid); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 6px; padding: 0.3em 0.5em;">
              <option value="any">All</option>
              <option value="good">Good</option>
              <option value="bad">Bad</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <input id="quick-filter-size" type="text" placeholder="Min size (e.g., 5MB)" style="width: 160px; background: var(--panel-bg-solid); border:1px solid var(--panel-border); border-radius:0.5em; color: var(--text-primary); padding:0.45em;">
          <span id="quick-filter-count" style="margin-left:auto; color: var(--text-secondary); font-size:0.9em;">Ready</span>
      </div>
      <div id="quick-filter-results" style="margin-bottom: 0.8em; word-break: break-all;"></div>
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
          <span id="status-chip-${parsedPost.postId}" class="chip unknown" style="margin-left:auto;">Unknown</span>
          <span class="chip">${totalResources} links</span>
        </div>
        <div id="status-area-${parsedPost.postId}" style="margin-top: 0.8em;"></div>`;

      const btnDownloadPost = document.createElement("button");
      btnDownloadPost.className = "hud-btn";
      btnDownloadPost.innerHTML = `<span>🡳 Configure & Download (${totalDownloadable()}/${totalResources})</span>`;
      postEntryDiv.insertBefore(btnDownloadPost, postEntryDiv.querySelector(`#status-area-${parsedPost.postId}`));

      postsContainer.appendChild(postEntryDiv);
      updatePostStatusChip(parsedPost.postId);

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
    const bulkStatus = contentPanel.querySelector('#bulk-status');
    const copyFilterSelect = contentPanel.querySelector('#copy-filter');
    const copyFormatSelect = contentPanel.querySelector('#copy-format');
    contentPanel.querySelector('#copy-all-urls').onclick = () => copyAllResolvedUrls(bulkStatus, {
      filter: copyFilterSelect?.value || "all",
      format: copyFormatSelect?.value || "text",
    });
    contentPanel.querySelector('#export-resolved').onclick = () => showExportModal(bulkStatus);
    contentPanel.querySelector('#scan-repair-urls').onclick = () => scanAndRepairResolvedUrls(bulkStatus);
    contentPanel.querySelector('#scan-streams').onclick = () => scanM3u8Streams(bulkStatus);
    bindQuickFilterHandlers(contentPanel);
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
        <div style="margin-top:0.8em; display:flex; gap:0.6em; align-items:center;">
            <label style="color: var(--text-secondary);">Status Filter
              <select id="check-status-filter" style="background: var(--panel-bg-solid); color: var(--text-primary); border: 1.5px solid var(--panel-border); border-radius: 0.5em; padding: 0.25em 0.4em;">
                <option value="any">All</option>
                <option value="good">Good</option>
                <option value="bad">Bad</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
        </div>
        <div id="check-results" style="margin-top: 1.5em; word-break: break-all;"></div>`;

    if (parsedPosts.length > 0) {
      contentPanel.querySelector('#check-select-all').onclick = () => contentPanel.querySelectorAll('.check-post-select').forEach(cb => cb.checked = true);
      contentPanel.querySelector('#check-select-none').onclick = () => contentPanel.querySelectorAll('.check-post-select').forEach(cb => cb.checked = false);
      contentPanel.querySelector('#check-scraped-btn').onclick = startLinkCheck;
    }
    contentPanel.querySelector('#check-pasted-btn').onclick = startLinkCheck;
    const statusFilter = contentPanel.querySelector('#check-status-filter');
    if (statusFilter) statusFilter.onchange = () => renderCheckResults();
  }

  async function startLinkCheck(event) {
    const resultsPanel = document.getElementById('check-results');
    resultsPanel.innerHTML = 'Resolving links...';
    let linksToCheck = [];
    const isPasted = event.target.id === 'check-pasted-btn';
    const linkPostMap = new Map();

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
        if (postData) {
          const resolved = await resolvePostLinks(postData);
          resolvedLinks.push(...resolved);
          resolved.forEach((link) => {
            const holders = linkPostMap.get(link.url) || new Set();
            holders.add(postData.parsedPost.postId);
            linkPostMap.set(link.url, holders);
          });
        }
      }
      linksToCheck = h.unique(resolvedLinks, 'url').map(l => l.url);
    }

    if (linksToCheck.length === 0) {
      resultsPanel.innerHTML = 'No links to check.';
      return;
    }
    resultsPanel.innerHTML = `Checking ${linksToCheck.length} unique links...`;

    const results = await Promise.all(linksToCheck.map(url => checkLinkStatus(url, [...(linkPostMap.get(url) || [])])));
    lastCheckResults = results;
    renderCheckResults();
  }

  async function checkLinkStatus(url, postIds = []) {
    try {
      const response = await h.http.gm_promise({ method: 'HEAD', url: url, headers: { 'Referer': window.location.origin } });
      const contentType = response.responseHeaders.match(/content-type:\s*(.*)/i)?.[1] || 'N/A';
      const contentLength = response.responseHeaders.match(/content-length:\s*(\d+)/i)?.[1];
      const result = { url, status: response.status, contentType, size: contentLength ? h.prettyBytes(Number(contentLength)) : 'N/A', sizeBytes: contentLength ? Number(contentLength) : null, postIds };
      cacheLinkStatus(url, result, postIds);
      return result;
    } catch (error) {
      const result = { url, status: 'Error', error: error.toString(), postIds };
      cacheLinkStatus(url, result, postIds);
      return result;
    }
  }

  function renderCheckResults(results) {
    if (results) lastCheckResults = results;
    const resultsPanel = document.getElementById('check-results');
    if (!resultsPanel) return;
    const filter = document.getElementById('check-status-filter')?.value || 'any';
    const activeResults = (results || lastCheckResults || []).filter((res) => matchesStatusFilter(filter, res.status));

    if (!activeResults.length) {
      resultsPanel.innerHTML = '<p style="color: var(--text-secondary);">No results yet. Run a check to populate link statuses.</p>';
      return;
    }

    let html = '<h3>Check Complete</h3>';
    activeResults.forEach(res => {
      const statusChip = buildStatusChip(res.status);
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
            <div>
              <label for="plugin-sources" style="display:block; margin-bottom: 0.5em; font-family: var(--font-hud);">Plugin Sources (one per line)</label>
              <textarea id="plugin-sources" style="width: 100%; min-height: 90px; background: #0A131A; border: 1.5px solid var(--panel-border); color: var(--text-primary); padding: 0.5em; border-radius: 0.4em; resize: vertical;">${(globalConfig.pluginSources || []).join("\n")}</textarea>
              <small style="color: var(--text-secondary);">Add URLs for external LinkMasterΨ2 plugins or paste inline definitions. Plugins load without updating the main script.</small>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em;">
                <label><input type="checkbox" id="setting-zipped" ${globalConfig.defaultZipped ? 'checked' : ''}> Default to Zipped</label>
                <label><input type="checkbox" id="setting-flatten" ${globalConfig.defaultFlatten ? 'checked' : ''}> Default to Flatten</label>
                <label><input type="checkbox" id="setting-gen-links" ${globalConfig.defaultGenerateLinks ? 'checked' : ''}> Default to Generate links.txt</label>
                <label><input type="checkbox" id="setting-gen-log" ${globalConfig.defaultGenerateLog ? 'checked' : ''}> Default to Generate log.txt</label>
                <label><input type="checkbox" id="setting-skip-dupes" ${globalConfig.defaultSkipDuplicates ? 'checked' : ''}> Default to Skip Duplicates</label>
                <label><input type="checkbox" id="setting-generic-media" ${globalConfig.enableGenericMediaDetection ? 'checked' : ''}> Enable Generic Media Detection</label>
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
      globalConfig.enableGenericMediaDetection = contentPanel.querySelector('#setting-generic-media').checked;
      globalConfig.pluginSources = contentPanel
        .querySelector('#plugin-sources')
        .value.split('\n')
        .map((src) => src.trim())
        .filter(Boolean);
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
      enableGenericMediaDetection: false,
      pluginSources: [],
    };
    Object.assign(globalConfig, defaults, saved ? JSON.parse(saved) : {});
  }

  const processPost = (post) => {
    if (post.dataset.linkmasterProcessed) return false;
    const parsedPost = parsers.thread.parsePost(post);
    if (!parsedPost) return false;

    const targetPost = parsedPost.post || post;
    if (targetPost.dataset.linkmasterProcessed) return false;

    let parsedHosts = parsers.hosts.parseHosts(parsedPost.content);
    if (!parsedHosts.length && globalConfig.enableGenericMediaDetection && parsedPost.contentContainer) {
      const genericResources = collectGenericMediaResources(parsedPost.contentContainer);
      if (genericResources.length) {
        parsedHosts = [buildGenericMediaHost(parsedPost.postId, genericResources)];
        log.info(parsedPost.postId, `${HUD_TAG} Added generic media fallback for post`, "HUD");
      }
    }
    if (!parsedHosts.length) return false;

    targetPost.dataset.linkmasterProcessed = "true";
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
    resetResolvedCache();
    return true;
  };

  const start = async () => {
    loadSettings();
    await initPlugins();
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
      const forumPostSelector = "article.CommentPost.Post, .message-attribution-opposite";
      const processPostsInNode = (node, tracker) => {
        if (node.matches && node.matches(forumPostSelector)) {
          if (processPost(node)) tracker.processed = true;
        }
        node.querySelectorAll?.(forumPostSelector).forEach((p) => {
          if (processPost(p)) tracker.processed = true;
        });
      };
      const observer = new MutationObserver((mutations) => {
        const tracker = { processed: false };
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) processPostsInNode(node, tracker);
            });
          }
        });
        if (tracker.processed) {
          const hudPanel = document.getElementById("hud-panel-root");
          if (hudPanel && !hudPanel.hidden) {
            setHudTab(currentTab);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      let initialPostsFound = 0;
      document.querySelectorAll(forumPostSelector).forEach((p) => {
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
        resetResolvedCache();
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
