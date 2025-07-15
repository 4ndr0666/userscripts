<!-- ─────────────────────────────────────────────────────────────────────────── -->
<!--  AGENTS.md  ·  Master Orchestration & Ticket Manifest (Pixverse++)         -->
<!--  Owner: 4ndr0666  ·  Generated: 2025-07-15                                 -->
<!-- ─────────────────────────────────────────────────────────────────────────── -->

# AGENTS — Pixverse++

> **Mission Statement**
> Ship a **drift-proof, production-grade** Pixverse++ userscript by executing a
> seven-step hardening plan through atomic, fully-auditable tickets while
> enforcing immediate rollback on any failure.

*Repository*: <https://github.com/4ndr0666/userscripts>
*Maintainer*: **4ndr0666** (Lead / Red-team Dev-Ops)
*Escalation Contact*: <andr0666@protonmail.com>
*Generated*: **2025-07-15**

---

## 0 · Table of Contents
1. [Executive Summary](#1--executive-summary)
2. [Current File Tree Snapshot](#2--current-file-tree-snapshot)
3. [Streams & Roles](#3--streams--roles)
4. [Ticket Matrix](#4--ticket-matrix)
5. [Detailed Ticket Specifications](#5--detailed-ticket-specifications)
6. [Roadmap & Sprint Cadence](#6--roadmap--sprint-cadence)
7. [Automation & Infrastructure Mandates](#7--automation--infrastructure-mandates)
8. [Approval Rubric (Go/No-Go)](#8--approval-rubric--go-no-go)
9. [Contribution Workflow](#9--contribution-workflow)
10. [Further Enhancements](#10--further-enhancements)
11. [Glossary](#11--glossary)
12. [Appendix A — Ticket YAML Stub](#appendix-a--ticket-yaml-stub)
13. [Appendix B — ADR Template](#appendix-b--adr-template)

---

## 1 · Executive Summary

Pixverse++ v2.0 is the *canonical* working userscript.
A **seven-step refactor plan** (Endpoint map → parseBody → robust selector → throttled observers → structuredClone → filename sanitiser → obfuscation helpers) is in progress.

Failures at Step 2 and Step 3 revealed the necessity of strict **one-feature-per-commit** and **instant rollback**.
This document converts that plan—and every lesson learned—into ticketed, cross-referenced tasks for the agent team.

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
├── 4ndr0tools-Pixverse++.user.js        ◀︎ canonical (v2.0)
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
│   └── …  (27 ancillary helper scripts)
└── pixverse\_builds
└── beta
├── AGENTS.md          ◀︎ experimental branch copy
└── pixversebeta.user.js

````
> **Authoritative baseline** = `4ndr0tools-Pixverse++.user.js` (tag v2.0).
> All tickets below reference this file unless stated otherwise.

---

## 3 · Streams & Roles

| Prefix | Stream / Role       | Core Responsibilities                               | Lead            |
| ------ | ------------------- | --------------------------------------------------- | --------------- |
| **ARC**| Architecture        | Design approvals, drift prevention, rollback guard  | 4ndr0666        |
| **ENG**| Core Engineering    | Userscript code, DOM logic, feature grafts          | *vacant*        |
| **QA** | Quality Assurance   | Regression tests, CI, rollback verification         | *vacant*        |
| **SEC**| Security/Red-Team   | Anti-fingerprint, anti-tamper, SBOM                 | *vacant*        |
| **DOC**| Documentation       | README, AGENTS.md upkeep, change-logs               | *vacant*        |
| **INF**| Infrastructure      | GitHub Actions, pre-commit hooks, repo hygiene      | *vacant*        |

*(Vacant leads are assigned per ticket; core lead escalates blockers.)*

---

## 4 · Ticket Matrix

| ID   | Stream | Step | Title                                        | Depends | Prio | Est hrs |
| ---- | ------ | ---- | -------------------------------------------- | ------- | ---- | ------- |
| PX-01| ENG    | 1    | Introduce `API_ENDPOINTS` map & helper       | —       | P0   | 1 |
| PX-02| ENG    | 2    | Add **parseBody()** & replace inline parsing | PX-01   | P0   | 1 |
| PX-03| ENG    | 3    | Implement robust watermark button selector   | PX-02   | P0   | 1 |
| PX-04| ENG    | 4    | Throttled, scoped MutationObservers          | PX-03   | P1   | 2 |
| PX-05| ENG    | 5    | Migrate deep copy to `structuredClone()`     | PX-04   | P1   | 1 |
| PX-06| ENG    | 6    | Filename sanitiser & pattern generator       | PX-05   | P2   | 1 |
| PX-07| ENG    | 7    | Consolidate obfuscation helpers              | PX-06   | P2   | 1 |
| PX-08| QA     | —    | Regression test + auto-rollback workflow     | PX-01…PX-07 | P0 | 2 |
| PX-09| DOC    | —    | Update README & inline docs for new APIs     | PX-07   | P1   | 1 |
| PX-10| INF    | —    | GitHub Action: lint → test → smoke → release | PX-08   | P1   | 2 |

---

## 5 · Detailed Ticket Specifications

### PX-01 · ENG · Step 1 — API_ENDPOINTS Map
**Goal** Stop string-fragile `includes()` checks.
- Add canonical `API_ENDPOINTS` (credits, videoList, batchUpload, singleUpload, creativePrompt).
- Helper `matchesEndpoint(url, key)` returns Boolean.
- Replace every `url.includes(...)` pattern in XHR/fetch logic.

**Acceptance**
- Unit tests confirm exact parity with v2.0 behaviour.
- Log line: `"[PX-01] endpoint matched: <key>"` appears for each request in dev console.

---

### PX-02 · ENG · Step 2 — Centralised parseBody()
**Goal** One robust parser for FormData/JSON payloads.
- Implement `parseBody(body)` in utils.
- Refactor XHR and fetch overrides to call it.
- Remove duplicated parsing logic.

**Acceptance**
- `savedMediaPath` captured identically to v2.0 (manual upload test).
- No site blackout / no moderation tripping.
- Revert automatically on fail (see PX-08 workflow).

---

### PX-03 · ENG · Step 3 — Robust Watermark Button Selector
**Goal** Fix selector drift that broke “Watermark-free” replacement.
Tasks
1. Add `findWatermarkButton()` with selector priority:
   `data-testid*="watermark"` → `aria-label*="watermark"` → button text.
2. Refactor `setupWatermarkButton()` to call helper.
3. Ensure replacement runs on SPA route changes.

**Acceptance**
- Manual QA: button replaced on *all* Pixverse pages with “Download” widget.
- No duplicate buttons, no console errors.

---

*(PX-04 → PX-10 follow identical format; omitted for brevity here.)*

Full ticket blocks are embedded in `docs/tickets/*.md` once generated.

---

## 6 · Roadmap & Sprint Cadence

| Sprint | Focus                          | Tickets                    | Duration |
| ------ | ----------------------------- | -------------------------- | -------- |
| **S-1**| Hardening Steps 1–3           | PX-01 · PX-02 · PX-03      | 5 days   |
| **S-2**| Observer & deep-copy upgrade  | PX-04 · PX-05              | 4 days   |
| **S-3**| Filename + obfuscation + QA   | PX-06 · PX-07 · PX-08      | 5 days   |
| **S-4**| Docs + CI/CD polish           | PX-09 · PX-10              | 3 days   |

---

## 7 · Automation & Infrastructure Mandates

| Aspect           | Requirement                                                         |
| ---------------- | ------------------------------------------------------------------- |
| **CI**           | Workflow: lint → unit → e2e → **auto-rollback if fail**.            |
| **Logging**      | All feature toggles + errors via `DEBUG_PREFIX = '[Pixverse++]'`.   |
| **Branch Policy**| `feat/PX-##-slug` only; squash-merge; Signed-off-by required.       |
| **Version Tags** | Semantic tags (`v2.0.1` etc.) by Action on successful release.      |
| **Rollback**     | GitHub Action reverts commit if QA job red.                         |

---

## 8 · Approval Rubric (Go/No-Go)

| Criterion        | Threshold                                   | Verified by |
| ---------------- | ------------------------------------------- | ----------- |
| Tests            | 100 % pass, coverage ≥ 95 %                 | QA / CI     |
| Functionality    | Manual smoke test = v2.0 parity + new feat. | ENG lead    |
| Drift Check      | Canonical diff shows *only* ticket changes. | ARC lead    |
| Docs             | README + AGENTS.md updated, no placeholders | DOC lead    |

---

## 9 · Contribution Workflow

1. **Branch** from `main` → `feat/PX-##-slug`.
2. Implement **only** the ticket scope.
3. `npm run lint && npm test` must pass.
4. Commit with `feat(PX-##): <summary>` + `Signed-off-by`.
5. Open PR; assign stream reviewer.
6. On *any* failure, merge **revert-PR** immediately; ticket returns to **TODO**.

---

## 10 · Further Enhancements

| Idea                         | Effort | Value                                           |
| ---------------------------- | ------ | ----------------------------------------------- |
| Hot-reload user settings UI  | M      | End-user toggles without reinstalling script.   |
| Telemetry Opt-in (anon)      | L      | Early bug detection with privacy compliance.    |
| Plugin API for Pixverse++    | L      | Community extensions after step 7 complete.     |

---

## 11 · Glossary

| Term          | Meaning                                   |
| ------------- | ----------------------------------------- |
| **PX-##**     | Pixverse++ ticket identifier.             |
| **Rollback**  | Git revert to previous passing commit.    |
| **SPA**       | Single-Page Application.                  |
| **StructuredClone** | Native deep-copy API in modern JS. |

---

## Appendix A — Ticket YAML Stub
```yaml
id: PX-999
stream: ENG
title: Short concise title
dependencies: []
priority: P3
est_hours: 1
description: |
  One paragraph description.
acceptance_criteria:
  - Bullet measurable outcomes.
deliverables:
  - Code / tests / docs
notes: |
  Implementation hints or edge-cases.
````

---

## Appendix B — ADR Template

```md
# ADR-PX-???? – <Decision Title>
Status: Proposed
Date: 2025-07-15

## Context
Why we need this decision now.

## Decision
The explicit design/engineering choice.

## Consequences
Positive + negative trade-offs.

## Alternatives Considered
Other options and rejections.
```

<!-- END OF AGENTS.md -->

```

---

### How to keep *us* on track

1. **Always reference ticket ID (PX-##) in every PR, commit, and chat update.**
2. **Reject changes** if they combine multiple tickets or stray from spec.
3. **QA must roll back immediately** on any failure—automated via PX-08 workflow.
4. A *passed* ticket moves the step marker; a *failed* ticket loops until green.

This eliminates drift and ensures Pixverse++ reaches a stable, production-grade release.
```
