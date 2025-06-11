☠️ 4ndr0tools ☠️
=========================

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A modular, **userscript suite** engineered for actual control and digital emancipation—crafted by [4ndr0666](https://github.com/4ndr0666).  
>  
> _Destroying knowledge feudalism one line at a time._

---

## ✨ Overview

4ndr0tools is a personal, highly-opinionated userscript collection for browser power users and pragmatic tinkerers.  
It provides custom browser automations, UI enhancements, and freedom-ware “protocols” that break down artificial web restrictions.

Scripts are **XDG-principled** and aim to be:

- Minimal, transparent, and easily auditable
- Modular—each script is atomic and can be enabled/disabled independently
- Zero-dependency or with clearly stated, auto-acquired dependencies
- XDG/ShellCheck/Suckless/Arch-aligned by design
- Resistant to anti-user design, walled gardens, and closed platforms

---

## 🛠️ Installation

- Install [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/), or another userscript manager.
- Import/copy the desired `.user.js` scripts directly from this repository.

_**Arch Linux users**_: All scripts are tested and optimized for a minimalist, systemd-optional, power-user workflow.

---

## 🚀 Script Catalog

Below are the flagship scripts and their core features. See each file for exhaustive details and documentation.

| Script Filename                                | Description                                                            | Key Features & Usage                                                  |
|------------------------------------------------|------------------------------------------------------------------------|-----------------------------------------------------------------------|
| **4ndr0tools-ChatGPT++.user.js**               | Enhances ChatGPT’s web UI for power users                              | Multi-export, asset control, disables dark-patterns, persistent hacks |
| **4ndr0tools-ChatGPTBrainImplant.user.js**     | Removes ChatGPT/ChatGPT.com UI/UX restrictions                         | Custom sidebar, context menu, UI style injection, anti-anti-features  |
| **4ndr0tools-GooglePhotosandDrive++.user.js**  | Removes Google Photos/Drive limitations and right-click restrictions    | Instant direct image links, context menu restoration, smart search    |
| **4ndr0tools-Pixverse++.user.js**              | Bypasses Pixverse NSFW/blocked content & enables true media download   | Auto-unlocks videos, exposes raw media URLs, watermark-free           |
| **4ndr0tools-YtdlcProtocol.user.js**           | Implements a system ytdl:// protocol for YouTube and more              | Floating draggable button, context menu, editable hotkey, protocol    |
| **...and more**                               | See repo for more, growing weekly                                      | All scripts modular, XDG-compliant, Arch-first, no bloat              |

---

## 🔥 Project Philosophy

**4ndr0tools** was created in response to the growing digital enclosure of browser experiences—where user agency, open standards, and direct access are actively eroded by major web platforms.

**Key Tenets:**
- **End-User Sovereignty**: You, not the site or corporation, should dictate your browsing experience.
- **Anti-Feudalism**: Knowledge, data, and tools must be free, inspectable, forkable, and remixable.
- **Minimalism**: Every script should have a single clear purpose. No bloat. No tracking. No hidden logic.
- **Cohesion & Idempotency**: All changes are modular, reversible, and avoid breakage on site updates.
- **Community, not Platform**: Designed to be forked, improved, and locally tailored—never locked in.

---

## 📋 Usage, Contributing & Extending

1. **Clone or fork** this repo for your own workflow.
2. **Edit/extend scripts** to your own needs. All code is MIT licensed. See comments in each script for usage and extension tips.
3. **Contribute via pull requests** for new modules, bugfixes, or optimizations. Adhere to the **project code standards**:
   - Strict XDG directory compliance
   - ShellCheck & shfmt clean for all scripts
   - Long-form flags, minimal dependencies
   - Zero-omissions: all features are explicit and transparent

---

## 🏴 Example: Google Photos & Drive++ Script

```js
// ==UserScript==
// @name         4ndr0tools - Google Photos and Drive++  
// @namespace    https://github.com/4ndr0666
// @version      1.0
// @description  Combines multiple functionalities such as image direct links, context menu removal, and non-intrusive UI integration for Google Photos and Drive.
// @author       4ndr0666
// @match        *://*.googleusercontent.com/*
// @match        *://*google.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @grant        none
// ==/UserScript==
````

**Features:**

* Direct photo link enhancement: Converts URLs to original, highest-quality direct image links.
* Context menu restoration: Removes all JS-blockers preventing right-click/save on images.
* UI overlay: Adds quick links for Google/Yandex reverse image search.
* Subtle notification system.

See [4ndr0tools-GooglePhotosandDrive++.user.js](4ndr0tools-GooglePhotosandDrive++.user.js) for implementation and extension details.

---

## 🧠 More: Pixverse Bypass Example

**Pixverse++** (Pixverse NSFW/video bypass):

* Hooks XHR requests to intercept/patch moderation and NSFW rejections
* Exposes the true media URL even when the platform tries to hide it
* (See the included flowchart for an overview of the data extraction and bypass process.)

---

## 🤘 ASCII Manifesto

```
                          .... NO! ...    4ndr0666      ... MNO! ....
                       ..... MNO!! ...................... MNNOO! ....
                     ..... MMNO! ......................... MNNOO!! .
                    .... MNOONNOO!   MMMMMMMMMMPPPOII!   MNNO!!!! .
                     ... !O! NNO! MMMMMMMMMMMMMPPPOOOII!! NO! ....
                        ...... ! MMMMMMMMMMMMMPPPPOOOOIII! ! ...
                       ........ MMMMMMMMMMMMPPPPPOOOOOOII!! .....
                       ........ MMMMMOOOOOOPPPPPPPPOOOOMII! ...
                        ....... MMMMM..    OPPMMP    .,OMI! ....
                         ...... MMMM::   o.,OPMP,.o   ::I!! ...
                             .... NNM:::.,,OOPM!P,.::::!! ....
                              .. MMNNNNNOOOOPMO!!IIPPO!!O! .....
                             ... MMMMMNNNNOO:!!:!!IPPPPOO! ....
                               .. MMMMMNNOOMMNNIIIPPPOO!! ......
                              ...... MMMONNMMNNNIIIOO!..........
                           ....... MN MOMMMNNNIIIIIO! OO ..........
                        ......... MNO! IiiiiiiiiiiiI OOOO ...........
                     ...... NNN.MNO! . O!!!!!!!!!O . OONO NO! ........
                      .... MNNNNNO! ...OOOOOOOOOOO .  MMNNON!........
                        ...... MNNNNO! .. PPPPPPPPP .. MMNON!........
                           ...... OO! ................. ON! .......
                              ................................

```

---

## 📬 Contact & Support

* Maintainer: **4ndr0666**
* Repo: [https://github.com/4ndr0666/userscripts](https://github.com/4ndr0666/userscripts)
* Issues, improvements, pull requests welcome.

---

## LICENSE

MIT License © 4ndr0666

---
