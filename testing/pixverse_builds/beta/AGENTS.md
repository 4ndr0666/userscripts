<!-- ──────────────────────────────────────────────────────────────── -->
<!--  AGENTS.md · Pixverse++ Orchestration & Ticket Ledger           -->
<!--  Strictly production, redteam-focused.                          -->
<!-- ──────────────────────────────────────────────────────────────── -->

# AGENTS — Pixverse++

> **Mission Statement**
> Deliver and maintain a hardened, production-grade Pixverse++ userscript:
> *Bypass video blocks, unlock downloads, restore credits, bypass NSFW moderation, defeat contextmenu blockers, and provide a minimal cyan-glass UI—across all SPA navigation, with zero drift and complete test/audit coverage.*

*Repository*: <https://github.com/4ndr0666/userscripts>
*Generated*: 2025-07-15
*Maintainer*: 4ndr0666 (Discord: 4ndr0#0666 / Matrix: @4ndr0:matrix.org)
*Status*: **Active Sprint** (Production Hardening, Phase 2/3)

---

## 0 · Table of Contents

1. [Project File Tree](#1--project-file-tree)
2. [Streams & Roles](#2--streams--roles)
3. [Critical Incidents & Audit Log](#3--critical-incidents--audit-log)
4. [Feature Integration Tracker (7-Step Checklist)](#4--feature-integration-tracker-7-step-checklist)
5. [Detailed Tickets & Acceptance Criteria](#5--detailed-tickets--acceptance-criteria)
6. [Automation & Release Workflow](#6--automation--release-workflow)
7. [Approval Rubric (Go/No-Go)](#7--approval-rubric-go-no-go)
8. [Contribution Rules & Rollback Mandate](#8--contribution-rules--rollback-mandate)
9. [Future Enhancements & Expansion](#9--future-enhancements--expansion)
10. [Appendix](#appendix)

---

## 1 · Project File Tree

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
├── 4ndr0tools-Pixverse++.user.js       # <--- Canonical, production Pixverse++ script
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
│   └── ... (21 scripts)
└── pixverse\_builds
└── beta
├── AGENTS.md
└── pixversebeta.user.js

```

> **Authoritative Canonical:**
> `4ndr0tools-Pixverse++.user.js` in repo root
> `testing/pixverse_builds/beta/pixversebeta.user.js` for pre-release builds

---

## 2 · Streams & Roles

| Stream | Role/Responsibility                         | Lead            |
| ------ | ------------------------------------------- | --------------- |
| **CORE** | Feature engineering, bugfix, refactor     | 4ndr0666        |
| **UI**   | UI/UX (toast, settings, watermark btn)    | 4ndr0666        |
| **QA**   | Testing, regression, rollbacks, coverage  | 4ndr0666        |
| **SEC**  | Redteam, anti-blocker, NSFW bypass        | 4ndr0666        |
| **DOC**  | Readme, embedded comments, docs           | 4ndr0666        |
| **OPS**  | Repo hygiene, AGENTS.md, automation       | 4ndr0666        |

---

## 3 · Critical Incidents & Audit Log

- **2024-07-05**: Canonical script achieves full API bypass (credits, uploads), SPA-safe watermark replacement, contextmenu neutralization, prompt obfuscation (zero-width space).
- **2024-07-07**: Regression in `parseBody()` step (Step 2/7) triggers site breakage. Rollback restored canonical operation (per escalation ticket QA-002).
- **2024-07-10**: Download button bug re-appears in some SPA contexts. Canonical version confirmed to always function. All subsequent work must reference this code.
- **2024-07-12**: Placeholder “nsfw” thumbnail issue flagged as potential side-channel risk. Decision: maintain actual thumbnail for stealth, but enable toggle in future UI.
- **2024-07-13**: AGENTS.md audit and sprint board ratified.
- **2024-07-15**: Audit snapshot finalized. Production status: Stable. 7-step feature integration tracker now the only allowed merge path.

---

## 4 · Feature Integration Tracker (7-Step Checklist)

| Step | Feature                           | Status    | Date        | Notes                                  |
|------|-----------------------------------|-----------|-------------|----------------------------------------|
| 1    | Endpoint Regex Map                | ✔️ Complete  | 2024-07-07  | All `includes()` now use `matchesEndpoint` |
| 2    | Centralized parseBody()           | ❌ Rolled Back | 2024-07-07  | Broke site; reverted per audit logs    |
| 3    | Robust Watermark Button Selector  | ⏸️ Pending   |             | To be re-integrated after Step 2 fix   |
| 4    | Throttled, Scoped Observers       | ⏸️ Pending   |             | Planned after btn selector validation  |
| 5    | structuredClone() for Deep Copy   | ⏸️ Pending   |             | Awaiting observer/test stabilization   |
| 6    | Filename Generation/Sanitization  | ⏸️ Pending   |             | To be merged post core stability       |
| 7    | Obfuscation Helpers, Final Review | ⏸️ Pending   |             | Final step, post smoke test            |

---

## 5 · Detailed Tickets & Acceptance Criteria

### QA-001 · “Audit canonical implementation and migration map”

**Goal:**
Create and lock in a “living” canonical Pixverse++ that all future work references for rollback/merge reviews.

**Acceptance Criteria:**
- All devs use `4ndr0tools-Pixverse++.user.js` as baseline.
- All “feature breaks” (site fails, button bugs, etc) result in immediate revert.
- All PRs reference audit log and affected step in 7-step plan.

---

### CORE-001 · “Re-integrate Step 3: Watermark Button Selector (Post-Step 2 Fix)”

**Goal:**
Replace brittle watermark button logic with a robust, class/attribute-based selector.

**Acceptance Criteria:**
- New selector must find all download btn variants in SPA, fallback to canonical only if bug encountered.
- Button must always work; fallback to contextmenu if missing.

---

### QA-002 · “Rollback policy for regression during integration”

**Goal:**
If any feature step breaks site or user flow, **immediate rollback to last-known-good.**

**Acceptance Criteria:**
- No further feature merges allowed until regression fixed and audit signed off.

---

### SEC-001 · “NSFW Thumbnail Toggle & Stealth Mode”

**Goal:**
Implement UI toggle for “NSFW placeholder” vs. “real thumbnail” to enable stealth on redteam engagements.

**Acceptance Criteria:**
- Default is real thumbnail (stealth), toggle sets placeholder on demand.
- All changes logged in AGENTS.md.

---

*(Further tickets available in project backlog. Add as needed.)*

---

## 6 · Automation & Release Workflow

- **Canonical Source**: `4ndr0tools-Pixverse++.user.js`
- **Dev/Pre-release**: `testing/pixverse_builds/beta/pixversebeta.user.js`
- **Sprint Work**: Only 1 feature per branch, PR must reference audit ticket/step.
- **CI/CD**: (Manual) Lint, review, QA before production merge.
- **Rollback**: Immediate on fail; audit logs required.

---

## 7 · Approval Rubric (Go/No-Go)

| Area                | Pass Condition                             | Verification             |
| ------------------- | ------------------------------------------ | ------------------------ |
| **Regression**      | No breakage of core feature (API bypass, download) | Manual & user test   |
| **Stealth**         | No unique side-channel footprint (“NSFW” placeholder must be toggleable) | Code/QA review    |
| **Rollbacks**       | All failed steps immediately reverted      | AGENTS.md log, commit history |
| **UI Consistency**  | Minimal cyan-glass; no intrusive overlays  | User/lead approval       |
| **Code Style**      | Comments, variable naming, DRY             | Lead review              |

---

## 8 · Contribution Rules & Rollback Mandate

- **No multi-feature merges:** One feature/bug per branch/PR.
- **Test in isolation:** Each step is merged/tested before proceeding.
- **Rollback on fail:** If any regression or break, revert to canonical code.
- **Audit before release:** Every feature/bugfix must be logged in AGENTS.md with timestamp and rationale.

---

## 9 · Future Enhancements & Expansion

| Ticket        | Idea / Feature             | Value Add / Notes                      |
| ------------- | ------------------------- | -------------------------------------- |
| UI-001        | Settings modal for toggles | End-user can enable/disable NSFW, toast, anti-blockers, etc. |
| UI-002        | Polished glassy cyan theme | Final UI after functional signoff      |
| SEC-002       | Advanced anti-fingerprint  | Reduce script detection footprint      |
| CORE-003      | Obfuscate prompt more generically | Regex bypass hardening         |
| QA-003        | Automated test suite       | End-to-end SPA navigation test harness |
| DOC-001       | Expanded AGENTS.md + README| Diagram, examples, glossary            |

---

## Appendix

### 7-Step Integration Plan

- Step-by-step, atomic feature grafting, *with test/rollback at each stage*. No skipping steps, no batch merges.
- Always maintain a living, “audit-logged” AGENTS.md with actual merge/failure dates and reasons.

### Changelog

- **2024-07-07:** Rolled back Step 2 (`parseBody`) due to critical site break.
- **2024-07-10:** Canonical download btn logic reaffirmed.
- **2024-07-12:** Placeholder/stealth toggle ticket added.

---

*This AGENTS.md is now the official “contract” for all team/agent development on Pixverse++.
All merges and branches must reference the tickets and log changes here.
For rollbacks, copy/paste the previous working script and note the incident here.*

---

# END OF AGENTS.md
