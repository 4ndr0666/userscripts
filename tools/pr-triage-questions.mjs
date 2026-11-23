/**
 * Centralized TypeSafe System One question registry for 4ndr0666/userscripts PR & Suite Triage.
 * DRY single source of truth (DB-002): SHA-256 fingerprinted in decision.contract.json.
 *
 * Judgments come from System One; deterministic routing and merge gating live in code.
 * Final merge acceptance is always enforced deterministically by `npm run check` and `contract.json`.
 */

export const TRIAGE_THRESHOLDS = Object.freeze({
  touches_dist_only: Object.freeze({ low: 0.3, high: 0.7 }),
  touches_kernel_module: Object.freeze({ low: 0.3, high: 0.7 }),
  adds_new_script: Object.freeze({ low: 0.3, high: 0.7 }),
});

export const TRIAGE_QUESTIONS = Object.freeze({
  touches_dist_only: Object.freeze({
    primitive: "noul",
    request_group: "pr_triage_bundle",
    prompt: "Does `pr_diff_summary` edit generated `dist/` userscripts without corresponding upstream edits in `src/` or `kernel/`?",
    true_criterion: "The diff modifies one or more files in `dist/` while leaving matching `src/` and `kernel/` sources untouched.",
    false_criterion: "The diff edits upstream `src/`, `kernel/`, `tools/`, `tests/`, or `scripts/` sources (with or without regenerated `dist/` artifacts).",
  }),
  touches_kernel_module: Object.freeze({
    primitive: "noul",
    request_group: "pr_triage_bundle",
    prompt: "Does `pr_diff_summary` modify shared runtime code inside `kernel/`?",
    true_criterion: "At least one of the 7 kernel modules (`brand.js`, `core.js`, `glass.js`, `hosts.js`, `hotkeys.js`, `net.js`, `store.js`) is modified.",
    false_criterion: "All changed files reside outside the `kernel/` directory.",
  }),
  adds_new_script: Object.freeze({
    primitive: "noul",
    request_group: "pr_triage_bundle",
    prompt: "Does `pr_diff_summary` introduce a brand-new installable userscript in `src/`?",
    true_criterion: "A new `src/4ndr0tools - <Name>.user.js` file or new modular `src/<name>/meta.json` directory is added.",
    false_criterion: "The PR only updates existing scripts, tooling, tests, or documentation without adding a new installable.",
  }),
  target_family: Object.freeze({
    primitive: "choice",
    request_group: "pr_triage_bundle",
    speculative: true,
    null_guard_noul_id: "adds_new_script",
    prompt: "Which canonical `userscripts` suite family best matches the new script described in `pr_diff_summary`?",
    options: Object.freeze({
      media_and_links: "Link extraction, streaming, file hosts, or media-download utilities (LinkMaster, m3u8, Bunkr, Pixeldrain, Gofile, Filester, Blob2URL, Stream Interceptor).",
      images: "Image galleries, reverse image search, or image host enhancements (Images++, YandexImageSearch++, GooglePhotosandDrive++).",
      video_and_players: "Video player controls, filters, or video platform utilities (YouTube, YT Filter, Media Player Controller, Maximize, Redgifs).",
      forums: "Forum navigation, thread extraction, confirmation bypass, or model search utilities.",
      privacy_and_security: "Ad/tracker blocking, purge, service guard, recon, or paywall bypass utilities.",
      ux_utilities: "General browser UX, windowing, translation, login autofill, HostWarp, or PageCraft utilities.",
      sovereign_platforms: "AI/LLM platform suites and creative studio tools (Prompt Master, Watermark++, Hailuo++, Instagram++, Zai, ChatGPT++).",
    }),
  }),
  risk_severity: Object.freeze({
    primitive: "score",
    request_group: "pr_triage_bundle",
    prompt: "What is the blast radius of the changes described in `pr_diff_summary`?",
    levels: Object.freeze({
      low_cosmetic: "Documentation, comments, metadata wording, or isolated single-script CSS/UI tweaks.",
      medium_single_script: "Behavioral logic change confined to one userscript in `src/` with no shared kernel or build changes.",
      high_kernel_or_build: "Changes to `kernel/`, `tools/build.mjs`, `contract.json`, or cross-cutting security/OPSEC gates affecting all 39 installables.",
    }),
  }),
});
