/**
 * A label which displays the nominal map range.
 */
class WT_MapViewRangeDisplay extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: black;
                    border: solid 1px white;
                    border-radius: 3px;
                    text-align: center;
                    font-size: 2.5vh;
                    line-height: 2vh;
                    color: #67e8ef;
                }
                    div {
                        margin: 0 0.5vh;
                    }
                    #auto {
                        display: none;
                    }
                    .rangeUnit {
                        font-size: 0.75em;
                    }
            </style>
            <div id="auto">Auto</div>
            <div id="range"></div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        let formatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["rangeNumber"];
                },
                getUnitClassList() {
                    return ["rangeUnit"];
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);

        this._lastRange = new WT_NumberUnit(0, WT_Unit.NMILE);
    }

    connectedCallback() {
        this._autoElement = this.shadowRoot.querySelector(`#auto`);
        this._rangeElement = this.shadowRoot.querySelector(`#range`);
    }

    _updateAutoElement(state) {
    }

    _updateRangeElement(state) {
        let range = state.model.range;

        if (range.compare(this._lastRange) == 0) {
            return;
        }

        let unit;
        if (range.asUnit(WT_Unit.FOOT) <= 1001) {
            unit = WT_Unit.FOOT;
        } else {
            unit = WT_Unit.NMILE;
        }

        this._rangeElement.innerHTML = this._formatter.getFormattedHTML(range, unit);
        this._lastRange.set(range);
    }

    update(state) {
        this._updateAutoElement(state);
        this._updateRangeElement(state);
    }
}

customElements.define("map-view-rangedisplay", WT_MapViewRangeDisplay);