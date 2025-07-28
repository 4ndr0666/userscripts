This document provides comprehensive technical documentation for the `4ndr0tools_PixVerseBeta` userscript.

---

## `4ndr0tools_PixVerseBeta` Userscript Documentation

### Summary

The `4ndr0tools_PixVerseBeta` userscript is a powerful toolkit designed to enhance and bypass certain functionalities on the `app.pixverse.ai` website. Primarily aimed at red team operations or penetration testing for NSFW moderation resilience, it provides several key features:

*   **Credits Patch:** Automatically restores user credits to a fixed value (100).
*   **Video/Status Unlock:** Unlocks and displays restricted (e.g., NSFW or forbidden) video content in the user's video list.
*   **Robust Download:** Modifies the "Download" button to enable direct, watermark-free video downloads with intelligently generated and sanitized filenames.
*   **Prompt NSFW Bypass:** Obfuscates sensitive keywords in user prompts to circumvent content moderation filters.
*   **API Override:** Intercepts and modifies responses from various Pixverse API endpoints (credits, video list, media uploads) to achieve the desired bypasses and enhancements.
*   **Anti-Blockers:** Disables common context menu blocking mechanisms on the website.
*   **Minimal Toast UI:** Provides subtle on-screen notifications for script status.

The script achieves its functionality by overriding native browser APIs like `XMLHttpRequest` and `window.fetch` to intercept and manipulate network requests and responses, as well as by dynamically modifying the Document Object Model (DOM).

### Function Details

#### Core Utilities

*   **`log(...args)`**
    *   **Description:** Logs messages to the browser console, prefixed with `[Pixverse++]` for easy identification.
    *   **Parameters:**
        *   `...args` (any): One or more arguments to be logged.
    *   **Return Value:** `void`

*   **`error(...args)`**
    *   **Description:** Logs error messages to the browser console, prefixed with `[Pixverse++]`.
    *   **Parameters:**
        *   `...args` (any): One or more arguments to be logged as an error.
    *   **Return Value:** `void`

*   **`matchesEndpoint(url, key)`**
    *   **Description:** Checks if a given URL matches one of the predefined API endpoint regular expressions.
    *   **Parameters:**
        *   `url` (string): The URL string to test.
        *   `key` (string): The key corresponding to an endpoint in the `API_ENDPOINTS` constant (e.g., `"credits"`, `"videoList"`).
    *   **Return Value:** `boolean` - `true` if the URL matches the specified endpoint's regex, `false` otherwise.

*   **`parseBody(body)`**
    *   **Description:** Attempts to parse a request body, which can be either a `FormData` object or a JSON string, into a JavaScript object.
    *   **Parameters:**
        *   `body` (FormData | string): The request body to parse.
    *   **Return Value:** `object | null` - The parsed object, or `null` if parsing fails or the body type is unsupported.

*   **`escapeRegExp(str)`**
    *   **Description:** Escapes special characters in a string so that it can be safely used as a literal string within a regular expression.
    *   **Parameters:**
        *   `str` (string): The string containing characters to be escaped.
    *   **Return Value:** `string` - The string with special regex characters escaped.

*   **`throttle(fn, delay)`**
    *   **Description:** Returns a new function that, when invoked, will execute the original function (`fn`) at most once within the specified `delay` milliseconds. If called multiple times within the delay, it will execute after the delay from the *last* call.
    *   **Parameters:**
        *   `fn` (function): The function to be throttled.
        *   `delay` (number): The minimum time in milliseconds between `fn` invocations.
    *   **Return Value:** `function` - The throttled version of `fn`.

*   **`showToast(msg, d = 3500)`**
    *   **Description:** Displays a temporary, minimal toast notification at the bottom center of the screen.
    *   **Parameters:**
        *   `msg` (string): The message text to display in the toast.
        *   `d` (number, optional): The duration in milliseconds for which the toast should be visible. Defaults to 3500ms.
    *   **Return Value:** `void`

#### Content & API Modification Functions

*   **`obfuscatePrompt(prompt)`**
    *   **Description:** Modifies a given prompt string by inserting zero-width space characters (`\u200B`) between each character of predefined "trigger words" (NSFW terms). This technique aims to bypass automated content moderation systems that might flag explicit prompts.
    *   **Parameters:**
        *   `prompt` (string): The user-provided prompt string.
    *   **Return Value:** `string` - The obfuscated prompt string.

*   **`extractMediaPath(data, url)`**
    *   **Description:** Extracts the media path (e.g., video or image URL segment) from an API response, specifically for batch or single media upload endpoints. This path is saved globally for later use in faking upload successes.
    *   **Parameters:**
        *   `data` (object): The API response data object.
        *   `url` (string): The URL of the API request, used to determine the expected structure of `data`.
    *   **Return Value:** `string | null` - The extracted media path, or `null` if not found.

*   **`tryModifyCredits(data)`**
    *   **Description:** Attempts to modify the `credits` value within an API response to `100`.
    *   **Parameters:**
        *   `data` (object): The API response data, expected to contain `Resp.credits`.
    *   **Return Value:** `object | null` - A deep clone of the data with modified credits if found, otherwise `null`.

*   **`modifyVideoList(data)`**
    *   **Description:** Modifies the video list API response to:
        1.  Change `video_status` from `7` (likely blocked/NSFW) to `1` (normal).
        2.  Replace NSFW placeholder URLs in `first_frame` with actual video paths or customer image URLs, if available.
        3.  Ensure `url` points to the actual video path.
    *   **Parameters:**
        *   `data` (object): The API response data containing `Resp.data` (an array of video objects).
    *   **Return Value:** `object` - The modified data object.

*   **`modifyBatchUpload(data)`**
    *   **Description:** Intercepts batch upload API responses. If an error code (400, 403, 401) is detected and a `savedMediaPath` is available, it fabricates a successful upload response using the saved path. This allows bypassing upload restrictions.
    *   **Parameters:**
        *   `data` (object): The API response data.
    *   **Return Value:** `object | null` - A fabricated success response, or `null` if no modification is applied.

*   **`modifySingleUpload(data)`**
    *   **Description:** Similar to `modifyBatchUpload`, but specifically for single media upload API responses, faking a successful upload on error using `savedMediaPath`.
    *   **Parameters:**
        *   `data` (object): The API response data.
    *   **Return Value:** `object | null` - A fabricated success response, or `null` if no modification is applied.

*   **`modifyResponse(data, url)`**
    *   **Description:** A dispatcher function that determines which specific response modification function to call based on the API request URL.
    *   **Parameters:**
        *   `data` (object): The API response data.
        *   `url` (string): The URL of the API request.
    *   **Return Value:** `object | null` - The modified data object, or `null` if no relevant modification is found.

#### DOM & Interaction Functions

*   **`sanitize(str)`**
    *   **Description:** Cleans a string to make it suitable for use as a filename. It removes invalid filename characters (`\ / : * ? " < > |`), leading/trailing dots, and leading/trailing spaces. It also truncates the string to a maximum of 120 characters for safety.
    *   **Parameters:**
        *   `str` (string): The string to sanitize.
    *   **Return Value:** `string` - The sanitized string.

*   **`getFilename(videoEl, fallback = "video.mp4")`**
    *   **Description:** Generates a robust filename for a video download. It first attempts to extract a meaningful title from the video's surrounding DOM elements (e.g., `h2`, `.title`). If a title is found, it's sanitized and used. Otherwise, it falls back to sanitizing the video's source URL.
    *   **Parameters:**
        *   `videoEl` (HTMLVideoElement): The HTML `<video>` element from which to derive the filename.
        *   `fallback` (string, optional): The default filename to use if no other name can be determined. Defaults to `"video.mp4"`.
    *   **Return Value:** `string` - The generated and sanitized filename (including `.mp4` extension if a title is used).

*   **`overrideXHR()`**
    *   **Description:** Overrides the native `XMLHttpRequest.prototype.open` and `XMLHttpRequest.prototype.send` methods. This allows the script to intercept and modify both outgoing request bodies (e.g., for prompt obfuscation) and incoming responses (e.g., for credits, video list, and upload modifications).
    *   **Parameters:** `none`
    *   **Return Value:** `void`

*   **`overrideFetch()`**
    *   **Description:** Overrides the native `window.fetch` method. Similar to `overrideXHR`, this enables interception and modification of fetch requests and their responses, applying prompt obfuscation and API response modifications.
    *   **Parameters:** `none`
    *   **Return Value:** `void`

*   **`setupWatermarkButton()`**
    *   **Description:** Locates the "Download" button on the page and attaches a new click event listener. This listener triggers a direct download of the currently displayed video, bypassing any site-specific download mechanisms or watermarks, and uses `getFilename` for intelligent naming. It uses a `MutationObserver` and throttling to ensure the button is reliably found and modified even if the DOM changes dynamically.
    *   **Parameters:** `none`
    *   **Return Value:** `void`

*   **`overrideContextMenuBlockers()`**
    *   **Description:** Disables common methods used by websites to block the browser's native right-click context menu. It achieves this by:
        1.  Overriding `EventTarget.prototype.addEventListener` to ignore `contextmenu` events.
        2.  Removing `oncontextmenu` attributes from existing and newly added DOM elements using a `MutationObserver`.
    *   **Parameters:** `none`
    *   **Return Value:** `void`

#### Initialization

*   **`initialize()`**
    *   **Description:** The main entry point for the userscript's logic. It orchestrates the setup of all core functionalities: overriding context menu blockers, intercepting XHR and Fetch requests, and setting up the custom download button. It ensures the script runs only once and provides a toast notification upon completion or error.
    *   **Parameters:** `none`
    *   **Return Value:** `void`

### Usage Example

This code is a **Userscript**, designed to be executed within a web browser using a compatible browser extension like [Tampermonkey](https://www.tampermonkey.net/) (recommended for Chrome, Edge, Firefox, etc.) or [Greasemonkey](https://www.greasespot.net/) (for Firefox).

To use this script:

1.  **Install a Userscript Manager:** If you don't have one, install a userscript manager extension (e.g., Tampermonkey) for your browser.
2.  **Create a New Script:**
    *   Click on the Tampermonkey (or equivalent) extension icon in your browser's toolbar.
    *   Select "Create a new script..." or navigate to the Dashboard and click the "+" icon.
3.  **Paste the Code:** Delete any pre-existing boilerplate code in the editor and paste the entire provided JavaScript code into it.
4.  **Save the Script:** Save the script (usually via `File > Save` or `Ctrl+S`/`Cmd+S`).
5.  **Navigate to `app.pixverse.ai`:** The script is configured to automatically activate when you visit any URL under `https://app.pixverse.ai/`. Upon successful loading, a toast notification "Pixverse++ Toolkit loaded ✓" should appear.

Once active, the script will transparently apply its enhancements and bypasses as you interact with the Pixverse website.

### Dependencies

This userscript is self-contained and does not rely on any external libraries or frameworks. It is built entirely using standard Web APIs available in modern browsers, such as:

*   `XMLHttpRequest`
*   `window.fetch`
*   `MutationObserver`
*   `EventTarget.prototype.addEventListener`
*   Standard DOM manipulation methods (`document.querySelector`, `createElement`, `appendChild`, etc.)
*   `console` for logging.
