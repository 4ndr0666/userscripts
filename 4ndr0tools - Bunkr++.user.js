// ==UserScript==
// @name         4ndr0tools - Bunkr++
// @namespace    https://github.com/4ndr0666/userscripts
// @version      3.0.0
// @description  Electric-glass HUD, regex/size/date filter/sort, direct CDN sniff/DL, Viewer.js gallery, canonical redirect
// @author       4ndr0666
// @match        *://bunkr.*/*
// @match        *://*.bunkr.*/*
// @grant        GM_download
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.min.js
// @resource     VIEWER_CSS https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.7/viewer.min.css
// @require      https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&family=Orbitron:wght@700&display=swap
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Canonical Redirect
    const CANONICAL = 'bunkr.ws';
    if (location.hostname !== CANONICAL) {
        const pat = /^(?:[a-z0-9-]+\.)?(?:bunkr|bunker)\.[a-z0-9-]{2,}$/i;
        if (pat.test(location.hostname)) {
            const u = new URL(location.href);
            u.hostname = CANONICAL;
            location.replace(u.href);
            return;
        }
    }

    // Viewer.js CSS
    GM_addStyle(GM_getResourceText('VIEWER_CSS'));

    // Core CSS + Noise
    GM_addStyle(`
        :root { --cyan: #00E5FF; --glow: rgba(0,229,255,0.4); --font: 'Roboto Mono', monospace; }
        #psi-hud { position:fixed; bottom:20px; right:20px; width:380px; background:rgba(10,19,26,0.85); backdrop-filter:blur(12px); border:1px solid var(--cyan); border-radius:12px; padding:16px; box-shadow:0 0 25px var(--glow); font-family:var(--font); color:#EAEAEA; z-index:9999; }
        #psi-hud input,#psi-hud select,#psi-hud button { background:rgba(0,0,0,0.4); border:1px solid var(--cyan); color:#EAEAEA; padding:8px; margin:4px; border-radius:6px; }
        .hud-button:hover { background:rgba(0,229,255,0.2); box-shadow:0 0 15px var(--glow); }
        .direct-dl { position:absolute; bottom:8px; right:8px; background:var(--cyan); color:#000; padding:4px 8px; border-radius:4px; font-size:0.8em; z-index:10; cursor:pointer; }
        header,.bg-mute,.live-indicator-container,#liveCount,footer,[data-cl-spot],script[src*="ad"],iframe,.banner,[class*="ad"],[id*="ad"],.plyr__controls { display:none !important; }
    `);

    $(document).ready(() => {
        const glyph = `<svg viewBox="0 0 128 128" width="48" height="48" fill="none" stroke="var(--cyan)" stroke-width="3"><path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2"/><path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/><path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/><text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="var(--cyan)" font-size="56" font-family="Orbitron">Ψ</text></svg>`;
        const hud = $(`<div id="psi-hud">
            <div style="display:flex;align-items:center;margin-bottom:12px;font-weight:700;letter-spacing:0.05em;">${glyph}<div>Ψ-4NDR0666 BUNKR++ v3.0 FINAL</div></div>
            <input type="text" id="filter" placeholder="Regex or size (e.g. \\.mp4$ | >1GB | <500MB)">
            <select id="sort"><option value="size-desc">Size ↓</option><option value="size-asc">Size ↑</option><option value="name">Name</option><option value="date-desc">Date ↓</option><option value="date-asc">Date ↑</option></select>
            <button class="hud-button" id="apply">Apply</button>
            <button class="hud-button" id="batch">Batch Direct DL</button>
        </div>`);
        $('body').append(hud);

        // Viewer.js Gallery
        const gallery = new Viewer(document.body, { toolbar: false, navbar: false, title: false });

        const itemsSel = '.theItem,.grid-images_box,.overflow-hidden,[class*="grid"] div,[class*="item"],figure img';
        const contSel = '#related-files-grid,.grid-images,.grid,div.grid,[class*="grid"]';

        const parseSize = (txt = '') => {
            const m = txt.replace(/,/g,'').match(/(\d+(?:\.\d+)?)\s*(GB|MB|KB|KiB)/i) || ['','0','MB'];
            let v = parseFloat(m[1]);
            const u = m[2].toUpperCase();
            if (u === 'GB') v *= 1024;
            else if (u === 'KB' || u === 'KIB') v /= 1024;
            return v;
        };

        const parseDate = (txt = '') => {
            const m = txt.match(/(\d{2}):(\d{2}):(\d{2}) (\d{2})\/(\d{2})\/(\d{4})/);
            if (m) return new Date(`${m[6]}-${m[5]}-${m[4]}T${m[1]}:${m[2]}:${m[3]}`);
            return new Date(0);
        };

        const parseSizeFilter = (str) => {
            const m = str.match(/^([><])(\d+(?:\.\d+)?)(GB|MB)?$/i);
            if (m) {
                let t = parseFloat(m[2]);
                if (m[3]?.toUpperCase() === 'GB') t *= 1024;
                return {op: m[1] === '>' ? (a,b) => a > b : (a,b) => a < b, thresh: t};
            }
            return null;
        };

        const getData = (el) => ({
            el,
            name: $(el).find('.theName,p.truncate,h1,[class*="name"]').text().trim() || 'unknown',
            size: parseSize($(el).find('.theSize,p:eq(1),[class*="size"]').text().trim()),
            date: parseDate($(el).find('.theDate,[class*="date"]').text().trim()),
            fileId: $(el).find('a[href^="/f/"],a[href^="/v/"]').attr('href')?.match(/\/(f|v)\/([^\/]+)/)?.[2] || $(el).data('fileId') || ''
        });

        const directMap = new Map();
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this.addEventListener('load', () => {
                if (args[1] && typeof args[1] === 'string' && args[1].includes('media-') && args[1].includes('.bunkr.')) {
                    const fname = args[1].split('/').pop().split('?')[0];
                    directMap.set(fname, args[1].split('?')[0]);
                }
            });
            origOpen.apply(this, args);
        };

        $('#apply').on('click', () => {
            let data = $(itemsSel).map((_,el) => getData(el)).get().filter(d => d.fileId);
            const filt = $('#filter').val().trim();
            if (filt) {
                const sf = parseSizeFilter(filt);
                if (sf) data = data.filter(d => sf.op(d.size, sf.thresh));
                else data = data.filter(d => new RegExp(filt, 'i').test(d.name));
            }
            const mode = $('#sort').val();
            data.sort((a,b) => {
                if (mode === 'size-desc') return b.size - a.size;
                if (mode === 'size-asc') return a.size - b.size;
                if (mode === 'name') return a.name.localeCompare(b.name);
                if (mode === 'date-desc') return b.date - a.date;
                if (mode === 'date-asc') return a.date - b.date;
                return 0;
            });
            const cont = $(contSel)[0];
            if (cont) data.forEach(d => cont.appendChild(d.el));
        });

        const addBtns = () => {
            $(itemsSel).each((_,el) => {
                const d = getData(el);
                if (d.fileId && !$(el).find('.direct-dl').length) {
                    const btn = $('<div class="direct-dl hud-button">Direct DL</div>');
                    btn.on('click', () => {
                        const url = directMap.get(d.name) || directMap.get(d.fileId) || `https://get.bunkrr.su/file/${d.fileId}`;
                        GM_download({url, name: d.name});
                    });
                    $(el).css('position','relative').append(btn);
                }
            });
        };

        $('#batch').on('click', () => {
            $(itemsSel).each((_,el) => {
                const d = getData(el);
                if (d.fileId) {
                    const url = directMap.get(d.name) || directMap.get(d.fileId) || `https://get.bunkrr.su/file/${d.fileId}`;
                    GM_download({url, name: d.name, saveAs: false});
                }
            });
        });

        new MutationObserver(addBtns).observe(document.body, {childList:true, subtree:true});
        addBtns();
    });
})();
