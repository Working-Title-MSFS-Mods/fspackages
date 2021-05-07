class WT_G3x5_PFDMinimums extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @type {WT_AirplaneAltimeter}
     */
    get altimeter() {
        return this._altimeter;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDBottomInfoHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createModel() {
        return new WT_G3x5_PFDMinimumsModel(this.instrument, new WT_G3x5_Minimums(), this.instrument.referenceAltimeter);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_PFDMinimumsHTMLElement();
        htmlElement.setContext({
            model: this._model
        });
        return htmlElement;
    }

    init(root) {
        this._model = this._createModel();

        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDMinimumsModel {
    /**
     * @param {WT_G3x5_PFD} instrument
     * @param {WT_G3x5_Minimums} minimums
     * @param {WT_AirplaneAltimeter} altimeter
     */
    constructor(instrument, minimums, altimeter) {
        this._instrument = instrument;
        this._minimums = minimums;
        this._altimeter = altimeter;

        this._mode = WT_G3x5_Minimums.Mode.NONE;
        this._altitude = WT_Unit.FOOT.createNumber(0);
        this._state = WT_G3x5_PFDMinimumsModel.State.UNKNOWN;

        this._tempFoot = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFD}
     */
    get instrument() {
        return this._instrument;
    }

    /**
     * @readonly
     * @type {WT_G3x5_Minimums.Mode}
     */
    get mode() {
        return this._mode;
    }

    /**
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDMinimumsModel.State}
     */
    get state() {
        return this._state;
    }

    _updateMode() {
        this._mode = this._minimums.getMode();
    }

    _updateAltitude() {
        this._minimums.getAltitude(this._altitude);
    }

    _updateState() {
        if (this.instrument.airplane.sensors.isOnGround()) {
            this._state = WT_G3x5_PFDMinimumsModel.State.UNKNOWN;
            return;
        }

        let currentAlt = this._tempFoot;
        switch (this.mode) {
            case WT_G3x5_Minimums.Mode.BARO:
                this._altimeter.altitudeIndicated(currentAlt);
                break;
            case WT_G3x5_Minimums.Mode.RADAR:
                this.instrument.airplane.sensors.radarAltitude(currentAlt);
                break;
            default:
                this._state = WT_G3x5_PFDMinimumsModel.State.UNKNOWN;
                return;
        }

        let delta = currentAlt.asUnit(WT_Unit.FOOT) - this.altitude.asUnit(WT_Unit.FOOT);
        if (delta > 100) {
            this._state = WT_G3x5_PFDMinimumsModel.State.ABOVE;
        } else if (delta > 0) {
            this._state = WT_G3x5_PFDMinimumsModel.State.WITHIN_100_FT;
        } else {
            this._state = WT_G3x5_PFDMinimumsModel.State.BELOW;
        }
    }

    update() {
        this._updateMode();
        this._updateAltitude();
        this._updateState();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDMinimumsModel.State = {
    UNKNOWN: 0,
    ABOVE: 1,
    WITHIN_100_FT: 2,
    BELOW: 3
};

class WT_G3x5_PFDMinimumsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_PFDMinimumsModel}}
         */
        this._context = null;
        this._isInit = false;
        this._isVisible = false;

        this._lastState = WT_G3x5_PFDMinimumsModel.State.UNKNOWN;
    }

    _getTemplate() {
        return WT_G3x5_PFDMinimumsHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._mode = new WT_CachedElement(this.shadowRoot.querySelector(`#mode`));
        this._alt = new WT_CachedElement(this.shadowRoot.querySelector(`#alt .number`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDMinimumsModel}} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
    }

    _setVisibility(value) {
        if (value === this._isVisible) {
            return;
        }

        this.setAttribute("show", `${value}`);
        this._isVisible = value;
    }

    _updateVisibility() {
        this._setVisibility(this._context.model.mode !== WT_G3x5_Minimums.Mode.NONE);
    }

    _updateMode() {
        this._mode.textContent = WT_G3x5_PFDMinimumsHTMLElement.MODE_TEXTS[this._context.model.mode];
    }

    _setAltitudeDisplay(altitude) {
        this._alt.textContent = altitude.asUnit(WT_Unit.FOOT).toFixed(0);
    }

    _updateAltitude() {
        this._setAltitudeDisplay(this._context.model.altitude);
    }

    _setState(state) {
        this._wrapper.setAttribute("state", WT_G3x5_PFDMinimumsHTMLElement.STATE_ATTRIBUTES[state]);
    }

    _updateState() {
        let state = this._context.model.state;
        this._setState(state);
        if (state !== this._lastState) {
            if (state === WT_G3x5_PFDMinimumsModel.State.BELOW && (this._lastState === WT_G3x5_PFDMinimumsModel.State.WITHIN_100_FT || this._lastState === WT_G3x5_PFDMinimumsModel.State.ABOVE)) {
                this._context.model.instrument.playInstrumentSound("aural_minimums");
            }
            this._lastState = state;
        }
    }

    _updateDisplay() {
        this._updateVisibility();
        this._updateMode();
        this._updateAltitude();
        this._updateState();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDMinimumsHTMLElement.MODE_TEXTS = [
    "NONE",
    "BARO",
    "COMP",
    "RA"
];
WT_G3x5_PFDMinimumsHTMLElement.STATE_ATTRIBUTES = [
    "unknown",
    "above",
    "100",
    "below"
];
WT_G3x5_PFDMinimumsHTMLElement.NAME = "wt-pfd-minimums";
WT_G3x5_PFDMinimumsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDMinimumsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: none;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        :host([show="true"]) {
            display: block;
        }

        #wrapper {
            position: absolute;
            left: var(--minimums-margin-left, 0.1em);
            top: var(--minimums-margin-top, 0.1em);
            width: calc(100% - var(--minimums-margin-left, 0.1em) - var(--minimums-margin-right, 0.1em));
            height: calc(100% - var(--minimums-margin-top, 0.1em) - var(--minimums-margin-bottom, 0.1em));
        }
            #title {
                position: absolute;
                left: 0%;
                top: 0%;
                width: var(--minimums-mode-width, 30%);
                height: 100%;
                text-align: left;
                color: white;
                display: flex;
                flex-flow: column nowrap;
                justify-content: center;
                align-items: flex-start;
            }
                #mode {
                    height: 1em;
                    font-size: var(--minimums-mode-font-size, 0.65em);
                }
                #min {
                    height: 1em;
                    font-size: var(--minimums-min-font-size, 0.85em);
                }
            #alt {
                position: absolute;
                right: 0%;
                top: 50%;
                width: calc(100% - var(--minimums-mode-width, 30%));
                transform: translateY(-50%);
                text-align: right;
            }
            #wrapper[state="above"] #alt {
                color: var(--wt-g3x5-lightblue);
            }
            #wrapper[state="100"] #alt {
                color: white;
            }
            #wrapper[state="below"] #alt {
                color: var(--wt-g3x5-amber);
            }
                .unit {
                    font-size: var(--minimums-unit-font-size, 0.75em);
                }
    </style>
    <div id="wrapper">
        <div id="title">
            <div id="mode"></div>
            <div id="min">MIN</div>
        </div>
        <div id="alt">
            <span class="number"></span><span class="unit">FT</span>
        </div>
    </div>
`;

customElements.define(WT_G3x5_PFDMinimumsHTMLElement.NAME, WT_G3x5_PFDMinimumsHTMLElement);