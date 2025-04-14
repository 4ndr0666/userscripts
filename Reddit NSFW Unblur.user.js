// ==UserScript==
// @name            Reddit NSFW Unblur
// @namespace       https://greasyfork.org/users/821661
// @match           https://www.reddit.com/*
// @match           https://sh.reddit.com/*
// @grant           GM_addElement
// @grant           GM_setValue
// @grant           GM_getValue
// @run-at          document-body
// @noframes
// @version         2.4.2
// @icon            https://raw.githubusercontent.com/zenstorage/Reddit-NSFW-Unblur/main/assets/icon.png
// @author          hdyzen
// @description     Unblur nsfw in Shreddit
// @license         MIT
// @homepage        https://github.com/zenstorage/Reddit-NSFW-Unblur
// ==/UserScript==

// States for NSFW and Spoiler
const { state = true, nsfw = true, spoiler = false } = GM_getValue("states", false);

// Mutation observer
const observer = new MutationObserver(callback);

// Styles loaded
let styleLoaded = false;

// Styles link
const styleM = GM_addElement(document.head, "link", {
    rel: "stylesheet",
    href: "https://zenstorage.github.io/Reddit-NSFW-Unblur/userscript/style.css",
});
styleM.onload = () => {
    styleLoaded = true;
};

// Callback for MutationObserver
function callback(mutations) {
    const prompt = document.getElementsByTagName("xpromo-nsfw-blocking-container")?.[0]?.shadowRoot?.children[1];
    const blurreds = [...document.getElementsByTagName("shreddit-blurred-container")].filter(e => !e.hasAttribute("clicked") && e?.shadowRoot?.innerHTML && ((e.getAttribute("reason") === "nsfw" && nsfw) || (e.getAttribute("reason") === "spoiler" && spoiler)));
    const menuAdded = document.getElementById("menu-unblur");

    // Create menu
    if (!menuAdded && styleLoaded) initMenu();

    // Return if unblur off
    if (!state) return;

    // Remove prompt
    if (prompt) prompt.remove();

    // Click in blurred
    for (const blurred of blurreds) {
        blurred.firstElementChild.click();
        blurred.setAttribute("clicked", "");
    }
}

async function initMenu() {
    // Add menu
    const menu = GM_addElement(document.querySelector("header.v2 > nav"), "div", {
        id: "menu-unblur",
    });

    // Add toggle
    menu.addEventListener("click", e => {
        if (e.target.id === "menu" || e.target.id === "popup-toggle") menu.classList.toggle("active");
    });

    // Add popup html
    menu.innerHTML = `<div id="popup-toggle">Unblur</div><form id="status-container"><div id="status"></div><div id="container-toggle"><label for="toggle"><input id="toggle" name="toggle" type="checkbox"><svg viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3V12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12V3ZM8.6092 5.8744C9.09211 5.60643 9.26636 4.99771 8.99839 4.5148C8.73042 4.03188 8.12171 3.85763 7.63879 4.1256C4.87453 5.65948 3 8.61014 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 8.66747 19.1882 5.75928 16.5007 4.20465C16.0227 3.92811 15.4109 4.09147 15.1344 4.56953C14.8579 5.04759 15.0212 5.65932 15.4993 5.93586C17.5942 7.14771 19 9.41027 19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 9.3658 6.45462 7.06997 8.6092 5.8744Z"></path></svg></label></div><div id="selected-ops"><label for="toggle-nsfw"><input type="checkbox" name="toggle-nsfw" id="toggle-nsfw"><span class="slider"></span><span class="slider-label">Unblur NSFW</span></label><label for="toggle-spoiler"><input type="checkbox" name="toggle-spoiler" id="toggle-spoiler"><span class="slider"></span><span class="slider-label">Unblur Spoiler</span></label></div></form>`;

    await menu;
    const toggle = document.getElementById("toggle");
    const toggleNSFW = document.getElementById("toggle-nsfw");
    const toggleSpoiler = document.getElementById("toggle-spoiler");
    const form = document.getElementById("status-container");

    toggle.checked = state;
    toggleNSFW.checked = nsfw;
    toggleSpoiler.checked = spoiler;

    form.addEventListener("change", e => {
        GM_setValue("states", { state: toggle.checked, nsfw: toggleNSFW.checked, spoiler: toggleSpoiler.checked });
    });

    document.addEventListener("click", e => {
        if (!e.target.closest("#menu-unblur") && menu.classList.contains("active")) menu.classList.remove("active"); // Close menu
        if (e.target.closest("media-telemetry-observer")) e.preventDefault(); // Prevent open post when clicking on video
    });
}

// Start observing
observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
});

setTimeout(() => {
    const isShreddit = document.querySelector("shreddit-app");
    // Check if Shreddit
    if (!isShreddit) observer.disconnect();
}, 8000);
