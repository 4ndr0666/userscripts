// ==UserScript==
// @name         xenForo-G-1-0
// @description  Add arrows to show or hide forum sections, Open posts in a single tab or a new tab.
// @version      1.0
// @author       Bruk ಠ‿ಠ
// @namespace    http://tampermonkey.net/
// @run-at document-body
// @match        *://*.fritchy.com/*
// @match        *://*.nudecelebforum.com/*
// @match        *://*.thecentralbox.net/*
// @match        *://*.topboard.org/*
// @match        *://*.doolls.org/*
// @icon         data:image/png;base64,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
// @grant        none
// @downloadURL     http://usa.x10host.com/mybb/script/xenForo-G-1-0.user.js
// @updateURL       http://usa.x10host.com/mybb/script/xenForo-G-1-0.user.js
// ==/UserScript==

// Arrows

(function() {
    'use strict';

    const showText = '⇓';
    const hideText = '⇑';

    function toggleBlockContent(block, blockId, button) {
        const content = block.querySelector('.block-body') || block.querySelector('.block-content');
        if (content) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                localStorage.setItem(blockId, 'visible');
                button.textContent = hideText;
            } else {
                content.style.display = 'none';
                localStorage.setItem(blockId, 'hidden');
                button.textContent = showText;
            }
        }
    }

    function addToggleButtonToBlocks(blocks, blockType) {
        blocks.forEach((block, index) => {
            const blockId = `${blockType}-${index}`;

            const button = document.createElement('button');
            button.textContent = hideText;
            button.style.marginLeft = '10px';
            button.style.cursor = 'pointer';
            button.style.position = 'absolute';
            button.style.right = '10px';
            button.style.top = '50%';
            button.style.transform = 'translateY(-50%)';
            button.style.padding = '2px 5px';
            button.style.fontSize = '1.0em';
            button.style.backgroundColor = 'transparent';
            button.style.border = 'none';
            button.style.color = 'inherit';
            button.style.fontWeight = 'bold';

            const header = block.querySelector('.block-header');
            if (header) {
                header.style.position = 'relative';
                header.appendChild(button);

                button.addEventListener('click', () => toggleBlockContent(block, blockId, button));
            }

            const content = block.querySelector('.block-body') || block.querySelector('.block-content');
            const state = localStorage.getItem(blockId);
            if (content) {
                if (state === 'hidden') {
                    content.style.display = 'none';
                    button.textContent = showText;
                } else {
                    button.textContent = hideText;
                }
            }
        });
    }

    const mainBlocks = document.querySelectorAll('.block.block--category');
    addToggleButtonToBlocks(mainBlocks, 'main-block');

})();

// L-G

(function() {
    'use strict';

    let activateScript = JSON.parse(localStorage.getItem('activateScript')) || false;
    let openInNewTab = JSON.parse(localStorage.getItem('openInNewTab')) || false;
    let hideTimeout;
    let isHideTimeoutActive = false;

    const iconActive = 'data:image/jpg;base64,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';
    const iconInactive = 'data:image/jpg;base64,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';
    const iconOpenInNewTab = 'data:image/jpg;base64,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';
    const iconOpenInSameTab = 'data:image/jpg;base64,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';

    function createButton(id, text, icon, onclick, top, visible = true) {
        let button = document.createElement('button');
        button.id = id;
        button.innerHTML = `<img src="${icon}" style="vertical-align: middle; width: 20px; height: 20px;"/> ${text}`;
        button.style.position = 'fixed';
        button.style.top = top + 'px';
        button.style.right = '10px';
        button.style.zIndex = 1000;
        button.style.padding = '5px';
        button.style.borderRadius = '5px';
        button.style.border = 'none';
        button.style.backgroundColor = '#dfdfdf';
        button.style.color = 'white';
        button.style.fontSize = '14px';
        button.style.cursor = 'pointer';
        button.style.display = visible ? 'block' : 'none';
        button.onclick = onclick;
        document.body.appendChild(button);
    }

    function updateLinks() {
        if (!activateScript) return;

        let currentDomain = window.location.hostname;
        let currentPath = window.location.pathname;

        if (currentPath.includes('/search/')) {
            return;
        }

        let postLinks = document.querySelectorAll('a[href*="/threads/"][href*="post-"]');

        postLinks.forEach(function(link) {
            let matches = link.href.match(/\/threads\/[^.]+\.(\d+)\/post-(\d+)/);

            if (matches) {
                let postId = matches[2];
                let newHref = `https://${currentDomain}/index.php?posts/${postId}/show`;
                link.href = newHref;

                if (openInNewTab) {
                    link.setAttribute('target', '_blank');
                } else {
                    link.removeAttribute('target');
                }
            }
        });
    }

    createButton('toggleScript', activateScript ? ' ' : ' ', activateScript ? iconActive : iconInactive, function() {
        activateScript = !activateScript;
        localStorage.setItem('activateScript', JSON.stringify(activateScript));
        document.getElementById('toggleScript').innerHTML = `<img src="${activateScript ? iconActive : iconInactive}" style="vertical-align: middle; width: 20px; height: 20px;"/> ${activateScript ? 'Function Enabled' : 'Function Disabled'}`;
        let toggleTargetButton = document.getElementById('toggleTarget');
        if (activateScript) {
            if (!toggleTargetButton) {
                createButton('toggleTarget', openInNewTab ? 'Open in Same Tab' : 'Open in New Tab', openInNewTab ? iconOpenInSameTab : iconOpenInNewTab, function() {
                    openInNewTab = !openInNewTab;
                    localStorage.setItem('openInNewTab', JSON.stringify(openInNewTab));
                    document.getElementById('toggleTarget').innerHTML = `<img src="${openInNewTab ? iconOpenInSameTab : iconOpenInNewTab}" style="vertical-align: middle; width: 20px; height: 20px;"/> ${openInNewTab ? 'Open in Same Tab' : 'Open in New Tab'}`;
                    updateLinks();
                    location.reload();
                }, 50, false);
                toggleTargetButton = document.getElementById('toggleTarget');
                document.getElementById('toggleScript').addEventListener('mouseover', function() {
                    toggleTargetButton.style.display = 'block';
                    clearTimeout(hideTimeout);
                });
                document.getElementById('toggleScript').addEventListener('mouseout', function() {
                    if (!isHideTimeoutActive) {
                        hideTimeout = setTimeout(function() {
                            toggleTargetButton.style.display = 'none';
                            isHideTimeoutActive = false;
                        }, 5000);
                        isHideTimeoutActive = true;
                    }
                });
                toggleTargetButton.addEventListener('mouseover', function() {
                    clearTimeout(hideTimeout);
                    isHideTimeoutActive = false;
                });
                toggleTargetButton.addEventListener('mouseout', function() {
                    if (!isHideTimeoutActive) {
                        hideTimeout = setTimeout(function() {
                            toggleTargetButton.style.display = 'none';
                            isHideTimeoutActive = false;
                        }, 5000);
                        isHideTimeoutActive = true;
                    }
                });
            }
        } else {
            if (toggleTargetButton) toggleTargetButton.remove();
        }
        updateLinks();
        location.reload();
    }, 10, true);

    if (activateScript) {
        createButton('toggleTarget', openInNewTab ? 'Open in Same Tab' : 'Open in New Tab', openInNewTab ? iconOpenInSameTab : iconOpenInNewTab, function() {
            openInNewTab = !openInNewTab;
            localStorage.setItem('openInNewTab', JSON.stringify(openInNewTab));
            document.getElementById('toggleTarget').innerHTML = `<img src="${openInNewTab ? iconOpenInSameTab : iconOpenInNewTab}" style="vertical-align: middle; width: 20px; height: 20px;"/> ${openInNewTab ? 'Open in Same Tab' : 'Open in New Tab'}`;
            updateLinks();
            location.reload();
        }, 50, false);
        let toggleTargetButton = document.getElementById('toggleTarget');
        document.getElementById('toggleScript').addEventListener('mouseover', function() {
            toggleTargetButton.style.display = 'block';
            clearTimeout(hideTimeout);
        });
        document.getElementById('toggleScript').addEventListener('mouseout', function() {
            if (!isHideTimeoutActive) {
                hideTimeout = setTimeout(function() {
                    toggleTargetButton.style.display = 'none';
                    isHideTimeoutActive = false;
                }, 5000);
                isHideTimeoutActive = true;
            }
        });
        toggleTargetButton.addEventListener('mouseover', function() {
            clearTimeout(hideTimeout);
            isHideTimeoutActive = false;
        });
        toggleTargetButton.addEventListener('mouseout', function() {
            if (!isHideTimeoutActive) {
                hideTimeout = setTimeout(function() {
                    toggleTargetButton.style.display = 'none';
                    isHideTimeoutActive = false;
                }, 5000);
                isHideTimeoutActive = true;
            }
        });
    }

    window.addEventListener('load', updateLinks);
})();