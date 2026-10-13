/* ═══════════════════════════════════════════════════════════════════════════
 * kernel/brand.js — 4ndr0666tools canonical brand constants
 * ----------------------------------------------------------------------------
 * Single source of truth for the Ψ glyph, the 3lectric-Glass palette, and
 * suite-wide identity. Every dist script inlines this at build time; editing
 * it here re-brands the entire suite in one commit.
 *
 * Sources of truth:
 *   - Glyph:      glm/resources/4ndr0666_glyph.txt (Ψ hexagon + dashed rings)
 *   - Palette:    glm/resources/3lectric_6lass-spec.md §2.1 (GTK3 paradigm,
 *                 translated verbatim to web CSS custom properties)
 *   - Typography: 3lectric_6lass-spec.md §3.0
 * ═══════════════════════════════════════════════════════════════════════ */

Ψ.brand = (() => {
    'use strict';

    const SUITE = '4ndr0666tools';
    const KERNEL_VERSION = '1.0.0';

    /* Ψ branding glyph — inline SVG element factory + data-URI for @icon. */
    const GLYPH_SVG =
        '<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="none" ' +
        'stroke="#00E5FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M 64,12 A 52,52 0 1 1 63.9,12 Z" stroke-dasharray="21.78 21.78" stroke-width="2"/>' +
        '<path d="M 64,20 A 44,44 0 1 1 63.9,20 Z" stroke-dasharray="10 10" stroke-width="1.5" opacity="0.7"/>' +
        '<path d="M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z"/>' +
        '<text x="64" y="67" text-anchor="middle" dominant-baseline="middle" fill="#00E5FF" ' +
        'stroke="none" font-size="56" font-weight="700" font-family="Cinzel Decorative, serif">Ψ</text>' +
        '</svg>';

    /** Minimal URI-encoded glyph for userscript @icon headers. */
    const GLYPH_ICON_URI =
        'data:image/svg+xml,' + encodeURIComponent(GLYPH_SVG).replace(/%20/g, '%20');

    /** Glyph as a live SVG Element, built purely through createElementNS.
     *
     * v1.4.2 (TT hardening): DOMParser.parseFromString is a Trusted Types
     * sink under `require-trusted-types-for 'script'` enforcement — even
     * for 'image/svg+xml' (field-proven twice: YTPM v1.4.0's 54 uncaught
     * TypeErrors on YouTube, and HostWarp/PageCraft settings consoles
     * dying at glyphEl() on TT hosts — kernel glass.js used to parse this
     * very constant). createElementNS is intercepted by no policy, so the
     * glyph is TT-immune BY CONSTRUCTION, with no policy exemption needed
     * from any host page's CSP.
     *
     * SYNC LOCK — the geometry below mirrors GLYPH_SVG above 1:1. Any edit
     * to one must be mirrored in the other (GLYPH_SVG remains the source
     * for the build-time @icon data-URI; glyphNode is the runtime source).
     *
     * @param {Document} [doc] owner document (defaults to the current one)
     * @returns {SVGElement} clonable, stylable root <svg> */
    function glyphNode(docRef) {
        const d = docRef || document;
        const NS = 'http://www.w3.org/2000/svg';
        const attr = (node, attrs) => { for (const k of Object.keys(attrs)) node.setAttribute(k, attrs[k]); };
        const svg = d.createElementNS(NS, 'svg');
        attr(svg, {
            viewBox: '0 0 128 128', fill: 'none',
            stroke: PALETTE.accentPrimary, 'stroke-width': '3',
            'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        });
        const ringOuter = d.createElementNS(NS, 'path');
        attr(ringOuter, {
            d: 'M 64,12 A 52,52 0 1 1 63.9,12 Z',
            'stroke-dasharray': '21.78 21.78', 'stroke-width': '2',
        });
        const ringInner = d.createElementNS(NS, 'path');
        attr(ringInner, {
            d: 'M 64,20 A 44,44 0 1 1 63.9,20 Z',
            'stroke-dasharray': '10 10', 'stroke-width': '1.5', opacity: '0.7',
        });
        const hex = d.createElementNS(NS, 'path');
        attr(hex, { d: 'M64 30 L91.3 47 L91.3 81 L64 98 L36.7 81 L36.7 47 Z' });
        const psi = d.createElementNS(NS, 'text');
        attr(psi, {
            x: '64', y: '67', 'text-anchor': 'middle', 'dominant-baseline': 'middle',
            fill: PALETTE.accentPrimary, stroke: 'none', 'font-size': '56',
            'font-weight': '700', 'font-family': 'Cinzel Decorative, serif',
        });
        psi.textContent = 'Ψ';
        svg.append(ringOuter, ringInner, hex, psi);
        return svg;
    }

    /* 3lectric-Glass colorimetry matrix — 3lectric_6lass-spec.md §2.1.
     * Names mirror the spec's functional roles so audits map 1:1. */
    const PALETTE = Object.freeze({
        matrixDeepBase: 'rgba(10, 19, 26, 1.0)',
        glassL1Window: 'rgba(10, 19, 26, 0.72)',
        glassL2MenuPopup: 'rgba(10, 19, 26, 0.65)',
        glassL3PanelInput: 'rgba(10, 19, 26, 0.55)',
        solidHeader: 'rgba(10, 19, 26, 0.95)',
        accentPrimary: '#00E5FF',     // Electric Cyan
        accentSecondary: '#67E8F9',   // hover / highlights
        destructive: '#ff0055',       // Neon Pink/Red
        absoluteLight: '#ffffff',
        accentSoftBorder: 'rgba(0, 229, 255, 0.2)',
        accentMidBorder: 'rgba(0, 229, 255, 0.3)',
        accentStrongBorder: 'rgba(0, 229, 255, 0.4)',
        accentWash: 'rgba(0, 229, 255, 0.2)',
        accentWashDeep: 'rgba(0, 229, 255, 0.3)',
        glowAura: 'rgba(0, 229, 255, 0.15)',
        glowMid: 'rgba(0, 229, 255, 0.5)',
        switchTrough: '#050A0F',
        scrollbarVoid: 'rgba(0, 0, 0, 0.4)',
        textDim: 'rgba(0, 229, 255, 0.7)',
    });

    /* Typography schematics — spec §3.0. */
    const FONTS = Object.freeze({
        system: '"JetBrains Mono", "Cascadia Mono", ui-monospace, monospace',
        display: '"Orbitron", "JetBrains Mono", sans-serif',
    });

    /* Global transition contract — spec §2.2. */
    const TRANSITION = 'all 150ms ease-in-out';

    /* CSS custom properties derived from the palette. Injected once per
     * document by Ψ.glass.inject() and consumed by every glass surface. */
    const cssVars = () =>
        `:root{` +
        `--a4-base-0:${PALETTE.matrixDeepBase};` +
        `--a4-glass-1:${PALETTE.glassL1Window};` +
        `--a4-glass-2:${PALETTE.glassL2MenuPopup};` +
        `--a4-glass-3:${PALETTE.glassL3PanelInput};` +
        `--a4-header:${PALETTE.solidHeader};` +
        `--a4-cyan:${PALETTE.accentPrimary};` +
        `--a4-cyan-2:${PALETTE.accentSecondary};` +
        `--a4-destructive:${PALETTE.destructive};` +
        `--a4-light:${PALETTE.absoluteLight};` +
        `--a4-brd-soft:${PALETTE.accentSoftBorder};` +
        `--a4-brd-mid:${PALETTE.accentMidBorder};` +
        `--a4-brd-strong:${PALETTE.accentStrongBorder};` +
        `--a4-wash:${PALETTE.accentWash};` +
        `--a4-wash-deep:${PALETTE.accentWashDeep};` +
        `--a4-glow-aura:${PALETTE.glowAura};` +
        `--a4-glow-mid:${PALETTE.glowMid};` +
        `--a4-text-dim:${PALETTE.textDim};` +
        `--a4-font:${FONTS.system};` +
        `--a4-font-display:${FONTS.display};` +
        `--a4-transition:${TRANSITION};` +
        `}`;

    return Object.freeze({ SUITE, KERNEL_VERSION, GLYPH_SVG, GLYPH_ICON_URI, glyphNode, PALETTE, FONTS, TRANSITION, cssVars });
})();
