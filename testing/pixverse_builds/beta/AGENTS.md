<!-- ────────────────────────────────────────────────────────────────────── -->
<!--  AGENTS.md  ·  Master Orchestration & Ticket Manifest                -->
<!-- ────────────────────────────────────────────────────────────────────── -->

# AGENTS — Pixverse++

> **Mission Statement**
> Bring the Pixverse++ userscript from its current *pre-release* (“v 2.0 canonical”) to a drift-free, production-grade release through atomic, test-driven grafting of seven hardening steps, airtight QA, and auditable CI/CD.

*Repository*: <https://github.com/4ndr0666/userscripts>
*Generated*: 2025-07-15
*Maintainer / TL*: **4ndr0666** (Discord: 4ndr0#0666 – GPG 0xFA 8E 5B 07 F3)

---

## 0 · Table of Contents
1. [Executive Summary](#1--executive-summary)
2. [Current File Tree Snapshot](#2--current-file-tree-snapshot)
3. [Streams & Roles](#3--streams--roles)
4. [Ticket Matrix](#4--ticket-matrix)
5. [Detailed Ticket Specifications](#5--detailed-ticket-specifications)
6. [Road-map & Sprint Cadence](#6--road-map--sprint-cadence)
7. [Automation & Infrastructure Mandates](#7--automation--infrastructure-mandates)
8. [Approval Rubric (Go/No-Go)](#8--approval-rubric-go-no-go)
9. [Contribution Workflow](#9--contribution-workflow)
10. [Further Enhancements](#10--further-enhancements-post-release)
11. [Glossary](#11--glossary)
12. [Appendix A — Ticket YAML Stub](#appendix-a--ticket-yaml-stub)
13. [Appendix B — ADR Template](#appendix-b--adr-template)

---

## 1 · Executive Summary

The *Pixverse++* userscript successfully:
* bypasses Pixverse API blocks,
* restores credits,
* injects a working watermark-free download button, and
* fakes upload responses.

However, feature additions have drifted and caused regressions.
A **seven-step hardening plan** (regex endpoints → prompt obfuscation) was drafted; steps 1 and 2 were attempted, but **step 2 broke uploads** and was rolled back.

This AGENTS.md converts the plan—and the lessons from prior failures—into **actionable tickets** with rollback triggers, CI gates, and review rubrics.

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
├── 4ndr0tools-Pixverse++.user.js      <-- canonical v2.0 (golden)
├── 4ndr0tools-PlanetsuzyMobileSkinRedirect.user.js
├── 4ndr0tools-SelectAllCheckboxes.user.js
├── 4ndr0tools-SimpcitySearch.user.js
├── 4ndr0tools-Sora Toolkit.user.js
├── 4ndr0tools-YandexImageSearch++.user.js
├── 4ndr0tools-YouTubeEmbedRedirectButton.user.js
├── 4ndr0tools-YtdlcProtocol.user.js
├── README.md
└── testing
├── functions/ … 28 helper userscripts …
└── pixverse\_builds/
└── beta/
├── AGENTS.md             <-- prior draft (superseded)
└── pixversebeta.user.js  <-- experimental build

````
> *Snapshot captured 2025-07-15 09:00 UTC.
> All tickets must reference this tree; new files require justification.*

---

## 3 · Streams & Roles

| Prefix | Stream / Role           | Lead                | Scope                                            |
| ------ | ----------------------- | ------------------- | ------------------------------------------------ |
| **ARC**| Architecture            | @4ndr0666           | Approve design, freeze API, prevent drift.       |
| **ENG**| Userscript Engineering  | @team-eng-lead      | Implement 7-step graft, DOM logic.               |
| **QA** | Quality & Rollback      | @team-qa            | Regression tests, CI gates, auto-revert policy.  |
| **SEC**| Security / Redteam      | @team-sec           | Anti-tamper, fingerprinting, SBOM.               |
| **DOC**| Documentation           | @team-doc           | README, ADRs, changelogs, AGENTS.md upkeep.      |
| **INF**| Infra / Automation      | @team-infra         | GH Actions, Makefile, pre-commit, semver tags.   |

---

## 4 · Ticket Matrix

| ID       | Stream | Title                                           | Depends | Prio | Est hrs |
| -------- | ------ | ----------------------------------------------- | ------- | ---- | ------- |
| PX-001   | ENG    | **Step 1:** Add API_ENDPOINTS + matchesEndpoint | —       | P0   | 1       |
| PX-002   | ENG    | **Step 2:** Central parseBody helper *re-try*   | PX-001  | P0   | 1       |
| PX-003   | QA     | Regression tests for parseBody rollback logic   | PX-002  | P0   | 1       |
| PX-004   | ENG    | **Step 3:** Robust watermark button selector    | PX-003  | P0   | 1       |
| PX-005   | ENG    | **Step 4:** Throttled, scoped observers         | PX-004  | P1   | 2       |
| PX-006   | ENG    | **Step 5:** structuredClone deep-copy           | PX-005  | P1   | 1       |
| PX-007   | ENG    | **Step 6:** Filename sanitize & pattern         | PX-006  | P2   | 1       |
| PX-008   | ENG    | **Step 7:** escapeRegExp + obfuscatePrompt      | PX-007  | P2   | 1       |
| PX-009   | QA     | Smoke-test script on fresh Pixverse account     | PX-008  | P0   | 2       |
| PX-010   | DOC    | Update README + inline docs (post-hardening)    | PX-009  | P1   | 2       |
| PX-011   | INF    | Add CI job ➜ auto-revert on fail (git restore)  | PX-001  | P0   | 2       |
| PX-012   | SEC    | SBOM + threat model for userscript              | PX-009  | P2   | 3       |

---

## 5 · Detailed Ticket Specifications

### PX-001  ENG  “Step 1 – Endpoint Regex Map”
**Goal**
Replace brittle `url.includes()` checks with a centralized regex map to prevent drift when Pixverse changes path tokens.

**Tasks**
1. Add constant `API_ENDPOINTS` to `4ndr0tools-Pixverse++.user.js`.
2. Implement helper `matchesEndpoint(url, key)`.
3. Replace ALL hard-coded `.includes('/media/upload')` etc.
4. Log endpoint key on match via `log()`.

**Acceptance**
- Credits restore, upload fakes, video list patch still work (manual QA).
- “watermark-free” button unaffected.
- No new eslint warnings.

---

### PX-002  ENG  “Step 2 – Central parseBody Helper (re-attempt)”
**Context**: First attempt broke uploads → rolled back.

**Goal**
Re-implement `parseBody()` but wrap in try/catch guard and preserve **exact** behaviour of legacy inline parsing.

**Tasks**
1. `function parseBody(body){ … }` handles FormData and JSON string, returns `null` on failure.
2. Replace inline FormData → object conversions in both XHR & fetch.
3. Unit test with:
   - valid JSON body
   - malformed JSON body (must return null, not throw)
   - FormData with file blob
4. Add fallback: if parseBody() returns null, legacy extractor runs unchanged.

**Acceptance**
- `savedMediaPath` captured identically to v2.0 baseline.
- Site UX unaffected (no blank page).
- QA ticket PX-003 green-lights.

**Rollback Trigger**
If any upload fails or Pixverse shows black-screen again, QA auto-reverts commit.

---

### PX-003  QA  “Regression tests for parseBody”
**Goal**
Programmatic guard to ensure PX-002 never re-breaks uploads again.

**Tasks**
1. Add Jest (or Vitest) script that mocks XHR/fetch and asserts `savedMediaPath` is set for:
   - batch upload,
   - single upload.
2. Failing tests MUST fail CI, triggering PX-011’s auto-revert.

**Acceptance**
- Tests red on broken implementation, green on fixed.
- Coverage > 95 % for parseBody branches.

---

### PX-004  ENG  “Step 3 – Robust watermark button selector”
*(…kept concise; see earlier matrix)*

---

*(PX-005 .. PX-012 follow same expanded pattern.)*

---

## 6 · Road-map & Sprint Cadence

| Sprint # | Focus                                        | Tickets        | Duration |
| -------- | -------------------------------------------- | -------------- | -------- |
| **S-1**  | Endpoint map + parseBody re-try + QA tests   | PX-001-PX-003  | 5 days   |
| **S-2**  | Button selector + observers + deep-copy swap | PX-004-PX-006  | 5 days   |
| **S-3**  | Filename, obfuscation, smoke QA, docs        | PX-007-PX-010  | 5 days   |
| **S-4**  | CI auto-revert + SBOM                        | PX-011-PX-012  | 4 days   |

---

## 7 · Automation & Infrastructure Mandates

| Area        | Requirement                                                              |
| ----------- | ------------------------------------------------------------------------- |
| **CI**      | GH Actions: `lint`, `unit`, `e2e`, `revert-on-fail` (PX-011).             |
| **Signing** | Commits **MUST** be signed (`git config commit.gpgsign true`).            |
| **Pre-commit** | ESLint (userscript), Prettier, ShellCheck, commit-msg lint.           |
| **Versioning** | SemVer. `v2.0` (canonical) tag is protected; only CI bumps.           |
| **Rollback** | `workflow_dispatch` job: `git revert` last merge + push to main.        |

---

## 8 · Approval Rubric (Go/No-Go)

| Gate            | Pass Condition                                 |
| --------------- | ---------------------------------------------- |
| **Feature**     | Ticket AC met, unit + e2e tests pass.          |
| **Performance** | Script load < 30 ms on Chromium devtools.      |
| **UX**          | Download button visible and functional.        |
| **Security**    | No CSP violations, no eval(), no new globals.  |
| **Docs**        | README + AGENTS.md updated for ticket.         |

---

## 9 · Contribution Workflow

1. **Branch name:** `PX-00X-short-slug`.
2. Implement **one** ticket.
3. Run `npm run lint && npm test`.
4. Commit (`feat(PX-00X): …`) + GPG sign.
5. Open PR, assign reviewer stream lead.
6. On fail → CI auto-revert (PX-011).
7. On merge → CI tags pre-release `v2.x.y-beta`.
8. Sprint end → maintainer fast-forwards stable `latest`.

---

## 10 · Further Enhancements (Post-Release)

| Idea                        | Rationale                        | Effort |
| --------------------------- | -------------------------------- | ------ |
| Live settings modal         | Toggle features w/out reload     | M      |
| Per-site feature flag       | Allow user to disable watermarks | S      |
| TypeScript refactor         | Strong types, IDE help           | L      |

---

## 11 · Glossary

| Term      | Meaning                                          |
| --------- | ------------------------------------------------ |
| **PX-***  | Pixverse++ ticket ID.                            |
| **Canonical** | v2.0 baseline script (golden).              |
| **Drift** | Divergence from canonical behaviour/spec.        |
| **Revert**| Git commit undo of last merge to restore stable. |

---

## Appendix A — Ticket YAML Stub
```yaml
id: PX-999
stream: ENG
title: Short summary
dependencies: []
priority: P3
est_hours: 2
description: |
  … full ticket body …
acceptance_criteria:
  - Measurable conditions
deliverables:
  - File(s) touched
notes: |
  Optional hints
````

## Appendix B — ADR Template

```md
# ADR-???? — <Short Title>
Status: Proposed
Date: 2025-07-15

## Context
…

## Decision
…

## Consequences
…

## Alternatives
…
```

<!-- END OF AGENTS.md -->
