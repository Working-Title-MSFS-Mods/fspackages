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
                    color: white;
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
    }

    connectedCallback() {
        this._autoElement = this.shadowRoot.querySelector(`#auto`);
        this._rangeElement = new WT_CachedElement(this.shadowRoot.querySelector(`#range`));
    }

    _updateAutoElement(state) {
    }

    _selectDisplayUnit(range, distanceUnit) {
        if (distanceUnit.equals(WT_Unit.NMILE) || distanceUnit.equals(WT_Unit.FOOT)) {
            return range.asUnit(WT_Unit.FOOT) <= 1001 ? WT_Unit.FOOT : WT_Unit.NMILE;
        } else if (distanceUnit.equals(WT_Unit.KILOMETER) || distanceUnit.equals(WT_Unit.METER)) {
            return range.asUnit(WT_Unit.METER) <= 501 ? WT_Unit.METER : WT_Unit.KILOMETER;
        } else {
            return distanceUnit;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _updateRangeElement(state) {
        let range = state.model.range;
        let distanceUnit = state.model.units.distance;

        let displayUnit = this._selectDisplayUnit(range, distanceUnit);
        this._rangeElement.innerHTML = this._formatter.getFormattedHTML(range, displayUnit);
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    update(state) {
        this._updateAutoElement(state);
        this._updateRangeElement(state);
    }
}

customElements.define("map-view-rangedisplay", WT_MapViewRangeDisplay);