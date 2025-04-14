// ==UserScript==
// @name        YouTube Video Zoomer
// @version     0.20
// @description Allows you to zoom in on videos.
// @author      Callum Latham
// @namespace   https://greasyfork.org/users/696211-ctl2
// @license     MIT
// @match       http*://www.youtube.com/*
// @match       http*://*.youtube.com/*
// @match       http*://*.youtube.*/*
// @match       http*://*.youtube.com/embed/*
// @match       http*://youtube.com/embed/*
// @require     https://update.greasyfork.org/scripts/446506/1424453/%24Config.js
// @grant       GM.setValue
// @grant       GM.getValue
// @grant       GM.deleteValue
// @downloadURL https://update.greasyfork.org/scripts/484376/YouTube%20Video%20Zoomer.user.js
// @updateURL https://update.greasyfork.org/scripts/484376/YouTube%20Video%20Zoomer.meta.js
// ==/UserScript==

// Don't run in frames (e.g. stream chat frame)
if (window.parent !== window) {
    // noinspection JSAnnotator
    return;
}

const TITLE = 'YouTube Video Zoomer';

const $config = new $Config(
    'YTVZ_TREE',
    {
        'children': [
            {
                'label': 'Speeds',
                'children': (() => {
                    const predicate = (value) => value > 0 ? true : 'Speed must be greater than zero';

                    return [
                        {
                            'label': 'Ctrl Scroll',
                            'value': 30,
                            predicate,
                        },
                        {
                            'label': 'Ctrl+Shift Scroll',
                            'value': 30,
                            predicate,
                        },
                    ];
                })(),
            },
            {
                'label': 'Direction Inversions',
                'children': [
                    {
                        'label': 'Ctrl Scroll',
                        'value': false,
                    },
                    {
                        'label': 'Ctrl+Shift Scroll',
                        'value': false,
                    },
                    {
                        'label': 'Ctrl Drag',
                        'value': false,
                    },
                    {
                        'label': 'Ctrl+Shift Drag',
                        'value': false,
                    },
                    {
                        'label': 'Ctrl+Shift Click',
                        'value': false,
                    },
                ],
            },
            {
                'label': 'Click Movement Allowance (pixels)',
                'value': 2,
                'predicate': (value) => value >= 0 ? true : 'Allowance must be greater than or equal to zero',
            },
            {
                'label': 'Modifier Key',
                'value': 'alt',
                'options': ['alt', 'shift', 'meta'],
            },
        ],
    },
    ([{'children': speeds}, {'children': inversions}, clickMovementAllowance, modifierKey]) => ({
        'scrollZoomSpeed': speeds[0].value / 10000,
        'scrollPanSpeed': speeds[1].value / 10000,
        'scrollZoomMultiplier': inversions[0].value ? 1 : -1,
        'scrollPanMultiplier': inversions[1].value ? -1 : 1,
        'dragPanMultiplier': inversions[2].value ? -1 : 1,
        'globalDragPanMultiplier': inversions[3].value ? -1 : 1,
        'globalClickPanMultiplier': inversions[4].value ? -1 : 1,
        'clickMovementAllowance': clickMovementAllowance.value,
        'isAlt': `${modifierKey.value}Key`
    }),
    TITLE,
    {
        headBase: '#c80000',
        headButtonExit: '#000000',
        borderHead: '#ffffff',
        nodeBase: ['#222222', '#111111'],
        borderTooltip: '#c80000',
    },
    {'zIndex': 10000},
);

let video;
let zoom = 1;
const midPoint = {
    'horizontal': 0,
    'vertical': 0,
};

const reset = () => {
    zoom = 1;
    midPoint.horizontal = 0;
    midPoint.vertical = 0;

    video.style.removeProperty('scale');
    video.style.removeProperty('translate');
};

const applyZoom = () => {
    video.style.setProperty('scale', `${zoom}`);
};

const applyMidPoint = () => {
    const padding = 0.5 / zoom;

    // Keep the viewport inside the video's edges
    midPoint.horizontal = Math.max(-0.5 + padding, Math.min(0.5 - padding, midPoint.horizontal));
    midPoint.vertical = Math.max(-0.5 + padding, Math.min(0.5 - padding, midPoint.vertical));

    video.style.setProperty('translate', `${-midPoint.horizontal * 100 * zoom}% ${-midPoint.vertical * 100 * zoom}%`)
};

const instaPan = (event, multiplier) => {
    midPoint.horizontal = (((event.offsetX / video.clientWidth) - 0.5) - midPoint.horizontal) * zoom * multiplier;
    midPoint.vertical = (((event.offsetY / video.clientHeight) - 0.5) - midPoint.vertical) * zoom * multiplier;

    applyMidPoint();
};

const getDragListener = (priorEvent) => {
    const config = $config.get();

    return (event) => {
        if (event[config.isAlt]) {
            const {globalDragPanMultiplier} = config;

            instaPan(event, globalDragPanMultiplier);

            return;
        }

        const {dragPanMultiplier} = config;

        midPoint.horizontal -= (event.clientX - priorEvent.clientX) / (video.clientWidth * zoom) * dragPanMultiplier;
        midPoint.vertical -= (event.clientY - priorEvent.clientY) / (video.clientHeight * zoom) * dragPanMultiplier;

        applyMidPoint();

        priorEvent = event;
    };
};

const clickListener = (event) => {
    const config = $config.get();

    if (event[config.isAlt]) {
        const {globalClickPanMultiplier} = config;

        instaPan(event, globalClickPanMultiplier);

        return;
    }

    midPoint.horizontal = (event.offsetX / video.clientWidth) - 0.5;
    midPoint.vertical = (event.offsetY / video.clientHeight) - 0.5;

    const padding = 0.5 - Math.max(Math.abs(midPoint.horizontal), Math.abs(midPoint.vertical));

    zoom = 0.5 / padding;

    applyMidPoint();

    applyZoom();
};

const onScroll = (event) => {
    if (!event.ctrlKey) {
        return;
    }

    const config = $config.get();

    event.preventDefault();

    if (event[config.isAlt]) {
        const {scrollPanSpeed, scrollPanMultiplier} = config;
        const speed = (scrollPanSpeed / zoom) * scrollPanMultiplier;

        midPoint.horizontal += event.deltaX * speed;
        midPoint.vertical += event.deltaY * speed;
    } else {
        if (event.deltaY === 0) {
            return;
        }

        const {scrollZoomSpeed, scrollZoomMultiplier} = config;
        const zoomIncrement = event.deltaY * scrollZoomSpeed * scrollZoomMultiplier;

        // Ensure video isn't smaller than its frame
        zoom = Math.max(1, zoom + zoomIncrement);

        applyZoom();
    }

    applyMidPoint();
};

const onMouseDown = (event) => {
    if (!event.ctrlKey || event.buttons !== 1) {
        return;
    }

    event.preventDefault();
    // Prevents triggering the fast-forward feature
    event.stopPropagation();

    video.setPointerCapture(event.pointerId);

    const dragListener = getDragListener(event);

    const clickDisallowListener = ({clientX, clientY}) => {
        const totalMovement = Math.abs(event.clientX - clientX) + Math.abs(event.clientY - clientY);
        const {clickMovementAllowance} = $config.get();

        if (totalMovement >= clickMovementAllowance || totalMovement <= -clickMovementAllowance) {
            video.removeEventListener('pointermove', clickDisallowListener);
            // Avoid registering a target mid-point selection if panning is registered
            video.removeEventListener('pointerup', clickListener);
        }
    };

    const ctrlReleaseListener = ({key}) => {
        if (key === 'Control') {
            video.removeEventListener('pointerup', stop);

            stop();
        }
    };

    const stop = () => {
        video.removeEventListener('pointermove', clickDisallowListener);
        video.removeEventListener('pointermove', dragListener);
        video.parentElement.parentElement.removeEventListener('keyup', ctrlReleaseListener);

        video.releasePointerCapture(event.pointerId);
    };

    video.addEventListener('pointermove', dragListener);

    // Video doesn't fire keyup events
    video.parentElement.parentElement.addEventListener('keyup', ctrlReleaseListener);
    video.addEventListener('pointerup', stop, {'once': true});

    video.addEventListener('pointermove', clickDisallowListener);
    video.addEventListener('pointerup', clickListener, {'once': true});
};

const onRightClick = (event) => {
    if (!event.ctrlKey) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const {isAlt} = $config.get();

    if (event[isAlt]) {
        $config.edit();
    } else {
        reset();
    }
};

// Reset if a new video is loaded
document.body.addEventListener('yt-navigate-finish', async () => {
    if (video) {
        reset();

        video.removeEventListener('pointerdown', onMouseDown);
        video.removeEventListener('contextmenu', onRightClick, true);
        video.removeEventListener('wheel', onScroll);
    }

    video = document.querySelector('video.video-stream.html5-main-video');

    if (video) {
        try {
            await $config.ready();
        } catch (error) {
            console.error(error);

            if (!$config.reset) {
                throw error;
            }

            await $config.reset();

            console.warn(`[${TITLE}] Your config was reset.`);
        }

        video.addEventListener('pointerdown', onMouseDown);
        // useCapture=true to stopImmediatePropagation on this event before YouTube sees it
        video.addEventListener('contextmenu', onRightClick, true);
        video.addEventListener('wheel', onScroll);
    }
});