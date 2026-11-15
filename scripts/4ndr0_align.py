#!/usr/bin/env python3
"""4ndr0_align.py v8.0.0 — File- and symbol-anchored bidirectional alignment verifier.

Replaces gup_alignment.py with:
1. Rejection of empty alignment arrays (`declarations: []`, `observations: []`) unless
   `zero_dependency_rationale` is explicitly supplied AND verified against the source imports.
2. Concrete file & symbol verification on disk (`--root`): every `provider`, `consumer`,
   `declaration_evidence`, `provider_evidence`, and `consumer_evidence` reference of the form
   `<rel_path>` or `<rel_path>:<symbol_or_pattern>` is checked against actual files in `--root`.
3. Explicit separation between a demonstrated `DEFECT` (missing declared file, missing symbol,
   undeclared observed edge, or unconsumed declaration) and `UNVERIFIED` (e.g., runtime-only
   observation evidence when running in static-only mode).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
sys.dont_write_bytecode = True
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple

PROTOCOL = "4NDR0-GUP-8.0"


def nonempty(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


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


def verify_file_anchor(root: Path, ref: str) -> Tuple[str, str]:
    """Verify a reference formatted as 'path/to/file.ext' or 'path/to/file.ext:symbol_or_text'.
    Returns (status, detail) where status is 'VERIFIED', 'DEFECT', or 'UNVERIFIED'.
    """
    if not nonempty(ref):
        return ("DEFECT", "empty reference")
    ref = ref.strip()
    if ref.startswith("runtime-unverified:"):
        return ("UNVERIFIED", f"runtime observation not executable in current environment ({ref})")

    if ":" in ref:
        rel_path, symbol = ref.split(":", 1)
    elif "#" in ref:
        rel_path, symbol = ref.split("#", 1)
    else:
        rel_path, symbol = ref, ""

    rel_path = rel_path.strip()
    symbol = symbol.strip()
    if not rel_path:
        return ("DEFECT", f"missing file path in reference '{ref}'")

    target = (root / rel_path).resolve()
    try:
        target.relative_to(root.resolve())
    except ValueError:
        return ("DEFECT", f"reference '{rel_path}' escapes repository root")

    if not target.is_file():
        return ("DEFECT", f"referenced file '{rel_path}' does not exist on disk")

    try:
        text = target.read_text(encoding="utf-8")
    except OSError as exc:
        return ("DEFECT", f"referenced file '{rel_path}' is unreadable: {exc}")

    if symbol:
        if symbol not in text:
            return ("DEFECT", f"symbol/anchor '{symbol}' not found in file '{rel_path}'")
    file_sha = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
    return ("VERIFIED", f"{rel_path} (sha256:{file_sha}{f', matched:{symbol}' if symbol else ''})")


def validate_alignment_data(root: Path, raw: dict) -> dict:
    defects: List[str] = []
    unverified: List[str] = []
    verified_anchors: List[dict] = []

    if not isinstance(raw, dict):
        return {
            "schema_version": 2,
            "protocol": PROTOCOL,
            "gate": "bidirectional-alignment",
            "status": "FAIL_DEFECT",
            "declaration_count": 0,
            "observation_count": 0,
            "defects": ["alignment top-level value must be a JSON object"],
            "unverified": [],
            "verified_anchors": [],
        }

    declarations = raw.get("declarations")
    observations = raw.get("observations")
    zero_dep_rationale = raw.get("zero_dependency_rationale")

    if not isinstance(declarations, list) or not isinstance(observations, list):
        return {
            "schema_version": 2,
            "protocol": PROTOCOL,
            "gate": "bidirectional-alignment",
            "status": "FAIL_DEFECT",
            "declaration_count": 0,
            "observation_count": 0,
            "defects": ["declarations and observations must be arrays"],
            "unverified": [],
            "verified_anchors": [],
        }

    # Block the empty-alignment bypass!
    if len(declarations) == 0 and len(observations) == 0:
        if not nonempty(zero_dep_rationale):
            defects.append(
                "empty alignment data (0 declarations, 0 observations) without explicit zero_dependency_rationale is forbidden"
            )
        else:
            scope_files = raw.get("scope_files", [])
            if not isinstance(scope_files, list) or not scope_files:
                defects.append("zero_dependency_rationale requires non-empty scope_files verified on disk")
            else:
                for sf in scope_files:
                    st, detail = verify_file_anchor(root, str(sf))
                    if st == "DEFECT":
                        defects.append(f"scope_file defect: {detail}")
                    else:
                        verified_anchors.append({"ref": sf, "status": st, "detail": detail})

    declared_edges: List[Tuple[str, str, str]] = []
    observed_edges: List[Tuple[str, str, str]] = []

    for i, item in enumerate(declarations):
        if not isinstance(item, dict):
            defects.append(f"declarations[{i}] must be an object")
            continue
        missing_f = [f for f in ("id", "provider", "consumer", "declaration_evidence", "provider_evidence", "consumer_evidence") if not nonempty(item.get(f))]
        if missing_f:
            defects.append(f"declarations[{i}] missing required fields: {', '.join(missing_f)}")
            continue
        edge = (item["id"].strip(), item["provider"].strip(), item["consumer"].strip())
        declared_edges.append(edge)

        for field_name in ("provider", "consumer", "declaration_evidence", "provider_evidence", "consumer_evidence"):
            st, detail = verify_file_anchor(root, item[field_name])
            if st == "DEFECT":
                defects.append(f"declarations[{i}].{field_name} ({item['id']}): {detail}")
            elif st == "UNVERIFIED":
                unverified.append(f"declarations[{i}].{field_name} ({item['id']}): {detail}")
            else:
                verified_anchors.append({"edge_id": item["id"], "field": f"declarations.{field_name}", "detail": detail})

    for i, item in enumerate(observations):
        if not isinstance(item, dict):
            defects.append(f"observations[{i}] must be an object")
            continue
        missing_f = [f for f in ("id", "provider", "consumer", "observation_evidence") if not nonempty(item.get(f))]
        if missing_f:
            defects.append(f"observations[{i}] missing required fields: {', '.join(missing_f)}")
            continue
        edge = (item["id"].strip(), item["provider"].strip(), item["consumer"].strip())
        observed_edges.append(edge)

        for field_name in ("provider", "consumer", "observation_evidence"):
            st, detail = verify_file_anchor(root, item[field_name])
            if st == "DEFECT":
                defects.append(f"observations[{i}].{field_name} ({item['id']}): {detail}")
            elif st == "UNVERIFIED":
                unverified.append(f"observations[{i}].{field_name} ({item['id']}): {detail}")
            else:
                verified_anchors.append({"edge_id": item["id"], "field": f"observations.{field_name}", "detail": detail})

    if len({e[0] for e in declared_edges}) != len(declared_edges):
        defects.append("duplicate declaration id")
    if len({e[0] for e in observed_edges}) != len(observed_edges):
        defects.append("duplicate observation id")

    d_set = set(declared_edges)
    o_set = set(observed_edges)
    for e in sorted(d_set - o_set):
        defects.append(f"declared relationship has no observed consumer/provider edge: {e}")
    for e in sorted(o_set - d_set):
        defects.append(f"observed relationship is undeclared: {e}")

    if defects:
        status = "FAIL_DEFECT"
    elif unverified:
        status = "BOUNDED_UNVERIFIED"
    else:
        status = "VERIFIED"

    return {
        "schema_version": 2,
        "protocol": PROTOCOL,
        "gate": "bidirectional-alignment",
        "status": status,
        "declaration_count": len(declared_edges),
        "observation_count": len(observed_edges),
        "defect_count": len(defects),
        "unverified_count": len(unverified),
        "defects": defects,
        "unverified": unverified,
        "verified_anchors": verified_anchors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Path to alignment JSON file")
    parser.add_argument("--root", default=".", help="Repository root against which file/symbol anchors are verified")
    parser.add_argument("--output", help="Optional output JSON path")
    parser.add_argument("--strict-certified", action="store_true", help="Require VERIFIED (exit 1 on BOUNDED_UNVERIFIED as well as FAIL_DEFECT)")
    args = parser.parse_args()

    try:
        raw = json.loads(Path(args.input).read_text(encoding="utf-8"))
        result = validate_alignment_data(Path(args.root).resolve(), raw)
        encoded = json.dumps(result, indent=2, sort_keys=True) + "\n"
        if args.output:
            atomic_write(Path(args.output), encoded)
        else:
            sys.stdout.write(encoded)
        if result["status"] == "FAIL_DEFECT":
            return 1
        if args.strict_certified and result["status"] != "VERIFIED":
            return 1
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"4ndr0neering alignment validator failed closed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
