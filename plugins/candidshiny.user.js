// ==UserScript==
// @name         LinkMasterΨ2 – CandidShiny Dynamic Loader
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.2.0
// @description  Correctly parse forum.candidshiny.com threads with dynamic content
// ==/UserScript==

(function () {
  "use strict";

  const plugin = {
    name: "Forum.CandidShiny",
    hosts: [
      ["CandidShiny:Attachments", [ /https?:\/\/forum\.candidshiny\.com\/attachments\/.+/i ]]
    ],
    resolvers: [
      [
        [ /https?:\/\/forum\.candidshiny\.com\/attachments\/.+/i ],
        async (url, http) => {
          try {
            const { status } = await http.gm_promise({ method: "HEAD", url });
            return status < 400 ? url : null;
          } catch {
            return null;
          }
        }
      ]
    ],
    parsePosts: (root) => {
      const postEls = root.querySelectorAll("article.message, .message");
      const posts = [];
      postEls.forEach(el => {
        const postId = el.dataset.postId || el.id;
        if (!postId) return;
        const postNumber = el.querySelector(".message-number")?.innerText.replace("#", "").trim() || postId;
        const contentContainer = el.querySelector(".bbWrapper, .message-content") || el;
        const spoilers = [...el.querySelectorAll(".spoiler")].map(s => s.innerText.trim());
        posts.push({
          post: el,
          postId,
          postNumber,
          content: contentContainer.innerHTML,
          textContent: contentContainer.innerText,
          spoilers,
          contentContainer
        });
      });
      return posts;
    }
  };

  const observePosts = () => {
    const threadContainer = document.querySelector("#js-thread-content, .structItemContainer");
    if (!threadContainer) return;
    const observer = new MutationObserver(() => {
      if (window.registerPlugin) window.registerPlugin(plugin);
      else window.LinkMasterPlugins = window.LinkMasterPlugins || [];
      if (!window.LinkMasterPlugins.includes(plugin)) window.LinkMasterPlugins.push(plugin);
    });
    observer.observe(threadContainer, { childList: true, subtree: true });
  };

  observePosts();
})();