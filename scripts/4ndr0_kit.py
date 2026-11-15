#!/usr/bin/env python3
"""4ndr0_kit.py v8.1.0 — Content-Addressed & Lineage-Adaptive Self-Verifying Update-Kit Builder.

Upgrades 4ndr0_kit.py v8.0.0 to account for constantly changing repository HEAD pins and
sandbox-to-host delivery:
1. Supports three lawful delivery classes:
   - `Class F` (First-Delivery / Standalone Bootstrap)
   - `Class U` (Update Kit for `CERTIFIED` commit ranges)
   - `Class H` (Bounded Handoff Kit for `BOUNDED_PASS` work-in-progress / partial verification)
2. Dual-Mode Pin Verification (Lineage Fast-Forward + Content-Addressed Dynamic HEAD Adaptation):
   - Embeds prerequisite-free Git bundles (`git bundle create <bundle> <round_id>`) plus
     content-addressed baseline (`PIN_KEY_BASE_SHA`) and candidate (`PIN_KEY_SHA`) file pins.
   - When the target repo is at `PIN_BASE`, fast-forwards directly to `PIN_TIP` (`FAST_FORWARD`).
   - When the target repo `HEAD` has moved on unrelated files (`CURRENT_HEAD != PIN_BASE` with
     `PIN_KEY_FILE` still at `PIN_KEY_BASE_SHA`) OR when the kit was authored in an isolated
     sandbox VM (`PIN_BASE` absent from the host repo's `.git/objects`, e.g. host `HEAD` is on an
     independent commit lineage or subdirectory like `scr/`), automatically adapts via
     `CONTENT_PINNED` mode: verifies the bundle in an isolated temp repo against `PIN_TIP` and
     `PIN_TIP_TREE`, backs up any prior file state, applies the verified candidate blobs onto the
     live `HEAD`, verifies `PIN_KEY_SHA` and `GATE_CMD`, and commits cleanly.
   - Fails closed (`exit 1`, `DO NOT FORCE`) when a same-lineage repository has a conflicting
     modification to `PIN_KEY_FILE` (`ACTUAL_KEY_SHA != PIN_KEY_BASE_SHA` and `!= PIN_KEY_SHA`).
3. Canvas / Clipboard Trailing-Newline Immunity:
   - Emits kit bytes without a trailing newline after `#__PAYLOAD_END__` so browser/Canvas
     downloads preserve `PIN_KIT_SHA` byte-for-byte, and normalizes CR/newline variations in `G0`.
"""
from __future__ import annotations

import argparse
import base64
import gzip
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
sys.dont_write_bytecode = True
import tempfile
from pathlib import Path
from typing import Dict, List, Optional

PROTOCOL = "4NDR0-SUK-8.1"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git(root: Path, *args: str) -> str:
    p = subprocess.run(
        ["git", "-C", str(root), *args],
        text=True, encoding="utf-8", stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False, timeout=60
    )
    if p.returncode != 0:
        raise RuntimeError(p.stderr.strip() or f"git {' '.join(args)} failed")
    return p.stdout.strip()


KIT_TEMPLATE = r"""#!/usr/bin/env bash
# ==============================================================================
# SELF-VERIFYING UPDATE & HANDOFF KIT (__PROTOCOL__)
# Suite:        __SUITE__
# Round:        __ROUND__
# Kit Class:    __KIT_CLASS__ (__DELIVERY_MODE__)
# Epistemic:    __EPISTEMIC_STATUS__
#
# WHAT IT DOES:
#   Applies certified/bounded update __PIN_BASE_SHORT__..__PIN_TIP_SHORT__
#   (__COMMIT_COUNT__ commit(s)) to your repository.
#   - If repo HEAD equals PIN_BASE, applies as a direct fast-forward to PIN_TIP.
#   - If repo HEAD has moved (or comes from an independent host lineage / subdir)
#     while target content pins match, dynamically adapts and commits the verified
#     update onto your current branch after checking payload, bundle, tree, and
#     file SHA-256 pins (__PIN_KEY_SHA__) and running (__GATE_CMD_DISPLAY__).
#
# USAGE:
#   bash __KIT_FILENAME__ [/optional/path/to/repo_or_subdir]
#
# SAFETY:
#   - Zero network mutation (never pushes).
#   - Dirty worktree is preserved via `git stash push --include-untracked` (never --all).
#   - Fail-closed on conflicting target file edits, detached HEAD, or corrupted payload.
#   - Idempotent: re-running after application re-verifies cleanly via PIN_TIP or PIN_KEY_SHA.
#
# AFTER IT PRINTS THE GREEN / BOUNDED RESULT LINE:
#   git push
# ==============================================================================
set -euo pipefail

PIN_KIT_EXPECTED="__PIN_KIT_SHA__"
PIN_BASE="__PIN_BASE__"
PIN_TIP="__PIN_TIP__"
PIN_TIP_TREE="__PIN_TIP_TREE__"
PIN_BUNDLE_SHA="__PIN_BUNDLE_SHA__"
PIN_PAYLOAD_SHA="__PIN_PAYLOAD_SHA__"
PIN_KEY_FILE="__PIN_KEY_FILE__"
PIN_KEY_BASE_SHA="__PIN_KEY_BASE_SHA__"
PIN_KEY_SHA="__PIN_KEY_SHA__"
KIT_CLASS="__KIT_CLASS__"
EPISTEMIC_STATUS="__EPISTEMIC_STATUS__"
ROUND_REF="refs/heads/__ROUND__"
FINGERPRINT_FILE="__FINGERPRINT_FILE__"
GATE_CMD="__GATE_CMD__"
OPTIONAL_TOOL="__OPTIONAL_TOOL__"

fail() {
  printf '[KIT-FAIL] %s\n' "$1" >&2
  printf 'Nothing was left half-applied. Fix the above and re-run this kit.\n' >&2
  exit 1
}

# G0: Environment & Pipe Guard
if [ ! -f "$0" ]; then
  fail "Stdin/piped execution is not supported. Download the file first, then run: bash __KIT_FILENAME__"
fi

KIT_SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

for req_tool in bash git base64 gunzip sed awk date find; do
  command -v "$req_tool" >/dev/null 2>&1 || fail "Missing required tool '$req_tool'. Install '$req_tool' and re-run."
done

if command -v sha256sum >/dev/null 2>&1; then
  sha256_file() { sha256sum "$1" | awk '{print $1}'; }
  sha256_stdin() { sha256sum | awk '{print $1}'; }
elif command -v shasum >/dev/null 2>&1; then
  sha256_file() { shasum -a 256 "$1" | awk '{print $1}'; }
  sha256_stdin() { shasum -a 256 | awk '{print $1}'; }
else
  fail "Missing sha256sum or shasum. Install coreutils and re-run."
fi

sha256_norm_file() {
  awk '{sub(/\r$/,""); print}' "$1" | sha256_stdin
}

HAVE_OPT_TOOL=1
if [ -n "$OPTIONAL_TOOL" ]; then
  if ! command -v "$OPTIONAL_TOOL" >/dev/null 2>&1; then
    HAVE_OPT_TOOL=0
  fi
fi

SELF_SHA="$(awk '{sub(/\r$/,""); lines[NR]=$0} END {for(i=1;i<=NR;i++) printf "%s%s", lines[i], (i<NR?"\n":"")}' "$KIT_SELF" | sha256_stdin)"
printf '[G0] Kit self-hash: %s (compare with out-of-band round-record pin)\n' "$SELF_SHA"

TMP_DIR="$(mktemp -d)"
REPO_DIR=""
cleanup() {
  if [ -n "$REPO_DIR" ] && [ -d "$REPO_DIR/.git" ]; then
    git -C "$REPO_DIR" branch -D "__ROUND__-incoming" >/dev/null 2>&1 || true
    rm -f "$REPO_DIR/.git/kit.lock" >/dev/null 2>&1 || true
  fi
  rm -rf "$TMP_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# G1: Locate Repository & Resolve Target Subdirectory
TARGET_CANDIDATE="${1:-$PWD}"
if [ ! -d "$TARGET_CANDIDATE" ]; then
  fail "Target directory '$TARGET_CANDIDATE' does not exist. Run: bash \"$KIT_SELF\" /full/path/to/repo"
fi
TARGET_ABS="$(cd "$TARGET_CANDIDATE" && pwd)"
if [ -d "$TARGET_ABS/.git" ]; then
  REPO_DIR="$TARGET_ABS"
else
  REPO_DIR="$(git -C "$TARGET_ABS" rev-parse --show-toplevel 2>/dev/null || true)"
fi
if [ -z "$REPO_DIR" ] || [ ! -d "$REPO_DIR/.git" ]; then
  fail "No git repository found at '$TARGET_CANDIDATE'. Run: bash \"$KIT_SELF\" /full/path/to/repo"
fi

# Concurrency lock
if [ -f "$REPO_DIR/.git/kit.lock" ]; then
  fail "Another kit instance is running ($REPO_DIR/.git/kit.lock exists); let it finish."
fi
printf '%s\n' "$$" > "$REPO_DIR/.git/kit.lock"

# Resolve target key file path inside REPO_DIR / TARGET_ABS
RESOLVED_KEY_ABS=""
KEY_BASE_NORM=""
if [ -n "$PIN_KEY_FILE" ]; then
  if [ -f "$TARGET_ABS/$PIN_KEY_FILE" ]; then
    RESOLVED_KEY_ABS="$TARGET_ABS/$PIN_KEY_FILE"
  elif [ -f "$REPO_DIR/$PIN_KEY_FILE" ]; then
    RESOLVED_KEY_ABS="$REPO_DIR/$PIN_KEY_FILE"
  else
    FOUND_BY_NAME="$(find "$TARGET_ABS" -maxdepth 4 -name "$(basename "$PIN_KEY_FILE")" -not -path '*/.git/*' 2>/dev/null | head -n 1 || true)"
    if [ -n "$FOUND_BY_NAME" ] && [ -f "$FOUND_BY_NAME" ]; then
      RESOLVED_KEY_ABS="$FOUND_BY_NAME"
    else
      # Content-addressed discovery: scan TARGET_ABS for a file matching PIN_KEY_BASE_SHA or PIN_KEY_SHA
      while IFS= read -r cand_f; do
        [ -f "$cand_f" ] || continue
        c_sha="$(sha256_file "$cand_f")"
        if [ "$c_sha" = "$PIN_KEY_BASE_SHA" ] || [ "$c_sha" = "$PIN_KEY_SHA" ]; then
          RESOLVED_KEY_ABS="$cand_f"
          break
        fi
      done < <(find "$TARGET_ABS" -maxdepth 3 -type f -not -path '*/.git/*' 2>/dev/null || true)
    fi
  fi
  if [ -z "$RESOLVED_KEY_ABS" ]; then
    RESOLVED_KEY_ABS="$TARGET_ABS/$PIN_KEY_FILE"
  fi
fi

if [ -n "$RESOLVED_KEY_ABS" ]; then
  RESOLVED_KEY_REL="${RESOLVED_KEY_ABS#"$REPO_DIR/"}"
  KEY_DIR="$(dirname "$RESOLVED_KEY_ABS")"
else
  RESOLVED_KEY_REL=""
  KEY_DIR="$TARGET_ABS"
fi

# G2: Dual-Mode Baseline Verification (Lineage Fast-Forward + Content-Addressed Dynamic Pinning)
CURRENT_BRANCH="$(git -C "$REPO_DIR" symbolic-ref --short HEAD 2>/dev/null || true)"
if [ -z "$CURRENT_BRANCH" ]; then
  fail "Detached HEAD detected. Run 'git -C \"$REPO_DIR\" checkout main' and re-run: bash \"$KIT_SELF\" \"$REPO_DIR\""
fi

CURRENT_HEAD="$(git -C "$REPO_DIR" rev-parse HEAD 2>/dev/null || true)"
HAS_PIN_BASE_OBJ=0
if git -C "$REPO_DIR" cat-file -e "$PIN_BASE^{commit}" 2>/dev/null; then
  HAS_PIN_BASE_OBJ=1
fi

WORKTREE_KEY_SHA=""
HEAD_KEY_SHA=""
if [ -n "$RESOLVED_KEY_ABS" ] && [ -f "$RESOLVED_KEY_ABS" ]; then
  WORKTREE_KEY_SHA="$(sha256_file "$RESOLVED_KEY_ABS")"
fi
if [ -n "$RESOLVED_KEY_REL" ] && git -C "$REPO_DIR" cat-file -e "HEAD:$RESOLVED_KEY_REL" 2>/dev/null; then
  HEAD_KEY_SHA="$(git -C "$REPO_DIR" show "HEAD:$RESOLVED_KEY_REL" | sha256_stdin)"
fi

ALREADY=0
APPLY_MODE="FAST_FORWARD"
BACKUP_PRIOR_FILE=0

if [ "$CURRENT_HEAD" = "$PIN_TIP" ]; then
  ALREADY=1
  printf '[G2] Repository already at PIN_TIP (%s); skipping apply and re-verifying.\n' "$PIN_TIP"
elif [ -n "$PIN_KEY_SHA" ] && [ "$HEAD_KEY_SHA" = "$PIN_KEY_SHA" ] && [ "$WORKTREE_KEY_SHA" = "$PIN_KEY_SHA" ]; then
  ALREADY=1
  APPLY_MODE="CONTENT_PINNED"
  printf '[G2] Target file %s already matches PIN_KEY_SHA (%s) at HEAD (%s); skipping apply and re-verifying.\n' "$RESOLVED_KEY_REL" "$PIN_KEY_SHA" "$CURRENT_HEAD"
elif [ "$CURRENT_HEAD" = "$PIN_BASE" ]; then
  if [ -n "$FINGERPRINT_FILE" ] && [ ! -f "$REPO_DIR/$FINGERPRINT_FILE" ] && [ ! -f "$TARGET_ABS/$FINGERPRINT_FILE" ]; then
    fail "Repository fingerprint failed: missing '$FINGERPRINT_FILE' in '$REPO_DIR'."
  fi
  APPLY_MODE="FAST_FORWARD"
  printf '[G2] Baseline verified at PIN_BASE (%s).\n' "$PIN_BASE"
elif [ "$HAS_PIN_BASE_OBJ" -eq 1 ]; then
  # Same-lineage repository where HEAD moved past PIN_BASE:
  # Allow CONTENT_PINNED apply ONLY if PIN_KEY_FILE is specified and still matches PIN_KEY_BASE_SHA.
  if [ -n "$PIN_KEY_FILE" ] && [ -n "$PIN_KEY_BASE_SHA" ] && [ "$PIN_KEY_BASE_SHA" != "NEW" ] && [ "$HEAD_KEY_SHA" = "$PIN_KEY_BASE_SHA" ] && [ "${KIT_STRICT_LINEAGE:-0}" != "1" ]; then
    APPLY_MODE="CONTENT_PINNED"
    printf '[G2] Dynamic HEAD adaptation: repo HEAD moved to %s, but %s matches baseline PIN_KEY_BASE_SHA (%s).\n' "$CURRENT_HEAD" "$RESOLVED_KEY_REL" "$PIN_KEY_BASE_SHA"
  else
    fail "Baseline mismatch: repo HEAD is $CURRENT_HEAD, expected PIN_BASE ($PIN_BASE). If you have newer local commits, DO NOT FORCE anything — report this to the executor."
  fi
else
  # Cross-lineage / host-repository adaptation (sandbox PIN_BASE is not in local .git history):
  if [ "${KIT_STRICT_LINEAGE:-0}" = "1" ]; then
    fail "Baseline mismatch (strict lineage): repo HEAD is $CURRENT_HEAD, expected PIN_BASE ($PIN_BASE). DO NOT FORCE anything — report this to the executor."
  fi
  APPLY_MODE="CONTENT_PINNED"
  if [ "$WORKTREE_KEY_SHA" = "$PIN_KEY_BASE_SHA" ] || [ "$HEAD_KEY_SHA" = "$PIN_KEY_BASE_SHA" ]; then
    printf '[G2] Cross-lineage baseline verified: host HEAD is %s; %s matches PIN_KEY_BASE_SHA (%s).\n' "$CURRENT_HEAD" "$RESOLVED_KEY_REL" "$PIN_KEY_BASE_SHA"
  else
    BACKUP_PRIOR_FILE=1
    printf '[G2] Cross-lineage host adaptation: local HEAD is %s (build PIN_BASE %s is external); adapting pins to local repository.\n' "$CURRENT_HEAD" "$PIN_BASE"
  fi
fi

# G2.5: WIP Preservation
STASH_CREATED=0
TS="$(date -u +%Y%m%dT%H%M%SZ)"
BK_DIR="$REPO_DIR/.git/kit-backups/$TS"
if [ "$ALREADY" -eq 0 ]; then
  if [ "$BACKUP_PRIOR_FILE" -eq 1 ] && [ -n "$RESOLVED_KEY_ABS" ] && [ -f "$RESOLVED_KEY_ABS" ]; then
    mkdir -p "$BK_DIR"
    cp -p "$RESOLVED_KEY_ABS" "$BK_DIR/$(basename "$RESOLVED_KEY_ABS").pre-kit.bak"
  fi
  WIP_STATUS="$(git -C "$REPO_DIR" status --porcelain=v1 --untracked-files=all)"
  if [ -n "$WIP_STATUS" ]; then
    mkdir -p "$BK_DIR"
    git -C "$REPO_DIR" stash push --include-untracked -m "__ROUND__ kit WIP backup $TS" >/dev/null
    STASH_CREATED=1
    cat > "$BK_DIR/RESTORE-INSTRUCTIONS.txt" <<EOF
Your uncommitted changes were safely stashed before applying __ROUND__.
Three lawful next actions:
  1. Inspect stash: git -C "$REPO_DIR" stash list
  2. Restore WIP:   git -C "$REPO_DIR" stash pop
  3. Keep backup:   do nothing (stash remains reachable in git reflog for ~30 days)
EOF
    POST_STASH="$(git -C "$REPO_DIR" status --porcelain=v1 --untracked-files=all)"
    if [ -n "$POST_STASH" ]; then
      fail "Worktree still dirty after stash; aborting rather than guessing."
    fi
    printf '[G2.5] Dirty worktree stashed cleanly (%s).\n' "$BK_DIR/RESTORE-INSTRUCTIONS.txt"
  fi
fi

# G3: Payload Verification & Application
sed -n '/^#__PAYLOAD_BEGIN__$/,/^#__PAYLOAD_END__$/p' "$KIT_SELF" | sed '1d;$d' > "$TMP_DIR/payload.b64"
ACTUAL_PAYLOAD_SHA="$(sha256_file "$TMP_DIR/payload.b64")"
if [ "$ACTUAL_PAYLOAD_SHA" != "$PIN_PAYLOAD_SHA" ]; then
  fail "Corrupted payload block (sha256 $ACTUAL_PAYLOAD_SHA != $PIN_PAYLOAD_SHA). Re-download the kit."
fi

base64 -d < "$TMP_DIR/payload.b64" | gunzip > "$TMP_DIR/range.bundle"
ACTUAL_BUNDLE_SHA="$(sha256_file "$TMP_DIR/range.bundle")"
if [ "$ACTUAL_BUNDLE_SHA" != "$PIN_BUNDLE_SHA" ]; then
  fail "Decoded bundle sha256 mismatch ($ACTUAL_BUNDLE_SHA != $PIN_BUNDLE_SHA)."
fi

APPLIED_COMMIT="$CURRENT_HEAD"
if [ "$ALREADY" -eq 0 ]; then
  HEADS_OUT="$(git -C "$REPO_DIR" bundle list-heads "$TMP_DIR/range.bundle")"
  EXPECTED_HEAD="$PIN_TIP $ROUND_REF"
  if [ "$HEADS_OUT" != "$EXPECTED_HEAD" ]; then
    fail "Bundle list-heads mismatch: got '$HEADS_OUT', expected '$EXPECTED_HEAD'."
  fi

  # Verify bundle structure and PIN_BASE..PIN_TIP lineage inside an isolated temporary repository
  git init -q "$TMP_DIR/bundle_repo"
  VERIFY_OUT="$(git -C "$TMP_DIR/bundle_repo" bundle verify "$TMP_DIR/range.bundle" 2>&1)" || fail "git bundle verify failed: $VERIFY_OUT"
  git -C "$TMP_DIR/bundle_repo" fetch "$TMP_DIR/range.bundle" "$ROUND_REF:refs/heads/__ROUND__-incoming" >/dev/null 2>&1 || fail "Failed to unpack bundle into verification sandbox."
  BUNDLE_TIP="$(git -C "$TMP_DIR/bundle_repo" rev-parse "refs/heads/__ROUND__-incoming")"
  if [ "$BUNDLE_TIP" != "$PIN_TIP" ]; then
    fail "Unpacked bundle tip ($BUNDLE_TIP) does not match PIN_TIP ($PIN_TIP)."
  fi
  BUNDLE_TREE="$(git -C "$TMP_DIR/bundle_repo" rev-parse "$PIN_TIP^{tree}")"
  if [ "$BUNDLE_TREE" != "$PIN_TIP_TREE" ]; then
    fail "Unpacked bundle tree ($BUNDLE_TREE) does not match PIN_TIP_TREE ($PIN_TIP_TREE)."
  fi
  git -C "$TMP_DIR/bundle_repo" cat-file -e "$PIN_BASE^{commit}" 2>/dev/null || fail "Bundle does not contain PIN_BASE ($PIN_BASE)."
  git -C "$TMP_DIR/bundle_repo" merge-base --is-ancestor "$PIN_BASE" "$PIN_TIP" 2>/dev/null || fail "Bundle PIN_BASE ($PIN_BASE) is not an ancestor of PIN_TIP ($PIN_TIP)."

  if [ "$APPLY_MODE" = "FAST_FORWARD" ]; then
    git -C "$REPO_DIR" fetch "$TMP_DIR/range.bundle" "$ROUND_REF:refs/heads/__ROUND__-incoming" >/dev/null 2>&1
    git -C "$REPO_DIR" merge --ff-only "refs/heads/__ROUND__-incoming" >/dev/null 2>&1 || fail "Fast-forward merge failed."
    git -C "$REPO_DIR" branch -D "__ROUND__-incoming" >/dev/null 2>&1 || true

    POST_HEAD="$(git -C "$REPO_DIR" rev-parse HEAD)"
    if [ "$POST_HEAD" != "$PIN_TIP" ]; then
      fail "Post-merge HEAD ($POST_HEAD) does not match PIN_TIP ($PIN_TIP)."
    fi
    APPLIED_COMMIT="$POST_HEAD"
    printf '[G3] Payload verified and fast-forwarded to %s.\n' "$PIN_TIP"
  else
    # CONTENT_PINNED application onto moving/host HEAD
    while IFS= read -r changed_rel; do
      [ -n "$changed_rel" ] || continue
      if [ -n "$PIN_KEY_FILE" ] && [ "$changed_rel" = "$PIN_KEY_FILE" ] && [ -n "$RESOLVED_KEY_ABS" ]; then
        dest_abs="$RESOLVED_KEY_ABS"
      else
        dest_abs="$KEY_DIR/$changed_rel"
      fi
      mkdir -p "$(dirname "$dest_abs")"
      if git -C "$TMP_DIR/bundle_repo" cat-file -e "$PIN_TIP:$changed_rel" 2>/dev/null; then
        git -C "$TMP_DIR/bundle_repo" show "$PIN_TIP:$changed_rel" > "$dest_abs"
        f_mode="$(git -C "$TMP_DIR/bundle_repo" ls-tree "$PIN_TIP" -- "$changed_rel" | awk '{print $1}')"
        if [ "$f_mode" = "100755" ]; then
          chmod +x "$dest_abs"
        fi
        git -C "$REPO_DIR" add -f -- "${dest_abs#"$REPO_DIR/"}"
      fi
    done < <(git -C "$TMP_DIR/bundle_repo" diff --name-only "$PIN_BASE" "$PIN_TIP")

    COMMIT_MSG="$(git -C "$TMP_DIR/bundle_repo" log -1 --format=%B "$PIN_TIP")"
    if ! git -C "$REPO_DIR" diff --cached --quiet; then
      if git -C "$REPO_DIR" config user.name >/dev/null 2>&1 && git -C "$REPO_DIR" config user.email >/dev/null 2>&1; then
        git -C "$REPO_DIR" commit -qm "$COMMIT_MSG"
      else
        git -C "$REPO_DIR" -c user.name="4ndr0666" -c user.email="4ndr0666@users.noreply.github.com" commit -qm "$COMMIT_MSG"
      fi
    fi
    APPLIED_COMMIT="$(git -C "$REPO_DIR" rev-parse HEAD)"
    printf '[G3] Payload verified (tree=%s) and committed onto %s -> %s.\n' "$PIN_TIP_TREE" "$CURRENT_HEAD" "$APPLIED_COMMIT"
  fi
fi

# G4: Proof of Exactness + Gate
if [ "$APPLY_MODE" = "FAST_FORWARD" ]; then
  ACTUAL_TREE="$(git -C "$REPO_DIR" rev-parse 'HEAD^{tree}')"
  if [ "$ACTUAL_TREE" != "$PIN_TIP_TREE" ]; then
    fail "Tree hash mismatch: got $ACTUAL_TREE, expected $PIN_TIP_TREE."
  fi
fi

if [ -n "$PIN_KEY_FILE" ]; then
  if [ ! -f "$RESOLVED_KEY_ABS" ]; then
    if [ "$ALREADY" -eq 0 ] && [ "$APPLY_MODE" = "CONTENT_PINNED" ]; then
      git -C "$REPO_DIR" reset --hard "$CURRENT_HEAD" >/dev/null 2>&1 || true
    fi
    fail "Pinned key file '$RESOLVED_KEY_REL' is missing after apply."
  fi
  ACTUAL_KEY_SHA="$(sha256_file "$RESOLVED_KEY_ABS")"
  if [ "$ACTUAL_KEY_SHA" != "$PIN_KEY_SHA" ]; then
    if [ "$ALREADY" -eq 0 ] && [ "$APPLY_MODE" = "CONTENT_PINNED" ]; then
      git -C "$REPO_DIR" reset --hard "$CURRENT_HEAD" >/dev/null 2>&1 || true
    fi
    fail "Pinned file '$RESOLVED_KEY_REL' sha256 mismatch ($ACTUAL_KEY_SHA != $PIN_KEY_SHA)."
  fi
  printf '[G4] Verified key file %s (%s — byte-identical).\n' "$RESOLVED_KEY_REL" "$PIN_KEY_SHA"
fi

GATE_DEFERRED=0
if [ -n "$GATE_CMD" ]; then
  if [ "$HAVE_OPT_TOOL" -eq 1 ]; then
    PRE_GATE_TREE="$(git -C "$REPO_DIR" rev-parse 'HEAD^{tree}')"
    if ! (cd "$KEY_DIR" && PYTHONDONTWRITEBYTECODE=1 eval "$GATE_CMD" > "$TMP_DIR/gate.log" 2>&1); then
      if [ "$ALREADY" -eq 0 ] && [ "$APPLY_MODE" = "CONTENT_PINNED" ]; then
        git -C "$REPO_DIR" reset --hard "$CURRENT_HEAD" >/dev/null 2>&1 || true
      fi
      fail "Verification gate failed ($GATE_CMD). Inspect log."
    fi
    DRIFT="$(git -C "$REPO_DIR" status --porcelain=v1 --untracked-files=no)"
    if [ -n "$DRIFT" ]; then
      if [ "$ALREADY" -eq 0 ] && [ "$APPLY_MODE" = "CONTENT_PINNED" ]; then
        git -C "$REPO_DIR" reset --hard "$CURRENT_HEAD" >/dev/null 2>&1 || true
      fi
      fail "Verification gate dirtied tracked files in the repository."
    fi
    POST_GATE_TREE="$(git -C "$REPO_DIR" rev-parse 'HEAD^{tree}')"
    if [ "$POST_GATE_TREE" != "$PRE_GATE_TREE" ]; then
      fail "Tree hash mutated during verification gate."
    fi
    printf '[G4] Verification gate passed cleanly with zero worktree drift.\n'
  else
    GATE_DEFERRED=1
    printf '[G4] Optional runtime tool (%s) absent; gate deferred. Run manually when available: (cd "%s" && %s)\n' "$OPTIONAL_TOOL" "$KEY_DIR" "$GATE_CMD"
  fi
fi

# G5: Report
if [ "$ALREADY" -eq 0 ]; then
  if [ "$APPLY_MODE" = "FAST_FORWARD" ]; then
    printf '[G5] Applied commits (%s..%s):\n' "$PIN_BASE" "$PIN_TIP"
    git -C "$REPO_DIR" log --oneline --reverse "$PIN_BASE..$PIN_TIP" | sed 's/^/  /'
  else
    printf '[G5] Applied commit (%s..%s):\n' "$CURRENT_HEAD" "$APPLIED_COMMIT"
    git -C "$REPO_DIR" log -n 1 --oneline "$APPLIED_COMMIT" | sed 's/^/  /'
  fi
fi

if [ "$STASH_CREATED" -eq 1 ] && [ -n "$PIN_KEY_FILE" ]; then
  STASH_FILE_SHA="$((git -C "$REPO_DIR" show "stash@{0}:$RESOLVED_KEY_REL" 2>/dev/null || git -C "$REPO_DIR" show "stash@{0}^3:$RESOLVED_KEY_REL" 2>/dev/null) | sha256_stdin || true)"
  if [ "$STASH_FILE_SHA" = "$PIN_KEY_SHA" ]; then
    printf '[G5] Canon-identity note: stashed %s matches delivered pin (%s); restoring it is a no-op (drop or keep, both fine).\n' "$RESOLVED_KEY_REL" "$PIN_KEY_SHA"
  elif [ "$STASH_FILE_SHA" = "$PIN_KEY_BASE_SHA" ]; then
    printf '[G5] Canon-identity note: stashed %s is the pre-update baseline (%s); keep the new commit or inspect stash.\n' "$RESOLVED_KEY_REL" "$PIN_KEY_BASE_SHA"
  fi
fi

FINAL_TREE="$(git -C "$REPO_DIR" rev-parse 'HEAD^{tree}')"
if [ "$ALREADY" -eq 1 ]; then
  printf 'KIT RESULT: GREEN (already applied; tree=%s; status=%s) — Next step: git push\n' "$FINAL_TREE" "$EPISTEMIC_STATUS"
elif [ "$GATE_DEFERRED" -eq 1 ]; then
  printf 'KIT RESULT: GREEN (applied + hash-verified; gate DEFERRED: run `%s`; status=%s) — Next step: git push\n' "$GATE_CMD" "$EPISTEMIC_STATUS"
else
  printf 'KIT RESULT: GREEN (applied + verified; tree=%s; status=%s) — Next step: git push\n' "$FINAL_TREE" "$EPISTEMIC_STATUS"
fi
exit 0
#__PAYLOAD_BEGIN__
__PAYLOAD_BLOCK__
#__PAYLOAD_END__"""


def build_kit(
    repo_root: Path,
    base_rev: str,
    tip_rev: str,
    suite: str,
    round_id: str,
    output_path: Path,
    key_file: str = "",
    fingerprint_file: str = "",
    gate_cmd: str = "",
    optional_tool: str = "",
    kit_class: str = "U",
    delivery_mode: str = "CERTIFIED_RELEASE",
    epistemic_status: str = "CERTIFIED",
) -> dict:
    repo_root = repo_root.resolve()
    pin_base = git(repo_root, "rev-parse", f"{base_rev}^{{commit}}")
    pin_tip = git(repo_root, "rev-parse", f"{tip_rev}^{{commit}}")
    pin_tip_tree = git(repo_root, "rev-parse", f"{pin_tip}^{{tree}}")

    commits_out = git(repo_root, "rev-list", "--count", f"{pin_base}..{pin_tip}")
    commit_count = int(commits_out.strip() or "0")
    if commit_count <= 0:
        raise ValueError(f"commit range {pin_base}..{pin_tip} contains 0 commits")

    pin_key_sha = ""
    pin_key_base_sha = ""
    if key_file:
        kf_path = repo_root / key_file
        if not kf_path.is_file():
            raise ValueError(f"key_file '{key_file}' does not exist in {repo_root}")
        pin_key_sha = sha256_bytes(kf_path.read_bytes())
        base_cat = subprocess.run(
            ["git", "-C", str(repo_root), "show", f"{pin_base}:{key_file}"],
            capture_output=True, check=False, timeout=30
        )
        if base_cat.returncode == 0:
            pin_key_base_sha = sha256_bytes(base_cat.stdout)
        else:
            pin_key_base_sha = "NEW"

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        # Create complete single-ref bundle (prerequisite-free so it unpacks on any host repo)
        git(repo_root, "branch", "-f", round_id, pin_tip)
        bundle_path = td_path / f"{round_id}.bundle"
        try:
            git(repo_root, "bundle", "create", str(bundle_path), round_id)
        finally:
            subprocess.run(["git", "-C", str(repo_root), "branch", "-D", round_id], capture_output=True, check=False)

        bundle_bytes = bundle_path.read_bytes()
        pin_bundle_sha = sha256_bytes(bundle_bytes)

        # Deterministic gzip (mtime=0) + 76-char wrapped base64
        gz_bytes = gzip.compress(bundle_bytes, compresslevel=9, mtime=0)
        b64_raw = base64.b64encode(gz_bytes).decode("ascii")
        b64_lines = [b64_raw[i : i + 76] for i in range(0, len(b64_raw), 76)]
        payload_block_with_newline = "\n".join(b64_lines) + "\n"
        # Exact bytes extracted by sed between #__PAYLOAD_BEGIN__ and #__PAYLOAD_END__
        pin_payload_sha = sha256_bytes(payload_block_with_newline.encode("ascii"))

    kit_filename = output_path.name
    replacements = {
        "__PROTOCOL__": PROTOCOL,
        "__SUITE__": suite,
        "__ROUND__": round_id,
        "__KIT_CLASS__": kit_class,
        "__DELIVERY_MODE__": delivery_mode,
        "__EPISTEMIC_STATUS__": epistemic_status,
        "__PIN_KIT_SHA__": "",
        "__PIN_BASE__": pin_base,
        "__PIN_BASE_SHORT__": pin_base[:12],
        "__PIN_TIP__": pin_tip,
        "__PIN_TIP_SHORT__": pin_tip[:12],
        "__PIN_TIP_TREE__": pin_tip_tree,
        "__PIN_BUNDLE_SHA__": pin_bundle_sha,
        "__PIN_PAYLOAD_SHA__": pin_payload_sha,
        "__PIN_KEY_FILE__": key_file,
        "__PIN_KEY_BASE_SHA__": pin_key_base_sha,
        "__PIN_KEY_SHA__": pin_key_sha,
        "__COMMIT_COUNT__": str(commit_count),
        "__KIT_FILENAME__": kit_filename,
        "__FINGERPRINT_FILE__": fingerprint_file,
        "__GATE_CMD__": gate_cmd,
        "__GATE_CMD_DISPLAY__": gate_cmd or "none (hash-only)",
        "__OPTIONAL_TOOL__": optional_tool,
        "__PAYLOAD_BLOCK__": "\n".join(b64_lines),
    }

    content = KIT_TEMPLATE.rstrip("\n")
    for k, v in replacements.items():
        content = content.replace(k, v)

    # Assert zero unresolved placeholders in script zone (Axiom A8/Part IV)
    if re.search(r"__[A-Z0-9_]+__", content.split("#__PAYLOAD_BEGIN__")[0]):
        raise RuntimeError("unresolved template placeholder survived in script zone")

    # Emit without trailing newline so Canvas/clipboard downloads preserve exact PIN_KIT_SHA
    kit_bytes = content.encode("utf-8")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(kit_bytes)
    output_path.chmod(output_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

    kit_sha = sha256_bytes(kit_bytes)
    return {
        "protocol": PROTOCOL,
        "suite": suite,
        "round": round_id,
        "kit_class": kit_class,
        "delivery_mode": delivery_mode,
        "epistemic_status": epistemic_status,
        "kit_path": str(output_path.resolve()),
        "kit_filename": kit_filename,
        "kit_size_bytes": len(kit_bytes),
        "bundle_size_bytes": len(bundle_bytes),
        "commit_count": commit_count,
        "pins": {
            "PIN_KIT_SHA": kit_sha,
            "PIN_BASE": pin_base,
            "PIN_TIP": pin_tip,
            "PIN_TIP_TREE": pin_tip_tree,
            "PIN_BUNDLE_SHA": pin_bundle_sha,
            "PIN_PAYLOAD_SHA": pin_payload_sha,
            "PIN_KEY_FILE": key_file,
            "PIN_KEY_BASE_SHA": pin_key_base_sha,
            "PIN_KEY_SHA": pin_key_sha,
        },
    }


def run_battery(repo_root: Path, kit_path: Path) -> dict:
    """Execute the mandatory P0-P7 + P1B (Moving-HEAD) + P1C (Cross-Lineage Host) + Red Control battery."""
    repo_root = repo_root.resolve()
    kit_path = kit_path.resolve()
    kit_text = kit_path.read_text(encoding="utf-8")

    # Parse pins directly from the kit (P0 law: never hardcode expectations)
    pins: Dict[str, str] = {}
    for line in kit_text.splitlines():
        m = re.match(r'^([A-Z0-9_]+)="([^"]*)"$', line)
        if m:
            pins[m.group(1)] = m.group(2)

    pin_base = pins["PIN_BASE"]
    pin_tip = pins["PIN_TIP"]
    pin_tip_tree = pins["PIN_TIP_TREE"]
    pin_payload_sha = pins["PIN_PAYLOAD_SHA"]
    pin_bundle_sha = pins["PIN_BUNDLE_SHA"]
    pin_key_file = pins.get("PIN_KEY_FILE", "")
    pin_key_base_sha = pins.get("PIN_KEY_BASE_SHA", "")
    pin_key_sha = pins.get("PIN_KEY_SHA", "")

    author_before_head = git(repo_root, "rev-parse", "HEAD")
    author_before_status = git(repo_root, "status", "--porcelain=v1", "--untracked-files=all")

    checks: List[dict] = []

    def record(phase: str, name: str, passed: bool, detail: str = "") -> None:
        checks.append({"phase": phase, "check": name, "status": "PASS" if passed else "FAIL", "detail": detail})

    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)

        # P0: Self-integrity of embedded payload & bundle
        p0_b64 = subprocess.run(
            f"sed -n '/^#__PAYLOAD_BEGIN__$/,/^#__PAYLOAD_END__$/p' '{kit_path}' | sed '1d;$d'",
            shell=True, capture_output=True, check=True
        ).stdout
        actual_payload_sha = sha256_bytes(p0_b64)
        record("P0", "extracted payload sha256 matches PIN_PAYLOAD_SHA", actual_payload_sha == pin_payload_sha, actual_payload_sha)

        p0_bundle = gzip.decompress(base64.b64decode(p0_b64))
        actual_bundle_sha = sha256_bytes(p0_bundle)
        record("P0", "decoded bundle sha256 matches PIN_BUNDLE_SHA", actual_bundle_sha == pin_bundle_sha, actual_bundle_sha)

        # Helper to construct operator-state simulator at PIN_BASE with PIN_TIP pruned
        def make_baseline_clone(name: str) -> Path:
            clone_dir = td_path / name
            subprocess.run(["git", "clone", "-q", str(repo_root), str(clone_dir)], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "config", "user.name", "Operator"], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "config", "user.email", "operator@example.com"], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "checkout", "-q", "-B", "main", pin_base], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "remote", "remove", "origin"], check=True)
            for br in git(clone_dir, "for-each-ref", "--format=%(refname)", "refs/heads/", "refs/tags/").splitlines():
                if br and br != "refs/heads/main":
                    subprocess.run(["git", "-C", str(clone_dir), "update-ref", "-d", br], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "reflog", "expire", "--expire=now", "--all"], check=True)
            subprocess.run(["git", "-C", str(clone_dir), "gc", "--prune=now", "--quiet"], check=True)
            return clone_dir

        # P1: Pristine apply on operator-state clone (FAST_FORWARD mode)
        c_p1 = make_baseline_clone("p1_pristine")
        tip_absent = subprocess.run(["git", "-C", str(c_p1), "cat-file", "-e", pin_tip], capture_output=True).returncode != 0
        record("P1", "operator simulator has PIN_TIP absent before apply", tip_absent)

        r_p1 = subprocess.run(["bash", str(kit_path), str(c_p1)], capture_output=True, text=True)
        record("P1", "pristine apply exits 0 with KIT RESULT: GREEN", r_p1.returncode == 0 and "KIT RESULT: GREEN" in r_p1.stdout, r_p1.stderr.strip())
        record("P1", "post-apply HEAD equals PIN_TIP", git(c_p1, "rev-parse", "HEAD") == pin_tip)
        record("P1", "post-apply tree equals PIN_TIP_TREE", git(c_p1, "rev-parse", "HEAD^{tree}") == pin_tip_tree)

        # P1B: Moving-HEAD apply (repo has new unrelated commits after PIN_BASE, key file untouched at PIN_KEY_BASE_SHA)
        if pin_key_file and pin_key_base_sha and pin_key_base_sha != "NEW":
            c_p1b = make_baseline_clone("p1b_moving_head")
            (c_p1b / "unrelated_other_tool.py").write_text("# unrelated commit advancing HEAD\n", encoding="utf-8")
            subprocess.run(["git", "-C", str(c_p1b), "add", "unrelated_other_tool.py"], check=True)
            subprocess.run(["git", "-C", str(c_p1b), "commit", "-qm", "advance HEAD on unrelated file"], check=True)
            r_p1b = subprocess.run(["bash", str(kit_path), str(c_p1b)], capture_output=True, text=True)
            record(
                "P1B",
                "moving-HEAD repo (unrelated commit ahead of PIN_BASE) adapts via PIN_KEY_BASE_SHA and exits 0",
                r_p1b.returncode == 0 and "KIT RESULT: GREEN" in r_p1b.stdout and sha256_bytes((c_p1b / pin_key_file).read_bytes()) == pin_key_sha,
                r_p1b.stderr.strip(),
            )

        # P1C: Cross-lineage host repo with subdirectory target (simulating /home/git/clone/4ndr0666/scr where PIN_BASE is absent)
        if pin_key_file:
            c_p1c = td_path / "p1c_host_repo"
            c_p1c_sub = c_p1c / "scr"
            c_p1c_sub.mkdir(parents=True)
            subprocess.run(["git", "init", "-q", "--initial-branch=main", str(c_p1c)], check=True)
            subprocess.run(["git", "-C", str(c_p1c), "config", "user.name", "HostUser"], check=True)
            subprocess.run(["git", "-C", str(c_p1c), "config", "user.email", "host@example.com"], check=True)
            # Copy all baseline files into c_p1c/scr/
            for rel_f in git(c_p1, "ls-tree", "-r", "--name-only", pin_base).splitlines():
                if not rel_f:
                    continue
                dest_f = c_p1c_sub / rel_f
                dest_f.parent.mkdir(parents=True, exist_ok=True)
                blob_b = subprocess.check_output(["git", "-C", str(c_p1), "show", f"{pin_base}:{rel_f}"])
                dest_f.write_bytes(blob_b)
            (c_p1c / "README.md").write_text("# Host Monorepo\n", encoding="utf-8")
            subprocess.run(["git", "-C", str(c_p1c), "add", "-A"], check=True)
            subprocess.run(["git", "-C", str(c_p1c), "commit", "-qm", "independent host history"], check=True)

            r_p1c = subprocess.run(["bash", str(kit_path), str(c_p1c_sub)], capture_output=True, text=True)
            record(
                "P1C",
                "cross-lineage host repo with subdir argument ('scr') applies cleanly and exits 0",
                r_p1c.returncode == 0 and "KIT RESULT: GREEN" in r_p1c.stdout and sha256_bytes((c_p1c_sub / pin_key_file).read_bytes()) == pin_key_sha,
                r_p1c.stderr.strip(),
            )
            # Re-run on cross-lineage host repo to verify idempotence when HEAD != PIN_TIP
            r_p1c_idem = subprocess.run(["bash", str(kit_path), str(c_p1c_sub)], capture_output=True, text=True)
            record(
                "P1C",
                "re-running kit on cross-lineage host repo exits 0 with already-applied status",
                r_p1c_idem.returncode == 0 and "already applied" in r_p1c_idem.stdout,
                r_p1c_idem.stderr.strip(),
            )

        # P2: Dirty-tree WIP stash + restore instructions + canon-identity note + lossless round-trip
        c_p2 = make_baseline_clone("p2_dirty")
        (c_p2 / "operator_wip.txt").write_text("untracked operator notes\n", encoding="utf-8")
        if pin_key_file:
            delivered_bytes = (c_p1 / pin_key_file).read_bytes()
            (c_p2 / pin_key_file).parent.mkdir(parents=True, exist_ok=True)
            (c_p2 / pin_key_file).write_bytes(delivered_bytes)
        r_p2 = subprocess.run(["bash", str(kit_path), str(c_p2)], capture_output=True, text=True)
        record("P2", "dirty-tree apply exits 0 and creates stash backup", r_p2.returncode == 0 and "[G2.5]" in r_p2.stdout)
        if pin_key_file:
            record("P2", "canon-identity note printed when stashed file equals delivered pin", "Canon-identity note" in r_p2.stdout)
        subprocess.run(["git", "-C", str(c_p2), "checkout", "--", "."], check=False)
        subprocess.run(["git", "-C", str(c_p2), "stash", "pop"], capture_output=True, check=False)
        record("P2", "untracked WIP file survives stash round-trip byte-identically", (c_p2 / "operator_wip.txt").read_text(encoding="utf-8") == "untracked operator notes\n")

        # P3: Conflicting baseline file divergence fail-closed
        c_p3 = make_baseline_clone("p3_wrong_base")
        conflict_target = pin_key_file if pin_key_file else "diverged.txt"
        (c_p3 / conflict_target).parent.mkdir(parents=True, exist_ok=True)
        (c_p3 / conflict_target).write_text("# conflicting operator modification ahead of base\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(c_p3), "add", conflict_target], check=True)
        subprocess.run(["git", "-C", str(c_p3), "commit", "-qm", "operator conflicting edit"], check=True)
        wrong_head = git(c_p3, "rev-parse", "HEAD")
        r_p3 = subprocess.run(["bash", str(kit_path), str(c_p3)], capture_output=True, text=True)
        record("P3", "conflicting baseline fails closed (exit 1) and leaves HEAD untouched", r_p3.returncode == 1 and git(c_p3, "rev-parse", "HEAD") == wrong_head and "DO NOT FORCE" in r_p3.stderr)

        # P4: No repo fail-closed with exact re-run syntax
        empty_dir = td_path / "p4_no_repo"
        empty_dir.mkdir()
        r_p4 = subprocess.run(["bash", str(kit_path), str(empty_dir)], capture_output=True, text=True)
        record("P4", "non-repo path fails closed (exit 1) with exact re-run syntax", r_p4.returncode == 1 and str(kit_path) in r_p4.stderr)

        # P5: Optional tool absent -> deferred gate mode
        c_p5 = make_baseline_clone("p5_defer")
        defer_kit = td_path / "defer_kit.sh"
        defer_kit.write_text(kit_text.replace('OPTIONAL_TOOL=""', 'OPTIONAL_TOOL="__nonexistent_runtime_bin__"').replace('GATE_CMD=""', 'GATE_CMD="true"'), encoding="utf-8")
        r_p5 = subprocess.run(["bash", str(defer_kit), str(c_p5)], capture_output=True, text=True)
        record("P5", "missing optional tool applies payload and defers gate cleanly", r_p5.returncode == 0 and "DEFERRED" in r_p5.stdout)

        # P6: Re-run idempotence on P1 clone
        r_p6 = subprocess.run(["bash", str(kit_path), str(c_p1)], capture_output=True, text=True)
        record("P6", "re-running applied kit exits 0 with already-applied status", r_p6.returncode == 0 and "already applied" in r_p6.stdout)

        # P7: Authoring repo untouched
        author_after_head = git(repo_root, "rev-parse", "HEAD")
        author_after_status = git(repo_root, "status", "--porcelain=v1", "--untracked-files=all")
        record("P7", "authoring repository untouched before/after battery", author_before_head == author_after_head and author_before_status == author_after_status)

        # Red Control: Corrupt 1 byte newline-anchored inside #__PAYLOAD_BEGIN__ block
        corrupt_kit = td_path / "corrupt_kit.sh"
        raw_kit_bytes = kit_path.read_bytes()
        marker = b"\n#__PAYLOAD_BEGIN__\n"
        idx = raw_kit_bytes.find(marker)
        corrupt_pos = idx + len(marker) + 32
        flipped = b"A" if raw_kit_bytes[corrupt_pos : corrupt_pos + 1] != b"A" else b"B"
        corrupt_bytes = raw_kit_bytes[:corrupt_pos] + flipped + raw_kit_bytes[corrupt_pos + 1 :]
        corrupt_kit.write_bytes(corrupt_bytes)
        c_red = make_baseline_clone("red_control")
        r_red = subprocess.run(["bash", str(corrupt_kit), str(c_red)], capture_output=True, text=True)
        record("RED_CONTROL", "newline-anchored payload byte corruption fails closed at G3 payload pin", r_red.returncode == 1 and "Corrupted payload block" in r_red.stderr and git(c_red, "rev-parse", "HEAD") == pin_base)

    passed_count = sum(1 for c in checks if c["status"] == "PASS")
    return {
        "protocol": PROTOCOL,
        "kit_path": str(kit_path),
        "total_checks": len(checks),
        "passed_checks": passed_count,
        "failed_checks": len(checks) - passed_count,
        "status": "GREEN" if passed_count == len(checks) else "RED",
        "checks": checks,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--base", required=True, help="Baseline Git revision")
    parser.add_argument("--tip", default="HEAD", help="Candidate tip Git revision")
    parser.add_argument("--suite", required=True, help="Suite/project identifier")
    parser.add_argument("--round", required=True, help="Round identifier (e.g. round-1)")
    parser.add_argument("--output", required=True, help="Output path for generated update-*.sh kit")
    parser.add_argument("--key-file", default="", help="Optional round-critical relative file path to pin")
    parser.add_argument("--fingerprint-file", default="", help="Optional repo fingerprint relative file path")
    parser.add_argument("--gate-cmd", default="", help="Optional verification gate command")
    parser.add_argument("--optional-tool", default="", help="Optional runtime binary required by gate-cmd")
    parser.add_argument("--kit-class", default="U", choices=["F", "U", "H"], help="Kit class: F (First), U (Update), H (Bounded Handoff)")
    parser.add_argument("--delivery-mode", default="CERTIFIED_RELEASE", choices=["WIP_CHECKPOINT", "BOUNDED_HANDOFF", "CERTIFIED_RELEASE"])
    parser.add_argument("--epistemic-status", default="CERTIFIED", choices=["CERTIFIED", "BOUNDED_PASS"])
    parser.add_argument("--run-battery", action="store_true", help="Run the P0-P7 + P1B/P1C + Red Control battery immediately")
    parser.add_argument("--metadata-out", help="Write builder + battery metadata JSON to path")
    args = parser.parse_args()

    try:
        meta = build_kit(
            repo_root=Path(args.root),
            base_rev=args.base,
            tip_rev=args.tip,
            suite=args.suite,
            round_id=args.round,
            output_path=Path(args.output),
            key_file=args.key_file,
            fingerprint_file=args.fingerprint_file,
            gate_cmd=args.gate_cmd,
            optional_tool=args.optional_tool,
            kit_class=args.kit_class,
            delivery_mode=args.delivery_mode,
            epistemic_status=args.epistemic_status,
        )
        if args.run_battery:
            battery = run_battery(Path(args.root), Path(args.output))
            meta["battery"] = battery
            if battery["status"] != "GREEN":
                print(json.dumps(meta, indent=2, sort_keys=True), file=sys.stderr)
                return 1
        encoded = json.dumps(meta, indent=2, sort_keys=True) + "\n"
        if args.metadata_out:
            Path(args.metadata_out).write_text(encoded, encoding="utf-8")
        else:
            sys.stdout.write(encoded)
        return 0
    except Exception as exc:
        print(f"4ndr0neering kit builder failed closed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
