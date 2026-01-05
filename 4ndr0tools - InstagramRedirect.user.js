// ==UserScript==
// @name         4ndr0tools - Instagram Redirect
// @namespace    http://github.com/4ndr066/userscripts
// @author       4ndr0666
// @version      1.0.0
// @description  Privacy redirect for IG media to dumpor.com.
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20InstagramRedirect.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20InstagramRedirect.user.js
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @run-at       document-start
// @match        *://instagram.com/*
// @match        *://*.instagram.com/*
// ==/UserScript==

let redirectInstagram = () => {

  let url = "dumpor.com"; // change to some other ig viewer if this isn't working.
  let key = "/v"; // when you open a profile with the viewer it will show some other value  , eg dumpor/v/profile, set it to that,
  //and if it is not there , set it to "".

  if (window.location.pathname.indexOf("/p/") == 0) {
    window.stop();
    location.hostname = url;
  } else if (window.location.pathname == "/") {
    window.stop();
    location.hostname = url;
  } else if (window.location.pathname === "/accounts/login/") {
    window.stop();
    let oldQuery = window.location.search;
    let newQuery = oldQuery.replace("?next=/", "/");
    let newURL =
      window.location.protocol + "//" + url + key + newQuery +
      window.location.hash;
    window.location.replace(newURL);
  } else {
    window.stop();
    let oldUrlPath = window.location.pathname;
    let newURL =
      window.location.protocol + "//" + url + key + oldUrlPath + window.location.search + window.location.hash;
    window.location.replace(newURL);
  }
};

redirectInstagram();
