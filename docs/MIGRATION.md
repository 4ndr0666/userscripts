# Migration Guide — from the legacy userscripts repo to the suite

## Who is this for

You installed scripts from `4ndr0666/userscripts` (root directory). The suite
(`dist/`) replaces that inventory 1:1 feature-wise — every script you used has
exactly one successor here. **Uninstall the legacy script, then install the
successor** — running both is the co-install chaos this consolidation removes.

## Successor table (legacy → suite)

### Promotions (you had the STABLE — its BETA is now canonical)

| You had | Install instead | Then uninstall |
|---|---|---|
| m3u8++ v4.4 | [m3u8++ v5.0.0](../dist/4ndr0tools%20-%20m3u8++.user.js) | m3u8++ (old) |
| Hailuo++ v5.1.1 | [Hailuo++ v6.0.0](../dist/4ndr0tools%20-%20Hailuo%2B%2B.user.js) | Hailuo++ (old) |
| Blob2URL v6.3 | [Blob2URL v7.0.0](../dist/4ndr0tools%20-%20Blob2URL.user.js) | Blob2URL (old) |
| Confirmation Bypass v3.6.1 | [Confirmation Bypass v4.0.0](../dist/4ndr0tools%20-%20Confirmation%20Bypass.user.js) | Confirmation Bypass (old) |
| ModelSearch v2.1 | [ModelSearch v4.0.0](../dist/4ndr0tools%20-%20ModelSearch.user.js) | ModelSearch (old) |
| GooglePhotosandDrive++ v1.5.0 | [GooglePhotosandDrive++ v8.0.0](../dist/4ndr0tools%20-%20GooglePhotosandDrive%2B%2B.user.js) | GooglePhotosandDrive++ (old) |
| Media Player Controller v5.1.0 | [Media Player Controller v8.0.0](../dist/4ndr0tools%20-%20Media%20Player%20Controller.user.js) | Media Player Controller (old) |
| Forum Link Xtractor v1.0 | [Forum Link Xtractor v3.0.0](../dist/4ndr0tools%20-%20Forum%20Link%20Xtractor.user.js) | Forum Link Xtractor (old) |

### Promotions (you had the BETA)

| You had | Install instead | Then uninstall |
|---|---|---|
| m3u8++BETA v4.5 | [m3u8++ v5.0.0](../dist/4ndr0tools%20-%20m3u8%2B%2B.user.js) | m3u8++BETA **and** old stable m3u8++ |
| Hailuo++BETA v5.4.0 | [Hailuo++ v6.0.0](../dist/4ndr0tools%20-%20Hailuo%2B%2B.user.js) | Hailuo++BETA and old stable |
| Blob2URLBETA v6.5 | [Blob2URL v7.0.0](../dist/4ndr0tools%20-%20Blob2URL.user.js) | Blob2URLBETA and old stable |
| Confirmation Bypass BETA v3.6.2 | [Confirmation Bypass v4.0.0](../dist/4ndr0tools%20-%20Confirmation%20Bypass.user.js) | both |
| ModelSearchBETA v3.2.0-Ψ | [ModelSearch v4.0.0](../dist/4ndr0tools%20-%20ModelSearch.user.js) | both |
| GooglePhotosandDrive++BETA v7.0.0 | [GooglePhotosandDrive++ v8.0.0](../dist/4ndr0tools%20-%20GooglePhotosandDrive%2B%2B.user.js) | both |
| Media Player Controller BETA v7.0.0-Ψ | [Media Player Controller v8.0.0](../dist/4ndr0tools%20-%20Media%20Player%20Controller.user.js) | both |
| Forum Link Xtractor BETA v2.1.0 | [Forum Link Xtractor v3.0.0](../dist/4ndr0tools%20-%20Forum%20Link%20Xtractor.user.js) | both |

### LinkMaster family (five → one)

| You had | Install instead | Then uninstall |
|---|---|---|
| LinkMasterΨ v5.0.0 | [LinkMasterΨ v6.1.0](../dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js) | LinkMasterΨ (old) |
| LinkMasterBETA v5.1.1 | [LinkMasterΨ v6.1.0](../dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js) | LinkMasterBETA |
| LinkMasterΨ2 v3.1.0 | [LinkMasterΨ v6.1.0](../dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js) | LinkMasterΨ2 |
| Premium Link Revealer v1.2 | [LinkMasterΨ v6.1.0](../dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js) | Premium Link Revealer |
| Git Raw URL File List Parser v4.0.0 | [LinkMasterΨ v6.1.0](../dist/4ndr0tools%20-%20LinkMaster%CE%A8.user.js) | Git Raw URL File List Parser |

Ψ2 users: your `linkmaster_settings` (GoFile token, forum defaults) carry over
automatically — same storage key. The Forum tab in the new HUD is the Ψ2
scrape panel; the Check tab's "Deep-Resolved Link Check" section is the Ψ2
check-scraped flow; paste-to-check remains at the top of the Check tab.

### Images++ pair

| You had | Install instead | Then uninstall |
|---|---|---|
| Images++ v3.0.0 (universal) | [Images++ v4.0.0](../dist/4ndr0tools%20-%20Images%2B%2B.user.js) | Images++ (old) |
| Images++BETA v2.1.0 (IG-scoped) | [Images++ v4.0.0](../dist/4ndr0tools%20-%20Images%2B%2B.user.js) — see note | Images++BETA |

Note: the BETA was a divergent IG/imagefap-scoped branch. Its one unique
feature — configurable collapse hotkey — is in v4.0.0. If you relied on the
BETA's IG-specific hover behavior, the universal stable behavior (also in
v4.0.0) covers it; Instagram++ remains the dedicated IG tool.

### Privacy trio (three → one)

| You had | Install instead | Then uninstall |
|---|---|---|
| Anti-detection v1.1 | [Akasha Silence v5.0.0](../dist/4ndr0tools%20-%20Akasha%20Silence.user.js) | Anti-detection |
| Counter-surveillance v4.0.0 | [Akasha Silence v5.0.0](../dist/4ndr0tools%20-%20Akasha%20Silence.user.js) | Counter-surveillance |
| Anti-telemetry (ICC) v3.5.0 | [Akasha Silence v5.0.0](../dist/4ndr0tools%20-%20Akasha%20Silence.user.js) | Anti-telemetry (ICC) |

The three scripts shared ~70% of their core (hardware shroud, canvas
blinding, network nullification) — running two of them together double-hooked
the same natives. Akasha Silence is the strict union: the anti-analysis
neutralizer, the Google link sanitizer, the Reddit/Instagram/Facebook fixes,
the ICC worker pacifier (same ICC scope as before) and iframe propagation all
live in one script. It also fixes the tell-tale defects of the trio:
fingerprint values are now session-stable (`navigator.hardwareConcurrency ===
navigator.hardwareConcurrency` holds), canvas noise is per-canvas seeded
(reading the same canvas twice agrees), `toDataURL`/`toBlob` are blinded
(the old getImageData-only hook was bypassable), and native hooks are Proxy
facades that survive `toString()` inspection. If you run **4ndr0serviceguard
Companion**, worker/socket control defers to it automatically — no double
gating.

### Micro tools → composites

| You had | Install instead | Then uninstall |
|---|---|---|
| BrokenImgFixer | [PageCraft](../dist/4ndr0tools%20-%20PageCraft.user.js) (imgfix module, Alt+R) | BrokenImgFixer |
| SelectAllCheckboxes | [PageCraft](../dist/4ndr0tools%20-%20PageCraft.user.js) (checkboxes module) | SelectAllCheckboxes |
| Collapse All Images | [PageCraft](../dist/4ndr0tools%20-%20PageCraft.user.js) (collapse module) | Collapse All Images |
| InfiniteBrave | [PageCraft](../dist/4ndr0tools%20-%20PageCraft.user.js) (brave module) | InfiniteBrave |
| HDImgsOnly | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (imagehost module) | HDImgsOnly |
| MegaEmbedRedirector | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (mega module) | MegaEmbedRedirector |
| PlanetsuzyMobileSkinRedirect | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (planetsuzy module) | PlanetsuzyMobileSkinRedirect |
| Telegram Web Redirect | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (telegram module) | Telegram Web Redirect |
| Searxng Sticky Settings | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (searxng module) | Searxng Sticky Settings |
| Gemini Answer Now | [HostWarp](../dist/4ndr0tools%20-%20HostWarp.user.js) (gemini module) | Gemini Answer Now |

Every composite module is individually toggleable in its glass settings
console (Ψ menu command or dock), so you can reproduce any single-tool setup.

### Everything else

All remaining scripts keep their names — install the same-named file from
[`dist/`](../dist) and uninstall the legacy copy. Versions and feature sets
are unchanged (metadata normalized: namespace, download/update URLs now point
at `dist/`, author/license fields filled).

## Hotkey changes to relearn

| Legacy | Suite | Why |
|---|---|---|
| Maximize_Any_Media console `Alt+S` | `Alt+Shift+S` | `Alt+S` is ModelSearch's overlay (collision) |
| Recon dock `Alt+R` | `Alt+Shift+R` | `Alt+R` is PageCraft's broken-image retrigger (collision) |

All other hotkeys are unchanged.

## Update behavior

Suite `@downloadURL`/`@updateURL` point at `dist/` on `main`. If you fork the
suite, run `npm run check` before pushing — CI runs the same gates
(build → inventory → GUP validation) and fails closed on any regression the
superset contract can detect.
