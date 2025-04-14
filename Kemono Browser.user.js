// ==UserScript==
// @name        Kemono Browser
// @namespace   Violentmonkey Scripts
// @version     1.9.7
// @description Adds a button at the bottom right of all kemono, coomer & nekohouse supported creator websites that redirects to the corresponding page.
// @author      zWolfrost
// @license     MIT
// @match       *://*.patreon.com/*
// @match       *://*.fanbox.cc/*
// @match       *://*.pixiv.net/*
// @match       *://*.discord.com/*
// @match       *://*.fantia.jp/*
// @match       *://*.boosty.to/*
// @match       *://*.dlsite.com/*
// @match       *://*.gumroad.com/*
// @match       *://*.subscribestar.com/*
// @match       *://*.subscribestar.adult/*
// @match       *://*.onlyfans.com/*
// @match       *://*.fansly.com/*
// @match       *://*.candfans.jp/*
// @match       *://*.x.com/*
// @connect     kemono.su
// @connect     coomer.su
// @connect     nekohouse.su
// @connect     fansly.com
// @icon        https://kemono.su/static/favicon.ico
// @grant       GM.xmlHttpRequest
// @grant       GM.getResourceUrl
// @grant       GM.openInTab
// @resource    kemonoIcon https://i.postimg.cc/D0K6jqjV/icon.png
// @resource    coomerIcon https://i.postimg.cc/D0K6jqjV/icon.png
// @resource    nekohouseIcon https://i.postimg.cc/c6qfxKSp/icon.png
// @resource    updateIcon https://i.postimg.cc/YS0rkk7L/icon.png
// @noframes
// ==/UserScript==
"use strict";


///////////////// OPTIONS /////////////////

// Buttons to include
const BUTTONS = {
	KEMONO: true,
	COOMER: true,
	NEKOHOUSE: false
}

// Whether to open the url in a new tab by default
// Note that ctrl+clicking the button does the opposite of the default behavior
const OPEN_IN_NEW_TAB = true;

// Button classes to apply
const BUTTONS_CLASSES = {
	"include-icon": true,
	"include-text": true,
	"animate-click": true
}

// Buttons CSS
const BUTTONS_CSS = `
#_kemono-browser-container {
	--status-prefix: "Creator: ";
}

/* WEBSITE-SPECIFIC BUTTON TRANSLATION */
#_kemono-browser-container.discord { transform: translate(-248px, -75px); }


#_kemono-browser-container {
	display: block !important;
	position: fixed !important;

	z-index: 999999 !important;
	right: 0 !important;
	bottom: 0 !important;
}


#_kemono-browser-container > a {
	display: none !important;
	position: relative !important;

	min-width: 1vh !important;
	min-height: 1vh !important;
	max-width: max-content !important;
	max-height: max-content !important;

	align-items: center !important;
	justify-content: center !important;
	gap: 0.3vh !important;

	border: 0.2vh solid black !important;
	border-radius: 0.4vh !important;
	padding: 0.6vh !important;
	margin: 1.2vh !important;
	margin-left: auto !important;

	font-family: arial !important;
	font-weight: bold !important;
	font-size: 1.9vh !important;

	line-height: normal !important;
	text-decoration: none !important;
	cursor: pointer !important;
	user-select: none !important;

	transition-property: top, right, bottom, left, box-shadow !important;
	transition-duration: 0.05s !important;
	transition-timing-function: ease-out !important;
}
#_kemono-browser-container > a.disabled {
	pointer-events: none !important;
	opacity: 0.5 !important;
}
#_kemono-browser-container > a:hover { filter: brightness(90%); }
#_kemono-browser-container > a:active { filter: brightness(75%); }


#_kemono-browser-container > a > img {
	display: none !important;
}
#_kemono-browser-container > a.include-icon > img {
	display: inline-block !important;
	width: 2.3vh !important;
	height: 2.3vh !important;
}
#_kemono-browser-container > a.disabled[data-status=update] > img {
	animation: rotating 1s linear infinite !important;
}
@keyframes rotating {
	to { transform: rotate(360deg); }
}


#_kemono-browser-container > a.animate-click {
	bottom: 0.0vh;
	right: 0.0vh;
	box-shadow: black 0.05vh 0.05vh, black 0.1vh 0.1vh, black 0.15vh 0.15vh, black 0.2vh 0.2vh,
		black 0.25vh 0.25vh, black 0.3vh 0.3vh, black 0.35vh 0.35vh, black 0.4vh 0.4vh;
}
#_kemono-browser-container > a.animate-click:active {
	bottom: -0.4vh;
	right: -0.4vh;
	box-shadow: none;
}


#_kemono-browser-container > a[data-status] { display: flex !important; background-color: #444444; color: white; }
#_kemono-browser-container > a.include-text[data-status]::after { content: var(--status-prefix) "Unknown (error " attr(data-status) ")"; }

#_kemono-browser-container > a[data-status=found] { background-color: green; color: white; }
#_kemono-browser-container > a.include-text[data-status=found]::after { content: var(--status-prefix) "Found"; }

#_kemono-browser-container > a[data-status=incomplete] { background-color: gold; color: black; }
#_kemono-browser-container > a[data-status=incomplete] > img { filter: invert(1); }
#_kemono-browser-container > a.include-text[data-status=incomplete]::after { content: var(--status-prefix) "Incomplete"; }

#_kemono-browser-container > a[data-status=missing] { background-color: red; color: white; }
#_kemono-browser-container > a.include-text[data-status=missing]::after { content: var(--status-prefix) "Missing"; }

#_kemono-browser-container > a[data-status=pending] { background-color: gray; color: white; }
#_kemono-browser-container > a.include-text[data-status=pending]::after { content: var(--status-prefix) "Pending..."; }

#_kemono-browser-container > a[data-status=update] { background-color: gray; color: white; }
#_kemono-browser-container > a[data-status=update]::after { display: none; }
#_kemono-browser-container > a.disabled[data-status=update]::after { display: inline; content: "Waiting to avoid hitting rate-limit..."; }
`;


////////////// BUTTONS STUFF //////////////

// initialize buttons
function initButtons() {
	// get domain & classes to include
	const domain = window.location.hostname.split(".").slice(-2).join(".");

	// append css to head
	document.head.appendChild(document.createElement("style")).innerHTML = BUTTONS_CSS;

	// create button container
	const BUTTONS_CONTAINER = document.createElement("div");
	BUTTONS_CONTAINER.id = "_kemono-browser-container";
	BUTTONS_CONTAINER.classList.add(domain.split(".")[0]);
	document.body.prepend(BUTTONS_CONTAINER);

	// create update button
	BUTTONS.UPDATE = true;

	for (let key in BUTTONS) {
		if (BUTTONS[key]) {
			// create button element
			BUTTONS[key] = document.createElement("a");

			// set button icon
			let name = key.toLocaleLowerCase();
			BUTTONS[key].id = `_${name}-btn`;
			const ICON = document.createElement("img");
			GM.getResourceUrl(`${name}Icon`).then(url => {ICON.src = url});
			BUTTONS[key].prepend(ICON);

			// set button attributes
			let classes = Object.keys(BUTTONS_CLASSES).filter(key => BUTTONS_CLASSES[key]);
			BUTTONS[key].classList.add(...classes);
			BUTTONS[key].target = OPEN_IN_NEW_TAB ? "_blank" : "_self";
			BUTTONS[key].draggable = false;
			BUTTONS[key].querySelector("img").draggable = false;

			// add ctrl+click event listener
			BUTTONS[key].addEventListener("click", function(e) {
				if (e.ctrlKey) {
					e.preventDefault();

					if (this.target == "_self") GM.openInTab(this.href);
					else window.open(this.href, "_self");
				}
			});

			// append button to body
			BUTTONS_CONTAINER.prepend(BUTTONS[key]);
		}
		else {
			delete BUTTONS[key];
		}
	}

	if (domain in rateLimitedDomainMethods) {
		BUTTONS.UPDATE.classList.add("include-icon");
		BUTTONS.UPDATE.dataset.status = "update";
		BUTTONS.UPDATE.addEventListener("click", function() {
			rateLimitedDomainMethods[domain]().then(updateButtons)

			// wait a bit before re-enabling the button to avoid hitting the rate limit
			this.classList.add("disabled");
			setTimeout(() => this.classList.remove("disabled"), 3000);
		});
		delete BUTTONS.UPDATE;
	}
	else if (domain in domainMethods) {
		setInterval(() => updateButtons(domainMethods[domain]()), 222);
	}
}

// update buttons
function updateButtons(urls) {
	for (let key in BUTTONS) {
		let newURL = urls[key] ?? "";
		if (newURL != BUTTONS[key].dataset.href) {
			if (newURL) {
				// set the button to the pending status, while waiting for a response
				BUTTONS[key].href = newURL;
				BUTTONS[key].dataset.href = newURL;
				BUTTONS[key].dataset.status = "pending";

				getCreatorStatus(BUTTONS[key].dataset.href).then(status => {
					if (status == "incomplete" && newURL.includes("/post")) {
						BUTTONS[key].href = newURL.split("/").slice(0, -2).join("/");
					}

					if (BUTTONS[key].dataset.href == newURL) {
						BUTTONS[key].dataset.status = status;
					}
				});
			}
			else {
				BUTTONS[key].href = "";
				delete BUTTONS[key].dataset.href;
				delete BUTTONS[key].dataset.status;
			}
		}
	}
}


////////// URLs EXTRACTION STUFF //////////

const domainMethods = {
	"patreon.com": extractURLFromPatreon,
	"fanbox.cc": extractURLFromFanbox,
	"pixiv.net": extractURLFromPixiv,
	"discord.com": extractURLFromDiscord,
	"fantia.jp": extractURLFromFantia,
	"boosty.to": extractURLFromBoosty,
	"dlsite.com": extractURLFromDlsite,
	"gumroad.com": extractURLFromGumroad,
	"subscribestar.com": extractURLFromSubscribeStar,
	"subscribestar.adult": extractURLFromSubscribeStar,
	"onlyfans.com": extractURLFromOnlyFans,
	"candfans.jp": extractURLFromCandFans,
	"x.com": extractURLFromTwitter
}
const rateLimitedDomainMethods = {
	"fansly.com": extractURLFromFansly
}

// create the creator url with the given parameters
function compileURL({domains, service, userID=null, postID=null} = {}) {
	let obj = {};

	for (let domain of domains) {
		let redirectURL = `https://${domain}/${service}`;

		if (userID) {
			redirectURL += `/user/${userID}`;

			if (postID) {
				redirectURL += `/post/${postID}`;
			}
		}
		else continue;

		obj[domain.split(".").at(-2).toUpperCase()] = redirectURL;
	}

	return obj;
}

function extractURLFromPatreon() {
	return compileURL({
		domains: ["kemono.su"],
		service: "patreon",
		userID: extract(select("#__NEXT_DATA__"), '"creator":{"data":{"id":"', '"'),
		postID: extractNextUrlPath("posts")?.split("-")?.at(-1)
	})
}
function extractURLFromFanbox() {
	return compileURL({
		domains: ["kemono.su", "nekohouse.su"],
		service: "fanbox",
		userID: extract(select('meta[property="og:image"]', "content"), "/creator/", "/") ??
			extract(select(".styled__StyledUserIcon-sc-1upaq18-10[style]", "style"), "/user/", "/") ??
			extract(select('a[href^="https://www.pixiv.net/users/"]', "href"), "/users/", "/"),
		postID: extractNextUrlPath("posts")
	})
}
function extractURLFromPixiv() {
	return compileURL({
		domains: ["kemono.su", "nekohouse.su"],
		service: "fanbox",
		userID: extractNextUrlPath("users") ??
			select("button[data-gtm-user-id]", "data-gtm-user-id") ??
			select("a.user-details-icon[href]", "href")?.split("/").at(-1),
	})
}
function extractURLFromDiscord() {
	const pathname = window.location.pathname.split("/");

	const serverID = /\d/.test(pathname[2]) ? `${pathname[2]}#${pathname?.[3] ?? ""}` : null

	return serverID ? {
		"KEMONO": `https://kemono.su/discord/server/${serverID}`
	} : {}
}
function extractURLFromFantia() {
	return compileURL({
		domains: ["kemono.su", "nekohouse.su"],
		service: "fantia",
		userID: extractNextUrlPath("fanclubs") ?? extract(select(".fanclub-header > a[href]", "href"), "/fanclubs/", "/"),
		postID: extractNextUrlPath("posts") ?? extractNextUrlPath("products")
	})
}
function extractURLFromBoosty() {
	return compileURL({
		domains: ["kemono.su"],
		service: "boosty",
		userID: extractNextUrlPath("/"),
		postID: extractNextUrlPath("posts")
	})
}
function extractURLFromDlsite() {
	return compileURL({
		domains: ["kemono.su"],
		service: "dlsite",
		userID: extractNextUrlPath("maker_id", ".html") ?? extract(select(".maker_name[itemprop=brand] > a", "href"), "/maker_id/", "."),
		postID: concatOrFalsy("RE", extractNextUrlPath("product_id")?.replace(/\D/g, ""))
	})
}
function extractURLFromGumroad() {
	const json = select("script.js-react-on-rails-component[data-component-name^=Profile]")

	return compileURL({
		domains: ["kemono.su"],
		service: "gumroad",
		userID: extract(json, '"external_id":"', '"') ?? extract(json, '"seller":{"id":"', '"'),
		postID: select('meta[property="product:retailer_item_id"]', "content")
	})
}
function extractURLFromSubscribeStar() {
	return compileURL({
		domains: ["kemono.su", "nekohouse.su"],
		service: "subscribestar",
		userID: select('img[data-type="avatar"][alt]', "alt").toLowerCase(),
		postID: extractNextUrlPath("posts")
	})
}
function extractURLFromOnlyFans() {
	return compileURL({
		domains: ["coomer.su"],
		service: "onlyfans",
		userID: select("#content .g-avatar[href]", "href")?.split("/")[1],
		postID: select("div.b-post:not(.is-not-post-page)", "id")?.replace(/\D/g, "")
	})
}
async function extractURLFromFansly() {
	let userID = null;

	const userName = select("div.feed-item-name a.username-wrapper", "href")?.split("/").at(-1) ?? select("meta[property='og:title']", "content")?.slice(10);
	if (userName) {
		const res = await request({ method: "GET", url: `https://apiv3.fansly.com/api/v1/account?usernames=${userName}&ngsw-bypass=true` });
		userID = JSON.parse(res.responseText)?.response?.[0].id ?? null;
	}

	return compileURL({
		domains: ["coomer.su"],
		service: "fansly",
		userID: userID,
		postID: extractNextUrlPath("post")
	})
}
function extractURLFromCandFans() {
	return compileURL({
		domains: ["coomer.su"],
		service: "candfans",
		userID: extract(select("div.v-main__wrap"), "user/", "/"),
		postID: extractNextUrlPath("show")
	})
}
function extractURLFromTwitter() {
	return compileURL({
		domains: ["nekohouse.su"],
		service: "twitter",
		userID: select('div[data-testid="UserName"]') ? extractNextUrlPath("/") : null,
		postID: extractNextUrlPath("status")
	})
}


////////////// UTILITY STUFF //////////////

/**
 * get query element attribute shorthand
 * @returns {string}
 */
function select(query, attribute=null) {
	const el = document.querySelector(query);
	return attribute ? el?.getAttribute(attribute) : el?.innerHTML
}

/**
 * get string between a prefix and a suffix
 * @returns {string}
 */
function extract(string, prefix, suffix) {
	if (string == null) return null;

	let begIndex = string.indexOf(prefix);
	if (begIndex == -1) return null;
	else begIndex += prefix.length;

	let endIndex = string.indexOf(suffix, begIndex);
	if (endIndex == -1) endIndex = undefined;
	let result = string.slice(begIndex, endIndex);

	return result;
}

/**
 * get next path segment in url pathname after a prefix.
 * if prefix is blank, return the first path segment.
 * @returns {string}
 */
function extractNextUrlPath(prefix, suffix="/") {
	return extract(window.location.pathname, (prefix == "/") ? "/" : `/${prefix}/`, suffix);
}

/**
 * concatenate strings if they are truthy, otherwise return the first falsy string
 * @returns {string}
 */
function concatOrFalsy(...args)
{
	for (let arg of args) {
		if (!arg) return arg;
	}
	return args.join("");
}

/**
 * check if the creator exists on kemono
 * @returns {string}
 */
async function getCreatorStatus(url) {
	if (url) {
		const Url = new URL(url);

		if (Url.hostname == "kemono.su" || Url.hostname == "coomer.su") {
			if (Url.pathname.split("/")[1] == "discord") {
				const response = await request({ method: "GET", url: `https://${Url.hostname}/api/v1/discord/channel/lookup/${Url.pathname.split("/")[3]}` });

				if (response.status == 200) {
					let channels = JSON.parse(response.responseText);

					if (channels.length == 0) return "missing";
					else {
						if (channels.some(channel => channel.id == Url.hash.slice(1))) return "found";
						else return "incomplete";
					}
				}
				else return response.status;
			}
			else {
				const is_post = Url.pathname.includes("/post");

				if (is_post) {
					const postResponse = await request({ method: "HEAD", url: `https://${Url.hostname}/api/v1${Url.pathname}` });

					if (postResponse.status == 200 || postResponse.status == 202) return "found";
					Url.pathname = Url.pathname.split("/").slice(0, -2).join("/");
				}

				const response = await request({ method: "HEAD", url: `https://${Url.hostname}/api/v1${Url.pathname}/profile` });

				if (response.status == 200 || response.status == 202) return is_post ? "incomplete" : "found";
				else if (response.status == 404) return "missing";
				else return response.status;
			}
		}
		else if (Url.hostname == "nekohouse.su") {
			const response = await request({ method: "HEAD", url: url });
			const redirectUrl = response?.finalUrl;

			if (response.status == 200) {
				if (redirectUrl == url) return "found";
				else if (redirectUrl.includes("user")) return "incomplete";
				else if (redirectUrl.includes("artists")) return "missing";
			}
			else return response.status;
		}
	}

	return 400;
}

/**
 * make a request
 * @returns {Promise}
 */
function request(details) {
	return new Promise((resolve, reject) => {
		GM.xmlHttpRequest({ ...details, onload: resolve, onerror: reject });
	});
}


initButtons();
