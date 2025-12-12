// ==UserScript==
// @name        4ndr0tools - InfiniteBrave
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @date        11/21/2025, 2:16:39 AM
// @description Part of 4ndr0tools - Infinitely scroll Brave search results.
// @downloadURL https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools%20-%20InfiniteBrave.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/blob/main/4ndr0tools%20-%20InfiniteBrave.user.js
// @icon        https://raw.githubusercontent.com/4ndr0666/4ndr0site/refs/heads/main/static/cyanglassarch.png
// @match       https://search.brave.com/*
// @license     MIT
// @grant       none
// ==/UserScript==

// Dynamically determine the starting page number based on the current URL's offset
const currentUrlParams = new URLSearchParams(window.location.search);
const currentOffset = parseInt(currentUrlParams.get('offset') || '0', 10);
let pageNumber = currentOffset + 1;

let isLoading = false;
let hasMore = true;

const fetchNextPage = async () => {
    const baseUrl = new URL(window.location.href);
    baseUrl.searchParams.set('offset', pageNumber);

    try {
        const response = await fetch(baseUrl.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const newDoc = new DOMParser().parseFromString(text, 'text/html');

        // Create container for new results
        const container = document.createElement('div');
        container.id = `page-${pageNumber}`;
        container.style.marginTop = '20px';

        // Add new results (adjust selector based on Brave's structure)
        const results = newDoc.querySelectorAll('#results > .snippet');
        if (results.length === 0) {
            hasMore = false;
            return; // No new results found, stop fetching.
        }

        results.forEach(result => {
            container.appendChild(result.cloneNode(true));
        });

        // Find insertion point (before pagination element)
        const insertionPoint = document.querySelector('#pagination-snippet') ||
                             document.querySelector('#results').lastElementChild;

        if (insertionPoint) {
            insertionPoint.before(container);
        } else {
            // Fallback if no insertion point is found but results container exists
            const resultsContainer = document.querySelector('#results');
            if (resultsContainer) {
                resultsContainer.appendChild(container);
            }
        }

        // Check for more pages (look for Next button in the newly fetched content)
        hasMore = !!newDoc.querySelector('a[href*="offset="]:not([disabled])');

        if (hasMore) {
            pageNumber++;
        }
    } catch (error) {
        console.error('Error fetching next page:', error);
        hasMore = false;
    }
};

window.addEventListener('scroll', async () => {
    // A small buffer to prevent triggering on tiny scrolls or non-scrollable pages
    if (document.documentElement.scrollHeight <= window.innerHeight) return;

    const scrollThreshold = 1000; // Load 1000px before the end
    const scrollPosition = window.innerHeight + window.scrollY;
    const scrollMax = document.documentElement.scrollHeight - scrollThreshold;

    if (!isLoading && hasMore && scrollPosition >= scrollMax) {
        isLoading = true;
        await fetchNextPage();
        isLoading = false;
    }
});
