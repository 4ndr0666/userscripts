// ==UserScript==
// @name         4ndr0tools - AdRemover (Ψ-Optimized)
// @namespace    https://github.com/4ndr0666/userscripts
// @version      1.40
// @author       Sagie Gur-Ari & 4ndr0666 & Ψ-Anarch
// @description  Removes Ad Containers from DOM. This version is dynamically optimized based on user-provided browsing history for maximum personal effectiveness.
//
// == Base Targets ==
// @match        https://*.ynet.co.il/*
// @match        https://*.mynet.co.il/*
// @match        https://*.calcalist.co.il/*
// @match        https://*.globes.co.il/*
// @match        https://*.wikipedia.org/*
// @match        https://*.reddit.com/*
// @match        https://*.youtube.com/*
// @match        https://*.sourceforge.net/*
// @match        https://*.fandom.com/*
// @match        https://*.wikia.com/*
//
// @match        *://*.simpcity.cr/*
// @match        *://*.hailuoai.video/*
// @match        *://*.jpg6.su/*
// @match        *://*.forums.socialmediagirls.com/*
// @match        *://*.sora.chatgpt.com/*
// @match        *://*.bunkr.ws/*
// @match        *://*.bunkr.ph/*
// @match        *://*.saint2.su/*
// @match        *://*.saint2.cr/*
// @match        *://*.thotdeep.com/*
// @match        *://*.pixhost.to/*
// @match        *://*.gofile.io/*
// @match        *://*.erome.com/*
// @match        *://*.pixeldrain.com/*
// @match        *://*.thefappeningblog.com/*
// @match        *://*.celebjihad.com/*
// @match        *://*.greasyfork.org/*
// @match        *://*.icloud.com/*
// @match        *://*.imagepond.net/*
// @match        *://*.imgbox.com/*
// @match        *://*.pangea.cloud/*
// @match        *://*.yandex.com/*
// @match        *://*.instagram.com/*
// @match        *://*.tensorpix.ai/*
// @match        *://*.motionmuse.ai/*
// @match        *://*.video.a2e.ai/*
//
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://greasyfork.org/scripts/18490-ads-dom-remover-runner/code/Ads%20DOM%20Remover%20Runner.js
// @grant        none
// @license      MIT License
// @downloadURL https://update.greasyfork.org/scripts/18491/Ads%20DOM%20Remover.user.js
// @updateURL https://update.greasyfork.org/scripts/18491/Ads%20DOM%20Remover.meta.js
// ==/UserScript==

(function run($, runner) {
    'use strict';

    const selectorDefinitions = {
        ynet: {
            hostNames: ['ynet', 'calcalist'],
            selectors: [
                '#colorbox', '#cboxOverlay', '#ads.premium', '#articleLayoutrightsidtable', '#google_image_div', 'img[src*="dynamicyield"]', 'div.MSCmainContent', '[id*="arketingCarouse"]', '[id*="arketingRecommended"]', '.mainVerticalArticleSharingLinks', '.OUTBRAIN', '.topBannerWrap', '.block.B3 .B3.ghcite.dyother.dyMonitor div', '.bigdealhomepage', '#ww6s_Main', '.buyandsavedy', '.area.footer.ghcite', '.hdr_set_homepage', '#c1_Hor', '#c2_Hor', '#c3_Hor', '#c4_Hor', '#c5_Hor', '#c6_Hor', '.homepagevideo-x6', '.buyandsave', '.general-image', '.PhotoArticlesTalkbacks', '[name="ExternalWebpageIframe"]', '#PROCOIL_SearchForm', '#magazines1024', '[id^="promo_"]', '[id^="ads."]', '[class*="facebook"]', '[class*="WinWin"]', '.main_search_radio', 'tr td [id^="ads."]', '.art-action-wrp', '.header-user-profile', '.left-art-content', '[class*="GeneralBanner"]', '#vilon', '#prime.shook', '#articlebottomsharinglinks', '.floatingPlayerimReallyDummy_container', '#ynet_user_login', '[title="YouTube"]', '[title="facebook"]', '#INDbtnWrap', '.YnetPremiumHeaderLogin', '.CreditLogos', '.tp-modal',
                { selector: '.homepagelitevideo', fineTuneSelector: ($element) => $element.parent().parent() },
                { selector: 'iframe', fineTuneSelector: ($element) => $element.filter(function () { return !$(this).parent().hasClass('news_ticker_iframe'); })},
                { selector: 'div.B2b.block div', pre: ($element) => { $element.parent().css({ height: '1px' }); }}
            ]
        },
        globes: {
            hostNames: 'globes',
            selectors: ['#chromeWindow', { selector: 'iframe', filter: ($element) => $element.not('#GlobalFinanceData_home[src~=/news/]') }]
        },
        wikipedia: {
            hostNames: 'wikipedia.org',
            selectors: ['#frbanner', '#frb-inline', '#wlm-banner', '#centralNotice', '.frb-main', '.frbanner', '.frm', '.frb']
        },
        wikia: {
            hostNames: ['wikia.com', 'fandom.com'],
            selectors: ['.WikiaFooter', '.WikiaRail', '.wds-global-footer', '.top-ads-container', '.bottom-ads-container']
        },
        reddit: {
            hostNames: 'reddit.com',
            selectors: ['#onboarding-splash', '[id^="google_ads"]', '[data-before-content="promoted"]', 'div[data-testid="frontpage-sidebar"] > div:last-child']
        },
        youtube: {
            hostNames: 'youtube.com',
            selectors: ['#masthead-ad', '.video-ads', 'ytp-ad-module', '.ytp-ad-overlay-ad-info-dialog-container', '.ytp-ad-overlay-slot', 'ytd-ad-slot-renderer', 'ytd-promoted-sparkles-web-renderer'],
            options: { loops: 200, interval: 2500 }
        },
        simpcity: {
            hostNames: 'simpcity.cr',
            selectors: ['.p-body-sidebar', '.p-footer-inner', '.ipsConnect_loginBar', '[class*="ad-container"]', '.Google-Ad']
        },
        socialmediagirls: {
            hostNames: 'forums.socialmediagirls.com',
            selectors: ['.p-body-sidebar', 'div[class^="ad-unit"]', 'div[data-ad-id]', '.p-footer-ad-wrapper']
        },
        image_video_hosts: {
            hostNames: ['jpg6.su', 'saint2.su', 'saint2.cr', 'bunkr.ws', 'bunkr.ph', 'pixhost.to', 'gofile.io', 'pixeldrain.com', 'imgbox.com', 'imagepond.net'],
            selectors: ['.ads', '.ad-wrapper', '.ad-container', '.ad-overlay', '.pop-up', '#promo', '#advert', 'iframe[name="ads"]', 'a[href*="/ads/"]']
        },
        thotdeep: {
            hostNames: 'thotdeep.com',
            selectors: ['.under-video-ad', '.sidebar-ad', '.video-ad-container', '.popup-ad']
        },
        erome: {
            hostNames: 'erome.com',
            selectors: ['#gallery-ad', '.ad-container', '.sidebar-ads']
        },
        thefappeningblog: {
            hostNames: 'thefappeningblog.com',
            selectors: ['.text-under-player-links-container', '.under-post-ad', 'div[id*="ezoic-ad"]']
        },
        celebjihad: {
            hostNames: 'celebjihad.com',
            selectors: ['.sidebar-ad', '.post-ad', '.ad-block', '#ads']
        },
        hailuoai: {
            hostNames: 'hailuoai.video',
            selectors: ['.upgrade-vip-dialog', '.vip-banner']
        },
        instagram: {
            hostNames: 'instagram.com',
            selectors: ['div[role="dialog"]', 'div > div > span > a[href="/accounts/login/"]']
        }
    };

    const ynetExtraSelectors = ['#dcPremiumRightImg', '.boulevard', '#multiarticles-9', '#multiarticles-12', '#multiarticles-13', '#multiarticles-14', '#multiarticles-15', '#multiarticles-16', '.CdaMostViews', '.CdaCalcalistToday', '.CdaRecomendedMovies', '#SpecialBuilder1280', '.cdaFooter1280'];
    ynetExtraSelectors.forEach(selector => {
        selectorDefinitions.ynet.selectors.push({
            selector: selector,
            fineTuneSelector: $element => $element.parent()
        });
    });

    runner($, {
        getSelectorDefinitions: function () {
            return selectorDefinitions;
        }
    });
}(
    window.jQuery.noConflict(true),
    window.adrRunner
));
