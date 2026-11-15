#!/usr/bin/env node
// Static hygiene + superset gate for chatgptbulk.user.js (no external dependencies).
//
// The INVENTORY below seals every v1.0.0 capability as concrete source markers. The candidate
// must contain all of them (superset rule: omission, regression, or weakening is a CRITICAL
// FAILURE), plus the v1.1.0 hardening markers. Zero stubs or debug leftovers are tolerated.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'chatgptbulk.user.js');
const src = fs.readFileSync(file, 'utf8');
const lines = src.split('\n');
let failed = 0;
const ok = (name) => console.log(`  PASS  ${name}`);
const bad = (name, detail) => { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); };

console.log('static superset guard: chatgptbulk.user.js');

// 1. Syntax (node --check on the exact artifact)
try {
  execFileSync('node', ['--check', file], { stdio: 'pipe' });
  ok('node --check parses the artifact');
} catch (e) {
  bad('node --check parses the artifact', String(e.stderr));
}

// 2. Hygiene: zero stubs, placeholders, debug leftovers
const hygiene = [
  [/\bTODO\b/, 'TODO marker'],
  [/\bFIXME\b/, 'FIXME marker'],
  [/\bXXX\b/, 'XXX marker'],
  [/\bHACK\b/, 'HACK marker'],
  [/\bdebugger\b/, 'debugger statement'],
  [/^\s*(?:\/\/|\*).*\bplaceholder\b/i, 'placeholder stub comment'],
  [/\bplaceholder\s*\(\s*\)/, 'placeholder() stub call'],
  [/\.\.\.\s*$/, 'ellipsis stub line'],
];
for (const [re, label] of hygiene) {
  const hit = lines.findIndex((l) => re.test(l));
  if (hit >= 0) bad(`no ${label}`, `line ${hit + 1}: ${lines[hit].trim().slice(0, 70)}`);
  else ok(`no ${label}`);
}

// 3. Userscript metadata block intact
const meta = [
  '// @name         ChatGPT Bulk Images',
  '// @namespace    local.chatgpt-scripts.easier-image-gen',
  '@version      1.1.0',
  '@match        https://chatgpt.com/*',
  '@grant        none',
  '@run-at       document-idle',
  '@noframes',
  '@license      MIT',
];
for (const m of meta) (src.includes(m) ? ok : bad).call(null, `metadata: ${m.trim()}`);

// 4. Version monotonicity vs the sealed baseline 1.0.0
const v = (src.match(/@version\s+(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
if (v.length === 3 && (v[0] > 1 || (v[0] === 1 && v[1] >= 1))) ok(`version ${v.join('.')} >= 1.1.0`);
else bad('version >= 1.1.0', `found ${v.join('.')}`);

// 5. Sealed v1.0.0 top-level definitions (every unit must still be defined)
const defs = ['TAG', 'STORE_KEY', 'KEEP', 'CURRENT_PROJECT', 'SEL', 'waitFor', 'rel', 'when', 'api',
  'loadVersions', 'loadLimits', 'lockFor', 'rewriteBody', 'setPrompt', 'sendPrompt', 'projectNames',
  'newChat', 'thread', 'textOf', 'pollGallery', 'trackJob', 'loadJSON', 'saveJSON', 'load', 'run',
  'buildUI'];
for (const d of defs) {
  const re = new RegExp(`(?:function\\s+${d}\\s*\\(|const\\s+${d}\\s*=|let\\s+${d}\\s*=)`);
  (re.test(src) ? ok : bad).call(null, `v1.0.0 definition present: ${d}`);
}

// 6. Sealed v1.0.0 feature markers (capability inventory)
const INVENTORY = [
  ['fresh-chat mode option', 'New chat for each image'],
  ['same-chat mode option', 'All in this chat'],
  ['model keep-current default', "'Keep current'"],
  ['composer selectors', 'div.ProseMirror[contenteditable="true"], #prompt-textarea'],
  ['send/stop selectors', 'button[aria-label="Send"], button[data-testid="send-button"]'],
  ['visible-only generating check', "ChatGPT leaves a hidden Stop button"],
  ['project id pattern', '\\/g\\/(g-p-[0-9a-f]{32})'],
  ['conversation id pattern', '\\/c\\/([0-9a-f]{8}-[0-9a-f-]{27})'],
  ['auth session token flow', "'/api/auth/session'"],
  ['token refresh window', '4 * 60_000'],
  ['models endpoint', "'/backend-api/models?history_and_training_disabled=false'"],
  ['limits endpoint', "'/backend-api/conversation/init'"],
  ['image limits feature key', "feature_name === 'image_gen'"],
  ['locked models parse', 'model_limits'],
  ['blocked features notes', 'blocked_features'],
  ['request rewrite target', "path.startsWith('/backend-api/f/conversation')"],
  ['thinking effort rewrite', 'b.thinking_effort = p.effort'],
  ['prompt insertion', "document.execCommand('insertText', false, text)"],
  ['anti-abuse passthrough comment', 'anti-abuse tokens'],
  ['project sidebar scan', 'button[aria-label^="New chat in "]'],
  ['new-chat fallback scan', "b.textContent.trim() === 'New chat'"],
  ['new-chat opened predicate', 'new chat did not open'],
  ['gallery poll cadence', 'setInterval(pollGallery, 4000)'],
  ['thread walk from current_node', 'conv.current_node'],
  ['image asset extraction', "content_type === 'image_asset_pointer'"],
  ['asset pointer strip', "replace(/^[a-z-]+:\\/\\//, '')"],
  ['image download endpoint', '/backend-api/files/download/'],
  ['image-chat end heuristic', 'Image chats never flag their closing message as finished'],
  ['job timeout', "'Timed out after 15 minutes.'"],
  ['settings persistence key', "'bulkimg:settings'"],
  ['settings defaults', "count: 4, mode: 'new', delay: 3"],
  ['settings mode sanitizer', "s.mode !== 'same' && s.mode !== 'new'"],
  ['count clamp', 'Math.max(1, Math.min(50'],
  ['delay clamp', 'Math.max(0, parseFloat'],
  ['empty prompt guard', "'Enter a prompt first.'"],
  ['lock refusal + force', 'Send anyway'],
  ['lock refusal message', 'is locked until'],
  ['image limit refusal', 'Image limit reached'],
  ['limit capping', "that's all the image limit allows"],
  ['same-mode always waits', "s.mode === 'same' || s.wait"],
  ['post-send limit recheck', 'Image limit reached after'],
  ['run status strings', 'Done: sent ${count} prompts'],
  ['stopped status', "'Stopped.'"],
  ['project target resolution', 'CURRENT_PROJECT'],
  ['project by-name then by-id', 'later chats return to the project by id'],
  ['shadow DOM isolation', 'attachShadow({ mode: \'open\' })'],
  ['shadow reset', ':host { all: initial; }'],
  ['panel z-order', 'z-index:2147483646'],
  ['fab button', "title=\"Bulk images\""],
  ['gallery grid', 'grid-template-columns: repeat(3, 1fr)'],
  ['pending spinner tile', 'class="spin"'],
  ['failed tile with note', 'No image'],
  ['lightbox open chat', 'id="lbChat"'],
  ['lightbox download', 'id="lbDl"'],
  ['lightbox close + escape', "e.key === 'Escape'"],
  ['clear gallery', 'id="clearGal"'],
  ['gallery counter', 'galTitle'],
  ['limits refresh button', 'id="refreshLimits"'],
  ['stop button label', 'Stopping after the current one'],
  ['keyboard isolation', 'e.stopPropagation()'],
  ['ctrl/cmd+enter run', '(e.metaKey || e.ctrlKey)'],
  ['SPA re-attach', 'setInterval(attach, 2000)'],
  ['limits render fallback', 'Could not load limits'],
  ['no models locked row', 'No models locked'],
  ['images left row', 'Images left:'],
];
for (const [name, marker] of INVENTORY) {
  (src.includes(marker) ? ok : bad).call(null, `v1.0.0 feature: ${name}`);
}

// 7. v1.1.0 hardening markers (the Round 1 fixes must all be present)
const HARDENING = [
  ['double-injection guard', 'window.__bulkimgLoaded'],
  ['embedded version fallback', "const VERSION = '1.1.0'"],
  ['html escaping helper', "const esc = (s) =>"],
  ['escaped limits rendering', 'esc(m.slug)'],
  ['invalid-date guard', 'Invalid Date'],
  ['null-safe reset composition', 'resets = (iso)'],
  ['session token guard', 'not signed in'],
  ['execCommand fallback', "new InputEvent('input'"],
  ['stop honored pre-send', 'Stop was pressed before this prompt went out'],
  ['stop honored during composer wait', 'Stop pressed while the composer was still settling'],
  ['cycle-safe thread walk', 'const seen = new Set()'],
  ['poll catch-all', 'gallery poll error'],
  ['per-job isolation', 'poll failed for job #'],
  ['tail-of-matching selection', 'matchIdx.length >= convJobs.length'],
  ['preset-less version fallback', '{ model: ver.slugs[0], effort: null }'],
  ['model-only lock detection', 'Model-only choice'],
  ['render suppression snapshot', 'galSnap'],
  ['collision-free downloads', 'job.images.indexOf(img) + 1'],
  ['no stacked hosts', "getElementById('bulkimg-host')"],
];
for (const [name, marker] of HARDENING) {
  (src.includes(marker) ? ok : bad).call(null, `v1.1.0 hardening: ${name}`);
}

console.log(failed ? `\nSTATIC GUARD: ${failed} failure(s)` : '\nSTATIC GUARD: PASS (superset intact, zero stubs)');
process.exit(failed ? 1 : 0);
