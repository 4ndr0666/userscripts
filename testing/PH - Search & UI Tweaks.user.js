// ==UserScript==
// @name         PH - Search & UI Tweaks
// @namespace    brazenvoid
// @version      3.6.4
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Various search filters and user experience enhancers
// @match        https://*.pornhub.com/*
// @match        https://*.pornhub.org/*
// @match        https://*.pornhubpremium.com/*
// @match        https://*.pornhubpremium.org/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://greasyfork.org/scripts/375557-base-brazen-resource/code/Base%20Brazen%20Resource.js?version=1115796
// @require      https://greasyfork.org/scripts/416104-brazen-ui-generator/code/Brazen%20UI%20Generator.js?version=1115813
// @require      https://greasyfork.org/scripts/418665-brazen-configuration-manager/code/Brazen%20Configuration%20Manager.js?version=1163542
// @require      https://greasyfork.org/scripts/429587-brazen-item-attributes-resolver/code/Brazen%20Item%20Attributes%20Resolver.js?version=1139392
// @require      https://greasyfork.org/scripts/424516-brazen-subscriptions-loader/code/Brazen%20Subscriptions%20Loader.js?version=1114774
// @require      https://greasyfork.org/scripts/416105-brazen-base-search-enhancer/code/Brazen%20Base%20Search%20Enhancer.js?version=1166308
// @grant        GM_addStyle
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/373951/PH%20-%20Search%20%20UI%20Tweaks.user.js
// @updateURL https://update.greasyfork.org/scripts/373951/PH%20-%20Search%20%20UI%20Tweaks.meta.js
// ==/UserScript==

GM_addStyle(`#settings-wrapper{top:5vh;width:270px}.bg-brand{background-color:#ffa31a}.font-primary{color:black}.font-secondary{color:black}`)

// Environment

const PAGE_PATH_NAME = window.location.pathname

const IS_FEED_PAGE = PAGE_PATH_NAME.startsWith('/feeds')
const IS_PLAYLIST_PAGE = PAGE_PATH_NAME.startsWith('/playlist')
const IS_PROFILE_PAGE = PAGE_PATH_NAME.startsWith('/model') || PAGE_PATH_NAME.startsWith('/channels') || PAGE_PATH_NAME.startsWith('/user') ||
    PAGE_PATH_NAME.startsWith('/pornstar')
const IS_VIDEO_PAGE = PAGE_PATH_NAME.startsWith('/view_video')
const IS_VIDEO_SEARCH_PAGE = PAGE_PATH_NAME.startsWith('/video') || PAGE_PATH_NAME.startsWith('/categories')

// Filters and configuration

const FILTER_PAID_VIDEOS = 'Hide Paid Videos'
const FILTER_PREMIUM_VIDEOS = 'Hide Premium Videos'
const FILTER_PRO_CHANNEL_VIDEOS = 'Hide Pro Channel Videos'
const FILTER_PRIVATE_VIDEOS = 'Hide Private Videos'
const FILTER_RECOMMENDED_VIDEOS = 'Hide Recommended Videos'
const FILTER_VIDEOS_VIEWS = 'Views'
const FILTER_USER = 'User Blacklist'
const FILTER_WATCHED_VIDEOS = 'Watched Filters'

const LINK_DISABLE_PLAYLIST_CONTROLS = 'Disable Playlist Controls'
const LINK_USER_PUBLIC_VIDEOS = 'User Public Videos'

const UI_AUTO_NEXT = 'Auto Next'
const UI_LARGE_PLAYER_ALWAYS = 'Always Enlarge Player'
const UI_REMOVE_IFRAMES = 'Remove Ad IFrames'
const UI_REMOVE_LIVE_MODELS_SECTIONS = 'Remove Live Models Sections'
const UI_REMOVE_PORN_STAR_SECTIONS = 'Remove Porn Star Sections'

class PHSearchAndUITweaks extends BrazenBaseSearchEnhancer
{
    constructor()
    {
        super({
            isUserLoggedIn:           $('#topRightProfileMenu').length > 0,
            itemDeepAnalysisSelector: '.video-wrapper',
            itemLinkSelector:         '.title > a',
            itemListSelectors:        'ul.videos',
            itemNameSelector:         '.title > a',
            itemSelectors:            '.videoblock',
            requestDelay:             0,
            scriptPrefix:             'ph-sui-',
        })

        this._configurationManager
            .addFlagField(FILTER_PAID_VIDEOS, 'Hide paid videos.')
            .addFlagField(FILTER_PREMIUM_VIDEOS, 'Hide premium videos.')
            .addFlagField(FILTER_PRIVATE_VIDEOS, 'Hide private Videos.')
            .addFlagField(FILTER_PRO_CHANNEL_VIDEOS, 'Hide videos from professional channels.')
            .addFlagField(FILTER_RECOMMENDED_VIDEOS, 'Hide recommended videos.')
            .addFlagField(LINK_DISABLE_PLAYLIST_CONTROLS, 'Disable playlist controls on video pages.')
            .addFlagField(LINK_USER_PUBLIC_VIDEOS, 'Jump directly to public videos on any profile link click.')
            .addFlagField(UI_AUTO_NEXT, 'Automatically go to next search page if no videos match after first run.')
            .addFlagField(UI_LARGE_PLAYER_ALWAYS, 'Enlarges player on all video pages.')
            .addFlagField(UI_REMOVE_IFRAMES, 'Removes all ad iframes.')
            .addFlagField(UI_REMOVE_LIVE_MODELS_SECTIONS, 'Remove live model stream sections from search.')
            .addFlagField(UI_REMOVE_PORN_STAR_SECTIONS, 'Remove porn star listings from search.')
            .addRadiosGroup(FILTER_WATCHED_VIDEOS, [
                ['No Filtering', 0],
                ['Hide Watched Videos', 1],
                ['Show Only Watched Videos', 2],
            ], 'Control fate of already watched videos.')
            .addRangeField(FILTER_VIDEOS_VIEWS, 0, 10000000, 'Filter videos by view count.')
            .addRulesetField(FILTER_USER, 6, 'Hides videos from specified users/channels.')

        this._itemAttributesResolver
            .addAttribute(FILTER_PAID_VIDEOS, (item) => Validator.isChildMissing(item, '.p2v-icon, .fanClubVideoWrapper'))
            .addAttribute(FILTER_PREMIUM_VIDEOS, (item) => Validator.isChildMissing(item, '.marker-overlays > .premiumIcon'))
            .addAttribute(FILTER_PRIVATE_VIDEOS, (item) => Validator.isChildMissing(item, '.privateOverlay'))
            .addAttribute(FILTER_PRO_CHANNEL_VIDEOS, (item) => Validator.isChildMissing(item, '.channel-icon'))
            .addAttribute(FILTER_RECOMMENDED_VIDEOS, (item) => Validator.isChildMissing(item, '.recommendedFor'))
            .addAttribute(FILTER_USER, (item) => item.find('.usernameWrap a').attr('title'))
            .addAttribute(FILTER_VIDEOS_VIEWS, (item) => {
                let viewsCountString = item.find('.views var').text()
                let viewsCountMultiplier = 1
                let viewsCountStringLength = viewsCountString.length

                if (viewsCountString[viewsCountStringLength - 1] === 'K') {
                    viewsCountMultiplier = 1000
                    viewsCountString = viewsCountString.replace('K', '')
                } else {
                    if (viewsCountString[viewsCountStringLength - 1] === 'M') {
                        viewsCountMultiplier = 1000000
                        viewsCountString = viewsCountString.replace('M', '')
                    }
                }
                return parseFloat(viewsCountString) * viewsCountMultiplier
            })
            .addAttribute(FILTER_WATCHED_VIDEOS, (item) => Validator.doesChildExist(item, '.watchedVideoText'))

        this._setupSubscriptionLoader().addConfig({
            url:                        window.location.origin + $('#profileMenuDropdown > li > span > a').first().attr('href') + '/subscriptions',
            getPageCount:               (page) => parseInt(page.children().first().text().replace(REGEX_PRESERVE_NUMBERS, '')) / 100,
            getPageUrl:                 (baseUrl, pageNo) => baseUrl + '?page=' + pageNo + ' .userWidgetWrapperGrid',
            subscriptionsCountSelector: '.profileContentLeft .showingInfo',
            subscriptionNameSelector:   'a.usernameLink',
        })

        this._setupUI()
        this._setupCompliance()
        this._setupComplianceFilters()
    }

    /**
     * Automatic next search page
     * @private
     */
    _autoNext()
    {
        let allVideos = $('.nf-videos ' + this._config.itemSelectors)
        if (allVideos.length > 0 && !allVideos.is(':visible')) {
            let nextButton = $('.page_next:not(.disabled) > a')
            if (nextButton.length) {
                window.location = nextButton.attr('href')
            }
        }
    }

    /**
     * Changes profile links to directly point to public video listings
     * @private
     */
    _complyProfileLinks()
    {
        $('.usernameBadgesWrapper a, a.usernameLink, .usernameWrap a').each((index, profileLink) => {
            profileLink = $(profileLink)
            let href = profileLink.attr('href')
            if (href.startsWith('/channels') || href.startsWith('/model')) {
                profileLink.attr('href', href + '/videos')
            } else {
                if (href.startsWith('/user')) {
                    profileLink.attr('href', href + '/videos/public')
                }
            }
        })
    }

    /**
     * @private
     */
    _enlargePlayer()
    {
        let player = $('#player')
        if (player.hasClass('original')) {
            player.removeClass('original').addClass('wide')
        }
    }

    /**
     * Fixes left over space after ads removal
     * @private
     */
    _fixLeftOverSpaceOnVideoSearchPage()
    {
        $('.showingCounter, .tagsForWomen').each((index, div) => {
            div.style.height = 'auto'
        })
    }

    /**
     * Fixes pagination nav by moving it under video items list
     * @private
     */
    _fixPaginationNavOnVideoSearchPage()
    {
        $('.pagination3').insertAfter($('div.nf-videos .search-video-thumbs'))
    }

    _preparePlaylistPage()
    {
        document.scrollingElement.addEventListener('scroll', () => {
            console.log(1)
            if(!(d&&(MG_Utils.hasClass(n,"stopLazyload")||0<=(e=(e=d).getBoundingClientRect()).top&&e.top<=window.innerHeight||0<=e.bottom&&e.bottom<=window.innerHeight))){var e,t,a,i=n.querySelectorAll("li.videoBox"),l=i&&i.length;l&&l<itemsCount&&n&&!MG_Utils.hasClass(n,"js-reachedEnd")&&(l=window.pageYOffset,l=(window.innerHeight||document.documentElement.clientHeight)+l,i=i[i.length-1])&&i.offsetTop<l&&n&&!MG_Utils.hasClass(n,"loading")&&(t=document.createElement("div"),i=document.createElement("img"),a=document.querySelector("#js-playlistTabsNav #editPlaylist"),MG_Utils.addClass(n,"loading"),t.id="loadingDiv",i.src=loadingImg&&loadingImg,t.appendChild(i),n.parentNode&&n.parentNode.appendChild(t),playlistsUtils)&&playlistsUtils.lazyLoadVideos(lazyloadUrl,r,function(e){t&&t.parentNode&&t.parentNode.removeChild(t),e?n.insertAdjacentHTML("beforeend",e):MG_Utils.addClass(n,"js-reachedEnd"),setTimeout(function(){MG_Utils.removeClass(n,"loading")},100),n=document.getElementById("videoPlaylist"),E&&MG_Utils.hasClass(E,"active")&&s(!0),r++,addEditMode(),a&&MG_Utils.hasClass(a,"active")&&MG_Utils.triggerEvent(a,"click")});var o=document.querySelectorAll("#videoPlaylist li.videoBox.notLoaded");setTimeout(function(){o&&[].forEach.call(o,function(e){var t,a;isThumbVisible(e)&&(t=e.querySelector("img.thumb"))&&void 0!==(a=t.getAttribute("data-thumb_url"))&&(t.setAttribute("src",a),MG_Utils.removeClass(e,"notLoaded"))})},100)}

        })
    }

    /**
     * Removes any IFrames being displayed by going over the page repeatedly till none exist
     * @private
     */
    _removeIframes()
    {
        let removeMilkTruckIframes = () => {
            let iframes = $('milktruck')
            let count = iframes.length
            iframes.remove()
            return count
        }

        this._performFlaggedOperation(UI_REMOVE_IFRAMES, () => {
            Validator.iFramesRemover()
            let iframesCount
            do {
                iframesCount = removeMilkTruckIframes()
            } while (iframesCount)
        })
    }

    _removeLoadMoreButtons()
    {
        $('.more_recommended_btn, #loadMoreRelatedVideosCenter').remove()
    }

    /**
     * @private
     */
    _removePremiumSectionFromSearchPage()
    {
        $('.nf-videos .sectionWrapper .sectionTitle h2').each((index, element) => {
            let sectionTitle = $(element)
            if (sectionTitle.text().trim() === 'Premium Videos') {
                sectionTitle.parents('.sectionWrapper:first').remove()
                return false
            }
        })
    }

    /**
     * Removes premium video sections from profiles
     * @private
     */
    _removeVideoSectionsOnProfilePage()
    {
        const videoSections = [
            {setting: this._getConfig(FILTER_PAID_VIDEOS), linkSuffix: 'paid'},
            {setting: this._getConfig(FILTER_PREMIUM_VIDEOS), linkSuffix: 'fanonly'},
            {setting: this._getConfig(FILTER_PRIVATE_VIDEOS), linkSuffix: 'private'},
        ]
        for (let videoSection of videoSections) {
            let videoSectionWrapper = $('.videoSection > div > div > h2 > a[href$="/' + videoSection.linkSuffix + '"]').parents('.videoSection:first')
            videoSection.setting ? videoSectionWrapper.show() : videoSectionWrapper.hide()
        }
    }

    /**
     * @private
     */
    _setupCompliance()
    {
        this._onFirstHitAfterCompliance = (item) => {
            if (IS_PLAYLIST_PAGE) {
                this._validatePlaylistVideoLink(item)
            }
        }

        this._playlistPageUsername = ''
        this._profilePageUsername = ''

        if (IS_FEED_PAGE) {
            this._onAfterInitialization = () => ChildObserver.create().onNodesAdded((itemsAdded) => {
                let itemsList
                for (let item of itemsAdded) {
                    if (typeof item.querySelector === 'function') {
                        itemsList = item.querySelector(this._config.itemListSelectors)
                        if (itemsList) {
                            this._complyItemsList($(itemsList))
                        }
                    }
                }
            }).observe($('#moreData')[0])
        } else if (IS_VIDEO_SEARCH_PAGE) {
            this._onAfterInitialization = () => this._performFlaggedOperation(UI_AUTO_NEXT, () => this._autoNext())
        }
    }

    /**
     * @private
     */
    _setupComplianceFilters()
    {
        this._addItemTextSanitizationFilter(
            'Censor video names by substituting offensive phrases. Each rule in separate line with comma separated target phrases. Requires page reload to apply. Example Rule: boyfriend=stepson,stepdad')
        this._addItemWhitelistFilter('Show videos with specified phrases in their names. Separate the phrases with line breaks.')
        this._addItemTextSearchFilter()
        this._addItemComplianceFilter(FILTER_WATCHED_VIDEOS, (item, value) => {
            if (value === '1') {
                return !this._get(item, FILTER_WATCHED_VIDEOS)
            } else if (value === '2') {
                return this._get(item, FILTER_WATCHED_VIDEOS)
            }
            return true
        })
        this._addItemPercentageRatingRangeFilter('.value')
        this._addItemDurationRangeFilter('.duration')
        this._addItemComplianceFilter(FILTER_VIDEOS_VIEWS)
        this._addItemComplianceFilter(FILTER_PRO_CHANNEL_VIDEOS)
        this._addItemComplianceFilter(FILTER_PAID_VIDEOS)
        this._addItemComplianceFilter(FILTER_PREMIUM_VIDEOS)
        this._addItemComplianceFilter(FILTER_PRIVATE_VIDEOS)
        this._addItemComplianceFilter(FILTER_RECOMMENDED_VIDEOS)
        this._addItemComplianceFilter(FILTER_USER, (item, users) => !users.includes(this._get(item, FILTER_USER)))
        this._addSubscriptionsFilter(() => !IS_FEED_PAGE, (item) => {
            let username = this._get(item, FILTER_USER)
            return (username === this._playlistPageUsername || username === this._profilePageUsername) ? false : username
        })
        this._addItemBlacklistFilter('Hide videos with specified phrases in their names.')
    }

    /**
     * @private
     */
    _setupUI()
    {
        this._onBeforeUIBuild = () => {
            this._removeIframes()

            if (IS_VIDEO_PAGE) {
                this._performFlaggedOperation(FILTER_PAID_VIDEOS, () => $('#p2vVideosVPage').remove())
                this._performFlaggedOperation(UI_LARGE_PLAYER_ALWAYS, () => this._enlargePlayer())
                this._removeLoadMoreButtons()
                Validator.sanitizeNodeOfSelector('.inlineFree', this._configurationManager.getFieldOrFail(FILTER_TEXT_SANITIZATION).optimized)
            } else {
                if (IS_VIDEO_SEARCH_PAGE) {
                    this._performFlaggedOperation(UI_REMOVE_PORN_STAR_SECTIONS, () => $('#relatedPornstarSidebar').remove())
                    this._performFlaggedOperation(FILTER_PREMIUM_VIDEOS, () => this._removePremiumSectionFromSearchPage())
                    this._fixLeftOverSpaceOnVideoSearchPage()
                    this._fixPaginationNavOnVideoSearchPage()
                } else {
                    if (IS_PROFILE_PAGE) {
                        this._removeVideoSectionsOnProfilePage()
                        this._profilePageUsername = PAGE_PATH_NAME.split('/')[1]
                    } else {
                        if (IS_PLAYLIST_PAGE) {
                            this._preparePlaylistPage()
                            this._playlistPageUsername = $('#js-aboutPlaylistTabView .usernameWrap a').text().trim()
                        }
                    }
                }
            }
            this._performFlaggedOperation(
                UI_REMOVE_LIVE_MODELS_SECTIONS,
                () => $('.streamateContent').each((index, element) => {$(element).parents('.sectionWrapper:first').remove()})
            )
        }

        this._onUIBuild = () =>
            this._uiGen.createSettingsSection().append([
                this._uiGen.createTabsSection(['Filters', 'Text', 'UI', 'Global', 'Stats'], [
                    this._uiGen.createTabPanel('Filters', true).append([
                        this._configurationManager.createElement(FILTER_DURATION_RANGE),
                        this._configurationManager.createElement(FILTER_PERCENTAGE_RATING_RANGE),
                        this._configurationManager.createElement(FILTER_VIDEOS_VIEWS),
                        this._uiGen.createBreakSeparator(),
                        this._configurationManager.createElement(FILTER_PAID_VIDEOS),
                        this._configurationManager.createElement(FILTER_PREMIUM_VIDEOS),
                        this._configurationManager.createElement(FILTER_PRIVATE_VIDEOS),
                        this._configurationManager.createElement(FILTER_PRO_CHANNEL_VIDEOS),
                        this._configurationManager.createElement(FILTER_RECOMMENDED_VIDEOS),
                        this._configurationManager.createElement(FILTER_SUBSCRIBED_VIDEOS),
                        this._configurationManager.createElement(FILTER_UNRATED),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(FILTER_WATCHED_VIDEOS),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(FILTER_USER),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(OPTION_DISABLE_COMPLIANCE_VALIDATION),
                    ]),
                    this._uiGen.createTabPanel('Text').append([
                        this._configurationManager.createElement(FILTER_TEXT_SEARCH),
                        this._configurationManager.createElement(FILTER_TEXT_BLACKLIST),
                        this._configurationManager.createElement(FILTER_TEXT_WHITELIST),
                        this._configurationManager.createElement(FILTER_TEXT_SANITIZATION),
                    ]),
                    this._uiGen.createTabPanel('UI').append([
                        this._configurationManager.createElement(UI_LARGE_PLAYER_ALWAYS),
                        this._configurationManager.createElement(LINK_DISABLE_PLAYLIST_CONTROLS),
                        this._configurationManager.createElement(LINK_USER_PUBLIC_VIDEOS),
                        this._configurationManager.createElement(UI_AUTO_NEXT),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(UI_REMOVE_IFRAMES),
                        this._configurationManager.createElement(UI_REMOVE_LIVE_MODELS_SECTIONS),
                        this._configurationManager.createElement(UI_REMOVE_PORN_STAR_SECTIONS),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(OPTION_ALWAYS_SHOW_SETTINGS_PANE),
                    ]),
                    this._uiGen.createTabPanel('Global').append([
                        this._uiGen.createFormSection('Account').append([
                            this._createSubscriptionLoaderControls(),
                        ]),
                        this._uiGen.createSeparator(),
                        this._createSettingsBackupRestoreFormActions(),
                    ]),
                    this._uiGen.createTabPanel('Stats').append([
                        this._uiGen.createStatisticsFormGroup(FILTER_TEXT_BLACKLIST),
                        this._uiGen.createStatisticsFormGroup(FILTER_TEXT_WHITELIST),
                        this._uiGen.createStatisticsFormGroup(FILTER_DURATION_RANGE),
                        this._uiGen.createStatisticsFormGroup(FILTER_TEXT_SEARCH),
                        this._uiGen.createStatisticsFormGroup(FILTER_PAID_VIDEOS, 'Paid Videos'),
                        this._uiGen.createStatisticsFormGroup(FILTER_PREMIUM_VIDEOS, 'Premium Videos'),
                        this._uiGen.createStatisticsFormGroup(FILTER_PRIVATE_VIDEOS, 'Private Videos'),
                        this._uiGen.createStatisticsFormGroup(FILTER_PRO_CHANNEL_VIDEOS, 'Pro Channel Videos'),
                        this._uiGen.createStatisticsFormGroup(FILTER_PERCENTAGE_RATING_RANGE),
                        this._uiGen.createStatisticsFormGroup(FILTER_RECOMMENDED_VIDEOS, 'Recommended'),
                        this._uiGen.createStatisticsFormGroup(FILTER_SUBSCRIBED_VIDEOS, 'Subscribed'),
                        this._uiGen.createStatisticsFormGroup(FILTER_UNRATED, 'Unrated'),
                        this._uiGen.createStatisticsFormGroup(FILTER_VIDEOS_VIEWS),
                        this._uiGen.createStatisticsFormGroup(FILTER_WATCHED_VIDEOS, 'Watched'),
                        this._uiGen.createSeparator(),
                        this._uiGen.createStatisticsTotalsGroup(),
                    ]),
                ]),
                this._createSettingsFormActions(),
                this._uiGen.createSeparator(),
                this._uiGen.createStatusSection(),
            ])

        this._onAfterUIBuild = () => {
            this._performFlaggedOperation(LINK_USER_PUBLIC_VIDEOS, () => this._complyProfileLinks())
            this._uiGen.getSelectedSection()[0].userScript = this
        }
    }

    /**
     * Validate and change playlist video links
     * @param {JQuery} videoItem
     * @private
     */
    _validatePlaylistVideoLink(videoItem)
    {
        if (this._getConfig(LINK_DISABLE_PLAYLIST_CONTROLS)) {
            videoItem.find('a.linkVideoThumb, span.title a').each((index, playlistLink) => {
                playlistLink = $(playlistLink)
                playlistLink.attr('href', playlistLink.attr('href').replace(/&pkey.*/, ''))
            })
        }
    }
}

(new PHSearchAndUITweaks).init()