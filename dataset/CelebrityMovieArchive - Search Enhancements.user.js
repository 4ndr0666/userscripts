// ==UserScript==
// @name         CelebrityMovieArchive - Search Enhancements
// @namespace    brazenvoid
// @version      1.3.0
// @author       brazenvoid
// @license      GPL-3.0-only
// @description  Various search filters and user experience enhancers
// @match        https://www.celebritymoviearchive.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js
// @require      https://greasyfork.org/scripts/375557-base-brazen-resource/code/Base%20Brazen%20Resource.js?version=1115796
// @require      https://greasyfork.org/scripts/416104-brazen-ui-generator/code/Brazen%20UI%20Generator.js?version=1115813
// @require      https://greasyfork.org/scripts/418665-brazen-configuration-manager/code/Brazen%20Configuration%20Manager.js?version=1163542
// @require      https://greasyfork.org/scripts/429587-brazen-item-attributes-resolver/code/Brazen%20Item%20Attributes%20Resolver.js?version=1139392
// @require      https://greasyfork.org/scripts/416105-brazen-base-search-enhancer/code/Brazen%20Base%20Search%20Enhancer.js?version=1163543
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

GM_addStyle(`#settings-wrapper{top:5vh;width:310px;font-size:11px}.bg-brand{background-color:#1774ab}.font-primary{color:#feff76}.font-secondary{color:black}`)

// Environment

const PAGE_PATH_NAME = window.location.pathname

const IS_ACTRESS_PAGE = PAGE_PATH_NAME.startsWith('/members/name.php')
const IS_LIBRARY_PAGE = PAGE_PATH_NAME.startsWith('/members/mydownloads.php')
const IS_TITLE_PAGE = PAGE_PATH_NAME.startsWith('/members/source.php')
const IS_VIDEO_PAGE = PAGE_PATH_NAME.startsWith('/members/movie.php')
const IS_PAGINATED_VIDEO_LIST_PAGE = !(IS_ACTRESS_PAGE || IS_TITLE_PAGE || IS_VIDEO_PAGE)

const RESOLUTION_BREAKPOINTS_IN_PIXELS = [6635520, 2949120, 1658880, 737280, 0]

const ITEM_SELECTOR = '.info'

// Config

const DISABLE_ON_ACTRESS_PAGE = 'Disable on actress pages'
const DISABLE_ON_LIBRARY_PAGE = 'Disable on library pages'
const DISABLE_ON_TITLE_PAGE = 'Disable on source pages'

// Filters

const FILTER_ACTRESS_BLACKLIST = 'Actress Blacklist'
const FILTER_CONTENT = 'Content Rating'
const FILTER_DOWNLOADS = 'Downloads'
const FILTER_DURATION = 'Duration'
const FILTER_RESOLUTION = 'Resolution'
const FILTER_UNWATCHED = 'Unwatched'
const FILTER_YEAR = 'Year'

// UI

const UI_AUTO_NEXT = 'Automatic Next'

class CMASearchEnhancements extends BrazenBaseSearchEnhancer
{
    constructor()
    {
        super({
            isUserLoggedIn:           $('.logout').length > 0,
            itemDeepAnalysisSelector: '.articleInfo',
            itemLinkSelector:         '.btmInfo > em > .filename',
            itemListSelectors:        '.demo',
            itemNameSelector:         'p',
            itemSelectors:            ITEM_SELECTOR,
            requestDelay:             0,
            scriptPrefix:             'cma-se-',
        })
    
        /**
         * @type {JQuery|string|null}
         * @private
         */
        this._navNextPage = $('.pagi > .next')
        this._navNextPage = $(ITEM_SELECTOR).length === 0 || this._navNextPage.attr('href') === PAGE_PATH_NAME
            ? null
            : this._navNextPage.attr('href')
        
        this._configurationManager
            .addCheckboxesGroup(FILTER_RESOLUTION, [
                ['4k', RESOLUTION_BREAKPOINTS_IN_PIXELS[0]],
                ['1440p', RESOLUTION_BREAKPOINTS_IN_PIXELS[1]],
                ['1080p', RESOLUTION_BREAKPOINTS_IN_PIXELS[2]],
                ['720p', RESOLUTION_BREAKPOINTS_IN_PIXELS[3]],
                ['SD', RESOLUTION_BREAKPOINTS_IN_PIXELS[4]],
            ], 'Show videos of resolutions selected.')
            .addFlagField(DISABLE_ON_ACTRESS_PAGE, 'Disable script on actress pages.')
            .addFlagField(DISABLE_ON_LIBRARY_PAGE, 'Disable script on your library pages.')
            .addFlagField(DISABLE_ON_TITLE_PAGE, 'Disable script on series/movie pages.')
            .addFlagField(FILTER_UNWATCHED, 'Hide videos that are in your library. Has major performance and data impact.')
            .addFlagField(UI_AUTO_NEXT, 'Automatically go to next page when all results get filtered.')
            .addRadiosGroup(FILTER_CONTENT, [
                ['Nude', 'Nude'],
                ['Sexy', 'Sexy'],
                ['All', 'All'],
            ], 'Show content rated as per the choices selected')
            .addRangeField(FILTER_DURATION, 0, 10000000, 'Filter videos by duration in seconds.')
            .addRangeField(FILTER_DOWNLOADS, 0, 10000000, 'Filter videos by the number of downloads. Has major performance and data impact.')
            .addRangeField(FILTER_YEAR, 0, 10000000, 'Filter videos by the years of release.')
            .addRulesetField(FILTER_ACTRESS_BLACKLIST, 5, 'Hide all videos of specified actresses.')
        
        this._itemAttributesResolver
            .addAttribute(FILTER_ACTRESS_BLACKLIST, (item) => item.find('h2 > a').text().trim())
            .addAttribute(FILTER_CONTENT, (item) => item.find('img').length ? 'Nude' : 'Sexy')
            .addAttribute(FILTER_RESOLUTION, (item) => {
                let resolution = item.find('span > em')
                    .eq(this._get(item, FILTER_CONTENT) === 'Sexy' ? 1 : 0)
                    .text()
                    .trim()
                    .split(' ')[5]
                    .split('x')
                return parseInt(resolution[0]) * parseInt(resolution[1])
            })
            .addAttribute(FILTER_YEAR, (item) => {
                let title = item.find('h3 > a')
                if (title.length) {
                    let year = title.text().trim().split('(').pop().replace(REGEX_PRESERVE_NUMBERS, '')
                    if (year !== '') {
                        return parseInt(year)
                    }
                }
                return null
            })
            .addDeepAttribute(FILTER_DOWNLOADS, (page) => parseInt(page.find('.cols > .col > dl').last().find('dd').text().trim().replace(' times', '')))
            .addDeepAttribute(FILTER_UNWATCHED, (page) => page.find('.movieMessage').length === 1)
        
        this._onItemHide = (item) => item.parent().addClass('noncompliant-item').hide()
        this._onItemShow = (item) => item.parent().removeClass('noncompliant-item').show()
    
        this._onBeforeCompliance = () => !(
            IS_VIDEO_PAGE ||
            (IS_ACTRESS_PAGE && this._getConfig(DISABLE_ON_ACTRESS_PAGE)) ||
            (IS_LIBRARY_PAGE && this._getConfig(DISABLE_ON_LIBRARY_PAGE)) ||
            (IS_TITLE_PAGE && this._getConfig(DISABLE_ON_TITLE_PAGE))
        )
        
        this._onAfterComplianceRun = () => this._performComplexFlaggedOperation(
            UI_AUTO_NEXT,
            () => !(IS_ACTRESS_PAGE || IS_TITLE_PAGE || IS_VIDEO_PAGE) && this._navNextPage &&
                $('li:not(.noncompliant-item) > ' + ITEM_SELECTOR).length === 0,
            () => window.location = this._navNextPage
        )
        
        this._setupUI()
        this._setupComplianceFilters()
    }
    
    /**
     * @private
     */
    _setupComplianceFilters()
    {
        this._addItemWhitelistFilter('Show videos with specified phrases in their description')
        this._addItemComplianceFilter(FILTER_CONTENT, (item, value) => {
            let contentRating = this._get(item, FILTER_CONTENT)
            return value === 'All' ? true : value === contentRating
        })
        this._addItemDurationRangeFilter(
            (item) => item.find('span > em').eq(this._get(item, FILTER_CONTENT) === 'Sexy' ? 1 : 0).text().trim().split(' ')[0])
        this._addItemComplianceFilter(FILTER_RESOLUTION, (item, values) => {
            let resolution = this._get(item, FILTER_RESOLUTION)
            for (let breakpoint of RESOLUTION_BREAKPOINTS_IN_PIXELS) {
                if (resolution > breakpoint) {
                    return values.includes(breakpoint.toString())
                }
            }
            return false
        })
        this._addItemComplianceFilter(FILTER_YEAR)
        this._addItemComplianceFilter(FILTER_ACTRESS_BLACKLIST, (item, values) => {
            let attribute = this._get(item, FILTER_ACTRESS_BLACKLIST)
            return attribute && values.length ? !values.includes(attribute) : true
        })
        this._addItemBlacklistFilter('Hide videos with specified phrases in their description.')
        this._addItemComplianceFilter(FILTER_UNWATCHED, FILTER_UNWATCHED, (value) => !IS_LIBRARY_PAGE && value)
        this._addItemComplianceFilter(FILTER_DOWNLOADS)
    }
    
    /**
     * @private
     */
    _setupUI()
    {
        this._onUIBuild = () =>
            this._uiGen.createSettingsSection().append([
                this._uiGen.createTabsSection(['Filters', 'Text', 'Global', 'Stats'], [
                    this._uiGen.createTabPanel('Filters', true).append([
                        this._configurationManager.createElement(FILTER_DOWNLOADS),
                        this._configurationManager.createElement(FILTER_DURATION_RANGE),
                        this._configurationManager.createElement(FILTER_YEAR),
                        this._configurationManager.createElement(FILTER_UNWATCHED),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(FILTER_RESOLUTION),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(FILTER_CONTENT),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(OPTION_DISABLE_COMPLIANCE_VALIDATION),
                    ]),
                    this._uiGen.createTabPanel('Text').append([
                        this._configurationManager.createElement(FILTER_ACTRESS_BLACKLIST),
                        this._configurationManager.createElement(FILTER_TEXT_BLACKLIST),
                        this._configurationManager.createElement(FILTER_TEXT_WHITELIST),
                    ]),
                    this._uiGen.createTabPanel('Global').append([
                        this._configurationManager.createElement(UI_AUTO_NEXT),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(DISABLE_ON_ACTRESS_PAGE),
                        this._configurationManager.createElement(DISABLE_ON_LIBRARY_PAGE),
                        this._configurationManager.createElement(DISABLE_ON_TITLE_PAGE),
                        this._uiGen.createSeparator(),
                        this._configurationManager.createElement(OPTION_ALWAYS_SHOW_SETTINGS_PANE),
                        this._uiGen.createSeparator(),
                        this._createSettingsBackupRestoreFormActions(),
                    ]),
                    this._uiGen.createTabPanel('Stats').append([
                        this._uiGen.createStatisticsFormGroup(FILTER_ACTRESS_BLACKLIST),
                        this._uiGen.createStatisticsFormGroup(FILTER_TEXT_BLACKLIST),
                        this._uiGen.createStatisticsFormGroup(FILTER_TEXT_WHITELIST),
                        this._uiGen.createStatisticsFormGroup(FILTER_CONTENT),
                        this._uiGen.createStatisticsFormGroup(FILTER_DOWNLOADS),
                        this._uiGen.createStatisticsFormGroup(FILTER_DURATION),
                        this._uiGen.createStatisticsFormGroup(FILTER_RESOLUTION),
                        this._uiGen.createStatisticsFormGroup(FILTER_UNWATCHED),
                        this._uiGen.createStatisticsFormGroup(FILTER_YEAR),
                        this._uiGen.createSeparator(),
                        this._uiGen.createStatisticsTotalsGroup(),
                    ]),
                ]),
                this._createSettingsFormActions(),
                this._uiGen.createSeparator(),
                this._uiGen.createStatusSection(),
            ])
        
        this._onAfterUIBuild = () => {
            this._uiGen.getSelectedSection()[0].userScript = this
        }
    }
}

(new CMASearchEnhancements).init()