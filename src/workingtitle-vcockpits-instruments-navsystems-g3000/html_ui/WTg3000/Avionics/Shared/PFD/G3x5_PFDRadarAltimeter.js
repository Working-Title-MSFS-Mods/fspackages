class WT_G3x5_PFDRadarAltimeter extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3x5_PFDRadarAltimeterHTMLElement} htmlElement
     * @type {WT_G3x5_PFDRadarAltimeterHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createModel() {
        let radarAltitude = new WT_G3x5_RadarAltitude(this.instrument.airplane, [
            {
                maxAltitude: WT_Unit.FOOT.createNumber(200),
                precision: WT_Unit.FOOT.createNumber(5)
            },
            {
                maxAltitude: WT_Unit.FOOT.createNumber(1500),
                precision: WT_Unit.FOOT.createNumber(10)
            },
            {
                maxAltitude: WT_Unit.FOOT.createNumber(Infinity),
                precision: WT_Unit.FOOT.createNumber(50)
            }
        ]);
        return new WT_G3x5_PFDRadarAltimeterModel(this.instrument.airplane, radarAltitude, new WT_G3x5_Minimums());
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_PFDRadarAltimeterHTMLElement();
        htmlElement.setContext({
            model: this._model,
            displayMaximum: WT_Unit.FOOT.createNumber(2500),
        });
        return htmlElement;
    }

    init(root) {
        let container = root.querySelector(`#InstrumentsContainer`);
        this._model = this._createModel();
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
    }
}

class WT_G3x5_PFDRadarAltimeterModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_RadarAltitude} radarAltitude
     * @param {WT_G3x5_Minimums} minimums
     */
    constructor(airplane, radarAltitude, minimums) {
        this._airplane = airplane;
        this._radarAltitude = radarAltitude;
        this._minimums = minimums;

        this._altitude = WT_Unit.FOOT.createNumber(0);
        this._radarMinimumsAltitude = WT_Unit.FOOT.createNumber(0);
        this._alertState = WT_G3x5_PFDRadarAltimeterModel.AlertState.NONE;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} altitude
     * @type {WT_NumberUnitReadOnly}
     */
    get altitude() {
        return this._altitude.readonly();
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDRadioAltimeterModel.AlertState} alertState
     * @type {WT_G3x5_PFDRadarAltimeterModel.AlertState}
     */
    get alertState() {
        return this._alertState;
    }

    _selectPrecision(altitude) {
        let entry = this._precisions.find(entry => altitude.compare(entry.maxAltitude) <= 0);
        return entry ? entry.precision : null;
    }

    _updateAltitude() {
        this._radarAltitude.altitude(this._altitude);
    }

    _updateRadarMinimums() {
        if (this._minimums.getMode() === WT_G3x5_Minimums.Mode.RADAR) {
            this._minimums.getAltitude(this._radarMinimumsAltitude);
        } else {
            this._radarMinimumsAltitude.set(NaN);
        }
    }

    _updateAlertState() {
        this._updateRadarMinimums();
        if (!isNaN(this._radarMinimumsAltitude.number) && this._radarMinimumsAltitude.compare(this.altitude) >= 0) {
            this._alertState = WT_G3x5_PFDRadarAltimeterModel.AlertState.BELOW_MINIMUMS;
        } else {
            this._alertState = WT_G3x5_PFDRadarAltimeterModel.AlertState.NONE;
        }
    }

    update() {
        this._updateAltitude();
        this._updateAlertState();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDRadarAltimeterModel.AlertState = {
    NONE: 0,
    BELOW_MINIMUMS: 1
};

class WT_G3x5_PFDRadarAltimeterHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_PFDRadarAltimeterContext}
         */
        this._context = null;
        this._isInit = false;
        this._isVisible = false;
    }

    _getTemplate() {
        return WT_G3x5_PFDRadarAltimeterHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._alt = new WT_CachedElement(this.shadowRoot.querySelector(`#alt`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {WT_G3x5_PFDRadarAltimeterContext} context
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
        this._setVisibility(this._context.model.altitude.compare(this._context.displayMaximum) <= 0);
    }

    _setAltitudeDisplay(altitude) {
        this._alt.textContent = altitude.asUnit(WT_Unit.FOOT).toFixed(0);
    }

    _updateAltitude() {
        this._setAltitudeDisplay(this._context.model.altitude);
    }

    _setAlert(state) {
        this._wrapper.setAttribute("alert", WT_G3x5_PFDRadarAltimeterHTMLElement.ALERT_ATTRIBUTES[state]);
    }

    _updateAlert() {
        this._setAlert(this._context.model.alertState);
    }

    _updateDisplay() {
        this._updateVisibility();
        this._updateAltitude();
        this._updateAlert();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G3x5_PFDRadarAltimeterHTMLElement.ALERT_ATTRIBUTES = [
    "none",
    "belowminimums"
];
WT_G3x5_PFDRadarAltimeterHTMLElement.NAME = "wt-pfd-radaraltimeter";
WT_G3x5_PFDRadarAltimeterHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_PFDRadarAltimeterHTMLElement.TEMPLATE.innerHTML = `
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
            left: var(--radaraltimeter-margin-left, 0.1em);
            top: var(--radaraltimeter-margin-top, 0.1em);
            width: calc(100% - var(--radaraltimeter-margin-left, 0.1em) - var(--radaraltimeter-margin-right, 0.1em));
            height: calc(100% - var(--radaraltimeter-margin-top, 0.1em) - var(--radaraltimeter-margin-bottom, 0.1em));
            display: flex;
            flex-flow: row nowrap;
            justify-content: space-between;
            align-items: baseline;
        }
            #title {
                text-align: left;
                font-size: var(--radaraltimeter-title-font-size, 0.75em);
                color: white;
            }
            #alt {
                text-align: right;
                color: white;
            }
            #wrapper[alert="belowminimums"] #alt {
                color: var(--wt-g3x5-amber);
            }
    </style>
    <div id="wrapper">
        <div id="title">RA</div>
        <div id="alt"></div>
    </div>
`;

customElements.define(WT_G3x5_PFDRadarAltimeterHTMLElement.NAME, WT_G3x5_PFDRadarAltimeterHTMLElement);

/**
 * @typedef WT_G3x5_PFDRadarAltimeterContext
 * @property {WT_G3x5_PFDRadarAltimeterModel} model
 * @property {WT_NumberUnit} displayMaximum
 */