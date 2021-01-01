class WT_TSCBearingArrow extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_TSCBearingArrow.TEMPLATE.content.cloneNode(true));

        this._bearing = 0;
    }

    /**
     * @readonly
     * @property {Number} bearing
     * @type {Number}
     */
    get bearing() {
        return this._bearing;
    }

    _defineChildren() {
        this._arrow = this.shadowRoot.querySelector(`#arrow`);
    }

    connectedCallback() {
        this._defineChildren();
    }

    setBearing(bearing) {
        if (bearing === this._bearing) {
            return;
        }

        this._arrow.setAttribute("transform", `rotate(${bearing} 25 25)`);
        this._bearing = bearing;
    }
}
WT_TSCBearingArrow.TEMPLATE = document.createElement("template");
WT_TSCBearingArrow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        svg {
            display: block;
            width: 100%;
            height: 100%;
        }
            #arrow {
                fill: var(--arrow-color, #009cc0);
            }
    </style>
    <svg xmlns="${Avionics.SVG.NS}" viewBox="0 0 50 50">
    <path id="arrow" d="M25 2.5 L15 15 L22 15 L22 47.5 L28 47.5 L28 15 L35 15 Z"></path>
    </svg>
`;

customElements.define("tsc-bearingarrow", WT_TSCBearingArrow);