// ==UserScript==
// @name         LinkMasterΨ2 – Forum.CandidShiny Full Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.1.0
// @description  Full parser and resolver for forum.candidshiny.com posts
// @author       4ndr0666
// ==/UserScript==

(function () {
  "use strict";

  const CandidShinyPlugin = {
    name: "Forum.CandidShiny",
    hosts: [
      [
        "CandidShiny:Images",
        [ /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.*\.(jpg|jpeg|png|gif)/i ]
      ],
      [
        "CandidShiny:Videos",
        [ /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.*\.(mp4|webm|mov)/i ]
      ]
    ],
    resolvers: [
      [
        [ /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.+/i ],
        async (url, http, spoilers, postId) => {
          try {
            const { status } = await http.gm_promise({ method: "HEAD", url });
            if (status < 400) return url;
            return null;
          } catch {
            return null;
          }
        }
      ]
    ],
    fixers: [
      (url) => url.includes("http://") ? url.replace("http://", "https://") : url
    ],
    parsePosts: (root) => {
      // Select all posts in CandidShiny threads
      const postElements = root.querySelectorAll("article.message, .message");
      const posts = [];
      postElements.forEach((el) => {
        const postId = el.dataset.postId || el.id || null;
        if (!postId) return;

        const postNumber = el.querySelector(".message-number")?.innerText.replace("#", "").trim() || postId;
        const content = el.querySelector(".bbWrapper, .message-content")?.innerHTML || "";
        const spoilers = [...el.querySelectorAll(".spoiler")].map(s => s.innerText.trim());

        posts.push({
          post: el,
          postId,
          postNumber,
          content,
          textContent: el.innerText,
          spoilers,
          contentContainer: el
        });
      });
      return posts;
    }
  };

  // Register plugin with LinkMasterΨ2
  if (window.registerPlugin) window.registerPlugin(CandidShinyPlugin);
  else window.LinkMasterPlugins = window.LinkMasterPlugins || [];
  window.LinkMasterPlugins.push(CandidShinyPlugin);
})();