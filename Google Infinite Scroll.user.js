// ==UserScript==
// @name:ko           구글 무한 스크롤
// @name              Google Infinite Scroll

// @description:ko    -
// @description       -

// @namespace         https://ndaesik.tistory.com/
// @version           2025.01.10.08.44
// @author            ndaesik
// @icon              https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.google.com

// @match             *://www.google.com/search*
// @grant             GM_xmlhttpRequest
// @run-at            document-end
// @connect           *
// @downloadURL https://update.greasyfork.org/scripts/439575/Google%20Infinite%20Scroll.user.js
// @updateURL https://update.greasyfork.org/scripts/439575/Google%20Infinite%20Scroll.meta.js
// ==/UserScript==

if(new URL(window.location.href).searchParams.has('udm')) return;

document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
        #botstuff [role="navigation"] { display: none !important; }
        .youtube-thumbnail {
            object-fit: cover !important;
            width:100%;
            height:100%;
        }
        img[src="data:text/plain;base64,"] {
            opacity: 0 !important;
        }
    `
}));

const PLACEHOLDER_SELECTOR = '[src="data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="]';

const getYoutubeVideoId = url => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('youtube.com') ? urlObj.searchParams.get('v') : null;
    } catch (error) {
        return (console.error('Error parsing YouTube URL:', error), null);
    }
};

async function replaceYoutubeThumbnail(imgElement) {
    try {
        const container = imgElement.closest('[data-curl*="youtube.com/watch"]');
        if (!container) return;
        const videoId = getYoutubeVideoId(container.getAttribute('data-curl'));
        if (!videoId) return;
        const dataUrl = await convertImageToDataUrl(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`);
        dataUrl && (imgElement.src = dataUrl, imgElement.classList.add('youtube-thumbnail'));
    } catch (error) {
        console.error('Error replacing YouTube thumbnail:', error);
        imgElement.src.startsWith('data:text/plain;base64,') && (imgElement.style.opacity = '0');
    }
}

async function convertImageToDataUrl(imageUrl) {
    return new Promise(resolve =>
        GM_xmlhttpRequest({
            method: "GET",
            url: imageUrl,
            responseType: "blob",
            onload: ({response}) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(response);
            },
            onerror: error => (console.error('Error fetching image:', error), resolve(null))
        })
    ).catch(error => (console.error('Error converting image:', error), null));
}

async function getOGImage(url) {
    return new Promise((resolve) =>
        GM_xmlhttpRequest({
            method: "GET",
            url,
            onload: ({responseText}) => {
                const doc = new DOMParser().parseFromString(responseText, "text/html");
                resolve(doc.querySelector('meta[property="og:image"]')?.content || doc.querySelector('img[src^="http"]')?.src || null);
            },
            onerror: (error) => (console.error('Error fetching page:', error), resolve(null))
        })
    ).catch(() => null);
}

async function replacePlaceholderImage(imgElement) {
    try {
        let url, ogImageUrl, dataUrl;
        const youtubeContainer = imgElement.closest('[data-curl*="youtube.com/watch"]');
        youtubeContainer ? (await replaceYoutubeThumbnail(imgElement), imgElement.classList.add('youtube-thumbnail')) :
            (url = imgElement.parentElement?.parentElement?.parentElement?.parentElement?.querySelector('a[data-ved]')?.href) ?
                (ogImageUrl = await getOGImage(url)) ?
                    (dataUrl = await convertImageToDataUrl(ogImageUrl)) ? imgElement.src = dataUrl : null
                : null
            : null;
    } catch (error) { console.debug(error); }
}

const fetchNextPage = async pageNumber => {
    const baseUrl = new URL(window.location.href);
    const text = await (await fetch(`${baseUrl.origin}${baseUrl.pathname}?q=${baseUrl.searchParams.get('q')}&start=${pageNumber * 10}`)).text();
    const newDoc = new DOMParser().parseFromString(text, 'text/html');
    const container = document.createElement('div');
    container.id = `page-${pageNumber}`;
    container.style.cssText = 'margin-top: 20px;';
    newDoc.querySelectorAll('#rso > div').forEach(result => container.appendChild(result.cloneNode(true)));
    const lastAddedPage = document.querySelector(`#page-${pageNumber - 1}`) || document.querySelector('#botstuff');
    lastAddedPage.after(container);

    const newPlaceholders = container.querySelectorAll(PLACEHOLDER_SELECTOR);
    const youtubeResults = container.querySelectorAll('[data-curl*="youtube.com/watch"]');

    if (youtubeResults.length > 0) {
        newPlaceholders.forEach(replacePlaceholderImage);
    }

    return !!newDoc.querySelector('#pnnext');
};

let [pageNumber, isLoading, hasMore] = [1, false, true];

window.addEventListener('scroll', async () => {
    if (!isLoading && hasMore && window.innerHeight + window.pageYOffset >= document.documentElement.offsetHeight - 1000) {
        isLoading = true;
        hasMore = await fetchNextPage(pageNumber);
        pageNumber += hasMore ? 1 : 0;
        isLoading = false;
    }
});