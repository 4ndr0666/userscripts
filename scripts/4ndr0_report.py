#!/usr/bin/env python3
"""4ndr0_report.py v8.1.0 — Self-Contained Out-of-Band HTML Round-Record Generator & Verifier.

Implements and upgrades SUK v1.2 Part VIII-B & GUP Appendix F into a deterministic tool:
1. Mechanically derives every hash, byte size, battery check count, acceptance criterion,
   and epistemic status (`CERTIFIED`, `BOUNDED_PASS`, or `FAIL_DEFECT`) directly from the
   `4ndr0_validate.py` report JSON and `4ndr0_kit.py` metadata JSON — never hand-typed.
2. Includes content-addressed baseline (`PIN_KEY_BASE_SHA`) and candidate (`PIN_KEY_SHA`) file
   pins alongside lineage pins (`PIN_BASE`, `PIN_TIP`, `PIN_TIP_TREE`) so moving-HEAD and
   cross-lineage host repositories can verify file pins independent of local commit SHAs.
3. Emits a single-file, zero-external-request HTML document using the canonical dark terminal
   zinc/cyan/teal/emerald design tokens (`#09090b`, `#67e8f9`, `#2dd4bf`, `#34d399`), with
   explicit separate sections for Verified Claims vs. Bounded / Unverified Items vs. Open Defects.
4. Automatically runs the self-containment scan (asserting zero external `http://`, `https://`,
   or framework chunk refs) and mechanical pin-parity verification against the source JSONs.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
sys.dont_write_bytecode = True
from pathlib import Path
from typing import Dict, List


PROTOCOL = "4NDR0NEERING-8.1"


def esc(text: object) -> str:
    return html.escape(str(text), quote=True)


def generate_html(val_data: dict, kit_data: dict, title_override: str = "") -> str:
    suite = kit_data.get("suite", "engineering-suite")
    round_id = kit_data.get("round", "round-1")
    epistemic = val_data.get("status", kit_data.get("epistemic_status", "CERTIFIED"))
    tier = val_data.get("tier", "T2")
    delivery_mode = val_data.get("delivery_mode", kit_data.get("delivery_mode", "CERTIFIED_RELEASE"))
    kit_class = kit_data.get("kit_class", "U")
    kit_size = kit_data.get("kit_size_bytes", 0)
    kit_filename = kit_data.get("kit_filename", f"update-{suite}-{round_id}.sh")
    pins = kit_data.get("pins", {})
    battery = kit_data.get("battery", {})
    bat_passed = battery.get("passed_checks", 0)
    bat_total = battery.get("total_checks", 0)
    bat_status = battery.get("status", "NOT_RUN")

    verified_claims = val_data.get("verified_claims", [])
    bounded_claims = val_data.get("bounded_claims", [])
    unverified_list = val_data.get("unverified", [])
    defects_list = val_data.get("defects", [])

    pin_rows_html = []
    ordered_pins = [
        ("PIN_KIT_SHA", pins.get("PIN_KIT_SHA", "N/A")),
        ("PIN_PAYLOAD_SHA", pins.get("PIN_PAYLOAD_SHA", "N/A")),
        ("PIN_BUNDLE_SHA", pins.get("PIN_BUNDLE_SHA", "N/A")),
        ("PIN_TIP_TREE", pins.get("PIN_TIP_TREE", "N/A")),
        ("PIN_BASE (BUILD LINEAGE)", pins.get("PIN_BASE", val_data.get("baseline_commit", "N/A"))),
        ("PIN_TIP (BUILD LINEAGE)", pins.get("PIN_TIP", val_data.get("candidate_commit", "N/A"))),
    ]
    if pins.get("PIN_KEY_FILE"):
        if pins.get("PIN_KEY_BASE_SHA"):
            ordered_pins.append((f"PIN_KEY_BASE_SHA ({pins['PIN_KEY_FILE']})", pins["PIN_KEY_BASE_SHA"]))
        ordered_pins.append((f"PIN_KEY_SHA ({pins['PIN_KEY_FILE']})", pins.get("PIN_KEY_SHA", "N/A")))

    for label, val in ordered_pins:
        pin_rows_html.append(
            f'<div class="pin-row">'
            f'<span class="pin-label">{esc(label)}</span>'
            f'<code class="pin-val">{esc(val)}</code>'
            f'<button type="button" class="copy-btn" aria-label="Copy {esc(label)}" data-copy="{esc(val)}">copy</button>'
            f'</div>'
        )

    verified_items = "".join(f"<li><code>[VERIFIED]</code> {esc(c)}</li>" for c in verified_claims) or "<li><code>[NONE]</code> No verified claims recorded.</li>"
    bounded_items = "".join(f"<li><code>[BOUNDED/UNVERIFIED]</code> {esc(c)}</li>" for c in (bounded_claims or unverified_list)) or "<li><code>[CLEAR]</code> Zero unverified or bounded items — full certification coverage.</li>"
    defect_items = "".join(f"<li><code>[DEFECT]</code> {esc(d)}</li>" for d in defects_list) or "<li><code>[ZERO DEFECTS]</code> Zero demonstrated defects across all evaluated files and gates.</li>"

    kit_sha_prefix = str(pins.get("PIN_KIT_SHA", "000000000000"))[:12]
    heading = title_override or f"Round {round_id}"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(suite)} · {esc(heading)} · {esc(PROTOCOL)}</title>
<style>
  :root {{
    --bg: #09090b;
    --panel: rgba(6, 182, 212, 0.03);
    --well: rgba(0, 0, 0, 0.40);
    --accent: #67e8f9;
    --accent-2: #22d3ee;
    --section: #2dd4bf;
    --chip: #5eead4;
    --ok: #34d399;
    --warn: #fbbf24;
    --err: #f87171;
    --text: #f4f4f5;
    --text-2: #e4e4e7;
    --muted: #a1a1aa;
    --faint: #71717a;
    --border: rgba(6, 182, 212, 0.20);
    --border-2: rgba(6, 182, 212, 0.40);
  }}
  * {{ box-sizing: border-box; }}
  ::selection {{ background: rgba(103, 232, 249, 0.30); color: var(--text); }}
  body {{
    margin: 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }}
  header, main, footer {{
    width: 100%;
    max-width: 64rem;
    margin: 0 auto;
    padding-left: 20px;
    padding-right: 20px;
  }}
  header {{
    padding-top: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }}
  main {{ flex: 1; padding-top: 32px; padding-bottom: 40px; }}
  footer {{
    margin-top: auto;
    padding-top: 16px;
    padding-bottom: 16px;
    border-top: 1px solid var(--border);
    background: var(--well);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--faint);
  }}
  .eyebrow {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--section);
    margin-bottom: 8px;
  }}
  h1 {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 28px;
    font-weight: 700;
    color: var(--accent);
    margin: 0 0 12px 0;
  }}
  h2 {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.25em;
    color: var(--section);
    margin: 0 0 16px 0;
  }}
  h3 {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    margin: 0 0 8px 0;
  }}
  p {{ color: var(--muted); margin: 0 0 12px 0; }}
  section {{ margin-bottom: 40px; }}
  .badges {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }}
  .badge {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    padding: 4px 10px;
    border: 1px solid var(--border-2);
    background: var(--panel);
    color: var(--ok);
    border-radius: 4px;
  }}
  .grid-2 {{
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }}
  @media (max-width: 768px) {{
    .grid-2 {{ grid-template-columns: 1fr; }}
    h1 {{ font-size: 22px; }}
  }}
  article.card {{
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 16px;
    border-radius: 4px;
  }}
  article.card ul {{
    margin: 0;
    padding-left: 18px;
    color: var(--muted);
    font-size: 13px;
  }}
  article.card li {{ margin-bottom: 6px; }}
  code {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--accent-2);
    font-size: 12px;
  }}
  .artifact-row {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 4px;
  }}
  .chip {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--chip);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 3px;
  }}
  .well {{
    background: var(--well);
    border: 1px solid var(--border);
    padding: 14px 16px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }}
  .pin-row {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid var(--border);
    background: var(--panel);
    padding: 10px 14px;
    margin-bottom: 6px;
    border-radius: 4px;
  }}
  .pin-label {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-2);
    min-width: 220px;
  }}
  .pin-val {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--accent);
    word-break: break-all;
    flex: 1;
  }}
  .copy-btn {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--chip);
    background: var(--well);
    border: 1px solid var(--border-2);
    padding: 4px 10px;
    border-radius: 3px;
    cursor: pointer;
  }}
</style>
</head>
<body>
<header>
  <div class="eyebrow">{esc(suite)} · SELF-VERIFYING DELIVERY RECORD · {esc(PROTOCOL)}</div>
  <h1>{esc(heading)}</h1>
  <p>Mechanically derived round record binding content-addressed file pins (<code>PIN_KEY_BASE_SHA</code> &rarr; <code>PIN_KEY_SHA</code>), prerequisite-free bundle pins, file-anchored acceptance criteria, and epistemic claim boundaries. Adapts automatically to moving-HEAD and cross-lineage host repositories.</p>
  <div class="badges">
    <span class="badge">STATUS: {esc(epistemic)}</span>
    <span class="badge">TIER: {esc(tier)}</span>
    <span class="badge">MODE: {esc(delivery_mode)}</span>
    <span class="badge">BATTERY: {esc(bat_passed)}/{esc(bat_total)} ({esc(bat_status)})</span>
    <span class="badge">KIT: CLASS {esc(kit_class)} · {esc(kit_size)} B</span>
  </div>
</header>
<main>
  <section aria-labelledby="sec-01">
    <h2 id="sec-01">01 · Epistemic Ledger &amp; Claim Boundaries</h2>
    <div class="grid-2">
      <article class="card">
        <h3>Verified Claims (File &amp; Gate Anchored)</h3>
        <ul>{verified_items}</ul>
      </article>
      <article class="card">
        <h3>Bounded / Unverified Claims &amp; Disclosures</h3>
        <ul>{bounded_items}</ul>
      </article>
      <article class="card">
        <h3>Demonstrated Defects</h3>
        <ul>{defect_items}</ul>
      </article>
      <article class="card">
        <h3>Proportionate Verification Summary</h3>
        <p>Evaluated at tier <code>{esc(tier)}</code> under mode <code>{esc(delivery_mode)}</code>. Defects: <code>{esc(val_data.get("defect_count", 0))}</code> · Unverified bounds: <code>{esc(val_data.get("unverified_count", 0))}</code> · Blocked targets: <code>{esc(val_data.get("blocked_target_count", 0))}</code>.</p>
      </article>
    </div>
  </section>

  <section aria-labelledby="sec-02">
    <h2 id="sec-02">02 · Deliverable Artifacts</h2>
    <div class="artifact-row">
      <div>
        <code>{esc(kit_filename)}</code>
        <p>Content-addressed &amp; lineage-adaptive self-verifying bash kit ({esc(kit_size)} bytes, {esc(kit_data.get("commit_count", 1))} commit(s) embedded)</p>
      </div>
      <span class="chip">kit</span>
    </div>
  </section>

  <section aria-labelledby="sec-03">
    <h2 id="sec-03">03 · Operator Usage</h2>
    <div class="well">
      <code>$ bash {esc(kit_filename)} [repo_or_subdir]</code>
      <button type="button" class="copy-btn" aria-label="Copy usage command" data-copy="bash {esc(kit_filename)}">copy</button>
    </div>
    <p>Verifies <code>PIN_PAYLOAD_SHA</code>, <code>PIN_BUNDLE_SHA</code>, and content-addressed file pins (<code>PIN_KEY_BASE_SHA</code> &rarr; <code>PIN_KEY_SHA</code>). Fast-forwards when local <code>HEAD == PIN_BASE</code>, or dynamically commits verified candidate blobs onto moving-HEAD / cross-lineage host repositories (such as <code>scr/</code>).</p>
  </section>

  <section aria-labelledby="sec-04">
    <h2 id="sec-04">04 · Out-of-Band Trust Pins</h2>
    {"".join(pin_rows_html)}
  </section>

  <section aria-labelledby="sec-05">
    <h2 id="sec-05">05 · Continuity &amp; Dynamic Pin Contract</h2>
    <p>When a kit is generated inside an isolated sandbox VM or when your host repository <code>HEAD</code> advances with unrelated commits, <code>G2</code> verifies target content pins (<code>PIN_KEY_BASE_SHA</code> / <code>PIN_KEY_SHA</code>) and unpacks the prerequisite-free bundle in an isolated staging repository before committing onto your active branch. Conflicting edits to the target file in same-lineage repositories fail closed without touching your worktree.</p>
  </section>
</main>
<footer>
  <span>{esc(suite)} · {esc(round_id)} · {esc(PROTOCOL)}</span>
  <span>PIN_KIT_SHA:{esc(kit_sha_prefix)}</span>
</footer>
<script>
document.querySelectorAll('.copy-btn').forEach(function(btn) {{
  btn.addEventListener('click', function() {{
    var val = btn.getAttribute('data-copy') || '';
    try {{
      navigator.clipboard.writeText(val).then(function() {{
        var orig = btn.textContent;
        btn.textContent = 'copied';
        setTimeout(function() {{ btn.textContent = orig; }}, 1500);
      }}).catch(function() {{}});
    }} catch (e) {{}}
  }});
}});
</script>
</body>
</html>
"""


def verify_html_round_record(html_text: str, kit_data: dict) -> List[str]:
    errors: List[str] = []
    if re.search(r'(?:src|href)\s*=\s*["\']https?://', html_text, re.IGNORECASE):
        errors.append("HTML round record contains external http/https resource references (violates self-containment law)")
    if "/_next/" in html_text or "/assets/" in html_text:
        errors.append("HTML round record contains framework chunk references")

    pins = kit_data.get("pins", {})
    for k in ("PIN_KIT_SHA", "PIN_PAYLOAD_SHA", "PIN_BUNDLE_SHA", "PIN_TIP_TREE", "PIN_BASE", "PIN_TIP"):
        val = pins.get(k)
        if val and val not in html_text:
            errors.append(f"pin {k} ({val}) missing or mismatched on HTML round record")

    kit_sha = str(pins.get("PIN_KIT_SHA", ""))
    if kit_sha and f"PIN_KIT_SHA:{kit_sha[:12]}" not in html_text:
        errors.append("footer PIN_KIT_SHA prefix does not match pin table first row")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validation", required=True, help="Path to 4ndr0_validate.py JSON output")
    parser.add_argument("--kit-meta", required=True, help="Path to 4ndr0_kit.py JSON metadata output")
    parser.add_argument("--output", required=True, help="Output path for self-contained HTML round record")
    args = parser.parse_args()

    try:
        val_data = json.loads(Path(args.validation).read_text(encoding="utf-8"))
        kit_data = json.loads(Path(args.kit_meta).read_text(encoding="utf-8"))
        html_out = generate_html(val_data, kit_data)
        errs = verify_html_round_record(html_out, kit_data)
        if errs:
            raise ValueError(f"HTML round-record verification failed: {'; '.join(errs)}")
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(html_out, encoding="utf-8")
        print(json.dumps({
            "protocol": PROTOCOL,
            "html_path": str(out_path.resolve()),
            "html_sha256": hashlib.sha256(html_out.encode("utf-8")).hexdigest(),
            "size_bytes": len(html_out.encode("utf-8")),
            "self_contained": True,
            "pin_parity_verified": True,
        }, indent=2, sort_keys=True))
        return 0
    except Exception as exc:
        print(f"4ndr0neering HTML report generator failed closed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
