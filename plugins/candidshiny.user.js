// ==UserScript==
// @name         LinkMasterΨ2 – Forum.CandidShiny Plugin
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.0.0
// @description  Plugin for LinkMasterΨ2 to parse and resolve media links on forum.candidshiny.com
// @author       4ndr0666
// ==/UserScript==

(function () {
  "use strict";

  const CandidShinyPlugin = {
    name: "Forum.CandidShiny",
    hosts: [
      [
        "CandidShiny:Images",
        [
          /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.*\.(jpg|jpeg|png|gif)/i
        ]
      ],
      [
        "CandidShiny:Videos",
        [
          /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.*\.(mp4|webm|mov)/i
        ]
      ]
    ],
    resolvers: [
      [
        [ /https?:\/\/forum\.candidshiny\.com\/attachments\/[a-zA-Z0-9_-]+\/.+/i ],
        async (url, http, spoilers, postId) => {
          // Use HEAD request to validate and return direct URL
          try {
            const { ok, status } = await (async () => {
              try {
                const resp = await http.gm_promise({ method: "HEAD", url });
                return { ok: resp.status < 400, status: resp.status };
              } catch {
                return { ok: false, status: "Error" };
              }
            })();
            if (ok) return url;
            return null;
          } catch (e) {
            console.error(`[Forum.CandidShiny Plugin] Failed to resolve ${url}: ${e}`);
            return null;
          }
        }
      ]
    ],
    fixers: [
      (url) => {
        // Handle https/http or cdn variations
        if (url.includes("http://")) return url.replace("http://", "https://");
        return url;
      }
    ]
  };

  // Register plugin with LinkMasterΨ2
  if (window.registerPlugin) window.registerPlugin(CandidShinyPlugin);
  else window.LinkMasterPlugins = window.LinkMasterPlugins || [];
  window.LinkMasterPlugins.push(CandidShinyPlugin);
})();