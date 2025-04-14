// ==UserScript==
// @name         Instagram Keyboard Shortcuts for Power User
// @namespace    http://tampermonkey.net/
// @version      2.5.0
// @description  Scroll through posts with standard J/K keyboard shortcuts. L to like, O to save, U/I to rewind/fast forward video, M to Mute/Unmute, Space to play/pause video. On the Reels page use left/right arrow keys to rewind/fast forward video.
// @author       French Bond
// @match        https://www.instagram.com/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @downloadURL https://update.greasyfork.org/scripts/395616/Instagram%20Keyboard%20Shortcuts%20for%20Power%20User.user.js
// @updateURL https://update.greasyfork.org/scripts/395616/Instagram%20Keyboard%20Shortcuts%20for%20Power%20User.meta.js
// ==/UserScript==

/* globals jQuery, $ */
/* jshint esversion: 6 */

let seeAll = true;
let currentArticle = null;
let searchFocused = false;
let scrolling = false;
let slideshowInterval;
let isSlideshow = false;

const fastForward = 2;
const rewind = 1;

$(function () {
  'use strict';

  const headerHeight = 10;
  const scrollSpeed = 200;

  function startSlideshow() {
    isSlideshow = true;
    slideshowInterval = setInterval(() => {
      findAndClickButton('Next');
    }, 5000);
  }

  function stopSlideshow() {
    isSlideshow = false;
    clearInterval(slideshowInterval);
  }

  // Disable when user is typing
  $('input,textbox,select')
    .focus(() => {
      searchFocused = true;
    })
    .blur(() => {
      searchFocused = false;
    });

  // Function to determine the current page
  function getCurrentPage() {
    const url = window.location.href;
    if (url === 'https://www.instagram.com/') return 'home';
    if (url.includes('/reels/')) return 'reels';
    if (url.includes('/p/')) return 'post';
    if (url.includes('/saved/')) return 'saved';
    if (url.includes('/explore/')) return 'explore';
    if (url.includes('/accounts/')) return 'profile';
    if (url.includes('/explore/tags/')) return 'tag';
    if (url.includes('/explore/locations/')) return 'location';
    if (url.includes('/tv/')) return 'igtv';
    return 'unknown';
  }

  // Function to check if an element is visible
  function isVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);

    // Check if the element has zero size
    const hasSize = !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );

    // Check visibility-related CSS properties
    const isNotHidden =
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0';

    return hasSize && isNotHidden;
  }

  // Function to find and control video
  function findAndControlVideo(action) {
    const video = $(currentArticle).find('video')[0];
    if (video) {
      switch (action) {
        case 'playPause':
          if (video.paused) video.play();
          else video.pause();
          break;
        case 'rewind':
          video.currentTime -= rewind;
          break;
        case 'fastForward':
          video.currentTime += fastForward;
          break;
        case 'muteUnmute':
          const muteButton = $(currentArticle).find(
            '[aria-label="Toggle audio"]'
          );
          if (muteButton.length) {
            muteButton.click();
          }
          break;
      }
    }
  }

  function findTopVideo() {
    let closestVideo = null;
    let closestDistance = Infinity;
    $('video').each(function () {
      const rect = this.getBoundingClientRect();
      const distance = Math.abs(rect.top);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestVideo = this;
      }
    });
    return closestVideo;
  }

  function scrollTo(pageY) {
    scrolling = true;
    $('html, body').animate(
      { scrollTop: pageY },
      {
        duration: scrollSpeed,
        done: () => {
          scrolling = false;
        },
      }
    );
  }

  // Function to find and click a button
  function findAndClickButton(ariaLabel) {
    let button = document.querySelector(`button[aria-label="${ariaLabel}"]`);
    if (!button) {
      button = document.querySelector(
        `button:has(svg[aria-label="${ariaLabel}"])`
      );
    }
    if (button) {
      button.click();
    }
  }

  // Keyboard shortcuts for Home page
  function homeKeyboardShortcuts(e) {
    switch (e.keyCode) {
      case 65: // A - Toggle see all
        seeAll = !seeAll;
        break;
      case 74: // J - Scroll down
        if (seeAll && $(currentArticle).find('[aria-label="Next"]').length) {
          $(currentArticle).find('[aria-label="Next"]').click();
        } else {
          $('article').each(function (index, article) {
            const top = $(article).offset().top - headerHeight;
            if (isVisible(article) && top > $(window).scrollTop() + 1) {
              scrollTo(top);
              currentArticle = article;
              return false;
            }
          });
        }
        break;
      case 75: // K - Scroll up
        if (seeAll && $(currentArticle).find('[aria-label="Go Back"]').length) {
          $(currentArticle).find('[aria-label="Go Back"]').click();
        } else {
          let previousArticle = null;
          $('article').each(function (index, article) {
            const top = $(article).offset().top - headerHeight;
            if (
              isVisible(article) &&
              top > $(window).scrollTop() - headerHeight - 20
            ) {
              if (previousArticle) {
                scrollTo($(previousArticle).offset().top - headerHeight);
                currentArticle = previousArticle;
              }
              return false;
            }
            previousArticle = article;
          });
        }
        break;
      case 76: // L - Like
        $('[aria-label="Like"],[aria-label="Unlike"]', currentArticle)
          .parent()
          .click();
        break;
      case 79: // O - Save
        const firstElement = $(
          '[aria-label="Save"],[aria-label="Remove"]',
          currentArticle
        )[0];
        $(firstElement).parent().click();
        break;
      case 32: // Space - Play/pause video
        findAndControlVideo('playPause');
        e.preventDefault(); // Prevent page scroll
        break;
      case 85: // U - Rewind
        findAndControlVideo('rewind');
        break;
      case 73: // I - Fast forward
        findAndControlVideo('fastForward');
        break;
      case 77: // M - Mute/unmute video
        findAndControlVideo('muteUnmute');
        break;
    }
  }

  function postKeyboardShortcuts(e) {
    switch (e.keyCode) {
      case 74: // J - Next
        findAndClickButton('Next');
        break;
      case 75: // K - Previous
        findAndClickButton('Go back');
        break;
      case 32: // Space - Toggle slideshow
        e.preventDefault();
        if (isSlideshow) {
          stopSlideshow();
        } else {
          startSlideshow();
        }
        break;
    }
  }

  // Keyboard shortcuts for Reels page
  function reelsKeyboardShortcuts(e) {
    switch (e.keyCode) {
      case 39: // Right arrow - Fast forward
        const videoFF = findTopVideo();
        if (videoFF) {
          videoFF.currentTime += fastForward;
        }
        e.preventDefault();
        break;
      case 37: // Left arrow - Rewind
        const videoRW = findTopVideo();
        if (videoRW) {
          videoRW.currentTime -= rewind;
        }
        e.preventDefault();
        break;
    }
  }

  // Main keydown event handler
  $('body').keydown(function (e) {
    if (searchFocused || scrolling) return;

    const currentPage = getCurrentPage();
    console.log('Current page:', currentPage);

    switch (currentPage) {
      case 'home':
        homeKeyboardShortcuts(e);
        break;
      case 'reels':
        reelsKeyboardShortcuts(e);
        break;
      case 'post':
        postKeyboardShortcuts(e);
        break;
    }
  });
});
