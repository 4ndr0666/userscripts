// ==UserScript==
// @name        B++
// @name:zh-CN   B艹：必应搜索页面大修
// @name:en      B++:Bing Search Page Overhaul
// @namespace    Bing Plus Plus
// @version      2.01
// @description:zh-CN  移除必应搜索页面大量元素，去除网页logo，改成双列瀑布流结果，百度贴吧自动正确跳转，自动连续到下一页
// @description:en  Remove a large number of elements on the Bing search page, remove the webpage logo, change to a two-column waterfall layout for the results, ensure Baidu Tieba automatically redirects correctly, and automatically continue to the next page.
// @author       Yog-Sothoth
// @match        https://*.bing.com/search*
// @grant        GM_addStyle
// @license MIT
// @description Remove the random recommendations, bottom bar, sidebar, microphone, and search optimization from the Bing search page. Remove the website logo and switch to a dual-column search result layout. Automatically redirect to the correct Baidu Tieba page. 移除必应搜索页面莫名其妙的推荐、底部栏、侧边栏、麦克风、优化搜索等，去除网页logo，改成双列搜索结果，百度贴吧自动正确跳转
// @downloadURL https://update.greasyfork.org/scripts/530608/B%2B%2B.user.js
// @updateURL https://update.greasyfork.org/scripts/530608/B%2B%2B.meta.js
// ==/UserScript==

(function() {
    'use strict';

    /**
     * 删除指定选择器匹配的所有元素，应该能优化一下
     */
    function removeElement(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => element.remove());
    }

    /**
     * 修正 Bing 搜索结果中贴吧链接的 URL，将 "jump2.bdimg" 或 "jump.bdimg" 替换为 "tieba.baidu"，谁把跳转页也放进正常爬虫了，百度的robot.txt写错了？
     */
    function replace() {
        let as = document.querySelectorAll('#b_content .b_algo h2 a');
        let as2 = document.querySelectorAll('#b_content .b_algo .b_tpcn .tilk');

        for (let i = 0; i < as.length; i++) {
            let url = as[i].getAttribute('href');
            let new_url = url.replace(/jump2\.bdimg|jump\.bdimg/, 'tieba.baidu');
            as[i].setAttribute('href', new_url);
            as2[i].setAttribute('href', new_url);
        }
    }

    /**
     * 双页紧凑瀑布流
     */
    const css = `
        #b_context { display: none; } /* 隐藏 Bing 侧边栏 */
        #b_content { padding: 30px 15px !important; } /* 调整搜索内容区域的边距 */
        #b_results { display: flex; flex-wrap: wrap; width: 100% !important; } /* 结果列表使用流式布局 */
        #b_results > li { width: 40%; margin-right: 50px; } /* 调整搜索结果项的宽度和间距 */
        .b_pag, .b_ans { width: 100% !important; } /* 分页和答案区域全宽 */
        #b_results .ContentItem { display: inline-flex; flex-wrap: wrap; width: 40%; } /* 文章项布局优化 */
        #b_results .MainContent_Sub_Left_MainContent { max-width: 100% !important; } /* 主内容区域最大化适应 */
    `;
    GM_addStyle(css);

    /**
     * 元素选择器
     */
    const elementsToRemove = [
        '.b_ans', '.b_ans .b_mop', '.b_vidAns', '.b_rc_gb_sub', '.b_rc_gb_sub_section',
        '.b_rc_gb_scroll', '.b_msg', '.b_canvas', '.b_footer', '.b_phead_sh_link',
        '.b_sh_btn-io', '#id_mobile', '[aria-label="更多结果"]', '.b_algoRCAggreFC',
        '.b_factrow b_twofr', '[id^="mic_"]', '[class="tpic"]',
        '[class="b_vlist2col b_deep"]', '[class="b_deep b_moreLink "]',
        '.b_algo b_vtl_deeplinks', '[class="tab-head HeroTab"]',
        '[class="tab-menu tab-flex"]', '[class="b_deepdesk"]',
        '[class^="b_algo b_algoBorder b_rc_gb_template b_rc_gb_template_bg_"]',
        '[class="sc_rf"]', '[class="b_algospacing"]','[id="b_pole"]'
    ];

    /**
     * 监听 DOM 变化，每次变化时删除指定的页面元素。
     */
    const observer = new MutationObserver(() => {
        elementsToRemove.forEach(removeElement);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    /**
     * 清理大多数大的块状结果，这东西只能占用页面
     */
    function updateClassForBAlgoElements() {
        const bContent = document.getElementById('b_results');
        if (bContent) {
            Array.from(bContent.children).forEach(element => {
                if (element.classList.contains('b_algo') && element.classList.contains('b_rc_gb_template')) {
                    element.classList.remove(...[...element.classList].filter(cls => cls.startsWith('b_rc_gb_template_bg_')));
                    element.classList.add('b_algo');
                }
            });
        }
    }

    /**
     * 简化 Bing 搜索 URL，去除不必要的参数，仅保留查询参数 "q" 和 "first"，bing的页面计数靠后者，挺怪的
     */
    function simplifyBingUrl() {
        const urlObj = new URL(window.location.href);
        const query = urlObj.searchParams.get('q');
        const first = urlObj.searchParams.get('first');
        let simplifiedUrl = `${urlObj.origin}${urlObj.pathname}?q=${encodeURIComponent(query)}`;
        if (first) simplifiedUrl += `&first=${encodeURIComponent(first)}`;
        if (query && window.location.href !== simplifiedUrl) history.replaceState(null, '', simplifiedUrl);
        return window.location.href;
    }

    /**
     * 自动连续页（搞页面位置标签貌似没什么用，不弄了）
     */
    function processBingSearchPage() {
        const urlParams = new URLSearchParams(window.location.search);
        let first = parseInt(urlParams.get('first'), 10) || 1;
        const query = urlParams.get('q');
        const resultsContainer = document.getElementById('b_results');
        const paginationElement = document.querySelector('.b_pag');

        if (first === 1) fetchResults(5);

        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 300)) {
                first += 10;
                fetchResults(first);
            }
        });

        function fetchResults(pageFirst) {
            fetch(`https://www4.bing.com/search?q=${query}&first=${pageFirst}`)
                .then(response => response.text())
                .then(data => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data, 'text/html');
                    const results = doc.querySelectorAll('.b_algo');
                    results.forEach(result => {
                        resultsContainer.insertBefore(result.cloneNode(true), paginationElement);
                    });
                })
                .catch(error => console.error('Error fetching results:', error));
        }
    }

    /**
     * 自动将 Bing 网址的 "www." 或 "cn." 前缀替换为 "www4."，应对白屏bug和可能的加速访问
     */
    function redirectTowww4IfNeeded() {
        const urlObj = new URL(window.location.href);
        if (/^(www\.|cn\.)/.test(urlObj.hostname)) {
            window.location.href = `https://www4.${urlObj.hostname.replace(/^(www\.|cn\.)/, '')}${urlObj.pathname}${urlObj.search}`;
        }
    }

    redirectTowww4IfNeeded();
    updateClassForBAlgoElements();
    elementsToRemove.forEach(removeElement);
    simplifyBingUrl();
    replace();
    processBingSearchPage();

    /**
     * 监听页面变动以保持替换（以后可能改成局部以提升效率）
     */
    var _pushState = window.history.pushState;
    window.history.pushState = function() {
        replace();
        console.log('History changed');
        return _pushState.apply(this, arguments);
    };
})();


