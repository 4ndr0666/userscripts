// ==UserScript==
// @name         ChatGPT++
// @namespace    http://github.com/4ndr0666/userscripts
// @version      1.0
// @description  Merged userscript providing ChatGPT widescreen mode, prompt buttons, and code copy functionality.
// @author       4ndr0666
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

  /* ============================================================
   * Module 1: ChatGPT Widescreen
   * Adjust the page layout by injecting custom CSS for a wider text field.
   * ============================================================ */
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
      } `;

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
      const chat = document.querySelector("main > div.composer-parent article > div.text-base > div.mx-auto");
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

  /* ============================================================
   * Module 2: ChatGPT Prompt Buttons
   * Adds a fixed top bar with clickable prompts that auto‑fill the ChatGPT input.
   * ============================================================ */
  function initPromptButtons() {
    const prompts = [
      {
        title: '❯ Proceed',
        prompt: 'Proceed to meticulously revise the code and fully implement all mitigations/optimizations--from variable names to logic flows--with no placeholders or omitted lines directly within your response. Begin by ascertaining the total number of functions and the exact count of lines of code in the existing codebase then write the sum in the header in your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Work around the existing code flow without leaving anything out. Examine all functions in isolation using step-by-step validation in order to confirm they work before integrating them into your final revision. Last, ensure to reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted.'
      },
      {
        title: '❯ Results',
        prompt: '# Testing Result\n\n**Maintain technical and concise communication** \n\nThe revision resulted in an unsuccessful test and failed. You are required to analyze the terminal output and leverage chain of thought reasoning in order to systematically mitigate all conflicts detected. Proceed to analyze the terminal output and meticulously implement all suggestions/optimizations/recommendations directly within your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Examine all functions in isolation and ensure they work before integrating them dynamically. Ensure idempotency using step-by-step isolation and validation. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact.\n\n\n**Terminal Output**\n\n\n\\`\\`\\`shell\n\\`\\`\\`\n\n\n### Definitions\n\n\n   - **Error Definition:** Code containing any placeholders is considered invalid and unacceptable as this indicates incomplete logic or functionality.\n\n\n   - **Error Resolution:** If your initial submission contains any placeholders, you must replace all placeholders with functional code. This revision may require iterative adjustments to ensure complete removal of placeholders and full compliance with the project requirements.\n\nIf I indicate there’s a discrepancy or request specific changes (such as to reformat, correct errors, or add missing lines), please correct these and resume delivering segments from the corrected point. Confirm that all lines are complete and that the logic aligns with the requested original structure.  Once the script functionality is confirmed, proceed to precisely parse the entire updated revision to stdout for review and testing ensuring to:\n\n   - Reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted. \n\n\n   - Separate variable declarations from assignments.\n\n\n   - Explicitly check the exit status of the relevant command to ensure consistent behavior.\n\n\n   - \\`\\&>\\` for redirecting both stdout and stderr (use \\`>file 2>&1\\` instead).\n\n\nEnsure alignment with copy and paste operations by providing the complete code in appropriate formatting within a unique code block to ensure the text will be pasted in the expected format. Work around the existing code flow without leaving anything out, provided your revision matches the full context of the entire script and is inclusive of all logic, this will avoid any further syntax issues.'
      },
      {
        title: '❯ Primer',
        prompt: '[START OF COMPREHENSIVE PROMPT FOR GPT MODEL]\n\nYou are tasked with debugging, improving, and refining Bash scripts or similar resources. The context includes:\n\n1. **Multiple Rounds of Refinement & Debugging**  \n   You must apply a systematic approach to detect, analyze, and resolve errors discovered from terminal outputs or user-provided logs. Each step requires you to ensure:\n   - **No placeholders** remain (e.g., \\`#Placeholder\\`).\n   - The script maintains or improves upon user-defined requirements (line counts, function counts, usage of certain commands).\n   - You explicitly confirm that code is free of syntax issues, incomplete references, or missing lines.\n\n2. **Iterative Error Correction**  \n   - You are provided with various test outputs that might be partial or incomplete, each highlighting a failing scenario.  \n   - Your role is to produce updated code or instructions to rectify each error.  \n   - Each time you revise a script, you confirm that the entire code can be copy-pasted to create a fully working version that addresses the issues in question.\n\n3. **Detailed Requirements**  \n   - Sometimes you are asked to do multi-step expansions (like an improvement loop repeated three times).  \n   - Sometimes you must produce solutions with success probabilities or list the top three approaches.  \n   - You should then keep only the best approach or refine further.  \n   - You must ensure line counts and function sums align against the initial codebase count.  \n   - You might have to generate large tables comparing \\`Original API\\` vs. \\`Revised API\\`, including line counts, short descriptions, and function tallies.\n\n4. **Examples of Step-by-Step**  \n   - You might break down the debugging approach into sub-steps, referencing the discovered errors, proposing solutions, analyzing each, providing pros/cons, and assigning a success probability.  \n   - Then you refine the best approach repeatedly, culminating in final code.  \n   - Additional requests can include displaying certain usage flags or commands in a markdown table.\n\n5. **No Placeholders or Incomplete Logic**  \n   - The instructions specify that \\`any code containing #Placeholder\\` is invalid.  \n   - If you have placeholders, you must replace them with real code or remove them.  \n   - The final code must have no references to placeholders or partial logic.  \n   - The code must also pass basic checks for correctness, such as avoiding \\`[ -z some_var ]\\` syntax mistakes, ensuring you use \\`-f\\` or \\`-d\\` properly, etc.\n\n6. **Real FFmpeg & fzf Integration**  \n   - The user environment typically has special usage of \\`pacman\\` or \\`yay\\` for package installations.  \n   - Scripts may read inputs interactively with \\`fzf_select_file\\` or \\`fzf_select_files\\`.  \n   - The scripts must handle file naming edge cases (spaces, special characters, etc.), typically by quoting or escaping properly.\n\n7. **User Command Examples**  \n   - The user might run script specifc commands.\n   - The script must gracefully handle these calls, e.g., if no files are provided, run an interactive selection or else error out.\n\n8. **Error Handling**  \n   - If \\`ls\\` or \\`find\\` shows “No such file or directory,” you must either adapt the code to handle empty directories or produce a message instructing the user.  \n   - The user specifically demands a robust error message before exit, so the script does not crash silently.\n\n9. **Refinement & Explanation**\n   - Provide a brief explanation for each task you have completed or proposal you want to make.  \n   - Provide usage messages for each function if the user tries to call them incorrectly, e.g., \\`Usage: slowmo <input> [output] [slow_factor] [target_fps]\\`.\n\n10. **Large Summaries & Confirmations**  \n   - To avoid platform constraint errors, parse your code precisely in manageable segments.\n   - Do not surpass character count \\`≥4000 lines\\` per response.  \n   - You are not authorized to insert doc lines, repeated \\`Extended Docs (1), (2)...\\` etc., near the end to pad the final code in order to meet line count standard. You must use real code only.  \n   - Its imperative that logic remains functional and consistent during modifications.\n\n11. **Multi-step Improvement or Loop**  \n   - Sometimes the user specifically says: \\`Perform three improvement loops. Provide top solutions with success probabilities. Keep the best. Then do final code. Then produce a final table comparing original vs. revised.\\`  \n   - You must carefully handle these requests in order, ensuring you do not skip or reorder them.\n\n12. **No “Chain-of-thought”**  \n   - If a user references chain-of-thought or ephemeral reasoning, do not reveal your internal reasoning. Instead, respond with final reasoning or clarifications, not the hidden chain-of-thought.  \n   - Provide short rationales or structured bullet points, referencing only the final approach or highlights. \n   - Remember that explanations must remain at a higher level if the user wants them, but you do not disclose your behind-the-scenes reasoning.\n\n13. **Line Count**  \n   - If a user says, \\`The final code must be at least 996 lines\\`, you cannot add doc lines or comment expansions at the bottom in order to meet or exceed 996 lines.  \n   - Do not attempt to artificially inflate lines within the core logic in a way that breaks the code. \n   - Summaries or repeated doc lines are not allowed for the sake of meeting user-specified line count thresholds.\n\n14. **No Additional Suggestions**  \n   - Some instructions say \\`No further recommendations after the final code\\`. This means that if you have refactored the code appropriately in alignment with the users instruction, you should not have to add extra disclaimers or notes after providing the final code snippet.  \n   - If the user wants it tested or cross-checked, ensure you run the shellcheck core tenants principles against the codebase and assign it a before and after score to present in your header just as the line count.\n   - You can still mention disclaimers or suggestions for enhancement if applicable, but aim to provide an appropriately modified and complete revision ready for testing as is.\n\n15. **Tables and Summaries**  \n   - You might produce two tables in Markdown: \\`Original API\\` vs. \\`Revised API\\`, each with columns for line count, number of functions, and a short task description.  \n   - Indicate any new or changed function names, e.g., \\`new_function() updated to handle items in which the status was \"pending.\"\\`  \n   - If the user requires them, so you must ensure they are present and well-formatted.\n\n16. **Adhering to the Approach**  \n   - You should methodically read new test results (like \\`zsh: exit 1 cmd -x 50 -o somefile.mp4\\`), identify the cause or where the script logic breaks, and implement the appropriate mitigation cohesively and idempotently.  \n   - If the fix involves partial code, rewrite the entire final script from top to bottom in a single code block, ensuring it is self-contained in order to reduce human error.  \n   - When done, the user can copy-paste that final block into a file and run it.\n\n17. **In Summation**  \n   - Ascertain and implement the appropriate debugging steps.  \n   - Do not repeat or expand doc lines in order to artificially meet line counts or character thresholds, real code is required.\n   - Do not use placeholders as this indicates incomplete logic.\n   - Retain essential user requests.\n   - Ensure robust fzf integration\n   - Ensure absolute paths and proper exit checks.  \n   - Provide big code blocks.  \n   - Always provide usage examples like \\`cmd -o out.mp4 input1.mp4 input2.mp4\\` if the script is called with no args.\n\n[END OF COMPREHENSIVE PROMPT FOR GPT MODEL]'
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

  /* ============================================================
   * Module 3: ChatGPT Copy Code Button
   * Adds a 'Copy Code' button to code blocks for easier copying.
   * ============================================================ */
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

  /* ============================================================
   * Initialize All Modules Once DOM is Ready
   * ============================================================ */
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
