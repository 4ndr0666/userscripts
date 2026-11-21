#!/usr/bin/env python3
"""4ndr0_validate.py v8.0.0 — Proportionate, file-backed engineering validator.

Replaces gup_validate.py with:
1. Zero Missing-Manifest Bypass: missing, unreadable, or empty baseline/candidate manifests
   are immediate `DEFECT`s — never silently coerced to `{}`.
2. Live Repository & Disk Cross-Verification:
   - Verifies `baseline_commit` and `candidate_commit` actually exist in Git (`git cat-file -e`).
   - Re-extracts units from the actual candidate repository files on disk via `argon_hash` and
     verifies that `candidate_manifest` matches the real repository bytes and unit hashes!
   - Re-extracts units from `baseline_commit` in Git and verifies `baseline_manifest` matches!
3. Explicit Acceptance Criteria Verification:
   - Each criterion in `acceptance_criteria` must specify a concrete `check_type`:
     * `file_exists`: verifies file exists and matches optional `sha256`
     * `symbol_present`: verifies file exists and contains all required `symbols`
     * `command_exit_zero`: executes command (when `--execute-checks` is passed) or verifies an
       existing `log_file` on disk with matching `log_sha256`
     * `manual_attestation`: explicitly recorded as `UNVERIFIED` (or `VERIFIED` only with
       file-anchored evidence), bounding claims automatically.
4. Proportionate Verification Tiers (`T0` Patch, `T1` Module, `T2` Cross-Cutting, `T3` Release):
   - Requires only the integration surfaces relevant to the declared tier (`T0` requires
     `entry_points` and `tests`; `T1` adds `callers`, `providers`, `consumers`; `T2`/`T3`
     require all 9 surfaces).
5. Epistemic Separation (`DEFECT` vs `UNVERIFIED` vs `BLOCKED`):
   - Demonstrated defects (`DEFECT`) fail validation (`status: FAIL_DEFECT`, exit code 1).
   - Missing evidence (`UNVERIFIED`) or scoped target blocks (`BLOCKED`) on one target limit claims
     to `BOUNDED_PASS` (exit code 0 in default/bounded mode, exit code 1 only under `--require-full-certification`)
     while allowing verified targets to proceed and ship with explicit claim boundaries!
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
sys.dont_write_bytecode = True
import tempfile
from pathlib import Path
from typing import Dict, List

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import importlib.util
def _load_sibling(mod_name: str, filename: str):
    spec = importlib.util.spec_from_file_location(mod_name, SCRIPT_DIR / filename)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
argon_hash = _load_sibling("ndr0_hash", "4ndr0_hash.py")
argon_align = _load_sibling("ndr0_align", "4ndr0_align.py")

PROTOCOL = "4NDR0-GUP-8.0"
VERSION = "8.2.0"

TIER_SURFACES: Dict[str, set[str]] = {
    "T0": {"entry_points", "tests"},
    "T1": {"entry_points", "callers", "providers", "consumers", "tests"},
    "T2": {
        "entry_points", "loaders", "callers", "providers", "consumers",
        "configuration_paths", "install_migration_paths", "tests", "runtime_dependencies",
    },
    "T3": {
        "entry_points", "loaders", "callers", "providers", "consumers",
        "configuration_paths", "install_migration_paths", "tests", "runtime_dependencies",
    },
}

CLASSIFICATIONS = {"UNCHANGED", "CHANGED", "NEW", "MISSING"}


def git(root: Path, *args: str) -> str:
    p = subprocess.run(
        ["git", "-C", str(root), *args],
        text=True, encoding="utf-8", stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=60
    )
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or f"git {' '.join(args)} failed")
    return p.stdout.strip()


def git_object_exists(root: Path, rev: str) -> bool:
    p = subprocess.run(
        ["git", "-C", str(root), "cat-file", "-e", f"{rev}^{{commit}}"],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=30
    )
    return p.returncode == 0


def nonempty(v: object) -> bool:
    return isinstance(v, str) and bool(v.strip())


def atomic_write(path: Path, data: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    temp = Path(name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def resolve_ref_path(root: Path, evidence_dir: Path, raw_path: str) -> Path:
    p = Path(raw_path)
    if p.is_absolute():
        return p
    cand1 = (root / p).resolve()
    if cand1.exists():
        return cand1
    return (evidence_dir / p).resolve()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--evidence", default=None, help="Optional path to legacy 4ndr0neering evidence JSON (omit for direct contract.json mode)")
    parser.add_argument("--output", help="Optional path to write validation report JSON")
    parser.add_argument("--execute-checks", action="store_true", help="Actively run acceptance commands and test commands")
    parser.add_argument("--convergence-contract", default="contract.json", help="Declarative 4ndr0neering acceptance contract (default: contract.json)")
    parser.add_argument("--convergence-ledger", help="Mandatory evidence-linked convergence ledger for protocol v8.2.0")
    parser.add_argument("--require-full-certification", action="store_true", help="Exit non-zero on BOUNDED_PASS (require 0 UNVERIFIED and 0 BLOCKED)")
    args = parser.parse_args()


    root = Path(args.root).resolve()

    # Pure 4ndr0neering v2.0.0 direct contract certification mode (no legacy GUP evidence required)
    if not args.evidence:
        contract_path = Path(args.convergence_contract)
        if not contract_path.is_absolute():
            contract_path = (root / contract_path).resolve()
        if not contract_path.exists():
            print(f"FAIL_DEFECT: convergence contract not found: {contract_path}", file=sys.stderr)
            return 1
        try:
            contract = json.loads(contract_path.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"FAIL_DEFECT: invalid contract JSON: {exc}", file=sys.stderr)
            return 1

        criteria = contract.get("criteria")
        if not isinstance(criteria, list) or not criteria:
            print("FAIL_DEFECT: contract.json contains no criteria", file=sys.stderr)
            return 1

        # Architecture cross-verification (R6-6): the contract's architecture
        # block used to be decorative — nothing compared it to the repository
        # it governed, so a stale installables count (38 declared vs the real
        # 39 after ChatGPT++ landed) still certified clean. The declarative
        # contract now fail-closes on drift: dirs must exist, kernel_order
        # must match kernel/ contents, and the declared installables count
        # must equal the dist/ population it claims to govern.
        arch = contract.get("architecture") or {}
        arch_defects: List[str] = []
        dist_dir = root / str(arch.get("dist_dir", "dist"))
        src_dir = root / str(arch.get("source_dir", "src"))
        kernel_dir = root / str(arch.get("kernel_dir", "kernel"))
        if not dist_dir.is_dir():
            arch_defects.append(f"architecture.dist_dir '{dist_dir.name}/' not found")
        if not src_dir.is_dir():
            arch_defects.append(f"architecture.source_dir '{src_dir.name}/' not found")
        if not kernel_dir.is_dir():
            arch_defects.append(f"architecture.kernel_dir '{kernel_dir.name}/' not found")
        expected_kernel = arch.get("kernel_order") or []
        actual_kernel = sorted(p.name for p in kernel_dir.glob("*.js")) if kernel_dir.is_dir() else []
        if expected_kernel and sorted(expected_kernel) != actual_kernel:
            arch_defects.append(
                f"architecture.kernel_order {expected_kernel} != kernel/ contents {actual_kernel}"
            )
        if dist_dir.is_dir():
            dist_count = len(list(dist_dir.glob("*.user.js")))
            declared = arch.get("installables")
            if isinstance(declared, int) and declared != dist_count:
                arch_defects.append(
                    f"architecture.installables={declared} but dist/ holds {dist_count} installables"
                )
        for d in arch_defects:
            print(f"FAIL_DEFECT: contract architecture drift: {d}", file=sys.stderr)
        if arch_defects:
            return 1

        results = []
        defects: List[str] = []
        unverified: List[str] = []

        for item in criteria:
            cid = item.get("id", "<unnamed>")
            cmd = item.get("command")
            mandatory = bool(item.get("mandatory", True))
            timeout = int(item.get("timeout_seconds", 120))
            if not isinstance(cmd, list) or not cmd:
                defects.append(f"{cid}: missing executable command")
                results.append({"id": cid, "status": "DEFECT", "mandatory": mandatory})
                continue
            if not args.execute_checks:
                unverified.append(f"{cid}: not executed (pass --execute-checks)")
                results.append({"id": cid, "status": "UNVERIFIED", "mandatory": mandatory})
                continue
            try:
                sub_env = {k: v for k, v in os.environ.items() if k != 'BASH_ENV'}
                proc = subprocess.run(
                    cmd,
                    cwd=str(root),
                    env=sub_env,
                    text=True,
                    encoding="utf-8",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=timeout,
                    check=False,
                )
                if proc.returncode == 0:
                    print(f"  ✓ [{cid}] PASS")
                    results.append({"id": cid, "status": "VERIFIED", "returncode": 0, "mandatory": mandatory})
                else:
                    tail = ((proc.stdout or "") + "\n" + (proc.stderr or "")).strip()[-300:]
                    print(f"  ✗ [{cid}] FAIL (rc={proc.returncode}): {tail}", file=sys.stderr)
                    defects.append(f"{cid}: exited {proc.returncode}")
                    results.append({"id": cid, "status": "DEFECT", "returncode": proc.returncode, "mandatory": mandatory})
            except Exception as exc:
                print(f"  ✗ [{cid}] ERROR: {exc}", file=sys.stderr)
                defects.append(f"{cid}: {exc}")
                results.append({"id": cid, "status": "DEFECT", "error": str(exc), "mandatory": mandatory})

        if defects:
            status = "FAIL_DEFECT"
            rc = 1
        elif unverified:
            status = "BOUNDED_PASS"
            rc = 1 if args.require_full_certification else 0
        else:
            status = "CERTIFIED"
            rc = 0

        report = {
            "protocol": "4ndr0neering",
            "version": contract.get("version", "2.0.0"),
            "project": contract.get("project", root.name),
            "contract": str(contract_path),
            "status": status,
            "passed": sum(1 for r in results if r["status"] == "VERIFIED"),
            "total": len(results),
            "defects": defects,
            "unverified": unverified,
            "results": results,
        }
        if args.output:
            atomic_write(Path(args.output).resolve(), json.dumps(report, indent=2) + "\n")
        print(f"4NDR0NEERING VALIDATE: {status} ({report['passed']}/{report['total']} criteria verified)")
        return rc

    ev_path = Path(args.evidence).resolve()

    ev_dir = ev_path.parent

    defects: List[str] = []
    unverified: List[str] = []
    blocked_targets: List[str] = []
    verified_claims: List[str] = []
    bounded_claims: List[str] = []

    try:
        e = json.loads(ev_path.read_text(encoding="utf-8"))
        if not isinstance(e, dict):
            raise ValueError("evidence top-level value must be a JSON object")

        tier = e.get("tier", "T2")
        if tier not in TIER_SURFACES:
            defects.append(f"invalid verification tier '{tier}'; must be one of {sorted(TIER_SURFACES)}")
            tier = "T2"

        delivery_mode = e.get("delivery_mode", "CERTIFIED_RELEASE")
        if delivery_mode not in {"WIP_CHECKPOINT", "BOUNDED_HANDOFF", "CERTIFIED_RELEASE"}:
            defects.append(f"invalid delivery_mode '{delivery_mode}'")

        if e.get("protocol_version") not in {"8.0.0", "8.1.0", "8.2.0"}:
            defects.append(f"protocol_version must be '8.0.0', '8.1.0', or '8.2.0' (got {e.get('protocol_version')!r})")

        try:
            head = git(root, "rev-parse", "HEAD")
        except RuntimeError as exc:
            raise ValueError(f"candidate repository is unavailable: {exc}")

        if e.get("candidate_commit") != head:
            defects.append(f"candidate_commit ({e.get('candidate_commit')}) does not equal current HEAD ({head})")

        base_commit = e.get("baseline_commit")
        if not isinstance(base_commit, str) or not re.fullmatch(r"[0-9a-f]{40,64}", base_commit):
            defects.append("baseline_commit must be a full lowercase Git object ID")
        elif not git_object_exists(root, base_commit):
            defects.append(f"baseline_commit {base_commit} does not exist in the Git object database")
        elif base_commit == head and delivery_mode != "WIP_CHECKPOINT":
            defects.append("baseline_commit and candidate_commit are identical; no committed revision was evaluated")

        status_porcelain = git(root, "status", "--porcelain=v1", "--untracked-files=all")
        if status_porcelain:
            if delivery_mode == "WIP_CHECKPOINT":
                unverified.append("worktree has uncommitted WIP changes (permitted in WIP_CHECKPOINT mode; blocks CERTIFIED_RELEASE)")
            else:
                defects.append("worktree is dirty; BOUNDED_HANDOFF and CERTIFIED_RELEASE require a clean committed worktree")

        # 1. Manifests & Live Repository Cross-Check (CLOSES THE MISSING-MANIFEST BYPASS)
        units_cfg = e.get("units")
        if not isinstance(units_cfg, dict):
            defects.append("units must be an object containing baseline_manifest, candidate_manifest, and comparison_artifact")
        else:
            b_path_str = units_cfg.get("baseline_manifest")
            c_path_str = units_cfg.get("candidate_manifest")
            comp_str = units_cfg.get("comparison_artifact")
            for k, val in (("baseline_manifest", b_path_str), ("candidate_manifest", c_path_str), ("comparison_artifact", comp_str)):
                if not nonempty(val):
                    defects.append(f"units.{k} is missing or empty")

            baseline_data = None
            candidate_data = None
            if nonempty(b_path_str):
                b_file = resolve_ref_path(root, ev_dir, b_path_str)
                if not b_file.is_file():
                    defects.append(f"units.baseline_manifest file does not exist on disk: {b_path_str}")
                else:
                    try:
                        baseline_data = json.loads(b_file.read_text(encoding="utf-8"))
                    except (OSError, json.JSONDecodeError) as exc:
                        defects.append(f"units.baseline_manifest is not valid JSON: {exc}")

            if nonempty(c_path_str):
                c_file = resolve_ref_path(root, ev_dir, c_path_str)
                if not c_file.is_file():
                    defects.append(f"units.candidate_manifest file does not exist on disk: {c_path_str}")
                else:
                    try:
                        candidate_data = json.loads(c_file.read_text(encoding="utf-8"))
                    except (OSError, json.JSONDecodeError) as exc:
                        defects.append(f"units.candidate_manifest is not valid JSON: {exc}")

            if baseline_data is not None and candidate_data is not None:
                for label, mdata, expected_commit in (("baseline", baseline_data, base_commit), ("candidate", candidate_data, head)):
                    if not isinstance(mdata, dict) or not isinstance(mdata.get("units"), list):
                        defects.append(f"{label} manifest must contain a 'units' list")
                        continue
                    if len(mdata["units"]) == 0:
                        defects.append(f"{label} manifest contains 0 units (empty manifest bypass is forbidden)")
                    if mdata.get("commit") != expected_commit:
                        defects.append(f"{label} manifest commit ({mdata.get('commit')}) does not match {expected_commit}")
                    ids = [u.get("id") for u in mdata["units"] if isinstance(u, dict)]
                    if len(ids) != len(mdata["units"]):
                        defects.append(f"{label} manifest contains malformed unit entries")
                    if len(set(ids)) != len(ids):
                        defects.append(f"{label} manifest contains duplicate unit IDs")
                    for u in mdata["units"]:
                        if not isinstance(u, dict) or not nonempty(u.get("id")) or not isinstance(u.get("sha256"), str) or not re.fullmatch(r"[0-9a-f]{64}", u["sha256"]):
                            defects.append(f"{label} manifest unit requires stable 'id' and 64-char hex 'sha256'")

                # Re-extract live manifests from Git to prevent fabricated manifest files!
                if git_object_exists(root, base_commit) and not defects:
                    live_base = argon_hash.build_repo_manifest(root, rev=base_commit)
                    live_cand = argon_hash.build_repo_manifest(root, rev=head)
                    live_b_map = {u["id"]: u["sha256"] for u in live_base["units"]}
                    live_c_map = {u["id"]: u["sha256"] for u in live_cand["units"]}
                    decl_b_map = {u["id"]: u["sha256"] for u in baseline_data.get("units", []) if isinstance(u, dict) and "id" in u and "sha256" in u}
                    decl_c_map = {u["id"]: u["sha256"] for u in candidate_data.get("units", []) if isinstance(u, dict) and "id" in u and "sha256" in u}
                    if decl_b_map != live_b_map:
                        defects.append("baseline_manifest units/hashes do not match actual Git tree at baseline_commit")
                    if decl_c_map != live_c_map:
                        defects.append("candidate_manifest units/hashes do not match actual Git tree at candidate_commit")

                comparison = e.get("comparison")
                if not isinstance(comparison, list) or len(comparison) == 0:
                    defects.append("comparison must be a non-empty array of {unit_id, classification} records")
                else:
                    expected_comp = {
                        r["unit_id"]: r["classification"]
                        for r in argon_hash.compare_manifests(baseline_data, candidate_data)
                    }
                    seen_comp = {}
                    for row in comparison:
                        if not isinstance(row, dict) or not nonempty(row.get("unit_id")) or row.get("classification") not in CLASSIFICATIONS:
                            defects.append("comparison contains malformed row")
                            continue
                        uid = row["unit_id"]
                        if uid in seen_comp:
                            defects.append(f"duplicate comparison row for {uid}")
                        seen_comp[uid] = row["classification"]
                    if seen_comp != expected_comp:
                        defects.append("comparison rows do not exactly match baseline/candidate manifests")

        # 2. Semantic Reviews with File-Anchored Evidence
        comparison_list = e.get("comparison") if isinstance(e.get("comparison"), list) else []
        reviews = e.get("semantic_reviews")
        if not isinstance(reviews, list):
            defects.append("semantic_reviews must be an array")
            reviews = []
        expected_review = {
            r.get("unit_id")
            for r in comparison_list
            if isinstance(r, dict) and r.get("classification") in {"CHANGED", "NEW", "MISSING"}
        }
        seen_review = set()
        for i, r in enumerate(reviews):
            if not isinstance(r, dict):
                defects.append(f"semantic_reviews[{i}] malformed")
                continue
            uid = r.get("unit_id")
            if not nonempty(uid):
                defects.append(f"semantic_reviews[{i}] missing unit_id")
                continue
            if uid in seen_review:
                defects.append(f"duplicate semantic review for {uid}")
            seen_review.add(uid)
            if r.get("classification") not in CLASSIFICATIONS:
                defects.append(f"{uid}: invalid classification")
            if not nonempty(r.get("verdict")) or not nonempty(r.get("rationale")) or not nonempty(r.get("evidence")):
                defects.append(f"{uid}: verdict, rationale, and evidence are required")
            else:
                # Verify evidence anchor points to a real file/symbol or is marked runtime-unverified
                st, detail = argon_align.verify_file_anchor(root, r["evidence"])
                if st == "DEFECT":
                    defects.append(f"semantic_reviews[{i}] ({uid}) evidence failed file check: {detail}")
                elif st == "UNVERIFIED":
                    unverified.append(f"semantic_reviews[{i}] ({uid}): {detail}")

            if r.get("classification") == "MISSING":
                if r.get("verdict") != "AUTHORIZED_REMOVAL" or r.get("user_authorization") is not True:
                    defects.append(f"{uid}: missing baseline unit requires explicit AUTHORIZED_REMOVAL and user_authorization=true")
            elif r.get("classification") in {"CHANGED", "NEW"}:
                if r.get("verdict") == "UNVERIFIED_BEHAVIOR":
                    unverified.append(f"{uid}: semantic equivalence marked UNVERIFIED_BEHAVIOR ({r.get('rationale')})")
                elif r.get("verdict") not in {"PRESERVED_SUPERSET", "ACCEPTED_NEW_CAPABILITY"}:
                    defects.append(f"{uid}: CHANGED/NEW unit has invalid or failing semantic verdict '{r.get('verdict')}'")

        if seen_review != expected_review:
            defects.append("semantic_reviews do not exactly cover all CHANGED/NEW/MISSING units")

        # 3. Bidirectional Alignment (Verified Against Actual Alignment File & Disk Symbols)
        alignment = e.get("alignment")
        if not isinstance(alignment, dict) or not nonempty(alignment.get("alignment_file")):
            defects.append("alignment must be an object specifying a valid 'alignment_file' path")
        else:
            align_path = resolve_ref_path(root, ev_dir, alignment["alignment_file"])
            if not align_path.is_file():
                defects.append(f"alignment.alignment_file does not exist on disk: {alignment['alignment_file']}")
            else:
                align_raw = json.loads(align_path.read_text(encoding="utf-8"))
                align_res = argon_align.validate_alignment_data(root, align_raw)
                if align_res["status"] == "FAIL_DEFECT":
                    for d in align_res["defects"]:
                        defects.append(f"alignment defect: {d}")
                elif align_res["status"] == "BOUNDED_UNVERIFIED":
                    for u in align_res["unverified"]:
                        unverified.append(f"alignment unverified: {u}")

        # 4. Explicit Acceptance Criteria Contract (Tied to Real Files, Symbols, or Command Logs)
        criteria = e.get("acceptance_criteria")
        if not isinstance(criteria, list) or len(criteria) == 0:
            defects.append("acceptance_criteria must be a non-empty array of testable criteria")
        else:
            for i, c in enumerate(criteria):
                if not isinstance(c, dict) or not nonempty(c.get("id")) or not nonempty(c.get("description")):
                    defects.append(f"acceptance_criteria[{i}] requires 'id' and 'description'")
                    continue
                cid = c["id"]
                ctype = c.get("check_type")
                target_name = c.get("target", "default")
                if ctype == "file_exists":
                    rel = c.get("path", "")
                    st, detail = argon_align.verify_file_anchor(root, rel)
                    if st == "DEFECT":
                        defects.append(f"criterion {cid} (file_exists): {detail}")
                    else:
                        if nonempty(c.get("expected_sha256")):
                            actual_sha = hashlib.sha256((root / rel).read_bytes()).hexdigest()
                            if actual_sha != c["expected_sha256"]:
                                defects.append(f"criterion {cid}: file '{rel}' sha256 mismatch ({actual_sha} != {c['expected_sha256']})")
                            else:
                                verified_claims.append(f"{cid} ({target_name}): verified file {rel} sha256:{actual_sha[:12]}")
                        else:
                            verified_claims.append(f"{cid} ({target_name}): verified {detail}")
                elif ctype == "symbol_present":
                    rel = c.get("path", "")
                    symbols = c.get("symbols", [])
                    if not nonempty(rel) or not isinstance(symbols, list) or not symbols:
                        defects.append(f"criterion {cid} (symbol_present) requires 'path' and non-empty 'symbols' list")
                    else:
                        for sym in symbols:
                            st, detail = argon_align.verify_file_anchor(root, f"{rel}:{sym}")
                            if st == "DEFECT":
                                defects.append(f"criterion {cid} (symbol_present): {detail}")
                        if not any(d.startswith(f"criterion {cid}") for d in defects):
                            verified_claims.append(f"{cid} ({target_name}): verified symbols {symbols} in {rel}")
                elif ctype == "command_exit_zero":
                    cmd = c.get("command", "")
                    log_rel = c.get("log_file", "")
                    if args.execute_checks and nonempty(cmd):
                        proc = subprocess.run(cmd, shell=True, cwd=str(root), env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}, capture_output=True, text=True, timeout=120)
                        if proc.returncode != 0:
                            defects.append(f"criterion {cid} command failed (exit {proc.returncode}): {cmd}")
                        else:
                            verified_claims.append(f"{cid} ({target_name}): command executed with exit 0 ({cmd})")
                    elif nonempty(log_rel):
                        lpath = resolve_ref_path(root, ev_dir, log_rel)
                        if not lpath.is_file():
                            defects.append(f"criterion {cid}: declared test log_file '{log_rel}' does not exist on disk")
                        else:
                            lbytes = lpath.read_bytes()
                            lsha = hashlib.sha256(lbytes).hexdigest()
                            if nonempty(c.get("log_sha256")) and c["log_sha256"] != lsha:
                                defects.append(f"criterion {cid}: log_file '{log_rel}' sha256 mismatch")
                            elif c.get("exit_code") != 0:
                                defects.append(f"criterion {cid}: recorded exit_code is {c.get('exit_code')} (expected 0)")
                            else:
                                verified_claims.append(f"{cid} ({target_name}): verified command log {log_rel} (sha256:{lsha[:12]})")
                    else:
                        unverified.append(f"criterion {cid} ({target_name}): command '{cmd}' has no log_file and --execute-checks was not enabled")
                        bounded_claims.append(f"{cid} ({target_name}): UNVERIFIED (command '{cmd}' not executed in current environment)")
                elif ctype == "unverified_external":
                    reason = c.get("rationale", "external runtime/hardware unavailable")
                    unverified.append(f"criterion {cid} ({target_name}): explicitly bounded as UNVERIFIED ({reason})")
                    bounded_claims.append(f"{cid} ({target_name}): UNVERIFIED — {reason}")
                else:
                    defects.append(f"criterion {cid}: unsupported check_type '{ctype}'")

        # 5. Proportionate Integration Surface Closure (Tied to Tier & File Anchors)
        required_surfaces = TIER_SURFACES[tier]
        closures = e.get("integration_closure")
        if not isinstance(closures, list):
            defects.append("integration_closure must be an array")
            closures = []
        closure_map = {}
        for i, c in enumerate(closures):
            if not isinstance(c, dict) or not nonempty(c.get("surface")):
                defects.append(f"integration_closure[{i}] malformed")
                continue
            surf = c["surface"]
            if surf in closure_map:
                defects.append(f"duplicate integration surface '{surf}'")
            closure_map[surf] = c
            st_val = c.get("status")
            if st_val == "CLOSED":
                st, detail = argon_align.verify_file_anchor(root, c.get("evidence", ""))
                if st == "DEFECT":
                    defects.append(f"integration surface '{surf}' evidence defect: {detail}")
                elif st == "UNVERIFIED":
                    unverified.append(f"integration surface '{surf}': {detail}")
            elif st_val == "UNVERIFIED":
                if not nonempty(c.get("rationale")):
                    defects.append(f"integration surface '{surf}' marked UNVERIFIED without rationale")
                else:
                    unverified.append(f"integration surface '{surf}' UNVERIFIED: {c['rationale']}")
            elif st_val == "NOT_APPLICABLE":
                if not nonempty(c.get("rationale")):
                    defects.append(f"integration surface '{surf}' marked NOT_APPLICABLE without rationale")
            else:
                defects.append(f"integration surface '{surf}' has invalid or open status '{st_val}'")

        missing_surfaces = required_surfaces - set(closure_map.keys())
        if missing_surfaces:
            defects.append(f"tier {tier} requires integration surfaces {sorted(required_surfaces)}; missing {sorted(missing_surfaces)}")

        # 6. Manifest Targets: Allow Scoped BLOCKED / UNVERIFIED Without Halting Unrelated Targets!
        targets = e.get("manifest_targets")
        if not isinstance(targets, list) or len(targets) == 0:
            defects.append("manifest_targets must be a non-empty array of scoped targets")
        else:
            for i, t in enumerate(targets):
                if not isinstance(t, dict) or not nonempty(t.get("target")) or not nonempty(t.get("evidence")):
                    defects.append(f"manifest_targets[{i}] requires 'target', 'status', and 'evidence'")
                    continue
                tname = t["target"]
                tstatus = t.get("status")
                if tstatus == "VERIFIED":
                    st, detail = argon_align.verify_file_anchor(root, t["evidence"])
                    if st == "DEFECT":
                        defects.append(f"manifest_target '{tname}' marked VERIFIED but evidence failed file check: {detail}")
                    else:
                        verified_claims.append(f"target '{tname}': VERIFIED ({detail})")
                elif tstatus == "BOUNDED_UNVERIFIED":
                    unverified.append(f"target '{tname}' is BOUNDED_UNVERIFIED: {t.get('evidence')}")
                    bounded_claims.append(f"target '{tname}': BOUNDED_UNVERIFIED ({t.get('evidence')})")
                elif tstatus == "BLOCKED":
                    blocked_targets.append(f"target '{tname}' is BLOCKED: {t.get('evidence')}")
                    bounded_claims.append(f"target '{tname}': BLOCKED ({t.get('evidence')}) — unrelated targets remain unblocked")
                elif tstatus == "DEFECT":
                    defects.append(f"target '{tname}' has an open demonstrated DEFECT: {t.get('evidence')}")
                else:
                    defects.append(f"manifest_target '{tname}' has invalid status '{tstatus}'")

        # v8.2 completion gate: legacy file-backed evidence success is not task
        # completion unless every MANDATORY acceptance-contract gate is verified.
        acceptance_state = None
        if e.get("protocol_version") == "8.2.0":
            if not args.convergence_contract or not args.convergence_ledger:
                defects.append("v8.2 requires --convergence-contract and --convergence-ledger; no implicit acceptance waiver")
            else:
                try:
                    converge = _load_sibling("ndr0_converge", "4ndr0_converge.py")
                    contract_file = Path(args.convergence_contract).resolve()
                    ledger_file = Path(args.convergence_ledger).resolve()
                    ledger_obj = json.loads(ledger_file.read_text(encoding="utf-8"))
                    contract_obj = converge.verify_ledger(ledger_obj, contract_file, root)
                    acceptance_state = converge.assessment(contract_obj, ledger_obj)
                    for pending in acceptance_state["outstanding"]:
                        msg = f"mandatory acceptance {pending['id']}: {pending['status']} ({pending['description']})"
                        if pending["status"] == "DEFECT":
                            defects.append(msg)
                        elif pending["status"] == "BLOCKED":
                            blocked_targets.append(msg)
                        else:
                            unverified.append(msg)
                except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
                    defects.append("v8.2 mandatory acceptance ledger invalid: " + str(exc))

        # Determine overall epistemic status
        if defects:
            overall_status = "FAIL_DEFECT"
        elif unverified or blocked_targets:
            overall_status = "BOUNDED_PASS"
        else:
            overall_status = "CERTIFIED"

        result = {
            "schema_version": 2,
            "protocol": PROTOCOL,
            "protocol_version": VERSION,
            "tier": tier,
            "delivery_mode": delivery_mode,
            "baseline_commit": base_commit,
            "candidate_commit": head,
            "status": overall_status,
            "defect_count": len(defects),
            "unverified_count": len(unverified),
            "blocked_target_count": len(blocked_targets),
            "defects": defects,
            "unverified": unverified,
            "blocked_targets": blocked_targets,
            "verified_claims": verified_claims,
            "bounded_claims": bounded_claims,
            "acceptance_state": acceptance_state,
            "task_complete": bool(overall_status == "CERTIFIED" and acceptance_state and acceptance_state.get("release_eligible")) if e.get("protocol_version") == "8.2.0" else None,
        }
        encoded = json.dumps(result, indent=2, sort_keys=True) + "\n"
        if args.output:
            atomic_write(Path(args.output), encoded)
        else:
            sys.stdout.write(encoded)

        if overall_status == "FAIL_DEFECT":
            return 1
        if args.require_full_certification and overall_status != "CERTIFIED":
            return 1
        if e.get("protocol_version") == "8.2.0" and not result["task_complete"]:
            return 1  # v8.2 never uses a bounded pass as a success exit for mandatory work.
        return 0
    except (OSError, ValueError, json.JSONDecodeError, RuntimeError, subprocess.SubprocessError) as exc:
        print(f"4ndr0neering validator failed closed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
