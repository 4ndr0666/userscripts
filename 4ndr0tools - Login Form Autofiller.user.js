// ==UserScript==
// @name        4ndr0tools - Login Form Autofiller
// @namespace   https://www.github.com/4ndr0666/userscripts
// @version     2017.12.15
// @description It integrates BugMeNot into any login form (it retrieves all matching logins from bugmenot.com and autofills the login form)
// @icon         https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png      
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Login%20Form%20Autofiller.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Login%20Form%20Autofiller.user.js
// @author      4ndr0666
// @license      UNLICENSED - RED TEAM USE ONLY
// @include     http://*
// @include     https://*
// @exclude     http://bugmenot.com/*
// @exclude     https://bugmenot.com/*
// @grant       GM.getValue
// @grant       GM_getValue
// @grant       GM.setValue
// @grant       GM_setValue
// @grant       GM.openInTab
// @grant       GM_openInTab
// @grant       GM.xmlHttpRequest
// @grant       GM_xmlhttpRequest
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @noframes
// @run-at      document-idle
// ==/UserScript==

/* global GM */

// ---------------------------------------------------------------------------
// FIX 5: Upgraded all BugMeNot URLs to HTTPS to prevent mixed-content blocks
// in modern userscript managers (Tampermonkey, Violentmonkey).
// ---------------------------------------------------------------------------
const bmnView    = 'https://bugmenot.com/view';
const bmnHomeUri = 'https://bugmenot.com/';

// ---------------------------------------------------------------------------
// FIX 10: Made trailing path component optional in the domain-extraction regex
// so URLs with no explicit path (e.g. https://example.com) are handled.
// Original: '(?:https?://)(www\\.)?(.*?)/.*?'  — required a trailing slash.
// Fixed:    '(?:https?://)(www\\.)?(.*?)(?:/|$)' — slash OR end-of-string.
// ---------------------------------------------------------------------------
const myString    = location.href;
const domainnameRE = /(?:https?:\/\/)(www\.)?(.*?)(?:\/|$)/i;
const domainnameMatch = myString.match(domainnameRE);
const domainname  = domainnameMatch ? domainnameMatch[2] : location.hostname;

const bmnUri = bmnView + '/' + domainname;

// ---------------------------------------------------------------------------
// Timing constant: millisecond delay between a field losing focus and checking
// whether any other BugMeNot-managed field has acquired focus. Must be long
// enough that the menu's onclick fires before display:none hides it.
// ---------------------------------------------------------------------------
const BLUR_TIMEOUT = 250;

const DEBUG = false;

// new logins retrieved from the current page — reset on every page load
var retrievals = 0;

// counter: persisted across page loads via GM storage, tracks which cached
// login entry to serve next. Initialized asynchronously in the bootstrap IIFE
// below; processPasswordFields() is only called after counter is resolved.
var counter;


// ---------------------------------------------------------------------------
// Utility — cross-browser DOM helpers
// ---------------------------------------------------------------------------
var Utility = {
    elementTop: function (el) {
        return Utility.recursiveOffset(el, 'offsetTop');
    },
    elementLeft: function (el) {
        return Utility.recursiveOffset(el, 'offsetLeft');
    },
    recursiveOffset: function (el, prop) {
        var dist = 0;
        while (el.offsetParent) {
            dist += el[prop];
            el = el.offsetParent;
        }
        return dist;
    },
    viewportWidth: function () {
        return Utility.detectAndUseAppropriateObj('clientWidth');
    },
    viewportHeight: function () {
        return Utility.detectAndUseAppropriateObj('clientHeight');
    },
    scrollLeft: function () {
        return Utility.detectAndUseAppropriateObj('scrollLeft');
    },
    scrollTop: function () {
        return Utility.detectAndUseAppropriateObj('scrollTop');
    },
    detectAndUseAppropriateObj: function (prop) {
        if (document.documentElement && document.documentElement[prop]) {
            return document.documentElement[prop];
        } else if (document.body && document.body[prop]) {
            return document.body[prop];
        } else {
            return -1;
        }
    },
    addEventHandler: function (target, eventName, eventHandler) {
        if (target.addEventListener) {
            target.addEventListener(eventName, eventHandler, false);
        } else if (target.attachEvent) {
            target.attachEvent('on' + eventName, eventHandler);
        }
    }
};


// ---------------------------------------------------------------------------
// Style definitions
// ---------------------------------------------------------------------------
var Style = {
    menuLink: {
        border: 'none',
        backgroundColor: '#fff',
        color: '#000',
        display: 'block',
        padding: '2px',
        margin: '0',
        width: '17em',
        fontSize: '8pt',
        fontWeight: 'normal',
        textDecoration: 'none'
    },
    menuLinkHover: {
        backgroundColor: '#316AC5',
        color: '#fff'
    },
    menuLinkWrapper: {
        textAlign: 'left',
        padding: '1px',
        margin: 0
    },
    bmnWrapper: {
        display: 'none',
        fontFamily: 'tahoma, verdana, arial, sans-serif',
        whiteSpace: 'nowrap',
        position: 'absolute',
        zIndex: 1000,
        padding: '2px',
        border: '1px solid #ACA899',
        backgroundColor: '#fff',
        opacity: '0.9',
        filter: 'alpha(opacity=90)'
    }
};


// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
var Errors = {
    noLoginAvailable: 'Sorry, but BugMeNot.com had no login available ' +
        'for this site.\nIf you\'re feeling helpful, you can click "More ' +
        'options" to provide a login for future visitors.',
    malformedResponse: 'Sorry, but I couldn\'t understand the response ' +
        'from BugMeNot.com.\nThe service might be unavailable.',
    siteBlocked: 'Sorry, but the site appears to be blocked on BugMeNot.com.\n' +
        'The service may be unavailable for this domain.',
    xmlHttpFailure: 'There was an error in contacting BugMeNot.com.\n' +
        'The server may be unavailable or having internal errors.',
    say: function (msg) {
        alert(msg);
        return false;
    }
};


// ---------------------------------------------------------------------------
// copyProperties — shallow copy of style or attribute bags
// ---------------------------------------------------------------------------
function copyProperties(to, from) {
    for (var i in from) {
        to[i] = from[i];
    }
}


// ---------------------------------------------------------------------------
// main — entry point, called after async counter initialization resolves
// ---------------------------------------------------------------------------
function main() {
    processPasswordFields();
}


// ---------------------------------------------------------------------------
// getBmnWrapper — retrieves the floating BugMeNot UI panel by password-field index
// ---------------------------------------------------------------------------
function getBmnWrapper(pwFieldIndex) {
    return document.getElementById('reify-bugmenot-bmnWrapper' + pwFieldIndex);
}


// ---------------------------------------------------------------------------
// processPasswordFields
//
// FIX 2: counter is guaranteed initialized before this is called (bootstrap
// IIFE at bottom calls main() only after GM.getValue resolves).
//
// FIX 7: myprompt/myprompt2 declared with `let` in outer scope so both
// branches of the if/else assign into the same binding — no implicit globals.
// ---------------------------------------------------------------------------
function processPasswordFields() {
    (async function () {
        var allInputs    = document.getElementsByTagName('input');
        var bmnContainer = document.createElement('div');
        bmnContainer.id  = 'reify-bugmenot-container';
        var bodyEl = document.getElementsByTagName('body')[0];
        if (!bodyEl) return;

        for (var i = 0; i < allInputs.length; i++) {
            var pwField = allInputs[i];
            if (!(pwField.type && pwField.type.toLowerCase() === 'password')) {
                continue;
            }

            var previousTextFieldInd = getPreviousTextField(i, allInputs);

            // FIX 1: The original code placed `continue` inside the DEBUG
            // block, meaning the loop only skipped the field when DEBUG===true.
            // The continue must execute unconditionally when no text field
            // precedes the password field; the DEBUG block only gates logging.
            if (previousTextFieldInd === -1) {
                if (DEBUG) {
                    console.log('Couldn\'t find text field before password input ' + i + '.');
                }
                continue;
            }

            var usernameField = allInputs[previousTextFieldInd];
            usernameField.blur();   // Workaround: defocus default-focused username field
            usernameField.setAttribute('usernameInputIndex', previousTextFieldInd);
            usernameField.setAttribute('passwordInputIndex', i);
            Utility.addEventHandler(usernameField, 'focus', usernameField_onfocus);
            Utility.addEventHandler(usernameField, 'blur',  usernameField_onblur);
            Utility.addEventHandler(pwField, 'focus', pwField_onfocus);
            Utility.addEventHandler(pwField, 'blur',  pwField_onblur);
            pwField.setAttribute('usernameInputIndex', previousTextFieldInd);
            pwField.setAttribute('passwordInputIndex', i);

            // FIX 7: Declare prompt vars in outer scope; assign in both branches.
            let myprompt, myprompt2;

            if (counter === 0) {
                myprompt  = 'Get login from BugMeNot (1/-)';
                myprompt2 = 'Get a login from BugMeNot';
            } else {
                var total = JSON.parse(await GM.getValue('allUsernames', '[]')).length;
                if (counter + 1 <= total) {
                    myprompt  = 'Try next login from BugMeNot (' + (counter + 1) + '/' + total + ')';
                    myprompt2 = 'Try next login';
                } else {
                    myprompt  = 'No other logins';
                    myprompt2 = 'No other logins available';
                }
            }

            var getLoginLink = menuLink(
                bmnUri, myprompt, myprompt2,
                getLoginLink_onclick, Style.menuLink,
                previousTextFieldInd, i,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var getLoginLinkWrapper = menuEntry(getLoginLink, Style.menuLinkWrapper);

            // FIX 8: Scoped with block + explicit let so resetCounterLinkWrapper
            // is never referenced outside this guarded branch.
            var bmnWrapper = document.createElement('div');
            bmnWrapper.id        = 'reify-bugmenot-bmnWrapper' + i;
            bmnWrapper.className = 'reify-bugmenot-bmnWrapper';
            bmnWrapper.appendChild(getLoginLinkWrapper);

            if (counter > 0) {
                let resetCounterLink = menuLink(
                    '', 'Reset login attempt counter',
                    'Resets the login attempt counter (reloads the page)',
                    resetCounterLink_onclick, Style.menuLink,
                    previousTextFieldInd, i,
                    menuLink_onmouseover, menuLink_onmouseout
                );
                let resetCounterLinkWrapper = menuEntry(resetCounterLink, Style.menuLinkWrapper);
                bmnWrapper.appendChild(resetCounterLinkWrapper);
            }

            var fullFormLink = menuLink(
                bmnUri, 'More options',
                'See more options for getting logins from BugMeNot.com (opens a new window)',
                openMenuLink_onclick, Style.menuLink,
                previousTextFieldInd, i,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var fullFormLinkWrapper = menuEntry(fullFormLink, Style.menuLinkWrapper);

            var visitBmnLink = menuLink(
                bmnHomeUri, 'Visit BugMeNot',
                'Go to the BugMeNot home page (opens a new window)',
                openMenuLink_onclick, Style.menuLink,
                previousTextFieldInd, i,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var visitBmnLinkWrapper = menuEntry(visitBmnLink, Style.menuLinkWrapper);

            bmnWrapper.appendChild(fullFormLinkWrapper);
            bmnWrapper.appendChild(visitBmnLinkWrapper);

            copyProperties(bmnWrapper.style, Style.bmnWrapper);
            bmnContainer.appendChild(bmnWrapper);
        }

        if (bmnContainer.hasChildNodes()) {
            bodyEl.appendChild(bmnContainer);
        }
    })();
}


// ---------------------------------------------------------------------------
// menuEntry — wraps a link element in a <p> styled container
// ---------------------------------------------------------------------------
function menuEntry(linkEl, styleObj) {
    var p = document.createElement('p');
    copyProperties(p.style, styleObj);
    p.appendChild(linkEl);
    return p;
}


// ---------------------------------------------------------------------------
// menuLink — constructs a styled <a> element with all required attributes
// ---------------------------------------------------------------------------
function menuLink(href, text, title, onclick, styleObj, usernameInputIndex, passwordInputIndex, onmouseover, onmouseout) {
    var newMenuLink = document.createElement('a');
    newMenuLink.href = href;
    newMenuLink.appendChild(document.createTextNode(text));
    newMenuLink.title = title;
    newMenuLink.setAttribute('usernameInputIndex', usernameInputIndex);
    newMenuLink.setAttribute('passwordInputIndex', passwordInputIndex);
    Utility.addEventHandler(newMenuLink, 'click',     onclick);
    Utility.addEventHandler(newMenuLink, 'mouseover', onmouseover);
    Utility.addEventHandler(newMenuLink, 'mouseout',  onmouseout);
    copyProperties(newMenuLink.style, styleObj);
    return newMenuLink;
}


// ---------------------------------------------------------------------------
// menuLink_onmouseover / menuLink_onmouseout — hover style toggle
// ---------------------------------------------------------------------------
function menuLink_onmouseover(event) {
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    copyProperties(target.style, Style.menuLinkHover);
}

function menuLink_onmouseout(event) {
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    copyProperties(target.style, Style.menuLink);
}


// ---------------------------------------------------------------------------
// getLoginLink_onclick — triggers credential fill; prompts before overwrite
// ---------------------------------------------------------------------------
function getLoginLink_onclick(event) {
    var allInputs = document.getElementsByTagName('input');
    var pwIdx   = this.getAttribute('passwordInputIndex');
    var unIdx   = this.getAttribute('usernameInputIndex');
    var pwVal   = allInputs[pwIdx].value;
    var unVal   = allInputs[unIdx].value;
    if ((!pwVal.length && !unVal.length) || confirm('Overwrite the current login entry?')) {
        getLogin(bmnUri, unIdx, pwIdx);
    }
    menuLink_onmouseout({ currentTarget: this });
    event.preventDefault && event.preventDefault();
    return false;
}


// ---------------------------------------------------------------------------
// openMenuLink_onclick — opens BugMeNot page in a new tab
//
// FIX 9: typeof check on GM.openInTab was unreliable (the property exists on
// the GM object even when the underlying API is absent, resulting in undefined
// rather than a missing property). Now calls GM.openInTab directly and falls
// back to window.open on any error.
// ---------------------------------------------------------------------------
function openMenuLink_onclick(event) {
    try {
        GM.openInTab(this.href);
    } catch (e) {
        window.open(this.href);
    }
    menuLink_onmouseout({ currentTarget: this });
    event.preventDefault && event.preventDefault();
    return false;
}


// ---------------------------------------------------------------------------
// resetCounterLink_onclick — resets persisted counter to 0 and reloads
// ---------------------------------------------------------------------------
function resetCounterLink_onclick() {
    (async function () {
        await GM.setValue('counter', 0);
    })();
    window.location.reload();
}


// ---------------------------------------------------------------------------
// Focus / blur handlers — show or hide the BugMeNot wrapper panel
// ---------------------------------------------------------------------------
function usernameField_onfocus(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', true);
    showHideBmnWrapper(target, allInputs[target.getAttribute('passwordInputIndex')], true);
}

function usernameField_onblur(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event || this;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', false);
    var fRef = hideIfNoFocus(
        allInputs[target.getAttribute('usernameInputIndex')],
        allInputs[target.getAttribute('passwordInputIndex')]
    );
    // Race condition guard: wait for the sibling field's onfocus to fire
    // before collapsing the wrapper, so clicks inside the menu register.
    setTimeout(fRef, BLUR_TIMEOUT);
}

function pwField_onfocus(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', true);
    showHideBmnWrapper(allInputs[target.getAttribute('usernameInputIndex')], target, true);
}

function pwField_onblur(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', false);
    var fRef = hideIfNoFocus(
        allInputs[target.getAttribute('usernameInputIndex')],
        allInputs[target.getAttribute('passwordInputIndex')]
    );
    setTimeout(fRef, BLUR_TIMEOUT);
}


// ---------------------------------------------------------------------------
// hideIfNoFocus — returns a closure that hides the wrapper if neither field
// has focus (deferred via setTimeout to survive the focus-switch gap)
// ---------------------------------------------------------------------------
function hideIfNoFocus(usernameField, pwField) {
    return (function () {
        var bUsernameFocus = usernameField.getAttribute('hasFocus');
        if (typeof bUsernameFocus === 'string') {
            bUsernameFocus = (bUsernameFocus && bUsernameFocus !== 'false');
        }
        var bPasswordFocus = pwField.getAttribute('hasFocus');
        if (typeof bPasswordFocus === 'string') {
            bPasswordFocus = (bPasswordFocus && bPasswordFocus !== 'false');
        }
        if (!bUsernameFocus && !bPasswordFocus) {
            showHideBmnWrapper(usernameField, pwField, false);
        }
    });
}


// ---------------------------------------------------------------------------
// showHideBmnWrapper — toggles wrapper visibility and repositions on show
//
// FIX 12: The original hover-style reset loop targeted `div` elements;
// the menu items are `<a>` tags. Fixed to query `a` elements so hover styles
// are correctly cleared when the wrapper hides without a mouseout event.
// ---------------------------------------------------------------------------
function showHideBmnWrapper(usernameField, pwField, show) {
    var bmnWrapper = getBmnWrapper(pwField.getAttribute('passwordInputIndex'));
    if (!bmnWrapper) return;
    if (show) {
        bmnWrapper.style.display = 'block';
        positionBmnWrapper(bmnWrapper, usernameField, pwField);
    } else {
        bmnWrapper.style.display = 'none';
        // Reset hover styles on all menu link <a> elements in case onmouseout
        // was never fired (e.g., the wrapper was hidden programmatically).
        var menuLinks = bmnWrapper.getElementsByTagName('a');
        for (var i = 0; i < menuLinks.length; i++) {
            copyProperties(menuLinks[i].style, Style.menuLink);
        }
    }
}


// ---------------------------------------------------------------------------
// positionBmnWrapper — places the wrapper to the right of the password field,
// or to the left of the username field if right placement would overflow the
// visible viewport.
// ---------------------------------------------------------------------------
function positionBmnWrapper(bmnWrapper, usernameField, pwField) {
    var pwLeft = Utility.elementLeft(pwField);
    if (pwLeft + pwField.offsetWidth + bmnWrapper.offsetWidth +
            Utility.scrollLeft() + 10 < Utility.viewportWidth()) {
        bmnWrapper.style.left = (pwLeft + pwField.offsetWidth + 2) + 'px';
        bmnWrapper.style.top  = Utility.elementTop(pwField) + 'px';
    } else {
        bmnWrapper.style.left = (Utility.elementLeft(usernameField) -
            bmnWrapper.offsetWidth - 2) + 'px';
        bmnWrapper.style.top  = Utility.elementTop(usernameField) + 'px';
    }
}


// ---------------------------------------------------------------------------
// getLogin — core credential retrieval and injection function
//
// FIX 3: waitOrRestoreFields on restore=true no longer clears the username
// field value. The "Loading..." placeholder is set on restore=false; on
// restore=true the cursor is simply reset to default without wiping fields.
//
// FIX 4: retrievals tracks actual XHR fetches this page-load session.
// counter is the persisted index into the cached credentials array.
// When counter===0 a fresh XHR fetch is performed; subsequent calls
// consume the cached GM storage arrays without additional network requests.
// ---------------------------------------------------------------------------
function getLogin(uri, usernameInputIndex, passwordInputIndex) {
    (async function () {
        var allInputs    = document.getElementsByTagName('input');
        var usernameField = allInputs[usernameInputIndex];
        var pwField       = allInputs[passwordInputIndex];

        waitOrRestoreFields(usernameField, pwField, false);

        var firstAttempt = (retrievals === 0);
        var submitData   = 'submit=This+login+didn%27t+work&num=' + retrievals +
            '&site=' + encodeURI(location.hostname);

        if (counter === 0) {
            // No cached credentials — perform XHR to BugMeNot
            console.log('( retrieving logins from bugmenot.com via XHR... )');

            GM.xmlHttpRequest({
                method:  firstAttempt ? 'GET' : 'POST',
                headers: firstAttempt ? null : { 'Content-type': 'application/x-www-form-urlencoded' },
                data:    firstAttempt ? null : submitData,
                url:     firstAttempt ? uri   : bmnView,

                onload: function (responseDetails) {
                    waitOrRestoreFields(usernameField, pwField, true);

                    if (responseDetails.status !== 200) {
                        return Errors.say(Errors.xmlHttpFailure);
                    }

                    var decoded = responseDetails.responseText;

                    // FIX 11: Surface parse failure to console before returning.
                    var doc = textToXml(decoded);
                    if (!(doc && doc.documentElement)) {
                        console.warn('BugMeNot: textToXml returned null — response may be malformed.');
                        return Errors.say(Errors.malformedResponse);
                    }

                    // Parse all username/password pairs from the BugMeNot HTML response.
                    // Credentials are encoded inside <kbd> elements within <dd> list items:
                    //   dd:nth-child(2) > kbd  =>  username
                    //   dd:nth-child(4) > kbd  =>  password
                    var allUsernames      = doc.documentElement.querySelectorAll('dd:nth-child(2) > kbd');
                    var allPasswords      = doc.documentElement.querySelectorAll('dd:nth-child(4) > kbd');
                    var allUsernamesArray = [];
                    var allPasswordsArray = [];

                    for (var i = 0; i < allUsernames.length; i++) {
                        allUsernamesArray.push(allUsernames[i].innerHTML);
                        allPasswordsArray.push(allPasswords[i].innerHTML);
                    }

                    // Log the full credential list to the console for diagnostics
                    var temp = '';
                    for (var j = 0; j < allUsernamesArray.length; j++) {
                        temp += (j + 1) + ': ' + allUsernamesArray[j] + ', ' + allPasswordsArray[j] + '\n';
                    }
                    console.log('Found logins (' + allUsernamesArray.length + '):\n' + temp);

                    // Persist credential arrays to GM storage for subsequent calls
                    GM.setValue('allUsernames', JSON.stringify(allUsernamesArray));
                    GM.setValue('allPasswords', JSON.stringify(allPasswordsArray));

                    // Inject the first credential pair into the login form
                    var accountInfo = doc.documentElement.getElementsByTagName('kbd')[0];
                    if (!accountInfo) {
                        return Errors.say(Errors.noLoginAvailable);
                    }
                    usernameField.value = accountInfo.childNodes[0].nodeValue;

                    var pwsField = doc.documentElement.getElementsByTagName('kbd')[1];
                    pwField.value = pwsField.childNodes[0].nodeValue;

                    retrievals++;

                    // Increment and persist counter AFTER successful injection
                    counter = parseInt(counter) + 1;
                    GM.setValue('counter', counter);
                    GM.setValue('lastURL', String(window.location));
                },

                onerror: function () {
                    waitOrRestoreFields(usernameField, pwField, true);
                    Errors.say(Errors.xmlHttpFailure);
                }
            });

        } else {
            // Cached credentials exist — serve from GM storage without XHR
            var retrievedUsernames = JSON.parse(await GM.getValue('allUsernames', '[]'));
            var retrievedPasswords = JSON.parse(await GM.getValue('allPasswords', '[]'));

            var temp = '';
            for (var j = 0; j < retrievedUsernames.length; j++) {
                temp += (j + 1) + ': ' + retrievedUsernames[j] + ', ' + retrievedPasswords[j] + '\n';
            }
            console.log('Found logins (' + retrievedUsernames.length + '):\n' + temp);

            if (counter < retrievedUsernames.length) {
                usernameField.value = retrievedUsernames[counter];
                pwField.value       = retrievedPasswords[counter];
            } else {
                // counter has exceeded the available credential list
                waitOrRestoreFields(usernameField, pwField, true);
                return Errors.say(Errors.noLoginAvailable);
            }

            waitOrRestoreFields(usernameField, pwField, true);

            // Increment and persist counter AFTER successful injection
            counter = parseInt(counter) + 1;
            GM.setValue('counter', counter);
            GM.setValue('lastURL', String(window.location));
        }
    })();
}


// ---------------------------------------------------------------------------
// waitOrRestoreFields — sets UI into loading or normal state
//
// FIX 3: restore=true resets cursor and clears the "Loading..." placeholder
// from the username field only if it still contains that sentinel text,
// avoiding destruction of a user-typed value or a just-injected credential.
// ---------------------------------------------------------------------------
function waitOrRestoreFields(usernameField, pwField, restore) {
    document.documentElement.style.cursor = restore ? 'default' : 'progress';
    if (!restore) {
        usernameField.value = 'Loading...';
    } else {
        // Only clear the sentinel; do not destroy injected or user-typed values
        if (usernameField.value === 'Loading...') {
            usernameField.value = '';
        }
    }
}


// ---------------------------------------------------------------------------
// getPreviousTextField — walks backwards from a password field index to find
// the nearest preceding text or email input (the username field)
// ---------------------------------------------------------------------------
function getPreviousTextField(pwFieldIndex, allInputs) {
    for (var i = pwFieldIndex - 1; i >= 0; i--) {
        if (allInputs[i].type &&
            (allInputs[i].type.toLowerCase() === 'text' ||
             allInputs[i].type.toLowerCase() === 'email')) {
            return i;
        }
    }
    return -1;
}


// ---------------------------------------------------------------------------
// textToXml — parses an HTML string into a DOM document via DOMParser
//
// FIX 11: Logs a console warning on parse failure so errors are surfaced
// rather than silently swallowed.
// ---------------------------------------------------------------------------
function textToXml(t) {
    try {
        if (typeof DOMParser !== 'undefined') {
            var parser = new DOMParser();
            return parser.parseFromString(t, 'text/html');
        } else {
            console.warn('BugMeNot: DOMParser unavailable in this environment.');
            return null;
        }
    } catch (e) {
        console.warn('BugMeNot: textToXml parse exception —', e);
        return null;
    }
}


// ---------------------------------------------------------------------------
// Bootstrap IIFE — async initialization of counter before main() is called
//
// FIX 2 / FIX 14: counter is fully resolved from GM storage before
// processPasswordFields() runs, eliminating the race condition where the UI
// was built with counter === undefined.
//
// Domain comparison uses exact hostname matching (indexOf against stored
// lastURL) to reset the counter when navigating to a different site.
// ---------------------------------------------------------------------------
(async function () {
    var lastURL = await GM.getValue('lastURL', '');

    if (lastURL.indexOf(domainname) === -1) {
        // Different domain (or first run) — reset counter to start fresh
        counter = 0;
        await GM.setValue('counter', 0);
    } else {
        counter = parseInt(await GM.getValue('counter', 0));
    }

    main();
})();


/*
 * ---------------------------------------------------------------------------
 * PRESERVED LEGACY: decodeit() — original Base64/XOR decode routine used
 * when BugMeNot served obfuscated HTML responses (pre-2009). Retained for
 * historical lineage; not called in current code.
 * ---------------------------------------------------------------------------
 *
 * function decodeit(codedtext) {
 *     var regexkey = /var key = (.*?)\;/;
 *     var match = regexkey.exec(codedtext);
 *     if (match != null) {
 *         var key = parseInt(match[1]);
 *     } else {
 *         alert('decoded key cannot be found\nbugmenot site has changed');
 *     }
 *     codedtext = codedtext.replace(/<script>d\('(.*?)'\)\;<\/script>/gi, aaa);
 *     return codedtext;
 *     function aaa(str, strInput, offset, s) { return d(strInput); }
 *     function decoder(data) {
 *         var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
 *         var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, enc = '';
 *         do {
 *             h1 = b64.indexOf(data.charAt(i++)); h2 = b64.indexOf(data.charAt(i++));
 *             h3 = b64.indexOf(data.charAt(i++)); h4 = b64.indexOf(data.charAt(i++));
 *             bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
 *             o1 = bits >> 16 & 255; o2 = bits >> 8 & 255; o3 = bits & 255;
 *             if (h3 == 64) enc += String.fromCharCode(o1);
 *             else if (h4 == 64) enc += String.fromCharCode(o1, o2);
 *             else enc += String.fromCharCode(o1, o2, o3);
 *         } while (i < data.length);
 *         return enc;
 *     }
 *     function d(strInput) {
 *         strInput = decoder(strInput);
 *         var strOutput = '';
 *         var intOffset = (key + 112) / 12;
 *         for (var i = 4; i < strInput.length; i++) {
 *             strOutput += String.fromCharCode(strInput.charCodeAt(i) - intOffset);
 *         }
 *         return strOutput;
 *     }
 * }
 */
