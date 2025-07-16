# AGENTS.md — Pixverse++

**(Audit-Grade, Ticketized, Redteam/4ndr0666/ChatGPT-4o co-lead, July 2025)**

---

## Executive Audit: Issues, Mandates, Corrections

**This project is governed by:**

* Atomic, 7-step migration (regex endpoints → prompt obfuscation).
* Rollback on *any* regression, logged in AGENTS.md/Audit Log.
* Canonical (v2.0) script is the only “source of truth” for any controversial feature.
* Team-leads (4ndr0666, ChatGPT-4o) are gatekeepers: code merges only after QA/test passes and full ticket/decision log update.
* Stealth and user experience are “P0” priorities: **no UI side channels (e.g. NSFW placeholder), no broken download button, no API drift**.

---

## File Tree Snapshot (`2025-07-15T09:00 UTC`)

```
.
├── 4ndr0tools-AlwaysNewWindow.user.js
├── 4ndr0tools-BunkrCanonicalURL.user.js
├── 4ndr0tools-ChatGPTBrainImplant.user.js
├── 4ndr0tools-ChatGPT++.user.js
├── 4ndr0tools-ConfirmationBypass.user.js
├── 4ndr0tools-GooglePhotosandDrive++.user.js
├── 4ndr0tools-InstagramRedirect.user.js
├── 4ndr0tools-MegaEmbedRedirector.user.js
├── 4ndr0tools-Pixverse++.user.js        # ← CANONICAL (production)
├── 4ndr0tools-PlanetsuzyMobileSkinRedirect.user.js
├── 4ndr0tools-SelectAllCheckboxes.user.js
├── 4ndr0tools-SimpcitySearch.user.js
├── 4ndr0tools-Sora Toolkit.user.js
├── 4ndr0tools-YandexImageSearch++.user.js
├── 4ndr0tools-YouTubeEmbedRedirectButton.user.js
├── 4ndr0tools-YtdlcProtocol.user.js
├── README.md
└── testing/
    ├── functions/
    └── pixverse_builds/
        └── beta/
            ├── AGENTS.md  # this file
            └── pixversebeta.user.js
```

*(Snapshot is authoritative for all tickets. Any new file = ticket + justification.)*

---

## Streams & Roles

| Prefix  | Stream / Role          | Lead/Contact            | Scope                                         |
| ------- | ---------------------- | ----------------------- | --------------------------------------------- |
| **ARC** | Architecture           | 4ndr0666                | Approve design, freeze API, prevent drift     |
| **ENG** | Userscript Engineering | ChatGPT-4o (as co-lead) | Implement step-by-step, *no* untested changes |
| **QA**  | Quality & Rollback     | Redteam QA              | Regression tests, auto-revert, smoke QA       |
| **SEC** | Security / Redteam     | Redteam SEC             | Anti-tamper, stealth, side-channel hunting    |
| **DOC** | Documentation          | Redteam DOC             | Readme, AGENTS.md, changelogs, traceability   |
| **OPS** | Infra / Automation     | Redteam OPS             | CI, GH Actions, Makefile, versioning, SBOM    |

---

## 4 · Ticket Matrix

| ID     | Stream | Title                                     | Depends   | Prio | Est  |
| ------ | ------ | ----------------------------------------- | --------- | ---- | ---- |
| PX-001 | ENG    | Step 1: API\_ENDPOINTS + matchesEndpoint  | —         | P0   | 1h   |
| PX-002 | ENG    | Step 2: Central parseBody helper (re-try) | PX-001    | P0   | 1h   |
| PX-003 | QA     | Regression test/guard for parseBody       | PX-002    | P0   | 1h   |
| PX-004 | ENG    | Step 3: Robust watermark button selector  | PX-003    | P0   | 1h   |
| PX-005 | ENG    | Step 4: Throttled, scoped observers       | PX-004    | P1   | 2h   |
| PX-006 | ENG    | Step 5: structuredClone deep-copy         | PX-005    | P1   | 1h   |
| PX-007 | ENG    | Step 6: Filename sanitize & pattern       | PX-006    | P2   | 1h   |
| PX-008 | ENG    | Step 7: escapeRegExp + obfuscatePrompt    | PX-007    | P2   | 1h   |
| PX-009 | QA     | Per-step smoke test & regression tracker  | Each step | P0   | 0.5h |
| PX-010 | SEC    | Stealth Audit (no “bypass tells”)         | PX-009    | P0   | 0.5h |
| PX-011 | INF    | Add CI job for auto-revert on fail        | PX-001    | P0   | 2h   |
| PX-012 | DOC    | Documentation updates (README, AGENTS.md) | PX-011    | P0   | 1h   |

---

## 5 · Detailed Ticket Specifications (all actions referenced to canonical log)

---

### PX-001  ENG  “Step 1 – Endpoint Regex Map”

* **Goal:** Centralize all API endpoint logic, kill all drift from hard-coded `.includes`.
* **Tasks:**

  * Add `API_ENDPOINTS` to `4ndr0tools-Pixverse++.user.js`.
  * Add helper `matchesEndpoint(url, key)`.
  * Replace ALL hard-coded `.includes()` with helper.
  * *Do not* change any other logic, especially the download button or DOM.
* **Acceptance:**

  * *All features work as in v2.0*, as confirmed by manual QA.
* **Rollback Trigger:**

  * Any regression → auto-rollback and ticket comment.
* **Log:**

  * **Complete**.

---

### PX-002  ENG  “Step 2 – Central parseBody Helper (re-attempt)”

* **Goal:** Parse fetch/XHR bodies robustly, match canonical v2.0 behavior exactly.
* **Tasks:**

  * Implement `parseBody(body)` with *full try/catch guards*.
  * *If* `parseBody` returns null, fall back to legacy inline extractor.
  * **DO NOT** break upload or change response structure.
* **Acceptance:**

  * No blank screen, no upload regression.
  * *QA PX-003* must pass before proceeding.
* **Rollback Trigger:**

  * Any regression = rollback, update audit log.
* **Log:**

  * **Rolled back** (see [QA-2025-07-15](#12--auditdecision-log)).

---

### PX-003  QA  “Regression tests for parseBody”

* **Goal:** Block all regressions in upload path.
* **Tasks:**

  * Add Jest/Vitest test for batch/single upload (mock XHR/fetch), must pass for merge.
* **Acceptance:**

  * Coverage >95%, regression blocks merge.
* **Log:**

  * *Ongoing; no breakage allowed.*

---

### PX-004  ENG  “Step 3 – Robust watermark button selector”

* **Goal:** Replace watermark-free button with robust, multi-selector, *never broken* logic.
* **Tasks:**

  * Implement `findWatermarkButton()` using robust selectors.
  * If selector fails, **do NOT** break UX or remove working download.
  * *Canonical download btn logic (v2.0)* is mandatory.
* **Acceptance:**

  * Button is never missing, always overlays.
* **Rollback Trigger:**

  * Any break = revert to v2.0 code.
* **Log:**

  * Regression detected, **rolled back**. Canonical logic now locked.

---

### PX-005 .. PX-012 (see AGENTS.md for full ticket specs)

*All follow the above format: atomic, regression-tested, audit-trailed, with rollback and QA checkpoints.*

---

## 6 · Atomic 7-Step Migration Log

* **PX-001:** Complete, passes QA.
* **PX-002:** Broke upload, *rolled back to Step 1* (QA-2025-07-15).
* **PX-003:** Regression test running, blocks future parseBody errors.
* **PX-004:** Broke button (missing download), *reverted*; **canonical implementation locked in**.
* **Current State:** *Post-Step-1, canonical button logic enforced*.
* **Mandate:** *No further attempt at step 2/3 unless regression test passes pre-merge.*

---

## 7 · Automation & Rollback Mandates

* **No “multi-step” PRs**—*one change, one ticket, one test*.
* **All regression = instant rollback.**
* **QA/Leads sign off every step.**
* **AGENTS.md log updated after every commit, rollback, acceptance.**
* **Never repeat known-broken steps (log above is authoritative).**
* **Stealth = P0: No UI tells, no NSFW placeholders, no non-canonical UI.**

---

## 8 · Approval Rubric (Go/No-Go)

| Gate                | Pass Condition                                   | Verified By |
| ------------------- | ------------------------------------------------ | ----------- |
| **Feature**         | Ticket AC met, unit/e2e tests pass               | QA / Lead   |
| **Performance**     | Script load < 30 ms in Chromium devtools         | QA / Lead   |
| **UX**              | Download button visible and functional           | QA / Lead   |
| **Stealth**         | No CSP, UI, or side-channel reveals (see PX-010) | SEC         |
| **Regression-free** | No step breaks previous working code             | QA / Audit  |
| **Docs**            | README + AGENTS.md updated after every ticket    | DOC         |

---

## 9 · Contribution Workflow

1. **Fork → feature branch per ticket** (`PX-00X-desc`).
2. **Single atomic PR per ticket.**
3. `npm run lint && npm test` (add stubs as required).
4. **Commit:** `feat(PX-00X): …` + GPG sign.
5. **Open PR, assign reviewer stream lead.**
6. **If any fail:** CI auto-revert (PX-011).
7. **On merge:** CI tags pre-release `v2.x.y-beta`.
8. **Sprint end:** maintainer fast-forwards `latest`.

---

## 10 · Enhancements & Research Backlog

* UI settings modal with toggle for NSFW thumbnail masking (future).
* Full stealth mode: no side-channel leaks, no visible artifact.
* Batch download UX.
* Automated diff-check for AGENTS.md vs. repo reality.

---

## 11 · Glossary

| Term          | Meaning                                  |
| ------------- | ---------------------------------------- |
| **PX-**\*     | Pixverse++ ticket ID (see Ticket Matrix) |
| **Canonical** | v2.0 baseline script, enforced by audit  |
| **Drift**     | Any non-ticket, unreviewed code change   |
| **Revert**    | Git undo of last merge/commit            |

---

## 12 · Audit/Decision Log

* **QA-2025-07-15:** Step-2 (`parseBody`) broke upload; rolled back.
* **QA-2025-07-15:** Step-3 (`btn selector`) broke download button; reverted; canonical logic locked.
* **QA-2025-07-15:** All further changes must be atomic, reviewed, and signed off by QA/lead.

---

## Appendix A — Ticket YAML Stub

```yaml
id: PX-XXX
stream: ENG
title: Short ticket summary
dependencies: [PX-YYY]
priority: P0
est_hours: 1
description: |
  Ticket goal, specific and measurable.
acceptance_criteria:
  - List of testable outcomes
deliverables:
  - Files touched
notes: |
  Additional hints or references.
```

---

## Appendix B — ADR Template

```md
# ADR-XXXX — <Short Title>
Status: Proposed
Date: 2025-07-15

## Context
<Reason for change, constraints, alternatives>

## Decision
<Exactly what was chosen>

## Consequences
<Benefits, risks, and tradeoffs>

## Alternatives
<Other paths not chosen>
```

---

# **ACTIONABLE SUMMARY (for the team, not for audit)**

1. **Work only from AGENTS.md as “single source of truth.”**
2. **Do NOT re-attempt parseBody or button selector until regression test ticket passes.**
3. **Any new feature = new ticket.**
4. **Log *all* breakages and rollbacks here.**
5. **Canonical (v2.0) userscript is non-negotiable for download button and upload logic.**
6. **No side-channel tells.**
7. **QA/Leads (4ndr0666, ChatGPT-4o) must sign-off each ticket and update AGENTS.md.**

---

**This file now supersedes all prior orchestration manifests for Pixverse++.
The team is to work ticket-by-ticket, no drift, no multi-step merges.**

---

**Team: Begin work at PX-004 only after all PX-002/PX-003 acceptance criteria are green-lit and logged. No exceptions.**

---
