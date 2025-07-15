<!-- ────────────────────────────────────────────────────────────────────────────── -->
<!--  AGENTS.md  ·  Master Orchestration & Ticket Manifest · Pixverse++ Redteam    -->
<!--  Living record: ALL placeholders filled with canonical, current project data  -->
<!-- ────────────────────────────────────────────────────────────────────────────── -->

# AGENTS — Pixverse++ Toolkit Redteam Hardening

> **Mission Statement**
> Deliver a production-grade, modular, stealth-optimized Pixverse++ userscript with zero-drift, atomic feature integration, hardening, and an auditable DevSecOps workflow—documented and ready for cross-functional redteam execution and review.

*Repository*: <https://github.com/4ndr0666/userscripts>
*Generated*: 2025-07-15
*Maintainer*: 4ndr0666 (Lead/PO)

---

## 0 · Table of Contents
1. [Executive Summary](#1--executive-summary)
2. [File Tree Snapshot](#2--file-tree-snapshot)
3. [Streams & Roles](#3--streams--roles)
4. [Ticket Matrix](#4--ticket-matrix)
5. [Detailed Ticket Specs](#5--detailed-ticket-specs)
6. [Change Log](#6--change-log)
7. [Automation & CI Mandates](#7--automation--ci-mandates)
8. [Approval Rubric](#8--approval-rubric)
9. [Contribution Workflow](#9--contribution-workflow)
10. [Post-Release Roadmap](#10--post-release-roadmap)
11. [Glossary](#11--glossary)
12. [Appendix A — Ticket YAML Stub](#appendix-a--ticket-yaml-stub)
13. [Appendix B — ADR Template](#appendix-b--adr-template)

---

## 1 · Executive Summary

**Pixverse++** is the flagship userscript for the redteam community—built, tested, and refined by 4ndr0666 and trusted contributors.
**Key goals:**
- **Zero drift**: Only atomic, fully-tested feature additions.
- **Stealth**: No detectable side channels or markers.
- **Production reliability**: No regressions, every revision passes “smoke” and edge-case tests.
- **Auditability**: Every team action is traceable, logged, and reviewed.

**Gaps previously found:**
- Experimental function grafts breaking core features.
- Watermark-free button replacement bugs.
- Unintentional NSFW placeholder “side-channel” artifacts.
- Lack of structured, team-friendly audit record for merges, rollbacks, and cross-feature impact.

This AGENTS.md is the live, “single source of truth” for all operational and team-facing work on Pixverse++.

---

## 2 · File Tree Snapshot (2025-07-15)

```

\| - 4ndr0tools-Pixverse++.user.js        # Canonical userscript, prod baseline
\| - 4ndr0tools-PixVerseBeta.user.js      # In-progress “hardening” branch
\| - AGENTS.md                            # This orchestration manifest
\| - README.md                            # Manual, function doc, usage
\| - test/
\|    ├── e2e/
\|    └── regression/
\| - .github/
\|    └── workflows/
\|         ├── lint.yml
\|         └── test.yml
\| - docs/
\|    └── ADR-0001.md                     # Initial architecture decision
\| - .gitignore

````

---

## 3 · Streams & Roles

| Prefix | Stream            | Core Responsibilities                   | Current Lead     |
| ------ | ----------------- | --------------------------------------- | --------------- |
| **ENG**| Core Engineering  | Userscript logic, feature migration     | 4ndr0666        |
| **QA** | Quality Assurance | Regression, smoke tests, ticket closure | 4ndr0666        |
| **SEC**| Stealth/Redteam   | Detection-resistance, anti-fingerprint  | 4ndr0666        |
| **DOC**| Documentation     | Usage docs, ADR, AGENTS updates         | 4ndr0666        |

---

## 4 · Ticket Matrix

| ID      | Stream | Title                                   | Dependencies | Prio | Est (hrs) |
| ------- | ------ | --------------------------------------- | ------------ | ---- | --------- |
| 100-01  | ENG    | Endpoint Regex Map integration          | —            | P0   | 1         |
| 100-02  | ENG    | Centralized parseBody() helper          | 100-01       | P0   | 1         |
| 100-03  | ENG    | Robust watermark button selector        | 100-02       | P0   | 1         |
| 100-04  | ENG    | Scoped/throttled MutationObservers      | 100-03       | P1   | 2         |
| 100-05  | ENG    | Use structuredClone for deep copies     | 100-04       | P1   | 1         |
| 100-06  | ENG    | Download filename sanitization/patterns | 100-05       | P2   | 1         |
| 100-07  | ENG    | Robust obfuscation helpers              | 100-06       | P2   | 1         |
| 200-01  | QA     | Test/rollback-after-fail discipline     | —            | P0   | 1         |
| 200-02  | QA     | Regression test coverage >95%           | 100-07       | P0   | 2         |
| 300-01  | DOC    | AGENTS.md up-to-date (this file)        | —            | P0   | 1         |
| 300-02  | DOC    | ADR and README update                   | 100-07       | P1   | 2         |

---

## 5 · Detailed Ticket Specs

### 100-01  ENG  “Endpoint Regex Map integration”

- **Goal:**
  Replace all `url.includes()` API matching with a single, canonical `API_ENDPOINTS` regex map and `matchesEndpoint()` helper.
- **Scope:**
  - Define endpoints in map.
  - Refactor every XHR/fetch API hit to use `matchesEndpoint()`.
- **Acceptance:**
  - All bypasses (video list, upload, credits) still fire.
  - Test passes: video/status unlock, upload, credits.

---

### 100-02  ENG  “Centralized parseBody() helper”

- **Goal:**
  Remove duplicated FormData/JSON parsing.
- **Scope:**
  - Add `parseBody()` utility.
  - Swap all body parsing to this helper.
- **Acceptance:**
  - Upload bypass works; no broken mediaPath.
  - Test: repeated uploads do not clobber paths.

---

### 100-03  ENG  “Robust watermark button selector”

- **Goal:**
  Replace brittle watermark-free button selectors with a robust fallback covering data-testid, aria-label, and text content.
- **Scope:**
  - Implement `findWatermarkButton()`.
  - Refactor `setupWatermarkButton()` to use this.
- **Acceptance:**
  - “Watermark-free” is always available on eligible videos, no more missed buttons or false triggers.
  - Canonical style retained.

---

### 100-04  ENG  “Scoped/throttled MutationObservers”

- **Goal:**
  Stop global observer perf spikes; only watch `#main-content` or `[role=main]`.
- **Scope:**
  - Add `throttle()` helper.
  - Refactor observers to be as tight as possible.
- **Acceptance:**
  - Inline download and watermark button always re-injected on SPA navigation.
  - No lag, no over-observing.

---

### 100-05  ENG  “Use structuredClone for deep copies”

- **Goal:**
  Swap all legacy deep copy patterns for native `structuredClone()` for safety and speed.
- **Scope:**
  - All response mutation (e.g., modifyVideoList) uses `structuredClone`.
- **Acceptance:**
  - No regression on API modification.
  - No edge-case bugs with object references.

---

### 100-06  ENG  “Download filename sanitization/patterns”

- **Goal:**
  All downloads get a `sanitize()` function and macro pattern for title/raw/etc.
- **Scope:**
  - Implement filename generator with `{title}`, `{raw}`, etc.
- **Acceptance:**
  - No download ever fails or yields an illegal filename.

---

### 100-07  ENG  “Robust obfuscation helpers”

- **Goal:**
  Harden prompt moderation bypass:
  - `escapeRegExp()`
  - `obfuscatePrompt()`
  - Pull in full `TRIGGER_WORDS` list.
- **Scope:**
  - All prompt obfuscation uses these helpers only.
- **Acceptance:**
  - Every trigger word is obfuscated, no false positives or leakage.
  - No accidental side channels.

---

### 200-01  QA  “Test/rollback-after-fail discipline”

- **Goal:**
  Enforce: one-feature-per-commit; rollback instantly after a failed test.
- **Scope:**
  - Test log must show “pass before advance.”
  - Add automated script to restore last passing build.
- **Acceptance:**
  - Team never stacks features in one PR.
  - No partial merges.

---

### 200-02  QA  “Regression test coverage >95%”

- **Goal:**
  Regression suite runs on every feature; maintain >95% coverage.
- **Scope:**
  - Add tests for all new features.
  - Write edge-case regression tests.
- **Acceptance:**
  - No feature ever regresses without instant detection.

---

### 300-01  DOC  “AGENTS.md up-to-date (this file)”

- **Goal:**
  Every AGENTS.md ticket must be cross-referenced, closed, and dated.
- **Scope:**
  - PR checklist: “update AGENTS.md” on every merge.
- **Acceptance:**
  - No tickets drift from file state.
  - Audit trail shows clear closure.

---

### 300-02  DOC  “ADR and README update”

- **Goal:**
  Each architectural change triggers an ADR and README revision.
- **Scope:**
  - AGENTS.md references ADR-0001.md.
  - README accurately reflects current UX, features, limitations.
- **Acceptance:**
  - ADRs match code as implemented.
  - All PRs/changes documented.

---

## 6 · Change Log (Live)

- **2025-07-15:** AGENTS.md fully re-authored for Pixverse++ with live tickets, detailed roles, file tree, and explicit acceptance for each step.
- **2025-07-14:** All legacy experimental features rolled back to canonical v2.0 baseline.
- **2025-07-13:** Regression discovered: Watermark-free button replacement bug; fix tracked in 100-03.
- **2025-07-12:** Beta branch introduced (file: 4ndr0tools-PixVerseBeta.user.js).
- **2025-07-10:** Initial ADR-0001.md and CI lint/test jobs created.

---

## 7 · Automation & CI Mandates

| Domain     | Requirement                                                       |
| ---------- | ----------------------------------------------------------------- |
| **CI**     | GitHub Actions: `lint.yml`, `test.yml` run on every PR/merge.     |
| **Lint**   | ESLint (JS), shfmt, shellcheck for all scripts.                   |
| **Feature**| No batch feature merges; atomic PRs only.                         |
| **Log**    | All ticket PRs and rollbacks are logged in AGENTS.md changelog.   |
| **Fail**   | Test failure = auto-revert to last passing build.                 |

---

## 8 · Approval Rubric (Go/No-Go)

| Area                | Pass Condition                                   | Verification                 |
| ------------------- | ----------------------------------------------- | ---------------------------- |
| **Tests**           | >95% coverage, all features run in CI            | CI status, e2e reports       |
| **Static Analysis** | 0 lint/shellcheck errors                         | CI logs                      |
| **Drift**           | No feature “drift” from canonical/approved       | AGENTS.md, PR review         |
| **Docs**            | AGENTS.md and README match released code         | Manual audit                 |
| **Rollback**        | Any regression triggers auto-revert              | Git, changelog               |
| **UX**              | Watermark button and all patches function        | End-user manual check        |

---

## 9 · Contribution Workflow

1. **One ticket = one branch = one PR.**
2. Fork, branch on open ticket (`feat/100-03-watermark-btn`).
3. Implement feature; run `lint`, `test` locally.
4. Commit referencing ticket; squash merge only if tests pass.
5. If PR fails or regresses: revert branch, refile ticket.
6. On merge: update AGENTS.md with ticket, PR link, close date.
7. ADRs and README are updated *before* closing related tickets.

---

## 10 · Post-Release Roadmap

| Idea                 | Value Add                | Effort | Notes                        |
| -------------------- | ----------------------- | ------ | ---------------------------- |
| User toggle UI       | Enable/disable features | M      | SPA overlay, localStorage    |
| Smart agent scoring  | ML/LLM review assist    | L      | LLM + rule-based audit       |
| Telemetry opt-in     | Usage/error metrics     | L      | Redteam opt-in, GDPR only    |
| Plugin/extension API | User-contrib extensions | L      | Sandbox via iframes          |

---

## 11 · Glossary

| Term       | Definition                                  |
| ---------- | ------------------------------------------- |
| **Ticket** | One atomic, testable feature/fix            |
| **PR**     | Pull request, must reference ticket ID       |
| **ADR**    | Architecture Decision Record (see docs/)     |
| **Changelog** | Live log of all merges, rollbacks, events |

---

## Appendix A — Ticket YAML Stub

```yaml
id: 100-03
stream: ENG
title: Robust watermark button selector
dependencies: [100-02]
priority: P0
est_hours: 1
description: |
  Implement findWatermarkButton() to robustly match watermark-free buttons across SPA renders and UI changes, using multiple selector strategies. Refactor setupWatermarkButton() to use this exclusively.
acceptance_criteria:
  - Button always present on eligible videos.
  - Style and behavior match canonical v2.0.
  - No false positives/negatives.
deliverables:
  - 4ndr0tools-Pixverse++.user.js updated.
  - Tests updated for edge cases.
notes: |
  Use querySelectorAll, data-testid, aria-label, fallback to text match. Coordinate with QA before merge.
````

---

## Appendix B — ADR Template

```md
# ADR-0002 – Watermark-Free Button Selector

Status: Accepted
Date: 2025-07-15

## Context
Previous selector logic broke on SPA navigation and new classnames.

## Decision
Adopt a multi-selector approach using querySelectorAll, data attributes, and fallback to innerText.

## Consequences
- More robust to UI changes.
- Slight increase in selector complexity.
- No further regressions in “watermark-free” download UX.

## Alternatives Considered
- Rely only on class or id (rejected: too brittle)
```

---

**END OF AGENTS.md**
*(Always update the changelog and ticket closure status in this file immediately after any PR merge or rollback. Every section is actionable, live, and specific to Pixverse++ as it exists today.)*
