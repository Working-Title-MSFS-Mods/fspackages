/**
 * A label which displays the nominal map range.
 */
class WT_MapViewRangeDisplay extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initFormatter();

        this._range = WT_Unit.NMILE.createNumber(0);
        this._auto = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_MapViewRangeDisplay.TEMPLATE;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: ["rangeNumber"],
                _unitClassList: ["rangeUnit"],

                getNumberClassList(numberUnit, forceUnit) {
                    return this._numberClassList;
                },
                getUnitClassList(numberUnit, forceUnit) {
                    return this._unitClassList;
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _defineChildren() {
        this._autoElement = this.shadowRoot.querySelector(`#auto`);
        this._rangeElement = new WT_CachedElement(this.shadowRoot.querySelector(`#range`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _updateAuto(state) {
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
    _updateRange(state) {
        let distanceUnit = state.model.units.distance;

        let displayUnit = this._selectDisplayUnit(this._range, distanceUnit);
        this._rangeElement.innerHTML = this._formatter.getFormattedHTML(this._range, displayUnit);
    }

    /**
     *
     * @param {WT_NumberUnit} range
     */
    setRange(range) {
        this._range.set(range);
    }

    setAuto(value) {
        this._auto = value;
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (!this._isInit) {
            return;
        }

        this._updateAuto(state);
        this._updateRange(state);
    }
}
WT_MapViewRangeDisplay.NAME = "map-view-rangedisplay";
WT_MapViewRangeDisplay.TEMPLATE = document.createElement("template");
WT_MapViewRangeDisplay.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
            text-align: center;
        }
            div {
                margin: 0 0.2em;
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

customElements.define(WT_MapViewRangeDisplay.NAME, WT_MapViewRangeDisplay);