#!/usr/bin/env node
/**
 * 4ndr0neering v8.3.0 Decision-Boundary Smoke Battery (DB-001..DB-012)
 * Validates decision.contract.json (including tools/pr-triage-questions.mjs SHA-256)
 * and verifies deterministic offline truth-table evaluation across 4 scenarios:
 *   1. dist-only PR -> request_port_to_src_before_merge
 *   2. new script PR -> register_family_and_bump_contract_installables
 *   3. indeterminate middle band + null-guard -> escalate_to_maintainer_review
 *   4. upstream API error -> fail-closed API_ERROR_BLOCKED (exit 1, action=escalate)
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "4ndr0_decision.py");
const CONTRACT = path.join(ROOT, "decision.contract.json");

function runDecision(args) {
  return spawnSync("python3", ["-B", SCRIPT, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 30_000,
  });
}

// 1. Validate contract structure + DRY questions_module SHA-256
const val = runDecision(["validate", "--root", ROOT, "--contract", CONTRACT]);
assert.equal(val.status, 0, `decision validate failed: ${val.stdout}\n${val.stderr}`);
const valJson = JSON.parse(val.stdout);
assert.equal(valJson.status, "VERIFIED");
assert.equal(valJson.defect_count, 0);

// 2. Deterministic offline truth-table fixture replay
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "4ndr0-decision-smoke-"));
try {
  const cases = [
    {
      name: "dist-only PR",
      expectedStatus: 0,
      expectedAction: "request_port_to_src_before_merge",
      payload: {
        answers: {
          touches_dist_only: { probability: 0.92 },
          touches_kernel_module: { probability: 0.05 },
          adds_new_script: { probability: 0.04 },
          target_family: { probabilities: { ux_utilities: 0.8, forums: 0.2 } },
          risk_severity: { level_probabilities: { low_cosmetic: 0.1, medium_single_script: 0.8, high_kernel_or_build: 0.1 } },
        },
      },
    },
    {
      name: "new script onboarding",
      expectedStatus: 0,
      expectedAction: "register_family_and_bump_contract_installables",
      payload: {
        answers: {
          touches_dist_only: { probability: 0.08 },
          touches_kernel_module: { probability: 0.10 },
          adds_new_script: { probability: 0.89 },
          target_family: { probabilities: { sovereign_platforms: 0.91, ux_utilities: 0.09 } },
          risk_severity: { level_probabilities: { low_cosmetic: 0.1, medium_single_script: 0.85, high_kernel_or_build: 0.05 } },
        },
      },
    },
    {
      name: "indeterminate middle band + null-guard",
      expectedStatus: 0,
      expectedAction: "escalate_to_maintainer_review",
      expectedTargetFamily: "null_guarded",
      payload: {
        answers: {
          touches_dist_only: { probability: 0.51 },
          touches_kernel_module: { probability: 0.12 },
          adds_new_script: { probability: 0.09 },
          target_family: { probabilities: { forums: 0.6, images: 0.4 } },
          risk_severity: { level_probabilities: { low_cosmetic: 0.7, medium_single_script: 0.2, high_kernel_or_build: 0.1 } },
        },
      },
    },
    {
      name: "API error fails closed",
      expectedStatus: 1,
      expectedAction: "escalate",
      expectedTraceStatus: "API_ERROR_BLOCKED",
      payload: { api_error: "HTTP 503 upstream timeout" },
    },
  ];

  for (const tc of cases) {
    const f = path.join(tmpDir, `${tc.name.replace(/\W+/g, "_")}.json`);
    fs.writeFileSync(f, JSON.stringify(tc.payload), "utf8");
    const res = runDecision(["eval-table", "--root", ROOT, "--contract", CONTRACT, "--responses", f]);
    assert.equal(res.status, tc.expectedStatus, `${tc.name}: unexpected exit ${res.status}: ${res.stdout}\n${res.stderr}`);
    const out = JSON.parse(res.stdout);
    assert.equal(out.action, tc.expectedAction, `${tc.name}: expected action ${tc.expectedAction}, got ${out.action}`);
    if (tc.expectedTargetFamily) {
      assert.equal(out.derived_states.target_family, tc.expectedTargetFamily);
    }
    if (tc.expectedTraceStatus) {
      assert.equal(out.status, tc.expectedTraceStatus);
    }
  }
  console.log(`DECISION BOUNDARY SMOKE: ALL PASS (contract=VERIFIED, ${cases.length}/${cases.length} truth-table fixtures)`);
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
