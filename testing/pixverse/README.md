This document provides comprehensive technical documentation for the 4ndr0tools-Pixverse++ UserScript.

---

4ndr0tools-Pixverse++ UserScript Documentation
Summary
The 4ndr0tools-Pixverse++ UserScript is designed to enhance the red teams exercises by bypassing certain restrictions, automating download processes, and intercepting API calls to modify responses. It specifically targets video blocks, automatically reveals download options, and ensures successful media uploads even when the server might return an error.

Key Features:

* Video Block Bypass: Modifies API responses to change video statuses from "blocked" (status 7) to "available" (status 1).

* Auto-Reveal Download: Replaces the "Watermark-free" button with a functional one that directly downloads the currently displayed video.

* API Interception (XHR & Fetch): Intercepts both XMLHttpRequest and fetch API calls to:

* Capture the path of successfully uploaded media.

* Modify error responses for media uploads (batch and single) to appear as successful, using the captured media path.

Constants & State
* DEBUG_PREFIX: string

* A string prefix [Pixverse Bypass] used for all console log messages to easily identify script output.

* MAX_ATTEMPTS: number

* The maximum number of attempts for the setupWatermarkButton function to find and attach the download button, preventing infinite loops.

* savedMediaPath: string | null

* Stores the path of a successfully uploaded media item. This path is captured from outgoing requests and then used to craft "success" responses for subsequent API calls that might otherwise fail.

* isInitialized: boolean

* A flag indicating whether the script's core initialization (API overrides, button setup) has completed. Prevents re-initialization.

* btnAttached: boolean

* A flag indicating whether the custom "Watermark-free" download button has been successfully attached to the DOM.

Logging Helpers
These simple functions wrap console.log and console.error to prepend the DEBUG_PREFIX, making script-specific messages easily identifiable in the browser console.

* #### log(...args)

* Description: Logs messages to the console with the DEBUG_PREFIX.

* Parameters:

* ...args: any - Any number of arguments to be logged.

* Return Value: void

* #### error(...args)

* Description: Logs error messages to the console with the DEBUG_PREFIX.

* Parameters:

* ...args: any - Any number of arguments to be logged as an error.

* Return Value: void

API Response Modification Core
This section contains functions responsible for inspecting and modifying API request bodies and responses.

* #### extractMediaPath(data, url)

* Description: Extracts the media path from an API request body based on the URL. This path is crucial for later faking successful upload responses.

* Parameters:

* data: object - The parsed request body data.

* url: string - The URL of the API request.

* Return Value: string | null - The extracted media path, or null if not found or applicable.

* #### modifyVideoList(data)

* Description: Modifies the response data for the /video/list/personal API endpoint. It changes video_status from 7 (blocked) to 1 (available) and ensures first_frame and url fields are correctly populated for display.

* Parameters:

* data: object - The original JSON response data from the /video/list/personal API.

* Return Value: object - The modified response data.

* #### modifyBatchUpload(data)

* Description: Modifies the response data for the /media/batch_upload_media API endpoint. If the original response indicates an error (ErrCode === 400) but a savedMediaPath exists (meaning the upload likely succeeded on the server despite the error response), it crafts a success response using the savedMediaPath.

* Parameters:

* data: object - The original JSON response data from the /media/batch_upload_media API.

* Return Value: object - The modified (or original) response data.

* #### modifySingleUpload(data)

* Description: Modifies the response data for the /media/upload API endpoint. Similar to modifyBatchUpload, if the original response indicates a specific error (ErrCode === 400040) and a savedMediaPath is available, it crafts a success response.

* Parameters:

* data: object - The original JSON response data from the /media/upload API.

* Return Value: object - The modified (or original) response data.

* #### modifyResponse(data, url)

* Description: A dispatcher function that determines which specific modification function to apply based on the API URL.

* Parameters:

* data: object - The original JSON response data.

* url: string - The URL of the API request.

* Return Value: object | null - The modified response data if a relevant modification is applied, otherwise null.

XHR Interceptor
* #### overrideXHR()

* Description: Overrides the native XMLHttpRequest.prototype.open and XMLHttpRequest.prototype.send methods to intercept and modify XHR requests and responses.

* Behavior:

* Request Interception: When send is called, it checks if the URL is a media upload endpoint (/media/batch_upload_media or /media/upload). If so, it attempts to parse the request body (FormData or JSON) and calls extractMediaPath to capture the savedMediaPath.

* Response Interception: Attaches a load event listener to the XHR object. When the response is received (status 2xx), it parses the response JSON and passes it to modifyResponse. If modifyResponse returns a modified object, it redefines the response and responseText properties of the XHR object to reflect the modified data.

* Return Value: void

* Throws: Logs an error if XMLHttpRequest is not supported or if the override fails.

Fetch Interceptor
* #### overrideFetch()

* Description: Overrides the native window.fetch method to intercept and modify Fetch API requests and responses.

* Behavior:

* Request Interception: Before calling the original fetch, it checks if the URL is a media upload endpoint. If so, it attempts to parse the request body and calls extractMediaPath to capture the savedMediaPath.

Response Interception: After the original fetch call resolves, it clones the response. If the response content type is JSON, it parses the JSON and passes it to modifyResponse. If modifyResponse returns a modified object, it constructs a new* Response object with the modified JSON body, preserving original headers and status. It also patches the json() and text() methods of this new Response to ensure subsequent calls return the modified data.

* Return Value: void

* Throws: Logs an error if window.fetch is not supported or if the override fails.

Watermark-free Download Button Logic
* #### setupWatermarkButton()

* Description: This function is responsible for finding the "Watermark-free" text element on the page and replacing it with a functional download button. It uses a MutationObserver to ensure robustness in Single-Page Applications (SPAs) where the DOM might change dynamically.

* Behavior:

* Searches for an element containing the text "Watermark-free".

* If found, it creates a new element, copies basic styling from the original element, and applies custom styles for visibility.
* Attaches an onclick event listener to the new button. When clicked, it finds the main video element on the page, extracts its src URL, and triggers a download using a temporary element.

* Replaces the original "Watermark-free" element with the new button.

* Uses a MutationObserver to continuously monitor the document.body for changes, re-running the button attachment logic if the target element disappears and reappears (e.g., during navigation or re-renders).

* Return Value: void

Initialization
* #### initialize()

* Description: The main entry point for the UserScript's core logic. It orchestrates the setup of API interceptors and the download button.

* Behavior:

* Calls overrideXHR() to set up XHR interception.

* Calls overrideFetch() to set up Fetch API interception.

* Calls setupWatermarkButton() to set up the download button.

* Sets isInitialized to true to prevent re-initialization.

* Return Value: void

* Throws: Logs an error if any part of the initialization fails.

Dependencies
This UserScript is self-contained and does not rely on any external libraries or frameworks (e.g., jQuery, React, etc.). It uses only native browser APIs (XMLHttpRequest, fetch, MutationObserver, console, document).

Usage Example
Since this is a UserScript, its usage involves installation in a compatible browser environment.

1. Install a UserScript Manager:

* For Chrome, Brave, Edge: Install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) or [Violentmonkey](https://chrome.google.com/webstore/detail/violentmonkey/jfgdnpcnjdaigbdikiadmgfbchenfokn).

* For Firefox: Install [Tampermonkey](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/).

2. Install the UserScript:

* Navigate to the script's download URL: https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools-Pixverse++.user.js

* Your UserScript manager should detect the .user.js file and prompt you to install it. Confirm the installation.

3. Verify Installation:

* After installation, visit https://app.pixverse.ai/.

* Open your browser's developer console (F12). You should see [Pixverse Bypass] messages indicating the script's initialization and activity.

* Navigate to your video list; videos that were previously blocked (e.g., with status 7) should now appear as available.

* When viewing a video, the "Watermark-free" button should be replaced by a custom-styled button that, when clicked, downloads the video directly.

* When uploading media, even if Pixverse shows an error, the script attempts to make the upload appear successful in the UI if it captured a valid media path.
