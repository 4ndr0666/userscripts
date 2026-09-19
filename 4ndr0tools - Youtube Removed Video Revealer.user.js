// ==UserScript==
// @name         4ndr0tools - Youtube Removed Video Revealer
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      2.0.0
// @description  Restores titles for removed or private videos in YouTube playlists
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Youtube%20Removed%20Video%20Revealer.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Youtube%20Removed%20Video%20Revealer.user.js
// @icon           data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match        *://*.youtube.com/*
// @noframes
// @grant        GM_xmlhttpRequest
// @connect      web.archive.org
// @require      https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.5/cash.min.js
// ==/UserScript==

// REVISION: Migrated from 'var' to 'const' for immutable global styling constants to prevent accidental reassignment.
const darkModeBackground = "#000099";
const lightModeBackground = "#b0f2f4";
const darkModeLinkColor = "#f1f1f1";

document.addEventListener('yt-navigate-start', handleNavigateStart);
document.addEventListener('yt-navigate-finish', handleNavigateFinish);
document.addEventListener('yt-action', handlePageDataLoad);

/* UTILITY */
function escapeHTML(unsafe) {
    // REVISION: Arrow function for conciseness.
    return unsafe.replace(
        /[\u0000-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u00FF]/g,
        c => '&#' + ('000' + c.charCodeAt(0)).substr(-4, 4) + ';'
    );
}

function getWaybackVideoAvailabilityCheckURL(videoID) {
    return `https://web.archive.org/cdx/search/cdx?url=wayback-fakeurl.archive.org/yt/${videoID}&fl=timestamp,original&output=json&closest=20050101000000&limit=1`;
}

function waybackTimestampToDateString(timestamp) {
    return `${timestamp.slice(6, 8)}.${timestamp.slice(4, 6)}.${timestamp.slice(0, 4)}`;
}

// REVISION: New Helper function to wrap GM_xmlhttpRequest in a Promise for cleaner async/await usage.
// Prevents callback hell and allows for standardized try/catch blocks.
function fetchWaybackData(url) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: (response) => {
                try {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject(new Error(`HTTP Error: ${response.status}`));
                    }
                } catch (err) {
                    reject(new Error(`Parsing Error: ${err.message}`));
                }
            },
            onerror: (err) => reject(err)
        });
    });
}

function handlePageDataLoad(event) {
    // REVISION: Used optional chaining (?.) to prevent TypeError if event or its properties are null/undefined.
    // REVISION: Used .includes() instead of .indexOf() >= 0 for boolean checks.
    if (event?.detail?.actionName?.includes("yt-append-continuation")) {
        if (window.location.href.includes("/playlist?")) {
            extractIDsFullView();
        }
    }
}

function handleNavigateStart() {
    // REVISION: Changed `var` to `const` for block scoping.
    const filmotTitles = $(".filmot_title");
    filmotTitles.text("");
    filmotTitles.removeClass("filmot_title");

    const filmotChannels = $(".filmot_channel");
    filmotChannels.text("");
    filmotChannels.attr("onclick", "");
    filmotChannels.removeClass("filmot_channel");

    cleanUP();
}

function handleNavigateFinish() {
    cleanUP();

    // REVISION: Replaced indexOf with includes for better readability and strict boolean evaluation.
    if (window.location.href.includes("/playlist?")) {
        setTimeout(extractIDsFullView, 500);
    } else if (window.location.href.includes("/watch?")) {
        setTimeout(checkIfPrivatedOrRemoved, 500);
    }
}

function cleanUP() {
    // REVISION: Method chaining for jQuery/cash objects for conciseness.
    $(".filmot_hide").show().removeClass("filmot_hide");
    $(".filmot_newimg").remove();
    $(".filmot_highlight").css("background-color", "").removeClass("filmot_highlight");
    $("#TitleRestoredDiv").remove();
    $(".filmot_c_link").remove();
    $(".filmot_button").remove();

    window.ArchivedIDS = {};
    window.RecoveredIDS = {};
    window.DetectedIDS = {};
}

// REVISION: Converted to async function to handle Promises effectively.
async function checkIfPrivatedOrRemoved() {
    // REVISION: Added optional chaining to prevent crashes if ytInitialPlayerResponse is not fully formed.
    const playabilityStatus = unsafeWindow?.ytInitialPlayerResponse?.playabilityStatus;
    if (!playabilityStatus) return;

    const status = playabilityStatus.status;
    // REVISION: Strict equality check (===) to prevent type coercion.
    if (status === "ERROR" || (status === "LOGIN_REQUIRED" && !playabilityStatus.valueOf().desktopLegacyAgeGateReason)) {
        const id = unsafeWindow?.ytInitialData?.currentVideoEndpoint?.watchEndpoint?.videoId;
        if (id && id.length >= 11) {
            let parentItem = $("ytd-background-promo-renderer");
            if (!parentItem.length) {
                parentItem = $("div#player");
            }

            const waybackButton = $(document.createElement('button-view-model'))
                .addClass("filmot_button yt-spec-button-view-model")
                .css("margin-bottom", "10px");

            const anchor = $('<a>')
                .addClass("yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--enable-backdrop-filter-experiment")
                .attr({
                    "target": "_blank",
                    "aria-haspopup": "false",
                    "force-new-state": "true",
                    "aria-disabled": "false",
                    "aria-label": "Check/view Wayback archive",
                    "videoID": id
                })
                .css("background-color", "thistle")
                .one("click", async function() { // REVISION: Made click handler async to use await.
                    const $this = $(this);
                    $this.css("opacity", 0.5);
                    $this.find("#state-text").text("Checking...");

                    const videoID = $this.attr("videoID");
                    console.log(`[Filmot] [DEBUG] Checking Wayback Machine for archives of video "${videoID}"...`);

                    try {
                        // REVISION: Refactored to use async/await wrapper for GM_xmlhttpRequest.
                        const data = await fetchWaybackData(getWaybackVideoAvailabilityCheckURL(videoID));
                        if (data && data.length > 1) {
                            const timestamp = data[1][0];
                            $this.attr("href", `https://web.archive.org/web/${timestamp}oe_/${data[1][1]}`)
                                .css("background-color", "limegreen")
                                .find("#state-text").text("Available: " + waybackTimestampToDateString(timestamp));
                        } else {
                            $this.css("background-color", "lightcoral")
                                .find("#state-text").text("Not Available");
                        }
                    } catch (err) {
                        console.error("Error fetching/parsing video archive availability data from Wayback Machine!", err);
                        $this.css("background-color", "lightcoral").find("#state-text").text("Error Checking");
                    } finally {
                        $this.css("opacity", 1);
                    }
                });

            const iconWrapper = $('<div>').addClass("yt-spec-button-shape-next__icon").attr("aria-hidden", "true");
            const icon = $('<img>').attr("src", "https://www.google.com/s2/favicons?domain=archive.org").css({"margin-left": "3px", "margin-top": "5px"});
            const text = $('<div>').addClass("yt-spec-button-shape-next__button-text-content").attr("id", "state-text").text("Check For Archives");

            iconWrapper.append(icon);
            anchor.append(iconWrapper, text);
            waybackButton.append(anchor);
            parentItem.find("div#buttons").prepend(waybackButton);

            window.deletedIDs = id;
            window.deletedIDCnt = 1;
            window.DetectedIDS[id] = 1;
            processClick(2, 0);
        }
    }
}

function createRestoreButton() {
    console.log("[Filmot] [DEBUG] Creating 'Restore Titles' button in playlist description box.");

    // REVISION: Changed `var` to `const`.
    const metactionbars = Array.from(document.querySelectorAll('.description.style-scope.ytd-playlist-header-renderer, page-header-view-model-wiz__page-header-headline-info, .yt-page-header-view-model__page-header-content-metadata--page-header-content-metadata-overlay, div.page-header-view-model-wiz__page-header-content > div.page-header-view-model-wiz__page-header-headline-info, .play-menu.ytd-playlist-header-renderer')).filter(el => el.offsetParent !== null);

    // REVISION: Strict length check.
    if (metactionbars && metactionbars.length > 0) {
        // REVISION: Changed `var` to `let` for loop index.
        for (let i = metactionbars.length - 1; i >= 0; i--) {
            if (!metactionbars[i].checkVisibility()) {
                continue;
            }

            // REVISION: Changed `var` to `const` for local DOM elements.
            const containerDiv = document.createElement('div');
            containerDiv.id = 'TitleRestoredDiv';
            containerDiv.style.textAlign = 'center';

            const button = document.createElement('button');
            button.id = 'TitleRestoredBtn';
            button.textContent = 'Restore Titles';

            const link = document.createElement('a');
            link.href = 'https://filmot.com';
            link.target = '_blank';
            link.style.color = 'white';
            link.style.fontSize = 'large';
            link.textContent = 'Powered by filmot.com';

            containerDiv.appendChild(document.createElement('br'));
            containerDiv.appendChild(button);
            containerDiv.appendChild(document.createElement('br'));
            containerDiv.appendChild(link);

            metactionbars[i].insertBefore(containerDiv, metactionbars[i].firstChild);
            break;
        }
    } else {
        console.log("[Filmot] [DEBUG] ERROR: Could not locate playlist sidebar to place restore button.");
    }
}

function extractIDsFullView() {
    window.deletedIDs = "";
    window.deletedIDCnt = 0;
    // REVISION: Changed `var` to `let` as these are modified in the block.
    let deletedIDs = "";
    let deletedIDsCnt = 0;

    const rendererSelector = "h3.ytd-playlist-video-renderer";
    $(rendererSelector).filter(function() {
        if ($(this).attr('aria-label')) return false;

        const meta = $(this).parents("#meta");
        // REVISION: Strict equality check.
        return meta.length !== 0;
    }).each(function() {
        const ahref = $(this).children("a.yt-simple-endpoint");

        if (ahref.length > 0) {
            const href = ahref.attr("href");
            const checked = ahref.attr("filmot_chk");
            let idMatch = href.match(/v=[0-9A-Za-z_\-]*/gm);

            if(idMatch) {
                // REVISION: Extracted ID cleanly without relying on implicit string coercion that could fail.
                let id = String(idMatch[0]).substring(2);

                if (id.length >= 11 && (!checked || checked !== "1")) {
                    ahref.attr("filmot_chk", "1");

                    const waybackButton = $(document.createElement('button-view-model'))
                        .addClass("filmot_button yt-spec-button-view-model")
                        .attr("id", "button-wayback")
                        .css({"margin-right": "5px", "margin-top": "2vw"});

                    const anchor = $('<a>')
                        .addClass("yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--enable-backdrop-filter-experiment")
                        .attr({
                            "target": "_blank",
                            "aria-haspopup": "false",
                            "force-new-state": "true",
                            "aria-disabled": "false",
                            "aria-label": "Check/view Wayback archive"
                        })
                        .css("background-color", "thistle");

                    const iconWrapper = $('<div>').addClass("yt-spec-button-shape-next__icon").attr("aria-hidden", "true");
                    const icon = $('<img>').attr("src", "https://www.google.com/s2/favicons?domain=archive.org").css({"margin-left": "3px", "margin-top": "5px"});
                    const text = $('<div>').addClass("yt-spec-button-shape-next__button-text-content").attr("id", "state-text").text("Check For Archives");

                    iconWrapper.append(icon);
                    anchor.append(iconWrapper, text);
                    waybackButton.append(anchor);
                    $(this).parents("#container").append(waybackButton);

                    const archiveData = window.ArchivedIDS[id];
                    // REVISION: Improved type checking for archiveData object.
                    if (typeof archiveData === "object" && archiveData !== null) {
                        anchor.attr("href", archiveData.url)
                            .css("background-color", "limegreen")
                            .find("#state-text").text("Available: " + waybackTimestampToDateString(archiveData.timestamp));
                    } else if (archiveData === false) {
                        anchor.css("background-color", "lightcoral")
                            .find("#state-text").text("Not Available");
                    } else {
                        anchor.attr("videoID", id).one("click", async function() { // REVISION: Made click handler async.
                            const $this = $(this);
                            $this.css("opacity", 0.5);
                            $this.find("#state-text").text("Checking...");

                            const videoID = $this.attr("videoID");
                            console.log(`[Filmot] [DEBUG] Checking Wayback Machine for archives of video "${videoID}"...`);

                            try {
                                const data = await fetchWaybackData(getWaybackVideoAvailabilityCheckURL(videoID));
                                if (data && data.length > 1) {
                                    const timestamp = data[1][0];
                                    const newArchiveData = {
                                        timestamp,
                                        url: `https://web.archive.org/web/${timestamp}oe_/${data[1][1]}`
                                    };
                                    window.ArchivedIDS[videoID] = newArchiveData;

                                    $this.attr("href", newArchiveData.url)
                                        .css("background-color", "limegreen")
                                        .find("#state-text").text("Available: " + waybackTimestampToDateString(timestamp));
                                } else {
                                    window.ArchivedIDS[videoID] = false;
                                    $this.css("background-color", "lightcoral")
                                        .find("#state-text").text("Not Available");
                                }
                            } catch (err) {
                                console.error("Error fetching/parsing video archive availability data from Wayback Machine!", err);
                                $this.css("background-color", "lightcoral").find("#state-text").text("Error Checking");
                            } finally {
                                $this.css("opacity", 1);
                            }
                        });
                    }

                    window.DetectedIDS[id] = 1;
                    if (deletedIDs.length > 0) {
                        deletedIDs += ",";
                    }
                    deletedIDs += id;
                    deletedIDsCnt++;
                }
            }
        }
    });

    if (deletedIDs.length > 0) {
        window.deletedIDs = deletedIDs;
        window.deletedIDCnt = deletedIDsCnt;

        // REVISION: Strict null check instead of ==.
        if (document.getElementById("TitleRestoredBtn") === null) {
            console.log("[Filmot] [DEBUG] There are " + deletedIDsCnt + " titles to restore.");
            createRestoreButton();
        }

        processClick(1, 0);
    }
}

function reportAJAXError(error) {
    alert("Error fetching API results " + error);
}

function rgb2lum(rgb) {
    // REVISION: Added null check for match result to prevent Uncaught TypeError.
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (match && match.length === 4) {
        const R = parseInt(match[1], 10) / 255.0;
        const G = parseInt(match[2], 10) / 255.0;
        const B = parseInt(match[3], 10) / 255.0;
        return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }
    return 1;
}

function processJSONResultSingleVideo(fetched_details, format) {
    let darkMode = -1;
    for (let i = 0; i < fetched_details.length; ++i) {
        // REVISION: Changed `var` to `const`.
        const meta = fetched_details[i];
        // REVISION: Ensure title is safely handled using logical OR if undefined.
        const escapedTitle = meta.title || "Unknown Title";

        let item;
        const promoRenderer = $("ytd-background-promo-renderer");
        if (promoRenderer.length) {
            item = promoRenderer.find("div.promo-message").first();
            promoRenderer.css("padding-top", "10px");
        } else {
            item = $("#subreason.yt-player-error-message-renderer").first();
            const playlistPanel = $("ytd-playlist-panel-renderer");
            // REVISION: Strict inequality check.
            if (!playlistPanel.length || playlistPanel.attr("hidden") !== undefined) {
                $("div#player").css("position", "unset");
            }
        }

        if (darkMode === -1) {
            const lum = rgb2lum(item.css("color"));
            darkMode = (lum > 0.51) ? 1 : 0;
        }

        if (!window.RecoveredIDS[meta.id]) {
            window.RecoveredIDS[meta.id] = 1;
            // REVISION: Nullish coalescing (??) for assigning fallback channel name.
            meta.channelname = meta.channelname ?? meta.channelid;

            const brEl = document.createElement('br');
            item[0].appendChild(brEl);

            const poweredByFilmot = document.createElement('a');
            poweredByFilmot.style.fontSize = 'large';
            poweredByFilmot.className = 'yt-simple-endpoint style-scope yt-formatted-string';
            poweredByFilmot.href = 'https://filmot.com';
            poweredByFilmot.target = '_blank';
            poweredByFilmot.textContent = 'Title and Channel from filmot.com';
            item[0].appendChild(poweredByFilmot);

            const titleContainer = document.createElement('h2');
            titleContainer.textContent = 'Title: ';
            const titleLink = document.createElement('a');
            titleLink.className = 'filmot_c_link yt-simple-endpoint style-scope yt-formatted-string';
            titleLink.dir = 'auto';
            titleLink.href = 'https://filmot.com/video/' + meta.id;
            titleLink.textContent = escapedTitle;
            // REVISION: Strict equality.
            titleLink.style.color = (darkMode === 0 ? 'black' : 'white');
            titleContainer.appendChild(titleLink);
            item[0].appendChild(titleContainer);

            const channelContainer = document.createElement('h2');
            channelContainer.textContent = 'Channel: ';
            const channelLink = document.createElement('a');
            channelLink.className = 'filmot_c_link yt-simple-endpoint style-scope yt-formatted-string';
            channelLink.dir = 'auto';
            channelLink.href = 'https://www.youtube.com/channel/' + meta.channelid;
            channelLink.textContent = meta.channelname;
            channelContainer.appendChild(channelLink);
            item[0].appendChild(channelContainer);

            const newThumb = document.createElement('img');
            newThumb.id = 'filmot_newimg';
            newThumb.className = 'style-scope yt-img-shadow filmot_newimg';
            newThumb.onclick = function(event) {
                prompt('Full Title', escapedTitle);
                event.stopPropagation();
                return false;
            };
            newThumb.title = escapedTitle;
            newThumb.width = 320;
            newThumb.src = 'https://filmot.com/vi/' + meta.id + '/default.jpg';
            item[0].appendChild(newThumb);
        }
    }
}

function processJSONResultFullView(fetched_details, format) {
    let darkMode = -1;

    for (let i = 0; i < fetched_details.length; ++i) {
        // REVISION: Changed `var` to `const`.
        const meta = fetched_details[i];
        window.RecoveredIDS[meta.id] = 1;

        // REVISION: Nullish coalescing assignment (??=).
        meta.channelname ??= meta.channelid;

        const rendererSelector = "#container.ytd-playlist-video-renderer";
        // REVISION: Template literals for string concatenation in selector.
        $(rendererSelector).filter(function() {
            return $(this).find(`a.ytd-playlist-video-renderer[href*='${meta.id}']`).length > 0;
        }).each(function(index, element) {
            const escapedTitle = meta.title || "Unknown Title";

            const item = $(element);
            item.addClass("filmot_highlight");
            const titleItem = item.find("#video-title");
            titleItem.text(escapedTitle);
            titleItem.attr("title", escapedTitle);
            titleItem.attr("aria-label", escapedTitle);
            titleItem.addClass("filmot_title");

            if (darkMode === -1) {
                const lum = rgb2lum(titleItem.css("color"));
                darkMode = (lum > 0.51) ? 1 : 0;
            }
            item.css("background-color", darkMode === 0 ? lightModeBackground : darkModeBackground);

            const channelItem = titleItem.parent();
            channelItem.find("a.filmot_c_link").remove();

            const channelLinkElement = document.createElement('a');
            channelLinkElement.className = 'filmot_c_link yt-simple-endpoint style-scope yt-formatted-string';
            channelLinkElement.dir = 'auto';
            channelLinkElement.href = 'https://www.youtube.com/channel/' + meta.channelid;
            channelLinkElement.textContent = meta.channelname;
            if (darkMode === 1) {
                channelLinkElement.style.color = darkModeLinkColor;
            }

            channelItem[0].appendChild(channelLinkElement);

            item.find("#byline-container").attr("hidden", false);
            item.find(".filmot_newimg").remove();

            const newThumbElement = document.createElement('img');
            newThumbElement.id = 'filmot_newimg';
            newThumbElement.className = 'style-scope yt-img-shadow filmot_newimg';
            newThumbElement.style.width = '100%';
            newThumbElement.src = 'https://filmot.com/vi/' + meta.id + '/default.jpg';
            newThumbElement.title = escapedTitle;
            newThumbElement.onclick = function(event) {
                prompt('Full Title', escapedTitle);
                event.stopPropagation();
                return false;
            };

            item.find("yt-image")[0].appendChild(newThumbElement);
            item.find("img.ytCoreImageHost").addClass("filmot_hide").hide();

            let filmotButton = item.find("button-view-model#button-view-filmot");
            if (filmotButton.length) {
                filmotButton.find("a").attr("href", "https://filmot.com/video/" + meta.id);
            } else {
                filmotButton = $(document.createElement('button-view-model'))
                    .addClass("filmot_button yt-spec-button-view-model")
                    .attr("id", "button-view-filmot")
                    .css({
                        "margin-right": "5px",
                        "margin-top": "2vw"
                });
                const anchor = $('<a>')
                    .addClass("yt-spec-button-shape-next yt-spec-button-shape-next--filled yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--enable-backdrop-filter-experiment")
                    .attr({
                        "target": "_blank",
                        "aria-haspopup": "false",
                        "force-new-state": "true",
                        "aria-disabled": "false",
                        "href": "https://filmot.com/video/" + meta.id,
                        "aria-label": "View on Filmot"
                    })
                    .css("padding-right", "0");
                const iconWrapper = $('<div>')
                    .addClass("yt-spec-button-shape-next__icon")
                    .attr("aria-hidden", "true");
                const icon = $('<img>')
                    .attr("src", "https://www.google.com/s2/favicons?domain=filmot.com")
                    .css({
                        "margin-left": "3px",
                        "margin-top": "5px"
                    });
                iconWrapper.append(icon);
                anchor.append(iconWrapper);
                filmotButton.append(anchor);
                item.find("button-view-model").before(filmotButton);
            }
        });
    }
    $("#TitleRestoredBtn").text(Object.keys(window.RecoveredIDS).length + " of " + Object.keys(window.DetectedIDS).length + " restored");
}

// REVISION: Converted processClick to async/await for clearer asynchronous flow and error handling.
async function processClick(format, nTry = 0) {
    const maxTries = 2;
    // REVISION: Use template literals.
    const apiURL = `https://filmot.com/api/getvideos?key=md5paNgdbaeudounjp39&id=${window.deletedIDs}`;

    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();

        // REVISION: Strict equality check.
        if (format === 1) {
            processJSONResultFullView(data, format);
        } else if (format === 2) {
            processJSONResultSingleVideo(data, format);
        }
    } catch (error) {
        if (nTry >= maxTries) {
            console.error("filmot fetch error:", error);
            reportAJAXError(`${apiURL} ${JSON.stringify(error.message)}`);
            return;
        }
        // Wait briefly if we wanted to throttle, then retry by calling function again recursively.
        // Using await to ensure recursive stack handles promise resolution correctly.
        await processClick(format, nTry + 1);
    }
}

function ButtonClickActionFullView(zEvent) {
    processClick(2, 0);
    return false;
}
