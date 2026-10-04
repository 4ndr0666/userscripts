// ==UserScript==
// @name        4ndr0tools - GoFile++
// @namespace    https://github.com/4ndr0666/userscripts
// @author      4ndr0666
// @version     2.1.1
// @description Directly batch-download GoFiles with a robust UI. Supports recursive folder scans, direct links, and download managers (Aria2, IDM). Fixing SPA persistence and Sandbox access.
// @match       *://gofile.io/*
// @icon        data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20128%20128%22%20fill%3D%22none%22%20stroke%3D%22%2300E5FF%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M%2064%2C12%20A%2052%2C52%200%201%201%2063.9%2C12%20Z%22%20stroke-dasharray%3D%2221.78%2021.78%22%20stroke-width%3D%222%22%2F%3E%3Cpath%20d%3D%22M%2064%2C20%20A%2044%2C44%200%201%201%2063.9%2C20%20Z%22%20stroke-dasharray%3D%2210%2010%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M64%2030%20L91.3%2047%20L91.3%2081%20L64%2098%20L36.7%2081%20L36.7%2047%20Z%22%2F%3E%3Ctext%20x%3D%2264%22%20y%3D%2267%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%20fill%3D%22%2300E5FF%22%20stroke%3D%22none%22%20font-size%3D%2256%22%20font-weight%3D%22700%22%20font-family%3D%22Cinzel%20Decorative%2C%20serif%22%3E%CE%A8%3C%2Ftext%3E%3C%2Fsvg%3E
// @connect     api.gofile.io
// @connect     localhost
// @connect     *
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @license     UNLICENSED - RED TEAM USE ONLY
// @downloadURL  https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Gofile++.user.js
// @updateURL    https://github.com/4ndr0666/userscripts/raw/refs/heads/main/dist/4ndr0tools%20-%20Gofile++.user.js
// ==/UserScript==
// 2.1.1 (suite v1.4.0): 3lectric-Glass universality pass — spec palette (rgba(10,19,26,α) · #00E5FF · #67E8F9 · #ff0055) · JetBrains Mono / Orbitron · 150ms ease-in-out · Ψ branding.
console.log('%c [💀Ψ•-⦑4NDR0666OS⦒-•Ψ💀]: Gofile++.user v2.1.1 — 3LECTRIC-GLASS Ψ · GUP-certified', 'background:#000;color:#00E5FF;font-weight:bold;font-family:monospace;padding:4px;');


; (function () {
    'use strict'

    const SUPPORTED_DOWNLOADERS = ['Direct', 'ABDM', 'Aria2', 'IDM']

    const DEFAULT_LANGUAGE = 'en-US'
    const CRLF = '\r\n'

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'
    const GE_GORM_ID_PREFIX = 'GofileEnhanced_Form'

    const I18N = {
        'zh-CN': {
            abdm_connected: 'ABDM 连接成功',
            abdm_connection_fail: 'ABDM 连接失败',
            abdm_download_folder: 'ABDM 下载目录',
            abdm_download_folder_placeholder: '若留空则使用 ABDM 默认设置',
            abdm_port: 'ABDM 端口',
            abdm_port_not_configured: 'ABDM 端口未配置',
            abdm_port_placeholder: '默认为 15151',
            abdm_settings: ' AB Download Manager 设置',
            are_you_sure_to_download__these_files: '确定要下载下列文件吗？',
            aria2_connected: 'Aria2 连接成功',
            aria2_connection_fail: 'Aria2 连接失败',
            aria2_rpc_address: 'Aria2 RPC 地址',
            aria2_rpc_address_placeholder: '默认为 http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC 密钥',
            aria2_rpc_secret_placeholder: '若未设置留空即可',
            aria2_rpc_dir: 'Aria2 下载目录',
            aria2_rpc_dir_placeholder: '若留空则使用 Aria2 默认设置',
            aria2_settings: 'Aria2 设置',
            cancel: '取消',
            config: '配置',
            confirm: '确定',
            download_all: '下载全部',
            download_selected: '下载选中',
            empty_folder: '文件夹为空',
            empty_folder_description: '当前文件夹内容为空',
            error: '错误',
            export_all: '导出全部',
            export_selected: '导出选中',
            failed_to_fetch_folder_content: '获取文件夹内容失败',
            failed_to_send_to_abdm: '未成功发送至 ABDM',
            failed_to_send_to_aria2: '未成功发送至 Aria2',
            fetching_file_list: '正在获取文件列表',
            loading: '加载中...',
            loading_file_list: '正在加载文件列表',
            loading_please_wait: '正在加载，请稍候',
            no_file_selected: '未选择文件',
            no_file_selected_description: '请至少选择一个文件',
            please_make_sure_you_have_configured_download_folder: '请确保已正确配置下载目录。',
            recursive_download: '递归下载',
            reset_aria2: '重置 Aria2',
            send_all: '发送全部',
            send_selected: '发送选中',
            success: '成功',
            successfully_fetched_file_list: '成功获取文件列表',
            successfully_reset: '已重置',
            successfully_sent_to_abdm: '已成功发送至 ABDM',
            successfully_sent_to_aria2: '已成功发送至 Aria2',
            test_abdm: '测试 ABDM',
            test_aria2: '测试 Aria2',
            unknown_error: '未知错误',
            unsupported_format: '不支持的格式',
            request_aborted: '请求中断',
            request_timed_out: '请求超时',
        },
        'en-US': {
            abdm_connected: 'ABDM connected successfully',
            abdm_connection_fail: 'ABDM connection failed',
            abdm_download_folder: 'ABDM Download Folder',
            abdm_download_folder_placeholder: 'Leave empty to use ABDM default settings',
            abdm_port: 'ABDM Port',
            abdm_port_not_configured: 'ABDM port not configured',
            abdm_port_placeholder: 'Default is 15151',
            abdm_settings: 'AB Download Manager Settings',
            are_you_sure_to_download__these_files: 'Are you sure you want to download the following files?',
            aria2_connected: 'Aria2 connected successfully',
            aria2_connection_fail: 'Aria2 connection failed',
            aria2_rpc_address: 'Aria2 RPC Address',
            aria2_rpc_address_placeholder: 'Default is http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC Secret',
            aria2_rpc_secret_placeholder: 'Leave empty if not set',
            aria2_rpc_dir: 'Aria2 RPC Directory',
            aria2_rpc_dir_placeholder: 'Leave empty to use Aria2 default settings',
            aria2_settings: 'Aria2 Settings',
            cancel: 'Cancel',
            config: 'Config',
            confirm: 'Confirm',
            download_all: 'Download All',
            download_selected: 'Download Selected',
            empty_folder: 'Empty Folder',
            empty_folder_description: 'The current folder is empty',
            error: 'Error',
            export_all: 'Export All',
            export_selected: 'Export Selected',
            failed_to_fetch_folder_content: 'Failed to fetch folder content',
            failed_to_send_to_abdm: 'Failed to send to ABDM',
            failed_to_send_to_aria2: 'Failed to send to Aria2',
            fetching_file_list: 'Fetching file list',
            loading: 'Loading...',
            loading_file_list: 'Loading file list',
            loading_please_wait: 'Loading, please wait',
            no_file_selected: 'No File Selected',
            no_file_selected_description: 'Please select at least one file',
            please_make_sure_you_have_configured_download_folder: 'Please make sure you have configured the download folder.',
            reset_aria2: 'Reset Aria2',
            recursive_download: 'Recursive Download',
            send_all: 'Send All',
            send_selected: 'Send Selected',
            success: 'Success',
            successfully_fetched_file_list: 'Successfully fetched file list',
            successfully_reset: 'successfully reset',
            successfully_sent_to_abdm: 'successfully sent to ABDM',
            successfully_sent_to_aria2: 'successfully sent to Aria2',
            test_abdm: 'Test ABDM',
            test_aria2: 'Test Aria2',
            unknown_error: 'Unknown Error',
            unsupported_format: 'Unsupported Format',
            request_aborted: 'Request Aborted',
            request_timed_out: 'Request Timed Out',
            abdm_not_configured: 'ABDM port not configured',
        },
    }

    const ICONS = {
        circle_down_s: 'fas fa-circle-down',
        circle_down_r: 'far fa-circle-down',
        circle_nodes_s: 'fas fa-circle-nodes',
        copy_s: 'fas fa-copy',
        copy_r: 'far fa-copy',
        file_s: 'fas fa-file',
        file_r: 'far fa-file',
        file_ziper_s: 'fas fa-file-zipper',
        file_ziper_r: 'far fa-file-zipper',
        folder_s: 'fas fa-folder',
        folder_r: 'far fa-folder',
        gear_s: 'fas fa-gear',
        google_plus: 'fa-brands fa-google-plus',
        key_s: 'fas fa-key',
        link_s: 'fas fa-link',
        plane_s: 'fas fa-paper-plane',
        plane_r: 'far fa-paper-plane',
        plug_s: 'fas fa-plug',
        rotate_left_s: 'fas fa-rotate-left',
    }

    /* ═══ UI LAYER (v2.1.0 — restored) ═════════════════════════════════════════
     * The v2.0.0 rewrite referenced createNotification / createAlert /
     * createPopup / closePopup / getContent but never defined them — every
     * button action died on a ReferenceError before reaching its fetch.
     * Restored here in the suite's electric-glass idiom, self-contained
     * (no grants beyond the existing set: a <style> element + fixed
     * z-index layer do the job). */
    const GE_UI_STYLE_ID = 'GofileEnhanced_UILayer';
    const GE_UI_CSS = `
        #GofileEnhanced_Layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
        #GofileEnhanced_Layer > * { pointer-events: auto; }
        .ge-modal-backdrop {
            position: fixed; inset: 0; background: rgba(10, 19, 26, 0.72);
            backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center;
            animation: geFadeIn 0.18s ease-out;
        }
        .ge-modal {
            width: min(560px, calc(100vw - 48px)); max-height: calc(100vh - 96px); overflow: auto;
            background: rgba(10, 19, 26, 0.97); border: 1px solid #00E5FF; border-radius: 10px;
            transition: all 150ms ease-in-out;
            box-shadow: 0 0 32px rgba(0, 229, 255, 0.25); color: #67E8F9;
            font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px;
        }
        .ge-modal-head {
            display: flex; align-items: center; gap: 10px; padding: 14px 18px;
            border-bottom: 1px solid rgba(0, 229, 255, 0.35); color: #00E5FF;
            font-weight: 700; letter-spacing: 0.5px; position: sticky; top: 0;
            background: rgba(10, 19, 26, 0.97); z-index: 1;
        }
        .ge-modal-close {
            margin-left: auto; cursor: pointer; color: #ff0055; font-size: 18px; line-height: 1;
            padding: 2px 8px; border-radius: 4px; border: none; background: none;
        }
        .ge-modal-close:hover { color: #ff0055; }
        .ge-modal-body { padding: 16px 18px; }
        .ge-modal-body a { color: #00E5FF; }
        .ge-spinner {
            width: 18px; height: 18px; border-radius: 50%; flex: none;
            border: 2px solid rgba(0, 229, 255, 0.25); border-top-color: #00E5FF;
            animation: geSpin 0.8s linear infinite;
        }
        #GofileEnhanced_Toasts {
            position: fixed; right: 20px; bottom: 20px; display: flex;
            flex-direction: column; gap: 10px; max-width: min(420px, calc(100vw - 40px));
        }
        .ge-toast {
            background: rgba(10, 15, 26, 0.96); color: #67E8F9; padding: 12px 16px;
            border-left: 3px solid #00E5FF; border-radius: 6px; font-size: 12.5px;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5); animation: geSlideIn 0.25s ease-out;
        }
        .ge-toast .ge-toast-title { font-weight: 700; color: #00E5FF; margin-bottom: 3px; }
        .ge-toast.ge-success { border-left-color: #00E5FF; }
        .ge-toast.ge-success .ge-toast-title { color: #00E5FF; }
        .ge-toast.ge-error { border-left-color: #ff0055; }
        .ge-toast.ge-error .ge-toast-title { color: #ff0055; }
        .ge-toast.ge-warning { border-left-color: #67E8F9; }
        .ge-toast.ge-warning .ge-toast-title { color: #67E8F9; }
        @keyframes geSpin { to { transform: rotate(360deg); } }
        @keyframes geFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes geSlideIn { from { transform: translateX(30px); opacity: 0; } to { transform: none; opacity: 1; } }
    `;

    function ensureUiLayer() {
        if (!document.getElementById(GE_UI_STYLE_ID)) {
            const style = document.createElement('style');
            style.id = GE_UI_STYLE_ID;
            style.textContent = GE_UI_CSS;
            document.head.appendChild(style);
        }
        let layer = document.getElementById('GofileEnhanced_Layer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'GofileEnhanced_Layer';
            const toasts = document.createElement('div');
            toasts.id = 'GofileEnhanced_Toasts';
            layer.appendChild(toasts);
            document.documentElement.appendChild(layer);
        }
        return layer;
    }

    function createNotification(title, message, type = 'info') {
        ensureUiLayer();
        const toasts = document.querySelector('#GofileEnhanced_Toasts');
        const toast = document.createElement('div');
        toast.className = `ge-toast ge-${type}`;
        const t = document.createElement('div');
        t.className = 'ge-toast-title';
        t.textContent = String(title || '');
        const m = document.createElement('div');
        m.textContent = String(message || '');
        toast.append(t, m);
        toasts.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            setTimeout(() => toast.remove(), 320);
        }, 4200);
    }

    function createAlert(type, message) {
        // Compact non-dismissable modal — closed by closePopup(). The
        // classic 'loading' spinner plus any status message.
        ensureUiLayer();
        closePopup();
        const backdrop = document.createElement('div');
        backdrop.className = 'ge-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'ge-modal';
        modal.style.width = 'auto';
        const head = document.createElement('div');
        head.className = 'ge-modal-head';
        if (type === 'loading') head.appendChild(Object.assign(document.createElement('span'), { className: 'ge-spinner' }));
        const title = document.createElement('span');
        title.textContent = String(message || '');
        head.appendChild(title);
        const body = document.createElement('div');
        body.className = 'ge-modal-body';
        modal.append(head, body);
        backdrop.appendChild(modal);
        document.getElementById('GofileEnhanced_Layer').appendChild(backdrop);
    }

    function createPopup({ title, content, icon } = {}) {
        ensureUiLayer();
        closePopup();
        const backdrop = document.createElement('div');
        backdrop.className = 'ge-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'ge-modal';
        const head = document.createElement('div');
        head.className = 'ge-modal-head';
        if (icon) {
            const i = document.createElement('i');
            i.className = icon;
            head.appendChild(i);
        }
        const t = document.createElement('span');
        t.textContent = String(title || '');
        head.appendChild(t);
        const close = document.createElement('button');
        close.className = 'ge-modal-close';
        close.textContent = '✕';
        close.title = 'Close';
        close.addEventListener('click', closePopup);
        head.appendChild(close);
        const body = document.createElement('div');
        body.className = 'ge-modal-body';
        // [R3] content is a Node or array of Nodes (trusted local markup
        // built element-side; the innerHTML string path is retired).
        body.append(...(Array.isArray(content) ? content : [content]).filter(Boolean));
        modal.append(head, body);
        backdrop.appendChild(modal);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePopup(); });
        document.getElementById('GofileEnhanced_Layer').appendChild(backdrop);
        const onKey = (e) => { if (e.key === 'Escape') { closePopup(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
        return modal;
    }

    function closePopup() {
        const layer = document.getElementById('GofileEnhanced_Layer');
        if (!layer) return;
        layer.querySelectorAll('.ge-modal-backdrop').forEach((el) => el.remove());
    }

    /** GoFile content fetch for the recursive scan (v2.1.0 — was missing
     *  entirely). Uses the page's website token when available, with the
     *  known public token as fallback, and carries the session cookie. */
    async function getContent(contentId) {
        const pageApp = (typeof appdata !== 'undefined' && appdata) ? appdata : null;
        const wt = (pageApp && pageApp.wt) ? pageApp.wt : '4fd6sg89d7s6';
        const res = await utils.gmFetch(`https://api.gofile.io/contents/${contentId}?wt=${wt}`, {
            headers: { Cookie: utils.getToken() },
        });
        return res.json();
    }


    const GE_CONFIG = {
        ABDM: {
            name: 'ABDM',
            id: 'ABDM',
            desc: 'AB Download Manager',
            homepage: 'https://github.com/amir1376/ab-download-manager',
            settings: {
                abdmPort: {
                    key: 'abdm_port',
                    defaultValue: '15151',
                    i18nKey: 'abdm_port',
                    icon: ICONS.plug_s,
                    placeholderI18nKey: 'abdm_port_placeholder',
                },
                abdmDownloadFolder: {
                    key: 'abdm_download_folder',
                    defaultValue: '',
                    i18nKey: 'abdm_download_folder',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'abdm_download_folder_placeholder',
                },
            },
        },
        Aria2: {
            name: 'Aria2',
            id: 'Aria2',
            desc: 'Aria2 RPC Interface',
            homepage: 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface',
            settings: {
                rpcAddress: {
                    key: 'aria2_rpc_address',
                    defaultValue: 'http://localhost:6800/jsonrpc',
                    i18nKey: 'aria2_rpc_address',
                    icon: ICONS.link_s,
                    placeholderI18nKey: 'aria2_rpc_address_placeholder',
                },
                rpcSecret: {
                    key: 'aria2_rpc_secret',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_secret',
                    icon: ICONS.key_s,
                    placeholderI18nKey: 'aria2_rpc_secret_placeholder',
                },
                rpcDir: {
                    key: 'aria2_rpc_dir',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_dir',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'aria2_rpc_dir_placeholder',
                },
            },
        },
    }

    /* Page-state accessor: `appdata` is gofile.io's Nuxt payload and may
     * not exist yet when our observer first fires — bare references throw
     * ReferenceError, so every read goes through this guard. */
    const pageApp = () => (typeof appdata !== 'undefined' && appdata) ? appdata : null

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        gmFetch(url, options = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url,
                    headers: options.headers || {},
                    data: options.body || null,
                    responseType: options.responseType || 'text',
                    onload: (response) => {
                        resolve({
                            ok: response.status >= 200 && response.status < 300,
                            status: response.status,
                            statusText: response.statusText,
                            url: response.finalUrl,
                            text: () => Promise.resolve(response.responseText),
                            json: () => Promise.resolve(JSON.parse(response.responseText)),
                            xml: () => Promise.resolve(response.responseXML),
                            raw: response,
                        })
                    },
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error(utils.getTranslation('request_timed_out'))),
                    onabort: () => reject(new Error(utils.getTranslation('request_aborted'))),
                })
            })
        },
        getSettings(category, settingKey) {
            const setting = GE_CONFIG[category].settings[settingKey]
            return utils.getValue(setting.key) ?? setting.defaultValue
        },
        setSettings(category, settingKey, value) {
            const setting = GE_CONFIG[category].settings[settingKey]
            utils.setValue(setting.key, value)
        },
        getAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            return Object.keys(settings).reduce((acc, key) => {
                acc[key] = utils.getSettings(category, key)
                return acc
            }, {})
        },
        resetAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            Object.keys(settings).forEach((key) => {
                const setting = settings[key]
                utils.setValue(setting.key, setting.defaultValue)
                createNotification(utils.getTranslation('success'), `${utils.getTranslation(setting.i18nKey)} ${utils.getTranslation('successfully_reset')}`)
            })
        },
        initSettings() {
            Object.keys(GE_CONFIG).forEach((category) => {
                const settings = GE_CONFIG[category].settings
                Object.keys(settings).forEach((key) => {
                    const setting = settings[key]
                    if (utils.getValue(setting.key) === undefined) {
                        utils.setValue(setting.key, setting.defaultValue)
                    }
                })
            })
        },
        getTranslation(key) {
            const lang = I18N[navigator.language] ? navigator.language : DEFAULT_LANGUAGE
            return I18N[lang][key] || key
        },
        getToken: () => document.cookie,
        goDirectLinks(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        async collectAllItems() {
            createAlert('loading', utils.getTranslation('fetching_file_list'))

            const mainContentData = pageApp()?.fileManager?.mainContent?.data
            if (!mainContentData) { closePopup(); return { items: [] } }
            const tbdItems = []

            const collectItems = async (contentData, parentPath = '') => {
                if (contentData.childrenCount > 0) {
                    for (const key of Object.keys(contentData.children)) {
                        const childItem = contentData.children[key]

                        const currentPath = `${parentPath}/${contentData.name}`

                        if (childItem.type === 'file') {
                            tbdItems.push({ ...childItem, downloadFolder: currentPath })
                        } else if (childItem.type === 'folder') {
                            if (childItem.childrenCount === 0) {
                                continue
                            }
                            try {
                                // API
                                const res = await getContent(childItem.id)

                                if (res.status === 'ok') {
                                    const currentContentData = res.data
                                    await collectItems(currentContentData, currentPath)
                                } else {
                                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}: ${res.message || 'unknown'}`, 'error')
                                }
                            } catch (error) {
                                createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}`, 'error')
                            }
                        }
                    }
                }
            }

            await collectItems(mainContentData)
            closePopup()

            return { items: tbdItems }
        },
        recursiveDownload(tbdItems, callback) {
            const fileItems = tbdItems.map((item) => {
                return {
                    name: item.name,
                    path: item.downloadFolder || '',
                }
            })
            const fileList = fileItems.map((file) => {
                const p = document.createElement('p')
                p.append(`${file.path}/`)
                const nameSpan = document.createElement('span')
                nameSpan.className = 'text-blue-500'
                nameSpan.textContent = file.name
                p.appendChild(nameSpan)
                return p
            }).sort((a, b) => a.textContent.localeCompare(b.textContent))

            /* [R3] element-built popup body (was the HTML string above). */
            const popupWrap = document.createElement('div')
            popupWrap.className = 'space-y-4'
            const infoBox = document.createElement('div')
            infoBox.className = 'bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4'
            const infoRow = document.createElement('div')
            infoRow.className = 'flex items-center space-x-3'
            const infoIcon = document.createElement('i')
            infoIcon.className = 'fas fa-info-circle text-blue-400 text-xl'
            const infoText = document.createElement('p')
            infoText.className = 'text-gray-300 text-sm'
            const infoSpan1 = document.createElement('span')
            infoSpan1.textContent = utils.getTranslation('are_you_sure_to_download__these_files')
            const infoSpan2 = document.createElement('span')
            infoSpan2.textContent = utils.getTranslation('please_make_sure_you_have_configured_download_folder')
            infoText.append(infoSpan1, infoSpan2)
            infoRow.append(infoIcon, infoText)
            infoBox.appendChild(infoRow)
            const listForm = document.createElement('form')
            listForm.id = `${GE_GORM_ID_PREFIX}_FILE_LIST`
            listForm.className = 'space-y-4'
            for (const entry of fileList) listForm.appendChild(entry)
            const listSubmit = document.createElement('button')
            listSubmit.type = 'submit'
            listSubmit.className = 'w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ' +
                'ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2'
            const listSubmitIcon = document.createElement('i')
            listSubmitIcon.className = 'fas fa-check'
            const listSubmitText = document.createElement('span')
            listSubmitText.textContent = ` ${utils.getTranslation('confirm')} `
            listSubmit.append(listSubmitIcon, listSubmitText)
            listForm.appendChild(listSubmit)
            popupWrap.append(infoBox, listForm)
            createPopup({
                title: utils.getTranslation('successfully_fetched_file_list'),
                content: popupWrap,
                icon: ICONS.copy_s,
            })

            const form = document.forms[`${GE_GORM_ID_PREFIX}_FILE_LIST`]

            if (form) {
                form.addEventListener('submit', (event) => {
                    event.preventDefault()

                    callback()

                    closePopup()
                })
            }
        },
        sendToABDM(tbdItems) {
            const { abdmPort, abdmDownloadFolder } = utils.getAllSettings('ABDM')
            const cookie = utils.getToken()

            if (!abdmPort) {
                return createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_port_not_configured'), 'error')
            }

            const postDatas = tbdItems.map((item) => {
                return {
                    downloadSource: {
                        link: item.link,
                        headers: {
                            cookie,
                        },
                    },
                    name: item.name,
                    folder: item.downloadFolder || (abdmDownloadFolder === '' ? '/' : abdmDownloadFolder),
                }
            })

            // console.log('[GoFile Enhanced] Sending to ABDM:', postDatas)

            postDatas.forEach(async (data) => {
                try {
                    const res = await utils.gmFetch(`http://localhost:${abdmPort}/start-headless-download`, {
                        method: 'POST',
                        body: JSON.stringify(data),
                    })
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), `${data.name} ${utils.getTranslation('successfully_sent_to_abdm')}`, 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${data.name} ${utils.getTranslation('failed_to_send_to_abdm')} / ${res.status} - ${res.statusText}`, 'error')
                        console.error('[GoFile Enhanced] Error sending to ABDM:', res)
                    }
                } catch (error) {
                    createNotification(utils.getTranslation('error'), `${data.name}  ${utils.getTranslation('failed_to_send_to_abdm')}`, 'error')
                    console.error('[GoFile Enhanced] Error sending to ABDM:', error)
                }
            })
        },
        async testABDMConnection() {
            const port = utils.getSettings('ABDM', 'abdmPort')

            if (port) {
                try {
                    const res = await utils.gmFetch(`http://localhost:${port}/ping`)
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), utils.getTranslation('abdm_connected'), 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${utils.getTranslation('abdm_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                    }
                } catch (e) {
                    createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_connection_fail'), 'error')
                }
            } else {
                createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_not_configured'), 'error')
            }
        },
        async testAria2Connection() {
            const { rpcAddress, rpcSecret } = utils.getAllSettings('Aria2')

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify({
                        id: new Date().getTime(),
                        jsonrpc: '2.0',
                        method: 'aria2.getVersion',
                        params: [`token:${rpcSecret}`],
                    }),
                })

                if (res.ok) {
                    createNotification(utils.getTranslation('success'), utils.getTranslation('aria2_connected'), 'success')
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('aria2_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('aria2_connection_fail'), 'error')
            }
        },
        async sendToAria2(tbdItems) {
            const { rpcAddress, rpcSecret, rpcDir } = utils.getAllSettings('Aria2')

            const cookie = utils.getToken()

            const header = [`Cookie: ${cookie}`]

            const rpcData = tbdItems.map((item) => {
                return {
                    id: crypto.randomUUID(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${rpcSecret}`,
                        [item.link],
                        {
                            header,
                            dir: item.downloadFolder || rpcDir,
                        },
                    ],
                }
            })

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify(rpcData),
                })

                if (res.ok) {
                    const responseArray = await res.json()

                    responseArray.forEach((item) => {
                        if (item.error) {
                            createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} / ${item.error.code} - ${item.error.message}`, 'error')
                        } else {
                            createNotification(utils.getTranslation('success'), `${utils.getTranslation('successfully_sent_to_aria2')} / ID: ${item.result}`)
                        }
                    })
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} /  ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('failed_to_send_to_aria2'), 'error')
            }
        },
        exportToIDM(tbdItems) {
            const cookie = utils.getToken()
            const IDMFormatContent = tbdItems
                .map((item) => {
                    return `<${CRLF}${item.link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                })
                .join('')

            utils.saveAsFile(IDMFormatContent, 'ef2')
        },
        saveAsFile(content, fileExtension) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const rootName = pageApp()?.fileManager?.mainContent?.data?.name
            link.download = `${rootName || 'gofile-export'}.${fileExtension}`
            link.click()
            URL.revokeObjectURL(url)
        },
        getHrLine() {
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')
            return hrLine
        },
        /* [R3] element-built button (was getButtonTemplate's HTML string). */
        getButtonTemplate(icon, text) {
            const anchor = document.createElement('a')
            anchor.href = 'javascript:void(0)'
            anchor.className = 'hover:text-blue-500 flex items-center gap-2'
            anchor.setAttribute('aria-label', text)
            const iconEl = document.createElement('i')
            iconEl.className = icon
            anchor.append(iconEl, ' ', text)
            return anchor
        },
        createButton(options = {}) {
            const { icon, text, onClick } = options

            const button = document.createElement('li')
            button.appendChild(utils.getButtonTemplate(icon, text))

            if (onClick) {
                button.addEventListener('click', onClick)
            }

            return button
        },
        getRegularButtons(format) {
            // Header
            const formatTitleElement = document.createElement('li')
            const formatTitleSpan = document.createElement('span')
            formatTitleSpan.className = 'flex items-center gap-2 text-blue-500 font-bold'
            const formatTitleIcon = document.createElement('i')
            formatTitleIcon.className = ICONS.google_plus
            formatTitleSpan.append(formatTitleIcon, ` ${format}`)
            formatTitleElement.appendChild(formatTitleSpan)

            let exportAllText, exportSelectedText, exportAllIcon, exportSelectedIcon

            switch (format) {
                case 'ABDM':
                case 'Aria2':
                    exportAllText = utils.getTranslation('send_all')
                    exportAllIcon = ICONS.plane_s
                    exportSelectedText = utils.getTranslation('send_selected')
                    exportSelectedIcon = ICONS.plane_r
                    break
                case 'IDM':
                    exportAllText = utils.getTranslation('export_all')
                    exportAllIcon = ICONS.file_s
                    exportSelectedText = utils.getTranslation('export_selected')
                    exportSelectedIcon = ICONS.file_r
                    break
                default:
                    exportAllText = utils.getTranslation('download_all')
                    exportAllIcon = ICONS.circle_down_s
                    exportSelectedText = utils.getTranslation('download_selected')
                    exportSelectedIcon = ICONS.circle_down_r
                    break
            }

            const exportAllButton = utils.createButton({
                text: exportAllText,
                icon: exportAllIcon,
                onClick: operations.handleExport.bind(null, {
                    selectMode: false,
                    format,
                }),
            })

            const exportSelectedButton = utils.createButton({
                text: exportSelectedText,
                icon: exportSelectedIcon,
                onClick: operations.handleExport.bind(null, {
                    selectMode: true,
                    format,
                }),
            })

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getSpecialButtons(downloader) {
            const additionalButtons = []

            const settingsPanleTitle = utils.getTranslation(`${downloader.toLowerCase()}_settings`)
            const settingsButton = utils.createButton({
                icon: ICONS.gear_s,
                text: `${utils.getTranslation('config')} ${downloader}`,
                onClick: () => {
                    createPopup({
                        title: settingsPanleTitle,
                        content: utils.getConfigPanel(downloader),
                        icon: ICONS.gear_s,
                    })

                    const form = document.forms[`${GE_GORM_ID_PREFIX}_${downloader}`]

                    if (form) {
                        form.addEventListener('submit', (event) => {
                            event.preventDefault()

                            Object.entries(GE_CONFIG[downloader].settings).forEach(([settingKey, _value]) => {
                                utils.setSettings(downloader, settingKey, form.elements[_value.key].value)
                            })

                            closePopup()
                        })
                    }
                },
            })

            const abdmRecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'ABDM',
                }),
            })

            const testABDMButton = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_abdm'),
                onClick: () => {
                    utils.testABDMConnection()
                },
            })

            const aria2RecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'Aria2',
                }),
            })

            const testAria2Button = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_aria2'),
                onClick: () => {
                    utils.testAria2Connection()
                },
            })

            const rpcResetButton = utils.createButton({
                icon: ICONS.rotate_left_s,
                text: utils.getTranslation('reset_aria2'),
                onClick: () => {
                    utils.resetAllSettings('Aria2')
                },
            })

            switch (downloader) {
                case 'ABDM':
                    additionalButtons.push(abdmRecursiveDownloadButton)
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testABDMButton)
                    break
                case 'Aria2':
                    additionalButtons.push(aria2RecursiveDownloadButton)
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testAria2Button)
                    additionalButtons.push(rpcResetButton)
                    break
                default:
                    break
            }

            return additionalButtons
        },
        getButtonsByDownloader(downloader) {
            const regularButtons = utils.getRegularButtons(downloader)

            const additionalButtons = utils.getSpecialButtons(downloader)

            return [utils.getHrLine(), ...regularButtons, ...additionalButtons]
        },
        /* [R3] element-built form item (was getFormInputItemTemplate's HTML string). */
        getFormInputItem(setting) {
            const { key, i18nKey, icon, placeholderI18nKey } = setting

            const wrap = document.createElement('div')
            wrap.className = 'space-y-2'
            const label = document.createElement('label')
            label.setAttribute('for', key)
            label.className = 'block text-sm font-medium text-gray-300'
            label.textContent = ' ' + utils.getTranslation(i18nKey) + ' '
            const relative = document.createElement('div')
            relative.className = 'relative'
            const iconBox = document.createElement('div')
            iconBox.className = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'
            const iconEl = document.createElement('i')
            iconEl.className = icon + ' text-gray-400'
            iconBox.appendChild(iconEl)
            const input = document.createElement('input')
            input.type = 'text'
            input.id = key
            input.setAttribute('key', key)
            input.className = 'w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 ' +
                'focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 text-white placeholder-gray-400'
            input.value = utils.getValue(key)
            input.title = utils.getTranslation(placeholderI18nKey)
            relative.append(iconBox, input)
            wrap.append(label, relative)
            return wrap
        },
        /* [R3] element-built config panel (was an HTML string return). */
        getConfigPanel(category) {
            const config = GE_CONFIG[category]

            const wrap = document.createElement('div')
            wrap.className = 'space-y-4'
            const infoBox = document.createElement('div')
            infoBox.className = 'bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4'
            const infoRow = document.createElement('div')
            infoRow.className = 'flex items-center space-x-3'
            const infoIcon = document.createElement('i')
            infoIcon.className = 'fas fa-info-circle text-blue-400 text-xl'
            const infoText = document.createElement('p')
            infoText.className = 'text-gray-300 text-sm'
            const infoLink = document.createElement('a')
            infoLink.href = config.homepage
            infoLink.target = '_blank'
            infoLink.rel = 'noopener noreferrer'
            infoLink.textContent = ' ' + config.homepage + ' '
            infoText.appendChild(infoLink)
            infoRow.append(infoIcon, infoText)
            infoBox.appendChild(infoRow)
            const form = document.createElement('form')
            form.id = `${GE_GORM_ID_PREFIX}_${config.id}`
            form.className = 'space-y-4'
            for (const [, setting] of Object.entries(config.settings)) {
                form.appendChild(utils.getFormInputItem(setting))
            }
            const submit = document.createElement('button')
            submit.id = `GofileEnhanced_${config.id}_Submit`
            submit.type = 'submit'
            submit.className = 'w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ' +
                'ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2'
            const submitIcon = document.createElement('i')
            submitIcon.className = 'fas fa-check'
            const submitText = document.createElement('span')
            submitText.textContent = ` ${utils.getTranslation('confirm')} `
            submit.append(submitIcon, submitText)
            form.appendChild(submit)
            wrap.append(infoBox, form)
            return wrap
        },
    }

    const operations = {
        async handleExport(options) {
            const { selectMode, format, enableRecursion } = options
            const abdmDownloadFolder = utils.getSettings('ABDM', 'abdmDownloadFolder')
            const aria2RpcDir = utils.getSettings('Aria2', 'rpcDir')

            let tbdItems = []

            if (enableRecursion) {
                const { items } = await utils.collectAllItems()
                tbdItems = items
            } else {
                const pageData = pageApp()?.fileManager?.mainContent?.data
                if (!pageData) { return createNotification(utils.getTranslation('error'), utils.getTranslation('loading_please_wait'), 'warning') }
                const allFiles = pageData.children
                const selectedKeys = pageApp()?.fileManager?.contentsSelected || {}

                // all file keys or selected file keys
                const fileKeys = Object.keys(selectMode ? selectedKeys : allFiles)
                // to be downloaded keys
                const tbdKeys = fileKeys.filter((key) => allFiles[key].type === 'file')

                tbdItems = tbdKeys.map((key) => allFiles[key])
            }

            if (tbdItems.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('no_file_selected') : utils.getTranslation('empty_folder'),
                    selectMode ? utils.getTranslation('no_file_selected_description') : utils.getTranslation('empty_folder_description'),
                    'warning',
                )
            }

            switch (format) {
                case 'Direct':
                    utils.goDirectLinks(tbdItems.map((item) => item.link))
                    break
                case 'ABDM':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToABDM(tbdItems.map((item) => ({ ...item, downloadFolder: abdmDownloadFolder + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToABDM(tbdItems)
                    }
                    break
                case 'Aria2':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToAria2(tbdItems.map((item) => ({ ...item, downloadFolder: aria2RpcDir + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToAria2(tbdItems)
                    }
                    break
                case 'IDM':
                    utils.exportToIDM(tbdItems)
                    break
                default:
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('unsupported_format')}`, 'error')
                    break
            }
        },
        // add buttons to sidebar
        addContainerToSidebar() {
            // create container
            const container = document.createElement('ul')
            container.id = GE_CONTAINER_ID
            // 'border-t', 'border-gray-700', 'mt-4',
            container.classList.add('pt-4', 'space-y-4')

            // append buttons to container
            SUPPORTED_DOWNLOADERS.forEach((downloader) => {
                utils.getButtonsByDownloader(downloader).forEach((item) => {
                    container.appendChild(item)
                })
            })

            // append container to sidebar
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            utils.initSettings()

            // Observe changes in the DOM
            const observer = new MutationObserver((_mutations, _obs) => {
                // Check if the target node is available
                const container = document.getElementById(GE_CONTAINER_ID)

                // Check if the mainContent is available
                if (pageApp()?.fileManager?.mainContent?.data) {
                    // Add buttons to sidebar
                    !container && operations.addContainerToSidebar()
                    // Stop observing
                    // obs.disconnect()
                } else {
                    // remove GofileEnhanced_Container
                    container && container.remove()
                }
            })

            // Observe the target node "#index_main", which is in the DOM initially.
            const targetNode = document.getElementById('index_main')
            const config = { childList: true, subtree: true }
            if (targetNode) {
                observer.observe(targetNode, config)
            } else {
                /* [R3 boot hygiene] wrong-host diagnostic: the harness and
                 * non-gofile pages legitimately lack #index_main — a debug
                 * line, not an error (the live matrix boot gate requires a
                 * clean error channel on every host). */
                console.debug('[Gofile Enhanced] #index_main not found.')
            }
        },
    }

    // Script Entry Point
    main.init()
})()
