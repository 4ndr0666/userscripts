#!/usr/bin/env node
// ═════════════════════════════════════════════════════════════════════════════
// tools/style-audit.mjs — 3LECTRIC-GLASS UNIVERSALITY GATE (Gate E)
// ─────────────────────────────────────────────────────────────────────────────
// Enforces the 4ndr0666OS styling spec (resources/3lectric_6lass-spec.md) and
// the Ψ branding glyph across every dist installable:
//
//   · UI scripts    → Electric-Cyan anchor + Glass base anchor + JetBrains Mono
//                     lead font + 150ms transitions + Ψ runtime branding
//   · banner-class  → Ψ runtime branding (no painted surface of their own)
//   · foreign font leads (Roboto Mono / Consolas / Arial / Segoe UI / …) FAIL
//
// Anti-self-deception: all anchors are tested against COMMENT-STRIPPED source
// (string-aware stripper — CSS lives inside strings, comments cannot satisfy
// the gate). @icon metadata and console.debug styling are exempt (metadata /
// non-rendered surfaces). Calibration references: Prompt Master, Stream
// Interceptor, AutoTranslate, Bunkr++.
// Fail-closed: exit 1 on any FAIL. Wired into npm run check.
// ═════════════════════════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// ── string-aware comment stripper ─────────────────────────────────────────────
function stripComments(src) {
  let out = '', i = 0, mode = 'normal';
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (mode === 'normal') {
      if (c === '/' && d === '/')      { mode = 'line';   out += '  '; i += 2; continue; }
      if (c === '/' && d === '*')      { mode = 'block';  out += '  '; i += 2; continue; }
      if (c === "'")                   { mode = 'single'; out += c;   i++;    continue; }
      if (c === '"')                   { mode = 'double'; out += c;   i++;    continue; }
      if (c === '`')                   { mode = 'tpl';    out += c;   i++;    continue; }
      out += c; i++; continue;
    }
    if (mode === 'line')  { if (c === '\n') { mode = 'normal'; out += c; } i++; continue; }
    if (mode === 'block') {
      if (c === '*' && d === '/') { mode = 'normal'; out += '  '; i += 2; }
      else { out += c === '\n' ? '\n' : ' '; i++; }
      continue;
    }
    // inside a string literal
    if (c === '\\') { out += c + (d ?? ''); i += 2; continue; }
    if ((mode === 'single' && c === "'") || (mode === 'double' && c === '"') ||
        (mode === 'tpl' && c === '`')) { mode = 'normal'; }
    out += c; i++;
  }
  return out;
}

// ── spec anchors (tested against comment-stripped source) ────────────────────
const RE = {
  cyan:   /#00E5FF|0,?\s*229,?\s*255/i,
  glass:  /rgba\(\s*10,\s*19,\s*26/i,
  psi:    /\u03A8/,
  trans:  /150ms|\.15s\b/,
  jbm:    /['"]JetBrains Mono['"]/,
};

// foreign font LEADS (spec: JetBrains Mono data · Orbitron 700 display).
// WO-01 round-2 (6-a F01): 'Cinzel Decorative' REMOVED from this list — it
// is the suite's own brand-glyph typeface: kernel/brand.js renders the Ψ
// core in "Cinzel Decorative, serif" and kernel-smoke machine-asserts
// exactly that ("brand: glyphNode Ψ core with Cinzel glyph font"); Prompt
// Master loads the real WOFF2 for the flow-dock brand surface. A list that
// flags the suite's own identity font is a list error — the round-1 list
// carried it only because the lead detector below was dead and could never
// fire on anything.
const FOREIGN_FONTS = [
  'Roboto Mono', 'Consolas', 'Arial Black', 'Segoe UI', 'Inter',
  'Helvetica', 'Verdana', 'Tahoma', 'Ubuntu', 'Menlo', 'Fira Code',
  'Cascadia Mono', 'DejaVu Sans', 'Noto Sans',
];

// lines exempt from font/paint scanning: @icon data-URIs + console styling
const EXEMPT_LINE = /@icon\s+data:image|console\.(log|debug|info|warn|error)|%c/;

function auditFile(name, raw) {
  const stripped = stripComments(raw);
  const lines = stripped.split('\n');

  let cssDecls = 0, paints = 0;
  const fontLines = [];
  /* WO-01 round-5 (5-a F06 / 4-a F07 leftover): multi-line @font-face blocks —
   * enter on `@font-face … {` with no same-line `}`, exit on the closing `}`;
   * family DEFINITIONS inside are not usage leads. Zero live in the corpus
   * (PM's is single-line), but the exemption is now shape-correct. */
  let inFontFaceBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const exempt = EXEMPT_LINE.test(L);
    if (!exempt) {
      cssDecls += (L.match(/[a-z-]+\s*:\s*[^;{}]+;/g) || []).length;
      paints += (L.match(/(?:color|background|font-family)\s*:/g) || []).length;
      /* WO-01 round-2 (6-a F01): the round-1 alternation
       * `/(?:font-family|font\s*:)\s*([^;]+)/` never consumed the colon for
       * the font-family branch — the captured value STARTED with ":", so
       * every startsWith(...) lead test was dead on arrival and NO
       * font-family declaration could ever fail (a false-certification
       * vector: quoted 'Roboto Mono' leads shipped in dist). The detector
       * now: (1) consumes the colon in BOTH branches; (2) matches leads
       * QUOTED OR UNQUOTED (the old value-side /['"] quote requirement
       * made unquoted Consolas leads invisible); (3) extracts the family
       * list from `font:` SHORTHAND declarations (size/line-height precede
       * the family — the lead test must run on the family part, not on
       * "11px/1.25 Consolas"); (4) skips @font-face FAMILY DEFINITIONS
       * (a definition is not a usage lead — the usage line is the one that
       * matters). */
      if (/@font-face/.test(L) && !/\}/.test(L)) inFontFaceBlock = true;
      else if (inFontFaceBlock && /\}/.test(L)) inFontFaceBlock = false;
      if (!/@font-face/.test(L) && !inFontFaceBlock) {
        const mFam = L.match(/font-family\s*:\s*([^;]+)/i);
        const mShort = L.match(/\bfont\s*:\s*([^;]+)/i);
        if (mFam) fontLines.push({ line: i + 1, decl: mFam[1].trim(), prop: 'font-family' });
        else if (mShort) {
          /* strip the shorthand's style/variant/weight/size[/lh] prefix —
           * the family list is what follows the last metric token. */
          const family = mShort[1].trim()
            .replace(/^[^,]*?(?:\d+(?:\.\d+)?(?:px|pt|em|rem|%|vh|vw|ch|ex|q|mm|cm|in)?(?:\s*\/\s*\d+(?:\.\d+)?(?:px|pt|em|rem|%|vh|vw|ch|ex|q|mm|cm|in)?)?)\s+/i, '');
          fontLines.push({ line: i + 1, decl: family.trim(), prop: 'font' });
        }
      }
    }
  }

  // UI = injects a stylesheet body AND paints visuals (functional-only CSS
  // like display:none paywall hiding = banner class, not a branded surface)
  const injects = /GM_addStyle|<style|\.textContent\s*=|cssText\s*=|insertRule|STYLE_TEXT|createElement\(['"]style['"]\)/.test(stripped);
  const hasUI = cssDecls >= 8 && injects && paints >= 3;

  const gaps = [];
  if (hasUI) {
    if (!RE.cyan.test(stripped))  gaps.push('electric-cyan anchor (#00E5FF) missing');
    if (!RE.glass.test(stripped)) gaps.push('glass base rgba(10,19,26,α) missing');
    if (!RE.jbm.test(stripped))   gaps.push('JetBrains Mono data font missing');
    if (!RE.trans.test(stripped)) gaps.push('150ms ease-in-out transitions missing');
  }
  // Ψ runtime branding: @icon metadata (a comment) is stripped with comments;
  // banners and UI text are strings and survive.
  if (!RE.psi.test(stripped)) gaps.push('Ψ branding glyph absent from runtime surfaces');

  const foreign = [];
  /* WO-01 round-2 (6-a F01): lead extraction is now positional + normalized —
   * first comma-separated family token, quotes AND escape backslashes
   * stripped, case-insensitive — so `font-family: 'Roboto Mono', monospace`,
   * `font: 11px/1.25 Consolas, monospace`, and escaped \'…\' variants all
   * resolve to the same lead, while JBM-lead lists with foreign FALLBACKS
   * (Akasha, Prompt Master) stay legal: only the LEAD fails. */
  const leadOf = (familyList) => {
    const first = String(familyList).split(',')[0].trim();
    return first.replace(/^[\\'"]+|[\\'"]+$/g, '').trim().toLowerCase();
  };
  for (const fl of fontLines) {
    const lead = leadOf(fl.decl);
    for (const f of FOREIGN_FONTS) {
      if (lead === f.toLowerCase()) {
        foreign.push(`${f} (${fl.prop} lead, line ${fl.line})`);
      }
    }
  }
  if (foreign.length) gaps.push(`foreign font lead: ${[...new Set(foreign)].join(', ')}`);

  return { name, hasUI, gaps };
}

const files = readdirSync(DIST).filter(f => f.endsWith('.user.js')).sort();
if (!files.length) { console.error('style-audit: no dist files (run build first)'); process.exit(1); }

const results = files.map(f => auditFile(f, readFileSync(join(DIST, f), 'utf8')));
let fails = 0;
console.log('── 3lectric-Glass universality audit ──────────────────────────────');
for (const r of results) {
  if (r.gaps.length === 0) {
    console.log(`  ✓ ${r.name}${r.hasUI ? '' : '  [banner class]'}`);
  } else {
    fails++;
    console.log(`  ✗ ${r.name}${r.hasUI ? '' : '  [banner class]'}`);
    for (const g of r.gaps) console.log(`      · ${g}`);
  }
}
console.log('───────────────────────────────────────────────────────────────────');
if (fails) {
  console.log(`STYLE AUDIT: ${fails} FAIL (${files.length - fails}/${files.length} pass)`);
  process.exit(1);
}
console.log(`STYLE AUDIT: ALL PASS (${files.length}/${files.length})`);
