# Codex Work Order: LinkMasterΨ2 Flarum & General Media Scrape Fix

## Objective
Enhance the existing `4ndr0tools - LinkMasterΨ2` userscript to correctly detect posts and collect media on **forum.candidshiny.com** (Flarum) and improve general media scraping across arbitrary pages.

---

## Tasks

### 1. Post Detection Fix
- Update `processPost` to reliably detect Flarum posts:
  - Selector: `"article.CommentPost.Post"`
  - Include `closest` fallback for dynamically nested elements.
- Ensure `MutationObserver` triggers after dynamically loaded posts:
  - Use `{ childList: true, subtree: true }` configuration.
  - Add a small delay or `requestIdleCallback` to allow client-side rendering.
- After detecting a post:
  - Immediately reset resolved cache: `resetResolvedCache()`.
  - Trigger HUD refresh if open: `setHudTab(currentTab)`.

---

### 2. Generic Media Collection
- Expand `collectGenericMediaResources`:
  - Accept `parsedPost.contentContainer` or fallback to the `post` node.
  - Detect `<video>`, `<audio>` tags and their `<source>` children.
  - Detect `<a>` tags with extensions `.mp4`, `.webm`, `.mp3`, `.jpg`, `.jpeg`, `.png`, `.gif`.
- Ensure generic resources are appended to `parsedHosts` with proper folder names.
- Log number of generic media resources detected per post for debug.

---

### 3. HTML Parsing Improvements
- In `parsePost`:
  - Ensure `.Post-body` exists and includes inner content.
  - Avoid stripping `.Post-actions` or other nested nodes prematurely.
- Adjust `collectSpoilers` to handle shadow DOM or deeply nested elements.
- Confirm that parsed post includes `postId`, `postNumber`, `contentContainer`.

---

### 4. General Mode Improvements
- For pages in general mode:
  - Parse `document.body.innerHTML` to detect any media `<a>` links and `<video>/<audio>` sources.
  - Include generic fallback host with type `"Links"`.
  - Populate a virtual post object to feed into `parsedPosts`.
- Update HUD after adding virtual general mode post.

---

### 5. HUD & Scrape Tab Updates
- Ensure scrape tab immediately refreshes after post detection.
- Bind resolved links and generic resources to HUD elements.
- Verify `parsedPosts` contains posts with resolved links and hosts.
- Include logging of parsed posts count and detected hosts.

---

### 6. Debugging & Logging
- Insert console logs:
  - Post processed: `console.log("Processing postId:", parsedPost?.postId, "hosts:", parsedHosts.length);`
  - Content container snapshot: `console.log(parsedPost.contentContainer?.innerHTML.slice(0,200));`
  - Generic resources found: `console.log("Generic resources found:", genericResources);`
- Ensure MutationObserver fires for dynamically added nodes.

---

### Deliverables
- Updated `processPost` and `collectGenericMediaResources` functions.
- MutationObserver configured to handle dynamically loaded posts.
- HUD refresh logic after post detection.
- Properly appended generic media resources.
- Debug logging for all new detection steps.
- Full compatibility with `forum.candidshiny.com` and general mode pages.

---

### Notes
- Maintain existing LinkMasterΨ2 functionality for all other hosts and resolvers.
- Do not remove any preexisting parsing, resolver, or HUD logic.
- Ensure any async operations are properly awaited.
- Preserve strict Type/Host/Resolved tracking in `parsedPosts`.
- Provide comments in code explaining each enhancement for academic traceability.