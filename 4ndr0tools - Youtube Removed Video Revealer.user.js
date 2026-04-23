// ==UserScript==
// @name         4ndr0tools - Youtube Removed Video Revealer
// @namespace    https://github.com/4ndr0666/userscripts
// @author       4ndr0666
// @version      2.0.0
// @description  Restores titles for removed or private videos in YouTube playlists
// @license      UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Youtube%20Removed%20Video%20Revealer.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Youtube%20Removed%20Video%20Revealer.user.js
// @icon         data:image/png;base64,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
// @icon64       data:image/png;base64,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
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
