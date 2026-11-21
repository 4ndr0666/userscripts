#!/usr/bin/env python3
"""4ndr0_hash.py v8.0.0 — File- and Git-grounded lexical/AST unit atomizer and comparator.

Replaces golden_unit_hash.py v2.2.0 with:
1. Unified manifest schema compatible with 4ndr0_validate.py (`commit`, `files`, `units` with `id`, `path`, `unit`, `sha256`, `kind`, `line_start`, `line_end`).
2. Module-level / file-level fallback unit (`<module_top_level>` or `<file_body>`) so files without named functions/classes (configs, schemas, scripts, prose) can never silently produce an empty `{}` manifest and vacuous PASS.
3. Multi-file repository & Git tree extraction (`--root` + `--rev` or working tree) in addition to single-file comparison.
4. Preserves the GUP v5.3 lexical dispatch invariant: only syntactically active code may modify structural brace depth (`--selftest` verifies all lexical invariants).
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import os
import re
import subprocess
import sys
sys.dont_write_bytecode = True
from bisect import bisect_right
from pathlib import Path
from typing import Dict, List, Optional, Tuple

__version__ = "8.0.0"
PROTOCOL = "4NDR0-GUP-8.0"

EXCLUDED_DIRS = {".git", ".gup", ".4ndr0", "__pycache__", "node_modules", ".venv", "venv", ".tox", ".mypy_cache", ".pytest_cache"}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _line_offsets(source: str) -> Tuple[List[str], List[int]]:
    lines = source.splitlines(keepends=True)
    offsets = [0]
    for line in lines:
        offsets.append(offsets[-1] + len(line))
    return lines, offsets


def _line_of(offsets: List[int], idx: int) -> int:
    return max(0, bisect_right(offsets, idx) - 1)


# ---------------------------------------------------------------------------
# Python AST extraction + module top-level tracking
# ---------------------------------------------------------------------------

def extract_python_units(source: str) -> List[dict]:
    tree = ast.parse(source)
    lines = source.splitlines(keepends=True)
    units: List[dict] = []
    seen_ids: set[str] = set()
    covered_top_lines: set[int] = set()

    def add_unit(name: str, kind: str, start_line: int, end_line: int) -> None:
        if name in seen_ids:
            raise ValueError(f"duplicate stable unit identity in python source: {name}")
        seen_ids.add(name)
        content = "".join(lines[start_line - 1 : end_line])
        units.append({
            "unit": name,
            "kind": kind,
            "line_start": start_line,
            "line_end": end_line,
            "sha256": sha256_text(content),
            "content": content,
        })

    def walk(node: ast.AST, prefix: str = "", top_level: bool = False) -> None:
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                name = f"{prefix}{child.name}" if prefix else child.name
                start = child.decorator_list[0].lineno if child.decorator_list else child.lineno
                end = getattr(child, "end_lineno", child.lineno)
                if top_level:
                    covered_top_lines.update(range(start, end + 1))
                add_unit(name, "function", start, end)
                walk(child, prefix=f"{name}.", top_level=False)
            elif isinstance(child, ast.ClassDef):
                name = f"{prefix}{child.name}" if prefix else child.name
                start = child.decorator_list[0].lineno if child.decorator_list else child.lineno
                end = getattr(child, "end_lineno", child.lineno)
                if top_level:
                    covered_top_lines.update(range(start, end + 1))
                add_unit(name, "class", start, end)
                walk(child, prefix=f"{name}.", top_level=False)
            else:
                walk(child, prefix=prefix, top_level=False)

    walk(tree, top_level=True)

    # Capture top-level active statements (imports, constants, module init, __main__ guard)
    # so deleting or mutating module-scope logic is never invisible.
    top_lines = [
        line for idx, line in enumerate(lines, start=1)
        if idx not in covered_top_lines and line.strip() and not line.lstrip().startswith("#")
    ]
    if top_lines or not units:
        top_content = "".join(top_lines) if top_lines else source
        units.append({
            "unit": "<module_top_level>",
            "kind": "module_top_level",
            "line_start": 1,
            "line_end": max(1, len(lines)),
            "sha256": sha256_text(top_content),
            "content": top_content,
        })

    return sorted(units, key=lambda u: u["unit"])


# ---------------------------------------------------------------------------
# JS / TS lexical scanner (GUP v5.3 invariant preserved)
# ---------------------------------------------------------------------------

_JS_REGEX_KEYWORDS = frozenset((
    "return", "case", "typeof", "instanceof", "in", "of", "new", "delete",
    "void", "do", "else", "yield", "await", "throw",
))

_JS_RESERVED = frozenset((
    "if", "for", "while", "switch", "catch", "with", "return", "function",
    "typeof", "new", "delete", "void", "in", "of", "do", "else", "try",
    "await", "yield", "throw", "case", "default", "var", "let", "const",
    "class", "extends", "import", "export", "break", "continue", "label",
))

_JS_FUNCTION_PATTERN = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(")
_JS_CLASS_PATTERN = re.compile(r"^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b")
_JS_ARROW_CONST_PATTERN = re.compile(
    r"^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*"
    r"(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{"
)
_JS_METHOD_PATTERN = re.compile(r"^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{")


def _js_regex_allowed(last_kind: str, last_word: str) -> bool:
    if last_kind == "":
        return True
    if last_kind == "word":
        return last_word in _JS_REGEX_KEYWORDS
    if last_kind in ("string", "template", ")", "]", "++", "--"):
        return False
    return True


def scan_js(source: str) -> dict:
    braces: List[Tuple[int, str]] = []
    parens: List[Tuple[int, str]] = []
    warnings: List[str] = []
    n = len(source)
    i = 0
    stack: list = []
    last_kind = ""
    last_word = ""

    while i < n:
        ch = source[i]
        top = stack[-1] if stack else None

        if top is not None and top[0] == "tpl":
            if ch == "\\":
                i += 2
                continue
            if ch == "`":
                stack.pop()
                last_kind = "template"
                last_word = ""
                i += 1
                continue
            if ch == "$" and i + 1 < n and source[i + 1] == "{":
                braces.append((i + 1, "{"))
                stack.append(("interp", [0]))
                i += 2
                continue
            i += 1
            continue

        if ch == "/" and i + 1 < n and source[i + 1] == "/":
            j = source.find("\n", i)
            i = n if j == -1 else j
            continue

        if ch == "/" and i + 1 < n and source[i + 1] == "*":
            j = source.find("*/", i + 2)
            if j == -1:
                warnings.append(f"unterminated block comment at offset {i}")
                i = n
            else:
                i = j + 2
            continue

        if ch in ("'", '"'):
            j = i + 1
            while j < n:
                c = source[j]
                if c == "\\":
                    j += 2
                    continue
                if c == ch or c == "\n":
                    break
                j += 1
            if j >= n:
                warnings.append(f"unterminated string at offset {i}")
                i = n
            elif source[j] == "\n":
                warnings.append(f"string not closed before newline at offset {i}")
                i = j
            else:
                i = j + 1
            last_kind = "string"
            last_word = ""
            continue

        if ch == "`":
            stack.append(("tpl",))
            i += 1
            continue

        if ch == "/":
            if _js_regex_allowed(last_kind, last_word):
                j = i + 1
                in_class = False
                closed = -1
                while j < n:
                    c = source[j]
                    if c == "\\":
                        j += 2
                        continue
                    if c == "\n":
                        break
                    if in_class:
                        if c == "]":
                            in_class = False
                    elif c == "[":
                        in_class = True
                    elif c == "/":
                        closed = j
                        break
                    j += 1
                if closed != -1:
                    i = closed + 1
                    while i < n and (source[i].isalnum() or source[i] in "_$"):
                        i += 1
                    last_kind = "word"
                    last_word = ""
                    continue
            last_kind = "/"
            last_word = ""
            i += 1
            continue

        if ch == "{":
            braces.append((i, "{"))
            if top is not None and top[0] == "interp":
                top[1][0] += 1
            last_kind = "{"
            last_word = ""
            i += 1
            continue

        if ch == "}":
            if top is not None and top[0] == "interp":
                if top[1][0] == 0:
                    braces.append((i, "}"))
                    stack.pop()
                    i += 1
                    continue
                top[1][0] -= 1
            braces.append((i, "}"))
            last_kind = "}"
            last_word = ""
            i += 1
            continue

        if ch == "(":
            parens.append((i, "("))
            last_kind = "("
            last_word = ""
            i += 1
            continue

        if ch == ")":
            parens.append((i, ")"))
            last_kind = ")"
            last_word = ""
            i += 1
            continue

        if ch.isalnum() or ch in "_$":
            j = i
            while j < n and (source[j].isalnum() or source[j] in "_$."):
                j += 1
            last_kind = "word"
            last_word = source[i:j]
            i = j
            continue

        if ch in " \t\r\n":
            i += 1
            continue

        if ch in "+-" and last_kind == ch:
            last_kind = ch * 2
            i += 1
            continue
        if ch in "+-":
            last_kind = ch
            i += 1
            continue
        last_kind = ch
        last_word = ""
        i += 1

    if stack:
        warnings.append("unterminated template literal at end of source")
    return {"braces": braces, "parens": parens, "warnings": warnings}


def _pair_events(events: List[Tuple[int, str]]) -> Tuple[Dict[int, int], int]:
    pairs: Dict[int, int] = {}
    stack: List[int] = []
    unmatched = 0
    for idx, ch in events:
        if ch in "{(":
            stack.append(idx)
        else:
            if stack:
                pairs[stack.pop()] = idx
            else:
                unmatched += 1
    return pairs, unmatched


def extract_js_units(source: str) -> List[dict]:
    scan = scan_js(source)
    brace_pairs, unmatched_close = _pair_events(scan["braces"])
    paren_pairs, _ = _pair_events(scan["parens"])
    open_positions = sorted(brace_pairs)
    lines, offsets = _line_offsets(source)

    line_delta = [0] * len(lines)
    for idx, ch in scan["braces"]:
        line_delta[_line_of(offsets, idx)] += 1 if ch == "{" else -1

    def next_open_brace(abs_pos: int) -> Optional[int]:
        k = bisect_right(open_positions, abs_pos - 1)
        return open_positions[k] if k < len(open_positions) else None

    units_map: Dict[str, dict] = {}
    covered_lines: set[int] = set()
    class_stack: List[Tuple[str, int]] = []
    depth = 0

    for line_no, line in enumerate(lines):
        current_class = class_stack[-1][0] if class_stack else ""
        class_m = _JS_CLASS_PATTERN.match(line)
        if class_m:
            name = class_m.group(1)
            open_idx = next_open_brace(offsets[line_no] + class_m.end())
            if open_idx is not None and open_idx in brace_pairs:
                close_idx = brace_pairs[open_idx]
                end_line = _line_of(offsets, close_idx) + 1
                qualified = f"{current_class}.{name}" if current_class else name
                text = source[offsets[line_no] : close_idx + 1]
                units_map.setdefault(qualified, {
                    "unit": qualified,
                    "kind": "class",
                    "line_start": line_no + 1,
                    "line_end": end_line,
                    "sha256": sha256_text(text),
                    "content": text,
                })
                if not current_class:
                    covered_lines.update(range(line_no + 1, end_line + 1))
                class_stack.append((qualified, depth))
            depth += line_delta[line_no]
            continue

        matched = False
        for pattern, is_method_shorthand in (
            (_JS_FUNCTION_PATTERN, False),
            (_JS_ARROW_CONST_PATTERN, False),
            (_JS_METHOD_PATTERN, True),
        ):
            m = pattern.match(line)
            if not m:
                continue
            if is_method_shorthand and not current_class:
                continue
            name = m.group(1)
            if is_method_shorthand and name in _JS_RESERVED:
                continue
            if pattern is _JS_FUNCTION_PATTERN:
                paren_open = offsets[line_no] + (m.end() - 1)
                paren_close = paren_pairs.get(paren_open)
                if paren_close is None:
                    continue
                open_idx = next_open_brace(paren_close + 1)
            else:
                cand = offsets[line_no] + m.end() - 1
                open_idx = cand if cand in brace_pairs else next_open_brace(offsets[line_no] + m.end())
            if open_idx is None or open_idx not in brace_pairs:
                continue
            close_idx = brace_pairs[open_idx]
            end_line = _line_of(offsets, close_idx) + 1
            text = source[offsets[line_no] : close_idx + 1]
            qualified = f"{current_class}.{name}" if (is_method_shorthand and current_class) else name
            units_map.setdefault(qualified, {
                "unit": qualified,
                "kind": "method" if (is_method_shorthand and current_class) else "function",
                "line_start": line_no + 1,
                "line_end": end_line,
                "sha256": sha256_text(text),
                "content": text,
            })
            if not current_class:
                covered_lines.update(range(line_no + 1, end_line + 1))
            matched = True
            break

        depth += line_delta[line_no]
        if matched:
            continue
        while class_stack and depth <= class_stack[-1][1]:
            class_stack.pop()

    top_lines = [
        line for idx, line in enumerate(lines, start=1)
        if idx not in covered_lines and line.strip() and not line.lstrip().startswith("//")
    ]
    if top_lines or not units_map:
        top_content = "".join(top_lines) if top_lines else source
        units_map["<module_top_level>"] = {
            "unit": "<module_top_level>",
            "kind": "module_top_level",
            "line_start": 1,
            "line_end": max(1, len(lines)),
            "sha256": sha256_text(top_content),
            "content": top_content,
        }

    return [units_map[k] for k in sorted(units_map)]


# ---------------------------------------------------------------------------
# Bash / POSIX shell lexical scanner (GUP v5.3 invariant preserved)
# ---------------------------------------------------------------------------

_BASH_WORD_START_PREV = frozenset(" \t\n;|&(){}")
_BASH_CMDPOS_PREV = frozenset("\n;&|)")


def _bash_word_start(source: str, i: int) -> bool:
    return i == 0 or source[i - 1] in _BASH_WORD_START_PREV


def _bash_command_position(source: str, i: int) -> bool:
    j = i - 1
    while j >= 0 and source[j] in " \t":
        j -= 1
    return j < 0 or source[j] in _BASH_CMDPOS_PREV


def _bash_func_decl_name(tokens: list) -> Optional[str]:
    t = tokens[-3:] if len(tokens) >= 3 else tokens[:]
    if len(t) == 3 and t[0][0] == "w" and t[1] == "(" and t[2] == ")":
        return t[0][1]
    if len(t) >= 2 and t[-2][0] == "w" and t[-2][1] == "function" and t[-1][0] == "w":
        return t[-1][1]
    return None


def scan_bash(source: str) -> dict:
    functions: List[Tuple[str, int, int]] = []
    warnings: List[str] = []
    n = len(source)
    i = 0
    stack: list = []
    substack: List[int] = []
    tokens: list = []

    def tok(t):
        tokens.append(t)
        del tokens[:-4]

    while i < n:
        ch = source[i]
        top = stack[-1] if stack else None

        if top is not None:
            kind = top[0]
            if kind == "sq":
                if ch == "'":
                    stack.pop()
                i += 1
                continue
            if kind in ("dq", "bt", "ansi", "locale"):
                if ch == "\\":
                    i += 2
                    continue
                closer = {"dq": '"', "bt": "`", "ansi": "'", "locale": '"'}[kind]
                if ch == closer:
                    stack.pop()
                i += 1
                continue
            if kind == "heredoc":
                delim, dash = top[1], top[2]
                p = i
                closed = False
                while p <= n:
                    e2 = source.find("\n", p)
                    line = source[p:] if e2 == -1 else source[p:e2]
                    stripped = line.lstrip("\t") if dash else line
                    if stripped.rstrip() == delim:
                        closed = True
                        p = n if e2 == -1 else e2 + 1
                        break
                    if e2 == -1:
                        break
                    p = e2 + 1
                if not closed:
                    warnings.append(f"unterminated heredoc {delim!r}")
                    p = n
                stack.pop()
                i = p
                continue
            if kind == "expansion":
                if ch == "}":
                    stack.pop()
                i += 1
                continue

        if ch == "#" and _bash_word_start(source, i):
            j = source.find("\n", i)
            i = n if j == -1 else j
            continue
        if ch == "'":
            stack.append(("sq",))
            i += 1
            continue
        if ch == '"':
            stack.append(("dq",))
            i += 1
            continue
        if ch == "`":
            stack.append(("bt",))
            i += 1
            continue

        if ch == "$" and i + 1 < n:
            nxt = source[i + 1]
            if nxt == "'":
                stack.append(("ansi",))
                i += 2
                continue
            if nxt == '"':
                stack.append(("locale",))
                i += 2
                continue
            if nxt == "{":
                stack.append(("expansion",))
                i += 2
                continue
            if nxt == "(":
                k = i + 1
                while k < n and source[k] == "(":
                    k += 1
                substack.append(k - i - 1)
                tok("sub")
                i = k
                continue
            j = i + 1
            if j < n and (source[j].isalnum() or source[j] == "_"):
                while j < n and (source[j].isalnum() or source[j] == "_"):
                    j += 1
            else:
                j += 1
            tok(("w", source[i:j]))
            i = j
            continue

        if ch == "[" and i + 1 < n and source[i + 1] == "[" and _bash_word_start(source, i):
            stack.append(("dbracket",))
            tok("op")
            i += 2
            continue
        if ch == "]" and i + 1 < n and source[i + 1] == "]" and top is not None and top[0] == "dbracket":
            stack.pop()
            tok("op")
            i += 2
            continue
        if ch == "=" and i + 1 < n and source[i + 1] == "~" and top is not None and top[0] == "dbracket":
            j = i + 2
            while j < n and source[j] in " \t":
                j += 1
            if j < n and source[j] in "'\"":
                i = j
                continue
            while j < n:
                c = source[j]
                if c == "\\" and j + 1 < n:
                    j += 2
                    continue
                if c in " \t\n":
                    break
                if c == "]" and j + 1 < n and source[j + 1] == "]":
                    break
                j += 1
            tok("op")
            i = j
            continue

        if ch == "<" and i + 1 < n and source[i + 1] == "<":
            if i + 2 < n and source[i + 2] == "<":
                i += 3
                tok("op")
                continue
            j = i + 2
            dash = False
            if j < n and source[j] == "-":
                dash = True
                j += 1
            quote = None
            if j < n and source[j] in "'\"":
                quote = source[j]
                j += 1
            k = j
            while k < n and (source[k].isalnum() or source[k] in "_-"):
                k += 1
            delim = source[j:k]
            if quote and k < n and source[k] == quote:
                k += 1
            if not delim:
                i = k if k > i else i + 2
                tok("op")
                continue
            eol = source.find("\n", k)
            if eol == -1:
                warnings.append(f"heredoc {delim!r} has no body")
                i = n
                continue
            stack.append(("heredoc", delim, dash))
            i = eol + 1
            continue

        if ch == "(":
            if substack:
                substack[-1] += 1
            else:
                tok("(")
            i += 1
            continue
        if ch == ")":
            if substack:
                substack[-1] -= 1
                if substack[-1] == 0:
                    substack.pop()
                    tok("sub")
            else:
                tok(")")
            i += 1
            continue

        if ch == "{":
            if _bash_word_start(source, i):
                name = _bash_func_decl_name(tokens)
                if name is not None:
                    stack.append(("function", name, i))
                    tok("sep")
                    i += 1
                    continue
                nxt = source[i + 1] if i + 1 < n else "\n"
                if nxt in " \t\n":
                    stack.append(("group",))
                else:
                    stack.append(("expansion",))
            else:
                stack.append(("expansion",))
            tok("op")
            i += 1
            continue

        if ch == "}":
            if top is not None and top[0] in ("group", "function"):
                if _bash_command_position(source, i):
                    if top[0] == "function":
                        functions.append((top[1], top[2], i))
                    stack.pop()
                    tok("sep")
                    i += 1
                    continue
                i += 1
                continue
            i += 1
            continue

        if ch == "\\":
            i += 2
            continue
        if ch in " \t\r\n":
            if ch == "\n":
                tok("sep")
            i += 1
            continue
        if ch in ";|&":
            tok("sep")
            i += 1
            continue
        if ch.isalnum() or ch in "_-":
            j = i
            while j < n and (source[j].isalnum() or source[j] in "_-"):
                j += 1
            tok(("w", source[i:j]))
            i = j
            continue
        tok("op")
        i += 1

    return {"functions": functions, "warnings": warnings}


def extract_bash_units(source: str) -> List[dict]:
    scan = scan_bash(source)
    lines, offsets = _line_offsets(source)
    units_map: Dict[str, dict] = {}
    covered_lines: set[int] = set()
    ordered = sorted(scan["functions"], key=lambda t: t[1])
    open_stack: List[Tuple[str, int, int]] = []

    for name, open_idx, close_idx in ordered:
        while open_stack and open_stack[-1][2] < open_idx:
            open_stack.pop()
        qualified = f"{open_stack[-1][0]}.{name}" if open_stack else name
        start_line = _line_of(offsets, open_idx) + 1
        end_line = _line_of(offsets, close_idx) + 1
        text = source[offsets[start_line - 1] : close_idx + 1]
        units_map.setdefault(qualified, {
            "unit": qualified,
            "kind": "function",
            "line_start": start_line,
            "line_end": end_line,
            "sha256": sha256_text(text),
            "content": text,
        })
        if not open_stack:
            covered_lines.update(range(start_line, end_line + 1))
        open_stack.append((name, open_idx, close_idx))

    top_lines = [
        line for idx, line in enumerate(lines, start=1)
        if idx not in covered_lines and line.strip() and not line.lstrip().startswith("#")
    ]
    if top_lines or not units_map:
        top_content = "".join(top_lines) if top_lines else source
        units_map["<module_top_level>"] = {
            "unit": "<module_top_level>",
            "kind": "module_top_level",
            "line_start": 1,
            "line_end": max(1, len(lines)),
            "sha256": sha256_text(top_content),
            "content": top_content,
        }

    return [units_map[k] for k in sorted(units_map)]


def extract_generic_units(source: str, path_hint: str = "") -> List[dict]:
    """Fallback for JSON, Markdown, SQL, TOML, YAML, or other text artifacts:
    extracts Markdown headings or top-level JSON keys when structured, plus <file_body>."""
    lines = source.splitlines(keepends=True)
    units: List[dict] = []
    if path_hint.endswith(".json"):
        try:
            obj = json.loads(source)
            if isinstance(obj, dict):
                for k in sorted(obj.keys()):
                    serialized = json.dumps(obj[k], sort_keys=True, separators=(",", ":"))
                    units.append({
                        "unit": f"json.{k}",
                        "kind": "json_key",
                        "line_start": 1,
                        "line_end": max(1, len(lines)),
                        "sha256": sha256_text(serialized),
                        "content": serialized,
                    })
        except Exception:
            pass
    units.append({
        "unit": "<file_body>",
        "kind": "file_body",
        "line_start": 1,
        "line_end": max(1, len(lines)),
        "sha256": sha256_text(source),
        "content": source,
    })
    return units


def detect_language(path: str, source: str) -> str:
    if path.endswith(".py"):
        return "python"
    if path.endswith((".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs")):
        return "js"
    if path.endswith((".sh", ".bash")):
        return "bash"
    first = source.split("\n", 1)[0] if source else ""
    if first.startswith("#!"):
        if "python" in first:
            return "python"
        if "bash" in first or first.endswith("sh") or "zsh" in first:
            return "bash"
        if "node" in first:
            return "js"
    return "generic"


def extract_file_units(rel_path: str, source: str, language: Optional[str] = None, include_top_level: bool = True) -> List[dict]:
    lang = language or detect_language(rel_path, source)
    if lang == "python":
        raw_units = extract_python_units(source)
    elif lang == "js":
        raw_units = extract_js_units(source)
    elif lang == "bash":
        raw_units = extract_bash_units(source)
    else:
        raw_units = extract_generic_units(source, rel_path)

    named_only = [u for u in raw_units if u["unit"] not in ("<module_top_level>", "<file_body>")]
    if not include_top_level and named_only:
        raw_units = named_only

    result = []
    for u in raw_units:
        uid = f"{rel_path}::{u['unit']}" if rel_path else u["unit"]
        result.append({
            "id": uid,
            "path": rel_path,
            "unit": u["unit"],
            "kind": u["kind"],
            "line_start": u["line_start"],
            "line_end": u["line_end"],
            "sha256": u["sha256"],
        })
    return result


def build_repo_manifest(root: Path, rev: Optional[str] = None, paths: Optional[List[str]] = None) -> dict:
    root = root.resolve()
    if rev:
        commit = subprocess.run(
            ["git", "-C", str(root), "rev-parse", f"{rev}^{{commit}}"],
            capture_output=True, text=True, check=True, timeout=30
        ).stdout.strip()
        ls_cmd = ["git", "-C", str(root), "ls-tree", "-r", "--name-only", "-z", commit]
        if paths:
            ls_cmd.extend(["--", *paths])
        tracked = [p for p in subprocess.run(ls_cmd, capture_output=True, text=True, check=True, timeout=30).stdout.split("\0") if p]
    else:
        proc = subprocess.run(["git", "-C", str(root), "rev-parse", "HEAD"], capture_output=True, text=True, check=False, timeout=30)
        commit = proc.stdout.strip() if proc.returncode == 0 else "WORKTREE"
        ls_cmd = ["git", "-C", str(root), "ls-files", "-z"]
        if paths:
            ls_cmd.extend(["--", *paths])
        proc_ls = subprocess.run(ls_cmd, capture_output=True, text=True, check=False, timeout=30)
        if proc_ls.returncode == 0:
            tracked = [p for p in proc_ls.stdout.split("\0") if p]
        else:
            tracked = [
                str(p.relative_to(root))
                for p in sorted(root.rglob("*"))
                if p.is_file() and not any(part in EXCLUDED_DIRS for part in p.relative_to(root).parts)
            ]

    files_manifest = []
    all_units = []
    for rel in sorted(tracked):
        if any(part in EXCLUDED_DIRS for part in Path(rel).parts):
            continue
        if rev:
            blob = subprocess.run(
                ["git", "-C", str(root), "show", f"{commit}:{rel}"],
                capture_output=True, check=True, timeout=30
            ).stdout
        else:
            fpath = root / rel
            if not fpath.is_file():
                continue
            blob = fpath.read_bytes()
        files_manifest.append({
            "path": rel,
            "sha256": sha256_bytes(blob),
            "size_bytes": len(blob),
        })
        try:
            text = blob.decode("utf-8")
        except UnicodeDecodeError:
            all_units.append({
                "id": f"{rel}::<binary_blob>",
                "path": rel,
                "unit": "<binary_blob>",
                "kind": "binary",
                "line_start": 1,
                "line_end": 1,
                "sha256": sha256_bytes(blob),
            })
            continue
        all_units.extend(extract_file_units(rel, text, include_top_level=True))

    return {
        "schema_version": 2,
        "protocol": PROTOCOL,
        "commit": commit,
        "file_count": len(files_manifest),
        "files": files_manifest,
        "unit_count": len(all_units),
        "units": sorted(all_units, key=lambda u: u["id"]),
    }


def compare_manifests(baseline: dict, candidate: dict) -> List[dict]:
    b_map = {u["id"]: u for u in baseline.get("units", [])}
    c_map = {u["id"]: u for u in candidate.get("units", [])}
    rows = []
    for uid in sorted(set(b_map) | set(c_map)):
        bu = b_map.get(uid)
        cu = c_map.get(uid)
        if bu and not cu:
            rows.append({
                "unit_id": uid,
                "path": bu.get("path", ""),
                "classification": "MISSING",
                "baseline_sha256": bu["sha256"],
                "candidate_sha256": None,
            })
        elif cu and not bu:
            rows.append({
                "unit_id": uid,
                "path": cu.get("path", ""),
                "classification": "NEW",
                "baseline_sha256": None,
                "candidate_sha256": cu["sha256"],
            })
        elif bu["sha256"] == cu["sha256"]:
            rows.append({
                "unit_id": uid,
                "path": cu.get("path", ""),
                "classification": "UNCHANGED",
                "baseline_sha256": bu["sha256"],
                "candidate_sha256": cu["sha256"],
            })
        else:
            rows.append({
                "unit_id": uid,
                "path": cu.get("path", ""),
                "classification": "CHANGED",
                "baseline_sha256": bu["sha256"],
                "candidate_sha256": cu["sha256"],
            })
    return rows


def run_selftest() -> int:
    cases = []

    def check(label: str, cond: bool) -> None:
        cases.append((label, bool(cond)))

    def named_set(source: str, lang: str) -> set[str]:
        units = {
            "python": extract_python_units,
            "js": extract_js_units,
            "bash": extract_bash_units,
        }[lang](source)
        return {u["unit"] for u in units if u["unit"] != "<module_top_level>"}

    check(
        "js: apostrophe in line comment stays neutral",
        named_set("function outer() {\n  // don't let this apostrophe change lexical state { }\n  return 1;\n}\nfunction after() { return 2; }\n", "js") == {"outer", "after"},
    )
    check(
        "js: quotes+braces inside a regex literal stay neutral",
        named_set("function clean(s) {\n  return s.replace(/['\"{]foo['\"}]/g, 'x');\n}\n", "js") == {"clean"},
    )
    check(
        "bash: mandate comment example (verbatim) stays neutral",
        named_set("# don't let this apostrophe change lexical state { }\nprobe() {\n  return 0\n}\n", "bash") == {"probe"},
    )
    check(
        "bash: mandate regex example (verbatim) leaks no quote/brace state",
        named_set('check() {\n  [[ "$x" =~ /[\'"{]foo[\'"}]/ ]]\n  return 0\n}\n', "bash") == {"check"},
    )
    # Verify module_top_level prevents zero-unit blindness on functionless files
    top_only = extract_python_units("API_TIMEOUT = 30\nALLOWED_HOSTS = ['localhost']\n")
    check(
        "python: functionless config file emits <module_top_level> unit (no vacuous empty manifest)",
        len(top_only) == 1 and top_only[0]["unit"] == "<module_top_level>",
    )

    failures = [label for label, ok in cases if not ok]
    for label, ok in cases:
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}")
    print(f"\n[4ndr0_hash selftest] {len(cases) - len(failures)}/{len(cases)} passed — {PROTOCOL}")
    return 1 if failures else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repository root for Git/directory mode")
    parser.add_argument("--baseline-rev", help="Baseline Git revision (commit/tag/branch)")
    parser.add_argument("--candidate-rev", help="Candidate Git revision (or omit for working tree / HEAD)")
    parser.add_argument("--baseline-file", help="Single baseline file path")
    parser.add_argument("--candidate-file", help="Single candidate file path")
    parser.add_argument("--manifest-out", help="Write single manifest JSON to path")
    parser.add_argument("--baseline-manifest-out", help="Write baseline manifest JSON to path")
    parser.add_argument("--candidate-manifest-out", help="Write candidate manifest JSON to path")
    parser.add_argument("--comparison-out", help="Write comparison JSON to path")
    parser.add_argument("--selftest", action="store_true", help="Run lexical & top-level invariant battery")
    args = parser.parse_args()

    if args.selftest:
        return run_selftest()

    root = Path(args.root).resolve()

    if args.baseline_file:
        b_path = Path(args.baseline_file)
        b_text = b_path.read_text(encoding="utf-8")
        b_units = extract_file_units(b_path.name, b_text)
        b_manifest = {
            "schema_version": 2,
            "protocol": PROTOCOL,
            "commit": "FILE",
            "file_count": 1,
            "files": [{"path": b_path.name, "sha256": sha256_text(b_text), "size_bytes": len(b_text.encode("utf-8"))}],
            "unit_count": len(b_units),
            "units": b_units,
        }
        if not args.candidate_file:
            out = json.dumps(b_manifest, indent=2, sort_keys=True) + "\n"
            if args.manifest_out:
                Path(args.manifest_out).write_text(out, encoding="utf-8")
            else:
                sys.stdout.write(out)
            return 0
        c_path = Path(args.candidate_file)
        c_text = c_path.read_text(encoding="utf-8")
        c_units = extract_file_units(b_path.name, c_text)
        c_manifest = {
            "schema_version": 2,
            "protocol": PROTOCOL,
            "commit": "FILE",
            "file_count": 1,
            "files": [{"path": c_path.name, "sha256": sha256_text(c_text), "size_bytes": len(c_text.encode("utf-8"))}],
            "unit_count": len(c_units),
            "units": c_units,
        }
    else:
        if not args.baseline_rev:
            manifest = build_repo_manifest(root, rev=args.candidate_rev)
            out = json.dumps(manifest, indent=2, sort_keys=True) + "\n"
            if args.manifest_out:
                Path(args.manifest_out).write_text(out, encoding="utf-8")
            else:
                sys.stdout.write(out)
            return 0
        b_manifest = build_repo_manifest(root, rev=args.baseline_rev)
        c_manifest = build_repo_manifest(root, rev=args.candidate_rev)

    comparison = compare_manifests(b_manifest, c_manifest)
    if args.baseline_manifest_out:
        Path(args.baseline_manifest_out).write_text(json.dumps(b_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    if args.candidate_manifest_out:
        Path(args.candidate_manifest_out).write_text(json.dumps(c_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    summary = {
        "schema_version": 2,
        "protocol": PROTOCOL,
        "baseline_commit": b_manifest["commit"],
        "candidate_commit": c_manifest["commit"],
        "counts": {
            "UNCHANGED": sum(1 for r in comparison if r["classification"] == "UNCHANGED"),
            "CHANGED": sum(1 for r in comparison if r["classification"] == "CHANGED"),
            "NEW": sum(1 for r in comparison if r["classification"] == "NEW"),
            "MISSING": sum(1 for r in comparison if r["classification"] == "MISSING"),
        },
        "comparison": comparison,
    }
    encoded = json.dumps(summary, indent=2, sort_keys=True) + "\n"
    if args.comparison_out:
        Path(args.comparison_out).write_text(encoded, encoding="utf-8")
    else:
        sys.stdout.write(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
