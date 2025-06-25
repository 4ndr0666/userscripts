// ==UserScript==
// @name         4ndr0tools - ChatGPT++
// @namespace    http://github.com/4ndr0666/userscripts
// @version      1.0
// @description  Part of 4ndr0tools for "ease-of-life". Features widescreen
//               mode, editable one-click prompt buttons, extra "copy"
//               buttons on top and bottom of the code blocks.
// @author       4ndr0666
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ChatGPT++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-ChatGPT++.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @include      *
// @match        http*://*.openai.com/*
// @match        http*://*.chatgpt.com/*
// @match        http*://chatgpt.com/*
// @icon         https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico
// @license      AGPL-v3.0
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(function() {
  'use strict';

  /*
   * ============================================================
   * Module 1: ChatGPT Widescreen
   * Adjust the page layout by injecting custom CSS for a wider text field.
   * ============================================================
   */
  function initWidescreen() {
    const limit_answer_height = false;
    const chatWiderStyle = `
      .xl\\:max-w-\\[48rem\\] {
        width:95% !important;
        max-width:96% !important;
      }
      div.mx-auto.md:max-w-3xl {
        max-width: calc(100% - 10px);
      }
      div.mx-auto.flex {
        max-width: calc(100% - 10px);
      }
      div.ProseMirror.break-words.ProseMirror-focused {
        max-width:100%;
      }
      body > div.flex.min-h-screen.w-full div.flex.flex-col div.flex.gap-2 div.mt-1.max-h-96.w-full.overflow-y-auto.break-words > div.ProseMirror.break-words {
        max-width:90%;
      }
      body > div.flex.min-h-screen.w-full > div > main > div.top-5.z-10.mx-auto.w-full.max-w-2xl.md {
        max-width:100%;
      }
      body > div.flex.min-h-screen.w-full > div > main > div.mx-auto.w-full.max-w-2xl.px-1.md {
        max-width:100%;
      }
      body > div.flex.min-h-screen.w-full > div > main.max-w-7xl {
        max-width: 90rem;
      }
      main > div.composer-parent article > div.text-base > div.mx-auto {
        max-width: 95%;
      }
      main article > div.text-base > div.mx-auto {
        max-width: 95%;
      }`;

    if (limit_answer_height) {
      GM_addStyle(`
        pre > div.rounded-md > div.overflow-y-auto {
          max-height: 50vh;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: #aaaa #1111;
        }
        .code-block__code {
          max-height: 50vh;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: #aaaa #1111;
        }
        pre > div.rounded-md > div.overflow-y-auto ::-webkit-scrollbar-track {
          background: #1111;
        }
        pre > div.rounded-md > div.overflow-y-auto ::-webkit-scrollbar-thumb {
          background: #aaaa;
        }
        pre > div.rounded-md > div.overflow-y-auto ::-webkit-scrollbar-thumb:hover {
          background: #0008;
        }
      `);
    }

    GM_addStyle(chatWiderStyle);
    enhanceAddStyle();

    function enhanceAddStyle() {
      const chat = document.querySelector('main > div.composer-parent article > div.text-base > div.mx-auto');
      if (chat) {
        if (window.getComputedStyle(chat).maxWidth !== '95%') {
          GM_addStyle(chatWiderStyle);
        }
      } else {
        setTimeout(enhanceAddStyle, 1100);
      }
    }

    function link_addhref() {
      document.querySelectorAll('div[data-message-id] a[rel="noreferrer"]').forEach(item => {
        if (!item.href) {
          item.href = item.innerText;
          item.target = "_blank";
        }
      });
      setTimeout(link_addhref, 1800);
    }
    link_addhref();
  }

  /*
   * ============================================================
   * Module 2: ChatGPT Prompt Buttons
   * Adds a fixed top bar with clickable prompts that auto‑fill the ChatGPT input.
   * ============================================================
   */
  function initPromptButtons() {
    const prompts = [
      {
        title: '❯ Proceed',
        prompt: `Proceed to meticulously revise the code and fully implement all mitigations/optimizations--from variable names to logic flows--with no placeholders or omitted lines directly within your response. Begin by ascertaining the total number of functions and the exact count of lines of code in the existing codebase then write the sum in the header in your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Work around the existing code flow without leaving anything out. Examine all functions in isolation using step-by-step validation in order to confirm they work before integrating them into your final revision. Last, ensure to reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted. To minimally guide your thought processes as you proceed to validate all functions, at the very least ensure that the following can be said about all functions:\n\n - Well-defined and thoroughly fleshed out.\n - Variable declarations are separated from assignments.\n - All imports and paths are clearly defined.\n - Locally scoped.\n - Standardize the use of setsid versus exec.\n - Accessible.\n - Idempotent.\n - All parsing issues, extraneous input, unintended newlines and/or unintended separators are absent.\n - No bad splitting.\n - Unambiguous variables and values.\n - Exit status of the relevant command is explicitly checked to ensure consistent behavior.\n - \`&>\` for redirecting both stdout and stderr (use \`>file 2>&1\` instead).\n - Exports are properly recognized.\n\n **Additional Considerations**: Confirm whether or not ambiguity exists in your revision, then proceed with the required steps to definitively resolve any remaining ambiguity. This is done by ensuring all actual values are provided over arbitrary variables ensuring no unbound variables. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact.\n\n ## Discrepancies\n If I indicate there’s a discrepancy or request specific changes (such as to reformat, correct errors, or add missing lines), please correct these and resume delivering segments from the corrected point.\n ## Alignment Enforcement\n Identify the sum of all functions and the exact count of lines of code in your proposed revision vs the initial count ensuring a numerical alignment within reason of the expected range. If a gross mismatch is detected, you are required to immediately halt and ascertain the exact count of lines of code in your revision and try again directly in your response for a total of three retries before quitting and throw an error.\n # Finalization\n\n > *"Automation reduces toil, but people are still accountable. Adding new toil needs a very strong justification. We build automation and processes that make the best use of our contributors' limited time and energy."*.\n\n Reduce the potential for human error by eliminating all unneeded manual  user intervention within the script in favor of automation. For example, incorporating all necessary checks and validations within the script itself. Finally, precisely parse your entire updated revision in manageable segments with a max limit of 4000 total lines of code to stdout for review and testing.`
      },
      {
        title: '❯ Results',
        prompt: `# Testing Result\n\n**Maintain technical and concise communication**\n\nThe revision resulted in an unsuccessful test and failed. You are required to analyze the terminal output and leverage chain of thought reasoning in order to systematically mitigate all conflicts detected. Proceed to analyze the terminal output and meticulously implement all suggestions/optimizations/recommendations directly within your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Examine all functions in isolation and ensure they work before integrating them dynamically. Ensure idempotency using step-by-step isolation and validation. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact.\n\n**Terminal Output**\n\n\`\`\`shell\n\n >> PASTE TERMINAL OUTPUT HERE <<\n\n \`\`\`\n\n### Definitions\n\n   - **Error Definition:** Code containing any placeholders is considered invalid and unacceptable as this indicates incomplete logic or functionality.\n\n   - **Error Resolution:** If your initial submission contains any placeholders, you must replace all placeholders with functional code. This revision may require iterative adjustments to ensure complete removal of placeholders and full compliance with the project requirements.\n\nIf I indicate there’s a discrepancy or request specific changes (such as to reformat, correct errors, or add missing lines), please correct these and resume delivering segments from the corrected point. Confirm that all lines are complete and that the logic aligns with the requested original structure.  Once the script functionality is confirmed, proceed to precisely parse the entire updated revision to stdout for review and testing ensuring to:\n\n   - Reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted.\n\n   - Separate variable declarations from assignments.\n\n   - Explicitly check the exit status of the relevant command to ensure consistent behavior.\n\n   - &> for redirecting both stdout and stderr (use >file 2>&1 instead).\n\nEnsure alignment with copy and paste operations by providing the complete code in appropriate formatting within a unique code block to ensure the text will be pasted in the expected format. Work around the existing code flow without leaving anything out, provided your revision matches the full context of the entire script and is inclusive of all logic, this will avoid any further syntax issues.`
      },
      {
        title: '❯ Primer',
        prompt: `📄 Primer for Professional‑Grade Programming Assistant \n\n---\n\n### 1. Role & Scope  \nYou are a **Professional‑Grade Programming Assistant** for a **production‑ready environment**. Your tasks include:\n- Writing new code, refactoring existing code, debugging, and documentation.\n- Conducting quality assurance reviews, linting, and conflict analysis.\n- Ensuring idempotency, modularity, and portability across Unix‑like systems.\n\n### 2. Core Standards & Thresholds\n\n#### 2.1 Minimalism & Dependency Avoidance  \n- Default to POSIX‑compliant \`/bin/sh\` unless the user explicitly requires bash‑specific features.\n- Avoid external dependencies; rely only on tools guaranteed on all major Linux distributions (e.g., \`find\`, \`dirname\`, \`mkfifo\`, \`trap\`, \`sed\`, \`awk\`).\n\n#### 2.2 XDG & Environment Variables  \n- Always reference user configuration via XDG variables (\`$XDG_CONFIG_HOME\`, \`$XDG_DATA_HOME\`, \`$XDG_CACHE_HOME\`).\n- Do **not** hard‑code absolute paths in scripts; assume environment variables are set at invocation.\n\n#### 2.3 Configuration Centralization  \n- Encourage central configuration files (e.g., \`~/.config/wayfire.ini\`).\n- Script‑level overrides should be minimal and documented inline via comments.\n\n#### 2.4 Idempotency & Error Handling  \n- Every function must validate inputs (\`[ $# -ge … ]\`, \`[ -d … ]\`, etc.) and fail gracefully with a usage message or error code.\n- Use \`trap '…' EXIT\` for cleanup of any temporary resources.\n- Avoid side effects when preconditions are not met.\n\n#### 2.5 Approval‑Based Iteration  \n- After presenting a major code revision or design, explicitly ask the user for confirmation before proceeding.\n- Frame follow‑up questions as “Do you approve this approach?” or “Shall I integrate this into the final script?”\n\n#### 2.6 Professional Tone & Academic Rigor  \n- Provide comparative analyses with **scores** for each solution across **Impact**, **Feasibility**, **Effectiveness**, and **Historical Usage**.\n- Use bullet points, numbered lists, and Markdown tables for structured clarity.\n- Cite best practices and standards where applicable.\n\n#### 2.7 Systematic Documentation  \n- Begin responses with a brief summary of the solution.\n- Organize code suggestions under clearly labeled sections (e.g., “Solution 1: POSIX Rewrite”, “Solution 2: Bash‑Native”).\n\n### 3. Behavioral Guidelines\n\n1. **Prioritize Understanding:**  \n   - Start by restating the user’s objective in your own words.\n   - Ask clarifying questions if any requirement is ambiguous.\n\n2. **Meticulous Action:**  \n   - For every code snippet, ensure no placeholders (e.g., \`<…>\`) remain.\n   - Validate that the snippet can be copy‑pasted and executed without further modification.\n\n3. **Systematic Implementation:**  \n   - Break down complex tasks into numbered steps.\n   - Demonstrate each step in isolation before integration.\n\n4. **Concise Explanation:**  \n   - Limit prose to essential commentary—aim for clarity over verbosity.\n   - Inline comments should be sparing and only where non‑obvious logic exists.\n\n5. **Approval Workflow:**  \n   - After each major deliverable, end with:  \n     > “Do you approve this approach, or would you like to adjust X, Y, or Z?”\n\n### 4. Example Invocation\n\nWhen asked to implement a “play directory” script:\n\n1. **Restate Objective:**  \n   > “You want a \`/bin/sh\`‑compatible script that …”\n\n2. **Present Comparative Solutions:**  \n   - **Solution 1:** POSIX pipeline approach (score: 95/100)\n   - **Solution 2:** Bash arrays + process substitution (score: 85/100)\n\n3. **Recommend & Request Approval:**  \n   > “Based on your minimalism and portability goals, I recommend Solution 1. Do you approve?”\n\n4. **Upon Approval:**  \n   - Deliver final code.\n   - Summarize changes relative to the user’s existing script.\n   - Provide next steps or optional enhancements as bullet points.\n\n---\n\n**End of Primer**\n\n`
      },
      {
        title: '❯ Shell',
        prompt: `\`\`\`shell\n\n>>> PASTE TERMINAL OUTPUT HERE <<<\n\n\`\`\`\n\n👍\n\`\`\`python\n# Save both scripts to .txt files for retention\nfor src, dst in [\n    ('/mnt/data/code1.sh','/mnt/data/code1.sh'),\n    ('/mnt/data/code2.sh', '/mnt/data/code2.sh')\n]:\n    with open(src, 'r') as f_in:\n        lines = f_in.readlines()\n    with open(dst, 'w') as f_out:\n        f_out.writelines(lines)\n    print(f"Written {src} → {dst}")`
      }
    ];

    const mainTopBar = document.createElement('div');
    mainTopBar.style.position = 'fixed';
    mainTopBar.style.top = '10px';
    mainTopBar.style.left = '50%';
    mainTopBar.style.transform = 'translateX(-50%)';
    mainTopBar.style.width = 'auto';
    mainTopBar.style.height = '30px';
    mainTopBar.style.paddingTop = '8px';
    mainTopBar.style.display = 'flex';
    mainTopBar.style.alignItems = 'center';
    mainTopBar.style.zIndex = '9999';

    prompts.forEach(item => {
      const link = document.createElement('a');
      link.href = 'https://gkoberger.github.io/Font-Awesome/3.2.1/icon/terminal/';
      link.textContent = item.title;
      link.style.marginRight = '40px';
      link.addEventListener('click', e => {
        e.preventDefault();
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        const textbox = document.getElementById('prompt-textarea');
        if (textbox) {
          textbox.innerText = item.prompt;
          textbox.dispatchEvent(inputEvent);
          textbox.focus();
        }
      });
      mainTopBar.appendChild(link);
    });
    document.body.appendChild(mainTopBar);
  }

  /*
   * ============================================================
   * Module 3: ChatGPT Copy Code Button
   * Adds a 'Copy Code' button to code blocks for easier copying.
   * ============================================================
   */
  function initCopyCodeButton() {
    const copyToClipboard = (text, button) => {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Copied code to clipboard');
        button.innerHTML = 'Copied!';
        setTimeout(() => {
          button.innerHTML = '';
          const svgIcon = getSVGIcon();
          button.appendChild(svgIcon);
        }, 2000);
      }, err => {
        console.error('Failed to copy code: ', err);
      });
    };

    const getSVGIcon = () => {
      const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgIcon.setAttribute('width', '24');
      svgIcon.setAttribute('height', '24');
      svgIcon.setAttribute('fill', 'none');
      svgIcon.setAttribute('viewBox', '0 0 24 24');
      svgIcon.classList.add('icon-sm');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'currentColor');
      path.setAttribute('fill-rule', 'evenodd');
      path.setAttribute('d', 'M7 5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h2zm2 2h5a3 3 0 0 1 3 3v5h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1zM5 9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1z');
      path.setAttribute('clip-rule', 'evenodd');
      svgIcon.appendChild(path);
      return svgIcon;
    };

    const addButton = elem => {
      const button = document.createElement('button');
      const svgIcon = getSVGIcon();
      button.appendChild(svgIcon);
      button.style.position = 'absolute';
      button.style.bottom = '8px';
      button.style.right = '8px';
      button.style.fontSize = '12px';
      button.style.padding = '4px 8px';
      button.style.border = '1px solid #ccc';
      button.style.borderRadius = '3px';
      button.style.background = 'rgba(0,0,0,0.1)';
      button.style.color = 'white';
      button.style.cursor = 'pointer';
      button.style.zIndex = '10';
      button.style.transition = 'background-color 0.3s ease';
      button.addEventListener('click', e => {
        e.stopPropagation();
        const codeElem = elem.querySelector('code');
        if (codeElem) {
          copyToClipboard(codeElem.textContent, button);
        }
      });
      button.addEventListener('mouseover', () => {
        button.style.backgroundColor = 'rgba(0,0,0,0.2)';
      });
      button.addEventListener('mouseout', () => {
        button.style.backgroundColor = 'rgba(0,0,0,0.1)';
      });
      elem.style.position = 'relative';
      elem.appendChild(button);
    };

    const observeCodeBlocks = () => {
      const codeBlocks = document.querySelectorAll('pre:not(.copy-code-processed)');
      if (codeBlocks.length) {
        codeBlocks.forEach(block => {
          addButton(block);
          block.classList.add('copy-code-processed');
        });
      }
    };

    const observer = new MutationObserver(observeCodeBlocks);
    observer.observe(document.body, { childList: true, subtree: true });
    observeCodeBlocks();
  }

  /*
   * ============================================================
   * Initialize All Modules Once DOM is Ready
   * ============================================================
   */
  function initToolbox() {
    initWidescreen();
    initPromptButtons();
    initCopyCodeButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToolbox);
  } else {
    initToolbox();
  }

})();
