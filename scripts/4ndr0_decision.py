#!/usr/bin/env python3
"""4ndr0_decision.py v8.3.0 — Deterministic System One Decision-Boundary Validator & Evaluator.

Enforces DB-001 through DB-012 (references/DECISION_BOUNDARY_DIRECTIVES.md) offline using
only the Python 3 standard library:
1. `validate`: verifies a versioned decision contract against real files on disk
   (centralized `questions_module` SHA-256 fingerprint, fail-closed `on_api_error`,
   non-positional Choice options, companion Noul null-guards in the same request_group,
   valid Noul threshold bands, zero `confidence`-as-gate rules, and valid truth-table rules),
   plus advisory yellow-flag linting for compound "or" prompts or prompt-gymnastics smells.
2. `eval-table`: deterministically evaluates recorded/replayed System One responses against
   the verified truth table, enforcing fail-closed API error propagation, Noul middle-band
   routing, null-guard suppression, and bimodal Score distribution detection.

Probabilistic judgments never substitute for deterministic engineering proof.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import sys
sys.dont_write_bytecode = True
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Tuple

VERSION = "8.3.0"
PRIMITIVES = {"noul", "choice", "score", "box"}
FAIL_CLOSED_ERROR_POLICIES = {"raise", "escalate", "block"}
POSITIONAL_OPTION_RE = re.compile(
    r"^(?:[a-zA-Z]|[0-9]+|option[_-]?\d+|opt[_-]?\d+|choice[_-]?[a-zA-Z0-9]+|left|right|top|bottom|first|second|third)$",
    re.IGNORECASE,
)
PREAMBLE_RE = re.compile(
    r"\b(?:return\s+json|output\s+format|step\s+by\s+step|consider\s+the\s+following|as\s+an\s+ai)\b",
    re.IGNORECASE,
)
LAZY_NEGATION_RE = re.compile(r"^\s*(?:not\b|otherwise\b|none\s+of\b)", re.IGNORECASE)
RELATIVE_LEVEL_RE = re.compile(r"\b(?:more\s+\w+\s+than|less\s+\w+\s+than|higher\s+than\s+the\s+previous|lower\s+than\s+the\s+previous)\b", re.IGNORECASE)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def atomic_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix="." + path.name + ".", suffix=".tmp", dir=str(path.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            json.dump(obj, out, indent=2, sort_keys=True, ensure_ascii=False)
            out.write("\n")
            out.flush()
            os.fsync(out.fileno())
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


def contained(root: Path, rel: str) -> Path:
    target = (root / rel).resolve()
    if not target.is_relative_to(root.resolve()):
        raise ValueError(f"path escapes project root: {rel}")
    return target


def validate_contract(root: Path, doc: dict) -> Tuple[List[str], List[str], Dict[str, dict]]:
    """Validate a decision contract. Returns (defects, yellow_flags, question_map)."""
    defects: List[str] = []
    yellow_flags: List[str] = []
    qmap: Dict[str, dict] = {}

    if not isinstance(doc, dict):
        return (["contract top-level value must be a JSON object"], [], {})
    if doc.get("version") != "1.0":
        defects.append("contract.version must be '1.0'")
    cid = doc.get("contract_id")
    if not isinstance(cid, str) or not re.fullmatch(r"[a-z][a-z0-9_-]{1,63}", cid):
        defects.append("contract_id must match ^[a-z][a-z0-9_-]{1,63}$")

    # DB-009: Fail-closed error handling
    err_policy = doc.get("on_api_error")
    if err_policy not in FAIL_CLOSED_ERROR_POLICIES:
        defects.append(
            f"DB-009 defect: on_api_error must be fail-closed ({sorted(FAIL_CLOSED_ERROR_POLICIES)}), got {err_policy!r}"
        )

    # DB-002: Centralized, fingerprinted questions module on disk
    qmod = doc.get("questions_module")
    if not isinstance(qmod, dict) or not isinstance(qmod.get("path"), str) or not isinstance(qmod.get("sha256"), str):
        defects.append("DB-002 defect: questions_module requires 'path' and 64-char hex 'sha256'")
    else:
        try:
            qmod_path = contained(root, qmod["path"])
            if not qmod_path.is_file():
                defects.append(f"DB-002 defect: questions_module file does not exist on disk: {qmod['path']}")
            else:
                actual_sha = sha256_file(qmod_path)
                if actual_sha != qmod["sha256"]:
                    defects.append(
                        f"DB-002 defect: questions_module fingerprint mismatch for '{qmod['path']}' "
                        f"(expected {qmod['sha256']}, actual {actual_sha})"
                    )
        except ValueError as exc:
            defects.append(f"DB-002 defect: {exc}")

    # Pass 1: register questions
    questions = doc.get("questions")
    if not isinstance(questions, list) or not questions:
        defects.append("questions must be a non-empty array")
        questions = []

    for idx, q in enumerate(questions):
        if not isinstance(q, dict):
            defects.append(f"questions[{idx}] must be an object")
            continue
        qid = q.get("id")
        if not isinstance(qid, str) or not re.fullmatch(r"[a-z][a-z0-9_-]{1,63}", qid):
            defects.append(f"questions[{idx}] has invalid id: {qid!r}")
            continue
        if qid in qmap:
            defects.append(f"duplicate question id: {qid}")
            continue
        prim = q.get("primitive")
        if prim not in PRIMITIVES:
            defects.append(f"question '{qid}': unsupported primitive {prim!r}")
        prompt = q.get("prompt")
        if not isinstance(prompt, str) or len(prompt.strip()) < 5:
            defects.append(f"question '{qid}': prompt must be a concrete non-empty string")
        else:
            if " or " in prompt.lower():
                yellow_flags.append(f"DB-004 yellow flag ({qid}): prompt contains ' or '; consider splitting into atomic questions")
            if PREAMBLE_RE.search(prompt):
                yellow_flags.append(f"DB-004/DB-011 yellow flag ({qid}): prompt contains LLM-style formatting/preamble wording")
        rgroup = q.get("request_group")
        if not isinstance(rgroup, str) or not rgroup.strip():
            defects.append(f"question '{qid}': request_group is required")
        qmap[qid] = q

    # Pass 2: primitive-specific validation
    for qid, q in qmap.items():
        prim = q.get("primitive")
        if prim == "noul":
            tc = q.get("true_criterion")
            fc = q.get("false_criterion")
            if not isinstance(tc, str) or not tc.strip():
                defects.append(f"DB-006 defect ({qid}): noul requires non-empty true_criterion")
            if not isinstance(fc, str) or not fc.strip():
                defects.append(f"DB-006 defect ({qid}): noul requires non-empty false_criterion")
            elif LAZY_NEGATION_RE.search(fc):
                yellow_flags.append(
                    f"DB-006 yellow flag ({qid}): false_criterion starts with lazy negation; describe a concrete situation instead"
                )
            lo = q.get("low_threshold", 0.3)
            hi = q.get("high_threshold", 0.7)
            if (
                not isinstance(lo, (int, float)) or isinstance(lo, bool) or not math.isfinite(lo)
                or not isinstance(hi, (int, float)) or isinstance(hi, bool) or not math.isfinite(hi)
                or not (0.0 < float(lo) < float(hi) < 1.0)
            ):
                defects.append(f"DB-007 defect ({qid}): noul thresholds must satisfy 0 < low_threshold ({lo}) < high_threshold ({hi}) < 1")

        elif prim == "choice":
            opts = q.get("options")
            if not isinstance(opts, list) or len(opts) < 2:
                defects.append(f"question '{qid}': choice requires at least 2 options")
            else:
                seen_opts: set[str] = set()
                for opt in opts:
                    if not isinstance(opt, dict) or not isinstance(opt.get("name"), str) or not isinstance(opt.get("criterion"), str) or not opt["criterion"].strip():
                        defects.append(f"question '{qid}': each choice option requires non-empty 'name' and 'criterion'")
                        continue
                    oname = opt["name"].strip()
                    if oname in seen_opts:
                        defects.append(f"question '{qid}': duplicate option name '{oname}'")
                    seen_opts.add(oname)
                    if POSITIONAL_OPTION_RE.match(oname):
                        defects.append(
                            f"DB-006 defect ({qid}): positional option name '{oname}' is forbidden; use descriptive semantic names"
                        )
                    if oname.lower() in {"none", "none_of_the_above", "other", "na", "n_a"} and not q.get("null_guard_noul_id"):
                        yellow_flags.append(
                            f"DB-005 yellow flag ({qid}): option '{oname}' used without companion null_guard_noul_id"
                        )
            _check_null_guard(qid, q, qmap, defects)

        elif prim == "box":
            _check_null_guard(qid, q, qmap, defects)

        elif prim == "score":
            levels = q.get("levels")
            if not isinstance(levels, list) or len(levels) < 2:
                defects.append(f"question '{qid}': score requires at least 2 levels")
            else:
                seen_lvls: set[str] = set()
                for lvl in levels:
                    if not isinstance(lvl, dict) or not isinstance(lvl.get("name"), str) or not isinstance(lvl.get("criterion"), str) or not lvl["criterion"].strip():
                        defects.append(f"question '{qid}': each score level requires non-empty 'name' and 'criterion'")
                        continue
                    lname = lvl["name"].strip()
                    if lname in seen_lvls:
                        defects.append(f"question '{qid}': duplicate score level '{lname}'")
                    seen_lvls.add(lname)
                    if RELATIVE_LEVEL_RE.search(lvl["criterion"]):
                        yellow_flags.append(
                            f"DB-006 yellow flag ({qid}.{lname}): score level uses relative wording; describe each level as a standalone situation"
                        )

    # Pass 3: truth table validation
    tt = doc.get("truth_table")
    if not isinstance(tt, dict):
        defects.append("DB-001 defect: truth_table object is required")
    else:
        default_action = tt.get("default_action")
        if not isinstance(default_action, str) or not default_action.strip():
            defects.append("DB-001 defect: truth_table.default_action must be a non-empty string")
        rules = tt.get("rules")
        if not isinstance(rules, list) or not rules:
            defects.append("DB-001 defect: truth_table.rules must be a non-empty array")
        else:
            seen_rule_ids: set[str] = set()
            for r_idx, rule in enumerate(rules):
                if not isinstance(rule, dict):
                    defects.append(f"truth_table.rules[{r_idx}] must be an object")
                    continue
                rid = rule.get("id")
                if not isinstance(rid, str) or not rid.strip():
                    defects.append(f"truth_table.rules[{r_idx}] missing id")
                elif rid in seen_rule_ids:
                    defects.append(f"duplicate truth_table rule id: {rid}")
                else:
                    seen_rule_ids.add(rid)
                action = rule.get("action")
                if not isinstance(action, str) or not action.strip():
                    defects.append(f"truth_table rule '{rid}': action must be non-empty")
                when = rule.get("when")
                if not isinstance(when, dict) or not when:
                    defects.append(f"truth_table rule '{rid}': when must be a non-empty object")
                    continue
                for key, expected in when.items():
                    if key == "confidence" or key.endswith(".confidence"):
                        defects.append(
                            f"DB-008 defect (rule '{rid}'): gating directly on raw '{key}' is forbidden; use calibrated probability bands or option/level predicates"
                        )
                        continue
                    if key not in qmap:
                        defects.append(f"truth_table rule '{rid}': references undeclared question '{key}'")
                        continue
                    q = qmap[key]
                    prim = q.get("primitive")
                    if prim == "noul" and expected not in {"yes", "no", "uncertain"}:
                        defects.append(f"truth_table rule '{rid}': invalid noul state '{expected}' for '{key}' (expected yes/no/uncertain)")
                    elif prim == "choice":
                        valid_opts = {o["name"].strip() for o in q.get("options", []) if isinstance(o, dict) and isinstance(o.get("name"), str)} | {"null_guarded"}
                        if expected not in valid_opts:
                            defects.append(f"truth_table rule '{rid}': invalid choice value '{expected}' for '{key}'")
                    elif prim == "score":
                        valid_lvls = {l["name"].strip() for l in q.get("levels", []) if isinstance(l, dict) and isinstance(l.get("name"), str)} | {"bimodal"}
                        if expected not in valid_lvls:
                            defects.append(f"truth_table rule '{rid}': invalid score level '{expected}' for '{key}'")
                    elif prim == "box" and expected not in {"present", "absent"}:
                        defects.append(f"truth_table rule '{rid}': invalid box state '{expected}' for '{key}' (expected present/absent)")

    return defects, yellow_flags, qmap


def _check_null_guard(qid: str, q: dict, qmap: Dict[str, dict], defects: List[str]) -> None:
    guard_id = q.get("null_guard_noul_id")
    rationale = q.get("exhaustive_domain_rationale")
    if guard_id:
        guard = qmap.get(guard_id)
        if not guard:
            defects.append(f"DB-005 defect ({qid}): null_guard_noul_id '{guard_id}' does not exist in questions")
        elif guard.get("primitive") != "noul":
            defects.append(f"DB-005 defect ({qid}): null_guard_noul_id '{guard_id}' must be a 'noul' primitive")
        elif guard.get("request_group") != q.get("request_group"):
            defects.append(
                f"DB-005/DB-010 defect ({qid}): null_guard_noul_id '{guard_id}' must share request_group '{q.get('request_group')}'"
            )
    elif not isinstance(rationale, str) or len(rationale.strip()) < 12:
        defects.append(
            f"DB-005 defect ({qid}): {q.get('primitive')} requires companion 'null_guard_noul_id' in same request_group or explicit 'exhaustive_domain_rationale'"
        )


def evaluate_table(doc: dict, qmap: Dict[str, dict], responses: dict) -> dict:
    """Deterministically evaluate a truth table from recorded System One responses."""
    if not isinstance(responses, dict):
        raise ValueError("responses payload must be a JSON object")

    # DB-009: Fail-closed on API error
    if responses.get("api_error"):
        return {
            "status": "API_ERROR_BLOCKED",
            "action": doc["on_api_error"],
            "matched_rule_id": None,
            "api_error": responses["api_error"],
            "derived_states": {},
            "bimodal_warnings": [],
        }

    answers = responses.get("answers", responses)
    derived: Dict[str, str] = {}
    bimodal_warnings: List[str] = []

    # First evaluate all Nouls so null-guards are resolved
    for qid, q in qmap.items():
        if q["primitive"] != "noul":
            continue
        ans = answers.get(qid)
        if not isinstance(ans, dict) or not isinstance(ans.get("probability"), (int, float)) or isinstance(ans.get("probability"), bool):
            raise ValueError(f"missing or non-numeric probability for noul '{qid}'")
        p = float(ans["probability"])
        if not math.isfinite(p) or not (0.0 <= p <= 1.0):
            raise ValueError(f"probability out of [0, 1] for noul '{qid}': {p}")
        lo = float(q.get("low_threshold", 0.3))
        hi = float(q.get("high_threshold", 0.7))
        if p >= hi:
            derived[qid] = "yes"
        elif p <= lo:
            derived[qid] = "no"
        else:
            derived[qid] = "uncertain"

    # Evaluate Choice, Score, Box
    for qid, q in qmap.items():
        prim = q["primitive"]
        if prim == "noul":
            continue
        guard_id = q.get("null_guard_noul_id")
        guard_state = derived.get(guard_id) if guard_id else None

        if prim == "choice":
            if guard_state == "no":
                derived[qid] = "null_guarded"
                continue
            ans = answers.get(qid)
            if not isinstance(ans, dict):
                raise ValueError(f"missing answer object for choice '{qid}'")
            probs = ans.get("probabilities")
            valid_opts = [o["name"].strip() for o in q["options"]]
            if isinstance(probs, dict) and probs:
                top_opt = max(valid_opts, key=lambda name: float(probs.get(name, -1.0)))
                derived[qid] = top_opt
            elif isinstance(ans.get("top_option"), str) and ans["top_option"] in valid_opts:
                derived[qid] = ans["top_option"]
            else:
                raise ValueError(f"choice '{qid}' requires 'probabilities' map or valid 'top_option'")

        elif prim == "score":
            ans = answers.get(qid)
            if not isinstance(ans, dict):
                raise ValueError(f"missing answer object for score '{qid}'")
            level_names = [l["name"].strip() for l in q["levels"]]
            lprobs = ans.get("level_probabilities")
            if isinstance(lprobs, dict) and lprobs:
                ordered = [float(lprobs.get(name, 0.0)) for name in level_names]
                # Detect bimodality: two non-adjacent levels each >= 0.25
                bimodal = False
                for i in range(len(ordered)):
                    for j in range(i + 2, len(ordered)):
                        if ordered[i] >= 0.25 and ordered[j] >= 0.25:
                            bimodal = True
                            bimodal_warnings.append(
                                f"DB-008 bimodal score on '{qid}': levels '{level_names[i]}' ({ordered[i]:.2f}) "
                                f"and '{level_names[j]}' ({ordered[j]:.2f}) both carry >=0.25 mass"
                            )
                            break
                    if bimodal:
                        break
                if bimodal:
                    derived[qid] = "bimodal"
                else:
                    top_idx = max(range(len(ordered)), key=lambda idx: ordered[idx])
                    derived[qid] = level_names[top_idx]
            elif isinstance(ans.get("level"), str) and ans["level"] in level_names:
                derived[qid] = ans["level"]
            else:
                raise ValueError(f"score '{qid}' requires 'level_probabilities' map or valid 'level'")

        elif prim == "box":
            if guard_state == "no":
                derived[qid] = "absent"
                continue
            ans = answers.get(qid)
            if not isinstance(ans, dict):
                raise ValueError(f"missing answer object for box '{qid}'")
            derived[qid] = "present" if ans.get("box") is not None else "absent"

    # Match truth table rules in order
    matched_rule_id = None
    chosen_action = doc["truth_table"]["default_action"]
    for rule in doc["truth_table"]["rules"]:
        when = rule["when"]
        if all(derived.get(k) == v for k, v in when.items()):
            matched_rule_id = rule["id"]
            chosen_action = rule["action"]
            break

    return {
        "status": "DECIDED",
        "action": chosen_action,
        "matched_rule_id": matched_rule_id,
        "derived_states": derived,
        "bimodal_warnings": bimodal_warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="action", required=True)

    p_val = sub.add_parser("validate", help="Validate a System One decision-boundary contract")
    p_val.add_argument("--root", default=".", help="Project repository root")
    p_val.add_argument("--contract", required=True, help="Path to decision contract JSON")
    p_val.add_argument("--output", help="Optional output JSON report path")

    p_eval = sub.add_parser("eval-table", help="Evaluate recorded System One responses against the truth table")
    p_eval.add_argument("--root", default=".", help="Project repository root")
    p_eval.add_argument("--contract", required=True, help="Path to decision contract JSON")
    p_eval.add_argument("--responses", required=True, help="Path to recorded System One responses JSON")
    p_eval.add_argument("--output", help="Optional output JSON trace path")

    args = parser.parse_args()
    root = Path(args.root).resolve()
    contract_path = Path(args.contract).resolve()

    try:
        doc = json.loads(contract_path.read_text(encoding="utf-8"))
        contract_sha = sha256_file(contract_path)
        defects, yellow_flags, qmap = validate_contract(root, doc)

        if args.action == "validate":
            report = {
                "schema_version": "1.0",
                "tool_version": VERSION,
                "contract_id": doc.get("contract_id") if isinstance(doc, dict) else None,
                "contract_sha256": contract_sha,
                "status": "VERIFIED" if not defects else "DEFECT",
                "question_count": len(qmap),
                "defect_count": len(defects),
                "yellow_flag_count": len(yellow_flags),
                "defects": defects,
                "yellow_flags": yellow_flags,
                "claim_boundary": "Validates decision-boundary contract structure, DRY module fingerprint, and fail-closed truth-table rules; live API accuracy requires separate probing or recorded fixtures.",
            }
            if args.output:
                atomic_json(Path(args.output), report)
            print(json.dumps(report, sort_keys=True))
            return 0 if not defects else 1

        # eval-table requires a valid contract first
        if defects:
            print("CONTRACT DEFECT: " + "; ".join(defects), file=sys.stderr)
            return 2

        responses = json.loads(Path(args.responses).resolve().read_text(encoding="utf-8"))
        trace = evaluate_table(doc, qmap, responses)
        trace["schema_version"] = "1.0"
        trace["tool_version"] = VERSION
        trace["contract_id"] = doc["contract_id"]
        trace["contract_sha256"] = contract_sha
        if args.output:
            atomic_json(Path(args.output), trace)
        print(json.dumps(trace, sort_keys=True))
        return 0 if trace["status"] == "DECIDED" else 1

    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print("VALIDATION ERROR: " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
