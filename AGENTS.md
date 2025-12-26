# AGENTS.md

## Agent Directive: Adapt `LinkMasterΨ2` for `forum.candidshiny.com`

### Objective
Update the `LinkMasterΨ2` userscript so that it fully supports scraping, previewing, checking, repairing, and downloading links from posts on `forum.candidshiny.com` (a Flarum-based forum). Maintain full feature parity with the existing functionality.

### Scope
The agent must:

1. Detect and process all posts in the forum thread.
2. Parse media links from each post.
3. Populate the HUD correctly for:
   - Scrape panel
   - Check panel
   - Export / Copy All URLs
   - Scan / Repair URLs
   - m3u8 stream analysis
4. Ensure plugin fixers and generic media detection are fully functional.

### Technical Details

#### 1. Post Detection
- Current `LinkMasterΨ2` targets `.message-attribution-opposite`.
- On `forum.candidshiny.com`, posts use:
  ```html
  <article class="CommentPost Post Post--by-start-user">

	•	Task: Update post selection to:

document.querySelectorAll("article.CommentPost.Post")



2. Post Content
	•	The content container is .Post-body.
	•	Update parsers.thread.parsePost to select:

const messageContent = post.querySelector(".Post-body");



3. Footer & Actions
	•	Update references to footer and actions for compatibility:

const footer = post.querySelector(".Post-footer");
const actions = post.querySelector(".Post-actions"); // optional for buttons



4. Spoilers & Embedded Media
	•	Verify and adjust selectors for:
	•	spoilers
	•	embedded images/videos
	•	links hidden within HTML elements specific to candidshiny
	•	Ensure parsing does not remove necessary elements.

5. Generic Media Detection
	•	Enable automatic detection of <video> and <audio> elements within .Post-body for posts that lack host-specific resolvers.

6. Post Mutation Handling
	•	Update MutationObserver for dynamically loaded posts:

observer.observe(document.body, { childList: true, subtree: true });


	•	Ensure new posts added to the DOM are automatically processed and HUD updates correctly.

7. HUD Integration
	•	All panels, buttons, and tooltips must work without modification.
	•	Existing download logic, status chips, copy/export, m3u8 scanning, and repair functionality must integrate seamlessly.

Deliverables
	1.	Fully updated parsers.thread.parsePost function tailored to forum.candidshiny.com.
	2.	Adjusted post detection logic for initial load and dynamically appended posts.
	3.	Verified integration with:
	•	resolvePostLinks
	•	downloadPost
	•	scanAndRepairResolvedUrls
	•	scanM3u8Streams
	•	copyAllResolvedUrls and exportResolvedUrls
	4.	All updates should preserve backward compatibility for other supported forums.

Constraints
	•	Do not remove any existing features.
	•	Ensure all async operations (HTTP requests, parsing, resolving) remain properly awaited and HUD progress bars update accurately.
	•	Maintain all plugin loading and fixer logic.

Success Criteria
	•	All posts on forum.candidshiny.com are detected and parsed correctly.
	•	Media links within posts are detected, categorized, and available for all HUD features.
	•	Download, check, copy/export, and scan/repair features function without errors.
	•	Generic media detection works for uncategorized media.
	•	HUD remains fully interactive and responsive.

