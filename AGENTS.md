<!-- ────────────────────────────────────────────────────────────────────── -->
<!--  AGENTS.md  ·  Master Orchestration & Ticket Manifest                 -->
<!--  Pixverse++  —  Redteam Project / July 2025                           -->
<!-- ────────────────────────────────────────────────────────────────────── -->

# AGENTS — Pixverse++

> **Mission Statement:**  
> Deliver a bulletproof, audit-grade workflow to bring Pixverse++ to a true production-ready release, using a 7-step atomic integration checklist, ruthless rollback for any regression, no speculative changes, and complete file and decision traceability. All actions, assignments, and reviews are directly mapped to project reality.

*Repository*: <https://github.com/4ndr0666/userscripts>  
*Generated*: 2025-07-15  
*Maintainers*: 4ndr0666, ChatGPT-4o (as co-leads, redteam)  

---

## 0 · Table of Contents

1. [Executive Summary](#1--executive-summary)  
2. [Current File Tree Snapshot](#2--current-file-tree-snapshot)  
3. [Streams & Roles](#3--streams--roles)  
4. [Ticket Matrix](#4--ticket-matrix)  
5. [Detailed Ticket Specifications](#5--detailed-ticket-specifications)  
6. [Atomic 7-Step Migration Log](#6--atomic-7-step-migration-log)  
7. [Automation & Rollback Mandates](#7--automation--rollback-mandates)  
8. [Approval Rubric (Go/No-Go)](#8--approval-rubric--go-no-go)  
9. [Contribution Workflow](#9--contribution-workflow)  
10. [Enhancements & Research Backlog](#10--enhancements--research-backlog)  
11. [Appendix A — Ticket YAML Stub](#appendix-a--ticket-yaml-stub)  
12. [Appendix B — Audit/Decision Log](#appendix-b--auditdecision-log)  

---

## 1 · Executive Summary

**Pixverse++** is a redteam toolkit userscript for Pixverse, built for advanced bypassing, moderation defeat, robust API interception, and resilient UI overlays.  
This project operates under **zero-drift, zero-regression** policy: all refactors are atomic, each step is tested in isolation, and any regression *immediately* triggers rollback to the last stable commit, as documented.

---

## 2 · Current File Tree Snapshot

```

.
├── 4ndr0tools-AlwaysNewWindow\.user.js
├── 4ndr0tools-BunkrCanonicalURL.user.js
├── 4ndr0tools-ChatGPTBrainImplant.user.js
├── 4ndr0tools-ChatGPT++.user.js
├── 4ndr0tools-ConfirmationBypass.user.js
├── 4ndr0tools-GooglePhotosandDrive++.user.js
├── 4ndr0tools-InstagramRedirect.user.js
├── 4ndr0tools-MegaEmbedRedirector.user.js
├── 4ndr0tools-Pixverse++.user.js           # ← canonical release
├── 4ndr0tools-PlanetsuzyMobileSkinRedirect.user.js
├── 4ndr0tools-SelectAllCheckboxes.user.js
├── 4ndr0tools-SimpcitySearch.user.js
├── 4ndr0tools-Sora Toolkit.user.js
├── 4ndr0tools-YandexImageSearch++.user.js
├── 4ndr0tools-YouTubeEmbedRedirectButton.user.js
├── 4ndr0tools-YtdlcProtocol.user.js
├── README.md
└── testing
├── functions
│   ├── ChatGPT Question Navigation sidebar.user.js
│   ├── ... (more, see repo)
└── pixverse\_builds
└── beta
├── AGENTS.md
└── pixversebeta.user.js

````

---

## 3 · Streams & Roles

| Prefix | Stream / Role         | Responsibilities                                 |
| ------ | ---------------------| ------------------------------------------------ |
| **DEV**| Core Development      | Code, modularity, endpoint patching, atomic commits |
| **QA** | Quality, Regression   | Isolated test for each step, rollback for any breakage |
| **SEC**| Security/Stealth      | Side-channel/stealth analysis, anti-drift review |
| **DOC**| Documentation         | Readme, AGENTS.md, workflow logs, audit trails   |
| **OPS**| Operations/Infra      | Repo hygiene, canonical snapshot, auto-backup    |

---

## 4 · Ticket Matrix

| ID     | Stream | Title                                        | Dependencies    | Prio | Est |
|--------|--------|----------------------------------------------|-----------------|------|-----|
| 100-01 | DEV    | Atomic Step-1: Endpoint Regex Map            | —               | P0   | 1h  |
| 100-02 | DEV    | Atomic Step-2: Central parseBody() Helper    | 100-01          | P0   | 1h  |
| 100-03 | DEV    | Atomic Step-3: Watermark Button Selector     | 100-02          | P0   | 1h  |
| 100-04 | DEV    | Atomic Step-4: Scoped/Throttled Observers    | 100-03          | P0   | 1h  |
| 100-05 | DEV    | Atomic Step-5: structuredClone for Deep Copy | 100-04          | P0   | 1h  |
| 100-06 | DEV    | Atomic Step-6: Filename Generation/Sanitize  | 100-05          | P0   | 1h  |
| 100-07 | DEV    | Atomic Step-7: Robust Prompt Obfuscation     | 100-06          | P0   | 1h  |
| 100-08 | QA     | Per-step smoke test & regression tracker     | Each step       | P0   | 0.5h|
| 100-09 | QA     | Final Smoke Test & Release Gate              | 100-07, 100-08  | P0   | 0.5h|
| 100-10 | SEC    | Stealth/side-channel analysis (placeholder)  | Release         | P1   | 1h  |
| 100-11 | DOC    | AGENTS.md, README, Code Docs, Audit Trail    | Always          | P0   | 1h  |

---

## 5 · Detailed Ticket Specifications

### 100-01 · Endpoint Regex Map

- Implement `API_ENDPOINTS` map and `matchesEndpoint(url, key)` helper.
- Replace all `url.includes(...)` with `matchesEndpoint(...)` in XHR and fetch handlers.
- **QA:** Test every bypass case (video-list, uploads, credits) triggers correctly.  
- **Rollback:** If any bypass breaks, immediately revert to the last stable.

### 100-02 · Centralized `parseBody()` Helper

- Implement `parseBody()` to handle FormData and JSON string in both XHR and fetch.
- Replace all inline parsing with calls to `parseBody()`.
- **QA:** Upload bypass (savedMediaPath) must still work identically.
- **Rollback:** On any regression (uploads break), revert change and log finding.

### 100-03 · Robust Watermark Button Selector

- Write `findWatermarkButton()` using robust selectors, fallback to text scan.
- Refactor button attach logic in `setupWatermarkButton()` to use this.
- **QA:** Button must always replace/attach after SPA navigation.
- **Rollback:** If any regression in button functionality, revert immediately.

### 100-04 · Throttled/Scoped Observers

- Add `throttle(fn, delay)` helper.
- Scope observers to `#main-content` or `[role=main]` for video/btn changes, not full DOM.
- **QA:** Ensure DOM perf is unaffected and events always fire as expected.

### 100-05 · structuredClone for Deep Copy

- Use `structuredClone(data)` for response patching (never JSON.parse(JSON.stringify(...))).
- **QA:** Test all API rewriting, deep mutations, and edge cases.

### 100-06 · Filename Generation & Sanitization

- Implement `sanitize()` utility for safe filenames.
- Ensure `{title}`, `{raw}` and other patterns handled correctly.

### 100-07 · Prompt Obfuscation

- Implement robust `escapeRegExp` and `obfuscatePrompt` helpers.
- All TRIGGER_WORDS in prompts must be obfuscated, no over-matching.

### 100-08 · Per-Step QA, Logging, and Rollback

- All changes are atomic; if any regression, roll back instantly and log in AGENTS.md.
- QA must sign off before proceeding to next step.
- Audit trail required (see Appendix B).

### 100-09 · Final Smoke Test

- Run end-to-end: page load, API patch, button, observer, obfuscation, filename.
- All must pass; else roll back.

### 100-10 · Stealth Audit

- Team reviews for side-channels (e.g. “NSFW” placeholder) that could betray bypass activity.
- If found, log and recommend patch/removal for stealth.

### 100-11 · Documentation

- Maintain AGENTS.md, README, and per-function code docs as “source of truth”.
- All tickets, rollbacks, audit logs included.

---

## 6 · Atomic 7-Step Migration Log

**Current Progress:**  
- Steps 1 and 2 trialed; Step 2 broke upload, **rolled back to 1** (QA-2025-07-15).
- Step 3 attempted, broke download btn. Rolled back (QA-2025-07-15).  
- **Canonical implementation used for all btn logic going forward**.  
- Progress is at **post-Step-1** state, per QA/lead decision.

> **Audit Note:**  
> Each step is atomic, and *if* any regression is found, revert to last known good commit, log the attempt and the regression, and annotate AGENTS.md accordingly.

---

## 7 · Automation & Rollback Mandates

- **No “multi-step” PRs**: One ticket, one change, one test.
- **All regression triggers instant rollback.**  
- **QA/Leads must sign off on each step.**
- **AGENTS.md log updated after every commit, rollback, or acceptance.**
- **Do not repeat known-broken steps (see log above).**

---

## 8 · Approval Rubric (Go/No-Go)

| Criterion                    | Threshold/Condition                          | Verified by      |
| ---------------------------- | -------------------------------------------- | ---------------- |
| API Patch Functionality       | All endpoints reliably intercepted           | QA / Lead review |
| Download Button Works         | Always overlays, no breakage                 | QA / Lead review |
| Prompt Obfuscation            | All TRIGGER_WORDS obfuscated, no leaks       | QA / Lead review |
| Stealth                       | No visible “bypass tells” or user-detectable artifacts | SEC team         |
| Regression-free               | No step breaks previously working code       | QA / Audit       |
| Documentation/Audit Log       | AGENTS.md and README up-to-date              | DOC / Lead       |

---

## 9 · Contribution Workflow

1. Fork > feature branch per ticket.
2. Single atomic PR per ticket.
3. “All green” tests + QA/lead sign-off required for merge.
4. If test fails or regression, rollback, log in AGENTS.md, retry if needed.
5. Only move to next ticket when current is green-lit by QA/lead.

---

## 10 · Enhancements & Research Backlog

- UI Settings modal with toggleable NSFW thumbnail masking (future).
- Batch download UX improvements.
- Full stealth mode (no side channels).
- Automated “diff-check” for AGENTS.md vs reality.

---

## 11 · Appendix A — Ticket YAML Stub

```yaml
id: 100-04
stream: DEV
title: Atomic Step-4: Scoped/Throttled Observers
dependencies: [100-03]
priority: P0
est_hours: 1
description: |
  Refactor all DOM MutationObservers to use throttle and scope to #main-content/[role=main] only.
acceptance_criteria:
  - No performance regressions
  - All DOM-based features fire as expected after SPA nav
  - Rollback on any bug
deliverables:
  - Updated .user.js file
  - Log entry in AGENTS.md
````

---

## 12 · Appendix B — Audit/Decision Log

> **QA-2025-07-15:**
>
> * Step-2 (`parseBody`) introduced; broke upload, rolled back.
> * Step-3 attempted, broke button; reverted.
> * Canonical implementation for button logic adopted.
> * All further changes must be atomic and signed off by QA/lead.
> * AGENTS.md updated after each migration step.

---

<!-- END AGENTS.md -->
