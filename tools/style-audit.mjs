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

// foreign font LEADS (spec: JetBrains Mono data · Orbitron 700 display)
const FOREIGN_FONTS = [
  'Roboto Mono', 'Consolas', 'Arial Black', 'Segoe UI', 'Inter', 'Cinzel Decorative',
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
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const exempt = EXEMPT_LINE.test(L);
    if (!exempt) {
      cssDecls += (L.match(/[a-z-]+\s*:\s*[^;{}]+;/g) || []).length;
      paints += (L.match(/(?:color|background|font-family)\s*:/g) || []).length;
      const m = L.match(/(?:font-family|font\s*:)\s*([^;]+)/i);
      if (m && /['"]/.test(m[1])) fontLines.push({ line: i + 1, decl: m[1].trim() });
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
  for (const fl of fontLines) {
    for (const f of FOREIGN_FONTS) {
      if (fl.decl.startsWith(`'${f}'`) || fl.decl.startsWith(`"${f}"`) ||
          fl.decl.startsWith(`\\'${f}'`) || fl.decl.startsWith(`\\"${f}"`)) {
        foreign.push(`${f} (line ${fl.line})`);
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
