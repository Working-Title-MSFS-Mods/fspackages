class WT_TSCScrollList extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_TSCScrollList.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @type {WT_TSCScrollManager}
     */
    get scrollManager() {
        return this._scrollManager;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    _initScrollManager() {
        this._scrollManager = new WT_TSCScrollManager(this._wrapper);
    }

    connectedCallback() {
        this._defineChildren();
        this._initScrollManager();
    }
}
WT_TSCScrollList.NAME = "wt-tsc-scrolllist";
WT_TSCScrollList.TEMPLATE = document.createElement("template");
WT_TSCScrollList.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            overflow-y: scroll;
        }
            #wrapper::-webkit-scrollbar {
                width: var(--scrolllist-scrollbar-width, 1vw);
            }
            #wrapper::-webkit-scrollbar-track {
                background: none;
            }
            #wrapper::-webkit-scrollbar-thumb {
                background: var(--scrolllist-scrollbar-thumb-background, white);
            }

            #content {
                position: absolute;
                left: var(--scrolllist-padding-left, 2%);
                width: calc(100% - var(--scrolllist-padding-left, 2%) - var(--scrolllist-padding-right, 2%));
                padding-top: var(--scrolllist-padding-top, 2%);
                padding-bottom: var(--scrolllist-padding-bottom, 2%);
                display: flex;
                flex-flow: column nowrap;
                align-items: var(--scrolllist-align-items, center);
            }

    </style>
    <div id="wrapper">
        <slot name="content" id="content"></slot>
    </div>
`;

customElements.define(WT_TSCScrollList.NAME, WT_TSCScrollList);