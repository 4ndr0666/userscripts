# 4ndr0666tools — Script Documentation Index

> 38 installables · every script in [`dist/`](../dist/) has coinciding docs here.
> Regenerate after any bump: `npm run docs` (versions, keymaps, scopes and lineage are read live from the repo).

| Script | Version | Family | Kernel Boundary | Docs |
|---|---|---|---|---|
| **4ndr0Purge** | `1.0.2` | privacy & security | kernel-free | [reference](./4ndr0purge/) |
| **4ndr0serviceguard Companion** | `7.4.1` | privacy & security | kernel-free | [reference](./4ndr0serviceguard-companion/) |
| **Akasha Silence** | `5.2.2` | privacy & security | typeof-guarded (NetHook) | [reference](./akasha-silence/) |
| **AlwaysNewWindow** | `1.0.2` | ux utilities | kernel-free | [reference](./alwaysnewwindow/) |
| **AutoTranslate** | `6.0.0` | ux utilities | kernel-free | [reference](./autotranslate/) |
| **Blob2URL** | `7.3.0` | media & links | typeof-guarded + gmFetch fallback | [reference](./blob2url/) |
| **Bunkr++** | `7.7.0` | media & links | typeof-guarded + gmFetch fallback | [devlog](./bunkr/) |
| **Bypass Paywalls** | `0.1.7` | privacy & security | kernel-free | [reference](./bypass-paywalls/) |
| **Confirmation Bypass** | `4.0.4` | forums | kernel-free | [reference](./confirmation-bypass/) |
| **Filester++** | `7.6.1` | media & links | typeof-guarded (NetHook) | [reference](./filester/) |
| **Forum Link Xtractor** | `3.2.3` | forums | kernel-free | [reference](./forum-link-xtractor/) |
| **Forums++** | `1.11.1` | forums | typeof-guarded + gmFetch fallback | [reference](./forums/) |
| **GoFile++** | `2.2.0` | media & links | typeof-guarded + gmFetch fallback | [reference](./gofile/) |
| **GooglePhotosandDrive++** | `8.1.1` | images | typeof-guarded + gmFetch fallback | [reference](./gphotos-drive/) |
| **Hailuo++** | `6.0.2` | sovereign platforms | kernel-free | [devlog](./hailuo++/) |
| **HostWarp** | `1.1.5` | ux utilities | build-module (6-kernel) | [reference](./hostwarp/) |
| **Images++** | `4.0.4` | images | kernel-free | [reference](./images/) |
| **Instagram++** | `13.2.2` | sovereign platforms | typeof-guarded + gmFetch fallback | [reference](./instagram/) |
| **LinkMasterΨ** | `6.3.3` | media & links | typeof-guarded (NetHook) | [reference](./linkmaster/) |
| **Login Form Autofiller** | `2.0.5` | ux utilities | kernel-free | [reference](./login-form-autofiller/) |
| **Maximize_Any_Media** | `2.0.1` | video & players | kernel-free | [reference](./maximize-any-media/) |
| **Media Player Controller** | `8.1.3` | video & players | kernel-free | [reference](./media-player-controller/) |
| **ModelSearch** | `4.0.3` | forums | kernel-free | [reference](./modelsearch/) |
| **PageCraft** | `1.1.3` | ux utilities | build-module (5-kernel) | [reference](./pagecraft/) |
| **Pixeldrain++** | `1.2.2` | media & links | typeof-guarded + gmFetch fallback | [reference](./pixeldrain/) |
| **Prompt Master** | `28.8.0` | sovereign platforms | typeof-guarded + gmFetch fallback | [reference](./prompt-master/) |
| **Recon** | `9.1.1` | privacy & security | typeof-guarded (NetHook) | [reference](./recon/) |
| **Redgifs++** | `5.3.2` | video & players | kernel-free | [reference](./redgifs/) |
| **Stream Interceptor** | `3.3.0` | media & links | typeof-guarded (NetHook) | [reference](./stream-interceptor/) |
| **Watermark++** | `2.1.1` | sovereign platforms | typeof-guarded (NetHook) | [reference](./watermark/) |
| **Website Control Panel** | `5.3.1` | ux utilities | kernel-free | [reference](./website-control-panel/) |
| **YT Filter** | `2.5` | video & players | kernel-free | [reference](./yt-filter/) |
| **Yandex Image Search++** | `0.4.2` | images | kernel-free | [reference](./yandex-image-search/) |
| **YouTube Embed Redirect Button** | `1.6.1` | video & players | kernel-free | [reference](./yt-embed-redirect/) |
| **YouTube Playlist Master** | `1.7.3` | video & players | typeof-guarded (NetHook) | [reference](./youtube-playlist-master/) |
| **Youtube Removed Video Revealer** | `2.0.3` | video & players | kernel-free | [reference](./yt-removed-video-revealer/) |
| **Zai Exporter** | `1.0.0` | sovereign platforms | kernel-free | [reference](./zai-exporter/) |
| **m3u8++** | `5.1.1` | media & links | typeof-guarded (NetHook) | [devlog](./m3u8++/) |

Hand-written deep devlogs: **Bunkr++**, **Hailuo++**, **m3u8++** carry full engineering devlogs with field intelligence;
every other script carries the generated reference above. Guides live in [`docs/`](../docs/):
[Consolidation Report](../docs/CONSOLIDATION.md) · [Migration Guide](../docs/MIGRATION.md) · [Feature Matrix](./_suite/FEATURE-MATRIX.md).
- **WO-01 Round-1 Stepwise Gap Mitigation (`suite v1.9.0`, 8 commits):** Four-agent full-repo audit (tools · kernel/build · canon · consistency) → 7 mitigation commits + the version pin: kernel load-order repair (HUD position persistence restored — `tools/kernel-order.mjs` single source shared by build and smoke; hotkeys named-key canonicalization; net.js real-XHR 4 MB cap; hosts single-label reachability; store remove() watcher notification), gate re-arming (G9 expiry enforcement derives from `package.json` — 50 adjudications re-rolled to v1.12.0 with red-control proof; Gate B prototype-chain hazard + 19 dead rename entries purged; vacuous red controls replaced with mutation-injected ones; production-score standalone never writes), canon source gaps (YTRVR + Images++ `@grant unsafeWindow` feature-dead paths, Forums++ Violentmonkey transport crash, BPP nzherald guard, 5 version syncs, 8 dead grants), docs truthfulness (hailuo++/m3u8++ devlog banners, EVIDENCE.json ghost trio, MIGRATION labels), orphan sweep (candidshiny plugin retired, brand glyph single-sourced, dead kernel exports pruned with census proof, searxng hostname-handler abuse fixed, imgfix lineage guard), and two deep purges (BPP 573-line extension-backend tombstone + its medium.com live ReferenceError; Prompt Master dead-CSS families). Gate CERTIFIED 100/100 throughout; every browser PoP battery green.
- **WO-01 Round-2 Stepwise Gap Mitigation (`suite v1.10.0`):** Four-agent re-audit of the round-1 tree (tools · kernel/build · canon · consistency — every round-1 fix re-verified HOLDING first) → build-contract batch (HostWarp searxng default pattern un-deadened — String(regexLiteral) delimiters made it permanently unmatchable; selectKernel closure + lawful-surface validation; CANON_KERNEL missing-module fails the file; store.remove() watcher contract pinned), canon source batch (BPP theathletic no-arg clearInterval() watcher bounded with handle + 30 s ceiling; Maximize_Any_Media version GM_info-derived; Images++ dead grant + .catch(now) timestamp-swallow honest; AlwaysNewWindow/HideBanner enumeration registries WeakMap+pruned-Set bounded; YTRVR dead escapeHTML reconciled), style-audit foreign-font-lead detector un-deadened (CRITICAL false-certification closed — colon never consumed, quoted-or-unquoted leads, font: shorthand family extraction; Cinzel Decorative recognized as the kernel-asserted brand-glyph typeface; Hailuo++/Images++ migrated to JetBrains Mono leads with rendering preserved), gate-integrity batch (polling census sees member-form intervals; Gate B comment-aware + RECONCILED_NAMES self-check — the mis-keyed BypassPaywalls section was dead config; codeOnly blanks regex bodies; bracket-form tripwires; error census resolves .catch(fnRef) one level; validate single-read/execPath/parity-before-score), kernel truth batch (hotkeys Plus/Minus/NumpadEnter aliases; beacon forensic channel aligned to the v4 contract — pre-rewrite request bodies + respond-verdict phantom fan; registry-full console.warn; SENTINEL LAW documented; JSDocs truthful), and the kernel-export census gate-wired (round-1 deferred item delivered: mechanical extraction, alias-aware consumers, bidirectional drift, G9 keep-ledger — 48 exports × 220 references machine-checked; glass.glyphEl pruned as the one true dead export, Ψ.core.$$ proved LIVE correcting the audit). Gate CERTIFIED at every commit; GUP v7.0.2 banner.
- **WO-01 Round-3 Stepwise Gap Mitigation (`suite v1.11.0`, 8 commits):** Four-agent re-audit of the round-2 tree → the operator's three Prompt Master field reports closed (chip no-occlusion contract with measured forbidden rects + berth ladder + parked-mode retirement + chipHidden export, proven by a rewritten 13/13 live Chromium battery; pill Copy/Paste retired for Insights/Enhance; enhance prompt fully wired incl. the no-editor notification), two CRITICAL canon fixes (Forums++ tippy DOM XSS — escapeHTML ported to every sink site; Filester++ self-feeding glyph observer loop — wrapper resolved first), the glass toast un-ghosted (browser-proven: every kernel toast rendered as host-styled ghost text because none of its CSS custom properties resolve at document.body — a4-scope class + smoke tripwire), build-contract batch (verbatim carries scan-checked; the F-16 cut===0 guard; bridge.py typed 500), census-integrity batch (bracket-CALL banned-sink tripwires; transport member-form dispatch; global compound+self realm writes; .then error arms with the PROMISE_ADJUDICATED ledger; setTimeout self-rearm coverage), battery-truth batch (family-fixture 23/23 derived; boundary denominators derived; wiring gate full-module byte identity; mode disclosure; export census single-sourced from KERNEL_ORDER + unknown-mod probe), docs truthfulness (co-install 6 TRUE collision domains; capability column real domains; 5 missing Lineage sections restored; scan-kit in the tools map), and RECONCILED_NAMES machine anchors (49 entries, every claimed successor machine-verified against the comment-stripped file each run — the mechanism's red control fired organically on the author's own stale tokens). Gate CERTIFIED at every commit; zero regressions across all round-1/round-2 holdings.
