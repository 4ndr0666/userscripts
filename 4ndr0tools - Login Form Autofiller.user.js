// ==UserScript==
// @name        4ndr0tools - Login Form Autofiller
// @namespace   https://www.github.com/4ndr0666/userscripts
// @version     2017.12.15
// @description It integrates BugMeNot into any login form (it retrieves all matching logins from bugmenot.com and autofills the login form)
// @authors     4ndr0666, Matt McCarthy, darkred
// @license     MIT
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
// @supportURL  https://github.com/darkred/Userscripts/issues
// ==/UserScript==

/* global GM */

// ---------------------------------------------------------------------------
// FIX 5: All BugMeNot URLs upgraded to HTTPS.
// ---------------------------------------------------------------------------
const bmnView    = 'https://bugmenot.com/view';
const bmnHomeUri = 'https://bugmenot.com/';

// ---------------------------------------------------------------------------
// FIX 10: Trailing path optional — handles https://example.com with no slash.
// ---------------------------------------------------------------------------
const myString      = location.href;
const domainnameRE  = /(?:https?:\/\/)(www\.)?(.*?)(?:\/|$)/i;
const domainnameMatch = myString.match(domainnameRE);
const domainname    = domainnameMatch ? domainnameMatch[2] : location.hostname;

const bmnUri = bmnView + '/' + domainname;

// Millisecond delay between blur and focus-check — must be long enough for
// the menu onclick to fire before display:none hides the wrapper.
const BLUR_TIMEOUT = 250;

const DEBUG = false;

// Tracks XHR fetches this page-load session; reset on every page load.
var retrievals = 0;

// Persisted counter: which cached credential index to serve next.
// Fully resolved before main() is called — eliminates the FIX 2 race.
var counter;

// ---------------------------------------------------------------------------
// FIX (SPA): Tracks which username field indices have had a BugMeNot wrapper
// injected, preventing the MutationObserver from double-injecting.
// ---------------------------------------------------------------------------
var injectedUsernameIndices = new Set();

// ---------------------------------------------------------------------------
// TWO-PHASE STATE
//
// Phase 1 — Only an email/text field is visible (multi-step form). Credentials
// are fetched, email filled immediately, password stored in pendingPasswordValue.
// Phase 2 — MutationObserver detects the password field appearing and injects
// the pending value immediately.
//
// For standard single-step forms both phases complete in a single click.
// ---------------------------------------------------------------------------
var pendingPasswordValue = null;


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
    },
    // Returns true if the element is part of the visible layout.
    // offsetParent is null for display:none elements and detached nodes.
    isVisible: function (el) {
        var rect = el.getBoundingClientRect();
        return el.offsetParent !== null || (rect.width > 0 && rect.height > 0);
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
// setNativeValue
//
// FIX (MegaPass / Angular / React trusted-event requirement):
//
// Three-layer field injection strategy, applied in order until one succeeds:
//
// Layer 1 — execCommand('insertText'):
//   The ONLY mechanism in Chromium that produces a genuinely isTrusted=true
//   'input' event from script. Required to bypass password managers such as
//   MegaPass that explicitly check event.isTrusted and block synthetic events.
//   Procedure: focus the field, select-all existing content, then execCommand
//   replaces the selection with the new value, firing a trusted InputEvent.
//   execCommand is deprecated but still functional in all current Chromium
//   builds and Firefox. It is tried first because it produces the most
//   compatible result with framework change-detection AND trusted-event checks.
//
// Layer 2 — Native prototype setter + synthetic events:
//   Fallback for browsers where execCommand('insertText') is unavailable or
//   returns false. Writes through HTMLInputElement.prototype's native value
//   setter (bypassing Angular/React's Object.defineProperty interception),
//   then dispatches synthetic 'input' and 'change' events. These events have
//   isTrusted=false and will be blocked by MegaPass, but will work on sites
//   that only require framework change-detection without trusted-event guards.
//
// Layer 3 — Direct .value assignment:
//   Final fallback for non-standard environments where prototype access fails.
//   Least compatible; does not trigger any framework or password manager hooks.
// ---------------------------------------------------------------------------
function setNativeValue(field, value) {
    // Layer 1: execCommand — produces isTrusted=true InputEvent in Chromium.
    try {
        field.focus();
        field.select();
        // For password/email fields, select() may be a no-op; use setSelectionRange.
        try { field.setSelectionRange(0, field.value.length); } catch (e) { /* ok */ }

        var execResult = document.execCommand('insertText', false, value);

        if (execResult) {
            // execCommand succeeded and fired a trusted InputEvent.
            // Dispatch 'change' explicitly since execCommand only fires 'input'.
            field.dispatchEvent(new Event('change', { bubbles: true }));
            field.blur();
            return;
        }
    } catch (e) {
        if (DEBUG) console.warn('BugMeNot: execCommand layer failed —', e);
    }

    // Layer 2: Native prototype setter + synthetic events.
    // Fallback for when execCommand is unavailable or returned false.
    try {
        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(field, value);
    } catch (e) {
        // Layer 3: Direct assignment as last resort.
        field.value = value;
    }
    field.dispatchEvent(new Event('input',  { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    field.dispatchEvent(new Event('focus',  { bubbles: true }));
    field.dispatchEvent(new Event('blur',   { bubbles: true }));
}


// ---------------------------------------------------------------------------
// getBmnWrapper — retrieves the BugMeNot UI panel by username-field index
// ---------------------------------------------------------------------------
function getBmnWrapper(usernameFieldIndex) {
    return document.getElementById('reify-bugmenot-bmnWrapper' + usernameFieldIndex);
}


// ---------------------------------------------------------------------------
// updateGetLoginLinkLabel
//
// FIX (dynamic label): Rebuilds the "Get login" button text after each
// successful injection. Injects "Reset counter" link on first counter advance.
// ---------------------------------------------------------------------------
function updateGetLoginLinkLabel(usernameFieldIndex) {
    var bmnWrapper = getBmnWrapper(usernameFieldIndex);
    if (!bmnWrapper) return;

    var anchors = bmnWrapper.getElementsByTagName('a');
    if (!anchors.length) return;
    var getLoginAnchor = anchors[0];

    (async function () {
        var total          = JSON.parse(await GM.getValue('allUsernames', '[]')).length;
        var currentCounter = parseInt(await GM.getValue('counter', 0));

        var newText, newTitle;
        if (currentCounter + 1 <= total) {
            newText  = 'Try next login from BugMeNot (' + (currentCounter + 1) + '/' + total + ')';
            newTitle = 'Try next login';
        } else {
            newText  = 'No other logins';
            newTitle = 'No other logins available';
        }

        while (getLoginAnchor.firstChild) {
            getLoginAnchor.removeChild(getLoginAnchor.firstChild);
        }
        getLoginAnchor.appendChild(document.createTextNode(newText));
        getLoginAnchor.title = newTitle;

        if (currentCounter > 0 &&
                !document.getElementById('reify-bugmenot-resetLink' + usernameFieldIndex)) {
            var resetCounterLink = menuLink(
                '', 'Reset login attempt counter',
                'Resets the login attempt counter (reloads the page)',
                resetCounterLink_onclick, Style.menuLink,
                usernameFieldIndex, -1,
                menuLink_onmouseover, menuLink_onmouseout
            );
            resetCounterLink.id = 'reify-bugmenot-resetLink' + usernameFieldIndex;
            var resetCounterLinkWrapper = menuEntry(resetCounterLink, Style.menuLinkWrapper);
            var firstChild = bmnWrapper.firstChild;
            if (firstChild && firstChild.nextSibling) {
                bmnWrapper.insertBefore(resetCounterLinkWrapper, firstChild.nextSibling);
            } else {
                bmnWrapper.appendChild(resetCounterLinkWrapper);
            }
        }
    })();
}


// ---------------------------------------------------------------------------
// main — entry point, called after async counter initialization resolves
// ---------------------------------------------------------------------------
function main() {
    processLoginFields();
    installMutationObserver();
}


// ---------------------------------------------------------------------------
// installMutationObserver
//
// FIX (SPA root cause): SPAs render login forms dynamically after
// document-idle. Watches for DOM mutations and re-runs processLoginFields()
// on a 300ms debounce. Also calls attemptPhase2PasswordInjection() on every
// firing to complete multi-step form injection when the password field appears.
// ---------------------------------------------------------------------------
function installMutationObserver() {
    var debounceTimer = null;

    var observer = new MutationObserver(function (mutations) {
        var hasNewNodes = mutations.some(function (m) {
            return m.addedNodes.length > 0;
        });
        if (!hasNewNodes) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            processLoginFields();
            attemptPhase2PasswordInjection();
        }, 300);
    });

    var bodyEl = document.getElementsByTagName('body')[0];
    if (bodyEl) {
        observer.observe(bodyEl, { childList: true, subtree: true });
    }
}


// ---------------------------------------------------------------------------
// attemptPhase2PasswordInjection
//
// TWO-PHASE — Phase 2: If a password was stored during Phase 1, inject it
// into the first visible password field that has appeared since. Clears
// pendingPasswordValue on success so this fires exactly once per login.
// ---------------------------------------------------------------------------
function attemptPhase2PasswordInjection() {
    if (pendingPasswordValue === null) return;

    var allInputs = document.getElementsByTagName('input');
    for (var i = 0; i < allInputs.length; i++) {
        var field = allInputs[i];
        if (field.type && field.type.toLowerCase() === 'password' &&
                Utility.isVisible(field)) {
            setNativeValue(field, pendingPasswordValue);
            console.log('BugMeNot: Phase 2 — password field appeared, injected cached password.');
            pendingPasswordValue = null;
            return;
        }
    }
}


// ---------------------------------------------------------------------------
// processLoginFields
//
// Attaches the BugMeNot wrapper to any visible email/text field that does not
// already have one. Password field presence is not required — multi-step forms
// are handled via Phase 2. Wrapper id and Set guard keyed to username index.
//
// FIX 1: continue unconditional when field unusable; DEBUG gates log only.
// FIX 2: counter guaranteed initialized before first call.
// FIX 7: myprompt/myprompt2 declared with let in outer scope.
// FIX (SPA): injectedUsernameIndices prevents double-injection.
// FIX (visibility): Only visible fields processed — skips hidden duplicates.
// ---------------------------------------------------------------------------
function processLoginFields() {
    (async function () {
        var allInputs = document.getElementsByTagName('input');
        var bodyEl    = document.getElementsByTagName('body')[0];
        if (!bodyEl) return;

        var bmnContainer = document.getElementById('reify-bugmenot-container');
        if (!bmnContainer) {
            bmnContainer = document.createElement('div');
            bmnContainer.id = 'reify-bugmenot-container';
            bodyEl.appendChild(bmnContainer);
        }

        for (var i = 0; i < allInputs.length; i++) {
            var field     = allInputs[i];
            var fieldType = field.type ? field.type.toLowerCase() : '';

            if (fieldType !== 'email' && fieldType !== 'text') continue;
            if (!Utility.isVisible(field)) continue;
            if (injectedUsernameIndices.has(i)) continue;

            var usernameField = field;
            var usernameIndex = i;
            var passwordIndex = getFollowingPasswordField(i, allInputs);
            var pwField       = passwordIndex !== -1 ? allInputs[passwordIndex] : null;

            usernameField.blur();
            usernameField.setAttribute('usernameInputIndex', usernameIndex);
            usernameField.setAttribute('passwordInputIndex', passwordIndex);
            Utility.addEventHandler(usernameField, 'focus', usernameField_onfocus);
            Utility.addEventHandler(usernameField, 'blur',  usernameField_onblur);

            if (pwField) {
                Utility.addEventHandler(pwField, 'focus', pwField_onfocus);
                Utility.addEventHandler(pwField, 'blur',  pwField_onblur);
                pwField.setAttribute('usernameInputIndex', usernameIndex);
                pwField.setAttribute('passwordInputIndex', passwordIndex);
            }

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
                usernameIndex, passwordIndex,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var getLoginLinkWrapper = menuEntry(getLoginLink, Style.menuLinkWrapper);

            var bmnWrapper = document.createElement('div');
            bmnWrapper.id        = 'reify-bugmenot-bmnWrapper' + usernameIndex;
            bmnWrapper.className = 'reify-bugmenot-bmnWrapper';
            bmnWrapper.appendChild(getLoginLinkWrapper);

            if (counter > 0) {
                let resetCounterLink = menuLink(
                    '', 'Reset login attempt counter',
                    'Resets the login attempt counter (reloads the page)',
                    resetCounterLink_onclick, Style.menuLink,
                    usernameIndex, passwordIndex,
                    menuLink_onmouseover, menuLink_onmouseout
                );
                resetCounterLink.id = 'reify-bugmenot-resetLink' + usernameIndex;
                let resetCounterLinkWrapper = menuEntry(resetCounterLink, Style.menuLinkWrapper);
                bmnWrapper.appendChild(resetCounterLinkWrapper);
            }

            var fullFormLink = menuLink(
                bmnUri, 'More options',
                'See more options for getting logins from BugMeNot.com (opens a new window)',
                openMenuLink_onclick, Style.menuLink,
                usernameIndex, passwordIndex,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var fullFormLinkWrapper = menuEntry(fullFormLink, Style.menuLinkWrapper);

            var visitBmnLink = menuLink(
                bmnHomeUri, 'Visit BugMeNot',
                'Go to the BugMeNot home page (opens a new window)',
                openMenuLink_onclick, Style.menuLink,
                usernameIndex, passwordIndex,
                menuLink_onmouseover, menuLink_onmouseout
            );
            var visitBmnLinkWrapper = menuEntry(visitBmnLink, Style.menuLinkWrapper);

            bmnWrapper.appendChild(fullFormLinkWrapper);
            bmnWrapper.appendChild(visitBmnLinkWrapper);

            copyProperties(bmnWrapper.style, Style.bmnWrapper);
            bmnContainer.appendChild(bmnWrapper);

            injectedUsernameIndices.add(usernameIndex);

            if (DEBUG) {
                console.log('BugMeNot: Attached to username field', usernameIndex,
                    '| password field:', passwordIndex === -1 ? 'NONE (multi-step)' : passwordIndex);
            }
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
    var unIdx = this.getAttribute('usernameInputIndex');
    var pwIdx = this.getAttribute('passwordInputIndex');
    var unVal = allInputs[unIdx] ? allInputs[unIdx].value : '';
    var pwVal = (pwIdx !== '-1' && allInputs[pwIdx]) ? allInputs[pwIdx].value : '';
    if ((!pwVal.length && !unVal.length) || confirm('Overwrite the current login entry?')) {
        getLogin(bmnUri, unIdx, pwIdx);
    }
    menuLink_onmouseout({ currentTarget: this });
    event.preventDefault && event.preventDefault();
    return false;
}


// ---------------------------------------------------------------------------
// openMenuLink_onclick — opens BugMeNot page in a new tab
// FIX 9: try/catch fallback replaces unreliable typeof check.
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
// Focus / blur handlers
// ---------------------------------------------------------------------------
function usernameField_onfocus(event) {
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', true);
    var unIdx = target.getAttribute('usernameInputIndex');
    showHideBmnWrapper(unIdx, target, true);
}

function usernameField_onblur(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event || this;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', false);
    var unIdx = target.getAttribute('usernameInputIndex');
    var pwIdx = target.getAttribute('passwordInputIndex');
    var pwField = (pwIdx !== '-1' && allInputs[pwIdx]) ? allInputs[pwIdx] : null;
    var fRef = hideIfNoFocus(target, pwField, unIdx);
    setTimeout(fRef, BLUR_TIMEOUT);
}

function pwField_onfocus(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', true);
    var unIdx = target.getAttribute('usernameInputIndex');
    showHideBmnWrapper(unIdx, allInputs[unIdx], true);
}

function pwField_onblur(event) {
    var allInputs = document.getElementsByTagName('input');
    event = event || window.event;
    var target = event.currentTarget || event.srcElement;
    target.setAttribute('hasFocus', false);
    var unIdx = target.getAttribute('usernameInputIndex');
    var unField = allInputs[unIdx];
    var fRef = hideIfNoFocus(unField, target, unIdx);
    setTimeout(fRef, BLUR_TIMEOUT);
}


// ---------------------------------------------------------------------------
// hideIfNoFocus — deferred closure that collapses the wrapper if neither
// field has focus. pwField may be null for multi-step forms.
// ---------------------------------------------------------------------------
function hideIfNoFocus(usernameField, pwField, usernameIndex) {
    return (function () {
        var bUsernameFocus = usernameField ? usernameField.getAttribute('hasFocus') : false;
        if (typeof bUsernameFocus === 'string') {
            bUsernameFocus = (bUsernameFocus && bUsernameFocus !== 'false');
        }
        var bPasswordFocus = pwField ? pwField.getAttribute('hasFocus') : false;
        if (typeof bPasswordFocus === 'string') {
            bPasswordFocus = (bPasswordFocus && bPasswordFocus !== 'false');
        }
        if (!bUsernameFocus && !bPasswordFocus) {
            showHideBmnWrapper(usernameIndex, usernameField, false);
        }
    });
}


// ---------------------------------------------------------------------------
// showHideBmnWrapper — toggles wrapper visibility; keyed to usernameIndex.
// FIX 12: Reset loop targets <a> elements (not <div>).
// ---------------------------------------------------------------------------
function showHideBmnWrapper(usernameIndex, referenceField, show) {
    var bmnWrapper = getBmnWrapper(usernameIndex);
    if (!bmnWrapper) return;
    if (show) {
        bmnWrapper.style.display = 'block';
        if (referenceField) {
            positionBmnWrapper(bmnWrapper, referenceField);
        }
    } else {
        bmnWrapper.style.display = 'none';
        var menuLinks = bmnWrapper.getElementsByTagName('a');
        for (var i = 0; i < menuLinks.length; i++) {
            copyProperties(menuLinks[i].style, Style.menuLink);
        }
    }
}


// ---------------------------------------------------------------------------
// positionBmnWrapper — places the wrapper right of the anchor field, or to
// its left if right placement would overflow the viewport.
// ---------------------------------------------------------------------------
function positionBmnWrapper(bmnWrapper, anchorField) {
    var fieldLeft  = Utility.elementLeft(anchorField);
    var fieldTop   = Utility.elementTop(anchorField);
    var fieldRight = fieldLeft + anchorField.offsetWidth;

    if (fieldRight + bmnWrapper.offsetWidth + Utility.scrollLeft() + 10 < Utility.viewportWidth()) {
        bmnWrapper.style.left = (fieldRight + 2) + 'px';
        bmnWrapper.style.top  = fieldTop + 'px';
    } else {
        bmnWrapper.style.left = (fieldLeft - bmnWrapper.offsetWidth - 2) + 'px';
        bmnWrapper.style.top  = fieldTop + 'px';
    }
}


// ---------------------------------------------------------------------------
// getLogin — core credential retrieval and injection function
//
// TWO-PHASE: If passwordIndex is -1, password is stored in pendingPasswordValue
// for Phase 2 injection when Angular renders the password step.
//
// FIX 3: waitOrRestoreFields restore=true only clears 'Loading...' sentinel.
// FIX 4: counter increment inside onload/cached branch only.
// FIX (Angular/React/MegaPass): All field writes via setNativeValue().
// FIX (dynamic label): updateGetLoginLinkLabel called after injection.
// ---------------------------------------------------------------------------
function getLogin(uri, usernameInputIndex, passwordInputIndex) {
    (async function () {
        var allInputs     = document.getElementsByTagName('input');
        var usernameField = allInputs[usernameInputIndex];
        var pwField       = (passwordInputIndex !== '-1' && passwordInputIndex !== -1)
                            ? allInputs[passwordInputIndex]
                            : null;

        waitOrRestoreFields(usernameField, false);

        var firstAttempt = (retrievals === 0);
        var submitData   = 'submit=This+login+didn%27t+work&num=' + retrievals +
            '&site=' + encodeURI(location.hostname);

        if (counter === 0) {
            console.log('( retrieving logins from bugmenot.com via XHR... )');

            GM.xmlHttpRequest({
                method:  firstAttempt ? 'GET' : 'POST',
                headers: firstAttempt ? null : { 'Content-type': 'application/x-www-form-urlencoded' },
                data:    firstAttempt ? null : submitData,
                url:     firstAttempt ? uri   : bmnView,

                onload: function (responseDetails) {
                    waitOrRestoreFields(usernameField, true);

                    if (responseDetails.status !== 200) {
                        return Errors.say(Errors.xmlHttpFailure);
                    }

                    // FIX 11: Surface parse failure to console.
                    var doc = textToXml(responseDetails.responseText);
                    if (!(doc && doc.documentElement)) {
                        console.warn('BugMeNot: textToXml returned null — response may be malformed.');
                        return Errors.say(Errors.malformedResponse);
                    }

                    var allUsernames      = doc.documentElement.querySelectorAll('dd:nth-child(2) > kbd');
                    var allPasswords      = doc.documentElement.querySelectorAll('dd:nth-child(4) > kbd');
                    var allUsernamesArray = [];
                    var allPasswordsArray = [];

                    for (var i = 0; i < allUsernames.length; i++) {
                        allUsernamesArray.push(allUsernames[i].innerHTML);
                        allPasswordsArray.push(allPasswords[i].innerHTML);
                    }

                    var temp = '';
                    for (var j = 0; j < allUsernamesArray.length; j++) {
                        temp += (j + 1) + ': ' + allUsernamesArray[j] + ', ' + allPasswordsArray[j] + '\n';
                    }
                    console.log('Found logins (' + allUsernamesArray.length + '):\n' + temp);

                    GM.setValue('allUsernames', JSON.stringify(allUsernamesArray));
                    GM.setValue('allPasswords', JSON.stringify(allPasswordsArray));

                    var accountInfo = doc.documentElement.getElementsByTagName('kbd')[0];
                    if (!accountInfo) {
                        return Errors.say(Errors.noLoginAvailable);
                    }

                    var injectUsername = accountInfo.childNodes[0].nodeValue;
                    var pwKbd          = doc.documentElement.getElementsByTagName('kbd')[1];
                    var injectPassword = pwKbd ? pwKbd.childNodes[0].nodeValue : '';

                    setNativeValue(usernameField, injectUsername);

                    if (pwField) {
                        setNativeValue(pwField, injectPassword);
                    } else {
                        // TWO-PHASE: stash password for Phase 2.
                        pendingPasswordValue = injectPassword;
                        console.log('BugMeNot: Phase 1 complete — password cached for Phase 2.');
                    }

                    retrievals++;
                    counter = parseInt(counter) + 1;
                    GM.setValue('counter', counter);
                    GM.setValue('lastURL', String(window.location));

                    updateGetLoginLinkLabel(usernameInputIndex);
                },

                onerror: function () {
                    waitOrRestoreFields(usernameField, true);
                    Errors.say(Errors.xmlHttpFailure);
                }
            });

        } else {
            // Cached credentials — serve from GM storage without XHR.
            var retrievedUsernames = JSON.parse(await GM.getValue('allUsernames', '[]'));
            var retrievedPasswords = JSON.parse(await GM.getValue('allPasswords', '[]'));

            var temp = '';
            for (var j = 0; j < retrievedUsernames.length; j++) {
                temp += (j + 1) + ': ' + retrievedUsernames[j] + ', ' + retrievedPasswords[j] + '\n';
            }
            console.log('Found logins (' + retrievedUsernames.length + '):\n' + temp);

            if (counter < retrievedUsernames.length) {
                setNativeValue(usernameField, retrievedUsernames[counter]);

                if (pwField) {
                    setNativeValue(pwField, retrievedPasswords[counter]);
                } else {
                    pendingPasswordValue = retrievedPasswords[counter];
                    console.log('BugMeNot: Phase 1 complete (cached) — password cached for Phase 2.');
                }
            } else {
                waitOrRestoreFields(usernameField, true);
                return Errors.say(Errors.noLoginAvailable);
            }

            waitOrRestoreFields(usernameField, true);
            counter = parseInt(counter) + 1;
            GM.setValue('counter', counter);
            GM.setValue('lastURL', String(window.location));

            updateGetLoginLinkLabel(usernameInputIndex);
        }
    })();
}


// ---------------------------------------------------------------------------
// waitOrRestoreFields — loading/normal state toggle for the username field.
//
// FIX 3: restore=true only clears 'Loading...' sentinel.
// Uses setNativeValue so the Loading sentinel itself triggers framework hooks,
// keeping Angular's model in sync during the XHR wait period.
// ---------------------------------------------------------------------------
function waitOrRestoreFields(usernameField, restore) {
    document.documentElement.style.cursor = restore ? 'default' : 'progress';
    if (!restore) {
        setNativeValue(usernameField, 'Loading...');
    } else {
        if (usernameField.value === 'Loading...') {
            setNativeValue(usernameField, '');
        }
    }
}


// ---------------------------------------------------------------------------
// getFollowingPasswordField — scans forward from username field index for
// the next visible password field. Returns -1 if none found (multi-step form).
// FIX (visibility): Skips hidden Angular duplicate inputs.
// ---------------------------------------------------------------------------
function getFollowingPasswordField(usernameFieldIndex, allInputs) {
    for (var i = usernameFieldIndex + 1; i < allInputs.length; i++) {
        if (allInputs[i].type &&
                allInputs[i].type.toLowerCase() === 'password' &&
                Utility.isVisible(allInputs[i])) {
            return i;
        }
    }
    return -1;
}


// ---------------------------------------------------------------------------
// textToXml — parses an HTML string into a DOM document via DOMParser.
// FIX 11: Logs a console warning on parse failure.
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
// Bootstrap IIFE — async initialization of counter before main() is called.
// FIX 2: counter fully resolved before processLoginFields() runs.
// FIX 14: Domain comparison uses indexOf against stored lastURL.
// ---------------------------------------------------------------------------
(async function () {
    var lastURL = await GM.getValue('lastURL', '');

    if (lastURL.indexOf(domainname) === -1) {
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
