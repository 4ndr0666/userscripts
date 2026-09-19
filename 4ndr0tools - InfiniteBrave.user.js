// ==UserScript==
// @name        4ndr0tools - InfiniteBrave
// @namespace   https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     1.0
// @description Infinitely scroll Brave search results.
// @downloadURL https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20InfiniteBrave.user.js
// @updateURL   https://github.com/4ndr0666/userscripts/raw/refs/heads/main/4ndr0tools%20-%20InfiniteBrave.user.js
// @icon        data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @match       https://search.brave.com/*
// @license     UNLICENSED - RED TEAM USE ONLY
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
