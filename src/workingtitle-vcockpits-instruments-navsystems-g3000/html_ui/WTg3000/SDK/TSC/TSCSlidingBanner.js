/**
 * A banner that can slide into and out of view.
 */
class WT_TSCSlidingBanner extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isVisible = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_TSCSlidingBanner.TEMPLATE;
    }

    /**
     * Whether this banner is visible.
     * @readonly
     * @type {Boolean}
     */
    get isVisible() {
        return this._isVisible;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    _initState() {
        if (this.isVisible) {
            this._wrapper.setAttribute("state", "popin");
        }
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._initState();
    }

    /**
     * Slides this banner into view. This banner turns visible, then slides into its final position. If this banner is
     * already visible, calling this method has no effect.
     * @param {WT_TSCSlidingBanner.Direction} direction - the direction from which the banner should slide in.
     */
    slideIn(direction) {
        if (this._isVisible) {
            return;
        }

        this._isVisible = true;
        if (this._isInit) {
            this._wrapper.setAttribute("state", `slidein-${direction}`);
        }
    }

    /**
     * Slides this banner out of view. At the end of the sliding animation, this banner is hidden from view. If this
     * banner is not visible, calling this method has no effect.
     * @param {WT_TSCSlidingBanner.Direction} direction - the direction toward which the banner should slide out.
     */
    slideOut(direction) {
        if (!this._isVisible) {
            return;
        }

        this._isVisible = false;
        if (this._isInit) {
            this._wrapper.setAttribute("state", `slideout-${direction}`);
        }
    }

    /**
     * Immediately brings this banner into view without an animation.
     */
    popIn() {
        this._isVisible = true;
        if (this._isInit) {
            this._wrapper.setAttribute("state", "popin");
        }
    }

    /**
     * Immediately hides this banner from view without an animation.
     */
    popOut() {
        this._isVisible = false;
        if (this._isInit) {
            this._wrapper.setAttribute("state", "popout");
        }
    }
}
/**
 * @enum {String}
 */
WT_TSCSlidingBanner.Direction = {
    LEFT: "left",
    TOP: "top",
    RIGHT: "right",
    BOTTOM: "bottom"
};
WT_TSCSlidingBanner.NAME = "wt-tsc-slidingbanner";
WT_TSCSlidingBanner.TEMPLATE = document.createElement("template");
WT_TSCSlidingBanner.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        @keyframes slidein-left {
            0% {
                visibility: hidden;
                right: 100%;
            }
            0.1% {
                visibility: visible;
                right: 100%;
            }
            100% {
                visibility: visible;
                right: 0%;
            }
        }
        @keyframes slidein-top {
            0% {
                visibility: hidden;
                bottom: 100%;
            }
            0.1% {
                visibility: visible;
                bottom: 100%;
            }
            100% {
                visibility: visible;
                bottom: 0%;
            }
        }
        @keyframes slidein-right {
            0% {
                visibility: hidden;
                left: 100%;
            }
            0.1% {
                visibility: visible;
                left: 100%;
            }
            100% {
                visibility: visible;
                left: 0%;
            }
        }
        @keyframes slidein-bottom {
            0% {
                visibility: hidden;
                top: 100%;
            }
            0.1% {
                visibility: visible;
                top: 100%;
            }
            100% {
                visibility: visible;
                top: 0%;
            }
        }

        @keyframes slideout-left {
            100% {
                visibility: hidden;
                right: 100%;
            }
            99.9% {
                visibility: visible;
                right: 100%;
            }
            0% {
                visibility: visible;
                right: 0%;
            }
        }
        @keyframes slideout-top {
            100% {
                visibility: hidden;
                bottom: 100%;
            }
            99.9% {
                visibility: visible;
                bottom: 100%;
            }
            0% {
                visibility: visible;
                bottom: 0%;
            }
        }
        @keyframes slideout-right {
            100% {
                visibility: hidden;
                left: 100%;
            }
            99.9% {
                visibility: visible;
                left: 100%;
            }
            0% {
                visibility: visible;
                left: 0%;
            }
        }
        @keyframes slideout-bottom {
            100% {
                visibility: hidden;
                top: 100%;
            }
            99.9% {
                visibility: visible;
                top: 100%;
            }
            0% {
                visibility: visible;
                top: 0%;
            }
        }

        #wrapper {
            position: absolute;
            left: 0%;
            top: 0%;
            width: 100%;
            height: 100%;
            visibility: hidden;
        }
        #wrapper[state="popin"] {
            visibility: visible;
        }
        #wrapper[state="slidein-${WT_TSCSlidingBanner.Direction.LEFT}"] {
            animation: slidein-left var(--slidingbanner-slidein-duration, 1s) var(--slidingbanner-slidein-timing, ease) forwards;
        }
        #wrapper[state="slidein-${WT_TSCSlidingBanner.Direction.TOP}"] {
            animation: slidein-top var(--slidingbanner-slidein-duration, 1s) var(--slidingbanner-slidein-timing, ease) forwards;
        }
        #wrapper[state="slidein-${WT_TSCSlidingBanner.Direction.RIGHT}"] {
            animation: slidein-right var(--slidingbanner-slidein-duration, 1s) var(--slidingbanner-slidein-timing, ease) forwards;
        }
        #wrapper[state="slidein-${WT_TSCSlidingBanner.Direction.BOTTOM}"] {
            animation: slidein-bottom var(--slidingbanner-slidein-duration, 1s) var(--slidingbanner-slidein-timing, ease) forwards;
        }
        #wrapper[state="slideout-${WT_TSCSlidingBanner.Direction.LEFT}"] {
            animation: slideout-left var(--slidingbanner-slideout-duration, 1s) var(--slidingbanner-slideout-timing, ease) forwards;
        }
        #wrapper[state="slideout-${WT_TSCSlidingBanner.Direction.TOP}"] {
            animation: slideout-top var(--slidingbanner-slideout-duration, 1s) var(--slidingbanner-slideout-timing, ease) forwards;
        }
        #wrapper[state="slideout-${WT_TSCSlidingBanner.Direction.RIGHT}"] {
            animation: slideout-right var(--slidingbanner-slideout-duration, 1s) var(--slidingbanner-slideout-timing, ease) forwards;
        }
        #wrapper[state="slideout-${WT_TSCSlidingBanner.Direction.BOTTOM}"] {
            animation: slideout-bottom var(--slidingbanner-slideout-duration, 1s) var(--slidingbanner-slideout-timing, ease) forwards;
        }
            #content {
                position: absolute;
                left: var(--slidingbanner-padding-left, 0.25em);
                top: var(--slidingbanner-padding-top, 0.25em);
                width: calc(100% - var(--slidingbanner-padding-left, 0.25em) - var(--slidingbanner-padding-right, 0.25em));
                height: calc(100% - var(--slidingbanner-padding-top, 0.25em) - var(--slidingbanner-padding-bottom, 0.25em));
            }
    </style>
    <div id="wrapper">
        <slot name="content" id="content"></slot>
    </div>
`;

customElements.define(WT_TSCSlidingBanner.NAME, WT_TSCSlidingBanner);