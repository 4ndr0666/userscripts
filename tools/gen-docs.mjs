#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
 * tools/gen-docs.mjs — deterministic per-script documentation generator
 * ----------------------------------------------------------------------------
 * Suite v1.4.2: the operator's documentation mandate — every dist script gets
 * coinciding docs. Prose is curated in the KNOWLEDGE map below (single
 * source, versioned with the repo); every volatile datum (version, matches,
 * grants, hotkey census, lineage evidence) is read LIVE from the repo state,
 * so re-running `npm run docs` after any bump keeps the docs truthful.
 *
 * Outputs:
 *   documentation/<slug>/README.md  — one reference per script
 *   documentation/INDEX.md          — master catalog grouped by family
 *
 * Hand-written deep devlogs (bunkr, hailuo++, m3u8++) are never overwritten —
 * they are linked from the INDEX only.
 * ═════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCensus } from "./hotkey-census.mjs";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const INV = JSON.parse(fs.readFileSync(path.join(ROOT, "inventory.json"), "utf8"));
const EVIDENCE = JSON.parse(fs.readFileSync(path.join(ROOT, "canon", "EVIDENCE.json"), "utf8"));
const DOCS_DIR = path.join(ROOT, "documentation");

/* ── Curated knowledge map ─────────────────────────────────────────────────
 * key = inventory script name. `documented: true` = an existing hand-written
 * devlog owns the directory; the generator links but never touches it. */
const KNOWLEDGE = {
    "4ndr0tools - 4ndr0Purge": {
        slug: "4ndr0purge",
        tagline: "One-click session annihilation",
        mission: "4ndr0Purge is the suite's scorched-earth reset button: a single menu command that destroys the current site's entire client-side session — cookies, localStorage, sessionStorage, IndexedDB, cache storage, and any registered service worker. Use it when a site has poisoned its own state (broken paywall counters, hostile A/B flags, wedged SPAs, dead SW caches) and a plain refresh is not enough. It is deliberately universal and deliberately dumb: no allowlists, no confirmation dialogs beyond the manager's own menu click — the operator asked for a nuke, so it nukes.",
        features: [
            "Cookie jar wipe (document.cookie + CookieStore when available)",
            "localStorage / sessionStorage clear with quota verification",
            "IndexedDB deletion across every named database",
            "Cache Storage and service-worker registration teardown",
            "Manager menu integration — works on ANY site, no UI chrome",
        ],
        settings: "None — stateless by design. The tool's whole value is having nothing to configure or remember.",
    },
    "4ndr0tools - 4ndr0serviceguard Companion": {
        slug: "4ndr0serviceguard-companion",
        tagline: "Default-deny worker firewall (extension companion)",
        mission: "The Companion is the userscript wing of the 4ndr0serviceguard extension: a stealth Service Worker / WebSocket / SharedWorker firewall that runs where the extension cannot. Every worker or socket a page tries to open is matched against three lists and gets exactly one of three fates — AUTHORIZE (a real, visible connection), SPOOF (a pacified, live-looking socket that answers the page's pings while going nowhere), or DENY (a native-faithful failure the page cannot distinguish from a network error). When the extension's Gatekeeper is present on the same page the Companion defers to it and routes list edits through its confirm bar, so the two never fight over jurisdiction.",
        features: [
            "Default-deny interception of Service Worker, WebSocket, and SharedWorker construction",
            "Three-way action model: AUTHORIZE / SPOOF / DENY",
            "Whitelist (authorize), spooflist (silent pacification), blacklist (absolute prohibition)",
            "Gatekeeper deferral — the extension wins whenever it is present",
            "Notification surface for adjudication events",
            "v7.4.0: sandboxed-frame resilience — privileged API captures route through safeGet() so opaque-origin documents never kill the gate",
        ],
        settings: "Whitelist / spooflist / blacklist are persisted through GM storage and editable from the manager menu. Edits route through the extension's confirm bar when the Gatekeeper is live.",
        notes: "v7.4.0 (operator round): a document inside <iframe sandbox> without allow-same-origin has an opaque origin and its privileged property reads throw SecurityError — the v7.3 capture block died at its first read and the WebSocket gate never installed in any sandboxed frame. Every capture is now defensive: the SW surface is skipped where the sandbox already forbids it natively, while the WebSocket/SharedWorker gates still arm, so default-deny holds even in frames the embedder hides. The spoof-list surfaces also shifted to the amber data accent (#ffaa00).",
    },
    "4ndr0tools - Akasha Silence": {
        slug: "akasha-silence",
        tagline: "Unified counter-surveillance defense layer",
        mission: "Akasha Silence is the consolidation of three legacy shields — Anti-detection, Counter-surveillance, and Anti-telemetry (ICC) — into one three-stage strictness valve. At full strictness it neutralizes anti-analysis tripwires, sinkholes telemetry transports (fetch, XHR, beacon, WebSocket), blinds WebRTC, spoofs session-stable fingerprints (hardware, canvas, WebGL, audio), poisons identifier harvests, sanitizes Google link-tracking redirects, and counterattacks hostile UI patterns. The valve steps down to a core-only profile for sites where full mode breaks functionality, and to off for sites the operator trusts — all from one hotkey, all without a reload.",
        features: [
            "Anti-analysis script neutralization (eval-wrap, debugger, timing tripwires)",
            "Telemetry sinkholing across fetch / XHR / sendBeacon / WebSocket",
            "WebRTC ICE-candidate blinding (IP leak prevention)",
            "Session-stable fingerprint spoofing: hardware, canvas, WebGL, audio",
            "Identifier poisoning for hostile harvesters",
            "Google search link de-tracking (direct hrefs instead of /url redirects)",
            "Three-stage strictness valve: full / core / off",
        ],
        settings: "Strictness is cycled live via the valve hotkey and persisted per session; no other surface requires configuration.",
        notes: "Absorbed with zero feature loss from the Anti-detection + Counter-surveillance + Anti-telemetry (ICC) trio (see docs/CONSOLIDATION.md for the superset evidence).",
    },
    "4ndr0tools - AlwaysNewWindow": {
        slug: "alwaysnewwindow",
        tagline: "Link-flow and page-hygiene governor",
        mission: "AlwaysNewWindow enforces the operator's preferred link topology: every link opens in a new window (optionally forced through even target=_self), collapsed content auto-expands, banners and consent overlays get out of the way, and the scrollbar is a neon-glow sovereign surface. It exists because too many sites fight the user's browsing model — this script makes the page obey the user instead.",
        features: [
            "Universal new-window link policy with optional force mode",
            "Auto-expansion of collapsed/truncated content regions",
            "Banner and consent-overlay removal",
            "Neon-glow overlay scrollbar (the cyan scrollbar visible across the suite)",
            "Right-click scrollbar edges for scroll-to-top / scroll-to-bottom",
        ],
        settings: "Toggles for force mode, expansion, and hygiene modules live in the manager menu; they persist through GM storage.",
    },
    "4ndr0tools - AutoTranslate": {
        slug: "autotranslate",
        tagline: "Automatic page translation without the noise",
        mission: "AutoTranslate redirects any non-English page through translate.goog automatically, with layered metadata-plus-text language detection so it neither mistriggers on English pages nor sits silent on foreign ones. It watches SPA route changes, guards against translation back-loops, and deliberately ships with zero banners, zero cookies, and zero broken Element API usage — the quiet, competent translator the operator asked for.",
        features: [
            "Layered language detection (HTML lang metadata + text heuristics)",
            "translate.goog redirect transport (no API keys, no cookies)",
            "SPA route watching with re-evaluation on navigation",
            "Session back-loop guard (never re-translates the translated page)",
            "Ψ glass console for live toggle and target-language control",
        ],
        settings: "Enabled/disabled plus target language persist through GM storage; translate.google.com hosts are permanently excluded to prevent loops.",
    },
    "4ndr0tools - Blob2URL": {
        slug: "blob2url",
        tagline: "Universal blob exfiltration + wire capture",
        mission: "Blob2URL is the suite's universal media extraction engine: it watches the page's network wire through the shared kernel NetHook singleton (one page-realm wrap, every body read once and fanned out to all suite subscribers, fingerprint-masked) for blob and direct media URLs, sniffs interactive assets, keeps a persistent URL vault, and exfiltrates anything the page tried to keep session-locked. The IG harvester inside it turns an authenticated Instagram session into a capture surface no CLI can reach — cookies and login walls are moot when the wire itself is the source.",
        features: [
            "Universal blob exfiltration and CSP/CORS bypass transports",
            "Shared kernel/net.js NetHook wire capture — one wrap per realm, single body read, subscriber fan-out (co-installs never stack)",
            "script[type=application/json] scanning on debounced re-scan",
            "One-shot full-DOM Route 2 sweep for late captures",
            "Persistent URL vault (500-entry cap, dedupe index)",
            "Ψ IG VAULT panel with SAVE/COPY per URL, RESCAN, and AUTOSAVE toggle",
            "DASH-manifest parsing for progressive video representation tables",
        ],
        settings: "Vault cap, autosave, and panel hotkeys persist through GM storage.",
        notes: "v7.1.2: the DASH manifest parse is Trusted-Types policy-wrapped (suite v1.4.2 class fix) so universal-scope installs survive require-trusted-types-for hosts.",
    },
    "4ndr0tools - Bunkr++": {
        slug: "bunkr",
        documented: true,
    },
    "4ndr0tools - Bypass Paywalls": {
        slug: "bypass-paywalls",
        tagline: "Metered-content liberation across the news web",
        mission: "BypassPaywalls restores access to metered and hard-paywalled news content across a wide @match list of publishers. It applies per-domain strategies — cookie scrubbing, referer normalization, AMP/prefer-variant navigation, and DOM un-hiding for client-side-only walls — and keeps every strategy inside the page's own security model (no credential sharing, no third-party services). The suite carries it as a sovereign import: the 0.1.x line receives the 3lectric-Glass and engineering-hardening passes without disturbing its proven per-site strategy core.",
        features: [
            "Per-publisher paywall strategy table (cookie, referer, AMP, DOM classes)",
            "Client-side wall removal (hidden-paragraph restoration, .post-paywall reconstruction)",
            "Google-cache and archive fallbacks where the primary strategy fails",
            "3lectric-Glass compliant styling and Ψ branding on every surface it paints",
        ],
        settings: "Strategy selection is per-domain inside the script body (deterministic, no runtime UI).",
        notes: "v0.1.4: parseFromString sites policy-wrapped for Trusted-Types-enforcing hosts (suite v1.4.2 class fix).",
    },
    "4ndr0tools - Confirmation Bypass": {
        slug: "confirmation-bypass",
        tagline: "Forum friction eliminator",
        mission: "Confirmation Bypass removes every friction layer forums put between the operator and content: it reveals invisi-text, unlocks all replies, rewrites redirect links to their destinations, and — through the Download Gate — bypasses link-confirmation interstitials on every site with a glass overlay for copy/download. It auto-solves Altcha challenges, auto-clicks download buttons, and routes embeds. Where a forum says 'are you sure?', this script has already clicked yes.",
        features: [
            "Invisi-text revelation (hidden forum text exposure)",
            "View-all-replies unlock with inline post reply viewer",
            "Redirect-link rewriting to final destinations",
            "Download Gate: universal confirmation-page bypass with glass overlay copy/download (incl. vidara embeds on xcandid)",
            "Altcha auto-solve and download auto-click",
            "Turbo: embed routing + upload injector",
            "External link safety + right-click scrollbar navigation",
        ],
        settings: "Module toggles persist through GM storage; the overlay is glass-spec styled.",
        notes: "v4.0.2: answer-page parses policy-wrapped for TT hosts (suite v1.4.2 class fix).",
    },
    "4ndr0tools - Filester++": {
        slug: "filester",
        tagline: "Filester stream extraction + folder enumeration",
        mission: "Filester++ weaponizes the Filester.me hosting surface: it enumerates folder trees dynamically, extracts the direct stream URLs behind every media entry, and injects per-item glyphs so a single click grabs what the page's own UI buries behind navigations. The network proxy layer watches the site's own API chatter, so extraction works even when the DOM never renders the link at all.",
        features: [
            "Dynamic folder enumeration (recursive tree walking)",
            "Stream URL extraction via network proxy interception",
            "Per-item glyph injection (copy-to-clipboard direct URLs)",
            "Manager menu surface for one-shot operations",
        ],
        settings: "Minimal — clipboard transport and glyphs are always on; no config surface required.",
    },
    "4ndr0tools - Forum Link Xtractor": {
        slug: "forum-link-xtractor",
        tagline: "Forum link archaeology",
        mission: "Forum Link Xtractor digs through forum threads the way an archivist digs through strata: it extracts every link (including the ones hiding behind redirectors and meta-refreshes), reveals invisi-text the forum tried to hide, and renders inline post replies without leaving the thread view. Its redirect unwrappers resolve link-shortener and protector chains to their final destinations before anything is presented, so what you copy is where you actually land.",
        features: [
            "Full-thread link extraction with redirect/protector unwrapping",
            "Meta-refresh and HTML-redirect resolution",
            "Invisi-text revelation",
            "Inline post reply viewer (no page navigation)",
            "Current-page and sorted export modes",
        ],
        settings: "Extraction options (download/copy, current-page/sort) surface in the extraction UI and persist per session.",
        notes: "v3.2.2: both parse sites policy-wrapped for TT hosts (suite v1.4.2 class fix).",
    },
    "4ndr0tools - Forums++": {
        slug: "forums",
        tagline: "Forum power-user workstation",
        mission: "Forums++ is the heavy machinery for forum work sessions: powerful bulk downloading with per-thread indexing, link checking (alive/dead classification), and archival, driven from a UI that treats a whole subforum as a workspace rather than a page at a time. It composes with Forum Link Xtractor and Confirmation Bypass — where those remove friction, Forums++ industrializes the result.",
        features: [
            "Bulk thread downloading with queue control",
            "Thread indexing and cross-thread search",
            "Link checking with alive/dead/broken classification",
            "Archival export",
            "setProcessing-safe UI state management (restored after the v1.3.0 regression)",
        ],
        settings: "Queue, index, and archive preferences persist through GM storage.",
    },
    "4ndr0tools - GoFile++": {
        slug: "gofile",
        tagline: "GoFile batch acquisition engine",
        mission: "GoFile++ turns gofile.io folders into batch downloads: recursive folder scans, direct-link generation, and handoff to download managers (Aria2, IDM) when raw browser downloads would be too slow or too fragile. It fixes the SPA-persistence traps the site sets (state that evaporates on navigation) and survives sandbox access patterns that break naive extractors.",
        features: [
            "Recursive GoFile folder scans",
            "Direct-link batch generation",
            "Aria2 / IDM download-manager handoff",
            "SPA persistence fixes (state survives route changes)",
            "Sandbox-access robustness",
        ],
        settings: "Manager preference (browser / Aria2 / IDM) and scan depth persist through GM storage.",
    },
    "4ndr0tools - GooglePhotosandDrive++": {
        slug: "gphotos-drive",
        tagline: "Google media sovereignty",
        mission: "GPhotos/Drive++ restores the controls Google removed from its media surfaces: context menus work again, direct links are exposed, reverse image search is one click away, Drive files resolve to true direct-download URLs, and Photos full-resolution originals can be extracted instead of the compressed previews. Power-user hotkeys, drag persistence, and a settings console round out a surface that behaves like the operator owns the machine — because they do.",
        features: [
            "Context-menu restoration on Google media surfaces",
            "Direct link exposure (true source URLs)",
            "Reverse image search dispatch",
            "Drive direct-download resolution",
            "Photos full-resolution extraction",
            "Power-user hotkeys (v8.0.2 census-remediated: settings Alt+G, reverse Alt+V)",
            "Drag-persistent UI + settings console",
        ],
        settings: "Full settings console (toggle set + hotkey remap) persisted through GM storage.",
        notes: "v8.0.2: hotkey re-lettering per the suite-wide co-install census (v1.4.1).",
    },
    "4ndr0tools - Hailuo++": {
        slug: "hailuo++",
        documented: true,
    },
    "4ndr0tools - HostWarp": {
        slug: "hostwarp",
        tagline: "Per-host warp drive",
        mission: "HostWarp is six legacy micro-tools fused into one per-host engine: image-host interstitial bypass across eleven hosts, MEGA embed redirect with autoplay, PlanetSuzy mobile-skin forcing, a t.me 'Open in Web' glass button, SearXNG sticky preferences, and Gemini Answer Now. Every module is toggleable from the 3lectric-Glass settings console and persisted through the kernel store — the console is the intended display for all module state. Built on the suite kernel (brand/core/glass/store/hotkeys/hosts) at document-start.",
        features: [
            "Image-host interstitial bypass: imagetwist, imgspice, turboimagehost, acidimg, imx.to, pixhost, imagebam, imgbox, kropic, vipr.im, imagevenue",
            "MEGA file→embed redirect + autoplay + cross-vendor fullscreen",
            "PlanetSuzy styleid=4 mobile-skin forcing",
            "t.me 'Open in Web' button (glass CSS, createElementNS-built icon)",
            "SearXNG sticky preferences (pattern + hash promoted to first-class settings)",
            "Gemini Answer Now (Ctrl+Shift+A through the collision-aware registry)",
            "Glass settings console — MODULES / SEARXNG / Ψ tabs, every module toggleable",
        ],
        settings: "Per-module enable/disable + SearXNG pattern/hash in the glass console; toggles apply after reload (engine dispatch reads them at document-start).",
        notes: "v1.1.2: settings console survives Trusted-Types hosts — the glyph is now built via Ψ.brand.glyphNode (createElementNS) after parseFromString killed the HUD at header construction on TT-enforcing pages (the operator-reported 'Settings console error' class fix, suite v1.4.2).",
    },
    "4ndr0tools - Images++": {
        slug: "images",
        tagline: "Universal link-media previewer",
        mission: "Images++ shows the media behind links: hover a link, see the image or video it points to, no navigation required. Its integrated collapse mode inverts the trade — shrink every image on a page for performance and expand on demand — with a configurable hotkey (Alt+X by default since the census round). It absorbed the merged power of the legacy Image Maximize Link and page-collapse tools, unified behind one config schema (v8 migration included).",
        features: [
            "Link-hover media previews (images and videos)",
            "Collapse mode: all page images governed to a configured size, expanding on hover",
            "Configurable collapse hotkey with modifier-prefix syntax (default Alt+X)",
            "Config schema v8 (customized values survive migration)",
            "Trusted-Types-aware rendering (page-policy capture route)",
        ],
        settings: "Full settings console: preview behavior, collapse size, hotkey remap with modifier-prefix syntax.",
        notes: "v4.0.3: $parseHtml routes through the page-policy capture on TT hosts (suite v1.4.2 class fix).",
    },
    "4ndr0tools - Instagram++": {
        slug: "instagram",
        tagline: "Instagram desktop sovereignty",
        mission: "Instagram++ rebuilds the Instagram web surface for power use: tab-bar + dock integration, an Alt+I hotkey trigger, ad-blocking, deep-stack recovery from the site's own broken states, resilient cursor-based pagination that survives the API's scroll-locked model, stories support, and a full image/video download engine. It carries the suite's [TRUSTED TYPES BYPASS] block — creating the 'default' policy — because its intercept engine feeds page-context innerHTML writes that TT would otherwise kill.",
        features: [
            "Tab-bar + dock integration",
            "Alt+I hotkey trigger",
            "Ad-blocking layer",
            "Deep-stack recovery (self-healing from SPA failures)",
            "Resilient cursor-based pagination",
            "Stories support",
            "Image/video download engine",
            "Trusted Types default-policy bypass for page-context rendering",
        ],
        settings: "Module toggles persist through GM storage.",
    },
    "4ndr0tools - LinkMasterΨ": {
        slug: "linkmaster",
        tagline: "The universal link intelligence platform",
        mission: "LinkMasterΨ decodes, previews, exports, validates, and scrapes every link on any page. It carries the Ψ IG Harvester (Instagram media extraction with the proven Blob2URL engine), the sexyforums premium-link unwrapper, GitHub raw-URL harvesting, and the Ψ2 forum deep-scrape engine — all behind a docking HUD with Scrape/Check/Settings tabs and dual MPV dispatch (URI + bridge). It is the suite's flagship universal tool and the reason the hotkey census exists.",
        features: [
            "Link decoding (deproxy, unescape, dedupe) with live previews",
            "Bulk link checking (health classification)",
            "Export in multiple formats",
            "Ψ IG Harvester (rides the shared NetHook singleton with Blob2URL — one wrap, one read — plus DASH manifest tables and vault UI)",
            "sexyforums premium-link unwrap",
            "GitHub raw-URL harvest",
            "Ψ2 forum deep-scrape engine",
            "Dual MPV dispatch (URI / bridge)",
            "Docking HUD with drag, focus trap, and menu commands",
        ],
        settings: "Host/media modes, checker depth, and HUD layout persist through GM storage (lm-psi-* keys).",
        notes: "v6.2.2: both parse sites route through the [B5] TTparse policy (suite v1.4.2 class fix) — universal scope means YouTube/Google/GitHub hosts are daily traffic.",
    },
    "4ndr0tools - Login Form Autofiller": {
        slug: "login-form-autofiller",
        tagline: "BugMeNot integration for any login form",
        mission: "Login Form Autofiller wires BugMeNot into every login form on the web: it detects username/password field pairs, queries bugmenot.com for matching credentials, and autofills the best candidate — one menu command instead of the site's registration dance. It parses the BugMeNot response HTML into a document to extract credentials and success statistics, wrapped Trusted-Types-safe since v2.0.2 so Google- and GitHub-style TT-enforcing login pages work too.",
        features: [
            "Login-form detection (username + password field pairing, visibility-aware)",
            "BugMeNot credential retrieval with success-rate ranking",
            "One-command autofill",
            "Field-focus awareness (fills the form the user is actually looking at)",
            "Trusted-Types-safe response parsing",
        ],
        settings: "bugmenot.com itself is excluded; everything else is in scope by default.",
        notes: "v2.0.2: textToXml policy-wrapped for TT-enforcing login pages (suite v1.4.2 class fix).",
    },
    "4ndr0tools - m3u8++": {
        slug: "m3u8++",
        documented: true,
    },
    "4ndr0tools - Maximize_Any_Media": {
        slug: "maximize-any-media",
        tagline: "Universal media maximize + PiP",
        mission: "Maximize_Any_Media gives any media — video, images, embedded and shadow-DOM players — maximize and picture-in-picture controls on any site. It is the direct lineage of the v7.0.0 engine and the superset successor of the legacy maximize tooling, rebuilt on the 3lectric-Glass spec with Ψ branding.",
        features: [
            "Maximize control for any media element",
            "Picture-in-picture dispatch",
            "Shadow-DOM player discovery",
            "Embedded iframe media support",
        ],
        settings: "None required — controls appear on media acquisition.",
    },
    "4ndr0tools - Media Player Controller": {
        slug: "media-player-controller",
        tagline: "The universal media cockpit",
        mission: "MPC is the cockpit for any media element on any page: speed with ±0.1 fine rate, Alt+Shift rAF zoom/pan, rotation, smart maximize, native fullscreen, PiP, play, double-click bindings, pause-on-acquire, virtual DOM nodes, shadow-DOM discovery, a cyan-glass scrub bar, a fetch + blob capture download button, screenshot, volume/mute, frame stepping, seek hotkeys, IG story navigation (3-layer), story repeat, active-media observation, YouTube ad auto-skip, toast feedback, a draggable HUD, and the full hotkey suite. Since the v8.1.2 sovereignty round, every key claim requires an acquired video target — bare-key hijacking of text pages is structurally impossible.",
        features: [
            "Playback: speed ±0.1 fine rate, frame step, seek hotkeys, play/pause",
            "View: Alt+Shift rAF zoom/pan, rotation, smart maximize, native fullscreen, PiP",
            "Cyan-glass scrub bar + draggable HUD",
            "Download button (fetch + blob capture) and screenshot",
            "IG story navigation + repeat (3-layer)",
            "Active-media observer + YouTube ad auto-skip",
            "Sovereignty gate: keys act only on an acquired video target (v8.1.2)",
        ],
        settings: "Preferences persist through GM storage with value-change listeners for live apply.",
        notes: "v8.1.2: hotkey sovereignty gate + KeyN instagram.com scoping (census round v1.4.1).",
    },
    "4ndr0tools - ModelSearch": {
        slug: "modelsearch",
        tagline: "Covert cross-site forum search",
        mission: "ModelSearch is a covert SimpCity search UI usable from any website — one Alt+S summons the Electric-Glass overlay, queries, and returns results without ever navigating the current page. It is the standard demonstration of the suite's 'site-specific tool, universal surface' pattern: the target is a forum, the cockpit is everywhere.",
        features: [
            "Alt+S hotkey overlay (collision-aware since the census round)",
            "Covert search directly from any website",
            "Electric-Glass UI",
            "Opt-in remote font stack (mst_remote_fonts — OPSEC adjudicated)",
        ],
        settings: "Remote fonts are opt-in (default local stack) per the suite OPSEC policy.",
        notes: "Alt+S is ModelSearch's suite-wide claim; site-specific tools win disputes per suite precedent.",
    },
    "4ndr0tools - PageCraft": {
        slug: "pagecraft",
        tagline: "All-sites page utility belt",
        mission: "PageCraft is the every-page utility belt: bulk checkbox control with range and alt-hover selection (de-jQueryed from the legacy implementation), broken-image auto-repair with cache-busting and frame broadcast, a hover-collapse image I/O governor, and Brave infinite scroll. One engine, one glass settings console, zero runtime dependencies — built on the suite kernel (brand/core/glass/store/hotkeys) at document-start, with the console as the intended display for all module state.",
        features: [
            "Bulk checkbox control: range selection (shift), alt-hover chains",
            "Broken-image auto-repair (cache-busting reload + frame broadcast)",
            "Hover-collapse image governor (configurable 100–480px)",
            "Brave Search infinite scroll",
            "Glass settings console — MODULES + KEYS tabs",
        ],
        settings: "Module toggles + collapse size in the glass console; collapse applies live, module toggles after reload.",
        notes: "v1.1.2: settings console survives Trusted-Types hosts (glyphNode class fix, suite v1.4.2); the Brave fetch-parse routes through Ψ.core.parseHTML.",
    },
    "4ndr0tools - Pixeldrain++": {
        slug: "pixeldrain",
        tagline: "Pixeldrain acquisition, parallelized",
        mission: "Pixeldrain++ multiplies pixeldrain downloads: multi-proxy parallel transport, streaming, adaptive chunking, and aria2c handoff. The pseudo-QR decoration of the legacy line was replaced by a real RS/mask QR encoder (tools/qr-verify.mjs round-trips it — Gate QR), and every surface is 3lectric-Glass compliant.",
        features: [
            "Multi-proxy parallel downloads",
            "Streaming transport",
            "Adaptive chunking",
            "aria2c handoff",
            "Real QR encoder (Reed-Solomon + masking) for link handoff",
        ],
        settings: "Transport and proxy preferences persist through GM storage.",
    },
    "4ndr0tools - Prompt Master": {
        slug: "prompt-master",
        tagline: "Prompt library command deck",
        mission: "Prompt Master is a manager's toolkit for AI prompt libraries — originally Google Flow, now any AI surface via URL addition. A persisted unit ledger meters every generation click; the organization engine adds collections, saved views, favorites, ratings, archive, group-by, and insights for large libraries; dedupe keeps the stack clean; the AI prompt enhancer rewrites; gist syncing keeps everything backed up; hotkeys drive it all.",
        features: [
            "Persisted unit ledger (meters every generation click)",
            "Organization engine: collections, saved views, favorites, ratings, archive, group-by, insights",
            "Media Slideshow (Alt+T): active-collection scoping, virtual-scroll & lazy-media accumulation (up to 900 items), video-aware dwell, and high-contrast 3lectric-Glass controls",
            "Dedupe engine",
            "AI prompt enhancer",
            "Auto gist syncing",
            "Hotkey suite + manager menu",
        ],
        settings: "Library organization and sync preferences persist through GM storage.",
        notes: "Remote font fetches are manager-level GM_xmlhttpRequest → base64 inline (OPSEC adjudicated exemption). 522-extension accent family is an adjudicated exemption from the strict palette.",
    },
    "4ndr0tools - Recon": {
        slug: "recon",
        tagline: "Unified forensic recon platform",
        mission: "Recon is the suite's security-research wing: hardened XHR/fetch interception with MITM block-and-mute rules, console harvesting, WebSocket and postMessage bridge capture, JWT identity harvesting, and a headless C2 API (reconEngine / chimeraRecon / Hook) driven from a movable shadow-DOM glass dock with full markdown reporting. Alt+Shift+R summons it. For security research only — it is the one tool in the suite that exists to watch rather than to be watched.",
        features: [
            "Hardened XHR/fetch interception with MITM block + mute rules",
            "Console harvesting",
            "WebSocket + postMessage bridge capture",
            "JWT identity harvesting",
            "Headless C2 API: reconEngine / chimeraRecon / Hook",
            "Shadow-DOM glass dock + markdown reporting",
        ],
        settings: "Block/mute rules persist through GM storage.",
        notes: "Alt+Shift+R is the suite-wide claim (census-verified).",
    },
    "4ndr0tools - Redgifs++": {
        slug: "redgifs",
        tagline: "Redgifs cinematic integration",
        mission: "Redgifs++ intercepts Redgifs links on Reddit and renders them in a cinematic overlay instead of the site's chrome; on Redgifs itself it enters a focused video-only mode. For direct /watch/ loads before SPA hydration it falls back to JSON.parse interception — the reliable path when the DOM has not caught up to the router yet.",
        features: [
            "Reddit-side Redgifs link interception with cinematic overlay",
            "Focused video-only mode on Redgifs",
            "JSON.parse intercept fallback for pre-hydration /watch/ loads",
        ],
        settings: "None required.",
    },
    "4ndr0tools - Stream Interceptor": {
        slug: "stream-interceptor",
        tagline: "Network-layer stream intelligence",
        mission: "Stream Interceptor watches the wire for stream tokens, manifests, and direct video sources, harvesting them through network hooks and DOM inspection. The suite promotion of the v3.1 BETA adds ShadowDOM piercing, context-safe Reflect hooks, ReDoS-proof regexes, the 3lectric-Glass card surface, and a universal URL registry cap — bounded surfaces per GUP B.1.",
        features: [
            "Stream token + manifest interception",
            "Network hooks and DOM inspection dual-source extraction",
            "ShadowDOM piercing",
            "Context-safe Reflect hooks",
            "ReDoS-proof regex discipline",
            "Bounded universal URL registry (GUP B.1)",
        ],
        settings: "Registry cap and clipboard actions persist through GM storage.",
    },
    "4ndr0tools - Watermark++": {
        slug: "watermark",
        tagline: "Perceptual watermark detection + removal",
        mission: "Watermark++ detects and removes watermarks using perceptual-hash matching against embedded detection templates — the 1.22 MB mass is functional (templates + embedded workers), not dead weight. It ships its own TrustedTypes policy (gemini-watermark-remover) with getPolicy reuse where available, since its removal surface injects into hardened hosts.",
        features: [
            "Perceptual-hash watermark detection (embedded template library)",
            "Watermark removal with worker-based processing",
            "TrustedTypes policy with getPolicy reuse",
            "mime-resolving image fetch (resolveFetchedImageMimeType — restored v1.3.0)",
        ],
        settings: "Detection thresholds persist through GM storage.",
        notes: "The dist size is functional mass — trimming would regress detection (adjudicated with evidence in the v1.4.1 round).",
    },
    "4ndr0tools - Website Control Panel": {
        slug: "website-control-panel",
        tagline: "Per-site sovereign control surface",
        mission: "WCP is the per-site control panel: a glass HUD that exposes the toggles a hostile page should have shipped — asset loading, script families, layout repair, and hygiene modules — persisted per-site so the operator's preferences follow them across visits. Its HUD sovereignty and local font stack are Gate-D verified invariants of the suite.",
        features: [
            "Per-site module toggles (assets, scripts, layout, hygiene)",
            "Glass HUD surface (sovereignty verified — Gate D)",
            "Local font stack (OPSEC verified — zero remote fonts)",
            "Per-site persistence with value-change listeners",
        ],
        settings: "Everything is a setting; the HUD is the settings console.",
    },
    "4ndr0tools - Yandex Image Search++": {
        slug: "yandex-image-search",
        tagline: "Yandex reverse-image integration",
        mission: "Yandex Image Search++ integrates Yandex's reverse image search into the browsing flow — the operator's preferred engine for finding source, higher-resolution, or related imagery — with the suite's glass styling over the search surface.",
        features: [
            "Reverse-image search dispatch through Yandex",
            "Glass-styled results surface",
            "Context-menu and hotkey integration",
        ],
        settings: "None required.",
    },
    "4ndr0tools - YouTube Playlist Master": {
        slug: "youtube-playlist-master",
        tagline: "The YouTube playlist command deck",
        mission: "YTPM is the playlist command deck for YouTube: channel playlist buttons (All/Popular/Videos/Shorts/Streams/Members), random play with newest/oldest preference, reverse autoplay order, duration sort, bulk copy/move/delete, JSON + plaintext export/import, snapshots with deleted-video detection, queue and watch-later overlays, a huge-playlist browser, a duplicate finder with purge, and global hotkeys. Since v1.4.0 it is Trusted-Types-immune by construction — every DOM node is built through createElement/createElementNS, the fix that ended 54 uncaught TypeErrors on YouTube's TT-enforcing profile.",
        features: [
            "Channel playlist buttons (All / Popular / Videos / Shorts / Streams / Members)",
            "Random play (prefer newest/oldest) + reverse autoplay order",
            "Playlist autoplay toggle, duration sort, row filter",
            "Bulk copy / move / delete + duplicate finder & purge",
            "JSON + plaintext export/import, snapshots with deleted-video detection",
            "Queue & watch-later overlays, quick watch_videos playlists",
            "Failsafe deck rescue + 404-proof navigation guards",
            "Trusted-Types-immune rendering (zero string sinks, by construction)",
        ],
        settings: "Live settings apply without reload; the deck is always available.",
        notes: "Alt+Shift+U/S/X global hotkeys (census-verified). The dist YouTube Playlist Master is the TT-immune reference implementation for the whole suite.",
    },
    "4ndr0tools - Youtube Removed Video Revealer": {
        slug: "yt-removed-video-revealer",
        tagline: "Deleted-video title restoration",
        mission: "The Revealer restores titles for removed or private videos in YouTube playlists — the 'deleted video' placeholder becomes the real title again, pulled from the archive of playlist metadata that YouTube still serves but no longer displays.",
        features: [
            "Removed/private video title restoration in playlists",
            "Metadata archive lookup",
        ],
        settings: "None required.",
    },
    "4ndr0tools - YouTube Embed Redirect Button": {
        slug: "yt-embed-redirect",
        tagline: "One-click embed view",
        mission: "A floating glass button on YouTube that redirects to the embedded version of the current video — the clean, chrome-less player. Right-click it to set a keybind (default Ctrl+E).",
        features: [
            "Floating redirect button (glass styled)",
            "Configurable keybind (default Ctrl+E, right-click to set)",
        ],
        settings: "Keybind persists through GM storage.",
    },
    "4ndr0tools - YT Filter": {
        slug: "yt-filter",
        tagline: "Electric-Glass YouTube feed filter",
        mission: "YT Filter is the Electric-Glass video filter for YouTube feeds: views, date, and duration thresholds cull the feed to what the operator actually wants to see, with the filter surface itself in full glass styling.",
        features: [
            "Views threshold filtering",
            "Date / recency filtering",
            "Duration filtering",
            "Electric-Glass filter surface",
        ],
        settings: "Filter thresholds persist through GM storage.",
    },
    "4ndr0tools - Zai Exporter": {
        slug: "zai-exporter",
        tagline: "Z.ai conversation exfiltration",
        mission: "Zai Exporter turns the Z.ai GLM web chat into an artifact you own: one click on the Ψ HUD button (or the manager menu command) scrapes the live conversation from the page and hands it over as Markdown, JSON, or plain text — code blocks fenced, roles classified, metadata stamped. The engine runs a strict strategy ladder (message-attribute mining, chat-region harvest, degraded plain-text sweep) and always reports which strategy produced the export and how many roles were classified, because a hostile third-party DOM is a versioned surface we do not control — a degraded export says so in the panel and in the artifact header rather than silently pretending a guess is ground truth. It is deliberately the quietest tool in the suite: zero polling, zero observers, zero network, zero HTML-string sinks — the conversation is read from the DOM the operator is already looking at, nothing phones home.",
        features: [
            "One-click conversation export to Markdown / JSON / plain text (Ψ HUD button + manager menu)",
            "Strategy-ladder extraction: attribute mining → chat-region harvest → degraded text sweep, with the chosen strategy reported",
            "Role classification with explicit attribute ground-truth first, stem heuristics second, alternation repair third — unknown roles stay honest as UNKNOWN",
            "Code-block preservation (pre → fenced blocks) in Markdown and JSON exports",
            "Metadata header (title, URL, timestamp, message count) — toggleable, persisted",
            "Copy-to-clipboard transport (GM clipboard with page fallback) alongside file download",
        ],
        settings: "Format and metadata preference persist through GM storage. No other configuration surface.",
        notes: "v1.0.0: born inside the suite gates (3lectric-Glass audit, style tokens, zero-footprint across every census) — the runbook's canon → check → docs → dist pipeline executed in full.",
    },
};

/* ── Live data joins ─────────────────────────────────────────────────────── */

const census = runCensus();
const hotkeysByScript = new Map();
for (const r of census.registrations) {
    if (!hotkeysByScript.has(r.script)) hotkeysByScript.set(r.script, []);
    hotkeysByScript.get(r.script).push(r);
}
/* Census script names are short ("Akasha Silence"); inventory names carry
 * the "4ndr0tools - " prefix. Join on suffix. */
function censusFor(invName) {
    const short = invName.replace(/^4ndr0tools\s*-\s*/, "");
    return hotkeysByScript.get(short) || [];
}
/* WO-01 round-2 (6-d F9): lineage-event uniqueness — two entries may share a
 * dest (FLX's two promotions are two distinct historical events), but the
 * SAME (dest, source) pair twice is a recording error. */
{
    const seen = new Set();
    for (const e of EVIDENCE) {
        const k = e.dest + " <- " + e.source;
        if (seen.has(k)) throw new Error(`EVIDENCE.json: duplicate lineage event ${JSON.stringify(k)} — same dest+source recorded twice`);
        seen.add(k);
    }
}

function evidenceFor(s) {
    /* WO-01 round-3 (3-d F3): match on the inventory's OWN dist filename
     * (s.file == EVIDENCE dest for every entry — verified) — the @name
     * reconstruction missed 5 scripts whose @names differ from their
     * filenames (spaces/case: "Bypass Paywalls" → BypassPaywalls.user.js,
     * "GoFile++" → Gofile++.user.js, YERB, Yandex, 4ndr0Purge), so their
     * READMEs silently had NO Lineage section at all. */
    const file = typeof s === "string" ? s : s.file;
    return EVIDENCE.filter((e) => e.dest === file);
}

const esc = (s) => String(s).replace(/\|/g, "\\|");
const distUrl = (s) => `https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/${encodeURIComponent(s.file)}`;

function renderScript(s) {
    const k = KNOWLEDGE[s.name];
    if (!k) throw new Error(`No KNOWLEDGE entry for ${s.name} — add it to tools/gen-docs.mjs`);
    const L = [];
    L.push(`# ${s.name.replace(/^4ndr0tools - /, "")} · v${s.version}`);
    L.push("");
    L.push(`> ${k.tagline} — \`${s.family}\` family · [suite 4ndr0666tools](../INDEX.md)`);
    L.push("");
    L.push(`## Mission`);
    L.push("");
    L.push(k.mission);
    L.push("");
    L.push(`## Scope`);
    L.push("");
    L.push("| Dimension | Value |");
    L.push("|---|---|");
    L.push(`| Version | \`${s.version}\` |`);
    const matches = (s.matches || []).slice(0, 4);
    L.push(`| Matches | ${matches.length ? matches.map((m) => `\`${esc(m)}\``).join(", ") + ((s.matches || []).length > 4 ? ` (+${s.matches.length - 4} more)` : "") : "universal (no @match)" } |`);
    if (s.excludes && s.excludes.length) L.push(`| Excludes | ${s.excludes.slice(0, 4).map((m) => `\`${esc(m)}\``).join(", ")} |`);
    L.push(`| Run-at | \`${s.runAt || "document-idle"}\` |`);
    L.push(`| Size | ${(s.bytes / 1024).toFixed(1)} KB · ${s.lines} lines |`);
    L.push(`| Install | [dist/${s.file}](${distUrl(s)}) |`);
    L.push("");
    L.push(`## Feature Inventory`);
    L.push("");
    for (const f of k.features) L.push(`- ${f}`);
    L.push("");
    const hk = censusFor(s.name);
    if (hk.length) {
        L.push(`## Keymap Sovereignty`);
        L.push("");
        L.push("Verified by the co-install census (`node tools/hotkey-census.mjs`):");
        L.push("");
        L.push("| Combo | Scope |");
        L.push("|---|---|");
        for (const r of hk) {
            const scope = r.domains && r.domains.universal
                ? "universal"
                : Object.keys((r.domains && r.domains.domains) || {}).slice(0, 3).join(", ") || "page-scoped";
            L.push(`| \`${esc(r.combo)}\` | ${esc(scope)} |`);
        }
        L.push("");
    }
    L.push(`## Settings & Persistence`);
    L.push("");
    L.push(k.settings);
    L.push("");
    // WO-01 round-4 (4-c F03 companion): render ALL grants — the old
    // underscore-only filter would have flipped LFA's row to a false "No GM
    // grants — runs purely in page context" the moment its dead underscore
    // grants were removed; dot-form grants are real grants and render now.
    const grants = s.grants || [];
    L.push(`## Permissions (OPSEC)`);
    L.push("");
    L.push(grants.length
        ? `GM grants: ${grants.map((g) => `\`${g}\``).join(", ")}.`
        : "No GM grants — runs purely in page context.");
    if ((s.connects || []).length) L.push(`Cross-origin connects: ${s.connects.map((c) => `\`${c}\``).join(", ")}.`);
    if (k.notes) { L.push(""); L.push(`> ${k.notes}`); }
    const ev = evidenceFor(s);
    if (ev.length) {
        L.push("");
        L.push(`## Lineage`);
        L.push("");
        /* WO-01 round-2 (6-d F3): merged entries carry the PLURAL sources[] (a
     * five-way lineage with sha16s) — the round-1 form rendered e.source,
     * which is undefined for them, so three generated READMEs carried
     * literal "(from `undefined`, …)". Render whichever shape the entry
     * carries. */
    for (const e of ev.slice(0, 3)) {
        /* WO-01 round-3 (3-d F3): three render defects closed — (a) carried
         * entries ship changes[] instead of version/evidence, so 17 READMEs
         * ended with literal "(from \`X\`, vundefined): undefined"; (b) the
         * Akasha merged entry carries sources as an array of STRINGS (the
         * round-2 fix covered only the object shape); (c) both fields are
         * now conditional, falling back to the changes summary. */
        const origin = e.sources && e.sources.length
            ? e.sources.map((x) => (typeof x === "string" ? x : x.file)).join(", ")
            : e.source;
        const verPart = e.version ? `, v${e.version}` : "";
        const evPart = e.evidence || (e.changes || []).join("; ");
        L.push(`- **${e.mode}** → \`${e.dest}\` (from \`${origin}\`${verPart}): ${evPart}`);
    }
    }
    L.push("");
    L.push(`---`);
    L.push(`*Generated by \`npm run docs\` (tools/gen-docs.mjs) — data is live from inventory.json, EVIDENCE.json and the hotkey census; prose is curated in the generator.*`);
    L.push("");
    return L.join("\n");
}


function resolveSourceMeta(s) {
    for (const tier of ["_sovereign", "_promoted", "_merged"]) {
        const p = path.join(ROOT, "canon", tier, s.file);
        if (fs.existsSync(p)) {
            const src = fs.readFileSync(p, "utf8");
            const clean = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
            const fns = new Set([
                ...[...clean.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]),
                ...[...clean.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)\b/g)].map(m => m[1]),
                ...[...clean.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g)].map(m => m[1]),
            ]);
            const usesNet = src.includes("__4NDR0_NET_API__");
            const hasFallback = /KernelLessGmFetch/.test(src);
            const kb = !usesNet ? "kernel-free" : hasFallback ? "typeof-guarded + gmFetch fallback" : "typeof-guarded (NetHook)";
            return { tier: tier.slice(1), units: fns.size, kb };
        }
    }
    const slug = s.file.toLowerCase().includes("hostwarp") ? "hostwarp" : "pagecraft";
    const mp = path.join(ROOT, "modules", slug, "body.js");
    const metaPath = path.join(ROOT, "modules", slug, "meta.json");
    const msrc = fs.existsSync(mp) ? fs.readFileSync(mp, "utf8") : "";
    const mclean = msrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const mfns = new Set([
        ...[...mclean.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[1]),
        ...[...mclean.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)\b/g)].map(m => m[1]),
        ...[...mclean.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g)].map(m => m[1]),
    ]);
    const kCount = fs.existsSync(metaPath) ? (JSON.parse(fs.readFileSync(metaPath, "utf8")).kernel || []).length : 6;
    return { tier: "module:" + slug, units: mfns.size, kb: `build-module (${kCount}-kernel)` };
}

function renderFeatureMatrix(scripts) {
    const pkgVer = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
    const rows = [];
    let totalUnits = 0;
    for (const s of scripts) {
        const meta = resolveSourceMeta(s);
        totalUnits += meta.units;
        /* WO-01 round-3 (3-d F2): the scheme strip handles `*://` (the ^\w+
         * form could not, so 10 domain-scoped scripts — Redgifs++, YT Filter,
         * BPP, Instagram++, … — rendered `*:` (universal) in the OPSEC-relevant
         * §4.1 capability column); universal-only scripts render `*` explicitly
         * instead of a misleading host. */
        const doms = (s.matches || [])
            .map((m) => m.replace(/^\*:/, "").replace(/^\w+:/, "").replace(/^\/\//, "").split("/")[0].replace(/^\*\./, "").replace(/\*$/, ""))
            .filter((d) => d && d !== "*");
        const universal = (s.matches || []).some((m) => {
            const d = m.replace(/^\*:/, "").replace(/^\w+:/, "").replace(/^\/\//, "").split("/")[0].replace(/^\*\./, "").replace(/\*$/, "");
            return !d || d === "*";
        });
        const uniqDoms = [...new Set(doms)];
        const cap = uniqDoms.length === 0
            ? (universal ? "universal (*)" : "universal (no @match)")
            : uniqDoms.slice(0, 4).join(", ") + (uniqDoms.length > 4 ? ` (+${uniqDoms.length - 4})` : "") + (universal ? " + *" : "");
        rows.push({ name: s.name, version: s.version, tier: meta.tier, units: meta.units, kb: meta.kb, cap });
    }
    /* WO-01 round-1 (2-a F12): canon count is DERIVED (walk canon/ counting
     * .user.js sources) — the old hardcoded "36/36" would silently lie the
     * next time a script is added or retired. */
    let canonCount = 0;
    for (const sub of fs.readdirSync(path.join(ROOT, "canon"), { withFileTypes: true })) {
        if (!sub.isDirectory()) continue;
        canonCount += fs.readdirSync(path.join(ROOT, "canon", sub.name)).filter((f) => f.endsWith(".user.js")).length;
    }
    const L = [];
    L.push(`# Feature-to-Function & Kernel-Boundary Matrix — 4ndr0666tools suite (v${pkgVer})`);
    L.push("");
    L.push(`**§4.1 GUP Part IV & Wave 2.5/5.13 artifact (suite v${pkgVer}).** Deterministically generated by \`npm run docs\` (\`tools/gen-docs.mjs\`) from the live \`inventory.json\` and review sources (\`canon/\` + \`modules/\`).`);
    L.push("");
    /* WO-01 round-2 (6-a F13): fixed-locale formatting — toLocaleString()
     * without a locale produced ICU-dependent generated bytes (the same
     * class as the round-1 codepoint-sort fix). */
    L.push(`**Totals:** ${scripts.length} scripts · ${totalUnits.toLocaleString("en-US")} implementing units · ${scripts.length} dist artifacts · ${canonCount}/${canonCount} canon scripts kernel-less-safe.`);
    L.push("");
    L.push("| Script | Version | Tier | Units | Kernel-Boundary Verdict | Capability surface (@match domains) |");
    L.push("|---|---|---|---:|---|---|");
    for (const r of rows) {
        L.push(`| ${esc(r.name)} | \`${r.version}\` | ${r.tier} | ${r.units} | ${r.kb} | ${esc(r.cap)} |`);
    }
    L.push("");
    L.push(`## Suite v${pkgVer} Whole-Repo Delegation Highlights`);
    L.push("");
    /* WO-01 round-3 (3-a F13): the gmFetch consumer count and the watermark
     * battery count DERIVE from the tools' own sources (the fallback-file
     * list in kernel-boundary-smoke; the check() occurrences in the
     * watermark battery) — the F12-class hardcoded 8/8 and 15/15 go stale
     * the moment a fixture or battery case grows. */
    const gmFetchConsumers = (() => {
        const kb = fs.readFileSync(path.join(ROOT, "tools", "kernel-boundary-smoke.mjs"), "utf8");
        const start = kb.indexOf("const VM_FALLBACK_FILES = [");
        const block = kb.slice(start, kb.indexOf("];", start));
        return (block.match(/\.user\.js"/g) || []).length;
    })();
    const watermarkAsserts = (fs.readFileSync(path.join(ROOT, "tools", "watermark-batch-smoke.mjs"), "utf8").match(/\bcheck\(/g) || []).length;
    L.push(`- **Wave 1.1 & 1.2 (v1.7.0 Census-Ledger Wave & Watermark++ Graduation):** All 51 active census-ledger entries reconciled; **Watermark++** delegated-batch observer graduated through Lawful Door 1 to structurally machine-proven \`COALESCED\` (backed by \`tools/watermark-batch-smoke.mjs\`, ${watermarkAsserts} assertions + red control — count derived from the battery's own check() occurrences, WO-01 round-3 3-a F13); remaining 50 entries re-verified and rolled to \`v1.8.0\` under Door 2, then re-adjudicated and rolled to \`v1.12.0\` in WO-01 round-1 (the G9 expiry gate had been silently inert — \`CURRENT_ROUND\` was hardcoded at \`v1.7.2\`; it now derives from \`package.json\`).`);
    /* WO-01 round-2 (6-a F12/6-d F5): the fixture-battery assert count and
     * the CANON_KERNEL script count are DERIVED from the sources (assert()
     * occurrences; the CANON_KERNEL map in build.mjs) — the hardcoded 22/22
     * and "14" rode three battery growths without regeneration. */
    const fixtureAsserts = (fs.readFileSync(path.join(ROOT, "tools", "family-fixture-smoke.mjs"), "utf8").match(/\bassert\(/g) || []).length;
    const canonKernelCount = (() => {
        const bm = fs.readFileSync(path.join(ROOT, "tools", "build.mjs"), "utf8");
        const start = bm.indexOf("const CANON_KERNEL = {");
        const block = bm.slice(start, bm.indexOf("};", start));
        return (block.match(/\.user\.js":/g) || []).length;
    })();
    L.push(`- **Wave 1.3, 1.4 & 3.9 (Per-Family Contract Fixture Battery):** \`tools/family-fixture-smoke.mjs\` (${fixtureAsserts} assertions + red controls) verifies **Zai Exporter**'s 3-tier extraction ladder (attribute mining + alternation repair + code fencing, region harvest, honest degraded sweep) and the **NetHook v6** script families (veto, phantom respond, structured traffic, \`onNode\` DOM defusal, and \`gmFetch\` privileged transport).`);
    L.push(`- **Wave 2.5 (Kernel-Boundary Audit ×${canonKernelCount}):** All ${canonKernelCount} \`CANON_KERNEL\` scripts hardened with \`typeof __4NDR0_NET_API__\` guards and closure-local \`*KernelLessGmFetch\` fallbacks (${gmFetchConsumers}/${gmFetchConsumers} \`gmFetch\` consumers covered), enforced by \`tools/kernel-boundary-smoke.mjs\` in \`npm run check\`.`);
    L.push("- **Google Flow Token/Credit Chip Counter Hardening & Browser Proof-of-Possession (`Prompt Master` v28.7.3, GUP v6.0.0):** Hardened `FLOW_CREDIT_CSS` flexbox sizing (`box-sizing:border-box`, `min-width:44px` + `flex:0 1 auto` on `.mp-credit-model`, `flex:0 0 auto` on `.mp-credit-values`, `flex:0 1 40px` + `min-width:20px` on `.mp-credit-pool`), added coalesced `ResizeObserver` tracking for `flowCreditAnchorEl` and `#pm-flow-dock`, added dynamic container/viewport `maxWidth` clamping and left/right/above non-occlusion guard around `model-chip` anchors, reconnected learned `capTurns` in `flowCreditTurnsLeft`, prioritized explicit model names in `flowCreditScanLimitNotice`, and wired `tools/flow-chip-browser-smoke.mjs` (11/11 live headless Chromium `click, wait, get` assertions + red control).");
    L.push("- **GUP v7.0.0 Stepwise Gap Mitigation & Superset Closure (`suite v1.7.1`):** Eliminated TDZ self-shadowing runtime crashes (`const isFF = isFF;` in **LinkMasterΨ** v6.3.1 & **Forums++** v1.10.1, `let deletedIDs` shadowing/self-assignment in **Youtube Removed Video Revealer** v2.0.3), wired `#TitleRestoredBtn` to `ButtonClickActionFullView`, completed Wave 2.8 async Promise `.catch` debug hardening across all 38 scripts with machine enforcement in `tools/error-census.mjs`, hardened **HostWarp** v1.1.4 `forceImmediateAnswer` for `contenteditable` surfaces, implemented redirect unwrapping in `plugins/candidshiny.user.js` v1.1.2 & `GET`/scheme hardening in `plugins/bridge.py`, and closed all 5 `uncategorized` script family classifications.");
    L.push("- **GUP v7.0.1 Media Slideshow & 3lectric-Glass Foreground Icon Hardening (`Prompt Master` v28.7.7, `suite v1.8.2`):** Repaired Media Slideshow collection blindness by removing `[role=\"dialog\"]` and `.cdk-overlay-container` from `SLIDESHOW_EXCLUDE`, fixing `#mp-media-slideshow` self-exclusion, rejecting hidden/`0x0` cached nodes, and adding `resolveSlideshowScopeRoot()` for open dialogs/drawers/tabpanels/collections; broke the ~30-image virtual-scroll ceiling via `extractSlideshowCandidate()`, `parseSlideshowSrcsetBest()`, `findSlideshowScrollContainer()`, `triggerSlideshowLoadMore()`, `slideshowSweepScrollerSync()`, and `slideshowScheduleAsyncHarvest()` with non-destructive deck accumulation in `slideshowRefreshDeck()`; repaired `ICONS.prev`/`ICONS.next` `<path>` elements, `ICONS.expand`/`ICONS.collapse`/`ICONS.info` `currentColor` inheritance, and hardened `SLIDESHOW_CSS`, `FLOW_DOCK_CSS`, and `mp-electric-glass-override` with `!important` 3lectric-Glass foreground contrast, verified by `tools/pm-grid-browser-smoke.mjs` (15/15 live Chromium assertions).");
    L.push("- **GUP v7.0.1 Stepwise Gap Mitigation & Superset Closure (`suite v1.7.2`):** Repaired `codeOnly` template-literal & `${...}` token boundary lexing in `tools/sink-census.mjs` (used across all 7 static censuses), migrated **Pixeldrain++** v1.2.1 `Pending Jobs` modal to real `el(...)` DOM nodes (`Modal.open` append-safe), wired `debounce` into `onNav` and `openSettingsPanel` into the `★ Premium: active` menu command, fixed **Forums++** v1.10.2 `gofile.io/d` operator-precedence & trailing-slash bug (`props?.status !== 'ok'`), `cyberfile` lookbehind (`(?<='folder',\\s')`) & public-folder unlock gate (`requiredPassword && !unlocked`), `cyberdrop.me` direct-file `http` parameter, `GM_download` object-URL creation/revocation, per-file 60s `setInterval` cleanup in `.finally()`, and idempotent `#config-toggle-all-posts` listener registration, and hardened **LinkMasterΨ** v6.3.2 `jpg6.su` non-destructive spoiler candidate list, `ibb.co` parse-failure guard, `cyberdrop.me`/`noodlemagazine`/`m.box.com` URL normalization, `cyberfile` null-safe `folderId` extraction, `AbsorbedPLR` `hasRedirectLink` observer filter, and `ui.forms` `escapeHTML` sanitization.");
    L.push("");
    return L.join("\n");
}

function renderIndex(scripts) {
    const L = [];
    L.push(`# 4ndr0666tools — Script Documentation Index`);
    L.push("");
    L.push(`> ${scripts.length} installables · every script in [\`dist/\`](../dist/) has coinciding docs here.`);
    L.push(`> Regenerate after any bump: \`npm run docs\` (versions, keymaps, scopes and lineage are read live from the repo).`);
    L.push("");
    L.push(`| Script | Version | Family | Kernel Boundary | Docs |`);
    L.push(`|---|---|---|---|---|`);
    const byName = new Map(scripts.map((s) => [s.name, s]));
    for (const name of Object.keys(KNOWLEDGE).sort()) {
        const s = byName.get(name);
        if (!s) throw new Error(`KNOWLEDGE entry "${name}" has no inventory counterpart`);
        const k = KNOWLEDGE[name];
        const kb = resolveSourceMeta(s).kb;
        L.push(`| **${name.replace(/^4ndr0tools - /, "")}** | \`${s.version}\` | ${s.family} | ${kb} | ${k.documented ? `[devlog](./${k.slug}/)` : `[reference](./${k.slug}/)`} |`);
    }
    L.push("");
    L.push(`Hand-written deep devlogs: **Bunkr++**, **Hailuo++**, **m3u8++** carry full engineering devlogs with field intelligence;`);
    L.push(`every other script carries the generated reference above. Guides live in [\`docs/\`](../docs/):`);
    /* WO-01 round-2 (6-d F10): FEATURE-MATRIX.md (the §4.1 GUP Part IV
     * artifact) was linked from nowhere — orphaned in the doc graph. */
    L.push(`[Consolidation Report](../docs/CONSOLIDATION.md) · [Migration Guide](../docs/MIGRATION.md) · [Feature Matrix](./_suite/FEATURE-MATRIX.md).`);
    L.push("- **WO-01 Round-1 Stepwise Gap Mitigation (`suite v1.9.0`, 8 commits):** Four-agent full-repo audit (tools · kernel/build · canon · consistency) → 7 mitigation commits + the version pin: kernel load-order repair (HUD position persistence restored — `tools/kernel-order.mjs` single source shared by build and smoke; hotkeys named-key canonicalization; net.js real-XHR 4 MB cap; hosts single-label reachability; store remove() watcher notification), gate re-arming (G9 expiry enforcement derives from `package.json` — 50 adjudications re-rolled to v1.12.0 with red-control proof; Gate B prototype-chain hazard + 19 dead rename entries purged; vacuous red controls replaced with mutation-injected ones; production-score standalone never writes), canon source gaps (YTRVR + Images++ `@grant unsafeWindow` feature-dead paths, Forums++ Violentmonkey transport crash, BPP nzherald guard, 5 version syncs, 8 dead grants), docs truthfulness (hailuo++/m3u8++ devlog banners, EVIDENCE.json ghost trio, MIGRATION labels), orphan sweep (candidshiny plugin retired, brand glyph single-sourced, dead kernel exports pruned with census proof, searxng hostname-handler abuse fixed, imgfix lineage guard), and two deep purges (BPP 573-line extension-backend tombstone + its medium.com live ReferenceError; Prompt Master dead-CSS families). Gate CERTIFIED 100/100 throughout; every browser PoP battery green.");
    L.push("- **WO-01 Round-2 Stepwise Gap Mitigation (`suite v1.10.0`):** Four-agent re-audit of the round-1 tree (tools · kernel/build · canon · consistency — every round-1 fix re-verified HOLDING first) → build-contract batch (HostWarp searxng default pattern un-deadened — String(regexLiteral) delimiters made it permanently unmatchable; selectKernel closure + lawful-surface validation; CANON_KERNEL missing-module fails the file; store.remove() watcher contract pinned), canon source batch (BPP theathletic no-arg clearInterval() watcher bounded with handle + 30 s ceiling; Maximize_Any_Media version GM_info-derived; Images++ dead grant + .catch(now) timestamp-swallow honest; AlwaysNewWindow/HideBanner enumeration registries WeakMap+pruned-Set bounded; YTRVR dead escapeHTML reconciled), style-audit foreign-font-lead detector un-deadened (CRITICAL false-certification closed — colon never consumed, quoted-or-unquoted leads, font: shorthand family extraction; Cinzel Decorative recognized as the kernel-asserted brand-glyph typeface; Hailuo++/Images++ migrated to JetBrains Mono leads with rendering preserved), gate-integrity batch (polling census sees member-form intervals; Gate B comment-aware + RECONCILED_NAMES self-check — the mis-keyed BypassPaywalls section was dead config; codeOnly blanks regex bodies; bracket-form tripwires; error census resolves .catch(fnRef) one level; validate single-read/execPath/parity-before-score), kernel truth batch (hotkeys Plus/Minus/NumpadEnter aliases; beacon forensic channel aligned to the v4 contract — pre-rewrite request bodies + respond-verdict phantom fan; registry-full console.warn; SENTINEL LAW documented; JSDocs truthful), and the kernel-export census gate-wired (round-1 deferred item delivered: mechanical extraction, alias-aware consumers, bidirectional drift, G9 keep-ledger — 48 exports × 220 references machine-checked; glass.glyphEl pruned as the one true dead export, Ψ.core.$$ proved LIVE correcting the audit). Gate CERTIFIED at every commit; GUP v7.0.2 banner.");
    L.push("");
    return L.join("\n");
}

/* ── Main ────────────────────────────────────────────────────────────────── */

function main() {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    let wrote = 0, linked = 0;
    for (const s of INV.scripts) {
        const k = KNOWLEDGE[s.name];
        if (!k) throw new Error(`No KNOWLEDGE entry for ${s.name}`);
        if (k.documented) { linked++; continue; }
        const dir = path.join(DOCS_DIR, k.slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "README.md"), renderScript(s));
        wrote++;
    }
    fs.writeFileSync(path.join(DOCS_DIR, "INDEX.md"), renderIndex(INV.scripts));
    fs.mkdirSync(path.join(DOCS_DIR, "_suite"), { recursive: true });
    fs.writeFileSync(path.join(DOCS_DIR, "_suite", "FEATURE-MATRIX.md"), renderFeatureMatrix(INV.scripts));
    console.log(`  ✓ wrote ${wrote} script reference(s), linked ${linked} existing devlog(s), wrote INDEX.md`);
    console.log(`  ✓ docs complete: ${INV.scripts.length}/${INV.scripts.length} scripts covered`);
    return 0;
}

process.exit(main());
