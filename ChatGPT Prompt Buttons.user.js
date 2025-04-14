// ==UserScript==
// @name        ChatGPT Prompt Buttons
// @description Adds button(s) that automatically input any prompt or text you want with one click.
// $match       http*://*.chatgpt.com/*
// @version     1.0
// @author      4ndr0666
// @namespace   https://github.com/4ndr0666/userscripts
// @icon        https://cdn.oaistatic.com/assets/favicon-miwirzcw.ico
// ==/UserScript==
// VARIABLES
let myresults = "\`\`\`shell\n >>> PASTE SHELL RESULTS HERE <<< \n\`\`\`"
let prompts = [
    // PASTE YOUR PROMPT HERE (YOU NEED TO ESCAPE ALL SINGLE QUOTES ['] -> [\'])
    { title: '➡️ Proceed', prompt: 'Proceed to meticulously revise the code and fully implement all mitigations/optimizations--from variable names to logic flows--with no placeholders or omitted lines directly within your response. Begin by ascertaining the total number of functions and the exact count of lines of code in the existing codebase then write the sum in the header in your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Work around the existing code flow without leaving anything out. Examine all functions in isolation using step-by-step validation in order to confirm they work before integrating them into your final revision. Last, ensure to reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted. To minimally guide your thought processes as you proceed to validate all functions, at the very least ensure that the following can be said about all functions:\n\n - Well-defined and thoroughly fleshed out.\n - Variable declarations are separated from assignments.\n - All imports and paths are clearly defined.\n - Locally scoped.\n - Standardize the use of setsid versus exec.\n - Accessible.\n - Idempotent.\n - All parsing issues, extraneous input, unintended newlines and/or unintended separators are absent.\n - No bad splitting.\n - Unambiguous variables and values.\n - Exit status of the relevant command is explicitly checked to ensure consistent behavior.\n - \`&>\` for redirecting both stdout and stderr (use \`>file 2>&1\` instead).\n - Exports are properly recognized.\n\n **Additional Considerations**: Confirm whether or not ambiguity exists in your revision, then  proceed with the required steps to definitively resolve any remaining ambiguity. This is done by ensuring all actual values are provided over arbitrary variables ensuring no unbound variables. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact.\n\n ## Discrepancies\n\n If I indicate there\’s a discrepancy or request specific changes (such as to reformat, correct errors, or add missing lines), please correct these and resume delivering segments from the corrected point.\n\n ## Alignment Enforcement\n\n Identify the sum of all functions and the exact count of lines of code in your proposed revision vs the initial count ensuring a numerical alignment within reason of the expected range. If a gross mismatch is detected, you are required to immediately halt and ascertain the exact count of lines of code in your revision and try again directly in your response for a total of three retries before quitting and throw an error.\n\n # Finalization\n\n > *"Automation reduces toil, but people are still accountable. Adding new toil needs a very strong justification. We build automation and processes that make the best use of our contributors\' limited time and energy."*.\n\n Reduce the potential for human error by eliminating all unneeded manual user intervention within the script in favor of automation. For example, incorporating all necessary checks and validations within the script itself. Finally, precisely parse your entire updated revision in manageable segments with a max limit of 4000 total lines of code to stdout for review and testing.'},
    { title: '😈 Test Result', prompt: '## Test Results\n\n **Maintain technical and concise communication**\n\n The revision resulted in an unsuccessful test and failed. You are required to analyze the terminal output and leverage chain of thought reasoning in order to systematically mitigate all conflicts detected. Proceed to analyze the terminal output and meticulously implement all suggestions/optimizations/recommendations directly within your response. Consistently accommodate for all code changes with cohesion. Ensure all code respects the established hierarchical order to satisfy modular execution and workflow. Examine all functions in isolation and ensure they work before integrating them dynamically. Ensure idempotency using step-by-step isolation and validation. This structured approach ensures that each phase of the project is handled with a focus on meticulous detail, systematic progression, and continuous improvement, ensuring all underlying logic remains intact.\n\n **Terminal Output**\n\n' + myresults + '\n ### Definitions\n\n - **Error Definition:** Code containing any placeholders is considered invalid and unacceptable as this indicates incomplete logic or functionality.\n - **Error Resolution:** If your initial submission contains any placeholders, you must replace all placeholders with functional code.\n This revision may require iterative adjustments to ensure complete removal of placeholders and full compliance with the project requirements. If I indicate there’s a discrepancy or request specific changes (such as to reformat, correct errors, or add missing lines), please correct these and resume delivering segments from the corrected point. Confirm that all lines are complete and that the logic aligns with the requested original structure.  Once the script functionality is confirmed, proceed to precisely parse the entire updated revision to stdout for review and testing ensuring to:\n - Reference the Shellcheck codebase guidelines and manually ensure all coinciding conflicts have been correctly linted.\n  - Separate variable declarations from assignments.\n - Explicitly check the exit status of the relevant command to ensure consistent behavior.\n - \`&>\` for redirecting both stdout and stderr (use \`>file 2>&1\` instead).\n Ensure alignment with copy and paste operations by providing the complete code in appropriate formatting within a unique code block to ensure the text will be pasted in the expected format. Work around the existing code flow without leaving anything out, provided your revision matches the full context of the entire script and is inclusive of all logic, this will avoid any further syntax issues.'},
    { title: '🦜 Primer', prompt: 'Translate in correct '+ myresults +' the following sentence.' }
];
(function() {
    'use strict';
    // MAIN TOP BAR
    let main_top_bar = document.createElement('div');
    main_top_bar.style.position = 'fixed';
    main_top_bar.style.top = '10px';
    main_top_bar.style.left = '50%';
    main_top_bar.style.transform = 'translateX(-50%)';
    main_top_bar.style.width = 'auto';
    main_top_bar.style.height = '30px';
    main_top_bar.style.paddingTop = '8px';
    main_top_bar.style.display = 'flex';
    main_top_bar.style.alignItems = 'center';
    main_top_bar.style.zIndex = '9999';
    // BUTTON GENERATION
    for (let i = 0; i < prompts.length; i++) {
        let item = prompts[i];
        let link = document.createElement('a');
        link.href = 'https://www.example.com';
        link.textContent = item.title;
        link.style.marginRight = '40px';
        link.addEventListener('click', function(e) {
            let inputEvent = new Event('input', {
              bubbles: true,
              cancelable: true,
            });
            let textbox = document.getElementById("prompt-textarea");
            e.preventDefault();
            textbox.innerText = item.prompt + "\n\n" + myresults;
            textbox.dispatchEvent(inputEvent);
            textbox.focus();
        });
        main_top_bar.appendChild(link);
    }
    // ADD ALL BUTTONS
    document.body.appendChild(main_top_bar);
})();